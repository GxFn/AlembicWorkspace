# Workflows 主链路重整落地方案

> 本文是 P1-P6 后的新基线文档。它不替代 `docs-dev/workflows-chain-redesign.md` 的历史记录，而是重新从当前真实代码反推功能链路，定义下一轮目录、命名、冗余清理和落地顺序。

## 目标

当前 `lib/workflows/` 已经完成四个公开入口与多组 common capability 的第一轮拆分，但实现仍有三个问题：

1. 主链路与附属能力混在同一层级：`agent-execution` 同时放外部 briefing、内部 fill、skill 生成、dimension complete；`progress/reports` 同时放 report、history、snapshot、checkpoint cleanup。
2. 旧 bootstrap 语义仍穿透新目录：`BootstrapSession`、`BootstrapSnapshot`、`IncrementalBootstrap`、`fillDimensionsV3`、`BootstrapReportSnapshotConsumer` 等名字已经不能准确表达 cold-start 与 rescan 共用的职责。
3. common capability 仍反向依赖 handler helper/type：workflow 层尚未彻底从 `#external/mcp/handlers/*` 的 adapter 形状中解耦。

下一轮重构的目标不是继续零散拆文件，而是把 workflow 分为两层：

- 主功能链路：表达用户可感知的生命周期、执行者、计划、执行、完成和结果持久化。
- 附属能力：提供主链路调用的可替换能力，不决定业务入口，不构造协议 envelope，不引用 handler helper。

## 当前真实主链路

### 链路 1：内部 Agent 冷启动

入口：`lib/external/mcp/handlers/bootstrap-internal.ts` 兼容导出 `bootstrapKnowledge`，真实实现为 `runInternalColdStartWorkflow()`。

真实流程：

1. `createInternalColdStartIntent()` 解析调用参数，并显式忽略 cold-start 中的 file-diff incremental。
2. `buildColdStartWorkflowPlan()` 生成 cleanup/project-analysis 计划。
3. `runFullResetPolicy()` 清理知识库、运行时缓存和衍生文件。
4. `ProjectAnalysisCapability.run()` 执行 prepare/scan/materialize，得到文件、AST、Code Entity、Call Graph、Dependency Graph、Panorama、Guard、active dimensions。
5. `buildProjectSnapshot()` 固化项目分析结果。
6. presenter 构造 Dashboard/内部工具响应骨架，`cacheProjectAnalysisSession()` 缓存 snapshot 视图。
7. `startInternalDimensionFillSession()` 创建内部任务会话。
8. `dispatchInternalDimensionFill()` 异步调用 `fillDimensionsV3()`。
9. `InternalDimensionFillPipeline` 准备运行态、执行内部 Agent session、消费 candidates/skills/relations。
10. `runWorkflowCompletionFinalizer()` 执行 delivery verification、panorama refresh、wiki trigger、semantic memory consolidation。
11. `persistWorkflowResult()` 写 report/history、清 checkpoint、保存 snapshot。

主链判断：这是一个完整自动化链路。用户触发后，系统负责从空状态构建知识、补齐维度、生成结果并完成收尾。

### 链路 2：外部 Agent 冷启动

入口：`lib/external/mcp/handlers/bootstrap-external.ts` 兼容导出 `bootstrapExternal`，真实实现为 `runExternalColdStartWorkflow()`。

真实流程：

1. `createExternalColdStartIntent()` 与 `buildColdStartWorkflowPlan()` 定义冷启动计划。
2. `runFullResetPolicy()` 做全量清理。
3. `ProjectAnalysisCapability.run()` 做完整项目分析。
4. `buildProjectSnapshot()` 固化 snapshot。
5. `createExternalWorkflowSession()` 创建外部 session 并缓存 snapshot。
6. `buildExternalMissionBriefing({ profile: 'cold-start-external' })` 构造 Mission Briefing。
7. 外部 IDE Agent 根据 briefing 调用 submit 工具提交知识。
8. `dimensionComplete()` handler 适配到 `runExternalDimensionCompletionWorkflow()`。
9. dimension completion 绑定 recipe、生成 skill、保存 checkpoint、更新 session、发 progress event、返回下一步 hints。
10. 最后一个维度完成后调用 `runWorkflowCompletionFinalizer({ semanticMemory: { mode: 'scheduled' } })`。

