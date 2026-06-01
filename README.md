
# image-archive-bot

챗봇형 (대화형) 이미지 아카이브 및 이미지 생성 웹 어플리케이션

## 개발 스펙
- Next.js + typescript
- shardcn/ui
- tailwindcss

## Backend Local Setup

The Phase 3-A backend lives in `apps/backend` and uses FastAPI, PostgreSQL + pgvector, local filesystem storage, and the real OpenAI API.

```bash
docker compose up -d postgres
cd apps/backend
python -m venv .venv
. .venv/bin/activate
pip install -e .
cp .env.example .env
```

Edit `apps/backend/.env`:

- Set `OPENAI_API_KEY` from your shell or local secret manager.
- Use the local Docker `DATABASE_URL` from `.env.example` on port `5433`, or another PostgreSQL database with the `vector` extension installed.
- Set `STORAGE_ROOT=../../storage` when running from `apps/backend`.

Run the API:

```bash
cd apps/backend
. .venv/bin/activate
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

API docs are available at `http://localhost:8000/docs`.
