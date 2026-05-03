"""PortOne v2 PG provider — Tech Spec FR-1.2 / FR-1.5.

Reference: https://developers.portone.io/opi/ko/readme?v=v2

PT/CC 결제용. SafeWay Kids는 기존 Toss provider 그대로 유지.
Webhook 라우터는 `/billing/webhook/portone`로 분리 (Toss와 충돌 회피).
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any

import httpx

from app.config import settings
from app.modules.billing.providers.base import AbstractPGProvider

logger = logging.getLogger(__name__)

PORTONE_BASE_URL = "https://api.portone.io"


def _auth_header() -> dict[str, str]:
    """PortOne v2 인증: `Authorization: PortOne {API_SECRET}`."""
    secret = getattr(settings, "portone_api_secret", "") or ""
    return {"Authorization": f"PortOne {secret}"}


class PortOneProvider(AbstractPGProvider):
    """PortOne v2 REST API wrapper.

    Settings 요구 (config.py 추가 예정):
      - portone_api_secret: API Secret (V2)
      - portone_webhook_secret: Webhook HMAC 검증용 secret
      - portone_store_id: 가맹점 (channel) ID
    """

    name = "portone"

    def __init__(self) -> None:
        self._is_dev = settings.environment != "production"

    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int,
    ) -> dict[str, Any]:
        """결제 검증 — PortOne v2는 frontend 승인 후 GET /payments/{paymentId}로
        실제 결제 정보를 조회하여 amount/status 일치를 백엔드에서 확인한다.

        payment_key 는 PortOne의 paymentId (V2)에 해당.
        """
        if self._is_dev:
            logger.info(
                "[DEV] PortOne confirm_payment skipped — paymentId=%s amount=%d",
                payment_key, amount,
            )
            return {
                "id": payment_key,
                "orderId": order_id,
                "status": "PAID",
                "amount": {"total": amount, "currency": "KRW"},
                "method": {"type": "PaymentMethodCard"},
            }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{PORTONE_BASE_URL}/payments/{payment_key}",
                headers=_auth_header(),
                timeout=settings.external_api_timeout_seconds,
            )
            response.raise_for_status()
            payment = response.json()

            # 금액·상태 검증 (fail-closed)
            paid_amount = payment.get("amount", {}).get("total")
            status = payment.get("status")
            if paid_amount != amount or status not in ("PAID", "VIRTUAL_ACCOUNT_ISSUED"):
                raise ValueError(
                    f"PortOne 결제 검증 실패 — expected amount={amount}, "
                    f"got status={status} amount={paid_amount}"
                )
            return payment

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: int | None = None,
    ) -> dict[str, Any]:
        """결제 취소 / 부분 취소.

        POST /payments/{paymentId}/cancel
        body: {"reason": str, "amount"?: int}
        """
        body: dict[str, Any] = {"reason": cancel_reason}
        if cancel_amount is not None:
            body["amount"] = cancel_amount

        if self._is_dev:
            logger.info(
                "[DEV] PortOne cancel_payment skipped — paymentId=%s amount=%s reason=%s",
                payment_key, cancel_amount, cancel_reason,
            )
            return {
                "id": payment_key,
                "status": "CANCELLED" if cancel_amount is None else "PARTIAL_CANCELLED",
                "cancellation": {"amount": cancel_amount, "reason": cancel_reason},
            }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PORTONE_BASE_URL}/payments/{payment_key}/cancel",
                json=body,
                headers={**_auth_header(), "Content-Type": "application/json"},
                timeout=settings.external_api_timeout_seconds,
            )
            response.raise_for_status()
            return response.json()

    async def verify_webhook(
        self,
        body: bytes,
        signature: str,
    ) -> bool:
        """PortOne v2 webhook HMAC-SHA256 검증.

        헤더 `webhook-signature` (또는 X-PortOne-Signature) 형식: `v1,<base64>` 등.
        본 구현은 단순 HMAC-SHA256 hex digest 비교 — 실제 PortOne 서명 형식은
        실 통합 시 docs 재확인 후 정밀화 (V1 패치 트랙).
        """
        secret = getattr(settings, "portone_webhook_secret", "") or ""
        if not secret:
            logger.error("PortOne webhook secret not configured — rejecting webhook")
            return False

        expected = hmac.new(
            secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature.lower())


portone_provider = PortOneProvider()
