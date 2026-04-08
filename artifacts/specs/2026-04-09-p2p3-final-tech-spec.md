# Final Tech Spec — P2/P3 UX 이슈 전체 수정

**작성일:** 2026-04-09  
**Phase:** 3 — Final Tech Spec  
**선행:** Requirement Brief + Independent Review + Consensus Matrix

---

## 1. Problem Statement

PetTracker와 CareConnect 앱이 P0/P1 수정을 완료했지만, 여전히 20개의 UX 마찰 요인(P2)과 9개의 기능 부재(P3) 이슈가 남아있다. 이 중 6개 P3를 포함한 총 26개 이슈를 수정하여 "데모 수준 MVP"를 "실사용 가능한 MVP"로 전환한다.

## 2. Goals / Non-Goals

**Goals:**
- P2 20개 이슈 전체 수정
- P3 SMALL/MEDIUM 6개 이슈 수정
- 공유 컴포넌트(DatePicker, CSV Export) 1회 개발 후 양 앱 재사용

**Non-Goals:**
- 그룹 산책 (DB many-to-many)
- 다중 아동 동시 돌봄 (junction table)
- SessionMonitor 실시간 지도 (GPS 테이블 신규)
- 실제 S3 업로드 연동 (ImagePicker UI만)
- 네이티브 DateTimePicker 설치

## 3. User Scenarios

**S1 — 이수진(52세, 비기술)**
산책사를 검색할 때 날짜 선택 모달이 뜨고, 캘린더에서 원하는 날짜를 탭하면 선택된다.
검색 결과가 없으면 "해당 날짜에 가능한 산책사가 없습니다" 메시지가 나온다.

**S2 — 최동현(전문 산책사)**
산책 중 메모를 입력하고, 완료 후 보호자가 산책 보고서에서 메모를 볼 수 있다.
리뷰에 답변을 등록할 수 있고, 보호자도 답변을 볼 수 있다.

**S3 — 정유나(신규 돌봄자)**
예약 카드에 아이 이름이 표시되어 누구의 돌봄인지 바로 알 수 있다.
수입에서 부분 출금이 가능하고, 수수료 내역이 투명하게 보인다.

**S4 — 김태호(비기술 보호자)**
"에스크로" 대신 "안심 결제"로 표시되고, "CPR" 대신 "심폐소생술"로 표기된다.

## 4. Functional Requirements

### FR-1: 커스텀 DatePicker 컴포넌트
- 연/월 헤더 (< 2026년 4월 >) + 날짜 그리드
- 오늘 이전 날짜 선택 불가 (disabled 스타일)
- 기본값 = 오늘
- 터치 타깃 최소 44x44dp
- PT SearchScreen, CC SearchScreen, CC ChildRegistrationScreen, PT ScheduleScreen에서 사용

### FR-2: 산책 메모 입력 (PT-14)
- WalkScreen 하단에 TextInput (placeholder: "산책 메모를 입력하세요")
- 산책 종료 시 `walker_memo` 필드와 함께 서버에 전송
- 백엔드: `PATCH /pt/walks/{session_id}` body: `{ walker_memo: string }`

### FR-3: 리뷰 답변 (PT-15)
- 백엔드: WalkerReview 모델에 `walker_reply` (Text), `replied_at` (DateTime) 추가
- 백엔드: `POST /pt/reviews/{review_id}/reply` body: `{ reply: string }`
- 프론트: 리뷰 목록 API `GET /pt/reviews?walker_id=me`
- 프론트: 각 리뷰 카드에 "답변하기" 버튼 → 모달 입력 → 저장
- 1회 답변만 허용, 수정 불가

### FR-4: 예약 상태 표시 (PT-16)
- BookingCreateScreen: 예약 성공 후 Alert에 상태("대기중 - 산책사 수락 대기") 명시
- BookingDetailScreen: 상태 배지 (pending → accepted → in_progress → completed)

### FR-5: 보험 정보 (PT-17)
- WalkerQualification 모델: `has_insurance` (Boolean), `insurance_expiry` (Date, nullable)
- WalkerProfileDetailScreen: 보험 배지 표시 (가입/미가입)
- 검색 결과 카드에도 보험 아이콘 표시

### FR-6: 견종 크기 필터 (PT-18)
- Pet 모델에 이미 `weight_kg` 존재
- SearchScreen: 필터 칩 (소형 <10kg / 중형 10-25kg / 대형 >25kg / 전체)
- 클라이언트 사이드 필터링 (검색 결과에서)
- 검색 API 응답에 pet weight 정보 포함 확인 (필요 시 추가)

