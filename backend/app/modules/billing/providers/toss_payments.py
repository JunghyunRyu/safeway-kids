"""Toss Payments PG integration provider."""

import base64
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TOSS_BASE_URL = "https://api.tosspayments.com/v1/payments"


def _auth_header() -> dict[str, str]:
    """Build Basic auth header using the Toss secret key as username."""
    secret = settings.toss_payments_secret_key
    encoded = base64.b64encode(f"{secret}:".encode()).decode()
    return {"Authorization": f"Basic {encoded}"}


class TossPaymentsProvider:
    """Async wrapper around the Toss Payments REST API."""

    def __init__(self) -> None:
        self._is_dev = settings.environment != "production"

    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int,
    ) -> dict[str, Any]:
        """Confirm a payment after frontend approval.

        POST https://api.tosspayments.com/v1/payments/confirm
        """
        if self._is_dev:
            logger.info(
                "[DEV] Toss confirm_payment skipped — "
                "payment_key=%s order_id=%s amount=%d",
                payment_key,
                order_id,
                amount,
            )
            return {
                "paymentKey": payment_key,
                "orderId": order_id,
                "status": "DONE",
                "totalAmount": amount,
                "method": "카드",
            }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TOSS_BASE_URL}/confirm",
                json={
                    "paymentKey": payment_key,
                    "orderId": order_id,
                    "amount": amount,
                },
                headers={
                    **_auth_header(),
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
    ) -> dict[str, Any]:
        """Cancel (refund) a confirmed payment.

        POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
        """
        if self._is_dev:
            logger.info(
                "[DEV] Toss cancel_payment skipped — "
                "payment_key=%s reason=%s",
                payment_key,
                cancel_reason,
            )
            return {
                "paymentKey": payment_key,
                "status": "CANCELED",
                "cancels": [{"cancelReason": cancel_reason}],
            }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TOSS_BASE_URL}/{payment_key}/cancel",
                json={"cancelReason": cancel_reason},
                headers={
                    **_auth_header(),
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()


# Module-level singleton
toss_provider = TossPaymentsProvider()
