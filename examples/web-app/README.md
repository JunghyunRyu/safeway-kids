# Example — Web App

This example demonstrates how to use the platform for a small web application feature.

## Scenario
Add a checkout validation rule for an e-commerce flow:
- block order submission when payment method is incompatible with a promotional coupon
- show a clear user-facing error message
- preserve existing checkout behavior when no coupon is applied

## Why this example is useful
It exercises:
- user scenario definition
- state flow and event flow
- UI + backend boundary review
- regression risk analysis
- verification planning across unit/integration/E2E layers

## Suggested workflow
1. Run `/bootstrap`
2. Use `requirement-analyst` on `request.md`
3. Create a Requirement Brief
4. Run `/review`
5. Draft the Final Tech Spec
6. Run `tech-spec-reviewer`
7. Implement with a minimal diff
8. Run `/test`
9. Use `verification-auditor`
10. Close with `/milestone-report` and `/session-handoff`
