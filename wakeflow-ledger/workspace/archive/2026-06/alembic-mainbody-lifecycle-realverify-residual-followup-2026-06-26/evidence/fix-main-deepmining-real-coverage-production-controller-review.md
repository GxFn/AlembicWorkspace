# Controller Review: fix-main-deepmining-real-coverage-production

Reviewed at: 2026-06-27T17:52:26Z

## Scope

- Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Target: `Alembic / fix-main-deepmining-real-coverage-production-t1`
- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-main-deepmining-real-coverage-production-t1-20260627174808.json`
- Relevant blocker: direct BiliDili deepMining had completed with `newRecipesThisRound=0`, `coverage_ledger` cells still `empty`, and advisor stopped as `diminishing-returns`.

## Raw Evidence Reviewed

- Target evidence file: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/evidence/fix-main-deepmining-real-coverage-production-t1.md`
- Alembic commits:
  - `0e4b369d0c20f460b8d8cba4022acc494deafde2` — `fix: run deepMining rescan fill inline`
  - `e8ec1669ba90323ca455083491625dd0de0ca38b` — `fix: route rescan planning imports through facade`
  - `9e5555df194d32715a44b8bd6f028b45f133efd2` — `fix: avoid retired workflow naming in rescan log`
- Alembic changed files:
  - `Alembic/lib/daemon/DaemonJobRunner.ts`
  - `Alembic/lib/workflows/ai-execution/AiDimensionPipeline.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`
- AlembicCore reference noted by target:
  - `934d043a0d12ac364aa582d6c39445f14a0af2e1` — `Add stage-aware plan selection validation`
  - This is a Core public facade/export dependency in local sibling Core; this review does not accept new Core scope under the Alembic package.

## Implementation Finding

The Alembic repair addresses the original deepMining zero-production failure path without relaxing quality gates:

- `DaemonJobRunner.ts` now sends `internalExecution.runAsyncFillInline=true` for daemon deepMining rounds before extracting `newRecipesThisRound`.
- `AiDimensionPipeline.ts` adds `runAiDimensionPipelineForResult` so internal callers can await the real AI dimension pipeline while keeping the existing async dispatcher wrapper.
- `KnowledgeRescanWorkflow.ts` uses the inline opt-in only for internal execution. It awaits the dimension pipeline before response projection and updates inline fill summary through `onDimensionResult`.
- `writeKnowledgeRescanCoverageLedgerForDimension` refuses to write coverage when `candidateCount <= 0`, when the coverage ledger repository is absent, when ProjectMap modules are absent, or when accepted candidates have no source refs. It strips line anchors, maps source refs to ProjectMap module axes, and delegates the actual per-cell write to Core `writeCoverageLedgerForCompletion`.
- `ProjectContextWorkflowFacts.ts` surfaces `coverageLedger.writtenCells` and `newRecipesThisRound` only for inline fill, and sets `asyncFill=false` for that path.

The main remaining proof is real BiliDili e2e, which is intentionally outside this Alembic target package and must be run by Test after controller acceptance.

## Validation Run By Controller

From `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`:

- `node --version`
  - Result: `v22.22.1`
- `npm run build:check`
  - Result: passed.
- `npm run lint:core-import-boundary`
  - Result: passed; scanned 348 files and 421 `@alembic/core` imports.
- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
  - Result: 2 files passed, 17 tests passed.
- `npm run test:unit -- test/unit/WorkflowNamingBoundary.test.ts`
  - Result: 1 file passed, 4 tests passed.
- `./node_modules/.bin/biome check lib/daemon/DaemonJobRunner.ts lib/workflows/ai-execution/AiDimensionPipeline.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts lib/workflows/project-context/ProjectContextWorkflowFacts.ts test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `npm run test:unit`
  - Result: 122 files passed, 967 tests passed, 1 skipped.

## Decision

Alembic target result is technically acceptable for its assigned repair scope. The code now waits for inline deepMining fill, writes coverage only from accepted source-ref-backed candidates, and updates round accounting after coverage has been written.

This does not complete the demand by itself. It unlocks the next required Test pass: direct BiliDili realverify must rerun and prove that deepMining produces non-empty coverage and that moduleMining no longer fails after the separate AlembicAgent fix.

## Next Action

- Reduce and accept the ready Alembic + AlembicAgent repair results if Wakeflow candidate generation permits.
- Dispatch Test to rerun direct BiliDili mainbody realverify after the Alembic and AlembicAgent fixes.
