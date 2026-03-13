# Example — CLI Basic

This example demonstrates how to use the platform for a small CLI feature.

## Scenario
Build a tiny QA Gate CLI that reads a JSON file of checks and returns:
- `READY` when all checks pass
- `REVIEW` when warnings exist without failures
- `BLOCKED` when any failure exists

## Why this example is useful
It exercises:
- Phase 0 requirement analysis
- spec drafting
- CLI surface design
- argument validation
- test planning
- milestone reporting
- handoff generation

## Suggested workflow
1. Run `/bootstrap`
2. Use `requirement-analyst` on `request.md`
3. Run `/review`
4. Draft the Final Tech Spec
5. Run `tech-spec-reviewer`
6. Create Todo Plan
7. Implement
8. Run `/test`
9. Run `verification-auditor`
10. Produce `/milestone-report`
11. Produce `/session-handoff`
