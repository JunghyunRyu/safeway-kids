# P0 개선 기획서 (출시 차단 항목 전체)

**작성일**: 2026-03-21
**작성자**: 기획 Lead
**입력 자료**: 사용자 피드백 종합 보고서 (P0 14건) + 전문가 리뷰 종합 보고서 (P0 21건)
**기존 참고**: `artifacts/specs/2026-03-21-code-hardening-spec.md` (APPROVED)
**상태**: DRAFT → 운영팀 피드백 반영 후 APPROVED 예정

---

## 개요

사용자 피드백 14건 + 전문가 리뷰 21건 중 중복을 제거하고, 기존 code-hardening-spec에서 이미 커버된 항목을 제외한 **P0 전체 항목**에 대한 구현 기획서.

### 워크스트림 구분

| 워크스트림 | 범위 | 항목 수 |
|-----------|------|---------|
| **A — 안전/보안/법규** | SOS, 잔류확인, 미탑승, 탑승취소, 보호자연락처, OTP강화, IDOR, WS인가, dev-login, 운전자자격, 차량법정필드, 위치정보법, 아동동의 | 14 |
| **B — 플랫폼/UX/비즈니스** | 스케줄템플릿UI, 관제센터개방, 엑셀업로드개방, SafetyAI수정, 네비연동, 학생사진/주소, 기사변경알림, 안전도우미확장, 기사앱확대, devLoginUI제거, 기사/차량정보노출, 앱스토어메타, 사업자정보 | 13 |

### code-hardening-spec과의 관계

기존 code-hardening-spec ITEM-01(OTP Redis), ITEM-02(프로덕션 키 검증), ITEM-03(WS 토큰)은 이미 승인됨.
본 기획서의 보안 항목은 code-hardening에서 **다루지 않은** 추가 취약점을 커버한다.

---

## 워크스트림 A — 안전/보안/법규

---

### ITEM-A01: SOS/긴급 버튼 (전 앱) [CRITICAL]

**현재 문제**
- 학부모/학생/기사/안전도우미 앱 어디에도 SOS/긴급 호출 기능 없음
- 사용자 피드백 4그룹(학부모, 학생, 기사, CS) + 전문가 5그룹이 공통 지적
- 사고 발생 시 앱이 무용지물 — "안전" 브랜드 핵심 가치와 직결

**목표 상태**
- 모든 앱의 모든 화면에서 접근 가능한 SOS 플로팅 버튼
- 탭 시 확인 팝업 → 확인 → 112/119 전화 연결 + 플랫폼 관리자 긴급 알림 + GPS 위치 첨부
- 기사/안전도우미 앱: 추가로 "사고 보고" 기능 (유형 선택 + 메모)

**구현 방안**

1. **백엔드** — 긴급 알림 API 추가
   - `backend/app/modules/notification/router.py`에 `POST /notifications/sos` 엔드포인트 추가
   - Request: `{ latitude: float, longitude: float, sos_type: str, message?: str }`
   - 플랫폼 관리자 전원에게 FCM + SMS 발송 (send_critical_alert_sms 활용)
   - SOS 이벤트 감사 로그 기록
   - 응답에 112/119 전화번호 포함

2. **모바일** — SOS 플로팅 버튼 컴포넌트
   - `mobile/src/components/SOSButton.tsx` 신규 생성
   - 빨간색 원형 FAB, 모든 탭 네비게이터 상위에 배치
   - `mobile/src/navigation/RootNavigator.tsx`에서 로그인 후 화면에 오버레이 렌더링
   - 탭 시 `Alert.alert`로 2단계 확인 ("긴급 상황입니까? SOS 호출 시 관리자에게 즉시 알림됩니다")
   - 확인 시: (1) API 호출 (2) `Linking.openURL('tel:112')` 전화 연결
   - 기사/안전도우미 역할일 때: 추가 "사고 유형" 선택지 (차량사고/학생부상/차량고장/기타)

3. **웹 관제센터** — SOS 수신 패널
   - `web/src/pages/platform/PlatformMapPage.tsx`에 SOS 이벤트 실시간 표시
   - WebSocket으로 SOS 이벤트 수신 → 지도에 빨간 마커 + 사이드바 알림

**변경 파일**
- `backend/app/modules/notification/router.py` (SOS 엔드포인트)
- `backend/app/modules/notification/schemas.py` (SOS 요청/응답 스키마)
- `backend/app/modules/notification/service.py` (SOS 알림 로직)
- `mobile/src/components/SOSButton.tsx` (신규)
- `mobile/src/navigation/RootNavigator.tsx` (SOS 오버레이)
- `web/src/pages/platform/PlatformMapPage.tsx` (SOS 수신 표시)

**수락 기준**
- 모든 역할(학부모/기사/안전도우미/학생)의 모든 화면에서 SOS 버튼 접근 가능
- SOS 탭 → 확인 팝업 → 112 전화 연결 + 관리자 알림 발송 검증
- SOS 이벤트가 감사 로그에 기록
- 관제센터에서 SOS 이벤트 실시간 수신 확인

**Android/iOS/PC 고려사항**: `Linking.openURL('tel:112')`는 iOS/Android 모두 지원. PC 웹에서는 전화 연결 불가이므로 "112에 직접 전화해 주세요" 메시지 표시.
**법률 검토 필요 여부**: 아니오 (112/119 연결은 법적 제한 없음)

---

### ITEM-A02: 기사/안전도우미/차량 정보 학부모 앱 노출 [CRITICAL]

**현재 문제**
- `mobile/src/api/schedules.ts:16-28` — `DailySchedule` 인터페이스에 driver 정보 필드 없음
- `backend/app/modules/scheduling/schemas.py:32-45` — `DailyScheduleResponse`에 기사/차량 정보 없음
- 누가 아이를 태우는지 학부모가 확인 불가
- 사용자 피드백 3그룹 + 전문가 3그룹 공통 지적

**목표 상태**
- 학부모 홈/스케줄 화면에서 배정된 기사 이름, 전화번호(마스킹), 차량번호, 안전도우미 이름 확인 가능
- 기사 사진(있을 경우) 표시

**구현 방안**

1. **백엔드** — DailyScheduleResponse 확장
   - `backend/app/modules/scheduling/schemas.py`의 `DailyScheduleResponse`에 필드 추가:
     ```python
     driver_name: str | None = None
     driver_phone_masked: str | None = None  # 010-****-1234 형식
     vehicle_license_plate: str | None = None
     safety_escort_name: str | None = None
     ```
   - `backend/app/modules/scheduling/service.py`의 `list_daily_schedules`에서 vehicle_id → VehicleAssignment → driver 정보 JOIN 추가
   - 전화번호 마스킹 유틸: `010-1234-5678` → `010-****-5678`

2. **모바일** — 학부모 홈/스케줄 화면 업데이트
   - `mobile/src/api/schedules.ts`의 `DailySchedule` 인터페이스에 필드 추가
   - `mobile/src/screens/parent/HomeScreen.tsx`의 `ScheduleCard`에 기사/차량 정보 행 추가
   - 차량번호 + 기사 이름 표시, 탭 시 상세 정보 모달

**변경 파일**
- `backend/app/modules/scheduling/schemas.py`
- `backend/app/modules/scheduling/service.py`
- `mobile/src/api/schedules.ts`
- `mobile/src/screens/parent/HomeScreen.tsx`
- `mobile/src/screens/parent/ScheduleScreen.tsx`

**수락 기준**
- 학부모 홈 화면 스케줄 카드에 기사 이름, 차량번호 표시
- 전화번호는 마스킹 처리 (`010-****-5678`)
- vehicle_id가 null인 경우 "배정 대기" 표시
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: 해당 없음 (데이터 표시만)
**법률 검토 필요 여부**: 기사 전화번호 마스킹 처리 필수 (개인정보보호법)

---

### ITEM-A03: 차량 내 잔류 학생 확인 절차 [CRITICAL]

**현재 문제**
- 하차 완료 후 "차량 내 학생 없음 확인" 버튼/체크리스트 부재
- 스쿨버스 사고 중 잠든 아이 방치가 가장 심각한 유형
- 세림이법 준수 증빙 불가

**목표 상태**
- 기사/안전도우미 앱에서 모든 학생 하차 후 "차량 점검 완료" 버튼 표시
- 버튼 클릭 시 체크리스트: "좌석 확인 완료" / "트렁크 확인 완료" / "차량 잠금 완료"
- 체크리스트 완료 기록이 서버에 저장 (세림이법 증빙)

**구현 방안**

