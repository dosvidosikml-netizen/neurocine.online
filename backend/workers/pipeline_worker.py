from datetime import datetime

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import PipelineJob
from ..services.comfyui_service import ComfyUIService
from ..services.ollama_service import OllamaService
from ..services.project_service import (
    add_event,
    ensure_project_dirs,
    get_project_or_404,
    parse_json_field,
    project_dir,
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


def build_image_prompt(project, item: dict, reference_map: dict) -> tuple[str, str]:
    style_lock = str(reference_map.get("style_lock_en") or "")
    characters = reference_map.get("characters") if isinstance(reference_map.get("characters"), list) else []
    locations = reference_map.get("locations") if isinstance(reference_map.get("locations"), list) else []
    character_lock = "; ".join(
        f"{char.get('name') or char.get('id')}: {char.get('identity_lock_en', '')} {char.get('wardrobe_or_body_lock_en', '')}".strip()
        for char in characters
        if isinstance(char, dict)
    )
    location_lock = "; ".join(
        f"{loc.get('name') or loc.get('id')}: {loc.get('design_lock_en', '')}".strip()
        for loc in locations
        if isinstance(loc, dict)
    )
    prompt = "\n".join(
        part
        for part in [
            str(item.get("prompt_en") or item.get("image_prompt_en") or "").strip(),
            f"PROJECT STYLE: {project.style}",
            f"GLOBAL STYLE LOCK: {style_lock}" if style_lock else "",
            f"CHARACTER CONTINUITY LOCK: {character_lock}" if character_lock else "",
            f"LOCATION CONTINUITY LOCK: {location_lock}" if location_lock else "",
            "Photoreal cinematic production still, sharp subject detail, coherent anatomy, consistent identity, no text in image.",
        ]
        if part
    )
    negative = ", ".join(
        part
        for part in [
            str(item.get("negative_en") or "").strip(),
            "text, subtitles, captions, watermark, logo, UI, frame labels, duplicate panels, collage, contact sheet",
            "extra characters, wrong location, new props, style drift, blurry face, plastic skin, bad hands, malformed anatomy",
        ]
        if part
    )
    return prompt, negative


async def run_generate_images(job_id: str) -> None:
    db: Session = SessionLocal()
    try:
        job = db.get(PipelineJob, job_id)
        if not job:
            return
        project = get_project_or_404(db, job.project_id)
        image_prompts = parse_json_field(project.image_prompts_json, [])
        reference_map = parse_json_field(project.reference_map_json, {})
        if not image_prompts:
            raise RuntimeError("Сначала нужен image_prompts.json. Запусти generate-storyboard.")

        root = ensure_project_dirs(project)
        image_dir = root / "images"
        comfy = ComfyUIService()
        workflow_status = await comfy.workflow_status(project.image_workflow)
        if not workflow_status.get("ready"):
            details = workflow_status.get("error") or "workflow is not ready"
            missing_nodes = workflow_status.get("missing_nodes") or []
            missing_models = workflow_status.get("missing_models") or []
            if missing_nodes:
                details += f"; missing nodes: {', '.join(missing_nodes)}"
            if missing_models:
                details += f"; missing models: {', '.join(missing_models)}"
            raise RuntimeError(details)

        total = len(image_prompts)
        rendered: list[dict] = []
        update_job(db, job, "running", f"ComfyUI генерирует изображения: 0/{total}", 62)
        update_project_status(db, project, "running", "generate_images", 62)

        for index, item in enumerate(image_prompts, start=1):
            project = get_project_or_404(db, job.project_id)
            scene_id = str(item.get("scene_id") or item.get("id") or f"S{index:02d}")
            prompt, negative = build_image_prompt(project, item, reference_map)
            if len(prompt.strip()) < 20:
                raise RuntimeError(f"Пустой image prompt для {scene_id}")
            stage_progress = 62 + int((index - 1) / max(total, 1) * 18)
            update_job(db, job, "running", f"ComfyUI рендерит {scene_id}: {index}/{total}", stage_progress)
            add_event(db, project.id, "generate_images", "running", f"Отправлен prompt {scene_id} в ComfyUI", stage_progress)

            prefix = f"neurocine_{project.id[:8]}_{scene_id}"
            queued = await comfy.queue_image(
                prompt=prompt,
                negative=negative,
                aspect_ratio=project.aspect_ratio,
                filename_prefix=prefix,
                preset_id=project.image_workflow,
            )
            outputs = await comfy.wait_for_images(queued["prompt_id"])
            first = outputs[0]
            extension = "." + str(first.get("filename") or "image.png").split(".")[-1].lower()
            if extension not in {".png", ".jpg", ".jpeg", ".webp"}:
                extension = ".png"
            local_name = f"{index:03d}_{scene_id}{extension}"
            local_path = await comfy.download_image(first, image_dir / local_name)
            rendered.append(
                {
                    "scene_id": scene_id,
                    "file": str(local_path.relative_to(project_dir(project))).replace("\\", "/"),
                    "url": f"/api/projects/{project.id}/images/{local_name}",
                    "prompt_id": queued["prompt_id"],
                    "seed": queued["seed"],
                    "width": queued["width"],
                    "height": queued["height"],
                    "source_filename": first.get("filename", ""),
                }
            )
            save_project_outputs(db, project, images=rendered)
            done_progress = 62 + int(index / max(total, 1) * 18)
            update_project_status(db, project, "running", "generate_images", done_progress)
            add_event(db, project.id, "generate_images", "running", f"{scene_id} сохранён: {local_name}", done_progress)

        project = get_project_or_404(db, job.project_id)
        save_project_outputs(db, project, images=rendered)
        update_project_status(db, project, "images_ready", "images_ready", 80)
        update_job(db, job, "done", f"Изображения готовы: {len(rendered)}", 100)
    except Exception as exc:
        message = str(exc)
        job = db.get(PipelineJob, job_id)
        if job:
            update_job(db, job, "failed", "Изображения не созданы", 100, message)
            project = get_project_or_404(db, job.project_id)
            update_project_status(db, project, "failed", "generate_images", project.progress, message)
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
