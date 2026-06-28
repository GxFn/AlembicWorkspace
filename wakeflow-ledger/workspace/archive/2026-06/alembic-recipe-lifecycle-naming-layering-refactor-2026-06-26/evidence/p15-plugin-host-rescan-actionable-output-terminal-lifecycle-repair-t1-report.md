# p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1 Report

## Scope

- Window: AlembicPlugin
- Task: p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-t1
- Dispatch group: p15-plugin-host-rescan-actionable-output-terminal-lifecycle-repair-p1
- Repository commit: AlembicPlugin `2c03793562995c88fcf74b7e12ce48073e287453`

## Change

AlembicPlugin now exposes an explicit `hostAgentLifecycle` business field on actionable deepMining `alembic_rescan` output when host-agent Recipe evidence is still required.

- `hostAgentLifecycle.state` is `action-required`.
- `actionRequired` is `true`.
- `terminal` is `false`.
- `terminalGate.pass` is `false` with reason `host-agent-action-required`.
- Coverage values preserve the observed state, including `measuredCells=0` and `shouldStop=false`.
- Productive host-agent sessions and `host-agent-rescan` rounds stay open for session-bound `submit_knowledge` / `dimension_complete` follow-up.
- Existing terminal no-work cleanup remains limited to terminal/no-actionable rescan work.
- The MCP clean-output allowlist now permits `hostAgentLifecycle` for `alembic_rescan`.

Changed files:

- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/runtime/mcp/core-tools/output.ts`
- `test/unit/HostAgentSessionLease.test.ts`
- `test/unit/McpCoreToolsCleanOutputContract.test.ts`

## Validation

Passed:

- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
- `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/RescanCoverageModuleAxis.test.ts` — 3 files, 27 tests passed.
- `npx biome check lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts lib/runtime/mcp/core-tools/output.ts test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
- `npm run build:check`
- `npm run build` — Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
- `npm run lint:repo-boundary`
- `npm run lint:core-import-boundary` — scanned 441 files and 445 `@alembic/core` imports.
- `npm run lint:layer-boundary`
- `git diff --check`
- `git diff --cached --check`
- Marker check confirmed `hostAgentLifecycle` / `host-agent-action-required` in source, tests, and built `dist` output.

Alembic plugin-tooling status:

- `alembic_work` failed with MCP internal schema error `unrecognized key "data"`.
- `alembic_code_guard` failed with MCP internal schema error `unrecognized key "data"`.
- These are recorded as Guard/tool-surface risks; repository tests, build, boundary lints, and diff checks passed.

## Boundaries

- No BiliDili DB, session, or round state was edited by this window.
- No BiliDili REAL-TEST was run by this window.
- No Core repository, Test repository, Wakeflow state-machine reducer, public `status=ready` semantics, or release/push path was changed.
- The repair does not invent Recipe ids, submit knowledge, mark blank coverage rows measured, or treat seed/diff parity as final P15 success.

## Rerun Guidance

Test can rerun the P15 BiliDili scenario against AlembicPlugin commit `2c03793562995c88fcf74b7e12ce48073e287453`.

Expected repair signal: when the host rescan still needs external session-bound Recipe evidence, clean output should surface `hostAgentLifecycle.actionRequired=true` and `hostAgentLifecycle.terminal=false` while keeping the productive session and open rescan round. P15 should still require real session-bound Recipe evidence and terminal cleanup before final acceptance.
