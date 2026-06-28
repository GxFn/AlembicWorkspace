# R1 Alembic In-Process Module Axis Canonical Target Report

## Scope

- Target window: Alembic
- Task id: r1-alembic-inprocess-module-axis-canonical-t1
- Dispatch group: r1-alembic-inprocess-module-axis-canonical-p1
- State root: .wakeflow-active/current/alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28

This target completed the Alembic in-process consumer step for R-1. It consumed
the accepted AlembicCore producer commit `cf5317efbef3f9e80cd3bd4c516272acdcf9923a`
through the existing `@alembic/core/host-agent-workflows` facade. It did not edit
AlembicCore, AlembicPlugin, vendor snapshots, release metadata, R-2 schema
behavior, real BiliDili data, or Test assets.

## Commit

- Alembic: 6db9b0274f79cb4a73f4e4cc6e55baaa648f6ba0
  - Message: Canonicalize in-process module coverage axes
  - Changed files:
    - `lib/workflows/project-context/ProjectMapModules.ts`
    - `lib/workflows/project-context/ProjectContextWorkflowFacts.ts`
    - `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`
    - `lib/daemon/ModuleMiningSelection.ts`
    - `lib/shared/ModuleMiningEvidence.ts`
    - `test/unit/ProjectContextWorkflowFacts.test.ts`
    - `test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts`
    - `test/unit/ModuleMiningSelection.test.ts`
    - `test/unit/DaemonJobRunnerPlanGate.test.ts`

## Implementation

- Wired `buildProjectMapModules` to `buildCanonicalCoverageLedgerModuleId`, with
  `projectRoot` supplied by `buildProjectContextWorkflowFacts`.
- Updated the target-ref fallback module path builder to use the same Core helper
  instead of hand-rolling `target:{moduleName}:{modulePath}`.
- Preserved explicit no-path fallback ids for ProjectMap modules that do not have
  usable module paths.
- Filtered aggregate/root axes when the Core helper returns no canonical module id.
- Added defensive canonicalization in module-mining selection and module-mining
  coverage ledger payload construction, so downstream in-process evidence cannot
  reintroduce plain `module.id` when `moduleName` + `modulePath` are available.
- Passed `projectRoot` through knowledge-rescan coverage module summary
  construction so Core aggregate/root filtering has project-root context.

## Behavioral Proof

Tests now cover:

- ProjectMap modules with `moduleName` + `modulePath` produce
  `target:{moduleName}:{modulePath}` instead of plain `module.id`.
- Already target-scoped module ids remain stable.
- No-path modules keep their explicit fallback ids.
- Aggregate/root ProjectMap axes are filtered before coverage fan-out.
- Knowledge-rescan and module-mining ledger writes persist canonical module ids.
- Daemon moduleMining selected payloads and coverage ledger state use canonical
  target-scoped ids for ProjectMap-backed modules.

## Validation

Passed:

- `npx biome check lib/workflows/project-context/ProjectMapModules.ts lib/workflows/project-context/ProjectContextWorkflowFacts.ts lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts lib/daemon/ModuleMiningSelection.ts lib/shared/ModuleMiningEvidence.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
- `npx vitest run test/unit/ProjectContextWorkflowFacts.test.ts test/unit/KnowledgeRescanCoverageLedgerWrite.test.ts test/unit/ModuleMiningSelection.test.ts test/unit/DaemonJobRunnerPlanGate.test.ts`
  - 4 files passed, 53 tests passed.
- `npm run build:check`
  - Used local AlembicCore source at `../AlembicCore`.
- `npm run lint:repo-boundary`
- `npm run lint:core-import-boundary`
  - Scanned 362 files and 436 `@alembic/core` imports.
- `git diff --check`
- `npm run lint`
  - Command exited 0. It reported existing warning-level `noExplicitAny` findings
    in untouched files:
    - `lib/service/handler-runtime/types.ts`
    - `lib/workflows/ai-execution/AgentRunProjections.ts`

## Guard And Tool Notes

- `alembic_status` for this Alembic checkout reported initialized-but-empty local
  knowledge (`hasKnowledge=false`, `usable=false`).
- `alembic_code_guard` was attempted twice:
  - full touched-file set
  - minimal single-file retry on `ProjectMapModules.ts`
- Both Guard attempts failed inside the tool surface with the same schema error:
  `unrecognized_keys` for `data.unifiedEvolution.checkpoint.initializationSource`.
  This is recorded as a Guard tool-surface blocker, not as a source-code finding.

## Remaining Boundaries

- This target does not complete R-1 final parity acceptance by itself.
- AlembicPlugin host/dimension-completion consumer work remains separate.
- Final real parity still requires controller/Test follow-up after all R-1
  consumers are present.
