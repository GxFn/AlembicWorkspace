# Controller Review: P11 BiliDili ModuleMining Binding-Rich Realtest

Reviewed at: 2026-06-28T19:34:24+08:00

## Decision

Accept the Test target result as valid blocked evidence, not as P11 real-test
acceptance. Create an Alembic repair package before rerunning the same real
BiliDili Entry A / Entry B test.

## Scope

- Demand: `alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`
- Dispatch group: `p11-bilidili-module-mining-binding-rich-realtest-p1`
- Target result: `Test / p11-bilidili-module-mining-binding-rich-realtest-t1`
- Target status reviewed: `blocked`
- Source baseline under test: Alembic commit `25a86eed857294d63ee671203d3634859a6709fa`

## Evidence Reviewed

- Target result:
  `target-results/tr-p11-bilidili-module-mining-binding-rich-realtest-t1.json`
- Test report:
  `evidence/p11-bilidili-module-mining-binding-rich-realtest-t1-report.md`
- Test summary:
  `evidence/p11-bilidili-module-mining-binding-rich-realtest-t1-summary.json`
- Raw evidence:
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/restart-no-preclean.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/verify-post-restart.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/baseline.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/entry-a-module-mining.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/entry-b-knowledge-rescan-module-mining.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/final-after-entry-b.json`
  - `Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-t1/delta-summary.json`
- Alembic source read:
  - `Alembic/lib/daemon/PlanSelectionGate.ts`
  - `Alembic/lib/daemon/ModuleMiningWorkflow.ts`
  - `Alembic/lib/daemon/ModuleMiningSelection.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `Alembic/lib/daemon/DaemonJobWorkflowTypes.ts`

## Findings

- Test stayed inside its assigned boundary: real BiliDili project/data root,
  no sandbox copy, no product source edits, no manual SQLite/session/coverage/
  source-ref/provider mutation.
- Alembic was rebuilt and Test confirmed the expected source was loaded:
  `25a86eed857294d63ee671203d3634859a6709fa`.
- Environment checks were valid: daemon ready, test mode enabled, SQLite
  integrity `ok`, no open rounds, no active matching sessions, and provider
  route remained DeepSeek generation plus local Ollama/Qwen embeddings.
- Entry A daemon moduleMining completed successfully and created 3 persisted
  source-ref-backed recipes with 5 active source refs. It did not advance
  `deep_mining_rounds`.
- Entry B KnowledgeRescanWorkflow Step 7 completed successfully and created 5
  persisted source-ref-backed recipes with 15 active source refs. It did not
  advance `deep_mining_rounds`.
- Entry B proved the intended behavior change at the execution level: request
  dimensions were `architecture` and `api-design`, but the per-module
  `moduleDimensionTargets` selected only `architecture`; the observed gap
  analysis had `executionDimensions=1`, `totalDimensions=1`, and no all-dimension
  behavior.
- The P11 success criteria still did not pass:
  - no reviewable Entry A or Entry B surface exposed selected module payloads
    carrying `dimensions`, `dimensionIds`, or `plannedDimensions`;
  - `coverage_ledger` did not advance for the targeted module x dimension cells;
  - Entry A plan-gate evidence still surfaced all 8 execution dimensions even
    though the public request was architecture-only.

## Source Corroboration

- `PlanSelectionGate.constrainPlanSelectionForGate` currently applies request
  constraints only when `gateStage === 'deepMining'`; this explains why Entry A
  moduleMining plan-gate evidence ignored the request dimension constraint.
- `ModuleMiningWorkflow` computes `selectedModules` and passes them to
  `runModuleMining`, but the returned job result and retained process event only
  expose aggregate accounting, not the selected module payload with planned
  dimensions.
- `KnowledgeRescanWorkflow` uses the binding-rich selector for the per-module
  branch, but it stores only `moduleMiningResult`; it does not surface the
  selected modules used for the run.
- `KnowledgeRescanWorkflow` writes coverage ledger cells through the normal
  rescan fill `onDimensionResult` path; the per-module moduleMining branch has
  no equivalent coverage write or host-visible coverage evidence path.

## Decision Boundary

This Test result is useful and reviewable blocked evidence. It proves real
BiliDili moduleMining execution, source-ref persistence, Entry B architecture-only
planned execution, and the moduleMining stage guard for `deep_mining_rounds`.

It does not prove P11 acceptance, G4, G6, P12 readiness, or whole-demand
completion. The first actionable blocker is Alembic product behavior/observability,
not another Test rerun.

## Next Action

Dispatch Alembic to repair moduleMining so that:

- Entry A moduleMining plan-gate request constraints include requested
  dimensions/module scope/scale cap, matching deepMining's constraint behavior
  where appropriate for moduleMining without changing frozen stage/job values.
- Entry A and Entry B expose selected module payloads in a reviewable result,
  retained process event, or log surface, including `dimensions`,
  `dimensionIds`, and/or `plannedDimensions`.
- ModuleMining updates `coverage_ledger` for targeted module x dimension cells,
  or exposes a controller-reviewable coverage artifact that satisfies the P11
  coverage success definition without changing frozen schema/literal values.
- Existing positive properties remain: Entry B stays per-module/planned-only,
  source-ref-backed recipes materialize, `deep_mining_rounds` does not advance
  for moduleMining, session cleanup stays closed, and provider routing is not
  changed.

After Alembic repair is accepted, rerun the same real BiliDili P11 Test package.

## Forbidden Conclusions

- Do not accept P11 real-test completion from this blocked result.
- Do not accept G4/G6/P12 or whole-demand completion from this result.
- Do not route this back to Test before Alembic exposes planned module payload
  evidence and repairs the moduleMining coverage evidence gap.
