# AgentRuntime 使用范式与冷启动管线分析

> 日期：2026-04-27  
> 目的：基于当前源码实现，重新梳理 `AgentRuntime` 已经支持的使用方式，并解释冷启动管线为什么承担了大量非 Runtime 逻辑。本文是独立分析文档，不依赖既有旧版 AgentRuntime 迁移文档。

## 1. 结论先行

当前 Alembic 的 Agent 系统已经不是“每个业务场景一个 Agent 类”的模型，而是：

```text
Surface / Workflow
  -> AgentService.run(AgentRunInput)
    -> AgentProfileCompiler.compile(profile)
      -> AgentRuntimeBuilder.build(compiledProfile)
        -> AgentRuntime.execute(message, opts)
          -> Strategy.execute(runtime, message, opts)
            -> runtime.reactLoop(prompt, loopOpts)
              -> ToolRouter.execute(...)
```

也就是说，真正统一的是运行内核和运行契约：

- `AgentRuntime` 是唯一 ReAct 执行内核。
- `AgentService.run()` 是当前推荐的上层统一入口。
- `Profile` 决定业务语义。
- `Strategy` 决定执行组织方式。
- `Capability` 和 `additionalTools` 决定工具白名单。
- `SystemRunContext` 决定长任务上下文能力。
- 业务 workflow 负责项目扫描、快照、持久化、副作用和结果投影。

冷启动管线代码多，不是因为 `AgentRuntime` 复杂，而是因为冷启动本身不是一次普通 Agent 对话。它要先构建可信项目快照，再把一个大任务拆成多维度、多阶段、可中止、可恢复、可去重、可观测的系统级 Agent 会话。

## 2. 当前关键代码地图

| 层 | 关键文件 | 当前职责 |
| --- | --- | --- |
| 服务入口 | `lib/agent/service/AgentService.ts` | 校验 `AgentRunInput`、编译 profile、协调并发、创建 runtime、统一返回 `AgentRunResult`。 |
| Profile 编译 | `lib/agent/profiles/AgentProfileCompiler.ts` | 把 profile ref / override / definition 编译为 `CompiledAgentProfile`，解析 strategy、policy、action space。 |
| Runtime 构造 | `lib/agent/service/AgentRuntimeBuilder.ts` | 根据 preset + compiled overrides 创建 `AgentRuntime`。 |
| Runtime 内核 | `lib/agent/runtime/AgentRuntime.ts` | `execute()` + `reactLoop()`，负责 ReAct、LLM、工具、上下文、tracker、diagnostics、forced summary。 |
| Runtime 类型 | `lib/agent/runtime/AgentRuntimeTypes.ts` | `RuntimeConfig`、`AgentResult`、`ReactLoopOpts`、工具调用记录等契约。 |
| Loop 状态 | `lib/agent/runtime/LoopContext.ts` | 封装单次 `reactLoop()` 的消息、预算、tracker、trace、sharedState、token、错误恢复。 |
| 策略 | `lib/agent/strategies/*.ts` | `SingleStrategy`、`PipelineStrategy`、`FanOutStrategy`、`AdaptiveStrategy`。 |
| Preset | `lib/agent/profiles/presets.ts` | `chat`、`insight`、`evolution`、`lark`、`remote-exec` 的能力、策略、预算和 persona。 |
| Profile 定义 | `lib/agent/profiles/definitions/*.ts` | `chat-default`、`scan-extract`、`relation-discovery`、`evolution-audit`、`bootstrap-session` 等业务 profile。 |
| 系统上下文 | `lib/agent/runtime/SystemRunContext.ts` | 长任务上下文投影：contextWindow、tracker、trace、memoryCoordinator、sharedState。 |
| 系统上下文工厂 | `lib/agent/service/SystemRunContextFactory.ts` | 为 scan/bootstrap 等系统任务创建 `ContextWindow`、`ExplorationTracker`、`MemoryCoordinator`。 |
| 工具执行 | `lib/agent/runtime/ToolExecutionPipeline.ts` | allowlist、observation、tracker signal、trace、submit dedup，再统一走 `ToolRouter`。 |
| 冷启动入口 | `lib/external/mcp/handlers/bootstrap-internal.ts` | 内部冷启动入口：清理、Phase 1-4 快照、异步 Phase 5 Agent 填充。 |
| 冷启动 workflow | `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts` | 构造 runtime 上下文、分维度调度、消费结果、生成 skill/report/snapshot/delivery。 |
| 冷启动确定性阶段 | `lib/workflows/deprecated-cold-start/phases/BootstrapPhaseRunner.ts` | 文件、AST、实体图、调用图、依赖图、Panorama、Guard、维度解析。 |
| 冷启动 Agent 输入 | `lib/workflows/deprecated-cold-start/agent-runs/*.ts` | 构造 `bootstrap-session` 父输入和 `bootstrap-dimension` 子输入。 |
| 进化事件路径 | `lib/service/evolution/FileChangeHandler.ts` | 文件变更的确定性处理、提案、信号，不直接等同于 AgentRuntime 执行。 |
| 进化 Agent 路径 | `lib/agent/runs/evolution/EvolutionAgentRun.ts` | `evolution-audit` profile 的系统级 Agent 审计入口。 |

