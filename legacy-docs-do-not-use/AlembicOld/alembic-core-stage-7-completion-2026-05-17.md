# AlembicCore 阶段 7 完成记录

日期：2026-05-17
范围：Core 仓库内的 search / vector / indexing 完整迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`fcb46ae Migrate search vector core`

## 1. 本阶段目标

把 Alembic / AlembicPlugin 共同依赖的搜索、排序、向量索引、HNSW 持久化和 CRUD 到向量索引同步内核迁入 `@alembic/core`。

本阶段迁入的是确定性检索与向量基础设施：

- BM25 / FieldWeighted / coarse / multi-signal ranking。
- SearchEngine 的 keyword、weighted、auto、semantic gate、cache、signal emission。
- HybridRetriever 的 RRF dense/sparse 融合。
- VectorStore 抽象、JSON/HNSW adapter、HNSW index、scalar quantization、binary persistence、WAL、migration。
- BatchEmbedder、Chunker、ASTChunker、IndexingPipeline。
- VectorService 和 SyncCoordinator。

本阶段不迁具体 AI provider、API key、模型选择、provider module、具体 CrossEncoder AI prompt 实现或 ContextualEnricher AI prompt 实现。

## 2. 已迁入 Core 的文件

Infrastructure vector：

- `src/infrastructure/vector/ASTChunker.ts`
- `src/infrastructure/vector/AsyncPersistence.ts`
- `src/infrastructure/vector/BatchEmbedder.ts`
- `src/infrastructure/vector/BinaryPersistence.ts`
- `src/infrastructure/vector/Chunker.ts`
- `src/infrastructure/vector/HnswIndex.ts`
- `src/infrastructure/vector/HnswVectorAdapter.ts`
- `src/infrastructure/vector/IndexingPipeline.ts`
- `src/infrastructure/vector/JsonVectorAdapter.ts`
- `src/infrastructure/vector/ScalarQuantizer.ts`
- `src/infrastructure/vector/VectorMigration.ts`
- `src/infrastructure/vector/VectorStore.ts`
- `src/infrastructure/vector/index.ts`

Search service：

- `src/service/search/BM25Scorer.ts`
- `src/service/search/CoarseRanker.ts`
- `src/service/search/FieldWeightedScorer.ts`
- `src/service/search/HybridRetriever.ts`
- `src/service/search/MultiSignalRanker.ts`
- `src/service/search/SearchEngine.ts`
- `src/service/search/SearchTypes.ts`
- `src/service/search/contextBoost.ts`
- `src/service/search/tokenizer.ts`
- `src/service/search/index.ts`

Vector service：

- `src/service/vector/EnrichmentTypes.ts`
- `src/service/vector/SyncCoordinator.ts`
- `src/service/vector/VectorService.ts`
- `src/service/vector/index.ts`

Package exports：

- `@alembic/core/infrastructure/vector`
- `@alembic/core/infrastructure/vector/*`
- `@alembic/core/service/search`
- `@alembic/core/service/search/*`
- `@alembic/core/service/vector`
- `@alembic/core/service/vector/*`

## 3. 关键边界决策

### 3.1 向量能力属于 Core

向量索引、HNSW、JSON fallback、binary persistence、WAL、chunking、batch embedding 调度、indexing pipeline、hybrid retrieval、ranking 和 CRUD 自动同步都是跨 Alembic / AlembicPlugin 共享的确定性内核，已进入 Core。

### 3.2 AI provider 不属于 Core

Core 只接受注入接口：

- `SearchAiProvider`
- `SearchVectorService`
- `SearchHybridRetriever`
- `SearchCrossEncoder`
- `EmbedProvider`
- `VectorChunkEnricher`

具体 OpenAI / Gemini / Claude / local embedding provider、API key、模型选择和 provider module 都继续留在外层。

### 3.3 CrossEncoderReranker 具体实现留外层

`lib/service/search/CrossEncoderReranker.ts` 包含具体 AI structured-output prompt 和 fallback 策略。Core 只保留 `SearchCrossEncoder` 接口和 SearchEngine 的可选调用点；无实现时自动跳过 semantic rerank。

外层如果继续需要 CrossEncoder，应让该实现 import Core 的 tokenizer / similarity / `SearchCrossEncoder` 类型，而不是把 prompt 逻辑迁回 Core。

### 3.4 ContextualEnricher 具体实现留外层

`lib/service/vector/ContextualEnricher.ts` 包含具体 LLM prompt 和 chat 调用。Core 只新增 `VectorChunkEnricher` 合约，并让 `IndexingPipeline` / `VectorService` / `SyncCoordinator` 接受可选注入。

