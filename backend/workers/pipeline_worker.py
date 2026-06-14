from datetime import datetime

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import PipelineJob
from ..services.ollama_service import OllamaService
from ..services.project_service import (
    add_event,
    ensure_project_dirs,
    get_project_or_404,
    save_project_outputs,
    update_job,
    update_project_status,
)


async def run_generate_script(job_id: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(PipelineJob, job_id)
        if not job:
            return
        project = get_project_or_404(db, job.project_id)
        update_job(db, job, "running", "Ollama пишет сценарий", 10)
        update_project_status(db, project, "running", "generate_script", 10)
        ensure_project_dirs(project)

        ollama = OllamaService()
        script = await ollama.generate_script(
            topic=project.topic,
            duration_sec=project.duration_sec,
            aspect_ratio=project.aspect_ratio,
            style=project.style,
        )
        project = get_project_or_404(db, job.project_id)
        save_project_outputs(db, project, script_text=script)
        update_project_status(db, project, "script_ready", "script_ready", 35)
        update_job(db, job, "done", "Сценарий готов", 100)
    except Exception as exc:
        message = str(exc)
        job = db.get(PipelineJob, job_id)
        if job:
            update_job(db, job, "failed", "Сценарий не создан", 100, message)
            project = get_project_or_404(db, job.project_id)
            update_project_status(db, project, "failed", "generate_script", project.progress, message)
    finally:
        db.close()


async def run_generate_storyboard(job_id: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(PipelineJob, job_id)
        if not job:
            return
        project = get_project_or_404(db, job.project_id)
        if not project.script_text.strip():
            raise RuntimeError("Сначала нужен сценарий. Запусти generate-script или вставь script_text.")

        update_job(db, job, "running", "Ollama строит storyboard/reference/prompts JSON", 40)
        update_project_status(db, project, "running", "generate_storyboard", 40)

        ollama = OllamaService()
        pack = await ollama.generate_storyboard_pack(
            project_id=project.id,
            title=project.title,
            topic=project.topic,
            script=project.script_text,
            duration_sec=project.duration_sec,
            aspect_ratio=project.aspect_ratio,
            style=project.style,
        )

        project = get_project_or_404(db, job.project_id)
        save_project_outputs(
            db,
            project,
            storyboard=pack["storyboard"],
            reference_map=pack["reference_map"],
            image_prompts=pack["image_prompts"],
            video_prompts=pack["video_prompts"],
        )
        update_project_status(db, project, "storyboard_ready", "storyboard_ready", 60)
        update_job(db, job, "done", "Storyboard JSON готов", 100)
    except Exception as exc:
        message = str(exc)
        job = db.get(PipelineJob, job_id)
        if job:
            update_job(db, job, "failed", "Storyboard не создан", 100, message)
            project = get_project_or_404(db, job.project_id)
            update_project_status(db, project, "failed", "generate_storyboard", project.progress, message)
    finally:
        db.close()


def mark_stage_not_implemented(db: Session, project_id: str, stage: str) -> dict:
    project = get_project_or_404(db, project_id)
    add_event(db, project.id, stage, "blocked", "Этап подготовлен архитектурно, но в MVP ещё не реализован", project.progress)
    project.current_stage = stage
    project.updated_at = datetime.utcnow()
    db.add(project)
    db.commit()
    return {
        "ok": False,
        "stage": stage,
        "message": "Этап подготовлен архитектурно, но в MVP ещё не реализован",
    }
