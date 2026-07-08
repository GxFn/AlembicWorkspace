# AlembicCore p1-core-scope-guard-health-rollup-t1 Evidence

## Result

- Status: completed
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore`
- Branch: `main`
- Commit: `73cb9a340a4044eed68977d5ddbc36491deda674`
- Scope: AlembicCore only; no Alembic main endpoints, Dashboard, BiliDili, old Panorama engines, snapshot/rescan chain, branch, push, tag, or release changes.

## Changed Files

- `src/workflows/project-index/ProjectIndexPlan.ts`
- `src/workflows/surfaces/coverage/CoverageLedgerAdvisor.ts`
- `test/ProjectIndexWorkflowPlan.test.ts`
- `test/unit/CoverageLedgerAdvisor.test.ts`

## Implementation Notes

- Added a ProjectScope-aware full-index source folder guard. When a native ProjectScope/controlRoot is present, explicit `sourceFolders` are bounded to configured member folders or their subpaths. Rejected-only explicit folders fall back to the configured member set instead of scanning the controlRoot.
- Preserved the no-scope full-index plan shape with an exact plan assertion.
- Added `buildCoverageLedgerPanoramaRollup` on `CoverageLedgerAdvisor`.
- Rollup consumes `coverage_ledger` cells plus `DimensionRegistry` definitions and returns deterministic `dimensionCoverage`, `healthRadar`, and `gaps` data.
- Rollup marks `directModuleIdAligned: false`, accepts only optional roles already normalized to coverage-ledger module ids, and does not fabricate `recipeCount` from files or modules.
- Empty and thin coverage become `missing` / `weak` gaps; empty ledger and partial coverage boundaries are covered by tests.

## Validation

- `npx vitest run test/unit/CoverageLedgerAdvisor.test.ts test/ProjectIndexWorkflowPlan.test.ts`
  - Passed: 2 files, 17 tests.
- `npm run build:check`
  - Passed.
- `npm run lint`
  - Passed: Biome checked 715 files.
- `git diff --check`
  - Passed.
- `npm run build`
  - Passed.
- `npm run test`
  - Passed: 166 files, 1576 tests passed, 2 skipped.
- `npm run check`
  - Passed: build:check, public API boundary, layer contract, consumer imports, scope-resolution, public API smoke, output budgets, space edges, doctrine, naming, full tests, lint, retired-symbols.
- Alembic Guard `guard-public-mr9xwspc-3`
  - Passed: 4 explicit files checked, 0 violations.

Note: an earlier parallel validation attempt ran `npm run test` while `npm run build` was cleaning `dist/`, causing `EntrypointEffects.test.ts` to fail with `ERR_MODULE_NOT_FOUND` for `dist/index.js`. That run was invalidated; the later standalone `npm run test` and full `npm run check` both passed.

## Residual Risks / Next

- P2 Alembic main still needs to consume this Core rollup for `/panorama`, `/health`, and `/gaps`; this task intentionally did not wire endpoints.
- The optional `moduleRoles` input expects callers to normalize any ProjectMap/module-role data to coverage-ledger module ids first, preserving the accepted P0 CG-E non-direct-alignment constraint.