外层 Alembic / AlembicPlugin 可以继续持有自己的 ContextualEnricher adapter，并把它注入 Core indexing/vector service。

### 3.5 VectorModule / provider wiring 留外层

Core 不迁 `VectorModule` 或 ServiceContainer wiring。外层继续负责：

- 创建 provider。
- 创建 VectorStore / IndexingPipeline / VectorService。
- 绑定 EventBus。
- 注册 CLI/MCP/HTTP/search handlers。
- 决定何时全量 build、增量 update 或 clear+force rebuild。

### 3.6 无 provider 时必须可用

Core 的 keyword / field-weighted / BM25 / multi-signal 搜索在无 provider 时可用。semantic/vector path 在没有注入 provider 或 vector service 时降级为 warning/disabled，不阻断知识检索链路。

## 4. 已迁移测试

从 Alembic 迁入并修正 import：

- `test/SearchEngine.test.ts`
- `test/SearchRanking.test.ts`
- `test/HnswVector.test.ts`
- `test/VectorService.test.ts`
- `test/SyncCoordinator.test.ts`
- `test/SearchPipeline.test.ts`

说明：

- `SearchRanking.test.ts` 去掉了具体 `CrossEncoderReranker` 测试，因为该 AI prompt 实现留外层。
- `ContextualEnricher.test.ts` 不迁入 Core，因为具体 AI chat enrichment 留外层。

覆盖重点：

- tokenizer、BM25、FieldWeighted、SearchEngine cache/index/search。
- CoarseRanker、MultiSignalRanker、contextBoost。
- HNSW index、quantizer、binary persistence、JSON migration、WAL、BatchEmbedder、Chunker、IndexingPipeline。
- VectorService semantic/hybrid/batch/sync/circuit breaker 降级。
- SyncCoordinator CRUD debounce、flush、remove、reconcile。
- SearchPipeline 的真实 in-memory SQLite 端到端索引和检索。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run lint
npm run build:check
npm run test
npm run build
node --input-type=module -e "const vector=await import('@alembic/core/infrastructure/vector'); const search=await import('@alembic/core/service/search'); const svc=await import('@alembic/core/service/vector'); console.log(JSON.stringify({hnsw:!!vector.HnswVectorAdapter, indexing:!!vector.IndexingPipeline, search:!!search.SearchEngine, hybrid:!!search.HybridRetriever, vectorService:!!svc.VectorService, sync:!!svc.SyncCoordinator}, null, 2));"
```

结果：

- Biome lint 通过，保留 copied baseline warnings。
- TypeScript build check 通过。
- Vitest 31 个测试文件通过。
- Vitest 637 个测试通过。
- 实际构建通过。
- infrastructure/vector、service/search、service/vector entrypoints 的 self-reference import smoke 全部通过。
- Core 工作区提交后干净。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

阶段 7 外层接入前必须确认：

- 阶段 1-6 import 已收敛。
- `vendor/AlembicCore` 更新到 `fcb46ae` 或更新提交。
- 外层 provider / DI / CLI / MCP 测试仍在外层跑通。

本阶段 Core 未新增运行时依赖，外层 lockfile 通常只随 gitlink 或 dependency metadata 变化刷新。

### 6.2 Alembic 接入

替换 imports：

- `#infra/vector/*` 或 `lib/infrastructure/vector/*` → `@alembic/core/infrastructure/vector/*`
- `#service/search/SearchEngine.js` → `@alembic/core/service/search/SearchEngine`
- `#service/search/SearchTypes.js` → `@alembic/core/service/search/SearchTypes`
- `#service/search/BM25Scorer.js` → `@alembic/core/service/search/BM25Scorer`
- `#service/search/CoarseRanker.js` → `@alembic/core/service/search/CoarseRanker`
- `#service/search/FieldWeightedScorer.js` → `@alembic/core/service/search/FieldWeightedScorer`
- `#service/search/HybridRetriever.js` → `@alembic/core/service/search/HybridRetriever`
- `#service/search/MultiSignalRanker.js` → `@alembic/core/service/search/MultiSignalRanker`
- `#service/search/contextBoost.js` → `@alembic/core/service/search/contextBoost`
- `#service/search/tokenizer.js` → `@alembic/core/service/search/tokenizer`
- `#service/vector/VectorService.js` → `@alembic/core/service/vector/VectorService`
- `#service/vector/SyncCoordinator.js` → `@alembic/core/service/vector/SyncCoordinator`
- `#service/vector` 中 enrichment contract → `@alembic/core/service/vector/EnrichmentTypes`

保留在 Alembic：

