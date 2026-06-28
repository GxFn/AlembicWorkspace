# P6 Full Reset Coverage Ledger Cleanup Repair

Task: `p6-full-reset-coverage-ledger-cleanup-repair-t1`
Dispatch group: `p6-full-reset-coverage-ledger-cleanup-repair-p1`
Window: Alembic
Result: completed

## Summary

Alembic `CleanupService.fullReset()` now clears the Core deepMining measured-state tables `coverage_ledger` and `deep_mining_rounds`, so a documented bootstrap rebuild cannot leave old round state for `CoverageLedgerAdvisor` to read before P6 opens a fresh round.

The same schema scan found additional post-initial data/cache tables created by Core/Alembic migrations that were missing from the full-reset "all data tables" contract. The repair keeps the change in the existing fullReset table-list seam and adds those omitted tables there. `rescanClean()` and `forceRescanClean()` are unchanged.

## Commit

- Alembic commit: `9d703a3` (`fix: clear coverage ledger on full reset`)
- Changed files:
  - `lib/service/cleanup/CleanupService.ts`
  - `test/unit/CleanupService.test.ts`

## Implementation Notes

- Added `coverage_ledger` and `deep_mining_rounds` to `ALL_DATA_TABLES`.
- Added other omitted full-reset data/cache tables from the current schema scan: `recipe_warnings`, `token_usage`, `source_graph_edges`, `source_graph_symbols`, `source_graph_files`, `source_graph_generations`, `git_diff_checkpoints`, and `project_context_file_snapshots`.
- Added `recipe_warnings`, `coverage_ledger`, and `deep_mining_rounds` to the trash DB snapshot export list.
- Kept frozen schema names unchanged.
- Did not touch cold-start measured-coverage behavior or R-2 `cleanup.projectRoot` logic.

## Validation

- `npx vitest run test/unit/CleanupService.test.ts`: passed, 3 tests.
- `npm run build:check`: passed.
- `npm run lint:repo-boundary`: passed, `@escape-hatch` 1/75.
- `npm run lint`: exit 0 with 5 pre-existing `noExplicitAny` warnings outside changed files.
- `npm run build`: passed.
- `git diff --check`: passed.
- `git diff --check HEAD~1 HEAD`: passed.
- Schema scan evidence: `rg -o "CREATE TABLE IF NOT EXISTS [a-z_]+" vendor/AlembicCore/src/infrastructure/database/migrations lib/infrastructure/database/SqliteDatabaseAccess.ts | awk '{print $NF}' | sort -u` listed the newly covered tables.

## Guard Note

`alembic_code_guard` was attempted for the two changed files and failed with the Alembic MCP internal schema error `unrecognized key "data"`. This is recorded as tool failure, not a code finding.

## Next Test Recommendation

Controller should rerun the P6 BiliDili real-test package against Alembic commit `9d703a3`. The specific question is whether documented bootstrap reset now clears stale `coverage_ledger` / `deep_mining_rounds`, allowing the following deepMining run to open/close a fresh round and satisfy the G4/P6 gate.

## Residual Risks

- This target did not run the real BiliDili scenario; that remains the next Test responsibility.
- The repair is limited to fullReset cleanup semantics and does not change advisor thresholds, coldStart coverage writing, or deepMining round-loop behavior.
