# P2/P3 Independent Review — 3-Perspective Analysis

**작성일:** 2026-04-09  
**대상:** artifacts/specs/2026-04-09-p2p3-ux-requirement-brief.md  
**리뷰 방식:** 요구사항 분석 / 기술 스펙 검증 / UX 적합성 — 3개 관점 통합

---

## Reviewer A: Requirement Analyst

### 1. Requirement Restatement
P0/P1 수정 완료 후 남은 UX 마찰 요인(P2 20개)과 기능 부재(P3 6개)를 해소하여,
PetTracker와 CareConnect를 "데모 수준"에서 "실사용 가능한 MVP"로 전환한다.
P3 중 대규모 스키마 변경이 필요한 3개는 별도 Tech Spec으로 분리한다.

### 2. Missing Requirements
- **MR-1**: PT-15 리뷰 답변 — 산책사가 자기 리뷰 목록을 볼 수 있는 화면이 없음. 답변 UI 이전에 리뷰 조회 API+화면 필요
- **MR-2**: PT-14 메모 저장 — 백엔드에 `PATCH /pt/walks/{session_id}/memo` 엔드포인트가 없음. API 신규 필요
- **MR-3**: PT-21/CC-23 사진 FAB — ImagePicker 라이브러리(`expo-image-picker`) 설치 여부 미확인
- **MR-4**: CC-24 Handover 화면 — 아이 이름/돌봄자 이름을 표시하려면 세션에서 관련 데이터를 JOIN해서 반환해야 함. 현재 API 응답 구조 확인 필요
- **MR-5**: PT-24/CC-30 CSV 내보내기 — 모바일에서 CSV 파일 다운로드 메커니즘(expo-file-system + expo-sharing) 미언급

### 3. Conflicts / Contradictions
- **CF-1**: A5 "클라이언트 필터 충분" vs PT-18 "견종 크기 필터" — 검색 API가 현재 크기 정보를 반환하지 않으면 클라이언트 필터도 불가
- **CF-2**: PT-15 "리뷰 답변 백엔드+UI" — CC는 이미 백엔드 완료(오늘 마이그레이션). PT는 모델 필드 + 마이그레이션 + 엔드포인트 + UI 모두 필요. 난이도 "중"보다 "대"에 가까움
- **CF-3**: Impact Map에 `WalkerQualification`에 `has_insurance` 추가라 했지만, 보험은 자격증과 다른 성격. User 모델이나 별도 테이블이 더 적절할 수 있음

### 4. Technical Risks (Top 3)
1. **Alembic 마이그레이션 3건 동시** — WalkerReview + WalkerQualification + WalkerAvailability 3개 테이블 변경. autogenerate가 또 기존 테이블 삭제를 감지할 위험
2. **expo-image-picker Expo Go 호환성** — SDK 54에서 지원되는지 확인 필요. 미지원 시 카메라 FAB 수정 자체가 불가
3. **RRULE 반복 스케줄** — dateutil 라이브러리 추가 + 슬롯 확장 로직이 예상보다 복잡. unique constraint(walker_id + available_date)와 충돌 가능

### 5. Testing Concerns (Top 3)
1. PT/CC 모바일 앱에 **테스트 파일 0개** — 26개 이슈 수정 후 자동화 검증 수단이 TypeScript 컴파일뿐
2. 백엔드 새 엔드포인트 3~5개 추가 예정 — 기존 51개 unit test에 추가 테스트 필요
3. CSV 내보내기 — 파일 생성 테스트가 CI에서 동작하는지 (파일시스템 의존)

### 6. Confidence
**MEDIUM** — 범위가 명확하고 대부분 프론트엔드 UI 수정이지만, PT-15(리뷰 답변 full-stack)과 PT-25(RRULE)의 실제 복잡도가 과소평가되어 있음

---

## Reviewer B: Tech Spec Verifier

### 1. Impact Map 검증

