# RG4 Plugin Plan-Driven Generation Test Mode Rework 1 Controller Review Evidence

Date: 2026-06-22
Dispatch group: `rg4-plugin-plan-driven-generation-test-mode-rework-1-p1`
Target task: `rg4-plugin-plan-driven-generation-test-mode-rework-1-t1`
Target commit: `AlembicPlugin@10b3df4d35129dba61d3c483c3e4a7081bb7eaa1`

## Raw Diff Reviewed

- `test/support/codex-session/ScenarioRunner.ts`
- `test/codex-scenarios/cold-start/bootstrap-missing-ai.json`
- `test/codex-scenarios/cold-start/init-then-bootstrap-ai-ready.json`
- `test/codex-scenarios/cold-start/explicit-init.json`
- `test/codex-scenarios/preflight/missing-project-root.json`
- `test/unit/PlanDrivenGenerationGate.test.ts`

Controller conclusion: rework stays inside RG4 test/evidence scope. It preserves the Plan hard precondition, adds real Codex session coverage for `PLAN_REQUIRED -> alembic_plan draft -> confirm -> alembic_bootstrap`, and adds direct moduleMining lease/idempotency coverage.

## Controller Validation

- `npm run test:unit -- CodexSessionScenarioRunner.test.ts`: passed, 5 tests.
- `npm run test:unit -- PlanDrivenGenerationGate.test.ts`: passed, 4 tests.
- `npm run build:check`: passed; Core build used `../AlembicCore @ dd4db2c59cea3cf8c3363b4927683c9cccd45a87`.
- `npm run test:unit -- PlanDrivenGenerationGate.test.ts AlembicPlanTool.test.ts DataLossWorkflowGates.test.ts McpCoreToolsCleanOutputContract.test.ts McpCleanOutputContract.test.ts`: passed, 5 files / 30 tests.
- `npm run test:unit -- HostMcpServer.test.ts -t "Codex host-agent bootstrap|projectRoot override can switch"`: passed, 2 tests / 40 skipped.
- `npm run lint`: exit 0 with the known 17 unrelated warnings.
- `npm run lint:repo-boundary`: passed.
- `npm run lint:core-import-boundary`: passed, scanned 390 files and 412 `@alembic/core` imports.
- `npm run lint:layer-boundary`: passed.
- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- `alembic_code_guard`: `guard-public-mqo4rz86-2`, 6 files, 0 violations.

## Full Unit JSON

Controller full-unit JSON path:

`controller-evidence/rg4-rework-full-unit-controller.json`

Summary:

- Total suites: 529
- Passed suites: 514
- Failed suites: 15
- Total tests: 1604
- Passed tests: 1570
- Failed tests: 34
- RG4 touched failures: none for `CodexSessionScenarioRunner.test.ts` or `PlanDrivenGenerationGate.test.ts`

Remaining failed areas are outside this RG4 rework surface: `FileChangeHandler.test.ts`, `GitDiffCheckpoint.test.ts`, `HitRecorder.test.ts`, `HostMcpServer.test.ts`, `RecipeRelationChainProvider.test.ts`, `SearchEngine.test.ts`, `SearchPrimeIsolationBoundary.test.ts`, and `SearchRanking.test.ts`.

## Decision Basis

The original rework blocker is resolved: the controller independently reran the previously failing Codex session scenario and confirmed it now covers the user-facing Plan gate path before successful bootstrap. The added lease test covers duplicate same-key/moduleMining `alembic_rescan` in-progress behavior without destructive cleanup and proves release permits a next run.
