# 베타 재검증: 법규/보안 리뷰

**작성일:** 2026-03-22
**리뷰어:** P16 (과기정통부/국토부 실무관), P17 (개인정보보호 전문 변호사), P19 (보안 취약점 공격자)
**대상:** P0 27개 항목 구현 후 코드베이스 재검증
**이전 리뷰:** `artifacts/reviews/2026-03-21-legal-regulatory-review.md`, `artifacts/reviews/2026-03-21-tech-security-review.md`

---

## 1. 이전 CRITICAL 이슈 재검증 결과

### 1.1 보안 취약점 (P19 해커 관점)

#### V1. OTP 브루트포스 — RESOLVED

**이전 상태:** `random` 모듈 사용, 실패 카운터 없음
**현재 코드:** `backend/app/modules/auth/service.py:2,84-86,131-152`

검증 결과:
- `secrets.randbelow()` 사용으로 암호학적 안전성 확보 — **해결됨**
- 전화번호별 실패 카운터 구현 (`otp_fail:{phone}`) — **해결됨**
- 5회 실패 시 15분 잠금 (`OTP_MAX_FAILURES=5`, `OTP_LOCK_SECONDS=900`) — **해결됨**
- 잠금 상태에서 OTP 발송도 차단 (service.py:114) — **해결됨**
- OTP 감사 로그 기록 (`_log_otp_event`) — **추가 보안 조치**

**판정: VERIFIED — RESOLVED**

---

#### V3. dev-login OTP 우회 — RESOLVED (부분)

**이전 상태:** `production`이 아닌 모든 환경에서 활성화, 역할 제한 없음
**현재 코드:** `backend/app/modules/auth/router.py:104-130`

검증 결과:
- `development` 환경에서만 동작 (이전: `production`이 아닌 모든 환경) — **개선됨**
- `X-Dev-Secret` 헤더 검증 추가 (`config.py:55`) — **해결됨**
- `platform_admin` 역할 생성 차단 — **해결됨**

**잔여 리스크:**
- `dev_login_secret` 기본값이 `"change-me-dev"` — 개발 환경에서도 이 기본값은 추측 가능. 프로덕션 밸리데이터에 포함되지 않음 (개발 환경이므로 의도적일 수 있으나, 스테이징 배포 시 리스크)
- `environment` 변수가 `"development"`인 서버가 외부 노출되면 여전히 위험

**판정: VERIFIED — MOSTLY RESOLVED (잔여 리스크 LOW)**

---

#### V4. IDOR — 학생 정보 접근 — RESOLVED

**이전 상태:** `get_student`에서 소유권 확인 없음
**현재 코드:** `backend/app/modules/student_management/router.py:111-125`

검증 결과:
```python
if current_user.role == UserRole.PARENT and student.guardian_id != current_user.id:
    raise ForbiddenError(detail="본인의 자녀 정보만 조회할 수 있습니다")
```
- PARENT 역할에서 `guardian_id` 소유권 확인 추가 — **해결됨**
- ACADEMY_ADMIN, PLATFORM_ADMIN은 조회 허용 — **적절**

**판정: VERIFIED — RESOLVED**

---

#### V5. IDOR — 동의(Consent) 정보 접근 — RESOLVED

**이전 상태:** `get_consent`에서 소유권 확인 없음
**현재 코드:** `backend/app/modules/compliance/router.py:58-70`

검증 결과:
```python
if current_user.role == UserRole.PARENT and consent.guardian_id != current_user.id:
    raise ForbiddenError(detail="본인의 동의 정보만 조회할 수 있습니다")
```
- PARENT 역할에서 소유권 확인 추가 — **해결됨**

**판정: VERIFIED — RESOLVED**

---

#### V6. WebSocket 차량 위치 스트림 인가 부재 — RESOLVED

**이전 상태:** JWT 인증만 있고 인가(authorization) 없음
**현재 코드:** `backend/app/modules/vehicle_telemetry/router.py:215-221`, `service.py:227-288`