| 파일 경로 | 존재 여부 | 비고 |
|-----------|----------|------|
| apps/pettracker/mobile/src/screens/owner/SearchScreen.tsx | ✅ | |
| apps/pettracker/mobile/src/screens/walker/WalkScreen.tsx | ✅ | |
| apps/pettracker/mobile/src/screens/walker/EarningsScreen.tsx | ✅ | |
| apps/pettracker/mobile/src/screens/walker/ScheduleScreen.tsx | ✅ | |
| apps/pettracker/mobile/src/screens/walker/WalkerProfileScreen.tsx | ✅ | 하드코딩 확인됨 |
| apps/pettracker/mobile/src/screens/owner/LiveTrackScreen.tsx | ✅ | |
| apps/pettracker/mobile/src/api/reviews.ts | ✅ | reply 함수 없음 |
| apps/pettracker/mobile/src/api/walks.ts | ✅ | memo update 없음 |
| apps/careconnect/mobile/src/screens/caregiver/BookingRequestScreen.tsx | ✅ | child_name 미표시 |
| apps/careconnect/mobile/src/screens/caregiver/CaregiverProfileScreen.tsx | ✅ | "돌봄자" 하드코딩 |
| apps/careconnect/mobile/src/screens/caregiver/SessionScreen.tsx | ✅ | 알레르기 배너 존재, 데이터 미연결 |
| apps/careconnect/mobile/src/screens/parent/HandoverScreen.tsx | ✅ | 시간/활동만 표시 |
| apps/careconnect/mobile/src/screens/parent/BookingCreateScreen.tsx | ✅ | Line 206 "에스크로" 확인 |
| apps/careconnect/mobile/src/screens/parent/SearchScreen.tsx | ✅ | Line 12 "CPR" 확인 |
| apps/careconnect/mobile/src/screens/parent/CaregiverProfileDetailScreen.tsx | ✅ | Line 11 "CPR" 확인 |

### 2. Alembic 마이그레이션 안전성
- **CC CaregiverReview**: ✅ `caregiver_reply` + `replied_at` 이미 오늘 적용됨 — 추가 작업 불필요
- **PT WalkerReview**: ❌ `walker_reply` + `replied_at` 필드 없음 — 신규 마이그레이션 필요
- **PT WalkerQualification**: `has_insurance`, `insurance_expiry`, `profile_photo_url` 추가 필요
- **PT WalkerAvailability**: `recurrence_rule`, `recurrence_end_date` 추가 필요
- **위험**: autogenerate 시 기존 5개 테이블(notification_*, api_keys, messages, webhooks) 삭제 재시도 가능 → 수동 편집 필수

### 3. 가정 검증

| 가정 | 검증 결과 |
|------|----------|
| A1 커스텀 DatePicker | ⚠️ 타당하나, Expo Go SDK 54에서 `@react-native-community/datetimepicker`는 실제로 지원됨. 커스텀이 더 안전하긴 함 |
| A2 이미지 S3 미연결 | ✅ 현재 S3 설정 없음 확인 |
| A3 PT 리뷰 = CC 패턴 | ✅ 동일 패턴 적용 가능 |
| A4 백엔드 CSV | ✅ 타당 |
| A5 클라이언트 필터 | ⚠️ 검색 API 응답에 pet size 정보 포함 여부 미확인. 포함 안 되면 필터 불가 |
| A6 보험 표시 전용 | ✅ |
| A7 간소화 RRULE | ✅ 타당 |
| A8 Toast 통일 | ⚠️ 결제 실패 등 금전 관련은 Alert이 더 적절 |

### 4. 숨은 의존성
- PT-15 (리뷰 답변) → PT 백엔드 마이그레이션이 먼저 → 그 다음 API → 그 다음 UI
- PT-21/CC-23 (사진 FAB) → `expo-image-picker` 패키지 설치 선행
- PT-24/CC-30 (CSV) → `expo-file-system` + `expo-sharing` 패키지 설치 선행
- PT-19 (프로필 바인딩) → 기존 API가 실제 유저 이름을 반환하는지 확인 필요

### 5. 수용 기준 누락
- PT-25 반복 스케줄: "반복 생성된 슬롯을 개별 삭제할 수 있는가?" 미명시
- CC-22 부분 출금: "최소 금액 미만 입력 시 에러 메시지" 미명시
- CC-32 가용시간: "과거 날짜 슬롯 자동 필터" 미명시

---

## Reviewer C: UX Advocate

### 1. 페르소나별 적합성

| 페르소나 | 주요 관련 이슈 | 수정 적합성 |
|---------|-------------|-----------|
| 이수진(52세 비기술) | PT-13 DatePicker | ✅ 커스텀 모달이면 충분. 핵심은 YYYY-MM-DD 직접 입력 제거 |
| 최동현(전문 산책사) | PT-14, PT-15, PT-20 | ✅ 프로 사용자 핵심 니즈 충족 |
| 김태호(비기술 보호자) | CC-25, CC-26 | ✅ 용어 한국어화 적절 |
| 박미영(전문 돌봄자) | CC-22, CC-28 | ✅ 정산 투명성 개선 |

### 2. 커스텀 DatePicker UX
- 연/월 선택 → 날짜 그리드 → 확인 3단계면 충분
- 핵심: 오늘 이전 날짜 선택 불가, 기본값 = 오늘
- 네이티브보다 브랜딩 일관성 높음 — **적절한 선택**

