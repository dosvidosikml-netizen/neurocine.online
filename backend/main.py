import asyncio
import json
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal, get_db, init_db
from .models import PipelineEvent, PipelineJob, Project
from .schemas.project import ProjectCreate
from .services.project_service import (
    create_job,
    create_project,
    get_project_or_404,
    project_dir,
    save_project_outputs,
    serialize_project,
)
from .services.comfyui_service import ComfyUIService
from .services.workflow_registry import all_presets, get_preset, preset_payload
from .workers.pipeline_worker import mark_stage_not_implemented, run_generate_images, run_generate_script, run_generate_storyboard


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    settings.projects_dir.mkdir(parents=True, exist_ok=True)
    settings.workflows_dir.mkdir(parents=True, exist_ok=True)


def project_payload(project: Project) -> dict:
    return serialize_project(project)


def job_payload(job: PipelineJob) -> dict:
    return {
        "id": job.id,
        "project_id": job.project_id,
        "stage": job.stage,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "error": job.error,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "updated_at": job.updated_at,
    }


def event_payload(event: PipelineEvent) -> dict:
    return {
        "id": event.id,
        "project_id": event.project_id,
        "stage": event.stage,
        "status": event.status,
        "message": event.message,
        "progress": event.progress,
        "created_at": event.created_at,
    }


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "app": settings.app_name,
        "ollama_url": settings.ollama_url,
        "ollama_model": settings.ollama_model,
        "comfyui_url": settings.comfyui_url,
        "comfyui_checkpoint": settings.comfyui_checkpoint,
        "image_workflow_preset": settings.image_workflow_preset,
        "selected_workflow": preset_payload(get_preset(settings.image_workflow_preset)),
        "projects_dir": str(settings.projects_dir),
    }


@app.get("/api/comfyui/status")
async def comfyui_status(workflow_preset: str | None = Query(default=None)) -> dict:
    status = await ComfyUIService().workflow_status(workflow_preset)
    return {"ok": True, "comfyui": status}


@app.post("/api/projects")
async def create_project_endpoint(payload: ProjectCreate, db: Session = Depends(get_db)) -> dict:
    project = create_project(db, payload)
    return {"ok": True, "project": project_payload(project)}


@app.get("/api/projects")
async def list_projects(db: Session = Depends(get_db)) -> dict:
    rows = db.query(Project).order_by(Project.created_at.desc()).limit(100).all()
    return {"ok": True, "projects": [project_payload(project) for project in rows]}


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    return {"ok": True, "project": project_payload(project)}


