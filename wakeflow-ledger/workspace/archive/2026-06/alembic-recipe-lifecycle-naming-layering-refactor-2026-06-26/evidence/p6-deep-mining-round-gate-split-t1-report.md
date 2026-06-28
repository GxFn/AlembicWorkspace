# P6 DeepMining Round Gate Split Target Evidence

Target: `Alembic / p6-deep-mining-round-gate-split-t1`
Commit: `80fa6a5b518847138fbe79acc4e26e551ba356a6`

## Changed Files

- `lib/daemon/DaemonJobRunner.ts`
- `lib/daemon/DaemonJobServices.ts`
- `lib/daemon/DaemonJobWorkflowHelpers.ts`
- `lib/daemon/DaemonJobWorkflowTypes.ts`
- `lib/daemon/PlanSelectionGate.ts`
- `lib/daemon/DeepMiningRoundGate.ts`
- `lib/daemon/ModuleMiningWorkflow.ts`
- `test/unit/DaemonJobRunnerPlanGate.test.ts`

`git show --stat --oneline --no-renames HEAD` reported 8 files changed,
1182 insertions and 1081 deletions.

## Implementation Summary

- `DaemonJobRunner.ts` now remains the daemon job lifecycle/dispatch entry.
- `PlanSelectionGate.ts` owns `runBootstrapPlanGate` and `runPlanSelectionGate`.
- `DeepMiningRoundGate.ts` owns the in-process deepMining round loop, coverage
  ledger cell seeding, advisor break check, round open/close accounting, and
  `runAsyncFillInline: true` rescan call.
- `ModuleMiningWorkflow.ts` owns in-process moduleMining plan selection,
  ProjectMap module selection, agent fan-out call, and persisted source-ref-backed
  recipe accounting.
- `DaemonJobServices.ts`, `DaemonJobWorkflowTypes.ts`, and
  `DaemonJobWorkflowHelpers.ts` hold shared daemon job services, types, argument
  normalization, envelope unwrap, and record helpers so the new modules do not
  import `DaemonJobRunner.ts` back through an ESM cycle.

## Characterization

- Existing deepMining tests continue to prove one daemon job drives multiple
  rounds, preserves open/close round order, and passes module dimension targets,
  per-dimension targets, module scope, and round index into
  `runKnowledgeRescanWorkflow`.
- `test/unit/DaemonJobRunnerPlanGate.test.ts` now explicitly asserts the inline
  coverage cell write is observed before the round-close `upsertRound` call that
  writes `newRecipesThisRound`.
- ModuleMining tests continue to prove ProjectMap modules are used instead of
  moduleSeeds, scaleCap applies as module cap, empty module plans fail before
  agent work, persisted source-ref-backed output is counted, and true zero output
  still fails.

## Validation

- `npm run build:check`: passed using local `../AlembicCore` source and
  `tsc --noEmit`.
- `npm run build`: passed (`build:core`, `clean:dist`, `tsc`, `postbuild`).
- `npm run lint:repo-boundary`: passed, `@escape-hatch` count 1 / 75 threshold.
- `npm run lint`: exit 0. Remaining warnings are pre-existing `noExplicitAny`
  warnings in `lib/service/handler-runtime/types.ts` and
  `lib/workflows/ai-execution/AgentRunProjections.ts`; no changed file warning.
- `npm run typecheck`: passed.
- `npx vitest run test/unit/DaemonJobRunnerPlanGate.test.ts test/unit/DaemonJobRunner.test.ts`:
  2 files and 32 tests passed.
- `git diff --check`: passed.
- `git diff --check HEAD~1 HEAD`: passed.

## Scope And Invariants

- No `AlembicCore`, `vendor/AlembicCore`, `package.json`, or lockfile change.
- No P7/P8/P9/P10/P11 collapse or `runProjectIndexWorkflow` unification.
- No direct BiliDili REAL-TEST was run in this code package; the P6 task package
  assigns that to controller/Test after code acceptance.
- `git diff -U0 -- lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts vendor/AlembicCore package.json package-lock.json`
  returned empty, so the R-2 `cleanup.projectRoot` workflow files and vendor/package
  surfaces were not touched.
- Grep proof found frozen `coldStart`, `deepMining`, `moduleMining`,
  `bootstrap-session:`, `coverage_ledger`/`deep_mining_rounds` context, and
  `cleanup.projectRoot` in the expected daemon/workflow/test files after the split.

## Tooling Note

`alembic_code_guard` was attempted on the explicit P6 file list and failed with
the known internal schema error `unrecognized key "data"`. `alembic_status`
itself returned ready; repository build/test/lint evidence above is the validation
basis for this target result.
