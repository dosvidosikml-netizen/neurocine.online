import json
import re
from typing import Any

import httpx

from ..config import settings


RU_WORDS_PER_SECOND = 1.8


class OllamaError(RuntimeError):
    pass


def count_words(text: str) -> int:
    return len([item for item in re.split(r"\s+", text.strip()) if item])


def word_target(duration_sec: int) -> tuple[int, int, int]:
    target = max(40, round(duration_sec * RU_WORDS_PER_SECOND))
    return max(40, round(target * 0.88)), target, round(target * 1.08)


def clean_model_text(value: str) -> str:
    text = (value or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def parse_json_object(value: str) -> dict[str, Any]:
    text = clean_model_text(value)
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    first = text.find("{")
    last = text.rfind("}")
    if first >= 0 and last > first:
        data = json.loads(text[first:last + 1])
        if isinstance(data, dict):
            return data
    raise OllamaError("Ollama returned invalid JSON")


class OllamaService:
    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = (base_url or settings.ollama_url).rstrip("/")
        self.model = model or settings.ollama_model

    async def generate(self, prompt: str, *, format_json: bool = False, temperature: float = 0.35, timeout: float = 240) -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
            },
        }
        if format_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
        except httpx.ConnectError as exc:
            raise OllamaError(f"Ollama is not reachable at {self.base_url}. Start Ollama and pull model {self.model}.") from exc
        except httpx.TimeoutException as exc:
            raise OllamaError("Ollama request timed out") from exc

        if response.status_code >= 400:
            raise OllamaError(f"Ollama HTTP {response.status_code}: {response.text[:500]}")

        data = response.json()
        text = clean_model_text(data.get("response", ""))
        if not text:
            raise OllamaError("Ollama returned empty response")
        return text

    async def generate_script(self, *, topic: str, duration_sec: int, aspect_ratio: str, style: str) -> str:
        min_words, target_words, max_words = word_target(duration_sec)
        prompt = f"""
Ты сценарист коротких вирусных видеороликов и трейлеров.
Пиши на русском. Верни только сценарий без markdown, номеров, таймкодов и пояснений.

Тема: {topic}
Формат кадра: {aspect_ratio}
Длительность: {duration_sec} секунд
Стиль: {style}
Целевой объём озвучки: {min_words}-{max_words} слов, цель около {target_words} слов.

Структура:
- первая фраза должна быть сильным hook: срочность, опасность, странность или вопрос;
- каждая фраза должна давать видимый кадр, действие, звук, объект, эмоцию или место;
- введи главных героев рано и держи их до конца;
- не меняй физическое условие героя из темы;
- не используй имена и детали из старых проектов, если их нет в текущей теме;
- середина должна усложнять ситуацию;
- финал должен быть конкретным visual sting, а не моралью.

Контроль:
- сценарий должен укладываться в длительность по озвучке;
- не добавляй технические комментарии;
- не пиши список сцен.
""".strip()
        text = await self.generate(prompt, temperature=0.46, timeout=240)
        return text.strip()

    async def generate_storyboard_pack(
        self,
        *,
        project_id: str,
        title: str,
        topic: str,
        script: str,
        duration_sec: int,
        aspect_ratio: str,
        style: str,
    ) -> dict[str, Any]:
        prompt = f"""
Return valid JSON only. No markdown. No explanation.

You are a local AI film production planner.
Create a production-ready storyboard package from the CURRENT script only.

Project:
- project_id: {project_id}
- title: {title}
- topic: {topic}
- aspect_ratio: {aspect_ratio}
- duration_sec: {duration_sec}
- style: {style}

Rules:
- Source of truth is the script line.
- Do not invent new characters, locations, props, costumes or supernatural rules.
- Extract recurring humans, animals and important locations into reference_map.
- Keep all visual prompt instructions in English.
- Russian is allowed only for exact dialogue or source lines.
- Every scene must be visible and animatable.
- Scene durations must sum approximately to duration_sec.

Required JSON shape:
{{
  "storyboard": {{
    "project_id": "{project_id}",
    "title": "{title}",
    "aspect_ratio": "{aspect_ratio}",
    "duration_sec": {duration_sec},
    "style": "{style}",
    "scenes": [
      {{
        "id": "S01",
        "start": 0,
        "duration": 4,
        "source_line_ru": "exact script beat",
        "description_ru": "visible shot in Russian",
        "characters": ["stable names only if present"],
        "location": "locked location name",
        "camera": "camera direction",
        "sound": "clean diegetic SFX/VO cue",
        "image_prompt_en": "photoreal image prompt, script literal",
        "video_prompt_en": "compact video prompt, animate only described action"
      }}
    ]
  }},
  "reference_map": {{
    "characters": [
      {{
        "id": "CHAR_01",
        "name": "script name",
        "kind": "human|animal",
        "role": "story role",
        "identity_lock_en": "stable visual identity",
        "wardrobe_or_body_lock_en": "clothes/fur/body condition",
        "negative_en": "forbidden drift",
        "source_evidence_ru": "script evidence",
        "reference_prompt_en": "wide 16:9 production reference sheet prompt with turnarounds, emotions, scenario poses and detail strip"
      }}
    ],
    "locations": [
      {{
        "id": "LOC_01",
        "name": "location name",
        "design_lock_en": "geography, materials, light, props",
        "negative_en": "forbidden changes",
        "source_evidence_ru": "script evidence",
        "reference_prompt_en": "wide 16:9 production location bible board prompt"
      }}
    ],
    "style_lock_en": "global style continuity lock"
  }},
  "image_prompts": [
    {{"scene_id": "S01", "prompt_en": "image prompt", "negative_en": "negative prompt"}}
  ],
  "video_prompts": [
    {{"scene_id": "S01", "prompt_en": "video prompt", "sound_en": "clean sound plan"}}
  ]
}}

SCRIPT:
{script}
""".strip()

        raw = await self.generate(prompt, format_json=True, temperature=0.18, timeout=300)
        data = parse_json_object(raw)
        return normalize_storyboard_pack(data, project_id=project_id, title=title, duration_sec=duration_sec, aspect_ratio=aspect_ratio, style=style)


