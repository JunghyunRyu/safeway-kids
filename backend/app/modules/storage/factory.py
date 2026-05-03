"""Storage provider factory — env 기반 selection.

`s3_bucket` 설정이 비어 있으면 LocalStorageProvider로 fallback (dev 친화).
production 환경에서 s3_bucket가 비어 있으면 config validator가 차단 (별도 PR).
"""

from __future__ import annotations

import logging
from functools import lru_cache

from app.config import settings
from app.modules.storage.base import AbstractStorageProvider
from app.modules.storage.local import LocalStorageProvider

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_storage() -> AbstractStorageProvider:
    bucket = getattr(settings, "s3_bucket", "") or ""
    if not bucket:
        logger.info("Storage: s3_bucket 미설정 → LocalStorageProvider fallback")
        return LocalStorageProvider()

    from app.modules.storage.s3 import S3StorageProvider

    region = getattr(settings, "aws_region", "ap-northeast-2")
    access_key = getattr(settings, "aws_access_key_id", "") or None
    secret_key = getattr(settings, "aws_secret_access_key", "") or None
    logger.info("Storage: S3StorageProvider — bucket=%s region=%s", bucket, region)
    return S3StorageProvider(
        bucket=bucket,
        region=region,
        access_key_id=access_key,
        secret_access_key=secret_key,
    )
