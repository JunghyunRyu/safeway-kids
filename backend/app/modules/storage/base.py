"""Storage provider abstract base — Tech Spec FR-3.1."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(slots=True)
class PresignedUpload:
    """Presigned PUT URL 발급 결과."""

    object_key: str       # PG 또는 fallback 모두에서 stable한 식별자
    upload_url: str       # 클라이언트가 직접 PUT 요청할 URL
    download_url: str     # 업로드 완료 후 GET 가능한 URL (만료 가능)
    expires_in: int       # 초 단위 만료


class AbstractStorageProvider(ABC):
    """파일 storage 공통 인터페이스 (S3 / Local fallback)."""

    name: str

    @abstractmethod
    async def presigned_put(
        self,
        object_key: str,
        content_type: str,
        expires_in: int = 600,
    ) -> PresignedUpload:
        """클라이언트 직접 업로드용 presigned PUT URL 발급."""
        raise NotImplementedError

    @abstractmethod
    async def presigned_get(
        self,
        object_key: str,
        expires_in: int = 3600,
    ) -> str:
        """다운로드용 presigned GET URL 발급."""
        raise NotImplementedError

    @abstractmethod
    async def delete_object(self, object_key: str) -> None:
        """객체 삭제 (관리/취소 시 사용)."""
        raise NotImplementedError
