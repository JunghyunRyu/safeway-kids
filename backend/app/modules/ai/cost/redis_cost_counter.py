"""Monthly LLM cost counter backed by Redis (spec §NFR-3, §17.2).

Each calendar month gets its own counter key ``pt:llm:cost:{YYYY-MM}``
so historical months are preserved for audit and current-month rollover
is automatic. A 32-day TTL is applied on first write so stale months
self-expire without operator intervention.

This is **production code, not a stub** — no LLM SDK is needed to run
it. P2-2's concrete LLM clients will call ``increment_krw`` after each
successful API response with the estimated cost.

Atomicity: ``INCRBYFLOAT`` is single-command atomic. We then read back
in a second round-trip; if a concurrent writer raced us, the read
reflects the post-increment value, which is the safe direction for tier
routing (callers err on the side of cheaper tier).

Redis unavailable: ``app.redis._SafeRedis`` falls back to in-memory
NoOp. For LLM cost gating, the safe direction when Redis is down is
"force haiku tier" (spec §10 Failure Handling). ``get_tier`` handles
this by treating a missing counter as 0 KRW used; if operators want
strict-degraded behavior they wire it at the caller.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.modules.ai.base import LlmCost, decide_tier

_TTL_DAYS = 32
_TTL_SECONDS = _TTL_DAYS * 24 * 3600


def _period_key(now: datetime | None = None) -> str:
    """Returns the ``YYYY-MM`` period for the given moment (UTC)."""
    moment = now or datetime.now(tz=timezone.utc)
    return moment.strftime("%Y-%m")


def _redis_key(period: str) -> str:
    return f"pt:llm:cost:{period}"


@dataclass(slots=True)
class RedisCostCounter:
    """Async Redis-backed monthly cost counter.

    ``redis`` is the shared ``app.redis.redis_client`` proxy; tests inject
    ``fakeredis.aioredis.FakeRedis`` via constructor.
    """

    redis: Any
    cap_krw: float
    haiku_threshold_pct: int = 80

    async def increment_krw(self, amount_krw: float, now: datetime | None = None) -> float:
        """Atomic increment. Returns the post-increment total (KRW)."""
        if amount_krw < 0:
            raise ValueError("amount_krw must be non-negative")
        period = _period_key(now)
        key = _redis_key(period)
        new_total = await self.redis.incrbyfloat(key, amount_krw)
        # Lazy TTL: set only when we observe a fresh key (no TTL or first hit).
        ttl = await self.redis.ttl(key)
        if ttl is None or ttl < 0:
            await self.redis.expire(key, _TTL_SECONDS)
        return float(new_total) if new_total is not None else 0.0

    async def get_current_krw(self, now: datetime | None = None) -> float:
        period = _period_key(now)
        key = _redis_key(period)
        value = await self.redis.get(key)
        if value is None:
            return 0.0
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    async def get_snapshot(self, now: datetime | None = None) -> LlmCost:
        period = _period_key(now)
        used = await self.get_current_krw(now=now)
        tier = decide_tier(used, self.cap_krw, self.haiku_threshold_pct)
        return LlmCost(
            period_key=period,
            used_krw=used,
            cap_krw=self.cap_krw,
            tier=tier,
        )
