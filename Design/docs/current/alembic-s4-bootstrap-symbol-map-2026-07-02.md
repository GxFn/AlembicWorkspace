# S4 批3 bootstrap 符号映射清单(执行底稿)

- 生成:2026-07-02,只读扫描产物(未改任何源码)
- 范围:`AlembicCore/{src,test}`、`AlembicAgent/{src,test}`、`Alembic/{lib,bin,test}`、`AlembicPlugin/{lib,test}`、`AlembicDashboard/src`(排除 dist/node_modules/vendor;共 1760 个 ts/tsx/js/mjs 文件)
- 权威冻结表:`AlembicCore/docs/wire-contract.md`(本清单不重复其条目,只在排除项引用)
- 命名规则:词根 `Bootstrap→Generate` / `bootstrap→generate` / `BOOTSTRAP→GENERATE`,其余部分不动
- 「出现文件数」= 全范围 `grep -lw` 全词匹配文件数;两仓同名符号共享一个计数,已标注
- 路径均为 workspace 根相对路径

---

## 3a-1 类与接口(直接改)

### 类

| 旧符号 | 新符号 | 定义文件 | 出现文件数 | 备注 |
|---|---|---|---|---|
| BootstrapAnalyze | GenerateAnalyze | AlembicAgent/src/tools/runtime/capabilities/BootstrapAnalyze.ts:7 | 6 | 有别名再导出 `BootstrapAnalyze as CodeAnalysis`(AlembicAgent/src/agent/capabilities/index.ts:2)与直名再导出(src/tools/runtime/capabilities/index.ts:6),两处同批更新 |
| BootstrapDedup | GenerateDedup | AlembicCore/src/service/bootstrap/BootstrapDedup.ts:41 | 10 | 经 `@alembic/core/service/bootstrap` subpath 被外层 3 文件 import,跨仓同批联动;subpath 目录名冻结不改 |
| BootstrapEventEmitter | GenerateEventEmitter | Alembic/lib/service/bootstrap/BootstrapEventEmitter.ts:19 | 17(两仓同名合计) | 主体仓实现 |
| BootstrapEventEmitter | GenerateEventEmitter | AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapEventEmitter.ts:15 | (同上) | Plugin 实现;`lib/service/bootstrap/BootstrapEventEmitter.ts` 是 RG9 兼容 shim,只更新其转发目标,shim 路径与旧名再导出保留到 RG9 |
| BootstrapProduce | GenerateProduce | AlembicAgent/src/tools/runtime/capabilities/BootstrapProduce.ts:7 | 5 | 有别名再导出 `as KnowledgeProduction`(agent/capabilities/index.ts:3)与直名再导出(capabilities/index.ts:7) |
| BootstrapRepositoryImpl | GenerateRepositoryImpl | AlembicCore/src/repository/bootstrap/BootstrapRepository.ts:78 | 2 | 表名字符串 `bootstrap_snapshots`/`bootstrap_dim_files` 冻结;`repository/bootstrap` subpath 目录冻结 |
| BootstrapSession | GenerateSession | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:172 | 19 | ⚠️ 与 Dashboard 同名 interface BootstrapSession(useBootstrapSocket.ts:69)分属两义,计数混合;`.asd/bootstrap-sessions/`、`bs_` 前缀、公开状态值字符串冻结(见 3b) |
| BootstrapSessionLeaseError | GenerateSessionLeaseError | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:126 | 3 | error.name 字符串 'BootstrapSessionLeaseError' 若随类名生成,消费方靠 instanceof 则安全;有一处字符串引用(全串扫描 1 处),改名时核对 |
| BootstrapSessionManager | GenerateSessionManager | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:426 | 8 | wire-contract.md 第 27 行以 "BootstrapSessionManager" 作定义指针,改名后同步该文档指针(表内 wire 值不动);DI key 'bootstrapSessionManager' 见 3a-3 |
| BootstrapTaskManager | GenerateTaskManager | Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:228 | 15(两仓同名合计) | `bs_` 会话 id 前缀生成处(:268)冻结;DI key 'bootstrapTaskManager' 见 3a-3 |
| BootstrapTaskManager | GenerateTaskManager | AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapTaskManager.ts:162 | (同上) | `bs_` 前缀(:202)冻结;`lib/service/bootstrap/BootstrapTaskManager.ts` RG9 shim 同 EventEmitter 处理 |

### 接口

| 旧符号 | 新符号 | 定义文件 | 出现文件数 | 备注 |
|---|---|---|---|---|
| BootstrapDedupState | GenerateDedupState | Alembic/lib/workflows/ai-execution/RescanContext.ts:35 | 1 | |
| BootstrapDimensionAdmissionDecision | GenerateDimensionAdmissionDecision | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:26 | 1 | |
| BootstrapDimensionAdmissionResult | GenerateDimensionAdmissionResult | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:33 | 2 | |
| BootstrapDimensionAnalysisReport | GenerateDimensionAnalysisReport | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:49 | 2 | |
| BootstrapDimensionCandidateAccountingResult | GenerateDimensionCandidateAccountingResult | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:143 | 1 | |
| BootstrapDimensionCheckpointDecision | GenerateDimensionCheckpointDecision | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:155 | 1 | |
| BootstrapDimensionConfig | GenerateDimensionConfig | Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:45 | 1 | |
| BootstrapDimensionExecutionState | GenerateDimensionExecutionState | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:31 | 1 | |
| BootstrapDimensionPcvEvidenceResult | GenerateDimensionPcvEvidenceResult | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:160 | 1 | |
| BootstrapDimensionPlan | GenerateDimensionPlan | Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:58 | 7 | |
| BootstrapDimensionProducerResult | GenerateDimensionProducerResult | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:59 | 2 | |
| BootstrapDimensionProjection | GenerateDimensionProjection | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:68 | 6 | |
| BootstrapDimensionRunIssue | GenerateDimensionRunIssue | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:95 | 2 | |
| BootstrapDimensionRunIssueState | GenerateDimensionRunIssueState | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:135 | 1 | |
| BootstrapDimensionRuntimeBuildResult | GenerateDimensionRuntimeBuildResult | Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:68 | 1 | |
| BootstrapExistingRecipe | GenerateExistingRecipe | Alembic/lib/workflows/ai-execution/RescanContext.ts:11 | 3 | |
| BootstrapFile | GenerateFile | AlembicCore/src/types/workflows.ts:28 | 7 | 经 `export type { BootstrapFile … }` 再导出:Alembic/lib/service/handler-runtime/types.ts:321、AlembicPlugin/lib/runtime/mcp/handlers/types.ts:278,三仓同批 |
| BootstrapFileEntry | GenerateFileEntry | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:25 | 7 | |
| BootstrapPcvNodeEvidenceSet | GeneratePcvNodeEvidenceSet | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:135 | 3 | |
| BootstrapPlanGateResult | GeneratePlanGateResult | Alembic/lib/daemon/DaemonJobWorkflowTypes.ts:52 | 3 | |
| BootstrapProcessEventTextArtifactCandidate | GenerateProcessEventTextArtifactCandidate | Alembic/lib/service/bootstrap/bootstrap-event-types.ts:104 | 3 | Plugin 侧 bootstrap-event-types.ts 无同名(其导出为 Dimension* 系列),仅主体仓 |
| BootstrapProcessEventsPayload | GenerateProcessEventsPayload | Alembic/lib/service/bootstrap/bootstrap-event-types.ts:113 | 3 | |
| BootstrapRescanContext | GenerateRescanContext | Alembic/lib/workflows/ai-execution/RescanContext.ts:26 | 4 | |
| BootstrapRuntimeContainer | GenerateRuntimeContainer | Alembic/lib/workflows/ai-execution/RuntimeInitializer.ts:19 | 2 | 是「生成运行时容器」,非应用启动容器,属 Recipe 生成链 |
| BootstrapSession(interface) | GenerateSession | AlembicDashboard/src/hooks/useBootstrapSocket.ts:69 | (与 Core 类共 19) | Dashboard socket 会话投影;与 Core 类同名不同义,分别改 |
| BootstrapSessionChildRunPlan | GenerateSessionChildRunPlan | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:185 | 3 | |
| BootstrapSessionLike | GenerateSessionLike | AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:62 | 4 | |
| BootstrapSessionLookupOptions | GenerateSessionLookupOptions | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:82 | 1 | |
| BootstrapSessionManagerOptions | GenerateSessionManagerOptions | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:78 | 1 | |
| BootstrapSessionOpts | GenerateSessionOpts | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:26 | 1 | |
| BootstrapSessionProjection | GenerateSessionProjection | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:454 | 2 | |
| BootstrapSessionShape | GenerateSessionShape | AlembicCore/src/types/ProjectSnapshot.ts:316 | 6 | |
| BootstrapSessionSnapshot | GenerateSessionSnapshot | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:63 | 1 | |
| BootstrapSessionStatus | GenerateSessionStatus | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:94 | 1 | |
| BootstrapSkillDimension | GenerateSkillDimension | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1053 | 1 | |
| BootstrapSnapshotEntity | GenerateSnapshotEntity | AlembicCore/src/repository/bootstrap/BootstrapRepository.ts:17 | 2 | |
| BootstrapSnapshotInsert | GenerateSnapshotInsert | AlembicCore/src/repository/bootstrap/BootstrapRepository.ts:44 | 2 | |
| BootstrapTask | GenerateTask | AlembicDashboard/src/hooks/useBootstrapSocket.ts:27 | 2 | |
| BootstrapTaskManagerLike | GenerateTaskManagerLike | Alembic/lib/workflows/ai-execution/AiDimensionTypes.ts:38 | 3(两处同名合计) | ⚠️ 同仓两处同名定义 |
| BootstrapTaskManagerLike | GenerateTaskManagerLike | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:36 | (同上) | 与上行同名同仓,改名时顺手核对是否应合并(不强制,合并是 3 批外决策) |
| BootstrapTaskMeta | GenerateTaskMeta | AlembicDashboard/src/hooks/useBootstrapSocket.ts:19 | 1 | |
| BootstrapTerminalToolsetConfig | GenerateTerminalToolsetConfig | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:7 | 1 | |
| BootstrapTierReflection | GenerateTierReflection | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1348 | 1 | |
| BootstrapWorkflowContainer | GenerateWorkflowContainer | Alembic/lib/workflows/ai-execution/AiDimensionTypes.ts:26 | 2 | |
| BootstrapWorkflowContext | GenerateWorkflowContext | Alembic/lib/workflows/ai-execution/AiDimensionTypes.ts:33 | 3 | |
| BuildBootstrapDimensionRunInputOptions | BuildGenerateDimensionRunInputOptions | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:34 | 1 | |
| BuildBootstrapSessionExecutionInputOptions | BuildGenerateSessionExecutionInputOptions | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:41 | 1 | |
| BuildBootstrapSessionRunInputOptions | BuildGenerateSessionRunInputOptions | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:196 | 1 | |
| ConsumeBootstrapDimensionResultOptions | ConsumeGenerateDimensionResultOptions | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:114 | 1 | |
| ConsumeBootstrapSessionResultOptions | ConsumeGenerateSessionResultOptions | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:960 | 1 | |
| ConsumeBootstrapSkillsOptions | ConsumeGenerateSkillsOptions | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1062 | 1 | |
| ConsumeBootstrapTierReflectionOptions | ConsumeGenerateTierReflectionOptions | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1342 | 1 | |
| InitializeBootstrapRuntimeOptions | InitializeGenerateRuntimeOptions | Alembic/lib/workflows/ai-execution/RuntimeInitializer.ts:28 | 1 | |
| PcvBootstrapStageNodeContext | PcvGenerateStageNodeContext | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:38 | 1 | |
| PcvBootstrapStageNodeIdentity | PcvGenerateStageNodeIdentity | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:31 | 1 | |

