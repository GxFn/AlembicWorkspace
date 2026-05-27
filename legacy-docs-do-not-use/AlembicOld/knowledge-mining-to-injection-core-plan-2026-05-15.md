# 知识挖掘到知识注入核心链路实现方案

> 日期：2026-05-15  
> 范围：基于当前 Alembic 仓库真实代码，不以 `mainline` 方案为前提。  
> 目标：在删除旁支冗余后，重新收束 Alembic 的主能力：从项目事实挖掘、Recipe 生产、知识存储、索引检索，到 Codex/IDE Agent 的上下文注入，形成一条稳定、可验证、可演进的核心链路。

## 结论

当前 Alembic 的核心链路已经存在，但分散在 workflow、knowledge、search、vector、MCP 和 agent runtime 多处。下一阶段不应重建大框架，而应把这些能力收束成一条明确的主线：

```text
项目目录解析
  -> 项目事实挖掘
  -> 维度化证据组织
  -> Recipe 生产与准入
  -> 文件优先持久化 + DB 索引
  -> SourceRef / Graph / Search / Vector 物化
  -> 任务意图检索
  -> Context Bundle 组装
  -> MCP / Codex / IDE 注入
  -> 使用反馈与重扫刷新
```

现有代码中最接近主线的入口是：

- 项目初始化：`bin/codex-mcp.ts`、`bin/daemon-server.ts`、`lib/external/mcp/CodexMcpServer.ts`
- 项目事实挖掘：`lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
- 冷启动与重扫：`lib/workflows/cold-start/*`、`lib/workflows/knowledge-rescan/*`
- 知识准入：`lib/service/knowledge/RecipeProductionGateway.ts`
- 知识实体与持久化：`lib/service/knowledge/KnowledgeService.ts`、`lib/service/knowledge/KnowledgeFileWriter.ts`
- 图谱与来源：`lib/service/knowledge/KnowledgeGraphService.ts`、`lib/service/knowledge/SourceRefReconciler.ts`
- 检索：`lib/service/search/SearchEngine.ts`、`lib/service/task/PrimeSearchPipeline.ts`
- 注入出口：`lib/external/mcp/handlers/task.ts`、`lib/external/mcp/handlers/search.ts`、`lib/external/mcp/handlers/structure.ts`

下一阶段最关键的设计目标是：让“知识注入”不再只是 `alembic_task prime` 返回几条搜索结果，而是返回一个可解释、可追踪、可压缩的上下文包。这个上下文包应该能说明：

- 为什么选择这些 Recipe。
- 它们来自哪些源码证据。
- 相关代码实体、模块、调用链是什么。
- 其中哪些知识新鲜、哪些可能过期。
- Agent 应该怎么把这些知识用于当前任务。

## 当前核心链路

### 1. 项目目录与运行时基座

Codex 插件入口走 `bin/codex-mcp.ts`，真实工具调用由 `CodexMcpServer` 接管。`CodexMcpServer` 当前已经有关键护栏：

- `resolveCodexProjectRoot()` 解析项目目录。
- 不可信或无法解析项目目录时，非发现类工具直接返回 `CODEX_PROJECT_ROOT_UNRESOLVED` 或 `CODEX_PROJECT_ROOT_REJECTED`。
- `alembic_codex_init` 显式初始化；其他需要初始化的工具可走 on-demand 初始化。
- daemon 由 `DaemonSupervisor` 启动，HTTP bridge 再转发到真实 MCP handler。

daemon 入口 `bin/daemon-server.ts` 会：

- 读取 `ALEMBIC_PROJECT_DIR` 或当前目录作为项目根。
- 配置 `PathGuard`。
- 调用 `Bootstrap.initialize()`。
- 初始化 `ServiceContainer`。
- 启动 HTTP server。
- 注册 `GitDiffCheckpointService`，保留按需 diff 刷新的能力。

这个阶段是所有后续能力的地基。没有可信项目目录时，不能进入知识挖掘或注入链路。

### 2. 项目事实挖掘

项目事实挖掘主线集中在 `ProjectIntelligenceCapability.run()`，底层调用 `ProjectIntelligenceRunner.runAllPhases()`。

当前阶段划分如下：

| 阶段 | 当前实现 | 产物 |
| --- | --- | --- |
| Phase 1 | `runPhase1_FileCollection()` | 文件列表、target、语言统计、discoverer |
| Phase 1.5 | `runPhase1_5_AstAnalysis()` | AST 摘要、类/协议/模式、可选 astContext |
| Phase 1.6 | `runPhase1_6_EntityGraph()` | code_entities、inherits/conforms/extends/uses_pattern 边 |
| Phase 1.7 | `runPhase1_7_CallGraph()` | calls/data_flow 边 |
| Phase 2 | `runPhase2_DependencyGraph()` | module depends_on 边 |
| Phase 2.1 | `runPhase2_1_ModuleEntities()` | module 实体 |
| Phase 2.2 | `materializeProjectPanorama()` | 项目全景聚合 |
| Phase 3 | `runPhase3_GuardAudit()` | Guard audit 与 violations |
| Phase 4 | `runPhase4_DimensionResolve()` | active dimensions、Enhancement Pack、语言画像 |

这一层输出的是“项目事实”，还不是最终知识。它的职责应该保持清晰：

- 只负责收集、压缩、物化项目事实。
- 不负责决定哪些内容成为 Recipe。
- 不直接做最终注入。
- 对大项目必须保留 truncation warning。
- AST、调用图、Panorama、Guard 任一失败时应降级，不阻断基础文件与维度分析。

### 3. 维度化证据组织

冷启动与重扫都复用项目事实挖掘，但生产路径分为外部 Agent 和内部 Agent。

外部 Agent 路径：

- `ExternalColdStartWorkflow`：全量清理后运行项目事实挖掘，生成 Mission Briefing。
- `ExternalKnowledgeRescanWorkflow`：保留已有 Recipe，清理衍生缓存，同步文件与 DB，再生成重扫 Mission Briefing。
- `MissionBriefingBuilder`：压缩 AST、依赖图、Guard findings、维度任务、提交 schema、执行计划。
- 外部 Agent 阅读代码后调用 `alembic_submit_knowledge` 和 `alembic_dimension_complete`。

内部 Agent 路径：

- `InternalColdStartWorkflow`：清理、挖掘、构建 snapshot，然后异步按维度执行。
- `InternalKnowledgeRescanWorkflow`：同步已有 Recipe、SourceRef 检查、diff 影响规划、gap 分析，然后异步补齐。
- `InternalDimensionExecutionPipeline`：初始化 runtime，驱动 `AgentService` 分维度分析。
- `BootstrapConsumers`：消费分析结果、记录维度报告、保存 checkpoint、生成 skill、写入候选关系。

这个阶段的核心设计应是“证据先行，维度只是组织方式”。维度可以指导分析，但最终入库的 Recipe 必须能回到源码证据、调用链、模块和使用场景。

### 4. Recipe 生产与准入

统一入口是 `RecipeProductionGateway.create()`。当前管线已经很接近主线：

1. `UnifiedValidator` 做 schema 校验。
2. bootstrap 会话内去重。
3. `SimilarityService.findSimilarRecipes()` 做相似度检测。
4. `ConsolidationAdvisor` 做融合、重组、语义复核建议。
5. `KnowledgeService.create()` 创建知识实体。
6. `KnowledgeService.updateQuality()` 做质量评分。
7. 必要时通过 `EvolutionGateway` 创建 supersede/update/deprecate 提案。

这个管线应该成为所有生产入口的唯一入口，包括：

- 外部 Agent 的 `alembic_submit_knowledge`。
- 内部 Agent 的 producer tool。
- IDE 插件的批量提交。
- 未来自动化挖掘任务。

不应再保留多个候选创建旁路。任何旁路都会让校验、去重、SourceRef、质量评分和索引同步不一致。

### 5. 文件优先持久化与 DB 索引

`KnowledgeService` 当前是领域编排中心：

- `KnowledgeEntry.fromJSON()` 构造实体。
- `ConfidenceRouter` 将高置信条目送入 staging。
- `KnowledgeFileWriter.persist()` 先落盘 Markdown。
- `KnowledgeRepository.create()` 再写入 `knowledge_entries`。
- `_syncRelationsToGraph()` 同步 relations 到 `knowledge_edges`。
- EventBus 发出 `knowledge:changed`，触发向量同步。

`KnowledgeFileWriter` 当前明确使用“文件 = 真相源，DB = 索引缓存”的模型。这个模型应该保留，并成为计划里的硬约束：

- Recipe Markdown 是人类可读、可审查、可恢复的主数据。
- SQLite 用于查询、索引、图谱、状态和统计。
- 文件写入失败不能假装 DB 成功。
- 生命周期切换必须移动或重写对应 Markdown。
- 删除只能删除 Alembic 知识目录内的 Markdown，不能碰项目源文件。

### 6. SourceRef、图谱与索引物化

当前物化层有三条线：

1. SourceRef：`SourceRefReconciler`
   - 从 `knowledge_entries.reasoning.sources` 填充 `recipe_source_refs`。
   - 检查 active/stale。
   - 使用 git rename 尝试修复路径。
   - 写回 Recipe Markdown 和 DB reasoning。

2. 图谱：`KnowledgeGraphService` + `CodeEntityGraph`
   - `knowledge_edges` 表承载 Recipe、module、class、method、pattern 等关系。
   - 支持 query、impact、path、stats。
   - 调用图通过 `calls` 和 `data_flow` 边进入统一边表。

3. 检索索引：`SearchEngine` + `VectorService`
   - `SearchEngine` 构建 FieldWeighted/BM25 风格稀疏索引。
   - `VectorService` 管理 embedding、HNSW/JSON 向量、RRF hybrid search。
   - `SyncCoordinator` 监听 `knowledge:changed` 做向量增量同步。
   - `_supplementDetails()` 会补充 `sourceRefs`，让搜索结果带证据路径。

这一层当前缺的是统一的“上下文物化契约”。Search 返回的是条目，Graph 返回的是边，SourceRef 返回的是路径状态，三者尚未组合成 Agent 可直接消费的上下文包。

### 7. 检索与注入

当前注入主入口是 `alembic_task prime`：

- `IntentExtractor.extract()` 从用户 query、active file、language 中提取意图。
- `PrimeSearchPipeline.search()` 多 query 并行搜索。
- `SearchEngine.search()` 用 auto / semantic / keyword 模式召回。
- `slimSearchResult()` 投影为 Agent 友好的字段。
- `taskHandler._prime()` 把 relatedKnowledge 和 guardRules 放进 response message。

当前不足：

- 只注入 top Recipe 和 rule，没有真正的上下文包。
- sourceRefs 只是路径字符串，没有 freshness、line、confidence、引用理由。
- 图谱扩展没有参与 `prime`。
- call context 没有参与 `prime`。
- guard findings 与任务意图没有统一进入注入包。
- 没有明确 token budget 与压缩策略。

所以下一阶段的关键不是增加更多搜索工具，而是新增一条 `KnowledgeInjectionPipeline`，把现有 Search、Graph、SourceRef、Guard、Structure 统一编排起来。

## 目标链路设计

### 核心对象

建议在现有类型之外新增一组轻量领域对象，先服务注入链路，不替换 `KnowledgeEntry`。

```ts
interface KnowledgeEvidenceRef {
  kind: 'source_ref' | 'graph_edge' | 'call_edge' | 'guard_finding' | 'search_hit';
  targetId: string;
  path?: string;
  line?: number;
  status?: 'active' | 'renamed' | 'stale' | 'unknown';
  confidence?: number;
  reason: string;
}

interface KnowledgeContextItem {
  id: string;
  title: string;
  kind: string;
  knowledgeType?: string;
  score: number;
  actionHint?: string;
  evidence: KnowledgeEvidenceRef[];
  freshness: 'fresh' | 'stale' | 'unknown';
}

interface KnowledgeContextBundle {
  query: string;
  scenario: string;
  language?: string | null;
  activeFile?: string;
  items: KnowledgeContextItem[];
  guardRules: KnowledgeContextItem[];
  graphHints: Array<Record<string, unknown>>;
  callContext?: Record<string, unknown> | null;
  warnings: string[];
  injectionMarkdown: string;
}
```

这些对象的原则：

- 只作为注入投影，不作为新的主存储模型。
- 所有 evidence 都能追溯到现有 DB、文件或图谱。
- `injectionMarkdown` 是给 Agent 的最终文本，JSON 字段用于工具调用方精读。
- stale 信息必须显式暴露，不能静默混入。

### 新增核心服务

建议新增 `lib/service/injection/KnowledgeInjectionPipeline.ts`，职责如下：

```text
Intent
  -> Search candidates
  -> SourceRef enrichment
  -> Graph expansion
  -> Guard selection
  -> Active file / call context enrichment
  -> Budgeted ranking
  -> Markdown + JSON bundle
```

它只依赖现有服务：

- `searchEngine`
- `knowledgeGraphService`
- `recipeSourceRefRepository`
- `knowledgeRepository`
- `codeEntityGraph`
- `guardService` 或 `guardCheckEngine`

短期不需要改 DB schema。先把“注入组装逻辑”从 `PrimeSearchPipeline` 和 `taskHandler._prime()` 中剥离出来。

## 分阶段实现计划

### 阶段 0：基线收束

目标：确认当前删减后的主链路可运行，并冻结核心边界。

实现任务：

1. 保留 `CodexMcpServer` 的项目目录强校验，不可信 projectRoot 直接提示用户或 Agent 提供绝对路径。
2. 保留 daemon + job store 的 recoverable job 机制。
3. 明确冷启动使用 `bootstrap`，刷新使用 `rescan`，日常任务使用 `prime`。
4. 不恢复 Dashboard AI Chat、Wiki 产品面、ReverseGuard、文件 watcher。
5. 将 `alembic_task` 的规则提醒从“强制任务系统”逐步降级为“可选任务状态”，避免干扰知识注入主线。

验收：

- `alembic_codex_status` 能准确显示初始化、knowledge、sourceRefs、snapshots、vector 状态。
- 未初始化时工具链能先初始化或明确提示。
- 没有项目目录时不会错误写入 Alembic 自身仓库或当前进程目录。

### 阶段 1：知识挖掘入口标准化

目标：把冷启动、重扫、按需分析都统一到 `ProjectIntelligenceCapability` 的产物模型。

实现任务：

1. 明确 `ProjectIntelligenceCapability.run()` 是唯一项目事实挖掘入口。
2. 整理 `ProjectSnapshot` 字段，把 allFiles、AST、entity graph、call graph、dep graph、Guard、Panorama 的可用性和失败原因明确记录。
3. 对 `runAllPhases()` 输出增加稳定的 `capabilities` 标记，例如：
   - `fileCollection: ready/truncated/failed`
   - `ast: ready/degraded/skipped`
   - `graph: ready/degraded`
   - `guard: ready/skipped/failed`
4. 对大项目 truncation 结果进入 Mission Briefing 和后续注入 warnings。

验收：

- 冷启动和重扫拿到同构 ProjectSnapshot。
- 外部和内部 Agent 不再各自拼装不同形状的项目事实。
- 任一非关键分析失败时，最终响应仍可解释失败边界。

### 阶段 2：证据到 Recipe 的准入统一

目标：所有 Recipe 创建都走 `RecipeProductionGateway`，并强化来源证据。

实现任务：

1. 检查内部 Agent producer tool 是否完全经由 `alembic_submit_knowledge` 或等价 Gateway 路径。
2. 在 `RecipeProductionGateway.#prepareCreateData()` 中明确 `sourceRefs` 与 `reasoning.sources` 的关系。
3. 提交时要求：
   - `reasoning.sources` 使用完整相对路径。
   - 有行号时保留行号，但 SourceRef 校验时能剥离行号解析路径。
   - `dimensionId`、`knowledgeType`、`trigger`、`whenClause`、`doClause`、`dontClause` 均进入统一校验。
4. 将 Gateway 结果中的 rejected、duplicates、blocked、pendingSemanticReview 做标准错误码，方便外部 Agent 重试。

验收：

- 外部 Agent、内部 Agent、批量导入同一条不完整 Recipe 时得到一致拒绝。
- 成功创建的 Recipe 同时有 Markdown、DB row、质量评分、事件通知。
- `reasoning.sources` 能被 SourceRefReconciler 消费。

### 阶段 3：来源证据与图谱健康物化

目标：让每条可注入知识都能解释“证据在哪、是否新鲜、相关节点是什么”。

实现任务：

1. 强化 `SourceRefReconciler`：
   - 支持 `path:line` / `path:start-end` 解析。
   - 保留原始 locator，校验时使用纯路径。
   - stale、renamed、active 状态进入搜索投影。
2. 在 `SearchEngine._supplementDetails()` 中不只返回 `sourceRefs: string[]`，而是内部可获得结构化 source ref，再由 slim 投影压缩。
3. 扩展 `KnowledgeGraphService.getEdges()` 的上层投影，补充节点标题、Recipe lifecycle、sourceRef freshness。
4. 让 `CodeEntityGraph` 的 call context 能按 activeFile 或 symbol name 参与注入。

验收：

- 搜索结果能明确标出 active/stale source refs。
- 图谱路径结果不再只是 id 边，而能给 Agent 解释路径含义。
- stale Recipe 不会被静默当作高可信知识注入。

### 阶段 4：检索与上下文包组装

目标：新增 `KnowledgeInjectionPipeline`，把 Search、Graph、SourceRef、Guard、CallContext 组合成统一上下文包。

实现任务：

1. 新建 `lib/service/injection/KnowledgeInjectionPipeline.ts`。
2. 输入沿用 `ExtractedIntent`，额外接收 activeFile、changedFiles、tokenBudget。
3. 首轮召回：
   - `SearchEngine.search(mode: auto)` 查 Recipe。
   - `SearchEngine.search(kind: rule)` 查 Guard rule。
   - activeFile 存在时查 sourceRef 与 call context。
4. 二次扩展：
   - 对 top Recipe 做 graph outgoing/incoming 一跳扩展。
   - 对 stale sourceRef 添加 warning。
   - 对 activeFile 关联的 code entity 补充 call context。
5. 排序：
   - search score 作为主分。
   - active sourceRef 加分。
   - stale 降权。
   - 与 activeFile、language、scenario 匹配加分。
   - guard rule 只保留最相关 3 条。
6. 输出：
   - `KnowledgeContextBundle` JSON。
   - `injectionMarkdown`，控制在 token budget 内。

验收：

- 同一 query 的注入结果稳定可测。
- 没有 vector provider 时仍可用稀疏搜索。
- 没有 graph/sourceRef 时仍返回基础 Recipe，并明确 degraded warning。
- 注入 markdown 不包含无来源的大段原文堆砌。

### 阶段 5：MCP 注入出口改造

目标：让 Codex/IDE Agent 调用一个稳定入口拿到上下文包。

实现任务：

1. 改造 `PrimeSearchPipeline`：
   - 逐步变成 `KnowledgeInjectionPipeline` 的薄编排适配器。
   - 保留 `PrimeSearchResult` 兼容字段。
   - 新增 `contextBundle` 字段。
2. 改造 `alembic_task prime`：
   - message 中输出简短注入摘要。
   - data 中返回完整 `contextBundle`。
   - 不再把 task rules 作为主要内容压过知识注入。
3. 改造 `alembic_search`：
   - 保持搜索工具职责，不强行变成注入工具。
   - 可增加 `includeEvidence` 参数，但默认保持瘦结果。
4. 保留 `alembic_structure`、`alembic_graph`、`alembic_call_context` 作为精读工具，供 Agent 在 bundle 不足时进一步查询。

验收：

- Agent 每次 prime 都能拿到可解释上下文包。
- 搜索、结构、图谱工具边界清晰，不互相吞并。
- 旧调用方只读 `relatedKnowledge` 仍能工作。

### 阶段 6：重扫刷新与反馈闭环

目标：让知识在代码变化后可按正确时机刷新，而不是依赖 watcher 实时推送。

实现任务：

1. 保留 `GitDiffCheckpointService`，作为重扫前的 diff 入口。
2. `rescan` 阶段使用 diff 结果：
   - 找 changedFiles。
   - 计算 affectedDimensions。
   - 通过 `RecipeImpactPlanner` 判断 Recipe 仍有效、需要更新或应该废弃。
3. `SourceRefReconciler` 在 rescan 中先运行，保证来源健康。
4. `alembic_task close` 或 IDE 保存/提交前可触发轻量 guard 和建议 rescan，而不是启动 watcher。
5. 使用 `HitRecorder` 或现有 stats 记录 searchHits、adoptions、guardHits，作为排序信号。

验收：

- 重扫不清空有效 Recipe。
- 变更文件关联的 Recipe 会进入候选影响分析。
- stale sourceRef、deleted file、renamed file 都能被报告。
- 反馈信号能影响后续注入排序，但不会自动改写 Recipe 正文。

## 推荐落地顺序

1. 先做阶段 0 和阶段 1，固定“项目目录、初始化、ProjectSnapshot”这三个地基。
2. 再做阶段 4 的 `KnowledgeInjectionPipeline` 骨架，但只接 Search + SourceRef，不接复杂图谱。
3. 然后改造 `PrimeSearchPipeline` 和 `alembic_task prime`，让 Agent 先用上 `contextBundle`。
4. 再补阶段 3 的结构化 SourceRef 和 graph enrichment。
5. 最后做阶段 6 的 diff 驱动重扫刷新和反馈排序。

这样可以保证每一步都有可用收益，不需要一次性重构全仓库。

## 核心边界

### 必须保留

- 项目目录可信解析与 PathGuard。
- 文件优先的 Recipe Markdown 持久化。
- `RecipeProductionGateway` 统一准入。
- `ProjectIntelligenceCapability` 统一挖掘入口。
- `SearchEngine` 稀疏搜索兜底。
- `SourceRefReconciler` 的来源健康检查。
- `knowledge_edges` 的轻量图谱能力。
- `GitDiffCheckpointService` 的按需 diff 能力。

### 不进入当前主线

- Dashboard AI Chat。
- Wiki 生成产品面。
- 文件 watcher 实时系统。
- ReverseGuard。
- SignalCollector / Skill 推荐系统。
- 独立浏览器或截图产品能力。
- 以 `mainline` 为前提的大规模目录迁移。

### 可后置

- CrossEncoder 重排。
- ContextualEnricher 全量启用。
- HNSW 高级调优。
- 图社区摘要。
- 外部 GitHub/文档源统一证据库。
- 多 IDE 的独立适配层。

## 测试策略

需要补齐的关键测试：

1. `KnowledgeInjectionPipeline` 单测：
   - 无知识。
   - 有 Recipe 无 SourceRef。
   - 有 active SourceRef。
   - 有 stale SourceRef。
   - 有 graph 一跳关系。
   - 无 vector provider。

2. `alembic_task prime` 集成测试：
   - 返回兼容的 `relatedKnowledge`。
   - 返回新的 `contextBundle`。
   - 注入 markdown 不超过预算。

3. `SourceRefReconciler` 单测：
   - `path:line` 解析。
   - rename 修复。
   - stale 状态进入搜索投影。

4. `rescan` 集成测试：
   - git diff 影响维度。
   - RecipeImpactPlanner 候选。
   - SourceRef 先同步再 gap analysis。

5. Codex 插件测试：
   - 未初始化自动初始化。
   - 无 projectRoot 直接提示。
   - bootstrap job 可恢复。
   - prime 能在 knowledge ready 后返回 context bundle。

## 最终目标形态

最终 Alembic 面向 Agent 的核心体验应该是：

1. Agent 进入项目时，Alembic 能确认项目目录和初始化状态。
2. 用户或 Agent 触发 bootstrap/rescan 后，Alembic 产出可信 Recipe、SourceRef、图谱和检索索引。
3. 每次任务开始，Agent 调用 prime，得到一个小而准的上下文包。
4. 上下文包包含 Recipe、Guard、来源证据、图谱关系、过期警告和下一步精读建议。
5. 任务完成后，diff 与使用反馈进入重扫刷新链路，让知识持续保持新鲜。

一句话：Alembic 的主线不是“存很多知识”，而是“在正确任务时，把有证据、未过期、能指导行动的知识注入给 Agent”。
