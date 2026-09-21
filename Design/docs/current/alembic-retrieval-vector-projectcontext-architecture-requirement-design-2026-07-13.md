# Alembic 检索真实性、向量端口隔离与 ProjectContext 实时构建架构 — Requirement Design

- Design Key: `alembic-retrieval-vector-projectcontext-architecture-2026-07-13`
- Date: 2026-07-13
- Status: confirmed; ready-for-controller-intake
- Owner Window: Design
- Receiving Window: AlembicWorkspace controller
- Original Plan: `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-original-plan-2026-07-13.md`

## Problem

Alembic 当前已经能在 request-scoped 只读快照上执行 Search / Prime，并能过滤已经进入固定候选窗的 orphan/deprecated 向量；Graph 也已能覆盖 AlembicWorkspace 五仓并识别 BiliDili SwiftPM 路径。但用户仍会遇到两个真实结果问题：

1. 同一知识意图换成宽泛英文表达后，目标 Recipe 的召回不稳定；当前八条固定改写仅四条准确命中、一条零结果、三条弱相关。Search 和 Prime 还可能对同一语义给出不同候选。
2. Graph / Recipe Map 的每次调用仍重新构建事实，窄 file/symbol 查询也先遍历 space/repo；超时只让外层返回，底层构建继续运行，无法安全支持大空间的分批结果。

根因不是“英文不支持”、`language=swift`、Recipe 内容不够迎合查询，也不是单纯把超时改大。根因是候选真实性投影顺序、向量读写职责、Prime 二次阈值，以及 ProjectContext 构建缺少可取消、可复用的临时事实会话。

## Goal

交付一个可实现、可回归、可由真实双项目验证的架构闭环：

- Search、Prime、Recipe Context 对同一请求使用相同的权威候选序列；重复 region/orphan/deprecated 不再挤占 final topK，活跃候选不足能真实 refill。
- 向量查询只持有 query embedding、index reader 和 truth projection；写入、rebuild、reconcile 和知识事件同步完全在独立维护链。
- Graph 与 Recipe Map 继续实时读取源码事实，但同范围并发共享一个临时 BuildSession；窄查询不做全空间构图，全空间逐仓返回，结果可以 opaque cursor 续取，超时会真正停止底层工作。
- Core 与 Plugin 保持真实仓库职责，分别提交；其它三仓不制造形式性改动；最终不写真实知识库。

## Non-goals

- 不提高现有 120 秒 heavy-tool deadline。
- 不持久化维护 Graph / Recipe Map 最终查询答案。
- 不用 Git revision、checkpoint、dirty state、branch 或 host selection 作为查询门禁或 session 身份。
- 不把向量维护、索引修复、reconcile、init 或 rescan 放进 Search / Prime / Recipe Context 请求链。
- 不硬编码英文同义词，不修改 Recipe 内容，不用更换 embedding 模型掩盖候选问题。
- 不新增登录、Admin、角色、知识状态、MCP 可见性或 host-selected-project 门禁。
- 不改变 Alembic HTTP wire、Dashboard UI、Agent 内部工具产品语义或 BiliDili 源码。
- 不创建 Test 窗口或新测试环境。
- 不复活 Plugin 已退役的通用 KnowledgeContext/retrieval 中间层，不创建无消费者的抽象包。

## Primary actors

- 使用 `alembic_search` / `alembic_prime` 获取项目知识的开发者和 Codex host。
- 使用 `alembic_graph` / `alembic_recipe_map` 理解多仓或独立项目结构的维护者。
- 使用 `alembic_code_guard` 做显式文件规则核对的开发者；本需求不改 Guard 产品能力，但必须证明共享架构没有破坏其只读、项目隔离与知识消费。
- 维护 `@alembic/core` shared capability 和 AlembicPlugin MCP runtime 的实现者。
- 最终复核提交、构建、真实双项目行为和零写证据的 Wakeflow controller。

## User stories

1. 作为 BiliDili 维护者，我希望用不同英文方式询问 SwiftPM 分层依赖时都能在 Top 3 看到同一个权威 Recipe，而不是因为重复 region 或旧向量占窗而得到空结果或 UI/桥接弱知识。
2. 作为 Prime 使用者，我希望 Prime 与 Search 对同一 query/filter 认定同一批候选；Prime 可以缩短或分组展示，但不能另设阈值把 Search 已确认的权威候选删掉。
3. 作为运行时维护者，我希望查询链在向量不可用时只降级 keyword，且绝不会触发向量写入、清理或 reconcile。
4. 作为 embedding adapter 作者，我希望 query/document 用途和模型格式由明确端口表达，模型特定格式不会散落在 Search、IndexingPipeline 或 Plugin 中。
5. 作为大型 workspace 用户，我希望全空间 Graph 能先返回已完成仓库，再用 cursor 继续读取剩余仓库，而不是等所有仓库完成或直接超时。
6. 作为定位单文件符号的用户，我希望 file/symbol 查询只解析目标文件和必要的包含仓事实，不先扫描整个 workspace。
7. 作为 Graph 与 Recipe Map 用户，我希望两个工具对同一范围共享相同源码事实，Map 只追加 Recipe mounts，不重新构图。
8. 作为 controller，我希望取消、异常和 TTL 到期都能证明底层工作停止、临时文件清零、真实 DB/WAL/SHM/config/vector 没有变化。

## Code-fact reconciliation

### Accepted migration baseline

`alembic-plugin-five-tool-vector-quality-2026-07-12` 已完成并接受以下事实，本需求必须保留：

