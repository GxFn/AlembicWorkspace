# AgentRuntime 正交统一设计与破坏性实现方案

> 本文档基于当前代码实现重新扫描后编写，用于替代“兼容式迁移”的思路。
> 目标不是保留旧入口，而是把所有 Agent 能力统一表达为 `AgentService.run(AgentRunInput)`，由 `AgentRuntime` 执行内核承载。
> 统一的是入口、配置编译、运行契约和结果投影，不是把所有业务上下文塞进一个万能对象，也不是让一个 runtime 承载所有并发分支。

## 0. 重新界定：到底统一收敛什么

这次重构要收敛的是 **Agent 运行模型**，不是把 scan、bootstrap、translate、SignalCollector 都改造成同一个领域服务。

必须统一的内容：

1. **唯一运行入口**：所有 surface、workflow、background task 都只能通过 `AgentService.run(input)` 发起 Agent 执行。
2. **唯一 Runtime 构造路径**：只有 `AgentRuntimeBuilder` 可以 `new AgentRuntime`，业务代码不再直接 `createRuntime()`。
3. **统一配置编译**：轻量任务和复杂管线都先声明 profile，再由 profile compiler 编译成 runtime config、strategy plan、policy、skill、action space。
4. **统一运行上下文契约**：运行期对象通过 `AgentRunContext` / `SystemRunContext` 注入，不能混进 profile 配置。
5. **统一 action layer**：工具 schema、治理、执行、envelope 只走 `CapabilityCatalog + ToolRouter`。
6. **统一结果模型**：runtime 返回 canonical `AgentRunResult`，API/CLI/bootstrap 再做局部 projection。

不应该统一的内容：

1. 不把 bootstrap 的 checkpoint、candidate 写入、skill 生成等业务副作用塞进 `AgentService`。
2. 不把 scan 的 DTO、translate 的 JSON、relation discovery 的写图逻辑塞进 `AgentRuntime`。
3. 不让 profile 携带 `SessionStore`、`MemoryCoordinator`、`ActiveContext`、`Set`、`Map`、file contents 等运行期对象。
4. 不让并发管线共享同一个可变 `AgentRuntime` 实例。

最终边界应是：

```text
Surface / Workflow
  负责: 业务输入校验、任务参数、结果 projection、业务副作用

AgentService
  负责: 统一 run 契约、profile 编译、runtime 创建、执行与 canonical result

AgentRuntime
  负责: 单次 run 的 ReAct 内核、strategy 委派、tool loop、policy、diagnostics

ToolRouter
  负责: 工具治理、输入归一化、adapter 执行、envelope
```

## 1. 扫描结论

当前代码已经具备一个事实上的统一执行内核：`AgentRuntime`。

`AgentRuntime.execute()` 不区分 chat、scan、bootstrap、evolution、remote-exec 等 Agent 类型。它只做四件事：

1. 执行前 policy 校验。
2. 把执行委托给 strategy。
3. strategy 调用 `runtime.reactLoop()` 完成 ReAct 循环或多阶段编排。
4. 执行后 policy 校验并返回统一 `AgentResult`。

真正还没有统一的是“Agent 能力入口”和“服务语义表达”。

现在仍存在两套入口：

1. 新入口：`AgentService.run(input)`，已经用于 HTTP chat 与 Lark。
2. 旧入口：`AgentFactory.createRuntime/createChat/...` 与领域方法，仍用于 scan、bootstrap、evolution、translate、SignalCollector。

因此，本轮重构不应再新增 `KnowledgeAgentWorkflowService`、`BootstrapAgentService` 之类外部服务。正确方向是增强 `AgentRunInput / AgentProfile / AgentRuntimeBuilder / AgentService` 的表达力，让所有 Agent 能力都成为统一运行模型的一种 profile。

## 2. Agent 能力性质判定

Agent 能力不是“工具服务”，也不是“领域 workflow service”。

它的服务性质应定义为：

> Agent 能力是一个受 profile 描述的 LLM 推理运行单元。它通过 AgentRuntime 组合 skill、strategy、policy、run context 与 action space，完成一次可观测、可治理、可投影的工程任务。

这意味着：

| 概念 | 性质 | 不能承担的职责 |
| --- | --- | --- |
| `AgentService` | 唯一服务入口，接收 `AgentRunInput`，返回 `AgentRunResult` | 不承载 scan/bootstrap/evolution 等领域分支方法 |
| `AgentRuntimeBuilder` | 把 profile 编译成 `AgentRuntime` | 不决定业务结果 DTO |
| `AgentRuntime` | 单一 ReAct 执行内核 | 不知道 HTTP/Lark/Bootstrap 的 API 形状 |
| `Strategy` | 工程编排方式，决定 single/pipeline/fanout/adaptive | 不选择工具实现，不写入业务数据 |
| `Capability` / Agent Skill | prompt fragment + tool allowlist + hooks | 不代表服务入口，不直接执行任务 |
| `ToolRouter` | action layer 统一执行 facade | 不选择 Agent profile |
| Projection | 把 `AgentRunResult` 投影成 API/任务 DTO | 不反向影响 Runtime 执行语义 |

### 2.1 配置与数据的纯净边界

现有代码最大的问题不是缺少配置字段，而是 **配置、运行期对象、业务 projection 混在一起**。

统一设计必须先划清四类数据：

| 层级 | 内容 | 是否可序列化 | 是否可复用 | 示例 |
| --- | --- | --- | --- | --- |
| Profile 配置 | Agent 服务语义、skill、strategy 声明、policy 声明、action space | 必须可序列化 | 可复用 | `scan-extract`、`bootstrap-dimension`、`translation-json` |
| Run Input | 本次运行的用户/系统输入、actor、source、task params、file refs | 应尽量可序列化 | 不复用 | prompt、sessionId、task、label、dimensionId |
| Run Context | 本次运行的能力上下文、trace、memory、sharedState、fileCache | 可包含对象引用 | 只能在本次 run 使用 | `SystemRunContext`、`ContextWindow`、`MemoryCoordinator` |
| Projection | 把 canonical result 转为业务 DTO 并执行业务副作用 | 不要求可序列化 | surface/task 局部 | summarize DTO、bootstrap checkpoint、写 knowledge graph |

硬性规则：

1. **Profile 不能引用运行期对象**：禁止在 profile 里放 `MemoryCoordinator`、`SessionStore`、`ActiveContext`、`ContextWindow`、`Set`、`Map`、`fileCache`、DB service、container。
2. **Strategy plan 要纯净**：stage 只能声明 `name / capabilities / budget / gate / prompt template key / prompt builder id / submitToolName / pipelineType`。不能闭包捕获 orchestrator 变量。
3. **Prompt 构建要受控**：复杂 prompt builder 可以存在，但必须由 profile compiler 从注册表解析，输入只能来自 `Run Input + SystemRunContext`，不能从外部闭包偷取状态。
4. **Run Context 可以有对象引用，但必须有作用域**：每个 run 或每个并发 child run 都有自己的 `scopeId`、`trace`、`contextWindow`、`tracker`；跨分支共享只允许显式 shared state。
5. **Projection 不回流 Runtime**：业务 DTO、写库、checkpoint、CLI report 不影响 runtime 内部结构。

## 3. 当前代码事实

### 3.1 Runtime 内核

核心文件：

- `lib/agent/AgentRuntime.ts`
- `lib/agent/AgentRuntimeTypes.ts`
- `lib/agent/PipelineStrategy.ts`
- `lib/agent/strategies.ts`

