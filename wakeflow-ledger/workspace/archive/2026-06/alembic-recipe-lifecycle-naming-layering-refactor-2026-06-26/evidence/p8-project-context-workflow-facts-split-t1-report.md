# P8 ProjectContextWorkflowFacts Split Target Report

Date: 2026-06-28
Window: Alembic
Task: `p8-project-context-workflow-facts-split-t1`
Dispatch group: `p8-project-context-workflow-facts-split-p1`
State root: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26`

## Result

- Status: completed.
- Alembic commit: `e1298f5c477be7dfad3f767cf021dc44299e28fa` (`refactor: split project context workflow facts`).
- Repository status after commit and validation: `main...origin/main [ahead 6]`, clean working tree.
- No push performed.

## Scope Implemented

- Added `lib/workflows/project-context/ProjectMapModules.ts`.
  - Moved `buildProjectMapModules`.
  - Moved `buildProjectMapModulesFromTargets`.
  - Kept the SwiftPM target-path, owned-file, common-prefix, and dedupe helpers with that ProjectMap module-building behavior.
- Added `lib/workflows/project-context/ProjectContextPresenters.ts`.
  - Moved `presentProjectContextColdStartEmptyProject`.
  - Moved `presentProjectContextColdStartResponse`.
  - Moved `presentProjectContextRescanResponse`.
  - Moved the presenter-local envelope and analysis-framework helpers.
- Kept `buildProjectContextWorkflowFacts` and dimension/session/facts selection logic in `ProjectContextWorkflowFacts.ts`.
- Updated Alembic consumers in the same commit:
  - `lib/workflows/cold-start/ColdStartWorkflow.ts` imports cold-start presenters from `ProjectContextPresenters.ts`.
  - `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` imports the rescan presenter from `ProjectContextPresenters.ts`.
  - `ModuleMiningWorkflow.ts` continues consuming the `ProjectContextWorkflowFacts` facts type; no new direct import was needed there.
- Preserved compatibility re-exports from `ProjectContextWorkflowFacts.ts` for moved helpers/presenters.

Line-count split after commit:

```text
1044 lib/workflows/project-context/ProjectContextWorkflowFacts.ts
 395 lib/workflows/project-context/ProjectMapModules.ts
 184 lib/workflows/project-context/ProjectContextPresenters.ts
```

## Characterization / Proof

- `test/unit/ProjectContextWorkflowFacts.test.ts` now directly characterizes:
  - Fixed `ProjectMap` input to `buildProjectMapModules`.
  - Fixed target/all-files input to `buildProjectMapModulesFromTargets`.
  - Cold-start empty-project presenter envelope.
  - Cold-start presenter envelope with `meta.tool: 'alembic_bootstrap'`.
  - Rescan presenter envelope with `meta.tool: 'alembic_rescan'`, `deepMining` mining mode, inline-fill coverage ledger summary, and complete status.
  - Source-boundary assertion: facts core still has the `moduleSeeds` detail loop and calls `buildProjectMapModules`, while builder/presenter function bodies live in their new modules.
- Existing ProjectContext facts tests still cover target fallback module derivation, BiliDili-style SwiftPM module derivation, nested local Swift package target paths, mission artifacts, and session release behavior.
- `test/unit/DaemonJobRunnerPlanGate.test.ts` was rerun as P6/P8 seam evidence for deepMining/moduleMining plan-gate behavior.

## Validation

Final post-commit commands:

```text
npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts
PASS: 2 files, 28 tests.

npm run build:check
PASS: npm run build:core plus tsc --noEmit; build used local ../AlembicCore.

npm run lint:repo-boundary
PASS: Repository boundary check passed; @escape-hatch count 1 / 75, permanent 1, temporary 0.

npx biome check lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/workflows/project-context/ProjectMapModules.ts lib/workflows/project-context/ProjectContextPresenters.ts lib/workflows/cold-start/ColdStartWorkflow.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts test/unit/ProjectContextWorkflowFacts.test.ts
PASS: checked 6 files, no fixes applied.

git diff --check HEAD~1 HEAD
PASS.
```

Pre-commit also ran Biome check/fix and Biome format over the staged files before creating commit `e1298f5`.

## Import / Frozen-Token Evidence

- Presenter consumers now import from `ProjectContextPresenters.ts`:
  - `lib/workflows/cold-start/ColdStartWorkflow.ts`
  - `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
- Facts core imports ProjectMap builders from `ProjectMapModules.ts`.
- `ProjectContextWorkflowFacts.ts` keeps compatibility re-exports for moved helper symbols.
- Frozen tokens remain present in current Alembic source/tests after the split:
  - `coldStart`, `deepMining`, `moduleMining`
  - `alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`
  - `coverage_ledger`, `deep_mining_rounds`
  - `bootstrap-session:`
  - `alembic-main-bootstrap`, `alembic-main-rescan`
- No Core, Plugin, Agent, Dashboard, BiliDili, vendor, release, migration, public tool-name, route, or version files were edited.

## Tooling Notes

- `alembic_status` accepted the Alembic repo root as trusted, but reported unusable Codex knowledge/ProjectContext and an active Alembic UI selection mismatch with another project. Raw source reads and repository validation were therefore used as proof.
- `alembic_work` and `alembic_code_guard` both failed with the existing MCP internal schema error:

```text
unrecognized key "data"
```

This is recorded as a guard/tool-surface risk, not a code finding.

## Risks / Next Recommendation

- No independent REAL-TEST was run because P8 design defers in-process end-to-end coverage to P10.
- Residual risk is limited to the unavailable Alembic guard tool surface.
- Recommended next action: controller review of this target result, then continue the confirmed sequence toward P9/P10 according to state-root phase order.
