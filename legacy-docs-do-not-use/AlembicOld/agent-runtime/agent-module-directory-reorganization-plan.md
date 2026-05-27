# Agent 与工具模块目录重组设计方案

> 本文档基于当前 `lib/agent`、统一 `AgentService`、`ToolRouter`、以及 bootstrap `orchestrator.ts` 的实际代码形态重新分析。
> 目标不是为了移动文件而移动文件，而是让目录结构反映真实职责：Agent 平台层、工具执行层、任务运行 helper、业务 workflow、外部入口适配层必须分清。

## 1. 当前事实扫描

### 1.1 `lib/agent` 已经承担多种不同性质

当前 `lib/agent` 下大致包含 117 个 TypeScript 文件，实际混合了以下职责：

1. **Agent 执行内核**
   - `AgentRuntime.ts`
   - `AgentRuntimeTypes.ts`
   - `AgentMessage.ts`
   - `PipelineStrategy.ts`
   - `strategies.ts`
   - `policies.ts`
   - `capabilities.ts`
   - `presets.ts`

2. **Agent 服务入口与 profile 编排**
   - `service/AgentService.ts`
   - `service/AgentRunContracts.ts`
   - `service/AgentRuntimeBuilder.ts`
   - `service/AgentProfileRegistry.ts`
   - `service/AgentProfileCompiler.ts`
   - `service/AgentStageFactoryRegistry.ts`
   - `service/AgentRunCoordinator.ts`

3. **Agent task helper / projection**
   - `service/ScanAgentRun.ts`
   - `service/ScanRunProjection.ts`
   - `service/TranslationAgentRun.ts`
   - `service/RelationAgentRun.ts`
   - `service/EvolutionAgentRun.ts`
   - `service/BootstrapSessionRun.ts`

4. **工具治理与执行平台**
   - `core/ToolRouter.ts`
   - `core/ToolExecutionPipeline.ts`
   - `core/GovernanceEngine.ts`
   - `core/ToolCallContext.ts`
   - `core/ToolResultEnvelope.ts`
   - `core/ToolContracts.ts`
   - `core/InternalToolHandler.ts`
   - `core/Tool*Services.ts`

5. **具体工具定义与 handler**
   - `tools/project-access.ts`
   - `tools/system-interaction.ts`
   - `tools/knowledge-graph.ts`
   - `tools/evolution-tools.ts`
   - `tools/scan-recipe.ts`
   - `tools/query.ts`
   - `tools/guard.ts`
   - `tools/lifecycle.ts`
   - `tools/composite.ts`
   - `tools/CapabilityCatalog.ts`
   - `tools/ToolDefinition.ts`

6. **外部能力 adapter**
   - `adapters/TerminalAdapter.ts`
   - `adapters/MacSystemAdapter.ts`
   - `adapters/SkillAdapter.ts`
   - `adapters/InternalToolAdapter.ts`
   - `adapters/WorkflowAdapter.ts`
   - `adapters/DashboardOperationAdapter.ts`

7. **Agent 相关 domain prompt / memory**
   - `domain/insight-analyst.ts`
   - `domain/insight-producer.ts`
   - `domain/insight-gate.ts`
   - `domain/insight-evolver.ts`
   - `domain/scan-prompts.ts`
   - `memory/*`
   - `context/*`

结论：`lib/agent` 现在已经不是单纯的 AgentRuntime 模块，而是 **Agent 平台 + 工具平台 + 系统适配器 + 部分业务 task helper** 的混合体。

### 1.2 bootstrap `orchestrator.ts` 不是 Agent 平台层

`lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts` 当前仍然位于 MCP handler 目录，但它的真实职责远超过外部入口适配：

1. 构建 project/bootstrap 业务上下文。
2. 处理 incremental bootstrap。
3. 处理 checkpoint restore / clear。
4. 构建 `MemoryCoordinator`、`SessionStore`、`DimensionContext`。
5. 构造 `bootstrap-session` parent `AgentRunInput`。
6. 使用 `AgentService.run(profile: bootstrap-session)` 统一执行维度 child runs。
7. 通过 hooks 消费 child result，写入 `dimensionStats`、`dimensionCandidates`、`SessionStore`、progress event。
8. 执行 skill generation。
9. 写 CodeEntityGraph relations。
10. 做 semantic memory consolidation。
11. 生成 bootstrap report。
12. 保存 incremental snapshot。
13. 触发 Cursor Delivery 与 Repo Wiki。

这些职责说明它既不属于 `lib/agent`，也不应该长期留在 `lib/external/mcp/handlers`。它是 **bootstrap workflow application service**。

### 1.3 `bootstrap-session` profile 与 bootstrap workflow 的边界

已经收敛到 Agent 层的内容：

1. `bootstrap-session` profile：声明 parent/child run 编排语义。
2. `bootstrap-dimension` profile：声明单维度 Agent 管线。
3. `AgentRunCoordinator`：通用 parent/child run 编排。
4. `buildBootstrapSessionRunInput()`：把 prepared child plans 转为 parent run input。
5. `AgentRunResult`：canonical result。

不应进入 Agent 层的内容：

1. `SessionStore.storeDimensionReport()`。
2. checkpoint save/restore。
3. `DimensionContext` digest/candidate 维护。
4. skill generation。
5. semantic memory consolidation。
6. report/snapshot/delivery/wiki。
7. bootstrap-specific progress event。

这条边界非常重要：**Agent 层只负责“怎么跑 Agent”，bootstrap workflow 负责“跑完之后业务如何消费”。**

## 2. 目标目录分层

### 2.1 顶层建议

目标上建议拆成五个顶层能力区：

```text
lib/
  agent/
    runtime/
    service/
    profiles/
    runs/
    memory/
    context/
    prompts/

  tools/
    core/
    catalog/
    adapters/
    handlers/
    governance/
    presentation/

  workflows/
    bootstrap/
    scan/
    relation/
    evolution/

  external/
    mcp/
    lark/
    http/

  service/
    ...
```

其中：

- `lib/agent` 只保留 Agent 运行模型相关代码。
- `lib/tools` 承载独立工具能力平台，不再语义上附属于 Agent。
- `lib/workflows` 承载业务流程编排。
- `lib/external` 只保留协议入口适配，不承载复杂业务流程。

## 3. `lib/agent` 目标结构

### 3.1 建议结构

