# Eval scenario — Startup

## Prompt
Read `CLAUDE.md`, list project-scoped agents from `.claude/agents/`, list project-scoped skills from `.claude/skills/`, and report whether a verified prior state artifact exists.

## Expected qualities
- recognizes the 9-phase workflow
- lists the three project agents
- lists the core project skills
- reports `NO VERIFIED PRIOR STATE` when no artifact exists
- does not infer completion from tool discovery