### 类型别名

| 旧符号 | 新符号 | 定义文件 | 出现文件数 | 备注 |
|---|---|---|---|---|
| BootstrapDimensionAdmissionStatus | GenerateDimensionAdmissionStatus | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:21 | 1 | |
| BootstrapDimensionRunIssueStatus | GenerateDimensionRunIssueStatus | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:84 | 2 | |
| BootstrapProcessEventDraft | GenerateProcessEventDraft | Alembic/lib/service/bootstrap/bootstrap-event-types.ts:94 | 4 | |
| BootstrapRepository(type 别名) | GenerateRepository | AlembicCore/src/repositories.ts:169 | 5 | `export type BootstrapRepository = BootstrapRepositoryImpl`;同文件 ALEMBIC_REPOSITORY_KEYS 里的 'bootstrapRepository' key 见 3a-3 |
| BootstrapSessionPublicState | GenerateSessionPublicState | AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts:86 | 1 | ⚠️ 只改类型名;其取值 'bootstrap_in_progress'/'bootstrap_running' 等字符串是 MCP 状态契约,冻结(见 3b) |
| BootstrapTerminalMode | GenerateTerminalMode | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:5 | 1 | |
| BootstrapTerminalToolset | GenerateTerminalToolset | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:3 | 5 | 经 `@alembic/core/host-agent-workflows` 被 Agent 消费(AgentStageFactoryRegistry.ts 顶部 import 3 个函数),跨仓同批 |
| PcvBootstrapStageKey | PcvGenerateStageKey | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:29 | 1 | |
| PcvBootstrapStageNodeMap | PcvGenerateStageNodeMap | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:36 | 1 | 契约字符串值 'PCVBootstrapStageNodeMap' 冻结,见 3a-3 |

3a-1 合计:类 11 行、接口 55 行、类型别名 9 行 = 75 行。

---

## 3a-2 函数与常量(直接改)

### 函数

