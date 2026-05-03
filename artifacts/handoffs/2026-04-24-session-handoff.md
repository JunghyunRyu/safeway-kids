# Session Handoff — 2026-04-24

**세션 성격:** PT/CC 품질 향상 워크스트림 신규 착수 — 9-phase 워크플로우 Phase 0~5 진행
**커밋:** 미커밋 (사용자 확인 후)
**브랜치:** main

---

## 1. Current Status

PT(PetTracker) V1.0 출시 준비 워크스트림을 신규로 시작했다. 사용자 결정 6건(PT 우선, AWS S3, WS 출시 전 필수, 사고신고 의무 연계, PortOne v2 결제 추가, Firebase Auth 회원관리)을 받아 9-phase 워크플로우의 Phase 0~4를 통과해 Final Tech Spec과 Todo Plan을 확정했다. Phase 5 Implementation에서 Phase 0(베이스라인) → Milestone A(잔여 미흡 5건) → Milestone B(모바일 테스트 인프라 + Firebase Auth 미들웨어) → Milestone C 일부(PG provider 추상화 + PortOne v2 provider)까지 진행. Backend pytest 145 passed, PT 모바일 jest 7 suites · 12 tests 신설, SafeWay/CC 회귀 0건.

---

## 2. Changed Files

### 신규 — Spec / Plan / Verification
- `artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md` — Phase 0 Intake 계획 (PT/CC 통합)
- `artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md` — Phase 3 Final Tech Spec (18 섹션)
- `artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md` — Phase 4 마일스톤 단위 todo (Phase 0 + A~G)
- `artifacts/reviews/2026-04-24-pt-cc-consensus-matrix.md` — Phase 2 합의 매트릭스 (3 reviewer + V2 보강)
- `artifacts/verification/2026-04-24-baseline-summary.md` — Phase 0 베이스라인 결과
- `artifacts/verification/2026-04-24-milestone-a-verification.md` — Milestone A 검증 보고서
- `artifacts/verification/2026-04-24-milestone-b-verification.md` — Milestone B 검증 보고서

### 신규 — 코드 (Milestone A)
- `backend/app/modules/compliance/sex_offender_check.py` — 돌봄사 신원조회 stub (외부 API 계약 별도)

### 신규 — 코드 (Milestone B)
- `backend/app/middleware/firebase_auth.py` — Firebase Auth dependency
- `backend/migrations/versions/a28a0d0bb9b6_add_user_firebase_uid.py` — Alembic (autogenerate 5건 drop 위험 즉시 fix)
- `apps/pettracker/mobile/jest.config.js`
- `apps/pettracker/mobile/src/__tests__/setup.ts`
- `apps/pettracker/mobile/src/__tests__/smoke.test.tsx`
- `apps/pettracker/mobile/src/__tests__/WalkerProfileDetailScreen.test.tsx`
- `apps/pettracker/mobile/src/__tests__/OwnerHomeScreen.test.tsx`
- `apps/pettracker/mobile/src/__tests__/SearchScreen.test.tsx`
- `apps/pettracker/mobile/src/__tests__/BookingsScreen.test.tsx`
- `apps/pettracker/mobile/src/__tests__/WalkReportScreen.test.tsx`
- `apps/pettracker/mobile/src/__tests__/ReviewScreen.test.tsx`
- `packages/core-mobile/__tests__/fixtures/index.ts`
- `packages/core-mobile/hooks/useFirebaseAuth.ts`

### 신규 — 코드 (Milestone C-1/3)
- `backend/app/modules/billing/providers/base.py` — AbstractPGProvider ABC
- `backend/app/modules/billing/providers/portone.py` — PortOne v2 provider

### 수정
- `backend/app/apps/pettracker/schemas.py` — WalkerProfileResponse +has_insurance/insurance_expiry/profile_photo_url
- `backend/app/apps/pettracker/service.py` — get_walker_profile 응답에 보험 필드 추가
- `backend/app/apps/careconnect/schemas.py` — CcBookingResponse +caregiver_name/child_name optional
- `backend/app/apps/careconnect/router.py` — _booking_with_names helper (AES-GCM decrypt) + create/accept/list 적용
- `backend/app/modules/auth/models.py` — User +firebase_uid 컬럼 (unique, nullable)
- `backend/app/modules/billing/providers/__init__.py` — PortOne export 추가
- `apps/pettracker/mobile/src/api/walkers.ts` — WalkerProfile +보험 3 필드
- `apps/pettracker/mobile/src/screens/owner/WalkerProfileDetailScreen.tsx` — 보험 배지 (만료 30일 전 경고)
- `apps/careconnect/mobile/src/api/bookings.ts` — CcBooking +caregiver_name?
- `apps/careconnect/mobile/src/screens/parent/HandoverScreen.tsx` — 아이/돌봄자 이름 표시
- `apps/careconnect/mobile/src/screens/parent/BookingDetailScreen.tsx` — Handover navigate에 이름 전달
- `packages/core-mobile/index.ts` — useFirebaseAuth + 타입 export
- `STATE.md` (이번 핸드오프 후 업데이트 예정)
- `CLAUDE.md` (Active Work 섹션 업데이트 예정)