1. **백엔드** — 잔류 확인 API
   - `backend/app/modules/scheduling/router.py`에 `POST /schedules/daily/vehicle-clear` 추가
   - Request: `{ vehicle_id: UUID, date: date, checklist: { seats_checked: bool, trunk_checked: bool, locked: bool } }`
   - `VehicleClearance` 모델 신규 (vehicle_id, date, driver_id, checklist JSON, completed_at)
   - 미완료 시 해당 차량의 운행 종료 불가

2. **모바일** — 기사 앱 운행 종료 플로우
   - `mobile/src/screens/driver/RouteScreen.tsx`: 모든 스케줄이 completed/cancelled 상태일 때 "운행 종료 → 차량 점검" 버튼 활성화
   - 체크리스트 모달: 3개 항목 체크 → "점검 완료" 제출
   - 안전도우미 앱에도 동일 기능 연동

**변경 파일**
- `backend/app/modules/scheduling/models.py` (VehicleClearance 모델)
- `backend/app/modules/scheduling/router.py` (vehicle-clear 엔드포인트)
- `backend/app/modules/scheduling/service.py` (vehicle-clear 로직)
- `backend/app/modules/scheduling/schemas.py` (VehicleClearanceRequest/Response)
- `mobile/src/screens/driver/RouteScreen.tsx` (운행 종료 플로우)
- `mobile/src/api/schedules.ts` (vehicle-clear API 호출)

**수락 기준**
- 모든 학생 하차 후 차량 점검 체크리스트 표시
- 3개 항목 전부 체크해야 제출 가능
- 서버에 완료 기록 저장 (날짜, 시간, 기사 ID, 체크리스트)
- 관제센터에서 미완료 차량 식별 가능

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 세림이법 준수 증빙 요건 확인 필요

---

### ITEM-A04: 미탑승(no_show) 처리 UI + 자동 알림 [CRITICAL]

**현재 문제**
- `backend/app/modules/scheduling/models.py:78` — `status` 필드에 `no_show` 상태값 정의되어 있음
- 기사 앱(`mobile/src/screens/driver/RouteScreen.tsx:102-123`)에 "탑승"/"하차" 버튼만 있고 "미탑승" 버튼 없음
- 미탑승 시 학부모/학원 자동 알림 없음
- 골든타임 5분 이내 대응 불가

**목표 상태**
- 기사 앱 StopCard에 "미탑승" 버튼 추가 (scheduled 상태일 때 활성)
- 미탑승 처리 시: (1) status → no_show (2) 학부모 FCM+SMS 즉시 알림 (3) 학원 관리자 알림
- 미탑승 사유 선택: "학생 미출현" / "학부모 취소 요청" / "기타"

**구현 방안**

1. **백엔드** — no_show 처리 API
   - `backend/app/modules/scheduling/router.py`에 `POST /schedules/daily/{instance_id}/no-show` 추가
   - Request: `{ reason: str }` (enum: student_absent, parent_cancelled, other)
   - Service: status → "no_show", 학부모 + 학원 관리자 알림 발송
   - `backend/app/modules/notification/service.py`에 `send_no_show_notification` 추가

2. **모바일** — 기사 앱 StopCard 버튼 추가
   - `mobile/src/screens/driver/RouteScreen.tsx`의 StopCard 액션 영역에 "미탑승" 버튼 추가
   - `!isBoarded && !isCancelled` 상태에서: "탑승" 버튼 옆에 "미탑승" 버튼
   - 탭 시 사유 선택 ActionSheet → API 호출

3. **모바일 API** — `mobile/src/api/schedules.ts`에 `markNoShow(instanceId, reason)` 추가

**변경 파일**
- `backend/app/modules/scheduling/router.py`
- `backend/app/modules/scheduling/service.py`
- `backend/app/modules/scheduling/schemas.py` (NoShowRequest)
- `backend/app/modules/notification/service.py` (send_no_show_notification)
- `mobile/src/screens/driver/RouteScreen.tsx`
- `mobile/src/api/schedules.ts`

**수락 기준**
- 기사 앱에서 "미탑승" 버튼으로 상태 변경 가능
- 미탑승 처리 시 학부모에게 즉시 FCM + SMS 알림 발송
- 학원 관리자에게도 알림 발송
- no_show 사유 서버 기록
- 기존 테스트 통과 + no_show 플로우 테스트 추가

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-A05: 탑승/하차 실수 취소 + 확인 팝업 [HIGH]

**현재 문제**
- `mobile/src/screens/driver/RouteScreen.tsx:104-121` — 탑승/하차 버튼 클릭 시 즉시 API 호출, 확인 팝업 없음
- 잘못 눌러도 되돌리기 불가
- 운영 데이터 신뢰성 훼손

**목표 상태**
- 탑승/하차 버튼 클릭 시 확인 팝업 표시 ("김민수 학생 탑승 처리하시겠습니까?")
- 실수 시 "취소" 기능 (탑승 → scheduled로 복원, 하차 → boarded로 복원)
- 취소는 처리 후 5분 이내만 가능

**구현 방안**

1. **백엔드** — 탑승/하차 취소 API
   - `backend/app/modules/scheduling/router.py`에 `POST /schedules/daily/{instance_id}/undo-board`와 `POST /schedules/daily/{instance_id}/undo-alight` 추가
   - 5분 이내 제한: `if (now - boarded_at).total_seconds() > 300: raise ForbiddenError`
   - 감사 로그 기록

2. **모바일** — 확인 팝업 + 되돌리기 UI
   - `RouteScreen.tsx`의 `handleBoard`/`handleAlight`에 `Alert.alert` 확인 팝업 추가
   - 탑승/하차 완료 후 5분간 "되돌리기" 버튼 표시 (5분 타이머)

**변경 파일**
- `backend/app/modules/scheduling/router.py`
- `backend/app/modules/scheduling/service.py`
- `mobile/src/screens/driver/RouteScreen.tsx`
- `mobile/src/api/schedules.ts` (undoBoard, undoAlight 추가)

**수락 기준**
- 탑승/하차 버튼 클릭 시 학생 이름 포함 확인 팝업 표시
- 탑승 취소(5분 이내) → status "scheduled"로 복원
- 하차 취소(5분 이내) → status "boarded"로 복원
- 5분 초과 시 취소 불가 에러 메시지
- 취소 이벤트 감사 로그 기록

**Android/iOS/PC 고려사항**: Alert.alert는 iOS/Android 네이티브 다이얼로그 사용
**법률 검토 필요 여부**: 아니오

---

### ITEM-A06: 보호자 연락처 미전송 버그 수정 [CRITICAL]

**현재 문제**
- `mobile/src/api/schedules.ts` 또는 학생 등록 시 입력한 `guardian_phone`이 API payload에 포함되지 않음
- `backend/app/modules/student_management/schemas.py:7-11` — `StudentCreateRequest`에 `guardian_phone` 필드 없음
- Student 모델(`backend/app/modules/student_management/models.py`)에도 `guardian_phone` 없음
- 보호자 전화번호는 User 테이블의 phone 필드에만 존재하나, 학원 관리자가 학생을 등록할 때 보호자 전화번호를 별도로 입력해야 함

**목표 상태**
- 학원 관리자 엑셀 업로드 및 수동 등록 시 보호자 전화번호 필드 포함
- 등록된 보호자 전화번호로 자동 보호자 계정 매칭 또는 초대 발송

**구현 방안**

1. **백엔드** — 학생 등록 스키마에 guardian_phone 추가
   - `backend/app/modules/student_management/schemas.py`의 `StudentCreateRequest`:
     ```python
     guardian_phone: str | None = Field(default=None, pattern=r"^01[0-9]{8,9}$", description="보호자 전화번호")
     ```
   - `backend/app/modules/student_management/service.py`의 `create_student`: guardian_phone으로 User 조회 → 있으면 guardian_id 자동 설정, 없으면 초대 SMS 발송
   - 엑셀 업로드 템플릿에 `보호자연락처` 열 추가

2. **웹** — 학원 관리자 학생 등록 폼에 보호자 전화번호 필드 추가
   - `web/src/pages/StudentsPage.tsx`의 학생 등록 폼 수정

**변경 파일**
- `backend/app/modules/student_management/schemas.py`
- `backend/app/modules/student_management/service.py`
- `web/src/pages/StudentsPage.tsx`

**수락 기준**
- 학생 등록 시 보호자 전화번호 입력 가능
- 전화번호 패턴 검증 (`^01[0-9]{8,9}$`)
- 기존 보호자(User) 존재 시 자동 매칭
- 엑셀 업로드 시 보호자연락처 열 인식

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-A07: OTP 보안 강화 (secrets 모듈 + 실패 카운터) [CRITICAL]

