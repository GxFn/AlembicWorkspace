# P10 Alembic Daemon Rescan Coverage Seed Output Repair - Controller Review

Generated: 2026-06-28T18:21:30+08:00

## Decision

Accept the Alembic target result as source repair evidence.

This is not P10 parity acceptance, not G4/G6 acceptance, and not final demand completion.
The remaining required step is a fresh Test no-preclean BiliDili daemon/public rescan rerun.

## Reviewed Scope

- Target window: Alembic
- Target task: `p10-alembic-daemon-rescan-coverage-seed-output-repair-t1`
- Dispatch group: `p10-alembic-daemon-rescan-coverage-seed-output-repair-p1`
- Target result: `target-results/p10-alembic-daemon-rescan-coverage-seed-output-repair-t1-ffc9ec7.json`
- Alembic commit: `ffc9ec73f2e914527e12ecd97b0edbc99a2ed47a`

## Raw Evidence Reviewed

- Alembic target report: `evidence/p10-alembic-daemon-rescan-coverage-seed-output-repair-t1-report.md`
- Commit diff for `ffc9ec73f2e914527e12ecd97b0edbc99a2ed47a`
- Source file: `Alembic/lib/daemon/DeepMiningRoundGate.ts`
- Test file: `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`
- HTTP/job event surface: `Alembic/lib/daemon/DaemonJobRunner.ts`, `Alembic/lib/http/routes/jobs.ts`, `Alembic/lib/daemon/JobProcessEventRecorder.ts`

## Implementation Reality

The repair is scoped to Alembic main. It adds a completed deepMining daemon/public rescan seed after the round loop:

- source is `coverageLedgerRepository.listByProjectRoot(projectRoot)`;
- top-level job result includes `coverageLedgerSeed`;
- `deepMining.coverageLedgerSeed` includes the same seed;
- retained process event content and metadata include `coverageLedgerSeed`;
- logger metadata includes `coverageLedgerSeed`;
- target-scoped non-root rows make `status: "written"`;
- aggregate/root-only rows are reported in `aggregateOrRootModuleIds` but return `status: "skipped"`.

This directly addresses the previous Test blocker where SQLite showed target-scoped measured coverage, but job result/events/logs had no `coverageLedgerSeed`.

## Controller Verification

Re-run by controller in `Alembic`:

- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts` => PASS, 23 tests.
- `npm test -- --run test/unit/JobsRoute.test.ts` => PASS, 19 tests.
- `npm run build:check` => PASS.

Code review confirmed the retained event uses `JobProcessEventRecorder`, and `/api/v1/jobs/:jobId/events` reads the same retained recorder surface that Test probes.

## Boundaries

- No AlembicCore, AlembicPlugin, Test, BiliDili, provider config, vendor pin, release asset, real data root, or thread-id edits were made by this task.
- Public job kind/source/status values were not changed.
- `coverage_ledger` and `deep_mining_rounds` schema names/columns were not changed.
- The prior cancellation cleanup repair from `42ab1613692fda5f7efb20de9d00cd35ebde796a` was not modified by this commit.

## Residual Risks

- Real no-preclean BiliDili has not been rerun after `ffc9ec7`.
- Interrupted cancellation cleanup remains not fully proven because prior real public jobs completed before cancellation could interrupt execution.
- Alembic MCP work/guard lifecycle tools still failed in the target window with internal schema error `unrecognized key "data"`; controller acceptance therefore relies on raw source review and repository tests, not Guard.

## Next Action

Create and dispatch a Test rerun package that verifies the real BiliDili public daemon deepMining rescan now exposes `coverageLedgerSeed` in job result and retained event/log surfaces, while preserving zero active sessions, zero open rounds, SQLite integrity, provider routing, and coverage ledger target/measured counts.
