from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.openai_client import OpenAIServiceError
from app.modules.chat.schemas import ChatMessageCreate, ChatMessageResponse, ChatSessionCreate, ChatSessionDetail, ChatSessionOut
from app.modules.chat.service import create_session, get_session, list_sessions, post_user_message, serialize_message, serialize_session

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionOut)
def post_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    return serialize_session(create_session(db, payload.title))


@router.get("/sessions", response_model=list[ChatSessionOut])
def read_sessions(db: Session = Depends(get_db)):
    return [serialize_session(session) for session in list_sessions(db)]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def read_session(session_id: UUID, db: Session = Depends(get_db)):
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    payload = serialize_session(session)
    payload["messages"] = [serialize_message(message) for message in session.messages]
    return payload


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def post_message(session_id: UUID, payload: ChatMessageCreate, db: Session = Depends(get_db)):
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    try:
        return post_user_message(
            db,
            session,
            payload.content,
            payload.generation.model_dump() if payload.generation else None,
        )
    except OpenAIServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
