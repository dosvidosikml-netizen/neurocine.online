import os
from pathlib import Path

from pydantic import BaseModel


REPO_ROOT = Path(__file__).resolve().parent.parent


def env_list(name: str, fallback: str) -> list[str]:
    raw = os.getenv(name, fallback)
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings(BaseModel):
    app_name: str = "NeuroCine Local AI Content Factory"
    database_path: Path = Path(os.getenv("FACTORY_DATABASE_PATH", REPO_ROOT / "backend" / "data" / "factory.sqlite3"))
    projects_dir: Path = Path(os.getenv("FACTORY_PROJECTS_DIR", REPO_ROOT / "projects"))
    ollama_url: str = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    cors_origins: list[str] = env_list(
        "FACTORY_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://neurocine.online,https://www.neurocine.online",
    )
    sse_poll_seconds: float = float(os.getenv("FACTORY_SSE_POLL_SECONDS", "1.5"))


settings = Settings()