## 3. Runtime 支持的执行层级

从源码看，`AgentRuntime` 本身支持三层使用方式。

### 3.1 高层：`AgentService.run(input)`

这是当前最应该推广的入口。它的价值不是多包一层，而是把业务调用统一成可编译、可诊断、可协调的 run 契约。

典型路径：

```text
HTTP / CLI / Workflow
  -> AgentService.run({ profile, message, params, context, execution, presentation })
  -> AgentRunResult
```

当前已使用的场景包括：

- HTTP chat：`lib/http/routes/ai.ts` 中 `createHttpChatAgentRunInput()` 构造 `{ preset: 'chat' }`。
- scan：`lib/agent/runs/scan/ScanAgentRun.ts` 构造 `scan-extract` / `scan-summarize`。
- relation：`lib/agent/runs/relation/RelationAgentRun.ts` 构造 `relation-discovery`。
- evolution：`lib/agent/runs/evolution/EvolutionAgentRun.ts` 构造 `evolution-audit`。
- translation：`lib/agent/runs/translation/TranslationAgentRun.ts` 构造 `translation-json`。
- bootstrap：`lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts` 构造 `bootstrap-session`，再由 coordinator 分发 `bootstrap-dimension`。

适合场景：业务系统、HTTP/CLI/MCP/workflow 层触发 Agent 时，都应该优先走这里。

### 3.2 中层：`AgentRuntime.execute(message, opts)`

这是 Runtime 的直接入口，但当前应被 `AgentRuntimeBuilder` 间接持有。`execute()` 做了：

- 运行前 policy 校验。
- 创建全局 timeout 和 abort 保护。
- 委托 `strategy.execute(this, message, opts)`。
- 运行后 policy 校验。
- 发布 Agent lifecycle 事件。
- 必要时通过 `message.replyFn` 回原始渠道。

适合场景：框架内部、测试、builder 创建后的 runtime 执行。业务代码一般不应该手写 `new AgentRuntime()`。

### 3.3 底层：`runtime.reactLoop(prompt, opts)`

这是 ReAct 内核入口，主要给 Strategy 调用。它支持大量可选注入：

- `history` / `context`：消息历史和阶段上下文。
- `capabilityOverride`：阶段级 capability 覆盖。
- `additionalToolsOverride`：阶段级额外工具。
- `budgetOverride`：阶段级预算。
- `systemPromptOverride`：阶段级 system prompt。
- `contextWindow`：系统任务上下文窗口压缩。
- `tracker`：探索阶段控制、nudge、退出和 toolChoice。
- `trace`：ActiveContext 推理链记录。
- `memoryCoordinator`：观察记录和动态 memory prompt。
- `sharedState`：跨阶段去重、维度信息、bootstrap dedup。
- `source`：`user` / `system` 等，影响预算提示、错误恢复和 forced summary。
- `toolChoiceOverride`：首轮强制/禁用工具调用。

