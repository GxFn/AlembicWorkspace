# P10 BiliDili Post-Rescan Cancellation Cleanup Rerun - Test Result

Generated: 2026-06-28T09:59:00Z

## Verdict

Blocked for controller/source review.

The accepted Alembic repair at `42ab1613692fda5f7efb20de9d00cd35ebde796a`
was rebuilt into the local ignored `dist` output and loaded by a no-preclean
BiliDili daemon restart. The previous stale-session/open-round failure did not
reproduce: repaired public rescan completion left zero active BiliDili
ProjectContext workflow sessions and zero open `deep_mining_rounds` rows in
immediate, delayed, and final snapshots.

The remaining blocker is the host coverage transport gate. The repaired public
host rescan completed with non-empty target-scoped measured coverage, but no
`coverageLedgerSeed` appeared in the job result, events, or logs. Per the task
package, parity was not run or claimed because the host side did not satisfy
the coverage seed precondition.

## Boundary And Environment

- Task: `p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1`
- Real project: `BiliDili`
- Data root id: `02a25032`
- Alembic source pin: `42ab1613692fda5f7efb20de9d00cd35ebde796a`
- AlembicCore source pin: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- AlembicPlugin source pin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
- Test source pin: `5175a1ff674fdaa5fc14f0410f38a09e1f575660`
- BiliDili source pin: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Provider route preserved: DeepSeek generation, local Qwen/Ollama embedding.
- No source edits, no manual DB/session/coverage mutation, no preclean.

## Route Evidence

1. Pre-rebuild baseline:
   - BiliDili project root and data root verified.
   - SQLite integrity: `ok`.
   - Active BiliDili sessions: `0`.
   - Open `deep_mining_rounds`: `0`.
   - Coverage ledger already had 15 target-scoped rows, 2 measured rows.
   - Source contained the `42ab161` rescan-cancel cleanup code, but ignored
     `Alembic/dist` still lacked `releaseProjectContextWorkflowSessionByProjectRoot`
     and `cleanupCancelledRescanJob`.

2. Build and no-preclean restart:
   - `npm run build` in Alembic completed successfully and left `git status`
     clean.
   - Post-build `dist` contained the repair markers:
     `releaseProjectContextWorkflowSessionByProjectRoot`,
     `cleanupCancelledRescanJob`, `rescan-cancel-cleanup-project-root`, and
     the deep-mining round cleanup log strings.
   - Restart command used `--no-preclean --no-dev-link`, with
     `ALEMBIC_TEST_MODE=1`, `ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`, and
     `ALEMBIC_TEST_RESCAN_DIMS=architecture`.
   - Restart output recorded `preclean.skipped=true`,
     `devLink.skipped=true`, daemon PID `87486`, and API URL
     `http://127.0.0.1:50594`.

3. Completion/cleanup probe:
   - Public rescan job `rescan_mqxm3o52_8ca7509b` was enqueued with
     `moduleScope=["BiliDili"]`, `dimensions=["architecture"]`,
     `maxFiles=4`, `contentMaxLines=40`, `maxRounds=1`, and `scaleCap=1`.
   - It was running on the first two polls and completed before cancellation
     could interrupt it.
   - The cancel API returned `200`; readback stayed `completed`.
   - Immediate and delayed snapshots both showed SQLite `ok`, zero active
     BiliDili sessions, zero open rounds, and 15 target-scoped coverage rows
     with 2 measured rows.

4. Host rescan evidence:
   - Public host rescan job `rescan_mqxm575e_1e78982a` completed.
   - Route checks passed for terminal completion, requested BiliDili module
     scope, non-empty target-scoped coverage, no aggregate/root module ids, no
     open rounds, and no active BiliDili sessions.
   - Coverage summary: 15 total target-scoped rows, 2 measured rows,
     dimension `architecture`.
   - Selected module scope was `Sources/Infrastructure/Account`.
   - `coverageLedgerSeedPresent=false`; evidence search found no
     `coverageLedgerSeed` in job result, events, or logs.

5. Final snapshot:
   - SQLite integrity: `ok`.
   - Active BiliDili sessions: `0`.
   - Open `deep_mining_rounds`: `0`.
   - Coverage ledger: 15 target-scoped rows, 2 measured rows.

## Raw Evidence

- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/baseline-pre-rebuild.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/source-dist-repair-markers-prebuild.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/source-dist-repair-markers-postbuild.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/restart-no-preclean.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/baseline-post-restart.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/cancel-route-api.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/after-cancel-route-immediate.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/after-cancel-route-delayed.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/host-rescan-after-repair.json`
- `Test/tmp/p10-bilidili-post-rescan-cancellation-cleanup-rerun-t1/final-after-host-rescan.json`

## Controller Review Notes

- The `42ab161` repair appears to have resolved the stale session/open round
  symptom for the observed repaired public rescan completion route.
- This result does not prove interrupted cancellation cleanup, because both
  repaired public rescans completed before a cancel could take effect.
- Do not accept P10 parity from this result: host coverage has measured rows,
  but the host route still omits `coverageLedgerSeed`, so the package's parity
  precondition was not met.
