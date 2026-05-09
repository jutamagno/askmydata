import asyncio

import pandas as pd

from backend.modules.query.llm import pandas_answer, History


def _get_df_info(filepath: str) -> str:
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

    return "\n".join(sections)


async def get_df_info(filepath: str) -> str:
    """Async wrapper — runs CSV parsing off the event loop."""
    return await asyncio.to_thread(_get_df_info, filepath)


async def run_pandas_agent(question: str, filepath: str, history: History | None = None) -> str:
    df_info = await get_df_info(filepath)
    return await asyncio.to_thread(pandas_answer, question, df_info, history)