- Plugin public Search/Prime 使用 request-scoped DB/WAL/config/vector snapshot，真实知识存储零写。
- Core 请求期已过滤固定候选窗内的 orphan/deprecated；Plugin 输出会报告过滤数量。
- SwiftPM root/local target path、Graph 精确标识符、五仓 coverage、Recipe Map drift 诊断已经修复。
- public Guard 使用 confined snapshot，不再写 live violations/feedback。
- Recipe semantic-region 的删除、权威语料 prune 和 provider-unavailable cleanup 已在 Core/Plugin 维护链闭合。

本需求不得回退这些行为，也不得把它们重新包装为待实现成果。

### Current Core facts at `6b7de17494bac4236822d8a0baaa61cc3b01b670`

| Fact | Current seam | Required conclusion |
| --- | --- | --- |
| Embedding 只有通用 `embed(string|string[])` | `AlembicCore/src/service/vector/VectorService.ts`, `src/infrastructure/vector/BatchEmbedder.ts`, `src/service/search/SearchTypes.ts`, `src/infrastructure/vector/OllamaEmbedProvider.ts` | 当前没有 query/document purpose 或 capability descriptor；需要真实 adapter，不是只加 interface。 |
| RRF 在页内归一化 | `src/service/search/HybridRetriever.ts` | 已保存 dense/sparse rank 和总 RRF，但最终把页首 score 设为 1，且不保留 raw dense similarity、sparse score、分路 contribution。 |
| 现有测试固定页首为 1 | `test/HnswVector.test.ts` | 该断言与确认方案冲突，必须被 raw-evidence 契约替换。 |
| Truth projection 在 final window 之后 | `src/service/search/SearchEngine.ts` 的 `#resolveVectorEntryId`、`#deduplicateByEntryId`、`#projectLiveVectorCandidates` | ID 解析与 DB filtering 可复用，但 semantic 固定 2x、auto 固定 3x；没有候选不足时的多轮 refill。 |
| Vector provider 为 null 时 `hybridSearch` 直接返回空 | `src/service/vector/VectorService.ts` | sparse lane 没有统一执行，违背“无向量只降级 keyword”。 |
| Recipe Context Search 与 Prime 用不同端口 | `src/service/recipe-context/ports.ts`, `handlers/search.ts`, `handlers/prime.ts` | Prime 无 vector 时可直接空；必须迁移到一个只读 retrieval port。 |
| VectorStore/VectorService 混合读写 | `src/infrastructure/vector/VectorStore.ts`, `src/service/vector/VectorService.ts` | 查询、sync、reconcile、migration 仍在同一 façade；需要 reader/writer 边界，同时保留旧 façade 兼容。 |
| 已有可靠维护实现 | `src/service/vector/SyncCoordinator.ts`, `src/service/knowledge/KnowledgeSyncService.ts` | 新 lifecycle coordinator 应从既有事件/debounce/reconcile/destroy 代码演进，不能另造第二条维护链。 |
| ProjectContext 无取消上下文 | `src/domain/project-context/ProjectContextContracts.ts`, `src/service/project-context/interface/*`, `src/service/project-context/capabilities.ts` | Plugin 无法单独实现真取消；Core 必须增加可选非序列化 `AbortSignal` execution context。 |

### Current Plugin facts at `be7bc058fcd188f38b48ee551f912377c2d19f1d`

| Fact | Current seam | Required conclusion |
| --- | --- | --- |
| Search 与 Prime 的候选规则不同 | `lib/host-runtime/mcp/handlers/search.ts`, `lib/service/task/PrimeSearchPipeline.ts` | Search 将 final limit 传给 engine；Prime 固定 limit=8/rank=false，再做 0.45 + relative threshold、二次 score calibration 和 5+3 slice。 |
| Prime 丢 raw retrieval evidence | `PrimeSearchPipeline.ts`, `PrimeKnowledgeMaterial.ts`, `agent-public-tools.ts` | Prime 只能看到 slim score，无法证明 dense/sparse/RRF；需要从 Core canonical candidate 直接投影。 |
| 只读 runtime 仍构造写形状对象 | `lib/host-runtime/mcp/host/read-only-search-executor.ts`, `read-only-hnsw-vector-store.ts` | request 链仍构造 `IndexingPipeline`/`VectorService`，只靠 writer 方法抛错；应改为真正 reader-only graph。 |
| Graph/Map 每次重复 build | `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`, `lib/host-runtime/mcp/handlers/recipe-map.ts` | 共用 provider 类型不等于共用事实；当前无 session、fingerprint 或 in-flight map。 |
| file/symbol 仍先收集 space/repo | `ProjectGraphProvider.ts` 的 `buildProjectContextGraphFacts` / `collectGraphRepoContexts` | 只跳过 module/map，不是确认的窄查询快路径。 |
| repo 与 MCP timeout 不取消 | `ProjectGraphProvider.ts` 的 `withGraphRepoTimeout`, `lib/host-runtime/mcp/tool-call-deadline.ts`, `HostMcpServer.ts` | 两层都只 `Promise.race`；底层继续运行。 |
| Graph/Map 无 continuation | `lib/shared/schemas/mcp-tools.ts`, `contracts/AlembicGraphOutput.ts`, `AlembicRecipeMapOutput.ts`, `RecipeMapProvider.ts` | Graph 只 slice+truncated；Map 保留 raw-path `fullMapRef` schema 但实现强制 null，并按 20KB 裁剪。 |
| Prime 描述含未实现 admission gate | `lib/host-runtime/mcp/tools.ts` 与 `public-tools/descriptions.ts` | 确认方案禁止新增门禁；应删除漂移文案，不能补实现。 |

### Direct-consumer reconciliation

