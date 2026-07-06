# Controller Review: fix-main-source-ref-backed-coverage-cells

Reviewed at: 2026-06-28T02:32+08:00

## Scope

- Demand: `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26`
- Dispatch group: `fix-main-source-ref-backed-coverage-cells-p1`
- Target: Alembic / `fix-main-source-ref-backed-coverage-cells-t1`
- Target result: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/target-results/tr-fix-main-source-ref-backed-coverage-cells-t1.json`

## Raw Evidence Reviewed

- Target evidence: `.wakeflow-active/current/alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26/evidence/fix-main-source-ref-backed-coverage-cells-t1.md`
- Alembic commit: `1f141c847c4140233f9c9796e97db2579949c60a`
- Changed files:
  - `Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts`
  - `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `Alembic/test/unit/BootstrapDimensionConsumer.test.ts`
  - `Alembic/test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`

## Controller Findings

- The previous Test blocker was specific: deepMining produced real rows (`knowledge_entries +5`, `recipe_source_refs +25`, `coverage_ledger +57`, `deep_mining_rounds +2`) but coverage cells still had `covered_count=0` and empty `covered_source_refs`.
- The Alembic patch changes the mainbody input chain, not the gates: successful submit calls now collect `acceptedSourceRefs`; rejected/error submit calls do not contribute refs.
- `KnowledgeRescanWorkflow` passes `acceptedSourceRefs` into `writeKnowledgeRescanCoverageLedgerForDimension`.
- When `acceptedSourceRefs` is explicitly empty, the coverage writer no longer falls back to coarse dimension `referencedFiles`. This preserves the anti-fabrication boundary for accepted output without real source refs.
- The patch does not touch Core, Agent, Test, BiliDili, round reflow, plan gates, no-fallback-to-full behavior, or quality/anti-fabrication floors.

## Independent Verification

Controller reran:

- `npm run build:check` in `Alembic` — PASS.
- `npm run test:unit -- test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/BootstrapDimensionConsumer.test.ts` in `Alembic` — PASS, 3 files / 28 tests.
- `git diff --check HEAD` in `Alembic` — PASS.
- `rg "onDimensionResult|ProjectContextDimensionResultHookInput|notifyProjectContextDimensionResult|acceptedSourceRefs" Alembic/lib Alembic/test -n` — scoped to the intended hook chain and tests.

## Decision

Accept the Alembic target result as a valid repair for the code-chain defect.

This does not complete the demand. The final BiliDili direct verification remains required. Next controller action after acceptance is to dispatch Test to rerun the direct BiliDili chain and verify the finding#1 gate on the real DB: `coverage_ledger.covered_count > 0` and non-empty `covered_source_refs`, plus the remaining Phase VERIFY checks.
