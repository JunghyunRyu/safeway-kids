# Todo Plan — PetTracker 품질 향상 (V1.0 출시 준비)

**작성일:** 2026-04-24
**Phase:** 4 — Todo Plan
**기반 Tech Spec:** [`artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md`](../specs/2026-04-24-pt-quality-uplift-final-tech-spec.md)
**총 일정:** 27 영업일 (~5.5주)
**타깃 출시:** 2026-06-04 (영업일 기준, ±3일)

---

## 진행 표기 규칙

- `[ ]` 미시작 / `[~]` 진행 중 / `[x]` 완료 / `[!]` 블록됨
- 각 todo: **ID · 작업 · 산출물 · 완료기준 (DoD)**
- 마일스톤 종료 = 마지막 todo의 DoD 만족 + 마일스톤 검증 todo 통과

---

## Phase 0 — 베이스라인 검증 (0.5 영업일)

목표: "지금 무엇이 깨져 있는지" 명확히 한 후 변경 시작.

- [ ] **0-1** · 백엔드 pytest 풀런 + 결과 JSON 캡처
  - 산출: `artifacts/verification/2026-04-24-baseline-backend.txt`
  - DoD: 통과/실패 카운트 명시, 실패 시 원인 분류
- [ ] **0-2** · PT 모바일 `tsc --noEmit` + ESLint
  - 산출: `artifacts/verification/2026-04-24-baseline-pt-mobile.txt`
  - DoD: errors=0 또는 모든 error 분류
- [ ] **0-3** · CC 모바일 `tsc --noEmit` + ESLint
  - 산출: `artifacts/verification/2026-04-24-baseline-cc-mobile.txt`
  - DoD: errors=0 또는 모든 error 분류
- [ ] **0-4** · SafeWay 모바일 Jest 풀런 (회귀 베이스라인 = 71 passed)
  - 산출: 동일 디렉토리, baseline-safeway-mobile.txt
  - DoD: 71 passed 확인
- [ ] **0-5** · 웹 vitest 풀런 (회귀 베이스라인 = 50 passed)
  - DoD: 50 passed 확인
- [ ] **0-6** · 베이스라인 종합 보고
  - 산출: `artifacts/verification/2026-04-24-baseline-summary.md`
  - DoD: 모든 베이스라인 수치 + 깨진 항목 명시 + Milestone A 시작 승인

**Phase 0 검증:** 모든 항목 통과 또는 known-issue로 분류됨.

---

## Milestone A — 잔여 미흡 정리 (3 영업일)

목표: 핸드오프 04-09에서 미해결 5건 + CC 핸드오버 + 돌봄사 신원조회 close.

- [ ] **A-1** · (O5/PT-17) 보험 정보 UI
  - 변경: `apps/pettracker/mobile/src/screens/owner/WalkerProfileDetailScreen.tsx`
  - DoD: 보험 가입·만료일 배지 표시, 만료 30일 전 경고 색상
- [ ] **A-2** · (O4/CC-24) Handover 아이/돌봄자 이름 데이터 연결
  - 변경: `backend/app/apps/careconnect/router.py` (nested join), `apps/careconnect/mobile/src/screens/parent/HandoverScreen.tsx`
  - DoD: 화면에 실제 이름 표시, API 응답 검증
- [ ] **A-3** · 돌봄사 성범죄자 조회 외부 API 통합 (CC 온보딩 전제)
  - 신규: `backend/app/modules/compliance/sex_offender_check.py` (외부 API stub + 결과 저장)
  - DoD: `Caregiver` 모델에 `sex_offender_checked_at`, `cleared` 컬럼 + 미완료 시 매칭 차단
  - **참고:** 실제 외부 API 계약은 별도 트랙. PT 출시에는 영향 없으나 CC 사이클 전 필수
- [ ] **A-4** · 잔여 정리 회귀 검증
  - DoD: TS 0 errors (PT + CC), 백엔드 unit pass, 수동 회귀 체크리스트 (보험 배지·핸드오버 표시) 통과

> O1(모바일 테스트), O2(S3), O3(RRULE)은 후속 마일스톤(B/C/E)에서 처리.

**Milestone A 검증:** A-4 통과.

---

## Milestone B — 모바일 테스트 인프라 + Firebase Auth 미들웨어 (4 영업일)

목표: PT 모바일 자동 테스트 0개 → 8 suites · 30+ tests, Firebase Auth 듀얼 미들웨어.

