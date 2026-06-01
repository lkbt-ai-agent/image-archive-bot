import base64
from pathlib import Path

from openai import APIConnectionError, APIError, APITimeoutError, AuthenticationError, BadRequestError, OpenAI, RateLimitError
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings


class ImageMetadataResult(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] = Field(default_factory=list)
    objects: list[str] = Field(default_factory=list)
    colors: list[str] = Field(default_factory=list)
    people_count: int | None = None
    location_hint: str | None = None


class OpenAIServiceError(RuntimeError):
    def __init__(self, message: str, *, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


def _openai_error_message(exc: Exception) -> tuple[str, int]:
    if isinstance(exc, AuthenticationError):
        return "OpenAI authentication failed. Check OPENAI_API_KEY.", 502
    if isinstance(exc, RateLimitError):
        return "OpenAI rate limit exceeded. Try again later.", 429
    if isinstance(exc, BadRequestError):
        return f"OpenAI rejected the request: {exc.message}", 400
    if isinstance(exc, (APITimeoutError, APIConnectionError)):
        return "OpenAI service is temporarily unreachable. Try again later.", 502
    if isinstance(exc, APIError):
        return "OpenAI service returned an error. Try again later.", 502
    return "OpenAI workflow failed."


def _raise_openai_error(exc: Exception) -> None:
    message, status_code = _openai_error_message(exc)
    raise OpenAIServiceError(message, status_code=status_code) from exc


def get_openai_client(settings: Settings | None = None) -> OpenAI:
    settings = settings or get_settings()
    if not settings.openai_api_key:
        raise OpenAIServiceError("OPENAI_API_KEY is required for OpenAI-backed workflows.", status_code=400)
    return OpenAI(api_key=settings.openai_api_key)


def _image_data_url(path: Path, mime_type: str) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def _image_bytes_data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def extract_image_metadata(
    path: Path | None = None,
    mime_type: str = "application/octet-stream",
    settings: Settings | None = None,
    image_bytes: bytes | None = None,
) -> ImageMetadataResult:
    settings = settings or get_settings()
    client = get_openai_client(settings)
    if image_bytes is None:
        if path is None:
            raise ValueError("Either path or image_bytes is required.")
        image_url = _image_data_url(path, mime_type)
    else:
        image_url = _image_bytes_data_url(image_bytes, mime_type)
    try:
        completion = client.chat.completions.parse(
            model=settings.metadata_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract concise archive metadata for the image. "
                        "Use short lowercase tags and visible-object names. "
                        "Do not invent people identities or exact locations."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this image for a searchable archive."},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                },
            ],
            response_format=ImageMetadataResult,
        )
    except (APIError, APIConnectionError, APITimeoutError, AuthenticationError, BadRequestError, RateLimitError) as exc:
        _raise_openai_error(exc)
    parsed = completion.choices[0].message.parsed
    if not parsed:
        raise OpenAIServiceError(
            completion.choices[0].message.refusal or "Metadata extraction returned no parsed result.",
            status_code=502,
        )
    return parsed


def build_embedding_text(metadata: ImageMetadataResult) -> str:
    parts = [
        metadata.title or "",
        metadata.description or "",
        f"Tags: {', '.join(metadata.tags)}" if metadata.tags else "",
        f"Objects: {', '.join(metadata.objects)}" if metadata.objects else "",
        f"Colors: {', '.join(metadata.colors)}" if metadata.colors else "",
        f"People count: {metadata.people_count}" if metadata.people_count is not None else "",
        f"Location hint: {metadata.location_hint}" if metadata.location_hint else "",
    ]
    return "\n".join(part for part in parts if part).strip() or "Untitled archived image"


def create_embedding(text_value: str, settings: Settings | None = None) -> list[float]:
    settings = settings or get_settings()
    client = get_openai_client(settings)
    try:
        response = client.embeddings.create(model=settings.embedding_model, input=text_value)
    except (APIError, APIConnectionError, APITimeoutError, AuthenticationError, BadRequestError, RateLimitError) as exc:
        _raise_openai_error(exc)
    return response.data[0].embedding


def chat_response(input_text: str, instructions: str, settings: Settings | None = None) -> tuple[str, str | None]:
    settings = settings or get_settings()
    client = get_openai_client(settings)
    try:
        response = client.responses.create(
            model=settings.chat_model,
            instructions=instructions,
            input=input_text,
        )
    except (APIError, APIConnectionError, APITimeoutError, AuthenticationError, BadRequestError, RateLimitError) as exc:
        _raise_openai_error(exc)
    return response.output_text, response.id


def generate_image(prompt: str, size: str, settings: Settings | None = None) -> tuple[bytes, str | None]:
    settings = settings or get_settings()
    client = get_openai_client(settings)
    try:
        response = client.images.generate(
            model=settings.image_model,
            prompt=prompt,
            n=1,
            size=size,
        )
    except (APIError, APIConnectionError, APITimeoutError, AuthenticationError, BadRequestError, RateLimitError) as exc:
        _raise_openai_error(exc)
    image = response.data[0]
    if not image.b64_json:
        raise OpenAIServiceError("OpenAI image generation did not return base64 image data.", status_code=502)
    return base64.b64decode(image.b64_json), image.revised_prompt
