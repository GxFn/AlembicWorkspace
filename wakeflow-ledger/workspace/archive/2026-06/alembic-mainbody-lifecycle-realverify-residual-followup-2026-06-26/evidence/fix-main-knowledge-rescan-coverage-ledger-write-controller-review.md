# Controller Review: fix-main-knowledge-rescan-coverage-ledger-write

Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
Target: Alembic / `fix-main-knowledge-rescan-coverage-ledger-write-t1`
Reviewed at: 2026-06-27 21:37 CST

## Scope Reviewed

- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-main-knowledge-rescan-coverage-ledger-write-t1-evidence-repair-1.json`
- Alembic commit: `4c2ef77647e33789f0a3052c13b11e4996763197`
- Core producer commit consumed: `c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3`
- Plugin consumer commit already reviewed separately: `99315965f77dc6ffb6e6102c97629a953a3f0acf`

## Files Reviewed

- `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
- `Alembic/lib/workflows/ai-execution/AiDimensionPreparation.ts`
- `Alembic/lib/workflows/ai-execution/AiDimensionSessionRunner.ts`
- `Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts`
- `Alembic/test/unit/BootstrapDimensionConsumer.test.ts`
- `Alembic/test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
- `AlembicCore/src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts`
- `AlembicCore/src/workflows/capabilities/host-agent/CompletenessCritic.ts`

## Findings

- `KnowledgeRescanWorkflow.ts` imports `writeCoverageLedgerForCompletion` from the public `@alembic/core/host-agent-workflows` surface. No source-relative AlembicCore import was introduced.
- The per-dimension hook is wired through `ProjectContextFillView.onDimensionResult`, `AiDimensionPreparation`, `AiDimensionSessionRunner`, and `consumeBootstrapDimensionResult`.
- The hook passes accepted candidate count plus analysis `referencedFiles` into `writeKnowledgeRescanCoverageLedgerForDimension`.
- `writeKnowledgeRescanCoverageLedgerForDimension` skips writes when candidate count is zero, no coverage repository is available, ProjectMap modules are absent, or no source refs exist.
- Coverage modules use canonical ProjectMap modules, preferring `ownedFiles` and falling back to `modulePath`.
- Covered paths strip line anchors before writing.
- The helper calls `writeCoverageLedgerForCompletion` only. It does not call `reflowDeepMiningRoundOnCompletion`, and the focused test asserts `upsertRound` is not called.
- Core `buildCoverageLedger` assigns candidates to modules through `pathsOverlap` over caller-provided `ownedPaths`; unreferenced modules remain uncovered/thin rather than being counted as covered.
- The test suite covers accepted source-ref-backed recipes advancing cells to partial/covered, source-ref-less or rejected output not increasing coverage, and the side-effect hook receiving the expected dimension result payload.

## Independent Validation

- `node --version`: `v22.22.1`
- `git -C Alembic rev-parse HEAD`: `4c2ef77647e33789f0a3052c13b11e4996763197`
- `git -C AlembicCore rev-parse HEAD`: `c4cac6b4b9dc482a51d33b9d0e2dc5d403bd66e3`
- `git -C AlembicPlugin rev-parse HEAD`: `99315965f77dc6ffb6e6102c97629a953a3f0acf`
- `npm run build:check` in `Alembic`: passed.
- `npm run test:unit -- test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/BootstrapDimensionConsumer.test.ts` in `Alembic`: passed, 2 files / 13 tests.
- `npm run test:unit` in `Alembic`: passed, 122 files passed / 1 skipped; 961 tests passed / 1 skipped.
- `npm run lint` in `Alembic`: exited 0 with 5 existing `noExplicitAny` warnings.
- `git -C Alembic diff --check HEAD^ HEAD`: passed.
- `git -C Alembic status --short`: clean.

## Decision Input

This target satisfies Phase FIX for the Alembic mainbody hook: it adds per-cell `coverage_ledger` writeback for real accepted source-ref-backed dimension results, keeps round accounting single-sourced, and preserves anti-fabrication and quality gates. This does not complete the demand: Phase VERIFY still requires the BiliDili sandbox true-run evidence defined by the requirement design.

Residual risk: `alembic_code_guard` reportedly failed with an internal MCP schema error in the target window. Repository build, lint, targeted unit, full unit, and source review passed; the guard failure is not treated as product failure, but Phase VERIFY remains mandatory.
