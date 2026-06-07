#!/usr/bin/env bash
set -euo pipefail

echo "== Claude Code Platform Bootstrap Check =="
echo

if ./scripts/doctor.sh --json >/tmp/claude-platform-doctor.json 2>/dev/null; then
  cat /tmp/claude-platform-doctor.json
  echo
else
  ./scripts/doctor.sh
  echo
fi

echo "Recommended next steps:"
echo "1. Start Claude Code in this repository."
echo "2. Invoke /bootstrap."
echo "3. If blockers exist, fix them before starting Phase 0."
echo "4. If healthy, pick an example under examples/ or start with a real request."
