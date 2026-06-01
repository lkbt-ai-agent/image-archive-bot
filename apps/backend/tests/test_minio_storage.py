import io

from fastapi import UploadFile
from PIL import Image as PillowImage

from app.core.config import Settings
from app.models.image import Image


class FakeObjectResponse:
    def __init__(self, content: bytes) -> None:
        self._content = content
        self.closed = False
        self.released = False

    def read(self) -> bytes:
        return self._content

    def close(self) -> None:
        self.closed = True

    def release_conn(self) -> None:
        self.released = True


class FakeMinioClient:
    def __init__(self) -> None:
        self.buckets: set[str] = set()
        self.objects: dict[tuple[str, str], tuple[bytes, str | None]] = {}
        self.last_response: FakeObjectResponse | None = None

    def bucket_exists(self, bucket_name: str) -> bool:
        return bucket_name in self.buckets

    def make_bucket(self, bucket_name: str) -> None:
        self.buckets.add(bucket_name)

    def put_object(self, bucket_name: str, object_name: str, data, length: int, content_type: str | None = None):
        content = data.read()
        assert len(content) == length
        self.objects[(bucket_name, object_name)] = (content, content_type)

    def get_object(self, bucket_name: str, object_name: str) -> FakeObjectResponse:
        response = FakeObjectResponse(self.objects[(bucket_name, object_name)][0])
        self.last_response = response
        return response

    def remove_object(self, bucket_name: str, object_name: str) -> None:
        self.objects.pop((bucket_name, object_name), None)


def _png_bytes(width: int = 32, height: int = 24) -> bytes:
    buffer = io.BytesIO()
    PillowImage.new("RGB", (width, height), color=(60, 120, 180)).save(buffer, format="PNG")
    return buffer.getvalue()


def _settings() -> Settings:
    return Settings(
        storage_root="storage",
        minio_endpoint="http://minio.example.test:9000",
        minio_access_key="test-access",
        minio_secret_key="test-secret",
        minio_bucket="test-images",
    )


def test_upload_and_thumbnail_are_stored_under_storage_prefix(monkeypatch):
    from app.core import storage

    client = FakeMinioClient()
    monkeypatch.setattr(storage, "get_minio_client", lambda settings=None: client)
    settings = _settings()
    upload = UploadFile(file=io.BytesIO(_png_bytes()), filename="pytest-upload.png")
    upload.headers = {"content-type": "image/png"}

    stored = storage.save_upload(upload, settings)
    thumbnail_name, width, height = storage.create_thumbnail(stored.object_name, settings)

    assert stored.object_name.startswith("storage/originals/")
    assert thumbnail_name.startswith("storage/thumbnails/")
    assert width == 32
    assert height == 24
    assert (settings.minio_bucket, stored.object_name) in client.objects
    assert client.objects[(settings.minio_bucket, stored.object_name)][1] == "image/png"
    assert client.objects[(settings.minio_bucket, thumbnail_name)][1] == "image/jpeg"


def test_backend_loads_image_bytes_from_minio_bucket(monkeypatch):
    from app.core import storage
    from app.modules.archive import service

    client = FakeMinioClient()
    monkeypatch.setattr(storage, "get_minio_client", lambda settings=None: client)
    monkeypatch.setattr(service, "get_settings", _settings)
    settings = _settings()
    content = _png_bytes()
    object_name = "storage/originals/test-image.png"
    client.make_bucket(settings.minio_bucket)
    client.put_object(settings.minio_bucket, object_name, io.BytesIO(content), len(content), "image/png")
    image = Image(file_path=object_name, thumbnail_path=None, mime_type="image/png")

    loaded = service.load_image_bytes(image)

    assert loaded == content
    assert client.last_response is not None
    assert client.last_response.closed is True
    assert client.last_response.released is True
