# Phase 4 Todo Plan — 모두의 창업 5/15 마감 실행 패키지

**Date**: 2026-05-03
**Phase**: 4 (Todo Plan)
**Source**: `artifacts/specs/2026-05-03-modoo-deadline-execution-final-tech-spec.md`
**Status**: APPROVED for Phase 5 Implementation

---

## Milestone M1 — 산출물 1: STATE.md + CLAUDE.md mirror (2026-05-05) ✅

| ID | Task | 담당 | 검증 | 상태 |
|---|---|---|---|---|
| M1.1 | STATE.md 압축 (185 → 80줄), M0~M9 마일스톤 이력 삭제 | Claude | `wc -l ≤ 80` | ✅ 80행 |
| M1.2 | D-1·D-2·D-3·D-4·F-1·F-2 명시 레이블 기재 | Claude | grep 6 결정 | ✅ |
| M1.3 | 우선순위 원칙 1줄 ("5/15 신청 > PT > SafeWay") | Claude | grep | ✅ |
| M1.4 | 5/8 게이트 fallback path 1줄 | Claude | grep | ✅ |
| M1.5 | Critical Path 5/3~5/16 표 갱신 (5/14 SafeWay 연기 반영) | Claude | 표 12행 | ✅ |
| M1.6 | CLAUDE.md "Active Work (Live)" 4 필드 (workstream / phase / next gate / blockers) STATE mirror | Claude | 수동 비교 | ✅ |

---

## Milestone M2 — 산출물 2: ActivityFeedScreen placeholder (2026-05-05) ✅

| ID | Task | 담당 | 검증 | 상태 |
|---|---|---|---|---|
| M2.1 | MOCK_FEED 상수·FlatList·renderItem·ActivityItem 인터페이스 제거 | Claude | `grep MOCK_FEED` 0건 | ✅ |
| M2.2 | View + Ionicons paw 64 + 제목 + 본문 + 부텍스트 + CTA Pressable 구조 | Claude | 코드 리뷰 | ✅ |
| M2.3 | 본문 = "실시간 산책 업데이트 기능이\n6월 정식 출시 예정입니다." (Consensus B-1) | Claude | grep | ✅ |
| M2.4 | CTA = `navigation?.navigate?.('Bookings')` optional chaining + Pressable | Claude | tsc | ✅ |
| M2.5 | accessibilityRole / accessibilityLabel / hitSlop 추가 | Claude | 코드 리뷰 | ✅ |
| M2.6 | testID="activity-feed-placeholder" | Claude | grep | ✅ |
| M2.7 | WCAG AA 명암비: 본문 textSecondary, CTA 텍스트 textPrimary on primary | Claude | 명암비 7.5:1 | ✅ |
| M2.8 | 코드 주석 "navigator 미등록 → V1.1 등록 예정" | Claude | grep | ✅ |
| M2.9 | tsc --noEmit 0 errors | Claude | exit 0 | ✅ |
| M2.10 | jest 20 passed (회귀 0) | Claude | 9 suites · 20 tests | ✅ |

---

## Milestone M3 — 산출물 3: 신청서 v2 inject 가이드 (2026-05-05)