适合场景：实现新的 Strategy 或调试 ReAct 行为。业务 workflow 不应该直接把复杂 orchestration 写进 `reactLoop()`。

## 4. 当前 Agent 使用范式

### 范式一：交互式 Single ReAct Agent

代表 profile / preset：

- `chat-default` -> `chat`
- `lark-chat` -> `lark`
- `remote-exec` 相关 remote profile -> `remote-exec`

执行方式：

```text
AgentService.run(profile: { preset: 'chat' } 或 { id: 'chat-default' })
  -> AgentRuntimeBuilder
  -> AgentRuntime(strategy: SingleStrategy)
  -> SingleStrategy.execute()
  -> runtime.reactLoop(message.content, history + context)
```

特征：

- 面向人类交互，多轮 history 重要。
- `source` 多为 `http-chat`、`http-stream`、`lark`，最终映射到 Runtime 的 `user`。
- 通常使用 `conversation` + `code_analysis` 能力。
- 可接 SSE progress，但结果主体仍是一个最终 reply。
- 适合问答、项目解释、知识检索、远程受控命令。

设计边界：

- 不应该在这个范式里塞复杂项目扫描、副作用写库、分维度并发。
- 若需要确定格式 JSON，可改用范式二。

### 范式二：轻量系统单任务 Agent

代表 profile：

- `translation-json`
- `signal-analysis`

执行方式：

```text
AgentService.run(profile: { id: 'translation-json' })
  -> chat basePreset + single strategy
  -> runtime.reactLoop(..., source: system)
  -> projection parse JSON / fallback
```

特征：

- 仍是 `SingleStrategy`，但调用来源是系统任务。
- 通常预算很小，工具集为空或极窄。
- 依赖 persona / prompt 约束输出格式。
- projection helper 负责 JSON 解析和 fallback。

适合场景：翻译、分类、轻量结构化总结、后台建议生成。

设计边界：

- 不需要 `ContextWindow`、`ExplorationTracker` 的场景，不要强行接入完整系统上下文。
- 解析失败要在 projection 层降级，不应该污染 Runtime。

### 范式三：阶段化 Pipeline Worker Agent

代表 profile：

- `scan-extract`
- `scan-summarize`
- `relation-discovery`
- `evolution-audit`
- `bootstrap-dimension`

执行方式：

```text
AgentService.run(profile: { id: 'scan-extract' })
  -> AgentProfileCompiler.compileDefinition()
  -> AgentStageFactoryRegistry.build(factory)
  -> Runtime(strategy: PipelineStrategy)
  -> stage by stage runtime.reactLoop(...)
```

`PipelineStrategy` 的关键能力：

- 按 stage 构造 prompt。
- 每个 stage 可覆盖 capability、systemPrompt、budget、additionalTools。
- stage 间有 `phaseResults`。
- gate stage 可 `pass` / `retry` / `degrade`。
- retry 时可以回退前一执行阶段。
- stage 级 timeout 和 hard timeout 互相配合。
- 每个执行阶段可重新解析 `ExplorationTracker`。
- 最终结果从最后一个执行阶段 reply + 累计 toolCalls 组成。

适合场景：

- 需要“先分析、再生产、再门控”的任务。
- 输出要经过质量门或拒绝率门。
- 任务需要读取代码、收集证据、提交候选、生成提案。

设计边界：

- Pipeline stage 只负责 Agent 推理组织。
- 写库、checkpoint、报告、候选关系消费等业务副作用仍应留在 workflow/consumer 层。
- profile definition 必须可序列化；复杂函数由 stage factory / preset 注册表解析。

### 范式四：服务层协调的多维度 Agent Session

代表 profile：

- `bootstrap-session`
- 子 profile：`bootstrap-dimension`

执行方式：

```text
BootstrapWorkflow
  -> buildBootstrapSessionExecutionInput()
  -> AgentService.run(profile: { id: 'bootstrap-session' })
  -> AgentRunCoordinator.partitionBootstrapSessionDimensions()
  -> childInputFactories lazy build child runtime context
  -> AgentService.run(profile: { id: 'bootstrap-dimension' }) per child
  -> tier complete / child result hooks
  -> mergeBootstrapSessionResults()
```

