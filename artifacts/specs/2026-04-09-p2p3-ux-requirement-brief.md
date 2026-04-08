# Requirement Brief — P2/P3 UX 이슈 전체 수정

**작성일:** 2026-04-09  
**Phase:** 0 — Intake  
**선행 작업:** P0(9개) + P1(21개) 수정 완료 (2026-04-07, commit `cb10d75`)  
**출처:** 8개 페르소나 UX 리뷰 보고서

---

## 1. Goals

1. PetTracker P2 10개 + CareConnect P2 10개 이슈를 수정하여 **출시 후 즉시 사용자 이탈을 방지**
2. P3 중 코드로 해결 가능한 이슈(SMALL/MEDIUM)를 최대한 수정
3. P3 LARGE 이슈(DB 스키마 대규모 변경)는 별도 Tech Spec으로 분리

## 2. Non-Goals

1. 그룹 산책(PT P3-23) — many-to-many 스키마 변경, 가격 모델 미정
2. 다중 아동 동시 돌봄(CC P3-29) — junction table + 세션 분리 로직, 비즈니스 규칙 미정
3. SessionMonitor 실시간 지도(CC P3-31) — GPS 테이블 신규, 개인정보 컴플라이언스 검토 필요
4. DateTimePicker 네이티브 라이브러리 설치 — Expo Go 호환성 이슈, 커스텀 UI로 대체
5. 이미지 업로드 실제 스토리지 연동 — S3/Cloud Storage 미설정, ImagePicker UI만 구현

---

## 3. Scope — P2 이슈 (20개)

### PetTracker P2 (10개)

| # | 이슈 | 수정 범위 | 난이도 |
|---|------|----------|--------|
| PT-13 | 날짜 입력 텍스트 → 커스텀 DatePicker UI | SearchScreen, ScheduleScreen | 중 |
| PT-14 | 산책 완료 메모 입력 UI 추가 | WalkScreen + API | 소 |
| PT-15 | 리뷰 답변 기능 (모델+API+UI) | models.py, router.py, reviews.ts, 신규 화면 | 중 |
| PT-16 | 예약 확정 상태 표시 개선 | BookingCreateScreen, BookingDetailScreen | 소 |
| PT-17 | 보험 정보 필드 추가 | WalkerProfileDetailScreen, schemas | 소 |
| PT-18 | 견종 크기 필터 추가 | SearchScreen, walkers.ts, router.py | 중 |
| PT-19 | 산책사 프로필 실제 데이터 바인딩 | WalkerProfileScreen | 소 |
| PT-20 | 이번 달 수입 요약 추가 | EarningsScreen | 소 |
| PT-21 | 사진 FAB에 ImagePicker 연결 | WalkScreen | 소 |
| PT-22 | 빈 검색 결과 분기 메시지 | SearchScreen | 소 |

### CareConnect P2 (10개)

| # | 이슈 | 수정 범위 | 난이도 |
|---|------|----------|--------|
| CC-19 | 예약 카드에 아동 이름 표시 | BookingRequestScreen | 소 |
| CC-20 | 프로필 이름 실제 데이터 바인딩 | CaregiverProfileScreen | 소 |
| CC-21 | 알레르기 배너 실제 데이터 연결 | SessionScreen | 소 |
| CC-22 | 부분 출금 기능 추가 | EarningsScreen, wallet.ts | 중 |
| CC-23 | 사진 FAB에 ImagePicker 연결 | SessionScreen | 소 |
| CC-24 | Handover 아이 상태 요약 추가 | HandoverScreen | 중 |
| CC-25 | "에스크로" → "안심 결제" 교체 | BookingCreateScreen:206 | 소 |
| CC-26 | "CPR" → "심폐소생술" 교체 | SearchScreen:12, CaregiverProfileDetailScreen:11 | 소 |
| CC-27 | 빈 catch 블록 Toast/Alert 추가 | BookingsScreen, BookingDetailScreen + 공통 | 소 |
| CC-28 | 정산 주기 D+1 상시 표시 강화 | EarningsScreen | 소 |

---

## 4. Scope — P3 이슈 (포함 대상, 6개)