---

## 3. Commands Executed

- `git status --short` — 21 modified + 다수 untracked 확인
- `pip install fakeredis` — fakeredis-2.35.1 설치 (Phase 0 baseline KI-1 fix)
- `python -m pytest -q --tb=line` (3회) — 174 → 1 fail(CcChild AttributeError 회귀) → 145 passed (회귀 fix 후)
- `alembic revision --autogenerate -m "add_user_firebase_uid"` — 마이그레이션 생성 (drop 5건 위험 자동 감지 → 직접 fix)
- `npx tsc --noEmit` — PT/CC 모두 0 errors (각 마일스톤 후)
- `npx jest` (PT, 5회) — 1 → 2 → 7 → 7 suites · 12 tests pass (axios + createTheme + walks API mock 점진적 fix)
- `npx jest` (SafeWay) — 17 suites · 71 tests · 100% pass (회귀 베이스라인)
- `npx vitest run` (web) — 12 suites · 50 tests · 100% pass

---

## 4. Tests and Outcomes

| Test | Result |
|---|---|
| Backend pytest (known-issue 3 파일 제외) | **145 passed in 201s** (회귀 0) |
| Backend pytest persona scenarios (단건 fix 검증) | 22 passed in 3.4s |
| PT mobile jest | **7 suites · 12 tests · 100% pass** |
| PT mobile tsc | 0 errors |
| CC mobile tsc | 0 errors |
| SafeWay mobile jest | 17 suites · 71 tests · 100% pass |
| Web vitest | 12 suites · 50 tests · 100% pass |
| PortOne provider import smoke | OK (instance.name == "portone") |

**Known issues (PT 출시 critical path 무관):**
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 → 3 fail (`test_billing_pg.py`)
- KI-3 health endpoint `degraded` → 1 fail (`test_e2e_hardening.py`)
- KI-4 m4 WS auth → 2 error (`test_m4_websocket.py`) — Milestone C-11 ws_auth.py 추출 시 같이 fix

---

## 5. Decisions Made

### 사용자 결정 6건 (2026-04-24)
1. **PT 우선 출시** — CC는 PT 안정화 후 별도 사이클
2. **AWS S3** — Naver Cloud / R2 미채택
3. **WebSocket 출시 전 필수** — Critical Path 진입 (Milestone E → C로 앞당김)
4. **사고 신고 = 법적 의무 연계** — C-6/C-7 P1→P0 격상
5. **PortOne v2 결제 추가** — Toss와 공존 (SafeWay=Toss, PT/CC=PortOne)
6. **Firebase Auth 회원관리** — PT/CC만, SafeWay JWT 듀얼 미들웨어로 보존

### Tech Spec 결정 (Consensus + tech-spec-reviewer 반영)
- **PtPayment / CcPayment 모델 신설** — 기존 BillingPlan/Invoice/Payment academy_id 외래키 충돌 회피
- **Webhook 라우터 분리** — `/billing/webhook/{toss,portone}` (충돌 회피)
- **Firebase 듀얼 인증** — get_current_user(JWT, SafeWay) + get_current_user_firebase(PT/CC)
- **useFirebaseAuth adapter 패턴** — `@react-native-firebase/auth` Expo SDK 54 호환 미확인 회피
- **일정 6주 (27 영업일)** — PT 출시 ~2026-06-04 타깃

### 회귀 fix 결정
- **CcChild AES-GCM decrypt** — `child.name` 직접 접근 불가 → `decrypt_value(child.name_encrypted)` + try/except wrap
- **Alembic autogenerate 5개 drop 직접 제거** — 운영 DB 데이터 손실 방지 (모델 import 누락이 원인, drop 의도 없음)

---

## 6. Open Issues / Blockers

### 코드 진행 중
- 🟡 **Milestone C-Pay**: C-4 Alembic create_pt_payments, C-5 PT 결제 endpoint, C-6 webhook 분리 (다음 첫 단계)
- 🟡 **Milestone C-Storage**: C-7 storage 모듈, C-9 useImageUpload, C-10 PT 모바일 통합
- 🟡 **Milestone C-WS**: C-11 ws_auth.py 추출, C-12 PT WS endpoint, C-13 useWebSocket, C-14 PT 모바일 통합
- 🟡 **Milestone D~G**: 사고 신고 + V1.1 트러스트 + 백엔드 통합 테스트 + Pre-launch QA