```text
lib/agent/
  runtime/
    AgentRuntime.ts
    AgentRuntimeTypes.ts
    AgentMessage.ts
    AgentState.ts
    AgentEventBus.ts
    LoopContext.ts
    MessageAdapter.ts
    DiagnosticsCollector.ts
    SystemPromptBuilder.ts
    SystemRunContext.ts
    ToolExecutionPipeline.ts
    LLMResultType.ts

  strategies/
    Strategy.ts
    SingleStrategy.ts
    PipelineStrategy.ts
    FanOutStrategy.ts
    AdaptiveStrategy.ts
    StrategyRegistry.ts

  capabilities/
    Capability.ts
    CapabilityRegistry.ts
    builtins.ts

  policies/
    BudgetPolicy.ts
    SafetyPolicy.ts
    QualityGatePolicy.ts
    PolicyEngine.ts

  service/
    AgentService.ts
    AgentRuntimeBuilder.ts
    AgentRunContracts.ts
    SystemRunContextFactory.ts

  profiles/
    AgentProfileRegistry.ts
    AgentProfileCompiler.ts
    AgentStageFactoryRegistry.ts
    definitions/
      chat.profile.ts
      scan.profile.ts
      translation.profile.ts
      signal.profile.ts
      relation.profile.ts
      evolution.profile.ts
      bootstrap.profile.ts

  coordination/
    AgentRunCoordinator.ts
    partitioners/
      bootstrapSessionDimensions.ts
    mergers/
      bootstrapSessionResults.ts

  runs/
    scan/
      ScanAgentRun.ts
      ScanRunProjection.ts
    translation/
      TranslationAgentRun.ts
    relation/
      RelationAgentRun.ts
    evolution/
      EvolutionAgentRun.ts
    bootstrap/
      BootstrapSessionRun.ts

  context/
    ContextWindow.ts
    ExplorationTracker.ts
    exploration/

  memory/
    ActiveContext.ts
    MemoryCoordinator.ts
    SessionStore.ts
    PersistentMemory.ts
    ...

  prompts/
    ChatAgentPrompts.ts
    insightAnalyst.ts
    insightProducer.ts
    insightGate.ts
    insightEvolver.ts
    scanPrompts.ts
```

### 3.2 命名原则

1. **Runtime**：只表示单次 Agent 执行内核。
2. **Service**：只表示统一入口和构造入口。
3. **Profile**：只表示可序列化配置定义与编译。
4. **Coordination**：只表示 parent/child run 的通用调度，不写业务状态。
5. **Runs**：表示某类 Agent task 的 input builder / projection helper，不是 workflow。
6. **Prompts**：把目前 `domain/insight-*` 中纯 prompt/stage builder 迁出 `domain`，避免误以为是业务领域服务。

### 3.3 具体迁移映射

| 当前文件 | 目标文件 | 说明 |
| --- | --- | --- |
| `lib/agent/AgentRuntime.ts` | `lib/agent/runtime/AgentRuntime.ts` | 单次 runtime 内核 |
| `lib/agent/AgentRuntimeTypes.ts` | `lib/agent/runtime/AgentRuntimeTypes.ts` | runtime 类型 |
| `lib/agent/AgentMessage.ts` | `lib/agent/runtime/AgentMessage.ts` | runtime message |
| `lib/agent/AgentState.ts` | `lib/agent/runtime/AgentState.ts` | runtime state machine |
| `lib/agent/AgentEventBus.ts` | `lib/agent/runtime/AgentEventBus.ts` | runtime event bus |
| `lib/agent/core/LoopContext.ts` | `lib/agent/runtime/LoopContext.ts` | loop context |
| `lib/agent/core/MessageAdapter.ts` | `lib/agent/runtime/MessageAdapter.ts` | message adapter |
| `lib/agent/core/DiagnosticsCollector.ts` | `lib/agent/runtime/DiagnosticsCollector.ts` | runtime diagnostics |
| `lib/agent/core/SystemPromptBuilder.ts` | `lib/agent/runtime/SystemPromptBuilder.ts` | runtime system prompt assembler |
| `lib/agent/core/SystemRunContext.ts` | `lib/agent/runtime/SystemRunContext.ts` | system run context projection/expansion |
| `lib/agent/core/ToolExecutionPipeline.ts` | `lib/agent/runtime/ToolExecutionPipeline.ts` | Agent runtime tool-call execution middleware |
| `lib/agent/core/LLMResultType.ts` | `lib/agent/runtime/LLMResultType.ts` | LLM result discriminator |
| `lib/agent/core/ChatAgentPrompts.ts` | `lib/agent/prompts/ChatAgentPrompts.ts` | chat/system prompt helpers and final-answer cleanup |
| `lib/agent/PipelineStrategy.ts` | `lib/agent/strategies/PipelineStrategy.ts` | strategy 实现 |
| `lib/agent/strategies.ts` | 拆成 `lib/agent/strategies/*.ts` | 避免单大文件 |
| `lib/agent/policies.ts` | 拆成 `lib/agent/policies/*.ts` | 策略约束独立 |
| `lib/agent/capabilities.ts` | 拆成 `lib/agent/capabilities/*.ts` | capability 定义独立 |
| `lib/agent/presets.ts` | `lib/agent/profiles/legacyPresets.ts` 或逐步删除 | 只保留兼容 profile 编译所需 |
| `lib/agent/service/AgentProfileRegistry.ts` | `lib/agent/profiles/AgentProfileRegistry.ts` | profile 注册 |
| `lib/agent/service/AgentProfileCompiler.ts` | `lib/agent/profiles/AgentProfileCompiler.ts` | profile 编译 |
| `lib/agent/service/AgentStageFactoryRegistry.ts` | `lib/agent/profiles/AgentStageFactoryRegistry.ts` | stage factory |
| `lib/agent/service/AgentRunCoordinator.ts` | `lib/agent/coordination/AgentRunCoordinator.ts` | parent/child 编排 |
| `lib/agent/service/*AgentRun.ts` | `lib/agent/runs/<task>/*` | task helper |
| `lib/agent/domain/scan-prompts.ts` | `lib/agent/prompts/scanPrompts.ts` | prompt/stage builder |
| `lib/agent/domain/insight-*.ts` | `lib/agent/prompts/insight*.ts` | prompt/gate builder |
| `lib/agent/domain/ChatAgentTasks.ts` | `lib/workflows/chat/ChatAgentTasks.ts` 或 `lib/agent/runs/chat/ChatAgentTasks.ts` | 如果仍是 task orchestration，应离开 `domain` |

## 4. 工具能力目标结构

### 4.1 为什么工具能力不应长期留在 `lib/agent/tools`

现在工具能力已经抽象为：

```text
ToolRouter
  -> CapabilityCatalog
  -> GovernanceEngine
  -> ToolExecutionAdapter
  -> ToolResultEnvelope
```

这套能力并不只服务 Agent：

1. HTTP routes 可以直接调用 `ToolRouter`。
2. MCP tools 可以适配成 router adapter。
3. Dashboard / Terminal / Mac system / Skill 等能力都通过 adapter 暴露。
4. Tool governance 是跨 surface 的安全边界。

所以工具能力应成为独立平台层，而不是 Agent 子目录。

