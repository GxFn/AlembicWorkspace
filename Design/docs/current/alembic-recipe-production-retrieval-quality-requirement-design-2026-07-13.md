# Alembic Recipe 生产端与检索表达整体质量优化 — Requirement Design

- Design Key: `alembic-recipe-production-retrieval-quality-2026-07-13`
- Date: 2026-07-13
- Status: confirmed; ready-for-controller-intake
- Owner Window: Design
- Receiving Window: AlembicWorkspace controller
- Requirement Type: requirement
- Priority: P0
- Auto Claim: no
- Original Plan: `Design/docs/current/alembic-recipe-production-retrieval-quality-original-plan-2026-07-13.md`
- Prior accepted architecture baseline: `wakeflow-ledger/workspace/archive/2026-07/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13`

## Confirmed Goal

让 Recipe 在生产时形成可追溯、可审阅、同时适合关键词与 document embedding 的统一检索表达；让四类最终受支持的生产能力——冷启动、增量、模块扫描、知识提交——全部汇入同一个 Core authoring / readiness / persistence contract；让索引维护能正确处理 Recipe 更新、删除、替换、投影 schema 与 embedding provider/model/dimension 变化，并把历史创建/自动发布旁路在真实 caller 迁移后删除。

消费者侧已接受的 `EmbeddingPort`、reader/writer 隔离、`KnowledgeRetrievalPort`、truth projection、Recipe 聚合/refill、Search/Prime 共同候选真实性继续作为不可回退的基线。本需求不通过查询词特判、目标 Recipe ID、全局同义词、Recipe 手工改写或模型替换掩盖生产质量问题。

## Final Completion Definition

Wakeflow 只可在以下闭环同时成立后接受需求：

- 四类受支持生产能力均通过 Core 的真实生产合同生成 Recipe、profile、readiness 和 document set；没有第五个可写创建旁路。
- keyword 与 dense 共享同一 Recipe retrieval facts，Search/Prime 继续共用已接受的只读权威候选合同。
- publish 只执行确定性结构 readiness；向量/provider/排名不成为 active 或查询门禁。
- Recipe 与向量生命周期覆盖更新、删除、替换、provider/model/dimension/schema 变化、失败保持旧 generation 和 rollback。
- 旧 AiScan direct create、通用 HTTP writable create、Dashboard create/auto-publish 完成 caller replacement 和删除证据。
- BiliDili 八查询、AlembicWorkspace 控制查询、Search/Prime parity 和生命周期故障矩阵在受控副本中通过；真实知识根零写。
- 五个产品仓按依赖提交并被 controller 独立复核；没有 Test 窗口或未确认扩仓。

完整二元条件见“Acceptance Criteria”；任何只完成接口、静态字段、兼容桥或单一查询调权的实现都不满足本定义。

## Problem

用户真正遇到的不是“某次查询少了一个结果”，而是 Recipe truth、关键词文档、向量文档、生命周期维护和人工审阅没有共享一个可验证的生产合同：

1. Recipe 可以字段齐全且评分较高，却仍把错误默认值、整文件 `coreCode`、重复 rationale 或路径噪声交给检索。
2. keyword 与 dense 从不同字段集合建文档；一个 lane 理解的 Recipe 事实可能在另一个 lane 中完全缺失。
3. 固定九 region 机械分割和重复锚定，既稀释主题又制造竞争面；现有 truth projector 虽会按 Recipe 聚合，却不能把缺失的关键词事实凭空补回来。
4. event incremental、full rebuild 和 region rebuild 的文档输入不一致；reconcile 也不能证明一个 live Recipe 的完整预期向量集合。
5. 生产入口分裂。部分路径使用 Core gateway，部分路径直接 `KnowledgeService.create`，Dashboard 还能 create 后自动 publish；只修一个入口会留下真实污染通道。
6. 索引只有维度守卫，没有投影/provider/model generation contract；clear-first migration 无法在失败时保住当前可用索引。

因此，本需求必须同时解决“生产数据质量”和“派生索引维护正确性”，并明确二者不是同一个分数或状态。

## Primary Actors

- Recipe producer：冷启动、增量、模块扫描、知识提交的宿主编排与 Agent。
- Recipe reviewer：通过 Dashboard 审阅 pending/staging Recipe、retrieval profile 和 readiness 缺口的维护者。
- Retrieval consumer：Search、Prime、Recipe Context，以及复用 `KnowledgeRetrievalPort` 的 Guard/上下文消费面。
- Index maintainer：接收知识变更、显式 rebuild/migration/reconcile 的 `VectorLifecycleCoordinator` 与宿主运维入口。
- Controller：复核各仓实现、提交和原始证据，并执行受控副本与真实只读双项目验收。

## User Stories

1. 作为知识生产者，我希望在生成 Recipe 时同时生成 evidence-grounded retrieval profile，使它能被中文和英文技术表达发现，而不需要针对未来查询写同义词规则。
2. 作为知识审阅者，我希望看到 profile 每个字段来自哪些 evidence、缺少哪些确定性结构，以及它将产生哪些检索文档，避免“质量 B”掩盖错误字段。
3. 作为知识审阅者，我希望 pending/staging 能保存待修内容，但 active transition 必须拒绝无法形成可靠检索表达的 Recipe。
4. 作为知识审阅者，我不希望 Ollama 离线、向量尚未同步或某条真实查询排名较低阻止我发布结构正确的 Recipe。
5. 作为 Search/Prime 用户，我希望 keyword 和 dense 消费同一组 Recipe 事实，保留各 lane 原始贡献，并在宽泛英语表达下稳定召回相关 Recipe。
6. 作为维护者，我希望 Recipe 更新或替换后，新文档集合验证通过再替代旧集合；失败时旧索引继续可用。
7. 作为维护者，我希望模型同维切换、projection schema 变化和部分 region 丢失都能被 manifest/reconcile 发现。
8. 作为系统维护者，我希望只有四类最终生产能力能创建 Recipe，Dashboard 或通用 HTTP 不再成为绕过统一合同的第五入口。
9. 作为 controller，我希望在不修改真实知识数据的前提下，用副本演练 migration，并用原始数据指纹证明真实查询零写。

## Proposed Behavior And Functional Loop

