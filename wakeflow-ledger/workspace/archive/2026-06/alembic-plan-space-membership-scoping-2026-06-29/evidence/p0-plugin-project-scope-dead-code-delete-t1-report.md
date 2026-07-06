# p0-plugin-project-scope-dead-code-delete-t1 Evidence

Status: completed
Window: AlembicPlugin
Task: p0-plugin-project-scope-dead-code-delete-t1
Commit: 8fe639675637bed4a9e857a2f74ce39c86360c33

## Scope Completed

- Deleted `lib/service/project-knowledge-context/project/ProjectScopeFolders.ts`.
- Removed only `workspace.config.json` from the default graph exploration basename skip list in `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`.
- Did not consume the new Core loader, migrate `fromProject` sites, refresh `vendor/AlembicCore`, touch write-side chokepoints, or proceed to P1.

## Changed Files

- `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- `lib/service/project-knowledge-context/project/ProjectScopeFolders.ts`

## Validation

- Import/dead-code scan in AlembicPlugin `lib/` and `test/` for `ProjectScopeFolders`, `resolveProjectScopeSourceFolders`, and `ProjectScopeSourceFolder`: no matches.
- Cross-workspace import scan for `from .*ProjectScopeFolders`, `ProjectScopeFolders.js`, `project/ProjectScopeFolders`, `resolveProjectScopeSourceFolders`, and `ProjectScopeSourceFolder`, excluding `vendor/`, `dist/`, `node_modules/`, and `.git/`: no matches.
- `rg -n "workspace\\.config\\.json" lib/service/project-knowledge-context/project/ProjectGraphProvider.ts test lib`: only `test/unit/ProjectGraphTool.test.ts:500` remains, preserving the existing fixture reference and proving the target line is gone.
- `git diff --check` and `git diff --cached --check`: passed before commit.
- `npm run build:check`: passed. Core build used `../AlembicCore @ 3a69cad9d425f5e287b7b84d24dc7ad90aacb126`.
- `npm run lint:repo-boundary`: passed. Repository boundary check passed; `@escape-hatch` count `0 / 75`.
- `npx vitest run --config vitest.unit.config.ts test/unit/ProjectGraphTool.test.ts`: passed, 1 file / 19 tests.

## Alembic Guard

- `alembic_status` for AlembicPlugin returned `ready`, trusted project root, knowledge usable.
- `alembic_code_guard` was attempted with the two explicit changed files and the Wakeflow task intent.
- Guard failed with Alembic MCP internal schema error: `data.unifiedEvolution.checkpoint.initializationSource` unrecognized.
- This is recorded as a guard tool-surface failure, not a code validation failure; source validation above remained green.

## Residual Risks

- No code residual risk found in this package.
- Controller should treat the Alembic guard failure as a tool-surface issue already seen in the accepted Core P0 evidence.
- P1 and later migration work remains out of scope for this task.
