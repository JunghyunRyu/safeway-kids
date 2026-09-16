# PetTracker 10-페르소나 기능·UX 개선 로드맵

- **일자**: 2026-06-04
- **방법**: 3 `ux-advocate` 에이전트 병렬, 10 페르소나 1인칭 시나리오 워크스루 (코드 Read 기반)
- **범위**: net-new 개선만 (직전 UX 감사 86건 + QA 6건 수정분 제외)
- **총 발견**: ~44건 → 클러스터 12개로 통합. **상태**: 제안(미구현). 구현 여부는 사용자 결정.

## 페르소나 로스터
| # | 페르소나 | 고통 민감도 축 |
|---|---|---|
| 1 | 김지훈(32, 직장인, 말티즈) | 시간압박·반복예약 |
| 2 | 박순자(67, 노령견 14세, 디지털약함) | 의료케어·시니어 접근 |
| 3 | 이도현(28, 대형견 리트리버) | 견종 매칭 |
| 4 | 최유나(24, 첫반려 2개월, 불안) | 온보딩·신뢰 |
| 5 | 정민석(41, 다견 2마리) | 다견 관리·가족공유 |
| 6 | 한서영(35, 워킹맘, 신뢰극민감) | 증거기반 안심 |
| 7 | 오세훈(55, 가격민감·정기이용) | 정기/비용 예측 |
| 8 | 강태리(21, 대학생 부업워커) | 공급자 효율·즉시성 |
| 9 | 윤재호(38, 전업워커) | 다건운영·수입예측·평판 |
| 10 | 서지안(30, 저시력 스크린리더) | 접근성 |

---

## 클러스터별 통합 (수요 페르소나 수 = 우선순위 신호)

### C1. 정기 예약 + 즐겨찾기/단골 워커 ★수요 2인 (P0)
- 정기 예약 생성(반복 패턴: 매주/격주, 요일+시간, N회/~날짜) — 김지훈·오세훈
- 즐겨찾기 워커 저장 + 홈 "단골 도우미" 퀵 진입 — 김지훈·오세훈
- WalkReport/BookingDetail "같은 도우미에게 다시 예약" 1탭 — 김지훈
- **백엔드**: `Booking.recurring`·`favorite_walker_id` 필드 + 즐겨찾기 API 부재
- 화면: `BookingCreateScreen`·`WalkerProfileDetailScreen`·`OwnerHomeScreen`

### C2. ActivityFeed 빈 탭 + 산책 중 사진 ★수요 2인 (P0)
- ActivityFeed가 탭바에 노출되나 플레이스홀더 → "앱 고장" 오해(최유나) / 가장 강한 안심신호 부재(한서영)
- **단기**: 탭바에서 제거하거나 "여기에 산책 업데이트가 올 거예요" 예시 카드로 대체
- **핵심**: LiveTrackScreen에 산책 중 최근 사진 썸네일 1장 — "지도 점"보다 "강아지 얼굴"이 불안 즉시 해소
- 화면: `ActivityFeedScreen`·`LiveTrackScreen`

### C3. 워커 현장 효율: 예약카드 Pressable + 픽업주소 + 실수령액 (P0)
- WalkerHome 오늘 예약 카드가 `View`(탭 불가) + 픽업주소 없음 → 다건 동선 계획 불가(윤재호)
- pending 카드에 실수령 예상액(총액-수수료) 표시 — EarningsScreen에 계산 로직 이미 존재(강태리)
- WalkScreen idle 카드 탭 시 바로 시작 Alert → 상세(주소/연락/특이사항) 먼저 보는 바텀시트(윤재호)
- 화면: `WalkerHomeScreen`·`WalkScreen`·`EarningsScreen`

### C4. 접근성 net-new ★P0 (서지안)
- LiveTrack LIVE 배지·경과시간에 `accessibilityLiveRegion="polite"` + 의미있는 라벨 (연결변화·진행 음성 인지)
- 전역 `maxFontSizeMultiplier` 부재 → xs/48 하드코딩 폰트가 대형폰트서 레이아웃 붕괴
- OwnerHome 다음예약 라벨에 시간·도우미명·분수 포함 / BookingsScreen FlatList 항목수 안내
- WebView 지도 접근성 트리 비노출 → 위치 텍스트 대안
- 화면: `LiveTrackScreen`·`WalkScreen`·`ScheduleScreen`·`OwnerHomeScreen`·`BookingsScreen`

### C5. 검색 필터·매칭 확장 ★수요 2인 (P1)
- 견종 large "대형견 환영" 배지 — 검색 카드 인라인 + 프로필 구조화(담당 가능 크기) — 이도현
- 보험/신원 인증 필터 칩 — 한서영
- (백엔드 `accepted_sizes` 필드는 QA에서 추가됨 → 워커 입력 UI + 검색 배지 노출이 후속)
- 화면: `SearchScreen`·`WalkerProfileDetailScreen`

