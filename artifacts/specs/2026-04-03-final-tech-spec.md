# Final Tech Spec — SafeWay Multi-App Platform (PetTracker + CareConnect)

Date: 2026-04-03
Status: FINAL
Approved by: User
Reviewers: Security Expert, DB Architect, Frontend Developer, PM, UX Advocate, Requirement Analyst

---

## 1. Problem Statement

SafeWay Kids는 규제 샌드박스 대기 상태로 즉시 배포가 불가하다. 기존 인프라(인증, 결제, GPS 추적, 알림, 스케줄링)를 재사용하여 두 개의 독립 앱을 개발하고 App Store에 출시한다.

- **PetTracker (패트래커)**: 반려동물 산책 매칭 + 실시간 GPS 추적
- **CareConnect (돌봄커넥트)**: 아이돌봄 매칭 + 방문 인증

---

## 2. Goals / Non-Goals

### Goals
- G1: 공통 코어를 추출하여 모노레포 멀티앱 아키텍처 구축
- G2: PetTracker MVP 개발 + App Store 제출 (Week 2-3)
- G3: CareConnect MVP 개발 + App Store 제출 (Week 4-5)
- G4: 앱 간 사용자 데이터 격리 보장 (app_context 기반)
- G5: 한국 법률 컴플라이언스 (위치정보법, 개인정보보호법, 통신비밀보호법)

### Non-Goals
- NG1: SafeWay Kids 기능 수정 (기존 그대로 유지)
- NG2: KakaoMap 네이티브 SDK (Expo Go 제약)
- NG3: 자동 범죄경력 조회 API (MVP에서 수동)
- NG4: PostGIS (MVP에서 Haversine)
- NG5: PostgreSQL RLS (V1.1)
- NG6: 다국어 지원 (한국어 전용)
- NG7: PetTracker 드롭인/보딩/데이케어 (V1.1)
- NG8: CareConnect 등하원/야간돌봄 (V1.1)

---

## 3. User Scenarios

### PetTracker

**시나리오 PT-1: 반려인의 첫 산책 예약**
1. 카카오 로그인 → 역할 선택 (반려인) → 펫 등록
2. 산책 예약 (날짜, 시간, 30분/60분)
3. 근처 워커 목록 → 프로필/리뷰/인증 확인 → 선택
4. 에스크로 결제 확정
5. 산책 당일: 실시간 GPS 추적 + 사진 수신
6. 산책 완료 → 리포트 → 리뷰 작성

**시나리오 PT-2: 워커의 일일 플로우**
1. 매칭 요청 수신 → 펫 정보 확인 → 수락
2. 산책 당일: 도착 인증 → "산책 시작" → GPS 자동 스트리밍
3. 사진 촬영/메모 전송 (최소 2회 권장)
4. "산책 완료" → 자동 정산 (85%)

### CareConnect

**시나리오 CC-1: 부모의 첫 돌봄 예약**
1. 카카오 로그인 → 역할 선택 (부모) → 아이 등록
2. 14세 미만 법정대리인 동의 (GPS 추적, 활동 기록)
3. 돌봄 예약 (방문돌봄, 날짜, 시간)
4. 돌봄자 목록 → 5중 인증 배지/리뷰 확인 → 선택
5. (첫 예약 시) 돌봄자와 영상통화 권장
6. 에스크로 결제 확정
7. 돌봄 당일: 체크인 알림 → 활동 피드 → 체크아웃 → 인수 확인

**시나리오 CC-2: 돌봄자의 방문 플로우**
1. 매칭 요청 수신 → 아이 정보/알레르기 확인 → 수락
2. 돌봄 당일: 출발 → 200m 지오펜스 내 체크인
3. 활동 기록 + 사진 (30분마다 1회 이상 권장)
4. 식사/간식 기록 (알레르기 경고 표시)
5. 체크아웃 → 부모 "인수 확인" 대기 → 정산 (80%)

---

## 4. Functional Requirements

### 4.1 공통 코어 (Core)

| ID | Requirement | Source |
|----|-------------|--------|
| CORE-01 | UserRole enum 확장: PET_OWNER, WALKER, CAREGIVER 추가 | AD-01 |
| CORE-02 | users 테이블에 app_context VARCHAR(30) 추가, DEFAULT 'safeway_kids' | AD-01 |
| CORE-03 | (phone, app_context) 복합 유니크 제약 (기존 phone 유니크 대체) | AD-01, D-02 |
| CORE-04 | (kakao_id, app_context) 복합 유니크 제약 | AD-01, D-03 |
| CORE-05 | JWT access token에 app_context, aud 클레임 추가 | S-01, S-08 |
| CORE-06 | JWT refresh token에 app_context 클레임 추가 | S-08 |
| CORE-07 | RBAC require_roles()에 app_context 검증 추가 | S-02 |
| CORE-08 | otp_login_or_register(), kakao_login()에 app_context 파라미터 추가 | S-01 |
| CORE-09 | 파일 업로드: MIME 타입 검증, magic byte 확인, 10MB 크기 제한 | S-04 |
| CORE-10 | OTP rate limit: 전화번호당 5회/분 (기존 1000/분에서 강화) | S-07 |
| CORE-11 | Toss Payments webhook 서명 검증 필수화 (조건부 → 필수) | S-06 |

### 4.2 PetTracker

