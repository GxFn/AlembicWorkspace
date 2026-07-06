# P2 Core Load-Bearing Consumers Test Migration Report

## Scope

- Task: `p2-core-load-bearing-consumers-test-migration-t1`
- Repository: `AlembicCore`
- Commit: `3308c4f Migrate ProjectContext scope consumers`
- Scope authority: Core side of Design §12.P2 only.

## Changed Files

- `src/service/project-context/space/space.ts`
- `src/service/project-context/repo/repo.ts`
- `src/core/ast/ProjectGraph.ts`
- `src/service/source-graph/SourceGraphIndexer.ts`
- `test/ProjectScopeContracts.test.ts`
- `test/ProjectContextProjectSpace.test.ts`
- `test/ProjectContextEndToEnd.test.ts`
- `test/SourceGraphIndexer.test.ts`

## Implementation Summary

- `space.ts` now preserves explicit `payload.sourceFolders` priority, then resolves native ProjectScope data from the registry instead of reading `workspace.config.json`.
- `space.ts` supports a control-root descriptor match from the native registry without changing the P0 loader rule that the control root is not itself a source folder.
- `repo.ts` resolves ProjectScope identity through the native registry using the requested repo root first, then the control root descriptor.
- `ProjectGraph.ts` removed the `workspaceConfigProjectScope` option and the old `readProjectScopeFromWorkspaceConfig` fallback block. The `options.projectScope` descriptor/string path remains.
- `SourceGraphIndexer.ts` removed the `workspaceConfigProjectScope` option and the old fallback block. The `projectScopeDescriptor` path remains.
- Core tests now use native `project-scopes.json` fixtures or explicit descriptor paths instead of `workspace.config.json` fixtures. The multi-folder coverage and single-folder fallback coverage both remain.

## Validation

- `npx biome check --write src/service/project-context/space/space.ts src/service/project-context/repo/repo.ts src/core/ast/ProjectGraph.ts src/service/source-graph/SourceGraphIndexer.ts test/ProjectScopeContracts.test.ts test/ProjectContextProjectSpace.test.ts test/ProjectContextEndToEnd.test.ts test/SourceGraphIndexer.test.ts` -> passed; fixed formatting in 2 files.
- `npx vitest run test/ProjectScopeContracts.test.ts test/ProjectContextProjectSpace.test.ts test/ProjectContextEndToEnd.test.ts test/SourceGraphIndexer.test.ts` -> 4 files passed, 25 tests passed.
- `npm run build:check` -> passed.
- `npm run lint:scope-resolution` -> passed.
- `npm test` -> 148 files passed, 1432 tests passed.
- `npm run lint` -> passed, 665 files checked.
- `npm run build` -> passed.
- `git diff --check` -> passed.
- `git diff --cached --check` -> passed before commit.

## Grep Proofs

- `rg -n "workspaceConfigProjectScope" src test package.json config scripts || true` -> no matches.
- `rg -n "readProjectScopeFromWorkspaceConfig" src/service/project-context/space/space.ts src/service/project-context/repo/repo.ts src/core/ast/ProjectGraph.ts src/service/source-graph/SourceGraphIndexer.ts test/ProjectScopeContracts.test.ts test/ProjectContextProjectSpace.test.ts test/ProjectContextEndToEnd.test.ts test/SourceGraphIndexer.test.ts || true` -> no matches.
- `rg -n "readProjectScopeFromWorkspaceConfig" src test package.json config scripts || true` -> only `src/shared/index.ts` export and `src/shared/ProjectScope.ts` definition remain, intentionally left for later P4 deletion work.

## Check Result

- `npm run check` passed through:
  - `build:check`
  - `lint:public-api-boundary`
  - `lint:layer-contract`
  - `lint:consumer-core-imports`
  - `lint:scope-resolution`
  - `smoke:public-api`
  - `check:output-budgets`
  - `check:space-edges`
  - `lint:doctrine`
- `npm run check` stopped at pre-existing `lint:naming` violations in untouched files:
  - `src/project-context-capabilities.ts`
  - `src/recipe-context-capabilities.ts`
  - `src/test-fixtures.ts`
- Full `npm test` and `npm run lint` were run separately and passed.

## Residual Risks

- `alembic_code_guard` could not complete because the Alembic MCP guard route returned the existing internal schema error for `data.unifiedEvolution.checkpoint.initializationSource`. Local repository validation is green, so this is recorded as tool-surface risk rather than code failure.
- Plugin-side P2 `collectPlanProjectContext`, `focusModules`, and project-source-facts migration were not changed here; they remain outside this Core task.
- P3 host/runtime parity, P4 definition deletion/init detect-or-refuse, vendor refresh, and freeze changes were not started.
