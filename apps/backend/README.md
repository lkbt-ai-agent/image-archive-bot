# Backend

FastAPI backend for image archive upload, metadata extraction, semantic search, chat, and OpenAI image generation.

## Setup

```bash
cd apps/backend
python -m venv .venv
. .venv/bin/activate
pip install -e .
cp .env.example .env
```

Set `OPENAI_API_KEY` in `.env`. Keep the local Docker `DATABASE_URL` from `.env.example`, or set `DATABASE_URL` to another PostgreSQL database where the `vector` extension is installed.

Upload validation is controlled by:

- `MAX_UPLOAD_BYTES`
- `MAX_IMAGE_WIDTH`
- `MAX_IMAGE_HEIGHT`
- `MAX_IMAGE_PIXELS`

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API is served at `http://localhost:8000/api`. Swagger docs are available at `http://localhost:8000/docs`.

## Migrations

Alembic manages shared/staging/prod schema changes.

```bash
cd apps/backend
. .venv/bin/activate
alembic -c alembic.ini upgrade head
```

The initial migration creates:

- `vector` and `pgcrypto` extensions
- `images`
- `image_metadata`
- `image_embeddings` with `vector(1536)`
- `chat_sessions`
- `chat_messages`
- `generations`
- `image_embeddings_hnsw_idx`

## Required Services

- PostgreSQL with the `vector` extension available. Startup runs `CREATE EXTENSION IF NOT EXISTS vector`.
- OpenAI API access through `OPENAI_API_KEY`.
- Local filesystem storage through `STORAGE_ROOT`.

## Main Endpoints

- `GET /api/health`
- `POST /api/archive/images`
- `GET /api/archive/images`
- `GET /api/archive/images/{image_id}`
- `PATCH /api/archive/images/{image_id}/metadata`
- `DELETE /api/archive/images/{image_id}`
- `GET /api/archive/images/{image_id}/file`
- `GET /api/archive/images/{image_id}/thumbnail`
- `GET /api/search`
- `POST /api/search/semantic`
- `POST /api/search/similar/{image_id}`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/{session_id}`
- `POST /api/chat/sessions/{session_id}/messages`
- `GET /api/generation`
- `GET /api/generation/{generation_id}`

To trigger image generation from chat, send a message beginning with `image generation:` or a direct request such as `create an image of ...`.
