"""C-14 GPS Loop Simulator.

walker_token + session_id를 받아 N초 간격으로 GPS 점을 송신.

사용법:
  python scripts/c14_gps_loop.py <session_id> <walker_token> [count=20] [interval=3]
"""

import json
import sys
import time
import urllib.request
from datetime import datetime, timezone

API = "http://localhost:8000/api/v1"


def send_gps(session_id: str, walker_token: str, lat: float, lng: float) -> None:
    body = {
        "latitude": lat,
        "longitude": lng,
        "heading": 90.0,
        "speed": 1.4,
        "accuracy": 5.0,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }
    req = urllib.request.Request(
        f"{API}/pt/walks/{session_id}/gps",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {walker_token}", "Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req, timeout=10).read()


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python c14_gps_loop.py <session_id> <walker_token> [count=20] [interval=3]")
        sys.exit(1)

    session_id = sys.argv[1]
    walker_token = sys.argv[2]
    count = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    interval = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0

    base_lat, base_lng = 37.5665, 126.9780
    print(f"=== Sending {count} GPS points every {interval}s to session {session_id[:8]}... ===")
    for i in range(count):
        lat = base_lat + i * 0.0003
        lng = base_lng + i * 0.0002
        try:
            send_gps(session_id, walker_token, lat, lng)
            print(f"  [{i + 1:2}/{count}] ({lat:.4f}, {lng:.4f}) sent")
        except Exception as e:
            print(f"  [{i + 1:2}/{count}] ERR {e}")
        if i < count - 1:
            time.sleep(interval)
    print("=== DONE ===")


if __name__ == "__main__":
    main()