### 4.2 建议结构

```text
lib/tools/
  core/
    ToolRouter.ts
    ToolCallContext.ts
    ToolContracts.ts
    ToolResultEnvelope.ts
    ToolDecision.ts
    InternalToolHandler.ts
    ToolInputSchema.ts
    GovernanceEngine.ts
    ToolGuardServices.ts
    ToolQualityServices.ts
    ToolLifecycleServices.ts
    ToolKnowledgeServices.ts
    ToolInfraServices.ts
    ToolRoutingServices.ts
    ToolResultPresenter.ts

  catalog/
    CapabilityCatalog.ts
    CapabilityManifest.ts
    CapabilityProjection.ts
    ToolDefinition.ts
    ToolRegistry.ts

  adapters/
    InternalToolAdapter.ts
    TerminalAdapter.ts
    MacSystemAdapter.ts
    SkillAdapter.ts
    WorkflowAdapter.ts
    DashboardOperationAdapter.ts
    DashboardOperations.ts
    *Capabilities.ts
    TerminalSession*.ts

  handlers/
    project-access.ts
    system-interaction.ts
    knowledge-graph.ts
    evolution-tools.ts
    scanRecipe.ts
    query.ts
    guard.ts
    lifecycle.ts
    composite.ts
    infrastructure.ts
    ai-analysis.ts

  workflow/
    WorkflowRegistry.ts
```

### 4.3 迁移映射

| 当前文件 | 目标文件 |
| --- | --- |
| `lib/agent/core/ToolRouter.ts` | `lib/tools/core/ToolRouter.ts` |
| `lib/agent/core/ToolExecutionPipeline.ts` | 保留在 `lib/agent/core`，因为它绑定 `AgentRuntime` / `LoopContext` 执行循环 |
| `lib/agent/core/GovernanceEngine.ts` | `lib/tools/core/GovernanceEngine.ts` |
| `lib/agent/core/Tool*Services.ts` | `lib/tools/core/*Services.ts` |
| `lib/agent/tools/CapabilityCatalog.ts` | `lib/tools/catalog/CapabilityCatalog.ts` |
| `lib/agent/tools/CapabilityManifest.ts` | `lib/tools/catalog/CapabilityManifest.ts` |
| `lib/agent/tools/ToolDefinition.ts` | `lib/tools/catalog/ToolDefinition.ts` |
| `lib/agent/tools/ToolRegistry.ts` | `lib/tools/catalog/ToolRegistry.ts` |
| `lib/agent/tools/*.ts` 具体工具 | `lib/tools/handlers/*.ts` |
| `lib/agent/adapters/*` | `lib/tools/adapters/*` |
| `lib/agent/workflow/WorkflowRegistry.ts` | `lib/tools/workflow/WorkflowRegistry.ts` |
| `lib/agent/dashboard/DashboardOperations.ts` | `lib/tools/adapters/DashboardOperations.ts` |
| `lib/external/mcp/McpToolAdapter.ts` | 暂留 `lib/external/mcp`，因为它是 MCP 协议适配器 |
| `lib/http/utils/tool-envelope-response.ts` | 暂留 `lib/http/utils`，因为它是 HTTP response presenter |

### 4.4 注意事项

工具层迁移应晚于 Agent profile/service 目录整理，因为当前大量代码仍从 `#agent/core/ToolRouter`、`#agent/tools/*` import。迁移时需要先建立 `#tools/*` path alias，再做批量 import 迁移。

## 5. bootstrap workflow 目标结构

### 5.1 `orchestrator.ts` 的真实位置

`orchestrator.ts` 不应移动到 `lib/agent`。它应该从：

```text
lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts
```

迁移到：

```text
lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts
```

原因：

1. 它是业务流程，不是协议 handler。
2. 它深度使用 Agent，但不定义 Agent 平台能力。
3. 它承担大量 workflow side effects。
4. MCP 只是调用方之一，未来 HTTP/CLI/background 也可能复用。

### 5.2 bootstrap 目标结构

```text
lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts
  BootstrapWorkflowTypes.ts

  agent-runs/
    BootstrapSessionInputBuilder.ts
    BootstrapDimensionInputBuilder.ts
    BootstrapDimensionPlan.ts

  projections/
    BootstrapSessionProjection.ts
    BootstrapDimensionProjection.ts

  consumers/
    BootstrapDimensionConsumer.ts
    BootstrapSessionConsumer.ts
    BootstrapTierReflectionConsumer.ts

  context/
    DimensionContext.ts
    BootstrapMemoryContext.ts

  checkpoint/
    BootstrapCheckpointStore.ts

  incremental/
    IncrementalBootstrap.ts
    BootstrapSnapshot.ts

  config/
    bootstrapDimensions.ts
    bootstrapDimensionConfigs.ts

  reports/
    BootstrapReportBuilder.ts

  skills/
    BootstrapSkillGenerator.ts

  mock/
    MockBootstrapPipeline.ts
```

### 5.3 当前文件迁移映射

| 当前文件 | 目标文件 | 说明 |
| --- | --- | --- |
| `pipeline/orchestrator.ts` | `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts` | 主 workflow |
| `pipeline/dimension-context.ts` | `lib/workflows/deprecated-cold-start/context/DimensionContext.ts` | bootstrap 维度状态 |
| `pipeline/checkpoint.ts` | `lib/workflows/deprecated-cold-start/checkpoint/BootstrapCheckpointStore.ts` | checkpoint 存取 |
| `pipeline/IncrementalBootstrap.ts` | `lib/workflows/deprecated-cold-start/incremental/IncrementalBootstrap.ts` | 增量逻辑 |
| `pipeline/BootstrapSnapshot.ts` | `lib/workflows/deprecated-cold-start/incremental/BootstrapSnapshot.ts` | snapshot |
| `pipeline/dimension-configs.ts` | `lib/workflows/deprecated-cold-start/config/bootstrapDimensionConfigs.ts` | 维度配置 |
| `base-dimensions.ts` | `lib/workflows/deprecated-cold-start/config/bootstrapDimensions.ts` | 基础维度 |
| `shared/skill-generator.ts` | `lib/workflows/deprecated-cold-start/skills/BootstrapSkillGenerator.ts` | bootstrap skill 生成 |
| `MissionBriefingBuilder.ts` | `lib/workflows/deprecated-cold-start/briefing/MissionBriefingBuilder.ts` | briefing 构造 |
| `pipeline/tier-scheduler.ts` | 删除或迁到 `deprecated/TierScheduler.ts` | parent run 已取代外层调度 |
| `pipeline/mock-pipeline.ts` | `lib/workflows/deprecated-cold-start/mock/MockBootstrapPipeline.ts` | mock pipeline |
| `shared/bootstrap-phases.ts` | `lib/external/mcp/handlers/bootstrap/bootstrapPhases.ts` 或 `lib/workflows/deprecated-cold-start/BootstrapPhaseRunner.ts` | 需按职责拆分 |