### FR-7: 프로필 실제 데이터 바인딩 (PT-19, CC-20)
- PT WalkerProfileScreen: 기존 profile API 호출 → 이름, 평점, 산책 횟수 표시
- CC CaregiverProfileScreen: 기존 profile API 또는 auth 상태에서 이름 바인딩

### FR-8: 월 수입 요약 (PT-20)
- EarningsScreen 상단에 "이번 달 수입" 카드
- 현재 월 거래 내역에서 클라이언트 합산 (gross - fee = net)
- 지난 달 대비 증감 표시 (선택)

### FR-9: 사진 FAB (PT-21, CC-23)
- expo-image-picker 설치
- FAB 클릭 → launchCameraAsync() 또는 launchImageLibraryAsync() 선택
- 선택된 이미지 URI를 로컬 state에 저장 + 썸네일 표시
- 실제 업로드는 미구현 (S3 미설정), 로컬 프리뷰만

### FR-10: 빈 검색 결과 분기 (PT-22)
- 검색 전: "검색 버튼을 눌러 주변 도우미를 찾아보세요"
- 검색 후 0건: "해당 조건에 맞는 도우미가 없습니다. 날짜나 지역을 변경해보세요"

### FR-11: 예약 카드 아동 이름 (CC-19)
- BookingRequestScreen: 예약 카드에 `child_name` 필드 표시
- 백엔드 응답에 child_name 포함 확인 (JOIN 필요 시 추가)

### FR-12: 알레르기 배너 데이터 연결 (CC-21)
- SessionScreen: 세션 시작 시 아동의 알레르기 정보 API 조회
- 알레르기 없으면 배너 숨김, 있으면 구체적 항목 표시

### FR-13: 부분 출금 (CC-22)
- EarningsScreen: 금액 입력 필드 + 프리셋 버튼 (전액 / 50% / 직접 입력)
- 최소 1,000원, 100원 단위
- 잔액 초과 시 실시간 유효성 검사
- 출금 실패 시 **Alert** (금전 관련)

### FR-14: Handover 상태 요약 (CC-24)
- HandoverScreen: 아이 이름, 돌봄자 이름, 활동 요약, 특이사항 메모 표시
- 기존 API 응답 확장 또는 세션 상세 API 활용

### FR-15: 텍스트 교체 (CC-25, CC-26)
- "에스크로" → "안심 결제" (BookingCreateScreen:206)
- "CPR" → "심폐소생술" (SearchScreen:12, CaregiverProfileDetailScreen:11)

### FR-16: 에러 처리 (CC-27)
- 빈 catch 블록 → Toast.show() 또는 Alert.alert()
- 금전 관련 (출금, 예약 취소): Alert
- 데이터 로드, 검색: Toast
- Toast 표시 3초

### FR-17: 정산 정보 강화 (CC-28)
- EarningsScreen: 출금 버튼 근처에 "정산 주기: 영업일 D+1" 상시 표시
- 수수료율 20% 명시

### FR-18: CSV 내보내기 (PT-24, CC-30)
- 백엔드: 공유 서비스 `export_transactions_csv(user_id, month, app_context)`
- PT 라우터: `GET /pt/wallet/export?month=2026-04`
- CC 라우터: `GET /cc/wallet/export?month=2026-04`
- 응답: CSV StreamingResponse (gross, fee, net, date, description)
- 프론트: expo-file-system으로 다운로드 → expo-sharing으로 공유

### FR-19: 스케줄 반복 (PT-25)
- WalkerAvailability: `recurrence_type` (none/daily/weekly/biweekly), `recurrence_end_date`
- 저장 시 개별 슬롯으로 확장 (최대 28일)
- 확장된 슬롯은 독립 레코드 → 개별 삭제 가능
- unique constraint: (walker_id, available_date, start_time)

### FR-20: 산책사 프로필 사진 (PT-26)
- WalkerQualification: `profile_photo_url` (String, nullable)
- expo-image-picker로 선택 → 로컬 URI 저장 (S3 미연동)
- 프로필 화면, 검색 결과에 썸네일 표시

### FR-21: LiveTrack 경로 (PT-27)
- LiveTrackScreen: WebView 지도 HTML에 polyline 렌더링
- 기존 `route_polyline` JSON 데이터 활용
- Leaflet.js polyline으로 경로 시각화
- 시작점/현재위치 마커