- `lib/service/search/CrossEncoderReranker.ts`
- `lib/service/vector/ContextualEnricher.ts`
- AI provider / embedding provider / API key / model config。
- `VectorModule`、ServiceContainer wiring、CLI `embed/search` 命令、MCP/HTTP handlers。
- Dashboard、RealtimeService、DaemonSupervisor、DaemonJobRunner。

接入时要让外层 `CrossEncoderReranker` 改为实现或适配 Core `SearchCrossEncoder`，让外层 `ContextualEnricher` 改为实现或适配 Core `VectorChunkEnricher`。

建议扫描：

```bash
rg -n "from ['\"](#infra/vector|#service/search/(BM25Scorer|CoarseRanker|FieldWeightedScorer|HybridRetriever|MultiSignalRanker|SearchEngine|SearchTypes|contextBoost|tokenizer)|#service/vector/(VectorService|SyncCoordinator)|\\.\\.?/.*lib/infrastructure/vector|\\.\\.?/.*lib/service/search/(BM25Scorer|CoarseRanker|FieldWeightedScorer|HybridRetriever|MultiSignalRanker|SearchEngine|SearchTypes|contextBoost|tokenizer)|\\.\\.?/.*lib/service/vector/(VectorService|SyncCoordinator))" lib bin test
```

边界保留检查：

```bash
rg -n "CrossEncoderReranker|ContextualEnricher|VectorModule|OpenAI|Gemini|Claude|apiKey|chatWithStructuredOutput|aiProvider" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- SearchEngine SearchRanking HnswVector VectorService SyncCoordinator SearchPipeline
```

还应补跑 CLI/MCP search/embed handler、provider wiring 和 daemon/bootstrap 相关测试。

### 6.3 AlembicPlugin 接入

替换 imports 同 Alembic，同时注意：

- Codex MCP search / bootstrap / rescan / structure handlers 调用 Core SearchEngine / VectorService。
- Plugin provider、Codex runtime、preflight、tool policy、tool metadata 和 plugin/channel 发布仍留 Plugin。
- Plugin 中具体 ContextualEnricher 如继续存在，应作为外层 adapter 注入 Core。

保留在 Plugin：

- Codex MCP server。
- Codex runtime/preflight/status/diagnostics/tool policy。
- plugin/channel/marketplace 发布脚本和 assets。
- provider 配置、模型选择、API key 管理。
- CrossEncoder/Contextual enrichment 具体 AI prompt 实现。

建议验证：

```bash
npm run build:check
npm run test -- SearchEngine SearchRanking HnswVector VectorService SyncCoordinator CodexMcpServer CodexStatusService
```

## 7. 删除计划

两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复实现。

可删除候选：

- `lib/infrastructure/vector/ASTChunker.ts`
- `lib/infrastructure/vector/AsyncPersistence.ts`
- `lib/infrastructure/vector/BatchEmbedder.ts`
- `lib/infrastructure/vector/BinaryPersistence.ts`
- `lib/infrastructure/vector/Chunker.ts`
- `lib/infrastructure/vector/HnswIndex.ts`
- `lib/infrastructure/vector/HnswVectorAdapter.ts`
- `lib/infrastructure/vector/IndexingPipeline.ts`
- `lib/infrastructure/vector/JsonVectorAdapter.ts`
- `lib/infrastructure/vector/ScalarQuantizer.ts`
- `lib/infrastructure/vector/VectorMigration.ts`
- `lib/infrastructure/vector/VectorStore.ts`
- `lib/service/search/BM25Scorer.ts`
- `lib/service/search/CoarseRanker.ts`
- `lib/service/search/FieldWeightedScorer.ts`
- `lib/service/search/HybridRetriever.ts`
- `lib/service/search/MultiSignalRanker.ts`
- `lib/service/search/SearchEngine.ts`
- `lib/service/search/SearchTypes.ts`
- `lib/service/search/contextBoost.ts`
- `lib/service/search/tokenizer.ts`
- `lib/service/vector/SyncCoordinator.ts`
- `lib/service/vector/VectorService.ts`

不删除：

- `lib/service/search/CrossEncoderReranker.ts`
- `lib/service/vector/ContextualEnricher.ts`
- provider / AI config / API key / model selection
- `VectorModule`、ServiceContainer wiring
- CLI/MCP/HTTP search/embed handlers
- Codex runtime/preflight/tool policy/plugin channel
- Dashboard/daemon/transport/delivery 层

删除前必须确认外层的 CrossEncoder / ContextualEnricher 已经不再从本地迁移候选文件回引，而是从 Core 引用 tokenizer、types、vector contracts。
