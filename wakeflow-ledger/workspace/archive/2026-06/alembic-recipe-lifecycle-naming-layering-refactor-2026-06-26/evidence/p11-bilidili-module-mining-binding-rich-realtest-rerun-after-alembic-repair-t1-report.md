# P11 BiliDili module-mining binding-rich realtest rerun after Alembic repair

Verdict: BLOCKED

Task: `p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1`

Dispatch group: `p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-p1`

State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`

## Source Pins

| Repository | HEAD |
|---|---|
| Alembic | `cd98ac78c236c5355754b26aff58330871597eb8` |
| AlembicCore | `99a7cf10d82056cd860eb0a1d9544662e3735b08` |
| AlembicAgent | `99b8b33a591b0199f47cb8fc40bc939fe4a4dee5` |
| AlembicPlugin | `aee228be0082e8ddb1d4494df07e0ffedc6ea292` |
| BiliDili | `6f1bf34cf1b6daca4e08895db211939115dac868` |
| Test | `5175a1ff674fdaa5fc14f0410f38a09e1f575660` |

Relevant product repositories were clean after the run. No Alembic, AlembicCore, AlembicAgent, AlembicPlugin, BiliDili, or Test source files were edited.

## Commands And Artifacts

Raw artifacts are under `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1/`.

| Step | Command or artifact | Result |
|---|---|---|
| Build | `npm run build` in `Alembic` | exit 0 |
| Restart | `env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node Test/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --no-dev-link --no-preclean` | ready, daemon at `http://127.0.0.1:53563` |
| Verify | `verify-post-restart.json` | ready |
| Baseline | `baseline.json` | ready, SQLite ok, no open rounds/sessions |
| Entry A | `entry-a-module-mining.json` | PASS |
| Entry B first attempt | `entry-b-knowledge-rescan-module-mining.json` | helper timeout at 300s; not used as final product verdict |
| Entry B long rerun | `entry-b-knowledge-rescan-module-mining-rerun-long.json` | terminal complete, BLOCKING assertions still fail |
| Final snapshot | `final-after-entry-b-long.json` | SQLite ok, no open rounds/sessions |

Provider route stayed DeepSeek generation plus local Ollama/Qwen embeddings: `aiProvider=deepseek`, `aiModel=deepseek-v4-pro`, `embedProvider=local-ollama`, `embedModel=qwen3-embedding:0.6b`.

## Baseline

Baseline checks passed:

- BiliDili project and data root matched the authorized real route.
- Alembic dist/source proof included the accepted repair commit `cd98ac78c236c5355754b26aff58330871597eb8`.
- SQLite integrity was `ok`.
- `coverage_ledger=15`, `deep_mining_rounds=1`, `knowledge_entries=19`, `recipe_source_refs=39`.
- No open deep-mining rounds and no active BiliDili ProjectContext sessions.

## Entry A Result

Entry A PASS:

- Route: daemon `ModuleMiningWorkflow`.
- Selected module: `target:Networking:Sources/Infrastructure/Networking`.
- Selected module payload carried `dimensions=["architecture"]`, `dimensionIds=["architecture"]`, and `plannedDimensions=["architecture"]`.
- Request constraints remained module-scoped and architecture-only.
- Fan-out matched selection/cap: child count `1`, expected `1`, scale cap `1`.
- Source refs materialized: `sourceRefDeltaCount=14`, `selectedSourceRefDeltaCount=14`, `knowledgeDeltaCount=5`.
- Coverage moved for `target:Networking:Sources/Infrastructure/Networking::architecture`: `covered_count 4 -> 30`, `total_candidate_count 4 -> 30`.
- `moduleMining.coverageLedger.status="written"`, `writtenCells=1`, `measuredCells=1`, `dimensionIds=["architecture"]`.
- `deepMiningRoundDelta=0`.
- SQLite remained `ok`; no open rounds or active BiliDili sessions remained.

## Entry B Result

Entry B remains BLOCKED after the long rerun:

- Route: in-process `KnowledgeRescanWorkflow` Step 7 `moduleMining/per-module`.
- Final long rerun exited 0 without timeout and reached `analysis.status="complete"`.
- Selected test target: `target:AOXFoundationKit:Packages/AOXFoundationKit/Sources/AOXFoundationKit`.
- Workflow args requested `dimensions=["architecture","api-design"]` while `moduleDimensionTargets` explicitly targeted only `architecture`, `scaleCap=1`, `force=false`.
- Global gap analysis skipped architecture as fully covered: `executionDimensions=0`, `skippedDimensions=["architecture"]`, reason included `fully-covered existing=32 target=5`.
- The raw moduleMining result still reported `moduleMining.status="success"`, but its selected module payload had empty binding fields: `dimensionIds=[]`, `dimensions=[]`, `plannedDimensions=[]`.
- The helper analysis therefore found no selected module with planned dimensions: `selectedModules=[]`, `selectedSourceRefDeltaCount=0`.
- Source refs did materialize at the route level: `sourceRefDeltaCount=16`, `knowledgeDeltaCount=8`.
- Coverage did not move: `coverageMovedCount=0`.
- The moduleMining coverage ledger was skipped: `status="skipped"`, `reason="no-matching-source-refs"`, `writtenCells=0`, `measuredCells=0`, `dimensionIds=[]`.
- `deepMiningRoundDelta=0`.
- The long rerun cleaned the stale session left by the first timed-out attempt; final session count is 0.
- SQLite remained `ok`; no open rounds remained; provider route remained correct.

The first Entry B attempt timed out at the helper's 300s limit and left one active BiliDili session. The 900s rerun is the authoritative Entry B evidence for this report because it completed naturally and cleaned sessions.

## Blocking Conclusion

This rerun cannot pass the P11 Test card because Entry B still lacks plannedDimensions evidence and does not advance coverage for the targeted module x planned dimension cell. Entry A proves the repaired daemon route, but the dispatch package explicitly forbids using Entry A alone to accept P11.

Recommended next action: return to the Alembic source owner. The likely repair area is the `KnowledgeRescanWorkflow` moduleMining/per-module path when global gap analysis marks an explicitly targeted dimension as fully covered. The per-module `moduleDimensionTargets` need to remain bound into selected module `plannedDimensions`/`dimensionIds` and coverage ledger writes, or the controller must explicitly authorize a different test setup such as force/reset semantics.
