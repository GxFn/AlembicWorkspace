# fix-main-deepmining-real-coverage-production-t1 evidence

## Scope

- Window: Alembic
- Task: fix-main-deepmining-real-coverage-production-t1
- Dispatch group: fix-main-deepmining-real-coverage-production-p1
- State root: .wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26

## Root Cause

Daemon deepMining opened a round and called `runKnowledgeRescanWorkflow`, but the normal rescan path returned an async-fill skeleton before AI dimension execution completed. The daemon then extracted `newRecipesThisRound=0`, reviewed still-empty coverage ledger cells, and stopped as `diminishing-returns`.

## Repair

- `Alembic/lib/daemon/DaemonJobRunner.ts` now passes `internalExecution.runAsyncFillInline=true` for daemon deepMining rounds.
- `Alembic/lib/workflows/ai-execution/AiDimensionPipeline.ts` exposes `runAiDimensionPipelineForResult` while preserving the existing async dispatcher entrypoint.
- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` awaits the pipeline only for the internal inline opt-in and counts only coverage-written accepted source-ref-backed candidates into `newRecipesThisRound`.
- `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts` returns inline coverage stats and `newRecipesThisRound` in the rescan envelope.
- `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts` adds a regression for source-ref-backed coverage written before advisor review.

## Commits

- Alembic `0e4b369d0c20f460b8d8cba4022acc494deafde2` - `fix: run deepMining rescan fill inline`
- Alembic `e8ec1669ba90323ca455083491625dd0de0ca38b` - `fix: route rescan planning imports through facade`
- Alembic `9e5555df194d32715a44b8bd6f028b45f133efd2` - `fix: avoid retired workflow naming in rescan log`
- AlembicCore `934d043a0d12ac364aa582d6c39445f14a0af2e1` - pushed because Alembic CI checks out sibling Core and needed the already-local Core facade/export commits.

## Local Verification

- `node --version` => `v22.22.1`
- `npm run build:check` => passed
- `npm run lint:core-import-boundary` => passed
- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts` => 17 tests passed
- `npm run test:unit -- test/unit/WorkflowNamingBoundary.test.ts` => 4 tests passed
- `npm run test:unit` => 122 test files passed, 967 tests passed, 1 skipped
- `./node_modules/.bin/biome check` on changed files => passed
- `git diff --check` => passed

## Remote Verification

- Alembic origin/main: `9e5555df194d32715a44b8bd6f028b45f133efd2`
- AlembicCore origin/main: `934d043a0d12ac364aa582d6c39445f14a0af2e1`
- GitHub Actions: https://github.com/GxFn/Alembic/actions/runs/28296887289
- Result: CI passed. Build & Lint, Unit Tests, Integration Tests, and API Smoke Test all completed successfully.

## Guard / Residual

- `alembic_code_guard` was attempted with multi-file and single-file scope, but the MCP tool failed before review with internal schema error `unrecognized key "data"`.
- Final BiliDili real e2e deepMining verification remains intentionally outside this target package and should be run by controller/Test after acceptance.
