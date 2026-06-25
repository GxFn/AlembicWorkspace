# RG-10 Plugin Rescan Unified Evolution Diff Routing Rework 1

Date: 2026-06-22
Window: AlembicPlugin
Task: rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-t1
Dispatch group: rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-p1

## Result

Completed. AlembicPlugin commit:
`df14353cc3ef5698215e0e4373d348232a114f35`
(`fix rg10 rescan unified evolution routing`).

## Changes

- `lib/runtime/mcp/host/opportunistic-evolution-presenter.ts`
  - Stops the generic Host MCP opportunistic presenter from overwriting a tool result that already contains `unifiedEvolution`.
  - This preserves the `alembic_rescan`-owned routed surface and prevents the second post-checkpoint scan from replacing it with no-op evidence.
- `lib/recipe-generation/evolution/FileChangeHandler.ts`
  - Matches active sourceRefs by comparable file path when rows contain line ranges such as `file.swift:1-78`.
  - Repairs high-confidence rename sourceRefs using the real row key and preserves the old line range on the new path.
  - Emits public `source-modified-review-needed` generationChangeLog evidence for committed `git-head` modified events when working-tree diff content is no longer available.
  - Uses comparable file-path matching for deleted multi-ref stale handling.
- `test/unit/FileChangeHandler.test.ts`
  - Adds line-ranged rename repair coverage and committed modified-path changeLog coverage.
- `test/unit/PluginOpportunisticEvolution.test.ts`
  - Adds wrapper regression coverage proving existing rescan-owned `unifiedEvolution` is not overwritten.
- `test/unit/PlanDrivenGenerationGate.test.ts`
  - Extends the RG-10 fixture to reproduce retry-3 shape after a controlled commit with rename, modified file, and created module.
  - Asserts top-level and nested `gitDiffEvidence` match, repaired sourceRef lifecycle is public, modified path emits changeLog evidence, new-module recommendation remains, and moduleScope preserves all requested modules.

## Validation

- `npm run test -- test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts`
  - Passed: 3 files, 39 tests.
- `npm run test -- test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 1 file, 7 tests.
- `npm run test -- test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
  - Passed: 4 files, 46 tests.
- `npm run build:check`
  - Passed. Core build used `../AlembicCore @ b18754d1ff238613af8619c294787f6a4ca6d4d8`.
- `./node_modules/.bin/biome check lib/recipe-generation/evolution/FileChangeHandler.ts lib/runtime/mcp/host/opportunistic-evolution-presenter.ts test/unit/FileChangeHandler.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/PlanDrivenGenerationGate.test.ts`
  - Passed: checked 5 files, no fixes applied.
- `git diff --check`
  - Passed.
- `npm run lint`
  - Exit 0. Printed pre-existing unrelated warnings in `ClaudeCodeHostAdapter.ts` and scripts.
- `alembic_code_guard`
  - Passed: guard ref `guard-public-mqot35xr-1`, 5 files, 0 violations.

## Residual Risk And Next Step

- This task did not run the full RG-10 BiliDili Test chain, per dispatch boundary.
- The Plugin-side product blocker has focused regression coverage and a committed fix.
- Recommendation: redispatch RG-10 Test after controller accepts this repair, because the final requirement is real BiliDili end-to-end acceptance.