- `Alembic` 是 Core 旧 `SearchEngine`、`HybridRetriever`、`VectorService`、`IndexingPipeline` 与 ProjectContext 的真实消费者，集中在 `lib/injection/modules/KnowledgeModule.ts`、`VectorModule.ts`、HTTP knowledge/search routes、UI startup tasks 和 CLI embed。结论是 **conditional no-task with a hard compatibility gate**，不是“没有消费者”。
- `AlembicAgent` 没有新端口直接消费，只使用少量 `@alembic/core/search` helper 和宿主注入的 duck-typed internal search。保持 no-task。
- `AlembicDashboard` 没有 `@alembic/*` package dependency，只消费 Alembic HTTP `/search`。本需求不改 HTTP wire，保持 no-task。

### BiliDili corroborating read-only observation

在当前已加载 runtime 上，以冻结矩阵第 3 条查询调用 BiliDili public Search：

- 只返回 1 个结果，目标 Recipe ID 正确；
- 报告 6 个 orphan candidates 被过滤；
- actual mode 为 RRF；
- semantic/vector score 被投影为 1，而最终 ranker score 约 0.808。

这只用于证明当前源码机制仍可观察，不替代实现后的八条矩阵验收。

## Proposed behavior

### Canonical retrieval flow

```text
Search / Prime / Recipe Context
             |
             v
KnowledgeRetrievalPort.retrieve(request, policy)
             |
             +--> EmbeddingPort.embedQuery
             +--> VectorIndexReader (raw dense candidates)
             +--> sparse collector (raw lexical candidates)
             |
             v
HybridCandidateRetriever (candidate pool, no final topK)
             |
             v
KnowledgeTruthProjector
  resolve authoritative Recipe ID
  filter orphan/deprecated
  aggregate semantic regions per Recipe
  request refill when distinct live candidates are insufficient
             |
             v
RRF per authoritative Recipe + final rank/topK
             |
             +--> Search projection
             +--> Prime presentation/grouping
             +--> Recipe Context projection
```

The RRF unit is one authoritative Recipe, not one vector chunk. A Recipe may keep a bounded list of region evidence, but only its best dense rank and one sparse rank contribute to canonical ordering; duplicate regions cannot multiply its fusion weight.

### Vector maintenance flow

```text
Markdown -> SQLite authoritative knowledge
                    |
             knowledge:changed / deleted / lifecycle
                    |
                    v
VectorLifecycleCoordinator
   EmbeddingPort.embedDocuments
   VectorIndexReader inventory
   VectorIndexWriter upsert/remove/rebuild
```

Search/Prime/Recipe Context have no dependency edge to the lower flow. `VectorService` may remain as a compatibility façade for existing consumers, but new request wiring must not use it as a combined object graph.

### ProjectContext session flow

```text
Graph request -------+
                     +--> ProjectContextBuildSessionManager
Recipe Map request --+       key: canonical root + normalized scope + fact fingerprint
                             in-flight merge + ref-counted cancellation
                                  |
                                  +--> file/symbol direct Core query
                                  |
                                  +--> full-space incremental repo fact chunks
                                             |
                                   OS-temp result store (opaque refs only)
                                             |
                              first inline page + opaque nextCursor
```

Graph and Recipe Map keep separate public projections, but `continuation.factSessionRef` must be the same opaque value when both use the same source fact session. Their `resultRef` values may differ because the projections and page boundaries differ.

## Implementation decisions

### Decision 1 — Core public port spine without a new empty subpath

Add real implementations under current Core service directories and export them from existing `@alembic/core/search` and `@alembic/core/vector` subpaths. Do not add a new empty `@alembic/core/retrieval` package.

#### `EmbeddingPort`

Required contract:

- `embedQuery(text, context?)`
- `embedDocuments(texts, context?)`
- `describeCapabilities()` returning at least provider, model, dimension if known, supported input kinds, batch support, normalization posture and format profile.
- optional abort context forwarded to provider transport.

The provider adapter owns query/document formatting. An adapter that cannot distinguish purposes must declare a symmetric profile rather than pretending to support asymmetric formatting. Legacy `.embed()` stays as a compatibility adapter, but new query/index paths may not call it directly.

#### `VectorIndexReader` / `VectorIndexWriter`

- Reader: raw KNN search, get-by-id, stats, bounded inventory/list IDs needed by lifecycle.
- Writer: upsert, batch upsert, remove, clear/rebuild, persistence/dimension migration.
- Existing HNSW/JSON stores receive concrete adapters; request-scoped Plugin code receives only Reader.
- Lifecycle coordinator may depend on both Reader inventory and Writer; retrieval may depend only on Reader.

### Decision 2 — Canonical candidate/evidence contract

Add a Core `KnowledgeRetrievalCandidate` contract containing:

- authoritative `recipeId` and hydrated Recipe metadata;
- `denseSimilarity`, `denseRank`;
- `sparseScore`, `sparseRank`;
- `rrfContribution: { dense, sparse, total }`;
- bounded semantic region evidence IDs/classes/scores;
- vector/semantic usage and fallback reason;
- truth/refill diagnostics (`filteredOrphanCount`, `filteredDeprecatedCount`, `aggregatedRegionCount`, `refillRounds`, `candidateWindow`, `exhausted`).

Absent lane values are `null`/omitted with an explicit lane-used flag; they are not fabricated as zero relevance. `score` may continue to carry the final ranker score for compatibility, but it is not an absolute relevance gate. Raw RRF total remains separately observable and is never divided by the current page maximum.

### Decision 3 — Retrieval policy order and refill

`KnowledgeRetrievalPolicy` uses this fixed order:

