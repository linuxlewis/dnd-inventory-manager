from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str = "sqlite+aiosqlite:///./data/dnd_inventory.db"
    port: int = 8000
    log_file: str = "data/app.log"
    log_level: str = "INFO"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:9080",
        "http://100.124.164.116:5173",
        "http://100.124.164.116:9080",
    ]

    model_config = {"env_prefix": "", "env_file": ".env"}


settings = Settings()
