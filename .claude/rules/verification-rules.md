# Verification rules

Verification is evidence-first.

## Minimum evidence for a completion claim
Before claiming a task or milestone is complete, provide:
- the files changed
- the commands run
- the actual result of those commands
- any failures, skips, or unknowns
- residual risk, if any

## Required language discipline
Use these labels clearly when appropriate:
- VERIFIED
- PARTIALLY VERIFIED
- UNVERIFIED
- FAILED

Do not collapse unverified work into a pass.

## Verification priorities
1. Run the smallest reliable verification first.
2. Prefer project-native verification commands over invented checks.
3. Separate test execution from test interpretation.
4. If tests are flaky, say so explicitly.
5. If E2E is unavailable, say so explicitly.
6. Verification evidence matters more than reviewer confidence.

## Closure rule
A milestone can close only when:
- implementation scope is stated
- verification status is explicit
- residual risks are listed
- the next step is named