| 旧符号 | 新符号 | 定义文件 | 出现文件数 | 备注 |
|---|---|---|---|---|
| _resetBootstrapSessionManagersForTesting | _resetGenerateSessionManagersForTesting | AlembicCore/src/workflows/capabilities/host-agent/SessionSupport.ts:57 | 3 | |
| applyBootstrapDimensionAdmissions | applyGenerateDimensionAdmissions | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:148 | 2 | |
| applyBootstrapDimensionCandidateAccounting | applyGenerateDimensionCandidateAccounting | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:192 | 2 | |
| applyBootstrapDimensionErrorAccounting | applyGenerateDimensionErrorAccounting | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:478 | 1 | |
| attachBootstrapAgentProgressBridge | attachGenerateAgentProgressBridge | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:359 | 2 | |
| attachBootstrapProcessEventBridge | attachGenerateProcessEventBridge | Alembic/lib/daemon/DaemonJobRunner.ts:624 | 2 | 有 1 处字符串引用 'attachBootstrapProcessEventBridge'(日志/诊断名),同批改 |
| bootstrapForHostAgent(再导出别名) | generateForHostAgent | AlembicPlugin/lib/runtime/mcp/handlers/host-agent/bootstrap.ts:10 | 7 | `runHostAgentColdStartWorkflow as bootstrapForHostAgent`;消费:McpServer.ts、HostMcpServer.ts、3 个测试;右侧目标符号属 3d |
| bootstrapRefine | generateRefine | Alembic/lib/service/bootstrap/BootstrapRefine.ts:51 | 3 | HTTP 路由 `/bootstrap-refine` 与 zod BootstrapRefineBody 的路由字符串冻结,函数与 schema 符号可改 |
| buildBootstrapAgentProgressProcessEvents | buildGenerateAgentProgressProcessEvents | Alembic/lib/workflows/ai-execution/AgentRunProcessEvents.ts:140 | 3 | |
| buildBootstrapDimensionAdmissionDecisions | buildGenerateDimensionAdmissionDecisions | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:106 | 2 | |
| buildBootstrapDimensionCompleteEventPayload | buildGenerateDimensionCompleteEventPayload | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:301 | 2 | |
| buildBootstrapDimensionErrorEventPayload | buildGenerateDimensionErrorEventPayload | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:490 | 1 | |
| buildBootstrapDimensionErrorPcvEvidenceEnvelope | buildGenerateDimensionErrorPcvEvidenceEnvelope | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:500 | 1 | |
| buildBootstrapDimensionInputProcessEvents | buildGenerateDimensionInputProcessEvents | Alembic/lib/workflows/ai-execution/AgentRunProcessEvents.ts:41 | 3 | |
| buildBootstrapDimensionPcvEvidenceEnvelope | buildGenerateDimensionPcvEvidenceEnvelope | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:335 | 2 | |
| buildBootstrapDimensionResultProcessEvents | buildGenerateDimensionResultProcessEvents | Alembic/lib/workflows/ai-execution/AgentRunProcessEvents.ts:95 | 3 | |
| buildBootstrapDimensionRunInput | buildGenerateDimensionRunInput | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:51 | 4 | 有 1 处字符串引用(诊断名),同批改 |
| buildBootstrapPcvStageNodeContext | buildGeneratePcvStageNodeContext | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:182 | 4 | |
| buildBootstrapPcvStageNodeMap | buildGeneratePcvStageNodeMap | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:178 | 1 | |
| buildBootstrapRebuildConfirmationBlock | buildGenerateRebuildConfirmationBlock | AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:1123 | 2 | |
| buildBootstrapSessionExecutionInput | buildGenerateSessionExecutionInput | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:72 | 3 | |
| buildBootstrapSessionRunInput | buildGenerateSessionRunInput | Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:206 | 3 | 有 1 处字符串引用(诊断名),同批改 |
| buildBootstrapTerminalPolicyHints | buildGenerateTerminalPolicyHints | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:61 | 5 | 跨仓:AlembicAgent/src/agent/profiles/AgentStageFactoryRegistry.ts 经 core subpath import,同批 |
| buildBootstrapTierReflectionProcessEvents | buildGenerateTierReflectionProcessEvents | Alembic/lib/workflows/ai-execution/AgentRunProcessEvents.ts:226 | 3 | |
| consumeBootstrapDimensionError | consumeGenerateDimensionError | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:891 | 3 | |
| consumeBootstrapDimensionResult | consumeGenerateDimensionResult | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:522 | 3 | |
| consumeBootstrapSessionResult | consumeGenerateSessionResult | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:970 | 3 | |
| consumeBootstrapSkills | consumeGenerateSkills | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1073 | 3 | |
| consumeBootstrapTierReflection | consumeGenerateTierReflection | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1356 | 3 | |
| consumeMissingBootstrapDimensions | consumeMissingGenerateDimensions | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:1022 | 2 | |
| createBootstrapDimensionRuntimeInput | createGenerateDimensionRuntimeInput | Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:142 | 3 | |
| createBootstrapStrategy | createGenerateStrategy | AlembicAgent/src/agent/context/exploration/ExplorationStrategies.ts:143 | 2 | system 探索默认策略(ExplorationTracker.ts:177 兜底分支),属生成链语义 |
| decideBootstrapDimensionCheckpoint | decideGenerateDimensionCheckpoint | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:394 | 2 | |
| getBootstrapChildDimensionId | getGenerateChildDimensionId | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:588 | 2 | |
| getBootstrapDimensionExistingRecipes | getGenerateDimensionExistingRecipes | Alembic/lib/workflows/ai-execution/RescanContext.ts:122 | 3 | |
| getBootstrapStageTerminalTools | getGenerateStageTerminalTools | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:42 | 6 | 跨仓消费(Agent AgentStageFactoryRegistry),同批 |
| initializeBootstrapRuntime | initializeGenerateRuntime | Alembic/lib/workflows/ai-execution/RuntimeInitializer.ts:43 | 5 | 有 1 处字符串引用 'initializeBootstrapRuntime'(诊断名),同批改 |
| mergeBootstrapPcvNodeEvidence | mergeGeneratePcvNodeEvidence | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:511 | 3 | |
| prepareBootstrapRescanState | prepareGenerateRescanState | Alembic/lib/workflows/ai-execution/RescanContext.ts:44 | 4 | |
| projectBootstrapDimensionAgentOutput | projectGenerateDimensionAgentOutput | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:298 | 4 | |
| projectBootstrapDimensionRescanContext | projectGenerateDimensionRescanContext | Alembic/lib/workflows/ai-execution/RescanContext.ts:137 | 3 | |
| projectBootstrapExistingRecipesForPrompt | projectGenerateExistingRecipesForPrompt | Alembic/lib/workflows/ai-execution/RescanContext.ts:178 | 3 | |
| projectBootstrapSessionResult | projectGenerateSessionResult | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:463 | 3 | |
| recordBootstrapDimensionTokenUsage | recordGenerateDimensionTokenUsage | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:408 | 2 | |
| registerProjectContextWorkflowSessionReleaseOnBootstrapCompletion | registerProjectContextWorkflowSessionReleaseOnGenerateCompletion | Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts:587 | 5 | 有字符串引用 ×2(Alembic/test/unit/ProjectIndexWorkflow.test.ts:88、:104,作为注册步骤名断言),同批改 |
| resolveBootstrapDimensionAdmissions | resolveGenerateDimensionAdmissions | Alembic/lib/workflows/ai-execution/DimensionAdmission.ts:42 | 3 | |
| resolveBootstrapDimensionConsumerRunIssue | resolveGenerateDimensionConsumerRunIssue | Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts:165 | 2 | |
| resolveBootstrapDimensionPlan | resolveGenerateDimensionPlan | Alembic/lib/workflows/ai-execution/DimensionRuntimeBuilder.ts:73 | 3 | |
| resolveBootstrapDimensionRunIssue | resolveGenerateDimensionRunIssue | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:147 | 4 | |
| resolveBootstrapDimensionTier | resolveGenerateDimensionTier | Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:555 | 2 | |
| resolveBootstrapGroundingEnforcement | resolveGenerateGroundingEnforcement | Alembic/lib/workflows/ai-execution/AiDimensionSessionRunner.ts:378 | 2 | |
| resolveBootstrapSession | resolveGenerateSession | AlembicPlugin/lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts:85 | 2 | |
| resolveBootstrapTerminalToolset | resolveGenerateTerminalToolset | AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts:26 | 6 | 跨仓消费(Agent AgentStageFactoryRegistry),同批 |
| runBootstrapPlanGate | runGeneratePlanGate | Alembic/lib/daemon/PlanSelectionGate.ts:30 | 2 | gate 诊断 id 'job-bootstrap-planSelection'(PlanSelectionGate 内,2 处)为运行时诊断,可同批改或保留,不是 wire |
| toBootstrapSessionDimensionResults | toGenerateSessionDimensionResults | Alembic/lib/workflows/ai-execution/AgentRunProjections.ts:517 | 1 | |
| useBootstrapSocket | useGenerateSocket | AlembicDashboard/src/hooks/useBootstrapSocket.ts:114 | 4 | 消费:App.tsx 等;内部 interface UseBootstrapSocketReturn(:95,未导出)一并改 |

### 常量

| 旧符号 | 新符号 | 定义文件 | 出现文件数 | 备注 |
|---|---|---|---|---|
| BOOTSTRAP_DIM_LABELS | GENERATE_DIM_LABELS | AlembicDashboard/src/constants/index.ts:4 | 1 | |
| BOOTSTRAP_PROFILES | GENERATE_PROFILES | AlembicAgent/src/agent/profiles/definitions/bootstrap.profile.ts:3 | 2 | 内含 profile id/partitioner/merge/factory 字符串,见 3a-3 |
| BootstrapInput(zod const+同名 type) | GenerateInput | Alembic/lib/shared/schemas/mcp-tools.ts:433/434 | 9(两仓同名合计) | MCP 工具名 `alembic_bootstrap` 冻结,只改 schema 符号 |
| BootstrapInput(zod const+同名 type) | GenerateInput | AlembicPlugin/lib/shared/schemas/mcp-tools.ts:1115/1156 | (同上) | 同上;Plugin cold-start.ts / project-index.ts 签名引用同批 |
| BootstrapRefineBody | GenerateRefineBody | Alembic/lib/shared/schemas/http-requests.ts:229 | 2 | HTTP 路由 `/bootstrap-refine` 字符串冻结 |
| ModuleBootstrapBody | ModuleGenerateBody | Alembic/lib/shared/schemas/http-requests.ts:309 | 3(两仓同名合计) | HTTP `/api/v1/modules/bootstrap` 路由字符串冻结 |
| ModuleBootstrapBody | ModuleGenerateBody | AlembicPlugin/lib/shared/schemas/http-requests.ts:188 | (同上) | |
| PCV_BOOTSTRAP_STAGE_NODE_MAP_CONTRACT | PCV_GENERATE_STAGE_NODE_MAP_CONTRACT | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:26 | 1 | ⚠️ 只改符号;字符串值 'PCVBootstrapStageNodeMap' 是证据信封契约 id,冻结(见 3a-3) |
| PCV_BOOTSTRAP_STAGE_NODE_MAP_CONTRACT_VERSION | PCV_GENERATE_STAGE_NODE_MAP_CONTRACT_VERSION | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:27 | 1 | |
| bootstrapSnapshots(Drizzle 表对象) | generateSnapshots | AlembicCore/src/infrastructure/database/drizzle/schema.ts:294 | 3 | ⚠️ 只改 TS 对象名;`sqliteTable('bootstrap_snapshots', …)` 第一参表名字符串绝不改 |
| bootstrapDimFiles(Drizzle 表对象) | generateDimFiles | AlembicCore/src/infrastructure/database/drizzle/schema.ts:325 | 3 | 同上,表名字符串 'bootstrap_dim_files' 绝不改 |

3a-2 合计:函数 56 行、常量 11 行 = 67 行。

---

## 3a-3 半 wire(同批联动字符串)

跨文件/跨仓按字符串匹配的名字。改名必须同批覆盖下列全部引用点;跨仓条目按 wire-contract.md 半 wire 规则加旧名 alias 一个版本。

