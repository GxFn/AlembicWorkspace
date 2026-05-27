# AlembicAgent Phase 6 Contract Surface And Tool V2 Boundary

Date: 2026-05-17

Owner window: `AlembicAgent`

Scope:

- Code changes are limited to `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`.
- Collaboration docs are limited to `/Users/gaoxuefeng/Documents/AlembicWorkspace/docs/AlembicAgent`.
- `Alembic`, `AlembicDashboard`, `AlembicCore`, and `AlembicPlugin` are read-only references for this window.
- `AlembicPlugin` must not add `@alembic/agent`; Plugin removes built-in Agent capability and uses the host agent surface instead.

## A6-1 Contract Surface

Implemented public subpaths:

- `@alembic/agent/service`
- `@alembic/agent/runtime`
- `@alembic/agent/prompts`
- `@alembic/agent/domain`

Implementation notes:

- `./service` points to the existing real service barrel at `src/agent/service/index.ts`.
- `./runtime` now has an explicit barrel at `src/agent/runtime/index.ts`.
- `./prompts` now has an explicit barrel at `src/agent/prompts/index.ts`.
- `./domain` now has an explicit barrel at `src/agent/domain/index.ts`.
- `package.json` exports each subpath to built `dist` artifacts.
- `test/contract-surface.test.ts` smoke-checks service, runtime, prompt, and domain exports from source.

Minimum export coverage:

- Service: `AgentService`, `AgentRuntimeBuilder`, `SystemRunContextFactory`, `AgentRunContracts`, `AgentRunCoordinator`, profile compiler/registry/stage factory, scan/relation/evolution run helpers.
- Runtime: `AgentRuntime`, `AgentRuntimeTypes`, `SystemRunContext`, `ToolExecutionPipeline`, `AgentState`, `AgentMessage`, `BudgetController`, diagnostics/event/hook/message/final-answer helpers.
- Prompts: `computeAnalystBudget`, analyst/evolver/producer/scan/relation prompt builders and gate helpers.
- Domain: `EpisodicConsolidator`, `EvidenceCollector`, consolidation gate prompt/budget/tool constants.

## A6-2 Tool V2 Boundary Evaluation

Read-only source reviewed from `Alembic/lib/tools/v2/**`.

| File or directory | Boundary decision | Reason |
| --- | --- | --- |
| `adapter/ToolContextFactory.ts` | Host-owned concrete; do not migrate as-is. Extract only a future contract if needed. | It binds to Alembic DI container services, project/data roots, repository/search/gateway instances, sandbox policy/executor, and host permissions. |
| `adapter/V2CapabilityCatalog.ts` | Agent-owned generic candidate. | It projects `TOOL_REGISTRY` into capability metadata and does not need product repositories or platform adapters. |
| `adapter/V2ToolRouterAdapter.ts` | Agent-owned generic candidate after router/context contract is explicit. | It adapts a V2 router to the common tool-router contract, but currently names the concrete host `ToolContextFactory` type. |
| `cache/DeltaCache.ts` | Agent-owned generic candidate. | Pure in-memory file-read delta cache with no product DI or repository dependency. |
| `cache/SearchCache.ts` | Agent-owned generic candidate. | Pure in-memory search-result cache with no product DI or repository dependency. |
| `compressor/OutputCompressor.ts` | Agent-owned generic candidate. | Generic terminal/output compression that depends only on V2 tool types and strip helpers. |
| `compressor/parsers/**` | Agent-owned generic candidate. | Parser helpers are deterministic and not bound to Alembic storage, DI, MCP, Dashboard, or platform permissions. |
| `router.ts` | Agent-owned generic prerequisite candidate. | V2 adapter depends on `ToolRouterV2`; router itself is registry/types based and not platform-bound. |

Do not migrate:

- `DashboardOperationAdapter`
- `MacSystemAdapter`
- `MacSystemCapabilities`
- `SkillAdapter`
- `SkillCapabilities`
- Terminal sandbox/executor concrete adapters
- Codex MCP schema, handler, channel, skill, plugin release, or smoke delivery code

Recommended next AlembicAgent phase:

1. Move generic V2 `router`, `cache`, `compressor`, parser files, `V2CapabilityCatalog`, and a contract-based `V2ToolRouterAdapter` into `AlembicAgent`.
2. Add a small `ToolContextFactoryLike` or equivalent context-provider contract instead of importing the concrete Alembic `ToolContextFactory`.
3. Add unit tests for router dispatch, missing dependency/capability rejection, cache hit/eviction/invalidation, compression parser fallback, and adapter context creation failures.
4. Export migrated generic pieces through `@alembic/agent/tools` unless a narrower `@alembic/agent/tools/v2` subpath is introduced in the same phase.

## Handoff To Alembic

Can switch after this phase builds:

- `#agent/service/index.js` consumers that need service orchestration can target `@alembic/agent/service`.
- `#agent/runtime/SystemRunContext.js` and related runtime consumers can target `@alembic/agent/runtime`.
- `#agent/prompts/*` consumers can target `@alembic/agent/prompts`.
- `#agent/domain/EpisodicConsolidator.js`, `EvidenceCollector`, and consolidation gate consumers can target `@alembic/agent/domain`.

Must remain Alembic-owned until the next Tool V2 migration phase:

- Concrete `ToolContextFactory`.
- Terminal/sandbox policy and executor wiring.
- Repository/search/gateway-backed tool context creation.
- Dashboard/Mac/Skill host adapters.
- Codex MCP schema/handler delivery.

Deletion guidance:

- Do not delete `Alembic/lib/tools/v2/adapter/ToolContextFactory.ts`.
- Do not delete host adapter directories.
- Do not delete `lib/tools/v2/cache/**`, `lib/tools/v2/compressor/**`, `lib/tools/v2/router.ts`, `V2CapabilityCatalog`, or `V2ToolRouterAdapter` until the generic pieces are migrated and Alembic import scans prove no product code still needs local copies.

## Handoff To AlembicPlugin

Plugin still must not add `@alembic/agent`.

Plugin-owned next steps remain deletion/disconnection work:

- Cut internal bootstrap/rescan daemon jobs away from Plugin-local Agent runtime.
- Remove or host-managed-disable HTTP AI/Agent and candidate AI routes.
- Remove Plugin internal tool router after direct MCP handler dispatch is ready.
- Finally delete Plugin `lib/agent/**` and internal-agent workflow only after production `#agent/*` scans are clean.

Plugin must not copy the generic Tool V2 migration plan into its runtime. Any Agent-owned V2 generic code should be consumed by `Alembic`, while Plugin keeps only MCP schema/handler/channel/skill/delivery surfaces and host-provided agent integration points.

## Verification

Commands run from `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`:

- `npm run build:check` passed.
- `npm run check` passed.
- `npm run build` passed.
- Self-reference dynamic imports passed for:
  - `@alembic/agent/service`
  - `@alembic/agent/runtime`
  - `@alembic/agent/prompts`
  - `@alembic/agent/domain`

Notes:

- `npm run check` still reports 27 pre-existing Biome warnings in migrated code, but exits successfully.
- Test result: 5 test files passed, 23 tests passed.

## Follow-Up Tool V2 Contract

Follow-up completed on 2026-05-17:

- Detailed record: `docs/AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md`.
- Generic Tool V2 router/cache/compressor/parser/adapter contracts now export from `@alembic/agent/tools/v2`.
- Concrete `ToolContextFactory`, terminal sandbox, Dashboard/Mac/Skill adapters, and Codex MCP delivery remain host-owned.
