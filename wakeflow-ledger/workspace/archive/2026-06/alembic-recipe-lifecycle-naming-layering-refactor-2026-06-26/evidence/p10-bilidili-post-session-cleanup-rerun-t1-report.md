# P10 BiliDili Post-Session Cleanup Rerun - Test Result

Generated: 2026-06-28T09:21:56Z

## Verdict

Blocked for controller/source review.

The accepted Alembic repair was present in source and compiled `dist`, and the
real BiliDili no-preclean cold-start retry was not blocked by the stale
pre-repair active session. The cold-start retry completed and released its
ProjectContext workflow session.

The broader P10 parity gate still failed. The daemon rescan fallback route
timed out while still running, left an open deep-mining round and active
BiliDili session, and public job cancellation did not release either one. No
valid in-process parity run was attempted because host coverage was not usable
and cancellation cleanup hit the stop condition.

## Boundary And Environment

- Task: `p10-bilidili-post-session-cleanup-rerun-t1`
- Real project: `BiliDili`
- Data root id: `02a25032`
- Alembic source pin: `01e70642260e61fca2174a87106b22ad21b6ad81`
- AlembicCore source pin: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- AlembicPlugin source pin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
- BiliDili source pin: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Provider route preserved: DeepSeek generation, local Qwen/Ollama embedding.
- R-2 proof was present before restart/rescan: host full route uses data root,
  in-process full route uses project root, incremental cleanup uses data root.
- `npm run build` was run in Alembic before restart because the ignored
  compiled `dist` initially lacked the new cancellation classifier. After build,
  both source and `dist` contained `classifyBootstrapCompletionRelease`,
  `bootstrap-session-cancelled`, and `isCancelledBootstrapCompletionEvent`.

## Route Evidence

1. Baseline before restart:
   - Verifier ready on the existing BiliDili daemon and data root.
   - `coverage_ledger=0`, `deep_mining_rounds=0`, no open rounds.
   - One matching active BiliDili ProjectContext session existed from the prior
     cancelled run.

2. No-preclean restart:
   - Command used the documented BiliDili route with `--no-preclean`.
   - Restart output recorded `preclean.skipped=true` and `devLink.skipped=true`.
   - New daemon was ready at the BiliDili data root with test mode
     `architecture` only.

3. Cold-start retry:
   - Job `bootstrap_mqxke6ju_8031efab` started instead of being blocked by the
     inherited active session.
   - The job completed at `2026-06-28T09:12:48.716Z`.
   - Log evidence recorded `Workflow session lease released` with
     reason `cold-start:bootstrap-session-completed`.
   - Final cold-start snapshot had zero active BiliDili sessions and zero open
     rounds.
   - This verifies the stale pre-repair session did not block cold-start retry,
     but it did not produce P10 coverage: `coverage_ledger=0` and no
     `coverageLedgerSeed`.

4. MCP host rescan surface:
   - `alembic_status` for BiliDili returned `Transport closed`.
   - Per the Test card, Test did not repair or reload MCP and used the daemon
     route instead.

5. Daemon rescan fallback:
   - Job `rescan_mqxkqs00_b2cd8bf8` ran with:
     `dimensions=["architecture"]`, `generationStage=deepMining`,
     `miningMode=deepMining`, `moduleScope=["BiliDili"]`, `maxFiles=4`,
     `contentMaxLines=40`, `maxRounds=1`, `scaleCap=1`.
   - During execution it wrote one target-scoped coverage row:
     `target:Networking:Sources/Infrastructure/Networking`.
   - The row was not usable success evidence: `covered_count=0`,
     `grade=empty`, `measuredRows=0`, and no `coverageLedgerSeed` evidence.
   - The job remained `running` past the bounded wrapper window with one open
     `deep_mining_rounds` row and one active BiliDili session.

6. Cancellation cleanup:
   - Public job cancel API returned success and marked
     `rescan_mqxkqs00_b2cd8bf8` as `cancelled`.
   - Immediate and delayed snapshots still showed:
     - one active matching BiliDili session;
     - one open `deep_mining_rounds` row with `completed_at=null`;
     - no `rescan:bootstrap-session-cancelled` or equivalent release log.
   - This hits the Test card stop condition for stale session/open round after
     bounded cancellation. No retry or in-process parity was run.

## Raw Evidence

- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/baseline-before-restart.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/restart-no-preclean.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/verify-after-restart.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/after-restart-snapshot.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/host-retry-after-restart-summary.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-host-job.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-after-host-snapshot.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/daemon-rescan-after-host-bootstrap.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-daemon-rescan-job-readback.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/cancel-daemon-rescan-after-timeout.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-after-cancel-wait10-snapshot.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/p10-post-session-evidence.mjs`

## Controller Review Notes

- Do not accept P10 parity from this result.
- The narrow cold-start retry/session release path is improved: old stale state
  did not block the next cold-start, and clean cold-start completion released
  the active session.
- The rescan timeout/cancellation path remains unsafe: cancellation marks the
  job cancelled but leaves the ProjectContext workflow session and deep-mining
  round open.
- Host coverage is not usable for parity: the only row is target-scoped but
  empty, and `coverageLedgerSeed` is absent.
