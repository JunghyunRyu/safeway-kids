# Gap Note — PT `confirm_payment` 미완료 결제 처리 버그 (도달 불가 코드)

**작성일**: 2026-06-08
**분류**: Code 버그 (기존 PetTracker 코드, CC 패리티 작업 중 발견)
**탐지 시점**: CareConnect 결제 연동(PT 미러링) 중 PT `service.confirm_payment` 정독
**심각도**: HIGH (결제 confirm이 PAID 상태를 영속하지 않음) — 단, 출시 전이라 실손해 0

## 발견

`backend/app/apps/pettracker/service.py`의 `confirm_payment` 중간에
`purge_old_walk_gps_history` 함수가 **잘못 삽입**되어 있다:

```
616  async def confirm_payment(...):
...
644      pg_resp = await portone_provider.confirm_payment(...)
649      pg_status = pg_resp.get("status")
650      if pg_status not in ("PAID", "VIRTUAL_ACCOUNT_ISSUED"):
651          raise ValidationError(...)
652
654  # ── 위치정보법 §16 자동 파기 (180일) ──
656  async def purge_old_walk_gps_history(db) -> int:   # ← confirm_payment 한가운데 삽입됨
...
664      return count
665
666      payment.imp_uid = imp_uid          # ← return count 뒤, 도달 불가 (dead code)
667      payment.status = PtPaymentStatus.PAID
668      payment.paid_at = datetime.now(UTC)
669      await db.flush()
670      return payment
```

결과:
1. `confirm_payment`는 PG 검증(`raise` 미발생) 후 **아무것도 반환하지 않고 None으로 종료** —
   `payment.status = PAID` / `paid_at` 설정 코드가 `purge_old_walk_gps_history`의
   `return count` 뒤로 밀려 영원히 실행되지 않음.
2. 라우터 `confirm_payment` 핸들러는 `payment.status`를 응답에 넣는데, service가
   None을 반환하므로 `AttributeError` 발생 가능 (실 호출 시 500).
3. `purge_old_walk_gps_history`는 의도된 위치(모듈 최상위 함수)가 아니라
   `confirm_payment` 본문 들여쓰기 안에 정의됨 — 호출은 되지만 정의 위치가 비정상.

## 왜 안 잡혔나

`grep` 결과 **PT PortOne 결제 흐름에 대한 테스트가 없다**. `tests/integration/test_billing_pg.py`는
SafeWay Kids의 Toss 결제 테스트이고 PT `pt/payments/*`를 커버하지 않는다. 따라서
confirm 단계 회귀가 드러나지 않았다.

## CC 작업에서의 처리

- CareConnect 결제(`confirm_cc_payment`)는 이 버그를 **이식하지 않고 올바른 순서로** 구현했다
  (PG 검증 → `payment.status=PAID` → `flush` → `return`). 
- CC에는 confirm 멱등성 포함 통합 테스트(`tests/integration/test_cc_payments.py`)를 추가해
  동일 버그 재발을 방지했다.

## 권고 (PT 측, 본 작업 범위 밖)

PT를 출시하기 전 다음 수정 필요 (사용자 승인 후 별도 작업 권장):
1. `purge_old_walk_gps_history`를 모듈 최상위로 이동 (`confirm_payment` 밖).
2. `confirm_payment` 말미에 `payment.imp_uid/status/paid_at` 설정 + `return payment` 복원.
3. PT 결제 통합 테스트 추가 (CC 테스트와 대칭).

## 해소 (2026-06-08, 사용자 directive "버그수정")

권고 3건 전부 반영:
1. ✅ `purge_old_walk_gps_history`를 모듈 최상위로 이동 (`confirm_payment` 밖).
2. ✅ `confirm_payment` 말미에 `payment.imp_uid/status/paid_at` 설정 + `await db.flush()` + `return payment` 복원.
3. ✅ PT 결제 통합 테스트 추가 (`tests/integration/test_pt_payments.py`, CC와 대칭) —
   full flow / PG 비정상 status 거부 / 소유권 403. DB 영속 직접 assert로 dead-code 회귀 가드.

검증:
- `tests/integration/test_pt_payments.py` 3 passed
- 타깃 회귀(PT+CC 결제, billing, walkphoto, cross-app) 33 passed / 3 failed(=기존 KI-2 Toss, 무관)
- `tests/unit` 77 passed (회귀 0)
- `main.py`의 `from app.apps.pettracker.service import purge_old_walk_gps_history` 임포트 정상 (함수 위치 모듈 최상위 유지)

**상태**: **RESOLVED** — PT 출시 critical path 결제 confirm 버그 제거 완료.
