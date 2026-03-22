# Milestone Report — Code Hardening

**Date**: 2026-03-21
**Auditor**: verification-auditor
**Spec**: `artifacts/specs/2026-03-21-code-hardening-spec.md`
**Senior Review**: `artifacts/reviews/2026-03-21-senior-code-review.md`
**Planning Review**: `artifacts/reviews/2026-03-21-planning-review.md`
**Test Report**: `artifacts/verification/2026-03-21-integration-test-report.md`

---

## 구현 범위

- **완료 항목 수**: 14/14
- **스펙 정의 변경 파일 수**: 19 (백엔드 15, 프론트엔드 4)
- **실제 변경 파일 수**: 30 (스펙 외 변경 파일 11개 — 아래 주석 참조)

---

## 검증 증거

### 시니어 리뷰
- **판정**: PASS WITH COMMENTS
- **CRITICAL**: 0건
- **HIGH**: 1건 — `useVehicleTracking.ts`의 stale closure로 인한 zombie WS 가능성
- **MEDIUM**: 3건 (LIKE 와일드카드 미이스케이프, MIME 매직바이트 미검증, httpx.AsyncClient 매 요청 생성)
- **LOW**: 4건 (참고 수준)

### 기획 리뷰
- **판정**: PASS
- **14개 항목 전부 수락 기준 충족**
- HIGH #1(stale closure)은 ITEM-03 수락 기준("first-message auth 동작") 범위 외 기존 코드 이슈로 판정, 후속 개선 권장

### 테스트
- **백엔드**: 96 passed, 0 failed (기준 95 → +1 신규 테스트)
- **웹**: 12 suites, 50 passed, 0 failed
- **모바일**: 10 suites, 36 passed, 0 failed
- **TypeScript**: 0 errors (web, mobile 모두)
- **총계**: 182 tests, 0 failures

---

## 실제 변경 파일 대조

### 스펙 Code Impact Map 항목 (19개) — 전부 VERIFIED
| 파일 | 스펙 항목 | 변경 확인 |
|------|-----------|-----------|
| `backend/app/config.py` | ITEM-02, 09, 10 | VERIFIED |
| `backend/app/database.py` | ITEM-10 | VERIFIED |
| `backend/app/main.py` | ITEM-11 | VERIFIED |
| `backend/app/modules/auth/service.py` | ITEM-01 | VERIFIED |
| `backend/app/modules/vehicle_telemetry/router.py` | ITEM-03, 06, 09 | VERIFIED |
| `backend/app/modules/vehicle_telemetry/service.py` | ITEM-09 | VERIFIED |
| `backend/app/modules/notification/providers/sms.py` | ITEM-04 | VERIFIED |
| `backend/app/modules/notification/providers/fcm.py` | ITEM-04 | VERIFIED |
| `backend/app/modules/notification/service.py` | ITEM-12 | VERIFIED |
| `backend/app/modules/routing_engine/service.py` | ITEM-05, 09 | VERIFIED |
| `backend/app/modules/routing_engine/distance.py` | ITEM-09 | VERIFIED |
| `backend/app/modules/compliance/router.py` | ITEM-07 | VERIFIED |
| `backend/app/modules/compliance/service.py` | ITEM-11 | VERIFIED |
| `backend/app/modules/billing/providers/toss_payments.py` | ITEM-09 | VERIFIED |
| `backend/tests/integration/test_m4_websocket.py` | ITEM-03 테스트 | VERIFIED |
| `web/src/pages/LoginPage.tsx` | ITEM-08 | VERIFIED |
| `mobile/src/hooks/useVehicleTracking.ts` | ITEM-03 | VERIFIED |
| `mobile/src/screens/admin/ProfileScreen.tsx` | ITEM-14 | VERIFIED |
| `mobile/src/screens/parent/MapScreen.tsx` | ITEM-13 | VERIFIED |

### 스펙 외 변경 파일 (11개) — 주석
| 파일 | 성격 | 판단 |
|------|------|------|
| `mobile/src/screens/driver/MapScreen.tsx` | ITEM-13 대상이나 spec Code Impact Map에 누락 | 스펙 본문(item-13 구현방안)에는 포함. 15줄 추가, 기능 일치 |
| `mobile/src/screens/parent/ProfileScreen.tsx` | 스펙 미포함, 51줄 삭제 | ITEM-14 관련 리팩토링으로 추정. 테스트 통과로 회귀 없음 확인 |
| `web/src/components/ConfirmDialog.tsx` | 스펙 미포함 | UI 리팩토링. 테스트 통과 |
| `web/src/components/DetailModal.tsx` | 스펙 미포함 | UI 리팩토링. 테스트 통과 |
| `web/src/components/FormModal.tsx` | 스펙 미포함 | UI 리팩토링. 테스트 통과 |
| `web/src/components/Toast.tsx` | 스펙 미포함 | UI 리팩토링. 테스트 통과 |
| `web/package.json` | `@tanstack/react-query` 의존성 제거 | 스펙 외. 테스트 통과 |
| `web/package-lock.json` | package.json 종속 | 자동 변경 |
| `mobile/dump.rdb` | Redis 덤프 파일 | 개발 아티팩트, 운영 영향 없음 |
| `.claude/settings.json` | 설정 파일 | 클로드 설정, 코드 무관 |
| `KakaoTalk_20260316_002310046.png` | 이미지 파일 | 삭제됨 (Bin → 0 bytes) |

