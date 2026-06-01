from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ImageMetadataOut(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] = Field(default_factory=list)
    objects: list[str] = Field(default_factory=list)
    colors: list[str] = Field(default_factory=list)
    people_count: int | None = None
    location_hint: str | None = None


class ImageOut(BaseModel):
    id: UUID
    source_type: str
    original_filename: str | None = None
    mime_type: str
    file_url: str
    thumbnail_url: str | None = None
    width: int | None = None
    height: int | None = None
    size_bytes: int | None = None
    sha256: str
    created_at: datetime
    metadata: ImageMetadataOut | None = None


class ImageListOut(BaseModel):
    items: list[ImageOut]
    limit: int
    offset: int
    total: int


class MetadataUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    objects: list[str] | None = None
    colors: list[str] | None = None
    people_count: int | None = None
    location_hint: str | None = None
