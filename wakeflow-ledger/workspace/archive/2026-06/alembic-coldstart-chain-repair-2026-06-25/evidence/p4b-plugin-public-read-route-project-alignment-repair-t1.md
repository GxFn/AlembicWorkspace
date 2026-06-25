# Target Evidence: AlembicPlugin / p4b-plugin-public-read-route-project-alignment-repair-t1

## Result

- Status: completed
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
- Commit: `4c63aa267829d8808005fad2ab74ca7356b081de`
- Task: repair Codex Host MCP public read routes so initialized projects without Recipes can still expose useful ProjectContext reads for `alembic_recipe_map`, `alembic_graph`, and `alembic_search`, with the route aligned to the caller `projectRoot`.

## Root Cause

- Tool policy exposed public ProjectContext/read routes only when knowledge was already usable, resident ProjectScope was available, or a special agent-public exception applied. After `alembic_init`/`alembic_bootstrap` but before first Recipe submit, BiliDili was `initialized_empty`, so public read tools were hidden and callers received generic `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`.
- The MCP clean-output layer projected that generic failure into `alembic-*-output-contract-mismatch`, losing the scoped project identity and falling back to `projectRoot="."` / `project:unknown`.
- Project graph naming chose the first local package from ProjectContext facts. In BiliDili this could be a subpackage such as `AOXFoundationKit`, so the public graph root could identify the subpackage instead of the actual caller project.

## Changes

- `lib/runtime/ToolPolicy.ts`
  - Added initialized public read tools for `alembic_recipe_map`, `alembic_search`, and `alembic_graph`.
  - Exposes those tools once the workspace is initialized, even when Recipe DB is still empty.
- `lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
  - Changed the public read tools' knowledge gate from `resident-project-scope` to `initialized`.
  - Left resident route policy unchanged.
- `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
  - Uses only root-scope local package manifests to name the project graph root.
  - Prevents subpackage local package names from stealing the project identity.
- `test/unit/CodexToolPolicy.test.ts`
  - Updated initialized-empty expectations to include public read tools.
- `test/unit/HostMcpServer.test.ts`
  - Added coverage that public graph reads are blocked before initialization but allowed after initialization before Recipes exist.

## Real MCP E2E Evidence

Command:

```bash
node scratch/p4b-public-read-route-alignment-probe.mjs --keep-tmp
```

Transport:

- Real stdio MCP client using `dist/bin/host-mcp.js`.
- Safe-copy source project: `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`.
- Isolated `ALEMBIC_HOME`.
- Report: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/scratch/p4b-public-read-route-alignment-probe-report.json`.

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
    "projectIdentity": {
      "projectRoot": "/var/folders/16/4kp442r52ts5vdxvq9llds7r0000gn/T/alembic-p4b-read-route-RXfF0C/BiliDili-safe",
      "fileCount": 163,
      "moduleCount": 3
    }
  },
  "publicRoutesBeforeSubmit": {
    "recipeMap": {
      "ok": true,
      "status": "partial",
      "noMismatch": true,
      "projectId": "project:bilidili-safe",
      "refs": 29,
      "recipeMounts": 0
    },
    "graphSpace": {
      "ok": true,
      "status": "partial",
      "noMismatch": true,
      "projectId": "project:bilidili-safe",
      "refs": 20,
      "relations": 40
    },
    "graphSourceSlice": {
      "ok": true,
      "status": "partial",
      "noMismatch": true,
      "projectId": "project:bilidili-safe",
      "refs": 20,
      "relations": 6
    },
    "search": {
      "ok": true,
      "status": "degraded",
      "diagnostic": "search-zero-match",
      "noMismatch": true
    }
  },
  "strictSubmit": {
    "graphRefCount": 6,
    "recipeIds": [
      "<redacted>",
      "<redacted>",
      "<redacted>"
    ],
    "completion": {
      "isBootstrapComplete": true,
      "progress": "1/1",
      "recipesBound": 3
    }
  },
  "statusAfterSubmit": {
    "knowledgeStatus": "knowledge_ready",
    "recipeCount": 3,
    "dbRecipeCount": 3,
    "databaseEntryCount": 3,
    "databaseExists": true,
    "dataRootSource": "ghost-registry"
  },
  "publicRoutesAfterSubmit": {
    "recipeMap": {
      "ok": true,
      "noMismatch": true,
      "recipeMounts": 1
    },
    "graphSpace": {
      "ok": true,
      "noMismatch": true,
      "refs": 20,
      "relations": 40
    },
    "search": {
      "ok": true,
      "noMismatch": true,
      "items": 1
    },
    "searchGet": {
      "ok": true,
      "found": true,
      "items": 1
    }
  }
}
```

The probe proves:

- plan/bootstrap counts stay real for BiliDili safe-copy.
- `recipe_map`, `graph(space)`, `graph(source-slice)`, and `search` are usable before Recipes exist.
- Public routes no longer return `output-contract-mismatch`, `projectRoot="."`, or `project:unknown`.
- `alembic_graph` provides graph refs before submit; `alembic_submit_knowledge` accepted 3 Recipes carrying 6 `graphRefs` / `sourceGraphRefs`.
- After `dimension_complete`, DB/status/read routes all read the same scoped project data.

## Validation

- `npm run build`
  - Passed.
  - Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npm run build:check`
  - Passed.
  - Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npx vitest run --config vitest.unit.config.ts test/unit/ProjectGraphTool.test.ts test/unit/ProjectContextRegion.test.ts test/unit/RecipeMapTool.test.ts test/unit/CodexToolPolicy.test.ts`
  - Passed: 4 files, 48 tests.
- `npx vitest run --config vitest.unit.config.ts test/unit/HostMcpServer.test.ts -t "allows public graph reads after initialization|blocks public read tools before initialization"`
  - Passed: 2 tests, 41 skipped by selector.
- `npx vitest run --config vitest.unit.config.ts test/unit/PluginHostMcpContract.test.ts`
  - Passed: 5 tests.
- `git diff --check`
  - Passed.

## Boundary

- Did not loosen the evidence gate.
- Did not add fake graphRefs.
- Did not revive 7-domain onboarding.
- Did not change `alembic_plan` draft/confirm contract.
- Did not change Core, Test, BiliDili, provider release scripts, or Dashboard/UI source.
