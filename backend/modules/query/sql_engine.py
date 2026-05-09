import re
import duckdb
from fastapi import HTTPException

# Only SELECT queries are permitted
_FORBIDDEN = re.compile(
    r"\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|PRAGMA|ATTACH|DETACH|COPY|EXPORT)\b",
    re.IGNORECASE,
)
_SQL_COMMENT = re.compile(r"(--[^\n]*|/\*.*?\*/)", re.DOTALL)


def _sanitize(sql: str) -> str:
    sql = _SQL_COMMENT.sub("", sql).strip()
    if _FORBIDDEN.search(sql):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    normalized = sql.lstrip()
    if not normalized.upper().startswith("SELECT") and not normalized.upper().startswith("WITH"):
        raise HTTPException(status_code=400, detail="Query must start with SELECT or WITH")
    return sql


def run_sql(sql: str) -> list[dict]:
    clean = _sanitize(sql)
    con = duckdb.connect()
    result = con.execute(clean).fetchdf()
    return result.to_dict(orient="records")
