# 新主线替代范围与旧文件退场地图

更新时间：2026-05-09

## 1. 结论

新主线目前不是替代整个仓库，而是替代 Alembic 的核心热路径：

1. 编译期：源码扫描、结构事实、依赖关系、Recipe Markdown、SourceRef、SearchIndex、增量指纹。
2. 运行期：Codex prime、知识召回、Recipe 关系扩展、上下文压缩与注入。
3. Recipe 核心模型：统一 Recipe 实体、交付字段、SourceRef、相似度、提交准入。
4. 进化衰退判断：文件变更影响、Recipe 证据链接、反向健康检查、衰退信号。

没有被替代的层：

1. `agent/`、`tools/`、`workflows/`、`external/mcp/` 仍然是新主线入口、Agent 执行和工具编排层。
2. `http/`、`dashboard/`、`plugins/`、`resources/` 是产品外壳和分发形态，不能按旧核心能力剪掉。
3. `service/guard/` 的 `GuardCheckEngine` 仍是 Guard 执行器；新主线只是提供 guard-rule Recipe 输入。
4. `external/ai/providers/` 仍是真实 Provider 适配器；`mainline/ai` 替代的是 AI 能力端口、模型注册和参数约束，不替代实际 provider。

因此，“不再需要”的判断要分三类：

- 已退出主线热路径：不再作为核心路径使用，但为了 fallback、dashboard、CLI 或旧测试暂时存在。
- 可进入剪枝池：生产路径没有明显入口，或已经被新主线同等能力覆盖。
- 不能剪：仍是新主线的入口、执行器、产品外壳或兼容桥。

## 2. 替代地图

### 2.1 底层能力

新主线位置：

- `lib/mainline/core/*`
- `lib/mainline/data/*`

替代的旧能力：

- `lib/shared/concurrency.ts`、`lib/shared/TimerRegistry.ts`、`lib/shared/test-mode.ts`、`lib/shared/markdown-utils.ts`、`lib/shared/diff-parser.ts`、`lib/shared/similarity.ts`、`lib/shared/token-utils.ts` 的一部分通用能力。
- `lib/infrastructure/io/WriteZone.ts` 的写入边界思想，在新主线中由 `MainlineWriteBoundary`、`MainlineAtomicFileStore`、`MainlineWorkspacePaths` 承接。
- `lib/infrastructure/database/*` 中旧 knowledge 表访问的部分能力，在新主线中由 `SqliteContextIndex` 直接承接 `mainline_*` 表。

当前状态：

- 新主线核心代码应优先使用 `lib/mainline/core` 和 `lib/mainline/data`。
- `shared/`、`infrastructure/` 仍被旧 workflows、HTTP、daemon、插件外壳广泛使用，不能整体删除。

退场建议：

- 不要继续往 `shared/` 增加新主线专用工具。
- 新主线需要的底层能力只放 `mainline/core` 或 `mainline/data`。
- 旧 shared 工具只有在最后外层迁移完成后再按引用逐个删除。

### 2.2 AST、语言解析、项目事实

新主线位置：

- `lib/mainline/code/*`
- `lib/mainline/graph/*`
- `lib/mainline/compile/ProjectIntelligenceRunner.ts`
- `lib/mainline/compile/ProjectIntelligenceMaterializer.ts`
- `lib/mainline/compile/ProjectPanoramaSummary.ts`

替代的旧能力：

- `lib/core/AstAnalyzer.ts`
- `lib/core/analysis/*`
- `lib/core/ast/ProjectGraph.ts`
- `lib/service/knowledge/CodeEntityGraph.ts`
- `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` 的主线事实生成职责。

代码证据：

- `StructuralMainlineAstParser` 注释明确说明不依赖旧 `AstAnalyzer/ProjectGraph`。
- `MainlineProjectIntelligenceRunner` 只负责扫描、读取、构建项目事实并物化到底座。
- `alembic_structure` 默认只读取 `mainline-project-intelligence` artifact；旧 discoverer 必须显式传 `source=legacy` 才会启用。