1. collect dense and sparse candidates with an initial window of `max(32, topK * 4)`;
2. resolve authoritative Recipe IDs;
3. filter orphan/deprecated and aggregate regions by Recipe;
4. compute one RRF contribution per authoritative Recipe per lane;
5. if distinct live Recipes are fewer than topK and a lane is not exhausted, double the candidate window and repeat while deduplicating previously seen raw candidates;
6. stop when topK is satisfied, both lanes are exhausted, the request is aborted, or the configured candidate budget is reached;
7. apply final ranking and topK only after truth projection.

The default maximum candidate budget is 256 or the smaller known index/corpus size. Reaching the budget without sufficient live candidates returns an honest `candidate-budget-exhausted` diagnostic; it does not manufacture results. Constants are policy configuration with deterministic tests, not prompt heuristics.

Provider missing, provider failure and circuit-open skip dense but still execute sparse. An empty authoritative DB returns knowledge empty even if the vector index contains stale entries.

### Decision 4 — Search, Prime and Recipe Context consume one port

- `SearchEngine` becomes the compatibility façade over `KnowledgeRetrievalPort`; auto/semantic request branches no longer implement separate truth projection or fixed 2x/3x pseudo-refill.
- Core Recipe Context replaces canonical `RecipeSearchPort + RecipeVectorPort` dual wiring with one retrieval port. Old adapters may remain only for compatibility tests.
- Plugin Search maps MCP filters/budget into the same retrieval request and does not slice before policy completion.
- Plugin `PrimeSearchPipeline` consumes the canonical candidate list directly. Remove independent score calibration, absolute/relative threshold, fixed admission filter and route-specific truth judgment. Prime may still split the first eight candidates into bounded knowledge/rule display groups.
- Prime public search metadata exposes a bounded ordered `candidateRecipeIds`; acceptance compares it to Search item IDs for the same request/topK.
- Recipe Map source-ref mounting remains deterministic DB/source-ref logic; it does not become semantic search. Any Recipe Context retrieval used by detail/prime routes receives only the read port.

### Decision 5 — Lifecycle isolation with compatibility façades

- Evolve existing `SyncCoordinator` implementation into `VectorLifecycleCoordinator`; keep `SyncCoordinator` as a compatibility export/alias while consumers migrate.
- Move event binding, debounce, authoritative prune, reconcile and drain/destroy behind the lifecycle coordinator.
- `VectorService` remains a legacy combination façade for Alembic and old tests, delegating to the new ports/coordinator. It must not be instantiated by Plugin public Search/Prime request factories.
- `KnowledgeSyncService` retains its existing awaited maintenance boundary and delegates to the coordinator.
- No query method may call sync, reconcile, generation, upsert, remove or clear.

### Decision 6 — Core ProjectContext optional execution context

Add a non-serialized optional second argument:

```ts
ProjectContext.execute(request, { signal?: AbortSignal })
```

The context propagates through capabilities, canonical dispatch and handlers without entering the public JSON request or refs. Repo/space/map/file loops check `signal.throwIfAborted()` at I/O and iteration boundaries. Cancellation returns the existing typed failure surface with a `cancelled` reason or throws a normalized AbortError that Plugin maps to it. Existing one-argument consumers remain compatible.

### Decision 7 — Plugin request-scoped read-only retrieval graph

Refactor `read-only-search-executor.ts` and `read-only-prime-executor.ts` to build:

- request snapshot DB repositories;
- Core `EmbeddingPort` provider adapter;
- a real `VectorIndexReader` adapter over the read-only HNSW snapshot;
- Core `KnowledgeRetrievalPort` / policy.

The request graph must not construct `IndexingPipeline`, `VectorService`, writer or lifecycle coordinator. Replace the current `ReadOnlyHnswVectorStore extends VectorStore` write-shaped adapter with a reader-only implementation.

The writable Plugin container continues to own explicit lifecycle flows outside the public query path. Remove the misleading Prime description sentence that promises a low-information admission gate; do not implement such a gate.

### Decision 8 — `ProjectContextBuildSessionManager`

Create a Plugin-owned build-session module, injected into Graph and Recipe Map providers through the embedded executor/runtime rather than as a process-global unscoped singleton.

Session key:

- canonical real project root;
- request ProjectScope identity and normalized focus/radius/fact classes;
- preflight source/manifest fact fingerprint;
- no tool name for compatible fact scopes, allowing Graph and Recipe Map reuse;
- never Git revision/checkpoint/dirty state.

Fingerprint algorithm:

- hash manifest bytes (`Package.swift`, `package.json`, relevant workspace manifests/configs) and a sorted source inventory of relative path, size and high-resolution mtime;
- capture content hashes for files actually parsed while building, avoiding a second full read;
- revalidate preflight facts before every continuation page; a change invalidates the session and returns an expired/changed diagnostic rather than serving mixed facts;
- do not execute `git` to build or validate the fingerprint.

Concurrency/cancellation:

- same key shares one in-flight producer;
- each caller holds a subscription; a caller abort detaches it, and the underlying producer aborts when no subscriber remains;
- session errors are broadcast to current subscribers and the session is removed in `finally`;
- no completed session becomes a persistent cache.

### Decision 9 — Narrow path and incremental full-space path

Before `collectGraphRepoContexts`, route these queries directly to Core target-file facts:

- `file-flow`
- `file-symbols`
- `source-slice`
- `anchor-range`
- impact/neighborhood/path requests with an explicit file/ref anchor where the needed endpoints are already known.

The fast path may fetch the containing repo identity if needed, but it must not execute space, all repos, maps, modules or unrelated file probes.

Full-space sessions execute space discovery once, then publish deterministic repo outcomes incrementally. Repo failure/timeout is an explicit outcome and coverage entry; it is never silently omitted. A consumer can receive a first page while other repo work continues.

