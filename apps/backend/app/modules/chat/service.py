import re
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.openai_client import chat_response
from app.models.chat import ChatMessage, ChatMessageImage, ChatSession
from app.models.generation import Generation
from app.models.image import Image
from app.modules.archive.service import serialize_image
from app.modules.generation.service import create_generation

GENERATION_COMMAND_RE = re.compile(
    r"^(?:please\s+)?(?:image generation|generate image|create image|make image|draw image)\s*:\s*(?P<prompt>.+)$",
    re.IGNORECASE | re.DOTALL,
)
GENERATION_REQUEST_RE = re.compile(
    r"^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?"
    r"(?P<verb>generate|create|make|draw|render)\s+"
    r"(?:an?\s+)?(?P<noun>image|picture|illustration|photo|scene)\s+"
    r"(?P<prompt>.+)$",
    re.IGNORECASE | re.DOTALL,
)
GENERATION_QUESTION_STARTS = ("how ", "what ", "why ", "when ", "where ", "who ")
ARCHIVE_REQUEST_RE = re.compile(
    r"(save|store|archive|저장|보관|아카이브).*(image|photo|picture|이미지|사진)|"
    r"(image|photo|picture|이미지|사진).*(save|store|archive|저장|보관|아카이브)",
    re.IGNORECASE | re.DOTALL,
)


def serialize_message(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "openai_response_id": message.openai_response_id,
        "created_at": message.created_at,
        "images": [serialize_image(image) for image in getattr(message, "images", [])],
    }


def serialize_session(session: ChatSession) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


def create_session(db: Session, title: str | None) -> ChatSession:
    session = ChatSession(title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_sessions(db: Session) -> list[ChatSession]:
    return list(db.scalars(select(ChatSession).order_by(ChatSession.updated_at.desc())))


def get_session(db: Session, session_id: UUID) -> ChatSession | None:
    return db.scalar(
        select(ChatSession)
        .options(
            selectinload(ChatSession.messages)
            .selectinload(ChatMessage.images)
            .selectinload(Image.metadata_record)
        )
        .where(ChatSession.id == session_id)
    )


def _generation_prompt(content: str) -> str | None:
    stripped = content.strip()
    lower = stripped.lower()
    if not stripped or lower.startswith(GENERATION_QUESTION_STARTS):
        return None

    command_match = GENERATION_COMMAND_RE.match(stripped)
    if command_match:
        return command_match.group("prompt").strip()

    request_match = GENERATION_REQUEST_RE.match(stripped)
    if request_match:
        prompt = request_match.group("prompt").strip()
        if prompt.lower().startswith(("of ", "showing ", "for ", "with ")):
            return prompt
        return stripped

    return None


def _history_text(messages: list[ChatMessage]) -> str:
    recent = messages[-12:]
    return "\n".join(f"{message.role}: {message.content}" for message in recent)


def _archive_request(content: str) -> bool:
    return bool(ARCHIVE_REQUEST_RE.search(content))


def _attached_images_text(images: list[Image]) -> str:
    if not images:
        return "No images are attached to the latest user message."
    lines = ["Attached images for the latest user message:"]
    for image in images:
        lines.append(
            "- "
            f"id={image.id}; "
            f"filename={image.original_filename or 'untitled'}; "
            f"source={image.source_type}; "
            f"size={image.width or '?'}x{image.height or '?'}"
        )
    return "\n".join(lines)


def _ordered_images(images: list[Image], image_ids: list[UUID]) -> list[Image]:
    by_id = {image.id: image for image in images}
    return [by_id[image_id] for image_id in image_ids if image_id in by_id]


def _attach_images_to_message(db: Session, message_id: UUID, images: list[Image]) -> None:
    for image in images:
        db.add(ChatMessageImage(message_id=message_id, image_id=image.id))


def _session_title_from_content(content: str) -> str:
    title = " ".join(content.split())
    if len(title) > 48:
        return f"{title[:45].rstrip()}..."
    return title or "Image workspace"


def _touch_session(session: ChatSession, content: str) -> None:
    if not session.title or session.title == "Image workspace":
        session.title = _session_title_from_content(content)
    session.updated_at = datetime.now(UTC)


def post_user_message(
    db: Session,
    session: ChatSession,
    content: str,
    generation_options: dict | None = None,
    image_ids: list[UUID] | None = None,
) -> dict:
    user_message = ChatMessage(session_id=session.id, role="user", content=content)
    _touch_session(session, content)
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    attached_images = []
    if image_ids:
        matched_images = list(
            db.scalars(
                select(Image)
                .options(selectinload(Image.metadata_record))
                .where(Image.id.in_(image_ids))
            )
        )
        attached_images = _ordered_images(matched_images, image_ids)
        _attach_images_to_message(db, user_message.id, attached_images)
        db.commit()

    prompt = _generation_prompt(content)
    if generation_options is not None and prompt is None:
        prompt = content

    generation_id = None
    image_id = None
    image_payload = None

    if prompt:
        size = (generation_options or {}).get("size", "1024x1024")
        generation, image = create_generation(
            db,
            prompt=prompt,
            size=size,
            session_id=session.id,
            trigger_message_id=user_message.id,
        )
        assistant_content = f"Generated an image and saved it to the archive: {prompt}"
        assistant_message = ChatMessage(session_id=session.id, role="assistant", content=assistant_content)
        db.add(assistant_message)
        db.flush()
        generation.assistant_message_id = assistant_message.id
        _attach_images_to_message(db, assistant_message.id, [image])
        db.commit()
        db.refresh(assistant_message)
        generation_id = generation.id
        image_id = image.id
        image_payload = serialize_image(image)
    elif attached_images and _archive_request(content):
        image_payload = serialize_image(attached_images[0])
        image_id = attached_images[0].id
        count_text = "image has" if len(attached_images) == 1 else f"{len(attached_images)} images have"
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=f"The {count_text} been saved successfully.",
        )
        db.add(assistant_message)
        db.flush()
        _attach_images_to_message(db, assistant_message.id, attached_images)
        db.commit()
        db.refresh(assistant_message)
    else:
        messages = list(
            db.scalars(
                select(ChatMessage)
                .where(ChatMessage.session_id == session.id)
                .order_by(ChatMessage.created_at.asc())
            )
        )
        instructions = (
            "You are an image archive assistant. Help users search, describe, compare, and plan image generation. "
            "Be concise. Use the attached image context when it is present, and do not ask the user to upload an "
            "image that is listed as attached."
        )
        response_text, response_id = chat_response(
            input_text=(
                f"Conversation so far:\n{_history_text(messages)}\n\n"
                f"{_attached_images_text(attached_images)}\n\n"
                "Reply to the latest user message."
            ),
            instructions=instructions,
        )
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text,
            openai_response_id=response_id,
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

    return {
        "user_message": serialize_message(user_message),
        "assistant_message": serialize_message(assistant_message),
        "generation_id": generation_id,
        "image_id": image_id,
        "image": image_payload,
    }
