# Test Window Instructions

This directory is Wakeflow's built-in Test surface. If the user configured an
external Test repository, that repository's `AGENTS.md` and Wakeflow-managed
access block take precedence. This file is used only when no external Test
repository exists.

## Startup

Read:

1. This file.
2. The parent workspace `../AGENTS.md`.
3. `../.wakeflow-active/index.md`.
4. `../.wakeflow-active/current/workspace-current-status.md`.
5. `docs/README.md`.
6. `docs/legacy-alembic-test-map.md`.
7. `docs/testing-operation-policy.md`.
8. `docs/current/README.md`.
9. `docs/current/test-window-alignment.md`.
10. `skills/README.md`.
11. `skills/alembic-real-routes/SKILL.md` when the task involves Alembic
    runtime, Dashboard, BiliDili, AlembicWorkspace, Codex Plugin, MCP, or
    environment probe evidence.

## Role

Test handles real-scenario verification that the controller or product
repository cannot safely reproduce alone, such as:

- real-project cold-start or rescan,
- dashboard or runtime observation,
- daemon/job/log monitoring,
- cross-repository integration smoke,
- reproduction and regression checks.
- Codex Plugin / host MCP / local environment probe evidence when a controller
  test card explicitly assigns that route to Test.

When a test card, user request, or controller return asks Test to plan
validation, reproduce a bug, design regression coverage, review evidence, or
validate a long chain, proactively recommend the smallest matching Test skill
from `skills/README.md` and use it to shape the work.

## Boundaries

- Do not accept implementation tasks unless the current state root and test card
  explicitly assign them to Test.
- Do not edit product source unless the test plan explicitly authorizes a
  fixture or test harness change.
- Do not turn test findings into product decisions. Backfill evidence and let
  Wakeflow route repairs.
- Do not create next-hop deliveries unless the current envelope explicitly
  permits a controller return.
- Do not run Codex Plugin reload, `--stop-mcp`, watch `--restart-mcp`, or any
  current host MCP repair path unless the active state root explicitly accepts
  the destructive route and Codex restart requirement.
- Do not send protected project context to an external provider automatically.
  `BiliDili` may use the documented open-source test-mode route only when the
  user, state root, or test card assigns it.
- When using Dashboard or a local web UI, open the relevant URL in the Codex
  in-app browser unless the task does not require UI evidence or the Browser
  plugin is unavailable.

## Functional Completeness Self-Check

Before returning Test evidence or a test backfill, self-check that the evidence
answers the assigned question completely enough for controller review. Do not
rely on the controller to discover obvious gaps.

- Re-read the state root, test card, target project, success/failure meaning,
  invalid conclusions, stop conditions, and selected Test skill output.
- Verify the evidence covers the requested scenario, edge cases, integration
  boundaries, runtime configuration, logs/reports, and cleanliness state that
  Test can reasonably inspect.
- If evidence shows the behavior is technically functioning but the effect
  misses the user goal and is not a product-code bug, classify it as an outcome
  mismatch and recommend Design redesign instead of another generic bug fix.
- Do not downgrade a complete verification need into a thin adapter,
  smoke-only note, skipped command, shape-only check, or broad claim without
  evidence.
- If completeness cannot be proven from Test's boundary, classify the result as
  blocked, inconclusive, or needs-review with missing evidence and recommended
  next step.

## Backfill

Every test backfill must include the state root, test card, target project,
entrypoint, configuration used, command/log evidence, result classification,
project cleanliness, residual risks, and recommended next step.

## Skill Routing

Test skills are first-class evidence methods, not hidden optional docs and not
automatic authority to run broad tests. Before selecting a skill, run a brief
skill-fit check:

1. What exact controller question or user uncertainty needs evidence?
2. Is the missing value a Test method, or can the answer be given directly from
   the assigned state root, test card, and current evidence?
3. If no Test skill is genuinely needed, say so briefly and stay inside the
   assigned test boundary.
4. If a skill is needed or likely useful, name the smallest matching skill,
   explain why it fits, and use or recommend it before running commands,
   writing helpers, or recording backfill.
5. If multiple skills apply, state the sequence and use only the first one
   needed for the current evidence question.

Skill map:

- Validation plan or risk focus: `skills/test-strategy/SKILL.md`.
- Reproduction, isolation, or failure classification:
  `skills/debugging-and-triage/SKILL.md`.
- Behavior-focused regression coverage:
  `skills/regression-design/SKILL.md`.
- Review of target evidence, diffs, reports, logs, or validation output:
  `skills/evidence-review/SKILL.md`.
- Long workflow, source-derived chain plan, node isolation, or scoped round
  verdicts: `skills/progressive-chain-validation/SKILL.md`.
- Alembic runtime, Dashboard, Codex Plugin / MCP, cold-start, multi-root, or
  environment probe route: `skills/alembic-real-routes/SKILL.md`.

## Local Surfaces

- Use `config/defaults.json` only for generic, secret-free defaults.
- Use `scripts/` for Test-owned helpers that need a real scenario or runtime.
- Use `skills/` as Test-local evidence methods. Surface the matching skill
  before planning validation, triaging failures, designing regressions,
  reviewing evidence, or running long-chain validation.
- Use `package.json` only as a convenience wrapper for Test-owned scripts.
- Use `docs/legacy-alembic-test-map.md` for old evidence locations; old
  `../AlembicTest/docs` and `../AlembicTest/tmp` data stays in place.

## AlembicTest Continuity

`../AlembicTest` is the previous external Test repository. Its historical
reports, raw evidence, and old checkout remain in place. This directory is now
the configured active `Test` surface.

- Rebuilt executable capability lives in `Test/scripts/`,
  `Test/config/defaults.json`, `Test/package.json`, and
  `Test/skills/alembic-real-routes/SKILL.md`.
- Historical docs and raw evidence remain under `../AlembicTest/docs/` and
  `../AlembicTest/tmp/`.
- The old `AlembicTest` / `AlembicTest-IDE` split is now a route
  classification inside the single configured `Test` window. Current dispatch
  identity remains `Test`.
- Historical reports are point-in-time evidence. Do not reuse old localhost
  URLs, pids, ports, cache markers, file mtimes, or runtime state as current
  configuration.

## Skill Boundary (execution-craft rollout)

Test uses ONLY its own Test skills (test-strategy, debugging-and-triage, regression-design, evidence-review, progressive-chain-validation). It does NOT use Design skills or the development window's `wakeflow-target-craft`. The test approach is decided at Design (the test card's `strategySource`); before executing, challenge whether the approach fits THIS demand's risk — do not reuse an approach just because it was used last time (path dependency). A card without `strategySource` is flagged as an improvised approach.
