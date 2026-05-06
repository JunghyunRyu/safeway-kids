# Requirement Brief — 모두의 창업 5/15 마감 실행 패키지

**Date**: 2026-05-03
**Phase**: 0 (Intake)
**Workstream**: 모두의 창업 2026 신청 (Track 1) + PT 평가위원 위험 차단
**Author**: requirement-analyst (Phase 0)
**Decision precedence**: 사용자 명시 결정 (D-1~D-4 + F-1·F-2 + 우선순위 원칙) > 본 Brief

---

## 1. Objective

5/15 16:00 모두의 창업 2026 K-Startup 포털 제출 마감을 위해, 오늘(5/3)부터 5/15까지 수행해야 하는 4가지 실행 산출물을 통합 패키지로 정의한다. 4가지는 STATE.md 상태 갱신, ActivityFeedScreen MOCK_FEED 제거(placeholder 전환), 신청서 v2 inject 가이드, 데모 영상 v2 씬 시나리오다. 이 패키지는 코드 품질 리스크(평가위원이 앱을 직접 다운로드할 경우 MOCK 데이터 노출), 신청서 내용 구식화, 영상 씬과 F-2=C 결정(슬라이드+음성) 간 불일치, STATE.md와 사용자 결정 사항 간 비동기화 등 4개의 구체적 위험을 동시에 차단한다.

---

## 2. In scope

- **산출물 1**: `STATE.md` (repo root) 갱신 — D-1~D-4, F-1·F-2, 우선순위 원칙(5/15 신청 > PT 출시), next gate, blockers 반영. CLAUDE.md "Active Work (Live)" 섹션 동기화.
- **산출물 2**: `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` — MOCK_FEED 상수 및 FlatList data 제거, "준비 중" placeholder 화면 교체, 다른 화면으로 가는 CTA 1개 추가, TypeScript 0 errors 유지, jest 회귀 0 확인.
- **산출물 3**: 신청서 v2 inject 가이드 문서 — §1·§3·§4·§5·§7 섹션별 변경 위치 + inject 내용 + before/after 예시. D-1=A 톤·Beachhead 마포·용산·60일 가설 검증·Track 2 phasing 한 문장 반영.
- **산출물 4**: 데모 영상 v2 씬 시나리오 문서 — F-2=C 결정(25~55초 AI 씬 = 슬라이드+음성) 기반 분 단위 씬-by-씬, 음성 스크립트, 자막 텍스트, 시드 데이터 요구사항 명시.
- Phase 0 Requirement Brief (본 문서).

---

## 3. Out of scope

- Track 2 AI 5축 구현 (T2.0~T2.6, 5/16 이후 시작)
- V1.1 UI 리디자인, 새 화면 신규 설계
- EXT-9~EXT-12 외부 계정 발급 (AWS, Firebase, Anthropic API key, PortOne)
- 신청서 v2 본문 직접 작성 (inject 가이드 산출 후 5/9 별도 작업)
- 5축 자가 채점 재실행 (5/10 작업)
- 이미지 5장 제작 (5/9~5/12 사용자 직접 제작)
- 운영기관 최종 선택 (5/14 결정)
- SafeWay Kids 샌드박스 v2.1 후속 작업 (병렬 워크스트림, 별도)
- CareConnect, SDET Code 관련 작업

---

## 4. Functional Requirements

1. **FR-1 STATE.md 갱신**: D-1·D-2·D-3·D-4·F-1·F-2 + 우선순위 원칙 명시
2. **FR-2 CLAUDE.md mirror**: Active Work (Live) 4 필드 (active workstream, current phase, next gate, blockers) STATE와 일치
3. **FR-3 MOCK_FEED 제거**: `MOCK_FEED` 식별자 0회 등장
4. **FR-4 placeholder 화면**: 시각 요소 + 설명 텍스트 + CTA 1개
5. **FR-5 TS·jest 무회귀**: tsc 0 errors + jest 20 pass 유지
6. **FR-6 inject 가이드 섹션 커버리지**: §1·§3·§4·§5·§7 5섹션 3열 구조 (위치/내용/before-after)
7. **FR-7 데이터 의존 분리**: 5/8 게이트 전 inject 가능 vs 5/8 후 inject 명확 구분
8. **FR-8 영상 F-2=C 반영**: 25~55초 슬라이드+음성 명시
9. **FR-9 시드 데이터 요구사항**: 0~25초 실제 녹화 구간에 필요한 mock 데이터 건수·생성법 명시

