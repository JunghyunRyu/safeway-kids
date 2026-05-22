"""LLM client abstract base + shared types.

Tech Spec §7.4 LlmClient + §17.2 cap policy. Mirrors the
`modules.storage.base` shape: ABC + frozen dataclasses + error hierarchy.

The concrete providers (Anthropic, OpenAI) are P2-2 work — this file only
defines the contract so callers in `apps.pettracker` can be wired against
the abstract interface today and have their dependencies switched without
code changes once the providers ship.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

Tier = Literal["primary", "haiku", "exhausted"]
"""Routing tier for a single LLM call.

- ``primary`` — Claude Sonnet (or GPT-4o for vision fallback). Default
  when monthly cost is below the haiku threshold.
- ``haiku`` — Claude Haiku / GPT-4o-mini. Engaged once the cap reaches
  ``pt_llm_haiku_threshold_pct`` (default 80%) per spec §17.2.
- ``exhausted`` — 100%+ of monthly cap. Caller must use cached fallback
  or block the request; LlmCostExceeded is raised by the client.
"""


@dataclass(frozen=True, slots=True)
class LlmResponse:
    """Result of an LLM invocation, regardless of provider."""

    content: dict[str, Any]
    tier_used: Tier
    provider: str
    estimated_cost_krw: float
    raw_metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class LlmCost:
    """Snapshot of the monthly cost counter (spec §NFR-3)."""

    period_key: str
    used_krw: float
    cap_krw: float
    tier: Tier

    @property
    def pct_used(self) -> float:
        if self.cap_krw <= 0:
            return 0.0
        return self.used_krw / self.cap_krw


class LlmError(Exception):
    """Base error for LLM operations."""


class LlmClientNotProvisioned(LlmError):
    """Raised when the stub client receives a real call.

    The default factory wires the stub until ``PT_LLM_USE_STUB`` is set
    false AND at least one provider key is present. This makes it loud
    if a router accidentally enables LLM-dependent features before the
    P2-2 milestone ships real providers.
    """


class LlmCostExceeded(LlmError):
    """Monthly cost cap reached (tier=='exhausted'). Caller falls back."""

    def __init__(self, snapshot: LlmCost) -> None:
        self.snapshot = snapshot
        super().__init__(
            f"LLM monthly cap exceeded: "
            f"{snapshot.used_krw:.0f}/{snapshot.cap_krw:.0f} KRW "
            f"({snapshot.pct_used:.1%}) in {snapshot.period_key}"
        )


def decide_tier(
    used_krw: float,
    cap_krw: float,
    haiku_threshold_pct: int = 80,
) -> Tier:
    """Pure routing function for tier selection (spec §17.2).

    Kept pure (no Redis, no I/O) so it can be tested independently and
    reused by callers that already hold a fresh ``LlmCost`` snapshot.

    - ``used_krw / cap_krw < haiku_threshold/100`` → ``primary``
    - ``haiku_threshold/100 <= used_krw / cap_krw < 1.0`` → ``haiku``
    - ``used_krw >= cap_krw`` → ``exhausted``
    - If ``cap_krw <= 0`` the cap is treated as disabled → always
      ``primary`` (callers can wire a dev-only opt-out this way).
    """
    if cap_krw <= 0:
        return "primary"
    pct = used_krw / cap_krw
    if pct >= 1.0:
        return "exhausted"
    if pct >= haiku_threshold_pct / 100:
        return "haiku"
    return "primary"


class AbstractLlmClient(ABC):
    """Provider-agnostic LLM client (spec §7.4).

    Concrete implementations (Anthropic / OpenAI) ship in P2-2. Until
    then ``StubLlmClient`` raises ``LlmClientNotProvisioned`` so routes
    cannot silently fall through to a no-op.
    """

    name: str

    @abstractmethod
    async def invoke(
        self,
        prompt: str,
        *,
        max_tokens: int,
        timeout_seconds: float,
        json_mode: bool = True,
    ) -> LlmResponse:
        """Text-only LLM call. Returns parsed JSON in ``content``."""
        raise NotImplementedError

    @abstractmethod
    async def invoke_vision(
        self,
        prompt: str,
        image_url: str,
        *,
        max_tokens: int,
        timeout_seconds: float,
        json_mode: bool = True,
    ) -> LlmResponse:
        """Vision-capable LLM call (spec §FR-B3)."""
        raise NotImplementedError
