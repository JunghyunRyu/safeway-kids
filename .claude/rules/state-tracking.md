# State tracking rules

The repo root `STATE.md` is the **single source of truth** for "what is happening right now".
`CLAUDE.md` "Active Work (Live)" section mirrors the critical fields for human-readable context.

## When STATE.md must be updated
1. **Session start** — `/session-start` skill reads it and verifies all paths still exist
2. **Phase transition** — moving from Phase N to Phase N+1 of the 9-phase workflow
3. **Blocker added/removed** — any blocker change
4. **Active brief changes** — when a new brief is created or an old one is archived
5. **Session end** — `/session-end` skill updates `Last updated` timestamp and verifies content

## Required fields
- `Last updated`: YYYY-MM-DD (optional HH:MM)
- `Current phase`: one of 9 phases from CLAUDE.md workflow
- `Active workstream`: short name (1 line)
- `Active brief`: path to the primary brief file (must exist)
- `Next gate`: what triggers the next phase transition or major decision
- `Blockers / Waiting On`: list (can be empty, use "없음")
- `Latest Handoff`: path to latest handoff file

## Rules
1. **No stale paths** — every path in STATE.md must exist. If a file is removed, STATE.md must be updated in the same commit.
2. **Phase must match reality** — if the work actually happening is Phase 3 but STATE.md says Phase 5, STATE.md must be corrected immediately.
3. **STATE.md ≠ snapshot** — it is a live pointer. Historical records belong in `artifacts/reports/` or `artifacts/handoffs/`.
4. **Never fabricate STATE.md** — if the current state is unclear, fall back to `NO VERIFIED PRIOR STATE` and ask the user.
5. **Keep it short** — STATE.md should be readable in 30 seconds. If it grows past 80 lines, move details into artifacts.
6. **CLAUDE.md mirror** — the "Active Work (Live)" section in CLAUDE.md must be kept in sync with STATE.md at least for: active workstream, current phase, active brief, next gate, blockers. `/session-end` verifies this.

## Failure modes to catch
- STATE.md exists but Last updated is 7+ days old → `/session-start` must warn
- STATE.md references a brief file that no longer exists → `/session-start` must flag and prompt
- Handoff and STATE.md disagree on next step → `/session-start` must resolve via user question
- New blocker added in conversation but not reflected in STATE.md → `/session-end` must catch
