# p1-plugin-write-gate-scope-resolution-t1 Evidence

## Result

- Status: completed
- Window: AlembicPlugin
- Task: p1-plugin-write-gate-scope-resolution-t1
- Local commit: `205944d9bb4a34547cc49709e72dda14d6d160ea`
- Commit message: `Use project-scope data roots in plugin gates`

## Scope Completed

- C12 `lib/recipe-generation/host-agent-workflows/project-data-root.ts`
  - Replaced bare `WorkspaceResolver.fromProject(projectRoot).dataRoot` with `WorkspaceResolver.fromProjectScopeRegistry(projectRoot).dataRoot`.
  - Kept explicit `projectRoot` semantics and retained the legacy container fallback with `@scope-singleroot(temporary)` annotation.
- C16 `lib/runtime/KnowledgeState.ts`
  - `inspectKnowledge(projectRoot)` now tries `WorkspaceResolver.fromProjectScopeRegistry(projectRoot)` first.
  - Retained `new WorkspaceResolver({ projectRoot })` only as annotated single-root fallback for missing native scope.
- Z3 lint/check wiring
  - Added `scripts/lint-scope-resolution.mjs`.
  - Added `lint:scope-resolution` and wired both `lint:repo-boundary` and `lint:scope-resolution` into `package.json` `check`.
  - Lint rejects bare `WorkspaceResolver.fromProject` / `WR.fromProject` in Plugin P1 scan/write paths while leaving P2/P3 runtime/parity sites outside this task.
- Tests
  - Added project-scope registry fixtures for C12 and C16.
  - Added negative/positive/annotation tests for `lint:scope-resolution`.

## Validation

- `npm run lint:scope-resolution` - passed.
- `npm run lint:repo-boundary` - passed.
- `npx vitest run --config vitest.unit.config.ts test/unit/HostAgentProjectDataRoot.test.ts test/unit/CodexKnowledgeState.test.ts test/unit/LintScopeResolution.test.ts` - passed; 3 files, 13 tests.
- `npm run build:check` - passed; Core build used `../AlembicCore @ 421a241e0cc8feddd3ff442577cfd8f6e883069d`.
- `npx biome check scripts/lint-scope-resolution.mjs` - passed.
- `npm run check` - passed. The command output proves the standard chain now runs `lint:repo-boundary` and `lint:scope-resolution`. Biome still reports existing warnings in unrelated files, but exits 0.
- Real resolver probe from AlembicPlugin checkout:
  - `dataRoot`: `~/.asd/workspaces/ecf32806`
  - `databasePath`: `~/.asd/workspaces/ecf32806/.asd/alembic.db`
  - `projectScopeId`: `project-scope-a8083fdb335c`
  - `currentFolderId`: `folder-13b22158ca25`
- `git diff --check` - passed.

## Additional Unit Sweep

- `npm run test:unit` was attempted.
- Result: failed due unrelated existing failures outside this task surface.
- Summary from runner: 149 test files total, 139 passed, 10 failed; 1724 tests total, 1680 passed, 44 failed.
- Observed failing areas include Search/Ranking BM25 constructor/index state tests, SearchEngine BM25 index tests, Prime isolation/relation-chain surface tests, ProjectIntelligenceIncrementalPlanner database resolver tests, and DataLossWorkflowGates rebuild argument coverage.
- The three task-specific files still passed inside this sweep:
  - `test/unit/HostAgentProjectDataRoot.test.ts`
  - `test/unit/CodexKnowledgeState.test.ts`
  - `test/unit/LintScopeResolution.test.ts`

## Alembic Tooling

- `alembic_prime` succeeded with `primeRef=prime-public-mqypt571-1`.
- `alembic_work` start failed with public schema/tool-surface error: unrecognized key `data`.
- `alembic_code_guard` failed with public schema/tool-surface error: unrecognized key `data.unifiedEvolution.checkpoint.initializationSource`.
- These were recorded as Alembic tool-surface blockers, not code validation failures.

## Risks And Notes

- No P2/P3 migration was started. C11/C15/C17 runtime/parity sites remain intentionally untouched.
- No vendor refresh, Alembic/AlembicAgent work, deletion/init detect-or-refuse work, or plugin cache refresh was performed.
- No push was performed.
