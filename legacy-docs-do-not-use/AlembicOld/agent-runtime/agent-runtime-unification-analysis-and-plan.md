# AgentRuntime 统一化破坏性重构方案

## 1. 背景与目标

当前工具系统已经开始向 `CapabilityCatalog` + `ToolRouter` + `GovernanceEngine` 收敛，但在继续处理工具能力之前，必须先明确 **Agent 能力本身的服务性质和边界**。

本阶段目标不是继续扩展 tool adapter，而是先统一 Agent 服务模型：

- Agent 能力统一为 `AgentRuntime` 执行内核，而不是多个历史 Agent 子类、任务函数、HTTP 特例和临时投影的集合。
- Agent 服务入口、任务编排入口、工具执行入口、应用服务入口必须分层清晰。
- Agent 的配置能力、运行时上下文、策略编排、工具动作空间要有唯一语义来源。
- 工程上要能稳定承载 chat、insight、bootstrap、scan、lark、remote-exec 等业务形态，而不是每个入口临时拼装一套执行链。

这份文档聚焦 AgentRuntime 统一化。工具能力后续处理应在这里定义的 Agent 服务边界之下继续推进。

## 1.1 破坏性重构原则

本方案不以兼容旧入口为目标。所有保留的接口都必须服务于统一 AgentRuntime 语义；所有含混入口、临时投影、双重返回结构和僵尸抽象都应删除或迁移。

原则：

- **唯一执行内核**：所有 Agent 服务能力最终只能通过 `AgentRuntime` 执行。
- **唯一 Agent 服务入口**：对 surface 暴露统一 `AgentService.run(input)`，surface 不直接构造 Runtime。
- **唯一配置语义**：Agent 的 profile、skill、strategy、policy、memory、action space 由 `AgentProfile` 表达，不再散落在 `RuntimeOverrides`、`message.metadata.mode`、Factory 胖方法和 route 分支里。
- **唯一动作语义**：工具调用是 AgentRuntime 的 Action Layer，只能通过 `ToolRouter` 执行；Tool capability 不再与 Agent 服务能力混称。
- **唯一结果语义**：Agent run 返回 `AgentRunResult`；工具调用返回 `ToolResultEnvelope`；应用服务可以有 DTO，但 DTO 必须由 presenter 明确投影，不能作为 Runtime 主结果。
- **删除优先于兼容**：如果旧入口表达的是旧边界、旧返回结构或旧命名，直接删除或替换调用方，不增加 shim。

## 2. 现状结论

### 2.1 已经统一的部分

当前主线已经具备统一 Runtime 的基础：

- `AgentRuntime` 是唯一实际执行引擎，负责 `execute()`、`reactLoop()`、LLM 调用、工具调用循环、memory/context/diagnostics、事件和策略委托。
- `AgentFactory.createRuntime()` 是主要 Runtime 构造入口，所有 preset 最终都会落到 `new AgentRuntime(...)`。
- `presets.ts` 已将 Agent 形态抽象为配置组合：capabilities、strategy、policies、persona、memory。
- `Strategy` 层基本清晰：`SingleStrategy`、`PipelineStrategy`、`FanOutStrategy`、`AdaptiveStrategy` 都通过 `runtime.reactLoop()` 编排执行。
- Runtime 内部工具调用已经统一进入 `ToolRouter.execute()`，不再通过 Registry 旧执行入口。

这说明「旧 Agent 子类」已经基本消失，真正的问题不再是有多个 Runtime，而是 **围绕 Runtime 的服务入口、配置契约、任务接口和输出投影还没有统一建模**。

### 2.2 仍然分裂的部分

当前 Agent 能力入口仍有多种形态：

- HTTP chat / stream：`createChat()` + `runtime.execute()`，属于 Agent 服务入口。
- Lark：`IntentClassifier` + `createLark()` / `createRemoteExec()`，属于渠道 Agent 服务入口。
- MCP bootstrap orchestrator：直接 `createRuntime('insight', { strategy: pipeline })` 并手写 `strategyContext`，属于系统 Agent 编排入口。
- `AgentFactory.scanKnowledge()`、`discoverRelations()`、`evolveCheck()`、`translateToEnglish()`：Factory 内部的应用服务式 Agent 管线。
- `/agent/task`：混合 DAG task 和 tool fallback，同一个 HTTP 路径存在两种业务语义。
- `ChatAgentTasks`：在工具之上做过程编排和 envelope 投影，属于任务兼容入口。
- `/agent/tool`、Dashboard command、MCP tools/call：工具执行入口，不是 Agent 服务入口。

这些入口都可以工作，但服务性质不一致，导致「Agent 能力」和「工具能力」、「应用服务」和「任务兼容」边界混在一起。

## 3. 核心术语重定义

当前代码中 `Capability` 一词有两层含义，必须拆开。

### 3.1 Agent Profile

Agent Profile 是一次 Agent 服务运行的行为配置。

来源：

- `presets.ts`
- `RuntimeOverrides`
- 新增显式 `AgentProfile` 类型后，`RuntimeOverrides` 不再作为跨层输入契约

包含：

- profile id / preset name
- Agent skills
- strategy
- policies
- persona
- memory settings
- allowed action space 约束

Profile 回答的问题是：**这次 Agent 以什么身份、用什么策略、带什么能力和约束运行**。

### 3.2 Agent Skill

