# Final Tech Spec — 모두의 창업 5/15 마감 실행 패키지

**Date**: 2026-05-03
**Phase**: 3 (Final Tech Spec)
**Status**: APPROVED for Phase 4 Todo Plan
**Source artifacts**:
- Phase 0 Brief: `artifacts/specs/2026-05-03-modoo-deadline-execution-brief.md`
- Phase 1 Reviews (4): `artifacts/reviews/2026-05-03-modoo-deadline-execution-{frontend,product,fundraising,business}-review.md`
- Phase 2 Consensus: `artifacts/reviews/2026-05-03-modoo-deadline-execution-consensus.md`

**User-anchored decisions**: D-1=A / D-2=A / D-3=마포·용산 / D-4=C / F-1=A / F-2=C + 우선순위 원칙 (5/15 신청 > 6/9 PT 출시)

---

## 1. Problem Statement

5/15 16:00 모두의 창업 2026 K-Startup 포털 제출까지 12일. 신청서 v1 자체 채점 36/50 (72%) 상태에서 4개 산출물의 동시 정합화 작업이 critical path. 4 산출물이 묶이지 않으면 다음 4가지 위험이 동시 발생: (1) 평가위원 앱 다운로드 시 MOCK 데이터 노출로 신뢰도 파괴, (2) 신청서 §1 현재 시제 vs §4 미래 시제 충돌, (3) 영상 25~55초 슬라이드 vs 평가위원 기대치 불일치, (4) 다음 세션이 잘못된 prior state에서 출발. 본 spec은 4 산출물의 통합 구현 명세.

---

## 2. Goals

| ID | Goal | 측정 가능 success criteria |
|---|---|---|
| G-1 | 신청서 평가위원·실 사용자 양쪽이 앱·신청서·영상을 교차 검토할 때 내러티브 일관성 유지 | 5/13 v3 전 3자 일관성 self-audit 표 4행(GPS/AI 캡션/사고 신고/ActivityFeed) 모두 정합 |
| G-2 | 5/9 v2 작성 세션이 ~2시간 내 완성 가능한 inject 가이드 제공 | inject 가이드 섹션당 복붙 가능 텍스트 블록 + 5/8 전·후 분리 |
| G-3 | 5/12 영상 단독 제작 (사용자) — 추가 결정·재설계 없이 실행 | 60초 씬-by-씬 시나리오 + 음성 스크립트 + 자막 + Hybrid 구조 명시 |
| G-4 | 5/8~5/15 critical path에서 5/12~5/13 자원 경합 해소 | SafeWay v2.2 5/14 연기 적용 + 5/11 freezing deadline + LOI 마포·용산 2명+ |
| G-5 | 평가 5축 76→80+ 도달 (5/8 게이트 통과 시) | 가능성 +0.5~1 / 구체성 +1~1.5 / 차별성 +0~0.5 / 효과성 +1.5~2 |
| G-6 | ActivityFeedScreen MOCK 노출 차단 | grep `MOCK_FEED` 0건 + jest 20 pass + tsc 0 errors |
| G-7 | STATE.md 80줄 rule 준수 + CLAUDE.md Active Work mirror 4 필드 일치 | wc -l ≤ 80 |

---

## 3. Non-Goals

- Track 2 AI 5축 구현 (T2.0~T2.6, 5/16~6/9 별도 사이클)
- V1.1 UI 본격 리디자인 (워커 프로필 사진, Skeleton, 마이크로 인터랙션)
- EXT-9~12 외부 계정 발급 (Track 2 의존, 5/16 이전 확보 필요하나 본 패키지 외)
- 5축 자가 채점 (5/10 작업, 별도)
- 이미지 5장 제작 (사용자 직접)
- 운영기관 최종 선택 (5/14)
- SafeWay Kids 샌드박스 v2.1 후속 본 작업 (병렬 워크스트림)
- ActivityFeed 외 다른 화면 (HomeScreen·SearchScreen) MOCK 데이터 audit (V1.0 출시 전 별도)
- CareConnect·SDET Code·루넨랩스 작업

