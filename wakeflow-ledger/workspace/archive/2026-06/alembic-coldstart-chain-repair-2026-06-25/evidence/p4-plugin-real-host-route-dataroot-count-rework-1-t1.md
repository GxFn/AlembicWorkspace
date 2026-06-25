# Target Evidence: AlembicPlugin / p4-plugin-real-host-route-dataroot-count-rework-1-t1

## Result

- Status: completed
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Commit: `458fda52430f44b180563ba2429fd4d7aedaa4ce`
- Task: repair real Codex Host MCP cold-start projectRoot/dataRoot/count/read-route path for BiliDili safe-copy validation.

## Root Cause

- `runPlanGatedColdStart()` built ProjectContext analysis without passing `planGate.moduleScope`, so confirmed plan scopes could be dropped by the default seed ordering.
- ProjectContext can expose top-level source roots such as `Sources` differently from package targets. Even when source facts existed, `buildProjectContextMissionBriefing()` did not always project those plan-scoped source roots into `briefing.targets`, so the Agent-facing briefing could miss useful per-scope counts.

## Changes

- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
  - Passes `input.planGate.moduleScope` into `buildHostAgentProjectContextAnalysis()`.
  - Adds `attachPlanScopeTargetCounts()` to merge verified `sourceFileFacts` into cold-start briefing targets for each confirmed module scope.
  - Existing targets are updated with real `modulePath`, `fileCount`, and `keyFiles`; missing scopes such as `Sources` are added only when real source files exist.
- `lib/recipe-generation/host-agent-workflows/project-context-analysis.ts`
  - Adds module-scope fallback seeds from real source facts when ProjectContext did not provide a matching native seed.
  - The fallback runs only for explicit `moduleScope`.
- `test/unit/HostAgentProjectContextDirectSwitch.test.ts`
  - Adds a BiliDili-like `Sources` fixture.
  - Verifies `moduleScope` includes `Sources` with owned files and that briefing targets get the verified file count.

## Real MCP E2E Evidence

Command:

```bash
node scratch/p4-real-host-mcp-e2e-probe.mjs --keep-tmp
```

Transport:

- Real stdio MCP client using `dist/bin/host-mcp.js`.
- Safe-copy source project: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
- Isolated `ALEMBIC_HOME`.
- Report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/p4-real-host-mcp-e2e-probe-report.json`.

Key result:

```json
{
  "ok": true,
  "draft": {
    "fileCount": 163,
    "moduleCount": 10,
    "candidateDimensionCount": 25
  },
  "bootstrap": {
    "projectMetaFileCount": 163,
    "projectMetaModuleCount": 3,
    "projectIdentityFileCount": 163,
    "projectIdentityModuleCount": 3,
    "targetFileCounts": {
      "Packages/AOXFoundationKit": 22,
      "Packages/AOXNetworkKit": 30,
      "Sources": 61
    }
  },
  "completion": {
    "isBootstrapComplete": true,
    "progress": "1/1",
    "recipesBound": 3
  },
  "status": {
    "initialized": true,
    "knowledgeStatus": "knowledge_ready",
    "recipeCount": 3,
    "dbRecipeCount": 3,
    "databaseEntryCount": 3,
    "databaseExists": true,
    "dataRootSource": "ghost-registry"
  },
  "recipeMap": {
    "ok": true,
    "recipeMounts": 1,
    "recipeRollups": 3,
    "refs": 29
  },
  "graph": {
    "ok": true,
    "nodes": 2,
    "relationsSummary": "summary reported 40 relations",
    "refs": 20
  },
  "search": {
    "ok": true,
    "items": 1,
    "detailRefs": 1
  },
  "searchGet": {
    "ok": true,
    "found": true,
    "items": 1
  }
}
```

No `output-contract-mismatch`, no `projectRoot "."`, and no `project:unknown` appeared in the public read routes.

## Validation

- `npm run build`
  - Passed.
  - Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npm run build:check`
  - Passed.
  - Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npx vitest run --config vitest.unit.config.ts test/unit/HostAgentProjectContextDirectSwitch.test.ts`
  - Passed: 4 tests.
- `npx vitest run --config vitest.unit.config.ts test/unit/HostAgentProjectContextDirectSwitch.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/PlanSelectionGateStateless.test.ts test/unit/PlanDraftTwoBlockProjector.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 5 files, 31 tests.
- `git diff --check`
  - Passed.

## Guard Note

`alembic_code_guard` was attempted against the changed files, but the current tool surface failed before producing guard findings:

```json
{
  "ok": false,
  "status": "failed",
  "summary": "[{\"code\":\"unrecognized_keys\",\"keys\":[\"data\"],\"path\":[],\"message\":\"Unrecognized key: \\\"data\\\"\"}]",
  "error": {
    "code": "CODEX_MCP_ERROR"
  }
}
```

The guard failure is recorded as a tool-surface/schema issue, not as code validation evidence.

## Boundary

- Did not loosen evidence gate.
- Did not change `alembic_plan` draft/confirm contract.
- Did not change Core.
- Did not change provider/runtime.
- Did not touch Test, BiliDili, or Dashboard/UI source.