### 5.4 `orchestrator.ts` 内部拆分顺序

不要一次移动 2000 行。应先在原路径完成内部文件拆分，再整体迁移目录。

建议顺序：

1. `BootstrapSessionProjection.ts`
   - `projectBootstrapSessionResult()`
   - `toBootstrapSessionDimensionResults()`
   - `BootstrapSessionProjection`

2. `BootstrapDimensionProjection.ts`
   - `projectAgentRunResult()`
   - `projectBootstrapDimensionAgentOutput()`
   - `BootstrapDimensionProjection`
   - `normalizeDimensionFindings()`

3. `BootstrapDimensionInputBuilder.ts`
   - `buildBootstrapDimensionRunInput()`
   - `createBootstrapDimensionRunInput()`
   - 注意：前者可纯，后者有运行期对象创建。

4. `BootstrapSessionInputBuilder.ts`
   - `resolveBootstrapDimensionPlan()`
   - `buildBootstrapDimensionChildPlan()`
   - `resolveBootstrapDimensionTier()`

5. `BootstrapDimensionConsumer.ts`
   - `consumeBootstrapDimensionResult()`
   - `consumeBootstrapDimensionError()`
   - 需要显式注入 `sessionStore/dimContext/candidateResults/dimensionStats/emitter`。

6. `BootstrapSessionConsumer.ts`
   - `consumeBootstrapSessionResult()`
   - `consumeMissingBootstrapDimensions()`

7. `BootstrapTierReflectionConsumer.ts`
   - `consumeBootstrapSessionTierResult()`

8. `BootstrapRestoreState.ts`
   - `restoreIncrementalSkippedDimension()`
   - `restoreCheckpointDimension()`

完成以上拆分后，`orchestrator.ts` 会自然收缩为：

```text
prepare context
prepare restore state
build bootstrapSessionInput
agentService.run(bootstrapSessionInput)
consume session result
post-process skills / relations / semantic memory / report / snapshot / delivery
```

再下一步才把它重命名为 `BootstrapWorkflow.ts` 并迁移到 `lib/workflows/deprecated-cold-start`。

## 6. 外部入口层目标结构

MCP handler 目录长期只应保留协议入口和 request/response 适配。

目标：

```text
lib/external/mcp/handlers/bootstrap/
  index.ts
  BootstrapMcpHandler.ts
  BootstrapMcpRequestMapper.ts
  BootstrapMcpResponsePresenter.ts
```

它只做：

1. 从 MCP request 解析参数。
2. 获取 container/service。
3. 调用 `BootstrapWorkflow.run()`。
4. 把 workflow result 映射回 MCP response。

它不做：

1. 不构造 AgentRuntime。
2. 不写 checkpoint。
3. 不做 dimension candidate 生产。
4. 不做 semantic consolidation。
5. 不维护 SessionStore。

## 7. 文件命名规则

### 7.1 禁止含糊命名

后续应避免：

- `orchestrator.ts`
- `utils.ts`
- `shared.ts`
- `helpers.ts`
- `index.ts` 承载实现
- `pipeline.ts` 承载过多阶段

### 7.2 推荐命名

命名必须体现职责动作：

| 类型 | 命名 |
| --- | --- |
| 构造输入 | `*InputBuilder.ts` |
| 纯投影 | `*Projection.ts` |
| 消费副作用 | `*Consumer.ts` |
| 状态恢复 | `*RestoreState.ts` |
| 持久化存取 | `*Store.ts` |
| 配置定义 | `*.profile.ts` / `*Configs.ts` |
| 协议入口 | `*Handler.ts` |
| 协议映射 | `*RequestMapper.ts` / `*ResponsePresenter.ts` |
| 工作流主入口 | `*Workflow.ts` |
| adapter | `*Adapter.ts` |
| registry | `*Registry.ts` |
| compiler | `*Compiler.ts` |
| coordinator | `*Coordinator.ts` |

## 8. 迁移阶段设计

### D0：冻结新混杂入口

立即执行：

1. 禁止在 `lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts` 继续新增大函数。
2. 禁止把 bootstrap 业务 side effect 放进 `lib/agent/service`。
3. 禁止新增 `lib/agent/tools/*` 具体 handler；新增工具 handler 直接进入 `lib/tools/handlers`，新增工具 adapter 直接进入 `lib/tools/adapters`。

### D1：拆 `orchestrator.ts` 内部纯 projection

先抽最安全的纯函数：

1. `BootstrapSessionProjection.ts`
2. `BootstrapDimensionProjection.ts`

验收：

- 纯函数文件不依赖 container。
- 纯函数文件不写 `SessionStore`。
- 可直接单测。

当前进度：

- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSessionProjection.ts` 抽出 `projectBootstrapSessionResult()` 与 `toBootstrapSessionDimensionResults()`。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapDimensionProjection.ts` 抽出 `projectAgentRunResult()`、`projectBootstrapDimensionAgentOutput()` 与 `normalizeDimensionFindings()`。
- 已新增 `test/unit/BootstrapProjection.test.ts` 覆盖 session coverage、failed/aborted/missing 维度识别、维度 analysis/producer 投影与 finding 归一化。
- `orchestrator.ts` 已改为从 projection 文件导入纯函数，不再内联这些投影逻辑。

### D2：拆 bootstrap Agent input builders

抽：

1. `BootstrapDimensionInputBuilder.ts`
2. `BootstrapSessionInputBuilder.ts`

验收：

- 能区分 pure plan 和 lazy runtime input。
- 不提前创建 memory scope。
- 不写业务状态。

当前进度：

- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapDimensionInputBuilder.ts` 抽出 `BootstrapFileEntry`、`BuildBootstrapDimensionRunInputOptions` 与 `buildBootstrapDimensionRunInput()`。
- `buildBootstrapDimensionRunInput()` 只负责把已创建好的 `SystemRunContext`、`strategyContext`、`MemoryCoordinator`、文件缓存和 abort signal 组装为 `AgentRunInput`；不创建 memory scope，不写 `SessionStore`，不触发 dimension start/complete 事件。
- `orchestrator.ts` 仍保留 `createBootstrapDimensionRunInput()`，因为它会调用 `memoryCoordinator.createDimensionScope()`、`systemRunContextFactory.createDimensionContext()` 和 `projectSystemRunContext()`，属于 lazy runtime input 创建逻辑，必须继续挂在 `lazyInputFactory` 内，避免 parent input 准备阶段提前产生副作用。
- 已新增 `test/unit/BootstrapInputBuilder.test.ts` 覆盖 dimension input builder 的 profile、params、message、context、presentation 和 abort signal 组装。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSessionInputBuilder.ts` 抽出 `BootstrapSessionChildRunPlan`、`BuildBootstrapSessionRunInputOptions` 与 `buildBootstrapSessionRunInput()`。
- `lib/agent/service/BootstrapSessionRun.ts` 已删除，`lib/agent/service/index.ts` 不再导出 bootstrap session input builder；Agent service 层只保留通用 `AgentRunInput` / `AgentRunContext` / `AgentService` 契约。
- `BootstrapSessionInputBuilder.ts` 只负责把已准备好的 child plan 投影为 parent `bootstrap-session` 的 `AgentRunInput`，并登记 `childContexts` 与 `childInputFactories`；它不调用 container，不创建 memory scope，不写 `SessionStore`。
- 已新增 `test/unit/BootstrapSessionInputBuilder.test.ts` 覆盖 parent profile、dimensions params、childContexts、lazy child input factory 透传。