---

## 4. User Scenarios

**S-1 (평가위원·서면)**: 5/15 제출 후 평가위원이 신청서 PDF를 읽는다. §1에서 "AI가 사고를 자동 처리하도록 설계된 반려견 산책 매칭 플랫폼 — 6/9 출시 예정"을 본다. §4 실행 계획 표에서 Track 2 AI 5축 5/16~6/9 phasing + "1라운드(7월) 진입 시 완성" 정합 한 줄 확인. 내러티브 일관성 유지.

**S-2 (평가위원·앱 다운로드)**: 평가위원이 신청서에 명시된 코드베이스 신뢰도 검증 위해 앱을 다운로드한다. ActivityFeed 탭 진입 시 "활동 피드 — 실시간 산책 업데이트 기능이 곧 출시됩니다" + Bookings CTA 노출. MOCK 데이터 0건. 평가위원이 "정직한 phasing" 인식.

**S-3 (실 보호자·온보딩)**: 5/16 이후 베타 가입자가 앱 설치 → ActivityFeed 진입 → placeholder + "예약 확인하기" CTA → Bookings 탭 진입 → 빈 Bookings → Search 탭 자연 흐름.

**S-4 (영상 시청자·평가위원)**: 영상 0~25초 = 실 앱 화면(GPS 추적), 25~55초 = 슬라이드+음성 (AI 캡션·사고 자동화), 55~60초 = 클로징("2026.06.09 출시 예정"). 30초 시점 자막 또는 음성으로 "AI" 단어 등장 → 차별성 통과. 평가위원이 60초 안에 4개 핵심 메시지(가능성/차별성/기대효과/구체성) 인식.

**S-5 (1라운드 멘토링·7월)**: 멘토가 앱을 직접 실행. ActivityFeed = "준비 중 (6월 출시 예정)" 또는 Track 2 T2.3 완료 시 실 API 연결 상태. 신청서 §4 phasing 약속과 일치. cognitive dissonance 차단.

---

## 5. Functional Requirements

### 산출물 1 — STATE.md + CLAUDE.md mirror

- **FR-1.1** D-1·D-2·D-3·D-4·F-1·F-2 6 결정 명시 레이블(D-1=A, D-2=A, ...) 기재
- **FR-1.2** Next gate 시퀀스: 5/3 산출물 작성 → 5/7 변호사 + UD-3 결정 → 5/8 D-7 게이트 → 5/9 v2 inject → 5/10 채점 → 5/11 freezing → 5/12 영상 → 5/13 v3 → 5/14 운영기관 + SafeWay v2.2 → **5/15 16:00 K-Startup 제출** → 5/16 Track 2 시작
- **FR-1.3** "5/15 신청 > PT 출시 > SafeWay 샌드박스" 3레벨 우선순위 1줄 명시
- **FR-1.4** 5/8 게이트 미달 fallback 1줄: "가입자 <30 OR LOI <3 시 K-Startup 초기창업패키지 7월 전환, 산출물 3·4 작업 중단, 6월 신청서 재작성"
- **FR-1.5** Brief R-7 영향 등급 "낮음" → "중간" 재분류
- **FR-1.6** SafeWay 5/7 변호사·5/14 v2.2(연기 후) STATE Critical Path 병기
- **FR-1.7** CLAUDE.md "Active Work (Live)" 4 필드 (active workstream / current phase / next gate / blockers) STATE 일치
- **FR-1.8** STATE 총 라인 수 ≤ 80줄 (압축: M0~M9 마일스톤 이력 삭제, CLAUDE.md "프로젝트 진행 현황" 중복 → 정보 손실 0)

### 산출물 2 — ActivityFeedScreen placeholder