**현재 문제**
- `backend/app/modules/auth/service.py:82` — `random.randint(100000, 999999)` 사용 (비암호학적 PRNG)
- 전화번호별 OTP 검증 실패 횟수 제한 없음 → 브루트포스 공격 가능
- 전문가 리뷰 P19(화이트햇 해커)가 CRITICAL로 지적
- code-hardening-spec ITEM-01에서 Redis 전환은 다뤘으나 보안 강화는 미커버

**목표 상태**
- `secrets` 모듈 사용 (암호학적 PRNG)
- 전화번호별 OTP 검증 실패 5회 시 15분 잠금
- 잠금 상태에서 OTP 재발송 차단

**구현 방안**

1. **OTP 생성 보안 강화**
   - `backend/app/modules/auth/service.py:82`:
     ```python
     import secrets
     def generate_otp() -> str:
         return f"{secrets.randbelow(900000) + 100000}"
     ```

2. **실패 카운터 + 잠금**
   - Redis 키: `otp_fail:{phone}` (실패 횟수), `otp_lock:{phone}` (잠금 상태)
   - `verify_otp` 수정:
     ```python
     async def verify_otp(phone: str, code: str) -> bool:
         # 잠금 확인
         if await redis_client.exists(f"otp_lock:{phone}"):
             raise UnauthorizedError(detail="인증 시도 횟수 초과. 15분 후 다시 시도해주세요")

         stored = await redis_client.get(f"otp:{phone}")
         if stored and stored == code:
             await redis_client.delete(f"otp:{phone}")
             await redis_client.delete(f"otp_fail:{phone}")
             return True

         # 실패 카운트 증가
         fail_count = await redis_client.incr(f"otp_fail:{phone}")
         await redis_client.expire(f"otp_fail:{phone}", OTP_TTL_SECONDS)
         if fail_count >= 5:
             await redis_client.set(f"otp_lock:{phone}", "1", ex=900)  # 15분
         return False
     ```

3. **send_otp 잠금 체크**
   - `send_otp`에서도 잠금 상태면 발송 거부

**변경 파일**
- `backend/app/modules/auth/service.py`

**수락 기준**
- `random` → `secrets` 모듈 교체
- 5회 연속 실패 시 15분 잠금
- 잠금 중 OTP 발송/검증 모두 거부
- 성공 시 실패 카운터 초기화
- 기존 OTP 테스트 통과 + 보안 테스트 추가

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-A08: IDOR 수정 — 학생/동의 소유권 확인 [CRITICAL]

**현재 문제**
- `backend/app/modules/student_management/router.py:111-119` — `get_student` API에 소유권 확인 없음
  ```python
  @router.get("/{student_id}", response_model=StudentResponse)
  async def get_student(
      student_id: uuid.UUID,
      db: AsyncSession = Depends(get_db),
      current_user: User = Depends(require_roles(UserRole.PARENT)),
  ) -> StudentResponse:
      student = await service.get_student(db, student_id)  # 소유권 미확인!
      return StudentResponse.model_validate(student)
  ```
- `backend/app/modules/compliance/router.py:58-60` — `get_consent`에도 동일 문제
- 인증된 학부모 A가 학부모 B의 자녀/동의 정보 조회 가능

**목표 상태**
- 학부모 역할: 본인 자녀/동의만 조회 가능
- 학원 관리자: 본인 학원 소속 학생만 조회 가능
- 플랫폼 관리자: 전체 조회 가능

**구현 방안**

1. **get_student 소유권 확인**
   - `backend/app/modules/student_management/router.py:111-119` 수정:
     ```python
     @router.get("/{student_id}", response_model=StudentResponse)
     async def get_student(
         student_id: uuid.UUID,
         db: AsyncSession = Depends(get_db),
         current_user: User = Depends(require_roles(
             UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN
         )),
     ) -> StudentResponse:
         student = await service.get_student(db, student_id)
         if current_user.role == UserRole.PARENT and student.guardian_id != current_user.id:
             raise ForbiddenError(detail="본인의 자녀 정보만 조회할 수 있습니다")
         # ACADEMY_ADMIN: 학원 소속 확인 (enrollment 테이블 조회)
         return StudentResponse.model_validate(student)
     ```

2. **get_consent 소유권 확인**
   - `backend/app/modules/compliance/router.py:58-60` 동일 패턴 적용:
     ```python
     consent = await service.get_consent(db, consent_id)
     if current_user.role == UserRole.PARENT and consent.guardian_id != current_user.id:
         raise ForbiddenError(detail="본인의 동의 정보만 조회할 수 있습니다")
     ```

3. **list_enrollments 소유권 확인**
   - `backend/app/modules/student_management/router.py:179-187` — 이미 `current_user.id` 전달하지만, service에서 student.guardian_id 교차 검증 추가

**변경 파일**
- `backend/app/modules/student_management/router.py`
- `backend/app/modules/compliance/router.py`
- `backend/app/modules/student_management/service.py`
- `backend/app/modules/compliance/service.py`

**수락 기준**
- 학부모 A가 학부모 B의 자녀 조회 시 403 Forbidden
- 학부모 A가 학부모 B의 동의 정보 조회 시 403 Forbidden
- 학원 관리자는 소속 학생만 조회 가능
- 플랫폼 관리자는 전체 조회 가능
- IDOR 공격 시나리오 테스트 추가

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 개인정보보호법 접근 통제 요건 충족 확인

---

### ITEM-A09: WebSocket 차량 위치 스트림 인가 [CRITICAL]

**현재 문제**
- `backend/app/modules/vehicle_telemetry/router.py` — WebSocket 연결 시 인증만 확인, 인가 없음
- 아무 인증된 사용자가 아무 차량의 GPS 실시간 추적 가능
- 아동 위치 정보 무단 접근 — 가장 심각한 보안 취약점 중 하나

**목표 상태**
- 학부모: 자녀가 탑승한 차량만 추적 가능
- 기사: 본인 배정 차량만 추적 가능
- 안전도우미: 본인 배정 차량만 추적 가능
- 학원 관리자: 학원 소속 차량만 추적 가능
- 플랫폼 관리자: 전체 차량 추적 가능

**구현 방안**

1. **인가 검증 함수** — `backend/app/modules/vehicle_telemetry/service.py`에 추가:
   ```python
   async def check_vehicle_access(db: AsyncSession, user: User, vehicle_id: UUID) -> bool:
       if user.role == UserRole.PLATFORM_ADMIN:
           return True
       if user.role == UserRole.DRIVER:
           # 오늘 배정된 차량인지 확인
           return await _is_driver_assigned(db, user.id, vehicle_id)
       if user.role == UserRole.SAFETY_ESCORT:
           return await _is_escort_assigned(db, user.id, vehicle_id)
       if user.role == UserRole.PARENT:
           # 오늘 자녀 스케줄에 배정된 차량인지 확인
           return await _is_parent_child_on_vehicle(db, user.id, vehicle_id)
       if user.role == UserRole.ACADEMY_ADMIN:
           return await _is_academy_vehicle(db, user.id, vehicle_id)
       return False
   ```

2. **WebSocket 핸들러 수정** — 인증 후 `check_vehicle_access` 호출, 실패 시 4003 close

3. **GPS 업데이트 인가** — `POST /vehicles/{vehicle_id}/gps` 엔드포인트에서도 driver_id-vehicle_id 관계 확인

**변경 파일**
- `backend/app/modules/vehicle_telemetry/service.py`
- `backend/app/modules/vehicle_telemetry/router.py`

**수락 기준**
- 학부모가 자녀 미탑승 차량 추적 시 4003 연결 거부
- 기사가 타인 차량 추적 시 4003 연결 거부
- GPS 업데이트 시 본인 배정 차량만 가능
- 플랫폼 관리자는 모든 차량 추적 가능
- 인가 실패 시 감사 로그 기록

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 위치정보보호법 접근 통제 요건 충족 확인

---

### ITEM-A10: dev-login 엔드포인트 보안 강화 [CRITICAL]

**현재 문제**
- `backend/app/modules/auth/router.py:102-118` — `environment != "production"`이면 OTP 없이 임의 역할 계정 생성 가능
- staging, development 환경에서 platform_admin 역할 즉시 생성 가능
- `mobile/src/screens/LoginScreen.tsx:46` — devLogin 함수 직접 호출

