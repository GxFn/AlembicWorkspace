# P4 Alembic Rescan Job Terminal Proof Repair

Status: fixed
Target window: Alembic
Task: p4-alembic-rescan-job-terminal-proof-repair-t1
Task package: p4-alembic-rescan-job-terminal-proof-repair-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03
Observed at: 2026-07-07T11:20+08:00

## Diagnosis

- Accepted Test evidence showed P4 Gate 1/2 passed after Alembic commit `0f11298e77e44523a37e1b767ffa315bbe86ffe5`.
- Gate 3 blocker was real BiliDili scoped POST `/api/v1/jobs/rescan` job `rescan_mra29d1i_150c52b4`.
- Public jobs/status stayed `running` / `architecture:filling` for about five minutes, with `progress.totalToolCalls=0`, and jobs/events only exposed enqueue/start/session-linked events.
- BiliDili combined log showed the underlying incremental workflow did run the generate session: analyze reached 17 iterations/24 tool calls and produce had started before Test cancellation. The public job evidence was stale because `runDaemonJob` attached the generate process-event bridge only for `bootstrap` jobs even though normal `rescan` also uses the bootstrap-backed generate session.
- The same code path already had all-completed finalization for bootstrap-backed jobs; the finalizer now also accepts completion payloads shaped with either `sessionId` or `id`.

## Change

Commit: `15ab82b0e3fd467a23999c3006cfb042618ba903` (`fix(jobs): expose rescan session proof`)

Changed files:

- `lib/daemon/jobs/DaemonJobRunner.ts`
  - Attach `attachGenerateProcessEventBridge` for both `bootstrap` and `rescan` daemon jobs.
  - Accept `sessionId` or `id` when matching bootstrap-session completion payloads.
- `test/unit/DaemonJobRunnerPlanGate.test.ts`
  - Added a regression that runs the real `runDaemonJob` rescan path with mocked `runGenerateWorkflow`, verifies live `bootstrap:process-events` become job process evidence, then emits `bootstrap:all-completed` and verifies the rescan job reaches terminal `completed` with retained `finalSession.summary`.

## Validation

- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts` -> pass, 43 tests.
- `npm run test:unit -- test/unit/JobsRoute.test.ts` -> pass, 19 tests.
- Post-commit: `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts test/unit/JobsRoute.test.ts` -> pass, 62 tests.
- `npm run build:check` -> pass.
- `npm run lint:retired-symbols` -> pass.
- `npm run lint:repo-boundary` -> pass.
- `npm run lint:consumer-core-imports` -> pass.
- `npm run lint:ring-direction` -> pass.
- `npx biome check lib/daemon/jobs/DaemonJobRunner.ts test/unit/DaemonJobRunnerPlanGate.test.ts` -> pass.
- `git diff --check` -> pass.
- Alembic Guard explicit files -> `guard-public-mra2xupe-1`, `ok=true`; warning-only existing structure notes remain for `DaemonJobRunner.ts` long/complex functions.

## Test Rerun Guidance

- This Alembic fix should prevent the previous false public evidence shape where a live rescan appeared frozen at session-linked with zero process evidence.
- A P4 Test rerun should inspect jobs/events or display-snapshot in addition to status progress while the job is running, because long provider calls can leave task-manager aggregate counters unchanged until a dimension completes.
- If the rerun requires terminal completion rather than live progress proof, the previous five-minute cap is shorter than the observed pipeline stage budgets (`analyze` logged 480s, `produce` logged 900s) and can interrupt a legitimate long DeepSeek call. Use a terminal wait budget aligned with those runtime limits, then require `completed`/`failed` terminal status and retained `finalSession.summary`.

## Residual Risk

- No Dashboard/Core/provider changes were made.
- The fix does not shorten real model latency or manufacture terminal success; it makes rescan process evidence and all-completed finalization observable through the public jobs evidence chain.
- Guard reported warning-only historical complexity/length findings in `DaemonJobRunner.ts`; resolving those would be a broad runner refactor outside this P4 repair.
