# p1-core-scope-resolution-write-guard-t1 Evidence

Status: completed
Window: AlembicCore
Task: p1-core-scope-resolution-write-guard-t1
Commit: 421a241 Wire scope registry data roots

## Scope Completed

- Migrated Core scan/write dataRoot resolution to `WorkspaceResolver.fromProjectScopeRegistry`:
  - `src/core/discovery/DiscovererRegistry.ts` C1/C2
  - `src/shared/resolveProjectRoot.ts` C3/C4
  - `src/infrastructure/io/WriteZone.ts` C6
- Preserved intentional single-root sites with explicit annotations:
  - `src/daemon/DaemonState.ts` C5
  - `src/shared/WorkspaceSettingsStore.ts` C7
- Added `DatabaseConnection` write-side guard that throws when a resolver with `projectScope` would otherwise redirect an excluded member root to `/tmp/alembic-dev/alembic.db`.
- Added `scripts/lint-scope-resolution.mjs` and wired `lint:scope-resolution` into `package.json` `check`.
- Added targeted tests for:
  - Database guard loud-fail.
  - `resolveDataRoot` / `WriteZone.fromProjectRoot` native ProjectScope registry fallback.
  - scope-resolution lint negative and annotated positive fixtures.
- Updated `config/public-api-boundary.json` `./shared` narrowness baseline from 189 to 190 with an inline policy note because the controller-authorized P0/P1 native ProjectScope registry loader is now part of the `./shared` runtime surface.

## Files Changed

- `config/public-api-boundary.json`
- `package.json`
- `scripts/lint-scope-resolution.mjs`
- `src/core/discovery/DiscovererRegistry.ts`
- `src/daemon/DaemonState.ts`
- `src/infrastructure/database/DatabaseConnection.ts`
- `src/infrastructure/io/WriteZone.ts`
- `src/shared/WorkspaceSettingsStore.ts`
- `src/shared/resolveProjectRoot.ts`
- `test/DatabaseConnectionScopeGuard.test.ts`
- `test/LintScopeResolution.test.ts`
- `test/resolveProjectRoot.test.ts`

## Boundary Checks

- Did not change `src/shared/WorkspaceResolver.ts`; `static fromProject(` and `static fromProjectScopeRegistry(` remain one each.
- Did not change `src/shared/ProjectScope.ts`; `readProjectScopeFromWorkspaceConfig`, `WorkspaceConfigProjectScopeOptions`, and `createProjectScopeFromWorkspaceConfig` remain present.
- Did not touch Plugin, Alembic, AlembicAgent, AlembicDashboard, vendor, or P2/P3/P4 files.
- Core worktree was clean after commit.

## Validation

- `npx biome check --write ...changed source/test/script files...`: passed; no fixes applied.
- `npm run lint:scope-resolution`: passed.
- `npx vitest run test/DatabaseConnectionScopeGuard.test.ts test/resolveProjectRoot.test.ts test/LintScopeResolution.test.ts test/ProjectScopeRegistryLoader.test.ts test/WorkspaceResolver.test.ts`: 5 files passed, 22 tests passed.
- `npm run build:check`: passed.
- `npm run build`: passed.
- `npm run lint:public-api-boundary`: passed after recording the `./shared` ProjectScope loader surface baseline.
- `npm test`: 148 files passed, 1432 tests passed.
- `npm run lint`: passed; 665 files checked.
- Dynamic import probe:
  - Command used `import('./dist/shared/index.js')`.
  - Output: `{"databasePath":"/Users/gaoxuefeng/.asd/workspaces/ecf32806/.asd/alembic.db","hasPid":true,"notTmp":true,"notCoreGhost":true,"notPluginGhost":true}`.
- Negative lint fixture proof:
  - Temporary scan/write fixture with bare `WorkspaceResolver.fromProject(...)` returned status 1.
  - Output summary: `{"status":1,"stderr":true,"file":true}`.
- `git diff --cached --check`: passed before commit.
- `git diff --check`: passed before commit.
- `node -e "JSON.parse(...config/public-api-boundary.json...)"`: passed.

## Check Notes

- `npm run check` was attempted.
- First attempt failed because `npm run build` was running in parallel and public API boundary read `dist/` before the build finished. This was a command-order artifact, not a source failure.
- Second attempt passed through:
  - `build:check`
  - `lint:public-api-boundary`
  - `lint:layer-contract`
  - `lint:consumer-core-imports`
  - `lint:scope-resolution`
  - `smoke:public-api`
  - `check:output-budgets`
  - `check:space-edges`
  - `lint:doctrine`
- The second `npm run check` stopped at existing `lint:naming` violations in untouched files:
  - `src/project-context-capabilities.ts`
  - `src/recipe-context-capabilities.ts`
  - `src/test-fixtures.ts`
- Those files are not part of this P1 Core task diff; renaming public facade files is out of scope for this package.
- Because `check` stops at `lint:naming`, `npm test` and `npm run lint` were run separately and both passed.

## Alembic Guard

- `alembic_status` returned ready for AlembicCore, with initialized but empty/unusable local knowledge.
- `alembic_code_guard` was attempted with explicit changed files and task intent metadata.
- Guard failed with the same Alembic MCP internal schema error seen in P0:
  - `data.unifiedEvolution.checkpoint.initializationSource` unrecognized.
- This is recorded as an Alembic guard tool-surface failure. It was not treated as a Core code validation failure.

## Next

Return to controller review for acceptance or follow-up dispatch decisions.
