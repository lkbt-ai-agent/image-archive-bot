import os
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text


ADMIN_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"
LOCAL_DATABASE_URL_TEMPLATE = "postgresql+psycopg://postgres:postgres@localhost:5433/{database}"


def _vector_literal(first: float, second: float = 0.0) -> str:
    values = [0.0] * 1536
    values[0] = first
    values[1] = second
    return "[" + ",".join(str(value) for value in values) + "]"


@pytest.fixture()
def migrated_database():
    admin_engine = create_engine(ADMIN_DATABASE_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)
    database_name = f"pytest_alembic_{uuid4().hex}"
    try:
        with admin_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.execute(text(f'CREATE DATABASE "{database_name}"'))
    except Exception as exc:
        pytest.skip(f"Local PostgreSQL admin database is unavailable: {exc}")

    database_url = LOCAL_DATABASE_URL_TEMPLATE.format(database=database_name)
    backend_dir = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["DATABASE_URL"] = database_url

    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
            cwd=backend_dir,
            env=env,
            check=False,
            capture_output=True,
            text=True,
            timeout=60,
        )
        assert result.returncode == 0, result.stderr
        yield database_url
    finally:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    """
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = :database_name AND pid <> pg_backend_pid()
                    """
                ),
                {"database_name": database_name},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{database_name}"'))
        admin_engine.dispose()


def test_alembic_upgrade_creates_pgvector_schema_and_similarity_works(migrated_database):
    engine = create_engine(migrated_database, pool_pre_ping=True)
    try:
        with engine.begin() as conn:
            extensions = set(conn.scalars(text("SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pgcrypto')")))
            assert extensions == {"vector", "pgcrypto"}

            tables = set(
                conn.scalars(
                    text(
                        """
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                        """
                    )
                )
            )
            assert {
                "alembic_version",
                "images",
                "image_metadata",
                "image_embeddings",
                "chat_sessions",
                "chat_messages",
                "generations",
            }.issubset(tables)

            index_name = conn.scalar(text("SELECT to_regclass('public.image_embeddings_hnsw_idx')"))
            assert index_name == "image_embeddings_hnsw_idx"

            for filename, embedding_text, vector in [
                ("near.png", "near vector", _vector_literal(1.0, 0.0)),
                ("far.png", "far vector", _vector_literal(0.0, 1.0)),
            ]:
                conn.execute(
                    text(
                        """
                        WITH image_row AS (
                            INSERT INTO images (
                                id, source_type, original_filename, mime_type,
                                file_path, size_bytes, sha256
                            )
                            VALUES (
                                gen_random_uuid(), 'upload', :filename, 'image/png',
                                :file_path, 1, :sha256
                            )
                            RETURNING id
                        )
                        INSERT INTO image_embeddings (image_id, embedding, embedding_text, model)
                        SELECT id, CAST(:embedding AS vector), :embedding_text, 'pytest-model'
                        FROM image_row
                        """
                    ),
                    {
                        "filename": filename,
                        "file_path": f"/tmp/{filename}",
                        "sha256": uuid4().hex,
                        "embedding": vector,
                        "embedding_text": embedding_text,
                    },
                )

            rows = conn.execute(
                text(
                    """
                    SELECT embedding_text
                    FROM image_embeddings
                    ORDER BY embedding <=> CAST(:query_embedding AS vector)
                    """
                ),
                {"query_embedding": _vector_literal(1.0, 0.0)},
            ).all()
            assert [row.embedding_text for row in rows] == ["near vector", "far vector"]
    finally:
        engine.dispose()
