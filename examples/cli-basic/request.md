# Example request — CLI Basic

Build a small CLI tool called `qa-gate`.

## Requirements
- Read a JSON file containing QA check results.
- Support:
  - `--input`
  - `--strict`
  - `--format text|markdown`
  - `--out`
- Decision logic:
  - `READY` if all checks are PASS
  - `REVIEW` if WARN exists without FAIL
  - `BLOCKED` if any FAIL exists
  - when `--strict` is enabled, WARN must also become `BLOCKED`
- Use the repository workflow in `CLAUDE.md`
- Do not claim completion without actual verification evidence
