# Claude Code Platform Framework — File Index

This repository is a **platform-style Claude Code operating framework**.  
Use this index as your starting point.

## Start here
1. `README.md` — quick start and first-success path
2. `CLAUDE.md` — the runtime charter Claude reads at session start
3. `scripts/doctor.sh` — deterministic environment health check
4. `/bootstrap` — guided repo bootstrap and next-step report
5. `docs/framework-reference.md` — detailed workflow and artifact reference

## Core runtime files
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/rules/artifact-paths.md`
- `.claude/rules/verification-rules.md`
- `.claude/rules/safety-rules.md`

## Agents
- `.claude/agents/requirement-analyst.md`
- `.claude/agents/tech-spec-reviewer.md`
- `.claude/agents/verification-auditor.md`
- `.claude/agents/_template.md`

## Skills
- `.claude/skills/bootstrap/SKILL.md`
- `.claude/skills/review/SKILL.md`
- `.claude/skills/test/SKILL.md`
- `.claude/skills/gap-note/SKILL.md`
- `.claude/skills/milestone-report/SKILL.md`
- `.claude/skills/session-handoff/SKILL.md`
- `.claude/skills/_template/SKILL.md`

## Reference docs
- `docs/framework-reference.md`
- `docs/customization.md`
- `docs/architecture.md`
- `docs/platform-roadmap.md`

## Deterministic scripts
- `scripts/doctor.sh`
- `scripts/bootstrap-check.sh`
- `scripts/eval-smoke.sh`

## Examples
- `examples/cli-basic/README.md`
- `examples/cli-basic/request.md`
- `examples/cli-basic/smoke.sh`
- `examples/web-app/README.md`
- `examples/web-app/request.md`
- `examples/web-app/smoke.sh`

## Evaluation scaffolding
- `evals/README.md`
- `evals/scenarios/startup.md`
- `evals/scenarios/bootstrap.md`
- `evals/scenarios/example-cli.md`
- `evals/expected/README.md`

## Artifact directories
- `artifacts/specs/`
- `artifacts/plans/`
- `artifacts/reviews/`
- `artifacts/reports/`
- `artifacts/handoffs/`
- `artifacts/gap-notes/`
- `artifacts/verification/`
