# Alembic 主体仓完整实现与架构参考 (Alembic Main-Body Implementation & Architecture Reference)

> 一份对 `Alembic/` 主体仓（npm 包 `alembic-ai`）源码的完整挖掘：实现逻辑、功能面、架构分层、设计模式与端到端流程，全部锚定到真实 `file:line`。

## 文档元信息 (Document Metadata)

| 字段 | 值 |
|------|-----|
| 主题 | Alembic 主体仓（host layer）的完整实现与架构 |
| 覆盖范围 | **仅 `Alembic/` 主体仓**（`alembic-ai`）。`@alembic/core` / `@alembic/agent` / `AlembicDashboard` / `AlembicPlugin` 仅在边界处标注为委派，不展开 |
| 代码基线 | 分支 `main` · commit `3deff90` · package `alembic-ai@0.2.0` |
| 源码规模 | `lib/` + `bin/` 共 178 个 TypeScript 文件、约 61,830 行 |
| 生成方式 | 18 个并行 agent 深读全部 `lib/**` + `bin/**` 源码（追踪调用链）后综合；随后跨全文校验 **292 个 `path:line` 锚点，0 文件缺失、0 行号越界** |
| 编写日期 | 2026-07-02 |
| 落档位置 | `wakeflow-ledger/Alembic/`（跨仓长期参考文档；非随源码维护的 `Alembic/docs/`） |

## 阅读指南 (How to Read)

- **先读 [01. Overview](#01-overview-architecture-layers--boundary-map)**：产品定位、进程形态、架构分层图、仓库边界图、技术栈、"知识器官"模型、数据/状态存储。这是全文的框架。
- **02–17 是逐子系统深潜**：每章覆盖一个 `lib/` 子系统，含职责、关键类型（带锚点）、控制流/数据流、外部接口（CLI/HTTP/事件/表）、设计模式，以及一节 **Boundary note**（本仓自持 vs 委派给 Core/Agent）。
- **最后读 [18. End-to-End Flows](#18-end-to-end-flows-design-patterns-cross-cutting-concerns--glossary)**：把子系统串成端到端链路（冷启动、增量 rescan、HTTP/MCP 请求生命周期、Guard、生命周期演化），并给出设计模式目录、横切关注点、持久化数据模型与术语表。

## 边界声明 (Boundary Disclaimer)

`Alembic/` 主体仓是**宿主层**：用户可运行的 CLI、per-project daemon、HTTP/API server、Dashboard 后端、依赖注入容器、宿主服务、编排工作流、macOS Seatbelt 沙箱、平台/原生/IDE 集成、AI provider 编排、工具适配器。深层"器官引擎"——Recipe 生命周期状态机、Panorama、SignalBus、Guard 规则引擎、ProjectContext、ProjectRegistry/ProjectScope、搜索/向量引擎、coverage-ledger 代数——大多位于 **`@alembic/core`**；in-process agent runtime 与工具系统位于 **`@alembic/agent`**。凡从这些包 `import` 的符号，本文一律标注为**委派/边界**，不声称由主体仓实现。

## 目录 (Table of Contents)

- [01. Overview, Architecture Layers & Boundary Map](#01-overview-architecture-layers--boundary-map)
- [02. Entrypoints, Bootstrap & Dependency Injection](#02-entrypoints-bootstrap--dependency-injection)
- [03. CLI Commands, Setup & AI Scan](#03-cli-commands-setup--ai-scan)
- [04. Daemon, Job Runner & Runtime Control](#04-daemon-job-runner--runtime-control)
- [05. HTTP Server, Middleware, Contracts & Schemas](#05-http-server-middleware-contracts--schemas)
- [06. HTTP Routes — Knowledge, Search, Recipes, Candidates, AI](#06-http-routes--knowledge-search-recipes-candidates-ai)
- [07. HTTP Routes — Jobs, Daemon, Modules, Evolution, Guard, Governance & More](#07-http-routes--jobs-daemon-modules-evolution-guard-governance--more)
- [08. AI Execution Workflows I — Runtime Setup, Dimensions & Session Building](#08-ai-execution-workflows-i--runtime-setup-dimensions--session-building)
- [09. AI Execution Workflows II — Process Events, Projections, PCV Evidence & Finalization](#09-ai-execution-workflows-ii--process-events-projections-pcv-evidence--finalization)
- [10. Workflows — Knowledge Rescan, Cold Start, Completion & Skill Delivery](#10-workflows--knowledge-rescan-cold-start-completion--skill-delivery)
- [11. Workflows — Project Context & Project Index (Panorama Host Side)](#11-workflows--project-context--project-index-panorama-host-side)
- [12. Services — Module, Skills & Vector](#12-services--module-skills--vector)
- [13. Services — Wiki Generation](#13-services--wiki-generation)
- [14. Services — Bootstrap, Cleanup, Evolution, Handler-Runtime & File-Change Dispatch](#14-services--bootstrap-cleanup-evolution-handler-runtime--file-change-dispatch)
- [15. Sandbox & Seatbelt Execution](#15-sandbox--seatbelt-execution)
- [16. Governance Gateway, Tool Adapters, Platform & Project Scope](#16-governance-gateway-tool-adapters-platform--project-scope)
- [17. Infrastructure — Audit, Cache, Database, Rate-limit, Realtime & Shared](#17-infrastructure--audit-cache-database-rate-limit-realtime--shared)
- [18. End-to-End Flows, Design Patterns, Cross-Cutting Concerns & Glossary](#18-end-to-end-flows-design-patterns-cross-cutting-concerns--glossary)

---


## 01. Overview, Architecture Layers & Boundary Map

### What Alembic Is

Alembic ("Auto Source Distill", npm package `alembic-ai`) builds a layer of **localized project memory**: it scans a codebase, extracts valuable patterns into structured **Recipes** (with human approval), and makes that knowledge searchable by any AI coding assistant over [MCP](https://modelcontextprotocol.io/). Knowledge lives locally as Markdown, never consuming the LLM context window — it is injected on demand when the AI needs it. The product frames itself as a **"knowledge organism"** whose Recipes are cells and whose five organs (Skeleton/Panorama, Digest/Governance, Nerves/Signal, Immunity/Guard, Create/Tool-Forge) respond in coordination to each IDE-agent action.

**This repository (`Alembic/`, the main body) is the host layer, not the organism engine.** It provides everything a user actually runs and operates: the `alembic` CLI, the per-project daemon, the HTTP/API server, the Dashboard backend, the dependency-injection container, the host services, the orchestration workflows (cold-start/rescan/project-index/completion/skill delivery), the macOS Seatbelt sandbox, platform/native/IDE integration, AI-provider lifecycle orchestration, and tool adapters. The deep organism engine — Recipe lifecycle state machine, Panorama, SignalBus, the Guard rule engine, ProjectContext, ProjectRegistry/ProjectScope, search/vector engines, and coverage-ledger algebra — lives in the sibling package **`@alembic/core`** (`AlembicCore`). The in-process agent runtime and tool system live in **`@alembic/agent`** (`AlembicAgent`), the frontend UI in **`AlembicDashboard`**, and the Codex/CC plugin surface in **`AlembicPlugin`**. The main body **wires, transports, exposes, and governs**; it does not implement those engines. (Per repo rule, the host boundary — CLI, daemon, HTTP/API, Dashboard server, runtime, platform, sandbox, native/IDE, injection, AI/provider, tool adapters — must be preserved and must never be reduced to a thin Core wrapper.)

### Runtime Shapes / Process Model

The main body runs in several process shapes, all booting through the same `AppRuntime` → `ServiceContainer` DI sequence, then diverging by which surfaces they mount. One process serves exactly one project (a one-project-per-process guard is enforced during container init).

| Shape | Entrypoint | Env marker | Mounts | Purpose |
|-------|-----------|-----------|--------|---------|
| **CLI** | `bin/cli.ts` (~40 commands) | — | none by default; `initContainer()` per command | One-shot ops (setup, ais scan, guard, search, coldstart, rescan, projects, project-scope, ghost) |
| **API server** | `bin/api-server.ts` | `ALEMBIC_API_SERVER=1` | `HttpServer` (REST + SSE) | REST/SSE surface without the long-running daemon brain |
| **Daemon** | `bin/daemon-server.ts` | `ALEMBIC_DAEMON_MODE=1` | HttpServer + job runner + file-change collector + evolution sweep + Dashboard mount | Long-running per-project "background brain" |
| **Dashboard** | `alembic start [--dev]` (via CLI) | — | Daemon/HTTP + static `dashboard/dist` **or** spawned Vite dev server | User-facing UI backed by the daemon's REST/SSE/Socket.io |

```
                          alembic <cmd>            alembic start
                               │                        │
      ┌────────────────────────┼────────────────────────┤
      ▼                        ▼                        ▼
  bin/cli.ts             bin/api-server.ts       bin/daemon-server.ts
  (one-shot)             (REST/SSE only)         (long-running brain)
      │                        │                        │
      └──── AppRuntime.initialize() ──── ServiceContainer.initialize() ────┐
                               │                                            │
                          HttpServer  ──►  Express /api/v1 (24 routers)     │
                               │            + SSE + Socket.io (RealtimeSvc) │
                               │                                            │
                          Daemon-only tail:  DaemonJobRunner (bootstrap/    │
                          rescan jobs) · DaemonFileChangeCollector ·        │
                          EvolutionMaintenanceSweep · CacheCoordinator ·    │
                          mountDashboard(dashboard/dist) · writeDaemonState │
                                                                            │
   Dashboard SPA (AlembicDashboard, built into dashboard/dist) ────────────┘
        └─ talks to daemon over REST + SSE + Socket.io
```

DaemonSupervisor (host) spawns the daemon detached and verifies an **exact-identity health handshake** (`GET /api/v1/daemon/health` returning projectId/dataRoot/version/schema/databasePath/mode) before trusting it, guarding against cross-project or stale-build handoff. ProjectRuntimeControl multiplexes which project's daemon is "active" for the workspace.

### Architecture Layers

Requests flow top-down through host layers; governance (Gateway) and the sandbox cross-cut; the organism engine is reached only by delegation into `@alembic/core` / `@alembic/agent`.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ENTRYPOINTS   bin/cli.ts · bin/api-server.ts · bin/daemon-server.ts    │
│               MCP tools (alembic_bootstrap/rescan/search/...)          │
├──────────────────────────────────────────────────────────────────────┤
│ BOOTSTRAP/DI  lib/Bootstrap.ts (AppRuntime) → lib/injection            │
│               ServiceContainer (2-map lazy singletons) + 8 modules     │
├───────────────┬──────────────────────────────────────────────────────┤
│ TRANSPORT     │ GOVERNANCE (cross-cut)                                 │
│ lib/http      │ lib/governance/gateway  req.gw(action,resource,data)   │
│ Express/SSE/  │  validate → guard(no-op) → route → audit               │
│ Socket.io     │ lib/tools (host tool adapters → @alembic/agent)        │
├───────────────┴──────────────────────────────────────────────────────┤
│ WORKFLOWS     lib/workflows  project-index (full/incremental) ·        │
│               ai-execution (dimension mining) · completion · skills    │
├──────────────────────────────────────────────────────────────────────┤
│ SERVICES      lib/service  module · skills · wiki · bootstrap ·        │
│               cleanup · evolution (file-change/sweep) · vector         │
│               lib/daemon (job runner, runtime control, observability)  │
├──────────────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE lib/infrastructure  audit · cache · database (SQLite    │
│               access) · rate-limit · realtime ;  lib/shared (shutdown, │
│               package-assets) ;  lib/sandbox (Seatbelt, cross-cut)     │
├──────────────────────────────────────────────────────────────────────┤
│ DELEGATION    @alembic/core  (engine)    @alembic/agent (agent+tools)  │
└──────────────────────────────────────────────────────────────────────┘
```

| Layer | Primary `lib/` directories | Responsibility |
|-------|---------------------------|----------------|
| Entrypoints | `bin/` (cli, api-server, daemon-server), `lib/cli/` | Process boot, arg parsing, mode flags, output formatting |
| Bootstrap / DI | `lib/Bootstrap.ts`, `lib/injection/` (ServiceContainer, ServiceMap, 8 modules) | Ordered runtime init; lazy-singleton container; AI hot-reload; config pinning |
| Transport | `lib/http/` (HttpServer, middleware, 24 routers, SSE, contracts) | REST/SSE/Socket.io surface, validation, response shaping |
| Governance (cross-cut) | `lib/governance/gateway/`, `lib/tools/` | `req.gw` audit chokepoint; host tool adapters into agent contract |
| Workflows | `lib/workflows/` (project-index, ai-execution, project-context, completion, knowledge-rescan) | Cold-start/rescan orchestration, dimension mining, skill delivery |
| Services | `lib/service/` (module, skills, wiki, bootstrap, cleanup, evolution, vector), `lib/daemon/` | Host service brains, job queue, runtime multiplexing, observability |
| Infrastructure | `lib/infrastructure/` (audit, cache, database, rate-limit, realtime), `lib/shared/`, `lib/types/`, `lib/repository/` | Audit plumbing, cache stack, raw SQLite access, rate limit, realtime, shutdown |
| Sandbox (cross-cut) | `lib/sandbox/` | macOS Seatbelt policy/exec for terminal tool |
| Platform / Scope | `lib/platform/`, `lib/project-scope/` | Browser launch, native ProjectScope registry |

Path aliases in `package.json` `imports` mirror these: `#http/*`, `#service/*`, `#inject/*`, `#governance/*`, `#infra/*`, `#workflows/*`, `#tools/*`, `#sandbox/*`, `#platform/*`, `#shared/*`, `#types/*`.

### Repository Boundary Map

| Concern | Alembic main body (`alembic-ai`) | `@alembic/core` (`AlembicCore`) | `@alembic/agent` (`AlembicAgent`) | `AlembicDashboard` | `AlembicPlugin` |
|---------|----------------------------------|--------------------------------|-----------------------------------|--------------------|-----------------|
| Process / CLI / daemon | **Owns** all entrypoints, CLI, daemon lifecycle, DI container, shutdown | — | — | — | Codex MCP shim / click-install flow |
| HTTP/API + realtime | **Owns** Express server, middleware, routers, SSE, Socket.io | Failure taxonomy, domain errors, contract spine | ToolResultEnvelope contract types | consumes API | consumes API |
| Config / bootstrap | **Owns** AppConfigLoader adapter + `config/*.json` | `ConfigLoader` engine + schema, DB connection/WAL/migrations, Logger, EventBus | AI provider layer (AiProviderManager) | — | provider config injected by host |
| Recipe lifecycle (6-state) | Wires/invokes; HTTP lifecycle routes | **Owns** LifecycleStateMachine, StagingManager, ProposalExecutor, DecayDetector, EvolutionGateway | — | UI review | — |
| Panorama / ProjectContext | Host orchestration itinerary, ProjectScope propagation, Swift/FS module derivation | **Owns** ProjectContextCapabilities, presenter model, dimension catalog, canonical module-id | — | UI graph | — |
| SignalBus / Nerves | Emits signals; wires bus | **Owns** SignalBus stack, IntentExtractor | — | — | — |
| Guard engine | Wires GuardCheckEngine, merges project config, HTTP guard routes | **Owns** GuardCheckEngine, RuleLearner, ExclusionManager, ViolationsStore | — | UI | plugin guard tools |
| Search / vector | Search-meta orchestration, region-fixture generation, ContextualEnricher policy | **Owns** SearchEngine, HybridRetriever, VectorService, IndexingPipeline | — | UI | — |
| Agent runtime + tools | **Owns** ToolContextFactory + host tool adapters/manifests; injects into agent | — | **Owns** AgentService, runtime, UnifiedToolCatalog, WorkflowRegistry | — | — |
| Sandbox | **Owns** entire `lib/sandbox/**` (Seatbelt) | shared Logger only | tool schema + fallback diagnostics contract | — | — |
| Skills | **Owns** SKILL.md file CRUD + SkillHooks engine | receipt contract/validation | — | — | runtime export of skills |
| Frontend UI | Serves built `dashboard/dist` only | — | — | **Owns** React/Vite source | — |
| Plugin surface | — | — | — | — | **Owns** Codex marketplace/channel/publish |

Rule of thumb from the fact sheets: **routers and services never implement organism logic** — behavior changes belong in the backing host service or in `@alembic/core`, not in the transport/adapter file.

### Tech Stack

| Category | Dependencies (from `package.json`) |
|----------|-----------------------------------|
| Runtime / language | Node.js **>= 22**, TypeScript **5.9** (ES2024, NodeNext, ESM `"type":"module"`), Biome 2.x lint/format, Vitest test |
| Web / transport | `express` ^5.1, `helmet` ^8.1, `cors` ^2.8, `socket.io` ^4.8 (realtime), `undici` ^7.22 (HTTP client) |
| Persistence | `better-sqlite3` ^12.6 + `drizzle-orm` ^0.45 (SQLite read cache); Markdown recipes on disk (source of truth) |
| Validation / schema | `zod` ^4.3 (request validation + JSON-schema gen), `ajv` ^8.20, `js-yaml` ^4.1 |
| AST | `web-tree-sitter` ^0.26 (multi-language parsing) |
| Concurrency / CLI | `p-limit` ^7.3, `commander` ^14, `minimist` ^1.2, `ora` ^9.3 (spinners) |
| Platform | `open` ^11 (browser launch), `dotenv` ^17.3, `uuid` ^13, `winston` ^3.19 (logging seam) |
| Local deps | `@alembic/core` (`file:../AlembicCore`), `@alembic/agent` (`file:../AlembicAgent`) |
| Build | `npm run build:core` (build Core dist first) → `tsc`; `bin: { alembic: dist/bin/cli.js }` |

### The "Knowledge Organism" (Five Organs) — Host Surface vs Engine

The README models Alembic as five organs driven by an external IDE agent. In this repo, the main body owns only each organ's **host-side surface** (CLI/HTTP/wiring/orchestration); the organ **engine** lives in `@alembic/core`.

| Organ | README role | Engine (in `@alembic/core`) | Host surface in this repo |
|-------|-------------|-----------------------------|---------------------------|
| **Skeleton — Panorama** | Structural awareness: AST + call graphs, role/layer inference, coverage heatmaps | ProjectContextCapabilities, dimension catalog, canonical coverage-ledger module-id | `lib/workflows/project-context/**` (query itinerary, ProjectScope propagation, Swift/FS module derivation), `lib/service/module/` (ModuleService), MCP `alembic_bootstrap/rescan` envelopes |
| **Digest — Governance** | Metabolism of new knowledge: contradiction/redundancy/decay, ConfidenceRouter, ProposalExecutor, 6-state lifecycle | LifecycleStateMachine, StagingManager, ProposalExecutor, DecayDetector, EvolutionGateway | `lib/service/evolution/**` scheduling (FileChangeDispatcher, InProcessFileChangeHandler, EvolutionMaintenanceSweep), `lib/http/routes/evolution.ts`, `lib/http/routes/governance.ts` |
| **Nerves — Signal + Intent** | Senses agent behavior: IntentExtractor, 12 signal types, SignalBus | SignalBus stack, IntentExtractor, HitRecorder | signal emission from workflows/services; `lib/http/routes/signals.ts` reads; SignalModule wiring in DI |
| **Immunity — Guard** | Bidirectional code-standard check: 4-layer detection, ReverseGuard, RuleLearner | GuardCheckEngine, GuardService, RuleLearner, ViolationsStore, GuardFeedbackLoop | `lib/http/routes/guard.ts` + `guardRules.ts`, project guard-config merge in DI, `alembic guard`/`guard:ci`/`guard:staged` CLI |
| **Create — Tool Forge** | Forge temporary tools, VM/sandbox execution, auto-reclaim on expiry | Forge orchestration (agent/Core side) | `lib/sandbox/**` Seatbelt executor + `SandboxExecutorBridge` injected into every ToolContext; no in-repo Forge caller (agent-side) |

### Data & State Stores

A central design fact threads through the whole main body: **Markdown recipes are the source of truth; SQLite is a read-cache projection of them.** This is why the host needs a cross-process cache coordinator and content-hash-gated caches.

| Store | Location / mechanism | Role | Owner |
|-------|---------------------|------|-------|
| **Markdown recipes** | `<knowledgeDir>/recipes/**` (git sub-repo, managed by SetupService) | **Source of truth** for Recipes | host writes files (WriteZone/pathGuard); Core defines format |
| **SQLite DB** | `alembic.db` via better-sqlite3 + drizzle; WAL mode | **Read cache / projection** of recipes into `knowledge_entries`, `recipe_source_refs`, plus `audit_logs`, coverage-ledger rows/cells, job records, `project_context_file_snapshots` | Core owns connection/WAL/migrations/schema; host owns raw prepared-statement access helpers (`SqliteDatabaseAccess`) |
| **Vector index** | HNSW / JSON vector adapter (Core VectorService); region fixtures | Semantic search over recipe regions | Core engine; host orchestrates region-fixture generation + contextual enrichment |
| **In-memory caches** | `CacheService` (TTL), `GraphCache` (content-hash), search/guard caches | Fast local reads; invalidated cross-process by polling SQLite `PRAGMA data_version` (`CacheCoordinator`, long-running processes only) | host |
| **Runtime / control state** | `{runtimeDir}/daemon.json`/`.pid`/`.log`, `runtime-control.json`, `{jobsDir}/*.json`, `.asd/job-artifacts/**`, `.asd/job-display-snapshots/**`, `project-scopes.json`, wiki `<dataRoot>/Alembic/wiki/*.md` + `meta.json` | Daemon identity/discovery, job queue, per-project active/selected multiplexing, native ProjectScope, Repo Wiki output | host (daemon-state contract from Core) |

The knowledge lifecycle across these stores is: `pending → staging → active → evolving/decaying → deprecated` (6-state, engine in Core), with the host scheduling the metabolism (reactive file-change → proposals via EvolutionGateway; periodic EvolutionMaintenanceSweep; daemon-less tick-on-access driven directly from UiStartupTasks / governance routes / CLI).


---


## 02. Entrypoints, Bootstrap & Dependency Injection

This section documents how an Alembic **host process** boots: from a `bin/*.ts`
entrypoint, through the `AppRuntime` (Bootstrap) sequencer, into the singleton
`ServiceContainer` and its eight injection modules, with `AppConfigLoader` as the
load-bearing config source. It also maps precisely where the host layer stops and
delegation to `@alembic/core` / `@alembic/agent` begins.

The main-body repo (`alembic-ai`) is the **host layer**. Almost every service the
container registers is an engine class *imported from* `@alembic/core` or
`@alembic/agent`; the container's job is wiring, lifecycle, config injection, and
process-shape concerns (long-running vs CLI, AI hot-reload, cross-process cache).
See the [Boundary note](#boundary-note-host-owned-vs-delegated) at the end.

---

### 2.1 Responsibilities & role in the system

There are three families of process entrypoints that share this boot machinery:

1. **HTTP API server** — `bin/api-server.ts` (dev/test REST API).
2. **Daemon** — `bin/daemon-server.ts` (long-running per-project background service:
   HTTP + Dashboard + file-change collector + evolution maintenance sweep).
3. **MCP server / CLI** — not in this section's file set, but they use the *same*
   `AppRuntime.initialize()` + `getServiceContainer().initialize(...)` pair. The code
   branches on `process.env.ALEMBIC_MCP_MODE` / `ALEMBIC_API_SERVER` to decide
   long-running behaviors (`ServiceContainer.ts:245-248`, `Bootstrap.ts:86`).

The boot contract every entrypoint follows:

1. Set process-mode env flags (e.g. `ALEMBIC_API_SERVER=1`, `ALEMBIC_DAEMON_MODE=1`).
2. Install the graceful-shutdown coordinator (`shutdown.install()`).
3. Install process-level `uncaughtException` / `unhandledRejection` guards.
4. Resolve `projectRoot`, `chdir` into it, and configure the `pathGuard`
   **before any writes** (`AppRuntime.configurePathGuard`).
5. `new AppRuntime(...).initialize()` → returns a `components` bag.
6. `getServiceContainer().initialize({ ...components, projectRoot })` → wires all
   DI modules.
7. Start the process-specific server(s) and register LIFO shutdown hooks.

---

### 2.2 Key files, classes & functions

| Symbol | File:Line | Role |
| --- | --- | --- |
| `main()` (api) | `bin/api-server.ts:36` | HTTP API entrypoint orchestration |
| `main()` (daemon) | `bin/daemon-server.ts:50` | Daemon entrypoint orchestration |
| `AppRuntime` (a.k.a. `Bootstrap`) | `lib/Bootstrap.ts:37` | Ordered init sequencer; owns db/logger/audit/gateway/skillHooks/resolver |
| `AppRuntime.configurePathGuard` | `lib/Bootstrap.ts:61` | Configures Core `pathGuard` write-escape guard |
| `AppRuntime.initialize` | `lib/Bootstrap.ts:76` | The 6-step boot sequence |
| `ServiceContainer` | `lib/injection/ServiceContainer.ts:22` | The DI container (services + singletons maps) |
| `ServiceContainer.initialize` | `lib/injection/ServiceContainer.ts:71` | Injects bootstrap components + registers all modules |
| `ServiceContainer.singleton` | `lib/injection/ServiceContainer.ts:43` | Lazy-singleton registration helper |
| `ServiceContainer.reloadAiProvider` | `lib/injection/ServiceContainer.ts:176` | Hot-reload AI provider without restart |
| `getServiceContainer` / `resetServiceContainer` | `lib/injection/ServiceContainer.ts:339` / `:347` | Global singleton accessors |
| `ServiceMap` | `lib/injection/ServiceMap.ts:89` | Compile-time key→type map for `container.get(K)` |
| `getAiRuntimeStatus` / `getAiUnavailableMessage` | `lib/injection/AiRuntimeStatus.ts:33` / `:59` | AI readiness projection (no mock fallback) |
| `AppConfigLoader` (`ConfigLoader`) | `lib/infrastructure/config/AppConfigLoader.ts:1` | Config source; re-exports Core `ConfigLoader` with package-root override |
| `shutdown` coordinator | `lib/shared/shutdown.ts:127` | LIFO graceful-shutdown singleton |
| `PACKAGE_ROOT` / `DASHBOARD_DIR` | `lib/shared/package-assets.ts:38` / `:55` | Anchors asset paths to the `alembic-ai` package |

The eight DI modules (each a namespace module with a `register(c)` export):

| Module | File | Registers (headline services) |
| --- | --- | --- |
| `InfraModule` | `lib/injection/modules/InfraModule.ts` | database, logger, audit, gateway, eventBus, jobStore, repositories, writeZone, knowledgeFileWriter/SyncService, reportStore |
| `SignalModule` | `lib/injection/modules/SignalModule.ts` | signalBus, signalBridge, signalTraceWriter, signalAggregator |
| `AppModule` | `lib/injection/modules/AppModule.ts` | qualityScorer, recipeParser/Validator, feedbackCollector, tokenUsageStore, recipeSaveRateLimiter, moduleService, recipeExtractor |
| `KnowledgeModule` | `lib/injection/modules/KnowledgeModule.ts` | knowledgeService/GraphService, confidenceRouter, searchEngine, vectorStore, indexingPipeline, hybridRetriever, evolution stack, recipeProductionGateway, fileChangeDispatcher |
| `VectorModule` | `lib/injection/modules/VectorModule.ts` | vectorService, contextualEnricher |
| `GuardModule` | `lib/injection/modules/GuardModule.ts` | guardService, guardCheckEngine, exclusionManager, ruleLearner, violationsStore, guardFeedbackLoop |
| `AgentModule` | `lib/injection/modules/AgentModule.ts` | toolRegistry, toolRouter, agentService + agent-runtime stack, skillHooks |
| `AiModule` | `lib/injection/modules/AiModule.ts` | aiProvider (auto-detect), aiProviderManager, embed fallback, token recorder |

---

### 2.3 Control flow: process boot (step list)

Using `bin/api-server.ts` as the canonical trace (daemon differs only in the
server-startup tail; see §2.4):

1. **Mode flag** — `process.env.ALEMBIC_API_SERVER = '1'` at module top
   (`bin/api-server.ts:8`). The daemon additionally sets `ALEMBIC_DAEMON_MODE='1'`
   (`bin/daemon-server.ts:4`).
2. **Shutdown install** — `shutdown.install()` registers SIGTERM/SIGINT handlers
   (`bin/api-server.ts:18` → `lib/shared/shutdown.ts:102`).
3. **Process guards** — `uncaughtException` and `unhandledRejection` handlers log via
   the Core `Logger` and `process.exit(1)` (`bin/api-server.ts:21-34`).
4. **Resolve projectRoot** — `process.env.ALEMBIC_PROJECT_DIR || process.cwd()`
   (`bin/api-server.ts:49`). If it differs from cwd, `process.chdir(projectRoot)`
   so relative DB paths resolve correctly (`:52-54`).
5. **PathGuard** — `AppRuntime.configurePathGuard(projectRoot)` (`:56`). This calls
   Core `pathGuard.configure({ projectRoot, packageRoot: PACKAGE_ROOT,
   extraProjectWritableFiles: ['.env'] })` (`lib/Bootstrap.ts:61-73`). It is a no-op
   if `pathGuard.configured` is already true (MCP mode configures it earlier), except
   it can still late-bind `knowledgeBaseDir`.
6. **AppRuntime.initialize()** — `new AppRuntime({ env: NODE_ENV||'development' })`
   then `await appRuntime.initialize()` (`bin/api-server.ts:59-60`). See §2.5 for the
   internal 6 steps. Returns a `components` bag: `{ db, auditLogger, gateway,
   constitution?, config, skillHooks, workspaceResolver }`.
7. **Container.initialize()** — `getServiceContainer().initialize({...components,
   projectRoot, workspaceResolver})` (`:64-74`). See §2.6.
8. **HttpServer** — `new HttpServer({port, host})`; `initialize()`; `start()`
   (`:78-80`). `HttpServer` reads services from the same global container.
9. **Register shutdown hooks (LIFO)** — bootstrap shutdown (DB WAL checkpoint +
   close), then http-server stop, then `timerRegistry.dispose()`
   (`:90-100`). Because hooks run LIFO (`lib/shared/shutdown.ts:80`), the
   *last-registered* `timer-registry` disposes first and `bootstrap` (DB close) last.

> **Note on `constitution`**: `bin/api-server.ts:68` and `daemon-server.ts:80` pass
> `constitution: components.constitution`, but `AppRuntime.initialize()` never
> populates `components.constitution` in `Bootstrap.ts` (there is no
> `initializeConstitution`). So this field is `undefined` at wire time and the
> container's `initialize` simply skips it (there is no `if
> (bootstrapComponents.constitution)` branch in `ServiceContainer.initialize`,
> `:85-108`). Constitution config instead lives in `config/constitution.yaml` and is
> consumed by the `Gateway`. Treat the passed `constitution` as vestigial.

---

### 2.4 Daemon-specific startup tail

`bin/daemon-server.ts:main()` diverges after container init (`:76-85`) with
daemon-only concerns. All are host-owned process orchestration:

| Step | File:Line | Behavior |
| --- | --- | --- |
| Env normalization | `daemon-server.ts:52-65` | Resolves host/port/token; generates a 32-byte hex `ALEMBIC_DAEMON_TOKEN` if unset (`:58`); writes resolved values back to `process.env` |
| Mark interrupted jobs | `:87-92` | `markInterruptedDaemonJobs({code:'DAEMON_RESTARTED', ...})` flips in-flight jobs that a crash left dangling |
| Wire eventBus into gateway | `:94-100` | Pulls `container.get('eventBus')` and assigns `gateway.eventBus`; failure is non-fatal |
| Start HTTP server | `:102`, `:271-288` | `startHttpServer` probes `isPortAvailable`; on `EADDRINUSE` retries with port `0` (ephemeral) |
| File-change collector | `:103-107`, `:179-204` | `DaemonFileChangeCollector` polls git for changes and feeds `fileChangeDispatcher`; gated off by `ALEMBIC_DAEMON_FILE_CHANGES=0` |
| Evolution maintenance sweep | `:108-111`, `:206-226` | Periodic `EvolutionMaintenanceSweep`; gated off by `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP=0` |
| Mount Dashboard | `:114`, `:290-301` | Serves `DASHBOARD_DIR/dist` if `index.html` exists; else API-only |
| Readiness probe | `:116`, `:314-335` | `fetch(${url}/api/v1/daemon/health)` with 1s abort; asserts `{success:true}` |
| Write daemon state | `:120-130`, `:239-269` | `writeDaemonState(statePath, {...})` — the discovery file other processes read to find the daemon (url, port, token, pid, schema version) |
| UI startup tasks | `:139-148` | Fire-and-forget dynamic `import('.../UiStartupTasks.js')` |
| Shutdown hooks | `:150-176` | Removes state+pid files, stops server/collectors, re-marks jobs interrupted |

Notable daemon helpers: `resolveBoundDaemonPort` (`:228-237`) throws if no valid
port bound; `buildDaemonUrl` (`:337-342`) normalizes `0.0.0.0`/`::` to loopback and
brackets IPv6; `getSchemaMigrationVersion` (`:352-354`) delegates to
`readLatestSchemaMigrationVersion` from `SqliteDatabaseAccess`.

---

### 2.5 `AppRuntime.initialize()` — the ordered boot sequence

`AppRuntime` (`lib/Bootstrap.ts:37`) holds a plain `components` bag and runs a fixed
sequence. Order is load-bearing — later steps read components set by earlier ones via
the private `#requireComponent` guard (`lib/Bootstrap.ts:45-53`, throws if a
component is null).

| # | Step | Method | File:Line | Notes |
| --- | --- | --- | --- | --- |
| 0 | Load workspace settings into env | `loadRuntimeSettings` | `:132-139` | `WorkspaceSettingsStore.fromProject(root).applyToProcessEnv({override:false})` — explicit process env wins |
| 0.5 | Ensure PathGuard configured | inline | `:85-95` | If not configured and no `ALEMBIC_PROJECT_DIR` in MCP mode → throws |
| 0.8 | Create WorkspaceResolver | `initializeWorkspaceResolver` | `:214-226` | `resolveAlembicWorkspace(pathGuard.projectRoot)`; Ghost mode adds `dataRoot` to pathGuard allowlist |
| 1 | Load config | `loadConfig` | `:142-146` | `ConfigLoader.load(env)`; stores loader on `components.config` |
| 2 | Init logger | `initializeLogger` | `:149-159` | Reads `logging` config; Ghost mode redirects log path to `resolver.logsDir` |
| 3 | Connect DB | `initializeDatabase` | `:162-172` | `new DatabaseConnection(dbConfig, resolver)`; `connect()`; `runMigrations()` |
| 4 | Init core components | `initializeCoreComponents` | `:175-191` | Builds `AuditStore`→`AuditLogger`; loads `SkillHooks` (scans package + project `skills/*/hooks.js`) |
| 5 | Init gateway | `initializeGateway` | `:194-208` | `new Gateway(config.gateway?)`; injects `auditLogger` |

`initialize()` returns `this.components` (`:124`). Timing is logged
(`Alembic initialized successfully (Nms)`, `:122`).

**Ghost mode** (`resolver.ghost`) is the recurring branch: when a project's data is
stored in an external workspace directory rather than in-tree, the resolver's
`dataRoot`/`logsDir` diverge from `projectRoot`, and Bootstrap both (a) allowlists
`dataRoot` in pathGuard (`:223-225`) and (b) redirects logs (`:154-157`).

**Shutdown** (`AppRuntime.shutdown`, `:229-247`): unwraps the raw better-sqlite3
handle, runs `pragma('wal_checkpoint(TRUNCATE)')` to flush WAL, then `db.close()`.
Checkpoint failure is swallowed so shutdown never hangs.

---

### 2.6 `ServiceContainer.initialize()` — module wiring order

The container is a two-map design (`lib/injection/ServiceContainer.ts:25-26`):

- `services: Record<string, () => unknown>` — factory registry (what `get()` calls).
- `singletons: Record<string, unknown>` — realized-instance cache **and** a bag of
  container-level state (keys prefixed `_`, e.g. `_projectRoot`, `_config`,
  `_aiProviderManager`, `_recipeExtractor`, `_workspaceResolver`).

`singleton(name, factory, {aiDependent?})` (`:43-60`) wraps a factory so the first
`get()` realizes and caches it, and optionally records the name in
`_aiDependentSingletons` for AI hot-reload eviction.

`initialize(bootstrapComponents)` order (`:71-164`):

1. **Multi-project guard** (`:73-82`) — throws if `projectRoot` differs from a
   previously-bound `_projectRoot`. One process = one project.
2. **Inject bootstrap components into `singletons`** (`:85-108`): `database`,
   `auditLogger`, `gateway`, `_projectRoot`, `_workspaceResolver`, `_config`,
   `skillHooks`. These bypass the factory path — later factories read them directly.
   (Note: `constitution` is *not* injected here — see §2.3.)
3. **`AiModule.initialize(this)`** (`:111`) — async AI provider auto-detect + manager
   creation *before* other modules, so downstream factories can read
   `singletons.aiProvider`.
4. **`AppModule.initRecipeExtractor(this)`** (`:114`) — seeds
   `singletons._recipeExtractor`.
5. **`InfraModule.register(this)`** (`:117`) — registers infra + repositories +
   `writeZone`.
6. **`_aiDependentSingletons` / `_lang` init** (`:123-126`).
7. **`SignalModule.register(this)` then eager `this.get('signalBus')`**
   (`:130-131`) — signalBus must exist in `singletons` before later factories read
   `ct.singletons.signalBus` (Guard/Knowledge/Evolution pass it as an optional dep).
8. **Register remaining modules in order** (`:132-137`): `AppModule`,
   `KnowledgeModule`, `VectorModule`, `GuardModule`, `AgentModule`, `AiModule`.
9. **`initFrameworkEnhancements()`** (`:140-146`) — async, wrapped in try/catch,
   non-blocking (Core enhancement-pack registry).
10. **`VectorModule.initializeVectorService(this)`** (`:149`) — async; binds
    ContextualEnricher into the IndexingPipeline and calls `vectorService.initialize()`.
11. **`KnowledgeModule.initializeKnowledgeServices(this)`** (`:152`) — binds
    `eventBus` `knowledge:changed` → `searchEngine.refreshIndex()` and source-ref
    population.
12. **`#initCacheCoordinator()`** (`:155`) — see §2.9.

> **Registration-order gotcha**: because most factories are *lazy* singletons, the
> `register(...)` call order rarely matters for correctness — the dependency is only
> resolved on first `get()`. The two places order *does* matter are the **eager**
> reads: `this.get('signalBus')` (`:131`) and the `initialize*` post-passes (steps
> 10–11), which realize services immediately and therefore require their transitive
> deps to already be registered. The comment at `:128` ("AppModule 先注册 ...") is
> partly aspirational: `moduleService` (AppModule) depends on `guardCheckEngine`
> (GuardModule) and `agentService` (AgentModule), which are registered *after*
> AppModule — but since `moduleService` is lazy, this is fine.

**`container.get(name)`** (`:316-323`) throws `Service 'x' not found` for unknown
keys; otherwise invokes the factory (which, for singletons, returns the cached
instance). The typed overload `get<K extends keyof ServiceMap>` gives compile-time
return types from `ServiceMap` (`ServiceMap.ts:89`).

---

### 2.7 Per-module registration detail

#### InfraModule (`lib/injection/modules/InfraModule.ts`)

- `database` (`:49-56`) — **not** a factory-built instance; a guard that returns the
  pre-injected `singletons.database` or throws if Bootstrap didn't run.
- `logger` (`:58`) — returns `Logger.getInstance()` each call (Core singleton).
- `auditStore` / `auditLogger` (`:60-73`) — `auditLogger` conditionally wires the
  `eventBus` only if that service is registered (`ct.services.eventBus ? ... : null`).
- `gateway` (`:74`) — lazy `new Gateway()` (but the *injected* `singletons.gateway`
  from Bootstrap is what's actually cached first; the factory is a fallback).
- `eventBus` (`:75`) — `new EventBus({maxListeners:30})`.
- `bootstrapTaskManager` (`:77-90`) — wires eventBus + a lazy `getRealtimeService`
  getter (realtime is absent in CLI/tests, so it's wrapped in try/catch).
- `jobStore`, `jobDisplaySnapshotStore`, `jobProcessEventRecorder` (`:92-112`) —
  daemon job persistence, all anchored to `resolver.dataRoot`.
- `writeZone` (`:116-124`) — `new WriteZone(resolver)` or `null` if no resolver. This
  is the write-sandbox object threaded into nearly every file-writing service.
- **Repositories** (`:128-179`) — most come from a **shared bundle**:
  `getCoreRepositoryBundle(ct)` (`:35-44`) lazily calls Core
  `createAlembicRepositories(db)` once and caches it in
  `singletons._coreRepositoryBundle`. `knowledgeRepository`, `bootstrapRepository`,
  `guardViolationRepository`, `sessionRepository`, `proposalRepository`,
  `recipeSourceRefRepository`, `coverageLedgerRepository` all read from this bundle.
  `auditRepository` and `memoryRepository` are constructed directly.
- `knowledgeFileWriter` / `knowledgeSyncService` (`:181-195`), `reportStore`
  (`:199-203`) — dataRoot + writeZone anchored.

#### SignalModule (`lib/injection/modules/SignalModule.ts`)

Registered early and eagerly warmed. `signalBus` (`:19`) is a Core `SignalBus`;
`signalBridge` (`:23`) forwards SignalBus→EventBus; `signalTraceWriter` (`:31`) writes
JSONL under `dataRoot/.asd/logs/signals`; `signalAggregator` (`:42`) starts a
sliding-window aggregator and registers its own `shutdown` hook (`:48-50`).

#### AppModule (`lib/injection/modules/AppModule.ts`)

`qualityScorer`, `recipeParser`, `recipeCandidateValidator` (`:24-26`);
`recipeExtractor` returns the pre-seeded `_recipeExtractor` (`:27`);
`feedbackCollector` (`:29`) and `tokenUsageStore` (`:37`) DB/dataRoot-anchored;
`recipeSaveRateLimiter` (`:47`, host-owned rate limiter); `moduleService` (`:51-67`)
is the biggest wire — it receives `agentService`, `systemRunContextFactory`, a
`getAiRuntimeStatus(ct)` projector closure (AD4: passes a *status projector*, not the
container, into the service layer — `:60`), `qualityScorer`, `recipeExtractor`,
`guardCheckEngine`, `violationsStore`.

#### KnowledgeModule (`lib/injection/modules/KnowledgeModule.ts`)

The largest module. Registers the knowledge/graph/confidence stack (`:59-94`), the
**search + vector** stack (`:98-201`), Core shared registries (`:205-208`), and the
full **evolution** stack (`:212-374`): `sourceRefReconciler`, `stagingManager`,
`decayDetector`, `redundancyAnalyzer`, `enhancementSuggester`, `contentPatcher`,
`lifecycleStateMachine`, `proposalExecutor`, `consolidationAdvisor`,
`evolutionGateway`, `recipeProductionGateway`, plus the in-process file-change chain
`fileChangeHandler` → `fileChangeDispatcher` (`:352-374`).

Notable algorithm — **vectorStore adapter selection** (`:121-173`): reads
`config.vector.adapter` (`'auto'|'hnsw'|'json'`); `auto`/`hnsw` try
`HnswVectorAdapter` and **fall back to `JsonVectorAdapter` on any error, logging a
warning** (`:153-166`). All adapters are `initSync()`-ed inline.

`initializeKnowledgeServices` (`:381-416`) binds two `knowledge:changed` listeners on
the EventBus: (1) refresh the BM25/search index, (2) populate `recipe_source_refs`
for newly-created entries. Note `await_import_EventBus` (`:419-424`) is a
**synchronously-called helper** (its name contains "await", it is not an `await`
expression) that only returns a type-shim; `initializeKnowledgeServices` itself is a
plain `void` function.

#### VectorModule (`lib/injection/modules/VectorModule.ts`)

`contextualEnricher` (`:18`, returns null when no aiProvider) and `vectorService`
(`:33`) both `aiDependent`. `initializeVectorService` (`:79-111`) injects the enricher
into the pipeline when `config.vector.contextualEnrich` is set, then calls
`vectorService.initialize()` (non-blocking on error).

#### GuardModule (`lib/injection/modules/GuardModule.ts`)

`guardService` (`:26`), `guardCheckEngine` (`:43`), `exclusionManager`,
`ruleLearner`, `violationsStore`, `guardFeedbackLoop`. Notable: `guardCheckEngine`
(`:43-82`) **merges base guard config** (`_config.guard`) **with a project-level
override** read from `dataRoot/.asd/config.json`'s `guard` block, deep-merging
`codeLevelThresholds` and unioning `disabledRules` (`:63-73`). All engine classes are
imported from `@alembic/core/guard`.

#### AgentModule (`lib/injection/modules/AgentModule.ts`)

The host↔agent bridge. Registers `capabilityCatalog`, `toolContextFactory`
(long-lived, holds DeltaCache/SearchCache/Compressor — `:32-39`), `toolRouter`
(`ToolRouterAdapter`, `:42-48`), `toolRegistry` (a `UnifiedToolCatalog` seeded from
host `DASHBOARD_OPERATION_MANIFESTS` + `SKILL_CAPABILITY_MANIFESTS`, `:53-61`),
`workflowRegistry`, and the full agent-runtime chain: `agentProfileRegistry`,
`agentStageFactoryRegistry`, `agentProfileCompiler`, `agentRunCoordinator`,
`systemRunContextFactory`, `agentRuntimeBuilder`, `agentService` (`:65-115`).
The registries/compiler/coordinator are `aiDependent:false`; the runtime-builder,
context-factory, and `agentService` are `aiDependent:true` (evicted on AI reload).
`skillHooks` (`:117-123`) is also (re)registered here as a best-effort loader.

#### AiModule (`lib/injection/modules/AiModule.ts`)

Runs in two phases — `initialize` (before module registration) and `register`
(after). See §2.8.

---

### 2.8 The lazy / hot-reloadable AI runtime

Alembic deliberately does **not** substitute a mock provider for "AI unconfigured";
a missing provider is an explicit unavailable state (`AiRuntimeStatus.ts:1-8`).

**Startup detection** (`AiModule.initialize`, `:28-105`):

1. Dynamically `import('@alembic/agent/ai')` into `singletons._aiFactory`
   (null on failure, `:32-36`).
2. `aiFactory.autoDetectProvider()` → `singletons.aiProvider` (`:39-60`). A `mock`
   provider is logged and treated as unavailable.
3. `ensureManagerForProvider(c, provider)` (`:65`, `:173-207`): if provider is
   null/mock, sets `_aiProviderManager = null` and returns null (AI stays
   unavailable). Otherwise builds an `AiProviderManager` and binds three callbacks:
   `_bindDiSync` (writes back `aiProvider`/`_embedProvider` on switch, `:193`),
   `_bindDependentClearer` (evicts aiDependent singletons, `:199`),
   `_bindEmbedFallbackInit` (`:202`).
4. Embed provider: prefer a dedicated one from `createEmbedProvider()`
   (`ALEMBIC_EMBED_PROVIDER`, `:78-94`); else `createEmbedFallback` (`:97-99`,
   `:111-150`).

**Post-registration** (`AiModule.register`, `:159-171`): marks `_aiModuleReady`,
registers the `aiProviderManager` factory (returns `singletons._aiProviderManager`),
and attaches the token recorder (`attachTokenRecorder`, `:220-240`) that funnels usage
into `tokenUsageStore` (which only exists after AppModule registered it — hence the
two-phase split).

**Hot reload** (`ServiceContainer.reloadAiProvider`, `:176-202`): called after an API
key change. Rejects null and `mock` providers, then either
`manager.switchProvider(newProvider)` (atomic: swap ref, remount token AOP, rebuild
embed fallback, clear aiDependent singletons, notify listeners) or, if no manager yet,
`ensureManagerForProvider` + `clearAiDependentSingletons`. The set of evicted keys is
exactly what modules marked with `{aiDependent:true}` — currently `searchEngine`,
`indexingPipeline`, `systemRunContextFactory`, `agentRuntimeBuilder`, `agentService`,
`vectorService`, `contextualEnricher`.

**Readiness projection** (`getAiRuntimeStatus`, `AiRuntimeStatus.ts:33-57`): returns
`{ready, reason, providerName, model}`. `ready` requires both a `provider` and a
`manager` with `isReady===true`; `mock` short-circuits to
`reason:'mock-provider-disabled'`. `getAiUnavailableMessage` gives the user-facing
Chinese "configure a real provider" strings (`:59-64`). This projector (not the raw
container) is what services like `moduleService` receive (`AppModule.ts:60`).

---

### 2.9 Cross-process cache coordination

`#initCacheCoordinator()` (`ServiceContainer.ts:216-260`) constructs a
`CacheCoordinator` around the raw SQLite handle (`unwrapRawDb`). It subscribes two
invalidators — `guardCheckEngine.clearCache()` and `searchEngine.buildIndex()` — so
that when *another* process writes the DB (detected via SQLite `PRAGMA data_version`),
this process drops stale in-memory caches. Polling is **only** started for
long-running processes (`ALEMBIC_MCP_MODE` or `ALEMBIC_API_SERVER`); CLI processes are
short-lived and skip it (`:245-248`). Failures are non-blocking (`:255-259`).

---

### 2.10 AppConfigLoader — the load-bearing config source

`lib/infrastructure/config/AppConfigLoader.ts` is tiny but structurally critical:

```ts
import ConfigLoader from '@alembic/core/config';
import { PACKAGE_ROOT } from '../../shared/package-assets.js';
ConfigLoader._findPackageRoot = () => PACKAGE_ROOT;   // AppConfigLoader.ts:4
export { ConfigLoader };
export default ConfigLoader;
```

The Core `ConfigLoader` (`AlembicCore/src/infrastructure/config/ConfigLoader.ts`) is a
static-class singleton that lazily reads and deep-merges JSON files from
`<packageRoot>/config`, in order: `default.json` → `${NODE_ENV}.json` →
`local.json` (`ConfigLoader.ts:40-64`), stamps `merged.env`, and runs a
**non-blocking** Zod validation that only warns (`:68-75`). Its public API is
`load(env)`, `get('a.b.c')` (dotted-path, throws on missing key), `has(key)`, and
`set` (`:40`, `:108`, `:126`, `:135`).

**Why the override matters**: Core's own `_findPackageRoot` walks up looking for a
`package.json` named `@alembic/core` *or* `alembic-ai` (`ConfigLoader.ts:17-38`). When
Alembic runs from an installed package, Core's copy could resolve to Core's own
package dir, pointing config at the wrong `config/`. `AppConfigLoader` forcibly pins
`_findPackageRoot` to the host's `PACKAGE_ROOT` (the directory whose `package.json`
name is `alembic-ai`, resolved by `package-assets.ts:15-38`), guaranteeing config is
read from the **host** `config/default.json`. **Everything downstream depends on this
being imported before any config read** — `Bootstrap.loadConfig` (`Bootstrap.ts:145`)
imports `ConfigLoader from './infrastructure/config/AppConfigLoader.js'`, so the
override is installed as a side effect of that import.

Config top-level keys actually present in host `config/default.json` (verified):
`database`, `server`, `cache`, `monitoring`, `logging`, `constitution`, `paths`,
`features`, `ai`, `vector`, `qualityGate`, `guard`, `taskGraph`. These are read across
the boot: `logging` (`Bootstrap.ts:151`), `database` (`Bootstrap.ts:164`), `gateway`
(`Bootstrap.ts:196` — note: not a top-level key in the sampled default.json, so
`configLoader.has('gateway')` may be false and Gateway boots with `undefined`),
`guard` (`GuardModule.ts:44`), `vector` (`KnowledgeModule.ts:125`,
`VectorModule.ts:38`). Once loaded, the config object is also stashed on
`singletons._config` (`ServiceContainer.ts:102-104`) so module factories read it
without re-invoking `ConfigLoader.get`.

---

### 2.11 External interfaces (enumerations)

**Process entrypoints / CLI-shape:**

| Entrypoint | File | Purpose |
| --- | --- | --- |
| `api-server` | `bin/api-server.ts` | REST API server (dev/test) |
| `daemon-server` | `bin/daemon-server.ts` | Long-running per-project daemon |

**Environment variables that steer boot** (host-owned):

| Env var | Read at | Effect |
| --- | --- | --- |
| `ALEMBIC_API_SERVER` | set `api-server.ts:8`; read `ServiceContainer.ts:246` | Marks long-running; enables cache polling |
| `ALEMBIC_DAEMON_MODE` | set `daemon-server.ts:4` | Marks daemon process |
| `ALEMBIC_MCP_MODE` | `Bootstrap.ts:86`, `ServiceContainer.ts:245` | MCP mode: pathGuard configured externally; enables cache polling |
| `ALEMBIC_PROJECT_DIR` | `api-server.ts:49`, `daemon-server.ts:52`, `Bootstrap.ts:88/134` | Project root override |
| `NODE_ENV` | `Bootstrap.ts:143`, `ConfigLoader.ts:40` | Selects `${env}.json` config layer |
| `ALEMBIC_DAEMON_HOST/PORT/TOKEN/STATE_PATH` | `daemon-server.ts:53-60` | Daemon bind + auth + state file |
| `ALEMBIC_DAEMON_FILE_CHANGES` | `daemon-server.ts:184` | `=0` disables file-change collector |
| `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP` | `daemon-server.ts:210` | `=0` disables maintenance sweep |
| `ALEMBIC_DAEMON_FILE_CHANGE_INTERVAL_MS` | `daemon-server.ts:197` | Collector poll interval |
| `ALEMBIC_EMBED_PROVIDER` | via `createEmbedProvider` (`AiModule.ts:82`) | Dedicated embedding provider |

**Emitted events** (via Core `EventBus`, bound during init):

| Event | Bound at | Handler |
| --- | --- | --- |
| `knowledge:changed` | `KnowledgeModule.ts:394` | `searchEngine.refreshIndex()` |
| `knowledge:changed` (action `create`) | `KnowledgeModule.ts:403` | populate `recipe_source_refs` |

**DB tables touched by wiring** (indirectly, via Core repositories): `recipe_source_refs`
(`KnowledgeModule.ts:467`), `token_usage` (via `TokenUsageStore`), plus the schema
migration version table read via `readLatestSchemaMigrationVersion`
(`daemon-server.ts:353`). The container itself owns no tables — it wires Core
repositories that do.

**Exported container APIs:** `getServiceContainer()`, `resetServiceContainer()`
(`ServiceContainer.ts:339/347`), instance `get`/`register`/`singleton`/`reset`/
`getServiceNames`/`getLang`/`setLang`/`buildToolContext`/`reloadAiProvider`, and the
static `ServiceContainer.getInstance()` (`:63`).

---

### 2.12 Notable gotchas & edge cases

- **One project per process** — `ServiceContainer.initialize` throws on a second,
  different `projectRoot` (`:76-82`). There is no un-bind; you must start a new
  process to switch projects.
- **Global mutable singletons** — both `getServiceContainer()` (`:339`) and Core
  `Logger.getInstance()` are process-global. Tests must call
  `resetServiceContainer()` (`:347`, only clears `singletons`, not `services`) and be
  careful about leaked env flags.
- **`register` warns on double-registration** (non-production only, `:299-302`).
  `skillHooks` is registered twice (Bootstrap injects it, AgentModule re-registers a
  factory `:117`), and `gateway` similarly (injected + InfraModule factory). The
  injected `singletons` value wins because `get()` returns the cached singleton.
- **`vestigial constitution` component** — passed by both entrypoints but never
  produced by Bootstrap (see §2.3).
- **PathGuard must precede any write** — `AppRuntime.configurePathGuard` is called in
  `bin` *before* `initialize()`, and `initialize()` re-checks (`Bootstrap.ts:85-95`).
  Getting this wrong means writes can escape the project sandbox or be rejected.
- **Eager `signalBus`** — the only place where lazy registration is intentionally
  forced (`ServiceContainer.ts:131`); removing it would break factories that read
  `ct.singletons.signalBus` before any `get('signalBus')` occurred.
- **Non-blocking init passes** — enhancement registry, vector service init, cache
  coordinator, and both `knowledge:changed` bindings all swallow errors so a partial
  environment (e.g. no embedding provider) still yields a usable container.
- **LIFO shutdown ordering** — hooks run reverse-registration (`shutdown.ts:80`), with
  a 10s hard-timeout `process.exit(1)` safeguard (`:73-77`). DB close is registered
  first so it runs last (after the HTTP server has drained).

---

### Boundary note (host-owned vs delegated)

**Owned by this repo (`alembic-ai`):**

- All process orchestration: `bin/api-server.ts`, `bin/daemon-server.ts`, the
  `AppRuntime`/Bootstrap sequencer (`lib/Bootstrap.ts`), and the graceful-shutdown
  coordinator (`lib/shared/shutdown.ts`).
- The **DI container itself** — `ServiceContainer`, `ServiceMap`, all eight injection
  modules, and the container-level state bag (`_projectRoot`, `_config`,
  `_aiProviderManager`, etc.). The container's contribution is *wiring, lifecycle,
  config injection, AI hot-reload, and cross-process cache coordination* — not engine
  logic.
- Host-only services constructed here: `AuditStore`/`AuditLogger`
  (`lib/infrastructure/audit`), `Gateway` (`lib/governance/gateway`), `SkillHooks`,
  `ModuleService`, `RecipeSaveRateLimiter`, `ToolContextFactory`/`ToolRouterAdapter`
  wiring, daemon job stores (`JobStore` is Core, but `JobDisplaySnapshotStore` /
  `JobProcessEventRecorder` are host), `CacheCoordinator`,
  `DaemonFileChangeCollector`, `EvolutionMaintenanceSweep`, `HttpServer`,
  `RealtimeService`, `WorkspaceResolver` wiring, and `package-assets`/`ProjectScope*`
  path resolution.
- `AppConfigLoader` — host-owned *adapter* that pins Core's `ConfigLoader` package
  root to `alembic-ai` and re-exports it. The host also owns the `config/*.json`
  files themselves.

**Delegated to `@alembic/core`:**

- The config engine (`ConfigLoader` class + Zod schema), `DatabaseConnection` +
  migrations, `Logger`, `pathGuard`/`WriteZone`/`WorkspaceSettingsStore`, `EventBus`,
  `SignalBus`/`SignalBridge`/`SignalTraceWriter`/`SignalAggregator`, `JobStore`,
  daemon state helpers (`writeDaemonState`, `DAEMON_STATE_SCHEMA_VERSION`),
  `timerRegistry`, and every repository via `createAlembicRepositories`.
- The knowledge/search/vector engine: `KnowledgeService`, `KnowledgeGraphService`,
  `ConfidenceRouter`, `RecipeExtractor`, `RecipeProductionGateway`, `SearchEngine`,
  `HybridRetriever`, `Hnsw/JsonVectorAdapter`, `IndexingPipeline`, `VectorService`.
- The full **evolution / lifecycle** stack (`LifecycleStateMachine`,
  `StagingManager`, `ProposalExecutor`, `DecayDetector`, `EvolutionGateway`, …) — the
  container only *instantiates and wires* these; the state machine and Recipe
  lifecycle live in Core.
- The **Guard** engine (`GuardCheckEngine`, `GuardService`, `RuleLearner`,
  `ExclusionManager`, `ViolationsStore`, `GuardFeedbackLoop`) — Core; the host only
  merges project-level guard config and injects the DB/signalBus.
- Quality + recipe primitives (`QualityScorer`, `FeedbackCollector`, `RecipeParser`,
  `RecipeCandidateValidator`, `DimensionCopy`, `LanguageService`) — Core.
- `resolveProjectRoot`/`resolveDataRoot`/`resolveKnowledgeScanDirs`/`WorkspaceResolver`
  — Core (`@alembic/core/workspace`); the host calls them from module factories.

**Delegated to `@alembic/agent`:**

- The AI provider layer: `AiProviderManager`, `AiProvider`, auto-detect factory
  (`@alembic/agent/ai`) — the host `AiModule` orchestrates *lifecycle* (detect, embed
  fallback, token recorder, hot-reload) but the providers/manager are Agent code.
- The in-process agent runtime + tool system: `AgentService`, `AgentRuntimeBuilder`,
  `AgentProfileRegistry`/`Compiler`, `AgentRunCoordinator`,
  `AgentStageFactoryRegistry`, `SystemRunContextFactory`, `UnifiedToolCatalog`,
  `WorkflowRegistry`, `RuntimeCapabilityCatalog`, `ToolRouterAdapter`
  (`@alembic/agent` + `@alembic/agent/service` + `@alembic/agent/tools/runtime`). The
  host `AgentModule` wires these together and injects host-owned tool manifests
  (`DASHBOARD_OPERATION_MANIFESTS`, `SKILL_CAPABILITY_MANIFESTS`) and the
  `ToolContextFactory`.


---


## 03. CLI Commands, Setup & AI Scan

This section documents the **user-facing command-line surface** of the Alembic main-body
repo (`alembic-ai`): the commander program in `bin/cli.ts`, the workspace bootstrap
service `SetupService`, the local `ais` (AI-scan) entry `AiScanService`, and the shared
CLI output helper `CliLogger`. It also covers the `ai configure` / `ai status` flow and the
Ghost-mode machinery.

Everything here is **host-owned**: argument parsing, workspace scaffolding, output
formatting, process lifecycle, and the wiring that turns a shell invocation into a call
into a service in the DI container. The deep engine work (Recipe lifecycle, knowledge sync,
Guard rule evaluation, agent runs, project-index orchestration) is delegated to
`@alembic/core` and `@alembic/agent` — see the Boundary note at the end.

### 3.1 Role in the system

`bin/cli.ts` is the single commander entrypoint (declared as the package `bin`). It:

1. Installs process-level safety nets: `uncaughtException` / `unhandledRejection` handlers
   that print to stderr and `process.exit(1)` (`bin/cli.ts:52`, `bin/cli.ts:60`), and a
   graceful-shutdown coordinator `shutdown.install()` (`bin/cli.ts:71`).
2. Reads its own `package.json` for the `--version` string, tolerating a missing file
   with a `2.0.0` fallback (`bin/cli.ts:48`).
3. Registers every command/subcommand, then calls `program.parse(process.argv)` at the
   very end (`bin/cli.ts:2885`).

Two structural patterns run through the whole file:

- **Lazy dynamic imports.** Nearly every heavy dependency (`ProjectRuntimeControl`,
  `SetupService`, `AiScanService`, `DaemonSupervisor`, workflows, `ora`, `open`,
  `@alembic/core/*`, `@alembic/agent/*`) is loaded with `await import(...)` **inside** the
  action handler, not at module top-level (e.g. `bin/cli.ts:106`, `:136`, `:1210`,
  `:244`). This keeps CLI startup fast and avoids pulling the full runtime for commands
  like `--help` or `status`.
- **`initContainer()` as the universal DI entrypoint.** Any command that needs the service
  layer calls the local `initContainer()` helper (`bin/cli.ts:2109`), which boots
  `AppRuntime` (`lib/Bootstrap.js`) and returns `{ bootstrap, container }`. Handlers then
  `container.get('<serviceName>')` and, on completion, `await bootstrap.shutdown()`.

Output never uses `console.log` directly in most paths — it goes through the `cli`
singleton from `CliLogger` (see 3.7), which is Guard-rule compliant. A notable exception is
the `ghost` command, which uses `console.log`/`console.error` directly (`bin/cli.ts:2751`
onward).

### 3.2 Command catalog

The following table enumerates every command and subcommand registered in `bin/cli.ts`.
"Service / delegate" names the primary object the handler drives.

| Command | Args / key flags | What it does | Service / delegate (file:line) |
|---|---|---|---|
| `start [target]` | `-d/--dir`, `--project-root`, `--restart`, `--wait`, `--stop-wait`, `--no-open`, `--json`, `--dev`, `-p/--port`, `--api-only`, `--static-dashboard` | Unified launch. Default path opens a project runtime + Dashboard; `--dev`/`--api-only`/`--static-dashboard` branch to a direct dev server. | `ProjectRuntimeControl.openDashboard` (`bin/cli.ts:107`); dev branch `runDirectStartDevServer` (`bin/cli.ts:2359`) |
| `setup` | `-d/--dir` (`.`), `--force`, `--seed`, `--ghost`, `--repo <url>` | Initialize a workspace: runtime dir, DB, recipes sub-repo, templates. | `SetupService` (`bin/cli.ts:136`) → 3.4 |
| `ai status` | `-d/--dir`, `--json` | Show effective AI config + source resolution. | `buildAiConfigStatus` (`bin/cli.ts:159`) → 3.6 |
| `ai configure` | `-d/--dir`, `--provider`, `--model`, `--key`, `--key-stdin`, `--google-key`/`--openai-key`/`--claude-key`/`--deepseek-key`, `--proxy`, `--reasoning-effort`, `--embed-*`, `--json` | Write AI settings/secrets into the workspace settings store. | `WorkspaceSettingsStore.writeAiConfig` (`bin/cli.ts:194`) → 3.6 |
| `ai import-env` | `-d/--dir`, `--json` | Import explicitly-set `ALEMBIC_*` env vars into workspace config. | `collectAiEnv` + `WorkspaceSettingsStore` (`bin/cli.ts:211`) |
| `daemon start` | `-d/--dir`, `-p/--port` (`0`=dynamic), `-H/--host`, `--restart`, `--wait`, `--no-open`, `--json` | Start the per-project daemon (dynamic port + state file). | `DaemonSupervisor.start` (`bin/cli.ts:246`) |
| `daemon status` | `-d/--dir`, `--json` | Check daemon status. | `DaemonSupervisor.status` (`bin/cli.ts:272`) |
| `daemon stop` | `-d/--dir`, `--wait`, `--json` | Stop the daemon. | `DaemonSupervisor.stop` (`bin/cli.ts:289`) |
| `projects list` | `--json` | List registered projects + runtime scope summary. | `ProjectRuntimeControl.snapshot` (`bin/cli.ts:313`) |
| `projects status` | `--json` | status-all + selected/active runtime. | `ProjectRuntimeControl.snapshot` (`bin/cli.ts:327`) |
| `projects inspect [target]` | `-d/--dir`, `--project-root`, `--json` | Inspect one project's runtime scope. | `ProjectRuntimeControl.inspectProject` (`bin/cli.ts:343`) |
| `projects current` | `--json` | Show selected + active runtime project. | `ProjectRuntimeControl.snapshot` (`bin/cli.ts:359`) |
| `projects select [target]` | `-d/--dir`, `--project-root`, `--json` | Set the selected project. | `ProjectRuntimeControl.selectProject` (`bin/cli.ts:383`) |
| `projects start [target]` | `-d/--dir`, `--project-root`, `--restart`, `--wait`, `--stop-wait`, `--json` | Start a project daemon, set it selected/active. | `ProjectRuntimeControl.startProject` (`bin/cli.ts:404`) |
| `projects stop [target]` | `-d/--dir`, `--project-root`, `--wait`, `--json` | Stop a project daemon (clears active, keeps selected). | `ProjectRuntimeControl.stopProject` (`bin/cli.ts:424`) |
| `projects open-dashboard [target]` | `-d/--dir`, `--project-root`, `--restart`, `--wait`, `--stop-wait`, `--json` | Start/reuse daemon and return the Dashboard handoff URL. | `ProjectRuntimeControl.openDashboard` (`bin/cli.ts:444`) |
| `projects switch [target]` | `-d/--dir`, `--project-root`, `--restart`, `--wait`, `--stop-wait`, `--json` | Stop current active, start target, return handoff. | `ProjectRuntimeControl.switchProject` (`bin/cli.ts:466`) |
| `projects clear` | `--json` | Clear the selected project (no registry/data deletion). | `ProjectRuntimeControl.clearSelection` (`bin/cli.ts:483`) |
| `project-scope add <folder>` | `--control-root`, `--project-scope-id`, `--display-name`, `--role`, `--json` | Bind a source folder to a ProjectScope. | `ProjectScopeRegistryStore.addFolder` (`bin/cli.ts:510`) |
| `project-scope list` | `--project-scope-id`, `--control-root`, `--json` | List ProjectScopes + bound folders. | `ProjectScopeRegistryStore` + `summarizeProjectScope` (`bin/cli.ts:531`) |
| `project-scope resolve [folder]` | `-d/--dir`, `--json` | Resolve which ProjectScope a folder belongs to. | `ProjectScopeRegistryStore.resolveFolder` (`bin/cli.ts:558`) |
| `remote <url>` | `-d/--dir` | Turn `recipes/` into a standalone sub-repo tied to a Git remote. | inline `git` via `execSync` (`bin/cli.ts:586`) |
| `coldstart` | `-d/--dir`, `-m/--max-files` (`500`), `--dims`, `--skip-guard`, `--no-skills`, `--wait`, `--no-delivery`, `--json` | Cold-start knowledge base (multi-dimension analysis + async AI fill). | `runProjectIndexWorkflow(..., { mode: 'full' })` (`bin/cli.ts:703`) |
| `rescan` | `-d/--dir`, `-m/--max-files` (`500`), `--dims`, `--reason`, `--force`, `--wait`, `--json` | Incremental update: preserve Recipes, re-scan + evidence audit. | `runProjectIndexWorkflow(..., { mode: 'incremental' })` (`bin/cli.ts:889`) |
| `evolve-check` | `--recipes <ids>`, `-d/--dir`, `--json`, `--dry-run` | Agent-driven full Recipe evolution audit + auto-decisions. | `runEvolutionAudit` from `@alembic/agent/service` (`bin/cli.ts:1130`) |
| `ais [target]` | `-d/--dir`, `-m/--max-files` (`200`), `--dry-run`, `--json` | Scan target source → extract & publish Recipes. | `AiScanService.scan` (`bin/cli.ts:1216`) → 3.5 |
| `search <query>` | `-t/--type`, `-m/--mode`, `-l/--limit`, `-r/--rank`, `-o/--output` | Search the knowledge base. | `searchEngine.search` (`bin/cli.ts:1268`) |
| `guard <file>` | `-s/--scope` (`file`), `--json` | Guard-check a single file. | `guardCheckEngine.checkCode` (`bin/cli.ts:1325`) |
| `guard:ci [path]` | `--fail-on-error`, `--fail-on-warning`, `--max-warnings`, `--max-uncertain`, `--min-coverage`, `--report`, `--output`, `--min-score`, `--max-files` | Whole-project Guard check with CI exit codes. | `guardCheckEngine.auditFiles` (`bin/cli.ts:1446`) |
| `guard:staged` | `--fail-on-error`, `--json` | Guard-check git-staged source files. | `guardCheckEngine.auditFiles` (`bin/cli.ts:1591`) |
| `status` | `--json` | Environment status (AI, DB, deps, knowledge/signal stats). | `getAiConfigInfo` + `initContainer` (`bin/cli.ts:1632`) |
| `health` | `-d/--dir`, `--json` | Composite health report. | `initContainer` services (`bin/cli.ts:1725`) |
| `embed` | `-d/--dir`, `--force`, `--clear`, `--dry-run`, `--json`, `--validate` | Build/rebuild the semantic vector index. | `vectorService` / `indexingPipeline` (`bin/cli.ts:1841`) |
| `task list` | (none) | **Deprecated** stub — prints a notice only. | inline (`bin/cli.ts:1949`) |
| `sync` | `-d/--dir`, `--dry-run`, `--force` | Incremental sync of `recipes/`+`candidates/` markdown → DB. | `KnowledgeSyncService.syncAll` (`bin/cli.ts:1966`) |
| `list-warnings` | `-d/--dir`, `--status`, `--type`, `--json` | List knowledge warnings (contradiction/redundancy). | `warningRepository` (`bin/cli.ts:2049`) |
| `ghost [action]` | action `status`/`on`/`off`/`clean`/`list` (default `status`), `-d/--dir` | Manage Ghost mode (zero-intrusion external data). | `ProjectRegistry` (`bin/cli.ts:2729`) → 3.4.4 |

#### Notes on target resolution

Several commands take an optional `[target]` positional that is interpreted by
`projectTargetFromCli` (`bin/cli.ts:2519`): if `--project-root`/`--dir` is set it wins; a
bare `target` that starts with `.`/`/` or contains a path separator is treated as a
**path**, otherwise as a **projectId**. `optionalProjectTargetFromCli` (`bin/cli.ts:2541`)
returns `undefined` when nothing was supplied (used by `projects open-dashboard`). The
`--dev` variant uses a stricter `startDevDirFromCli` (`bin/cli.ts:2336`) that **rejects a
bare projectId** and demands a path, exiting with an error message.

Integer flags (`--wait`, `--port`, `--stop-wait`) are parsed by `parseCliInteger`
(`bin/cli.ts:2297`), which throws `Invalid <label>: <value>` on non-finite input.

### 3.3 The `start` command and dev server (host orchestration)

`start` (`bin/cli.ts:79`) has two modes:

- **Runtime mode (default):** computes `devMode = false`, then calls
  `new ProjectRuntimeControl().openDashboard(target, {...})` (`bin/cli.ts:107`). On success
  and when not `--json`/`--no-open`, it dynamically imports `open` and launches the browser
  at `result.handoff.dashboardUrl` (`bin/cli.ts:118`).
- **Dev mode:** triggered by any of `--dev`, `--api-only`, `--static-dashboard`
  (`bin/cli.ts:94`), delegating to `runDirectStartDevServer` (`bin/cli.ts:2359`).

`runDirectStartDevServer` is a substantial host-owned flow worth understanding:

1. Sets `ALEMBIC_API_SERVER=1` (a marker the CacheCoordinator uses to decide whether to
   poll) (`bin/cli.ts:2369`).
2. Resolves the project root from `--dir` → `ALEMBIC_CWD` → cwd, and exports `PORT`/`HOST`
   env vars (`bin/cli.ts:2372`).
3. Boots `HttpServer` (`lib/http/HttpServer.js`) via `initContainer`, wires
   `gateway.eventBus = container.get('eventBus')` (`bin/cli.ts:2387`), then
   `initialize()` + `start()`.
4. Kicks off `runUiStartupTasks` in the background (fire-and-forget) so the Dashboard first
   paint is not blocked (`bin/cli.ts:2397`).
5. If not `--api-only`, chooses a Dashboard source: `resolveDashboardSource`
   (`bin/cli.ts:2305`) prefers `../AlembicDashboard`, then `vendor/AlembicDashboard`. When a
   source with `node_modules` exists (and not `--static-dashboard`), it spawns the Vite dev
   server via `npm --prefix ... run dev` with `VITE_API_URL` set (`bin/cli.ts:2436`), and
   installs SIGINT/SIGTERM handlers to kill Vite. Otherwise it mounts the prebuilt
   `dashboard/dist` on the API server via `httpServer.mountDashboard` (`bin/cli.ts:2460`).
6. `EADDRINUSE` is caught and printed with a `lsof … | xargs kill -9` hint
   (`bin/cli.ts:2477`).

The daemon/`ProjectRuntimeControl` internals are covered in the daemon/runtime section of
this reference; here the CLI is only the argument-parsing + presentation layer
(`printProjectActionResult` at `bin/cli.ts:2551`, `printDaemonStatus` at `:2486`,
`printProjectsSnapshot` at `:2562`).

### 3.4 SetupService — workspace initialization

`lib/cli/SetupService.ts` is the class behind `alembic setup`. It performs a 5-step, mostly
idempotent workspace bootstrap and is host-owned scaffolding; the actual knowledge sync it
triggers is delegated to Core.

#### 3.4.1 Path/mode resolution (constructor)

The constructor (`SetupService.ts:109`) resolves all target paths **before** running any
step, and its ordering encodes an important precedence:

1. It first calls `resolveAlembicWorkspace(projectRoot)` (`SetupService.ts:130`). If a
   **native ProjectScope** is found (`.projectScope` present), it takes every path
   (`runtimeDir`, `databasePath`, `knowledgeDir`, `recipesDir`, `candidatesDir`,
   `skillsDir`, `dataRoot`) directly from that resolver and **returns early**
   (`SetupService.ts:131-142`). This is the multi-repo / space-membership path.
2. Otherwise it calls `assertNativeScopeBeforeMultiRepoInit` (`SetupService.ts:144`,
   defined at `:795`). This is a **guardrail**: if the directory *looks like a multi-repo
   checkout* — `looksLikeMultiRepoCheckout` (`SetupService.ts:807`) finds ≥2 immediate
   child dirs carrying a repo marker (`.git`, `package.json`, `pyproject.toml`,
   `Cargo.toml`, `go.mod`, `Package.swift`; ignoring `.asd/.git/dist/node_modules/vendor`)
   — it **throws** and instructs the user to run `project-scope add` per member first. This
   prevents setup from silently falling back to a single root or a `/tmp/alembic-dev`
   scratch dir.
3. Excluded-project protection: `isExcludedProject` (Core) is checked; if excluded and not
   Ghost, it throws and suggests running in a real project dir or using `--ghost`
   (`SetupService.ts:153-160`).
4. Mode selection: `--ghost`/its absence maps to a `WorkspaceMode` of `ghost`/`standard`/
   `null` (attach existing). It registers via `ProjectRegistry.setWorkspaceMode` or
   `ProjectRegistry.register` (`SetupService.ts:162-164`), then uses
   `WorkspaceResolver.fromProject` to compute all paths (`SetupService.ts:167-180`). In
   Ghost mode `subRepoPath` lives under the external `dataRoot`, otherwise under the
   project root (`SetupService.ts:178`).

#### 3.4.2 The five steps

`getSteps()` (`SetupService.ts:185`) returns the ordered list; `run()` (`SetupService.ts:197`)
executes each, printing `[i/total] label...` unless `quiet`, and collecting a per-step
`{ step, label, ok, error? }` result into `_results` (used by `printSummary` at `:243`).
Step failures are **non-fatal**: they are recorded and the loop continues.

| Step | Method | What it does |
|---|---|---|
| 1 | `stepRuntime` (`SetupService.ts:270`) | `mkdir` runtime dir; write `config.json` (version 2, projectName, `database: .asd/alembic.db`, `core.subRepoDir` [+`subRepoUrl`], `ai.provider` from `ALEMBIC_AI_PROVIDER` or `auto`, `guard.enabled`). Skips overwrite unless `--force`. |
| 2 | `stepCoreRepo` (`SetupService.ts:296`) | Create `Alembic/`, `recipes/`, `candidates/`, `skills/`. Handle the sub-repo (see 3.4.3). Write `constitution.yaml`, `boxspec.json`, copy `_template.md`, optional seed recipes, `README.md`, `.gitignore`. |
| 3 | `stepDatabase` (`SetupService.ts:565`) | Boot a temporary `AppRuntime` bound to this project, load `AppConfigLoader`, set `database.path`, `initialize()`, then sync markdown → DB. |
| 4 | `stepPlatform` (`SetupService.ts:642`) | **No-op** — returns `{ skipped: true }`. (Xcode-snippet init was removed in the AI-first migration; the doc comment header still lists it, but the code is a stub.) |
| 5 | `stepVectorIndex` (`SetupService.ts:739`) | Best-effort vector index build; never blocks setup. |

**Step 3 detail (`stepDatabase`):** it snapshots and restores process state around the
work — `process.cwd()`, `ALEMBIC_PROJECT_DIR`, `ALEMBIC_QUIET` — chdir'ing into the project
and always restoring in a `finally` (`SetupService.ts:569-617`). It calls
`AppRuntime.configurePathGuard(projectRoot, knowledgeBaseDir)` (`SetupService.ts:583`) to
fence writes, then boots `AppRuntime`, gets the DB handle, and calls the private
`_syncRecipesToDB` (`SetupService.ts:624`). That method **delegates to Core**: it constructs
`new KnowledgeSyncService(syncRoot)` from `@alembic/core/knowledge` and calls `.sync(db,
{ skipViolations: true })` (`SetupService.ts:625-630`). It also resets the static
`ConfigLoader.config = null` afterward (`SetupService.ts:603`).

**Step 5 detail (`stepVectorIndex`):** it fetches the container from
`getServiceContainer()` and short-circuits with a `skipped` result if
`vectorService` is unregistered, the embedding provider is unavailable, or an index already
exists (unless `--force`); otherwise it calls `vectorService.fullBuild({ force })`. All
errors are swallowed into a `warning` status so setup completes
(`SetupService.ts:739-790`).

#### 3.4.3 Sub-repo handling (`--repo`)

`stepCoreRepo` (`SetupService.ts:305`) branches on `subRepoUrl`:

- If already a git repo → `_ensureRemote(url)` (idempotent set/add origin,
  `SetupService.ts:675`).
- If the dir has files but isn't a repo → `_cloneWithMerge(url)` (`SetupService.ts:691`):
  rename existing dir to a timestamped backup, `git clone`, copy back any non-conflicting
  files, then remove the backup. On clone failure it restores the backup and rethrows.
- If empty → `rmdir` then `git clone` directly (`SetupService.ts:314-320`).
- If **no** `subRepoUrl` → `recipes/` stays a plain directory committed with the main repo;
  no `git init` runs (`SetupService.ts:322`).

After templates are written, a freshly-cloned repo gets a `git add . && git commit -m "Add
Alembic template files"` if the working tree is dirty (`SetupService.ts:350-360`). The
private `_git` helper (`SetupService.ts:649`) swallows the "nothing to commit" exit-1 for
`commit` and rethrows everything else.

The `alembic remote <url>` command (`bin/cli.ts:582`) is a **separate**, later flow to
convert an already-created `recipes/` dir into a standalone repo; it validates the URL with
a regex (`bin/cli.ts:601`) and updates `.asd/config.json` `core.subRepoUrl` via the
top-level `_updateConfigUrl` helper (`bin/cli.ts:654`).

#### 3.4.4 Ghost mode

Ghost mode = "zero project intrusion; all data externalized to `~/.asd/workspaces/<id>/`"
(documented at `bin/cli.ts:133`). Two surfaces manage it:

- `setup --ghost` selects the mode at construction time (3.4.1).
- The `ghost [action]` command (`bin/cli.ts:2723`) is a small state machine over
  `ProjectRegistry`:
  - `status`: report registered/ghost/standard + workspace dir + project id.
  - `on`: `setWorkspaceMode(root,'ghost')`, mkdir workspace, then `moveDir` the project's
    `.asd/` and `Alembic/` into the external workspace (rename, falling back to
    copy+delete across volumes) (`bin/cli.ts:2765-2804`).
  - `off`: reverse migration back into the project, `setWorkspaceMode(root,'standard')`,
    and remove the emptied external dir (`bin/cli.ts:2807-2851`).
  - `list`: enumerate all registered projects with mode markers.
  - `clean`: print the external dir path and ask the user to delete it manually (does **not**
    delete) (`bin/cli.ts:2867`).

`ProjectRegistry`, `WorkspaceResolver`, `getGhostWorkspaceDir`, and `DEFAULT_FOLDER_NAMES`
all come from `@alembic/core/workspace` — the registry/resolver logic is Core-owned; the CLI
only orchestrates directory moves and messaging.

### 3.5 AiScanService — the `ais` live scan

`lib/cli/AiScanService.ts` implements `alembic ais [target]`: file-granular scanning that
extracts Recipes via an agent run and auto-publishes them (PENDING → ACTIVE) without a
Dashboard review step. Its class-doc explicitly notes it "can run standalone in the CLI,
detached from MCP" (`AiScanService.ts:8`).

#### 3.5.1 Control flow of `scan()` (`AiScanService.ts:58`)

1. **Gate on AI availability.** It fetches `agentService` and `systemRunContextFactory`
   from the container, then calls `getAiRuntimeStatus(this.container)` and, if `!ready`,
   throws `getAiUnavailableMessage(aiStatus)` (`AiScanService.ts:64-72`). Any failure here
   is rewrapped as `AI Provider 不可用: … 请在 Alembic Dashboard 的 AI Settings 中配置 API
   Key` (`AiScanService.ts:73-77`). This gating is the crux — see 3.5.3.
2. **Collect files** via `_collectFiles(targetName, maxFiles)` (`AiScanService.ts:80`). If
   empty, it records an error and returns early (`AiScanService.ts:81-86`).
3. **Per-file extraction.** For each file (`AiScanService.ts:98`): read content, skip files
   `< 10` lines (`:104`), truncate files `> 500` lines to the first 500 with a
   `// ... (truncated)` marker (`:110`), then call `runScanAgentTask({ agentService,
   systemRunContextFactory, label, files, task: 'extract' })` (`AiScanService.ts:121`) — an
   `@alembic/agent/service` export. The returned `recipes` array is the agent's structured
   output.
4. **Filter + publish.** Each recipe must have `content.pattern` of length ≥ 20, else
   skipped (`AiScanService.ts:139`). In `--dry-run` it just increments `published` without
   writing (`:143`). Otherwise it stamps `source='ai-scan'`, adds `ai-scan` + target-name
   tags, sets `moduleName`, back-fills `aiInsight` from `description`
   (`AiScanService.ts:150-157`), then calls `knowledgeService.create(recipe, { userId:
   'ai-scan' })` followed immediately by `knowledgeService.publish(saved.id, ...)`
   (`AiScanService.ts:159-162`). Per-recipe publish failures are collected into
   `report.errors` and do not abort the loop.
5. Returns `{ published, files, errors, skipped }`.

Note (`AiScanService.ts:153`): `sourceFile` is intentionally **not** set on the recipe;
`KnowledgeFileWriter` assigns it to the persisted `.md` path when writing.

#### 3.5.2 File collection (`_collectFiles`, `AiScanService.ts:178`)

Primary path uses `ModuleService` (the host multi-language module facade) —
`service.load()`, `listTargets()`, filter by name (case-insensitive), then
`getTargetFiles(t)` per target, dedup by absolute path via a `seenPaths` set, capped at
`maxFiles` (`AiScanService.ts:184-233`). If `ModuleService` construction or listing throws,
it logs a warning and falls back to a **directory walk** of `Sources/`, `src/`, `lib/`
(`AiScanService.ts:234-246`). The recursive `_walkDir` (`AiScanService.ts:252`) uses
`LanguageService.sourceExts` and `LanguageService.scanSkipDirs` from `@alembic/core/shared`
to decide which files/dirs to include, skipping dot-entries.

#### 3.5.3 AI gating (host-owned availability semantics)

The gate lives in `lib/injection/AiRuntimeStatus.ts`. `getAiRuntimeStatus(container)`
(`AiRuntimeStatus.ts:33`) inspects `container.singletons._aiProviderManager` and
`.aiProvider`, and returns an `AiRuntimeStatus`:

- If the provider name is `mock` or `manager.isMock === true` → `ready:false`,
  `reason:'mock-provider-disabled'` (`AiRuntimeStatus.ts:41`). The product runtime
  deliberately no longer represents "unconfigured AI" with a mock provider — a mock is an
  explicit unavailable state (`AiRuntimeStatus.ts:2-8`).
- Otherwise `ready = Boolean(provider && manager && manager.isReady === true)`; if false,
  `reason:'not-configured'` (`AiRuntimeStatus.ts:50`).

`getAiUnavailableMessage` (`AiRuntimeStatus.ts:59`) maps those reasons to Chinese
user-facing messages. This same helper is imported by `AiScanService`; it is the host's
single choke-point that stops CLI flows before constructing agent work against a missing or
fake provider.

`evolve-check` uses a parallel guard: it fetches `agentService` and errors with
`AgentService not available (需要配置 AI Provider)` if absent (`bin/cli.ts:1116`).

### 3.6 AI configure / status flow

The `ai` command group (`bin/cli.ts:152`) manages workspace AI configuration. All storage
is delegated to Core's `WorkspaceSettingsStore` (`@alembic/core/shared`); the CLI owns only
argument marshaling and display.

**`ai status`** → `buildAiConfigStatus(projectRoot)` (`bin/cli.ts:2155`):

1. `WorkspaceSettingsStore.fromProject(root).readAiConfig()` → persisted config.
2. `collectAiEnvOverrides(workspaceConfig.env, process.env)` → only the env vars
   **explicitly set** in the process (Core helper).
3. `effectiveEnv = { ...workspaceConfig.env, ...processConfig }` — process env wins.
4. Reports `ok: isAiEnvReady(effectiveEnv)`, a `source` of `process-env` /
   `workspace-settings` / `empty`, provider/model/embed fields, masked vars via
   `maskAiEnvConfig`, and the settings/secrets file paths + existence flags
   (`bin/cli.ts:2166-2182`). Rendered by `printAiConfigStatus` (`bin/cli.ts:2222`).

**`ai configure`** → `buildAiConfigUpdates(opts)` (`bin/cli.ts:2185`):

- Maps generic flags to env keys (`--provider` → `ALEMBIC_AI_PROVIDER`, `--model`,
  `--proxy`, `--reasoning-effort`, `--embed-*`) plus the four per-provider key flags
  (`--google-key`/`--openai-key`/`--claude-key`/`--deepseek-key`).
- The generic `--key`/`--key-stdin` resolves a secret (inline or piped stdin via
  `resolveSecretOption`/`readAllStdin`, `bin/cli.ts:2271`/`:2288`) and requires `--provider`;
  it then looks up the env var name in Core's `PROVIDER_KEY_ENV` map
  (`google/openai/claude/deepseek` — `WorkspaceSettingsStore.ts:23`). A provider without a
  managed key (e.g. `ollama`, which *is* an accepted `--provider` value per the flag help
  at `bin/cli.ts:170` but has **no** entry in `PROVIDER_KEY_ENV`) errors with `Provider
  "…" does not use an API key managed by Alembic` (`bin/cli.ts:2206-2210`).
- `--embed-key`/`--embed-key-stdin` maps to `ALEMBIC_EMBED_API_KEY` (`bin/cli.ts:2214`).
- If **no** fields were supplied, the handler errors and exits 1 (`bin/cli.ts:189`).
  Otherwise `store.writeAiConfig(updates)` persists, and it re-reads + prints status.

`stdin` handling is careful: `resolveSecretOption` refuses to hang on a TTY, telling the
user to pipe the secret (`bin/cli.ts:2279-2284`).

`ai import-env` (`bin/cli.ts:205`) is a convenience that pulls `collectAiEnv(process.env)`
(only explicitly-set `ALEMBIC_*` vars) into the store, erroring if none are present.

Note the two config readers used elsewhere differ in origin: `status`/`health` read
`getAiConfigInfo()` from `@alembic/agent/ai` (`bin/cli.ts:1637`, `:1728`), whereas
`ai status`/`configure` use Core's `WorkspaceSettingsStore`. These are distinct code paths.

### 3.7 CliLogger

`lib/cli/CliLogger.ts` is a tiny stdout/stderr wrapper exported as a singleton `cli` (and
default) (`CliLogger.ts:85`). Rationale (from its header): replace raw `console.*`,
separate stdout/stderr channels, support a `quiet` mode, and stay compliant with the
`js-no-console-log` Guard rule.

| Method | Channel | Quiet-suppressed? | Notes |
|---|---|---|---|
| `log` / `info` / `success` | stdout | yes | plain line output (`CliLogger.ts:32`,`:39`,`:46`) |
| `json` | stdout | **no** — always emits | `JSON.stringify(obj, null, 2)` (`CliLogger.ts:53`) |
| `blank` | stdout | yes | empty line (`CliLogger.ts:58`) |
| `error` / `warn` | stderr | no (always emit) | (`CliLogger.ts:67`,`:72`) |
| `debug` | stderr | gated on `ALEMBIC_DEBUG=1` | (`CliLogger.ts:77`) |

The `quiet` accessor is a private-field boolean (`#quiet`, `CliLogger.ts:18-27`); `json`
deliberately bypasses it so `--json` output is never lost.

### 3.8 Notable algorithms, gotchas & edge cases

- **`coldstart`/`rescan` async-fill polling.** Both call `runProjectIndexWorkflow` (skeleton
  phase), then, under `--wait`, **poll** `container.get('bootstrapTaskManager')
  .getSessionStatus()` every 1s in an **unbounded** loop (`maxAttempts = Infinity`,
  `bin/cli.ts:788`, `:941`) until `done >= total`, updating an `ora` spinner. The comment
  justifies no timeout: cold-start/rescan is inherently long. Without `--wait`, the
  skeleton completes and the process exits, printing a "next steps" hint
  (`bin/cli.ts:840`).
- **Workflow result shape.** The workflow may return a string or object; handlers normalize
  via `const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; const result =
  parsed?.data || parsed;` (`bin/cli.ts:716`, `:899`).
- **Clean-exit flush.** `coldstart`/`rescan` explicitly wait for stdout `drain` and a 50ms
  timeout before `process.exit(0)` to avoid truncating piped output
  (`bin/cli.ts:850-854`, `:992-995`).
- **Guard CI exit codes.** `guard:ci` collects files itself (walking, skipping a fixed
  `SKIP_DIRS` set incl. `.asd/.next/.workspace-*`, `bin/cli.ts:1392`) and gates purely on
  `GuardCheckEngine` signals — the old compliance/quality-score reporter was retired
  (`bin/cli.ts:1386-1388`, `:1514`). Exit codes: `0` pass, `1` any error, `3` coverage below
  `--min-coverage`, `2` warnings/uncertain over threshold (`bin/cli.ts:1520-1529`).
  `guard:staged` derives files from `git diff --cached` (`bin/cli.ts:1552`) and exits 1 only
  on errors.
- **`sync` double config load.** `sync` loads `AppConfigLoader` and sets `database.path`
  before `initContainer` (`bin/cli.ts:1972-1975`) — `initContainer` also boots
  `AppRuntime`; this is a redundant-looking but harmless pre-seed of the DB path.
- **`task list` is a deprecated stub** — the Task DB subsystem was removed; it only prints a
  redirect notice (`bin/cli.ts:1946-1952`).
- **`evolve-check` file walk uses a naive recursive `readdirSync`** (skipping dot-dirs and
  `node_modules`) purely to produce a `fileCount`; the actual Recipe validation is the
  agent's job (`bin/cli.ts:1027-1047`). It passes `projectOverview.primaryLang: 'unknown'`
  and empty `modules` (`bin/cli.ts:1133`), i.e. it does not itself compute project context.
- **Post-audit proposal execution.** After the agent audit, `evolve-check` runs
  `proposalExecutor.checkAndExecute()` if that service exists, printing executed/rejected/
  expired counts (`bin/cli.ts:1159-1175`).
- **`--json` masking.** Secrets are never printed raw: status output runs through
  `maskAiEnvConfig` (Core) before display (`bin/cli.ts:2174`).

### 3.9 External interfaces summary

- **CLI commands:** the full set enumerated in 3.2 (the externally reachable entrypoints of
  this subsystem).
- **Emitted process signals / env:** `runDirectStartDevServer` sets `ALEMBIC_API_SERVER`,
  `PORT`, `HOST`, `VITE_API_URL` and handles `SIGINT`/`SIGTERM`; `stepDatabase` temporarily
  sets `ALEMBIC_PROJECT_DIR`/`ALEMBIC_QUIET`.
- **Exit codes:** `guard`/`guard:ci`/`guard:staged` carry meaningful non-zero exit codes
  (3.8); most commands exit 1 on error via the process-level handlers or explicit
  `process.exit(1)`.
- **Files written:** `setup` creates `.asd/config.json`, `Alembic/{constitution.yaml,
  boxspec.json,README.md}`, `recipes/{_template.md,.gitignore, seed-*}`; `remote`/`setup`
  update `core.subRepoUrl`; `ai configure`/`import-env` write the workspace
  settings/secrets files (paths owned by `WorkspaceSettingsStore`).
- **No HTTP routes / DB tables are defined here** — the CLI *consumes* the DB through Core
  repositories/services via the container and *starts* the HTTP server (routes live in
  `lib/http/**`, tables in Core).

### 3.10 Boundary note — host-owned vs delegated

**Host-owned (this repo):**

- All argument parsing, command registration, and process lifecycle (`bin/cli.ts`).
- Output formatting and channel separation (`lib/cli/CliLogger.ts`, and the many
  `print*`/`format*` helpers in `bin/cli.ts`).
- Workspace scaffolding orchestration: directory creation, `config.json`/`boxspec.json`/
  `README`/template writing, sub-repo git orchestration, Ghost-mode directory migration
  (`lib/cli/SetupService.ts`, `ghost` command).
- The AI-availability gate and its user-facing messaging
  (`lib/injection/AiRuntimeStatus.ts`).
- `ais` scan orchestration — file collection, truncation policy, per-file loop, tag/metadata
  stamping, create+publish sequencing (`lib/cli/AiScanService.ts`).
- Dev-server launch, Vite spawning, Dashboard source resolution, HTTP server startup
  (`runDirectStartDevServer`, `resolveDashboardSource`).
- `ProjectScopeRegistryStore` / `resolveAlembicWorkspace` / `summarizeProjectScope` are in
  this repo's `lib/project-scope/` (host-owned) even though ProjectScope *concepts* pair
  with Core's registry/resolver.

**Delegated to `@alembic/core` (imported, not implemented here):**

- `WorkspaceSettingsStore`, `collectAiEnv`, `collectAiEnvOverrides`, `isAiEnvReady`,
  `maskAiEnvConfig`, `PROVIDER_KEY_ENV` — all AI-config storage/env logic
  (`@alembic/core/shared`, defined in `AlembicCore/src/shared/WorkspaceSettingsStore.ts`).
- `ProjectRegistry`, `WorkspaceResolver`, `getGhostWorkspaceDir`, `DEFAULT_*` names, git
  helpers (`resolveSubRepoPath`, `isGitRepo`), `isExcludedProject`
  (`@alembic/core/workspace`, `/shared`).
- `KnowledgeSyncService` (markdown → DB sync), `detectLanguage`, `LanguageService`
  (`@alembic/core/knowledge`, `/guard`, `/shared`).
- `getAiConfigInfo` used by `status`/`health` (`@alembic/agent/ai`, in
  `AlembicAgent/src/ai/AiFactory.ts`).
- The runtime services obtained via `container.get(...)`: `searchEngine`,
  `guardCheckEngine`, `knowledgeService`, `vectorService`, `indexingPipeline`,
  `bootstrapTaskManager`, `proposalExecutor`, `signalBus`, `warningRepository` — these are
  Core-backed engine capabilities wired by the host DI container.

**Delegated to `@alembic/agent` (imported, not implemented here):**

- `AgentService`, `SystemRunContextFactory`, `runScanAgentTask` (used by `ais`), and
  `runEvolutionAudit` (used by `evolve-check`) — all from `@alembic/agent/service`, backed
  by agent runs under `AlembicAgent/src/agent/runs/**` (`scan/ScanAgentRun`,
  `evolution/EvolutionAgentRun`). The CLI supplies inputs and renders results; the actual
  LLM/tool orchestration is the agent runtime's.

**Shared workflow (host repo, but pipeline-shaped):** `runProjectIndexWorkflow`
(`lib/workflows/project-index/ProjectIndexWorkflow.js`) is implemented in *this* repo and is
the unified orchestration pipeline that `coldstart`/`rescan` drive (mode `full` /
`incremental`). It composes Core capabilities but the orchestration entrypoint is
host-owned.


---


## 04. Daemon, Job Runner & Runtime Control

This section documents `Alembic/lib/daemon/**` plus its two entrypoints
`Alembic/bin/daemon-server.ts` and the HTTP routes that drive it. This is the
**host layer's background brain**: it owns the per-project daemon process
lifecycle, the async job queue that runs Recipe generation workflows
(bootstrap / rescan / deep-mining / module-mining), the plan-selection and
round gates that bound those workflows, per-project runtime multiplexing, and
the process-event / display-snapshot observability plumbing.

Almost all of the deep "organism" logic that these files invoke lives in
`@alembic/core` (JobStore, coverage-ledger repository, plan-selection math,
`adviseCoverageLedger`, daemon-state contract) or `@alembic/agent`
(`runPlanAgent`, `runModuleMining`, `AgentService`). The daemon layer is
orchestration, wiring, persistence-of-runtime-state, and observability — see
the **Boundary note** at the end for the precise split.

---

### 04.1 Responsibilities & role in the system

| Concern | Owner file(s) | What it does |
|---|---|---|
| Daemon process lifecycle (spawn / stop / status / health / lock) | `DaemonSupervisor.ts` | Starts `dist/bin/daemon-server.js` detached, verifies health identity, tears it down |
| Daemon server bootstrap | `bin/daemon-server.ts` | The actual long-lived process: HTTP server, file-monitor collector, evolution sweep, ready-state write |
| Async job queue + execution | `DaemonJobRunner.ts` | Create/enqueue/run/cancel jobs; bootstrap-session bridging; failure recording |
| Job-service resolution (DI + fallbacks) | `DaemonJobServices.ts` | Resolve `jobStore` / recorder / snapshot-store from the container or lazy fallbacks |
| Arg normalization + helpers | `DaemonJobWorkflowHelpers.ts` | Coerce/validate request args; envelope unwrap; recipe-count extraction |
| Shared job/workflow types | `DaemonJobWorkflowTypes.ts` | `DaemonJobOptions`, `RunDaemonJobOptions`, `DaemonRescanWorkflowArgs`, etc. |
| Plan-selection gate | `PlanSelectionGate.ts` | Run the plan Agent, apply Core stage constraints, project a budget before generation |
| Deep-mining round loop + gate | `DeepMiningRoundGate.ts` | Iterate rounds under `adviseCoverageLedger`, open/close round rows, build `coverageLedgerSeed` |
| Module-mining selection + workflow | `ModuleMiningSelection.ts`, `ModuleMiningWorkflow.ts` | Pick ProjectMap modules, run `runModuleMining`, reconcile reported-vs-persisted recipes |
| Per-project runtime multiplexer | `ProjectRuntimeControl.ts` | Which project's daemon is "active"; start/stop/switch/open-dashboard; state cleanup |
| Runtime source-of-truth builder | `ProjectRuntimeSourceOfTruth.ts` | Pure functions producing the read-only runtime SoT envelope + diagnostics |
| Runtime boundary descriptor | `RuntimeBoundary.ts` | Static capability/ownership descriptor exposed via health |
| Process-event recorder | `JobProcessEventRecorder.ts` | In-memory ring buffer of job process events, developer-view broadcast |
| Process-event text artifacts | `JobProcessEventArtifacts.ts` | Materialize large text/LLM-IO events to `.asd/job-artifacts/**` with path-escape guards |
| Display snapshot store | `JobDisplaySnapshotStore.ts` | Durable per-job display snapshot (`.asd/job-display-snapshots/**`) for the Dashboard/API |
| PCV N9 observability linkage | `PcvObservabilityLinkage.ts` | Stitch artifact/trace/metrics/source-ref evidence onto Agent process events |
| File-monitor status model | `FileMonitorStatus.ts` | Runtime-state factory/type for the daemon's file watcher |

---

### 04.2 DaemonSupervisor — per-project daemon lifecycle

`DaemonSupervisor` (`lib/daemon/DaemonSupervisor.ts:55`) is a stateless
controller over one project's daemon process. Paths are resolved by
`resolveAlembicDaemonPaths(projectRoot)` (`DaemonSupervisor.ts:58`), and all
daemon-state read/write goes through the `@alembic/core/daemon` contract
(`readDaemonState`, `removeDaemonState`, `ensureDaemonDirs`,
`getPackageVersion`), imported at `DaemonSupervisor.ts:13-20`.

#### Public API

| Method | Anchor | Behavior |
|---|---|---|
| `status(projectRoot)` | `:56` | Classifies daemon into `ready` / `starting` / `stopped` / `stale` / `failed` |
| `start(options)` | `:114` | Idempotent start under a lock; spawns the server; waits for readiness |
| `stop(options)` | `:193` | SIGTERM→SIGKILL the pid, then `removeDaemonState` |
| `ensure(options)` | `:206` | `status`, else `start` |

`DaemonStatusKind` (`:24`) and `DaemonStatus` (`:26`) are the return shape;
`StartDaemonOptions` / `StopDaemonOptions` at `:42` / `:50`.

#### Status classification (`status`, `:56`)

Ordered checks — the first that matches wins:

1. No state file → `stopped` (`:62`).
2. State exists but pid not alive (`isProcessAlive`, `:319`) → `stale` (`:74`).
3. `isDaemonRuntimeOlderThanCurrentBuild(state)` (`:341`): if
   `dist/bin/daemon-server.js` mtime is newer than `state.startedAt + 1000ms`,
   the running daemon predates the current build → `stale` (`:86`). This forces
   a restart after `npm run build` even though the process is alive.
4. `fetchDaemonHealth(state)` (`:354`): `GET {state.url}/api/v1/daemon/health`
   with a 1s abort timeout. `isMatchingHealth` (`:372`) requires
   `success===true` **and** an exact match on `projectRoot`, `dataRoot`,
   `projectId`, `version` (=`getPackageVersion()`), `databasePath`,
   `schemaMigrationVersion`, and `mode==='daemon'`. Any mismatch → `stale`
   (`:103`) even though the pid is alive — this is the identity guard that
   prevents handing off to a daemon serving a different project/schema.

#### Start (`start`, `:114`) — control flow

1. `ensureDaemonDirs(paths)` then a fast-path: if already `ready` and not
   `restart`, return immediately (`:119-122`).
2. Enter `#withLock` (`:214`) with a default 10s budget.
3. Re-check status inside the lock (double-checked locking, `:125`).
4. If a stale-but-alive pid exists, `#terminateProcess(pid, 5000)` (`:131`);
   then `removeDaemonState(paths, { includeLock: false })` (`:133`).
5. Resolve entry `dist/bin/daemon-server.js` via
   `getDaemonServerEntryPath()` (`:337`, joins `PACKAGE_ROOT`). If missing,
   throw "Run npm run build first" (`:139`).
6. `spawn(process.execPath, [entry], { detached: true, ... })` with env
   (`:143-157`): `ALEMBIC_API_SERVER=1`, `ALEMBIC_DAEMON_MODE=1`,
   `ALEMBIC_DAEMON_HOST/PORT`, `ALEMBIC_DAEMON_STATE_PATH`,
   `ALEMBIC_PROJECT_DIR`, `ALEMBIC_QUIET`. stdio is `['ignore', logFd, logFd]`
   (both stdout+stderr → `paths.logPath`), `child.unref()` (`:159`).
   **Port 0 is the default** (`:135`) → the OS assigns a free port; the daemon
   later writes its bound port into daemon-state.
7. Write pid file with mode `0o600` (`:162`).
8. `waitForReady(paths, waitMs)` (`:300`) polls `supervisor.status` every 200ms.
   On timeout: if child died → `failed` (`:169`); else `starting` (`:179`).

#### Locking (`#withLock`, `:214`)

Lock is a directory `mkdirSync(paths.lockDir, { mode: 0o700 })` — atomic
create. On `EEXIST` it re-checks readiness (another starter may already have
succeeded, `:229`), and after the wait budget expires it treats a lock older
than 30s as stale (`isStaleLock`, `:328`) and force-removes it. Backoff is
exponential-capped by `computeDaemonLockBackoffMs` (exported, `:313`):
`min(100 * 2^min(attempt,4), 1000)` ms. The lock dir is always removed in a
`finally` (`:247`).

#### Termination (`#terminateProcess`, `:251`)

`SIGTERM`, poll `isProcessAlive` every 100ms up to `waitMs`, then `SIGKILL`.
All kill calls are wrapped so an already-dead pid is a no-op.

---

### 04.3 The daemon server process (`bin/daemon-server.ts`)

This is what `DaemonSupervisor.start` spawns. It sets
`ALEMBIC_API_SERVER=1` / `ALEMBIC_DAEMON_MODE=1` at module top
(`daemon-server.ts:3-4`) and installs `shutdown` (`:34`) plus
uncaught-exception/unhandled-rejection guards that `process.exit(1)`
(`:38-48`).

`main()` (`:50`) sequence:

1. Resolve `projectRoot` from `ALEMBIC_PROJECT_DIR`, host, port, token
   (`randomBytes(32)` if not provided, `:58`), and `statePath`.
2. `process.chdir(projectRoot)` if needed (`:67`),
   `AppRuntime.configurePathGuard(projectRoot)` (`:71`).
3. Initialize `AppRuntime` and the DI `ServiceContainer` (`:73-85`).
4. **`markInterruptedDaemonJobs({ code: 'DAEMON_RESTARTED', ... })`** (`:87`) —
   on every boot, any job still `queued`/`running` from a prior process is
   force-failed (see 04.5). This is the crash-recovery hook.
5. Wire the gateway's `eventBus` (`:95`).
6. Start the HTTP server (`startHttpServer`, `:271` — tries the requested port,
   falls back to `0`/ephemeral on `EADDRINUSE`), the
   `DaemonFileChangeCollector` (`startDaemonFileChangeCollector`, `:179`; can be
   disabled with `ALEMBIC_DAEMON_FILE_CHANGES=0`), and the
   `EvolutionMaintenanceSweep` (`startEvolutionMaintenanceSweep`, `:206`;
   disabled with `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP=0`).
7. `mountDashboardIfAvailable` (`:290`) mounts `dashboard/dist` if present.
8. `verifyHttpServerReady` (`:314`) hits `/api/v1/daemon/health` (1s timeout).
9. `writeReadyDaemonState` (`:239`) persists the full identity record via
   `writeDaemonState` (Core), including the **actual bound port**, url,
   dashboardUrl, token, version, schema-migration version. This is the file
   `DaemonSupervisor.status` reads back.
10. Register shutdown handlers (`:150-176`) that remove state+pid files, shut
    down `AppRuntime`, stop the HTTP server, dispose the timer registry, stop
    the file-change collector and evolution sweep, and — critically —
    **`markInterruptedDaemonJobs({ code: 'DAEMON_SHUTDOWN', ... })`** (`:170`).

> Note: `DaemonFileChangeCollector` and `EvolutionMaintenanceSweep` are
> started here but live under `lib/service/evolution/**` (outside this
> section's file set); this section covers only their status models and wiring.

---

### 04.4 Job model & execution (`DaemonJobRunner.ts`)

The runner turns an enqueue request into a `DaemonJobRecord` and drives it
through an AI workflow, recording process events and refreshing the display
snapshot at each transition. The `JobStore` (`@alembic/core/daemon`) is the
durable store; the runner never persists job rows itself.

#### Job kinds & generation stages

`DaemonJobKind` comes from Core (`ALEMBIC_JOB_KINDS`, re-exported via
`RuntimeBoundary.ts:19,23`). The kinds observed in wiring are **`bootstrap`**
and **`rescan`** (HTTP routes enqueue only these — `jobs.ts:262,287`;
`DashboardOperations.ts:216,272`). Within a `rescan` job, the
**`generationStage`** arg selects the sub-workflow (`executeApiAiWorkflow`,
`:871`):

| `kind` / `generationStage` | Dispatch (`executeApiAiWorkflow`) | Workflow entry |
|---|---|---|
| `bootstrap` | `:872` | `runBootstrapPlanGate` → `runProjectIndexWorkflow(..., { mode: 'full' })` |
| `rescan` + `deepMining` | `:895` | `runDeepMiningRounds` (round loop) |
| `rescan` + `moduleMining` | `:898` | `runModuleMiningWorkflow` |
| `rescan` (default/incremental) | `:902` | `runProjectIndexWorkflow(..., { mode: 'incremental' })` |

`generationStageArg` (`DaemonJobWorkflowHelpers.ts:164`) only accepts
`coldStart` / `deepMining` / `moduleMining`. `ProjectIndexWorkflow` is imported
dynamically (`:874`, `:902`) to keep the daemon-runner module light.

#### Lifecycle entrypoints (exported)

| Function | Anchor | Purpose |
|---|---|---|
| `createDaemonJob(options)` | `:67` | `store.create({ kind, request, source })` — no execution |
| `enqueueDaemonJob(options)` | `:76` | Create + emit `reset`/`queued` events + `queueMicrotask(runDaemonJob)` |
| `runDaemonJob(options)` | `:129` | Mark running, execute workflow, complete/fail, record events |
| `recordDaemonJobAsyncFailure(options)` | `:295` | Fail a job that threw after `queueMicrotask` scheduling |
| `cancelDaemonJob(options)` | `:336` | Cancel; abort a linked bootstrap session if any |
| `markInterruptedDaemonJobs(options)` | `:577` | Bulk-fail active jobs on daemon restart/shutdown |

`enqueueDaemonJob` (`:76`) is fire-and-forget: it schedules
`runDaemonJob` on a microtask and, if that promise rejects, calls
`recordDaemonJobAsyncFailure` (`:117`). This is why `runDaemonJob` is *also*
called synchronously (awaited) by `DashboardOperations` — both an async
(HTTP `POST /jobs/...`) and a sync (dashboard adapter) caller exist.

#### `runDaemonJob` control flow (`:129`)

1. Resolve `store` + `recorder` (`:130-131`).
2. For `bootstrap`, attach a **bootstrap process-event bridge**
   (`attachBootstrapProcessEventBridge`, `:624`) that subscribes to the
   container `eventBus`'s `bootstrap:*` events and converts them into job
   process events (dimension started/completed/failed, session summary). The
   bridge is cleaned up in `finally` unless `keepBootstrapBridge` is set
   (`:288-292`).
3. `store.markRunning(jobId)` (`:142`) — if not found, throw.
4. Emit a `running` workflow event + `refreshJobDisplaySnapshot` (`:148-165`).
5. `await executeApiAiWorkflow(options)` (`:173`).
6. **Bootstrap-session linking** (`:174-214`): if the result carries a
   `bootstrapSession.id` (`extractBootstrapSessionId`, `:1106`) *and* the
   session is still `running` (`isBootstrapSessionRunning`, `:1115`, checks the
   `bootstrapTaskManager` service), the job is left `running`, linked via
   `store.update(..., { bootstrapSessionId, status: 'running' })`, and
   `linkBootstrapSessionCompletion` (`:914`) subscribes to
   `bootstrap:all-completed` to finalize later. The bridge is kept alive.
7. Otherwise `store.complete(jobId, result, { bootstrapSessionId })` (`:216`),
   emit `artifact` + `summary(success)` events, refresh snapshot.
8. On throw: `store.fail(jobId, err)` (`:263`), emit an `error` event, refresh
   snapshot, rethrow (`:287`).

`finalizeBootstrapJobFromSession` (`:982`) classifies the terminal session
(`classifyBootstrapSessionForJob`, `:1085`: `aborted`→`cancelled`,
`failed`/`completed_with_errors`→`failed`, else `completed`) and writes the
matching terminal status with the `finalSession` payload folded into the
result.

#### Cancellation (`cancelDaemonJob`, `:336`)

If the job is tied to a live `bootstrapTaskManager` session
(`status.id === bootstrapSessionId`, `:365`), it calls `abortSession(reason)`
(or `markCancelled()` if not running) and finalizes from the session.
Otherwise `store.cancel(jobId, reason)` (`:387`) and, for `rescan` jobs,
`cleanupCancelledRescanJob` (`:414`) which:

- Releases the ProjectContext workflow-session lease
  (`releaseProjectContextWorkflowSessionByProjectRoot`, `:438`).
- **`closeCancelledDeepMiningRounds`** (`:467`): for any open coverage-ledger
  round whose `rescanId` starts with `${jobId}:deepMining:`
  (`isOpenRoundForJob`, `:559`), it `upsertRound({ completedAt, ... })` to
  close the row with 0 new recipes. This prevents an open, never-closing round
  from wedging the advisor on the next run.

#### Interrupt recovery (`markInterruptedDaemonJobs`, `:577`)

Delegates to `store.markActiveInterrupted({ code, reason })`, logs the failed
job ids. Called on daemon boot and shutdown (04.3) so no job is left "running"
across process death.

---

### 04.5 Service resolution & fallbacks (`DaemonJobServices.ts`)

All three job services are resolved from the DI container with a **lazy
fallback** if the singleton isn't registered:

| Getter | Anchor | Container key | Fallback |
|---|---|---|---|
| `getJobStore` | `:51` | `jobStore` | `new JobStore({ projectRoot: resolver.dataRoot })` |
| `getJobProcessEventRecorder` | `:60` | `jobProcessEventRecorder` | shared lazy `JobProcessEventRecorder` |
| `getJobDisplaySnapshotStore` | `:68` | `jobDisplaySnapshotStore` | per-dataRoot lazy `JobDisplaySnapshotStore` |

The `DaemonJobFallbacks` class (`:14`) holds a single lazily-constructed
recorder and a `dataRoot → JobDisplaySnapshotStore` map. The comment at
`:8-13` explains this is deliberately lazy (the recorder is *not* built at
import time) and disposable via `resetDaemonJobFallbacks` (`:47`, test hook).
Note the recorder fallback is a **process-global singleton** — a job run
outside a container (e.g. `DashboardOperations`) will share the same in-memory
event buffer as any other fallback consumer.

---

### 04.6 Plan-selection gate (`PlanSelectionGate.ts`)

`runPlanSelectionGate(options, gate)` (`:39`) is the mandatory pre-flight for
every generation stage. It gates the workflow behind an AI plan decision and,
crucially, a **byte budget** so the generation prompt cannot blow up.

Flow:

1. Build the **full** `projectContextFacts` via
   `buildProjectContextWorkflowFacts` (`:54`) — this is returned unchanged for
   the downstream generation chain.
2. Build a **trimmed ≤12KB projection** for the plan AI only:
   `collectPlanProjectContext` (Core) → `buildPlanFactsProjection` with
   `budgetBytes = PLAN_FACTS_BUDGET_BYTES = 12*1024` (`:27`, `:67-74`). The
   comment at `:62-66` documents why: previously the full facts (per-file
   source) were `JSON.stringify`-ed into the prompt, producing a ~21M payload
   that the local budget gate would reject before the API call. Both this gate
   and the host-agent MCP `alembic_plan` now use the same Core entry.
3. `runPlanAgent({ agentService, generationStage, projectContextFacts: planSelectionFacts })`
   (`@alembic/agent/service`, dynamic import `:75`).
4. `constrainPlanSelectionForGate` (`:164`) applies **request-side
   constraints** (only for `deepMining`/`moduleMining`) — see below.
5. `assertPlanSelectionStageRequirements(selection, { expectedStage })` (Core,
   `:89`) — reuses Core's stage-shape assertion so an empty-module
   deep/module-mining selection fails the gate rather than "succeeding" with no
   targets.
6. `applyPlanSelection(selection)` (Core, `:91`) → `PlanSelectionProjection`
   (budget + `executionDimensions` + `moduleScope`). If
   `executionDimensions.length === 0`, throw (`:93`).
7. Log + emit a `plan-gate` checkpoint event; return
   `{ projectContextFacts, projection, selection }` (`BootstrapPlanGateResult`).

On any failure it emits a `plan-gate` error event and rethrows a wrapped
`"<label> plan gate failed: ..."` error (`:125-151`), aborting the job.

`runBootstrapPlanGate` (`:29`) is the `coldStart` specialization.

#### Request constraints (`applyMiningRequestConstraints`, `:213`)

For mining stages, callers can pass `dimensions`, `moduleScope`, `scaleCap`,
`maxFiles`, `contentMaxLines`, `maxRounds`, `minNewRecipes`
(`readPlanSelectionRequestConstraints`, `:189`). The function filters
`moduleBindings` to requested dimensions, then to requested module scope, then
truncates to `scaleCap`, and rewrites `selection.scale`. It throws explicit
errors when constraints remove *all* bindings/dimensions (`:230`, `:245`,
`:260`, `:271`). Module-scope matching is alias-tolerant: it compares against a
generated alias set for each binding (`moduleBindingScopeAliases`, `:347`) and
recognizes project-root aliases (`projectRootScopeAliases`, `:383`) — this is
what lets a caller pass `.`, a basename, a relative path, or a
`target:Name:path` structured id and still match
(`scopeValueAliases`/`terminalStructuredAlias`, `:391`,`:446`).

---

### 04.7 Deep-mining round loop (`DeepMiningRoundGate.ts`) — the load-bearing area

`runDeepMiningRounds(options)` (`:29`) is the multi-round convergence loop.
It requires the Core `coverageLedgerRepository` service (throws if absent,
`:34`) — this repository is the durable coverage state.

#### The round loop (`while (true)`, `:52`)

Each iteration:

1. `runPlanSelectionGate(..., { generationStage: 'deepMining' })` (`:53`) to get
   fresh `moduleBindings` and budget.
2. `buildDeepMiningRoundPlanContext(planGate)` (`:394`) →
   `moduleDimensionTargets` (from `selection.moduleBindings`, `:379`),
   `perDimensionTargets` (`:365`), `moduleCount`, and optional `planK` /
   `planMaxRounds` (read from `selection.scale.k|minNewRecipes|maxRounds` if
   present, else `undefined` → Core's D2 default table, `:415-417`). It throws
   if there are no module×dimension targets (`:398`).
3. **`ensureCoverageLedgerCells`** (`:426`): for every target, if no cell exists
   for `(projectRoot, moduleId, dimensionId)`, seed an `empty`/`coveredCount:0`
   cell with `totalCandidateCount = target.targetRecipes`. This guarantees the
   advisor sees the full target grid even before any recipe is produced.
4. `advisor = adviseCoverageLedger({ cells, latestRound, moduleCount, planK, planMaxRounds })`
   (Core, `:68`). **If `advisor.shouldStop`, break before running** (`:75`) —
   this is the pre-round stop check.
5. Open a round row: `roundIndex = (latestRound?.roundIndex ?? 0) + 1`,
   `rescanId = ${jobId}:deepMining:${roundIndex}` (`:79-80`),
   `upsertRound({ projectRoot, rescanId, roundIndex, startedAt, triggerActor: 'daemon-job-runner' })`
   with **no `completedAt`** — the row is now "open" (`:82`).
6. Run `runProjectIndexWorkflow(..., { mode: 'incremental' })` with
   `generationStage:'deepMining'`, `miningMode:'deepMining'`,
   `internalExecution: { runAsyncFillInline: true }`, the plan's budget,
   `moduleDimensionTargets`, `moduleScope`, `perDimensionTargets`,
   `roundIndex`, and a `reason` (`:92-112`). `runAsyncFillInline:true` means
   generation happens **synchronously inside the round** (not dispatched
   async), so the coverage write-back completes before the row is closed.
7. On workflow throw → `failCloseDeepMiningRound` (`:455`): close the row with
   `completedAt` + `newRecipesThisRound:0`, log/emit an error event, then
   rethrow. This "fail-closed" guarantees no orphan open row survives a crash
   mid-round.
8. `newRecipesThisRound = extractNewRecipesThisRound(result)`
   (`DaemonJobWorkflowHelpers.ts:242` — probes many numeric fields, then counts
   `recipes`/`newRecipes`/`createdRecipes` array lengths recursively).
9. Close the round: `upsertRound({ completedAt, newRecipesThisRound, ... })`,
   store returns the updated `latestRound` (`:127`).
10. Re-run `adviseCoverageLedger` with the fresh cells+round (`:136`), push a
    round summary, emit a `deep-mining` checkpoint event (`:149`). **If
    `advisor.shouldStop`, break** (`:163`) — post-round stop check.

After the loop, build `coverageLedgerSeed` (`buildCoverageLedgerSeed`, `:211`)
from the *final* cells and return
`{ asyncFill:false, coverageLedgerSeed, deepMining: { advisor, rounds, moduleCount, stopReason }, planSelectionProjection, status:'complete' }`
(`:183`).

#### **Where the per-cell coverage write-back actually happens (fragile!)**

`runDeepMiningRounds` *opens/closes round rows* and *seeds empty cells*, but it
does **not** write `coveredCount` / `coveredSourceRefs` into the cells itself.
The measured coverage is written by the workflow it invokes,
`runProjectIndexWorkflow` (mode `incremental`) →
`KnowledgeRescanWorkflow.ts`. The write-back is a **per-dimension hook**:
`onDimensionResult` (`lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:754`)
→ `writeKnowledgeRescanCoverageLedgerForDimension`
(`KnowledgeRescanWorkflow.ts:909`) → `writeCoverageLedgerForCompletion`
(Core, via `lib/shared/ModuleMiningEvidence.ts`). That hook only fires when
`runAsyncFillInline:true` (the inline-fill branch, `:778`), which is precisely
why the deep-mining round sets that flag (04.7 step 6). If the fill were
dispatched async instead, the round would close with the cells still `empty`,
`newRecipesThisRound` would be 0, and the advisor would converge on a false
"nothing new" — the historically fragile failure mode this design guards
against.

The write-back canonicalizes module ids to the `target:name:path` form via
`buildCanonicalCoverageLedgerModuleId` (Core, used in
`ModuleMiningSelection.ts:152`). `buildCoverageLedgerSeed`
(`DeepMiningRoundGate.ts:211`) then classifies cells: `isTargetScopedCoverageCell`
(`:280`) accepts `target:...:path` cells but **excludes** aggregate/root cells
(`isAggregateOrRootModuleId`, `:308` — `.`, `/`, `*`, `all`, `aggregate`,
`root`, `project-root`, `aggregate:*`, `root:*`, and the project-root target
itself). `isProjectRootTargetName` (`:340`) treats `target:<basename>:.` as the
root cell for BiliDili-style package targets. Only target-scoped, measured
cells (`isMeasuredCoverageCell`, `:349`) count toward the seed's
`measuredCells`; a seed with zero usable cells is reported `status:'skipped'`
with a `reason` (`no-coverage-ledger-cells` / `aggregate-or-root-only` /
`no-target-scoped-cells`, `:231-238`). This module-id classification is the
part downstream consumers must keep in sync — a mis-derived module id silently
falls into the aggregate bucket and is dropped from the seed.

---

### 04.8 Module-mining (`ModuleMiningSelection.ts`, `ModuleMiningWorkflow.ts`)

`runModuleMiningWorkflow(options)` (`ModuleMiningWorkflow.ts:19`) is a
single-pass (non-looping) stage:

1. Plan gate for `moduleMining` (`:20`).
2. `selectProjectIndexModuleMiningModules` (`ModuleMiningSelection.ts:21`) picks
   `projectMapModules` from the facts that match both the plan's
   `moduleBindings` and any `moduleScope`, using multi-key matching
   (`moduleId`/`moduleName`/`modulePath`/canonical id,
   `projectMapModuleCandidateKeys` `:127`). Explicit `moduleDimensionTargets`
   are honored even if a global gap says "fully covered" (comment at
   `ModuleMiningSelection.ts:35`). Throws if zero modules (`:31`).
3. `scaleCap = explicit ?? min(modules.length, budget.totalRecipeBudget)`;
   slice to `selectedModules` (`ModuleMiningWorkflow.ts:35-38`).
4. Snapshot source-refs **before** (`readModuleMiningSourceRefSnapshot`, `:44`),
   run `runModuleMining` (`@alembic/agent/service`, dynamic import `:45`), then
   compute the **persisted delta** (`readModuleMiningSourceRefDelta`, `:54`).
5. `writeModuleMiningCoverageLedger` (`lib/shared/ModuleMiningEvidence.ts:183`)
   writes the coverage cells from the persisted source-ref paths (`:61`).
6. **Reconcile reported vs persisted**:
   `newRecipes = max(reportedNewRecipes, persistedOutputDelta.recipeIds.length)`
   (`:68`) — the persisted DB delta is the floor of truth, guarding against an
   Agent over/under-reporting. Throws `"moduleMining produced zero recipes."`
   if `newRecipes <= 0` (`:69`).
7. Emit a `module-mining` checkpoint event and return the merged result +
   `moduleMining` accounting block (`:110-125`).

`ModuleMiningEvidence.ts` (`lib/shared/`, outside this file set) is the actual
`upsertCell` writer for module-mining; it merges new covered source-refs into
`existing.coveredSourceRefs`, recomputes `coveredCount` and the `grade`
(`covered`/`partial`/`empty`), and is idempotent across reruns.

---

### 04.9 Per-project runtime control (`ProjectRuntimeControl.ts`)

Alembic can manage many registered projects, but only **one** project's daemon
is the "active runtime" at a time (the one the Dashboard/CLI is currently
pointed at). `ProjectRuntimeControl` owns that selection and its persisted
state file, `getProjectRegistryDir()/runtime-control.json`
(`getProjectRuntimeControlStatePath`, `:119`).

State (`ProjectRuntimeControlState`, Core) tracks a *selected* project (user
intent) and an *active* project (a ready daemon). `readState` (`:133`) refuses
a mismatched `schemaVersion` (returns empty state, `:138`). `writeState`
(`:734`) is an atomic temp-file rename with `0o600`.

#### Actions

| Method | Anchor | Effect |
|---|---|---|
| `snapshot()` | `:185` | Full read-only view: projects, selected/active, diagnostics, SoT |
| `listProjects()` | `:154` | Summarize every registered project + project-scope folder |
| `inspectProject(target)` | `:174` | Summarize one target |
| `selectProject(target)` | `:222` | Set selected (clears active) |
| `clearSelection()` | `:238` | Reset to empty state |
| `startProject(target)` | `:243` | `activateProject('start', ...)` |
| `switchProject(target)` | `:250` | `activateProject('switch', ...)` — stops current active first |
| `openDashboard(target?)` | `:257` | Activate + require a dashboardUrl |
| `stopProject(target)` | `:273` | Stop the daemon, clear selected/active if they matched |

`activateProject` (`:340`) is the core mutation: it optionally stops the
current active daemon (unless `deferSelfDaemonStop` and the current process
*is* that daemon — `isCurrentProcessDaemon`, `:1058`, which compares
`ALEMBIC_DAEMON_MODE`, `ALEMBIC_PROJECT_DIR`, pid, and state-path), starts the
target via `DaemonSupervisor.start`, then writes active/selected state keyed to
whether the target became ready (`:436`). The `deferSelfDaemonStop` path exists
so a running daemon can hand off to another project without killing itself
before responding.

#### Project summary (`buildProjectSummary`, `:501`)

Merges `ProjectRegistry.inspect`, `resolveAlembicWorkspace(...).toFacts()`,
`DaemonSupervisor.status` (via `safeDaemonStatus`, `:726` — swallows errors),
and health-derived capability summaries: `summarizeDaemonStatus` (`:742`),
`summarizeFileMonitor` (`:759`), `summarizeApiAi` (`:772` — falls back to
`WorkspaceSettingsStore` + env when health is unavailable), and
`summarizeJobs` (`:807` — reads `jobsDir/*.json` directly off disk and buckets
by status). `collectRuntimeProjectTargets` (`:871`) unions `ProjectRegistry`
entries with `ProjectScopeRegistryStore` folders, dedup'd by realpath.

#### State cleanup & diagnostics (`prepareRuntimeControlState`, `:621`)

This is the runtime "garbage collector" for stale selection. It:

- Diagnoses a selected-but-unregistered project (`selected-project-missing`,
  `:648`).
- Diagnoses a selected≠active mismatch when active is ready
  (`selected-active-mismatch`, `:671`) — **reported only, not auto-fixed**, so
  an explicit `switch`/`stop` is still required.
- **Auto-clears** a stale active-runtime state (`activeStateStaleReason`,
  `:911`, covering project-missing / daemon-missing / stale / failed /
  starting / unavailable) by writing `activeProject{Id,Root}: null` and
  recording a `cleared-active-state` diagnostic + `stateCleanup` receipt
  (`:696-714`). The comment at `:625` states the ownership rule: Alembic owns
  runtime-control persistence, so it may clean stale *active* state but must
  only diagnose (never silently drop) a ready-but-inconsistent selection.

---

### 04.10 Runtime source-of-truth (`ProjectRuntimeSourceOfTruth.ts`)

Pure builders that produce a **read-only** runtime SoT envelope from either a
daemon-health view (`buildDaemonProjectRuntimeSourceOfTruth`, `:247`, route
`daemon-health`) or the runtime-control view
(`buildProjectRuntimeControlSourceOfTruth`, `:286`, route
`project-runtime-control`). The envelope is deliberately locked down:

- `operation` = `createReadOnlySourceOfTruthOperation()` (`:227`):
  `explicitRuntimeActionRequired:true`, `implicitRuntimeActionAllowed:false`,
  `mode:'diagnostics-read'`.
- `writePolicy` = `createReadOnlyWritePolicy()` (`:236`): every write flag is
  `false`, `writeOwner:'alembic'`.
- `explicitActions` (`EXPLICIT_ACTIONS`, `:216`) enumerate the only mutating
  HTTP routes: `POST /api/v1/projects/:projectId/{start,stop,switch,open-dashboard}`,
  `POST /api/v1/project-scope/folders`, `POST|DELETE /api/v1/projects/select`.

`failureFromReadiness` (`:468`) attaches a `ProjectRuntimeFailureEnvelope` with
`nextActions` (`nextActionsForReason`, `:494`) and a `retryable` flag; the
reason space is `ProjectRuntimeSourceOfTruthReason` (`:16` — `ready`,
`daemon-*`, `project-missing`, `runtime-control-*`, `unavailable`). This is the
machine-readable contract the Plugin/host consumes to decide whether an
implicit fallback is allowed (it never is — `blockedFallbacks` lists
`plugin-selected-root-fallback` and `implicit-runtime-control-write`, `:481`).

---

### 04.11 Runtime boundary descriptor (`RuntimeBoundary.ts`)

`buildAlembicRuntimeBoundary(options)` (`:97`) produces a static descriptor of
who owns what, surfaced through daemon health. It stamps ownership:
`daemon.owner:'alembic'`, `dashboard.frontendOwner:'AlembicDashboard'` /
`serverOwner:'alembic'`, `fileMonitor.longLivedOwner:'alembic-daemon'`,
`apiAi.owner:'alembic-api-ai'` / `runtimeOwner:'AlembicAgent'`,
`jobs.store:'@alembic/core/daemon/JobStore'`. The workspace/daemon/file-monitor
constants come from `@alembic/core/daemon` (`:1-11`). `workspaceMode` defaults
to `ghost` when the workspace is ghost, else `standard` (`:100`). This file is
descriptive only — no behavior.

---

### 04.12 Process-event recorder (`JobProcessEventRecorder.ts`)

An **in-memory** ring buffer of `JobProcessEvent`s per job, used to build the
live developer view and the display snapshot. It is not durable — hence the
snapshot store (04.13) and the interrupt-recovery logic.

- `record(input)` (`:87`) assigns a monotonic per-job `sequence`
  (`#nextSequence`, `:217`), builds the event (Core `createJobProcessEvent`),
  appends it unless `retention==='transient'` (`:99`), and broadcasts the
  developer view (`#broadcastDeveloperView`, `:175`).
- Retention caps: `DEFAULT_JOB_PROCESS_EVENT_LIMIT = 240` per job,
  `DEFAULT_GLOBAL_PROCESS_EVENT_LIMIT = 2400` global (`:14-15`). `#append`
  (`:164`) trims per-job; `#trimGlobalEvents` (`:227`) evicts the
  oldest-`createdAt` job's oldest event until under the global cap.
- `list(jobId, options)` (`:126`) returns retained events after a cursor,
  optionally filtered to developer-visible, plus `developerViews`,
  `hiddenCount`, `broadcastFailures`, and `nextSequence`.
- `ingest(value)` (`:111`) normalizes an externally-produced event (e.g. from a
  child) and merges it, tracking the max sequence.
- `resetJob(jobId)` (`:158`) clears a job's buffer (called by `enqueueDaemonJob`
  before queuing).

Broadcast failures are captured per job (`#appendBroadcastFailure`, `:208`) so
a socket.io hiccup never throws into the recorder;
`recordJobProcessEvent` (`DaemonJobWorkflowHelpers.ts:85`) additionally
swallows *all* recorder errors so process-event recording can never fail the
job itself.

---

### 04.13 Display snapshot store (`JobDisplaySnapshotStore.ts`)

Durable per-job snapshot written to
`{dataRoot}/.asd/job-display-snapshots/{jobId}/snapshot.json` (`0o600`,
`#snapshotPath`, `:219`). This is what survives a daemon restart when the
in-memory recorder is empty.

- `writeFromJob({ job, recorder })` (`:85`) lists all events (including hidden),
  builds the snapshot, and writes it with a path-escape assertion
  (`assertPathInside`, `:662`). `refreshJobDisplaySnapshot`
  (`DaemonJobRunner.ts:598`) calls this on every job transition.
- `buildSnapshot` (`:119`) assembles: artifacts (`collectSnapshotArtifacts`,
  `:337` — reads back each retained job-artifact and flags
  missing/truncated/redacted evidence as `evidenceIncomplete`), source-refs
  (`collectSourceRefs`, `:492` — deep-walks event metadata including
  `traceEnvelope`/`pcvNodeEvidence`/`pcvN9Observability.evidenceLinks`),
  findings/candidates, a phase timeline (`buildPhaseTimeline`, `:281`), a
  summary, and monotonically increments `snapshotVersion` from the prior file
  (`:161`).
- `collectCompletenessEvidence` (`:439`) records structured "incomplete"
  reasons: `events_missing_after_restart`, `llm_io_missing`,
  `final_session_missing` (bootstrap), `snapshot_truncated`.
- `buildIncompleteSnapshot` (`:172`) produces a minimal snapshot from durable
  job metadata alone (used when no events remain after a restart).
- `summarizeJobDisplaySnapshotForApi` (`:228`) is the compact API projection
  (checksum, version, warning/incomplete counts) used by `jobs.ts`.

`SNAPSHOT_PRODUCER_MODULES` (`:30`) records provenance
(`DaemonJobRunner.ts`, `JobDisplaySnapshotStore.ts`, `http/routes/jobs.ts`).

---

### 04.14 Process-event text artifacts (`JobProcessEventArtifacts.ts`)

Large text / LLM-IO event bodies are spilled to disk rather than held in
memory. `materializeJobProcessEventTextArtifact` (`:22`) writes
`{dataRoot}/.asd/job-artifacts/{jobId}/{artifactId}` (`0o600` file, `0o700`
dir) where `artifactId` is a content-hashed, safe-charset name
(`buildArtifactId`, `:101` — sha256 of jobId+kind+dimension+iteration+text,
first 16 hex, plus a mime-based extension). It returns an
`artifactRef` pointing at
`/api/v1/jobs/{jobId}/artifacts/{artifactId}` (`buildJobArtifactApiRef`, `:97`)
and metadata (original/retained chars, redaction state, storage kind).
`readJobProcessEventArtifact` (`:71`) validates the id
(`isSafeArtifactId`, `:147` — `^[a-zA-Z0-9._-]{1,180}$`) and re-asserts the
path is inside the job root (`assertPathInside`, `:136`) before reading — two
layers of path-traversal defense.

`recordBootstrapProcessEventDrafts` (`DaemonJobRunner.ts:1136`) is the caller:
for each Agent draft with a `textArtifactCandidate` it materializes the file,
prepends the ref, and merges the metadata; on failure it records
`artifactRetained:false` + `artifactRetainError` rather than throwing
(`DaemonJobRunner.ts:1186`).

---

### 04.15 PCV N9 observability linkage (`PcvObservabilityLinkage.ts`)

`attachPcvN9ObservabilityCarry(...)` (`:52`) enriches a bootstrap process-event
draft's metadata so the PCV (Process-Chain-Verification) node
`N9-agent-analyze-quality` can be traced end-to-end. It:

1. Normalizes source-refs against the project-scope source identities
   (`normalizeMetadataSourceRefs`, `:313`), rejecting out-of-scope refs into
   `projectScopeSourceRefRejections`.
2. Resolves the N9 node identity (`resolvePcvN9NodeIdentity`, `:140`) from
   explicit ids (agent-emitted `pcvNodeId`/`chainNodeId`, nested
   `pcvNodeEvidence`, trace envelope) or infers it from a host stage-profile
   (`analyze`/`verify`/`record`), a quality-gate diagnostic, or a
   findings-digest projection. If none apply, it returns metadata unchanged
   (`:72`).
3. Collects the four evidence links — `artifactRefs`, `traceId`, `metricsPath`
   (`metadata.llmMetrics`), `sourceRefs` — and computes `missingLinkReasons`
   (`buildMissingLinkReasons`, `:216`). `linkageStatus` is `linked` only if all
   present, else `blocked-by-observability-gap` (`:92`) with a concrete
   `firstFix` list (`firstFixForMissingLinks`, `:277`).

The design comment at `:45-51` is explicit: the host layer only *carries*
Agent-emitted evidence into a job-level linkage; it never fabricates a quality
score to hide a missing link. This is a governance guard, not a metric
producer.

---

### 04.16 File-monitor status model (`FileMonitorStatus.ts`)

A pure type + factory module for the daemon file watcher's runtime state.
`DaemonFileMonitorRuntimeState` (`:1`) is
`disabled|unsupported|starting|running|degraded|error`;
`DaemonFileMonitorActiveEventSource` (`:9`) is
`native-watch|git-worktree|null`. Factories build the canonical status objects:
`createDisabledFileMonitorStatus` (`:31`), `createStartingFileMonitorStatus`
(`:57`), `createUnsupportedFileMonitorStatus` (`:73`),
`createGitFallbackFileMonitorStatus` (`:84` — the `degraded` fallback when the
native watcher is unavailable), `createNativeFileMonitorStatus` (`:109`, the
happy `running` path), `createErroredFileMonitorStatus` (`:134`).
`isFileMonitorRuntimeAvailable` (`:145`) is true for `running`|`degraded`
(git-worktree fallback still counts as available). The actual watcher
(`DaemonFileChangeCollector`) lives under `lib/service/evolution/**`; this file
is only the status vocabulary that `RuntimeBoundary.ts` (`:157-176`) and
`daemon-server.ts` (`:186`) consume.

---

### 04.17 External interfaces (enumerated)

#### CLI commands (`bin/cli.ts`)

Runtime/daemon-facing commands construct `DaemonSupervisor` /
`ProjectRuntimeControl` directly (`bin/cli.ts:245,271,288` and
`:313,327,343,359,383,404,424,444,466`): daemon status/start/stop and the
project-runtime `snapshot`, `inspect`, `select`, `start`, `stop`,
`open-dashboard`, `switch` verbs. (This section did not exhaustively read
`cli.ts`; command names are inferred from the constructor call sites and the
`ProjectRuntimeControl` method surface.)

#### HTTP routes (daemon-served)

| Route | File | Handler → daemon layer |
|---|---|---|
| `GET /api/v1/daemon/health` | `HttpServer.ts` | Identity/health JSON that `DaemonSupervisor.isMatchingHealth` verifies |
| `POST /api/v1/jobs/bootstrap` | `http/routes/jobs.ts:262` | `enqueueDaemonJob({ kind:'bootstrap' })` |
| `POST /api/v1/jobs/rescan` | `jobs.ts:287` | `enqueueDaemonJob({ kind:'rescan' })` (with `generationStage`) |
| `POST /api/v1/jobs/:jobId/cancel` | `jobs.ts:413` | `cancelDaemonJob` |
| `GET /api/v1/jobs/:jobId/events` | `jobs.ts` (recorder) | `JobProcessEventRecorder.list` |
| `GET /api/v1/jobs/:jobId/display-snapshot` | `jobs.ts` | `JobDisplaySnapshotStore` |
| `GET /api/v1/jobs/:jobId/artifacts/:artifactId` | `jobs.ts` | `readJobProcessEventArtifact` |
| `POST /api/v1/projects/:projectId/{start,stop,switch,open-dashboard}` | `http/routes/projects.ts:160-205` | `ProjectRuntimeControl.*` |
| `POST|DELETE /api/v1/projects/select` | `projects.ts` | `selectProject`/`clearSelection` |
| `POST /api/v1/project-scope/folders` | (project-scope) | project-scope registry write |

(The `daemon.ts` route also instantiates `ProjectRuntimeControl`,
`http/routes/daemon.ts:126`.)

#### Emitted job process-event phases (via the recorder)

`reset`, `queued`, `running`, `session`, `dimension`, `plan-gate`,
`deep-mining`, `module-mining`, `artifact`, `complete`, `failed`, `cancel`,
`cancelled` (see the `recordJobProcessEvent` call sites throughout
`DaemonJobRunner.ts`, `PlanSelectionGate.ts:118,145`,
`DeepMiningRoundGate.ts:158,270,509`, `ModuleMiningWorkflow.ts:104`).

#### On-disk state / files (host-owned runtime data)

| Path | Producer | Purpose |
|---|---|---|
| `{runtimeDir}/daemon.json` (statePath) | `daemon-server.ts:writeReadyDaemonState` | Daemon identity/url/port/token |
| `{runtimeDir}/daemon.pid` | `DaemonSupervisor.start:162` | pid file |
| `{lockDir}` | `DaemonSupervisor.#withLock` | start lock (dir + `owner.json`) |
| `{runtimeDir}/daemon.log` | spawn stdio redirect | daemon stdout+stderr |
| `getProjectRegistryDir()/runtime-control.json` | `ProjectRuntimeControl.writeState` | selected/active project |
| `{jobsDir}/*.json` | Core `JobStore` | durable job records |
| `{dataRoot}/.asd/job-artifacts/{jobId}/*` | `JobProcessEventArtifacts` | spilled text/LLM-IO |
| `{dataRoot}/.asd/job-display-snapshots/{jobId}/snapshot.json` | `JobDisplaySnapshotStore` | durable display snapshot |

Coverage state (round rows, cells) is stored in SQLite via the Core
`coverageLedgerRepository` (table owned by `@alembic/core`), not by this layer.

---

### 04.18 Notable gotchas & edge cases

- **Build-staleness restart:** a *live* daemon is reported `stale` if the built
  entry is newer than its start time (`DaemonSupervisor.ts:341`). Forgetting to
  rebuild after editing daemon code will *not* be masked, but stopping/starting
  is required to pick up changes.
- **Port 0 by default:** the supervisor requests port `0`
  (`DaemonSupervisor.ts:135`) and the daemon writes back its *actual* bound port
  — never assume a fixed port; read it from daemon-state/health.
- **Deep-mining inline fill is load-bearing:** the round loop *depends* on
  `runAsyncFillInline:true` so the coverage write-back
  (`KnowledgeRescanWorkflow.ts:754 → :909`) completes before the round row is
  closed. Dispatching the fill async would leave cells `empty`, force
  `newRecipesThisRound=0`, and make the advisor converge falsely.
- **Module-id classification drift:** `buildCoverageLedgerSeed`
  (`DeepMiningRoundGate.ts:211`) drops any cell whose module id is not
  `target:name:path` shaped or is classified as aggregate/root. A producer that
  derives a different module-id form silently loses its cells from the seed —
  the canonical form is `buildCanonicalCoverageLedgerModuleId` (Core).
- **coverageLedgerSeed can degrade quietly:** if only aggregate/root cells
  exist, the seed is `status:'skipped'` with a warning event
  (`DeepMiningRoundGate.ts:254`) rather than an error — a "successful" job can
  still carry an unusable seed.
- **Fail-closed rounds:** both a mid-round throw (`failCloseDeepMiningRound`,
  `:455`) and a cancel (`closeCancelledDeepMiningRounds`,
  `DaemonJobRunner.ts:467`) close open rows with 0 recipes so the advisor is not
  wedged by an orphan open round.
- **Reported-vs-persisted floor:** module-mining trusts the persisted source-ref
  delta over the Agent's self-reported count
  (`ModuleMiningWorkflow.ts:68`) and hard-fails on zero.
- **Recorder is in-memory + globally capped:** at ≥2400 global events the oldest
  job's events are evicted (`JobProcessEventRecorder.ts:227`); the durable
  snapshot is the only cross-restart record.
- **Fallback recorder is a process global:** container-less job runs share one
  `JobProcessEventRecorder` (`DaemonJobServices.ts:18`), which can interleave
  events from unrelated runs in the same buffer.
- **Runtime-control auto-cleans active, only diagnoses selected:** a stale
  *active* project is auto-nulled, but a selected≠active mismatch is reported
  and requires an explicit action (`ProjectRuntimeControl.ts:670,681`).
- **Health identity must match exactly:** any drift in projectId/dataRoot/
  version/schema/databasePath marks an otherwise-healthy daemon `stale`
  (`DaemonSupervisor.ts:372`) — the guard against cross-project handoff.

---

### 04.19 Boundary note — host-owned here vs delegated

**Host-owned (implemented in `Alembic/lib/daemon/**` + `bin/`):**

- The daemon *process* lifecycle: spawn/lock/terminate/health-verify
  (`DaemonSupervisor`), the actual long-lived server
  (`bin/daemon-server.ts`), and the ready-state file it writes.
- The async **job queue orchestration**: enqueue→run→complete/fail/cancel,
  bootstrap-session bridging & finalization, interrupt recovery
  (`DaemonJobRunner`).
- The **plan-selection gate** wiring and byte-budget projection
  (`PlanSelectionGate`), the **deep-mining round loop** (open/close rows, seed
  empty cells, drive the advisor, build `coverageLedgerSeed`,
  `DeepMiningRoundGate`), **module selection** and reported-vs-persisted
  reconciliation (`ModuleMiningSelection`/`ModuleMiningWorkflow`).
- **Per-project runtime multiplexing** and its persisted state + cleanup
  (`ProjectRuntimeControl`), and the read-only runtime **source-of-truth**
  envelope shape (`ProjectRuntimeSourceOfTruth`, `RuntimeBoundary`).
- **Observability plumbing:** the in-memory process-event recorder, the durable
  display-snapshot store, the on-disk text-artifact spill with path-traversal
  guards, and the PCV N9 evidence-carry stitching
  (`JobProcessEventRecorder`, `JobDisplaySnapshotStore`,
  `JobProcessEventArtifacts`, `PcvObservabilityLinkage`).
- The **file-monitor status vocabulary** (`FileMonitorStatus`).

**Delegated to `@alembic/core`:**

- `JobStore` and the `DaemonJobRecord`/`DaemonJobStatus` model, the
  daemon-state contract (`readDaemonState`/`writeDaemonState`/
  `ensureDaemonDirs`/`removeDaemonState`, schema versions), and
  `getPackageVersion` — all from `@alembic/core/daemon`.
- The coverage engine: `EvolutionCoverageLedgerRepository` (SQLite-backed round
  rows + cells) and `adviseCoverageLedger` / `buildCanonicalCoverageLedgerModuleId`
  (`@alembic/core/host-agent-workflows`) — the daemon opens/closes rows and
  seeds cells, but the *advice math* and *persistence* are Core's.
- Plan math & shape assertions: `applyPlanSelection`,
  `assertPlanSelectionStageRequirements`, `collectPlanProjectContext`,
  `buildPlanFactsProjection`, and the `PlanSelection`/`PlanSelectionProjection`
  types (`@alembic/core/plans`, `@alembic/core/service/planFacts`).
- Process-event/display-snapshot value types and validators
  (`createJobProcessEvent`, `createJobDisplaySnapshot`,
  `validateJobDisplaySnapshot`, `normalizeJobProcessEvent`, etc. from
  `@alembic/core/daemon`) — the recorder/store are host containers around Core's
  data model.
- The actual generation workflows are invoked but live outside this section:
  `runProjectIndexWorkflow` / `KnowledgeRescanWorkflow`
  (`lib/workflows/**`, host repo) perform the **per-cell coverage write-back**
  via `writeCoverageLedgerForCompletion` (Core, through
  `lib/shared/ModuleMiningEvidence.ts`).

**Delegated to `@alembic/agent`:**

- `runPlanAgent` (plan-selection AI), `runModuleMining` (module-mining AI), and
  the `AgentService` runtime (`@alembic/agent/service`). The daemon supplies
  the trimmed facts/budget and consumes the result; the in-process agent loop,
  tool system, and LLM orchestration are the Agent repo's.

The daemon layer therefore contributes no "organism" intelligence of its own —
it is the scheduler, transaction/round bookkeeper, runtime multiplexer, and
observability recorder that turns Core's coverage/plan model and the Agent's
generation into a supervised, crash-recoverable background service.


---


## 05. HTTP Server, Middleware, Contracts & Schemas

This section documents the Express HTTP layer of the Alembic **main-body** repo (`Alembic/`, npm package `alembic-ai`). This layer is the host-side REST/SSE surface that the Dashboard, CLI, and external hosts call to reach knowledge, guard, jobs, search, and diagnostic capabilities. The deep "organism" engine logic (Recipe lifecycle, SignalBus, Guard rule engine, failure taxonomy) lives in `@alembic/core`; this layer assembles Express, wires middleware, mounts routers, enforces governance via a Gateway middleware, streams events over SSE/socket.io, and shapes responses into a stable success/problem envelope contract. See the **Boundary note** at the end for the exact ownership split.

Files covered:

- `lib/http/HttpServer.ts` — Express app assembly, lifecycle, realtime bridge, Dashboard mount
- `lib/http/api-spec.ts` — thin re-export of the generated OpenAPI spec
- `lib/http/provider-contracts.ts` — provider route/event/fixture contract manifest + OpenAPI generator
- `lib/http/problem-taxonomy.ts` — builds the stable HTTP problem object from the Core failure taxonomy
- `lib/http/entrypoint-safety.ts` — confirmation / production guards for destructive routes
- `lib/http/middleware/*` — gateway, error handler, request logger, source resolver, zod validate
- `lib/http/utils/*` — SSE session infra, dashboard-operation + tool-envelope response helpers, route helpers
- `lib/http/express.d.ts` — Express `Request` augmentation (`req.gw`, `req.resolvedSource*`)
- `lib/shared/schemas/http-requests.ts` — zod request schemas for REST routes
- `lib/shared/schemas/mcp-tools.ts` — zod schemas for MCP tools (shared with the MCP surface, not HTTP-only)

---

### 5.1 Responsibilities & role in the system

The `HttpServer` class (`lib/http/HttpServer.ts:61`) is the host process's HTTP entrypoint. Its job is:

1. **App assembly** — build a single `express()` application (`HttpServer.ts:80`), install the security/parsing/observability/governance middleware chain (`setupMiddleware`, `HttpServer.ts:132`), mount ~26 versioned routers under `/api/v1` (`setupRoutes`, `HttpServer.ts:242`), and install the terminal error handler (`setupErrorHandling`, `HttpServer.ts:356`).
2. **Lifecycle** — `initialize()` (`HttpServer.ts:90`) sequences service init → Gateway action registration → middleware → routes → error handling; `start()` (`HttpServer.ts:362`) binds the `node:http` server and stands up realtime; `stop()` (`HttpServer.ts:497`) coordinates graceful shutdown of streaming responses and websockets.
3. **Realtime bridge** — on listen, initialize `RealtimeService` (socket.io) and bridge selected `EventBus` events to websocket broadcasts (`HttpServer.ts:410`–`477`).
4. **Static Dashboard hosting** — `mountDashboard()` (`HttpServer.ts:565`) serves the pre-built SPA and re-orders the route stack so the SPA fallback sits before the 404 catch-all.

The middleware and utils around it provide cross-cutting concerns: **governance** (`gatewayMiddleware`), **request validation** (`validate`), **request-source attribution** (`sourceResolver`), **structured logging** (`requestLogger`), **error → envelope mapping** (`errorHandler`), **SSE streaming** (`sse.ts`, `sse-sessions.ts`), and **response shaping** (`tool-envelope-response.ts`, `dashboard-operation.ts`).

The contract files (`provider-contracts.ts`, `problem-taxonomy.ts`, `api-spec.ts`) declare the machine-checkable provider contract (routes, events, fixtures, response schemas) and generate the OpenAPI document served at `/api-spec`.

---

### 5.2 App assembly & middleware chain

`setupMiddleware()` (`HttpServer.ts:132`) installs middleware in a **strict order** — order is load-bearing because later middleware depend on state set by earlier ones (e.g. the gateway reads `req.resolvedSourceActor` from the source resolver):

| # | Middleware | Source | Purpose |
|---|-----------|--------|---------|
| 1 | `helmet(...)` | `HttpServer.ts:134` | Security headers; CSP is **deliberately relaxed** (`scriptSrc 'unsafe-inline'`, `styleSrc https:`, `connectSrc ws:/wss:`) to allow the Vite-built Dashboard SPA and websockets (`HttpServer.ts:137`–146). |
| 2 | `requestLogger(logger)` | `HttpServer.ts:152` | Structured HTTP logging via `res.on('finish')`. |
| 3 | request-lifecycle tracker | `HttpServer.ts:155`, impl `trackRequestLifecycle` `HttpServer.ts:203` | Counts active requests and tracks streaming responses for graceful shutdown. |
| 4 | `express.json({ limit: '10mb' })` | `HttpServer.ts:160` | JSON body parsing (10 MB cap). |
| 5 | `express.urlencoded({ limit: '10mb', extended: true })` | `HttpServer.ts:163` | Form body parsing. |
| 6 | `cors(...)` | `HttpServer.ts:166` | CORS; default origin `*`, `credentials: true`, explicit allowed headers incl. `X-User-Id`, `X-Alembic-Daemon-Token` (`HttpServer.ts:170`–178). |
| 7 | `sourceResolverMiddleware()` | `HttpServer.ts:184` | Sets `req.resolvedSource` / `req.resolvedSourceActor` (audit labels, **not** auth roles). |
| 8 | `gatewayMiddleware()` | `HttpServer.ts:187` | Injects `req.gw(action, resource, data)`. |
| 9 | per-request timeout | `HttpServer.ts:190` | Path-based `req.setTimeout`: 10 min for AI-scan paths, 5 min for streaming, 60 s otherwise (`HttpServer.ts:191`–198). |

Two important edge details:

- **Timeout heuristic is path-substring based** (`HttpServer.ts:191`): `/spm/scan`, `/spm/bootstrap`, `/modules/scan`, `/modules/bootstrap`, `/extract/` → 600 000 ms; anything containing `/stream` or `/events/` → 300 000 ms; else 60 000 ms. This is a coarse string match on `req.path`, so a route that happens to contain those substrings inherits the longer timeout.
- **CORS `origin` defaults to `*` while `credentials: true`** (`HttpServer.ts:167`–179). This combination is permissive; browsers will not send credentials to a wildcard origin, so this is effectively "any origin, no credential propagation" unless `config.corsOrigin` is set to a concrete origin.

#### Request-lifecycle tracking & graceful shutdown

`trackRequestLifecycle` (`HttpServer.ts:203`) increments `activeRequestCount`, and for streaming paths (`/stream` or `/events/`) adds `res` to `activeStreamingResponses` (`HttpServer.ts:208`–211). A `release` closure is registered on both `res.'finish'` and `res.'close'` with an idempotency guard (`released` flag, `HttpServer.ts:213`–223), so the counter decrements exactly once. When `this.stopping` is already set, incoming requests get `Connection: close` (`HttpServer.ts:204`–206).

On `stop()` (`HttpServer.ts:497`), `closeActiveStreamingResponses()` (`HttpServer.ts:538`) walks a copy of the streaming set and writes an SSE `event: shutdown\ndata: {"reason":"server_shutdown"}` frame then `res.end()` — giving SSE clients a clean termination signal before the socket closes. If headers were not yet sent it downgrades to `503 text/event-stream` first (`HttpServer.ts:541`–544).

---

### 5.3 Route mounting

`setupRoutes()` (`HttpServer.ts:242`) mounts everything under the `apiPrefix = '/api/v1'` (`HttpServer.ts:244`), plus a few unversioned endpoints. Routers are imported at the top of the file (`HttpServer.ts:22`–45) and mounted with `app.use(prefix, router)`.

**Unversioned / special endpoints:**

| Path | Method | Handler | Source |
|------|--------|---------|--------|
| `/api-spec` | GET | returns generated OpenAPI spec | `HttpServer.ts:247` |
| `/api/v1/auth/probe` | GET | echoes resolved source/actor + `mode:'source'` | `HttpServer.ts:267` |
| `/` | ALL | API metadata (`name/version/docs/health`) | `HttpServer.ts:334` |
| `{*path}` | ALL | 404 JSON `{success:false, error:{code:'NOT_FOUND'}}` | `HttpServer.ts:344` |

The 404 handler uses `app.all('{*path}', ...)` (Express 5 named-wildcard syntax) **deliberately** so that the resulting router layer exposes a `layer.route` property; `mountDashboard()` relies on `layer.route` to locate and re-order the last two handlers (`HttpServer.ts:343`, `HttpServer.ts:594`).

**Versioned routers mounted (`/api/v1/...`):**

| Prefix | Router | Source |
|--------|--------|--------|
| `/health` | `healthRouter` | `HttpServer.ts:252` |
| `/daemon` | `daemonRouter` | `HttpServer.ts:255` |
| `/jobs` | `jobsRouter` | `HttpServer.ts:258` |
| `/projects` | `projectsRouter` | `HttpServer.ts:261` |
| `/project-scope` | `projectScopeRouter` | `HttpServer.ts:264` |
| `/guard` | `guardRouter` | `HttpServer.ts:277` |
| `/rules` | `guardRuleRouter` | `HttpServer.ts:280` |
| `/search` | `searchRouter` | `HttpServer.ts:283` |
| `/ai` | `aiRouter` | `HttpServer.ts:286` |
| `/extract` | `extractRouter` | `HttpServer.ts:289` |
| `/commands` | `commandsRouter` | `HttpServer.ts:292` |
| `/skills` | `skillsRouter` | `HttpServer.ts:295` |
| `/candidates` | `candidatesRouter` | `HttpServer.ts:298` |
| `/modules` | `modulesRouter` | `HttpServer.ts:301` |
| `/violations` | `violationsRouter` | `HttpServer.ts:304` |
| `/knowledge` | `knowledgeRouter` | `HttpServer.ts:307` |
| `/recipes` | `recipesRouter` | `HttpServer.ts:310` |
| `/wiki` | `wikiRouter` | `HttpServer.ts:313` |
| `/governance` | `governanceRouter` | `HttpServer.ts:316` |
| `/evolution` | `evolutionRouter` | `HttpServer.ts:319` |
| `/file-changes` | `fileChangesRouter` | `HttpServer.ts:322` |
| `/signals` | `signalsRouter` | `HttpServer.ts:325` |
| `/audit` | `auditRouter` | `HttpServer.ts:328` |
| `/logs` | `logsRouter` | `HttpServer.ts:331` |

Note the comment at `HttpServer.ts:315`: **Panorama has been retired**; `/governance` keeps only the non-Panorama decay/staging/enhancement capabilities. The per-router internals are out of scope for this section (they belong to the routes subsystem); this section documents how they are mounted and the shared middleware/utils they consume.

---

### 5.4 Server lifecycle: `start()` / `stop()` and the realtime bridge

`start()` (`HttpServer.ts:362`) uses `Promise.withResolvers` and a manual `settled` latch so that a late error after listen only logs and does not double-settle (`HttpServer.ts:368`–385). Control flow:

1. `createServer(this.app)` (`HttpServer.ts:365`).
2. On `'listening'` (`onListening`, `HttpServer.ts:387`): validate `server.address()` is an object with `port > 0` (`HttpServer.ts:393`–400) — this is how an **ephemeral port** (`port: 0`) gets resolved back into `this.config.port` (`HttpServer.ts:401`). This is important for tests/daemon that bind to `:0`.
3. Init `RealtimeService` via `initRealtimeService(server)` (`HttpServer.ts:412`).
4. **EventBus → RealtimeService bridge** (`HttpServer.ts:416`–472): a `broadcastEvent(name, data)` wrapper (with its own try/catch, `HttpServer.ts:424`) forwards these bus events to websocket:
   - `lifecycle:transition` → `broadcastEvent('lifecycle:transition', ...)` (`HttpServer.ts:438`)
   - `signal:event` (`HttpServer.ts:445`), `guard:updated` (`HttpServer.ts:448`), `audit:entry` (`HttpServer.ts:464`)
   - It touches `container.get('signalBridge')` (`HttpServer.ts:455`) purely to force the lazy singleton to initialize so signals actually reach the EventBus (the SignalBridge forwards SignalBus → EventBus; the HttpServer only listens to EventBus, per comment `HttpServer.ts:443`).

Every bridge step is wrapped so a missing bus/service degrades to a `logger.warn` rather than failing startup (`HttpServer.ts:457`, `HttpServer.ts:468`, `HttpServer.ts:473`).

`stop()` (`HttpServer.ts:497`) sets `stopping = true`, flushes streaming responses (`closeActiveStreamingResponses`), shuts down the realtime service if it exposes `shutdown()` (`HttpServer.ts:511`), then `server.close(cb)` and resolves/rejects accordingly.

**Emitted realtime event types (host → websocket):** `lifecycle:transition`, `signal:event`, `guard:updated`, `audit:entry`. These are the bus event names bridged in `start()`; the provider contract additionally declares socket.io/SSE event contracts (see §5.9).

---

### 5.5 Governance: the Gateway middleware

`gatewayMiddleware()` (`lib/http/middleware/gatewayMiddleware.ts:27`) injects `req.gw` (`gatewayMiddleware.ts:36`). The signature is declared in the Express augmentation at `lib/http/express.d.ts:11`. When a route calls `await req.gw(action, resource, data)`:

1. It resolves the singleton service container and gets `gateway` (`gatewayMiddleware.ts:37`–38).
2. It derives the **actor** as `req.resolvedSourceActor || req.resolvedSource || 'http-request'` (`gatewayMiddleware.ts:40`) — the actor is an **audit source label, not a runtime permission role** (explicit comment `gatewayMiddleware.ts:6`).
3. It calls `gateway.execute({ actor, action, resource, data: {...data, _ip, _userAgent, _resolvedSourceActor}, session })` (`gatewayMiddleware.ts:42`–53). The `_ip` / `_userAgent` / `_resolvedSourceActor` context is merged into `data`, and `session` comes from the `x-session-id` header.
4. On `!result.success`, it **throws a `GatewayError`** (`gatewayMiddleware.ts:56`) carrying `statusCode`, `code`, and `requestId`. `GatewayError` (`gatewayMiddleware.ts:13`) is an `Error` subclass with `statusCode`/`code`/`requestId`; because it has `statusCode`/`code`, the terminal `errorHandler` maps it to the right HTTP status (see §5.6).

So governance is enforced **inside the route handler**: routes that must be governed format `{action, resource}` and call `req.gw`; the `Gateway` (in `lib/governance/gateway/`) routes the action to a registered service method, does request-format checks, and wraps the call in audit. Actions are wired at boot by `registerGatewayActions(gateway, container)` in `HttpServer.registerGatewayActions()` (`HttpServer.ts:228`, registry at `lib/governance/gateway/GatewayActionRegistry.ts`). The `Gateway.execute` result shape is `{ success, requestId, data?, error?: {message, code, statusCode} }` (see `lib/governance/gateway/Gateway.ts:29`).

**Gotcha:** `req.gw` is declared **non-optional** in the augmentation (`express.d.ts:11`, no `?`), but is only set when `gatewayMiddleware` has run. Any handler reached before that middleware (or in a test app that omits it) would see `req.gw` as `undefined` despite the type. In the assembled app the middleware runs for all routes (`HttpServer.ts:187`), so this only matters for partial test harnesses.

---

### 5.6 Error handling & the problem taxonomy

There are two distinct error surfaces.

#### 5.6.1 Terminal Express error handler

`errorHandler(logger)` (`lib/http/middleware/errorHandler.ts:16`) is the last middleware (`HttpServer.ts:358`). It reads `error.statusCode || error.status || 500`, `error.code || 'INTERNAL_ERROR'`, `error.message` (`errorHandler.ts:18`–20), logs at `error` level, and returns:

```json
{ "success": false, "error": { "code", "message", "details" } }
```

`details` is only populated when `NODE_ENV === 'development'` (`errorHandler.ts:39`) — production hides error detail. This is the handler that catches thrown `GatewayError`s and any other thrown `Error` with `statusCode`/`code`.

`mapDomainError(error)` (`errorHandler.ts:46`) is a **helper for routes** (not middleware) that maps Core domain error classes (`ValidationError`→400, `ConflictError`→409, `NotFoundError`→404, `PermissionDenied`→403, else 500) into `{status, code, message, details}`. The domain error classes are imported from `@alembic/core/shared` (`errorHandler.ts:3`–8) — the host does not define them.

#### 5.6.2 The stable HTTP problem object

`buildAlembicHttpProblem(code, message, reasonCode, options)` (`lib/http/problem-taxonomy.ts:46`) builds a rich, stable failure object (`AlembicHttpProblem`, `problem-taxonomy.ts:22`). It looks up a **Core failure taxonomy entry** via `getCoreFailureTaxonomyEntry(reasonCode)` (`problem-taxonomy.ts:52`, imported from `@alembic/core/shared`) and copies its canonical fields: `agentBranch`, `canonicalHttpStatus`, `dashboardState`, `exposureClass`/`detailExposureClass`, `failureId` (`core.failure.<kind>`), `mcpErrorCode`, `problemClass`, `refPolicy`, `retryPolicy`, `retryable`, `privateDataSafe`, and `taxonomyVersion` (`problem-taxonomy.ts:53`–75). The caller may override `status`/`retryable` and attach `artifactRefs`/`detailRefs` (`problem-taxonomy.ts:15`–20).

Key point: **the taxonomy itself is Core-owned**. `reasonCode` is `CoreFieldFailureKind` (`problem-taxonomy.ts:13`). The host chooses a human `code`/`message` and refs; Core decides the canonical HTTP status, exposure classes, agent branch, and retry policy. This is the object embedded in provider fixtures/response schemas (§5.9), giving the Dashboard and Plugin resident a single, versioned failure vocabulary. Note this object is a **data contract used by the provider contract manifest and fixtures**; it is not automatically emitted by the terminal `errorHandler` (which produces the simpler `{code, message, details}` shape).

---

### 5.7 Request-source resolution (`sourceResolver`)

`sourceResolverMiddleware()` (`lib/http/middleware/sourceResolver.ts:43`) sets `req.resolvedSource` and `req.resolvedSourceActor`. It is **not** an authentication system — the file header (`sourceResolver.ts:1`–6) and the module comment stress that these are request-source labels, not runtime permission roles, and are not derived from git/probe/login.

Trust logic (`getTrustedHeaderActor`, `sourceResolver.ts:30`):

- Reads `x-user-id`; ignores `anonymous`/`dashboard`/empty (`sourceResolver.ts:31`–34).
- Honors `x-user-id` **only** when `ALEMBIC_TRUST_X_USER_ID === 'true'` **or** a valid `x-alembic-internal-token` matches `ALEMBIC_INTERNAL_TOKEN` (`hasTrustedInternalToken`, `sourceResolver.ts:22`; gate at `sourceResolver.ts:35`). Otherwise it logs `ignored untrusted x-user-id header` and drops it (`sourceResolver.ts:36`).
- Trusted → `resolvedSource = <actor>`, `resolvedSourceActor = 'header:<actor>'` (`sourceResolver.ts:48`–49); untrusted → both are `'http-request'` (`sourceResolver.ts:51`–52).

This is the value consumed by `gatewayMiddleware` (actor), `getContext`/`operationContext`, and `dashboard-operation` for audit.

---

### 5.8 Request validation (zod) & the shared schemas

`validate.ts` provides three middleware factories:

| Factory | Target | Source | On success |
|---------|--------|--------|-----------|
| `validate(schema)` | `req.body` | `validate.ts:28` | replaces `req.body` with parsed+defaulted data (`validate.ts:43`) |
| `validateQuery(schema)` | `req.query` | `validate.ts:54` | overrides read-only `req.query` via `Object.defineProperty` (`validate.ts:69`) |
| `validateParams(schema)` | `req.params` | `validate.ts:80` | overrides `req.params` via `Object.defineProperty` (`validate.ts:94`) |

On failure all three return `400` with `{success:false, error:{code:'VALIDATION_ERROR', message, details: result.error.flatten()}}` (`validate.ts:32`–40). `flatten()` yields `{formErrors, fieldErrors}`.

**Edge detail (Express 5):** `req.query` and `req.params` are read-only getters in Express 5, so the middleware uses `Object.defineProperty(req, 'query'/'params', { value, writable, configurable })` rather than assignment (`validate.ts:68`–69, `validate.ts:94`–98). A plain `req.query = ...` would throw.

#### HTTP request schemas — `lib/shared/schemas/http-requests.ts`

This is the single zod source for REST route bodies/queries. Reusable fragments: `MAX_BATCH_SIZE = 100` (`http-requests.ts:26`), `BatchIds` (1–100 non-empty ids + optional `confirmed`, `http-requests.ts:28`), `MetadataRecord` (`z.record`, `http-requests.ts:33`), `PaginationQuery` (`page`/`limit` with coercion + defaults, `http-requests.ts:35`). Notable exported schemas by domain:

| Domain | Schemas (examples) | Source |
|--------|-------------------|--------|
| Knowledge | `CreateKnowledgeBody`, `UpdateKnowledgeBody` (`.refine` non-empty), `DeprecateKnowledgeBody`, `Batch{Publish,Delete,Deprecate}Body`, `KnowledgeUsageBody`, `KnowledgeListQuery` | `http-requests.ts:42`–98 |
| Guard rules | `CreateGuardRuleBody` (`.refine name\|\|ruleId`), `Batch{Enable,Disable}Body`, `DisableRuleBody`, `CheckCodeBody`, `ImportFromRecipeBody`, `GuardRulesListQuery` (enabled `'true'/'false'`→bool), `ComplianceQuery` | `http-requests.ts:102`–161 |
| Search | `SearchQuery` (GET, coerced), `ResidentSearchBody` (POST, `.refine q\|\|query`), `SimilarityBody` | `http-requests.ts:165`–225 |
| Candidates | `BootstrapRefineBody`, `RefinePreviewBody`, `RefineApplyBody` | `http-requests.ts:229`–246 |
| Guard file | `GuardFileBody`, `GuardBatchBody` (max 50 files) | `http-requests.ts:250`–267 |
| Skills | `CreateSkillBody`, `UpdateSkillBody` (`.refine`) | `http-requests.ts:271`–286 |
| Modules | `ScanFolderBody`, `ScanTargetBody` (`.refine target\|\|targetName`), `ScanProjectBody`, `ModuleBootstrapBody`, `ModuleRescanBody` | `http-requests.ts:290`–318 |
| Graph | `GraphQuery`, `GraphImpactQuery` | `http-requests.ts:322`–333 |
| AI | `AiLangBody`, `AiConfigBody`, `AiSummarizeBody`, `AiTranslateBody`, `AiChatBody`, `AiStreamBody`, `AiToolBody`, `AiTaskBody`, `AiFormatUsageGuideBody`, `AiEnvConfigBody` | `http-requests.ts:337`–397 |
| Extract | `ExtractPathBody`, `ExtractTextBody` | `http-requests.ts:401`–411 |
| Commands | `FileReadQuery`, `FileSaveBody` | `http-requests.ts:415`–422 |

Wiki validation is intentionally left as an inline path-param check because it is a wildcard route (`http-requests.ts:426`).

#### MCP tool schemas — `lib/shared/schemas/mcp-tools.ts`

This file is the zod source for **MCP tool inputs** (not HTTP routes), included in this section because it is a sibling shared-schema file. Each tool input is a zod object that doubles as (a) runtime validation and (b) input-schema generation via `zodToJsonSchema()` to avoid double maintenance (`mcp-tools.ts:1`–10). The core enum/field building blocks (`KindEnum`, `StrictKindEnum`, `TitleField`, `LanguageField`, `ContentSchema`, `ReasoningSchema`, `ComplexityEnum`, `ScopeEnum`, `IdField`) are imported from `@alembic/core/shared` (`mcp-tools.ts:12`–22) — Core owns the field vocabulary.

Notable schemas: `SearchInput` (`mcp-tools.ts:150`), `KnowledgeInput` with `.refine` requiring `id` for get/insights/confirm_usage (`mcp-tools.ts:177`), `GraphInput` (plain, for JSON-schema generation) plus `GraphInputChecked` (`GraphInput.superRefine`, cross-field validation for `operation`-dependent `nodeId/fromId/toId`, `mcp-tools.ts:249`), `SubmitKnowledgeItemSchema` (strict single-item schema for docs/type inference; the actual `items` array is received leniently as `z.record` and validated in the handler, `mcp-tools.ts:316`, `mcp-tools.ts:373`–380), `KnowledgeLifecycleInput`, `EvolveInput`, `ConsolidateInput`, `RescanInput` (with `produceSession` route/gap sub-schemas, `mcp-tools.ts:442`–484), `DimensionCompleteInput`. The registry `TOOL_SCHEMAS` (`mcp-tools.ts:598`) maps tool name → zod schema for `wrapHandler` auto-injection; note it deliberately registers `GraphInputChecked` (the refined variant) for `alembic_graph` (`mcp-tools.ts:603`), while the plain `GraphInput` is used for JSON-schema emission (comment `mcp-tools.ts:242`–248).

---

### 5.9 Provider contract manifest & OpenAPI generation

`lib/http/provider-contracts.ts` is a **checked, in-code manifest** that declares the provider's REST routes, event streams, response fixtures, and JSON-schema components, then generates the OpenAPI document from them. `api-spec.ts` is a one-line re-export: `apiSpec = buildAlembicProviderOpenApiSpec()` (`api-spec.ts:5`), served at `/api-spec` (`HttpServer.ts:247`).

Key exported constants:

| Export | Meaning | Source |
|--------|---------|--------|
| `ALEMBIC_PROVIDER_CONTRACT_VERSION` | contract version (`1`) | `provider-contracts.ts:19` |
| `ALEMBIC_PROVIDER_ROUTE_CONTRACTS` | list of `AlembicProviderRouteContract` (method/path/operationId/tags + row metadata) | `provider-contracts.ts:366` |
| `ALEMBIC_PROVIDER_ROUTE_MOUNTS` | `{fullPath, registryRowId, requiredBy:'d3-provider-contract'}` — the mount table cross-checking §5.3 | `provider-contracts.ts:456` |
| `ALEMBIC_PROVIDER_EVENT_CONTRACTS` | socket.io / SSE / rest-recovery event contracts | `provider-contracts.ts:485` |
| `ALEMBIC_PROVIDER_FIXTURES` | canonical success/failure payload fixtures per contract | `provider-contracts.ts:537` |
| `ALEMBIC_PROVIDER_COMPONENT_SCHEMAS` | OpenAPI component schemas (`SuccessEnvelope`, `ProblemEnvelope`, list/response envelopes, event metadata/payload) | `provider-contracts.ts:824` |

**Row-based contract model.** Each route is tagged with a `registryRowId` (e.g. `I03`, `I06`, `I22`) drawn from the **Core contract spine** (`CORE_CONTRACT_SPINE_ROWS`) plus two host-local rows `I09` and `I22` extensions (`AlembicProviderRegistryRowId = CoreContractSpineRowId | 'I09' | 'I22'`, `provider-contracts.ts:21`). The `routeRows` table (`provider-contracts.ts:234`) defines each row's `artifactPolicy`, `capabilityDiscovery`, `errorKinds` (all `CoreFieldFailureKind`), `exposureClasses`, `fixtureIds`, and `scenarios`. The `route(...)` factory (`provider-contracts.ts:892`) composes a contract from a row + method/path/operationId, deriving `functionClass` from the Core spine (`functionClassFor`, `provider-contracts.ts:1046`) and building per-status `responseSchemas` (`responseSchemasFor`, `provider-contracts.ts:961`).

**Response-schema derivation** (`responseSchemasFor`, `provider-contracts.ts:961`): always emits `200 → dataEnvelope(objectSchema)`; for each `errorKind` it maps to a status via `providerStatusForFailureKind` (`provider-contracts.ts:1000`, with `cancelled→409`, `timeout→504`, else the Core taxonomy httpStatus) and attaches the `ProblemEnvelope`; scenario flags add extra statuses (e.g. `success+unavailable-runtime → 503`, `failure → 400/404/409`, `partial → 206`).

**Envelope schemas** enforce the response contract shape at spec level:
- `envelopeBase` requires `success` (`provider-contracts.ts:87`); `dataEnvelope` requires `success`+`data` (`provider-contracts.ts:212`); `arrayDataEnvelope` wraps `{items, total}` (`provider-contracts.ts:223`).
- `problemSchema` requires `success:false` + `error` where `error` is `problemDetailSchema` — an object with **19 required fields** (`problemDetailRequiredFields`, `provider-contracts.ts:119`; schema `provider-contracts.ts:150`) whose enums are populated from the live Core taxonomy (`coreFailureStableIds`, `coreFailureAgentBranches`, `coreFailureMcpErrorCodes`, `CORE_FIELD_FAILURE_KINDS`, etc.). This is the schema counterpart of the runtime object built by `buildAlembicHttpProblem` (§5.6.2).
- `typedExtensionObjectSchema` (`provider-contracts.ts:1011`) marks route-owned data blobs as a **typed extension point** (`x-alembic-extension-point` with owner/consumer/exposureClasses), signalling that consumers may only depend on declared fields.

**Event contracts** (`provider-contracts.ts:485`) declare transports `socket.io` / `sse` / `rest-recovery` for events like `job:process-event` (socket, `I07`), `job-process-events` (rest-recovery), `ai.chat.events` / `modules.scan.events` / `candidates.refine-preview.events` (SSE, `I22`), and a bundled realtime-notification socket event (`I23`, `provider-contracts.ts:526`) enumerating `candidate-created|...|token-usage-updated`.

**OpenAPI assembly** (`buildAlembicProviderOpenApiSpec`, `provider-contracts.ts:833`): emits `openapi:'3.0.0'`, info/servers, tags derived from route tags, `paths` from `buildOpenApiPaths` (`provider-contracts.ts:1059`, each path item carries `x-alembic-contract` metadata), component schemas, and an `x-alembic-provider-contract` block with a `summarizeAlembicProviderContracts()` counts summary (`provider-contracts.ts:876`), the route mounts, and event descriptors. `summarizeAlembicProviderContracts` also stamps `coreSpineVersion = CORE_CONTRACT_SPINE_VERSION`, tying the host manifest to a Core version.

**Design intent:** the manifest is the machine-checkable source of truth for the provider surface, driving both the served OpenAPI doc and (via fixtures) contract-replay tests. The `route.not-found` / `route.permission-denied` fixtures (`provider-contracts.ts:661`, `665`) and the `POST /candidates/enrich` deletion note (`provider-contracts.ts:433`) show it is actively curated. Note the manifest is a **parallel declaration** of the real mounts in `HttpServer.setupRoutes`; nothing in `HttpServer.ts` reads `ALEMBIC_PROVIDER_ROUTE_MOUNTS` at wiring time, so the two must be kept in sync by discipline/tests, not by construction.

---

### 5.10 Streaming: SSE session infrastructure

There are **two** SSE mechanisms, used for different consumption patterns.

#### 5.10.1 Direct SSE session — `lib/http/utils/sse.ts`

`createSSESession(req, res, scene)` (`sse.ts:18`) is the low-level, connection-bound SSE helper. It:

- Sets SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`) and `flushHeaders()` (`sse.ts:20`–24).
- Disables Nagle and clears socket timeout for immediate small-packet delivery (`sse.ts:27`–30).
- Tracks disconnect via `res.on('close')` **not** `req.on('close')` — the comment (`sse.ts:34`–36) explains that in Node 20 `req`'s `'close'` fires when the request body is consumed, whereas `res`'s `'close'` fires on actual socket close.
- Starts a 15 s heartbeat comment `: ping ...` (`sse.ts:57`) and emits an initial `stream:start` event (`sse.ts:62`).
- Returns `{ send, end, error, isDisconnected, sessionId, metrics }`. `send` frames `data: <json>\n\n`, tracks event count/bytes and TTFT (`sse.ts:78`–89). `end`/`error` clear the heartbeat, emit `stream:done`/`stream:error`, and `res.end()`. `_write` is guarded against `disconnected`/`writableEnded` and swallows write errors by marking disconnected (`sse.ts:44`–54).

This is for endpoints that stream directly on the response of a single request.

#### 5.10.2 Buffered stream sessions — `lib/http/utils/sse-sessions.ts`

`SseSessionRegistry` (`sse-sessions.ts:32`) supports the **two-request** pattern documented in its header (`sse-sessions.ts:1`–14): `POST /chat/stream` creates a session and runs the agent in the background, returning `{sessionId}`; a later `GET /chat/events/:sessionId` opens an EventSource that **replays buffered events and streams live ones**. The comment (`sse-sessions.ts:8`–11) explains why native `EventSource` is used over `fetch`+`ReadableStream` (browser fetch buffers small SSE bodies).

Each session (`create`, `sse-sessions.ts:65`) has: `buffer` (all events, for replay), `completed` flag, `send(event)` (buffer + emit), `end(donePayload)` (emit `stream:done`, mark complete, schedule delete after `COMPLETED_KEEP = 60 s`), `error(message, code)` (emit `stream:error`), and `on(handler)` returning an unsubscribe. TTLs: `SESSION_TTL = 5 min` hard cleanup (`sse-sessions.ts:19`, scheduled at create `sse-sessions.ts:131`); `COMPLETED_KEEP = 60 s` post-completion retention for reconnects (`sse-sessions.ts:21`).

Lifecycle management is the notable design: timers live in the registry's `#timers` set and each `setTimeout` is `unref()`-ed so it never keeps the process alive (`sse-sessions.ts:53`–63); `clear()` (`sse-sessions.ts:45`) cancels all timers and drops all sessions. A lazily-created process-default registry (`getDefaultSseSessionRegistry`, `sse-sessions.ts:140`) backs the module-level `createStreamSession`/`getStreamSession` functions (`sse-sessions.ts:155`, `161`) that routes consume, and `resetDefaultSseSessionRegistry` (`sse-sessions.ts:146`) supports test/shutdown teardown. Per-connection listener disposal (unsubscribe on `stream:done`/`stream:error` and on `res 'close'`) is left to the route layer, per the comment at `sse-sessions.ts:24`–31. Consumers include `ai.ts` (verified: imports `createStreamSession`/`getStreamSession` at `lib/http/routes/ai.ts:51` and uses them at `ai.ts:952`).

**Streaming vs shutdown link:** both SSE styles integrate with the server-lifecycle tracker (§5.2). `HttpServer.trackRequestLifecycle` classifies a request as streaming by `/stream` or `/events/` in the path (`HttpServer.ts:208`), and `closeActiveStreamingResponses` sends the `event: shutdown` frame on stop.

---

### 5.11 Response shaping helpers

Two helper modules normalize how routes return AI/tool results and dashboard operations, so the wire contract stays consistent with §5.9.

#### 5.11.1 Tool-envelope responses — `lib/http/utils/tool-envelope-response.ts`

`httpStatusForToolEnvelope(status)` (`tool-envelope-response.ts:4`) maps `@alembic/agent`'s `ToolResultStatus` to HTTP: `blocked→403`, `needs-confirmation→409`, `timeout→504`, `aborted→499`, `error→500`, `partial→206`, `success→200`, with an exhaustiveness guard `assertNeverToolResultStatus` (`tool-envelope-response.ts:51`) that throws on an unhandled status (compile-time `never` enforcement).

`sendToolEnvelopeResponse(res, envelope)` (`tool-envelope-response.ts:26`): if `envelope.ok`, sets the status (only if ≠200) and returns `{success:true, data: envelope}`; otherwise returns `{success:false, error:{code:'TOOL_<STATUS>', message, toolId, callId, status, diagnostics}, data: envelope}` (`tool-envelope-response.ts:37`). The `TOOL_<STATUS>` code is `envelope.status.toUpperCase().replaceAll('-', '_')` — e.g. `needs-confirmation → TOOL_NEEDS_CONFIRMATION`. The full envelope is always echoed under `data` so callers keep the raw agent result.

#### 5.11.2 Dashboard operations — `lib/http/utils/dashboard-operation.ts`

`executeDashboardOperation(container, req, toolId, args)` (`dashboard-operation.ts:33`) dispatches Dashboard operations **directly to a handler table**, bypassing the V2 `ToolRouter` because dashboard operations are not LLM tools (comment `dashboard-operation.ts:29`–32). Flow:

1. Dynamic-import `createDashboardOperationHandlers` + `DASHBOARD_OPERATION_MANIFESTS` from `#tools/adapters/DashboardOperations.js` (`dashboard-operation.ts:44`).
2. Dynamic-import AI-status helpers from `#inject/AiRuntimeStatus.js` and inject them into the handler factory — the comment (`dashboard-operation.ts:47`–51) notes this is an intentional **`http → injection` contract edge (AD4)** so the tools area no longer reaches into injection at runtime.
3. Look up the handler by `toolId`; unknown → error envelope (`dashboard-operation.ts:57`–60).
4. Build an `executionRequest` with the found manifest, args, and a context carrying `services: container`, actor derived from `req.resolvedSource`/`resolvedSourceActor`, `sessionId` from `x-session-id`, and `surface:'dashboard'`, with `decision:{allowed:true, stage:'execute'}` (`dashboard-operation.ts:62`–77).
5. Run the handler; on success build a success `ToolResultEnvelope` (`ok:true`, `status:'success'`, `text` = string data or pretty JSON, `structuredContent`, empty diagnostics, internal trust) (`dashboard-operation.ts:82`–93); on throw, build an error envelope via `errorEnvelope` (`dashboard-operation.ts:118`).

`sendDashboardOperationResponse(res, envelope)` (`dashboard-operation.ts:106`): on failure delegates to `sendToolEnvelopeResponse` (unified error path); on success returns `{success:true, data: envelope.structuredContent ?? envelope, toolResult: envelope}` — i.e. the dashboard-friendly `data` plus the full `toolResult`.

The default constants `EMPTY_DIAGNOSTICS` (`dashboard-operation.ts:10`) and `DEFAULT_TRUST` (`{source:'internal', sanitized:true, ...}`, `dashboard-operation.ts:22`) are the neutral diagnostics/trust stamped on dashboard-operation envelopes since these are internal, non-LLM operations.

#### 5.11.3 Route helpers — `lib/http/utils/routeHelpers.ts`

- `getContext(req)` (`routeHelpers.ts:13`) → `{userId, ip, userAgent}` from resolved source + headers (mirrors `operationContext` in entrypoint-safety).
- `safeInt(value, default, min=1, max=1000)` (`routeHelpers.ts:28`) — clamped integer parse for query params.
- `sanitizeForAPI(entryOrJson)` (`routeHelpers.ts:43`) — filters **system tags** (`dimension:*`, `bootstrap:*`) out of a `KnowledgeEntry` via `KnowledgeEntry.isSystemTag` (imported from `@alembic/core/knowledge`, `routeHelpers.ts:6`) before exposing it. `sanitizePaginatedForAPI` (`routeHelpers.ts:57`) maps this over a paginated `data` array. This is the host's API-surface hygiene layer over Core knowledge entities.

---

### 5.12 Destructive-operation safety — `lib/http/entrypoint-safety.ts`

Reusable guards for routes performing dangerous operations:

- `operationConfirmed(req, flagName='confirmed')` (`entrypoint-safety.ts:13`) — true if the flag is truthy in body **or** query; `booleanFlag` (`entrypoint-safety.ts:5`) accepts `true`/`'true'`/`'1'` and arrays containing them.
- `rejectUnlessConfirmed(req, res, operation, flagName)` (`entrypoint-safety.ts:17`) — if not confirmed, writes `400 {code:'OPERATION_CONFIRMATION_REQUIRED'}` and returns `false` (route should early-return).
- `rejectInProduction(res, operation)` (`entrypoint-safety.ts:36`) — in `NODE_ENV==='production'`, writes `403 {code:'OPERATION_DISABLED_IN_PRODUCTION'}` and returns `true`; otherwise returns `false`.
- `operationContext(req)` (`entrypoint-safety.ts:50`) — `{userId, ip, userAgent}` for audit.

These pair with the `confirmed` fields present in many request schemas (e.g. `BatchIds.confirmed`, `DisableRuleBody.confirmed`, `ImportFromRecipeBody.confirmed`) in §5.8.

---

### 5.13 Request logging — `lib/http/middleware/requestLogger.ts`

`requestLogger(logger)` (`requestLogger.ts:41`) logs on `res.on('finish')` (avoiding monkey-patching `res.send`). It captures `req.originalUrl` at middleware entry (`requestLogger.ts:45`) — the header comment (`requestLogger.ts:9`–14) explains that Express 4 subrouters temporarily rewrite `req.url`/`req.path` to a relative path during handler execution, so using `req.path` inside `finish` would mislog all subrouter requests as `GET /` and break `SILENT_PATHS` matching. Log levels:

- `SILENT_PATHS` (health, realtime events, sse, socket.io — `requestLogger.ts:27`) are fully suppressed (`requestLogger.ts:51`).
- Slow (`duration >= 1000 ms`) → `warn` with a "🐌慢请求" message (`requestLogger.ts:67`–69).
- Noisy (GET + 2xx/304 + <2000 ms) → `debug` (`requestLogger.ts:63`–71).
- Everything else → `info` (`requestLogger.ts:72`).

---

### 5.14 Notable algorithms, gotchas & edge cases

- **Dashboard mount route-stack surgery** (`mountDashboard`, `HttpServer.ts:565`): it reaches into Express internals (`app.router` for Express 5, fallback `app._router` for Express 4 — `HttpServer.ts:568`–574), pops the last two `layer.route` layers (the root `/` handler and the 404 catch-all) from the stack, injects `express.static(distDir)` + a SPA `index.html` fallback (skipping `/api` and `/socket.io`), then pushes the removed layers back so the 404 remains the final fallback (`HttpServer.ts:589`–616). If the router internals are unavailable it degrades to a non-reordering mount with a warning (`HttpServer.ts:575`–587). This is fragile against Express internal changes and is the reason the 404 was registered with `app.all('{*path}', ...)` (needs `layer.route`).
- **Ephemeral-port resolution:** binding to `port: 0` is supported; the actual port is read back from `server.address()` in `onListening` and written to `config.port` (`HttpServer.ts:393`–401).
- **`gateway.execute` failure → thrown `GatewayError`:** governance failures surface as thrown errors, so the terminal `errorHandler` (not the route) produces the HTTP response; a route calling `req.gw` must not swallow the throw if it wants the standard mapping.
- **`req.gw` typed non-optional but middleware-dependent** (`express.d.ts:11`).
- **CORS wildcard + credentials** mismatch (`HttpServer.ts:167`–179).
- **Timeout / streaming classification are substring heuristics on `req.path`** (`HttpServer.ts:191`, `HttpServer.ts:208`) — path naming conventions matter.
- **Two SSE styles** with different disconnect semantics; both must use `res.on('close')` not `req.on('close')` (`sse.ts:34`).
- **Provider manifest is a parallel truth** to the real mounts; drift is possible without the cross-check tests.
- **`errorHandler` details are dev-only** (`errorHandler.ts:39`); the richer `AlembicHttpProblem` object is a contract artifact, not what the terminal handler emits.

---

### 5.15 Boundary note — host-owned vs delegated

**Host-owned (implemented in this `Alembic/` main-body repo):**

- The entire Express app assembly, middleware chain ordering, router mounting, timeout policy, and graceful shutdown (`HttpServer.ts`).
- The Gateway **middleware** (`gatewayMiddleware.ts`) and the wiring that registers Gateway actions at boot (`HttpServer.registerGatewayActions`, `HttpServer.ts:228`). (The `Gateway` class and `GatewayActionRegistry` live in `lib/governance/gateway/` — still host repo, a different subsystem.)
- Request-source resolution and its trust policy (`sourceResolver.ts`), request logging (`requestLogger.ts`), zod validation middleware (`validate.ts`), and destructive-op guards (`entrypoint-safety.ts`).
- Both SSE mechanisms and the session registry/lifecycle (`sse.ts`, `sse-sessions.ts`).
- Response-shaping helpers (`tool-envelope-response.ts`, `dashboard-operation.ts`, `routeHelpers.ts`).
- The **provider contract manifest and OpenAPI generation** (`provider-contracts.ts`, `api-spec.ts`) — the host declares which routes/events/fixtures it exposes and generates the served spec, and the host **HTTP request schemas** (`http-requests.ts`).
- Static Dashboard hosting (`mountDashboard`) and the realtime EventBus→websocket bridge (`HttpServer.ts:410`–477).

**Delegated to `@alembic/core` (imported, not implemented here):**

- The **failure taxonomy** — `getCoreFailureTaxonomyEntry`, `CORE_FAILURE_*`, `CoreFieldFailureKind`, exposure/agent-branch/retry policies, `CORE_FAILURE_TAXONOMY_VERSION` (`problem-taxonomy.ts:1`–11, `provider-contracts.ts:1`–16). The host only assembles the problem object from these Core-owned facts.
- The **contract spine** — `CORE_CONTRACT_SPINE_ROWS`, `CORE_CONTRACT_SPINE_VERSION`, `CoreContractFunctionClass` (`provider-contracts.ts:1`–16); host row ids extend but derive from it.
- **Domain error classes** — `ValidationError`, `ConflictError`, `NotFoundError`, `PermissionDenied` (`errorHandler.ts:3`–8); the host only maps them to HTTP.
- **Knowledge field/enum vocabulary and `KnowledgeEntry`** — `KindEnum`, `TitleField`, `ContentSchema`, `ReasoningSchema`, etc., and `KnowledgeEntry.isSystemTag` (`mcp-tools.ts:12`–22, `routeHelpers.ts:6`).
- The **Logger** (`@alembic/core/logging`, `HttpServer.ts:9`, `sourceResolver.ts:8`).

**Delegated to `@alembic/agent` (imported, not implemented here):**

- The **tool-result envelope types** — `ToolResultEnvelope`, `ToolResultStatus`, `ToolResultDiagnostics`, `ToolResultTrust` (`tool-envelope-response.ts:1`, `dashboard-operation.ts:2`). The host maps agent statuses to HTTP and shapes the JSON response, but the envelope shape and status vocabulary are agent-owned.

The deep engine capabilities the product README calls "organs" (Recipe lifecycle state machine, Panorama, SignalBus, Guard rule engine, ProjectContext, ProjectRegistry/ProjectScope) are **not** implemented in these HTTP files — this layer is transport, governance-enforcement, validation, streaming, and contract declaration around them. Where a route needs engine behavior it goes through `req.gw` (Gateway → registered service) or dynamically-imported tool/adapter handlers, keeping the engine behind the Core/agent boundaries.


---


## 06. HTTP Routes — Knowledge, Search, Recipes, Candidates, AI

This section documents the **knowledge-plane HTTP API** of the Alembic main-body host: six Express routers that expose AI-provider orchestration, knowledge-entry CRUD + lifecycle, semantic/hybrid search, recipe relation-discovery, candidate AI refinement, and code-snippet extraction. All six are thin **host adapters**: they parse/validate the request, resolve a service from the dependency-injection container, delegate the actual work into `@alembic/core` (the "organism" engine) or `@alembic/agent` (the in-process agent runtime), and shape the HTTP response. Almost no domain logic lives here — the notable exceptions (fuzzy Recipe-ID resolution, the candidate-refine prompt + key-alias normalization, SSE session bridging, resident-search meta assembly) are host-owned glue and are called out below.

The files covered:

| File | Base mount | Purpose |
| --- | --- | --- |
| `lib/http/routes/ai.ts` | `/api/v1/ai` | AI provider mgmt, summarize/translate, RAG chat (+SSE stream), direct tool/task invocation, workspace LLM config, token usage |
| `lib/http/routes/knowledge.ts` | `/api/v1/knowledge` | Unified V3 knowledge-entry CRUD + 6-state lifecycle + batch ops + usage/quality |
| `lib/http/routes/search.ts` | `/api/v1/search` | Unified resident search (keyword/semantic/hybrid) + knowledge-graph queries + similarity |
| `lib/http/routes/recipes.ts` | `/api/v1/recipes` | Async AI batch discovery of Recipe→Recipe graph relations |
| `lib/http/routes/candidates.ts` | `/api/v1/candidates` | AI candidate bootstrap-refine + conversational refine (preview/apply, +SSE) |
| `lib/http/routes/extract.ts` | `/api/v1/extract` | Extract Recipe candidates from a file path or pasted text |

### 6.0 Mounting and shared plumbing

All six routers are default-exported `express.Router()` instances mounted in `HttpServer` under the `/api/v1` prefix (`lib/http/HttpServer.ts:244` defines `const apiPrefix = '/api/v1'`):

- `searchRouter` → `${apiPrefix}/search` (`lib/http/HttpServer.ts:283`)
- `aiRouter` → `${apiPrefix}/ai` (`lib/http/HttpServer.ts:286`)
- `extractRouter` → `${apiPrefix}/extract` (`lib/http/HttpServer.ts:289`)
- `candidatesRouter` → `${apiPrefix}/candidates` (`lib/http/HttpServer.ts:298`)
- `knowledgeRouter` → `${apiPrefix}/knowledge` (`lib/http/HttpServer.ts:307`)
- `recipesRouter` → `${apiPrefix}/recipes` (`lib/http/HttpServer.ts:310`)

The mounts are also declared in the machine-readable provider-contract registry (`lib/http/provider-contracts.ts:466-475`), all under registry row `I22` (the knowledge/AI plane; `search`, `ai`, `extract`, `candidates`, `knowledge`, `recipes` all mount there).

Shared middleware/helpers used across these files:

| Helper | File:line | Role |
| --- | --- | --- |
| `validate(schema)` | `lib/http/middleware/validate.ts:28` | Zod-parses `req.body`, replaces it with parsed+defaulted data, or returns `400 VALIDATION_ERROR` with `error.details = flatten()` |
| `validateQuery(schema)` | `lib/http/middleware/validate.ts:54` | Same for `req.query`; uses `Object.defineProperty` because Express 5 `req.query` is a read-only getter (`lib/http/middleware/validate.ts:69`) |
| `getContext(req)` / `operationContext(req)` | `lib/http/utils/routeHelpers.ts:13`, `lib/http/entrypoint-safety.ts:50` | Build `{ userId, ip, userAgent }` audit context; `userId` derives from `req.resolvedSourceActor \|\| req.resolvedSource \|\| 'http-request'` |
| `safeInt(value, default, min=1, max=1000)` | `lib/http/utils/routeHelpers.ts:28` | Bounded integer parse for paging params |
| `sanitizeForAPI` / `sanitizePaginatedForAPI` | `lib/http/utils/routeHelpers.ts:43`, `:57` | Strip internal system tags (`KnowledgeEntry.isSystemTag`, e.g. `dimension:*`/`bootstrap:*`) before returning entries |
| `rejectUnlessConfirmed(req,res,op)` | `lib/http/entrypoint-safety.ts:17` | Guards destructive/publish ops: requires `confirmed:true` in body or query else `400 OPERATION_CONFIRMATION_REQUIRED` |
| `sendToolEnvelopeResponse` / `httpStatusForToolEnvelope` | `lib/http/utils/tool-envelope-response.ts:26`, `:4` | Map an `@alembic/agent` `ToolResultEnvelope` status to an HTTP code and body |
| `createStreamSession` / `getStreamSession` | `lib/http/utils/sse-sessions.ts:155`, `:161` | SSE session registry (buffer + EventEmitter) used by chat-stream and refine-stream |

**Response envelope convention.** Every route returns `{ success: boolean, data?, error?, warning?, message? }`. Success is almost always `200` (or `201` on knowledge create, `lib/http/routes/knowledge.ts:187`). Tool-envelope routes are the exception (see 6.6).

**Tool-envelope → HTTP status mapping** (`lib/http/utils/tool-envelope-response.ts:4-24`): `blocked→403`, `needs-confirmation→409`, `timeout→504`, `aborted→499`, `error→500`, `partial→206`, `success→200`. When `envelope.ok` is true the body is `{ success:true, data: envelope }`; otherwise `{ success:false, error:{ code:'TOOL_<STATUS>', message, toolId, callId, status, diagnostics }, data: envelope }` (`:37`).

**AI readiness gate.** Several routes require a real (non-mock) provider. `getAiRuntimeStatus(container)` (`lib/injection/AiRuntimeStatus.ts:33`) reads `container.singletons._aiProviderManager` + `.aiProvider`; it is `ready` only when both exist and `manager.isReady === true` and neither is `mock`. A `mock` provider is an explicit disabled state (`reason:'mock-provider-disabled'`), not a fallback. `getAiUnavailableMessage` (`:59`) produces the user-facing Chinese message. In `ai.ts`, `requireAiReady()` (`lib/http/routes/ai.ts:137`) throws `ValidationError` (from `@alembic/core/shared`) when not ready.

### 6.1 `ai.ts` — AI provider & agent HTTP surface

**Responsibilities.** Provider discovery/probe/config, workspace LLM env-config read/write with hot-swap, three AI text ops (summarize/translate/chat), direct programmatic tool + predefined-task invocation, SSE streaming chat, UI-language preference, and token-usage reporting. This is the widest file and the primary bridge from HTTP to `@alembic/agent` (`agentService`, `toolRouter`, `capabilityCatalog`) and to the AI provider layer (`@alembic/agent/ai`).

#### Routes

| Method + Path | Purpose | Body/Query | Delegates to | Notes |
| --- | --- | --- | --- | --- |
| `GET /lang` | Current UI language | — | `container.getLang()` | defaults `'zh'` (`:214`) |
| `POST /lang` | Set UI language | `AiLangBody {lang}` | `container.setLang(lang)` | `:221` |
| `GET /providers` | Provider catalog + models + active + AI status | — | `getModelRegistry()`, `PROVIDER_CONFIGS` (`@alembic/agent/ai`) | filters out `mock` (`:244`); reports per-model contextWindow/reasoning/capabilities |
| `POST /probe` | Connectivity ping to a provider | `{provider, apiKey?}` | `createProvider(...).probe()` | measures `latencyMs`; **always returns `success:true`** with `status:'connected'\|'error'` (`:325`) |
| `GET /config` | Active provider/model + readiness | — | `getAiRuntimeStatus` | `isMock` hard-coded `false` (`:349`) |
| `POST /config` | Hot-switch provider/model | `AiConfigBody {provider,model}` | `createProvider` then `container.reloadAiProvider(...)` → `AiProviderManager.switchProvider()` | rejects `mock` (`:365`); invalid provider → `ValidationError` (`:377`) |
| `POST /summarize` | AI code summary | `AiSummarizeBody {code,language}` | `runScanAgentTask({task:'summarize'})` (`@alembic/agent/service`) | requires AI ready; `result.error`→`ValidationError` (`:424`) |
| `POST /translate` | zh→en of summary/usageGuide | `AiTranslateBody {summary,usageGuide}` | `runTranslationJson` (`@alembic/agent/service`) | **degrades gracefully**: on error returns original text + `warning` (`:461`,`:470`) |
| `POST /chat` | RAG chat (non-stream) | `AiChatBody {prompt,history,lang,conversationId,sseSessionId?}` | `agentService.run(...)` | persists conversation + token usage; broadcasts realtime token-usage event |
| `POST /agent/tool` | Direct tool call (skip ReAct) | `AiToolBody {tool,params}` | `toolRouter.execute({surface:'http'})` | gated by `ensureDirectToolAllowed`; returns tool envelope (`:626`) |
| `POST /agent/task` | Predefined DAG task or tool | `AiTaskBody {task,params}` | 5 DAG handlers OR `toolRouter.execute` | see DAG table below (`:639-700`) |
| `GET /agent/capabilities` | Tool schemas + presets + task list | — | `capabilityCatalog.toToolSchemas()`, `PRESETS` (`@alembic/agent/profiles`) | `:706` |
| `POST /format-usage-guide` | Plain-text markdown tidy | `AiFormatUsageGuideBody {text}` | **none (local regex)** | NOT an AI call — kept for API compatibility (`:751`) |
| `GET /env-config` | Read workspace LLM config (masked) | — | `WorkspaceSettingsStore.readAiConfig` + `collectAiEnvOverrides`/`maskAiEnvConfig` | `:808`; historical route name used by Dashboard |
| `POST /env-config` | Write workspace LLM config | `AiEnvConfigBody {provider,model,apiKey,proxy?,reasoningEffort?,embed*,providerKeys?}` | `WorkspaceSettingsStore.writeAiConfig` + process.env sync + hot-swap | rejects `mock` (`:835`); multi-provider keys via `PROVIDER_KEY_ENV` (`:852`) |
| `POST /chat/stream` | Start streaming chat session | `AiStreamBody {prompt,history,lang}` | `agentService.run(...)` (background) | returns `{success,sessionId}` immediately; runs Agent off-request (`:944`) |
| `GET /chat/events/:sessionId` | EventSource SSE consumer | — | `getStreamSession` | replay buffer → subscribe → 15s heartbeat (`:1074`) |
| `GET /token-usage` | Last-7-days token report | — | `tokenUsageStore.getLast7DaysReport()` | returns zeroed report if store missing (`:1152`) |

#### Predefined agent tasks (`POST /agent/task`)

`DAG_TASK_HANDLERS` (`lib/http/routes/ai.ts:639`) maps a task name to an `@alembic/agent/tasks` handler; if the `task` matches, it runs with a `taskContext` that wires `invokeToolEnvelope` back through `toolRouter.execute({surface:'system'})` (`:664`). If no DAG handler matches, it falls back to a direct tool execution (`:685`).

| Task name | Handler (from `@alembic/agent/tasks`) | Description shown by `/agent/capabilities` |
| --- | --- | --- |
| `check_and_submit` | `taskCheckAndSubmit` | Dedup + quality pre-eval before submit |
| `discover_all_relations` | `taskDiscoverAllRelations` | Batch discover knowledge-graph relations |
| `full_enrich` | `taskFullEnrich` | Batch AI field completion of candidates |
| `quality_audit` | `taskQualityAudit` | Batch quality audit, flag low scores |
| `guard_full_scan` | `taskGuardFullScan` | Full Guard-rule scan of given code |

#### Control flow: `POST /chat` (non-streaming RAG chat)

1. `requireAiReady()` → resolve `agentService` (`lib/http/routes/ai.ts:497`).
2. **Conversation load**: build a `ConversationStore` (`@alembic/agent/context`) rooted at `resolveDataRoot(container)`; if `conversationId` given, `load()` history and `append` the user turn, else `create()` a new conversation titled from the first 50 chars (`:504-513`). Any failure is swallowed (silent degrade, `:514`).
3. Call `agentService.run(createHttpChatAgentRunInput(...))`. `createHttpChatAgentRunInput` (`:62`) builds an `AgentRunInput` with `profile.preset='chat'`, message content/history/sessionId, `context.actor` derived from `req.resolvedSource`/`req.resolvedSourceActor`/`req.ip`, and an `onProgress` callback that forwards events to an SSE session if `sseSessionId` was supplied (`:526`).
4. **Persist assistant reply** into the ConversationStore (`:542`).
5. **Token accounting**: if `tokenUsageStore` + `result.usage` present, `record(...)` input/output tokens, then broadcast `broadcastTokenUsageUpdated()` via `getRealtimeService()`. All wrapped so token logging never breaks the request (`:551-578`).
6. Respond with `{reply, toolCalls, iterations, conversationId, tokenUsage}` (`:580`).

#### Control flow: SSE streaming chat (`POST /chat/stream` + `GET /chat/events/:sessionId`)

The two-phase SSE design (documented in the file header at `:920` and in `lib/http/utils/sse-sessions.ts`) exists because browser `fetch()+ReadableStream` buffers small SSE payloads; native `EventSource` does not (`lib/http/utils/sse-sessions.ts:9-11`).

- `POST /chat/stream` creates a session (`createStreamSession('chat')`), **immediately** responds `{success,sessionId}`, then runs `agentService.run(...)` in the background. Its `onProgress` maps internal agent events (`thinking`/`tool_call`/`tool_end`) to the SSE protocol events `step:start`/`tool:start`/`tool:end` (`lib/http/routes/ai.ts:971-995`). On resolution it emits `text:start`/`text:delta`/`text:end` then `session.end(...)`, and records token usage (`:999-1046`). On rejection it calls `session.error(...)` (`:1053`).
- `GET /chat/events/:sessionId` sets SSE headers, disables Nagle/timeout on the socket, **replays** the buffered events, closes if already done, else subscribes to live events until `stream:done`/`stream:error`, with a 15-second `: ping` heartbeat and `res.on('close')` cleanup (`:1074-1141`).

The SSE protocol event catalog (from the route header, `:924-940`):

| Event `type` | Payload |
| --- | --- |
| `step:start` / `step:end` | `{step, maxSteps, phase}` / `{step}` |
| `tool:start` / `tool:end` | `{id,tool,args}` / `{tool,status,resultSize?,duration?,error?}` |
| `text:start` / `text:delta` / `text:end` | `{id,role}` / `{id,delta}` / `{id}` |
| `stream:done` / `stream:error` | `{text,toolCalls,hasContext}` / `{message}` |

#### `env-config` gotchas

- `readLlmConfig()` (`:781`) merges `WorkspaceSettingsStore.readAiConfig().env` with process-env overrides (`collectAiEnvOverrides`), masks secrets (`maskAiEnvConfig`), and computes `llmReady` via `isAiEnvReady` unless the provider is `mock` (`:800`). `configSource` reports `'process-env'` / `'workspace-settings'` / `'empty'`.
- `POST /env-config` writes to both the settings store AND mutates `process.env` for hot effect (`:894`), then attempts a `reloadAiProvider` hot-swap; a failed swap is logged at `debug` and deferred to restart (`:910`). It supports multi-provider keys (`providerKeys` map keyed by provider id via `PROVIDER_KEY_ENV`) plus legacy single `apiKey`, and separate embedding-provider settings (`ALEMBIC_EMBED_*`, `:872`).

#### Direct-tool safety gate

`ensureDirectToolAllowed(capabilityCatalog, tool, ...)` (`:179`) looks up the tool's manifest; if no manifest exists it **allows** (returns true, `:188`); if the manifest lists surface `'http'` it allows; otherwise returns `403 TOOL_NOT_DIRECTLY_CALLABLE` with a reason (side-effect vs no http surface, `:193`). `createHttpToolRuntimeContext` (`:738`) supplies `{aiProvider, dataRoot, logger}` as the tool runtime context.

### 6.2 `knowledge.ts` — unified V3 knowledge CRUD + lifecycle

**Responsibilities.** This is the canonical entry/Recipe API (the file header notes it "replaces recipes.js + candidates.js" for CRUD, `lib/http/routes/knowledge.ts:1-5`). Every route resolves `container.get('knowledgeService')` and calls a method on it; the router adds only paging normalization, filter assembly, confirmation gating, tag sanitization, batch fan-out, and (for publish) a post-hoc search-surface refresh. **All lifecycle semantics live in the Core `KnowledgeService`** (`@alembic/core`).

#### Routes

| Method + Path | Purpose | Body/Query | `knowledgeService` method |
| --- | --- | --- | --- |
| `GET /` | List/filter/paginate (or keyword search) | query: `lifecycle,kind,category,language,knowledgeType,scope,keyword,tag,source,page,limit` | `.search(keyword,{page,pageSize})` if `keyword` else `.list(filters,{page,pageSize})` (`:46`,`:81`) |
| `GET /stats` | Aggregate stats | — | `.getStats()` (`:97`) |
| `GET /lifecycle` | 6-state counts + entries for transitional states | — | `.getStats()` + `.list({lifecycle},…)` (`:105`) |
| `POST /quality/refresh-all` | Recompute quality for ALL entries | (confirm) | loops `.updateQuality(id)` over `.list({},{pageSize:10000})` (`:140`) |
| `GET /:id` | Entry detail | — | `.get(id)` (`:169`) |
| `POST /` | Create entry (wire format) | `CreateKnowledgeBody` | `.create(data, context)` → `201` (`:186`) |
| `PATCH /:id` | Update (whitelist fields) | `UpdateKnowledgeBody` | `.update(id, body, context)` (`:203`) |
| `DELETE /:id` | Delete | (confirm) | `.delete(id, context)` (`:220`) |
| `PATCH /:id/publish` | pending→active | (confirm) | `.publish(id, context)` + `refreshKnowledgeSearchSurface` (`:239`) |
| `PATCH /:id/deprecate` | pending\|active→deprecated | `DeprecateKnowledgeBody {reason}` | `.deprecate(id, reason, context)` (`:270`) |
| `PATCH /:id/reactivate` | deprecated→pending | — | `.reactivate(id, context)` (`:285`) |
| `PATCH /:id/stage` | pending→staging | — | `.stage(id, context)` (`:299`) |
| `PATCH /:id/evolve` | active→evolving | — | `.evolve(id, context)` (`:313`) |
| `PATCH /:id/decay` | active\|evolving→decaying | — | `.decay(id, context)` (`:327`) |
| `PATCH /:id/restore` | decaying\|evolving→active | — | `.restore(id, context)` (`:341`) |
| `POST /batch-publish` | Batch pending→active | `BatchPublishBody {ids}` (confirm) | `Promise.allSettled(ids → ioLimit(.publish))` + search refresh (`:362`,`:372`) |
| `POST /batch-delete` | Batch delete | `BatchDeleteBody {ids}` (confirm) | `Promise.allSettled(ids → ioLimit(.delete))` (`:406`) |
| `POST /batch-deprecate` | Batch active→deprecated | `BatchDeprecateBody {ids,reason?}` (confirm) | `Promise.allSettled(ids → ioLimit(.deprecate))` (`:443`) |
| `POST /:id/usage` | Record adoption/application/guard_hit/view/success | `KnowledgeUsageBody {type,feedback}` | `.incrementUsage(id, type, {actor,feedback})` (`:483`) |
| `PATCH /:id/quality` | Recompute one entry's quality | — | `.updateQuality(id, context)` (`:498`) |

The six lifecycle states are enumerated in `/lifecycle` (`lib/http/routes/knowledge.ts:110`): `pending, staging, active, evolving, decaying, deprecated`. Only the transitional states (`staging, evolving, decaying`) return entry details (capped at 20 each, `:122-131`).

#### Notable mechanics / gotchas

- **Confirmation gate**: all destructive or publishing ops (`quality/refresh-all`, `DELETE`, `publish`, `batch-*`) require `confirmed:true` via `rejectUnlessConfirmed` (`:141`,`:212`,`:231`,`:353`,`:397`,`:434`). Non-destructive transitions (deprecate/reactivate/stage/evolve/decay/restore, usage, single-quality) are **not** gated.
- **Batch fan-out** uses `Promise.allSettled` + `ioLimit` (from `@alembic/core/shared`) to bound concurrency, then splits into `published/deprecated/deleted` vs `failed` (id + reason.message) arrays (`:362-390`).
- **Search-surface refresh after publish** (`refreshKnowledgeSearchSurface`, `:509`): after publishing (single or batch), the route best-effort refreshes the search index (`searchEngine.refreshIndex({force:true})`) and reconciles the vector store (`vectorService.syncCoordinator.reconcile()`), returning a `searchFreshness` report describing whether each was `attempted`/`refreshed`/`reconciled` and any error. Both are guarded so a missing service or thrown error degrades to `attempted:false`. This is a host-owned coordination concern (index freshness), distinct from the Core lifecycle transition itself.
- **Tag sanitization**: list/detail/CRUD responses run through `sanitizeForAPI`/`sanitizePaginatedForAPI` to hide internal `dimension:*`/`bootstrap:*` system tags (`lib/http/utils/routeHelpers.ts:43-68`).
- **Publish response** attaches a `publication:{route:'admin/controller',confirmed:true,lifecycle:'active'}` marker plus the `searchFreshness` report (`:245-251`).

### 6.3 `search.ts` — unified resident search + graph + similarity

**Responsibilities.** A single "resident search" surface over the Core `searchEngine`, plus knowledge-graph read routes over `knowledgeGraphService` and a candidate-similarity route over a Core service function. The interesting host logic here is entirely in **observability meta-assembly and a legacy fallback path**; the ranking/semantic/vector work is Core-owned.

#### Routes

| Method + Path | Purpose | Body/Query | Delegates to |
| --- | --- | --- | --- |
| `GET /` | Unified search | `SearchQuery` (`q,type,mode,limit,page,groupByKind,category,dimensionId,kind,knowledgeType,language,scope,tags/tag`) | `handleResidentSearch` → `searchEngine.search` (`:129`) |
| `POST /` | Unified search (body variant) | `ResidentSearchBody` (adds `filters`, `rank`, `query` alias) | `handleResidentSearch` (`:151`) |
| `GET /graph` | Graph edges for a node | `GraphQuery {nodeId,nodeType,relation?,direction=both}` | `graphService.getRelated` or `.getEdges` (`:628`) |
| `GET /graph/impact` | Impact analysis (BFS) | `GraphImpactQuery {nodeId,nodeType,maxDepth}` | `graphService.getImpactAnalysis(...,maxDepth)` (`:653`) |
| `GET /graph/all` | Full edge set for viz | `{limit=500,nodeType?}` | `graphService.getAllEdges(limit*10,...)` + UUID filter (`:677`) |
| `GET /graph/stats` | Graph stats | `{nodeType?}` | `graphService.getStats(nodeType)` (`:749`) |
| `POST /similarity` | Candidate ↔ Recipe similarity | `SimilarityBody {code}\|{targetName,candidateId}\|{candidate:{...}}` | `findSimilarRecipes(dataRoot, candidateObj)` (`@alembic/core/service/candidate`) (`:773`) |

#### Control flow: `handleResidentSearch` (`lib/http/routes/search.ts:176`)

1. `normalizeSearchFilters(...)` (host util `lib/shared/search-filters.ts`) → `NormalizedSearchFilters`; `toSearchFilterRecord(...)` flattens to a record for the engine (`:183-193`).
2. Call `searchEngine.search(query, {type,limit,mode,groupByKind,rank?,...filterRecord})` (`:200`). The route notes it is **direct-search only** — no prime/intent context is injected (that belongs to prime-owned routes, `:195-196`).
3. Build a `ResidentSearchMeta` via `buildResidentSearchMeta` (`:209`,`:358`) and respond `{success,data:{...result,query,searchMeta}}`.
4. **On engine failure**, log a warn and fall to `buildSearchCompatibilityFallback` (`:224`,`:248`), returning a legacy shape (`recipes`/`candidates`/`rules` pages) plus `buildLegacySearchMeta` (`:429`).

#### `ResidentSearchMeta` — semantic/vector truth and gotchas

`ResidentSearchMeta` (`lib/http/routes/search.ts:81-118`) is the observability envelope Dashboard uses to show whether semantic/vector search actually happened. Key rules encoded here:

- **Core `searchMeta` is the sole source of truth** for `semanticUsed`/`vectorUsed`. The route only *infers* when Core omits the boolean (`:379-386`). The comment at `:376-378` warns explicitly: do NOT infer semantic usage from `rrf`/`hybrid` mode strings, because after an embedding failure a sparse-only RRF would be mis-reported as a real vector hit. `inferLegacySemanticUsageWithoutRrf` (`:570`) therefore matches only `semantic`/`hybrid`, never `rrf`.
- `degraded` is set when Core reports a `fallbackReason` OR when semantic was requested but not used (`:388`).
- `readVectorStats` (`:492`) queries `vectorService.getStats()`; vector is `available` only when `count>0 && dimension>0 && embedProviderAvailable` (`:516`).
- `buildSearchWorkspaceIdentity` (`:539`) resolves the active workspace via `container.singletons._workspaceResolver` or `resolveAlembicWorkspace(projectRoot)` (host `ProjectScopeRegistry`), reporting dataRoot/databasePath/projectId/projectScope/mode; on failure it returns a null-filled shape (`:557`).

#### `GET /graph/all` gotchas

- Fetches `limit*10` raw edges then filters to **UUID-only nodes** (regex at `:696`) to drop AI-generated phantom nodes (class-name refs etc.), slicing to `limit` *after* filtering so non-UUID edges can't starve the quota (`:691-699`).
- Enriches node labels by looking up `knowledgeRepository.findById(id)` for recipe/knowledge nodes, returning `{edges,nodeLabels,nodeTypes,nodeCategories}` (`:717-742`).
- All graph routes **degrade to empty results** when `knowledgeGraphService` is unregistered (`:637`,`:663`,`:683`,`:753`).

#### `POST /similarity` gotchas

- Accepts three input shapes (raw `code`, stored `candidateId`+`targetName`, or inline `candidate`), normalizes to a `{title,summary,code,usageGuide}` object (`:787-821`), resolves `dataRoot` (falling back to `ALEMBIC_PROJECT_DIR`/cwd), then calls the Core `findSimilarRecipes(dataRoot, candidateObj, {threshold:0.3, topK:10})` (dynamic import from `@alembic/core/service/candidate`, `:828`). Missing candidate or a thrown error returns `{similar:[]}` (`:823`,`:841`).

### 6.4 `recipes.ts` — async AI Recipe relation discovery

**Responsibilities.** After the CRUD split, this router owns only Recipe-specific batch AI work: kicking off (and polling) an async job that asks the agent to discover Recipe→Recipe knowledge-graph relations, then writing the discovered edges into the graph. It holds **module-level task state** and contains a non-trivial **host-owned fuzzy ID resolver** — the most algorithmically interesting code in this section.

#### Routes

| Method + Path | Purpose | Body/Query | Delegates to |
| --- | --- | --- | --- |
| `POST /discover-relations` | Start async relation discovery | `DiscoverRelationsBody {batchSize?≤100,default20}` (confirm) | `runRelationDiscovery({agentService,batchSize})` (`@alembic/agent/service`) (`:82`) |
| `GET /discover-relations/status` | Poll job status | — | reads module `discoverTask` (`:369`) |

#### Async job model

State lives in a single module-scoped `discoverTask` object (`lib/http/routes/recipes.ts:47`, typed `DiscoverRelationsTask` at `:35`) with `status: idle|running|done|error`, counters (`discovered,totalPairs,batchErrors`), timing, and message. `resetTask()` (`:59`) reinitializes it. This is explicitly "single-instance sufficient" (`:33`). `POST` returns `{status:'running'}` if a job is already running (`:92`), and the `GET` status route recomputes live `elapsed` for running jobs (`:373`).

Pre-flight checks before starting (`:106-144`):
1. `agentService` must resolve (else `{status:'error'}`).
2. `getAiRuntimeStatus` must be ready (else `{status:'error'}` with the unavailable message).
3. At least 2 consumable Recipes — `knowledgeRepository.countByLifecycles(COUNTABLE_LIFECYCLES)` (from `@alembic/core/knowledge`) `< 2` → `{status:'empty'}` (`:132`).

Then it flips `discoverTask.status='running'`, responds `{status:'started'}` immediately, and runs the discovery in a **detached async IIFE** (not awaited, `:152`).

#### Host-owned algorithm: `resolveId` fuzzy matching (`:234-300`)

Because the agent returns relation endpoints as free text (UUID, title, trigger, or a paraphrased title), the route resolves each to a real Recipe ID via a 5-stage cascade, with a per-call `cache`:
1. Direct UUID membership (`idSet`, `:249`).
2. Exact title match (`byTitle`, `:255`).
3. Exact trigger match (`byTrigger`, `:259`).
4. Substring title containment either direction (`:264`).
5. **Jaccard token similarity ≥ 0.3** over tokenized `title + trigger` (`:274-293`). `tokenize` (`:198`) splits English/numeric words via `/[a-z0-9_]+/g` and treats each CJK char (`charCode > 0x4e00`) as a token; `similarity` (`:215`) is `|A∩B| / |A∪B|`.

Resolved pairs are written with `graphService.addEdge(fromId,'recipe',toId,'recipe',rel.type,{weight:0.7,source:'ai-discovery',evidence})` (`:311`); unresolved endpoints are skipped and counted into `batchErrors = relations.length - written` (`:331`). On completion/error the task fields and `elapsed` are finalized (`:327-350`).

**Gotcha**: because state is module-global and the job is fire-and-forget, discovery is not multi-tenant/multi-project safe; it assumes a single daemon serving one project. The `GET /discover-relations/status` route carries the annotation `AO1 route-input-exempt` (`:368`) noting it consumes no body/query/params.

### 6.5 `candidates.ts` — AI candidate refinement

**Responsibilities.** AI-driven refinement of candidate knowledge entries: a batch "bootstrap-refine", and a conversational refine flow (preview / streamed preview / apply). The router owns the **prompt engineering** (`buildRefinePrompt`) and the **AI-output normalization** (`buildUpdateFromRefineResult`) — substantial host logic — while the actual model call goes to `container.get('aiProvider')` and persistence to Core's `knowledgeService.update`.

#### Routes

| Method + Path | Purpose | Body/Query | Delegates to |
| --- | --- | --- | --- |
| `POST /bootstrap-refine` | AI polish batch bootstrap candidates | `BootstrapRefineBody {candidateIds?,userPrompt?,dryRun?}` (confirm unless dryRun) | dynamic-imported `bootstrapRefine(ctx,...)` from `lib/service/bootstrap/BootstrapRefine.js` (`:34-55`) |
| `POST /refine-preview` | AI polish one candidate → before/after | `RefinePreviewBody {candidateId,userPrompt}` | `aiProvider.chatWithStructuredOutput(prompt,{temperature:0.3})` (`:320`) |
| `POST /refine-preview-stream` | Streaming preview (SSE) | `RefinePreviewBody` | `aiProvider.chatWithStructuredOutput` off-request via `createStreamSession('refine')` (`:370`) |
| `GET /refine-preview/events/:sessionId` | EventSource SSE consumer | — | `getStreamSession` (`:511`) |
| `POST /refine-apply` | Persist a refine result | `RefineApplyBody {candidateId,userPrompt?,preview?}` (confirm) | prefers client `preview`, else re-calls AI; then `knowledgeService.update` (`:585`) |

> Note: the old `POST /candidates/enrich` route was deleted in the "Train B DCR" wave (zero external consumers), documented in the source comment at `lib/http/routes/candidates.ts:23-25`.

#### Host-owned logic

- `extractBeforeFields(json)` (`:63`) projects a `KnowledgeEntry.toJSON()` into the DiffView `before` shape (`title,description,pattern,markdown,rationale,tags,confidence,relations,aiInsight,agentNotes`), reaching into nested `content.*` and `reasoning.confidence`.
- `buildRefinePrompt(before,userPrompt)` (`:83`) constructs a strict Chinese prompt mandating a **9-key JSON contract** (`description,pattern,markdown,rationale,tags,confidence,aiInsight,agentNotes,relations`), maps UI subtitle names to keys, truncates pattern/markdown to 3000 chars (`:122`,`:125`), and forbids touching unrequested fields.
- `buildUpdateFromRefineResult(before,parsed)` (`:165`) is the tolerance layer: a large `KEY_ALIASES` map (`:170`, incl. Chinese aliases like `摘要→description`, `代码→pattern`) normalizes loose AI keys onto the 9 canonical keys, backfills missing keys from `before` (`:245`), and diffs each field to produce `{after, updateData, changed}`. Nested fields are flagged with sentinel keys (`_patternChanged`, `_markdownChanged`, `_rationaleChanged`, `_confidenceChanged`) so the apply step can route them into `content.*` / `reasoning.confidence`.
- **Apply routing** (`refine-apply`, `:625-660`): after diffing, it strips sentinel keys and rebuilds a `finalUpdate` where pattern/markdown/rationale go into a `content` patch and confidence into a `reasoning` patch, then persists via `knowledgeService.update(candidateId, finalUpdate, operationContext(req))`. If nothing changed, no update is issued (`:663`).

#### SSE refine-preview gotchas

`POST /refine-preview-stream` (`:370`) immediately returns `{sessionId}`, then in a `setImmediate` runs the AI call with a **staged progress heartbeat** (messages at 3s/8s/16s/28s, plus a 15s recurring "still processing" tick, `:405-432`) and a **120s hard timeout** via `Promise.race` (`:447-452`). If `chatWithStructuredOutput` yields nothing, it **falls back to `aiProvider.chat` + manual JSON extraction** (strip code fences, regex-match the first `{...}`, `:470-488`). The EventSource consumer (`:511`) reuses the exact replay→subscribe→heartbeat pattern from `ai.ts`. All refine routes require a real provider (reject on `!aiProvider || !aiStatus.ready || aiProvider.name==='mock'`, `:327`,`:380`).

### 6.6 `extract.ts` — Recipe candidate extraction

**Responsibilities.** Extract Recipe candidates from a file path or pasted text, with a **layered pipeline**: deterministic Recipe-Markdown parse first (Core `recipeParser`), AI extraction second (`@alembic/agent/service`), raw/basic fallback last. Pure host orchestration; both the parser and the agent task are external.

#### Routes

| Method + Path | Purpose | Body | Pipeline |
| --- | --- | --- | --- |
| `POST /path` | Extract from a file path | `ExtractPathBody {relativePath,projectRoot?}` | `recipeParser.extractFromPath` → (if raw fallback) `runScanAgentTask({task:'extract'})` → raw items (`:54`) |
| `POST /text` | Extract from pasted text/clipboard | `ExtractTextBody {text,language?,relativePath?,projectRoot?}` | `recipeParser.parseFromText` → AI extract → `recipeParser.extractFromText` basic fallback (`:135`) |

#### Control flow: `POST /path` (`lib/http/routes/extract.ts:54`)

1. Resolve `projectRoot` from body → `container.singletons._projectRoot` → `process.cwd()` (`:64`), logged with its source.
2. `recipeParser.extractFromPath(relativePath,{projectRoot})` (`:72`).
3. Detect **raw fallback** (parser returned items with no `summary`/`usageGuide`/`frontmatter.title`, `:79`) → if so, run AI extraction via `runAiExtract` (`:22`, which calls `runScanAgentTask` with `task:'extract', comprehensive:true`). Success (non-error, non-empty `recipes[]`) returns those (`:104`).
4. Otherwise return the parser items with `isMarked` (`:120`).

#### Control flow: `POST /text` (`:135`)

1. Try `recipeParser.parseFromText(text,{language,relativePath})`; success returns immediately with `source:'text'` (`:148-159`).
2. On parse failure, infer language via `LanguageService.inferLang`/`extForLang` (from `@alembic/core/shared`), synthesize a filename (`clipboard<ext>` if none), and run AI extraction; multi-recipe results tag `recipes[0]._multipleCount` for the frontend (`:189`).
3. If AI also fails, fall back to `recipeParser.extractFromText(text,{language})` (basic code-block extraction, `:208`).

`runAiExtract` (`:22`) is the shared helper wiring `agentService` + `systemRunContextFactory` into `runScanAgentTask`; parse failures only log a warn and let the caller fall through (`:45`).

### 6.7 Emitted events, DB tables, external interfaces

**Realtime/socket events** emitted from this plane:
- `broadcastTokenUsageUpdated()` via `getRealtimeService()` after chat token recording (`lib/http/routes/ai.ts:571`, `:1038`) — notifies Dashboard of token-usage changes.

**SSE streams** (HTTP, not socket.io): `GET /api/v1/ai/chat/events/:sessionId` and `GET /api/v1/candidates/refine-preview/events/:sessionId`, protocol events per the tables above.

**Persistence** touched via services (all schemas/tables owned by `@alembic/core` repositories, not by these routes):
- Knowledge entries + lifecycle + usage + quality: via Core `KnowledgeService`/`KnowledgeRepository`.
- Knowledge graph edges: via Core `KnowledgeGraphService` (`addEdge`/`getEdges`/`getStats`).
- Token usage: via Core `TokenUsageStore` (`tokenUsageStore.record` / `getLast7DaysReport`).
- Conversations: via `@alembic/agent`'s `ConversationStore` (rooted at `resolveDataRoot`).
- Workspace LLM config: via Core `WorkspaceSettingsStore` (settings + secrets files) and `process.env`.

**Exported symbols** (beyond the default routers) — `ai.ts` re-exports `httpStatusForToolEnvelope`/`sendToolEnvelopeResponse` (`lib/http/routes/ai.ts:54-57`) and exports helpers `createHttpChatAgentRunInput` (`:62`), `ensureAiConfigUpdateAllowed` (`:160`), `ensureDirectToolAllowed` (`:179`) for tests/reuse. The other five files export only their default router.

### 6.8 Boundary note — host-owned vs delegated

**Host-owned in this repo (the six route files + their helpers):**
- HTTP request/response shaping, Zod validation (`validate`/`validateQuery`), paging (`safeInt`), confirmation gating (`rejectUnlessConfirmed`), and tag sanitization for API output.
- The **DI wiring**: every route resolves services from `getServiceContainer()` (`lib/injection/ServiceContainer.ts`); the typed service registry `ServiceMap` (`lib/injection/ServiceMap.ts`) is host-owned even though most *service types* it maps are imported from Core.
- **AI-readiness gate** (`lib/injection/AiRuntimeStatus.ts`) and mock-provider rejection semantics.
- **SSE session bridging** (`lib/http/utils/sse-sessions.ts`), the two-phase stream protocol, heartbeats, and event-shape mapping from agent-internal events → SSE protocol.
- **Resident-search observability meta** (`ResidentSearchMeta`, `buildResidentSearchMeta`, workspace identity, vector-stats reading) and the **legacy compatibility fallback** in `search.ts`.
- The **fuzzy Recipe-ID resolver + Jaccard tokenizer** and async job state in `recipes.ts`.
- The **candidate-refine prompt, key-alias normalization, and content/reasoning apply-routing** in `candidates.ts`.
- The **layered extract pipeline orchestration** (parse → AI → raw fallback) in `extract.ts`.
- **Post-publish search-surface refresh coordination** (`refreshKnowledgeSearchSurface`) and realtime token-usage broadcast.
- Workspace LLM config read/write, masking, and provider hot-swap (`AiProviderManager` invoked via `container.reloadAiProvider`).

**Delegated to `@alembic/core` (engine — NOT implemented here):**
- `KnowledgeService` (all CRUD + the 6-state lifecycle transitions publish/deprecate/reactivate/stage/evolve/decay/restore/create/update/delete/incrementUsage/updateQuality/getStats/search/list) — imported type from `@alembic/core/knowledge` (`lib/injection/ServiceMap.ts:42`,`:127`); the source lives at `AlembicCore/src/service/knowledge/KnowledgeService.ts`.
- `SearchEngine` / `HybridRetriever` (`@alembic/core/search`) — the actual keyword/semantic/hybrid ranking, RRF, and the authoritative `searchMeta` truth.
- `KnowledgeGraphService`, `KnowledgeRepository`, `TokenUsageStore` (`@alembic/core/knowledge`, `@alembic/core/repositories`).
- `VectorService` / vector index + `syncCoordinator.reconcile` (`@alembic/core/vector`).
- `RecipeParser` (`@alembic/core/service/recipe`) and `findSimilarRecipes` (`@alembic/core/service/candidate`).
- `WorkspaceSettingsStore`, `LanguageService`, `ioLimit`, `ValidationError`, env-config helpers (`@alembic/core/shared`); workspace resolution (`resolveDataRoot`/`resolveProjectRoot`, `@alembic/core/workspace`).

**Delegated to `@alembic/agent` (in-process agent runtime — NOT implemented here):**
- `AgentService.run(...)` (the ReAct/agent loop behind `/ai/chat`, `/ai/chat/stream`).
- Provider layer `createProvider`/`getModelRegistry`/`PROVIDER_CONFIGS` (`@alembic/agent/ai`) and `PRESETS` (`@alembic/agent/profiles`).
- `runScanAgentTask` (summarize/extract), `runTranslationJson`, `runRelationDiscovery` (`@alembic/agent/service`).
- The 5 predefined task DAGs `taskCheckAndSubmit`/`taskDiscoverAllRelations`/`taskFullEnrich`/`taskQualityAudit`/`taskGuardFullScan` (`@alembic/agent/tasks`).
- `ConversationStore` (`@alembic/agent/context`); `toolRouter`/`capabilityCatalog` and the `ToolResultEnvelope` contract (`@alembic/agent`).

In short: these files are the **HTTP façade over the knowledge/AI plane**. They translate REST/SSE semantics into service calls and back, add operational safety (confirmation gates, AI-readiness checks, search-index freshness, SSE lifecycle) and a few host-specific algorithms (fuzzy ID resolution, refine prompt/normalization, search meta), but the knowledge lifecycle, search ranking, graph model, vector store, recipe parsing, and agent execution all live in the sibling Core and Agent packages.


---


## 07. HTTP Routes — Jobs, Daemon, Modules, Evolution, Guard, Governance & More

### 07.0 Scope & Role

This section documents the **operations-plane HTTP route modules** of the Alembic main-body host (npm package `alembic-ai`). These Express routers back the local daemon's REST surface consumed by the Dashboard, the CLI, and external hosts (Codex/CC plugin, IDE). They are the control surface for: asynchronous AI job control, daemon/runtime status, the module explorer, the Recipe evolution/lifecycle inbox, Guard file checking and rule management, governance service reads, signal/report reads, project-level Skills, the Repo Wiki, project + project-scope management, the file-change feed, ad-hoc command execution, audit/log reads, health probes, and Guard violation records.

Every router in this section lives under `lib/http/routes/*.ts`. They are **thin host adapters**: they parse/validate HTTP input, resolve a service from the DI container (`getServiceContainer()`), delegate the actual work to a host service or a `@alembic/core` engine, and shape a JSON envelope. The heavy "organism" logic (decay detection, staging promotion, proposal execution, Guard rule engine, signal trace, report store) is **implemented in `@alembic/core`** and merely *wired and invoked* here. See the per-domain Boundary notes and the consolidated §07.20.

All routers are mounted by `HttpServer` under the prefix `/api/v1` (`lib/http/HttpServer.ts:244`). The mount table:

| Router import | Mount path | File |
|---|---|---|
| `healthRouter` | `/api/v1/health` | `routes/health.ts` (`HttpServer.ts:252`) |
| `daemonRouter` | `/api/v1/daemon` | `routes/daemon.ts` (`HttpServer.ts:255`) |
| `jobsRouter` | `/api/v1/jobs` | `routes/jobs.ts` (`HttpServer.ts:258`) |
| `projectsRouter` | `/api/v1/projects` | `routes/projects.ts` (`HttpServer.ts:261`) |
| `projectScopeRouter` | `/api/v1/project-scope` | `routes/project-scope.ts` (`HttpServer.ts:264`) |
| `guardRouter` | `/api/v1/guard` | `routes/guard.ts` (`HttpServer.ts:277`) |
| `guardRuleRouter` | `/api/v1/rules` | `routes/guardRules.ts` (`HttpServer.ts:280`) |
| `commandsRouter` | `/api/v1/commands` | `routes/commands.ts` (`HttpServer.ts:292`) |
| `skillsRouter` | `/api/v1/skills` | `routes/skills.ts` (`HttpServer.ts:295`) |
| `modulesRouter` | `/api/v1/modules` | `routes/modules.ts` (`HttpServer.ts:301`) |
| `violationsRouter` | `/api/v1/violations` | `routes/violations.ts` (`HttpServer.ts:304`) |
| `wikiRouter` | `/api/v1/wiki` | `routes/wiki.ts` (`HttpServer.ts:313`) |
| `governanceRouter` | `/api/v1/governance` | `routes/governance.ts` (`HttpServer.ts:316`) |
| `evolutionRouter` | `/api/v1/evolution` | `routes/evolution.ts` (`HttpServer.ts:319`) |
| `fileChangesRouter` | `/api/v1/file-changes` | `routes/file-changes.ts` (`HttpServer.ts:322`) |
| `signalsRouter` | `/api/v1/signals` | `routes/signals.ts` (`HttpServer.ts:325`) |
| `auditRouter` | `/api/v1/audit` | `routes/audit.ts` (`HttpServer.ts:328`) |
| `logsRouter` | `/api/v1/logs` | `routes/logs.ts` (`HttpServer.ts:331`) |

> `ai`, `candidates`, `extract`, `knowledge`, `recipes`, `search` routers are mounted by the same `HttpServer` but are covered in other sections. Only the 18 routers above are in this section's scope.

### 07.1 Shared Route Infrastructure

Before the per-domain reference, four cross-cutting mechanisms are used by nearly every route in this section.

#### 07.1.1 Zod validation middleware (`lib/http/middleware/validate.ts`)

Three factories produce Express middleware that `safeParse` a request part against a Zod schema; on failure they short-circuit with `400 { success:false, error:{ code:'VALIDATION_ERROR', message, details } }` where `details = error.flatten()`.

| Factory | Validates | On success | Anchor |
|---|---|---|---|
| `validate(schema)` | `req.body ?? {}` | replaces `req.body` with parsed+defaulted data | `validate.ts:28` |
| `validateQuery(schema)` | `req.query` | re-defines `req.query` via `Object.defineProperty` (Express 5 makes `req.query` a read-only getter) | `validate.ts:54`, defineProperty at `validate.ts:69` |
| `validateParams(schema)` | `req.params` | re-defines `req.params` | `validate.ts:80` |

Coercion (`z.coerce.number`), `defaults`, and `blankToUndefined` preprocessors are applied here, so downstream handlers can treat inputs as already normalized. Routes that read no input mark themselves with an `AO1 route-input-exempt` comment (a repo lint convention) instead of adding a schema — e.g. `governance.ts:24`, `evolution.ts:94`, `health.ts:12`.

#### 07.1.2 DI container access (`getServiceContainer()`)

Every handler pulls services from the process-global container via `getServiceContainer()` from `lib/injection/ServiceContainer.js`, then `container.get('serviceName')`. Two access styles appear:

- **Registered singletons**: `container.get('moduleService')`, `container.get('guardService')`, `container.get('proposalRepository')`, etc. These `throw` when unregistered; several routes `try/catch` and gracefully degrade (e.g. jobs' `getLiveBootstrapSession` at `jobs.ts:472`, governance returns `503` when a service is missing at `governance.ts:45`).
- **`container.singletons?.X`**: direct property access used for optional/late-bound singletons like `_projectRoot` (`commands.ts:89`, `wiki.ts:93`), `realtimeService` (`wiki.ts:116`), `aiProvider` (`wiki.ts:126`), `writeZone` (`commands.ts:225`), `daemonFileChangeCollector` (`daemon.ts:319`).

#### 07.1.3 Gateway middleware (`req.gw`, `lib/http/middleware/gatewayMiddleware.ts`)

`gatewayMiddleware()` (installed globally by `HttpServer` at `HttpServer.ts:187`) attaches `req.gw(action, resource, data)` (`gatewayMiddleware.ts:36`). It resolves the `gateway` service, injects the audit actor (`req.resolvedSourceActor || req.resolvedSource || 'http-request'`, `gatewayMiddleware.ts:40`) plus `_ip`/`_userAgent`, and throws a typed `GatewayError` (`gatewayMiddleware.ts:13`, carrying `statusCode`/`code`/`requestId`) on failure so the global `errorHandler` renders it. The **only route in this section** that uses the Gateway audit envelope is `POST /api/v1/rules` (`guardRules.ts:185`) — Guard-rule creation is a mutation that must be audited.

> `req.resolvedSource` / `req.resolvedSourceActor` are set by `sourceResolverMiddleware()` (`HttpServer.ts:184`, source at `middleware/sourceResolver.ts:48-52`). They are **audit-source labels, not authorization roles** (documented in `sourceResolver.ts:4`).

#### 07.1.4 Dashboard-operation delegation (`lib/http/utils/dashboard-operation.ts`)

Several "command"-style routes do **not** touch services directly; instead they call `executeDashboardOperation(container, req, toolId, args)` (`dashboard-operation.ts:33`). This dynamically imports `createDashboardOperationHandlers` + `DASHBOARD_OPERATION_MANIFESTS` from `#tools/adapters/DashboardOperations.js`, wires AI-status helpers from `#inject/AiRuntimeStatus.js` (`dashboard-operation.ts:50` — an explicit http→injection contract edge), builds an execution request with `surface:'dashboard'` and `decision:{allowed:true, stage:'execute'}` (i.e. **not** routed through the V2 LLM `ToolRouter`), runs the handler, and returns a `ToolResultEnvelope`. `sendDashboardOperationResponse(res, envelope)` (`dashboard-operation.ts:106`) renders `{ success:true, data: envelope.structuredContent, toolResult: envelope }` on success, or delegates to `sendToolEnvelopeResponse` on error.

The dashboard-operation IDs (from `lib/tools/adapters/DashboardOperations.ts:19`):

| ID constant | String value | Used by route |
|---|---|---|
| `updateModuleMap` | `dashboard.update_module_map` | `POST /modules/update-map`, `POST /commands/spm-map` |
| `rebuildSemanticIndex` | `dashboard.rebuild_semantic_index` | `POST /commands/embed` |
| `scanProject` | `dashboard.scan_project` | `POST /modules/scan-project` |
| `bootstrapProject` | `dashboard.bootstrap_project` | `POST /modules/bootstrap` |
| `cancelBootstrap` | `dashboard.cancel_bootstrap` | `POST /modules/bootstrap/cancel` |
| `rescanProject` | `dashboard.rescan_project` | `POST /modules/rescan` |

---

### 07.2 Jobs — Async AI Job Control (`routes/jobs.ts`)

Responsibility: expose the daemon's **async AI job queue** (bootstrap / rescan) — enqueue, list, inspect, cancel, and stream progress. This is the HTTP face of the host-owned `DaemonJobRunner` (`lib/daemon/DaemonJobRunner.ts`) and its associated stores.

#### Routes

| Method + Path | Purpose | Backing call | Anchor |
|---|---|---|---|
| `GET /` | List jobs (filter `kind`, `status`, `limit`, `compact`) | `getJobStore(container).list()` + decorate | `jobs.ts:143` |
| `GET /:jobId` | Single job (with progress/summary/displaySnapshot) | `store.get()` | `jobs.ts:236` |
| `GET /:jobId/events` | Poll process-event stream after a sequence cursor | `getJobProcessEventRecorder().list()` | `jobs.ts:170` |
| `GET /:jobId/display-snapshot` | Persisted or rebuilt display snapshot | `buildJobDisplaySnapshotResponse()` | `jobs.ts:193` |
| `GET /:jobId/artifacts/:artifactId` | Serve a raw job artifact (typed body) | `readJobProcessEventArtifact()` | `jobs.ts:213` |
| `POST /bootstrap` | Enqueue a bootstrap job (202) | `enqueueDaemonJob({kind:'bootstrap'})` | `jobs.ts:257` |
| `POST /rescan` | Enqueue a rescan job (202) | `enqueueDaemonJob({kind:'rescan'})` | `jobs.ts:282` |
| `POST /:jobId/cancel` | Cancel a job | `cancelDaemonJob()` | `jobs.ts:408` |

#### Request schemas & validation

- `BootstrapJobBody` (`jobs.ts:42`): `maxFiles` (1–10000, default 500), `skipGuard` (default false), `contentMaxLines` (1–10000, default 120).
- `RescanJobBody` (`jobs.ts:48`): a large optional-field body (dimensions, `maxFiles`/`contentMaxLines` bounded by the `@alembic/core/host-agent-workflows` constants `MAX_KNOWLEDGE_RESCAN_MAX_FILES` / `MAX_KNOWLEDGE_RESCAN_CONTENT_MAX_LINES`, `generationStage`, `miningMode`, `moduleScope`, `perDimensionTargets`, `moduleDimensionTargets`, etc.). A `superRefine` (`jobs.ts:78`) enforces that `miningMode` matches `generationStage` (with `per-module` accepted for `moduleMining`). Exported `parseRescanJobBody()` (`jobs.ts:95`) lets other host code reuse the schema.
- `CancelJobBody` (`jobs.ts:99`): optional `reason`.

#### Notable mechanisms & gotchas

- **Daemon token gate**: `POST` routes call `rejectInvalidProvidedDaemonToken(req, res)` (`jobs.ts:1015`). It is a *conditional* gate — if the caller sends **no** `x-alembic-daemon-token` header, the request passes (Dashboard traffic). If a header *is* present it must `timingSafeEqual`-match `process.env.ALEMBIC_DAEMON_TOKEN`, else `401`. `inferJobSource(req)` (`jobs.ts:1011`) then labels the job `'http'` vs `'dashboard'` by that header's presence.
- **Response decoration**: `decorateJobForResponse` (`jobs.ts:428`) merges the persisted `DaemonJobRecord` with (a) a live in-flight bootstrap session from `bootstrapTaskManager.getSessionStatus()` (`jobs.ts:472`), or (b) an embedded session in `job.result`. It computes a normalized `status`, a `progress` block, and a `summary`. The `compact` flag strips the heavy `result` payload (`omitHeavyJobPayload`, `jobs.ts:467`).
- **Status normalization** (`normalizeJobStatus`, `jobs.ts:604`) collapses raw session statuses (`aborted`, `completed_with_errors`, `queued`, etc.) into the canonical `DaemonJobStatus` set, treating `userCancelled`/`summary.aborted` as `cancelled`. There is subtle count-shuffling: a cancelled job with `failed>0` and `aborted` moves those into `cancelled` (`jobs.ts:534`, mirrored in `normalizeSummaryForStatus` at `jobs.ts:728`).
- **Progress %** (`buildJobProgress`, `jobs.ts:518`) is `(completed+failed+cancelled)/total*100`, clamped 0–100, with per-status fallbacks (`completed`→100, queued/running→0).
- **Diagnostics extraction** (`extractSessionDiagnostics`, `jobs.ts:802`) aggregates per-task statuses, `gateFailures`, `timedOutStages`, `degraded`, `forcedSummary`, and issue rows; `isIssueStatus` (`jobs.ts:930`) enumerates the failure statuses (`failed`, `timeout`, `degraded_budget_exhausted`, `l4_compaction_failed_budget_exhausted`, …).
- **URL builders** are exported for other host code: `buildJobsApiOrigin` (`jobs.ts:307`, prefers `Host` header, else normalizes the local socket address), `buildJobStatusUrl`/`buildJobProcessEventsUrl`/`buildJobDisplaySnapshotUrl`/`buildJobProcessArtifactUrl` (`jobs.ts:318`–`344`). The bootstrap/rescan `202` responses return these URLs plus `dashboardUrl` for the client to follow.
- **Display-snapshot lazy-persist**: `buildJobDisplaySnapshotResponse` (`jobs.ts:367`) returns a persisted snapshot if present; otherwise if the recorder has events it **writes** a snapshot from them; otherwise it returns an unpersisted "incomplete" snapshot. Each carries `validation` from `validateJobDisplaySnapshot` (a core validator).

Boundary note: `DaemonJobRecord`/`DaemonJobStatus`/`JobStore` types and the snapshot validator come from `@alembic/core/daemon` (`jobs.ts:2`). The **runner, store, recorder, cancel, and artifact I/O are host-owned** (`lib/daemon/DaemonJobRunner.js`, `lib/daemon/JobDisplaySnapshotStore.js`, `lib/daemon/JobProcessEventArtifacts.js`). Efficiency merging comes from `#service/bootstrap/BootstrapEfficiency.js` (host). The route itself owns only validation, token gating, and response shaping.

---

### 07.3 Daemon — Runtime Health & Capabilities (`routes/daemon.ts`)

Responsibility: the single rich **daemon health / capability descriptor** endpoint. It assembles project identity, runtime capabilities, resident-service status, file-monitor status, and a runtime boundary into one JSON blob that clients use to discover what the local daemon can do.

#### Routes

| Method + Path | Purpose | Anchor |
|---|---|---|
| `GET /health` | Full runtime health + capability descriptor | `daemon.ts:75` |

#### Control flow (of `GET /health`)

1. Resolve `projectRoot` (`resolveProjectRoot(container)`) and the workspace via `resolveAlembicWorkspace(projectRoot)` from the host project-scope registry (`daemon.ts:78`).
2. Determine `mode` = `'daemon'` vs `'api'` from `ALEMBIC_DAEMON_MODE` (`daemon.ts:80`); dashboard availability from `ALEMBIC_DAEMON_DASHBOARD_MOUNTED` (`daemon.ts:83`).
3. Read schema migration version from SQLite (`readLatestSchemaMigrationVersion(container.get('database'))`, `daemon.ts:453`).
4. Build project identity (`buildDaemonProjectIdentity` → `createAlembicRuntimeProjectIdentity`, a core factory) (`daemon.ts:86`).
5. Resolve API-AI capability from workspace settings + env (`getApiAiCapability`, `daemon.ts:420`, using `WorkspaceSettingsStore` + `collectAiEnvOverrides`/`isAiEnvReady` from `@alembic/core/shared`).
6. Resolve file-monitor runtime status (`resolveDaemonFileMonitorRuntimeStatus`, `daemon.ts:308`) — disabled by `ALEMBIC_DAEMON_FILE_CHANGES=0`, unsupported outside daemon mode, else read from the `daemonFileChangeCollector` singleton.
7. Build capabilities (`buildDaemonCapabilities`, `daemon.ts:188`), resident-service status (`buildResidentServiceStatus`, `daemon.ts:232`), project runtime source-of-truth, runtime boundary, and health data.
8. Respond `{ success, data: { ...healthData, projectRuntimeSourceOfTruth, residentService, runtimeBoundary, capabilities:{ …, residentSearch, runtimeBoundary } } }`.

#### Notable types & mechanisms

- `DaemonCapabilities` (`daemon.ts:69`) extends the core `AlembicRuntimeCapabilities` with host-specific `apiAi` and an enriched `fileMonitor` (adds `activeEventSource`, `degraded`, `fallback`, `producerKind`, `runtimeState`, etc.).
- `ResidentSearchCapability` (`daemon.ts:37`) is a **host-declared** capability object advertising the resident `/api/v1/search` endpoint's telemetry surface (`buildResidentSearchCapability`, `daemon.ts:332`).
- `buildResidentServiceStatus` (`daemon.ts:232`) builds a rich per-capability override map (`dashboard.handoff`, `file-monitor.git-worktree`, `jobs.api-ai.bootstrap`/`rescan`, `search.keyword`/`semantic`, `status.health`) and a `serviceScope` with **diagnostic paths only** (deliberate: identity summary carries no paths, see the Chinese comment at `daemon.ts:294`).
- File-monitor helpers translate the collector's status into capability shape: `resolveFileMonitorMode` maps `native-watch`→`host-event-bridge`, `git-worktree`→`daemon-git-worktree` (`daemon.ts:389`).

Boundary note: nearly all the descriptor **factories** (`createAlembicRuntimeCapabilities`, `createAlembicResidentServiceStatus`, `createAlembicRuntimeHealthData`, `createAlembicRuntimeProjectIdentity`, `getPackageVersion`) are imported from `@alembic/core/daemon` (`daemon.ts:1`). The route composes them with **host-owned** state: `FileMonitorStatus` helpers, `ProjectRuntimeControl`, `ProjectRuntimeSourceOfTruth`, `RuntimeBoundary` (all `lib/daemon/*`), SQLite access (`lib/infrastructure/database/*`), and the project-scope registry (`lib/project-scope/*`). Health assembly is host orchestration over core descriptor shapes.

---

### 07.4 Modules — Multi-Language Module Explorer (`routes/modules.ts`)

Responsibility: the unified, language-agnostic **module explorer** (successor to the retired `spm.js`). It exposes target listing, dependency graphs, directory browsing, AI scans (blocking + SSE streaming), full-project scans, cold-start bootstrap, incremental rescan, and bootstrap-report history. All work goes through `container.get('moduleService')` (a host service) — the module docstring makes this explicit (`modules.ts:5`).

#### Routes

| Method + Path | Purpose | Backing | Anchor |
|---|---|---|---|
| `GET /targets` | List all module targets (merged multi-lang) | `moduleService.listTargets()` | `modules.ts:38` |
| `GET /dep-graph` | Dependency graph (`level=target|package`) | `moduleService.getDependencyGraph()` | `modules.ts:59` |
| `GET /browse-dirs` | Browse project dirs for scan selection | `moduleService.browseDirectories()` | `modules.ts:143` |
| `POST /scan-folder` | Scan any folder via AI pipeline | `moduleService.scanFolder()` | `modules.ts:169` |
| `POST /scan-folder/stream` | Streaming folder scan (SSE session) | `scanFolder` + SSE | `modules.ts:193` |
| `POST /target-files` | List a target's files | `moduleService.getTargetFiles()` | `modules.ts:252` |
| `POST /scan` | AI-scan a target, discover candidates | `moduleService.scanTarget()` | `modules.ts:292` |
| `POST /scan/stream` | Streaming target scan (SSE session) | `scanTarget` + SSE | `modules.ts:334` |
| `GET /scan/events/:sessionId` | SSE consumption endpoint | `getStreamSession()` | `modules.ts:401` |
| `POST /scan-project` | Whole-project scan (AI extract + Guard) | `executeDashboardOperation(scanProject)` | `modules.ts:471` |
| `POST /update-map` | Refresh module map | `executeDashboardOperation(updateModuleMap)` | `modules.ts:492` |
| `GET /project-info` | Detected languages/frameworks | `moduleService.getProjectInfo()` | `modules.ts:507` |
| `POST /bootstrap` | Cold-start skeleton + async fill | `executeDashboardOperation(bootstrapProject)` | `modules.ts:524` |
| `GET /bootstrap/report/latest` | Latest bootstrap report JSON | file read | `modules.ts:541` |
| `GET /bootstrap/reports` | Bootstrap report index | file read | `modules.ts:547` |
| `GET /bootstrap/reports/:sessionId` | One historical report | file read | `modules.ts:597` |
| `GET /bootstrap/reports/:sessionId/diff` | Diff two reports | `diffBootstrapReports()` | `modules.ts:556` |
| `GET /bootstrap/reports/:sessionId/artifacts/:artifactId` | Raw report artifact | file read | `modules.ts:574` |
| `GET /bootstrap/status` | Async fill progress | `bootstrapTaskManager.getSessionStatus()` | `modules.ts:614` |
| `GET /test-mode` | Test-mode config (for header badge) | `getTestModeConfig()` | `modules.ts:649` |
| `POST /bootstrap/cancel` | Cancel bootstrap/rescan session | `executeDashboardOperation(cancelBootstrap)` | `modules.ts:659` |
| `POST /rescan` | Incremental rescan | `executeDashboardOperation(rescanProject)` | `modules.ts:677` |

Request schemas (`ScanFolderBody`, `ScanTargetBody`, `ScanProjectBody`, `ModuleBootstrapBody`, `ModuleRescanBody`) are imported from `#shared/schemas/http-requests.js` (`modules.ts:13`).

#### Notable mechanisms & gotchas

- **Dep-graph normalization** (`modules.ts:59`): handles both native `{nodes,edges}` and legacy SPM `{packages}` shapes; for SPM it synthesizes `pkg::target` node ids and edges (`modules.ts:86`). Empty/missing graph returns `{nodes:[],edges:[],projectRoot:null}`.
- **SSE streaming pattern** (two variants): `POST .../stream` creates a session via `createStreamSession('scan')`, immediately returns `{ sessionId }`, then runs the scan in `setImmediate`, pushing `onProgress` events with `session.send()`, a final `scan:result`, and `session.end()`. The `GET /scan/events/:sessionId` endpoint (`modules.ts:401`) sets SSE headers, **replays the session buffer**, subscribes to live events, sends a 15s `: ping` heartbeat, and cleans up listeners on `stream:done`/`stream:error` or client `close`. See §07.1.4-adjacent `SseSessionRegistry` (`utils/sse-sessions.ts:32`) with a 5-minute TTL and 60s post-completion retention.
- **AD6 bug-fix comment** (`modules.ts:206`): the `scan-folder/stream` route previously called a nonexistent `session.push()`, throwing on every event; it was restored to the documented `send()`/`end()`/`error()` contract. Worth knowing when editing SSE routes.
- **Report-id safety**: `isSafeReportId` (`modules.ts:715`) enforces `SAFE_REPORT_ID = /^[a-zA-Z0-9_.:-]+$/`, and the artifact route additionally checks the resolved path stays under `artifactRoot` (`modules.ts:585`) — path-traversal defense.
- **Bootstrap-status fallback** (`modules.ts:614`): when `bootstrapTaskManager` is unregistered, it degrades to reporting the newest running/queued job from the JobStore; when registered it merges live session status + jobs + optional `testMode`.
- Data root for report files: `getModulesDataRoot()` (`modules.ts:694`) uses `resolveDataRoot(container)` with `process.cwd()` fallback.

Boundary note: `ModuleService` is a **host service** (`container.get('moduleService')`) — Section covers its interface use, not its impl. The scan/bootstrap/rescan *heavy pipelines* run inside dashboard-operation handlers (`#tools/adapters/DashboardOperations.js`) which themselves orchestrate `@alembic/core` host-agent workflows. The route owns SSE plumbing, report-file I/O + traversal guards, and dep-graph shape normalization.

---

### 07.5 Evolution — Proposals & Warnings Inbox (`routes/evolution.ts`)

Responsibility: the human-review **inbox for Recipe evolution**: list/stat/act on lifecycle *proposals* and *warnings*. Backed by `proposalRepository`, `warningRepository`, and `proposalExecutor` from `@alembic/core`.

#### Routes

| Method + Path | Purpose | Repo call | Anchor |
|---|---|---|---|
| `GET /proposals` | List proposals (filter status/type/targetRecipeId/source, `limit≤500`) | `proposalRepository.find()` | `evolution.ts:60` |
| `GET /proposals/stats` | Counts of pending + observing | `repo.find({status})` | `evolution.ts:95` |
| `POST /proposals/:id/execute` | Execute a single proposal | `proposalExecutor.executeOne(id)` | `evolution.ts:116` |
| `POST /proposals/:id/observe` | `pending → observing` | `repo.startObserving(id)` | `evolution.ts:150` |
| `POST /proposals/:id/reject` | Reject a proposal | `repo.markRejected(id, reason, 'user')` | `evolution.ts:181` |
| `GET /warnings` | List warnings (filter status/type/targetRecipeId) | `warningRepository.find()` | `evolution.ts:218` |
| `GET /warnings/stats` | Open-warning counts | `repo.countOpen()` | `evolution.ts:251` |
| `POST /warnings/:id/resolve` | Resolve a warning | `repo.resolve(id, resolution, 'user')` | `evolution.ts:268` |
| `POST /warnings/:id/dismiss` | Dismiss a warning | `repo.dismiss(id, reason, 'user')` | `evolution.ts:301` |

#### Schemas & error mapping

- `EvolutionListQuery` (`evolution.ts:29`): `limit` (positive, default 100), plus optional `source`/`status`/`targetRecipeId`/`type`. `blankToUndefined` + `optionalNonEmptyString` preprocessors normalize empty strings.
- `EvolutionIdParams` (`evolution.ts:37`): non-empty trimmed `id`.
- `ProposalRejectBody`/`WarningResolveBody`/`WarningDismissBody` (`evolution.ts:41`–53) are `.passthrough()` bodies with an optional reason/resolution.
- Error shape is uniform: handlers wrap in `try/catch` and emit `500 { error:{ code:'PROPOSAL_ERROR'|'WARNING_ERROR', message } }`. Not-found/invalid-state map to `404`/`400` with `NOT_FOUND`/`INVALID_STATE` (`evolution.ts:129`, `evolution.ts:163`). `execute` first `findById` → `404` before running.

Boundary note: `ProposalExecutor` (`@alembic/core/evolution`) and `ProposalRepository`/`WarningRepository` (`@alembic/core/repositories`) are **all core** (`evolution.ts:17-18`). The proposal *execution* (applying a lifecycle mutation to a Recipe) is a core operation invoked via `executeOne`. This route is a pure CRUD/action adapter — no host logic beyond validation and status codes.

---

### 07.6 Guard — Live Code Checking (`routes/guard.ts`)

Responsibility: run **Guard code-standard checks** against a single file or a batch, returning structured violations formatted for both human display and Agent consumption. This is the HTTP entry to the core `GuardCheckEngine`.

#### Routes

| Method + Path | Purpose | Anchor |
|---|---|---|
| `POST /file` | Check one file (content optional; read from disk if omitted) | `guard.ts:39` |
| `POST /batch` | Check many files (workspace-level) | `guard.ts:126` |

Bodies `GuardFileBody` / `GuardBatchBody` from `#shared/schemas/http-requests.js`.

#### Control flow (`POST /file`)

1. Resolve `code` from body `content`, else `readFileSync(filePath)` → `400` on read failure (`guard.ts:47`).
2. Dynamically import `GuardCheckEngine` + `detectLanguage` from `@alembic/core/guard` (`guard.ts:59`).
3. Get-or-create the engine via `_getEngine` (`guard.ts:209`): tries `container.get('guardCheckEngine')`, else constructs one over `container.get('database')`. **Enhancement-Pack rule injection**: if `!engine.isEpInjected()`, imports `resolveEnhancementGuardRules()` (`guard.ts:234`) and injects them (RIC-4 note at `guard.ts:228` — this uses the high-level `@alembic/core/guard` facade, returns `[]` gracefully when the EP registry is unavailable).
4. `lang = language || detectLanguage(filePath)`; `violations = engine.checkCode(code, lang, {filePath})`.
5. Format each violation with `diagnosticMessage` (`_buildDiagnosticMessage`, `guard.ts:253`) — a bilingual message that embeds `搜 alembic_search('<ruleId>')` MCP guidance for Agents.
6. Compute `summary` (total/errors/warnings/infos).
7. Side-effects (best-effort, each in `try/catch`): `guardFeedbackLoop.processFixDetection(...)` to detect fixes vs. the previous run (`guard.ts:88`); `violationsStore.appendRun(...)` to persist for later diffing (`guard.ts:96`).
8. Respond `{ filePath, language, violations, summary, fixedViolations }`.

`POST /batch` mirrors this per file, accumulating `totalErrors`/`totalWarnings`; unreadable files yield a per-file `error:'Cannot read file'` row rather than failing the batch (`guard.ts:151`).

Boundary note: `GuardCheckEngine`, `detectLanguage`, `resolveEnhancementGuardRules` are **all `@alembic/core/guard`** (`guard.ts:59`, `guard.ts:234`). The route owns file I/O, the get-or-create/EP-inject lifecycle, the Agent-facing `diagnosticMessage` formatting, and the feedback-loop/violations-store persistence side-effects (host services `guardFeedbackLoop`, `violationsStore`).

---

### 07.7 Guard Rules — Rule CRUD & Lifecycle (`routes/guardRules.ts`)

Responsibility: manage the **Guard rule catalog** — list (DB rules + built-ins), stats, detail, create (audited), enable/disable (single + batch), check code, and import-from-Recipe. Backed by `guardService`, `knowledgeRepository`, and `guardCheckEngine`.

#### Routes (mounted at `/api/v1/rules`)

| Method + Path | Purpose | Backing | Anchor |
|---|---|---|---|
| `GET /` | List rules (DB + built-in), paged/filtered | `guardService.searchRules`/`listRules` | `guardRules.ts:50` |
| `GET /stats` | Rule stats | `guardService.getRuleStats()` | `guardRules.ts:146` |
| `GET /:id` | Rule detail | `knowledgeRepository.findById()` | `guardRules.ts:157` |
| `POST /` | Create rule (Gateway-audited) | `req.gw('guard_rule:create','guard_rules',…)` | `guardRules.ts:176` |
| `POST /batch-enable` | Batch enable (needs `confirmed`) | `guardService.enableRule` × `p-limit` | `guardRules.ts:205` |
| `POST /batch-disable` | Batch disable (needs `confirmed`) | `guardService.disableRule` × `p-limit` | `guardRules.ts:240` |
| `PATCH /:id/enable` | Enable one (needs `confirmed`) | `guardService.enableRule` | `guardRules.ts:275` |
| `PATCH /:id/disable` | Disable one (needs `confirmed`) | `guardService.disableRule` | `guardRules.ts:292` |
| `POST /check` | Check code vs rules | `guardService.checkCode` | `guardRules.ts:311` |
| `POST /import-from-recipe` | Import rules from a Recipe (needs `confirmed`) | `guardService.importRulesFromRecipe` | `guardRules.ts:327` |

#### Notable mechanisms & gotchas

- **DB + built-in merge** (`GET /`): DB "recipes" are flattened to Guard-rule shape via `mapRecipeToGuardRule` (`guardRules.ts:24`), pulling the first `constraints.guards[]` entry for message/severity/pattern. Built-in rules (from `guardCheckEngine.getBuiltInRules()` — "9 built-in iOS rules" per `guardRules.ts:83`) are merged in, **deduped by id** against DB rules (`guardRules.ts:93`).
- **Project-language annotation**: the list computes `projectLanguages` via `LanguageService.detectProjectLanguages(process.cwd(), {discovererIds})` (from module info) with a pure-file-scan fallback (`guardRules.ts:121`), then maps `objectivec`→`objc` via `LanguageService.toGuardLangId` for built-in-rule compatibility (`guardRules.ts:130`).
- **Confirmation gate**: all mutating enable/disable/import routes call `rejectUnlessConfirmed(req, res, '<op>')` (`entrypoint-safety.ts:17`), which requires a truthy `confirmed` flag in body or query, else `400 OPERATION_CONFIRMATION_REQUIRED`.
- **Audited creation**: `POST /` is the one route using `req.gw` (`guardRules.ts:185`), accepting both front-end field names (`ruleId`/`message`) and V2 names (`name`/`description`), returning `201` with `requestId`.
- **Batch semantics**: uses `Promise.allSettled` + `ioLimit` (an `@alembic/core/shared` concurrency limiter) to run per-id ops, returning `enabled/failed` arrays plus counts (`guardRules.ts:215`).

Boundary note: `LanguageService`, `ioLimit`, `NotFoundError` come from `@alembic/core/shared` (`guardRules.ts:6`). `guardService`, `knowledgeRepository`, `guardCheckEngine` are container services (host wiring over core repos/engines). The rule persistence and lifecycle logic live in `guardService`/core; the route owns shape-mapping, dedupe, confirmation gating, and Gateway auditing.

---

### 07.8 Governance — Active Lifecycle Service Reads (`routes/governance.ts`)

Responsibility: expose reads/triggers for the **active governance services** — decay detection, staging promotion, enhancement suggestions. The module docstring is explicit that Panorama project-info routes were retired in "P5" and these endpoints remain only because they use *active* decay/staging/enhancement services (`governance.ts:1`).

#### Routes

| Method + Path | Purpose | Service | Anchor |
|---|---|---|---|
| `POST /cycle` | **Retired** — always `410 REMOVED` | (none) | `governance.ts:25` |
| `GET /decay` | Current decay scan | `decayDetector.scanAll()` | `governance.ts:40` |
| `POST /staging-check` | Promote staging entries whose delay elapsed | `stagingManager.checkAndPromote()` + `listStaging()` | `governance.ts:68` |
| `GET /staging` | List staging entries | `stagingManager.listStaging()` | `governance.ts:99` |
| `GET /enhancements` | Enhancement suggestions | `enhancementSuggester.analyzeAll()` | `governance.ts:129` |

#### Notable mechanisms

- **Graceful 503**: each service read fetches the service optionally (`container.get(...) as {...} | undefined`) and returns `503 SERVICE_UNAVAILABLE` when the service isn't registered (`governance.ts:45`, `:75`, `:106`, `:136`), else `500 GOVERNANCE_ERROR` on thrown errors.
- **410 removal signal**: `POST /cycle` intentionally returns a stable `410` (`KnowledgeMetabolism has been removed. Use rescan for governance.`) so old clients get a deterministic removal marker rather than a 404.

Boundary note: `decayDetector`, `stagingManager`, `enhancementSuggester` are container-registered **`@alembic/core` governance services** (the route treats them structurally, e.g. `{ scanAll(): unknown }`). All lifecycle logic (decay scoring, staging delays, enhancement analysis) is core; the route owns only availability handling and error taxonomy.

---

### 07.9 Signals — Trace, Stats & Reports (`routes/signals.ts`)

Responsibility: read-only queries over the **signal trace** and **pipeline report** stores. These surface the "Nerves/Signal" organ's telemetry.

#### Routes

| Method + Path | Purpose | Backing | Anchor |
|---|---|---|---|
| `GET /trace` | Query signal traces (type/source/target/from/to/limit/offset) | `signalTraceWriter.query()` | `signals.ts:59` |
| `GET /stats` | Signal stats over an optional time range | `signalTraceWriter.stats()` | `signals.ts:104` |
| `GET /reports` | Query pipeline reports (category/type/from/to/limit/offset) | `reportStore.query()` | `signals.ts:139` |

#### Notable mechanisms

- Query schemas (`SignalTraceQuery`, `SignalStatsQuery`, `SignalReportsQuery`, `signals.ts:31`–53) use coercing preprocessors (`optionalTimestamp` = non-negative int; `optionalLimit`/`optionalOffset`).
- Comma-split multi-values: `type` and `category` are split on `,` and filtered (`signals.ts:76`, `signals.ts:156`).
- Limit is capped at 200 via `capLimit(value, 200)` (`signals.ts:181`).
- `503 SERVICE_UNAVAILABLE` when the writer/store is null; `500 INTERNAL_ERROR` on thrown errors.

Boundary note: `SignalTraceWriter` (`@alembic/core/events`) and `ReportStore` (`@alembic/core/report`) are **core** (`signals.ts:10-11`). The route is a pure read adapter over their `query`/`stats` APIs.

---

### 07.10 Skills — Project-Level Agent Skills (`routes/skills.ts`)

Responsibility: CRUD for **Agent Skills** (built-in + project-level). Delegates entirely to `SkillFileService` (a host service in `lib/service/skills/`), which returns **JSON strings** the route parses and re-shapes into HTTP status codes.

#### Routes

| Method + Path | Purpose | Service fn | Anchor |
|---|---|---|---|
| `GET /` | List all skills (built-in + project) | `listSkills()` | `skills.ts:23` |
| `GET /:name` | Load a skill (optional `?section=`) | `loadSkill()` | `skills.ts:47` |
| `POST /` | Create a project skill | `createSkill()` | `skills.ts:78` |
| `PUT /:name` | Update a project skill | `updateSkill()` | `skills.ts:117` |
| `DELETE /:name` | Delete a project skill | `deleteSkill()` | `skills.ts:153` |

Bodies `CreateSkillBody` / `UpdateSkillBody` from `#shared/schemas/http-requests.js`.

#### Notable mechanisms & gotchas

- **Stringly-typed service**: each service fn returns a raw JSON string; the route `JSON.parse`es it inside `try/catch` and returns `500 PARSE_ERROR` on malformed output (`skills.ts:27`).
- **Error-code → status mapping**: parsed `error.code` maps to HTTP status: `SKILL_NOT_FOUND`→404, `BUILTIN_CONFLICT`/`ALREADY_EXISTS`→409, `INVALID_NAME`→400, `BUILTIN_PROTECTED`→403 (create at `skills.ts:99`, update at `skills.ts:135`, delete at `skills.ts:167`).
- `createdBy` defaults to `'manual'` (`skills.ts:86`).

Boundary note: `SkillFileService` (`../../service/skills/SkillFileService.js`) is **host-owned** file-based skill management. No `@alembic/core`/`@alembic/agent` dependency in this route. The route owns only parse/status mapping.

---

### 07.11 Wiki — Repo Wiki Generation (`routes/wiki.ts`)

Responsibility: generate / update / abort / inspect the **Repo Wiki**, with async generation + Socket.io progress broadcasts and disk file serving. Uses a host `WikiGenerator` (`lib/service/wiki/WikiGenerator.ts`).

#### Routes

| Method + Path | Purpose | Anchor |
|---|---|---|
| `POST /generate` | Trigger full generation (202, async) | `wiki.ts:156` |
| `POST /update` | Incremental update (202, async) | `wiki.ts:224` |
| `POST /abort` | Abort running generation | `wiki.ts:270` |
| `GET /status` | Task + on-disk wiki status | `wiki.ts:290` |
| `GET /files` | List generated `.md` wiki files | `wiki.ts:317` |
| `GET /file/{*path}` | Read one wiki file (traversal-guarded) | `wiki.ts:359` |

#### Notable mechanisms & gotchas

- **Module-scoped task state**: `wikiTask` (`wiki.ts:53`) and `currentGenerator` (`wiki.ts:64`) are **module-level singletons** — one wiki job per process. `POST /generate`/`/update` reject with `409 ALREADY_RUNNING` if `wikiTask.status==='running'`. Exported `getWikiTask()`/`patchWikiTask()` (`wiki.ts:81`, `:86`) let the bootstrap orchestrator synchronize with this state.
- **Async 202 pattern**: the route responds `202` immediately, then runs `generator.generate()`/`.update()` in the background, updating `wikiTask` and broadcasting `wiki:progress`/`wiki:completed` via `realtimeService.broadcastEvent` (Socket.io) (`wiki.ts:135`, `:205`). Progress callbacks flow through `createGenerator`'s `onProgress` (`wiki.ts:127`).
- **Graceful degradation**: `createGenerator` (`wiki.ts:91`) optionally wires `moduleService`, `knowledgeService`, `aiProvider`, `realtimeService` — each in its own `try/catch`, so wiki generation runs with whatever is available.
- **Path-traversal guard**: `GET /file/{*path}` resolves under the wiki dir and rejects if `!fullPath.startsWith(wikiDir)` → `403` (`wiki.ts:376`). Wiki dir = `<dataRoot>/<DEFAULT_KNOWLEDGE_BASE_DIR>/wiki` (`wiki.ts:321`). `WikiFileParams` (`wiki.ts:36`) accepts the wildcard `{*path}` as string or string[].
- **Config**: output language from `ALEMBIC_WIKI_LANG` (default `zh`, `wiki.ts:147`); project root from `_projectRoot` singleton / `ALEMBIC_PROJECT_DIR` / cwd.

Boundary note: `WikiGenerator` and its `WikiModuleService`/`WikiKnowledgeService`/`WikiAiProvider` interface types are **host-owned** (`lib/service/wiki/WikiGenerator.js`). `DEFAULT_KNOWLEDGE_BASE_DIR`/`resolveDataRoot` come from `@alembic/core/workspace`. The Socket.io realtime service is host infra. Wiki content generation itself is a host feature (not a core organism).

---

### 07.12 Projects — Multi-Project Runtime Control (`routes/projects.ts`)

Responsibility: control the daemon's **per-project runtime** — inspect the runtime snapshot, select/clear the active project, and start/stop/switch/open-dashboard for individual projects. This is the multi-project supervisor surface, driven by host `ProjectRuntimeControl` + `DaemonSupervisor`.

#### Routes

| Method + Path | Purpose | Control call | Anchor |
|---|---|---|---|
| `GET /` , `GET /status` | Full runtime snapshot | `control.snapshot()` | `projects.ts:85`, `:91` |
| `GET /current` | Active + selected project subset | `control.snapshot()` (projected) | `projects.ts:97` |
| `POST /select` | Select active project (by id or root, exactly one) | `control.selectProject()` | `projects.ts:111` |
| `DELETE /select` | Clear selection | `control.clearSelection()` | `projects.ts:132` |
| `POST /open-dashboard` | Open dashboard (current) | `control.openDashboard()` | `projects.ts:138` |
| `POST /:projectId/start` | Start a project's runtime | `control.startProject()` | `projects.ts:151` |
| `POST /:projectId/stop` | Stop a project's runtime | `control.stopProject()` | `projects.ts:166` |
| `POST /:projectId/open-dashboard` | Open a project's dashboard | `control.openDashboard()` | `projects.ts:181` |
| `POST /:projectId/switch` | Switch active project | `control.switchProject()` | `projects.ts:196` |
| `GET /:projectId` | Inspect one project | `control.inspectProject()` | `projects.ts:211` |

#### Notable mechanisms & gotchas

- **Body schemas**: `ProjectSelectBody` (`projects.ts:62`) requires **exactly one** of `projectId`/`projectRoot` (XOR refine at `projects.ts:68`). `ProjectRuntimeOptionsBody` (`projects.ts:72`) carries `restart`/`stopWaitMs`/`waitUntilReadyMs`. `ProjectIdParams` (`projects.ts:80`) validates the path param.
- **Deferred self-stop**: mutating actions inject `deferSelfDaemonStop:true` (`httpControlOptionsFromBody`, `projects.ts:253`). If the action result carries a `deferredStopProject`, `scheduleDeferredStopAfterResponse` (`projects.ts:301`) hooks `res.once('finish')` to stop that daemon 50ms **after** the HTTP response flushes — so switching away from the current daemon doesn't kill the connection mid-response. It uses a fresh `DaemonSupervisor().stop(...)` (`projects.ts:313`).
- **RFC7807-style problem taxonomy**: errors flow through `buildAlembicHttpProblem` (from `../problem-taxonomy.js`). `classifyProjectRuntimeProblem` (`projects.ts:371`) maps error message substrings → reason codes (`permission-denied`, `timeout`/`did not become ready`, `cancelled`, `not-found`, `unavailable`, `conflict`, else `internal-error`); `statusForProjectRuntimeReason` (`projects.ts:407`) maps those to HTTP codes (400/403/404/409/504/503/500). `sendAction` (`projects.ts:270`) unifies the try/catch + problem rendering.
- `projectActionPublicData` (`projects.ts:285`) is the stable public shape (action, ok, snapshot, targetProject, stoppedProject, handoff, etc.).

Boundary note: `ProjectRuntimeControl`, `DaemonSupervisor`, and their result/snapshot/handoff types are **all host-owned** (`lib/daemon/*`). `isProjectRuntimeTarget` and the problem-reason kinds come from `@alembic/core/daemon` / core field-failure kinds, but the actual process lifecycle (spawning/stopping daemons, switching active project) is a pure host-runtime concern.

---

### 07.13 Project-Scope — Multi-Folder Scope Registry (`routes/project-scope.ts`)

Responsibility: manage the **ProjectScope registry** — a mapping from folders to named multi-folder project scopes. Supports lookup, listing folders, adding a folder, and resolving which scope owns a folder. Backed by host `ProjectScopeRegistryStore`.

#### Routes

| Method + Path | Purpose | Store call | Anchor |
|---|---|---|---|
| `GET /` | Look up a scope (by id / controlRoot / folderPath) + resolution + summary | `getScope`/`findByControlRoot`/`resolveFolder` | `project-scope.ts:39` |
| `GET /folders` | List folders in the resolved scope | `summarizeProjectScope(scope).folders` | `project-scope.ts:80` |
| `POST /folders` | Add a folder to a scope (`201`) | `store.addFolder()` | `project-scope.ts:107` |
| `POST /resolve-folder` | Resolve scope for a folder (body) | `store.resolveFolder()` | `project-scope.ts:130` |
| `GET /resolve-folder` | Resolve scope for a folder (query) | `store.resolveFolder()` | `project-scope.ts:138` |

#### Notable mechanisms

- **Lookup precedence** (`GET /`, `project-scope.ts:46`): explicit `projectScopeId` → `controlRoot` → resolve by `folderPath` (defaulting to `resolveProjectRoot(getServiceContainer())`). When no scope matches, returns a `null` scope with a `capability` object and the registry path — a well-formed empty response rather than 404.
- **Body normalization**: `firstString(...)` (`project-scope.ts:176`) picks the first non-empty trimmed string from candidates (e.g. `folderPath` OR `path`). `normalizeRole` (`project-scope.ts:172`) restricts role to `'primary-source'|'source'`. `addFolder` failures return `400` with the error message.
- Every response includes `createProjectScopeCapability(true)` and `store.registryPath` so clients know the registry is available and where it lives.

Boundary note: `ProjectScopeRegistryStore`, `createProjectScopeCapability`, `summarizeProjectScope` are host-owned (`lib/project-scope/ProjectScopeRegistry.js`), though ProjectScope as a *domain concept* originates in `@alembic/core` (per the repo boundary). `resolveProjectRoot` is `@alembic/core/workspace`. The route is a thin registry CRUD adapter.

---

### 07.14 File-Changes — Reactive Evolution Feed (`routes/file-changes.ts`)

Responsibility: receive **file-change events** (from the daemon file monitor or external hosts/IDE) and dispatch them to the `FileChangeDispatcher`, returning a `ReactiveEvolutionReport`. Domain-agnostic — it depends on no business service beyond the dispatcher (`file-changes.ts:6`).

#### Routes

| Method + Path | Purpose | Anchor |
|---|---|---|
| `POST /` | Ingest a batch of file-change events → reactive evolution report | `file-changes.ts:56` |

#### Control flow & gotchas

1. Validate body via `FileChangesBody` (`file-changes.ts:40`): non-empty `events` array.
2. Per event, validate structurally: `type ∈ {created,renamed,deleted,modified}` (`VALID_TYPES`, `file-changes.ts:34`), `path` is a string. Invalid events are **silently skipped**.
3. **Path safety**: `isSafeProjectRelativePath` (`file-changes.ts:190`) rejects null bytes, `.`, absolute paths (`/…` or `C:/…`), and any `..` segment. Unsafe paths accumulate; if any exist, respond `400 INVALID_FILE_CHANGE_PATH` (via `buildAlembicHttpProblem`) — the whole batch is rejected (`file-changes.ts:98`). `oldPath` (renames) is checked too.
4. **Event-source normalization** (`normalizeFileChangeEventSource`, `file-changes.ts:174`): validated against `VALID_SOURCES` (built from `DAEMON_FILE_CHANGE_EVENT_SOURCES` + a legacy `'ide-edit'` alias built by `legacyHostEditSource()`, `file-changes.ts:186`); the legacy alias and `'host-edit'` both canonicalize to `'host-edit'`. Missing `eventSource` is passed through as undefined for the dispatcher to infer (backward-compat note at `file-changes.ts:88`).
5. If no valid events remain, return an **empty report** (`{fixed:0,deprecated:0,skipped:0,needsReview:0,suggestReview:false,details:[]}`) with `200`.
6. Else `dispatcher.dispatch(validEvents)` (synchronous, in-process, ms-level per the doc note at `file-changes.ts:130`). On dispatch failure → `500 FILE_CHANGE_DISPATCH_FAILED` (retryable) with a `detailRefs` diagnostics pointer (`file-changes.ts:136`).
7. Log and return `{ success:true, data: report }`.

Boundary note: `FileChangeEvent`/`FileChangeEventSource`/`ReactiveEvolutionReport` types are `@alembic/core/types` (`file-changes.ts:16`); `DAEMON_FILE_CHANGE_EVENT_SOURCES` from host `lib/daemon/RuntimeBoundary.js`. `FileChangeDispatcher` (`lib/service/FileChangeDispatcher.js`) is a **host service** — the reactive-evolution logic it triggers ultimately runs in core, but the transport, validation, and path-safety are host-owned here.

---

### 07.15 Commands — Ad-hoc Commands & File Ops (`routes/commands.ts`)

Responsibility: a grab-bag of **operational commands** (module-map refresh, semantic-index rebuild, command status) plus **project file operations** used by the Xcode Simulator page (file tree, read, save).

#### Routes

| Method + Path | Purpose | Backing | Anchor |
|---|---|---|---|
| `POST /spm-map` | Refresh module/dep map (back-compat name) | `executeDashboardOperation(updateModuleMap)` | `commands.ts:23` |
| `POST /embed` | Full semantic-index rebuild | `executeDashboardOperation(rebuildSemanticIndex)` | `commands.ts:38` |
| `GET /status` | Index + spm-map availability | container probes | `commands.ts:53` |
| `GET /files/tree` | Project source-file tree (`.h/.m/.swift`) | recursive `scanDir` | `commands.ts:85` |
| `GET /files/read` | Read a project-relative file | `readFileSync` (guarded) | `commands.ts:178` |
| `POST /files/save` | Save a project-relative file | WriteZone or `writeFileSync` (guarded) | `commands.ts:209` |

#### Notable mechanisms & gotchas

- **Status probing** (`GET /status`, `commands.ts:53`): tries `container.get('indexingPipeline')` (sets `index.ready`) and `moduleService.listTargets().length>0` (sets `spmMap.available`), each in `try/catch`.
- **File-tree scan** (`commands.ts:85`): recursive, only surfaces `.h/.m/.swift` files, skips a hardcoded `SKIP_DIRS` set (`node_modules`, `.git`, `Pods`, `build`, `DerivedData`, `.build`, `dist`, `vendor`) and hidden entries, folders-first sort. Prunes folders with no matching descendants (returns null).
- **Path-safety for read/save**: `resolveProjectRelativeFilePath` (`commands.ts:257`) rejects empty/null-byte/absolute paths and any `..` escape, resolving strictly under `projectRoot`; failures → `400 INVALID_FILE_PATH` via `sendFilePathProblem` (`commands.ts:286`). Read miss → `404 NOT_FOUND`.
- **WriteZone-preferred save** (`commands.ts:224`): when a `writeZone` singleton (`@alembic/core/io` `WriteZone`) exists, saves go through it (with an additional relative-path check against `wz.projectRoot`), enforcing the configured write zone; otherwise it falls back to a direct `writeFileSync`. This is the safer write path.
- Project root from `_projectRoot` singleton, else `process.cwd()`.

Boundary note: `WriteZone` is `@alembic/core/io`; `DashboardOperations` handlers are host adapters over core workflows. The file-tree/read/save logic and traversal guards are entirely host-owned.

---

### 07.16 Audit — Audit Log Query (`routes/audit.ts`)

Responsibility: read the **audit log**.

| Method + Path | Purpose | Backing | Anchor |
|---|---|---|---|
| `GET /` | Query audit logs (actor/action/result/date range/limit) | `auditStore.query()` | `audit.ts:39` |

`AuditQuery` (`audit.ts:18`) coerces `startDate`/`endDate` to non-negative int (ms), `result ∈ {success,failure}`, `limit` positive default 100. The handler caps `limit` at 500 (`audit.ts:60`), returns `503 SERVICE_UNAVAILABLE` if `auditStore` is falsy, `500 AUDIT_ERROR` on throw, else `{ logs, total }`.

Boundary note: `auditStore` is a container-registered host store (persisted via SQLite). Route is a pure read adapter.

---

### 07.17 Logs — Log File Tail (`routes/logs.ts`)

Responsibility: tail the daemon's on-disk log files.

| Method + Path | Purpose | Anchor |
|---|---|---|
| `GET /` | Tail last N lines of `combined`/`error`/`audit` log, with level/search filters | `logs.ts:60` |

#### Notable mechanisms & gotchas

- `LogsQuery` (`logs.ts:21`): `file ∈ {combined,error,audit}` (default combined), optional `level ∈ {error,warn,info,debug}`, `limit` positive default 200 (capped at 1000 at `logs.ts:73`), optional `search`.
- **Tail algorithm** (`tailLines`, `logs.ts:31`): streams the file line-by-line via `readline`, keeping a rolling window (`splice` when `length > maxLines*2`) to avoid loading the whole file into memory, then slices the last `maxLines`. The route reads `limit*3` raw lines to compensate for post-filtering (`logs.ts:88`).
- Logs dir = `<dataRoot>/.asd/logs`, file = `<name>.log`; a `!filePath.startsWith(logsDir)` guard rejects with `400 INVALID_PATH` (`logs.ts:81`) — since `file` is an enum this is defense-in-depth.
- Each line is JSON-parsed into `{timestamp,level,message,tag,raw}`; non-JSON lines are kept as `{raw}` (skipped when a level filter is active). Result is the last `limit` entries, **newest first** (`logs.ts:142`).
- `503 NO_PROJECT` when no dataRoot; `500 LOG_READ_ERROR` on throw.

Boundary note: `resolveDataRoot` from `@alembic/core/workspace`; the tail/filter logic and the `.asd/logs` layout are host-owned. Pure filesystem read — no core engine.

---

### 07.18 Health — Liveness/Readiness/Identity (`routes/health.ts`)

Responsibility: lightweight, dependency-free health probes (distinct from the rich `daemon/health` in §07.3).

| Method + Path | Purpose | Anchor |
|---|---|---|
| `GET /` | Liveness (`status:'healthy'`, uptime, `version:'2.0.0'`) | `health.ts:13` |
| `GET /ready` | Readiness (`ready:true`) | `health.ts:28` |
| `GET /identity` | Provenance identity from git/env | `getDeveloperIdentity()` | `health.ts:41` |

`timestamp` is Unix seconds. The `version:'2.0.0'` literal here is a **hardcoded** placeholder — the real package version is surfaced by `daemon/health` via `getPackageVersion()` (§07.3), a discrepancy to be aware of.

Boundary note: `getDeveloperIdentity` from `@alembic/core/shared` (provenance only, not auth). Everything else is inline host code.

---

### 07.19 Violations — Guard Violation Records (`routes/violations.ts`)

Responsibility: manage persisted **Guard violation records** produced by the `guard/file` checks (§07.6).

| Method + Path | Purpose | Store call | Anchor |
|---|---|---|---|
| `GET /` | List violations (filter severity/ruleId/file, paged) | `violationsStore.list()` | `violations.ts:38` |
| `GET /stats` | Violation stats summary | `violationsStore.getStats()` | `violations.ts:70` |
| `POST /clear` | Clear violations (`all` or by ruleId/file) | `violationsStore.clearAll()`/`clear()` | `violations.ts:86` |

`ViolationsQuery` (`violations.ts:18`): `limit` default 50 (capped 200 at `violations.ts:44`), `page` default 1, optional `file`/`ruleId`/`severity`. `ViolationsClearBody` (`violations.ts:26`): `all?`, `file?`, `ruleId?` (`.passthrough()`). No `confirmed` gate on `/clear`.

Boundary note: `violationsStore` is a container-registered host store (the same one `guard/file` appends to via `appendRun`). Pure CRUD adapter.

---

### 07.20 Consolidated Boundary Note (host-owned vs delegated)

This section's routers are uniformly **thin host adapters**. The host (`Alembic/`) owns, for these routes:

- **Transport & shaping**: Express routers, Zod validation, the `{ success, data }` / problem-taxonomy envelope, HTTP status mapping, SSE plumbing (`utils/sse-sessions.ts`), the daemon-token gate, the `confirmed` gate, and Gateway auditing (`req.gw`).
- **Runtime & process control**: `DaemonJobRunner` + JobStore + snapshot/artifact stores (§07.2), daemon health assembly + `ProjectRuntimeControl`/`DaemonSupervisor`/`RuntimeBoundary`/`FileMonitorStatus` (§07.3, §07.12), the ProjectScope registry store (§07.13), and file I/O with traversal guards (§07.4 reports, §07.11 wiki files, §07.15 files, §07.17 logs).
- **Host services** resolved from the DI container: `moduleService`, `guardService`, `guardFeedbackLoop`, `violationsStore`, `auditStore`, `bootstrapTaskManager`, `fileChangeDispatcher`, `SkillFileService`, `WikiGenerator`, `realtimeService`, `writeZone`, and the dashboard-operation handler table.

Delegated to **`@alembic/core`** (the engine): the `GuardCheckEngine` + `detectLanguage` + enhancement rules (§07.6), `ProposalExecutor` + Proposal/Warning repositories (§07.5), `decayDetector`/`stagingManager`/`enhancementSuggester` governance services (§07.8), `SignalTraceWriter` + `ReportStore` (§07.9), the daemon capability/health *descriptor factories* and job/runtime *types* (`@alembic/core/daemon`), `WorkspaceSettingsStore`/`LanguageService`/`ioLimit`/`NotFoundError`/`getDeveloperIdentity`/`getTestModeConfig` (`@alembic/core/shared`), `WriteZone` (`@alembic/core/io`), `FileChangeEvent`/`ReactiveEvolutionReport` types (`@alembic/core/types`), and `resolveDataRoot`/`resolveProjectRoot`/`DEFAULT_KNOWLEDGE_BASE_DIR` (`@alembic/core/workspace`).

Delegated to **`@alembic/agent`**: `ToolResultEnvelope`/`ToolResultDiagnostics`/`ToolResultTrust` types used by the dashboard-operation envelope (`utils/dashboard-operation.ts:2`) — the operation *handlers* live in the host `#tools/adapters`, but the envelope contract is the agent tool contract.

The single recurring rule: **these routes never implement organism logic**; they validate input, resolve a service/engine, invoke one method, and shape the response. When modifying a route, business behavior changes belong in the backing host service or in `@alembic/core`, not in the router file.


---


## 08. AI Execution Workflows I — Runtime Setup, Dimensions & Session Building

### 8.1 Responsibilities & role in the system

This subsystem — `lib/workflows/ai-execution/` — is the **host-side AI mining execution engine**. It is the layer that turns "we have a set of knowledge *dimensions* to mine for this project" into concrete `@alembic/agent` agent runs, drives those runs (parallel/tiered), and threads cross-dimension memory/context through them. It does **not** implement the LLM agent loop, the memory stores, the tier scheduler, or the dimension catalog — those are delegated to `@alembic/agent` and `@alembic/core`. What lives here is the **orchestration + wiring + projection + evidence plumbing** that a host process needs.

Concretely, this section covers the "setup and dispatch" half of that engine:

- **Runtime bootstrap** — building the per-session runtime bundle (`DimensionContext`, `SessionStore`, semantic memory, `MemoryCoordinator`) — `RuntimeInitializer.ts`.
- **Cross-dimension context** — the accumulating `DimensionContext` that lets dimension N see the digests of dimensions 1..N-1 — `DimensionContext.ts`.
- **Admission & state restore** — deciding, per dimension, whether to *run* it or *restore* it from an incremental plan or an on-disk checkpoint — `DimensionAdmission.ts`, `DimensionRestoreState.ts`.
- **Per-dimension runtime input** — assembling the `AgentRunInput` (system run context, budget, strategy context, PCV evidence) for one dimension — `DimensionRuntimeBuilder.ts`, `AgentRunInputBuilders.ts`.
- **The pipeline & session** — the top-level `runAiDimensionPipelineForResult` orchestration and the parent "bootstrap-session" agent run that fans out to child dimension runs — `AiDimensionPipeline.ts`, `AiDimensionPreparation.ts`, `AiDimensionSessionRunner.ts`, `SessionExecutionBuilder.ts`.
- **TaskManager dispatch glue** — creating the task-ledger session and the fire-and-forget async fill — `AiDimensionDispatcher.ts`, `TaskManagerDispatch.ts`.
- **Rescan context** — seeding dedup sets and per-dimension existing-recipe / execution-decision context for rescans — `RescanContext.ts`.
- **Shared types** — the DI container and task-manager shapes this engine expects — `AiDimensionTypes.ts`.

> The result-consumption half (projections, consumers, finalizer, PCV evidence builders) lives in sibling files (`AgentRunProjections.ts`, `BootstrapConsumers.ts`, `AiDimensionFinalizer.ts`, `PcvNodeEvidence.ts`) and is documented in the next section. This section references them only where the setup path calls into them.

#### 8.1.1 Who calls this engine (entrypoints)

The engine is invoked from two host workflows, both of which supply a `ProjectContextFillView` + a `DimensionDef[]`:

| Caller | File:line | Mode | Sync/async |
|---|---|---|---|
| Cold-start (first bootstrap) | `lib/workflows/cold-start/ColdStartWorkflow.ts:245,265` | `mode: 'bootstrap'` | `startAiDimensionSession` then `dispatchAiDimensionRuns` (fire-and-forget async fill) |
| Knowledge rescan | `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:647,783,786` | `mode: 'rescan'` | either inline (`runAiDimensionPipelineForResult`) or async (`dispatchAiDimensionRuns`), chosen by `runInternalFillInline` |

Cold-start returns a **skeleton** of dimension tasks immediately and fills content asynchronously; the Dashboard receives progress over Socket.io while cards go `loading → complete` (`ColdStartWorkflow.ts:236-285`). The rescan path can additionally run **inline** when the caller needs to await the fill (`KnowledgeRescanWorkflow.ts:778-784`).

### 8.2 What "dimensions" are, and how plan selection / PCV feed in

A **dimension** (`DimensionDef`, imported from `@alembic/core/types`) is one knowledge-mining axis — e.g. an architecture-conventions axis, an API-surface axis, a design-pattern axis. The **catalog of dimensions is Core-owned**, not defined here: `ProjectContextWorkflowFacts.ts:400` builds the active list as `const dimensions: DimensionDef[] = [...baseDimensions]`, where `baseDimensions` and the richer `DIMENSION_CONFIGS_V3` map both come from `@alembic/core/host-agent-workflows` (`ProjectContextWorkflowFacts.ts:5,13`; `DimensionRuntimeBuilder.ts:10-16`). Each `DimensionDef` carries `id`, `label`, `guide`, and output-shape flags (`skillWorthy`, `dualOutput`, `skillMeta`, `knowledgeTypes`, `tierHint`).

**How plan selection feeds in.** This engine does **not** itself run `alembic_plan` or apply a `PlanSelection`. By the time a `DimensionDef[]` reaches `runAiDimensionSession`, the *selection of which dimensions exist and are active* has already been resolved upstream (in the project-context facts / plan workflow). What this engine does per dimension is a finer admission + output-shape decision:

- **Output shape** is resolved in `resolveBootstrapDimensionPlan` (`DimensionRuntimeBuilder.ts:73-140`). It merges `getFullDimensionConfig(dimId)` / `DIMENSION_CONFIGS_V3[dimId]` / the `DimensionDef` fields into a `BootstrapDimensionConfig`, then computes `needsCandidates` — whether the dimension must *produce* Recipe candidates vs only emit an analysis/skill (`DimensionRuntimeBuilder.ts:118-129`).
- **Rescan execution decisions** (produced by the rescan planner in Core, type `KnowledgeRescanExecutionDecision`) further gate `needsCandidates`: even a candidate-producing dimension is downgraded to no-candidates unless its decision is `mode === 'produce'` with `createBudget > 0` (`DimensionRuntimeBuilder.ts:125-129`).

**PCV** ("Provider tool-Choice / analyze-grounding" verification, the AlembicAgent grounding guard) feeds in two ways, both **additive metadata**, never as a gate at this layer:

1. **PCV stage-node context** — a small static map (`analyze` / `quality_gate` / `record_repair` → `pcvNodeId`/`chainNodeId`, `PcvNodeEvidence.ts:161-176`) is injected into every dimension's `AgentRunInput` under `pcvStageNodeMap`/`pcvChainNodes` and `strategyContext.pcvStageNodeMapContract` (`DimensionRuntimeBuilder.ts:255-277`, `SessionExecutionBuilder.ts:444-500`, `AgentRunInputBuilders.ts:68-99,116-142`). This lets downstream evidence builders tag which PCV chain node a piece of evidence belongs to.
2. **Grounding enforcement opt-in** — `resolveBootstrapGroundingEnforcement()` (`AiDimensionSessionRunner.ts:342-347`) reads the env var `ALEMBIC_GROUNDING_ENFORCEMENT` (`'guard'` | `'off'` | unset). When set, it is passed on the **session execution** options (`SessionExecutionBuilder.ts:233-235`) so the coordinator propagates it uniformly to every child dimension → AgentRuntime's analyze-grounding guard. When unset, the field is omitted and child runs fall back to the runtime global default (observe-only) — i.e. **zero behavior change for ordinary bootstrap/rescan** (the AP-7 design; see the Chinese comment at `AiDimensionSessionRunner.ts:338-341`).

### 8.3 The pipeline: control flow

The canonical entry is `runAiDimensionPipelineForResult(view, dimensions)` in `AiDimensionPipeline.ts:26-60`. Its control flow:

1. **Prepare** — `prepareAiDimensionRun(view, dimensions)` (`AiDimensionPipeline.ts:30`, impl `AiDimensionPreparation.ts:48-113`). Extracts facts from the `ProjectContextFillView`, resolves data root, decides `isIncremental`, grabs the `AgentService` + `SystemRunContextFactory` + `bootstrapTaskManager` from the DI container, and computes `aiUnavailable`.
2. **AI-availability gate** — if `aiUnavailable`, or the agent service / run-context factory is missing, emit an "AI unavailable" progress event, mark every dimension `skipped/ai-unavailable`, and return `{ sessionResult: null, skippedReason: 'ai-unavailable' }` (`AiDimensionPipeline.ts:32-39`; `emitAiDimensionAiUnavailable` at `AiDimensionPreparation.ts:115-127`). **This is a hard stop — the product refuses to fabricate output without a real provider** (`AiRuntimeStatus.ts` header comment; `getAiRuntimeStatus` returns `ready:false` for missing or `mock` providers).
3. **Initialize runtime** — `initializeBootstrapRuntime({...})` (`AiDimensionPipeline.ts:41-54`) builds the runtime bundle (§8.4).
4. **Run session** — `runAiDimensionSession({ preparation, runtime })` (`AiDimensionPipeline.ts:57`; impl `AiDimensionSessionRunner.ts:54-323`) — the core admission → build-input → parent-agent-run → consume loop (§8.6).
5. **Finalize** — `finalizeAiDimension({ preparation, runtime, sessionResult, startedAtMs })` (`AiDimensionPipeline.ts:58`; impl in sibling `AiDimensionFinalizer.ts`) — persists the workflow result, consumes skills, writes report history, aggregates PCV process metrics. (Detailed in the next section.)

`runAiDimensionPipeline` (`AiDimensionPipeline.ts:62-67`) is the void-returning wrapper used by the async dispatch path; `dispatchAiDimensionRuns` (`AiDimensionDispatcher.ts:40-46`) hands *this* function to `dispatchPipelineFill` as the `fillDimensions` callback.

`AiDimensionPipeline.ts` also exports two utilities: `clearSnapshots` (clears ProjectContext file snapshots to force a full rebuild, `AiDimensionPipeline.ts:69-86`) and a re-export of `clearDimensionCheckpoints as clearCheckpoints` from Core (`AiDimensionPipeline.ts:88`).

### 8.4 Runtime bootstrap — `RuntimeInitializer.ts`

`initializeBootstrapRuntime` (`RuntimeInitializer.ts:43-114`) constructs the per-session runtime bundle and stashes several singletons on the DI container:

- **File cache** — `container.singletons._fileCache = allFiles` (`RuntimeInitializer.ts:62`).
- **Project-scope source identities** — builds a `ProjectScopeSourceIdentityMap` from the passed identities and stores both list and map on singletons (`RuntimeInitializer.ts:63-67`). These map mined files back to their owning source folder (multi-repo scope disambiguation).
- **`projectInfo`** — `{ name: basename(projectRoot), lang, fileCount }` (`RuntimeInitializer.ts:68-72`).
- **`DimensionContext`** — a fresh cross-dimension container seeded with immutable project facts (name, lang, fileCount, targetCount, module list, depGraph, astMetrics, guardSummary) (`RuntimeInitializer.ts:74-83`). See §8.5.
- **`SessionStore`** (from `@alembic/agent/memory`) — created via `createBootstrapSessionStore` (`RuntimeInitializer.ts:116-140`). On an incremental run with `incrementalPlan.restoredEpisodic`, it tries to restore a prior `SessionStore` from that episodic memory's JSON (`restoreBootstrapSessionStore`, `RuntimeInitializer.ts:142-160`); on any restore failure it logs and falls back to a fresh store.
- **Digest sync on restore** — if incremental and episodic memory was restored, `syncRestoredSessionStoreDigests` copies each restored dimension's digest from the `SessionStore` into the `DimensionContext` (`RuntimeInitializer.ts:90-92`; impl `DimensionRestoreState.ts:20-42`).
- **Semantic memory** — `createBootstrapSemanticMemory` (`RuntimeInitializer.ts:162-209`) builds a `PersistentMemory` (`@alembic/agent/memory`) over the container's `database`, wiring an `embeddingFn` from `_embedProvider` (or falling back to `aiProvider.embed`) and a `MemoryEmbeddingStore(dataRoot)`. It is **non-blocking**: any failure logs a warning and returns `null` (`RuntimeInitializer.ts:203-208`). If a DB is present and has prior memories it logs the loaded counts by type (`RuntimeInitializer.ts:195-201`).
- **`MemoryCoordinator`** — wraps the semantic (`persistentMemory`) + `sessionStore` in `bootstrap` mode (`RuntimeInitializer.ts:98-102`).

The returned bundle (`RuntimeInitializer.ts:104-113`): `{ projectGraph (always null here — see line 57), projectInfo, dimContext, sessionStore, semanticMemory, memoryCoordinator, projectScopeSourceIdentities, projectScopeSourceIdentityMap }`.

> Note the log line at `RuntimeInitializer.ts:58-60`: "Using unified AgentRuntime pipeline (no legacy Analyst/Producer wrappers)". `projectGraph` is hard-coded `null` (`:57`) — the old projectGraph path is retired; downstream code still accepts a `projectGraph` param but the runtime supplies none.

### 8.5 Cross-dimension context — `DimensionContext.ts`

`DimensionContext` (`DimensionContext.ts:61-196`) is the in-process, internal-agent-only accumulator that gives each dimension visibility into earlier dimensions' conclusions. (The doc comment notes the *external* agent path uses `BootstrapSession + EpisodicMemory` instead — `DimensionContext.ts:1-5`.)

State it holds:

- `projectContext` — immutable project base info (`DimensionContext.ts:63,17-26`).
- `completedDimensions: Map<dimId, DimensionDigest>` — each dimension's analysis digest (`DimensionContext.ts:62`).
- `submittedCandidates: CandidateSummary[]` — running list of submitted candidates (`DimensionContext.ts:64`).

Key methods:

| Method | File:line | Purpose |
|---|---|---|
| `addDimensionDigest(dimId, digest)` | `DimensionContext.ts:83-89` | Store a completed dimension's digest, stamped with `dimId` + `completedAt` |
| `addSubmittedCandidate(dimId, info)` | `DimensionContext.ts:96-106` | Append a submitted candidate summary |
| `buildContextForDimension(currentDimId)` | `DimensionContext.ts:113-136` | Snapshot given to the agent for the current dimension: project facts + previous-dimension digests (summary/keyFindings/crossRefs/gaps/remainingTasks) + existing candidate titles |
| `getExistingCandidatesForDimension(dimId)` | `DimensionContext.ts:139-141` | Candidates already submitted for a dimension (used when recomputing it) |
| `getDigestsSummaryText()` | `DimensionContext.ts:147-176` | Compact markdown of all completed digests for prompt injection (Chinese-labelled: 摘要/产出候选/关键发现/缺口/遗留任务) |
| `toJSON()` / `static fromJSON()` | `DimensionContext.ts:179-195` | Checkpoint serialize/restore |

The module also exports `parseDimensionDigest(reply)` (`DimensionContext.ts:206-246`), which extracts a `{"dimensionDigest": {...}}` JSON block from the agent's free-form final reply — trying a fenced-code-block regex first (`:212`), then a bare-JSON fallback (`:217`), validating that at least `summary` or `candidateCount` is present. This is how a dimension's textual output becomes a structured digest for the *next* dimension.

### 8.6 The session runner — `AiDimensionSessionRunner.ts`

`runAiDimensionSession` (`AiDimensionSessionRunner.ts:54-323`) is the heart of the engine. Step-by-step:

1. **Resolve services & knobs** — `resolveAiDimensionServices` (throws if `agentService`/`systemRunContextFactory` missing, `:349-360`); `resolveAiDimensionConcurrency` (env-driven, §8.9); `resolveBootstrapGroundingEnforcement` (§8.2); `new TierScheduler()` from Core (`:65`).
2. **Active dim ids** — `preparation.dimensions.map(d => d.id)` (`:66`).
3. **Rescan state** — `prepareBootstrapRescanState(...)` builds the global dedup sets, a `BootstrapDedup`, and the `rescanContext` (§8.8).
4. **Admissions** — `resolveBootstrapDimensionAdmissions({...})` decides per dimension run vs restore (§8.7). Then `applyBootstrapDimensionAdmissions` seeds `dimensionStats`/`candidateResults`/`dimensionCandidates` for the restored dimensions so they appear "already done" without an agent run (`:95-101`).
5. **Define closures** — three per-session closures capture runtime + preparation:
   - `resolveBootstrapDimensionPlan(dimId)` → `resolveBootstrapDimensionPlanData` (`:103-109`).
   - `createBootstrapDimensionRunInput(dimId, plan)` → `createBootstrapDimensionRuntimeInput` (§8.10) (`:111-139`).
   - `consumeBootstrapDimensionAgentResult({...})` — projects the child `AgentRunResult`, emits process events, and calls `consumeBootstrapDimensionResult` (`:141-198`).
   - plus `consumeBootstrapDimensionError`, `consumeBootstrapSessionTierResult` (tier reflection), and `consumeBootstrapSessionResult` (`:200-250`).
6. **Build the parent session input** — `buildBootstrapSessionExecutionInput({...})` (§8.11) returns `{ input }` — the parent "bootstrap-session" `AgentRunInput` with its `children` lazily produced (`:252-271`).
7. **Run the parent** — `services.agentService.run(bootstrapSessionInput)` (`:283`). This single call drives the entire tiered/parallel fan-out inside `@alembic/agent`; the child dimension runs happen *inside* the agent service, calling back into the coordination callbacks wired in §8.11. Success/failure are logged with `sessionId`, duration, status, child-result count, tool-call count, usage (`:284-302`).
8. **Consume session result** — `consumeBootstrapSessionResult({ parentRunResult, durationMs })` reconciles child results, filling any missing dimension via `consumeBootstrapDimensionError('missing child result')` (`:233-250,303`).
9. **Return** an `AiDimensionSessionResult` (`:311-322`) with active/skipped dim ids, `candidateResults`, `dimensionCandidates`, `dimensionStats`, `bootstrapDedup`, `admissions`, `enableParallel`, `concurrency`.

### 8.7 Admission & state restore — `DimensionAdmission.ts` + `DimensionRestoreState.ts`

`resolveBootstrapDimensionAdmissions` (`DimensionAdmission.ts:42-104`) classifies every active dimension into one of three statuses:

| Status | Meaning | Set by |
|---|---|---|
| `run` | Execute a fresh agent run | default; also forced by rescan (`forcedByRescan`) |
| `incremental-restored` | No change detected in this incremental run → reuse historical result | `resolveIncrementalSkippedDimensions` |
| `checkpoint-restored` | An on-disk dimension checkpoint is still valid → reuse it | `restoreCheckpointDimensions` |

Decision logic:

1. **Rescan force-execute** — dims whose rescan `executionDecisions[dimId].shouldExecute === true` are collected as `rescanForceExecuteDimIds` (`DimensionAdmission.ts:61-63`); these always win (they're excluded from incremental skip and marked `forcedByRescan`).
2. **Incremental skip** — `resolveIncrementalSkippedDimensions` (`DimensionRestoreState.ts:44-83`): only when `isIncremental` + a plan; a dim is skipped if it is **not** in `incrementalPlan.affectedDimensions` **and** it *is* in `incrementalPlan.skippedDimensions` (and not force-executed). Each skip emits `emitDimensionComplete(dimId, {type:'incremental-restored', reason:'no-change-detected'})` (`DimensionRestoreState.ts:64-74`).
3. **Checkpoint restore** — **disabled in rescan mode**: `checkpointRestoreDimIds = rescanContext ? [] : activeDimIds` (`DimensionAdmission.ts:72-77`, with an explicit log). Otherwise `restoreCheckpointDimensions` (`DimensionRestoreState.ts:85-122`) loads `loadDimensionCheckpoints(dataRoot)` (from Core), and for any active dim with a checkpoint: copies the digest into both `dimContext` and `sessionStore`, emits `emitDimensionComplete(...{type:'checkpoint-restored', ...checkpoint})`, and adds it to `skippedDims`.
4. **Build decisions** — `buildBootstrapDimensionAdmissionDecisions` (`DimensionAdmission.ts:106-146`) applies precedence **incremental > checkpoint > run**. `skippedDimIds` = every decision whose status ≠ `run` (`DimensionAdmission.ts:96-98`).

`applyBootstrapDimensionAdmissions` (`DimensionAdmission.ts:148-173`) → `applyRestoredDimensionState` (`DimensionRestoreState.ts:124-156`) then *materializes* the restored dimensions' stats:

- **Incremental-skipped** (`restoreIncrementalSkippedDimension`, `:158-182`): reads the dim's report from the `SessionStore` and writes a `DimensionStat` with `skipped:true, restoredFromIncremental:true` and zeroed timing/tokens.
- **Checkpoint-skipped** (`restoreCheckpointDimension`, `:184-235`): reads the checkpoint, writes a `DimensionStat` with `skipped:true, restoredFromCheckpoint:true`, adds `candidateCount` to `candidateResults.created`, and — critically — if the checkpoint has `analysisText`, re-hydrates `dimensionCandidates[dimId].analysisReport` and re-stores the dimension report in the `SessionStore` so **Skill generation stays enabled** for restored dims (`:214-234`). A dim in both lists prefers incremental (checkpoint branch guarded by `!incrementalSkippedDims.includes(dimId)`, `:144-145`).

### 8.8 Rescan context — `RescanContext.ts`

`prepareBootstrapRescanState` (`RescanContext.ts:44-87`) builds the dedup + rescan bundle:

- **Dedup sets** — `globalSubmittedTitles`, `globalSubmittedPatterns`, `globalSubmittedTriggers`, plus a `BootstrapDedup` instance (from `@alembic/core/service/bootstrap`). On a rescan, it *seeds* the title/trigger sets from existing (non-decaying) recipes so the agent won't re-propose them (`RescanContext.ts:61-73`). Titles are lowercased+trimmed; decaying recipes are **not** seeded into titles (so they can be re-proposed) but their triggers still occupy the trigger set.
- **`rescanContext`** — `buildBootstrapRescanContext` (`RescanContext.ts:89-120`) partitions existing recipes into `existingRecipes` (non-decaying) vs `decayingRecipes`, records `occupiedTriggers`, a per-dimension `coverageByDim` count, and the `executionDecisions` keyed by `dimensionId`. Dimension keying uses `recipeDimensionKey` (`:168-176`), which prefers `resolveRecipeDimensionId(recipe)` (Core) then falls back through `dimensionId`/`category`/`knowledgeType`/`'unknown'`.

Per-dimension projections used when building a run:

- `getBootstrapDimensionExistingRecipes({rescanContext, dimId})` (`:122-135`) — existing + decaying recipes for that dim.
- `projectBootstrapDimensionRescanContext({rescanContext, dimId})` (`:137-166`) — the compact rescan facts injected into the strategy context: `existingRecipes`, `decayingRecipes`, `occupiedTriggers`, and gap/budget/mode fields. When there is no explicit `executionDecision`, it **falls back to a target of 5 recipes/dim**: `fallbackGap = max(0, 5 - existing)` and `executionMode = fallbackGap>0 ? 'produce' : 'skip'` (`:147-151,160-164`).
- `projectBootstrapExistingRecipesForPrompt(recipes)` (`:178-195`) — trims recipes down to `{id,title,trigger,content,sourceRefs,auditHint}` for prompt inclusion, deriving an `auditHint.verdict` of `'decay'` vs `'watch'` from status.

### 8.9 Concurrency & grounding knobs — `AiDimensionSessionRunner.ts`

`resolveAiDimensionConcurrency(env)` (`AiDimensionSessionRunner.ts:325-336`):

| Env var | Effect | Default |
|---|---|---|
| `ALEMBIC_PARALLEL_BOOTSTRAP` | `'false'` disables parallelism (concurrency forced to 1) | enabled |
| `ALEMBIC_PARALLEL_CONCURRENCY` / `ALEMBIC_BOOTSTRAP_CONCURRENCY` | integer max concurrent dimensions | `3` |

Non-finite or non-positive values fall back to 3 (`:329-331`). `ALEMBIC_PARALLEL_CONCURRENCY` takes precedence over `ALEMBIC_BOOTSTRAP_CONCURRENCY`.

`resolveBootstrapGroundingEnforcement(env)` (`:342-347`) — returns `'guard'`, `'off'`, or `undefined` from `ALEMBIC_GROUNDING_ENFORCEMENT` (see §8.2). Only quality-validation (PCVM/Test) sessions are expected to set this.

### 8.10 Per-dimension runtime input — `DimensionRuntimeBuilder.ts`

`createBootstrapDimensionRuntimeInput({...})` (`DimensionRuntimeBuilder.ts:142-305`) assembles the `AgentRunInput` for **one** dimension. Steps:

1. **Analyst scope** — `analystScopeId = ${dimId}:analyst`; `memoryCoordinator.createDimensionScope(analystScopeId)` (`:197-198`).
2. **Effective output type** — `needsCandidates ? 'candidate' : dimConfig.outputType || 'analysis'` (`:199`); a `dimensionMeta` records `outputType` + `allowedKnowledgeTypes` (`:200-204`).
3. **Context window & budget** — `systemRunContextFactory.createContextWindow({isSystem:true})` (`:206`), then `computeAnalystBudget(fileCount, contextWindow.tokenBudget)` from `@alembic/agent/prompts` (`:207-210`).
4. **Strategy fields (the bulky evidence surface)** — `bootstrapStrategyFields` (`:211-235`) carries the project overview, panorama context (`buildPanoramaContext`, §8.10.1), evidence starters (`buildEvidenceStarters` from Core, over AST/guard/dep/call-graph/panorama data, `:220-226`), the per-dim rescan context, existing recipes for the prompt, and the project-scope identity map.
5. **System run context** — `createSystemRunContext({...})` from `@alembic/agent/runtime` (`:236-278`): wires the memory coordinator, scope, active context, context window, an `ExplorationTracker.resolve({source:'system',strategy:'analyst'}, computedBudget)`, output type, dimension id/label, project language, `dimensionMeta`, plus `sharedState` (the global dedup sets + `_bootstrapDedup` + project-scope map + PCV stage-node maps) and `extraFields` (computed budget + PCV maps + `pcvStageNodeMapContract`).
6. **Compaction** — `compactBootstrapSystemRunContext` (`:307-329`) strips the `SystemRunContext` down to a token-lean subset (only runtime references + PCV maps) — the comment at `:280-281` explains the split: **runtime references stay in `systemRunContext`, bulky project/evidence facts have one owner in `strategyContext`** ("PCVM token-efficiency").
7. **Strategy context** — `{ ...projectSystemRunContext(compactSystemRunContext), ...bootstrapStrategyFields }` (`:282-285`).
8. **Delegate to the input builder** — `buildBootstrapDimensionRunInput({...})` (`AgentRunInputBuilders.ts`, §8.12) produces the final `AgentRunInput`; the function returns `{ analystScopeId, runInput }` (`:286-304`).

#### 8.10.1 `buildPanoramaContext`

`buildPanoramaContext(panoramaResult)` (`DimensionRuntimeBuilder.ts:331-374`) extracts a compact orientation blob from a Core Panorama result: module role/layer/coupling (from the first module in the map), layer names (`L{level}:{name} → ...`), and up to 5 modules' `suggestedFocus` gaps. It is fully defensive — any error yields `null` (`:371-373`). **Note:** during a bootstrap fill `preparation.panoramaResult` is `null` (`AiDimensionPreparation.ts:92`), so this returns `null` on the main path; the function is live for callers that do supply a panorama.

### 8.11 Session execution builder — `SessionExecutionBuilder.ts`

`buildBootstrapSessionExecutionInput({...})` (`SessionExecutionBuilder.ts:72-249`) builds the **parent** session `AgentRunInput` and the coordination callbacks. Key mechanics:

- **Children** — for each active, non-skipped dim, `buildBootstrapDimensionChildPlan` (`:93-112,251-357`) produces a `BootstrapSessionChildRunPlan` with `{ id, label, tier, input, lazyInputFactory }`. The `input` is a *planned* placeholder (`buildBootstrapDimensionPlannedInput`, `:429-501`); the **real** heavy input is produced lazily by `lazyInputFactory` (`:299-355`) only when the agent service actually schedules that child. The lazy factory: asserts the session is still active, marks the dimension start (`beginBootstrapDimensionExecution`), calls `createDimensionRunInput` (the §8.10 builder), attaches the progress bridge, injects PCV context, builds PCV N8/N9 evidence, records it into `dimensionStats[dimId].pcvNodeEvidence`, records `childExecutionState`, and emits `bootstrap-dimension-input` process events.
- **Tier assignment** — `resolveBootstrapDimensionTier` (`:555-565`): honors `dim.tierHint` (1-based → 0-based) if present, else `scheduler.getTierIndex(dimId)` (Core `TierScheduler`), else 0.
- **`onChildResult` coordination** (`:126-201`) — for each finished child: logs; computes a `runIssue` via `resolveBootstrapDimensionRunIssue`; on a *recoverable producer-summary timeout* (candidates were submitted but the summary call timed out) it logs and still consumes the produced candidates (`isRecoverableProducerTimeoutIssue`, `:172-193`); otherwise a real issue routes to `consumeDimensionError`; success routes to `consumeDimensionResult` with the captured `dimStartTime`/`analystScopeId`.
- **`onTierComplete`** (`:202-223`) — collects the tier's dim stats into a `Map` and calls `consumeTierResult` (tier reflection).
- **Execution options** (`:226-236`) — `abortSignal` from the session; `shouldAbort()` polls the `taskManager` for session-invalid / user-cancelled; conditional `groundingEnforcement`.
- **Progress bridge** — `attachBootstrapAgentProgressBridge` (`:359-406`) wraps the child's `onProgress` to also translate progress events into `bootstrap-agent-progress` process events (non-blocking; the previous observer is still called).

The parent input itself is produced by `buildBootstrapSessionRunInput` (§8.12), fed `children`, `params.concurrency`, and the coordination callbacks.

### 8.12 Agent-run input builders — `AgentRunInputBuilders.ts`

Two builders:

- **`buildBootstrapDimensionRunInput(opts)`** (`AgentRunInputBuilders.ts:51-150`) — the per-dimension `AgentRunInput`:
  - `profile: { id: 'bootstrap-dimension' }` (`:101`).
  - `params: { dimId, needsCandidates, hasExistingRecipes, prescreenDone }` (`:102-107`).
  - `message`: role `'internal'`, content `Bootstrap dimension: <label>`, metadata carrying `sessionId`, `dimension`, `phase:'bootstrap'`, and PCV maps (`:108-122`).
  - `context` (cast through `unknown` to `AgentRunContext`): `source:'bootstrap'`, `runtimeSource:'system'`, `lang`, `fileCache: allFiles`, the compacted `systemRunContext`, the `enrichedStrategyContext`, `contextWindow`, `trace`, `memoryCoordinator`, `sharedState`, `promptContext`, plus PCV maps threaded through every sub-object (`:123-144`).
  - `execution.abortSignal` (`:145-147`), `presentation.responseShape:'system-task-result'` (`:148`).
  - `BootstrapFileEntry` (`:25-32`) is the file-cache shape (name/path/relativePath/content + optional `sourceIdentity`/`targetName`).
- **`buildBootstrapSessionRunInput(opts)`** (`AgentRunInputBuilders.ts:206-262`) — the parent session `AgentRunInput`:
  - `profile: { id: 'bootstrap-session' }` (`:216`).
  - `params.dimensions` — a projected list of children `{ id, label, tier?, params, message, metadata, promptContext }` (`:218-227`).
  - `context.childContexts` — a `dimId → child context` map, and `context.childInputFactories` — a `dimId → lazyInputFactory` map (`:245-256`). **This is the mechanism by which the agent service materializes each child's heavy input on demand.**
  - `execution`/`presentation` default to the first child's, else `system-task-result`.

### 8.13 TaskManager dispatch glue — `AiDimensionDispatcher.ts` + `TaskManagerDispatch.ts`

- **`buildTaskDefs(dimensions)`** (`TaskManagerDispatch.ts:23-34`) — one `TaskDef` per dimension `{ id, meta:{ type: skillWorthy?'skill':'candidate', dimId, label, skillWorthy, skillMeta } }`. This is the *task-ledger skeleton* the Dashboard renders as cards.
- **`startTaskManagerSession(container, taskDefs, logger, logPrefix)`** (`TaskManagerDispatch.ts:36-53`) — pulls `bootstrapTaskManager` from the DI container and calls `startSession(taskDefs)`, returning a `BootstrapSessionShape | null`. Failure is **graceful degradation** — logs a warning and returns `null` (so bootstrap still proceeds without a task ledger).
- **`dispatchPipelineFill(view, dimensions, fillDimensions, logPrefix)`** (`TaskManagerDispatch.ts:55-72`) — schedules the async fill via `setImmediate`, running `fillDimensions(view, dimensions)` fire-and-forget with a `.catch` that logs (never throws) (`:64-71`). This is what makes the cold-start "return skeleton, fill later" model work.
- **`AiDimensionDispatcher.ts`** re-exports these as `buildAiDimensionTaskDefs`, `startAiDimensionSession` (build task defs + start session, `:24-38`), and `dispatchAiDimensionRuns` (dispatch the async fill via `runAiDimensionPipeline`, `:40-46`). Its type aliases (`:10-13`) derive from the dispatch functions' signatures.

### 8.14 Preparation view — `AiDimensionPreparation.ts` (data-flow entry)

`prepareAiDimensionPipeline(view, dimensions)` (`AiDimensionPreparation.ts:48-113`) turns the `ProjectContextFillView` into the flat `AiDimensionPreparation` bag every downstream step consumes. Notable derivations:

- `dataRoot` = `resolveDataRoot(container) || projectRoot` (`:55-56`, `resolveDataRoot` from `@alembic/core/workspace`).
- `isIncremental` = `incrementalPlan.canIncremental === true && incrementalPlan.mode === 'incremental'` (`:57-59`).
- `taskManager` from container, best-effort (`:62-67`); `sessionAbortSignal` from `taskManager.getSessionAbortSignal?.()` (`:102`).
- `agentService` / `systemRunContextFactory` fetched **only if `getAiRuntimeStatus(container).ready`** (`:69-79`); `aiUnavailable = !aiStatus.ready` (`:110`).
- Several fields are hard-set `null` on this path: `depGraphData`, `guardAudit`, `astProjectSummary`, `panoramaResult`, `callGraphResult` (`:89-95`) — evidence starters and panorama context therefore degrade gracefully to empty/null here.
- `projectScopeSourceIdentities` = `resolveProjectScopeSourceIdentitiesFromCarrier(view)` (`:54`).
- `sessionId` = `view.bootstrapSession?.id ?? ''` (`:101`).

### 8.15 External interfaces

This subsystem has **no CLI commands, HTTP routes, or DB tables of its own** — it is an internal engine invoked by the cold-start / rescan workflows. Its observable outputs are **emitted events** (via `BootstrapEventEmitter`, `#service/bootstrap/BootstrapEventEmitter.js`) and **container singletons**:

| Interface kind | Name | Where |
|---|---|---|
| Emitted event | `emitProgress('bootstrap:ai-unavailable', ...)` | `AiDimensionPreparation.ts:117` |
| Emitted event | `emitDimensionComplete(dimId, {type:'skipped'\|'incremental-restored'\|'checkpoint-restored', ...})` | `AiDimensionPreparation.ts:122`, `DimensionRestoreState.ts:70,114` |
| Emitted event | `emitDimensionStart(dimId)` | `SessionExecutionBuilder.ts:578` (via `emitDimensionStart` callback) |
| Emitted event | `emitProcessEvents({source:'bootstrap-dimension-input'\|'bootstrap-dimension-result'\|'bootstrap-agent-progress'\|'bootstrap-tier-reflection', ...})` | `AiDimensionSessionRunner.ts:169,220`, `SessionExecutionBuilder.ts:340,395` |
| Container singleton (write) | `singletons._fileCache`, `_projectScopeSourceIdentities`, `_projectScopeSourceIdentityMap` | `RuntimeInitializer.ts:62,66-67` |
| Container service (read) | `agentService`, `systemRunContextFactory`, `bootstrapTaskManager`, `database` | `AiDimensionPreparation.ts:64,73-75`; `TaskManagerDispatch.ts:43` |
| Exported API | `runAiDimensionPipelineForResult`, `runAiDimensionPipeline`, `clearSnapshots`, `clearCheckpoints` | `AiDimensionPipeline.ts:26,62,69,88` |
| Exported API | `startAiDimensionSession`, `dispatchAiDimensionRuns`, `buildAiDimensionTaskDefs` | `AiDimensionDispatcher.ts:24,40,20` |

The agent-run profiles this engine emits (consumed by `@alembic/agent`): **`bootstrap-session`** (parent) and **`bootstrap-dimension`** (child).

### 8.16 Notable algorithms / gotchas / edge cases

- **Lazy child inputs.** The heavy per-dimension `AgentRunInput` is built by `lazyInputFactory` at scheduling time, not up front (`SessionExecutionBuilder.ts:299-355`). If you add per-dimension state, decide whether it belongs in the lightweight *planned* input (`buildBootstrapDimensionPlannedInput`) or the lazy one — only the lazy one records `childExecutionState`, so `onChildResult` won't find state for a dim whose lazy factory never ran.
- **Context split for tokens.** Do not add bulky facts to `systemRunContext` — `compactBootstrapSystemRunContext` will strip anything not in its allowlist (`DimensionRuntimeBuilder.ts:307-329`, duplicated in `AgentRunInputBuilders.ts:152-174`). Bulky evidence must go through `strategyContext`.
- **Recoverable producer timeout.** A dimension whose candidate submits succeeded but whose producer *summary* call timed out is **not** treated as a failure — candidates are still consumed (`SessionExecutionBuilder.ts:172-193`). Miss this and you'd drop real candidates on a benign timeout.
- **Checkpoint restore is off in rescan.** `checkpointRestoreDimIds` is emptied when `rescanContext` is present (`DimensionAdmission.ts:72`) — rescans intentionally re-mine rather than reuse stale checkpoints.
- **Restored dims keep Skill generation.** Checkpoint restore re-hydrates `analysisText` into `dimensionCandidates` + `SessionStore` specifically so skill generation isn't lost for skipped dims (`DimensionRestoreState.ts:214-234`).
- **AI-unavailable is a hard stop, not a mock.** Missing or `mock` provider → `ready:false` → the pipeline returns early and marks all dims skipped (`AiRuntimeStatus.ts`; `AiDimensionPipeline.ts:32-39`). There is deliberately no fake-output fallback.
- **Dedup seeding asymmetry.** Decaying recipes' titles are *not* seeded into `globalSubmittedTitles` (so they can be re-proposed) but their triggers *are* occupied (`RescanContext.ts:63-68`).
- **Fallback recipe target of 5.** Without an explicit rescan execution decision, per-dim gap/budget defaults to `max(0, 5 - existing)` (`RescanContext.ts:147-151`).
- **`projectGraph` and `panoramaResult` are null on the bootstrap path** (`RuntimeInitializer.ts:57`; `AiDimensionPreparation.ts:92`) — code that reads them must tolerate null; it does today (`buildPanoramaContext` returns null).
- **Session-cancel checks are re-derived every child.** `assertBootstrapSessionStillActive` and `shouldAbort` both consult the `taskManager` (`SessionExecutionBuilder.ts:228-231,408-427`) — a null `taskManager` disables cancellation, so a degraded task-manager session cannot be user-cancelled mid-run.

### 8.17 Boundary note — host-owned vs delegated

**Host-owned (implemented in `Alembic/lib/workflows/ai-execution/`):**

- The whole orchestration: pipeline sequencing, AI-availability gating, admission/restore decisioning, the parent bootstrap-session `AgentRunInput` and its coordination callbacks, lazy child-input assembly, tier assignment glue, process-event emission, dedup-set seeding, rescan-context projection, concurrency/grounding env resolution, and the fire-and-forget async-fill dispatch.
- `DimensionContext` (the internal-agent cross-dimension accumulator) and `parseDimensionDigest`.
- The static PCV stage-node map + evidence plumbing wiring (`PcvNodeEvidence.ts` constants and the builders' call sites) — the *contract identifiers* and *evidence envelope* are defined here.
- Container-singleton wiring (`_fileCache`, project-scope identity maps) and the `AiDimensionTypes` container/task-manager shapes this engine expects from the host DI container.

**Delegated to `@alembic/agent`:**

- The agent runtime and run loop — `AgentService.run(...)` executes the parent session and all child dimension runs; this engine never runs an LLM turn itself (`@alembic/agent/service`).
- Memory: `SessionStore`, `PersistentMemory`, `MemoryEmbeddingStore`, `MemoryCoordinator` (`@alembic/agent/memory`).
- Run-context construction: `createSystemRunContext`, `projectSystemRunContext`, `SystemRunContext` type, `SystemRunContextFactory`, `ExplorationTracker`, `computeAnalystBudget` (`@alembic/agent/runtime`, `/prompts`, `/context`, `/service`).
- The analyze-grounding guard itself (this engine only sets the `groundingEnforcement` opt-in flag).

**Delegated to `@alembic/core`:**

- The **dimension catalog and definitions** — `baseDimensions`, `DIMENSION_CONFIGS_V3`, `getFullDimensionConfig`, `getDimensionFocusKeywords`, `buildEvidenceStarters`, `DimensionDef`/`IncrementalPlan` types (`@alembic/core/host-agent-workflows`, `/dimensions`, `/types`).
- The **tier scheduler** — `TierScheduler` (`@alembic/core/host-agent-workflows`).
- **Checkpoint persistence** — `loadDimensionCheckpoints`, `clearDimensionCheckpoints`, `DimensionCheckpoint` type (`@alembic/core/host-agent-workflows`).
- **Dedup engine** — `BootstrapDedup` (`@alembic/core/service/bootstrap`); recipe-dimension resolution — `resolveRecipeDimensionId` (`@alembic/core/dimensions`).
- Workspace/data-root resolution — `resolveDataRoot` (`@alembic/core/workspace`); logging — `Logger` (`@alembic/core/logging`).

In short: **this repo decides *which* dimensions to run vs restore, wires up the memory/context/evidence for each, and drives the fan-out; `@alembic/agent` actually runs the agents and holds memory; `@alembic/core` owns the dimension catalog, tier policy, checkpoint store, and dedup engine.** The "organism" engine logic is not reimplemented here.


---


## 09. AI Execution Workflows II — Process Events, Projections, PCV Evidence & Finalization

### 09.0 Scope & role in the system

This section covers the "back half" of the in-process AI dimension pipeline (the host-owned bootstrap/rescan cold-start engine): how a raw `AgentRunResult` returned by the in-process Agent runtime is **projected** into domain structures, how those projections are turned into **developer-facing process events**, how **PCV (Provider-Choice / grounding) node evidence** is derived and rolled up as an anti-fabrication observability layer, how per-dimension results are **consumed** (candidate accounting, checkpoints, session-store writes, skill generation), and how the whole session is **finalized** (persistence, report augmentation, cache cleanup).

Five files implement this:

| File | Responsibility |
|------|----------------|
| `lib/workflows/ai-execution/AgentRunProjections.ts` | Pure projection layer: `AgentRunResult` → `AgentResultLike` → `BootstrapDimensionProjection` / `BootstrapSessionProjection`; run-issue classification. |
| `lib/workflows/ai-execution/AgentRunProcessEvents.ts` | Builds developer-safe `BootstrapProcessEventDraft[]` from projections and agent-progress events; redaction, truncation, correlation/trace metadata, findings digests. |
| `lib/workflows/ai-execution/PcvNodeEvidence.ts` | Builds per-node PCV cold-start evidence (N8 stage-factory policy, analyze grounding ledger, N9 stage projections, N12 consumer persistence) plus the evidence envelope contract. |
| `lib/workflows/ai-execution/BootstrapConsumers.ts` | Consumes dimension/session/tier/skill results: candidate accounting, session-store persistence, checkpoints, token usage, PCV evidence attachment, tier reflection, project-skill generation. |
| `lib/workflows/ai-execution/AiDimensionFinalizer.ts` | Session finalization: skill consumption step, completion finalizer, workflow-result persistence, report augmentation (efficiency + skill receipts + PCV scorecard), cache cleanup. |

The **caller** that stitches these together is `AiDimensionSessionRunner.ts` (per-dimension) and `AiDimensionPipeline.ts` / `AiDimensionFinalizer.ts` (session tail). See `lib/workflows/ai-execution/AiDimensionSessionRunner.ts:141-198` for the per-dimension `project → build process events → emit → consume` sequence.

---

### 09.1 Projections — `AgentRunProjections.ts`

The projection layer is **pure host-side transformation**: it never calls the model or performs I/O. It takes the runtime's `AgentRunResult` (imported from `@alembic/agent/service`, `AgentRunProjections.ts:9`) and reshapes it into Bootstrap domain structures that all downstream consumers read.

#### 09.1.1 Key types

| Type | File:line | Meaning |
|------|-----------|---------|
| `ToolCallRecord` | `AgentRunProjections.ts:19` | Loose tool-call shape (`tool`/`name`, `args`/`params`, `result`) tolerant of both runtime and stored representations. |
| `AgentResultLike` | `AgentRunProjections.ts:28` | Host-friendly flattening of `AgentRunResult` (`reply`, `status`, `toolCalls`, `tokenUsage`, `phases`, `diagnostics`, `efficiency`). `phases` is intentionally dynamic because strategies attach different artifacts (`:33-34`). |
| `DimensionFinding` | `AgentRunProjections.ts:41` | A single finding: `finding`, `evidence` (string or string[]), `importance`, `category`, `source`. |
| `BootstrapDimensionAnalysisReport` | `AgentRunProjections.ts:49` | The distilled analysis report for a dimension (analysisText, findings, referencedFiles, evidenceMap, negativeSignals, metadata). |
| `BootstrapDimensionProducerResult` | `AgentRunProjections.ts:59` | Producer-stage accounting: `candidateCount`, `rejectedCount`, `toolCalls`, `reply`, `tokenUsage`, `efficiency`. |
| `BootstrapDimensionProjection` | `AgentRunProjections.ts:68` | The full per-dimension projection consumed by both process-event builders and `BootstrapConsumers`. |
| `BootstrapDimensionRunIssue` / `...Status` | `AgentRunProjections.ts:84-99` | Discriminated failure classification (see 09.1.4). |
| `BootstrapSessionProjection` | `AgentRunProjections.ts:453` | Session-level rollup (completed / failed / aborted / missing dimension ids + parent status). |

#### 09.1.2 `projectAgentRunResult` — flatten the runtime result

`projectAgentRunResult(result)` (`AgentRunProjections.ts:123`) converts an `AgentRunResult` into `AgentResultLike`. It maps `usage.inputTokens/outputTokens` into a `tokenUsage` object, copies `phases`, derives `degraded` from `diagnostics?.degraded`, and — importantly — computes `efficiency` via **`extractEfficiencyFromDiagnostics`** which is imported from the host bootstrap efficiency helper `#service/bootstrap/BootstrapEfficiency.js` (`:11-13`). Token/iteration/duration defaults are supplied when `result.usage` is absent (`:124-129`).

#### 09.1.3 `projectBootstrapDimensionAgentOutput` — the central projection

`projectBootstrapDimensionAgentOutput({ dimId, needsCandidates, runResult, projectScopeSourceIdentities })` (`AgentRunProjections.ts:298`) is the most important function. Steps:

1. Reads canonical phases: `analyze`, `quality_gate`, `produce` from `runResult.phases` (`:309-311`).
2. `analysisText` = analyze reply → run reply, trimmed (`:312`). `artifact` = the quality-gate artifact, or a synthetic empty artifact (`:313-318`).
3. **Referenced-file derivation** (`:324-345`): prefers `artifact.referencedFiles`; otherwise scavenges `filePath` / `filePaths` args from every runtime tool call and de-dupes.
4. **ProjectScope normalization** (`:346-353`): calls host `normalizeProjectScopeSourceRefsForRuntime` (from `../../project-scope/ProjectScopeAnalysis.js`, `:16-17`) to keep only source refs that belong to active project-scope members; rejections are recorded into report metadata under `projectScopeSourceRefRejections` (`:367-377`). When no identities are supplied it passes raw refs through.
5. Builds `analysisReport` with metadata carrying `toolCallCount`, `tokenUsage`, `efficiency`, `artifactVersion` (`:355-379`).
6. **Submit-call accounting** (`:381-409`): filters producer tool calls to `knowledge` tool with `action: 'submit'`; `successCount` counts submits whose result is not `rejected`/`error`/`submitted:false`; `rejectedCount = submitCalls - successCount`.
7. Returns `producerResult.candidateCount = needsCandidates ? successCount : 0` (`:421-423`) — a dimension that does not need candidates never reports created candidates even if submits happened.

This is the **produce→consume contract root**: `successCount` / `submitCalls` computed here are re-used (re-derived) by both process-event builders and PCV evidence, keeping the "how many candidates were actually accepted" definition single-sourced by logic (though physically re-implemented in a few helpers — see 09.6 gotchas).

#### 09.1.4 Run-issue classification (`resolveBootstrapDimensionRunIssue`)

`resolveBootstrapDimensionRunIssue(result, { includeDegraded })` (`AgentRunProjections.ts:147`) classifies a run into a `BootstrapDimensionRunIssue | null`. Ordered precedence:

1. `timeout` — status `timeout`, efficiency `cancelReason === 'stage_timeout'`, or non-empty `diagnostics.timedOutStages` (`:160-170`).
2. `l4_compaction_failed_budget_exhausted` — cancelReason or reply substring (`:171-180`).
3. `blocked` / `aborted` / `error` — mirrored from status (`:181-187`).
4. `quality_gate_failed` — `resolveUnresolvedQualityGateIssue` (`:270-296`): quality-gate `pass === false` **and no `produce` phase** (gate failed before producer ran).
5. Degraded gate actions parsed from `diagnostics.gateFailures` (`:195-239`): `degraded_budget_exhausted`, `degraded_no_findings`, `record_repair_incomplete`.
6. Fallback: reply-substring sniffing when `diagnostics.degraded` is set (`:240-266`).

`includeDegraded === false` short-circuits before the degraded-gate checks (`:192-194`).

#### 09.1.5 Recoverable producer timeout

`isRecoverableProducerTimeoutIssue({ issue, needsCandidates, produceResult, successCount })` (`AgentRunProjections.ts:101`) returns true when: the issue is `timeout`, candidates were needed, `successCount > 0`, a `produceResult` exists, and the timed-out stage is (or plausibly is) `produce` (`:112-120`). This is a **grace path**: the producer's *summary* timed out **after** candidates were already submitted, so the candidates should be preserved rather than the whole dimension being marked failed. Consumers null out the run-issue when this is true (see 09.4.1).

#### 09.1.6 Session projection

`projectBootstrapSessionResult({ parentRunResult, activeDimIds, skippedDimIds })` (`AgentRunProjections.ts:462`):

- Pulls per-dimension results from `parentRunResult.phases?.dimensionResults` via `toBootstrapSessionDimensionResults` (`:516`).
- `failedDimensionIds`: a dimension is failed if it has a non-`aborted` run-issue — **except** a recoverable producer timeout is re-projected and excluded (`:474-501`). This means the session-level failure list applies the same producer-timeout grace as the per-dimension consumer.
- `abortedDimensionIds`: status `aborted` (`:502-504`).
- `missingDimensionIds`: runnable dims (active minus skipped) with no result (`:505`).

---

### 09.2 Process events — `AgentRunProcessEvents.ts`

This module turns projections and raw agent-progress events into **developer-facing `BootstrapProcessEventDraft[]`**. These drafts are the audit/observability surface: they are emitted through `BootstrapEventEmitter.emitProcessEvents` (`lib/service/bootstrap/BootstrapEventEmitter.ts:162`), forwarded to the task manager (or event bus fallback), and — per the emitter comment (`:156-161`) — bound to the current daemon job by `DaemonJobRunner`, then normalized by Core's `JobProcessEventRecorder`. `BootstrapProcessEventDraft` is `Omit<CreateJobProcessEventInput, 'createdAt'|'id'|'jobId'|'sequence'>` plus an optional `textArtifactCandidate` (`lib/service/bootstrap/bootstrap-event-types.ts:94-102`) — i.e. the host produces a partial Core job-process-event and Core assigns identity/sequence.

#### 09.2.1 Redaction & truncation constants (anti-leak)

All process-event text passes through redaction and truncation. Constants at `AgentRunProcessEvents.ts:17-25`:

| Guard | Value / pattern | Purpose |
|-------|-----------------|---------|
| `MAX_TEXT_CHARS` | 6000 | visible text projection cap |
| `MAX_JSON_TEXT_CHARS` | 12000 | JSON blob cap |
| `MAX_TOOL_CALLS` | 20 | tool calls shown per event |
| `MAX_ARRAY_ITEMS` / `MAX_OBJECT_KEYS` / `MAX_STRING_CHARS` | 20 / 32 / 1600 | `sanitizeValue` recursion caps |
| `SECRET_KEY_PATTERN` | `/(api[_-]?key|authorization|bearer|cookie|password|secret|token)/i` | redacts secret-looking object **keys** (`:1063`) |
| `SECRET_VALUE_PATTERN` | matches `sk-...`, `AIza...`, `Bearer ...` | redacts secret-looking **values** (`:1092-1094`) |

`sanitizeValue(value, depth)` (`:1035`) recursively truncates strings (`redactSecretText(truncateText(...))`), caps arrays (adds `{ omittedItems }`), caps object keys (adds `omittedKeys`), stops at depth 4, and redacts values under secret-looking keys. `projectText` / `projectRedactedText` (`:1096-1120`) produce a `TextProjection` with `originalChars`/`retainedChars`/`truncated`/`truncatedChars` metrics used to populate `llmMetrics`.

#### 09.2.2 The four public builders

| Function | File:line | Emits | Trigger |
|----------|-----------|-------|---------|
| `buildBootstrapDimensionInputProcessEvents` | `:41` | one `llm.input` event | before the dimension agent runs; captures a *projected* run input + PCV N8 evidence |
| `buildBootstrapDimensionResultProcessEvents` | `:95` | tool / output / reflection / findings events | after a dimension result is projected |
| `buildBootstrapAgentProgressProcessEvents` | `:140` | bridged `llm.*`/`tool` event | streamed mid-run from `ProgressEvent`s of type `agent_process_event` |
| `buildBootstrapTierReflectionProcessEvents` | `:226` | `llm.reflection` + optional findings digest | after a tier of dimensions completes |

**Input event** (`:41-93`): projects the `AgentRunInput` via `projectAgentRunInput` (`:583`) — deliberately dropping prompt expansion, file contents, provider payloads, and secrets (summary text at `:87-88`, `rawProviderPayload: false` at `:83`). It resolves and embeds the PCV stage-node maps (`pcvStageNodeMap`, `pcvChainNodes`) from many possible context locations via `resolvePcvInputContextMap` (`:613-654`), plus `pcvNodeEvidence.n8` from `buildPcvN8StageFactoryEvidence` (`:56`, `:69`).

**Result events** (`:95-138`) assemble up to four events:
- `buildToolEvent` (`:401`) — up to 20 projected tool calls (`projectToolCall` at `:656`, `summarizeToolResult` whitelists safe keys at `:667`).
- `buildVisibleOutputEvent` (`:446`) — deduped Analyze/Produce/Final sections; a **full redacted** copy is attached as `textArtifactCandidate` of kind `llm-output-full-redacted` (`:485-495`); metadata carries `llmMetrics` with char/token estimates (`:509-520`).
- `buildReflectionEvent` (`:536`) — quality gate + diagnostics + efficiency self-check (`projectQualityGate` at `:696`, `summarizeDiagnostics` at `:717`, `summarizeEfficiency` at `:730`).
- `buildFindingsDigestEvent` (`:314`) — merges findings from the parsed dimension digest (`parseDimensionDigest`, imported from `DimensionContext.js`) and the analysis report, de-dupes case-insensitively, caps at 10, renders a bilingual "关键发现 / Findings digest" markdown (`buildFindingsSummaryEvent` at `:357`).

**Agent-progress bridge** (`:140-224`): only forwards events that are `sourceClass === 'developer-facing'` and `displayPolicy !== 'hidden'` (`isDeveloperVisibleAgentProcessEvent` at `:755`), with an allowed `kind` in `['llm.input','llm.reflection','llm.output','tool']` (`:26-31`, gate at `:158`). It:
- Normalizes content (`normalizeProcessEventContent` at `:759`) — redact, project, attach full-redacted artifact for `llm.input`/`llm.output` only (`buildProcessTextArtifactCandidate` at `:796-818`).
- Computes a deterministic **correlationId** if the event lacks one (`buildProcessEventCorrelationId` at `:852`): `llm:{sessionId}:{dimId|global}:{phase}:{iteration}:{kind}`, each part sanitized to `[a-zA-Z0-9._-]`.
- Builds a **trace envelope** (`buildProcessTraceEnvelope` at `:820`) carrying `chainNodeId`, `stageId`, `iteration`, etc. — a stable spine for later trace reconstruction independent of raw events.
- Computes `llmMetrics` (`buildLlmEventMetrics` at `:881`) with char/token estimates, `finishReason`, `requestedToolChoice`/`effectiveToolChoice` (PCV-relevant), and normalized `tokenUsage` (`normalizeTokenUsage` at `:1128`, `estimateTokens = ceil(chars/4)` at `:1149`).

#### 09.2.3 Emitted event `kind`s

The `kind` field on drafts (Core job-process-event contract): `llm.input`, `llm.output`, `llm.reflection`, `tool`, `summary` (findings digests, `:387`), `artifact` (skill delivery receipt, produced in `BootstrapConsumers.ts:1261`). `displayPolicy` ∈ `full` / `summary-only` / `hidden` (`:32`); `retention` ∈ `transient` / `job-retained` / `artifact-retained` (`:33-37`, default `job-retained` at `:214-216`); `severity` ∈ `info`/`success`/`warning`/`error` (`:38`).

---

### 09.3 PCV node evidence — `PcvNodeEvidence.ts`

PCV = **Provider-Choice / grounding cold-start verification**. This module produces a structured, contract-versioned **evidence** trail proving that specific cold-start "nodes" (stages of the pipeline) actually linked up and produced grounded output — the primary **anti-fabrication / grounding** observability layer for the in-process bootstrap. It computes evidence deterministically from projections and run results; it does not itself gate execution (it is observe-first; grounding *enforcement* is upstream — see 09.3.3).

#### 09.3.1 Contracts & node ids

Exported string contracts and versions (`PcvNodeEvidence.ts:19-27`):

| Constant | Value |
|----------|-------|
| `PCV_COLD_START_NODE_LOCAL_CONTRACT` | `PCVColdStartNodeLocalBaseline` (v1) |
| `PCV_NODE_EVIDENCE_ENVELOPE_CONTRACT` | `PcvNodeEvidenceEnvelope` (v1) |
| `PCV_BOOTSTRAP_STAGE_NODE_MAP_CONTRACT` | `PCVBootstrapStageNodeMap` (v1) |
| `PCV_N8_NODE_ID` | `N8-stage-factory-tool-policy` |
| `PCV_ANALYZE_GROUNDING_NODE_ID` | `analyze-evidence-grounding-ledger` |
| `PCV_N12_NODE_ID` | `N12-consumers-persistence` |

The canonical stage→node map `BOOTSTRAP_STAGE_NODE_MAP` (`:161-174`) maps `analyze`/`quality_gate`/`record_repair` to `{chainNodeId, pcvNodeId}` (e.g. `analyze → pcvm:cold-start:n9 / pcvm:n9:analyze`). It is deep-cloned on every read (`cloneBootstrapStageNodeMap` at `:192`) so callers cannot mutate the module constant. `PcvNodeLocalStatus` ∈ `linked` / `partial-evidence` / `blocked-by-observability-gap` / `not-applicable` (`:45-49`).

#### 09.3.2 N8 — stage-factory tool policy (`buildPcvN8StageFactoryEvidence`)

`buildPcvN8StageFactoryEvidence({ dimId, label, plan, runInput })` (`:200`). This is the **anti-terminal-tool proof** for the producer: it verifies the producer stage may only submit via the `knowledge` tool and is *not* granted terminal (shell) tools.

- Resolves the terminal toolset and hints from Core (`resolveBootstrapTerminalToolset`, `buildBootstrapTerminalPolicyHints`, imported from `@alembic/core/host-agent-workflows`, `:7-11`).
- Compiles the actual stage policies by running Core's `AgentProfileCompiler` on `runInput.profile` (`compileBootstrapDimensionStagePolicies` at `:656`, using `AgentProfileCompiler`/`AgentProfileRegistry`/`AgentStageFactoryRegistry` from `@alembic/agent/service`, `:2-6`). Falls back to a hardcoded stage order if compilation yields nothing (`fallbackBootstrapDimensionStagePolicies` at `:689`, e.g. `['analyze','quality_gate','produce','rejection_gate']`).
- `terminalToolIds` = the producer stage's terminal tools (`:224-225`). `TERMINAL_TOOL_IDS = {'terminal'}` (`:176`).
- **missingLinkReasons** accumulate: `stage_order_missing`, `producer_stage_missing` (when candidates needed but no producer), and — critically — **`producer_terminal_tools_allowed`** if the producer was granted terminal tools (`:228-236`). Any reason ⇒ status `blocked-by-observability-gap`, else `linked` (`:238`).
- `producerToolRestriction.noTerminalProof` (`:249`) is the positive assertion "producer had no terminal tools". `gapLimit` derives from the rescan `createBudget` (`resolveProducerGapLimit` at `:716`).

#### 09.3.3 Analyze grounding ledger (`buildPcvAnalyzeGroundingLedgerSummary`)

`buildPcvAnalyzeGroundingLedgerSummary({ dimId, label, runResult })` (`:262`) is the **anti-fabrication core**. It collects grounding-ledger entries embedded in `pcvNodeEvidence.groundingLedger` across `runResult` and all `phases` (`collectPcvAnalyzeGroundingLedgerEntries` at `:559`, de-duped by `entry.ref`), then classifies each "burn" into one of `PcvAnalyzeGroundingClassification` (`:83-90`): `deterministic-evidence-consumed`, `evidence-produced`, `verification-only`, `record-only`, `planning-only`, `invalid-no-evidence`, `summary-only` (`groundingClassification` at `:638`, defaulting unknown to `summary-only`).

Grounding "through" count = produced + consumed + verification-only + record-only (`:302-306`). Missing-link reasons:
- `analyze_grounding_invalid_no_evidence` when any `invalid-no-evidence` **and not observe-only** (`:315-317`).
- `analyze_grounding_planning_only` when no evidence got through but planning-only entries exist (`:318-320`).

**Observe-only vs guard mode (AP-6, additive).** The critical grounding-enforcement semantics: `collectPcvAnalyzeGroundingEnforcement` (`:601`) reads an upstream additive marker `groundingEnforcement` (`'off'` = observe-only / `'guard'` = `AnalyzeGroundingGuard` active) from the same `pcvNodeEvidence` candidates. When `'off'`, `invalid-no-evidence` entries are recorded as **audit material only** and do **not** raise a missing-link/regression (`:309-317`, `:346-349`) — because pure PCV observation is expected to surface some no-evidence burns. When `'guard'` or the marker is absent (old/foreign data), the original quality judgment stands and `invalid-no-evidence` remains a real signal. Counts are always retained. Status derivation (`:339-344`): any missing-link ⇒ `partial-evidence`; else `evidenceThrough > 0` ⇒ `linked`; else `not-applicable`. This is a purely additive, backward-compatible interpretation that never drives control flow.

`deepseekV4NoForcedToolChoiceCount` (`:290-292`) tracks a provider-specific PCV signal ("tools visible but no forced tool choice") — a DeepSeek-V4 tool-choice observability metric.

#### 09.3.4 N9 stage projections (`buildPcvN9StageProjectionEvidence`)

`buildPcvN9StageProjectionEvidence({ dimId, label, runResult, stage })` (`:358`, stages `quality_gate` | `record_repair`). Rationale in code comment (`:356-357`): the persisted report cannot depend on raw process events, so executed N9 sub-stages are projected into stable `pcvScorecard` evidence. It reads the phase (`resolvePcvN9ProjectionPhase` at `:431` — `record_repair` also checks `quality_gate_record_repair`), extracts `pass`/`timedOut`/`action`, and marks `partial-evidence` if timed out else `linked`. When `record_repair` never ran (quality gate already passed), `buildPcvN9RecordRepairStageMapEvidence` (`:404`) emits a `not-applicable` stage-map-available evidence so canonical identity is still present in the report.

#### 09.3.5 N12 consumer persistence (`buildPcvN12ConsumerPersistenceEvidence`)

`buildPcvN12ConsumerPersistenceEvidence({ acceptedSubmitCalls, dimId, runIssueReason, sessionStore })` (`:442`) is the **produce→persist proof**: it verifies that candidates the producer *accepted* are actually **findable in the SessionStore**. It snapshots the session store via a defensive `toJSON` call (`safeSessionStoreSnapshot` at `:765`), extracts `submittedCandidates[dimId]` titles (`extractSubmittedCandidateTitles` at `:781`), and compares against accepted candidate titles. Missing-link reasons: `session_store_snapshot_missing`, `accepted_candidates_not_findable`, `failure_reason_empty` (`:463-473`). `buildPcvN12ErrorEvidence` (`:496`) is the failure-path variant with no accepted calls. `successfulProducerSubmitCalls(projection)` (`:551`) re-derives the accepted `knowledge:submit` calls used here.

#### 09.3.6 Envelope & merge

`BootstrapPcvNodeEvidenceSet` (`:135-141`) bundles `{ n8, groundingLedger, n9QualityGate, n9RecordRepair, n12 }`. `mergeBootstrapPcvNodeEvidence(existing, next)` (`:511`) shallow-merges so consumers can layer evidence across passes. `buildPcvNodeEvidenceEnvelope` (`:521`) wraps an evidence set with contract/version/dimensionId/`evidenceScope`/`source`; `evidenceScope` ∈ `fixture`/`unit`/`targeted-integration`/`live-ai-local`/`runtime-dashboard`/`delivery` and `source` ∈ `bootstrap-dimension-consumer`/`bootstrap-dimension-error`/`bootstrap-session-builder` (`:148-159`).

---

### 09.4 Consumers — `BootstrapConsumers.ts`

This is the "big consumer wiring" that takes projections + run results and produces all **side effects**: candidate accounting, session-store writes, project-context notifications, token usage, checkpoints, PCV evidence attachment, dimension events, tier reflection, and project-skill generation. Everything here is host-owned orchestration; the deep engine primitives (`buildTierReflection`, `saveDimensionCheckpoint`, `generateSkill`) are delegated.

#### 09.4.1 Dimension consumer — `consumeBootstrapDimensionResult`

`consumeBootstrapDimensionResult(options)` (`:522`) is the per-dimension entry point (called from `AiDimensionSessionRunner.ts:178`). Its flow (control + data):

1. **Run-issue state** — `resolveBootstrapDimensionConsumerRunIssue` (`:165`) computes `rawRunIssue`, then applies the producer-timeout grace (`isRecoverableProducerTimeoutIssue`): if recoverable, `runIssue` is nulled, `isNormalCompletion=true`, and `effectiveCandidateCount = producerResult.candidateCount` (`:181-189`). A recovered timeout logs a `[Producer]` warning (`:561-565`).
2. **Candidate accounting** — `applyBootstrapDimensionCandidateAccounting` (`:192`): increments `candidateResults.created` by effective count, stores `dimensionCandidates[dimId] = { analysisReport, producerResult }`, filters `acceptedSubmitCalls` (only on normal completion), collects `acceptedSourceRefs` (`collectAcceptedSubmitCallSourceRefs` at `:807` — pulls `sourceRefs`/`referencedFiles`/`reasoning.sources`), and builds candidate summaries (`:211-224`). On non-normal completion, `rejectedCount` = all submit calls (`:218-220`).
3. **ProjectContext hook** — `notifyProjectContextDimensionResult` (`:763`) fires the optional `onDimensionResult` hook (typed `ProjectContextDimensionResultHook` from `../project-context/ProjectContextWorkflowFacts.js`) with accepted refs/counts; failures are swallowed with a warning.
4. **Report write** — `writeBootstrapDimensionReport` (`:227`) distills the analyst scope via `memoryCoordinator.getActiveContext(analystScopeId).distill()` and calls `sessionStore.storeDimensionReport`. Findings default to the distilled key findings when the report has none (`:246-251`).
5. **analysisText 补强 (backfill)** — if candidates are needed but `analysisText < 100` chars and there are ≥3 findings, a synthetic markdown report is built from findings + tool-call summary (`:642-672`). This prevents empty reports from starving downstream skill generation.
6. **Digest + candidates** — `writeBootstrapDimensionDigestAndCandidates` (`:257`): parses the dimension digest (`parseDimensionDigest(producerResult.reply)`), pushes it into both the in-memory `dimContext` and `sessionStore`, and registers each submitted-candidate summary (`:279-297`).
7. **Emit dimension-complete** — `emitter.emitDimensionComplete(dimId, buildBootstrapDimensionCompleteEventPayload(...))` (`:683`). Payload (`:301-333`) carries `type` (`candidate`|`skill`), `extracted`/`created` = effective count, `status` (run-issue status or `v3-pipeline-complete`), `degraded`, `durationMs`, `toolCallCount`, `tokenUsage`, `efficiency`.
8. **PCV evidence** — `buildBootstrapDimensionPcvEvidenceEnvelope` (`:335`) assembles the grounding ledger, N9 quality-gate + record-repair, and N12 consumer-persistence evidence, merged with any existing evidence, wrapped with source `bootstrap-dimension-consumer` (`:371-391`). N12 uses `successfulProducerSubmitCalls(projection)` only on normal completion.
9. **Token usage** — `recordBootstrapDimensionTokenUsage` (`:408`) records into the `tokenUsageStore` singleton and broadcasts a realtime update; wrapped so token logging never breaks execution (`:473-475`).
10. **Assemble `DimensionStat`** (`:715-743`) — the durable per-dimension record: status, candidateCount, rejectedCount, chars/files/duration/toolCalls/tokenUsage/efficiency/diagnostics, `pcvNodeEvidence` + `pcvNodeEvidenceEnvelope`, `stages` (`summarizeDimensionStages` at `:864`), `analysisText`, `qualityGate`. Written to `dimensionStats[dimId]` (`:745`).
11. **Checkpoint** — `decideBootstrapDimensionCheckpoint` (`:394`) saves only when `analysisText.length >= 50`; otherwise skips with a logged reason (`:747-758`). Save delegates to Core `saveDimensionCheckpoint` (`:749`).

**Error path** — `consumeBootstrapDimensionError` (`:889`) normalizes the error into a `BootstrapDimensionRunIssue` (`:926`), pushes to `candidateResults.errors`, emits an error dimension-complete payload, attaches N12 error evidence, and writes a minimal `DimensionStat` with status/error/diagnostics/PCV evidence.

#### 09.4.2 Session consumer — `consumeBootstrapSessionResult`

`consumeBootstrapSessionResult(options)` (`:968`) projects the parent run (`projectBootstrapSessionResult`), fills in missing dimensions via `consumeMissingBootstrapDimensions` (`:1020`, which routes each missing dim through the error consumer so `dimensionStats` is never sparse), logs completion/warnings, and logs SessionStore + cache stats (`:1005-1016`). Returns the `BootstrapSessionProjection`.

#### 09.4.3 Skill consumer — `consumeBootstrapSkills`

`consumeBootstrapSkills(options)` (`:1071`) iterates dimensions marked `skillWorthy` with non-empty analysis text, guards with `shouldAbort`, and calls `consumeSingleBootstrapSkill` (`:1124`). That builds effective analysis text (backfilling from key findings when text < 100 chars, `buildEffectiveSkillAnalysisText` at `:1291`), calls the injected `generateSkill` fn (from `../skill-delivery/SkillCompletionCapability.js`), and on success records a **ProjectSkillDeliveryReceipt** (`recordSkillDeliveryReceipt` at `:1196`) — pushing the receipt into `skillResults`, emitting a `skill` dimension-complete event, and emitting a process event of `kind: 'artifact'` with the receipt JSON + artifact refs (`:1229-1280`). Result shape `SkillResults` (`:1041-1049`) carries `created`/`failed`/`skills`/`errors` plus `deliveryReceipts`/`deliveryReceiptSummaries`/`deliveryReceiptValidationIssues`.

#### 09.4.4 Tier reflection consumer — `consumeBootstrapTierReflection`

`consumeBootstrapTierReflection({ tierIndex, tierResults, sessionStore })` (`:1354`) delegates cross-dimension pattern extraction to Core `buildTierReflection` (from `@alembic/core/host-agent-workflows`), stores it via `sessionStore.addTierReflection`, and returns a `BootstrapTierReflection` (or `null` on failure — reflection failure is non-fatal). The session runner then turns it into process events (`AiDimensionSessionRunner.ts:214-229`).

---

### 09.5 Finalization — `AiDimensionFinalizer.ts`

`finalizeAiDimensionPipeline({ preparation, runtime, sessionResult, startedAtMs })` (`:114`) is the session tail. Ordered steps (each named in `AiDimensionFinalizerStepMap`, `:59-67`/`:102`):

1. **cacheWarmupCleanup** — `clearAiDimensionSessionDedupCache` (`:180`) clears the bootstrap dedup cache.
2. **skillConsumption** — `consumeAiDimensionSkillsStep` (`:198`) → `consumeBootstrapSkills` with an abort guard.
3. **completion** — `runAiDimensionCompletionStep` (`:220`). In **rescan** mode it *skips* delivery/wiki/semantic memory for pipeline isolation (`:232-234`); in **bootstrap** mode it runs Core's `runWorkflowCompletionFinalizer` (from `../completion/CompletionFinalizer.js`) with immediate semantic-memory consolidation and optional delivery skip. Produces a `WorkflowCompletionSummary` (`buildAiDimensionCompletionSummary` at `:728`).
4. **persistence** — `buildAiDimensionPersistenceInput` (`:261`) assembles the input for Core `persistWorkflowResult` (from `@alembic/core/host-agent-workflows`, `:3-9`) from runtime/session state; `persistWorkflowResult` returns `{ report, totalTimeMs, snapshotId, snapshot }`.
5. **reportAugmentation + historyRewrite** — `persistEfficiencyAugmentedWorkflowReport` (`:308`) mutates the persisted `WorkflowReport` and, if changed, rewrites `bootstrap-report.json` + history (via `writeZone` when available, else `dataRoot/.asd`). Augmentation is three-part (`augmentAiDimensionWorkflowReport` at `:363`):
   - `augmentWorkflowReportWithEfficiency` (`:438`) — merges per-dimension efficiency into `report.efficiency`/`session`/`totals`/`comparisonHints`.
   - `augmentWorkflowReportWithSkillDeliveryReceipts` (`:396`) — writes `report.projectSkillDelivery` + per-dimension receipts.
   - `augmentWorkflowReportWithPcvNodeLocalBaseline` (`:481`) — the **PCV scorecard rollup** (see 09.5.1).
6. **runtimeCacheCleanup** — `cleanupAiDimensionRuntimeCaches` (`:301`) nulls the file-cache singleton.

Returns `AiDimensionFinalizationResult` (`:90-100`) with skill results, consolidation, completion summary, augmentation flags, snapshot id/summary, total time.

#### 09.5.1 PCV scorecard rollup (`augmentWorkflowReportWithPcvNodeLocalBaseline`)

This is where per-dimension PCV evidence becomes a report-level artifact. It reads each `DimensionStat`, preferring the normalized envelope (`normalizePcvNodeEvidenceEnvelope` at `:557`, which validates contract/version) and falling back to a raw evidence set (`normalizePcvNodeEvidenceSet` at `:570`). It then:
- `summarizePcvNodeEvidence` (`:599`) rolls up `n8`/`n9QualityGate`/`n9RecordRepair`/`n12` per node: counts `linked` vs `blocked-by-observability-gap`, aggregates `missingLinkReasons`, `nodeIds`, `chainNodeIds`, and per-status counts.
- `summarizePcvAnalyzeGrounding` (`:654`) aggregates the grounding-ledger counters (burns, invalid-no-evidence, evidence-produced, tool-schemas-visible, deepseek-v4-no-forced-tool-choice, etc.) into `processMetrics.analyzeGrounding`.
- Writes `report.pcvScorecard` (contract `PCVColdStartNodeLocalBaseline`, `:504-517`), plus `report.totals`/`report.comparisonHints` PCV counters (`:518-545`), and attaches per-dimension `pcvNodeEvidence` to `report.dimensions[dimId]` (`:547-552`).

The result: a persisted, contract-versioned scorecard summarizing "did each cold-start node link up, and how much of the analyze output was actually grounded" — the durable anti-fabrication artifact consumed by dashboards/acceptance.

---

### 09.6 Notable algorithms, gotchas & edge cases

- **`needsCandidates` short-circuits candidate counting.** `producerResult.candidateCount` is 0 whenever `needsCandidates` is false, even if `knowledge:submit` calls succeeded (`AgentRunProjections.ts:421-423`). Analysis-only dimensions never inflate the candidate count.
- **Producer-timeout grace is applied in three places.** The per-dimension consumer (`BootstrapConsumers.ts:174-181`), the session projection failed-list (`AgentRunProjections.ts:474-501`), and it re-projects a throwaway projection to test recoverability. If you change `isRecoverableProducerTimeoutIssue`, all three shift together.
- **Submit-success predicate is re-implemented 3×.** `projectBootstrapDimensionAgentOutput` (`AgentRunProjections.ts:392-408`), `isSuccessfulToolCall` in PcvNodeEvidence (`:727-742`), and `isSuccessfulToolCall` in BootstrapConsumers (`:826-841`) each independently decide "was this submit accepted" (string `rejected`/`error`, object `error`/`submitted:false`/`status`). They agree today; a change to submit-result shape must update all three.
- **Grounding observe-only is additive and backward-compatible.** When the `groundingEnforcement` marker is missing (old/foreign data), behavior is unchanged and `invalid-no-evidence` stays a real signal (`PcvNodeEvidence.ts:601-624`, `:315-317`). This is deliberate so PCV never silently changes historical quality judgments.
- **Redaction happens at multiple layers.** Object keys (`SECRET_KEY_PATTERN`), string values (`SECRET_VALUE_PATTERN`), depth caps, array/object caps. There is no guarantee redaction catches every secret shape — it is heuristic; provider payloads are dropped entirely rather than redacted (`AgentRunProcessEvents.ts:83`, `:87-88`).
- **Full-redacted artifacts only for `llm.input`/`llm.output`.** `buildProcessTextArtifactCandidate` returns undefined for other kinds (`AgentRunProcessEvents.ts:805-807`), so tool/reflection events never carry a full-text artifact.
- **Checkpoint save threshold (50) vs analysisText backfill threshold (100).** A dimension can have its analysisText backfilled (needs ≥100 to skip backfill, `BootstrapConsumers.ts:642`) yet be checkpointed at ≥50 (`:399`). These are independent gates.
- **`emitProcessEvents` prefers the task manager, else the event bus.** If the task manager consumed the event it does *not* also emit on the bus (`BootstrapEventEmitter.ts:162-182`); both paths swallow errors (non-blocking observability).
- **Missing dimensions are never sparse.** `consumeMissingBootstrapDimensions` (`BootstrapConsumers.ts:1020`) routes each missing dim through the error consumer so `dimensionStats` always has an entry for every runnable dim — important because the finalizer iterates `dimensionStats` to build efficiency/PCV rollups.
- **PCV stage-node map is always deep-cloned.** Callers get fresh copies (`PcvNodeEvidence.ts:178-198`), preventing cross-dimension mutation of the module constant.
- **`safeSessionStoreSnapshot` is defensive.** It requires a callable `toJSON`, wraps it in try/catch, and treats any non-record result as null (`PcvNodeEvidence.ts:765-779`); a store without `toJSON` yields `session_store_snapshot_missing` rather than a crash.

---

### 09.7 External interfaces

These modules expose no CLI commands or HTTP routes directly; they are internal library functions on the AI-execution workflow path. Their externally observable surfaces are:

| Surface | Detail |
|---------|--------|
| Emitted events | `BootstrapEventEmitter.emitProcessEvents` (bus/task-manager topic `bootstrap:process-events`) and `emitDimensionComplete` / `emitDimensionStart` / `emitDimensionFailed`. Process-event drafts become Core job-process-events bound to the daemon job. |
| Persisted report keys | `report.pcvScorecard`, `report.projectSkillDelivery`, `report.efficiency`, `report.session`, `report.totals.*` (pcv/efficiency/skill counters), `report.comparisonHints.*`, and per-dimension `report.dimensions[dimId].{efficiency,pcvNodeEvidence,projectSkillDelivery}`. Written to `bootstrap-report.json` + history. |
| SessionStore writes | `storeDimensionReport`, `addDimensionDigest`, `addSubmittedCandidate`, `addTierReflection` (SessionStore is from `@alembic/agent/memory`). |
| Checkpoints | `saveDimensionCheckpoint(dataRoot, sessionId, dimId, dimResult, digest)` — Core-owned, writes under the data root. |
| Contracts (exported constants) | `PCV_COLD_START_NODE_LOCAL_CONTRACT`, `PCV_NODE_EVIDENCE_ENVELOPE_CONTRACT`, `PCV_BOOTSTRAP_STAGE_NODE_MAP_CONTRACT` and their versions/node-ids. |

---

### 09.8 Boundary note — host-owned here vs delegated

**Host-owned (implemented in this repo, `Alembic/lib`):**
- All projection logic (`AgentRunProjections.ts`) — the mapping from the Agent runtime's `AgentRunResult` into Bootstrap domain shapes, run-issue classification, and the recoverable-producer-timeout grace policy.
- All process-event construction, redaction, truncation, correlation-id/trace-envelope synthesis, and findings digests (`AgentRunProcessEvents.ts`). These are host observability drafts; Core only finalizes them into job-process-events.
- All PCV evidence *computation* (`PcvNodeEvidence.ts`) — N8/grounding/N9/N12 evidence, the stage-node map, the observe-only-vs-guard interpretation, and the envelope contract. This is a host cold-start verification/anti-fabrication layer.
- All consumer orchestration and side-effect sequencing (`BootstrapConsumers.ts`): candidate accounting, ProjectContext hook, analysisText backfill, dimension events, token usage recording, PCV attachment, checkpoint decision, missing-dimension backfill, skill-delivery-receipt wiring.
- Finalizer sequencing and report augmentation (`AiDimensionFinalizer.ts`): the step map, rescan-vs-bootstrap isolation policy, the three report-augmentation passes, and file/history rewrite.

**Delegated to `@alembic/core` (`@alembic/core/host-agent-workflows`, `@alembic/core/logging`, `@alembic/core/daemon`):**
- Deep engine primitives: `buildTierReflection` (cross-dimension pattern extraction), `saveDimensionCheckpoint`, `persistWorkflowResult` + `writeWorkflowReportHistory(WithWriteZone)`, `runWorkflowCompletionFinalizer` (delivery/wiki/semantic-memory consolidation), `WorkflowSnapshotSummary`/`WorkflowReport` types.
- Terminal-tool policy source of truth: `resolveBootstrapTerminalToolset`, `getBootstrapStageTerminalTools`, `buildBootstrapTerminalPolicyHints` (N8 evidence reads these; the *policy* is Core-owned, the *evidence* is host-computed).
- The job-process-event contract itself: `CreateJobProcessEventInput` (Core `@alembic/core/daemon`) — `BootstrapProcessEventDraft` is a partial of it.
- `ProjectSkillDeliveryReceipt` / `ProjectSkillDeliveryValidationResult` types.

**Delegated to `@alembic/agent`:**
- `AgentRunResult` / `AgentRunInput` shapes and `ProgressEvent` / `AgentProgressProcessEvent` types (`@alembic/agent/runtime`, `@alembic/agent/service`) — the runtime contract the projection layer consumes.
- Profile compilation used by N8 evidence: `AgentProfileCompiler`, `AgentProfileRegistry`, `AgentStageFactoryRegistry` (`@alembic/agent/service`) — the host runs the compiler purely to *observe* the resolved stage policies, not to define them.
- `MemoryCoordinator` / `SessionStore` (`@alembic/agent/memory`) — the memory/session persistence engine the consumers write into.

In short: **this subsystem does not implement the organism engine** (lifecycle state machine, memory store, tier reflection algorithm, terminal-tool policy, completion/semantic-memory consolidation). It implements the host-side *projection, observability, anti-fabrication evidence, consumer wiring, and finalization* around those engine primitives, and it owns the produce→consume contract that turns raw agent output into persisted candidates, skills, checkpoints, and a PCV scorecard.


---


## 10. Workflows — Knowledge Rescan, Cold Start, Completion & Skill Delivery

This section documents the top-level orchestration chains that live in `lib/workflows/`
(main-body host layer). These chains are the "conductors" that turn a bootstrap/rescan
request into: file collection → project analysis → dimension gap planning → asynchronous
AI dimension execution → completion (Wiki + semantic memory) → Project Skill delivery.
The deep "organism" engine logic they call into (impact planning, evolution audit,
coverage-ledger algebra, SourceRef reconciliation, plan projections, workflow-report
persistence, checkpoint algebra) is largely delegated to `@alembic/core` and the agent
runtime to `@alembic/agent`; this repo owns the wiring, DI-container access, session
lifecycle, Socket.io/event bridging, filesystem writes, and the CLI/HTTP/daemon/MCP
entrypoints. See the **Boundary note** at the end for the precise split.

### 10.1 Responsibilities & role in the system

The files in scope form three orchestration surfaces plus one shared dispatcher:

| Surface | File | Role |
|---|---|---|
| Cold start (full base build) | `lib/workflows/cold-start/ColdStartWorkflow.ts` | One-time full-reset knowledge-base build over the plan-selected dimension set. |
| Knowledge rescan (incremental) | `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` | Incremental re-mining: preserve recipes, reconcile SourceRefs, run impact/evolution, compute gap dimensions, per-dimension coverage-ledger write-back. |
| Controller produce-session route | `lib/workflows/knowledge-rescan/ProduceSessionRoute.ts` | Pure projection helpers that turn controller-authorized "produce gaps" into a session-backed produce plan for the rescan response. |
| Completion finalization | `lib/workflows/completion/CompletionFinalizer.ts` + `CompletionSteps.ts` + `CompletionTypes.ts` | "What completion means": schedule/execute Wiki generation + semantic-memory consolidation after a bootstrap dimension pipeline finishes. |
| Skill delivery (channel C/D) | `lib/workflows/skill-delivery/SkillCompletionCapability.ts` | Generate a Project Skill (`SKILL.md`) for `skillWorthy` dimensions and produce a `ProjectSkillDeliveryReceipt` for the host to export. |

The shared dispatcher `lib/workflows/project-index/ProjectIndexWorkflow.ts` is the single
funnel: both cold start and rescan are registered as "project-index" modes (`full` /
`incremental`) and are entered via `runProjectIndexWorkflow(ctx, args, { mode })`.

Neither cold start nor rescan performs the AI dimension work inline by default. They
build a fast "skeleton" response (audit summary, gap plan, session id, task list) and
return it synchronously, while an async fill (`dispatchAiDimensionRuns`) mines gap
dimensions in the background and pushes progress via the bootstrap event emitter /
Socket.io. Completion and skill delivery run at the *tail of the AI dimension pipeline*
(`AiDimensionFinalizer.ts`), not in the workflow functions themselves.

### 10.2 The shared entry dispatcher — ProjectIndexWorkflow

`ProjectIndexWorkflow.ts` is a tiny registry + double-dispatch layer:

- Two runner slots exist: `implementations.full` and `implementations.incremental`
  (`lib/workflows/project-index/ProjectIndexWorkflow.ts:28-31`).
- `registerProjectIndexWorkflowImplementation('full'|'incremental', runner)` fills a slot
  (`ProjectIndexWorkflow.ts:41-50`). Cold start registers `full`
  (`ColdStartWorkflow.ts:321`); rescan registers `incremental`
  (`KnowledgeRescanWorkflow.ts:868`).
- `runProjectIndexWorkflow(ctx, args, { mode })` logs the dispatch, then lazily imports
  the matching module if the slot is empty and calls the registered runner
  (`ProjectIndexWorkflow.ts:62-103`). Lazy import: `full` → `../cold-start/ColdStartWorkflow.js`;
  `incremental` → `../knowledge-rescan/KnowledgeRescanWorkflow.js`
  (`ProjectIndexWorkflow.ts:92-96`). If the slot is still empty after import it throws
  `ProjectIndexWorkflow implementation not registered for mode=<mode>`
  (`ProjectIndexWorkflow.ts:99-102`).

Gotcha: registration is a **module side effect** (`registerProjectIndexWorkflowImplementation(...)`
executes at import time). The public entry functions `runColdStartWorkflow` /
`runKnowledgeRescanWorkflow` are thin trampolines that call `runProjectIndexWorkflow`
with the mode (`ColdStartWorkflow.ts:99-104`, `KnowledgeRescanWorkflow.ts:191-193`), so
the actual implementation body (`runColdStartProjectIndexWorkflow` /
`runKnowledgeRescanProjectIndexWorkflow`) is only reachable through the dispatcher.

The context type `ProjectIndexMcpContext = WorkflowMcpContext & McpContext`
(`ProjectIndexWorkflow.ts:11`) carries `{ container, logger }`. `container.get(name)` is
the DI service locator used throughout (e.g. `'database'`, `'agentService'`,
`'evolutionGateway'`, `'coverageLedgerRepository'`, `'signalBus'`, `'skillHooks'`).

### 10.3 ColdStartWorkflow — 6-phase full base build

`runColdStartProjectIndexWorkflow(ctx, args)` (`ColdStartWorkflow.ts:106-319`). Called via
`runColdStartWorkflow` → `runProjectIndexWorkflow(..., { mode: 'full' })`. Documented
entrypoints (`ColdStartWorkflow.ts:6-10`): CLI `alembic bootstrap --knowledge`, MCP
`alembic_bootstrap`, HTTP `POST /api/bootstrap/knowledge`. In practice the daemon path
enters it through `executeApiAiWorkflow` for `kind === 'bootstrap'`
(`lib/daemon/DaemonJobRunner.ts:871-892`), which first runs a plan gate
(`runBootstrapPlanGate`) and passes `planSelectionProjection` + pre-built
`projectContextFacts` into the workflow.

**Phase map** (matches the header comment `ColdStartWorkflow.ts:13-36`):

| Phase | What happens | Anchor |
|---|---|---|
| Step 0 | Full reset: wipe DB tables + filesystem cache via `runFullResetPolicy` (Core) with a main-repo `CleanupService` factory | `ColdStartWorkflow.ts:129-148` |
| Phase 1-4 | Build `ProjectContextWorkflowFacts` (file collection → AST → dependency edges → Guard audit → dimension parse). Reused from `args.projectContextFacts` if the daemon already built it | `ColdStartWorkflow.ts:153-162` |
| — | Empty-project short-circuit: returns `presentProjectContextColdStartEmptyProject` if `facts.isEmpty` | `ColdStartWorkflow.ts:165-170` |
| Dimension selection | Resolve execution dimensions from explicit ids / plan projection / base; record `selectionSummary` | `ColdStartWorkflow.ts:174-204` |
| Phase 4.6 | Open a `ProjectContextWorkflowSession` (caches phase results for reuse), build mission artifacts / briefing | `ColdStartWorkflow.ts:210-233` |
| Phase 5 | Build task defs + start the AI dimension (bootstrap) session; register session-release-on-completion | `ColdStartWorkflow.ts:245-260` |
| Async fill | Fire-and-forget `dispatchAiDimensionRuns` for background dimension mining (unless `skipAsyncFill`) | `ColdStartWorkflow.ts:264-285` |
| SkillHooks | Fire-and-forget `onBootstrapComplete` hook (candidatesCreated=0 because fill is async) | `ColdStartWorkflow.ts:287-307` |
| Return | `presentProjectContextColdStartResponse` skeleton (cleanup result, dimensions, facts, session id, task count) | `ColdStartWorkflow.ts:309-318` |

Notable cold-start details / gotchas:

- **`incremental` is ignored on purpose.** Cold start is a full-reset workflow; if the
  intent carries `ignoredFileDiffIncremental` it logs a warning and always runs full
  analysis (`ColdStartWorkflow.ts:119-123`). Incremental reuse must go through rescan.
- **Dimension selection has three sources** — `explicit`, `plan`, `base` — resolved by
  `resolveColdStartWorkflowDimensionSelection` (`ColdStartWorkflow.ts:342-384`). Explicit
  `intent.dimensionIds` win; otherwise a `planSelectionProjection` (from the plan gate)
  is used; otherwise `base` (full ProjectContext dimension set). Hard-fail invariants:
  if `source === 'plan'` but the plan selected **no** executable dimensions it throws
  `Plan gate selected no executable dimensions for coldStart.`
  (`ColdStartWorkflow.ts:359-361`), and if the plan ids match **no known** ProjectContext
  dimensions it throws `Plan gate selected no known ProjectContext dimensions for coldStart.`
  (`ColdStartWorkflow.ts:371-373`). This is an intentional guard so a failed plan does
  *not* silently fall back to the full dimension set (`ColdStartWorkflow.ts:172-173` comment).
- **Test-dimension filtering** is applied via `applyTestDimensionFilter(..., 'bootstrap')`
  (Core) after selection (`ColdStartWorkflow.ts:363-369`).
- **Session is opened with `replaceExisting: true`** right after full reset — cold start
  always owns a fresh session (`ColdStartWorkflow.ts:210-216`).
- **`skipAsyncFill`** (from `intent.internalExecution`) is the CLI-non-`--wait` path: it
  skips both the session-release registration and the background fill to avoid a DB
  disconnect after process exit (`ColdStartWorkflow.ts:251-285`, comment at :262-263).
- The Phase 5/5.5 "10-dimension"/"7-dimension" and "auto Project Skill aggregation"
  narrative in the header comment (`ColdStartWorkflow.ts:22-28, 84-90`) describes the
  *conceptual* pipeline. In the current code the actual dimension count is data-driven
  (selection above), and Skill aggregation happens inside the AI dimension pipeline
  finalizer (`consumeBootstrapSkills`, see 10.7), not inline in this file. Treat the
  numeric "7"/"10" in comments as historical/illustrative, not a hard constant.

### 10.4 KnowledgeRescanWorkflow — incremental re-mining + coverage write-back

`runKnowledgeRescanProjectIndexWorkflow(ctx, args)` (`KnowledgeRescanWorkflow.ts:195-866`).
Entered via `runKnowledgeRescanWorkflow` → `runProjectIndexWorkflow(..., { mode: 'incremental' })`.
Daemon path: `executeApiAiWorkflow` non-bootstrap branch calls it with
`buildDaemonRescanWorkflowArgs` (`lib/daemon/DaemonJobRunner.ts:894-911`); the
`deepMining` / `moduleMining` generation stages branch off before this into
`runDeepMiningRounds` / `runModuleMiningWorkflow`.

**Step map** (matches the header `KnowledgeRescanWorkflow.ts:6-16`):

| Step | What happens | Anchor |
|---|---|---|
| Step 0 | Cleanup policy chosen by `intent.cleanupPolicy`: `force-rescan` → `runForceRescanCleanPolicy`, `rescan-clean` → `runRescanCleanPolicy`, else snapshot-only (preserve all recipes, no deletes) | `KnowledgeRescanWorkflow.ts:220-259` |
| Step 0.5 | Recipe file ↔ DB consistency recovery: `syncKnowledgeStoreForRescan` (Core) | `KnowledgeRescanWorkflow.ts:265-270` |
| Step 1 | Phase 1-4 analysis via `buildProjectContextWorkflowFacts` (includes incremental diff plan). Empty-project short-circuit returns `presentKnowledgeRescanEmptyProject` | `KnowledgeRescanWorkflow.ts:276-294` |
| Step 1.5 | SourceRef validation + reverse cleanup: `SourceRefReconciler.reconcile({force:true})` → `repairRenames()` → `applyRepairs()` (best-effort; failures warn and continue) | `KnowledgeRescanWorkflow.ts:300-338` |
| Step 2 | Build evolution candidates from incremental diff via `RecipeImpactPlanner.plan(diff)` (Core) | `KnowledgeRescanWorkflow.ts:344-361` |
| Step 3 | Evolution validation: `submitRescanImpactDecisions` (Core gateway) then `runEvolutionAudit` (agent) on candidates not already processed | `KnowledgeRescanWorkflow.ts:367-432` |
| Step 4 | Recipe evidence audit + quick decay: `auditRecipesForRescan` (Core); merge proposal/deprecation counts from impact + evolution audit; build `buildKnowledgeRescanPlan` | `KnowledgeRescanWorkflow.ts:438-493` |
| Step 4.5 | Evolution prescreen (`buildRescanPrescreen`): healthy→auto-skip, dead→auto-deprecated, keep only `decay`/`severe` needing verification | `KnowledgeRescanWorkflow.ts:500-524` |
| Step 5 | Gap analysis: `projectKnowledgeRescanGapPlan` yields requested/execution/produce/gap/skipped dimensions + `targetPerDimension`; resolve controller produce-session route | `KnowledgeRescanWorkflow.ts:534-574` |
| Step 5.5 | Open/create the `ProjectContextWorkflowSession` (cache phase results); build produce-session projection | `KnowledgeRescanWorkflow.ts:581-634` |
| Step 6 | Start AI dimension (bootstrap) session unless controller-produce or per-module mining; register session-release-on-completion | `KnowledgeRescanWorkflow.ts:640-667` |
| Step 7 | Async background fill of gap dimensions (three branches: module-mining / dimension-fill inline-or-dispatch / no-fill) | `KnowledgeRescanWorkflow.ts:673-822` |
| — | Fire-and-forget `onRescanComplete` SkillHook; return `presentProjectContextRescanResponse` | `KnowledgeRescanWorkflow.ts:824-865` |

Step-7 branch logic (the important control flow):

1. **Per-module mining** (`miningMode === 'moduleMining' | 'per-module'`, not
   controller-produce, not `skipAsyncFill`): select ProjectMap modules
   (`selectProjectIndexModuleMiningModules`), slice by `scaleCap`, run
   `runModuleMining` (agent), compute a SourceRef delta, and write a coverage ledger via
   `writeModuleMiningCoverageLedger` (`KnowledgeRescanWorkflow.ts:673-727`). Throws
   `KnowledgeRescanWorkflow moduleMining requires ProjectMap modules.` if module set is
   empty (`:684-686`). Releases the workflow session on completion (`:719-727`).
2. **Dimension fill** (not controller-produce, `executionDimensions.length > 0`, not
   `skipAsyncFill`): build a `ProjectContextFillView` with an `onDimensionResult` hook
   that calls `writeKnowledgeRescanCoverageLedgerForDimension` per completed dimension
   (`KnowledgeRescanWorkflow.ts:728-777`). Then either run inline
   (`runAiDimensionPipelineForResult`, when `runInternalFillInline`) or dispatch
   fire-and-forget (`dispatchAiDimensionRuns`) (`:778-791`).
3. **No fill** (`executionDimensions.length === 0`): everything is covered/healthy —
   save a ProjectContext file snapshot and release the session
   (`KnowledgeRescanWorkflow.ts:792-822`).

#### 10.4.1 Per-dimension coverage write-back mirror

The rescan's "coverage write-back mirror" is `writeKnowledgeRescanCoverageLedgerForDimension`
(`KnowledgeRescanWorkflow.ts:909-968`). It is invoked from the `onDimensionResult` hook
during dimension fill (`:754-773`) and mirrors the Plugin-side per-dimension coverage
write so that in-process AI rescan advances the coverage ledger the same way. Algorithm:

1. Skip if `candidateCount <= 0` (`reason: 'no-accepted-candidates'`) — `:912-914`.
2. Resolve the coverage-ledger repository from the container; skip if missing
   (`:916-922`). The repository is validated structurally (must expose `getCell`,
   `listByProjectRoot`, `listRoundsByProjectRoot`, `upsertCell`) by
   `getCoverageLedgerRepository` (`:1100-1119`).
3. Build the module axis from `projectMapModules` (only modules with a real module
   identity + owned files/path) via `buildKnowledgeRescanCoverageLedgerModules` +
   `buildCoverageLedgerModuleAxisFromSummaries` (Core) — skip if no modules
   (`:924-933`, `:970-991`).
4. Compute covered paths from `acceptedSourceRefs ?? referencedFiles`, stripping the
   `:line` / `:line-line` anchor via `stripSourceRefLineAnchor` (`:935-944`, `:1029-1031`);
   skip if none (`reason: 'no-source-refs'`).
5. Build candidates (per-path importance 60, per-module importance 50) via
   `buildKnowledgeRescanCoverageLedgerCandidates` (`:946-950`, `:993-1014`).
6. Resolve module tier + per-cell target defaults (`resolveModuleTier`,
   `resolvePerCellTargetDefault`, Core) and the latest round index (from
   `args.roundIndex` or `listRoundsByProjectRoot`) — `:951-954`, `:1016-1027`.
7. Delegate the actual cell upsert to `writeCoverageLedgerForCompletion` (Core)
   (`:956-967`). The write result is folded back into the inline fill summary
   (`writtenCells`, `newRecipesThisRound`) at `:765-772`.

The return type is a discriminated union: `CoverageLedgerWriteResult & { skipped?: false }`
or `{ skipped: true; reason }` (`KnowledgeRescanWorkflow.ts:889-907`). Callers must
branch on `'writtenCells' in coverageResult` (`:765`).

#### 10.4.2 Rescan mining-mode plan options

`buildKnowledgeRescanMiningPlanOptions` (`KnowledgeRescanWorkflow.ts:1037-1087`) reads
`args.moduleScope`, `args.moduleDimensionTargets`, `args.perDimensionTargets` and, when a
coverage-ledger repository exists, seeds `ledgerCoverageByDimension` and per-cell
`perCellCoverage` so the plan can dedupe already-covered cells. `miningMode` is one of
`deepMining | moduleMining | per-module` (`:870`, `:1121-1125`); anything else is
`undefined` and the fill runs the standard dimension path.

### 10.5 ProduceSessionRoute — controller-authorized gap fill projection

`ProduceSessionRoute.ts` is pure projection logic (no I/O, no DI). It lets a controller
("ASQ controller") explicitly authorize which dimensions may create knowledge in a rescan,
instead of letting rescan auto-decide from gap analysis. Three exported functions:

| Function | Purpose | Anchor |
|---|---|---|
| `readControllerProduceSessionRequest(args)` | Parse `args.produceSession` / `controllerProduceSession` / `produceSessionDimensions` / `controllerAuthorizedGaps` into a normalized `ControllerProduceSessionRequest` | `ProduceSessionRoute.ts:78-105` |
| `buildProduceSessionRoutePlan(input)` | Turn the request (or, if disabled, the rescan gap plan) into a `ProduceSessionRoutePlan` (valid dimensions + gaps + invalid gaps) | `ProduceSessionRoute.ts:107-142` |
| `buildProduceSessionProjection(input)` | Combine plan + actual session into the response `ProduceSessionProjection`, or a blocker if unusable | `ProduceSessionRoute.ts:144-239` |

Key mechanics:

- **Enable detection** (`ProduceSessionRoute.ts:92-96`): enabled if `route.enabled`,
  `route.controllerAuthorized`, top-level `args.controllerAuthorized`, or any gaps parsed.
- **Create budget clamp** (`readCreateBudget`, `:355-366`): non-finite/≤0 → default 1
  (`DEFAULT_CREATE_BUDGET`); otherwise `min(floor(n), 20)` (`MAX_CREATE_BUDGET`).
- **Controller route validation** (`buildControllerProduceSessionRoutePlan`, `:241-278`):
  drops gaps missing a `dimensionId` (`missing-dimension-id`), unknown dimensions
  (`unknown-dimension:<id>`), and dedups repeated dimensions. Rejected ones land in
  `invalidGaps`.
- **Projection blocker reason codes** (`buildNoProduceProjection`, `:280-310`):
  `no-produce-session` (no dimensions/gaps), `session-unavailable` (no session),
  `session-does-not-cover-produce-gaps` (session missing requested dims — computed by
  comparing requested dims against `remainingDimIds` read from the session's
  `getProgress()`/`toJSON()`, `:376-387`). A usable projection sets
  `status: 'active'`, `usable: true`, and a `bootstrapSessionRef: bootstrap-session:<id>`.
- **Constraints block** always advertises `requireProductionSession: true` and the
  session-ref field names (`sessionId`, `bootstrapSessionRef`) so the consumer knows a
  real production session is mandatory (`:161-172`).

In the rescan workflow this feeds Step 5/5.5: `readControllerProduceSessionRequest(args)`
→ `buildProduceSessionRoutePlan(...)` → `buildProduceSessionProjection(...)`; when the
controller route is enabled, session dimensions come from the plan and the workflow
opens/returns a session via `openOrReturnProjectContextWorkflowSession`
(`KnowledgeRescanWorkflow.ts:543-634`).

### 10.6 Completion — what "completion" means

Completion is the *post-dimension-pipeline* finalization. It is invoked from
`AiDimensionFinalizer.runAiDimensionCompletionStep` (`lib/workflows/ai-execution/AiDimensionFinalizer.ts:220-259`),
**only for `bootstrap` mode** — rescan mode short-circuits with
`{ deliveryVerification: null, semanticMemoryResult: null }` and logs
"rescan mode — skipping delivery/wiki/memory (pipeline isolation)"
(`AiDimensionFinalizer.ts:232-234`). This isolation is deliberate: rescan should not
rebuild downstream artifacts (Wiki/semantic memory) — see the reason string at
`AiDimensionFinalizer.ts:735-744`.

`runWorkflowCompletionFinalizer(...)` (`lib/workflows/completion/CompletionFinalizer.ts:26-94`)
does exactly two things after abort checks:

1. **Wiki** (`CompletionFinalizer.ts:73-79`): `wikiMode` defaults to `'schedule'`
   (`steps.wiki`). If scheduled, `scheduleTask(() => generateWiki(...))` and set
   `wikiStatus = 'scheduled'`; if `'skip'`, log and leave `'skipped'`.
2. **Semantic memory** (`CompletionFinalizer.ts:80-91`): `semanticMemoryMode` defaults to
   `'scheduled'` but the AI-dimension finalizer passes `{ mode: 'immediate' }`
   (`AiDimensionFinalizer.ts:244`), so consolidation runs inline and awaited. `'scheduled'`
   would defer it via `scheduleTask`; `'skip'` does nothing.

`shouldAbort` is checked at three points (before delivery, before wiki/memory, and before
scheduling memory) so a user-cancelled session returns early with `'skipped'` statuses
(`CompletionFinalizer.ts:52-72, 82-88`).

Note: `deliveryVerification` / `deliveryStatus` are **always** `null` / `'skipped'` in the
finalizer body (`CompletionFinalizer.ts:61-62`). The `WorkflowCompletionFinalizerResult`
type still carries `deliveryVerification: null` and optional `deliveryStatus`/`wikiStatus`
(`CompletionTypes.ts:91-96`). The "delivery" concept here is a reserved slot — actual
Project Skill *delivery* happens in the skill consumer (10.7), not in this finalizer.
The `WorkflowCompletionStepOptions.delivery: 'run' | 'skip'` field
(`CompletionTypes.ts:80-83`) is threaded through but the finalizer does not act on it
(it only reads `steps.wiki`); treat `delivery` in this finalizer as currently inert.

`scheduleTask` default (`CompletionFinalizer.ts:101-109`) uses `setImmediate` and swallows
errors as non-blocking warnings tagged `[DimensionComplete]`. The default service-container
loader dynamically imports `#inject/ServiceContainer.js` (`:96-99`), but callers override
it — the AI-dimension finalizer injects `getServiceContainer: () => preparation.ctx.container`
(`AiDimensionFinalizer.ts:242`) so no re-resolution happens.

#### 10.6.1 Completion steps

`CompletionSteps.ts` implements the two steps:

- `generateWiki(...)` (`CompletionSteps.ts:21-60`): resolves the container, dynamically
  imports the host-owned `WikiGenerator` (`../../service/wiki/WikiGenerator.js`), pulls
  `moduleService` + `knowledgeService` from the container (returns silently if either is
  missing), runs `WikiGenerator.generate()` with `options: { mode: 'bootstrap' }`, and
  logs `Auto Wiki generation: N pages`. All failures are non-blocking warnings.
- `consolidateSemanticMemory(...)` (`CompletionSteps.ts:83-126`): resolves `db`
  (`'database'` or `'db'`), duck-types it as a `PersistentMemoryDb` and the session's
  `sessionStore` as a `CompletionSessionStoreLike` (`isPersistentMemoryDb` `:153-169`,
  `isCompletionSessionStore` `:171-185`); returns `null` if either check fails. Then it
  creates a `PersistentMemory` (`@alembic/agent/memory`, with a `MemoryEmbeddingStore`
  rooted at `dataRoot`) and an `EpisodicConsolidator` (`@alembic/agent/domain`) — both are
  overridable via `dependencies.createPersistentMemory` / `createConsolidator`
  (`:71-81, 102-107`). It calls `consolidator.consolidate(session.sessionStore,
  { bootstrapSession: session.id, clearPrevious: true })` (`:108-111`) and logs
  `+N ADD, ~M UPDATE`. Return is validated by `isWorkflowSemanticMemoryConsolidationResult`
  (`:187-205`) which requires `total.{added,updated,merged,skipped}` numbers +
  `durationMs`.

Gotcha: the requirement for a functioning **embedding provider** is implicit — if the
provider (e.g. Ollama) is unavailable, consolidation degrades/returns `null` rather than
throwing (all wrapped in `try/catch`). This matches the operator note that semantic
memory needs Ollama in real cold-start runs.

#### 10.6.2 Completion result shapes

`CompletionTypes.ts` holds the contracts. Important ones:

| Type | Meaning | Anchor |
|---|---|---|
| `WorkflowSemanticMemoryMode` = `'scheduled' \| 'immediate' \| 'skip'` | How semantic memory runs | `CompletionTypes.ts:78` |
| `WorkflowCompletionStepOptions` `{ delivery?: 'run'\|'skip'; wiki?: 'schedule'\|'skip' }` | Step toggles | `CompletionTypes.ts:80-83` |
| `WorkflowCompletionFinalizerResult` | `{ deliveryVerification: null; semanticMemoryResult; deliveryStatus?; wikiStatus? }` | `CompletionTypes.ts:91-96` |
| `WorkflowCompletionStepStatus` = `'completed'\|'scheduled'\|'skipped'` | Per-step status | `CompletionTypes.ts:98` |
| `WorkflowCompletionSummary` | Report-facing rollup (mode/isolation/delivery/wiki/semanticMemory) | `CompletionTypes.ts:100-115` |

The summary is built by `buildAiDimensionCompletionSummary`
(`AiDimensionFinalizer.ts:728-761`): rescan → all-skipped + `isolation: 'pipeline-isolation'`;
bootstrap → `isolation: 'full-completion'` with wiki status defaulting to `'scheduled'`
and semantic-memory status derived from whether a result came back.

### 10.7 SkillCompletionCapability — channel C/D Project Skill delivery

`SkillCompletionCapability.ts` is the host-owned Project Skill writer. Its single public
entry is `generateSkill(ctx, dim, analysisText, referencedFiles, keyFindings, source)`
(`SkillCompletionCapability.ts:80-142`). It is called from the bootstrap skill consumer
`consumeSingleBootstrapSkill` (`lib/workflows/ai-execution/BootstrapConsumers.ts:1155-1161`),
which itself runs during the AI dimension finalizer's skill-consumption step
(`consumeAiDimensionSkillsStep` → `consumeBootstrapSkills`, `AiDimensionFinalizer.ts:198-218`).
Only `skillWorthy` dimensions with non-empty `analysisReport.analysisText` produce a skill
(`BootstrapConsumers.ts:1092-1099`).

`generateSkill` flow:

1. **Quality gate** `validateSkillQuality(analysisText)` (`SkillCompletionCapability.ts:378-426`):
   - Reject if under `MIN_ANALYSIS_LENGTH = 100` chars (`:75, :379-384`).
   - Repetition detection: normalize lines (`normalizeLine`, strips bullets/numbering/
     headings/`(来源:...)`, `:491-501`), compute unique-ratio and max consecutive
     duplicates. Repetitive if (`>30 lines && ratio < 0.1`) or
     `maxConsDupes >= 8` (`HARD_REJECT_RATIO = 0.1`, `CONSECUTIVE_DUPE_THRESHOLD = 8`,
     `:76-77, :392-395`). If repetitive, attempt salvage via `deduplicateConsecutive`
     (`:397-410, :519-528`); pass with `deduplicatedText` if the cleaned text still meets
     the min length, else reject.
   - Structure check: for short-ish text (`< STRUCTURE_CHECK_THRESHOLD = 500`, `:78`)
     require at least one structural signal (heading / numbered / bullet / fenced code /
     emoji-bullet / bold / ≥3 paragraphs) else reject `no structured content detected`
     (`:412-423`).
2. **Build content** `buildSkillContent` (`:428-464`): header `# <label>`, auto-generated
   attribution line, optional `## 关键发现` list, the analysis text, and an optional
   `## Referenced Files` list (capped at 20 files).
3. **Write the skill** `createWorkflowSkill` (`:271-376`):
   - Name must be kebab-case, 3-64 chars (`:291-299`).
   - Reject if the name collides with a **built-in** skill under `PACKAGE_SKILLS_DIR`
     (`BUILTIN_CONFLICT`, `:301-310`).
   - Reject if a project skill already exists and `overwrite !== true` (`ALREADY_EXISTS`,
     `:315-323`). `generateSkill` always passes `overwrite: true` (`:104`).
   - Frontmatter (`buildSkillFrontmatter`, `:466-489`) + content are written either
     through a `WriteZone` (data-root sandboxed, preferred when
     `container.singletons.writeZone` exists) or directly with `pathGuard.assertProjectWriteSafe`
     + `fs.writeFileSync` (`:326-352`). Content hash is `sha256:<hash>` over the written
     bytes (`:341`).
   - Side effects: `removePendingSuggestion(name)` clears any global signal-collector
     suggestion (`:354, :538-547`); `runSkillCreatedHook` fires the `onSkillCreated`
     SkillHook fire-and-forget (`:355, :549-563`).
4. **Delivery receipt** `createWorkflowSkillDeliveryReceipt` (`:144-246`): builds a
   `ProjectSkillDeliveryReceipt` (Core factory `createAlembicProjectSkillDeliveryReceipt`)
   describing an artifact + authorization + runtime-export block. Scope is resolved by
   `resolveWorkflowSkillDeliveryScope` (`:248-269`): `codexSkillRoot =
   <projectRoot>/.agents/skills`, `projectScopeId = project:<projectId>`. The receipt is
   validated (`validateProjectSkillDeliveryReceipt`) and summarized
   (`summarizeProjectSkillDeliveryReceipt`), both Core.

The receipt's semantics encode the **host/plugin split explicitly**: `runtimeExport.status:
'pending'`, `linkMode: 'none'`, `strategy: 'symlink-first'`, and the message
"Alembic generated the Project Skill and receipt; AlembicPlugin must export it to the Codex
project skill root." (`SkillCompletionCapability.ts:218-229`). Alembic *writes* the skill
and *emits* the receipt; the **Codex/CC plugin** is responsible for the runtime export
(link into the host skill root). `shoutSummary.runtimeVisible: false` reflects that the
skill is not yet host-visible (`:230-236`).

Downstream, `recordSkillDeliveryReceipt` (`BootstrapConsumers.ts:1196-1281`) pushes the
receipt into `SkillResults`, emits a `dimension_complete` event of `type: 'skill'` with the
receipt, and (if a `sessionId` exists) emits a process event of kind `artifact` /
phase `skill-delivery` carrying the receipt JSON. Finally
`augmentWorkflowReportWithSkillDeliveryReceipts` (`AiDimensionFinalizer.ts:396-436`) folds
the receipts into the workflow report under `report.projectSkillDelivery` and per-dimension
`projectSkillDelivery`.

### 10.8 dimension_complete — the completion signal / MCP tool

"dimension_complete" appears in two distinct-but-related forms:

1. **Internal event** `emitDimensionComplete(dimId, payload)` — emitted by the bootstrap
   event emitter for every dimension (candidate/skill/error) as the async fill progresses
   (`BootstrapConsumers.ts:683-695` for candidate/skill dimensions,
   `:906` for errors, `:1174-1181` for skill delivery). Payload `type` is
   `'candidate' | 'skill' | 'error'` (`buildBootstrapDimensionCompleteEventPayload`,
   `:301-333`). These are the Socket.io progress events
   (`bootstrap:task-completed` / `bootstrap:task-failed`, per the ColdStart header
   `ColdStartWorkflow.ts:30-35`).
2. **MCP tool** `alembic_dimension_complete` — host-agent-facing tool whose zod input
   `DimensionCompleteInput` requires `dimensionId` + `analysisText` and optionally
   `submittedRecipeIds`, `referencedFiles`, `keyFindings`, `candidateCount`,
   `crossDimensionHints` (`lib/shared/schemas/mcp-tools.ts:489-506`; registered in
   `TOOL_SCHEMAS` at `:610`). This is the *host-agent* path (a host AI signals it has
   finished a dimension, feeding the same Skill/coverage machinery). The workflow files in
   this section are the *in-process AI* path; the two paths converge on the same coverage
   write-back / skill generation, which is why the coverage write-back is described as a
   "mirror" of the Plugin/host-agent behavior.

### 10.9 External interfaces (enumerations)

Entrypoints that reach these workflows (host-owned, this repo):

| Interface | Entry | Reaches |
|---|---|---|
| CLI | `alembic bootstrap [--knowledge] [--wait]` (`bin/cli.ts` bootstrap command, ~`:690-848`) | cold start |
| CLI | `alembic rescan [--reason ...] [--wait]` (`bin/cli.ts` rescan command, `:863-991`) | rescan |
| MCP tool | `alembic_bootstrap` / `alembic_rescan` / `alembic_dimension_complete` (`lib/shared/schemas/mcp-tools.ts:608-610`) | cold start / rescan / completion signal |
| HTTP job | `POST /jobs/bootstrap` → `startBootstrapJob`, `POST /jobs/rescan` → `startRescanJob` (`lib/http/provider-contracts.ts:397-398`) | daemon job → workflow |
| Daemon | `executeApiAiWorkflow` (`lib/daemon/DaemonJobRunner.ts:871-912`) dispatches by `kind`/`generationStage` | cold start / rescan / deepMining / moduleMining |

SkillHooks fired by these chains (fire-and-forget):

| Hook | Fired from | Anchor |
|---|---|---|
| `onBootstrapComplete` | cold start return path | `ColdStartWorkflow.ts:287-307` |
| `onRescanComplete` | rescan return path | `KnowledgeRescanWorkflow.ts:824-848` |
| `onSkillCreated` | skill write | `SkillCompletionCapability.ts:355, 549-563` |

Filesystem artifacts written here:

| Artifact | Path | Anchor |
|---|---|---|
| Project Skill | `<projectSkillsDir>/<name>/SKILL.md` (or WriteZone data path) | `SkillCompletionCapability.ts:313-352` |
| Skill managed marker (referenced) | `<codexSkillRoot>/<name>/.alembic-managed.json` | `SkillCompletionCapability.ts:169-170` |
| Wiki pages | via `WikiGenerator` (host service) | `CompletionSteps.ts:34-51` |
| Coverage ledger cells | SQLite via `coverageLedgerRepository` (Core repo) | `KnowledgeRescanWorkflow.ts:956-967` |
| Bootstrap report history | `bootstrap-report.json` + history (WriteZone or `<dataRoot>/.asd`) | `AiDimensionFinalizer.ts:334-354` |

### 10.10 Notable algorithms, gotchas & edge cases

- **Fast-skeleton + async-fill split.** Both workflows return a projection quickly and let
  `dispatchAiDimensionRuns` mine in the background. The response object (`asyncFill: true`
  is added by the daemon, `DaemonJobRunner.ts:891, 911`) is *not* the final knowledge — the
  real candidates/skills land later via events. Do not treat the workflow return value as
  the completion evidence.
- **Session lifecycle is explicit and easy to leak.** `ProjectContextWorkflowSession` is
  opened in Step 4.6 / 5.5 and must be released. Cold start registers release-on-bootstrap-
  completion (`ColdStartWorkflow.ts:251-260`); rescan releases directly on module-mining
  completion (`KnowledgeRescanWorkflow.ts:719-727`) or no-fill (`:813-821`), and registers
  release-on-completion for the dispatched dimension-fill path (`:658-667`). Adding a new
  early-return branch without a release is a leak.
- **`skipAsyncFill` / `runAsyncFillInline` / `skipTargetDelivery`** live under
  `intent.internalExecution` / `args.internalExecution` and change whether fill runs at all,
  runs inline vs dispatched, and whether target delivery / wiki are skipped
  (`ColdStartWorkflow.ts:251-285`, `KnowledgeRescanWorkflow.ts:653-657, 728-791`,
  `AiDimensionFinalizer.ts:245`). These are the levers for the CLI/daemon vs. real-agent
  scenarios; misreading them silently changes behavior.
- **Coverage write-back is best-effort and skip-heavy.** It returns `{skipped:true}` for
  no candidates, missing repository, no ProjectMap modules, or no source refs
  (`KnowledgeRescanWorkflow.ts:912-944`). If ProjectMap modules are empty (as they can be
  for a brand-new project), coverage never advances even though candidates were created —
  this is the classic "coverage never moves" edge (guard: modules must have a real module
  axis, `:970-991`).
- **Impact/evolution steps are all wrapped in try/catch** and log-and-continue
  (`KnowledgeRescanWorkflow.ts:334-338, 357-361, 385-389, 427-431`). A failure in
  SourceRef reconcile / impact planning / evolution audit degrades the rescan but does not
  abort it; the audit summary still merges whatever counts succeeded (`:446-456`).
- **`immediateDeprecated` / `proposalsCreated` are additive across three sources**
  (raw audit + impact submission outcomes + evolution audit), computed by
  `countImpactProposalOutcomes` / `countImpactImmediateDeprecations`
  (`KnowledgeRescanWorkflow.ts:165-181, 446-456`).
- **`stripSourceRefLineAnchor` only strips a trailing `:N` / `:N-M`** (`:1029-1031`); a
  path with an embedded colon that is not a line anchor is left intact — correct, but
  worth knowing when debugging why a source ref did/didn't dedupe.
- **Rescan completion is intentionally isolated.** If you expect Wiki/semantic-memory to
  refresh after a rescan, it will not — that only happens on bootstrap
  (`AiDimensionFinalizer.ts:232-234, 735-744`).
- **Delivery slot in the completion finalizer is inert.** `deliveryVerification` /
  `deliveryStatus` are hardcoded (`CompletionFinalizer.ts:61-62`); real Skill delivery is
  the receipt path in 10.7. Don't add "delivery verification" expectations to the finalizer
  without wiring it.

### 10.11 Boundary note — host-owned here vs. delegated

**Host-owned (this `Alembic/` main-body repo, files in this section):**

- The orchestration control flow: phase ordering, gap-analysis wiring, async-fill dispatch,
  session open/release lifecycle, the mode registry (`ProjectIndexWorkflow.ts`), and the
  fast-skeleton response shape.
- DI-container access (`container.get('database'|'agentService'|'evolutionGateway'|
  'coverageLedgerRepository'|'signalBus'|'skillHooks'|...)`) — the service locator and all
  service wiring are host concerns.
- `CleanupService` factory + full/rescan cleanup invocation (`ColdStartWorkflow.ts:135-141`,
  `KnowledgeRescanWorkflow.ts:241-254, 1203-1215`).
- `ProduceSessionRoute.ts` — the controller-authorized produce-session projection is
  entirely local (pure functions, no engine call).
- Skill filesystem writing (`createWorkflowSkill`), the built-in/name/collision guards, the
  WriteZone/pathGuard write path, and the local skill quality gate
  (`validateSkillQuality`, `buildSkillContent`, dedup) — `SkillCompletionCapability.ts`.
- Wiki generation via the host `WikiGenerator` service (`CompletionSteps.ts:34-51`).
- Event/Socket.io bridging (`emitDimensionComplete`, process events) and workflow-report
  augmentation (`AiDimensionFinalizer.ts`).
- CLI/HTTP/daemon/MCP entrypoints (`bin/cli.ts`, `lib/http/*`, `lib/daemon/DaemonJobRunner.ts`,
  `lib/shared/schemas/mcp-tools.ts`).

**Delegated to `@alembic/core` (engine / shared kernel — imported, not implemented here):**

- Workflow *plans & intents*: `createInternalColdStartIntent`, `buildColdStartWorkflowPlan`,
  `runFullResetPolicy`, `createInternalKnowledgeRescanIntent`,
  `buildKnowledgeRescanWorkflowPlan`, `runForceRescanCleanPolicy`, `runRescanCleanPolicy`
  (`@alembic/core/host-agent-workflows`).
- Recipe *impact / evolution engine*: `RecipeImpactPlanner`, `submitRescanImpactDecisions`,
  `toEvolutionAuditRecipe` (`@alembic/core/evolution`); `auditRecipesForRescan`,
  `buildRescanPrescreen`, `buildKnowledgeRescanPlan`, the gap-plan projectors
  (`@alembic/core/host-agent-workflows`).
- *SourceRef reconciliation*: `SourceRefReconciler` (`@alembic/core/knowledge`).
- *Coverage-ledger algebra*: `buildCoverageLedgerModuleAxisFromSummaries`,
  `resolveModuleTier`, `resolvePerCellTargetDefault`, `writeCoverageLedgerForCompletion`,
  and the `EvolutionCoverageLedgerRepository` (`@alembic/core/*`). The host only assembles
  inputs and picks the round index.
- *Plan selection* projection type + `applyTestDimensionFilter` (`@alembic/core/plans`,
  `@alembic/core/shared`).
- *Checkpoint / report persistence*: `saveDimensionCheckpoint`, `buildTierReflection`,
  `persistWorkflowResult`, `writeWorkflowReportHistory*` (`@alembic/core/host-agent-workflows`).
- *Project Skill delivery receipt* contract + validation:
  `createAlembicProjectSkillDeliveryReceipt`, `validateProjectSkillDeliveryReceipt`,
  `summarizeProjectSkillDeliveryReceipt`, `getProjectSkillsPath`, `pathGuard`,
  workspace resolvers (`@alembic/core/*`). The receipt's `runtimeExport` block is a
  contract *to AlembicPlugin*, not something this repo executes.

**Delegated to `@alembic/agent` (in-process agent runtime — imported, not implemented here):**

- `runModuleMining`, `runEvolutionAudit`, `AgentService` (`@alembic/agent/service`) — the
  actual LLM-driven mining/audit runs.
- Semantic-memory primitives: `PersistentMemory`, `MemoryEmbeddingStore`
  (`@alembic/agent/memory`) and `EpisodicConsolidator` (`@alembic/agent/domain`), consumed
  by `consolidateSemanticMemory` (`CompletionSteps.ts:128-151`).
- `SessionStore` / `MemoryCoordinator` types used by the bootstrap consumers
  (`BootstrapConsumers.ts:12`).

Rule of thumb when modifying this subsystem: if the change is about *when/where* a step
runs, *which service is pulled*, *how a session is opened/released*, or *what the host
writes to disk / emits as an event*, it belongs here. If it is about *how* an impact plan,
evolution verdict, coverage tier, plan projection, checkpoint, or receipt is computed, it
belongs in `@alembic/core`; if it is about *how* the LLM mines/consolidates, it belongs in
`@alembic/agent`.


---


## 11. Workflows — Project Context & Project Index (Panorama Host Side)

This section documents the **host-side ProjectContext / Panorama orchestration** in the Alembic main-body repo. These files assemble the "project facts" that every knowledge-generation workflow (cold-start bootstrap, knowledge-rescan, plan-selection gate) consumes, and expose the unified `runProjectIndexWorkflow` entrypoint that routes to the full/incremental implementations.

The critical boundary to keep in mind throughout: the **Panorama engine itself — the ProjectContext query capability (`space`/`repo`/`map`/`module`/`file-flow`/…), the presenter model (`ProjectContextPresenterInput`, `ProjectMap`, `RepoContext`, `ModuleContext`), the mission-briefing/host-agent-packet builders, the canonical module-id function, and the base dimension catalog — all live in `@alembic/core`**. This repo _orchestrates_ those Core capabilities: it decides which queries to fire in which order, propagates the native `ProjectScope` folder set, folds the resulting envelopes into a host-shaped `ProjectContextWorkflowFacts` blob, derives project-scope-aware module lists, persists a file snapshot for incremental diffing, and manages the workflow session lease. See the **Boundary note** at the end for the precise split.

Files covered:
- `lib/workflows/project-context/ProjectContextWorkflowFacts.ts` — facts assembly + session lease + mission artifacts (the large orchestrator).
- `lib/workflows/project-context/ProjectMapModules.ts` — module-id derivation from ProjectMap and from repo targets (Swift-package aware).
- `lib/workflows/project-context/ProjectContextPresenters.ts` — MCP envelope presenters for cold-start / rescan / empty-project.
- `lib/workflows/project-index/ProjectIndexWorkflow.ts` — unified `runProjectIndexWorkflow` dispatcher + lazy implementation registry.
- `lib/project-context/ProjectContextConsumerFacts.ts` — a lighter, separate ProjectContext consumer used by `ModuleService` (Dashboard/module APIs).

---

### 11.1 Responsibilities & role in the system

There are **two distinct host-side ProjectContext consumers** in this repo, and they must not be conflated:

1. **The workflow facts pipeline** (`workflows/project-context/*`) — heavy, used by the knowledge-generation workflows. It fires a *sequence* of ProjectContext queries (space → repo → map → module → per-file detail), folds them into `ProjectContextWorkflowFacts`, and carries source content, module coverage axes, language stats, and an incremental file-diff plan. This is what `runProjectIndexWorkflow` ultimately feeds.
2. **The consumer facts pipeline** (`project-context/ProjectContextConsumerFacts.ts`) — light, used by `ModuleService` (`lib/service/module/ModuleService.ts:154`, `:234`, `:250`) to answer Dashboard/module-graph questions (targets, files-per-target, dependency graph, project info). It fires at most two queries (`repo`, `map`) and shapes results into legacy `discoverer`-style entries.

Both call the same Core capability (`ProjectContextCapabilities.execute`), but with different `source` tags (`alembic-main-bootstrap` / `alembic-main-rescan` vs `alembic-main-consumer`) and different output shapes.

The `runProjectIndexWorkflow` dispatcher (`lib/workflows/project-index/ProjectIndexWorkflow.ts:62`) is the **single unified entry** all host surfaces use to trigger project indexing — CLI, daemon jobs, and internal callers all import it dynamically and pass `{ mode: 'full' | 'incremental' }`.

---

### 11.2 `ProjectIndexWorkflow` — the unified dispatcher (dual-host anchoring)

#### Purpose
`ProjectIndexWorkflow.ts` is a thin **façade + lazy registry** that decouples callers from the concrete cold-start / knowledge-rescan implementations. It exists so the two real workflows can be dynamically imported on first use (avoiding an eager import cycle) and so callers speak one API regardless of `mode`.

#### Key exports/types (`lib/workflows/project-index/ProjectIndexWorkflow.ts`)

| Symbol | Line | Role |
|---|---|---|
| `ProjectIndexWorkflowMode` | 10 | `'full' \| 'incremental'` |
| `ProjectIndexMcpContext` | 11 | `WorkflowMcpContext & McpContext` (both from `@alembic/core`) |
| `ProjectIndexFullArgs` | 13 | `InternalColdStartArgs` (Core) extended with optional `planSelectionProjection` + `projectContextFacts` |
| `ProjectIndexIncrementalArgs` | 17 | alias of `InternalKnowledgeRescanArgs` (Core) |
| `registerProjectIndexWorkflowImplementation(mode, runner)` | 33–50 | registers a concrete runner into the private `implementations` table |
| `runProjectIndexWorkflow(ctx, args, {mode})` | 52–76 | the overloaded public dispatcher |
| `loadProjectIndexWorkflowImplementation(mode)` | 78–103 | lazy-loads the impl module if not yet registered |

#### Control flow
1. Caller invokes `runProjectIndexWorkflow(ctx, args, { mode })` (`:62`). It logs the dispatch (`:67`).
2. For `mode === 'full'` it awaits `loadProjectIndexWorkflowImplementation('full')` and calls it with `args as ProjectIndexFullArgs` (`:70–73`); otherwise the incremental path (`:74–75`).
3. `loadProjectIndexWorkflowImplementation` (`:84`) returns the already-registered runner if present (`:87–90`); otherwise it **dynamically imports** the implementation module: `../cold-start/ColdStartWorkflow.js` for full (`:93`) or `../knowledge-rescan/KnowledgeRescanWorkflow.js` for incremental (`:95`). Those modules **self-register** at import time via `registerProjectIndexWorkflowImplementation('full'|'incremental', …)` — see `ColdStartWorkflow.ts:321` and `KnowledgeRescanWorkflow.ts:868`.
4. If after import the implementation is still missing, it throws `ProjectIndexWorkflow implementation not registered for mode=${mode}` (`:100`).

#### "Dual-host anchoring" — what it means here
This dispatcher is the *host-owned mode axis*. The mode (`full`/`incremental`) is encoded implicitly by which module gets dynamically imported and which runner self-registers; there is no shared runtime branch inside a single implementation. Note the ColdStartWorkflow itself re-exports and re-invokes the dispatcher (`ColdStartWorkflow.ts:73–74`, `:103` calls `runProjectIndexWorkflow(ctx, args, { mode: 'full' })`) and the rescan workflow does the same for incremental (`KnowledgeRescanWorkflow.ts:87–88`, `:192`). The dispatcher is therefore both the public entry *and* an internal re-entry seam.

#### Callers (external interface of this seam)

| Caller | Line | Mode |
|---|---|---|
| `bin/cli.ts` (bootstrap command) | 699–715 | `full` |
| `bin/cli.ts` (rescan command) | 885–889 | `incremental` |
| `lib/daemon/DaemonJobRunner.ts` (`executeApiAiWorkflow`, bootstrap job) | 874–889 | `full` |
| `lib/daemon/DaemonJobRunner.ts` (rescan job) | 902–909 | `incremental` |
| `lib/daemon/DeepMiningRoundGate.ts` | 38, 92 | (dynamic import) |

All callers use the dynamic-import form `const { runProjectIndexWorkflow } = await import('.../ProjectIndexWorkflow.js')`, consistent with the lazy-registry design.

---

### 11.3 `ProjectContextWorkflowFacts` — the facts assembly

This is the largest and most load-bearing file. `buildProjectContextWorkflowFacts` (`lib/workflows/project-context/ProjectContextWorkflowFacts.ts:238`) is the function that turns a project root (plus optional `ProjectScope`) into the `ProjectContextWorkflowFacts` object (`:69–93`) that the generation workflows fill from.

#### The `ProjectContextWorkflowFacts` shape (`:69–93`)
Notable fields: `allFiles: BootstrapFileEntry[]`, `allTargets`, `dimensions: DimensionDef[]` (Core), `envelopes: ProjectContextEnvelope[]` (Core), `fileCount`, `filesByTarget`, `incrementalPlan: FileDiffPlan | null` (Core type), `isEmpty`, `isMultiLang`, `languageStats`, `moduleCount`, `projectMapModules: ProjectContextModule[]` (host type), `moduleSeeds`, `presenterInput: ProjectContextPresenterInput` (Core), `primaryLang`, `projectContextSummary`, `projectType`, `report`, `requestKinds`, `secondaryLanguages`, `targetCount`, `warnings`.

`ProjectContextModule` (`:158–167`) and `ProjectContextModuleSeed` (`:148–156`) are **host-defined** shapes; `ProjectContextModule` is the one that carries the canonical `moduleId` used as a coverage-ledger axis.

#### Control/data flow of `buildProjectContextWorkflowFacts` (`:238`)
The function fires a deterministic *sequence* of ProjectContext queries and folds them:

1. **Resolve budgets** (`:241–248`): `maxFiles`, `maxModuleSeeds` (default 6), `maxModuleDetails` (default 3), `maxFileDetails` (default 8), `contentMaxLines` (default 120). `readPositiveInteger` (`:1641`) guards `maxFiles`.
2. **Build scope propagation** (`:249–252`) via `buildProjectContextScopePropagation` (`:885`). This converts the native `ProjectScope` (`analysisScope.projectScope`, its `controlRoot` and `folders`) into control-root-relative `sourceFolders`, `sourceFolderPayloads`, and `identityFolders`. If there is no project scope / no controlRoot / no folders, it returns an empty propagation (`:891–897`) — i.e. single-repo fallback with no identity folders. `allowCurrentFolderRelativeIdentity` is true only when the request root differs from the control root (`:931–932`).
3. **Scan scoped source files** (`:253–256`) via `collectProjectScopeWorkflowFileCandidates` (`:1014`). Only runs when there are identity folders; otherwise returns `[]`. It splits `maxFiles` across folders (`:1025–1026`) and walks each folder breadth-first (`collectProjectScopeFolderFileCandidates`, `:1035`), skipping excluded dirs (`PROJECT_SCOPE_SOURCE_SCAN_EXCLUDE_DIRS`, `:205–213`: `.asd .git .next .turbo coverage dist node_modules`) and keeping only known source extensions (`PROJECT_SCOPE_LANGUAGE_BY_EXTENSION`, `:215–236`). Directory scan order is priority-scored (`projectScopeScanEntryScore`, `:1093`: `src`/`lib`=0, `bin`/`scripts`/`test`/`tests`=10, dotfiles=80). Default cap `PROJECT_SCOPE_SOURCE_SCAN_DEFAULT_MAX_FILES = 2000` (`:203`).
4. **`space` query** (`:258–266`) with `includeProjectTree: true`. If scope has `sourceFolderPayloads`, they are injected into the payload as `sourceFolders` (see `executeProjectContextRequest`, `:866–868`).
5. **First `repo` query** (`:267–276`) with `includeMapSummary: false` to get a `RepoContext` cheaply. `repoData` is type-guarded via `isRepoContext` (`:1647`).
6. **Compute module seeds** (`:278–281`): merge `createProjectScopeModuleSeeds` (one seed per identity folder, `:1127`) with `selectProjectContextModuleSeeds` (derived from repo `localPackages` / `sourceRoots` / `topAreas` / `entrypoints` / `targets`, `:1468`), dedupe (`dedupeModuleSeeds`, `:1620`), and slice to `maxModuleSeeds`.
7. **Second `repo` query** (`:282–295`) — only if seeds exist — re-runs `repo` with `includeMapSummary: true` and the seeds so the map summary is seeded; otherwise reuses the first repo envelope.
8. **`map` query** (`:298–311`) if seeds exist, passing `moduleSeeds` + `repoName`.
9. **Per-seed detail** (`:313–339`): for the first `maxModuleDetails` seeds, fire `module` (`includeDependencies`, `includePublicSurfaces`) and `module-layers` (`includeBoundaryCrossings`) queries.
10. **Per-file detail** (`:341–397`): `selectProjectContextDetailFiles` (`:1528`) picks up to `maxFileDetails` files from module `ownedFiles` and envelope refs; for each it fires `file-flow`, `file-symbols`, `source-slice` (with text, lines 1..`contentMaxLines`), and `anchor-range` queries.
11. **Build presenter input** (`:399`) via Core's `buildProjectContextPresenterInput(envelopes)` — this is the Core-owned fold from raw envelopes to the presenter model.
12. **Dimensions** (`:400`): `[...baseDimensions]` — the **Core-owned** base dimension catalog is copied verbatim; this file never invents dimensions.
13. **Derive host arrays** (`:401–421`):
    - `allFiles` via `buildWorkflowFiles` (`:1230`) — merges presenter `files` with scoped fallback files, attaching `sourceIdentity` when a scope folder matches (files without an identity are dropped when identity folders exist, `:1243`, `:1262`).
    - `languageStats` via `buildLanguageStats` (`:1543`).
    - `primaryLang` / `secondaryLanguages` via `inferProjectContextPrimaryLanguage`/`Secondary` (`:1571`, `:1580`).
    - `allTargets` via `buildWorkflowTargets` (`:1342`).
    - `filesByTarget` via `buildProjectContextTargetFileMap` (`:1358`).
    - `projectMapModules` via `buildScopedProjectMapModules` (`:1148`); **if that yields zero modules, fall back to `buildProjectMapModulesFromTargets`** (`:413–421`) — the async, filesystem-walking, Swift-aware path in `ProjectMapModules.ts` (see §11.4).
14. **Incremental plan** (`:422–430`): only for `source === 'alembic-main-rescan'`; builds a `FileDiffPlan` from the persisted file snapshot (see §11.6).
15. **Assemble & return** (`:447–480`): computes `moduleCount` (`projectMapModules.length || presenterInput.modules.length || 0`, `:431`), `warnings` (flattened presenter warnings + unavailable entries, `:432–437`), `report` (`buildProjectContextWorkflowReport`, `:1375`), `projectContextSummary` (`buildProjectContextSummary`, `:1411`), `projectType` (`inferProjectContextProjectType`, `:1589`). `isEmpty` is `allFiles.length === 0 && presenterInput.refs.length === 0` (`:455`).

An info log summarizes readiness (`:439–445`): `fileCount`, `moduleCount`, `projectInformationSource: 'project-context'`, `requestKinds`, `source`.

#### `executeProjectContextRequest` (`:855`) — the single Core call seam
Every query goes through this wrapper. It computes the effective payload (`:864–870`): for `space` it injects `sourceFolders` from scope payloads; for `repo` it injects `repoRoot` from the primary source folder. Then it calls `ProjectContextCapabilities.execute({ kind, payload, project: { displayName, projectRoot, source }, scope: { projectRoot } })` (`:871–882`). `ProjectContextCapabilities` is imported from `@alembic/core/project-context-capabilities` (`:27`) — **this is the delegation point to the Core Panorama engine**.

#### Session lease management (host-owned lifecycle)
This file also owns the **workflow session lease**, layered over Core's `getOrCreateSessionManager` (`@alembic/core/host-agent-workflows`, `:10`):

| Function | Line | Role |
|---|---|---|
| `createProjectContextWorkflowSession` | 483 | create a session (optionally `replace`) |
| `openOrReturnProjectContextWorkflowSession` | 496 | create, or return existing on conflict |
| `releaseProjectContextWorkflowSession` | 520 | release by session id |
| `releaseProjectContextWorkflowSessionByProjectRoot` | 553 | release by project root (`releaseProjectLease`) |
| `registerProjectContextWorkflowSessionReleaseOnBootstrapCompletion` | 587 | hook that releases the lease when the async bootstrap session finishes |
| `buildProjectContextWorkflowSessionOptions` | 647 | shapes the session's `projectContext` (fileCount/modules/primaryLang/projectName) |

The completion hook (`:587`) resolves the container `eventBus` (`resolveProjectContextWorkflowEventBus`, `:708`), subscribes to `bootstrap:all-completed` (`:643`), matches by `sessionId` (`:617`), and only releases the lease when the completion event is **clean or cancelled** (`classifyBootstrapCompletionRelease`, `:719`). "Clean" is a strict predicate (`isCleanBootstrapCompletionEvent`, `:759`): overall `status === 'completed'`, every task `completed`, no `degraded`, and no task result status in a blocklist (`timeout`, `blocked`, `aborted`, `error`, `skipped`, `degraded_no_findings`, `record_repair_incomplete`, `l4_compaction_failed_budget_exhausted`, `:778–787`). This is deliberately conservative — an un-clean completion **retains** the lease (`:624–631`) so a partial run is not treated as done. This is a subtle gotcha: a degraded bootstrap will leak the session lease until an explicit release.

#### Mission artifacts (`buildProjectContextMissionArtifacts`, `:679`)
Delegates to Core builders: `buildProjectContextMissionBriefing` and `buildHostAgentAnalysisPacketFromProjectContext` (`@alembic/core/host-agent-workflows`, `:6–13`). It maps host profile `'cold-start'` → Core profile `'cold-start-host-agent'` and `'rescan'` → `'rescan-host-agent'` (`:689`). Note the **R1 compatibility alias** (`ProjectContextMissionArtifacts`, `:121–126`): `ideAgentPacket` is set to the same object as `hostAgentPacket` (`:704`) purely so older report/runtime consumers still reading `ideAgentPacket` keep working — it is not a second packet.

#### `buildProjectContextFillView` (`:791`)
Packages the facts plus bootstrap-session, recipes, evolution prescreen, mode, and hooks into a `ProjectContextFillView` (`:95–107`) consumed by the fill/dimension-execution stage. `targetFileMap` is wired to `facts.filesByTarget` (`:814`).

#### `saveProjectContextFileSnapshot` (`:818`)
Persists a compact snapshot (`allFiles` paths only, `primaryLang`, `isIncremental`) into the DB via `saveProjectContextFileSnapshotRow` (see §11.6). Failures are swallowed with a warn (`:847–852`). Returns the generated id `pc-${Date.now()}` or `null`.

---

### 11.4 `ProjectMapModules` — module-id derivation (dual-host divergence risk)

`lib/workflows/project-context/ProjectMapModules.ts` derives the host-side `ProjectContextModule[]` — the module axis that seeds the **evolution coverage ledger**. There are two entry functions:

| Function | Line | Input | Notes |
|---|---|---|---|
| `buildProjectMapModules(map, options)` | 16 | Core `ProjectMap` | synchronous; one module per `map.modules[]` |
| `buildProjectMapModulesFromTargets(input)` | 49 | presenter input + `allFiles` + `projectRoot` | async; Swift-package aware; the fallback path used when the map path is empty |

#### `buildProjectMapModules` (`:16`)
For each `ProjectMap` module it normalizes the ref file path (`:22`) and computes the canonical id via Core's `buildCanonicalCoverageLedgerModuleId({ moduleId: module.id, moduleName, modulePath, projectRoot })` (`:23–28`, imported from `@alembic/core/host-agent-workflows`, `:3`). Modules with no derivable id are dropped (`:29–31`, `:46`). When a `modulePath` exists it also sets `ownedFiles: [modulePath]` (`:40–43`).

#### `buildProjectMapModulesFromTargets` (`:49`) — the target-walk fallback
This is the richer path used when `buildScopedProjectMapModules` returns empty (`ProjectContextWorkflowFacts.ts:413`). For each repo target it:
1. Reads Swift package target→path map (`readSwiftPackageTargetPathMap`, `:221`), which parses `Package.swift` (and nested local package manifests) with regexes (`extractSwiftTargetPathMap`, `:247`; `extractSwiftLocalPackagePaths`, `:272`). This is a genuine host-side filesystem read — Panorama's structure model does not carry raw Swift manifest paths.
2. Infers the module path (`inferTargetModulePath`, `:98`) — prefers a ref-derived path, reconciles against the Swift package path (`:108–110`), then package/localPackage paths, then a common-ancestor of sampled owned files (`inferCommonModulePath`, `:377`).
3. Infers owned files (`inferTargetOwnedFiles`, `:146`) — first sampling from `allFiles` by prefix match (`inferSampledTargetOwnedFiles`, `:174`), then, if none, walking the project root under candidate prefixes (`collectOwnedFilesFromProjectRoot`, `:284` → `collectFilesFromDirectory`, `:324`, limit 80, skipping build/vcs dirs via `shouldSkipOwnedFileEntry`, `:364`).
4. Computes the canonical id with `buildCanonicalCoverageLedgerModuleId({ moduleName, modulePath, projectRoot })` (`:75–79`) and pushes a `ProjectContextModule` (`:84–93`).

`buildTargetPathPrefixes` (`:190`) is the heuristic that, absent an explicit path, tries `Sources/<name>`, `Source/<name>`, `Tests/<name>`, `Packages/<name>`, `src/<name>` — clearly Swift/JS-oriented convention guessing.

#### ⚠️ Dual-host module-id divergence (known risk)
The canonical id is produced by the **same Core function** `buildCanonicalCoverageLedgerModuleId` in three host places:
- `ProjectMapModules.ts:23` (map path)
- `ProjectMapModules.ts:75` (target-walk path)
- `ProjectContextWorkflowFacts.ts:1196` (`buildProjectScopeFolderModules`, project-scope-folder path)

However, the **inputs differ by call site**: the map path can pass `moduleId: module.id`, while the target path and the folder path pass only `{ moduleName, modulePath, projectRoot }` (no `module.id`). Whether `buildCanonicalCoverageLedgerModuleId` yields the same id for the same physical module across these paths depends entirely on the Core function's canonicalization. The residual-followup analysis (see workspace memory `alembic-recipe-lifecycle-refactor-residual-followup`) records this as **R-1 [HIGH]**: the in-process host derives module ids from these `{name, path}`-shaped inputs, while the *host-target* rescan path in `@alembic/core` (`knowledge-rescan.ts:781`, Core repo — **not** this repo) derives from a `target:name:path` shape; for an empty ProjectMap the two happen to agree (why BiliDili parity passed), but a non-empty map project can re-diverge. The canonical decision (CG-1) is `target:name:path`. **This file's `moduleId`s flow directly into the coverage ledger axis** at `KnowledgeRescanWorkflow.ts:970–991` (`buildKnowledgeRescanCoverageLedgerModules` reads `facts.projectMapModules[].moduleId`), so any divergence surfaces as coverage never converging for that module. Treat module-id shape as load-bearing when editing any of the three derivation sites — they must stay consistent with the Core canonical form.

A second, separate ledger writer exists at Plugin `dimension-completion.ts:663` (per the same memory note) — not in this repo, but relevant when reasoning about who writes ledger cells.

`dedupeProjectContextModules` (`:397`) dedupes by `moduleId:modulePath`; the sibling in the facts file dedupes by `moduleId` only (`ProjectContextWorkflowFacts.ts:1218`) — a minor inconsistency to be aware of.

---

### 11.5 `ProjectContextPresenters` — MCP envelope shaping

`lib/workflows/project-context/ProjectContextPresenters.ts` converts `ProjectContextWorkflowFacts` into the MCP response envelopes returned to the host agent / CLI. All three go through the local `workflowEnvelope` helper (`:166`).

| Presenter | Line | Tool tag | When |
|---|---|---|---|
| `presentProjectContextColdStartEmptyProject` | 9 | `alembic_bootstrap` | `facts.isEmpty` — "No source files found, nothing to bootstrap" |
| `presentProjectContextColdStartResponse` | 23 | `alembic_bootstrap` | normal cold-start skeleton (files queued, dimensions filling) |
| `presentProjectContextRescanResponse` | 59 | `alembic_rescan` | rescan result (gap analysis, mining mode, inline fill, produce-session) |

Notable details:
- The cold-start response is a **skeleton** — `autoSkills`/`bootstrapCandidates` report `status: 'filling'` with zero counts (`:36–37`); actual content is filled asynchronously by the dimension executors. The human-readable `message` (`:53`) is Chinese and states facts come from ProjectContext.
- `buildAnalysisFramework` (`:150`) splits dimensions into `skillWorthyDimensions` vs `candidateOnlyDimensions` (by `dimension.skillWorthy`) and names `submissionTool: 'knowledge'`.
- `buildInternalNextSteps` (`:44`) is a **Core** helper (`@alembic/core/host-agent-workflows`, `:2`).
- The rescan presenter computes several derived flags (`:89–95`): `asyncFill` (true when no produce-session required, there are execution dimensions, and no inline fill), `produceSessionRequired`, `produceSessionBlocked`. A blocked produce session sets `errorCode: 'NO_PRODUCE_SESSION'`, `success: false`, and a diagnostic message (`:141–146`). `status` is `'filling'` vs `'complete'` based on `asyncFill` (`:137`).
- Inline-fill coverage results are surfaced as `coverageLedger.{skippedDimensions, writtenCells}` and `newRecipesThisRound` (`:114–122`).

These presenters are the **user-visible API surface** of the workflow; they define the exact JSON contract the host agent parses. This file is pure shaping — no Core queries.

---

### 11.6 Persistence — file snapshot & incremental diff plan

Incremental rescan relies on a persisted list of the previous run's files.

- **DB table**: `project_context_file_snapshots (id TEXT PK, project_root TEXT, session_id TEXT, payload TEXT, created_at INTEGER)` — created on demand in `saveProjectContextFileSnapshotRow` (`lib/infrastructure/database/SqliteDatabaseAccess.ts:191`), inserted at `:196`, read latest-first at `:212`, and deleted-by-project-root at `:176`.
- **Write**: `saveProjectContextFileSnapshot` (`ProjectContextWorkflowFacts.ts:818`) stores only `{allFiles: [{path, relativePath}], isIncremental, primaryLang}` — deliberately compact; no source content is persisted.
- **Read/diff**: `buildProjectContextFileDiffPlan` (`:940`) loads the latest snapshot (`loadLatestProjectContextFileSnapshot`, `:993`) and produces a Core-typed `FileDiffPlan`:
  - No previous snapshot → `mode: 'full'`, `canIncremental: false`, all dimensions affected (`:947–958`).
  - Previous snapshot, no changes → `mode: 'incremental'`, `canIncremental: true`, all dimensions skipped, "维度执行可由 rescan plan 决定" (`:969–980`).
  - Previous snapshot, files changed → `mode: 'full'` again (all dimensions affected, `:981–990`).
  - **Gotcha**: `modified` is always empty (`:965`) and `changed = added + deleted + modified` (`:966`). The diff is **membership-only** (file added/removed), not content-hash based — a file whose *content* changed but whose path list is unchanged produces `changed === 0` and is treated as "unchanged", deferring the decision to the rescan plan. This is intentional but easy to misread as a content diff.
- The diff plan is only built for `source === 'alembic-main-rescan'` (`:422–423`); cold-start leaves `incrementalPlan: null`.

---

### 11.7 `ProjectContextConsumerFacts` — the light Dashboard/module consumer

`lib/project-context/ProjectContextConsumerFacts.ts` is a **separate, lighter** ProjectContext consumer (note the different directory — `lib/project-context/`, not `lib/workflows/project-context/`). It exists to answer module/graph questions for `ModuleService` (Dashboard + module APIs) without the heavy multi-query facts pipeline. Its `source` tag is `'alembic-main-consumer'` (`:13`).

#### Exported API

| Function | Line | Returns | Core queries fired |
|---|---|---|---|
| `loadProjectContextRepo(root)` | 59 | `RepoContext` (throws if unavailable) | `repo` (`includeMapSummary`) |
| `loadProjectContextMap(root, repo?)` | 69 | `ProjectMap \| null` | `map` (≤12 seeds) |
| `projectContextTargets(repo, root)` | 81 | `ProjectContextTargetEntry[]` | none (pure shaping) |
| `projectContextFilesForTarget(target, root)` | 122 | `ProjectContextFileEntry[]` | none |
| `projectContextModuleFiles(root)` | 136 | `Map<targetName, filePaths[]>` | `repo` (via `loadProjectContextRepo`) |
| `projectContextDependencyGraph(root, repo?)` | 150 | `ProjectContextDependencyGraph` | `repo` + `map` |
| `projectContextProjectInfo(repo, root)` | 189 | project info summary | none |

#### Notable shaping details
- `ProjectContextTargetEntry` (`:15–31`) is a **legacy-discoverer-shaped** object: it always stamps `discovererId: 'project-context'`, `discovererName: 'ProjectContext'`, `projectInformationSource: 'project-context'`. This is a compatibility shape for older Dashboard/module code that expected a "discoverer" abstraction — the whole discoverer concept is now collapsed onto a single synthetic ProjectContext discoverer (see `projectContextProjectInfo`, `:198–204`, which returns exactly one discoverer with `confidence: 1`).
- `projectContextTargets` (`:81`) falls back from `repo.targets` to `repo.sourceRoots` when there are no targets (`:85–93`).
- `projectContextDependencyGraph` (`:150`) builds nodes from `map.modules` when a map exists, else from targets (`:157–172`); **edges are always `[]`** (`:176`) — this consumer does not surface dependency edges, only nodes + a `dependencySummary` (edgeCount/notes) if present. Callers must not assume a fully-connected graph.
- Language inference here uses Core's `LanguageService.inferLang` (`@alembic/core/shared`, `:11`) rather than the extension map in the workflow-facts file — a second, independent language-classification path.
- Path safety: `pathRelativeToProject` (`:261`) refuses paths escaping the root (returns the original path if it contains `..`), and `safeFileSize` (`:269`) swallows stat errors.

#### Consumers
`lib/service/module/ModuleService.ts` imports `loadProjectContextRepo`, `projectContextTargets`, `projectContextFilesForTarget`, `projectContextProjectInfo`, `projectContextDependencyGraph`, and the `ProjectContextTargetEntry` type (`ModuleService.ts:27–33`). `ModuleService` caches the repo context (`:154`), materializes targets (`:155`), and exposes `getDependencyGraph` (`:234`) and `getProjectInfo` (`:250`) — the backend for the Dashboard module/graph views.

---

### 11.8 Notable algorithms, gotchas & edge cases

- **Query fan-out is bounded and deterministic**: the facts builder never scans the whole tree via ProjectContext; it caps module seeds (6), module details (3), and file details (8), and only deep-queries the top seeds. Raising these knobs multiplies Core query cost linearly. The project-scope *file* scan is a separate, independently-capped walk (2000 default).
- **ProjectScope propagation is the honor-native-scope mechanism**: when a native `ProjectScope` exists, files outside its identity folders are dropped from `allFiles` (`:1243`, `:1262`) and language stats prefer scoped files (`buildLanguageStats`, `:1549–1552`). This is what keeps a multi-repo workspace root from polluting `primaryLang`/`fileCount` (the exact bug tracked in memory `alembic-plan-space-membership-scoping`). Without a scope, it falls back to repo-level languages and single-repo behavior.
- **`sourceIdentity` canonicalization** goes through Core's `createCanonicalSourceIdentity` (`@alembic/core/shared`, `:28`) in `resolveWorkflowFileSourceIdentity` (`:1280`), preferring the longest-matching folder prefix (`:1288–1289`) and only falling back to the current folder when `allowCurrentFolderRelativeIdentity` is set (`:1304–1311`).
- **Module-count fallback chain**: `projectMapModules.length || presenterInput.modules.length || 0` (`:431`) — the host-derived module list wins, then the Core presenter's module list, then zero. So a project with a valid ProjectMap but zero host-derivable canonical ids reports the presenter's count, not zero.
- **Empty-project detection** requires *both* zero files and zero refs (`:455`) — a project with refs but no readable file content is not "empty".
- **Lease leak on degraded bootstrap** (§11.3): the strict clean-completion predicate retains the lease on any degraded/blocked task, so an unhealthy run needs an explicit `releaseProjectContextWorkflowSession*` call to avoid holding the project lease.
- **`incrementalPlan` is membership-only** (§11.6): not a content diff.
- **Two independent language classifiers** and **two dedupe key strategies** exist across these files (noted above) — refactors should be aware they are not shared.

---

### 11.9 Boundary note — host-owned vs `@alembic/core` / `@alembic/agent`

**Delegated to `@alembic/core` (the Panorama/organism engine — not implemented here):**
- The ProjectContext query capability `ProjectContextCapabilities.execute` and the whole `space/repo/map/module/module-layers/file-flow/file-symbols/source-slice/anchor-range` query set — `@alembic/core/project-context-capabilities` (`ProjectContextWorkflowFacts.ts:27`, `ProjectContextConsumerFacts.ts:10`).
- The presenter/context model: `ProjectContextPresenterInput`, `ProjectContextEnvelope`, `ProjectMap`, `RepoContext`, `ModuleContext`, `SpaceContext`, `SourceSliceContext`, `ProjectContextRef`, `ProjectContextResult`, and `buildProjectContextPresenterInput` — `@alembic/core/project-context` (`:14–26`).
- The **canonical coverage-ledger module id** `buildCanonicalCoverageLedgerModuleId` — `@alembic/core/host-agent-workflows` (`ProjectMapModules.ts:3`). The dual-host id-shape canonicalization decision lives in Core.
- The **base dimension catalog** `baseDimensions` and `DimensionDef` type — `@alembic/core/host-agent-workflows` (`ProjectContextWorkflowFacts.ts:4–13`). This repo copies them (`:400`); it does not define dimensions.
- Mission/host-agent artifacts: `buildProjectContextMissionBriefing`, `buildHostAgentAnalysisPacketFromProjectContext`, `buildInternalNextSteps` — Core.
- Session management primitive `getOrCreateSessionManager` and the `FileDiffPlan` / `BootstrapSessionShape` types — Core.
- `LanguageService`, `createCanonicalSourceIdentity` — `@alembic/core/shared`.
- The concrete full/incremental *implementations* (`ColdStartWorkflow`, `KnowledgeRescanWorkflow`) live in this repo's `lib/workflows/*` but consume Core dimension/execution/coverage machinery; the deep engine work is Core's.

**Host-owned in this repo (what these files actually implement/wire):**
- The **query orchestration plan** — which ProjectContext kinds to fire, in what order, with what budgets and seeds (`buildProjectContextWorkflowFacts`, `ProjectContextWorkflowFacts.ts:238`). Core answers each query; the *itinerary* is host-owned.
- **Native ProjectScope propagation** into query payloads and per-file `sourceIdentity` gating (`buildProjectContextScopePropagation` `:885`, `collectProjectScopeWorkflowFileCandidates` `:1014`, `resolveWorkflowFileSourceIdentity` `:1280`).
- **Host-side module derivation** into `ProjectContextModule[]` including the Swift-package-manifest parsing and filesystem target walk (`ProjectMapModules.ts` in full) — Core does not parse `Package.swift` or walk the project FS here.
- The **host facts shape** `ProjectContextWorkflowFacts` / `ProjectContextFillView` / `ProjectContextModule(Seed)` and all derived aggregates (`languageStats`, `filesByTarget`, `allTargets`, `report`, `projectContextSummary`).
- **File-snapshot persistence** and the membership-based `FileDiffPlan` construction (SQLite table `project_context_file_snapshots`; `saveProjectContextFileSnapshot` `:818`, `buildProjectContextFileDiffPlan` `:940`).
- The **workflow session lease lifecycle** and the `bootstrap:all-completed` release hook with its strict clean-completion predicate (`:520`–`:645`, `:759`).
- The **MCP response envelopes** (`ProjectContextPresenters.ts`) — the exact JSON contract for `alembic_bootstrap` / `alembic_rescan`.
- The **unified dispatcher + lazy registry** `runProjectIndexWorkflow` (`ProjectIndexWorkflow.ts`) and the dual-host mode axis.
- The **light consumer facts** for `ModuleService`/Dashboard (`ProjectContextConsumerFacts.ts`), including the legacy synthetic-discoverer shaping.

**`@alembic/agent`:** none of these five files import `@alembic/agent`. The in-process agent runtime / tool system is not involved in ProjectContext assembly; the facts produced here are later handed to the dimension-execution / host-agent stages, which is where the agent boundary appears (outside this section's files).


---


## 12. Services — Module, Skills & Vector

This section documents three host-layer service families under `Alembic/lib/service/`:

- **`service/module/ModuleService.ts`** — the module-explorer / discovery backend that powers the Dashboard SPM ("Structure / Panorama / Modules") views and the AI-scan Recipe-extraction pipeline.
- **`service/skills/`** — the project-skill file backend (`SkillFileService.ts`: list/load/create/update/delete of `SKILL.md` files) plus the skill lifecycle-hook engine (`SkillHooks.ts` + `types.ts`).
- **`service/vector/`** — two embedding-adjacent helpers: `ContextualEnricher.ts` (per-chunk context prefixes before embedding) and `RecipeRegionFixtureGeneration.ts` (drives/verifies Recipe-semantic-region vector generation from SQLite).

All three families are **host-owned wiring/orchestration**: they read project facts, call into engines that live in `@alembic/core` / `@alembic/agent`, and expose the results over HTTP routes (Dashboard) and MCP handlers. The deep engines (ProjectContext model, vector index, Recipe-region generation, Guard rule engine, agent runtime) are **not** implemented here — see the Boundary notes in each subsection.

---

### 12.1 ModuleService — multi-language module scan backend

**Role.** `ModuleService` (`lib/service/module/ModuleService.ts:99`) is the single unified entry point for "what modules/targets exist in this project, what files belong to each, how do they depend on each other, and (optionally) run an AI scan over them to extract Recipe candidates." It is the backend behind the Dashboard SPM / New-Recipe / dependency-graph panels and behind the CLI AI-scan flow.

The header comment (`ModuleService.ts:1-5`) states its purpose: unify module scanning, dependency summaries, and AI-extraction input by going through **ProjectContext repo/map facts**.

#### 12.1.1 Construction & dependencies

Constructor (`ModuleService.ts:119-141`) takes `projectRoot` plus an options bag of **constructed-injection** dependencies, all optional/nullable:

| Option | Type / origin | Used by |
| --- | --- | --- |
| `agentService` | `AgentService` from `@alembic/agent/service` (`:16-19`) | AI extraction (`#aiExtractRecipes`) |
| `systemRunContextFactory` | `SystemRunContextFactory` from `@alembic/agent/service` (`:16-19`) | AI extraction run-context |
| `aiStatus` | `() => AiRuntimeStatus` (type-only import from `../../injection/AiRuntimeStatus.js`, `:25`) | gates AI extraction on readiness |
| `qualityScorer` | opaque `Record<string, unknown>` with `.score(recipe)` | `#enrichRecipes` |
| `recipeExtractor` | opaque | stored, not directly used in this file |
| `guardCheckEngine` | opaque with `.auditFiles(files, opts)` | `scanProject` Guard audit |
| `violationsStore` | opaque with `.appendRun(data)` | persists Guard violations |

The DI container constructs it in `lib/injection/modules/AppModule.ts:51-66` as singleton `moduleService`, injecting `agentService`, `systemRunContextFactory`, `aiStatus: () => getAiRuntimeStatus(ct)`, `qualityScorer`, `recipeExtractor` (from `ct.singletons._recipeExtractor`, a `RecipeExtractor` created at `AppModule.ts:72`), `guardCheckEngine`, and `violationsStore`.

**AD4 boundary note (in-code):** the comment at `ModuleService.ts:22-25` records that the service is forbidden from reaching into the injection runtime for AI status; `AiRuntimeStatus` is imported **type-only** and the status arrives via the constructed `aiStatus` callback. When no provider is supplied, the frozen constant `AI_STATUS_NOT_CONFIGURED` (`ModuleService.ts:38-43`, `{ ready:false, reason:'not-configured', providerName:null, model:null }`) is used — deliberately mirroring the historical `getAiRuntimeStatus(null)` result for guard-handler / CLI-scan constructions.

The CLI path constructs it **without** any AI deps: `lib/cli/AiScanService.ts:185-186` does `new ModuleService(this.projectRoot)`, so scans from that entry point return `noAi`.

#### 12.1.2 Lifecycle & caching

- `load()` (`ModuleService.ts:148-169`) calls `loadProjectContextRepo(projectRoot)` and caches the target list via `projectContextTargets(...)`. On any error it logs a warning, nulls the repo context, and sets `#targets = []` (degrades to empty rather than throwing). Guarded by `#loaded` so it runs once.
- `reload()` (`ModuleService.ts:172-177`) clears the cache and re-runs `load()`. Used by `updateModuleMap()`.
- `#ensureLoaded()` (`ModuleService.ts:180-184`) lazy-loads before every query. Note the HTTP routes **also** call `moduleService.load()` explicitly before each use (e.g. `lib/http/routes/modules.ts:42`).

#### 12.1.3 ProjectContext query surface (delegation)

All structural facts are delegated to `../../project-context/ProjectContextConsumerFacts.js` (imported at `ModuleService.ts:26-33`), which is the host-side consumer facade over ProjectContext:

| Method | Delegates to | Returns |
| --- | --- | --- |
| `listTargets()` (`:191-194`) | cached `projectContextTargets` | copy of `ProjectContextTargetEntry[]` |
| `getTargetFiles(target)` (`:197-225`) | `projectContextFilesForTarget` | file entries for a target |
| `getDependencyGraph(options)` (`:232-245`) | `projectContextDependencyGraph` | `{ nodes, edges }`, node `type` defaulted from `options.level` or `'module'` |
| `getProjectInfo()` (`:248-260`) | `projectContextProjectInfo` | project summary; falls back to a synthetic `{ primaryLanguage:'unknown', ... projectInformationSource:'project-context' }` when repo context is absent |

`getTargetFiles` (`:197-225`) has three resolution branches: (1) a **virtual `folder-scan` target** with an existing `path` collects files directly via `#collectFolderFiles`; (2) a `project-context` discoverer target (or one matched by `name`) goes through `projectContextFilesForTarget`; (3) a fallback for any target carrying an existing `path`.

#### 12.1.4 AI scan pipeline

`scanTarget(target, { onProgress })` (`ModuleService.ts:270-363`) is the core scan flow, emitting progress events to a caller-supplied `onProgress` callback (the Dashboard SSE bridge — see 12.1.7). Steps:

1. Resolve target name; `onProgress({ type:'scan:started' })`.
2. `getTargetFiles(target)` → if empty, return `{ recipes:[], scannedFiles:[], message:'No source files found...' }` (`:282-288`).
3. Emit `scan:files-loaded` with file metadata (`:290-294`).
4. Read file contents with `readFileSync` (`:297-316`); unreadable files are logged and dropped; if all fail, return `{ ... message:'All source files unreadable' }` (`:318-320`).
5. **AI gate** (`:326-335`): compute `aiStatus = this.#aiStatus?.() ?? AI_STATUS_NOT_CONFIGURED`. If no `agentService`, no `systemRunContextFactory`, or `!aiStatus.ready`, short-circuit and return `{ recipes:[], scannedFiles, noAi:true, message:'AI 未配置...' }`.
6. `scan:ai-extracting` → `#aiExtractRecipes(targetName, files)` (`:337-338`).
7. Inject `recipe.moduleName = targetName` into every recipe (`:344-347`).
8. `scan:enriching` → `#enrichRecipes(recipes)` (quality scoring, `:350-351`).
9. Return `{ recipes, scannedFiles }` (+ a "no reusable patterns" message when empty) and emit `scan:completed` (`:353-362`).

`#aiExtractRecipes(targetName, files)` (`ModuleService.ts:644-682`) is the **delegation to the agent runtime**: it calls `runScanAgentTask({ agentService, systemRunContextFactory, label, files:[{name,relativePath,content}], task:'extract' })` (imported from `@alembic/agent/service`, `:16-19`) and returns `result.recipes`. Errors matching `API_KEY_MISSING` / "API Key 未配置" / "unregistered callers" are downgraded to an info log (treated as "AI not enabled"); other errors log a warning. Always returns an array (`[]` on failure).

`#enrichRecipes(recipes)` (`ModuleService.ts:685-705`) is host-side quality enrichment: for each recipe lacking `quality`, calls `this.#qualityScorer.score(recipe)` and writes a `quality` object `{ completeness:0, adaptation:0, documentation:0, overall:score, grade }`. Note the sub-scores are hard-zeroed — only `overall` and `grade` come from the scorer.

#### 12.1.5 Full-project scan

`scanProject(options)` (`ModuleService.ts:366-540`) walks all targets and produces recipes + a Guard audit:

1. `listTargets()`, then collect **deduplicated** source files across all targets (via `getTargetFiles` + `readFileSync`), capped at `MAX_FILES` (`options.maxFiles || 200`, `:383`).
2. If no target yielded files, fall back to `#walkProjectForFiles` directory crawl (`:423-428`).
3. **Batched AI extraction** (`:458-489`): only when `agentService && systemRunContextFactory && scanAiStatus.ready`. Batches of `batchSize` (default 20). Two timeouts guard the loop: a per-batch timeout (`batchTimeout`, default **90 000 ms**) enforced via `Promise.race` against a `setTimeout` reject (`:472-477`), and a total timeout (`totalTimeout`, default **540 000 ms**) checked at the top of each batch (`:462-468`), which sets `timedOut` and breaks (partial result). Batch failures are logged and skipped, not fatal.
4. **Guard audit** (`:492-527`): when `guardCheckEngine` is present, calls `engine.auditFiles(guardFiles, { scope:'project' })`. If `violationsStore` is present, each file with violations is persisted via `store.appendRun({ filePath, violations, summary })`.
5. Returns `{ targets:[names], recipes, guardAudit, scannedFiles, partial:timedOut }` (`:533-539`).

`updateModuleMap()` (`ModuleService.ts:543-556`) simply `reload()`s and reports `{ success, message, targets, edges, projectRoot }` — a cache-refresh operation (replaces the old `updateDependencyMap`).

#### 12.1.6 Folder browsing & manual scan (host-owned filesystem crawl)

These methods are **pure host-layer filesystem logic**, independent of ProjectContext:

- `browseDirectories(basePath='', maxDepth=2)` (`ModuleService.ts:568-585`) → directory picker data for the Dashboard, via `#walkDirsForBrowse` (`:708-760`). Each dir reports `{ name, path, depth, language, sourceFileCount, hasSourceFiles }`. Source-file count uses `#countSourceFilesDeep` (`:763-784`, depth cap 8, hard cap 999 to avoid stalls). Language is a majority vote via `#detectFolderLanguage` (`:835-865`).
- `scanFolder(folderPath, options)` (`ModuleService.ts:594-628`) → resolves to abs path, detects language, builds a **virtual `ModuleTarget`** (`discovererId:'folder-scan'`, `isVirtual:true`) and delegates to `scanTarget`. This is how directories outside discoverer coverage (custom names, new languages) get scanned.
- File collection helpers: `#collectFolderFiles` / `#walkCollectSourceFiles` (`:787-832`, depth cap 15, 500-file cap) and the fallback crawler `#walkProjectForFiles` (`:868-948`, walks known src dirs like `Sources/src/lib/app/...`, skips files >512 KB and <5 lines).

Exclusion and extension sets are module constants: `SCAN_EXCLUDE_DIRS` (`ModuleService.ts:46-71`, includes `node_modules`, `.git`, build dirs, and notably the knowledge-base dir `Alembic`) and `SOURCE_CODE_EXTS` (`:74-97`).

`static normalizeSemanticFields(recipe)` (`ModuleService.ts:631-633`) is currently a passthrough (returns the recipe unchanged) — a retained no-op hook.

#### 12.1.7 External interfaces — HTTP routes (Dashboard SPM backend)

`ModuleService` is exposed through `lib/http/routes/modules.ts`, all resolving the service via `getServiceContainer().get('moduleService')` and calling `moduleService.load()` first. Key routes (method + path, path prefix `/api/v1/modules`):

| Route | Service call |
| --- | --- |
| `GET /targets` (`modules.ts:38`) | `listTargets()` + `getProjectInfo()` |
| `GET /dep-graph` (`modules.ts:59`) | `getDependencyGraph({ level })` |
| `GET /browse-dirs` (`modules.ts:143`) | `browseDirectories(basePath, maxDepth)` |
| `POST /scan-folder` (`modules.ts:169`) | `scanFolder(folderPath, options)` |
| `POST /scan-folder/stream` (`modules.ts:193`) | `scanFolder(..., { onProgress })` over an SSE session |
| `POST /target-files` (`modules.ts:252`) | `getTargetFiles(target)` |
| `POST /scan-target` (`modules.ts:292`) | `scanTarget(target)` |
| `POST /scan-target/stream` (`modules.ts:334`) | `scanTarget(..., { onProgress })` over SSE |
| `GET /scan/events/:sessionId` (`modules.ts:401`) | SSE event stream reader |
| `POST /update-map` (`modules.ts:492`) | `updateModuleMap()` |
| `GET /project-info` (`modules.ts:507`) | `getProjectInfo()` |
| Additional `POST /scan-project` + `bootstrap/*` report/status/cancel routes (`modules.ts:471,541-677`) | bootstrap task manager + project-scan operation ids |

**SSE streaming contract** (`modules.ts:193-247`): the streaming routes create a `createStreamSession('scan')`, immediately respond with `{ sessionId }`, then run the scan in `setImmediate`, forwarding each `onProgress` event through `session.send(evt)`. On completion they emit a `scan:result` event and `session.end()` (which emits `stream:done`); on error `session.error(msg, code)` (emits `stream:error`). The in-code comment (`modules.ts:210-215`) records the AD6 fix that replaced a nonexistent `session.push()` with the documented `send()/end()/error()` contract. The scan `onProgress` event types emitted by `ModuleService` are therefore the SSE payload vocabulary: `scan:started`, `scan:files-loaded`, `scan:reading`, `scan:ai-extracting`, `scan:enriching`, `scan:completed`, plus the route-level `scan:result`.

#### 12.1.8 Other consumers

- **CLI**: `lib/cli/AiScanService.ts:182-188` dynamically imports and constructs `ModuleService` (no AI deps) for command-line scans.
- **Wiki**: `lib/service/wiki/WikiGenerator.ts:85-88,463-482` consumes it through a minimal `WikiModuleService` interface (`load`, `listTargets`, `getDependencyGraph?`, `getProjectInfo`); wired in via `lib/workflows/completion/CompletionSteps.ts:35-45`.

#### 12.1.9 Boundary note (ModuleService)

- **Host-owned here:** the scan orchestration state machine (`scanTarget`/`scanProject`/`scanFolder`), batching + dual-timeout control, filesystem crawling / directory browsing / language majority vote, quality-enrichment shaping, Guard-violation persistence wiring, and all HTTP/SSE exposure.
- **Delegated to `@alembic/core`:** every structural fact — targets, target files, dependency graph, project info — comes from `ProjectContextConsumerFacts` (`inferLang` is `@alembic/core/host-agent-workflows`; `Logger` is `@alembic/core/logging`). ProjectContext itself and the discoverer model are Core-owned.
- **Delegated to `@alembic/agent`:** AI Recipe extraction. `#aiExtractRecipes` is a thin adapter over `runScanAgentTask` from `@alembic/agent/service`; the LLM analysis, AST tooling, and Recipe-JSON production happen in the agent runtime, not here.
- **Injected opaque engines:** `qualityScorer`, `recipeExtractor`, `guardCheckEngine`, `violationsStore` are passed in as `Record<string, unknown>` — the service knows only their call shapes, not their implementations.

---

### 12.2 Skills services

Two cooperating pieces under `lib/service/skills/`:

1. **`SkillFileService.ts`** — CRUD + discovery for `SKILL.md` files (the "skill file" backend). Despite the filename, it exports **free functions** (`listSkills`, `loadSkill`, `createSkill`, `updateSkill`, `deleteSkill`), not a class. The module docstring (`SkillFileService.ts:1-11`) calls these the "Alembic Resident Tool Handlers — Skills 加载与发现".
2. **`SkillHooks.ts`** (+ `types.ts`) — a Tapable-inspired lifecycle-hook engine that loads `hooks.js` from each skill directory and fires named hooks across the knowledge / Guard / skill / search / bootstrap lifecycle.

#### 12.2.1 Skill directories & sources

Two skill locations, resolved dynamically:

- **Built-in / package skills**: `PACKAGE_SKILLS_DIR` (imported from `../../shared/package-assets.js`, `SkillFileService.ts:19`) — the package's own `skills/` directory (source `alembic-create`, `alembic-guard`, `alembic-recipes`, `alembic-structure`, `alembic-devdocs`; see `SKILL_USE_CASES` at `:75-81`).
- **Project-level skills**: resolved at runtime via `_getProjectSkillsDir(ctx)` = `getProjectSkillsPath(resolveDataRoot(ctx?.container))` (`SkillFileService.ts:31-33`, both from `@alembic/core/config` / `@alembic/core/workspace`). Standard mode: `{projectRoot}/Alembic/skills/`; Ghost mode: `~/.asd/workspaces/<id>/Alembic/skills/` (`:26-30`).

**Override rule:** project-level skills override same-named built-ins in listing (`listSkills`, `:120-130`) and take priority in loading (`loadSkill`, `:178-182`). Built-in skills are **protected** — they cannot be overwritten by `createSkill` (`BUILTIN_CONFLICT`, `:340-345`), updated by `updateSkill` (`BUILTIN_PROTECTED`, `:601-607`), or deleted by `deleteSkill` (`BUILTIN_PROTECTED`, `:485-494`).

#### 12.2.2 SkillFileService exported handlers

Every handler returns a **JSON string envelope** `{ success, data }` or `{ success, error:{ code, message } }`.

| Function (`file:line`) | Args | Behavior |
| --- | --- | --- |
| `listSkills(ctx?)` (`:92`) | — | Enumerates built-in then project dirs into a `Map` (project overrides), sorts by name, returns `{ skills, total, hint }`. Each entry: `{ name, source, summary, createdBy, createdAt, useCase }`. |
| `loadSkill(ctx, {skillName, section?})` (`:167`) | skill name, optional section | Reads `SKILL.md` (project first, else built-in). Optional `section` filter via a generated regex that slices a `## <section>` block (`:188-197`). Fires `onSkillLoad` hook. On miss returns `SKILL_NOT_FOUND` + `availableSkills`. |
| `createSkill(ctx, args)` (`:406`) | `{name, description, content, overwrite?, createdBy?, title?}` | Validates kebab-case name (`/^[a-z][a-z0-9-]*[a-z0-9]$/`, 3–64 chars, `:322-327`), rejects built-in name conflict, writes `SKILL.md` with generated frontmatter, fires `onSkillCreated`. |
| `updateSkill(ctx, args)` (`:691`) | `{name, description?, content?}` | Rejects built-ins; requires the project skill to exist; merges description/content while preserving `createdBy/createdAt/title`, adds `updatedAt`. |
| `deleteSkill(ctx, {name})` (`:474`) | name | Rejects built-ins; removes the whole `skills/<name>/` dir; fires `onSkillExpired` with `reason:'deleted'`. |

**Metadata parsing.** `_parseSkillMeta` (`:41-72`) reads YAML-ish frontmatter with regexes for `description` / `createdBy` / `createdAt`; description is truncated to its first sentence or 120 chars (`:55-57`). `updateSkill` uses `_parseExistingSkillDocument` (`:620-623`) + `_frontmatterField` (`:625-628`) to split and preserve frontmatter.

**Static relation maps** (host-hardcoded, not data-driven): `SKILL_USE_CASES` (`:75-81`) and `_getRelatedSkills` (`:727-736`) provide `useCase` labels and `relatedSkills` cross-links returned to callers.

#### 12.2.3 Write-safety: WriteZone vs pathGuard

Writes go through one of two paths (`_writeCreatedProjectSkill` `:379-404`; `_writeUpdatedProjectSkill` `:668-689`; delete `:510-518`):

- If a `WriteZone` singleton is present (`_getWriteZone`, `:22-24`, from `ctx.container.singletons.writeZone`, type from `@alembic/core/io`), the path is rebased under `wz.dataRoot` and written via `wz.ensureDir` / `wz.writeFile` / `wz.remove` — the sandboxed write API.
- Otherwise, it falls back to `pathGuard.assertProjectWriteSafe(...)` (from `@alembic/core/io`, `:17`) + raw `fs.mkdirSync` / `fs.writeFileSync` / `fs.rmSync`.

Both the WriteZone and pathGuard are **Core-provided safety primitives**; the host wiring here chooses between them.

**Editor-index no-op.** `_regenerateEditorIndex` (`:453-460`) is now a deliberate no-op returning `{ generated:false, reason:'Alembic main package no longer writes project editor delivery indexes.' }`. Skill CRUD no longer maintains an editor delivery index in this repo — runtime consumers are directed (via hint strings, e.g. `:445`, `:721`) to rely on `ProjectSkillDeliveryReceipt` instead (see 12.2.6).

#### 12.2.4 SkillHooks — lifecycle hook engine

`SkillHooks` (`lib/service/skills/SkillHooks.ts:104`) loads `hooks.js` from every skill dir and dispatches named lifecycle hooks. Type contracts live in `types.ts`.

**Hook registry** (`SkillHooks.ts:29-56`) — the declared hooks and their execution modes:

| Hook | Mode | Meaning |
| --- | --- | --- |
| `onKnowledgeSubmit` | bail | Intercept before knowledge submit |
| `onKnowledgeCreated` / `onKnowledgeUpdated` / `onKnowledgeExpired` | parallel | Post-change notifications |
| `onGuardCheck` | waterfall | May transform violation results |
| `onGuardViolation` | parallel | Post-violation notification |
| `onSkillLoad` | series | Fired when a skill is loaded |
| `onSkillCreated` / `onSkillExpired` | parallel | Skill create / delete-expire |
| `onSearch` | waterfall | Post-process search results (re-rank) |
| `onSearchMiss` | parallel | On empty search |
| `onBootstrapStart` | series | Before cold start |
| `onBootstrapComplete` | parallel | After cold start |
| `onCandidateSubmit` (compat) | bail | Alias of `onKnowledgeSubmit` |
| `onRecipeCreated` (compat) | parallel | Legacy Recipe-created notification |

**Execution modes** (`types.ts:6-14`; implementations `SkillHooks.ts:229-328`):

- **bail** (`#runBail`, `:229-256`): serial; first handler returning an object with truthy `block` short-circuits and returns it. This is the gate mechanism (e.g. `onKnowledgeSubmit` can block a submit). Unknown hooks default to bail (`:187`).
- **waterfall** (`#runWaterfall`, `:259-283`): serial; each non-null/undefined return replaces `args[0]` for the next handler (used to progressively rewrite search results / Guard violations).
- **parallel** (`#runParallel`, `:286-309`): `Promise.allSettled` fire-and-forget; rejections logged, never thrown; returns `undefined`.
- **series** (`#runSeries`, `:312-328`): serial, return values ignored.

Every handler invocation is wrapped in `withTimeout` (`SkillHooks.ts:79-98`; default `DEFAULT_HANDLER_TIMEOUT = 10_000` ms, `:65`) and errors are caught + logged, never propagated (except bail's `block` return). Handlers carry `priority` (default `100`, `:67`) and are sorted ascending after load and after each `tap` (`:134-136`, `:168`).

**Public API:** `load(container?)` (`:119-142`), `tap(hookName, handler, options?)` for code-level registration (`:145-169`), `run(hookName, ...args)` (`:180-201`), `has` / `count` / `getRegisteredHooks` (`:204-219`), and `static getHookRegistry()` (`:222-224`, for Dashboard/debug).

**Module loading & format compat** (`#loadFromDir` `:397-422`; `#registerModule` `:341-372`): scans `PACKAGE_SKILLS_DIR` first, then the project skills dir (same-named override), dynamically `import()`s each `hooks.js`. Supports both the **v2 format** (`export default { hooks: { onXxx: { handler, priority, timeout } } }` or `{ hooks:{ onXxx: fn } }`) and the **v1 legacy format** (top-level `export function onXxx(...)`). Unknown hook names in a module are warned and skipped (`:346-348`).

`SkillHooks` is instantiated and loaded at bootstrap: `lib/Bootstrap.ts:187-189` (`new SkillHooks(); await skillHooks.load()`), stored on the DI container as `skillHooks` (`lib/injection/ServiceMap.ts:161`) so `SkillFileService` can fetch it via `ctx.container.get('skillHooks')`.

#### 12.2.5 External interfaces — HTTP routes (Skills backend)

`lib/http/routes/skills.ts` imports the five handlers directly (`skills.ts:9-14`) and wraps them (note it passes `ctx = null`, so these HTTP calls resolve skill dirs against the default data root, **not** a request-scoped container):

| Route | Handler |
| --- | --- |
| `GET /` (`skills.ts:23`) | `listSkills()` |
| `GET /:name` (`skills.ts:47`) | `loadSkill(null, { skillName, section })` |
| `POST /` (`skills.ts:78`, `validate(CreateSkillBody)`) | `createSkill(null, ...)` |
| `PUT /:name` (`skills.ts:117`) | `updateSkill(null, { name, description, content })` |
| `DELETE /:name` (`skills.ts:153`) | `deleteSkill(null, { name })` |

Each route re-parses the returned JSON string and re-wraps parse failures as `PARSE_ERROR`.

The same functions are also exposed as **MCP resident tool handlers** (the module docstring frames them for the "resident tool consumer") and are consumed by the skill-delivery workflow (below), which is how project skills reach IDE delivery channels.

#### 12.2.6 Feeding IDE delivery channels

The skill-file backend is the write end of the "channel-C/D" skill delivery. `lib/workflows/skill-delivery/SkillCompletionCapability.ts` builds a project skill and produces a **`ProjectSkillDeliveryReceipt`** (`SkillCompletionCapability.ts:5-9,188-243`, types + `create/validate/summarize` helpers from `@alembic/core`) after writing the `SKILL.md`. `createSkill`'s success hint (`SkillFileService.ts:445`) explicitly redirects runtime consumers away from the load operation toward that receipt. Cross-repo skill delivery ordering flows through `SkillHooks` bootstrap/knowledge hooks and the workflow layer (`KnowledgeRescanWorkflow`, `ColdStartWorkflow` both appear as `SkillHooks`/skills consumers). This file (`SkillFileService.ts`) owns only the `SKILL.md` file contents and frontmatter; the delivery-receipt schema and validation are Core-owned.

#### 12.2.7 Boundary note (Skills)

- **Host-owned here:** `SKILL.md` file CRUD, frontmatter generation/parsing, kebab-case validation, built-in-vs-project override + protection rules, the WriteZone/pathGuard write dispatch, and the entire `SkillHooks` engine (registry, four execution modes, timeout wrapping, priority sort, v1/v2 loader). HTTP route exposure.
- **Delegated to `@alembic/core`:** skill-dir path resolution (`getProjectSkillsPath`, `resolveDataRoot`), the `WriteZone` / `pathGuard` write-safety primitives (`@alembic/core/io`), `Logger`, and the `ProjectSkillDeliveryReceipt` create/validate/summarize schema used by the delivery workflow. The actual hook *behaviors* live in each skill's own `hooks.js` (project- or package-supplied), not in this engine.

---

### 12.3 Vector services

Two host-side helpers around embedding/vector generation. Neither implements the vector store or the embedding model — both delegate to Core vector abstractions and/or provider adapters.

#### 12.3.1 ContextualEnricher — per-chunk context prefixes

`ContextualEnricher` (`lib/service/vector/ContextualEnricher.ts:47`) implements Core's `VectorChunkEnricher` interface (`import type { VectorChunkData, VectorChunkEnricher, VectorDocumentInfo } from '@alembic/core/vector'`, `:19-23`). It is a straight implementation of Anthropic's Contextual Retrieval technique (docstring `:1-16`): for each chunk it prepends a 1–2 sentence, LLM-generated context describing where the chunk sits in its document, so the embedding retains document-level semantics (docstring cites a 35–67% retrieval-failure reduction).

**Construction** (`:53-57`): `new ContextualEnricher({ aiProvider, cacheEnabled? })`. `aiProvider` is an `AiProviderLike` (`:27-33`) — an object with `name?` and `chat(prompt, { system?, maxTokens?, temperature? })`.

**`enrichChunks(document, chunks)`** (`:69-122`), the interface method:

1. Empty chunk list → `[]` (`:70-72`).
2. **Mock-provider bypass** (`:74-76`): if `aiProvider.name === 'mock'`, returns chunks unchanged — fake providers must not participate in production vector enrichment.
3. Build a `systemPrompt` once per document via `#buildSystemPrompt` (`:136-153`), which wraps the document (truncated to `maxDocLen = 8000` chars, `:138-142`, XML-escaped title via `#escapeXml` `:189-195`) and asks for 1–2 context sentences.
4. Per chunk: check the in-memory cache (`#cache: Map<string,string>`), else call `#generateContext` (`:155-176`) which does `aiProvider.chat(userPrompt, { system, maxTokens:120, temperature:0 })`, strips surrounding quotes, and hard-caps at 500 chars. Cache key is a cheap non-crypto string hash of `sourcePath::content[:200]` (`#computeCacheKey`, `:178-187`).
5. On success, push `{ content: '[<context>]\n\n<chunk.content>', metadata:{ ...chunk.metadata, contextEnriched:true, contextLength } }` (`:100-108`); on empty context, push the original chunk; on a per-chunk error, **log and keep the original chunk** (failures never abort the batch, `:112-118`).

Cache controls: `clearCache()` (`:125-127`), `cacheSize` getter (`:130-132`), `cacheEnabled` defaults on unless explicitly `false` (`:55`).

**Wiring** (`lib/injection/modules/VectorModule.ts:17-94`): registered lazily as container service `contextualEnricher`, but only when an `aiProvider` singleton exists (else `null`, `:21-24`). During async init (`VectorModule.ts:80-94`) it is injected into the `IndexingPipeline` via `pipeline.setContextualEnricher(enricher)` — **but only if `config.contextualEnrich` is true** (`:86`). This matches the docstring's "配置开关: contextualEnrich = false 时完全跳过" (`ContextualEnricher.ts:14`). So the enricher runs inside Core's indexing pipeline, gated by config and provider readiness.

#### 12.3.2 RecipeRegionFixtureGeneration — driving & proving Recipe-region vectors

`RecipeRegionFixtureGeneration.ts` orchestrates generation of **Recipe semantic-region vector chunks** from active Recipes in SQLite, and produces a verifiable proof of coverage. It is the driver behind real-machine "did the vector fixture actually get generated" verification. All the region-generation *engine* types come from `@alembic/core/vector` (`:1-13`): `RECIPE_REGION_VECTOR_ID_PREFIX`, `RECIPE_SEMANTIC_REGION_CLASSES`, `RECIPE_SEMANTIC_REGION_METADATA_TYPE`, `RecipeRegionSourceEntry`, sync/test options + report/result types, `RecipeSourceRefsBridge`, etc.

**Two collaborator interfaces the host injects** (`:23-38`):

- `RecipeRegionFixtureVectorService` — `testRecipeSemanticRegionGeneration(entries, opts)` (bounded dry-run) and `syncRecipeSemanticRegions(entries, opts)` (full generation). These are Core-implemented; this file only calls them.
- `RecipeRegionFixtureProofStore` — `getStats()`, `listIds()`, `searchByFilter(filter)` — a read view over the actual vector index (the vector store), also Core/infra-provided.

**Data source (host DB access).** `loadActiveRecipeRegionEntries(database)` (`:84-98`) reads active Recipes from SQLite via `../../infrastructure/database/SqliteDatabaseAccess.js`:

- `unwrapSqliteDatabase` / `requireSqliteDatabase` (`:195-201`) normalize the DB handle.
- `readKnowledgeEntryColumns(db)` → `PRAGMA table_info(knowledge_entries)` (`SqliteDatabaseAccess.ts:103-105`); the returned column set drives `recipeRegionProjection` (`:203-231`), which projects a fixed list of Recipe columns and substitutes `NULL AS <col>` for any missing column (schema-tolerant).
- `readActiveRecipeRegionRows(db, projection)` → `SELECT ... FROM knowledge_entries WHERE lower(COALESCE(lifecycle,''))='active' ORDER BY id` (`SqliteDatabaseAccess.ts:107-119`). Rows are mapped to `RecipeRegionSourceEntry` via `recipeRegionSourceEntryFromRow` (`:233-259`) with `compactString` / `parseStringList` / `parseJsonOrText` normalizers (`:427-470`).
- `readSourceRefsBridgeByRecipeId(db, ids)` (`:261-290`) reads the `recipe_source_refs` table (`readRecipeSourceRefRows`, `SqliteDatabaseAccess.ts:121-138`, guarded by `sqliteTableExists`) and groups per-recipe source paths into a `RecipeSourceRefsBridge` whose status is `active` (all active), `partial`, or `missing` (`sourceRefsBridgeStatusFor`, `:407-412`).

**Main flow** — `runRecipeRegionFixtureGeneration(options)` (`:100-193`):

1. Load active entries + source-ref bridge; snapshot an initial proof (`collectRecipeRegionVectorIndexProof`, `:105-108`).
2. **No active recipes** → status `blocked`, blockers `['active-recipe-rows-missing']` (`:110-120`).
3. **Bounded dry-run** on the first `boundedSampleSize` entries (default 3, min 1, `:104`) via `vectorService.testRecipeSemanticRegionGeneration(..., { maxRegionChars, removeStale:true, sourceRefsBridgeByRecipeId })` (`:122-134`). If the report's `safeForFullFixtureGeneration` is false → status `blocked` with `bounded-generation-test-not-safe-for-full-fixture` + report errors (`:136-150`).
4. **Full sync** via `vectorService.syncRecipeSemanticRegions(allEntries, ...)` (`:152-157`), then re-collect proof against the generated metadata recipe ids (`:158-164`).
5. Compute completion blockers (`fixtureCompletionBlockers`, `:360-394`) — status is `completed` iff none, else `blocked` (`:167`). A thrown error → status `failed` with `full-generation-threw:<msg>` (`:178-192`).

**Proof collection** (`collectRecipeRegionVectorIndexProof`, `:292-358`): if no `proofStore`, returns a minimal synthetic proof derived from generated-metadata ids. With a proof store, it queries `listIds()`, `searchByFilter({ type: RECIPE_SEMANTIC_REGION_METADATA_TYPE, deprecated:false })`, and `getStats()` in parallel, then computes: `totalVectorIds`, `legacyEntryCount` (ids starting `entry_`), `recipeRegionItemCount` (ids starting `RECIPE_REGION_VECTOR_ID_PREFIX`), a `regionClassDistribution` over `RECIPE_SEMANTIC_REGION_CLASSES`, `distinctRecipeIdsCovered`, `missingRecipeIds` (active ids not covered), and `legacyEntryOnly` (legacy present but zero region items). The completion blockers assert full-sync `status==='completed'`, no errors, `generated>0`, `embedded===generated`, `upserted===generated`, region-item/metadata presence, full recipe-id coverage, and not legacy-only (`:360-394`).

**Consumers.** Grep shows no in-repo caller of `runRecipeRegionFixtureGeneration` besides the file itself; it is an exported driver invoked from verification/real-machine harnesses and tests (the file exports `loadActiveRecipeRegionEntries` and `runRecipeRegionFixtureGeneration` for external orchestration). Treat "who invokes it in production" as **unverified from this repo's source** — it is structured as a standalone verifiable capability rather than a wired-in service.

#### 12.3.3 Boundary note (Vector)

- **Host-owned here:** the enrichment *policy* (Anthropic contextual-retrieval prompt shaping, truncation, quote-stripping, in-memory caching, mock-provider bypass, per-chunk failure isolation) and the fixture-generation *orchestration + proof/blocker logic* (SQLite read of active Recipes and source-refs, bounded-then-full drive sequence, coverage proof math). SQLite access helpers (`SqliteDatabaseAccess.ts`) are host infrastructure.
- **Delegated to `@alembic/core`:** the `VectorChunkEnricher` contract + `VectorChunkData/VectorDocumentInfo` types, the `IndexingPipeline` that actually consumes the enricher, and all Recipe-semantic-region generation engine (`testRecipeSemanticRegionGeneration` / `syncRecipeSemanticRegions`, the region-class taxonomy, id prefixes, metadata type, and the `RecipeRegionSourceEntry` / bridge / report types). The vector index/store queried by the proof store is Core/infra-owned.
- **Provider dependency:** `ContextualEnricher` calls an `aiProvider.chat(...)` — the provider adapter is host-orchestrated (see the AI-provider layer), and enrichment is disabled unless a real (non-mock) provider is ready and `config.contextualEnrich` is on.

---

### 12.4 Cross-cutting summary

| Service | Reads from | Delegates engine to | Writes / emits |
| --- | --- | --- | --- |
| `ModuleService` | ProjectContext facts (`@alembic/core`), filesystem | `@alembic/agent` (scan extract), injected `qualityScorer`/`guardCheckEngine` | HTTP JSON + SSE scan events (Dashboard SPM) |
| `SkillFileService` | `SKILL.md` files (package + project dirs) | `@alembic/core/io` write-safety, `SkillHooks` | `SKILL.md` files; feeds `ProjectSkillDeliveryReceipt` (channel delivery) |
| `SkillHooks` | `hooks.js` per skill dir | each skill's own hook code | fires lifecycle hooks (knowledge/Guard/skill/search/bootstrap) |
| `ContextualEnricher` | doc + chunks + `aiProvider` | Core `IndexingPipeline` (consumer) | context-prefixed chunks (into vector index) |
| `RecipeRegionFixtureGeneration` | `knowledge_entries` + `recipe_source_refs` (SQLite) | Core region vector service + proof store | region vector chunks + coverage proof/blockers |

**Uncertainties explicitly flagged:** (1) the production caller of `runRecipeRegionFixtureGeneration` is not present in `lib/`/`bin/` and could not be confirmed from source; (2) `ModuleService`'s injected `recipeExtractor` is stored but not directly used within `ModuleService.ts` (extraction goes through the agent service), so its role here is holding-only.


---


## 13. Services — Wiki Generation

The Wiki-generation subsystem is a **host-owned service** that turns a project's
raw source tree plus Alembic's distilled knowledge into a small, browsable
Markdown "Repo Wiki". It is a data-consumer of the organism engine (it reads
`ProjectContext`-backed module facts and active Recipes) but the wiki *authoring*
logic — scanning, folder profiling, topic discovery, AI prompting, Markdown
rendering, dedup, meta bookkeeping — is implemented entirely in this repository
under `lib/service/wiki/`. Nothing in this subsystem is delegated to
`@alembic/agent`; the only `@alembic/core` dependencies are shared utilities
(`LanguageService`, `Logger`, `WriteZone`, workspace path constants) and the two
injected host services (`moduleService`, `knowledgeService`) whose *interfaces*
are declared here as minimal duck-typed shapes.

The design is described in the file header as **"V3 Content-First"**
(`lib/service/wiki/WikiGenerator.ts:8`): rather than emit a fixed page list, it
collects data, measures data richness per candidate topic, dynamically decides
which articles are worth writing, and prefers writing whole articles with an AI
provider — falling back to rich templates when AI is absent or too slow.

### 13.1 Files and responsibilities

| File | Role |
|------|------|
| `lib/service/wiki/WikiGenerator.ts` | Orchestrator class `WikiGenerator` + phase state machine. Owns scan → AST-stub → module parse → knowledge integration → topic discovery → AI/template composition → external-doc sync → dedup → meta finalize. |
| `lib/service/wiki/WikiRenderers.ts` | Stateless pure functions: AI prompt builders (`buildAiSystemPrompt`, `buildArticlePrompt`), the fallback dispatcher (`buildFallbackArticle`), and one Markdown renderer per page type. 1917 lines — the bulk of the subsystem. |
| `lib/service/wiki/WikiUtils.ts` | Stateless helpers with no class dependency: `slug`, `mermaidId`, `walkDir`, module inference, `getModuleSourceFiles`, `inferModulePurpose`, `dedup` (two-layer dedup), `getLangTerms`, `detectBuildSystems`, and the folder-profiling engine (`profileFolders` + private builders). |
| `lib/service/wiki/WikiTypes.ts` | Shared type declarations extracted from `WikiRenderers` (`WikiData`, `WikiProjectInfo`, `WikiAstInfo`, `WikiModuleInfo`, `WikiKnowledgeInfo`, `WikiFolderProfile`, `WikiTopic`, `WikiRecipe`, etc.). Pure types, no runtime. |

Note a slight type duplication: `WikiTypes.ts:106` defines a `WikiTopic` used by
the renderers, while `WikiGenerator.ts:118` declares its own local `WikiTopic`
interface for the orchestrator. They overlap but are not the same declaration.

### 13.2 Key classes, functions, and types

#### Orchestrator — `WikiGenerator`

- Class declared at `lib/service/wiki/WikiGenerator.ts:185`.
- Constructor `lib/service/wiki/WikiGenerator.ts:200` takes a single `WikiDeps`
  object (`WikiGenerator.ts:71`):
  - `projectRoot` — the directory that is **scanned** for source files.
  - `dataRoot` (optional) — the directory the wiki is **written under**; defaults
    to `projectRoot` (`WikiGenerator.ts:202`). This split supports "Ghost mode",
    where scanning happens in the user project but output is externalized.
  - `moduleService`, `knowledgeService`, `aiProvider` — optional injected host
    services (each may be `null`; the generator degrades gracefully).
  - `onProgress(phase, progress, message)` — progress callback (default no-op).
  - `options: Partial<WikiOptions>` merged over `DEFAULTS` (`WikiGenerator.ts:207`).
  - `writeZone` (`WriteZone | null`) — optional `@alembic/core/io` write zone;
    when present, all writes/removes/mkdirs are routed through it instead of raw
    `fs` (`WikiGenerator.ts:195`, `_writeFile` at `:998`, `_ensureDir` at `:989`).
- `wikiDir` is computed as `path.join(dataRoot, options.wikiDir)`
  (`WikiGenerator.ts:210`); `metaPath = wikiDir/meta.json` (`:211`).

Public API:

| Method | Anchor | Behavior |
|--------|--------|----------|
| `generate()` | `WikiGenerator.ts:219` | Full generation; runs all 10 phases, returns a result summary object. |
| `update()` | `WikiGenerator.ts:313` | Incremental: reads `meta.json`; if missing, full-generate; else compare `sourceHash`; if unchanged, return `{ upToDate: true }`; otherwise full-generate. |
| `abort()` | `WikiGenerator.ts:331` | Sets `_aborted = true`; checked between phases. |
| `getStatus()` | `WikiGenerator.ts:336` | Reads `meta.json`; returns `{ exists, generatedAt, filesCount, version, hasChanges }`. |

#### Phase enum — `WikiPhase`

Frozen object at `lib/service/wiki/WikiGenerator.ts:159`:

| Const | Value | Meaning |
|-------|-------|---------|
| `INIT` | `init` | Ensure `wikiDir` exists |
| `SCAN` | `scan` | `_scanProject()` — enumerate source files, languages, build systems, per-module grouping |
| `AST_ANALYZE` | `ast-analyze` | `_analyzeAST()` — **stub**, returns empty entity sets |
| `SPM_PARSE` | `spm-parse` | `_parseModules()` — call injected `moduleService` |
| `KNOWLEDGE` | `knowledge` | `_integrateKnowledge()` — list active Recipes |
| `GENERATE` | `generate` | `_discoverTopics()` — content-driven topic discovery |
| `AI_COMPOSE` | `ai-compose` | `_composeArticles()` — AI-first or template writing |
| `SYNC_DOCS` | `sync-docs` | `_syncExternalDocs()` — generate the `documents/` index only |
| `DEDUP` | `dedup` | `dedup()` two-layer dedup |
| `FINALIZE` | `finalize` | `_writeMeta()` |

Defaults (`WikiGenerator.ts:174`): `wikiDir = "<DEFAULT_KNOWLEDGE_BASE_DIR>/wiki"`
(the KB dir name resolves to `"Alembic"` in core, so output is
`<dataRoot>/Alembic/wiki/`), `language = 'zh'`, `maxFiles = 500`,
`includeRecipes/includeDepGraph/includeComponents = true`.

#### Injected-service interfaces (host boundary contracts)

Declared minimally so any conforming host service can be plugged in:

- `WikiModuleService` (`WikiGenerator.ts:85`): `load()`, `listTargets()`,
  optional `getDependencyGraph(opts)`, `getProjectInfo()`.
- `WikiKnowledgeService` (`WikiGenerator.ts:103`): `list(filter)`, optional
  `getStats()`.
- `WikiAiProvider` (`WikiGenerator.ts:113`): `chat(prompt, options): Promise<string>`.

#### Renderer/prompt functions — `WikiRenderers.ts`

- `buildAiSystemPrompt(isZh)` — `lib/service/wiki/WikiRenderers.ts:1879`. Returns
  the system prompt instructing the model to write full articles (not polish
  skeletons), never fabricate names/numbers, use Mermaid/tables, 300–2000 words,
  emit a back-link.
- `buildArticlePrompt(topic, data, isZh)` — `WikiRenderers.ts:50`. A big
  `switch (topic.type)` that assembles a per-topic user prompt from the collected
  data (project context header + type-specific sections).
- `buildFallbackArticle(topic, data, isZh)` — `WikiRenderers.ts:507`. Dispatcher
  from `topic.type` to the matching `render*` function; returns `''` for unknown
  types (`:551`).
- One renderer per page type (see §13.3 for the enumeration).

#### Utilities — `WikiUtils.ts`

Notable exports: `slug` (`:20`), `mermaidId` (`:25`), `walkDir` (`:30`, excludes
build/vendor/test dirs and the KB dir), `inferModuleFromPath` (`:94`, multi-language
module-name inference), `getModuleSourceFiles` (`:161`), `inferModulePurpose`
(`:199`, regex rules mapping module/class names to a zh/en purpose blurb), `dedup`
(`:294`), `getLangTerms` (`:399`, per-language "class/interface/module" wording),
`detectBuildSystems` (`:486`, root + one-level monorepo build-marker detection),
and `profileFolders` (`:583`) with private helpers `_pruneRedundantFolders`
(`:668`), `_buildFolderProfile` (`:712`), `_detectNamingPatterns` (`:814`),
`_extractImports` (`:868`), `_extractHeaderComment` (`:980`).

### 13.3 Enumerated wiki page/section types

Topic discovery (`_discoverTopics`, `WikiGenerator.ts:521`) and rendering
(`buildFallbackArticle`/`buildArticlePrompt`) share a set of `topic.type`
discriminators. Each maps to an output path and a renderer:

| `topic.type` | Output path | Trigger condition (discovery) | Fallback renderer |
|--------------|-------------|--------------------------------|-------------------|
| `overview` | `index.md` | Always generated, priority 100 (`WikiGenerator.ts:536`) | `renderIndex` (`WikiRenderers.ts:558`) |
| `architecture` | `architecture.md` | ≥2 module targets, ≥2 AST module keys, ≥2 inferred source-module keys, or a dep graph exists (`:547`,`:551`) | `renderArchitecture` (`:749`) |
| `getting-started` | `getting-started.md` | AST entry points present, or any build system detected (`:562`,`:573`) | `renderGettingStarted` (`:1132`) |
| `module` | `modules/{slug}.md` | Per module target/inferred module with richness score ≥3 (`:594`,`:611`,`:640`) | `renderModule` (`:864`) |
| `patterns` | `patterns.md` | Recipes exist and (≤3 categories OR <15 recipes) → single merged doc (`:677`) | `renderPatterns` (`:1055`) |
| `pattern-category` | `patterns/{slug}.md` | Recipes exist and >3 categories AND ≥15 recipes → one doc per category with ≥2 items (`:686`) | `renderPatternCategory` (`:1444`) |
| `reference` | `protocols.md` | `astInfo.protocols.length >= 8` (`:705`) | `renderProtocolReference` (`:1497`) |
| `folder-overview` | `folder-structure.md` | Folder-profiling enabled and profiles found (`:749`) | `renderFolderOverview` (`:1561`) |
| `folder-profile` | `folders/{slug}.md` | Per folder with `fileCount ≥ 5` and richness ≥10, capped at 10 docs (`:762`–`:793`) | `renderFolderProfile` (`:1699`) |
| (sync) `documents/_index.md` | `documents/_index.md` | Only written if any `documents/`-prefixed file exists (`:963`) | inline in `_generateSyncIndex` (`:960`) |

The AST-driven page types (`architecture` top-level modules, `module` class/protocol
lists, `reference`) depend on `astInfo` fields that are currently **empty** because
`_analyzeAST()` is a stub (see §13.6). In practice the wiki content comes from the
`moduleService` targets, `sourceFilesByModule`, folder profiling, and Recipes.

### 13.4 Control flow — `generate()`

Step list (`WikiGenerator.ts:219`–`:310`), each step preceded by `_emit(phase,…)`
and gated by `if (this._aborted) return this._abortedResult()`:

1. **INIT** (`:225`) — `_ensureDir(wikiDir)`.
2. **SCAN** (`:229`) — `_scanProject()` (`:353`): `fs.readdirSync` the root;
   `detectBuildSystems`; set legacy iOS flags (`hasPackageSwift`/`hasPodfile`/
   `hasXcodeproj`, `:378`); `walkDir` the tree counting source files by language
   (`:395`, capped at `maxFiles`); group files by module — SPM convention
   `Sources/{Module}/…` else `inferModuleFromPath` (`:408`); compute a language
   profile via `LanguageService.detectProfile` and set `primaryLanguage` (`:437`).
3. **AST_ANALYZE** (`:236`) — `_analyzeAST()` returns empty `classes`, `protocols`,
   `classNamesByModule`, `protocolNamesByModule` (`:449`). Stub.
4. **SPM_PARSE** (`:243`) — `_parseModules()` (`:462`): if no `moduleService`,
   `{ targets: [], depGraph: null }`; else `await moduleService.load()`,
   `listTargets()`, optionally `getDependencyGraph({ level: 'target' })` (`:473`),
   and `getProjectInfo()`. Errors are caught and downgraded to empty targets
   (`:481`).
5. **KNOWLEDGE** (`:250`) — `_integrateKnowledge()` (`:488`): if no
   `knowledgeService` or `includeRecipes=false`, return empty; else
   `list({ lifecycle: 'active', limit: 200, offset: 0 })` and optional `getStats()`.
   Result is normalized from `.data`/`.items`/array (`:499`).
6. **GENERATE** (`:257`) — build `structuredData: WikiData` (`:258`) then
   `_discoverTopics(...)` (`:264`). See §13.5.
7. **AI_COMPOSE** (`:270`) — `_composeArticles(topics, structuredData)` (`:830`).
   See §13.5.
8. **SYNC_DOCS** (`:277`) — `_syncExternalDocs()` (`:947`): the main package no
   longer reads editor-delivered docs (`:945` comment), so this only calls
   `_generateSyncIndex` and returns whatever synced files exist (effectively none
   under the main package — the `documents/_index.md` is written only if
   `documents/`-prefixed files are already present). Its result is pushed onto
   `files`.
9. **DEDUP** (`:285`) — `dedup(files, wikiDir, _emit, writeZone)` (`WikiUtils.ts:294`).
10. **FINALIZE** (`:289`) — `_writeMeta(files, startTime, dedupResult)` (`:1012`),
    then final `_emit(FINALIZE, 100, …)`.

Return value on success (`:295`): `{ success, filesGenerated, aiComposed,
syncedDocs, dedup, duration, wikiDir, meta }`. The whole body is wrapped in
try/catch; on failure it logs, emits `('error', -1, …)`, and returns
`{ success: false, error, duration }` (`:305`).

### 13.5 Data-flow — topic discovery and composition

**`_discoverTopics()` (`WikiGenerator.ts:521`)** — richness-driven planning:

- Overview is always pushed first (`:536`).
- Multi-module / dep-graph → architecture (`:551`).
- Entry points / build system → getting-started (`:573`).
- Module docs: chooses between `moduleService` targets and *inferred* modules
  from `sourceFilesByModule`. It uses inferred modules only when there are ≥2
  source-module keys AND (no targets OR a `generic`-only discoverer on a single
  monolith target) — `shouldUseInferredModules` (`:590`). Each candidate gets a
  **richness score** `files + classes*2 + protocols*2 + deps`; scores <3 are
  skipped (`:608`,`:611`). Priority = `50 + min(richness, 30)`.
- Patterns: groups Recipes by `category` (calling `recipe.toJSON()` if present,
  `:665`). If ≤3 categories or <15 recipes → single `patterns` topic; else one
  `pattern-category` topic per category with ≥2 items (`:677`–`:700`).
- Reference (`protocols.md`) when `astInfo.protocols.length >= 8` (`:705`).
- **Folder profiling** (`:716`–`:806`) is a *degradation strategy* enabled when
  any of: AST is sparse and no module docs (`astSparse`), a generic monolith with
  ≥2 source-module keys, or too few core articles (≤4 topics with ≥2 source-module
  keys). It calls `profileFolders(projectInfo, { minFiles: 3, maxFolders: 15 })`,
  dedups profiles by `relPath`, always emits a `folder-overview`, then emits up to
  `MAX_FOLDER_DOCS = 10` (`:762`) per-folder `folder-profile` docs, each requiring
  `fileCount ≥ 5` and a folder richness ≥10 (`:768`–`:783`).
- Finally topics are sorted by descending priority (`:809`).

**`_composeArticles()` (`WikiGenerator.ts:830`)** — writing:

- `MIN_ARTICLE_CHARS = 200` (`:833`). Ensures `modules/`, `patterns/`, `folders/`
  subdirs when needed (`:837`).
- For each topic in priority order:
  1. If an `aiProvider` exists, build the prompt and call `aiProvider.chat(prompt,
     { systemPrompt, temperature: 0.3, maxTokens: 4096 })` **raced against a
     45 000 ms timeout** (`Promise.race`, `:878`). If the result is a string of
     length ≥ `MIN_ARTICLE_CHARS`, use it and increment `composed`. AI errors are
     caught and logged, not thrown (`:889`).
  2. Otherwise fall back to `buildFallbackArticle(topic, structuredData, isZh)`
     (`:898`).
  3. **Quality gate**: if content is still `< MIN_ARTICLE_CHARS`, skip the topic
     entirely (`:902`).
  4. `_writeFile(topic.path, content)` (`:910`); mark `polished = true` when at
     least one AI compose succeeded and this content differs from the template
     (`:911`).
- **Overview re-write pass** (`:918`–`:931`): the `overview` topic initially gets
  `_allTopics = topics` (all planned), but after writing, its `_allTopics` is
  reset to only the topics actually written (`writtenTopics`) and — if the overview
  was *not* AI-polished — re-rendered via `renderIndex` so its navigation links
  never point at pages that were skipped by the quality gate.

### 13.6 Notable algorithms, gotchas, and edge cases

- **AST is stubbed.** `_analyzeAST()` (`WikiGenerator.ts:449`) returns empty
  structures; the header comment says project facts come from the
  `ProjectContext`-backed module service instead (`:448`). Any prompt/renderer
  branch keyed on `astInfo.classes/protocols/overview` therefore contributes
  nothing today, and the `reference` page (needs ≥8 protocols) will never trigger
  from AST alone. This is by design (folder profiling is the substitute), but it
  is a real behavioral gotcha for anyone reading the prompt code.
- **Two-layer dedup** (`WikiUtils.ts:294`): Layer 1 removes same-basename files
  across directories only when their content hash is identical (`:302`); Layer 2
  removes byte-identical files across different names, preferring to keep the
  code-generated one over a `documents/`/`skills/`-synced copy (`:334`). Both
  layers have a **path-escape guard**: a computed full path that does not start
  with `resolve(wikiDir)+sep` is skipped with a warning (`:311`,`:348`).
- **Source hash / incremental update**: `_computeSourceHash()` (`:1063`) walks up
  to 2000 files, sums their sizes and sorts their relative names, and hashes
  `names.join('\n') + totalSize`. This is coarse — a rename+equal-size edit or a
  content edit that keeps the byte total and file set constant will not be
  detected, so `update()` (`:313`) can report `upToDate` when content actually
  changed. Documented as a "simplified strategy" (`:320`).
- **WriteZone routing**: every filesystem mutation branches on `#wz`. When set,
  paths are made zone-relative by stripping `wz.dataRoot` and routed through
  `wz.data(rel)` / `wz.ensureDir` / `wz.writeFile` / `wz.remove`
  (`_ensureDir` `:989`, `_writeFile` `:998`, `_writeMeta` `:1034`, dedup remove
  `WikiUtils.ts:316`). `_readMeta`/`getStatus`/`_computeSourceHash` still read via
  raw `fs` regardless of the zone (`:1043`,`:1063`), which is fine when `dataRoot`
  and the zone agree but is an asymmetry to keep in mind.
- **AI-off content quality**: fallback renderers are deliberately rich (tables,
  Mermaid graphs, inferred purposes) so a wiki is still meaningful with no model.
  `renderArchitecture` and `renderFolderOverview` emit Mermaid `graph TD`
  (`WikiRenderers.ts:766`,`:1585`); `mermaidId` sanitizes node ids (`WikiUtils.ts:25`).
- **`inferModuleFromPath` Java/Kotlin handling** takes the last meaningful package
  segment, not the domain prefix (`WikiUtils.ts:125`), a subtle rule worth
  preserving when editing.
- **`_extractImports` filters built-ins and common third-party packages**
  (`WikiUtils.ts:877`) so folder-level "dependencies" reflect intra-project edges,
  not `fs`/`react`/`express`.
- **Non-fatal everywhere**: `_emit` swallows callback errors (`:981`);
  module/knowledge integration and dep-graph fetch all degrade to empty on error.
  A wiki run rarely hard-fails; it produces fewer pages instead.
- **`options.mode`**: callers pass `mode: 'bootstrap'`
  (`CompletionSteps.ts:48`) but the generator does not branch on `mode` — it is
  absorbed into the `[key: string]: unknown` index of `WikiOptions` and currently
  has no effect. Do not assume `mode` changes behavior.

### 13.7 External interfaces — how it is triggered

There are two host entry points into this subsystem; there is **no CLI command**
for the wiki (a `find` over `lib/cli` and `bin` shows no wiki wiring).

#### HTTP routes

Mounted at `${apiPrefix}/wiki` in `lib/http/HttpServer.ts:313` (router imported at
`:45`; declared in the provider contract table at
`lib/http/provider-contracts.ts:476` as `mount('I22', '/api/v1/wiki')`). All routes
live in `lib/http/routes/wiki.ts`:

| Method + path | Anchor | Behavior |
|---------------|--------|----------|
| `POST /api/v1/wiki/generate` | `routes/wiki.ts:156` | 409 if already running; else reset task, set `running`, build a generator, respond **202** immediately, then run `generator.generate()` in the background; on finish broadcast `wiki:completed`. |
| `POST /api/v1/wiki/update` | `routes/wiki.ts:224` | Same pattern but calls `generator.update()`. |
| `POST /api/v1/wiki/abort` | `routes/wiki.ts:270` | Calls `currentGenerator.abort()`, marks task `error`. |
| `GET /api/v1/wiki/status` | `routes/wiki.ts:290` | Returns in-flight `wikiTask`; when idle, reads on-disk status via `generator.getStatus()`. |
| `GET /api/v1/wiki/files` | `routes/wiki.ts:317` | Recursively lists `*.md` under `<dataRoot>/Alembic/wiki`. |
| `GET /api/v1/wiki/file/{*path}` | `routes/wiki.ts:359` | Reads one wiki file; rejects path traversal (`fullPath.startsWith(wikiDir)`, `:376`). |

Route-level mechanics worth noting:

- **In-process singleton task state.** `wikiTask` (`routes/wiki.ts:53`) and
  `currentGenerator` (`:64`) are module-level singletons — only one wiki job runs
  per server process. `getWikiTask()`/`patchWikiTask()` (`:81`,`:86`) are exported
  so external flows (e.g. the bootstrap orchestrator) can observe/adjust it.
- **Generator wiring** happens in `createGenerator(container)` (`routes/wiki.ts:91`):
  `projectRoot` from `container.singletons._projectRoot` → `ALEMBIC_PROJECT_DIR`
  → `process.cwd()`; `dataRoot` from `resolveDataRoot(container)`;
  `moduleService`/`knowledgeService` pulled from the DI container (optional);
  `aiProvider` and `realtimeService` from `container.singletons`. Language from
  `ALEMBIC_WIKI_LANG` env (default `zh`, `:147`).
- **Progress transport.** The `onProgress` callback updates `wikiTask` and, if a
  `realtimeService` is present, broadcasts a **Socket.io** `wiki:progress` event
  (`routes/wiki.ts:135`); a terminal `wiki:completed` event fires after
  `generate()` resolves (`:205`).

#### Dimension-completion workflow trigger

The second trigger is the knowledge-lifecycle completion pipeline (in-process, not
HTTP). `generateWiki(...)` in `lib/workflows/completion/CompletionSteps.ts:21`
dynamically imports `WikiGenerator`, pulls `moduleService`/`knowledgeService` from
the container (returning early if either is missing, `:37`), constructs it with
`options: { mode: 'bootstrap' }`, and calls `generate()`. It is invoked from
`lib/workflows/completion/CompletionFinalizer.ts:75` via `scheduleTask(...)` **only
when `wikiMode === 'schedule'`** (setting `wikiStatus = 'scheduled'`); otherwise the
step is skipped. The step is wrapped so a wiki failure is non-blocking for the
larger completion (`CompletionSteps.ts:55`). This finalizer is reached from the AI
dimension-completion path (`lib/workflows/ai-execution/AiDimensionFinalizer.ts`).

#### Emitted events

| Event | Emitted at | Payload |
|-------|-----------|---------|
| `wiki:progress` (Socket.io) | `routes/wiki.ts:135` | `{ phase, progress, message, timestamp }` |
| `wiki:completed` (Socket.io) | `routes/wiki.ts:205` | `{ success, filesGenerated, duration }` |

#### Output artifacts (the "format/location")

Output is a directory of Markdown files plus a JSON manifest under
`<dataRoot>/Alembic/wiki/` (default `wikiDir`, `WikiGenerator.ts:175`,`:210`):

- `index.md`, `architecture.md`, `getting-started.md`, `patterns.md`,
  `protocols.md`, `folder-structure.md` (top level, conditional).
- `modules/{slug}.md`, `patterns/{category-slug}.md`, `folders/{slug}.md`,
  `documents/_index.md` (subdir pages, conditional).
- `meta.json` (`_writeMeta`, `WikiGenerator.ts:1012`): `{ version: '3.0.0',
  generator, generatedAt, duration, projectRoot, language, files: [{ path, hash,
  size, source?, polished? }], sourceHash, dedup? }`. `hash` is the first 12 hex
  chars of the content SHA-256 (`_writeFile`, `:1008`).

No DB tables are written by this subsystem — persistence is entirely
filesystem-based (`meta.json` + Markdown). It *reads* from the knowledge store
indirectly through the injected `knowledgeService`.

### 13.8 Boundary note — host-owned vs delegated

**Host-owned (implemented in this repo, `lib/service/wiki/**` + HTTP route +
completion step):**

- The `WikiGenerator` orchestrator, its 10-phase state machine, abort/incremental
  logic, and all Markdown rendering, AI prompt construction, folder profiling, and
  dedup. This is genuine host logic, not a thin wrapper.
- The HTTP surface (`lib/http/routes/wiki.ts`), its in-process task singleton,
  Socket.io progress/completion events, and DI wiring in `createGenerator`.
- The dimension-completion trigger and its scheduling/non-blocking policy
  (`lib/workflows/completion/*`).
- The output contract: `<dataRoot>/Alembic/wiki/` layout and `meta.json`.

**Delegated to / consumed from `@alembic/core`:**

- `LanguageService` (`@alembic/core/shared`) — language detection, source
  extensions, display names, build-marker matching (`WikiGenerator.ts:38`,
  `WikiUtils.ts:12`). The organism's language knowledge lives in core.
- `WriteZone` (`@alembic/core/io`) — Ghost-mode-aware localized write manager;
  the host injects it so wiki output can be redirected to
  `~/.asd/workspaces/<id>/` (`WikiGenerator.ts:36`,`:195`).
- `Logger` (`@alembic/core/logging`) and workspace path constants
  (`DEFAULT_KNOWLEDGE_BASE_DIR`, `resolveDataRoot` from `@alembic/core/workspace`)
  (`WikiGenerator.ts:37`,`:39`; `routes/wiki.ts:19`).
- The **actual project facts and Recipes** come from the injected `moduleService`
  (`ProjectContext`/Panorama-backed module & dependency data) and `knowledgeService`
  (active Recipe lifecycle). Their real implementations live behind the DI
  container and, for the engine parts, in `@alembic/core`; this subsystem only
  declares the minimal consuming interfaces (`WikiGenerator.ts:85`,`:103`) and
  reads their output. It does **not** implement module discovery, the dependency
  graph, or the Recipe lifecycle.

**Not involved:** `@alembic/agent`. The wiki's "AI" is a generic
`WikiAiProvider.chat` host provider (the same host AI-provider orchestration used
elsewhere in this repo), not the in-process agent runtime or tool system. There is
no import from `@alembic/agent` anywhere in `lib/service/wiki/**`.


---


## 14. Services — Bootstrap, Cleanup, Evolution, Handler-Runtime & File-Change Dispatch

This section documents the host-owned service layer under `lib/service/` that orchestrates cold-start bootstrap, destructive data cleanup, reactive/periodic knowledge evolution, and the file-change fan-out that connects the daemon and HTTP surfaces to the `@alembic/core` evolution engine. These modules are the **host wiring** around Core's lifecycle/evolution logic: they collect events, schedule bounded work, and translate host inputs into calls on Core services (`stagingManager`, `lifecycleStateMachine`, `proposalExecutor`, `decayDetector`, `EvolutionGateway`, `KnowledgeSyncService`, etc.). Nearly all judgment (transition guards, decay scoring, proposal policy, impact scoring) lives in Core; this layer decides *when* and *how often* Core is invoked, plus how progress is surfaced to the Dashboard and CLI.

Directory layout in scope:

```text
lib/service/
├── bootstrap/
│   ├── BootstrapTaskManager.ts     # cold-start session + task state machine + dual-channel progress
│   ├── BootstrapRefine.ts          # Phase 6 AI polish of pending bootstrap candidates
│   ├── BootstrapEventEmitter.ts    # unified dimension-progress emitter (EventBus + TaskManager)
│   ├── BootstrapEfficiency.ts      # AgentEfficiencySummary normalize/merge
│   ├── UiStartupTasks.ts           # post-daemon-ready async background refresh
│   └── bootstrap-event-types.ts    # typed discriminated-union event payloads
├── cleanup/
│   └── CleanupService.ts           # trash-bin fullReset / rescanClean / snapshotRecipes / GC
├── evolution/
│   ├── DaemonFileChangeCollector.ts # native fs.watch (primary) + git-worktree poll (fallback)
│   ├── EvolutionMaintenanceSweep.ts # bounded periodic driver of Core lifecycle/evolution
│   ├── InProcessFileChangeHandler.ts # reactive per-event evolution (rename/delete/modify)
│   └── FileChangeHandler.ts         # R1 rename-compat re-export shim
├── handler-runtime/
│   ├── types.ts                    # runtime-free handler contracts (McpContext, envelope shapes)
│   ├── envelope.ts                 # standardized tool response wrapper
│   └── problem.ts                  # structured usage-problem objects (Core failure taxonomy)
└── FileChangeDispatcher.ts         # pub-sub fan-out for FileChangeEvent[]
```

---

### 14.1 Responsibilities & role in the system

- **Bootstrap orchestration** — `BootstrapTaskManager` tracks a single cold-start *session* as a set of dimension/skill *tasks* moving through `skeleton → filling → completed | failed | cancelled`, emits progress on two channels (backend `EventBus` and frontend Socket.io via `RealtimeService`), and exposes an `AbortController` so a new bootstrap request can pre-empt a running one. `BootstrapEventEmitter` is the write-side adapter that lets both the in-process AI path and the host-agent path push identical dimension events into the TaskManager + EventBus. `BootstrapRefine` is Phase 6 AI polish over pending candidates. `UiStartupTasks` runs the post-ready background refresh chain. `bootstrap-event-types.ts` types every dimension-complete payload variant.
- **Cleanup / GC** — `CleanupService` implements the "trash-bin" data reset used before a cold-start rebuild (`fullReset`), the lighter `rescanClean`/`forceRescanClean`, an active-Recipe `snapshotRecipes`, and expired-trash purging.
- **Evolution automation** — `DaemonFileChangeCollector` produces `FileChangeEvent[]` from the filesystem, `FileChangeDispatcher` fans them out, `InProcessFileChangeHandler` reacts to each event by submitting proposals through Core's `EvolutionGateway`, and `EvolutionMaintenanceSweep` periodically ticks Core's staging/timeout/proposal/decay drivers on a bounded cadence.
- **Handler-runtime contract** — `envelope.ts`/`problem.ts`/`types.ts` define the response shape and DI-context shape shared by host-owned resident/tool handlers and consumed by HTTP routes.

---

### 14.2 Bootstrap task orchestration — `BootstrapTaskManager`

#### Session & task model

A `BootstrapSession` (`lib/service/bootstrap/BootstrapTaskManager.ts:67`) holds a `Map<taskId, TaskInfo>` and a session-level `status` of `running | completed | completed_with_errors | aborted`. Each `TaskInfo` (`:34`) has a `status` drawn from the frozen `TaskStatus` enum (`:58`): `skeleton`, `filling`, `completed`, `failed`, `cancelled`. Note the deliberate distinction: **user cancellation is its own terminal state**, never masqueraded as `failed` (`:321`, `:322-330`).

Derived getters compute progress without extra bookkeeping: `completedTasks`/`failedTasks`/`cancelledTasks`/`fillingTasks`/`skeletonTasks` filter the map (`:109-123`), `isAllDone` is `skeletonTasks === 0 && fillingTasks === 0` (`:125`), and `progress` is `round((completed+failed+cancelled)/total * 100)` returning `100` when there are no tasks (`:156-164`). `totalToolCalls` (`:129`) sums each task's `result.toolCallCount`, falling back to `result.efficiency.toolCalls`.

| Manager method | Effect | file:line |
|---|---|---|
| `startSession(taskDefs)` | Aborts any running session, mints `bs_<ts>_<rand>` id, seeds tasks in `skeleton`, emits `bootstrap:started` | `:259` |
| `abortSession(reason)` | Marks unfinished tasks `cancelled`, `session.userCancelled=true`, fires `AbortController`, status→`aborted`, emits `bootstrap:all-completed` + lifecycle signal weight 0.3 | `:314` |
| `getSessionAbortSignal()` | Returns the live `AbortSignal` for passing into `AgentRuntime.execute()` | `:385` |
| `isSessionValid(id)` | True while id matches and status is `running`/`completed`/`completed_with_errors` (async fillers poll this to self-abort) | `:395` |
| `markCancelled()` | Sets `userCancelled` + aborts even when status is no longer `running` | `:412` |
| `isUserCancelled(id)` | For `finalize` chains: `shouldAbort = !isSessionValid(id) || isUserCancelled(id)` | `:426` |
| `markTaskFilling(taskId)` | `skeleton→filling`, emits `bootstrap:task-started` (this log is the key cold-start heartbeat, `:448`) | `:431` |
| `markTaskCompleted(taskId,result)` | `filling→completed`, stores `result`, emits `bootstrap:task-completed`, triggers `#finishSession` if `isAllDone` | `:472` |
| `markTaskFailed(taskId,error,result)` | `→failed`, emits `bootstrap:task-failed`, may `#finishSession` | `:528` |
| `getSessionStatus()` | `session.toJSON()` or `{status:'idle'}` — for HTTP polling | `:581` |
| `emitProgress(name,data)` | Escape hatch to reuse the dual channel for non-session flows (e.g. `refine:*`) | `:606` |

#### Concurrency & abort semantics (gotchas)

- **Single-session lock.** `startSession` aborts a still-running previous session before creating a new one so duplicate cold-start requests do not produce duplicate candidates (`:261-266`).
- **Mutation guards.** `markTaskFilling/Completed/Failed` all early-return unless the session is `running` and not `userCancelled` (`:433`, `:474`, `:530`). This is why `abortSession` refuses to act when status !== `running` (`:316`) and why `markCancelled` exists as a separate path (`:412`) for the window where the LLM already pushed status to `completed_with_errors` but a `finalize` chain is still running.
- **`#finishSession`** (`:614`) sets terminal status to `completed_with_errors` when `failedTasks > 0`, else `completed`; it emits `bootstrap:all-completed` + lifecycle signal weight `1`.
- **Efficiency rollup.** `buildEfficiencySummary` (`:220`) delegates to `mergeAgentEfficiencySummaries` over each task's `result.efficiency`; a `cancelReason` (when aborted) is threaded through so the summary is emitted even if no task produced one.

#### Dual-channel emit

`#emit` (`:663`) pushes to (1) `EventBus.emit` for backend listeners, and (2) the lazily-resolved `RealtimeService.broadcastEvent` for Socket.io. RealtimeService resolution is wrapped in try/catch and silently ignored in CLI mode where no realtime service exists (`:682-684`). The `getRealtimeService` getter is injected rather than the service itself to avoid a circular DI dependency (`:238`).

#### Wiring

The TaskManager is a DI singleton (`bootstrapTaskManager`); consumers include `BootstrapRefine` (progress bridge, `BootstrapRefine.ts:76`), `BootstrapEventEmitter` (resolves it from the container, `BootstrapEventEmitter.ts:38`), and the `lib/workflows/ai-execution/*` cold-start execution builders. The container also injects `signalBus` so terminal transitions emit `lifecycle` signals (`:367`, `:651`).

---

### 14.3 Unified dimension events — `BootstrapEventEmitter` + `bootstrap-event-types`

`BootstrapEventEmitter` (`lib/service/bootstrap/BootstrapEventEmitter.ts:16`) is constructed from the DI container and best-effort resolves `eventBus` and `bootstrapTaskManager` (either may be absent; both lookups are try/catch). It gives the in-process AI path and the host-agent path a single API so both emit identical event names/shapes.

| Emitter method | TaskManager call | EventBus event | file:line |
|---|---|---|---|
| `emitDimensionStart(dimId)` | `markTaskFilling` | — | `:105` |
| `emitDimensionComplete(dimId, data)` | `markTaskCompleted` or `markTaskFailed` (see below) | `bootstrap:task-completed` | `:58` |
| `emitDimensionFailed(dimId, error)` | `markTaskFailed` | `bootstrap:task-failed` | `:119` |
| `emitAllComplete(sessionId, total, source)` | — | `bootstrap:all-completed` | `:88` |
| `emitProgress(event, data)` | `emitProgress` | `<event>` | `:142` |
| `emitProcessEvents(data)` | `emitProgress('bootstrap:process-events', …)` (preferred) else EventBus | `bootstrap:process-events` | `:162` |

**Normal-vs-non-normal dimension classification.** `emitDimensionComplete` routes to `markTaskFailed` when `isNonNormalDimensionPayload` (`:185`) is true — i.e. `type === 'error'` or `status ∈ {timeout, blocked, aborted, error, degraded_no_findings, record_repair_incomplete, l4_compaction_failed_budget_exhausted}`. `extractDimensionFailureReason` (`:201`) prefers `data.reason`, then `data.status`, then a generic label. Every method is individually try/catch-wrapped and non-blocking, so a broken event sink never derails the bootstrap pipeline.

**Process-event bridging.** `emitProcessEvents` prefers the TaskManager channel and only falls back to EventBus if the TaskManager path did not fire (`:173`). Per the header comment, `DaemonJobRunner` binds these drafts to the current daemon job and hands them to Core's `JobProcessEventRecorder` for contract normalization / retention / broadcast — so this emitter produces *drafts*, not the final persisted events.

**Typed payloads.** `bootstrap-event-types.ts` defines a discriminated union `DimensionCompletePayload` (`:77`) over the `type` field, covering `skipped`, `incremental-restored`, `checkpoint-restored`, `error`, pipeline-complete (`candidate|skill`), `skill` (with `ProjectSkillDeliveryReceipt`/validation from `@alembic/core/host-agent-workflows`), and host-complete variants. `BootstrapProcessEventDraft` (`:94`) is `CreateJobProcessEventInput` (from `@alembic/core/daemon`) minus the fields the recorder fills (`createdAt`/`id`/`jobId`/`sequence`), plus an optional developer-visible-redacted `textArtifactCandidate` (`:104`). These types exist purely for compile-time event validation; there is no runtime code here.

---

### 14.4 Efficiency accounting — `BootstrapEfficiency`

`BootstrapEfficiency.ts` re-exports the `AgentEfficiencySummary` type from `@alembic/agent/runtime` (`:1-3`) and provides three pure helpers:

- `normalizeAgentEfficiencySummary(value)` (`:5`) — coerces an untyped record into a summary with finite-number defaults (`finiteNumber` maps non-finite → `0`, `:94`), a nested `tokenUsage` block, a boolean `forcedSummary`, and an optional trimmed `cancelReason`.
- `mergeAgentEfficiencySummaries(values, {cancelReason})` (`:35`) — additively sums `toolCalls`, `duplicateToolCalls`, cache hit/miss, token usage, `totalCompactedItems`, `nudgeCount`, `replanCount`, `emptyRetries`; takes the **max** of `maxCompactionLevel`; ORs `forcedSummary`. Returns `null` unless at least one real summary was seen (`sawSummary`) — but an injected `cancelReason` alone flips `sawSummary` true so a cancelled session still yields a summary (`:79-83`).
- `extractEfficiencyFromDiagnostics(diagnostics)` (`:88`) — pulls `.efficiency` out of a diagnostics record and normalizes it.

Boundary: the *shape* is Agent-owned (`@alembic/agent/runtime`); this file only owns the host-side normalize/merge arithmetic used to roll per-task efficiency into a session summary.

---

### 14.5 Phase 6 AI polish — `BootstrapRefine`

`bootstrapRefine(ctx, args)` (`lib/service/bootstrap/BootstrapRefine.ts:51`) is an envelope-returning handler (invoked under tool `alembic_bootstrap`) that re-runs the AI over Phase 5 candidate knowledge to improve descriptions, add architecture insight, infer relations, and adjust confidence.

Control flow:

1. Resolve `knowledgeService` + `aiProvider` from `ctx.container` (`:53-54`). Guard: no provider → `MISSING_AI_PROVIDER` envelope (`:56-62`); provider not ready or `mock` → `AI_PROVIDER_UNAVAILABLE` using `getAiRuntimeStatus`/`getAiUnavailableMessage` from `lib/injection/AiRuntimeStatus.js` (`:64-71`).
2. Best-effort acquire `bootstrapTaskManager` and bind `onProgress` to `emitProgress` so `refine:*` events reuse the dual channel (`:74-81`).
3. Collect entries — either the explicit `candidateIds` (`:85-92`) or `knowledgeService.list({lifecycle:'pending', source:'bootstrap'}, {pageSize:200})` (`:93-101`). Empty → success envelope with zero counts (`:103`).
4. Collect **published** Recipe titles (`lifecycle:'active'`) as the only legal relation targets (`:119-130`).
5. Per entry: emit `refine:item-started`, build a Chinese prompt enumerating the 9 canonical keys and the current field values (truncating `pattern`/`markdown` to 2000 chars, `:198`/`:201`), call `aiProvider.chatWithStructuredOutput(prompt, {temperature:0.3})` (`:238`), then normalize keys, diff against `before`, and `knowledgeService.update` only changed fields. Emits `refine:item-completed` / `refine:item-failed`.
6. Emit `refine:completed` and return an envelope with `{refined, total, errors, results}` (`:412-424`).

Notable algorithms/gotchas:

- **Cap honesty (MT3).** `formatPublishedTitles(titles, cap=20)` (`:36`, cap const `PUBLISHED_TITLES_PROMPT_CAP` `:28`) explicitly declares truncation in the prompt when titles exceed the cap ("仅展示前 N 个… 未列出的同样是合法关联目标"). A silent truncation would make the AI believe only the first 20 recipes are valid relation targets.
- **Key alias normalization** (`:266-315`) mirrors `candidates.js`: it maps aliases (`summary→description`, `content→pattern`, `design→rationale`, etc.), keeps only the 9 `VALID_KEYS`, and backfills any missing key from `before` so the update diff is well-defined.
- **Merge, not overwrite, for tags** (`:326-332`): `[...new Set([...before.tags, ...new.tags])]`.
- **Nested content patch** (`:359-376`): `pattern`/`markdown`/`rationale` are written under `content`, everything else at top level.
- **`dryRun`** short-circuits to a `preview` result with no DB write (`:253-264`).
- Relation constraints are enforced only via prompt instructions (`:231-233`); there is no server-side relation validation in this file.

---

### 14.6 Post-ready background refresh — `UiStartupTasks`

`runUiStartupTasks(ctx)` (`lib/service/bootstrap/UiStartupTasks.ts:42`) runs after the daemon reports ready (fired-and-forgotten from `bin/daemon-server.ts:139-148`). It executes six independent stages, each in its own try/catch that pushes any failure into `report.errors` without aborting later stages. This is the primary **daemon-less-friendly** maintenance entry point: each stage is a direct on-demand call into a Core service, so the same effects happen without any long-lived loop.

| Stage | Service (DI key) | Action | Report field | file:line |
|---|---|---|---|---|
| 1 | `knowledgeSyncService` (or constructed) | `syncAll(db, {skipViolations:true})` — `.md → DB` + sourceRef reconcile | `syncAll`, `reconcile` | `:49-89` |
| 2 | `stagingManager` | `checkAndPromote()` — due staging → active | `staging.promoted` | `:92-109` |
| 3 | `vectorService.syncCoordinator` | `reconcile()` — vector orphans/missing (best-effort) | `vectorReconcile` | `:112-135` |
| 4 | `searchEngine` | `refreshIndex({force:true})` — BM25 rebuild | `indexRefresh` | `:138-151` |
| 5 | `proposalExecutor` | `checkAndExecute()` — expire pending + observing fallback | `proposalCheck` | `:154-180` |
| 6 | `proposalExecutor` + `signalBus` | `subscribeToSignals(signalBus)` — signal-driven proposal eval | `signalSubscription` | `:183-196` |

Stage 1 gotcha: it prefers a container-registered `knowledgeSyncService` (correct `dataRoot` under Ghost mode) and only constructs a fresh `KnowledgeSyncService` if absent, resolving `dataRoot` via `resolveDataRoot(container)` with `projectRoot` fallback (`:51-67`). All services here are Core-owned; this module is pure scheduling glue.

---

### 14.7 Data cleanup / GC — `CleanupService`

`CleanupService` (`lib/service/cleanup/CleanupService.ts:176`) implements the "trash-bin" reset model. It is constructed with `{projectRoot, dataRoot, db, logger, writeZone}` and unwraps the raw sqlite handle via `unwrapSqliteDatabase` (`:194`, aliased `resolveSqliteDb` `:884`). An optional `WriteZone` (`#wz`) routes all filesystem writes through the sandboxed data root when present, else falls back to raw `fs` (see the `#wz ? … : …` branches throughout, e.g. `:664-669`, `:837-847`). It is constructed inside `ColdStartWorkflow` (`lib/workflows/cold-start/ColdStartWorkflow.ts:136`) via a `runFullResetPolicy` factory.

#### Trash-bin design

Trash lives at `<dataRoot>/.asd/.trash/<ISO-timestamp>/` (`#getTrashRoot` `:634`; folder names use `:.` → `-` substitution `:639`). Retention is `TRASH_RETENTION_DAYS = 7` (`:106`); expired folders are purged on `fullReset` and can be purged explicitly (`purgeExpiredTrash` `:605`). DB rows are exported to `db-snapshot.jsonl` (`:109`) as `{_table, ...row}` per line. **No restore is implemented** — the header notes merge complexity makes restore out of scope (`:15-16`).

#### `fullReset()` (`:217`)

1. Purge expired trash (`:228`).
2. Create timestamped trash folder (`:235`).
3. **Move** (not copy) `candidates/`, `recipes/`, `skills/`, `wiki/` into trash via `#moveToTrash` — uses `fs.renameSync` (atomic same-fs) with a `cpSync + rmSync` fallback on cross-device errors (`:655-695`).
4. Export key tables to `db-snapshot.jsonl` (`#exportDbToTrash` `:701`).
5. Clear `ALL_DATA_TABLES` then `TASK_DATA_TABLES` (`:261-267`), then `#assertFullResetDatabaseClean`.
6. Recreate the emptied knowledge dirs (`:275-284`), clear the vector index dir, delete `bootstrap-report.json`, clear `logs/signals/` (`:287-297`).

**FK ordering gotcha.** `ALL_DATA_TABLES` (`:123`) is ordered child-before-parent so `DELETE` never trips a foreign-key constraint (`lifecycle_transition_events`/`recipe_source_refs`/`recipe_warnings`/`evolution_proposals`/`knowledge_edges`/`bootstrap_dim_files` before `knowledge_entries`/`bootstrap_snapshots`). `TASK_DATA_TABLES` (`:151`) similarly deletes `task_events`/`task_dependencies` before `tasks`.

**Fail-closed reset.** `#assertFullResetDatabaseClean` (`:341`) **throws** if any table could not be cleared (including the `db === null` case, `:269-272`). The rationale (in the message, `:345-348`): stale `knowledge_entries` / `coverage_ledger` / `deep_mining_rounds` rows surviving a reset would corrupt the subsequent cold-start rebuild, so the host must stop before Recipe generation rather than proceed on dirty state. `isMissingTableError` (`:886`) lets a genuinely absent table pass without counting as an error.

**`coverage_ledger` / `deep_mining_rounds`.** These are Core deepMining "measured" tables and are intentionally included in `ALL_DATA_TABLES` (comment `:120-122`) and in the JSONL export set (`:706-716`) so a rebuilt cold start never reads stale round counts.

#### `rescanClean()` (`:367`) vs `forceRescanClean()` (`:454`)

Both clear session-derived tables (`RESCAN_CLEAN_TABLES` / `FORCE_RESCAN_CLEAN_TABLES` — currently identical lists: `code_entities`, `guard_violations`, `semantic_memories`, `sessions`, `audit_logs`, `:154`/`:166`), delete `knowledge_entries WHERE lifecycle IN ('pending','rejected','deprecated')`, clear the task tables, and wipe `candidates/`, `skills/`, `wiki/`, the vector index, and `bootstrap-report.json`. Both **preserve** active/published/staging/evolving entries, `knowledge_edges`, `evolution_proposals`, and the incremental-evidence tables (`bootstrap_snapshots`, `bootstrap_dim_files`, `recipe_source_refs`). The documented difference (headers `:441-453`) is that `forceRescanClean` keeps incremental evidence to support later incremental diffs — but as written both variants already retain those tables, so the two paths are effectively equivalent today (worth flagging for anyone refactoring: `RESCAN_CLEAN_TABLES` and `FORCE_RESCAN_CLEAN_TABLES` are byte-identical, and neither includes the incremental tables). Neither is fail-closed; errors are collected, not thrown.

#### `snapshotRecipes()` (`:533`)

Reads consumable-lifecycle recipe rows via `SqliteDatabaseAccess` helpers (`readKnowledgeEntryColumns`, `readRecipeSnapshotRows` from `lib/infrastructure/database/SqliteDatabaseAccess.js`), using `lifecycleInSql(CONSUMABLE_LIFECYCLES)` from Core (`:539`). Parses `content` and `sourceRefs` JSON defensively (bad JSON → `undefined`, `:549-564`), and computes `coverageByDimension` using Core's `recipeDimensionIdOrUnknown` resolver (`:582-585`) so legacy rows without an explicit `dimensionId` column still bucket correctly (`hasDimensionId` detection `:541`).

#### Trash management helpers

`listTrashFolders()` (`:612`) returns `{name, createdAt, sizeMB}` for Dashboard display (filtering to ISO-timestamp-named dirs). `#purgeExpiredTrash` (`:749`) parses the folder-name timestamp back to a `Date` (falling back to `birthtimeMs` on parse failure `:772`) and `rmSync`s anything older than 7 days, then removes the trash root if empty. `#getDirSize` (`:804`) recurses to estimate freed bytes.

---

### 14.8 File-change collection — `DaemonFileChangeCollector`

`DaemonFileChangeCollector` (`lib/service/evolution/DaemonFileChangeCollector.ts:77`) is the daemon-owned event *producer*. It has two sources feeding one dispatcher: **native `fs.watch` is primary; git-worktree polling is the degraded fallback** (header `:1-8`). It is constructed and started from `bin/daemon-server.ts:194-201` (guarded by `ALEMBIC_DAEMON_FILE_CHANGES !== '0'`, `:184`) and stopped on shutdown (`:164`).

#### Start / fallback logic

`start()` (`:118`) tries `#startNativeWatcher` (`:301`) — which snapshots the tree (`collectNativeFileSnapshot`), installs `watch(root, {persistent:false, recursive:true})` (`defaultNativeWatcherFactory` `:466`), and attaches an `error` listener. If the watcher throws at setup, it returns the failure reason and `#startGitFallback(reason)` runs (`:132`). The git fallback (`:331`) requires a `.git` dir — otherwise it records an *unsupported* status and does nothing (`:332-355`); when present it runs an immediate `scanOnce()` and a `setInterval` at `intervalMs` (default `60_000`, `:35`). A **runtime** native-watcher error (`#handleNativeWatcherError` `:409`) closes the native watcher and activates the git fallback if not already running (`:420-422`).

#### Scan → diff → dispatch

Both paths converge on `FileChangeDispatcher.dispatch(...)` with an idempotency token:

- **Native** (`scanNativeOnce` `:150`): debounced by `nativeDebounceMs` (default `150`, `:36`) via `#scheduleNativeScan` (`:397`). Re-entrancy guarded by `#nativeScanRunning`/`#nativeScanQueued` (`:154-157`, `:213-218`). Diffs the previous vs current snapshot with `diffNativeSnapshots` (`:520`), filters ignored paths, caps at `MAX_EVENTS_PER_SCAN = 500` (`:38`), dedupes, then dispatches.
- **Git** (`scanOnce` `:222`): guarded by `#running`/`#gitScanQueued`. `#collectGitSnapshot` (`:447`) runs three `git` commands in parallel — `diff --name-status`, `diff --name-status --cached`, `ls-files --others --exclude-standard` (5s timeout each, `:37`) — and folds them into `FileChangeEvent`s. The **first** git scan only captures a baseline (`#lastGitKeys`) and dispatches nothing (`:240-246`); subsequent scans emit only newly-appeared keys.

#### Rename detection (native)

`diffNativeSnapshots` (`:520`) pairs a single deleted entry with a single created entry sharing a *signature* — `inode:<dev>:<ino>` when inode is available, else `content:<size>:<mtimeMs>` (`getNativeRenameSignature` `:579`) — and emits a `renamed` event; unmatched deletes/creates become `deleted`/`created`, and same-path mtime/size changes become `modified` (`:556-564`). All native events carry `eventSource:'host-edit'`; git events carry `eventSource:'git-worktree'`.

#### Idempotency & dedup

`createFileChangeDispatchToken(source, events)` (`:642`) builds a stable token from sorted per-event keys, `attachFileChangeDispatchToken` (`:650`) stamps every event with it, and `dedupeFileChangeEvents` (`:634`) collapses duplicates by `fileChangeEventKey` = `source:type:oldPath:path` (`:663`). `isIgnoredPath` (`:690`) drops `.asd`, `.git`, `node_modules` (and their subtrees).

#### Status reporting

Every state transition updates `#status` via the `FileMonitorStatus` factories (`createNativeFileMonitorStatus`, `createGitFallbackFileMonitorStatus`, `createErroredFileMonitorStatus`, `createUnsupportedFileMonitorStatus`, etc. from `lib/daemon/FileMonitorStatus.js`). `getStatus()` (`:114`) returns a clone; the daemon stores it under `container.singletons.daemonFileChangeCollectorStatus` (`bin/daemon-server.ts:202`) and it surfaces in the `RuntimeBoundary.fileMonitor` capability block (`lib/daemon/RuntimeBoundary.ts:131-142`).

---

### 14.9 File-change fan-out — `FileChangeDispatcher`

`FileChangeDispatcher` (`lib/service/FileChangeDispatcher.ts:88`) is a minimal pub-sub. Subscribers implement `FileChangeSubscriber` (`{name, onFileChanges(events) → Promise<ReactiveEvolutionReport|undefined>}`, `:21`). `dispatch(events)` (`:103`):

1. Infers a batch `eventSource` (`inferBatchSource` — most-frequent source, `:67`).
2. Returns an `emptyReport(eventSource)` when there are no events or no subscribers (`:106`).
3. Runs all subscribers under `Promise.allSettled` so one failure is isolated (`:114`), logs rejections (`:119`), and folds each returned report via `mergeReports` (dedup by `recipeId:action:modifiedPath`, `:41-64`).
4. Forces `merged.eventSource = eventSource` at the end so subscriber merges can't blank it (`:130`).

The DI singleton `fileChangeDispatcher` registers exactly one subscriber, the `InProcessFileChangeHandler`, at construction (`lib/injection/modules/KnowledgeModule.ts:369-374`). Both the daemon collector (§14.8) and the HTTP route (§14.11) call `dispatch`.

---

### 14.10 Reactive evolution — `InProcessFileChangeHandler`

`InProcessFileChangeHandler` (`lib/service/evolution/InProcessFileChangeHandler.ts:48`) implements `FileChangeSubscriber` and turns each `FileChangeEvent` into evolution proposals via Core's `EvolutionGateway`. It is a pure-code path (documented as millisecond-fast), so the HTTP route dispatches synchronously (`file-changes.ts:130`). `FileChangeHandler.ts` is a rename-compat re-export alias for the pre-P12 name (`FileChangeHandler.ts:7-10`).

Per-event routing in `handleFileChanges` (`:91`):

| Event type | Handler | Behavior | file:line |
|---|---|---|---|
| `renamed` | `#handleRenamed` | For each ref to `oldPath`, submit an `update` proposal (confidence 0.85) with rename evidence; count `needsReview`. Does **not** auto-edit Recipe/sourceRefs | `:170` |
| `deleted` | `#handleDeleted` | Mark the ref `stale`; if no other `active` ref remains, submit a `deprecate` proposal (confidence 0.7); else record `skip` | `:238` |
| `modified` | `#handleModified` | `assessFileImpact` (Core) on the diff vs `extractRecipeTokens`; on `pattern` level submit an `update` proposal (confidence `min(0.5+score, 0.9)`) and emit signal | `:335` |
| `created` | — | Skipped; new files don't affect existing recipes | `:130-134` |

Key mechanisms & gotchas:

- **Proposals, not edits.** Every mutation goes through `this.#gateway.submit({recipeId, action, source:'file-change', confidence, description, evidence})` and awaits human review; the handler never mutates a Recipe directly (comments `:12-13`, `:168`). Gateway `outcome === 'error'` is logged and counted as `skipped` (`:203-210`).
- **Rename-with-no-target** (an event with `oldPath` but no distinct `newPath`) is downgraded to a delete (`:110-119`).
- **Modified impact scoring is Core-owned.** `assessFileImpact(projectRoot, path, recipeTokens)` (`:369`) returns `{level, score, matchedTokens}` or `null` (no git / untracked / no change → skip, `:373-375`). Only `pattern` level persists a proposal; **all** levels emit a `quality` signal via `#emitSourceModifiedSignal` (`:428`) with weight from `IMPACT_WEIGHTS = {direct:0.8, pattern:0.6, reference:0.3}` (`:38`).
- **Lifecycle filter.** `#handleModified` skips entries whose lifecycle is not `isConsumable || isDegraded` (`isEvolutionTrackableLifecycle` `:485`) — pending/deprecated recipes don't enter the evolution chain.
- **`suggestReview`** is set true when any detail is `needs-review` with impact `direct`/`pattern`, or any `deprecated` occurred (`:152-156`) — this drives the "复核提示" the HTTP caller may surface.
- **Signals** are best-effort (try/catch swallowed): a per-recipe `source_modified` quality signal per modified match, plus one aggregate `reactive_fix` quality signal when `report.fixed > 0` (`:466-482`). Lifecycle signals are emitted by Core's StateMachine, not here (`:13`).

---

### 14.11 HTTP ingress — `POST /api/v1/file-changes`

`lib/http/routes/file-changes.ts` is the domain-agnostic ingress that lets the daemon collector *or* an external host push events. `HttpServer` mounts it (`lib/http/HttpServer.ts:321`). Flow:

1. Zod-validate a non-empty `events` array (`:40-44`), then per-event validate `type ∈ {created,renamed,deleted,modified}` and a string `path` (`:63-71`).
2. **Path safety** — `isSafeProjectRelativePath` (`:190`) rejects absolute paths, drive-letter paths, `\0`, `.`, and any `..` segment. Any unsafe path → `400 INVALID_FILE_CHANGE_PATH` for the whole batch (`:98-110`).
3. Normalize `eventSource` against `VALID_SOURCES` (the Core `DAEMON_FILE_CHANGE_EVENT_SOURCES` plus legacy `ide-edit`→`host-edit`, `:35-38`, `:174-184`); unknown sources are dropped to `undefined` for dispatcher inference (`:88-94`).
4. Empty-after-filter → success with an empty report (`:112-125`); otherwise `dispatcher.dispatch(validEvents)` and return the merged `ReactiveEvolutionReport` (`:127-160`). Dispatch failure → `500 FILE_CHANGE_DISPATCH_FAILED` with a `diagnostics://` detailRef (`:134-151`).

---

### 14.12 Periodic evolution driver — `EvolutionMaintenanceSweep`

`EvolutionMaintenanceSweep` (`lib/service/evolution/EvolutionMaintenanceSweep.ts:77`) is the daemon-owned periodic *driver* of Core lifecycle/evolution services. Per its header (`:70-76`) it "only drives Core services on a bounded cadence; it does not alter Core judgments, guards, policies, or schema." Reactive per-event handling stays with `InProcessFileChangeHandler`.

- **Cadence.** `start()` (`:93`) installs a `timerRegistry.setInterval` at `intervalMs` (default `60_000`, env `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP_INTERVAL_MS`, `:223`). `stop()` clears it. Constructed/started from `bin/daemon-server.ts:217-224`, gated by `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP !== '0'`.
- **Bounded work.** Every driver gets a `cap` (default `50`, env `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP_CAP`, `:219`), passed straight into the Core call.
- **Single-flight.** `runOnce(now)` (`:119`) returns `skipped('in-flight')` if a sweep is already running (`#inFlight` promise, `:120-128`) — critical for the daemon-less tick-on-access model where `runOnce` may be invoked from multiple triggers.

`#runDrivers` (`:131`) runs four drivers in sequence, each isolated by `#runDriver` (`:181`, per-driver try/catch → `driverErrors[]`):

| Driver | Core service (DI key) | Call | Result fields | file:line |
|---|---|---|---|---|
| `staging` | `stagingManager` | `checkAndPromote(cap)` | `promotedCount`, `waitingCount` | `:147-152` |
| `timeouts` | `lifecycleStateMachine` | `checkTimeouts(cap)` | `checkedTimeouts`, `timedOutCount` | `:154-160` |
| `proposals` | `proposalExecutor` | `checkAndExecute(cap)` | `executedCount`, `expiredCount`, `rejectedCount` | `:162-168` |
| `decay` | `decayDetector` | `scanAll(cap)` | `decayScannedCount` | `:170-174` |

The result (`EvolutionMaintenanceSweepResult` `:55`) is logged at `info` (or `warn` if any driver errored, `:198-216`). This is the staging→active→decay→GC cadence: `checkAndPromote` promotes due staging entries, `checkTimeouts` ages out lifecycle states, `checkAndExecute` executes/expires proposals, `scanAll` scans for decayed recipes.

#### Daemon-less "tick-on-access" note

There is no dedicated tick-on-access component in `lib/service/`. The daemon-less automation is realized because **every driver used by the sweep is independently callable on demand** through the same Core services:

- `UiStartupTasks` calls `stagingManager.checkAndPromote()` (stage 2) and `proposalExecutor.checkAndExecute()` (stage 5) at daemon-ready (§14.6).
- The governance HTTP routes call `decayDetector.scanAll()` and `stagingManager.checkAndPromote()` on request (`lib/http/routes/governance.ts:43-83`).
- The CLI calls `proposalExecutor.checkAndExecute()` (`bin/cli.ts:1161-1167`).

So in a daemon-less deployment, promotion/timeout/proposal/decay progress happens whenever a tool/route/CLI access touches these Core services; `EvolutionMaintenanceSweep` is the *periodic* variant that batches all four at a fixed cadence when a long-lived daemon is available. If you cannot verify a specific caller, treat "tick-on-access" as "the Core drivers are called directly by the accessing surface," not as a separate scheduler in this repo.

---

### 14.13 Handler-runtime contract — `envelope`, `problem`, `types`

These three files define the response/context contract for host-owned resident and tool handlers (consumed by HTTP routes; `BootstrapRefine` uses `envelope`).

- **`envelope.ts`** — `envelope({success, data, message, meta, errorCode, problem})` (`:30`) returns a normalized `{success, errorCode, message, data, [problem], meta:{tool?, version, responseTimeMs?, source?}}`. `version` defaults to `'2.0.0'` (`:41`); `problem` is included only when present (`:48`). Both a named and default export.
- **`problem.ts`** — `buildToolUsageProblem(options)` (`:44`) constructs a `ToolUsageProblem` (`:22`) by joining caller-supplied `{code, reasonCode, failingStep, nextAction, retryable?, fieldProblems?}` with the **Core failure taxonomy** entry (`getCoreFailureTaxonomyEntry(reasonCode)` from `@alembic/core/shared`), which supplies `failureId`/`problemClass`/`retryPolicy`/default `retryable` and stamps `taxonomyVersion = CORE_FAILURE_TAXONOMY_VERSION`. This is the MT3/D25 machine-readable error surface the certification harness reads.
- **`types.ts`** — runtime-free interfaces: the minimal DI shape `McpServiceContainer`/`McpContext` (`:26`/`:72`), search/browse/candidate/consolidated handler arg types, `KnowledgeEntryJSON` (the read-only projection used by `BootstrapRefine`, `:127`), plus re-exports of Core types (`BootstrapFile`, `IncrementalPlan`, `SaveSnapshotParams`, `DimensionCheckpointResult`, `LoggerLike`). The header flags that this file was relocated out of the deleted `lib/resident/` MCP-mirror layer and that some handler-arg interfaces are now orphaned pending an RIC-4 trim (`:1-9`) — so not every interface here has a live consumer.

---

### 14.14 End-to-end flows

**Cold-start bootstrap (host-owned orchestration; Core/Agent do the work):**

1. `ColdStartWorkflow` builds a `CleanupService` and runs `fullReset` (fail-closed) to clear DB + caches (`ColdStartWorkflow.ts:130-142`).
2. `BootstrapTaskManager.startSession(taskDefs)` seeds skeleton tasks and emits `bootstrap:started` (`BootstrapTaskManager.ts:259`).
3. For each dimension, the ai-execution workflow calls `BootstrapEventEmitter.emitDimensionStart/Complete/Failed`, which flips task state and emits `bootstrap:task-*` on both channels.
4. On `isAllDone`, `#finishSession` emits `bootstrap:all-completed` + a `lifecycle` signal (`:614`).
5. Optionally `bootstrapRefine` polishes pending candidates (Phase 6), reusing the dual channel via `emitProgress`.

**Reactive evolution (daemon):** filesystem change → `DaemonFileChangeCollector` (native or git) diffs + dispatches → `FileChangeDispatcher` → `InProcessFileChangeHandler` submits proposals through Core's `EvolutionGateway` and emits quality signals → merged `ReactiveEvolutionReport` returned to the caller.

**Reactive evolution (external host):** `POST /api/v1/file-changes` → validate/path-guard → `FileChangeDispatcher.dispatch` → same handler → report in HTTP body.

**Periodic maintenance (daemon):** `EvolutionMaintenanceSweep` ticks every ~60s → `checkAndPromote` / `checkTimeouts` / `checkAndExecute` / `scanAll` on Core services (capped, single-flight).

**Background refresh (daemon-ready):** `runUiStartupTasks` runs six independent stages (sync/promote/reconcile/refresh/proposal-cleanup/signal-subscribe) against Core services.

---

### 14.15 External interfaces

**Emitted events (EventBus + Socket.io):** `bootstrap:started`, `bootstrap:task-started`, `bootstrap:task-completed`, `bootstrap:task-failed`, `bootstrap:all-completed`, `bootstrap:process-events`, and the `refine:*` family (`refine:started/item-started/item-completed/item-failed/completed`).

**HTTP route:** `POST /api/v1/file-changes` (body `{events: FileChangeEvent[]}` → `ReactiveEvolutionReport`).

**Env toggles:** `ALEMBIC_DAEMON_FILE_CHANGES=0` (disable collector), `ALEMBIC_DAEMON_FILE_CHANGE_INTERVAL_MS`, `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP=0` (disable sweep), `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP_CAP`, `ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP_INTERVAL_MS`.

**DB tables touched by `CleanupService`:** cleared in `fullReset` — `lifecycle_transition_events`, `recipe_source_refs`, `recipe_warnings`, `evolution_proposals`, `knowledge_edges`, `bootstrap_dim_files`, `knowledge_entries`, `bootstrap_snapshots`, `guard_violations`, `audit_logs`, `sessions`, `token_usage`, `semantic_memories`, `code_entities`, `source_graph_*` (4), `git_diff_checkpoints`, `coverage_ledger`, `deep_mining_rounds`, `project_context_file_snapshots`, plus `tasks`/`task_dependencies`/`task_events`. Snapshot-exported subset listed at `CleanupService.ts:706-716`.

**DI singletons produced/consumed here:** `bootstrapTaskManager`, `fileChangeHandler` (`InProcessFileChangeHandler`), `fileChangeDispatcher`, `daemonFileChangeCollector`(+`…Status`), `evolutionMaintenanceSweep` (see `KnowledgeModule.ts:352-374`, `bin/daemon-server.ts:194-224`).

**Exported host APIs:** `envelope`, `buildToolUsageProblem`, `dedupeFileChangeEvents`/`createFileChangeDispatchToken`, `mergeAgentEfficiencySummaries`/`normalizeAgentEfficiencySummary`/`extractEfficiencyFromDiagnostics`, `formatPublishedTitles`, `resolveEvolutionMaintenanceSweepCap`/`…IntervalMs`, and the `TaskStatus` enum.

---

### 14.16 Boundary note — host-owned here vs delegated

**Host-owned (implemented in this repo, `lib/service/` + `bin/`):**

- Bootstrap *session* state machine, progress fan-out, abort/cancel semantics (`BootstrapTaskManager`).
- Unified dimension-event adaptation and typed payloads (`BootstrapEventEmitter`, `bootstrap-event-types`).
- Phase-6 refine *orchestration* — prompt assembly, key normalization, diff-based update decisions (`BootstrapRefine`). The AI itself is provider-injected.
- Efficiency normalize/merge arithmetic (`BootstrapEfficiency`) — over an Agent-owned *type*.
- The entire trash-bin cleanup/GC model, FK-ordered table clearing, fail-closed reset (`CleanupService`).
- File-change *production* (native watch + git poll, rename detection, dedup/idempotency) and *fan-out* (`DaemonFileChangeCollector`, `FileChangeDispatcher`).
- The *scheduling* of evolution: per-event reactive routing (`InProcessFileChangeHandler` deciding which action/confidence to submit) and the bounded periodic driver (`EvolutionMaintenanceSweep`).
- The HTTP ingress, path-safety validation, and post-ready background-refresh sequencing.
- The host response envelope + problem-object construction (`envelope`, `problem`) and DI/handler context shapes (`types`).

**Delegated to `@alembic/core` (imported, not implemented here):**

- Lifecycle/evolution engine: `EvolutionGateway.submit`, `stagingManager.checkAndPromote`, `lifecycleStateMachine.checkTimeouts`, `proposalExecutor.checkAndExecute`, `decayDetector.scanAll` — all *judgments* (promotion, timeout, proposal policy, decay scoring) are Core's.
- Impact scoring: `assessFileImpact`, `extractRecipeTokens`, `ContentPatcher` (`@alembic/core/evolution`).
- Knowledge persistence/sync: `KnowledgeSyncService`, `SourceRefReconciler`, `KnowledgeRepository`/`SourceRefRepository`, `isConsumable`/`isDegraded`/`CONSUMABLE_LIFECYCLES`/`lifecycleInSql`.
- Config path resolution + dimension helpers (`getProjectRecipesPath` etc., `recipeDimensionIdOrUnknown`, `resolveDataRoot`).
- Failure taxonomy (`getCoreFailureTaxonomyEntry`, `CORE_FAILURE_TAXONOMY_VERSION`), job-process contract (`CreateJobProcessEventInput`, `JobProcessEventRecorder`), `timerRegistry`, `Logger`, `EventBus`/`SignalBus`.
- Skill-delivery receipt/validation types (`@alembic/core/host-agent-workflows`).

**Delegated to `@alembic/agent`:**

- `AgentEfficiencySummary` type (`@alembic/agent/runtime`) — this repo only normalizes/merges instances of it.
- The actual dimension AI runs (`AgentRuntime.execute`, into which the session `AbortSignal` is threaded) are Agent-owned; this layer only supplies the signal and records the outcome.

Anything unverified is flagged inline above (notably: `RESCAN_CLEAN_TABLES` and `FORCE_RESCAN_CLEAN_TABLES` are currently identical despite the documented "keep incremental evidence" distinction, and there is no standalone tick-on-access scheduler class — the daemon-less path is direct Core-driver calls from accessing surfaces).


---


## 15. Sandbox & Seatbelt Execution

This section documents the macOS **Seatbelt** (`sandbox-exec`) sandbox that the Alembic main body uses to run untrusted shell commands and tool-generated code. It is the isolation layer behind the in-process agent's `terminal.exec` tool and (by design intent) Tool-Forge generated-code validation. Everything in this section lives entirely in `Alembic/lib/sandbox/**` and is **host-owned**: it is the OS-level enforcement adapter, not part of the `@alembic/core` engine.

The subsystem is a small, self-contained module group with no dependency on the DI container, Core repositories, or the agent runtime. Its only in-repo consumer is `lib/tools/v2/ToolContextFactory.ts`, which wraps it in a bridge and injects it into every V2 `ToolContext` (`lib/tools/v2/ToolContextFactory.ts:155`).

### 15.1 Responsibilities & role in the system

The sandbox module converts a **declarative execution intent** (network posture, filesystem posture, project root, timeout) into a concrete **macOS Seatbelt profile** and spawns a target binary under `/usr/bin/sandbox-exec`. It is responsible for:

- **Policy synthesis** — translating high-level intent (`network: 'none' | 'allowlisted' | 'open'`, `filesystem: 'read-only' | 'project-write' | 'workspace-write'`) into a concrete `SandboxProfile` with explicit read/write/deny paths, a network posture, an env allow/strip list, and resource limits (`lib/sandbox/SandboxPolicy.ts:178`).
- **Profile generation** — emitting a valid SBPL (Sandbox Profile Language) string with a deny-by-default posture (`lib/sandbox/SeatbeltProfileBuilder.ts:12`).
- **Sandboxed spawn** — writing the profile to a temp `.sb` file and running `sandbox-exec -f <profile> <bin> <args>` in a detached process group with timeout / output-cap / abort enforcement (`lib/sandbox/SandboxExecutor.ts:127`).
- **Environment sanitization** — passthrough-allowlisting host env vars, injecting sandbox markers (`HOME`→tempDir, `SANDBOX=1`), and stripping secrets (`lib/sandbox/SandboxEnvironment.ts:12`).
- **Network mediation** — an allowlist HTTP `CONNECT` proxy so that "allowlisted" network commands can only reach approved domains (`lib/sandbox/SandboxNetworkProxy.ts:30`).
- **Capability detection & graceful degradation** — probing for `sandbox-exec` availability and detecting binaries that cannot be nested inside a sandbox (`lib/sandbox/SandboxProbe.ts`).
- **Audit** — parsing Seatbelt violation lines out of stderr and summarizing them for logging (`lib/sandbox/SandboxViolationParser.ts`).

The security model is **read-mostly + allowlist + sandbox audit**: reads are broadly allowed (with a small deny list for secrets), writes are confined to a per-run temp dir plus optionally the project root, network is denied unless explicitly allowlisted via a proxy, and every denied operation the sandbox records is parsed back out and logged.

> **Platform note:** This is macOS-only. Enforcement depends on `/usr/bin/sandbox-exec`. On non-macOS hosts (or when `sandbox-exec` is absent) the executor **degrades to a direct spawn** with only environment sanitization — see §15.5. Nothing here provides Linux/Windows OS-level isolation.

### 15.2 Key types, functions & files

#### Module map

| File | Role |
|------|------|
| `lib/sandbox/SandboxPolicy.ts` | Types (`SandboxProfile`, `SandboxInput`, `SandboxMode`) + policy synthesis (`buildSandboxProfile`) + env config readers |
| `lib/sandbox/SeatbeltProfileBuilder.ts` | `buildSeatbeltProfile` — SBPL string generation |
| `lib/sandbox/SandboxExecutor.ts` | `sandboxExec` — orchestration, spawn, degradation, timeout/abort, violation summary |
| `lib/sandbox/SandboxEnvironment.ts` | `buildSandboxEnvironment` / `buildTerminalEnvironmentWithSandbox` — env sanitize |
| `lib/sandbox/SandboxNetworkProxy.ts` | `startSandboxProxy` — allowlist CONNECT proxy |
| `lib/sandbox/SandboxProbe.ts` | `isSandboxExecAvailable`, `hasNestedSandboxConflict`, `getSandboxExecPath` |
| `lib/sandbox/SandboxViolationParser.ts` | `parseSandboxViolations`, `summarizeViolations` |

The module is reachable in-repo via the `#sandbox/*` path alias (`package.json:55-57`, mapping `#sandbox/*` → `./lib/sandbox/*` in dev and `./dist/lib/sandbox/*` by default). `ToolContextFactory` imports it lazily via `await import('#sandbox/SandboxExecutor.js')` / `'#sandbox/SandboxPolicy.js'` (`lib/tools/v2/ToolContextFactory.ts:72-73`) to avoid pulling the heavy dependency chain (Logger, probe) at module load.

#### Core types (`lib/sandbox/SandboxPolicy.ts`)

- `SandboxMode = 'enforce' | 'audit' | 'disabled'` (`lib/sandbox/SandboxPolicy.ts:5`).
- `SandboxProfile` (`lib/sandbox/SandboxPolicy.ts:7`) — the fully-resolved, OS-facing policy:
  - `filesystem: { readPaths, writePaths, denyPaths, tempDir }`
  - `network: { allow, proxyPort?, allowedDomains }`
  - `environment: { passthrough, inject, strip }`
  - `limits: { timeoutMs, maxOutputBytes }`
- `SandboxInput` (`lib/sandbox/SandboxPolicy.ts:35`) — the declarative caller intent: `network` (`'none' | 'allowlisted' | 'open'`), `filesystem` (`'read-only' | 'project-write' | 'workspace-write'`), `cwd`, `projectRoot`, `timeoutMs`, optional `maxOutputBytes`, optional `env`.

> **Gotcha — `SandboxInput.cwd` is unused by policy synthesis.** `buildSandboxProfile` reads `projectRoot`, `filesystem`, `network`, `timeoutMs`, `maxOutputBytes`, and `env`, but never `input.cwd` (verified across `lib/sandbox/SandboxPolicy.ts:178-249`). The cwd is applied later at spawn time by the executor (`options.cwd` → `spawn(..., { cwd })`, `lib/sandbox/SandboxExecutor.ts:143`). The profile grants write to `projectRoot`, not to `cwd`; if `cwd` is outside `projectRoot`, writes to it are denied unless it happens to fall under `tempDir`.

#### Executor interfaces (`lib/sandbox/SandboxExecutor.ts`)

- `SandboxExecOptions` (`lib/sandbox/SandboxExecutor.ts:17`): `bin`, `args`, `cwd`, `env`, `timeout`, `maxBuffer`, optional `signal` (AbortSignal), optional `stdin`.
- `SandboxExecResult` (`lib/sandbox/SandboxExecutor.ts:28`): `stdout`, `stderr`, `exitCode`, `sandboxed` (bool), optional `degradeReason`, optional `violations` (`{ count, operations, paths }`).

### 15.3 Policy synthesis — `buildSandboxProfile` (control & data flow)

`buildSandboxProfile(input: SandboxInput): SandboxProfile` (`lib/sandbox/SandboxPolicy.ts:178`) is the single entry point that turns intent into a concrete OS policy. Steps:

1. **Global mode gate.** `getSandboxMode()` (`lib/sandbox/SandboxPolicy.ts:102`) reads `ALEMBIC_SANDBOX_MODE`: `disabled`/`0`/`off` → `disabled`; `audit` → `audit`; anything else (including unset) → `enforce` (default-on). If the global mode is `disabled`, the constant `DISABLED_PROFILE` is returned immediately (`lib/sandbox/SandboxPolicy.ts:180`, constant at `:94`), short-circuiting all path/network work.
2. **Temp dir.** `buildSandboxTempDir()` (`lib/sandbox/SandboxPolicy.ts:159`) creates a unique path under the **realpath-resolved** `os.tmpdir()` named `alembic-sandbox-<ts>-<rand>`. Realpath resolution matters on macOS where `/var` → `/private/var`; the SBPL rules must reference the real path or they won't match.
3. **Read paths** (`lib/sandbox/SandboxPolicy.ts:188-206`): the realpath-resolved `projectRoot` plus a fixed set of system/toolchain roots (`/usr/lib`, `/usr/bin`, `/usr/share`, `/Library/Frameworks`, `/System/Library`, `/Applications/Xcode.app`, `/bin`, `/sbin`, `/private/tmp`, `/private/var/folders`, `/etc`, `/dev`, `/var/run`, `~/Library/Developer`), Homebrew prefixes (`homebrewPaths()` → `HOMEBREW_PREFIX` or `['/opt/homebrew','/usr/local']`, `:135`), plus operator-supplied `getExtraReadPaths()` from `ALEMBIC_SANDBOX_EXTRA_READ_PATHS` (`:124`). **Note:** these `readPaths` are collected into the profile but the SBPL builder does *not* enumerate them — it allows all reads globally (see §15.4); the list is effectively documentation/audit metadata today.
4. **Write paths** (`lib/sandbox/SandboxPolicy.ts:208-211`): always `[tempDir]`; the realpath-resolved `projectRoot` is appended when `filesystem` is `project-write` or `workspace-write`. `read-only` grants no project write.
5. **Deny paths** (`lib/sandbox/SandboxPolicy.ts:213-220`): `~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.config/gh`, `<projectRoot>/.env`, `<projectRoot>/.git`. These become the highest-priority SBPL deny rules and override the global read-allow.
6. **Network posture** (`lib/sandbox/SandboxPolicy.ts:222-224`): `allow = input.network !== 'none'`; `allowedDomains` = `getConfiguredAllowedDomains()` (from `ALEMBIC_SANDBOX_ALLOWED_DOMAINS`, `:113`) only when `network === 'allowlisted'`; `needsProxy = allow && allowedDomains.length > 0`. `proxyPort` is set to the sentinel `-1` when a proxy is needed (meaning "executor must dynamically allocate"), else `undefined` (`:232`).
7. **Environment** (`lib/sandbox/SandboxPolicy.ts:234-243`): `passthrough = ENV_PASSTHROUGH` (`:45`), `inject = { HOME: tempDir, TMPDIR: tempDir, SANDBOX: '1', ...input.env }`, `strip = ENV_STRIP` (`:73`).
8. **Limits** (`lib/sandbox/SandboxPolicy.ts:244-247`): `timeoutMs = input.timeoutMs`, `maxOutputBytes = input.maxOutputBytes ?? 1_048_576` (1 MiB default).

`summarizeSandboxProfile(profile)` (`lib/sandbox/SandboxPolicy.ts:252`) produces a compact audit record (mode, network flags, path/env counts) suitable for logging without leaking the concrete paths.

#### Env allowlist / striplist

| Category | Values (source) |
|----------|-----------------|
| **Passthrough** (`ENV_PASSTHROUGH`, `:45`) | `PATH`, `LANG`, `LC_ALL`, `LC_CTYPE`, `TERM`, `DEVELOPER_DIR`, `SDKROOT`, `MACOSX_DEPLOYMENT_TARGET`, `SWIFT_DETERMINISTIC_HASHING`, `NODE_PATH`, `RUBY_VERSION`, `GEM_HOME`, `GEM_PATH`, `GOPATH`, `GOROOT`, `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `HOMEBREW_PREFIX`, `HOMEBREW_CELLAR`, `CI`, `GIT_PAGER`, `GIT_TERMINAL_PROMPT`, `LESS`, `PAGER` |
| **Strip** (`ENV_STRIP`, `:73`) | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `SSH_AUTH_SOCK`, `SSH_AGENT_PID`, `NPM_TOKEN`, `YARN_TOKEN`, `DOCKER_HOST`, `KUBECONFIG`, `DATABASE_URL`, `REDIS_URL`, `ALEMBIC_AI_API_KEY` |

#### Environment variable inputs

| Env var | Read by | Effect |
|---------|---------|--------|
| `ALEMBIC_SANDBOX_MODE` | `getSandboxMode` (`:102`) | `disabled`/`0`/`off` → disabled; `audit` → audit; else enforce (default) |
| `ALEMBIC_SANDBOX_ALLOWED_DOMAINS` | `getConfiguredAllowedDomains` (`:113`) | comma-separated allowlist for `network: 'allowlisted'` |
| `ALEMBIC_SANDBOX_EXTRA_READ_PATHS` | `getExtraReadPaths` (`:124`) | comma-separated extra read roots added to `readPaths` |
| `HOMEBREW_PREFIX` | `homebrewPaths` (`:135`) | overrides default `/opt/homebrew`,`/usr/local` read roots |
| `HOME` | `buildSandboxProfile` (`:185`) | base for deny paths (`~/.ssh` etc.); fallback `/tmp` |
| `ALEMBIC_SANDBOX_NESTED_CONFLICT_BINS` | `getNestedConflictBins` (`SandboxProbe.ts:50`) | extends the nested-conflict binary set |

### 15.4 SBPL generation — `buildSeatbeltProfile`

`buildSeatbeltProfile(profile): string` (`lib/sandbox/SeatbeltProfileBuilder.ts:12`) emits a Seatbelt profile string. Structure (in emission order):

1. **Header** — `(version 1)` then `(deny default)` — deny-by-default (`lib/sandbox/SeatbeltProfileBuilder.ts:14-15`).
2. **Base system allowances** (`lib/sandbox/SeatbeltProfileBuilder.ts:21-26`): `(allow process*)`, `(allow signal)`, `(allow sysctl*)`, `(allow mach*)`, `(allow ipc*)`, `(allow system*)`. These are deliberately broad wildcards; the source comment (`:18-20`) explains that the macOS dynamic linker and system frameworks require a wide set of these operations, and that **security is enforced through the filesystem and network rules instead**.
3. **Filesystem deny (highest priority)** (`lib/sandbox/SeatbeltProfileBuilder.ts:30-38`): for each non-empty `denyPaths` entry, emit `(deny file-read* (subpath <p>))` and `(deny file-write* (subpath <p>))`. In SBPL a later same-priority rule wins, and because these deny rules are emitted before the global read-allow, they override it for secret paths (`.ssh`, `.aws`, `.env`, `.git`, etc.).
4. **Filesystem read** (`lib/sandbox/SeatbeltProfileBuilder.ts:40-44`): `(allow file-read*)` globally. Per the inline comment, dyld/frameworks/toolchains read from too many scattered paths to enumerate reliably, so reads are broadly allowed and only the deny list carves out secrets. This is the "read-mostly" half of the security model — `profile.filesystem.readPaths` is **not** used to constrain reads.
5. **Filesystem write** (`lib/sandbox/SeatbeltProfileBuilder.ts:47-55`): one `(allow file-write* (subpath <p>))` per non-empty `writePaths` entry (subpath = recursive), plus `(allow file-write* (literal "/dev/null"))`.
6. **Network** (`lib/sandbox/SeatbeltProfileBuilder.ts:57-71`), three branches:
   - **No network** (`!profile.network.allow`): `(deny network-outbound)`, then re-allow DNS `(allow network-outbound (local udp "*:53"))` and `(allow network-outbound (remote unix-socket))`.
   - **Proxy** (`proxyPort > 0`): deny outbound, allow DNS, allow `(remote tcp "localhost:<proxyPort>")`, allow unix-socket. All real traffic must go through the localhost proxy.
   - **Open** (allow, no proxy): `(allow network-outbound)`.
   - Always `(deny network-inbound)`.

`sbplQuote(value)` (`lib/sandbox/SeatbeltProfileBuilder.ts:76`) wraps a path in double quotes and escapes backslashes and quotes — the injection guard for path values placed into the SBPL text.

> **Gotcha — `audit` mode produces an identical, enforcing profile.** The profile builder never branches on `profile.mode`; it only looks at network/filesystem. `sandbox-exec -f` always *enforces* the rules it is given. So `ALEMBIC_SANDBOX_MODE=audit` differs from `enforce` only in that it is **not** `disabled` (i.e., it still builds and runs a full enforcing profile). There is no "log-but-allow" audit mode wired here today — `audit` behaves like `enforce`. This is confirmed by the executor path never inspecting `mode` beyond the `disabled` check (`lib/sandbox/SandboxExecutor.ts:49`). The DISABLED_PROFILE network block (`allow: true`) is only relevant for the non-Seatbelt env-compat path in `SandboxEnvironment.ts`, since `disabled` never reaches the builder.

### 15.5 Execution — `sandboxExec` (control & data flow)

`sandboxExec(options, profile): Promise<SandboxExecResult>` (`lib/sandbox/SandboxExecutor.ts:45`) is the orchestrator. Flow:

1. **Disabled mode** (`:49`): if `profile.mode === 'disabled'`, call `directExec(options, 'disabled')` — a plain unsandboxed spawn.
2. **Availability probe** (`:53`): `await isSandboxExecAvailable()`. If false (e.g. non-macOS), log a warning and `directExec(options, 'sandbox-exec-unavailable')`.
3. **Nested-conflict check** (`:59`): if `hasNestedSandboxConflict(options.bin)` (e.g. `xcodebuild`, `swift`), macOS cannot nest sandboxes, so build a sanitized env and `directExec(..., 'nested-sandbox-conflict')` — **environment-only isolation, no OS sandbox**.
4. **Proxy startup** (`:67-79`): clone the profile into `effectiveProfile`. If `network.proxyPort === -1` and there are `allowedDomains`, start the allowlist proxy (`startSandboxProxy`) and set `effectiveProfile.network.proxyPort = proxy.port`. On proxy-start failure it logs a warning and **fails closed**: `network.allow = false`, `proxyPort = undefined` (so the SBPL denies outbound network entirely).
5. **Env build + proxy vars** (`:81-88`): `buildSandboxEnvironment(options.env, effectiveProfile)`; if a proxy is running, inject `http_proxy`/`https_proxy`/`HTTP_PROXY`/`HTTPS_PROXY` = `http://127.0.0.1:<port>`.
6. **Temp dir + profile file** (`:90-97`): `mkdir -p` the profile's `tempDir`; build the SBPL string; write it to `os.tmpdir()/alembic-sandbox-<ts>-<rand>.sb` with mode `0o400` (owner-read-only).
7. **Spawn under sandbox** (`:100`, `execInSandbox`): run `/usr/bin/sandbox-exec -f <profilePath> <bin> <args>` — see below.
8. **Violation parse** (`:108-114`): parse and summarize violations from stderr; log a summary if any.
9. **Cleanup** (`finally`, `:116-124`): stop the proxy, `unlink` the `.sb` file, and recursively `rm` the temp dir. All cleanup errors are swallowed.
10. Return `{ ...result, sandboxed: true, violations }`.

#### `execInSandbox` — the actual spawn (`lib/sandbox/SandboxExecutor.ts:127`)

- `spawn(getSandboxExecPath(), ['-f', profilePath, bin, ...args], { cwd, env, stdio: ['pipe','pipe','pipe'], detached: true })` (`:141-147`). `detached: true` puts the child in its own **process group** so the whole tree can be killed.
- **Timeout** (`:170-173`): a `setTimeout(options.timeout)` that sets `killed = true` and calls `killProcessTree(child.pid)`.
- **Abort** (`:166-174`): the optional `AbortSignal` `abort` listener also kills the tree; listener is `{ once: true }` and removed in `finish`.
- **Output cap** (`:176-191`): stdout/stderr chunks accumulate; when `stdoutBytes + stderrBytes > options.maxBuffer` the tree is killed. (Note the cap kills the process; it does not truncate-and-continue.)
- **Settlement** (`:156-164`, `:193-202`): a `settled` guard ensures single-resolution; on `close`, `exitCode = code ?? (killed ? 137 : 1)` (137 = SIGKILL convention).
- **stdin** (`:204-208`): if `options.stdin` provided, write and end; else just end.
- `killProcessTree(pid)` (`:271`): `process.kill(-pid, 'SIGKILL')` (negative pid = whole group), falling back to `process.kill(pid, 'SIGKILL')`, both wrapped so an already-exited process is ignored.

#### `directExec` — degradation path (`lib/sandbox/SandboxExecutor.ts:212`)

Used for `disabled`, `sandbox-exec-unavailable`, and `nested-sandbox-conflict`. It `spawn`s the target binary directly (not detached), with the same timeout/abort/settlement machinery, but on kill it uses `child.kill('SIGKILL')` on the single process (not the group). It returns `sandboxed: false` and a `degradeReason`. **Important:** `directExec` does *not* enforce `maxBuffer` (no byte-cap listeners — compare `:248-249` with the sandboxed path's `:176-191`), so a runaway command in degraded mode can accumulate unbounded output in memory.

> **Gotcha — nested-conflict path sanitizes env twice.** In the nested-conflict branch the executor calls `buildSandboxEnvironment(options.env, profile)` (`:63`) and passes the result to `directExec`. The `disabled`/`unavailable` branches call `directExec(options, ...)` with the **original** `options.env` (no sanitization). So env-stripping of secrets only happens on the nested-conflict degrade path and on the fully-sandboxed path — not on the `disabled` or `sandbox-exec-unavailable` degrade paths.

### 15.6 Environment building (`lib/sandbox/SandboxEnvironment.ts`)

`buildSandboxEnvironment(commandEnv, profile)` (`lib/sandbox/SandboxEnvironment.ts:12`) builds the clean env in a strict order (this order is the security-critical part):

1. Copy only `profile.environment.passthrough` keys that exist in host `process.env` (`:18-23`).
2. `Object.assign` the command-level `commandEnv` (`:25`).
3. `Object.assign` the profile's `inject` map (`HOME`/`TMPDIR`→tempDir, `SANDBOX=1`, plus caller `input.env`) (`:26`).
4. **Delete every key in `profile.environment.strip` last** (`:28-30`) — so even if a secret was smuggled in via `commandEnv`, it is removed. Strip wins over passthrough and inject.

`buildTerminalEnvironmentWithSandbox(hostEnv, commandEnv, profile)` (`lib/sandbox/SandboxEnvironment.ts:39`) is a **compatibility shim**: when `profile` is null or `disabled` it returns the full host env merged with a few terminal-friendliness vars (`CI=1`, `GIT_PAGER=cat`, `GIT_TERMINAL_PROMPT=0`, `LESS=-FRX`, `PAGER=cat`); otherwise it delegates to `buildSandboxEnvironment` (the sanitizing path). As of this reading, `buildTerminalEnvironmentWithSandbox` has **no runtime consumer in `lib/`/`bin/`** — the only references are its own definition and `test/unit/SandboxEnvironment.test.ts`. The live path (`ToolContextFactory` bridge) sets terminal-friendliness vars itself (`TERM: 'dumb'`, `NO_COLOR: '1'`) and calls `sandboxExec`, which internally uses `buildSandboxEnvironment`.

### 15.7 Network proxy (`lib/sandbox/SandboxNetworkProxy.ts`)

`startSandboxProxy(options): Promise<ProxyHandle>` (`lib/sandbox/SandboxNetworkProxy.ts:30`) creates an HTTP proxy bound to `127.0.0.1:0` (ephemeral port; `:73`) that only honors the `CONNECT` method:

- A plain HTTP request (non-CONNECT) gets `405 Only CONNECT method is supported` (`:36-39`).
- On `connect` (`:41-69`): parse `hostname:port` from `req.url` (default port 443, `:44`). Check `isDomainAllowed(hostname, domainSet)`.
  - **Denied** (`:46-52`): increment `blocked`, log, write `HTTP/1.1 403 Forbidden`, end the socket.
  - **Allowed** (`:54-60`): increment `connections`, `net.connect(port, hostname)`, reply `200 Connection Established`, and pipe both directions to form a TCP tunnel.
- `isDomainAllowed(hostname, allowed)` (`:106`): case-insensitive exact match, **or** suffix match `hostname.endsWith('.' + d)` — so allowlisting `github.com` also permits `api.github.com` but not a lookalike like `evilgithub.com`.
- `ProxyHandle` (`:22`) exposes live `connections`/`blocked` getters (`:82-87`) and a `stop()` that closes the server with a 2s safety timeout (`:88-92`).

The proxy is the enforcement mechanism for `network: 'allowlisted'`: the SBPL only allows TCP to `localhost:<proxyPort>` and DNS, so the sandboxed process **must** route through this proxy, and the proxy enforces the domain allowlist. TLS is tunneled opaquely (CONNECT), so the proxy sees only the SNI-less `CONNECT host:port` line, not payload — it filters on destination host, not content.

> **Edge cases:** if the requested port isn't 443/parseable, `Number.parseInt(portStr || '443')` handles a missing port but a malformed port yields `NaN`; the domain check still runs and, if allowed, `net.connect(NaN, host)` would fail and trigger the `serverSocket` error handler (`:62-65`). Upstream connect errors close the client socket. There is no per-connection timeout on the tunnel itself.

### 15.8 Capability probe (`lib/sandbox/SandboxProbe.ts`)

- `SANDBOX_EXEC_PATH = '/usr/bin/sandbox-exec'` (`lib/sandbox/SandboxProbe.ts:4`); `getSandboxExecPath()` returns it (`:76`).
- `isSandboxExecAvailable()` (`:20`): `fs.access(path, X_OK)`; result cached in module-level `_sandboxExecAvailable` (checked at `:21`). `isSandboxExecAvailableSync()` (`:34`) returns the cached value or `null` if never probed. `resetSandboxProbeCache()` (`:39`, test-only) clears both caches.
- `hasNestedSandboxConflict(bin)` (`:71`): returns true if `path.basename(bin)` is in the nested-conflict set. Built-in set (`BUILTIN_NESTED_CONFLICT_BINS`, `:6`): `xcodebuild`, `swift`, `swiftc`, `xcrun`, `simctl`, `actool`, `ibtool`, `codesign`. `getNestedConflictBins()` (`:46`) merges in `ALEMBIC_SANDBOX_NESTED_CONFLICT_BINS` (comma-separated) and caches the union. Rationale (`:63-69`): these Apple toolchain binaries bring their own internal sandbox and crash when wrapped by an outer `sandbox-exec`.

> **Gotcha — basename-only matching.** The conflict check matches on `path.basename(bin)`. The live bridge always spawns `bin = '/bin/sh'` (`ToolContextFactory.ts:92`), so an inner `xcodebuild` invoked *inside* the shell command is not detected as a nested conflict — the shell runs sandboxed and the toolchain call inside it would then hit the nesting problem at runtime. Nested-conflict detection only fires when the *directly spawned* binary is a conflict binary.

### 15.9 Violation parsing (`lib/sandbox/SandboxViolationParser.ts`)

- `SandboxViolation` (`lib/sandbox/SandboxViolationParser.ts:11`): `{ process, pid, operation, path?, raw }`.
- `VIOLATION_RE` (`:19`): `/^sandbox:\s+(\S+)\((\d+)\)\s+deny\(\d+\)\s+(\S+)(?:\s+(.+))?$/gm` — matches Seatbelt's stderr lines like `sandbox: <proc>(<pid>) deny(1) file-write-create /path`.
- `parseSandboxViolations(stderr)` (`:21`) iterates matches into typed records.
- `summarizeViolations(violations)` (`:39`): counts by operation into `operations: Record<string, number>` and collects up to the first 10 offending `paths` (`:49`). This summary is what `sandboxExec` logs (`SandboxExecutor.ts:110-114`) and returns in `SandboxExecResult.violations`.

Violations are advisory/audit-only — they are logged and surfaced in the result, but `sandboxExec` does not treat their presence as an error or change the exit code. The denied operation was already blocked by the kernel; parsing merely explains *what* was blocked.

### 15.10 External interfaces

This subsystem exposes **no CLI commands, HTTP routes, DB tables, or emitted domain events of its own**. It is a library consumed in-process. Its surfaces are:

| Surface kind | Detail |
|--------------|--------|
| Exported API (executor) | `sandboxExec`, `SandboxExecOptions`, `SandboxExecResult` (`SandboxExecutor.ts`) |
| Exported API (policy) | `buildSandboxProfile`, `summarizeSandboxProfile`, `getSandboxMode`, `getConfiguredAllowedDomains`, `getExtraReadPaths`, types `SandboxProfile`/`SandboxInput`/`SandboxMode` (`SandboxPolicy.ts`) |
| Exported API (builder) | `buildSeatbeltProfile` (`SeatbeltProfileBuilder.ts`) |
| Exported API (env) | `buildSandboxEnvironment`, `buildTerminalEnvironmentWithSandbox` (`SandboxEnvironment.ts`) |
| Exported API (proxy) | `startSandboxProxy`, types `ProxyOptions`/`ProxyHandle` (`SandboxNetworkProxy.ts`) |
| Exported API (probe) | `isSandboxExecAvailable`, `isSandboxExecAvailableSync`, `resetSandboxProbeCache`, `hasNestedSandboxConflict`, `getSandboxExecPath` (`SandboxProbe.ts`) |
| Exported API (parser) | `parseSandboxViolations`, `summarizeViolations`, type `SandboxViolation` (`SandboxViolationParser.ts`) |
| Config (env vars) | See table in §15.3 (`ALEMBIC_SANDBOX_MODE`, `_ALLOWED_DOMAINS`, `_EXTRA_READ_PATHS`, `_NESTED_CONFLICT_BINS`) |
| Logging | Via `@alembic/core/logging` `Logger` (`SandboxExecutor.ts:5`, `SandboxNetworkProxy.ts:3`) — `[Sandbox]` / `[SandboxProxy]` prefixed info/warn lines for degrade reasons, proxy start/block, and violation summaries |
| Internal integration point | `ToolContextFactory` injects `sandboxExecutor` into every `ToolContext` (`ToolContextFactory.ts:155`) |

#### The one live wiring — `SandboxExecutorBridge`

`ToolContextFactory` defines a private `SandboxExecutorBridge` (`ToolContextFactory.ts:62`) that adapts `sandboxExec` to the shape the agent's terminal handler expects. `bridge.exec(command, { cwd, projectRoot, timeout, signal })`:

- Builds a profile with a **fixed posture**: `network: 'none'`, `filesystem: 'project-write'` (`ToolContextFactory.ts:75-81`). So the live terminal tool always runs no-network + project-writable + tempdir-writable.
- Runs the command as `/bin/sh -c <command>` (`:90-100`), forcing `TERM: 'dumb'` and `NO_COLOR: '1'`, `maxBuffer: 1 MiB`.
- Maps the result into `{ stdout, stderr, exitCode, diagnostics: { sandboxed, fallbackUsed: !sandboxed, degradeReason? } }` (`:102-111`).

A fresh bridge is constructed once per `ToolContextFactory` (`:135`) and injected into every `ToolContext.sandboxExecutor` (`:155`).

### 15.11 Notable algorithms, gotchas & edge cases (summary)

- **Fail-closed network on proxy error.** Proxy startup failure downgrades to *no network*, not open network (`SandboxExecutor.ts:74-78`).
- **Realpath everywhere for path rules.** `projectRoot` and `tmpdir` are realpath-resolved (`SandboxPolicy.ts:143-157`, `:186`) so SBPL `subpath` rules match the canonical path macOS actually reports in violations.
- **Deny beats read-allow via emission order** (§15.4 step 3–4).
- **`readPaths` is currently inert for enforcement** — reads are globally allowed; the list is metadata (§15.4 step 4).
- **`audit` mode == enforcing** (no log-and-allow variant wired) (§15.4 gotcha).
- **`SandboxInput.cwd` unused in policy; write scope is `projectRoot`, not `cwd`** (§15.2 gotcha).
- **`maxBuffer` enforced only on the sandboxed path**, not in `directExec` (§15.5).
- **Env sanitization skipped on `disabled`/`unavailable` degrade paths** (§15.5 gotcha).
- **Nested-conflict detection is basename-of-directly-spawned-binary only**; `/bin/sh -c '... xcodebuild ...'` slips past (§15.8 gotcha).
- **Temp `.sb` profile written `0o400` and unlinked in `finally`**; temp dir recursively removed (`SandboxExecutor.ts:97`, `:120-123`).
- **Proxy filters on CONNECT destination host, not payload** — TLS is tunneled opaquely; subdomain suffix-matching (§15.7).

### 15.12 Tests (behavioral spec)

The following tests pin the documented behavior (all under `test/`):

- `test/unit/SandboxPolicy.test.ts` — mode gating, path/network synthesis.
- `test/unit/SeatbeltProfileBuilder.test.ts` — SBPL structure and deny/allow ordering.
- `test/unit/SandboxEnvironment.test.ts` — passthrough/strip/inject ordering and the compat shim (`buildTerminalEnvironmentWithSandbox`).
- `test/unit/SandboxProbe.test.ts` — availability cache and nested-conflict set.
- `test/unit/SandboxViolationParser.test.ts` — the violation regex and summary.
- `test/unit/SandboxNetworkProxy.test.ts` — allowlist matching and block/allow behavior.
- `test/integration/SandboxExecution.test.ts` — end-to-end spawn under `sandbox-exec`, gated with `describe.runIf(process.platform === 'darwin')` and an inner `isSandboxExecAvailable()` guard (`test/integration/SandboxExecution.test.ts:60-66`), so it is a no-op on non-macOS / probe-negative hosts.

### 15.13 Boundary note (host-owned vs delegated)

**Host-owned (this repo, `Alembic/lib/sandbox/**`):** the entire OS-level sandbox is implemented here. Policy synthesis (`SandboxPolicy`), SBPL generation (`SeatbeltProfileBuilder`), the `sandbox-exec` spawn / timeout / abort / output-cap / process-group-kill machinery (`SandboxExecutor`), environment sanitization (`SandboxEnvironment`), the allowlist network proxy (`SandboxNetworkProxy`), capability probing (`SandboxProbe`), and violation parsing (`SandboxViolationParser`) are all main-body code with no `@alembic/core` or `@alembic/agent` logic imported. Consistent with the repo boundary rules, sandbox/native/platform isolation is explicitly a host responsibility that must not be moved into Core (`Alembic/CLAUDE.md`, "本仓库必须保留的边界": `lib/sandbox/**`).

**Only external dependency:** `Logger` from `@alembic/core/logging` (`SandboxExecutor.ts:5`, `SandboxNetworkProxy.ts:3`) — a shared logging facility, not engine logic. No Core repository, ProjectContext, Recipe lifecycle, SignalBus, or Guard type is touched here.

**Delegated to `@alembic/agent`:** the *decision to sandbox* and the terminal tool contract live on the agent side. The agent's `terminal` handler (`@alembic/agent` `src/tools/runtime/handlers/terminal.ts`) defines the `SandboxExecutorLike` interface it expects and calls `ctx.sandboxExecutor.exec(...)`, degrading to a plain `execAsync` when no executor is injected (that handler at `terminal.ts:160-198`). The main body **implements and injects** the concrete executor via `SandboxExecutorBridge` (`ToolContextFactory.ts:62`, injected at `:155`). In other words: `@alembic/agent` owns the tool schema, permission/safety policy, and the "sandboxed vs fallback" diagnostics contract; the `Alembic` main body owns the actual Seatbelt implementation behind that contract. The agent never sees `SandboxProfile`, SBPL, or `sandbox-exec` — only the `{ exec(command, opts) }` bridge.

**Tool-Forge validation:** the section brief notes this sandbox is also intended for Tool-Forge generated-code validation. Within `Alembic/lib/sandbox/**` there is no Tool-Forge-specific coupling — the module is generic (`bin`/`args`/`profile`), so any Forge validation path would reuse the same `sandboxExec` entry point. I did not find a Tool-Forge caller of `sandboxExec` inside this repo's `lib/`/`bin/` (the only in-repo consumer is `ToolContextFactory`); Tool-Forge orchestration itself lives on the `@alembic/agent` / Core side and is out of scope for this section. This is stated as an unverified boundary rather than asserted.


---


## 16. Governance Gateway, Tool Adapters, Platform & Project Scope

This section covers four host-owned subsystems that sit at the seams between the
Alembic main body (`alembic-ai`, folder `Alembic/`) and its shared engines
(`@alembic/core`, `@alembic/agent`):

1. **Governance Gateway** — the HTTP action-authorization / audit-envelope chokepoint
   (`lib/governance/gateway/`), plus its `AuditRepository` raw-DB boundary.
2. **Host-owned tool adapters** — bridges that expose Dashboard operations, Skill
   documents, Workflows, and macOS system info to the `@alembic/agent` tool contract
   (`lib/tools/adapters/`), plus `ToolContextFactory` which assembles the per-call
   `ToolContext` and holds the long-lived caches.
3. **Platform browser launcher** — `lib/platform/OpenBrowser.ts`.
4. **Project Scope** — multi-repo "space membership" scoping over Alembic's native
   `ProjectScope` registry (`lib/project-scope/`).

Everything here is host-layer wiring, transport, and adapters. The deep models these
files thread through — `ProjectDescriptor`, `WorkspaceResolver`, the `KnowledgeService`
/`GuardService`/`SearchEngine` services, the `ToolContext`/`ToolExecutionAdapter`
contracts, `SqliteDatabase` — are all imported from `@alembic/core` or `@alembic/agent`
and are delegations, not local implementations. The per-file **Boundary note**
subsections state this precisely.

---

### 16.1 Governance Gateway

#### 16.1.1 Role in the system

The Gateway is a thin **route wrapper + audit envelope** for the HTTP server. Its own
doc comment is explicit that it is not the write-safety enforcer: "Operation-specific
HTTP routes own write safeguards. Gateway only keeps routing, request-shape checks, and
audit emission." (`lib/governance/gateway/Gateway.ts:49`). It is one link in Alembic's
defense-in-depth chain, but the substantive per-operation policy lives in the individual
route handlers and in the `@alembic/agent` governance manifests (`risk`/`governance`
blocks on each `ToolCapabilityManifest`), not in `Gateway.guard()` — which is a
deliberate no-op reserved for future operation-neutral checks (`Gateway.ts:222-225`).

#### 16.1.2 Key classes / types (with anchors)

| Symbol | File:line | Purpose |
|--------|-----------|---------|
| `GatewayRequest` | `Gateway.ts:10` | Input shape: `{ actor, action, resource?, data?, session?, confirmed? }`. |
| `GatewayContext` | `Gateway.ts:19` | Normalized per-request context (adds `requestId`, `startTime`; `data` defaulted to `{}`). |
| `GatewayResult` | `Gateway.ts:29` | Output shape: `{ success, requestId, data?, error?, duration? }`. |
| `Gateway` (extends `EventEmitter`) | `Gateway.ts:55` | The router/audit wrapper. |
| `Gateway.register(action, handler)` | `Gateway.ts:77` | Registers a handler; throws on duplicate action. |
| `Gateway.execute(request)` | `Gateway.ts:91` | Main entry: validate → guard → route → audit. |
| `Gateway.checkOnly(request)` | `Gateway.ts:169` | Validate + guard + audit, **no** handler execution. |
| `registerGatewayActions(gateway, container)` | `GatewayActionRegistry.ts:21` | Wires ~30 actions to service methods. |
| `buildGatewayRequest(req, action, resource, data)` | `GatewayActionRegistry.ts:221` | Helper to format an Express request into a `GatewayRequest`. |

Injected dependencies are limited: `setDependencies({ auditLogger })` (`Gateway.ts:72`).
There is also an `eventBus` field that is declared but never assigned by
`setDependencies` (`Gateway.ts:58,68`), so the EventBus emit branches in `auditSuccess`
/`auditFailure` (`Gateway.ts:256-259`, `284-287`) are currently dead in the wired path —
see gotchas.

#### 16.1.3 Control flow — `Gateway.execute`

1. Generate `requestId = uuidv4()` and record `startTime` (`Gateway.ts:92-93`).
2. Build the `GatewayContext`, defaulting `data` to `{}` (`Gateway.ts:95-103`).
3. `validateRequest` — throws `InternalError` (from `@alembic/core/shared`) if `actor`
   or `action` is missing (`Gateway.ts:213-220`).
4. `guard(context)` — **currently a no-op** reserved for operation-neutral checks
   (`Gateway.ts:223`).
5. `routeToHandler` — looks up `routes.get(action)`; throws `InternalError` if no handler
   (`Gateway.ts:228-236`).
6. `auditSuccess(context, result)` — if an `auditLogger` is set, logs a success entry;
   optionally emits `gateway:action:completed` on both `this` (EventEmitter) and the
   `eventBus` (`Gateway.ts:239-260`).
7. Returns `{ success: true, requestId, data: result, duration }`.

On any throw, the `catch` block calls `auditFailure` and returns
`{ success: false, error: { message, code || 'INTERNAL_ERROR', statusCode || 500 } }`
(`Gateway.ts:136-163`). Error `code`/`statusCode` are read off the thrown object if
present (`Gateway.ts:138`), which is how `InternalError` and other typed errors surface
their HTTP status.

`checkOnly` (`Gateway.ts:169-208`) runs steps 3–4 plus a success audit with
`{ checkOnly: true }` and returns `{ success, requestId }` without routing. This backs
the `auditLevel: 'checkOnly'` manifest governance value used by the dashboard/skill
capabilities (see 16.2).

#### 16.1.4 Action registry (`GatewayActionRegistry.ts`)

`registerGatewayActions` binds action strings to closures that pull a named service from
the DI container and invoke a method, passing `{ userId: ctx.actor }` as the audit
identity. The `container.get(name)` calls resolve services registered elsewhere in the
DI graph; the registry itself owns none of the business logic. Registered actions:

| Action namespace | Service (`container.get`) | Representative actions |
|------------------|---------------------------|------------------------|
| `candidate:*` | `knowledgeService` | `create`, `approve`, `reject`, `apply_to_recipe` (→ `publish`), `list`, `search`, `get_stats`, `get`, `delete`, `update` (`GatewayActionRegistry.ts:24-73,200-203`) |
| `recipe:*` | `knowledgeService` | `create`, `publish`, `deprecate`, `update_quality`, `adopt`/`apply` (→ `incrementUsage`), `list`, `search`, `get_stats`, `get`, `delete` (`GatewayActionRegistry.ts:77-138`) |
| `guard_rule:*` | `guardService` (and `knowledgeRepository` for `get`) | `create`, `enable`, `disable`, `check_code`, `import_from_recipe` (aliased to `createRule`), `list`, `search`, `get_stats`, `get` (`GatewayActionRegistry.ts:142-194`) |
| `search:query` | `searchEngine` | `search(keyword, options)` (`GatewayActionRegistry.ts:207-210`) |

Notes:
- **V3 collapse:** both `candidate:create` and `recipe:create` route to the same
  `knowledgeService.create` (`:24`, `:77`); the comment records that V3 replaced the
  separate Candidate + Recipe services with a single `knowledgeService`
  (`GatewayActionRegistry.ts:22,75`).
- **Deprecated path kept as alias:** `guard_rule:import_from_recipe` is explicitly
  documented as deprecated and reuses `createRule` (`GatewayActionRegistry.ts:170-174`).
- `guard_rule:get` bypasses the service and reads `knowledgeRepository.findById`
  directly (`GatewayActionRegistry.ts:191-194`).
- `guard_rule:create` forwards `_ip`/`_userAgent` from `ctx.data` into the service audit
  context (`GatewayActionRegistry.ts:144-148`) — those underscore-prefixed fields are
  injected by `buildGatewayRequest`/`gatewayMiddleware` (see next).

#### 16.1.5 Request formatting and middleware

`buildGatewayRequest` (`GatewayActionRegistry.ts:221-238`) reads `x-user-id` (default
`'anonymous'`), `x-session-id`, `user-agent`, and `req.ip`, folding `_ip`/`_userAgent`
into `data`. **The actual runtime path is the Express middleware, not this helper.**
`gatewayMiddleware()` (`lib/http/middleware/gatewayMiddleware.ts:27-68`) attaches
`req.gw(action, resource, data)` which:
- resolves the container via `getServiceContainer()` and gets `'gateway'`
  (`gatewayMiddleware.ts:37-38`);
- derives `actor` from `req.resolvedSourceActor || req.resolvedSource || 'http-request'`
  (`gatewayMiddleware.ts:40`) — the middleware comment stresses `actor` is an **audit
  source label, not a runtime permission role** (`gatewayMiddleware.ts:6`);
- calls `gateway.execute(...)`, and on `!result.success` throws a `GatewayError`
  carrying `statusCode`/`code`/`requestId` for the HTTP error handler
  (`gatewayMiddleware.ts:42-62`).

#### 16.1.6 Wiring (where the Gateway is constructed)

There are **two** construction sites — a legacy/bootstrap path and the DI path:
- `Bootstrap.initializeGateway()` constructs `new Gateway(gatewayConfig)` (config read
  from the config loader's `gateway` key) and calls
  `gateway.setDependencies({ auditLogger: this.components.auditLogger })`
  (`lib/Bootstrap.ts:194-207`). The `AuditLogger` is built earlier over an `AuditStore`
  (`lib/Bootstrap.ts:180-183`).
- The DI `InfraModule` registers `c.singleton('gateway', () => new Gateway())` and the
  `auditLogger` singleton over `auditStore`
  (`lib/injection/modules/InfraModule.ts:65-74`). `HttpServer.registerGatewayActions()`
  then resolves `container.get('gateway')` and calls the registry
  (`lib/http/HttpServer.ts:228-233`), guarded so registration failure only warns.

The service is typed `gateway: Gateway` in the DI service map
(`lib/injection/ServiceMap.ts:96`).

#### 16.1.7 Emitted events

| Event | Emitted on | Site | Payload |
|-------|-----------|------|---------|
| `gateway:action:completed` | `this` (EventEmitter) **and** `eventBus` | `Gateway.ts:257-258` | audit entry + `timestamp`, only if `this.eventBus` set |
| `gateway:action:failed` | `this` **and** `eventBus` | `Gateway.ts:285-286` | audit entry + `timestamp`, only if `this.eventBus` set |

Because `setDependencies` never assigns `eventBus` (`Gateway.ts:72-74`) and no other code
was found assigning it, these event emissions do not currently fire in the wired path.
The audit-log write (`auditLogger.log`) is unconditional whenever an `auditLogger` is
present.

#### 16.1.8 Boundary note (Gateway)

- **Host-owned here:** the `Gateway` class, its execute/checkOnly pipeline,
  request-shape validation, the action-string → service-method routing table, the audit
  emission envelope, `buildGatewayRequest`, and the Express `gatewayMiddleware`.
- **Delegated:** `Logger` and `InternalError` come from `@alembic/core` (`Gateway.ts:2-3`).
  Every action handler's real work is a service method resolved from the DI container
  (`knowledgeService`, `guardService`, `searchEngine`, `knowledgeRepository`) — the
  Recipe/Guard/Knowledge engines those services embody are Core-side. The Gateway holds
  no business rules of its own.

---

### 16.2 Tool adapters (`lib/tools/adapters/`)

These four files bridge host capabilities into the `@alembic/agent` tool contract. Two
are **manifest-only** (`SkillCapabilities.ts`, `MacSystemCapabilities.ts`), two are
**manifest + handler tables** (`DashboardOperations.ts` provides both, `SkillAdapter.ts`
provides the executor), and each of `DashboardOperationAdapter`/`SkillAdapter`/
`WorkflowAdapter` is a class implementing the `@alembic/agent` `ToolExecutionAdapter`
interface (`kind` + `execute(request): Promise<ToolResultEnvelope>`).

#### 16.2.1 The common adapter contract

All adapters return a `ToolResultEnvelope` (imported from `@alembic/agent`) with the
same skeleton: `ok`, `toolId`, `callId`/`parentCallId` (from `request.context`),
`startedAt` (ISO), `durationMs`, `status`, `text`, `structuredContent`, `diagnostics`,
and `trust`. Each adapter locally defines an `emptyDiagnostics()` shape and an
`envelopeForError` helper; a result object that carries an `error` field is treated as a
failure (`extractErrorMessage`, e.g. `DashboardOperationAdapter.ts:108-113`,
`WorkflowAdapter.ts:112-117`). This "shape the host result into the agent envelope"
translation is the entire job of these adapter classes.

#### 16.2.2 DashboardOperations + DashboardOperationAdapter

`DashboardOperations.ts` declares the six dashboard operation ids and their
`ToolCapabilityManifest`s, and builds the handler table:

| Operation id | policyProfile | timeoutMs | Handler target |
|--------------|---------------|-----------|----------------|
| `dashboard.update_module_map` | `write` | 60_000 | `moduleService.updateModuleMap` (`DashboardOperations.ts:135-145`) |
| `dashboard.rebuild_semantic_index` | `system` | 300_000 | `vectorService.fullBuild` (or `indexingPipeline.run` fallback) (`:147-193`) |
| `dashboard.scan_project` | `analysis` | 300_000 | `moduleService.load()` + `scanProject` (`:195-206`) |
| `dashboard.bootstrap_project` | `write` | 300_000 | `runDaemonJob({kind:'bootstrap'})` (`:208-226`) |
| `dashboard.cancel_bootstrap` | `write` | 60_000 | `bootstrapTaskManager.abortSession/markCancelled` (`:228-249`) |
| `dashboard.rescan_project` | `write` | 300_000 | `runDaemonJob({kind:'rescan'})` (`:251-282`) |

Shared manifest traits (`DashboardOperations.ts:85-133`): `kind: 'dashboard-operation'`,
`owner: 'dashboard'`, `surfaces: ['dashboard']`, `risk.sideEffect: true`,
`risk.writeScope: 'data-root'`, `owaspTags: ['excessive-agency']`,
`governance.gatewayAction` = `dashboard:<last-segment>`, `auditLevel: 'checkOnly'`,
`approvalPolicy: 'explain-then-run'`, and all three `allowIn*` flags **false** (not
allowed in composer, remote MCP, or non-interactive surfaces). `allowedRoles: []` is
deliberately empty with a comment that mainline safety is operation-specific
(`DashboardOperations.ts:125`).

Handler details / gotchas:
- `createDashboardOperationHandlers(deps)` (`:71-83`) takes **constructed injection**
  `{ aiStatus, aiUnavailableMessage }` (the `DashboardOperationAiDeps` interface,
  `:11-15`). The comment records that AD4 removed a former `tools -> injection` runtime
  reach-through; the AI-status projection now arrives as a dep so the tools layer never
  imports the injection runtime (`DashboardOperations.ts:3-6`).
- `rebuildSemanticIndex` short-circuits with a Chinese error string if AI/embedding is
  not ready (`:150-152`), prefers `vectorService` when registered and falls back to
  `indexingPipeline` (`:156-182`).
- `bootstrapProject`/`rescanProject` use a **lazy `import('../../daemon/DaemonJobRunner.js')`**
  and drive a daemon job synchronously (`create` then `runDaemonJob`), returning the job
  metadata merged with the result (`:208-226`, `:251-282`).
- `getContainer(request)` casts `request.context.services` to the host `ServiceContainer`
  (`:284-286`); `getOptionalService` swallows a missing service via try/catch (`:288-294`).

`DashboardOperationAdapter` (`DashboardOperationAdapter.ts`) is the `ToolExecutionAdapter`
of `kind: 'dashboard-operation'` that looks up a handler by `request.manifest.id`, runs
it, and wraps the result. Trust is stamped `source: 'user'` (`:46-51`). **Important
wiring fact:** the live HTTP path does **not** go through this adapter —
`lib/http/utils/dashboard-operation.ts:29-104` dispatches dashboard operations directly
to `createDashboardOperationHandlers(...)` with a comment that dashboard operations are
not LLM tools and skip the V2 ToolRouter (`dashboard-operation.ts:30-32`). No in-repo
importer of the `DashboardOperationAdapter` class was found outside its own file; it is
the agent-contract-shaped alternative that the runtime router would use if these ids were
routed as agent tools.

#### 16.2.3 SkillCapabilities + SkillAdapter

`SkillCapabilities.ts` declares four read-only skill capabilities sharing
`policyProfile: 'read'`, `auditLevel: 'checkOnly'`, `approvalPolicy: 'auto'`,
`concurrency: 'parallel-safe'`, `timeoutMs: 5_000`, all three `allowIn*` **true**, and
`owaspTags: ['prompt-injection']` (`SkillCapabilities.ts:3-32`):

| Capability id | Purpose | Required args |
|---------------|---------|---------------|
| `skill_search` | Search skill manifests by name/description/trigger (`:34-60`) | none (`query?`, `source?`) |
| `skill_load` | Load a `SKILL.md`, optionally a section (`:62-83`) | `name` |
| `skill_load_resource` | Load a non-executable resource file from the skill dir (`:85-109`) | `name`, `resourcePath` |
| `skill_validate` | Validate frontmatter without running scripts/hooks (`:111-132`) | none (`name?`, `source?`) |

`SkillAdapter` (`kind: 'skill'`) implements these. It reads skills from two roots and
merges them, with **project skills overriding builtins by name** (Map keyed by name;
project inserted last, `SkillAdapter.ts:210-223`):
- builtin: `PACKAGE_SKILLS_DIR` (from `../../shared/package-assets.js`, `SkillAdapter.ts:10,31`);
- project: `getProjectSkillsPath(dataRoot|projectRoot)` from `@alembic/core/config`
  (`SkillAdapter.ts:9,345-349`).

Notable algorithms / security gotchas:
- **Path escape guard** in `#loadResource`: resolves the requested path against the
  skill dir, rejects if `path.relative` starts with `..` or is absolute
  (`SkillAdapter.ts:145-152`), rejects `hooks.js` as an executable resource
  (`:153-158`), and confirms the target is a real file (`:159-164`).
- `normalizeResourcePath` also rejects absolute paths or any `..` segment up front
  (`:368-379`); `normalizeRequiredSkillName` enforces `/^[A-Za-z0-9._-]{1,80}$/`
  (`:355-366`).
- Frontmatter parsing is a tiny hand-rolled YAML-subset parser (`parseSkillDocument`
  `:259-268`, `parseFrontmatter` `:270-286`, list values via bracket-split `:288-298`) —
  **not** a real YAML parser, so only flat `key: value` and simple `[a, b]` arrays are
  understood.
- `extractSection` builds a case-insensitive multiline regex to slice one `##` section
  (`:337-343`).
- Unknown capability ids return `status: 'blocked'` (`:62-73`); blocked/error results
  populate `diagnostics.blockedTools`/`gateFailures` (`:436-441`). Trust source is
  `'skill'` and `containsUntrustedText` defaults to the manifest's
  `externalTrust.outputContainsUntrustedText ?? true` (`:443-448`) — skill docs are
  treated as potentially untrusted text (matching the `prompt-injection` owasp tag).

Wiring: `SkillAdapter` has a unit test (`test/unit/SkillAdapter.test.ts`) but no runtime
registration site was found in `lib/`/`bin/`; only its `SKILL_CAPABILITY_MANIFESTS` are
registered into the `toolRegistry` catalog (see 16.2.6).

#### 16.2.4 WorkflowAdapter

`WorkflowAdapter` (`kind: 'workflow'`, `WorkflowAdapter.ts:10-59`) wraps a
`WorkflowRegistry` (from `@alembic/agent`). `execute` looks up `registry.get(id)`, calls
`workflow.handler(request.args, ctx)` where the context is built by
`createWorkflowHandlerContext` — which packs `{ toolCallContext, toolRouter }`, resolving
the router via `resolveToolRouterFromContext` from `@alembic/agent`
(`WorkflowAdapter.ts:8,61-66`). Trust source is `'internal'` (`:43-48`). Like the
dashboard adapter, no in-repo importer of this class besides its own file was found; the
`WorkflowRegistry` itself is registered as a DI singleton in `AgentModule`
(`lib/injection/modules/AgentModule.ts:63`).

#### 16.2.5 MacSystemCapabilities

Manifest-only (`MacSystemCapabilities.ts`). Two read-only capabilities of
`kind: 'macos-adapter'`, `owner: 'agent-platform'`, `lifecycle: 'experimental'`,
`policyProfile: 'system'`, `auditLevel: 'full'`, `surfaces: ['runtime']`, no side effects
and no network/credential access:

| Capability id | Purpose |
|---------------|---------|
| `mac_system_info` | Report basic macOS/platform info without requesting TCC permissions (`:34-53`) |
| `mac_permission_status` | Report known macOS permission readiness without prompting or bypassing TCC (`:55-79`; `permission` enum `accessibility`/`automation`/`all`) |

No executor class exists in this repo for `macos-adapter`, and no importer of
`MAC_SYSTEM_CAPABILITY_MANIFESTS` was found in `lib/`/`bin/`. This file currently
declares capability metadata only; the actual `macos-adapter` executor is not present in
the main body (the manifests emphasize read-only, non-TCC-prompting behavior by design).

#### 16.2.6 Manifest registration

`AgentModule` registers the tool system. The `toolRegistry` singleton builds a
`UnifiedToolCatalog` (from `@alembic/agent`) and registers **only**
`DASHBOARD_OPERATION_MANIFESTS` and `SKILL_CAPABILITY_MANIFESTS`
(`lib/injection/modules/AgentModule.ts:53-61`). The comment (`:50-52`) notes the
E-3 branch-A cleanup retired the old lightweight router and terminal adapter stack, so
runtime execution goes through the V2 `toolRouter` (`ToolRouterAdapter` from
`@alembic/agent/tools/runtime`, `AgentModule.ts:42-48`) rather than these adapter classes
directly.

#### 16.2.7 Boundary note (tool adapters)

- **Host-owned here:** the manifest declarations (ids, risk/governance/execution
  metadata), the dashboard operation handler table and its lazy daemon-job dispatch, the
  skill filesystem reader with its path-escape/hook-execution guards and frontmatter
  parser, and the three envelope-shaping adapter classes.
- **Delegated:** `ToolExecutionAdapter`, `ToolExecutionRequest`, `ToolResultEnvelope`,
  `ToolCapabilityManifest`, `WorkflowRegistry`/`WorkflowHandlerContext`,
  `resolveToolRouterFromContext`, `UnifiedToolCatalog`, `RuntimeCapabilityCatalog`, and
  `ToolRouterAdapter` are all `@alembic/agent` contracts/implementations. The engines the
  dashboard handlers drive (`moduleService`, `vectorService`, `indexingPipeline`, the
  daemon job runner) are host services; `getProjectSkillsPath` is `@alembic/core/config`.
  These adapters own no knowledge/scan logic — they invoke it.

---

### 16.3 ToolContextFactory (`lib/tools/v2/ToolContextFactory.ts`)

#### 16.3.1 Role

`ToolContextFactory` assembles a fresh `ToolContext` (from `@alembic/agent/tools/runtime`)
for **each** V2 tool call while reusing a set of long-lived resources created once at
factory construction (`ToolContextFactory.ts:1-7`). It is the join point where per-call
request state meets the shared DI container.

#### 16.3.2 Long-lived vs per-call state

Constructed once (`ToolContextFactory.ts:129-136`) and reused across every `create()`:
`DeltaCache(200)`, `SearchCache(100)`, `OutputCompressor`, a local `SimpleSessionStore`,
and a `SandboxExecutorBridge`.

> **Shared-context detail (known):** the single `DeltaCache(200)` instance
> (`ToolContextFactory.ts:123,131`) is injected into every per-call `ctx.deltaCache`
> (`:158`). All tool calls served by one factory instance therefore **share** one delta
> cache — reads and writes within a run cross-pollinate through it, and its LRU cap of
> 200 entries means eviction is global across calls. The same holds for `searchCache`,
> `compressor`, and `sessionStore` (`:159-161`). This is the documented shared-context
> behavior; a change touching cache isolation must account for cross-call visibility.

Per-call `create(request)` (`ToolContextFactory.ts:142-168`) pulls heavyweight services
from the container **lazily and defensively** via `tryGet` (try/catch → `undefined`,
`:171-177`): `searchEngine`, `recipeProductionGateway` (→ `recipeGateway`),
`knowledgeRepository`, `evolutionGateway`, `astAnalyzer`, and the audit sink
(`tryGetAuditSink` requires a `.log` function, `:179-191`). It also threads through
`request.runtime` values: `safetyPolicy`, `memoryCoordinator`, `abortSignal`, and sets
`tokenBudget` to `defaultTokenBudget ?? 8000` (`:154,163-166`). `projectGraph` is
hard-coded `null` (`:148`).

#### 16.3.3 SandboxExecutorBridge

An inner class (`ToolContextFactory.ts:55-113`) that wraps the host sandbox for terminal
handlers so they don't import the sandbox module directly. `exec()` uses **lazy imports**
(`#sandbox/SandboxExecutor.js`, `#sandbox/SandboxPolicy.js`) to avoid pulling the whole
sandbox dependency chain at module load (`:72-73`). It builds a profile with
`network: 'none'`, `filesystem: 'project-write'` (`:75-81`), copies `process.env` and
forces `TERM: 'dumb'`/`NO_COLOR: '1'` (`:83-95`), runs `/bin/sh -c <command>` with a 1 MiB
`maxBuffer` (`:90-101`), and reports `diagnostics.fallbackUsed = (result.sandboxed === false)`
(`:102-111`).

#### 16.3.4 Wiring

`AgentModule` registers `toolContextFactory` as a singleton (long-lived, so the caches
persist) with `{ container: ct, projectRoot: resolveProjectRoot(ct) }`
(`lib/injection/modules/AgentModule.ts:31-39`), and passes it into the `ToolRouterAdapter`
as `contextFactory` (`:42-48`).

#### 16.3.5 Boundary note (ToolContextFactory)

- **Host-owned here:** the factory itself, the decision of which resources are long-lived
  vs per-call, the `SimpleSessionStore` (a trivial in-memory recall store, `:30-53`), and
  the `SandboxExecutorBridge` (host sandbox wrapper).
- **Delegated:** `ToolContext`, `DeltaCache`, `SearchCache`, `OutputCompressor`,
  `MemoryCoordinatorLike`, `ToolAuditSinkLike`, and `ToolCallRequest` are all
  `@alembic/agent` types/classes (`:9-17`). The services fetched by name are host DI
  services (some themselves Core-backed, e.g. `recipeProductionGateway`).

---

### 16.4 Platform: OpenBrowser (`lib/platform/OpenBrowser.ts`)

#### 16.4.1 Role and strategy

Cross-platform browser launcher for opening the Dashboard UI. On macOS it prefers an
AppleScript that **reuses an existing tab** in a Chromium-family browser; everywhere else
(and on failure) it falls back to the `open` npm package (`OpenBrowser.ts:1-8`).

Exports:
- `hasMacOSBrowserControlGranted()` (`:31-57`) — probes whether the process can already
  control an installed Chromium browser by running `osascript ... get name` and treating
  success as "granted"; returns `false` off macOS.
- `openBrowserReuseTab(url, baseUrlForLookup?)` (`:65-119`) — the main entry.

#### 16.4.2 Control flow — `openBrowserReuseTab`

1. **Escape hatch:** if `ALEMBIC_UI_NO_REUSE_TAB === '1'` or `ALEMBIC_UI_OPEN_REUSE === '0'`,
   go straight to `_fallbackOpen` (`:66-72`).
2. On macOS: filter a fixed list of Chromium browsers to those installed (checking
   `/Applications`, `~/Applications`, `/System/Applications`, `:18-28`), and locate
   `openChrome.applescript` under `RESOURCES_DIR` (`:85`). If the script is missing, fall
   back (`:87-90`).
3. For each available browser, run the AppleScript via `execFileSync('osascript', args,
   { timeout: 3000 })`; the arg vector differs when a separate `baseUrlForLookup` is
   given (lookup by base, then navigate to `url`) (`:95-105`). First success returns.
4. On every failure, optionally log under `ALEMBIC_DEBUG === '1'` and try the next browser
   (`:106-113`).
5. If all AppleScript attempts fail or the platform is not macOS, `_fallbackOpen(url)`
   (`:118`).

`_fallbackOpen` (`:122-131`) lazily imports `open` and calls it, logging failures to
`console.error`.

#### 16.4.3 Gotchas

- **Empty conditional:** `if (!hasMacOSBrowserControlGranted()) {}` at `:92-93` is an
  intentional-looking no-op (empty block) — the permission probe result is not used to
  branch; the code proceeds to try AppleScript regardless. Worth flagging for anyone
  extending permission handling.
- `hasMacOSBrowserControlGranted` uses `execSync` (blocking) and can trigger a TCC
  automation permission prompt on first use.
- The AppleScript path depends on the packaged resource `openChrome.applescript` existing
  in `RESOURCES_DIR` (`../shared/package-assets.js`, `:14`).

#### 16.4.4 Boundary note (OpenBrowser)

Entirely host-owned. Uses only Node builtins (`child_process`, `fs`, `os`, `path`), the
`open` npm package, and the local `RESOURCES_DIR` constant. No `@alembic/core` or
`@alembic/agent` involvement.

---

### 16.5 Project Scope (`lib/project-scope/`)

#### 16.5.1 Role

This subsystem gives Alembic **multi-repo "space membership" scoping**: a single logical
project (a `ProjectDescriptor` / `ProjectScope`) can span several source folders under
one control root and one data root. The registry file is Alembic's **native** scope
store, `project-scopes.json` (`ProjectScopeRegistry.ts:36`), located under the Core
project-registry dir. `ProjectScopeRegistry.ts` is the host store/loader;
`ProjectScopeAnalysis.ts` is a structural adapter that turns a resolved scope into
scan-options metadata and normalizes per-file source identities.

#### 16.5.2 ProjectScopeRegistryStore

`ProjectScopeRegistryStore` (`ProjectScopeRegistry.ts:76-275`) is the host-owned CRUD
boundary over `project-scopes.json`. Key methods:

| Method | File:line | Behavior |
|--------|-----------|----------|
| `read()` | `:86-101` | Parse the registry; on missing file, bad `version`, or parse error, return a fresh empty document (Core `createProjectScopeRegistryDocument`). |
| `write(doc)` | `:103-108` | **Atomic write**: `mkdir` mode `0o700`, write a `.<pid>.tmp` with mode `0o600`, then `renameSync` into place. |
| `listScopes()` / `getScope(id)` / `findByControlRoot(root)` | `:110-127` | Read-side lookups; control-root match uses `pathsEquivalent` (`resolve()`-normalized equality, `:316-321`). |
| `addFolder(options)` | `:129-158` | Resolve/target an existing scope or create one, upsert via Core, `write`, `mkdir` the scope's `dataRoot` (`0o700`), then resolve the added folder. |
| `resolveFolder(input)` | `:160-176` | Resolve a folder to a scope via Core `resolveProjectScopeRegistryFolder`, falling back to control-root resolution. |
| `resolveWorkspace(projectRoot)` | `:178-188` | Return a Core `WorkspaceResolver`: if the folder resolves to a scope, seed the resolver with `currentFolderId` + `projectScope`; otherwise `WorkspaceResolver.fromProject(projectRoot)` (no scope). |

Scope/folder creation delegates to Core factories: `createScope` derives a `controlRoot`
(explicit, else the folder's parent dir via `defaultControlRootForFolder`, `:300-302`),
computes `projectId = generateProjectId(controlRoot)`, sets `dataRoot =
getGhostWorkspaceDir(projectId)`, and stamps `metadata.storagePolicy: 'ghost-only'`
(`:212-235`). `createFolderInput` captures a `safeRealpath` (try/catch → `null`,
`:304-310`) and defaults `role: 'source'` (`:237-252`).

Module-level helpers:
- `resolveAlembicWorkspace(projectRoot)` (`:277-279`) — convenience: `new
  ProjectScopeRegistryStore().resolveWorkspace(...)`. This is the function
  `ProjectScopeAnalysis` and Bootstrap use to load the **existing native scope**.
- `resolveAlembicDaemonPaths(projectRootInput)` (`:281-294`) — projects a resolved
  workspace into `DaemonPaths` (`dataRoot`, `jobs`, `daemon.lock`/`.log`/`.pid`/`.json`,
  `projectId`, `runtimeDir`).
- `getProjectScopeRegistryPath()` (`:68-70`) — `join(getProjectRegistryDir(),
  'project-scopes.json')`.

#### 16.5.3 ProjectScopeAnalysis

`resolveProjectScopeAnalysisContext(container)` (`ProjectScopeAnalysis.ts:93-110`) is the
bridge that host scan paths call. It resolves `projectRoot` (Core `resolveProjectRoot`),
then obtains a workspace resolver **either** from the container singleton
`_workspaceResolver` (`getContainerWorkspaceResolver`, `:283-301`) **or**, failing that,
by loading the native scope via `resolveAlembicWorkspace(projectRoot)` (`:97`). It returns
a `ProjectScopeAnalysisContext` with `controlRoot`, `currentFolderId`, `dataRoot`,
`folderCount`, `projectRoot`, `projectScope`, `projectScopeId` (`:19-27,101-109`). This is
the "native ProjectScope loading" wiring: the scan-time path picks up the real scope
membership instead of guessing.

Companion functions:
- `attachProjectScopeToScanOptions(scan, analysis)` (`:112-123`) — spreads
  `projectScope` into scan options **only** when a scope with ≥1 folder exists.
- `buildProjectScopeAnalysisLogMeta(analysis)` (`:125-142`) — flattens scope + folder
  roles into a log-friendly object.
- **Source-identity normalization** (`:144-232`): `collectProjectScopeSourceIdentities*`
  extract per-file `ProjectScopeSourceIdentity` records; `buildProjectScopeSourceIdentityMap`
  produces a versioned, deduped, qualified-path-keyed map with
  `rejectPolicy.missingPath: 'reject'` (`:161-187`);
  `normalizeProjectScopeSourceRefsForRuntime` splits an optional `:line[:col]` suffix
  (`splitSourceRefLocation`, `:373-383`), looks each ref up by normalized qualified path,
  and partitions into `activeSourceRefs`/`normalized`/`rejected` (`:189-232`). Path
  comparison is normalized (backslashes → `/`, strip `./`, collapse `//`,
  `:425-427`).
- The header comment (`:92`) states the Alembic side only does structured adaptation:
  when a newer Core emits `sourceIdentity`, it is surfaced; when older Core omits it, the
  functions degrade to empty collections. This is a forward/backward-compat seam, not an
  engine.

#### 16.5.4 Types / contracts

`ProjectScopeSourceIdentityMap` carries `contract:
'ProjectScopeSourceIdentityMap'` / `contractVersion: 1` and `preferredRef: 'qualifiedPath'`
(`ProjectScopeAnalysis.ts:40-63`). `ProjectDescriptor` and all the folder/resolution/
summary types are imported from `@alembic/core/shared` — this file only defines the
Alembic-side identity/normalization shapes.

#### 16.5.5 Boundary note (Project Scope)

- **Host-owned here:** the `project-scopes.json` file I/O with its atomic-write and
  `0o700`/`0o600` permission discipline, the `ProjectScopeRegistryStore` CRUD surface, the
  daemon-path projection, and the entire source-identity normalization/adapter layer in
  `ProjectScopeAnalysis.ts`.
- **Delegated:** the scope model and all mutation/resolution primitives —
  `createProjectDescriptor`, `addProjectScopeFolder`, `upsertProjectScopeInRegistry`,
  `resolveProjectScopeForFolder`, `resolveProjectScopeRegistryFolder`,
  `summarizeProjectScopeDescriptor`, `WorkspaceResolver`, `generateProjectId`,
  `getGhostWorkspaceDir`, `getProjectRegistryDir` — are `@alembic/core/shared` /
  `@alembic/core/workspace`. Alembic loads and adapts the native Core scope; it does not
  define the scope semantics.

---

### 16.6 AuditRepository (`lib/repository/AuditRepository.ts`)

#### 16.6.1 Role and deliberate isolation

`AuditRepositoryImpl` is the **only** file allowed under `lib/repository/`, by design
(AO2): it isolates the raw SQLite calls for the `audit_logs` table used by the host-owned
`AuditLogger` path, and the header explicitly directs new raw-DB repository work to
`lib/infrastructure/database` instead (`AuditRepository.ts:1-7`). It is a classic thin
repository over `better-sqlite3` (prepared statements, no ORM), constructed from a
database provider via `database.getDb()` (`:81-83`).

#### 16.6.2 Table shape (`audit_logs`)

Columns (from the insert/select SQL, `:97-108,272-285`): `id`, `timestamp` (ms epoch),
`actor`, `actor_context` (JSON text), `action`, `resource`, `operation_data` (JSON text),
`result`, `error_message`, `duration`. `#mapRow` (`:256-269`) parses the two JSON columns
via `safeParseJSON` (try/catch → fallback `{}`, `:323-329`), exposing camelCased
`actorContext`/`operationData` on `AuditLogEntity` (`:30-41`).

#### 16.6.3 API surface

| Method | File:line | Notes |
|--------|-----------|-------|
| `findById(id)` / `findByRequestId(id)` | `:87-92`, `:149-151` | `findByRequestId` is an alias for `findById`. |
| `create(data)` | `:94-128` | Insert then re-`findById`; throws if the row can't be loaded back. Defaults JSON columns to `'{}'`. |
| `delete(id)` | `:130-133` | Returns `changes > 0`. |
| `query(filters)` | `:138-146` | Dynamic `WHERE` via `buildAuditWhere` (actor/action/result/startDate/endDate), `ORDER BY timestamp DESC`, optional `LIMIT`. |
| `findByActor` / `findByAction` / `findByResult` | `:154-175` | Convenience filtered queries (default `limit=100`). |
| `getStats(timeRange)` | `:180-236` | `24h`/`7d`/`30d` window; counts total/success/failure, group-by actor and action, avg duration; computes `successRate`. |
| `cleanup(maxAgeDays=90)` | `:244-252` | Deletes rows older than the cutoff; swallows errors, returning `{ deleted: 0 }` on failure. |

`buildAuditWhere` (`:287-316`) composes parameterized conditions (SQL-injection-safe via
`?` binding). `getStats` uses helper `readCount` for scalar counts (`:318-321`).

#### 16.6.4 Wiring

`InfraModule` registers `auditRepository` as a singleton constructed from the `database`
service (`lib/injection/modules/InfraModule.ts:148-150`), typed in the service map
(`lib/injection/ServiceMap.ts:106`). Note the **live Gateway audit path** actually flows
through `AuditLogger` over an `AuditStore` (`Bootstrap.ts:180-183`,
`InfraModule.ts:65-73`), not through `AuditRepositoryImpl` directly — `AuditLogger`
imports `AuditStore`, not this repository (`lib/infrastructure/audit/AuditLogger.ts:2`).
`AuditRepositoryImpl` is the isolated raw-DB read/stats/cleanup surface over the same
`audit_logs` table; verify the exact consumer set before assuming it is on the hot write
path.

#### 16.6.5 Boundary note (AuditRepository)

- **Host-owned here:** all SQL, the row↔entity mapping, the stats/cleanup logic, and the
  deliberate single-file `lib/repository` boundary.
- **Delegated:** only the `SqliteDatabase` type from `@alembic/core/database`
  (`:9`). The database instance and migrations that create the `audit_logs` table are
  provided by the host DI `database` service; this repository assumes the table exists.

---

### 16.7 Cross-cutting summary — where the boundary sits

| Concern | Host (this repo) | Delegated |
|---------|------------------|-----------|
| Action routing + audit envelope | `Gateway`, `GatewayActionRegistry`, `gatewayMiddleware` | `Logger`, `InternalError` (Core); all business services |
| Tool → agent bridging | manifests, handler tables, envelope-shaping adapters, sandbox bridge | `ToolExecutionAdapter`/`ToolResultEnvelope`/`WorkflowRegistry`/`ToolRouterAdapter` (`@alembic/agent`) |
| Per-call context + caches | `ToolContextFactory`, `SimpleSessionStore`, `SandboxExecutorBridge` | `ToolContext`, `DeltaCache`, `SearchCache`, `OutputCompressor` (`@alembic/agent`) |
| Browser launch | all of `OpenBrowser` | — |
| Multi-repo scope store/adapter | file I/O, CRUD store, source-identity normalization | `ProjectDescriptor`/`WorkspaceResolver` + scope primitives (Core) |
| Audit raw DB | all SQL/stats/cleanup | `SqliteDatabase` type (Core) |

**Verification caveats (stated, not invented):** (1) the Gateway's `eventBus` emit
branches and the empty `if (!hasMacOSBrowserControlGranted()) {}` block are dead/no-op in
the code I read — I did not find a site that assigns `Gateway.eventBus`. (2) The
`DashboardOperationAdapter`, `SkillAdapter` (runtime), `WorkflowAdapter`, and
`MAC_SYSTEM_CAPABILITY_MANIFESTS` have no in-repo importer besides their own files and
tests; the live dashboard-operation HTTP path bypasses `DashboardOperationAdapter` via
`lib/http/utils/dashboard-operation.ts`. If you need the exact runtime registration of the
agent-side adapters (whether `@alembic/agent`'s `ToolRouterAdapter` instantiates them
internally), confirm inside the `@alembic/agent` package — that code was not read for this
section.


---


## 17. Infrastructure — Audit, Cache, Database, Rate-limit, Realtime & Shared

This section documents the low-level host-side infrastructure of the Alembic main-body repo (`alembic-ai`, folder `Alembic/`): audit logging + its store/queries, the in-memory + cross-process cache layer, the SQLite access shims, the recipe-save rate limiter, the socket.io realtime service, and a grab-bag of shared helpers and local type/wire definitions. These are the leaf utilities that the CLI, daemon, HTTP/Dashboard server, and DI container build on.

A recurring design fact frames this whole section: **SQLite is a read-optimized projection cache, not the source of truth.** Recipes are markdown files on disk; the `.asd/*.db` (better-sqlite3, WAL) database is a queryable snapshot rebuilt from that markdown. Several mechanisms here exist precisely because of that split — most notably `CacheCoordinator` (detects out-of-process DB writes) and `GraphCache` (content-hash-gated file cache). The actual DB *connection open*, `journal_mode=WAL`, and `wal_checkpoint(TRUNCATE)` on shutdown live in `lib/Bootstrap.ts:239` and in `@alembic/core`, **not** in the files of this section; the files here operate over an already-open handle.

### 17.1 Responsibilities & role in the system

| Area | Files | Role |
|------|-------|------|
| Audit | `infrastructure/audit/AuditLogger.ts`, `AuditStore.ts`, `database/AuditStoreQueries.ts` | Persist and query an `audit_logs` table; optionally mirror each entry to Dashboard via an event bus. |
| Cache (in-memory) | `infrastructure/cache/CacheService.ts`, `UnifiedCacheAdapter.ts` | TTL keyed in-memory cache for API responses, plus a thin adapter that keeps a Redis-swap seam. |
| Cache (cross-process) | `infrastructure/cache/CacheCoordinator.ts` | Poll SQLite `PRAGMA data_version` to detect writes from *other* processes and invalidate registered in-process caches. |
| Cache (file) | `infrastructure/cache/GraphCache.ts` | Content-hash-gated JSON file cache under `.asd/cache/`. |
| DB access shims | `infrastructure/database/SqliteDatabaseAccess.ts` | Duck-typed unwrap of a DB handle + a set of raw prepared-statement query helpers (snapshots, migrations, hit-stats, ProjectContext snapshots). |
| Rate limit | `infrastructure/rate-limit/RecipeSaveRateLimiter.ts` | In-memory sliding-window limiter for recipe submit calls. |
| Realtime | `infrastructure/realtime/RealtimeService.ts` | socket.io server; broadcasts candidate/recipe/rule/job events to the `notifications` room. |
| Shared helpers | `shared/ModuleMiningEvidence.ts`, `search-filters.ts`, `semantic-taxonomy.ts`, `package-assets.ts`, `shutdown.ts` | Coverage-ledger evidence writer, search filter normalizer, internal semantic names, package-root path anchors, graceful-shutdown coordinator. |
| Local types/wire | `types/database.ts`, `graph-shared.ts`, `search-wire.ts` | Local TypeScript shapes (see §17.11 — currently unreferenced within `lib`/`bin`). |

---

### 17.2 Audit logging (`AuditLogger`, `AuditStore`, `AuditStoreQueries`)

Three layers: `AuditLogger` (facade / format normalization / event fan-out) → `AuditStore` (row mapping + stats) → `AuditStoreQueries` (raw SQL over `audit_logs`).

#### AuditLogger — `infrastructure/audit/AuditLogger.ts`

`AuditLogger` (`AuditLogger.ts:10`) holds an `AuditStore`, a winston logger (`Logger.getInstance()`, `:16`), and an optional `AuditEventBus` (`:13`, `:17`). The `AuditEventBus` interface (`:5`) is deliberately minimal — just `emit(event, data)` — so any event bus can be passed without a hard dependency.

`log(entry)` (`:26`) is the heart. It accepts **two overlapping shapes** and reconciles them:
- Gateway style: `{ actor, action, resource, result, data, duration }`.
- Service style: `{ actor, action, resourceType, resourceId, details, timestamp }`.

Reconciliation logic:
1. `resource` is taken directly, else synthesized as `` `${resourceType}:${resourceId}` `` (`:41`).
2. `data` is taken directly, else wrapped from `details` as `{ details }` (`:48`).
3. Builds `auditEntry` (`:50`): `id = entry.requestId || generateId()`, `timestamp = Date.now()`, JSON-stringified `actor_context` (from `entry.context`) and `operation_data`, `result` defaulting to `'success'` (`:58`), `error_message` from `entry.error`, `duration`.
4. `await this.auditStore.save(auditEntry)` (`:64`).
5. On success, emits `'audit:entry'` on the event bus (`:72`) with a **reduced** projection (`id, timestamp, actor, action, resource, result`) — deliberately dropping `operation_data`/`actor_context` from the realtime feed.
6. **Audit failures never throw** (`:81`): a failed save is logged at `error` level and swallowed, so audit persistence never blocks the business operation. This is a deliberate durability-vs-availability tradeoff.

`generateId()` (`:91`) makes `` `audit_${Date.now()}_${random36}` ``. `formatResource()` (`:96`) stringifies non-string resources via `JSON.stringify`. The query facade methods (`query`, `getByRequestId`, `getByActor`, `getByAction`, `getFailures`, `getStats`, `:108`–`:143`) delegate straight to the store; `getFailures` hard-codes `result='failure'` (`:137`).

#### AuditStore — `infrastructure/audit/AuditStore.ts`

`AuditStore` (`AuditStore.ts:37`) wraps a `SqliteDatabase` (from `@alembic/core/database`). Its constructor takes an `AuditDatabaseHandle` (`:20`, `{ getDb(): SqliteDatabase }`) and immediately calls `unwrapSqliteDatabase(db)` (`:41`) — so it can be constructed from either the DI `database` singleton (which exposes `getDb()`) or a raw handle.

- `save()` (`:45`) → `insertAuditLog` (raw insert).
- `query`/`findBy*` (`:61`–`:83`) → the corresponding `AuditStoreQueries` fn, then `.map(mapAuditRow)`.
- `getStats(timeRange)` (`:87`) maps `'24h'|'7d'|'30d'` to `24|168|720` hours (`:88`), computes a `startTime` cutoff, then runs five aggregate queries: total / success / failure counts (`:91`–`:105`), `byActor` and `byAction` group counts (`:106`, `:110`), and an average-duration query. It returns a shaped object with `successRate` as a `.toFixed(2)%` string and `avgDuration` as `` `${ms}ms` `` or `'N/A'` (`:115`, `:122`).
- `cleanup({ maxAgeDays = 90 })` (`:133`) deletes rows older than the cutoff and returns `{ deleted }`; on any error it swallows and returns `{ deleted: 0 }` (`:137`).

`mapAuditRow` (`:145`) converts the snake_case SQL row (`AuditLogSqlRow`) to a camelCase `AuditLogRow` (`:24`), coalescing nulls (`actor_context ?? '{}'`, etc.).

#### AuditStoreQueries — `infrastructure/database/AuditStoreQueries.ts`

Pure functions over a `SqliteDatabase`, one per query. Notable:
- `insertAuditLog` (`:38`) — 10-column parameterized insert into `audit_logs`.
- `queryAuditLogs` (`:66`) uses `buildAuditWhere` (`:173`) to assemble a **parameterized** `WHERE` from optional `actor/action/result/startDate/endDate` filters, always `ORDER BY timestamp DESC`, optional `LIMIT`.
- `findAuditLogByRequestId` (`:77`) — note it filters on `id = ?` (request-id and audit-id are the same column, matching `AuditLogger.log`'s `id = requestId` rule).
- `readAuditGroupCounts` (`:121`) interpolates `field` (`'actor'|'action'`) directly into SQL — safe because the type is a closed union, not user input.
- `deleteAuditLogsBefore` (`:153`) returns `result.changes || 0`.

**DB table:** `audit_logs(id, timestamp, actor, actor_context, action, resource, operation_data, result, error_message, duration)`. Schema DDL is owned elsewhere (Core migrations); these files assume the table exists.

**DI wiring:** `auditStore` and `auditLogger` are registered in `lib/injection/modules/InfraModule.ts:61`/`:65`; `AuditLogger` is handed the `eventBus` singleton when present (`InfraModule.ts:70`). Consumers include `KnowledgeService` (`KnowledgeModule.ts:73`) and `GuardService` (`GuardModule.ts:35`). The `'audit:entry'` event corresponds to the Dashboard M7 §6 socket feed (comment at `AuditLogger.ts:70`).

---

### 17.3 In-memory cache (`CacheService`, `UnifiedCacheAdapter`)

#### CacheService — `infrastructure/cache/CacheService.ts`

A plain `Map<string, { value, expiresAt }>` TTL cache (`CacheService.ts:10`). No Redis dependency; comments (`:1`–`:5`) frame Redis as an optional production upgrade via `UnifiedCacheAdapter`.

- Constructor (`:13`) starts a **60s** interval to `cleanupExpired()` (`:19`) and calls `.unref()` on the timer (`:22`) so the interval never keeps the process alive.
- `get(key)` (`:28`) lazily evicts on read if `expiresAt < Date.now()` and returns `null` on miss/expiry.
- `set(key, value, ttlSeconds = 300)` (`:48`) — **default TTL 300s**.
- `cleanupExpired()` (`:64`) sweeps and logs remaining size at debug.
- `shutdown()` (`:83`) clears the interval and the map.

`CacheKeyBuilder` (`:93`) is a static namespace of key formatters: `candidate:`, `candidates:list:${page}:${limit}[:${status}]`, `recipe:`, `recipes:list:...`, `rule:`, `rules:list:...`, `health:status`, `system:stats`. These conventions matter for coordinated invalidation — flushing `recipes:list:*` requires clearing the whole cache since there's no prefix scan.

A **module-level singleton** `cacheService` is exported (`:131`) and eagerly constructed at import time (so its 60s timer starts on import).

#### UnifiedCacheAdapter — `infrastructure/cache/UnifiedCacheAdapter.ts`

An async-shaped façade over `CacheService` (`UnifiedCacheAdapter.ts:9`). It reuses the **same** `cacheService` singleton (`:14`, imported as `memoryCacheService`) — it does **not** create a second cache. `mode` is hard-coded `'memory'` (`:13`); `initialize()` just logs (`:18`). All ops (`get/set/delete/clear`, `:22`–`:62`) are try/catch wrappers that log errors and return null/false on failure. `getStats()` (`:65`) and `healthCheck()` (`:71`) always report `mode: 'memory'`, `available/healthy: true`.

Its own singleton is managed by `initCacheAdapter()` / `getCacheAdapter()` (`:84`, `:96`); `initCacheAdapter` warns and returns the existing instance if called twice (`:85`); `getCacheAdapter` throws if uninitialized (`:98`). The `_opts.mode` parameter is a **reserved seam** — currently only memory is implemented, but the async signatures and the adapter indirection keep a Redis backend swappable without touching call sites.

---

### 17.4 Cross-process cache invalidation (`CacheCoordinator`)

`infrastructure/cache/CacheCoordinator.ts` is the mechanism that makes the SQLite-as-read-cache design coherent across processes. It implements `Startable` from `@alembic/core/events` (`:28`).

**Principle** (documented `:1`–`:19`): SQLite's `PRAGMA data_version` is a *connection-level* counter that increments when **another** connection (including another process) commits a write. By polling it, one process learns "the DB changed underneath me" without a message bus.

Control flow:
1. Constructor (`:35`) stores the raw `SqliteDatabase`, poll interval (default **2000ms**), and reads the initial `data_version` via `#readVersion()` (`:38`, `:95` → `db.pragma('data_version', { simple: true })`).
2. `subscribe(name, handler)` (`:76`) registers a named invalidation callback and returns an unsubscribe closure.
3. `start()` (`:42`) schedules `#check()` on `timerRegistry.setInterval` (Core-owned registry, `:46`) — idempotent (returns early if already running).
4. `#check()` (`:100`) reads the current version; if unchanged returns `false`. If changed, it updates `#lastVersion`, logs the transition + target subscriber names, then invokes **every** subscriber handler, each guarded by try/catch so one throwing handler doesn't stop the rest (`:116`–`:124`).
5. `stop()`/`dispose()` (`:58`, `:65`) clear the timer.

**Wiring (`lib/injection/ServiceContainer.ts:216` `#initCacheCoordinator`):** the container unwraps the raw DB, constructs a `CacheCoordinator`, registers it, and subscribes two handlers:
- `'guardCheckEngine'` → `guardCheckEngine.clearCache()` (`ServiceContainer.ts:234`).
- `'searchEngine'` → `searchEngine.buildIndex()` (`:239`).

Polling is started **only in long-lived processes**: `coordinator.start()` runs only when `ALEMBIC_MCP_MODE === '1'` or `ALEMBIC_API_SERVER === '1'` (`ServiceContainer.ts:245`–`:248`). CLI invocations construct the coordinator but never poll (short-lived, no cache to keep warm). Init failures are non-blocking (`:255`). The canonical scenario (comment `:15`): an MCP cold-start writes 33 recipes → the HTTP server's `data_version` bumps → its search index and guard cache auto-rebuild within ~2s.

**Gotcha:** `data_version` does **not** change for writes made on the *same* connection — this is purely a cross-connection/cross-process signal. Same-process cache coherence relies on direct invalidation, not on this coordinator.

---

### 17.5 File-based graph cache (`GraphCache`)

`infrastructure/cache/GraphCache.ts` persists arbitrary JSON to `{projectRoot}/.asd/cache/{key}.json`, gated on a content hash.

- Constructor (`:28`) computes `#cacheDir` and optionally takes a `WriteZone` (`@alembic/core/io`). When a `WriteZone` is present, all writes/removes go through it (`:51`–`:53`, `:101`–`:106`) so they're subject to WriteZone governance (e.g. Ghost/external-workspace mode); otherwise it falls back to direct `node:fs` (`:55`–`:58`).
- `save(key, data, meta)` (`:40`) writes `{ version: 1, savedAt, ...meta, data }` as JSON. Errors are caught and logged at `warn` — **save never throws** (`:61`).
- `load(key)` (`:71`) returns parsed JSON or `null` on missing/parse-error.
- `isValid(key, currentHash)` (`:90`) loads and compares `cached.contentHash === currentHash` — the freshness primitive.
- `invalidate(key)` (`:99`) deletes the file (WriteZone or `unlinkSync`).
- Hashing (`:124`–`:154`): `computeFileHash`, `computeContentHash` (delegates to `computeContentHash` from `@alembic/core/shared`, so the algorithm — documented as sha256 hex first-16-chars — is **Core-owned**), and `computeFileHashes` which maps absolute paths to `{ relativePath: hash }`.

**Note:** grepping `lib`/`bin` found **no current importer of `GraphCache`** — it is a self-contained utility that may be consumed by tests, Core, or reserved for a caching path that isn't currently wired. State this honestly rather than assuming a live consumer.

---

### 17.6 SQLite access shims & raw queries (`SqliteDatabaseAccess`)

`infrastructure/database/SqliteDatabaseAccess.ts` is a collection of duck-typed interfaces + raw prepared-statement helpers. It exists so host-side stores can run SQL that Drizzle can't express, and to normalize the various DB-handle shapes.

**Interfaces** (`:1`–`:78`): `SqliteStatement`/`SqliteDatabaseHandle` (minimal `exec/prepare/close`), plus row shapes: `RecipeSnapshotSqlRow` (`:17`), `ActiveRecipeRegionSqlRow` (`:31`, the full recipe projection), `RecipeSourceRefSqlRow` (`:57`), `ProjectContextFileSnapshotRow` (`:63`), `HitStatsUpdateRunner` (`:68`).

**Handle unwrapping:**
- `unwrapSqliteDatabase(db)` (`:80`) — if the arg has a `getDb()` method it calls it, else treats the arg as the handle directly. This is the adapter that lets `AuditStore`, and these helpers, accept either the DI `database` wrapper or a raw better-sqlite3 handle.
- `unwrapPreparedSqliteDatabase(db)` (`:245`) — unwraps then verifies `.prepare` is a function, returning `null` otherwise (defensive guard used by the snapshot helpers).

**Query helpers (all raw SQL):**
- `readLatestSchemaMigrationVersion` (`:91`) — `schema_migrations ORDER BY applied_at DESC LIMIT 1`; try/catch returns `null`.
- `readKnowledgeEntryColumns` (`:103`) — `PRAGMA table_info(knowledge_entries)` (used for schema-drift/feature detection, e.g. whether `dimensionId` exists).
- `readActiveRecipeRegionRows` (`:107`) — dynamic `projectionSql` over `knowledge_entries WHERE lower(lifecycle)='active'`.
- `readRecipeSourceRefRows` (`:121`) — guards on `sqliteTableExists('recipe_source_refs')` (`:139`) and builds an `IN (?, ?, …)` placeholder list.
- `readRecipeSnapshotRows` (`:146`) — marked `@escape-hatch(permanent)` (`:153`): dynamic lifecycle filter + `json_extract(reasoning, '$.sources')`. It conditionally projects `dimensionId` or a literal `'' AS dimensionId` based on `hasDimensionId` (`:150`).
- `readTableRowsForSnapshot` (`:163`) — `SELECT * FROM ${table}` with a **dynamic table name** (`@escape-hatch(permanent)`, `:167`) for DB backup/export. This is SQL-string interpolation of a table name — safe only because callers pass a fixed allow-list of table names, not user input.
- ProjectContext file snapshots (`:170`–`:223`): `clearProjectContextFileSnapshots`, `saveProjectContextFileSnapshotRow` (which lazily `CREATE TABLE IF NOT EXISTS`, `:191`), and `readLatestProjectContextFileSnapshotRow` with strict field-type validation before returning (`:215`–`:222`).
- `createHitStatsUpdateRunner` (`:225`) — returns a runner wrapping a prepared `UPDATE … SET stats = json_set(...)` statement; marked `@escape-hatch(permanent)` because `json_set()` isn't expressible in Drizzle (`:227`). It increments a JSON stat field (`guardHits`/`searchHits`-style counters) and bumps `updatedAt`.

**Escape-hatch discipline:** the three `@escape-hatch(permanent)` markers are the sanctioned exceptions to the "use Drizzle" rule — each documents *why* raw SQL is required (dynamic projection, dynamic table for backup, `json_set`). Modifying these should preserve the marker + reason.

**Boundary caveat:** `readKnowledgeEntryColumns`, `readActiveRecipeRegionRows`, and `readRecipeSnapshotRows` return rows from `knowledge_entries` — Alembic's recipe projection table. The row **shapes** are typed here, but the table is a *cache* rebuilt from markdown; these helpers are read-side projections, and the hit-stats runner is the only writer among them.

---

### 17.7 Recipe-save rate limiter (`RecipeSaveRateLimiter`)

`infrastructure/rate-limit/RecipeSaveRateLimiter.ts` is an in-memory sliding-window limiter for the recipe submit path. The header comment (`:1`–`:17`) records an "AD4 relocation": it used to be bare module state in `lib/http/middleware/RateLimiter.ts`; because its only consumers are resident submit pipelines (never the HTTP host), it was moved to `infrastructure/` to make the dependency edge a plain downward `resident → infrastructure` edge instead of a layering inversion.

Algorithm (`check`, `:38`):
1. Defaults: `windowMs = 60_000`, `maxRequests = 10` (`:43`), key = `` `${projectRoot}:${clientId}` `` (`:45`).
2. `#pruneIfNeeded(windowMs)` (`:48`) runs at most every **5 minutes** (`PRUNE_INTERVAL_MS`, `:31`), sweeping stale timestamps and deleting empty buckets to bound memory (`:69`).
3. Filters the bucket's timestamps to those within the window (`:56`).
4. If `>= maxRequests`, computes `retryAfter` seconds from the oldest timestamp and returns `{ allowed: false, retryAfter }` (`:58`).
5. Otherwise pushes `now` and returns `{ allowed: true }`.

`clear()` (`:84`) empties all buckets (test/shutdown disposal).

**Lifecycle / DI:** the production instance is the container singleton `'recipeSaveRateLimiter'` registered in `lib/injection/modules/AppModule.ts:47`. `resolveRecipeSaveRateLimiter(container)` (`:108`) duck-types `container.get('recipeSaveRateLimiter')`, `instanceof`-checks it, and **falls back to a lazily-created process default** (`getDefaultRecipeSaveRateLimiter`, `:93`) when the container lacks the registration (minimal/mock test contexts). The fallback preserves the old process-global semantics while remaining disposable via `resetDefaultRecipeSaveRateLimiter()` (`:99`). This is a compatibility seam with a documented owner/consumer, satisfying the repo's "temporary compatibility code needs a consumer + cleanup" rule.

---

### 17.8 Realtime service (`RealtimeService`)

`infrastructure/realtime/RealtimeService.ts` wraps a socket.io server for Dashboard live updates.

- Constructor (`:12`) attaches `SocketIOServer` to the Node `http.Server`, with permissive CORS (`origin: '*'`, GET/POST) (`:14`), `transports: ['websocket', 'polling']`, and explicit `pingInterval: 25000` / `pingTimeout: 20000` (`:19`).
- `setupEventHandlers()` (`:27`) handles `connection`, then per-socket: `join-notifications` (joins the `notifications` room, acks with `notification-joined`), `leave-notifications`, `disconnect`, and `ping`→`pong` health check (`:40`–`:62`).

**Broadcast contract** — all broadcasts target the single `notifications` room:

| Method (`file:line`) | Emitted event | Payload |
|----------------------|---------------|---------|
| `broadcastCandidateCreated` (`:67`) | `candidate-created` | `{ type: 'candidate_created', candidate, timestamp }` |
| `broadcastCandidateStatusChanged` (`:76`) | `candidate-status-changed` | `{ type, candidateId, newStatus, oldStatus, timestamp }` |
| `broadcastTokenUsageUpdated` (`:87`) | `token-usage-updated` | `{ type, timestamp }` |
| `broadcastRecipeCreated` (`:95`) | `recipe-created` | `{ type, recipe, timestamp }` |
| `broadcastRecipePublished` (`:104`) | `recipe-published` | `{ type, recipeId, recipe, timestamp }` |
| `broadcastRuleCreated` (`:114`) | `rule-created` | `{ type, rule, timestamp }` |
| `broadcastRuleStatusChanged` (`:123`) | `rule-status-changed` | `{ type, ruleId, enabled, timestamp }` |
| `broadcastEvent(name, data)` (`:133`) | `<name>` | raw `data` (no `type`/`timestamp` wrapper) |
| `broadcastJobProcessEvent(payload)` (`:139`) | `job:process-event` | `{ ...payload, timestamp }` |

`broadcastEvent` (`:133`) is deliberately un-wrapped to match front-end hooks that expect the raw shape. `broadcastJobProcessEvent` (`:139`) only carries the Core "developer view" payload (`JobProcessEventBroadcastPayload` from `daemon/JobProcessEventRecorder.js`) and the comment stresses it must not leak raw/secret content (`:138`).

**Lifecycle:** module-level singleton via `initRealtimeService(httpServer)` / `getRealtimeService()` (`:160`, `:168`); `getRealtimeService` throws if uninitialized (`:170`). It is initialized inside `lib/http/HttpServer.ts:412` (only when the HTTP server boots). Consumers that may run **without** an HTTP server (CLI, some tests) guard access with try/catch — e.g. `InfraModule.ts:80` (`bootstrapTaskManager`) and `:106` (`jobProcessEventRecorder`) both swallow the "not initialized" throw. So realtime broadcasts are best-effort: present when the Dashboard/HTTP server is up, silently no-op otherwise.

---

### 17.9 Shared helpers

#### shutdown.ts — graceful shutdown coordinator (`shared/shutdown.ts`)

A singleton `ShutdownCoordinator` (`:27`, exported as `shutdown`, `:127`) shared by all entrypoints. Guarantees (`:1`–`:12`): re-entrancy guard (`#shutting`, `:65`), **LIFO** hook execution (last-registered closes first, `:80`), a hard timeout (`DEFAULT_TIMEOUT_MS = 10_000`, `:25`) that `process.exit(1)` if draining hangs (`:73`, the timer is `.unref()`'d), and **hook isolation** — a throwing hook is logged and skipped, marking `hasFailure` but not aborting the rest (`:82`–`:91`).

API: `register(fn, label)` (`:46`), `setTimeout(ms)` (`:54`), `execute(signal)` (`:64`, self-terminates via `process.exit(hasFailure ? 1 : 0)`, `:95`), `install()` (`:102`, wires `SIGTERM`+`SIGINT`), plus `isShuttingDown`/`hookCount` getters. Consumers: `bin/api-server.ts`, `bin/cli.ts`, `bin/daemon-server.ts`, and `lib/injection/modules/SignalModule.ts`. The WAL-checkpoint step referenced in its doc comment (`:9`) is actually performed by a registered hook in `lib/Bootstrap.ts:239` (`wal_checkpoint(TRUNCATE)`), not by the coordinator itself — the coordinator only orchestrates ordering/timeout.

#### package-assets.ts — package-root anchors (`shared/package-assets.ts`)

Resolves the `alembic-ai` package root and derives asset directories. `findAlembicPackageRoot()` (`:15`) walks up to 10 ancestor directories from `import.meta.url`'s dir, reading each `package.json` and matching `name === 'alembic-ai'` (`:22`) — this disambiguates from Core/other packages in the workspace. Throws if not found (`:35`). Exports `PACKAGE_ROOT` (`:38`) and, joined via `DEFAULT_FOLDER_NAMES.package.*` (from `@alembic/core/workspace`): `CONFIG_DIR`, `PACKAGE_SKILLS_DIR` (aliased `INTERNAL_SKILLS_DIR`; `INJECTABLE_SKILLS_DIR` is `@deprecated`, `:48`), `TEMPLATES_DIR`, `RESOURCES_DIR`, `DASHBOARD_DIR`. Consumed in ~9 files across `lib`. **Boundary:** Core owns *generic* package-root primitives (`DEFAULT_FOLDER_NAMES`); this adapter pins them to the outer host package.

#### search-filters.ts — filter normalization (`shared/search-filters.ts`)

Pure, dependency-free normalizer for search query filters. `normalizeSearchFilters(input)` (`:24`) reads the six scalar filter keys (`category, dimensionId, kind, knowledgeType, language, scope`, `FILTER_KEYS` `:13`) from either the top-level input or a nested `input.filters` record (`:29`), plus `tags` (accepting `tags`/`tag`, top-level or nested, `:33`). `readStringValues` (`:69`) splits comma-strings, flattens arrays, and trims/filters empties. `assignFilterValue` (`:57`) dedupes and collapses to a **single string when there's exactly one value, else an array** (`:66`) — a compaction that downstream SQL/consumers must handle both shapes for. `hasSearchFilters` (`:43`) and `toSearchFilterRecord` (`:47`, drops empty values) are helpers.

#### semantic-taxonomy.ts — internal naming (`shared/semantic-taxonomy.ts`)

Stable internal names for modes/causes, explicitly "internal" and decoupled from resident MCP input schemas (`:1`–`:6`). Defines: `HOST_INTENT_CONTEXT_MODES` (`:8`) + `HostIntentContextMode`; `HOST_INTENT_LEGACY_COMPATIBILITY` (`:16`) — a compatibility record naming owner (`alembic-main`), consumer (`alembic-plugin`), and cleanup trigger (remove legacy `userQuery/activeFile/language` fallback once the Plugin host-intent frame is the sole input path); `KnownSearchMode`/`SearchModeLabel` (`:23`); `SEARCH_MODE_FIELD_TAXONOMY` (`:36`, documents the meaning of `actualMode/degradedMode/hookMode/legacyFallbackMode/requestedMode/runtimeMode` — the diagnostic fields that must not be confused with real engine execution); and `DEPRECATED_LIFECYCLE_CAUSES` (`:46`, `manual-curation`/`evolution-decay`/`source-orphan-cleanup`) + `DeprecatedLifecycleCause`. Consumed by `lib/http/routes/search.ts`. This is documentation-as-code: it gives tests/code a single source for these labels without changing wire schemas.

#### ModuleMiningEvidence.ts — coverage-ledger writer (`shared/ModuleMiningEvidence.ts`)

The largest shared helper. It converts module-mining results into coverage-ledger cell upserts (the per-(module × dimension) coverage evidence). Consumed by `lib/daemon/ModuleMiningWorkflow.ts` and `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` — the two workflows that mine recipes per dimension.

Key exports:
- `toModuleMiningSelectedModulePayloads(modules, {projectRoot})` (`:99`) — normalizes raw module records to `ModuleMiningSelectedModulePayload`, computing the **canonical module id** via `buildCanonicalCoverageLedgerModuleId` from `@alembic/core/host-agent-workflows` (`:105`). Modules that produce no canonical id are dropped (`:111`). It layers dimension resolution: `plannedDimensions` → `dimensions` (falling back to planned) → `dimensionIds` (falling back to dimensions), via `moduleDimensionIds` (`:405`).
- `readModuleMiningSourceRefSnapshot(container)` (`:143`) — reads the `recipeSourceRefRepository` service and snapshots current source-refs (recipeIds set + records), filtering `stale` refs and stripping line anchors (`normalizeSourceRefs`, `:346`).
- `readModuleMiningSourceRefDelta(container, before)` (`:161`) — diffs before/after snapshots to compute newly-added source-refs (the evidence of what this mining round actually produced).
- `writeModuleMiningCoverageLedger(input)` (`:183`) — the main writer. It:
  1. Normalizes modules + source-ref paths (stripping line anchors, `stripSourceRefLineAnchor` `:472`).
  2. Short-circuits with a `status: 'skipped'` summary + a `reason` for each guard: `no-selected-modules`, `no-source-refs`, `missing-project-root`, `repository-unavailable`, `no-matching-source-refs` (`:204`–`:216`, `:293`).
  3. For each module × dimension, matches source-ref paths to the module via `sourcePathMatchesModule` (`:374`, prefix/suffix/exact match against `modulePath`, structured-id aliases, and `ownedFiles`), with a **single-module fallback** that attributes *all* source-refs to the one module when there's exactly one (`sourceRefPathsForModule`, `:360`).
  4. Merges with any existing cell (union of `coveredSourceRefs`, `max` of counts), computes `grade` (`coverageGrade` `:451`: `empty`/`partial`/`covered`), a `valueScore = min(100, 50 + coveredCount*10)` (`:265`), and `upsertCell`s (`:254`).
  5. Returns a `ModuleMiningCoverageLedgerSummary` (`status: 'written'` with per-cell summaries, or `skipped` with a reason) and logs it as `stage: 'module-mining-coverage-ledger'` evidence (`:295`).

**Boundary:** the *canonical module-id derivation* (`buildCanonicalCoverageLedgerModuleId`) and the *coverage-ledger repository/state model* are Core-owned (`@alembic/core/host-agent-workflows`); this file is the **host-side orchestration** that reads host DI services (`recipeSourceRefRepository`, `coverageLedgerRepository`) and computes/records evidence. This is the module referenced in memory as the dual-host coverage-writer whose module-id derivation had to be unified (`ProjectMapModules` in-process vs `knowledge-rescan` host path) — `buildCanonicalCoverageLedgerModuleId` is the convergence point.

---

### 17.10 `DatabaseProvider` (`types/database.ts`)

`DatabaseProvider` (`types/database.ts:9`) is the DI abstraction that replaces a global `getDrizzle()` singleton: `getDrizzle(): DrizzleDB` (type-safe) and `getDb(): better-sqlite3.Database` (raw). Both `DrizzleDB` and the Drizzle wrapper are from `@alembic/core/database`. This interface is the contract that `unwrapSqliteDatabase` (§17.6) duck-types against (`getDb()`), enabling multi-project isolation instead of a process-global connection.

---

### 17.11 Local wire/type modules — currently unreferenced

`types/graph-shared.ts` and `types/search-wire.ts` define local TypeScript shapes:
- `graph-shared.ts` — `EntityType` (`:9`), `RelationType` (`:19`), `GraphNodeRef` (`:31`), `GraphEdgeRef` (`:38`); doc-comment says they're shared between "Bootstrap pipeline and KnowledgeGraphService" (`:1`).
- `search-wire.ts` — a layered decomposition of a "25+ optional field" `SearchResultItem`: `SearchHitBase` (`:13`), `WeightedHit` (`:28`), `VectorHit` (`:34`), `RankedSearchItem` (`:44`), `SearchResponse` (`:65`). Doc-comment says "existing code may keep using `SearchResultItem`; new code should use these layered types" (`:5`).

**Verified fact:** grepping `lib`, `bin`, and the whole repo found **no importer** of `types/graph-shared.ts`, `types/search-wire.ts`, or the `DatabaseProvider` symbol (`types/database.ts`). Notably, `lib/http/routes/search.ts` imports `SearchResponse` from `@alembic/core/search`, **not** the local `search-wire.ts` version — so the local `SearchResponse` here is a distinct, unused shape. I cannot verify a live consumer from the source; these three modules appear to be either legacy/aspirational type definitions or reserved for a not-yet-wired path. A new engineer should not assume changing them affects runtime behavior without first re-confirming there is no importer.

---

### 17.12 Boundary note — host-owned here vs delegated to `@alembic/core` / `@alembic/agent`

**Implemented and wired in THIS repo (host layer):**
- All audit logging *plumbing*: `AuditLogger` (format reconciliation, event fan-out, failure-swallowing), `AuditStore` (row mapping, stats aggregation, cleanup), and every SQL statement in `AuditStoreQueries` over the `audit_logs` table.
- The entire in-memory cache (`CacheService` + `CacheKeyBuilder`), its adapter (`UnifiedCacheAdapter`, incl. the reserved Redis-mode seam), the cross-process `CacheCoordinator` polling loop + subscriber fan-out, and the file cache `GraphCache` (save/load/isValid/invalidate logic).
- The raw prepared-statement helpers and handle-unwrapping in `SqliteDatabaseAccess` (including the three `@escape-hatch(permanent)` raw queries and the ProjectContext-snapshot table lifecycle).
- `RecipeSaveRateLimiter` (the whole sliding-window algorithm + container/default-instance resolution).
- `RealtimeService` (socket.io wiring, room model, the full broadcast contract).
- Shared host utilities: `shutdown` coordinator ordering/timeout/isolation, `package-assets` package-root resolution, `search-filters` normalization, `semantic-taxonomy` internal names, and the host-side orchestration in `ModuleMiningEvidence` (reading host DI services and building/recording coverage evidence).

**Delegated to `@alembic/core` (imported, not implemented here):**
- `SqliteDatabase`, `DrizzleDB`, and the DB **connection / `journal_mode=WAL` / migrations / schema** — these files operate on an already-open handle; WAL checkpointing on shutdown lives in `lib/Bootstrap.ts` + Core.
- `Logger` (`@alembic/core/logging`), `Startable` + `timerRegistry` (`@alembic/core/events`), `WriteZone` (`@alembic/core/io`), `computeContentHash` (`@alembic/core/shared`), `DEFAULT_FOLDER_NAMES` (`@alembic/core/workspace`).
- `buildCanonicalCoverageLedgerModuleId` and the coverage-ledger **state/repository model** (`@alembic/core/host-agent-workflows`) — `ModuleMiningEvidence` is the host caller of this Core-owned convergence primitive.
- The authoritative `SearchResponse` used by real search routes comes from `@alembic/core/search`, not the local `search-wire.ts`.

**Not present here (`@alembic/agent`):** none of these infrastructure files import `@alembic/agent`; the in-process agent runtime and tool system are out of scope for this subsystem. Realtime job-process broadcasts (`broadcastJobProcessEvent`) carry a Core "developer view" payload assembled by `daemon/JobProcessEventRecorder` (host), and are explicitly scrubbed of raw/secret content.

**One-line summary:** this section is the host's *substrate* — persistence shims, caches, rate limiting, realtime transport, and shutdown — sitting **on top of** Core's DB engine, logging, events, IO, and coverage-ledger model, and **underneath** the CLI/daemon/HTTP/Dashboard layers that consume it via DI.


---


## 18. End-to-End Flows, Design Patterns, Cross-Cutting Concerns & Glossary

This closing section synthesizes the sixteen subsystem sections into the chains that actually run, the recurring patterns that hold the host layer together, the concerns that cut across every subsystem, the persistence shape, and a glossary of Alembic-specific vocabulary. Every claim is anchored to a real `file:line` in the `Alembic/` main-body repo (folder `Alembic/`, package `alembic-ai`). Where a detail could not be verified directly from source it is marked **(inferred)**.

Repo-boundary reminder throughout: this repo is the **host layer** (CLI / daemon / HTTP / DI container / workflows / sandbox / tool adapters). The organism engine — Recipe lifecycle state machine, Panorama/ProjectContext query capability, SignalBus, Guard rule engine, coverage-ledger algebra, plan math, checkpoint/persist, dedup — lives in **`@alembic/core`**; the in-process agent loop + memory + tool runtime live in **`@alembic/agent`**. The flows below are host orchestration wrapping those two engines.

---

### 18.1 End-to-End Flows

#### Flow 1 — Cold-start bootstrap (setup → daemon → plan → dimension mining → completion → knowledge base)

This is the flagship chain: turn a fresh checkout into a populated knowledge base. It has a **fast synchronous skeleton** and a **fire-and-forget async fill**.

```
CLI/MCP/HTTP/daemon entry
   │  alembic setup  (SetupService, 5 idempotent steps)
   ▼
runProjectIndexWorkflow(mode:'full')           ProjectIndexWorkflow.ts:52 → ColdStartWorkflow.ts:103
   │  (daemon path first passes through a plan gate)
   ├─ runBootstrapPlanGate ── plan Agent behind ≤12KB projection   DaemonJobRunner.ts:873; PlanSelectionGate.ts:29/39
   ▼
runColdStartProjectIndexWorkflow              ColdStartWorkflow.ts:106
   ├─ Step 0  runFullResetPolicy → CleanupService.fullReset (FK-ordered trash-bin)   ColdStartWorkflow.ts:130
   ├─ Ph1-4   buildProjectContextWorkflowFacts (Core ProjectContext queries)         ColdStartWorkflow.ts:155
   ├─ dim sel resolveColdStartWorkflowDimensionSelection (explicit>plan>base)         ColdStartWorkflow.ts:174/342
   ├─ session createProjectContextWorkflowSession(replaceExisting)                    ColdStartWorkflow.ts:210
   ├─ startAiDimensionSession → task-ledger skeleton, returns immediately             ColdStartWorkflow.ts:245
   ├─ dispatchAiDimensionRuns  (fire-and-forget, setImmediate)                        ColdStartWorkflow.ts:265
   └─ return presentProjectContextColdStartResponse (skeleton "filling")              ColdStartWorkflow.ts:309
                                   │  async, in background
                                   ▼
runAiDimensionPipeline → runAiDimensionPipelineForResult   AiDimensionPipeline.ts:62/26
   ├─ prepareAiDimensionRun (AI-availability gate; no mock fallback)  AiDimensionPipeline.ts:30
   ├─ initializeBootstrapRuntime (SessionStore/PersistentMemory/DimensionContext)  AiDimensionPipeline.ts:41
   ├─ runAiDimensionSession — parent bootstrap-session fans out to child bootstrap-dimension runs  :57
   └─ finalizeAiDimension → completion + report augmentation        AiDimensionPipeline.ts:58
                                   │
                                   ▼
finalizeAiDimensionPipeline → runWorkflowCompletionFinalizer  AiDimensionFinalizer.ts:114 / CompletionFinalizer.ts:26
   ├─ scheduleTask(generateWiki)  (only when wikiMode==='schedule')  CompletionSteps.ts:21
   ├─ await consolidateSemanticMemory (immediate)                    CompletionSteps.ts:83
   └─ persistWorkflowResult + writeWorkflowReportHistory (Core)      (bootstrap-report.json)
```

Step list with anchors:

1. **Workspace scaffold** — `alembic setup` runs `SetupService` 5 idempotent steps (runtime dir/config.json → knowledge dir + recipes sub-repo git → DB init via temp `AppRuntime` → no-op platform → best-effort vector index), guarded by a native-ProjectScope check before multi-repo init (`lib/cli/SetupService.ts:82`, `:795`).
2. **Process boot** — a `bin/*.ts` entrypoint sets mode flags, installs the LIFO shutdown coordinator, configures the Core pathGuard, runs `AppRuntime.initialize()` (6-step ordered: settings→pathGuard→resolver→config→logger→db+migrations→audit→skillHooks→gateway), then `getServiceContainer().initialize(components)` (`lib/Bootstrap.ts:37`, `lib/injection/ServiceContainer.ts:22`).
3. **Entry dispatch** — `runColdStartWorkflow` is a trampoline to `runProjectIndexWorkflow(ctx, args, {mode:'full'})` (`ColdStartWorkflow.ts:99-104`); the mode registry resolves the lazily self-registered `'full'` runner (`ColdStartWorkflow.ts:321`, `ProjectIndexWorkflow.ts:52`).
4. **Plan gate (daemon path)** — for daemon bootstrap jobs, `executeApiAiWorkflow` first calls `runBootstrapPlanGate`, running the plan Agent against a Core-trimmed **≤12KB** `projectInfoTree` projection, so its `budget`/`executionDimensions` steer generation (`DaemonJobRunner.ts:873`, `PlanSelectionGate.ts:29`).
5. **Full reset** — `runFullResetPolicy` builds `CleanupService` and clears DB tables (FK-ordered, fail-closed) + filesystem caches for a clean initial state (`ColdStartWorkflow.ts:130`, `lib/service/cleanup/CleanupService.ts:176`).
6. **Facts assembly (Phase 1-4)** — `buildProjectContextWorkflowFacts` fires the bounded, deterministic Core ProjectContext query fan-out (space→repo→map→module→per-file) and folds the envelopes into the host `ProjectContextWorkflowFacts` blob; empty projects short-circuit to `presentProjectContextColdStartEmptyProject` (`ColdStartWorkflow.ts:155/165`).
7. **Dimension selection** — `resolveColdStartWorkflowDimensionSelection` picks the execution set: explicit ids > plan projection > base dimensions, and **hard-fails rather than silently widening back to the full set** when the plan gate returns nothing (`ColdStartWorkflow.ts:174/342`, throws at `:360/:371`).
8. **Session + skeleton** — a `ProjectContextWorkflowFacts` session lease is opened (`replaceExisting:true`), mission artifacts built, then `startAiDimensionSession` returns a task-ledger skeleton immediately (`ColdStartWorkflow.ts:210/245`).
9. **Fire-and-forget fill** — unless `skipAsyncFill` (CLI non-`--wait`), `dispatchAiDimensionRuns` kicks the background pipeline and the function returns the "filling" skeleton envelope (`ColdStartWorkflow.ts:264/309`).
10. **Async dimension mining** — `runAiDimensionPipelineForResult` gates AI availability, builds the per-session runtime, runs the parent `bootstrap-session` agent run that fans out to child `bootstrap-dimension` runs with tiered/parallel concurrency, each accumulating its digest into `DimensionContext` (`AiDimensionPipeline.ts:26-59`; Section 08).
11. **Consume → persist** — per dimension, `consumeBootstrapDimensionResult` does candidate accounting, SessionStore writes, PCV evidence, checkpoint, `DimensionStat`; `knowledgeService.create` then `publish` moves candidates PENDING→ACTIVE (`BootstrapConsumers.ts:522`; Section 09).
12. **Completion (bootstrap only)** — `finalizeAiDimensionPipeline` → `runWorkflowCompletionFinalizer`: schedules Wiki generation (`generateWiki`, `CompletionSteps.ts:21`) and awaits immediate semantic-memory consolidation (`consolidateSemanticMemory`, `CompletionSteps.ts:83`); **rescan short-circuits both for pipeline isolation** (`AiDimensionFinalizer.ts:114`; Section 10).
13. **Skill delivery** — `consumeBootstrapSkills` writes `SKILL.md` files via WriteZone/pathGuard and emits `ProjectSkillDeliveryReceipt`s whose `runtimeExport` is pending — host writes, **AlembicPlugin exports** (`BootstrapConsumers.ts:1071`; Section 10).
14. **Daemon job finalize** — if a `bootstrapSession` is still running, the job stays running and `linkBootstrapSessionCompletion` subscribes to `bootstrap:all-completed` to finalize the `DaemonJobRecord` (`DaemonJobRunner.ts:914/1053`).

Boundary: control flow, session lifecycle, DI, event bridging, filesystem writes = host; dimension catalog / tier scheduler / checkpoint / dedup = Core; agent loop + memory + consolidator = agent.

#### Flow 2 — Incremental rescan / evolution on file change (file-change → collector → rescan → coverage write-back)

Two triggers converge on the same incremental pipeline: a background daemon file monitor, and an explicit `alembic rescan` / job.

```
filesystem change
   ▼
DaemonFileChangeCollector (native fs.watch primary, git-poll fallback)   lib/service/evolution/DaemonFileChangeCollector.ts:77
   ▼
FileChangeDispatcher.dispatch  ── or ── POST /api/v1/file-changes         lib/service/FileChangeDispatcher.ts:88 ; routes/file-changes.ts:56
   ▼
InProcessFileChangeHandler → EvolutionGateway.submit (update/deprecate proposals + quality signals)  lib/service/evolution/InProcessFileChangeHandler.ts:48
   ▼  (proposals are reviewed; a rescan is the deeper re-mine)
runProjectIndexWorkflow(mode:'incremental')  DaemonJobRunner.ts:905 → KnowledgeRescanWorkflow.ts:191
   ├─ syncKnowledgeStoreForRescan + SourceRefReconciler
   ├─ RecipeImpactPlanner.plan(diff) + runEvolutionAudit
   ├─ gap analysis → produce-session route
   ├─ Step 7: module-mining | dimension-fill (inline/dispatch) | no-fill
   └─ onDimensionResult → writeKnowledgeRescanCoverageLedgerForDimension   KnowledgeRescanWorkflow.ts:909
        └─ writeCoverageLedgerForCompletion (Core) upserts per module×dimension cells
```

Step list with anchors:

1. **Detection** — `DaemonFileChangeCollector` watches via native `fs.watch` (primary) with git-worktree polling fallback, doing inode/content rename detection and emitting dedup/idempotency tokens (`lib/service/evolution/DaemonFileChangeCollector.ts:77`; Section 14).
2. **Fan-out** — `FileChangeDispatcher.dispatch` fans events to subscribers with `Promise.allSettled` isolation and report merge; an external host can inject the same feed via `POST /api/v1/file-changes` (zod-validated, project-relative path-safety) (`lib/service/FileChangeDispatcher.ts:88`, `routes/file-changes.ts:56`).
3. **Reactive proposal (not mutation)** — `InProcessFileChangeHandler` submits update/deprecate **proposals** through Core's `EvolutionGateway.submit` and emits `quality` signals — it never edits recipes directly (`lib/service/evolution/InProcessFileChangeHandler.ts:48`; Section 14).
4. **Rescan entry** — `alembic rescan` or a rescan job dispatches `runProjectIndexWorkflow(mode:'incremental')`; the daemon path routes by `generationStage` (`deepMining` → `runDeepMiningRounds`, `moduleMining` → `runModuleMiningWorkflow`, else plain incremental) (`DaemonJobRunner.ts:894-909`).
5. **Preserve + reconcile** — the rescan body preserves recipes, `syncKnowledgeStoreForRescan`, and reconciles SourceRefs via Core `SourceRefReconciler`, then runs `RecipeImpactPlanner.plan(diff)` + `runEvolutionAudit` and computes gap dimensions (`KnowledgeRescanWorkflow.ts:195`; Section 10).
6. **Dimension fill** — Step-7 branch mines gap dimensions inline (`runAiDimensionPipelineForResult`, awaited) or async (`dispatchAiDimensionRuns`) depending on `runAsyncFillInline` (Section 08/10).
7. **Coverage write-back** — the per-dimension hook `writeKnowledgeRescanCoverageLedgerForDimension` is the historically fragile sink: it skips on `no-accepted-candidates` / `repository-unavailable` / `no-project-map-modules` / `no-source-refs`, else builds module axes + candidates and calls Core `writeCoverageLedgerForCompletion` to upsert per module×dimension cells with grade/valueScore (`KnowledgeRescanWorkflow.ts:909-968`). This host write-back is a **mirror** of the plugin/host-agent `alembic_dimension_complete` behavior.
8. **Periodic maintenance** — independently, `EvolutionMaintenanceSweep` ticks ~60s over Core drivers (`stagingManager.checkAndPromote` / `lifecycleStateMachine.checkTimeouts` / `proposalExecutor.checkAndExecute` / `decayDetector.scanAll`), bounded + single-flight (`lib/service/evolution/EvolutionMaintenanceSweep.ts:77`; Section 14).

Boundary: production + fan-out + rescan orchestration + coverage write-back sink = host; impact/evolution/coverage/reconcile/gate engine = Core; mining/audit AI = agent.

#### Flow 3 — HTTP / MCP request lifecycle (request → middleware/gateway → route → service/Core → response, incl. SSE/realtime)

```
HTTP request
  helmet → requestLogger → trackRequestLifecycle → json/urlencoded → cors
        → sourceResolverMiddleware (sets req.resolvedSource/Actor)
        → gatewayMiddleware (injects req.gw)
        → per-path timeout (AI 10min / SSE 5min / else 60s)          HttpServer.ts:132-201
  ▼
router (~26 routers under /api/v1)
  ├─ validate/validateQuery/validateParams (zod, replaces req.body)  middleware/validate.ts
  ├─ req.gw(action,resource,data) → Gateway.execute → registry closure → Core service   gatewayMiddleware.ts:36 ; Gateway.ts:91
  ├─ container.get(service) → delegate to @alembic/core or @alembic/agent
  └─ shape response: {success:true,data} | sendToolEnvelopeResponse | problem-taxonomy
  ▼
errorHandler (terminal) — GatewayError → HTTP JSON ; domain error → status  HttpServer.ts:356
```

Step list with anchors:

1. **Ordered middleware chain** — later middleware depend on earlier request state; the fixed order is helmet → `requestLogger` → lifecycle tracker → body parse → cors → `sourceResolverMiddleware` (must run before gateway) → `gatewayMiddleware` → per-path timeout (`HttpServer.ts:132-201`). Streaming paths (`/stream`, `/events/`) are tracked for graceful shutdown (`HttpServer.ts:203-225`).
2. **Governance enforcement** — a route calls `req.gw(action, resource, data)`; the actor is derived from `resolvedSourceActor`, `Gateway.execute` runs validate→guard(no-op)→route→audit against the boot-time `registerGatewayActions` table, and on failure throws `GatewayError` that the terminal `errorHandler` maps to HTTP (`gatewayMiddleware.ts:36`, `Gateway.ts:91`, `GatewayActionRegistry.ts:21`; Section 05/16).
3. **Validation** — `validate(schema)` `safeParse`s and replaces `req.body`/query/params with parsed+defaulted data, returning `400 VALIDATION_ERROR` with `flatten()` on failure (`middleware/validate.ts:28`; Section 05).
4. **Delegation** — the route resolves a typed service from `ServiceContainer`/`ServiceMap` and delegates the real work to `@alembic/core` (KnowledgeService, SearchEngine, GuardCheckEngine…) or `@alembic/agent` (AgentService.run, task DAGs) — routers implement no organism logic (Sections 06/07).
5. **Response shaping** — unified through `{success,data}` / `{success,error}` envelopes, `sendToolEnvelopeResponse` (maps `ToolResultStatus`→HTTP), and `buildAlembicHttpProblem` (19-field problem object projected from Core failure taxonomy) (`tool-envelope-response.ts:4`, `problem-taxonomy.ts:46`; Section 05).
6. **Two-phase SSE** — streaming endpoints (chat, module scan, refine-preview) return a `sessionId` immediately, run the work in `setImmediate`/background, and the client `GET .../events/:sessionId` replays the buffer then subscribes live with a heartbeat; the `SseSessionRegistry` manages TTL/cleanup (`utils/sse-sessions.ts:32`; Sections 05/06/07).
7. **Realtime bridge** — on `start()`, `HttpServer` bridges EventBus events (`lifecycle:transition`, `signal:event`, `guard:updated`, `audit:entry`) to `RealtimeService` socket.io broadcasts into the `notifications` room (`HttpServer.ts:438-464`, `RealtimeService.ts:10`; Section 17).
8. **MCP parity** — the same workflows are reachable as MCP tools (`alembic_bootstrap`, `alembic_rescan`, `alembic_dimension_complete`, `alembic_search`, `alembic_code_guard`, …); MCP handlers return the standardized `envelope()` / problem shapes (`lib/service/handler-runtime/envelope.ts:30`; Section 14).

Boundary: transport, middleware ordering, gateway enforcement, validation, SSE/realtime plumbing, response shaping = host; the actual action handlers, failure taxonomy, tool-result contract = Core/agent.

#### Flow 4 — Guard check (host route → Core guard engine → violations → response)

```
POST /api/v1/guard/file  (or  alembic guard <file> / guard:ci / MCP alembic_code_guard)
  ▼  routes/guard.ts (mounted HttpServer.ts:277)
read/receive code
  ▼
import @alembic/core/guard GuardCheckEngine (get-or-create; inject Enhancement-Pack rules once)
  ▼
detectLanguage → engine.checkCode  (Core rule engine)
  ▼
format Agent diagnosticMessage
  ├─ guardFeedbackLoop.processFixDetection   (best-effort)
  └─ violationsStore.appendRun                (best-effort persistence)
  ▼
{success,data:{violations,...}}   — later read via GET /api/v1/violations
```

Step list with anchors:

1. **Entry** — `POST /api/v1/guard/{file,batch}` (`routes/guard.ts`, mounted `HttpServer.ts:277`), or CLI `alembic guard` / `guard:ci` / `guard:staged` (`bin/cli.ts`), or MCP `alembic_code_guard`. `guard:ci` walks the project (SKIP_DIRS) and gates the exit code 0/1/2/3 (Section 03).
2. **Engine acquisition** — the route imports `GuardCheckEngine` from `@alembic/core/guard` (get-or-create), injecting Enhancement-Pack rules **once** via `resolveEnhancementGuardRules` (Section 07).
3. **Check** — `detectLanguage` then `engine.checkCode` runs the Core rule engine; the host formats the agent-facing `diagnosticMessage` (Section 07).
4. **Best-effort persistence** — `guardFeedbackLoop.processFixDetection` + `violationsStore.appendRun` are wrapped best-effort so persistence never breaks the check response; violations are later read via `GET /api/v1/violations` / `/stats` and cleared via `POST /clear` (Section 07).
5. **Scan integration** — the full-project module scan also runs `guardCheckEngine.auditFiles` and persists via `violationsStore.appendRun` (`ModuleService.scanProject`; Section 12).

Boundary at this level: route shaping, engine wiring, best-effort violations persistence, exit-code gating = host; the Guard rule engine, rule learning, exclusion management, feedback loop = `@alembic/core/guard`.

#### Flow 5 — Knowledge lifecycle / evolution sweep (staging → active → decaying → deprecated) as surfaced by the host

The lifecycle **state machine lives in Core**; the host surfaces transitions three ways — explicit HTTP PATCH, reactive proposals, and periodic/tick-on-access sweeps.

```
CANDIDATE(PENDING) ──publish──▶ ACTIVE ──(no reinforcement, decayDetector)──▶ DECAYING ──▶ DEPRECATED
      │  create/update                │  reactivate / evolve / restore            │  resolve / dismiss
      ▼                               ▼                                           ▼
PATCH /knowledge/:id/{publish,        staging.checkAndPromote (evolving>7d→active) proposalExecutor.checkAndExecute
 deprecate,reactivate,stage,evolve,   lifecycleStateMachine.checkTimeouts          (GC decaying>30d)
 decay,restore}                       decayDetector.scanAll
```

Step list with anchors:

1. **Create → publish** — cold-start/rescan create candidates (`knowledgeService.create`, PENDING) and `publish` promotes to ACTIVE; the HTTP surface exposes `PATCH /knowledge/:id/{publish,deprecate,reactivate,stage,evolve,decay,restore}` (confirmation-gated), followed by `refreshKnowledgeSearchSurface` to keep search fresh (`routes/knowledge.ts:509`; Section 06).
2. **Staging promote** — `stagingManager.checkAndPromote` moves evolving entries to active (Section 14).
3. **Timeout / decay** — `lifecycleStateMachine.checkTimeouts` and `decayDetector.scanAll` drive DECAYING; `proposalExecutor.checkAndExecute` executes/GC's proposals (Section 14).
4. **Two schedulers, one engine** — daemon processes run `EvolutionMaintenanceSweep` (bounded, single-flight, ~60s); **daemon-less** deployments call the *same Core drivers directly* from `UiStartupTasks` (stages 2 & 5), governance HTTP routes (`scanAll`/`checkAndPromote`), and the CLI (`checkAndExecute`) — there is no standalone tick-on-access scheduler class (Section 14).
5. **Human review inbox** — `GET /evolution/{proposals,warnings}` reads Core repositories; a human acts via `POST :id/{execute,observe,reject,resolve,dismiss}` (`proposalExecutor.executeOne`, actor `'user'`) (Section 07).

Boundary: the entire lifecycle judgment (staging/timeout/decay/proposal) is `@alembic/core`; the host owns HTTP surface, scheduling (sweep + tick-on-access), and the reactive proposal submission path. **Note:** `decayScore` cannot be seeded so the `deprecate` branch has an unreachable path (F-B, routed to Design) — an engine-side residual, not a host bug.

---

### 18.2 Design Patterns Catalog

Each pattern is grounded in specific files from the subsystem sections.

- **Dependency injection + module registry.** A lazy-singleton `ServiceContainer` with two maps (factory registry + realized-instance cache) and eight namespace modules (Infra/Signal/App/Knowledge/Vector/Guard/Agent/Ai) registered in fixed order, most instantiating Core/agent engines (`lib/injection/ServiceContainer.ts:22`, `ServiceMap.ts:89`; Section 02). The workflow **mode registry** (`registerProjectIndexWorkflowImplementation` / `runProjectIndexWorkflow`) is the same idea for workflows: lazy self-registering `'full'`/`'incremental'` runners (`ProjectIndexWorkflow.ts:52`, `ColdStartWorkflow.ts:321`).
- **Orthogonal capability × strategy × policy composition.** The sandbox is the clearest instance: a declarative `SandboxInput` intent (network × filesystem posture) is synthesized into a resolved `SandboxProfile`, emitted as an SBPL string, and spawned under a mode policy (`enforce`/`audit`/`disabled`) (`lib/sandbox/SandboxPolicy.ts:35/178`, `SeatbeltProfileBuilder.ts:12`; Section 15). Dimension pipeline composes dimension-catalog (capability) × tier scheduler (strategy) × grounding-enforcement env flag (policy) (Section 08).
- **Deterministic-marking + probabilistic-resolution.** `refreshIndex`/search compute a deterministic `ResidentSearchMeta` truth for `semantic/vectorUsed`, while ranking itself is the probabilistic Core `HybridRetriever` (`routes/search.ts:81`; Section 06). Recipe-ID resolution: deterministic exact match first, then a fuzzy Jaccard `resolveId` resolver for AI-supplied ids (`routes/recipes.ts:235`; Section 06).
- **Signal-driven vs time-driven automation.** Reactive/signal-driven: file-change → `InProcessFileChangeHandler` → proposals + `quality` signals (`InProcessFileChangeHandler.ts:48`). Time-driven: `EvolutionMaintenanceSweep` ~60s tick (`EvolutionMaintenanceSweep.ts:77`). Cross-process cache invalidation is signal-driven off a cheap SQLite `PRAGMA data_version` poll (`CacheCoordinator.ts:28`; Section 17).
- **Defense-in-depth (Constitution → Gateway → Permission → SafetyPolicy → PathGuard → ConfidenceRouter).** As surfaced by the host: `Gateway.execute` validate→guard→route→audit chokepoint (`Gateway.ts:91`); per-op confirmation gates `rejectUnlessConfirmed` (`entrypoint-safety.ts:17`); the sandbox's deny-by-default SBPL + allowlist proxy fail-closed (`SandboxNetworkProxy.ts:30`); Core `pathGuard.assertProjectWriteSafe` / `WriteZone` on every write (Skills, Wiki, Cleanup, Section 12/13/14); trust-gated header identity (`x-user-id` honored only with env flag/internal token, Section 05). The Constitution/Permission/ConfidenceRouter tiers themselves are Core/agent-owned; the host enforces the Gateway, confirmation, path-guard, and sandbox rings.
- **Produce / consume projection contracts.** The dimension pipeline splits pure projection (`projectAgentRunResult` reshaping runtime results) from impure consumption (`consumeBootstrapDimensionResult` side effects), with a single logical definition of accepted candidates (`successCount/submitCalls`) re-derived across helpers (`AgentRunProjections.ts:123`, `BootstrapConsumers.ts:522`; Section 09). `ProduceSessionRoute` is a pure-projection module feeding the impure rescan workflow (Section 10).
- **Tick-on-access daemon-less automation.** No scheduler class exists for daemon-less mode; the same Core lifecycle drivers are invoked on access from `UiStartupTasks`, governance routes, and the CLI (Section 14). SQLite is a **read-cache projection** of markdown recipes, which motivates `CacheCoordinator` + `GraphCache` freshness gating (Section 17).
- **SSE / socket realtime.** Two-phase SSE (`POST`→sessionId, background run, `GET events/:id` replay+subscribe+heartbeat) via `SseSessionRegistry` (`utils/sse-sessions.ts:32`); socket.io `RealtimeService` fixed broadcast contract to the `notifications` room (`RealtimeService.ts:10`); EventBus→websocket bridge at HTTP start (`HttpServer.ts:438`). Sections 05/06/07/17.
- **Adapter pattern for tools.** Host results are shaped into `@alembic/agent`'s `ToolResultEnvelope` by Dashboard/Skill/Workflow/macOS adapters, but **only the manifests are registered** into the catalog; the live dashboard HTTP path bypasses `DashboardOperationAdapter` via `utils/dashboard-operation.ts` (`lib/tools/adapters/*`, `DashboardOperations.ts:19`; Section 16). `SandboxExecutorBridge` adapts the concrete Seatbelt executor behind the agent's `SandboxExecutorLike` contract (`ToolContextFactory.ts:62`; Section 15).
- **Fast-skeleton + fire-and-forget fill.** Cold-start returns a "filling" skeleton synchronously and dispatches the mine in `setImmediate` (`ColdStartWorkflow.ts:264/309`); daemon enqueue uses `queueMicrotask` with a separate async-failure recorder (Section 04).
- **Lazy dynamic import across intentional layer edges.** `import()` at call time to cross http→tools / http→injection / sandbox dep-chain edges (AD4) — e.g. `ProjectIndexWorkflow` import inside `executeApiAiWorkflow` (`DaemonJobRunner.ts:874/902`), sandbox modules in `ToolContextFactory` (Section 05/15/16).

---

### 18.3 Cross-Cutting Concerns

- **Config / AppConfigLoader.** `AppConfigLoader` pins Core `ConfigLoader`'s package-root to the `alembic-ai` host package (import side-effect) so config reads from the host `config/default.json`; it deep-merges `default.json`/`${env}.json`/`local.json`, Zod warn-only validates, and stashes on `singletons._config` read by logger/database/guard/vector factories. Must be imported before any config read (`lib/infrastructure/config/AppConfigLoader.ts`; Section 02).
- **Audit.** `AuditLogger` reconciles Gateway/Service entry shapes, saves via `AuditStore` into the `audit_logs` table, mirrors a reduced projection to the `audit:entry` socket event, and **swallows failures** so audit never blocks business logic; `AuditRepositoryImpl` is a deliberately-isolated raw-SQLite read/stats/cleanup boundary over the same table (`lib/infrastructure/audit/AuditLogger.ts:10`, `lib/repository/AuditRepository.ts:78`; Sections 16/17).
- **Caching.** In-memory TTL `CacheService` + Redis-seam `UnifiedCacheAdapter`; cross-process `CacheCoordinator` polls SQLite `PRAGMA data_version` (long-lived MCP/API processes only) to invalidate the search index + guard cache; content-hash-gated file `GraphCache` (`lib/infrastructure/cache/*`; Section 17).
- **Rate-limiting.** In-memory sliding-window `RecipeSaveRateLimiter` (60s/10) with container-singleton + process-default fallback (`lib/infrastructure/rate-limit/RecipeSaveRateLimiter.ts:33`; Section 17).
- **Error / problem taxonomy.** `buildAlembicHttpProblem` assembles a stable 19-field problem object projected from the Core failure taxonomy (`getCoreFailureTaxonomyEntry`); `GatewayError` is the governance failure carrier; MCP handlers use `buildToolUsageProblem`/`envelope()` (`lib/http/problem-taxonomy.ts:46`, `lib/service/handler-runtime/problem.ts:44`; Sections 05/14).
- **Logging.** Core `Logger.getInstance` (winston-backed) is the single logger; per-repo rule mandates concise Chinese comments plus explicit diagnostics on every fallback/degrade/skip/retry branch (repo CLAUDE.md). CLI uses a Guard-compliant `CliLogger` singleton separating stdout/stderr (`lib/cli/CliLogger.ts:85`; Section 03).
- **Shutdown.** A LIFO `ShutdownCoordinator` singleton (SIGTERM/SIGINT) runs hooks oldest-registered-last with per-hook isolation and a 10s hard-timeout; a Bootstrap-registered hook runs `wal_checkpoint(TRUNCATE)` before DB close (`lib/shared/shutdown.ts:27`, `lib/Bootstrap.ts:239`; Sections 02/17).
- **Grounding / anti-fabrication.** Explicit-unavailable over mock (missing AI provider is a first-class state, no fake provider — `AiRuntimeStatus`, Section 02/03/06/08). PCV node evidence (`PcvNodeEvidence.ts`) computes N8 terminal-tool proof, an analyze-grounding ledger (observe-only vs guard, additive/backward-compatible), N9 stage projections, and N12 consumer-persistence proof, rolled up into `report.pcvScorecard`; grounding enforcement is an opt-in `ALEMBIC_GROUNDING_ENFORCEMENT` env flag (Sections 08/09). PCV N9 observability records missing-link reasons + first-fix instead of fabricating a quality score (`PcvObservabilityLinkage.ts`; Section 04).

---

### 18.4 Persistence & Data Model (high level)

- **Source of truth = markdown recipes.** SQLite is a **read-cache projection** of on-disk markdown Recipes; this is why `CacheCoordinator` and `GraphCache` exist to keep the projection fresh (Section 17).
- **SQLite (better-sqlite3 + drizzle, WAL).** DB connection/WAL/migrations/schema DDL are Core-owned; the host operates on an already-open handle via `SqliteDatabaseAccess` (duck-typed unwrap + a few `@escape-hatch(permanent)` raw queries). Tables touched by the host include:
  - `knowledge_entries` (recipe projection; read by fixture-gen, search-surface) — `SqliteDatabaseAccess.ts:107`.
  - `recipe_source_refs` (sourceRefs; region fixtures, module-mining delta) — `SqliteDatabaseAccess.ts:121`.
  - `audit_logs` (id/timestamp/actor/action/resource/operation_data/result/error/duration) — `AuditStoreQueries.ts:40`.
  - `project_context_file_snapshots` (lazy CREATE; incremental FileDiffPlan membership) — `SqliteDatabaseAccess.ts:191`.
  - Coverage-ledger round rows + per-cell state (Core `EvolutionCoverageLedgerRepository`; upserted by module-mining/rescan write-back) — Sections 04/10/17.
  - `knowledge_edges` (module-level graph from SPM deps), warnings/proposals repositories, token-usage — Core-owned tables read/written via repositories (Sections 02/06/07).
  - `CleanupService.fullReset` clears the full FK-ordered `ALL_DATA_TABLES`/`TASK_DATA_TABLES` set (`CleanupService.ts:123/151`; Section 14).
- **Markdown recipe layout.** Recipes live in the knowledge dir's recipes sub-repo (git-orchestrated by `SetupService`, Section 03); Skills as `SKILL.md` under `Alembic/skills/` (Sections 10/12); the Repo Wiki as `<dataRoot>/Alembic/wiki/*.md` + `meta.json` (filesystem only, no DB — Section 13).
- **Vector index.** Core `VectorService`/`IndexingPipeline` with `Hnsw`/`JsonVectorAdapter`; the host owns `ContextualEnricher` (contextual-retrieval prefixes, provider-gated) and `RecipeRegionFixtureGeneration` (bounded-then-full region sync + coverage proof) (Sections 02/12). Semantic memory (`PersistentMemory` + `MemoryEmbeddingStore`) is agent-owned, consolidated at bootstrap completion (Section 10).
- **Ghost mode.** When `dataRoot != projectRoot`, all writes route through `WriteZone` to `~/.asd/workspaces/<id>/` (Sections 03/13/14).

---

### 18.5 Glossary

| Term | Definition | Owner |
|------|-----------|-------|
| **Recipe** | A distilled, structured knowledge unit extracted from source code, stored as markdown (SQLite is a read-cache projection) and queried by AI assistants via MCP. | Core model; host projects/serves |
| **Candidate** | A freshly-extracted Recipe in the PENDING lifecycle state, created by dimension mining before `publish` promotes it to ACTIVE. | Core lifecycle; host creates/publishes |
| **Dimension** | A knowledge axis mined during bootstrap/rescan (project norms, usage, architecture, code patterns, best practices, project-profile, agent-guidelines; `skillWorthy` macro dimensions aggregate into Skills, not Candidates). Catalog = Core `baseDimensions`/`DIMENSION_CONFIGS_V3`. | Core catalog; host executes |
| **Deep-mining round** | An incremental rescan round loop under Core's `adviseCoverageLedger`: open a fail-closed round row (`rescanId jobId:deepMining:N`), seed empty cells, run the AI fill inline, per-cell write-back, close the row, re-advise, break on `shouldStop`. | Host bookkeeping (`DeepMiningRoundGate.ts`), Core advisor |
| **Coverage cell** | One `(module × dimension)` entry in the evolution coverage ledger tracking mining progress with grade/valueScore; upserted by `writeCoverageLedgerForCompletion`. | Core repo/algebra; host write-back sink |
| **sourceRefs** | Recipe→source file references (`recipe_source_refs`) reconciled on rescan; used to attribute covered paths to coverage cells and to detect impact from file changes. | Core `SourceRefReconciler`; host reads/matches |
| **PCV** | Producer-Consumer-Verification: the anti-fabrication / grounding observability layer (N8 terminal-tool proof, analyze-grounding ledger, N9 stage projection, N12 consumer-persistence) proving the AI actually submitted grounded, findable knowledge. Rolled into `report.pcvScorecard`. | Host computes (`PcvNodeEvidence.ts`) over agent evidence |
| **Grounding enforcement** | Opt-in `ALEMBIC_GROUNDING_ENFORCEMENT` policy: observe-only (record classification, preserve legacy judgment) vs guard (block ungrounded output). Default observe-only. | Host flag, agent analyze-grounding guard |
| **Panorama / ProjectContext** | The project-structure organism ("Skeleton"): the space→repo→map→module→file query model. Query capability = Core `ProjectContextCapabilities.execute`; the host owns the bounded query itinerary, scope propagation, and MCP envelopes. (Panorama as a standalone engine is retired; ProjectContext is the live model.) | Core engine; host orchestrates |
| **ProjectScope** | Alembic's *native* multi-repo workspace membership config (`~/.asd/project-scopes.json` via ProjectRegistry) — distinct from Wakeflow's `workspace.config.json`. Honored during cold-start to avoid polluting `ProjectContext` with sibling-repo noise. | Core primitives; host `project-scope/` store + propagation |
| **Signal / SignalBus** | The "Nerves" organ: an event bus emitting `lifecycle`/`quality`/`signal` events that drive lifecycle promotion, real-time search ranking, and source-ref tracking. Load-bearing 4-repo backbone. | Core engine; host emits/bridges |
| **Guard** | The "Immunity" organ: a code-standard rule engine (`GuardCheckEngine`) that checks code against Recipe-derived standards, with rule learning, exclusions, and a feedback loop. | Core engine; host routes/persists violations |
| **Skill channels A-F** | The delivery targets for generated `SKILL.md` project skills. The host writes `SKILL.md` and emits `ProjectSkillDeliveryReceipt`s with `runtimeExport` **pending**; the host-visible export to IDE/host channels is delegated to **AlembicPlugin** (the main package no longer writes the editor delivery index). **(inferred)** the "A-F" labels denote the plugin-side channel set; only the receipt contract is visible in this repo. | Host writes receipts; AlembicPlugin exports |
| **Ghost mode** | Workspace mode where Alembic data lives outside the project tree (`~/.asd/workspaces/<id>/`) instead of `.asd/` in-project; all writes route through `WriteZone`. Toggled by `alembic ghost on/off`. | Host (`ghost` cmd, WriteZone) |
| **Tool-Forge / Create** | The "Create" organ — generated-tool capability. In the main body only the generic `sandboxExec` reuse point and tool adapters exist; Forge orchestration lives on the agent/Core side. **(inferred / unverified in this repo)** | agent/Core |
| **Bootstrap session** | The parent `bootstrap-session` agent run that fans out to child `bootstrap-dimension` runs; its `skeleton→filling→completed/failed/cancelled` state machine is tracked by `BootstrapTaskManager` and finalizes daemon jobs on `bootstrap:all-completed`. | Host (`BootstrapTaskManager`), agent loop |
| **Plan gate** | Pre-generation step running the plan Agent behind a Core ≤12KB `projectInfoTree` projection to choose execution dimensions/budget without a multi-megabyte prompt explosion. | Host wiring (`PlanSelectionGate.ts`), Core plan math, agent plan run |
| **AppConfigLoader** | Host config source that pins Core `ConfigLoader`'s package-root to `alembic-ai` and deep-merges `default/${env}/local.json`; must import before any config read. | Host adapter |
| **Coverage ledger** | The SQLite structure (round rows + module×dimension cells) recording how thoroughly each module/dimension has been mined; the convergence advisor decides when to stop rescanning. | Core repo/advisor; host seeds/writes/reconciles |
| **DimensionContext** | The host cross-dimension accumulator: each completed dimension's parsed digest (summary/findings/gaps/existing titles) so later dimensions see prior context. | Host (`DimensionContext.ts`) |

---

*Verification notes.* The five flows above were traced from source: cold-start dispatch (`ColdStartWorkflow.ts:99-321`), daemon dispatch by kind/generationStage (`DaemonJobRunner.ts:871-912`), the AI dimension pipeline (`AiDimensionPipeline.ts:26-90`), completion steps (`CompletionSteps.ts:21-126`), rescan coverage write-back (`KnowledgeRescanWorkflow.ts:909-968`), and the HTTP middleware chain (`HttpServer.ts:132-225`). Items explicitly marked **(inferred)** — the Skill channel "A-F" labels and Tool-Forge/Create orchestration — are not directly implemented in this repo's `lib/`/`bin/` and are attributed to AlembicPlugin / agent-side per the fact sheets.


---
