# Controller Review: R1 Alembic In-Process Module Axis Canonical

## Scope

- Demand: `alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28`
- Dispatch group: `r1-alembic-inprocess-module-axis-canonical-p1`
- Target task: `r1-alembic-inprocess-module-axis-canonical-t1`
- Target window: `Alembic`
- Reviewed target result: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/target-results/tr-r1-alembic-inprocess-module-axis-canonical-t1.json`
- Target report: `.wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28/evidence/r1-alembic-inprocess-module-axis-canonical-t1-report.md`

## Requirement Authority

R-1 requires all coverage module-id adapters to converge on the canonical
`target:{moduleName}:{modulePath}` shape. This review covers only the Alembic
in-process consumer. It does not complete R-1 final acceptance, which still
requires the AlembicPlugin host/dimension-completion consumer and real parity
evidence on a non-empty ProjectMap project, plus BiliDili no-regression.

## Evidence Reviewed

- Alembic commit: `6db9b0274f79cb4a73f4e4cc6e55baaa648f6ba0`
- Changed source files:
  - `Alembic/lib/workflows/project-context/ProjectMapModules.ts`
  - `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `Alembic/lib/daemon/ModuleMiningSelection.ts`
  - `Alembic/lib/shared/ModuleMiningEvidence.ts`
- Changed tests:
  - `Alembic/test/unit/ProjectContextWorkflowFacts.test.ts`
  - `Alembic/test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
  - `Alembic/test/unit/ModuleMiningSelection.test.ts`
  - `Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts`

## Controller Checks

- Source review confirmed `buildProjectMapModules` now calls
  `buildCanonicalCoverageLedgerModuleId` from `@alembic/core/host-agent-workflows`
  with `projectRoot`, filters aggregate/root axes when the helper returns no id,
  and preserves no-path fallback ids.
- Source review confirmed `buildProjectContextWorkflowFacts` passes `projectRoot`
  into ProjectMap module construction.
- Source review confirmed knowledge-rescan coverage ledger fan-out now passes
  `projectRoot` through Core `buildCoverageLedgerModuleAxisFromSummaries`.
- Source review confirmed moduleMining selection and moduleMining evidence
  projection canonicalize selected payload module ids before writing selected
  modules or coverage ledger cells.
- Core helper review confirmed existing target-scoped ids remain stable,
  moduleName+modulePath produce canonical target-scoped ids, explicit no-path
  fallback ids are preserved, and aggregate/root rows can be rejected.

## Commands Re-Run By Controller

- `git -C Alembic diff --check`
- `git -C Alembic status --short --branch`
- `npm run lint:core-import-boundary`
- `npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
- `npm run build:check`
- `npm run lint:repo-boundary`
- Runtime probe:
  - imported `buildProjectMapModules`
  - supplied a fixed ProjectMap module with name `Auth` and path `src/auth`
  - observed output module id `target:Auth:src/auth`

## Results

- Target Vitest suite passed: 4 files, 53 tests.
- `npm run build:check` passed using local `../AlembicCore`.
- `npm run lint:core-import-boundary` passed: 362 files and 436
  `@alembic/core` imports scanned.
- `npm run lint:repo-boundary` passed.
- Runtime probe returned `[{"moduleId":"target:Auth:src/auth", ...}]`.
- Alembic worktree is clean on `main`, ahead of `origin/main` by 1 commit.

## Decision

Accept the Alembic target result for its assigned scope. R-1 remains incomplete
until the AlembicPlugin consumer result is reviewed and the required parity
tests are run.

## Residual Risks

- `alembic_code_guard` was not usable for this target because the target report
  records a current MCP schema error in the guard tool surface.
- Final R-1 parity evidence is explicitly out of this single-target acceptance.
