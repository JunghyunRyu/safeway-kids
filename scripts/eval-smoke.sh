#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="evals/out"
mkdir -p "$OUT_DIR"

echo "== Running framework smoke evaluation =="

./scripts/doctor.sh > "$OUT_DIR/doctor.txt"

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found. Wrote doctor output only."
  exit 3
fi

claude -p \
  "Read CLAUDE.md and report the 9-phase workflow in one short paragraph." \
  --allowedTools "Read,Glob,Grep" \
  --output-format json \
  > "$OUT_DIR/startup-workflow.json"

claude -p \
  "List the project-scoped agents and skills from this repository only." \
  --allowedTools "Read,Glob,Grep" \
  --output-format json \
  > "$OUT_DIR/project-surface.json"

echo "Smoke evaluation outputs written to $OUT_DIR"
