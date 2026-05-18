# AlembicCore 阶段 9 完成记录：host-agent 知识挖掘闭环迁移

日期：2026-05-17

Core 提交：`e65a501 Migrate host-agent mining workflow core`

## 范围

阶段 9 已在 `AlembicCore` 内完成 host-agent 知识挖掘闭环迁移。Core 负责 bootstrap/rescan 的任务计划、证据投影、mission briefing、外部提交追踪、维度完成校验、Recipe 绑定、checkpoint、workflow report/snapshot 持久化；宿主 agent 仍负责真实代码阅读、知识提交和工具执行。

明确不进入 Core 的内容：

- Alembic internal AgentRuntime
- internal-agent execution pipeline
- Alembic tool catalog / router / handler
- `BootstrapEventEmitter`
- Skill 生成
- `WorkflowCompletionFinalizer` / `CompletionSteps`
- Cursor/Wiki/Plugin delivery nextActions
- MCP/HTTP/Codex transport、preflight、权限策略

## 已迁入文件

- `src/types/snapshot-views.ts`
- `src/workflows/shared/**`
- `src/workflows/cold-start/**`
- `src/workflows/knowledge-rescan/**`
- `src/workflows/capabilities/RecipeSnapshotTypes.ts`
- `src/workflows/capabilities/WorkflowCleanupPolicies.ts`
- `src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts`
- `src/workflows/capabilities/planning/dimensions/TierScheduler.ts`
- `src/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts`
- `src/workflows/capabilities/planning/knowledge/**`
- `src/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts`
- `src/workflows/capabilities/presentation/TargetFileMapBuilder.ts`
- `src/workflows/capabilities/execution/external/**`
- `src/workflows/capabilities/persistence/**`
- `test/unit/HostAgentMiningWorkflow.test.ts`
- package exports for workflow entrypoints。

## 关键实现决策

- `BootstrapSession` 使用 Core 自有 `MiningSessionStore`，不依赖外层 `#agent/memory/SessionStore.js`。
- `ExternalDimensionCompletionWorkflow` 是 Core 版重建，不复制外层 Skill 生成、event emitter、completion finalizer 和 delivery nextActions。
- `WorkflowCleanupPolicies` 只定义清理策略编排，具体 `CleanupService` 由外层注入。
- `WorkflowResultPersistence`、`DimensionCheckpoint`、`WorkflowSnapshotStore` 只保留宿主无关 report/checkpoint/snapshot 持久化。
- `MissionBriefingSupport` 已去掉 `BOOTSTRAP_COMPLETE_ACTIONS`，避免把 Cursor/Wiki delivery 行为带入 Core。

## 验证

- `npm run build:check` 通过。
- `npm run test` 通过：45 个测试文件、847 个测试。
- `npm run build` 通过。
- 阶段 9 变更文件 Biome 检查通过。
- package self-reference smoke 通过：
  - `@alembic/core/workflows`
  - `@alembic/core/workflows/cold-start`
  - `@alembic/core/workflows/knowledge-rescan`
  - `@alembic/core/workflows/capabilities/execution/external`
  - `@alembic/core/workflows/capabilities/planning/knowledge`
  - `@alembic/core/workflows/capabilities/persistence`
  - `@alembic/core/types/snapshot-views`

说明：`npm run lint` 全仓仍被既有 baseline 诊断阻断，首批来自阶段 9 未改文件 `src/core/AstAnalyzer.ts`、`src/core/ast/ProjectGraph.ts`、`src/core/ast/ensure-grammars.ts` 等；阶段 9 新增/修改文件单独检查无 lint 问题。

## 外层接入任务

两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到 `e65a501` 或之后提交。

接入建议 import：

- `@alembic/core/workflows/cold-start`
- `@alembic/core/workflows/knowledge-rescan`
- `@alembic/core/workflows/capabilities/execution/external`
- `@alembic/core/workflows/capabilities/planning/knowledge`
- `@alembic/core/workflows/capabilities/persistence`
- `@alembic/core/types/snapshot-views`

Alembic 外层：

- CLI/MCP/HTTP bootstrap/rescan handlers 调 Core intent/plan/presenter/session/briefing 能力。
- external-agent 路径用 Core `createExternalWorkflowSession`、`buildExternalMissionBriefing`、`runExternalDimensionCompletionWorkflow`。
- internal-agent 路径保留外层执行器，只复用 Core 计划、session/report 类型和宿主无关投影。
- Skill 生成、event emitter、completion finalizer、Cursor/Wiki delivery nextActions 继续在外层。

AlembicPlugin 外层：

- Codex MCP bootstrap/rescan handlers 调 Core 生成 host-agent mining session。
- Codex 宿主 agent 执行代码阅读和 knowledge submission。
- dimension completion 回传 Core 做校验、Recipe 绑定、checkpoint、quality feedback 和 evidence hints。
- Codex preflight、tool exposure、transport、权限策略继续留在 Plugin。

## 删除计划

接入完成、扫描无遗留、代表测试通过后，才删除外层重复实现。

可删除候选：

- `lib/types/snapshot-views.ts`
- `lib/workflows/shared/**`
- `lib/workflows/cold-start/ColdStartIntent.ts`
- `lib/workflows/cold-start/ColdStartPlan.ts`
- `lib/workflows/cold-start/ColdStartPresenters.ts` 中已由 Core 接管的 projection/intent/plan 部分
- `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts` 中已由 Core 接管的 projection/intent/plan 部分
- `lib/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts`
- `lib/workflows/capabilities/planning/dimensions/TierScheduler.ts`
- `lib/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts`
- `lib/workflows/capabilities/planning/knowledge/**`
- `lib/workflows/capabilities/presentation/PanoramaSummaryPresenter.ts`
- `lib/workflows/capabilities/presentation/TargetFileMapBuilder.ts`
- `lib/workflows/capabilities/execution/external/ExternalSubmissionTracker.ts`
- `lib/workflows/capabilities/execution/external/MissionBriefingSupport.ts`
- `lib/workflows/capabilities/execution/external/MissionBriefingBuilder.ts`
- `lib/workflows/capabilities/execution/external/EvidenceStarterBuilder.ts`
- `lib/workflows/capabilities/execution/external/SessionSupport.ts`
- `lib/workflows/capabilities/execution/external/BootstrapSession.ts` 中 Core 已接管的 host-agent session 部分
- `lib/workflows/capabilities/persistence/DimensionCheckpoint.ts`
- `lib/workflows/capabilities/persistence/WorkflowReportHistoryStore.ts`
- `lib/workflows/capabilities/persistence/WorkflowReportTypes.ts`
- `lib/workflows/capabilities/persistence/WorkflowReportWriter.ts`
- `lib/workflows/capabilities/persistence/WorkflowResultPersistence.ts`
- `lib/workflows/capabilities/persistence/WorkflowSnapshotStore.ts`

不删除：

- `lib/workflows/capabilities/execution/internal-agent/**`
- `WorkflowSkillCompletionCapability.ts`
- `BootstrapEventEmitter`
- `WorkflowCompletionFinalizer.ts`
- `CompletionSteps.ts`
- Alembic internal agent execution
- `lib/tools/**`
- MCP/HTTP/Codex handler
- transport / preflight / permission policy
- Cursor/Wiki/Plugin delivery nextActions
- Dashboard / daemon wiring