当前状态：

- 新主线已经能产出文件、符号、导入、调用、依赖边、项目全景摘要。
- 旧 `runProjectIntelligence()` 仍在 cold-start/rescan 中运行，用来生成 Mission Briefing、ProjectSnapshot、旧 dashboard 展示所需字段。

不能直接删除的阻塞：

- `InternalColdStartWorkflow` 和 `ExternalColdStartWorkflow` 在 `runMainlineWorkflow()` 后仍调用旧 `runProjectIntelligence()`。
- rescan 内外部 workflow 也仍用旧 `phaseResults` 构造 `ProjectSnapshot`、dimension gap、briefing。
- `CodeEntityGraph` 仍被 internal-agent bootstrap runtime、旧 workflow report、旧 briefing 引用。

退场建议：

1. 用 `MainlineProjectIntelligenceArtifact` 替代 `ProjectSnapshot` 的数据来源。
2. 把 Mission Briefing 的 `astData/codeEntityResult/callGraphResult/depGraphData/targets` 改为从主线 artifact 投影。
3. 完成后再删除旧 `ProjectIntelligenceRunner`、`core/AstAnalyzer`、`core/analysis/*`、`CodeEntityGraph` 相关旧路径。

### 2.3 搜索与 Prime

新主线位置：

- `lib/mainline/search/*`
- `lib/mainline/runtime/*`
- `lib/mainline/agent/MainlinePrimeRunner.ts`
- `lib/external/mcp/handlers/task.ts`
- `lib/external/mcp/handlers/search.ts`
- `lib/tools/v2/handlers/knowledge.ts`

替代的旧能力：

- `lib/service/task/PrimeSearchPipeline.ts`
- `lib/service/search/*`
- `lib/infrastructure/vector/*`
- `lib/service/vector/*`

代码证据：

- `alembic_task prime` 已直接调用 `MainlinePrimeRunner`。
- MCP `search.ts` 默认只读新主线 SearchIndex / `RuntimeRetrievalPipeline`；旧 SearchEngine 必须显式传 `source=legacy` 或 `legacy=true`。
- `tools/v2/handlers/knowledge.ts` 的 search action 默认只读 `mainlineRuntime()`；旧 searchEngine 同样必须显式 legacy。
- `PrimeSearchPipeline` 已从 `AppModule` 和 `ServiceMap` 生产注册中移除，保留文件只服务旧测试与后续删除窗口。

当前状态：

- Codex prime 热路径已经由新主线接管。
- `alembic_search`、tools v2 `knowledge.search` 已关闭自动 fallback；无主线 SearchIndex 时返回 `mainline-unavailable`，不会悄悄走旧 SearchEngine。
- `service/search/*` 仍作为显式 legacy 搜索、CLI search、HTTP/dashboard 旧搜索、测试链路存在。
- `infrastructure/vector/*` 仍被 `VectorModule`、CLI `indexingPipeline`、旧 SearchEngine 使用。

可剪枝候选：

- `lib/service/task/PrimeSearchPipeline.ts`：主线 prime 已替代；生产注册已移除，保留价值只剩旧集成测试与删除前对照。
- `lib/service/search/CrossEncoderReranker.ts`：已删除。
- `lib/service/search/*`：不能整目录立即删，但应被标记为旧 fallback 包。
- `lib/infrastructure/vector/*`、`lib/service/vector/*`：不能立即删，因为 CLI、VectorModule、旧 SearchEngine 仍引用；但不应再进入新主线设计。

退场建议：

1. 已把 `AppModule` / `ServiceMap` 中 `primeSearchPipeline` 生产注册移除。
2. 已把 MCP search 与 tools v2 search fallback 改成显式 legacy mode。
3. dashboard/HTTP 搜索改读 mainline SearchIndex。
4. 最后删除旧 SearchEngine、vector indexing、PrimeSearchPipeline。

### 2.4 Recipe 模型与 Markdown 存储

新主线位置：