Agent Skill 对应当前 `lib/agent/capabilities.ts` 中的 `Capability` 类。

它不是工具 manifest，而是 Agent 运行时的行为模块：

- 提供 prompt fragment
- 声明可见 tool id 白名单
- 提供 `buildContext()`
- 提供 `onBeforeStep()` / `onAfterStep()` hook

最终命名必须从 `Capability` 迁移为 `AgentSkill`，避免和 Tool capability 混淆。

### 3.3 Tool Capability

Tool Capability 对应 `ToolCapabilityManifest`。

它描述具体动作：

- tool id
- input schema
- surface
- risk
- execution adapter
- governance
- trust
- artifact behavior

Tool capability 回答的问题是：**某个具体动作是否可见、是否可执行、如何执行、如何治理**。

### 3.4 Agent Runtime Context

Agent Runtime Context 是一次 run 的运行时上下文：

- message / history / metadata
- abort / timeout / budget
- diagnostics
- system run context
- memory coordinator
- active trace
- context window
- shared state
- strategy context

它是编排输入，不是工具能力。

## 4. 服务性质判定

### 4.1 AgentRuntime 的服务性质

`AgentRuntime` 应被定义为 **Agent 服务执行内核**。

它不应该是：

- HTTP controller
- 工具注册器
- 领域应用服务
- 任务路由器
- 任意 service locator

它应该负责：

- 执行一个明确的 Agent run
- 委托 strategy 编排 react loop
- 管理 LLM/tool/memory/context/diagnostics 生命周期
- 将 tool calls 统一交给 `ToolRouter`
- 将结果产出为统一 `AgentResult`

### 4.2 AgentFactory 的服务性质

`AgentFactory` 当前承担两类职责：

- 正当职责：基于 Profile/Preset 构造 `AgentRuntime`
- 混杂职责：`scanKnowledge()`、`discoverRelations()`、`evolveCheck()`、`translateToEnglish()`、`invokeToolEnvelope()`

收敛后，`AgentFactory` 应退回 **Runtime 工厂 / Profile 装配器**：

- `createRuntime()` 迁移为 `AgentRuntimeBuilder.build()`
- `createChat()` / `createInsight()` / `createLark()` / `createRemoteExec()` 不进入最终架构
- 应迁出领域过程型方法到独立应用服务或 Agent workflow facade
- `invokeToolEnvelope()` 不属于 AgentFactory，迁到 system tool execution service 或由调用方直接依赖 `ToolRouter`

### 4.3 AgentRouter 的服务性质

`AgentRouter` 名义上是 intent -> preset -> runtime 的路由器，但当前主线入口并没有统一接入它：

- HTTP chat 直接 `createChat()`
- Lark 使用 `IntentClassifier`
- MCP orchestrator 直接 `createRuntime('insight')`

因此 `AgentRouter` 当前属于 **未统一接入的 Agent preset router**。

最终删除 `AgentRouter` 的主链路职责。若未来需要自动 intent routing，应以 `AgentProfileSelector` 形式接入 `AgentService`，只输出 `AgentProfileRef`，不执行 Runtime。

### 4.4 Strategy 的服务性质

Strategy 是 **Agent run 内部的工程编排模型**。

它不应该知道 HTTP/MCP/Dashboard，也不应该直接执行工具。它只决定：

- 调用几次 `runtime.reactLoop()`
- 如何构造阶段 prompt
- 如何传递 `strategyContext`
- 如何处理 gate / retry / fan-out
- 如何聚合阶段结果

Strategy 是 AgentRuntime 内部编排层，不是对外服务入口。

### 4.5 ChatAgentTasks 的服务性质

`ChatAgentTasks` 当前是历史任务兼容层：

- 不是 Runtime
- 不是 Tool
- 不是 Strategy
- 是一组过程式 DAG helper
- 通过 `invokeToolEnvelope()` 调工具，再把 envelope 投影为普通对象

最终收敛方向：

- 删除 `ChatAgentTasks` 作为兼容任务库的定位
- 每个 task 必须建模为 workflow capability 或 application workflow service
- `/agent/task` 不再和 tool fallback 共用同一个接口语义

## 5. 当前入口分类

| 入口 | 当前链路 | 性质判定 | 最终处理 |
| --- | --- | --- | --- |
| HTTP `/ai/chat` | `createChat()` -> `runtime.execute()` | Agent 服务入口 | 保留，改为统一 `AgentService.run()` |
| HTTP `/ai/chat/stream` | `createChat()` -> stream response | Agent 服务入口 | 与普通 chat 共享 run contract，stream 只做 presentation |
| Lark message | `IntentClassifier` -> `createLark()` / `createRemoteExec()` | 渠道 Agent 服务入口 | preset 选择策略需要与 HTTP/AgentRouter 统一 |
| MCP bootstrap orchestrator | `createRuntime('insight', pipeline)` | 系统 Agent 编排入口 | 使用标准 `SystemRunContext` / `AgentRunInput` |
| `AgentFactory.scanKnowledge()` | Factory 内部构造 pipeline | 应用服务式 Agent 管线 | 迁出 Factory，输出结构版本化 |
| `AgentFactory.discoverRelations()` | Factory 内部构造 Runtime | 应用服务式 Agent 管线 | 迁出 Factory，与 HTTP relation API 合并语义 |
| `AgentFactory.evolveCheck()` | Factory 内部构造 Runtime | 应用服务式 Agent 管线 | 迁出 Factory |
| `AgentFactory.translateToEnglish()` | createChat + prompt | 应用服务 | 迁出 Factory |
| HTTP `/agent/tool` | `ToolRouter.execute()` | 工具入口 | 不属于 Agent 服务入口 |
| HTTP `/agent/task` DAG | `ChatAgentTasks` | 任务兼容入口 | 拆分为 workflow/application service，不与 tool fallback 共用 |
| HTTP `/agent/task` fallback | `ToolRouter.execute()` | 工具入口 | 删除，工具入口只保留 `/agent/tool` |
| Dashboard command | `DashboardOperationAdapter` | 工具/运维动作入口 | 保持 Tool surface |
| MCP `tools/call` | MCP ToolRouter + adapter | 工具入口 | 保持 Tool surface，后续统一 catalog/provenance |

