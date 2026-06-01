
# image-archive-bot

챗봇형 (대화형) 이미지 아카이브 및 이미지 생성 웹 어플리케이션

## 개발 스펙
- Next.js + typescript
- shardcn/ui
- tailwindcss

## Local Start Commands

### 1. Required service

```bash
docker compose up -d postgres
```

### 2. Backend API

Run once:

```bash
cd apps/backend
python -m venv .venv
. .venv/bin/activate
pip install -e .
cp .env.example .env
```

Edit `apps/backend/.env` with the required `OPENAI_API_KEY`, database, and MinIO values.

Start:

```bash
cd apps/backend
. .venv/bin/activate
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000/api`
- Docs: `http://localhost:8000/docs`
- Health: `curl http://localhost:8000/api/health`

### 3. Frontend

Run once:

```bash
cd apps/frontend
npm install
```

Start:

```bash
cd apps/frontend
npm run dev
```

- App: `http://localhost:3000`