- `lib/mainline/knowledge/Recipe.ts`
- `lib/mainline/knowledge/RecipeKnowledgePayload.ts`
- `lib/mainline/knowledge/RecipeMarkdownCodec.ts`
- `lib/mainline/knowledge/RecipeMarkdownStore.ts`
- `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
- `lib/mainline/knowledge/RecipeSubmissionAdmission.ts`
- `lib/mainline/knowledge/RecipeSimilarityPolicy.ts`
- `lib/mainline/legacy/KnowledgeEntryRecipeCodec.ts`
- `lib/external/mcp/handlers/mainline-recipe-markdown.ts`

替代的旧能力：

- `lib/domain/knowledge/KnowledgeEntry.ts`
- `lib/domain/knowledge/UnifiedValidator.ts`
- `lib/domain/knowledge/FieldSpec.ts` 的一部分提交字段约束。
- `lib/service/knowledge/KnowledgeFileWriter.ts`
- `lib/cli/KnowledgeSyncService.ts`
- `lib/repository/knowledge/KnowledgeFileStore.ts` 的旧 Markdown 扫描/写入接口。

代码证据：

- `persistMainlineRecipeMarkdown()` 已把旧 `KnowledgeEntry` 映射为主线 `Recipe`，并同步 Markdown、SQLite、SourceRef、SearchIndex。
- `alembic_submit_knowledge` 和 tools v2 submit 都已经调用 `admitRecipeSubmission()` 做主线准入。
- `MainlineCompileSession` 每轮都会加载 Recipe Markdown 并写回主线 Markdown 索引。

当前状态：

- 新主线已经成为 Recipe 的目标格式和运行期索引来源。
- `alembic_knowledge list/get/insights` 已默认读取主线 `SqliteContextIndex`，旧 `KnowledgeService` 只在 `source=legacy` 时使用。
- 旧 `KnowledgeService`、`RecipeProductionGateway`、旧 repository 仍是提交入口、生命周期、proposal、dashboard 浏览的事实来源。

不能直接删除的阻塞：

- `RecipeProductionGateway` 仍写旧 `KnowledgeService.create()`。
- `KnowledgeService` 仍负责 quality、skill hooks、eventBus、旧 proposal 触发。
- `KnowledgeSyncService` 仍在 setup/rescan 里作为文件和旧 DB 一致性修复路径。

退场建议：

1. 把 `RecipeProductionGateway` 改为主线 Recipe 写入器，旧 `KnowledgeService` 降为显式 legacy 镜像。
2. dashboard / HTTP knowledge 浏览改读 `SqliteContextIndex`。
3. 旧 DB 不再作为提交事实源后，删除 `KnowledgeFileWriter`、`KnowledgeSyncService`、旧 `KnowledgeEntry` 映射层。

### 2.5 Recipe 关系、相似度、提交判断

新主线位置：

- `lib/mainline/knowledge/RecipeSimilarityPolicy.ts`
- `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
- `lib/mainline/knowledge/RecipeSubmissionAdmission.ts`
- `lib/mainline/compile/RecipeRelationMiner.ts`
- `lib/mainline/runtime/GraphExpansion.ts`
- `lib/mainline/runtime/ContextBundleBuilder.ts`

替代的旧能力：

- `lib/domain/evolution/RecipeSimilarity.ts` 的一部分相似度策略。
- `lib/service/candidate/SimilarityService.ts` 的一部分重复检测。
- `lib/service/evolution/ConsolidationAdvisor.ts` 的一部分提交前融合判断。
- `lib/repository/knowledge/KnowledgeEdgeRepository.ts` 的部分关系消费能力。

当前状态：

- Codex 提交准入、运行期关系扩展已经由主线承担。
- 旧 `ConsolidationAdvisor` 仍被 `RecipeProductionGateway` 用来创建 merge/update proposal。
- 旧 `KnowledgeEdgeRepository` 仍承载旧知识图谱、旧 CodeEntityGraph 与 dashboard 关系展示。

