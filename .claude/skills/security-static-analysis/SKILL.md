---
name: security-static-analysis
description: Security-focused static analysis using Semgrep. Use for code auditing, vulnerability scanning, and security review.
version: 1.0.0
source: trailofbits/skills
license: CC-BY-SA-4.0
---

# Security Static Analysis

## Overview

Run Semgrep-based static analysis scans to find security vulnerabilities. Covers Python (FastAPI/SQLAlchemy), TypeScript/JavaScript (React/React Native), and infrastructure code.

## Prerequisites

- Semgrep installed: `pip install semgrep` or `brew install semgrep`
- Check for Semgrep Pro: `semgrep --version` (Pro enables cross-file taint tracking)

## Critical Rules

1. **Always disable telemetry**: `--metrics=off` (Semgrep sends telemetry by default)
2. **User approval gate**: Present scan plan and wait for explicit approval before scanning
3. **Include third-party rulesets**: Trail of Bits, 0xdea, and Decurity rules detect vulnerabilities absent from official registry
4. **Parallel execution**: Spawn scan tasks simultaneously for performance

## Workflow

### Step 1: Detect Languages
```bash
# Identify languages in the project
find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" | head -20
```

### Step 2: Select Rulesets

For this project (Python + TypeScript):

**Python/FastAPI:**
```bash
semgrep --config p/python --config p/owasp-top-ten --config p/flask --metrics=off
```

**TypeScript/React:**
```bash
semgrep --config p/javascript --config p/react --config p/typescript --metrics=off
```

**Security-focused:**
```bash
semgrep --config p/security-audit --config p/secrets --metrics=off
```

### Step 3: Present Plan & Get Approval

Before scanning, present:
- Target directories
- Rulesets to use
- Scan engine (OSS or Pro)
- Expected output format

### Step 4: Run Scans in Parallel

```bash
# Backend scan
semgrep --config p/python --config p/owasp-top-ten --config p/security-audit \
  --metrics=off --sarif -o backend-scan.sarif backend/

# Frontend scan
semgrep --config p/javascript --config p/react --config p/typescript \
  --metrics=off --sarif -o frontend-scan.sarif web/ mobile/ site/
```

### Step 5: Review Results

- Merge SARIF outputs
- Categorize by severity (CRITICAL > HIGH > MEDIUM > LOW)
- Prioritize: injection, auth bypass, data exposure
- Verify findings are real (not false positives)

## Key Vulnerability Categories

| Category | Examples |
|----------|---------|
| Injection | SQL injection, command injection, XSS |
| Auth/AuthZ | Missing auth checks, broken access control |
| Data Exposure | Hardcoded secrets, PII logging, insecure storage |
| Configuration | Insecure defaults, debug mode in prod |
| Dependencies | Known CVEs in packages |
| Cryptography | Weak algorithms, predictable randomness |

## Project-Specific Focus Areas

For safeway_kids (children's safety platform):
- **PII protection**: Check for child data exposure in logs, API responses
- **Authentication**: Firebase auth bypass, token validation
- **API security**: Rate limiting, input validation, CORS
- **Database**: SQL injection via SQLAlchemy raw queries
- **Mobile**: Expo secure store usage, API key exposure
- **WebSocket**: Auth on WS connections, data validation

## Anti-Patterns to Avoid

- Do NOT use `--config auto` (sends telemetry)
- Do NOT skip third-party rulesets
- Do NOT scan without user approval
- Do NOT ignore findings without documenting why
- Do NOT assume initial request equals scan approval
