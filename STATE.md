# SafeWay Kids — Current State (Live)

> This file is the **single source of truth** for "what is happening right now".
> Updated by `/session-start` and `/session-end` skills.
> For point-in-time milestone snapshots see `artifacts/reports/`.
> For historical session records see `artifacts/handoffs/`.

**Last updated**: 2026-04-17
**Current phase**: Phase 5 — Implementation (ICT 샌드박스 후속 대응 — v2.0.1 병합 완료, 변호사 자문 대기)
**Active workstream**: SafeWay Kids 규제 샌드박스 2026-05-07 미팅 준비
**Active brief**: [artifacts/business/regulatory/2026-04-09-sandbox-call-followup-brief.md](artifacts/business/regulatory/2026-04-09-sandbox-call-followup-brief.md)
**Active draft (v2.0.1)**: [artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md](artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md)
**Next gate**: 변호사 유료 자문 실시(목표 2026-04-22, 1.5h) → v2.1 확정본 2026-04-28 이의림 변호사 사전 전달 → 2026-05-07 미팅

## Blockers / Waiting On
- ✅ ~~과기정통부 ICT 샌드박스 후속 이메일~~ → 04-10 이의림 변호사 검토 의견 수신
- ✅ ~~이메일 회신~~ → 04-10 발송 완료
- ✅ ~~신청서 v2.0 초안 작성~~ → 2026-04-17 완료 (5명 페르소나 리뷰 88/100 통과)
- ✅ ~~추가 법령 7종 스캔·병합~~ → 2026-04-17 v2.0.1 완료 (AI 기본법·자배법·교특법·영유아보육법·유아교육법 추가)
- 🟡 변호사 유료 자문 예약·실시 (D+5 = 2026-04-22, **1.5시간 권장**, Q1~Q16, 예산 50~75만원)
- 🟡 AI 기본법 §33 고영향 AI 확인 요청 초안 작성 (실증 개시 전 과기정통부 제출)
- 🟡 파일럿 협력 학원 1곳 컨택 (D+10 = 2026-04-27 목표)
- 🟡 v2.1 확정본 이의림 변호사에게 전달 (2026-04-28 목표)
- 🟡 이의림 변호사 일정 확인 회신 대기 (5/6~8 중 확정 예상)

## Latest Handoff
- [artifacts/handoffs/2026-04-17-session-final-handoff.md](artifacts/handoffs/2026-04-17-session-final-handoff.md)

## 04-10 수신 이의림 변호사 검토 의견 5가지 — v2.0 반영 현황
| # | 쟁점 | 위험도 | v2.0 반영 위치 |
|---|---|---|---|
| (1) | §49조의2 제3호 등록으로 충분하지 않나 | 치명적 | §2.1~§2.6 규제 공백 4개 구조로 정면 답변 |
| (2-1) | 플랫폼 소유 차량 → 스쿨버스 유사 | 낮음 | §1.2 차량 소유 구조 명확화 + §3 비교표 차량 소유 행 신설 |
| (2-2) | 유휴 학원차량 → 차량유형 논의 | 높음 | §1.3 N:N 관계도 + §2.3 공백 #2 (전세 정의 vs DRT) |
| (3) | 긱이코노미 동승보호자 §53 "지명" 요건 | 중 | §2.4 공백 #3 + §4.1 7단계 매칭 프로세스 |
| (4) | AI 카메라 개보법 준수만 충분? | 중 | §2.5 공백 #4 + §4.2 개인정보 처리 프로세스 |
| (5) | 다부처 관여 시일 소요 | 참고 | §7 다부처 대응 전략 매트릭스 (부처 7곳 사전 준비) |

## Active Artifacts (quick reference)
| 파일 | 용도 |
|---|---|
| `artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0-draft.md` | **[NEW]** 신청서 v2.0.1 보정본 markdown (규제 공백 **5개** + §4.6 AI 거버넌스 + §7 부처 9개 + Ultra Think 교정 4종) |
| `artifacts/business/regulatory/2026-04-17-sandbox-application-v2.0.1-preview.docx` | **[NEW]** 신청서 v2.0.1 **docx preview** (66KB / 299 paragraphs / 21 tables). 이의림 변호사 4/28 사전 전달용 |
| `.claude/scripts/md-to-docx.py` | **[NEW]** Markdown → DOCX 변환 스크립트 (한글 폰트·표·인용 지원). 재사용 가능 |
| `artifacts/business/regulatory/2026-04-17-lawyer-consult-questions.md` | **[NEW]** 변호사 유료 자문 질문지 **Q1~Q16** (1.5시간) |
| `artifacts/business/regulatory/2026-04-17-issue-qa-script.md` | **[NEW]** 과기정통부 심사·전문위 발표용 Q&A 스크립트 (이의림 변호사 미팅용 아님 — 용도 재정의 2026-04-17) |
| `artifacts/business/regulatory/2026-04-17-lawyer-meeting-agenda.md` | **[NEW v2.0]** 2026-05-07 이의림 변호사 미팅 어젠다 — 조력자 관점. **Q-L1~L22 + L17-b·L18-b = 총 24개 질문**, Top-10 마크, 백업 시나리오(§5.5), 오프닝 선언(§6.1) |
| `artifacts/business/regulatory/2026-04-17-meeting-agenda-persona-review.md` | **[NEW]** 조력자 페르소나 5명(P-C1~C5) 재검토 — P-C2 78/100·P-C4 조건부→반영 후 승인 |
| `artifacts/business/regulatory/2026-04-17-persona-review-results.md` | **[NEW]** 5명 페르소나 리뷰 (P-B1 88/100, P-B2 PASS) |
| `artifacts/business/regulatory/2026-04-17-additional-legal-review.md` | **[NEW]** 추가 법령 7종 스캔 메모 (AI 기본법·자배법·교특법·영유아보육법·유아교육법·학원법·정보통신망법) |
| `artifacts/business/regulatory/2026-04-09-sandbox-call-followup-brief.md` | 샌드박스 종합 브리핑 (카드 A~G, 14일 플랜, 금기어) |
| `docs/srs/SAFEWAY_KIDS_application_extracted.md` | 신청서 원본 docx 추출본 (python-docx로 2026-04-17 재추출) |
| `artifacts/reviews/2026-03-21-legal-regulatory-review.md` | R-01~R-07 / P-01~P-10 법규 리스크 |
| `docs/srs/safeway_kids_srs.md` §4.1~4.4 | 여객자동차법·도로교통법·세림이법·샌드박스 전략 |

## Portfolio Status
- **SafeWay Kids**: 규제 샌드박스 심사 대기 (후속 대응 active)
- **SDET Code**: 운영 중 (B2B 해외)
- **PetTracker**: 런칭 준비
- **CareConnect**: 런칭 준비
- **루넨랩스**: 사업자등록 진행 중 (일반과세자 필수)

## Available Skills (fast lane)
- `/session-start` — 세션 시작 시 상태 복원
- `/session-end` — 세션 종료 시 핸드오프 강제
- `/sandbox-followup [email|prep|status|review]` — 샌드박스 워크플로우 (5명 페르소나 내장)

## Available Agents (specialist pool)
- `business-operations-manager` — 사업 전반 (CFO+COO+CSO)
- `korea-regulatory-counsel` — 한국 규제·법무 1차 자문
- `korea-tax-accounting-advisor` — 한국 세무·회계
- `korea-fundraising-strategist` — 정부지원사업 + 초기 VC IR
