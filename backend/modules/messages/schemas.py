from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class MessageOut(BaseModel):
    id:         UUID
    role:       str
    content:    str
    engine:     Optional[str]
    query:      Optional[str]
    chart_data: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    role:       str
    content:    str
    engine:     Optional[str] = None
    query:      Optional[str] = None
    chart_data: Optional[str] = None