**목표 상태**
- dev-login은 `environment == "development"` 일 때만 동작 (staging 포함 차단)
- 생성 가능 역할 제한: platform_admin 생성 불가
- 요청에 dev-secret 헤더 필수
- 모바일 앱 프로덕션 빌드에서 devLogin UI 완전 제거 (ITEM-B10에서 다룸)

**구현 방안**

1. **백엔드** — `backend/app/modules/auth/router.py:102-118` 수정:
   ```python
   @router.post("/dev-login", response_model=TokenResponse)
   async def dev_login(
       request: Request,
       body: OtpVerifyRequest,
       db: AsyncSession = Depends(get_db),
   ) -> dict:
       if _settings.environment != "development":
           raise UnauthorizedError(detail="Not available outside development")

       # dev-secret 헤더 검증
       dev_secret = request.headers.get("X-Dev-Secret")
       if dev_secret != _settings.dev_login_secret:
           raise UnauthorizedError(detail="Invalid dev secret")

       # platform_admin 생성 차단
       if body.role == UserRole.PLATFORM_ADMIN:
           raise ForbiddenError(detail="platform_admin은 dev-login으로 생성할 수 없습니다")

       user, _is_new = await service.otp_login_or_register(
           db, body.phone, body.name, body.role
       )
       return service.create_token_response(user)
   ```

2. **config.py** — `dev_login_secret: str = "change-me-dev"` 추가

**변경 파일**
- `backend/app/modules/auth/router.py`
- `backend/app/config.py`

**수락 기준**
- `environment=staging` → dev-login 비활성
- `environment=development` + 올바른 X-Dev-Secret → 동작
- `role=platform_admin` → 403 거부
- X-Dev-Secret 누락 → 401 거부

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-A11: 운전자 자격 검증 모델 [CRITICAL]

**현재 문제**
- `backend/app/modules/auth/models.py:20-43` — User 모델에 면허번호, 범죄경력 조회 결과, 안전교육 이수 필드 전무
- 도로교통법 제52조, 아동복지법 제29조의3 위반 소지
- 규제 샌드박스 심사에서 "운전자 자격 요건 관리 방법" 질문에 답변 불가

**목표 상태**
- 기사(DRIVER) 역할 사용자에 대한 자격 검증 필드 추가
- 자격 미충족 기사는 차량 배정 차단
- 자격 만료 자동 알림

**구현 방안**

1. **모델** — `backend/app/modules/auth/models.py`에 DriverQualification 모델 추가:
   ```python
   class DriverQualification(Base):
       __tablename__ = "driver_qualifications"

       id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
       user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), unique=True)
       license_number: Mapped[str] = mapped_column(String(20))
       license_type: Mapped[str] = mapped_column(String(50))  # 1종대형, 1종보통 등
       license_expiry: Mapped[date] = mapped_column(Date)
       criminal_check_date: Mapped[date | None] = mapped_column(Date)
       criminal_check_clear: Mapped[bool] = mapped_column(Boolean, default=False)
       safety_training_date: Mapped[date | None] = mapped_column(Date)
       safety_training_expiry: Mapped[date | None] = mapped_column(Date)
       is_qualified: Mapped[bool] = mapped_column(Boolean, default=False)  # 자동 계산
       created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
       updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
   ```

2. **API** — CRUD 엔드포인트 추가 (PLATFORM_ADMIN 전용)
   - `GET/POST/PATCH /auth/users/{user_id}/qualification`
   - 자격 충족 조건: 면허 유효 + 범죄경력 Clear + 안전교육 미만료

3. **배차 차단** — `backend/app/modules/vehicle_telemetry/service.py`의 차량 배정 로직에서 `is_qualified=False`인 기사 배정 차단

4. **웹** — 플랫폼 관리자 사용자 관리 페이지에 자격 정보 표시/편집

**변경 파일**
- `backend/app/modules/auth/models.py` (DriverQualification 모델)
- `backend/app/modules/auth/router.py` (자격 CRUD)
- `backend/app/modules/auth/schemas.py` (자격 스키마)
- `backend/app/modules/auth/service.py` (자격 서비스)
- `backend/app/modules/vehicle_telemetry/service.py` (배정 시 자격 확인)
- `web/src/pages/platform/PlatformUsersPage.tsx` (자격 UI)

**수락 기준**
- 기사 자격 정보 CRUD 가능
- 자격 미충족 기사 차량 배정 시 400 에러
- 면허/안전교육 만료 30일 전 알림
- 규제 샌드박스 심사 질문 "운전자 자격 요건 관리 방법" 답변 가능

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 도로교통법 제52조, 아동복지법 제29조의3 요건 확인

---

### ITEM-A12: 차량 법정 필수 필드 [CRITICAL]

**현재 문제**
- `backend/app/modules/vehicle_telemetry/models.py:10-28` — Vehicle 모델에 제조연도, 통학버스 신고번호, 황색 도색 확인 등 법정 필수 필드 없음
- SRS "3년 이내" 차량 요구사항 관리 불가
- 미신고 차량 배차 차단 로직 없음

**목표 상태**
- Vehicle 모델에 법정 필수 필드 추가
- 필수 요건 미충족 차량은 배차 차단

**구현 방안**

1. **모델** — `backend/app/modules/vehicle_telemetry/models.py`의 Vehicle에 필드 추가:
   ```python
   manufacture_year: Mapped[int | None] = mapped_column(Integer)
   school_bus_registration_no: Mapped[str | None] = mapped_column(String(30))  # 통학버스 신고번호
   is_yellow_painted: Mapped[bool] = mapped_column(Boolean, default=False)  # 황색 도색
   vehicle_type: Mapped[str | None] = mapped_column(String(30))  # 승합차, 버스 등
   has_cctv: Mapped[bool] = mapped_column(Boolean, default=False)
   has_stop_sign: Mapped[bool] = mapped_column(Boolean, default=False)  # 정지 표시 장치
   last_inspection_date: Mapped[date | None] = mapped_column(Date)
   ```

2. **배차 검증** — 배차 시 다음 조건 확인:
   - `school_bus_registration_no` 필수 (미신고 차량 차단)
   - `manufacture_year`가 현재연도 - 9 이상 (9년 초과 차량 차단, 도로교통법)
   - `safety_inspection_expiry` 미만료

3. **스키마/API** — VehicleCreateRequest, VehicleUpdateRequest에 필드 추가

4. **웹** — 차량 등록/편집 폼에 필드 추가
   - `web/src/pages/VehiclesPage.tsx` 및 `web/src/pages/platform/PlatformVehiclesPage.tsx`

**변경 파일**
- `backend/app/modules/vehicle_telemetry/models.py`
- `backend/app/modules/vehicle_telemetry/schemas.py`
- `backend/app/modules/vehicle_telemetry/service.py`
- `web/src/pages/VehiclesPage.tsx`
- `web/src/pages/platform/PlatformVehiclesPage.tsx`

**수락 기준**
- 차량 등록 시 통학버스 신고번호, 제조연도 입력 가능
- 미신고 차량 배차 시 400 에러
- 9년 초과 차량 배차 시 경고
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 도로교통법 제52조, 어린이 통학버스 안전규칙 요건 확인

---

### ITEM-A13: 위치정보법 대응 코드 [CRITICAL]

**현재 문제**
- GPS 실시간 수집/저장하면서 위치정보법 대응 코드 전무
- 위치정보 이용약관 별도 없음
- 수집 기록 6개월 보관 로직 없음
- `backend/app/modules/vehicle_telemetry/models.py:58-76` — GpsHistory 무기한 저장

**목표 상태**
- 위치정보 수집/이용 동의 기록 관리
- GPS 이력 6개월 보관 후 자동 파기
- 위치정보 수집 기록 생성 (위치정보법 제16조)

**구현 방안**

1. **위치정보 동의** — consent_scope에 `location_tracking` 항목 필수/선택 구분
   - `backend/app/modules/compliance/service.py`의 `create_consent`에서 location_tracking 동의 여부 명시적 확인
   - 묵시적 동의(기본값 True) → 명시적 선택으로 변경

2. **GPS 데이터 보존 기간** — 6개월 후 자동 파기
   - `backend/app/modules/vehicle_telemetry/service.py`에 `purge_old_gps_data` 함수 추가:
     ```python
     async def purge_old_gps_data(db: AsyncSession) -> int:
         cutoff = datetime.now(UTC) - timedelta(days=180)
         stmt = delete(GpsHistory).where(GpsHistory.recorded_at < cutoff)
         result = await db.execute(stmt)
         return result.rowcount
     ```
   - startup 또는 daily cron에서 실행

3. **위치정보 수집 기록**
   - 수집 일시, 대상 차량, 수집 목적 로깅 (별도 테이블 또는 로그 파일)

