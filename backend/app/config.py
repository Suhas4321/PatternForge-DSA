from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # SQLite by default. For Supabase set e.g.
    # DATABASE_URL=postgresql+psycopg://postgres:<password>@db.<project>.supabase.co:5432/postgres
    database_url: str = f"sqlite:///{BACKEND_DIR / 'patternforge.db'}"

    content_dir: Path = PROJECT_DIR / "content"
    backup_dir: Path = BACKEND_DIR / "backups"
    auto_backup: bool = True

    # Code runner limits
    run_timeout_seconds: float = 5.0
    run_memory_mb: int = 512
    trace_max_steps: int = 1500

    # Optional AI coach. Either any OpenAI-compatible endpoint (e.g. Snowflake Cortex:
    # AI_BASE_URL=https://<account>.snowflakecomputing.com/api/v2/cortex/v1) or a Gemini key.
    ai_base_url: str = ""
    ai_api_key: str = ""
    ai_model: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    ai_timeout_seconds: float = 45.0

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
