# Test Operation Policy

Status: long-term rule
Maintained By: Test
Receiving Window: Wakeflow

## Purpose

Test provides real-scenario evidence for work that cannot be safely proven by
the controller or product repository alone.

This policy rebuilds the useful operating rules from the legacy
`AlembicTest/` repository while using the current configured window name:
`Test`.

## When To Use Test

- Cold-start, rescan, clean rebuild, or other real runtime flows.
- Dashboard, jobs API, daemon log, or candidate-output monitoring.
- Smoke, reproduction, or regression checks against real configured projects.
- Cross-repository integration evidence that needs a realistic workspace.
- Codex Plugin / host MCP / local environment probe evidence, but only when a
  controller state root or user request explicitly assigns that route to Test.

Controller-verifiable script checks, targeted units, probes, runtime JSON, logs,
or minimal reproductions should stay with the controller or owning product repo.

## Configuration

Default test settings may live in `config/defaults.json` inside the Test
surface. One-off differences should be command arguments, not long-term config.
Do not write user absolute paths, secrets, tokens, or temporary ports into
tracked configuration.

Current defaults include:

- supported test targets such as `AlembicWorkspace` and `BiliDili`;
- AI config fallback source names, with secret presence reported only as a
  boolean;
- restart, preclean, status, and monitor timeouts;
- Codex MCP reload ownership notes.

## Script Ownership

Real-project test scripts belong in the Test repository or Test surface
`scripts/`. Wakeflow root scripts remain limited to governance, validation,
Design/Test intake, archive, status, and dispatch support.

`Test/scripts/` contains the rebuilt reusable scripts from the old
`AlembicTest/scripts/` capability. Use `Test/package.json` wrappers for
convenience, or call `node Test/scripts/<script>.mjs` directly from the
workspace root.

Plugin reload belongs to `AlembicPlugin`, not Test. Test may collect fresh MCP
evidence when assigned, but must not repair the current Codex host MCP session
by killing or reloading Plugin processes unless the active test card explicitly
authorizes that destructive path.

## Document Ownership

Long-term test plans, reproduction notes, monitoring records, and reports belong
in the Test surface. Cross-repository controller plans stay in the state root and
workspace ledger, linking to Test evidence. `test-exchange.md` is a human
projection only.

Legacy reports and raw evidence remain in workspace-relative
`AlembicTest/docs/` and `AlembicTest/tmp/`. They are historical evidence, not
live configuration.
See `docs/legacy-alembic-test-map.md`.

## Backfill Requirements

Test backfill must include:

- state root, task package, target task, and test card references;
- test target and entrypoint;
- configuration or key parameters;
- job/session id or UI URL summary;
- state changes and candidate counts;
- key log signals;
- failure/cancel/timeout/completed classification;
- whether real project business code changed;
- residual risks and recommended next step.

## Route Rules

- `BiliDili` is an open-source real test project. When the user, state root, or
  test card assigns a BiliDili cold-start / rescan / after-run route, use the
  bounded automatic test-mode route in `skills/alembic-real-routes/SKILL.md`.
- `AlembicWorkspace` and other protected targets default to manual trigger for
  external-provider context sending unless the test document explicitly
  authorizes automatic context sending.
- If the task only asks for environment readiness, verify daemon health,
  test-mode state, URL/data root, and compact jobs API; do not trigger
  cold-start or rescan.
- Dashboard or localhost UI evidence should be opened through the Codex in-app
  browser when UI state matters.
