# Final Tech Spec — PT 산책 GPS 저정확도 처리 (2026-06-14)

소형 슬라이스. Trigger: 사용자 질문 "GPS 정확도가 낮은 것은 어떻게 처리하지?" → 진행 지시.
선행 분석: `core/gps_validation.py`(검증 유틸 존재, 호출부 0건), `record_gps`(저장만, 필터 없음).

## 1. Problem
PT 산책 트래킹은 모바일이 보낸 `accuracy`를 `walk_gps_history`에 저장만 하고, 정확도/속도 검증 없이 그대로 ① 실시간 polyline append ② Redis 발행(보호자 LiveTrack) ③ 종료 시 거리 합산에 사용한다. 저정확도/순간이동 점이 경로 들쭉남·거리 과대계상·(P2-2 FR-E 이상탐지) 위양성으로 직결된다. 검증 유틸(`validate_gps_accuracy`, `validate_gps_speed`)은 단위 테스트까지 있으나 앱에서 호출되지 않는다.

## 2. Goals / Non-goals
**Goals**: G1 저정확도·순간이동 GPS 점을 실시간 표시·polyline·거리계산에서 제외. G2 원본은 보존(감사·안티스푸핑). G3 회귀 0.
**Non-goals**: 칼만 필터/스무딩 등 신호처리(V1.1), FR-E 이상탐지 본구현(P2-2), CareConnect(이미 50m 게이트 존재)·SafeWay(D-7 동결) 변경, 모바일 수집 로직 변경(이미 High accuracy 적절).

## 3. Functional Requirements
- **FR-1** `WalkGpsHistory`에 `is_filtered: bool`(기본 False, server_default false) + `filter_reason: str|None(varchar 30)` 추가. Alembic 마이그레이션 1건(직접 작성, down_revision=a4b8e2c6d9f1).
- **FR-2** PT 트래킹 정확도 임계 `PT_GPS_ACCURACY_THRESHOLD_M = 50` (CC 체크인 50m와 정합). 속도 임계는 유틸 기본 `MAX_WALK_SPEED_MS`(15km/h).
- **FR-3** `record_gps`: 인입 점을 검증한다.
  - 정확도: `validate_gps_accuracy(accuracy, 50)` 실패 → `is_filtered=True, filter_reason="low_accuracy"`. `accuracy=None`은 통과(검증 불가, 기존 동작 유지).
  - 속도: 직전 **비필터(accepted)** 점이 있으면 `validate_gps_speed` 실패 시 → `is_filtered=True, filter_reason="implausible_speed"`. 첫 점은 속도검사 생략.
  - 정확도·속도 둘 다 검사하되 정확도 우선(둘 다 실패 시 reason="low_accuracy").
- **FR-4** 필터된 점은: ① 원본 행 **저장(보존)** ② polyline append **제외** ③ Redis 발행 **제외**. 통과 점만 기존대로 처리.
- **FR-5** `record_gps` 반환값을 `tuple[WalkGpsHistory, bool accepted]`로 변경. 라우터는 `{"status":"ok"}` 또는 `{"status":"filtered","reason":...}` 반환 → 모바일이 저정확도 신호를 인지(향후 "GPS 신호 약함" 안내에 활용).
- **FR-6** `end_walk` 거리 계산: `is_filtered=False` 점만 합산. 추가로 정지 중 드리프트 제거 — 두 인접 통과점 사이 거리가 (두 점 accuracy 합) 미만이면 해당 구간은 0으로 간주(노이즈). accuracy 없는 점은 드리프트 가드 생략(거리 그대로 합산).

## 4. Edge Cases
- 첫 점 저정확도 → low_accuracy 필터, polyline 비고, 다음 통과점이 첫 polyline point가 됨.
- 모든 점이 필터됨 → distance 0, polyline 빈 배열(크래시 없음).
- accuracy=None 연속 → 기존 동작과 동일(전부 통과, 드리프트 가드만 생략).
- 직전 통과점 조회는 세션 내 `is_filtered=False` 중 `recorded_at` 최대값. 없으면 속도검사 생략.

## 5. Failure Handling
검증·필터는 순수 계산이라 예외 없음. Redis 발행은 기존 fail-soft 유지. 필터 판정 실패가 영속을 막지 않음.

## 6. Testing Strategy
- 단위(`core/gps_validation`): 기존 유지(이미 통과).
- 통합(`record_gps` 경유 또는 service 직접): ① 저정확도 점 filtered+polyline 미반영 ② 순간이동 점 filtered ③ 정상 점 accepted+polyline 반영 ④ accuracy=None 통과 ⑤ end_walk 거리: 필터점 제외 + 드리프트 가드.
- 마이그레이션 up/down/up 실 PG.
- 전체 회귀(기지 KI 외 fail 0).

## 7. Rollback
마이그레이션 downgrade 1건(두 컬럼 drop). record_gps/end_walk는 단일 커밋 revert로 원복.

## 8. Acceptance Criteria
1. 저정확도(>50m) 점이 polyline·Redis 발행·거리계산에서 빠진다(테스트 증명).
2. 원본 행은 is_filtered=True로 보존된다.
3. 순간이동(>15km/h) 점이 implausible_speed로 필터된다.
4. accuracy=None은 기존대로 통과(회귀 없음).
5. 마이그레이션 up/down/up 통과, 전체 회귀 기지 외 fail 0.

## 9. Code Impact Map
- `backend/app/apps/pettracker/models.py` (WalkGpsHistory +2 컬럼)
- `backend/app/apps/pettracker/service.py` (record_gps, end_walk, PT_GPS_ACCURACY_THRESHOLD_M, last-good 조회)
- `backend/app/apps/pettracker/router.py` (record_gps 응답 분기)
- `backend/migrations/versions/+1`
- `backend/tests/integration/test_pt_gps_filtering.py` (신규)
