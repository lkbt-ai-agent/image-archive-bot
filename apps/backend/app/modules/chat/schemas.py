from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.archive.schemas import ImageOut
from app.modules.generation.schemas import GenerationOptions


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    generation: GenerationOptions | None = None
    image_ids: list[UUID] = Field(default_factory=list)


class ChatMessageOut(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    openai_response_id: str | None = None
    created_at: datetime
    images: list[ImageOut] = Field(default_factory=list)


class ChatSessionOut(BaseModel):
    id: UUID
    title: str | None = None
    created_at: datetime
    updated_at: datetime


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut]


class ChatMessageResponse(BaseModel):
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut
    generation_id: UUID | None = None
    image_id: UUID | None = None
    image: ImageOut | None = None
