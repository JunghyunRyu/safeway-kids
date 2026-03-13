# Platform Roadmap

This roadmap turns the repository from a strong local framework into a shareable Claude Code platform.

## Stage 1 — Standalone framework (current target)
**Goal:** one repository can use the framework well.

### Deliverables
- concise `CLAUDE.md`
- deterministic `scripts/doctor.sh`
- project-scoped agents and skills
- quick-start `README.md`
- customization docs
- example scenarios

### Success criteria
- a new user can reach first success in ~5 minutes
- the framework runs without external reviewers
- project agents and skills are discoverable
- `doctor.sh` can detect blockers deterministically

## Stage 2 — Stronger workflow automation
**Goal:** reduce operator friction without weakening control.

### Deliverables
- `/review`
- `/test`
- `/gap-note`
- better milestone and handoff flows
- stronger hook patterns
- narrower `.claude/rules/`

### Success criteria
- less manual repetition
- clearer closure discipline
- lower chance of silent drift between spec and code

## Stage 3 — Evaluation and CI
**Goal:** make the platform test itself.

### Deliverables
- `evals/scenarios/`
- `scripts/eval-smoke.sh`
- CI smoke job
- example-based startup checks

### Success criteria
- the framework can prove its own readiness
- regressions in the framework are caught early
- onboarding docs stay aligned with actual behavior

## Stage 4 — Provider packs
**Goal:** support optional integrations without bloating the core.

### Deliverables
- review-provider pack
- docs-provider pack
- tracker-provider pack
- domain example packs

### Rules
- providers remain optional
- the core path never depends on them
- provider failures must degrade gracefully

## Stage 5 — Plugin packaging
**Goal:** distribute the framework across repositories and teams.

### Deliverables
- Claude Code plugin package
- versioned releases
- changelog
- migration notes
- plugin docs

### Success criteria
- the platform can be installed, versioned, and reused cleanly
- repository-local overrides still work
- the core and project instance are easy to separate

## Design principle
Do not ship a plugin too early.
First make the repo-local framework stable, deterministic, and teachable.
Then promote the stable pieces.