已确认事实：

- `AgentRuntime` 构造时必须具备 `ToolRouter`，工具执行走统一 router path。
- `execute()` 委托给 `this.strategy.execute(this, message, opts)`。
- `SingleStrategy` 直接调用 `runtime.reactLoop(message.content, opts)`。
- `PipelineStrategy` 按 stage 构造 prompt、budget、tracker，再调用 `runtime.reactLoop()`。
- `reactLoop()` 负责 LLM 调用、工具 schema、tool choice、工具执行、tracker、trace、memory、diagnostics 和 forced summary。
- `#collectTools()` 从当前 capabilities 收集工具白名单，并合并 `additionalTools`。
- 空 capability tools 表示“不开放工具”，不再隐式展开为全量工具。
- `#getToolSchemas()` 通过 `capabilityCatalog.toToolSchemas(ids)` 投影 tool schema。

结论：执行内核已经统一，问题集中在入口、profile 表达和 projection。

### 3.2 正交组合轴

当前代码中已经存在以下组合轴，但命名和入口没有完全收敛：

| 组合轴 | 当前承载代码 | 目标归属 |
| --- | --- | --- |
| 服务语义 / Profile | `presets.ts`、`AgentRunContracts.ts`、`AgentFactory` overrides | `AgentProfileRegistry + AgentProfileCompiler` |
| Agent Skill | `capabilities.ts` | 保留，但统一命名为 Agent Skill |
| Strategy | `strategies.ts`、`PipelineStrategy.ts`、`presets.ts` | profile 中声明，builder 编译 |
| Policy | `policies.ts`、`presets.ts`、调用方 override | profile 中声明，builder 编译 |
| Run Context | `SystemRunContext.ts`、`AgentRunContext`、`strategyContext` | `AgentRunInput.context` |
| Action Space | capability tools、`additionalTools`、`CapabilityCatalog` | `AgentProfile.actionSpace` + skill tools |
| Presentation / Projection | HTTP route、Lark、`AgentFactory` 私有解析 | `AgentService` 返回 canonical result，surface/task 局部投影 |

目标不是把这些轴合并成一个大对象，而是让它们通过一个入口正交组合。

## 4. 所有 Agent 能力入口矩阵

| 能力入口 | 当前调用链 | 业务语义 | 当前状态 | 目标收敛方式 |
| --- | --- | --- | --- | --- |
| HTTP chat | `ai.ts -> agentService.run({ preset: chat })` | 用户对话 / RAG / 项目问答 | 已走新入口 | 保留，补齐 projection 与 diagnostics |
| HTTP stream chat | `ai.ts -> agentService.run({ preset: chat })` | 流式对话 | 已走新入口 | 保留，stream 只做 presentation |
| Lark bot | `LarkTransport -> agentService.run({ preset: lark })` | 飞书知识对话 | 已走新入口 | 保留 |
| Lark remote exec | `LarkTransport -> agentService.run({ preset: remote-exec })` | 远程执行受治理操作 | 已走新入口 | 保留 |
| HTTP summarize | `ai.ts -> factory.scanKnowledge(task=summarize)` | 单段代码生成知识摘要 | 旧入口 | `AgentService.run(profile: scan-summarize)` |
| HTTP translate | `ai.ts -> factory.translateToEnglish()` | 技术文档翻译 | 旧入口 | `AgentService.run(profile: translation-json)` |
| HTTP extract path/text | `extract.ts -> factory.scanKnowledge(task=extract)` | 解析失败后的 AI Recipe 提取 | 旧入口 | `AgentService.run(profile: scan-extract)` |
| CLI AI scan | `AiScanService -> factory.scanKnowledge(task=extract)` | 批量扫描文件并发布 Recipe | 旧入口 | `AgentService.run(profile: scan-extract)` |
| Module scan | `ModuleService -> factory.scanKnowledge(task=extract)` | 模块级 AI Recipe 提取 | 旧入口 | `AgentService.run(profile: scan-extract)` |
| scanKnowledge extract | `AgentFactory.scanKnowledge -> createRuntime(insight) -> runtime.execute()` | 多文件知识候选提取，工具收集不入库 | 旧入口 | `AgentService.run(profile: scan-extract)` |
| discoverRelations | `AgentFactory.discoverRelations -> createRuntime(insight)` | 知识图谱关系发现 | 旧入口 | `AgentService.run(profile: relation-discovery)` |
| HTTP recipe relation task | `recipes.ts -> factory.discoverRelations()` | 后台发现关系并写入知识图谱 | 旧入口 | `AgentService.run(profile: relation-discovery)` |
| evolveCheck | `AgentFactory.evolveCheck -> createRuntime(evolution)` | Recipe 进化审计 | 旧入口 | `AgentService.run(profile: evolution-audit)` |
| bootstrap dimension | `orchestrator -> agentFactory.createRuntime(insight)` | 冷启动维度分析与候选生产 | 旧入口 | `AgentService.run(profile: bootstrap-dimension)` |
| SignalCollector | `SignalCollector -> agentFactory.createChat() -> execute()` | 后台信号分析与 skill 推荐 | 旧入口 | `AgentService.run(profile: signal-analysis)` |
| AgentRouter | `AgentFactory.createRouter -> createRuntime -> execute` | 意图路由 | 旧入口 | 删除或改为 profile selection helper，不执行 Runtime |

这个矩阵说明：所有能力都可以收敛到同一调用方案，不需要外置服务。

## 5. 冷启动链路的真实 Runtime 实现

冷启动在 `lib/external/mcp/handlers/bootstrap/pipeline/orchestrator.ts` 中已经不是旧 Analyst/Producer 类模型，而是手工使用统一 Runtime：

1. 按维度创建 `MemoryCoordinator` scope。
2. 从 `PRESETS.insight.strategy.stages` 取标准 insight stages。
3. 根据维度是否需要 candidate、是否有 existing recipe，拼出 stages：
   - `Analyze -> QualityGate -> Produce -> RejectionGate`
   - 或 `Evolve -> EvolutionGate -> Analyze -> QualityGate -> Produce -> RejectionGate`
   - 或 skill-only 维度只跑 `Analyze`
4. `agentFactory.createRuntime('insight', { strategy: { type: 'pipeline', stages } })`。
5. `runtime.setFileCache(allFiles)`。
6. 构造 `SystemRunContext`，注入：
   - `contextWindow`
   - `tracker`
   - `trace / activeContext`
   - `memoryCoordinator`
   - `sharedState`
   - `dimensionMeta`
   - `submitToolName`
   - `pipelineType`
   - `dimConfig / projectInfo / dimContext / sessionStore / semanticMemory / codeEntityGraph / panorama / evidenceStarters / rescanContext / existingRecipes`
7. `runtime.execute(message, { strategyContext, abortSignal })`。
8. 从 `phases.analyze / phases.quality_gate / phases.produce` 和 `toolCalls` 投影成 bootstrap 维度结果。

结论：冷启动不是另一个 AgentRuntime，它已经是 `AgentRuntime + PipelineStrategy + SystemRunContext`。需要迁移的是调用入口：由 orchestrator 手工 `createRuntime/execute` 改为构造 `AgentRunInput` 交给 `AgentService.run()`。

## 6. scanKnowledge 的正确归属

`scanKnowledge` 当前在 `AgentFactory` 里做了四类事：