| Part | Description |
| --- | --- |
| Input | 源码 evidence、ProjectContext 事实、Recipe fields、生产 profile、lifecycle action |
| Producer | 四类受支持能力的宿主 adapter 调用 Core `RecipeProductionPort`；Agent/Plugin 只组装 evidence-grounded input |
| Truth change | Markdown 内嵌 Recipe + retrieval profile 先写，SQLite 权威索引随后更新；pending/staging/active lifecycle 保持单源 |
| Readiness | Core 对 Recipe + profile 计算确定性 `RetrievalReadinessReport`；不读取 provider 或查询排名 |
| Projection | Core `RecipeRetrievalProjector` 生成 versioned `RecipeRetrievalDocumentSet` |
| Sparse consumer | SearchEngine 从 document set 生成一个按 role 加权的 Recipe sparse document |
| Dense consumer | Vector writer 对 eligible role documents 使用 `EmbeddingPort.embedDocuments` |
| Truth projection | 现有 `KnowledgeTruthProjector` 继续按权威 Recipe 聚合/filter/refill，并保留 raw lane evidence |
| Maintenance | knowledge event、显式 rebuild/migration、startup reconcile 更新 generation；查询链不写 |
| Output | Search/Prime/Recipe Context 返回同源候选；Dashboard 返回 profile/readiness/index generation 证据 |
| Failure | 生产结构失败留在 pending/staging；index 失败保留旧 generation；provider unavailable 降级 keyword；迁移失败可 rollback |
| Verification | 产品测试 + copied snapshot migration + 双项目 real read-only query/fingerprint |

## Code-Fact Reconciliation

### Audited source baseline

| Repository | Audited HEAD | Status | Current role |
| --- | --- | --- | --- |
| `AlembicCore` | `d17db939ed49ea30bdbf380f400b783530b6d6a8` | clean | shared authoring, knowledge, search, vector contracts |
| `AlembicPlugin` | `79f46cda0a1325b5e5a32a8e629fbb822ca65fdc` | clean | MCP host producer/consumer and rescan maintenance |
| `Alembic` | `ac4921580ec1bbfb644886b6a201baeb1c1a2921` | clean | in-process runtime, CLI/module scan, HTTP lifecycle, daemon maintenance |
| `AlembicAgent` | `8aa184b88cbe99f07349ce8bfff69443dd98143d` | clean | in-process knowledge producer |
| `AlembicDashboard` | `f26427682f45cce6ce5ce4304ce9dfde84c26f17` | clean | reviewer UI and current legacy create caller |
| `BiliDili` | `12c0531cbf1bea36102f9d2d2b8ad4e1cef09221` | clean | independent-project read-only acceptance fixture |

### Current production and persistence chain

#### Core gateway

`AlembicCore/src/service/knowledge/RecipeProductionGateway.ts` currently performs:

1. `UnifiedValidator` schema/content/uniqueness validation;
2. similarity search using title, description and a partial content representation;
3. consolidation advice with direct-submit fallback when advisor fails;
4. `KnowledgeService.create`;
5. best-effort quality scoring;
6. optional supersede proposal.

`#prepareCreateData` fills multiple fields with empty/default values. This is a transport compatibility behavior, not retrieval readiness. A candidate can therefore enter later stages with `topicHint/category/moduleName` that do not represent its topic.

#### Knowledge truth

`AlembicCore/src/service/knowledge/KnowledgeService.ts` is file-first:

- write Markdown through `KnowledgeFileWriter`;
- create/update SQLite authority;
- emit `knowledge:changed`, `knowledge:deleted` or lifecycle events;
- refresh graph/relations and audit as best effort.

`updateQuality` writes quality and Markdown but does not emit `knowledge:changed`. Current vector documents mostly do not consume quality, so this is not the root recall issue; it proves quality and retrieval derivation are already separate concerns and should remain separate.

#### In-process Agent submit

`AlembicAgent/src/tools/runtime/handlers/knowledge.ts` currently:

- normalizes or infers evidence refs;
- sanitizes source paths;
- backfills or replaces `coreCode` from source ranges;
- injects graph refs when evidence exists;
- repairs/waives style violations;
- calls `recipeGateway.create`.

The BiliDili target Recipe proves the current deterministic `coreCode` replacement can select an entire unrelated document range and still produce a high quality grade. This repair path must be constrained by the shared retrieval/grounding contract rather than treated as automatically trustworthy.

#### Plugin submit

`AlembicPlugin/lib/host-runtime/mcp/handlers/tool-router.ts` routes `alembic_submit_knowledge` through stage-1 content validation, conditional stage-2 evidence validation and Core `RecipeProductionGateway`. Stage behavior differs by host session/profile, but final Recipe retrieval semantics must no longer differ.

#### Legacy direct paths

- `Alembic/lib/cli/AiScanService.ts` calls `knowledgeService.create` and then publish directly. The module-scan capability is supported, but this direct implementation must be replaced.
- `Alembic/lib/http/routes/knowledge.ts` exposes generic `POST /api/v1/knowledge` and calls `KnowledgeService.create` directly.
- `AlembicDashboard/src/App.tsx` calls `api.knowledgeCreate`, then immediately calls lifecycle publish. Its create payload builder supplies defaults and its edit path later updates only a subset of Recipe fields.
- Generated API contracts and provider-contract discovery still list `/api/v1/knowledge`, so route removal needs generated contract cleanup and reference evidence, not only handler deletion.

### Current retrieval documents

#### Sparse

`AlembicCore/src/service/search/SearchEngine.ts` / `FieldWeightedScorer.ts` include title, trigger, description, language, dimension, category, kind, scope, tags, when/do/dont and content pattern/rationale/markdown. They omit `moduleName`, `topicHint`, `coreCode` and `usageGuide`.

Current weights prioritize trigger/title/tags, but a recent exact topic/kind heuristic still depends on query tokens explicitly matching metadata. It cannot solve broad English recall when producer fields lack the relevant lexical concepts.

#### Dense

`AlembicCore/src/service/vector/RecipeRegionVectorIndex.ts` creates fixed region classes:

`identity`, `applicability`, `patternPurpose`, `architectureConvention`, `integrationBoundary`, `qualityConcern`, `negativeBoundary`, `rationale`, `evidence`.

Facts:

- every non-identity region repeats Recipe title and trigger;
- `content.markdown`, `coreCode` and `usageGuide` are not embedded;
- raw source paths, module/source file and quality tags can form independent documents;
- empty-like text is filtered, but semantic duplication and information density are not evaluated;
- each region has a content-hash-derived vector ID.

#### Shared query truth

`AlembicCore/src/service/search/KnowledgeRetrieval.ts` already provides the correct consumer baseline:

- `HybridCandidateRetriever` prepares dense/sparse candidates;
- `KnowledgeTruthProjector` maps region/vector IDs to authoritative live Recipe IDs;
- orphan/deprecated/metadata-mismatched candidates are filtered;
- region candidates are grouped before Recipe-level fusion;
- bounded refill expands the candidate window;
- raw dense/sparse/RRF evidence remains available.

This design remains. Recipe producer work must not reintroduce query-time writes, per-tool candidate policies or provider-specific prompts in consumers.

### Current vector lifecycle

