#!/usr/bin/env bash
set -euo pipefail

JSON_MODE=0
if [[ "${1:-}" == "--json" ]]; then
  JSON_MODE=1
fi

# Resolve plugin root: use CLAUDE_PLUGIN_ROOT if set, otherwise script's parent directory
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

BLOCKERS=()
WARNINGS=()
OKS=()

add_ok() { OKS+=("$1"); }
add_warn() { WARNINGS+=("$1"); }
add_blocker() { BLOCKERS+=("$1"); }

has_file() { [[ -f "$1" ]]; }
has_dir() { [[ -d "$1" ]]; }
has_exec() { [[ -x "$1" ]]; }

check_file() {
  local path="$1"
  local label="${2:-$1}"
  if has_file "$path"; then
    add_ok "$label present"
  else
    add_blocker "$label missing"
  fi
}

check_dir() {
  local path="$1"
  local label="${2:-$1}"
  if has_dir "$path"; then
    add_ok "$label present"
  else
    add_blocker "$label missing"
  fi
}

check_optional_file() {
  local path="$1"
  local label="${2:-$1}"
  if has_file "$path"; then
    add_ok "$label present"
  else
    add_warn "$label missing (optional)"
  fi
}

check_optional_dir() {
  local path="$1"
  local label="${2:-$1}"
  if has_dir "$path"; then
    add_ok "$label present"
  else
    add_warn "$label missing (optional)"
  fi
}

