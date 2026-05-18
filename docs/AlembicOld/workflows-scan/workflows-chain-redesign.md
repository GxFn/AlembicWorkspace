# Workflows 链路重构与能力升级方案

> 本文不是“把大文件拆小”的清单，而是基于冷启动与增量扫描两条业务链路重新定义 `workflows/` 下三个目录的语义边界、组合关系和后续实现顺序。

## 结论

当前 `workflows/` 已经完成了第一层目录迁移，但核心设计仍然没有完全摆脱旧 bootstrap 思维：四个入口看起来分开了，实际仍在共享一组以 bootstrap 命名、以 handler 形状为输入、以副作用为中心的能力。下一阶段不应该继续按文件大小拆分，而应该按以下三个问题重构：

1. 生命周期语义：冷启动是“从空状态建立初始知识库”，增量扫描是“在已有知识上验证、演进、补齐”。两者不能共用同一个模糊的 incremental/bootstrap plan。
2. 执行者语义：内部 Agent 是系统自动执行并自动提交，外部 Agent 是系统发任务、外部 IDE Agent 自行读代码并回填完成。两者共享项目上下文，但不共享执行/完成策略。
3. 副作用语义：清理、分析、计划、执行、进度、报告、快照、交付应是显式能力，不能隐藏在某个 runner 或 handler 中顺手做完。

目标结构仍保留三层：

- `cold-start/`：只表达冷启动 intent preset，不承载通用实现。
- `incremental-scan/`：只表达已有知识的演进与补齐 intent preset。
- `common-capabilities/`：提供可组合能力，每个能力有明确输入输出和副作用声明。

## 当前链路事实

### 内部 Agent 冷启动

入口：`runInternalColdStartWorkflow()`。

当前链路：

1. 解析 `maxFiles`、`skipGuard`、`incremental`、terminal toolset 等参数。
2. `runFullResetPolicy()` 清理旧 DB/文件状态。
3. `collectProjectAnalysis()` 运行项目分析，并传入 `clearOldData: true` 与 `incremental: args.incremental !== false`。
4. `buildProjectSnapshot()` 固化分析结果。
5. 在 workflow 内构造 Dashboard/MCP 兼容的 `report`、`targets`、`filesByTarget`、`analysisFramework`、`nextSteps`。
6. `cacheProjectAnalysisSession()` 缓存 Phase 结果。
7. `startInternalDimensionFillSession()` 创建任务会话。
8. `dispatchInternalDimensionFill()` 异步触发内部 Agent 执行。
9. 内部执行链路最终写 candidates/skills、report、snapshot、semantic memory、delivery/wiki。

主要问题：冷启动已经 full reset，却仍默认允许 `incremental`。同时 `collectProjectAnalysis(clearOldData: true)` 会清 checkpoint/snapshot，导致文件快照增量语义在冷启动中天然自相矛盾。workflow 还在构造返回视图，混入 adapter/presenter 职责。

### 外部 Agent 冷启动

入口：`runExternalColdStartWorkflow()`。

当前链路：

1. `runFullResetPolicy()`。
2. `collectProjectAnalysis(... incremental: false)`。
3. `buildProjectSnapshot()`。
4. `createExternalWorkflowSession()` 创建外部会话并缓存 snapshot。
5. `buildExternalMissionBriefing()` 构造 Mission Briefing。
6. 外部 Agent 后续调用 `alembic_submit_knowledge(_batch)` 和 `alembic_dimension_complete`。

主要问题：外部冷启动的“任务发放”已经迁到 workflow，但“维度完成”仍在 handler 层。这样外部链路被切成两半：开始在 `workflows/cold-start/external`，完成在 `lib/external/mcp/handlers/dimension-complete-external.ts`。完成阶段包含 recipe 绑定、skill 生成、checkpoint、progress、delivery、panorama、wiki、semantic memory consolidation，这些都是 workflow 能力，不应继续留在 handler。

### 内部 Agent 增量扫描

入口：`runInternalIncrementalScanWorkflow()`。

当前链路：

1. `runRescanCleanPolicy()` 快照 recipes 并执行 rescan clean。
2. `syncKnowledgeStoreForRescan()` 恢复 recipe 文件与 DB 一致性。
3. `collectProjectAnalysis(... incremental: false)` 全量项目分析。
4. `auditRecipesForRescan()` 用文件、AST、依赖图做 recipe relevance audit。
5. `buildRescanPrescreen()` 生成自动跳过/需要验证/gap。
6. `planInternalRescanGaps()` 按 `TARGET_RECIPES_PER_DIMENSION = 5` 计算 gap 维度。
7. `cacheProjectAnalysisSession()`。
8. `startInternalDimensionFillSession()` 和 `dispatchInternalDimensionFill()` 只填 gap 维度，并把 `existingRecipes`、`evolutionPrescreen` 注入内部 Agent prompt。

