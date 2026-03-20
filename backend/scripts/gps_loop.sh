#!/bin/bash
cd "$(dirname "$0")/.."
source .venv/bin/activate
echo "GPS loop started (Ctrl+C to stop)"
while true; do
  python3 -u scripts/gps_replay.py --vehicles 1 --interval 4
  echo "--- replaying again ---"
  sleep 1
done
