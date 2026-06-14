from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


def new_id() -> str:
    return str(uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(64), primary_key=True, default=new_id)
    title = Column(String(240), nullable=False)
    topic = Column(Text, nullable=False)
    aspect_ratio = Column(String(16), default="9:16", nullable=False)
    duration_sec = Column(Integer, default=60, nullable=False)
    style = Column(String(160), default="cinematic realism", nullable=False)
    status = Column(String(40), default="draft", nullable=False)
    current_stage = Column(String(80), default="created", nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    error = Column(Text, default="", nullable=False)
    script_text = Column(Text, default="", nullable=False)
    storyboard_json = Column(Text, default="", nullable=False)
    reference_map_json = Column(Text, default="", nullable=False)
    image_prompts_json = Column(Text, default="", nullable=False)
    video_prompts_json = Column(Text, default="", nullable=False)
    final_video_path = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    jobs = relationship("PipelineJob", back_populates="project", cascade="all, delete-orphan")
    events = relationship("PipelineEvent", back_populates="project", cascade="all, delete-orphan")


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    id = Column(String(64), primary_key=True, default=new_id)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False, index=True)
    stage = Column(String(80), nullable=False)
    status = Column(String(40), default="queued", nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    message = Column(Text, default="", nullable=False)
    error = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="jobs")


class PipelineEvent(Base):
    __tablename__ = "pipeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False, index=True)
    stage = Column(String(80), nullable=False)
    status = Column(String(40), nullable=False)
    message = Column(Text, default="", nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="events")
