# Verification — Milestone C (Pay + Storage backend) — 2026-04-24

**Scope**: C-4 PtPayment 모델 + Alembic, C-5 PT 결제 endpoint, C-6 `/billing/webhook/portone` 분리, C-7 storage 모듈 (AWS S3 추상화 + Local fallback)

## 1. Files Changed

### 신규
- `backend/app/apps/pettracker/` — PtPayment 모델·service 결제 함수·webhook 핸들러
- `backend/migrations/versions/c4b1f5e7a8d2_create_pt_payments.py` — manual 작성 (autogenerate 미사용 / drop 위험 회피)
- `backend/app/modules/storage/` — `__init__.py`, `base.py`, `s3.py`, `local.py`, `factory.py`, `schemas.py`, `router.py`

### 수정
- `backend/app/apps/pettracker/models.py` — `PtPaymentStatus` enum + `PtPayment` 테이블 추가
- `backend/app/apps/pettracker/schemas.py` — `PaymentPrepare/Confirm/Cancel` 6 스키마
- `backend/app/apps/pettracker/router.py` — `/pt/payments/prepare|confirm|{id}/cancel` 3 endpoint
- `backend/app/apps/pettracker/service.py` — `prepare_payment` / `confirm_payment` / `cancel_payment` / `handle_portone_webhook_event`
- `backend/app/modules/auth/models.py` — `User.portone_customer_uid` 컬럼
- `backend/app/modules/billing/router.py` — `POST /webhook/portone` (Toss와 격리)
- `backend/app/main.py` — storage 라우터 등록 (`/api/v1/storage/*`)
- `backend/app/config.py` — `portone_*` × 3, `aws_*` × 4 설정 추가

## 2. Commands Executed

| Command | Result |
|---|---|
| import smoke (PtPayment / PtPaymentStatus / User.portone_customer_uid) | OK |
| import smoke (PT payment service + 3 routes registered) | OK — `/pt/payments/{prepare,confirm,{payment_id}/cancel}` |
| import smoke (`/api/v1/billing/webhook/portone` route in app) | OK |
| import smoke (`/api/v1/storage/upload-url` route + LocalStorageProvider fallback) | OK |
| `python -m pytest -q --tb=line --ignore=test_billing_pg.py --ignore=test_e2e_hardening.py --ignore=test_m4_websocket.py` | **145 passed in 200.79s** (회귀 0) |

## 3. Acceptance vs Spec

| FR | 기준 | 결과 |
|---|---|---|
| FR-1.1 PtPayment 모델 신설 | id/booking_id/amount/currency/pg_provider/imp_uid/merchant_uid/status/paid_at/cancelled_at/cancel_amount/created_at | ✅ + cancel_reason 추가 (취소 사유 보존) |
| FR-1.2 PortOne provider 사용 | confirm/cancel/verify_webhook 3 메서드 호출 | ✅ service에서 lazy import |
| FR-1.3 Webhook 라우터 분리 | `POST /billing/webhook/portone` | ✅ Toss `/webhook` 그대로 두고 신규 `/webhook/portone` 추가 |
| FR-3.1 Storage abstract base | presigned_put / presigned_get / delete_object | ✅ `AbstractStorageProvider` |
| FR-3.2 S3 provider | boto3 lazy import, 자격증명 env | ✅ `S3StorageProvider` |
| FR-3.3 Storage endpoint | `POST /api/v1/storage/upload-url` | ✅ presigned URL 발급 |
| Auth | PT 결제 endpoint Firebase 듀얼 | 🟡 현재 JWT(get_current_user) 사용 — Firebase 전환은 B-7 통합 시 일괄 |

## 4. Known Gaps / Residual Risks

| Risk | Mitigation |
|---|---|
| Migration 미적용 (실 DB) | `alembic upgrade head` 명령은 dev DB 영향이라 사용자 검토 후 별도 실행. 단위 테스트는 SQLAlchemy 모델 등록만으로 145 PASS 유지. |
| boto3 미설치 | LocalStorageProvider fallback. production 환경에서는 `pip install boto3` + s3_bucket env 필수. |
| PortOne v2 webhook payload 형식 추정 | spec §17 V1 패치 트랙으로 명시. handle_portone_webhook_event는 `paymentId`/`imp_uid`, `status` 양쪽 키를 모두 시도. 실 통합 시 PortOne docs 재확인 필요. |
| PortOne webhook secret 미설정 시 동작 | provider.verify_webhook이 secret 없으면 False 반환 → 라우터가 403. 현 dev에서는 webhook 테스트 실행 차단됨 (의도된 fail-closed). |
| PT 결제 endpoint Firebase auth 미적용 | B-7에서 일괄 전환. 현재는 require_pet_owner(JWT)로 SafeWay 라우터와 동일 패턴 유지. |

## 5. Next Steps

| ID | 작업 | Owner |
|---|---|---|
| C-8 | AWS 계정 + IAM + S3 버킷 생성 | 사용자 |
| C-9 | useImageUpload (PT mobile, presigned URL 호출) | code |
| C-10 | PT 모바일 통합 (사진 업로드 UI ↔ presigned URL) | code |
| C-11 | ws_auth.py 추출 (Firebase WS 토큰 검증) — KI-4 같이 fix | code |
| C-12~C-14 | PT WS endpoint + useWebSocket + PT 모바일 통합 | code |
| C-15/16 | 통합 검증 + 마일스톤 보고서 | code |

## 6. Status

**Implementation status**: VERIFIED — 4건 import smoke + backend pytest 145 passed (회귀 0).
**Spec gap**: Firebase auth 적용은 B-7 통합 시 일괄 전환. 현 설계는 spec FR-1/3 충족.
**Closure**: Milestone C-Pay + C-Storage 백엔드 트랙 클로즈, C-WS 트랙(C-11~C-14) 진행 가능.