主要问题：增量扫描当前其实是 knowledge rescan，不是 file diff incremental。它会清理快照并全量分析代码，然后按 recipe audit/gap 决定维度。命名上仍混着 incremental、rescan、bootstrap snapshot。内部执行链路通过可选 `existingRecipes` 和 `evolutionPrescreen` 开启 rescan 模式，这会让 `InternalDimensionFillSessionRunner` 同时承担冷启动执行与增量补齐执行的上下文解释。

### 外部 Agent 增量扫描

入口：`runExternalIncrementalScanWorkflow()`。

当前链路：

1. 与内部增量扫描共享 rescan clean、sync、project analysis、audit、prescreen。
2. 按 `args.dimensions` 过滤维度。
3. `createExternalWorkflowSession()`。
4. `buildExternalMissionBriefing()`。
5. `buildExternalRescanEvidencePlan()` 生成 `allRecipes`、`dimensionGaps`、`occupiedTriggers`、gap summary。
6. 直接修改 `briefing.executionPlan.workflow`，把冷启动 briefing 改写为 rescan briefing。

主要问题：rescan briefing 不是独立产品，而是在 cold-start briefing 上事后 patch。`MissionBriefingBuilder` 本身并不知道 briefing profile，只能提供通用冷启动结构；rescan-specific evidence、workflow 文案、constraints 全在外部 workflow 中硬塞。这导致外部 Agent 任务协议缺少清晰的 `BriefingProfile` 边界。

## 当前实现的设计问题

### 代码证据索引

这次分析不是按文件大小排序，而是沿四条链路读实现后得到的职责边界：

| 实现位置 | 读到的真实职责 | 暴露的问题 |
| --- | --- | --- |
| `cold-start/internal/InternalColdStartWorkflow.ts` | full reset、项目分析、Dashboard skeleton、session cache、内部异步 fill 调度 | 冷启动 intent 与 response presenter、execution starter 还混在同一入口 |
| `cold-start/external/ExternalColdStartWorkflow.ts` | full reset、项目分析、external session、Mission Briefing | 只覆盖外部链路前半段，completion 仍留在 handler |
| `incremental-scan/internal/InternalIncrementalScanWorkflow.ts` | rescan clean、knowledge sync、recipe audit、prescreen、gap plan、内部 fill | knowledge rescan plan 与 Dashboard response、内部执行输入还混在入口 |
| `incremental-scan/external/ExternalIncrementalScanWorkflow.ts` | rescan plan、external session、briefing、evidence hints、workflow 文案覆写 | rescan briefing 是 cold-start briefing 的事后 patch |
| `common-capabilities/knowledge-rescan/KnowledgeRescanPlanner.ts` | sync、audit、prescreen、internal gap plan、external evidence plan | 同一个 planner 同时做领域计划和两种执行者投影 |
| `external/mcp/handlers/dimension-complete-external.ts` | 外部维度完成、recipe 绑定、skill 生成、checkpoint、progress、最终 delivery/wiki/panorama/semantic memory | 外部 completion 是核心 workflow，却仍在 MCP handler 层 |
| `common-capabilities/agent-execution/internal/InternalDimensionFillSessionRunner.ts` | restore checkpoint、incremental skip、rescan state、dimension run input、agent session、consumer wiring | 执行器靠可选字段推断 cold-start/rescan，缺显式 `DimensionExecutionPlan` |
| `common-capabilities/agent-execution/mission-briefing/MissionBriefingBuilder.ts` | 维度任务、evidence starters、项目摘要、execution plan、response budget | briefing 缺 profile，业务语义与压缩策略混合 |
| `common-capabilities/progress/reports/BootstrapReportSnapshotConsumer.ts` | report summary、report file/history、checkpoint cleanup、snapshot save、topology attach | report、snapshot、checkpoint、telemetry 副作用没有分层 |

### 1. Capability 仍然反向依赖 handler 层

`common-capabilities` 现在还多处引用 MCP handler helper/type：

