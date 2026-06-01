# Architecture Design

Using Context7 and current OpenAI docs, I would choose **Python FastAPI** over NestJS for this project.

Reason: the backend is AI-heavy, file-heavy, and workflow-heavy. FastAPI keeps the OpenAI SDK, image processing, metadata extraction, embeddings, and background jobs in one Python stack with less ceremony. NestJS is fine if the team is strongly TypeScript-only, but for this app FastAPI is simpler and more maintainable.

## Recommended Architecture

```txt
image-archive-chat/
  apps/
    frontend/
      app/
        page.tsx
        chat/
        archive/
        generate/
        search/
      components/
      lib/
        api-client.ts
        types.ts
      public/

    backend/
      app/
        main.py
        core/
          config.py
          db.py
          openai_client.py
          storage.py
        modules/
          chat/
            router.py
            service.py
            schemas.py
          archive/
            router.py
            service.py
            schemas.py
          generation/
            router.py
            service.py
            schemas.py
          search/
            router.py
            service.py
            schemas.py
        models/
          image.py
          chat.py
          generation.py
        workers/
          image_ingest.py
        migrations/
      pyproject.toml

  storage/
    originals/
    thumbnails/
    generated/

  docker-compose.yml
  .env
```

## Core Choices

- Frontend: Next.js App Router.
- Backend: FastAPI.
- Relational DB: existing PostgreSQL.
- Vector DB: pgvector inside PostgreSQL, not a separate vector DB.
- File storage: local filesystem under `storage/`.
- AI:
  - Chat: OpenAI Responses API.
  - Image metadata extraction: vision-capable model + Structured Outputs.
  - Embeddings: OpenAI embeddings API, for example `text-embedding-3-small` to start.
  - Image generation: OpenAI image generation through Responses API or Images API.

pgvector is the practical choice because PostgreSQL is already available. It avoids another service while still supporting cosine search and HNSW indexing.

