# Alembic 知识挖掘核心链路与实现计划

日期：2026-05-15

本文只讨论当前 Alembic 代码库中“从项目扫描到产出可消费 Recipe”的核心链路。目标是先把知识挖掘打通，因为没有稳定 Recipe 产出，就无法验证后续知识检索、注入、Guard、IDE 适配。

本文不以 mainline 相关文档为前提，也不恢复 Dashboard AI Chat、Wiki 产品面、文件 watcher、ReverseGuard、SignalCollector / Skill 推荐系统等已清理方向。

## 一、目标

知识挖掘阶段的最终产物必须是可验证、可检索、可注入的 Recipe，而不是只完成了扫描报告、维度任务、候选提交尝试或后台任务状态。

本阶段要建立的闭环是：

```text
可信 projectRoot
  -> 初始化 Ghost 工作区 / 数据根目录
  -> ProjectIntelligence 项目事实扫描
  -> 维度化分析任务
  -> Analyst 读取代码并记录结构化发现
  -> QualityGate 产出 evidence artifact
  -> Producer 调用 knowledge.submit
  -> RecipeProductionGateway 校验、去重、创建
  -> KnowledgeService file-first 落盘 + DB 索引
  -> SourceRef / Search / Codex readiness 可观察
  -> Job/Status 返回真实 Recipe 产出结果
```

其中“Recipe 产出结果”必须同时满足：

- DB 中存在 `knowledge_entries` 记录。
- 文件系统中有对应 Markdown 文件。
- 生命周期是当前插件链路可消费的状态。
- Codex 插件的 `inspectCodexKnowledge()` 能把它识别为可用知识。
- `knowledge.submit` / bootstrap job 的统计只把真实创建的 Recipe 计入 `created`。

## 二、当前真实入口

### 1. Codex 插件入口

相关代码：

- `lib/external/mcp/CodexMcpServer.ts`
- `lib/daemon/DaemonSupervisor.ts`
- `lib/daemon/DaemonJobRunner.ts`
- `lib/external/mcp/handlers/bootstrap-internal.ts`
- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`

当前插件侧调用关系：

```text
alembic_codex_bootstrap
  -> CodexMcpServer.enqueueJob("bootstrap")
  -> Daemon HTTP /api/v1/jobs/bootstrap
  -> enqueueDaemonJob()
  -> runDaemonJob()
  -> bootstrapKnowledge()
  -> runInternalColdStartWorkflow()
```

`alembic_codex_rescan` 类似：

```text
alembic_codex_rescan
  -> CodexMcpServer.enqueueJob("rescan")
  -> DaemonJobRunner.executeInternalWorkflow()
  -> rescanInternal()
  -> runInternalKnowledgeRescanWorkflow()
```

Codex 入口的关键前置条件是 `projectRoot` 必须可信。`CodexMcpServer.handleToolCall()` 已经支持显式 `projectRoot` 参数，并会保存可信项目目录。无法确认项目目录时，除 status / diagnostics 外的项目工具会返回 `CODEX_PROJECT_ROOT_UNRESOLVED` 或 `CODEX_PROJECT_ROOT_REJECTED`。

这部分方向是正确的，知识挖掘不应该绕过它。

### 2. 传统 MCP 外部 Agent 入口

相关代码：

- `lib/external/mcp/McpServer.ts`
- `lib/workflows/cold-start/external/ExternalColdStartWorkflow.ts`
- `lib/external/mcp/handlers/dimension-complete-external.ts`
- `lib/workflows/capabilities/execution/external/ExternalDimensionCompletionWorkflow.ts`
- `lib/workflows/capabilities/execution/external/MissionBriefingSupport.ts`

外部路径仍然是：

```text
alembic_bootstrap
  -> runExternalColdStartWorkflow()
  -> ProjectIntelligenceCapability.run()
  -> Mission Briefing
  -> 外部 Agent 自行分析代码
  -> alembic_submit_knowledge / knowledge.submit
  -> alembic_dimension_complete
