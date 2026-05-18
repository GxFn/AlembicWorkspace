# AlembicPlugin Core Public API Phase 9 Stable Facade Replacement

Date: 2026-05-17

Source plan: `/Users/gaoxuefeng/Documents/AlembicWorkspace/docs/alembic-core-public-api-boundary-construction-plan-2026-05-17.md`

Plugin repository: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin`

## Scope

This phase closes the AlembicPlugin side of Phase 9 after Core added public API boundary governance.

AlembicPlugin remains a Codex and IDE plugin integration repository. This phase did not move Codex Skill, MCP tool, marketplace channel, daemon bridge, API key, provider execution, or host adapter behavior into Core.

## Core Baseline

The plugin vendor submodule was advanced from:

- `dfb4c7c feat: add consumer core import boundary lint`

to:

- `6b7b52a chore: add public api boundary governance`

Only the submodule pointer inside AlembicPlugin was changed. No sibling Core workspace files were edited.

## Completed Replacements

The plugin replaced the Phase 9 stable facade batches across `bin`, `lib`, `scripts`, and `test`:

- Logging: `@alembic/core/infrastructure/logging/Logger` to `@alembic/core/logging`
- Events, signal, timer: `@alembic/core/infrastructure/event/EventBus`, `@alembic/core/infrastructure/signal/SignalBus`, and `@alembic/core/shared/TimerRegistry` to `@alembic/core/events`
- IO and workspace: `@alembic/core/infrastructure/io/WriteZone`, `@alembic/core/shared/PathGuard`, `@alembic/core/shared/resolveProjectRoot`, `@alembic/core/shared/WorkspaceResolver`, `@alembic/core/shared/ProjectRegistry`, `@alembic/core/shared/ProjectMarkers`, and `@alembic/core/shared/folder-names` to `@alembic/core/io` and `@alembic/core/workspace`
- Knowledge and dimensions: `@alembic/core/domain/knowledge/KnowledgeEntry`, `@alembic/core/domain/knowledge/Lifecycle`, `@alembic/core/service/knowledge/KnowledgeService`, `@alembic/core/service/knowledge/RecipeProductionGateway`, `@alembic/core/domain/dimension/DimensionCopy`, and `@alembic/core/domain/dimension/RecipeDimension` to `@alembic/core/knowledge` and `@alembic/core/dimensions`

Import shape fixes were required because the stable facades expose named exports for `pathGuard`, `WorkspaceResolver`, and `DimensionCopy`. `@alembic/core/logging` still supports the default `Logger` export.

Plugin tests were adjusted to public facade semantics. `@alembic/core/knowledge` exposes `Lifecycle` as a named export, not a default export, and does not currently expose `normalizeLifecycle`.

## Boundary Config

`config/core-import-boundary-allowlist.json` was updated for Phase 9:

- Phase label: `Phase 1 baseline with Phase 2/3/4/5/6/7/8/9 gates`
- Reference count: `764`
- Unique specifier count: `102`
- Stable specifiers added: `@alembic/core/dimensions`, `@alembic/core/events`, `@alembic/core/io`, `@alembic/core/knowledge`, `@alembic/core/logging`, `@alembic/core/workspace`
- Replaced deep specifiers removed from the allowlist and reference limits.

The migrated old-path batch has no remaining references in `bin`, `lib`, `scripts`, or `test`.

## Remaining Gaps

These are still gated transitional imports and should not be expanded without a Core facade decision:

- `@alembic/core/types/workflows`: still used for `IncrementalPlan`, `RestoredEpisodicMemory`, `McpContext`, and related internal-agent workflow contracts. `@alembic/core/host-agent-workflows` does not currently cover these types.
- `@alembic/core/types/snapshot-views`: still used for `PipelineFillView`. It is not currently covered by `@alembic/core/project-intelligence` or a report/presentation contract.
- `@alembic/core/shared/WorkspaceSettingsStore`: still used by plugin bootstrap, Codex state, MCP state, HTTP AI route, and tests. `@alembic/core/workspace` does not currently expose this store.
- `@alembic/core/shared/lifecycle`, `@alembic/core/shared/concurrency`, `@alembic/core/shared/test-mode`, `@alembic/core/shared/token-utils`, `@alembic/core/shared/developer-identity`, and `@alembic/core/shared/errors/*`: still need Core public boundary judgment.
- `@alembic/core/knowledge` does not currently expose `normalizeLifecycle`. The plugin no longer consumes it through a deep path; if it should be public, Core should expose it explicitly in a later facade change.

## Verification

Passed:

- `npm run build:check`
- `npm run lint`
- `npm run lint:core-import-boundary`
- `npm run test:unit -- test/unit/SignalBus.test.ts test/unit/EventBus.test.ts test/unit/WorkspaceResolver.test.ts test/unit/PathGuard.test.ts test/unit/KnowledgeEntry.test.ts test/unit/KnowledgeService.test.ts test/unit/RecipeDimension.test.ts test/unit/Lifecycle.test.ts test/unit/folder-names.test.ts test/unit/production-gateway.test.ts test/unit/WorkspaceSettingsStore.test.ts`
- `npx vitest run test/integration/DomainLifecycle.test.ts test/integration/KnowledgeGovernance.test.ts`

Notes:

- `npm run lint` exits successfully but reports existing warnings unrelated to this facade replacement.
- `npm run test:integration -- test/integration/DomainLifecycle.test.ts test/integration/KnowledgeGovernance.test.ts` invokes the package script's built-in `test/integration` directory and therefore ran the full integration suite. The full run failed only in `GuardApi.test.ts` and `HttpApi.test.ts` because the sandbox denied listening on `::1` ports. The two intended lifecycle/governance integration files pass when run directly with Vitest.