검증 결과:
- `check_vehicle_access()` 함수 구현으로 역할별 차량 접근 권한 확인 — **해결됨**
  - `PLATFORM_ADMIN`: 전체 허용
  - `DRIVER`: 오늘 배정된 차량만 (`VehicleAssignment.driver_id == user.id`)
  - `SAFETY_ESCORT`: 오늘 배정된 차량만 (`VehicleAssignment.safety_escort_id == user.id`)
  - `PARENT`: 자녀가 오늘 배정된 차량만 (`DailyScheduleInstance` 교차 검증)
  - `ACADEMY_ADMIN`: 학원 학생이 배정된 차량만
- 인가 실패 시 WebSocket 4003 Forbidden 코드로 연결 거부 — **적절**

**판정: VERIFIED — RESOLVED**

---

### 1.2 법규 리스크 (P16 실무관 관점)

#### R-01. 운전자 자격 검증 시스템 부재 — RESOLVED

**이전 상태:** User 모델에 운전자 자격 정보 필드 없음
**현재 코드:** `backend/app/modules/auth/models.py:46-64`, `router.py:228-334`

검증 결과:
- `DriverQualification` 모델 신설 — **해결됨**
  - `license_number` (AES-256 암호화 저장) — **해결됨**
  - `license_type` (면허 종류) — **해결됨**
  - `license_expiry` (면허 유효기간) — **해결됨**
  - `criminal_check_date` / `criminal_check_clear` (범죄경력 조회) — **해결됨**
  - `safety_training_date` / `safety_training_expiry` (안전교육) — **해결됨**
  - `is_qualified` (자동 계산) — **해결됨**
- CRUD API 구현 (PLATFORM_ADMIN 전용) — **적절**
- 면허번호 AES-256 암호화 (`encrypt_value`) — **법적 요건 충족**

**잔여 이슈:**
- `is_qualified` 자동 계산이 등록/수정 시점에만 발생 — 면허 만료 후에도 `is_qualified=True`가 유지될 수 있음. 일일 배치로 재계산하는 스케줄러 필요
- 차량 배정(`VehicleAssignment`) 시 `is_qualified` 검증 로직이 코드에서 확인되지 않음 — 자격 미충족 운전자의 배정 차단이 시스템적으로 강제되지 않음

**규제 샌드박스 심사 대응:**
> Q: "운전자가 범죄경력이 있는 경우 어떻게 차단합니까?"
> A: (이제 답변 가능) "DriverQualification 모델에서 criminal_check_clear가 false이면 is_qualified가 false로 설정됩니다. 다만 배정 시점 차단 로직은 추가 구현 필요."

**판정: VERIFIED — MOSTLY RESOLVED (배정 시점 차단 로직 미구현)**

---

#### R-02. 차량 기준 관리 필드 미비 — RESOLVED

**이전 상태:** Vehicle 모델에 연식, 신고번호 등 법정 필수 필드 없음
**현재 코드:** `backend/app/modules/vehicle_telemetry/models.py:10-37`

검증 결과:
- `manufacture_year` (제조연도) — **추가됨**
- `school_bus_registration_no` (통학버스 신고번호) — **추가됨**
- `is_yellow_painted` (황색 도색 확인) — **추가됨**
- `vehicle_type` (차량 종류) — **추가됨**
- `has_cctv` (CCTV 설치 여부) — **추가됨**
- `has_stop_sign` (어린이보호표지 부착) — **추가됨**
- `last_inspection_date` (최근 검사일) — **추가됨**
- `insurance_type` / `insurance_coverage_amount` (보험 상세) — **추가됨**

**잔여 이슈:**
- 연식 3년 초과 차량 자동 경고/차단 로직 미구현
- 보험/검사 만료 시 차량 자동 비활성화 로직 미구현
- 미신고(`school_bus_registration_no` NULL) 차량의 배차 차단 로직 미구현

**판정: VERIFIED — MOSTLY RESOLVED (데이터 모델 완비, 비즈니스 로직 미구현)**

---

#### R-04. 어린이 통학버스 신고 의무 관리 — PARTIALLY RESOLVED

**이전 상태:** DocumentType에 통학버스 신고필증 유형 없음, 신고 상태 추적 불가
**현재 코드:** `backend/app/modules/compliance/models.py:11-16`