这是当前冷启动最重要的范式。需要特别注意：`bootstrap-session` 的 profile 声明里有 `strategy: { type: 'fanout' }`，但当前实际执行优先被 `AgentRunCoordinator` 接管，因为它有 `concurrency` plan。也就是说，冷启动父级正常情况下不是进入一个普通 `FanOutStrategy` ReAct loop，而是在 `AgentService` 层切分成多个 child run。

特征：

- 父 run 负责会话级协调，不直接分析代码。
- 子 run 才是真正执行 `PipelineStrategy` 的 Agent worker。
- 支持 tiered concurrency。
- 支持 lazy child input：只有维度真正开始执行时，才创建 scope、contextWindow、tracker、trace。
- 支持 `onChildResult` / `onTierComplete` 做消费和反思。
- 共享 `submittedTitles`、`submittedPatterns`、`submittedTriggers`、`BootstrapDedup` 做跨维度去重。

适合场景：

- 多个相互独立但共享会话状态的系统任务。
- 每个子任务都足够重，需要自己的 memory scope / contextWindow / tracker。
- 需要可观测进度和分层调度。

设计边界：

- 不要把维度调度塞进一个超长 prompt。
- 不要让多个并发维度共享同一个可变 `AgentRuntime` 实例。
- 共享状态要显式放入 `sharedState`，不要通过闭包或全局变量隐式共享。

### 范式五：事件驱动的 Agent 辅助进化

代表代码：

- `lib/service/evolution/FileChangeHandler.ts`
- `lib/agent/runs/evolution/EvolutionAgentRun.ts`
- `lib/agent/profiles/definitions/evolution.profile.ts`

执行方式分两段：

```text
FileChangeHandler
  -> renamed/deleted/modified deterministic handling
  -> EvolutionGateway proposal / SignalBus quality signal / suggestReview

runEvolutionAudit(...)
  -> AgentService.run(profile: { id: 'evolution-audit' })
  -> evolution preset PipelineStrategy
  -> propose_evolution / confirm_deprecation / skip_evolution
```

特征：

- 文件变更处理本身不是 AgentRuntime。
- `renamed` 和 `deleted` 优先走确定性修复/弃用提案。
- `modified` 通过 diff + recipe token 做影响分级。
- 只有需要语义判断、源码真实性验证、进化决策时，才进入 `evolution-audit` Agent。

适合场景：

- 外部事件先做低成本判定。
- 判定出需要 AI 审查后，再提交系统级 Agent 任务。

设计边界：

- 不要把毫秒级文件变更响应改成同步 AI 调用。
- Agent 应作为“复杂判断/决策提交者”，不是所有事件的第一处理器。

### 范式六：低层 Runtime 覆盖与实验性自定义 Agent

代表入口：

- `AgentProfileOverride`
- `CompiledAgentProfile`
- `AgentRuntimeBuilder.build(profileRefOrOverride)`

能力：

- 覆盖 base preset。
- 覆盖 skills/capabilities。
- 覆盖 strategy。
- 覆盖 policies/persona/memory。
- 通过 `actionSpace: { mode: 'listed', toolIds }` 注入 `additionalTools`。

适合场景：

- 测试新 pipeline。
- 临时实验新的 action space。
- 在不新增正式 profile 的情况下验证策略。

设计边界：

- 正式业务入口最终应该沉淀成 profile definition。
- 运行期对象仍放 `AgentRunContext`，不要塞进 profile override。

## 5. Strategy 与范式的关系

