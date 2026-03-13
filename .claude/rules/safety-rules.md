# Safety and operating rules

## State handling
1. Never infer prior state without a verified artifact.
2. If no verified artifact exists, report `NO VERIFIED PRIOR STATE`.
3. Tool discovery is not proof of completed work.

## Secret hygiene
1. Do not read `.env`, `.env.*`, `secrets/**`, or credential files unless the user explicitly authorizes it and project policy allows it.
2. Prefer deterministic scripts for environment checks instead of inspecting secret values.

## Spec discipline
1. Do not implement before a Final Tech Spec exists, except for read-only exploration.
2. When code and spec conflict, create a Gap Note before proceeding.
3. Keep assumptions separate from facts.

## Reporting discipline
1. Never hide failing tests.
2. Never claim a review happened when a reviewer was unavailable.
3. Never label something complete without evidence.
4. Keep human operators in the loop on blockers, risks, and missing integrations.
