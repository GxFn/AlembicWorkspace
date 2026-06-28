# Controller Review - p10-bilidili-post-rescan-cancellation-cleanup-rerun

Generated: 2026-06-28T10:07:00+08:00

## Decision

Accept the Test blocked result as valid controller evidence, not as P10
acceptance. Create an Alembic main repair package for the daemon/public rescan
coverage seed output gap.

## Evidence Reviewed

- Target result:
  `target-results/tr-p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1.json`
- Test report:
  `evidence/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1-report.md`
- Test summary:
  `evidence/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1-summary.json`
- Raw host rescan:
  `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/host-rescan-after-repair.json`
- Raw final snapshot:
  `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/final-after-host-rescan.json`
- Alembic code read:
  `Alembic/lib/daemon/DeepMiningRoundGate.ts`,
  `Alembic/lib/daemon/DaemonJobRunner.ts`,
  `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`

## Findings

- Test stayed inside the assigned boundary: real BiliDili data root, no
  preclean, DeepSeek generation, local Qwen/Ollama embeddings, no source edit,
  no manual DB/session/coverage mutation.
- Accepted Alembic commit `42ab1613692fda5f7efb20de9d00cd35ebde796a` was
  rebuilt into ignored `dist` and loaded by the no-preclean daemon restart.
- The stale session/open round symptom did not reproduce on the observed
  repaired completion route. Final evidence shows SQLite integrity `ok`, zero
  active BiliDili ProjectContext sessions, and zero open `deep_mining_rounds`.
- Host public rescan completed with target-scoped coverage: 15
  target-scoped rows, 2 measured rows, no aggregate/root module ids.
- `coverageLedgerSeed` was absent from job result, events, and logs, so Test
  correctly skipped parity. A 0-vs-0 or seedless parity comparison would not be
  valid evidence for P10/G4.
- Alembic main code corroborates the gap: `runDeepMiningRounds` returns
  `asyncFill`, `deepMining`, `planSelectionProjection`, and `status`, but does
  not expose a public coverage seed summary even when the coverage ledger has
  measured target-scoped rows. The Plugin-side seed projection repairs do not
  cover this Alembic daemon/HTTP job route.
- Interrupted cancellation cleanup remains a residual risk because both
  repaired public rescan jobs completed before cancellation could interrupt
  execution. The first actionable blocker for P10 parity is still the missing
  host-visible coverage seed.

## Forbidden Conclusions

- Do not accept P10 parity, G4, G6, or final demand completion from this result.
- Do not treat the seedless measured coverage rows as sufficient for parity.
- Do not route this back to Test before Alembic main exposes a host-visible
  coverage seed for the daemon/public rescan route.

## Next Action

Dispatch Alembic main to expose the daemon/public deepMining rescan
`coverageLedgerSeed` in the job result and retained developer-facing evidence,
without changing frozen job/source/tool names or coverage schema values.