主链判断：这不是单次函数调用完成的链路，而是“任务发放 + 多次维度完成 + 最终收尾”的跨调用 workflow。`ExternalMissionWorkflow` 和 `ExternalDimensionCompletionWorkflow` 必须被视为同一主链路的两个阶段。

### 链路 3：内部 Agent 知识增量扫描

入口：`lib/external/mcp/handlers/rescan-internal.ts` 兼容导出 `rescanInternal`，真实实现为 `runInternalKnowledgeRescanWorkflow()`。

真实流程：

1. `createInternalKnowledgeRescanIntent()` 解析维度过滤和 rescan 参数。
2. `buildKnowledgeRescanWorkflowPlan()` 生成 rescan clean 与 project-analysis 计划。
3. `runRescanCleanPolicy()` 保存现有 recipe 快照，并清理候选、skills/wiki、semantic memories、code entities、bootstrap snapshots 等衍生缓存。
4. `syncKnowledgeStoreForRescan()` 恢复 recipe 文件与 DB 一致性。
5. `ProjectAnalysisCapability.run()` 全量重扫项目上下文。
6. `auditRecipesForRescan()` 对已有 recipe 做 relevance audit。
7. `buildKnowledgeRescanPlan()` 形成领域计划：requested dimensions、gap dimensions、execution reasons、occupied triggers、decaying recipes。
8. `buildRescanPrescreen()` 形成 auto-resolved/needs-verification/gap 的前置过滤。
9. `projectInternalRescanGapPlan()` 与 `projectInternalRescanPromptRecipes()` 投影为内部 Agent 输入。
10. `startInternalDimensionExecutionSession()` 与 `dispatchInternalDimensionExecution()` 只对 gap/execution dimensions 执行内部维度执行。
11. 内部执行完成后复用 cold-start 的 completion finalizer 与 report/snapshot 持久化。

主链判断：这条链路不是文件 diff incremental，而是 knowledge rescan。它的核心语义是“保留已有知识，验证衰退，补齐缺口”。`incremental-scan` 目录名可以继续作为兼容入口，但内部领域名应转为 `knowledge-rescan`。

### 链路 4：外部 Agent 知识增量扫描

入口：`lib/external/mcp/handlers/rescan-external.ts` 兼容导出 `rescanExternal`，真实实现为 `runExternalKnowledgeRescanWorkflow()`。

真实流程：

1. 与内部 rescan 共用 rescan clean、knowledge sync、project analysis、recipe audit、KnowledgeRescanPlan。
2. `projectExternalRescanEvidencePlan()` 投影 dimension gaps、all recipes、occupied triggers、execution reasons。
3. `createExternalWorkflowSession()` 创建外部 session。
4. `buildExternalMissionBriefing({ profile: 'rescan-external', rescan })` 构造 rescan profile briefing。
5. 外部 IDE Agent 按 briefing 执行 evolve、gap-fill、dimension_complete。
6. dimension completion 与外部冷启动共用 `runExternalDimensionCompletionWorkflow()` 和 completion finalizer。

主链判断：这条链路的开始阶段与内部 rescan 共享领域计划，执行阶段与外部 cold-start 共享 session/briefing/completion contract。它应在目录结构上同时体现 `knowledge-rescan` lifecycle 和 `external-agent` executor。

## 主链路边界

统一主链可以抽象为：

```text
Protocol Adapter
  -> Workflow Intent
  -> Workflow Plan
  -> Cleanup Policy
  -> Project Intelligence Snapshot
  -> Lifecycle Domain Plan
  -> Execution Contract
  -> Dimension Execution / Completion
  -> Workflow Finalization
  -> Result Persistence
  -> Presenter / Response
```

必须留在主链路中的职责：

- lifecycle intent：cold-start 与 knowledge-rescan 的业务语义。
- executor intent：internal-agent 自动执行与 external-agent 任务发放/回填。
- cleanup policy：full reset、rescan clean、未来 preserve snapshots。
- project intelligence：项目分析结果的统一 snapshot。
- domain plan：cold-start dimensions、KnowledgeRescanPlan、未来 FileDiffPlan。
- execution contract：内部 dimension execution session 或外部 Mission Briefing/session contract。
- completion gate：外部维度完成、内部 session 完成、最终 finalizer。
- persistence boundary：report、snapshot、checkpoint cleanup、history index。