---

## 5. Non-functional Requirements

- **NFR-1** 코드 최소 변경 (ActivityFeedScreen.tsx 외 파일 변경 없음)
- **NFR-2** 디자인 일관성 (기존 theme.ts 토큰 재사용)
- **NFR-3** Lottie 미사용 원칙 (현재 의존성에 없으면 Ionicons + View)
- **NFR-4** 영상 단독 제작 가능 난이도 (사용자 + iOS 시뮬레이터 + CapCut)
- **NFR-5** inject 가이드 분량 제약 (5/9 한 세션 ~2시간 내 v2 본문 완성 가능)
- **NFR-6** STATE.md 80줄 rule 처리 (현재 185행 — 갱신 시 archive 정리 또는 예외 명시)

---

## 6. Codebase touchpoints

| 파일 | 이유 |
|---|---|
| `STATE.md` | 산출물 1 갱신 대상 |
| `CLAUDE.md` Active Work | 산출물 1 mirror |
| `apps/pettracker/mobile/src/screens/owner/ActivityFeedScreen.tsx` | 산출물 2 변경 (97행, MOCK_FEED 15~21행) |
| `apps/pettracker/mobile/src/navigation/OwnerStackNavigator.tsx` | 산출물 2 (읽기 전용) — ActivityFeedScreen 미등록 확인 |
| `apps/pettracker/mobile/src/navigation/OwnerTabNavigator.tsx` | 산출물 2 (읽기 전용) — Home/Search/Bookings/Profile 4 탭 확인 |
| `apps/pettracker/mobile/src/constants/theme.ts` | 산출물 2 (읽기 전용) — Colors·Typography·Spacing |
| `artifacts/business/fundraising/2026-04-30-modoo-startup-pt-application-v1.md` | 산출물 3 입력 (362행, 26KB) |
| `artifacts/business/fundraising/2026-04-30-modoo-eval-guide-crosscheck.md` | 산출물 3 평가 5축 anchor |

**변경 안 되는 파일**: navigation 파일·테스트·backend·기타 모바일 화면

---

## 7. Assumption Register

| ID | 가정 | 분류 | 검증 |
|---|---|---|---|
| AR-P1 | ActivityFeedScreen 전용 jest 테스트 없음 | 사실 (확인 완료) | 즉시 |
| AR-P2 | navigation.navigate('Search'/'Bookings') 사용 가능 | 사실 (TabNav 확인) | 즉시 |
| AR-P3 | Lottie 미설치 → Ionicons + View | 가정 | 구현 전 package.json 확인 |
| AR-P4 | 사용자 5/12 단독 영상 제작 가능 | 가정 | 사용자 확인 |
| AR-P5 | Track 2 phasing 문장 + Beachhead 표기는 5/8 게이트 데이터 무관하게 inject 가능 | 가정 | 권장 사용자 확인 |
| AR-P6 | 영상 시드 데이터는 web 대시보드 시드 기능으로 확보 가능 | 가정 | 영상 제작 전 확인 |
| AR-P7 | 영상 내레이션 = 본인 녹음 OR TTS 양자 택일 | 열린 가정 | OQ-2 |
| AR-P8 | 신청서 §4 표 구조 변경 없이 phasing 문장 inject 가능 | 사실 | 즉시 |

---

## 8. Open Questions

1. **OQ-1** Lottie 설치 여부 — 산출물 2 구현 방식 결정
2. **OQ-2** 영상 내레이션 — 본인 녹음 vs TTS (예: CLOVA Voice)
3. **OQ-3** "60일 가설 검증" 표현 추가 여부 — 현재 v1 = "2026.10 실측" / 60일 = 2026-08-09
4. **OQ-4** ActivityFeedScreen CTA 이동 대상 — Search vs Bookings (기본값 Bookings 권장)
5. **OQ-5** 영상 업로드 플랫폼 — YouTube Unlisted vs Vimeo
6. **OQ-6** STATE.md 80줄 rule (현재 185행) — 압축 vs 예외

---

## 9. Acceptance Criteria (draft)

