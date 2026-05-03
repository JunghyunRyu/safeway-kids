"""Abstract PG provider interface — Tech Spec FR-1.2.

PT/CC 결제는 PortOne v2 provider, SafeWay Kids는 기존 Toss Payments provider 사용.
서로 webhook 라우터(`/billing/webhook/{toss,portone}`)도 분리하므로 본 ABC는
service 레이어가 어느 provider를 받아도 동일한 인터페이스로 호출할 수 있게 한다.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AbstractPGProvider(ABC):
    """결제 PG provider 공통 인터페이스."""

    name: str  # provider 식별자 ("toss", "portone")

    @abstractmethod
    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int,
    ) -> dict[str, Any]:
        """결제 승인 (frontend 승인 후 백엔드 확정).

        Args:
            payment_key: PG 측 결제 식별자 (Toss `paymentKey`, PortOne `imp_uid`)
            order_id: 가맹점 측 주문 식별자
            amount: 승인 금액 (KRW, 정수)

        Returns:
            PG 응답 dict (provider별 raw 형식 — service에서 매핑)

        Raises:
            httpx.HTTPStatusError 또는 ValueError — 승인 실패
        """
        raise NotImplementedError

    @abstractmethod
    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: int | None = None,
    ) -> dict[str, Any]:
        """결제 취소 / 환불 (full or partial).

        Args:
            payment_key: PG 측 결제 식별자
            cancel_reason: 취소 사유 (사용자 표시 또는 운영 로그용)
            cancel_amount: 부분 취소 금액 (KRW). None이면 전체 취소.

        Returns:
            PG 응답 dict
        """
        raise NotImplementedError

    @abstractmethod
    async def verify_webhook(
        self,
        body: bytes,
        signature: str,
    ) -> bool:
        """Webhook 서명 검증 (HMAC fail-closed 패턴).

        Args:
            body: webhook raw body bytes (서명 검증 대상)
            signature: 헤더에서 추출한 서명 값

        Returns:
            검증 성공 시 True, 실패 시 False (호출 측이 즉시 403)
        """
        raise NotImplementedError
