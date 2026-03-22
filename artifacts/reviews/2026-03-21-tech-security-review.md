# 기술/보안 전문가 리뷰: 세이프웨이키즈

**리뷰 일자:** 2026-03-21
**리뷰어:** P18 (엣지 컴퓨팅 하드웨어 엔지니어), P19 (보안 취약점 공격자)
**대상:** 전체 코드베이스 및 SRS 비기능 요구사항

---

## P18. 엣지 컴퓨팅 하드웨어 엔지니어 리뷰

### 1. 엣지 게이트웨이 모듈 현황

**현재 상태:** `backend/app/modules/edge_gateway/__init__.py`에 `# Stub — Edge AI integration in M6`라는 한 줄 주석만 존재. 엣지 AI 통합은 전혀 구현되지 않았다.

**심각도: HIGH**

SRS 5.1절의 "클라우드-엣지 컴퓨팅 하이브리드 아키텍처"는 이 플랫폼의 핵심 기술 차별화 요소인데, 코드 수준에서는 완전히 비어 있다. 이는 하드웨어 조달과 펌웨어 개발이 동반되어야 하므로 소프트웨어만으로 해결할 수 없는 영역이지만, 최소한 엣지-클라우드 간 통신 프로토콜, 이벤트 스키마, 폴백 로직의 서버사이드 스텁은 선제적으로 설계되어야 한다.

---

### 2. Jetson Nano 4GB + YOLOv8 추론 성능 분석

**심각도: HIGH — SRS 목표 미달성 위험**

| 항목 | SRS 목표 | 현실적 예상 | 차이 |
|------|----------|------------|------|
| 추론 지연시간 | 200ms 이하 | 150~400ms (YOLOv8n FP16) | 조건부 달성 |
| 안면인식 성공률 | 95% 이상 (마스크/모자 포함) | 70~85% (마스크+모자) | 미달 |

**구체적 리스크:**

**(a) 열환경 성능 저하**
- 한여름 직사광선 아래 차량 내부 온도: 60~80도C
- Jetson Nano 공식 동작 온도 범위: -25도C ~ 80도C (접합부 온도 기준)
- 실질적 문제: 50도C 이상에서 GPU 열 스로틀링(thermal throttling) 발동 → 추론 속도 30~50% 저하
- 200ms 목표가 300~400ms로 지연되면 실시간 이상행동 감지 보장 불가
- **권장 대응:** 차량용 방열 하우징 설계 필수, 히트파이프 또는 팬리스 알루미늄 방열판 적용. 또는 Jetson Orin Nano로 상향 (TDP 동일 15W, 추론 성능 8배)

**(b) 한겨울 저온 동작**
- -20도C 이하에서 LCD 디스플레이(스마트 미러) 응답 지연, 배터리(내장 UPS) 용량 급감
- Jetson 자체는 -25도C까지 동작하나, 주변 센서/카메라 모듈의 결로(condensation)로 인한 고장 위험
- **권장 대응:** 저온 시동 전 예열 루틴, 결로 방지용 밀봉 등급(IP67) 하우징

**(c) YOLOv8 모델 선택 트레이드오프**
- YOLOv8n (nano): Jetson Nano에서 FP16 추론 ~150ms → 200ms 이하 달성 가능하지만 정확도 낮음
- YOLOv8s (small): 정확도 높지만 ~350ms → 200ms 목표 초과
- **결론:** YOLOv8n + TensorRT 최적화를 기본으로, 커스텀 학습 데이터로 어린이 특화 모델 파인튜닝 필수

---

### 3. 안면인식 95% 달성 가능성

**심각도: HIGH — SRS 핵심 요구사항 미달 위험**

SRS 6.2절은 "마스크나 모자 착용 시에도 95% 이상 인식률"을 요구한다.

**현실적 분석:**

