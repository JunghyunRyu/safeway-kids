"""Storage HTTP endpoints — Tech Spec FR-3.3.

PT/CC 클라이언트가 사진을 직접 S3로 PUT 업로드하기 위해 presigned URL을 발급한다.
JWT auth 사용 (Firebase 듀얼 미들웨어 적용은 후속 마일스톤).
"""

import logging

from fastapi import APIRouter, Depends

from app.middleware.auth import get_current_user
from app.modules.auth.models import User
from app.modules.storage import get_storage
from app.modules.storage.schemas import UploadUrlRequest, UploadUrlResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload-url", response_model=UploadUrlResponse, status_code=201)
async def create_upload_url(
    body: UploadUrlRequest,
    user: User = Depends(get_current_user),
) -> UploadUrlResponse:
    """presigned PUT URL 발급."""
    storage = get_storage()
    presigned = await storage.presigned_put(
        object_key=body.object_key,
        content_type=body.content_type,
        expires_in=body.expires_in,
    )
    return UploadUrlResponse(
        object_key=presigned.object_key,
        upload_url=presigned.upload_url,
        download_url=presigned.download_url,
        expires_in=presigned.expires_in,
        provider=storage.name,
    )
