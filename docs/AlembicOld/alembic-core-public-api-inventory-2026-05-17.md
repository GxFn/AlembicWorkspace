# AlembicCore Public API Inventory

Status: Phase 7 baseline
Date: 2026-05-17

This inventory separates current package exports from long-term public API promises. A path being listed in `package.json` only means it is currently importable; it does not automatically mean it is stable.

## Status Model

| Status | Meaning |
| --- | --- |
| Stable Public | Long-term API. Breaking changes require migration notes and a compatibility window. |
| Provisional Public | Real consumers exist, but the final facade and naming are still being designed. |
| Transitional Internal | Compatibility surface kept during migration. New outer-repo imports should avoid it. |
| Internal Only | Core implementation detail. Existing outer-repo imports must move away before the export can be removed. |
| Forbidden | Should not be exported or should not belong to Core. |

## Phase 7 Summary

| Status | Count |
| --- | ---: |
| Stable Public | 15 |
| Provisional Public | 21 |
| Transitional Internal | 98 |
| Internal Only | 0 |
| Forbidden | 0 |

Current package export count: 134.

Current wildcard export count: 61.

## Stable Public

| Export | Reason |
| --- | --- |
| `.` | Root entry remains the stable aggregate entry for commonly used Core contracts. |
| `./database` | Stable database connection, migration, SQLite, and Drizzle runtime contract facade. |
| `./daemon` | Stable daemon job/state contract; supervisor, launch, port selection, and delivery remain outside Core. |
| `./dimensions` | Stable dimension ownership, registry, SOP, tags, and storage bucket facade. |
| `./events` | Stable EventBus, SignalBus, lifecycle, and timer contract facade. |
| `./guard` | Stable Guard engine, ReverseGuard, reporting, source collection, and deterministic rule-checking facade. It does not expose MCP, CLI, or Codex tool schema as Core API. |
| `./host-agent-workflows` | Stable host-agent workflow contract facade for cold-start/rescan intents, briefing/session/checkpoint/report persistence, external submission tracking, dimension completion validation, and resume-oriented workflow helpers. It does not include Codex tool names, Skill prose, AgentRuntime, tool policy, AI provider execution, or delivery channels. |
| `./io` | Stable WriteZone and PathGuard facade for write-boundary safety. |
| `./knowledge` | Stable KnowledgeEntry, Lifecycle, FieldSpec, readiness, SourceRef data contract, RecipeProductionGateway, and KnowledgeService facade. |
| `./logging` | Stable Logger facade; consumers no longer need the infrastructure implementation path. |
| `./project-intelligence` | Stable project understanding facade for language detection, grammar resource checks, AST loading/analysis, discovery, config parsers, call graph, panorama, project analysis workflow, and typed project snapshots. It does not include host-agent execution strategy, Codex prompts, MCP tools, or channel packaging. |
| `./repositories` | Stable repository factory and repository type facade for Core-owned persistence. It does not expose Drizzle schema tables as the default integration path. |
| `./search` | Stable local search engine, tokenizer, ranker, hybrid retrieval, and search repository adapter facade. AI reranker/provider implementation remains outside Core. |
| `./vector` | Stable local vector store, chunker, index, persistence, indexing pipeline, and provider injection contract facade. Embedding provider implementation and API key handling remain outside Core. |
| `./workspace` | Stable project/data root, workspace resolver, folder names, registry, and marker contract facade. |

## Provisional Public

These exact module-level entries have real consumers, but their final stable names and facades still need module-by-module review.

| Area | Current exports |
| --- | --- |
| Shared/core/domain | `./shared`, `./core/capability`, `./core/enhancement`, `./domain`, `./domain/knowledge/values`, `./types` |
| Infrastructure | `./config`, `./infrastructure`, `./infrastructure/config`, `./infrastructure/event`, `./infrastructure/io`, `./infrastructure/logging`, `./infrastructure/report`, `./infrastructure/signal` |
| Service | `./service`, `./service/bootstrap`, `./service/candidate`, `./service/evolution`, `./service/knowledge`, `./service/quality`, `./service/recipe` |
| Workflow | Workflow consumers should use `./host-agent-workflows`; no exact workflow module remains Provisional Public after Phase 7. |

