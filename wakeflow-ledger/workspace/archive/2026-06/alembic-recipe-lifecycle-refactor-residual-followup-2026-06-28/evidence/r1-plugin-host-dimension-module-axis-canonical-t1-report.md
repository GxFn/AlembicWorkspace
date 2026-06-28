# r1-plugin-host-dimension-module-axis-canonical-t1 report

## Summary

AlembicPlugin commit `4a47538` completes the Plugin-side R-1 host consumer fix.
Host rescan and dimension-completion coverage writers now feed generic parent
module projections through a shared pre-Core filter, then rely on Core commit
`cf5317efbef3f9e80cd3bd4c516272acdcf9923a` canonical module-axis behavior via
`@alembic/core/host-agent-workflows` (`buildCoverageLedgerModuleAxisFromSummaries`).

The fix keeps explicit `target:*` module ids, preserves no-path fallback behavior
inside the Core builder, and prevents generic parent containers such as `Sources`
from becoming false `target:Sources:*` cells when more specific target modules
exist.

## Changed Files

- `lib/recipe-generation/host-agent-workflows/coverage-module-axis.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/recipe-generation/host-agent-workflows/dimension-completion.ts`
- `test/unit/RescanCoverageModuleAxis.test.ts`
- `test/unit/HostAgentDimensionCompletionWorkflow.test.ts`

## Verification

- PASS: `npx biome check lib/recipe-generation/host-agent-workflows/coverage-module-axis.ts lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts lib/recipe-generation/host-agent-workflows/dimension-completion.ts test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
- PASS: `npx vitest run test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts`
- PASS: `npx vitest run test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/CoverageLedgerTargetAxis.test.ts test/unit/CanonicalModuleAxis.test.ts test/unit/CoverageLedgerWiring.test.ts`
- PASS: `npx tsc --noEmit`
- PASS with existing warnings only: `npm run lint`
- PASS: `npm run lint:repo-boundary`
- PASS: `npm run lint:core-import-boundary`
- PASS: `npm run lint:layer-boundary`
- PASS: `npm run build:check` (Core build used `../AlembicCore @ cf5317efbef3f9e80cd3bd4c516272acdcf9923a`)
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Guard

`alembic_code_guard` was attempted on the changed files and failed before code
review with the known installed MCP output-contract issue:

```text
CODEX_MCP_ERROR / unrecognized key "data"
```

This matches the R-2 source fix already committed in AlembicPlugin but not yet
loaded into the installed MCP runtime. It is recorded as a tool-surface blocker,
not as source validation failure.

## Boundaries

- No Core source, vendor snapshot, release metadata, marketplace asset, tool name,
  freeze literal, real BiliDili data, or R-2 code_guard schema logic was changed.
- No push was performed.
- Final R-1 acceptance still requires downstream non-empty ProjectMap
  host-vs-in-process parity evidence and BiliDili no-regression evidence from the
  owning controller/Test flow.