- **FR-2.1** `MOCK_FEED` 식별자 0회 (grep 검증)
- **FR-2.2** FlatList·renderItem·ActivityItem 인터페이스·timeline 스타일 전부 제거
- **FR-2.3** placeholder 화면 = `View` + `Ionicons paw 64px Colors.primary` + 제목 + 본문 + CTA Pressable
- **FR-2.4** 본문 텍스트: "**실시간 산책 업데이트 기능이\n곧 출시됩니다.**" — 6월 출시 phasing은 별도 부 텍스트 또는 본문에 통합 (D-1=A 톤 cognitive dissonance 완화)
- **FR-2.5** CTA = `navigation?.navigate?.('Bookings')` (optional chaining, navigator 미등록 런타임 에러 방지)
- **FR-2.6** CTA 라벨 = "예약 확인하기"
- **FR-2.7** `accessibilityRole="button"`, `accessibilityLabel="예약 확인하기"`, `hitSlop={8}` 추가
- **FR-2.8** `testID="activity-feed-placeholder"` 삽입 (V1.1 21번째 테스트 커버 사전)
- **FR-2.9** WCAG AA 명암비: 본문 = `Colors.textSecondary` (textDisabled 금지), CTA 텍스트 = `Colors.textInverse` 유지하되 배경은 `Colors.primary` 검토 후 미달 시 `Colors.primaryDark`로 강화 또는 텍스트를 `Colors.textPrimary`로 변경
- **FR-2.10** 코드 주석: "navigator 미등록 → CTA non-operational, V1.1 stack 등록 시 자동 동작"
- **FR-2.11** `route` prop·`Shadows` import·back 버튼 제거

### 산출물 3 — 신청서 v2 inject 가이드

- **FR-3.1** 6 섹션 (§1·§3·§4·§5·§6·§7) 독립 항목 (Brief AC-3.1는 5섹션, +§6 = fundraising 권고)
- **FR-3.2** 각 항목 = 위치(줄/단락) + inject 내용(복붙 텍스트) + before/after 3열 구조
- **FR-3.3** 5/8 게이트 전 inject 가능 vs 5/8 후 inject 명확 구분
- **FR-3.4** §1 시제 정합 inject: "AI가 사고를 자동 처리**하도록 설계된** 반려견 산책 매칭 플랫폼 — 6/9 출시 예정"
- **FR-3.5** §4 Track 2 phasing 문장: "Track 2 AI 5축 구현 5/16~6/9 (T2.0 의존성 검증 → T2.1 인프라 → T2.2 사고 신고 LLM·모더레이션 → T2.3 사진 캡션·리포트·컨디션 → T2.4 GPS 이상 탐지 → T2.5 통합 테스트 → T2.6 Pre-launch QA + EAS Build). 완료 시점(6/9)은 결과 발표(6월 예상) 이전이므로 1라운드 멘토링(7월) 진입 시 AI 5축 완성 상태"
- **FR-3.6** D-1=A 톤 절충 표현 (영상 자막 + §4 phasing 문장에 부분 적용): "V1.0 출시 6/9 ±2d — Track 2 AI 5축(T2.0~T2.6) 완료 조건부"
- **FR-3.7** §4·§5 Beachhead 마포·용산 inject (5/8 전 가능)
- **FR-3.8** §4 60일 가설 검증 inject: "2026-08-09 60일 실측 마일스톤" — §3는 "(상세 일정 §4 참조)" 교차 참조, §3 본문 "2026.10 실측 마일스톤" 그대로
- **FR-3.9** §6 영상 계획 inject (F-2=C Hybrid 구조 반영)
- **FR-3.10** 5축 inject 점수 영향 추정표 포함 (Phase 2 합의 C-6)
- **FR-3.11** 루넨랩스 사업자등록 vs 신청 자격 점검 항목 ("예비창업자" → "창업 3년 이내" 조건부 수정)
- **FR-3.12** LOI 5명 지역 기준 inject (마포·용산 거주자 최소 2명 우선) — §5·§7

### 산출물 4 — 영상 시나리오 v2