| ID | Requirement | Priority |
|----|-------------|----------|
| PT-01 | PET_OWNER, WALKER 역할 등록 (OTP + 카카오) | MVP |
| PT-02 | 워커 자격 관리: 범죄경력확인서 업로드, 관리자 수동 승인 | MVP |
| PT-03 | 펫 프로필: 종, 품종, 나이, 체중, 사진, 의료/특이사항 | MVP |
| PT-04 | 예약 생성: 펫, 서비스 유형(walk), 날짜/시간, 기간, 픽업 위치 | MVP |
| PT-05 | 근접 매칭: 반경 3km, 거리/평점/완료율 기반 정렬 (Haversine) | MVP |
| PT-06 | 워커 예약 수락/거절 (15분 타임아웃) | MVP |
| PT-07 | 산책 GPS 스트리밍: 워커 → Redis 버퍼(5초) → PostgreSQL(30초 flush) | MVP |
| PT-08 | 오너 실시간 추적: WebSocket 구독 (walk_session:{id}:gps) | MVP |
| PT-09 | 산책 종료 → Toss Payments 결제 (에스크로) → 85% 워커 / 15% 플랫폼 | MVP |
| PT-10 | 워커 지갑: 잔액 조회, 출금 요청(D+1), 주 1회 자동 정산 | MVP |
| PT-11 | 리뷰: 1-5 별점 + 텍스트, 48시간 내 작성, 워커 프로필에 공개 | MVP |
| PT-12 | FCM 푸시: 예약 확정/거절, 산책 시작/종료. SMS 폴백 | MVP |
| PT-13 | 오너-워커 인앱 채팅 (예약 기반, 30일 보관) | MVP |
| PT-14 | 워커 가용시간 캘린더 (일별 슬롯) | MVP |
| PT-15 | 관리자: 유저 관리, 워커 승인, 수수료 리포트 | MVP |
| PT-16 | 위치정보 동의: 워커 GPS 추적 동의 (DriverLocationConsent 패턴 재사용) | MVP |
| PT-17 | GPS 데이터 180일 자동 삭제 (기존 cron 재사용) | MVP |

### 4.3 CareConnect

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-01 | PARENT, CAREGIVER 역할 등록 (OTP + 카카오) | MVP |
| CC-02 | 돌봄자 자격 관리: 범죄/학대/성범죄 경력확인서 업로드, 관리자 승인 | MVP |
| CC-03 | 아이 프로필: 이름, 생년월일, 알레르기, 특이사항, 긴급연락처 | MVP |
| CC-04 | 14세 미만 법정대리인 동의: JSON scope + IP + 시간 기록 | MVP |
| CC-05 | 아이 PII 앱 레이어 암호화: allergies, medical_notes, emergency_contact | MVP |
| CC-06 | 예약 생성: 아이, 돌봄 유형(visit), 날짜/시간, 기간, 돌봄 주소 | MVP |
| CC-07 | 근접 매칭: 반경 5km, 거리/평점/완료율/인증등급 기반 정렬 | MVP |
| CC-08 | 돌봄자 예약 수락/거절 (30분 타임아웃) | MVP |
| CC-09 | 체크인: 돌봄 주소 200m 지오펜스 내 GPS 좌표 검증 | MVP |
| CC-10 | 활동 로그: 텍스트 + 사진 URL, 30분마다 1회 이상 권장 | MVP |
| CC-11 | 체크아웃: 종료 시각 기록, 총 시간 계산 | MVP |
| CC-12 | 부모 "인수 확인" 버튼 (5분 미확인 시 재알림) | MVP |
| CC-13 | 결제: 시간 × 시급 → Toss 결제 → 80% 돌봄자 / 20% 플랫폼 | MVP |
| CC-14 | 돌봄자 지갑: 잔액 조회, 출금 요청(D+1), 주 1회 자동 정산 | MVP |
| CC-15 | 리뷰: 1-5 별점 + 텍스트, 48시간 내 작성 | MVP |
| CC-16 | FCM 푸시: 예약/체크인/체크아웃/인수요청. SMS 폴백 | MVP |
| CC-17 | 부모-돌봄자 인앱 채팅 (예약 기반, 6개월 보관) | MVP |
| CC-18 | SOS 긴급 버튼: 부모 + 관리자 + 112 동시 알림 | MVP |
| CC-19 | 관리자: 유저 관리, 돌봄자 승인, 동의 감사, 수수료 리포트 | MVP |
| CC-20 | 아동 데이터 접근 감사 로그 (AuditLog 재사용) | MVP |

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | GPS 스트리밍 지연 | < 3초 (워커→오너) |
| NFR-02 | 예약 API 응답 시간 | < 500ms (p95) |
| NFR-03 | 동시 GPS 스트리밍 세션 | MVP: 100, Scale: 1,000 |
| NFR-04 | 앱 시작 → 홈 화면 | < 3초 (cold start) |
| NFR-05 | 모바일 앱 번들 크기 | < 25MB (앱별) |
| NFR-06 | 가용성 | 99.5% (월간) |
| NFR-07 | GPS 데이터 보관 | 정확히 180일 후 자동 삭제 |
| NFR-08 | 메시지 보관 | 6개월 후 자동 삭제 |

---

## 6. Constraints

| ID | Constraint | Impact |
|----|-----------|--------|
| CON-01 | Expo SDK 54 + Expo Go (네이티브 모듈 불가) | KakaoMap SDK 대신 WebView 지도 |
| CON-02 | 1인 개발자 | 순차 집중 개발 (병렬 UI 개발 금지) |
| CON-03 | 사업자 등록 진행 중 | 앱스토어 제출 전 BRN 필요 |
| CON-04 | PostgreSQL ALTER TYPE 비트랜잭션 | 단일 마이그레이션 + 수동 롤백 |
| CON-05 | 무료 ngrok 터널 1개 제한 | proxy.js로 Metro + Backend 합침 |

---

## 7. Architecture

### 7.1 Monorepo Structure

