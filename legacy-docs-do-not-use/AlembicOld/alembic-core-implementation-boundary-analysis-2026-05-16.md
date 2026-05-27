# AlembicCore 实现边界深度分析

日期：2026-05-16
状态：实现挖掘结论，用于修正 `AlembicCore` 完整复制迁移手册

## 1. 本文目标

本文不是新的迁移阶段表，而是对当前 Alembic / AlembicPlugin 代码实现做边界判定。它回答三个问题：

1. 哪些功能必须进入 `@alembic/core`，并且需要按真实依赖闭包完整复制。
2. 哪些文件虽然在 workflow 链路里，但混有 agent、tool、delivery、Codex 适配，不能整文件进入 Core。
3. host agent 知识挖掘闭环在 Core 中应该包含到哪里，外层仓库又应该从哪里接手。

结论先行：

- Core 不是 thin facade。Core 必须拥有可运行的确定性知识内核。
- Core 不运行 Alembic internal AgentRuntime，也不拥有 Alembic tool system。
- Core 要拥有 host-agent mining loop 的闭环协议和收敛能力：扫描、证据、briefing、session、submission、validation、checkpoint、report、Recipe/SourceRef/Knowledge 回填。
- Core 要拥有 search / vector / indexing 的本地知识检索内核；但不拥有具体 embedding provider、API key、模型调用实现。
- Delivery、Codex MCP、tool exposure、插件交付渠道、AGENTS.md/Skills 生成留在外层。

## 2. 代码证据摘要

### 2.1 host-agent cold start / rescan 入口

已读入口：

- `AlembicPlugin/lib/workflows/cold-start/external/ExternalColdStartWorkflow.ts`
- `AlembicPlugin/lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts`
- `Alembic/lib/workflows/capabilities/execution/external/*`

外部 cold start 当前链路：

1. `resolveProjectRoot` / `resolveDataRoot`
2. `runFullResetPolicy`
3. `ProjectIntelligenceCapability.run`
4. `buildProjectSnapshot`
5. `createExternalWorkflowSession`
6. `buildExternalMissionBriefing`
7. 返回给宿主 agent，由宿主 agent 分维度分析代码并提交知识

外部 rescan 当前链路：

1. 清理策略：`force-rescan` / `rescan-clean` / `snapshotRecipes`
2. `syncKnowledgeStoreForRescan`
3. `ProjectIntelligenceCapability.run`
4. `auditRecipesForRescan`
5. `buildKnowledgeRescanPlan`
6. `buildRescanPrescreen`
7. `projectExternalRescanEvidencePlan`
8. `createExternalWorkflowSession`
9. `buildExternalMissionBriefing`
10. 返回给宿主 agent 进行 evolve / gap-fill / dimension_complete

判定：

- 这条链路是 Core 需要承担的完整知识闭环，但 Core 只负责生成任务、证据、协议和收敛结果。
- 宿主 agent 的实际执行、MCP envelope、工具名、返回文案、Codex preflight 均不是 Core。

### 2.2 ProjectIntelligence 是 Core 核心

已读文件：

- `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts`
- `ProjectIntelligenceRunner.ts`
- `ProjectIntelligencePreparation.ts`
- `FileDiffPlanner.ts`
- `FileDiffSnapshotStore.ts`
- `ProjectIntelligenceIncrementalPlanner.ts`
- `ProjectIntelligenceResultProjection.ts`

功能边界：

- 文件发现、target 扫描、语言统计、Alembic 生成物排除：进 Core。
- AST 分析、SFC 预处理、call graph 分析：进 Core。
- Code Entity Graph / dependency edges / module entities 写入：进 Core，但仓储和 DB 也必须一起迁。
- Guard audit 和 Enhancement Pack 维度扩展：进 Core。
- Panorama materialization 如果依赖 Core knowledge graph 和 deterministic service，可以进 Core；Dashboard 展示留外层。
- 增量 diff、snapshot 保存、path reconciliation、受影响维度推断：进 Core。