- **FR-4.1** 60초 5+ 씬 분할, 시간(초) / 화면 / 음성 / 자막 4열
- **FR-4.2** Hybrid 구조: 0~25초 실녹화 (GPS 추적·매칭) / 25~55초 슬라이드+음성 (AI 캡션·사고 자동화) / 55~60초 클로징 슬라이드
- **FR-4.3** 30초 체크포인트 "AI" 단어 자막 또는 음성 등장 필수
- **FR-4.4** 음성 = 본인 녹음 (iOS Voice Memo + CapCut)
- **FR-4.5** 60초 종료 자막 출시일 표현 = **사용자 결정 (UD-2)**, 기본값 = "2026.06.09 출시 예정"
- **FR-4.6** Activity 탭 진입 금지 주의 1줄 (영상 녹화 중 placeholder 노출 방지)
- **FR-4.7** 0~25초 실녹화 시드 데이터 요구사항: 워커 5명 (마포·용산 지역) + 예약 2건 + 산책 세션 1건 + 평점 3건. 생성 = web 대시보드 "시드 데이터 생성" 또는 backend `seed.py` PT 데이터 추가
- **FR-4.8** 영상 미제출 fallback: 이미지 5장 (특히 슬롯 2 경쟁사 매트릭스·슬롯 5 멀티앱 시너지) 대체 가능성 명시
- **FR-4.9** 업로드 = YouTube Unlisted (검색 비노출 + URL 접근)
- **FR-4.10** 5/12 마감 체크리스트 (도구·플랫폼·마감 명시)

---

## 6. Non-Functional Requirements

- **NFR-1** 코드 최소 변경: ActivityFeedScreen.tsx 외 변경 없음
- **NFR-2** 디자인 일관성: 기존 `theme.ts` Colors·Typography·Spacing·Radius 토큰 재사용
- **NFR-3** Lottie 미사용 (package.json 미설치 확인). Ionicons + View 조합
- **NFR-4** 영상 단독 제작 가능 난이도: iOS 시뮬레이터 + CapCut + iPhone Voice Memo
- **NFR-5** inject 가이드 분량: 섹션당 복붙 가능 텍스트 블록 + 2시간 내 v2 본문 완성 가능
- **NFR-6** STATE.md ≤ 80줄
- **NFR-7** 신청서 v2 5축 점수 변경 추정 가능 (FR-3.10 inject 점수 매트릭스)
- **NFR-8** 영상 30초 체크포인트 "AI" 등장 필수 (FR-4.3)
- **NFR-9** 영상 0~25초 시드 데이터 사전 생성 검증 (5/11 freezing 전)

---

## 7. Constraints

- **C-1** 12일 데드라인 (5/3 → 5/15 16:00)
- **C-2** 1인 창업가 일일 가용 6~8h, 5/12~5/13 집중 구간 자원 경합
- **C-3** SafeWay 병렬 워크스트림 5/7 변호사·5/14 v2.2(연기 후)
- **C-4** EXT-9~12 미확보 (Track 2 5/16 시작 전 필수, 본 패키지 영향 X)
- **C-5** 5/8 D-7 게이트 데이터 (가입자 ≥30 + LOI ≥3) 충족 여부 불확실
- **C-6** 사용자 결정 D-1=A·D-2=A·D-3·D-4·F-1·F-2 + 우선순위 원칙 = 비변경 anchor

---

## 8. Architecture / Data Flow

### 산출물 1 STATE flow

```
[현재 STATE.md 185행] → [완료 마일스톤 이력 삭제 (M0~M9 표)] → [D-1~F-2 + 우선순위 + fallback inject]
  → [80줄 이내 검증] → [CLAUDE.md "Active Work" 4 필드 mirror 갱신]
```

### 산출물 2 코드 변경 flow

```
[ActivityFeedScreen.tsx 97행] → [Option B: 화면 전체 정적 View 교체] → [97 → ~65행]
  → [grep MOCK_FEED = 0] → [tsc --noEmit 0 errors] → [npm test 20 pass]
```

### 산출물 3 inject 가이드 flow