```

本文后续实现优先保证 Codex 插件内置自动挖掘路径。外部 Agent 路径保留为适配 IDE 插件的接口形态，但不应成为验证 Codex 插件产出 Recipe 的唯一方式。

## 三、项目事实挖掘链路

相关代码：

- `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceCapability.ts`
- `lib/workflows/capabilities/project-intelligence/ProjectIntelligencePreparation.ts`
- `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
- `lib/types/project-snapshot-builder.ts`
- `lib/types/project-snapshot.ts`

`ProjectIntelligenceCapability.run()` 是冷启动和重扫共享的项目事实入口。

当前阶段如下：

```text
prepareProjectAnalysisRun()
  -> ensureProjectAnalysisPathGuard()
  -> 可选 clearOldData

runAllPhases()
  -> Phase 1: DiscovererRegistry 文件收集
  -> Phase 1.5: tree-sitter AST 分析
  -> Phase 1.6: Code Entity Graph
  -> Phase 1.7: Call Graph
  -> Phase 2: Dependency Graph -> knowledge_edges
  -> Phase 2.1: module entities
  -> Phase 2.2: Panorama
  -> Phase 3: Guard audit
  -> Phase 4: activeDimensions + enhancement packs + language profile
```

这条链路现在的价值是提供项目事实，而不是直接产出 Recipe。它的输出会被包装成 `ProjectSnapshot`，再进入维度执行。

当前边界：

- `maxFiles` 默认 500，达到上限会给 warnings，但后续仍继续。
- AST / CallGraph / Guard / Panorama 都是 degraded-capable，失败不阻塞项目扫描。
- 冷启动是全量清理后全量扫描。
- rescan 默认走增量评估，但仍会执行项目分析并根据 diff / SourceRef / coverage 计算执行维度。

结论：项目事实挖掘本身已经有可用骨架，优先问题不在 Phase 1-4，而在 Phase 5 之后“如何稳定变成 Recipe”。

## 四、维度化执行链路

相关代码：

- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionWorkflow.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillSessionRunner.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`
- `lib/agent/profiles/definitions/bootstrap.profile.ts`
- `lib/agent/profiles/AgentStageFactoryRegistry.ts`

冷启动内部路径：

```text
runInternalColdStartWorkflow()
  -> runFullResetPolicy()
  -> ProjectIntelligenceCapability.run()
  -> buildProjectSnapshot()
  -> selectColdStartDimensions()
  -> cacheProjectAnalysisSession()
  -> startInternalDimensionExecutionSession()
  -> dispatchInternalDimensionExecution()
```

rescan 内部路径：

```text
runInternalKnowledgeRescanWorkflow()
  -> snapshotRecipes / rescanClean
  -> SourceRefReconciler
  -> ProjectIntelligenceCapability.run()
  -> RecipeImpactPlanner
  -> auditRecipesForRescan()
  -> buildKnowledgeRescanPlan()
  -> executionDimensions / produceDimensions
  -> dispatchInternalDimensionExecution()
```

维度执行内部继续走：

```text
runInternalDimensionExecution()
  -> prepareInternalDimensionExecutionRun()
  -> initializeBootstrapRuntime()
  -> runInternalDimensionAgentSession()
  -> finalizeInternalDimensionFill()
```

`bootstrap-dimension` profile 的实际 stage 由 `AgentStageFactoryRegistry.bootstrapDimensionPipeline` 生成：

```text
needsCandidates = false:
  analyze

needsCandidates = true:
  analyze
  -> quality_gate
  -> produce
  -> rejection_gate

hasExistingRecipes && !prescreenDone:
  evolve
  -> evolution_gate
  -> analyze
  -> quality_gate
  -> produce
  -> rejection_gate