검증 결과:
- `DocumentType` enum에 `SCHOOL_BUS_REGISTRATION` 항목이 **추가되지 않음** — 미해결
- Vehicle 모델에 `school_bus_registration_no` 필드 추가로 번호 저장은 가능 — 부분 해결
- 신고 상태 관리(미신고/신고완료/신고취소) 추적 불가 — 미해결

**판정: PARTIALLY VERIFIED — 데이터 필드만 추가, 문서 관리/상태 추적 미구현**

---

### 1.3 개인정보보호 (P17 변호사 관점)

#### P-01. 14세 미만 아동 동의 프로세스 — IMPROVED

**이전 상태:** 동의 항목 세분화 부족, 기본값으로 location_tracking=True
**현재 코드:** `backend/app/modules/compliance/schemas.py:7-34`, `service.py:26-41`

검증 결과:
- `ConsentScopeModel` 구조화: 필수(service_terms, privacy_policy, child_info_collection) / 선택(location_tracking, push_notification, marketing, third_party_sharing) 구분 — **해결됨**
- `location_tracking` 기본값 `False`로 변경 — **해결됨** (이전: True)
- 필수 동의 항목 서버 사이드 검증 (`create_consent` 서비스) — **해결됨**

**잔여 이슈:**
- `ConsentCreateRequest.consent_scope`가 여전히 `dict` 타입 — `ConsentScopeModel`로 타입 강제하면 더 안전
- 법정대리인 자격 검증 없음 — `guardian_id`가 해당 아동의 실제 법정대리인인지 확인하는 로직 없음 (student.guardian_id와 교차 검증 필요)
- 법정대리인 본인확인 수단: OTP만으로는 시행령 제17조 요건 부족할 수 있음

**판정: VERIFIED — IMPROVED (핵심 구조 개선됨, 본인확인 강화 추후 필요)**

---

#### P-02. 위치정보법 대응 — RESOLVED (핵심)

**이전 상태:** 위치정보법 관련 아무런 대응 코드 없음
**현재 코드:** `backend/app/modules/vehicle_telemetry/models.py:67-78`, `service.py:291-332`, `router.py:223-236`

검증 결과:
- `LocationAccessLog` 모델 신설 (위치정보법 제16조) — **해결됨**
  - subject_type, subject_id, vehicle_id, accessor_user_id, access_purpose, accessed_at, retention_until
- WebSocket 연결 시 위치정보 접근 기록 자동 저장 — **해결됨**
- `retention_until` = today + 180일 (6개월 보관) — **법적 요건 충족**
- `purge_old_location_access_logs()`: 보관 기한 경과 기록 자동 삭제 — **해결됨**
- `purge_old_gps_data()`: 180일 초과 GPS 이력 자동 삭제 — **해결됨**

**잔여 이슈:**
- REST API (`GET /vehicles/{id}/location`)에서는 LocationAccessLog 기록이 없음 — WebSocket만 기록
- purge 함수들을 호출하는 스케줄러/cron 설정이 코드에서 확인되지 않음 — 함수만 존재하고 실행 트리거 미확인

**판정: VERIFIED — MOSTLY RESOLVED (핵심 구조 완비, REST API 기록 + 스케줄러 연결 필요)**

---

#### P-10 / A14. 동의 철회 시 GPS 데이터 삭제 — RESOLVED

**이전 상태:** 동의 철회 시 위치정보(GpsHistory) 처리 없음
**현재 코드:** `backend/app/modules/compliance/service.py:115-155`

검증 결과:
- 동의 철회 시 `location_tracking` 동의가 있었던 경우:
  - 해당 아동의 탑승 기록(`DailyScheduleInstance`)에서 차량ID/날짜 추출
  - 관련 `GpsHistory` 레코드 즉시 삭제 — **해결됨**
- 개인정보보호법 제36조 준수 — **적절**

**판정: VERIFIED — RESOLVED**

---

## 2. 미해결 이슈 (이전 리뷰에서 수정되지 않은 항목)