`VectorLifecycleCoordinator` listens for knowledge create/update/delete/lifecycle events. Its event `#extractText` reads `content.body` / `content.code`, while KnowledgeEntry content is normally `markdown` / `pattern` / `rationale`; full DB reconcile may supply serialized JSON. Therefore incremental and rebuild document text can diverge.

Current reconcile:

- removes orphan `entry_` vectors;
- removes region vectors whose Recipe ID is no longer authoritative;
- queues a missing entry only when `entry_<id>` is absent;
- does not compute or compare each live Recipe's exact expected region set.

`HnswVectorAdapter` stores dimension plus item metadata/content, but has no index-level provider/model/projection generation. Same-dimension model changes can leave stale vectors undetected. `VectorService.migrateDimension` clears the active index before provider switch and rebuild.

### Current real-query evidence

#### BiliDili eight-query baseline

The frozen external acceptance queries remain test data; production profile generation cannot read or contain them.

| Query | Stable auto rank | Dense rank | Sparse rank | Dominant target region | Current conclusion |
| --- | ---: | ---: | ---: | --- | --- |
| 1 | 1 | 3 | 5 | rationale | correct; preserve |
| 2 | 1 | 7 | 3 | rationale | correct after current corpus; preserve |
| 3 | 1 | 1 | 2 | architectureConvention | correct; preserve |
| 4 | 1 | 1 | 1 | negativeBoundary | correct; preserve |
| 5 | 1 | 1 | 2 | negativeBoundary | correct; preserve |
| 6 | 5 | 2 | 23 | rationale | dense understands; sparse truth weak; final failure |
| 7 | 5 | 1 | 28 | rationale | dense understands; sparse truth weak; final failure |
| 8 | 1 | 1 | 11 | negativeBoundary | correct serially; concurrent run once degraded sparse-only |

The public target Recipe currently has an unhelpful default `topicHint`, empty `moduleName`, and a `coreCode` containing a whole contribution document. Its quality grade remains B. These fields are observable producer defects, not license to edit the real Recipe during acceptance.

#### AlembicWorkspace control baseline

Three current cross-project controls are frozen before implementation:

- canonical Recipe production entry / validation pipeline;
- Markdown → SQLite → vector single-source flow;
- knowledge change propagation to keyword/vector indexes.

The expected Recipes rank first in current auto hybrid results. These controls prevent a BiliDili-specific solution that damages established Chinese/English mixed knowledge.

## Implementation Decisions And Proposed Architecture

### 1. RecipeRetrievalProfile — authored truth inside Recipe

Add an optional additive field to `KnowledgeEntry` wire and Markdown serialization:

```ts
interface RecipeRetrievalProfile {
  schemaVersion: string;
  primaryLanguage: string;
  summary: {
    primary: string;
    technicalEnglish: string;
  };
  concepts: Array<{
    term: string;
    language: string;
    provenanceRefs: string[];
  }>;
  scenarios: Array<{
    text: string;
    language: string;
    provenanceRefs: string[];
  }>;
  exclusions: Array<{
    text: string;
    language: string;
    provenanceRefs: string[];
  }>;
  provenance: {
    evidenceRefs: string[];
    sourceFieldRefs: string[];
    sourceContentHash: string;
    generator: string;
  };
}
```

The exact TypeScript layout may change during Core implementation only if it preserves these semantic requirements:

- it is embedded in the Recipe truth and round-trips Markdown ↔ domain ↔ SQLite wire;
- every generated retrieval statement maps to evidence or existing Recipe source fields;
- primary language remains authoritative; English technical text is a retrieval expression, not a replacement for project truth;
- deterministic hashes exclude timestamps and runtime handles;
- no query corpus, expected result ID or global synonym table is an input;
- old Recipes without the field remain readable through a versioned compatibility projector.

Do not create a new retrieval-profile database table or independent status machine as the default design. If implementation evidence later proves an additive persistence field impossible, that is a Design/user scope change, not an implementation convenience.

### 2. RetrievalReadiness — deterministic publish structure

Core exposes one evaluator used by every active transition:

```ts
interface RetrievalReadinessReport {
  ready: boolean;
  schemaVersion: string;
  profileHash: string | null;
  documentSetHash: string | null;
  violations: Array<{
    code: string;
    field?: string;
    message: string;
    provenanceRefs?: string[];
  }>;
  warnings: Array<{ code: string; message: string }>;
}
```

Hard readiness checks:

- supported profile schema;
- non-empty primary summary and technical English summary when the Recipe has technical content;
- concepts/scenarios/exclusions are non-duplicate and evidence-grounded;
- required provenance resolves to Recipe evidence/source fields;
- placeholder/default-only topic/category/module data cannot masquerade as meaningful retrieval concepts;
- `coreCode` is empty when no bounded code evidence exists, or matches a cited bounded source range; never replace it with an arbitrary whole document;
- the projector produces one non-empty intent document and no duplicate eligible documents;
- serialized document set stays within deterministic role/token budgets.

Warnings, not hard gates:

- optional implementation/rationale role absent;
- sparse vocabulary coverage is low;
- profile comes from compatibility projection;
- current index generation is pending/stale;
- provider unavailable;
- runtime query rank below a diagnostic threshold.

The evaluator must not call embeddings, vector store, Search, Prime or an external query set. It is safe to run before publish in offline environments.

### 3. RecipeRetrievalDocumentSet — one fact set, two serializations

Core projector output:

```ts
interface RecipeRetrievalDocumentSet {
  projectionSchemaVersion: string;
  recipeId: string;
  sourceContentHash: string;
  profileHash: string;
  documentSetHash: string;
  documents: Array<{
    role: 'intent' | 'guidance' | 'implementation' | 'rationale';
    candidateEligible: boolean;
    text: string;
    contentHash: string;
    sourceFields: string[];
    provenanceRefs: string[];
  }>;
}
```

Role policy:

| Role | Required | Content | Retrieval behavior |
| --- | --- | --- | --- |
| intent | yes | title, description, profile summaries, concepts, scenarios | primary sparse and dense identity |
| guidance | optional | when/do/dont, exclusions, constraints | emitted only with enough distinct information |
| implementation | optional | bounded pattern/coreCode, selected technical markdown/usage | emitted only when grounded and not duplicate |
| rationale | optional | rationale, why-standard, tradeoffs/failure boundary | emitted only when it adds distinct semantics |

Raw file paths, evidence IDs, timestamps, quality grade and bridge bookkeeping remain metadata/provenance. They are not standalone candidate documents.

Sparse uses one Recipe-level weighted document built from these same role documents. Dense embeds each `candidateEligible` role document. Both lanes therefore share facts and source hashes while retaining appropriate weighting/formatting. Query/document asymmetric formatting stays inside `EmbeddingPort` provider adapters.

The current generic `entry_` vector must not remain a second competing Recipe representation. Core must either make it the canonical intent document identity or retire it from Recipe candidate eligibility after compatibility consumers migrate. Non-Recipe knowledge vectors are outside this cleanup unless real code shows they share the conflicting path.

