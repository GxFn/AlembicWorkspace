# Workflow Reorganization Design

> 历史参考：本文记录 P1-P6 之前的 workflow 拆分设计与迁移背景，部分“当前代码实现地图”和“迁移步骤”已经被后续落地覆盖。新的主链路、层级命名、冗余清理和 D0-D6 落地顺序以 `docs-dev/workflows-main-chain-reorganization-plan.md` 为准；继续实现时请把本文视为历史上下文，而不是当前执行计划。

> 目标：将原先集中在旧 bootstrap workflow 目录中的冷启动、增量扫描、通用扫描、内部 Agent 执行、外部 Agent briefing/完成链路拆开。旧目录已迁空，职责由 `cold-start/`、`incremental-scan/`、`common-capabilities/` 承接。

## 结论

推荐使用正交组合，不使用继承型工作流层级。

当前四个入口不是同一个父类下的四个子类，而是多个变化轴的组合：

- 生命周期：冷启动 vs 增量扫描。
- 执行者：内部 Agent 自动填充 vs 外部 IDE Agent 自行分析。
- 项目分析：完整 Phase 1-4 vs 文件快照 diff 后的受影响维度。
- 清理策略：`fullReset` vs `rescanClean` vs 保留快照。
- 输出契约：异步任务骨架 vs Mission Briefing。
- 完成副作用：内部 consumer 自动提交/交付 vs 外部 `dimension_complete` 手动完成。

如果用继承表达，会快速膨胀成 `InternalColdStartWorkflow`、`ExternalColdStartWorkflow`、`InternalRescanWorkflow`、`ExternalRescanWorkflow`、`IncrementalColdStartWorkflow` 等类，并且共享步骤仍会通过 protected hooks 互相穿透。更适合的结构是：四个公开 workflow 只声明 intent 与策略，实际能力由一组可组合的 common capabilities 执行。

## 当前代码实现地图

### 四个入口

| 入口 | 当前函数 | 调用面 | 输出模式 | 后续执行 |
| --- | --- | --- | --- | --- |
| 内部 Agent 冷启动 | `bootstrapKnowledge()` in `lib/external/mcp/handlers/bootstrap-internal.ts` | Dashboard `dashboard.bootstrap_project`、内部 tool `bootstrap_knowledge` | 快速返回骨架 + `BootstrapTaskManager` 状态 | `dispatchPipelineFill()` 后台调用 `fillDimensionsV3()` |
| 外部 Agent 冷启动 | `bootstrapExternal()` in `lib/external/mcp/handlers/bootstrap-external.ts` | MCP `alembic_bootstrap` | Mission Briefing | 外部 Agent 调 `alembic_submit_knowledge(_batch)` + `alembic_dimension_complete` |
| 内部 Agent 增量扫描 | `rescanInternal()` in `lib/external/mcp/handlers/rescan-internal.ts` | Dashboard `dashboard.rescan_project` | 审计/gap 骨架 + 异步填充状态 | `fillDimensionsV3()` 只填补 gap 维度，传入 existing recipes 与 prescreen |
| 外部 Agent 增量扫描 | `rescanExternal()` in `lib/external/mcp/handlers/rescan-external.ts` | MCP `alembic_rescan` | Rescan Mission Briefing + evidence hints | 外部 Agent 执行 evolve -> gap-fill -> dimension_complete |

MCP 的外部路径在 `lib/external/mcp/McpServer.ts` 中固定映射：`alembic_bootstrap` 只走 `bootstrapExternal()`，`alembic_rescan` 只走 `rescanExternal()`，`alembic_dimension_complete` 走 `dimensionComplete()`。Dashboard 内部路径在 `lib/http/routes/modules.ts` -> `lib/tools/adapters/DashboardOperations.ts` 中映射到 `bootstrapKnowledge()` 和 `rescanInternal()`。

### 共享但混杂的能力

- `runAllPhases()` in `common-capabilities/project-analysis/ProjectAnalysisRunner.ts`：承担文件收集、AST、实体图、调用图、依赖图、Panorama、Guard、维度解析，同时还可执行 `clearOldData` 和 `IncrementalBootstrap.evaluate()`。
- `fillDimensionsV3()` in `common-capabilities/agent-execution/internal/InternalDimensionFillPipeline.ts`：实际是内部 Agent 维度填充 orchestrator，不只是冷启动。它同时处理 cold-start 与 rescan，因为 `PipelineFillView` 可带 `existingRecipes` 和 `evolutionPrescreen`。
- `BootstrapSession` / `ExternalSubmissionTracker`：外部 Agent 跨 MCP 调用的会话、质量、证据累计。
- `BootstrapCheckpointStore` / `BootstrapRestoreState`：内部与外部都使用的维度 checkpoint。
- `BootstrapSnapshot` / `IncrementalBootstrap`：快照式文件 diff、维度影响推断、历史 `SessionStore` 恢复。
- `MissionBriefingBuilder`：外部 Agent 冷启动和 rescan briefing 共用，但 rescan 在 handler 内继续注入 `evidenceHints` 和覆盖 workflow 文案。

### 实际流程差异

内部冷启动：

