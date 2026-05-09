from openai import OpenAI
import anthropic
from backend.config import get_settings

settings = get_settings()


def _chat(prompt: str, max_tokens: int = 500) -> str:
    if settings.anthropic_api_key:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()

    client = OpenAI(base_url=settings.ollama_base_url, api_key="ollama")
    resp = client.chat.completions.create(
        model=settings.ollama_model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content.strip()


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


def format_answer(question: str, result: list[dict]) -> str:
    return _chat(f"""Answer this question in natural language based on the data:

Question: {question}
Data: {result}

Be concise and direct. If it's a number, highlight it clearly.
If the data has multiple rows, summarize the key insights.""")


def pandas_answer(question: str, df_info: str) -> str:
    return _chat(f"""You are a data analyst. Based on this dataframe summary:

{df_info}

Answer this question as accurately as possible: "{question}"
Reason step by step using the statistics provided.""", max_tokens=800)
