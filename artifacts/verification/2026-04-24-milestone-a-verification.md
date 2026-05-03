# Milestone A — 잔여 미흡 5건 정리 (Verification)

**일시:** 2026-04-24
**Phase:** 5 — Implementation (Milestone A)
**기반 Tech Spec:** `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md` §4.7
**Todo Plan:** `artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md` (todo A-1~A-4)

---

## 1. 작업 요약

| Todo | 작업 | 변경 파일 | 상태 |
|---|---|---|---|
| A-1 | 보험 정보 UI 표시 (PT) | backend/app/apps/pettracker/{schemas,service}.py + apps/pettracker/mobile/src/api/walkers.ts + screens/owner/WalkerProfileDetailScreen.tsx | VERIFIED |
| A-2 | CC Handover 데이터 연결 | backend/app/apps/careconnect/{schemas,router}.py + apps/careconnect/mobile/src/api/bookings.ts + screens/parent/{HandoverScreen,BookingDetailScreen}.tsx | VERIFIED |
| A-3 | 돌봄사 성범죄자 조회 stub | backend/app/modules/compliance/sex_offender_check.py (NEW) | PARTIALLY VERIFIED (외부 API 계약 별도 트랙) |
| A-4 | 회귀 검증 | TS + pytest | VERIFIED (회귀 1건 발견 즉시 fix 후 통과) |

---

## 2. A-1 보험 정보 UI 상세

### 백엔드 변경
- `WalkerProfileResponse` schema에 `has_insurance: bool`, `insurance_expiry: date | None`, `profile_photo_url: str | None` 3 필드 추가 (default value 있음 → backward-compatible)
- `service.get_walker_profile` 응답에 `qual.has_insurance`, `qual.insurance_expiry`, `qual.profile_photo_url` 매핑 추가

### 모바일 변경
- `WalkerProfile` interface에 3 필드 optional 추가
- `WalkerProfileDetailScreen`에 보험 배지 로직 추가:
  - `has_insurance` false → 표시 안 함
  - `insurance_expiry` 없음 → "보험 가입" (success 색)
  - 만료일 30일 이내 → "보험 N일 남음" (warning 색)
  - 만료됨 → "보험 만료" (danger 색)

---

## 3. A-2 CC Handover 데이터 상세

### 백엔드 변경
- `CcBookingResponse` schema에 `caregiver_name: str | None`, `child_name: str | None` 추가 (default None → backward-compatible)
- `_booking_with_names` 헬퍼 신설 — `db.get(CcChild)` + AES-GCM `decrypt_value(name_encrypted)` + `db.get(User)` 패턴
- create/accept/list 3 endpoint에 헬퍼 적용

### 모바일 변경
- `CcBooking` type에 `caregiver_name?: string` 추가
- `BookingDetailScreen`이 Handover navigate 시 `childName`, `caregiverName` params 전달
- `HandoverScreen`이 navigation params로 두 이름 받아 요약 카드 상단에 표시

### 회귀 fix (1건)
- 첫 풀런: `'CcChild' object has no attribute 'name'` AttributeError
- 원인: CcChild는 PII AES-GCM 암호화 (`name_encrypted`만 존재) — `child.name` 직접 접근 불가
- fix: `decrypt_value(child.name_encrypted)` + try/except wrap
- 재검증: persona scenario 22 passed in 3.36s

---

## 4. A-3 돌봄사 성범죄자 조회 stub 상세

신규 파일: `backend/app/modules/compliance/sex_offender_check.py`

### 포함 내용
- `CheckMethod` enum (AUTO_API / MANUAL_DOC / NOT_CHECKED)
- `CheckStatus` enum (PENDING / CLEARED / FLAGGED / EXPIRED)
- `SexOffenderCheckResult` dataclass
- `request_sex_offender_check(user_id)` — 외부 API 호출 stub (현재 NOT_CHECKED + PENDING 반환)
- `is_eligible_for_matching(result)` — 매칭 자격 판정

### 미완 (PT 출시 critical path 무관)
- 외부 API 계약 (법무부 알림e 또는 위탁기관)
- `CaregiverQualification` 모델에 `sex_offender_checked_at`, `sex_offender_cleared`, `sex_offender_check_method` 컬럼 추가 (Alembic)
- 매칭 차단 로직 — booking accept 시 `is_eligible_for_matching` 검증
- 5년 보존 + 본인 외 열람 차단 (개보법 §29)

→ CC 출시 사이클 직전 별도 트랙으로 진행 (Tech Spec §16, A-3 주석)

---

## 5. A-4 회귀 검증 결과

### TypeScript
| 영역 | 결과 |
|---|---|
| PT mobile `tsc --noEmit` | **0 errors** |
| CC mobile `tsc --noEmit` | **0 errors** |

### Backend pytest (known-issue 3 파일 제외)
| 시점 | 결과 |
|---|---|
| Milestone A 변경 후 1차 풀런 | 1 failed (CcChild.name AttributeError), 74 passed |
| 회귀 fix 후 persona 단건 재실행 | **22 passed in 3.36s** |
| 회귀 fix 후 풀런 (known-issue 제외) | **145 passed in 198.55s** (회귀 0건) |

> Known-issue 3건 (Toss webhook secret, e2e health degraded, m4_websocket auth)은 PT 출시 critical path 무관, Milestone F에서 처리 예정.

### SafeWay 회귀
- 모바일 jest: **17 suites · 71 tests · 100% pass** (Phase 0 baseline 유지)
- 웹 vitest: **12 suites · 50 tests · 100% pass** (Phase 0 baseline 유지)

---

## 6. Milestone A Decision

- ✅ A-1 보험 정보 UI: VERIFIED
- ✅ A-2 CC Handover 데이터: VERIFIED (회귀 1건 fix 포함)
- ✅ A-3 돌봄사 신원조회 stub: PARTIALLY VERIFIED (외부 API 계약 후 완성)
- ✅ A-4 회귀 검증: VERIFIED

**최종:** Milestone A 통과 → **Milestone B (모바일 테스트 인프라 + Firebase Auth 미들웨어)** 진입.

---

## 7. 다음 첫 단계 (Milestone B)

```
B-1 PT 모바일 Jest + RNTL 셋업 — apps/pettracker/mobile/{jest.config.js, package.json, __tests__/setup.ts}
B-2 공유 fixture — packages/core-mobile/__tests__/fixtures/{user,walker,booking,pet}.ts
B-3 PT 핵심 플로우 8 suites
B-4 Alembic add_user_firebase_uid
B-5 backend/app/middleware/firebase_auth.py
B-6 PT 라우터 dependency 교체
B-7 Kakao OAuth → Firebase Custom Token
B-8 packages/core-mobile/hooks/useFirebaseAuth.ts
B-9 PT 모바일 LoginScreen Firebase 통합
B-10 B 검증
```

병렬: B-Test 트랙(B-1~B-3)과 B-Auth 트랙(B-4~B-9) 동시 진행 가능.