1. `CleanupService.fullReset()` 清空知识库、候选、skills/wiki、DB 数据表。
2. `runAllPhases(... clearOldData: true, incremental: args.incremental !== false)` 收集项目上下文并构建活跃维度。
3. `buildProjectSnapshot()` 固定 Phase 结果。
4. 构建 `analysisFramework`、`filesByTarget`、`nextSteps` 和 Dashboard 骨架。
5. 创建 `BootstrapSession` 和 `BootstrapTaskManager` 会话。
6. `dispatchPipelineFill()` 后台调用 `fillDimensionsV3()`。
7. `fillDimensionsV3()` 通过 `AgentService.run(bootstrap-session)` fanout 到 `bootstrap-dimension`，consumer 负责提交候选、生成 skill、保存 checkpoint、固化 semantic memory、保存 report/snapshot、delivery/wiki。

外部冷启动：

1. `CleanupService.fullReset()`。
2. `runAllPhases(... clearOldData: true, incremental: false)`。
3. 创建 `BootstrapSession`，把 `ProjectSnapshot` 写入 session cache。
4. `buildMissionBriefing()` 返回 execution plan、evidence starters、维度 tiers。
5. 外部 Agent 自行读代码和提交知识。
6. `dimensionComplete()` 绑定 recipe、生成 skill、写 checkpoint、写 `SessionStore`、推送进度；最后一个维度完成后触发 delivery、panorama refresh、wiki、semantic memory consolidation。

内部增量扫描：

1. `CleanupService.snapshotRecipes()` 保存已有可消费 recipe。
2. `CleanupService.rescanClean()` 清理候选、skills/wiki、semantic memories、code entities、bootstrap snapshots 等衍生缓存，但保留 active/published/staging/evolving recipe。
3. `KnowledgeSyncService.sync(force: true)` 恢复文件与 DB 一致性。
4. `runAllPhases(... clearOldData: false, incremental: false)` 全量重扫项目上下文。
5. `RelevanceAuditor.audit()` 验证已有 recipe 证据。
6. `buildEvolutionPrescreen()` 形成 auto-resolved / needs-verification / dimension gaps。
7. 根据 `TARGET_PER_DIM = 5` 计算 gap 维度。
8. 对 gap 维度创建 session/task，并调用 `fillDimensionsV3()`，通过 `existingRecipes` 与 `evolutionPrescreen` 进入 rescan-aware producer prompt。

外部增量扫描：

1. 与内部 rescan 一样 snapshot recipes、rescan clean、sync、Phase 1-4、relevance audit、prescreen。
2. 可按 `args.dimensions` 过滤维度。
3. `buildMissionBriefing()` 后注入 `evidenceHints`：`allRecipes`、`dimensionGaps`、`evolutionPrescreen`、`occupiedTriggers`、rescan constraints。
4. 覆盖 `executionPlan.workflow` 为 evolve -> gap-fill -> complete。
5. 外部 Agent 调 `alembic_evolve`、`alembic_submit_knowledge`、`alembic_dimension_complete` 完成每个维度。

## 增量语义问题

代码里有两套“增量”：

1. 文件快照增量：`IncrementalBootstrap` 基于 `bootstrap_snapshots` 和 `bootstrap_dim_files` 计算 diff，跳过未受影响维度，恢复历史 `SessionStore`。
2. 知识增量扫描：`rescanInternal()` / `rescanExternal()` 保留已有 recipe，做 relevance audit、evolution prescreen 与 gap-fill。

这两套目前混名且互相干扰：

- `bootstrapKnowledge()` 默认开启 `incremental`，但同一入口先 `fullReset()`，随后 `runAllPhases(clearOldData: true)` 又调用 `clearSnapshots()`；历史快照被删除后，`IncrementalBootstrap.evaluate()` 通常只能返回 full。
- `rescanClean()` 也删除 `bootstrap_snapshots` 和 `bootstrap_dim_files`，所以 rescan 当前不使用文件快照增量，只是知识层面的增量更新。
- `runAllPhases()` 的 `incremental` 选项发生在 Phase 1 后，但它所在模块同时知道清理、快照、维度定义和分析 phase，职责过宽。
- `IncrementalPlan` 在 `lib/types/project-snapshot.ts` 和 `lib/external/mcp/handlers/types.ts` 存在两份相近定义，容易让 snapshot-level incremental 和 rescan-level incremental 继续混用。

建议命名拆分：

- `FileDiffPlan`：文件快照 diff 与受影响维度，用于跳过内部 Agent 维度运行。
- `KnowledgeRescanPlan`：已有 recipe 审计、演进、gap-fill，用于 rescan。
- `ColdStartPlan`：干净初始化，不承诺复用历史 snapshot；如果需要“差异化重建”，不要叫 cold start，应归入 incremental scan。

## 目标目录