### Decision 10 — Opaque continuation contract

Extend Graph and Recipe Map inputs with `cursor?: string`. Extend outputs with:

```ts
continuation?: {
  resultRef: string;
  factSessionRef: string;
  nextCursor: string | null;
  hasMore: boolean;
  page: number;
  accumulatedCounts: Record<string, number>;
}
```

All identifiers are random/opaque and scoped to project, tool projection and process. They cannot contain or decode to local paths. Existing raw-path `fullMapRef` remains deprecated/null during compatibility and is not used as the new continuation.

Pages are deterministic deltas. Union by stable node/relation/ref/mount ID reconstructs the final result with no duplicate or missing facts. While the build is still incomplete, public status/coverage/conservation must say partial and exact totals remain unknown/lower-bound; final ready/complete is emitted only after all repo outcomes are known.

Temporary chunks are stored only in an owner-only OS/runtime temp directory, never below projectRoot or Alembic dataRoot. Terminal cursor consumption, explicit cancellation, exception and TTL expiry delete the session files. Expired cursors return a bounded retry action; continuation is not guaranteed across MCP process restart.

### Decision 11 — Real deadline cancellation

Refactor `raceToolCallDeadline` to create/own an `AbortController` before starting the work. Deadline order is:

1. abort signal;
2. wait for bounded cancellation acknowledgement/cleanup;
3. return typed TOOL_TIMEOUT.

The signal flows through `ToolExecutionContext` → embedded executor → Graph/Recipe Map handler → BuildSession → Core ProjectContext. The 120-second value is unchanged. Tests must prove the injected slow worker stops, not only that the outer promise rejects.

## Per-window landing plan and designIntent

| Window | Status | designIntent | Code-level landing | Exit evidence |
| --- | --- | --- | --- | --- |
| `AlembicCore` | required, first | Make authoritative Recipe candidates and vector lifecycle boundaries shared, deterministic Core capabilities while preserving existing consumers. | Add embedding/index ports and adapters; canonical retrieval candidate/policy/truth projector/refill; migrate SearchEngine and Recipe Context; evolve lifecycle coordinator; add optional ProjectContext AbortSignal; export through current search/vector/project-context surfaces; retain old façades. | One clean Core commit; focused RED/GREEN; full tests/build/public API/layer gates; raw evidence contract; query mutation spies=0; cancellation worker stops. |
| `AlembicPlugin` | required, after accepted Core | Make every public knowledge query request-scoped and reader-only, and make Graph/Map share a cancellable ephemeral fact build with honest pagination. | Replace write-shaped read runtime; Search/Prime parity; Prime evidence projection; BuildSession/fingerprint/temp store/cursor; Graph narrow path and repo chunks; Map shared facts; Host deadline signal; schema/output/description updates. | One clean Plugin commit based on exact Core commit; focused/public/schema/timeout tests; full unit/check/build/package/plugin verification; temp cleanup and fingerprint proof. |
| `Alembic` | conditional no-task | Prove Core compatibility façades keep the real daemon/HTTP/CLI consumer working without moving request or maintenance ownership. | No planned source change. Run compile and search/project-context consumer regression after Core. If failure shows a façade regression, return Core for rework; only an irreducible contract change may be raised to controller for a minimal Alembic sync decision. | `build:check`, import boundary and focused consumer/search integration tests. |
| `AlembicAgent` | no-task | Preserve existing Core helper imports and intentional internal knowledge tool boundary. | No source change. | Build/import-boundary and focused module/contract tests if Core public-surface scan indicates impact. |
| `AlembicDashboard` | no-task | Preserve zero package dependency and existing HTTP search wire. | No source change. | Space-boundary/typecheck/build only if Alembic HTTP schema unexpectedly changes; such a change is outside the confirmed design. |

## Internal implementation phases and exit gates

Each repository receives one combined package and self-sequences these phases.

### Core C1 — Ports and adapters

Code actions:

- Add `EmbeddingPort` + legacy provider adapter.
- Add `VectorIndexReader` / `VectorIndexWriter` adapters for current stores.
- Route IndexingPipeline/BatchEmbedder to document embedding and query retrieval to query embedding.
- Export real implementations from existing public subpaths.

Exit gate:

- fake provider proves query and document calls are distinct;
- descriptor is observable and honest;
- query tests cannot access Writer;
- legacy constructors/imports still compile.

### Core C2 — Truth-first retrieval policy

Code actions:

- Replace page-normalized HybridRetriever internals with raw candidate/evidence collection.
- Add authoritative ID aggregation/filtering and multi-round refill.
- Migrate SearchEngine auto/semantic and Recipe Context Search/Prime.

Exit gate:

- a fixture with many leading orphan/deprecated/duplicate regions still fills distinct live topK from a later window;
- same Recipe regions occupy one final slot and do not multiply RRF;
- exact raw contribution formula is asserted;
- Search/Prime ordered IDs match;
- provider-null/error/circuit-open returns sparse truth;
- empty DB does not surface vector-only entries.

### Core C3 — Lifecycle and cancellation

Code actions:

- Extract/evolve lifecycle coordinator while keeping compatibility façade.
- Add ProjectContext execution signal and loop/I/O checks.

Exit gate:

- knowledge events and explicit maintenance still write correctly in isolated fixtures;
- query mutation spies remain zero;
- pre-abort and mid-run abort both stop the worker and settle cleanup;
- full Core tests and compatibility public surface pass.

### Core C4 — Producer commit

Exit gate:

