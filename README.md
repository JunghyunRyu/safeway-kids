# Claude Code Platform

A high-quality **Claude Code plugin** for repeatable, evidence-first development workflows.

## Core principles

1. **Single runtime charter** — one short, authoritative operating contract via `CLAUDE.md`
2. **Deterministic guardrails** — settings, permissions, and hooks enforce critical behavior
3. **9-phase workflow** — Intake → Review → Consensus → Tech Spec → Todo Plan → Implementation → Verification → Milestone Closure → Session Handoff
4. **Evidence-first verification** — never claim completion without proof
5. **Install once, use everywhere** — plugin works across all your projects

---

## Installation

### From local path
```bash
claude --plugin-dir ./path/to/claude-forge
```

### From marketplace (when published)
```bash
/plugin install claude-forge
```

### Verify
Once installed, these skills become available:
```
/claude-forge:bootstrap
/claude-forge:review
/claude-forge:test
/claude-forge:gap-note
/claude-forge:milestone-report
/claude-forge:session-handoff
```

---

## What this plugin provides

### Skills (6)
| Skill | Description |
|-------|-------------|
| `bootstrap` | Run health check, summarize readiness, recommend next step |
| `review` | Orchestrate multi-review pass from requirements through consensus |
| `test` | Run structured verification with actual command outcomes |
| `gap-note` | Record spec-vs-reality divergence during implementation |
| `milestone-report` | Produce standardized milestone completion report |
| `session-handoff` | Generate precise handoff packet for next session |

### Agents (3)
| Agent | Description |
|-------|-------------|
| `requirement-analyst` | Transform requests into implementation-ready requirement packages |
| `tech-spec-reviewer` | Stress-test tech specs against requirements and codebase reality |
| `verification-auditor` | Audit claimed progress with evidence before milestone closure |

### Hooks
- **Stop hook** — prevents session exit when completion is claimed without evidence

### Settings
- Safe defaults: allows git status/diff, test commands; denies .env reads, curl, git push

---

## Quick start

```bash
# 1. Install the plugin
claude --plugin-dir ./claude-forge

# 2. In your project, run bootstrap
/claude-forge:bootstrap

# 3. Start with Phase 0 — Intake
```

---

## Plugin structure

```
claude-forge/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/                      # Plugin skills
│   ├── bootstrap/SKILL.md
│   ├── review/SKILL.md
│   ├── test/SKILL.md
│   ├── gap-note/SKILL.md
│   ├── milestone-report/SKILL.md
│   └── session-handoff/SKILL.md
├── agents/                      # Plugin agents
│   ├── requirement-analyst.md
│   ├── tech-spec-reviewer.md
│   └── verification-auditor.md
├── hooks/
│   └── hooks.json               # Plugin hooks
├── settings.json                # Plugin default settings
├── scripts/                     # Health check & evaluation scripts
├── docs/                        # Reference documentation
├── examples/                    # Example scenarios
├── evals/                       # Self-evaluation scaffolding
├── CLAUDE.md                    # Runtime charter
└── README.md
```

---

## Artifacts

All workflow artifacts are stored in your project's `artifacts/` directory with timestamped filenames:

| Artifact | Directory | Phase |
|----------|-----------|-------|
| Requirement Brief | `artifacts/specs/` | 0 |
| Consensus Matrix | `artifacts/reviews/` | 2 |
| Final Tech Spec | `artifacts/specs/` | 3 |
| Todo Plan | `artifacts/plans/` | 4 |
| Gap Note | `artifacts/gap-notes/` | 5+ |
| Verification Report | `artifacts/verification/` | 6 |
| Milestone Report | `artifacts/reports/` | 7 |
| Session Handoff | `artifacts/handoffs/` | 8 |

---

## Documentation

- [Framework Reference](docs/framework-reference.md) — detailed workflow and artifact schemas
- [Architecture](docs/architecture.md) — layer model and design rationale
- [Customization](docs/customization.md) — how to adapt without breaking core
- [Platform Roadmap](docs/platform-roadmap.md) — evolution path

---

## Troubleshooting

### `doctor.sh` shows blockers
Fix the reported missing files or settings first.

### Plugin skills not showing
Run `/reload-plugins` or restart Claude Code. Skills should appear as `/claude-forge:<skill-name>`.

### Claude sees built-in agents but not plugin agents
Verify the plugin is loaded with `claude --debug`. Check that agent `.md` files are in `agents/`.

### I need stronger enforcement
Add more permission rules to `settings.json`.
