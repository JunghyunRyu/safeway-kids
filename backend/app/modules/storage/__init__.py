"""Storage abstraction — Tech Spec FR-3 (AWS S3 + presigned URL).

PT/CC 사진 업로드용. dev 환경(자격증명 없음)에서는 LocalStorageProvider로 fallback.
"""

from app.modules.storage.base import AbstractStorageProvider
from app.modules.storage.factory import get_storage

__all__ = ["AbstractStorageProvider", "get_storage"]
