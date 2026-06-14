import asyncio
import copy
import json
import random
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx

from ..config import settings


class ComfyUIError(RuntimeError):
    pass


def dimensions_for_aspect(aspect_ratio: str) -> tuple[int, int]:
    if aspect_ratio == "16:9":
        return settings.image_width_16x9, settings.image_height_16x9
    if aspect_ratio == "1:1":
        return settings.image_width_1x1, settings.image_height_1x1
    return settings.image_width_9x16, settings.image_height_9x16


def replace_placeholders(value: Any, replacements: dict[str, str]) -> Any:
    if isinstance(value, str):
        out = value
        for key, replacement in replacements.items():
            out = out.replace(key, replacement)
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


def load_workflow(
    *,
    prompt: str,
    negative: str,
    width: int,
    height: int,
    seed: int,
    filename_prefix: str,
) -> dict[str, Any]:
    custom_path = settings.comfyui_workflow_path
    if custom_path:
        if not custom_path.exists():
            raise ComfyUIError(f"COMFYUI_WORKFLOW_PATH not found: {custom_path}")
        workflow = json.loads(custom_path.read_text(encoding="utf-8"))
        return replace_placeholders(
            workflow,
            {
                "__PROMPT__": prompt,
                "__NEGATIVE__": negative,
                "__WIDTH__": str(width),
                "__HEIGHT__": str(height),
                "__STEPS__": str(settings.comfyui_steps),
                "__CFG__": str(settings.comfyui_cfg),
                "__SEED__": str(seed),
                "__CHECKPOINT__": settings.comfyui_checkpoint,
                "__FILENAME_PREFIX__": filename_prefix,
            },
        )
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

    async def queue_image(
        self,
        *,
        prompt: str,
        negative: str,
        aspect_ratio: str,
        filename_prefix: str,
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
