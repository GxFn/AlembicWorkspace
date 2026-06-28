# P11 BiliDili ModuleMining Binding-Rich Rerun Controller Review

Status: valid-blocked-evidence
Reviewed target: p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1
Dispatch group: p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-p1
Reviewed source repair under test: Alembic cd98ac78c236c5355754b26aff58330871597eb8

## Controller Decision

Accept this Test return as valid blocked evidence. Do not accept P11, G4, G6,
P12, or whole-demand completion from it.

The rerun proves the Alembic repair fixed Entry A, but it also proves Entry B
still has an Alembic product defect in the KnowledgeRescanWorkflow
moduleMining/per-module route. The next action is Alembic rework, not another
Test rerun.

## Raw Evidence Reviewed

- target-results/tr-p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1.json
- evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-report.md
- evidence/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1-summary.json
- Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1/entry-a-module-mining.json
- Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1/entry-b-knowledge-rescan-module-mining-rerun-long.json
- Test/tmp/p11-bilidili-module-mining-binding-rich-realtest-rerun-after-alembic-repair-t1/final-after-entry-b-long.json
- Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts
- Alembic/lib/daemon/ModuleMiningSelection.ts

## Verified Positives

- Test stayed inside its boundary: real BiliDili route, no sandbox copy, no
  product source edits, no manual SQLite/session/coverage/source-ref/provider
  mutation.
- Source pins were recorded. Alembic was built at
  cd98ac78c236c5355754b26aff58330871597eb8.
- SQLite integrity remained `ok`.
- Provider route stayed DeepSeek generation plus local Ollama/Qwen embeddings.
- No open deep_mining_rounds and no active BiliDili ProjectContext sessions
  remained after the authoritative long rerun.
- Entry A daemon ModuleMiningWorkflow now passes:
  - selected module payload carries `dimensions=["architecture"]`,
    `dimensionIds=["architecture"]`, and `plannedDimensions=["architecture"]`;
  - plan-gate request constraints are architecture-only/module-scoped;
  - source refs materialized;
  - coverage_ledger moved for the selected module x architecture cell;
  - deep_mining_rounds did not advance.

## Blocking Findings

- Entry B KnowledgeRescanWorkflow Step 7 completed, produced source-ref-backed
  recipe output, and did not advance deep_mining_rounds, but it still failed the
  P11 success predicate.
- The Entry B request explicitly set `moduleDimensionTargets` for
  AOXFoundationKit x architecture, with `scaleCap=1`.
- Global gap analysis treated architecture as fully covered:
  `executionDimensions=0`, `skippedDimensions=["architecture"]`, reason
  `fully-covered existing=32 target=5`.
- The Step 7 moduleMining branch then called
  `selectProjectIndexModuleMiningModules` with
  `executionDimensions.map((dimension) => dimension.id)`, which was empty.
- `ModuleMiningSelection` only copies binding dimensions when the dimension is in
  `executionDimensions`. With an empty execution set, the selected module
  survived by module binding/scope, but its `dimensions`, `dimensionIds`, and
  `plannedDimensions` were empty.
- The raw moduleMining result confirms that shape:
  selected module `moduleId=target:AOXFoundationKit:...` had empty
  `dimensionIds`, `dimensions`, and `plannedDimensions`.
- The route still created source refs, but coverage attribution skipped:
  `coverageLedger.status="skipped"`, `reason="no-matching-source-refs"`,
  `writtenCells=0`, `measuredCells=0`, `dimensionIds=[]`.
- Final DB retained the AOXFoundationKit architecture coverage row as thin:
  `covered_count=0`, `covered_source_refs=[]`.

## Source Corroboration

- In KnowledgeRescanWorkflow Step 7, moduleMining selection uses filtered
  `executionDimensions` rather than the explicit per-module target dimensions.
  When gap analysis skips a requested target dimension as already fully covered,
  Entry B drops the binding dimensions before moduleMining evidence/coverage
  can be written.
- `buildKnowledgeRescanMiningPlanOptions` does preserve
  `moduleDimensionTargets` into `moduleMiningBindings`, but the selector then
  intersects those bindings with the empty execution set.
- This is an Alembic product route defect, not Test setup drift. Test correctly
  avoided force/reset/preclean variants because the dispatch package did not
  authorize changing runtime data/setup to manufacture a pass.

## Decision Boundary

This closes the question of whether the previous Alembic repair was sufficient:
it was sufficient for Entry A, but not for Entry B.

Do not conclude:

- P11 accepted
- G4 coverage gate passed
- G6 twin/shim removal safe
- P12 ready
- whole demand complete

## Required Rework

Dispatch Alembic to repair Entry B so explicit moduleMining/per-module
`moduleDimensionTargets` remain bound into selected module
`plannedDimensions`/`dimensionIds` and coverage ledger writes even when global
gap analysis skips the same dimension as fully covered.

The repair must preserve:

- Entry A passing behavior
- Entry B planned-only / non-all-dimension behavior
- source-ref-backed recipe materialization
- deep_mining_rounds non-advancement for moduleMining
- session cleanup
- provider routing
- frozen stage/job/source/tool/lifecycle/coverage literal values

After Alembic source repair is accepted, dispatch the same real BiliDili P11
rerun again.