```

这里的核心判断是 `needsCandidates`，来自 `BootstrapDimensionRuntimeBuilder.resolveBootstrapDimensionPlan()`：

- skill-only 维度不会创建 Recipe。
- rescan 中 `mode !== produce` 或 `createBudget <= 0` 的维度不会创建 Recipe。
- 冷启动大多数非 skill 维度会进入 Producer。

## 五、Agent 挖掘与 Recipe 生产链路

### 1. Analyst 阶段

相关代码：

- `lib/agent/prompts/insight-analyst.ts`
- `lib/tools/v2/capabilities/BootstrapAnalyze.ts`
- `lib/agent/prompts/insight-gate.ts`
- `lib/agent/domain/EvidenceCollector.ts`

Analyst 阶段通过 `code`、`graph`、`memory`、可选 terminal 能力读取项目事实，并被要求调用：

```text
memory({ action: "note_finding", params: { finding, evidence, importance } })
```

`insightGateEvaluator()` 会把 Analyst 的回复和工具调用投影为 `AnalysisArtifact`：

- `analysisText`
- `referencedFiles`
- `findings`
- `evidenceMap`
- `negativeSignals`
- `qualityReport`

当前质量门控有一个强约束：需要创建候选时，缺少 `memory.note_finding` 会触发 retry；仍失败时可能 degrade。Producer 阶段带 `skipOnDegrade: true`，所以 QualityGate degrade 会直接导致没有 Producer，没有 Recipe。

这条规则对质量有价值，但也意味着必须把“QualityGate 未进入 Producer”显式暴露为 Recipe 产出失败，而不能只显示维度任务完成。

### 2. Producer 阶段

相关代码：

- `lib/agent/prompts/insight-producer.ts`
- `lib/tools/v2/capabilities/BootstrapProduce.ts`
- `lib/tools/v2/registry.ts`
- `lib/tools/v2/handlers/knowledge.ts`
- `lib/service/knowledge/RecipeProductionGateway.ts`

Producer 必须调用：

```text
knowledge({
  action: "submit",
  params: {
    title,
    description,
    content: { markdown, rationale, pattern? },
    kind,
    trigger,
    whenClause,
    doClause,
    dontClause,
    coreCode,
    reasoning: { whyStandard, sources, confidence },
    ...
  }
})
```

`knowledge.submit` 的本地处理逻辑在 `lib/tools/v2/handlers/knowledge.ts`：

```text
handleSubmit()
  -> validateSubmitParams()
  -> 补齐 dimensionId / knowledgeType / category / language / headers / usageGuide / sourceRefs
  -> recipeGateway.create({ source: "agent-tool", items: [item] })
```

`RecipeProductionGateway.create()` 继续执行：

```text
UnifiedValidator
  -> BootstrapDedup
  -> SimilarityService
  -> ConsolidationAdvisor
  -> KnowledgeService.create()
  -> updateQuality()
```

`KnowledgeService.create()` 继续执行：

```text
KnowledgeEntry.fromJSON()
  -> lifecycle = pending
  -> ConfidenceRouter.route()
  -> 可能进入 staging
  -> KnowledgeFileWriter.persist()
  -> KnowledgeRepository.create()
  -> knowledge:changed event
  -> SourceRef bridge / search refresh
```

## 六、当前关键断点

### 断点 1：新知识可能已创建，但 Codex readiness 仍认为没有知识

相关代码：

- `lib/service/knowledge/KnowledgeService.ts`
- `lib/service/knowledge/KnowledgeFileWriter.ts`
- `lib/domain/knowledge/Lifecycle.ts`
- `lib/codex/KnowledgeState.ts`

当前新建条目默认 `pending`，高置信度可信来源会被 `ConfidenceRouter` 路由到 `staging`。但 `KnowledgeEntry.isCandidate()` 把 `pending` 和 `staging` 都视为 candidate，`KnowledgeFileWriter._resolveFilePath()` 会把它们写入：

```text
Alembic/candidates/{dimension}/...
```

而 Codex 插件可用性检查 `inspectCodexKnowledge()` 当前只扫描：

```text
resolver.recipesDir
resolver.skillsDir
```

这会导致一种非常危险的状态：

```text
后台确实创建了 staging Recipe
  -> 文件落在 candidates/
  -> DB 有 knowledge_entries
  -> Search 可能可检索
  -> 但 Codex readiness recipeCount = 0
  -> status 仍是 initialized_empty
  -> 插件工具继续被隐藏