## 6. 统一 AgentRuntime 服务模型

最终引入明确的 `AgentService` 概念。它不是新的执行引擎，而是对 `AgentRuntimeBuilder + AgentRuntime + Profile` 的服务边界封装。

### 6.1 目标接口

```ts
interface AgentRunInput {
  profile: AgentProfileRef | AgentProfileOverride;
  message: AgentRunMessage;
  context?: AgentRunContext;
  execution?: AgentRunExecutionOptions;
  presentation?: AgentRunPresentationOptions;
}

interface AgentService {
  run(input: AgentRunInput): Promise<AgentResult>;
}
```

### 6.2 Profile

```ts
interface AgentProfileRef {
  preset: 'chat' | 'insight' | 'evolution' | 'lark' | 'remote-exec';
}

interface AgentProfileOverride {
  basePreset: string;
  skills?: string[];
  strategy?: StrategyDeclaration;
  policies?: PolicyDeclaration[];
  persona?: Record<string, unknown>;
  memory?: AgentMemoryOptions;
}
```

Profile 是构造期输入，不应混入 HTTP request、MCP session、Dashboard route 等 surface 状态。

### 6.3 Run Message

```ts
interface AgentRunMessage {
  content: string;
  role?: 'user' | 'system' | 'internal';
  history?: AgentMessage[];
  metadata?: Record<string, unknown>;
}
```

后续应减少 `metadata.mode` 这类隐式 preset 选择字段，改为显式 `profile`。

### 6.4 Run Context

```ts
interface AgentRunContext {
  source: 'user' | 'system' | 'lark' | 'bootstrap' | 'http' | 'mcp';
  actor?: {
    role?: string;
    user?: string;
    sessionId?: string;
  };
  systemRunContext?: SystemRunContext;
  strategyContext?: Record<string, unknown>;
  memoryCoordinator?: unknown;
  contextWindow?: unknown;
  trace?: unknown;
  sharedState?: Record<string, unknown>;
}
```

Run context 是 Agent 编排上下文，不是 handler context，也不是 tool context。

### 6.5 Execution Options

```ts
interface AgentRunExecutionOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  budgetOverride?: Record<string, unknown>;
  toolChoiceOverride?: 'auto' | 'required' | 'none';
  diagnostics?: DiagnosticsCollector;
}
```

### 6.6 Presentation Options

```ts
interface AgentRunPresentationOptions {
  stream?: boolean;
  responseShape?: 'agent-result' | 'chat-reply' | 'system-task-result';
}
```

Presentation 只影响 HTTP/SSE/API 返回格式，不应反向污染 Runtime 内部结果。

## 7. 统一后的分层

### 7.1 Surface Layer

包括：

- HTTP routes
- Lark transport
- MCP command entry
- Dashboard HTTP routes

职责：

- 协议解析
- actor/session/source 解析
- 将请求转换为 `AgentRunInput` 或 `ToolCallRequest`
- 将统一结果映射为协议响应

禁止：

- 直接拼 Runtime 内部 context
- 直接调用领域 tool handler
- 自己做 Agent 策略编排

### 7.2 Agent Service Layer

新增或明确：

- `AgentService.run()`
- `AgentProfileRegistry`
- `AgentRunInput` / `AgentRunContext`
- `AgentResultPresenter`

职责：

- 解析 profile
- 构造 Runtime
- 调用 `runtime.execute()`
- 统一 diagnostics / result envelope
- 管理应用服务式 Agent pipeline

### 7.3 Runtime Layer

包括：

- `AgentRuntime`
- `LoopContext`
- `MessageAdapter`
- `SystemPromptBuilder`
- `Strategy`
- `MemoryCoordinator`
- `DiagnosticsCollector`

职责：

- 实际执行 Agent run
- LLM loop
- tool loop
- strategy 内部编排
- memory/context/diagnostics

禁止：

- 暴露为 HTTP controller
- 直接承担领域应用 API
- 依赖任意 surface 状态

### 7.4 Tool Action Layer

包括：

- `CapabilityCatalog`
- `ToolRouter`
- `GovernanceEngine`
- adapters
- tool manifests

职责：

- 执行动作
- 治理动作
- 产出 `ToolResultEnvelope`

注意：Tool Action Layer 是 Agent 的动作空间，不是 Agent 服务本身。

## 8. 需要清理的不明确临时逻辑

### 8.1 `AgentFactory` 胖方法

需要迁出：

