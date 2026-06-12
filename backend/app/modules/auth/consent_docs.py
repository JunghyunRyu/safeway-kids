"""동의 문서 버전 레지스트리 — Tech Spec FR-C2 (2026-06-11).

doc_version은 자유 문자열이 아니라 본 레지스트리의 현재 버전과 일치해야
한다 (어떤 문서 텍스트에 동의했는지 증빙 가능). 문서 개정 시 버전을
올리고 구버전 동의 사용자는 재동의 유도 대상이 된다.

문서 본문은 모바일 PolicyScreen + site 약관 페이지에 있으며, 여기서는
버전 식별자만 관리한다 (본문 sha 고정은 V1.1 — 문서가 repo 밖 CMS로
이동하는 시점에 도입).
"""

from __future__ import annotations

from app.modules.auth.models import APP_CARECONNECT, APP_PETTRACKER, ConsentDocType, UserRole

# doc_type → 현재 유효 버전
CONSENT_DOC_VERSIONS: dict[str, str] = {
    ConsentDocType.TERMS: "2026-06-11",
    ConsentDocType.PRIVACY: "2026-06-11",
    ConsentDocType.LOCATION: "2026-06-11",
    ConsentDocType.MARKETING: "2026-06-11",
    ConsentDocType.AGE14: "2026-06-11",
}

# 동의 게이트가 적용되는 앱 (SafeWay는 기존 가입 플로우 불변 — FR-C3)
CONSENT_GATED_APP_CONTEXTS = {APP_PETTRACKER, APP_CARECONNECT}

_BASE_REQUIRED = (ConsentDocType.TERMS, ConsentDocType.PRIVACY, ConsentDocType.AGE14)


def required_doc_types(role: UserRole | str) -> tuple[str, ...]:
    """역할별 필수 동의 doc_type 목록.

    위치정보법 §15/§18: walker는 산책 중 본인 위치가 수집되는
    개인위치정보주체이므로 location 동의가 가입 필수 (Consensus #5).
    """
    role_value = role.value if isinstance(role, UserRole) else role
    if role_value == UserRole.WALKER.value:
        return (*_BASE_REQUIRED, ConsentDocType.LOCATION)
    return _BASE_REQUIRED
