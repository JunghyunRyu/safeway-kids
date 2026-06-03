# Gap Note — GPS 속도/정확도 검증 도보 임계 로그온리 (스펙 편차)

> **작성**: 2026-06-03 (Phase 5 구현 중 발견)
> **규칙**: charter #6 (스펙과 구현 충돌 시 Gap Note 작성 후 진행)
> **관련 스펙**: `artifacts/specs/2026-06-03-mobile-gps-remediation-tech-spec.md` §6.1 (G-01)

## 충돌 내용
스펙 §6.1은 GPS 속도/정확도 검증 실패 시 **422 reject**를 규정한다. 그러나 도보(PT) 임계값을 하드 리젝트하면 **정상 좌표를 거부**하는 false-positive가 발생한다:

- **속도**: `MAX_WALK_SPEED_MS = 15km/h`. GPS 지터는 5초 간격 50m 점프 = 36km/h로 흔히 나타남 → 정상 산책 좌표가 거부되어 `route_polyline`·거리 계산이 깨짐.
- **정확도**: `30m` 임계. 도심·건물 사이 휴대폰 GPS 정확도는 흔히 30~65m → 정상 좌표 거부.

## 결정 (구현된 편차)
| 경로 | 검증 | 동작 | 사유 |
|---|---|---|---|
| SafeWay 차량 `update_gps` | 속도 200km/h(`MAX_VEHICLE_SPEED_MS`) | **하드 리젝트 422** | 지터로 200km/h 초과 불가 → false-positive 없음. 스펙 준수 |
| PT 도보 `record_gps` | 속도 15km/h | **로그온리 warning** | 지터 false-positive 회피. 탐지는 유지 |
| PT 도보 `record_gps` | 정확도 30m | **로그온리 warning** | 도심 GPS 변동 → false-positive 회피 |

구현 위치: `vehicle_telemetry/service.py:update_gps`(리젝트), `pettracker/service.py:record_gps`(로그온리).

## 영향
- G-01 "검증 함수 미연결" 결함은 **해소**됨 (함수가 실제 호출됨 — grep으로 0→N 확인 가능).
- 스푸핑/텔레포트 **탐지**는 양쪽 모두 작동(로그). 차량은 **차단**까지, 도보는 **탐지만**.
- 정상 산책/운행 좌표 거부 위험 없음.

## 해소 조건 (하드 리젝트 활성화 트리거)
- **트리거**: PT V1.0 출시 후 로그(`[GPS TELEPORT]`·`[GPS ACCURACY]`) 실데이터 2주 수집
- **기준**: 실제 도보 속도/정확도 분포의 p99를 측정해 false-positive 없는 리젝트 임계 재설정
- **책임**: 백엔드 (P2-2 Track 2 단계)
- **방법**: `record_gps`의 로그온리 분기를 `raise ValidationError`로 승격 + 임계값을 측정치 기반으로 조정

## 비고
이 편차는 안전을 약화시키지 않는다 — 오히려 정상 데이터 거부로 인한 거리계산 오류(=사고 책임 규명 자료 손상)를 막는다. 차량(아동 안전 직결)은 하드 리젝트로 더 강하게 보호.