### D3：拆 bootstrap consumers

抽：

1. `BootstrapDimensionConsumer.ts`
2. `BootstrapSessionConsumer.ts`
3. `BootstrapTierReflectionConsumer.ts`
4. `BootstrapRestoreState.ts`

验收：

- 所有副作用集中在 consumer。
- consumer 依赖通过参数显式传入。
- `orchestrator.ts` 不直接操作 child result 细节。

当前进度：

- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapDimensionConsumer.ts` 抽出 `consumeBootstrapDimensionResult()` 与 `consumeBootstrapDimensionError()`。
- 已同步迁出 `DimensionStat`、`CandidateResults`、`DimensionCandidateData` 类型，作为 bootstrap workflow consumer 的显式状态契约。
- `BootstrapDimensionConsumer.ts` 集中处理 dimension 级副作用：更新 candidate/results 统计、写 `SessionStore` dimension report/digest/submitted candidate、写 `DimensionContext`、记录 token usage、发出 dimension complete 事件、保存 checkpoint。
- `orchestrator.ts` 现在只保留闭包依赖绑定 wrapper，用于把当前 session 的 `candidateResults`、`dimensionStats`、`emitter` 等显式传给 consumer；真实错误/成功消费逻辑不再内联在 orchestrator 中。
- 已新增 `test/unit/BootstrapDimensionConsumer.test.ts` 覆盖 dimension 成功消费与错误消费两条副作用路径。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapTierReflectionConsumer.ts` 抽出 `consumeBootstrapTierReflection()`，集中处理 tier 完成日志、`buildTierReflection()` 调用和 `SessionStore.addTierReflection()` 写入。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSessionConsumer.ts` 抽出 `consumeBootstrapSessionResult()` 与 `consumeMissingBootstrapDimensions()`，集中处理 parent run 投影、failed/aborted/missing 维度日志、missing dimension 回调、SessionStore 统计日志。
- `orchestrator.ts` 对 session/tier consumer 也只保留闭包绑定 wrapper：tier wrapper 注入当前 `sessionStore`，session wrapper 注入 `activeDimIds`、skipped dims、`dimensionStats` 与 missing dimension 错误消费回调。
- 已新增 `test/unit/BootstrapSessionConsumer.test.ts` 和 `test/unit/BootstrapTierReflectionConsumer.test.ts`，覆盖 missing dimension 回调、已有错误统计跳过、tier reflection 写入。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapRestoreState.ts` 抽出 `syncRestoredSessionStoreDigests()`、`resolveIncrementalSkippedDimensions()`、`restoreCheckpointDimensions()` 与 `applyRestoredDimensionState()`。
- `BootstrapRestoreState.ts` 集中处理增量 SessionStore digest 同步、incremental skip 事件、checkpoint digest 恢复、以及把跳过维度补回 `dimensionStats` / `dimensionCandidates` / `candidateResults`。
- `orchestrator.ts` 对 restore state 只保留顺序编排：先解析 incremental skip，再加载 checkpoint，再应用恢复状态；具体状态写入和事件发送不再内联。
- 已新增 `test/unit/BootstrapRestoreState.test.ts` 覆盖 restored SessionStore digest 同步、incremental skip、checkpoint 加载恢复、incremental/checkpoint 状态补回。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSkillConsumer.ts` 抽出 `consumeBootstrapSkills()`、`extractSkillKeyFindings()` 与 `buildEffectiveSkillAnalysisText()`。
- `BootstrapSkillConsumer.ts` 集中处理 Project Skill 生成副作用：按 `skillWorthy` 维度读取 `dimensionCandidates`、从 `SessionStore` 提取 findings、对过短 analysisText 做结构化补强、调用共享 `generateSkill()`、写 `SkillResults` 并发送 dimension skill complete/failed 事件。
- `orchestrator.ts` 的 Step 4 已缩为一次 `consumeBootstrapSkills()` 调用，只负责注入 `ctx`、`dimensions`、`dimensionCandidates`、`sessionStore`、`emitter` 与 session abort 检查。
- 已新增 `test/unit/BootstrapSkillConsumer.test.ts` 覆盖 finding 排序、短文本补强、skill 成功创建事件、失败统计与 abort 行为。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSemanticMemoryConsumer.ts` 抽出 `consumeBootstrapSemanticMemory()` 与 `ConsolidationResult`。
- `BootstrapSemanticMemoryConsumer.ts` 集中处理 Semantic Memory consolidation：从 container 获取 database、构造 `PersistentMemory`、调用 `EpisodicConsolidator.consolidate()`、记录 semantic memory stats / per-dimension / importance histogram，并把失败降级为 non-blocking `null`。
- `orchestrator.ts` 的 Step 5 已缩为一次 `consumeBootstrapSemanticMemory()` 调用，只负责注入 `ctx`、`dataRoot`、`sessionId` 与 `sessionStore`。
- 已新增 `test/unit/BootstrapSemanticMemoryConsumer.test.ts` 覆盖 database 缺失、成功 consolidate、consolidate 抛错不阻断三条路径。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapReportSnapshotConsumer.ts` 抽出 `consumeBootstrapReportAndSnapshot()`、`summarizeBootstrapDimensionStats()`、`buildBootstrapReport()` 与 `writeBootstrapReport()`。
- `BootstrapReportSnapshotConsumer.ts` 集中处理 pipeline summary 日志、bootstrap-report DTO 构造、CodeEntityGraph 拓扑附加、writeZone/文件系统写入、checkpoint 清理与 incremental snapshot 保存。
- `orchestrator.ts` 的 Summary + P4.2 + P3 cleanup + v5 snapshot 段已缩为一次 `consumeBootstrapReportAndSnapshot()` 调用，只负责注入当前 workflow 状态。
- 已新增 `test/unit/BootstrapReportSnapshotConsumer.test.ts` 覆盖 token/tool 汇总、report DTO、writeZone 写入与注入式 snapshot 保存路径。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapDeliveryConsumer.ts` 抽出 `consumeBootstrapDeliveryAndWiki()`。
- `BootstrapDeliveryConsumer.ts` 集中处理 bootstrap 完成后的 non-blocking delivery 副作用：Cursor Delivery pipeline、Repo Wiki 生成、wiki task 状态更新、realtime wiki progress/completed 事件。
- `orchestrator.ts` 的 Cursor Delivery + Repo Wiki 段已缩为一次 `consumeBootstrapDeliveryAndWiki()` 调用，只负责注入 `projectRoot`、`dataRoot` 与 `projectGraph`。
- 已新增 `test/unit/BootstrapDeliveryConsumer.test.ts` 覆盖 Cursor Delivery、WikiGenerator 构造、wiki progress/completed 事件、wiki 失败任务状态。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapRuntimeInitializer.ts` 抽出 `initializeBootstrapRuntime()`。
- `BootstrapRuntimeInitializer.ts` 集中处理前置 runtime 初始化：ProjectGraph 构建、`projectInfo`、`DimensionContext`、增量 restored `SessionStore` digest 同步、历史 `PersistentMemory` 加载、CodeEntityGraph 初始化、`MemoryCoordinator` 构造和 `_fileCache` 注入。
- `orchestrator.ts` 的 Step 0.5 + Step 1 已缩为一次 `initializeBootstrapRuntime()` 调用，只负责传入 snapshot/context 级输入并接收 runtime 对象。
- 已新增 `test/unit/BootstrapRuntimeInitializer.test.ts` 覆盖 ProjectGraph 成功、ProjectGraph 失败降级、增量 restored SessionStore digest 同步。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapRescanState.ts` 抽出 rescan/dedup 准备逻辑：跨维度 submitted titles/patterns/triggers 集合、`BootstrapDedup` 会话缓存、existing/decaying recipe 分层、occupied triggers、coverageByDim、dimension 级 rescanContext 投影与 prompt existingRecipes 投影。
- `orchestrator.ts` 的 rescan 段已缩为一次 `prepareBootstrapRescanState()` 调用，dimension plan 和 system run context 只消费已投影的 rescan 状态，不再内联处理 recipe 分层和 audit hint 映射。
- 已新增 `test/unit/BootstrapRescanState.test.ts` 覆盖 healthy/decaying 分层、去重 seed、coverage 统计、dimension 投影、prompt audit hint 投影和无 existing recipes 场景。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapDimensionRuntimeBuilder.ts` 抽出 dimension plan 与 runtime input creation：维度配置合并、candidate 需求判断、dimension 级 existing recipe 解析、SystemRunContext 创建、panorama/evidence starters/rescan/projectOverview 注入、最终 `AgentRunInput` 构造。
- `orchestrator.ts` 的维度 runtime 段已缩为 `resolveBootstrapDimensionPlanData()` 与 `createBootstrapDimensionRuntimeInput()` 两个调用；主流程不再直接依赖 `DIMENSION_CONFIGS_V3`、`getFullDimensionConfig()`、`createSystemRunContext()`、`projectSystemRunContext()`、`ExplorationTracker` 或 `buildEvidenceStarters()`。
- 已新增 `test/unit/BootstrapDimensionRuntimeBuilder.test.ts` 覆盖 fallback dimension config、candidate 判断、rescan 状态注入、SystemRunContext sharedState、projectOverview、existingRecipes audit hint 和 panorama context 防御式构建。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapSessionExecutionBuilder.ts` 抽出 session child orchestration wrapper：child plan 构造、tier 解析、lazy runtime input factory、dimension start 事件、child result/error 分发、tier complete 统计收集、parent `AgentRunInput` 构造与 session abort 判断。
- `orchestrator.ts` 的 Step 2/3 中 child orchestration 已缩为一次 `buildBootstrapSessionExecutionInput()` 调用；主流程只保留 dimension result/error/tier/session consumer wrapper 和 `agentService.run(bootstrapSessionInput)`。
- 已新增 `test/unit/BootstrapSessionExecutionBuilder.test.ts` 覆盖 unskipped child plan、lazy factory runtime input、child execution state、child result/error routing、tier complete routing、tier hint/fallback 和 shouldAbort。
- 已在 `lib/external/mcp/handlers/bootstrap/pipeline/BootstrapCandidateRelationConsumer.ts` 抽出 Candidate Relations → Code Entity Graph 副作用，集中处理 producer toolCalls 中的 `submit_knowledge` / `submit_with_check` 关系提取、repo 获取、`CodeEntityGraph.populateFromCandidateRelations()` 调用和 non-blocking 失败降级。
- `orchestrator.ts` 的 Step 4.5 已缩为一次 `consumeBootstrapCandidateRelations()` 调用，不再内联动态 import、repo 获取和 candidate relation 遍历。
- 已新增 `test/unit/BootstrapCandidateRelationConsumer.test.ts` 覆盖候选关系提取、图谱写入、无 repo/无候选/加载失败降级。
- D3 当前已完成 projection/input builder 之后的 consumer/restore/skill/semantic/report-snapshot/delivery/runtime-init/rescan-dedup/dimension-runtime/session-execution/candidate-relations 拆分目标；`orchestrator.ts` 已从约 1539 行缩至约 529 行。

