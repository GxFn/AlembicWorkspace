# R1 Core Coverage Module Axis Canonical Target Report

## Scope

- Target window: AlembicCore
- Task id: r1-core-coverage-module-axis-canonical-t1
- Dispatch group: r1-core-coverage-module-axis-canonical-p1
- State root: .wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28

This target completed the Core producer step for R-1. It did not edit
AlembicPlugin, Alembic, vendor snapshots, release metadata, runtime host behavior,
R-2 schema behavior, or Test/REAL-TEST assets.

## Commit

- AlembicCore: cf5317efbef3f9e80cd3bd4c516272acdcf9923a
  - Message: Canonicalize coverage module axis ids
  - Changed files:
    - `src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts`
    - `test/unit/BuildCoverageLedger.test.ts`

## Implementation

- Added exported Core helper contract:
  - `CoverageLedgerCanonicalModuleIdInput`
  - `buildCanonicalCoverageLedgerModuleId`
  - `isTargetScopedCoverageModuleId`
- Extended `CoverageLedgerModuleSummary` with optional `projectRoot`.
- Applied the helper in `buildCoverageLedgerModuleAxisFromSummaries`, so
  ProjectMap-like module summaries with usable `moduleName` + `modulePath`
  canonicalize to exactly `target:{moduleName}:{modulePath}` even when callers
  pass a plain `module.id`.
- Preserved already target-scoped ids unchanged.
- Preserved explicit legacy fallback ids for modules without usable paths.
- Filtered aggregate/root module axes such as `module:root:*`, `root`, and
  project-root aggregate entries instead of writing them into target coverage
  axes.
- Preserved ownedFiles-first owned path behavior; fallback to `modulePath/path`
  remains only when no explicit owned paths exist.

The helper is exported through existing Core surfaces without adding package
export paths:

- `@alembic/core/host-agent-workflows`
- `@alembic/core/workflows/capabilities/host-agent`

## Dist Import Proof

After `npm run build`, the dist import probe returned:

```json
{
  "facadeHelper": "target:Auth:src/auth",
  "facadeTargetCheck": true,
  "hostHelperSame": true,
  "missingPathFallback": "legacy",
  "aggregateFiltered": null
}
```

## Validation

Passed:

- `npx vitest run test/unit/BuildCoverageLedger.test.ts test/CoverageLedgerWriteWorkflow.test.ts test/PublicHostAgentWorkflowEntrypoints.test.ts`
  - 3 files passed, 18 tests passed.
- `npm run build:check`
- `npm run lint`
- `npm run lint:public-api-boundary`
  - 61 package exports classified; stable=24, provisional=8, transitional=29;
    no-growth checks passed.
- `npm run build`
- `npm run test`
  - 145 files passed, 1422 tests passed.
- `npm run smoke:public-api`
  - Imported 54 exact public API entrypoints.
- `git diff --check`
- staged `git diff --cached --check`

`npm run check` was also attempted. It passed these gates before stopping:

- `npm run build:check`
- `npm run lint:public-api-boundary`
- `npm run lint:layer-contract`
- `npm run lint:consumer-core-imports`
- `npm run smoke:public-api`
- `npm run check:output-budgets`
- `npm run check:space-edges`
- `npm run lint:doctrine`

It stopped at the known R-8 naming-lint issue on pre-existing untouched files:

- `src/project-context-capabilities.ts`
- `src/recipe-context-capabilities.ts`
- `src/test-fixtures.ts`

One intermediate `npm run test` run failed because I ran it concurrently with
`npm run build`; the build command's `clean-dist` removed `dist/index.js` while
`EntrypointEffects.test.ts` was importing dist files. After the build completed,
the sequential `npm run test` passed as listed above.

## Guard And Tool Notes

- `alembic_status` reported this Core checkout has no usable local Alembic
  knowledge initialized and that the selected/active Alembic project is BiliDili,
  not AlembicCore.
- `alembic_code_guard` failed internally with `unrecognized_keys: data`.
  This is recorded as a guard tool-surface failure, not as a source-code
  validation failure.

## Downstream Guidance

- The next consumer package can replace AlembicPlugin private
  `normalizeTargetScopedCoverageModuleId` / `isTargetScopedCoverageModuleId`
  logic with the Core helper from `@alembic/core/host-agent-workflows`.
- The next R-1 consumer package should repin or otherwise consume this Core
  commit, then wire knowledge-rescan and dimension-completion coverage module
  axis construction to the shared helper.
- R-1 final acceptance still needs controller/Test follow-up: non-empty
  ProjectMap host-vs-in-process coverage parity with true set equality
  (`diff=[]`) plus BiliDili no-regression evidence.
