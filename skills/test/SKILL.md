---
description: Run structured verification, capture actual command outcomes, and summarize what is verified versus unverified.
disable-model-invocation: true
argument-hint: [scope-or-command]
allowed-tools: Read, Glob, Grep, Bash
---

Run structured verification for: `$ARGUMENTS`

## What to do
1. Identify the narrowest relevant verification command.
2. Prefer repository-native commands over invented checks.
3. Run the command(s).
4. Record:
   - command
   - purpose
   - expected result
   - actual result
   - pass/fail
5. If a command fails, inspect the failure output.
6. Do not silently retry many times.
7. Summarize what is VERIFIED, PARTIALLY VERIFIED, UNVERIFIED, or FAILED.
8. Recommend whether the current work is ready for `verification-auditor`.

## Output format
# Structured Test Report

## 1. Scope
## 2. Commands run
## 3. Results
## 4. Verified status
## 5. Failures / skips
## 6. Residual risk
## 7. Recommendation
