# P10 Alembic Daemon Rescan Coverage Seed Output Repair - Target Result

Generated: 2026-06-28T18:16:00+08:00

## Verdict

Completed in Alembic main source.

Commit: `ffc9ec73f2e914527e12ecd97b0edbc99a2ed47a`

## Scope

- Target window: `Alembic`
- Target task: `p10-alembic-daemon-rescan-coverage-seed-output-repair-t1`
- Dispatch group: `p10-alembic-daemon-rescan-coverage-seed-output-repair-p1`
- Source evidence reviewed:
  - `evidence/p10-bilidili-post-rescan-cancellation-cleanup-rerun-controller-review.md`
  - `evidence/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1-report.md`
  - `evidence/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1-summary.json`
  - `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/host-rescan-after-repair.json`
  - `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/final-after-host-rescan.json`

## Code Changes

- `lib/daemon/DeepMiningRoundGate.ts`
  - Adds a ledger-derived `coverageLedgerSeed` to completed deepMining daemon rescan results.
  - Records a job-retained developer-facing process event titled `DeepMining coverage ledger seed retained`.
  - The seed is derived from `coverageLedgerRepository.listByProjectRoot(projectRoot)` after the run.
  - Target-scoped non-root rows are counted as usable; aggregate/root module ids such as `target:BiliDili:.` are reported but do not make the seed `written`.
  - Seed fields include `status`, `writtenCells`, `usableCells`, `targetScopedCells`, `measuredCells`, `coveredPathCount`, `moduleCount`, `dimensionIds`, and `aggregateOrRootModuleIds`.

- `test/unit/DaemonJobRunnerPlanGate.test.ts`
  - Adds coverage proving completed target-scoped measured ledger state appears in both job result and retained process event metadata/content.
  - Adds coverage proving aggregate/root-only rows produce `status: skipped` and are not accepted as a written seed.
  - Existing cancellation cleanup and no-round failure coverage remains intact and was rerun.

## Preserved Boundaries

- No edits to AlembicCore, AlembicPlugin, Test, BiliDili, provider config, vendor pins, release assets, real data roots, or thread ids.
- Public job kind/source/status values and HTTP route schemas were not changed.
- `coverage_ledger` and `deep_mining_rounds` schema names and columns were not changed.
- Cancellation cleanup behavior from `42ab1613692fda5f7efb20de9d00cd35ebde796a` was not changed.

## Validation

- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts`
  - PASS: 23 tests.
- `npm test -- --run test/unit/DaemonJobRunner.test.ts`
  - PASS: 17 tests.
- `npm test -- --run test/unit/DaemonJobRunner.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - PASS: 2 files, 40 tests.
- `npm test -- --run test/unit/JobsRoute.test.ts`
  - PASS: 19 tests.
- `npx biome check lib/daemon/DeepMiningRoundGate.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - PASS: checked 2 files, no fixes applied.
- `git diff --check`
  - PASS: no whitespace errors.
- `npm run lint:repo-boundary`
  - PASS: repository boundary check passed.
- `npm run build:check`
  - PASS: local AlembicCore build plus Alembic `tsc --noEmit`.
- `npm run lint`
  - EXIT 0 with 5 pre-existing warnings outside touched files:
    - `lib/service/handler-runtime/types.ts`
    - `lib/workflows/ai-execution/AgentRunProjections.ts`

## Alembic MCP Notes

- `alembic_status` succeeded but reported Alembic project knowledge empty/degraded and selected/active project mismatch with BiliDili.
- `alembic_prime` returned degraded `knowledge-empty`; no trusted Recipe guidance was used.
- `alembic_work phase=start` failed with internal schema error `unrecognized key "data"`.
- `alembic_code_guard` failed with the same internal schema error `unrecognized key "data"`.

## Residual Risks

- This target did not run the real no-preclean BiliDili daemon rescan; it repaired and unit-verified the Alembic main output path.
- A fresh Test no-preclean BiliDili rerun is still required after controller review to prove host result/events/logs contain `coverageLedgerSeed` and unblock parity.
- Interrupted cancellation cleanup remains previously noted as not fully proven by Test because the observed public jobs completed before cancellation could interrupt execution.

## Recommendation

After controller review, dispatch Test for a fresh no-preclean BiliDili public deepMining rescan rerun. The rerun should verify:

- completed public job result contains `coverageLedgerSeed.status="written"`;
- retained job event evidence contains `coverageLedgerSeed`;
- target-scoped and measured coverage counts match SQLite `coverage_ledger`;
- aggregate/root module ids are not accepted as success;
- ProjectContext sessions and open deepMining rounds remain zero after completion.