| 조건 | FaceNet 기대 인식률 | 비고 |
|------|-------------------|------|
| 정면, 마스크 미착용 | 99%+ | 문제없음 |
| 마스크 착용 | 85~92% | 눈+이마 영역만으로 매칭 |
| 모자 착용 | 90~95% | 헤어라인 가림 영향 |
| 마스크+모자 동시 | 70~80% | 사실상 눈 주변만 남음 |
| 6개월 후 성장한 어린이 | -5~10%p 하락 | 얼굴 비율 변화 |

- **핵심 문제:** 어린이는 성인보다 얼굴 변화 속도가 빠름. 6개월~1년 간격으로 등록 사진 갱신이 필수
- **Anti-spoofing:** SRS에서 명시하고 있으나, 코드에는 구현 없음. 3D structured light 또는 IR 기반 liveness detection 없이는 사진 한 장으로 우회 가능
- **권장 대응:**
  - 주기적 얼굴 재등록 프로세스 (학기 시작 시)
  - NFC 카드 + 얼굴인식 이중 인증으로 단일 실패 보완
  - IR 카메라 추가로 liveness detection 구현
  - 인식 실패 시 기사/안전요원의 수동 확인 플로우 필수

---

### 4. 네트워크 음영 지역 동작

**심각도: MEDIUM**

**현재 코드의 GPS 흐름:**
- `vehicle_telemetry/service.py`: GPS 데이터를 Redis에 저장 → Redis Pub/Sub → WebSocket으로 학부모에게 전달
- 네트워크 단절 시 GPS 업데이트 자체가 서버에 도달 불가

**리스크 시나리오:**
1. 터널 진입 → GPS 업데이트 중단 → 학부모 앱에서 차량 위치 멈춤 → 불안 유발
2. 산간 지역 운행 → 5~10분간 위치 추적 불가 → 사고 발생 시 마지막 위치만 파악 가능
3. 지하 주차장 하차 → GPS 신호 없음 → 승하차 위치 기록 부정확

**현재 코드에서 GPS 데이터 TTL:**
```python
gps_data_ttl_seconds: int = 300  # 5분
```
5분간 업데이트 없으면 위치 데이터 만료 → 학부모는 "위치 정보 없음" 상태

**권장 대응:**
- 엣지 디바이스에 로컬 GPS 버퍼링: 네트워크 복구 시 일괄 전송
- 학부모 앱에 "마지막 위치 갱신: N분 전" 표시 + "터널/음영지역 통과 중" 상태 안내
- 차량 내 DSRC(Dedicated Short Range Communication) 또는 LTE 모듈 이중화

---

### 5. VRP-TW 배차 엔진 오프라인 시 대안

**심각도: MEDIUM**

현재 `routing_engine/service.py`의 `generate_route_plan`은 서버사이드에서만 실행된다. 실시간 경로 재탐색은 네트워크 의존적이다.

**리스크:** 운행 중 네트워크 단절 시 경로 재탐색 불가. 스케줄 취소, 교통 체증 반영 불가.

**권장 대응:**
- 당일 경로 데이터를 기사 앱에 오프라인 캐시
- 단순 경유지 스킵(취소된 학생 건너뛰기)은 로컬에서 처리
- 네트워크 복구 시 서버와 동기화

---

### 6. 카메라 렌즈 오염/고장 폴백

**심각도: MEDIUM**

엣지 AI 비전 시스템의 물리적 실패 시나리오:
- 렌즈 오염(먼지, 김서림, 어린이 손가락 자국)
- 카메라 모듈 고장(커넥터 분리, 센서 불량)
- 조명 부족(야간, 터널)

**현재 코드:** 폴백 메커니즘 없음 (edge_gateway 스텁 상태)

**권장 대응:**
- 주기적 렌즈 상태 셀프 테스트 (known pattern 검출)
- 영상 품질 저하 감지 시 기사 앱에 "카메라 점검" 알림
- 카메라 비가용 시 수동 승하차 확인 모드 자동 전환

---

### 7. 전원 관리

**심각도: LOW (설계 단계)**