**AC-1 STATE/CLAUDE 갱신**
- AC-1.1: D-1·D-2·D-3·D-4·F-1·F-2 6 결정 명시 레이블 기재
- AC-1.2: Next gate에 5/8→5/9→5/10→5/13→5/15→5/16 순서 포함
- AC-1.3: CLAUDE.md Active Work 4 필드 STATE 일치
- AC-1.4: 5/15 우선 원칙 1줄 명시

**AC-2 ActivityFeedScreen**
- AC-2.1: MOCK_FEED 식별자 0회 (grep 검증)
- AC-2.2: 가짜 피드 5건 미렌더링
- AC-2.3: "준비 중" 텍스트 렌더링
- AC-2.4: CTA Pressable + navigation.navigate 1개 이상
- AC-2.5: tsc --noEmit 0 errors
- AC-2.6: jest 20 pass, 회귀 0

**AC-3 inject 가이드**
- AC-3.1: §1·§3·§4·§5·§7 5섹션 독립 항목
- AC-3.2: 변경 위치 + 내용 + before/after 3열 구조
- AC-3.3: 5/8 전 vs 후 inject 구분
- AC-3.4: §4에 Track 2 phasing 문장 ("5/16~6/9 AI 5축 구현") inject
- AC-3.5: Beachhead "마포구·용산구" inject 1개 이상

**AC-4 영상 시나리오**
- AC-4.1: 00~60초 5+ 씬, 시간/화면/음성/자막 4열
- AC-4.2: 25~55초 슬라이드+음성 명시
- AC-4.3: 시드 데이터 요구 항목 별도
- AC-4.4: 도구·플랫폼·5/12 마감 체크리스트

---

## 10. Risk Register

| ID | 위험 | 확률 | 영향 | 완화 |
|---|---|---|---|---|
| R-1 | ActivityFeedScreen import 다른 파일 회귀 | 낮음 | 중 | grep 전수 확인 |
| R-2 | navigation 등록 없음 | 해당 없음 | — | OwnerStackNav 확인 완료 |
| R-3 | Lottie 빌드 오류 | 중 | 고 | NFR-3 준수 (Ionicons) |
| R-4 | 5/8 게이트 데이터 변동 | 매우 낮음 | 중 | 데이터/서술 분리 inject |
| R-5 | 5/12 영상 미완성 | 중 | 중 | F-2=C 난이도 최소화 + 이미지 5장 대체 가능성 명시 |
| R-6 | STATE 정리 중 중요 path 삭제 | 낮음 | 중 | git commit 백업 후 archive |
| R-7 | 5/8 게이트 미달 → K-Startup 7월 전환 | 중 | 낮음 | inject 가이드 60~70% 재사용 가능 구조 |

---

## 11. Critical Path

| 날짜 | 작업 | 담당 |
|---|---|---|
| **5/3** | 산출물 1·2·3·4 작성 | Claude Code |
| 5/3~5/7 | 가입자·LOI·SNS·변호사 | 사용자 |
| 5/8 | D-7 게이트 | 사용자 |
| 5/9 | 신청서 v2 본문 (inject 기반) | Claude Code |
| 5/10 | 1차 채점 (5 페르소나) | Claude Code |
| 5/12 | 영상 제작·업로드 | 사용자 |
| 5/13 | v3 (목표 80+) | Claude Code |
| 5/14 | 운영기관 선택 | 사용자 |
| **5/15 16:00** | K-Startup 제출 | 사용자 |

---

## 12. Dependencies

- **내부**: 산출물 3 ← 신청서 v1 (확인 완료) / 산출물 4 ← 신청서 §6 (확인 완료) / 산출물 2 ← navigation 스크린명 (확인 완료)
- **외부**: 0건 (EXT-9~12는 Track 2 의존, 본 패키지 외)
- **사용자 결정**: OQ-2·OQ-4 (기본값으로 진행 가능)

---

## 13. Readiness Verdict

**READY FOR INDEPENDENT REVIEW**.

산출물 1·3·4는 추가 정보 없이 즉시 작성 가능. 산출물 2는 OQ-1·OQ-4에 기본값(Lottie 미사용 + Bookings 탭 CTA) 적용 시 블로커 없음. OQ-2는 산출물 4 내 양자 선택지 구조로 처리.
