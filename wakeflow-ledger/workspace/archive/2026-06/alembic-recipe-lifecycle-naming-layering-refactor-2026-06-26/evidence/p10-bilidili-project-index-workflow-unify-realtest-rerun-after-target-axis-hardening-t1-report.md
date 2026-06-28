# P10 BiliDili Target-Axis Hardening Realtest Rerun

Status: blocked

Window: Test
Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1`
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-p1`

## Scope

This Test run used the real BiliDili workspace and stopped at the first hard host-route blocker. It did not repair source code, manually edit the BiliDili source tree, manually edit the Alembic DB/session/provider files, or run a sandbox copy.

The intended closed loop was:

1. Prove the R-2 root/dataRoot routes.
2. Run host bootstrap/dimension-completion/rescan/noPadding cleanup.
3. Verify target-only coverage ledger and advisory behavior after bootstrap and rescan.
4. Run the in-process route with `moduleScope=["BiliDili"]`.
5. Compare host and in-process parity with non-empty ledgers.

The run blocked during step 2, before a valid host dimension completion.

## Preconditions Verified

- Source pins matched the task:
  - AlembicPlugin: `bdd0b62fb80082c032f299d3393eacb5bfd78eeb`
  - AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - Alembic: `bf328ea81a809bb8f761c0a0d81162703b1cb70d`
  - BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`
- `git status --short` was empty for AlembicPlugin, AlembicCore, Alembic, and BiliDili before the real route.
- `npm run build` passed in AlembicPlugin.
- `npm run build` passed in Alembic.
- `node Test/scripts/verify-test-environment.mjs --project BiliDili --json` returned ready with dashboard URL `http://127.0.0.1:58762`, daemon alive, health 200, and testMode enabled for architecture bootstrap/rescan.
- Provider configuration was preserved:
  - generation provider: `deepseek`
  - generation model: `deepseek-v4-pro`
  - embeddings provider: `local-ollama`
  - embeddings model: `qwen3-embedding:0.6b`
  - embedding lane order: `local-first`
- R-2 source proof passed:
  - full host route uses `dataRoot`
  - full in-process route uses `projectRoot`
  - incremental route uses `dataRoot`
- Target-axis source proof passed:
  - target-axis helper present
  - dimension-completion filters mixed-axis rows
  - rescan seed filters target-axis rows
  - coverage advisory filters target-axis rows
  - ModuleService prefers target-derived canonical modules

Primary preflight evidence: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/before-host-snapshot.json`.

## Host Route Progress

The host route reached a real `alembic_bootstrap({rebuild:true})` call after status, plan draft, and plan confirm.

Bootstrap reported a full reset in trash-bin mode with `dbSnapshotRows=29`, `movedItems=2`, and trash folder `2026-06-28T06-26-01-867Z`.

The next source-grounded recipe candidates were based on these files:

- `BiliDili/AppCoordinator.swift`
- `BiliDili/Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ModuleManager.swift`
- `BiliDili/Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRouter.swift`
- `BiliDili/Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/ServiceRegistry.swift`

The corrected recipe submit was blocked by duplicate recipe titles that survived the reset:

- `协调器装配` -> `<redacted>`
- `模块生命周期` -> `<redacted>`
- `二级路由表` -> `<redacted>`

Those duplicate rows were still in `knowledge_entries` as `source=host-agent`, `lifecycle=staging`, with `createdAt=1782625097` (`2026-06-28T05:38:17Z`) and `updatedAt=1782625122` (`2026-06-28T05:38:42Z`). The current full reset happened later at `2026-06-28T06:26:01Z`, so these rows are reset survivors, not valid current-session submissions.

After the blocked submit, the real DB still contained:

- `knowledge_entries`: 18
- `coverage_ledger`: 23
- target coverage rows: 15
- aggregate/root coverage rows: 8
- `targetScopedOnly`: false

Aggregate/root coverage rows still present:

- `BiliDili`
- `Packages/AOXFoundationKit`
- `Packages/AOXNetworkKit`
- `Packages/AOXPlayer`
- `Packages/AOXUIKit`
- `Sources`
- `module:root:BiliDili:BiliDili`
- `root`

The relevant log line from the current reset was:

`[CleanupService] Failed to clear knowledge_entries: database disk image is malformed`

The same reset then logged fullReset complete with `errors=1`. That means this route could not establish the required post-bootstrap target-only state.

Primary blocker evidence: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/after-host-bootstrap-submit-duplicate-blocker-snapshot.json`.

## Cleanup Attempt

A cleanup-only `alembic_dimension_complete` was attempted with `noPadding=true` and empty `submittedRecipeIds`, explicitly not using stale recipe ids as success evidence.

It failed with:

- status: `blocked`
- code: `DIMENSION_RECIPE_ID_NOT_BOUND`
- message: `Dimension evidence gate failed before checkpoint/progress finalization. Rebuild the bootstrap Recipe loop evidence.`

The active bootstrap session therefore remains open:

- matching BiliDili sessions: 1
- completed dimensions: none

Final snapshot evidence: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-t1/after-cleanup-attempt-blocked-snapshot.json`.

## Not Run

The host rescan, noPadding success verification, in-process route, and parity diff were not run. Continuing would have used a DB state that already violated the reset and target-axis success gates, and would risk masking the first raw blocker.

## Result

Blocked. The first hard blocker is that the real BiliDili `rebuild:true` full reset did not clear stale `knowledge_entries` and left mixed aggregate/root `coverage_ledger` rows. The submit path then rejected current-session recipe candidates as duplicates, leaving no valid session-bound recipe ids for dimension completion or cleanup. This prevents proving the required non-empty target-only host ledger after bootstrap/rescan and prevents a valid host-vs-in-process parity comparison.