### 4. Unified production contract

Core should expose one consumer-facing production port, implemented by the existing gateway/knowledge services rather than as an empty façade:

```ts
interface RecipeProductionPort {
  createOrStage(input: RecipeProductionInput, context: ProducerContext): Promise<RecipeProductionResult>;
  evaluateReadiness(recipeId: string): Promise<RetrievalReadinessReport>;
  publish(recipeId: string, context: PublishContext): Promise<PublishResult>;
}
```

Required behavior:

- validation, evidence grounding, dedup/consolidation, profile validation, truth persistence and result envelopes are shared;
- producer adapters may front-load guidance or perform deterministic evidence normalization, but cannot redefine profile semantics or bypass readiness;
- `KnowledgeService.create` remains an internal truth service for the production port, sync/import and tests; lint/import checks prevent product adapters from calling it as a public Recipe entry;
- publish is the unique active transition and performs the deterministic readiness check;
- lifecycle/readiness error codes are stable and Dashboard/MCP can display them without parsing prose.

### 5. Index generation and lifecycle

Add a versioned `RecipeIndexGenerationManifest` alongside the vector index, not as a second knowledge truth:

```ts
interface RecipeIndexGenerationManifest {
  manifestVersion: string;
  generationId: string;
  projectionSchemaVersion: string;
  provider: string;
  model: string;
  dimension: number;
  formatProfile: string;
  corpusFingerprint: string;
  createdFrom: 'incremental' | 'full-build' | 'migration';
  status: 'building' | 'ready' | 'failed' | 'retired';
}
```

Lifecycle rules:

- Recipe vector ID includes Recipe ID, projection schema, role and content hash.
- create/update derives the expected document set with the same projector used by full build.
- replacement upserts all new documents, verifies exact expected IDs and metadata, then removes the prior Recipe generation documents.
- delete/deprecate removes all Recipe documents across known generations without requiring provider availability.
- reconcile computes expected IDs for every live Recipe and reports/removes orphan, old generation, duplicate documents; it queues missing/partial/current-hash mismatches.
- missed in-memory events are recoverable from source hashes during startup/explicit reconcile; no query-time repair is allowed.
- provider/model/dimension/format/schema incompatibility starts a shadow generation. Only a fully verified generation becomes active.
- pointer/manifest switch is atomic at the storage boundary; failed build leaves the old active generation untouched.
- rollback changes the active generation pointer and proves query availability; it does not rebuild from scratch.
- keyword refresh consumes the same current projector and remains independently available when dense generation is unavailable.

### 6. Observability without a second gate

Expose bounded evidence through existing status/API/MCP surfaces:

- Recipe profile schema/hash and readiness violations/warnings;
- projected document roles/hashes/source fields, without leaking hidden local paths;
- active index generation descriptor and pending/failed reason;
- exact reconcile counts: orphan, missing, partial, duplicate, stale generation;
- migration dry-run counts by compatibility/profile/readiness outcome;
- Search/Prime raw lane ranks/scores/contributions already provided by the accepted retrieval architecture.

These fields help repair and acceptance. They cannot become MCP visibility, role, host-project, Git, knowledge-status or query admission gates.

## Supported Production Capabilities And Legacy Cleanup

### Final capability map

| Capability | Host surfaces | Canonical terminal call | Notes |
| --- | --- | --- | --- |
| cold-start | Plugin bootstrap/generate; Alembic in-process cold-start | `RecipeProductionPort.createOrStage` via knowledge submit producer | no direct truth write from workflow |
| incremental | Plugin knowledge-rescan; Alembic IncrementalRescanWorkflow | same production port | preserves valid Recipes; new/changed candidates use profile contract |
| module scan | Alembic AiScan/module scan; Dashboard may trigger/observe scan | same production port | replaces AiScan direct create/publish |
| knowledge submit | Plugin `alembic_submit_knowledge`; Agent `knowledge.submit` | same production port | session/evidence gates may differ, final semantics do not |

Dashboard review/edit and lifecycle publish are not a fifth producer. They operate on an existing pending/staging Recipe created by one of the four supported capabilities.

### Caller replacement

| Legacy implementation | Current caller | Replacement | End state |
| --- | --- | --- | --- |
| `AiScanService → KnowledgeService.create → publish` | CLI/module scan workflow | module scan calls `RecipeProductionPort.createOrStage`; returns pending/staging Recipe IDs for review | direct create/publish calls deleted |
| `POST /api/v1/knowledge → KnowledgeService.create` | Dashboard `knowledgeCreate`; possible undocumented callers to be proven by scan | Dashboard consumes module-scan/submit-created Recipe IDs and uses PATCH review + legal publish; external callers receive explicit retired guidance if compatibility response is required | route has zero write and is removed from supported API contract |
| Dashboard `knowledgeCreate → lifecycle publish` | scan-result save action | review existing candidate/Recipe; edit full profile-capable fields; publish only after readiness | create payload builder and auto-publish branch deleted |
| direct product imports of `KnowledgeService.create` | bounded scan during implementation | production port or explicitly classified internal sync/import caller | lint/import allowlist contains only Core internals and tests |

### Migration bridge policy

Current source scan identifies Dashboard as the concrete `knowledgeCreate` caller, while generated API/provider contracts expose the route more broadly. Therefore implementation must not assume there are no external clients.

Preferred bridge:

- after Dashboard caller migration, `POST /api/v1/knowledge` may temporarily return a typed non-writing retired response with the four supported alternatives and no mutation;
- it must not forward to the new production port, because that would preserve a fifth entry under a new name;
- the bridge has owner `Alembic`, removal trigger “generated API docs/consumers no longer declare create and compatibility window approved by controller”, and a same-demand deletion target unless raw compatibility evidence requires a bounded later removal decision;
- any exception that keeps the route writable is out of scope and requires new user confirmation.

### Deletion order and evidence

1. Land and test the Core production/readiness/projector contract with a real in-test consumer.
2. Connect Agent and Plugin knowledge submit adapters.
3. Replace Alembic module-scan direct create/publish and prove returned pending/staging IDs reach real review consumers.
4. Change Dashboard scan review to existing Recipe IDs, full profile edit and legal publish; remove `knowledgeCreate` call and create payload builder usage.
5. Run repository-wide call/import/HTTP contract scans. Classify every remaining `KnowledgeService.create` as Core internal/test or migrate it.
6. Make `POST /api/v1/knowledge` non-writing retired response only if compatibility evidence requires it; otherwise delete route immediately.
7. Remove generated create types, provider-contract declarations, stale docs, auto-publish branch and temporary bridge after its cleanup trigger.
8. Run representative build/type/lint/API-contract/smoke tests and a negative runtime probe proving the legacy route cannot create or publish a Recipe.

