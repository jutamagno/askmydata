from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base
import uuid

class Project(Base):
    __tablename__ = "projects"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name       = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    csv_files  = relationship("CsvFile", back_populates="project", cascade="all, delete-orphan")
    messages   = relationship("Message", back_populates="project", cascade="all, delete-orphan")


class CsvFile(Base):
    __tablename__ = "csv_files"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id  = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    filename    = Column(String, nullable=False)
    path        = Column(String, nullable=False)
    row_count   = Column(Integer, nullable=True)
    schema_json = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="csv_files")