| Strategy | 当前实现 | 对应范式 | 说明 |
| --- | --- | --- | --- |
| `SingleStrategy` | `lib/agent/strategies/SingleStrategy.ts` | 范式一、二 | 最薄的一层，只把 message 转成 `reactLoop()`。 |
| `PipelineStrategy` | `lib/agent/strategies/PipelineStrategy.ts` | 范式三、四的 child | 多阶段、gate、retry、degrade、stage timeout。 |
| `FanOutStrategy` | `lib/agent/strategies/FanOutStrategy.ts` | 可用于独立 fanout | Runtime 层 fanout 会在同一 runtime 上并发 item strategy；冷启动当前主要不用它来执行父级。 |
| `AdaptiveStrategy` | `lib/agent/strategies/AdaptiveStrategy.ts` | 实验/路由型 | 根据文本或 items 选择 single/pipeline/fanout；当前更像可用组件，不是主要业务入口。 |
| `AgentRunCoordinator` | `lib/agent/coordination/AgentRunCoordinator.ts` | 范式四 | 不是 Strategy，但实际承担 `bootstrap-session` 的父级并发协调。 |

一个重要设计判断：

> Runtime-level `FanOutStrategy` 适合轻量独立 item；service-level `AgentRunCoordinator` 更适合冷启动这种每个子任务都要独立运行上下文、独立 projection、独立消费副作用的重任务。

## 6. 冷启动管线为什么代码很多

冷启动的目标不是“让 Agent 看项目然后回答”。它的目标是建立 Alembic 的项目知识初始状态，包括候选知识、技能、语义记忆、图谱、报告、快照和交付物。因此它有四类复杂度。

### 6.1 复杂度一：Agent 前置的确定性项目快照

`bootstrap-internal.ts` 先调用 `runAllPhases()`，不是为了绕开 Agent，而是为了给 Agent 提供可信、可复用、可裁剪的事实底座。

`BootstrapPhaseRunner` 当前包含：

- Phase 1：文件收集，含 discoverer、多语言项目类型、最大文件数、Alembic 生成物排除。
- Phase 1.5：tree-sitter AST 分析，含语法包按需安装、SFC 预处理、Agent AST context。
- Phase 1.6：Code Entity Graph。
- Phase 1.7：Call Graph / Data Flow Graph。
- Phase 2：依赖图写入 `knowledge_edges`。
- Phase 2.1：module 实体写入 Code Entity Graph。
- Phase 2.2：Panorama 全景汇总。
- Phase 3：Guard 审计和 ViolationsStore 写入。
- Phase 4：维度解析、Enhancement Pack、语言画像、多语言文案调整、增强 Guard 规则复审。
- Incremental evaluation：判断是否可增量、受影响维度、跳过维度、恢复 episodic session。

这些逻辑如果都交给 LLM 临场发现，会有几个问题：

- 成本不可控：每个维度都会重复扫描项目。
- 结果不稳定：不同维度可能对项目结构形成互相矛盾的理解。
- 上下文爆炸：完整文件和全量结构无法直接塞进 prompt。
- 缺少治理：Guard、依赖图、实体图需要结构化写入，不是自然语言回答。
- 无法增量：没有 diff 和历史快照就不知道哪些维度可以跳过。

因此，Phase 1-4 的复杂度本质上是“把项目事实结构化”，不是 AgentRuntime 的职责。

### 6.2 复杂度二：多维度、多阶段的系统 Agent 会话

冷启动不是一个 Agent run，而是一个 session run + 多个 dimension child run。

当前路径：

```text
fillDimensionsV3()
  -> initializeBootstrapRuntime()
  -> prepareBootstrapRescanState()
  -> buildBootstrapSessionExecutionInput()
  -> agentService.run(bootstrap-session)
  -> AgentRunCoordinator
  -> lazy createBootstrapDimensionRuntimeInput(dimId)
  -> agentService.run(bootstrap-dimension)
```

每个 `bootstrap-dimension` 又可能有不同 pipeline：

- skill-only：`analyze`
- 常规候选：`analyze -> quality_gate -> produce -> rejection_gate`
- rescan 且有旧知识：`evolve -> evolution_gate -> analyze -> quality_gate -> produce -> rejection_gate`

这些组合来自 `AgentStageFactoryRegistry.bootstrapDimensionPipeline()`，它复用 `PRESETS.insight.strategy.stages` 和 `PRESETS.evolution.strategy.stages`。

因此冷启动代码多，是因为它同时在处理：

