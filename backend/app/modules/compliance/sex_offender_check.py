"""돌봄사·산책사 대상 성범죄자 신원조회 통합 (외부 API stub).

근거: 성범죄자 취업제한에 관한 법률 §56 — 아동 관련 기관은 채용·계약 전
법무부 성범죄자 알림e (https://www.sexoffender.go.kr) 또는 경찰청 신원조회 시스템을 통해
대상자가 성범죄자 등록 명부에 등재되어 있는지 확인하여야 한다.

본 모듈은 Milestone A에서는 stub 상태이며, 실제 외부 API 계약·연동은
CC 출시 사이클 직전 별도 트랙에서 진행한다 (Tech Spec §16, A-3 참조).

실 운영 전 필수 작업:
  1) 법무부 또는 위탁기관과 API 이용 계약 (또는 PDF 업로드 + 수기 검증 절차)
  2) `CaregiverQualification` 모델에 `sex_offender_checked_at`, `sex_offender_cleared`,
     `sex_offender_check_method` 컬럼 추가 (Alembic 마이그레이션)
  3) 매칭 차단 로직: `sex_offender_cleared is True` 가 아닐 경우 booking 매칭 거부
  4) 5년 보존 + 본인 이외 열람 차단 (개보법 §29 안전조치 의무)
"""

from __future__ import annotations

import enum
from dataclasses import dataclass
from datetime import datetime


class CheckMethod(enum.StrEnum):
    AUTO_API = "auto_api"          # 외부 API 자동 조회 (계약 후)
    MANUAL_DOC = "manual_doc"      # 수기 PDF 업로드 + 운영자 확인
    NOT_CHECKED = "not_checked"    # 미조회 (default)


class CheckStatus(enum.StrEnum):
    PENDING = "pending"
    CLEARED = "cleared"            # 등록 명부 미등재 → 매칭 허용
    FLAGGED = "flagged"            # 등재됨 → 매칭 차단
    EXPIRED = "expired"            # 1년 경과 → 재조회 필요


@dataclass
class SexOffenderCheckResult:
    user_id: str
    method: CheckMethod
    status: CheckStatus
    checked_at: datetime
    valid_until: datetime | None
    note: str | None = None


async def request_sex_offender_check(user_id: str) -> SexOffenderCheckResult:
    """돌봄사 대상 성범죄자 신원조회 요청.

    **현재 상태:** 외부 API 미연동 stub. 모든 호출은 PENDING 상태를 반환하고
    실제 검증은 운영자 수기 처리(`mark_check_result`)로 진행해야 한다.

    실 운영 시:
      - 법무부 알림e API (가칭) 호출 → JSON 응답 파싱
      - 본인 동의 + 주민등록번호 또는 본인인증 토큰 필요
    """
    return SexOffenderCheckResult(
        user_id=user_id,
        method=CheckMethod.NOT_CHECKED,
        status=CheckStatus.PENDING,
        checked_at=datetime.utcnow(),
        valid_until=None,
        note="외부 API 미연동 — 운영자 수기 검증 필요",
    )


def is_eligible_for_matching(result: SexOffenderCheckResult | None) -> bool:
    """매칭(예약 수락) 자격 판정.

    PT 출시 영향 없음. CC 출시 전 booking accept 흐름에 적용 필요.
    """
    if result is None:
        return False
    if result.status != CheckStatus.CLEARED:
        return False
    if result.valid_until and result.valid_until < datetime.utcnow():
        return False
    return True
