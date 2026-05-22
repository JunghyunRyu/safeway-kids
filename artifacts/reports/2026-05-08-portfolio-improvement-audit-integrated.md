# Portfolio Improvement Audit — 통합 우선순위 매트릭스 + Top N Action Plan

**작성일**: 2026-05-08 (D-7)
**범위**: PetTracker (#1) + SafeWay Kids + CareConnect + SDET Code + 루넨랩스 portfolio 전체
**방법**: 페르소나 5명 + 도메인 에이전트 5명 = 6 병렬 read-only audit
**우선순위 원칙**: 5/15 신청 > 6/9 PT 출시 > SafeWay 샌드박스 > 장기 portfolio

---

## 0. Executive Summary (5줄)

1. 6명 병렬 audit으로 약점 **150건+** 식별. 중복 제거·통합 후 P1(5/15 critical)=**12건** / P2(6/9 출시 critical)=**18건** / P3(장기 portfolio)=**14건** / Fallback·자금 조달 next path=**6건**.
2. **5/15 강행 commit P1 12건 중 8건은 사용자 ownership** (자문진 LOI 발송·SDET Code 계약 anchor·PortOne 신청·운영기관 콜·ID cross-grep·페르소나 v3 inject 등). 5/8~5/13 사이 30분~수시간 단위 actionable.
3. **합격선 격차 -2.0 → -0.5~+1.0 가능 path 식별**: 페르소나 audit Top 5 inject(N-1~N-5) + 가입자/LOI 갱신 + 영상 = 평균 +1.5~2.5점 회복.
4. **6/9 PT 출시 critical 18건 중 4건은 Critical 등급**: KI-2 TOSS_WEBHOOK_SECRET / mobile tsc UNVERIFIED / AI 5축 코드 0% (24일 구현) / PortOne 가맹점 계약. 어느 1건이라도 slip하면 6/9 ±2d 출시 risk Critical로 상승.
5. **구조적 약점 4건은 6주 이상 시계**: 1인 팀 페널티·SafeWay 규제 불확실성·SDET Code runway 의존·CareConnect 규제 미검토. 5/15 신청에 직접 영향 없으나 IR Series A 시점 부메랑 가능.

---

## 1. 6명 Audit 결과 요약 (1행 1 agent)

| # | Agent | 식별 약점·항목 | Top 3 P1 |
|---|-------|---------------|----------|
| 1 | **evaluator-rubric-reviewer** (5 페르소나) | N-1~N-7 신규 7건 + R-1~R-3 regression 3건 + 함정 시나리오 3건 + v3 권고 7건 | N-1 Q1 "반려견→반려동물" / N-2 founder-market fit Q2 / N-5 자문 관계 현재형 |
| 2 | **business-operations-manager** | W-01~W-14 운영 14건 + F-01~F-04 fallback 4건 + cross-impact 5건 | W-04 SDET Code+자금 burn rate 시뮬 / W-09 7월 차회 일정 확인 / W-13 SDET Code 계약 anchor |
| 3 | **korea-fundraising-strategist** | F-1~F-6 path 6건 + P-1~P-4 prep 4건 + FB-1~FB-3 fallback 3건 + W-1~W-4 약점 4건 | P-1 사업자등록 timing / P-2 D+30~60 MAU 데이터 / P-4 TIPS RM 사전 |
| 4 | **traction-data-builder** | 5축 ~30 행 + 5/13 freezing 7건 + cross-portfolio 4건 + 신뢰도 5건 | 사전 가입자 5/8 카운트 / 자문 LOI 5명 발송 / "178 collected vs 187 passed" 표현 통일 |
| 5 | **security-expert** | C-01~C-12 컴플라이언스 12건 + PII 5건 + 앱스토어 4건 + SafeWay 정합 3건 | C-09 TOSS_WEBHOOK_SECRET / C-07 AES 키 패딩 / C-08 HMAC fallback |
| 6 | **qa-lead** | QG-1~QG-10 quality gate 10건 + AI 5축 5건 + D-7 체크 7건 + 모니터링 4건 | QG-4 mobile tsc / QG-5 AI 5축 mock 설계 / QG-7 외부 API mock |

---

## 2. P1 — 5/15 강행 commit Critical (12건, 5/8~5/14 timeline)

> 사용자 ownership 강조 (Claude는 신청서 paste-ready 작업 + sub-agent dispatch 가능, 외부 콜·계약·LOI 발송은 사용자 단독 행동 필요)

| ID | 영역 | 약점 | 권고 action | 누가 | 언제 (D-N) | 효과 추정 |
|----|------|------|------------|------|-----------|----------|
| **P1-A** | 신청서 narrative | N-5 자문 관계 현재형 강화 ("협약 시점 회수 예정"이 미래 시제 약속) | Q4 마지막 단락 "수의사·법무·UX·펫마케팅·스타트업 선배 5명과 2026-05 기준 자문 관계 진행 중이며, 협약 시점 정식 LOI 문서화 예정" 1줄 변경 (+10자) | Claude (v3 inject) | 5/13 freezing 전 | 가능성 +0.4, P1·P5 동시 |
| **P1-B** | 신청서 narrative | N-2 founder-market fit Q2 부재 (Q2 전체가 시장 통계로 시작, 본인 경험 0줄) | Q2 첫 단락 또는 마지막에 "출장 중 반려동물을 맡길 곳을 찾지 못한 직접 경험이 출발점이다"(~35자) 1줄 추가 (151자 여유 내) | Claude + 사용자 (사실 confirm) | 5/13 v3 freezing 전 | VC P2 +0.5 |
| **P1-C** | 신청서 narrative | N-4 Q4 인건비 D+3/D+6 timing 자금 집행 순서 불일치 ("협약 후 D+3" vs V1.0 6/9 출시 시점 충돌) | Q4 인건비 라인에 "(협약 기준)" 1단어 추가 (+5자) | Claude (v3 inject) | 5/13 freezing 전 | 구체성 +0.3, P4 혼란 차단 |
| **P1-D** | 신청서 사실 정합 | "178 collected" vs "187 passed / 194" 두 수치 혼재 — 평가위원 질의 시 숫자 불일치 risk | 신청서 표현을 "백엔드 테스트 178건 collected, 187 passed (96.4%), known fail 7건 = 기 식별 외부 이슈"로 단일화 | Claude (v3 inject) | 5/13 freezing 전 | 사실관계 risk 차단 |
| **P1-E** | 신청서 ID 정합 | "류재혁" 1건 잔존 (5/6 cross-grep audit 결과) — 5종 ID(대표자·회사·이메일·사업자번호·계좌) cross-grep 미완 | 메모리 `feedback_id_cross_grep_gate.md` 패턴대로 v2.2 + LOI templates 전 파일 cross-grep, 안 anchor "류정현/루넨랩스/jhryu115@gmail.com" 통일 | Claude (v3 freezing) | 5/13 freezing 직전 | -0~3점 risk 차단 |
| **P1-F** | 자문 LOI | 자문진 정식 LOI 0건 (파이프라인 5명 명단만 보유, 발송 미완) | `2026-04-29-modoo-startup-pt-loi-templates.md` 5명에게 이메일 발송 — 수의사·법무·UX·펫마케팅·스타트업 선배 | 사용자 (단독) | 5/9 발송 → 5/12 1건 회수 목표 | 가능성 +0.5~1.0 (P0-2 4/5 페르소나 공통 지적) |
| **P1-G** | 가입자 수치 | 사전 가입자 5건 (D-12), LOI 2~3건 — 5/8 18:00 anchor 카운트 누락 | jhryu115@gmail.com Gmail `subject:"🐾 [PT 사전가입]"` 카운트 → 5/13 v3 inject | 사용자 (5분) → Claude inject | 5/8 18:00 카운트 → 5/13 inject | 효과성 +0.3~0.5 |
| **P1-H** | SDET Code anchor | 월 수입·계약 만료일·신규 수주 파이프라인 어디에도 정량화 없음. 5/15까지 "신규 작업 중단"이 기존 계약 만료 시 portfolio 전체 runway 위협 | 비공개 Assumption Register에 SDET Code 계약 현황 정량화 (외부 제출 X) — 30분 단독 작업 | 사용자 (단독) | 5/8~5/9 | runway 가시성 확보 |
| **P1-I** | UD-4 회피 유지 | 5/8~5/14 사이 사업자등록 시 자격 박탈 #1 risk. 메모리 `business_registration.md` anchor "미등록 유지" 결정 유지 | (1) 본 기간 등록 절대 금지 (2) UD-4 콜센터 콜은 1R 통과 후로 이월 (사용자 "왜 콜?" challenge 반영) | 사용자 (수동) | 5/15 신청 완료까지 | 자격 박탈 risk 0% 유지 |
| **P1-J** | 보안 — TOSS_WEBHOOK | C-09/QG-1 TOSS_WEBHOOK_SECRET 미설정 — Toss webhook 3건 fail (Known Issue), 6/9 출시 전 critical | .env에 TOSS_WEBHOOK_SECRET 설정 + 서명 검증 코드 활성화 (코드는 작성됨, 비밀값만 누락) | Claude (Track 2 T2.1) | 5/16 Track 2 시작 직후 (P1 carry-over로 5/15 후 즉시) | webhook fail 3→0, KI-2 해소 |
| **P1-K** | 보안 — 키 강도 | C-07 AES 키 < 32바이트 시 `\0` 패딩 허용 (약한 키 위험) + C-08 HMAC fallback (hash_key 없으면 encryption key 재사용) | settings validator: `len(aes_encryption_key) >= 32` 강제 + production 환경에서 HASH_KEY 필수값 강제 (FastAPI startup 이벤트) | Claude (Track 2 T2.1) | 5/16 Track 2 시작 직후 | OWASP A02·A07 risk 0 |
| **P1-L** | OQ-9 잔여 | N-3 펫봄 미포함 검증 (산업 전문가가 펫봄 인지자일 경우 "5사 분석 부정확" 지적 가능) | OQ-9-A 펫봄 사전 검증 (15분 WebFetch) → *주0에 1줄 추가 또는 "5사 주요 서비스" → "국내 주요 펫시터 매칭 서비스"로 완화 | Claude (v3 freezing 전) | 5/9~5/10 | 차별성 risk 방어 +0.3 |

**P1 합계**: 사용자 ownership 6건(LOI·가입자 카운트·SDET·UD-4 회피 등), Claude ownership 6건(v3 inject·OQ-9·코드 보안). **P1 모두 처리 시 평균 +1.5~2.5점 → 33.3/50 → 34.8~35.8/50 (합격선 35 진입)**.

---

## 3. P2 — 6/9 PT 출시 Critical (18건, 5/16~6/9 timeline)

| ID | 영역 | 약점 | 권고 action | 누가 | 언제 | 공수 |
|----|------|------|------------|------|------|------|
| **P2-A** | mobile tsc | QG-4 typescript 모듈 lock mismatch — npm install 미완료, 신청서 "TS 0 errors" 표현 vs 실제 SKIP | `npm install --force` + `tsc --noEmit` PASS 확인. typescript ~5.9.2 + RN 0.81.5 호환성 | Claude (Track 2 T2.0) | 5/16 즉시 | 1h |
| **P2-B** | AI 5축 코드 0% | 24일 안에 축 A·B·D·E 4축 구현 — 외부 mock 설계 미완 | OpenAI/Anthropic API mock fixture (`respx`) + cost counter Redis 선행 (T2.1) + pytest mark.integration 분리 | Claude (T2.1~T2.5) | 5/16~6/7 | 8h 설계 + 40h 구현 |
| **P2-C** | 외부 계정 5종 | EXT-9~12 AWS·Firebase·Anthropic·OpenAI·PortOne 미확보, 5/16 Track 2 시작 의존 | T2.0 5/16 오전 5개 계정 순차 확인. PortOne·Firebase emulator + Anthropic·OpenAI sandbox key | 사용자 (개인 명의 우선) + Claude | 5/16 1일 | 2~4h |
| **P2-D** | PortOne 가맹점 | QG-1/W-11 코드 완료 vs 계약 미진행. 심사 7~14일 소요 → 6/9 출시 전 결제 미작동 risk | 5/16 즉시 PortOne 계약 신청 + 임시 대안: V1.0 초기 2주 계좌이체+수기 처리 검토 | 사용자 | 5/16 신청 → 6/3~6/9 승인 목표 | 30분 신청 |
| **P2-E** | formsubmit→Vercel 마이그 | W-03 PT 사전가입 폼 월 50건 상한, Track 2 태스크 목록(T2.0~T2.6)에 누락 | T2.0a "formsubmit.co → Vercel + Google Sheets 마이그" 추가. 5/16 T2.0 pip check와 동시 처리 | Claude + 사용자 | 5/16 T2.0 | 2h |
| **P2-F** | 보호자 300명 GTM | W-01 D+0~10 채널 (펫카페 게시·PR) 구체 실행 단위 미정 — 어느 펫카페 몇 곳·게시 포맷·담당자 컨택 0 | 마포·용산 내 펫카페 목록 수동 수집 (네이버지도, 30분) + 최소 10곳 컨택 리스트 + DM 템플릿 1종 | 사용자 | 5/16~5/20 | 30분 수집 + 2h 컨택 |
| **P2-G** | 펫시터 100명 GTM | W-02 구청 신고 펫시터 명부 비공개 + 리타겟팅 광고 소재 미준비 | 대안 채널 3개: 네이버 카페 "펫시터 모임" / 인스타 #펫시터 DM / 도그메이트(mogwai) 리뷰어 DM. 구청 직접 통화 1회 | 사용자 | 5/16~5/30 | 30분 콜 + 5h DM |
| **P2-H** | 동의 트리거 | C-05 ChildConsent 동의 철회 후 데이터 자동 삭제 트리거 UNVERIFIED | trigger 구현 확인 (DB 또는 backend job) + 미구현 시 추가 | Claude (Track 2 T2.5) | 5/30~6/2 | 4h |
| **P2-I** | CcChild PII 정합 | C-04 name/allergies/medical_notes/emergency_contact 컬럼 존재하나 @property 미적용, service.py 직접 호출 의존 | Student 패턴(@property) 통일 — 모델 레벨 자동 암호화 게이트 | Claude (Track 2 T2.1) | 5/16~5/20 | 4h |
| **P2-J** | iOS 권한 문자열 | C-10 Android ACCESS_BACKGROUND_LOCATION VERIFIED, iOS NSLocationAlwaysUsageDescription UNVERIFIED + Apple Privacy Manifest 의무 (2024+) | Info.plist 한국어 권한 설명 + PrivacyInfo.xcprivacy 작성 | Claude (Track 2 T2.6) | 6/2~6/5 | 2h |
| **P2-K** | 메시지 retention | C-06 통비법 6개월 auto-purge — FCM/메시지 retention 정책 UNVERIFIED | 메시지 테이블 created_at + 180일 TTL 삭제 스케줄러 구현 또는 확인 | Claude (Track 2) | 6/1~6/5 | 4h |
| **P2-L** | KI-3 health degraded | QG-2 health endpoint 판정 임계값 부정확 — 1 fail 잔존 | health check degraded 임계값 재검토; 외부 의존성(Redis/DB) 연결 상태 반영 | Claude (Track 2 T2.5) | 5/30~6/2 | 1h |
| **P2-M** | KI-4 WS teardown | QG-3 m4_websocket teardown race — 3 error, 인프라 잔존 | asyncio event loop teardown 순서 고정 (pytest-asyncio scope=session); flaky 5회 재현율 측정 | Claude (Track 2 T2.5) | 5/30~6/5 | 3h |
| **P2-N** | overbooking 방지 | W-07 펫시터 동시 다중 요청 시 overbooking 방지 로직 UNVERIFIED | T2.5에 동시 예약 케이스 추가 + 임시 펫시터별 일일 예약 hard cap | Claude (Track 2 T2.5) | 6/1~6/5 | 4h |
| **P2-O** | 이용약관·개인정보처리방침 | W-06 PT 전용 약관 lunenlabs.com/pet 부재 + 사고대응 SOP·법적 책임 주체 정의 미완 | site/src/pages/PetTerms.tsx 신설 + 1페이지 사고대응 SOP 문서화 | 사용자 (작성) + 법무 자문 confirm | 5/30~6/5 | 6h |
| **P2-P** | E2E 테스트 | QG-6 Maestro/Detox 미구성 — 권장만 되어 있고 실 스위트 0 | Maestro smoke 3 flow (가입→예약→완료) + EAS Build 후 시뮬레이터 1회 | Claude (T2.6) | 6/2~6/7 | 8h |
| **P2-Q** | EAS Build·Submit | QG-10 매니페스트 존재 vs 제출 미진행 | EAS Build iOS/Android preview → TestFlight 업로드 + 메타데이터(스크린샷·개인정보처리방침 URL) | Claude + 사용자 | 6/5~6/8 | 8h |
| **P2-R** | MAU 200 시나리오 분해 | W-05 60일 내 MAU 200 = 가입자 500명 = 일 8.3명 — D+0~10 PR + D+10~30 베타로 달성 가능성 UNVERIFIED | 시나리오 분해 + interim 지표 정의 (MAU 100·재이용률 35%·NPS 35+) | Claude + 사용자 | 6/9 출시 직후 | 1h |

---

## 4. P3 — 장기 portfolio (14건)

| ID | 영역 | 약점 | 권고 | 누가·언제 |
|----|------|------|------|-----------|
| **P3-A** | CareConnect 규제 미검토 | W-14 PT+30d 일정에 CareConnect 시작 — 아동복지법 §29·§30 + 위치정보 수집 법무 미검토 | 최소 체크리스트 1건 (아동복지법 + 위치정보 1차 검토) | korea-regulatory-counsel·6월 SafeWay 결과 후 |
| **P3-B** | 1인 팀 페널티 | W-2 팀 점수 방어선 약함 — 초기창업패키지·TIPS·시드 AC 모두 공동창업자 또는 강점 | 마케터·모바일 개발자 파트타임 온보딩 (자금 수령 후) + 자문진 정식 LOI 3건 이상 확보 | 사용자 7월 이후 |
| **P3-C** | TIPS RM 사전 관계 | P-4 RM 확보 2~4개월 — 모두의 창업 운영기관(더벤처스·퓨처플레이) 멘토 = TIPS RM 가능 | 1R 통보 즉시 운영기관 담당 멘토와 TIPS 경로 논의 | 사용자 8~9월 |
| **P3-D** | K-Startup 초기창업 2027 | F-2 사업화 자금 1억 path — 12월 말 draft 착수 필요 | v2.2 본문 60~70% 재사용 + AI 5축·SafeWay 멀티앱 narrative | Claude·사용자 11월~12월 |
| **P3-E** | 외주용역비 효율 | W-12 1인 외주 관리 시간 비용 — Track 2 24일 동안 외주 관리 병행 어려움 | 자금 수령 전 MVP 품질 출시. 외주 우선순위: QA 자동화 > 디자인 > 기타 | 사용자 7월 이후 |
| **P3-F** | 부하 테스트 | QG-8 GPS streaming N 동시 사용자 미테스트 | locust 20 concurrent + Redis flush latency | Claude·6/16~6/30 출시 후 |
| **P3-G** | 키 로테이션 절차 | C-03 Student/Wallet AES-GCM 적용 후 정기 키 로테이션 절차 미문서화 | 6개월 단위 키 로테이션 SOP 작성 | Claude·6월 후 |
| **P3-H** | SafeWay 코드 정합 | C-13~15 N:N 중개 구조·임시조치 의무·고영향 AI 미해당 코드 상태 UNVERIFIED | drivers/vehicles/messages 모델 + AI 추론 모듈 코드 직접 검토 | Claude·5/14 v2.2 전달 전 |
| **P3-I** | location_access audit | C-02 위치정보법 §24 6개월 위치 접근 audit log 미확인 | location_access_audit 테이블 grep 확인 + 미존재 시 구현 | Claude (Track 2 또는 후) |
| **P3-J** | GPS 180일 보존 | C-01 위치정보법 §16 GPS 좌표 auto-purge 정책 UNVERIFIED | 180일 초과 자동 삭제 스케줄러 존재 여부 확인 | Claude (Track 2) |
| **P3-K** | User PII 암호화 | PII 정합 5행 — User.phone, email AES-GCM 적용 여부 UNVERIFIED | users 테이블 검토 후 적용 결정 | Claude (Track 2 T2.5) |
| **P3-L** | WalkerWallet PII | PII 정합 5행 — bank_account @property 적용 UNVERIFIED | 코드 확인 후 적용 | Claude (Track 2 T2.5) |
| **P3-M** | Caregiver 자격 게이트 | C-11 approved_at 없이 caregiver 예약 수락 가능한지 API 게이트 미확인 | API 레벨 게이트 검증 + 미구현 시 추가 | Claude (CareConnect 사이클) |
| **P3-N** | 신뢰도 행 — SAM 추정 | 신뢰도 표 4행 — SAM 3,000~5,000억 자체 추정, 출처 보고서에 직접 표기 0 | "3개 출처 기반 자체 추정 (반려견 499만 × 위탁 의향 10% × 연간 산책비)"으로 추정 근거 1줄 명시 | Claude (v3 또는 v4) |

---

## 5. Fallback Path + 5/15 이후 자금 조달 next 6건

| ID | Path / Action | 시점 | 자금·효과 | 누가 |
|----|--------------|------|----------|------|
| **F-A** | 7월 차회 모집 일정 확인 (모두의 창업 하반기 공고) | 5/16 즉시 | 1억 fallback | 사용자 (1357+5 콜) |
| **F-B** | 모두의 창업 동일 공고 2회 신청 허용 여부 확인 | 5/16~5/20 | 7월 차회 가능성 결정 | 사용자 (콜) |
| **F-C** | K-Startup 초기창업 2027 사업계획서 (사업자등록 + 3년 이내) | 11월 draft | 1억 (자부담 30%) | Claude + 사용자 |
| **F-D** | TIPS R&D (AC RM 추천 필수) | 8~9월 RM 접촉 | 5억 (R&D 3 + AC 1억) | 사용자 (RM 관계) |
| **F-E** | 기보 창업기업 우대보증 (사업자등록 후 즉시) | 10~11월 | 5,000만~1억 (대출, 비희석) | 사용자 |
| **F-F** | 시드 AC (퓨처플레이·블루포인트) — D+30 traction 후 | 8~9월 | 1억~3억 (Equity 20~25%) | 사용자 |

---

## 6. Cross-Cutting Risks (4건)

| risk | 메커니즘 | 심각도 | 완화 |
|------|---------|--------|------|
| **SDET Code 계약 공백 → portfolio runway 동시 위기** | 5/15까지 신규 작업 중단 결정이 기존 계약 만료 시 PT+SafeWay+CareConnect 동시 cash flow gap | High | 5/16 이후 신규 수주 RFP/PoC 1건 즉시 재개. 5/15 이전이라도 기존 고객 유지·갱신은 진행 |
| **루넨랩스 사업자등록 지연 → PortOne·AWS 계약 불가** | UD-4 회피 결정 유지 중. 개인 명의 계약은 세금계산서 불가, 일부 PG 심사 통과 불가 | High | 5/16 이후(1R 통과 무관) 즉시 사업자등록 진행 검토. 단 5/8~5/15는 UD-4 결정 유지 |
| **5/12 영상 + 5/13 v3 + 5/14 SafeWay v2.2 자원 경합** | 1인 창업가 집중력 분산. 영상 실패 시 5/13 v3 timeline 동시 흔들림 | Medium | 영상 슬라이드 25~55초 5/11 freezing 전 미리 준비. UD-3 SafeWay 5/14 연기 default |
| **PT 6/9 slip → CareConnect PT+30d 일정 자동 밀림** | 시퀀스 의존성 — 모두의 창업 7월 차회 준비와 CareConnect 개발 겹침 | Medium | 6/9 slip 시 CareConnect 타이밍 즉시 재조정 decision rule 사전 정의 |

---

## 7. Top 12 즉시 실행 가능 Action (사용자 5/8~5/14 timeline)

> 본 audit의 가장 actionable한 12건. 각 항목 30분~5h.

| # | 행동 | 시간 | 담당 |
|---|------|------|------|
| 1 | jhryu115@gmail.com Gmail 검색 `subject:"🐾 [PT 사전가입]"` 5/8 18:00 카운트 → Claude에 전달 (P1-G) | 5분 | 사용자 |
| 2 | 자문진 5명 LOI 이메일 발송 (`2026-04-29-modoo-startup-pt-loi-templates.md` template) (P1-F) | 1h | 사용자 |
| 3 | SDET Code 월 수입·계약 만료일·신규 수주 비공개 Assumption Register 기록 (P1-H) | 30분 | 사용자 |
| 4 | UD-4 사업자등록 회피 유지 + 콜센터 콜 1R 통과 후로 이월 (P1-I) | 0 (수동) | 사용자 |
| 5 | OQ-9-A 펫봄 사전 검증 + *주0 inject 또는 narrative 완화 (P1-L) | 30분 | Claude |
| 6 | v3 inject 5건 (P1-A·B·C·D·E) + ID cross-grep | 5/13 | Claude |
| 7 | 5/12 영상 슬라이드 25~55초 사전 준비 (5/11 freezing 전) | 4h | 사용자 |
| 8 | 영상 0~25초 실녹화 + 25~55초 슬라이드 합성 + 55~60초 클로징 + YouTube Unlisted 업로드 → Q8 URL 입력 | 5/12 4h | 사용자 |
| 9 | 7월 차회 모집 일정 + 동일 공고 2회 신청 허용 여부 콜센터 확인 (F-A·F-B) | 30분 | 사용자 (5/16 이후 OK) |
| 10 | PortOne 가맹점 계약 신청 (예비창업자 자격 확인) (P2-D) | 30분 | 사용자 (5/16) |
| 11 | 마포·용산 펫카페 10곳 + 펫시터 모임 카페 컨택 리스트 (P2-F·G) | 2h | 사용자 (5/16~5/20) |
| 12 | Vercel Analytics 활성화 (10분 작업) — 사이트 트래픽 실측 시작 | 10분 | 사용자 (즉시) |

---

## 8. Audit 한계 + UNVERIFIED 항목 List

**read-only audit 한계**:
- `business_registration.md` 외부 시스템(홈택스·정부24) 직접 확인 불가
- 코드 quality는 5 파일 max 제약으로 부분 — User.phone/WalkerWallet @property 등 UNVERIFIED 다수
- 외부 자료 (모두의 창업 7월 차회 일정·기보 T등급·TIPS RM 평균 기간) 모두 UNVERIFIED
- VC 시장 가격 (시드 1억~3억 Equity 20~25%) 일반 통계 기반, 특정 AC 별 차이 미반영

**UNVERIFIED 핵심 항목 7건**:
1. SDET Code 월 수입·계약 만료일 (P1-H 전제)
2. 모두의 창업 7월 차회 공고 일정 (F-A 전제)
3. 동일 공고 2회 신청 허용 여부 (FB-1 전제)
4. mobile tsc 결과 (P2-A 결과)
5. SafeWay drivers/vehicles N:N 중개 구조 코드 (C-13)
6. iOS Privacy Manifest 작성 상태 (P2-J)
7. ChildConsent 철회 트리거 구현 상태 (P2-H)

---

## 9. Next Step (사용자 결정)

본 통합 매트릭스 기반으로 다음 옵션 중 선택 가능:

1. **즉시 P1 12건 처리**: Claude가 P1-A~E·L (v3 inject) 작업 시작, 사용자가 LOI 발송·SDET anchor·가입자 카운트
2. **5/12 영상 우선**: 영상 슬라이드 사전 준비 + Claude는 자료 보강 (slide 텍스트 draft)
3. **Track 2 미리 시작**: 5/16 전이라도 mobile tsc + AI 5축 mock 설계 선행 (병렬)
4. **개별 P1 항목 deep dive**: 사용자가 1개 골라 Claude가 단독 작업