```
[v1 본문 (362행)] + [Phase 2 합의 C-1~C-7] + [FR-3.x 12 항목]
  → [6 섹션 × 3열 구조] → [5/8 전·후 분리] → [5축 점수 매트릭스]
  → [복붙 가능 텍스트 블록]
```

### 산출물 4 영상 flow

```
[F-2=C Hybrid] → [0~25초 실녹화 시뮬레이터 + 시드 데이터]
              → [25~55초 슬라이드 (CapCut) + 본인 음성]
              → [55~60초 클로징 슬라이드]
              → [60초 합성 → YouTube Unlisted 업로드]
```

---

## 9. Interfaces / AppState / Event Flow

### ActivityFeedScreen Component Interface

```tsx
type Props = {
  navigation?: { navigate?: (route: string) => void };  // optional chaining for missing stack
};

export default function ActivityFeedScreen({ navigation }: Props): JSX.Element;
```

### Navigation flow

```
OwnerTabNavigator (Home/Search/Bookings/Profile)
  └─ [Bookings 탭] (CTA 대상, 등록됨)

OwnerStackNavigator
  └─ ActivityFeedScreen (미등록, V1.0 dead route, V1.1 등록 예정)
```

### Critical Path Event flow

```
5/3 산출물 1·2·3·4 작성 (Claude Code)
  → 5/7 [사용자] 변호사 미팅 회수 + UD-3 결정 (SafeWay 5/13 → 5/14)
  → 5/8 [사용자] D-7 게이트 (가입자 30 + LOI 3) → PASS or FAIL
      → PASS: 5/9 v2 inject (placeholder 6 + 약점 Top 3)
      → FAIL: K-Startup 7월 전환, 산출물 3·4 작업 중단
  → 5/10 5 페르소나 채점 (운영기관 책임멘토 + 5 AC 포트폴리오)
  → 5/11 freezing deadline (신규 작업 추가 금지)
  → 5/12 [사용자] 영상 제작·YouTube Unlisted 업로드
  → 5/13 v3 (목표 80+) + 신청서·영상·앱 3자 self-audit 표
  → 5/14 운영기관 선택 + SafeWay v2.2 확정·사전 전달
  → 5/15 16:00 [사용자] K-Startup 포털 제출
  → 5/16 Track 2 시작 (T2.0 pip check)
```

---

## 10. Edge Cases

- **EC-1** 5/8 게이트 미달 (가입자 <30 OR LOI <3): 산출물 3·4 작업 즉시 중단, K-Startup 초기창업패키지 7월 전환, 6월 신청서 재작성. 산출물 1·2는 그대로 진행.
- **EC-2** 5/12 영상 제작 실패 (CapCut 에러·녹음 환경): 이미지 5장 대체. 신청서에 영상 URL 미첨부 + 이미지 5장 슬롯 활용.
- **EC-3** 시뮬레이터 시드 데이터 생성 실패 (web 대시보드 시드 미동작): 와이어프레임 슬라이드로 0~25초 구간도 처리 (전 구간 슬라이드+음성).
- **EC-4** 루넨랩스 사업자등록 5/15 전 완료: 신청서 §1·§7 자격란 "예비창업자" → "창업 3년 이내" 수정. inject 가이드에 점검 절차 포함.
- **EC-5** 5/13 SafeWay v2.2 + PT v3 충돌 (UD-3 미해소): SafeWay 작업 5/14로 강제 연기 또는 v3 1일 미루고 5/14 v3 완성.
- **EC-6** EXT 5건 중 1건 5/16 미확보: Track 2 시작 1~3일 지연 → 6/9 출시 6/12~14로 slip. 신청서 §4 "6/9 ±2d" 표현이 이를 흡수.
- **EC-7** ActivityFeedScreen 외 다른 화면 (HomeScreen·SearchScreen) MOCK 데이터 잔존: V1.0 출시 전 별도 audit (out-of-scope).
- **EC-8** 평가위원이 영상 30초에서 멈춤 (집중력 한계): "AI" 자막 30초 이내 등장 + 차별성 메시지 30초 이내 전달 (FR-4.3).
- **EC-9** STATE 80줄 압축 후 정보 손실 발견: 핸드오프 파일에서 archive 정보 복구 가능 (CLAUDE.md "프로젝트 진행 현황" + 최신 핸드오프).

