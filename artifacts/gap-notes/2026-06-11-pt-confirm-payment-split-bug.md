# Gap Note — confirm_payment 함수가 GPS purge 삽입으로 두 동강 나 있었음

**Date**: 2026-06-11
**Trigger**: M-A 구현 후 ruff F821(undefined-name) 스캔에서 발견
**Severity**: HIGH (결제 confirm endpoint 기능 고장 — 선재 버그, 4월 코드)

## 증상
`backend/app/apps/pettracker/service.py`에서 `purge_old_walk_gps_history()`(위치정보법 §16 작업, 4월 추가)가 **`confirm_payment()` 본문 중간에 삽입**되어 있었다:
- `confirm_payment`는 PG 검증까지만 수행하고 **암묵적 None 반환** → 결제가 PAID로 저장되지 않고, 라우터의 `response_model` 직렬화도 실패
- 원래 꼬리 부분(`payment.status = PAID … return payment`)은 purge 함수의 `return` 뒤 도달 불가 코드로 잔존 (F821 5건의 정체)

## 왜 지금까지 안 잡혔나
- confirm_payment에 대한 통합 테스트 0건 (PortOne 자체가 테스트 공백이었음 — 6/11 gap-note #1과 동일 뿌리)
- import는 정상이므로 앱 기동·기존 스위트에 비발현

## 해소
1. 꼬리 코드를 `confirm_payment`로 원위치, purge 함수를 뒤로 분리 (커밋 참조)
2. `tests/integration/test_pt_payment_flow.py` 신규 — prepare→confirm→list end-to-end (dev-mock 채널). 이 테스트는 본 버그가 재발하면 즉시 실패한다
3. ruff F821 잔여 1건 (`scheduling/service.py:967 RouteSession`)은 SafeWay 영역 (D-7 동결) — Known Issue로만 기록, 미수정

## 교훈
- "구현 존재 ≠ 동작" — PortOne 사례 연속 2건. 핵심 플로우는 endpoint-level 테스트가 최소 안전망
