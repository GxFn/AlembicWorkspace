# P7 Plan Confirm Split Target Report

Task: `p7-plan-confirm-split-t1`
Window: `AlembicPlugin`
Repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`
Commit: `850b0b76b16503aa93c687b12993b0c09635857e` (`Split plan confirm flow`)
Status: completed

## Scope

Executed only the AlembicPlugin-local P7 refactor from `p7-plan-confirm-split-p1`: split the `alembic_plan` confirm path out of `lib/recipe-generation/plan-tool.ts` into `lib/recipe-generation/plan-confirm.ts`.

No Core, Alembic main, AlembicAgent, vendor, BiliDili, version, release, public tool-name, thread-id, or frozen runtime-value changes were made.

## Changed Files

- `lib/recipe-generation/plan-confirm.ts` — new focused confirm module.
- `lib/recipe-generation/plan-tool.ts` — now imports `confirmPlan` and keeps `routePlanTool`, draft routing, get blocking, and draft/project-context helpers.

Commit stat:

```text
850b0b7 Split plan confirm flow
A	lib/recipe-generation/plan-confirm.ts
M	lib/recipe-generation/plan-tool.ts
2 files changed, 490 insertions(+), 422 deletions(-)
```

## Behavior Preservation Evidence

- `routePlanTool` still reaches confirm:
  - `lib/recipe-generation/plan-tool.ts:34` imports `confirmPlan`.
  - `lib/recipe-generation/plan-tool.ts:286-289` routes `case 'confirm'` to `confirmPlan(ctx, args)`.
- Draft/get boundaries stayed in `plan-tool.ts`:
  - `lib/recipe-generation/plan-tool.ts:286-287` routes draft to `draftPlan`.
  - `lib/recipe-generation/plan-tool.ts:290-299` preserves `PLAN_GET_REMOVED` blocked behavior.
- Confirm side-effect order is preserved:
  - `lib/recipe-generation/plan-confirm.ts:37-64` normalizes and validates intent, writes coldStart deferred coverage rows when stage is `coldStart`, then returns `confirmedPlanResponse(...)`.
  - `lib/recipe-generation/plan-confirm.ts:78-151` contains the moved `writeColdStartDeferredCoverageRows` side effect.
- `buildPlanSelection` DTO shape is preserved:
  - `lib/recipe-generation/plan-confirm.ts:427-438` returns `generationStage`, `dimensions: intent.dimensions.map(dimension => dimension.dimensionId)`, `scale` with `totalRecipeBudget/maxFiles/contentMaxLines/depthLevels`, and `moduleBindings: intent.moduleBindings`.
- Confirm response and nextAction behavior is preserved:
  - `lib/recipe-generation/plan-confirm.ts:398-420` keeps `coldStart -> alembic_bootstrap`, non-coldStart stages -> `alembic_rescan`, and passes `{ planSelection, projectRoot }` to the next tool.

## Validation

- Pre-change characterization:
  - `npx vitest run test/unit/PlanConfirmStatelessSelection.test.ts`: PASS, 1 file / 8 tests.
- Post-change targeted characterization:
  - `npx vitest run test/unit/PlanConfirmStatelessSelection.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/PlanSelectionGateStateless.test.ts`: PASS, 3 files / 25 tests.
- Touched-file lint/type checks:
  - `npx biome check lib/recipe-generation/plan-tool.ts lib/recipe-generation/plan-confirm.ts`: PASS.
  - `npx tsc --noEmit --pretty false`: PASS.
- Required repository validation:
  - `npm run build:check`: PASS. Core build used `../AlembicCore @ 8e71bbd500992c625b1696f3b04f0f2fa8273608`.
  - `npm run lint:repo-boundary`: PASS, `@escape-hatch count: 0 / 75 threshold`.
  - `git diff --check`: PASS before commit.
  - `git diff --check HEAD~1 HEAD`: PASS after commit.
- Git status after commit:
  - `## main...origin/main [ahead 4]`

## Frozen Token Proof

Grep proof was run across changed files plus schema/tool anchors:

```text
rg -n "coldStart|deepMining|moduleMining|alembic_bootstrap|alembic_rescan|alembic_dimension_complete|coverage_ledger|deep_mining_rounds" \
  lib/recipe-generation/plan-tool.ts \
  lib/recipe-generation/plan-confirm.ts \
  lib/shared/schemas/mcp-tools.ts \
  lib/runtime/mcp/tools.ts
```

Relevant proof points:

- `lib/shared/schemas/mcp-tools.ts:773` keeps `PlanStageIdInput = z.enum(['coldStart', 'deepMining', 'moduleMining'])`.
- `lib/shared/schemas/mcp-tools.ts:1416-1418` keeps `alembic_bootstrap`, `alembic_rescan`, and `alembic_dimension_complete` schema exports.
- `lib/runtime/mcp/tools.ts:291`, `306`, and `352` keep the public MCP tool names.
- `lib/recipe-generation/plan-confirm.ts:398-399` keeps nextAction mapping to `alembic_bootstrap` / `alembic_rescan`.
- `lib/recipe-generation/plan-confirm.ts:76` preserves the `coverage_ledger` side-effect boundary comment; no table or column names were changed.

## Guard

`alembic_code_guard` was invoked on the two changed files. The first call was rejected because the supplied `hostDeclaredIntent.scenario` exceeded the tool input length. The corrected call reproduced the existing Alembic Guard MCP surface failure:

```text
Unrecognized key: "data"
```

This is recorded as a Guard tooling risk, not a code finding. Repository build/lint/tests above are the acceptance evidence for this target result.

## Risks And Next Recommendation

- This completes only P7 source refactor and local characterization. It does not accept P8+, P9/P10 collapse/unification, host-agent parity, P11 moduleMining behavior change, late-L2 rename, final freeze audit, or whole-demand completion.
- `AlembicPlugin` remains locally ahead of origin; no push was performed.
- Next controller action: review this target result and, if accepted, continue the P1-P15 sequence to P8.
