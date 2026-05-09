import time
from uuid import UUID
from sqlalchemy.orm import Session

from backend.logger import get_logger
from backend.modules.messages.schemas import MessageCreate
from backend.modules.messages.service import save_message, list_messages
from backend.modules.projects.models import CsvFile
from backend.modules.query import llm, sql_engine, pandas_agent
from backend.modules.query.schemas import QueryResponse
from fastapi import HTTPException

log = get_logger(__name__)

HISTORY_LIMIT = 10  # last N messages sent as context to the LLM


def get_csv_files(db: Session, csv_file_ids: list[UUID], project_id: UUID) -> list[CsvFile]:
    files = (
        db.query(CsvFile)
        .filter(CsvFile.id.in_(csv_file_ids), CsvFile.project_id == project_id)
        .all()
    )
    if not files:
        raise HTTPException(status_code=404, detail="CSV file not found")
    return files


def build_history(db: Session, project_id: UUID) -> llm.History:
    messages = list_messages(db, project_id)
    recent = messages[-HISTORY_LIMIT:] if len(messages) > HISTORY_LIMIT else messages
    return [{"role": m.role, "content": m.content} for m in recent]


async def handle_query(
    db: Session,
    project_id: UUID,
    csv_file_ids: list[UUID],
    question: str,
) -> QueryResponse:
    csvs = get_csv_files(db, csv_file_ids, project_id)
    primary = csvs[0]

    history = build_history(db, project_id)
    save_message(db, project_id, MessageCreate(role="user", content=question))

    start = time.monotonic()

    try:
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
                question=question,
                schema=primary.schema_json,
                filepath=primary.path,
                filename=primary.filename,
                row_count=primary.row_count,
            )

        data = sql_engine.run_sql(sql)
        answer = llm.format_answer(question, data, history=history)

        duration_ms = round((time.monotonic() - start) * 1000)
        log.info("query.completed", engine="sql", project_id=str(project_id), duration_ms=duration_ms)

        save_message(db, project_id, MessageCreate(
            role="assistant",
            content=answer,
            engine="sql",
            query=sql,
            chart_data=data if data else None,
        ))

        return QueryResponse(answer=answer, query=sql, engine="sql", success=True, data=data, duration_ms=duration_ms)

    except Exception as sql_err:
        log.warning("query.sql_failed", error=str(sql_err), project_id=str(project_id))
        try:
            answer = await pandas_agent.run_pandas_agent(question, primary.path, history=history)

            chart_data = None
            try:
                chart_sql = llm.generate_chart_sql(
                    question=question,
                    schema=primary.schema_json,
                    filepath=primary.path,
                    filename=primary.filename,
                    row_count=primary.row_count,
                )
                chart_data = sql_engine.run_sql(chart_sql)
            except Exception:
                pass

            duration_ms = round((time.monotonic() - start) * 1000)
            log.info("query.completed", engine="pandas", project_id=str(project_id), duration_ms=duration_ms)

            save_message(db, project_id, MessageCreate(
                role="assistant", content=answer, engine="pandas",
                chart_data=chart_data if chart_data else None,
            ))
            return QueryResponse(answer=answer, engine="pandas", success=True, data=chart_data, duration_ms=duration_ms)

        except Exception as pandas_err:
            duration_ms = round((time.monotonic() - start) * 1000)
            log.error("query.failed", error=str(pandas_err), project_id=str(project_id), duration_ms=duration_ms)
            return QueryResponse(
                answer="Não consegui encontrar uma resposta para essa pergunta com os dados disponíveis. Tente reformular ou seja mais específico — por exemplo, mencione o nome da coluna ou o período que deseja analisar.",
                engine="error",
                success=False,
            )
