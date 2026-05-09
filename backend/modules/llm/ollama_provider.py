from typing import Iterator
from openai import OpenAI
from .base import LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str, model: str):
        self._client = OpenAI(base_url=base_url, api_key="ollama")
        self._model = model

    def chat(self, messages: list[dict], max_tokens: int) -> str:
        resp = self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=messages,
        )
        return resp.choices[0].message.content.strip()

    def stream_chat(self, messages: list[dict], max_tokens: int) -> Iterator[str]:
        stream = self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
