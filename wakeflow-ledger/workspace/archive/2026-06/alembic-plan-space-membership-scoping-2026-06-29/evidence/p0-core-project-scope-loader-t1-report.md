# p0-core-project-scope-loader-t1 Evidence

Status: completed
Window: AlembicCore
Task: p0-core-project-scope-loader-t1
Commit: 3a69cad Add project scope registry loader

## Scope Completed

- Added the native Core ProjectScope registry loader in `src/shared/ProjectScope.ts`:
  - `PROJECT_SCOPE_REGISTRY_FILENAME`
  - `resolveProjectScopeRegistryPath`
  - `readProjectScopeRegistryDocument`
  - `loadProjectScopeForFolder`
- Exported the new loader surface from `src/shared/index.ts` while preserving `readProjectScopeFromWorkspaceConfig`.
- Added `WorkspaceResolver.fromProjectScopeRegistry` as an explicit registry chokepoint.
- Added focused loader tests in `test/ProjectScopeRegistryLoader.test.ts`.

## Files Changed

- `src/shared/ProjectScope.ts`
- `src/shared/index.ts`
- `src/shared/WorkspaceResolver.ts`
- `test/ProjectScopeRegistryLoader.test.ts`

## Boundary Checks

- `WorkspaceResolver.fromProject` body was not changed.
- `readProjectScopeFromWorkspaceConfig` remains exported and remains present in these named consumers:
  - `src/shared/index.ts`
  - `src/service/project-context/space/space.ts`
  - `src/core/ast/ProjectGraph.ts`
  - `src/service/source-graph/SourceGraphIndexer.ts`
  - `src/service/project-context/repo/repo.ts`
- `rg -n "static fromProject\\(|static fromProjectScopeRegistry\\(" src/shared/WorkspaceResolver.ts` found one `fromProject` and one `fromProjectScopeRegistry`.
- Did not delete the workspace.config reader or definition block.
- Did not migrate the 19 downstream call sites.
- Did not edit vendor paths.
- Did not change freeze or floor behavior.

## Validation

- `npx biome check --write src/shared/ProjectScope.ts src/shared/index.ts src/shared/WorkspaceResolver.ts test/ProjectScopeRegistryLoader.test.ts`: passed; fixed formatting in 3 files.
- `npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'empty'`: 1 test passed, 4 skipped.
- `npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'member'`: 1 test passed, 4 skipped.
- `npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'nested'`: 1 test passed, 4 skipped.
- `npx vitest run test/ProjectScopeRegistryLoader.test.ts test/WorkspaceResolver.test.ts test/ProjectScopeContracts.test.ts`: 3 files passed, 24 tests passed.
- `npm run build:check`: passed.
- `npm run build`: passed.
- Dynamic import loader probe:
  - Command used `import('./dist/shared/index.js')`.
  - Output: `{"pid":"ecf32806","folders":5,"ctrlNull":true}`.
- Dynamic import resolver probe:
  - Command used `import('./dist/shared/index.js')`.
  - Output: `{"scopedPid":"ecf32806","folders":5,"currentFolderId":"folder-94c596418c32","scopedDataRootHasPid":true,"singleHasScope":false,"singleDataRootIsSource":true}`.
- `npm test`: 146 files passed, 1427 tests passed.
- `git diff --check`: passed.
- Final `npx biome check src/shared/ProjectScope.ts src/shared/index.ts src/shared/WorkspaceResolver.ts test/ProjectScopeRegistryLoader.test.ts`: passed; no fixes applied.

## Alembic Guard

- `alembic_status` returned ready for the AlembicCore project, with initialized but empty/unusable local knowledge.
- `alembic_code_guard` was attempted twice:
  - first with task intent metadata and explicit files;
  - second with only `projectRoot` and explicit files.
- Both guard attempts failed with the same Alembic MCP internal schema error:
  - `data.unifiedEvolution.checkpoint.initializationSource` unrecognized.
- This is recorded as an Alembic guard tool-surface failure. It was not treated as a Core code validation failure.

## Next

Return to controller review for acceptance or follow-up dispatch decisions.
