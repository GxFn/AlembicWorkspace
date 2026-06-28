# P11 Alembic ModuleMining Realtest Blocker Repair

Status: completed
Target window: Alembic
Target task: p11-alembic-module-mining-realtest-blocker-repair-t1
Dispatch group: p11-alembic-module-mining-realtest-blocker-repair-p1
Commit: cd98ac78c236c5355754b26aff58330871597eb8

## Scope

Repair Alembic-side blockers reported by the real BiliDili P11 moduleMining
binding-rich realtest. No AlembicCore, AlembicPlugin, AlembicAgent, Test,
BiliDili, provider config, vendor, release/version, or thread-id files were
changed.

## Source Evidence Reviewed

- evidence/p11-bilidili-module-mining-binding-rich-realtest-controller-review.md
- evidence/p11-bilidili-module-mining-binding-rich-realtest-t1-report.md
- evidence/p11-bilidili-module-mining-binding-rich-realtest-t1-summary.json
- Alembic/lib/daemon/PlanSelectionGate.ts
- Alembic/lib/daemon/ModuleMiningWorkflow.ts
- Alembic/lib/daemon/ModuleMiningSelection.ts
- Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts
- Alembic/lib/daemon/DaemonJobWorkflowTypes.ts

## Changes

- Added shared ModuleMining evidence helpers in lib/shared/ModuleMiningEvidence.ts.
- Extended moduleMining selector payloads with plannedDimensionTargets and
  targetRecipes while preserving dimensions, dimensionIds, and plannedDimensions.
- Generalized PlanSelectionGate request constraints to include moduleMining
  while preserving deepMining labels and behavior.
- Entry A ModuleMiningWorkflow now returns and records selectedModules,
  sourceRefPaths, and coverageLedger in both result and process-event surfaces.
- Entry B KnowledgeRescanWorkflow Step 7 now records selectedModules,
  sourceRefDelta, and coverageLedger in moduleMining result/log surface.
- moduleMining now writes coverage_ledger cells for source-ref-backed selected
  module x planned dimension targets without opening or advancing
  deep_mining_rounds.

## Validation

- npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts: passed, 2 tests.
- npx vitest run --config vitest.unit.config.ts test/unit/DaemonJobRunnerPlanGate.test.ts: passed, 24 tests.
- npx vitest run --config vitest.unit.config.ts test/unit/ProjectIndexWorkflow.test.ts: passed, 4 tests.
- npx vitest run --config vitest.unit.config.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts: passed, 4 tests.
- npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/ProjectIndexWorkflow.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts: passed, 34 tests.
- npx tsc --noEmit: passed.
- npm run build:check: passed.
- npm run lint: passed with 5 pre-existing noExplicitAny warnings in lib/service/handler-runtime/types.ts and lib/workflows/ai-execution/AgentRunProjections.ts.
- npm run lint:repo-boundary: passed.
- npm run lint:agent-extraction-boundary: passed.
- npm run lint:core-import-boundary: passed.
- git diff --check: passed.
- git diff --check HEAD^ HEAD: passed.

## Validation Limits

- npm run lint:layer-contract still fails with 10 existing layer-contract
  violations. The repair initially added one new workflow->daemon violation, then
  moved the helper to lib/shared; the remaining 10 are pre-existing violations
  outside this package.
- alembic_work start and alembic_code_guard were attempted and both failed in the
  Alembic MCP surface with internal schema error: unrecognized key "data".

## Same Test Rerun Readiness

Ready for the controller to dispatch the same real BiliDili P11 Test rerun. The
repair is committed, Alembic worktree is clean, and no Test dispatch was created
from this Alembic target window.

## Residual Risks

- The real BiliDili rerun still needs to prove that persisted source refs map to
  the selected module paths in live data. The coverage helper strips :line and
  #Lline anchors and falls back to all source refs only when a single module was
  selected.
- Existing layer-contract violations remain a repository-wide governance issue;
  this task did not attempt to repair them.
