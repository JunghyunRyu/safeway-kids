"""P3-68: ERP Integration service — API key and webhook management."""

import hashlib
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import NotFoundError
from app.modules.integration.models import ApiKey, Webhook


def _generate_api_key() -> tuple[str, str, str]:
    """Generate an API key. Returns (raw_key, key_hash, key_prefix)."""
    raw_key = "sk_" + secrets.token_hex(24)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:8]
    return raw_key, key_hash, key_prefix


async def create_api_key(db: AsyncSession, academy_id: uuid.UUID, name: str) -> dict:
    raw_key, key_hash, key_prefix = _generate_api_key()
    api_key = ApiKey(
        academy_id=academy_id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=name,
    )
    db.add(api_key)
    await db.flush()
    return {
        "id": api_key.id,
        "academy_id": api_key.academy_id,
        "key_prefix": api_key.key_prefix,
        "name": api_key.name,
        "is_active": api_key.is_active,
        "created_at": api_key.created_at,
        "raw_key": raw_key,
    }


async def list_api_keys(db: AsyncSession, academy_id: uuid.UUID) -> list[dict]:
    stmt = (
        select(ApiKey)
        .where(ApiKey.academy_id == academy_id, ApiKey.is_active.is_(True))
        .order_by(ApiKey.created_at.desc())
    )
    result = await db.execute(stmt)
    return [
        {
            "id": k.id,
            "academy_id": k.academy_id,
            "key_prefix": k.key_prefix,
            "name": k.name,
            "is_active": k.is_active,
            "created_at": k.created_at,
            "raw_key": None,
        }
        for k in result.scalars().all()
    ]


async def delete_api_key(db: AsyncSession, key_id: uuid.UUID) -> None:
    stmt = select(ApiKey).where(ApiKey.id == key_id)
    result = await db.execute(stmt)
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError(detail="API 키를 찾을 수 없습니다")
    key.is_active = False
    await db.flush()


async def create_webhook(db: AsyncSession, academy_id: uuid.UUID, url: str, events: str) -> dict:
    webhook = Webhook(
        academy_id=academy_id,
        url=url,
        events=events,
    )
    db.add(webhook)
    await db.flush()
    return {
        "id": webhook.id,
        "academy_id": webhook.academy_id,
        "url": webhook.url,
        "events": webhook.events,
        "is_active": webhook.is_active,
        "created_at": webhook.created_at,
    }


async def list_webhooks(db: AsyncSession, academy_id: uuid.UUID) -> list[dict]:
    stmt = (
        select(Webhook)
        .where(Webhook.academy_id == academy_id, Webhook.is_active.is_(True))
        .order_by(Webhook.created_at.desc())
    )
    result = await db.execute(stmt)
    return [
        {
            "id": w.id,
            "academy_id": w.academy_id,
            "url": w.url,
            "events": w.events,
            "is_active": w.is_active,
            "created_at": w.created_at,
        }
        for w in result.scalars().all()
    ]


async def delete_webhook(db: AsyncSession, webhook_id: uuid.UUID) -> None:
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise NotFoundError(detail="Webhook을 찾을 수 없습니다")
    webhook.is_active = False
    await db.flush()
