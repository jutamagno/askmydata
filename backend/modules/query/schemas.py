from pydantic import BaseModel, model_validator
from uuid import UUID
from typing import Optional

class QueryRequest(BaseModel):
    question:     str
    project_id:   UUID
    csv_file_id:  Optional[UUID] = None   # single-file (legacy)
    csv_file_ids: Optional[list[UUID]] = None  # multi-file

    @model_validator(mode="after")
    def resolve_ids(self):
        if not self.csv_file_id and not self.csv_file_ids:
            raise ValueError("Provide csv_file_id or csv_file_ids")
        if self.csv_file_id and not self.csv_file_ids:
            self.csv_file_ids = [self.csv_file_id]
        elif self.csv_file_ids and not self.csv_file_id:
            self.csv_file_id = self.csv_file_ids[0]
        return self

class QueryResponse(BaseModel):
    answer:      str
    query:       Optional[str] = None
    engine:      str
    success:     bool
    data:        Optional[list[dict]] = None
    duration_ms: Optional[int] = None
