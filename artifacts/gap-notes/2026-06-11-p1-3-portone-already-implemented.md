# Gap Note — P1-3 "PortOne v2 인터페이스 스켈레톤" 은 이미 구현되어 있음

**Date**: 2026-06-11
**Trigger**: P1-3 착수 전 read-only 탐색에서 플랜 ↔ 코드 불일치 발견
**Plan source**: [`artifacts/handoffs/2026-05-22-session-final-handoff.md`](../handoffs/2026-05-22-session-final-handoff.md) "Next Exact First Step" 4번 항목

## Plan이 말한 것
> "PortOne v2 인터페이스 스켈레톤 (mock) — 사업자 계정 발급 전이므로 호출부 없는 인터페이스만"

## 코드의 실제 상태 (2026-06-11 실측)
PortOne v2는 스켈레톤이 아니라 **호출부 포함 전체 구현이 이미 존재**:

| 레이어 | 파일 | 상태 |
|---|---|---|
| ABC | `backend/app/modules/billing/providers/base.py` (`AbstractPGProvider`) | 구현됨 |
| Provider | `backend/app/modules/billing/providers/portone.py` (`PortOneProvider`, dev-mode mock 분기 내장) | 구현됨 |
| Config | `backend/app/config.py` `portone_api_secret/webhook_secret/store_id` 3키 | 구현됨 |
| Webhook | `backend/app/modules/billing/router.py` `POST /billing/webhook/portone` | 구현됨 |
| 호출부 | `backend/app/apps/pettracker/service.py` prepare/confirm/cancel/webhook sync | 구현됨 |
| DB | `pt_payments` 테이블 (migration `c4b1f5e7a8d2`, 2026-04-24) | 구현됨 |
| **단위 테스트** | `backend/tests/` 내 PortOne 검색 결과 0건 | **부재** |

추정 원인: 4월 PT P2/P3 작업(`c4b1f5e7a8d2_create_pt_payments`)에서 이미 구현됐는데,
5/22 핸드오프가 4/29 Tech Spec의 슬라이스 목록을 재검증 없이 이월.

## WalkPhoto 쪽 상태
`WalkPhoto` / `walk_photo`는 backend 전체에서 **0건** — 플랜대로 신규 작업 맞음.

## 해소 (P1-3 범위 재정의)
1. **WalkPhoto 모델 + Alembic 마이그레이션** — 플랜 그대로 진행 (FR-B2 + FR-F2 condition 컬럼)
2. **PortOne 신규 구현 없음** — 기존 구현 유지 (diff 최소화). 대신 **부재한 단위 테스트 추가**
   (`verify_webhook` HMAC fail-closed + dev-mode confirm/cancel 경로) — 사업자 계정·네트워크 불요, mock 검증이라는 P1-3 원래 의도와 일치
3. Tech Spec §16.1의 "4테이블 1 migration"(`add_ai_models.py`) 중 본 슬라이스는 **WalkPhoto만** 분리 수행.
   PtIncidentClassification·PtModerationFlag·PtAiInsight 3테이블은 P2-2(LLM 실 구현)와 함께 추가 — §16.2 단일 head 보장 취지 유지
4. 마이그레이션은 autogenerate 미사용·직접 작성 (`c4b1f5e7a8d2` NOTE의 기존 룰 준수 — autogenerate가 무관 테이블 drop을 끼워넣는 사고 회피)
