from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Any, Optional

class CsvFileOut(BaseModel):
    id:           UUID
    filename:     str
    row_count:    Optional[int]
    profile_json: Optional[Any] = None
    created_at:   datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str

class ProjectOut(BaseModel):
    id:         UUID
    name:       str
    created_at: datetime
    updated_at: datetime
    csv_files:  list[CsvFileOut] = []

    class Config:
        from_attributes = True

class ProjectSummary(BaseModel):
    id:         UUID
    name:       str
    updated_at: datetime
    csv_count:  int

    class Config:
        from_attributes = True
