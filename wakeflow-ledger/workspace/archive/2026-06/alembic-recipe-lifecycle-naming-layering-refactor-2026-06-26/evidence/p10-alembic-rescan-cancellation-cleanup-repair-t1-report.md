# P10 Alembic Rescan Cancellation Cleanup Repair - Target Report

Generated: 2026-06-28
Target window: Alembic
Task: `p10-alembic-rescan-cancellation-cleanup-repair-t1`
Dispatch group: `p10-alembic-rescan-cancellation-cleanup-repair-p1`

## Verdict

Completed in Alembic main.

Commit: `42ab1613692fda5f7efb20de9d00cd35ebde796a`

The repair keeps the accepted cold-start cleanup behavior and adds a narrow
daemon rescan cancellation cleanup path. Public job cancellation still records
the job as `cancelled`, but cancelled rescan jobs now also:

- release the active ProjectContext workflow lease for the resolved project root;
- close open `deep_mining_rounds` rows whose `rescanId` belongs to the cancelled
  job (`<jobId>:deepMining:<round>`);
- record process events and logs that show session release and round fail-close.

## Reviewed Raw Evidence

- `evidence/p10-bilidili-post-session-cleanup-rerun-controller-review.md`
- `evidence/p10-bilidili-post-session-cleanup-rerun-t1-report.md`
- `evidence/p10-bilidili-post-session-cleanup-rerun-t1-summary.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/daemon-rescan-after-host-bootstrap.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/cancel-daemon-rescan-after-timeout.json`
- `Test/tmp/p10-bilidili-post-session-cleanup-rerun-t1/final-after-cancel-wait10-snapshot.json`

Key raw facts:

- daemon job `rescan_mqxkqs00_b2cd8bf8` was cancelled through the public jobs API;
- final delayed snapshot still had active session
  `bs-<redacted>`;
- final delayed snapshot still had open round
  `rescan_mqxkqs00_b2cd8bf8:deepMining:1` with `completed_at=null`;
- the round was written under the real BiliDili project root, while the job
  record held data-root fields, so cleanup must resolve the same project-scope
  project root used by `runDeepMiningRounds`.

## Changed Files

- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - Added `releaseProjectContextWorkflowSessionByProjectRoot`.
  - Uses Core `BootstrapSessionManager.releaseProjectLease(projectRoot)`.
  - Logs release/skip diagnostics with the resolved workflow session id.
- `lib/daemon/DaemonJobRunner.ts`
  - On successful `cancelDaemonJob` for `rescan`, runs best-effort cleanup.
  - Resolves project root through `resolveProjectScopeAnalysisContext`.
  - Releases the ProjectContext workflow session lease for that project root.
  - Closes matching open deepMining rounds for the cancelled job.
  - Records process events for session release, round closure, and cleanup failure.
- `test/unit/ProjectContextWorkflowFacts.test.ts`
  - Covers project-root release for cancelled rescan cleanup.
- `test/unit/DaemonJobRunner.test.ts`
  - Simulates the Test blocker: running rescan job, active workflow session,
    open matching deepMining round, then public cancel.

## Validation

Passed:

- `npm test -- --run test/unit/ProjectContextWorkflowFacts.test.ts`
  - 15 tests passed.
- `npm test -- --run test/unit/DaemonJobRunner.test.ts`
  - 17 tests passed.
- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts`
  - 21 tests passed.
- `npx biome check lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/daemon/DaemonJobRunner.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/DaemonJobRunner.test.ts`
  - Checked 4 files. No fixes applied.
- `git diff --check`
  - Passed.
- `npm run lint:repo-boundary`
  - Passed.
- `npm run build:check`
  - Passed.
- `npm run lint`
  - Exit 0. Five pre-existing unrelated `noExplicitAny` warnings remain in
    `lib/service/handler-runtime/types.ts` and
    `lib/workflows/ai-execution/AgentRunProjections.ts`.
- Commit hook / lint-staged during commit:
  - Biome check and format completed for the four staged files.

Alembic Guard:

- First `alembic_code_guard` call failed due input validation
  (`hostDeclaredIntent.scenario` over 80 chars).
- Retry with shorter input failed with the same internal MCP schema issue seen
  in the prior Alembic task: `unrecognized key "data"`.
- No Guard pass is available from this MCP surface; repository tests/build are
  the reviewable validation evidence.

Alembic work lifecycle:

- `alembic_work phase=start` also failed with the same internal MCP schema
  issue: `unrecognized key "data"`.
- No Alembic workRef was created; Wakeflow TargetResult remains the durable
  task result envelope.

## Scope And Non-Goals

Kept in scope:

- Alembic main only.
- Public rescan job cancellation cleanup.
- ProjectContext workflow session release.
- DeepMining round fail-close for matching cancelled job rounds.

Out of scope and untouched:

- AlembicCore, AlembicPlugin, Test, BiliDili source.
- Provider configuration, versions, release assets, vendor pins, thread ids.
- Public job kind/source strings, response tool names, PlanStageId values,
  lifecycle values, and coverage table/schema names.
- Manual BiliDili DB/session/source mutation.
- Claiming P10 parity or G4/G6 completion.

## Residual Risks

- Cancellation still does not interrupt an already-running async workflow. This
  patch makes public cancellation clean the durable session/round evidence
  immediately, which is the blocker proven by Test. A deeper cooperative abort
  channel would be a broader design/API change and was not authorized here.
- The ProjectContext release during cancellation is keyed by resolved project
  root because rescan jobs do not persist the workflow session id. This matches
  the single active ProjectContext lease invariant and the raw Test failure.
- Alembic Guard/work lifecycle MCP is unavailable due internal schema error.

## Next Recommendation

After controller acceptance, dispatch Test for a fresh real BiliDili
no-preclean rerun. The rerun should verify that cancelling or completing the
daemon rescan no longer leaves an active ProjectContext workflow session or open
`deep_mining_rounds` row, and only then continue to usable host coverage and
host-vs-in-process parity.