### D4：迁移 bootstrap 到 `lib/workflows/deprecated-cold-start`

移动拆分后的 bootstrap workflow 文件。

保留 MCP 入口为薄适配层。

当前进度：

- 已新增 `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts`，承接 `fillDimensionsV3()` 主 workflow 与 `clearSnapshots()` / `clearCheckpoints` 清理导出；当前 workflow 主文件约 449 行。
- 已新增 `#workflows/*` package import alias，并补齐 Vitest alias 解析；bootstrap 入口和测试均直接指向 `lib/workflows/deprecated-cold-start/*`。
- `lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts` 兼容 adapter 已删除；不再保护旧动态路径。
- 旧 `test/unit/BootstrapWorkflowAdapter.test.ts` 已删除，因为 legacy orchestrator 导出不再是稳定接口。
- 已将 D3 拆出的 17 个 workflow helper 迁入 `lib/workflows/deprecated-cold-start/`：projection/input builder/runtime builder、dimension/session/tier/skill/semantic/report/delivery/candidate relation consumers、restore/rescan/runtime initializer/session execution 等。
- 旧 `lib/external/mcp/handlers/bootstrap/pipeline/Bootstrap*.ts` helper 兼容 stub 已删除；真实实现位于 `lib/workflows/deprecated-cold-start/*`。
- 已继续迁移剩余 bootstrap 基础设施到 `lib/workflows/deprecated-cold-start/`：`checkpoint.ts`、`BootstrapSnapshot.ts`、`IncrementalBootstrap.ts`、`dimension-context.ts`、`dimension-configs.ts`、`tier-scheduler.ts`、`mock-pipeline.ts`。
- 旧 `lib/external/mcp/handlers/bootstrap/pipeline/*.ts` 已全部删除；`dimension-complete-external.ts`、`MissionBriefingBuilder.ts`、`bootstrap-phases.ts` 等调用方已切到 `#workflows/deprecated-cold-start/*`。

