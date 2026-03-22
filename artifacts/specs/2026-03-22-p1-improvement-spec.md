# P1 개선 기획서 (22건) + 법규 잔여 (8건)

**작성일**: 2026-03-22
**작성자**: 기획 Lead
**입력 자료**:
- `artifacts/reports/2026-03-21-user-feedback-consolidated.md` (P1 #15~#36)
- `artifacts/reviews/2026-03-21-legal-spec-review.md` (NEEDS_AMENDMENT PARTIAL 8건)
- `artifacts/reviews/2026-03-22-beta-parent-student.md` (미해결 잔여 이슈)
- `artifacts/reviews/2026-03-22-beta-driver-guide.md` (미해결 잔여 이슈)
- `artifacts/reviews/2026-03-22-beta-academy-cfo.md` (미해결 잔여 이슈)
- `artifacts/reviews/2026-03-22-beta-legal-security.md` (미해결 보안 이슈)
- 기존 기획서: `artifacts/specs/2026-03-21-p0-improvement-spec.md`
**상태**: DRAFT

---

## 워크스트림 분류

| 워크스트림 | 범위 | 항목 수 |
|-----------|------|---------|
| **A — 백엔드 중심** | 알림, CS 기능, 법규, 보안, API, 스케줄러 | 16 |
| **B — 프론트엔드 중심** | UI, UX, 지도, 온보딩, 랜딩, 모바일 | 14 |

---

## 워크스트림 A — 백엔드 중심

---

### ITEM-P1-15: 운행 지연 자동 알림

**현재 문제**: 예정 시간 대비 N분 이상 지연 시 감지 로직 및 자동 알림이 전무. `backend/app/modules/scheduling/service.py`에 지연 감지 로직 없음. `backend/app/modules/notification/service.py`에 지연 알림 함수 없음. 학부모 피드백(김지영, 박성호) + CS 운영팀이 공통 지적 — "아이가 안 오는데 아무 연락이 없으면 불안하다."

**목표 상태**: 예정 픽업시간 대비 10분 초과 시 학부모에게 자동 "운행 지연" 알림 발송. 20분 초과 시 학원 관리자 + 관제센터 에스컬레이션 알림.

**구현 방안**:
1. **백엔드** — 지연 감지 스케줄러 추가
   - `backend/app/modules/scheduling/delay_checker.py` 신규 생성
   - 매 5분 주기로 `DailyScheduleInstance` 테이블 조회
   - 조건: `status == 'scheduled'` AND `pickup_time + 10분 < now()` AND `delay_notified_at IS NULL`
   - 조건 매칭 시 `send_delay_notification()` 호출 → FCM + SMS (학부모)
   - `pickup_time + 20분` 초과 시 학원 관리자 + 관제센터 추가 알림
   - `DailyScheduleInstance`에 `delay_notified_at: datetime | None` 컬럼 추가 (중복 발송 방지)

2. **백엔드** — 알림 서비스 확장
   - `backend/app/modules/notification/service.py`에 `send_delay_notification()` 추가
   - 메시지: "[세이프웨이키즈] {student_name} 학생의 픽업이 {delay_minutes}분 지연되고 있습니다. 차량 위치를 앱에서 확인해주세요."

3. **스케줄러 실행**
   - `APScheduler` 또는 FastAPI `lifespan` 이벤트에서 `IntervalTrigger(minutes=5)` 등록
   - 기존 `scheduling/scheduler.py`에 통합

**변경 파일**:
- `backend/app/modules/scheduling/delay_checker.py` (신규)
- `backend/app/modules/scheduling/models.py` (`delay_notified_at` 컬럼)
- `backend/app/modules/notification/service.py` (`send_delay_notification`)
- `backend/app/modules/scheduling/scheduler.py` (스케줄러 등록)

**수락 기준**:
- 픽업 예정시간 + 10분 초과 상태의 scheduled 인스턴스에 대해 학부모 알림 발송 확인
- 20분 초과 시 학원 관리자 추가 알림 발송 확인
- 동일 인스턴스에 대한 중복 알림 미발송 확인 (`delay_notified_at` 체크)
- 탑승 완료/미탑승/취소 상태에서는 지연 알림 미발송

**Android/iOS/PC 고려사항**: 백엔드 전용 기능. 알림은 기존 FCM/SMS 인프라 활용.

---

### ITEM-P1-16: 하차 후 학원 도착 확인

**현재 문제**: 하차 알림은 `send_alighting_notification()`으로 발송되지만, 하차 → 학원 입구 도달 사이의 사각지대 존재. 안전도우미가 학생을 학원까지 인계한 확인 절차 없음. 학부모 피드백(김지영): "하차했다고 학원에 들어간 건 아닌데..."

**목표 상태**: 안전도우미/기사가 학생을 학원에 인계한 후 "도착 확인" 버튼을 누르면 학부모에게 "학원 도착 확인" 알림 발송.

**구현 방안**:
1. **백엔드** — 도착 확인 API
   - `backend/app/modules/scheduling/router.py`에 `POST /schedules/daily/{instance_id}/arrival-confirm` 엔드포인트 추가
   - `require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)`
   - `DailyScheduleInstance`에 `arrival_confirmed_at: datetime | None` 컬럼 추가
   - 도착 확인 시 학부모에게 알림: "{student_name} 학생이 {academy_name}에 안전하게 도착했습니다."

2. **모바일** — 기사/가이드 앱 도착 확인 버튼
   - `mobile/src/screens/driver/RouteScreen.tsx`에서 `status === 'completed'`(하차 완료) 상태의 학생 카드에 "도착 확인" 버튼 추가
   - 확인 팝업 → API 호출 → 버튼 비활성화 + "확인됨" 표시

3. **모바일 API 타입**
   - `mobile/src/api/schedules.ts`에 `confirmArrival()` 함수 추가
   - `DriverDailySchedule` 인터페이스에 `arrival_confirmed_at` 필드 추가

**변경 파일**:
- `backend/app/modules/scheduling/router.py` (arrival-confirm 엔드포인트)
- `backend/app/modules/scheduling/service.py` (도착 확인 로직)
- `backend/app/modules/scheduling/models.py` (`arrival_confirmed_at` 컬럼)
- `backend/app/modules/notification/service.py` (`send_arrival_notification`)
- `mobile/src/screens/driver/RouteScreen.tsx` (도착 확인 버튼)
- `mobile/src/api/schedules.ts` (`confirmArrival` 함수)

**수락 기준**:
- 하차 완료 상태에서만 "도착 확인" 버튼 활성화
- 도착 확인 시 학부모 FCM + SMS 알림 발송
- `arrival_confirmed_at` 타임스탬프 DB 기록
- 이미 확인된 인스턴스에 대해 중복 확인 불가

**Android/iOS/PC 고려사항**: 모바일 기사/가이드 앱에서 동작. 학원 대시보드 관제센터에서도 도착 확인 상태 표시 가능 (P2).

---

### ITEM-P1-23: 학부모→기사/학원 메시지 기능

**현재 문제**: 학부모가 기사나 학원에 메시지를 보낼 수 없음. 결국 카카오톡 병행 → 앱 사용 동기 감소. 기사 피드백(김영수): "학부모가 '오늘 늦게 나갑니다' 연락을 카톡으로 보내는데 앱으로 오면 좋겠다." 학원 피드백(정은서 원장): "공지사항을 앱으로 보내고 싶다."

**목표 상태**: 학부모 → 학원 관리자 / 기사에게 짧은 메시지(최대 200자) 발송 가능. 학원 → 전체 학부모 공지사항 발송 가능.

**구현 방안**:
1. **백엔드** — 메시지 모듈 신규
   - `backend/app/modules/messaging/` 디렉토리 생성
   - `Message` 모델: `id, sender_id, receiver_id, receiver_role, content(200자), is_read, sent_at`
   - `POST /messages` — 발송 (sender → receiver)
   - `GET /messages` — 수신함 조회 (본인에게 온 메시지)
   - `PATCH /messages/{id}/read` — 읽음 표시
   - RBAC: `parent` → `driver`/`academy_admin` 발송 가능. `academy_admin` → 전체 학부모 발송 가능.

2. **모바일** — 학부모 앱 메시지 버튼
   - `HomeScreen.tsx` ScheduleCard에 "메시지" 버튼 추가 (기사에게 메시지)
   - 간단한 TextInput 모달 → 200자 제한 → 발송

3. **웹** — 학원 대시보드 공지사항
   - 사이드바에 "메시지/공지" 메뉴 추가 또는 기존 대시보드에 공지 발송 영역 추가

**변경 파일**:
- `backend/app/modules/messaging/` (신규 모듈: models.py, schemas.py, router.py, service.py)
- `backend/main.py` (라우터 등록)
- `mobile/src/api/messages.ts` (신규)
- `mobile/src/screens/parent/HomeScreen.tsx` (메시지 버튼)
- `web/src/components/Layout.tsx` (사이드바 메뉴)

**수락 기준**:
- 학부모가 기사에게 200자 메시지 발송 가능
- 기사 앱에서 수신 메시지 목록 조회 가능
- 학원 관리자가 전체 학부모에게 공지사항 발송 가능
- 메시지 읽음/미읽음 상태 관리

**Android/iOS/PC 고려사항**: 모바일 앱 + 웹 대시보드 모두에서 동작. 실시간 알림은 기존 FCM 인프라 활용 (WebSocket 실시간 채팅은 P2 이상).

---

### ITEM-P1-24: CS 학생 통합 조회 화면

**현재 문제**: CS 담당자가 학부모 문의 시 학생 이름으로 통합 정보를 조회할 수 없음. 보호자/학원/스케줄/탑승 상태를 확인하려면 여러 페이지를 돌아다녀야 함. CS 리뷰(이현지): "문의당 3~5분 소요. 한 화면에서 보여줘야 한다."

**목표 상태**: 플랫폼 관리자 대시보드에 "학생 통합 조회" 화면 — 학생 이름/전화번호 검색 → 보호자 정보, 학원, 오늘 스케줄, 탑승 이력, 알림 이력을 한 화면에 표시.

**구현 방안**:
1. **백엔드** — 학생 통합 조회 API
   - `backend/app/modules/admin/router.py`에 `GET /admin/students/search?q={검색어}` 추가
   - 학생 이름, 보호자 전화번호로 검색
   - 응답: 학생 정보 + 보호자 정보 + 학원 정보 + 최근 7일 스케줄 + 최근 알림 이력

2. **웹** — 통합 조회 페이지
   - `web/src/pages/platform/PlatformStudentSearchPage.tsx` 신규 생성
   - 검색창 + 결과 카드 (학생 기본정보, 보호자 연락처, 학원, 스케줄 타임라인, 알림 이력)
   - 플랫폼 관리자 사이드바에 "학생 조회" 메뉴 추가

**변경 파일**:
- `backend/app/modules/admin/router.py` (학생 통합 검색 API)
- `backend/app/modules/admin/service.py` (검색 로직)
- `backend/app/modules/admin/schemas.py` (응답 스키마)
- `web/src/pages/platform/PlatformStudentSearchPage.tsx` (신규)
- `web/src/App.tsx` (라우트 추가)
- `web/src/components/Layout.tsx` (사이드바 메뉴)

**수락 기준**:
- 학생 이름으로 검색 시 일치하는 학생 목록 표시
- 학생 카드 클릭 시 보호자 정보, 학원, 최근 스케줄, 알림 이력 한 화면에 표시
- 플랫폼 관리자만 접근 가능 (RBAC)
- 검색 결과가 없을 때 적절한 empty state 표시

**Android/iOS/PC 고려사항**: 웹 전용 (플랫폼 관리자 대시보드).

---

### ITEM-P1-25: 알림 발송 이력 조회 (CS 대시보드)

**현재 문제**: CS 담당자가 "알림 안 왔어요" 문의 시 FCM/SMS 발송 성공/실패 이력을 확인할 방법이 없음. `notification/service.py`에서 로깅은 하지만 DB 저장 및 조회 UI 없음. CS 리뷰(조영민): "발송 이력 없으면 학부모 주장 확인 불가."

**목표 상태**: 알림 발송 이력을 DB에 기록하고, 플랫폼 관리자 대시보드에서 사용자별/유형별 발송 이력 조회 가능.

**구현 방안**:
1. **백엔드** — 알림 이력 테이블 + 기록 로직
   - `backend/app/modules/notification/models.py` 신규 — `NotificationLog` 모델
     - `id, recipient_user_id, recipient_phone, channel (fcm/sms), notification_type (boarding/alighting/delay/sos/no_show), title, body, status (sent/failed), error_message, sent_at`
   - `notification/service.py`의 각 알림 함수에서 `NotificationLog` 레코드 생성
   - `GET /admin/notifications/logs?user_id=&type=&date_from=&date_to=` API 추가

2. **웹** — 알림 이력 페이지
   - `web/src/pages/platform/PlatformNotificationLogsPage.tsx` 신규
   - 필터: 사용자 검색, 알림 유형, 날짜 범위, 채널(FCM/SMS), 상태(성공/실패)
   - DataTable로 이력 표시

**변경 파일**:
- `backend/app/modules/notification/models.py` (신규 — NotificationLog)
- `backend/app/modules/notification/service.py` (각 함수에 로그 기록 추가)
- `backend/app/modules/admin/router.py` (알림 이력 조회 API)
- `web/src/pages/platform/PlatformNotificationLogsPage.tsx` (신규)
- `web/src/App.tsx` (라우트)
- `web/src/components/Layout.tsx` (사이드바)

**수락 기준**:
- 모든 알림 발송(FCM, SMS) 시 NotificationLog에 기록
- 발송 성공/실패 상태 구분 기록
- 플랫폼 관리자가 사용자별, 유형별, 날짜별로 이력 조회 가능
- 특정 학생/학부모의 최근 알림 이력 빠르게 조회 가능

**Android/iOS/PC 고려사항**: 웹 전용 (플랫폼 관리자 대시보드).

---

### ITEM-P1-27: 운행 시작/종료 버튼

**현재 문제**: 기사가 GPS 추적 시작/종료를 명시적으로 제어할 수 없음. 앱 열면 자동 추적이지만 운행 종료 시점이 불명확. 기사 피드백(이상철): "운행 끝났는데 GPS가 언제까지 가는 건지 모르겠다."

**목표 상태**: 기사 앱에 "운행 시작" / "운행 종료" 토글 버튼 추가. 시작 시 GPS 추적 활성화 + 관제센터 운행 상태 표시. 종료 시 GPS 추적 중단 + 차량 점검 플로우 트리거.

**구현 방안**:
1. **백엔드** — 운행 상태 API
   - `backend/app/modules/scheduling/router.py`에 추가:
     - `POST /schedules/daily/route/start` — 운행 시작 (vehicle_id, schedule_date)
     - `POST /schedules/daily/route/end` — 운행 종료 (vehicle_id, schedule_date)
   - `RouteSession` 모델 신규: `id, vehicle_id, driver_id, schedule_date, started_at, ended_at`
   - 운행 시작 시 관제센터 WebSocket으로 `route_started` 이벤트 브로드캐스트
   - 운행 종료 시 `route_ended` 이벤트 + 차량 점검 미완료 경고

2. **모바일** — 기사 앱 운행 토글
   - `mobile/src/screens/driver/RouteScreen.tsx` 상단에 "운행 시작" / "운행 중" 토글 버튼
   - 운행 시작 전: 학생 목록은 읽기 전용 (탑승/하차 버튼 비활성)
   - 운행 시작 후: 탑승/하차/미탑승 버튼 활성화 + GPS 업데이트 시작
   - 운행 종료: 모든 학생 처리 완료 확인 → 차량 점검 플로우 → GPS 중단

**변경 파일**:
- `backend/app/modules/scheduling/router.py` (route start/end 엔드포인트)
- `backend/app/modules/scheduling/models.py` (`RouteSession` 모델)
- `backend/app/modules/scheduling/service.py` (운행 세션 로직)
- `mobile/src/screens/driver/RouteScreen.tsx` (운행 토글 UI)
- `mobile/src/api/schedules.ts` (`startRoute`, `endRoute` 함수)

**수락 기준**:
- "운행 시작" 탭 시 GPS 추적 활성화 + 학생 조작 버튼 활성화
- "운행 종료" 탭 시 미처리 학생 경고 → 차량 점검 → GPS 중단
- 관제센터에서 운행 시작/종료 상태 실시간 확인
- `RouteSession` 테이블에 시작/종료 시각 기록

**Android/iOS/PC 고려사항**: 모바일 기사 앱 + 관제센터 웹.

---

### ITEM-P1-28: 학생 특이사항/알레르기 기사 앱 표시

**현재 문제**: `Student` 모델에 `special_notes`, `allergies`, `medical_notes` 필드가 존재하고 (`student_management/models.py:23-26`), `DriverDailyScheduleResponse`에 `special_notes` 필드가 있음. 기사 앱 `RouteScreen.tsx:170-175`에서 `specialNotes`가 표시되지만 **백엔드에서 실제 데이터를 join해서 내려주는지** 확인 필요. 기사 피드백(박미영): "'김민수 - 차멀미 심함, 앞자리 배정' 같은 정보가 필요하다."

**목표 상태**: 기사 앱 학생 카드에 특이사항(차멀미, 알레르기 등)이 빨간 경고 아이콘과 함께 표시. 학부모/학원이 학생 등록 시 특이사항을 입력하면 기사에게 자동 전달.

**구현 방안**:
1. **백엔드** — 스케줄 서비스에서 Student.special_notes join 확인
   - `backend/app/modules/scheduling/service.py`의 `get_driver_daily_schedules()` 함수에서 Student 테이블 join 시 `special_notes`, `allergies` 필드를 `DriverDailyScheduleResponse`에 포함하는지 확인
   - 누락 시 추가: `special_notes = student.special_notes`, `allergies = student.allergies`

2. **백엔드** — 스키마 확장
   - `DriverDailyScheduleResponse`에 `allergies: str | None` 필드 추가 (현재 `special_notes`만 있음)

3. **모바일** — 알레르기 별도 표시
   - `RouteScreen.tsx` StopCard에서 `allergies`가 있으면 빨간 `alert-circle` 아이콘 + "알레르기: {allergies}" 텍스트 추가 표시

4. **웹 + 모바일** — 학생 등록 시 특이사항 입력
   - `web/src/pages/StudentsPage.tsx` 학생 등록 폼에 "특이사항", "알레르기", "의료 참고사항" 필드 추가 (현재 누락 여부 확인)

**변경 파일**:
- `backend/app/modules/scheduling/schemas.py` (`allergies` 필드 추가)
- `backend/app/modules/scheduling/service.py` (Student join 확인)
- `mobile/src/api/schedules.ts` (`DriverDailySchedule.allergies` 추가)
- `mobile/src/screens/driver/RouteScreen.tsx` (알레르기 표시)
- `web/src/pages/StudentsPage.tsx` (특이사항 입력 필드)

**수락 기준**:
- 학생에 `special_notes` 또는 `allergies`가 등록된 경우 기사 앱 학생 카드에 경고 아이콘 + 텍스트 표시
- 학원 관리자가 학생 등록 시 특이사항/알레르기 입력 가능
- API 응답에 `special_notes`, `allergies` 필드 포함 확인

**Android/iOS/PC 고려사항**: 모바일 기사/가이드 앱 + 웹 대시보드.

---

### ITEM-P1-31: 기사 관리 UI (학원 대시보드)

**현재 문제**: `DriverQualification` 모델이 존재하지만 (`auth/models.py:46-64`), 학원 관리자가 기사를 등록/배정/관리하는 UI가 전무. 플랫폼 관리자 사용자 관리 페이지에서만 자격 정보 관리 가능. 학원 피드백(정은서 원장): "기사 배정/관리를 우리가 직접 할 수 없다." 베타 재검증 N6 이슈.

**목표 상태**: 학원 관리자 대시보드에 "기사 관리" 페이지 — 소속 기사 목록, 자격 상태, 차량 배정 조회/변경 가능.

**구현 방안**:
1. **백엔드** — 학원별 기사 조회 API
   - `backend/app/modules/admin/router.py`에 `GET /admin/academy/{academy_id}/drivers` 추가
   - 해당 학원에 배정된 차량의 기사 목록 + `DriverQualification` 정보 join
   - 학원 관리자는 본인 학원만 조회 (RBAC)

2. **웹** — 기사 관리 페이지
   - `web/src/pages/DriversPage.tsx` 신규
   - 기사 목록 (이름, 전화번호 마스킹, 면허 상태, 안전교육 상태, 배정 차량)
   - 자격 만료 임박 경고 (30일 이내 빨간 배지)
   - 학원 관리자 사이드바에 "기사 관리" 메뉴 추가

**변경 파일**:
- `backend/app/modules/admin/router.py` (학원별 기사 조회)
- `backend/app/modules/admin/service.py` (기사 목록 로직)
- `web/src/pages/DriversPage.tsx` (신규)
- `web/src/App.tsx` (라우트)
- `web/src/components/Layout.tsx` (사이드바 메뉴 추가: `{ to: '/drivers', label: '기사 관리', icon: '🚗' }`)

**수락 기준**:
- 학원 관리자가 소속 기사 목록을 조회할 수 있음
- 기사별 자격 상태(면허, 범죄경력, 안전교육) 확인 가능
- 자격 만료 임박 시 시각적 경고 표시
- 플랫폼 관리자도 동일 페이지 접근 가능

**Android/iOS/PC 고려사항**: 웹 전용 (학원/플랫폼 관리자 대시보드).

---

### ITEM-P1-32: 수동 SMS 발송 (CS 대시보드)

**현재 문제**: 긴급 상황 시 CS 담당자가 특정 학부모/학원/기사에게 즉시 SMS/푸시를 발송할 수 없음. 기존 알림은 모두 자동(탑승/하차/SOS 등). CS 리뷰(조영민): "시스템 장애나 긴급 안내 시 수동으로 보낼 수 있어야 한다."

**목표 상태**: 플랫폼 관리자가 CS 대시보드에서 수신자(학부모/기사/학원 관리자) 선택 → 메시지 입력 → SMS 또는 FCM 즉시 발송.

**구현 방안**:
1. **백엔드** — 수동 발송 API
   - `backend/app/modules/notification/router.py`에 `POST /notifications/manual-send` 추가
   - Request: `{ recipient_ids: list[UUID], channel: "sms" | "fcm" | "both", message: str }`
   - `require_roles(UserRole.PLATFORM_ADMIN)` — 플랫폼 관리자 전용
   - 발송 기록을 `NotificationLog`에 저장 (ITEM-P1-25와 연동)

2. **웹** — 수동 발송 UI
   - `web/src/pages/platform/PlatformNotificationLogsPage.tsx`에 "수동 발송" 버튼 추가
   - 모달: 수신자 검색 (이름/전화번호), 채널 선택, 메시지 입력(200자), 발송 확인

**변경 파일**:
- `backend/app/modules/notification/router.py` (manual-send 엔드포인트)
- `backend/app/modules/notification/schemas.py` (ManualSendRequest)
- `web/src/pages/platform/PlatformNotificationLogsPage.tsx` (수동 발송 모달)

**수락 기준**:
- 플랫폼 관리자가 수신자를 선택하여 SMS/FCM 발송 가능
- 발송 기록이 NotificationLog에 저장
- 발송 확인 팝업으로 오발송 방지
- 플랫폼 관리자만 접근 가능 (RBAC)

**Android/iOS/PC 고려사항**: 웹 전용 (플랫폼 관리자).

---

### ITEM-P1-33: 학부모 알림 확인 표시 (기사 앱)

**현재 문제**: 기사가 탑승/하차 처리 시 학부모 알림 발송 여부를 확인할 수 없음. `RouteScreen.tsx`에 알림 전송 피드백 없음. 기사 피드백(박미영): "탑승 처리했을 때 '학부모에게 알림 전송됨'이 화면에 나와야 한다."

**목표 상태**: 탑승/하차 처리 후 학생 카드에 "학부모 알림 전송됨" 확인 텍스트 표시. 알림 실패 시 "알림 전송 실패" 경고.

**구현 방안**:
1. **백엔드** — 탑승/하차 API 응답에 알림 발송 결과 포함
   - `mark_boarded`, `mark_alighted` 응답에 `notification_sent: bool` 필드 추가
   - `DailyScheduleResponse`에 `notification_sent: bool | None` 추가

2. **모바일** — 알림 상태 표시
   - `RouteScreen.tsx` StopCard에서 탑승/하차 완료 상태일 때:
     - `notification_sent === true` → 초록색 체크 + "알림 전송됨"
     - `notification_sent === false` → 빨간 경고 + "알림 전송 실패"
   - 탑승/하차 처리 직후 Toast로 "학부모에게 알림이 전송되었습니다" 피드백

**변경 파일**:
- `backend/app/modules/scheduling/schemas.py` (`notification_sent` 필드)
- `backend/app/modules/scheduling/service.py` (알림 결과 반환)
- `mobile/src/api/schedules.ts` (`DailySchedule.notification_sent`)
- `mobile/src/screens/driver/RouteScreen.tsx` (알림 상태 표시)

**수락 기준**:
- 탑승/하차 처리 후 학생 카드에 알림 발송 성공/실패 표시
- 처리 직후 Toast 메시지로 즉시 피드백
- 알림 실패 시 명확한 경고 표시

**Android/iOS/PC 고려사항**: 모바일 기사/가이드 앱.

---

## 워크스트림 A — 법규 잔여 (8건)

---

### ITEM-REG-01: 미자격 운전자 배차 차단 스케줄러

**현재 문제**: `DriverQualification.is_qualified`는 등록/수정 시점에만 계산됨 (`auth/router.py:273-277`). 면허 만료 후에도 `is_qualified=True`가 유지됨. 차량 배정(`VehicleAssignment`) 시 `is_qualified` 검증 로직이 없음. 법률 리뷰: "면허 만료된 기사가 배정되는 것을 시스템적으로 방지할 수 없다." 보안 리뷰 N2 이슈.

**목표 상태**: (1) 매일 자정 `is_qualified` 재계산 배치. (2) `VehicleAssignment` 생성 시 `is_qualified == False`인 기사 배정 차단.

**구현 방안**:
1. **백엔드** — 일일 자격 재계산 스케줄러
   - `backend/app/modules/auth/qualification_checker.py` 신규
   - 매일 00:05 실행: 모든 `DriverQualification` 레코드에 대해 `is_qualified` 재계산
   - `license_expiry <= today` → `is_qualified = False`
   - `safety_training_expiry <= today` → `is_qualified = False`
   - `criminal_check_date + 365일 < today` → `is_qualified = False` (1년 갱신)
   - 자격 상실 시 해당 기사 + 학원 관리자에게 알림 발송
   - 30일 전 만료 임박 경고 알림도 발송

2. **백엔드** — 배차 시 자격 검증
   - `VehicleAssignment` 생성 로직에서 `DriverQualification.is_qualified == True` 확인
   - 미충족 시 `ForbiddenError("자격 미충족 운전자는 배정할 수 없습니다")`
   - 스케줄 파이프라인(`scheduling/scheduler.py`)에서도 자격 미충족 기사 배차 제외

**변경 파일**:
- `backend/app/modules/auth/qualification_checker.py` (신규)
- `backend/app/modules/vehicle_telemetry/service.py` (배정 시 자격 검증)
- `backend/app/modules/scheduling/scheduler.py` (파이프라인 자격 필터)

**수락 기준**:
- 면허 만료 기사의 `is_qualified`가 다음날 배치에서 `False`로 변경됨
- `is_qualified=False`인 기사에 대한 VehicleAssignment 생성 시 403 에러
- 스케줄 파이프라인에서 미자격 기사 자동 제외
- 만료 30일 전 경고 알림 발송

**Android/iOS/PC 고려사항**: 백엔드 전용.

---

### ITEM-REG-02: 미신고 차량 배차 차단 로직

**현재 문제**: `Vehicle.school_bus_registration_no`가 `NULL`(미신고)인 차량도 배차 가능. 보험 만료, 검사 기한 초과 차량에 대한 자동 비활성화 없음. 법률 리뷰: "미신고 차량 운행은 도로교통법 위반." R-02 잔여.

**목표 상태**: (1) `school_bus_registration_no`가 NULL인 차량 배차 차단. (2) `insurance_expiry`, `safety_inspection_expiry` 만료 차량 자동 비활성화. (3) 일일 배치로 차량 컴플라이언스 상태 갱신.

**구현 방안**:
1. **백엔드** — 차량 컴플라이언스 체커
   - `backend/app/modules/vehicle_telemetry/compliance_checker.py` 신규
   - 매일 00:10 실행:
     - `insurance_expiry <= today` → `is_active = False` + 학원 관리자 알림
     - `safety_inspection_expiry <= today` → `is_active = False`
     - `school_bus_registration_no IS NULL` → 배차 차단 (is_active는 유지하되 배차 시 검증)
   - 30일 전 만료 임박 경고

2. **백엔드** — 배차 시 차량 검증
   - `VehicleAssignment` 생성 시:
     - `vehicle.is_active == True` 확인
     - `vehicle.school_bus_registration_no IS NOT NULL` 확인
     - `vehicle.insurance_expiry > today` 확인
   - 미충족 시 `ForbiddenError`

**변경 파일**:
- `backend/app/modules/vehicle_telemetry/compliance_checker.py` (신규)
- `backend/app/modules/vehicle_telemetry/service.py` (배정 시 차량 검증)
- `backend/app/modules/scheduling/scheduler.py` (파이프라인 차량 필터)

**수락 기준**:
- 미신고 차량(`school_bus_registration_no IS NULL`)에 대한 VehicleAssignment 생성 차단
- 보험/검사 만료 차량 자동 비활성화
- 만료 30일 전 학원 관리자 경고 알림
- 스케줄 파이프라인에서 미충족 차량 자동 제외

**Android/iOS/PC 고려사항**: 백엔드 전용.

---

### ITEM-REG-03: ComplianceDocument에 통학버스 신고필증 타입 추가

**현재 문제**: `DocumentType` enum에 `SCHOOL_BUS_REGISTRATION` 항목이 없음 (`compliance/models.py:11-16`). 현재: `INSURANCE_CERT`, `POLICE_REPORT`, `SAFETY_TRAINING`, `VEHICLE_INSPECTION`, `OTHER` 5가지만 존재. 법률 리뷰 R-04: "통학버스 신고필증 문서 관리 불가."

**목표 상태**: `DocumentType`에 `SCHOOL_BUS_REGISTRATION` 추가. 학원/플랫폼 관리자가 신고필증 PDF/이미지를 업로드하고 만료 관리 가능.

**구현 방안**:
1. **백엔드** — enum 추가
   - `backend/app/modules/compliance/models.py`의 `DocumentType`에 `SCHOOL_BUS_REGISTRATION = "school_bus_registration"` 추가
   - DB migration (Alembic) 실행

2. **백엔드** — 스키마 업데이트
   - `compliance/schemas.py`의 `DocumentUploadRequest.document_type` description에 `school_bus_registration` 추가

3. **웹** — 컴플라이언스 페이지 업데이트
   - `web/src/pages/platform/PlatformCompliancePage.tsx`의 문서 유형 드롭다운에 "통학버스 신고필증" 옵션 추가

**변경 파일**:
- `backend/app/modules/compliance/models.py` (`DocumentType` enum)
- `backend/app/modules/compliance/schemas.py` (description 업데이트)
- `web/src/pages/platform/PlatformCompliancePage.tsx` (드롭다운 옵션)
- Alembic migration 파일

**수락 기준**:
- `SCHOOL_BUS_REGISTRATION` 타입으로 문서 업로드 가능
- 컴플라이언스 페이지에서 신고필증 조회/관리 가능
- 기존 5가지 타입은 영향 없음

**Android/iOS/PC 고려사항**: 웹 전용 (관리자 대시보드).

---

### ITEM-REG-04: 위치정보 이용약관 페이지

**현재 문제**: 위치정보법 제5조의2 제2항에 따라 위치기반서비스 이용약관을 제공해야 하지만, 현재 `site/src/pages/` 에 위치정보 이용약관 페이지가 없음. `Privacy.tsx`(개인정보처리방침)와 `Terms.tsx`(서비스 이용약관)만 존재. 법률 리뷰 A13: "위치정보 이용약관 작성 필수."

**목표 상태**: 랜딩 사이트에 `/location-terms` 경로로 위치정보 이용약관 페이지 추가. Footer에 링크 추가.

**구현 방안**:
1. **사이트** — 위치정보 이용약관 페이지
   - `site/src/pages/LocationTerms.tsx` 신규
   - 필수 포함 사항:
     - 위치정보 수집 목적 및 이용 범위 (아동 안전 모니터링)
     - 제3자 제공 범위 (학부모에게 차량 위치 제공)
     - 보유 기간 (GPS 데이터 180일) 및 파기 방법
     - 이용자 권리 (동의 철회, 이용 정지)
     - 위치정보관리책임자 연락처
   - React 라우터에 `/location-terms` 경로 등록

2. **사이트** — Footer 링크 추가
   - `site/src/components/Footer.tsx`의 "법적 고지" 섹션에 "위치정보 이용약관" 링크 추가

3. **모바일** — 동의 화면에서 위치정보 이용약관 링크 연결
   - 향후 동의 프로세스 고도화 시 약관 전문 열람 연동

**변경 파일**:
- `site/src/pages/LocationTerms.tsx` (신규)
- `site/src/main.tsx` (라우트 추가)
- `site/src/components/Footer.tsx` (링크 추가)

**수락 기준**:
- `/location-terms` URL로 위치정보 이용약관 페이지 접근 가능
- 위치정보법 필수 사항 (수집 목적, 제3자 제공, 보유 기간, 이용자 권리) 명시
- Footer에서 링크로 접근 가능
- 개인정보처리방침과 별개 페이지로 존재

**Android/iOS/PC 고려사항**: 웹 사이트 전용.

---

### ITEM-REG-05: 동의 이중 확인 (SMS + 앱 내)

**현재 문제**: 법정대리인 동의가 앱 내 OTP 인증만으로 처리됨. 개인정보보호법 시행령 제17조의 법정대리인 본인확인 요건에 대한 강화 필요. 법률 리뷰 A14: "OTP만으로는 시행령 제17조 요건 부족할 수 있음."

**목표 상태**: (Phase 1 MVP) 동의 생성 시 SMS 안내 + 앱 내 체크박스 이중 확인 절차. 동의서 전문 열람 기록 저장.

**구현 방안**:
1. **백엔드** — 동의 생성 시 SMS 안내 발송
   - `backend/app/modules/compliance/service.py`의 `create_consent()` 수정
   - 동의 생성 전: 법정대리인 전화번호로 "동의 확인 SMS" 발송
   - SMS 내용: "[세이프웨이키즈] {child_name}의 개인정보 수집/위치정보 이용에 대한 법정대리인 동의가 요청되었습니다. 앱에서 동의 내용을 확인해주세요."
   - 동의 레코드에 `sms_sent_at`, `consent_viewed_at` 필드 추가

2. **백엔드** — 동의서 열람 기록
   - `GuardianConsent`에 `terms_viewed_at: datetime | None` 컬럼 추가
   - 클라이언트에서 동의서 전문 열람 시 `PATCH /compliance/consents/{id}/viewed` 호출

3. **모바일** — 동의 플로우 강화
   - 동의 화면에서 각 약관(서비스 이용약관, 개인정보처리방침, 위치정보 이용약관) 전문 열람 필수
   - 각 약관 열람 완료 후에만 체크박스 활성화
   - 모든 필수 항목 체크 후 "동의합니다" 버튼 활성화

**변경 파일**:
- `backend/app/modules/compliance/service.py` (SMS 발송 + 열람 기록)
- `backend/app/modules/compliance/models.py` (`terms_viewed_at`, `sms_sent_at`)
- `backend/app/modules/compliance/router.py` (viewed 엔드포인트)
- 모바일 동의 화면 (향후 구현 — 현재 동의 플로우 UI 자체가 미구현이므로 백엔드 우선)

**수락 기준**:
- 동의 생성 시 법정대리인에게 SMS 안내 발송
- 동의서 전문 열람 시각이 DB에 기록
- 열람 없이 동의 생성 시 경고 (강제 차단은 Phase 2)

**Android/iOS/PC 고려사항**: 백엔드 + 향후 모바일 동의 화면.

---

### ITEM-REG-06: 접근통제 추가 API 감사 (IDOR 잔여)

**현재 문제**: P0에서 `get_student`, `get_consent` IDOR가 수정되었지만, 법률 리뷰 A08에서 추가 IDOR 취약점이 지적됨. 미확인 API: `GET /schedules/daily/{instance_id}`, `PATCH /students/{student_id}`, `GET /compliance/documents/{doc_id}`, `GET /notifications`. 보안 리뷰 V8: "DRIVER가 아무 instance_id에 대해 mark_boarded 가능."

**목표 상태**: 모든 리소스 접근 API에 소유권/역할 기반 접근통제 적용. IDOR 취약점 전수 점검 후 누락 API 보완.

**구현 방안**:
1. **백엔드** — 스케줄 인스턴스 접근통제
   - `scheduling/service.py`의 `mark_boarded()`, `mark_alighted()`, `mark_no_show()`:
     - `current_user`가 해당 인스턴스의 차량에 배정된 기사/가이드인지 확인
     - `VehicleAssignment`에서 `driver_id == current_user.id` 또는 `safety_escort_id == current_user.id` 검증
     - 미배정 기사의 조작 시도 시 `ForbiddenError`

2. **백엔드** — 학생 정보 수정 접근통제
   - `student_management/router.py`의 `PATCH /students/{student_id}`:
     - PARENT: `student.guardian_id == current_user.id` 확인
     - ACADEMY_ADMIN: 학원 소속 학생인지 enrollment 확인

3. **백엔드** — 접근 실패 로깅
   - 403 Forbidden 응답 시 감사 로그에 기록 (시도자, 대상 리소스, 시각)
   - 반복적 시도 시 보안 이벤트 분류

**변경 파일**:
- `backend/app/modules/scheduling/service.py` (mark_boarded/alighted 접근통제)
- `backend/app/modules/scheduling/router.py` (current_user 전달)
- `backend/app/modules/student_management/router.py` (PATCH 접근통제)
- `backend/app/modules/compliance/router.py` (문서 접근통제)

**수락 기준**:
- 미배정 기사가 다른 차량의 학생 탑승/하차 처리 시 403 에러
- 학부모가 타인의 자녀 정보 수정 시 403 에러
- 403 발생 시 감사 로그에 기록
- 기존 정상 플로우에 영향 없음

**Android/iOS/PC 고려사항**: 백엔드 전용.

---

### ITEM-REG-07: 기사/안전도우미 위치정보 동의 절차

**현재 문제**: 학부모(법정대리인)의 위치정보 동의만 존재. 기사/안전도우미는 GPS 데이터를 생성(제공)하는 주체이지만, 이들의 개인위치정보 수집에 대한 동의 절차가 없음. 법률 리뷰 A09: "기사/안전도우미 위치정보 동의 절차 추가 필요."

**목표 상태**: 기사/안전도우미 첫 로그인 시 위치정보 수집 동의 화면 표시. 동의 미완료 시 운행 기능 사용 불가.

**구현 방안**:
1. **백엔드** — 기사/가이드 동의 API
   - `backend/app/modules/compliance/router.py`에 `POST /compliance/driver-consent` 추가
   - `DriverLocationConsent` 모델 신규: `id, user_id, consent_granted, granted_at, ip_address`
   - 동의 내용: "운행 중 차량 위치정보가 수집되어 학부모/학원에 제공됩니다. 위치정보는 안전 모니터링 목적으로만 사용되며, 운행 종료 후 180일간 보관 후 파기됩니다."

2. **백엔드** — 운행 기능 동의 체크
   - `POST /gps` (GPS 업데이트), `POST /schedules/daily/route/start` (운행 시작) 시:
     - `DriverLocationConsent`가 존재하지 않으면 `403 Forbidden("위치정보 동의가 필요합니다")`

3. **모바일** — 동의 화면
   - 기사/가이드 첫 로그인 시 동의 화면 표시 (모달 또는 전체 화면)
   - 동의 내용 전문 + "동의합니다" 체크박스 + 제출
   - 동의 완료 후 정상 운행 화면으로 이동

**변경 파일**:
- `backend/app/modules/compliance/models.py` (`DriverLocationConsent` 모델)
- `backend/app/modules/compliance/router.py` (driver-consent 엔드포인트)
- `backend/app/modules/vehicle_telemetry/router.py` (GPS 업데이트 시 동의 체크)
- `mobile/src/screens/driver/` (동의 화면 컴포넌트)
- `mobile/src/navigation/DriverTabNavigator.tsx` (동의 미완료 시 차단)

**수락 기준**:
- 기사/가이드 첫 로그인 시 위치정보 동의 화면 표시
- 동의 미완료 시 GPS 업데이트, 운행 시작 불가 (403)
- 동의 완료 시 정상 운행 가능
- 동의 이력 DB 저장 (누가, 언제, 어디서 동의했는지)

**Android/iOS/PC 고려사항**: 모바일 기사/가이드 앱.

---

### ITEM-REG-08: consent_scope ConsentScopeModel 타입 정리

**현재 문제**: `ConsentScopeModel`이 Pydantic 모델로 정의되어 있으나 (`compliance/schemas.py:7-17`), `ConsentCreateRequest.consent_scope`는 여전히 `dict` 타입 (`schemas.py:22`). 클라이언트가 임의 키를 포함한 dict를 전송할 수 있음. 또한 필수 항목 기본값이 `True`라서 빈 요청으로도 동의 통과 가능. 보안 리뷰 N1, N5 이슈.

**목표 상태**: `consent_scope` 필드를 `ConsentScopeModel` 타입으로 변경. 필수 항목 기본값 제거하여 명시적 동의 강제.

**구현 방안**:
1. **백엔드** — 타입 변경
   - `ConsentCreateRequest.consent_scope: dict` → `ConsentCreateRequest.consent_scope: ConsentScopeModel`
   - Pydantic이 자동으로 타입 검증 + 추가 필드 거부

2. **백엔드** — 기본값 제거
   - `ConsentCreateRequest`의 `consent_scope` 기본값(`default_factory`) 제거
   - 클라이언트가 모든 필수 항목을 명시적으로 전송하도록 강제
   - `ConsentScopeModel`의 필수 항목(`service_terms`, `privacy_policy`, `child_info_collection`)은 기본값 없이 `Field(...)` 유지

3. **백엔드** — GuardianConsent 모델 DB 저장
   - `GuardianConsent.consent_scope`는 JSON 컬럼이므로 `ConsentScopeModel.model_dump()` 결과 저장
   - 조회 시 `ConsentScopeModel.model_validate(row.consent_scope)`로 역직렬화

**변경 파일**:
- `backend/app/modules/compliance/schemas.py` (타입 변경 + 기본값 제거)
- `backend/app/modules/compliance/service.py` (ConsentScopeModel 사용)
- 기존 테스트 수정 (consent_scope 파라미터 변경)

**수락 기준**:
- `consent_scope`에 임의 키 전송 시 422 Validation Error
- 필수 항목 미전송 시 422 에러
- 기존 동의 조회/철회 기능에 영향 없음
- 모든 관련 테스트 통과

**Android/iOS/PC 고려사항**: 백엔드 전용. 모바일/웹 클라이언트는 API 요청 포맷 변경 필요 (기존 dict → ConsentScopeModel 구조).

---

## 워크스트림 B — 프론트엔드 중심

---

### ITEM-P1-17: 스케줄/청구서 학원 이름 표시 (일부 UUID 잔존)

**현재 문제**: 학부모 앱의 `HomeScreen.tsx`와 `ScheduleScreen.tsx`에서 `academy_name`은 이미 렌더링됨 (P0에서 해결). **그러나** 웹 대시보드 `SchedulesPage.tsx:155-161`의 일일 스케줄 컬럼에서 여전히 `student_id.slice(0,8)` (UUID 앞 8글자) 표시. `web/src/types/index.ts`의 `DailySchedule` 인터페이스에 `student_name` 필드 누락. 청구서(`BillingScreen.tsx`)에도 학원 이름 미표시. 베타 재검증 N2 이슈.

**목표 상태**: 모든 화면(모바일 + 웹)에서 UUID 대신 사람이 읽을 수 있는 이름 표시.

**구현 방안**:
1. **웹** — DailySchedule 타입 업데이트
   - `web/src/types/index.ts`의 `DailySchedule` 인터페이스에 `student_name: string | null` 필드 추가
   - `academy_name`, `driver_name`, `vehicle_license_plate` 필드도 누락 시 추가

2. **웹** — 일일 스케줄 컬럼 수정
   - `web/src/pages/SchedulesPage.tsx:155-161`의 `student_id.slice(0,8)` → `student_name ?? student_id.slice(0,8)` 변경

3. **모바일** — 청구서 학원 이름 표시
   - `mobile/src/screens/parent/BillingScreen.tsx`에서 청구 항목에 `academy_name` 표시
   - 백엔드 `BillingResponse`에 `academy_name` 필드 포함 확인

**변경 파일**:
- `web/src/types/index.ts` (`DailySchedule` 인터페이스)
- `web/src/pages/SchedulesPage.tsx` (컬럼 수정)
- `mobile/src/screens/parent/BillingScreen.tsx` (학원 이름 표시)
- `backend/app/modules/billing/schemas.py` (`academy_name` 필드 확인)

**수락 기준**:
- 웹 일일 스케줄 테이블에서 `student_name` 표시 (UUID 앞 8자가 아닌 실명)
- 청구서에 학원 이름 표시
- 모든 화면에서 UUID가 사용자에게 노출되지 않음

**Android/iOS/PC 고려사항**: 모바일 + 웹.

---

### ITEM-P1-18: 학생 앱 기능 확장 (지도/ETA/알림)

**현재 문제**: `StudentTabNavigator.tsx`에 2개 탭만 존재: "내 일정" (`StudentScheduleScreen`), "내 정보" (`StudentProfileScreen`). 지도, ETA, 알림 수신 모두 없음. 학생 피드백(정민서): "학부모 앱의 데이터가 학생한테는 안 보인다." 베타 재검증 R3 이슈.

**목표 상태**: 학생 탭에 "지도" 탭 추가 (학부모 MapScreen 공유). 학생 스케줄 카드에 기사/차량 정보 표시. 학생 디바이스 알림 지원은 별도 (P2).

**구현 방안**:
1. **모바일** — 학생 탭에 지도 추가
   - `mobile/src/navigation/StudentTabNavigator.tsx`에 3번째 탭 추가:
     ```
     <Tab.Screen name="StudentMap" component={MapScreen} options={{ tabBarLabel: "지도" }} />
     ```
   - 학부모 `MapScreen`을 재사용 (동일한 차량 추적 로직)

2. **모바일** — 학생 스케줄 카드 정보 확장
   - `mobile/src/screens/student/ScheduleScreen.tsx`의 `ScheduleCard`에:
     - `driver_name` 표시 (현재 미표시)
     - `vehicle_license_plate` 표시 (현재 일부만)
     - `safety_escort_name` 표시

3. **모바일** — 프로덕션 로그인에 student 역할 추가
   - `mobile/src/screens/LoginScreen.tsx`의 `ROLE_OPTIONS`에 `{ value: 'student', label: '학생' }` 추가
   - 베타 재검증 N1 이슈 (프로덕션 빌드에서 학생 로그인 불가)

**변경 파일**:
- `mobile/src/navigation/StudentTabNavigator.tsx` (지도 탭 추가)
- `mobile/src/screens/student/ScheduleScreen.tsx` (정보 확장)
- `mobile/src/screens/LoginScreen.tsx` (ROLE_OPTIONS에 student 추가)

**수락 기준**:
- 학생 탭에 "지도" 탭이 추가되어 차량 위치 실시간 확인 가능
- 학생 스케줄 카드에 학원 이름, 기사 이름, 차량번호 표시
- 프로덕션 빌드에서 학생 역할 로그인 가능
- 학부모 MapScreen 공유로 코드 중복 없음

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱.

---

### ITEM-P1-19: ETA "N정거장 전" → 분 단위 변환

**현재 문제**: `MapScreen.tsx:117-119`에서 ETA를 `${remaining}정거장 전`으로 표시. 정거장 수는 직관성 부족. 학부모 피드백(김지영, 박성호): "몇 분 남았는지가 알고 싶다." 학생 피드백(정민서): "정거장이 뭔지 모르겠다."

**목표 상태**: ETA를 "약 N분 후 도착 예정"으로 표시. 정거장 간 평균 소요시간(3분) 기반 추정.

**구현 방안**:
1. **모바일** — ETA 분 단위 변환
   - `mobile/src/screens/parent/MapScreen.tsx`의 ETA 계산 로직 수정:
     - 현재: `${remaining}정거장 전`
     - 변경: `약 ${remaining * AVG_STOP_MINUTES}분 후 도착` (AVG_STOP_MINUTES = 3)
   - 차량 속도/거리 기반 정밀 ETA는 P2 (백엔드 routing engine 연동 필요)

2. **모바일** — sendToMap 메시지 변경
   - `setEta` 메시지의 `text`를 분 단위로 변경
   - 지도 위 오버레이에 "약 N분" 표시

**변경 파일**:
- `mobile/src/screens/parent/MapScreen.tsx` (ETA 텍스트 변경)

**수락 기준**:
- ETA가 "N정거장 전" 대신 "약 N분 후 도착"으로 표시
- 0정거장(다음이 본인) → "곧 도착합니다"
- 스케줄이 없거나 모두 완료 시 ETA 미표시

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱. 지도 WebView 내 오버레이.

---

### ITEM-P1-20: 기사 앱 버튼 hitSlop 적용

**현재 문제**: 기사 앱 `RouteScreen.tsx`의 Pressable 버튼들에 `hitSlop`이 적용되지 않음. 버튼 크기는 P0에서 60px로 확대했지만 터치 영역 확장이 없어 테두리 밖 터치 시 미반응. 기사 피드백(김영수): "장갑 끼고 운전 중에는 아슬아슬하게 누를 때가 많다." 베타 재검증 N5 이슈.

**목표 상태**: 기사 앱 모든 Pressable 버튼에 `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` 적용.

**구현 방안**:
1. **모바일** — hitSlop 일괄 적용
   - `mobile/src/screens/driver/RouteScreen.tsx`의 모든 Pressable 컴포넌트에 `hitSlop` prop 추가
   - 탑승/하차/미탑승/길안내/되돌리기/차량점검 버튼 모두 대상

**변경 파일**:
- `mobile/src/screens/driver/RouteScreen.tsx` (hitSlop 추가)

**수락 기준**:
- 모든 기사 앱 Pressable 버튼에 hitSlop 적용
- 버튼 테두리 8px 밖에서도 터치 이벤트 인식
- 기존 레이아웃에 시각적 변화 없음

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱. `hitSlop`은 React Native 기본 지원.

---

### ITEM-P1-21: 픽업 지점 마커 지도 표시

**현재 문제**: 학부모 앱 `MapScreen.tsx`에서 버스 마커만 표시. 픽업 포인트 마커가 지도에 없음. `setStops` 메시지 타입은 `mapHtml.ts`에 처리 코드가 있을 수 있으나 호출되지 않음. 학부모 피드백(김지영): "아이 픽업 장소가 지도에 안 보인다."

**목표 상태**: 학부모 앱 지도에 자녀의 픽업 지점을 마커로 표시 (파란색 핀). 버스 마커(노란색) + 픽업 마커(파란색)로 구분.

**구현 방안**:
1. **모바일** — 픽업 지점 마커 전송
   - `MapScreen.tsx`에서 스케줄 템플릿 로드 후 픽업 좌표를 지도에 전송:
     ```typescript
     templates.forEach(t => {
       if (t.is_active && t.pickup_latitude && t.pickup_longitude) {
         sendToMap({
           type: "addPickupMarker",
           lat: t.pickup_latitude,
           lng: t.pickup_longitude,
           label: t.pickup_address ?? "픽업 지점",
         });
       }
     });
     ```

2. **지도 HTML** — 픽업 마커 렌더링
   - `mobile/src/constants/mapHtml.ts`에 `addPickupMarker` 메시지 핸들러 추가
   - 파란색 마커 아이콘으로 픽업 지점 표시
   - 마커 클릭 시 주소 InfoWindow 표시

**변경 파일**:
- `mobile/src/screens/parent/MapScreen.tsx` (픽업 마커 전송)
- `mobile/src/constants/mapHtml.ts` (addPickupMarker 핸들러)

**수락 기준**:
- 지도에 픽업 지점 마커(파란색)가 표시됨
- 버스 마커(노란색)와 시각적으로 구분됨
- 스케줄 템플릿이 없거나 비활성인 경우 마커 미표시
- 다자녀인 경우 각 자녀의 픽업 지점 모두 표시

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱. 카카오맵 WebView 내 마커.

---

### ITEM-P1-22: 자녀별 필터

**현재 문제**: 다자녀 가정에서 홈/스케줄 화면에 모든 자녀의 스케줄이 섞여서 표시됨. API에 `student_id` 파라미터가 존재하지만 (`schedules.ts:67`) UI에서 활용하지 않음. 학부모 피드백(박성호): "아이 둘인데 6개 스케줄이 섞여서 나온다."

**목표 상태**: 홈/스케줄 화면 상단에 자녀별 필터 탭 추가 — "전체", "서준", "하윤" 등. 탭 선택 시 해당 자녀 스케줄만 표시.

**구현 방안**:
1. **모바일** — 필터 탭 컴포넌트
   - `HomeScreen.tsx`, `ScheduleScreen.tsx` 상단에 수평 스크롤 필터 탭 추가
   - "전체" + 각 자녀 이름 탭
   - 선택 시 `listDailySchedules(date, studentId)` 호출하여 필터링

2. **모바일** — 상태 관리
   - `useState<string | null>(null)` — null이면 전체, UUID면 특정 자녀
   - 자녀가 1명이면 필터 탭 미표시

**변경 파일**:
- `mobile/src/screens/parent/HomeScreen.tsx` (필터 탭 추가)
- `mobile/src/screens/parent/ScheduleScreen.tsx` (필터 탭 추가)

**수락 기준**:
- 다자녀(2명 이상) 가정에서 자녀별 필터 탭 표시
- 탭 선택 시 해당 자녀 스케줄만 표시
- "전체" 탭 선택 시 모든 자녀 스케줄 표시
- 자녀 1명인 경우 필터 탭 미표시
- 새로고침/날짜 변경 시 필터 상태 유지

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱.

---

### ITEM-P1-26: 기사 앱 다음 정류장 하이라이트

**현재 문제**: `RouteScreen.tsx`의 학생 카드 목록에서 완료/미완료 정류장이 동일 스타일. 현재 대상(다음 처리할 학생)이 시각적으로 강조되지 않음. 기사 피드백(김영수): "10명 중 5명 완료했으면 6번째가 눈에 확 띄어야 한다."

**목표 상태**: 다음 처리할 학생 카드에 좌측 파란색 보더 + 배경 하이라이트. 완료된 카드는 투명도 감소.

**구현 방안**:
1. **모바일** — 카드 하이라이트 로직
   - `RouteScreen.tsx`의 StopCard 목록에서:
     - 완료(`completed`)/미탑승(`no_show`)/취소(`cancelled`) 카드: `opacity: 0.5`
     - 탑승 중(`boarded`) 카드: 정상 표시
     - 다음 처리 대상(`scheduled` 중 첫 번째): `borderLeftWidth: 4, borderLeftColor: Colors.primary, backgroundColor: Colors.primaryLight`
   - "다음 대상" 판별: `schedules.find(s => s.status === 'scheduled')` — 첫 번째 예정 학생

**변경 파일**:
- `mobile/src/screens/driver/RouteScreen.tsx` (하이라이트 스타일)

**수락 기준**:
- 다음 처리할 학생 카드가 파란색 좌측 보더 + 배경색으로 강조
- 완료/미탑승/취소 카드는 반투명 표시
- 모든 학생 처리 완료 시 하이라이트 없음
- FlatList 스크롤 시에도 하이라이트 유지

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱.

---

### ITEM-P1-29: 랜딩 사이트 앱 스크린샷 추가

**현재 문제**: 전체 랜딩 페이지에 이미지 0개. 이모지로만 비주얼 대체 중. 마케팅 피드백: "앱이 이렇게 생겼습니다'를 보여줄 시각 자료가 없다. 이모지 6개가 핵심 기능 비주얼의 전부다."

**목표 상태**: 히어로 섹션에 앱 목업 이미지 추가. 기능 섹션에 스크린샷 또는 일러스트 추가.

**구현 방안**:
1. **사이트** — 히어로 섹션 앱 목업
   - `site/src/pages/Landing.tsx`의 히어로 섹션에 앱 목업 이미지 배치
   - 이미지 파일: `site/public/images/app-mockup.png` (디자인팀 제공 필요)
   - 이미지 미제공 시: CSS로 폰 프레임 + 스크린샷 placeholder 구현

2. **사이트** — 기능 섹션 아이콘 교체
   - `FEATURES` 배열의 `icon` 필드: 이모지 → SVG 아이콘 또는 일러스트 이미지
   - 이미지 미제공 시: Heroicons 또는 Lucide 아이콘으로 교체 (이모지보다 전문적)

**변경 파일**:
- `site/src/pages/Landing.tsx` (히어로 이미지 + 기능 아이콘)
- `site/public/images/` (앱 목업 이미지 — 디자인팀 제공)

**수락 기준**:
- 히어로 섹션에 앱 목업 또는 placeholder 이미지 표시
- 기능 섹션 아이콘이 이모지에서 전문적인 아이콘/일러스트로 교체
- 반응형 디자인 유지 (모바일/태블릿/데스크톱)
- 이미지 최적화 (WebP, lazy loading)

**Android/iOS/PC 고려사항**: 웹 사이트. 반응형.

---

### ITEM-P1-30: OG 태그 + SEO 메타데이터

**현재 문제**: 카카오톡/SNS 공유 시 프리뷰가 뜨지 않음. `site/index.html`에 OG 태그 없음. `sitemap.xml`, `robots.txt`도 없음. 마케팅 피드백: "카톡으로 공유하면 아무것도 안 나온다."

**목표 상태**: OG 태그 + Twitter Card 메타데이터 추가. sitemap.xml, robots.txt 생성.

**구현 방안**:
1. **사이트** — index.html 메타데이터
   - `site/index.html`의 `<head>`에 추가:
     ```html
     <meta property="og:title" content="SAFEWAY KIDS — 어린이 학원 셔틀 안전 플랫폼" />
     <meta property="og:description" content="AI 기반 실시간 위치 추적, 탑승/하차 알림, 안전도우미 동승. 아이들의 안전한 통학길." />
     <meta property="og:image" content="/images/og-image.png" />
     <meta property="og:url" content="https://safeway-kids.kr" />
     <meta property="og:type" content="website" />
     <meta name="twitter:card" content="summary_large_image" />
     ```

2. **사이트** — sitemap.xml + robots.txt
   - `site/public/sitemap.xml` — 메인, 개인정보처리방침, 이용약관, 위치정보약관 페이지
   - `site/public/robots.txt` — `Allow: /`, `Sitemap: https://safeway-kids.kr/sitemap.xml`

3. **사이트** — OG 이미지
   - `site/public/images/og-image.png` — 1200x630px (디자인팀 제공 또는 Canva 생성)

**변경 파일**:
- `site/index.html` (메타 태그)
- `site/public/sitemap.xml` (신규)
- `site/public/robots.txt` (신규)
- `site/public/images/og-image.png` (신규)

**수락 기준**:
- 카카오톡/SNS 공유 시 제목, 설명, 이미지 프리뷰 표시
- `sitemap.xml` 접근 가능
- `robots.txt` 접근 가능
- 페이지별 title 태그 적절히 설정

**Android/iOS/PC 고려사항**: 웹 사이트.

---

### ITEM-P1-34: 온보딩/첫 이용 가이드

**현재 문제**: 앱 첫 실행 시 사용법 안내 없음. 학생 피드백(정민서): "뭘 어떻게 쓰는 건지 모르겠다." 학원 피드백(정은서 원장): "초기 설정 마법사가 없다." CS 리뷰: "첫 주 문의의 40%가 '어떻게 쓰나요'."

**목표 상태**: 학부모/학생/기사 앱 첫 실행 시 3~4장 슬라이드 온보딩 화면. 학원 관리자는 웹 대시보드 첫 접속 시 설정 마법사 (P2).

**구현 방안**:
1. **모바일** — 온보딩 화면 컴포넌트
   - `mobile/src/screens/OnboardingScreen.tsx` 신규
   - 3~4장 슬라이드:
     - 학부모: "실시간 추적" → "탑승/하차 알림" → "SOS 긴급 버튼" → "시작하기"
     - 기사: "학생 목록 확인" → "탑승/하차 처리" → "네비 연동" → "시작하기"
     - 학생: "오늘 일정 확인" → "지도에서 버스 위치" → "SOS 버튼" → "시작하기"
   - `AsyncStorage`로 `onboarding_completed` 플래그 저장
   - 첫 로그인 시에만 표시, 이후 건너뛰기

2. **모바일** — 네비게이션 통합
   - `RootNavigator.tsx`에서 로그인 후 `onboarding_completed` 확인
   - 미완료 시 `OnboardingScreen` 표시 → 완료 후 탭 네비게이터

**변경 파일**:
- `mobile/src/screens/OnboardingScreen.tsx` (신규)
- `mobile/src/navigation/RootNavigator.tsx` (온보딩 분기)

**수락 기준**:
- 첫 로그인 시 온보딩 슬라이드 3~4장 표시
- "건너뛰기" 버튼으로 즉시 앱 진입 가능
- 한번 완료 후 재표시 안 됨 (AsyncStorage)
- 역할별(학부모/기사/학생) 맞춤 콘텐츠

**Android/iOS/PC 고려사항**: iOS/Android 모바일 앱.

---

### ITEM-P1-35: "폴링 모드" 등 기술 용어 교체

**현재 문제**: `MapScreen.tsx:170`에 `"폴링 모드"` 텍스트 그대로 표시. 웹 대시보드에도 "일일 파이프라인 실행" 같은 개발 용어 사용. 학부모 피드백(김지영): "'폴링 모드'가 뭔가요?" CS 피드백: "기술 용어 문의가 많다."

**목표 상태**: 모든 사용자 대면 텍스트에서 기술 용어 제거. 사용자 친화적 메시지로 교체.

**구현 방안**:
1. **모바일** — MapScreen 용어 교체
   - `MapScreen.tsx:170` `"폴링 모드"` → `"잠시 위치 업데이트가 지연될 수 있습니다"`

2. **웹** — SchedulesPage 용어 교체
   - `SchedulesPage.tsx`의 "일일 파이프라인 실행" → "배차 자동 생성"
   - "파이프라인" → "자동 배차"

3. **기타** — 전체 코드베이스 용어 검색
   - "polling", "pipeline", "instance", "websocket" 등 사용자 노출 텍스트 검색
   - 각각 사용자 친화적 대안으로 교체

**변경 파일**:
- `mobile/src/screens/parent/MapScreen.tsx` (폴링 모드 → 지연 안내)
- `web/src/pages/SchedulesPage.tsx` (파이프라인 → 자동 배차)

**수락 기준**:
- "폴링 모드" 텍스트가 사용자 앱에서 표시되지 않음
- "파이프라인" 텍스트가 관리자 대시보드에서 사용자 친화적 용어로 교체
- 다른 기술 용어 노출 여부 확인 완료

**Android/iOS/PC 고려사항**: 모바일 + 웹.

---

### ITEM-P1-36: 가격 정보 랜딩 공개

**현재 문제**: 랜딩 사이트에 가격 정보 전혀 없음. 학원이 가장 궁금해하는 비용 정보 미공개. 마케팅 피드백: "비용이 안 나오면 '도입 문의하기'도 안 누른다." CFO 리뷰: "가격 모델이 확정되지 않았으니 정확한 숫자는 어렵겠지만 가이드라인이라도."

**목표 상태**: 랜딩 사이트에 가격 가이드라인 섹션 추가. "정확한 요금은 학원 규모에 따라 상담 후 안내" + 견적 요청 CTA.

**구현 방안**:
1. **사이트** — 가격 섹션 추가
   - `site/src/pages/Landing.tsx`에 가격 가이드라인 섹션 추가 (contact 섹션 위)
   - 내용:
     - "합리적인 요금, 투명한 정산"
     - 3가지 플랜 카드 (디자인만, 실제 가격은 "문의"):
       - 소규모 학원 (30명 이하): "학생당 월 OO원부터" 또는 "상담 후 안내"
       - 중규모 학원 (30~100명): "볼륨 할인 적용"
       - 대규모 학원 (100명+): "맞춤 견적"
     - "무료 파일럿 프로그램 운영 중" 배지
     - "견적 받기" CTA → #contact 앵커 이동

**변경 파일**:
- `site/src/pages/Landing.tsx` (가격 섹션 추가)

**수락 기준**:
- 랜딩 페이지에 가격 가이드라인 섹션 표시
- 구체적 가격 대신 "상담 후 안내" 또는 범위 표시
- "견적 받기" CTA가 문의 폼으로 이동
- 반응형 디자인 유지

**Android/iOS/PC 고려사항**: 웹 사이트. 반응형.

---

## 의존성 정리

### 워크스트림 A 내부 의존성
- ITEM-P1-25 (알림 이력) → ITEM-P1-32 (수동 SMS 발송) — NotificationLog 모델 공유
- ITEM-REG-01 (자격 스케줄러) → ITEM-REG-02 (차량 스케줄러) — 동일 배치 프레임워크
- ITEM-REG-05 (동의 이중 확인) → ITEM-REG-04 (위치정보 약관) — 약관 링크 참조

### 워크스트림 간 의존성
- ITEM-P1-18 (학생 앱 확장) → ITEM-P1-19 (ETA 분 단위) — MapScreen 공유
- ITEM-P1-31 (기사 관리 UI) → ITEM-REG-01 (자격 스케줄러) — 자격 상태 표시

### 독립 실행 가능 항목 (의존성 없음)
- ITEM-P1-15 (운행 지연 알림)
- ITEM-P1-16 (학원 도착 확인)
- ITEM-P1-17 (UUID 잔존 수정)
- ITEM-P1-20 (hitSlop)
- ITEM-P1-21 (픽업 마커)
- ITEM-P1-22 (자녀별 필터)
- ITEM-P1-26 (다음 정류장 하이라이트)
- ITEM-P1-28 (특이사항 표시)
- ITEM-P1-29 (스크린샷)
- ITEM-P1-30 (OG 태그)
- ITEM-P1-33 (알림 확인 표시)
- ITEM-P1-34 (온보딩)
- ITEM-P1-35 (기술 용어 교체)
- ITEM-P1-36 (가격 정보)
- ITEM-REG-03 (신고필증 타입)
- ITEM-REG-07 (기사 위치정보 동의)
- ITEM-REG-08 (consent_scope 타입 정리)

---

## 구현 우선순위 권장

### 즉시 착수 (1~2시간, 독립 실행)
1. ITEM-P1-17 — UUID 잔존 수정 (웹 타입 + 컬럼)
2. ITEM-P1-20 — hitSlop 적용
3. ITEM-P1-35 — 기술 용어 교체
4. ITEM-REG-03 — 신고필증 타입 추가
5. ITEM-REG-08 — consent_scope 타입 정리

### 단기 착수 (반나절, 독립 실행)
6. ITEM-P1-19 — ETA 분 단위 변환
7. ITEM-P1-22 — 자녀별 필터
8. ITEM-P1-26 — 다음 정류장 하이라이트
9. ITEM-P1-21 — 픽업 마커
10. ITEM-P1-30 — OG 태그 + SEO

### 중기 착수 (1일)
11. ITEM-P1-15 — 운행 지연 알림
12. ITEM-P1-16 — 학원 도착 확인
13. ITEM-P1-18 — 학생 앱 확장
14. ITEM-P1-28 — 특이사항 표시
15. ITEM-P1-33 — 알림 확인 표시
16. ITEM-P1-34 — 온보딩
17. ITEM-REG-07 — 기사 위치정보 동의

### 장기 착수 (2~3일)
18. ITEM-P1-25 — 알림 이력 DB + UI
19. ITEM-P1-24 — CS 학생 통합 조회
20. ITEM-P1-27 — 운행 시작/종료
21. ITEM-P1-31 — 기사 관리 UI
22. ITEM-P1-32 — 수동 SMS 발송
23. ITEM-P1-23 — 메시지 기능
24. ITEM-P1-29 — 앱 스크린샷 (디자인 의존)
25. ITEM-P1-36 — 가격 정보 (사업팀 의존)
26. ITEM-REG-01 — 자격 스케줄러
27. ITEM-REG-02 — 차량 컴플라이언스 스케줄러
28. ITEM-REG-04 — 위치정보 약관
29. ITEM-REG-05 — 동의 이중 확인
30. ITEM-REG-06 — IDOR 전수 점검

---

## 총 변경 파일 요약

| 영역 | 신규 파일 | 수정 파일 |
|------|----------|----------|
| 백엔드 | ~10 | ~15 |
| 모바일 | ~3 | ~10 |
| 웹 | ~3 | ~5 |
| 사이트 | ~4 | ~3 |
| **합계** | **~20** | **~33** |

---

*기획서 종료 — 기획 Lead*