1. 选择任务：`extract` / `summarize`。
2. 构建 pipeline stages：`buildScanPipelineStages()`。
3. 构建系统上下文：`buildSystemContext()`。
4. 执行 runtime 并把 `collect_scan_recipe` toolCalls 投影成旧 DTO。

这四类职责应拆开，但不能变成新的外部 service：

| 当前职责 | 目标位置 |
| --- | --- |
| task -> profile 选择 | surface/task 构造 `AgentRunInput.profile` |
| scan pipeline stage 构建 | `AgentProfileRegistry` 或 profile factory |
| system context 构建 | `SystemRunContextFactory`，作为 run context 工具函数 |
| toolCalls -> summarize/extract DTO | HTTP route 或 task-specific projection helper |

也就是说，`scanKnowledge` 应被删除，而不是包一层新服务。

目标调用形态：

```ts
await agentService.run({
  profile: { id: 'scan-extract', params: { task: 'extract' } },
  message: {
    role: 'system',
    content: `分析 "${label}" 的 ${files.length} 个源文件。`,
    metadata: { label, task },
  },
  context: {
    source: 'system-workflow',
    lang,
    fileCache: files,
    systemRunContext,
  },
  presentation: { responseShape: 'system-task-result' },
});
```

`scanKnowledgeResult` 只是这个 run result 的投影，不再是 Agent 能力入口。

## 7. 统一接口目标

### 7.1 AgentRunInput

当前 `AgentRunInput` 已经覆盖了基本字段，但还不足以表达 bootstrap/scan/evolution 的完整服务语义。

目标接口：

```ts
interface AgentRunInput {
  profile: AgentProfileRef | AgentProfileOverride;
  message: AgentRunMessage;
  context: AgentRunContext;
  execution?: AgentRunExecutionOptions;
  presentation?: AgentRunPresentationOptions;
}
```

需要增强的点：

1. `profile` 支持命名 profile，而不只是 `preset/basePreset`。
2. `context.systemRunContext` 成为系统型 Agent run 的主入口。
3. `context.strategyContext` 保留为低层补充，但不应成为 surface 自由拼装大杂烩。
4. `execution` 承载 abort、progress、tool hook、budget override。
5. `presentation.responseShape` 只影响结果投影，不参与 Runtime 执行。

目标上应把 `AgentRunInput` 拆成三个语义区，而不是继续把一切塞入 `context`：

```ts
interface AgentRunInput {
  profile: AgentProfileRef;
  message: AgentRunMessage;
  params?: Record<string, unknown>;      // 可序列化任务参数
  context: AgentRunContext;              // 运行期对象与作用域
  execution?: AgentRunExecutionOptions;  // 预算、中止、观察者
  presentation?: AgentRunPresentationOptions;
}
```

`params` 用来表达任务参数，例如：

- `scan-extract`: `{ task: 'extract', label, comprehensive }`
- `scan-summarize`: `{ task: 'summarize', label }`
- `bootstrap-dimension`: `{ dimensionId, sessionId, needsCandidates, hasExistingRecipes }`
- `relation-discovery`: `{ batchSize }`
- `translation-json`: `{ output: 'summary-and-usage-guide' }`

`context` 用来表达运行期对象，例如：

- `fileCache`
- `systemRunContext`
- `memoryCoordinator`
- `contextWindow`
- `trace`
- `sharedState`
- `actor/source/lang`

这样轻量任务和复杂管线使用同一个入口，但不会污染同一层级。

### 7.2 AgentProfile

目标 profile 不是旧 preset 的别名，而是完整服务语义：

```ts
interface AgentProfile {
  id: string;
  title: string;
  serviceKind:
    | 'conversation'
    | 'system-analysis'
    | 'knowledge-production'
    | 'translation'
    | 'background-analysis'
    | 'remote-operation';
  basePreset?: string;
  skills: string[];
  strategy: StrategyDeclaration;
  policies: PolicyDeclaration[];
  actionSpace: AgentActionSpace;
  memory: Record<string, unknown>;
  projection?: string;
}
```

更准确的目标结构应区分 **纯配置** 与 **可参数化工厂**：

```ts
interface AgentProfileDefinition {
  id: string;
  title: string;
  serviceKind: AgentServiceKind;
  lifecycle: 'active' | 'experimental' | 'deprecated';
  basePreset?: string;
  defaults: {
    skills: string[];
    policyRefs: PolicyRef[];
    actionSpace: AgentActionSpace;
    memory: Record<string, unknown>;
  };
  strategy: AgentStrategyTemplate;
  projection?: AgentProjectionRef;
}

type AgentStrategyTemplate =
  | { type: 'single' }
  | { type: 'pipeline'; factory: string; paramsSchema?: string }
  | { type: 'fanout'; childProfile: string; partitioner: string; merge: string };
```

其中 `factory`、`partitioner`、`merge` 都是注册表中的名字，不是闭包函数。编译时才解析为当前代码需要的 `PipelineStage[]` 或 strategy 实例。

初始内置 profiles：

| Profile | base preset | skills | strategy | 语义 |
| --- | --- | --- | --- | --- |
| `chat-default` | `chat` | `conversation`, `code_analysis` | single | HTTP 对话 |
| `lark-chat` | `lark` | `conversation`, `code_analysis` | single | 飞书对话 |
| `remote-exec` | `remote-exec` | `conversation`, `code_analysis`, `system_interaction` | single | 受治理远程操作 |
| `scan-extract` | `insight` | stage override | pipeline | 多文件扫描提取 |
| `scan-summarize` | `insight` | stage override | pipeline | 单文件摘要 |
| `bootstrap-dimension` | `insight` | stage override | pipeline | 冷启动维度执行 |
| `evolution-audit` | `evolution` | `evolution_analysis` | pipeline | Recipe 进化审计 |
| `relation-discovery` | `insight` | `knowledge_production`, `code_analysis` | pipeline | 关系发现 |
| `translation-json` | `chat` | empty/no tools | single | JSON 翻译 |
| `signal-analysis` | `chat` | selected tools or no tools | single | 后台行为分析 |

### 7.2.1 轻量任务与复杂管线如何共用配置模型

轻量任务不是特殊入口，它只是更小的 profile：

```ts
translation-json:
  strategy: single
  skills: []
  actionSpace: none
  policyRefs: [budget:one-shot-json]
  projection: json-object
```

复杂管线也不是特殊服务，它只是 profile 的 strategy template 更复杂：

```ts
scan-extract:
  strategy:
    type: pipeline
    factory: scanPipeline
  defaults:
    skills: [code_analysis, scan_production]
    actionSpace: listed(scan tools)
  projection: scan-recipes
```

```ts
bootstrap-dimension:
  strategy:
    type: pipeline
    factory: bootstrapDimensionPipeline
  defaults:
    skills: [code_analysis, knowledge_production, evolution_analysis]
    actionSpace: listed(bootstrap tools)
  projection: agent-result
```

差异只在 profile 编译阶段：

1. `single` 直接编译成 `SingleStrategy`。
2. `pipeline` 通过命名 stage factory 编译成 `PipelineStrategy`。
3. `fanout` 不应复用一个 runtime 并发跑所有分支，而应编译成多个 child `AgentService.run()`。

### 7.3 AgentRuntimeBuilder

当前 `AgentRuntimeBuilder` 与 `AgentFactory.createRuntime()` 基本重复。

目标：

