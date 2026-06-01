from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.archive.schemas import ImageListOut, ImageOut, MetadataUpdate
from app.modules.archive.service import (
    count_images,
    create_uploaded_image,
    delete_image as delete_image_record,
    get_image,
    list_images,
    resolve_image_path,
    run_ingest_for_image,
    serialize_image,
    update_metadata,
)

router = APIRouter(prefix="/archive", tags=["archive"])


@router.post("/images", response_model=ImageOut)
def upload_image(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        image = create_uploaded_image(db, file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    background_tasks.add_task(run_ingest_for_image, image.id)
    return serialize_image(image)


@router.get("/images", response_model=ImageListOut)
def read_images(
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    source_type: str | None = Query(default=None, pattern="^(upload|generated)$"),
    db: Session = Depends(get_db),
):
    images = list_images(db, limit=limit, offset=offset, source_type=source_type)
    return {
        "items": [serialize_image(image) for image in images],
        "limit": limit,
        "offset": offset,
        "total": count_images(db, source_type=source_type),
    }


@router.get("/images/{image_id}", response_model=ImageOut)
def read_image(image_id: UUID, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    return serialize_image(image)


@router.patch("/images/{image_id}/metadata", response_model=ImageOut)
def patch_metadata(image_id: UUID, payload: MetadataUpdate, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    update_metadata(db, image, payload.model_dump(exclude_unset=True))
    db.refresh(image)
    return serialize_image(get_image(db, image_id) or image)


@router.delete("/images/{image_id}", status_code=204)
def delete_image(image_id: UUID, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    delete_image_record(db, image)


@router.get("/images/{image_id}/file")
def image_file(image_id: UUID, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    try:
        path = resolve_image_path(image)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(path, media_type=image.mime_type, filename=image.original_filename)


@router.get("/images/{image_id}/thumbnail")
def image_thumbnail(image_id: UUID, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    try:
        path = resolve_image_path(image, thumbnail=True)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(path, media_type="image/jpeg")
