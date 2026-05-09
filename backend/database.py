import uuid as _uuid_module

import sqlalchemy
from sqlalchemy import JSON, String, create_engine
from sqlalchemy.dialects.postgresql import JSONB as _PG_JSONB
from sqlalchemy.dialects.postgresql import UUID as _PG_UUID
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from backend.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class JSONB(sqlalchemy.types.TypeDecorator):
    """Uses JSONB on PostgreSQL, plain JSON on other databases (e.g. SQLite for tests)."""
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(_PG_JSONB())
        return dialect.type_descriptor(JSON())


class UUID(sqlalchemy.types.TypeDecorator):
    """Uses native UUID on PostgreSQL, String(36) on other databases."""
    impl = String
    cache_ok = True

    def __init__(self, as_uuid: bool = True, **kw):
        self.as_uuid = as_uuid
        super().__init__(**kw)

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(_PG_UUID(as_uuid=self.as_uuid))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name != "postgresql":
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if self.as_uuid and not isinstance(value, _uuid_module.UUID):
            return _uuid_module.UUID(str(value))
        return value


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
