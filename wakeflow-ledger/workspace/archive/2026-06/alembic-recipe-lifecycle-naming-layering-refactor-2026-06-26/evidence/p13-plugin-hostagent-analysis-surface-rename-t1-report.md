# P13 AlembicPlugin HostAgentAnalysis Surface Rename Report

Task: `p13-plugin-hostagent-analysis-surface-rename-t1`

Window: `AlembicPlugin`

Status: completed by local commit `91eebc9f88fdd073aad161fc63aa129ffe9c5630` (`refactor: rename host agent analysis surface`).

## Scope Completed

- Created `lib/runtime/host-agent/HostAgentAnalysisSurface.ts` as the real Host Agent analysis surface implementation.
- Reduced `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts` to an R1 compatibility shim exporting the same Host Agent builders/types under old `IDEAgent*` names.
- Updated cold-start and knowledge-rescan workflows to build `HostAgentAnalysis` surfaces from Core `buildHostAgentAnalysisPacketFromProjectContext`.
- Preserved response compatibility by emitting `hostAgentAnalysis` and `ideAgentAnalysis` as aliases, with matching `meta.hostAgentAnalysis` and `meta.ideAgentAnalysis`.
- Updated dimension-completion progress backfill to expose `hostAgentAnalysisProgress` while preserving `ideAgentAnalysisProgress` as the same object.
- Updated submit-knowledge linkage to expose `hostAgentAnalysisLinkage` while preserving `ideAgentAnalysisLinkage` as the same object.
- Updated MCP output allowlists and tool/schema descriptions to use Host Agent analysis wording without changing frozen tool names or input field names.
- Renamed the surface unit test to `test/unit/HostAgentAnalysisSurface.test.ts` and retained alias identity coverage for the old shim.

## Changed Files

- `lib/runtime/host-agent/HostAgentAnalysisSurface.ts`
- `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
- `lib/runtime/mcp/handlers/tool-router.ts`
- `lib/runtime/mcp/core-tools/output.ts`
- `lib/runtime/mcp/tools.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `test/unit/HostAgentAnalysisSurface.test.ts`
- `test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
- `test/unit/HostAgentProjectContextDirectSwitch.test.ts`
- `test/unit/PlanDrivenGenerationGate.test.ts`
- `test/unit/SubmitKnowledgeRouter.test.ts`

## Validation

- PASS: `npm run build:check`
  - Core build used `../AlembicCore @ edd79d26d9d539fd52e17cf67299ccdba20b4e5a`.
  - `tsc --noEmit` passed.
- PASS: `npm run test:unit -- test/unit/HostAgentAnalysisSurface.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/SubmitKnowledgeRouter.test.ts test/unit/HostAgentProjectContextDirectSwitch.test.ts test/unit/McpCleanOutputContract.test.ts`
  - 6 test files, 54 tests.
- PASS: `npx biome check` on touched files after formatting.
- PASS: `npm run lint:repo-boundary`.
- PASS: `npm run lint:core-import-boundary`.
  - Scanned 441 files and 445 `@alembic/core` imports.
- PASS: `npm run lint:layer-boundary`.
- PASS: `npm run lint:naming`.
- PASS: `npm run lint:doctrine`.
- PASS: `git diff --check` and `git diff --cached --check` before commit.
- PASS with pre-existing unrelated warnings: `npm run lint` exited 0; warnings were existing script/host-adapter Biome warnings outside this task's touched files.

## Naming And Compatibility Evidence

- `rg` found no remaining `buildIDEAgentAnalysisPacketFromProjectContext`.
- `rg` found no remaining production import from `#codex/ide-agent/IDEAgentAnalysisSurface`.
- Remaining `IDEAgent` / `ideAgentAnalysis` hits are intentional:
  - the compatibility shim in `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`;
  - dual response fields `ideAgentAnalysis`, `ideAgentAnalysisProgress`, and `ideAgentAnalysisLinkage`;
  - tests proving old shim builders are identity aliases;
  - negative assertions that old snapshot helpers remain absent.
- Frozen MCP tool names and input fields were preserved.
- `moduleMiningRoutes` was not changed and remains deferred to G6 cleanup.

## Guard And Runtime Notes

- Alembic `alembic_code_guard` was attempted for the touched file set but failed internally with `CODEX_MCP_ERROR` / `unrecognized_keys: data`; no guard pass/fail verdict was available.
- No BiliDili or installed Codex plugin runtime scenario was run in this target window. Controller/Test should run the P13 real host-agent bootstrap/rescan scenario if required for phase acceptance.
- This result does not accept the whole demand, P13 phase, G4/G6 cleanup, P14, moduleMiningRoutes deletion, or any Test scope.
