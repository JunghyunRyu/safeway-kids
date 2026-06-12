"""Unit tests for the PortOne v2 provider (P1-3 gap closure).

The provider itself shipped in April (c4b1f5e7a8d2 era) with zero test
coverage — see gap-notes/2026-06-11-p1-3-portone-already-implemented.md.
These tests pin the merchant-account-free surface only:

- ``verify_webhook`` HMAC fail-closed behaviour (no secret → reject).
- Dev-mode ``confirm_payment`` / ``cancel_payment`` mock responses that
  the pettracker service relies on before a real PortOne contract exists.

No network calls — production branches stay untested until the PortOne
merchant account lands (P2 track).
"""

from __future__ import annotations

import hashlib
import hmac

import pytest

from app.config import settings
from app.modules.billing.providers.base import AbstractPGProvider
from app.modules.billing.providers.portone import PortOneProvider


@pytest.fixture
def provider(monkeypatch: pytest.MonkeyPatch) -> PortOneProvider:
    # 테스트는 dev-mode 분기만 검증 (production 분기는 실 계약 후 통합 테스트 대상)
    monkeypatch.setattr(settings, "environment", "development")
    return PortOneProvider()


def test_provider_implements_pg_abc(provider: PortOneProvider) -> None:
    assert isinstance(provider, AbstractPGProvider)
    assert provider.name == "portone"


# ---------- dev-mode allowlist (FR-P2 — fail-open 차단) ----------


@pytest.mark.parametrize(
    ("environment", "expect_dev"),
    [
        ("development", True),
        ("test", True),
        ("staging", False),   # 미등록 환경은 실호출 경로
        ("production", False),
        ("", False),          # 환경변수 누락도 mock으로 떨어지지 않는다
    ],
)
def test_dev_mode_allowlist(
    monkeypatch: pytest.MonkeyPatch, environment: str, expect_dev: bool
) -> None:
    monkeypatch.setattr(settings, "environment", environment)
    assert PortOneProvider()._is_dev is expect_dev


async def test_real_path_without_secret_fails_closed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "environment", "staging")
    monkeypatch.setattr(settings, "portone_api_secret", "")
    provider = PortOneProvider()
    with pytest.raises(RuntimeError, match="PortOne API secret"):
        await provider.confirm_payment("p1", "o1", 1000)
    with pytest.raises(RuntimeError, match="PortOne API secret"):
        await provider.cancel_payment("p1", "사유")


# ---------- verify_webhook (HMAC fail-closed) ----------


async def test_webhook_rejected_when_secret_not_configured(
    provider: PortOneProvider, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "portone_webhook_secret", "")
    assert await provider.verify_webhook(b'{"paymentId": "p1"}', "deadbeef") is False


async def test_webhook_accepts_valid_hmac_signature(
    provider: PortOneProvider, monkeypatch: pytest.MonkeyPatch
) -> None:
    secret = "test-webhook-secret"
    monkeypatch.setattr(settings, "portone_webhook_secret", secret)
    body = b'{"paymentId": "p1", "status": "PAID"}'
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    assert await provider.verify_webhook(body, signature) is True
    # 헤더에서 대문자 hex로 와도 통과 (구현이 .lower() 정규화)
    assert await provider.verify_webhook(body, signature.upper()) is True


async def test_webhook_rejects_tampered_body_or_signature(
    provider: PortOneProvider, monkeypatch: pytest.MonkeyPatch
) -> None:
    secret = "test-webhook-secret"
    monkeypatch.setattr(settings, "portone_webhook_secret", secret)
    body = b'{"paymentId": "p1", "status": "PAID"}'
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    tampered = b'{"paymentId": "p1", "status": "CANCELLED"}'
    assert await provider.verify_webhook(tampered, signature) is False
    assert await provider.verify_webhook(body, "0" * 64) is False


# ---------- dev-mode confirm / cancel ----------


async def test_dev_confirm_payment_returns_paid_mock(provider: PortOneProvider) -> None:
    result = await provider.confirm_payment(
        payment_key="payment-abc", order_id="pt_order_1", amount=25_000
    )
    assert result["id"] == "payment-abc"
    assert result["orderId"] == "pt_order_1"
    assert result["status"] == "PAID"
    assert result["amount"] == {"total": 25_000, "currency": "KRW"}


async def test_dev_full_cancel_returns_cancelled(provider: PortOneProvider) -> None:
    result = await provider.cancel_payment(
        payment_key="payment-abc", cancel_reason="보호자 요청"
    )
    assert result["status"] == "CANCELLED"
    assert result["cancellation"]["reason"] == "보호자 요청"


async def test_dev_partial_cancel_returns_partial_cancelled(
    provider: PortOneProvider,
) -> None:
    result = await provider.cancel_payment(
        payment_key="payment-abc", cancel_reason="부분 환불", cancel_amount=10_000
    )
    assert result["status"] == "PARTIAL_CANCELLED"
    assert result["cancellation"]["amount"] == 10_000
