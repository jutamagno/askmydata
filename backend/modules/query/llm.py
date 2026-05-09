from backend.modules.llm import get_provider

History = list[dict[str, str]]  # [{"role": "user"|"assistant", "content": "..."}]


def _chat(prompt: str, max_tokens: int = 500, history: History | None = None) -> str:
    messages = list(history or []) + [{"role": "user", "content": prompt}]
    return get_provider().chat(messages, max_tokens)


def build_schema_context(schema: dict, filename: str, row_count: int) -> str:
    cols = "\n".join(
        f"- {c['name']} ({c['type']}): ex: {c['sample_values']}"
        for c in schema["columns"]
    )
    return f"Arquivo: {filename}\nTotal de linhas: {row_count}\nColunas:\n{cols}"


def generate_sql(question: str, schema: dict, filepath: str, filename: str, row_count: int) -> str:
    context = build_schema_context(schema, filename, row_count)
    return _chat(f"""You are a SQL expert. Given this CSV schema:

{context}

Generate a DuckDB SQL query to answer: "{question}"

Rules:
- Use read_csv_auto('{filepath}') as the table source
- Return ONLY the SQL query, no explanation
- Use standard SQL compatible with DuckDB""")


def generate_sql_multi(
    question: str,
    csv_files: list[dict],  # [{"schema": {...}, "filepath": "...", "filename": "...", "row_count": N}]
) -> str:
    contexts = "\n\n".join(
        f"Table {i + 1} — alias t{i + 1}:\n{build_schema_context(f['schema'], f['filename'], f['row_count'])}\n  Source: read_csv_auto('{f['filepath']}')"
        for i, f in enumerate(csv_files)
    )
    aliases = ", ".join(
        f"read_csv_auto('{f['filepath']}') AS t{i + 1}"
        for i, f in enumerate(csv_files)
    )
    return _chat(f"""You are a SQL expert. You have {len(csv_files)} CSV tables:

{contexts}

Generate a DuckDB SQL query to answer: "{question}"

Rules:
- Use these table sources: FROM {aliases}
- JOIN tables on matching column names when needed
- Return ONLY the SQL query, no explanation
- Use standard SQL compatible with DuckDB""")


def generate_chart_sql(question: str, schema: dict, filepath: str, filename: str, row_count: int) -> str:
    context = build_schema_context(schema, filename, row_count)
    return _chat(f"""You are a SQL expert. Given this CSV schema:

{context}

Generate a DuckDB SQL query to produce visualization data for: "{question}"

Rules:
- Use read_csv_auto('{filepath}') as the table source
- Apply any filters the question implies (e.g. if asking about "cancelled", add WHERE status = 'cancelada')
- Group by 1 or 2 relevant categorical columns
- Include COUNT(*) or SUM of the most relevant numeric column
- Sort by the main metric DESC
- LIMIT 10
- Return ONLY the SQL query, no explanation""")


_ANALYST_RULES = """Rules:
- Start directly with the answer — never say "the answer is" or "a resposta é"
- If listing multiple items, format them as: Item 1: value, Item 2: value (comma-separated inline, or one per line with a dash if more than 4 items)
- Bold key numbers or names using **value**
- Add one brief insight if relevant, but keep the total response to 2-4 sentences
- Never explain your reasoning process"""


def _format_answer_messages(
    question: str, result: list[dict], history: History | None
) -> list[dict]:
    prompt = f"""You are a friendly data analyst assistant. Respond in the same language as the question (Portuguese or English).

{_ANALYST_RULES}

Question: {question}
Data: {result}"""
    return list(history or []) + [{"role": "user", "content": prompt}]


def format_answer(question: str, result: list[dict], history: History | None = None) -> str:
    return get_provider().chat(_format_answer_messages(question, result, history), max_tokens=500)


def stream_format_answer(question: str, result: list[dict], history: History | None = None):
    return get_provider().stream_chat(_format_answer_messages(question, result, history), max_tokens=500)


def _pandas_answer_messages(
    question: str, df_info: str, history: History | None
) -> list[dict]:
    prompt = f"""You are a friendly data analyst assistant. Respond in the same language as the question (Portuguese or English).

{_ANALYST_RULES}

Data summary:
{df_info}

Question: {question}"""
    return list(history or []) + [{"role": "user", "content": prompt}]


def pandas_answer(question: str, df_info: str, history: History | None = None) -> str:
    return get_provider().chat(_pandas_answer_messages(question, df_info, history), max_tokens=800)


def stream_pandas_answer(question: str, df_info: str, history: History | None = None):
    return get_provider().stream_chat(_pandas_answer_messages(question, df_info, history), max_tokens=800)