| ID | Task | 담당 | AC | 일정 |
|---|---|---|---|---|
| M3.1 | 6 섹션 (§1·§3·§4·§5·§6·§7) 독립 항목 구조 | Claude | AC-3.1 | 5/5 |
| M3.2 | 각 항목 = 위치 + inject 내용 + before/after 3열 | Claude | AC-3.2 | 5/5 |
| M3.3 | 5/8 게이트 전 vs 후 inject 분리 (8 항목 vs 7 항목) | Claude | AC-3.3 | 5/5 |
| M3.4 | §1 시제 정합 inject ("AI가 사고를 자동 처리**하도록 설계된**") + 5/8 전 가능 명시 | Claude | AC-3.4 + Tech Spec Reviewer 이슈 1 | 5/5 |
| M3.5 | §4 Track 2 phasing 문장 + 1라운드(7월) 정합 한 줄 | Claude | AC-3.5 | 5/5 |
| M3.6 | D-1=A 톤 절충 (§4·영상 자막 "조건부 약속") | Claude | AC-3.6 | 5/5 |
| M3.7 | §4·§5 Beachhead 마포·용산 inject | Claude | AC-3.7 | 5/5 |
| M3.8 | §4 60일 가설 검증 ("2026-08-09") + §3 교차 참조 (§3 본문 그대로) | Claude | AC-3.8 | 5/5 |
| M3.9 | §6 영상 계획 inject (F-2=C Hybrid 반영) | Claude | AC-3.9 | 5/5 |
| M3.10 | 5축 점수 영향 추정표 포함 (가능성 +0.5~1 / 구체성 +1~1.5 / 효과성 +1.5~2 게이트 통과 시) | Claude | AC-3.10 | 5/5 |
| M3.11 | 루넨랩스 사업자등록 점검 항목 ("예비창업자" → "창업 3년 이내" 조건부) | Claude | AC-3.11 | 5/5 |
| M3.12 | LOI 5명 지역 기준 inject (마포·용산 거주자 2명 우선) | Claude | AC-3.12 | 5/5 |

---

## Milestone M4 — 산출물 4: 영상 시나리오 v2 (2026-05-05)

| ID | Task | 담당 | AC | 일정 |
|---|---|---|---|---|
| M4.1 | 60초 5+ 씬 분할 / 시간·화면·음성·자막 4열 | Claude | AC-4.1 | 5/5 |
| M4.2 | Hybrid 구조 (0~25 실녹화 / 25~55 슬라이드 / 55~60 클로징) | Claude | AC-4.2 | 5/5 |
| M4.3 | 30초 시점 "AI" 자막 또는 음성 등장 | Claude | AC-4.3 | 5/5 |
| M4.4 | 음성 = 본인 녹음 (iOS Voice Memo + CapCut) | Claude | AC-4.4 | 5/5 |
| M4.5 | 60초 종료 자막 = "2026.06.09 출시 예정" (UD-2 default) | Claude | AC-4.5 | 5/5 |
| M4.6 | Activity 탭 진입 금지 주의 1줄 | Claude | AC-4.6 | 5/5 |
| M4.7 | 시드 데이터 요구사항 (워커 5 + 예약 2 + 산책 1 + 평점 3, web 대시보드 시드) | Claude | AC-4.7 | 5/5 |
| M4.8 | 영상 미제출 fallback (이미지 5장 대체) | Claude | AC-4.8 | 5/5 |
| M4.9 | YouTube Unlisted 업로드 명시 | Claude | AC-4.9 | 5/5 |
| M4.10 | 5/12 마감 체크리스트 (도구·플랫폼·녹화 흐름) | Claude | AC-4.10 | 5/5 |

---

## Milestone M5 — 사용자 외부 작업 (5/5~5/7)

| ID | Task | 담당 | 게이트 |
|---|---|---|---|
| M5.1 | 가입자 모집 30+ (랜딩+카톡 50명+SNS 활성화, 인스타 outbound) | 사용자 | 5/8 게이트 |
| M5.2 | LOI 회수 3+ (5명 중 마포·용산 거주자 2명 우선) | 사용자 | 5/8 게이트 |
| M5.3 | 5/7 변호사 미팅 (대한상공회의소 이의림, EXT-6 보험사 가맹 가능성) | 사용자 | 5/8 |
| M5.4 | UD-3 결정 (SafeWay v2.2 5/14 연기 — 기본값 자동 적용 가능) | 사용자 | 5/7 |
| M5.5 | 루넨랩스 사업자등록 진행 상황 확인 (UD-4 5/15 전 완료 가능 여부) | 사용자 | 5/8 |

---

## Milestone M6 — 5/8 D-7 strong-go 게이트

| ID | Task | 담당 | 결과 |
|---|---|---|---|
| M6.1 | 가입자 30+ AND LOI 3+ 검증 | 사용자 | PASS / FAIL |
| M6.2 | (PASS 시) M7 진입 | Claude | 5/9 v2 작성 |
| M6.3 | (FAIL 시) Fallback path 발동 — K-Startup 7월 전환, 산출물 3·4 작업 중단, 6월 신청서 재작성 | 사용자 + Claude | EC-1 |
| M6.4 | UD-4 (루넨랩스 사업자등록 5/15 전 가능) 확인 | 사용자 | 자격란 inject 결정 |