### B-Test 트랙 (병렬 가능, 2일)

- [ ] **B-1** · PT 모바일 Jest + RNTL 셋업
  - 변경: `apps/pettracker/mobile/{jest.config.js,package.json,__tests__/setup.ts}`
  - DoD: 빈 suite 1개 pass (`Hello World`)
- [ ] **B-2** · 공유 fixture
  - 신규: `packages/core-mobile/__tests__/fixtures/{user,walker,booking,pet}.ts`
  - DoD: PT/CC에서 import 가능
- [ ] **B-3** · PT 핵심 플로우 테스트 8 suites
  - `예약 생성·취소`, `산책 시작·종료`, `리뷰 작성`, `산책사 검색`, `즐겨찾기` (B-Test에서는 mock UI 검증, 실 기능은 E), `사고 신고` (mock), `산책 리포트` (mock), `Firebase Auth 로그인`
  - DoD: 30+ tests, 100% pass

### B-Auth 트랙 (병렬 가능, 2일)

- [ ] **B-4** · Alembic `add_user_firebase_uid` 마이그레이션
  - 신규: `backend/migrations/versions/2026_04_24_*_add_user_firebase_uid.py`
  - DoD: nullable + unique, upgrade/downgrade 양방향 동작
- [ ] **B-5** · Firebase Admin SDK + 미들웨어
  - 신규: `backend/app/middleware/firebase_auth.py`
  - 의존: `pyproject.toml`에 `firebase-admin` 추가
  - DoD: `get_current_user_firebase` dependency 단위 테스트 pass (Admin SDK mock)
- [ ] **B-6** · PT 라우터 dependency 교체
  - 변경: `backend/app/apps/pettracker/router.py` 모든 엔드포인트
  - DoD: SafeWay 라우터(`get_current_user`)는 변경 없음, PT 라우터만 `get_current_user_firebase`
- [ ] **B-7** · Kakao OAuth → Firebase Custom Token 발급
  - 변경: `backend/app/modules/auth/service.py:kakao_login`
  - DoD: Kakao 로그인 응답에 `firebase_custom_token` 추가
- [ ] **B-8** · `packages/core-mobile/hooks/useFirebaseAuth.ts`
  - 신규: signIn, signOut, currentUser, idToken
  - 의존: `@react-native-firebase/auth` (Expo SDK 54 호환 확인 필수)
  - DoD: 단위 테스트 pass (mock Firebase SDK)
- [ ] **B-9** · PT 모바일 LoginScreen Firebase 통합
  - 변경: `apps/pettracker/mobile/src/screens/...LoginScreen.tsx`
  - DoD: Kakao 로그인 → Custom Token → Firebase signIn → ID token으로 PT API 호출 e2e 동작 (manual 시연)

### B 통합

- [ ] **B-10** · B 검증
  - DoD: B-1~B-9 모두 완료 + Jest 30+ tests pass + 백엔드 SafeWay 회귀 95 유지

**Milestone B 검증:** B-10 통과.

---

## Milestone C — PortOne v2 + AWS S3 + WebSocket (5 영업일)

목표: PT 결제 자립, 사진 업로드 인프라, 산책 라이브 위치.

### C-Pay 트랙 (PortOne, 2일)

- [ ] **C-1** · PG provider 추상화
  - 신규: `backend/app/modules/billing/providers/base.py` (AbstractPGProvider)
  - DoD: confirm/cancel/verify_webhook 추상 메서드 정의
- [ ] **C-2** · Toss provider 리팩터
  - 변경: `backend/app/modules/billing/providers/toss_payments.py` (AbstractPGProvider 구현)
  - DoD: SafeWay 결제 통합 테스트 100% 유지
- [ ] **C-3** · PortOne v2 provider
  - 신규: `backend/app/modules/billing/providers/portone.py`
  - 메서드: `confirm_payment`, `cancel_payment(cancel_amount=None)`, `verify_webhook` (HMAC fail-closed)
  - DoD: 단위 테스트 pass (PortOne API mock)
- [ ] **C-4** · Alembic `create_pt_payments` 마이그레이션
  - 신규: `PtPayment` 테이블 + User.portone_customer_uid nullable 컬럼
  - DoD: upgrade/downgrade 양방향 동작
