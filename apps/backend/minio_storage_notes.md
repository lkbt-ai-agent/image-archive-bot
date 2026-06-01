# MinIO Image Storage Notes

## Connection

The backend image storage now uses the MinIO bucket described in `../../minio_config.md`.

- Endpoint: `http://49.247.14.186:9000`
- Bucket: `image-archive-bot`
- Object prefix: `storage/`

The runtime configuration is read from:

- `MINIO_ENDPOINT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `MINIO_SECURE`
- `STORAGE_ROOT`

`STORAGE_ROOT` is used as the object prefix in MinIO, so the default archive paths are:

- `storage/originals/<uuid>.<ext>`
- `storage/thumbnails/<uuid>.jpg`
- `storage/generated/<uuid>.png`

## Implementation

`app/core/storage.py` owns the MinIO client setup, bucket creation, object upload, object loading, thumbnail generation, and deletion.

The implementation follows the current MinIO Python SDK usage from Context7:

- Create a `Minio` client with endpoint, access key, secret key, and secure flag.
- Ensure the bucket with `bucket_exists` and `make_bucket`.
- Store image streams with `put_object(..., data=BytesIO(...), length=..., content_type=...)`.
- Load images with `get_object`, read the response, then call `close()` and `release_conn()`.
- Delete objects with `remove_object`.

Database image records now store MinIO object names instead of local filesystem paths.

## Verification

Focused backend tests were added in `tests/test_minio_storage.py`.

They verify:

- Uploaded images are stored under the `storage/originals/` MinIO prefix.
- Thumbnails are stored under the `storage/thumbnails/` MinIO prefix.
- The backend loading path fetches bytes from the configured MinIO bucket.
- MinIO object responses are closed and released after loading.