1. `AgentFactory.createRuntime()` 删除。
2. `AgentRuntimeBuilder` 只接受已编译 profile，不直接散落解析业务参数。
3. 引入 `AgentProfileCompiler`：
   - profile ref -> profile definition
   - profile params -> stage factory
   - policy declaration -> policy instances
   - skill ids -> capability instances
   - actionSpace -> `additionalTools`

### 7.4 AgentService

目标职责：

1. 校验 `AgentRunInput`。
2. 编译 profile。
3. 构造 runtime。
4. 注入 fileCache / run context。
5. 执行 runtime。
6. 返回 canonical `AgentRunResult`。

不应包含：

1. `scanKnowledge()`。
2. `bootstrapDimension()`。
3. `translateToEnglish()`。
4. `evolveCheck()`。

这些只是 profile + input + projection。

## 8. Action Space 与工具上下文

工具 schema 当前链路：

1. `Capability.tools` 声明 tool id。
2. Runtime 每轮通过 `#collectTools(caps)` 收集。
3. `CapabilityCatalog.toToolSchemas(ids)` 投影给 LLM。
4. `ToolExecutionPipeline.allowlistGate` 按当前 schema 阻止幻觉工具。
5. `ToolRouter.execute()` 执行工具并返回 `ToolResultEnvelope`。

工具上下文当前链路：

1. `ToolExecutionPipeline` 从 runtime/loopCtx 构造 `ToolCallContext.runtime`。
2. 注入 `fileCache / dataRoot / lang / logger / aiProvider / safetyPolicy / sharedState / dimensionMeta / submittedTitles / submittedPatterns / submittedTriggers / bootstrapDedup / memoryCoordinator / currentRound / dimensionScopeId`。
3. `contextFromToolCall()` 转成 `InternalToolHandlerContext`。
4. 工具 handler 使用 typed context，不再依赖 legacy context。

统一 `AgentRunInput.context` 必须支持的字段：

| 字段 | 用途 |
| --- | --- |
| `fileCache` | bootstrap/scan 避免重复读盘，支持 `search_project_code/read_project_file/get_file_summary` |
| `systemRunContext` | 系统 run 的 trace/tracker/memory/sharedState 标准载体 |
| `contextWindow` | system pipeline stage 隔离与 token 压缩 |
| `tracker` | 探索阶段推进与 graceful exit |
| `trace/activeContext` | quality gate 生成结构化 artifact |
| `memoryCoordinator` | 动态 memory prompt 和 observation record |
| `sharedState` | 去重、维度元信息、bootstrap dedup |
| `lang` | prompt 与工具上下文语言提示 |
| `actor/source` | policy、安全审计、surface 归属 |

### 8.1 Source、scope 与 prompt context 的映射

当前 `AgentRunSource` 与 Runtime 内部 `source` 语义还没有完全对齐：

- `AgentRunSource` 有 `http-chat / http-stream / lark / bootstrap / system-workflow / mcp / internal`。
- `LoopContext` 与 `SystemPromptBuilder` 更关心 `user / system / analyst / producer` 这类执行语义。
- `SystemRunContext` 默认 `source: 'system'`。

目标设计需要显式映射：

| 输入 source | Runtime source | Channel | 用途 |
| --- | --- | --- | --- |
| `http-chat` | `user` | HTTP | 用户对话 |
| `http-stream` | `user` | HTTP | 用户流式对话 |
| `lark` | `user` 或 `remote` | LARK | 飞书对话/远程执行 |
| `system-workflow` | `system` | INTERNAL | scan、translate、relation 等系统任务 |
| `bootstrap` | `system` | INTERNAL | 冷启动维度执行 |
| `internal` | `system` | INTERNAL | 后台任务 |

因此 `AgentService` 不应把 `input.context.source` 原样当作 `Runtime source`。应引入：

```ts
interface AgentRunContext {
  source: AgentRunSource;          // surface 来源
  runtimeSource?: RuntimeSource;   // user/system/analyst/producer/remote
  promptContext?: Record<string, unknown>;
  systemRunContext?: SystemRunContext;
}
```

`promptContext` 替代当前散落在 `message.metadata.context` 里的业务上下文。`SingleStrategy` 和 `PipelineStrategy` 都应从统一位置取 prompt context：

```text
AgentRunInput.context.promptContext
  -> AgentMessage.metadata.context
  -> reactLoop({ context })
```

system run 必须同时满足：

1. `context.systemRunContext.scopeId` 存在。
2. `systemRunContext.trace === systemRunContext.activeContext`，除非显式允许 distinct。
3. `sharedState._dimensionScopeId` 与 `scopeId` 一致。
4. `runtimeSource` 映射为 `system`，而不是 `bootstrap` 或 `system-workflow` 这类 surface 名。

## 9. 并发管线设计：参数纯净、状态隔离、共享受控

当前代码里有两种并发：

1. `FanOutStrategy`：同一个 runtime 内部按 item 并发调用子 strategy。
2. bootstrap `TierScheduler`：按 tier 串行、tier 内用 `p-limit` 并发，每个维度手工创建独立 runtime。

从数据安全和状态隔离角度，目标设计应选择第二类模型作为统一方向：**并发分支是多个 child run，而不是一个 runtime 内多分支并发**。

### 9.1 为什么不能让一个 runtime 承载所有并发分支

`AgentRuntime` 内部有运行级可变状态：

- `iterationCount`
- `toolCallHistory`
- `tokenUsage`
- `state`
- `#fileCache`
- `#additionalTools`
- `#promptBuilder`

`PipelineStrategy` 内部每次 execute 也有可变 `phaseResults / totalToolCalls / totalTokenUsage / diagnostics`。

`FanOutStrategy` 当前复用同一个 runtime，把多个 item 并发交给 `itemStrategy.execute(runtime, itemMessage, ...)`。这适合轻量实验，但不能作为冷启动和生产级并发管线的目标模型，因为：

1. runtime 级统计会在并发分支间交错。
2. `AgentState` 状态机不是为多 child 并发隔离设计。
3. `ContextWindow`、tracker、trace 如果由 opts 共享，会产生串扰。
4. 工具调用历史和 diagnostics 难以准确归属到 child run。

因此统一设计中的并发管线必须是：

```text
AgentService.run(parent profile: bootstrap-session / scan-batch)
  -> AgentProfileCompiler 编译出纯 concurrency plan
  -> AgentRunCoordinator 调用命名 partitioner 生成 child AgentRunInput[]
  -> AgentRunCoordinator 用 p-limit / TierScheduler 控制并发
  -> 每个 child input 再调 AgentService.run()
  -> 每个 child 都有独立 AgentRuntime
  -> AgentRunCoordinator 调用命名 merge 合并 child AgentRunResult[]
```

这里的 `AgentRunCoordinator` 是 service 层的通用运行编排器，只理解 concurrency plan、child profile、partitioner、merge，不理解 bootstrap checkpoint、recipe 写库、skill 生成等业务副作用。业务副作用仍由 workflow projection 处理。

### 9.2 并发配置应该是纯参数

并发计划属于 profile 配置，但必须纯净：

```ts
interface AgentConcurrencyPlan {
  mode: 'none' | 'tiered' | 'parallel';
  concurrency: number | { env: string; default: number };
  partitioner?: string;
  childProfile?: string;
  merge?: string;
  abortPolicy?: 'stop-new' | 'cancel-running' | 'finish-tier';
}
```

允许：

- `childProfile: 'bootstrap-dimension'`
- `partitioner: 'bootstrapDimensionsByTier'`
- `merge: 'bootstrapDimensionResults'`
- `concurrency: { env: 'ALEMBIC_PARALLEL_CONCURRENCY', default: 3 }`

