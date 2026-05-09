import json
from uuid import UUID
from sqlalchemy.orm import Session

from backend.modules.messages.schemas import MessageCreate
from backend.modules.messages.service import save_message
from backend.modules.projects.models import CsvFile
from backend.modules.query import llm, sql_engine, pandas_agent
from backend.modules.query.schemas import QueryResponse
from fastapi import HTTPException


def get_csv_file(db: Session, csv_file_id: UUID, project_id: UUID) -> CsvFile:
    csv = (
        db.query(CsvFile)
        .filter(CsvFile.id == csv_file_id, CsvFile.project_id == project_id)
        .first()
    )
    if not csv:
        raise HTTPException(status_code=404, detail="CSV file not found")
    return csv


async def handle_query(
    db: Session,
    project_id: UUID,
    csv_file_id: UUID,
    question: str,
) -> QueryResponse:
    csv = get_csv_file(db, csv_file_id, project_id)
    schema = json.loads(csv.schema_json)

    save_message(db, project_id, MessageCreate(role="user", content=question))

    try:
        sql = llm.generate_sql(
            question=question,
            schema=schema,
            filepath=csv.path,
            filename=csv.filename,
            row_count=csv.row_count,
        )
        data = sql_engine.run_sql(sql)
        answer = llm.format_answer(question, data)

        save_message(db, project_id, MessageCreate(
            role="assistant",
            content=answer,
            engine="sql",
            query=sql,
        ))

        return QueryResponse(answer=answer, query=sql, engine="sql", success=True, data=data)

    except Exception:
        try:
            answer = await pandas_agent.run_pandas_agent(question, csv.path)
            save_message(db, project_id, MessageCreate(
                role="assistant", content=answer, engine="pandas"
            ))
            return QueryResponse(answer=answer, engine="pandas", success=True)

        except Exception as e:
            return QueryResponse(
                answer=f"Could not answer: {str(e)}",
                engine="error",
                success=False,
            )
