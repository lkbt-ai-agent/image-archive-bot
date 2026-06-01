from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.generation.schemas import GenerationListOut, GenerationOut
from app.modules.generation.service import count_generations, get_generation, list_generations

router = APIRouter(prefix="/generation", tags=["generation"])


@router.get("", response_model=GenerationListOut)
def read_generations(
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return {"items": list_generations(db, limit, offset), "limit": limit, "offset": offset, "total": count_generations(db)}


@router.get("/{generation_id}", response_model=GenerationOut)
def read_generation(generation_id: UUID, db: Session = Depends(get_db)):
    generation = get_generation(db, generation_id)
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found.")
    return generation
