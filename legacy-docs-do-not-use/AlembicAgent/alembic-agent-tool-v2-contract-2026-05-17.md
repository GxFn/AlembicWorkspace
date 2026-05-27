# AlembicAgent Tool V2 Contract

Date: 2026-05-17

Owner window: `AlembicAgent`

Status: completed.

## Scope

This phase promotes the Tool V2 generic layer from boundary evaluation into public Agent contracts.

In scope for `AlembicAgent`:

- V2 capability catalog projection.
- Generic V2 router and router adapter contract.
- Delta and search cache implementations.
- Output compressor, parser utilities, and strip utilities.
- Package exports and contract-surface tests.

Out of scope for `AlembicAgent`:

- Concrete host `ToolContextFactory`.
- Host repository/search/gateway wiring.
- Terminal sandbox executor and platform permission implementation.
- Dashboard operation adapter.
- Mac system adapter and capabilities.
- Skill adapter and capabilities.
- Codex MCP schema, handler, channel, skill, plugin release, or smoke delivery code.
- Any `AlembicPlugin` dependency on `@alembic/agent`.

## Public Contracts

New package subpath:

- `@alembic/agent/tools/v2`

Existing `@alembic/agent/tools` also re-exports the V2 contract through `src/tools/index.ts`.

Exported contract groups:

- Adapter:
  - `V2CapabilityCatalog`
  - `V2ToolRouterAdapter`
  - `V2ToolContextFactory`
  - `V2ToolContextProvider`
- Cache:
  - `DeltaCache`
  - `SearchCache`
  - `DeltaCacheEntry`
  - `DeltaReadResult`
  - `SearchCacheEntry`
- Compressor:
  - `OutputCompressor`
  - `cleanOutput`
  - `truncateOutput`
  - named parser helpers such as `parseGitStatusOutput`, `parseGitDiffOutput`, `parseTestOutput`, `parseLintOutput`, `parseGrepOutput`, `parseTreeOutput`, `parsePackageOutput`
- Router and registry:
  - `ToolRouterV2`
  - `RouterConfig`
  - `TOOL_REGISTRY`
  - `generateLightweightSchemas`
  - `getToolNames`
  - `getActionNames`
- Core V2 types and helpers:
  - `ToolContext`
  - `ToolCallV2`
  - `ToolResult`
  - `ToolSpec`
  - `ToolRegistry`
  - `ToolAction`
  - `CapabilityV2Def`
  - `DeltaCacheLike`
  - `SearchCacheLike`
  - `OutputCompressorLike`
  - `SessionStoreLike`
  - `MemoryCoordinatorLike`
  - `ok`
  - `fail`
  - `estimateTokens`

## Boundary Decisions

Migrated into `AlembicAgent`:

- `lib/tools/v2/router.ts` -> `src/tools/v2/router.ts`
- `lib/tools/v2/cache/DeltaCache.ts` -> `src/tools/v2/cache/DeltaCache.ts`
- `lib/tools/v2/cache/SearchCache.ts` -> `src/tools/v2/cache/SearchCache.ts`
- `lib/tools/v2/compressor/OutputCompressor.ts` -> `src/tools/v2/compressor/OutputCompressor.ts`
- `lib/tools/v2/compressor/parsers/**` -> `src/tools/v2/compressor/parsers/**`
- `V2CapabilityCatalog` -> `src/tools/v2/adapter/V2CapabilityCatalog.ts`
- `V2ToolRouterAdapter` -> `src/tools/v2/adapter/V2ToolRouterAdapter.ts`

Changed during migration:

- `V2ToolRouterAdapter` no longer imports the concrete host `ToolContextFactory`.
- The adapter now depends on the exported `V2ToolContextFactory` / `V2ToolContextProvider` contract:

```ts
interface V2ToolContextFactory {
  create(request: ToolCallRequest): ToolContext;
}
```

This lets `Alembic` keep the concrete DI-backed context factory while using the Agent-owned router adapter.

Host-owned and not migrated:

- Concrete `ToolContextFactory`.
- Terminal sandbox policy/executor and platform permission implementation.
- Repository-backed context construction.
- Dashboard/Mac/Skill adapters.
- Codex MCP schema/handler/delivery code.

## Handoff To Alembic

Can switch after consuming this Agent version:

- Generic V2 router imports can target `@alembic/agent/tools/v2`.
- `V2CapabilityCatalog` imports can target `@alembic/agent/tools/v2`.
- `V2ToolRouterAdapter` imports can target `@alembic/agent/tools/v2` after the local concrete context factory satisfies `V2ToolContextFactory`.
- `DeltaCache`, `SearchCache`, `OutputCompressor`, parser utilities, and strip utilities can target `@alembic/agent/tools/v2` or `@alembic/agent/tools`.

Must remain local in `Alembic`:

- Concrete `ToolContextFactory`.
- Any DI container lookup.
- Any project/data-root IO wiring.
- Any repository/search/gateway adapter.
- Terminal sandbox executor and permission implementation.
- Dashboard/Mac/Skill/Codex MCP adapters.

Deletion guidance:

- Do not delete local `ToolContextFactory`.
- Do not delete host adapter directories.
- Delete local generic V2 copies only after imports are switched and `lint:agent-extraction-boundary` proves no product code still depends on those local generic files.

## Handoff To AlembicPlugin

No Plugin action should add `@alembic/agent`.

Plugin remains on its current deletion/disconnection path:

- Keep local Agent/AI/Tool runtime removed.
- Keep MCP schema/handler/channel/skill/delivery code Plugin-owned.
- Use host-provided agent integration points rather than packaging Agent code.

## Verification Plan

Commands run:

- `npm run build:check` passed.
- `npm run lint` passed with 27 existing Biome warnings.
- `npm run test` passed: 6 test files, 27 tests.
- `npm run check` passed.
- `npm run build` passed.
- Self-reference import smoke for `@alembic/agent/tools/v2` passed.

Test coverage added:

- `test/tool-v2-contract.test.ts`
  - V2 capability catalog projection.
  - Delta/search cache behavior.
  - Output compressor and parser utility exports.
  - Generic router execution.
  - Generic router adapter execution through a contract-only context factory.

## Completion Summary

`AlembicAgent` now owns the generic Tool V2 contract surface. `Alembic` can switch generic Tool V2 imports to `@alembic/agent/tools/v2`, while retaining concrete host context construction and platform adapters locally. `AlembicPlugin` remains explicitly out of this dependency path.