**변경 파일**
- `backend/app/modules/vehicle_telemetry/service.py`
- `backend/app/modules/compliance/service.py`
- `backend/main.py` (startup에서 purge 실행)

**수락 기준**
- GPS 이력 180일 경과 데이터 자동 삭제
- 위치정보 동의 미부여 학부모의 자녀는 위치 추적 비활성
- 위치정보 수집 기록 로깅
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 위치정보보호법 제5조, 제5조의2, 제16조, 제24조 요건 충족 확인 필수

---

### ITEM-A14: 14세 미만 아동 법정대리인 동의 프로세스 강화 [CRITICAL]

**현재 문제**
- `backend/app/modules/compliance/models.py:25` — `consent_scope` 기본값에 `location_tracking: True` 포함 → 묵시적 동의 구조
- 법정대리인 자격 검증 없음 (학부모 계정이 실제 법정대리인인지 확인 불가)
- 동의 항목 필수/선택 구분 미강제
- 개인정보보호법 제22조의2 위반 소지

**목표 상태**
- 동의 항목을 필수/선택으로 명확히 구분
- 동의 화면에서 각 항목별 개별 동의 체크
- 동의 철회 시 데이터 처리 로직 구현

**구현 방안**

1. **동의 항목 구조화** — consent_scope를 구조화된 스키마로 변경:
   ```python
   class ConsentScope(BaseModel):
       # 필수 동의
       service_terms: bool  # 서비스 이용약관
       privacy_policy: bool  # 개인정보 처리방침
       child_info_collection: bool  # 아동 개인정보 수집
       # 선택 동의
       location_tracking: bool = False  # 위치정보 수집
       marketing: bool = False  # 마케팅 정보 수신
       third_party_sharing: bool = False  # 제3자 제공
   ```

2. **동의 생성 시 필수 항목 검증**
   - `backend/app/modules/compliance/service.py`의 `create_consent`에서 필수 항목 미동의 시 거부

3. **동의 철회 처리**
   - `withdrawn_at` 설정 시 관련 데이터 비활성화:
     - location_tracking 철회: 해당 아동 GPS 추적 비활성
     - child_info_collection 철회: 해당 아동 스케줄 비활성화

4. **모바일** — 동의 화면 UI 개선
   - 각 항목별 체크박스 + 상세 보기 링크
   - 필수/선택 라벨 명확 표시

**변경 파일**
- `backend/app/modules/compliance/schemas.py`
- `backend/app/modules/compliance/service.py`
- `backend/app/modules/compliance/router.py`
- `mobile/src/screens/parent/` (동의 화면 — 기존 또는 신규)

**수락 기준**
- 필수 동의 미체크 시 서비스 이용 불가
- 선택 동의(위치정보)는 기본값 False
- 동의 철회 시 관련 기능 비활성화
- 동의 이력 전체 보관 (철회 포함)

**Android/iOS/PC 고려사항**: 동의 화면 UI는 모바일/웹 모두 필요
**법률 검토 필요 여부**: 예 — 개인정보보호법 제22조의2, 위치정보보호법 제18조 필수 검토

---

## 워크스트림 B — 플랫폼/UX/비즈니스

---

### ITEM-B01: 스케줄 템플릿 관리 UI (학원 대시보드) [CRITICAL]

**현재 문제**
- 백엔드에 ScheduleTemplate CRUD API 존재 (`backend/app/modules/scheduling/router.py:23-42`)
- 학원 관리자 웹 대시보드(`web/src/pages/SchedulesPage.tsx`)에는 일일 스케줄 조회/파이프라인만 있음
- 템플릿(주간 반복 스케줄) 관리 UI 부재 → 자동 배차 핵심 기능 사실상 사용 불가
- 현재 템플릿 생성은 학부모(PARENT) 역할만 가능 (`require_roles(UserRole.PARENT)`)

**목표 상태**
- 학원 관리자가 학생별 주간 스케줄 템플릿을 웹에서 CRUD 가능
- 요일별 픽업 시간/주소 설정
- 템플릿 일괄 등록 (엑셀 or 복사)
- 학원 관리자도 템플릿 생성 가능하도록 권한 확대

**구현 방안**

1. **백엔드** — 권한 확대 + 학원 관리자용 API
   - `backend/app/modules/scheduling/router.py:23-31`의 `create_schedule_template` 권한 확대:
     ```python
     current_user: User = Depends(require_roles(UserRole.PARENT, UserRole.ACADEMY_ADMIN, UserRole.PLATFORM_ADMIN))
     ```
   - 학원 관리자일 때: guardian_id 대신 학원 소속 학생에 대한 권한 확인
   - `GET /schedules/templates/academy` — 학원별 전체 템플릿 조회 API 추가

2. **웹** — 스케줄 템플릿 관리 탭 추가
   - `web/src/pages/SchedulesPage.tsx`에 "스케줄 템플릿" 탭 추가
   - 학생 선택 → 요일별 시간/주소 설정 → 저장
   - DataTable로 현재 템플릿 목록 표시 (학생명, 요일, 시간, 주소, 상태)
   - 템플릿 비활성화/삭제 기능

**변경 파일**
- `backend/app/modules/scheduling/router.py` (권한 확대, 학원별 조회 API)
- `backend/app/modules/scheduling/service.py` (학원 관리자 서비스)
- `web/src/pages/SchedulesPage.tsx` (템플릿 관리 UI)

**수락 기준**
- 학원 관리자가 학생별 주간 스케줄 템플릿 CRUD 가능
- 템플릿 생성 → 일일 파이프라인 실행 → 스케줄 인스턴스 생성 전체 플로우 동작
- 요일별 필터/정렬 가능
- 기존 학부모 템플릿 생성 기능 유지

**Android/iOS/PC 고려사항**: 웹 전용 (모바일에서는 학부모가 기존 API로 생성)
**법률 검토 필요 여부**: 아니오

---

### ITEM-B02: 관제센터 학원 관리자 개방 [CRITICAL]

**현재 문제**
- `web/src/pages/platform/PlatformMapPage.tsx` — 관제센터(실시간 차량 위치 모니터링)가 플랫폼 관리자 전용
- 학원 관리자에게 핵심 가치인 실시간 모니터링 제공 불가
- B2B 세일즈 데모 절반 성립 안 됨

**목표 상태**
- 학원 관리자에게 본인 학원 소속 차량만 보이는 관제센터 제공
- 기존 플랫폼 관제센터 컴포넌트 재사용

**구현 방안**

1. **백엔드** — 학원별 차량 조회 API
   - 기존 차량 목록 API에 academy_id 필터 추가
   - 학원 관리자 요청 시 소속 차량만 반환

2. **웹** — 학원 관리자용 관제 페이지
   - `web/src/pages/MapPage.tsx` 신규 생성 (또는 기존 PlatformMapPage 재사용)
   - 학원 관리자 사이드바에 "관제센터" 메뉴 추가
   - `web/src/components/Layout.tsx`의 학원 관리자 메뉴에 관제센터 항목 추가
   - `web/src/App.tsx`에 라우트 추가

**변경 파일**
- `web/src/pages/MapPage.tsx` (신규 또는 기존 PlatformMapPage 래핑)
- `web/src/components/Layout.tsx` (학원 메뉴에 관제센터 추가)
- `web/src/App.tsx` (라우트)
- `backend/app/modules/vehicle_telemetry/router.py` (학원별 차량 필터)

**수락 기준**
- 학원 관리자 로그인 → 사이드바 "관제센터" 메뉴 표시
- 관제센터에서 본인 학원 소속 차량만 실시간 위치 표시
- 다른 학원 차량 미표시 (데이터 격리)
- 기존 플랫폼 관제센터 영향 없음

**Android/iOS/PC 고려사항**: 웹 전용
**법률 검토 필요 여부**: 아니오

---

### ITEM-B03: 엑셀 업로드 학원 관리자 개방 [HIGH]

**현재 문제**
- `backend/app/modules/student_management/router.py:50-56` — 엑셀 업로드 API는 `ACADEMY_ADMIN, PLATFORM_ADMIN` 권한 이미 지원
- `web/src/pages/platform/PlatformUploadPage.tsx` — 엑셀 업로드 UI가 플랫폼 관리자 전용 페이지에만 있음
- 학원 관리자가 대량 학생 등록 불가

**목표 상태**
- 학원 관리자 대시보드에서 엑셀 업로드 가능
- 업로드 템플릿 다운로드 기능

**구현 방안**