---

## Milestone M7 — 신청서 v2 본문 작성 (5/9)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M7.1 | inject 가이드 §1·§3·§4·§5·§6·§7 6 섹션 v1 본문에 inject 적용 | Claude | 2h |
| M7.2 | placeholder 6건 (가입자 1 + LOI 5명) 실수치 inject (게이트 통과 시) | Claude | 0.5h |
| M7.3 | 약점 Top 3 보강 (§3 사고 처리 -80% 근거 1문장 + §5 LTV/CAC 가정 + §7 팀역량) | Claude | 1h |
| M7.4 | 신청서 v2 self-review (시제 정합, Beachhead 정합, phasing 정합) | Claude | 0.5h |
| M7.5 | v2 분량 검증 (~3,000자 본문) | Claude | grep |

---

## Milestone M8 — 1차 채점 (5/10)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M8.1 | evaluator-rubric-reviewer 5 페르소나 dispatch (운영기관 책임멘토 5 AC: 더벤처스/더인벤션랩/스파크랩/퓨처플레이/프라이머) | Claude | 1h |
| M8.2 | 5축 (가능성·구체성·기대효과·차별성·효과성) 항목별 순차 채점 | Claude | 1h |
| M8.3 | 핀포인트 약점 식별 (어느 항목이 점수 깎는지) | Claude | 0.5h |
| M8.4 | 5/13 v3 보강 방향 결정 | Claude | 0.5h |

**목표**: 70+/50 (5/13 v3에서 80+ 도달 baseline)

---

## Milestone M9 — Freezing Deadline (5/11)

| ID | Task | 담당 |
|---|---|---|
| M9.1 | 신규 작업 추가 금지 — 5/12~5/15 critical path 전용 | 모두 |
| M9.2 | M5·M7·M8 완성 검증 | Claude |
| M9.3 | 5/12 영상 제작 사전 준비 (시드 데이터·CapCut·iOS Voice Memo 환경) | 사용자 |

---

## Milestone M10 — 영상 제작 (5/12)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M10.1 | 시드 데이터 생성 (web 대시보드 또는 backend seed.py) — 워커 5·예약 2·산책 1·평점 3 | 사용자 + Claude | 1h |
| M10.2 | 0~25초 실녹화 (iOS 시뮬레이터 — Home·Search·BookingDetail·LiveTrack) | 사용자 | 1h |
| M10.3 | 25~55초 슬라이드 제작 (CapCut, AI 캡션·사고 자동화 UI 목업 + 본인 음성) | 사용자 | 2h |
| M10.4 | 55~60초 클로징 슬라이드 ("2026.06.09 출시 예정") | 사용자 | 0.5h |
| M10.5 | 60초 합성 + 30초 체크포인트 "AI" 등장 self-check | 사용자 | 0.5h |
| M10.6 | YouTube Unlisted 업로드 + URL 확보 | 사용자 | 0.5h |
| M10.7 | 영상 미제출 시 fallback 발동 (이미지 5장으로 슬롯 2·5 강화) | 사용자 | (조건부) |

**총**: 5.5h ±1h

---

## Milestone M11 — v3 신청서 + self-audit (5/13)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M11.1 | M8 채점 핀포인트 약점 보강 (목표 80+ 도달) | Claude | 2h |
| M11.2 | 신청서·영상·앱 3자 일관성 self-audit 표 작성 (4행: GPS / AI 캡션 / 사고 신고 / ActivityFeed) | Claude | 0.5h |
| M11.3 | 3자 불일치 발견 시 v3 본문 또는 영상 자막 정정 | Claude + 사용자 | 1h |
| M11.4 | 영상 URL inject + 이미지 5장 첨부 슬롯 확정 | Claude | 0.5h |

---

