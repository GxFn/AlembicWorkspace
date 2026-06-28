# Controller Review: R1 Consumer Module Axis Canonical

## Scope

- Demand: `alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`
- Reviewed target results:
  - `Alembic / r1-alembic-inprocess-module-axis-canonical-t1`
  - `AlembicPlugin / r1-plugin-host-dimension-module-axis-canonical-t1`
- State root: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`

This review accepts the two R-1 consumer implementation results only. It does
not complete final R-1 acceptance, because final R-1 still requires a non-empty
ProjectMap host-vs-in-process parity run with `diff=[]` and a BiliDili
no-regression run.

## Requirement Authority

R-1 requires the coverage module-id derivation to converge on one canonical
shape: `target:{moduleName}:{modulePath}`. The accepted Core producer is
`cf5317efbef3f9e80cd3bd4c516272acdcf9923a`, which exposes
`buildCanonicalCoverageLedgerModuleId` and canonicalizes module summaries.

## Alembic Consumer Evidence

- Commit: `6db9b0274f79cb4a73f4e4cc6e55baaa648f6ba0`
- Source review:
  - `ProjectMapModules.ts` now calls the Core helper with `projectRoot`.
  - `ProjectContextWorkflowFacts.ts` passes `projectRoot` into module fan-out.
  - Knowledge-rescan, moduleMining selection, and moduleMining evidence writes
    preserve the canonical target-scoped module id through downstream payloads.
  - No-path fallback ids are retained, and aggregate/root axes are filtered when
    Core returns no canonical id.
- Controller commands:
  - `git -C Alembic diff --check`
  - `npm run lint:core-import-boundary`
  - `npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - `npm run build:check`
  - `npm run lint:repo-boundary`
- Controller probe:
  - fixed ProjectMap input `Auth / src/auth`
  - observed `target:Auth:src/auth`
- Result:
  - 4 target test files passed, 53 tests.
  - Build and boundary checks passed.

## AlembicPlugin Consumer Evidence

- Commit: `4a47538229bef7d93bac31256ae7ce32bc5b5b77`
- Source review:
  - `coverage-module-axis.ts` filters generic parent containers before Core
    canonicalization, preventing parent paths such as `Sources` from becoming
    false target cells when more specific child modules exist.
  - Host rescan and dimension-completion both feed filtered summaries into Core
    `buildCoverageLedgerModuleAxisFromSummaries`.
  - Explicit target-scoped module ids are preserved.
  - The second writer, dimension-completion, now writes canonical target-scoped
    cells instead of plain module ids.
- Controller commands:
  - `npx vitest run test/unit/RescanCoverageModuleAxis.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts test/unit/CoverageLedgerTargetAxis.test.ts test/unit/CanonicalModuleAxis.test.ts test/unit/CoverageLedgerWiring.test.ts`
  - `npm run build:check`
  - `npm run lint:core-import-boundary`
  - `npm run lint:layer-boundary`
  - `npm run lint:repo-boundary`
  - `git -C AlembicPlugin diff --check`
- Controller probe:
  - fixed modules: `Sources`, `Auth / Sources/Auth`, and explicit
    `target:Kept:Sources/Kept`
  - observed the generic `Sources` axis filtered while `Auth` and explicit
    target-scoped `Kept` remained.
- Result:
  - 5 target test files passed, 47 tests.
  - Build and boundary checks passed.

## Decision

Accept both R-1 consumer target results. The next required R-1 step is Test
evidence for non-empty ProjectMap host-vs-in-process parity plus BiliDili
no-regression.

## Residual Risks

- `alembic_code_guard` remains blocked by the installed MCP schema surface until
  the already-reviewed R-2 Plugin source fix is loaded into the active runtime.
- No final REAL-TEST parity claim is made by this controller review.
