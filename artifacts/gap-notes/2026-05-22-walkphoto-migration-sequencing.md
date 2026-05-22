# Gap Note — WalkPhoto 마이그레이션 시퀀싱 (P1-3)

**Date**: 2026-05-22
**Phase**: Phase 5 (Implementation) — P1-3 슬라이스
**작성 사유**: CLAUDE.md 규칙 #6 (스펙과 코드가 충돌하면 Gap Note 후 진행)
**관련 Tech Spec**: `artifacts/specs/2026-04-29-pt-ai-differentiation-final-tech-spec.md` §16 Migration Plan

---

## 1. 충돌 내용

| 항목 | Tech Spec §16 (기준) | P1-3 실제 구현 |
|---|---|---|
| 마이그레이션 개수 | §16.1 "신규 migration **1건**" — WalkPhoto·PtIncidentClassification·PtModerationFlag·PtAiInsight 4개 테이블을 한 파일에 | WalkPhoto **단일 테이블** 마이그레이션 1건. 나머지 3개 테이블은 P2-2(축 A/D 구현)로 이연 |
| 추가 시점 | §16.2 "AI migration은 **Milestone D 완료 후**에 head 추가 (단일 head 보장)" | Milestone D 이전인 2026-05-22에 head 추가 |

## 2. 충돌이 발생한 이유

Tech Spec §16은 2026-04-29 작성 시점 기준이며, 그 후 2026-05-22 사용자 결정 **D-8**(6/15까지 본업 집중 + PT는 AI 호출 없는 인프라 골격만 슬라이스)이 추가됐다. D-8 슬라이스 전략은 §16 작성 시점에 존재하지 않았다.

- **개수 분할**: WalkPhoto는 축 B/F(사진 캡션·컨디션) 인프라로, P1-3 슬라이스 범위. 나머지 3개 테이블(PtIncidentClassification=축 A, PtModerationFlag=축 D, PtAiInsight=확장용)은 P2-2의 LLM 실 구현과 함께 추가하는 것이 burnout-0 원칙(쓰고 버려지지 않는 코드만)에 부합.
- **시점 변경**: §16.2의 "Milestone D 완료 후" 전제는 C-13/14 모달 작업과의 **동시 진행 시 head 충돌 회피**가 목적이었다. D-8 하에서는 슬라이스 트랙이 유일한 활성 코드 작업이라 동시 작업이 없고, head 충돌 위험이 소멸했다.

## 3. 검증된 사실

- Alembic head 전수 분석 결과 **단일 head = `e7a9b2c4d6f8`** (student_name_encryption). merge head 불필요.
- 신규 마이그레이션 `down_revision = 'e7a9b2c4d6f8'` → 여전히 단일 head 유지. §16.2가 우려한 head 충돌 미발생.
- 최종 스키마 형상은 스펙과 **동일** — 4개 테이블 모두 결국 생성됨. 차이는 마이그레이션 *granularity*(1건 → 2건 이상)와 *추가 순서*뿐.

## 4. 해소 (Resolution)

- **충돌 아님으로 판정**: end-state 스키마가 스펙과 일치하므로 설계 모순이 아니라 **시퀀싱 조정**이다.
- **스펙 해석 갱신**: §16.1 "신규 migration 1건"은 D-8 이후 "**축별 분할 마이그레이션 (P1-3 WalkPhoto, P2-2 나머지 3개)**"로 해석한다. §16.2 "Milestone D 완료 후" 전제는 D-8 단일 트랙 체제에서 무효(moot)다.
- **추가 조치 불요**: 별도 스펙 파일 개정 없이 본 Gap Note로 traceability를 보존한다. P2-2 착수 시 본 노트를 참조해 나머지 3개 테이블 마이그레이션을 추가한다.

## 5. P2-2 이연 항목 (체크리스트)

- [ ] `PtIncidentClassification` 모델 + 마이그레이션 (축 A — 사고 신고 분류)
- [ ] `PtModerationFlag` 모델 + 마이그레이션 (축 D — 모더레이션)
- [ ] `PtAiInsight` 모델 + 마이그레이션 (확장용)
- [ ] 각 마이그레이션 추가 시 head 단일성 재확인

## 6. 부수 결정 — autogenerate 미사용

핸드오프(`2026-05-22-session-final-handoff.md`)의 P1-3 step 3은 "`alembic revision --autogenerate` → drop 검토"라 적었으나, 본 마이그레이션은 **hand-write**로 작성한다.

근거: 프로젝트 컨벤션(`c4b1f5e7a8d2_create_pt_payments.py` NOTE — "autogenerate 미사용, 5개 테이블 drop 위험 회피") + 메모리 `feedback_alembic_autogenerate_review.md`. 신규 테이블 1개 추가는 hand-write가 더 안전하고 live DB 의존도 없다. 핸드오프의 "drop 검토" 의도(스푸리어스 drop 차단)는 hand-write가 더 강하게 충족한다.