Deletion is incomplete if only the handler is gone while Dashboard/generated types still advertise it, or if a compatibility adapter silently calls the new production port.

## Migration And Compatibility

### Future Recipes

After Core and producer adapters land, all newly created Recipe candidates include profile schema/provenance and must pass readiness before active. Provider availability does not affect their truth lifecycle.

### Existing Recipes

Existing Recipe Markdown remains authoritative and readable. A compatibility projector derives a versioned document set from current fields without writing the Recipe. It must:

- mark the result `compatibility` and emit readiness warnings;
- never invent evidence-grounded English concepts it cannot prove;
- avoid reproducing fixed nine-region/path-only behavior;
- keep active legacy Recipe queryable until an explicit migration is applied later.

### Dry-run

The implementation provides a read-only/copy-safe report that computes:

- total active/pending/staging/deprecated Recipes;
- native profile versus compatibility projection counts;
- readiness violation/warning counts by stable code;
- projected role counts, duplicates and empty/oversize documents;
- expected vector additions/removals/re-embeds for a target provider/generation;
- legacy route/caller inventory where applicable.

Dry-run cannot mutate Recipe Markdown, SQLite, vector index, config or active generation.

### Shadow reproduction

On a copied data root only, controller can:

1. produce native/compatibility document sets;
2. build keyword projection and a shadow vector generation;
3. verify manifest/corpus fingerprints and exact expected IDs;
4. run the frozen query/control matrix;
5. switch to shadow generation;
6. fault-inject a failed next build and prove current generation remains active;
7. rollback and prove candidate availability/order returns to the prior generation.

### Real apply boundary

This demand ships the capability but does not apply it to the real BiliDili or AlembicWorkspace knowledge roots during acceptance. A later explicit operator action may run the supported migration after reviewing dry-run evidence. Real apply is neither implied by a passing test nor authorized by this Design delivery.

## Failure Paths

| Failure | Required behavior | Forbidden behavior |
| --- | --- | --- |
| profile missing/invalid on new candidate | save pending/staging with violations | silently default and auto-publish |
| active publish readiness failure | reject transition with stable codes | call provider/rank query or partial publish |
| provider unavailable | keep truth, keyword available, vector pending diagnostic | block publish or query visibility |
| embedding batch partial failure | keep old generation/doc set; mark failed/pending | delete old vectors first |
| same-dimension model change | manifest incompatibility → shadow re-embed | reuse old vectors because dimensions match |
| projection schema change | new generation + exact reconcile | mix versions in active candidate set |
| Recipe update changes one role | verify complete replacement then remove old role IDs | leave partial old/new mix |
| Recipe delete/deprecate | remove across generations without provider | wait for embedding service |
| missed knowledge event/crash | startup/explicit exact reconcile repairs from authority | query triggers repair |
| legacy HTTP create call | typed retired/unsupported result, zero writes | forward to new port as hidden fifth entry |
| Dashboard edits incomplete fields | retain pending/staging and show violations | discard unseen profile fields or auto-publish |
| migration dry-run on real root | fail closed if operation would write | “best effort” write then restore |

## Repository Boundaries And Per-Window Landing Plan

| Order | Window | Status | designIntent | Code-level landing | Required exit evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | `AlembicCore` | required producer | Make Recipe retrieval expression and derived index identity one shared, deterministic contract without changing query-time truth boundaries. | KnowledgeEntry/wire/Markdown profile; readiness evaluator; projector/document roles; production port integration; sparse/dense shared projection; manifest/generation/exact reconcile/shadow/rollback; public exports and compatibility projector. | focused RED/GREEN tests, full Core tests/build/type/public/layer gates, clean commit, changed-symbol review |
| 2A | `AlembicAgent` | required producer adapter | Generate evidence-grounded profile fields and bounded code evidence, while delegating final semantics/readiness to Core. | producer schema/prompt/front-load updates; remove unsafe whole-file coreCode repair; consume Core violations; preserve stop-loss/evidence ledger behavior. | schema=validation parity tests, bad-range/whole-file negative tests, cold/opportunistic paths, full tests/build, clean commit |
| 2B | `AlembicPlugin` | required host adapter/consumer | Route host cold-start/rescan/knowledge-submit through the Core contract and maintain generation state only outside request-scoped Search/Prime. | tool schema/output; stage gates + profile provenance; region builder replaced by projector documents; explicit maintenance/rebuild; Search/Prime remain read-only/common; no Alembic main runtime import. | MCP contract tests, submit/cold/rescan tests, Search/Prime zero-write/parity, generation maintenance tests, full build/tests, clean commit |
| 3 | `Alembic` | required runtime and legacy cleanup | Connect in-process cold-start/incremental/module-scan/lifecycle to Core/Agent contracts, then retire direct create paths with proven caller replacement. | consume accepted Core/Agent; module scan production port; publish readiness; daemon/startup generation maintenance; remove AiScan direct create/publish; migrate/retire HTTP POST create; update provider/generated contracts and docs. | call/import scan, API negative probe, module-scan end-to-end pending/staging result, lifecycle/readiness tests, migration/shadow/rollback integration, full build/tests, clean commit |
| 4 | `AlembicDashboard` | required reviewer | Review and repair retrieval profile/readiness on existing candidates without remaining a Recipe creation or auto-publish path. | types/API for profile/readiness/generation; candidate review/editor fields; preserve unseen fields; remove knowledgeCreate/auto-publish/create payload path; legal publish error UI; migration report/status. | component/API contract tests, create-call absence scan, editor round-trip, readiness failure UI, build/type/lint, clean commit |
| 5 | `AlembicWorkspace` controller | acceptance only | Verify producer→truth→projection→retrieval→maintenance as one real chain on copies, then prove real roots remain unchanged. | review exact commits/diffs/evidence; run copied-snapshot matrix and lifecycle faults; new temp Codex cold MCP window; real roots read-only Search/Prime + fingerprints. | raw command output, runtime JSON, query matrices, manifests, failure/rollback logs, before/after hashes |
| none | `Test` | no task | No separate Test environment is needed; controller owns the bounded real scenarios. | no Test card/window. | absence of Test dispatch |

Dependency refinement:

- Core must be accepted before Agent or Plugin implementation is accepted.
- Agent and Plugin may consume the same accepted Core contract independently.
- Alembic module-scan and in-process integration depends on accepted Core plus the Agent adapter contract where it invokes Agent production.
- Dashboard starts only after Alembic API/lifecycle replacement shape is fixed; otherwise it would target a moving create/publish contract.
- Each repository receives exactly one combined task package for this demand and returns one repository commit/evidence set.

## Phase Candidates And Stage Acceptance

Phases are controller planning candidates, not Design dispatch authority.

### P1 — Core truth, projection and generation producer

