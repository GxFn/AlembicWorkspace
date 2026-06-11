# AlembicAgent Audit Findings

Status: evidence base / Design-window three-agent deep scan
Date: 2026-06-12
Audited Head: AlembicAgent `dc6d6f7` (clean tree)
Design Key: alembic-agent-comprehensive-optimization

Three parallel read-only scans: public surface & layering, edge cases &
failure semantics, tests & gates. Counts are audit-time approximations; AG0
re-freezes them.

## Repository Shape

- `src/` 214 TS files: agent 110f/32.5k (runtime 23f/11.2k, memory
  11f/5.1k, context 9f/4.4k, prompts 6f/2.9k, forge 6f/1.5k, strategies
  7f/1.4k, profiles 13f/1.2k, service 6f/1k, policies 6f, domain 4f,
  capabilities 9f, coordination 1f, runs 6f), tools 66f/9.5k (core V1
  5f/1.2k, v2 47f/5.1k, catalog/workflow/terminal shared), ai 33f/5.8k,
  shared 3f. Tests: 29 files / 197 cases (13.5s).
- Public surface: 15 exact exports enforced by
  `lint-agent-public-api-boundary.mjs` (no wildcards); all 15 consumed by
  Alembic (~100 files); AlembicPlugin consumes none directly. Core import
  boundary: 51 references across 8 facade subpaths with 8 zero-baseline
  deny rules (RC3-hardened).
- Check pipeline (all blocking): build:check → biome lint →
  lint:agent-import-boundary → lint:public-api-boundary →
  lint:core-import-boundary → test. Release-only: smoke (15 subpaths
  import, 5 forbidden reject), guard/stage publish scripts; pack-preview
  431 entries.

## A. Public Surface And V1/V2 Duality

- A1 [high] `./tools` exports V1 (core/catalog/workflow) and V2
  (router/adapter/cache) from one entry (`src/tools/index.ts:1-16`) with no
  version separation or deprecation markers — consumers cannot opt out of
  either system. Matches RC6 SD-3's accepted convergence route.
- A2 [high] V1 runtime fully operational and unmarked: `LightweightRouter`
  (417 lines) is live routing; `V2ToolRouterAdapter` (168 lines,
  `v2/adapter/`) bridges V2→V1, perpetuating the dual path; 16 importer
  sites of V1 contracts verified (8 in agent/, 4 tools/core, plus tasks/
  terminal/catalog) — exactly SD-3's extraction target list.
- A3 [med] No boundary between `./tools` and `./tools/v2`: the adapter
  reaches into V1 `ToolCallContext`/`ToolResultEnvelope` without a
  formalized dependency (V2ToolRouterAdapter.ts:10-11).
- A4 [med] D10 legacy-rewrite demand keys still embedded in
  `AgentInterfaceContract.ts:47,92,125,331` — interface finalization
  markers from the completed interface-contract sequence never closed out.
- A5 [low] `ApiResponse = Record<string, any>` exported from
  `ai/AiProvider.ts:14` — loose typing on the public surface (justified
  for external API bodies, but unbounded).

## B. Internal Structure And Semantics

- B1 [high] `AgentRuntime.ts` is a 2,679-line monolith combining
  orchestration, event bus, state machine, diagnostics, LLM assembly,
  budget, and interface contract; `PipelineStrategy` 1,102 lines;
  `PcvNodeEvidence` 1,669; `ActiveContext` 1,378. Hub-and-spoke with no
  internal service/domain split.
- B2 [med] MemoryStore (620 lines, raw synchronous SQL) ownership pends
  RC6 SD-4 (`memory/MemoryStore.ts:6-7` records the freeze); the SD-4
  accepted route is: adapter stays in Agent + schema-shape tripwire test +
  Option-C end-state note.
- B3 [med] agent/→ai boundary is type-only (5 imports) but
  `ContextWindow.ts:105` reaches `ModelRegistry` directly for token
  counting — policy access outside the AiFactory route, boundary fuzzy.
- B4 [med] Naming overloads: "tool" ×4 (ToolRouterContract V1 /
  ToolRouterV2 / ToolSchema LLM format / ToolExecutionPipeline stage);
  "session" (terminal vs memory); "memory" (store vs coordinator vs active
  context); "agent" (runtime class vs message role vs boundary enum).