- [ ] **C-5** · PT 결제 엔드포인트
  - 변경: `backend/app/apps/pettracker/{models,schemas,router,service}.py`
  - 엔드포인트: `POST /pt/payments/prepare`, `POST /pt/payments/confirm`, `POST /pt/payments/{id}/cancel`
  - DoD: PortOne sandbox 통합 테스트 pass
- [ ] **C-6** · `/billing/webhook/portone` 분리 등록
  - 변경: `backend/app/main.py`
  - DoD: PortOne 서명 검증 통과 + idempotency (imp_uid unique) 검증

### C-Storage 트랙 (S3, 1일, 병렬)

- [ ] **C-7** · `backend/app/modules/storage/{s3,router,schemas}.py`
  - 의존: `aioboto3` 추가
  - 엔드포인트: `POST /api/v1/storage/upload-url`, `POST /api/v1/storage/confirm`
  - DoD: `moto` mock 통합 테스트 pass
- [ ] **C-8** · AWS S3 IAM + 버킷 설정
  - 산출: `deploy/aws/s3-iam-policy.json`, `deploy/aws/s3-bucket-config.tf` (또는 동등 IaC)
  - DoD: `incident_photo` prefix는 KMS 강제 + object lock 5y, 다른 prefix는 SSE-S3
  - **사용자 작업:** AWS Console에서 IAM/버킷 생성 (코드만 spec 제공)
- [ ] **C-9** · `packages/core-mobile/hooks/useImageUpload.ts`
  - 신규: presigned URL → PUT → confirm 전체 플로우
  - DoD: 단위 테스트 pass (fetch mock)
- [ ] **C-10** · PT 모바일 ImagePicker → S3 통합
  - 변경: `apps/pettracker/mobile/src/screens/walker/{WalkScreen,WalkerProfileScreen}.tsx`
  - DoD: 사진 선택 → S3 업로드 → confirm → 백엔드 photo_url 영속 manual 시연

### C-WS 트랙 (WebSocket, 1일, 병렬)

- [ ] **C-11** · `backend/app/middleware/ws_auth.py` 신규
  - 추출 원본: `backend/app/modules/vehicle_telemetry/router.py:170-190`
  - DoD: JWT/Firebase ID token 분기 처리 단위 테스트 pass
- [ ] **C-12** · PT WS 엔드포인트
  - 변경: `backend/app/apps/pettracker/router.py` (`WS /pt/walks/{session_id}/live`)
  - Redis 채널: `pt:walk:{session_id}:updates`
  - DoD: ping loop 30초, first-message 인증 5초 timeout, walker broadcast/owner subscribe 통합 테스트 pass
- [ ] **C-13** · `packages/core-mobile/hooks/useWebSocket.ts`
  - 신규: 인증된 WS 연결 + reconnect (지수 백오프) + ping
  - DoD: 단위 테스트 pass (mock-socket)
- [ ] **C-14** · PT 모바일 LiveTrackScreen WS 통합
  - 변경: `apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx`
  - DoD: WS 연결 → polyline 실시간 업데이트, 5회 재연결 실패 시 HTTP polling fallback 동작 manual 시연
- [ ] **C-15** · WS latency 측정
  - 산출: `artifacts/verification/2026-XX-XX-ws-latency.md`
  - DoD: p50 < 1s, p95 < 3s

### C 통합

- [ ] **C-16** · C 검증
  - DoD: C-1~C-15 완료 + 회귀 테스트 0 영향 (SafeWay 95 + Toss 통합 100%)

**Milestone C 검증:** C-16 통과.

---

## Milestone D — 사고 신고 기능 (P0, 법적 의무) (4 영업일)

목표: 법적 의무 연계 사고 신고 + 외부 다이얼링 + 5년 보존.

- [ ] **D-1** · 변호사 자문 5건 회신 확인 (Q-L1, Q-L4 최소)
  - 채널: K-Startup 일반상담 (D+3 예상) → Q-L1, Q-L4
  - 산출: `artifacts/business/regulatory/2026-XX-XX-q-l1-l4-response.md`
  - DoD: 회신 도착 또는 임시 처리 방침 확정 (spec §16)
- [ ] **D-2** · Alembic `create_pt_incident_reports` 마이그레이션
  - 신규: `PtIncidentReport` 테이블 + `submitted_at` 이후 update 차단 트리거 (PostgreSQL trigger)
  - DoD: append-only 동작 검증 단위 테스트