退场建议：

1. 把主线关系边 `mainline_recipe_edges` 做成 `alembic_knowledge` 与 dashboard 的主要关系来源。
2. 用主线 similarity/admission 替代 `ConsolidationAdvisor` 的前半段判定。
3. 保留 proposal 执行器，直到主线 evolution gateway 能完整创建和执行 proposal。

### 2.6 文件变更、增量扫描、进化衰退

新主线位置：

- `lib/mainline/compile/RecipeImpactAnalyzer.ts`
- `lib/mainline/compile/RecipeImpactPlan.ts`
- `lib/mainline/compile/MainlineDecayPolicy.ts`
- `lib/mainline/compile/MainlineReverseHealthCheck.ts`
- `lib/mainline/compile/RecipeEvidenceLinker.ts`
- `lib/mainline/compile/SourceRefFreshnessCheck.ts`
- `lib/service/evolution/MainlineFileChangeCompileService.ts`

替代的旧能力：

- `lib/service/evolution/RecipeImpactPlanner.ts`
- `lib/service/evolution/ContentImpactAnalyzer.ts`
- `lib/service/evolution/DecayDetector.ts` 的评分判断部分。
- `lib/service/knowledge/SourceRefReconciler.ts` 的部分 sourceRef 健康判断。
- `lib/service/guard/ReverseGuard.ts` 的部分 Recipe -> 代码事实漂移判断。

代码证据：

- `MainlineCompileSession` incremental 模式调用 `RecipeImpactAnalyzer`。
- rescan workflow 已从 `mainline.result?.recipeImpact` 生成进化候选。
- `MainlineDecayPolicy` 注释说明保留旧 `DecayDetector` 权重和分界，但不执行生命周期迁移。
- `MainlineFileChangeCompileService` 已注册进 `FileChangeDispatcher`，和旧 `FileChangeHandler` 并行订阅文件变更。

当前状态：

- 影响判断已经主线化。
- proposal 创建、生命周期迁移、自动修复 rename/deprecate 仍在旧 `FileChangeHandler`、`EvolutionGateway`、`LifecycleStateMachine`。

可剪枝候选：

- `lib/service/evolution/RecipeImpactPlanner.ts`：生产路径基本已被主线 `RecipeImpactAnalyzer` 替代，当前主要剩测试和历史逻辑价值。

不能直接删除的阻塞：

- `FileChangeDispatcher` 仍注册旧 `FileChangeHandler`。
- HTTP `/file-changes` 仍依赖旧自动修复/弃用语义。
- `SourceRefReconciler` 仍被 rescan 和 `KnowledgeSyncService` 用于旧 DB 桥接表修复。

退场建议：

1. 先删除或归档 `RecipeImpactPlanner`。
2. 将 `FileChangeHandler` 的 rename/deprecate 执行逻辑改成消费主线 `RecipeImpactPlan`。
3. 用主线 `SourceRefRepairService` 替代旧 `SourceRefReconciler` 的批量修复路径。
4. 旧 proposal/lifecycle 执行器最后迁移。

### 2.7 Panorama、Structure、项目全景

新主线位置：

- `lib/mainline/compile/ProjectPanoramaSummary.ts`
- `lib/mainline/graph/ProjectIntelligenceQueries.ts`
- `lib/external/mcp/handlers/structure.ts` 的 mainline-first 分支。

替代的旧能力：

- `lib/service/panorama/*`
- `lib/http/routes/panorama.ts` 背后的旧 `PanoramaService` 数据路径。
- `lib/core/discovery/*` 的部分 target/files/metadata 能力。

当前状态：

- MCP `alembic_structure` 已经优先读主线 artifact。
- HTTP panorama 已默认读主线 `MainlineProjectIntelligenceArtifact`，旧 `PanoramaService` 只在显式 legacy query 下使用。
- dashboard 前端仍保留原视图结构，但后端返回已经来自主线 overview/health/gaps/coverage/module read model。

退场建议：

