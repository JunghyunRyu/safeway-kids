"""Local-disk storage provider — dev fallback (S3 자격증명 없을 때).

업로드 URL은 백엔드의 임시 endpoint를 가리키지만 본 패치에서는 로컬 path만 반환.
모바일/웹은 dev 환경에서 photo_url을 직접 표기해 결과만 검증.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from app.modules.storage.base import AbstractStorageProvider, PresignedUpload

logger = logging.getLogger(__name__)


class LocalStorageProvider(AbstractStorageProvider):
    name = "local"

    def __init__(self, base_dir: str = "uploads", public_base_url: str = "/uploads") -> None:
        self._base_dir = Path(base_dir).absolute()
        self._public_base_url = public_base_url.rstrip("/")
        os.makedirs(self._base_dir, exist_ok=True)

    async def presigned_put(
        self,
        object_key: str,
        content_type: str,
        expires_in: int = 600,
    ) -> PresignedUpload:
        url = f"{self._public_base_url}/{object_key}"
        logger.info(
            "[LocalStorage] presigned_put — object_key=%s url=%s (dev fallback)",
            object_key, url,
        )
        return PresignedUpload(
            object_key=object_key,
            upload_url=url,
            download_url=url,
            expires_in=expires_in,
        )

    async def presigned_get(
        self,
        object_key: str,
        expires_in: int = 3600,
    ) -> str:
        return f"{self._public_base_url}/{object_key}"

    async def delete_object(self, object_key: str) -> None:
        target = self._base_dir / object_key
        if target.exists():
            target.unlink()
        else:
            logger.info("[LocalStorage] delete_object — %s 없음 (no-op)", target)