## Milestone M12 — 운영기관 선택 + SafeWay v2.2 (5/14)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M12.1 | 운영기관 최종 선택 (서울 AC 5개 후보) — M8 채점 결과 + 멘토 매칭 | 사용자 | 1h |
| M12.2 | SafeWay v2.2 확정 + 운영기관 사전 전달 (UD-3 5/14 연기) | 사용자 | 1h |
| M12.3 | 신청서 v3 → v3.1 (운영기관 선택 반영) | Claude | 0.5h |

---

## Milestone M13 — K-Startup 제출 (5/15 16:00)

| ID | Task | 담당 | 게이트 |
|---|---|---|---|
| M13.1 | 신청서 v3.1 PDF 변환 + 영상 URL + 이미지 5장 + LOI 5건 첨부 | 사용자 | 14:00 |
| M13.2 | K-Startup 포털 로그인 + 신청 양식 입력 | 사용자 | 14:30~15:30 |
| M13.3 | 제출 완료 + 접수번호 확보 | 사용자 | **16:00 마감** |
| M13.4 | 제출 confirmation 핸드오프 작성 | Claude | 16:30 |

---

## Milestone M14 — Track 2 시작 (5/16)

| ID | Task | 담당 | 일정 |
|---|---|---|---|
| M14.0 | T2.0 `pip check` 의존성 호환 검증 (anthropic + openai + firebase-admin + aioboto3) — **첫 단계 의무** | Claude | 0.5d |
| M14.1 | T2.1 Milestone C 잔여 (C-13/14 ✅ 선행 완료) + AI 인프라 (LLM client + Redis cost counter + WalkPhoto migration) | Claude | 3~4d |
| M14.2 | T2.2 사고 신고 LLM (축 A) + 모더레이션 (축 D) — `PtIncident` 모델 + `/incidents/report` endpoint + LLM 분류 | Claude | 4~5d |
| M14.3 | T2.3 사진 캡션 + Empathic 리포트 + 컨디션 (축 B+F) — WalkPhoto 캡션 + 산책 종료 리포트 + ActivityFeed 실 API 연결 | Claude | 4~5d |
| M14.4 | T2.4 GPS 이상 탐지 (축 E) — Redis ZSET + 워커 자동 체크인 | Claude | 2~3d |
| M14.5 | T2.5 통합 테스트 (백엔드 165+ / PT jest 22+ / TS 0 errors) | Claude | 2~3d |
| M14.6 | T2.6 Pre-launch QA + EAS Build → **6/9 V1.0 출시** | Claude | 1~2d |

---

## 의존성 그래프

```
M1 ──┐                                           [완료]
M2 ──┤                                           [완료]
M3 ──┤
M4 ──┴── M5 ─── M6 (5/8 게이트)
                  ├── PASS ─── M7 ─── M8 ─── M9 ─── M10 ─── M11 ─── M12 ─── M13 ─── M14
                  └── FAIL ─── Fallback (K-Startup 7월 전환, 6월 재작성)
```

---

## 진행 상황 (Live)

| Milestone | 상태 | 완료일 |
|---|---|---|
| M1 STATE/CLAUDE | ✅ COMPLETE | 2026-05-05 |
| M2 ActivityFeedScreen | ✅ COMPLETE | 2026-05-05 |
| M3 inject 가이드 | 🟡 IN PROGRESS | 2026-05-05 |
| M4 영상 시나리오 | 🟡 PENDING | 2026-05-05 |
| M5 사용자 외부 | 🔴 PENDING | 2026-05-07 |
| M6 5/8 게이트 | 🔴 PENDING | 2026-05-08 |
| M7 v2 본문 | 🔴 PENDING | 2026-05-09 |
| M8 채점 | 🔴 PENDING | 2026-05-10 |
| M9 freezing | 🔴 PENDING | 2026-05-11 |
| M10 영상 | 🔴 PENDING | 2026-05-12 |
| M11 v3 + audit | 🔴 PENDING | 2026-05-13 |
| M12 운영기관 + SafeWay | 🔴 PENDING | 2026-05-14 |
| M13 제출 | 🔴 PENDING | 2026-05-15 |
| M14 Track 2 | 🔴 PENDING | 2026-05-16~6/9 |

---

**서명**: Claude Code (Phase 4 Todo Plan) | 2026-05-03 작성·2026-05-05 갱신
