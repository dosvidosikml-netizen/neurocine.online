from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    title: str = Field(default="", max_length=240)
    topic: str = Field(min_length=3)
    aspect_ratio: str = Field(default="9:16")
    duration_sec: int = Field(default=60, ge=10, le=3600)
    style: str = Field(default="cinematic realism", max_length=160)


class ProjectUpdate(BaseModel):
    script_text: str | None = None
    storyboard_json: dict[str, Any] | None = None


class PipelineJobOut(BaseModel):
    id: str
    project_id: str
    stage: str
    status: str
    progress: int
    message: str = ""
    error: str = ""
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class PipelineEventOut(BaseModel):
    id: int
    project_id: str
    stage: str
    status: str
    message: str = ""
    progress: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: str
    title: str
    topic: str
    aspect_ratio: str
    duration_sec: int
    style: str
    status: str
    current_stage: str
    progress: int
    error: str = ""
    script_text: str = ""
    storyboard_json: dict[str, Any] | None = None
    reference_map_json: dict[str, Any] | None = None
    image_prompts_json: list[dict[str, Any]] | None = None
    video_prompts_json: list[dict[str, Any]] | None = None
    images_json: list[dict[str, Any]] | None = None
    final_video_path: str = ""
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectStatusOut(BaseModel):
    project: ProjectOut
    jobs: list[PipelineJobOut]
    events: list[PipelineEventOut]