Deliverables:

- profile/readiness/projector/production contracts;
- KnowledgeEntry/Markdown/SQLite round-trip;
- sparse/dense shared document source;
- exact lifecycle/generation maintenance;
- compatibility projection.

Acceptance:

- one in-test real production consumer calls the port through persistence and projection;
- a new valid Recipe round-trips without field loss;
- malformed/default/whole-file code evidence remains pending/staging and active publish fails deterministically;
- provider unavailable does not change readiness outcome;
- keyword and dense documents report identical source/profile hashes;
- incremental and full build produce byte-equivalent document sets for the same Recipe;
- same-dimension model and projection schema changes create a new generation;
- failed shadow build leaves old generation queryable; rollback works;
- exact reconcile detects orphan/missing/partial/duplicate/stale generation fixtures.

### P2 — Agent and Plugin producer adapters

Deliverables:

- Agent emits evidence-grounded profile input and bounded core code;
- Plugin host submit/cold/rescan consumes Core profile/readiness/projector;
- Plugin request-scoped Search/Prime remains writer-free.

Acceptance:

- cold-start, opportunistic and session-bound submit variants produce the same profile semantics from equivalent evidence;
- no adapter inserts test query/target ID/global synonym inputs;
- whole-file source range negative fixture is rejected or leaves `coreCode` empty with a violation;
- Plugin maintenance can generate/remove exact role documents when provider exists and still clean deletions when absent;
- Search/Prime constructor/call graph has no writer/reconcile/index-build dependency;
- existing public Search/Prime candidate evidence remains compatible.

### P3 — Alembic integration and legacy route cleanup

Deliverables:

- in-process workflows use accepted Core/Agent contracts;
- module scan replacement;
- publish readiness in HTTP/in-process lifecycle;
- shadow/dry-run/rollback operator surface;
- legacy direct create caller migration and route retirement.

Acceptance:

- module scan creates a pending/staging Recipe through the production port and returns its ID to the review chain;
- no `AiScanService` direct create/publish remains;
- all product-level direct `KnowledgeService.create` references are eliminated or proven Core-internal sync/import and allowlisted;
- legacy POST create cannot write or publish; generated API/provider docs no longer advertise it as supported;
- existing GET/PATCH/lifecycle/quality surfaces remain unless separately replaced;
- cold-start/incremental flows complete without adding a new production entry;
- explicit dry-run is zero-write and shadow/rollback fault tests pass.

### P4 — Dashboard reviewer migration

Deliverables:

- profile/provenance/readiness and generation status UI;
- full edit round-trip;
- existing candidate review and legal publish;
- removal of create/auto-publish paths.

Acceptance:

- repository scan finds no `knowledgeCreate` call from runtime UI;
- saving edits preserves all profile and unedited Recipe fields;
- readiness hard violation is shown with stable code and active transition remains unchanged;
- provider/vector warning is visible but does not disable legal publish;
- scan results map to existing Recipe IDs rather than creating duplicates;
- accessibility/basic interaction tests cover profile sections and errors.

### P5 — Controller copied-snapshot and real read-only acceptance

Deliverables:

- reviewed commits and dependency evidence;
- copied-snapshot migration and query reports;
- original-root zero-write report.

Acceptance:

- all product windows accepted first;
- BiliDili eight queries each run at least three serial warm repetitions and once in a fresh temporary Codex/MCP process;
- all eight are non-empty and expected Recipe resolves Top 3 without a hardcoded UUID; test harness resolves the authoritative Recipe from a snapshot manifest/title+trigger outside product code;
- queries 1–5 and 8 do not regress from current correct outcomes; q6/q7 become Top 3 with sparse/dense/RRF evidence;
- Search/Prime ordered candidate parity passes at the shared candidate limit;
- AlembicWorkspace controls remain Top 3 and no new path/default-topic noise enters the first page;
- migration dry-run shows planned changes only; shadow build/switch/failure/rollback is proven on copies;
- real data roots and repository worktrees have identical before/after fingerprints/status.

## Testing Decisions And Validation Strategy

### Product repository verification

Each target window must provide:

- exact clean commit hash and parent;
- changed file/symbol list;
- focused RED/GREEN output for its phase gates;
- full repository test/build/type/lint/API or public boundary output required by repository rules;
- first self-review against this requirement, then code-quality/failure/performance review;
- explicit proof that no unrelated product capability or excluded route was added.

### Controller static review

- trace all four supported entry capabilities to `RecipeProductionPort` and Core persistence;
- trace every active transition to `RetrievalReadiness`;
- verify Search/Prime/Recipe Context depend only on read-only retrieval ports;
- scan product repos for direct `KnowledgeService.create`, legacy POST create, Dashboard `knowledgeCreate`, auto-publish and duplicate region builders;
- review generated API/public exports and compatibility bridges;
- inspect manifest generation/pointer switch/rollback and exact reconcile code paths;
- compare production algorithm/config against frozen query strings, expected Recipe identifiers and synonym lists.

### Copied-snapshot runtime verification

Use copied data roots, not the real source roots, for any write-capable command:

1. record copy provenance and initial hashes;
2. run profile/readiness/projector dry-run;
3. build sparse projection and shadow vector generation;
4. assert expected document roles, hashes and manifest descriptor;
5. run BiliDili eight-query and AlembicWorkspace controls;
6. update/delete/replace Recipe copies and verify exact lifecycle;
7. simulate provider absent, embed batch failure, same-dimension model change, schema change and interrupted persistence;
8. switch/rollback generations and verify query continuity;
9. discard copies.

### Real-root read-only verification

- resolve runtime DB/WAL/SHM/config/vector/Recipe paths through supported status/config output;
- hash `exists + size + mtime + sha256` before calls;
- run only public Search/Prime queries and status reads;
- repeat hashes and repository worktree status afterward;
- any mtime/hash/existence change fails acceptance and stops broader testing.

### Frozen matrices without production hardcoding

- eight BiliDili queries live only in external test/acceptance fixtures;
- production profile/projector packages cannot import the fixture or query strings;
- expected Recipe UUID is resolved at runtime from the authoritative snapshot record, not committed into product ranking logic;
- control queries/expected records are frozen before implementation and cannot be rewritten after seeing results;
- report every lane contribution, not only pass/fail or final rank.

### Test decision

- Test handoff required: no.
- No Test Environment Spec is required because controller uses local copied snapshots and read-only real roots already under workspace control.
- A fresh temporary Codex window is allowed solely to load rebuilt MCP/plugin code and prove cold-process behavior; it is not a Wakeflow Test window.
- Controller must not create a Test card or delegate implementation defects to Test.

## Acceptance Criteria

### Truth and readiness