1. **웹** — 학원 관리자 학생 페이지에 엑셀 업로드 추가
   - `web/src/pages/StudentsPage.tsx`에 "엑셀 업로드" 버튼 추가
   - 기존 PlatformUploadPage의 업로드 컴포넌트 재사용 또는 추출
   - 템플릿 다운로드: 헤더(이름, 생년월일, 학년, 보호자연락처)가 포함된 .xlsx 파일 다운로드

2. **백엔드** — 이미 ACADEMY_ADMIN 권한 지원하므로 변경 없음

**변경 파일**
- `web/src/pages/StudentsPage.tsx` (엑셀 업로드 UI 추가)
- `web/src/pages/platform/PlatformUploadPage.tsx` (업로드 컴포넌트 추출)

**수락 기준**
- 학원 관리자 학생 목록 페이지에서 "엑셀 업로드" 버튼 클릭 → 파일 선택 → 업로드 → 결과 표시
- 템플릿 다운로드 가능
- 업로드 결과(성공/실패 건수) 표시
- 기존 플랫폼 업로드 기능 영향 없음

**Android/iOS/PC 고려사항**: 웹 전용
**법률 검토 필요 여부**: 아니오

---

### ITEM-B04: Safety AI 랜딩 섹션 수정 [CRITICAL]

**현재 문제**
- `site/src/pages/Landing.tsx:77-98` — SAFETY_FEATURES 배열에 미구현 AI 기능 4개가 현재형으로 홍보:
  - "차내 이상행동 감지" — "AI 영상분석으로 ... 실시간 감지하고 즉시 알립니다"
  - "안면인식 탑승 확인" — "안면인식으로 본인 확인합니다"
  - "사각지대 안전 감시"
  - "하차 후 잔류 아동 감지"
- 모두 하드웨어(NVIDIA Jetson, CCTV) 미구현
- 소비자보호법 위반 + 신뢰 상실 리스크

**목표 상태**
- "Coming Soon" 또는 "개발 예정" 명시
- 현재형 설명을 미래형으로 변경
- 또는 해당 섹션 자체를 "로드맵"으로 전환

**구현 방안**

1. **site/src/pages/Landing.tsx** — SAFETY_FEATURES를 "개발 로드맵" 섹션으로 전환:
   - 섹션 제목: "Safety AI" → "Safety AI 로드맵"
   - 각 항목에 "Coming Soon" 배지 추가
   - 설명을 현재형 → 계획형으로 변경:
     - "감지하고 즉시 알립니다" → "감지하여 알릴 예정입니다"
   - 섹션 전체에 "하드웨어 파트너십 확정 후 순차 적용 예정" 안내

2. **"30% 절감" 문구 수정**
   - `site/src/pages/Landing.tsx:152` — `{ value: "30%", label: "운영비 절감" }` → `{ value: "최대 30%", label: "운영비 절감*" }`
   - 하단에 "*네트워크 밀도에 따라 달라질 수 있습니다" 각주

**변경 파일**
- `site/src/pages/Landing.tsx`

**수락 기준**
- Safety AI 4개 항목에 "Coming Soon" 표시
- 현재형 → 미래형/계획형 표현
- "30%" → "최대 30%*" + 각주
- 소비자보호법 위반 소지 해소

**Android/iOS/PC 고려사항**: 해당 없음 (웹사이트)
**법률 검토 필요 여부**: 예 — 표시광고법 적합성 확인

---

### ITEM-B05: 네비게이션 앱 연동 (카카오네비/T맵) [CRITICAL]

**현재 문제**
- 기사 앱 RouteScreen에서 각 정류장의 좌표(`pickup_latitude`, `pickup_longitude`)만 있고 네비 앱 실행 기능 없음
- `mobile/src/screens/driver/RouteScreen.tsx:86-88` — `detail` 텍스트에 academyName만 표시, 주소 없음
- `backend/app/modules/scheduling/schemas.py:48-61` — `DriverDailyScheduleResponse`에 `pickup_address` 필드 없음

**목표 상태**
- 기사 앱 각 정류장 카드에 "길 안내" 버튼 → 카카오내비/T맵 딥링크로 실행
- 정류장 주소 텍스트 표시

**구현 방안**

1. **백엔드** — DriverDailyScheduleResponse에 pickup_address 추가
   - `backend/app/modules/scheduling/schemas.py`:
     ```python
     pickup_address: str | None = None
     ```
   - `backend/app/modules/scheduling/service.py`의 `get_driver_daily_schedules`에서 ScheduleTemplate의 pickup_address JOIN

