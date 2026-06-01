from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.openai_client import OpenAIServiceError
from app.modules.search.schemas import SearchResults, SemanticSearchRequest, SimilarSearchRequest
from app.modules.search.service import keyword_search, semantic_search, similar_search

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResults)
def search_images(
    q: str | None = Query(default=None),
    tags: list[str] = Query(default=[]),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return {"items": keyword_search(db, q=q, tags=tags, limit=limit, offset=offset)}


@router.post("/semantic", response_model=SearchResults)
def post_semantic_search(payload: SemanticSearchRequest, db: Session = Depends(get_db)):
    try:
        return {"items": semantic_search(db, payload.query, payload.limit)}
    except OpenAIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@router.post("/similar/{image_id}", response_model=SearchResults)
def post_similar_search(image_id: UUID, payload: SimilarSearchRequest, db: Session = Depends(get_db)):
    return {"items": similar_search(db, image_id, payload.limit)}
