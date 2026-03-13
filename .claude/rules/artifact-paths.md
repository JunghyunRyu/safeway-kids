# Artifact path rules

Use these default output paths unless the user explicitly requests a different location:

- Requirement Briefs and Final Tech Specs → `artifacts/specs/`
- Todo Plans → `artifacts/plans/`
- Independent review outputs and Consensus Matrix → `artifacts/reviews/`
- Verification Reports → `artifacts/verification/`
- Milestone Reports → `artifacts/reports/`
- Session Handoff Packets → `artifacts/handoffs/`
- Gap Notes → `artifacts/gap-notes/`

## Naming convention
Use timestamped, readable filenames:

- `YYYY-MM-DD-short-topic.md`
- `YYYY-MM-DD-HHMM-short-topic.md` when multiple artifacts of the same type are created in one day

Examples:
- `artifacts/specs/2026-03-12-qa-gate-tech-spec.md`
- `artifacts/reports/2026-03-12-milestone-1.md`
- `artifacts/handoffs/2026-03-12-next-session.md`

## Rules
1. Do not scatter workflow artifacts across the repository without a reason.
2. Use consistent filenames so the next session can discover the latest artifact quickly.
3. If the user asks for a different location, follow the user and note the deviation in the report or handoff.
4. If an artifact is mentioned in a response, use the exact relative path.
