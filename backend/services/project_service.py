import json
import re
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from ..config import settings
from ..models import PipelineEvent, PipelineJob, Project
from ..schemas.project import ProjectCreate


def clamp_progress(value: int | float) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except Exception:
        return 0


def safe_filename(value: str, fallback: str = "project") -> str:
    cleaned = re.sub(r"[^0-9A-Za-zА-Яа-яЁё._-]+", "-", value.strip()).strip("-")
    return cleaned[:80] or fallback


def project_dir(project: Project) -> Path:
    return settings.projects_dir / f"{project.created_at.strftime('%Y%m%d')}_{safe_filename(project.title, project.id)}_{project.id[:8]}"


def ensure_project_dirs(project: Project) -> Path:
    root = project_dir(project)
    for child in ("", "images", "clips", "audio", "subtitles", "render", "logs"):
        (root / child).mkdir(parents=True, exist_ok=True)
    return root


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value or "", encoding="utf-8")


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_json_field(value: str, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except Exception:
        return fallback


def serialize_project(project: Project) -> dict[str, Any]:
    return {
        "id": project.id,
        "title": project.title,
        "topic": project.topic,
        "aspect_ratio": project.aspect_ratio,
        "duration_sec": project.duration_sec,
        "style": project.style,
        "status": project.status,
        "current_stage": project.current_stage,
        "progress": project.progress,
        "error": project.error,
        "script_text": project.script_text,
        "storyboard_json": parse_json_field(project.storyboard_json, None),
        "reference_map_json": parse_json_field(project.reference_map_json, None),
        "image_prompts_json": parse_json_field(project.image_prompts_json, None),
        "video_prompts_json": parse_json_field(project.video_prompts_json, None),
        "final_video_path": project.final_video_path,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


def create_project(db: Session, payload: ProjectCreate) -> Project:
    title = payload.title.strip() or payload.topic.strip()[:80]
    project = Project(
        title=title,
        topic=payload.topic.strip(),
        aspect_ratio=payload.aspect_ratio,
        duration_sec=payload.duration_sec,
        style=payload.style,
        status="draft",
        current_stage="created",
        progress=0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    root = ensure_project_dirs(project)
    write_json(root / "project.json", serialize_project(project))
    add_event(db, project.id, "created", "done", "Проект создан", 0)
    return project


def get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if not project:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Project not found")
    return project


def add_event(db: Session, project_id: str, stage: str, status: str, message: str, progress: int = 0) -> PipelineEvent:
    event = PipelineEvent(
        project_id=project_id,
        stage=stage,
        status=status,
        message=message,
        progress=clamp_progress(progress),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def create_job(db: Session, project_id: str, stage: str, message: str = "") -> PipelineJob:
    job = PipelineJob(project_id=project_id, stage=stage, status="queued", message=message, progress=0)
    db.add(job)
    db.commit()
    db.refresh(job)
    add_event(db, project_id, stage, "queued", message or f"{stage} поставлен в очередь", 0)
    return job


def update_job(db: Session, job: PipelineJob, status: str, message: str = "", progress: int | float | None = None, error: str = "") -> PipelineJob:
    from datetime import datetime

    job.status = status
    if message:
        job.message = message
    if progress is not None:
        job.progress = clamp_progress(progress)
    if error:
        job.error = error
    if status == "running" and not job.started_at:
        job.started_at = datetime.utcnow()
    if status in {"done", "failed", "cancelled"}:
        job.completed_at = datetime.utcnow()
    db.add(job)
    db.commit()
    db.refresh(job)
    add_event(db, job.project_id, job.stage, status, message or error or status, job.progress)
    return job


def update_project_status(db: Session, project: Project, status: str, stage: str, progress: int | float, error: str = "") -> Project:
    project.status = status
    project.current_stage = stage
    project.progress = clamp_progress(progress)
    project.error = error
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def save_project_outputs(
    db: Session,
    project: Project,
    *,
    script_text: str | None = None,
    storyboard: dict[str, Any] | None = None,
    reference_map: dict[str, Any] | None = None,
    image_prompts: list[dict[str, Any]] | None = None,
    video_prompts: list[dict[str, Any]] | None = None,
) -> Project:
    root = ensure_project_dirs(project)
    if script_text is not None:
        project.script_text = script_text
        write_text(root / "script.txt", script_text)
    if storyboard is not None:
        project.storyboard_json = json.dumps(storyboard, ensure_ascii=False)
        write_json(root / "storyboard.json", storyboard)
    if reference_map is not None:
        project.reference_map_json = json.dumps(reference_map, ensure_ascii=False)
        write_json(root / "reference_map.json", reference_map)
    if image_prompts is not None:
        project.image_prompts_json = json.dumps(image_prompts, ensure_ascii=False)
        write_json(root / "image_prompts.json", image_prompts)
    if video_prompts is not None:
        project.video_prompts_json = json.dumps(video_prompts, ensure_ascii=False)
        write_json(root / "video_prompts.json", video_prompts)
    write_json(root / "project.json", serialize_project(project))
    db.add(project)
    db.commit()
    db.refresh(project)
    return project
