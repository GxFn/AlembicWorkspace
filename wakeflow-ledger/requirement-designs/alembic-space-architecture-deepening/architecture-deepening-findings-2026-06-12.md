# Alembic Space Architecture Deepening Findings

Status: evidence base / Design-window two-agent scan over the post-completion space
Date: 2026-06-12
Audited Heads: Core `c73d5c4`, Alembic AO-final commits, Agent `35901cf`,
Dashboard `11c2c61`, Plugin `838da9e` (read-only)
Design Key: alembic-space-architecture-deepening

Builds on the full session evidence chain (RC/CO/AO/AG closeouts, IC seam
findings) plus two targeted scans: side-effect/global-state inventory and
foundational-layer upgrade audit. AD0 re-freezes counts.

## F1. Inter-Repo Dependency Reality (healthy DAG, unenforced as one rule)

- Edges: Core ← Agent ← Alembic; Core ← Plugin; Dashboard standalone
  (HTTP-only, zero package deps). All `file:` links between siblings;
  release staging converts them.
- Toolchain uniform and current: Node >=22, TS 5.9.3, biome 2.4.6, vitest
  4.x, better-sqlite3 12.6.2, drizzle-orm 0.45.1, express 5, socket.io
  4.8.3, undici 7, react 19.
- Enforcement today is per-repo and partial: Core consumer lint, Agent
  import boundary. There is no single space-level allowed-edge
  configuration that every repo's gate consumes, and no gate asserting
  Dashboard's zero-package-dependency rule.

## F2. Side-Effect And Global-State Inventory (~30% compliant with a pure-boundary doctrine)

- Import-time effects (worst sites): auth `TOKEN_SECRET` cached at module
  load with a per-process random fallback (`lib/http/routes/auth.ts:142` —
  restart invalidates tokens, semantics implicit); `roleResolver`
  TRUST_X_USER_ID cached at import; DaemonJobRunner module-scope fallback
  recorder + snapshot store (`DaemonJobRunner.ts:11-12`); SSE `_sessions`
  map with no disposal (`lib/http/utils/sse-sessions.ts:1`); RateLimiter
  `_buckets` map with no eviction; resident guard handler module-scope
  review state (`tool-handlers/guard.ts:1-2`); AstAnalyzer parser caches
  with no policy (`core/AstAnalyzer.ts:1`).
- Bare singletons vs container: `pathGuard` (53 direct imports),
  `Logger.getInstance()` (47 direct calls in Alembic alone),
  `timerRegistry`, `getModelRegistry()`, `proxyDispatcherCache`; the
  service-locator pattern `getServiceContainer()` appears 47+ times in
  routes instead of constructed injection.
- Listener hygiene: HttpServer SSE handler registers 4 eventBus listeners
  without off-on-close (`HttpServer.ts:518-544`); DaemonJobRunner adds
  per-job listeners without deregistration (`:548,849`); KnowledgeModule
  module-init subscriptions; SyncCoordinator on() without verified off in
  dispose (`SyncCoordinator.ts:80,94` — AD0 re-verifies against the CO3
  hygiene fix).
- Healthy: Core-side singleton design itself (PathGuard two-layer checks,
  TimerRegistry unref discipline); frozen constant Sets are fine.

## F3. Foundational Layer State (stable; four worthwhile upgrades)

- [storage, S-M] No prepared-statement caching on hot repository queries
  (knowledge list/search/edges; raw `.prepare()` scattered,
  `KnowledgeRepository.impl.ts:300-304`). Upgrade: central prepared-
  statement factory with LRU per hot path; expected 5-10% throughput on
  repeated search.
- [concurrency, S profile + M impl] AST parsing is in-process on the event
  loop; `shared/concurrency.ts` has ioLimit(20)/cpuLimit(4) presets but no
  worker_threads. Upgrade: profile parse time on a 10k+-file repo first;
  worker pool only if >20% parse share proves out.
- [vector, S] BatchEmbedder hardcodes p-limit(2), batchSize 32
  (`infrastructure/vector/BatchEmbedder.ts:35`). Upgrade: provider-aware
  concurrency with capacity hints from the Agent transport layer.
- [events, M] SignalAggregator sliding window has no overflow/backpressure
  protection (`infrastructure/signal/SignalAggregator.ts:38-51`). Upgrade:
  ring-buffer cap + backpressure signal on flush SLA miss.
- [realtime, doc-only] Socket.io topology healthy; delivery-guarantee
  contract (fire-and-forget, room behavior on dropout) undocumented.
- Explicitly healthy (no action): WAL/busy stance (CO3 deliberate), drizzle
  hybrid + gap-tolerant migrations, pure-JS HNSW (sparse tests owned),
  ConfigWatcher native glob + debounce, toolchain currency, lint debt
  owned in docs/lint-debt.md.

## F4. Internal Layer Contracts Are Uneven

- Core has the full pattern: written layer contract + blocking
  dependency-direction lint (CO2).
- Alembic has a glossary and clean acyclic imports (audited) but NO written
  layer contract and NO direction lint over its 16 lib/ areas.
- Agent has the runtime decomposition and glossary but no layer contract or
  direction lint over agent/tools/ai.
- Dashboard has no internal contract (views/api/state conventions are
  implicit).

## F5. Charter Gaps (functional partitioning at the space level)

- No per-repo functional charter exists: "what capabilities belong in this
  repo, what must never" is distributed across AGENTS.md fragments, layer
  contracts, and closeout records rather than one confirmable artifact per
  repo.
- Known charter questions parked for a systematic pass: SD-1 phase 2
  (selective Core sinking, currently an IC6 bullet — proposed to relocate
  here), daemon observability reuse policy (SD-6 register), evolution/
  panorama surface ownership (R-1 register), MemoryStore Option-C end
  state (SD-4 note).

## Cross-Demand Boundary Notes

- IC owns: wire-type single-sourcing, error registry, tool-surface
  duality, DCR residue, `./tools` retirement, SD-5 phase 2 + Plugin
  vendor wave, Dashboard contract gates. AD consumes IC outputs and never
  duplicates them.
- Proposed relocation (intake confirmation needed): SD-1 phase 2
  evaluation moves from IC6 into AD2's systematic charter pass; IC6 keeps
  space acceptance with a pointer.
- Plugin participates in AD1/AD3 charters and gates only post-CKG.
- Coverage ratchets (IC ruling) are the protection net for every AD
  refactor; version bumps stay user-directed.
