from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import init_db
from app.core.storage import ensure_storage_dirs
from app.modules.archive.router import router as archive_router
from app.modules.chat.router import router as chat_router
from app.modules.generation.router import router as generation_router
from app.modules.search.router import router as search_router

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_storage_dirs(settings)
    init_db()


@app.get(f"{settings.api_prefix}/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(archive_router, prefix=settings.api_prefix)
app.include_router(search_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)
app.include_router(generation_router, prefix=settings.api_prefix)

