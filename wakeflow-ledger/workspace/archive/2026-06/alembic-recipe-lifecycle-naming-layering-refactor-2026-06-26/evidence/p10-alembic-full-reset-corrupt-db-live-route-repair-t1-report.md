# P10 Alembic Full Reset Corrupt DB Live Route Repair

## Result

- Status: completed
- Window: Alembic
- Task: p10-alembic-full-reset-corrupt-db-live-route-repair-t1
- Commit: af4d976c29fee58a93f05de8bfc334073575b46d
- Repository: /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic

## Source Changes

- `lib/service/cleanup/CleanupService.ts`
  - Added fail-closed fullReset table clearing for Alembic main.
  - Non-`no such table` failures from data tables and task tables now accumulate and throw before `fullReset complete` can be logged.
  - Missing DB reference now throws with the same fail-closed diagnostic.
  - The fail-closed diagnostic includes `resetMode: "fail-closed"` and explains why Recipe generation must stop when stale `knowledge_entries`, `coverage_ledger`, or `deep_mining_rounds` rows may survive reset.
- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - Added explicit `replaceExisting` support for ProjectContext workflow sessions using Core `BootstrapSessionManager.createSession(..., { replace: true })`.
  - Default callers still preserve existing lease protection.
- `lib/workflows/cold-start/ColdStartWorkflow.ts`
  - After successful fullReset, cold-start opens the ProjectContext workflow session with `replaceExisting: true`.
  - This lets destructive rebuild replace stale active bootstrap workflow leases before Recipe generation starts.

## Tests Added

- `test/unit/CleanupService.test.ts`
  - corrupt `knowledge_entries` clear failure fail-closes
  - missing DB reference fail-closes
  - task-table clear failure is included in fail-closed diagnostics
- `test/unit/ProjectContextWorkflowFacts.test.ts`
  - normal duplicate session still throws `BootstrapSessionLeaseError`
  - explicit destructive rebuild replacement opens a new session and removes the stale lease
- `test/unit/ProjectIndexWorkflow.test.ts`
  - source-order guard keeps `replaceExisting: true` after `runFullResetPolicy` and before AI session startup

## Validation

- `npm test -- --run test/unit/CleanupService.test.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ProjectIndexWorkflow.test.ts` passed: 22 tests.
- `npx biome check lib/service/cleanup/CleanupService.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/project-context/ProjectContextWorkflowFacts.ts test/unit/CleanupService.test.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ProjectIndexWorkflow.test.ts` passed.
- `npm run build:check` passed.
- `npm run lint:repo-boundary` passed.
- `git diff --check` passed before commit.
- `npm run lint` exited 0 with 5 pre-existing unrelated `noExplicitAny` warnings outside this change set.
- Post-commit `git status --short --branch` was clean on `main...origin/main [ahead 12]`.

## Residual Risks

- Alembic Guard MCP was attempted but failed with internal schema error `unrecognized key "data"`; Guard did not produce usable pass/fail evidence.
- The full BiliDili live host rerun was not executed in this Alembic target task. Controller/Test should rerun the real route with this Alembic commit after other active P10 repairs are in place.
- Alembic MCP status reported empty local Recipe knowledge and selected-project alignment mismatch, so this repair used raw source reads and repository validation as proof.