@app.get("/api/projects/{project_id}/status")
async def get_project_status(project_id: str, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    jobs = db.query(PipelineJob).filter(PipelineJob.project_id == project.id).order_by(PipelineJob.created_at.desc()).limit(20).all()
    events = db.query(PipelineEvent).filter(PipelineEvent.project_id == project.id).order_by(PipelineEvent.created_at.desc()).limit(80).all()
    return {
        "ok": True,
        "project": project_payload(project),
        "jobs": [job_payload(job) for job in jobs],
        "events": [event_payload(event) for event in events],
    }


@app.post("/api/projects/{project_id}/script")
async def update_project_script(project_id: str, body: dict, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    script = str(body.get("script_text") or body.get("script") or "").strip()
    if len(script) < 5:
        raise HTTPException(status_code=400, detail="script_text is required")
    save_project_outputs(db, project, script_text=script)
    project.status = "script_ready"
    project.current_stage = "script_ready"
    project.progress = max(project.progress, 35)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"ok": True, "project": project_payload(project)}


@app.post("/api/projects/{project_id}/settings")
async def update_project_settings(project_id: str, body: dict, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    image_workflow = str(body.get("image_workflow") or project.image_workflow).strip()
    preset_ids = {preset.id for preset in all_presets()}
    if image_workflow not in preset_ids:
        raise HTTPException(status_code=400, detail=f"Unknown image workflow preset: {image_workflow}")
    project.image_workflow = image_workflow
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"ok": True, "project": project_payload(project)}


@app.post("/api/projects/{project_id}/generate-script")
async def generate_script(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    job = create_job(db, project.id, "generate_script", "Сценарий поставлен в очередь")
    background_tasks.add_task(run_generate_script, job.id)
    return {"ok": True, "job": job_payload(job), "project": project_payload(project)}


@app.post("/api/projects/{project_id}/generate-storyboard")
async def generate_storyboard(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    job = create_job(db, project.id, "generate_storyboard", "Storyboard JSON поставлен в очередь")
    background_tasks.add_task(run_generate_storyboard, job.id)
    return {"ok": True, "job": job_payload(job), "project": project_payload(project)}


@app.post("/api/projects/{project_id}/generate-images")
async def generate_images(project_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    project = get_project_or_404(db, project_id)
    if not project.image_prompts_json.strip():
        raise HTTPException(status_code=400, detail="Сначала нужен image_prompts.json. Запусти generate-storyboard.")
    workflow_status = await ComfyUIService().workflow_status(project.image_workflow)
    if not workflow_status.get("ready"):
        detail = workflow_status.get("error") or "ComfyUI workflow is not ready"
        missing_nodes = workflow_status.get("missing_nodes") or []
        missing_models = workflow_status.get("missing_models") or []
        if missing_nodes:
            detail += f"; missing nodes: {', '.join(missing_nodes)}"
        if missing_models:
            detail += f"; missing models: {', '.join(missing_models)}"
        raise HTTPException(status_code=400, detail=detail)
    job = create_job(db, project.id, "generate_images", "Изображения поставлены в очередь ComfyUI")
    background_tasks.add_task(run_generate_images, job.id)
    return {"ok": True, "job": job_payload(job), "project": project_payload(project)}


@app.get("/api/projects/{project_id}/images/{filename}")
async def get_project_image(project_id: str, filename: str, db: Session = Depends(get_db)):
    project = get_project_or_404(db, project_id)
    safe_name = Path(filename).name
    image_path = project_dir(project) / "images" / safe_name
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    media_type = "image/png"
    suffix = image_path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        media_type = "image/jpeg"
    elif suffix == ".webp":
        media_type = "image/webp"
    return FileResponse(image_path, media_type=media_type)


@app.post("/api/projects/{project_id}/generate-video")
async def generate_video(project_id: str, db: Session = Depends(get_db)) -> dict:
    return mark_stage_not_implemented(db, project_id, "generate_video")


@app.post("/api/projects/{project_id}/generate-voice")
async def generate_voice(project_id: str, db: Session = Depends(get_db)) -> dict:
    return mark_stage_not_implemented(db, project_id, "generate_voice")


@app.post("/api/projects/{project_id}/render")
async def render_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    return mark_stage_not_implemented(db, project_id, "render")


@app.get("/api/projects/{project_id}/download")
async def download_project(project_id: str, db: Session = Depends(get_db)):
    project = get_project_or_404(db, project_id)
    final_path = Path(project.final_video_path) if project.final_video_path else project_dir(project) / "render" / "final.mp4"
    if not final_path.exists():
        raise HTTPException(status_code=404, detail="Final MP4 is not rendered yet")
    return FileResponse(final_path, filename=f"{project.title or project.id}.mp4", media_type="video/mp4")


@app.get("/api/projects/{project_id}/progress")
async def project_progress(project_id: str):
    async def stream():
        last_event_id = 0
        while True:
            db = SessionLocal()
            try:
                project = get_project_or_404(db, project_id)
                events = (
                    db.query(PipelineEvent)
                    .filter(PipelineEvent.project_id == project.id, PipelineEvent.id > last_event_id)
                    .order_by(PipelineEvent.id.asc())
                    .limit(50)
                    .all()
                )
                if events:
                    last_event_id = events[-1].id
                payload = {
                    "project": project_payload(project),
                    "events": [event_payload(event) for event in events],
                }
                yield f"data: {json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
            except Exception as exc:
                yield f"event: error\ndata: {json.dumps({'error': str(exc)}, ensure_ascii=False)}\n\n"
                break
            finally:
                db.close()
            await asyncio.sleep(settings.sse_poll_seconds)

    return StreamingResponse(stream(), media_type="text/event-stream")