- `KnowledgeRescanPlanner` 依赖 `bootstrap/shared/audit-helpers` 和 `evolution-prescreen`。
- `ProjectAnalysisViews` 依赖 `bootstrap/shared/panorama-utils`、`target-file-map`、`LanguageExtensions`。
- `ExternalMissionWorkflow` 依赖 `bootstrap/shared/session-helpers`。
- `BootstrapReportSnapshotConsumer` 与 file diff 能力引用 `#external/mcp/handlers/types.js`。

这说明 common capability 还不是基础能力层，而是把旧 handler helper 搬到了新目录后继续引用旧 adapter 层。目标应该是反过来：handler 只调用 workflow，workflow/common-capabilities 不能 import handler shared。

### 2. Project analysis 仍然承担分析外副作用

`ProjectAnalysisRunner` 已拆出 preparation/incremental/projection 的第一层，但它的 phase 函数仍然同时做分析和写入：

- Phase 1.6 会清理并写 CodeEntityGraph。
- Phase 1.7 会分析 call graph 并写 CodeEntityGraph。
- Phase 2 会把 dependency edges 写入 knowledge graph。
- Phase 3 会把 violations 写入 ViolationsStore。
- Phase 2.2 会 invalidate panorama 并计算结果。

这意味着它不是纯 `ProjectAnalysis`，而是 `ProjectAnalysis + GraphMaterialization + GuardPersistence + PanoramaRefresh`。后续不能只把函数拆小，而要把 phase 输出和 materialization 副作用分开。

### 3. 冷启动和文件快照增量语义冲突

内部冷启动默认 `incremental !== false`，但冷启动前会 full reset，并且项目分析还可能 clear snapshots。文件 diff 的 `IncrementalBootstrap.evaluate()` 在这个语境下很难真正复用历史快照。这个设计会让“冷启动”既说自己干净初始化，又试图复用历史执行结果。

结论：冷启动默认应该是 full build。文件快照优化应命名为 warm rebuild 或 file-diff scan，并归入 incremental-scan 的优化策略，而不是冷启动默认行为。

### 4. Knowledge rescan 与 File diff incremental 混用一个词

当前增量扫描核心是 recipe audit + gap fill。文件快照 diff 则是 `BootstrapSnapshot`/`IncrementalBootstrap` 用于跳过未变化维度。两者的决策对象不同：

- Knowledge rescan 判断“哪些知识需要验证/演进/补齐”。
- File diff 判断“哪些源码变更可能影响哪些维度”。

它们可以组合，但不能互相替代。最终维度执行集合应是：

```text
requestedDimensions ∩ (needsVerificationDims ∪ gapDims ∪ affectedByFileDiff)
```

每个维度还必须携带 reason：`recipe-decay`、`coverage-gap`、`file-change`、`manual-request`、`checkpoint-restored`。

### 5. Internal execution 仍然用隐式上下文切换模式

`InternalDimensionFillSessionRunner` 通过 `existingRecipes` 和 `evolutionPrescreen` 是否存在来进入 rescan-aware prompt。这个做法能跑，但语义不够清楚：执行器应该接收显式的 `DimensionExecutionPlan`，而不是从 view 上的可选字段推断生命周期。

目标输入应包含：

```ts
interface DimensionExecutionPlan {
  mode: 'cold-start' | 'rescan';
  dimensions: DimensionTaskPlan[];
  skippedDimensions: DimensionSkip[];
  recipeContext?: RescanRecipeContext;
  fileDiffContext?: FileDiffContext;
  terminalPolicy: TerminalPolicy;
}
```

### 6. External completion 未进入 workflow 层

`dimensionComplete()` 是外部 Agent 链路的真正后半段，但它仍然在 handler 内。它同时负责：

- 参数校验和 session 查找。
- 从 submission tracker 补全 referenced files / recipe IDs。
- 绑定 recipe 到 dimension。
- skillWorthy 维度生成 skill。
- mark session complete。
- 保存 checkpoint。
- 写 knowledge graph finding。
- 发 progress event。
- 全部完成后触发 delivery、delivery verification、panorama refresh、wiki、semantic memory consolidation。
- 返回 quality feedback、next actions、coverage warnings、evidence hints。

这是一个完整 workflow，不是 handler helper。它应迁入 `common-capabilities/agent-execution/external-completion` 或 `common-capabilities/completion`，再由 `cold-start/external` 和 `incremental-scan/external` 以不同 profile 调用。

### 7. Mission Briefing 缺少 profile 边界