## Transitional Internal

The following exact exports are currently retained for compatibility but should not become the normal outer-repo dependency surface:

| Export | Replacement direction |
| --- | --- |
| `./core` | Replace new usage with `./project-intelligence`, `./guard`, `./search`, `./vector`, or other stable ability facades depending on the caller. |
| `./core/analysis` | Replace new usage with `./project-intelligence`. |
| `./core/ast` | Replace new usage with `./project-intelligence`. |
| `./core/discovery` | Replace new usage with `./project-intelligence`. |
| `./domain/dimension` | Replace new usage with `./dimensions`. |
| `./domain/knowledge` | Replace new usage with `./knowledge`. |
| `./infrastructure/database` | Replace new usage with `./database`. |
| `./infrastructure/database/drizzle` | Replace with database/repository contract or runtime factory. |
| `./infrastructure/vector` | Replace new usage with `./vector`. |
| `./repository` | Replace new usage with `./repositories`. |
| `./repository/base` | Replace with repository interfaces and factories. |
| `./repository/bootstrap` | Replace new usage with `./repositories`. |
| `./repository/code` | Replace new usage with `./repositories`. |
| `./repository/evolution` | Replace new usage with `./repositories`. |
| `./repository/guard` | Replace new usage with `./repositories`. |
| `./repository/knowledge` | Replace new usage with `./repositories` or `./knowledge` depending on whether the caller needs persistence or domain contracts. |
| `./repository/memory` | Remains transitional; do not promote until Agent/AI memory ownership is settled. |
| `./repository/search` | Replace new usage with `./search` unless the caller is implementing Core repository internals. |
| `./repository/session` | Replace new usage with `./repositories`. |
| `./repository/sourceref` | Replace new usage with `./repositories` or SourceRef data contracts from `./knowledge`. |
| `./repository/sync` | Remains transitional until sync/search service boundary is reviewed. |
| `./repository/token` | Remains transitional; token usage is AI/provider telemetry and is not stable Core API yet. |
| `./service/guard` | Replace new usage with `./guard`. |
| `./service/panorama` | Replace new usage with `./project-intelligence`. |
| `./service/search` | Replace new usage with `./search`. |
| `./service/vector` | Replace new usage with `./vector`. |
| `./workflows` | Replace new usage with `./host-agent-workflows` or another stable facade that matches the caller. |
| `./workflows/capabilities` | Replace with workflow-level public facades. |
| `./workflows/cold-start` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/knowledge-rescan` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/shared` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/capabilities/execution/external` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/capabilities/persistence` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/capabilities/planning/dimensions` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/capabilities/planning/knowledge` | Replace new usage with `./host-agent-workflows`. |
| `./workflows/capabilities/presentation` | Replace new usage with `./host-agent-workflows` unless the caller is implementing Core internals. |
| `./workflows/capabilities/project-intelligence` | Replace new usage with `./project-intelligence`. |

All wildcard exports are also Transitional Internal:

- `./*`
- `./shared/*`
- `./domain/*`
- `./domain/dimension/*`
- `./domain/evolution/*`
- `./domain/knowledge/*`
- `./domain/knowledge/values/*`
- `./domain/snippet/*`
- `./daemon/*`
- `./core/*`
- `./core/analysis/*`
- `./core/ast/*`
- `./core/capability/*`
- `./core/discovery/*`
- `./core/discovery/parsers/*`
- `./core/enhancement/*`
- `./infrastructure/*`
- `./infrastructure/config/*`
- `./infrastructure/database/*`
- `./infrastructure/database/drizzle/*`
- `./infrastructure/database/migrations/*`
- `./infrastructure/event/*`
- `./infrastructure/io/*`
- `./infrastructure/logging/*`
- `./infrastructure/report/*`
- `./infrastructure/signal/*`
- `./infrastructure/vector/*`
- `./repository/base/*`
- `./repository/bootstrap/*`
- `./repository/code/*`
- `./repository/evolution/*`
- `./repository/guard/*`
- `./repository/knowledge/*`
- `./repository/memory/*`
- `./repository/search/*`
- `./repository/session/*`
- `./repository/sourceref/*`
- `./repository/sync/*`
- `./repository/token/*`
- `./service/*`
- `./service/bootstrap/*`
- `./service/candidate/*`
- `./service/evolution/*`
- `./service/guard/*`
- `./service/knowledge/*`
- `./service/panorama/*`
- `./service/quality/*`
- `./service/recipe/*`
- `./service/search/*`
- `./service/vector/*`
- `./types/*`
- `./workflows/shared/*`
- `./workflows/cold-start/*`
- `./workflows/knowledge-rescan/*`
- `./workflows/capabilities/*`
- `./workflows/capabilities/execution/external/*`
- `./workflows/capabilities/persistence/*`
- `./workflows/capabilities/planning/dimensions/*`
- `./workflows/capabilities/planning/knowledge/*`
- `./workflows/capabilities/presentation/*`
- `./workflows/capabilities/project-intelligence/*`

