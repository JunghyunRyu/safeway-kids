---
name: test-driven-development
description: TDD Red-Green-Refactor cycle enforcement. Use when writing new features or fixing bugs to ensure tests come first.
version: 1.0.0
source: obra/superpowers
license: MIT
---

# Test-Driven Development (TDD)

## The Iron Rule

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
```

If you write implementation before tests, you must delete it and start over.

## The Red-Green-Refactor Cycle

### 1. RED — Write a Failing Test

- Write the **smallest** test that demonstrates desired behavior
- Run it — it MUST fail
- Verify it fails for the **right reason** (missing feature, not typo)
- If it passes immediately, the test proves nothing — delete and rewrite

### 2. GREEN — Make It Pass

- Write the **simplest** code that makes the test pass
- Do NOT add extra functionality
- Do NOT refactor yet
- Run the test — confirm it passes

### 3. REFACTOR — Clean Up

- Improve code structure while tests stay green
- Remove duplication
- Improve naming
- Run tests after each change

## Why This Order Matters

Tests written **after** passing code prove nothing:
- Might test the wrong thing
- Might test implementation, not behavior
- Might miss edge cases you forgot

Watching the test **fail first** proves:
- The test actually exercises the code path
- The test would catch a regression
- The behavior didn't already exist

## Critical Requirements

- Watch every test fail before implementing
- Verify failures occur for the right reasons
- Use real code in tests, not mocks unless unavoidable
- Keep tests focused on one behavior each
- Delete any code written before its test

## Red Flags — You've Abandoned TDD

- Rationalizing "just this once"
- Testing after implementation
- Test passes immediately without implementation
- Keeping code "as reference" while writing tests
- Writing multiple tests before any implementation
- "I'll add tests later"

## Test Quality

- Test **behavior**, not implementation
- One assertion per concept
- Tests should be readable as documentation
- Name tests: `should [expected behavior] when [condition]`
- No test interdependencies

## When to Apply

- Writing new features
- Fixing bugs (write failing test that reproduces bug first)
- Refactoring (ensure tests exist before changing code)
- Adding edge case handling
