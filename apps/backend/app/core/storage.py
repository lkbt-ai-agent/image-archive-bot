import hashlib
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image as PillowImage, UnidentifiedImageError

from app.core.config import Settings, get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
CHUNK_SIZE = 1024 * 1024


def ensure_storage_dirs(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    for child in ("originals", "thumbnails", "generated"):
        (settings.storage_root / child).mkdir(parents=True, exist_ok=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _validate_image_file(path: Path, settings: Settings) -> None:
    try:
        with PillowImage.open(path) as image:
            width, height = image.size
            if width > settings.max_image_width or height > settings.max_image_height:
                raise ValueError(
                    f"Image dimensions exceed the limit of {settings.max_image_width}x{settings.max_image_height}."
                )
            if width * height > settings.max_image_pixels:
                raise ValueError(f"Image pixel count exceeds the limit of {settings.max_image_pixels}.")
            image.verify()
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc


def save_upload(file: UploadFile, settings: Settings | None = None) -> tuple[Path, int, str]:
    settings = settings or get_settings()
    ensure_storage_dirs(settings)
    suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not suffix:
        raise ValueError("Only JPEG, PNG, and WebP images are supported.")
    destination = settings.storage_root / "originals" / f"{uuid4()}{suffix}"
    size_bytes = 0
    try:
        with destination.open("wb") as handle:
            while chunk := file.file.read(CHUNK_SIZE):
                size_bytes += len(chunk)
                if size_bytes > settings.max_upload_bytes:
                    raise ValueError(f"Upload exceeds the {settings.max_upload_bytes} byte limit.")
                handle.write(chunk)
        _validate_image_file(destination, settings)
        return destination, size_bytes, sha256_file(destination)
    except Exception:
        destination.unlink(missing_ok=True)
        raise


def save_generated_image(content: bytes, settings: Settings | None = None) -> tuple[Path, int, str]:
    settings = settings or get_settings()
    ensure_storage_dirs(settings)
    destination = settings.storage_root / "generated" / f"{uuid4()}.png"
    destination.write_bytes(content)
    return destination, destination.stat().st_size, sha256_file(destination)


def create_thumbnail(source: Path, settings: Settings | None = None) -> tuple[Path, int, int]:
    settings = settings or get_settings()
    ensure_storage_dirs(settings)
    destination = settings.storage_root / "thumbnails" / f"{source.stem}.jpg"
    with PillowImage.open(source) as image:
        width, height = image.size
        image.thumbnail((512, 512))
        image.convert("RGB").save(destination, "JPEG", quality=85)
    return destination, width, height
