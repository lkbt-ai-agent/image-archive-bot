import re
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.openai_client import chat_response
from app.models.chat import ChatMessage, ChatSession
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


def serialize_message(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "openai_response_id": message.openai_response_id,
        "created_at": message.created_at,
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
    return db.scalar(select(ChatSession).options(selectinload(ChatSession.messages)).where(ChatSession.id == session_id))


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


def post_user_message(db: Session, session: ChatSession, content: str, generation_options: dict | None = None) -> dict:
    user_message = ChatMessage(session_id=session.id, role="user", content=content)
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

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
        db.commit()
        db.refresh(assistant_message)
        generation_id = generation.id
        image_id = image.id
        image_payload = serialize_image(image)
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
            "Be concise and mention that image generation can be requested with 'image generation:' when relevant."
        )
        response_text, response_id = chat_response(
            input_text=f"Conversation so far:\n{_history_text(messages)}\n\nReply to the latest user message.",
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