- [ ] `retrievalProfile` round-trips Markdown/domain/SQLite/API without loss.
- [ ] profile has schemaVersion, primary-language truth, evidence-grounded English technical expression and provenance.
- [ ] no production input contains frozen queries, expected Recipe UUID or global query synonym table.
- [ ] pending/staging accepts repairable profile violations.
- [ ] every active transition rejects hard structural violations with stable codes.
- [ ] provider/vector/rank state is absent from hard readiness inputs.
- [ ] active legacy Recipe remains readable through compatibility projection.

### Projection and retrieval

- [ ] one required intent and only distinct informative optional role documents are produced.
- [ ] raw paths/quality bookkeeping are not candidate documents.
- [ ] sparse and dense project from the same document-set/profile/source hashes.
- [ ] current nine-region fixed splitter is retired from active Recipe candidate generation.
- [ ] generic entry vectors do not compete as a second Recipe representation.
- [ ] Search/Prime common truth/refill/raw evidence behavior remains unchanged.

### Lifecycle

- [ ] event incremental and full build yield the same document set.
- [ ] manifest fingerprints schema/provider/model/dimension/format/corpus generation.
- [ ] update replacement is verified before old removal.
- [ ] delete/deprecate cleanup works without provider.
- [ ] exact reconcile finds orphan/missing/partial/duplicate/stale generation.
- [ ] shadow failure preserves active generation.
- [ ] atomic switch and rollback are proven.
- [ ] no query path invokes projector persistence, reconcile, rebuild or writer.

### Entry boundary and cleanup

- [ ] only cold-start, incremental, module scan and knowledge submit create Recipe candidates.
- [ ] Agent and Plugin submit use the shared production contract.
- [ ] AiScan direct create/publish is gone; module scan has a real connected replacement.
- [ ] Dashboard runtime has no create/auto-publish path.
- [ ] generic POST create is non-writing/removed and no supported contract advertises it.
- [ ] all remaining direct Core truth-service callers are classified internal/test and boundary-linted.
- [ ] no temporary compatibility bridge survives without owner/removal trigger; no writable bridge survives completion.

### Real outcomes

- [ ] BiliDili stable current baseline is preserved in evidence.
- [ ] eight queries pass Top 3 across warm repeats and cold MCP process.
- [ ] q6/q7 include improved sparse/fusion evidence, not only dense rank.
- [ ] AlembicWorkspace control set remains Top 3.
- [ ] Search/Prime ordered candidate parity passes.
- [ ] provider failure produces explicit keyword degradation, not knowledge absence.
- [ ] copied-snapshot migration/failure/rollback passes.
- [ ] real roots and source worktrees remain byte/status unchanged.

## Risks And Open Questions

Open product questions: none. The following risks have confirmed mitigations and binary acceptance gates.

| Risk | Mitigation / acceptance gate |
| --- | --- |
| retrieval profile becomes a second truth system | embed it in existing Recipe/Markdown wire; no default independent DB/state machine |
| English expression hallucinates concepts | every item requires evidence/source-field provenance; readiness rejects ungrounded values |
| publish gate becomes a ranking/availability gate | evaluator is deterministic and provider/query-free; tests inject provider offline with identical readiness |
| adaptive roles drop important negative constraints | guidance includes exclusions/dont; BiliDili q4/q5/q8 frozen regression proves preservation |
| role weighting becomes another target-specific rank hack | role policy is schema-wide; controls and corpus-wide metrics; scan for query/ID imports |
| compatibility projection invents missing English truth | compatibility mode may warn and use existing facts only; native migration is explicit |
| profile schema breaks old Markdown/API readers | additive field, round-trip compatibility tests and generated wire updates |
| missed EventBus event leaves stale vector | exact hash/ID reconcile from authority at startup/explicit maintenance |
| same-dimension provider change is invisible | manifest includes provider/model/format, not only dimension |
| shadow build doubles disk temporarily | dry-run reports capacity; build refuses before touching active generation if capacity insufficient |
| Dashboard removal loses manual review | review/edit/publish stays on existing candidate IDs; only create/auto-publish is removed |
| HTTP clients silently break | source/generated contract scan; optional typed non-writing retired response; never hidden forwarding |
| legacy bridge persists forever | owner/removal trigger and same-demand deletion gate; no writable bridge accepted |
| BiliDili-only tuning regresses workspace | frozen AlembicWorkspace controls and whole-corpus duplicate/noise reports |
| concurrent provider calls create unstable results | serial warm repeats + fresh-process run + explicit fallback diagnostics |

## Non-goals And Forbidden Shortcuts

- No real BiliDili/AlembicWorkspace Recipe edits, rescan, reconcile, rebuild, re-embed or migration apply during acceptance.
- No second knowledge database, independent retrieval state machine or persisted query-answer cache.
- No hardcoded target Recipe ID, frozen query text, global synonyms, query classifier branch or per-Recipe weights in production.
- No rank/provider/vector readiness publish gate.
- No query-time writer/reconcile/rebuild/profile generation.
- No revival of Plugin↔Alembic main coupling.
- No Graph/Recipe Map pagination/session redesign.
- No Git revision/checkpoint/dirty, host-selected project, Admin/role, MCP visibility or knowledge-status query gate.
- No timeout increase or candidate-window inflation as the primary fix.
- No retention of AiScan direct create, HTTP writable create or Dashboard create/auto-publish as compatibility entries.
- No deletion before replacement caller, import/reference scan and representative validation.
- No Test window, Test card, state root, task package, pod or implementation dispatch from Design.

## User-Confirmation Ledger

| ID | Product decision | Answer | Effect |
| --- | --- | --- | --- |
| Q1 | 持久化、Dashboard 可审阅、带 provenance/schemaVersion 的 Recipe retrieval expression | yes | profile 作为 Recipe 内嵌 section/field 优先，不预设独立 DB/状态系统 |
| Q1a | 主语言 + evidence-grounded English summary/concepts/scenarios/exclusions | yes | producer contract 与 Dashboard 均覆盖；禁止 query/ID/synonym hardcode |
| Q2 | pending/staging 可保存；active publish 使用确定性 RetrievalReadiness | yes | active transition 统一门；结构失败可修复 |
| Q2a | provider offline、vector pending、真实排名不阻断 publish | yes | 派生维护状态只作警告/观测 |
| Q2b | existing active legacy 不立即下线 | yes | compatibility projection + migration report |
| Q3 | 最终生产能力只有冷启动、增量、模块扫描、知识提交 | yes | 四能力共用 Core port；其它路径清理 |
| Q3a | AiScan/HTTP/Dashboard 旧旁路不升级为长期入口 | yes | caller replacement、bridge if proven、delete order/evidence required |
| Q3b | Dashboard 保留 profile/readiness review/edit，不保留 create/auto-publish | yes | reviewer window required after Alembic API landing |
| Q4 | 存量真实库不在验收中原地修改 | yes | 只交付 dry-run/shadow/rollback，写测试在副本 |
| Q5 | Test window | no | controller owns copied-snapshot + real read-only acceptance |
| Q6 | Auto Claim | no | controller manually claims after reviewing delivery |
| Open questions | none | confirmed | S1 delivery unblocked |