禁止：

- 在 profile 里放 `executeDimension` 函数。
- 在 profile 里闭包捕获 `sessionStore`、`memoryCoordinator`、`globalSubmittedTitles`。
- 在 profile 里放 `allFiles` 或源码内容。
- 在 stage config 里直接引用 orchestrator 局部变量。

### 9.3 并发 child run 的隔离不变量

每个 child run 必须独立拥有：

| 对象 | 隔离要求 | 原因 |
| --- | --- | --- |
| `AgentRuntime` | 每个 child 一个 | 避免 runtime 统计、状态、工具历史交错 |
| `ContextWindow` | 每个 child 一个，stage 切换可 reset | 避免消息压缩与 tool result 串扰 |
| `ExplorationTracker` | 每个 child/stage 自己解析 | 避免阶段推进互相影响 |
| `ActiveContext` / `trace` | 每个 child scope 一个 | quality gate 依赖当前 scope 的证据 |
| `DiagnosticsCollector` | 每个 child 一个，再由 parent merge | 错误归属清晰 |
| `AbortController` | parent signal 派生 child signal | 支持 tier 中止和单 child 超时 |

可以共享，但必须显式声明：

| 对象 | 共享方式 | 安全要求 |
| --- | --- | --- |
| `fileCache` | 只读共享引用 | 工具不得修改 file content |
| `MemoryCoordinator` | 会话级共享，但 child 用不同 `scopeId` | 禁止依赖 `#currentScopeId`，必须显式传 scopeId |
| `submittedTitles/submittedPatterns/submittedTriggers` | 共享 `Set` | 只用于去重，写入点集中在 ToolExecutionPipeline |
| `BootstrapDedup` | 会话级共享 | 只用于跨维度去重 |
| `SessionStore` | 会话级共享 | 写入应在 parent projection 或明确 child completion 阶段 |

### 9.4 现有代码暴露的并发风险

当前 `MemoryCoordinator.createDimensionScope(scopeId)` 会更新 `#currentScopeId`。在 bootstrap 并发执行维度时，如果后续逻辑依赖“当前 scope”而不是显式 `scopeId`，会出现串扰风险。

现有 `SystemRunContext` 设计已经提供了正确方向：

- `scopeId`
- `trace`
- `activeContext`
- `sharedState._dimensionScopeId`

但要继续强化规则：

1. system run 必须显式传 `scopeId`。
2. `AgentRuntime.#prepareIteration` 构建动态 memory prompt 时必须优先使用当前 run 的 scope，而不是 `MemoryCoordinator` 的 current scope。
3. 工具上下文必须透传 `dimensionScopeId`。
4. 所有 note/evidence 类工具必须写入指定 scope。

当前实现里 `AgentRuntime.#prepareIteration` 已经尝试从 `ctx.context.dimensionScopeId` 读取 scope，但 `PipelineStrategy.#runWithTimeout()` 传给 `reactLoop()` 的 `context` 主要来自 `message.metadata.context` 与 `pipelinePhase/previousPhases`，没有稳定注入 `strategyContext.scopeId` 或 `sharedState._dimensionScopeId`。因此 R5 必须补齐：

```text
SystemRunContext.scopeId
  -> projectSystemRunContext(...)
  -> PipelineStrategy strategyContext.scopeId/sharedState._dimensionScopeId
  -> reactLoop({ context.dimensionScopeId })
  -> MemoryCoordinator.buildDynamicMemoryPrompt({ scopeId })
  -> tool runtime.dimensionScopeId
```

文档层面的目标是把“当前 scope”降级为兼容兜底，把显式 `scopeId` 作为唯一可靠路径。

### 9.5 Parent run 与 child run 的职责

复杂管线需要两层 run 概念：

| 层级 | 是否调用 LLM | 职责 |
| --- | --- | --- |
| Parent run | 通常不直接调用 LLM | 分区、并发、checkpoint、merge、业务副作用 |
| Child run | 调用 LLM | 一个维度/一个文件/一个任务片段的 ReAct 或 pipeline 执行 |

这能同时满足：

- 轻量任务仍是单次 `AgentService.run()`。
- 复杂任务仍从统一入口进入。
- 并发分支具备隔离的 runtime 和 diagnostics。
- bootstrap 业务调度不会污染 `AgentRuntime`。

目标调用链：

```text
Bootstrap Orchestrator
  -> AgentService.run(parent profile: bootstrap-session, params)
  -> AgentRunCoordinator resolves concurrency plan
  -> coordinator builds child AgentRunInput per dimension
  -> AgentService.run(child profile: bootstrap-dimension) x N with p-limit
  -> merge child results
  -> projection writes checkpoint / digest / candidates
```

`bootstrap-session` 只表达“如何拆分和并发运行 child profile”，不表达候选如何入库；候选入库仍属于 bootstrap workflow 的 projection。

### 9.6 数据安全设计

统一入口不能降低当前工具层安全边界。复杂管线的数据安全要按数据类别处理：

| 数据类别 | 当前来源 | 安全策略 |
| --- | --- | --- |
| 源码内容 | `fileCache`、磁盘读取 | `fileCache` 只读共享；工具仍执行 path traversal 检查；输出需经 projection 控制 |
| 项目路径 | `projectRoot/dataRoot` | 只能由 DI / runtime builder 注入，surface 不直接覆盖 |
| 工具输入 | LLM function call args | `CapabilityCatalog` schema + `normalizeToolInput` + `GovernanceEngine` |
| 工具执行 | `ToolRouter` adapter | 统一 envelope、timeout、concurrency、service contracts |
| 写入型副作用 | `submit_knowledge`、`write_project_file`、terminal 等 | 必须由 action space + policy + governance 同时允许 |
| 跨维度去重 | shared `Set` / `BootstrapDedup` | 只能作为去重信号，不作为 prompt 私密数据随意展开 |
| 诊断与 trace | `DiagnosticsCollector`、`ActiveContext` | child run 独立记录，parent 只 merge 摘要 |

关键规则：

1. `fileCache` 是运行期输入，不是 profile 配置；profile 只能声明是否需要 project file access。
2. `projectRoot` 只能由服务容器或 runtime builder 解析，不能由 HTTP body 或 LLM 参数直接决定。
3. 所有工具调用必须经过 `ToolRouter.execute()`，不能恢复 `ToolRegistry.executeInternal` 直通。
4. 写工具必须显式出现在 action space；轻量任务如 translation 默认 `actionSpace: none`。
5. `ToolRouter` 的 concurrency policy 是工具层保护，不替代 Agent 并发隔离；两者都需要。
6. projection 负责截断或筛选返回给 API/CLI 的内容，不能把全部 `fileCache`、完整 trace、内部 sharedState 直接返回。
7. parent merge child result 时只合并 `reply/phases/toolCalls/usage/diagnostics` 的必要子集，不共享 child runtime 对象。

## 10. 破坏性实现阶段

当前实现进度：

