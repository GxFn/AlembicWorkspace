# P10 BiliDili Full-Reset Corrupt-DB Repair Rerun

Status: blocked

Window: Test
Task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1`
Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-p1`

## Scope

This run used the real BiliDili workspace directly. It did not create a sandbox copy, manually edit BiliDili source, manually edit the Alembic DB, manually edit active sessions, change provider settings, change package versions, reload the Codex MCP host, or repair Alembic source from Test.

The assigned question was whether AlembicPlugin commit `aee228be0082e8ddb1d4494df07e0ffedc6ea292` lets the real BiliDili P10 route either:

- reset cleanly and continue to non-empty target-scoped host/in-process parity, or
- fail closed before generation with a precise corrupt-DB blocker.

The run blocked before either acceptable conclusion could be proven.

## Preconditions Verified

- Source pins matched the task:
  - AlembicPlugin: `aee228be0082e8ddb1d4494df07e0ffedc6ea292`
  - AlembicCore: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
  - Alembic: `bf328ea81a809bb8f761c0a0d81162703b1cb70d`
  - BiliDili: `6f1bf34cf1b6daca4e08895db211939115dac868`
- `git status --short` was empty for AlembicPlugin, AlembicCore, Alembic, and BiliDili.
- `npm run build` passed in AlembicPlugin; Core build used `../AlembicCore @ 99a7cf10d82056cd860eb0a1d9544662e3735b08`.
- `npm run build` passed in Alembic.
- `node Test/scripts/verify-test-environment.mjs --project BiliDili --json` returned ready with dashboard URL `http://127.0.0.1:58762`, daemon health 200, and testMode enabled for architecture bootstrap/rescan.
- Provider configuration was preserved:
  - generation provider: `deepseek`
  - generation model: `deepseek-v4-pro`
  - embeddings provider: `local-ollama`
  - embeddings model: `qwen3-embedding:0.6b`
  - embedding lane order: `local-first`
- R-2 proof still held:
  - full host route uses `dataRoot`
  - full in-process route uses `projectRoot`
  - incremental route uses `dataRoot`
- Source proof for the accepted repair was present in the checked-out AlembicPlugin code:
  - fullReset table list includes `coverage_ledger`, `deep_mining_rounds`, `source_graph_edges`, `source_graph_symbols`, `source_graph_files`, `source_graph_generations`, and `project_context_file_snapshots`
  - fullReset has `#assertFullResetDatabaseClean(...)`
  - fullReset fail-closed diagnostic includes `resetMode: 'fail-closed'`
  - unit test covers `database disk image is malformed`

Primary preflight evidence: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1/before-host-snapshot.json`.

## Pre-Run DB State

The live BiliDili dataRoot was still corrupt before host bootstrap:

- `pragma integrity_check` reported `Tree 4 page 4 cell 0: Rowid 3 out of order`, unused pages, wrong index entry counts, and missing rows in `knowledge_entries` indexes.
- `knowledge_entries`: 18
- `coverage_ledger`: 23
- `deep_mining_rounds`: 2
- target coverage rows: 15
- aggregate/root coverage rows: 8
- `targetScopedOnly`: false

The same stale recipe rows from the prior blocker were still present:

- `协调器装配` -> `<redacted>`
- `模块生命周期` -> `<redacted>`
- `二级路由表` -> `<redacted>`

An active BiliDili bootstrap session from the prior blocked run was also still present:

- session: `bs-<redacted>`
- dimension: `architecture`
- completed dimensions: none

## Host Route Attempt

The host route reached:

1. `alembic_status(projectRoot=BiliDili)` -> ready, pure-local route, knowledge count 18.
2. `alembic_plan draft` -> BiliDili Swift project profile, 163 files, 10 modules.
3. `alembic_plan confirm` -> bounded coldStart, `architecture`, totalRecipeBudget 3, maxFiles 4, contentMaxLines 40.
4. `alembic_bootstrap({rebuild:true})` -> blocked.

The bootstrap tool returned:

- status: `failed`
- code: `BOOTSTRAP_IN_PROGRESS`
- HTTP/status class: 409 conflict
- active project root: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- active session: `bs-<redacted>`
- lease expiration: `2026-06-28T08:26:02.340Z`

Exact diagnostic evidence: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1-bootstrap-diagnostic.json`.

Log signals during the same call also showed:

- `[CleanupService] Starting fullReset (trash-bin mode)...`
- `[CleanupService] DB snapshot: 14 rows -> db-snapshot.jsonl`
- `[CleanupService] Failed to clear knowledge_entries: database disk image is malformed`
- `[CleanupService] fullReset complete (trash-bin mode)` with `errors=1`

That log sequence is not an acceptable parity pass or accepted fail-closed result. The MCP call itself returned the active-session conflict, and the route did not produce a controller-reviewable fail-closed bootstrap diagnostic proving the live route consumed the repair behavior.

Primary post-attempt evidence: `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-t1/after-bootstrap-conflict-snapshot.json`.

## Not Run

The route did not continue to recipe submission, dimension completion, host rescan, noPadding cleanup, in-process moduleScope=`["BiliDili"]`, or host-vs-in-process parity.

Continuing would have required manual session or DB mutation, waiting on a stale lease, using stale recipe ids, or treating an unproven runtime route as if it had produced the intended fail-closed behavior. Those are outside the Test boundary.

## Result

Blocked. The first hard blocker is the stale active BiliDili bootstrap session, which caused `alembic_bootstrap(rebuild:true)` to fail with `BOOTSTRAP_IN_PROGRESS` before a valid post-repair host bootstrap could proceed. The live DB remains corrupt and stale, and the observed CleanupService log during the attempt still ended with `fullReset complete (trash-bin mode)` plus `errors=1`, not a usable fail-closed result envelope.

Controller should not accept P10 parity or G4/G6 readiness from this run. The next repair/coordination step should first make the real route capable of starting a clean post-repair bootstrap attempt without manual Test-side DB/session edits, and should ensure the runtime actually returns a fail-closed diagnostic when `knowledge_entries` cannot be cleared.