### FR-22: 가용시간 목록 (CC-32)
- 백엔드: `GET /cc/caregivers/availability` → 날짜별 슬롯 목록
- ScheduleScreen: 등록된 슬롯 목록 표시 + 삭제 버튼
- 과거 날짜 자동 필터

## 5. Non-Functional Requirements

- 커스텀 DatePicker 렌더링 < 100ms
- Toast 메시지 3초 표시
- CSV 내보내기 최대 12개월 데이터, 응답 < 3초
- 모든 UI 터치 타깃 최소 44x44dp

## 6. Constraints

- Expo Go SDK 54 호환 필수
- 네이티브 모듈 설치 불가 (Expo Go 제약)
- S3/Cloud Storage 미설정 → 이미지 로컬 URI만
- 프로덕션 DB 미연결 → 로컬 PostgreSQL

## 7. Architecture

### 공유 컴포넌트
```
packages/core-mobile/src/components/
  DatePickerModal.tsx   — 커스텀 날짜 선택 모달 (신규)
```
→ PT와 CC 양쪽에서 import

### 백엔드 변경
```
backend/app/apps/pettracker/
  models.py   — WalkerReview (walker_reply, replied_at)
              — WalkerQualification (has_insurance, insurance_expiry, profile_photo_url)
              — WalkerAvailability (recurrence_type, recurrence_end_date)
  schemas.py  — ReviewReply, WalkerExport, AvailabilityRecurrence
  router.py   — review reply, memo update, CSV export, recurrence
  service.py  — review reply, memo update, CSV generation, slot expansion

backend/app/apps/careconnect/
  router.py   — CSV export, availability list
  service.py  — CSV generation, availability query

backend/app/shared/
  export_service.py — 공유 CSV 생성 (신규)
```

### 마이그레이션 (1건으로 통합)
```
migrations/versions/xxxx_pt_p2p3_schema_updates.py
  - WalkerReview: +walker_reply, +replied_at
  - WalkerQualification: +has_insurance, +insurance_expiry, +profile_photo_url
  - WalkerAvailability: +recurrence_type, +recurrence_end_date
```

## 8. Edge Cases

| Case | Handling |
|------|---------|
| DatePicker에서 과거 날짜 선택 | disabled 스타일, 탭 무시 |
| 리뷰 답변 후 재답변 시도 | "이미 답변을 등록했습니다" Alert |
| 부분 출금 시 잔액 0원 | 출금 버튼 disabled |
| 부분 출금 최소 미만 | "최소 출금 금액은 1,000원입니다" 실시간 표시 |
| CSV 내보내기 데이터 0건 | "해당 월에 거래 내역이 없습니다" Toast |
| 반복 스케줄 기존 슬롯 충돌 | 충돌 슬롯 건너뛰기 + "N건 생성, M건 충돌 건너뜀" Toast |
| ImagePicker 권한 거부 | "카메라 권한이 필요합니다" Alert + 설정 열기 안내 |
| 알레르기 정보 없는 아동 | 배너 숨김 |
| LiveTrack polyline 비어있음 | "아직 경로 데이터가 없습니다" 텍스트 |

## 9. Failure Handling

- API 실패 (일반): Toast "일시적 오류가 발생했습니다"
- API 실패 (금전): Alert "출금 요청에 실패했습니다. 잠시 후 다시 시도해주세요"
- CSV 생성 실패: Alert "내보내기에 실패했습니다"
- ImagePicker 실패: Toast "이미지를 불러올 수 없습니다"

## 10. Testing Strategy

- **백엔드**: 신규 endpoint별 unit test 추가 (review reply, memo update, CSV export, availability list, recurrence)
- **TypeScript**: PT + CC 양쪽 `tsc --noEmit` 0 errors
- **기존 테스트**: SafeWay Kids mobile 71 + Web 50 + Backend 51 전체 통과
- **수동 검증**: 각 FR별 스크린샷/동작 확인

## 11. Rollback Strategy

- 각 마일스톤별 독립 커밋 → 문제 시 마일스톤 단위 revert
- Alembic downgrade로 스키마 복원 가능

## 12. Acceptance Criteria

→ Requirement Brief Section 8 참조 (총 30개 체크리스트)

## 13. Out of Scope

- PT-23 그룹 산책 (many-to-many)
- CC-29 다중 아동 동시 돌봄 (junction table)
- CC-31 실시간 지도 (GPS 테이블 + 컴플라이언스)
- 실제 S3 이미지 업로드
- 앱스토어 제출