验收：

- `lib/external/mcp/handlers/bootstrap` 不再包含 `pipeline/orchestrator.ts` 这种 workflow 或兼容 re-export。
- MCP handler 直接调用 `lib/workflows/deprecated-cold-start/BootstrapWorkflow.js` 的 `fillDimensionsV3()`。
- 已拆出的 workflow helper 和基础设施均已迁入 `lib/workflows/deprecated-cold-start/*`；旧 adapter/stub 已移除。

### D5：整理 `lib/agent` 内部目录

按以下顺序移动，减少 import 冲击：

1. `service/AgentProfile*` -> `profiles/`
2. `service/AgentRunCoordinator` -> `coordination/`
3. `service/*AgentRun` -> `runs/*`
4. `domain/scan-prompts` / `domain/insight-*` -> `prompts/`
5. `strategies.ts` / `policies.ts` / `capabilities.ts` 拆目录。

当前进度：

- 已新增 `lib/agent/profiles/`，迁入 `AgentProfileCompiler.ts` 与 `AgentProfileRegistry.ts`。
- `lib/agent/service/AgentProfileCompiler.ts` 与 `lib/agent/service/AgentProfileRegistry.ts` 兼容 re-export stub 已删除。
- `AgentService.ts` 和 `service/index.ts` 已改为从 `../profiles/*` 引用 profile 实现；`service/index.ts` 继续对外导出同名符号，保护 DI module 和测试中的 barrel import。
- 已将 profile 编译配套的 `AgentStageFactoryRegistry.ts` 也迁入 `lib/agent/profiles/`，旧 `service/AgentStageFactoryRegistry.ts` 兼容 stub 已删除。
- 已新增 `lib/agent/coordination/`，迁入 `AgentRunCoordinator.ts`。
- `lib/agent/service/AgentRunCoordinator.ts` 兼容 re-export stub 已删除；`AgentService.ts` 和 `service/index.ts` 已改为从 `../coordination/AgentRunCoordinator.js` 引用实现。
- 已新增 `lib/agent/runs/`，迁入 `EvolutionAgentRun.ts`、`RelationAgentRun.ts`、`ScanAgentRun.ts`、`TranslationAgentRun.ts` 与配套 `ScanRunProjection.ts`。
- `lib/agent/service/*AgentRun.ts` 与 `lib/agent/service/ScanRunProjection.ts` 兼容 re-export stub 已删除；`service/index.ts` 已改为从 `../runs/*` 导出 run helper。
- 已新增 `lib/agent/prompts/`，迁入 `scan-prompts.ts` 与 `insight-analyst.ts` / `insight-gate.ts` / `insight-producer.ts` / `insight-evolver.ts`。
- `lib/agent/domain/scan-prompts.ts` 与 `lib/agent/domain/insight-*.ts` 兼容 re-export stub 已删除；`presets.ts`、`runs/ScanAgentRun.ts`、`profiles/AgentStageFactoryRegistry.ts` 与 bootstrap workflow 已改为直接引用 `prompts/*`。
- `lib/agent/domain` 当前仅剩真实领域对象/任务：`ChatAgentTasks.ts`、`EvidenceCollector.ts`、`consolidation-gate.ts`、`EpisodicConsolidator.ts`。
- 已新增 `lib/agent/policies/index.ts`、`lib/agent/strategies/index.ts`、`lib/agent/capabilities/index.ts`，分别承接原顶层 `policies.ts`、`strategies.ts`、`capabilities.ts` 的真实实现。
- 原 `lib/agent/policies.ts`、`lib/agent/strategies.ts`、`lib/agent/capabilities.ts` 兼容 re-export stub 已删除；`AgentRuntime`、`AgentRuntimeBuilder`、`PipelineStrategy`、`presets.ts`、`profiles/AgentProfileCompiler.ts`、`core/*` 等高价值引用已改为直接引用目录实现。

验收：

- `lib/agent/service` 的真实实现只剩 `AgentService`、`AgentRuntimeBuilder`、`AgentRunContracts`、`SystemRunContextFactory`、`AgentRouter` 与 barrel `index.ts`；profile/coordination/run helper 兼容 stub 已删除。
- `lib/agent/domain` 只保留真实领域对象/任务。
- `lib/agent` 顶层 `policies.ts` / `strategies.ts` / `capabilities.ts` 兼容 stub 已删除，真实实现已进入同名目录。

### D6：工具平台迁移到 `lib/tools`

最后做，原因是影响面最大。

步骤：

1. [x] 新增 `#tools/*` path alias，并补齐 Vitest alias 解析。
2. [x] 移动 `ToolRouter` / `ToolContracts` / `ToolResultEnvelope` / `ToolCallContext` / `GovernanceEngine` / `InternalToolHandler` / `Tool*Services` / `ToolInputSchema` / `ToolDecision` / `ToolResultPresenter` 到 `lib/tools/core`。
3. [x] 移动 `CapabilityCatalog` / `CapabilityManifest` / `CapabilityProjection` / `ToolDefinition` / `ToolRegistry` 到 `lib/tools/catalog`。
4. [x] 移动 Terminal / Mac / Skill / Internal / Workflow / Dashboard adapters 到 `lib/tools/adapters`，并移动 `WorkflowRegistry` 到 `lib/tools/workflow`。
5. [x] 移动 concrete handlers 到 `lib/tools/handlers`。
6. [x] `lib/agent` 不再拥有工具平台真实实现；旧 `lib/agent/core/Tool*`、`lib/agent/tools/*`、`lib/agent/adapters/*`、`lib/agent/workflow/*`、`lib/agent/dashboard/*` 兼容 re-export stub 已移除。

边界决定：

- `ToolExecutionPipeline` 归属 `lib/agent/runtime`，因为它直接依赖 `AgentRuntime`、`LoopContext`、runtime policy/cache/diagnostics，是 Agent 执行循环的一部分，不是跨 surface 工具平台核心。
- `McpToolAdapter` 暂留 `lib/external/mcp`，因为它封装 MCP 协议 handler 调用；`McpServer` 已直接依赖 `#tools/core` / `#tools/catalog`。
- HTTP response presenter 暂留 `lib/http/utils`，因为它是 Express response 层，而不是工具核心 envelope。

验收：

