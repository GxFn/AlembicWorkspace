# P9 BiliDili Project-Index Parity REAL-TEST

Task: `p9-bilidili-project-index-parity-realtest-t1`
Window: `Test`
Date: 2026-06-28

## Result

Completed. The P9 coverage-write parity question passed for the same real
BiliDili module/dimension set:

- Host-agent/Plugin path: `alembic_bootstrap` rebuild, 3 accepted
  `architecture` candidates, then `alembic_dimension_complete`.
- In-process Alembic path: direct invocation of
  `writeKnowledgeRescanCoverageLedgerForDimension` against the same real
  BiliDili SQLite database and the same canonical module set.
- Normalized `coverage_ledger` diff: `[]`.
- Non-empty comparison rows: 6 canonical module rows.
- In-process write result: `writtenCells=6`, `deferredCells=0`, `skipped=false`.

Primary raw evidence:

- `Test/tmp/p9-bilidili-project-index-parity-realtest-t1/inprocess-coverage-parity.json`
- `Test/tmp/p9-bilidili-project-index-parity-realtest-t1/run-inprocess-coverage-parity.mjs`

## Code Points

Verified before running:

- AlembicCore HEAD: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- Alembic HEAD: `65c244d8092a70656cd2d5f3f16883f6a053b326`
- AlembicPlugin HEAD: `69c80dfc86bc1ea587058567f0016e48bb8dfec2`
- Alembic `vendor/AlembicCore`: `99a7cf10d82056cd860eb0a1d9544662e3735b08`
- AlembicPlugin `vendor/AlembicCore`: `99a7cf10d82056cd860eb0a1d9544662e3735b08`

Host MCP runtime status pointed at local
`AlembicPlugin/dist/bin/host-mcp.js`; the installed cache marker still records
older gitHead `c4c4d4f7f950fff5929f94d257056e828100a8be`, but the active local
source/dist contained the P9 `buildCoverageLedgerModuleAxisFromSummaries`
coverage-axis code.

## Provider And Runtime Evidence

The old P6 daemon was restarted for BiliDili before the run:

- New API/dashboard URL: `http://127.0.0.1:53605`
- New PID: `89710`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Test mode: enabled
- `ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`
- `ALEMBIC_TEST_RESCAN_DIMS=architecture`
- Generation provider from BiliDili workspace settings: `deepseek`,
  model `deepseek-v4-pro`
- Embedding env preserved for local Qwen/Qianwen route:
  `ALEMBIC_EMBED_PROVIDER=ollama`,
  `ALEMBIC_EMBED_MODEL=qwen3-embedding:0.6b`,
  `ALEMBIC_EMBED_BASE_URL=http://127.0.0.1:11434/v1`

`verify-test-environment.mjs --url http://127.0.0.1:53605 --json` returned
`ok=true`, `verdict=ready`, `processAlive=true`, and test-mode dimensions
`["architecture"]`.

## Root Safety

Source characterization for R-2:

- `AlembicCore/src/workflows/project-index/ProjectIndexPlan.ts` preserves
  full host-agent cleanup root as `input.dataRoot`, while project analysis still
  scans the real `input.projectRoot`.
- Incremental cleanup remains rooted at `input.dataRoot`.

Pre-reset target/sibling `.db` mtimes were captured for:

- target `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- sibling `/Users/gaoxuefeng/.asd/workspaces/13b22158`
- sibling `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
- sibling `/Users/gaoxuefeng/.asd/workspaces/278cdc6c`

After-run sidecar stats show writes in the target WAL
`/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/alembic.db-wal`.
No product source files were changed; `git status --short` in BiliDili returned
clean.

## Host Path Details

Host plan/closeout sequence:

1. `alembic_plan draft` for BiliDili `deepMining` orientation returned a Swift
   package profile with 163 files and 10 modules.
2. `alembic_plan confirm` for coldStart succeeded with dimension
   `architecture`, module binding `Sources`, and total recipe budget 1.
3. `alembic_bootstrap({ rebuild: true })` succeeded and returned session
   `bs-<redacted>`.
4. The first submit attempt failed on `DO_CLAUSE_NON_IMPERATIVE`.
5. The second submit attempt failed on broad evidence-gate issues.
6. The third submit used file-local facts with exact source snippets and
   succeeded with 3 recipe ids.
7. The first dimension-complete attempt failed because referenced files used
   line ranges; the gate compares bare file paths.
8. Retrying with bare repo-relative files succeeded:
   `recipesBound=3`, `qualityFeedback.totalScore=95`, `pass=true`.

Accepted host source refs:

- `BiliDili/AppCoordinator.swift`
- `BiliDili/Modules/RouterModule.swift`
- `BiliDili/Modules/NetworkModule.swift`

## Comparison Scope

The database still contained older P6 deepMining rows for target-style module ids
(`module_id` beginning with `target:`). To answer the P9 parity question without
mixing historical rows, comparison was limited to the non-target canonical module
rows touched by the host `dimension_complete` run:

- `BiliDili`
- `Packages/AOXFoundationKit`
- `Packages/AOXNetworkKit`
- `Packages/AOXPlayer`
- `Packages/AOXUIKit`
- `Sources`

Normalized fields compared:

- `project_root`
- `module_id`
- `dimension_id`
- `covered_count`
- `total_candidate_count`
- `grade`
- `exhausted`
- `exhausted_reason`
- `exhausted_source`
- `covered_source_refs`
- `uncovered_hints`
- `value_score`
- `last_round`
- `deferred`

Excluded volatile fields:

- `id`
- `created_at`
- `updated_at`

## Diff

`Test/tmp/p9-bilidili-project-index-parity-realtest-t1/inprocess-coverage-parity.json`
reports:

```json
{
  "ok": true,
  "diff": [],
  "inProcessResult": {
    "writtenCells": 6,
    "deferredCells": 0,
    "skipped": false
  }
}
```

The in-process log contains:

```text
[CoverageLedger] coverage state written (advisory, not a gate)
writtenCells=6 deferredCells=0 dimensionIds=["architecture"] lastRound=2
```

## Notes And Risks

- The host route auto-exported the managed `project-architecture` skill as part
  of normal `dimension_complete`; BiliDili git status remained clean.
- Historical P6 target-style rows remained in `coverage_ledger` after host
  bootstrap rebuild. They were excluded from this parity diff because they are a
  different module-axis population from an earlier run, not the same P9
  module/dimension set.
- The Plugin installed cache marker is stale even though local source/dist are
  P9-aligned. This did not block the host run because MCP tool execution and DB
  writes succeeded through the local dist entry, but it is worth controller
  awareness.