```
safeway_kids/                          # 루트 (기존 리포 그대로)
├── package.json                       # NEW: npm workspaces root
├── turbo.json                         # NEW: Turborepo config
├── packages/
│   ├── core-backend/                  # 공통 백엔드 (기존 backend/ 리팩토링)
│   │   ├── app/
│   │   │   ├── core/                  # auth, billing, gps, notifications, messaging
│   │   │   ├── apps/
│   │   │   │   ├── pettracker/        # PT 도메인 라우터 + 모델 + 서비스
│   │   │   │   ├── careconnect/       # CC 도메인 라우터 + 모델 + 서비스
│   │   │   │   └── safeway_kids/      # 기존 모듈 (변경 없음)
│   │   │   └── middleware/            # auth, rbac (app_context 강화), consent, logging
│   │   └── migrations/
│   └── core-mobile/                   # NEW: 공유 모바일 코드
│       ├── hooks/                     # useAuth, useSubjectTracking, useNotifications
│       ├── components/                # SOSButton, InfoRow, ReviewCard, WalletCard...
│       ├── api/                       # client, auth, billing, notifications
│       ├── navigation/                # createRootNavigator, tabConfig
│       └── theme/                     # createTheme, tokens
├── apps/
│   ├── pettracker/
│   │   ├── mobile/                    # PT 앱 (Expo)
│   │   │   ├── app.json               # bundleId: com.safeway.pettracker
│   │   │   ├── App.tsx
│   │   │   └── src/screens/           # PT 전용 화면
│   │   └── eas.json
│   ├── careconnect/
│   │   ├── mobile/                    # CC 앱 (Expo)
│   │   │   ├── app.json               # bundleId: com.safeway.careconnect
│   │   │   ├── App.tsx
│   │   │   └── src/screens/           # CC 전용 화면
│   │   └── eas.json
│   └── safeway-kids/
│       └── mobile/                    # 기존 mobile/ (최소 변경)
├── web/                               # 기존 관리자 대시보드
├── site/                              # 기존 랜딩
└── backend/                           # → packages/core-backend/ 로 이동 (symlink or move)
```

### 7.2 Backend Architecture

```
                 ┌──────────────┐
                 │   FastAPI     │
                 │   main.py     │
                 └──────┬───────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
   /api/v1/pt/*   /api/v1/cc/*   /api/v1/*
   PetTracker     CareConnect    SafeWay Kids
   routers        routers        routers (기존)
         │              │              │
         └──────────────┼──────────────┘
                        │
              ┌─────────┴─────────┐
              │  Shared Services   │
              ├────────────────────┤
              │ AuthService        │ ← app_context aware
              │ BillingService     │ ← commission model
              │ GpsService         │ ← Redis buffer + flush
              │ NotificationService│ ← FCM + SMS
              │ MessagingService   │ ← per-booking chat
              │ ComplianceService  │ ← consent + retention
              └────────────────────┘
                        │
              ┌─────────┴─────────┐
              │  PostgreSQL        │
              │  (shared, single)  │
              │  app_context col   │
              └────────────────────┘
```

### 7.3 Data Flow — PetTracker GPS Streaming

```
Walker Phone (expo-location, 5s interval)
    │
    ▼
POST /api/v1/pt/walks/{session_id}/gps
    │
    ▼
Redis RPUSH walk_session:{id}:gps  ← 버퍼링
    │ (30초마다)
    ▼
Background flush → walk_gps_history 테이블 (month-partitioned)
    │
    ▼ (동시에)
Redis PUBLISH walk_session:{id}:live ← 실시간 채널
    │
    ▼
WebSocket /ws/pt/walks/{session_id}/track
    │
    ▼
Owner Phone (지도에 워커 위치 표시)
```

### 7.4 Data Flow — CareConnect Geofence Check-in

```
Caregiver Phone (expo-location, single read)
    │
    ▼
POST /api/v1/cc/sessions/{session_id}/checkin
    body: { latitude, longitude, accuracy }
    │
    ▼
Server validates:
  1. accuracy < 50m (GPS 정확도 임계값)
  2. haversine(caregiver_loc, care_address) < 200m
  3. speed sanity check (이전 GPS와 비교, > 200km/h면 거부)
    │
    ├── PASS → care_sessions.checked_in_at = now()
    │          → FCM push to parent: "돌봄자 도착"
    │          → location_access_log 기록
    │
    └── FAIL → 400 "돌봄 주소 200m 반경 내에서 체크인해 주세요"
```

---

## 8. Database Schema

### 8.1 Core Changes (Migration M001)

```sql
-- Step 1: Extend UserRole enum (non-transactional, must COMMIT first)
COMMIT;
ALTER TYPE userrole ADD VALUE 'pet_owner';
ALTER TYPE userrole ADD VALUE 'walker';
ALTER TYPE userrole ADD VALUE 'caregiver';
BEGIN;

-- Step 2: Add app_context column
ALTER TABLE users ADD COLUMN app_context VARCHAR(30) NOT NULL DEFAULT 'safeway_kids';

-- Step 3: Drop old unique, add composite uniques
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE users ADD CONSTRAINT uq_users_phone_app UNIQUE (phone, app_context);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_kakao_id_key;
CREATE UNIQUE INDEX uix_users_kakao_app ON users (kakao_id, app_context)
    WHERE kakao_id IS NOT NULL;

-- Step 4: Add app_context to messages
ALTER TABLE messages ADD COLUMN app_context VARCHAR(30) DEFAULT 'safeway_kids';
```