```text
lib/workflows/
  common-capabilities/
    README.md
    project-analysis/          # Phase 1-4，未来从 bootstrap/phases 迁出
    cleanup/                   # full reset / rescan clean / preserve snapshot policies
    dimension-planning/        # tiers、active dimensions、gap/filter/diff plans
    agent-execution/           # internal fanout fill + external briefing/complete contracts
    progress/                  # task manager、checkpoint、snapshot/report persistence
    delivery/                  # delivery/wiki/panorama/semantic memory completion hooks
  cold-start/
    README.md
    internal/                  # dashboard/agent runtime internal cold-start workflow
    external/                  # MCP external mission briefing workflow
  incremental-scan/
    README.md
    internal/                  # dashboard internal rescan workflow
    external/                  # MCP external rescan workflow
```

快速迁移阶段已经完成底层实现落位：旧目录下的实现已按职责迁到 `common-capabilities/`，四个入口 workflow 继续作为 intent preset 组合这些能力。

## 组合模型

```ts
type WorkflowKind = 'cold-start' | 'incremental-scan';
type AgentExecutor = 'internal-agent' | 'external-agent';
type ProjectAnalysisMode = 'full' | 'file-diff';

interface WorkflowIntent {
  kind: WorkflowKind;
  executor: AgentExecutor;
  analysisMode: ProjectAnalysisMode;
  cleanupPolicy: 'full-reset' | 'rescan-clean' | 'preserve-snapshots';
  completionPolicy: 'auto-fill' | 'external-dimension-complete';
}
```

四个公开 workflow 是 intent presets：

| Workflow | Intent |
| --- | --- |
| `cold-start/internal` | `kind=cold-start`, `executor=internal-agent`, `analysisMode=full`, `cleanupPolicy=full-reset`, `completionPolicy=auto-fill` |
| `cold-start/external` | `kind=cold-start`, `executor=external-agent`, `analysisMode=full`, `cleanupPolicy=full-reset`, `completionPolicy=external-dimension-complete` |
| `incremental-scan/internal` | `kind=incremental-scan`, `executor=internal-agent`, `analysisMode=full` or later `file-diff`, `cleanupPolicy=rescan-clean`, `completionPolicy=auto-fill` |
| `incremental-scan/external` | `kind=incremental-scan`, `executor=external-agent`, `analysisMode=full` or later `file-diff`, `cleanupPolicy=rescan-clean`, `completionPolicy=external-dimension-complete` |

## 能力边界

### Common capabilities

- 不知道入口来自 MCP、Dashboard、CLI 还是 AgentRuntime。
- 不直接构造 HTTP/MCP envelope。
- 不直接决定 internal vs external。
- 只暴露 typed DTO：`ProjectAnalysisSnapshot`、`FileDiffPlan`、`KnowledgeRescanPlan`、`DimensionExecutionPlan`、`WorkflowProgress`。

### Cold-start workflows

- 只表达“从干净状态建立知识库”。
- 默认不做文件快照增量；否则冷启动语义会与历史复用冲突。
- internal 负责创建异步自动填充任务。
- external 负责返回 Mission Briefing 和 session contract。

### Incremental-scan workflows

- 只表达“已有知识库的演进和补齐”。
- 必须保留 recipe，必须显式处理 relevance audit、evolution prescreen、dimension gaps、occupied triggers。
- 可以在后续引入 `FileDiffPlan` 作为优化，但不能替代 recipe relevance audit。

## 迁移步骤

1. 已完成：新增 `common-capabilities/project-analysis` facade，把 `runAllPhases()` 包一层为 `collectProjectAnalysis()`，先不移动实现。
2. 已完成：新增 cleanup policy facade，明确 `fullReset` 与 `rescanClean`；`preserveSnapshots` 和从 `runAllPhases()` 移除 `clearOldData` 副作用后续处理。
3. 待优化：新增 `FileDiffPlanner`，从 `IncrementalBootstrap.evaluate()` 拆出 diff 计划；让清理策略决定是否保留快照。
4. 已完成：新增 `KnowledgeRescanPlanner`，从两个 rescan workflow 抽出 snapshot recipes、audit、prescreen、gap 计算和 evidence hints。
5. 已完成：新增 `InternalDimensionFillWorkflow`，把内部 Agent task session 与 `fillDimensionsV3()` 调度收束为 adapter。
6. 部分完成：新增 `ExternalMissionWorkflow`，把 briefing 构建与 external session cache 收束到外部 Agent workflow；`ExternalDimensionCompletionWorkflow` 待迁移。
7. 已完成：将四个 handler 改成薄兼容导出，真实逻辑迁入 `cold-start/` 与 `incremental-scan/`。
8. 已完成：所有 import 已从旧 workflow bootstrap alias 切到新目录；旧目录可以删除或保持为空目录由 git 自然移除。

## 验收标准

- Handler 层不再直接调用 `runAllPhases()`、`fillDimensionsV3()`、`CleanupService`、`RelevanceAuditor`。
- `runAllPhases()` 或其替代物只做项目分析，不做清理、不做增量评估。
- 冷启动与增量扫描没有共用“bootstrap”命名的 plan 或 context。
- `FileDiffPlan` 与 `KnowledgeRescanPlan` 分开类型定义。
- 四个入口的响应契约保持兼容：Dashboard 仍拿异步任务骨架，MCP 仍拿 Mission Briefing。
- 现有单测可平移到新模块，并新增入口级组合测试覆盖四个 intent presets。