混入点：

- `ProjectIntelligencePreparation.ts` 的 `clearOldData` 当前动态导入 `InternalDimensionExecutionPipeline`，这是 internal agent 关联清理入口，不能作为 Core 依赖保留。Core 应提供自己的 `ProjectAnalysisStateCleaner` 或调用 `CleanupService` / checkpoint / snapshot store。
- `FileDiffPlanner.ts` 直接依赖 `#agent/memory/SessionStore.js`。Core 不能引入 agent memory。迁移时要把 `restoredEpisodic` 改为 Core session snapshot interface，或者把 JSON 恢复交给外层 adapter。

必须覆盖的边界情况：

- 扫描文件达到 `maxFiles` 上限时必须返回 warning。
- 无文件项目要走 empty fast path。
- AST grammar 可用性检查失败只能降级，不能阻断分析。当前实现已经是随包发布 WASM grammar，不是运行时 npm 安装。
- call graph 超时或 partial result 必须保留 warning。
- snapshot path 从旧格式重映射到当前路径时要处理 ambiguous remap。
- 文件变更超过阈值要回退全量。
- 无变更时允许所有维度使用历史结果。
- 新增文件要按扩展名推断影响维度。

### 2.3 rescan planning 是 Core 核心

已读文件：

- `KnowledgeRescanPlanner.ts`
- `KnowledgeRescanPlanBuilder.ts`
- `RescanEvidenceProjectors.ts`
- `RecipeAuditEvidence.ts`
- `EvolutionPrescreen.ts`

功能边界：

- Recipe audit、coverage classification、decay verdict：进 Core。
- SourceRef 健康度、RecipeImpactPlanner 候选、lifecycle fallback 三层判定：进 Core。
- target recipes per dimension、coverage gap、verify-only / produce / skip 决策：进 Core。
- external evidence plan、internal gap plan 的纯数据投影：进 Core。
- 具体 MCP 返回文案和工具名留外层。

必须一起迁的依赖：

- `domain/dimension/RecipeDimension`
- `domain/evolution/EvolutionPolicy`
- `service/cleanup/CleanupService` 中的 `RecipeSnapshotEntry`
- `repository/sourceref/RecipeSourceRefRepository`
- Recipe lifecycle 常量

边界情况：

- 无 Recipe 时 audit 必须返回 empty summary。
- SourceRef 表不可用时要降级为 lifecycle fallback。
- 文件路径要同时支持 `path`、`relativePath`、`name` 和绝对路径相对化。
- requestedDimensions 只过滤执行范围，不应污染全局 dimension 定义。
- `dead` Recipe 不进入 external evidence plan。

### 2.4 external session / submission tracker 是 Core 核心，但要替换 agent memory

已读文件：

- `BootstrapSession.ts`
- `ExternalSubmissionTracker.ts`
- `ExternalDimensionCompletionWorkflow.ts`
- `ExternalMissionWorkflow.ts`
- `MissionBriefingBuilder.ts`
- `MissionBriefingSupport.ts`
- `EvidenceStarterBuilder.ts`
- `SessionSupport.ts`

应进入 Core 的能力：

- `ExternalSubmissionTracker` 的提交记录、负空间信号、质量评分、跨维度证据累积。
- session id、TTL、完成维度、progress、cross-dimension hints、snapshot cache。
- mission briefing 构建中的证据包、维度任务、预算、response compression。
- dimension completion 的 input normalization、session lookup、dimension validation。
- submittedRecipeIds / referencedFiles 自动恢复。
- submitted recipes 绑定 dimensionId 和 `bootstrap:<sessionId>` tag。
- checkpoint 保存。
- key findings 写入 knowledge graph。
- evidence hints / quality feedback / subpackage coverage warning。

不能按原文件整搬的点：