```

这是当前优先级最高的链路错位。

需要统一“Recipe 产出”的定义。既然现在 Alembic 没有独立用户审核面，Codex 插件内置挖掘产物不能停留在不可见候选状态。至少要让 `CONSUMABLE_LIFECYCLES` 被 Codex readiness 识别；更彻底的方向是让插件内可信挖掘产物直接进入可消费 Recipe 状态。

### 断点 2：Producer 的 created 统计不是严格的真实创建数

相关代码：

- `lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`
- `lib/tools/v2/handlers/knowledge.ts`

`knowledge.submit` 在重复命中时会返回：

```ts
{ status: 'duplicate_blocked', ... }
```

但 `projectBootstrapDimensionAgentOutput()` 当前把所有不是 `rejected` / `error` 的 submit call 都计为成功。这意味着：

```text
duplicate_blocked
  -> 被 BootstrapProjections 计为 success
  -> producerResult.candidateCount 增加
  -> dimensionStats 显示 created
  -> 实际 DB / 文件没有新 Recipe
```

这会让任务状态和真实知识产出脱节。后续必须只把 `result.status === "created"` 且存在 `id` 的提交计入 created。

### 断点 3：AI Provider 不可用时，bootstrap 可能以“跳过维度”的形式结束

相关代码：

- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`
- `lib/service/bootstrap/BootstrapEventEmitter.ts`

当 `agentService` 或 `systemRunContextFactory` 不可用时，当前逻辑会：

```text
emitInternalDimensionFillAiUnavailable()
  -> emitProgress("bootstrap:ai-unavailable")
  -> 对每个维度 emitDimensionComplete(type: "skipped")
```

`emitDimensionComplete()` 会调用 `BootstrapTaskManager.markTaskCompleted()`。也就是说，没有 AI Provider 时可能出现“所有任务 completed，但没有 Recipe”的状态。

对于 Codex 插件的自动知识挖掘，这应该是硬失败，而不是成功完成。没有 AI Provider 就没有内部挖掘能力；状态应清楚告诉 agent / 用户需要配置 AI Provider 或改走外部 Agent 路径。

### 断点 4：QualityGate degrade 会跳过 Producer，但任务层缺少 Recipe 产出失败语义

相关代码：

- `lib/agent/prompts/insight-gate.ts`
- `lib/agent/profiles/presets.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`

`produce` stage 配置了 `skipOnDegrade: true`。如果 Analyst 没有足够 `note_finding`、引用文件不足或分析质量太低，Producer 不会运行。

这本身合理，但维度执行应该能返回：

```text
dimension failed to produce recipe:
  reason = quality_gate_degraded
  gateReason = ...
  analysisChars = ...
  referencedFiles = ...
  memoryFindingCount = ...
```

否则最终只会看到“这个维度没有 created”，难以定位是扫描不足、质量门控失败、Producer 没提交，还是 Gateway 拒绝。

### 断点 5：`validateSubmitParams()` 与 `UnifiedValidator` 不完全一致

相关代码：

- `lib/tools/v2/handlers/knowledge.ts`
- `lib/domain/knowledge/FieldSpec.ts`
- `lib/domain/knowledge/UnifiedValidator.ts`

V2 tool schema 和 `validateSubmitParams()` 没有完全覆盖 `V3_FIELD_SPEC`。例如 `dontClause` 是 FieldSpec required，但本地 `validateSubmitParams()` 当前没有硬检查。最终 Gateway 仍会拒绝，但错误会发生在更深层。