- 维度是否需要候选。
- 是否 skill-only。
- 是否有旧 recipe。
- 是否已经做过 evolution prescreen。
- 是否开启终端测试工具集。
- stage 级 capability 和 prompt。
- stage 级 budget 和 tracker。
- gate retry/degrade。

这些是系统任务编排逻辑，不适合塞进 Runtime。

### 6.3 复杂度三：长任务上下文与可恢复性

冷启动子任务创建 `SystemRunContext` 时注入了大量对象：

- `MemoryCoordinator`
- `ActiveContext` / `trace`
- `ContextWindow`
- `ExplorationTracker`
- `sharedState`
- `dimensionMeta`
- `dimConfig`
- `projectInfo`
- `dimContext`
- `sessionStore`
- `semanticMemory`
- `codeEntityGraph`
- `panorama`
- `evidenceStarters`
- `rescanContext`
- `existingRecipes`
- `projectOverview`

这些对象的目的不是“给 Agent 多塞点上下文”，而是解决长任务常见问题：

- 上下文窗口超限：`ContextWindow` 分级压缩。
- LLM 一直搜索不收敛：`ExplorationTracker` 控制阶段、nudge、toolChoice、graceful exit。
- 多阶段证据丢失：`ActiveContext` 记录 thought/action/observation/plan。
- 跨维度重复提交：`sharedState` + `BootstrapDedup`。
- 增量重跑保留经验：恢复 `SessionStore` digest。
- 维度间依赖顺序：`TierScheduler` + tier reflection。
- 用户取消或任务失效：`AbortSignal` + `BootstrapTaskManager.isSessionValid()`。

这些能力是冷启动可靠性的来源。少了它们，代码会短，但行为会回到不可控的长 prompt。

### 6.4 复杂度四：Agent 结果之后的业务副作用

`AgentRuntime` 返回的是 `AgentResult` / `AgentRunResult`，但冷启动最终需要很多业务产物。`BootstrapWorkflow` 在 parent run 完成后继续做：

- `consumeBootstrapDimensionResult()`：消费每个维度结果，写 candidate、更新统计、checkpoint。
- `consumeBootstrapTierReflection()`：每个 tier 完成后写 session reflection。
- `consumeBootstrapSkills()`：生成/消费 project skill。
- `consumeBootstrapCandidateRelations()`：候选关系消费。
- `consumeBootstrapSemanticMemory()`：语义记忆整合。
- `consumeBootstrapReportAndSnapshot()`：报告与快照。
- `consumeBootstrapDeliveryAndWiki()`：交付物与 wiki。

这些副作用不能放到 `AgentRuntime`，否则 Runtime 会变成 bootstrap 专用领域服务。

## 7. 冷启动复杂度的合理边界

从当前实现看，冷启动代码多是合理的，但边界应保持清晰。

应该留在冷启动 workflow 的逻辑：

- 清理旧数据和快照。
- 项目扫描和结构化快照。
- 增量判断和 checkpoint 恢复。
- 维度选择、tier 调度、session 管理。
- candidate / skill / memory / report / delivery 消费。
- UI/CLI/MCP 进度事件。

应该留在 Agent profile / stage factory 的逻辑：

- 某个维度跑哪些 stage。
- stage 用哪些 capability。
- stage 用哪个 system prompt 和 promptBuilder。
- stage budget、retryBudget、gate evaluator。
- terminal toolset 的阶段级附加工具。

应该留在 Runtime 的逻辑：

- ReAct 循环。
- LLM 调用和空响应/AI 错误恢复。
- tool schema 投影和工具调用处理。
- allowlist、trace、memory observation、submit dedup。
- contextWindow 压缩。
- tracker nudge / toolChoice / graceful exit。
- forced summary。
- diagnostics 和 runtime lifecycle。

不应该做的事：

- 不要让 `AgentRuntime` 知道 bootstrap 的 candidate、skill、snapshot、wiki。
- 不要让 `AgentService` 长出 `runBootstrap()`、`runScan()`、`runEvolution()` 这类领域方法。
- 不要让 profile definition 捕获 `MemoryCoordinator`、`SessionStore`、`Set`、`Map`、DB service。
- 不要把所有冷启动维度塞进一个 prompt，试图用一个 Agent run 完成。

