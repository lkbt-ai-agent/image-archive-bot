from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.archive.schemas import ImageOut


class GenerationOptions(BaseModel):
    size: str = Field(default="1024x1024", pattern="^(1024x1024|1024x1536|1536x1024|auto)$")
    save_to_archive: bool = True


class GenerationOut(BaseModel):
    id: UUID
    session_id: UUID | None = None
    trigger_message_id: UUID | None = None
    assistant_message_id: UUID | None = None
    prompt: str
    revised_prompt: str | None = None
    image_id: UUID | None = None
    image: ImageOut | None = None
    status: str
    error: str | None = None
    model: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class GenerationListOut(BaseModel):
    items: list[GenerationOut]
    limit: int
    offset: int
    total: int
