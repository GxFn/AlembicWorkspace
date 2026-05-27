# AlembicPlugin Phase 7 Host Agent Workflow Contract Execution

Date: 2026-05-17

Scope: AlembicPlugin only. This record follows `docs/alembic-core-public-api-boundary-construction-plan-2026-05-17.md` Phase 7 and keeps Plugin documentation in workspace-level `docs/AlembicPlugin`.

## Core Baseline

- AlembicPlugin vendored Core submodule advanced from `7865bf3` to `8323aa2 feat: add stable host agent workflow facade`.
- Core stable entry used by Plugin: `@alembic/core/host-agent-workflows`.
- Runtime facade check confirmed these functions are exported from the package self-reference:
  - `createExternalColdStartIntent`
  - `createExternalKnowledgeRescanIntent`
  - `buildColdStartWorkflowPlan`
  - `buildKnowledgeRescanWorkflowPlan`
  - `buildExternalMissionBriefing`
  - `createExternalWorkflowSession`
  - `runExternalDimensionCompletionWorkflow`
  - `saveDimensionCheckpoint`
  - `buildKnowledgeRescanPlan`
  - `buildLanguageExtension`
  - `runFullResetPolicy`

## Completed Plugin Batches

- Codex handler intent batch:
  - cold-start and knowledge-rescan intents, workflow plan builders, presenters, and cleanup policies now import from `@alembic/core/host-agent-workflows`.
  - MCP tool schema, preflight, Codex response envelopes, nextActions, and transport cleanup remain in Plugin.
- Briefing/session batch:
  - external mission briefing/session helpers and session support now import from the stable facade.
  - Codex Skill wording, tool names, tool policy, plugin cache paths, and marketplace/channel release logic remain in Plugin.
- Dimension completion batch:
  - `runExternalDimensionCompletionWorkflow` is loaded through `@alembic/core/host-agent-workflows`.
  - Plugin-owned MCP argument normalization, permission/policy, response envelope, session bridge, EventBus emission, and runtime status stay local.
- Checkpoint/resume/persistence batch:
  - dimension checkpoint, workflow report history/writer/types, workflow result persistence, and snapshot helpers now import from the stable facade where used.
  - Plugin channel/package paths, resource copying, daemon bridge, and cache synchronization stay local.
- Planning/presentation batch:
  - dimension terminal toolset, tier scheduler, tier reflection, knowledge rescan planning, evidence projectors, evolution prescreen, language extension, and target classifier helpers now import from the stable facade.

## Remaining Allowed Exception

- `@alembic/core/types/workflows`
  - Still used for `IncrementalPlan`, `RestoredEpisodicMemory`, `McpContext`, and related workflow runtime data types.
  - Reason: these types are not exported by `@alembic/core/host-agent-workflows` at `8323aa2`.
  - Boundary status: retained as a documented transitional type import; do not duplicate these types in Plugin.

## Boundary Gate Update

- `config/core-import-boundary-allowlist.json`
  - Phase label advanced to Phase 1 baseline with Phase 2/3/4/5/6/7 gates.
  - `referenceCount`: 777.
  - `uniqueSpecifierCount`: 113.
  - Added stable allowlist entry: `@alembic/core/host-agent-workflows`.
  - Removed obsolete Phase 7 deep workflow paths from the allowlist:
    - `@alembic/core/workflows/cold-start/*`
    - `@alembic/core/workflows/knowledge-rescan/*`
    - `@alembic/core/workflows/shared/WorkflowTypes`
    - `@alembic/core/workflows/capabilities/execution/external/*`
    - `@alembic/core/workflows/capabilities/persistence/*`
    - `@alembic/core/workflows/capabilities/planning/dimensions/*`
    - `@alembic/core/workflows/capabilities/planning/knowledge/*`
    - `@alembic/core/workflows/capabilities/presentation/*`
    - `@alembic/core/workflows/capabilities/WorkflowCleanupPolicies`

## Validation

- `npm run lint:core-import-boundary`
  - Passed: 777 refs, 113 unique specifiers.
- `npm run build:check`
  - Passed.
- `npm run test:unit -- test/unit/KnowledgeRescanIntent.test.ts test/unit/KnowledgeRescanPlan.test.ts test/unit/WorkflowTypes.test.ts test/unit/WorkflowResultPersistence.test.ts test/unit/MissionBriefingProfile.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/BootstrapDimensionRuntimeBuilder.test.ts`
  - Passed: 32 tests.
- `npm run test:unit -- test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/DimensionRestoreState.test.ts test/unit/BootstrapDimensionAdmission.test.ts test/unit/BootstrapRuntimeInitializer.test.ts test/unit/BootstrapSessionExecutionBuilder.test.ts`
  - Passed: 17 tests.
- `./node_modules/.bin/biome check --write ...`
  - Passed with existing warnings in rescan handlers and audit emission tests.
- `git diff --check`
  - Passed.
- Runtime facade import check
  - Passed for the key host-agent workflow functions listed in the Core baseline section.

## Next Core Blocker

- Export `IncrementalPlan`, `RestoredEpisodicMemory`, `McpContext`, and related `types/workflows` contracts through a stable public workflow facade before Plugin can remove `@alembic/core/types/workflows`.
