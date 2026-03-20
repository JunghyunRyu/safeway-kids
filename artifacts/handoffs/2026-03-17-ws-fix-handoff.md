# Session Handoff: WebSocket 실시간 추적 수정

**Date:** 2026-03-17

---

## Current Status

WS 연결 수정 구현 완료, 서버 측 전체 경로 VERIFIED.
모바일 앱 수동 테스트 대기 중.

## Services Running

| Service | Port | PID |
|---------|------|-----|
| Backend (uvicorn) | 8000 | 1375685 |
| Metro | 8081 | node |
| Proxy | 9000 | node |
| ngrok | 4040 | ngrok |
| Redis | 6379 | redis-server |
| GPS Replay | — | background (b5gg98q0k) |

**ngrok URL:** `https://kinematical-carole-bursate.ngrok-free.dev`

## Changed Files

| File | Change |
|------|--------|
| `mobile/src/hooks/useVehicleTracking.ts` | 전면 재작성 — 토큰 검증/refresh/폴링/상태 enum |
| `mobile/src/api/client.ts` | `refreshAccessToken()` export |
| `mobile/src/screens/parent/MapScreen.tsx` | connectionState UI |
| `mobile/src/constants/mapHtml.ts` | Kakao Maps 인라인 HTML (신규) |
| `mobile/proxy.js` | WS /api/* → backend 라우팅 |
| `backend/app/config.py` | DB 포트 5433 |
| `backend/scripts/gps_replay.py` | dev-login 인증 방식 |
| `mobile/package.json` | http-proxy 추가 |

## Commands Executed This Session

```bash
# DB 및 서비스 초기화
sudo -u postgres psql -p 5433 -c "CREATE USER safeway WITH PASSWORD 'safeway';"
sudo -u postgres psql -p 5433 -c "CREATE DATABASE safeway_kids OWNER safeway;"
cd backend && source .venv/bin/activate && alembic upgrade head
python3 -m app.seed
redis-server --daemonize yes

# 서비스 시작
cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 &>/tmp/uvicorn.log &
cd mobile && node proxy.js &
~/.config/ngrok/ngrok http 9000 --log=stdout &
EXPO_PACKAGER_PROXY_URL=https://kinematical-carole-bursate.ngrok-free.dev BROWSER=none npx expo start --host lan --port 8081 &
```

## Open Issues

- OI1: 앱 수동 테스트 미완 — Expo Go에서 실시간 추적 확인 필요
- OI2: ngrok 무료 터널 2시간 제한 — 만료 시 재시작 필요

## Next Exact First Step

```
1. Expo Go에서 앱 Reload (shake → Reload)
2. 박보호자로 로그인 (01033333333)
3. 실시간 추적 탭 진입
4. Metro 콘솔에서 "[WS] Connected" 로그 확인
5. 지도 버스 마커 이동 확인 (GPS replay 실행 중)
```