- [ ] **D-3** · PT 사고 신고 엔드포인트
  - 변경: `backend/app/apps/pettracker/{models,schemas,router,service}.py`
  - 엔드포인트: `POST /pt/walks/{id}/incident`, `GET /pt/walks/{id}/incident`
  - DoD: 제출 → DB 영속 + locked=true 통합 테스트 pass
- [ ] **D-4** · 외부 알림 (FCM + 이메일)
  - 변경: `backend/app/modules/notification/` 또는 PT service
  - DoD: 견주에게 push + 이메일 manual 시연
- [ ] **D-5** · S3 incident_photo 버킷 KMS + object lock 5y
  - 변경: C-8의 IaC에 incident_photo prefix별 정책
  - DoD: AWS Console에서 KMS 암호화 + object lock governance 5y 확인
- [ ] **D-6** · PT 모바일 PtIncidentReportScreen
  - 신규: `apps/pettracker/mobile/src/screens/walker/PtIncidentReportScreen.tsx`
  - 요구: 상단 법적 안내 박스 + 외부 다이얼링 카드 3개 (`tel:119`, `tel:112`, 동물보호센터 GPS 기반 자동 매핑) + 사진 첨부 + 제출 후 잠금
  - DoD: 사용자 시나리오 2 e2e manual 시연
- [ ] **D-7** · 견주 incident 알림 화면 (read-only)
  - 신규: `apps/pettracker/mobile/src/screens/owner/IncidentDetailScreen.tsx`
  - DoD: 푸시 → 화면 진입 → 사진·진술·외부 신고 채널 표시 manual 시연
- [ ] **D-8** · D 검증
  - DoD: D-1~D-7 완료 + S3 incident_photo retention 정책 검증 + SafeWay 회귀 0

**Milestone D 검증:** D-8 통과.

---

## Milestone E — V1.1 트러스트 P0 (5 영업일)

목표: 즐겨찾기 산책사 + 정기 산책 (PortOne 자동 결제) + 산책 리포트.

### E-Fav 트랙 (즐겨찾기, 1일)

- [ ] **E-1** · Alembic `create_favorite_walkers`
  - 신규: `FavoriteWalker(id, user_id, walker_id, created_at, unique(user_id, walker_id))`
  - DoD: 양방향 마이그레이션 동작
- [ ] **E-2** · 즐겨찾기 엔드포인트
  - 변경: `backend/app/apps/pettracker/router.py`
  - 엔드포인트: `POST/DELETE /pt/walkers/{id}/favorite`, `GET /pt/walkers/favorites`
  - DoD: unique 제약 위반 시 200 idempotent 통합 테스트 pass
- [ ] **E-3** · PT 모바일 FavoritesScreen + 별표 토글
  - 신규: `apps/pettracker/mobile/src/screens/owner/FavoritesScreen.tsx`
  - 변경: 산책사 프로필 화면에 별표 버튼
  - DoD: 즐겨찾기 등록 → 홈 "내 산책사" 섹션 → 빠른 재예약 manual 시연

### E-Recurring 트랙 (정기 산책, 2일)

- [ ] **E-4** · Alembic `add_pt_booking_recurrence`
  - 변경: `PtBooking.recurrence_rule String(200) nullable`, `parent_booking_id FK→self nullable`
  - DoD: 양방향 동작
- [ ] **E-5** · RRULE 슬롯 확장 + cron job
  - 신규: `backend/app/apps/pettracker/service.py:expand_recurrence_to_slots`
  - 의존: `rrule` 라이브러리
  - 신규: 12시간 전 자동 청구 cron (`backend/app/scheduler/pt_recurring_charge.py`)
  - DoD: RRULE 12개 occurrence 확장 통합 테스트 pass
- [ ] **E-6** · 정기 예약 엔드포인트
  - 변경: `backend/app/apps/pettracker/router.py` (`POST /pt/bookings/recurring`)
  - DoD: PortOne 빌링키 자동 청구 통합 테스트 pass
- [ ] **E-7** · PT 모바일 RecurringBookingScreen
  - 신규: `apps/pettracker/mobile/src/screens/owner/RecurringBookingScreen.tsx`
  - 요구: 매일/매주/격주 + 종료 조건 (날짜/횟수)
  - DoD: 정기 예약 생성 → 12시간 전 결제 시뮬 → 알림 manual 시연
