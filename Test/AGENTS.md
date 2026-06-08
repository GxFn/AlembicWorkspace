# Test Window Instructions

This directory is Wakeflow's built-in Test surface. If the user configured an
external Test repository, that repository's `AGENTS.md` and Wakeflow-managed
access block take precedence. This file is used only when no external Test
repository exists.

## Startup

Read:

1. This file.
2. The parent workspace `../AGENTS.md`.
3. `../.workspace-active/workspace/index.md`.
4. `../.workspace-active/workspace/current/workspace-current-status.md`.
5. `docs/README.md`.
6. `docs/legacy-alembic-test-map.md`.
7. `docs/testing-operation-policy.md`.
8. `docs/current/README.md`.
9. `docs/current/test-window-alignment.md`.
10. `skills/alembic-real-routes/SKILL.md` when the task involves Alembic
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

## Backfill

Every test backfill must include the state root, test card, target project,
entrypoint, configuration used, command/log evidence, result classification,
project cleanliness, residual risks, and recommended next step.

## Local Surfaces

- Use `config/defaults.json` only for generic, secret-free defaults.
- Use `scripts/` for Test-owned helpers that need a real scenario or runtime.
- Use `skills/` only for repeated Test-local validation instructions that do
  not belong in the installed Wakeflow skills or product repositories.
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
