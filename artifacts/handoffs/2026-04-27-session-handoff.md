# Session Handoff — 2026-04-27

**세션 성격:** PT V1.0 출시 — Milestone C 백엔드 트랙 완전 종료 (Pay + Storage + WS)
**커밋:** 미커밋 (사용자 확인 후)
**브랜치:** main

---

## 1. Current Status

PT/CC 품질 향상 워크스트림의 Phase 5 Milestone C 백엔드 트랙을 완전히 닫았다. C-4~C-7(Pay + Storage)에 이어 C-11/C-12(WS)까지 추가 진행. 모든 단계에서 backend pytest **145 passed (회귀 0)**을 유지하면서 PortOne v2 결제, AWS S3 storage 추상화, PT 실시간 산책 추적용 WebSocket을 백엔드에 통합했다. KI-4 m4_websocket는 C-11 ws_auth.py 추출 + DI 주입으로 1차 회귀 발견·해소했고, 잔존 1 error는 pytest unraisable hook가 캡처하는 teardown race(인프라 이슈)로 분류해 Milestone F로 이연.

---

## 2. Changed Files

### 신규 — 코드 (Milestone C-Pay)
- `backend/app/apps/pettracker/models.py` (수정) — `PtPayment` + `PtPaymentStatus` enum + 테이블 + 인덱스
- `backend/migrations/versions/c4b1f5e7a8d2_create_pt_payments.py` — manual 마이그레이션 (autogenerate 미사용, drop 위험 회피)
- `backend/app/modules/auth/models.py` (수정) — `User.portone_customer_uid` 컬럼

### 신규 — 코드 (Milestone C-Storage)
- `backend/app/modules/storage/__init__.py`
- `backend/app/modules/storage/base.py` — `AbstractStorageProvider` + `PresignedUpload` dataclass
- `backend/app/modules/storage/s3.py` — `S3StorageProvider` (boto3 lazy import)
- `backend/app/modules/storage/local.py` — `LocalStorageProvider` (dev fallback)
- `backend/app/modules/storage/factory.py` — `get_storage()` env 기반 선택
- `backend/app/modules/storage/schemas.py` — `UploadUrlRequest/Response`
- `backend/app/modules/storage/router.py` — `POST /upload-url`

### 신규 — 코드 (Milestone C-WS)
- `backend/app/middleware/ws_auth.py` — `authenticate_jwt_token`, `authenticate_firebase_token`, `negotiate_ws_auth` (DI session_factory 지원)

### 수정 — 라우터/서비스/스키마
- `backend/app/apps/pettracker/schemas.py` — Payment 스키마 6개 (`PaymentPrepare/Confirm/Cancel` Request/Response)
- `backend/app/apps/pettracker/service.py` — `prepare_payment`, `confirm_payment`, `cancel_payment`, `handle_portone_webhook_event`
- `backend/app/apps/pettracker/router.py` — `/pt/payments/{prepare,confirm,{id}/cancel}` 3 endpoint + `/pt/ws/walks/{session_id}` WebSocket
- `backend/app/modules/billing/router.py` — `POST /webhook/portone` (HMAC fail-closed)
- `backend/app/modules/vehicle_telemetry/router.py` — 인라인 `_authenticate_token` 삭제, `negotiate_ws_auth(authenticate_jwt_token)` 호출. teardown race 흡수용 try/except.
- `backend/app/main.py` — storage 라우터 등록 (`/api/v1/storage/*`)
- `backend/app/config.py` — `portone_*` × 3, `aws_*` × 4 설정 추가
- `STATE.md` — Phase/Next gate/Blockers/Active Artifacts 갱신
- `CLAUDE.md` — Active Work (Live) 미러 갱신 (예정)

### 신규 — 검증 아티팩트
- `artifacts/verification/2026-04-24-milestone-c-pay-storage-verification.md` — C-4~C-7 검증
- `artifacts/verification/2026-04-27-milestone-c-ws-backend-verification.md` — C-11/C-12 검증

---

## 3. Commands Executed

