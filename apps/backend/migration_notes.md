# Backend Migration Notes

- Alembic migration support was added for shared/staging/prod schema evolution.
- Initial migration: `20260601_0001_initial_pgvector_schema`.
- The migration creates `vector`, `pgcrypto`, all backend tables, `image_embeddings.embedding vector(1536)`, and `image_embeddings_hnsw_idx`.
- The database configured by `apps/backend/.env` was migrated to revision `20260601_0001`.
- Verification passed: extensions, tables, vector column type, HNSW index, and cosine ordering via `<=>`.
- Migration test: `tests/test_alembic_migrations.py`.