`MissionBriefingBuilder` 现在同时做：

- 维度任务 enrich。
- evidence starters。
- AST 压缩。
- dependency/call/guard summary。
- architecture/technology/key abstraction 推断。
- execution plan 文案。
- must-cover modules。
- response size 压缩。

这些能力不是都属于“Mission Briefing 构建”。更重要的是，它没有区分 cold-start briefing 和 rescan briefing，导致 rescan workflow 事后改写 `executionPlan.workflow` 并注入 `evidenceHints`。应该引入 `BriefingProfile`：

```ts
type BriefingProfile = 'cold-start-external' | 'rescan-external';

interface BriefingPlan {
  profile: BriefingProfile;
  dimensionTasks: DimensionTask[];
  evidence: BriefingEvidence;
  executionInstructions: ExecutionInstructions;
  responseBudget: ResponseBudget;
}
```

### 8. Finalization 副作用重复且分散

内部执行完成后走 `InternalDimensionFillFinalizer`，外部全部完成后在 `dimensionComplete()` 内触发 delivery/wiki/panorama/semantic memory。两条链路最终副作用类似，但实现分散，顺序和失败策略不统一。

目标应该有统一 `WorkflowCompletionFinalizer`：

- checkpoint cleanup。
- report write/history。
- snapshot save。
- semantic memory consolidation。
- delivery/wiki/panorama refresh。
- delivery verification。

internal 和 external completion 都只提供 execution result，finalizer 根据 profile 决定启用哪些副作用。

## 三个目录的目标职责

### `cold-start/`

职责：表达“干净初始化知识库”的入口 preset。

它应该包含：

- `internal/InternalColdStartWorkflow.ts`：组合冷启动策略与内部执行。
- `external/ExternalColdStartWorkflow.ts`：组合冷启动策略与外部任务发放。
- `ColdStartPlan.ts`：冷启动维度计划和 response contract，不做 rescan/gap/evolution。
- `ColdStartPresenters.ts`：Dashboard 骨架与 MCP briefing 的响应视图。

它不应该包含：

- recipe audit。
- evolution prescreen。
- file diff incremental 默认逻辑。
- report/snapshot/delivery 实现。
- handler-local envelope 细节。

内部冷启动目标链路：

```text
Adapter args
  -> ColdStartIntent
  -> FullResetPolicy
  -> ProjectAnalysisCapability(full, materialize graphs)
  -> ColdStartDimensionPlan(all active dimensions)
  -> ProjectSnapshotWriter/cache
  -> InternalDimensionExecution.start(plan)
  -> DashboardSkeletonPresenter
```

外部冷启动目标链路：

```text
Adapter args
  -> ColdStartIntent
  -> FullResetPolicy
  -> ProjectAnalysisCapability(full, materialize graphs)
  -> ColdStartDimensionPlan(all active dimensions)
  -> ExternalSession.start(snapshot, plan)
  -> MissionBriefingBuilder(profile=cold-start-external)
  -> McpBriefingPresenter
```

### `incremental-scan/`

职责：表达“已有知识库的验证、演进、补齐”的入口 preset。

它应该包含：

- `internal/InternalIncrementalScanWorkflow.ts`：组合 knowledge rescan plan 与内部执行。
- `external/ExternalIncrementalScanWorkflow.ts`：组合 knowledge rescan plan 与外部 briefing。
- `IncrementalScanPlan.ts`：将 recipe audit、gap、file diff、manual dimensions 合成为最终执行计划。
- `IncrementalScanPresenters.ts`：内部 Dashboard rescan 骨架、外部 rescan briefing 响应。

它不应该包含：

- 冷启动 full reset。
- 将 Mission Briefing 先构造成 cold-start 再 patch。
- 直接操作 candidate/skill/report/snapshot 细节。

内部增量扫描目标链路：

```text
Adapter args
  -> IncrementalScanIntent
  -> RecipeSnapshotPolicy
  -> RescanCleanPolicy
  -> KnowledgeSyncCapability
  -> ProjectAnalysisCapability(full or file-diff-assisted)
  -> KnowledgeRelevanceAudit
  -> EvolutionPrescreen
  -> CoverageGapPlanner
  -> FileDiffPlanner(optional)
  -> IncrementalScanPlan.combine()
  -> InternalDimensionExecution.start(plan)
  -> DashboardRescanSkeletonPresenter
```

外部增量扫描目标链路：

