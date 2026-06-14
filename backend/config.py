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
    workflows_dir: Path = Path(os.getenv("FACTORY_WORKFLOWS_DIR", REPO_ROOT / "workflows"))
    ollama_url: str = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    comfyui_url: str = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")
    comfyui_checkpoint: str = os.getenv("COMFYUI_CHECKPOINT", "sd_xl_base_1.0.safetensors")
    comfyui_workflow_path: Path | None = Path(os.getenv("COMFYUI_WORKFLOW_PATH")) if os.getenv("COMFYUI_WORKFLOW_PATH") else None
    image_width_9x16: int = int(os.getenv("FACTORY_IMAGE_WIDTH_9X16", "1024"))
    image_height_9x16: int = int(os.getenv("FACTORY_IMAGE_HEIGHT_9X16", "1792"))
    image_width_16x9: int = int(os.getenv("FACTORY_IMAGE_WIDTH_16X9", "1792"))
    image_height_16x9: int = int(os.getenv("FACTORY_IMAGE_HEIGHT_16X9", "1024"))
    image_width_1x1: int = int(os.getenv("FACTORY_IMAGE_WIDTH_1X1", "1024"))
    image_height_1x1: int = int(os.getenv("FACTORY_IMAGE_HEIGHT_1X1", "1024"))
    comfyui_steps: int = int(os.getenv("COMFYUI_STEPS", "32"))
    comfyui_cfg: float = float(os.getenv("COMFYUI_CFG", "6.0"))
    comfyui_sampler: str = os.getenv("COMFYUI_SAMPLER", "dpmpp_2m")
    comfyui_scheduler: str = os.getenv("COMFYUI_SCHEDULER", "karras")
    comfyui_timeout_seconds: float = float(os.getenv("COMFYUI_TIMEOUT_SECONDS", "900"))
    cors_origins: list[str] = env_list(
        "FACTORY_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://neurocine.online,https://www.neurocine.online",
    )
    sse_poll_seconds: float = float(os.getenv("FACTORY_SSE_POLL_SECONDS", "1.5"))


settings = Settings()
