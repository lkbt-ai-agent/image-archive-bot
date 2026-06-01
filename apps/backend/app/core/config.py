from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Image Archive Chat API"
    api_prefix: str = "/api"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5433/image_archive_chat",
        validation_alias="DATABASE_URL",
    )
    openai_api_key: str | None = Field(default=None, validation_alias="OPENAI_API_KEY")
    storage_root: Path = Field(default=Path("storage"), validation_alias="STORAGE_ROOT")
    cors_origins: str = Field(default="http://localhost:3000", validation_alias="CORS_ORIGINS")
    chat_model: str = Field(default="gpt-5.5", validation_alias="OPENAI_CHAT_MODEL")
    metadata_model: str = Field(default="gpt-4o-2024-08-06", validation_alias="OPENAI_METADATA_MODEL")
    embedding_model: str = Field(default="text-embedding-3-small", validation_alias="OPENAI_EMBEDDING_MODEL")
    image_model: str = Field(default="gpt-image-1.5", validation_alias="OPENAI_IMAGE_MODEL")
    embedding_dimensions: int = Field(default=1536, validation_alias="OPENAI_EMBEDDING_DIMENSIONS")
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, validation_alias="MAX_UPLOAD_BYTES")
    max_image_width: int = Field(default=12000, validation_alias="MAX_IMAGE_WIDTH")
    max_image_height: int = Field(default=12000, validation_alias="MAX_IMAGE_HEIGHT")
    max_image_pixels: int = Field(default=40_000_000, validation_alias="MAX_IMAGE_PIXELS")

    @property
    def parsed_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
