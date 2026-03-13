---
description: Generate a precise handoff packet for the next Claude Code session. Use before ending a session or when switching to a new milestone.
disable-model-invocation: true
argument-hint: [next-focus]
---

Create a Session Handoff Packet for: `$ARGUMENTS`

## Before writing
1. Read the latest approved Tech Spec.
2. Read the latest Todo Plan.
3. Read the most recent Milestone Report if available.
4. Inspect current diffs, changed files, recent commands, and latest test output.
5. Assume the next session remembers nothing except repository state and this handoff.

## Output format
# Session Handoff Packet

## 1. Current status
## 2. Completed in this session
## 3. Files changed
## 4. Commands executed
## 5. Tests and outcomes
## 6. Open issues / blockers
## 7. Active assumptions
## 8. Next exact first step
## 9. Suggested prompt for the next session
## 10. Risks / cautions

## Rules
- Use exact file paths and concrete actions.
- Mark anything not verified as UNVERIFIED.
- Do not omit partial work.
