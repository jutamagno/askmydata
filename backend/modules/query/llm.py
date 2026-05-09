from openai import OpenAI
import anthropic
from backend.config import get_settings

settings = get_settings()

History = list[dict[str, str]]  # [{"role": "user"|"assistant", "content": "..."}]


def _chat(prompt: str, max_tokens: int = 500, history: History | None = None) -> str:
    messages = list(history or []) + [{"role": "user", "content": prompt}]

    if settings.anthropic_api_key:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=max_tokens,
            messages=messages,
        )
        return msg.content[0].text.strip()

    client = OpenAI(base_url=settings.ollama_base_url, api_key="ollama")
    resp = client.chat.completions.create(
        model=settings.ollama_model,
        max_tokens=max_tokens,
        messages=messages,
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


def format_answer(question: str, result: list[dict], history: History | None = None) -> str:
    return _chat(
        f"""You are a friendly data analyst assistant. Respond in the same language as the question (Portuguese or English).

Rules:
- Start directly with the answer — never say "the answer is" or "a resposta é"
- If listing multiple items, format them as: Item 1: value, Item 2: value (comma-separated inline, or one per line with a dash if more than 4 items)
- Bold key numbers or names using **value**
- Add one brief insight if relevant, but keep the total response to 2-4 sentences
- Never explain your reasoning process

Question: {question}
Data: {result}""",
        history=history,
    )


def pandas_answer(question: str, df_info: str, history: History | None = None) -> str:
    return _chat(
        f"""You are a friendly data analyst assistant. Respond in the same language as the question (Portuguese or English).

Rules:
- Start directly with the answer — never say "the answer is" or "a resposta é"
- If listing multiple items, format them as: Item 1: value, Item 2: value (comma-separated inline, or one per line with a dash if more than 4 items)
- Bold key numbers or names using **value**
- Add one brief insight if relevant, but keep the total response to 2-4 sentences
- Never explain your reasoning process

Data summary:
{df_info}

Question: {question}""",
        max_tokens=800,
        history=history,
    )
