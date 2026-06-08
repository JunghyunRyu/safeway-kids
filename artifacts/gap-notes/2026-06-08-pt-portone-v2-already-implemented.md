# Gap Note — P1-3 "PortOne v2 인터페이스(mock)"는 이미 구현되어 있음

**작성일**: 2026-06-08
**분류**: Plan/Handoff ↔ Code divergence (CLAUDE.md 비협상 규칙 #6)
**탐지 시점**: P1-3 슬라이스 착수 직후, 코드베이스 확인 단계
**심각도**: LOW (작업 축소 방향 — 추가 위험 없음)

## 발견

5/22 final handoff의 "Next Exact First Step"(P1-3)은 두 작업을 명시했다:
1. WalkPhoto 모델 + Alembic 마이그레이션
2. **PortOne v2 인터페이스 스켈레톤 (mock) — "사업자 계정 발급 전이므로 호출부 없는 인터페이스만"**

그러나 코드베이스 확인 결과 **PortOne v2는 이미 mock 이상으로 완전 구현 + pettracker에 결선**되어 있다:

| 구성요소 | 위치 | 상태 |
|---|---|---|
| Provider (confirm/cancel/verify_webhook) | `backend/app/modules/billing/providers/portone.py` | ✅ 풀 구현 (dev 분기 + 실 httpx 호출) |
| 결제 모델 `PtPayment` | `backend/app/apps/pettracker/models.py:244` | ✅ 존재 |
| 서비스 (prepare/confirm/cancel/webhook sync) | `backend/app/apps/pettracker/service.py:569~726` | ✅ 존재 |
| Webhook 라우트 `/billing/webhook/portone` | `backend/app/modules/billing/router.py:310` | ✅ 존재 |
| 설정 `portone_api_secret/webhook_secret/store_id` | `backend/app/config.py:41-43` | ✅ 존재 |

추정 출처: `a9e8b625085b` 이전의 PT P2/P3 스키마 작업 + `c4b1f5e7a8d2_create_pt_payments` 마이그레이션에서 이미 도입됨. 5/22 핸드오프 작성자가 이 선행 구현을 인지하지 못하고 P1-3 잔여 작업으로 재기재한 것으로 보인다.

## 결정

- **P1-3 범위 축소**: PortOne v2 항목 제거. WalkPhoto 모델 + 마이그레이션만 P1-3의 실제 잔여 작업으로 수행.
- **신규 mock 작성 안 함**: 이미 dev 분기(`self._is_dev`)가 사업자 계정 없이 동작하는 mock 역할을 한다. 별도 mock 추가는 중복 + decision precedence(기존 코드 > 핸드오프) 위반.
- **남는 실작업(사업자 계정 의존)**: PortOne 실 통합은 코드가 아니라 **사업자등록 → PortOne 계약 → API Secret 발급**이라는 외부 절차에만 묶여 있다(blocker 유지). webhook 서명 형식 정밀화는 `portone.py:130` 주석대로 실 통합 시 docs 재확인(V1 패치 트랙).

## 영향

- 핸드오프/플랜 정정 필요: P1-3 = WalkPhoto만. (STATE.md / CLAUDE.md 갱신 동반)
- Tech Spec(2026-04-29) §15 Code Impact Map은 PortOne을 별도 항목으로 두지 않았으므로 spec 본문 수정 불요.
- 잔여 슬라이스 트랙: P1-3 완료로 6/15까지 슬라이스(P1-1·P1-2·P1-3) 전부 종료.

## 검증 (WalkPhoto 부분)

본 Gap Note와 함께 커밋되는 WalkPhoto 작업의 verification 증거는 커밋 메시지 및 STATE.md v12 참조.
