# Target Evidence Report: p4-core-delete-workspace-config-reader-v2-schema-t1

## Scope

- Window: AlembicCore
- Task: p4-core-delete-workspace-config-reader-v2-schema-t1
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore`
- Commit: `31912fe` (`Delete workspace config scope reader`)
- Branch: `main`
- Push: not performed

## Implementation

- Removed the legacy workspace config project-scope reader surface from `src/shared/ProjectScope.ts`:
  - `WorkspaceConfigProjectScopeOptions`
  - `readProjectScopeFromWorkspaceConfig`
  - `createProjectScopeFromWorkspaceConfig`
  - `resolveWorkspaceConfigProjectFolders`
  - ProjectScope-local helpers for workspace-config repositories/folders.
- Removed `readProjectScopeFromWorkspaceConfig` from `src/shared/index.ts`.
- Added `WorkspaceRuntimeConfigSchema` and `WorkspaceRuntimeConfig` for v2 `.asd/config.json` in `src/shared/schemas/config.ts`.
- Re-exported the runtime schema/type from `src/config.ts`.
- Routed `ProjectMarkers` `.asd/config.json` reads through `WorkspaceRuntimeConfigSchema` for `core.subRepoDir` / `core.subRepoUrl`.
- Added `test/WorkspaceRuntimeConfigSchema.test.ts` covering valid v2 config, facade export, stale field rejection, and ProjectMarkers fallback behavior.

## Validation

- `npm test -- --run test/WorkspaceRuntimeConfigSchema.test.ts test/ProjectScopeContracts.test.ts test/WorkspaceResolver.test.ts`
  - Passed: 3 test files, 24 tests.
- `npm run build:check`
  - Passed.
- Exact deletion grep:
  - Command: `rg -n "workspace\.config\.json|readProjectScopeFromWorkspaceConfig|resolveWorkspaceConfigProjectFolders|WorkspaceConfigProjectScopeOptions|workspaceConfigProjectScope|repoNames" src test --glob '!vendor/**' --glob '!dist/**' --glob '!node_modules/**'`
  - Result: no matches.
- ProjectScope helper deletion grep:
  - Command: `rg -n "createProjectScopeFromWorkspaceConfig|normalizeWorkspaceConfigRepositories|isInternalRepository|normalizeStringArray|resolveWorkspaceConfigFolderPath" src/shared/ProjectScope.ts`
  - Result: no matches.
- `npm run lint:scope-resolution`
  - Passed: `scope-resolution lint passed`.
- `git diff --check`
  - Passed.
- `npm run lint`
  - Passed: 666 files checked.
- `npm test`
  - Passed: 149 test files, 1442 tests.
- `npm run check`
  - Partial: passed through build, public API boundary, layer contract, consumer imports, scope resolution, public API smoke, output budgets, space edges, and doctrine.
  - Stopped at pre-existing `lint:naming` failures in untouched files:
    - `src/project-context-capabilities.ts`
    - `src/recipe-context-capabilities.ts`
    - `src/test-fixtures.ts`
- `alembic_code_guard`
  - Blocked by Alembic MCP internal schema error:
    - `data.unifiedEvolution.checkpoint.initializationSource` was reported as an unrecognized key.

## Boundary Checks

- No edits outside AlembicCore product source/tests.
- `src/shared/WorkspaceResolver.ts` was not modified.
- `WorkspaceResolver.fromProject` / `WorkspaceResolver.fromProjectScopeRegistry` behavior remains covered by targeted `test/WorkspaceResolver.test.ts` and full test suite.
- Core native project-scope registry APIs remain exported.
- Worktree was clean after commit `31912fe`.
