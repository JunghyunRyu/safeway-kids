# P2 개선 기획서 (25건)

**작성일**: 2026-03-22
**작성자**: 기획 Lead
**입력 자료**:
- `artifacts/reports/2026-03-21-user-feedback-consolidated.md` (P2 #37~#61)
- `artifacts/reviews/2026-03-22-beta-p1-consolidated.md` (미해결 P2 항목)
- `artifacts/reviews/2026-03-22-beta-parent-student.md`
- `artifacts/reviews/2026-03-22-beta-driver-guide.md`
- `artifacts/reviews/2026-03-22-beta-academy-cfo.md`
**상태**: FINAL

---

## 워크스트림 분류

| 워크스트림 | 범위 | 항목 수 |
|-----------|------|---------|
| **A — 백엔드 중심** | API, 모델, 알림, CS 기능, 컴플라이언스 | 12 |
| **B — 프론트엔드 중심** | 모바일 UI/UX, 웹 대시보드, 랜딩 사이트 | 13 |

---

## 워크스트림 A — 백엔드 중심 (12건)

---

### ITEM-P2-37: 자녀 프로필 관리 (학부모)

**현재 문제**: `mobile/src/screens/parent/ProfileScreen.tsx`는 사용자(학부모) 자신의 프로필만 표시. 자녀의 알레르기, 특이사항, 비상연락처를 확인/수정할 수 없음. `backend/app/modules/student_management/` 모듈에 학생 수정 API는 있으나 학부모 전용 수정 엔드포인트 미제공.

**목표 상태**: 학부모 앱에 "자녀 관리" 화면 추가. 자녀별 알레르기, 특이사항, 비상연락처, 학교명 등을 조회/수정 가능.

**구현 방안**:
1. **백엔드** — `PATCH /students/{student_id}/profile` 엔드포인트 추가
   - `require_roles(UserRole.PARENT)` + guardian_id 검증 (본인 자녀만)
   - 수정 가능 필드: `special_notes`, `allergies`, `emergency_contact`, `school_name`, `grade`
   - `backend/app/modules/student_management/router.py`에 추가
   - `backend/app/modules/student_management/schemas.py`에 `StudentProfileUpdateRequest` 스키마 추가
2. **모바일** — `mobile/src/screens/parent/ChildProfileScreen.tsx` 신규 생성
   - 자녀 목록 → 선택 → 프로필 편집 폼
   - `mobile/src/api/students.ts`에 `updateStudentProfile()` 함수 추가
   - ParentTabNavigator에 "자녀 관리" 탭 추가 또는 ProfileScreen 내 섹션

**변경 파일**:
- `backend/app/modules/student_management/router.py` (수정)
- `backend/app/modules/student_management/schemas.py` (수정)
- `mobile/src/screens/parent/ChildProfileScreen.tsx` (신규)
- `mobile/src/api/students.ts` (수정)
- `mobile/src/navigation/ParentTabNavigator.tsx` (수정)

**수락 기준**:
- [  ] 학부모가 본인 자녀의 특이사항/알레르기/비상연락처 조회 가능
- [  ] 학부모가 본인 자녀의 정보 수정 가능 (타인 자녀 수정 불가)
- [  ] 수정된 정보가 기사 화면(`DriverDailyScheduleResponse`)에 즉시 반영

**Android/iOS/PC 고려사항**: 모바일 전용 화면. 웹 대시보드 StudentsPage에서 관리자 수정은 기존 지원.

---

### ITEM-P2-40: 보조 보호자 등록

**현재 문제**: `backend/app/modules/student_management/models.py`의 `Student` 모델에 `guardian_id`가 단일 FK. 배우자/조부모 등 보조 보호자가 알림을 수신할 수 없음. 학부모 피드백: "남편도 앱에서 확인할 수 있어야 한다."

**목표 상태**: 학생당 최대 3명의 보조 보호자 등록. 보조 보호자도 알림 수신 + 앱 조회 가능.

**구현 방안**:
1. **백엔드** — `SecondaryGuardian` 모델 신규
   - `backend/app/modules/student_management/models.py`에 추가
   - 필드: id, student_id, guardian_id(FK→users), relationship("배우자","조부모","기타"), is_active, created_at
   - UniqueConstraint(student_id, guardian_id)
2. **백엔드** — API
   - `POST /students/{student_id}/guardians` — 보조 보호자 추가 (주 보호자만 가능)
   - `GET /students/{student_id}/guardians` — 목록 조회
   - `DELETE /students/{student_id}/guardians/{guardian_id}` — 삭제
3. **백엔드** — 알림 확장
   - `notification/service.py`의 알림 발송 시 `SecondaryGuardian` 테이블 조회 → 보조 보호자에게도 FCM/SMS 발송
4. **모바일** — ChildProfileScreen에 "보조 보호자" 섹션 추가

**변경 파일**:
- `backend/app/modules/student_management/models.py` (수정)
- `backend/app/modules/student_management/router.py` (수정)
- `backend/app/modules/student_management/schemas.py` (수정)
- `backend/app/modules/notification/service.py` (수정)
- `mobile/src/screens/parent/ChildProfileScreen.tsx` (수정)

**수락 기준**:
- [  ] 주 보호자가 보조 보호자 등록/삭제 가능
- [  ] 보조 보호자도 탑승/하차/지연 알림 수신
- [  ] 보조 보호자가 앱 로그인 후 해당 자녀 스케줄 조회 가능
- [  ] 학생당 보조 보호자 최대 3명 제한

**Android/iOS/PC 고려사항**: 모바일 앱 + 백엔드. 웹에서는 관리자가 확인만.

---

### ITEM-P2-41: 알림 설정 커스터마이징

**현재 문제**: `backend/app/modules/notification/service.py`에서 모든 알림을 무조건 발송. 학부모가 알림 유형별(탑승/하차/지연/도착확인) on/off 선택 불가.

**목표 상태**: 사용자별 알림 설정 테이블 + 모바일 설정 화면.

**구현 방안**:
1. **백엔드** — `NotificationPreference` 모델
   - `backend/app/modules/notification/models.py`에 추가
   - 필드: id, user_id(FK), channel("fcm"/"sms"), notification_type("boarding"/"alighting"/"delay"/"arrival"/"no_show"/"sos"), enabled(bool)
   - 기본값: 모두 enabled=True
2. **백엔드** — API
   - `GET /notifications/preferences` — 내 설정 조회
   - `PATCH /notifications/preferences` — 설정 업데이트
3. **백엔드** — 발송 전 필터
   - `notification/service.py`에서 발송 전 preference 조회 → enabled=False면 스킵
   - SOS 알림은 preference 무시 (항상 발송)
4. **모바일** — `mobile/src/screens/parent/NotificationSettingsScreen.tsx` 신규
   - 토글 스위치 UI: 유형별/채널별 on/off

**변경 파일**:
- `backend/app/modules/notification/models.py` (수정)
- `backend/app/modules/notification/router.py` (수정)
- `backend/app/modules/notification/service.py` (수정)
- `mobile/src/screens/parent/NotificationSettingsScreen.tsx` (신규)
- `mobile/src/api/notifications.ts` (수정)

**수락 기준**:
- [  ] 알림 유형별 on/off 설정 가능
- [  ] SOS 알림은 설정 무관 항상 발송
- [  ] 설정 변경 즉시 반영

**Android/iOS/PC 고려사항**: 모바일 전용 설정 화면.

---

### ITEM-P2-46: 학생 디바이스 알림 지원

**현재 문제**: 알림은 `guardian_id` 기준 학부모에게만 발송. 학생 본인 폰(Expo Go)에서 탑승/하차 알림 미수신. 학생 피드백: "나도 버스 온다고 알려주면 좋겠다."

**목표 상태**: student 역할 사용자에게도 해당 학생의 알림 발송.

**구현 방안**:
1. **백엔드** — 알림 발송 시 student 사용자 조회
   - `notification/service.py`에서 `send_boarding_notification` 등 호출 시 student_id → User 테이블에서 역할=student인 사용자 FCM 토큰 조회
   - 학생-사용자 매핑: Student.id ↔ User(role=student) 연결 필요 → `Student` 모델에 `user_id: UUID | None` FK 추가
2. **모바일** — 학생 앱에서 FCM 토큰 등록
   - 학생 로그인 시 FCM 토큰 서버 등록

**변경 파일**:
- `backend/app/modules/student_management/models.py` (수정 — user_id FK)
- `backend/app/modules/notification/service.py` (수정)
- `backend/app/modules/auth/router.py` (수정 — 학생 FCM 등록)

**수락 기준**:
- [  ] 학생 역할 사용자가 본인 탑승/하차 알림 수신
- [  ] 학부모 알림과 중복 없이 각각 발송

**Android/iOS/PC 고려사항**: 모바일 전용. Expo Push Notification 활용.

---

### ITEM-P2-47: 기사 일괄 탑승 버튼

**현재 문제**: `mobile/src/screens/driver/RouteScreen.tsx`에서 동일 정류장 복수 학생을 한 명씩 탑승 처리해야 함. 기사 피드백(이상철): "같은 곳에서 3명 타는데 버튼 3번 누르기 귀찮다."

**목표 상태**: 동일 픽업 주소의 미탑승 학생을 "일괄 탑승" 한 번에 처리.

**구현 방안**:
1. **백엔드** — `POST /schedules/daily/batch-board` 엔드포인트
   - Request body: `{ instance_ids: UUID[] }`
   - 각 instance에 대해 `mark_boarded` 호출 (트랜잭션 내)
   - `require_roles(UserRole.DRIVER, UserRole.SAFETY_ESCORT)`
2. **모바일** — RouteScreen에 "일괄 탑승" 버튼
   - 동일 `pickup_address`의 scheduled 학생이 2명 이상일 때 표시
   - Alert 확인 → batch API 호출

**변경 파일**:
- `backend/app/modules/scheduling/router.py` (수정)
- `backend/app/modules/scheduling/service.py` (수정)
- `mobile/src/screens/driver/RouteScreen.tsx` (수정)
- `mobile/src/api/schedules.ts` (수정)

**수락 기준**:
- [  ] 동일 정류장 2명 이상 시 "일괄 탑승" 버튼 표시
- [  ] 일괄 처리 후 각 학생 알림 개별 발송
- [  ] 1명만 있으면 기존 개별 탑승 버튼만 표시

**Android/iOS/PC 고려사항**: 모바일 기사 앱 전용.

---

### ITEM-P2-49: 기사 특이사항 메모 기능

**현재 문제**: 기사가 운행 중 발생한 특이사항("김민수 오늘 차멀미 호소")을 기록할 곳이 없음.

**목표 상태**: 기사가 학생별 일일 메모를 남기고, 학원 관리자가 조회 가능.

**구현 방안**:
1. **백엔드** — `DriverMemo` 모델
   - `backend/app/modules/scheduling/models.py`에 추가
   - 필드: id, daily_schedule_id(FK), driver_id(FK→users), memo(Text), created_at
2. **백엔드** — API
   - `POST /schedules/daily/{instance_id}/memo` — 메모 등록
   - `GET /schedules/daily/{instance_id}/memo` — 조회
3. **모바일** — StopCard에 "메모" 아이콘 버튼 추가
   - 탭 → TextInput 모달 → 저장

**변경 파일**:
- `backend/app/modules/scheduling/models.py` (수정)
- `backend/app/modules/scheduling/router.py` (수정)
- `mobile/src/screens/driver/RouteScreen.tsx` (수정)

**수락 기준**:
- [  ] 기사가 학생별 메모 등록 가능
- [  ] 메모가 학원 관리자 대시보드에서 조회 가능
- [  ] 메모는 해당일자에만 유효

**Android/iOS/PC 고려사항**: 모바일 기사 앱 + 웹 대시보드.

---

### ITEM-P2-50: 하차 시 인수자 확인 기능

**현재 문제**: 초등 저학년은 보호자 인수 원칙이나, 누가 인수했는지 기록 안 됨. P1-16 "도착 확인"은 학원 인계만 커버.

**목표 상태**: 하차 시 인수자 유형(보호자/학원직원/자가귀가) 기록.

**구현 방안**:
1. **백엔드** — `DailyScheduleInstance`에 `handoff_type: String(20) | None` 컬럼 추가
   - 값: "guardian", "academy_staff", "self", null
2. **백엔드** — `mark_alighted` 서비스에 `handoff_type` 파라미터 추가
3. **모바일** — 하차 처리 시 인수자 선택 Alert 추가

**변경 파일**:
- `backend/app/modules/scheduling/models.py` (수정)
- `backend/app/modules/scheduling/service.py` (수정)
- `backend/app/modules/scheduling/schemas.py` (수정)
- `mobile/src/screens/driver/RouteScreen.tsx` (수정)

**수락 기준**:
- [  ] 하차 처리 시 인수자 유형 선택 필수
- [  ] 인수자 유형이 DB에 기록
- [  ] 학원 대시보드에서 인수자 유형 확인 가능

**Android/iOS/PC 고려사항**: 모바일 기사 앱.

---

### ITEM-P2-52: 스케줄 실시간 갱신 (WebSocket)

**현재 문제**: `mobile/src/screens/driver/RouteScreen.tsx`에서 `useFocusEffect`로만 데이터 로드. 학부모가 취소해도 기사 화면에 즉시 반영 안 됨 — 화면 전환 필요. 기사 피드백: "학부모가 취소했는데 나한테는 안 보여서 헛다리 짚었다."

**목표 상태**: 스케줄 변경(취소/추가) 시 기사 앱에 WebSocket 또는 FCM으로 즉시 갱신.

**구현 방안**:
1. **백엔드** — 스케줄 변경 이벤트 발행
   - `cancel_daily_schedule()` 호출 시 해당 vehicle_id의 WebSocket 채널로 `schedule_updated` 이벤트 브로드캐스트
   - 기존 `vehicle_telemetry/websocket.py`의 WebSocket 인프라 활용
2. **모바일** — RouteScreen에서 WebSocket 구독
   - vehicle_id 기반 채널 구독 → `schedule_updated` 수신 시 `load()` 재호출
   - fallback: 30초 polling

**변경 파일**:
- `backend/app/modules/scheduling/service.py` (수정)
- `backend/app/modules/vehicle_telemetry/websocket.py` (수정)
- `mobile/src/screens/driver/RouteScreen.tsx` (수정)

**수락 기준**:
- [  ] 학부모 취소 시 기사 화면에 10초 이내 반영
- [  ] WebSocket 연결 실패 시 30초 polling fallback

**Android/iOS/PC 고려사항**: 모바일 기사 앱.

---

### ITEM-P2-53: 학원 컴플라이언스 직접 관리

**현재 문제**: `web/src/components/Layout.tsx`의 `academyNavItems`에 "컴플라이언스" 메뉴 없음. 플랫폼 관리자만 접근 가능. 학원 피드백: "보험증서 올리려면 관리자한테 부탁해야 한다."

**목표 상태**: 학원 관리자가 자기 학원의 컴플라이언스 문서를 직접 업로드/관리.

**구현 방안**:
1. **백엔드** — 학원 관리자용 컴플라이언스 API 권한 확장
   - 기존 `compliance/router.py`의 문서 업로드 API에 `UserRole.ACADEMY_ADMIN` 추가
   - academy_id 검증: 본인 학원 문서만 관리
2. **웹** — `academyNavItems`에 "컴플라이언스" 메뉴 추가
   - 기존 `PlatformCompliancePage` 컴포넌트를 academy_id 필터로 재사용

**변경 파일**:
- `backend/app/modules/compliance/router.py` (수정)
- `web/src/components/Layout.tsx` (수정)
- `web/src/App.tsx` (수정 — Route 추가)

**수락 기준**:
- [  ] 학원 관리자가 자기 학원 컴플라이언스 문서 업로드 가능
- [  ] 타 학원 문서 접근 불가
- [  ] 사이드바에 "컴플라이언스" 메뉴 표시

**Android/iOS/PC 고려사항**: 웹 대시보드.

---

### ITEM-P2-54: 학원 운행 보고서/통계

**현재 문제**: 주간/월간 운행 리포트 없음. 학원 피드백(김태호): "운행 정시율, 가동률, 탑승 이력을 학원 단위로 보고 싶다."

**목표 상태**: 학원 대시보드에 운행 통계 페이지 추가.

**구현 방안**:
1. **백엔드** — `GET /admin/academy/{academy_id}/stats` API
   - 기간(시작일~종료일) 파라미터
   - 응답: total_schedules, completed, cancelled, no_show, on_time_rate, avg_delay_minutes
   - `backend/app/modules/admin/router.py`에 추가
2. **웹** — `web/src/pages/StatsPage.tsx` 신규
   - 기간 선택 → 통계 카드 + 차트 (Recharts 사용 검토)
   - `academyNavItems`에 "운행 통계" 메뉴 추가

**변경 파일**:
- `backend/app/modules/admin/router.py` (수정)
- `backend/app/modules/admin/service.py` (수정)
- `web/src/pages/StatsPage.tsx` (신규)
- `web/src/components/Layout.tsx` (수정)
- `web/src/App.tsx` (수정)

**수락 기준**:
- [  ] 학원별 기간 운행 통계 조회 가능
- [  ] 정시율, 완료율, 미탑승율 표시
- [  ] 엑셀 export 지원

**Android/iOS/PC 고려사항**: 웹 대시보드.

---

### ITEM-P2-57: CS 티켓/문의 접수 시스템

**현재 문제**: 문의 접수/추적/해결 상태 관리 없음. CS 피드백: "전화/카톡으로만 접수되고, 이력 관리가 안 된다."

**목표 상태**: 앱 내 문의 접수 + 웹 관리 대시보드.

**구현 방안**:
1. **백엔드** — `SupportTicket` 모델
   - `backend/app/modules/admin/models.py`에 추가
   - 필드: id, user_id(FK), category("일반"/"운행"/"결제"/"안전"), subject, description, status("open"/"in_progress"/"resolved"/"closed"), assigned_to(UUID|None), created_at, updated_at
2. **백엔드** — API
   - `POST /support/tickets` — 문의 접수 (any user)
   - `GET /support/tickets` — 내 문의 목록 (user) / 전체 (admin)
   - `PATCH /support/tickets/{id}` — 상태 변경 (admin)
3. **모바일** — ProfileScreen에 "문의하기" 버튼
4. **웹** — `PlatformTicketsPage.tsx` 신규

**변경 파일**:
- `backend/app/modules/admin/models.py` (수정)
- `backend/app/modules/admin/router.py` (수정)
- `backend/app/modules/admin/schemas.py` (수정)
- `mobile/src/screens/parent/ProfileScreen.tsx` (수정)
- `web/src/pages/platform/PlatformTicketsPage.tsx` (신규)
- `web/src/components/Layout.tsx` (수정)

**수락 기준**:
- [  ] 모바일 앱에서 문의 접수 가능
- [  ] 접수된 문의에 상태(open→in_progress→resolved) 관리
- [  ] 웹 대시보드에서 전체 문의 조회/관리

**Android/iOS/PC 고려사항**: 모바일 + 웹.

---

### ITEM-P2-58: 학생 탑승 현황 대시보드 (CS용)

**현재 문제**: "오늘 탑승 완료/미탑승/진행 중" 실시간 모니터링 없음. CS 피드백: "부모님이 '우리 아이 탔나요?'라고 물어보면 매번 DB 확인해야 한다."

**목표 상태**: 웹 대시보드에 실시간 탑승 현황 페이지.

**구현 방안**:
1. **백엔드** — `GET /admin/boarding-status?date=YYYY-MM-DD` API
   - 응답: { total, scheduled, boarded, completed, cancelled, no_show, items: [...] }
2. **웹** — `PlatformBoardingStatusPage.tsx` 신규
   - 상태별 카운트 카드 + 학생별 실시간 상태 테이블
   - 30초 자동 갱신

**변경 파일**:
- `backend/app/modules/admin/router.py` (수정)
- `backend/app/modules/admin/service.py` (수정)
- `web/src/pages/platform/PlatformBoardingStatusPage.tsx` (신규)
- `web/src/components/Layout.tsx` (수정)

**수락 기준**:
- [  ] 날짜별 탑승 현황 실시간 조회
- [  ] 상태별(예정/탑승/완료/취소/미탑승) 카운트 표시
- [  ] 자동 갱신 (30초)

**Android/iOS/PC 고려사항**: 웹 대시보드 전용.

---

## 워크스트림 B — 프론트엔드 중심 (13건)

---

### ITEM-P2-39: 청구서 상세 내역

**현재 문제**: `mobile/src/screens/parent/BillingScreen.tsx`에서 청구서는 total_rides, amount만 표시. 편도/왕복, 단가, 할인 적용 여부 미표시. 학부모 피드백: "15만원 청구됐는데 어떻게 계산된 건지 모르겠다."

**목표 상태**: 청구서 상세에 일자별 탑승 내역 + 단가 + 할인 표시.

**구현 방안**:
1. **백엔드** — `GET /billing/invoices/{invoice_id}/details` API
   - 응답: 일자별 탑승 기록, 편도/왕복 구분, 건당 단가, 월상한 도달 여부
   - `backend/app/modules/billing/router.py`에 추가
2. **모바일** — 청구서 카드 탭 → 상세 화면
   - 일자별 탑승 기록 리스트 + 합계

**변경 파일**:
- `backend/app/modules/billing/router.py` (수정)
- `backend/app/modules/billing/service.py` (수정)
- `mobile/src/screens/parent/BillingScreen.tsx` (수정)
- `mobile/src/api/billing.ts` (수정)

**수락 기준**:
- [  ] 청구서에서 일자별 탑승 내역 조회 가능
- [  ] 건당 단가, 총 이용 횟수, 월 상한 적용 여부 표시

**Android/iOS/PC 고려사항**: 모바일 전용.

---

### ITEM-P2-42: 홈 화면 완료 스케줄 정리

**현재 문제**: `mobile/src/screens/parent/HomeScreen.tsx`에서 completed 상태 스케줄이 저녁까지 계속 표시됨. 학부모 피드백: "아침에 끝난 등원이 저녁에도 남아있어 지저분하다."

**목표 상태**: 완료/취소 스케줄을 접어서 표시하거나 하단으로 이동.

**구현 방안**:
1. **모바일** — HomeScreen에서 스케줄 정렬 변경
   - active(scheduled, boarded) 상태를 상단에 표시
   - completed/cancelled는 "완료된 일정 N건" 접힘 섹션으로 이동
   - 탭하면 펼쳐서 확인 가능

**변경 파일**:
- `mobile/src/screens/parent/HomeScreen.tsx` (수정)

**수락 기준**:
- [  ] 완료/취소 스케줄이 기본적으로 접혀있음
- [  ] 진행 중(scheduled/boarded) 스케줄이 항상 상단 표시
- [  ] "완료된 일정 N건" 탭하면 펼침

**Android/iOS/PC 고려사항**: 모바일 전용.

---

### ITEM-P2-43: 지도 버스 마커 자녀/학원 이름 표시

**현재 문제**: `mobile/src/screens/parent/MapScreen.tsx`에서 버스 마커에 식별 정보 없음. 다자녀 학부모는 어떤 버스가 어느 자녀 것인지 구분 불가.

**목표 상태**: 버스 마커에 자녀 이름 또는 학원 이름 라벨 표시.

**구현 방안**:
1. **모바일** — `updateBus` 메시지에 `label` 필드 추가
   - schedules에서 vehicle_id → student_name/academy_name 매핑
   - WebView에 label 포함 마커 렌더링
2. **mapHtml.ts** — 버스 마커에 라벨 오버레이 추가

**변경 파일**:
- `mobile/src/screens/parent/MapScreen.tsx` (수정)
- `mobile/src/constants/mapHtml.ts` (수정)

**수락 기준**:
- [  ] 버스 마커에 학원 이름 또는 자녀 이름 표시
- [  ] 다자녀 시 각 버스 구분 가능

**Android/iOS/PC 고려사항**: 모바일 전용 (KakaoMap WebView).

---

### ITEM-P2-44: 홈 화면 카드 터치 → 상세 이동

**현재 문제**: `HomeScreen.tsx`의 `ScheduleCard`가 `View` 컴포넌트라 탭 이벤트 없음. 카드를 눌러도 아무 반응 없음.

**목표 상태**: ScheduleCard 터치 시 스케줄 상세 화면 또는 지도 화면으로 이동.

**구현 방안**:
1. **모바일** — ScheduleCard를 `Pressable`로 변경
   - `onPress` → navigation.navigate("ScheduleDetail", { scheduleId }) 또는 Map 탭 이동
   - 터치 피드백: opacity 변화

**변경 파일**:
- `mobile/src/screens/parent/HomeScreen.tsx` (수정)

**수락 기준**:
- [  ] ScheduleCard 탭 시 상세 화면 또는 지도로 이동
- [  ] 터치 피드백 (opacity/scale 변화)

**Android/iOS/PC 고려사항**: 모바일 전용.

---

### ITEM-P2-48: 기사 일일 운행 보고서

**현재 문제**: 기사가 운행 종료 후 오늘 운행 통계를 확인할 곳 없음. 기사 피드백: "오늘 몇 명 태웠는지, 미탑승은 몇 명이었는지 정리된 게 없다."

**목표 상태**: 기사 앱에 일일 운행 요약 화면.

**구현 방안**:
1. **모바일** — RouteScreen 하단 또는 별도 탭에 "오늘 운행 요약" 섹션
   - 총 학생 수, 탑승 완료, 미탑승, 취소
   - 운행 시작/종료 시각
   - RouteSession 정보 활용

**변경 파일**:
- `mobile/src/screens/driver/RouteScreen.tsx` (수정)

**수락 기준**:
- [  ] 운행 종료 후 일일 요약 표시 (총원/완료/미탑승/취소)
- [  ] 운행 시작~종료 시각 표시

**Android/iOS/PC 고려사항**: 모바일 기사 앱 전용.

---

### ITEM-P2-51: 경로선(polyline) 지도 표시

**현재 문제**: 기사 지도에 마커만 표시되고 경로선이 없음. 기사 피드백: "AI 최적화 노선이라면서 어디로 가야 하는지 선이 없다."

**목표 상태**: 최적화 노선의 정류장 간 polyline을 지도에 표시.

**구현 방안**:
1. **백엔드** — RoutePlan.stops에 경로 좌표 포함
   - 이미 stops 필드(JSON)에 순서/좌표가 있으므로, 추가 변경 불필요
2. **모바일** — 기사 지도에 polyline 렌더링
   - stops 좌표를 WebView에 전달 → KakaoMap polyline API 사용
   - `mapHtml.ts`에 `drawRoute` 핸들러 추가

**변경 파일**:
- `mobile/src/screens/driver/MapScreen.tsx` 또는 RouteScreen 내 지도 (수정)
- `mobile/src/constants/mapHtml.ts` (수정)

**수락 기준**:
- [  ] 최적화 노선 경로선 지도에 표시
- [  ] 정류장 간 연결선 색상 구분

**Android/iOS/PC 고려사항**: 모바일 기사 앱 전용.

---

### ITEM-P2-55: "파이프라인" → "배차 자동 생성" 용어 변경

**현재 문제**: 웹 대시보드 일부에 "파이프라인" 개발 용어 잔존 가능성. P1에서 "자동 배차"로 변경했지만 백엔드 API 경로 `/schedules/daily/pipeline` 자체가 개발 용어.

**목표 상태**: 사용자 노출 모든 곳에서 "배차 자동 생성" 또는 "자동 배차" 용어 통일.

**구현 방안**:
1. **웹** — 잔존 "파이프라인" 텍스트 검색 및 교체
2. **백엔드** — API 경로 변경 불필요 (내부 사용), UI 텍스트만 변경

**변경 파일**:
- `web/src/pages/SchedulesPage.tsx` (확인/수정)

**수락 기준**:
- [  ] 사용자에게 노출되는 모든 UI에서 "파이프라인" 제거
- [  ] "자동 배차" 또는 "배차 자동 생성"으로 통일

**Android/iOS/PC 고려사항**: 웹 대시보드.

---

### ITEM-P2-56: 중간 전환 CTA (데모 신청/자료 다운로드)

**현재 문제**: `site/src/pages/Landing.tsx`에 "도입 문의하기" CTA만 있음. 리드 마그넷(서비스 소개서 다운로드, 데모 신청) 부재.

**목표 상태**: Features 섹션 아래에 "서비스 소개서 받기" CTA 추가.

**구현 방안**:
1. **사이트** — Landing.tsx에 중간 CTA 섹션 추가
   - "서비스 소개서 받기" 버튼 → 이메일/전화번호 입력 폼 → `/api/v1/contact` 호출 (inquiry_type: "brochure")
   - 또는 PDF 직접 다운로드 링크

**변경 파일**:
- `site/src/pages/Landing.tsx` (수정)

**수락 기준**:
- [  ] Features 섹션 아래에 "서비스 소개서 받기" CTA 표시
- [  ] 연락처 입력 후 접수 또는 PDF 다운로드

**Android/iOS/PC 고려사항**: 반응형 웹.

---

### ITEM-P2-59: 엑셀 업로드 템플릿 다운로드

**현재 문제**: 엑셀 업로드 페이지에 어떤 칼럼을 넣어야 하는지 샘플 파일 없음. 학원 피드백: "양식을 모르겠다."

**목표 상태**: 업로드 페이지에 "샘플 파일 다운로드" 버튼 추가.

**구현 방안**:
1. **웹** — 업로드 페이지에 샘플 XLSX 다운로드 버튼
   - `public/templates/student_upload_template.xlsx` 정적 파일 배치
   - 칼럼: 이름, 생년월일, 학년, 학교명, 보호자명, 보호자전화, 학원명
2. **또는** 프런트에서 동적 생성 (SheetJS)

**변경 파일**:
- `web/public/templates/student_upload_template.xlsx` (신규)
- `web/src/pages/platform/PlatformUploadPage.tsx` (수정)

**수락 기준**:
- [  ] 업로드 페이지에 "샘플 파일 다운로드" 버튼 표시
- [  ] 다운로드한 파일에 올바른 칼럼 헤더 포함

**Android/iOS/PC 고려사항**: 웹 대시보드.

---

### ITEM-P2-45: 학생 앱 아이 친화적 UI

**현재 문제**: 학생 앱 UI가 성인용과 동일. 학생 피드백: "글씨가 작고, 캐릭터 같은 게 있으면 좋겠다."

**목표 상태**: 학생 탭 화면에 큰 글씨, 밝은 색상, 아이콘 강화.

**구현 방안**:
1. **모바일** — 학생 ScheduleScreen에 학생 전용 스타일 적용
   - 글씨 크기 20% 확대, 아이콘 크기 확대
   - 색상 팔레트: 밝고 따뜻한 톤
   - 상태 아이콘: 이모지 또는 Ionicons 크게

**변경 파일**:
- `mobile/src/screens/student/ScheduleScreen.tsx` (수정)
- `mobile/src/screens/student/ProfileScreen.tsx` (수정)

**수락 기준**:
- [  ] 학생 화면 글씨 크기가 부모 화면 대비 최소 20% 크게
- [  ] 상태 표시에 컬러풀한 아이콘 사용
- [  ] 학생 탭 색상이 밝고 친화적

**Android/iOS/PC 고려사항**: 모바일 학생 앱 전용.

---

### ITEM-P2-60: 서비스 소개서 PDF

**현재 문제**: B2B 영업 필수 자료인 서비스 소개서 PDF가 없음.

**목표 상태**: 2~4페이지 서비스 소개서 PDF 제작 및 배포.

**구현 방안**:
1. **사이트** — `public/safeway-kids-brochure.pdf` 정적 파일 배치
   - Landing.tsx CTA에서 다운로드 링크 연결
   - 내용: 서비스 개요, 주요 기능, 요금제, 연락처
   - (PDF 컨텐츠 자체는 디자인/마케팅 제작 → 코드는 배치만)

**변경 파일**:
- `site/public/safeway-kids-brochure.pdf` (신규 — 에셋)
- `site/src/pages/Landing.tsx` (수정 — 다운로드 링크)

**수락 기준**:
- [  ] PDF 파일이 /safeway-kids-brochure.pdf 경로에서 다운로드 가능
- [  ] 랜딩 페이지에서 다운로드 링크 접근 가능

**Android/iOS/PC 고려사항**: 반응형 웹. PDF 자체는 디자인 에셋.

---

### ITEM-P2-61: 사회적 증거 (고객 사례/추천사)

**현재 문제**: 랜딩 페이지에 고객 추천사/사례가 없음. 마케팅 피드백: "파일럿 학원 추천사가 있으면 전환율이 높아진다."

**목표 상태**: 랜딩 페이지에 추천사 섹션 추가 (빈 상태에서도 구조만 준비).

**구현 방안**:
1. **사이트** — Landing.tsx에 "고객 추천사" 섹션 추가
   - 초기 데이터: 플레이스홀더 (파일럿 학원 확보 후 실제 데이터로 교체)
   - 카드 형태: 학원명, 담당자명, 추천사 텍스트

**변경 파일**:
- `site/src/pages/Landing.tsx` (수정)

**수락 기준**:
- [  ] 랜딩 페이지에 추천사 섹션 존재
- [  ] 최소 3개 추천사 카드 (플레이스홀더 허용)

**Android/iOS/PC 고려사항**: 반응형 웹.

---

## 의존성 맵 및 구현 우선순위

### 의존성 관계
```
ITEM-P2-37 (자녀 프로필) ← ITEM-P2-40 (보조 보호자, 자녀 프로필 화면 재사용)
ITEM-P2-41 (알림 설정) ← ITEM-P2-46 (학생 알림, 설정 테이블 공유)
ITEM-P2-49 (기사 메모) → ITEM-P2-48 (운행 보고서, 메모 포함 가능)
ITEM-P2-53 (학원 컴플라이언스) 독립
ITEM-P2-54 (운행 통계) 독립
```

### 권장 구현 순서

**Phase A (기반 모델)** — 순서 1
- ITEM-P2-37 (자녀 프로필) — 다른 항목의 기반
- ITEM-P2-41 (알림 설정) — 알림 관련 기반
- ITEM-P2-49 (기사 메모) — 모델 추가
- ITEM-P2-50 (인수자 확인) — 모델 추가

**Phase B (백엔드 API)** — 순서 2
- ITEM-P2-40 (보조 보호자)
- ITEM-P2-46 (학생 알림)
- ITEM-P2-47 (일괄 탑승)
- ITEM-P2-52 (실시간 갱신)
- ITEM-P2-53 (학원 컴플라이언스)
- ITEM-P2-54 (운행 통계)
- ITEM-P2-57 (CS 티켓)
- ITEM-P2-58 (탑승 현황)

**Phase C (프런트엔드)** — 순서 3
- ITEM-P2-39 (청구서 상세)
- ITEM-P2-42 (완료 스케줄 정리)
- ITEM-P2-43 (버스 마커 라벨)
- ITEM-P2-44 (카드 터치 이동)
- ITEM-P2-48 (운행 보고서)
- ITEM-P2-51 (경로선)
- ITEM-P2-45 (학생 UI)

**Phase D (사이트/마케팅)** — 순서 4
- ITEM-P2-55 (용어 변경)
- ITEM-P2-56 (중간 CTA)
- ITEM-P2-59 (엑셀 템플릿)
- ITEM-P2-60 (소개서 PDF)
- ITEM-P2-61 (추천사)

---

## 변경 범위 요약

| 구분 | 신규 파일 | 수정 파일 |
|------|----------|----------|
| 백엔드 | 0 | ~15 |
| 모바일 | ~3 | ~10 |
| 웹 | ~4 | ~5 |
| 사이트 | ~2 | ~2 |
| **합계** | **~9** | **~32** |