- 차량 시동 OFF 시 엣지 디바이스 동작 시나리오:
  - **필수:** 시동 OFF 후에도 잔류 인원 감지를 위해 일정 시간(최소 5분) 동작 유지
  - UPS(무정전전원장치) 또는 슈퍼캐패시터 필요
  - Jetson Nano 소비전력 ~10W → 5분 동작에 ~50Wh 소형 배터리

**권장 대응:**
- ACC OFF 이벤트 → 잔류 인원 스캔 시작 → 전원 유지 타이머 설정
- 잔류 인원 감지 시 경보 발송 후에도 전원 유지 연장
- 차량 배터리 방전 방지를 위한 전압 모니터링

---

### P18 종합 평가

| SRS 요구사항 | 달성 가능성 | 필요 조건 |
|-------------|-----------|----------|
| 엣지 AI 추론 200ms | 조건부 가능 | Jetson Orin Nano + TensorRT + 방열 하우징 |
| 안면인식 95% (마스크/모자) | 어려움 | IR liveness + NFC 이중인증 + 주기적 재등록 |
| 잔류 인원 감지 | 가능 | 적외선 카메라 추가 + UPS 전원 |
| 네트워크 음영 대응 | 미구현 | 엣지 로컬 버퍼링 + LTE 이중화 |
| 배차 최적화 30초 이하 | 가능 | 현재 서버사이드 구현 존재 |

**핵심 메시지:** 소프트웨어 플랫폼은 잘 구축되어 있으나, SRS의 핵심 차별화 요소인 엣지 AI 계층은 하드웨어 조달 없이는 진행 불가. 하드웨어 선정 및 프로토타이핑에 최소 3~6개월 소요 예상.

---

## P19. 악의적 해커 (보안 취약점 공격자) 리뷰

### 공격 대상: 아이들의 실시간 위치 정보

이 플랫폼이 다루는 데이터의 민감도는 일반 앱과 차원이 다르다. 14세 미만 아동의 실시간 GPS 좌표, 집 주소(픽업 위치), 등하원 시간 패턴, 얼굴 사진 — 이 정보가 유출되면 납치, 스토킹 등 물리적 범죄에 악용될 수 있다.

---

### 발견 취약점 목록

#### V1. OTP 브루트포스 공격 — 심각도: CRITICAL

**위치:** `backend/app/modules/auth/service.py:80-82`, `router.py:49-65`

**현재 코드:**
```python
def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"
```

**취약점 1: `random` 모듈 사용**
- `random`은 Mersenne Twister PRNG으로, 암호학적으로 안전하지 않음
- 624개의 연속 출력값을 관찰하면 내부 상태를 복원하여 다음 OTP 예측 가능
- 아동 안전 시스템에서 예측 가능한 인증코드는 심각한 위험

**취약점 2: OTP 재시도 제한 없음**
- OTP는 6자리 숫자(100000~999999, 90만 가지)
- TTL 3분(180초) 내에 브루트포스 시도 가능
- Rate limit: `100/minute` → 3분간 300회 시도 가능
- 90만 / 300 = 3,000분(50시간) — 단순 계산으로는 어려워 보이지만...
- 동일 전화번호에 대한 OTP 검증 시도 횟수 제한이 **없음**
- Rate limit은 IP 기반(`get_remote_address`)이므로 프록시/VPN 로테이션으로 우회 가능
- 실질적으로 여러 IP에서 병렬 요청하면 3분 내 수천~수만 건 시도 가능

**공격 시나리오:**
1. 타겟 학부모 전화번호 파악 (학원 연락처 등에서)
2. `/api/v1/auth/otp/send`로 OTP 발송 트리거
3. 다수 IP에서 `/api/v1/auth/otp/verify`에 6자리 숫자 브루트포스
4. 성공 시 해당 학부모 계정으로 로그인 → 자녀 실시간 위치 조회

