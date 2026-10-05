---
description: Produce a standardized milestone completion report with evidence, changed files, verification results, residual risks, and the next todo.
disable-model-invocation: true
argument-hint: [milestone-name]
---

Create a Milestone Report for: `$ARGUMENTS`

## Before writing
1. Read the latest approved Tech Spec.
2. Read the latest Todo Plan.
3. Inspect changed files and recent command/test output.
4. Do not mark anything complete unless there is evidence.
5. If verification was skipped, say so explicitly.

## Output format
# Milestone Report — [milestone name]

## 1. Goal
## 2. Scope completed
## 3. Files / modules changed
## 4. Implementation summary
## 5. Verification
## 6. Issues and residual risks
## 7. Decision log
## 8. Next Todo
## 9. Recommended next-session starter prompt

## Rules
- Prefer exact file paths, test names, and commands.
- Separate complete, partial, and unverified work clearly.
- Never hide failing tests.