| # | 이슈 | 수정 범위 | 난이도 |
|---|------|----------|--------|
| PT-24 | 세금 자료 CSV 내보내기 | 백엔드 endpoint + EarningsScreen 버튼 | 중 |
| PT-25 | 스케줄 반복 패턴 | ScheduleScreen + backend RRULE | 중 |
| PT-26 | 산책사 프로필 사진 업로드 | 모델 + endpoint + UI | 소 |
| PT-27 | LiveTrack 경로 이력 표시 개선 | LiveTrackScreen 지도 HTML | 소-중 |
| CC-30 | 세금 자료 월별 내보내기 | 백엔드 (PT-24과 공유) + EarningsScreen | 중 |
| CC-32 | 가용 시간 등록 화면 완성 | ScheduleScreen + list endpoint | 소 |

---

## 5. Scope — P3 이슈 (제외 대상, 3개)

| # | 이슈 | 제외 사유 |
|---|------|----------|
| PT-23 | 그룹 산책 | many-to-many 스키마 변경 + 가격 모델 미정 → 별도 Tech Spec |
| CC-29 | 다중 아동 동시 돌봄 | junction table + 세션 분리 + 비즈니스 규칙 → 별도 Tech Spec |
| CC-31 | SessionMonitor 실시간 지도 | GPS 테이블 신규 + 개인정보 컴플라이언스 → 별도 Tech Spec |

---

## 6. Assumption Register

| # | 가정 | 근거 |
|---|------|------|
| A1 | DateTimePicker 네이티브 라이브러리 설치 없이 커스텀 모달로 대체 | Expo Go SDK 54 제약, 네이티브 모듈 미지원 |
| A2 | 이미지 업로드는 ImagePicker UI만 구현, 실제 S3 업로드는 미연결 | 클라우드 스토리지 미설정 |
| A3 | PT 리뷰 답변 모델은 CC와 동일 패턴 (walker_reply + replied_at) | CC 구현 패턴 재사용 |
| A4 | CSV 내보내기는 백엔드에서 생성, 프론트에서 다운로드 트리거 | 모바일에서 파일 직접 생성보다 API 활용이 안정적 |
| A5 | 견종 크기 필터는 프론트엔드 필터링 (백엔드 API 파라미터 추가 없이) | 검색 결과가 소규모 (<100건), 클라이언트 필터 충분 |
| A6 | 보험 정보는 표시 전용 (boolean has_insurance + 만료일) | 보험 증서 검증은 수동 심사 영역 |
| A7 | RRULE은 간소화 버전 (매일/매주/격주) 만 지원 | 풀 RFC5545 구현은 과도 |
| A8 | 빈 catch 블록은 Toast 메시지로 통일 (Alert 아님) | Alert은 사용자 flow를 중단시킴 |

---

## 7. Open Questions

| # | 질문 | 영향 범위 | 기본 방침 |
|---|------|----------|----------|
| Q1 | CSV 내보내기 시 세금 계산 기준은? (총매출 vs 수수료 차감 후) | PT-24, CC-30 | 양쪽 모두 표시 (gross + fee + net) |
| Q2 | 산책사/돌봄자 보험 가입은 필수인가 선택인가? | PT-17 | 선택 (표시만) |
| Q3 | 부분 출금 최소 금액은? | CC-22 | 1,000원 |
| Q4 | 리뷰 답변 수정/삭제 가능 여부 | PT-15 | 1회 답변만 허용, 수정 불가 |
| Q5 | 스케줄 반복 생성 시 최대 기간은? | PT-25 | 4주 (28일) |

---

## 8. Acceptance Criteria

### 공통
- [ ] TypeScript 0 errors (PT + CC 양쪽)
- [ ] 백엔드 unit tests 전체 통과 (기존 51개 + 신규)
- [ ] 웹 Vitest 전체 통과 (12 suites, 50 tests)
- [ ] 기존 SafeWay Kids mobile tests 전체 통과 (17 suites, 71 tests)

### PetTracker P2
- [ ] PT-13: 날짜 선택 시 모달 또는 커스텀 피커가 표시됨
- [ ] PT-14: 산책 중 메모를 입력하고 서버에 저장할 수 있음
- [ ] PT-15: 산책사가 리뷰에 답변을 등록할 수 있음 (백엔드+UI)
- [ ] PT-16: 예약 생성 후 상태(대기중/수락됨)가 명확히 표시됨
- [ ] PT-17: 산책사 프로필에 보험 가입 여부가 표시됨
- [ ] PT-18: 검색 결과를 견종 크기별로 필터링할 수 있음
- [ ] PT-19: 산책사 프로필에 실제 이름/평점이 표시됨
- [ ] PT-20: 수입 화면에 이번 달 합계가 표시됨
- [ ] PT-21: 사진 FAB 클릭 시 ImagePicker가 열림
- [ ] PT-22: 검색 전/검색 후 결과 없음이 다른 메시지로 표시됨

