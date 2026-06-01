from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.openai_client import generate_image
from app.core.storage import create_thumbnail, save_generated_image
from app.models.generation import Generation
from app.models.image import Image
from app.modules.archive.service import serialize_image
from app.workers.image_ingest import ingest_image_metadata


def serialize_generation(generation: Generation, image: Image | None = None) -> dict:
    return {
        "id": generation.id,
        "session_id": generation.session_id,
        "trigger_message_id": generation.trigger_message_id,
        "assistant_message_id": generation.assistant_message_id,
        "prompt": generation.prompt,
        "revised_prompt": generation.revised_prompt,
        "image_id": generation.image_id,
        "image": serialize_image(image) if image else None,
        "status": generation.status,
        "error": generation.error,
        "model": generation.model,
        "created_at": generation.created_at,
        "completed_at": generation.completed_at,
    }


def create_generation(
    db: Session,
    prompt: str,
    size: str = "1024x1024",
    session_id: UUID | None = None,
    trigger_message_id: UUID | None = None,
) -> tuple[Generation, Image]:
    settings = get_settings()
    generation = Generation(
        session_id=session_id,
        trigger_message_id=trigger_message_id,
        prompt=prompt,
        status="running",
        model=settings.image_model,
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    try:
        content, revised_prompt = generate_image(prompt, size, settings)
        stored = save_generated_image(content, settings)
        thumbnail_path, width, height = create_thumbnail(stored.object_name, settings)
        image = Image(
            source_type="generated",
            original_filename=f"{generation.id}.png",
            mime_type="image/png",
            file_path=stored.object_name,
            thumbnail_path=thumbnail_path,
            width=width,
            height=height,
            size_bytes=stored.size_bytes,
            sha256=stored.sha256,
        )
        db.add(image)
        db.flush()
        generation.revised_prompt = revised_prompt
        generation.image_id = image.id
        generation.status = "succeeded"
        generation.completed_at = datetime.now(UTC)
        db.commit()
        db.refresh(generation)
        db.refresh(image)
        ingest_image_metadata(image.id)
        return generation, image
    except Exception as exc:
        generation.status = "failed"
        generation.error = str(exc)
        generation.completed_at = datetime.now(UTC)
        db.commit()
        raise


def list_generations(db: Session, limit: int, offset: int) -> list[dict]:
    generations = db.scalars(select(Generation).order_by(Generation.created_at.desc()).limit(limit).offset(offset)).all()
    image_ids = [generation.image_id for generation in generations if generation.image_id]
    images = db.scalars(
        select(Image).options(selectinload(Image.metadata_record)).where(Image.id.in_(image_ids))
    ).all() if image_ids else []
    by_id = {image.id: image for image in images}
    return [serialize_generation(generation, by_id.get(generation.image_id)) for generation in generations]


def count_generations(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Generation)) or 0


def get_generation(db: Session, generation_id: UUID) -> dict | None:
    generation = db.get(Generation, generation_id)
    if not generation:
        return None
    image = None
    if generation.image_id:
        image = db.scalar(select(Image).options(selectinload(Image.metadata_record)).where(Image.id == generation.image_id))
    return serialize_generation(generation, image)