```text
Adapter args
  -> IncrementalScanIntent
  -> shared rescan plan chain
  -> ExternalSession.start(snapshot, plan)
  -> MissionBriefingBuilder(profile=rescan-external)
  -> RescanBriefingPresenter
```

### `common-capabilities/`

职责：提供不带入口语义的能力。能力可以有副作用，但副作用必须写在类型/函数名里。

建议目标子域：

```text
common-capabilities/
  project-analysis/
    ProjectScanner.ts              # 只产出 scan result，不写 DB
    ProjectGraphMaterializer.ts     # 把 AST/dep/call 写入 graph repo
    GuardAuditRunner.ts             # 只跑 guard
    GuardViolationWriter.ts         # 写 ViolationsStore
    PanoramaAnalysisRunner.ts       # 只计算 panorama
    ProjectAnalysisSnapshot.ts      # DTO/projector

  cleanup/
    CleanupPolicies.ts              # full reset/rescan clean/preserve snapshots
    CleanupPlan.ts                  # 明确会删哪些状态

  planning/
    ColdStartDimensionPlanner.ts
    KnowledgeRescanPlanner.ts
    FileDiffPlanner.ts
    DimensionExecutionPlanner.ts
    ExecutionReason.ts

  agent-execution/
    internal/
      InternalDimensionExecution.ts
      InternalDimensionPreparation.ts
      InternalDimensionSessionRunner.ts
      InternalDimensionFinalizerAdapter.ts
    external/
      ExternalSessionWorkflow.ts
      ExternalMissionBriefingWorkflow.ts
      ExternalDimensionCompletionWorkflow.ts
      ExternalCompletionResult.ts

  briefing/
    BriefingPlanBuilder.ts
    EvidenceStarterBuilder.ts
    AstBriefingCompressor.ts
    GraphBriefingSummarizer.ts
    ArchitectureBriefingSummarizer.ts
    BriefingResponseBudget.ts

  progress/
    WorkflowSessionStore.ts
    DimensionCheckpointStore.ts
    WorkflowReportWriter.ts
    WorkflowSnapshotStore.ts

  completion/
    WorkflowCompletionFinalizer.ts
    DeliveryFinalizer.ts
    SemanticMemoryFinalizer.ts
    WikiFinalizer.ts
```

## 链路升级设计

### 1. 引入 intent 与 plan，替代可选字段推断

每个入口先构造 intent：

```ts
interface WorkflowIntent {
  lifecycle: 'cold-start' | 'incremental-scan';
  executor: 'internal-agent' | 'external-agent';
  projectRoot: string;
  dataRoot: string;
  requestedDimensions?: string[];
  sourceTag: string;
}
```

然后构造 plan：

```ts
interface WorkflowPlan {
  intent: WorkflowIntent;
  projectAnalysis: ProjectAnalysisPlan;
  dimensions: DimensionExecutionPlan;
  response: ResponseContract;
  completion: CompletionPolicy;
}
```

执行器只消费 `DimensionExecutionPlan`，不再通过 `existingRecipes` 是否存在判断自己处于 rescan。

### 2. Project analysis 拆成 scan 与 materialize

目标不是把 `ProjectAnalysisRunner.ts` 继续切小，而是明确两种行为：

- scan：读取代码、生成 AST/dep/call/guard/panorama 数据。
- materialize：把分析结果写入 CodeEntityGraph、knowledge edges、ViolationsStore、Panorama cache。

这样 cold-start 和 incremental-scan 可以明确选择：

```ts
ProjectAnalysisCapability.run({
  scan: { maxFiles, skipGuard, generateAstContext },
  materialize: { codeEntityGraph: true, dependencyEdges: true, violations: true, panorama: true },
});
```

后续 file-diff 优化也可以只对变更文件做局部 scan，再选择局部 materialize。

### 3. Rescan plan 统一 internal/external 差异

当前 `KnowledgeRescanPlanner` 既生成 internal gap plan，又生成 external evidence plan。建议拆成两层：

- `KnowledgeRescanPlanBuilder`：只生成领域 plan。
- `InternalRescanPromptContextProjector`：把 plan 投影成内部 Agent prompt 所需 existing recipes。
- `ExternalRescanBriefingProjector`：把 plan 投影成 external evidence hints。

领域 plan 示例：

```ts
interface KnowledgeRescanPlan {
  recipeSnapshot: RecipeSnapshotSummary;
  audit: RelevanceAuditSummary;
  prescreen: EvolutionPrescreen;
  coverage: DimensionCoverage[];
  gaps: DimensionGap[];
  occupiedTriggers: string[];
  executionReasons: Record<string, ExecutionReason[]>;
}
```

