# P10 Alembic Full Reset Corrupt DB Live Route Repair Controller Review

- Reviewed at: 2026-06-28T07:33:54Z
- Dispatch group: p10-alembic-full-reset-corrupt-db-live-route-repair-p1
- Target result: p10-alembic-full-reset-corrupt-db-live-route-repair-t1-af4d976
- Target window: Alembic
- Commit reviewed: af4d976c29fee58a93f05de8bfc334073575b46d
- Controller judgment: accept Alembic source repair; real BiliDili parity/G4 remains unproven and must rerun in Test.

## Raw Evidence Reviewed

- TargetResultEnvelope: `target-results/p10-alembic-full-reset-corrupt-db-live-route-repair-t1-af4d976.json`
- Target report: `evidence/p10-alembic-full-reset-corrupt-db-live-route-repair-t1-report.md`
- Task package: `task-packages/p10-alembic-full-reset-corrupt-db-live-route-repair-p1.json`
- Alembic repository HEAD: `af4d976 fix: fail closed corrupt full resets`; `git status --short --branch` reported `main...origin/main [ahead 12]` with no unstaged files.

## Implementation Review

- `Alembic/lib/service/cleanup/CleanupService.ts`
  - `fullReset` now routes all data-table and task-table deletes through `#clearTablesForFullReset`.
  - Non-`no such table` failures are accumulated as errors and logged.
  - `#assertFullResetDatabaseClean` throws before `fullReset complete (trash-bin mode)` when critical DB clearing fails or when no DB reference is available.
  - The fail-closed log includes `resetMode: "fail-closed"` and names stale `knowledge_entries`, `coverage_ledger`, and `deep_mining_rounds` as the reason generation must stop.
- `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `runFullResetPolicy` still runs before ProjectContext session creation.
  - After successful fullReset, cold-start calls `createProjectContextWorkflowSession(..., replaceExisting: true)` and logs `replaceExistingLease: true`.
  - Because the call is after `await runFullResetPolicy`, corrupt DB reset failures stop before the stale-session replacement path or Recipe generation.
- `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `createProjectContextWorkflowSession` gained an explicit `replaceExisting?: boolean` flag and passes it to Core `BootstrapSessionManager.createSession(..., { replace })`.
  - Existing non-rebuild callers keep default lease protection because the default is `replace: false`.
- Core route check:
  - `AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts` `createSession` reloads `active-sessions.json`, throws on blocking leases when `replace` is false, and persists the replacement session when `replace` is true.

## Controller Replay

- `npm test -- --run test/unit/CleanupService.test.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ProjectIndexWorkflow.test.ts`
  - Passed: 3 files, 22 tests.
- `npx biome check lib/service/cleanup/CleanupService.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/project-context/ProjectContextWorkflowFacts.ts test/unit/CleanupService.test.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ProjectIndexWorkflow.test.ts`
  - Passed: checked 6 files, no fixes applied.
- `git diff --check HEAD~1..HEAD`
  - Passed.
- `npm run build:check`
  - Passed; used local `../AlembicCore` source.
- `npm run lint:repo-boundary`
  - Passed.
- `npm run lint`
  - Exit 0 with 5 pre-existing unrelated `noExplicitAny` warnings outside the changed files.

## Acceptance Boundaries

- Accepted: Alembic main live-route source repair for corrupt DB fullReset fail-closed behavior and rebuild stale ProjectContext/bootstrap workflow lease replacement after successful fullReset.
- Not accepted by this review: BiliDili real-run parity, G4 coverage gate, G6 twin/shim removal eligibility, or P10 completion.
- Required next step: dispatch Test to rerun the real BiliDili P10 project-index workflow-unify route with Alembic `af4d976`, AlembicPlugin `aee228b`, AlembicCore `99a7cf1`, and the existing BiliDili workspace/provider configuration.
