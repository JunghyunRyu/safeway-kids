# Consensus Matrix — P2/P3 UX 이슈

**작성일:** 2026-04-09  
**Phase:** 2 — Consensus

---

## 이견 해소

| # | 이슈 | 이견 내용 | 해소 결정 | 근거 |
|---|------|----------|----------|------|
| D1 | A8 Toast 통일 | 금전 에러(출금/결제)도 Toast? | **금전 에러는 Alert, 나머지 Toast** | 출금 실패는 사용자 자산 관련 — 더 강한 피드백 필요 |
| D2 | PT-15 난이도 | Brief에서 "중" | **"대"로 상향** — 마이그레이션+API+UI 전체 필요 | CC는 이미 완료, PT는 모델/API/UI 모두 신규 |
| D3 | A5 클라이언트 필터 | 검색 API 응답에 크기 정보? | **Pet 모델에 weight_kg 존재 → API 응답에 포함시키면 가능** | models.py:52 확인 |
| D4 | expo-image-picker | 설치 여부 미확인 | **미설치 확인 → 설치 필요. Expo Go SDK 54 호환 확인됨** | 전체 package.json 검색 결과 |
| D5 | CSV 다운로드 메커니즘 | expo-file-system 필요? | **expo-sharing 활용 (공유 시트로 파일 전달)** | 모바일 CSV 직접 저장보다 공유가 UX 자연스러움 |
| D6 | PT-25 unique constraint | recurrence 확장 시 충돌 | **unique constraint를 (walker_id, available_date, start_time)으로 변경** | 같은 날 여러 시간대 가능해야 함 |
| D7 | PT-19 API 데이터 | 프로필 API가 유저 이름 반환? | **확인 필요 → WalkerProfileScreen에서 기존 profile API 호출로 변경** | WalkerProfileDetailScreen은 이미 동적, 동일 API 사용 |
| D8 | 반복 슬롯 개별 삭제 | 수용 기준 누락 | **반복 생성된 슬롯은 개별 삭제 가능 (독립 레코드)** | Option B(확장 후 저장) 채택 |

## 선행 작업 합의

| 순서 | 작업 | 이유 |
|------|------|------|
| 0-1 | `expo-image-picker`, `expo-file-system`, `expo-sharing` 설치 (PT+CC) | PT-21, CC-23, PT-24, CC-30 선행조건 |
| 0-2 | PT WalkerReview 마이그레이션 (walker_reply + replied_at) | PT-15 선행조건 |
| 0-3 | PT WalkerQualification 마이그레이션 (has_insurance, insurance_expiry, profile_photo_url) | PT-17, PT-26 선행조건 |
| 0-4 | PT WalkerAvailability 스키마 확인 (recurrence 필드) | PT-25 선행조건 |

## 구현 순서 합의 (마일스톤 분할)

### Milestone A: Quick Wins (소 난이도 12개, ~2시간)
텍스트 교체, 데이터 바인딩, 단순 UI 수정

| 이슈 | 내용 |
|------|------|
| CC-25 | "에스크로" → "안심 결제" |
| CC-26 | "CPR" → "심폐소생술" |
| CC-27 | 빈 catch 블록 → Toast/Alert |
| CC-28 | D+1 정산 주기 강화 |
| CC-19 | 예약 카드 아동 이름 |
| CC-20 | 프로필 이름 실제 데이터 |
| PT-19 | 산책사 프로필 실제 데이터 |
| PT-16 | 예약 상태 표시 개선 |
| PT-22 | 빈 검색 결과 분기 |
| PT-20 | 이번 달 수입 요약 |
| CC-32 | 가용시간 목록 표시 (API 추가) |
| PT-17 | 보험 정보 표시 (마이그레이션 후) |

### Milestone B: Medium Features (중 난이도 8개, ~4시간)
커스텀 UI 컴포넌트, API 연동, ImagePicker

| 이슈 | 내용 |
|------|------|
| PT-13 | 커스텀 DatePicker 모달 (PT+CC 공유 컴포넌트) |
| PT-14 | 산책 메모 입력 + API |
| PT-21 | 사진 FAB + ImagePicker (PT) |
| CC-23 | 사진 FAB + ImagePicker (CC) |
| CC-21 | 알레르기 배너 데이터 연결 |
| CC-22 | 부분 출금 UI + 유효성 검사 |
| CC-24 | Handover 아이 상태 요약 |
| PT-18 | 견종 크기 필터 |

### Milestone C: Full-Stack Features (대 난이도 3개, ~3시간)
백엔드+프론트 동시 변경, 마이그레이션

| 이슈 | 내용 |
|------|------|
| PT-15 | 리뷰 답변 (모델+API+UI) |
| PT-24/CC-30 | CSV 내보내기 (공유 서비스) |
| PT-27 | LiveTrack 경로 polyline |

### Milestone D: Schedule Enhancement (중-대 난이도 2개, ~2시간)
| 이슈 | 내용 |
|------|------|
| PT-25 | 스케줄 반복 패턴 |
| PT-26 | 산책사 프로필 사진 |

## 최종 합의 사항

1. **총 26개 이슈** (P2 20개 + P3 6개), 4개 마일스톤으로 분할
2. **P3 제외 3개** (그룹산책, 다중아동, 실시간지도) 유지 — 별도 Tech Spec
3. **금전 에러 = Alert, 나머지 = Toast** (A8 수정)
4. **PT-15 난이도 "대"로 상향**
5. **expo 패키지 3개 설치 선행**
6. **DatePicker는 공유 컴포넌트로 1회 개발, PT+CC 재사용**
7. **CSV 내보내기는 공유 백엔드 서비스 1개, 앱별 라우터에서 호출**
