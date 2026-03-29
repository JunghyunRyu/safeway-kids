---
name: systematic-debugging
description: Root-cause-first debugging methodology. Use when investigating test failures, bugs, or unexpected behavior.
version: 1.0.0
source: obra/superpowers
license: MIT
---

# Systematic Debugging

## The Iron Rule

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
```

Symptom-focused solutions are counterproductive and create additional issues.

## Four-Phase Framework

### Phase 1: Root Cause Investigation

Before proposing ANY solution:
1. Read error messages thoroughly — every line
2. Reproduce the issue reliably
3. Examine recent changes that might relate
4. Gather diagnostic evidence at component boundaries
5. Check logs, stack traces, and state at failure point

### Phase 2: Pattern Analysis

1. Locate working comparable code
2. Identify differences between working and broken implementations
3. Check if the pattern exists elsewhere in the codebase
4. Look for similar issues in git history

### Phase 3: Hypothesis and Testing

1. Form a **specific** theory about the cause
2. Test **one** minimal change at a time
3. Do NOT bundle multiple changes
4. Verify the hypothesis explains ALL symptoms

### Phase 4: Implementation

1. Create a failing test case that reproduces the bug
2. Implement a single fix targeting the root cause
3. Verify the fix resolves the test
4. Run full test suite for regressions

## Critical Safeguard

```
If ≥ 3 fixes fail → STOP and question the architecture.
```

Multiple failed attempts suggest fundamental design problems requiring discussion, not more patches.

## Red Flags — Bypassing the Process

- Proposing multiple simultaneous changes
- Skipping test creation
- "Try this and see" without hypothesis
- Attempting fixes after 2+ failures without stopping
- Blaming flaky tests without evidence
- Adding workarounds instead of fixing root cause

## Debugging Checklist

```
□ Error message read completely
□ Issue reproduced reliably
□ Recent changes reviewed
□ Single hypothesis formed
□ Hypothesis explains all symptoms
□ Minimal change proposed
□ Failing test created
□ Fix verified against test
□ Full suite checked for regressions
```

## Why This Matters

- Systematic debugging achieves ~95% first-time fix rate
- Random trial-and-error achieves ~40%
- Root cause fixes prevent recurrence
- Patch fixes create maintenance burden
