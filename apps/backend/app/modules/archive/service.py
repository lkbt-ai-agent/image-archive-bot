import logging
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.storage import create_thumbnail, get_object_bytes, remove_object, save_upload, storage_prefix
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
    stored = save_upload(file)
    existing = db.scalar(select(Image).where(Image.sha256 == stored.sha256))
    if existing:
        remove_object(stored.object_name)
        return existing

    thumbnail_path, width, height = create_thumbnail(stored.object_name)
    image = Image(
        source_type="upload",
        original_filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_path=stored.object_name,
        thumbnail_path=thumbnail_path,
        width=width,
        height=height,
        size_bytes=stored.size_bytes,
        sha256=stored.sha256,
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


def load_image_bytes(image: Image, thumbnail: bool = False) -> bytes:
    object_name = image.thumbnail_path if thumbnail else image.file_path
    if not object_name:
        raise FileNotFoundError("Image file is not available.")
    settings = get_settings()
    prefix = storage_prefix(settings)
    if prefix and not object_name.startswith(f"{prefix}/"):
        raise FileNotFoundError("Image file is not available.")
    return get_object_bytes(object_name, settings)


def delete_image(db: Session, image: Image) -> None:
    object_names = [image.file_path, image.thumbnail_path]
    db.delete(image)
    db.commit()
    for object_name in object_names:
        remove_object(object_name)


def run_ingest_for_image(image_id: UUID) -> None:
    try:
        ingest_image_metadata(image_id)
    except Exception:
        logger.exception("Image ingestion failed for image_id=%s", image_id)