### 2.1 보안 — 여전히 미해결

| ID | 이슈 | 심각도 | 상태 |
|----|------|--------|------|
| V2 | JWT Secret 기본값 `"change-me-in-production"` (HS256 대칭키) | HIGH | 미해결 (프로덕션 밸리데이터는 있으나, 비대칭키 전환 미수행) |
| V7 | GPS 업데이트 스푸핑 — DRIVER가 아무 vehicle_id GPS 업데이트 가능 | HIGH | **미해결** |
| V8 | 탑승/하차 조작 — DRIVER가 아무 instance_id에 mark_boarded 가능 | HIGH | **미해결** |
| V9 | Toss Payments 웹훅 인증 미구현 (서명 검증 없음) | HIGH | **미해결** |
| V13 | Rate Limiting IP 기반만 (X-Forwarded-For 스푸핑 가능) | MEDIUM | 미해결 |
| V15 | Refresh Token 무효화 불가 (Stateless JWT) | MEDIUM | 미해결 |

#### V7 상세 (GPS 스푸핑 — 여전히 CRITICAL)

`backend/app/modules/vehicle_telemetry/router.py:139-146`:
```python
@router.post("/gps")
async def update_gps(
    body: GpsUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
):
    await service.update_gps(redis_client, body)
```
- `body.vehicle_id`가 해당 기사에게 배정된 차량인지 확인하지 않음
- 악의적 기사가 다른 차량의 위치를 임의로 변경 가능
- **아동 안전 시스템에서 위치 조작은 CRITICAL 수준**

#### V8 상세 (탑승/하차 조작 — 여전히 HIGH)

`backend/app/modules/scheduling/service.py:208-224`:
```python
async def mark_boarded(db, instance_id):
    stmt = select(DailyScheduleInstance).where(DailyScheduleInstance.id == instance_id)
    # instance_id만으로 조회 — 기사/차량 배정 확인 없음
```
- DRIVER/SAFETY_ESCORT가 아무 instance_id에 대해 탑승/하차 처리 가능
- 학부모에게 허위 "탑승 완료" 알림 전송 가능

#### V9 상세 (Toss 웹훅 — 여전히 HIGH)

`backend/app/modules/billing/router.py:255-265`:
- 웹훅 엔드포인트에 인증/서명 검증 없음
- 누구나 가짜 결제 완료 이벤트 전송 가능

---

### 2.2 법규 — 여전히 미해결

| ID | 이슈 | 심각도 | 상태 |
|----|------|--------|------|
| R-03 | 사고 발생 시 책임 소재 명확화 부족 | HIGH | 미해결 |
| R-05 | 동승보호자 배치 강제 검증 미흡 (safety_escort_id nullable) | HIGH | 미해결 |
| R-06 | 전세버스 계약 구조 증빙 불충분 | HIGH | 미해결 |
| R-07 | 실증특례 조건 이행 모니터링 체계 부재 | MEDIUM | 미해결 |

#### R-05 상세 (세림이법 — 여전히 HIGH)

`backend/app/modules/vehicle_telemetry/models.py:55-56`:
```python
safety_escort_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
```
- `safety_escort_id`가 여전히 nullable — 동승보호자 없이 운행 가능
- 운행 시작 전 동승보호자 체크인 확인 로직 없음

---

### 2.3 개인정보보호 — 여전히 미해결

| ID | 이슈 | 심각도 | 상태 |
|----|------|--------|------|
| P-03 | AES-256 암호화 미적용 (User.phone, Student.name 등 평문) | HIGH | **부분** — DriverQualification.license_number만 암호화, 나머지 평문 |
| P-05 | 데이터 보유/파기 자동화 미구현 | HIGH | **부분** — GPS purge 함수 존재, 스케줄러 미연결 |
| P-06 | 안면인식(생체정보) 수집 동의 체계 불충분 | HIGH | 미해결 (엣지 AI 미구현 상태이므로 현 시점 우선순위 낮음) |
| P-07 | 개인정보처리방침 법정 필수 항목 누락 | MEDIUM | 미해결 |
| P-08 | 개인정보 영향평가 부재 | MEDIUM | 미해결 (법무팀 업무) |

