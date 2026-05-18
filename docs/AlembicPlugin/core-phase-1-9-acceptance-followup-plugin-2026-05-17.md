# AlembicPlugin Phase 1-9 Acceptance Follow-up

Date: 2026-05-17

Source report: `docs/AlembicCore/alembic-core-phase-1-9-outer-repo-acceptance-report-2026-05-17.md`

Repository: `AlembicPlugin`

## Completed Plugin Tasks

### P1 Lint Blocker

`config/core-import-boundary-allowlist.json` was formatted and refreshed to match the Core scanner's current acceptance口径.

Current Core scanner result:

- Files scanned: 600
- Core imports scanned: 669
- Unique specifiers: 96
- Stable Public: 461
- Provisional Public: 8
- Transitional Internal: 200
- Violations: 0

### P2 Boundary Script口径

`scripts/lint-core-import-boundary.mjs` was removed.

`package.json` now makes `lint:core-import-boundary` delegate directly to `lint:consumer-core-imports`, which runs:

`node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`

This removes the previous mismatch where the plugin-local script reported old historical statistics while the Core scanner reported the accepted consumer boundary.

### P3 Stable Replacements

`@alembic/core/shared/lifecycle` was replaced with `@alembic/core/events` for `Disposable` and `Startable`.

Files changed:

- `lib/agent/forge/TemporaryToolRegistry.ts`
- `lib/agent/memory/SessionStore.ts`
- `lib/infrastructure/cache/CacheCoordinator.ts`
- `lib/infrastructure/monitoring/ErrorTracker.ts`
- `lib/infrastructure/monitoring/PerformanceMonitor.ts`
- `lib/service/signal/HitRecorder.ts`

`@alembic/core/repository/knowledge/KnowledgeRepository.impl` was removed from plugin imports where the stable repository facade was sufficient.

Files changed:

- `test/helpers/panorama-mocks.ts`
- `test/integration/KnowledgeCRUD.test.ts`
- `test/integration/BiliDiliPressureTest.test.ts`
- `test/unit/RecipeImpactPlanner.test.ts`

Replacement used:

- `@alembic/core/repositories`
- `createAlembicRepositories(...)`
- `KnowledgeRepository` and `SourceRefRepository` public types

## Remaining Core Feedback

These imports remain because the current stable facade set does not expose a coherent replacement, or because stabilizing them requires a Core API design decision.

| Current import | Count | Files | Plugin usage | Core feedback |
| --- | ---: | --- | --- | --- |
| `@alembic/core/types/workflows` | 9 | `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionAdmission.ts`; `lib/workflows/capabilities/execution/internal-agent/BootstrapRuntimeInitializer.ts`; `lib/workflows/capabilities/execution/internal-agent/DimensionRestoreState.ts`; `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`; `lib/workflows/capabilities/execution/internal-agent/MockBootstrapPipeline.ts`; unit tests | `IncrementalPlan`, `RestoredEpisodicMemory`, `McpContext` | `@alembic/core/host-agent-workflows` exports execution/persistence/planning modules, but not these shared workflow context/memory contracts as a single public surface. Core should decide whether they belong in `host-agent-workflows` or a narrower workflow contract facade. |
| `@alembic/core/types/snapshot-views` | 6 | `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts`; internal-agent pipeline files | `PipelineFillView` | `@alembic/core/project-intelligence` exposes project snapshot types, but does not currently expose `PipelineFillView`. Core should decide whether this is a project-intelligence view contract or a workflow execution view contract. |
| `@alembic/core/service/knowledge/KnowledgeSyncService` | 6 | `lib/cli/SetupService.ts`; `lib/injection/ServiceMap.ts`; `lib/injection/modules/InfraModule.ts`; `lib/service/bootstrap/UiStartupTasks.ts`; `test/unit/KnowledgeFileWriter.test.ts` | bootstrap sync service construction and startup task typing | `@alembic/core/knowledge` exposes `KnowledgeService` and `RecipeProductionGateway`, not sync service orchestration. Core should expose a narrow sync contract or keep this transitional. |
| `@alembic/core/service/knowledge/SourceRefReconciler` | 7 | `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts`; DI modules; `UiStartupTasks`; tests | source reference health and rescan reconciliation | Needs a stable source-reference reconciliation contract. Directly exposing the service class may be too broad. |
| `@alembic/core/service/knowledge/ConfidenceRouter` | 6 | DI module/types; governance and service tests; BiliDili pressure test | lifecycle confidence routing and staging decisions | This is a knowledge governance policy service. Core should decide whether `@alembic/core/knowledge` exports a narrow confidence-routing interface or whether it remains transitional. |
| `@alembic/core/infrastructure/config/Paths` | 5 | Skill adapter/MCP skill handler/cleanup/structure routes | project skill path and config path helpers used by plugin delivery logic | Some calls are plugin delivery-path logic. Core should decide whether `getProjectSkillsPath` belongs in `workspace`/`config`, while keeping Codex Skill packaging logic outside Core. |
| `@alembic/core/shared/concurrency` | 5 | `AgentRunCoordinator`; `FanOutStrategy`; HTTP routes; concurrency test | `createLimit`, `ioLimit`, `cpuLimit` | This is partly generic and partly execution policy. Do not stabilize until Core decides whether these are shared deterministic utilities or host execution strategy. |
| `@alembic/core/shared/developer-identity` | 5 | MCP knowledge/consolidated/dimension handlers; HTTP health/route helpers | system metadata injected into recipe creation/status responses | Likely belongs to a knowledge metadata contract, but current usage also touches delivery responses. Needs Core API design before replacement. |

## Explicit Non-goals

No Codex Skill text, MCP tool schema, marketplace/channel delivery, daemon bridge, API key readiness, AI provider execution, model strategy, AgentRuntime, tool policy, or prompt/tool naming was moved into Core.

## Validation

Already passed during this follow-up:

- `npm run lint -- --diagnostic-level=error`
- `npm run lint`
- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`
- `npm run build:check`
- `npm run test:unit -- test/unit/HitRecorder.test.ts test/unit/TemporaryToolRegistry.test.ts test/unit/RecipeImpactPlanner.test.ts test/unit/KnowledgeFileWriter.test.ts`
- `npx vitest run test/integration/KnowledgeCRUD.test.ts test/integration/BiliDiliPressureTest.test.ts`
- `git diff --check`

Notes:

- `npm run lint` exits 0 and still reports existing warning debt unrelated to this follow-up.
- `BiliDiliPressureTest` skipped because the local BiliDili database fixture was not present; `KnowledgeCRUD` passed.
