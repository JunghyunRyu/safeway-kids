# Customization Guide

This document explains how to adapt the framework to a new project without breaking the platform core.

## 1. Core vs custom layers

### Keep stable
These files are part of the platform core and should remain small, predictable, and reusable:
- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/rules/`
- `docs/framework-reference.md`
- `scripts/doctor.sh`

### Customize freely
These are intended for project-specific behavior:
- `.claude/agents/`
- `.claude/skills/`
- `.mcp.json`
- `examples/`
- project-specific docs under `docs/`

## 2. Adding a new agent

### Where it goes
Create a new file under:
```text
.claude/agents/<agent-name>.md
```

### Start from
```text
.claude/agents/_template.md
```

### Recommended design rules
- one strong responsibility per agent
- stable output format
- explicit evidence standard
- use `permissionMode: plan` unless the agent truly needs write or command access

### Good agent use cases
- API contract reviewer
- migration planner
- release note summarizer
- documentation consistency checker

### Avoid
- giant “do everything” agents
- agents with fuzzy responsibility boundaries
- project-specific behavior hardcoded into a broadly named agent

## 3. Adding a new skill

### Where it goes
```text
.claude/skills/<skill-name>/SKILL.md
```

### Start from
```text
.claude/skills/_template/SKILL.md
```

### Decide invocation model
Use `disable-model-invocation: true` when:
- the workflow has side effects
- the timing should remain under human control
- the skill represents an explicit command like `/deploy`, `/bootstrap`, or `/release`

Leave it auto-invocable when:
- the skill is safe background guidance
- Claude should load it automatically when relevant

### Good skill use cases
- bootstrap
- test orchestration
- release note drafting
- schema migration checklist
- documentation lint summary

## 4. Adding new rules

### Where they go
```text
.claude/rules/<topic>.md
```

### Use rules for
- artifact naming/path rules
- file-type-specific writing standards
- safety boundaries
- verification requirements

### Do not use rules for
- long tutorials
- changing requirements
- transient project notes

Keep rules narrow and stable.

## 5. Adding new hooks

### Default principle
Use hooks for **deterministic lifecycle enforcement**, not fuzzy reasoning.

### Good hook use cases
- prevent stop when completion is claimed without evidence
- append environment exports at session start
- run a post-edit smoke script
- block dangerous tool use patterns

### Be careful with hooks when
- they are expensive
- they are highly platform-specific
- they can trap the user in a loop
- they require network access

## 6. Adding MCP servers

MCP is optional in this framework.

### Recommended approach
- keep `.mcp.json` minimal
- add providers only when they clearly improve workflow quality
- do not make the core experience depend on MCP availability

### Good MCP use cases
- ticket systems
- docs/search systems
- internal deployment dashboards
- optional external review providers

### Bad MCP use cases
- core startup dependency
- replacing deterministic scripts with provider calls
- hiding business-critical behavior behind an unavailable integration

## 7. Project-type patterns

### CLI tool
Focus on:
- clear command surface
- argument validation
- error handling
- smoke commands

### Web app
Focus on:
- routes and state
- component boundaries
- test surface
- runtime config
- E2E strategy

### Library or SDK
Focus on:
- API stability
- backward compatibility
- examples
- contract tests

## 8. Anti-patterns

Avoid these:
- giant `CLAUDE.md` files that try to be a full manual
- mixing project instance details into the platform core
- requiring external reviewers for basic operation
- skipping deterministic health checks
- treating review output as proof
- claiming completion without verification evidence

## 9. Promotion to plugin

When the framework is stable across multiple repositories:
- freeze the platform core
- move reusable pieces into a plugin
- keep project-specific examples in repo-local form
- version the plugin and publish release notes

See `docs/platform-roadmap.md`.