- one clean commit with exact hash;
- `npm run build:check`, `npm run build`, public API/layer/smoke gates and `npm run check` pass, or any pre-existing unrelated failure is proven byte-identical at baseline and final commit;
- controller accepts Core evidence before Plugin starts.

### Plugin P1 — Reader-only retrieval consumer

Code actions:

- build request snapshot Reader + EmbeddingPort + KnowledgeRetrievalPort only;
- remove IndexingPipeline/VectorService/write-shaped store from public query graph;
- migrate Search/Prime/Recipe Context and public evidence/candidate IDs;
- remove Prime description drift.

Exit gate:

- fixed eight-query unit/integration fixture has all non-empty results and target Top 3;
- Search/Prime candidate IDs match;
- raw retrieval evidence survives public projection;
- real-storage fingerprint unit fixture remains unchanged.

### Plugin P2 — BuildSession and fast path

Code actions:

- add session manager, fingerprint, in-flight merge and ref-count cancellation;
- inject it into Graph/Map;
- route explicit file/symbol anchors before space/repo collection;
- convert full-space collection to repo chunks.

Exit gate:

- concurrent same-key Graph/Map performs one fact build;
- source/manifest change invalidates; different scope does not reuse;
- no Git command is called;
- file-symbol fixture records no space/map/module/unrelated repo request;
- per-repo failure remains visible and does not erase successful chunks.

### Plugin P3 — Continuation, temp lifecycle and real abort

Code actions:

- add cursor/continuation schemas and projectors;
- add OS-temp projection store and deterministic page reconstruction;
- pass Host deadline AbortSignal through to Core;
- update stale inline-only/fullMapRef-null tests.

Exit gate:

- first page + at least two cursor pages reassemble exactly once;
- cursors/result refs are opaque and project-confined;
- final-consumed/cancel/exception/TTL cases leave zero temp files;
- timeout test proves worker stop and unchanged 120-second configured deadline.

### Plugin P4 — Consumer commit

Exit gate:

- one clean commit referencing exact accepted Core commit;
- focused tests, full unit, `npm run build:check`, `npm run check`, build and plugin package/distribution verifiers pass;
- controller independently reviews source and raw evidence before real acceptance.

### Controller A1 — Compatibility and dual-project acceptance

Exit gate:

- Alembic Core consumer compatibility passes without source change;
- canonical Plugin runtime is built/loaded from exact Core+Plugin commits;
- fixed BiliDili Search/Prime matrix, dual-project Graph/Map/Guard, cursor, fast path and zero-write checks all pass;
- no Test dispatch is created.

## Testing decisions

### Decision

`No Test window.` Product windows own deterministic code tests and commits; controller owns independent reruns and existing-environment real acceptance.

### Core test seams

Add or update:

- `test/EmbeddingPort.test.ts`
- `test/VectorIndexPorts.test.ts`
- `test/KnowledgeTruthProjector.test.ts`
- `test/KnowledgeRetrievalPolicy.test.ts`
- `test/HnswVector.test.ts`
- `test/SearchEngine.test.ts`
- `test/RecipeContextAdapters.test.ts`
- `test/RecipeContextService.test.ts`
- `test/VectorService.test.ts`
- `test/SyncCoordinator.test.ts`
- `test/RecipeRegionVectorIndex.test.ts`
- `test/ProjectContextCancellation.test.ts`
- current ProjectContext/public entrypoint/boundary suites.

Required Core commands:

```bash
npm run test -- test/EmbeddingPort.test.ts test/VectorIndexPorts.test.ts test/KnowledgeTruthProjector.test.ts test/KnowledgeRetrievalPolicy.test.ts test/SearchEngine.test.ts test/HnswVector.test.ts
npm run test -- test/RecipeContextAdapters.test.ts test/RecipeContextService.test.ts test/VectorService.test.ts test/SyncCoordinator.test.ts test/RecipeRegionVectorIndex.test.ts
npm run test -- test/ProjectContextCancellation.test.ts test/ProjectContextContract.test.ts test/ProjectContextEndToEnd.test.ts
npm run build:check
npm run build
npm run lint:public-api-boundary
npm run lint:layer-contract
npm run smoke:public-api
npm run check
```

### Plugin test seams

Add or update:

- `test/unit/SearchPrimeCandidateParity.test.ts`
- `test/unit/PublicOrphanVectorTruth.test.ts`
- `test/unit/PrimeSearchRouteEvidence.test.ts`
- `test/unit/ReadOnlySearchFingerprint.test.ts`
- `test/unit/ProjectContextBuildSession.test.ts`
- `test/unit/ProjectGraphTool.test.ts`
- `test/unit/RecipeMapTool.test.ts`
- `test/unit/mcp-hang-guards.test.ts`
- schema honesty/Zod conversion suites.

Required Plugin commands:

```bash
npm run test:unit -- test/unit/SearchPrimeCandidateParity.test.ts test/unit/PublicOrphanVectorTruth.test.ts test/unit/PrimeSearchRouteEvidence.test.ts test/unit/ReadOnlySearchFingerprint.test.ts
npm run test:unit -- test/unit/ProjectContextBuildSession.test.ts test/unit/ProjectGraphTool.test.ts test/unit/RecipeMapTool.test.ts test/unit/mcp-hang-guards.test.ts
npm run test:integration -- test/integration/ZodSchemas.test.ts test/integration/ZodToMcpSchema.test.ts
npm run test:unit
npm run build:check
npm run check
npm run build
npm run verify:codex-runtime-package
npm run verify:plugin-distribution
npm run verify:codex-plugin
```

Do not invent or require a nonexistent `verify:codex-session` script.

### Alembic compatibility seam

Without an Alembic source task, controller or the Core window reruns at least:

