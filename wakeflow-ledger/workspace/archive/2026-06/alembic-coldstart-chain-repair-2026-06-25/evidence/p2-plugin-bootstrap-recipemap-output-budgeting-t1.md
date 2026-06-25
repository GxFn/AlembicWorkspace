# P2 AlembicPlugin Output Budgeting Evidence

Target task: p2-plugin-bootstrap-recipemap-output-budgeting-t1
Window: AlembicPlugin
Commit: 5be4be6 budget bootstrap and recipe map outputs

## Changed Files

- lib/shared/transient-transport.ts
- lib/recipe-generation/host-agent-workflows/cold-start.ts
- lib/recipe-generation/plan-tool.ts
- lib/runtime/mcp/output-contract.ts
- lib/runtime/mcp/core-tools/output.ts
- lib/service/project-knowledge-context/contracts/AlembicRecipeMapOutput.ts
- lib/service/project-knowledge-context/recipe-map/RecipeMapProvider.ts
- test/unit/HostMcpServer.test.ts
- test/unit/McpCoreToolsCleanOutputContract.test.ts
- test/unit/RecipeMapTool.test.ts

## Probe

Command: node /private/tmp/alembic-plugin-p2-output-budget-probe.mjs

Result:

- bootstrap.inlineBytes: 20316
- bootstrap.fullRefExists: true
- bootstrap.fullRefBytes: 418470
- recipeMap.inlineBytes: 19910
- recipeMap.fullRefExists: true
- recipeMap.fullRefBytes: 239355
- recipeMap.maxInlineSourceRefs: 0

## Validation

- npm run test:unit -- test/unit/RecipeMapTool.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts
  - 2 files passed
  - 22 tests passed
- npm run test:unit -- test/unit/HostMcpServer.test.ts -t "Codex host-agent bootstrap runs"
  - 1 test passed
  - 41 tests skipped by filter
- npm run build:check
  - passed
  - Core build used ../AlembicCore @ 9fa3b0f025dd063d59d757b1eac0e6f73cfbff93
- git diff --check
  - passed with no output
- git diff -- lib | rg -n "recipeCount|evidenceGate|candidateDimensions|fullTreeRef"
  - no matches

## Guard

alembic_status knowledge returned ready.

alembic_code_guard was attempted with the changed-file list, but the tool returned a
clean-output schema internal error instead of code findings:

Unrecognized key: "data"

## Notes

- recipe_map has both small-output and large-output test coverage.
- bootstrap large-output path is covered through HostMcpServer and the non-MCP probe.
- A single-dimension real HostMcpServer bootstrap still exceeds the inline threshold before budgeting because P1 final response data includes large plan/gate/briefing detail; it correctly takes the fullBriefingRef path.