必须下沉为附属能力的职责：

- MCP/HTTP envelope、handler alias、Dashboard response adapter。
- language extension text、submission schema text、Mission Briefing 压缩策略。
- evidence starter、rescan evidence hints、quality feedback 文案。
- task manager session、external session storage、session cache。
- checkpoint save/restore 的文件布局细节。
- skill content generation、skill index rebuild。
- delivery/wiki/panorama/semantic memory 的具体实现。
- report JSON 字段拼装、history index 写入、snapshot 表结构。
- terminal toolset policy、mock pipeline、agent prompt input builder。

边界规则：主链路可以选择和排序能力；附属能力只能接受 typed input 并返回 typed result，不能反向决定入口类型，不能 import handler helper。

## 当前层级与命名问题

| 当前位置 | 当前真实职责 | 问题 | 目标处理 |
| --- | --- | --- | --- |
| `incremental-scan/*` | knowledge rescan 入口 | 名字暗示 file diff incremental，但实现是 recipe audit/gap-fill | 新增 `knowledge-rescan/*` 目标目录，旧目录做兼容 re-export |
| `common-capabilities/agent-execution/ExternalMissionWorkflow.ts` | external session + briefing facade | 仍 import handler session helper 与 LanguageExtensions | 拆为 external session capability 与 briefing presenter capability |
| `common-capabilities/agent-execution/external/ExternalDimensionCompletionWorkflow.ts` | 外部维度完成主链阶段 | 放在 `agent-execution/external` 下合理，但内部含 session lookup、recipe binding、skill、checkpoint、quality、finalizer 多种附属能力 | 保持主 orchestrator，提取 `ExternalCompletion*` 子能力 |
| `common-capabilities/agent-execution/InternalDimensionFillWorkflow.ts` | 内部任务会话和异步调度 facade | import handler `async-fill-helpers` | 迁出 task helper 到 workflow capability，改名为 `InternalDimensionExecutionWorkflow` |
| `common-capabilities/agent-execution/internal/InternalDimensionFillPipeline.ts` | 内部 Agent dimension execution orchestrator | `fillDimensionsV3` 是历史名，只表达实现版本 | 新增 `runInternalDimensionExecution()`，旧导出保留一轮兼容 |
| `common-capabilities/project-analysis/ProjectAnalysisRunner.ts` | 项目分析 + materialization + incremental evaluation | 日志/类型仍是 bootstrap，且部分写入副作用在 runner 内 | 目标名 `project-intelligence`，把 materialization 与 file diff plan 显式化 |
| `common-capabilities/project-analysis/ProjectAnalysisRunPreparation.ts` | path guard + clear checkpoints/snapshots | analysis preparation 不应清 execution persistence | cleanup/persistence policy 负责清理，analysis 只做 guard setup |
| `common-capabilities/file-diff/BootstrapSnapshot.ts` | 文件指纹、维度引用文件与 diff snapshot store | 旧 bootstrap 名称仍作为真实实现暴露 | D7 已改为 `FileDiffSnapshotStore`，旧路径只保留兼容 re-export |
| `common-capabilities/file-diff/IncrementalBootstrap.ts` | snapshot file diff planner + snapshot writer facade | 名字混淆 cold-start incremental 与 rescan | D7 已改为 `FileDiffPlanner`，snapshot 写入边界由 `WorkflowSnapshotStore` 调用 |
| `common-capabilities/progress/session/BootstrapSession.ts` | external workflow session manager | 不是只服务 bootstrap，也服务 rescan | 改名 `ExternalWorkflowSession` / `ExternalWorkflowSessionManager` |
| `common-capabilities/progress/reports/BootstrapReport*` | workflow report/history/snapshot persistence | D5 已拆为 workflow 命名，D6 已删除旧兼容 facade | 保留 runtime 文件名兼容，代码入口使用 `WorkflowReport*` / `WorkflowResultPersistence` |
| `common-capabilities/delivery/BootstrapDeliveryConsumer.ts` | delivery/wiki legacy consumer | 已被 `WorkflowCompletionFinalizer` 替代，D6 已删除 | 测试迁到 completion step |
| `BootstrapSemanticMemoryConsumer.ts` | internal legacy semantic memory consumer | finalizer semantic memory step 已承接生产链路，D6 已删除 | 测试迁到 `SemanticMemoryCompletionStep` |

