# Framework Reference

This document is the **human-readable reference manual** for the Claude Code platform framework in this repository.

## 1. Purpose
The framework exists to make Claude Code behave like a **high-quality development platform**, not a loose collection of prompts.

It does that by combining:
- one short runtime charter (`CLAUDE.md`)
- deterministic guardrails (`.claude/settings.json`, scripts, permissions, hooks)
- reusable execution surfaces (agents and skills)
- artifact conventions
- examples and evaluation scaffolding

## 2. Authority model

### Runtime authority
During a Claude session, the effective authority order is:

1. explicit user instruction
2. `CLAUDE.md`
3. scoped rules under `.claude/rules/`
4. project settings under `.claude/settings.json`
5. verified repository evidence
6. reference docs under `docs/`

### Human-maintainer authority
For maintainers, the reference order is:

1. `README.md` — how to start
2. `docs/framework-reference.md` — what the framework means
3. `docs/customization.md` — how to adapt it
4. `docs/architecture.md` — why the pieces are split the way they are

## 3. 9-phase workflow

### Phase 0 — Intake
**Purpose:** turn a raw request into a structured requirement package.

**Inputs:**
- user request
- repository context
- existing artifacts, if any

**Outputs:**
- Requirement Brief
- Assumption Register
- Open Questions
- Acceptance Criteria draft

### Phase 1 — Independent Review
**Purpose:** get multiple perspectives before locking the spec.

**Possible reviewers:**
- project agents
- MCP review providers
- internal structured review pass

**Outputs:**
- individual review outputs with comparable fields

### Phase 2 — Consensus
**Purpose:** reconcile disagreements and make decisions visible.

**Output:**
- Consensus Matrix

### Phase 3 — Final Tech Spec
**Purpose:** create the implementation contract.

**Minimum sections:**
- problem statement
- goals / non-goals
- user scenarios
- functional requirements
- non-functional requirements
- constraints
- architecture / data flow
- interfaces / event flow
- edge cases
- failure handling
- testing strategy
- rollback strategy
- acceptance criteria
- out-of-scope
- code impact map

### Phase 4 — Todo Plan
**Purpose:** turn the spec into milestone-level execution steps.

**Each Todo item should include:**
- objective
- preconditions
- target files/modules
- dependencies
- validation method
- done criteria
- risks
- next-session note

### Phase 5 — Implementation
**Purpose:** write the minimal correct change.

**Operational rules:**
- one primary writer
- use Change Summary
- create Gap Notes when necessary
- keep diffs narrow and explainable

### Phase 6 — Verification
**Purpose:** prove what is actually working.

**Evidence types:**
- test output
- build output
- smoke checks
- runtime behavior
- manual checks, if unavoidable
- E2E traces, when available

### Phase 7 — Milestone Closure
**Purpose:** decide whether the milestone can be closed.

**Closure requires:**
- explicit scope statement
- verification summary
- residual risk statement
- next Todo

### Phase 8 — Session Handoff
**Purpose:** make the next session fast and deterministic.

**Handoff requires:**
- changed files
- commands executed
- tests and outcomes
- blockers and assumptions
- next exact first step

## 4. Artifact schemas

### Requirement Brief
Required sections:
- Objective
- In scope
- Out of scope
- Functional requirements
- Non-functional requirements
- Codebase touchpoints
- Assumption Register
- Open Questions
- Acceptance Criteria Draft
- Risks / Unknowns
- Readiness Verdict

### Consensus Matrix
Recommended structure:
- issue or topic
- reviewer A position
- reviewer B position
- reviewer C position
- lead decision
- rationale

### Final Tech Spec
Required sections listed in Phase 3.

### Todo Plan
Recommended per-item fields:
- milestone
- objective
- files/modules
- dependencies
- validation method
- done criteria
- risk

### Verification Report
Recommended fields:
- scope
- commands run
- expected results
- actual results
- verified status
- failures/skips
- residual risk

### Milestone Report
Recommended fields:
- goal
- scope completed
- files changed
- implementation summary
- verification
- issues and residual risks
- decision log
- next todo
- next-session starter prompt

### Session Handoff Packet
Recommended fields:
- current status
- completed this session
- files changed
- commands executed
- tests and outcomes
- blockers
- assumptions
- next first step
- suggested prompt
- risks/cautions

## 5. Artifact paths and naming

### Default directories
- `artifacts/specs/`
- `artifacts/plans/`
- `artifacts/reviews/`
- `artifacts/reports/`
- `artifacts/handoffs/`
- `artifacts/gap-notes/`
- `artifacts/verification/`

### Naming
Prefer:
- `YYYY-MM-DD-short-topic.md`
- `YYYY-MM-DD-HHMM-short-topic.md`

## 6. Status vocabulary

Use these terms consistently:

- `NO VERIFIED PRIOR STATE` — no trusted earlier artifact exists
- `READY` — acceptable to proceed or release according to criteria
- `REVIEW` — acceptable to proceed only with explicit review
- `BLOCKED` — cannot proceed safely
- `VERIFIED` — directly supported by evidence
- `PARTIALLY VERIFIED` — some evidence exists, but not complete
- `UNVERIFIED` — not yet checked
- `FAILED` — checked and did not meet expectations

## 7. Guardrail philosophy

The framework prefers **deterministic control** over prompt-only control.

### Deterministic mechanisms
- `.claude/settings.json`
- permission rules
- hooks
- `scripts/doctor.sh`
- `scripts/bootstrap-check.sh`
- `scripts/eval-smoke.sh`

### Prompt-driven mechanisms
- `CLAUDE.md`
- subagents
- skills

Use deterministic mechanisms for:
- sensitive file restrictions
- standard verification entry points
- environment readiness
- CI or smoke evaluation

Use prompt-driven mechanisms for:
- analysis
- synthesis
- workflow orchestration
- artifact authoring

## 8. Failure modes and how to handle them

### No verified prior state
Return `NO VERIFIED PRIOR STATE`.
Begin from Phase 0 unless the user supplies an artifact.

### Reviewer unavailable
State exactly which reviewer is unavailable.
Do not synthesize a fake output.

### Spec/code mismatch
Create a Gap Note.
Update the spec or plan before continuing.

### Test unavailable
State that verification is unavailable.
Do not convert absence of tests into a pass.

### External provider unavailable
Treat MCP and external providers as optional.
Core workflow must still function without them.

## 9. Example operating pattern

1. Run `./scripts/doctor.sh`
2. Start Claude Code
3. Invoke `/bootstrap`
4. Run `requirement-analyst`
5. Run `/review`
6. Draft Final Tech Spec
7. Run `tech-spec-reviewer`
8. Create Todo Plan
9. Implement
10. Run `/test`
11. Run `verification-auditor`
12. Produce `/milestone-report`
13. Produce `/session-handoff`

## 10. Promotion path
This repository is designed to start as a **repo-local standalone framework** and later promote to a **shareable Claude Code plugin**.

See `docs/platform-roadmap.md`.
