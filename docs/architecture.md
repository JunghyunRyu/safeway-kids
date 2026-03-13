# Platform Architecture

This repository is structured as a **Claude Code operating platform** with clear layers.

## 1. Design goal
Create an environment where:
- Claude starts with the right context
- key boundaries are enforced deterministically
- repeatable workflows are easy to invoke
- examples and evaluation reduce onboarding friction
- the framework can later be promoted to a shareable plugin

## 2. Layer model

### A. Runtime charter layer
**Files:** `CLAUDE.md`

This is the highest-level runtime instruction surface. It should be:
- short
- authoritative
- stable
- focused on behavior, precedence, and required artifacts

### B. Scoped rule layer
**Files:** `.claude/rules/*.md`

Use this layer for narrow and reusable rules such as:
- artifact paths
- verification requirements
- safety boundaries

### C. Deterministic control layer
**Files:** `.claude/settings.json`, `scripts/*.sh`

This layer is where the framework becomes a platform rather than just a prompt pack.
It includes:
- permission rules
- hooks
- health checks
- smoke evaluation

### D. Workflow execution layer
**Files:** `.claude/agents/`, `.claude/skills/`

This is where the framework defines reusable operational behaviors:
- analysis agents
- review agents
- verification agents
- manual skills like `/bootstrap`, `/review`, `/test`

### E. Human reference layer
**Files:** `docs/*.md`

These docs are for maintainers and contributors, not the runtime model.

### F. Example layer
**Files:** `examples/`

Examples exist to shorten time-to-first-success and show how the platform adapts to different project shapes.

### G. Evaluation layer
**Files:** `evals/`, `scripts/eval-smoke.sh`

This layer helps the platform verify itself over time.

## 3. Why this split works

### Clear authority boundaries
- runtime instructions live in `CLAUDE.md`
- narrow rules live in `.claude/rules/`
- deterministic enforcement lives in settings and scripts
- long explanations live in `docs/`

### Better onboarding
A new user can:
1. run `doctor.sh`
2. start Claude
3. invoke `/bootstrap`
4. follow one example

### Better reuse
Project-specific detail stays in examples or custom agents, while the platform core stays generic.

## 4. Control plane vs execution plane

### Control plane
The control plane decides what “good” looks like:
- permissions
- hooks
- artifact conventions
- safety and verification rules
- health checks

### Execution plane
The execution plane performs work:
- main Claude session
- subagents
- skills
- optional MCP integrations

## 5. Optional provider model
External providers belong at the edge of the architecture:
- optional reviewers
- ticket/document systems
- environment dashboards
- domain-specific integrations

The core platform must still work without them.

## 6. Future plugin architecture
When promoted to a plugin, the natural split is:

- **core plugin**
  - charter helpers
  - rules
  - bootstrap
  - doctor/eval wrappers
  - report and handoff skills

- **provider packs**
  - review-provider pack
  - QA pack
  - commerce pack
  - internal-integrations pack

That keeps the platform modular and easier to version.