- 已实现 `AgentProfileRegistry`、`AgentProfileCompiler`、`AgentStageFactoryRegistry`、`AgentRunCoordinator` 基础骨架。
- `AgentService.run()` 已改为先编译 profile，再由 `AgentRuntimeBuilder` 构造 runtime。
- `AgentRuntimeBuilder` 已支持接收 `CompiledAgentProfile`，旧 `{ preset: 'chat' }` 会被编译成兼容 profile。
- `AgentRunInput` 已补充 `params / runtimeSource / promptContext`，用于区分任务参数、surface source 与 runtime source。
- `PipelineStrategy` 已把 `SystemRunContext.scopeId / sharedState._dimensionScopeId` 显式贯穿到 `reactLoop.context.dimensionScopeId`。
- 已新增 `SystemRunContextFactory`，系统上下文构造已从旧 Factory 职责中剥离。
- 已新增 `runScanAgentTask()` 与 `projectScanRunResult()`，scan-extract / scan-summarize 的执行组装与 DTO 投影已从调用面抽离。
- 旧 `scanKnowledge` 壳已删除，scan 能力统一由 `runScanAgentTask()` 调用 `AgentService.run(profile: scan-extract / scan-summarize)`。
- HTTP `/ai/summarize`、`/extract/path`、`/extract/text`、`AiScanService`、`ModuleService` 已改为通过 `runScanAgentTask()` 调用 `AgentService.run()`。
- 已新增 `runTranslationJson()`，HTTP `/ai/translate` 已改为 `AgentService.run(profile: translation-json)` + JSON 投影。
- `SignalCollector` 已改为依赖 `AgentService.run(profile: signal-analysis)`，不再动态 import `AgentMessage`，不再调用 `AgentFactory.createChat()`。
- `signal-analysis` 的工具 action space 已由纯 `params.mode` 决定：`suggest` 无工具，`auto` 允许 `suggest_skills/create_skill`。
- 已新增 `runRelationDiscovery()`，HTTP `/recipes/discover-relations` 与 `ChatAgentTasks.taskDiscoverAllRelations()` 已改为 `AgentService.run(profile: relation-discovery)`。
- 已新增 `evolution-audit` profile 与 `runEvolutionAudit()`，CLI evolution 审计已改为 `AgentService.run(profile: evolution-audit)`，结果统计来自 `AgentRunResult.toolCalls`。
- 已删除旧 `evolveCheck()` 与 `discoverRelations()` 壳，relation/evolution 调用面已直接消费 `AgentService` helper。
- `bootstrap-dimension` profile 已改为 `bootstrapDimensionPipeline` stage factory，按纯 run params 生成 candidate/evolution/skill-only 三种维度管线。
- bootstrap orchestrator 维度执行已改为 `AgentService.run(profile: bootstrap-dimension)`，`allFiles` 通过 `context.fileCache` 注入，`SystemRunContext.scopeId` 显式贯穿到 `AgentRunInput.context`。
- bootstrap orchestrator 已移除维度内 `agentFactory.createRuntime()`、`runtime.setFileCache()`、`runtime.execute()`、`AgentMessage` 和直接 `PRESETS` stage 拼装。
- 已删除 `AgentFactory.ts`、DI 中的 `agentFactory` 注册、`ServiceMap.agentFactory`、`lib/agent/index.ts` 的 `AgentFactory` 导出，以及旧 `AgentFactory` 单测。
- `/ai/agent/task` 的 DAG tool 执行已改为直接调用 `ToolRouter`；remote/Lark 的 AI provider 信息已改为从 `aiProvider` 构造轻量 provider-info 对象。
- 已新增 `bootstrap-session` parent profile，声明 `concurrency.mode = tiered`、`partitioner = bootstrapSessionDimensions`、`childProfile = bootstrap-dimension`、`merge = bootstrapSessionResults`。
- `AgentRunCoordinator` 已内置 bootstrap session partition/merge：用纯 `params.dimensions[]` 拆分 child run，用 `context.childContexts[dimId]` 注入单维度运行时对象，按 tier 顺序、tier 内并发执行，并聚合 `AgentRunResult`。
- `AgentRunCoordinator` 已支持 `context.coordination` 运行时 hooks：`onChildResult` 在每个 child run 完成后触发，`onTierComplete` 在每个 tier 完成后触发。hooks 只存在于 run context，不进入 profile config，避免污染纯配置。
- 已新增 `buildBootstrapSessionRunInput()` 纯 helper：只接收已经准备好的 child `AgentRunInput` plans，组装 `bootstrap-session` parent input、`params.dimensions[]` 和 `context.childContexts`，不创建 `SystemRunContext`，不触碰 memory scope，不写业务状态。
- `AgentRunContext` 已新增 `childInputFactories`，`AgentRunCoordinator` 会在 child 即将执行前解析惰性 child input；这允许 parent input 阶段保持纯维度计划，不提前创建 `SystemRunContext` / memory scope。
- bootstrap orchestrator 的单维度执行已先完成低风险拆分：新增 `buildBootstrapDimensionRunInput()` 统一构造 `bootstrap-dimension` child `AgentRunInput`，新增 `projectBootstrapDimensionAgentOutput()` 统一解析 child `AgentRunResult` 为 analysis/producer 投影。
- bootstrap orchestrator 已抽出 `resolveBootstrapDimensionPlan()` 与 `createBootstrapDimensionRunInput()`：前者只解析维度配置、candidate/evolution 参数和 existing recipe 状态；后者才创建 `MemoryCoordinator` scope、`SystemRunContext`、`strategyContext` 与真实 child `AgentRunInput`。
- bootstrap orchestrator 已接入 `buildBootstrapDimensionChildPlan()`：parent `bootstrap-session` input 现在可由纯 child plans 组装，真实 child input 通过 `lazyInputFactory` 在 child 执行前创建；当前阶段只准备 parent input，不切换执行路径。
- bootstrap orchestrator 已把 parent hooks 接到同一套业务消费函数：`onChildResult` 复用 `projectBootstrapDimensionAgentOutput()` 与 `consumeBootstrapDimensionResult()`，`onTierComplete` 复用 tier reflection 消费逻辑。
- `AgentProfileCompiler` 已支持用纯 `params.concurrency` 覆盖 profile concurrency plan；`buildBootstrapSessionRunInput()` 已支持透传 parent params。这样 `bootstrap-session` 可以继承现有 `ALEMBIC_PARALLEL_BOOTSTRAP / ALEMBIC_PARALLEL_CONCURRENCY` 解析后的并发语义。
- `AgentRunExecutionOptions` 已新增 `shouldAbort`，`AgentRunCoordinator` 在 tier 前、child lazy input 前后检查 `abortSignal/shouldAbort`，恢复旧 `TierScheduler` 的 session validity 保护。
- `AgentRunCoordinator` 已将 child input factory / child run 抛错转换为单个 child `AgentRunResult(status: error)`，避免单维度失败炸掉整个 parent run；orchestrator 的 `onChildResult` 会把该错误写回维度统计和 progress。
- bootstrap orchestrator 的串并行路径已统一为一次 `AgentService.run(profile: bootstrap-session)`；串行模式通过 `params.concurrency = 1` 表达，不再保留外层 `TierScheduler.getTiers()` 手工执行分支。
- incremental skip 和 checkpoint restore 的维度统计已前置恢复：这些维度不会进入 parent child plan，但仍会写入 `dimensionStats/dimensionCandidates/SessionStore`，保证 report、skill 生成和快照语义不丢。
- 已抽出 `projectBootstrapSessionResult()` 纯投影：从 parent `AgentRunResult` 和 active/skipped 维度集合计算 `dimensionResults/completed/failed/aborted/missing/parentStatus`。
- `consumeBootstrapSessionResult()` 已改为消费 parent projection：缺失维度会补齐为 `missing child result` 错误并写入 `dimensionStats/candidateResults/progress`，日志只基于 projection 输出。
- `normalizeDimensionFindings()` 明确处理 artifact findings 中的字符串/结构化 finding 边界，避免 SessionStore 消费混合类型。
- 已新增 `consumeBootstrapDimensionResult()`，把 child projection 的业务消费集中到 orchestrator 业务层：候选统计、`dimensionCandidates`、SessionStore/DimensionContext、token 记录、progress event、qualityGate、checkpoint 都在该函数内完成。
- 已补充 `AgentProfileCompiler`、`AgentService`、`SystemRunContextFactory`、scan 投影、signal action space、evolution budget 与 bootstrap dynamic stages 相关单测。