- B5 [low] Feature-flag scatter with no registry: enableL4LLM,
  enableL4Compaction, enableReflection, enablePlanning, fallbackUsed.

## C. Edge Cases And Failure Semantics

- C1 [high] Concurrency slot race: `reliability.ts:79-84` (mirrored
  AiProvider.ts:248-255) checks `activeRequests < maxConcurrency` then
  increments non-atomically — two racing tasks can both pass and exceed
  the cap, defeating the rate-limit guard.
- C2 [high] `MemoryStore.add()` runs its INSERT uncaught
  (MemoryStore.ts:161-200) — a SQLite failure crashes the agent mid-job,
  unlike the rest of the memory layer which returns structured results.
- C3 [med] `MemoryCoordinator.searchEvidence` returns `[]` on error
  (MemoryCoordinator.ts:617-619) — retrieval failure masquerades as "no
  evidence"; the agent proceeds on missing context.
- C4 [med] No resume/recovery checkpoint: `AgentRuntime.ts:989-998` logs
  LLM errors but persists nothing; an aborted long job restarts from
  scratch (token waste). Job identity is a random runId; no
  double-execution guard beyond it.
- C5 [med] Tool args parsed without size bounds (`v2/router.ts:125-127`);
  prompt length unchecked (`AgentService.ts:148-150`) — oversized input
  passes validation then fails downstream or silently truncates.
- C6 [low] Proxy dispatcher cache unbounded (LLMTransport.ts:28-46);
  circuit cooldown doubling reads stale state under race
  (AiProvider.ts:932-937); hook errors swallowed without diagnostics
  (AgentRuntime hook pattern).
- C7 Provider layer is otherwise the strongest area: timeout + abort
  threading, retry with exponential backoff, 3-state circuit breaker,
  error classification shared via `shared/error-classify.ts`; no
  provider-specific leakage into agent/ beyond types.

## D. Tests And Gates

- D1 [high] Zero-coverage public areas: forge (ToolForge/DynamicComposer/
  SandboxRunner), tasks (scan/enrich/relation/quality handlers), policies,
  profiles (13 files), coordination — all exported or load-bearing, none
  tested.
- D2 [high] V2 wiring untested: `tool-v2-contract.test.ts` covers
  catalog/cache/parser in isolation; `ToolRouterV2` executor integration
  and `V2ToolRouterAdapter` binding to real tool calls are not exercised.
- D3 [med] Terminal session execution/cancellation untested (contract
  tests are declarative-schema only); SD-4 memory-schema tripwire test
  does not exist yet (planned only).
- D4 [med] Provider failure scenarios thin: hand mocks, no
  malformed-body/mid-stream-drop/streaming-abort cases.
- D5 [med] Gate gaps: public-api boundary checks count/format only — no
  signature-level breaking-change detection on the 15 stable exports;
  provisional tier unused (empty array); no validation-floor snapshot file
  (197/431 counts live in prose).
- D6 Validation floor today: `npm run check` (6 blocking stages, tests
  included — unlike the Alembic main repo) + release-only smoke/guard/
  stage; baseline 197 tests, 15 exports, 51 core references, 431 pack
  entries.

## Cross-Demand Boundary Notes

- RC3 outputs (boundary configs, demonstrated lint failures, V1 retirement
  register, MemoryStore ownership note) are done — this demand builds on
  them, never weakens them.
- RC6 SD-3 (V1→V2 two-phase convergence) and SD-4 (MemoryStore tripwire)
  are accepted routes targeting this repo — proposed for absorption as
  AG1 and part of AG2.
- Core package import paths stay untouched (CO1 owns the wave); the 51-ref
  baseline may only shrink here.
- `./tools` export retirement (SD-3 phase 2) changes the public surface
  consumed by Alembic (~100 files) — the Alembic-side import update is a
  coordinated commit by the Alembic window in the same wave, allowed
  because Plugin is not involved.
- A future cross-repo interface-alignment demand (after CO + AO + AG +
  CKG) owns all cross-repo surface negotiation.
