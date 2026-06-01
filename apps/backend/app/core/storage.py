import hashlib
import io
from dataclasses import dataclass
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error
from PIL import Image as PillowImage, UnidentifiedImageError

from app.core.config import Settings, get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
CHUNK_SIZE = 1024 * 1024


@dataclass(frozen=True)
class StoredObject:
    object_name: str
    size_bytes: int
    sha256: str


def storage_prefix(settings: Settings) -> str:
    raw_prefix = settings.storage_root.as_posix().strip("/")
    if not raw_prefix:
        return ""
    if settings.storage_root.is_absolute() or ".." in settings.storage_root.parts:
        return settings.storage_root.name
    return raw_prefix


def _object_name(settings: Settings, child: str, filename: str) -> str:
    prefix = storage_prefix(settings)
    return f"{prefix}/{child}/{filename}" if prefix else f"{child}/{filename}"


def _minio_endpoint(settings: Settings) -> tuple[str, bool]:
    parsed = urlparse(settings.minio_endpoint)
    if parsed.scheme:
        secure = parsed.scheme == "https" if settings.minio_secure is None else settings.minio_secure
        return parsed.netloc, secure
    return settings.minio_endpoint, bool(settings.minio_secure)


def get_minio_client(settings: Settings | None = None) -> Minio:
    settings = settings or get_settings()
    endpoint, secure = _minio_endpoint(settings)
    return Minio(
        endpoint=endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=secure,
    )


def ensure_storage_dirs(settings: Settings | None = None) -> None:
    settings = settings or get_settings()
    client = get_minio_client(settings)
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _validate_image_bytes(content: bytes, settings: Settings) -> None:
    try:
        with PillowImage.open(io.BytesIO(content)) as image:
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


def _put_object(object_name: str, content: bytes, content_type: str, settings: Settings) -> None:
    ensure_storage_dirs(settings)
    get_minio_client(settings).put_object(
        bucket_name=settings.minio_bucket,
        object_name=object_name,
        data=io.BytesIO(content),
        length=len(content),
        content_type=content_type,
    )


def save_upload(file: UploadFile, settings: Settings | None = None) -> StoredObject:
    settings = settings or get_settings()
    suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not suffix:
        raise ValueError("Only JPEG, PNG, and WebP images are supported.")
    buffer = io.BytesIO()
    size_bytes = 0
    while chunk := file.file.read(CHUNK_SIZE):
        size_bytes += len(chunk)
        if size_bytes > settings.max_upload_bytes:
            raise ValueError(f"Upload exceeds the {settings.max_upload_bytes} byte limit.")
        buffer.write(chunk)
    content = buffer.getvalue()
    _validate_image_bytes(content, settings)
    object_name = _object_name(settings, "originals", f"{uuid4()}{suffix}")
    _put_object(object_name, content, file.content_type or "application/octet-stream", settings)
    return StoredObject(object_name=object_name, size_bytes=size_bytes, sha256=sha256_bytes(content))


def save_generated_image(content: bytes, settings: Settings | None = None) -> StoredObject:
    settings = settings or get_settings()
    object_name = _object_name(settings, "generated", f"{uuid4()}.png")
    _put_object(object_name, content, "image/png", settings)
    return StoredObject(object_name=object_name, size_bytes=len(content), sha256=sha256_bytes(content))


def get_object_bytes(object_name: str, settings: Settings | None = None) -> bytes:
    settings = settings or get_settings()
    response = None
    try:
        response = get_minio_client(settings).get_object(settings.minio_bucket, object_name)
        return response.read()
    except S3Error as exc:
        if exc.code in {"NoSuchKey", "NoSuchBucket"}:
            raise FileNotFoundError("Image file is not available.") from exc
        raise
    finally:
        if response is not None:
            response.close()
            response.release_conn()


def remove_object(object_name: str | None, settings: Settings | None = None) -> None:
    if not object_name:
        return
    settings = settings or get_settings()
    try:
        get_minio_client(settings).remove_object(settings.minio_bucket, object_name)
    except S3Error as exc:
        if exc.code not in {"NoSuchKey", "NoSuchBucket"}:
            raise


def create_thumbnail(source_object_name: str, settings: Settings | None = None) -> tuple[str, int, int]:
    settings = settings or get_settings()
    source = get_object_bytes(source_object_name, settings)
    stem = source_object_name.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    object_name = _object_name(settings, "thumbnails", f"{stem}.jpg")
    with PillowImage.open(io.BytesIO(source)) as image:
        width, height = image.size
        image.thumbnail((512, 512))
        output = io.BytesIO()
        image.convert("RGB").save(output, "JPEG", quality=85)
    _put_object(object_name, output.getvalue(), "image/jpeg", settings)
    return object_name, width, height