### 4. Mission Briefing 引入 profile

不要在 `ExternalIncrementalScanWorkflow` 里改写 cold-start briefing。目标是：

```ts
buildMissionBriefing({ profile: 'cold-start-external', ... })
buildMissionBriefing({ profile: 'rescan-external', rescanPlan, ... })
```

内部拆分：

- `DimensionTaskBriefingBuilder`：维度任务、SOP、submission spec。
- `EvidenceStarterBuilder`：AST/Guard/DepGraph/CallGraph/Panorama 起点。
- `ProjectContextBriefingBuilder`：architecture、technology stack、key abstractions、mustCoverModules。
- `BriefingCompressionPolicy`：100KB 响应预算，不参与业务语义。
- `ExecutionInstructionBuilder`：cold-start workflow / rescan workflow 文案。

### 5. 外部 completion 迁出 handler，统一最终副作用

新增：

```text
common-capabilities/agent-execution/external/ExternalDimensionCompletionWorkflow.ts
common-capabilities/completion/WorkflowCompletionFinalizer.ts
```

handler 只做：

```ts
export async function dimensionComplete(ctx, args) {
  return envelope(await runExternalDimensionCompletionWorkflow(ctx, args));
}
```

completion workflow 负责单维完成；finalizer 负责全部维度完成后的统一副作用。这样 internal/external 可以共享 delivery/wiki/panorama/semantic memory 的失败策略和日志格式。

### 6. Progress/report/snapshot 命名去 bootstrap 化

保留兼容导出可以，但新逻辑不应继续扩展 `BootstrapReportSnapshotConsumer` 这类命名。建议逐步替换为：

- `WorkflowReportWriter`
- `WorkflowReportHistoryStore`
- `WorkflowSnapshotStore`
- `DimensionCheckpointStore`
- `WorkflowCompletionSummary`

其中 `report` 与 `snapshot` 是两个能力：report 是给人和 Dashboard 看的执行摘要，snapshot 是给后续 file diff / checkpoint restore 用的机器状态。

## 迁移顺序

### P0：冻结语义，不再扩大 bootstrap 命名

目标：停止在新代码中继续增加 bootstrap 语义债。

- 新增 `docs-dev/workflows-chain-redesign.md`。
- 后续新增模块使用 workflow/rescan/cold-start/dimension-execution 命名。
- 保留旧导出兼容，但不在新设计中继续引用 handler helper。

验收：新增设计或实现不再以“文件变小”为目标，而以 intent/plan/capability 边界为目标。

### P1：抽 workflow intent / plan / presenter

目标：让四个入口先变成“构造 intent -> 调用 use case -> presenter”。

建议文件：

- `cold-start/ColdStartIntent.ts`
- `cold-start/ColdStartPlan.ts`
- `cold-start/ColdStartPresenters.ts`
- `incremental-scan/IncrementalScanIntent.ts`
- `incremental-scan/IncrementalScanPlan.ts`
- `incremental-scan/IncrementalScanPresenters.ts`

验收：入口 workflow 中不再手写大段 response object，不再直接拼 mission/rescan 文案。

### P2：ProjectAnalysis scan/materialize 分离

目标：项目分析能力不再隐藏写 DB/清理/panorama invalidation。

建议步骤：

1. 定义 `ProjectAnalysisSnapshot` DTO。
2. `runPhase1_6_EntityGraph` 分为 `buildEntityGraphInput` 与 `materializeEntityGraph`。
3. `runPhase2_DependencyGraph` 分为 `collectDependencyGraph` 与 `writeDependencyEdges`。
4. `runPhase3_GuardAudit` 分为 `runGuardAudit` 与 `writeViolationRuns`。
5. `Panorama` 变成显式 materializer。

验收：`ProjectAnalysisCapability.run()` 的参数能清楚声明哪些副作用会发生。

### P3：Rescan plan 领域化

目标：internal/external rescan 共享同一领域 plan，不共享投影形状。

状态：已完成第一轮落地。`KnowledgeRescanPlanBuilder` 负责领域计划，`RescanEvidenceProjectors` 负责 internal/external 投影，两个增量扫描入口都从同一个 `KnowledgeRescanPlan` 派生执行维度、gap、evidence hints 与 execution reasons。

建议步骤：

