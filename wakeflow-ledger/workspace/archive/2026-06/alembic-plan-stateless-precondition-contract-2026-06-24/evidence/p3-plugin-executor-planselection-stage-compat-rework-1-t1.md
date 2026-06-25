# P3 Plugin Executor planSelection Stage Compatibility Rework Evidence

Task: `p3-plugin-executor-planselection-stage-compat-rework-1-t1`
Window: `AlembicPlugin`
Commit: `f8d5fd196e6f64fafc5adc5503574c09a8f6aff1`

## Scope

- Fixed only the controller-found stage compatibility gap.
- `alembic_bootstrap` now accepts only cold-start `planSelection`.
- `alembic_rescan` now accepts only deep-mining/module-mining `planSelection`.
- `resolvePlanGenerationGate` now resolves the executor/requested/default stage before validating `planSelection`; the selection no longer overrides the executor stage.
- P4 checkpoint/SOP/missionBriefing and P5 BiliDili e2e were not touched.

## Changed Files

- `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/test/unit/PlanSelectionGateStateless.test.ts`

## Dist Probe Result

The controller failing combinations now reject:

```json
{
  "bootstrapDeepSchema": false,
  "bootstrapGateOk": false,
  "bootstrapGateReason": "planSelection.generationStage deepMining does not match requested coldStart.",
  "rescanColdSchema": false,
  "rescanGateOk": false,
  "rescanGateReason": "planSelection.generationStage coldStart does not match requested deepMining.",
  "moduleSchema": true,
  "moduleGateOk": true,
  "moduleGateStage": "moduleMining"
}
```

## Verification

- `npx vitest run test/unit/PlanSelectionGateStateless.test.ts test/unit/HostMcpServerPlanSelectionJobForwarding.test.ts` -> 2 files passed, 8 tests passed.
- `npm run build:check` -> passed, Core build used `../AlembicCore @ 38d074fa64a014ef458044cac7881e092c0c6b8d`.
- `npm run build` -> passed, Core build used `../AlembicCore @ 38d074fa64a014ef458044cac7881e092c0c6b8d`.
- `npm run check` -> passed; Biome still reports 17 pre-existing unrelated warnings.
- `npm run verify:codex-plugin` -> passed.
- `npm run verify:plugin-distribution` -> passed.
- `npm run smoke:codex-plugin` -> passed (`runtimePackageBoundary`, `startupRuntime`, `install`, `shellBootstrap`, and `stdio` passed).
- `npm run lint:repo-boundary` -> passed.
- `npm run lint:layer-boundary` -> passed.
- `git diff --check` -> passed.
- `git diff --cached --check` -> passed before commit.
- `rg -n "routePlanTool|PlanRepository|planRepository|getActiveConfirmed|readConfirmed|active confirmed plan|active confirmed Plan|confirmed Plan|confirmed plan" lib/recipe-generation/plan-generation-gate.ts` -> exit 1, no output.

## Residual Risks

- None within P3 rework scope.
- P4 checkpoint HEAD/SOP/missionBriefing derivation remains future scope.
- P5 BiliDili e2e remains future scope.