## Guardrails Added In Phase 1

- `test/PublicApiInventory.test.ts` verifies every current package export is classified.
- Wildcard exports are locked as Transitional Internal.
- The status summary is locked so export surface changes require an intentional test update.
- `scripts/smoke-public-api.mjs` imports every exact package export through Node package self-reference after build.

## Guardrails Added In Phase 2

- `src/logging.ts`, `src/workspace.ts`, `src/io.ts`, and `src/events.ts` are stable narrow foundation facades.
- `src/config.ts` is available as a provisional module-level config facade; it needs more review before becoming stable.
- `test/PublicFoundationEntrypoints.test.ts` verifies the new narrow entrypoints expose the expected foundation contracts.
- The exact `./daemon` entrypoint is promoted to Stable Public for daemon job/state contracts only.

## Guardrails Added In Phase 3

- `src/dimensions.ts` is the stable dimension facade.
- `src/knowledge.ts` is the stable knowledge facade.
- `test/PublicKnowledgeEntrypoints.test.ts` verifies Dimension and Knowledge consumers can use the stable facades without deep domain/service paths.
- `./domain/dimension` and `./domain/knowledge` are demoted to Transitional Internal for new outer-repo code; existing consumers can migrate gradually.
- `./knowledge` intentionally does not export `KnowledgeRepositoryImpl`; repository implementation exposure remains a transitional compatibility matter until the Database/Repository phase.

## Guardrails Added In Phase 4

- `src/database.ts` is the stable database facade.
- `src/repositories.ts` is the stable repository factory/type facade for Core-owned persistence.
- `test/PublicDatabaseRepositoryEntrypoints.test.ts` verifies the stable database facade can open and migrate SQLite, and that repository consumers can create/read Knowledge + SourceRef data without importing schema tables or `*.impl` deep paths.
- `./infrastructure/database`, `./repository`, and repository exact module exports are now Transitional Internal for new outer-repo code.
- `./repository/memory`, `./repository/token`, `./repository/search`, and `./repository/sync` remain transitional because their final ownership depends on later Agent/Search/Vector boundary decisions.

## Guardrails Added In Phase 5

- `src/search.ts` is the stable local search facade.
- `src/vector.ts` is the stable local vector/index/chunker facade.
- `src/guard.ts` is the stable Guard/ReverseGuard/report facade.
- `test/PublicSearchVectorGuardEntrypoints.test.ts` verifies the stable facades cover empty search, tokenizer/ranker/RRF behavior, JSON vector store search, chunking, and Guard single-file auditing without importing service or infrastructure deep paths.
- `./service/search`, `./service/vector`, `./service/guard`, and `./infrastructure/vector` are now Transitional Internal for new outer-repo code.
- `SearchAiProvider`, `EmbedProvider`, and related provider shapes are injection contracts only. Core still does not implement AI providers, API key handling, model policy, Codex tools, MCP schema, or CLI wrappers.

## Guardrails Added In Phase 6

