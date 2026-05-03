# Final Tech Spec — PetTracker 품질 향상 (V1.0 출시 준비)

**작성일:** 2026-04-24
**Phase:** 3 — Final Tech Spec
**상태:** APPROVED (Phase 4 Todo Plan 진행 가능)
**입력:**
- Intake Plan: `artifacts/specs/2026-04-24-pettracker-careconnect-quality-uplift-plan.md`
- Independent Reviews:
  - `backend-dev` (구현·아키텍처)
  - `korea-regulatory-counsel` (사고 신고 법령)
  - `tech-spec-reviewer` (전체 stress-test, REVISE BEFORE IMPLEMENTATION 판정)
- Consensus Matrix: `artifacts/reviews/2026-04-24-pt-cc-consensus-matrix.md`

**사용자 확정 결정 (6건, 2026-04-24):**
1. **PT 우선 출시** (CC는 PT 안정화 후 별도 사이클)
2. **S3 = AWS S3** 채택 (Naver Cloud / R2 미채택)
3. **WebSocket 실시간 = 출시 전 필수** (Critical Path 진입)
4. **사고 신고 = 법적 의무 연계 필수** (반려동물법·아동복지법 신고의무자 조항)
5. **결제 추가 = PortOne v2** (https://developers.portone.io/opi/ko/readme?v=v2)
6. **회원 관리 = Firebase Auth** (PT/CC 신규 사용자 대상, SafeWay는 JWT 유지)

---

## 1. Problem Statement

PetTracker(PT)는 2026-04-04 시점에 코드 베이스(M0~M5: 21 모바일 화면, 8 DB 테이블, 23 API 엔드포인트)는 완성되었으나, **출시 가능한 서비스 품질**까지는 미달이다. 구체적으로:

1. **결제·인증 인프라 미완**: 결제는 SafeWay Toss 코드에 의존(academy_id 외래키로 PT 재사용 불가), 인증은 OTP/JWT로 운영하나 사용자 경험·범용성 측면에서 Firebase Auth가 더 우월.
2. **잔여 미흡 5건**: 핸드오프 04-09에서 명시된 모바일 자동 테스트 0개, S3 미연동, RRULE 백엔드 미저장, Handover 데이터 일부, 보험 UI 미구현.
3. **법적 의무 미반영**: 사고 신고 기능이 P1로 분류되어 있고 반려동물보호법·민법 §759·형법 §266 신고의무자 조항과 연계되지 않음.
4. **트러스트/리텐션 V1.1 기능 부재**: 즐겨찾기 산책사, 정기 산책, 산책 리포트(route polyline + 사진) — 차별화 USP "산책이 보인다"의 핵심.
5. **운영 인프라 격차**: SafeWay 대비 모바일 테스트 0개, 백엔드 통합 테스트 0개, WebSocket 실시간 부재.

**해결하면 얻는 것:** PT의 차별화 USP("산책이 보인다") 완성, 결제·인증 자립, 법적 리스크 최소화, V1.0 정식 출시 가능 상태.

---

## 2. Goals / Non-goals

### Goals
- G1: PT 결제 자립 — PortOne v2 통합, `PtPayment` 모델 신설, Toss와 격리된 webhook
- G2: PT 인증 일관성 — Firebase Auth (Kakao Custom Token + 일반 이메일) 적용, JWT/Firebase 듀얼 미들웨어로 SafeWay 영향 0
- G3: 사진 업로드 인프라 — AWS S3 presigned URL + IAM 최소권한 + KMS 옵션
- G4: 실시간 산책 추적 — WebSocket 채널 (`pt:walk:{session_id}:updates`) + Redis pub/sub
- G5: 사고 신고 법적 의무 준수 — `PtIncidentReport` 모델 + 외부 다이얼링(119/112/동물보호센터) + 5년 보존 + 신고의무자 UI 안내
- G6: V1.1 트러스트 P0 — 즐겨찾기 산책사, 정기 산책, 산책 리포트
- G7: 잔여 미흡 5건 close
- G8: 모바일 자동 테스트 — PT 모바일 8 suites · 30 tests pass

### Non-goals
- CC(CareConnect) 적용 — PT 출시 + 30일 안정화 후 별도 사이클(V1.0-CC)
- SafeWay Kids 결제·인증 변경 — Toss·JWT 그대로 유지
- V2 항목 (Pet Insurance Integration, AI Walk Route, Multi-pet Group) — 다음 분기
- Admin Web (PT 운영자 페이지) — V1.1.5 이후

---

## 3. User Scenarios

### Scenario 1: 견주 정기 산책 결제 (G1+G6 결합)
1. 견주가 "매주 월·수·금 오후 2시 산책" 정기 예약 생성
2. PortOne v2 결제 등록 (카카오페이/네이버페이/카드 선택)
3. 매 산책 12시간 전 자동 청구 → PortOne 빌링키 결제
4. 결제 성공 시 산책사에게 push, 실패 시 견주에게 retry 알림
5. 산책 완료 후 자동 정산 (commission 15%)

### Scenario 2: 산책 중 사고 발생 (G5)
1. 산책사가 산책 중 강아지 부상 발견
2. 산책 화면에서 "사고 신고" 버튼 탭 → IncidentReport 폼 진입
3. 화면 상단에 법적 안내: "산책사는 사고 즉시 견주와 피해자에게 통보 의무가 있습니다 (민법 §759)"
4. 필수 입력: 사고 유형, 시각, 위치(GPS 자동), 사진 첨부, 진술
5. 외부 다이얼링: 119 (응급), 112 (범죄성), 시군구 동물보호센터 (등록번호 자동 첨부)
6. 제출 시 견주에게 즉시 push + 이메일, S3에 사진 보존 (5년 retention)
7. 제출 후 폼 잠금 (append-only, 증거 무결성)

### Scenario 3: 견주가 산책 라이브 위치 추적 (G4)
1. 견주가 "라이브 트래킹" 화면 진입
2. 모바일 클라이언트가 `wss://api.../api/v1/pt/walks/{session_id}/live` 연결, Firebase ID token으로 인증
3. 서버는 Redis `pt:walk:{session_id}:updates` 구독, 5초 polling보다 1초 푸시
4. 산책사 위치 변경 시 견주 화면에 polyline 추가 (Leaflet WebView)
5. 산책 완료 시 `walk_completed` 이벤트로 채널 종료 → 산책 리포트 화면 자동 전환

### Scenario 4: 견주가 즐겨찾기 산책사 재예약 (G6)
1. 견주가 산책사 프로필 화면에서 별표 탭 → `FavoriteWalker` 레코드 생성
2. 홈 화면 "내 산책사" 섹션에 표시
3. 빠른 재예약 버튼 → 이전 예약 정보 prefill → 1탭 confirm

---

## 4. Functional Requirements

### 4.1 결제 (PortOne v2)
- FR-1.1 `PtPayment` 모델 신설 — `apps/pettracker/models.py`
  - 컬럼: `id`, `booking_id` (FK→`pt_bookings`), `amount` (int, KRW), `currency` (default "KRW"), `pg_provider` ("portone"), `imp_uid`, `merchant_uid`, `status` (pending/paid/cancelled/refunded), `paid_at`, `cancelled_at`, `cancel_amount`, `created_at`
- FR-1.2 PortOne v2 provider — `backend/app/modules/billing/providers/portone.py`
  - 메서드: `confirm_payment(imp_uid, expected_amount)`, `cancel_payment(imp_uid, cancel_amount=None, reason)`, `verify_webhook(headers, body)`
  - HMAC-SHA256 fail-closed
- FR-1.3 Webhook 라우터 분리 — `POST /billing/webhook/portone` (Toss는 기존 `/billing/webhook/toss` 유지)
- FR-1.4 정기 결제 빌링키 — PortOne 빌링키 `customer_uid`를 `User`에 nullable 컬럼 추가, 정기 산책 슬롯 12시간 전 cron 자동 청구
- FR-1.5 부분 환불 — `cancel_amount` 파라미터 지원, 산책 도중 중단 시 잔여 시간만큼 환불

### 4.2 인증 (Firebase Auth)
- FR-2.1 `User.firebase_uid: String(128) unique nullable` 추가 (Alembic, server_default null)
- FR-2.2 `backend/app/middleware/firebase_auth.py` 신규
  - `get_current_user_firebase` dependency — Firebase Admin SDK `auth.verify_id_token` async wrap
  - PT 라우터에만 적용, SafeWay 라우터는 기존 `get_current_user` 유지
- FR-2.3 Kakao OAuth 호환 — Kakao 로그인 성공 후 Firebase Custom Token 발급 (`firebase_admin.auth.create_custom_token(uid)`) → 모바일이 `signInWithCustomToken` 호출
- FR-2.4 첫 로그인 시 `firebase_uid` 채워 넣기 — User 레코드 update
- FR-2.5 모바일 — `@react-native-firebase/auth` 채택 (Expo SDK 54 호환), `packages/core-mobile/hooks/useFirebaseAuth.ts` 신규

### 4.3 객체 스토리지 (AWS S3)
- FR-3.1 `backend/app/modules/storage/{s3,router,schemas}.py` 신규
- FR-3.2 단일 엔드포인트 `POST /api/v1/storage/upload-url`
  - 입력: `app_context`, `entity_type` (`walker_profile` | `walk_photo` | `incident_photo` | `pet_photo`), `content_type`
  - 출력: `{upload_url, object_key, expires_in (300s)}`
- FR-3.3 Prefix 패턴: `{app_context}/{entity_type}/{user_id}/{uuid}.{ext}`
- FR-3.4 KMS — `incident_photo` 버킷 측 KMS 강제 (CMK 별도 생성), 다른 entity_type은 SSE-S3
- FR-3.5 Confirm 패턴 — 클라이언트 PUT 완료 후 `POST /api/v1/storage/confirm` → `s3:HeadObject` 검증 → `walker_profile.profile_photo_url` 등 모델 업데이트
- FR-3.6 라이브러리 `aioboto3` (FastAPI 비동기 일관성)

### 4.4 WebSocket 실시간 (PT 산책 라이브)
- FR-4.1 `backend/app/middleware/ws_auth.py` 신규 — `vehicle_telemetry/router.py:170-190`의 `_authenticate_token`을 추출 + Firebase ID token 분기 처리
- FR-4.2 `WS /api/v1/pt/walks/{session_id}/live` — `apps/pettracker/router.py`에 신설
  - first-message 인증: `{"type": "firebase", "token": "..."}` (5초 timeout)
  - 산책사: GPS broadcast (Redis `PUBLISH pt:walk:{session_id}:updates {lat, lng, speed, ts}`)
  - 견주: subscribe 전용
- FR-4.3 ping loop 30초 (SafeWay 패턴 동일)
- FR-4.4 산책 완료 시 `walk_completed` 이벤트 publish → 채널 종료
- FR-4.5 HTTP GPS 엔드포인트 (`POST /pt/walks/{session_id}/gps`) 병행 유지 (장애 시 fallback)

### 4.5 사고 신고 (법적 의무 연계, P0)
- FR-5.1 `PtIncidentReport` 모델 신설 — `apps/pettracker/models.py`
  - 컬럼: `id`, `walk_session_id` (FK→`pt_walks`), `reporter_user_id` (FK→`users`), `incident_type` (injury/escape/bite/death/other), `occurred_at`, `gps_lat`, `gps_lng`, `pet_registration_number` (동물보호법 §14), `victim_info` (text, 제3자 피해 시), `description` (text), `photo_urls` (JSON array, S3 keys), `external_report_channels` (JSON: 119/112/animal_protection_center 다이얼 여부), `submitted_at`, `locked` (default true after submit), `created_at`
  - **append-only 강제** — `submitted_at` 이후 update 차단 (DB CHECK 또는 트리거)
- FR-5.2 신고 화면 (`PtIncidentReportScreen`)
  - 상단 법적 안내 박스 (배경 #FEF3C7): "산책사는 사고 즉시 견주와 피해자에게 통보 의무가 있습니다 (민법 §759, 형법 §266)"
  - 외부 다이얼링 카드 3개: 119 / 112 / 시군구 동물보호센터 (현 위치 GPS로 자동 지역 매핑)
  - 사진 첨부 — S3 presigned URL 사용
  - 제출 후 화면 잠금
- FR-5.3 견주에게 즉시 알림 (FCM push + 이메일)
- FR-5.4 보존 기간 — DB retention 정책 5년 (민법 §766 소멸시효 기준)
- FR-5.5 사진 무결성 — S3 object lock (governance mode, 5년) — `incident_photo` 버킷에만 적용
- FR-5.6 외부 다이얼링은 모바일 `Linking.openURL("tel:119")` (자동 전화 거는 게 아니라 다이얼러 띄움)

### 4.6 V1.1 트러스트 P0 (PT only)
- FR-6.1 즐겨찾기 산책사
  - `FavoriteWalker(id, user_id, walker_id, created_at, unique(user_id, walker_id))` 모델
  - `POST /pt/walkers/{id}/favorite`, `DELETE /pt/walkers/{id}/favorite`, `GET /pt/walkers/favorites`
  - 모바일: 산책사 프로필에 별표 토글, 홈 화면 "내 산책사" 섹션
- FR-6.2 정기 산책 (RRULE 백엔드 저장)
  - `WalkerAvailability.recurrence_rule: String(200) nullable` 컬럼 + `recurrence_end_date` 컬럼 (이미 존재)
  - `PtBooking.recurrence_rule: String(200) nullable`, `parent_booking_id` (FK→self) 컬럼 추가
  - 라이브러리 `rrule` (python) — 슬롯 확장은 백엔드에서 처리 (클라이언트 fallback 제거)
  - PortOne 빌링키 결제 자동 트리거 (12시간 전 cron)
- FR-6.3 산책 리포트 (route polyline + 사진)
  - `WalkSession`에 `route_geojson: JSONB` 컬럼 추가 (Alembic) — 산책 종료 시 GPS history → GeoJSON LineString 저장
  - `WalkSession.distance_meters`, `duration_seconds`, `photo_urls` 이미 존재 또는 추가
  - 모바일: `WalkReportScreen` 신설 — Leaflet WebView로 polyline 렌더, 사진 그리드, 산책사 메모, "공유" 버튼 (KakaoTalk share)

### 4.7 잔여 미흡 정리 (Open Issues 04-09)
- FR-7.1 (O5) PT-17 보험 정보 UI — `WalkerProfileDetailScreen`에 보험·만료일 배지
- FR-7.2 (O4) CC-24 Handover 아이/돌봄자 이름 — backend join + 화면 표시 (CC, but 사이클 정합성 위해 같이)
- FR-7.3 (O2) ImagePicker → S3 (FR-3 사용)
- FR-7.4 (O3) RRULE 백엔드 저장 (FR-6.2에 흡수)
- FR-7.5 (O1) 모바일 자동 테스트 — FR-8.1로 분리

### 4.8 모바일 테스트 인프라
- FR-8.1 PT 모바일 Jest + RNTL 셋업 — `apps/pettracker/mobile/__tests__/`
- FR-8.2 핵심 플로우 8 suites
  - 예약 생성·취소 / 산책 시작·종료 / 리뷰 작성 / 산책사 검색·즐겨찾기 / 정기예약 / 사고 신고 / 산책 리포트 / Firebase Auth 로그인
- FR-8.3 공유 fixture — `packages/core-mobile/__tests__/fixtures/`

---

## 5. Non-functional Requirements

| ID | 항목 | 목표 |
|---|---|---|
| NFR-1 | 결제 webhook 응답 | < 500ms (PortOne timeout 5초 이내 99%) |
| NFR-2 | WebSocket 라이브 위치 latency | p50 < 1s, p95 < 3s |
| NFR-3 | S3 presigned URL 발급 | < 200ms |
| NFR-4 | Firebase ID token verify | < 100ms (Admin SDK + caching) |
| NFR-5 | 사고 신고 제출 성공률 | 99.9% (사진 업로드 실패 시 재시도) |
| NFR-6 | 사진 보존 무결성 | S3 object lock 5년 (incident만) |
| NFR-7 | 백엔드 통합 테스트 커버리지 | PT 라우터 핵심 80%+ |
| NFR-8 | 모바일 테스트 패스율 | PT 30+ tests, 100% pass |
| NFR-9 | 회귀 영향 | SafeWay 기존 95 백엔드 + 71 모바일 테스트 100% 유지 |

---

## 6. Constraints

- C-1 단일 백엔드 코드베이스 — SafeWay와 PT/CC 동일 deployment
- C-2 단일 Alembic head — 모든 마이그레이션이 SafeWay 운영 DB에 적용 (nullable 컬럼만 추가하므로 안전)
- C-3 Expo SDK 54 (iPhone Expo Go 호환), RN 79
- C-4 1인 개발자 — 동시 진행 마일스톤 최대 2개
- C-5 PortOne 가맹점 계약 — 사용자 결정 후 별도 트랙 (코드 완성과 분리)
- C-6 Firebase 프로젝트 — 단일 프로젝트 + tenant 분리 (운영 단순화)
- C-7 변호사 5건 자문 회신 (Q-L1~Q-L5) 필요 — Milestone D 시작 전 도착

---

## 7. Architecture / Data Flow

### 7.1 Provider 추상화

```
backend/app/modules/billing/
├── providers/
│   ├── base.py              # AbstractPGProvider (ABC)
│   ├── toss_payments.py     # 기존, AbstractPGProvider 구현
│   └── portone.py           # 신규, AbstractPGProvider 구현
├── models.py                # 기존 BillingPlan/Invoice/Payment (SafeWay만)
└── service.py               # SafeWay 전용 service (변경 없음)

backend/app/apps/pettracker/
├── models.py                # PtPayment 신설
├── service.py               # PT 결제 service (PortOne provider 직접 사용)
└── router.py                # /pt/payments/* + /billing/webhook/portone (등록은 main.py)
```

### 7.2 Auth 듀얼 미들웨어

```
backend/app/middleware/
├── auth.py                  # 기존 JWT (SafeWay)
├── firebase_auth.py         # 신규 (PT/CC)
└── ws_auth.py               # 신규 — WS 핸드셰이크 공통 (JWT/Firebase 분기)
```

라우터 적용:
- SafeWay 라우터 (`/api/v1/students`, `/api/v1/escorts`, ...) — `Depends(get_current_user)` (기존)
- PT 라우터 (`/api/v1/pt/*`) — `Depends(get_current_user_firebase)`
- CC 라우터 (`/api/v1/cc/*`) — `Depends(get_current_user_firebase)` (출시는 후속)

### 7.3 WebSocket Flow

```
Walker mobile  ─POST /pt/walks/{id}/gps─→  Backend  ─PUBLISH pt:walk:{id}:updates─→  Redis
                                              │
Owner mobile   ─WS /pt/walks/{id}/live─────→  Backend  ─SUBSCRIBE pt:walk:{id}:updates─→  Redis
                ←─{lat, lng, speed, ts}──────  Backend  ←─message──────────────────────  Redis
```

### 7.4 사고 신고 Flow

```
Walker mobile  ─[사고 발생]─→ IncidentReport 폼 작성
              ─POST /api/v1/storage/upload-url (entity_type=incident_photo)
              ─PUT to S3 (KMS encrypted, object lock 5y)
              ─POST /pt/walks/{id}/incident (사진 keys 첨부)
                  │
Backend       ─INSERT PtIncidentReport (locked=true)
              ─FCM push to owner
              ─Email to owner (SES or SMTP)
              ─[op]Slack alert to ops channel
              ─return 201 with report_id

Owner mobile  ─[푸시 수신]─→ IncidentReport 화면 (read-only)
```

### 7.5 마이그레이션 순서 (Alembic)

```
1. add_user_firebase_uid               (User.firebase_uid)
2. add_user_billing_key                (User.portone_customer_uid)
3. create_pt_payments                  (PtPayment 신설)
4. create_pt_incident_reports          (PtIncidentReport 신설)
5. create_favorite_walkers             (FavoriteWalker 신설)
6. add_walk_session_route_geojson      (WalkSession.route_geojson)
7. add_pt_booking_recurrence           (PtBooking.recurrence_rule, parent_booking_id)
```

모두 nullable 컬럼 추가 또는 새 테이블 — SafeWay 운영 DB에 안전 적용.

---

## 8. Interfaces / API / Event Flow

### 8.1 신규 REST Endpoints (PT)

| Method | Path | 설명 | Auth |
|---|---|---|---|
| POST | `/api/v1/storage/upload-url` | S3 presigned URL 발급 | Firebase |
| POST | `/api/v1/storage/confirm` | S3 업로드 확인 | Firebase |
| POST | `/api/v1/pt/payments/prepare` | PortOne merchant_uid 발급 | Firebase |
| POST | `/api/v1/pt/payments/confirm` | PortOne imp_uid 검증 + DB 저장 | Firebase |
| POST | `/api/v1/pt/payments/{id}/cancel` | 환불 (full/partial) | Firebase |
| POST | `/api/v1/pt/walkers/{id}/favorite` | 즐겨찾기 등록 | Firebase |
| DELETE | `/api/v1/pt/walkers/{id}/favorite` | 즐겨찾기 해제 | Firebase |
| GET | `/api/v1/pt/walkers/favorites` | 즐겨찾기 목록 | Firebase |
| POST | `/api/v1/pt/walks/{id}/incident` | 사고 신고 제출 | Firebase |
| GET | `/api/v1/pt/walks/{id}/report` | 산책 리포트 (route + photos) | Firebase |
| POST | `/billing/webhook/portone` | PortOne webhook (HMAC) | None (서명검증) |

### 8.2 신규 WebSocket

| Path | 설명 | Auth |
|---|---|---|
| `WS /api/v1/pt/walks/{session_id}/live` | 산책 라이브 위치 broadcast/subscribe | first-message Firebase token |

### 8.3 모바일 신규 Screens (PT)

| Screen | 위치 | 설명 |
|---|---|---|
| `WalkReportScreen` | `apps/pettracker/mobile/src/screens/owner/` | 산책 리포트 (Leaflet polyline + 사진) |
| `PtIncidentReportScreen` | `apps/pettracker/mobile/src/screens/walker/` | 사고 신고 폼 + 외부 다이얼링 |
| `RecurringBookingScreen` | `apps/pettracker/mobile/src/screens/owner/` | 정기 산책 RRULE 설정 |
| `FavoritesScreen` | `apps/pettracker/mobile/src/screens/owner/` | 즐겨찾기 산책사 + 빠른 재예약 |
| `PaymentMethodScreen` | `apps/pettracker/mobile/src/screens/owner/` | PortOne 결제 수단 등록 |

### 8.4 모바일 공유 hooks (`packages/core-mobile/hooks/`)

| Hook | 설명 |
|---|---|
| `useFirebaseAuth` | Firebase Auth 통합 (signIn, signOut, currentUser, idToken) |
| `useImageUpload` | S3 presigned URL → PUT → confirm 전체 플로우 |
| `useWebSocket` | 인증된 WS 연결 + reconnect + ping |

---

## 9. Edge Cases

| EC# | 시나리오 | 처리 |
|---|---|---|
| EC-1 | PortOne webhook 중복 수신 | `imp_uid` unique 제약, 두 번째는 200 idempotent |
| EC-2 | 정기 결제 실패 (카드 만료) | 견주에게 push + 이메일 retry, 3회 실패 시 정기 일시정지 |
| EC-3 | Firebase ID token 만료 (1시간) | 모바일 자동 refresh, 401 시 1회 재시도 |
| EC-4 | S3 업로드 실패 후 confirm 호출 | `s3:HeadObject` 404 → 400 응답, 클라이언트 재업로드 유도 |
| EC-5 | WebSocket 연결 끊김 | 모바일 자동 재연결 (지수 백오프), 5회 실패 시 HTTP polling fallback |
| EC-6 | 사고 신고 중 네트워크 단절 | 로컬 draft 저장, 네트워크 복구 시 자동 제출 |
| EC-7 | 사고 신고 제출 후 사진 추가 시도 | 422 응답 (`locked=true` 검증), 별도 후속 메모로 안내 |
| EC-8 | KakaoTalk 공유 시 설치 미존재 | iOS/Android Linking fallback (웹 share URL) |
| EC-9 | 산책 도중 산책사 핸드오프 (드문 경우) | 본 spec 범위 외 — V1.1 |
| EC-10 | 정기 산책 슬롯 충돌 (산책사 휴가) | 사전 알림 + 견주에게 대체 산책사 추천 |

---

## 10. Failure Handling

- 결제 실패 → 견주에게 즉시 알림 + 24시간 내 retry, 미해결 시 산책사에게 자동 알림
- Firebase Admin SDK 다운 → 캐시된 token 30분 유효, 그 후 503
- S3 다운 → 사진 업로드 큐잉 (모바일 로컬), 60초 내 복구 안 되면 사용자에게 알림
- WebSocket 다운 → HTTP polling fallback (3초 간격)
- 사고 신고 외부 다이얼링 실패 → 백업 안내 (전화번호 텍스트로 표시 + 클립보드 복사)
- DB 트랜잭션 실패 → 자동 rollback + Sentry 알림 + 사용자에게 일반 오류 메시지

---

## 11. Testing Strategy

### 11.1 백엔드
- 단위: PortOne provider mock, Firebase Admin SDK mock, S3 mock (`moto`)
- 통합: PT e2e (예약→결제→산책→완료→리뷰), commission 산정, 사고 신고 retention
- 회귀: SafeWay 95 통과 테스트 100% 유지 (CI gate)
- 마커: `@pytest.mark.portone`, `@pytest.mark.firebase`, `@pytest.mark.s3` (개별 실행 가능)

### 11.2 모바일
- Jest + React Native Testing Library — PT 8 suites · 30 tests
- 공유 fixture (`packages/core-mobile/__tests__/fixtures/{user,walker,booking}.ts`)
- Firebase Auth는 `@react-native-firebase/auth` mock
- WS는 `mock-socket` 라이브러리

### 11.3 수동 검증 체크리스트
- 사용자 시나리오 1~4 각각 E2E 시연
- 모바일 → 백엔드 → DB 영속 확인
- 외부 다이얼링 동작 (실제 119/112 거지 말고 텍스트 노출만 확인)

---

## 12. Rollback Strategy

| 항목 | 롤백 방법 |
|---|---|
| Alembic 마이그레이션 7건 | 각각 `downgrade` 구현 — nullable 컬럼/새 테이블 drop |
| PortOne 통합 | feature flag (`PORTONE_ENABLED=false`) → 결제 endpoint 503 응답 |
| Firebase Auth | feature flag (`FIREBASE_AUTH_ENABLED=false`) → 모든 PT 라우터 410 Gone |
| WebSocket | 채널 disable + HTTP polling으로 자동 fallback |
| 사고 신고 | feature flag (`INCIDENT_REPORT_ENABLED=false`) → 화면 숨김 |
| V1.1 트러스트 | 화면별 feature flag (모바일 RemoteConfig 또는 Firebase Remote Config) |

---

## 13. Acceptance Criteria

| AC# | 조건 |
|---|---|
| AC-1 | PortOne v2 sandbox 결제 confirm·환불 통합 테스트 pass |
| AC-2 | Firebase Auth Custom Token 발급 → 모바일 로그인 → PT API 호출 e2e 동작 |
| AC-3 | S3 presigned URL → PUT → confirm 통합 테스트 pass, KMS 암호화 검증 |
| AC-4 | WS 산책 라이브 위치 — 산책사 broadcast → 견주 subscribe latency p50 < 1s |
| AC-5 | 사고 신고 — 제출 → DB 영속 → 견주 push → 사진 KMS 암호화 + object lock 적용 |
| AC-6 | 즐겨찾기 등록·해제, 정기 산책 RRULE 12시간 전 자동 청구, 산책 리포트 polyline 렌더 |
| AC-7 | 잔여 5건 close — 보험 UI, Handover, S3 연동, RRULE 백엔드, 모바일 테스트 인프라 |
| AC-8 | PT 모바일 8 suites · 30+ tests pass |
| AC-9 | SafeWay 회귀 0 — 백엔드 95 + 모바일 71 + 웹 50 모두 유지 |
| AC-10 | 변호사 자문 5건(Q-L1~Q-L5) 회신 반영 또는 임시 처리 방침 spec에 기록 |

---

## 14. Out of Scope

- CC 모든 적용 (별도 사이클 V1.0-CC)
- SafeWay Kids 결제·인증 변경
- Pet Insurance Integration (V2)
- AI Walk Route Suggestion (V2)
- Multi-pet Group Walk Pricing (V2, P3 별도 spec)
- Admin Web for PT (V1.1.5)
- 그룹 산책 / 다중 아동 / CC 실시간지도 (P3 별도 spec)
- PortOne 가맹점 계약·정산 통장 등록 (별도 비즈니스 트랙)

---

## 15. Code Impact Map

### 백엔드 신규/변경
```
backend/app/modules/billing/providers/base.py             (NEW, ~30 LOC)
backend/app/modules/billing/providers/portone.py          (NEW, ~150 LOC)
backend/app/modules/billing/providers/toss_payments.py    (REFACTOR, ~10 LOC)
backend/app/modules/billing/service.py                    (REFACTOR, ~50 LOC)
backend/app/modules/storage/s3.py                         (NEW, ~100 LOC)
backend/app/modules/storage/router.py                     (NEW, ~60 LOC)
backend/app/modules/storage/schemas.py                    (NEW, ~30 LOC)
backend/app/middleware/firebase_auth.py                   (NEW, ~80 LOC)
backend/app/middleware/ws_auth.py                         (NEW, ~50 LOC)
backend/app/modules/auth/models.py                        (MODIFY, +1 컬럼 firebase_uid)
backend/app/modules/auth/service.py                       (MODIFY, ~50 LOC, Firebase Custom Token)
backend/app/apps/pettracker/models.py                     (MODIFY, +PtPayment, +PtIncidentReport, +FavoriteWalker, +RRULE 컬럼)
backend/app/apps/pettracker/router.py                     (MODIFY, ~300 LOC)
backend/app/apps/pettracker/service.py                    (MODIFY, ~200 LOC)
backend/app/apps/pettracker/schemas.py                    (MODIFY, ~150 LOC)
backend/migrations/versions/2026_04_24_*.py               (NEW × 7)
backend/tests/unit/test_pt_commission.py                  (NEW, ~150 LOC)
backend/tests/integration/test_pettracker_e2e.py          (NEW, ~300 LOC)
backend/tests/integration/test_portone_webhook.py         (NEW, ~150 LOC)
```

### 모바일 신규/변경 (PT)
```
apps/pettracker/mobile/src/screens/owner/WalkReportScreen.tsx        (NEW, ~250 LOC)
apps/pettracker/mobile/src/screens/owner/RecurringBookingScreen.tsx  (NEW, ~200 LOC)
apps/pettracker/mobile/src/screens/owner/FavoritesScreen.tsx         (NEW, ~150 LOC)
apps/pettracker/mobile/src/screens/owner/PaymentMethodScreen.tsx     (NEW, ~200 LOC)
apps/pettracker/mobile/src/screens/walker/PtIncidentReportScreen.tsx (NEW, ~300 LOC)
apps/pettracker/mobile/src/api/payments.ts                            (NEW, ~80 LOC)
apps/pettracker/mobile/src/api/incident.ts                            (NEW, ~50 LOC)
apps/pettracker/mobile/src/api/favorites.ts                           (NEW, ~50 LOC)
apps/pettracker/mobile/src/api/walks.ts                               (MODIFY, ~80 LOC)
apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx          (MODIFY, WS 통합 ~100 LOC)
apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx              (MODIFY, S3 + WS ~80 LOC)
apps/pettracker/mobile/src/navigation/*.tsx                           (MODIFY, +5 routes)
apps/pettracker/mobile/__tests__/...                                  (NEW × 8 suites)
apps/pettracker/mobile/package.json                                   (MODIFY, +firebase, +mock-socket, +rrule)
```

### 공유 패키지 (`packages/core-mobile/`)
```
packages/core-mobile/hooks/useFirebaseAuth.ts             (NEW, ~80 LOC)
packages/core-mobile/hooks/useImageUpload.ts              (NEW, ~80 LOC)
packages/core-mobile/hooks/useWebSocket.ts                (NEW, ~120 LOC)
packages/core-mobile/__tests__/fixtures/index.ts          (NEW, ~100 LOC)
packages/core-mobile/index.ts                             (MODIFY, exports)
```

### 인프라
```
.env.example                                              (MODIFY, +AWS_*, +PORTONE_*, +FIREBASE_*)
backend/pyproject.toml                                    (MODIFY, +aioboto3, +firebase-admin, +rrule)
deploy/                                                   (MODIFY, IAM 정책 JSON)
```

**총 예상 변경:** 백엔드 ~2,000 LOC, 모바일 ~1,800 LOC, 공유 ~400 LOC, 마이그레이션 7건, 테스트 ~700 LOC. 약 **5,000 LOC 변경**.

---

## 16. 변호사 자문 5건 (Q-L1~Q-L5) — 처리 방침

| ID | 질문 | spec 영향 | 회신 전 임시 처리 |
|---|---|---|---|
| Q-L1 | PT 점유자 판정 (민법 §759) | 사고 신고 화면 안내 텍스트 | "산책사 점유자 (가정)" 문구로 시작, 회신 후 정정 |
| Q-L2 | CC 돌봄사 신고의무자 해당 여부 | CC 사이클에서 처리 | PT 출시 전 무관 |
| Q-L3 | 전자상거래법 §20 면책 범위 | 이용약관 | 법무 검토 트랙 별도 |
| Q-L4 | 사고 데이터 보존 5년 vs 개보법 §21 | retention 정책 | "법령 준수 예외 (개보법 §21 단서)" 근거로 5년 채택, 회신 후 보강 |
| Q-L5 | 산재법 §125 산책사 포함 여부 | 보험 가입·신고 의무 | PT 출시 후 1차 패치로 처리 가능 |

**무료 자문 라우트:** K-Startup 일반상담 Q-L1·Q-L4 (D+3 회신), 심화상담 Q-L2·Q-L3 (D+14), 9988 전화 Q-L5.

---

## 17. Decision Log

| 일자 | 결정 | 근거 |
|---|---|---|
| 2026-04-24 | PT 우선 출시 | 사용자 결정 #1 |
| 2026-04-24 | S3 = AWS | 사용자 결정 #2 |
| 2026-04-24 | WS 출시 전 필수 | 사용자 결정 #3 |
| 2026-04-24 | 사고 신고 P0 격상 | 사용자 결정 #4 + tech-spec-reviewer TR-5 |
| 2026-04-24 | PortOne v2 채택 (Toss 공존) | 사용자 결정 #5 + backend-dev / tech-spec-reviewer 합의 |
| 2026-04-24 | Firebase Auth (PT only, JWT 듀얼) | 사용자 결정 #6 + tech-spec-reviewer Alternative Designs |
| 2026-04-24 | PtPayment / CcPayment 신설 | tech-spec-reviewer TR-1 (academy_id 외래키 충돌) |
| 2026-04-24 | Webhook 라우터 분리 | tech-spec-reviewer TR-2 |
| 2026-04-24 | Critical Path WS 앞당김 | tech-spec-reviewer TR-3 |
| 2026-04-24 | 일정 6주(27 영업일) | Consensus Matrix Section 5.3 합의 |

---

## 18. References

- PortOne v2: https://developers.portone.io/opi/ko/readme?v=v2
- Firebase Auth REST: https://firebase.google.com/docs/auth/web/start
- AWS S3 presigned URL: https://docs.aws.amazon.com/AmazonS3/latest/userguide/presigned-urls.html
- 동물보호법 §10/§14/§16
- 민법 §759 (동물 점유자의 책임)
- 형법 §266 (과실치상), §267 (과실치사)
- 개인정보보호법 §29 (안전조치의무)

---

**다음 Phase: Phase 4 — Todo Plan** ([`artifacts/plans/2026-04-24-pt-quality-uplift-todo-plan.md`](../plans/2026-04-24-pt-quality-uplift-todo-plan.md))
