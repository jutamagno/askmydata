from abc import ABC, abstractmethod
from typing import Iterator


class LLMProvider(ABC):
    @abstractmethod
    def chat(self, messages: list[dict], max_tokens: int) -> str: ...

    @abstractmethod
    def stream_chat(self, messages: list[dict], max_tokens: int) -> Iterator[str]: ...