**권장 대응:**
- `random` → `secrets.randbelow()` 또는 `secrets.token_hex()` 사용
- 동일 전화번호에 대한 OTP 검증 실패 횟수 제한 (5회 실패 → OTP 무효화 + 30분 잠금)
- OTP 검증 시도마다 Redis에 실패 카운터 증가

---

#### V2. JWT Secret Key 하드코딩 — 심각도: CRITICAL

**위치:** `backend/app/config.py:14`

```python
jwt_secret_key: str = "change-me-in-production"
```

**현재 방어:**
```python
if self.environment == "production":
    if self.jwt_secret_key == "change-me-in-production":
        raise ValueError(...)
```

**취약점:**
- 프로덕션 밸리데이터는 존재하지만, **개발/스테이징 환경에서는 이 기본값이 그대로 사용됨**
- 개발 환경의 JWT를 사용하여 스테이징 서버에 접근 가능한 경우, 토큰 위조 가능
- Git 히스토리에 이 기본값이 영구 기록됨 — 향후 `.env` 설정 실수 시 위험
- **알고리즘:** HS256은 대칭키 알고리즘 → secret 유출 시 누구나 임의 사용자/역할의 토큰 발급 가능

**공격 시나리오:**
1. 소스코드 접근 (오픈소스 또는 내부자) → `change-me-in-production` 확보
2. `.env` 미설정 상태의 서버 발견
3. `jwt.encode({"sub": "admin-uuid", "role": "platform_admin", "type": "access"}, "change-me-in-production", algorithm="HS256")`
4. 전체 시스템 관리자 권한 획득 → 모든 학생/학부모/차량 데이터 접근

**권장 대응:**
- HS256 → RS256(비대칭키) 마이그레이션 고려
- 기본값을 빈 문자열로 변경하고, 모든 환경에서 환경변수 필수화
- JWT 토큰에 `jti` (JWT ID) 추가 → Redis 블랙리스트로 즉시 무효화 가능

---

#### V3. dev-login 엔드포인트 — OTP 우회 — 심각도: CRITICAL

**위치:** `backend/app/modules/auth/router.py:102-118`

```python
@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(...):
    if _settings.environment == "production":
        raise UnauthorizedError(detail="Not available in production")
    user, _is_new = await service.otp_login_or_register(
        db, body.phone, body.name, body.role
    )
    return service.create_token_response(user)
```

**취약점:**
- `environment` 환경변수가 `production`이 아닌 모든 환경에서 활성화
- `staging`, `test`, `development` 등에서 OTP 없이 **임의 전화번호 + 임의 역할로 계정 생성/로그인 가능**
- 공격자가 `body.role = "platform_admin"`으로 요청하면 플랫폼 관리자 계정 즉시 생성

**공격 시나리오:**
1. 스테이징/개발 서버 URL 발견 (DNS 스캔, GitHub 설정 파일 등)
2. `POST /api/v1/auth/dev-login` + `{"phone": "01012345678", "name": "attacker", "role": "platform_admin", "code": "000000"}`
3. OTP 검증 없이 platform_admin 토큰 발급
4. 모든 관리자 API 접근 가능

**권장 대응:**
- `dev-login` 엔드포인트를 코드에서 제거하거나, 별도 환경변수 `ENABLE_DEV_LOGIN=true`로 명시적 활성화
- 역할(role) 파라미터를 body에서 받지 않고 기본값으로 제한
- 프로덕션 배포 시 이 라우트가 등록되지 않도록 조건부 라우트 등록

---

#### V4. IDOR (Insecure Direct Object Reference) — 학생 정보 접근 — 심각도: HIGH

**위치:** `backend/app/modules/student_management/router.py:111-119`

```python
@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PARENT)),
):
    student = await service.get_student(db, student_id)
    return StudentResponse.model_validate(student)
```