---

## 11. Failure Handling

| 실패 모드 | 감지 | 대응 |
|---|---|---|
| `MOCK_FEED` grep ≠ 0 | grep 검증 | 코드 재수정, AC-2.1 미충족 시 산출물 2 재작업 |
| tsc 0 errors 미충족 | `npx tsc --noEmit` | 타입 정정. `any` 패턴 유지 (NFR-1) |
| jest 회귀 발생 | `npm test` 20 미만 | 회귀 분석 → ActivityFeedScreen 미관련 시 별도 이슈 분리 |
| inject 가이드 §1 시제 정합 누락 | 5/9 v2 작성 후 self-review | inject 가이드 즉시 보강, v2 재수정 |
| 영상 30초 "AI" 미등장 | 5/12 영상 self-check | 자막 추가 또는 음성 재녹음 |
| STATE 80줄 초과 | wc -l 검증 | 추가 압축 (이전 핸드오프 목록 최신 3건만 유지) |
| 5/8 게이트 FAIL | 가입자·LOI 카운트 | EC-1 fallback 즉시 발동 |
| SafeWay 자원 경합 표면화 | 5/12~5/13 일정 추적 | UD-3 활성화 (5/14 연기) |

---

## 12. Testing Strategy

### 산출물 1 (STATE)

- 자동: `wc -l STATE.md ≤ 80` / `grep "5/15 신청 > PT" STATE.md` / `grep "D-1=A" STATE.md`
- 수동: CLAUDE.md "Active Work (Live)" 4 필드 STATE 비교 (active workstream / current phase / next gate / blockers)

### 산출물 2 (ActivityFeedScreen)

- 자동:
  - `grep "MOCK_FEED" apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` → 0건
  - `cd apps/pettracker/mobile && npx tsc --noEmit` → 0 errors
  - `npm test` → 20 passed
- 수동: 시뮬레이터 진입 불가 (navigator 미등록), 코드 리뷰 수준만

### 산출물 3 (inject 가이드)

- 자동: 6 섹션 × 3열 구조 grep / 5/8 전·후 분리 grep / Track 2 phasing 문장 grep
- 수동: 5/9 v2 작성 세션에서 inject 가이드 → v2 본문 직접 적용 → 시제 정합 self-review

### 산출물 4 (영상 시나리오)

- 자동: 60초 분할 5+ 씬 / 30초 시점 "AI" 자막 또는 음성 grep / 4열 구조 grep
- 수동: 5/12 영상 제작 시 시뮬레이터 시드 데이터 사전 생성 → 0~25초 녹화 → 25~55초 슬라이드 합성 → 55~60초 클로징 → YouTube Unlisted 업로드 → 30·60초 self-check

### Phase 2 추가: 신청서·영상·앱 3자 일관성 self-audit (5/13 v3 전)

표 4행 (GPS / AI 캡션 / 사고 신고 / ActivityFeed) — 앱·신청서·영상 일치 검증.

---

## 13. Rollback Strategy

| 산출물 | 롤백 방식 |
|---|---|
| 1 (STATE) | `git diff STATE.md` 확인 → `git checkout HEAD STATE.md` 또는 `git revert` (백업 commit 5/3 시작 시 강제) |
| 2 (ActivityFeedScreen) | 단일 파일 변경 → `git checkout HEAD apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` (회귀 시) |
| 3 (inject 가이드) | 신규 파일, 롤백 = 파일 삭제. v1 신청서 본문은 무영향 |
| 4 (영상 시나리오) | 신규 파일, 롤백 = 파일 삭제 |

5/3 작업 시작 시 `git commit -am "checkpoint before modoo deadline package"` 강제.

