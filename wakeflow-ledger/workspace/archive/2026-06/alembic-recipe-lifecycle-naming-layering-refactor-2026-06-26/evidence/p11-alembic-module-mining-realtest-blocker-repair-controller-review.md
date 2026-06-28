# P11 Alembic ModuleMining Realtest Blocker Repair Controller Review

Status: accepted-source-repair
Reviewed target: p11-alembic-module-mining-realtest-blocker-repair-t1
Dispatch group: p11-alembic-module-mining-realtest-blocker-repair-p1
Reviewed commit: cd98ac78c236c5355754b26aff58330871597eb8

## Controller Decision

Accept the Alembic source repair for the P11 moduleMining realtest blockers.

This decision accepts only the Alembic repair package. It does not close P11,
G4, G6, P12, or the BiliDili REAL-TEST gate. A same-scenario Test rerun remains
required to prove live BiliDili source refs map to selected module paths and that
coverage_ledger cells move in the real data root.

## Raw Evidence Reviewed

- target-results/tr-p11-alembic-module-mining-realtest-blocker-repair-t1.json
- evidence/p11-alembic-module-mining-realtest-blocker-repair-t1-report.md
- task-packages/p11-alembic-module-mining-realtest-blocker-repair-p1.json
- Alembic commit cd98ac78c236c5355754b26aff58330871597eb8
- Alembic source:
  - lib/daemon/ModuleMiningSelection.ts
  - lib/daemon/PlanSelectionGate.ts
  - lib/daemon/ModuleMiningWorkflow.ts
  - lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts
  - lib/shared/ModuleMiningEvidence.ts
  - lib/daemon/DaemonJobWorkflowTypes.ts
- Alembic tests:
  - test/unit/ModuleMiningSelection.test.ts
  - test/unit/DaemonJobRunnerPlanGate.test.ts
  - test/unit/ProjectIndexWorkflow.test.ts
  - test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts

## Findings

- Entry A moduleMining now shares the plan-gate request constraint path with
  deepMining while preserving stage labels. The plan gate applies requested
  dimensions, moduleScope, scaleCap, maxFiles, contentMaxLines, maxRounds, and
  minNewRecipes without changing frozen enum/job/source/tool/lifecycle literals.
- ModuleMining selection now preserves binding-rich per-module planned dimensions
  and carries plannedDimensionTargets/targetRecipes into the selected module
  payload.
- Entry A ModuleMiningWorkflow now returns selectedModules, sourceRefPaths, and a
  coverageLedger summary, and records selectedModules/coverageLedger in the job
  process event content and metadata.
- Entry B KnowledgeRescanWorkflow Step 7 now captures selectedModules,
  sourceRefDelta, and coverageLedger in moduleMining result/log surfaces while
  keeping moduleMining/per-module directed selection.
- coverage_ledger writes are source-ref-backed: the helper snapshots
  recipeSourceRefRepository before/after moduleMining, strips line anchors, maps
  source refs to selected modules by modulePath/ownedFiles/structured moduleId
  aliases, and upserts module x planned dimension cells through
  coverageLedgerRepository without opening or advancing deep_mining_rounds.
- Alembic worktree was clean at review time except the branch being ahead of
  origin/main by local commits.

## Controller Verification

- `npx vitest run --config vitest.unit.config.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/ProjectIndexWorkflow.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`: passed, 4 files / 34 tests.
- `git diff --check`: passed.
- `git diff --check HEAD^ HEAD`: passed.
- `npm run build:check`: passed.
- `npm run lint`: passed with 5 existing noExplicitAny warnings in
  lib/service/handler-runtime/types.ts and
  lib/workflows/ai-execution/AgentRunProjections.ts.
- `npm run lint:repo-boundary`: passed.
- `npm run lint:agent-extraction-boundary`: passed.
- `npm run lint:core-import-boundary`: passed.
- `npm run lint:layer-contract`: failed with the known 10 existing violations.
  Review confirmed the current commit does not add a new
  lib/shared/ModuleMiningEvidence.ts violation; the visible violations on
  KnowledgeRescanWorkflow.ts and PlanSelectionGate.ts pre-existed this repair.

## Residual Risks And Required Next Step

- Alembic MCP `alembic_work start` and `alembic_code_guard` remain blocked by
  internal schema error `unrecognized key "data"` per target backfill; this is a
  tool-surface blocker, not evidence that the source repair failed.
- The real BiliDili Test rerun must still prove:
  - Entry B plannedDimensions are present post-repair.
  - selected module payloads are reviewable for Entry A and Entry B.
  - coverage_ledger in-process cells flip non-empty for the targeted module x
    planned dimension rows.
  - deep_mining_rounds does not advance for moduleMining.
  - host vs in-process parity predicate remains diff==empty.

Next action: reduce and accept this Alembic repair package, then dispatch the
same P11 BiliDili moduleMining binding-rich REAL-TEST rerun after the Alembic
repair.
