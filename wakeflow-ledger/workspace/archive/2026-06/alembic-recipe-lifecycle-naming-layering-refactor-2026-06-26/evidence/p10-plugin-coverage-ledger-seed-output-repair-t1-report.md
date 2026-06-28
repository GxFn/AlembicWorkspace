# P10 Plugin Coverage Ledger Seed Output Repair Report

Date: 2026-06-28
Window: AlembicPlugin
Task: p10-plugin-coverage-ledger-seed-output-repair-t1
Commit: f7fe95e422eb155f04a38ff5602318be71ffef8a

## Summary

AlembicPlugin repaired the host `alembic_rescan` output projection so the existing
rescan coverage ledger seed summary survives into public clean MCP output as
`meta.coverageLedgerSeed` and into reviewable full briefing data as
`data.meta.coverageLedgerSeed`. The repair does not change frozen tool names,
`response.tool`/`toolName` values, provider config, release assets, versions, or
other repositories.

## Changed Files

- `lib/runtime/mcp/output-contract.ts`
  - Added a strict, bounded clean meta schema for `coverageLedgerSeed`.
- `lib/runtime/mcp/core-tools/output.ts`
  - Allows and sanitizes `coverageLedgerSeed` only for `alembic_rescan` clean
    meta projection.
  - Strips unknown and sensitive nested fields from the seed summary before
    schema validation.
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
  - Reuses the existing seed report and attaches the same public summary to both
    `response.meta.coverageLedgerSeed` and `response.data.meta.coverageLedgerSeed`.
- `test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Proves `meta.coverageLedgerSeed` survives clean output projection.
  - Proves forbidden nested fields such as `secretToken`, `rawCandidates`, and
    `sourceRefPaths` are not exposed.
- `test/unit/HostAgentSessionLease.test.ts`
  - Proves the real rescan workflow writes coverage seed evidence to both
    response meta and briefing data meta.

## Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/HostAgentSessionLease.test.ts`
  - Passed: 2 files, 19 tests.
- `npm run build:check`
  - Passed; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run lint:repo-boundary`
  - Passed; repository boundary check passed.
- `npx biome check lib/runtime/mcp/output-contract.ts lib/runtime/mcp/core-tools/output.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/HostAgentSessionLease.test.ts`
  - Passed after formatting `lib/runtime/mcp/core-tools/output.ts`.
- `git diff --check`
  - Passed.
- `npm run check`
  - Passed. Biome reported existing warning-level findings in unrelated files
    (`ClaudeCodeHostAdapter.ts` and scripts with console output), but the command
    exited 0 and all gates completed.

## Guard

Alembic Guard was invoked twice:

- scoped to all changed files;
- scoped only to `lib/runtime/mcp/core-tools/output.ts`.

Both attempts failed before producing a code-review conclusion with the same MCP
surface/schema error: `unrecognized_keys: data`. This is recorded as an
Alembic Guard tool-surface blocker, not as a product-code validation failure.

## Raw Evidence

- Clean output projection now retains:
  - `meta.coverageLedgerSeed.status`
  - `meta.coverageLedgerSeed.writtenCells`
  - `meta.coverageLedgerSeed.coveredPathCount`
  - `meta.coverageLedgerSeed.moduleCount`
  - `meta.coverageLedgerSeed.dimensionIds`
- Clean output projection omits nested producer/internal fields not declared by
  the clean schema.
- Rescan workflow attaches the same public seed summary to full briefing
  `data.meta.coverageLedgerSeed`, so transient full briefing evidence can be
  searched for the seed.

## Risks And Next Step

- Remaining P10 real-test parity still depends on the separate Alembic-side
  repair described by the controller review.
- Recommendation: retest P10 host incremental success only after this
  AlembicPlugin repair and the Alembic repair both land, then verify host
  `alembic_rescan` observes `planGate.status=ready`, stable tool name, visible
  `meta.coverageLedgerSeed`, and normalized host/in-process parity.
