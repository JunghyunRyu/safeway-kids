"""Continuous GPS push to keep PT LiveTrackScreen animating.

Usage (PowerShell):
  $env:WALKER_TOKEN = "<walker jwt>"
  $env:SESSION_ID   = "<walk session uuid>"
  python backend/scripts/pt_gps_streamer.py [N] [interval_sec]

Usage (bash):
  WALKER_TOKEN=... SESSION_ID=... python backend/scripts/pt_gps_streamer.py 30 2.0
"""
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

token = os.environ.get("WALKER_TOKEN") or sys.exit("WALKER_TOKEN env required")
sid = os.environ.get("SESSION_ID") or sys.exit("SESSION_ID env required")
n = int(sys.argv[1]) if len(sys.argv) > 1 else 30
iv = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0

base_lat, base_lng = 37.5677, 126.9788
for i in range(n):
    lat = base_lat + i * 0.0003
    lng = base_lng + i * 0.0002
    body = json.dumps(
        {
            "latitude": lat,
            "longitude": lng,
            "heading": 90.0,
            "speed": 1.4,
            "accuracy": 5.0,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
    ).encode()
    req = urllib.request.Request(
        f"http://localhost:8000/api/v1/pt/walks/{sid}/gps",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    try:
        urllib.request.urlopen(req, timeout=5).read()
        print(f"[{i + 1:2}/{n}] sent ({lat:.4f}, {lng:.4f})")
    except urllib.error.HTTPError as e:
        print(f"[{i + 1:2}/{n}] HTTP {e.code}: {e.read().decode()[:200]}")
        sys.exit(1)
    if i < n - 1:
        time.sleep(iv)
