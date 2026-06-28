# P10 Test Backfill Controller Review: Full-Reset Corrupt-DB Rerun

Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1`
Target: Test
Controller decision: valid blocked evidence; request Alembic source repair.

## Raw Evidence Reviewed

- TargetResultEnvelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1.json`
- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1-summary.json`
- Bootstrap diagnostic: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1-bootstrap-diagnostic.json`
- Raw snapshots:
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1/before-host-snapshot.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1/after-bootstrap-conflict-snapshot.json`
- Source files checked:
  - `Alembic/lib/service/cleanup/CleanupService.ts`
  - `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `AlembicPlugin/lib/service/cleanup/CleanupService.ts`

## Findings

1. Test preconditions were valid. The run used the real BiliDili workspace, preserved DeepSeek generation and local Qwen/Ollama embeddings, verified R-2 root/dataRoot routing, and did not manually edit BiliDili source, DB, sessions, provider config, or package versions.
2. The real BiliDili dataRoot is still corrupt and stale before the attempt. `PRAGMA integrity_check` reports `knowledge_entries` table/index corruption; counts remain `knowledgeEntries=18`, `coverageLedger=23`, `deepMiningRounds=2`, `targetCoverageRows=15`, `aggregateCoverageRows=8`, `targetScopedOnly=false`.
3. `alembic_bootstrap({rebuild:true})` returned `BOOTSTRAP_IN_PROGRESS` for stale active session `bs-<redacted>` before a valid post-repair host bootstrap could proceed. Therefore no host-vs-in-process parity, G4, or G6 conclusion is available.
4. During the same call, logs showed `[CleanupService] Failed to clear knowledge_entries: database disk image is malformed`, then `[CleanupService] fullReset complete (trash-bin mode)` with `errors=1`. That is not the accepted fail-closed behavior and not a parity pass.
5. The live host route is consuming Alembic main, not the repaired Plugin path. `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts` injects `Alembic/lib/service/cleanup/CleanupService.ts`; that implementation records non-missing-table clear errors and continues to `fullReset complete`. By contrast, `AlembicPlugin/lib/service/cleanup/CleanupService.ts` now has `#assertFullResetDatabaseClean(...)` and throws with `resetMode: fail-closed`.
6. Alembic main already has the P10 project-index/deepMining table list in `ALL_DATA_TABLES`, but its destructive reset still lacks the fail-closed assertion and task-table error handling shape proven in Plugin. It also does not make the rebuild route capable of replacing or clearing stale active bootstrap leases after a successful destructive reset.

## Judgment

The Test blocked result is valid and should not be retried as-is. The blocker is in the Alembic main cold-start route: destructive rebuild can still continue after a critical DB clear failure, and a stale bootstrap lease can block the next session before Test can reach parity.

Next owner: Alembic. Repair should make the main `CleanupService.fullReset()` fail closed on critical DB clear errors or missing DB references, using Plugin commit `aee228be0082e8ddb1d4494df07e0ffedc6ea292` as behavior reference. It should also make a successful `rebuild:true` cold-start able to start a fresh bootstrap session without Test-side manual session edits, or return a precise source-level blocker if that requires a Core API change.

Forbidden conclusion: no P10 parity, no G4 coverage pass, no G6 readiness, and no demand completion can be concluded from this Test result.
