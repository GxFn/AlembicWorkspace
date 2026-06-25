# Final Runtime Acceptance Archive - Compatibility Removal Cleanup

Date: 2026-06-10

Demand: `alembic-compatibility-removal-cleanup-cr7-runtime-acceptance-archive-2026-06-10`

Controller state root:
`.wakeflow-active/current/alembic-compatibility-removal-cleanup-cr7-runtime-acceptance-archive`

## Final Result

CR7 runtime acceptance passed. The compatibility-removal cleanup sequence has
real runtime, MCP, Dashboard, Agent, consumer replay, import-scan, and Wakeflow
verification evidence.

This archive does not create D33+ follow-up demand scope. It records the final
state of the confirmed compatibility-removal cleanup sequence.

## Evidence Summary

- Alembic build passed.
- Alembic multi-project runtime smoke passed.
- Alembic decision-register route probe passed.
- AlembicPlugin build passed.
- AlembicPlugin packaged smoke passed, including `npxRuntime: passed`.
- AlembicPlugin clean-output probes passed for core tools, Codex-local tools,
  final legacy cleanup, error taxonomy, agent public tools, and consumer
  fixture replay.
- Live MCP calls passed for `alembic_health`, `alembic_search`,
  `alembic_code_guard`, and diagnostic `alembic_codex_status`.
- AlembicDashboard contract test passed, 29 subtests.
- AlembicAgent contract/runtime test subset passed, 4 files / 32 tests.
- `git diff --check` passed in root and all five product repositories.
- Product repositories remained clean after CR7 validation.

State-root evidence:
`.wakeflow-active/current/alembic-compatibility-removal-cleanup-cr7-runtime-acceptance-archive/evidence/controller-acceptance-cr7-runtime-archive-2026-06-10.md`

Machine-readable evidence:
`.wakeflow-active/current/alembic-compatibility-removal-cleanup-cr7-runtime-acceptance-archive/evidence/controller-acceptance-cr7-runtime-archive-2026-06-10.json`

## Deleted From Public Or Ordinary Surfaces

- `alembic_task` active public tool exposure.
- Legacy ordinary MCP envelope fields in clean output.
- Ordinary-output diagnostic/private leakage such as provider private traces,
  internal telemetry, secret tokens, raw provider payloads, resident internals,
  and compatibility metadata.
- Dashboard raw provider payload guessing and legacy field fallback behavior.

## Private-Only Retained Paths

- AlembicCore `fileMonitor.compatibilityAliases` remains in the private runtime
  contract/capability spine and tests with a documented cleanup trigger.
- AlembicPlugin retired `alembic_task` direct-call guard remains to fail closed
  and route callers to replacement public tools.
- AlembicPlugin forbidden-field and forbidden-word constants remain as
  projector policy and negative-test data.
- AlembicAgent hidden-provider-field lists remain as sanitization policy.

## Blockers

No CR7 blocker remains.

The diagnostic `alembic_codex_status` call observed local daemon/dashboard
services stopped in the selected runtime. This is not a CR7 failure: the
packaged Plugin smoke, stdio MCP route, npx runtime route, Dashboard executable
contract tests, and clean-output probes passed.

## Out Of Scope

- Creating D33+ demands.
- Product feature reduction.
- Release publishing or remote CI.
- Deleting private fail-closed guards without a separate owner-approved release
  cleanup decision.
