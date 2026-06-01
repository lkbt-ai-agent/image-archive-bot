from uuid import UUID
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.openai_client import build_embedding_text, create_embedding, extract_image_metadata
from app.models.image import Image, ImageEmbedding, ImageMetadata


def ingest_image_metadata(image_id: UUID) -> None:
    settings = get_settings()
    with SessionLocal() as db:
        image = db.get(Image, image_id)
        if not image:
            return
        metadata = extract_image_metadata(path=Path(image.file_path), mime_type=image.mime_type)
        embedding_text = build_embedding_text(metadata)
        embedding = create_embedding(embedding_text, settings)

        metadata_values = {
            "image_id": image.id,
            "title": metadata.title,
            "description": metadata.description,
            "tags": metadata.tags,
            "objects": metadata.objects,
            "colors": metadata.colors,
            "people_count": metadata.people_count,
            "location_hint": metadata.location_hint,
            "raw_ai_json": metadata.model_dump(),
        }
        db.execute(
            insert(ImageMetadata)
            .values(**metadata_values)
            .on_conflict_do_update(index_elements=[ImageMetadata.image_id], set_=metadata_values)
        )
        embedding_values = {
            "image_id": image.id,
            "embedding": embedding,
            "embedding_text": embedding_text,
            "model": settings.embedding_model,
        }
        db.execute(
            insert(ImageEmbedding)
            .values(**embedding_values)
            .on_conflict_do_update(index_elements=[ImageEmbedding.image_id], set_=embedding_values)
        )
        db.commit()
