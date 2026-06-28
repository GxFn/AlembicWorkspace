# r4-plugin-coverage-ledger-seed-projection-consistency-t1 Report

## Summary

Completed the AlembicPlugin R-4 target with a focused regression that proves host-route
`coverageLedgerSeed` projection matches persisted SQLite `coverage_ledger` rows after the
seed is written. The production reconciliation path in
`lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts` already projects clean
persisted state as `status: "written"` and keeps aggregate/root persisted rows as
`status: "inconsistent"`. The gap for R-4 was missing source-level proof against raw
SQLite rows rather than only fake repository state or downgraded route count mismatch
semantics.

## Changed Files

- `test/unit/HostAgentSessionLease.test.ts`
  - Added `projects coverage ledger seed counts from SQLite rows after writing the seed`.
  - The test uses the real Core `coverageLedgerRepository`, runs host deepMining rescan,
    reads raw SQLite `coverage_ledger` rows directly through `runtime.sqlite`, and compares
    `writtenCells`, `measuredCells`, `targetScopedCells`, `usableCells`, `moduleCount`, and
    `aggregateOrRootModuleIds` against all route-visible seed surfaces:
    `response.meta.coverageLedgerSeed`, `response.data.coverageLedgerSeed`, and
    `response.data.meta.coverageLedgerSeed`.
  - The test asserts a clean persisted seed stays `status: "written"` with no `reason`, at
    least one measured target-scoped row, and zero aggregate/root module ids.

## Commit

- AlembicPlugin commit: `f68478145670b408fa29f1a2c97e3edcaeb88bdd`
- Commit message: `Verify coverage seed SQLite projection`
- Local branch state after commit: `main...origin/main [ahead 3]`
- No push, release, version bump, vendor snapshot, marketplace asset, freeze literal, or Core
  source change was performed.

## Validation

- PASS: `npx vitest run test/unit/HostAgentSessionLease.test.ts`
  - 18 tests passed.
- PASS: `npx biome check test/unit/HostAgentSessionLease.test.ts`
- PASS: `npx vitest run test/unit/HostAgentSessionLease.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/BriefingBudget.test.ts`
  - 3 files, 35 tests passed.
- PASS: `npx tsc --noEmit`
- PASS with existing warnings only: `npm run lint`
  - Existing warnings include `${CLAUDE_PLUGIN_ROOT}` literal and console use in scripts; exit code 0.
- PASS: `npm run lint:repo-boundary`
- PASS: `npm run lint:core-import-boundary`
  - Scanned 442 files and 445 `@alembic/core` imports.
- PASS: `npm run lint:layer-boundary`
- PASS: `npm run build:check`
  - Core build used `../AlembicCore @ 92924503920c476d296b28aeb5482ac281f06b28`.
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Guard

- BLOCKED installed tool surface: `alembic_code_guard` failed before source review with
  `CODEX_MCP_ERROR / unrecognized key "data"`, matching the known installed MCP output
  schema drift. No source-code guard finding was produced.

## Boundaries

- Changed only AlembicPlugin unit test coverage.
- Did not modify runtime behavior, Core source, vendor snapshot, release metadata,
  marketplace assets, real BiliDili data, frozen literals, tool names, or R-2 cleanup
  semantics.
- Did not relax coverage seed status semantics: clean persisted SQLite projection remains
  `written`; persisted aggregate/root cells remain covered by the existing `inconsistent`
  regression test.

## Residual Risks

- This target proves the host-route projection/count contract at source-test level. Final
  end-to-end confidence still depends on controller/Test review of real BiliDili runs for
  the broader residual follow-up.
- The installed Alembic MCP runtime still needs the R-2 public schema fix loaded before
  `alembic_code_guard` can provide source guard output.
