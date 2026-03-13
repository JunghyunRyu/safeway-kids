# Evaluation scaffolding

This directory holds scenario prompts and expected result notes for framework self-evaluation.

## Goals
- validate startup behavior
- validate bootstrap behavior
- validate example workflow behavior
- detect drift between docs and actual repository structure

## Typical evaluation modes
- deterministic: `scripts/doctor.sh`
- hybrid: `scripts/eval-smoke.sh`
- manual or CI-driven scenario prompts under `evals/scenarios/`