- `BootstrapSession.ts` 使用 `#agent/memory/SessionStore.js`。Core 需要自己的 `MiningSessionStore`，或者一个最小 `SessionReportStoreLike`，不能依赖 Alembic internal agent memory。
- `ExternalDimensionCompletionWorkflow.ts` 调 `WorkflowSkillCompletionCapability.generateSkill`。Skill 生成是外层 delivery/skills 行为，不进 Core。
- `ExternalDimensionCompletionWorkflow.ts` 创建 `BootstrapEventEmitter`。事件 transport 是外层，Core 只返回 progress event payload。
- `ExternalDimensionCompletionWorkflow.ts` 在 complete 后运行 `runWorkflowCompletionFinalizer`。当前 finalizer 会跑 Cursor Delivery、Wiki、Panorama、Semantic Memory，不能进 Core。
- `MissionBriefingSupport.ts` 含 `BOOTSTRAP_COMPLETE_ACTIONS`，其中有 `alembic_cursor_delivery`、`alembic_wiki_plan`。这些是外层工具建议，不能放在 Core。
- `MissionBriefingSupport.ts` 文案含 `knowledge({ action: "submit" })`、`alembic_dimension_complete` 等工具名。Core 可以保留抽象 submission schema，但工具调用文案应由外层 adapter 注入。
- `MissionBriefingBuilder.ts` 在 Alembic 当前源里引用 `getCursorDeliverySpec()`。Cursor delivery 字段不应作为 Core briefing 的硬依赖；Core 应使用通用 `KnowledgeFieldSpec`，Cursor 字段由外层补充。

边界情况：

- `dimensionId` 缺失、`analysisText` 过短、`submittedRecipeIds` 非数组要返回 validation failure。
- session 不存在或 sessionId 不匹配要返回 `SESSION_NOT_FOUND`。
- completion 时需要延长 TTL，防止长链路中会话过早过期。
- dimension 不在 session dimensions 中要列出合法维度。
- `submittedRecipeIds` 为空时可从 tracker 恢复。
- `referencedFiles` 为空时可从 submissions 的 `reasoning.sources` 恢复。
- 重复完成同一维度时 `updated=true`，不能重复污染进度。
- 质量评分低于阈值只反馈，不应阻止状态保存。
- local packages 未覆盖时返回 warning。

### 2.5 persistence/checkpoint/report 需要拆分

已读文件：

- `DimensionCheckpoint.ts`
- `WorkflowResultPersistence.ts`
- `WorkflowReportTypes.ts`
- `WorkflowReportWriter.ts`
- `WorkflowReportHistoryStore.ts`
- `WorkflowSnapshotStore.ts`

应进入 Core：

- checkpoint 文件存取、TTL、坏 JSON 跳过、clear 安全保护。
- workflow report / history / artifact manifest 的通用结构。
- snapshot save 的 DB 写入逻辑。
- dimension stats 汇总、token/tool 统计的纯聚合函数。

不能按原文件整搬：

- `DimensionCheckpoint.ts` 后半部分依赖 `SessionStore`、`DimensionContext`、`BootstrapEventEmitter`、internal-agent `CandidateResults`。这些恢复 helper 留外层，Core 只保留 checkpoint store 和通用恢复数据结构。
- `WorkflowSnapshotStore.ts` 类型依赖 `SessionStore`。Core 应改为 `SessionStoreSnapshotLike`。
- `WorkflowReportTypes.ts` 直接 import `SessionStore` 和 internal-agent `DimensionStat` / `CandidateResults` / `SkillResults`。Core 需要定义宿主无关 report DTO。
- `WorkflowReportWriter.ts` 汇总 `stageToolsets`、terminal usage、tool calls，适合外层报告扩展。Core 只保留通用 report writer hook 或基础 report。
- `WorkflowResultPersistence.ts` 清理 checkpoint 是 Core 可以做的，但 log 文案中的 Skills / Semantic Memory / tool calls 是外层含义。

