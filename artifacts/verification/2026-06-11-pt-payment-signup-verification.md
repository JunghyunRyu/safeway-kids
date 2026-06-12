# Verification Report — PT 결제 플로우 + Firebase 가입 (2026-06-11, Phase 6)

Spec: [`../specs/2026-06-11-pt-payment-signup-final-tech-spec.md`](../specs/2026-06-11-pt-payment-signup-final-tech-spec.md)
환경: 원격 컨테이너 (Python 3.12 venv + PostgreSQL 16 + Redis / npm workspace, node 22)

## 1. 백엔드 전체 회귀 — **VERIFIED (회귀 0)**
```
.venv/bin/python -m pytest --tb=line -q --timeout=120
→ 240 passed / 7 failed / 3 errors in 555.78s
```
- 총 247 = 직전 baseline 221 + 신규 26 (동의·Firebase 14, payments 목록 4, payment flow 2, PortOne allowlist 6)
- 실패 7+3은 **기지 이슈와 정확히 동일** (KI-2 Toss 3, KI-3 health 1, KI-4 WS 3×fail+teardown error) — 신규/변경 표면과 무관
- 신규 26건 전부 PASS (suite 내 확인)

## 2. 마이그레이션 — **VERIFIED**
- `a4b8e2c6d9f1_add_user_consents`: 실 PostgreSQL 16에서 upgrade → `\d user_consents` 스키마/인덱스 확인 → downgrade → 재upgrade 전부 통과

## 3. 모바일 — **VERIFIED**
| 검증 | 결과 |
|---|---|
| PT jest | **30/30 PASS** (신규 3파일: consent 로직·ConsentScreen 게이트·PaymentHistory) |
| PT `npx tsc --noEmit` | **0 errors** |
| SafeWay jest (core-mobile 공유 영향) | **71/71 PASS** |
| SafeWay tsc | **0 errors** (expo-speech lockfile 정합화 후 — 선재 불일치였음) |
| CareConnect tsc | **0 errors** |

## 4. 보안 게이트 (security review MUST 항목) — **VERIFIED (테스트 증명)**
- custom-token uid 서버 유래 강제: `test_custom_token_uid_derived_from_server_record` (본문 uid 무시 확인)
- link 멱등·충돌 409: `test_firebase_link_idempotent_and_conflict`
- 듀얼 인증: JWT 경로 불변 + Firebase mock 경로 + 무효 토큰 401 (3 테스트)
- PortOne fail-open 차단: allowlist 5 파라미터 케이스 + secret 미설정 RuntimeError 2건
- Kakao redirect_uri allowlist: 비허용 URI 422
- walker location 동의 필수: `test_pt_new_walker_requires_location_consent`

## 5. 발견·수정된 선재 버그
- **confirm_payment 두 동강** (HIGH): GPS purge 함수가 본문 중간 삽입 → 결제 confirm이 PAID 저장 없이 None 반환하던 기능 고장. 수정 + e2e 회귀 테스트. [gap-note](../gap-notes/2026-06-11-pt-confirm-payment-split-bug.md)
- **package-lock에 expo-speech 누락** (선재): mobile/package.json 선언과 불일치 → lockfile 정합화

## 6. UNVERIFIED (정직 고지)
- **Kakao 실 OAuth 왕복**: EXT-12 (Kakao 콘솔 redirect URI 등록) 전 불가 — config-gate로 버튼 미노출 상태가 기본
- **Firebase 실 sign-in**: EXT-13 (Firebase web config) + service account 전 불가 — 어댑터 미등록 시 JWT 단독 경로는 검증됨
- **실 PG 결제**: 사업자 계정 전 불가 (dev-mock 채널만 검증)
- **Expo Go 실기기 E2E**: 본 컨테이너에서 불가 — 사용자 환경에서 `mobile start-dev` 절차 필요
- ruff 잔여 F821 1건: `scheduling/service.py:967 RouteSession` — SafeWay 영역(D-7 동결), 미수정 Known Issue

## 7. Acceptance Criteria 대조 (spec §12)
| AC | 상태 |
|---|---|
| 1 필수 동의 없이 가입 불가 (서버 422+UI 차단) | ✅ |
| 2 user_consents 5필드 기록 | ✅ |
| 3 walker location 필수 | ✅ |
| 4 기존 JWT 호출 회귀 0 | ✅ (240/247, 기지 외 fail 0) |
| 5 custom-token 타인 uid 불가 | ✅ |
| 6 예약→결제→내역 e2e (dev-mock, pt_payments 행) | ✅ (test_pt_payment_flow) |
| 7 내역 = pt_payments 실 데이터 | ✅ (화면 재구축 + jest) |
| 8 staging에서 mock 미작동 | ✅ (allowlist 테스트) |
| 9 tsc 0 + jest 전체 PASS + 기지 외 fail 0 | ✅ |
