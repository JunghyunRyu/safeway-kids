---
name: verification-before-completion
description: Evidence-before-claims verification gate. Use before claiming any work is complete, fixed, or passing.
version: 1.0.0
source: obra/superpowers
license: MIT
---

# Verification Before Completion

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO → State actual status with evidence
   - If YES → State claim WITH evidence
5. ONLY THEN → Make the claim

Skip any step = lying, not verifying.
```

## Evidence Requirements

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build: exit 0 | Linter passing |
| Bug fixed | Original symptom passes | Code changed, assumed fixed |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/push/PR without verification
- Relying on partial verification
- Thinking "just this once"

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ tests |
| "Partial check is enough" | Partial proves nothing |

## When To Apply

**ALWAYS before:**
- Any completion/success claims
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

## The Bottom Line

Run the command. Read the output. THEN claim the result. Non-negotiable.