边界情况：

- checkpoint 保存失败必须降级，不阻断 dimension complete。
- checkpoint 清理需通过 PathGuard 或 WriteZone，不能裸删任意目录。
- report 写入要支持 WriteZone 和普通 `.asd` 两种路径。
- code entity graph topology 附加失败不能阻断报告。

### 2.6 KnowledgeService / Recipe gateway / SourceRef 是 Core 核心，但要切掉 delivery 回调

已读文件：

- `KnowledgeService.ts`
- `RecipeProductionGateway.ts`
- `SourceRefReconciler.ts`
- `KnowledgeFileWriter.ts`
- `KnowledgeRepository.impl.ts`
- `RecipeSourceRefRepository.ts`
- `DatabaseConnection.ts`
- `CleanupService.ts`

应进入 Core：

- KnowledgeEntry CRUD、lifecycle、file-first persistence、audit hook、graph relation sync。
- RecipeProductionGateway 的 schema validation、相似度、batch dedup、consolidation、quality scoring、supersede proposal。
- SourceRefReconciler 的 reconcile、TTL、stale/renamed/active 状态、git rename 检测、路径重写。
- KnowledgeFileWriter 的 markdown/frontmatter 序列化、parse、bucket 路径、PathGuard/WriteZone 写入。
- Repository 和 SQLite/Drizzle schema/migrations。
- CleanupService 的 fullReset、rescanClean、forceRescanClean、snapshotRecipes、trash-bin 策略。

不能保留的耦合：

- `KnowledgeService.publish()` 后 `_triggerCursorDeliveryAsync()` 动态加载外层 `ServiceContainer` 和 `cursorDeliveryPipeline`。Core 不能触发 Cursor Delivery。迁移后应改为可注入 `onKnowledgePublished` hook，由外层注册 delivery。
- `KnowledgeService` 中 `SkillHooks` 可以作为可选 hook interface 进入 Core，但不能绑定具体 Skill 生成。
- `SourceRefReconciler` 使用 `git log` 是 deterministic local operation，可以进 Core；但必须保持 `execFile`，不能变成 shell 拼接。
- `CleanupService` 清理 `skills/`、`wiki/` 是数据目录清理，不是交付渠道。但外层如果有插件独立交付目录，不应被 Core 清理。

边界情况：

- title 同名冲突必须保留。
- `UnifiedValidator` 失败不得入库。
- file-first 写入失败要明确是否阻断 DB 写入，当前 `KnowledgeService.create` 对 file writer 失败不会 throw，因为 `persist` 内部吞掉并返回 null。迁移应保持行为等价。
- sourceRef 表不可访问时 reconcile 应跳过。
- 24h 内已验证 SourceRef 默认跳过。
- git 不可用或不在 git 仓库时 rename repair 要降级。
- fullReset 应保留配置和 IDE 集成配置，使用垃圾桶而不是直接删除。

### 2.7 search / vector / indexing 是 Core，provider 和 AI enrichment 不进 Core

已读文件：

- `lib/infrastructure/vector/VectorStore.ts`
- `lib/infrastructure/vector/HnswVectorAdapter.ts`
- `lib/infrastructure/vector/JsonVectorAdapter.ts`
- `lib/infrastructure/vector/IndexingPipeline.ts`
- `lib/infrastructure/vector/BatchEmbedder.ts`
- `lib/service/vector/VectorService.ts`
- `lib/service/vector/SyncCoordinator.ts`
- `lib/service/vector/ContextualEnricher.ts`
- `lib/service/search/SearchEngine.ts`
- `lib/service/search/HybridRetriever.ts`
- `lib/service/search/SearchTypes.ts`
- `lib/injection/modules/VectorModule.ts`

应进入 Core：