def normalize_storyboard_pack(data: dict[str, Any], *, project_id: str, title: str, duration_sec: int, aspect_ratio: str, style: str) -> dict[str, Any]:
    storyboard = data.get("storyboard") if isinstance(data.get("storyboard"), dict) else data
    scenes = storyboard.get("scenes") if isinstance(storyboard.get("scenes"), list) else []
    if not scenes:
        raise OllamaError("Storyboard JSON has no scenes")

    normalized_scenes: list[dict[str, Any]] = []
    cursor = 0.0
    for index, scene in enumerate(scenes, start=1):
        if not isinstance(scene, dict):
            continue
        duration = float(scene.get("duration") or max(2, round(duration_sec / max(len(scenes), 1))))
        normalized_scenes.append({
            "id": str(scene.get("id") or f"S{index:02d}"),
            "start": float(scene.get("start") if scene.get("start") is not None else cursor),
            "duration": duration,
            "source_line_ru": str(scene.get("source_line_ru") or scene.get("script_line_ru") or ""),
            "description_ru": str(scene.get("description_ru") or scene.get("description") or ""),
            "characters": scene.get("characters") if isinstance(scene.get("characters"), list) else [],
            "location": str(scene.get("location") or ""),
            "camera": str(scene.get("camera") or ""),
            "sound": str(scene.get("sound") or scene.get("sfx") or ""),
            "image_prompt_en": str(scene.get("image_prompt_en") or ""),
            "video_prompt_en": str(scene.get("video_prompt_en") or ""),
        })
        cursor += duration

    storyboard_out = {
        "project_id": project_id,
        "title": str(storyboard.get("title") or title),
        "aspect_ratio": str(storyboard.get("aspect_ratio") or aspect_ratio),
        "duration_sec": int(storyboard.get("duration_sec") or duration_sec),
        "style": str(storyboard.get("style") or style),
        "scenes": normalized_scenes,
    }

    image_prompts = data.get("image_prompts") if isinstance(data.get("image_prompts"), list) else []
    video_prompts = data.get("video_prompts") if isinstance(data.get("video_prompts"), list) else []
    if not image_prompts:
        image_prompts = [
            {
                "scene_id": scene["id"],
                "prompt_en": scene["image_prompt_en"],
                "negative_en": "text, captions, watermark, UI, extra characters, unrelated location, style drift",
            }
            for scene in normalized_scenes
        ]
    if not video_prompts:
        video_prompts = [
            {
                "scene_id": scene["id"],
                "prompt_en": scene["video_prompt_en"],
                "sound_en": scene["sound"],
            }
            for scene in normalized_scenes
        ]

    reference_map = data.get("reference_map") if isinstance(data.get("reference_map"), dict) else {}
    return {
        "storyboard": storyboard_out,
        "reference_map": reference_map,
        "image_prompts": image_prompts,
        "video_prompts": video_prompts,
    }