**Rollback script:**
```sql
-- WARNING: Cannot remove enum values in PostgreSQL
-- Rollback strategy: drop app_context column, restore single unique
ALTER TABLE users DROP CONSTRAINT uq_users_phone_app;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
DROP INDEX IF EXISTS uix_users_kakao_app;
ALTER TABLE users ADD CONSTRAINT users_kakao_id_key UNIQUE (kakao_id);
ALTER TABLE users DROP COLUMN app_context;
ALTER TABLE messages DROP COLUMN app_context;
```

### 8.2 PetTracker Tables

```python
# packages/core-backend/app/apps/pettracker/models.py

class Pet(Base):
    __tablename__ = "pets"
    id: UUID (PK)
    owner_id: UUID (FK → users.id)
    name: String(100)
    species: String(20)       # dog, cat
    breed: String(100)
    birth_date: Date
    weight_kg: Float
    photo_url: String(500)
    medical_notes: Text
    temperament: String(50)   # calm, active, aggressive, anxious
    vaccination_status: String(20)  # up_to_date, overdue, unknown
    special_needs: Text
    is_active: Boolean
    created_at, updated_at: DateTime(TZ)

class WalkerQualification(Base):
    __tablename__ = "walker_qualifications"
    id: UUID (PK)
    user_id: UUID (FK → users.id, unique)
    background_check_date: Date
    background_check_doc_url: String(500)
    certification_type: String(100)  # 동물보건사, 반려동물관리사, none
    certification_doc_url: String(500)
    service_areas: JSON       # [{"lat": .., "lon": .., "radius_km": 3}]
    is_approved: Boolean (default False)
    approved_at: DateTime(TZ)
    approved_by: UUID (FK → users.id)
    created_at: DateTime(TZ)

class PtBooking(Base):
    __tablename__ = "pt_bookings"
    id: UUID (PK)
    owner_id: UUID (FK → users.id)
    walker_id: UUID (FK → users.id, nullable)
    pet_id: UUID (FK → pets.id)
    service_type: String(20)  # walk (MVP only)
    duration_minutes: Integer  # 30 or 60
    scheduled_at: DateTime(TZ)
    pickup_latitude: Float
    pickup_longitude: Float
    pickup_address: String(500)
    status: String(20)        # pending, confirmed, in_progress, completed, cancelled
    price: Integer            # KRW
    commission_rate: Integer  # 15 (percent)
    accepted_at: DateTime(TZ)
    timeout_at: DateTime(TZ)  # scheduled_at에서 15분 뒤
    cancelled_at: DateTime(TZ)
    cancel_reason: String(200)
    created_at, updated_at: DateTime(TZ)
    INDEX: (status, scheduled_at), (walker_id, scheduled_at), (owner_id, status)

class WalkSession(Base):
    __tablename__ = "walk_sessions"
    id: UUID (PK)
    booking_id: UUID (FK → pt_bookings.id, unique)
    walker_id: UUID (FK → users.id)
    started_at: DateTime(TZ)
    ended_at: DateTime(TZ)
    distance_meters: Integer
    route_polyline: JSON      # [[lat, lon], ...]
    arrival_photo_url: String(500)
    walker_memo: Text
    created_at: DateTime(TZ)

class WalkGpsHistory(Base):
    __tablename__ = "walk_gps_history"
    id: UUID (PK)
    session_id: UUID (FK → walk_sessions.id)
    latitude: Float
    longitude: Float
    heading: Float (nullable)
    speed: Float (nullable)
    accuracy: Float (nullable)
    recorded_at: DateTime(TZ)
    created_at: DateTime(TZ)
    PARTITION BY RANGE (recorded_at)  # monthly
    INDEX: (session_id, recorded_at)

class WalkerWallet(Base):
    __tablename__ = "walker_wallets"
    id: UUID (PK)
    user_id: UUID (FK → users.id, unique)
    balance: Integer (default 0)  # KRW
    bank_name: String(50)
    bank_account: String(50)      # encrypted
    account_holder: String(100)
    created_at, updated_at: DateTime(TZ)

class WalkerReview(Base):
    __tablename__ = "walker_reviews"
    id: UUID (PK)
    booking_id: UUID (FK → pt_bookings.id, unique)
    reviewer_id: UUID (FK → users.id)  # owner
    walker_id: UUID (FK → users.id)
    rating: Integer           # 1-5
    comment: Text
    created_at: DateTime(TZ)
    INDEX: (walker_id, created_at DESC)

class WalkerAvailability(Base):
    __tablename__ = "walker_availabilities"
    id: UUID (PK)
    walker_id: UUID (FK → users.id)
    available_date: Date
    start_time: Time
    end_time: Time
    status: String(20)  # available, booked, cancelled
    UNIQUE: (walker_id, available_date)
```

### 8.3 CareConnect Tables

