# p10 Alembic Root Module Scope Alias Real Route Repair

## Result

- Status: completed
- Window: Alembic
- Task: p10-alembic-root-module-scope-alias-real-route-repair-t1
- Commit: bf328ea81a809bb8f761c0a0d81162703b1cb70d
- Repository: /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic

## Source Changes

- `lib/daemon/PlanSelectionGate.ts`
  - Added root-scope detection for deepMining request constraints.
  - When `moduleScope` matches the project root alias, including basename `BiliDili` or `.`, the gate preserves the real nested Plan Agent module bindings instead of filtering them by per-module aliases.
  - True nonmatching module scopes still run the existing per-binding alias filter and fail before a deepMining round opens.
  - `availableModuleAliases` diagnostics now include project-root aliases.
- `test/unit/DaemonJobRunnerPlanGate.test.ts`
  - Added an in-process plan-gate regression for `moduleScope=["BiliDili"]` with real nested bindings such as `target:Account:Sources/Infrastructure/Account`.
  - Kept the existing root-binding alias test and true miss test; the true miss test now asserts the diagnostic includes `BiliDili`.

## Validation

- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts` passed: 21 tests.
- `npm test -- --run test/unit/DaemonJobRunnerPlanGate.test.ts -t "keeps real nested deepMining module targets"` passed: 1 focused test, 20 skipped.
- `npx biome check lib/daemon/PlanSelectionGate.ts test/unit/DaemonJobRunnerPlanGate.test.ts` passed.
- `npm run build:check` passed.
- `npm run lint:repo-boundary` passed.
- `git diff --check` passed before commit.
- Post-commit `git status --short --branch` was clean on `main...origin/main [ahead 11]`.

## Residual Risks

- Alembic Guard MCP was attempted but failed with internal schema error `unrecognized key "data"`; Guard did not produce usable pass/fail evidence.
- The full BiliDili real host/Test-window workflow was not rerun in this Alembic target task. Controller/Test should rerun the real route after combining this Alembic commit with the Plugin session cleanup repair.
- Alembic MCP status reported empty local Recipe knowledge and a selected-project alignment hint, so this task used raw source reads and repository validation as proof.
