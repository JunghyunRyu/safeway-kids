"""AWS S3 storage provider — Tech Spec FR-3.2.

boto3는 lazy import — 미설치 환경에서는 ImportError를 명시적으로 raise.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.modules.storage.base import AbstractStorageProvider, PresignedUpload

logger = logging.getLogger(__name__)


class S3StorageProvider(AbstractStorageProvider):
    name = "s3"

    def __init__(
        self,
        bucket: str,
        region: str,
        access_key_id: str | None = None,
        secret_access_key: str | None = None,
    ) -> None:
        try:
            import boto3  # type: ignore[import-not-found]
        except ImportError as e:
            raise RuntimeError(
                "S3StorageProvider requires boto3 — pip install boto3",
            ) from e

        self._bucket = bucket
        self._region = region
        client_kwargs: dict[str, Any] = {"region_name": region}
        if access_key_id and secret_access_key:
            client_kwargs["aws_access_key_id"] = access_key_id
            client_kwargs["aws_secret_access_key"] = secret_access_key
        self._client = boto3.client("s3", **client_kwargs)

    async def presigned_put(
        self,
        object_key: str,
        content_type: str,
        expires_in: int = 600,
    ) -> PresignedUpload:
        loop = asyncio.get_event_loop()
        upload_url = await loop.run_in_executor(
            None,
            lambda: self._client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self._bucket,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            ),
        )
        download_url = await self.presigned_get(object_key, expires_in)
        return PresignedUpload(
            object_key=object_key,
            upload_url=upload_url,
            download_url=download_url,
            expires_in=expires_in,
        )

    async def presigned_get(
        self,
        object_key: str,
        expires_in: int = 3600,
    ) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_in,
            ),
        )

    async def delete_object(self, object_key: str) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self._client.delete_object(Bucket=self._bucket, Key=object_key),
        )