## Handoff Readiness

- Original Plan confirmed: yes.
- Requirement Design complete: yes.
- Code-fact reconciliation: complete for current production, persistence, sparse/dense projection, lifecycle and real callers.
- Per-window landing plan and `designIntent`: complete for Core, Agent, Plugin, Alembic, Dashboard and controller acceptance.
- Legacy route replacement/deletion plan: complete with caller, bridge boundary, order and evidence.
- Non-goals: complete and confirmed.
- User-confirmation ledger: complete; no open product question.
- Testing decision: no Test window; controller plan complete.
- Needs additional Wakeflow code research before claim: no.
- Ready for controller intake: yes; manual claim only.

## Controller Intake Notes

- Intake readiness: `ready-for-controller-intake`.
- Priority: P0 because current producers continue creating migration debt and legacy paths bypass the gate.
- Auto Claim: no; controller must review and explicitly claim.
- Demand shape: one cross-repository requirement; one combined package per affected repo.
- Producer/consumer order: Core → Agent/Plugin → Alembic legacy cleanup → Dashboard reviewer → controller acceptance.
- Controller must preserve exact accepted upstream commits when opening downstream work and reject type-only contract phases.
- A code fact that reveals an unlisted direct caller may change the migration work item but cannot add a fifth supported production capability.
- A request to keep a writable generic HTTP/Dashboard create path, add a second retrieval DB, use rank as publish gate or modify real data requires return to Design/user; it is not an implementation adjustment.
- No Test card/window may be created.

## Design Handoff

- Source: confirmed user decisions, current five-repository source reconciliation, prior accepted retrieval architecture, and live read-only BiliDili/AlembicWorkspace query evidence.
- Goal: make Recipe production truth fit both keyword and vector retrieval, maintain derived indexes safely, and close legacy creation bypasses.
- Confirmed decisions: profile/readiness behavior, four-entry boundary, cleanup route, migration boundary, Test=no and autoClaim=false are all recorded.
- Design recommendations: interface names and exact TypeScript shapes may evolve, but semantic contracts and completion gates are fixed.
- Open questions: none.
- Non-goals: no real data writes, second truth store, query hardcode, rank gate, query-time maintenance, Graph/Map redesign, coupling revival or Test window.
- Risks: grounded English expression, compatibility projection, shadow capacity, external HTTP clients and deletion ordering have explicit gates above.
- Required controller judgment: review S1 completeness, manually claim, preserve producer/consumer dependencies, author one package per repo, review commits/raw evidence and run final copied-snapshot/real-read-only acceptance.
- Suggested next action: controller `wakeflow_next_work` then explicit claim for this design key.
- Suggested skills: `wakeflow-controller` and `wakeflow-governance`; target windows later use their assigned target/craft skills.
- Source artifacts: this Requirement Design and linked Original Plan.
- Redaction notes: no real thread IDs, secrets, runtime handles or user absolute paths are stored.
- Intake status: `ready-for-controller-intake`.

## Source References

### Design and accepted baseline

- `Design/docs/current/alembic-recipe-production-retrieval-quality-original-plan-2026-07-13.md`
- `wakeflow-ledger/workspace/archive/2026-07/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/demand.json`
- `wakeflow-ledger/workspace/archive/2026-07/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/developer-progress.md`
- `wakeflow-ledger/workspace/archive/2026-07/alembic-retrieval-vector-projectcontext-architecture-mainline1-2026-07-13/controller-events.jsonl`

### AlembicCore

- `AlembicCore/src/domain/knowledge/FieldSpec.ts`
- `AlembicCore/src/domain/knowledge/KnowledgeEntry.ts`
- `AlembicCore/src/domain/knowledge/UnifiedValidator.ts`
- `AlembicCore/src/domain/knowledge/recipe-authoring-spec/`
- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts`
- `AlembicCore/src/service/knowledge/KnowledgeService.ts`
- `AlembicCore/src/service/knowledge/validation/quality/QualityScorer.ts`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts`
- `AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicCore/src/service/search/KnowledgeRetrieval.ts`
- `AlembicCore/src/service/vector/EmbeddingPort.ts`
- `AlembicCore/src/service/vector/RecipeRegionVectorIndex.ts`
- `AlembicCore/src/service/vector/SyncCoordinator.ts`
- `AlembicCore/src/service/vector/VectorService.ts`
- `AlembicCore/src/infrastructure/vector/HnswVectorAdapter.ts`
- `AlembicCore/test/KnowledgeRetrievalPolicy.test.ts`

### AlembicAgent

- `AlembicAgent/src/tools/runtime/handlers/knowledge.ts`
- `AlembicAgent/src/tools/runtime/handlers/recipeAuthoringGate.ts`
- `AlembicAgent/src/agent/prompts/insightProducer.ts`
- `AlembicAgent/src/agent/runtime/ToolExecutionPipeline.ts`

### AlembicPlugin

- `AlembicPlugin/lib/host-runtime/mcp/handlers/tool-router.ts`
- `AlembicPlugin/lib/host-runtime/mcp/handlers/recipe-content-quality-gate.ts`
- `AlembicPlugin/lib/recipe-pipeline/curate/recipe-evidence-gate.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/cold-start.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/knowledge-rescan.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/recipe-region-vector.ts`
- `AlembicPlugin/lib/recipe-pipeline/generate/knowledge-index-rebuild.ts`
- `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts`
- `AlembicPlugin/lib/injection/modules/VectorModule.ts`

### Alembic

- `Alembic/lib/tools/ToolContextFactory.ts`
- `Alembic/lib/cli/AiScanService.ts`
- `Alembic/lib/http/routes/knowledge.ts`
- `Alembic/lib/http/provider-contracts.ts`
- `Alembic/lib/recipe-pipeline/generate/ColdStartWorkflow.ts`
- `Alembic/lib/recipe-pipeline/generate/incremental/IncrementalRescanWorkflow.ts`
- `Alembic/lib/recipe-pipeline/generate/runtime/UiStartupTasks.ts`
- `Alembic/lib/injection/modules/KnowledgeModule.ts`
- `Alembic/lib/injection/modules/VectorModule.ts`

### AlembicDashboard

- `AlembicDashboard/src/types.ts`
- `AlembicDashboard/src/App.tsx`
- `AlembicDashboard/src/KnowledgePayload.ts`
- `AlembicDashboard/src/api/knowledge.ts`
- `AlembicDashboard/src/components/Modals/RecipeEditor.tsx`
- `AlembicDashboard/src/generated/api-types.ts`