- `VectorStore` 抽象，以及 HNSW、JSON fallback、quantization、binary persistence、WAL/async persistence、migration。
- `Chunker` / `ASTChunker` / `IndexingPipeline`，包括 scan、chunk、source hash、incremental upsert、empty-vector fallback。
- `BatchEmbedder` 的批处理、并发限制、batch-to-serial fallback、失败跳过逻辑。但它只应依赖 `EmbeddingProvider` interface。
- `VectorService` 的 build/update/query/maintenance、circuit breaker、semantic/hybrid fallback、CRUD sync 入口。
- `SyncCoordinator` 的 `knowledge:changed` / `knowledge:deleted` debounce、批量 upsert/remove、DB 与 vector 对账。
- `SearchEngine`、BM25/field weighted/multi-signal/coarse ranker、RRF hybrid retrieval、semantic confidence gate、cache。
- search repository adapter 和 DB projection，因为检索必须和 Core knowledge schema 同步。

不进入 Core 的部分：

- OpenAI/Gemini/Ollama/其他模型的具体 embedding provider 实现、API key、provider 配置。
- `ContextualEnricher` 当前会直接调用 `aiProvider.chat()`，这是 AI 增强实现。Core 只能保留 `ChunkEnricher` / `ContextualEnricherLike` interface 和可选注入点，具体实现留外层。
- cross-encoder reranker 的模型实现留外层；Core 只保留 `SearchCrossEncoder` interface 和跳过逻辑。
- `VectorModule.ts` 这种依赖 ServiceContainer、AI provider、配置中心的 DI 组装留外层。
- MCP search handler、HTTP route、CLI 命令、daemon 启动后的初始化时机留外层。

边界依据：

- 两个外层仓库的 `vector/search` 文件是同构公共实现，不是某个渠道特有能力。
- `KnowledgeService` 通过 EventBus 通知 vector sync，说明向量索引是 knowledge lifecycle 的一部分。
- `VectorService` 已经把 `EmbedProvider` 设计成 interface，并且没有 provider 时可以降级，不要求 Core 拥有 AI 能力。
- `SearchEngine` 的语义搜索是可选路径；没有 vector/provider 时仍能走 keyword / weighted 搜索，符合 Core 可独立运行的要求。

边界情况：

- 没有 embedding provider 时，Core 状态应标记 semantic/vector 不可用，但 keyword/weighted 搜索可用。
- embedding 调用失败时保留 circuit breaker 和 sparse-only fallback，不能阻断知识创建或搜索。
- batch embedding 不支持或部分失败时，要降级 serial 或跳过失败 chunk，不能整批崩溃。
- HNSW/binary index 损坏时允许从 JSON 或 DB 重建，并返回 warning。
- 向量索引目录必须继续走 WriteZone/PathGuard，不能裸写任意路径。
- `ContextualEnricher` 失败不能阻断 indexing；迁移后外层未注入 enricher 时应保持等价降级。

### 2.8 delivery 明确留外层

已读文件：

- `CursorDeliveryPipeline.ts`
- `AgentInstructionsGenerator.ts`
- `SkillsSyncer.ts`
- `DeliveryRepoAdapter.ts`

证据：

- Delivery 目录只存在于 Alembic 外层，不是 Alembic 与 AlembicPlugin 的同构公共内核。
- `CursorDeliveryPipeline` 写 `.cursor/rules`、`.cursor/skills`、AGENTS.md、CLAUDE.md、copilot instructions。
- `AgentInstructionsGenerator` 直接写 AGENTS.md / CLAUDE.md / `.github/copilot-instructions.md`，并内置 MCP tool 列表。
- `SkillsSyncer` 把 Alembic skills 转换为 Cursor skills。
- `DeliveryRepoAdapter` 是 CursorDeliveryPipeline 的 raw SQL call graph adapter。

判定：

- 不进入 Core。
- Core 只产生 queryable / verifiable / persistent knowledge。
- 外层决定是否投递到 Cursor、Codex、IDE、插件 channel 或其他渠道。

