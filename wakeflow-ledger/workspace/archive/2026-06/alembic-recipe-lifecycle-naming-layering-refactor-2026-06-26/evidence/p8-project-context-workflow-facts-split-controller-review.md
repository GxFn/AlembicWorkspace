# P8 Controller Review - ProjectContextWorkflowFacts Split

Date: 2026-06-28
Controller: AlembicWorkspace
Dispatch group: `p8-project-context-workflow-facts-split-p1`
Target: `Alembic / p8-project-context-workflow-facts-split-t1`

## Decision

Accept target result.

## Requirement Authority

Design authority is `Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md` §12.2 P8 and §12.4.

P8 scope is an Alembic-local hot split of `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`: move `buildProjectMapModules` and `buildProjectMapModulesFromTargets` to `ProjectMapModules.ts`; move `presentProjectContextColdStartEmptyProject`, `presentProjectContextColdStartResponse`, and `presentProjectContextRescanResponse` to `ProjectContextPresenters.ts`; keep `buildProjectContextWorkflowFacts` plus dimension/session/facts selection in the core facts file; update Alembic consumers in the same commit. P8 explicitly has no independent REAL-TEST; P10 covers in-process end-to-end.

## Evidence Reviewed

- Target result envelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p8-project-context-workflow-facts-split-t1.json`
- Target report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p8-project-context-workflow-facts-split-t1-report.md`
- Alembic commit: `e1298f5c477be7dfad3f767cf021dc44299e28fa` (`refactor: split project context workflow facts`)
- Reviewed files:
  - `Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
  - `Alembic/lib/workflows/project-context/ProjectMapModules.ts`
  - `Alembic/lib/workflows/project-context/ProjectContextPresenters.ts`
  - `Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
  - `Alembic/test/unit/ProjectContextWorkflowFacts.test.ts`

## Implementation Reality

- `ProjectMapModules.ts` contains the moved project-map and target-derived module builders plus their helper functions.
- `ProjectContextPresenters.ts` contains the moved cold-start empty-project presenter, cold-start presenter, and rescan presenter.
- `ProjectContextWorkflowFacts.ts` imports the moved ProjectMap builders, keeps `buildProjectContextWorkflowFacts` and the moduleSeeds/detail loop, and keeps compatibility re-exports for moved builder and presenter symbols.
- `ColdStartWorkflow.ts` imports cold-start presenters from `ProjectContextPresenters.ts`.
- `KnowledgeRescanWorkflow.ts` imports the rescan presenter from `ProjectContextPresenters.ts`.
- `ModuleMiningWorkflow.ts` did not require a direct import change; it continues to consume facts/types through the existing boundary.
- Commit touched only the expected Alembic files and test file. No Core, Plugin, Agent, Dashboard, BiliDili, vendor, release, migration, public tool-name, route, or version files changed.

## Independent Validation

Controller reran these commands in `Alembic`:

```text
npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts
PASS: 2 files, 28 tests.

npx biome check lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/workflows/project-context/ProjectMapModules.ts lib/workflows/project-context/ProjectContextPresenters.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts test/unit/ProjectContextWorkflowFacts.test.ts
PASS: checked 6 files, no fixes applied.

npm run lint:repo-boundary
PASS: repository boundary check passed; @escape-hatch count 1 / 75, permanent 1, temporary 0.

npm run build:check
PASS: build:core used local ../AlembicCore, then tsc --noEmit passed.

git diff --check HEAD~1 HEAD
PASS.
```

Additional source checks confirmed:

- Frozen tokens remain present at current Alembic HEAD: `coldStart`, `deepMining`, `moduleMining`, `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`, `coverage_ledger`, `deep_mining_rounds`, `bootstrap-session:`, `alembic-main-bootstrap`, and `alembic-main-rescan`.
- `git status --short --branch` reports `main...origin/main [ahead 6]` with a clean working tree.
- `git rev-parse HEAD` equals `e1298f5c477be7dfad3f767cf021dc44299e28fa`.

## Blockers And Risks

No P8 acceptance blocker.

Residual tooling risk: `alembic_work` and `alembic_code_guard` remain unavailable from the target due the existing MCP schema error `unrecognized key "data"`. This did not block P8 because controller performed raw source review and repository validation.

No P8 REAL-TEST was expected; design defers that in-process end-to-end coverage to P10.

## TODO / Backlog Rollup

No new TODO is authorized by this P8 evidence. Continue the confirmed P1-P15 sequence.

## Next Action

Run Wakeflow reducer and accept `p8-project-context-workflow-facts-split-t1`, then continue to P9 per the confirmed phase order.