| 符号/字符串 | 新名 | 全部字符串引用点(file:line) | 过渡策略 |
|---|---|---|---|
| Agent profile id `'bootstrap-session'` | `'generate-session'` | 定义:AlembicAgent/src/agent/profiles/definitions/bootstrap.profile.ts:5。构造引用:Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:216(profile.id)。测试:Alembic/test/unit/AgentProfileCompiler.test.ts:153,156;Alembic/test/unit/AgentRunCoordinator.test.ts:19,65,100,115,143,179,215,249,293;Alembic/test/unit/AgentService.test.ts:89,114;Alembic/test/unit/BootstrapProjection.test.ts:632;Alembic/test/unit/BootstrapSessionConsumer.test.ts:13;Alembic/test/unit/BootstrapSessionExecutionBuilder.test.ts:85;Alembic/test/unit/BootstrapSessionInputBuilder.test.ts:53,58 | registry 双 key 过渡(wire-contract.md 第 43 行既定计划)。⚠️ 以下同串不同义站点**不改**:AlembicCore/src/workflows/capabilities/host-agent/analysis-packet/Types.ts:143(checkpointKind 持久化枚举)、Alembic/lib/daemon/DaemonJobRunner.ts:690,1285(artifactRefs kind,落 job process events)、AgentRunInputBuilders.ts:235(metadata.phase,落 process events)——见 3b |
| Agent profile id `'bootstrap-dimension'` | `'generate-dimension'` | 定义:bootstrap.profile.ts:30(id);childProfile 引用:bootstrap.profile.ts:15,23;AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts:319;Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:101;Alembic/lib/workflows/ai-execution/SessionExecutionBuilder.ts:452。测试:AgentProfileCompiler.test.ts:122,126,130,162;BootstrapProjection.test.ts:27;BootstrapProcessEvents.test.ts:19;BootstrapSessionConsumer.test.ts:36;AgentRunCoordinator.test.ts:81,127,158,194,228,273;AgentService.test.ts:110,118,119;BootstrapSessionExecutionBuilder.test.ts:56,186,250,283,299,475;BootstrapSessionInputBuilder.test.ts:14;BootstrapInputBuilder.test.ts:55(以上测试均在 Alembic/test/unit/) | registry 双 key 过渡;AgentRunCoordinator.ts:319 是运行时按 id 分派的关键消费点,漏改即 fanout 断链 |
| fanout partitioner `'bootstrapSessionDimensions'` | `'generateSessionDimensions'` | 注册:AlembicAgent/src/agent/coordination/AgentRunCoordinator.ts:26;引用:bootstrap.profile.ts:16,22;测试:AlembicAgent/test/agent-surface-floor.test.ts:369,418;Alembic/test/unit/AgentProfileCompiler.test.ts:161 | 注册表双 key 一个版本(或注册表+profile 同 commit 原子切换,Agent 仓内自洽;跨仓只有 Alembic 测试断言) |
| fanout merge `'bootstrapSessionResults'` | `'generateSessionResults'` | 注册:AgentRunCoordinator.ts:27;引用:bootstrap.profile.ts:17,24;测试:agent-surface-floor.test.ts:370,419;AgentProfileCompiler.test.ts:163 | 同上 |
| stage factory `'bootstrapDimensionPipeline'` | `'generateDimensionPipeline'` | 注册:AlembicAgent/src/agent/profiles/AgentStageFactoryRegistry.ts:69;引用:bootstrap.profile.ts:38;⚠️ AlembicAgent/src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts:48(module-mining profile 复用同一 factory);注释提及:AlembicAgent/src/agent/profiles/presets.ts:181;测试:AlembicAgent/test/module-mining-agent-run.test.ts:59;AlembicAgent/test/bootstrap-analyze-budget.test.ts:17,46,64 | 注册表双 key 一个版本;module-mining profile 的引用必须同 commit,否则批 3 直接打断 moduleMining |
| DI key `'bootstrapTaskManager'` | `'generateTaskManager'` | 注册:Alembic/lib/injection/modules/InfraModule.ts:77;AlembicPlugin/lib/injection/modules/InfraModule.ts:71。消费:Alembic/bin/cli.ts:795,948;Alembic/lib/daemon/DaemonJobRunner.ts:363,951,1122;Alembic/lib/tools/adapters/DashboardOperations.ts:235;Alembic/lib/workflows/ai-execution/TaskManagerDispatch.ts:43;Alembic/lib/workflows/ai-execution/AiDimensionPreparation.ts:64;Alembic/lib/http/routes/modules.ts:619;Alembic/lib/http/routes/jobs.ts:474;Alembic/lib/service/bootstrap/BootstrapEventEmitter.ts:41;Alembic/lib/service/bootstrap/BootstrapRefine.ts:76;AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapEventEmitter.ts:37。测试:Alembic/test/unit/BootstrapEventEmitter.test.ts:11,56 | 容器 key 不持久化,Alembic/Plugin 各自仓内一个 commit 原子切换即可;两仓分别自洽,无跨仓运行时耦合 |
| DI key `'bootstrapSessionManager'` | `'generateSessionManager'` | 注册+读取:AlembicCore/src/workflows/capabilities/host-agent/SessionSupport.ts:32,49。消费:AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts:869;AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:891。测试:AlembicCore/test/BootstrapSessionManager.test.ts:212;Alembic/test/unit/ProjectContextWorkflowFacts.test.ts:1426;AlembicPlugin/test/unit/HostAgentDimensionCompletionWorkflow.test.ts:620,689;AlembicPlugin/test/unit/SubmitKnowledgeRouter.test.ts:982 | ⚠️ 真跨仓(Core 注册⇄Plugin/主体读取):Core 侧 get/register 双 key 读旧写新一个版本,Core+Plugin+Alembic 同批联动 |
| DI key `'bootstrapRepository'` | `'generateRepository'` | key 目录:AlembicCore/src/repositories.ts:229(ALEMBIC_REPOSITORY_KEYS)。注册:Alembic/lib/injection/modules/InfraModule.ts:139;AlembicPlugin/lib/injection/modules/InfraModule.ts:114(均含 `getCoreRepositoryBundle(ct).bootstrapRepository` 属性访问,属性名随 Core bundle 类型改) | 跨仓(Core key 目录⇄两宿主注册):三仓同批;bundle 属性是 TS 类型约束可静态验证,字符串 key 双 key 一个版本 |
| env `'ALEMBIC_BOOTSTRAP_CONCURRENCY'` | `'ALEMBIC_GENERATE_CONCURRENCY'` | 定义引用:AlembicAgent/src/agent/profiles/definitions/bootstrap.profile.ts:21;读取:Alembic/lib/workflows/ai-execution/AiDimensionSessionRunner.ts:364(已有 ALEMBIC_PARALLEL_CONCURRENCY 优先);测试:Alembic/test/unit/AiDimensionSessionRunner.test.ts:32 | 用户可见 env,是否改名=产品决策;若改,读新名回退旧名一个版本并在 release note 标注。默认建议:本批保留旧 env 不动,只登记 |
| PCV 契约值 `'PCVBootstrapStageNodeMap'` | (值冻结,只改持有符号) | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:26(定义);Alembic/test/unit/BootstrapDimensionRuntimeBuilder.test.ts:183、Alembic/test/unit/BootstrapInputBuilder.test.ts:118(断言) | 证据信封契约 id 随 PCV 证据落运行时 JSON;值不改,改值=显式版本升级(_VERSION+1)的产品决策。同族:'alembic-cold-start-bootstrap-node-local'(AiDimensionFinalizer.ts:510+测试)与 'PCVColdStartNodeLocalBaseline'(PcvNodeEvidence.ts:19)在 3d 批同样只改符号不改值 |
| workflow session source `'alembic-main-bootstrap'` | `'alembic-main-generate'`(待持久化确认) | 类型联合定义:Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts:48;使用:Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:161;Alembic/lib/daemon/PlanSelectionGate.ts:36,45;测试:Alembic/test/unit/ProjectContextWorkflowFacts.test.ts:326,463,634 | 改前必须实证该 source 是否写入 ~/.asd 原生 ProjectScope/会话运行时 JSON(ProjectScope 会话记录);若持久化→转 3b 冻结或双值兼容;若纯内存→仓内原子改 |
| workflow session source `'codex-host-bootstrap'` | `'codex-host-generate'`(待持久化确认) | 类型联合:AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts:31;使用:AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:193;测试:AlembicPlugin/test/unit/NativeProjectScopeRuntimeWiring.test.ts:138;HostAgentProjectContextDirectSwitch.test.ts:30,70,137;HostAgentProjectContextScopeParity.test.ts:51 | 同上 |
| Skill hook 名 `'onBootstrapStart'` / `'onBootstrapComplete'` | `'onGenerateStart'` / `'onGenerateComplete'`(加旧名映射) | 注册表:Alembic/lib/service/skills/SkillHooks.ts:50,51;AlembicPlugin/lib/service/skills/SkillHooks.ts:50,51;触发:Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:293(onBootstrapComplete) | 用户 Skill 文件按名实现 hook=对外表面;HOOK_REGISTRY 已有「向后兼容旧名映射」机制(SkillHooks.ts:54-56 先例),新名+旧名 compat 行各一,旧名保留至少一个版本 |
| Dashboard i18n key 前缀 `bootstrap.*`(如 'bootstrap.testModeAll'/'bootstrap.testMode'/'bootstrap.noMatch') | `generate.*` | 字典:AlembicDashboard/src/i18n/locales/en.ts:991 附近段、zh.ts:988 附近段(bootstrap 段整段);t() 调用:AlembicDashboard/src/components/Layout/Header.tsx:965,966;AlembicDashboard/src/components/Views/BootstrapProgressView.tsx:608,609 及同文件其余 bootstrap.* key | Dashboard 仓内字符串对,字典段+全部 t() 调用一个 commit 原子改;无持久化 |