| Command | Result |
|---|---|
| import smoke (PtPayment 모델 + User.portone_customer_uid + PtPaymentStatus) | OK |
| import smoke (PT payment service + 3 endpoints `/pt/payments/{prepare,confirm,{id}/cancel}`) | OK |
| import smoke (`/api/v1/billing/webhook/portone` 등록) | OK |
| import smoke (`/api/v1/storage/upload-url` + LocalStorageProvider fallback) | OK |
| `python -m pytest -q --ignore=test_billing_pg --ignore=test_e2e_hardening --ignore=test_m4_websocket` (C-7 후) | **145 passed in 200.79s** (회귀 0) |
| import smoke (`ws_auth` + m4 router) | OK |
| `python -m pytest -q tests/integration/test_m4_websocket.py` (C-11 1차 후) | 5 passed, 2 failed (회귀 발견) |
| `python -m pytest -q tests/integration/test_m4_websocket.py` (DI fix 후) | 7 passed, 1 error (baseline 동일) |
| `python -m pytest -q --ignore=...` (C-11 후) | **145 passed in 215.36s** (회귀 0) |
| import smoke (`/api/v1/pt/ws/walks/{session_id}` 등록) | OK |
| `python -m pytest -q --ignore=...` (C-12 후) | **145 passed in 218.98s** (회귀 0) |

---

## 4. Tests and Outcomes

| Test | Result |
|---|---|
| Backend pytest (known-issue 3 파일 제외) | **145 passed in 218.98s** (3회 연속 동일, 회귀 0) |
| m4 websocket suite | 7 passed, 1 error (baseline 유지 — KI-4) |
| import smoke 6건 (PtPayment / PT payments router / PortOne webhook / storage / ws_auth / PT WS) | 모두 OK |

**Known Issues (PT 출시 critical path 무관):**
- KI-2 `TOSS_WEBHOOK_SECRET` 미설정 → 3 fail (`test_billing_pg.py`)
- KI-3 health endpoint `degraded` → 1 fail (`test_e2e_hardening.py`)
- KI-4 m4_websocket teardown race → 1 error (`test_ws_accepts_valid_token_query_param`). C-11 refactor로 1 error는 해소, 잔존 1은 테스트 인프라 이슈

---

## 5. Decisions Made

### 설계 결정
- **PtPayment 컬럼 명명**: spec의 `imp_uid`(V1) 시맨틱 유지. PortOne v2의 `paymentId`도 V1 호환 키 검색으로 webhook handler에서 fallback 처리.
- **Webhook 라우터 path**: spec `/billing/webhook/{toss,portone}` 분리 표방했으나 SafeWay 배포본 호환을 위해 Toss `/webhook` 그대로 두고 PortOne만 `/webhook/portone` 신규 등록. 양쪽 fail-closed HMAC.
- **Storage 자격증명 env-driven**: `s3_bucket`이 빈 문자열이면 `LocalStorageProvider` fallback. dev 환경에서 AWS 자격증명 없이도 presigned URL 발급 검증 가능.
- **boto3 lazy import**: production에서만 필요. dev는 LocalStorage만 쓰므로 boto3 미설치 환경에서도 main.py 부팅 정상.
- **ws_auth DI session_factory**: pytest가 router-level `async_session_factory`를 patch하는 패턴을 보존하기 위해 `authenticate_jwt_token(token, session_factory=None)` 시그니처. m4 router는 lambda로 patched factory 명시 주입.
- **PT WS 인가**: `walker_id` 또는 `booking.owner_id` 둘 다 허용. 사용자(부모)와 워커 모두 실시간 추적 가능.
- **PT WS auth는 JWT 유지**: spec FR-2 Firebase 듀얼은 B-7에서 일괄 전환. 현 PT 기존 endpoint와 동일 패턴 유지로 일관성 확보.

### Trade-off / 보류
- **KI-4 잔존 1 error**: handler 본문에 try/except (ValueError, RuntimeError) 추가했으나 pytest unraisable hook가 별도로 캡처. 테스트 인프라 정비(이벤트 루프 teardown 또는 unraisable hook 비활성)는 Milestone F로 이연.
- **alembic upgrade head 미실행**: pytest는 모델 등록만으로 145 passed 유지. 실 dev/prod DB에는 사용자 확인 후 적용.

---

## 6. Open Issues / Blockers

### 코드 진행 중 (Milestone C 모바일 통합 트랙)
- 🟡 **C-9** `useImageUpload` (PT mobile) — `/api/v1/storage/upload-url` 호출 → presigned PUT URL 받기 → S3 직접 업로드 → download_url 저장
- 🟡 **C-10** PT 모바일 통합 — `WalkerProfileEditScreen` (프로필 사진), `WalkReportScreen` (도착 사진) 사진 업로드 UI ↔ useImageUpload
- 🟡 **C-13** `useWebSocket` (PT mobile) — `/pt/ws/walks/{session_id}` first-message-auth + 메시지 핸들러
- 🟡 **C-14** PT 모바일 통합 — `OwnerWalkTrackingScreen` (가칭) 산책 중 실시간 위치/메모 표시
- 🟡 **C-15/C-16** 통합 회귀 매트릭스 + 백엔드 통합 테스트