## 8. 建议沉淀的 Agent 使用范式命名

为了后续讨论统一，可以把当前实现抽象成以下正式范式。

### 8.1 `interactive-single`

人类交互式 Agent。

契约：

- `strategy = single`
- `source = user`
- `history` 有意义
- 输出是自然语言 reply

代表：HTTP chat、Lark chat、remote exec。

### 8.2 `system-single`

系统触发的单次结构化 Agent。

契约：

- `strategy = single`
- `source = system`
- 预算小
- 工具为空或极少
- projection 解析结构化输出

代表：translation-json、signal-analysis。

### 8.3 `system-pipeline-worker`

系统触发的阶段化 worker。

契约：

- `strategy = pipeline`
- `SystemRunContext` 可选但推荐
- stage 可覆盖 capability/budget/systemPrompt
- gate 可 retry/degrade
- projection 消费 phases/toolCalls

代表：scan-extract、scan-summarize、relation-discovery、evolution-audit、bootstrap-dimension。

### 8.4 `coordinated-session`

服务层协调的多 child run 会话。

契约：

- parent profile 有 `concurrency`
- `AgentRunCoordinator` partition/merge
- child input 可 lazy 创建
- 每个 child 独立运行上下文
- parent coordination hooks 消费 child result / tier complete

代表：bootstrap-session。

### 8.5 `event-assisted-agent`

事件先行、Agent 辅助判断。

契约：

- 外部事件先走确定性 handler
- handler 输出 proposal/signal/suggestReview
- 需要语义判断时再触发 `system-pipeline-worker`

代表：FileChangeHandler + evolution-audit。

### 8.6 `runtime-experiment`

实验性 profile override / compiled profile。

契约：

- 可通过 `AgentProfileOverride` 覆盖 base preset、skills、strategy、policy、persona、memory、actionSpace
- 用于验证新能力
- 成熟后沉淀为 profile definition

代表：测试、新 pipeline 原型、临时工具白名单实验。

## 9. 后续重构建议

### 9.1 文档与命名

- 在正式架构文档中引入上述六个范式名，避免继续用“Agent 类型”描述所有东西。
- 明确 `bootstrap-session` 是 `coordinated-session`，`bootstrap-dimension` 是 `system-pipeline-worker`。
- 明确 `FileChangeHandler` 是 `event-assisted-agent` 的事件侧，不是 AgentRuntime 使用者。

### 9.2 Profile 边界

- 正式业务能力尽量走 profile definition。
- `AgentProfileOverride` 只保留给实验、测试、临时工具集。
- 保持 profile 可序列化，不放运行期对象。

### 9.3 冷启动代码组织

- 保留 `BootstrapPhaseRunner` 的确定性项目快照职责。
- 保留 `BootstrapWorkflow` 的业务副作用编排职责。
- 继续把 Agent 执行入口收敛在 `agent-runs/*` builder 和 profile/stage factory。
- 如果要减少体感复杂度，优先拆“命名清晰的小模块”和“结果投影/consumer”，不要把逻辑塞回 Runtime。

### 9.4 Strategy 选择

- 普通对话：`interactive-single`。
- 格式转换/轻判断：`system-single`。
- 需要证据链和质量门：`system-pipeline-worker`。
- 多维度重任务：`coordinated-session`。
- 外部事件触发：先 `event-assisted-agent`，再按需进入 pipeline worker。

## 10. 一句话总括

`AgentRuntime` 已经足够通用，它支持的不是“几种 Agent 类”，而是几种运行范式：单次 ReAct、系统单任务、阶段化 worker、协调式多 child session、事件辅助式 Agent、实验性 profile override。冷启动之所以代码多，是因为它把“项目事实构建、维度调度、长任务上下文、可靠性治理、结果副作用”都放在 Runtime 外部完成；这正是保持 ONE Runtime 不变形的代价，也是当前架构里更健康的边界。