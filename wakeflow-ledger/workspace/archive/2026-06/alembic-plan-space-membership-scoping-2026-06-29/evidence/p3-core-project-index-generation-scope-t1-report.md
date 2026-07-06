# AlembicCore P3 Project-Index Generation Scope Report

Task: `p3-core-project-index-generation-scope-t1`
Window: `AlembicCore`
State root: `.wakeflow-active/current/alembic-plan-space-membership-scoping-2026-06-29`

## Scope Implemented

- Added optional `sourceFolders` to `ColdStartWorkflowIntent.projectAnalysis` and `ProjectAnalysisScanOptions`.
- Wired `ProjectIndexPlan` full-mode planning to resolve native ProjectScope descriptors for both member roots and the control root, then emit scan roots as member folders relative to the control root.
- Preserved single-repository fallback when no native ProjectScope exists.
- Kept host-agent full-reset cleanup rooted at `dataRoot`.
- Added a guard that refuses internal full-reset cleanup when the cleanup root points at a native ProjectScope member folder.
- Did not change `WorkspaceResolver.fromProject`, production scan floors/freeze values, P4 workspace.config reader definitions, vendor, dist, AlembicPlugin, Alembic, AlembicAgent, or AlembicDashboard.

## Files Changed

- `src/workflows/project-index/ColdStartIntent.ts`
- `src/workflows/project-index/ColdStartPlan.ts`
- `src/workflows/project-index/ProjectIndexPlan.ts`
- `src/workflows/shared/ProjectAnalysisPlanTypes.ts`
- `test/ProjectIndexWorkflowPlan.test.ts`

## Behavioral Evidence

- `ProjectIndexWorkflowPlan.test.ts` now seeds a temporary native `project-scopes.json` for projectId `ecf32806`.
- Full-mode host-agent planning from the control root emits scan `sourceFolders`:
  - `Alembic`
  - `AlembicCore`
  - `AlembicPlugin`
  - `AlembicDashboard`
  - `AlembicAgent`
- The same fixture includes `Test`, `wakeflow-ledger`, and `legacy`, and asserts they do not appear in scan roots.
- Host-agent planning from a member root (`AlembicCore`) normalizes `projectAnalysis.projectRoot` to the control root and keeps cleanup at `dataRoot`.
- Internal full-reset from a member root throws before producing a plan whose cleanup root would point at a member project root.
- No-native-scope single-repository planning keeps prior `projectRoot`, cleanup root, scan limits, and no `sourceFolders`.

## Validation

- `npx vitest run test/ProjectIndexWorkflowPlan.test.ts`: 1 file passed, 8 tests passed.
- `npx vitest run test/ProjectIndexWorkflowPlan.test.ts test/PublicHostAgentWorkflowEntrypoints.test.ts test/KnowledgeRescanWorkflowPlan.test.ts test/KnowledgeRescanIntent.test.ts`: 4 files passed, 20 tests passed.
- `npm run build:check`: passed.
- `npx biome check src/workflows/project-index/ColdStartIntent.ts src/workflows/project-index/ColdStartPlan.ts src/workflows/project-index/ProjectIndexPlan.ts src/workflows/shared/ProjectAnalysisPlanTypes.ts test/ProjectIndexWorkflowPlan.test.ts`: passed.
- `npm run lint:scope-resolution`: passed.
- `git diff --check`: passed.
- `npm test`: 148 files passed, 1437 tests passed.
- `npm run lint`: checked 665 files, passed.
- `npm run build`: passed.

## Scope/Boundary Checks

- `rg "workspaceConfigProjectScope|readProjectScopeFromWorkspaceConfig|resolveWorkspaceConfigProjectFolders|WorkspaceConfigProjectScopeOptions" src/workflows/project-index src/workflows/shared test/ProjectIndexWorkflowPlan.test.ts`: no matches.
- `git diff --name-only`: only the 5 files listed above.
- `git status --short -- vendor dist`: no output.

## Guard Result

- `alembic_code_guard` was invoked with the 5 changed files and failed with the known Alembic MCP internal schema error:
  - `data.unifiedEvolution.checkpoint.initializationSource` unrecognized.
- Local Core validation is green; the guard failure is recorded as a tool-surface blocker, not a code validation failure.

## Downstream Note

This Core task exposes full-mode scan roots on the plan contract. Existing Alembic/AlembicPlugin callers that execute scans still need their own authorized P3 tasks to consume `plan.projectAnalysis.scan.sourceFolders`; this target did not edit those repositories.
