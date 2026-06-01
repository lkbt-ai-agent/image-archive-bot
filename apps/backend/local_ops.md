# Local Ops

- Create `apps/backend/.env` locally from `.env.example`.
- Set `OPENAI_API_KEY` in the backend environment before testing AI workflows.
- Use either:
  - local Docker Postgres: `postgresql+psycopg://postgres:postgres@localhost:5433/image_archive_chat`
  - shared Postgres only if pgvector is installed and `CREATE EXTENSION vector` succeeds
- Keep `storage/` contents out of git except `.gitkeep` files.
