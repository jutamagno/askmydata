from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class QueryRequest(BaseModel):
    question:    str
    project_id:  UUID
    csv_file_id: UUID

class QueryResponse(BaseModel):
    answer:  str
    query:   Optional[str] = None
    engine:  str
    success: bool
    data:    Optional[list[dict]] = None