1. 观察 dashboard 是否还依赖旧 governance/decay/staging 低频接口；这些接口已可降为空状态或 410。
2. `PanoramaService` 只保留为 legacy endpoint fallback。
3. dashboard 迁完后，`lib/service/panorama/*` 可整体进入删除评估。

### 2.8 Guard

新主线位置：

- `lib/mainline/knowledge/Recipe.ts` 的 `kind = guard-rule`
- `lib/external/mcp/handlers/guard.ts` 的主线 rule 注入

没有被替代的旧能力：

- `lib/service/guard/GuardCheckEngine.ts`
- `lib/service/guard/GuardCodeChecks.ts`
- `lib/service/guard/GuardCrossFileChecks.ts`
- `lib/service/guard/ViolationsStore.ts`
- `lib/service/guard/ComplianceReporter.ts`

当前状态：

- 新主线替代的是 Guard 规则来源，不替代 Guard 执行器。
- Guard 执行仍应保留在 `service/guard`。

退场建议：

- 不删除 `service/guard`。
- 后续只需要把 `astQuery` guard-rule 也从主线 Recipe 注入到 Guard 引擎。
- 旧 DB guard rules 可在主线 guard-rule 足够稳定后降为 fallback。

### 2.9 AI 能力

新主线位置：

- `lib/mainline/ai/*`
- `lib/injection/modules/AiModule.ts` 中的 `mainlineAi`、`mainlineEmbedding`

替代的旧能力：

- 分散在 provider 和 agent runtime 内部的模型注册、参数限制、AI port 定义。

没有替代的旧能力：

- `lib/external/ai/providers/*`
- `lib/external/ai/gateway/*`
- `lib/agent/runtime/*`

当前状态：

- 新主线定义 AI 能力端口和模型约束。
- Provider、AgentRuntime、实际执行循环仍是外层能力，不能剪。

退场建议：

- 不再新增 provider 特定判断到 agent/workflow。
- Provider 只经 `mainlineAi`/`mainlineEmbedding` 或明确 bridge 暴露给新主线。

## 3. 第一批可剪枝候选

这些文件符合“生产路径弱引用或已被新主线明确替代”的特征，但删除前仍要跑一次引用检查和测试。

### 3.1 高置信候选

- `lib/service/evolution/RecipeImpactPlanner.ts`
  - 替代者：`lib/mainline/compile/RecipeImpactAnalyzer.ts`
  - 理由：rescan 当前已经使用 `mainline.result?.recipeImpact`，旧 planner 主要保留测试与历史实现。
  - 执行状态：已删除，并移除 `test/unit/RecipeImpactPlanner.test.ts`。

- `lib/service/search/CrossEncoderReranker.ts`
  - 替代者：无，当前新主线不做 cross-encoder rerank。
  - 理由：未见生产注册入口；`KnowledgeModule` 中 `crossEncoderReranker` 传的是 `null`。
  - 执行状态：已删除，并移除 `test/unit/SearchRanking.test.ts` 中只覆盖该旧类的用例。

- `lib/domain/knowledge/RecipeReadinessChecker.ts`
  - 替代者：`RecipeSubmissionAdmission` / `RecipeSubmissionPolicy`
  - 理由：Recipe ready 判断已被主线提交准入覆盖；当前未见生产入口。
  - 执行状态：已删除，`test/unit/KnowledgeAPI.test.ts` 改为直接验证 `UnifiedValidator` 产生的 hints。

- `lib/repository/knowledge/KnowledgeUnitOfWork.ts`
  - 替代者：主线 `SqliteContextIndex` 的事务式 upsert，或旧 gateway 内部直接 repository 调用。
  - 理由：当前未见生产入口。
  - 执行状态：已删除。

### 3.1.1 第一轮延期候选

- `lib/service/evolution/DaemonFileChangeCollector.ts`
  - 延期原因：`bin/daemon-server.ts` 会启动它，属于当前 daemon 文件监控入口。
  - 后续动作：先把 daemon 文件监控切到 `MainlineFileChangeCompileService` 或新的 mainline file-watch 入口，再删除。

