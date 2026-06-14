# Verification Report — PT GPS 저정확도 필터링 (2026-06-14)

Spec: [`../specs/2026-06-14-pt-gps-accuracy-filtering-tech-spec.md`](../specs/2026-06-14-pt-gps-accuracy-filtering-tech-spec.md)
환경: 원격 컨테이너 (Python 3.12 venv + PostgreSQL 16 + Redis)

## 1. 신규 단위/통합 — **VERIFIED**
```
pytest tests/integration/test_pt_gps_filtering.py tests/unit/test_gps_validation.py
→ 6 + 14 = 20 passed
```
커버리지: 정상점 accepted+polyline / 저정확도(>50m) filtered+보존+polyline 미반영 / accuracy=None 통과 / 순간이동(>15km/h) implausible_speed / end_walk 거리 필터점 제외 / 정지 드리프트 가드(이동<accuracy합 → 0).

## 2. 마이그레이션 — **VERIFIED**
`b6d1f3e8c2a7_add_walk_gps_filter_flags`: 실 PostgreSQL 16에서 upgrade → `is_filtered`(not null default false)·`filter_reason`(varchar 30) 확인 → downgrade(컬럼 제거) → 재upgrade(복원) 전부 통과.

## 3. 전체 백엔드 회귀 — **VERIFIED (회귀 0)**
```
pytest --tb=line -q --timeout=120
→ 247 passed / 6 failed / 2 errors in 428s
```
- 신규 6건 전부 PASS. 직전 마일스톤 240 passed → 247 passed (+6 GPS, +1 KI-4 WS gps-relay가 이번 run에서 통과).
- 실패 전수 = 기지 이슈: KI-2 Toss webhook ×3, KI-3 health ×1, KI-4 WS auth ×2(+2 error, run 중 Redis 재차 끊김으로 발현). GPS 변경 기인 신규 실패 0.

## 4. Lint — **VERIFIED**
변경 source(service/router/models)에 신규 이슈 0 (import는 올바른 알파벳 위치, 잔여 B008/F401/N806 등은 전부 선재·미접촉 코드). 마이그레이션은 ruff config상 제외.

## 5. 모바일 영향 — 변경 없음
`recordGps`(api/walks.ts)는 응답 본문을 읽지 않으므로 `{"status":"filtered","reason":...}` 추가는 하위 호환. 이번 슬라이스 모바일 코드 수정 0. "GPS 신호 약함" UI 노출은 FR-5 훅으로 가능하나 디바운스 UX 설계가 필요해 V1.1 이연(보고서 명시).

## 6. UNVERIFIED (정직 고지)
- Expo Go 실기기에서의 실제 저정확도 점 발생·필터 동작은 본 컨테이너에서 불가 — 사용자 환경 스모크 필요.
- 임계값 50m·드리프트 가드(accuracy 합)는 합리적 기본값이나, 실 사용 로그 누적 후 튜닝 권장(V1.1).

## 7. Acceptance Criteria 대조 (spec §8)
| AC | 상태 |
|---|---|
| 1 저정확도점 polyline·발행·거리 제외 | ✅ |
| 2 원본 is_filtered=True 보존 | ✅ |
| 3 순간이동점 implausible_speed | ✅ |
| 4 accuracy=None 통과(회귀 없음) | ✅ |
| 5 마이그 up/down/up + 전체 회귀 기지 외 fail 0 | ✅ |
