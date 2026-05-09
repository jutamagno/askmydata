"""Tests for LLM abstraction layer."""
from unittest.mock import MagicMock, patch
from backend.modules.llm.factory import get_provider
from backend.modules.llm.ollama_provider import OllamaProvider
from backend.modules.llm.anthropic_provider import AnthropicProvider
from backend.modules.query import llm


def _mock_provider(response: str = "SELECT 1"):
    provider = MagicMock()
    provider.chat.return_value = response
    provider.stream_chat.return_value = iter([response])
    return provider


def test_generate_sql_calls_provider():
    schema = {"columns": [{"name": "id", "type": "int64", "sample_values": [1, 2]}]}
    with patch("backend.modules.query.llm.get_provider", return_value=_mock_provider("SELECT id FROM t")):
        result = llm.generate_sql("show ids", schema, "/tmp/f.csv", "f.csv", 100)
    assert "SELECT" in result


def test_format_answer_calls_provider():
    with patch("backend.modules.query.llm.get_provider", return_value=_mock_provider("The answer is 42")):
        result = llm.format_answer("What is the answer?", [{"value": 42}])
    assert "42" in result


def test_pandas_answer_calls_provider():
    with patch("backend.modules.query.llm.get_provider", return_value=_mock_provider("Total: 42")):
        result = llm.pandas_answer("Total?", "sum=42")
    assert "42" in result


def test_factory_returns_ollama_by_default():
    get_provider.cache_clear()
    with patch("backend.config.get_settings") as mock_settings:
        mock_settings.return_value.anthropic_api_key = ""
        mock_settings.return_value.llm_provider = "ollama"
        mock_settings.return_value.ollama_base_url = "http://localhost:11434/v1"
        mock_settings.return_value.ollama_model = "codellama"
        provider = get_provider()
    assert isinstance(provider, OllamaProvider)
    get_provider.cache_clear()


def test_factory_returns_anthropic_when_key_set():
    get_provider.cache_clear()
    with patch("backend.config.get_settings") as mock_settings:
        mock_settings.return_value.anthropic_api_key = "sk-ant-test"
        mock_settings.return_value.llm_provider = "ollama"
        provider = get_provider()
    assert isinstance(provider, AnthropicProvider)
    get_provider.cache_clear()