```python
# packages/core-backend/app/apps/careconnect/models.py

class CcChild(Base):
    __tablename__ = "cc_children"
    id: UUID (PK)
    parent_id: UUID (FK → users.id)
    name: String(100)         # encrypted (app-layer)
    birth_date: Date
    age_group: String(20)     # infant, toddler, preschool, school_age
    allergies: Text           # encrypted (app-layer) — S-03
    medical_notes: Text       # encrypted (app-layer) — S-03
    emergency_contact: String(100)  # encrypted (app-layer) — S-03
    school_name: String(200)
    favorite_activities: JSON
    photo_url: String(500)
    is_active: Boolean
    created_at, updated_at: DateTime(TZ)

class ChildConsent(Base):
    __tablename__ = "child_consents"
    id: UUID (PK)
    parent_id: UUID (FK → users.id)
    child_id: UUID (FK → cc_children.id)
    consent_scope: JSON       # {"gps_tracking": true, "activity_photos": true, ...}
    consent_method: String(50)  # app_checkbox
    granted_at: DateTime(TZ)
    withdrawn_at: DateTime(TZ)
    ip_address: String(45)
    created_at: DateTime(TZ)

class CaregiverQualification(Base):
    __tablename__ = "caregiver_qualifications"
    id: UUID (PK)
    user_id: UUID (FK → users.id, unique)
    background_check_date: Date      # 범죄경력
    background_check_doc_url: String(500)
    child_abuse_check_date: Date     # 아동학대전력
    child_abuse_doc_url: String(500)
    sex_offense_check_date: Date     # 성범죄전력
    sex_offense_doc_url: String(500)
    cpr_cert_date: Date              # 응급처치
    cpr_doc_url: String(500)
    additional_certs: JSON           # 보육교사, 사회복지사 등
    service_areas: JSON
    preferred_age_groups: JSON       # ["toddler", "preschool"]
    is_approved: Boolean (default False)
    approved_at: DateTime(TZ)
    approved_by: UUID (FK → users.id)
    created_at: DateTime(TZ)

class CcBooking(Base):
    __tablename__ = "cc_bookings"
    id: UUID (PK)
    parent_id: UUID (FK → users.id)
    caregiver_id: UUID (FK → users.id, nullable)
    child_id: UUID (FK → cc_children.id)
    care_type: String(20)     # visit (MVP only)
    scheduled_at: DateTime(TZ)
    duration_hours: Float
    hourly_rate: Integer      # KRW
    care_address: String(500)
    care_latitude: Float
    care_longitude: Float
    status: String(20)        # pending, confirmed, in_progress, completed, cancelled
    commission_rate: Integer  # 20
    accepted_at: DateTime(TZ)
    timeout_at: DateTime(TZ)  # 30분
    cancelled_at: DateTime(TZ)
    cancel_reason: String(200)
    created_at, updated_at: DateTime(TZ)
    INDEX: (status, scheduled_at), (caregiver_id, scheduled_at), (parent_id, status)

class CareSession(Base):
    __tablename__ = "care_sessions"
    id: UUID (PK)
    booking_id: UUID (FK → cc_bookings.id, unique)
    caregiver_id: UUID (FK → users.id)
    checked_in_at: DateTime(TZ)
    checkin_latitude: Float
    checkin_longitude: Float
    checkin_accuracy: Float
    checked_out_at: DateTime(TZ)
    total_minutes: Integer
    handover_confirmed_at: DateTime(TZ)  # 부모 인수 확인
    caregiver_memo: Text
    created_at: DateTime(TZ)

class CareActivityLog(Base):
    __tablename__ = "care_activity_logs"
    id: UUID (PK)
    session_id: UUID (FK → care_sessions.id)
    activity_type: String(50)  # homework, play, meal, snack, nap, outdoor, other
    description: Text
    photo_url: String(500)
    logged_at: DateTime(TZ)
    INDEX: (session_id, logged_at)

class CaregiverWallet(Base):
    __tablename__ = "caregiver_wallets"
    # walker_wallets와 동일 구조
    id, user_id(unique), balance, bank_name, bank_account(encrypted), account_holder
    created_at, updated_at

class CaregiverReview(Base):
    __tablename__ = "caregiver_reviews"
    # walker_reviews와 동일 구조
    id, booking_id(unique→cc_bookings), reviewer_id, caregiver_id, rating, comment
    created_at
    INDEX: (caregiver_id, created_at DESC)

class CaregiverAvailability(Base):
    __tablename__ = "caregiver_availabilities"
    # walker_availabilities와 동일 구조
    id, caregiver_id, available_date, start_time, end_time, status
    UNIQUE: (caregiver_id, available_date)
```

### 8.4 Shared New Tables

```python
class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id: UUID (PK)
    wallet_type: String(20)   # walker, caregiver
    wallet_id: UUID           # FK dynamically (walker_wallets or caregiver_wallets)
    amount: Integer           # + for credit, - for debit
    tx_type: String(30)       # earning, withdrawal, refund, adjustment
    reference_id: UUID        # booking_id
    reference_type: String(30)  # pt_booking, cc_booking
    pg_transfer_id: String(200)  # Toss transfer ID (출금 시)
    status: String(20)        # pending, completed, failed
    created_at: DateTime(TZ)
    INDEX: (wallet_id, created_at DESC)

class CommissionRecord(Base):
    __tablename__ = "commission_records"
    id: UUID (PK)
    app_context: String(30)
    booking_id: UUID
    booking_type: String(30)  # pt_booking, cc_booking
    gross_amount: Integer     # 총 결제액
    commission_rate: Integer  # 15 or 20
    commission_amount: Integer
    provider_amount: Integer  # 워커/돌봄자 수령액
    created_at: DateTime(TZ)

class LocationConsent(Base):
    __tablename__ = "location_consents"
    id: UUID (PK)
    user_id: UUID (FK → users.id)
    app_context: String(30)
    consent_granted: Boolean
    granted_at: DateTime(TZ)
    ip_address: String(45)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id: UUID (PK)
    user_id: UUID (FK → users.id)
    app_context: String(30)
    plan_type: String(30)     # owner_premium, walker_premium, parent_premium, caregiver_premium
    price: Integer            # 4900 or 9900
    status: String(20)        # active, cancelled, expired
    started_at: DateTime(TZ)
    expires_at: DateTime(TZ)
    pg_subscription_key: String(200)
    created_at: DateTime(TZ)
```

---

## 9. API Endpoints