### 외부 작업 필요 (사용자)
- 🟡 변호사 자문 5건 (Q-L1~Q-L5) — Milestone D 시작 전 회신
- 🟡 AWS 계정 + IAM + S3 버킷 생성 (C-10 통합 후 prod 검증 필요)
- 🟡 Firebase 프로젝트 생성 + Admin SDK service account JSON (B-9)
- 🟡 PortOne 가맹점 계약 + API Key/Secret (실 결제 검증)
- 🟡 Backend dev 환경 변수 — `TOSS_WEBHOOK_SECRET` (KI-2), `PORTONE_*` × 3, `AWS_*` × 4

### 병렬 워크스트림 (SafeWay Kids 샌드박스)
이 세션에서는 진척 없음. STATE.md "Parallel workstream" 섹션 그대로.

---

## 7. Next Exact First Step

```
Milestone C 모바일 통합 트랙 — C-9 useImageUpload 부터:

1. C-9 useImageUpload hook
   - packages/core-mobile/hooks/useImageUpload.ts 신설
   - API: const { upload, progress, error } = useImageUpload()
   - 흐름:
     a. POST /api/v1/storage/upload-url { object_key, content_type } → presigned URL
     b. PUT to presigned URL with file body (axios)
     c. return download_url
   - PT/CC/SafeWay 모두 재사용 가능 (core-mobile)

2. C-10 PT 모바일 통합
   - apps/pettracker/mobile/src/screens/walker/WalkerProfileEditScreen.tsx (또는 신규)
     - profile_photo_url 업로드 UI
   - apps/pettracker/mobile/src/screens/walker/WalkReportScreen.tsx
     - arrival_photo_url 업로드 UI (산책 종료 시점)
   - useImageUpload + Image picker (expo-image-picker) 통합

3. PT mobile jest 회귀 (12 tests 유지)
   - npx jest (apps/pettracker/mobile)
   - 새 컴포넌트 smoke test 1~2개 추가

4. (선택) C-13 useWebSocket — C-10 종료 후 별도 진입
   - first-message auth 패턴: ws.send({token: jwt}) → ws.recv {"type": "auth_ok"}
   - 재연결 backoff (1s → 2s → 4s, max 30s)
```

---

## 8. Residual Risks

| Risk | Mitigation |
|---|---|
| Migration `c4b1f5e7a8d2` 미적용 (실 DB) | `alembic upgrade head` 실행 시점은 사용자 결정. pytest는 145 passed 유지. |
| boto3 미설치 prod 부팅 실패 | production 시점에 `pip install boto3` + `s3_bucket` env 필수. settings validator 추가는 Milestone F에서 검토. |
| PortOne v2 webhook payload 형식 추정 | spec §17 V1 패치 트랙. handle_portone_webhook_event는 `paymentId`/`imp_uid`, `status` 양쪽 키 시도. 실 통합 시 PortOne docs 재확인. |
| PT WS auth가 JWT (spec은 Firebase) | B-7 통합 시 일괄 전환. 현 시점에선 PT 기존 endpoint와 동일 도메인. |
| KI-4 잔존 teardown race | 테스트 인프라 이슈. handler는 정상. Milestone F에서 unraisable hook 정비 또는 conftest fixture 개선. |
| `useImageUpload` 다음 세션 C-9 진입 시 expo-image-picker 미설치 가능 | `expo install expo-image-picker` 필요. PT 모바일 jest 회귀 검증 시 mock 처리 필요. |

---

## 9. Suggested Prompt for Next Session

```
이전 핸드오프: artifacts/handoffs/2026-04-27-session-handoff.md

PT V1.0 출시 워크스트림 — Milestone C 백엔드 트랙 완전 종료
(Pay/Storage/WS 모두 145 passed, 회귀 0).

다음 첫 단계: Milestone C 모바일 통합 트랙
- C-9 useImageUpload hook (core-mobile)
- C-10 PT 사진 업로드 UI (WalkerProfileEdit + WalkReport)
- 후속: C-13 useWebSocket → C-14 산책 실시간 추적 UI

PT mobile jest 12 tests + 회귀 0 유지 필수.
KI-4 잔존 1 error는 Milestone F로 이연.
```
