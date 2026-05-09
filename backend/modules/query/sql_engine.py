import duckdb

def run_sql(sql: str) -> list[dict]:
    con = duckdb.connect()
    result = con.execute(sql).fetchdf()
    return result.to_dict(orient="records")