2. **모바일** — 기사 앱 정류장 카드에 길안내 버튼
   - `mobile/src/screens/driver/RouteScreen.tsx`의 StopCard에 "길 안내" 버튼 추가
   - `mobile/src/utils/navigation.ts` 신규:
     ```typescript
     import { Linking, Platform } from 'react-native';

     export function openNavigation(lat: number, lng: number, name: string) {
       // 카카오네비 시도 → 실패 시 T맵 → 실패 시 구글맵
       const kakaoUrl = `kakaomap://route?ep=${lat},${lng}&by=CAR`;
       const tmapUrl = `tmap://route?goalx=${lng}&goaly=${lat}&goalname=${encodeURIComponent(name)}`;
       const fallback = Platform.OS === 'ios'
         ? `maps:?daddr=${lat},${lng}`
         : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;

       Linking.canOpenURL(kakaoUrl)
         .then(can => can ? Linking.openURL(kakaoUrl) : Linking.canOpenURL(tmapUrl))
         .then(can => can ? Linking.openURL(tmapUrl) : Linking.openURL(fallback));
     }
     ```

3. **모바일 API** — `mobile/src/api/schedules.ts`의 `DriverDailySchedule` 인터페이스에 `pickup_address` 추가

**변경 파일**
- `backend/app/modules/scheduling/schemas.py`
- `backend/app/modules/scheduling/service.py`
- `mobile/src/screens/driver/RouteScreen.tsx`
- `mobile/src/utils/navigation.ts` (신규)
- `mobile/src/api/schedules.ts`

**수락 기준**
- 기사 앱 정류장 카드에 주소 텍스트 표시
- "길 안내" 버튼 탭 → 카카오네비(또는 T맵) 앱 실행
- 카카오네비/T맵 미설치 시 기본 지도 앱 폴백
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: `Linking.canOpenURL`은 iOS에서 `Info.plist`의 `LSApplicationQueriesSchemes`에 `kakaomap`, `tmap` 추가 필요
**법률 검토 필요 여부**: 아니오

---

### ITEM-B06: 학생 사진/주소 기사 앱 표시 [CRITICAL]

**현재 문제**
- `backend/app/modules/scheduling/schemas.py:48-61` — `DriverDailyScheduleResponse`에 `student_photo_url`, `pickup_address` 없음
- `backend/app/modules/student_management/models.py:22` — Student 모델에 `profile_photo_url` 필드 존재하나 스케줄 API에 미포함
- Student 모델에 `special_notes`, `allergies`, `medical_notes`, `emergency_contact` 필드 없음 (전문가 리뷰 P0-18)

**목표 상태**
- 기사 앱 StopCard에 학생 사진/주소 표시
- 학생 특이사항(알레르기, 차멀미 등) 표시
- 학부모 연락처 "전화하기" 버튼

**구현 방안**

1. **백엔드 — Student 모델 확장**
   - `backend/app/modules/student_management/models.py`에 필드 추가:
     ```python
     special_notes: Mapped[str | None] = mapped_column(Text)  # 특이사항
     allergies: Mapped[str | None] = mapped_column(Text)  # 알레르기
     medical_notes: Mapped[str | None] = mapped_column(Text)  # 의료 정보
     emergency_contact: Mapped[str | None] = mapped_column(String(20))  # 비상연락처
     ```

2. **백엔드 — DriverDailyScheduleResponse 확장**
   - `backend/app/modules/scheduling/schemas.py`의 `DriverDailyScheduleResponse`에 필드 추가:
     ```python
     student_photo_url: str | None = None
     pickup_address: str | None = None
     special_notes: str | None = None
     guardian_phone_masked: str | None = None  # 010-****-5678
     ```

3. **모바일** — 기사 앱 StopCard 확장
   - 학생 사진 썸네일 (Image 컴포넌트)
   - 특이사항 아이콘 (알레르기: 빨간 ! 아이콘)
   - 주소 텍스트
   - 학부모 전화 버튼 (`Linking.openURL('tel:...')`)

**변경 파일**
- `backend/app/modules/student_management/models.py`
- `backend/app/modules/student_management/schemas.py`
- `backend/app/modules/scheduling/schemas.py`
- `backend/app/modules/scheduling/service.py`
- `mobile/src/screens/driver/RouteScreen.tsx`
- `mobile/src/api/schedules.ts`

**수락 기준**
- 기사 앱 StopCard에 학생 사진 표시 (없으면 기본 아이콘)
- 주소 텍스트 표시
- 특이사항 있으면 아이콘+텍스트 표시
- 학부모 전화 버튼으로 전화 걸기 가능

**Android/iOS/PC 고려사항**: 사진 로딩 실패 시 기본 아바타 표시
**법률 검토 필요 여부**: 학생 사진 노출 범위 — 담당 기사에게만 표시되므로 합목적적 이용

---

### ITEM-B07: 기사 변경 시 학부모 알림 [HIGH]

**현재 문제**
- `backend/app/modules/vehicle_telemetry/models.py:34-55` — VehicleAssignment의 driver_id 변경 시 알림 트리거 없음
- 대차/교체 시 낯선 기사가 아이를 태우러 와도 학부모 모름

**목표 상태**
- VehicleAssignment driver_id 변경 시 해당 차량에 배정된 학생들의 보호자에게 자동 알림
- 알림 내용: "오늘 김민수 학생의 담당 기사가 [기사명]으로 변경되었습니다. 차량번호: [번호]"

**구현 방안**

1. **백엔드** — 기사 변경 감지 + 알림
   - `backend/app/modules/vehicle_telemetry/service.py`의 차량 배정 함수에서 기존 driver_id와 새 driver_id 비교
   - 변경 시: 해당 차량의 오늘 스케줄 → 학생 → 보호자 목록 추출 → FCM+SMS 알림 발송
   - `backend/app/modules/notification/service.py`에 `send_driver_change_notification` 추가

**변경 파일**
- `backend/app/modules/vehicle_telemetry/service.py`
- `backend/app/modules/notification/service.py`

**수락 기준**
- 기사 변경 시 학부모에게 즉시 알림 (새 기사명 + 차량번호)
- 알림 이력 저장
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-B08: 안전도우미 앱 기능 확장 [CRITICAL]

**현재 문제**
- `mobile/src/screens/escort/ShiftsScreen.tsx` — 출퇴근(체크인/아웃) + 수당 조회만 가능
- 핵심 업무(학생 목록, 탑승/하차 체크, 안전 점검)를 지원하는 기능 전무
- 전문가 리뷰 3그룹(P21, 가이드A, 가이드B)이 공통 지적

**목표 상태**
- 안전도우미 앱에 기사 앱의 RouteScreen과 유사한 학생 목록/탑승/하차 기능 제공
- 체크인 후 배정된 차량의 학생 목록, 사진, 특이사항 표시
- 안전 체크리스트 (안전벨트 확인, 잔류 확인 등)

**구현 방안**

1. **모바일** — 안전도우미 탭에 "운행" 탭 추가
   - `mobile/src/navigation/EscortTabNavigator.tsx`에 "운행" 탭 추가
   - 기사 앱 `RouteScreen` 컴포넌트 공유 또는 EscortRouteScreen 신규 생성
   - 학생 목록은 기사 앱과 동일한 `getDriverDailySchedules` API 사용 (SAFETY_ESCORT 역할 이미 지원)

2. **백엔드** — 이미 `/schedules/daily/driver` 엔드포인트에서 `SAFETY_ESCORT` 허용 (`router.py:76-77`)
   - EscortShift의 vehicle_assignment_id → vehicle_id → 해당 차량 스케줄 조회 로직 추가

3. **안전 체크리스트** — ITEM-A03의 차량 잔류 확인과 통합

**변경 파일**
- `mobile/src/navigation/EscortTabNavigator.tsx` (운행 탭 추가)
- `mobile/src/screens/escort/EscortRouteScreen.tsx` (신규)
- `backend/app/modules/scheduling/service.py` (안전도우미용 스케줄 조회)

**수락 기준**
- 안전도우미 앱에 "운행" 탭 표시
- 배정된 차량의 학생 목록, 사진, 특이사항 표시
- 탑승/하차 체크 가능
- 차량 잔류 확인 체크리스트 가능

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-B09: 기사 앱 버튼/폰트 확대 [HIGH]

**현재 문제**
- `mobile/src/screens/driver/RouteScreen.tsx` — 탑승/하차 버튼이 일반 크기
- 운전 중 한 손 조작 고려 미흡
- 전문가 리뷰에서도 "장갑 낀 손 조작" 언급

**목표 상태**
- 기사 앱 전체 버튼 최소 높이 56px (현재 40px 추정)
- 폰트 크기 기본 16px 이상
- 탑승/하차 버튼 특히 크게 (높이 60px+, 폰트 18px)

**구현 방안**

1. **모바일** — RouteScreen 스타일 업데이트
   - `actionBtn` 스타일: `minHeight: 56` → `minHeight: 60`, `paddingHorizontal: 20`
   - `btnText` 스타일: `fontSize: 14` → `fontSize: 18`
   - `studentName` 스타일: 폰트 확대 (16px → 18px)
   - `detail` 스타일: 폰트 확대 (13px → 16px)

2. **기사 전용 폰트 스케일** — 기사 역할일 때 전체적으로 폰트 1.2배 스케일

**변경 파일**
- `mobile/src/screens/driver/RouteScreen.tsx`
- `mobile/src/screens/driver/HomeScreen.tsx`
- `mobile/src/screens/driver/MapScreen.tsx`

**수락 기준**
- 탑승/하차 버튼 높이 60px 이상
- 버튼 텍스트 18px 이상
- 학생 이름 18px, 상세 정보 16px 이상
- 기존 레이아웃 깨지지 않음

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 아니오

---

### ITEM-B10: devLogin UI 제거 (모바일 프로덕션 빌드) [CRITICAL]

**현재 문제**
- `mobile/src/screens/LoginScreen.tsx` — 전체 로그인 화면이 devLogin 전용
- 프로덕션 빌드에서도 "개발 모드 로그인" UI가 표시됨
- 앱스토어 100% 리젝 사유 (테스트 계정 UI 노출)

**목표 상태**
- 프로덕션 빌드: OTP 기반 정식 로그인 화면
- 개발 빌드: 기존 devLogin 유지 (환경 변수로 분기)

**구현 방안**

1. **모바일** — LoginScreen을 환경에 따라 분기
   - `mobile/src/screens/LoginScreen.tsx` 리팩터:
     ```tsx
     const IS_DEV = __DEV__ || process.env.EXPO_PUBLIC_DEV_MODE === 'true';

     export default function LoginScreen() {
       if (IS_DEV) return <DevLoginScreen />;
       return <ProductionLoginScreen />;
     }
     ```
   - `ProductionLoginScreen`: 전화번호 입력 → OTP 발송 → OTP 입력 → 로그인
   - `DevLoginScreen`: 기존 역할 선택 + devLogin 유지

2. **프로덕션 로그인 플로우**
   - Step 1: 전화번호 입력 + "인증번호 받기" 버튼 → `POST /auth/otp/send`
   - Step 2: OTP 6자리 입력 + 이름 + 역할 선택 → `POST /auth/otp/verify`
   - 카카오 로그인 버튼 (optional)

**변경 파일**
- `mobile/src/screens/LoginScreen.tsx` (리팩터)
- `mobile/src/screens/DevLoginScreen.tsx` (신규 — 기존 코드 이동)
- `mobile/src/screens/ProductionLoginScreen.tsx` (신규)
- `mobile/src/api/auth.ts` (OTP API 호출 추가)

**수락 기준**
- `__DEV__=false` (프로덕션) 빌드에서 devLogin UI 미표시
- OTP 기반 정식 로그인 플로우 동작
- `__DEV__=true` (개발) 빌드에서 기존 devLogin 유지
- 기존 테스트 통과

**Android/iOS/PC 고려사항**: `__DEV__`는 React Native 내장 글로벌 변수, Expo에서도 지원
**법률 검토 필요 여부**: 아니오

---

### ITEM-B11: 앱스토어 메타데이터 준비 [HIGH]

**현재 문제**
- 앱스토어(iOS App Store, Google Play Store) 제출에 필요한 메타데이터 전무
- 스크린샷, 설명, 키워드, 연령 등급, 개인정보 처리 링크 미준비

**목표 상태**
- App Store / Play Store 제출 가능한 메타데이터 세트 완성

**구현 방안**

1. **메타데이터 문서** — `artifacts/appstore/` 디렉토리에 메타데이터 파일 생성:
   - `app-store-metadata.md`: 앱 이름, 부제, 설명(짧은/긴), 키워드, 카테고리, 연령 등급
   - 연령 등급: 4+ (아동 관련 서비스이므로 Kids 카테고리)
   - 개인정보 처리 URL: `https://safeway-kids.kr/privacy`