### 2.9 Codex plugin 边界明确留 Plugin

已读文件：

- `AlembicPlugin/lib/codex/Preflight.ts`
- `ToolPolicy.ts`
- `StatusService.ts`
- `KnowledgeState.ts`
- `ProjectRootResolver.ts`
- MCP handlers: `bootstrap-external.ts`、`dimension-complete-external.ts`、`rescan-external.ts`、`knowledge.ts`

判定：

- `alembic_codex_*` 工具名、tool tier、admin gate、projectRoot trust、init-on-demand、daemon status、job recovery、plugin channel 逻辑全部留 Plugin。
- Core 可以提供 workspace/status/repository 查询能力，但不应该知道 Codex 的 tool policy。
- `KnowledgeState.ts` 中对 DB 的只读查询可以后续改为调用 Core repository/status API，但文件本身仍属于 Plugin 状态 presenter。
- MCP envelope、rate limit、handler 参数 schema、tool metadata 留 Plugin。

边界情况：

- projectRoot fallback 必须 fail closed，需要显式 trusted root。
- internal bootstrap/rescan 需要 AI provider 的 gate 是 Plugin/Codex 策略，不进 Core。
- vector index 缺失是 non-blocking status，不应阻塞 Codex 工具可用性。

### 2.10 tool system 明确留外层

已读目录：

- `lib/tools/core/**`
- `lib/tools/v2/**`
- `lib/tools/adapters/**`
- `lib/tools/catalog/**`

判定：

- Tool catalog、contracts、router、handlers、terminal policy、terminal executor、output compressor、dashboard/mac/skill adapters 都属于 Alembic 自己的工具系统。
- 插件依赖 Codex host agent，不需要 Alembic tool system 进入 Core。
- 只有当某个 parser/cache 被 search 或 repository 作为确定性依赖直接使用，才可在对应服务阶段重新归档迁移。不能整体迁 `lib/tools/**`。

## 3. Core 最终能力边界

### 3.1 Core 应包含的闭环

Core 必须完成以下闭环：

```text
workspace resolve
  -> database / repository / file store
  -> project intelligence scan
  -> dimension / rescan plan
  -> evidence pack / mission briefing
  -> host agent submission contract
  -> validation / dedup / quality gate
  -> knowledge / recipe / sourceRef persistence
  -> checkpoint / report / snapshot
  -> next dimension evidence hints
```

其中 host agent 只负责“读代码、分析、调用外层提交入口”。Core 负责保证这件事可恢复、可验证、可持久化。

### 3.2 Core 不应包含的执行侧

Core 不包含：

- Alembic internal AgentRuntime。
- Alembic `lib/agent/**` memory / prompts / runtime / service。
- Alembic `lib/tools/**` tool system。
- Codex MCP server / preflight / tool policy / tool metadata。
- Cursor Delivery / AGENTS.md / Skills / Wiki / plugin channel delivery。
- CLI、Dashboard、HTTP、Socket.io、daemon supervisor、进程启动。
- AI Provider 和 API key 配置。

## 4. 混合文件拆分判定表

