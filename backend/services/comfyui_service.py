import asyncio
import copy
import json
import random
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx

from ..config import settings
from .workflow_registry import all_presets, get_preset, preset_payload


class ComfyUIError(RuntimeError):
    pass


def dimensions_for_aspect(aspect_ratio: str) -> tuple[int, int]:
    if aspect_ratio == "16:9":
        return settings.image_width_16x9, settings.image_height_16x9
    if aspect_ratio == "1:1":
        return settings.image_width_1x1, settings.image_height_1x1
    return settings.image_width_9x16, settings.image_height_9x16


MODEL_EXTENSIONS = (".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf")


def replace_placeholders(value: Any, replacements: dict[str, Any]) -> Any:
    if isinstance(value, str):
        if value in replacements:
            return replacements[value]
        out = value
        for key, replacement in replacements.items():
            out = out.replace(key, str(replacement))
        return out
    if isinstance(value, list):
        return [replace_placeholders(item, replacements) for item in value]
    if isinstance(value, dict):
        return {key: replace_placeholders(item, replacements) for key, item in value.items()}
    return value


def basic_sdxl_workflow(
    *,
    prompt: str,
    negative: str,
    width: int,
    height: int,
    seed: int,
    filename_prefix: str,
) -> dict[str, Any]:
    return {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": settings.comfyui_checkpoint},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": settings.comfyui_steps,
                "cfg": settings.comfyui_cfg,
                "sampler_name": settings.comfyui_sampler,
                "scheduler": settings.comfyui_scheduler,
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": filename_prefix, "images": ["8", 0]},
        },
    }


def collect_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            out.extend(collect_strings(item))
        return out
    if isinstance(value, dict):
        out: list[str] = []
        for item in value.values():
            out.extend(collect_strings(item))
        return out
    return []


def workflow_class_types(workflow: dict[str, Any]) -> set[str]:
    return {
        str(node.get("class_type"))
        for node in workflow.values()
        if isinstance(node, dict) and node.get("class_type")
    }


def workflow_model_refs(workflow: dict[str, Any]) -> set[str]:
    refs: set[str] = set()
    for value in collect_strings(workflow):
        lowered = value.lower()
        if lowered.endswith(MODEL_EXTENSIONS):
            refs.add(value)
    return refs


def unresolved_placeholders(workflow: dict[str, Any]) -> set[str]:
    return {value for value in collect_strings(workflow) if "__" in value}


def load_workflow(
    *,
    prompt: str,
    negative: str,
    width: int,
    height: int,
    seed: int,
    filename_prefix: str,
    preset_id: str | None = None,
) -> dict[str, Any]:
    preset = get_preset(preset_id)
    custom_path = preset.workflow_path
    if preset.kind == "custom_api":
        if not custom_path:
            raise ComfyUIError(
                f"Workflow preset '{preset.id}' needs an API workflow JSON path. "
                "Set COMFYUI_WORKFLOW_PATH or use one of the files under workflows/."
            )
        if not custom_path.exists():
            raise ComfyUIError(f"Workflow preset '{preset.id}' file not found: {custom_path}")
        workflow = json.loads(custom_path.read_text(encoding="utf-8"))
        patched = replace_placeholders(
            workflow,
            {
                "__PROMPT__": prompt,
                "__NEGATIVE__": negative,
                "__WIDTH__": width,
                "__HEIGHT__": height,
                "__STEPS__": settings.comfyui_steps,
                "__CFG__": settings.comfyui_cfg,
                "__SEED__": seed,
                "__CHECKPOINT__": settings.comfyui_checkpoint,
                "__FILENAME_PREFIX__": filename_prefix,
            },
        )
        pending = unresolved_placeholders(patched)
        if pending:
            raise ComfyUIError(f"Workflow preset '{preset.id}' has unresolved placeholders: {', '.join(sorted(pending))}")
        return patched
    if preset.kind != "basic_sdxl":
        raise ComfyUIError(f"Unsupported workflow preset kind: {preset.kind}")
    return basic_sdxl_workflow(
        prompt=prompt,
        negative=negative,
        width=width,
        height=height,
        seed=seed,
        filename_prefix=filename_prefix,
    )