#### P-03 상세 (암호화 — 여전히 HIGH)

AES-256 `encrypt_value` 사용처:
- `DriverQualification.license_number` — **암호화 적용됨**
- `User.phone` — **여전히 평문**
- `User.email` — **여전히 평문**
- `Student.name` — **여전히 평문**
- `Student.date_of_birth` — **여전히 평문**
- `GpsHistory.latitude/longitude` — **여전히 평문**

개인정보처리방침에는 "AES-256 암호화" 명시 — **실제 구현과 불일치 지속**

---

## 3. 새 코드에서 발견된 새로운 이슈

### N1. ConsentCreateRequest.consent_scope 타입 불일치 — 심각도: MEDIUM

**위치:** `backend/app/modules/compliance/schemas.py:7-34`

`ConsentScopeModel`이 정의되어 있으나, `ConsentCreateRequest.consent_scope`는 여전히 `dict` 타입:
```python
class ConsentCreateRequest(BaseModel):
    consent_scope: dict = Field(...)  # ConsentScopeModel이 아닌 dict
```
- 클라이언트가 임의 키를 포함한 dict를 전송할 수 있음
- 서버 사이드 검증은 `required_items` 키 존재 여부만 확인 — 추가 악성 필드 삽입 가능
- **권장:** `consent_scope: ConsentScopeModel` 으로 타입 변경

---

### N2. DriverQualification is_qualified 시간 경과 무효화 누락 — 심각도: MEDIUM

**위치:** `backend/app/modules/auth/router.py:273-277`

```python
is_qualified = (
    body.license_expiry > _date.today()
    and body.criminal_check_clear
    and (body.safety_training_expiry is None or body.safety_training_expiry > _date.today())
)
```
- 등록/수정 시점에만 계산됨
- 면허가 내일 만료되면 오늘 is_qualified=True → 내일도 여전히 True
- **권장:** 일일 배치 또는 배정 시점에 재계산

---

### N3. LocationAccessLog — REST API 미기록 — 심각도: MEDIUM

**위치:** `backend/app/modules/vehicle_telemetry/router.py:149-155`

```python
@router.get("/vehicles/{vehicle_id}/location")
async def get_vehicle_location(vehicle_id, current_user = ...):
    return await service.get_latest_gps(redis_client, vehicle_id)
```
- WebSocket 연결 시에는 `log_location_access()` 호출
- REST API(`GET /vehicles/{id}/location`)에서는 **기록 없음**
- 또한 REST API에서는 `check_vehicle_access()` 인가 확인도 없음 — **V6의 REST 버전이 여전히 미수정**

**판정: REST API 위치 조회에 인가 + 접근 기록 모두 누락 — HIGH**

---

### N4. dev_login_secret 프로덕션 밸리데이터 미포함 — 심각도: LOW

**위치:** `backend/app/config.py:55,82-110`

- `dev_login_secret`의 기본값 `"change-me-dev"`는 프로덕션 밸리데이터 `_check_production_secrets`에 포함되지 않음
- 프로덕션에서는 `environment != "development"`이므로 dev-login 자체가 차단되어 실질적 리스크 낮음
- 그러나 만약 환경변수 설정 실수로 `environment=development`로 프로덕션이 실행되면 위험

---

### N5. consent_scope 기본값에 필수항목 True 설정 — 심각도: LOW

**위치:** `backend/app/modules/compliance/schemas.py:22-31`

```python
consent_scope: dict = Field(
    default_factory=lambda: {
        "service_terms": True,
        "privacy_policy": True,
        "child_info_collection": True,
        ...
    },
)
```
- 필수 동의 항목의 기본값이 `True` — 클라이언트가 consent_scope를 전혀 전송하지 않아도 동의한 것으로 처리됨
- 서버에서 검증은 하지만, 기본값이 이미 True이므로 검증을 통과함
- **권장:** 기본값 제거, 클라이언트가 명시적으로 모든 항목을 전송하도록 강제

---

## 4. 종합 평가

### 해결된 CRITICAL 이슈 (6건)