**취약점:**
- `get_student` 서비스 함수는 `student_id`로만 조회하고, 요청자가 해당 학생의 보호자인지 확인하지 않음
- 인증된 학부모 A가 학부모 B의 자녀 `student_id`를 알면 해당 학생 정보 조회 가능
- UUID는 추측 어렵지만, API 응답에서 다른 학생의 ID가 노출될 수 있음 (스케줄, 노선 정보 등)

**현재 방어 상태:**
- `update_student`: guardian_id 확인 있음 (PARENT 역할일 때)
- `deactivate_student`: guardian_id 확인 있음
- **`get_student`: guardian_id 확인 없음** ← 취약

**공격 시나리오:**
1. 학부모 A로 로그인
2. `/api/v1/students/{다른_학생_UUID}` GET 요청
3. 다른 가정의 자녀 이름, 생년월일, 학년 정보 조회 성공

**권장 대응:**
- `get_student`에 `current_user` 소유권 확인 추가
- PARENT 역할: `student.guardian_id == current_user.id` 검증 필수

---

#### V5. IDOR — 동의(Consent) 정보 접근 — 심각도: HIGH

**위치:** `backend/app/modules/compliance/router.py:58-66`

```python
@router.get("/consents/{consent_id}", response_model=ConsentResponse)
async def get_consent(
    consent_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    consent = await service.get_consent(db, consent_id)
    return ConsentResponse.model_validate(consent)
```

**취약점:**
- `get_current_user`만 사용 (역할 확인 없음, 소유권 확인 없음)
- 인증된 사용자라면 누구나 `consent_id`만 알면 다른 사람의 동의 기록 조회 가능
- 동의 기록에는 `guardian_id`, `child_id` 등 민감한 관계 정보 포함

**권장 대응:**
- 본인 동의만 조회하도록 `consent.guardian_id == current_user.id` 검증 추가
- 또는 PLATFORM_ADMIN만 타인의 동의 조회 허용

---

#### V6. WebSocket 차량 위치 스트림 — 인가 부재 — 심각도: HIGH

**위치:** `backend/app/modules/vehicle_telemetry/router.py:181-246`

**현재 보안:**
- JWT 인증: 있음 (first-message auth 또는 query param)
- 인가(authorization): **없음**

**취약점:**
- 인증된 사용자라면 **역할과 관계없이** 임의 차량의 GPS 실시간 스트림 구독 가능
- 학부모 A가 자녀가 탑승하지 않은 차량 B의 위치를 실시간 추적 가능
- 기사, 학원 관리자 등도 자신과 관련 없는 차량 추적 가능

**공격 시나리오:**
1. 학부모 A로 로그인하여 access_token 획득
2. `ws://server/api/v1/telemetry/ws/vehicles/{아무_vehicle_id}`에 연결
3. 토큰 인증 성공 후 해당 차량의 실시간 GPS 좌표 수신
4. 여러 차량 ID를 순회하며 전체 차량 위치 모니터링

**같은 문제가 REST API에도 존재:**
- `GET /api/v1/telemetry/vehicles/{vehicle_id}/location` — `get_current_user`만 확인, 차량과 사용자의 관계 확인 없음

**권장 대응:**
- WebSocket 연결 시 사용자의 자녀가 해당 차량에 탑승 중인지 확인
- PARENT: 오늘 DailyScheduleInstance에서 자녀가 배정된 vehicle_id만 허용
- DRIVER: 자신에게 배정된 vehicle_id만 허용
- PLATFORM_ADMIN: 전체 허용

---

#### V7. GPS 업데이트 스푸핑 — 심각도: HIGH

**위치:** `backend/app/modules/vehicle_telemetry/router.py:139-146`

```python
@router.post("/gps")
async def update_gps(
    body: GpsUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.DRIVER)),
):
    await service.update_gps(redis_client, body)
    return {"message": "위치가 업데이트되었습니다"}
```

**취약점:**
- DRIVER 역할이면 **아무 vehicle_id의 GPS를 업데이트** 가능
- 요청 body의 `vehicle_id`가 해당 기사에게 배정된 차량인지 확인하지 않음
- 악의적 기사가 다른 차량의 위치를 조작 가능