后续应该把 V2 tool schema / local validation / UnifiedValidator 对齐，避免 Producer 以为提交参数合法，实际被 Gateway 拒绝。

### 断点 6：Job 完成结果没有以 Recipe 产出为主指标

相关代码：

- `lib/daemon/DaemonJobRunner.ts`
- `lib/service/bootstrap/BootstrapTaskManager.ts`
- `lib/workflows/capabilities/persistence/WorkflowResultPersistence.ts`

Daemon job 会等待 `bootstrap:all-completed`，但完成结果目前偏任务视角。知识挖掘阶段的验收指标应该直接包含：

- `createdRecipeCount`
- `createdRecipeIds`
- `rejectedSubmitCount`
- `duplicateBlockedCount`
- `produceSkippedDimensions`
- `failedProduceDimensions`
- `consumableRecipeCountAfterJob`

这能让 Codex Desktop 端和后续测试不必猜测“任务完成是否等于 Recipe 可用”。

## 七、建议的实现方向

### 阶段 0：明确输出契约

先在代码中明确三类状态：

```text
submitted call
  Agent 是否调用了 knowledge.submit

created Recipe
  Gateway 返回 status=created 且有 id

usable knowledge
  Codex readiness / Search / Injection 可以消费
```

这三类不能再混用。

建议新增或扩展内部结构：

```ts
interface DimensionRecipeProductionStats {
  submittedCalls: number;
  createdRecipeIds: string[];
  createdRecipeCount: number;
  rejectedCount: number;
  duplicateBlockedCount: number;
  blockedCount: number;
  processedWithoutCreateCount: number;
  errors: string[];
}
```

落点：

- `BootstrapProjections.ts`
- `BootstrapConsumers.ts`
- `WorkflowResultPersistence.ts`
- `DaemonJobRunner.ts`

### 阶段 1：修复真实创建计数

修改 `projectBootstrapDimensionAgentOutput()`：

- 只把 `result.status === "created"` 且 `id` 为字符串的 submit call 计入 `created`。
- `duplicate_blocked` 计入 `duplicateBlockedCount`，不能算成功创建。
- `processed`、`blocked`、`rejected`、`error` 都要进入不同桶。
- `producerResult.candidateCount` 改名或补充为 `createdRecipeCount`，避免继续误导。

修改 `consumeBootstrapDimensionResult()`：

- `candidateResults.created` 只累计真实 `createdRecipeCount`。
- `dimensionStats[dimId]` 写入完整 production stats。
- `emitter.emitDimensionComplete()` 的 `created` 使用真实创建数。
- 当 `needsCandidates === true` 且 Producer 有提交但真实创建数为 0，要把原因写入 `dimensionStats.error` 或 `productionFailureReason`。

验收：

- `duplicate_blocked` 不会让 job / task 显示 created > 0。
- rejection gate 能根据真实拒绝和阻塞情况触发 retry 或给出失败原因。

### 阶段 2：对齐 Codex readiness 与可消费生命周期

当前 `Lifecycle.ts` 已定义：

```ts
CONSUMABLE_STATES = [staging, active, evolving]
PUBLISHED_LIFECYCLES = [active, staging]
COUNTABLE_LIFECYCLES = [active, staging, pending, evolving]
```

但 `inspectCodexKnowledge()` 只扫描 `recipesDir`，没有看 DB 生命周期，也没有扫描 `candidatesDir` 中的 staging。

建议实现：

```text
inspectCodexKnowledge(projectRoot)
  -> 优先读取 DB lifecycle counts
  -> consumableRecipeCount = staging + active + evolving
  -> candidateCount = pending
  -> deprecatedCount = deprecated
  -> 文件扫描作为 DB 不可用时的 fallback
  -> usable = initialized && (consumableRecipeCount > 0 || skillCount > 0)
```

同时 status / diagnostics 应显示：

