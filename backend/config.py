from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "AskMyData"
    debug: bool = False

    database_url: str

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8 hours

    # Set to "anthropic" to use Anthropic; default is "ollama" (local)
    llm_provider: str = "ollama"

    anthropic_api_key: str = ""

    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "codellama"

    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10

    # Comma-separated origins, e.g. "http://localhost:3000,https://myapp.com"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
