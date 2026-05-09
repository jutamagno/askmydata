from functools import lru_cache
from backend.config import get_settings
from .base import LLMProvider
from .anthropic_provider import AnthropicProvider
from .ollama_provider import OllamaProvider


@lru_cache(maxsize=1)
def get_provider() -> LLMProvider:
    settings = get_settings()
    # anthropic_api_key present always wins; otherwise use llm_provider setting
    if settings.anthropic_api_key or settings.llm_provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("llm_provider='anthropic' requires ANTHROPIC_API_KEY to be set")
        return AnthropicProvider(api_key=settings.anthropic_api_key)
    return OllamaProvider(base_url=settings.ollama_base_url, model=settings.ollama_model)