1. `KnowledgeRescanPlanner` 拆为 `KnowledgeRescanPlanBuilder`、`RescanCoveragePlanner`、`RescanEvidenceProjectors`。
2. 把 `TARGET_RECIPES_PER_DIMENSION` 变成 plan policy，不是模块常量硬编码。
3. 加入 `ExecutionReason`，每个维度明确为什么执行/跳过。
4. 为 file diff 预留组合点，但不让 file diff 跳过需要 audit 的 recipe。

已落地：

- `KnowledgeRescanPlanBuilder` 统一计算 requested/skipped dimensions、coverage、gap、decay-only execution、occupied triggers 与 `ExecutionReason`。
- `RescanEvidenceProjectors` 提供 `projectInternalRescanGapPlan()`、`projectInternalRescanPromptRecipes()`、`projectExternalRescanEvidencePlan()`。
- 内部 rescan 不再只以 coverage gap 作为执行维度，`recipe-decay` 和后续 `file-change` 也能进入 `executionDimensions`。
- 外部 rescan evidence hints 带 `executionReasons`，与 internal gap plan 来自同一个领域 plan。
- 兼容 facade `KnowledgeRescanPlanner` 保留 sync、audit、prescreen 与旧函数导出，便于后续继续下沉 handler 依赖。

验收：内部 rescan 和外部 rescan 都从同一 `KnowledgeRescanPlan` 派生输出。

### P4：External completion 进入 workflow

目标：外部链路前后闭环都在 workflows 下。

状态：已完成第一轮落地。`dimension-complete-external.ts` 现在只做 envelope 适配，单维完成链路迁入 `ExternalDimensionCompletionWorkflow`，最后一个维度完成后的 delivery/wiki/panorama/semantic memory 副作用迁入 `WorkflowCompletionFinalizer`。Skill 生成也迁到 `WorkflowSkillCompletionCapability`，内部/外部 skill 生成不再依赖 MCP handler shared helper。

建议步骤：

1. 从 `dimension-complete-external.ts` 抽参数校验与 session lookup。
2. 抽 `ExternalRecipeBindingCapability`。
3. 抽 `ExternalSkillCompletionCapability`。
4. 抽 `ExternalDimensionProgressCapability`。
5. 抽 `WorkflowCompletionFinalizer` 复用 delivery/wiki/panorama/semantic memory。

已落地：

- `ExternalDimensionCompletionWorkflow` 负责参数校验、session lookup、tracker 自动恢复 submitted recipes / referenced files、recipe 绑定、skill 生成、checkpoint、progress event、quality feedback、evidence hints 与 response projection。
- `WorkflowCompletionFinalizer` 接管全部维度完成后的 Cursor delivery、DeliveryVerifier、Panorama refresh、Wiki generation 与 Semantic Memory consolidation，并保持原有 non-blocking 失败策略。
- `WorkflowSkillCompletionCapability` 承载 skill 质量门控、内容构建、项目级 `SKILL.md` 写入和 editor index 更新，供内部 fill 与外部 completion 共用。
- `dimension-complete-external.ts` 缩为 MCP compatibility adapter：`envelope(await runExternalDimensionCompletionWorkflow(ctx, args))`。
- 新增 focused 单测覆盖 validation envelope、session missing、tracker 自动恢复并完成维度的 happy path。

验收：handler 文件只剩兼容导出/envelope；外部冷启动与外部增量扫描通过统一 session completion workflow 收尾。显式 profile 文案继续由 P5 Mission Briefing profile 化处理。

### P5：Mission Briefing profile 化

目标：cold-start briefing 和 rescan briefing 不是 patch 关系，而是同一个 builder 的两个 profile。

状态：已完成第一轮落地。

建议步骤：

1. 定义 `BriefingProfile`：`cold-start-external` / `rescan-external`，并用 `createBriefingPlan()` 校验 profile 与 rescan evidence 的组合。
2. 抽 `ExecutionInstructionBuilder`：统一构造 tier execution plan，由 profile 决定 cold-start / rescan workflow 文案。
3. 抽 `EvidenceStarterBuilder`：维度级 AST / Guard / DepGraph / CallGraph / Panorama evidence starters 从 `MissionBriefingBuilder` 移出，内部 Agent runtime 也改为复用该能力。
4. 抽 `RescanEvidenceProjector`：将 `ExternalRescanEvidencePlan + prescreen` 投影为 briefing `evidenceHints`，不再放在 incremental presenter 中 patch。
5. 抽 `BriefingCompressionPolicy`：100KB response budget 与渐进式压缩策略从业务 builder 中分离。

