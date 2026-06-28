# r2-plugin-code-guard-public-schema-t1 Report

- Window: AlembicPlugin
- Task: r2-plugin-code-guard-public-schema-t1
- Dispatch group: r2-plugin-code-guard-public-schema-p1
- Commit: `bb2d192b892a80fe334912fff98f0a32b7740930`
- Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`

## Scope

This target repaired only the AlembicPlugin public MCP output contract for `alembic_code_guard`.

Changed files:

- `lib/runtime/mcp/public-tools/output.ts`
- `test/unit/AgentPublicToolsContract.test.ts`

No tool names, freeze literal values, Core source, vendor snapshots, release metadata, marketplace packaging, or R-2 cleanup ternary semantics were changed.

## Repair

`AgentCodeGuardOutputSchema` now allows a strict `data` object with only `unifiedEvolution` as an accepted public payload. That payload is the Plugin opportunistic evolution surface produced by `PluginOpportunisticEvolution`, including:

- `data.unifiedEvolution.evidenceGate.verdict` as the enum `defer-to-alembic-service | no-op | routed`
- strict `evidenceGate.reasons`
- strict producer/service/trigger surfaces
- bounded git-diff/checkpoint fields
- bounded unified evolution summary fields

The schema still rejects unknown `data` fields, so the fix does not weaken clean-output guarantees or hide unexpected keys.

## Validation

Passed:

- `npx biome check lib/runtime/mcp/public-tools/output.ts test/unit/AgentPublicToolsContract.test.ts`
- `npx vitest run test/unit/AgentPublicToolsContract.test.ts`
- `npx vitest run test/unit/AgentPublicToolsContract.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/McpCleanOutputContract.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
- `npx vitest run test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/PluginOpportunisticEvolution.test.ts test/unit/McpCleanOutputContract.test.ts test/unit/McpCoreToolsCleanOutputContract.test.ts`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run lint:repo-boundary`
- `npm run lint:core-import-boundary`
- `npm run lint:layer-boundary`
- `git diff --check`
- `git diff --cached --check`

Targeted contract coverage added:

- public `alembic_code_guard` output accepts `data.unifiedEvolution.evidenceGate.verdict`
- the MCP output projector serializes that public data without schema drift
- unknown fields under `data` still fail strict validation

Blocked or degraded validation:

- `npm run build:check` failed before Plugin typecheck at `npm run build:core`, due to sibling `../AlembicCore` uncommitted changes in `src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts` using `null` where Core currently expects `string | undefined`.
- `alembic_code_guard` MCP still failed with `unrecognized key "data"` because the installed MCP surface has not consumed this worktree fix yet; this is the defect this commit repairs in AlembicPlugin source.

## Result

AlembicPlugin commit `bb2d192b892a80fe334912fff98f0a32b7740930` repairs the R-2 public schema drift in source and tests. The public response shape keeps `data.unifiedEvolution.evidenceGate.verdict` readable and schema-valid while preserving strict clean-output validation.

Residual risk: controller should treat `npm run build:check` as pending sibling-Core unblock rather than Plugin source failure. Re-run `npm run build:check` after the parallel Core task restores `../AlembicCore` buildability.