**공격 시나리오:**
1. 기사 계정으로 로그인
2. `POST /api/v1/telemetry/gps` + `{"vehicle_id": "다른_차량_UUID", "latitude": 37.5665, "longitude": 126.9780}`
3. 해당 차량의 위치가 서울시청으로 변경
4. 학부모에게 잘못된 위치 정보 전달 → 안전 위협

**권장 대응:**
- 기사의 `VehicleAssignment`를 확인하여 배정된 차량만 GPS 업데이트 허용
- 비정상 좌표 변화 감지 (이전 위치 대비 물리적으로 불가능한 이동 거리)

---

#### V8. 탑승/하차 처리 — 아무 기사가 아무 스케줄 조작 가능 — 심각도: HIGH

**위치:** `backend/app/modules/scheduling/router.py:110-129`, `service.py:166-183`

```python
async def mark_boarded(db: AsyncSession, instance_id: uuid.UUID) -> DailyScheduleInstance:
    stmt = select(DailyScheduleInstance).where(DailyScheduleInstance.id == instance_id)
    # ... instance_id만으로 조회, 기사/차량 배정 확인 없음
```

**취약점:**
- DRIVER/SAFETY_ESCORT 역할이면 **아무 instance_id에 대해** 탑승/하차 처리 가능
- 자신에게 배정되지 않은 학생의 탑승/하차를 조작 가능
- 학부모에게 허위 "탑승 완료" 알림 전송

**권장 대응:**
- `instance.vehicle_id`가 해당 기사에게 배정된 차량인지 확인
- 또는 `DailyScheduleInstance`에서 기사 배정 정보 교차 검증

---

#### V9. Toss Payments 웹훅 인증 미구현 — 심각도: HIGH

**위치:** `backend/app/modules/billing/router.py:255-265`

```python
@router.post("/webhook")
async def toss_webhook(
    payload: TossWebhookPayload,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await service.handle_toss_webhook(db, payload.event_type, payload.data)
```

**취약점:**
- 웹훅 엔드포인트에 **인증/서명 검증이 전혀 없음**
- Toss Payments는 웹훅 요청에 서명 헤더(`TossPayments-Signature`)를 포함하지만, 검증하지 않음
- 누구나 이 엔드포인트에 가짜 결제 완료 이벤트를 전송 가능

**공격 시나리오:**
1. `POST /api/v1/billing/webhook` + `{"event_type": "PAYMENT_STATUS_CHANGED", "data": {"paymentKey": "pk_xxx", "status": "DONE"}}`
2. 실제 결제 없이 청구서 상태가 "paid"로 변경
3. 무료로 서비스 이용

**권장 대응:**
- Toss Payments 웹훅 서명 검증 구현
- 웹훅 소스 IP 화이트리스트
- 웹훅 수신 후 Toss API로 결제 상태 재확인(double-check)

---

#### V10. SQL Injection 가능성 — 심각도: LOW (현재 안전)

**위치:** `backend/app/modules/auth/service.py:177`

```python
base = base.where(User.name.ilike(f"%{search}%"))
```

**분석:**
- SQLAlchemy ORM의 `ilike`는 내부적으로 파라미터화된 쿼리를 생성하므로 SQL injection은 방어됨
- Raw SQL 사용 없음 — 전체 코드베이스에서 `text()` 사용은 `SELECT 1` (헬스체크)뿐
- **결론: SQL Injection 위험 없음** (SQLAlchemy가 방어)

---

#### V11. XSS 가능성 — 심각도: LOW

- 백엔드는 JSON API만 제공 (HTML 렌더링 없음)
- FastAPI의 JSON 응답은 자동 이스케이핑
- 프론트엔드(React/React Native)는 기본적으로 XSS 방어
- **결론: XSS 위험 매우 낮음**, 단 관리자 대시보드에서 사용자 입력을 `dangerouslySetInnerHTML`로 렌더링하지 않는지 확인 필요