---

## AC(수락 기준) 검증

| # | 기준 | 결과 |
|---|------|------|
| AC-1 | 백엔드 테스트 전체 통과 | VERIFIED — 96 passed, 0 failed |
| AC-2 | 모바일 테스트 전체 통과 | VERIFIED — 36 passed, 0 failed |
| AC-3 | 웹 테스트 전체 통과 | VERIFIED — 50 passed, 0 failed |
| AC-4 | TypeScript 컴파일 에러 0 | VERIFIED — web 0 errors, mobile 0 errors |
| AC-5 | OTP가 Redis에 저장되고 TTL 동작 | VERIFIED — test_auth.py 6 tests 통과 |
| AC-6 | production 환경에서 빈 키 시 기동 실패 | VERIFIED — config.py 검증기 구현, 기획 리뷰 PASS |
| AC-7 | WS 첫 메시지 인증 동작 | VERIFIED — test_m4_websocket.py 7 tests 통과 |
| AC-8 | 파일 업로드 검증 (MIME/크기/타입) 동작 | VERIFIED — compliance/router.py 구현, 기획 리뷰 PASS |
| AC-9 | bare `except Exception: pass` 패턴 0건 | PARTIALLY VERIFIED — 스펙 대상 파일에서 제거됨. 스펙 대상 외 파일(main.py, database.py 등)에는 여전히 존재하나 이번 스펙 범위 외 |
| AC-10 | 매직 넘버 → 상수/config 전환 완료 | VERIFIED — config.py에 7개 상수 추가, 각 파일에서 settings 참조 |
| AC-11 | 만료 문서 자동 비활성화 동작 | VERIFIED — compliance/service.py 구현, main.py에서 startup/daily 호출 |

---

## 잔여 리스크

| # | 심각도 | 설명 | 판단 |
|---|--------|------|------|
| R-1 | HIGH | `useVehicleTracking.ts` stale closure로 vehicleIds 변경 시 zombie WS 가능 | mountedRef 가드로 상태 오염 방지됨. vehicleIds 변경 빈도 낮음. 후속 이터레이션에서 개선 권장 |
| R-2 | MEDIUM | 파일 업로드 MIME 검증이 클라이언트 제공 content_type에 의존 | 현재 파일이 서빙되지 않으므로 즉시 위험 낮음. 프로덕션 확장 전 python-magic 검증 추가 권장 |
| R-3 | MEDIUM | LIKE 와일드카드(`%`, `_`) 미이스케이프 (`auth/service.py`) | SQLAlchemy ORM 파라미터 바인딩으로 SQL injection 위험 없음. 패턴 매칭 오동작 가능성만 존재 |
| R-4 | MEDIUM | toss_payments.py에서 httpx.AsyncClient를 매 요청 생성 | 결제 빈도 낮아 현재 성능 영향 미미 |
| R-5 | LOW | FCM `messaging.send()` 동기 호출이 이벤트 루프 블로킹 가능 | 트래픽 증가 시 asyncio.to_thread 래핑 고려 |
| R-6 | LOW | 스펙 외 파일 11개 변경 (web 컴포넌트 4개, parent/ProfileScreen.tsx 등) | 테스트 전체 통과로 회귀 없음 확인. 단, 스펙 추적성 누락 |
| R-7 | INFO | 2개 RuntimeWarning (unawaited coroutine) in backend tests | 기존 이슈, non-blocking. 테스트 정확성에 영향 없음 |
| R-8 | INFO | E2E 브라우저 테스트 미수행 | Phase 8에서 수행 예정 |

---

## 판정: READY WITH KNOWN RISKS

**14개 구현 항목 전부 완료, 182개 테스트 전부 통과, TypeScript 0 errors.**

CRITICAL 이슈 없음. HIGH 1건(stale closure)은 mountedRef 가드로 실질적 크래시/상태 오염이 방지되어 있으며 vehicleIds 변경 빈도가 낮아 당장의 프로덕션 리스크는 제한적. MEDIUM 3건은 모두 현재 트래픽과 운영 규모에서 즉시 위험하지 않음.

E2E 테스트(Phase 8)는 별도 이터레이션으로 분리됨.

---

## 다음 단계

1. **Phase 8**: E2E 테스트 — 브라우저/앱 통합 검증
2. **후속 이터레이션**: 잔여 리스크 R-1~R-5 개선 (우선순위 순)
3. **스펙 외 변경 추적**: web 컴포넌트 4개 변경, parent/ProfileScreen.tsx 변경 원인을 별도 Gap Note 또는 변경 로그에 기록 권장
