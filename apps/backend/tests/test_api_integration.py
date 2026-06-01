import io
from uuid import uuid4

import pytest
from PIL import Image as PillowImage
from sqlalchemy import create_engine, delete, select, text


DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/image_archive_chat"


@pytest.fixture()
def client(monkeypatch, tmp_path):
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.skip(f"PostgreSQL test database is unavailable: {exc}")

    monkeypatch.setenv("DATABASE_URL", DATABASE_URL)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("STORAGE_ROOT", str(tmp_path / "storage"))

    from fastapi.testclient import TestClient

    from app.core.db import SessionLocal, init_db
    from app.main import app
    from app.models.chat import ChatSession
    from app.models.generation import Generation
    from app.models.image import Image

    init_db()

    with TestClient(app) as test_client:
        yield test_client

    with SessionLocal() as db:
        image_ids = db.scalars(select(Image.id).where(Image.file_path.like(f"{tmp_path}%"))).all()
        if image_ids:
            db.execute(delete(Image).where(Image.id.in_(image_ids)))
        db.execute(delete(Generation).where(Generation.prompt.like("pytest-%")))
        db.execute(delete(ChatSession).where(ChatSession.title.like("pytest-%")))
        db.commit()


def _png_upload() -> tuple[str, io.BytesIO, str]:
    buffer = io.BytesIO()
    PillowImage.new("RGB", (32, 24), color=(60, 120, 180)).save(buffer, format="PNG")
    buffer.seek(0)
    return "pytest-upload.png", buffer, "image/png"


def test_archive_upload_update_search_and_delete(client, monkeypatch):
    monkeypatch.setattr("app.modules.archive.router.run_ingest_for_image", lambda image_id: None)

    upload_response = client.post("/api/archive/images", files={"file": _png_upload()})
    assert upload_response.status_code == 200
    image = upload_response.json()
    assert image["width"] == 32
    assert image["height"] == 24

    list_response = client.get("/api/archive/images")
    assert list_response.status_code == 200
    list_payload = list_response.json()
    assert "total" in list_payload
    assert any(item["id"] == image["id"] for item in list_payload["items"])

    metadata_response = client.patch(
        f"/api/archive/images/{image['id']}/metadata",
        json={"title": "pytest sunset", "tags": ["pytest", "sunset"]},
    )
    assert metadata_response.status_code == 200
    assert metadata_response.json()["metadata"]["title"] == "pytest sunset"

    search_response = client.get("/api/search", params={"q": "sunset", "tags": ["pytest"]})
    assert search_response.status_code == 200
    assert any(result["image"]["id"] == image["id"] for result in search_response.json()["items"])

    delete_response = client.delete(f"/api/archive/images/{image['id']}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/archive/images/{image['id']}").status_code == 404


def test_chat_session_and_message(client, monkeypatch):
    monkeypatch.setattr("app.modules.chat.service.chat_response", lambda input_text, instructions: ("pytest reply", "resp_test"))

    session_response = client.post("/api/chat/sessions", json={"title": "pytest-chat"})
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    message_response = client.post(f"/api/chat/sessions/{session_id}/messages", json={"content": "What is in the archive?"})
    assert message_response.status_code == 200
    payload = message_response.json()
    assert payload["assistant_message"]["content"] == "pytest reply"
    assert payload["assistant_message"]["openai_response_id"] == "resp_test"


def test_chat_generation_intent_routing():
    from app.modules.chat.service import _generation_prompt

    assert _generation_prompt("image generation: a clean product photo") == "a clean product photo"
    assert _generation_prompt("Please create an image of a red cabin at dusk") == "of a red cabin at dusk"
    assert _generation_prompt("Could you render a scene showing a neon city?") == "showing a neon city?"
    assert _generation_prompt("How do I generate an image from a prompt?") is None


def test_semantic_search_returns_clean_openai_error(client, monkeypatch):
    from app.core.openai_client import OpenAIServiceError

    def raise_openai_error(query_text, settings=None):
        raise OpenAIServiceError("OpenAI rate limit exceeded. Try again later.", status_code=429)

    monkeypatch.setattr("app.modules.search.service.create_embedding", raise_openai_error)

    response = client.post("/api/search/semantic", json={"query": "pytest query"})
    assert response.status_code == 429
    assert response.json()["detail"] == "OpenAI rate limit exceeded. Try again later."


def test_generation_retrieval(client):
    from app.core.db import SessionLocal
    from app.models.generation import Generation

    prompt = f"pytest-{uuid4()}"
    with SessionLocal() as db:
        generation = Generation(prompt=prompt, status="failed", error="pytest error", model="pytest-model")
        db.add(generation)
        db.commit()
        db.refresh(generation)
        generation_id = generation.id

    response = client.get(f"/api/generation/{generation_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["prompt"] == prompt
    assert payload["error"] == "pytest error"