### 9.1 PetTracker API (/api/v1/pt/)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /pets | PET_OWNER | 펫 등록 |
| GET | /pets | PET_OWNER | 내 펫 목록 |
| PUT | /pets/{id} | PET_OWNER | 펫 수정 |
| POST | /walkers/qualification | WALKER | 자격 서류 제출 |
| GET | /walkers/search | PET_OWNER | 워커 검색 (위치, 날짜, 시간) |
| GET | /walkers/{id}/profile | PET_OWNER | 워커 프로필 상세 |
| POST | /walkers/availability | WALKER | 가용 시간 등록 |
| GET | /walkers/availability | WALKER | 내 가용 시간 |
| POST | /bookings | PET_OWNER | 예약 생성 |
| POST | /bookings/{id}/accept | WALKER | 예약 수락 |
| POST | /bookings/{id}/decline | WALKER | 예약 거절 |
| POST | /bookings/{id}/cancel | PET_OWNER/WALKER | 예약 취소 |
| GET | /bookings | PET_OWNER/WALKER | 예약 목록 |
| POST | /walks/{booking_id}/start | WALKER | 산책 시작 |
| POST | /walks/{session_id}/gps | WALKER | GPS 데이터 전송 |
| POST | /walks/{session_id}/end | WALKER | 산책 종료 |
| GET | /walks/{session_id}/report | PET_OWNER | 산책 리포트 |
| WS | /ws/pt/walks/{session_id}/track | PET_OWNER | 실시간 GPS 구독 |
| POST | /reviews | PET_OWNER | 리뷰 작성 |
| GET | /wallet | WALKER | 지갑 잔액 |
| GET | /wallet/transactions | WALKER | 거래 내역 |
| POST | /wallet/withdraw | WALKER | 출금 요청 |
| POST | /admin/walkers/{id}/approve | PLATFORM_ADMIN | 워커 승인 |
| GET | /admin/dashboard | PLATFORM_ADMIN | 관리 대시보드 |

### 9.2 CareConnect API (/api/v1/cc/)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /children | PARENT | 아이 등록 |
| GET | /children | PARENT | 내 아이 목록 |
| PUT | /children/{id} | PARENT | 아이 수정 |
| POST | /children/{id}/consent | PARENT | 14세 미만 동의 |
| POST | /caregivers/qualification | CAREGIVER | 자격 서류 제출 |
| GET | /caregivers/search | PARENT | 돌봄자 검색 |
| GET | /caregivers/{id}/profile | PARENT | 돌봄자 프로필 |
| POST | /caregivers/availability | CAREGIVER | 가용 시간 등록 |
| POST | /bookings | PARENT | 예약 생성 |
| POST | /bookings/{id}/accept | CAREGIVER | 예약 수락 |
| POST | /bookings/{id}/decline | CAREGIVER | 예약 거절 |
| POST | /bookings/{id}/cancel | PARENT/CAREGIVER | 예약 취소 |
| GET | /bookings | PARENT/CAREGIVER | 예약 목록 |
| POST | /sessions/{booking_id}/checkin | CAREGIVER | 체크인 (지오펜스) |
| POST | /sessions/{session_id}/activity | CAREGIVER | 활동 로그 |
| POST | /sessions/{session_id}/checkout | CAREGIVER | 체크아웃 |
| POST | /sessions/{session_id}/handover | PARENT | 인수 확인 |
| POST | /reviews | PARENT | 리뷰 작성 |
| GET | /wallet | CAREGIVER | 지갑 잔액 |
| POST | /wallet/withdraw | CAREGIVER | 출금 요청 |
| POST | /admin/caregivers/{id}/approve | PLATFORM_ADMIN | 돌봄자 승인 |
| GET | /admin/dashboard | PLATFORM_ADMIN | 관리 대시보드 |
| GET | /admin/consents | PLATFORM_ADMIN | 동의 감사 |

---

## 10. Mobile Screen Map

### 10.1 PetTracker (21 screens)

```
OwnerTabNavigator:
  ├── HomeScreen              # 다음 예약, 펫 상태, 빠른 예약 CTA
  ├── SearchScreen            # 워커 검색 (날짜/시간/유형)
  │   └── WalkerProfileScreen # 워커 상세 (인증, 리뷰, 가용시간)
  ├── BookingsScreen          # 예약 목록
  │   ├── BookingDetailScreen # 예약 상세
  │   └── LiveTrackScreen     # 실시간 GPS 추적 (지도)
  │       └── ActivityFeedScreen  # 사진/메모 피드
  ├── WalkReportScreen        # 산책 리포트 (경로, 거리, 사진)
  └── ProfileScreen           # 프로필, 펫 관리, 결제 내역, 설정

WalkerTabNavigator:
  ├── WalkerHomeScreen        # 오늘 예약, 수입 요약
  ├── ScheduleScreen          # 가용시간 관리, 예약 캘린더
  ├── BookingRequestScreen    # 매칭 요청 수락/거절
  ├── WalkScreen              # 산책 진행 UI (대형 사진 FAB, 타이머)
  ├── EarningsScreen          # 수입 대시보드, 출금
  └── WalkerProfileScreen     # 내 프로필, 자격증, 설정

Shared:
  ├── OnboardingScreen        # 3슬라이드 (리스킨)
  ├── LoginScreen             # OTP + 카카오 (리스킨)
  ├── RoleSelectScreen        # 반려인/산책도우미
  ├── PetRegistrationScreen   # 펫 등록
  ├── ReviewScreen            # 리뷰 작성
  ├── ChatScreen              # 인앱 채팅
  └── NotificationSettingsScreen  # 알림 설정 (리스킨)
```

### 10.2 CareConnect (25 screens)

