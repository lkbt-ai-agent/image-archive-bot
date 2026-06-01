from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Generation(Base):
    __tablename__ = "generations"
    __table_args__ = (
        CheckConstraint("status IN ('queued', 'running', 'succeeded', 'failed')", name="generations_status_check"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID | None] = mapped_column(ForeignKey("chat_sessions.id", ondelete="SET NULL"))
    trigger_message_id: Mapped[UUID | None] = mapped_column(ForeignKey("chat_messages.id", ondelete="SET NULL"))
    assistant_message_id: Mapped[UUID | None] = mapped_column(ForeignKey("chat_messages.id", ondelete="SET NULL"))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    revised_prompt: Mapped[str | None] = mapped_column(Text)
    image_id: Mapped[UUID | None] = mapped_column(ForeignKey("images.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(Text, nullable=False, default="queued")
    error: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