| 원본 ID | 이슈 | 판정 |
|---------|------|------|
| V1 | OTP 브루트포스 | **RESOLVED** |
| V3 | dev-login OTP 우회 | **MOSTLY RESOLVED** |
| V4 | IDOR — 학생 정보 | **RESOLVED** |
| V5 | IDOR — 동의 정보 | **RESOLVED** |
| V6 | WebSocket 인가 부재 | **RESOLVED** (WebSocket만, REST 미수정) |
| R-01 | 운전자 자격 검증 | **MOSTLY RESOLVED** |
| R-02 | 차량 기준 필드 | **MOSTLY RESOLVED** |
| P-01 | 아동 동의 프로세스 | **IMPROVED** |
| P-02 | 위치정보법 대응 | **MOSTLY RESOLVED** |
| P-10/A14 | 동의 철회 시 GPS 삭제 | **RESOLVED** |

### 미해결 HIGH 이슈 (잔존 8건)

| 우선순위 | ID | 이슈 | 이전 심각도 | 현재 상태 |
|---------|-----|------|-----------|----------|
| 1 | V7 | GPS 스푸핑 (기사가 아무 차량 위치 변경) | HIGH | **미해결 — 아동 안전 직결** |
| 2 | V8 | 탑승/하차 조작 (기사가 아무 스케줄 조작) | HIGH | **미해결 — 아동 안전 직결** |
| 3 | V9 | Toss 웹훅 인증 미구현 | HIGH | **미해결** |
| 4 | N3 | REST API 위치 조회 인가+기록 누락 | HIGH(신규) | **신규 발견** |
| 5 | P-03 | 개인정보 평문 저장 (phone, email 등) | HIGH | **부분 해결** |
| 6 | R-05 | 동승보호자 강제 배치 (세림이법) | HIGH | **미해결** |
| 7 | P-05 | 데이터 파기 스케줄러 미연결 | HIGH | **부분 해결** |
| 8 | R-03 | 사고 시 책임 소재 명확화 | HIGH | **미해결** |

### 프로덕션 배포 전 필수 수정 항목 (최소 4건)

1. **V7**: GPS 업데이트 시 `current_user`의 차량 배정 확인 (1시간 이내 수정 가능)
2. **V8**: mark_boarded/mark_alighted에 기사-스케줄 관계 검증 (1시간 이내)
3. **V9**: Toss 웹훅 서명 검증 (2시간 이내)
4. **N3**: REST API 위치 조회에 `check_vehicle_access` + `log_location_access` 추가 (30분 이내)

### 규제 샌드박스 심사 전 필수 수정 항목 (추가 3건)

5. **P-03**: User.phone, Student.name 등 핵심 개인정보 필드 암호화 적용
6. **R-05**: 동승보호자 배치 강제 검증 (세림이법 핵심)
7. **P-05**: GPS/위치접근로그 purge 스케줄러 실제 연결 (cron 또는 APScheduler)

---

### 전반적 보안 성숙도 변화

| 영역 | 이전 (03-21) | 현재 (03-22) | 변화 |
|------|-------------|-------------|------|
| 인증 (OTP) | CRITICAL 취약 | 양호 | +++ |
| 인가 (IDOR) | HIGH 취약 | 양호 (WebSocket) / 취약 (REST 위치, GPS, 탑승) | ++ |
| 데이터 보호 | HIGH 취약 | 부분 개선 (면허번호만 암호화) | + |
| 법규 대응 | CRITICAL 부재 | 핵심 모델 완비, 비즈니스 로직 부분 구현 | ++ |
| 위치정보법 | CRITICAL 부재 | 핵심 구조 완비 | +++ |
| 결제 보안 | HIGH 취약 | 여전히 취약 | 0 |

**전체 판정: P0 CRITICAL 이슈의 약 60%가 해결됨. 나머지 HIGH 이슈 8건 중 4건(V7, V8, V9, N3)은 코드 수정이 간단하므로 즉시 수정 권장.**

---

*리뷰 종료 — P16 (실무관), P17 (개인정보 변호사), P19 (해커)*
