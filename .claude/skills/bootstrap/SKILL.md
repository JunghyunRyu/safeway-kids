---
description: Run the deterministic platform health check, summarize readiness, and recommend the next step for this repository.
disable-model-invocation: true
argument-hint: [project-type-or-goal]
allowed-tools: Read, Glob, Grep, Bash
---

Bootstrap this repository for Claude Code work. User input: `$ARGUMENTS`

## What to do
1. Run `${CLAUDE_PLUGIN_ROOT}/scripts/doctor.sh --json` if possible. If JSON output is unavailable, run `${CLAUDE_PLUGIN_ROOT}/scripts/doctor.sh`.
2. Read:
   - `README.md`
   - `CLAUDE.md`
   - `${CLAUDE_PLUGIN_ROOT}/docs/framework-reference.md`
3. Confirm project-scoped agents are available (plugin agents or `.claude/agents/`).
4. Confirm project-scoped skills are available (plugin skills or `.claude/skills/`).
5. Confirm whether `.mcp.json` exists. Treat MCP as optional, not required for core readiness.
6. Summarize blockers, warnings, and available capabilities.
7. Recommend the next step:
   - Phase 0 — Intake
   - fix blockers first
   - run an example scenario
8. Produce a Bootstrap Report.

## Output format

# Bootstrap Report

## 1. Platform status
One of:
- HEALTHY
- HEALTHY WITH WARNINGS
- BLOCKED

## 2. Core checks
Summarize:
- CLAUDE.md
- settings
- rules
- agents
- skills
- docs
- examples
- evals

## 3. Optional integrations
State whether `.mcp.json` is present and whether external providers are configured.

## 4. Recommended next action
Give one next action, not a long list.

## 5. Starter prompt
Write a ready-to-paste first prompt for this repository.

## Important rules
- Do not invent prior state.
- If no verified artifact exists, say `NO VERIFIED PRIOR STATE`.
- Treat deterministic script output as the source of truth for environment status.