- `scanKnowledge()`
- `discoverRelations()`
- `evolveCheck()`
- `translateToEnglish()`

迁入：

- `KnowledgeAgentService`
- `RelationAgentService`
- `EvolutionAgentService`
- 或统一 `AgentApplicationWorkflows`

迁移原则：

- 这些服务内部可以继续使用 `AgentService.run()`
- 不再让 Factory 同时承担领域流程和 Runtime 构造

### 8.2 `/agent/task` 双语义

当前同一路径既执行 DAG task，又 fallback 到 tool id。

拆分：

- `/agent/tool`：只执行 tool capability
- `/agent/workflow` 或 `/agent/task`：只执行注册过的 Agent task/workflow
- 旧 fallback 删除，不做兼容

### 8.3 `ChatAgentTasks` envelope 投影

当前 task 调工具后丢弃 envelope 外壳。

强制要求：

- task 内部可以读取 `structuredContent`
- task 输出应保留 `toolResults` 或 `diagnostics`
- 不应静默丢弃 blocked/timeout/trust/artifact 等治理信息

### 8.4 `scanKnowledge` 输出分叉

当前 summarize 分支返回扁平字段，extract 分支返回 recipes 列表，属于旧 API 兼容投影。

定义 `ScanKnowledgeResultV2`：

```ts
interface ScanKnowledgeResultV2 {
  task: 'extract' | 'summarize';
  targetName: string;
  recipes: unknown[];
  extracted: number;
  summaryView?: {
    title: string;
    summary: string;
    usageGuide: string;
    category: string;
    headers: unknown[];
    tags: unknown[];
    trigger: string;
  };
  diagnostics?: unknown;
}
```

扁平字段只能是 presenter 视图，不应作为主结果结构。

### 8.5 `AgentRouter` 未接入

最终删除 `AgentRouter` 的主链路职责，并更新架构文档。自动选择 profile 的能力只能以 `AgentProfileSelector` 形式存在，且不能执行 Runtime。

### 8.6 Agent capability 空 tools 语义

当前某些 Agent Capability `tools=[]` 可能意味着无限制注入 tool schemas。这个语义风险高且不直观。

强制要求：

- 用显式字段表达 unrestricted action space
- `tools=[]` 只表示不注入工具
- 如需要全量工具，必须在 Profile 中写明 `actionSpace: 'all'` 或类似字段

## 9. 收敛实施阶段

### A0: 文档与术语冻结

目标：

- 固定 Agent Profile / Agent Skill / Tool Capability / Agent Run / Tool Call 术语。
- 更新 `lib/agent/index.ts` 架构注释，纠正 AgentRouter 和 insight fan-out 的不准确描述。

验收：

- 文档中不再混用 Agent Capability 和 Tool Capability。
- 新代码必须按术语命名。

### A1: AgentRunInput 契约

目标：

- 在 `AgentRuntimeTypes.ts` 或新文件中定义 `AgentRunInput`、`AgentProfileRef`、`AgentRunContext`。
- 将 HTTP chat、Lark、MCP orchestrator 的输入映射到同一 run contract。

验收：

- surface 入口只构造 `AgentRunInput`，不直接拼 Runtime 内部字段。

### A2: AgentService

目标：

- 新增 `AgentService` 作为 Runtime 构造和执行 facade。
- `AgentFactory` 降级为 profile/runtime builder，或由 `AgentService` 内部持有。

验收：

- `createRuntime()` 仍可存在，但主要入口改为 `agentService.run(input)`。
- HTTP chat / Lark 至少两个入口共用同一个 AgentService。

### A3: 迁出 AgentFactory 领域方法

目标：

- 将 `scanKnowledge()`、`discoverRelations()`、`evolveCheck()`、`translateToEnglish()` 从 Factory 迁出。
- 新服务内部统一调用 `AgentService.run()`。

验收：

- `AgentFactory` 不再包含领域业务流程。
- 应用服务输出结构版本化。

### A4: 任务与工作流入口统一

目标：

- 拆分 `/agent/task` 双语义。
- 将 `ChatAgentTasks` 转为注册式 workflow 或 application workflow service。

验收：

- task 入口不再 fallback 到 arbitrary tool id。
- task 输出保留 envelope/diagnostics/trust 信息。

### A5: AgentRouter 决策

目标：

- 删除 `AgentRouter` 的主链路职责。
- 将自动 profile selection 重建为 `AgentProfileSelector`。
- `AgentProfileSelector` 只能返回 `AgentProfileRef`，不能执行 Runtime。
- 更新架构图和入口文档。

验收：

- 不再存在「架构主链路声明使用 AgentRouter，但实际入口不用」的状态。

### A6: Action Space 显式化

目标：

- 将 Agent Skill 的 `tools=[]` 隐式全量语义改为显式 action space。
- Profile 层统一描述可见工具集合。

验收：

- 空工具列表不再隐式代表全 catalog。
- Runtime tool schema 注入数量可解释、可观测。

## 10. 与工具系统后续处理的关系

工具系统后续 P7/P8/P9 不应反向决定 Agent 服务边界。

正确依赖方向：

1. Surface 将请求转换成 `AgentRunInput` 或 `ToolCallRequest`。
2. AgentService 执行 Agent run。
3. AgentRuntime 在需要动作时调用 ToolRouter。
4. ToolRouter 根据 manifest/governance/adapter 执行动作。