## Proposed DB Schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'generated')),
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  width INT,
  height INT,
  size_bytes BIGINT,
  sha256 TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE image_metadata (
  image_id UUID PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  objects TEXT[] NOT NULL DEFAULT '{}',
  colors TEXT[] NOT NULL DEFAULT '{}',
  people_count INT,
  location_hint TEXT,
  raw_ai_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE image_embeddings (
  image_id UUID PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
  embedding vector(1536),
  embedding_text TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX image_embeddings_hnsw_idx
ON image_embeddings
USING hnsw (embedding vector_cosine_ops);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  openai_response_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  trigger_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  assistant_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  revised_prompt TEXT,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  error TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

For OpenAI embeddings, `text-embedding-3-small` commonly uses 1536 dimensions. If you choose another embedding model or dimension, update `vector(1536)` accordingly.

## Main API Endpoints

### Health

```http
GET /api/health
```

### Archive

```http
POST   /api/archive/images
GET    /api/archive/images
GET    /api/archive/images/{image_id}
DELETE /api/archive/images/{image_id}
PATCH  /api/archive/images/{image_id}/metadata
GET    /api/archive/images/{image_id}/file
GET    /api/archive/images/{image_id}/thumbnail
```

### Search

```http
GET  /api/search?q=&tags=&limit=&offset=
POST /api/search/semantic
POST /api/search/similar/{image_id}
```

### Chat

```http
POST /api/chat/sessions
GET  /api/chat/sessions
GET  /api/chat/sessions/{session_id}
POST /api/chat/sessions/{session_id}/messages
```

### Generation

Image generation is primarily invoked by the backend from the chat flow when a user message requests it. Keep direct generation endpoints optional for admin tools, debugging, or future non-chat workflows.

```http
GET  /api/generation/{generation_id}
GET  /api/generation
```

### Example Request Shapes

```http
POST /api/search/semantic
```

```json
{
  "query": "red cyberpunk street scene at night",
  "limit": 24
}
```

```http
POST /api/chat/sessions/{session_id}/messages
```

```json
{
  "content": "image generation: A quiet retro-futuristic library with glowing archive terminals",
  "generation": {
    "size": "1024x1024",
    "save_to_archive": true
  }
}
```

## Request Flows

### 1. Image Upload

1. Frontend sends `multipart/form-data` to `POST /api/archive/images`.
2. FastAPI receives the image using `UploadFile`.
3. Backend validates MIME type, computes SHA-256, and stores the original file in `storage/originals/`.
4. Backend creates a thumbnail in `storage/thumbnails/`.
5. Backend inserts a row into `images`.
6. Background task calls an OpenAI vision model to extract structured metadata:
   - title
   - description
   - tags
   - visible objects
   - dominant colors
   - people count
   - location hint
7. Backend stores metadata in `image_metadata`.
8. Backend builds `embedding_text`, for example:

```txt
{title}
{description}
Tags: ...
Objects: ...
Colors: ...
```

9. Backend calls OpenAI embeddings API.
10. Backend stores the vector in `image_embeddings`.
11. Frontend can poll image detail or receive updated metadata later.

### 2. Archive Search

#### Keyword/filter search

1. Frontend calls `GET /api/search?q=sunset&tags=portrait`.
2. Backend queries `images` and `image_metadata` using SQL filters.
3. Backend returns paginated image cards.

#### Semantic search

1. Frontend calls `POST /api/search/semantic`.
2. Backend embeds the query text.
3. Backend runs pgvector cosine search:

```sql
SELECT
  i.*,
  m.title,
  m.description,
  1 - (e.embedding <=> :query_embedding) AS score
FROM image_embeddings e
JOIN images i ON i.id = e.image_id
LEFT JOIN image_metadata m ON m.image_id = i.id
ORDER BY e.embedding <=> :query_embedding
LIMIT :limit;
```

4. Frontend displays ranked archive results.

### 3. Chat Message Handling

1. Frontend creates or reuses a chat session.
2. User sends a message to `POST /api/chat/sessions/{session_id}/messages`.
3. Backend stores the user message in `chat_messages`.
4. Backend loads recent session messages from the same chat history, including normal messages, generation-triggering messages, assistant replies, and generated image references.
5. Backend detects whether the user message requests image generation using a simple intent rule, such as a specific phrase like `image generation`, or a later structured intent classifier.
6. If no generation is requested, backend calls the OpenAI Responses API and stores the assistant message.
7. If generation is requested, backend invokes the generation module internally, then stores the assistant message with the generated image reference.
8. Backend returns a chat response payload containing the assistant message and, when applicable, `generation_id`, `image_id`, and image URL/path.

Optional later enhancement: if the user asks about archived images, the chat service can call the search module internally and include relevant image metadata as context.

### 4. Internal Image Generation

1. Chat service receives a generation-triggering user message from `POST /api/chat/sessions/{session_id}/messages`.
2. Chat service calls the generation module internally with `session_id`, `trigger_message_id`, prompt, and generation options.
3. Generation module creates a `generations` row with `queued` or `running`.
4. Generation module calls OpenAI image generation.
5. Backend decodes and saves the result under `storage/generated/`.
6. Backend inserts the generated image into `images` with `source_type = 'generated'`.
7. Backend stores the generation record linked to `image_id`.
8. Backend runs the same metadata extraction and embedding pipeline used by uploads.
9. Chat service stores the assistant message and links `generations.assistant_message_id`.
10. Frontend receives the assistant chat message with the generated image, `generation_id`, and archive `image_id`.

## Module Boundaries

- `chat` owns chat sessions, unified message history, intent routing, and OpenAI text responses.
- `archive` owns image records, local file paths, thumbnails, and metadata edits.
- `generation` owns prompt-to-image workflows and generated image records, but is normally invoked by `chat` rather than directly by the frontend.
- `search` owns keyword, filter, semantic, and similar-image search.
- Shared services:
  - `openai_client.py`
  - `storage.py`
  - `db.py`
  - config/env handling

## Local Development

Use one `docker-compose.yml` with:

```txt
postgres + pgvector
backend FastAPI
frontend Next.js
```

Store images on the host filesystem with a mounted `./storage` directory. Avoid S3, queues, Redis, or a separate vector DB until the app needs them. FastAPI `BackgroundTasks` is enough for Phase 2/local development; move to Celery/RQ only if ingestion becomes slow or unreliable.

## References Used

- Next.js App Router docs via Context7: server components, route handlers, env usage.
- FastAPI docs via Context7: `APIRouter`, `UploadFile`, background-oriented API structure.
- pgvector docs via Context7: `vector`, cosine distance, HNSW indexes.
- OpenAI docs: Responses API, vision/image inputs, Structured Outputs, embeddings, image generation.