## 目标目录与文件命名

目标不是一次性重命名整个树，而是先引入准确命名的目标模块，再用 re-export 兼容旧 import。

```text
lib/workflows/
  cold-start/
    ColdStartIntent.ts
    ColdStartPlan.ts
    ColdStartPresenters.ts
    internal/InternalColdStartWorkflow.ts
    external/ExternalColdStartWorkflow.ts

  knowledge-rescan/
    KnowledgeRescanIntent.ts
    KnowledgeRescanWorkflowPlan.ts
    KnowledgeRescanPresenters.ts
    internal/InternalKnowledgeRescanWorkflow.ts
    external/ExternalKnowledgeRescanWorkflow.ts

  capabilities/
    cleanup/
      WorkflowCleanupPolicies.ts

    project-intelligence/
      ProjectIntelligenceCapability.ts
      ProjectIntelligenceRunner.ts
      ProjectIntelligencePreparation.ts
      ProjectIntelligenceMaterializer.ts
      ProjectIntelligenceViews.ts
      FileDiffPlanner.ts

    knowledge-planning/
      KnowledgeRescanPlanBuilder.ts
      KnowledgeRescanEvidenceProjectors.ts
      RecipeRelevanceAuditAdapter.ts
      KnowledgeSyncBoundary.ts

    execution/
      internal-agent/
        InternalDimensionExecutionWorkflow.ts
        InternalDimensionExecutionPipeline.ts
        InternalDimensionExecutionPreparation.ts
        InternalDimensionExecutionSessionRunner.ts
        InternalDimensionExecutionFinalizer.ts
        InternalDimensionExecutionTypes.ts
        agent-runs/
        consumers/
        context/
        projections/
      external-agent/
        ExternalWorkflowSession.ts
        ExternalWorkflowSessionManager.ts
        ExternalMissionWorkflow.ts
        ExternalDimensionCompletionWorkflow.ts
        completion/
          ExternalCompletionInput.ts
          ExternalCompletionSessionResolver.ts
          ExternalCompletionRecipeBinder.ts
          ExternalCompletionCheckpointWriter.ts
          ExternalCompletionFeedbackBuilder.ts
        mission-briefing/

    completion/
      WorkflowCompletionFinalizer.ts
      DeliveryCompletionStep.ts
      PanoramaCompletionStep.ts
      WikiCompletionStep.ts
      SemanticMemoryCompletionStep.ts

    persistence/
      checkpoint/DimensionCheckpointStore.ts
      reports/WorkflowReportTypes.ts
      reports/WorkflowReportWriter.ts
      reports/WorkflowReportHistoryStore.ts
      snapshots/WorkflowSnapshotStore.ts
      WorkflowResultPersistence.ts

    presentation/
      LanguageExtensionBuilder.ts
      TargetFileMapBuilder.ts
      PanoramaSummaryPresenter.ts
```

兼容策略：

- `common-capabilities/*` 可以先保留为旧路径 facade，逐步 re-export 到 `capabilities/*`。
- `incremental-scan/*` 可以先 re-export `knowledge-rescan/*`，保持 MCP handler 与现有测试不变。
- runtime 文件名如 `.asd/bootstrap-report.json`、`.asd/bootstrap-checkpoint`、DB 表 `bootstrap_snapshots` 可以先不改。代码命名先语义化，磁盘/DB schema 作为兼容存储格式保留。

## 冗余合并与清理清单

### 第一类：可立即合并为 facade

- `BootstrapReportSnapshotConsumer.ts`：D5 后已经只是兼容导出，测试已改到 `WorkflowResultPersistence.ts` / `WorkflowReportWriter.ts`。D6 删除旧 facade。
- `fillDimensionsV3` default export：新增 `runInternalDimensionExecution()`，旧函数只调用新函数并标注兼容。
- `planInternalRescanGaps()` 与 `buildExistingRecipesForInternalFill()`：统一归入 `knowledge-planning` 的 projector 命名，减少 planner 文件里的历史 helper 名称。

### 第二类：需要先抽 typed DTO

