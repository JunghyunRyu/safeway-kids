"""Stub LLM client — explicit failure until P2-2 wires real providers.

Any call to ``invoke``/``invoke_vision`` raises ``LlmClientNotProvisioned``.
The message names the exact next milestone so on-call doesn't have to
chase the lineage.

Why not silently return a canned response: spec §FR-A6/§FR-D5 already
define fallback semantics ("severity=medium", "검토 중", etc.) and they
live in the *caller*, not the LLM client. A silent stub would hide those
fallbacks and make tests pass for the wrong reason.
"""

from __future__ import annotations

from app.modules.ai.base import AbstractLlmClient, LlmClientNotProvisioned, LlmResponse


class StubLlmClient(AbstractLlmClient):
    name = "stub"

    _NOT_PROVISIONED_MSG = (
        "LLM client is a stub. Real provider lands in P2-2 "
        "(after OpenAI billing unblock + 6/15 본업 종료). "
        "Set PT_LLM_USE_STUB=false and provide ANTHROPIC_API_KEY or "
        "OPENAI_API_KEY to enable a concrete client."
    )

    async def invoke(
        self,
        prompt: str,
        *,
        max_tokens: int,
        timeout_seconds: float,
        json_mode: bool = True,
    ) -> LlmResponse:
        raise LlmClientNotProvisioned(self._NOT_PROVISIONED_MSG)

    async def invoke_vision(
        self,
        prompt: str,
        image_url: str,
        *,
        max_tokens: int,
        timeout_seconds: float,
        json_mode: bool = True,
    ) -> LlmResponse:
        raise LlmClientNotProvisioned(self._NOT_PROVISIONED_MSG)
