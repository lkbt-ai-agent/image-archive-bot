import logging
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.storage import create_thumbnail, save_upload
from app.models.image import Image, ImageMetadata
from app.workers.image_ingest import ingest_image_metadata

logger = logging.getLogger(__name__)


def _metadata_out(metadata: ImageMetadata | None) -> dict | None:
    if not metadata:
        return None
    return {
        "title": metadata.title,
        "description": metadata.description,
        "tags": metadata.tags or [],
        "objects": metadata.objects or [],
        "colors": metadata.colors or [],
        "people_count": metadata.people_count,
        "location_hint": metadata.location_hint,
    }


def serialize_image(image: Image) -> dict:
    return {
        "id": image.id,
        "source_type": image.source_type,
        "original_filename": image.original_filename,
        "mime_type": image.mime_type,
        "file_url": f"/api/archive/images/{image.id}/file",
        "thumbnail_url": f"/api/archive/images/{image.id}/thumbnail" if image.thumbnail_path else None,
        "width": image.width,
        "height": image.height,
        "size_bytes": image.size_bytes,
        "sha256": image.sha256,
        "created_at": image.created_at,
        "metadata": _metadata_out(image.metadata_record),
    }


def create_uploaded_image(db: Session, file: UploadFile) -> Image:
    path, size_bytes, digest = save_upload(file)
    existing = db.scalar(select(Image).where(Image.sha256 == digest))
    if existing:
        path.unlink(missing_ok=True)
        return existing

    thumbnail_path, width, height = create_thumbnail(path)
    image = Image(
        source_type="upload",
        original_filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_path=str(path),
        thumbnail_path=str(thumbnail_path),
        width=width,
        height=height,
        size_bytes=size_bytes,
        sha256=digest,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def list_images(db: Session, limit: int, offset: int, source_type: str | None = None) -> list[Image]:
    query = select(Image).options(selectinload(Image.metadata_record)).order_by(Image.created_at.desc())
    if source_type:
        query = query.where(Image.source_type == source_type)
    return list(db.scalars(query.limit(limit).offset(offset)))


def count_images(db: Session, source_type: str | None = None) -> int:
    query = select(func.count()).select_from(Image)
    if source_type:
        query = query.where(Image.source_type == source_type)
    return db.scalar(query) or 0


def get_image(db: Session, image_id: UUID) -> Image | None:
    return db.scalar(
        select(Image).options(selectinload(Image.metadata_record)).where(Image.id == image_id)
    )


def update_metadata(db: Session, image: Image, payload: dict) -> ImageMetadata:
    metadata = db.get(ImageMetadata, image.id)
    if not metadata:
        metadata = ImageMetadata(image_id=image.id, tags=[], objects=[], colors=[])
        db.add(metadata)
    for key, value in payload.items():
        if value is not None:
            setattr(metadata, key, value)
    db.commit()
    db.refresh(metadata)
    return metadata


def resolve_image_path(image: Image, thumbnail: bool = False) -> Path:
    path_value = image.thumbnail_path if thumbnail else image.file_path
    if not path_value:
        raise FileNotFoundError("Image file is not available.")
    path = Path(path_value)
    settings = get_settings()
    if not path.exists() or settings.storage_root.resolve() not in path.resolve().parents:
        raise FileNotFoundError("Image file is not available.")
    return path


def _stored_path(path_value: str | None) -> Path | None:
    if not path_value:
        return None
    path = Path(path_value)
    settings = get_settings()
    try:
        resolved = path.resolve()
    except FileNotFoundError:
        return path
    if settings.storage_root.resolve() not in resolved.parents:
        return None
    return path


def delete_image(db: Session, image: Image) -> None:
    file_paths = [
        path
        for path in (_stored_path(image.file_path), _stored_path(image.thumbnail_path))
        if path is not None
    ]
    db.delete(image)
    db.commit()
    for path in file_paths:
        path.unlink(missing_ok=True)


def run_ingest_for_image(image_id: UUID) -> None:
    try:
        ingest_image_metadata(image_id)
    except Exception:
        logger.exception("Image ingestion failed for image_id=%s", image_id)