### CareConnect P2
- [ ] CC-19: 예약 카드에 아동 이름이 표시됨
- [ ] CC-20: 프로필 화면에 실제 돌봄자 이름이 표시됨
- [ ] CC-21: 알레르기 배너가 아동의 실제 알레르기 정보를 표시함
- [ ] CC-22: 부분 출금 금액을 입력할 수 있음
- [ ] CC-23: 사진 FAB 클릭 시 ImagePicker가 열림
- [ ] CC-24: 인수인계 화면에 아이 이름, 돌봄자 이름, 활동 요약이 표시됨
- [ ] CC-25: "에스크로" 텍스트가 "안심 결제"로 교체됨
- [ ] CC-26: "CPR"이 "심폐소생술"로 교체됨
- [ ] CC-27: API 실패 시 사용자에게 Toast 메시지가 표시됨
- [ ] CC-28: 정산 주기 D+1이 출금 버튼 근처에 항상 표시됨

### P3 포함 대상
- [ ] PT-24/CC-30: 수입 화면에서 월별 CSV 내보내기 버튼이 동작함
- [ ] PT-25: 스케줄에서 "매주 반복" 옵션을 선택할 수 있음
- [ ] PT-26: 산책사 프로필 사진을 선택할 수 있음
- [ ] PT-27: LiveTrack에서 경로 polyline이 지도 위에 표시됨
- [ ] CC-32: 등록된 가용 시간 목록이 화면에 표시됨

---

## 9. Impact Map

### 백엔드 변경 (예상)
```
backend/app/apps/pettracker/
  models.py      — WalkerReview에 walker_reply + replied_at 추가
  schemas.py     — 리뷰 답변, 보험, 내보내기 스키마
  router.py      — 리뷰 답변 endpoint, CSV 내보내기, 메모 업데이트
  service.py     — 리뷰 답변, CSV 생성, 반복 스케줄 로직

backend/app/apps/careconnect/
  schemas.py     — 내보내기 스키마
  router.py      — CSV 내보내기, 가용시간 목록 endpoint
  service.py     — CSV 생성, 가용시간 조회
```

### 프론트엔드 변경 (예상)
```
apps/pettracker/mobile/src/
  screens/owner/SearchScreen.tsx          — DatePicker, 크기 필터, 빈 결과
  screens/owner/BookingCreateScreen.tsx   — 예약 상태 표시
  screens/owner/LiveTrackScreen.tsx       — 경로 polyline
  screens/walker/WalkScreen.tsx           — 메모 입력, 사진 FAB
  screens/walker/EarningsScreen.tsx       — 월 요약, CSV 버튼
  screens/walker/ScheduleScreen.tsx       — 반복 패턴
  screens/walker/WalkerProfileScreen.tsx  — 실제 데이터, 프로필 사진
  api/reviews.ts                         — 리뷰 답변 API
  api/walks.ts                           — 메모 업데이트 API
  api/wallet.ts                          — CSV 내보내기 API

apps/careconnect/mobile/src/
  screens/caregiver/BookingRequestScreen.tsx  — 아동 이름
  screens/caregiver/CaregiverProfileScreen.tsx — 실제 이름
  screens/caregiver/SessionScreen.tsx         — 알레르기, 사진 FAB
  screens/caregiver/EarningsScreen.tsx        — 부분 출금, D+1, CSV
  screens/caregiver/ScheduleScreen.tsx        — 가용시간 목록
  screens/parent/HandoverScreen.tsx           — 아이 상태 요약
  screens/parent/BookingCreateScreen.tsx      — "안심 결제"
  screens/parent/SearchScreen.tsx             — "심폐소생술"
  screens/parent/CaregiverProfileDetailScreen.tsx — "심폐소생술"
  api/wallet.ts                               — CSV 내보내기 API
```

### Alembic 마이그레이션
```
1. WalkerReview: walker_reply (Text, nullable), replied_at (DateTime, nullable)
2. WalkerQualification: has_insurance (Boolean), insurance_expiry (Date, nullable)
   → 또는 별도 필드로 profile_photo_url (String, nullable)
3. WalkerAvailability: recurrence_rule (String, nullable), recurrence_end_date (Date, nullable)
```
