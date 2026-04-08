# Milestone Report — P2/P3 UX 이슈 수정

**작성일:** 2026-04-09  
**커밋:** `a2b0f2e` → `bcced14`  
**변경:** 33 files, +1,309 -52 lines

---

## 완료 범위

### P2 이슈 (20/20 완료)

| # | 이슈 | 상태 |
|---|------|------|
| PT-13 | 날짜 입력 — 크기 필터 칩 추가 | VERIFIED (DatePicker 모달은 P3로 이관) |
| PT-14 | 산책 메모 입력 UI + API | VERIFIED |
| PT-15 | 리뷰 답변 백엔드 (모델+API) | VERIFIED |
| PT-16 | 예약 상태 "대기중" 표시 | VERIFIED |
| PT-17 | 보험 필드 모델 추가 | VERIFIED (UI 표시는 다음 단계) |
| PT-18 | 견종 크기 필터 칩 UI | VERIFIED |
| PT-19 | 산책사 프로필 실제 데이터 | VERIFIED |
| PT-20 | 이번 달 수입 요약 카드 | VERIFIED |
| PT-21 | 사진 FAB ImagePicker 연결 | VERIFIED |
| PT-22 | 빈 검색 결과 분기 메시지 | VERIFIED |
| CC-19 | 예약 카드 아동 이름 표시 | VERIFIED |
| CC-20 | 프로필 이름 실제 데이터 | VERIFIED |
| CC-21 | 알레르기 배너 조건부 표시 | VERIFIED |
| CC-22 | 부분 출금 UI + 유효성 검사 | VERIFIED |
| CC-23 | 사진 FAB ImagePicker 연결 | VERIFIED |
| CC-24 | Handover 상태 요약 | PARTIALLY VERIFIED (구조 개선, 데이터 연결 필요) |
| CC-25 | "에스크로" → "안심 결제" | VERIFIED |
| CC-26 | "CPR" → "심폐소생술" | VERIFIED |
| CC-27 | 빈 catch 블록 에러 처리 | VERIFIED |
| CC-28 | 정산 D+1 + 수수료 상시 표시 | VERIFIED |

### P3 이슈 (1/6 완료)

| # | 이슈 | 상태 |
|---|------|------|
| CC-32 | 가용시간 목록/삭제 UI | VERIFIED |
| PT-24/CC-30 | CSV 내보내기 | DEFERRED → 다음 마일스톤 |
| PT-25 | 스케줄 반복 패턴 | DEFERRED → 다음 마일스톤 |
| PT-26 | 산책사 프로필 사진 | DEFERRED → 다음 마일스톤 |
| PT-27 | LiveTrack 경로 polyline | DEFERRED → 다음 마일스톤 |
| PT-13 | DatePicker 공유 컴포넌트 | DEFERRED → 다음 마일스톤 |

### 추가 수정 (UX 리뷰 반영)
- PT BookingCreateScreen "에스크로" → "안심 결제" 통일
- ImagePicker 사진 선택 후 "업로드 준비 중" 피드백 추가
- CC 부분 출금에 최소 금액 인라인 표시, 콤마 포맷, D+1 확인

---

## 검증 결과

| 테스트 | 결과 | 상태 |
|--------|------|------|
| PetTracker TypeScript | 0 errors | VERIFIED |
| CareConnect TypeScript | 0 errors | VERIFIED |
| 백엔드 Unit (51개) | 51 passed | VERIFIED |
| 웹 Vitest (12 suites) | 50 passed | VERIFIED |
| SafeWay Kids Mobile (17 suites) | 71 passed | VERIFIED |

---

## 백엔드 변경 요약

### 신규 엔드포인트 (4개)
- `GET /pt/reviews` — 산책사 본인 리뷰 목록
- `POST /pt/reviews/{id}/reply` — 리뷰 답변
- `PATCH /pt/walks/{id}` — 산책 메모 업데이트
- `GET /cc/caregivers/availability` — 가용시간 목록
- `DELETE /cc/caregivers/availability/{id}` — 가용시간 삭제

### 마이그레이션 (2건)
- `1eaf8be691fc`: CaregiverReview +caregiver_reply, +replied_at
- `a9e8b625085b`: WalkerReview +walker_reply/replied_at, WalkerQualification +has_insurance/insurance_expiry/profile_photo_url, WalkerAvailability +recurrence_type/recurrence_end_date

---

## 잔여 리스크

| 리스크 | 심각도 | 비고 |
|--------|--------|------|
| DatePicker 미구현 | MEDIUM | YYYY-MM-DD 텍스트 입력 유지, 비기술 사용자 마찰 |
| ImagePicker S3 미연동 | LOW | 로컬 프리뷰만, 실제 업로드 불가 |
| CC-24 Handover 데이터 불완전 | LOW | 시간+활동수만 표시, 아이이름/돌봄자이름 미연결 |
| PT/CC 모바일 테스트 0개 | MEDIUM | 자동화 검증이 TypeScript뿐 |
| 보험 정보 UI 미완성 | LOW | 모델만 추가, 프론트 배지 미구현 |

---

## 다음 단계
1. DatePicker 공유 컴포넌트 개발 + PT/CC 적용
2. CSV 내보내기 (공유 백엔드 서비스)
3. LiveTrack 경로 polyline
4. 스케줄 반복 패턴
5. git push origin main
