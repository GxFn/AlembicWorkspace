# P10 BiliDili Project-Index Workflow-Unify Rerun After Alembic FullReset Live Route Repair

## Result

- Status: blocked
- Window: Test
- Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1`
- Classification: source repair fail-closed path verified; parity/G4 not reached because BiliDili data-root DB is still corrupt.
- Route: direct real BiliDili workspace, no sandbox copy, no manual DB/session/provider/source mutation.

## Source And Runtime Pins

- Alembic: `af4d976c29fee58a93f05de8bfc334073575b46d`
- AlembicPlugin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
- AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`
- Git status for all four repos: clean.
- Provider config: DeepSeek generation (`deepseek-v4-pro`), local Ollama/Qwen embedding (`qwen3-embedding:0.6b`, local-first lane). Secret presence was recorded only as a boolean in raw snapshot.

## Evidence Route

1. Read Test/Wakeflow rules, dispatch packet, delivery envelope, task package, test card, and upstream Alembic controller review.
2. Confirmed BiliDili/Alembic/AlembicPlugin repository instructions and source pins.
3. Ran `alembic_status` for `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
4. Ran `alembic_plan` draft + confirm for bounded coldStart `architecture`, scale 3 Recipes / 4 files / 40 lines.
5. Captured pre-reset snapshot with `Test/tmp/.../p10-alembic-full-reset-live-route-evidence.mjs`.
6. Ran `alembic_bootstrap` with `rebuild:true` and the confirmed planSelection.
7. Captured post-reset snapshot and log evidence.

## R-2 / Source Repair Proof

- R-2 projectRoot/dataRoot ternary present in AlembicCore `ProjectIndexPlan.ts`: host full reset uses `input.dataRoot`, in-process route uses `input.projectRoot`, incremental cleanup uses `input.dataRoot`.
- Alembic live-route repair source proof present:
  - `CleanupService.ts` fullReset deletes `coverage_ledger`, `deep_mining_rounds`, source graph tables, and ProjectContext snapshots.
  - `CleanupService.ts` throws fail-closed diagnostics with `resetMode: 'fail-closed'`.
  - `ColdStartWorkflow.ts` places `replaceExisting: true` after `await runFullResetPolicy`.
  - `ProjectContextWorkflowFacts.ts` passes `replace: input.replaceExisting === true` to Core session creation.

## Bootstrap Result

`alembic_bootstrap({ rebuild: true })` returned:

```json
{
  "ok": false,
  "status": "failed",
  "summary": "[CleanupService] fullReset aborted: destructive rebuild could not clear critical database tables. The host must stop before Recipe generation because stale knowledge_entries, coverage_ledger, or deep_mining_rounds rows may survive reset. Errors: Failed to clear knowledge_entries: database disk image is malformed",
  "errorCode": "INTERNAL_ERROR",
  "retryable": false
}
```

This matches the test card's accepted fail-closed branch: corrupt DB clear failed and the run stopped before Recipe generation/parity work.

## DB And Log Evidence

Before bootstrap:
- `pragma integrity_check` reported corrupt DB/index issues beginning with `Tree 4 page 4 cell 0: Rowid 3 out of order`.
- Counts: `knowledge_entries=18`, `coverage_ledger=28`, `deep_mining_rounds=2`, `token_usage=28`.
- Coverage ledger was mixed-axis: 28 rows, 20 target module ids, 8 aggregate/root module ids.
- Active session file had one incomplete matching BiliDili session: `bs-<redacted>`.

After bootstrap fail-closed:
- `knowledge_entries=18` and DB integrity remained corrupt.
- `coverage_ledger=0`, `deep_mining_rounds=0`, `token_usage=0`; no new non-empty parity dataset was produced.
- Active session file still had the same incomplete old BiliDili session, because fullReset failed before the replacement-session path.
- New logs at `2026-06-28T07:44:04Z` show:
  - `[CleanupService] Starting fullReset (trash-bin mode)...`
  - `[CleanupService] Failed to clear knowledge_entries: database disk image is malformed`
  - `[CleanupService] fullReset aborted...` with `resetMode:"fail-closed"`
  - MCP `alembic_bootstrap` returned `INTERNAL_ERROR`
- There was no new `fullReset complete` success log after the fail-closed abort.

## Raw Evidence Files

- Helper: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/p10-alembic-full-reset-live-route-evidence.mjs`
- Before snapshot: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/before-bootstrap-snapshot.json`
- After snapshot: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/after-bootstrap-fail-closed-snapshot.json`

## Boundary And Recommendation

- No product code changed.
- I did not run host dimension-completion, rescan, noPadding cleanup, or in-process `moduleScope=["BiliDili"]`, because the test card stop condition was reached.
- Cannot conclude P10 parity, G4, G6, or final demand completion.
- Recommended next controller action: treat Alembic `af4d976` fail-closed source behavior as verified in the real route, then route the remaining blocker as BiliDili data-root DB health/reset repair or an authorized clean-data-root reset before reattempting parity.