- `IncrementalPlan`、`BootstrapFile`、`DimensionCheckpointResult` 当前多处从 `#external/mcp/handlers/types.js` 引入。先迁到 workflow/domain types，再改 import。
- `BootstrapSession` 当前由 handler shared `getOrCreateSessionManager()` 管理。先把 session manager 移到 workflow capability，再让 handler shared 反向 re-export。
- `LanguageExtensions`、`TargetClassifier`、`target-file-map`、`panorama-utils` 当前在 handler 目录下被 capability 反向引用。先迁入 `capabilities/presentation` 或 `project-intelligence/views`。

### 第三类：需要运行时兼容策略

- `BootstrapSnapshot` 与 DB 表 `bootstrap_snapshots/bootstrap_dim_files`：代码层改名为 workflow snapshot/file diff，DB 表暂不迁移。
- `.asd/bootstrap-report.json` 与 `.asd/bootstrap-reports/`：代码层改名为 workflow report，文件名暂不迁移，避免破坏 Dashboard/已有工具读取。
- `.asd/bootstrap-checkpoint`：代码层改名 DimensionCheckpointStore，目录名暂不迁移。

### 第四类：可在 finalizer 收敛后删除

- `BootstrapDeliveryConsumer.ts`：生产链路已使用 `WorkflowCompletionFinalizer`，旧 consumer 只剩单测覆盖。迁移测试到 finalizer steps 后删除。
- `BootstrapSemanticMemoryConsumer.ts`：生产链路已由 finalizer 的 semantic memory step 处理。迁移测试到 `SemanticMemoryCompletionStep` 后删除。

## 分阶段落地计划

### D0：锁定主链路契约

产物：本文件 + 一个入口级 workflow map 测试清单。

工作：

1. 确认四条主链路的 public response 不变。
2. 把 `workflow-reorganization-design.md` 中过期描述标注为历史文档或转链到本文。
3. 增加文档级 checklist：handler 薄适配、profile briefing、completion finalizer、report/snapshot persistence 都以当前实现为基线。

D0 入口级 workflow map：

| Public surface | Handler adapter | Workflow 主入口 | Response contract | D0 基线 |
| --- | --- | --- | --- | --- |
| Dashboard/internal `bootstrap_knowledge` | `bootstrap-internal.ts` re-export `bootstrapKnowledge` | `runInternalColdStartWorkflow()` | 快速返回内部异步任务骨架，后台执行内部 Agent dimension execution | 保持不变 |
| MCP `alembic_bootstrap` | `bootstrap-external.ts` re-export `bootstrapExternal` | `runExternalColdStartWorkflow()` | 返回 cold-start Mission Briefing 与外部 session contract | 保持不变 |
| Dashboard/internal `rescan_project` | `rescan-internal.ts` re-export `rescanInternal` | `runInternalKnowledgeRescanWorkflow()` | 返回 audit/gap 骨架和内部异步任务状态 | 保持不变 |
| MCP `alembic_rescan` | `rescan-external.ts` re-export `rescanExternal` | `runExternalKnowledgeRescanWorkflow()` | 返回 rescan Mission Briefing、evidence hints 与外部 session contract | 保持不变 |
| MCP `alembic_dimension_complete` | `dimension-complete-external.ts` envelope adapter | `runExternalDimensionCompletionWorkflow()` | 返回维度完成结果、下一步 hints，并在最后维度触发 workflow finalizer | 保持不变 |

D0 检查清单：

- [x] Handler 只保留 public alias/envelope，不直接承载 project analysis、cleanup、relevance audit 或 dimension execution 主逻辑。
- [x] 外部 cold-start 与 rescan briefing 以 `BriefingProfile` 为基线：`cold-start-external` 与 `rescan-external` 不再靠 workflow patch 分叉。
- [x] 内部和外部 completion 收尾以 `runWorkflowCompletionFinalizer()` 为基线，后续 D5 只拆 step，不改变顺序语义。
- [x] report/history/snapshot/checkpoint cleanup 以 P6 后的 report/snapshot workflow 为基线，runtime 文件名和 DB schema 暂不迁移。
- [x] `lib/workflows/workflow-reorganization-design.md` 已标注为历史参考，本文成为后续 D1-D6 的执行基线。
- [x] D1 已迁出 handler shared、evolution prescreen 与 presentation helper；workflow 层残留的 handler local types import 归入 D2，不再新增。

