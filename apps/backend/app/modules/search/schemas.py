from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.archive.schemas import ImageOut


class SemanticSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=24, ge=1, le=100)


class SearchResult(BaseModel):
    image: ImageOut
    score: float | None = None


class SearchResults(BaseModel):
    items: list[SearchResult]


class SimilarSearchRequest(BaseModel):
    limit: int = Field(default=12, ge=1, le=100)

