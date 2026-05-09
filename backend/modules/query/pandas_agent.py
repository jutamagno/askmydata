import pandas as pd
from backend.modules.query.llm import pandas_answer

async def run_pandas_agent(question: str, filepath: str) -> str:
    df = pd.read_csv(filepath)
    df_info = f"""Dtypes:\n{df.dtypes.to_string()}

Statistical summary:\n{df.describe().to_string()}

First 5 rows:\n{df.head().to_string()}"""

    return pandas_answer(question, df_info)