- `lib/service/skills/SignalCollector.ts`
  - 延期原因：CLI、dashboard、`alembic_skill` 推荐计数、`AIRecallStrategy` 仍依赖它。
  - 后续动作：skill 推荐不在主线核心，但需要先关闭 dashboard/CLI 后台入口，再删除。

### 3.2 中置信候选

- `lib/service/task/PrimeSearchPipeline.ts`
  - 替代者：`MainlinePrimeRunner` + `RuntimeRetrievalPipeline`
  - 理由：Codex prime 热路径已经不走它。
  - 执行状态：`AppModule` / `ServiceMap` 生产注册已移除。
  - 阻塞：旧集成测试仍验证它；删除前需要把这些测试迁到 `MainlinePrimeRunner` 或显式 legacy 夹具。

- `lib/service/search/*`
  - 替代者：`mainline/search/*` + `mainline/runtime/*`
  - 理由：MCP search 和 tools v2 knowledge search 已 mainline-only by default。
  - 执行状态：自动 fallback 已关闭；显式 `source=legacy` 仍可进入旧 SearchEngine。
  - 阻塞：CLI、HTTP、dashboard、旧 fallback、测试仍使用 SearchEngine。

- `lib/infrastructure/vector/*` 与 `lib/service/vector/*`
  - 替代者：当前主线 SearchIndex 是 sparse JSON/内存索引，未使用旧向量体系。
  - 理由：新主线核心不依赖向量索引。
  - 阻塞：CLI indexing、VectorModule、旧 SearchEngine、向量相关测试仍使用。

### 3.3 低置信候选

- `lib/service/panorama/*`
  - 替代者：`ProjectPanoramaSummary` + `ProjectIntelligenceQueries`
  - 阻塞：dashboard/HTTP panorama 仍使用。

- `lib/core/discovery/*`
  - 替代者：`MainlineSourceFileScanner` + 主线 artifact。
  - 阻塞：`alembic_structure` fallback、旧 project-intelligence、project type 判定仍使用。

- `lib/core/AstAnalyzer.ts`、`lib/core/analysis/*`、`lib/core/ast/*`
  - 替代者：`mainline/code/*`
  - 阻塞：旧 project-intelligence、Mission Briefing、CodeEntityGraph 仍使用。

## 4. 当前不能剪的目录

这些目录仍是新主线的一部分或产品外壳，不应被“旧项目”标签误删。

- `lib/mainline/*`：新主线主体。
- `lib/agent/*`：冷启动和 rescan 的 AI 执行仍依赖 AgentRuntime。
- `lib/tools/*`：工具系统仍是 agent/tool/workflow 的入口层；tools v2 已经 mainline-first。
- `lib/workflows/*`：冷启动、rescan、dimension execution 的编排层仍保留。
- `lib/external/mcp/*`：MCP 对 Codex/插件的入口层。
- `lib/service/guard/*`：Guard 执行器仍保留。
- `lib/external/ai/*`：真实 provider 和 gateway 仍保留。
- `lib/http/*`、`dashboard/*`：产品外壳，后续改读主线，不是现在删除。
- `plugins/*`、`injectable-skills/*`、`resources/*`：分发和 IDE/插件能力，仍属于最外围新形态。
- `lib/daemon/*`：插件 daemon、job、dashboard 启动仍需要。
- `lib/sandbox/*`：tools v2 terminal/sandbox 仍通过 `ToolContextFactory` 懒加载。

## 5. 剪枝顺序

### 第一轮：删除孤立旧实现

目标是小步、低风险。

候选：

- `RecipeImpactPlanner`
- `CrossEncoderReranker`
- `DaemonFileChangeCollector`
- `SignalCollector`
- `RecipeReadinessChecker`
- `KnowledgeUnitOfWork`

要求：

- 每删一个都单独跑 `rg`、`npm run typecheck` 和相关测试。
- 测试只验证旧实现的，应改成验证新主线同等能力或删除旧测试。