验收：无代码行为变化；`git diff --check` 通过。

### D1：迁出 handler helper 反向依赖

目标：`lib/workflows/common-capabilities/**` 不再 import `#external/mcp/handlers/bootstrap/shared/*`。

落地状态：已完成第一轮实现。`async-fill-helpers`、`session-helpers`、`audit-helpers`、`evolution-prescreen`、`target-file-map`、`panorama-utils` 已迁到 workflow capability，旧 handler 路径只保留兼容 re-export；`LanguageExtensions` 与 `TargetClassifier` 已迁到 `common-capabilities/presentation`，workflow import 已切到新路径。`#external/mcp/handlers/types` 仍是 D2 的 typed DTO 迁移目标。

工作：

1. `async-fill-helpers` 迁到 internal-agent execution capability。
2. `session-helpers` 迁到 external-agent session capability。
3. `audit-helpers` 与 `evolution-prescreen` 迁到 knowledge-planning。
4. `target-file-map`、`panorama-utils`、`LanguageExtensions`、`TargetClassifier` 迁到 presentation/project-intelligence。

验收：`grep '#external/mcp/handlers/bootstrap/shared' lib/workflows` 无结果；handler shared 文件只做兼容 re-export。

### D2：建立 workflow/domain typed DTO

目标：workflow 层不再依赖 handler local types。

落地状态：已完成第一轮实现。新增 `lib/types/workflows.ts` 作为 workflow/domain DTO 边界，提供 `FileDiffPlan`、兼容别名 `IncrementalPlan`、`BootstrapFile`、`SaveSnapshotParams`、`DimensionCheckpointResult`、`LoggerLike` 与 workflow 侧 `McpContext` 最小结构。`lib/external/mcp/handlers/types.ts` 保留 public handler 兼容 re-export；`lib/types/project-snapshot.ts` 的 `IncrementalPlan` 已收敛为 `FileDiffPlan` 兼容别名，避免与 `KnowledgeRescanPlan` 混用。新增边界测试防止 `lib/workflows` 再次 import handler internal types/helper。

工作：

1. 新增 `lib/types/workflows.ts` 或 `lib/workflows/types.ts`。
2. 迁移 `BootstrapFile`、`IncrementalPlan`、`DimensionCheckpointResult`、`SaveSnapshotParams`。
3. 统一命名 `FileDiffPlan` 与 `KnowledgeRescanPlan`，并在类型上禁止混用。

验收：`grep '#external/mcp/handlers/types' lib/workflows` 无结果；typecheck 通过。

### D3：内部执行链路去 v3/bootstrap 命名

目标：内部 Agent 自动执行链路以 dimension execution 命名。

落地状态：已完成第一轮实现。新增 `InternalDimensionExecutionWorkflow` 与 `runInternalDimensionExecution()`，生产 cold-start/rescan 入口和 project-analysis cleanup 动态 import 已切到 execution 命名；旧 `InternalDimensionFillWorkflow` 与 `InternalDimensionFillPipeline` 只保留兼容 re-export，`fillDimensionsV3` 仅作为旧名 alias 存在。Preparation/SessionRunner/Finalizer/Types 已新增 execution 命名 facade，后续可在 D5/D6 或专门清理阶段继续把 consumers/projections/context 下的 `Bootstrap*` 细名迁出。

工作：

1. 新增 `runInternalDimensionExecution()` 并替代生产调用。
2. `InternalDimensionFillWorkflow` 改为 `InternalDimensionExecutionWorkflow`。
3. `InternalDimensionFillPipeline/Preparation/SessionRunner/Finalizer/Types` 逐步改名。
4. consumers/projections/context 下的 `Bootstrap*` 名称按职责重命名。

验收：旧 `fillDimensionsV3` 只剩兼容 re-export；生产代码不再直接调用旧名。

### D4：knowledge-rescan lifecycle 命名落地

目标：把“知识增量扫描”从 file diff incremental 语义中拆出来。

落地状态：已完成第一轮实现。新增 `lib/workflows/knowledge-rescan/` 目标目录，真实 intent/plan/presenter/internal/external workflow 已改为 `KnowledgeRescan*` 命名；`rescan-internal.ts` 与 `rescan-external.ts` handler facade 已指向新入口。旧 `incremental-scan/*` 只保留兼容 re-export，public MCP/Dashboard tool 名和 response shape 不变。`incremental-scan` 目录不再承载业务实现，只作为旧 import path 的适配层。

