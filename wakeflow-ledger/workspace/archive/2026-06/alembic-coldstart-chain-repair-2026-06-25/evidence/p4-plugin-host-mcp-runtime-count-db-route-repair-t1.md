# P4 AlembicPlugin Host MCP Runtime Count/DB Route Repair Evidence

## Task

- targetWindow: AlembicPlugin
- taskId: p4-plugin-host-mcp-runtime-count-db-route-repair-t1
- dispatchGroup: p4-plugin-host-mcp-runtime-count-db-route-repair-p1
- stateRoot: `.wakeflow-active/current/alembic-coldstart-chain-repair-2026-06-25`

## Root Cause

The current source/dist route already contains the P3 ProjectContext source-file-facts repair and the Host MCP scoped route is able to write/read the same project data root. The observed Test failure is consistent with the real Codex host MCP process using a stale pre-reload runtime: the installed cache is local-mcp mode and points at `AlembicPlugin/dist/bin/host-mcp.js`, but the already-running host transport is not restarted by cache sync.

## Actions

- Rebuilt AlembicPlugin runtime via canonical local-dev reload.
- Rewrote installed Codex plugin caches in local-mcp mode for both cache roots:
  - `~/.codex/plugins/cache/gxfn/alembic/0.2.0`
  - `~/.codex/plugins/cache/gxfn/alembic-codex/0.2.0`
- Fresh MCP probe after reload succeeded for projectRoot `BiliDili`, with `entryMode=local-dev-direct-dist`, `runtimeReadback.projectRoot=BiliDili`, and blocked legacy fallback identities.
- Added an ignored scratch probe to exercise the real HostMcpServer path without using the live MCP transport:
  - `AlembicPlugin/scratch/p4-host-mcp-db-route-probe.mjs`
  - report: `AlembicPlugin/scratch/p4-host-mcp-db-route-probe-report.json`

## Host Route Probe Evidence

`node scratch/p4-host-mcp-db-route-probe.mjs` after reload:

- draft: `fileCount=8`, `moduleCount=4`, `candidateDimensionCount=25`
- bootstrap projectIdentity: `fileCount=8`, `moduleCount=4`, `primaryLanguage=swift`
- submit: 3 source-grounded Recipe ids created through `alembic_submit_knowledge`
- dimension_complete: `progress=1/1`, `isBootstrapComplete=true`, `recipesBound=3`
- database: `databaseExists=true`
- status: `recipeCount=3`, `dbRecipeCount=3`, `databaseEntryCount=3`
- recipe_map: `ok=true`, `status=partial`, `recipeMountCount=2`, `recipeRollupCount=3`
- graph: `ok=true`, `status=partial`, `queryKind=space`, `nodes=2`, `relations=23`, `refs=11`
- search: `ok=true`, `items=2`, `detailRefs=2`
- search get: `ok=true`, `status=ready`, `found=true`, `items=1`

## Verification

- `npm run dev:codex-plugin:reload -- --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili` PASS
  - build local Codex MCP runtime PASS
  - prepare packaged marketplace shell PASS
  - rewrite installed cache to local dist MCP PASS
  - fresh MCP probe after reload PASS
  - reload report: `AlembicPlugin/scratch/codex-plugin-dev-reload-report.json`
  - probe report: `AlembicPlugin/scratch/codex-plugin-dev-reload-probe-report.json`
- `npm run build:check` PASS
- `npm run test:unit -- test/unit/PlanDraftTwoBlockProjector.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/SubmitKnowledgeRouter.test.ts test/unit/HostAgentRecipeEvidenceGate.test.ts` PASS
  - 4 files, 37 tests passed
- `node scratch/p4-host-mcp-db-route-probe.mjs` PASS
- `git diff --check` PASS
- `git status --short` clean

## Attempted Broader Tests

`npm run test:unit -- test/unit/HostMcpServer.test.ts test/unit/AlembicPlanTool.test.ts test/unit/PlanDraftTwoBlockProjector.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts test/unit/SubmitKnowledgeRouter.test.ts test/unit/HostAgentRecipeEvidenceGate.test.ts` was attempted and failed in two stale suites unrelated to this P4 runtime route:

- `test/unit/AlembicPlanTool.test.ts` still asserts retired plan persistence/get fields and old confirm failure paths.
- `test/unit/HostMcpServer.test.ts` still asserts old visible tool lists and old structured output locations.

The P4 route-relevant suites listed above passed.

## Commit / Changed Files

- Current AlembicPlugin HEAD: `b94cc366c4921bc189bfb88f32a4816208466937`
- New tracked source commit: none
- Tracked working tree: clean
- Reason: no source repair was required after route inspection and probes; the fix was rebuild + installed cache reload + fresh runtime proof.

## Residual Risk

The plugin reload does not stop or replace an already-open Codex MCP transport. Fresh MCP startup is proven correct, but if the user's current Codex session still reuses an old host MCP process, the user must restart/reconnect Codex before a live MCP retest can prove the same result in that session.