### 외부 작업 필요 (사용자)
- 🟡 **변호사 자문 5건 (Q-L1~Q-L5)** — K-Startup 일반상담 / 9988 / 대한상공회의소 트랙
  - Q-L1: PT 점유자 판정 (민법 §759)
  - Q-L2: CC 돌봄사 아동복지법 §26 신고의무자 해당 여부
  - Q-L3: 전자상거래법 §20 플랫폼 면책 범위
  - Q-L4: 사고 데이터 보존 5년 vs 개보법 §21
  - Q-L5: 산재법 §125 산책사·돌봄사 포함 여부
- 🟡 **AWS 계정 + IAM + S3 버킷 생성** (Milestone C-8)
- 🟡 **Firebase 프로젝트 생성 + Admin SDK service account JSON** (Milestone B-9)
- 🟡 **PortOne 가맹점 계약 + API Key/Secret** (Milestone C 실 결제)
- 🟡 **Backend dev 환경 변수 설정** (KI-2 `TOSS_WEBHOOK_SECRET` 등)

### 병렬 워크스트림 (SafeWay Kids 샌드박스)
SafeWay Kids 규제 샌드박스 후속 대응(2026-05-07 미팅 준비)은 **별도 워크스트림으로 보존**. 이 세션에서는 진척 없음. STATE.md / CLAUDE.md에서 "Parallel workstream" 섹션으로 표기.

---

## 7. Next Exact First Step

```
Milestone C-Pay 트랙 다음 단계:

1. C-4 Alembic create_pt_payments
   - PtPayment 모델을 backend/app/apps/pettracker/models.py에 추가
     (id, booking_id, amount, currency, pg_provider, imp_uid, merchant_uid,
      status, paid_at, cancelled_at, cancel_amount, created_at)
   - User.portone_customer_uid nullable 컬럼 추가
   - alembic revision --autogenerate -m "create_pt_payments"
   - 자동생성 결과를 직접 검토 (drop 위험 재발 방지)

2. C-5 PT 결제 endpoint
   - backend/app/apps/pettracker/{schemas,router,service}.py 수정
   - POST /pt/payments/prepare, /pt/payments/confirm, /pt/payments/{id}/cancel

3. C-6 webhook 분리
   - backend/app/main.py에 /billing/webhook/portone 라우터 등록
   - PortOne provider verify_webhook 호출 → fail-closed 403

4. backend pytest 회귀 검증 (145 passed 유지 확인)
```

---

## 8. Residual Risks

| Risk | Mitigation |
|---|---|
| PortOne v2 webhook 서명 형식 미정확 (V1 패치 트랙) | C-3에 TODO 명시. 실 통합 시 PortOne docs 재확인 |
| `@react-native-firebase/auth` Expo SDK 54 호환 미확인 | useFirebaseAuth adapter 패턴 → PT 앱 entry에서 SDK 선택 가능 |
| Alembic autogenerate가 추가로 drop 명령 생성할 가능성 | 매 마이그레이션 자동생성 후 직접 검토 의무화 (이번 세션에서 학습) |
| KI-4 m4_websocket auth 실패 (PT WS와 동일 코드) | C-11 ws_auth.py 추출 시 같이 fix |
| 변호사 자문 5건 회신 지연 시 Milestone D 블록 | 임시 처리 방침 spec §16에 명시. 회신 후 V1.0.1 패치 |
| KI-1 fakeredis 누락 재발 | pyproject.toml `[project.optional-dependencies] dev`에 이미 포함됨 — `pip install -e ".[dev]"` 실행 확인 |

---

## 9. Suggested Prompt for Next Session

```
이전 핸드오프: artifacts/handoffs/2026-04-24-session-handoff.md

PT/CC 품질 향상 워크스트림 — Phase 0~4 완료 (spec/plan), Phase 5 진행 중.
Milestone A (잔여 5건) + B (모바일 테스트 인프라 + Firebase 미들웨어) 통과.
Milestone C-1/3 (PG provider 추상화 + PortOne v2) 완료.

다음 첫 단계: Milestone C-Pay 트랙
- C-4 Alembic create_pt_payments + PtPayment 모델
- C-5 PT 결제 endpoint (prepare/confirm/cancel)
- C-6 /billing/webhook/portone 라우터 분리

병렬 워크스트림 SafeWay 샌드박스는 별도 (이 세션 진척 없음).
```