2. **Expo 설정** — `mobile/app.json` (또는 `app.config.ts`) 메타데이터 반영

3. **스크린샷** — 코드로 해결 불가 (디자인팀 필요), 항목만 정의:
   - iPhone 6.7" (1290x2796): 홈, 지도, 스케줄, 알림 각 1장
   - iPhone 6.5" (1242x2688): 동일
   - iPad 12.9" (2048x2732): 동일
   - Android phone/tablet: 동일

**변경 파일**
- `artifacts/appstore/app-store-metadata.md` (신규)
- `mobile/app.json` (메타데이터 업데이트)

**수락 기준**
- 메타데이터 문서 완성 (앱 이름, 설명, 키워드, 연령 등급)
- app.json에 번들 ID, 버전, 권한 설명 포함
- 스크린샷 사양 문서화 (디자인팀 전달용)

**Android/iOS/PC 고려사항**: iOS App Store와 Google Play Store 각각의 요구사항 충족
**법률 검토 필요 여부**: 예 — Kids 카테고리 제출 시 COPPA/KISA 아동 보호 정책 확인

---

### ITEM-B12: 사업자 정보 표시 [CRITICAL]

**현재 문제**
- `site/src/components/Footer.tsx:43` — `사업자등록번호: 준비중 | 대표: 준비중`
- 전자상거래법 위반 소지
- 신뢰 치명타

**목표 상태**
- 사업자등록번호, 대표자명, 주소, 고객센터 연락처 표시
- 또는 사업자 등록 완료 전까지 "서비스 준비 중" 명시적 안내

**구현 방안**

1. **코드 변경** — `site/src/components/Footer.tsx:43` 수정:
   - 사업자 등록 완료 시: 실제 정보 표시
   - 미완료 시: "사업자 등록 진행 중 | 서비스 정식 출시 전 베타 버전입니다" 표시
   - 환경 변수로 관리: `VITE_BUSINESS_REG_NO`, `VITE_CEO_NAME` 등

2. **Footer 확장** — 고객센터 이메일, 운영 시간 추가

**변경 파일**
- `site/src/components/Footer.tsx`

**수락 기준**
- Footer에 사업자 정보 또는 "베타 서비스" 안내 표시
- "준비중" 문구 제거
- 전자상거래법 필수 표시 항목 확인

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 예 — 전자상거래법 사업자 정보 표시 의무 확인

---

### ITEM-B13: 기사/차량 정보 + 학생 사진 통합 (학부모 앱) [CRITICAL]

**현재 문제**
- ITEM-A02(기사/차량 정보 노출)와 ITEM-B06(학생 사진/주소)은 스키마 변경이 겹침
- 학부모 앱 HomeScreen의 ScheduleCard에 종합 정보가 부족

**목표 상태**
- 학부모 앱 스케줄 카드 통합 정보 표시:
  - 학생 이름 + 사진
  - 학원 이름
  - 기사 이름 + 차량번호
  - 픽업 시간 + 주소
  - 상태 (예정/탑승/완료/취소)
  - 기사 전화 버튼

**구현 방안**
- ITEM-A02와 ITEM-B06의 백엔드 변경을 통합 반영
- `DailyScheduleResponse` 최종 형태:
  ```python
  class DailyScheduleResponse(BaseModel):
      id: uuid.UUID
      template_id: uuid.UUID | None
      student_id: uuid.UUID
      student_name: str | None = None
      student_photo_url: str | None = None
      academy_id: uuid.UUID
      academy_name: str | None = None
      vehicle_id: uuid.UUID | None = None
      vehicle_license_plate: str | None = None
      driver_name: str | None = None
      driver_phone_masked: str | None = None
      safety_escort_name: str | None = None
      schedule_date: date
      pickup_time: time
      pickup_address: str | None = None
      status: str
      boarded_at: datetime | None
      alighted_at: datetime | None
      created_at: datetime
  ```

**변경 파일**
- (ITEM-A02, ITEM-B06과 통합)

**수락 기준**
- 학부모 앱 스케줄 카드에 통합 정보 표시
- 기사 전화 버튼 동작
- 미배정 상태 적절히 표시

**Android/iOS/PC 고려사항**: 해당 없음
**법률 검토 필요 여부**: 기사 전화번호 마스킹 처리 필수

---

## 항목 간 의존성 매트릭스

| 선행 항목 | 후행 항목 | 이유 |
|----------|----------|------|
| ITEM-A07 (OTP 보안) | ITEM-B10 (프로덕션 로그인) | OTP 보안이 충분해야 프로덕션 로그인 플로우 출시 가능 |
| ITEM-A02 + ITEM-B06 | ITEM-B13 (통합) | 스키마 변경 통합 |
| ITEM-A03 (잔류확인) | ITEM-B08 (안전도우미 확장) | 안전도우미 앱에 잔류 확인 기능 포함 |
| ITEM-A04 (미탑승) | ITEM-B08 (안전도우미 확장) | 안전도우미도 미탑승 처리 가능해야 함 |
| ITEM-B10 (devLogin 제거) | ITEM-B11 (앱스토어 메타) | devLogin UI 제거 후 스크린샷 촬영 |

---

## 구현 우선순위 (추천 순서)

### Phase 1: 보안 긴급 (1-2일)
1. ITEM-A07: OTP 보안 강화
2. ITEM-A08: IDOR 수정
3. ITEM-A09: WebSocket 인가
4. ITEM-A10: dev-login 강화

### Phase 2: 안전 핵심 (2-3일)
5. ITEM-A01: SOS 버튼
6. ITEM-A03: 잔류 학생 확인
7. ITEM-A04: 미탑승 처리
8. ITEM-A05: 탑승/하차 확인 팝업

### Phase 3: 정보 표시 + UX (2-3일)
9. ITEM-A02 + ITEM-B06 + ITEM-B13: 기사/차량/학생 정보 통합
10. ITEM-B05: 네비 연동
11. ITEM-B07: 기사 변경 알림
12. ITEM-A06: 보호자 연락처 버그

### Phase 4: 플랫폼 기능 (2-3일)
13. ITEM-B01: 스케줄 템플릿 UI
14. ITEM-B02: 관제센터 개방
15. ITEM-B03: 엑셀 업로드 개방
16. ITEM-B08: 안전도우미 앱 확장
17. ITEM-B09: 기사 앱 버튼 확대

### Phase 5: 법규 + 출시 준비 (3-5일)
18. ITEM-A11: 운전자 자격 검증
19. ITEM-A12: 차량 법정 필드
20. ITEM-A13: 위치정보법 대응
21. ITEM-A14: 아동 동의 프로세스
22. ITEM-B10: devLogin UI 제거
23. ITEM-B04: Safety AI 랜딩 수정
24. ITEM-B12: 사업자 정보
25. ITEM-B11: 앱스토어 메타데이터

---

## 운영팀 의견 반영 사항

*(운영팀 어드바이저 피드백 반영 후 업데이트 예정)*

### 초기 반영 포인트
1. **SOS 버튼**: 119/112 직접 연결과 플랫폼 내부 SOS의 이중 구조 필요 — 반영 완료
2. **미탑승 처리**: 골든타임 5분 이내 학부모 연락 필수 — 반영 완료 (즉시 알림)
3. **잔류 확인**: 3단계 체크리스트(좌석/트렁크/잠금) — 반영 완료
4. **네비 연동**: 카카오네비 우선, T맵 폴백 — 반영 완료
5. **기사 앱 확대**: 운전 중 조작 고려, 최소 56px 버튼 — 60px로 확대 반영
6. **안전도우미**: 현재 "출퇴근 앱"에서 "업무 지원 앱"으로 전환 — 반영 완료

---

## 총 변경 규모 추정

| 영역 | 변경 파일 수 | 신규 파일 수 | 예상 LOC 변경 |
|------|-------------|-------------|-------------|
| 백엔드 | 18 | 2 | ~1,500 |
| 모바일 | 12 | 5 | ~1,800 |
| 웹 | 6 | 1 | ~600 |
| 사이트 | 2 | 0 | ~100 |
| **합계** | **38** | **8** | **~4,000** |

---

*이 기획서는 Dev Lead가 바로 구현 가능한 수준의 구체성을 목표로 작성되었습니다. 각 ITEM의 변경 파일, 수락 기준, 코드 예시를 참고하여 구현하십시오.*