---

#### V12. 모바일 앱 디컴파일 — API 키 추출 — 심각도: MEDIUM

**위치:** `mobile/src/api/client.ts`

**현재 상태:**
- API base URL은 `expo-constants`에서 읽음 (하드코딩 아님) — 양호
- 카카오 맵 API 키도 `expoConfig.extra`에서 읽음 — 양호
- 토큰 저장: 네이티브에서는 `expo-secure-store` 사용 — 양호
- 웹에서는 `localStorage` 사용 — **XSS 시 토큰 탈취 가능** (웹 버전이 존재한다면)

**리스크:**
- React Native 앱은 JavaScript 번들이므로 디컴파일 용이
- 하지만 민감 키(JWT secret, DB 비밀번호 등)는 서버에만 존재하므로 직접적인 비밀 유출 없음
- API 엔드포인트 구조가 노출되므로 위의 IDOR/인가 우회 공격에 활용 가능

**권장 대응:**
- Certificate pinning 구현 (MITM 방지)
- 프로덕션 빌드에서 debug 로그 제거
- API 응답에서 불필요한 에러 세부 정보 숨김

---

#### V13. Rate Limiting 우회 — 심각도: MEDIUM

**위치:** `backend/app/rate_limit.py`

```python
limiter = Limiter(key_func=get_remote_address)
```

**취약점:**
- IP 기반 레이트 리밋만 적용
- 프록시/로드밸런서 뒤에서 `X-Forwarded-For` 헤더가 올바르게 설정되지 않으면 모든 요청이 동일 IP로 인식 → 정상 사용자도 제한
- 반대로 `X-Forwarded-For` 스푸핑으로 레이트 리밋 우회 가능
- 인증 관련 엔드포인트만 레이트 리밋 적용 — GPS, 학생, 스케줄 등 핵심 API에는 미적용

**권장 대응:**
- `X-Forwarded-For` 신뢰 가능한 프록시에서만 수용 (trusted proxies 설정)
- 사용자 ID 기반 레이트 리밋 추가 (인증된 요청)
- 전체 API에 기본 레이트 리밋 적용

---

#### V14. 관리자 권한 상승 — 심각도: MEDIUM

**위치:** `backend/app/modules/auth/router.py:159-190`

```python
@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    ...,
    body: UserUpdateRequest,
    current_user: User = Depends(require_platform_admin),
):
    user = await service.update_user(db, user_id, name=body.name, role=body.role, ...)
```

**현재 방어:** `require_platform_admin`으로 플랫폼 관리자만 역할 변경 가능 — 양호

**잠재적 리스크:**
- 플랫폼 관리자 계정이 탈취되면 (`dev-login` V3 참조) 임의 사용자를 `platform_admin`으로 승격 가능
- Self-escalation 방어 없음: 관리자가 자기 자신의 역할을 변경하는 것은 차단되지 않음

**권장 대응:**
- 역할 변경 시 2FA(이중 인증) 요구
- 역할 변경 이력 감사 로그 강화 (현재 audit log 존재 — 양호)
- 최초 platform_admin 계정은 환경변수로만 생성 가능하도록 제한

---

#### V15. Refresh Token 무효화 불가 — 심각도: MEDIUM

**위치:** `backend/app/modules/auth/service.py:141-150`

**취약점:**
- Refresh token이 Redis나 DB에 저장되지 않음 (stateless JWT)
- 토큰 탈취 시 만료(7일)까지 무효화 불가
- 사용자 비밀번호 변경, 계정 비활성화 후에도 기존 refresh token 유효

**공격 시나리오:**
1. 사용자 refresh token 탈취 (MITM, 디바이스 분실 등)
2. 7일간 지속적으로 새 access token 발급
3. 학부모가 계정 이상 감지 후 비밀번호 변경해도 기존 토큰 여전히 유효