工作：

1. 新增 `lib/workflows/knowledge-rescan/` 目标目录。
2. `IncrementalScanIntent/Plan/Presenters` 改为 `KnowledgeRescanIntent/WorkflowPlan/Presenters`。
3. internal/external workflow 改名为 `InternalKnowledgeRescanWorkflow` / `ExternalKnowledgeRescanWorkflow`。
4. `incremental-scan/*` 保留 re-export，MCP handler 暂不改 public tool 名。

验收：rescan 相关业务代码使用 knowledge-rescan 命名；file diff 只出现在 `FileDiffPlan`/`FileDiffPlanner`。

### D5：persistence 与 finalization 去 Bootstrap 化

目标：报告、快照、checkpoint、completion steps 以 workflow result 命名。

落地状态：已完成第一轮实现。新增 `WorkflowReportTypes/Writer/HistoryStore`、`WorkflowSnapshotStore`、`WorkflowResultPersistence`、`DimensionCheckpointStore/DimensionRestoreState/DimensionCheckpointCleanup`，生产执行链已切到新入口；旧 `BootstrapReport*`、`BootstrapSnapshotStore`、`BootstrapCheckpoint*`、`BootstrapRestoreState` 仅保留兼容 re-export。`WorkflowCompletionFinalizer` 已拆出 delivery、verification、panorama、wiki、semantic memory step 文件，入口顺序和调度语义不变。runtime 文件名 `.asd/bootstrap-report.json`、`.asd/bootstrap-reports/`、`.asd/bootstrap-checkpoint` 与 file-diff DB 表继续保持兼容。

工作：

1. `BootstrapReportTypes/Writer/HistoryStore` 改为 `WorkflowReportTypes/Writer/HistoryStore`。
2. `BootstrapSnapshotStore` 改为 `WorkflowSnapshotStore`。
3. `BootstrapCheckpointCleanup` 改为 `DimensionCheckpointCleanup`。
4. `BootstrapReportSnapshotWorkflow` 改为 `WorkflowResultPersistence`。
5. `WorkflowCompletionFinalizer` 拆 step 文件：delivery、verification、panorama、wiki、semantic memory。

验收：生产代码不再 import `BootstrapReportSnapshotConsumer`；旧 report/snapshot 文件名与 DB 表保持兼容。

### D6：删除旧 facade 与旧测试入口

目标：清掉只为历史路径存在的碎片。

落地状态：已完成第一轮实现。删除 `BootstrapDeliveryConsumer`、`BootstrapSemanticMemoryConsumer`、`BootstrapReportSnapshotConsumer` 以及 D5 留下的 report/checkpoint 兼容 facade；`BootstrapRestoreState.test.ts` 迁到 `DimensionRestoreState.test.ts`，delivery/semantic 单测迁到 `DeliveryCompletionStep` 与 `SemanticMemoryCompletionStep`。handler shared 下已迁出的 helper/facade 文件也已删除，边界测试改为防止这些旧模块被恢复。runtime 兼容文件名不变：`.asd/bootstrap-report.json`、`.asd/bootstrap-reports/`、`.asd/bootstrap-checkpoint` 仍作为存储格式存在。

工作：

1. 删除旧 `BootstrapDeliveryConsumer` 与 `BootstrapSemanticMemoryConsumer`。
2. 删除 `BootstrapReportSnapshotConsumer` 与 report/checkpoint 兼容 facade。
3. 删除 handler shared helper 中已迁出的实现，不再保留无引用 adapter。
4. 更新单测 import，增加边界测试防止旧模块恢复。

验收：`rg 'BootstrapDeliveryConsumer|BootstrapSemanticMemoryConsumer|BootstrapReportSnapshotConsumer' lib test --glob '!dist/**'` 只剩边界测试中的退休清单；focused tests 与 typecheck 通过。

### D7：按文档验收 file-diff 命名与边界

目标：对照本文最终验收标准，收口仍作为真实实现存在的 `BootstrapSnapshot` / `IncrementalBootstrap` 命名。