### 第二轮：关闭自动 fallback

目标是让主线成为唯一热路径。

动作：

- `alembic_task prime` 已完成。
- `alembic_search` 已增加明确 legacy mode，默认不再自动 fallback 到旧 SearchEngine。
- `alembic_structure` 已增加明确 legacy mode，默认只读 mainline artifact。
- `tools/v2 knowledge.search` 已默认只读 mainline runtime。
- `AppModule` / `ServiceMap` 已移除 `primeSearchPipeline` 生产注册。

完成后可删除：

- `PrimeSearchPipeline`：还需迁走旧测试后删除。
- 大部分 `service/search`：还需迁走 CLI/HTTP/dashboard 后删除。
- 大部分 `infrastructure/vector`

### 第三轮：迁移展示和治理外壳

目标是删除旧 DB-first 体系。

动作：

- `alembic_knowledge list/get/insights` 已改为默认读取 mainline ContextIndex；旧 `knowledgeService` 必须显式传 `source=legacy` 才会进入。
- HTTP/dashboard knowledge/search/panorama 已接入 `mainline-read-model`，默认读主线 SQLite/SearchIndex/artifact。
- 旧 panorama governance/decay/staging/enhancement 等边缘接口已开始退场，前端可接受空状态或 removed 状态。
- `RecipeProductionGateway` 改为主线写入器，旧 `KnowledgeService` 只做兼容镜像。
- rescan/cold-start Mission Briefing 改从主线 artifact 投影。

完成后可删除：

- `KnowledgeFileWriter`
- `KnowledgeSyncService`
- `KnowledgeEntry` 旧模型大部分字段逻辑
- `repository/knowledge` 的旧 DB-first 实现
- `service/panorama`
- `core/AstAnalyzer` 与旧 `core/analysis`

### 第四轮：迁移生命周期执行

目标是把旧 evolution 执行层也主线化。

动作：

- 主线 RecipeImpactPlan 直接创建/升级 proposal。
- 主线 SourceRefRepairService 接管 rename/sourceRef 修复。
- 主线 DecayPolicy 接管衰退判断。
- 旧 `FileChangeHandler` 只保留到主线能覆盖 rename/deprecate 执行。

完成后可删除：

- `FileChangeHandler`
- `ContentImpactAnalyzer`
- `DecayDetector`
- `SourceRefReconciler`
- 旧 proposal/lifecycle 周边中不再被 dashboard/API 使用的部分。

## 6. 需要特别避免的误删

1. 不要把 `workflows` 当旧项目删除。它现在是新主线编译、Agent 执行、rescan 编排的上层。
2. 不要把 `agent` 当旧项目删除。冷启动内容挖掘和 internal dimension execution 仍依赖 AgentRuntime。
3. 不要把 `tools` 当旧项目删除。tools v2 是新主线进入 agent/tool 体系的入口。
4. 不要删除 `service/guard`。新主线取代的是规则来源，不是 Guard 引擎。
5. 不要删除 `external/ai/providers`。新主线只定义 AI port，不替代 provider。
6. 不要直接删除旧 repository。提交、dashboard、proposal、lifecycle 还没有完全 mainline-first。

## 7. 下一步可执行任务

第一轮高置信剪枝、第二轮自动 fallback 关闭、第三轮 HTTP 展示读模型已经完成。下一步建议继续收写入侧和剩余 legacy 引用：

1. `RecipeProductionGateway` 改为主线 Recipe 写入器，旧 `KnowledgeService` 只做显式 legacy 镜像。
2. dashboard 中仍调用旧写操作的边缘按钮降为空状态、removed 状态或 legacy-only。
3. 把旧 SearchEngine 相关测试继续迁为显式 legacy fallback 测试或主线 search 测试。
4. PrimeSearchPipeline 旧集成测试迁走后删除该文件。
5. 再评估 `service/search/*`、`infrastructure/vector/*`、`service/panorama/*` 的实际剩余引用。