已落地：

- `ExternalColdStartWorkflow` 显式传入 `profile: 'cold-start-external'`。
- `ExternalIncrementalScanWorkflow` 显式传入 `profile: 'rescan-external'` 和 `{ evidencePlan, prescreen }`。
- `MissionBriefingBuilder` 根据 profile 生成 execution plan 与 rescan evidence hints，并统一应用 response budget。
- `IncrementalScanPresenters` 不再包含 `applyExternalIncrementalScanBriefingPresentation()`。
- 新增 focused 单测覆盖 cold-start 默认 profile、rescan profile evidence hints、缺失 rescan context 的校验、response budget 压缩，以及 rescan workflow 不再 patch execution plan。

验收：`ExternalIncrementalScanWorkflow` 不再直接修改 `briefing.executionPlan.workflow`。

### P6：统一 finalization 与 report/snapshot

目标：内部和外部完成后的副作用策略一致、可测、可替换。

状态：已完成第一轮落地。

建议步骤：

1. `InternalDimensionFillFinalizer` 改为调用 `WorkflowCompletionFinalizer`，并用 immediate semantic memory mode 返回 consolidation result 继续写入 report。
2. `ExternalDimensionCompletionWorkflow` 已在最后一个维度完成时调用同一个 finalizer，默认使用 scheduled semantic memory mode。
3. `BootstrapReportSnapshotConsumer` 已拆为 report writer、history store、snapshot store、checkpoint cleanup 四个模块。
4. 旧 consumer 保留兼容 facade 与 re-export，现有 `buildBootstrapReport()` / `writeBootstrapReport()` / `consumeBootstrapReportAndSnapshot()` 调用不需要同步迁移。

已落地：

- `WorkflowCompletionFinalizer` 统一定义 delivery → delivery verification → panorama refresh → wiki trigger → semantic memory trigger 的顺序，并保留 non-blocking 失败策略。
- internal fill 不再直接调用 `consumeBootstrapDeliveryAndWiki()` / `consumeBootstrapSemanticMemory()`。
- report 写入、history index、snapshot 保存、checkpoint cleanup 拆成独立可替换模块。
- 新增 focused 单测覆盖 finalizer 顺序、scheduled/immediate semantic memory 边界、internal finalizer 委托，以及 report/snapshot facade 兼容性。

验收：delivery/wiki/panorama/semantic memory 的触发顺序和 non-blocking 失败策略在一个地方定义。

## 模块命名规则

为了避免再次变成“目录搬家”，后续新增模块应遵守：

- 文件名表达领域动作或领域产物，不表达历史来源：`KnowledgeRescanPlanBuilder` 优于 `BootstrapRescanState`。
- 输入输出是 DTO，不直接透传 handler ctx：`WorkflowContext`、`ProjectAnalysisSnapshot`、`DimensionExecutionPlan`。
- capability 函数名包含副作用动词：`writeDependencyEdges`、`saveWorkflowSnapshot`、`emitDimensionProgress`。
- projector/presenter 只做形状转换，不访问 DB。
- runner/orchestrator 只编排，不构造大型响应对象。

## 验收标准

下一阶段拆分是否合格，不看文件数量，而看这些标准：

- 四个入口的生命周期语义明确：cold-start 不默认 file diff incremental，incremental-scan 必有 recipe audit/gap 计划。
- common-capabilities 不再 import `lib/external/mcp/handlers/**` 的 shared helper 或 types。
- `ProjectAnalysis` 能声明是否写 graph/violations/panorama。
- `DimensionExecutionPlan` 显式携带 mode、execution reasons、skipped reasons。
- 外部 Agent 完成链路不再停留在 handler 层。
- rescan briefing 由 profile 生成，不是 cold-start briefing 事后 patch。
- report、snapshot、checkpoint cleanup、delivery/wiki/panorama finalization 可以单测。
- 保持四个既有入口响应兼容，迁移期间通过 presenter/adapters 适配旧 shape。

## 建议下一步

下一刀不应该继续拆 `MissionBriefingBuilder` 的大小，而应该先做 P1：抽 intent/plan/presenter。这样四个入口的职责会先收敛，后续再拆 ProjectAnalysis、Mission Briefing、External Completion 时才有稳定的领域输入输出。否则继续从底层大文件下手，会缺少上层语义牵引，容易再次变成机械拆分。