---

## 14. Acceptance Criteria

### 산출물 1 (STATE)

- AC-1.1: D-1=A · D-2=A · D-3=마포·용산 · D-4=C · F-1=A · F-2=C 6 결정 명시 레이블 기재
- AC-1.2: Next gate 시퀀스 (5/3→5/7→5/8→5/9→5/10→5/11→5/12→5/13→5/14→5/15→5/16) 포함
- AC-1.3: CLAUDE.md "Active Work (Live)" 4 필드 (active workstream / current phase / next gate / blockers) STATE 일치
- AC-1.4: "5/15 신청 > PT 출시 > SafeWay 샌드박스" 3레벨 우선순위 1줄 명시
- AC-1.5: 5/8 게이트 FAIL fallback 1줄 명시
- AC-1.6: STATE.md `wc -l` ≤ 80
- AC-1.7: SafeWay 5/7·5/14 일정 Critical Path 병기

### 산출물 2 (ActivityFeedScreen)

- AC-2.1: `grep "MOCK_FEED"` → 0건
- AC-2.2: 가짜 피드 5건 미렌더링 (FlatList 또는 ActivityItem 인터페이스 제거)
- AC-2.3: 본문 텍스트 "실시간 산책 업데이트 기능이 곧 출시됩니다" 또는 6월 phasing 포함
- AC-2.4: CTA Pressable + `navigation?.navigate?.('Bookings')` + `accessibilityRole="button"`
- AC-2.5: `tsc --noEmit` 0 errors
- AC-2.6: `npm test` 20 passed (회귀 0)
- AC-2.7: `testID="activity-feed-placeholder"`
- AC-2.8: WCAG AA 명암비 (textSecondary 사용, primaryDark 또는 textPrimary CTA)
- AC-2.9: 코드 주석 "navigator 미등록 → V1.1 등록 예정"

### 산출물 3 (inject 가이드)

- AC-3.1: 6 섹션 (§1·§3·§4·§5·§6·§7) 독립 항목
- AC-3.2: 위치 + 내용 + before/after 3열 구조
- AC-3.3: 5/8 전 vs 후 inject 명확 구분
- AC-3.4: §1 시제 정합 inject 명시
- AC-3.5: §4 Track 2 phasing 문장 + 1라운드 정합 한 줄 inject
- AC-3.6: D-1=A 톤 절충 표현 (영상 자막 + §4 phasing)
- AC-3.7: §4·§5 Beachhead 마포·용산 inject
- AC-3.8: §4 60일 가설 검증 + §3 교차 참조
- AC-3.9: §6 영상 계획 (F-2=C Hybrid)
- AC-3.10: 5축 점수 영향 추정표 포함
- AC-3.11: 루넨랩스 사업자등록 점검 항목
- AC-3.12: LOI 마포·용산 2명+ 지역 기준

### 산출물 4 (영상 시나리오)

- AC-4.1: 60초 5+ 씬 / 4열 (시간/화면/음성/자막)
- AC-4.2: Hybrid 구조 (0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징)
- AC-4.3: 30초 시점 "AI" 자막 또는 음성 등장
- AC-4.4: 음성 = 본인 녹음 (iOS Voice Memo + CapCut)
- AC-4.5: 60초 종료 자막 (UD-2 결정 — 기본값 "2026.06.09 출시 예정")
- AC-4.6: Activity 탭 진입 금지 주의 1줄
- AC-4.7: 시드 데이터 요구사항 (워커 5 + 예약 2 + 산책 1 + 평점 3)
- AC-4.8: 영상 미제출 fallback (이미지 5장)
- AC-4.9: 업로드 = YouTube Unlisted
- AC-4.10: 5/12 마감 체크리스트

---

## 15. Out of Scope

