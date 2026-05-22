"""LLM client factory — FastAPI dependency.

P1-2 returns ``StubLlmClient`` unconditionally. P2-2 will branch on
``settings.pt_llm_primary_provider`` + presence of provider keys to
return ``AnthropicLlmClient`` or ``OpenAILlmClient``.

Kept as a separate file (not in ``__init__``) so test code can monkeypatch
``app.modules.ai.factory.get_llm_client`` without import side effects.
"""

from __future__ import annotations

from app.config import settings
from app.modules.ai.base import AbstractLlmClient
from app.modules.ai.stub import StubLlmClient


def _build_client() -> AbstractLlmClient:
    if settings.pt_llm_use_stub:
        return StubLlmClient()
    # P2-2: branch on settings.pt_llm_primary_provider and verify key presence.
    # Until concrete providers land, force the stub even if the flag flips,
    # so a misconfigured env in production fails loud (LlmClientNotProvisioned)
    # rather than reaching out to an unconfigured SDK.
    return StubLlmClient()


async def get_llm_client() -> AbstractLlmClient:
    """FastAPI dependency. Wire as ``Depends(get_llm_client)``."""
    return _build_client()