| 文件 | Core 判定 | 拆分要求 |
| --- | --- | --- |
| `ExternalColdStartWorkflow.ts` | 大部分进 Core | Core 保留计划、扫描、snapshot、session、briefing；MCP envelope/presenter 文案留外层 |
| `ExternalKnowledgeRescanWorkflow.ts` | 大部分进 Core | Core 保留清理、sync、audit、plan、evidence、session、briefing；tool 文案留外层 |
| `ProjectIntelligenceRunner.ts` | 进 Core | 保留 Core grammar resolver / WASM 可用性检查；只把网络下载、npm 安装或原生编译这类宿主副作用排除在 Core 外 |
| `ProjectIntelligencePreparation.ts` | 拆分 | PathGuard 进入 Core；`InternalDimensionExecutionPipeline` 清理依赖替换掉 |
| `FileDiffPlanner.ts` | 拆分 | diff/snapshot 进 Core；`SessionStore.fromJSON` 改 Core session snapshot interface |
| `FileDiffSnapshotStore.ts` | 进 Core | SQLite/Drizzle schema 必须一起迁 |
| `KnowledgeRescanPlanner.ts` | 进 Core | 需要带上 SourceRef repo、EvolutionPolicy、RecipeSnapshot 类型 |
| `MissionBriefingBuilder.ts` | 进 Core 但参数化 | 移除 Cursor delivery field spec 硬依赖；host tool names 由外层注入 |
| `MissionBriefingSupport.ts` | 拆分 | schema/budget/profile 进 Core；`BOOTSTRAP_COMPLETE_ACTIONS` 和具体工具名留外层 |
| `EvidenceStarterBuilder.ts` | 进 Core | 纯 evidence projection |
| `ExternalSubmissionTracker.ts` | 进 Core | 可完整复制，属于 host-agent 闭环质量门控 |
| `BootstrapSession.ts` | 拆分 | session/progress/hints/tracker 进 Core；`#agent/memory/SessionStore` 替换 |
| `ExternalDimensionCompletionWorkflow.ts` | 拆分 | validation/session/bind/checkpoint/evidence hints 进 Core；skill/event/finalizer/tool meta 留外层 |
| `DimensionCheckpoint.ts` | 拆分 | checkpoint store 进 Core；internal-agent restore helper 留外层 |
| `WorkflowSnapshotStore.ts` | 拆分 | snapshot save 进 Core；`SessionStore` 类型替换 |
| `WorkflowReportWriter.ts` | 拆分 | report/history 基础进 Core；terminal/tool/stageToolsets 可作为外层扩展 |
| `WorkflowCompletionFinalizer.ts` | 留外层 | 当前执行 Cursor Delivery/Wiki/Panorama/Semantic Memory |
| `CompletionSteps.ts` | 留外层 | 当前包含 delivery verifier、Wiki、agent memory consolidation |
| `KnowledgeService.ts` | 进 Core 但移除 delivery 回调 | `_triggerCursorDeliveryAsync` 改为外层 hook |
| `CleanupService.ts` | 进 Core | 注意不要清插件独立交付渠道 |
| `lib/infrastructure/vector/**` | 进 Core | 本地向量存储、HNSW、JSON fallback、indexing pipeline、batch embed orchestration |
| `VectorService.ts` | 进 Core | 保留 provider interface、circuit breaker、hybrid fallback、sync 入口 |
| `SyncCoordinator.ts` | 进 Core | EventBus 事件同步和 DB/vector 对账；依赖 Core EventBus/Repository |
| `ContextualEnricher.ts` | 留外层实现，Core 只留 interface | 当前调用 `aiProvider.chat()`，属于 AI 增强；可作为 `ChunkEnricherLike` 注入 |
| `SearchEngine.ts` | 进 Core | keyword/weighted/semantic gate/cache/ranking 保留；provider 和 reranker 只做接口 |
| `HybridRetriever.ts` | 进 Core | RRF 融合是确定性检索算法 |
| `VectorModule.ts` | 留外层 | DI 组装、AI provider、配置中心、初始化时机属于宿主 |
| `CursorDeliveryPipeline.ts` | 留外层 | delivery |
| `AgentInstructionsGenerator.ts` | 留外层 | AGENTS.md / CLAUDE.md 生成 |
| `SkillsSyncer.ts` | 留外层 | Cursor skills 投递 |
| `Codex Preflight/ToolPolicy/StatusService/KnowledgeState` | 留 Plugin | Plugin 可调用 Core status/repo API |
| `lib/tools/**` | 留外层 | Alembic tool system |

## 5. 对原迁移手册的修正

原手册的大方向正确，但需要补充三个硬判定：