```
ParentTabNavigator:
  ├── HomeScreen              # 다음 예약, 아이 상태
  ├── SearchScreen            # 돌봄자 검색
  │   └── CaregiverProfileScreen  # 5중 인증 배지, 리뷰
  ├── BookingsScreen          # 예약 목록
  │   ├── BookingDetailScreen
  │   └── SessionMonitorScreen    # 활동 피드 + GPS
  │       └── ActivityFeedScreen  # 활동/식사/사진 타임라인
  ├── HandoverScreen          # 인수 확인
  └── ProfileScreen

CaregiverTabNavigator:
  ├── CaregiverHomeScreen     # 오늘 예약, 수입
  ├── ScheduleScreen          # 가용시간, 캘린더
  ├── BookingRequestScreen    # 매칭 수락/거절
  ├── SessionScreen           # 돌봄 진행 (체크인→활동→체크아웃)
  │   └── ActivityLogScreen   # 활동 기록 입력
  ├── EarningsScreen          # 수입, 출금
  └── CaregiverProfileScreen

Shared:
  ├── OnboardingScreen (4슬라이드, 안전 강조)
  ├── LoginScreen
  ├── RoleSelectScreen (부모/돌봄자)
  ├── ChildRegistrationScreen (알레르기 필수)
  ├── ConsentScreen (14세 미만 동의)
  ├── ReviewScreen
  ├── ChatScreen
  ├── VideoCallScreen (첫 예약 시 권장) — NEW
  ├── SOSScreen — 재사용
  └── NotificationSettingsScreen
```

---

## 11. Edge Cases

| # | Case | App | Handling |
|---|------|-----|----------|
| E-01 | 워커가 15분 내 미응답 | PT | 자동 거절 → 다음 워커 매칭 or 오너 재검색 |
| E-02 | 산책 중 GPS 끊김 | PT | 폴링 폴백 (10초), 30초 이상 끊기면 오너에게 알림 |
| E-03 | 산책 시작 후 워커가 앱 종료 | PT | 백그라운드 GPS는 Expo Go 제약. 재실행 시 세션 복구 |
| E-04 | 오너가 결제 실패 | PT | 산책 시작 불가, 에스크로 선결제 |
| E-05 | 돌봄자 지오펜스 밖에서 체크인 | CC | 400 에러 + "200m 내에서 체크인하세요" |
| E-06 | 30분 활동 무보고 | CC | 자동 푸시 → 돌봄자에게 "활동 보고를 남겨주세요" |
| E-07 | 부모 인수 미확인 (5분) | CC | 재알림 (3회까지), 이후 관리자 에스컬레이션 |
| E-08 | 아이 알레르기 음식 기록 시 | CC | 경고 배너 표시 (알레르기 목록과 교차 체크) |
| E-09 | 동일 번호로 PT+CC 가입 | Both | app_context 다르므로 별도 계정, 별도 JWT |
| E-10 | 워커/돌봄자 탈퇴 시 진행 중 예약 | Both | 진행 중 예약 완료 후 탈퇴 가능 |

---

## 12. Failure Handling

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| Redis 다운 | GPS 버퍼 write 실패 | PostgreSQL 직접 write 폴백 | Redis 복구 시 자동 전환 |
| Toss Payments 타임아웃 | 30초 타임아웃 | 결제 보류, 재시도 큐 | 3회 재시도 후 수동 처리 |
| FCM 전송 실패 | FCM 응답 코드 | SMS 폴백 (NHN Cloud) | 토큰 갱신 후 재시도 |
| WebSocket 연결 끊김 | heartbeat 실패 | 클라이언트 자동 재연결 (지수 백오프) | 10초 폴링 폴백 |
| 파일 업로드 실패 | HTTP 에러 | 재시도 버튼 표시 | 3회 재시도 |
| DB 커넥션 풀 고갈 | pool timeout | 503 반환, 알림 | 자동 복구 (pool_recycle) |

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
                  ┌─────────┐
                  │  E2E(*)  │  (* MVP 이후)
                 ┌┴─────────┴┐
                 │ Integration│  API + DB + Redis
                ┌┴───────────┴┐
                │    Unit      │  Services + Hooks + Components
                └──────────────┘