落地状态：已完成第一轮验收修复。真实实现已迁为 `FileDiffSnapshotStore` 与 `FileDiffPlanner`；`BootstrapSnapshot.ts` 与 `IncrementalBootstrap.ts` 只保留短兼容 re-export。生产调用已切到新路径：内部执行清理快照使用 `FileDiffSnapshotStore`，项目分析增量评估和 result persistence 使用 `FileDiffPlanner`，测试注入参数从 `createIncrementalBootstrap` 改为 `createFileDiffPlanner`。runtime DB 表 `bootstrap_snapshots/bootstrap_dim_files` 继续保持兼容，不做 schema 迁移。

工作：

1. 将 file-diff 真实实现文件改为 `FileDiffSnapshotStore.ts` / `FileDiffPlanner.ts`。
2. 更新 production imports，禁止主链或 capability 继续 import 旧 file-diff 路径。
3. 增加边界测试，确保旧路径只作为兼容 re-export，不再承载 class 实现。
4. 保持 runtime 文件名和 DB schema 不变。

验收：`rg '#workflows/common-capabilities/file-diff/(BootstrapSnapshot|IncrementalBootstrap)\.js|class BootstrapSnapshot|class IncrementalBootstrap|createIncrementalBootstrap' lib test --glob '!dist/**'` 只剩兼容 facade 与边界测试期望；focused tests 与 typecheck 通过。

## 测试策略

每个阶段只做与迁移边界匹配的测试：

- D1/D2：边界测试，断言 workflow 层不再 import handler shared/types。
- D3：内部执行链路单测，覆盖 AI unavailable、mock mode、normal finalizer delegation。
- D4：rescan profile 单测，覆盖 requested dimensions、gap dimensions、decaying recipes、external evidence hints。
- D5：report/snapshot/finalizer 单测，覆盖 step 顺序、immediate/scheduled semantic memory、runtime 文件兼容。
- D6：删除旧 facade 后跑入口级 focused tests，确认 public handler alias 不变。
- D7：file-diff 命名边界测试，确认真实实现使用 `FileDiffPlanner` / `FileDiffSnapshotStore`，旧路径仅为兼容 re-export。

推荐命令：

```bash
npm run typecheck
npx vitest run test/unit/MissionBriefingProfile.test.ts test/unit/WorkflowCompletionFinalizer.test.ts test/unit/WorkflowResultPersistence.test.ts
npx vitest run test/unit/AgentModuleBoundaries.test.ts test/unit/DimensionRestoreState.test.ts test/unit/DeliveryCompletionStep.test.ts test/unit/SemanticMemoryCompletionStep.test.ts
npx biome check --fix <changed-files>
git diff --check
```

## 验收标准

最终完成时应满足：

1. 四条主链路名称准确：cold-start 与 knowledge-rescan 表达生命周期，internal-agent 与 external-agent 表达执行者。
2. workflow 主链文件只做 orchestration，不拼协议 envelope，不写低层 runtime 文件，不直接 import handler helper。
3. `FileDiffPlan` 与 `KnowledgeRescanPlan` 在类型和目录上完全分离。
4. 外部 Agent 链路从 Mission Briefing 到 dimension completion 到 finalizer 是同一 workflow 家族。
5. 内部 Agent 链路不再暴露 `fillDimensionsV3` 作为生产主入口。
6. report、snapshot、checkpoint 的代码命名从 bootstrap 迁到 workflow/result/dimension，但 runtime 文件与 DB schema 保持兼容。
7. 旧 consumer/facade 文件要么删除，要么只剩有计划的兼容 re-export，并有测试保护迁移完成条件。

## 风险与迁移原则

- 不改 public MCP tool 名：`alembic_bootstrap`、`alembic_rescan`、`alembic_dimension_complete` 保持兼容。
- 不改 Dashboard response shape，除非另有前端迁移计划。
- 不迁移 DB 表和 `.asd` 文件名作为第一步，避免破坏已有数据与调试工具。
- 每轮只移动一个边界：先 helper，再 types，再执行链，再 lifecycle 目录，再 persistence。
- 每次重命名先新增目标文件并 re-export，确认 typecheck/tests 通过后再删除旧文件。
- 若发现旧文档与当前代码冲突，以当前代码和本文为准，旧文档只保留历史背景。