- [ ] **E-8** · PortOne 빌링키 자동 청구 통합
  - 변경: E-5의 cron이 `PtPayment.create_charge_with_billing_key` 호출
  - DoD: 결제 성공/실패 양 분기 통합 테스트 pass

### E-Report 트랙 (산책 리포트, 2일)

- [ ] **E-9** · Alembic `add_walk_session_route_geojson`
  - 변경: `WalkSession.route_geojson JSONB nullable`
  - DoD: 양방향 동작
- [ ] **E-10** · 산책 종료 시 GPS history → GeoJSON LineString 저장
  - 변경: `backend/app/apps/pettracker/service.py:complete_walk_session`
  - DoD: GPS 100점 → LineString geometry 통합 테스트 pass
- [ ] **E-11** · PT 모바일 WalkReportScreen
  - 신규: `apps/pettracker/mobile/src/screens/owner/WalkReportScreen.tsx`
  - 요구: Leaflet WebView polyline + 사진 그리드 + 산책사 메모 + KakaoTalk share 버튼
  - DoD: 사용자 시나리오 4(?) — 정확히는 산책 완료 → 리포트 진입 → polyline 렌더 manual 시연
- [ ] **E-12** · E 검증
  - DoD: E-1~E-11 완료 + 즐겨찾기 + 정기예약 + 리포트 e2e + SafeWay 회귀 0

**Milestone E 검증:** E-12 통과.

---

## Milestone F — 백엔드 통합 테스트 + 회귀 매트릭스 (3 영업일)

목표: PT 라우터 핵심 80%+ 커버, 회귀 매트릭스 자동화.

- [ ] **F-1** · `backend/tests/unit/test_pt_commission.py`
  - 케이스: 15% 커미션 계산, 부분 환불 시 재산정, 정기 예약 자동 청구 수수료
  - DoD: 10+ tests pass
- [ ] **F-2** · `backend/tests/integration/test_pettracker_e2e.py`
  - 시나리오: 회원가입(Firebase) → 펫 등록 → 산책사 검색 → 즐겨찾기 → 예약(결제) → 산책 시작 → GPS broadcast → 산책 완료 → 리포트 → 리뷰
  - DoD: 풀 e2e pass
- [ ] **F-3** · `backend/tests/integration/test_portone_webhook.py`
  - 케이스: 정상 webhook, 서명 위조, idempotency, 부분 환불
  - DoD: 8+ tests pass
- [ ] **F-4** · `backend/tests/integration/test_pt_incident.py`
  - 케이스: 제출 → locked → 두 번째 update 시도 422, retention 시뮬
  - DoD: 5+ tests pass
- [ ] **F-5** · 회귀 매트릭스 (CI 통합)
  - 산출: `.github/workflows/regression-pt.yml` 또는 동등
  - DoD: SafeWay 95 + PT 새 통합 30+ + 모바일 jest 30+ 모두 자동 실행 pass
- [ ] **F-6** · F 검증
  - DoD: F-1~F-5 완료 + 전체 백엔드 테스트 카운트 130+ pass

**Milestone F 검증:** F-6 통과.

---

## Milestone G — Pre-launch QA + EAS Build (2.5 영업일)

목표: 출시 직전 사용자 시나리오 시연 + 모바일 빌드 + 문서 정합.

- [ ] **G-1** · 사용자 시나리오 1~4 E2E 수동 시연
  - 시나리오 1: 정기 산책 결제 (PortOne)
  - 시나리오 2: 사고 신고
  - 시나리오 3: 산책 라이브 위치 (WS)
  - 시나리오 4: 즐겨찾기 재예약
  - DoD: 4개 시나리오 모두 성공 + 화면 캡처 첨부
- [ ] **G-2** · 외부 다이얼링 동작 확인
  - 119/112/동물보호센터 → `tel:` URL 전화 다이얼러 호출 (실제 거지 말고 화면 진입만)
  - DoD: iOS + Android 양쪽 확인
- [ ] **G-3** · Feature flag 동작 검증
  - 변경: `.env.production`에 `PORTONE_ENABLED`, `FIREBASE_AUTH_ENABLED`, `INCIDENT_REPORT_ENABLED`
  - DoD: 각 flag false 시 기능 503/410, true 시 정상 동작
- [ ] **G-4** · EAS Build (production)
  - 변경: `apps/pettracker/mobile/eas.json` (production 프로파일)
  - DoD: iOS/Android 양 플랫폼 빌드 success
