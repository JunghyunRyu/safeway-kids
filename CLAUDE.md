# Claude Code Platform Charter

This repository is a **Claude Code plugin** providing a high-quality operating framework for repeatable development work.

## Objective
Convert user requests into verified implementation outcomes through a consistent workflow:
requirements analysis → independent review → consensus → tech spec → todo plan → implementation → verification → milestone closure → session handoff.

## Non-negotiable rules
1. Treat the user's explicit instruction as the top priority.
2. Never fabricate tool results, review outputs, test results, or repository state.
3. Do not start file-writing implementation until a Final Tech Spec exists, except for read-only exploration.
4. Record assumptions in an Assumption Register.
5. Record unresolved ambiguities in Open Questions.
6. When spec and code conflict, stop writing, create a Gap Note, update the spec or plan, then continue.
7. Never claim completion without evidence.
8. Never infer prior project state without a verified artifact.
9. Keep diffs minimal and traceable.
10. Every completed milestone must end with a Milestone Report and a Session Handoff Packet.

## Decision precedence
1. User instruction
2. Approved Final Tech Spec
3. Real codebase constraints
4. Passing verification evidence
5. Existing architecture and repository conventions
6. Reviewer opinions

## Verified-state rule
If no verified artifact exists, report exactly:

`NO VERIFIED PRIOR STATE`

Verified artifacts include:
- latest approved Tech Spec
- latest Milestone Report
- latest Session Handoff Packet

## 9-phase workflow
### Phase 0 — Intake
Produce:
- Requirement Brief
- Goals / Non-goals
- Assumption Register
- Open Questions
- Acceptance Criteria draft

### Phase 1 — Independent Review
Request independent review from available reviewers (subagents, MCP, or both).
Collect:
- requirement restatement
- missing requirements
- conflicts
- technical risks
- alternative designs
- testing concerns
- confidence

### Phase 2 — Consensus
Create a Consensus Matrix.
Resolve disagreements explicitly.

### Phase 3 — Final Tech Spec
Produce a Final Tech Spec containing:
- problem statement
- goals / non-goals
- user scenarios
- functional requirements
- non-functional requirements
- constraints
- architecture / data flow
- interfaces / CLI / AppState / event flow
- edge cases
- failure handling
- testing strategy
- rollback strategy
- acceptance criteria
- out-of-scope
- code impact map

### Phase 4 — Todo Plan
Convert the Final Tech Spec into milestone-based Todo items.

### Phase 5 — Implementation
Use single-writer discipline for code edits.
Keep:
- Change Summary
- Gap Notes
- Decision Log

### Phase 6 — Verification
Run relevant verification such as:
- unit tests
- integration tests
- regression checks
- smoke checks
- E2E checks, when available

### Phase 7 — Milestone Closure
Decide whether the current milestone is ready to close.
State:
- what is complete
- what remains unverified
- residual risks

### Phase 8 — Session Handoff
Before ending a session, produce a handoff packet with:
- current status
- changed files
- commands executed
- tests and outcomes
- open issues
- next exact first step

## Required artifacts
Default artifact paths:
- `artifacts/specs/`
- `artifacts/plans/`
- `artifacts/reviews/`
- `artifacts/reports/`
- `artifacts/handoffs/`
- `artifacts/gap-notes/`
- `artifacts/verification/`

Required artifact types:
- Requirement Brief
- Consensus Matrix
- Final Tech Spec
- Todo Plan
- Change Summary
- Verification Report
- Milestone Report
- Session Handoff Packet

## Delegation policy
Use plugin agents when appropriate:
- `requirement-analyst` for requirement breakdown and readiness
- `tech-spec-reviewer` for spec stress-testing
- `verification-auditor` for evidence-first closure checks

Use plugin skills when appropriate:
- `/claude-code-platform:bootstrap` for environment readiness and next-step guidance
- `/claude-code-platform:review` for orchestrated multi-review flow
- `/claude-code-platform:test` for structured verification execution
- `/claude-code-platform:gap-note` when spec and implementation drift
- `/claude-code-platform:milestone-report` at milestone closure
- `/claude-code-platform:session-handoff` before session end

## State and status reporting rules
1. Never infer the current project phase, prior milestone, or task status unless it is explicitly supported by:
   - the latest Milestone Report
   - the latest Session Handoff Packet
   - explicit user instruction
2. Tool discovery does not prove work completion.
3. MCP availability does not imply any review has already been performed.
4. Separate facts, assumptions, and recommendations.
5. If a reviewer or integration is unavailable, state that explicitly. Do not simulate missing reviewers.

## References
- `@docs/framework-reference.md`
- `@docs/customization.md`
- `@docs/architecture.md`
- `@docs/platform-roadmap.md`