class ComfyUIService:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or settings.comfyui_url).rstrip("/")
        self.client_id = str(uuid4())

    async def health(self) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                queue = await client.get(f"{self.base_url}/queue")
                queue.raise_for_status()
                return {"ok": True, "queue": queue.json()}
        except Exception as exc:
            raise ComfyUIError(f"ComfyUI API is not reachable at {self.base_url}: {exc}") from exc

    async def object_info(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(f"{self.base_url}/object_info")
            response.raise_for_status()
            return response.json()

    def available_model_names(self, object_info: dict[str, Any]) -> set[str]:
        names: set[str] = set()
        for node in object_info.values():
            if not isinstance(node, dict):
                continue
            inputs = node.get("input") or {}
            for group in ("required", "optional"):
                rows = inputs.get(group) or {}
                if not isinstance(rows, dict):
                    continue
                for value in rows.values():
                    if isinstance(value, list) and value:
                        first = value[0]
                        if isinstance(first, list):
                            for item in first:
                                if isinstance(item, str):
                                    names.add(item)
        return names

    async def workflow_status(self, preset_id: str | None = None) -> dict[str, Any]:
        preset = get_preset(preset_id)
        payload = preset_payload(preset)
        status: dict[str, Any] = {
            "ok": False,
            "ready": False,
            "base_url": self.base_url,
            "selected_preset": payload,
            "presets": [preset_payload(item) for item in all_presets()],
            "queue": None,
            "missing_nodes": [],
            "missing_models": [],
            "workflow_nodes": [],
            "workflow_models": [],
            "warnings": [],
            "error": "",
        }
        if not preset.production:
            status["warnings"].append("Diagnostic workflow only. Do not judge final quality from this preset.")
        if preset.kind == "custom_api" and not payload["workflow_exists"]:
            status["error"] = f"Workflow file is missing: {payload['workflow_path']}"
            return status
        try:
            health = await self.health()
            status["queue"] = health.get("queue")
            object_info = await self.object_info()
            available_nodes = set(object_info.keys())
            available_models = self.available_model_names(object_info)
            width, height = dimensions_for_aspect("9:16")
            workflow = load_workflow(
                prompt="workflow readiness test prompt",
                negative="",
                width=width,
                height=height,
                seed=1,
                filename_prefix="neurocine_workflow_readiness",
                preset_id=preset.id,
            )
            nodes = workflow_class_types(workflow)
            models = workflow_model_refs(workflow)
            missing_nodes = sorted(nodes - available_nodes)
            missing_models = sorted(name for name in models if name not in available_models)
            status.update(
                {
                    "ok": True,
                    "workflow_nodes": sorted(nodes),
                    "workflow_models": sorted(models),
                    "missing_nodes": missing_nodes,
                    "missing_models": missing_models,
                    "ready": not missing_nodes and not missing_models,
                }
            )
            if not models and preset.model_hint:
                status["warnings"].append(f"Model could not be inferred from workflow. Expected/hint: {preset.model_hint}")
            if missing_models:
                status["warnings"].append("Some model names in the workflow are not visible in ComfyUI object_info.")
        except Exception as exc:
            status["error"] = str(exc)
        return status

    async def queue_image(
        self,
        *,
        prompt: str,
        negative: str,
        aspect_ratio: str,
        filename_prefix: str,
        preset_id: str | None = None,
        seed: int | None = None,
    ) -> dict[str, Any]:
        width, height = dimensions_for_aspect(aspect_ratio)
        actual_seed = seed if seed is not None else random.randint(1, 2**31 - 1)
        workflow = load_workflow(
            prompt=prompt,
            negative=negative,
            width=width,
            height=height,
            seed=actual_seed,
            filename_prefix=filename_prefix,
            preset_id=preset_id,
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/prompt",
                json={"prompt": workflow, "client_id": self.client_id},
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise ComfyUIError(f"ComfyUI rejected workflow: {response.text[:1200]}") from exc
            data = response.json()
        prompt_id = data.get("prompt_id")
        if not prompt_id:
            raise ComfyUIError(f"ComfyUI did not return prompt_id: {data}")
        return {"prompt_id": prompt_id, "seed": actual_seed, "width": width, "height": height}

    async def wait_for_images(self, prompt_id: str) -> list[dict[str, Any]]:
        deadline = asyncio.get_event_loop().time() + settings.comfyui_timeout_seconds
        async with httpx.AsyncClient(timeout=20) as client:
            while asyncio.get_event_loop().time() < deadline:
                response = await client.get(f"{self.base_url}/history/{prompt_id}")
                response.raise_for_status()
                history = response.json()
                record = history.get(prompt_id)
                if record:
                    outputs = record.get("outputs") or {}
                    images: list[dict[str, Any]] = []
                    for node_output in outputs.values():
                        for image in node_output.get("images") or []:
                            images.append(copy.deepcopy(image))
                    if images:
                        return images
                    status = record.get("status") or {}
                    if status.get("status_str") == "error":
                        raise ComfyUIError(json.dumps(status, ensure_ascii=False))
                await asyncio.sleep(1.5)
        raise ComfyUIError(f"ComfyUI timed out while waiting for prompt {prompt_id}")

    async def download_image(self, image: dict[str, Any], destination: Path) -> Path:
        destination.parent.mkdir(parents=True, exist_ok=True)
        params = {
            "filename": image.get("filename", ""),
            "subfolder": image.get("subfolder", ""),
            "type": image.get("type", "output"),
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(f"{self.base_url}/view", params=params)
            response.raise_for_status()
        destination.write_bytes(response.content)
        return destination