### C6. 신뢰 증거 심화 (P1, 한서영·최유나)
- 보험 배지 탭 → 보험 상세 바텀시트(보험사·증권번호·만료일) — 현재 배지가 Pressable 아님
- 워커 프로필 "사고 이력 0건" 명시 배지 (0건 증명이 신뢰 증가)
- 신뢰 배지 툴팁("본인인증이란?") — 첫 사용자
- 리뷰 카드에 날짜+펫규모 맥락 태그 (구체성=신뢰)
- confirmed 상태에도 "도우미 메시지" 버튼
- 화면: `WalkerProfileDetailScreen`·`BookingDetailScreen`

### C7. 다견 가정 지원 (P0~P2, 정민석)
- 예약 시 펫 다중선택 + 같은 날 일괄예약 (현재 8~10탭 → 3탭) **P0**
- BookingsScreen 펫별 필터 칩 / PaymentHistory 펫별 소계 + pet_name
- 가족 공유/동반계정 초대(배우자 알림 공유) / 예약 일괄 취소
- 화면: `BookingCreateScreen`·`BookingsScreen`·`PaymentHistoryScreen`·`ProfileScreen`

### C8. 비용 예측·정기 할인 (P1~P2, 오세훈)
- PaymentHistory 월별 탭 + 예정 지출 합산("이번 달 예상 X원")
- 정기 이용 할인/패키지(4·8회권) / 정기예약 자동생성 알림
- 화면: `PaymentHistoryScreen`·`BookingCreateScreen`

### C9. 시간 슬롯 확장 (P0, 김지훈)
- TIME_SLOTS 상한 오후 8시 → 오후 9~10시 추가 (야근 직장인 핵심 use case 차단 해소)
- 화면: `BookingCreateScreen`

### C10. 시니어·접근 지원 (P0~P1, 박순자)
- 전화 고객센터 번호 노출 (현재 이메일만 → 시니어 차단) **P0**
- 의료정보 입력 후 "도우미에게 전달됩니다" 확인 문구 / 약 복용 리마인더·투약 메모 전달
- 온보딩에 노령견·특수케어 문구
- 화면: `ProfileScreen`·`PetRegistrationScreen`·`OnboardingScreen`

### C11. 첫 사용자 온보딩 가이드 (P1, 최유나)
- 첫 사용자 체크리스트("1.아이등록 2.도우미찾기 3.예약")
- 홈 빈상태 카피를 명령형→동기부여형 / 성격태그 "아직 모르겠어요" 옵션 / 리뷰 예시 프롬프트
- 화면: `OwnerHomeScreen`·`OnboardingScreen`·`PetRegistrationScreen`·`ReviewScreen`

### C12. 워커 평판·자격·노쇼 (P2~P3, 윤재호·강태리)
- 자격증 만료 30일전 알림(현재 comingSoon) / 노쇼 대응 1탭(연락·취소신고)
- 수입 목표·달성률·전월 비교 / "내 리뷰 보기" comingSoon→빈 리스트 화면
- 화면: `WalkerProfileScreen`·`WalkScreen`·`EarningsScreen`

---

## Top 우선순위 추천 (P0, 수요·임팩트 종합)
1. **C2 ActivityFeed 정리 + 산책중 사진** — 신뢰 직결, 2 페르소나, 단기 처리 가능
2. **C3 워커 예약카드 Pressable+픽업주소** — 워커 이탈 방지, 코드 변경 작음
3. **C9 시간슬롯 확장** — 1줄 상수 변경, 직장인 use case 즉시 해소
4. **C10 전화 고객센터** — 시니어 차단 해소, 카피/링크 추가 수준
5. **C4 접근성 LiveRegion** — 저시력 사용자 실시간추적 음성화
6. **C1 정기예약/즐겨찾기** — 2 페르소나, 단 백엔드 스키마 필요(중규모)
7. **C7 다견 다중선택** — 다견가정 핵심, 중규모

> 1~5는 소규모(카피·레이아웃·필드)로 빠른 가치. 6~7은 백엔드 스키마 동반 중규모. C5는 QA에서 추가한 `accepted_sizes`를 실데이터로 잇는 후속.

## 검증 메모
- 전 항목 화면 코드 Read 근거. 일부(약 전달 백엔드 흐름·폰트 절댓값)는 PARTIALLY/UNVERIFIED로 원 리포트에 표기됨.
- 원본 3 에이전트 리포트는 세션 대화에 보존.