因此：

- Agent Profile 决定动作空间上限。
- Tool Capability 决定单个动作能否执行。
- GovernanceEngine 不负责选择 Agent Profile。
- AgentRouter 不负责执行工具。
- AgentFactory 不负责领域应用流程。

## 11. 设计结论

统一 AgentRuntime 的核心结论：

1. `AgentService.run()` 是所有 Agent 服务入口的唯一 facade。
2. `AgentRuntime` 是唯一执行内核，但不再直接暴露给 surface。
3. `AgentProfile` 是唯一配置语义，替代 `RuntimeOverrides` 的跨层传递。
4. `AgentSkill` 是 Agent 行为模块，`ToolCapabilityManifest` 是工具动作 manifest，两者命名和职责必须分离。
5. `ToolRouter` 是 Action Layer，不是 Agent 服务入口。
6. `AgentFactory` 迁移为 Runtime builder，不再承载应用流程。
7. `AgentRouter` 从主链路删除；自动 profile 选择必须作为 `AgentProfileSelector` 接入 `AgentService`。
8. 应用工作流通过 workflow service 调用 `AgentService.run()`，不能继续塞进 Factory 或 `/agent/task` 兼容入口。

## 12. 最终目标架构

### 12.1 分层结构

统一后的 Agent 系统固定为四层：

```text
Surface Layer
  HTTP / Lark / MCP / CLI / Dashboard
  只做协议解析、身份解析、响应投影
        |
        v
Agent Service Layer
  AgentService.run(input)
  AgentProfileRegistry
  AgentRunPresenter
  AgentApplicationWorkflows
        |
        v
Runtime Layer
  AgentRuntime
  Strategy
  AgentSkill
  PolicyEngine
  Memory / Context / Diagnostics
        |
        v
Action Layer
  ToolRouter
  CapabilityCatalog
  GovernanceEngine
  Adapters
```

边界约束：

- Surface Layer 不能 `new AgentRuntime`，不能调用 `AgentFactory.createRuntime()`，不能拼 `ReactLoopOpts`。
- Agent Service Layer 可以构造 Runtime，但不能执行 tool handler，不能读取 HTTP/MCP/Dashboard 细节。
- Runtime Layer 不能知道 HTTP route、Lark event、MCP session、Dashboard response。
- Action Layer 只执行工具动作，不选择 Agent profile，不编排 Agent run。

### 12.2 核心对象关系

最终对象关系：

```text
AgentRunInput
  -> AgentService
    -> AgentProfileRegistry.resolve()
    -> AgentRuntimeBuilder.build(profile)
      -> AgentRuntime.execute(AgentMessage, AgentRuntimeRunOptions)
        -> Strategy.execute()
          -> AgentRuntime.reactLoop()
            -> ToolRouter.execute()
```

其中：

- `AgentRunInput` 是所有 Agent surface 的唯一输入契约。
- `AgentProfile` 是 Runtime 构造语义，不包含 surface 请求对象。
- `AgentRuntimeRunOptions` 是 Runtime 内部执行选项，只由 Agent Service 构造。
- `ReactLoopOpts` 不再作为 surface 可见接口，只保留给 Strategy / Runtime 内部。
- `ToolCallRequest` 只在 Action Layer 使用，不作为 Agent 服务入口。

## 13. 最终接口设计

### 13.1 `AgentRunInput`

`AgentRunInput` 是 Agent 服务唯一入口参数。

```ts
export interface AgentRunInput {
  profile: AgentProfileRef | AgentProfileOverride;
  message: AgentRunMessage;
  context: AgentRunContext;
  execution?: AgentRunExecutionOptions;
  presentation?: AgentRunPresentationOptions;
}
```

强约束：

- `profile` 必填，不允许通过 `message.metadata.mode` 隐式选择 preset。
- `context.source` 必填，用于区分 `http-chat`、`lark`、`bootstrap`、`system-workflow` 等运行来源。
- surface 只能构造 `AgentRunInput`，不能传 `RuntimeOverrides`。

### 13.2 `AgentProfile`

`AgentProfile` 是 AgentRuntime 的构造配置。

```ts
export interface AgentProfile {
  id: string;
  title: string;
  lifecycle: 'active' | 'experimental' | 'deprecated';
  skills: AgentSkillRef[];
  strategy: StrategyDeclaration;
  policies: PolicyDeclaration[];
  persona?: AgentPersona;
  memory?: AgentMemoryProfile;
  actionSpace: AgentActionSpace;
}
```

`actionSpace` 必须显式表达：

```ts
export type AgentActionSpace =
  | { mode: 'none' }
  | { mode: 'listed'; toolIds: string[] }
  | { mode: 'all'; reason: string };
```

破坏性变更：

- Agent Skill 的 `tools=[]` 不再表示全量工具。
- `additionalTools` 不再作为 RuntimeConfig 的开放扩展字段。
- 临时工具扩展必须进入 `AgentProfile.actionSpace` 或 workflow manifest。

### 13.3 `AgentRunResult`

`AgentRunResult` 是 Agent 服务唯一输出。

```ts
export interface AgentRunResult {
  runId: string;
  profileId: string;
  reply: string;
  status: 'success' | 'blocked' | 'aborted' | 'timeout' | 'error';
  phases?: Record<string, AgentPhaseResult>;
  toolCalls: ToolCallEntry[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    iterations: number;
    durationMs: number;
  };
  diagnostics: AgentDiagnostics;
}
```