```

### 13.2 Test Scope

| Layer | Tool | Focus | Target |
|-------|------|-------|--------|
| Backend Unit | pytest | Service logic, validation | 80%+ coverage |
| Backend Integration | pytest + httpx | API endpoints, auth flow, RBAC | Critical paths |
| Core RBAC | pytest | app_context 격리 검증 | 100% coverage |
| Mobile Unit | Jest + RTL | Hooks, components | 70%+ coverage |
| Mobile Integration | Jest | Navigation, API mocking | Critical flows |
| Cross-app Isolation | pytest | PT JWT → CC endpoint 거부 확인 | 100% |

### 13.3 Critical Test Cases

| # | Test | Type | Priority |
|---|------|------|----------|
| T-01 | SafeWay PARENT JWT cannot access CareConnect endpoints | Integration | P0 |
| T-02 | PetTracker WALKER JWT cannot access CareConnect endpoints | Integration | P0 |
| T-03 | Geofence check-in rejects GPS > 200m | Unit | P0 |
| T-04 | Geofence check-in rejects accuracy > 50m | Unit | P0 |
| T-05 | Toss payment creates correct commission split | Unit | P0 |
| T-06 | Wallet balance updates correctly after earning/withdrawal | Unit | P0 |
| T-07 | Child PII fields are encrypted in DB | Integration | P0 |
| T-08 | File upload rejects non-allowed MIME types | Unit | P1 |
| T-09 | OTP rate limit blocks after 5 attempts | Integration | P1 |
| T-10 | GPS data auto-purged after 180 days | Integration | P1 |

---

## 14. Rollback Strategy

| Component | Rollback Method |
|-----------|----------------|
| DB Migration | SQL rollback script (Section 8.1) |
| Backend API | Feature flag per app_context, disable routes |
| Mobile App | App Store 이전 버전 유지 (최소 1주) |
| WebSocket | 폴링 폴백 자동 전환 |
| Redis | PostgreSQL 직접 write 폴백 |

---

## 15. Acceptance Criteria

### PetTracker MVP

- [ ] AC-PT-01: 오너가 카카오 로그인 → 펫 등록 → 워커 검색 → 예약 → 결제까지 완료
- [ ] AC-PT-02: 워커가 예약 수락 → 산책 시작 → GPS 스트리밍 → 오너가 실시간 추적 확인
- [ ] AC-PT-03: 산책 종료 → 리포트 생성 → 리뷰 작성 → 워커 지갑에 85% 적립
- [ ] AC-PT-04: 워커 출금 요청 → D+1 정산
- [ ] AC-PT-05: 관리자가 워커 승인/거부 가능
- [ ] AC-PT-06: SafeWay Kids PARENT JWT가 PetTracker endpoint 접근 불가 (RBAC 격리)
- [ ] AC-PT-07: GPS 데이터 180일 후 자동 삭제 확인
- [ ] AC-PT-08: App Store 심사 통과

### CareConnect MVP

- [ ] AC-CC-01: 부모가 카카오 로그인 → 아이 등록 → 14세 동의 → 돌봄자 검색 → 예약 → 결제
- [ ] AC-CC-02: 돌봄자가 200m 지오펜스 내 체크인 성공 / 밖에서 실패
- [ ] AC-CC-03: 돌봄 중 활동 로그 → 부모 피드에 실시간 표시
- [ ] AC-CC-04: 체크아웃 → 부모 인수 확인 → 결제 → 돌봄자 지갑에 80% 적립
- [ ] AC-CC-05: SOS 버튼 → 부모 + 관리자 알림 전송
- [ ] AC-CC-06: 아동 PII (알레르기, 의료, 긴급연락처) DB에 암호화 저장 확인
- [ ] AC-CC-07: PetTracker WALKER JWT가 CareConnect endpoint 접근 불가
- [ ] AC-CC-08: App Store 심사 통과

---

## 16. Implementation Schedule

```
Week 1: 공통 코어 인프라                    ◀━━ 현재
  ├── M001: Alembic migration (UserRole + app_context)
  ├── JWT app_context + aud 클레임
  ├── RBAC require_roles_with_context()
  ├── Auth service app_context 파라미터
  ├── 보안 패치 (파일업로드, OTP, Toss webhook)
  ├── 모노레포 셋업 (npm workspaces + turbo)
  ├── core-mobile 추출 (hooks, api, components, navigation, theme)
  └── 크로스앱 격리 테스트 (T-01, T-02)

Week 2-3: PetTracker 집중 🐕
  ├── DB: 8 tables + indexes + partition
  ├── API: 20+ endpoints
  ├── Mobile: 21 screens (10 reskin + 11 new)
  ├── GPS streaming (Redis + WebSocket)
  ├── Toss Payments 결제 + 지갑
  ├── 테스트 (unit + integration)
  └── App Store 제출

Week 4-5: CareConnect 집중 👶
  ├── DB: 9 tables + child PII encryption
  ├── API: 20+ endpoints
  ├── Mobile: 25 screens (10 reskin + 15 new)
  ├── Geofence check-in (200m)
  ├── Activity logging + handover
  ├── 14세 미만 동의 + 감사 로그
  ├── 테스트 (unit + integration + consent audit)
  └── App Store 제출

Week 6: 하드닝
  ├── 보안 하드닝 (refresh rotation, audit)
  ├── 성능 테스트 (100 concurrent GPS sessions)
  ├── 크로스앱 E2E 검증
  └── 모니터링 알림 설정
```

---

## 17. Code Impact Map

| File | Change Type | Description |
|------|-----------|-------------|
| `backend/app/modules/auth/models.py` | MODIFY | UserRole enum + app_context column |
| `backend/app/modules/auth/service.py` | MODIFY | JWT claims + login app_context param |
| `backend/app/middleware/auth.py` | MODIFY | Extract app_context from JWT |
| `backend/app/middleware/rbac.py` | MODIFY | Validate role + app_context |
| `backend/app/modules/compliance/service.py` | MODIFY | File upload validation |
| `backend/app/config.py` | MODIFY | OTP rate limit, Toss webhook mandatory |
| `backend/migrations/` | ADD | M001 migration |
| `backend/app/apps/pettracker/` | ADD | 8 models + routers + services |
| `backend/app/apps/careconnect/` | ADD | 9 models + routers + services |
| `packages/core-mobile/` | ADD | Extracted shared hooks/components/api |
| `apps/pettracker/mobile/` | ADD | PT app (21 screens) |
| `apps/careconnect/mobile/` | ADD | CC app (25 screens) |
| `package.json` (root) | ADD | npm workspaces config |
| `turbo.json` | ADD | Turborepo config |

---

## 18. Out of Scope (Explicit)

- SafeWay Kids 기능 변경
- 자동 범죄경력 조회 API 연동
- PostGIS 설치 및 공간 인덱스
- PostgreSQL Row-Level Security
- 네이티브 빌드 (Expo Go 환경)
- 다국어 (한국어 전용)
- PetTracker 드롭인/보딩/데이케어
- CareConnect 등하원/야간돌봄
- AI 매칭 알고리즘
- 보험 연동
- 정부 아이돌봄 서비스 API 연동
