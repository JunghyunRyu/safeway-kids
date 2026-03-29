"""F10: Webhook dispatch service.

Sends HTTP POST callbacks to registered webhook URLs when events occur
(boarding, alighting, schedule_created). Fire-and-forget with logging.
"""

import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.modules.integration.models import Webhook

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT = 10.0  # seconds


def _sign_payload(payload_bytes: bytes, secret: str) -> str:
    """Compute HMAC-SHA256 signature for a payload.

    Ready for use when the Webhook model gains a ``secret`` column.
    The caller should add an ``X-Webhook-Signature`` header with this value.
    """
    return hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()


def _build_payload(event: str, data: dict) -> dict:
    """Build the standard webhook payload envelope."""
    return {
        "event": event,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def _fetch_webhooks_for_event(
    db: AsyncSession, academy_id: uuid.UUID, event: str
) -> list[Webhook]:
    """Fetch active webhooks whose events list includes the given event."""
    stmt = select(Webhook).where(
        Webhook.academy_id == academy_id,
        Webhook.is_active.is_(True),
    )
    result = await db.execute(stmt)
    webhooks = result.scalars().all()
    # Filter: events is a comma-separated string, e.g. "boarding,alighting"
    return [w for w in webhooks if event in w.events.split(",")]


async def _deliver_webhook(
    url: str, payload: dict, webhook_id: uuid.UUID
) -> None:
    """Send a single webhook HTTP POST. Logs success or failure."""
    payload_bytes = json.dumps(payload, default=str).encode()
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=WEBHOOK_TIMEOUT) as client:
            response = await client.post(url, content=payload_bytes, headers=headers)
        logger.info(
            "Webhook delivered: webhook_id=%s url=%s status=%d event=%s",
            webhook_id, url, response.status_code, payload.get("event"),
        )
    except httpx.TimeoutException:
        logger.warning(
            "Webhook timeout: webhook_id=%s url=%s event=%s",
            webhook_id, url, payload.get("event"),
        )
    except Exception as exc:
        logger.error(
            "Webhook delivery failed: webhook_id=%s url=%s event=%s error=%s",
            webhook_id, url, payload.get("event"), exc,
        )


async def dispatch_webhook(academy_id: uuid.UUID, event: str, data: dict) -> None:
    """Dispatch webhooks for an event to all matching registered URLs.

    Uses its own database session so it can be called as a fire-and-forget
    background task via asyncio.create_task().
    """
    try:
        async with async_session_factory() as db:
            webhooks = await _fetch_webhooks_for_event(db, academy_id, event)

        if not webhooks:
            return

        payload = _build_payload(event, data)

        for webhook in webhooks:
            await _deliver_webhook(webhook.url, payload, webhook.id)

    except Exception as exc:
        logger.error(
            "Webhook dispatch error: academy_id=%s event=%s error=%s",
            academy_id, event, exc,
        )
