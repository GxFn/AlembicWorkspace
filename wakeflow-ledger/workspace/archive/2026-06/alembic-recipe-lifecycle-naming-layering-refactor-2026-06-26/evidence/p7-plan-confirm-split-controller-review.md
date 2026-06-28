# P7 Plan Confirm Split Controller Review

Reviewed at: 2026-06-28T08:16:00+08:00
Controller window: AlembicWorkspace
Dispatch group: p7-plan-confirm-split-p1
Target result: tr-p7-plan-confirm-split-t1

## Controller Acceptance

- User goal: advance the confirmed P1-P15 recipe lifecycle refactor through P7 without changing runtime contracts or frozen values.
- Scope reviewed: AlembicPlugin-local P7 refactor only, splitting the `alembic_plan` confirm path from `lib/recipe-generation/plan-tool.ts` into `lib/recipe-generation/plan-confirm.ts`.
- Original requirement authority: `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` §A.2 and §12.2 P7. P7 requires preserving confirm DTO bytes, `nextAction` behavior, deferred coverage side-effect order, and `get` blocked behavior; P7 has no Core re-pin and no independent REAL-TEST.
- Target/window: AlembicPlugin, task package `p7-plan-confirm-split-p1`, target task `p7-plan-confirm-split-t1`.
- Evidence reviewed:
  - Target result `target-results/tr-p7-plan-confirm-split-t1.json`.
  - Target report `evidence/p7-plan-confirm-split-t1-report.md`.
  - AlembicPlugin commit `850b0b76b16503aa93c687b12993b0c09635857e`.
  - Source diff for `lib/recipe-generation/plan-tool.ts` and `lib/recipe-generation/plan-confirm.ts`.
  - Controller reruns listed below.
- Implementation reality:
  - Commit `850b0b7` adds `lib/recipe-generation/plan-confirm.ts` and updates only `lib/recipe-generation/plan-tool.ts`.
  - `plan-tool.ts` imports `confirmPlan` from `./plan-confirm.js` and routes only the `confirm` case through it.
  - `draft` and blocked `get` behavior remain in `plan-tool.ts`.
  - `plan-confirm.ts` preserves the moved confirm flow: normalize/validate intent, best-effort coldStart deferred coverage rows, `confirmedPlanResponse`, `nextGenerationToolForStage`, and `buildPlanSelection`.
  - `buildPlanSelection` still emits `generationStage`, `dimensions` from `intent.dimensions.map(dimension => dimension.dimensionId)`, `scale`, and `moduleBindings`.
  - `nextGenerationToolForStage` still maps `coldStart` to `alembic_bootstrap` and non-coldStart stages to `alembic_rescan`.
  - No Core, Alembic main, AlembicAgent, BiliDili, vendor pointer, version, release asset, public tool name, or frozen schema value changed in this P7 package.
- Validation result:
  - Controller reran `npx vitest run test/unit/PlanConfirmStatelessSelection.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/PlanSelectionGateStateless.test.ts`: PASS, 3 files / 25 tests.
  - Controller reran `npx biome check lib/recipe-generation/plan-tool.ts lib/recipe-generation/plan-confirm.ts`: PASS.
  - Controller reran `npm run lint:repo-boundary`: PASS, `@escape-hatch count: 0 / 75`.
  - Controller reran `npm run build:check`: PASS, Core build used `../AlembicCore @ 8e71bbd500992c625b1696f3b04f0f2fa8273608`.
  - Controller reran `git diff --check HEAD~1 HEAD`: PASS.
  - Frozen-token grep confirmed the changed and schema/tool anchor files still contain expected `coldStart`, `deepMining`, `moduleMining`, `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`, `coverage_ledger`, and `deep_mining_rounds` anchors.
  - Repository status after controller validation: AlembicPlugin `main...origin/main [ahead 4]`; no unstaged files. Adjacent repos show only known ahead counts and no dirty files.
- Blockers: none for accepting P7.
- Missing evidence: `alembic_code_guard` remains unavailable due the existing MCP schema error `unrecognized key "data"`; this is a Guard tooling risk, not a P7 code finding. P7 does not require BiliDili REAL-TEST; host-agent end-to-end coverage is deferred to P10 by the design.
- Residual risks:
  - This acceptance does not cover P8+, P9/P10 collapse/unification, Chain 3 host-agent parity, P11 moduleMining behavior change, late-L2 rename, final freeze audit, or whole-demand completion.
  - AlembicPlugin is locally ahead of origin; no push was performed.
- TODO/backlog rollup:
  - Close P7 as accepted.
  - Continue the confirmed sequence to P8 in Alembic, respecting the P8 dependency on accepted P6 and the P7 no-Core-change boundary.
- Decision: accept-target-result.
- Next action: create-next-package for P8 ProjectContextWorkflowFacts split.
