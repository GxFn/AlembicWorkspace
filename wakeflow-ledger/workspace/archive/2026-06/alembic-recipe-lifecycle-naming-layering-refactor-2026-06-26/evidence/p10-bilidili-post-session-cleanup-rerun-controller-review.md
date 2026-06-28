# P10 BiliDili Post-Session Cleanup Rerun Controller Review

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: `p10-bilidili-post-session-cleanup-rerun-p1`
Task: `p10-bilidili-post-session-cleanup-rerun-t1`
Target: Test
Decision: accept blocked Test evidence; dispatch Alembic source repair

## Reviewed Evidence

- Target result:
  `target-results/tr-p10-bilidili-post-session-cleanup-rerun-t1.json`
- Test report:
  `evidence/p10-bilidili-post-session-cleanup-rerun-t1-report.md`
- Test summary:
  `evidence/p10-bilidili-post-session-cleanup-rerun-t1-summary.json`
- Raw Test evidence:
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/baseline-before-restart.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/restart-no-preclean.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/host-retry-after-restart-summary.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/daemon-rescan-after-host-bootstrap.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/cancel-daemon-rescan-after-timeout.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-after-cancel-wait10-snapshot.json`

## Controller Judgment

The Test backfill is accepted as a valid blocked result. It stayed within the
assigned no-preclean/no-cross-root boundary and provides raw evidence for the
remaining blocker.

The accepted Alembic cold-start session cleanup repair did work for its narrow
scope:

- the BiliDili no-preclean restart reported `preclean.skipped=true`;
- the environment verifier pointed to the real BiliDili project and data root;
- source and compiled `dist` both contained the cancellation classifier;
- the prior active cold-start session did not block the next cold-start;
- cold-start job `bootstrap_mqxke6ju_8031efab` completed;
- logs recorded `Workflow session lease released` with
  `cold-start:bootstrap-session-completed`;
- after cold-start completion there were zero active BiliDili sessions and zero
  open rounds.

The P10 parity gate remains blocked by a different source-chain failure:

- `alembic_status` in the Test thread still returned `Transport closed`, so
  Test correctly used the daemon/Dashboard route and did not repair MCP;
- daemon rescan job `rescan_mqxkqs00_b2cd8bf8` requested
  `moduleScope=["BiliDili"]`, `miningMode=deepMining`, `maxRounds=1`, and
  architecture-only scope;
- the job did not reach a terminal successful result inside the bounded route;
- it wrote only one target-scoped but empty coverage row:
  `target:Networking:Sources/Infrastructure/Networking`,
  `covered_count=0`, `grade=empty`, `measuredRows=0`;
- `coverageLedgerSeed` was absent;
- public cancel API marked the job `cancelled`, but the final delayed snapshot
  still showed one active BiliDili ProjectContext workflow session and one open
  `deep_mining_rounds` row with `completed_at=null`.

Test correctly skipped in-process parity. Accepting parity here would be a
0-vs-0 or stale-state comparison and would violate the P10/G4 gates.

## Scope Decision

The next owner is Alembic. The failing route is Alembic main daemon/rescan job
execution and cancellation cleanup:

- public daemon rescan cancellation marks the HTTP job cancelled;
- ProjectContext workflow session cleanup is not released for the rescan
  cancellation path;
- the deepMining round remains open after cancellation.

This is not a Test repair, not a Plugin source repair, and not a user decision
gate. Test has already proven the raw blocker and should not manually edit DB,
session, provider, or source state.

## Next Action

Dispatch Alembic to repair the daemon rescan cancellation cleanup path so a
cancelled or aborted rescan releases its ProjectContext workflow session and
closes/fail-closes the open `deep_mining_rounds` row with clear diagnostics.
The Alembic repair must preserve R-2 cleanup roots, provider configuration,
freeze values, public API semantics, corrupt-DB fail-closed behavior, and the
previous cold-start completion cleanup behavior.

After Alembic source repair is accepted, controller should dispatch Test for a
fresh real BiliDili no-preclean rerun. P10, G4, G6, and final demand completion
remain unaccepted.