1. 阶段 6 迁移 project intelligence 时，必须同时解决 `FileDiffPlanner -> SessionStore` 和 `ProjectIntelligencePreparation -> InternalDimensionExecutionPipeline` 这两个 agent 依赖，不能直接复制后让 Core 依赖 `lib/agent/**`。
2. 阶段 9 迁移 host-agent loop 时，`ExternalDimensionCompletionWorkflow` 不能整文件搬。Core 要拆出 `completeDimension()` 内核，外层 wrapper 负责 skill generation、event emitter、finalizer、tool meta、nextActions。
3. 阶段 8 迁移 KnowledgeService 时，必须切掉 `publish -> CursorDeliveryPipeline` 的隐式外层回调，改为可选 hook。否则 delivery 会被偷渡进 Core。
4. 阶段 7 迁移 search/vector 时，必须把 vector 内核完整迁入 Core，但 embedding/chat/cross-encoder provider 只保留 interface 和注入点。否则会把 AI 能力偷渡进 Core。

## 6. 推荐的 Core 内部落地结构

建议不要照搬原始目录名到 Core 顶层，而是保持可追溯但边界清晰：

```text
src/shared/**
src/domain/**
src/infrastructure/database/**
src/infrastructure/io/**
src/repository/**
src/service/knowledge/**
src/service/search/**
src/service/guard/**
src/service/cleanup/**
src/service/evolution/**
src/project-intelligence/**
src/workflows/mining/**
src/workflows/rescan/**
src/workflows/persistence/**
```

其中 `src/workflows/mining/**` 承载 host-agent loop：

```text
MiningSession.ts
MiningSessionStore.ts
SubmissionTracker.ts
MissionBriefingBuilder.ts
EvidenceStarterBuilder.ts
DimensionCompletionService.ts
MiningCheckpointStore.ts
MiningReportWriter.ts
HostAdapterContracts.ts
```

`HostAdapterContracts.ts` 只定义外层注入点：

- tool name / display text adapter
- progress event sink
- completion side effect hook
- skill generation hook
- developer identity provider
- service container resolver

这些都是 interface，不是实现。

## 7. 迁移验收标准

Core 阶段验收不能只看 `tsc`，还必须检查以下行为：

- cold start 能产生完整 mission briefing。
- rescan 能在保留 Recipe 后产生 audit、gap plan、evidence plan。
- dimension complete 能在无显式 `submittedRecipeIds` 时从 tracker 恢复。
- checkpoint 可保存、加载、过期、跳过坏 JSON。
- SourceRef 能 reconcile active/stale，git unavailable 时降级。
- KnowledgeService 创建、更新、lifecycle、file-first persistence 行为和外层一致。
- SearchEngine 在无 provider 时 keyword/weighted 可用；有 provider 时 semantic/hybrid 可用；provider 失败时能降级。
- VectorService 能 build/update/query/clear/reconcile；HNSW/JSON/binary persistence 行为和外层一致。
- publish 不再直接触发 Cursor Delivery，但外层 hook 可以恢复原行为。
- Core build 中不能出现对 `#agent/`、`#tools/`、`#external/mcp`、`#service/delivery`、`#repo/delivery` 的 import。

建议增加一个 import 边界测试：

```text
Core source must not import:
  #agent/**
  #tools/**
  #external/mcp/**
  #service/delivery/**
  #repository/delivery/**
  codex-specific runtime files
```

## 8. 下一步执行建议

不要马上迁阶段 6 或阶段 9。先按以下顺序重新开始：

1. 阶段 0：Core 包卫生和测试框架。
2. 阶段 1：shared 基础工具。
3. 阶段 2：workspace/path/config/WriteZone。
4. 阶段 3：domain。
5. 阶段 4：SQLite/repository/migrations。

到阶段 4 后，Core 才具备承载 project intelligence 和 host-agent mining loop 的基础。否则会再次出现薄文件、假接口或无法运行的 Core。