json_escape() {
  local s="${1//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

print_json_array() {
  local -n arr=$1
  printf '['
  local first=1
  for item in "${arr[@]+"${arr[@]}"}"; do
    if [[ $first -eq 0 ]]; then printf ','; fi
    first=0
    printf '"%s"' "$(json_escape "$item")"
  done
  printf ']'
}

# ── Plugin structure checks ──

# Manifest
check_file "$PLUGIN_ROOT/.claude-plugin/plugin.json" "plugin.json manifest"

# Skills
check_file "$PLUGIN_ROOT/skills/bootstrap/SKILL.md" "skill: bootstrap"
check_file "$PLUGIN_ROOT/skills/review/SKILL.md" "skill: review"
check_file "$PLUGIN_ROOT/skills/test/SKILL.md" "skill: test"
check_file "$PLUGIN_ROOT/skills/gap-note/SKILL.md" "skill: gap-note"
check_file "$PLUGIN_ROOT/skills/milestone-report/SKILL.md" "skill: milestone-report"
check_file "$PLUGIN_ROOT/skills/session-handoff/SKILL.md" "skill: session-handoff"

# Agents
check_file "$PLUGIN_ROOT/agents/requirement-analyst.md" "agent: requirement-analyst"
check_file "$PLUGIN_ROOT/agents/tech-spec-reviewer.md" "agent: tech-spec-reviewer"
check_file "$PLUGIN_ROOT/agents/verification-auditor.md" "agent: verification-auditor"

# Hooks & settings
check_file "$PLUGIN_ROOT/hooks/hooks.json" "hooks.json"
check_file "$PLUGIN_ROOT/settings.json" "settings.json"

# Docs
check_file "$PLUGIN_ROOT/docs/framework-reference.md" "docs: framework-reference"
check_file "$PLUGIN_ROOT/docs/customization.md" "docs: customization"
check_file "$PLUGIN_ROOT/docs/architecture.md" "docs: architecture"
check_file "$PLUGIN_ROOT/docs/platform-roadmap.md" "docs: platform-roadmap"

# Scripts
check_file "$PLUGIN_ROOT/scripts/doctor.sh" "scripts: doctor.sh"
if has_exec "$PLUGIN_ROOT/scripts/doctor.sh"; then add_ok "doctor.sh executable"; else add_warn "doctor.sh not executable"; fi

# Examples (optional — may not exist when installed as plugin)
check_optional_dir "$PLUGIN_ROOT/examples/cli-basic" "example: cli-basic"
check_optional_dir "$PLUGIN_ROOT/examples/web-app" "example: web-app"

# Evals (optional)
check_optional_dir "$PLUGIN_ROOT/evals" "evals"

# ── Project-level checks (user's working directory) ──

check_optional_file "CLAUDE.md" "project CLAUDE.md"
check_optional_dir "artifacts/specs" "artifacts/specs"
check_optional_dir "artifacts/plans" "artifacts/plans"
check_optional_dir "artifacts/reviews" "artifacts/reviews"
check_optional_dir "artifacts/reports" "artifacts/reports"
check_optional_dir "artifacts/handoffs" "artifacts/handoffs"
check_optional_dir "artifacts/gap-notes" "artifacts/gap-notes"
check_optional_dir "artifacts/verification" "artifacts/verification"

# JSON validation
if command -v python3 >/dev/null 2>&1; then
  if python3 -c "import json; json.load(open('$PLUGIN_ROOT/.claude-plugin/plugin.json', 'r', encoding='utf-8'))" >/dev/null 2>&1; then
    add_ok "plugin.json valid JSON"
  else
    add_blocker "plugin.json invalid JSON"
  fi

  if has_file "$PLUGIN_ROOT/settings.json"; then
    if python3 -c "import json; json.load(open('$PLUGIN_ROOT/settings.json', 'r', encoding='utf-8'))" >/dev/null 2>&1; then
      add_ok "settings.json valid JSON"
    else
      add_blocker "settings.json invalid JSON"
    fi
  fi

  if has_file "$PLUGIN_ROOT/hooks/hooks.json"; then
    if python3 -c "import json; json.load(open('$PLUGIN_ROOT/hooks/hooks.json', 'r', encoding='utf-8'))" >/dev/null 2>&1; then
      add_ok "hooks.json valid JSON"
    else
      add_blocker "hooks.json invalid JSON"
    fi
  fi
fi

# Optional MCP
if has_file ".mcp.json"; then
  if command -v python3 >/dev/null 2>&1; then
    if python3 -c "import json; json.load(open('.mcp.json', 'r', encoding='utf-8'))" >/dev/null 2>&1; then
      add_ok ".mcp.json present and valid JSON"
    else
      add_warn ".mcp.json present but invalid JSON"
    fi
  else
    add_warn ".mcp.json present; JSON validation skipped"
  fi
else
  add_warn ".mcp.json missing (optional)"
fi

# ── Summary ──

STATUS="healthy"
EXIT_CODE=0

if [[ ${#BLOCKERS[@]} -gt 0 ]]; then
  STATUS="blocked"
  EXIT_CODE=1
elif [[ ${#WARNINGS[@]} -gt 0 ]]; then
  STATUS="healthy-with-warnings"
  EXIT_CODE=0
fi

if [[ $JSON_MODE -eq 1 ]]; then
  printf '{'
  printf '"status":"%s",' "$STATUS"
  printf '"blockers":'; print_json_array BLOCKERS; printf ','
  printf '"warnings":'; print_json_array WARNINGS; printf ','
  printf '"ok":'; print_json_array OKS
  printf '}\n'
  exit $EXIT_CODE
fi

for item in "${BLOCKERS[@]+"${BLOCKERS[@]}"}"; do
  [[ -n "$item" ]] && printf '[BLOCKER] %s\n' "$item"
done
for item in "${WARNINGS[@]+"${WARNINGS[@]}"}"; do
  [[ -n "$item" ]] && printf '[WARN] %s\n' "$item"
done
for item in "${OKS[@]+"${OKS[@]}"}"; do
  [[ -n "$item" ]] && printf '[OK] %s\n' "$item"
done

printf 'SUMMARY: BLOCKER=%d WARN=%d OK=%d STATUS=%s\n' "${#BLOCKERS[@]}" "${#WARNINGS[@]}" "${#OKS[@]}" "$STATUS"
exit $EXIT_CODE