- `ToolRouter` 真实实现不再位于 `#agent/core`，旧路径兼容 stub 已移除。
- HTTP/MCP/Agent 都可同等依赖 `#tools/core`；高价值调用方已切到 `#tools/*`。
- AgentRuntime 只把 tool call 委托给 ToolRouter；工具 catalog/handler/adapter 已脱离 `lib/agent` 真实目录。
- 验证：`pnpm typecheck` 通过；工具迁移回归集 9 个测试文件、151 个测试通过。
- 扩展验证：AgentRuntime / AgentService / bootstrap workflow / HTTP route / MCP router / ToolPipeline 回归集 32 个测试文件、208 个测试通过。

## 9. 最终目标图

```text
HTTP / MCP / Lark / CLI
  -> external adapters
  -> workflows/* or direct AgentRun helper
  -> AgentService.run(AgentRunInput)
  -> AgentProfileCompiler + AgentRunCoordinator
  -> AgentRuntime
  -> ToolRouter
  -> Tool adapters / handlers
```

其中：

- Agent 不知道 bootstrap checkpoint。
- Tool 不知道 Agent profile。
- Workflow 可以同时调用 Agent 和 Tool，但必须通过公开 service contract。
- External handler 不拥有 workflow 业务状态。

## 10. 当前最优下一步

D1-D6 的主体迁移已经完成。第一轮兼容 stub 移除也已完成，后续只保留真实实现目录和明确的公共 barrel：

已完成一轮最终结构审查：

- `lib/agent/{AgentRuntime,AgentRuntimeTypes,AgentMessage,AgentState,AgentEventBus}.ts` 已迁到 `lib/agent/runtime/*`，旧顶层 re-export stub 已删除。
- `lib/agent/core/ChatAgentPrompts.ts` 已迁到 `lib/agent/prompts/ChatAgentPrompts.ts`，旧路径 re-export stub 已删除。
- `lib/agent/core/{DiagnosticsCollector,LLMResultType,LoopContext,MessageAdapter,SystemPromptBuilder,SystemRunContext,ToolExecutionPipeline}.ts` 已迁到 `lib/agent/runtime/*`，旧路径 re-export stub 已删除。
- `lib/agent/forced-summary.ts` 已迁到 `lib/agent/runtime/forced-summary.ts`，旧顶层 re-export stub 已删除。
- `lib/agent/PipelineStrategy.ts` 已迁到 `lib/agent/strategies/PipelineStrategy.ts`，旧顶层 re-export stub 已删除。
- `lib/agent/presets.ts` 已迁到 `lib/agent/profiles/presets.ts`，旧顶层 re-export stub 已删除。
- `lib/agent/AgentRouter.ts` 已迁到 `lib/agent/service/AgentRouter.ts`，旧顶层 re-export stub 已删除。
- `lib/agent/ConversationStore.ts` 已迁到 `lib/agent/context/ConversationStore.ts`，旧顶层 re-export stub 已删除。
- `lib/agent/IntentClassifier.ts` 已迁到 `lib/external/lark/IntentClassifier.ts`，旧顶层 re-export stub 已删除。
- `lib/agent` 中对工具 catalog 的直接引用已切到 `#tools/catalog`，不再经由 `lib/agent/tools` 兼容层。
- `lib/external/mcp/handlers/bootstrap/pipeline/*` 兼容 stub 已删除；生产和测试引用已切到 `lib/workflows/deprecated-cold-start/*`。
- 验证：`pnpm typecheck` 通过；runtime/prompt/bootstrap 聚焦回归 8 个测试文件、73 个测试通过；顶层 runtime/export 回归 9 个测试文件、97 个测试通过；策略/profile/bootstrap 回归 8 个测试文件、73 个测试通过；profile/runtime 回归 9 个测试文件、61 个测试通过；routing/session/intent 回归 8 个测试文件、94 个测试通过；stub 删除回归 12 个测试文件、127 个测试通过；相关 lints 无错误。

### 当前判断

对照当前实现，目录分层已符合本文目标：

- `lib/agent` 只保留 Agent runtime、profile/service、run helper、memory/context/prompt/domain 和 forge 相关代码。
- `lib/tools` 承载工具 core、catalog、handlers、adapters 与 workflow adapter registry；工具实现不再放在 `lib/agent`。
- `lib/workflows/deprecated-cold-start` 承载 bootstrap workflow 主流程、consumer、projection、checkpoint/snapshot/incremental 基础设施。
- `lib/external/mcp` 保留 MCP 协议入口和 `McpToolAdapter`；该 adapter 负责 MCP wire result unwrap、trust envelope 与协议错误映射，属于协议适配层，不应迁入工具核心。
- `lib/http/utils/tool-envelope-response.ts` 保留 HTTP response presenter；它依赖 Express `Response`，属于 HTTP 表现层，不应迁入工具核心。

已补充 `test/unit/AgentModuleBoundaries.test.ts` 作为防回归测试，覆盖：

- 旧 `lib/agent` 顶层兼容入口不可恢复。
- 旧 `lib/agent/core` / `lib/agent/tools` / `lib/agent/adapters` / `lib/agent/workflow` / `lib/agent/dashboard` 不应再出现 TypeScript 模块。
- 旧 `lib/external/mcp/handlers/bootstrap/pipeline` 不应再出现 TypeScript 模块。
- 新代码不得导入旧 agent/tool/bootstrap pipeline 路径。
- `McpToolAdapter` 与 HTTP envelope presenter 必须停留在协议边界。

### 开发约定

后续新增代码按以下规则落位：

1. 新增工具 handler 进入 `lib/tools/handlers`，并通过 `lib/tools/handlers/index.ts` 暴露 manifest/catalog 入口。
2. 新增工具 adapter 进入 `lib/tools/adapters`；只有绑定具体外部协议 wire format 的 adapter 才放在 `lib/external/<protocol>`。
3. 新增工具 contract/router/envelope/governance 能力进入 `lib/tools/core` 或 `lib/tools/catalog`，不得放回 `lib/agent/core`。
4. 新增 Agent runtime loop、message/state、system run context、tool execution pipeline 能力进入 `lib/agent/runtime`。
5. 新增 bootstrap 业务编排进入 `lib/workflows/deprecated-cold-start`；MCP handler 只做参数解析、权限/响应包装和 workflow 调用。
6. 禁止恢复 `lib/agent/tools`、`lib/agent/adapters`、`lib/agent/core/Tool*`、`lib/external/mcp/handlers/bootstrap/pipeline` 等兼容目录或 stub。

下一步只做低风险收敛：

1. 若后续需要对外公开 workflow helper，新增 `lib/workflows/deprecated-cold-start/index.ts` barrel，而不是恢复旧 pipeline 路径。
2. 若后续要拓展更多协议入口，优先在 `lib/external/<protocol>` 做 wire adapter，在 `lib/tools/core` 只保留协议无关 contract。
