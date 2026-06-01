from uuid import UUID

from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.openai_client import create_embedding
from app.models.image import Image, ImageEmbedding, ImageMetadata
from app.modules.archive.service import serialize_image


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(value) for value in values) + "]"


def keyword_search(db: Session, q: str | None, tags: list[str], limit: int, offset: int) -> list[dict]:
    query = select(Image).options(selectinload(Image.metadata_record)).outerjoin(ImageMetadata).order_by(Image.created_at.desc())
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                Image.original_filename.ilike(like),
                ImageMetadata.title.ilike(like),
                ImageMetadata.description.ilike(like),
            )
        )
    if tags:
        query = query.where(ImageMetadata.tags.contains(tags))
    images = db.scalars(query.limit(limit).offset(offset)).all()
    return [{"image": serialize_image(image), "score": None} for image in images]


def semantic_search(db: Session, query_text: str, limit: int) -> list[dict]:
    settings = get_settings()
    embedding = _vector_literal(create_embedding(query_text, settings))
    rows = db.execute(
        text(
            """
            SELECT i.id, 1 - (e.embedding <=> CAST(:embedding AS vector)) AS score
            FROM image_embeddings e
            JOIN images i ON i.id = e.image_id
            ORDER BY e.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """
        ),
        {"embedding": embedding, "limit": limit},
    ).all()
    if not rows:
        return []
    scores = {row.id: float(row.score) for row in rows}
    images = db.scalars(
        select(Image).options(selectinload(Image.metadata_record)).where(Image.id.in_(scores.keys()))
    ).all()
    by_id = {image.id: image for image in images}
    return [{"image": serialize_image(by_id[row.id]), "score": scores[row.id]} for row in rows if row.id in by_id]


def similar_search(db: Session, image_id: UUID, limit: int) -> list[dict]:
    embedding_record = db.get(ImageEmbedding, image_id)
    if not embedding_record:
        return []
    rows = db.execute(
        text(
            """
            SELECT i.id, 1 - (e.embedding <=> CAST(:embedding AS vector)) AS score
            FROM image_embeddings e
            JOIN images i ON i.id = e.image_id
            WHERE i.id != :image_id
            ORDER BY e.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """
        ),
        {"embedding": _vector_literal(embedding_record.embedding), "image_id": image_id, "limit": limit},
    ).all()
    scores = {row.id: float(row.score) for row in rows}
    images = db.scalars(
        select(Image).options(selectinload(Image.metadata_record)).where(Image.id.in_(scores.keys()))
    ).all()
    by_id = {image.id: image for image in images}
    return [{"image": serialize_image(by_id[row.id]), "score": scores[row.id]} for row in rows if row.id in by_id]