破坏性变更：

- 不再让 `AgentResult` 通过 `[key: string]: unknown` 承载任意业务字段。
- scan、summarize、relation、evolution 等业务 DTO 由应用服务 presenter 从 `AgentRunResult` 明确投影。
- HTTP/SSE/Lark 可以有 presentation shape，但不能改变 Runtime 主结果结构。

### 13.4 `AgentService`

```ts
export interface AgentService {
  run(input: AgentRunInput): Promise<AgentRunResult>;
}
```

职责：

- 校验 `AgentRunInput`。
- 解析 `AgentProfile`。
- 构造 `AgentRuntime`。
- 将 `AgentRunContext` 投影为 Runtime run options。
- 调用 `runtime.execute()`。
- 将 `AgentResult` 归一化为 `AgentRunResult`。

禁止：

- 执行工具 handler。
- 做 HTTP response mapping。
- 包含 scan/relation/evolution 业务流程。

### 13.5 `AgentRuntimeBuilder`

替代当前 `AgentFactory.createRuntime()` 的核心职责。

```ts
export interface AgentRuntimeBuilder {
  build(profile: AgentProfile, options: AgentRuntimeBuildOptions): AgentRuntime;
}
```

职责：

- 将 `AgentProfile` 编译为 `RuntimeConfig`。
- 实例化 Agent skills。
- 实例化 Strategy。
- 实例化 PolicyEngine。
- 注入 ToolRouter、CapabilityCatalog、Memory 等运行依赖。

破坏性变更：

- `AgentFactory` 不再作为业务应用服务。
- `AgentFactory.createChat()` / `createInsight()` / `createLark()` / `createRemoteExec()` 最终删除；surface 使用 `AgentService.run()`。

## 14. 删除与迁移清单

### 14.1 必删旧结构

这些结构不进入最终架构：

- `AgentFactory.scanKnowledge()`
- `AgentFactory.discoverRelations()`
- `AgentFactory.evolveCheck()`
- `AgentFactory.translateToEnglish()`
- `AgentFactory.invokeToolEnvelope()`
- `AgentFactory.createRouter()`
- `AgentFactory.createChat()` / `createInsight()` / `createLark()` / `createRemoteExec()` surface 调用路径
- `AgentRouter` 作为主链路中的隐式 intent router
- `message.metadata.mode` 作为 preset 选择方式
- `/agent/task` 同时支持 DAG task 和 arbitrary tool fallback
- `ChatAgentTasks` 丢弃 envelope 的投影模型
- `AgentResult` 任意扩展字段承载业务 DTO
- Agent Skill `tools=[]` 隐式代表全量工具
- `RuntimeOverrides` 的开放 `[key: string]: unknown` 作为跨层输入契约

### 14.2 迁移后的归属

| 当前结构 | 新归属 | 说明 |
| --- | --- | --- |
| `AgentFactory.createRuntime()` | `AgentRuntimeBuilder.build()` | 只做 Runtime 构造 |
| `presets.ts` | `AgentProfileRegistry` | preset 升级为 profile |
| `capabilities.ts` `Capability` | `AgentSkill` | 命名迁移，职责保留 |
| `scanKnowledge()` | `KnowledgeAgentWorkflowService` | 应用工作流，调用 `AgentService.run()` |
| `discoverRelations()` | `RelationAgentWorkflowService` | 应用工作流，输出版本化 DTO |
| `evolveCheck()` | `EvolutionAgentWorkflowService` | 应用工作流 |
| `translateToEnglish()` | `TranslationAgentWorkflowService` 或普通 AI app service | 不属于 Factory |
| `ChatAgentTasks` | `AgentApplicationWorkflows` 或 workflow capability | 不再作为兼容任务库 |
| HTTP chat route | `AgentService.run()` | surface 只做 request/response |
| Lark transport | `AgentService.run()` | 渠道只做 event -> run input |
| MCP bootstrap orchestrator | `AgentService.run()` + `SystemRunContext` | 不直接拼 Runtime |
| `/agent/tool` | `ToolRouter.execute()` | 工具入口，独立于 Agent 服务 |

## 15. 新目录与文件落点

新增：

```text
lib/agent/service/
  AgentService.ts
  AgentRunContracts.ts
  AgentRunPresenter.ts
  AgentRuntimeBuilder.ts
  AgentProfileRegistry.ts
  AgentProfileCompiler.ts

lib/agent/skills/
  AgentSkill.ts
  AgentSkillRegistry.ts
  builtin/

lib/agent/workflows/
  KnowledgeAgentWorkflowService.ts
  RelationAgentWorkflowService.ts
  EvolutionAgentWorkflowService.ts
  TranslationAgentWorkflowService.ts
  AgentApplicationWorkflowContracts.ts
```

保留但改造：

```text
lib/agent/AgentRuntime.ts
lib/agent/AgentRuntimeTypes.ts
lib/agent/strategies.ts
lib/agent/PipelineStrategy.ts
lib/agent/core/SystemRunContext.ts
```

逐步删除或瘦身：

```text
lib/agent/AgentFactory.ts
lib/agent/AgentRouter.ts
lib/agent/domain/ChatAgentTasks.ts
```

## 16. 重构阶段

### R0: 契约冻结