- [ ] **G-5** · 개인정보처리방침 페이지 업데이트
  - 변경: `site/` 또는 모바일 in-app 문서
  - 추가 항목: Firebase Auth(Google 처리) + AWS S3(사진 보존) + 사고 신고 5년 보존
  - DoD: 페이지 게시 + 모바일 링크 동작
- [ ] **G-6** · 출시 체크리스트
  - 산출: `artifacts/reports/2026-XX-XX-pt-launch-checklist.md`
  - 항목: AWS 가맹점 ID, PortOne 가맹점 계약, Firebase 프로젝트, EAS 빌드 ID, 약관·개인정보처리방침 링크
  - DoD: 모든 항목 ✓ 또는 미해결 명시
- [ ] **G-7** · G 검증
  - DoD: G-1~G-6 완료 + Milestone Report 작성 (Phase 7)

**Milestone G 검증:** G-7 통과.

---

## Verification Gate (전체)

| ID | 검증 | 통과 기준 |
|---|---|---|
| V-1 | TypeScript 0 errors (PT 모바일) | tsc --noEmit exit 0 |
| V-2 | PT 모바일 Jest | 8 suites · 30+ tests pass |
| V-3 | 백엔드 pytest | SafeWay 95 + PT 새 통합 30+ pass |
| V-4 | AWS S3 통합 | KMS + object lock 5y 검증 |
| V-5 | PortOne sandbox | confirm + cancel + webhook + 부분환불 동작 |
| V-6 | Firebase Auth | Custom Token → ID token → API 호출 e2e |
| V-7 | WS latency | p50 < 1s, p95 < 3s |
| V-8 | 사고 신고 retention | DB locked + S3 object lock 5y 검증 |
| V-9 | SafeWay 회귀 | 백엔드 95 + 모바일 71 + 웹 50 모두 100% |
| V-10 | 변호사 자문 5건 | 회신 또는 임시 처리 방침 spec 반영 |

---

## Risk / Hold List

| 항목 | 영향 | 처리 |
|---|---|---|
| Q-L1·Q-L4 회신 지연 | D-1 블록 → D 일정 지연 | 임시 처리 방침으로 진행, 회신 후 V1.0.1 패치 |
| PortOne 가맹점 계약 미완 | C-3 결제 실 동작 불가 (sandbox만) | 출시 전 가맹점 계약 트랙 별도 진행 |
| Firebase 프로젝트 생성 권한 | B-5 Admin SDK 동작 불가 | 사용자가 콘솔에서 생성 + service account JSON 전달 |
| AWS 계정/IAM 권한 | C-7 동작 불가 | 사용자가 IAM 정책 적용 + Access Key 전달 (또는 IAM Role) |
| `@react-native-firebase/auth` Expo SDK 54 호환 | B-8 블록 가능 | 호환 미확인 시 `firebase` JS SDK + REST 직접 사용 fallback |
| EAS Build 비용 | G-4 무료 한도 초과 가능 | 미리 EAS 플랜 확인 |

---

## Dependencies (외부)

- **AWS 계정** — IAM 사용자 생성, S3 버킷 생성 권한 (사용자)
- **Firebase 프로젝트** — Console 생성, Admin SDK service account JSON 다운로드 (사용자)
- **PortOne 가맹점** — 가맹점 계약, API Key/Secret 발급 (사용자)
- **변호사 자문** — Q-L1, Q-L4 무료 회신 (K-Startup 일반상담)

---

## Suggested Cron / Scheduling

- **정기 산책 자동 청구**: 매시 0분 cron — 12시간 후 시작 예약 검색 → PortOne 빌링키 청구
- **PortOne webhook idempotency 정리**: 매일 03시 — 7일 이전 webhook log 정리
- **incident retention 알림**: 매월 1일 — 5년 도래 30일 전 사고 자동 정리 예고

---

## Suggested First Step

```
Phase 0 시작 — 베이스라인 검증
1. backend/.venv 활성 후 pytest -q (todo 0-1)
2. apps/pettracker/mobile && npx tsc --noEmit (todo 0-2)
3. apps/careconnect/mobile && npx tsc --noEmit (todo 0-3)
4. mobile && npx jest (todo 0-4)
5. web && npm run test (todo 0-5)
6. 결과를 artifacts/verification/2026-04-24-baseline-summary.md로 합본
7. 모든 baseline 통과 확인 후 Milestone A-1 시작
```
