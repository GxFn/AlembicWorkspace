# P10 Alembic Rescan Cancellation Cleanup Repair Controller Review

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: `p10-alembic-rescan-cancellation-cleanup-repair-p1`
Task: `p10-alembic-rescan-cancellation-cleanup-repair-t1`
Target: Alembic
Decision: accept narrow source repair; dispatch Test rerun

## Reviewed Evidence

- Target result:
  `target-results/p10-alembic-rescan-cancellation-cleanup-repair-t1-42ab161.json`
- Target report:
  `evidence/p10-alembic-rescan-cancellation-cleanup-repair-t1-report.md`
- Alembic commit:
  `42ab1613692fda5f7efb20de9d00cd35ebde796a`
- Prior Test blocker evidence:
  `evidence/p10-bilidili-post-session-cleanup-rerun-controller-review.md`
  `evidence/p10-bilidili-post-session-cleanup-rerun-t1-report.md`
  `evidence/p10-bilidili-post-session-cleanup-rerun-t1-summary.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/daemon-rescan-after-host-bootstrap.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/cancel-daemon-rescan-after-timeout.json`
  `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-after-cancel-wait10-snapshot.json`

## Controller Verification

- `git -C Alembic rev-parse HEAD`
  => `42ab1613692fda5f7efb20de9d00cd35ebde796a`
- `git -C Alembic status --short`
  => clean
- `git -C Alembic show --stat --name-status 42ab161`
  => only `DaemonJobRunner.ts`, `ProjectContextWorkflowFacts.ts`, and their
  focused unit tests changed
- `npm test -- --run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/DaemonJobRunner.test.ts`
  => passed, 32 tests
- `npm run build:check`
  => passed
- `npm run lint:repo-boundary`
  => passed
- `git -C Alembic diff --check`
  => passed

## Controller Judgment

The Alembic repair is accepted for the narrow source blocker it claimed:
cancelled daemon rescan jobs now run best-effort cleanup for durable workflow
state.

The source diff matches the raw Test failure:

- `cancelDaemonJob` still marks the public job as cancelled;
- for `rescan` jobs, it resolves the same project root used by Alembic project
  scope analysis;
- it releases the active ProjectContext workflow lease for that project root;
- it closes matching open `deep_mining_rounds` rows whose `rescanId` starts
  with the cancelled job id prefix;
- it records diagnostic process events for session release, round closure, and
  cleanup failure;
- clean cold-start completion release remains covered;
- partial/degraded non-clean completion retention remains unchanged.

The implementation stays in Alembic main. It does not edit AlembicCore,
AlembicPlugin, Test, BiliDili, provider configuration, versions, release assets,
vendor pins, frozen job/source/tool/lifecycle strings, or table names.

## Residual Risks

- Cancellation still does not cooperatively interrupt an already-running async
  workflow. This source repair cleans the durable session/round evidence
  immediately on public cancel, which is the blocker proven by Test.
- Rescan cancellation release is keyed by resolved project root because rescan
  jobs do not persist the workflow session id. This matches the current single
  active ProjectContext lease invariant and the Test failure evidence.
- `alembic_code_guard` and `alembic_work` still failed with the internal MCP
  schema error `unrecognized key "data"`, so repository tests/build are the
  usable validation evidence.

## What This Does Not Prove

This does not prove real BiliDili P10 parity, G4, G6, or final demand
completion. The prior Test run had no usable host coverage seed, no measured
coverage rows, and skipped in-process parity correctly. A fresh real BiliDili
no-preclean rerun is required.

## Next Action

Dispatch Test for a real BiliDili no-preclean rerun after Alembic commit
`42ab1613692fda5f7efb20de9d00cd35ebde796a`. The rerun must prove that cancelled
or completed daemon rescan no longer leaves active ProjectContext sessions or
open `deep_mining_rounds`, then continue only if host coverage is usable:
`coverageLedgerSeed` present, non-empty target-scoped measured coverage, and
host-vs-in-process parity diff empty rather than 0-vs-0.
