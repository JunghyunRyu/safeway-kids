---
description: Record a structured note when the approved spec and repository reality diverge during implementation.
disable-model-invocation: true
argument-hint: [topic]
---

Create a Gap Note for: `$ARGUMENTS`

Use this skill when:
- the spec expects behavior the codebase does not support
- a dependency or interface behaves differently than assumed
- a test, architecture constraint, or runtime detail forces a spec adjustment
- implementation discovered a material mismatch that should be documented

## Output format
# Gap Note

## 1. Summary
One paragraph describing the mismatch.

## 2. Approved expectation
Quote or summarize the relevant spec expectation.

## 3. Repository reality
State what the codebase, tooling, or runtime actually shows.

## 4. Impact
Explain what this changes for implementation, testing, or scope.

## 5. Recommended resolution
Choose one:
- update the spec
- update the code
- split scope
- defer and track

## 6. Follow-up artifact
State which artifact must be updated next.
