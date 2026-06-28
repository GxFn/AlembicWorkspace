# Controller Review: P10 BiliDili Seed Output No-Preclean Rerun After Alembic Repair

Reviewed at: 2026-06-28T18:45:00+08:00

## Decision

Accept the Test target result as PASS evidence for the assigned seed-output
no-preclean rerun.

This closes the latest P10 residual blocker created after the Alembic daemon
coverage seed output repair. It is not whole-demand completion, not G4/G6 final
acceptance, and not a fresh full six-chain parity rerun by itself.

## Scope

- Demand: `alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-p1`
- Target result: `Test / p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1`
- Target status reviewed: `completed`
- Job reviewed: `rescan_mqxndm32_10590d38`

## Evidence Reviewed

- TargetResultEnvelope: `target-results/tr-p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1.json`
- Test report: `evidence/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1-report.md`
- Test summary: `evidence/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1-summary.json`
- Raw evidence:
  - `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/post-build-pre-restart.json`
  - `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/restart-no-preclean.json`
  - `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/host-rescan-after-seed-repair.json`
  - `Test/tmp/p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-t1/final-after-wait.json`

## Controller Findings

- Test ran directly against the real BiliDili workspace/data-root route. It did
  not use a sandbox copy and did not manually edit SQLite or source state.
- Alembic was rebuilt so the loaded dist contained the seed-output repair:
  source had the repair before build, dist did not, and dist did after
  `npm run build`.
- The rerun used `--no-preclean` and `--no-dev-link`; restart evidence shows
  both paths were skipped.
- Provider routing stayed inside the required configuration: DeepSeek for
  generation and local Ollama/Qwen for embeddings.
- SQLite integrity was `ok` before and after the run.
- The public daemon rescan job completed terminally. The selected module scope
  was target-scoped, not aggregate/root-only.
- `coverageLedgerSeed` was present in the top-level job result, the nested
  deepMining result, retained event/developer-view surfaces, and the combined
  log signal captured by Test.
- The job result seed, nested deepMining seed, and SQLite-derived seed matched:
  `status="written"`, `dimensionIds=["architecture"]`, `moduleCount=15`,
  `targetScopedCells=15`, `usableCells=15`, `writtenCells=15`,
  `measuredCells=2`, `coveredPathCount=32`, and
  `aggregateOrRootModuleIds=[]`.
- Coverage was not empty: final snapshot reported 15 coverage rows, all
  target-scoped, with 2 measured rows.
- Cleanup stayed closed: active sessions were 0 before, after, and after the
  final delay; open `deep_mining_rounds` were 0 before, after, and after the
  final delay.

## Decision Boundary

This target proves that the latest host-observable seed-output blocker is gone:
the real BiliDili no-preclean public deepMining route now exposes a ledger-derived
coverage seed through result/event/log surfaces, and the seed counts match
SQLite while cleanup remains closed.

It does not independently prove interrupted cancellation behavior, because this
run completed normally. That limitation is acceptable for this package because
the assigned question was the post-Alembic seed-output rerun, and the prior
P10 repair chain already isolated cancellation cleanup as a separate accepted
source repair plus post-cleanup rerun.

## Next Action

Proceed to the next planned P11 source package for the moduleMining binding-rich
selector behavior change. P11 still needs its own independent real BiliDili
REAL-TEST after source work lands; do not reuse this P10 evidence as P11 proof.

## Forbidden Conclusions

- Do not mark the whole demand complete from this result.
- Do not mark G4/G6 final acceptance from this result alone.
- Do not treat parity predicate eligibility as a completed P11/P12/P13 real test.
- Do not rerun Test for the same seed-output blocker unless new contradictory
  evidence appears.
