from datetime import datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Image(Base):
    __tablename__ = "images"
    __table_args__ = (CheckConstraint("source_type IN ('upload', 'generated')", name="images_source_type_check"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    source_type: Mapped[str] = mapped_column(Text, nullable=False)
    original_filename: Mapped[str | None] = mapped_column(Text)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(Text)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    metadata_record: Mapped["ImageMetadata | None"] = relationship(back_populates="image", cascade="all, delete-orphan")
    embedding_record: Mapped["ImageEmbedding | None"] = relationship(back_populates="image", cascade="all, delete-orphan")


class ImageMetadata(Base):
    __tablename__ = "image_metadata"

    image_id: Mapped[UUID] = mapped_column(ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    title: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    objects: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    colors: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    people_count: Mapped[int | None] = mapped_column(Integer)
    location_hint: Mapped[str | None] = mapped_column(Text)
    raw_ai_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    image: Mapped[Image] = relationship(back_populates="metadata_record")


class ImageEmbedding(Base):
    __tablename__ = "image_embeddings"

    image_id: Mapped[UUID] = mapped_column(ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=False)
    embedding_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    image: Mapped[Image] = relationship(back_populates="embedding_record")

