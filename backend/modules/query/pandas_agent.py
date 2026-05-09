import pandas as pd
from backend.modules.query.llm import pandas_answer, History

ChartData = list[dict] | None


async def run_pandas_agent(
    question: str, filepath: str, history: History | None = None
) -> tuple[str, ChartData]:
    df = pd.read_csv(filepath)

    cat_cols = df.select_dtypes(include="object").columns.tolist()
    num_cols = df.select_dtypes(include="number").columns.tolist()

    sections = [
        f"Shape: {df.shape[0]} rows x {df.shape[1]} columns",
        f"Columns: {list(df.columns)}",
        f"Sample (5 rows):\n{df.head().to_string(index=False)}",
    ]

    for cat in cat_cols:
        if df[cat].nunique() <= 20 and num_cols:
            grouped = (
                df.groupby(cat)[num_cols]
                .sum()
                .sort_values(num_cols[0], ascending=False)
            )
            sections.append(f"\nSum by {cat}:\n{grouped.to_string()}")

    for cat in cat_cols:
        if df[cat].nunique() <= 20:
            counts = df[cat].value_counts()
            sections.append(f"\nCount by {cat}:\n{counts.to_string()}")

    if num_cols:
        sections.append(f"\nNumeric totals:\n{df[num_cols].sum().to_string()}")

    answer = pandas_answer(question, "\n".join(sections), history=history)
    chart_data = _build_chart_data(df, question, cat_cols, num_cols)

    return answer, chart_data


def _build_chart_data(
    df: pd.DataFrame,
    question: str,
    cat_cols: list[str],
    num_cols: list[str],
) -> ChartData:
    if not cat_cols or not num_cols:
        return None

    # Prefer the categorical column mentioned in the question
    question_lower = question.lower()
    relevant_cat = next(
        (c for c in cat_cols if c.lower() in question_lower and df[c].nunique() <= 20),
        next((c for c in cat_cols if df[c].nunique() <= 20), None),
    )
    if not relevant_cat:
        return None

    grouped = (
        df.groupby(relevant_cat)[num_cols]
        .sum()
        .sort_values(num_cols[0], ascending=False)
        .reset_index()
    )
    return grouped.to_dict(orient="records")