- Track 2 AI 5축 구현 (T2.0~T2.6, 5/16 별도 사이클)
- V1.1 UI 본격 리디자인 (워커 프로필 사진·Skeleton·Animated)
- EXT-9~12 외부 계정 발급 (Track 2 의존)
- 5축 자가 채점 (5/10 작업, 별도)
- 이미지 5장 제작 (사용자 직접)
- 운영기관 최종 선택 (5/14)
- SafeWay 샌드박스 v2.1 본 작업
- HomeScreen·SearchScreen MOCK 데이터 audit (V1.0 출시 전 별도)
- CareConnect·SDET Code·루넨랩스 작업
- ActivityFeedScreen jest 테스트 신규 작성 (V1.1 21번째 테스트로 이연)
- 사고 신고 버튼 실 구현 (Track 2 T2.2)

---

## 16. Code Impact Map

| 변경 파일 | 변경 내용 | 행수 변화 |
|---|---|---|
| `STATE.md` | M0~M9 마일스톤 이력 삭제 + D-1~F-2 + 우선순위 + fallback inject + SafeWay 5/7·5/14 병기 | 185 → ~70~80 |
| `CLAUDE.md` Active Work | 4 필드 STATE mirror 갱신 | 부분 수정 |
| `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` | Option B (화면 전체 교체) | 97 → ~70 |

| 신규 파일 | 용도 |
|---|---|
| `artifacts/business/fundraising/2026-05-03-modoo-startup-pt-application-v2-inject-guide.md` | 산출물 3 inject 가이드 |
| `artifacts/business/fundraising/2026-05-03-modoo-startup-pt-video-scenario-v2.md` | 산출물 4 영상 시나리오 |

| 변경 안 되는 파일 |
|---|
| `apps/pettracker/mobile/src/navigation/OwnerStackNavigator.tsx` |
| `apps/pettracker/mobile/src/navigation/OwnerTabNavigator.tsx` |
| `apps/pettracker/mobile/src/constants/theme.ts` |
| 모든 jest 테스트 파일 |
| `backend/` 전체 |
| `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` (참조 only) |

---

## 17. User Decision Gates (UD-1~UD-4)

| ID | 결정 사항 | 기한 | 기본값 | 영향 |
|---|---|---|---|---|
| **UD-1** | D-1=A 톤 — "강한 약속" 유지 vs §4 phasing·영상 자막에 "조건부 약속" 부분 절충 | 산출물 3 작성 전 | **부분 절충** (§1 강한 유지, §4·영상 자막 "조건부") | inject 가이드 FR-3.6 |
| **UD-2** | 영상 60초 종료 자막 — "2026.06.09 출시 예정" vs "2026 상반기 출시 예정" | 산출물 4 작성 전 | **"2026.06.09 출시 예정"** (구체적) | 영상 시나리오 FR-4.5 |
| **UD-3** | SafeWay v2.2 일정 — 5/13 vs 5/14 연기 | 5/7 이전 | **5/14 연기** (Phase 2 합의) | Critical Path |
| **UD-4** | 루넨랩스 사업자등록 완료 5/15 전 가능 여부 | 5/8 게이트 시 | **확인 후 결정** | 신청서 §1·§7 자격란 |

UD-1·UD-2 = 자동 진행 시 기본값 적용, 사용자 변경 가능. UD-3 = 5/7 이전 사용자 응답 필요. UD-4 = 5/8 게이트 시 확인.

---

## 18. Dependencies

- 내부: Brief (Phase 0) ✅ / 4 reviews (Phase 1) ✅ / Consensus (Phase 2) ✅ / 신청서 v1 (확인 완료) / theme.ts (확인 완료) / OwnerTabNavigator (확인 완료) / package.json Lottie 미설치 (확인 완료) / `MOCK_FEED` 0건 grep (확인 완료)
- 외부: 0건 (EXT-9~12는 Track 2 의존, 본 패키지 외)
- 사용자: UD-1·UD-2 기본값으로 즉시 진행 가능, UD-3 5/7, UD-4 5/8

---

**Phase 3 종료. Phase 4 (Todo Plan) 진입 가능.**

**서명**: Claude Code (Final Tech Spec) | 2026-05-03