仍未完成：

- parent projection 当前仍在 orchestrator 文件内；后续可按测试需求抽到独立 `BootstrapSessionProjection.ts` 并补纯函数单测。

### R0：冻结旧入口增长

目标：

1. 禁止新增 `AgentFactory` 领域方法。
2. 禁止新增外部 Agent workflow service。
3. 所有新 Agent 能力必须从 `AgentRunInput` 开始设计。

验收：

- 搜索不到新增的 `factory.createChat/createRuntime` 调用点。
- 新能力只有 `agentService.run()` 调用点。

### R1：建立 AgentProfileRegistry / Compiler

新增：

- `lib/agent/service/AgentProfileRegistry.ts`
- `lib/agent/service/AgentProfileCompiler.ts`
- `lib/agent/service/AgentRunCoordinator.ts`
- `lib/agent/service/AgentStageFactoryRegistry.ts`
- `lib/agent/service/SystemRunContextFactory.ts`

职责：

1. 注册内置 profiles。
2. 支持 profile 参数化 stage factory。
3. 编译 policies/strategy/skills/actionSpace。
4. 把 `buildSystemContext()` 从 `AgentFactory` 移出。
5. 区分纯 profile 配置、run params、run context。
6. 用命名 stage factory 替代闭包式 profile 配置。
7. 用 `AgentRunCoordinator` 承载通用 parent/child run 编排。

验收：

- `AgentRuntimeBuilder` 不再直接调用 `getPreset(profileRef, overrides)` 处理所有语义。
- profile 编译结果可被单测快照验证。
- profile definition JSON 化后不丢失语义，且不包含 function、Set、Map、service instance。

### R2：迁移 scanKnowledge

做法：

1. 新增 `scan-extract` 与 `scan-summarize` profile。
2. `buildScanPipelineStages()` 作为 profile stage factory 使用。
3. HTTP `/ai/summarize` 改为构造 `AgentRunInput`。
4. HTTP `/extract/path`、`/extract/text` 改为构造 `AgentRunInput`。
5. `AiScanService` 与 `ModuleService` 改为依赖 `AgentService`。
6. 删除 `AgentFactory.scanKnowledge()` 旧壳。
7. 新增 `projectScanRunResult()` 投影 helper，仅负责 DTO。

验收：

- `scanKnowledge` 字符串只允许出现在旧壳、迁移说明或测试历史中。
- `/ai/summarize` 不依赖 `agentFactory`。
- `/extract/*`、`AiScanService`、`ModuleService` 不依赖 `agentFactory.scanKnowledge`。
- `collect_scan_recipe` 仍通过 toolCalls 投影。

### R3：迁移 translate / SignalCollector

做法：

1. `translation-json` profile：single strategy、无工具或显式 `actionSpace: none`、1 iteration。
2. `/ai/translate` 改为 `agentService.run()` + JSON projection。
3. `signal-analysis` profile：后台分析 prompt，按模式决定工具 action space。
4. `SignalCollector` 依赖 `AgentService`，删除 `AgentFactoryLike.createChat`。

验收：

- `SignalCollector` 不再动态 import `AgentMessage`。
- `translateToEnglish()` 删除。

### R4：迁移 evolution / relation discovery

做法：

1. `evolution-audit` profile 接收 `existingRecipes/projectOverview/dimension` 作为 system run context extra fields。
2. `relation-discovery` profile 接收 batchSize，使用现有 `buildRelationsPipelineStages()`。
3. `/recipes/discover-relations` 改为 `AgentService.run(profile: relation-discovery)` 后再写入知识图谱。
4. 删除 `AgentFactory.evolveCheck()` 与 `AgentFactory.discoverRelations()`。
5. `ChatAgentTasks` 改为依赖 `AgentService` 或 task-level `AgentRunInputFactory`。

验收：

- evolution/relation 的 toolCalls 统计来自 `AgentRunResult.toolCalls`。
- 不再存在 domain task 调 `agentFactory.discoverRelations`。
- `/recipes/discover-relations` 不再直接消费 `AgentFactory`。

### R5：迁移 bootstrap dimension

做法：

1. orchestrator 保留业务调度：维度、checkpoint、incremental、candidate/skill 生成和业务写入。
2. 会话级运行可声明 `bootstrap-session` parent profile，但 parent 只负责拆分、并发和 merge，不负责写库。
3. 维度执行部分改成：
   - 构造 `SystemRunContext`
   - 构造 `AgentRunInput(profile: bootstrap-dimension)`
   - `agentService.run()`
4. `bootstrap-dimension` profile 支持动态 stages：
   - candidate 维度：Analyze -> Gate -> Produce -> RejectionGate
   - existing recipe 维度：Evolve -> EvolutionGate -> Analyze -> Gate -> Produce -> RejectionGate
   - skill-only 维度：Analyze
5. `runtime.setFileCache(allFiles)` 改为 `context.fileCache = allFiles`。
6. 每个维度必须是独立 child run，不共享同一个 `AgentRuntime`。
7. `MemoryCoordinator` 必须显式 scope 化，禁止依赖 current scope。
8. `PipelineStrategy` 必须把 `scopeId / dimensionScopeId` 注入 `reactLoop.context`。

验收：

- orchestrator 不再需要 `AgentFactoryLike.createRuntime`。
- 冷启动仍保留 checkpoint、incremental、trace、memory、dedup、progress。
- `SystemRunContext` 仍能展开为 `strategyContext`，quality gate 不降级。
- 并发维度的 diagnostics、toolCalls、tokenUsage 可独立归属。
- `MemoryCoordinator.buildDynamicMemoryPrompt()` 在并发维度下使用显式 `scopeId`。

R5.5 已完成的引擎层 parent-run 基座：

1. `bootstrap-session` profile 只声明 parent coordination，不构造 runtime。
2. parent 输入的 `params.dimensions[]` 必须是可序列化维度计划。
3. `context.childContexts` 仅承载每个 child run 的运行时对象，例如 `systemRunContext/contextWindow/trace/fileCache`。
4. `AgentRunCoordinator` 对 `bootstrap-session` 做 tiered 执行：按 `tier` 分组顺序推进，同 tier 内使用并发限制。
5. `context.coordination.onChildResult` 可在每个 child 完成后消费结果，让下一 tier 的 prompt 能看到上一 tier 的 SessionStore / DimensionContext 更新。
6. `context.coordination.onTierComplete` 可承接现有 tier reflection 逻辑。
7. `bootstrapSessionResults` 只合并 child `AgentRunResult`，不写库、不保存 checkpoint、不更新业务统计。

后续接入 orchestrator 的前置条件：

