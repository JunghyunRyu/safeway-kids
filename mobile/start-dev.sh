#!/bin/bash
# Expo Go 개발 환경 한번에 시작
# 사용법: ./start-dev.sh

set -e

NGROK_BIN="$HOME/.config/ngrok/ngrok"
PROXY_PORT=9000
METRO_PORT=8081
BACKEND_PORT=8000

echo "=== SAFEWAY KIDS 개발 환경 시작 ==="

# 1. 기존 프로세스 정리
echo "[1/4] 기존 프로세스 정리..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*proxy.js" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true
sleep 2

# 2. 백엔드 확인
if lsof -i :$BACKEND_PORT -P -n 2>/dev/null | grep -q LISTEN; then
  echo "[2/4] 백엔드 서버 (포트 $BACKEND_PORT) - 실행 중"
else
  echo "[2/4] 백엔드 서버 (포트 $BACKEND_PORT) - 실행 안됨!"
  echo "      backend 디렉토리에서 먼저 백엔드를 시작하세요."
fi

# 3. Metro Bundler 시작
echo "[3/4] Metro Bundler 시작 (포트 $METRO_PORT)..."
cd "$(dirname "$0")"

# ngrok URL 가져오기 (나중에 설정)
NGROK_URL=""

# Metro를 백그라운드에서 시작
BROWSER=none npx expo start --host lan --port $METRO_PORT &
METRO_PID=$!
echo "      Metro PID: $METRO_PID"

# Metro가 준비될 때까지 대기
echo "      Metro 준비 대기 중..."
for i in $(seq 1 30); do
  if curl -s http://localhost:$METRO_PORT > /dev/null 2>&1; then
    echo "      Metro 준비 완료!"
    break
  fi
  sleep 1
done

# 4. Proxy 시작
echo "[4/4] 프록시 + ngrok 시작..."
node proxy.js &
PROXY_PID=$!
echo "      Proxy PID: $PROXY_PID (포트 $PROXY_PORT)"
sleep 1

# 5. ngrok 시작
$NGROK_BIN http $PROXY_PORT --log=stdout &
NGROK_PID=$!
sleep 3

# ngrok URL 가져오기
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NGROK_URL" ]; then
  echo ""
  echo "============================================"
  echo "  모든 서비스 시작 완료!"
  echo "============================================"
  echo "  Metro:   http://localhost:$METRO_PORT"
  echo "  Proxy:   http://localhost:$PROXY_PORT"
  echo "  ngrok:   $NGROK_URL"
  echo ""
  echo "  Expo Go 접속 URL:"
  echo "  exp://$(echo $NGROK_URL | sed 's|https://||')"
  echo "============================================"
  echo ""

  # QR 코드 생성 (qrcode 패키지가 있으면)
  node -e "
    try {
      const QRCode = require('qrcode');
      const url = 'exp://$(echo $NGROK_URL | sed 's|https://||')';
      QRCode.toString(url, {type: 'terminal', small: true}, (err, str) => {
        if (!err) { console.log(str); }
      });
    } catch(e) {}
  " 2>/dev/null

  # Metro 재시작 (EXPO_PACKAGER_PROXY_URL 적용)
  kill $METRO_PID 2>/dev/null
  sleep 2
  EXPO_PACKAGER_PROXY_URL=$NGROK_URL BROWSER=none npx expo start --host lan --port $METRO_PORT &
  METRO_PID=$!
  echo "  Metro 재시작 (프록시 URL 적용) PID: $METRO_PID"
else
  echo "  ngrok URL을 가져올 수 없습니다. ngrok 상태를 확인하세요."
fi

echo ""
echo "종료하려면 Ctrl+C를 누르세요."

# Ctrl+C로 모든 프로세스 종료
trap "echo '정리 중...'; kill $METRO_PID $PROXY_PID $NGROK_PID 2>/dev/null; exit 0" INT TERM
wait