目标：

- 新增 `AgentRunContracts.ts`。
- 定义 `AgentRunInput`、`AgentProfile`、`AgentActionSpace`、`AgentRunResult`。
- 删除文档和模块注释中混用 `Capability` 的描述。

代码动作：

- `AgentRuntimeTypes.ts` 保留 Runtime 内部类型。
- `AgentRunContracts.ts` 承载 service-level 类型。
- `lib/agent/index.ts` 架构图改为 Surface -> AgentService -> Runtime -> Action Layer。

验收：

- surface-facing 类型不再引用 `RuntimeOverrides`。
- 新文档明确 Agent Skill 与 Tool Capability 的差异。

### R1: Profile 编译器

目标：

- 将 `presets.ts` 升级或迁移为 `AgentProfileRegistry`。
- 引入 `AgentProfileCompiler` 将 profile 编译为 RuntimeConfig。
- 显式 `actionSpace` 替代 `tools=[]` 和 `additionalTools`。

代码动作：

- `CapabilityRegistry.create()` 后续迁入 `AgentSkillRegistry.create()`。
- `#collectTools()` 改为读取 compiled action space。
- 删除 `additionalTools` 从 RuntimeConfig 的公开语义。

验收：

- 空 tools 不再注入全量 tool schemas。
- 所有内置 profile 的 action space 可枚举、可测试。

### R2: AgentService 主入口

目标：

- 新增 `AgentService.run()`。
- HTTP chat 和 Lark 至少两条入口迁入 AgentService。
- Surface 不再直接 `createChat()` / `createLark()`。

代码动作：

- `AgentService` 持有 `AgentRuntimeBuilder`。
- HTTP `/ai/chat` 构造 `AgentRunInput`。
- Lark event 构造 `AgentRunInput`。
- `AgentRunPresenter` 负责 HTTP/Lark 输出投影。

验收：

- `rg "createChat\\(|createLark\\(" lib/http lib/external/lark` 无主路径调用。
- HTTP chat 与 Lark 共用同一个 run contract。

### R3: System run 统一

目标：

- MCP bootstrap orchestrator、scan workflow、relation workflow 使用统一 `SystemRunContext` 和 `AgentRunInput`。
- Orchestrator 不再手写 Runtime 构造。

代码动作：

- `AgentFactory.buildSystemContext()` 迁移为独立 `SystemRunContextFactory`。
- Orchestrator 调用 `AgentService.run({ profile, context: { systemRunContext } })`。
- `strategyContext` 类型收紧为系统任务 DTO。

验收：

- MCP bootstrap 不直接调用 `createRuntime()`。
- 系统任务的 context shape 有类型和测试。

### R4: 迁出 Factory 业务流程

目标：

- 删除 `AgentFactory` 的领域胖方法。
- 新增 application workflow services。

代码动作：

- `scanKnowledge()` -> `KnowledgeAgentWorkflowService.extractOrSummarize()`
- `discoverRelations()` -> `RelationAgentWorkflowService.discover()`
- `evolveCheck()` -> `EvolutionAgentWorkflowService.check()`
- `translateToEnglish()` -> `TranslationAgentWorkflowService.translate()`

验收：

- `AgentFactory` 只保留 Runtime builder 相关职责，或被 `AgentRuntimeBuilder` 完全替代。
- `rg "scanKnowledge\\(|discoverRelations\\(|evolveCheck\\(|translateToEnglish\\(" lib/agent/AgentFactory.ts` 无匹配。

### R5: 任务入口拆分

目标：

- `/agent/task` 不再混合 DAG task 与 tool fallback。
- `ChatAgentTasks` 改为注册式 application workflow 或删除。

代码动作：

- `/agent/tool` 只接受 tool id。
- `/agent/workflow` 只接受 workflow id。
- DAG task 输出包含 `AgentRunResult` 或 `ToolResultEnvelope` 摘要，不再丢诊断。

验收：

- `/agent/task` 不再 fallback 到 arbitrary tool id。
- task result 保留 status、diagnostics、tool calls。

### R6: AgentRouter 决断

目标：

- 删除或重构 `AgentRouter`。

推荐决策：

- 删除 `AgentRouter` 主链路职责。
- 如果需要自动 intent routing，作为 `AgentProfileSelector` 接入 AgentService，输出 `AgentProfileRef`，不执行 Runtime。

验收：

- `AgentRouter` 不再同时承担 classify 和 execute。
- 架构图不再把它画成所有 transport 的必经路径。

### R7: 结果结构收敛

目标：

- `AgentRunResult` 成为 Agent 主结果。
- 应用 DTO 版本化。

代码动作：

- `AgentResult` 去除 `[key: string]: unknown`。
- scan summarize 的扁平字段迁入 presenter `summaryView`。
- relation/evolution/translation 输出定义 DTO。

验收：

- Runtime 不再返回任意业务字段。
- HTTP presenter 明确声明 response shape。

## 17. 最终验收标准

完成统一 AgentRuntime 重构后，应满足：

