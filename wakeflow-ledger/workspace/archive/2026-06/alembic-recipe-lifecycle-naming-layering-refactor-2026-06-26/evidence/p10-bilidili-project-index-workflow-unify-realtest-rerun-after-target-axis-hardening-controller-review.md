# P10 Test 回填总控评审：target-axis hardening rerun

Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1`
Target: Test
Controller decision: valid blocked evidence; request AlembicPlugin source repair.

## Raw evidence reviewed

- TargetResultEnvelope reported `status=blocked` and stopped before host rescan / in-process parity.
- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1-summary.json`
- Raw snapshots:
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/before-host-snapshot.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/after-host-bootstrap-submit-duplicate-blocker-snapshot.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/after-cleanup-attempt-blocked-snapshot.json`

## Findings

1. Preconditions are valid for the requested real route. Test verified clean repo status, source pins, BiliDili path, provider routing, dashboard health, test mode, R-2 root/dataRoot source proof, and target-axis source proof before the run.
2. The first hard blocker is real and occurs during host bootstrap reset/submission, before any valid parity conclusion. The 2026-06-28T06:26:01Z full reset logged `[CleanupService] Failed to clear knowledge_entries: database disk image is malformed`, then continued with `errors=1`.
3. The raw snapshot after the blocked submit shows the real DB still has `knowledgeEntries=18`, `coverageLedger=23`, `targetCoverageRows=15`, `aggregateCoverageRows=8`, and `targetScopedOnly=false`.
4. Controller read-only DB verification confirmed the duplicate staging rows still present after the later reset:
   - `协调器装配` / `<redacted>` / `source=host-agent` / `lifecycle=staging` / `createdAt=1782625097`
   - `模块生命周期` / `<redacted>` / `source=host-agent` / `lifecycle=staging` / `createdAt=1782625097`
   - `二级路由表` / `<redacted>` / `source=host-agent` / `lifecycle=staging` / `createdAt=1782625097`
5. Controller read-only DB verification also confirmed aggregate/root coverage rows still present: `BiliDili`, `module:root:BiliDili:BiliDili`, and `root`.
6. `PRAGMA integrity_check` on the real DB reports damaged `knowledge_entries` table/index state, including wrong entry counts for `idx_ke3_*` indexes and missing rows in `sqlite_autoindex_knowledge_entries_1`.
7. AlembicPlugin `CleanupService.fullReset()` currently records clear errors and continues completion. Its `ALL_DATA_TABLES` list also lacks `coverage_ledger`, `deep_mining_rounds`, and other later project-index/deep-mining tables that Alembic already clears. This matches the mixed stale ledger remaining after Plugin host reset.

## Judgment

The Test blocked result is valid and should not be retried as-is. This is not a Test operation failure and not acceptance of P10. The host route cannot prove target-only coverage or host-vs-in-process parity while rebuild:true leaves stale knowledge entries and aggregate/root coverage rows.

Next owner: AlembicPlugin. Repair should make Plugin rebuild/fullReset fail closed or recover when a critical table cannot be cleared, and align its fullReset data-table coverage with the P10 project-index/deep-mining tables so stale `coverage_ledger` / `deep_mining_rounds` rows cannot survive a host rebuild.

Forbidden conclusion: no P10 parity, G4, G6, or later-phase readiness can be concluded from this Test result.