- `src/project-intelligence.ts` is the stable project understanding facade.
- `test/PublicProjectIntelligenceEntrypoints.test.ts` verifies language detection, packaged grammar resource lookup, grammar readiness + reload, AST analysis, discoverer registry setup, config parser functions, call graph/panorama class exports, project analysis facade, and typed project snapshot construction without importing deep project-intelligence paths.
- `./core`, `./core/analysis`, `./core/ast`, `./core/discovery`, `./service/panorama`, and `./workflows/capabilities/project-intelligence` are now Transitional Internal for new outer-repo code.
- Grammar resource lookup and availability checks are Core-owned. Copying resources into plugin/package/channel-specific locations remains outer-repo responsibility.
- AST/plugin loading must degrade instead of blocking the host-agent knowledge mining workflow when parser resources are unavailable.
- ProjectIntelligence remains a deterministic Core workflow. Host agent execution, Codex prompt/tool names, MCP envelopes, and delivery channels remain outside Core.

## Guardrails Added In Phase 7

- `src/host-agent-workflows.ts` is the stable host-agent workflow contract facade.
- `test/PublicHostAgentWorkflowEntrypoints.test.ts` verifies external cold-start/rescan intent semantics, mission briefing/session/submission contracts, missing-session validation, and checkpoint save/load/cleanup without importing workflow deep paths.
- `./workflows`, `./workflows/shared`, `./workflows/cold-start`, `./workflows/knowledge-rescan`, `./workflows/capabilities/execution/external`, `./workflows/capabilities/persistence`, `./workflows/capabilities/planning/dimensions`, `./workflows/capabilities/planning/knowledge`, and `./workflows/capabilities/presentation` are now Transitional Internal for new outer-repo code.
- Core owns the deterministic protocol: what a host agent should analyze, how evidence is tracked, how a dimension completes, how invalid submissions degrade, and how checkpoint/report persistence supports resume.
- Outer repositories still own Codex MCP tool names, Skill prose, AgentRuntime, tool policy, AI provider execution, API key readiness, transport envelopes, Dashboard presenters, and channel/package delivery.

## Guardrails Added In Phase 8

- `scripts/lint-consumer-core-imports.mjs` is the Core-owned consumer import boundary checker for outer repositories.
- `test/PublicConsumerCoreImportBoundary.test.ts` verifies stable facade imports, transitional deep import rejection, allowlist/reference-limit handling, and adapter path exceptions.
- The checker is included in the npm package `files`, so consumers can run it from a Core subrepository or from `node_modules/@alembic/core/scripts/lint-consumer-core-imports.mjs`.
- Consumer repositories must treat Stable Public facades as the default import surface.
- Existing transitional imports can remain only when covered by an explicit allowlist/baseline; `referenceLimits` prevents non-stable usage growth.
- Adapter exceptions must be path-scoped and documented. They are not a license to import Core internals from feature code.
- `vi.mock` / `jest.mock` references are not counted by default so the checker can align with existing AlembicPlugin baseline behavior; consumers may opt into stricter mock counting with `includeMockReferences: true`.
- The Phase 8 checker does not add runtime public API and does not alter package export counts.

## Guardrails Added In Phase 9

- `config/public-api-boundary.json` is now the machine-readable source of truth for Core export classification.
- `scripts/public-api-boundary-policy.mjs` centralizes classification for Core tests and consumer import lint.
- `scripts/check-public-api-boundary.mjs` verifies that every `package.json` export is classified, wildcard exports remain transitional, and status counts match the locked policy.
- `npm run lint:public-api-boundary` is now part of Core CI.
- `test/support/public-api-inventory.ts` reads the shared policy instead of maintaining a separate hard-coded classification list.
- The npm package includes the policy and boundary scripts so outer repositories can reuse the same rules.
- Phase 9 does not add runtime public API and keeps counts unchanged: Stable 15, Provisional 21, Transitional 98.

## Next Phase

Phase 10 should use outer adapter migration feedback to close real Core API gaps:

- run the consumer import boundary checker in Alembic and AlembicPlugin after every import migration batch
- record any remaining deep import as a Core capability gap before allowing it to grow
- keep Codex/plugin/channel, CLI/daemon, Dashboard presenter, AgentRuntime, tool policy, and provider execution outside Core
- prepare deletion candidates only after both outer windows have build/test evidence
