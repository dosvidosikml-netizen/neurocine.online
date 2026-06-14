from typing import Any

from pydantic import BaseModel, Field


class StoryboardScene(BaseModel):
    id: str
    start: float = 0
    duration: float = 3
    source_line_ru: str = ""
    description_ru: str
    image_prompt_en: str = ""
    video_prompt_en: str = ""
    characters: list[str] = Field(default_factory=list)
    location: str = ""
    camera: str = ""
    sound: str = ""


class StoryboardDocument(BaseModel):
    project_id: str
    title: str
    aspect_ratio: str
    duration_sec: int
    style: str
    scenes: list[StoryboardScene]
    reference_map: dict[str, Any] = Field(default_factory=dict)
    image_prompts: list[dict[str, Any]] = Field(default_factory=list)
    video_prompts: list[dict[str, Any]] = Field(default_factory=list)
