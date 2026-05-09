"""SSE streaming variant of handle_query, plus background-task variant."""
import json
import time
from uuid import UUID

from sqlalchemy.orm import Session

from backend.logger import get_logger
from backend.modules.messages.schemas import MessageCreate
from backend.modules.messages.service import save_message
from backend.modules.query import llm, sql_engine, pandas_agent
from backend.modules.query.service import get_csv_files, build_history

log = get_logger(__name__)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _step(label: str) -> str:
    return _sse({"type": "step", "label": label})


async def handle_query_stream(
    db: Session,
    project_id: UUID,
    csv_file_ids: list[UUID],
    question: str,
):
    """Async generator that yields SSE data strings."""
    yield _step("Analisando os dados...")

    csvs = get_csv_files(db, csv_file_ids, project_id)
    csv = csvs[0]
    schema = csv.schema_json

    history = build_history(db, project_id)
    save_message(db, project_id, MessageCreate(role="user", content=question))

    start = time.monotonic()
    sql = None
    data = None

    # ── SQL path ──────────────────────────────────────────────────────────────
    try:
        yield _step("Gerando SQL...")
        if len(csvs) > 1:
            sql = llm.generate_sql_multi(
                question=question,
                csv_files=[
                    {"schema": c.schema_json, "filepath": c.path, "filename": c.filename, "row_count": c.row_count}
                    for c in csvs
                ],
            )
        else:
            sql = llm.generate_sql(
                question=question, schema=schema,
                filepath=csv.path, filename=csv.filename, row_count=csv.row_count,
            )

        yield _step("Executando consulta...")
        data = sql_engine.run_sql(sql)
        engine_name = "sql"

    except Exception as sql_err:
        log.warning("stream.sql_failed", error=str(sql_err))

        # ── Pandas fallback path (streaming) ──────────────────────────────────
        try:
            yield _step("Analisando com Pandas...")
            df_info = await pandas_agent.get_df_info(csv.path)

            chart_data = None
            try:
                chart_sql = llm.generate_chart_sql(
                    question=question, schema=schema,
                    filepath=csv.path, filename=csv.filename, row_count=csv.row_count,
                )
                chart_data = sql_engine.run_sql(chart_sql)
            except Exception:
                pass

            yield _step("Formulando resposta...")
            full_answer = ""
            for token in llm.stream_pandas_answer(question, df_info, history=history):
                full_answer += token
                yield _sse({"type": "token", "content": token})

            duration_ms = round((time.monotonic() - start) * 1000)
            log.info("stream.completed", engine="pandas", duration_ms=duration_ms)

            save_message(db, project_id, MessageCreate(
                role="assistant", content=full_answer, engine="pandas",
                chart_data=chart_data,
            ))
            yield _sse({"type": "done", "engine": "pandas", "query": None, "data": chart_data, "duration_ms": duration_ms})
            return

        except Exception as pandas_err:
            err_duration_ms = round((time.monotonic() - start) * 1000)
            log.error("stream.failed", error=str(pandas_err), duration_ms=err_duration_ms)
            error_msg = (
                "Não consegui encontrar uma resposta para essa pergunta com os dados disponíveis. "
                "Tente reformular ou seja mais específico."
            )
            yield _sse({"type": "token", "content": error_msg})
            yield _sse({"type": "done", "engine": "error", "query": None, "data": None, "duration_ms": err_duration_ms})
            return

    # ── Stream the format_answer LLM call ─────────────────────────────────────
    yield _step("Formulando resposta...")
    full_answer = ""
    try:
        for token in llm.stream_format_answer(question, data, history=history):
            full_answer += token
            yield _sse({"type": "token", "content": token})
    except Exception as stream_err:
        llm_err_ms = round((time.monotonic() - start) * 1000)
        log.error("stream.llm_error", error=str(stream_err))
        if not full_answer:
            yield _sse({"type": "token", "content": "Erro ao gerar resposta."})
            yield _sse({"type": "done", "engine": "error", "query": sql, "data": None, "duration_ms": llm_err_ms})
            return

    duration_ms = round((time.monotonic() - start) * 1000)
    log.info("stream.completed", engine=engine_name, duration_ms=duration_ms)

    save_message(db, project_id, MessageCreate(
        role="assistant", content=full_answer, engine=engine_name,
        query=sql, chart_data=data,
    ))
    yield _sse({"type": "done", "engine": engine_name, "query": sql, "data": data, "duration_ms": duration_ms})


async def handle_query_bg(
    task_id: str,
    db: Session,
    project_id: UUID,
    csv_file_ids: list[UUID],
    question: str,
    registry,
):
    """Background variant: pushes every SSE event to the TaskBuffer instead of yielding."""
    buf = registry.get(task_id)
    if buf is None:
        return

    async for event in handle_query_stream(db, project_id, csv_file_ids, question):
        buf.push(event)

    buf.mark_done()
    log.info("bg_task.done", task_id=task_id)
