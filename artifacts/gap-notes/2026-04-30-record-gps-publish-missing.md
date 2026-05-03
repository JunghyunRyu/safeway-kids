# Gap Note — `record_gps` publish 누락

- **Date**: 2026-04-30
- **Discovered during**: Milestone C-14 (LiveTrackScreen WS 통합) 사전 분석
- **Spec ref**: FR-4 실시간 산책 추적 (WebSocket `pt:walk:{session_id}:updates`)
- **Severity**: BLOCKER for C-14 end-to-end 시연

## 갭 내용

백엔드 WS 엔드포인트 `walk_session_ws` (`router.py:561-636`)는 Redis pub/sub 채널 `pt:walk:{session_id}:updates`를 구독하지만, **이 채널에 publish하는 코드가 어디에도 없다**.

| 구성요소 | 상태 |
|---|---|
| WS subscribe (router.py:608) | ✅ 구현됨 (C-12) |
| `service.record_gps` (service.py:429) | ❌ DB 영속만, publish 누락 |
| Redis 채널에 메시지 발행 | ❌ 없음 |

비교: SafeWay Kids `vehicle_telemetry/service.py:179`는 `await redis.publish(channel, payload)`로 발행. PT는 동일 패턴을 빠뜨림.

## 영향

- C-14 LiveTrackScreen WS 통합이 클라이언트 측만 구현해도 메시지를 받지 못해 polyline이 업데이트되지 않음.
- C-15 WS latency 측정도 publish 흐름 없이는 의미 없음.

## Resolution

**즉시 조치 — service.record_gps에 publish 추가**:

```python
# service.py
async def record_gps(db: AsyncSession, session_id: uuid.UUID, point: GpsPoint) -> None:
    gps = WalkGpsHistory(...)
    db.add(gps)
    await db.flush()

    # Publish to Redis pub/sub for real-time WS subscribers
    from app.redis import redis_client
    import json
    payload = json.dumps({
        "type": "gps",
        "session_id": str(session_id),
        "lat": point.latitude,
        "lng": point.longitude,
        "heading": point.heading,
        "speed": point.speed,
        "recorded_at": point.recorded_at.isoformat(),
    })
    await redis_client.publish(f"pt:walk:{session_id}:updates", payload)
```

설계 원칙:
- DB flush → publish 순서. Publish 실패는 데이터 영속에 영향 없음.
- 메시지 형식 `{type:"gps", lat, lng, ...}` — 클라이언트 hook이 `type` 분기로 처리.
- `recorded_at`은 ISO 8601 string. 클라이언트는 `new Date(recorded_at)`로 파싱.

## Impact on Spec

Tech Spec FR-4 의도와 일치. **스펙 변경 없음.** 단지 누락된 구현을 채우는 것.

## Test Coverage

기존 `test_persona_scenarios.py:737`이 `POST /pt/walks/{id}/gps`를 호출하므로 publish 추가 시 redis가 필요. 테스트 환경에서 redis가 없으면 `redis_client.publish`가 fail할 수 있음. 

대응: publish를 try/except로 감싸 redis 실패가 GPS 영속을 깨지 않도록 fail-soft.

## Sign-off

- [x] Gap 식별 (2026-04-30)
- [ ] 백엔드 publish 추가 (다음 step)
- [ ] PT 백엔드 145 passed 회귀 검증
- [ ] C-14 frontend 진행