- `recipeCount`
- `consumableRecipeCount`
- `candidateCount`
- `stagingCount`
- `activeCount`
- `knowledgeStorageSource: db | filesystem-fallback`

这样可以马上验证“知识已经生成，但只是落在 candidates/”这类问题。

### 阶段 3：决定插件模式的 Recipe 生命周期策略

由于当前 Alembic 已没有独立用户审核面，插件自动挖掘不能依赖 Dashboard 人工发布。

建议选择一个明确策略：

#### 推荐策略：插件内部可信挖掘直接产出可消费 Recipe

具体做法：

- `source === "bootstrap"` 且 `UnifiedValidator` 通过且 `reasoning.confidence >= trusted threshold` 时，进入 `staging` 或 `active`。
- Codex readiness 把 `staging` 当作可用知识。
- Search / injection / Recipe adapter 均使用 `CONSUMABLE_LIFECYCLES`。
- Guard 若仍只接受 `active`，后续单独决定是否让 Guard 接受 `staging` 或只在注入链路使用 staging。

不建议继续保留“产出在 candidates/，等待一个不存在的用户审核面”的主路径。

需要改动点：

- `KnowledgeService.create()`
- `ConfidenceRouter`
- `KnowledgeFileWriter._resolveFilePath()`
- `CodexKnowledgeState.inspectCodexKnowledge()`
- 使用 active-only 查询的消费方，逐个确认是否应改为 `CONSUMABLE_LIFECYCLES`

阶段内先不做大迁移，只保证 Codex 插件能看到可消费知识。

### 阶段 4：无 AI Provider / 无 Producer / 无 Recipe 的失败护栏

Codex 插件自动挖掘必须有清晰失败语义。

需要新增护栏：

```text
无 AgentService / 无 SystemRunContextFactory:
  bootstrap job failed
  errorCode = AI_PROVIDER_REQUIRED
  message = 内部知识挖掘需要 AI Provider

QualityGate degrade 且 needsCandidates=true:
  dimension failed
  reason = quality_gate_degraded
  不标记为成功产出 Recipe

Producer 没有调用 knowledge.submit:
  dimension failed 或 completed_with_no_recipe
  reason = producer_no_submit

全部 submit 被拒绝 / duplicate / blocked:
  dimension failed 或 completed_with_no_recipe
  附带 rejectedSummary / duplicateSummary

所有 produce dimensions 都没有 created Recipe:
  bootstrap job failed 或 completed_with_errors
  Codex status 不进入 knowledge_ready
```

这里可以分两层：

- 单维度允许 `completed_with_no_recipe`，用于某些维度确实没有足够知识。
- 整个 bootstrap 如果所有生产维度都没有 Recipe，必须失败。

### 阶段 5：对齐 Producer 参数规范

把以下三处收敛到同一个字段来源：

- `lib/domain/knowledge/FieldSpec.ts`
- `lib/tools/v2/registry.ts`
- `lib/tools/v2/handlers/knowledge.ts`
- `lib/agent/prompts/insight-producer.ts`

建议实现：

- 从 `FieldSpec` 导出内部 Producer required fields。
- `knowledge.submit` schema 自动或半自动使用该字段集合。
- `validateSubmitParams()` 至少覆盖所有 `getInternalAgentRequiredFields()`。
- 本地 validation 和 Gateway validation 的错误字段名一致。

这样 Producer retry prompt 可以直接复用 `getRequiredFieldsDescription()`，不会出现本地说合法、Gateway 才拒绝的问题。

### 阶段 6：SourceRef 与 Search 的产出后校验

相关代码：

- `lib/injection/modules/KnowledgeModule.ts`
- `lib/service/knowledge/SourceRefReconciler.ts`
- `lib/service/search/SearchEngine.ts`

`KnowledgeModule.initializeKnowledgeServices()` 已经监听 `knowledge:changed`：

```text
knowledge:changed
  -> searchEngine.refreshIndex()
  -> _populateSourceRefsForEntry()
```

