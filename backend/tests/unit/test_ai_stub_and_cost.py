"""Unit tests for the AI module skeleton (P1-2).

Coverage:
- ``decide_tier`` pure routing function at the boundary thresholds.
- ``StubLlmClient`` raises ``LlmClientNotProvisioned`` on both invoke
  variants with the on-call-friendly P2-2 guidance message.
- ``RedisCostCounter`` increments, reads back, and reports the right
  tier across the 0% / 79% / 80% / 100% boundaries using fakeredis.
- ``get_llm_client`` factory returns the stub while ``pt_llm_use_stub``
  is true (the default).

No real network calls; LLM SDK packages are intentionally not imported.
"""

from __future__ import annotations

from datetime import datetime, timezone

import fakeredis.aioredis
import pytest

from app.modules.ai.base import (
    AbstractLlmClient,
    LlmClientNotProvisioned,
    decide_tier,
)
from app.modules.ai.cost.redis_cost_counter import RedisCostCounter, _period_key
from app.modules.ai.factory import get_llm_client
from app.modules.ai.stub import StubLlmClient


# ---------- decide_tier ----------


@pytest.mark.parametrize(
    ("used", "cap", "expected"),
    [
        (0, 2_000_000, "primary"),
        (1_579_999, 2_000_000, "primary"),  # just under 79%
        (1_600_000, 2_000_000, "haiku"),     # exactly 80%
        (1_900_000, 2_000_000, "haiku"),     # 95%
        (2_000_000, 2_000_000, "exhausted"), # exactly 100%
        (2_400_000, 2_000_000, "exhausted"), # 120%
    ],
)
def test_decide_tier_thresholds(used: float, cap: float, expected: str) -> None:
    assert decide_tier(used, cap) == expected


def test_decide_tier_zero_cap_disables_routing() -> None:
    # cap_krw<=0 means "no cap configured" — never route to haiku/exhausted.
    assert decide_tier(used_krw=99_999_999, cap_krw=0) == "primary"
    assert decide_tier(used_krw=0, cap_krw=-1) == "primary"


def test_decide_tier_custom_threshold() -> None:
    # If operator lowers threshold to 50%, haiku engages earlier.
    assert decide_tier(used_krw=1_000_000, cap_krw=2_000_000, haiku_threshold_pct=50) == "haiku"
    assert decide_tier(used_krw=999_999, cap_krw=2_000_000, haiku_threshold_pct=50) == "primary"


# ---------- StubLlmClient ----------


async def test_stub_invoke_raises_with_p2_2_guidance() -> None:
    client = StubLlmClient()
    with pytest.raises(LlmClientNotProvisioned) as excinfo:
        await client.invoke(
            "classify this incident",
            max_tokens=512,
            timeout_seconds=10,
        )
    message = str(excinfo.value)
    assert "P2-2" in message
    assert "PT_LLM_USE_STUB" in message


async def test_stub_invoke_vision_raises_with_p2_2_guidance() -> None:
    client = StubLlmClient()
    with pytest.raises(LlmClientNotProvisioned):
        await client.invoke_vision(
            "describe this photo",
            image_url="https://example.com/walk.jpg",
            max_tokens=256,
            timeout_seconds=8,
        )


def test_stub_satisfies_abstract_interface() -> None:
    # Subclass detection so callers can pass StubLlmClient where
    # AbstractLlmClient is expected (Depends typing).
    assert isinstance(StubLlmClient(), AbstractLlmClient)


# ---------- RedisCostCounter ----------


def _counter_with_fakeredis(cap: float = 2_000_000) -> RedisCostCounter:
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    return RedisCostCounter(redis=fake, cap_krw=cap)


async def test_cost_counter_starts_at_zero() -> None:
    counter = _counter_with_fakeredis()
    assert await counter.get_current_krw() == 0.0
    snapshot = await counter.get_snapshot()
    assert snapshot.used_krw == 0.0
    assert snapshot.tier == "primary"
    assert snapshot.period_key == _period_key()


async def test_cost_counter_increments_atomically() -> None:
    counter = _counter_with_fakeredis()
    assert await counter.increment_krw(100.0) == 100.0
    assert await counter.increment_krw(250.5) == 350.5
    assert await counter.get_current_krw() == 350.5


async def test_cost_counter_rejects_negative_amount() -> None:
    counter = _counter_with_fakeredis()
    with pytest.raises(ValueError):
        await counter.increment_krw(-1.0)


async def test_cost_counter_tier_transitions() -> None:
    counter = _counter_with_fakeredis(cap=1_000.0)

    await counter.increment_krw(500)  # 50%
    snap_a = await counter.get_snapshot()
    assert snap_a.tier == "primary"
    assert snap_a.pct_used == pytest.approx(0.5)

    await counter.increment_krw(300)  # +30% = 80%
    snap_b = await counter.get_snapshot()
    assert snap_b.tier == "haiku"

    await counter.increment_krw(200)  # +20% = 100%
    snap_c = await counter.get_snapshot()
    assert snap_c.tier == "exhausted"


async def test_cost_counter_month_isolated_keys() -> None:
    """Counter for one month must not bleed into another."""
    counter = _counter_with_fakeredis()
    jan = datetime(2026, 1, 15, tzinfo=timezone.utc)
    feb = datetime(2026, 2, 1, tzinfo=timezone.utc)

    await counter.increment_krw(500, now=jan)
    await counter.increment_krw(900, now=feb)

    assert await counter.get_current_krw(now=jan) == 500.0
    assert await counter.get_current_krw(now=feb) == 900.0


async def test_cost_counter_sets_ttl_on_fresh_key() -> None:
    counter = _counter_with_fakeredis()
    await counter.increment_krw(10.0)
    fake = counter.redis
    ttl = await fake.ttl(f"pt:llm:cost:{_period_key()}")
    # 32 days in seconds = 2_764_800. fakeredis returns the ttl as int.
    assert 0 < ttl <= 32 * 24 * 3600


# ---------- factory.get_llm_client ----------


async def test_factory_returns_stub_by_default() -> None:
    client = await get_llm_client()
    assert isinstance(client, StubLlmClient)


async def test_factory_returns_stub_even_when_flag_flips(monkeypatch: pytest.MonkeyPatch) -> None:
    """Until P2-2 concrete clients ship, flipping the flag must NOT
    return a half-built client. Belt-and-suspenders for misconfig in prod.
    """
    from app.config import settings

    monkeypatch.setattr(settings, "pt_llm_use_stub", False)
    client = await get_llm_client()
    assert isinstance(client, StubLlmClient)
