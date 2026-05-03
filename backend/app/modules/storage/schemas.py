"""Storage API schemas."""

from pydantic import BaseModel, Field


class UploadUrlRequest(BaseModel):
    object_key: str = Field(..., min_length=1, max_length=300)
    content_type: str = Field(..., min_length=1, max_length=100)
    expires_in: int = Field(default=600, ge=60, le=3600)


class UploadUrlResponse(BaseModel):
    object_key: str
    upload_url: str
    download_url: str
    expires_in: int
    provider: str