3a-3 合计:14 行。

---

## 3a-4 文件 rename 清单

| 旧路径 | 新路径 |
|---|---|
| AlembicCore/src/repository/bootstrap/BootstrapRepository.ts | AlembicCore/src/repository/bootstrap/GenerateRepository.ts(目录冻结,只改文件名;注意 package exports 有 `./repository/bootstrap/*` 通配深路径,见风险注记) |
| AlembicCore/src/service/bootstrap/BootstrapDedup.ts | AlembicCore/src/service/bootstrap/GenerateDedup.ts(目录冻结) |
| AlembicCore/src/workflows/capabilities/host-agent/BootstrapSession.ts | AlembicCore/src/workflows/capabilities/host-agent/GenerateSession.ts |
| AlembicCore/src/workflows/capabilities/planning/dimensions/BootstrapTerminalToolset.ts | AlembicCore/src/workflows/capabilities/planning/dimensions/GenerateTerminalToolset.ts |
| AlembicCore/src/workflows/capabilities/planning/dimensions/bootstrapDimensionConfigs.ts | AlembicCore/src/workflows/capabilities/planning/dimensions/generateDimensionConfigs.ts(文件内导出 DIMENSION_CONFIGS_V3 等无 bootstrap 词根,仅文件名) |
| AlembicCore/test/BootstrapSessionManager.test.ts | AlembicCore/test/GenerateSessionManager.test.ts |
| AlembicCore/test/BootstrapTerminalToolset.test.ts | AlembicCore/test/GenerateTerminalToolset.test.ts |
| AlembicCore/test/unit/BootstrapDedup.test.ts | AlembicCore/test/unit/GenerateDedup.test.ts |
| Alembic/lib/service/bootstrap/(目录) | Alembic/lib/service/generate/(主体仓无包 subpath 约束;目录下相对导入全量替换) |
| Alembic/lib/service/bootstrap/BootstrapEfficiency.ts | Alembic/lib/service/generate/GenerateEfficiency.ts(文件内导出为 AgentEfficiency* 系列,仅文件名) |
| Alembic/lib/service/bootstrap/BootstrapEventEmitter.ts | Alembic/lib/service/generate/GenerateEventEmitter.ts |
| Alembic/lib/service/bootstrap/BootstrapRefine.ts | Alembic/lib/service/generate/GenerateRefine.ts |
| Alembic/lib/service/bootstrap/BootstrapTaskManager.ts | Alembic/lib/service/generate/GenerateTaskManager.ts |
| Alembic/lib/service/bootstrap/bootstrap-event-types.ts | Alembic/lib/service/generate/generate-event-types.ts |
| Alembic/lib/workflows/ai-execution/BootstrapConsumers.ts | Alembic/lib/workflows/ai-execution/GenerateConsumers.ts |
| Alembic/lib/types/bootstrap.d.ts | Alembic/lib/types/generate.d.ts(内容为 DimensionDigest 等生成链类型) |
| Alembic/test/integration/BootstrapLifecycle.test.ts | Alembic/test/integration/GenerateLifecycle.test.ts |
| Alembic/test/unit/BootstrapDimensionAdmission.test.ts | Alembic/test/unit/GenerateDimensionAdmission.test.ts |
| Alembic/test/unit/BootstrapDimensionConsumer.test.ts | Alembic/test/unit/GenerateDimensionConsumer.test.ts |
| Alembic/test/unit/BootstrapDimensionRuntimeBuilder.test.ts | Alembic/test/unit/GenerateDimensionRuntimeBuilder.test.ts |
| Alembic/test/unit/BootstrapEventEmitter.test.ts | Alembic/test/unit/GenerateEventEmitter.test.ts |
| Alembic/test/unit/BootstrapInputBuilder.test.ts | Alembic/test/unit/GenerateInputBuilder.test.ts |
| Alembic/test/unit/BootstrapProcessEvents.test.ts | Alembic/test/unit/GenerateProcessEvents.test.ts |
| Alembic/test/unit/BootstrapProjection.test.ts | Alembic/test/unit/GenerateProjection.test.ts |
| Alembic/test/unit/BootstrapRescanState.test.ts | Alembic/test/unit/GenerateRescanState.test.ts |
| Alembic/test/unit/BootstrapRuntimeInitializer.test.ts | Alembic/test/unit/GenerateRuntimeInitializer.test.ts |
| Alembic/test/unit/BootstrapSessionConsumer.test.ts | Alembic/test/unit/GenerateSessionConsumer.test.ts |
| Alembic/test/unit/BootstrapSessionExecutionBuilder.test.ts | Alembic/test/unit/GenerateSessionExecutionBuilder.test.ts |
| Alembic/test/unit/BootstrapSessionInputBuilder.test.ts | Alembic/test/unit/GenerateSessionInputBuilder.test.ts |
| Alembic/test/unit/BootstrapSkillConsumer.test.ts | Alembic/test/unit/GenerateSkillConsumer.test.ts |
| Alembic/test/unit/BootstrapTaskManager.test.ts | Alembic/test/unit/GenerateTaskManager.test.ts |
| Alembic/test/unit/BootstrapTerminalToolset.test.ts | Alembic/test/unit/GenerateTerminalToolset.test.ts |
| Alembic/test/unit/BootstrapTierReflectionConsumer.test.ts | Alembic/test/unit/GenerateTierReflectionConsumer.test.ts |
| AlembicPlugin/lib/recipe-generation/bootstrap/(目录) | AlembicPlugin/lib/recipe-generation/generate/(#recipe-generation/* 为仓内 package imports 别名,可改;RG9 shim 的转发目标同步) |
| AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapEventEmitter.ts | AlembicPlugin/lib/recipe-generation/generate/GenerateEventEmitter.ts |
| AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapTaskManager.ts | AlembicPlugin/lib/recipe-generation/generate/GenerateTaskManager.ts |
| AlembicPlugin/lib/recipe-generation/bootstrap/bootstrap-event-types.ts | AlembicPlugin/lib/recipe-generation/generate/generate-event-types.ts |
| AlembicPlugin/lib/runtime/mcp/handlers/host-agent/bootstrap.ts | AlembicPlugin/lib/runtime/mcp/handlers/host-agent/generate.ts(MCP 工具名 alembic_bootstrap 不动;tool-router 的相对 import './handlers/host-agent/bootstrap.js' 同步) |
| AlembicPlugin/lib/types/bootstrap.d.ts | AlembicPlugin/lib/types/generate.d.ts |
| AlembicPlugin/test/integration/BootstrapLifecycle.test.ts | AlembicPlugin/test/integration/GenerateLifecycle.test.ts |
| AlembicPlugin/test/integration/RealProjectBootstrap.test.ts | AlembicPlugin/test/integration/RealProjectGenerate.test.ts |
| AlembicPlugin/test/unit/BootstrapDedup.test.ts | AlembicPlugin/test/unit/GenerateDedup.test.ts |
| AlembicPlugin/test/unit/BootstrapTerminalToolset.test.ts | AlembicPlugin/test/unit/GenerateTerminalToolset.test.ts |
| AlembicPlugin/test/unit/HostAgentBootstrapRoute.test.ts | AlembicPlugin/test/unit/HostAgentGenerateRoute.test.ts |
| AlembicAgent/src/tools/runtime/capabilities/BootstrapAnalyze.ts | AlembicAgent/src/tools/runtime/capabilities/GenerateAnalyze.ts |
| AlembicAgent/src/tools/runtime/capabilities/BootstrapProduce.ts | AlembicAgent/src/tools/runtime/capabilities/GenerateProduce.ts |
| AlembicAgent/src/agent/profiles/definitions/bootstrap.profile.ts | AlembicAgent/src/agent/profiles/definitions/generate.profile.ts |
| AlembicAgent/test/bootstrap-analyze-budget.test.ts | AlembicAgent/test/generate-analyze-budget.test.ts |
| AlembicDashboard/src/hooks/useBootstrapSocket.ts | AlembicDashboard/src/hooks/useGenerateSocket.ts |
| AlembicDashboard/src/components/Views/BootstrapProgressView.tsx | AlembicDashboard/src/components/Views/GenerateProgressView.tsx(默认导出 const BootstrapProgressView:528 与内部 Props:513 一并改) |

不 rename(路径冻结/兼容层,明细见 3b):AlembicCore/src/repository/bootstrap/、src/service/bootstrap/ 目录本身;AlembicPlugin/lib/service/bootstrap/*(RG9 兼容 shim,3 个文件);AlembicPlugin/test/codex-scenarios/cold-start/*.json(场景 id 与 wire 工具名绑定);Alembic/lib/Bootstrap.ts、AlembicPlugin/lib/bootstrap.ts(应用引导)。

3a-4 合计:50 条 rename(Core 8、Alembic 25、Plugin 11、Agent 4、Dashboard 2,内含 2 个目录 rename)。

---

## 3b 排除项(不改+理由)

| 符号/名字 | 理由(应用引导语义/wire 冻结) |
|---|---|
| class Bootstrap + `export { AppRuntime as Bootstrap }` + export default(Alembic/lib/Bootstrap.ts:260-261)与文件 Alembic/lib/Bootstrap.ts | 应用启动引导(AppRuntime 别名),名实相符;bin/cli.ts 与测试经 '../lib/Bootstrap.js' 相对路径消费 |
| class Bootstrap(AlembicPlugin/lib/bootstrap.ts:42)与文件 AlembicPlugin/lib/bootstrap.ts | 插件应用入口(configurePathGuard/initialize),应用引导语义 |
| createTestBootstrap(Alembic/test/fixtures/factory.ts:28;AlembicPlugin/test/fixtures/factory.ts:28) | 创建 AppRuntime 测试实例=应用引导语义 |
| 测试夹具字符串 'export class Bootstrap {}'(AlembicCore/test/IsOwnDevRepo.test.ts:28)、'export function bootstrapApp()'(AlembicCore/test/SourceGraphQueryService.test.ts:296) | 模拟主体仓应用引导文件的 fixture 内容,非真实符号 |
| 表名字符串 'bootstrap_snapshots'/'bootstrap_dim_files'(schema.ts:295,326;Alembic 与 Plugin CleanupService;AlembicPlugin/lib/infrastructure/database/SqliteDatabaseAccess.ts:160) | wire:SQLite 现场数据(wire-contract.md §SQLite) |
| job kind 'bootstrap'(ALEMBIC_JOB_KINDS 及 daemon job 持久化各引用点) | wire:作业类型枚举(wire-contract.md 第 24 行) |
| MCP 工具名 'alembic_bootstrap'(全范围 83 处字符串) | wire:LLM 按字符串调用+job 历史 createdByTool(第 33 行) |
| HTTP 路由 '/api/v1/modules/bootstrap'、'/jobs/bootstrap'、'/bootstrap/status'、'/bootstrap/cancel'、'/bootstrap-refine'、'/bootstrap/report/latest'、'/bootstrap/reports*'、'/modules/bootstrap/status'、'/modules/bootstrap/cancel'、'/spm/bootstrap' | wire:HTTP 表面(第 34 行);Dashboard/外部消费 |
| CLI 'alembic coldstart'/'alembic rescan' | wire:CLI 表面(第 35 行) |
| Socket 事件 'bootstrap:started'/'bootstrap:task-*'/'bootstrap:all-completed'/'bootstrap:process-events'/'bootstrap:ai-unavailable'(单源 RECIPE_PIPELINE_EVENTS,AlembicCore/src/domain/knowledge/recipe-authoring-spec/pipelineEvents.ts)与 'rescan:bootstrap-session-cancelled'、'knowledge:bootstrap'(EventBus 内部事件名) | wire:事件名冻结(第 36 行);批内仅允许把裸字符串消费端改为引用常量(Dashboard 不依赖 Core 包,保留裸字符串) |
| 目录/文件 '.asd/bootstrap-sessions/'、'.asd/bootstrap-report.json'、会话 id 前缀 `bs_`(生成点:Alembic/lib/service/bootstrap/BootstrapTaskManager.ts:268;AlembicPlugin/lib/recipe-generation/bootstrap/BootstrapTaskManager.ts:202) | wire:持久化会话/报告(第 27 行) |
| 目录 '.asd/bootstrap-checkpoint/'(AlembicCore/src/workflows/capabilities/persistence/DimensionCheckpoint.ts:39,58,80;MiningSessionStore.ts:435,448;AlembicAgent/src/agent/memory/SessionStore.ts:689,723,727;AlembicCore/src/shared/WorkspaceResolver.ts:271;'.asd/bootstrap-checkpoint/session-store.json') | 现场持久化目录,等同 wire;**未列入 wire-contract.md,建议批 3 顺手补表** |
| 目录 'bootstrap-reports/'(runtime 报告历史,AlembicCore/src/workflows/capabilities/persistence/WorkflowReportHistoryStore.ts:78-104;Alembic/lib/http/routes/modules.ts:549,583,704;AlembicPlugin/lib/runtime/ProjectSkillDelivery.ts:287) | 现场持久化目录+HTTP 读取路径;**建议补入 wire-contract.md** |
| @alembic/core 包 subpath './repository/bootstrap'、'./repository/bootstrap/*'、'./service/bootstrap'、'./workflows/cold-start'、'./workflows/project-index'(AlembicCore/package.json exports) | wire:外层 import 契约(第 37 行);目录名不动,内部符号可改 |
| MCP/状态载荷字段与状态值:'bootstrapState'(AlembicPlugin/lib/runtime/mcp/core-tools/output.ts:112;cold-start.ts:843)、'isBootstrapComplete'(output.ts:162)、BootstrapSessionPublicState 取值 'bootstrap_in_progress'/'bootstrap_running'/'bootstrap_live'/'bootstrap_active'/'bootstrap_ready'/'needs_bootstrap'/'no_active_bootstrap'/'bootstrap_session' 等(AlembicCore BootstrapSession.ts:88,135,154;AlembicPlugin/lib/runtime/status/OnboardingContract.ts:215,1107,1113 等) | MCP 响应契约:宿主 LLM/skill 文案按字段与值读(alembic_status/alembic_bootstrap 的 bootstrapState 是插件对外 onboarding 契约) |
| 持久化枚举值 'bootstrap-session'(checkpointKind,AlembicCore/src/workflows/capabilities/host-agent/analysis-packet/Types.ts:143)、artifactRefs kind 'bootstrap-session'/'bootstrap-session-summary'/'bootstrap-task'(Alembic/lib/daemon/DaemonJobRunner.ts:690,742,1285,1294)、process-event metadata.phase 'bootstrap-session'(Alembic/lib/workflows/ai-execution/AgentRunInputBuilders.ts:235)及事件 stage/source id 'bootstrap-dimension-consumer'、'bootstrap-dimension-input/-result/-error'、'bootstrap-agent-progress'、'bootstrap-tier-reflection'、'bootstrap-session-summary' 等 | 落 job process events/分析包运行时 JSON 的持久化值;与同拼写 profile id 分离对待(见 3a-3 第 1 行) |
| daemon 能力 id 'jobs.api-ai.bootstrap'/'jobs.host-agent-recoverable.bootstrap'(AlembicCore/src/daemon/ResidentServiceContracts.ts:40,49;Alembic/lib/http/routes/daemon.ts:250;两仓测试) | 复合 id 内嵌冻结 job kind 'bootstrap',对外健康/能力表面 |
| HTTP 契约 operationId 'startBootstrapJob'(Alembic/lib/http/provider-contracts.ts:397;生成物 Alembic/lib/generated/dashboard-api-types.ts:1281、AlembicDashboard/src/generated/api-types.ts:1280) | 生成的 API 契约工件(GENERATED FILE);路由冻结,生成物不手改 |
| 权限 scope 'knowledge:bootstrap'(AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts:259,292;AlembicDashboard/src/hooks/usePermission.ts:64) | 绑定冻结工具名 alembic_bootstrap 的权限口径,跨 Plugin⇄Dashboard;随工具名冻结 |
| job transcript 'transcripts/bootstrap.log'(AlembicCore/test/JobProcessEventContracts.test.ts:130,144) | 由冻结 job kind 派生的持久化工件名 |
| 退役路径守卫字符串:'lib/external/mcp/handlers/bootstrap/…' 系列、'lib/workflows/bootstrap'、'IncrementalBootstrap.js'、'BootstrapSnapshot.js'、'BootstrapDeliveryConsumer.js'、'BootstrapSemanticMemoryConsumer.js'、'BootstrapReport*.ts'、'BootstrapCheckpointStore.ts' 等(Alembic/test/unit/AgentModuleBoundaries.test.ts:21-40,356 及同类边界测试) | 断言「这些文件不存在」的反向守卫,改名即失效 |
| Agent profile id 'module-mining-session' 等 module-mining/rescan 系 profile id | wire-contract.md 第 44 行:名实相符保留 |
| 场景夹具 AlembicPlugin/test/codex-scenarios/cold-start/bootstrap-missing-ai.json、init-then-bootstrap-ai-ready.json 及场景 id 'bootstrap-missing-ai-uses-host-agent'、'init-then-codex-host-bootstrap'、'codex-host-bootstrap'(scenario name) | 场景描述串驱动 wire 工具 alembic_bootstrap,改名无收益且易撕裂夹具 |
| PCV 契约字符串值 'PCVBootstrapStageNodeMap'、'PCVColdStartNodeLocalBaseline'、scope 'alembic-cold-start-bootstrap-node-local' | 证据信封持久化契约值;符号改名不动值(见 3a-3) |
| `generationStage: 'coldStart'` 枚举值 | wire-contract.md 第 22 行:名实相符保留(3d 不得顺手改) |

---

## 3d 合并批符号(ColdStart/ProjectIndex,先列后处理)

批 3d 计划把 cold-start/project-index 工作流并入 GenerateWorkflow 概念;本批**不改**,仅登记符号+消费点。`@alembic/core/workflows/cold-start`、`…/workflows/project-index` subpath 冻结;`AlembicCore/src/workflows/cold-start/*` 4 个文件全部是转发 shim(`export * from '../project-index/ColdStart*.js'`),实现在 project-index 目录。

### 符号(59)

| 符号 | 类别 | 定义文件 | 出现文件数 | 消费点(文件) |
|---|---|---|---|---|
| COLD_START_TOOL_NAMES | const | AlembicPlugin/lib/runtime/ToolPolicy.ts:145 | 1 | 仅定义文件 |
| PCV_COLD_START_NODE_LOCAL_CONTRACT | const | Alembic/lib/workflows/ai-execution/PcvNodeEvidence.ts:19 | 2 | Alembic/lib/workflows/ai-execution/AiDimensionFinalizer.ts(值冻结,同 3a-3 PCV 行) |
| PCV_COLD_START_NODE_LOCAL_CONTRACT_VERSION | const | 同上:20 | 2 | 同上 |
| PROJECT_INDEX_MODULE_MINING_PROFILES | const | AlembicAgent/src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts:3 | 4 | AlembicAgent/src/agent/profiles/definitions/module.profile.ts、definitions/index.ts、test/module-mining-agent-run.test.ts |
| ColdStartExecutor | type | AlembicCore/src/workflows/project-index/ColdStartIntent.ts:20 | 1 | 仅定义文件 |
| InternalColdStartArgs | interface | 同上:22 | 3 | Alembic/lib/workflows/project-index/ProjectIndexWorkflow.ts、Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts |
| HostAgentColdStartArgs | interface | 同上:35 | 1 | 仅定义文件 |
| ColdStartProjectAnalysisIntent | interface | 同上:39 | 1 | 仅定义文件 |
| InternalColdStartExecutionIntent | interface | 同上:49 | 1 | 仅定义文件 |
| ColdStartWorkflowIntent | interface | 同上:54 | 7 | AlembicCore/src/plans.ts、src/host-agent-workflows.ts、workflows/project-index/{ColdStartPlan,ProjectIndexPlan,index}.ts、test/ProjectIndexWorkflowPlan.test.ts |
| createInternalColdStartIntent | function | 同上:66 | 8 | Core plans.ts/host-agent-workflows.ts/index.ts、test/{ColdStartSelectionSummary,ProjectIndexWorkflowPlan,PublicHostAgentWorkflowEntrypoints}.test.ts、Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts |
| createHostAgentColdStartIntent | function | 同上:93 | 7 | Core plans.ts/host-agent-workflows.ts/index.ts、test ×2、AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts |
| ColdStartWorkflowPlan | interface | AlembicCore/src/workflows/project-index/ColdStartPlan.ts:10 | 1 | 仅定义文件 |
| ColdStartSelectionSkipReason | type | 同上:28 | 1 | 仅定义文件 |
| ColdStartSelectionSummary | interface | 同上:32 | 2 | Core workflows/project-index/ColdStartPresenters.ts |
| buildColdStartWorkflowPlan | function | 同上:45 | 8 | Core plans.ts/host-agent-workflows.ts/index.ts、test ×2、Alembic ColdStartWorkflow.ts、Plugin cold-start.ts |
| selectColdStartDimensions | function | 同上:86 | 1 | 仅定义文件 |
| buildColdStartSelectionSummary | function | 同上:98 | 2 | Core test/ColdStartSelectionSummary.test.ts |
| ColdStartTargetFileMap | type | AlembicCore/src/workflows/project-index/ColdStartPresenters.ts:18 | 1 | 仅定义文件 |
| presentInternalColdStartEmptyProject | function | 同上:20 | 1 | 仅定义文件 |
| presentHostAgentColdStartEmptyProject | function | 同上:34 | 2 | Plugin cold-start.ts |
| buildInternalColdStartTargetFileMap | function | 同上:46 | 1 | 仅定义文件 |
| buildInternalColdStartReport | function | 同上:62 | 1 | 仅定义文件 |
| InternalColdStartResponseInput | interface | 同上:127 | 1 | 仅定义文件 |
| presentInternalColdStartResponse | function | 同上:140 | 2 | Core test/ColdStartSelectionSummary.test.ts |
| presentHostAgentColdStartResponse | function | 同上:224 | 3 | Core test/unit/HostAgentMiningWorkflow.test.ts、Plugin cold-start.ts |
| ProjectIndexMode | type | AlembicCore/src/workflows/project-index/ProjectIndexPlan.ts:12 | 4 | Core plans.ts、host-agent-workflows.ts、test/ProjectIndexWorkflowPlan.test.ts |
| ProjectIndexWorkflowPlanParts | interface | 同上:31 | 1 | 仅定义文件 |
| buildProjectIndexWorkflowPlanParts | function | 同上:61 | 3 | Core workflows/project-index/{ColdStartPlan,KnowledgeRescanWorkflowPlan}.ts |
| ProjectIndexFullWorkflowIntent(barrel 别名) | type 别名 | AlembicCore/src/workflows/project-index/index.ts | 3 | Core plans.ts、host-agent-workflows.ts |
| ProjectIndexIncrementalWorkflowIntent(barrel 别名) | type 别名 | 同上 | 3 | 同上 |
| createProjectIndexIntentFullHostAgent(barrel 别名) | 别名 | 同上 | 4 | Core plans.ts、host-agent-workflows.ts、test/PublicHostAgentWorkflowEntrypoints.test.ts |
| createProjectIndexIntentFullInternal(barrel 别名) | 别名 | 同上 | 4 | 同上 |
| createProjectIndexIntentIncrementalHostAgent(barrel 别名) | 别名 | 同上 | 4 | 同上 |
| createProjectIndexIntentIncrementalInternal(barrel 别名) | 别名 | 同上 | 4 | 同上 |
| buildProjectIndexFullPlan(barrel 别名) | 别名 | 同上 | 5 | Core plans.ts、host-agent-workflows.ts、test ×2 |
| ProjectIndexWorkflowMode | type | Alembic/lib/workflows/project-index/ProjectIndexWorkflow.ts:10 | 1 | 仅定义文件 |
| ProjectIndexMcpContext | type | 同上:11 | 3 | Alembic/lib/workflows/{knowledge-rescan/KnowledgeRescanWorkflow,cold-start/ColdStartWorkflow}.ts |
| ProjectIndexFullArgs | type | 同上:13 | 1 | 仅定义文件 |
| ProjectIndexIncrementalArgs | type | 同上:17 | 1 | 仅定义文件 |
| registerProjectIndexWorkflowImplementation | function(3 重载) | 同上:33,37,41 | 4 | Alembic KnowledgeRescanWorkflow.ts、ColdStartWorkflow.ts、test/unit/ProjectIndexWorkflow.test.ts |
| runProjectIndexWorkflow(主体) | function(3 重载) | 同上:52,57,62 | 15(两仓同名合计) | Alembic bin/cli.ts、lib/daemon/{DaemonJobRunner,DeepMiningRoundGate}.ts、KnowledgeRescanWorkflow.ts、ColdStartWorkflow.ts、test ×2;Plugin 同名见下行 |
| runProjectIndexWorkflow(Plugin) | function(3 重载) | AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-index.ts:23,28,33 | (同上) | Plugin knowledge-rescan.ts、cold-start.ts、runtime/mcp/handlers/host-agent/{bootstrap,rescan}.ts、test ×2 |
| runColdStartWorkflow | function | Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:99 | 2 | Alembic test/unit/ProjectIndexWorkflow.test.ts |
| resolveColdStartWorkflowDimensionSelection | function | 同上:342 | 2 | Alembic test/unit/ColdStartPlanSelection.test.ts |
| presentProjectContextColdStartEmptyProject | function | Alembic/lib/workflows/project-context/ProjectContextPresenters.ts:9 | 4 | Alembic ColdStartWorkflow.ts、ProjectContextWorkflowFacts.ts(再导出:41-46)、test/unit/ProjectContextWorkflowFacts.test.ts |
| presentProjectContextColdStartResponse | function | 同上:23 | 4 | 同上(测试 :1111 还以源码字符串断言导出名存在,改名同批) |
| HostAgentProjectIndexMode | type | AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-index.ts:14 | 1 | 仅定义文件 |
| HostAgentProjectIndexOptions | interface | 同上:16 | 1 | 仅定义文件 |
| runHostAgentColdStartWorkflow | function | AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:113(re-export 于 project-index.ts:47) | 7 | Plugin project-index.ts、handlers/host-agent/bootstrap.ts(别名 bootstrapForHostAgent)、test/unit/{HostAgentProjectIndexWorkflow,HostAgentProjectIndexCompat,PlanSelectionGateStateless,PlanDrivenGenerationGate}.test.ts |
| runHostAgentProjectIndexFullWorkflow | function | 同上:118 | 3 | Plugin project-index.ts、test/unit/HostAgentProjectIndexWorkflow.test.ts |
| runHostAgentProjectIndexIncrementalWorkflow | function | AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:144 | 3 | Plugin project-index.ts、test/unit/HostAgentProjectIndexWorkflow.test.ts |
| buildColdStartCompletenessCriticByDimension | function | AlembicPlugin/lib/recipe-generation/host-agent-workflows/completeness-critic.ts:70 | 2 | Plugin cold-start.ts |
| buildColdStartOnboardingContract | function | AlembicPlugin/lib/runtime/status/OnboardingContract.ts:89 | 3 | Plugin cold-start.ts、test/unit/recipe-gate-drift-tripwire.test.ts |
| ProjectIndexScopedModule | interface | AlembicAgent/src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts:4 | 2 | AlembicAgent/src/agent/runs/module/ModuleMiningAgentRun.ts |
| RunProjectIndexScopedModuleMiningInput | interface | 同上:14 | 2 | 同上 |
| runProjectIndexScopedModuleMining | function | 同上:23 | 3 | 同上+test/module-mining-agent-run.test.ts |
| SelectProjectIndexModuleMiningModulesInput | interface | Alembic/lib/daemon/ModuleMiningSelection.ts:14 | 1 | 仅定义文件 |
| selectProjectIndexModuleMiningModules | function | 同上:21 | 5 | Alembic lib/daemon/ModuleMiningWorkflow.ts、lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts、test/unit/{ModuleMiningSelection,KnowledgeRescanCoverageLedgerWrite}.test.ts |

### 涉及文件(3d 一并评估 rename/合并;subpath 冻结的目录只动内部)

- AlembicCore/src/workflows/project-index/:ColdStartIntent.ts、ColdStartPlan.ts、ColdStartPresenters.ts、ProjectIndexPlan.ts、index.ts(KnowledgeRescan*.ts 属 rescan 语义,3d 仅动目录归属决策)
- AlembicCore/src/workflows/cold-start/:index.ts、ColdStartIntent.ts、ColdStartPlan.ts、ColdStartPresenters.ts(纯转发 shim,subpath 冻结,保留壳)
- Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts、Alembic/lib/workflows/project-index/ProjectIndexWorkflow.ts
- AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts、project-index.ts;AlembicPlugin/lib/runtime/mcp/host-agent-workflows/{cold-start,project-index}.ts(RG9 转发 shim,保留)
- AlembicAgent/src/agent/runs/module-mining/ProjectIndexModuleMiningAgentRun.ts、src/agent/profiles/definitions/module-mining/ProjectIndexModuleMiningProfile.ts
- 测试:AlembicCore/test/{ColdStartSelectionSummary,ProjectIndexWorkflowPlan}.test.ts;Alembic/test/unit/{ProjectIndexWorkflow,ColdStartPlanSelection}.test.ts;AlembicPlugin/test/unit/{HostAgentProjectIndexWorkflow,HostAgentProjectIndexCompat}.test.ts
- 关联半 wire(3d 时处理):CLI 'alembic coldstart'(wire 冻结)、generationStage 'coldStart'(wire 冻结)、intent kind 字符串 'bootstrap-host-agent'(AlembicCore/src/workflows/project-index/ColdStartIntent.ts:43,107;测试 ProjectIndexWorkflowPlan.test.ts:108、PublicHostAgentWorkflowEntrypoints.test.ts:66)与 'host-agent-bootstrap'(AlembicCore/src/workflows/capabilities/host-agent/HostAgentDimensionCompletionWorkflow.ts:576;AlembicPlugin/lib/runtime/status/OnboardingContract.ts:1203)——两串是否持久化到快照/报告需 3d 先验证再定改否

---

## 风险注记(替换时易误伤的点)

1. **同串不同义 'bootstrap-session'**:同一拼写既是 Agent profile id(半 wire,可改),又是持久化 checkpointKind(Core analysis-packet/Types.ts:143)、job artifactRefs kind(DaemonJobRunner.ts:690,742,1285,1294)、process-event metadata.phase(AgentRunInputBuilders.ts:235)。全局 sed 必炸;必须按 3a-3 第 1 行的站点清单逐点改,持久化站点保持不动。
2. **类型改名但值冻结的三族**:① BootstrapSessionPublicState→GenerateSessionPublicState 但取值 'bootstrap_in_progress' 等是 MCP 状态契约;② Drizzle 对象 bootstrapSnapshots/bootstrapDimFiles 改名但 sqliteTable('bootstrap_snapshots'…) 表名串不动;③ PCV_BOOTSTRAP_STAGE_NODE_MAP_CONTRACT 改名但值 'PCVBootstrapStageNodeMap' 不动。做「符号改、字面量不改」的区分式替换,禁用无差别文本替换。
3. **'bootstrapDimensionPipeline' 被 module-mining 复用**:AgentStageFactoryRegistry.ts:69 的 factory 同时被 generate.profile 与 ProjectIndexModuleMiningProfile.ts:48 引用;只改 bootstrap 侧会打断 moduleMining。注册表双 key 或三处同 commit。
4. **双语义 Bootstrap 词根**:裸词 `Bootstrap` 出现在 137 个文件,其中应用引导(Alembic/lib/Bootstrap.ts、AppRuntime 别名、AlembicPlugin/lib/bootstrap.ts、createTestBootstrap、'../lib/Bootstrap.js' 相对导入、IsOwnDevRepo 夹具)必须保留。替换按符号逐个全词进行,不做词根级批量替换。
5. **同名跨仓/跨义符号**:BootstrapSession(Core 类 vs Dashboard interface)、BootstrapTaskManager/BootstrapEventEmitter/BootstrapInput/ModuleBootstrapBody/createTestBootstrap(两仓同名)、BootstrapTaskManagerLike(同仓两处)。计数共享,改名时按定义文件分别核对。
6. **Core 包通配 subpath `./repository/bootstrap/*`**:文件 BootstrapRepository.ts 改名会改变可深 import 的路径面;工作区内扫描无外层深 import(仅 3 处 `service/bootstrap`、74 处 `host-agent-workflows`、1 处 `workflows/cold-start/`),但 release/vendor 快照消费者不可见——建议改名后在原路径留一版 re-export 或先跑 `npm run build:check`+外层 tsc 验证。
7. **RG9 兼容 shim 别动路径只动目标**:AlembicPlugin/lib/service/bootstrap/*.ts 与 lib/runtime/mcp/host-agent-workflows/*.ts 的存在意义就是保住旧 import 路径;批 3 只更新它们的转发目标与再导出符号名(旧符号名经 `export { GenerateX as BootstrapX }` 保留),删除归 RG9。
8. **诊断名字符串随符号走**:'initializeBootstrapRuntime'、'buildBootstrapSessionRunInput'、'attachBootstrapProcessEventBridge'、'registerProjectContextWorkflowSessionReleaseOnBootstrapCompletion'(测试断言 ProjectIndexWorkflow.test.ts:88,104)等把函数名写进字符串;漏改导致测试红或诊断错位。用「旧符号名作为字符串再 grep 一遍」收尾。
9. **会话 source 串待持久化实证**:'alembic-main-bootstrap'/'codex-host-bootstrap' 若落 ~/.asd ProjectScope 运行时 JSON,改名会让旧会话记录失配;改前先在真机 runtime JSON 里 grep 实证(见 3a-3)。
10. **事件消费端只许换常量不许换值**:wire-contract.md 第 36 行「消费端字符串随 S4 批次切换」指裸字符串→RECIPE_PIPELINE_EVENTS 常量引用;Dashboard 不依赖 @alembic/core,其 'bootstrap:*' 裸串保留原样。

---

## 清单统计

| 分组 | 条数 |
|---|---|
| 3a-1 类 | 11 |
| 3a-1 接口 | 55 |
| 3a-1 类型别名 | 9 |
| 3a-2 函数 | 56 |
| 3a-2 常量 | 11 |
| 3a-3 半 wire | 14 |
| 3a-4 文件 rename | 50(含 2 目录) |
| 3b 排除项 | 25 |
| 3d 合并批符号 | 59(+关联文件 20+) |
| 风险注记 | 10 |