```bash
npm run build:check
npm run lint:core-import-boundary
npm run test:unit -- test/unit/CorePublicSurfaceSmoke.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/ProjectContextConsumerFacts.test.ts test/unit/ProjectContextWorkflowFacts.test.ts
npm run test -- test/integration/SearchPipeline.test.ts test/integration/SignalIntegration.test.ts
```

If a failure is caused by removing/changing the old façade, Core must first rework compatibility. Do not silently promote Alembic into an implementation task.

### Controller real acceptance matrix

Environments:

- AlembicWorkspace root: configured five-product-repo multi-repo mode.
- `BiliDili/`: existing standalone Swift project and existing real knowledge database.

Before calls, resolve actual runtime identity and fingerprint:

- SQLite DB;
- `-wal` and `-shm` sidecars, including missing state;
- vector config;
- vector index;
- source repository clean status.

Fingerprint tuple: `exists`, `size`, high-resolution `mtime`, `sha256`.

Forbidden operations: init, bootstrap, rescan, reconcile, vector rebuild, knowledge submit/update, config change, source edit.

Run:

1. BiliDili: for each frozen English query, public `alembic_search` auto with candidate topK 8 and public `alembic_prime` with the same query/topK.
2. Assert both non-empty; target Recipe ID is rank <=3; Search item IDs equal Prime ordered candidate IDs; evidence fields are present and raw.
3. BiliDili: Graph `file-symbols` for `Sources/Features/Home/HomeRequestRefreshGate.swift`; assert no space/all-repo/map/module traversal and correct file/symbol facts.
4. AlembicWorkspace: full-space Graph with a page size forcing at least two continuations; union all pages; assert 5/5 repo outcomes, no duplicate/missing stable IDs and no timeout.
5. Same scope: Recipe Map; assert `factSessionRef` matches Graph, Recipe mounts/rollups remain conservative, and no Recipe body is exposed.
6. BiliDili full-space Graph/Map continuation to prove standalone mode, including local packages, follows the same contract.
7. Explicit-file Guard once in each root; assert project identity, complete requested-file coverage and zero live writes. Guard is a regression consumer, not a repair target in this demand.
8. Consume terminal cursors; assert session temp directory is empty.
9. Recompute all fingerprints and worktree status; every protected artifact equals the before snapshot.

If runtime refresh is required, use a fresh temporary Codex host window/process after the canonical reload and record loaded Plugin/Core commit plus entry hash. This does not create a Test window or a new test environment.

## Acceptance criteria

### Retrieval

- [ ] All eight frozen BiliDili English queries are non-empty in public Search and Prime.
- [ ] Recipe `eed49092-3cc8-4a2a-9a5d-29ead96e267b` is Top 3 for every query.
- [ ] Search and Prime ordered canonical candidate IDs match for the same request/topK.
- [ ] Duplicate regions occupy one final slot; orphan/deprecated candidates occupy none.
- [ ] At least one deterministic test proves a second/later candidate window supplies a live Recipe that was outside the first window.
- [ ] Dense similarity/rank, sparse score/rank and each RRF contribution survive Core and Plugin projection.
- [ ] No page-max normalization or Prime truth threshold remains.
- [ ] Vector unavailable returns sparse truth; empty authority returns knowledge empty.

### Vector boundaries

- [ ] query and document embeddings use distinct port methods and honest capability descriptors.
- [ ] public query factories hold Reader/RetrievalPort only.
- [ ] query-time writer/lifecycle/reconcile/indexing calls are zero.
- [ ] knowledge events, explicit sync and reconcile still work in isolated fixtures.
- [ ] Markdown → SQLite → vector remains the only write direction.

### ProjectContext

- [ ] same root/scope concurrent Graph/Map builds once and shares an opaque fact session.
- [ ] source/manifest fact changes invalidate reuse without any Git call.
- [ ] explicit file/symbol path bypasses space and unrelated repositories.
- [ ] full-space results publish per-repo chunks and reconstruct exactly across 2+ cursor pages.
- [ ] repo failure/timeout is explicit in final coverage.
- [ ] 120-second deadline is unchanged and triggers real abort/worker stop.
- [ ] result refs/cursors reveal no local paths and cannot cross project scope.
- [ ] terminal/abort/error/TTL cases leave no temp files.
- [ ] no persistent answer cache exists.

### Delivery and real acceptance

- [ ] Core has one accepted clean commit before Plugin starts.
- [ ] Plugin has one accepted clean commit based on the exact Core commit.
- [ ] Core and Plugin full validations pass with raw command output.
- [ ] Alembic compatibility gate passes with no planned source change.
- [ ] AlembicAgent and Dashboard remain no-task unless a separately proven direct contract break appears.
- [ ] controller dual-project five-tool read-only acceptance passes.
- [ ] DB/WAL/SHM/config/vector fingerprints and source worktrees are identical before/after.
- [ ] no Test window, init, rescan, reconcile, Recipe edit, synonym hardcode, role gate, Git gate or timeout increase was added.

## Risks and open questions

### Risks with decided mitigation