1. 已抽出 `buildBootstrapDimensionRunInput(dimId)`，只负责构造 child `AgentRunInput`。
2. 已抽出 `projectBootstrapDimensionAgentOutput(dimId, result)`，只负责从 child `AgentRunResult` 提取 analysis/producer 投影。
3. 已抽出 `consumeBootstrapDimensionResult(dimId, projection)`，只负责当前 orchestrator 内的业务副作用。
4. 已为 parent run 增加 `context.coordination` hooks，使业务消费可以停留在 orchestrator，同时保持 tier 间状态可见。
5. 已抽出 `buildBootstrapSessionRunInput()`，把 prepared child run plans 组装成 parent run input；该 helper 保持纯输入转换，不提前创建 runtime context。
6. 已在 `AgentRunCoordinator` 支持 `context.childInputFactories[dimId]`，用于 child 执行前惰性创建真实 child `AgentRunInput`。
7. 已把 orchestrator 中实际创建 child `SystemRunContext` / memory scope 的逻辑接到 `childInputFactories`：parent input 只生成维度计划，child 执行前才创建运行时上下文。
8. 已把 parent `onChildResult / onTierComplete` hooks 接到现有 projection 与业务消费函数，parent path 可以复用同一套维度消费、tier reflection 和统计更新逻辑。
9. 已支持通过 `params.concurrency` 覆盖 profile concurrency plan，保证后续 parent path 能继承现有 bootstrap 并发配置。
10. 已为 parent coordinator 补齐 `abortSignal/shouldAbort` 检查，session validity 可以作为 run execution 控制注入。
11. 已将 bootstrap 串并行路径统一为一次 `AgentService.run(profile: bootstrap-session)`，由 hooks 逐维消费 child result；串行通过 `params.concurrency = 1` 表达。
12. 已把 incremental skip / checkpoint restore 的维度统计前置恢复，保证被 parent child plan 过滤的维度仍参与 report、skill 生成和快照统计。
13. 已抽出 parent merge 后的 `projectBootstrapSessionResult()` 纯投影，并强化 `consumeBootstrapSessionResult()`：识别 failed/aborted/missing dimensions，记录 parent status warning，缺失维度会补齐为错误统计。
14. `AgentRunCoordinator` 会把中止 child 折叠为 `AgentRunResult(status: aborted)`，避免 parent projection 丢失维度覆盖。
15. 待按测试/复用需求把 parent projection helper 从 orchestrator 抽到独立文件。

### R6：删除 AgentFactory 执行职责

已完成：

1. 删除 `createRuntime/createChat/createInsight/createLark/createRemoteExec`。
2. 删除 `createRouter()` 以及旧 `AgentRouter -> AgentFactory.createRuntime() -> runtime.execute()` 链路。
3. 删除 `AgentFactory.scanKnowledge()` 与 `AgentFactory.discoverRelations()` 过渡壳。
4. 删除 `AgentFactory.ts`、DI 注册、类型映射、统一出口导出和旧单测。
5. `/ai/agent/task` 直接通过 `ToolRouter` 执行 DAG 任务所需工具，不再借用 Factory。
6. remote/Lark 只依赖 `AgentService` 和轻量 `aiProviderInfo`，不再获取 `agentFactory`。
7. `AgentRuntimeBuilder` 成为业务运行路径中唯一 runtime 构造路径。

验收搜索：

```bash
rg "AgentFactory|agentFactory|createRuntime\\(|createChat\\(|createInsight\\(|createLark\\(|createRemoteExec\\(|createRouter\\(" lib bin test
rg "runtime\\.execute\\(|AgentMessage\\.internal|setFileCache\\(" lib test
```

允许剩余：

- `AgentRuntimeBuilder` 内部创建 `new AgentRuntime`。
- `AgentService` 内部调用 `runtime.execute`。
- strategy 内部构造子消息的实现细节。
- Runtime/strategy 单元测试。

## 11. 目标调用链

所有 surface 和 workflow 统一为：

```text
HTTP / Lark / MCP / Bootstrap / Background Task
  -> build AgentRunInput
  -> AgentService.run(input)
  -> AgentProfileCompiler.compile(profile)
  -> if profile has concurrency plan:
       AgentRunCoordinator builds isolated child AgentRunInput[]
       AgentService.run(childInput) with p-limit / tier scheduler
       merge child AgentRunResult[]
     else:
       AgentRuntimeBuilder.build(compiledProfile)
       AgentRuntime.execute(message, runtimeOptions)
       Strategy.execute(runtime, message, opts)
       runtime.reactLoop(...)
  -> ToolRouter.execute(...)
  -> AgentRunResult
  -> surface/task projection
```

其中只有 `AgentService` 可以调用 `runtime.execute()`；通用 parent/child 编排只能通过 `AgentService.run(childInput)` 递归进入，不允许复用父 runtime 并发执行 child。

## 12. 非目标

本轮重构不做：

1. 不重写 `AgentRuntime.reactLoop()` 主循环。
2. 不改变工具 handler 业务语义。
3. 不改变 `ToolRouter` envelope 结构。
4. 不把 bootstrap checkpoint、candidate 写入、skill 生成等业务调度塞进 `AgentService`。
5. 不为 scan/bootstrap/evolution 新建独立 Agent service。
6. 不把 `FanOutStrategy` 作为生产级并发隔离方案；它可保留给测试或轻量实验，但复杂并发要走 child run。

## 13. 风险与保护

| 风险 | 保护措施 |
| --- | --- |
| bootstrap quality gate 降级 | `SystemRunContext` 必须保留 `activeContext/trace` 同 scope |
| scan summarize DTO 变化 | projection helper 单测覆盖旧 API 语义 |
| 工具白名单变化 | profile 编译结果快照测试 `toolIds` |
| Lark/remote 安全边界变化 | remote-exec profile 保留 `SafetyPolicy` |
| SignalCollector 后台误调用写工具 | `signal-analysis` profile 默认 `actionSpace: none/listed` |
| fileCache 丢失导致性能回退 | scan/bootstrap run input 必须显式传 `context.fileCache` |
| 并发维度状态串扰 | parent run 只调度，child run 独立 runtime/contextWindow/tracker/trace |
| source 语义混乱 | 区分 surface `source` 与 runtime `runtimeSource` |
| profile 污染运行期对象 | profile 必须可序列化，运行期对象只允许在 run context |
| memory scope 串扰 | `dimensionScopeId` 从 `SystemRunContext.scopeId` 显式贯穿到 `reactLoop.context` 与工具上下文 |
| parent run 侵入业务 | `AgentRunCoordinator` 只做 child run 编排，业务写入仍在 workflow projection |

## 14. 最终判定

当前 AgentRuntime 的正交组合设计已经成立，但代码入口、配置编译和运行期数据边界没有统一。

正确实现路线是：

1. 保留一个 `AgentRuntime` 类型作为单次 run 的执行内核。
2. 保留一个 `AgentService.run()`。
3. 用可序列化 profile 表达所有 Agent 能力的服务语义和默认配置。
4. 用 `params` 表达本次任务参数。
5. 用 `SystemRunContext` 表达冷启动、扫描、进化等系统任务上下文。
6. 复杂并发任务通过 parent run 生成多个隔离 child run，不共享一个 runtime。
7. 用 projection helper 处理 API/任务结果形状和业务副作用。
8. 删除 `AgentFactory` 的执行型领域方法。

这样 `scanKnowledge` 会被真正收敛进统一调用方案，而不是被搬到另一个服务外壳中；bootstrap 也会从“手工 createRuntime 的复杂链路”收敛为“统一入口 + child run 隔离 + parent projection”的工程编排模型。