**참고:** access token에서 `is_active` 확인은 매 요청마다 DB에서 수행 (`middleware/auth.py:31`) — 계정 비활성화 시 access token은 무효화됨. 하지만 refresh token으로 새 access token을 발급받을 수 있음 (refresh 시 `is_active` 확인 있음 — `router.py:86-91`). 실질적으로 계정 비활성화 후에는 refresh도 차단됨. **다만 삭제(soft delete)가 아닌 단순 비활성화의 경우, 재활성화 시 탈취된 토큰이 다시 유효해짐.**

**권장 대응:**
- Refresh token을 Redis에 저장 → 로그아웃/보안 이벤트 시 즉시 무효화
- 토큰 로테이션: refresh 시 기존 refresh token 무효화

---

### P19 취약점 요약 매트릭스

| ID | 취약점 | 심각도 | 현재 방어 | 공격 난이도 |
|----|--------|--------|----------|-----------|
| V1 | OTP 브루트포스 | CRITICAL | Rate limit만 (IP 기반) | 낮음 |
| V2 | JWT Secret 하드코딩 | CRITICAL | 프로덕션 밸리데이션 | 중간 |
| V3 | dev-login OTP 우회 | CRITICAL | environment 체크 | 낮음 |
| V4 | IDOR — 학생 정보 | HIGH | 없음 | 낮음 |
| V5 | IDOR — 동의 정보 | HIGH | 없음 | 낮음 |
| V6 | WebSocket 인가 부재 | HIGH | JWT 인증만 | 낮음 |
| V7 | GPS 스푸핑 | HIGH | DRIVER 역할만 확인 | 중간 |
| V8 | 탑승/하차 조작 | HIGH | DRIVER 역할만 확인 | 중간 |
| V9 | 웹훅 인증 미구현 | HIGH | 없음 | 매우 낮음 |
| V10 | SQL Injection | LOW | SQLAlchemy ORM | 해당없음 |
| V11 | XSS | LOW | React + JSON API | 해당없음 |
| V12 | 앱 디컴파일 | MEDIUM | SecureStore 사용 | 중간 |
| V13 | Rate Limit 우회 | MEDIUM | IP 기반 제한 | 낮음 |
| V14 | 권한 상승 | MEDIUM | RBAC 적용 | 중간 |
| V15 | Refresh Token 무효화 불가 | MEDIUM | Stateless JWT | 중간 |

---

### P19 핵심 결론

**즉시 조치가 필요한 항목 (프로덕션 배포 전 필수):**

1. **V1**: OTP에 `secrets` 모듈 사용 + 전화번호별 검증 실패 카운터
2. **V3**: `dev-login` 엔드포인트 프로덕션 빌드에서 완전 제거 또는 환경변수 게이트
3. **V4, V5**: IDOR 수정 — `get_student`, `get_consent`에 소유권 확인 추가
4. **V6**: WebSocket에 차량-사용자 관계 인가 추가
5. **V9**: Toss 웹훅 서명 검증 구현

**프로덕션 이전 권장 사항:**

6. **V7, V8**: GPS 업데이트 및 탑승/하차 처리에 차량 배정 확인
7. **V2**: RS256 마이그레이션 또는 JWT secret 강화
8. **V13**: Rate limiting 강화
9. **V15**: Refresh token Redis 저장 + 즉시 무효화

**긍정적 보안 요소:**
- SQLAlchemy ORM 사용으로 SQL Injection 방어 양호
- RBAC(역할 기반 접근 제어) 프레임워크 잘 구축됨
- 감사 로그(audit log) 시스템 존재
- CORS 설정 제한적으로 적용
- 법정대리인 동의(consent) 프로세스 구현 완료
- 소프트 삭제(soft delete) 패턴 일관 적용
- 비밀번호는 bcrypt 해싱 (사용하지 않지만 준비됨)
- 프로덕션 필수 키 밸리데이션 존재

---

*리뷰 종료 — P18 (엣지 컴퓨팅 하드웨어 엔지니어), P19 (보안 취약점 공격자)*
