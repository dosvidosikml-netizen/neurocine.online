from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..config import settings


@dataclass(frozen=True)
class WorkflowPreset:
    id: str
    name: str
    kind: str
    description: str
    production: bool = True
    workflow_path: Path | None = None
    model_hint: str = ""
    node_hint: str = ""


def bundled_presets() -> list[WorkflowPreset]:
    return [
        WorkflowPreset(
            id="custom_api",
            name="Custom ComfyUI API workflow",
            kind="custom_api",
            description="Production mode. Export a real ComfyUI workflow in API format and set COMFYUI_WORKFLOW_PATH.",
            workflow_path=settings.comfyui_workflow_path,
            model_hint=settings.comfyui_checkpoint,
        ),
        WorkflowPreset(
            id="z_image_turbo",
            name="Z-Image Turbo workflow",
            kind="custom_api",
            description="Production slot for a Z-Image Turbo API workflow exported from ComfyUI.",
            workflow_path=settings.workflows_dir / "z_image_turbo_api.json",
            model_hint="z-image turbo checkpoint or diffusion model from the workflow",
        ),
        WorkflowPreset(
            id="flux_2_klein",
            name="Flux 2 Klein workflow",
            kind="custom_api",
            description="Production slot for a Flux 2 Klein API workflow exported from ComfyUI.",
            workflow_path=settings.workflows_dir / "flux_2_klein_api.json",
            model_hint="Flux 2 Klein model files from the workflow",
        ),
        WorkflowPreset(
            id="wan_image",
            name="Wan image workflow",
            kind="custom_api",
            description="Production slot for a Wan image API workflow exported from ComfyUI.",
            workflow_path=settings.workflows_dir / "wan_image_api.json",
            model_hint="Wan image model files from the workflow",
        ),
        WorkflowPreset(
            id="basic_sdxl_diagnostic",
            name="Basic SDXL diagnostic workflow",
            kind="basic_sdxl",
            description="Connection test only. This is not the production-quality Flow/Nano Banana pipeline.",
            production=False,
            model_hint=settings.comfyui_checkpoint,
            node_hint="CheckpointLoaderSimple, EmptyLatentImage, CLIPTextEncode, KSampler, VAEDecode, SaveImage",
        ),
    ]


def external_presets() -> list[WorkflowPreset]:
    path = settings.workflow_presets_path
    if not path.exists():
        return []
    import json

    raw = json.loads(path.read_text(encoding="utf-8"))
    rows = raw.get("presets", raw if isinstance(raw, list) else [])
    presets: list[WorkflowPreset] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        preset_id = str(row.get("id") or "").strip()
        if not preset_id:
            continue
        workflow_path = row.get("workflow_path")
        presets.append(
            WorkflowPreset(
                id=preset_id,
                name=str(row.get("name") or preset_id),
                kind=str(row.get("kind") or "custom_api"),
                description=str(row.get("description") or ""),
                production=bool(row.get("production", True)),
                workflow_path=Path(workflow_path) if workflow_path else None,
                model_hint=str(row.get("model_hint") or ""),
                node_hint=str(row.get("node_hint") or ""),
            )
        )
    return presets


def all_presets() -> list[WorkflowPreset]:
    by_id = {preset.id: preset for preset in bundled_presets()}
    for preset in external_presets():
        by_id[preset.id] = preset
    return list(by_id.values())


def get_preset(preset_id: str | None = None) -> WorkflowPreset:
    selected = (preset_id or settings.image_workflow_preset or "custom_api").strip()
    presets = {preset.id: preset for preset in all_presets()}
    return presets.get(selected) or presets["custom_api"]


def preset_payload(preset: WorkflowPreset) -> dict[str, Any]:
    return {
        "id": preset.id,
        "name": preset.name,
        "kind": preset.kind,
        "description": preset.description,
        "production": preset.production,
        "workflow_path": str(preset.workflow_path) if preset.workflow_path else "",
        "workflow_exists": bool(preset.workflow_path and preset.workflow_path.exists()),
        "model_hint": preset.model_hint,
        "node_hint": preset.node_hint,
    }