### 3. Toast vs Alert
- **Toast 적절**: 네트워크 일시 오류, 검색 실패, 데이터 로드 실패
- **Alert 필요**: 출금 실패, 예약 취소 실패, 결제 관련 오류 → A8 가정 수정 권고
- **권고**: 금전 관련 에러만 Alert, 나머지는 Toast

### 4. "안심 결제" 용어
- ✅ 한국 결제 시장에서 널리 사용됨 (네이버페이, 쿠팡 등)
- "에스크로"보다 직관적, 신뢰감 높음
- 추가 권고: "돌봄 완료 후 결제 확정" 부연 설명 유지

### 5. 부분 출금 UX (CC-22)
- 현재: 잔액 전체 출금만 가능
- 권고: 금액 입력 필드 + 프리셋 버튼(전액 / 50% / 직접 입력)
- 최소 출금 1,000원, 100원 단위 입력
- 잔액 부족 시 실시간 유효성 검사

### 6. 사용자 이탈 방지 TOP 5 수정 우선순위
1. **PT-13 / CC 동일** — 날짜 선택 UI (4개 페르소나 모두 지적, 비기술 사용자 즉시 이탈)
2. **PT-19 / CC-20** — 프로필 실제 데이터 (하드코딩 → 서비스 신뢰도 직결)
3. **CC-22** — 부분 출금 (돌봄자 정산 불만 → 경쟁 플랫폼 이탈)
4. **PT-15** — 리뷰 답변 (전문 산책사 신뢰 핵심)
5. **CC-27** — 에러 무음 해소 (모든 페르소나 공통, 앱 신뢰도)

### 7. 독립 수정 시 UX 흐름 파괴 위험
- PT-16(예약 상태) + PT-13(날짜) 함께 수정해야 예약 플로우 일관성 유지
- CC-19(아동 이름) + CC-21(알레르기) + CC-24(Handover) — 돌봄 세션 흐름 내 연속 정보
- PT-14(메모) + PT-21(사진) — 산책 완료 보고서 기능으로 묶여야 함

### 8. 접근성
- 날짜 그리드: 터치 타깃 최소 44x44dp 유지
- Toast 메시지: 3초 이상 표시 (고령 사용자 가독성)
- "심폐소생술" 텍스트 길이 증가 — 레이아웃 확인 필요

---

## Cross-Review Summary

| 항목 | Req Analyst | Tech Verifier | UX Advocate | 합의 |
|------|------------|--------------|-------------|------|
| 범위 적절성 | ✅ | ✅ | ✅ | 합의 |
| P3 제외 3개 | ✅ 적절 | ✅ 적절 | ✅ 적절 | 합의 |
| A5 클라이언트 필터 | ⚠️ API 확인 필요 | ⚠️ 동일 | N/A | 확인 필요 |
| A8 Toast 통일 | N/A | ⚠️ 금전=Alert | ⚠️ 금전=Alert | **수정: 금전 에러는 Alert** |
| PT-15 난이도 | ⚠️ "대" | ⚠️ 마이그레이션+API+UI | N/A | **수정: 난이도 "대"로 상향** |
| PT-25 RRULE | ⚠️ 복잡도 | ⚠️ unique constraint | N/A | **위험 인지** |
| expo-image-picker | 미확인 | 설치 필요 | N/A | **선행 확인 필요** |
| CSV 다운로드 | expo-file-system 필요 | 동일 | N/A | **선행 확인 필요** |

---

## Addendum: UX Advocate 상세 리뷰 (2026-04-09, 후속 수신)

### 추가 발견 사항 (구현에 반영)
1. **PT BookingCreateScreen에도 "에스크로" 텍스트 존재** → PT에서도 "안심 결제"로 교체 지시
2. **보험 배지를 SearchScreen 검색 결과 카드에도 표시** → 프로필 상세 진입 전 신뢰 신호
3. **ImagePicker 선택 후 "저장 대기" 피드백 필요** → 침묵 성공은 고장처럼 보임
4. **CC-22 부분 출금: 최소 금액 인라인 표시 + 콤마 포맷** → 금융 UX 신뢰
5. **CC-24 HandoverScreen: SessionScreen checkout에서 child_name/caregiver_name 전달 필요** → 라우트 파라미터 확장

### UX 리뷰어 사용자 이탈 방지 TOP 5
1. DatePicker (8/8 페르소나)
2. 에러 처리 Toast/Alert (7/8 페르소나)
3. 보험 배지 검색 결과 표시 (신뢰 핵심)
4. 예약 상태 명확화 (이중 신뢰 파괴 방지)
5. 부분 출금 (전문 돌봄자/산책사 경제적 존엄)