后续要把它纳入 bootstrap job 的产出验收：

```text
createdRecipeIds
  -> findSourceFileAndReasoning()
  -> sourceRefs populated
  -> searchEngine can find by title / trigger / source file
```

首次实现可以不强制 SourceRef 全成功，但必须在 job result 中显示：

- `sourceRefsInserted`
- `sourceRefsMissing`
- `sourceRefsStale`
- `searchIndexRefreshed`

## 八、推荐第一批实现切片

第一批不要动大规模挖掘算法，先修正“产出是否真实”的闭环。

### 切片 A：真实 Recipe 创建统计

改动文件：

- `lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts`
- `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`
- `test/unit/BootstrapProjection.test.ts`

目标：

- `created` 只统计 `status=created`。
- `duplicate_blocked` 不算 created。
- `rejected` / `blocked` / `processed` 分桶。
- `dimensionStats` 包含 `createdRecipeIds`。

### 切片 B：Codex readiness 识别可消费 Recipe

改动文件：

- `lib/codex/KnowledgeState.ts`
- `lib/codex/StatusService.ts`
- `test/unit/CodexKnowledgeState.test.ts`
- `test/unit/CodexStatusService.test.ts`

目标：

- 优先通过 DB lifecycle counts 判断知识是否可用。
- `staging` 进入 `consumableRecipeCount`。
- status / diagnostics 明确显示 DB 计数与文件 fallback。
- 产出 staging Recipe 后，插件状态应进入 `knowledge_ready`。

### 切片 C：无 AI Provider 变成硬失败

改动文件：

- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`
- `lib/daemon/DaemonJobRunner.ts`
- `test/unit/DaemonJobRunner.test.ts`

目标：

- 内部 bootstrap 没有 AI Provider 时，不把所有维度标记为 completed。
- job result 返回 `AI_PROVIDER_REQUIRED`。
- Codex status 的 next action 指向配置 AI Provider 或改用外部 Agent 路径。

### 切片 D：补一条最小端到端挖掘测试

建议新增测试：

```text
test/integration/InternalColdStartRecipeProduction.test.ts
```

使用 fake `AgentService`，不调用真实 LLM：

```text
Project fixture
  -> bootstrap internal skip real AI by fake AgentService
  -> fake AgentResult contains knowledge.submit tool call result status=created
  -> assert DB has entry
  -> assert Markdown exists
  -> assert SourceRef populated
  -> assert inspectCodexKnowledge().usable === true
```

这个测试是后续知识注入前最重要的地基。

## 九、验收标准

知识挖掘阶段修复完成后，至少要满足：

1. `alembic_codex_bootstrap` 在有 AI Provider 或 fake AgentService 的测试环境中能产出至少一个真实 Recipe。
2. Job 完成结果包含真实 `createdRecipeIds`，且数量与 DB / 文件一致。
3. `inspectCodexKnowledge(projectRoot).status` 从 `initialized_empty` 进入 `knowledge_ready`。
4. `knowledge.search` 或 `alembic_search` 能搜到新产出的 Recipe。
5. `recipe_source_refs` 至少能从 `reasoning.sources` 生成有效记录。
6. `duplicate_blocked`、`rejected`、`blocked` 不再被计入 created。
7. 无 AI Provider 时 bootstrap 明确失败，不显示“完成但没有知识”。
8. 所有 produce 维度都没有 Recipe 时，job 不进入成功状态。

## 十、后续与知识注入的衔接

只有当本阶段满足“可消费 Recipe 稳定产出”后，才进入下一阶段知识注入：

```text
created / consumable Recipe
  -> SourceRef / Graph / Search materialization
  -> KnowledgeInjectionPipeline
  -> alembic_task prime contextBundle
  -> IDE plugin adapter
```

当前不建议先做注入层优化，因为注入层没有稳定 Recipe 输入时，验证会变成假阳性。