| Risk | Mitigation / binary gate |
| --- | --- |
| Compatibility façade keeps old coupling alive forever | New Plugin query wiring is forbidden from using it; public import/consumer tests prove compatibility only. Follow-up removal would require separate consumer migration authority. |
| Multiple regions unfairly boost one Recipe | Aggregate by authoritative Recipe before RRF; one lane contribution per Recipe; bounded region evidence only. |
| Candidate refill becomes unbounded | Deterministic window growth, known corpus/index exhaustion, max budget and explicit `candidate-budget-exhausted`. |
| Prime parity is claimed but unobservable | Bounded ordered `candidateRecipeIds` in Prime meta and public parity tests. |
| Session reuses stale/mixed facts | Manifest hashes + source inventory fingerprint, build-time content hashes, continuation revalidation and invalidation on change. |
| One timed-out subscriber cancels another valid consumer | Ref-counted subscriptions; underlying abort only when no subscriber remains. |
| Cursor leaks a filesystem path or crosses projects | Random opaque refs mapped server-side and bound to project/tool/session fingerprint; negative tests. |
| Incremental page is mistaken for complete truth | partial coverage/conservation until final repo outcome; exact totals only at completion. |
| Temp continuation becomes a hidden cache | OS-temp only, process-local, TTL and terminal cleanup; no restart guarantee, no query answer persistence. |
| Core cancellation cannot stop all synchronous parser work | Add abort checks at loop/I/O boundaries and an injected slow worker test; any path that continues after abort blocks acceptance. |

### Open questions

None. Product behavior, affected repositories, phase order, non-goals, Test decision and completion evidence are user-confirmed. Implementation discoveries may cause a Core or Plugin rework, but may not change the completion definition without returning to the user.

## Controller intake notes

- Intake readiness: `ready-for-controller-intake`.
- Auto Claim: yes.
- Priority: P0.
- Demand shape: one demand; one combined Core package followed by one combined Plugin package; no parallel same-demand repo tasks.
- Producer/consumer dependency: exact accepted Core commit is required before Plugin implementation.
- Controller must not create a Test card.
- Controller should treat the completed 2026-07-12 vector-quality demand as accepted baseline evidence, not reopen or append to it.
- If Core compatibility tests fail, first return to Core to preserve the old façade. A new Alembic task requires raw evidence that compatibility cannot be preserved within the confirmed architecture; do not infer it merely from the existence of a direct consumer.
- Any implementation suggestion that adds synonym hardcoding, Recipe edits, persistent answer caching, Git gates, query-time maintenance or a larger timeout is outside the confirmed requirement and must be rejected.

## Design Handoff

- Source: user-confirmed architecture discussion plus current Core/Plugin/consumer source reconciliation.
- Goal: stable authoritative retrieval, vector reader/writer isolation, and cancellable reusable real-time ProjectContext sessions.
- Confirmed decisions: all behavior, repository order, non-goals, Test decision and acceptance roots recorded above.
- Design recommendations: none remain unconfirmed; code-level choices are implementation guidance under the confirmed architecture.
- Open questions: none.
- Non-goals: no Test, no persistent answer cache, no Git/role/knowledge gate, no synonym/Recipe workaround, no real data writes.
- Risks: compatibility, candidate budget, stale session, cancellation and cursor confinement have binary gates above.
- Required controller judgment: create the demand state root after claim, preserve Core→Plugin dependency, review commits/evidence, and run final dual-project acceptance.
- Suggested next action: `wakeflow_claim_next` / controller intake for this delivered design key.
- Suggested skills: `wakeflow-controller`, `wakeflow-governance`; target windows later use their assigned target/craft skills.
- Source artifacts: this Requirement Design and its linked Original Plan.
- Redaction notes: no thread IDs, runtime handles, secrets or user absolute paths are stored.
- Intake status: `ready-for-controller-intake`.

## Source references

### Design and accepted baseline

- `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-original-plan-2026-07-13.md`
- `.wakeflow-active/current/alembic-plugin-five-tool-vector-quality-2026-07-12/developer-progress.md`

### AlembicCore

- `AlembicCore/src/service/search/HybridRetriever.ts`
- `AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicCore/src/service/search/SearchTypes.ts`
- `AlembicCore/src/service/vector/VectorService.ts`
- `AlembicCore/src/service/vector/SyncCoordinator.ts`
- `AlembicCore/src/infrastructure/vector/VectorStore.ts`
- `AlembicCore/src/infrastructure/vector/OllamaEmbedProvider.ts`
- `AlembicCore/src/service/recipe-context/ports.ts`
- `AlembicCore/src/service/recipe-context/handlers/search.ts`
- `AlembicCore/src/service/recipe-context/handlers/prime.ts`
- `AlembicCore/src/domain/project-context/ProjectContextContracts.ts`
- `AlembicCore/src/service/project-context/interface/`
- `AlembicCore/src/service/project-context/capabilities.ts`
- `AlembicCore/test/HnswVector.test.ts`
- `AlembicCore/test/SearchEngine.test.ts`

### AlembicPlugin

- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-search-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-prime-executor.ts`
- `AlembicPlugin/lib/host-runtime/mcp/host/read-only-hnsw-vector-store.ts`
- `AlembicPlugin/lib/host-runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts`
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/recipe-map/RecipeMapProvider.ts`
- `AlembicPlugin/lib/host-runtime/mcp/handlers/recipe-map.ts`
- `AlembicPlugin/lib/host-runtime/mcp/HostMcpServer.ts`
- `AlembicPlugin/lib/host-runtime/mcp/tool-call-deadline.ts`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/AlembicGraphOutput.ts`
- `AlembicPlugin/lib/service/project-knowledge-context/contracts/AlembicRecipeMapOutput.ts`

### Direct consumers

- `Alembic/lib/injection/modules/KnowledgeModule.ts`
- `Alembic/lib/injection/modules/VectorModule.ts`
- `Alembic/lib/http/routes/search.ts`
- `Alembic/lib/http/routes/knowledge.ts`
- `Alembic/lib/recipe-pipeline/generate/runtime/UiStartupTasks.ts`
- `Alembic/bin/cli.ts`
- `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`
- `AlembicDashboard/src/api/search.ts`
