---
description: Orchestrate a multi-review pass from requirements through consensus. Use when you want a structured analysis cycle before implementation.
disable-model-invocation: true
argument-hint: [artifact-or-topic]
---

Run a structured review flow for: `$ARGUMENTS`

## What to do
1. Locate the relevant Requirement Brief or draft spec.
2. If no Requirement Brief exists, produce one first using the repository workflow.
3. Run independent review using any available mechanisms:
   - project agents where appropriate
   - MCP reviewer tools if configured
4. Collect outputs in a comparable structure:
   - requirement restatement
   - missing requirements
   - conflicts
   - technical risks
   - alternative designs
   - testing concerns
   - confidence
5. Produce a Consensus Matrix.
6. Recommend whether to:
   - move to Final Tech Spec
   - revise the request
   - gather missing repository context

## Output format
# Review Orchestration Report

## 1. Input reviewed
## 2. Reviewers used
## 3. Independent findings
## 4. Consensus Matrix
## 5. Recommendation
## 6. Next artifact to create

## Rules
- Never fabricate unavailable reviewers.
- State exactly which reviewers were actually used.
- Separate repository facts from reviewer opinions.