- 所有 Agent 服务入口只调用 `AgentService.run()`。
- 所有 Agent run 都有显式 `AgentRunInput.profile`。
- `message.metadata.mode` 不再选择 preset。
- `RuntimeOverrides` 不再作为 surface 输入。
- `AgentFactory` 不再包含领域流程方法。
- `AgentRouter` 不再作为未接入的主链路抽象存在。
- `AgentSkill` 和 `ToolCapabilityManifest` 命名与职责清晰分离。
- Agent action space 显式声明，没有 `tools=[]` 全量注入语义。
- Runtime 主结果是 `AgentRunResult`，业务 DTO 由 presenter/workflow service 投影。
- `/agent/tool`、`/agent/workflow`、Agent chat/system run 三类入口互不混用。
- ToolRouter 只执行工具动作，不选择 Agent profile。
- GovernanceEngine 只治理 tool call，不治理 Agent profile。
- Strategy 只编排 Runtime loop，不知道 surface。
- Surface 不直接构造 Runtime，不拼 `ReactLoopOpts`。

## 18. 第一阶段落地任务

下一步直接实现 R0-R2，不再继续扩大旧接口：

1. 新增 `lib/agent/service/AgentRunContracts.ts`。
2. 新增 `lib/agent/service/AgentService.ts` 与 `AgentRuntimeBuilder.ts`。
3. 将 HTTP `/ai/chat` 迁入 `AgentService.run()`。
4. 将 Lark message 或 `scanKnowledge` 其中一条主链路迁入 `AgentService.run()`。
5. 更新 `lib/agent/index.ts` 架构图。
6. 增加测试覆盖：
   - surface 只能构造 `AgentRunInput`
   - AgentService 能解析 profile 并执行 Runtime
   - `metadata.mode` 不再影响 profile
   - action space 不再由空 tools 隐式全量注入

这一阶段完成后，AgentRuntime 的服务性质和主接口就会定型。之后再迁 Factory 胖方法、任务入口和工具系统剩余问题，才不会继续在旧语义上修补。

### 18.1 本轮 R0-R2 落地记录

已完成：

1. 新增 `lib/agent/service/AgentRunContracts.ts`，将 `AgentRunInput`、`AgentProfileRef`、`AgentProfileOverride`、`AgentActionSpace`、`AgentRunResult` 等 service-level 契约从 Runtime 内部类型中分离出来。
2. 新增 `lib/agent/service/AgentRuntimeBuilder.ts`，把 `Profile + DI -> AgentRuntime` 的构造职责从 surface 主路径中抽离出来。
3. 新增 `lib/agent/service/AgentService.ts`，统一 `run(input: AgentRunInput): Promise<AgentRunResult>` 入口，并在入口处删除 `message.metadata.mode`、`metadata.preset`、`metadata.profile` 对 profile 选择的影响。
4. 在 `AgentModule` 和 `ServiceMap` 中注册 `agentRuntimeBuilder`、`agentService`，使 surface 能通过 DI 获取统一 Agent 服务入口。
5. HTTP `/api/v1/ai/chat` 和 `/api/v1/ai/chat/stream` 已迁入 `AgentService.run()`，route 只构造 `AgentRunInput`，不再直接 `createChat()` 或持有 Runtime。
6. Lark Bot Agent 与 remote-exec 前缀主链路已迁入 `AgentService.run()`，`LarkTransport` 不再调用 `createLark()` / `createRemoteExec()`。
7. `AgentRuntime` 的空 skill tools 语义已收紧：空列表表示无工具，不再隐式展开为全量 tool schemas。
8. `lib/agent/index.ts` 架构图更新为 `Surface -> AgentService -> AgentRuntimeBuilder -> AgentRuntime -> ToolRouter`。

新增测试：

1. `test/unit/AgentService.test.ts`
   - 验证 `AgentService` 依据 `AgentRunInput.profile` 构造 Runtime 并执行。
   - 验证 `message.metadata.mode` 不再影响 profile。
2. `test/unit/AiRouteDirectTool.test.ts`
   - 验证 HTTP chat surface 只产出 `AgentRunInput`，不会把 route body 的 `mode` 作为 profile 信号。
3. `test/unit/AgentRuntime.test.ts`
   - 验证空 skill tools 不再触发全量工具 schema 注入。
4. `test/unit/LarkTransportAgentService.test.ts`
   - 验证 Lark remote-exec 前缀通过 `AgentService.run()` 执行。

验证通过：

- `npm test -- --run test/unit/AgentService.test.ts test/unit/AiRouteDirectTool.test.ts test/unit/AgentRuntime.test.ts test/unit/LarkTransportAgentService.test.ts`
- `npm run typecheck`
- `npx biome check "lib/agent/service" "lib/http/routes/ai.ts" "lib/http/routes/remote.ts" "lib/external/lark/LarkTransport.ts" "lib/injection/modules/AgentModule.ts" "lib/injection/ServiceMap.ts" "lib/agent/AgentRuntime.ts" "lib/agent/index.ts" "test/unit/AgentService.test.ts" "test/unit/AiRouteDirectTool.test.ts" "test/unit/AgentRuntime.test.ts" "test/unit/LarkTransportAgentService.test.ts"`

仍未完成，进入下一阶段：

1. `scanKnowledge` 尚未迁入 `AgentService.run()`，仍由 `AgentFactory` 胖方法承载。
2. `AgentProfileRegistry` / `AgentProfileCompiler` 尚未完全替代 `presets.ts` 的旧命名与结构。
3. `AgentFactory.createRuntime()`、`createChat()`、`createLark()`、`createRemoteExec()` 仍保留给未迁移链路，下一阶段必须继续删除主路径调用。

