---
name: dispatching-parallel-agents
description: Dispatch independent tasks to parallel subagents. Use when multiple unrelated failures or tasks can be investigated concurrently.
version: 1.0.0
source: obra/superpowers
license: MIT
---

# Dispatching Parallel Agents

## Core Principle

Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use

- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem can be understood without context from others
- No shared state between investigations

## When NOT to Use

- Failures are related (fix one might fix others)
- Need to understand full system state first
- Agents would interfere with each other (editing same files)
- Exploratory debugging where you don't know what's broken

## The Pattern

### 1. Identify Independent Domains

Group failures by what's broken:
- File A tests: Authentication flow
- File B tests: Data validation
- File C tests: API integration

Each domain is independent — fixing auth doesn't affect validation.

### 2. Create Focused Agent Tasks

Each agent gets:
- **Specific scope**: One test file or subsystem
- **Clear goal**: Make these tests pass
- **Constraints**: Don't change other code
- **Expected output**: Summary of findings and fixes

### 3. Agent Prompt Structure

Good agent prompts are:
1. **Focused** — One clear problem domain
2. **Self-contained** — All context needed to understand the problem
3. **Specific about output** — What should the agent return?

Example:
```
Fix the 3 failing tests in src/modules/auth.test.ts:

1. "should validate token expiry" - expects 401 but gets 200
2. "should refresh expired token" - timeout after 5s
3. "should reject malformed JWT" - passes but shouldn't

Your task:
1. Read the test file and understand what each test verifies
2. Identify root cause
3. Fix the implementation or test expectations
4. Do NOT change other module code

Return: Summary of root cause and changes made.
```

### 4. Review and Integrate

When agents return:
1. Read each summary
2. Verify fixes don't conflict
3. Run full test suite
4. Spot-check agent changes

## Common Mistakes

| Bad | Good |
|-----|------|
| "Fix all the tests" | "Fix auth.test.ts" |
| No error context | Paste error messages |
| No constraints | "Do NOT change production code" |
| "Fix it" | "Return summary of root cause" |

## Key Benefits

1. **Parallelization** — Multiple investigations simultaneously
2. **Focus** — Each agent has narrow scope
3. **Independence** — Agents don't interfere
4. **Speed** — N problems solved in time of 1
