# OpenClaw Agent 实现深挖与 Alembic Agent 对比

> 日期：2026-04-27  
> 目的：基于 OpenClaw 当前源码，分析其内部 Agent 的真实工作方式、主要能力边界，并与 Alembic 当前 AgentRuntime 架构做系统对比。本文是开发分析文档，不修改 OpenClaw 代码。

## 1. 结论先行

OpenClaw 的 Agent 不是一个单独的 `AgentRuntime` 类，也不是一个纯粹的 ReAct 引擎。它更像一个“多渠道 Agent 网关操作系统”：

```text
Channel / CLI / Gateway RPC
  -> agent RPC / agentCommand
    -> session, workspace, provider, model, skills, auth, runtime policy
      -> CLI backend 或 embedded harness
        -> PI embedded runner / plugin harness / ACP external runtime
          -> tools, context engine, transcript, streaming, lifecycle, compaction
```

它的核心特征是：

- OpenClaw 把 Agent 放在一个持续运行的 Gateway 中，重点解决多渠道消息进入、会话持久化、模型和 runtime 选择、工具权限、流式回传、子 Agent、插件扩展和长期运行。
- 默认 embedded runtime 是 PI SDK。OpenClaw 直接 import `@mariozechner/pi-coding-agent`，用 `createAgentSession()` 创建 PI `AgentSession`，再把 OpenClaw 自己的工具、系统提示词、会话文件、上下文引擎、hooks 和 streaming 桥进去。
- OpenClaw 的 runtime 分层非常明确：Provider 是模型认证和模型目录，Model 是具体模型，Agent runtime/harness 是执行一个准备好的 Agent turn 的底层循环，Channel 是消息出入口。
- OpenClaw 支持多种执行族：内置 `pi` harness、plugin harness（例如 Codex app-server）、CLI backend（例如 Claude CLI）、ACP 外部控制面、native subagent。
- OpenClaw 的复杂度主要在“把一个 Agent turn 安全、持久、可中断、可观测地投放到真实渠道和真实机器上”，不是在自研一个最小 ReAct loop。

Alembic 的 Agent 则是另一种方向：它更像“项目知识代谢系统中的统一推理内核”。它有一个自有 `AgentRuntime`，通过 `AgentService.run()`、`AgentProfileCompiler`、`AgentRuntimeBuilder`、`Strategy`、`Capability`、`Policy` 和 `ToolRouter` 组织系统任务。Alembic 的复杂度主要在项目理解、知识提取、冷启动分维度分析、候选生成、去重、写库和演化治理。

一句话对比：

```text
OpenClaw = 多渠道、多 runtime、多工具、多会话的 Agent Gateway。
Alembic  = 面向项目知识生命周期的统一 Agent 执行内核与工作流系统。
```

## 2. 分析来源

OpenClaw 高信号文件：

| 类型 | 文件 | 价值 |
| --- | --- | --- |
| 概念文档 | `docs/concepts/agent-loop.md` | 描述 agent RPC、agentCommand、runEmbeddedPiAgent、subscribeEmbeddedPiSession、agent.wait 的主链路。 |
| 概念文档 | `docs/concepts/agent-runtimes.md` | 解释 Provider / Model / Agent runtime / Channel 分层，以及 PI、Codex、CLI、ACP 的区别。 |
| PI 集成文档 | `docs/pi.md` | 描述 embedded PI 架构、`createAgentSession()`、SessionManager、事件订阅、工具管线。 |
| Harness 文档 | `docs/plugins/sdk-agent-harness.md` | 解释 plugin harness 是低层 executor，不是 provider、channel 或工具注册表。 |
| Gateway 入口 | `src/gateway/server-methods/agent.ts` | `agent` / `agent.wait` RPC 的参数校验、会话解析、异步 dispatch、等待语义。 |
| 命令入口 | `src/agents/agent-command.ts` | 本地 trusted 入口与 ingress 入口、skills snapshot、model override、ACP path、fallback 包装。 |
| 执行分流 | `src/agents/command/attempt-execution.ts` | CLI provider 与 embedded PI/harness 的分流点。 |
| Embedded run | `src/agents/pi-embedded-runner/run.ts` | 队列、session lane、global lane、model/auth/harness 选择、重试和 fallback。 |
| PI attempt | `src/agents/pi-embedded-runner/run/attempt.ts` | 单次 embedded attempt 的核心：sandbox、skills、tools、context engine、prompt、SessionManager、stream、compaction、cleanup。 |
| Harness 选择 | `src/agents/harness/selection.ts`、`src/agents/harness/types.ts`、`src/agents/harness/builtin-pi.ts` | runtime policy、plugin harness、PI fallback、AgentHarness 契约。 |
| 工具生成 | `src/agents/pi-tools.ts`、`src/agents/openclaw-tools.ts` | PI coding tools 改造、OpenClaw 自有工具、policy/filter/schema/hook 包装。 |
| 子 Agent | `src/agents/tools/sessions-spawn-tool.ts`、`src/agents/subagent-spawn.ts`、`src/agents/tools/subagents-tool.ts` | `sessions_spawn`、native subagent、ACP spawn、list/kill/steer 控制。 |
| Prompt/skills | `src/agents/system-prompt.ts`、`src/agents/skills/workspace.ts` | system prompt section、skills catalog、memory section、runtime/channel/context 注入。 |
| Compaction | `src/agents/pi-settings.ts` | PI compaction reserve、context engine owns compaction 时禁用 PI auto compaction。 |

Alembic 高信号文件：

| 类型 | 文件 | 价值 |
| --- | --- | --- |
| 服务入口 | `lib/agent/service/AgentService.ts` | `AgentService.run(input)` 的统一入口、profile 编译、协调、runtime 构造、结果归一化。 |
| Profile 编译 | `lib/agent/profiles/AgentProfileCompiler.ts` | profile ref / override / definition 编译为 `CompiledAgentProfile`。 |
| Runtime 构造 | `lib/agent/service/AgentRuntimeBuilder.ts` | preset、capability、policy、strategy、additionalTools 到 `AgentRuntime` 的映射。 |
| Runtime 内核 | `lib/agent/runtime/AgentRuntime.ts` | 自有 ReAct loop、strategy 委托、policy、diagnostics、forced summary、tool loop。 |
| 工具执行 | `lib/agent/runtime/ToolExecutionPipeline.ts` | allowlist、ToolRouter、diagnostics、tracker、trace、memory、dedup。 |
| 既有分析 | `docs-dev/agent-runtime-usage-paradigms.md` | Alembic 当前 AgentRuntime 使用范式和冷启动管线分析。 |

## 3. OpenClaw 的真实 Agent 调用链

### 3.1 Gateway RPC 入口

OpenClaw 的公开 Agent 入口不是 runtime，而是 Gateway RPC：`agent` 和 `agent.wait`。

`src/gateway/server-methods/agent.ts` 中的 `agentHandlers.agent` 大致承担：

1. 校验请求参数。
2. 解析 `sessionKey`、`sessionId`、`agentId`、workspace、附件、channel delivery context。
3. 处理 `/new`、`/reset` 等会话重置语义。
4. 写入 session store 和 spawned context。
5. 立即返回 `{ runId, acceptedAt }`。
6. 后台通过 `dispatchAgentRunFromGateway()` 调用 `agentCommandFromIngress()`。
7. 完成后写 dedupe terminal snapshot，并按渠道进行二次 respond。

`agent.wait` 不是再次运行 Agent，而是等待一个已有 run 的生命周期终态。它依赖 `waitForAgentJob` 或 gateway dedupe terminal snapshot，返回 `ok`、`error` 或 `timeout`。这说明 OpenClaw 的 Agent run 是异步作业，和聊天渠道的长连接、RPC 超时、生命周期事件解耦。

### 3.2 CLI / Ingress 入口

`src/agents/agent-command.ts` 把本地 CLI 和网络 ingress 分开：

- `agentCommand()` 是本地 trusted 入口，默认 `senderIsOwner=true`、`allowModelOverride=true`。
- `agentCommandFromIngress()` 要求调用方显式传入 `senderIsOwner` 和 `allowModelOverride`，避免网络入口继承本地特权。

核心准备过程在 `prepareAgentCommandExecution()` 和 `agentCommandInternal()`：

1. 加载配置、session、workspace、agentDir、timeout、thinking/verbose 设置。
2. 处理 ACP ready path。
3. 加载或刷新 skills snapshot。
4. 处理 provider/model override、allowed models、thinking compatibility。
5. 解析 session transcript file。
6. 用 `runWithModelFallback()` 包装一次实际 attempt。

这一层是 OpenClaw 的“运行前控制面”，不是 LLM loop。它负责把一次来自渠道或 CLI 的消息变成可以交给 runtime/harness 的 prepared execution。

### 3.3 执行分流：CLI backend vs embedded harness

`src/agents/command/attempt-execution.ts` 是 OpenClaw Agent backend 的分岔点：

```text
runAgentAttempt()
  -> if isCliProvider(...): runCliAgent()
  -> else: runEmbeddedPiAgent()
```

如果所选 agent runtime 是 CLI backend，例如 `claude-cli`，OpenClaw 会启动/驱动本地 CLI 进程，并处理 CLI session binding。否则进入 embedded 体系，也就是 `runEmbeddedPiAgent()`。

这里的设计说明：OpenClaw 把“模型 provider”和“Agent runtime”刻意拆开。一个 Anthropic 模型可以通过普通 PI path 执行，也可以通过 Claude CLI backend 执行。OpenAI/Codex 相关模型也可能走普通 provider、Codex plugin harness 或 ACP path。

### 3.4 `runEmbeddedPiAgent()`：embedded run 编排器

`src/agents/pi-embedded-runner/run.ts` 中的 `runEmbeddedPiAgent()` 不是单次模型调用，而是 embedded run 编排器。它做的事情包括：

- backfill sessionKey。
- 按 session lane 入队，并可叠加 global lane。
- resolve workspace。
- ensure runtime plugins。
- 运行 `before_agent_reply`、`before_model_resolve` 等 hooks。
- 选择 harness：PI、显式 plugin runtime、auto plugin 或 PI fallback。
- 解析 provider、model、auth profile、context token budget。
- 构造 `AgentRuntimePlan`，让工具、transcript、delivery、outcome、observability 的策略在 PI 和 plugin harness 间尽量一致。
- 进入 attempt/retry loop，处理 auth profile fallback、rate limit/overload、compaction、timeout、empty/reasoning/planning-only retry。
- 每次 attempt 进入 `runEmbeddedAttemptWithBackend()`，再委托 `runAgentHarnessAttemptWithFallback()`。

这一层更接近 Alembic 的 `AgentService.run()` 加一部分 `AgentRunCoordinator`，但它服务的不是 Alembic 的 profile/strategy，而是 OpenClaw 的渠道运行、模型 fallback、runtime/harness 选择和 session 排队。

### 3.5 Harness 选择

OpenClaw 的 harness contract 在 `src/agents/harness/types.ts`：

```text
AgentHarness
  id
  label
  supports(ctx)
  runAttempt(params)
  classify?()
  compact?()
  reset?()
  dispose?()
```

`src/agents/harness/selection.ts` 的策略是：

1. 已有 session 记录的 harness id 优先，避免同一 transcript 热切换到另一个 runtime。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 可强制 runtime。
3. config 中 `agents.defaults.agentRuntime.id` 或 per-agent runtime policy 可指定 `auto`、`pi` 或 plugin runtime。
4. `auto` 下 registered plugin harness 可声明是否支持 provider/model。
5. 无匹配 plugin 且 fallback 是 `pi` 时才使用 PI。
6. 一旦 plugin harness claim 了 run，失败不会自动重放到 PI，避免重复副作用和 runtime 语义错乱。

内置 PI harness 在 `src/agents/harness/builtin-pi.ts` 中只是薄包装：`id: "pi"`，`runAttempt: runEmbeddedAttempt`。这进一步说明，OpenClaw 把 PI 也抽象成一种 harness，而不是把整个系统固定死在 PI 上。

## 4. OpenClaw PI embedded attempt 的内部工作方式

`src/agents/pi-embedded-runner/run/attempt.ts` 是最核心、也最能体现 OpenClaw Agent 真实复杂度的文件。它的职责可以分成十段。

### 4.1 Workspace、sandbox、agent identity

`runEmbeddedAttempt()` 首先解析 workspace，并根据 sessionKey 和 config 决定 sandbox context：

- sandbox 可把有效 workspace 改成 sandbox copy。
- `workspaceAccess === "rw"` 时仍可使用真实 workspace。
- `ro` 或 `none` 时会让工具在 sandbox root 中执行，并把 subagent 的 spawnWorkspaceDir 继承回真实 workspace。
- 通过 `resolveSessionAgentIds()` 确定当前 session 的 agentId 和 defaultAgentId。

这说明 OpenClaw 的 Agent 执行不是单纯“在 cwd 上跑工具”，而是需要按渠道、agent、sandbox 策略动态计算运行根。

### 4.2 Skills 加载和 prompt 注入

OpenClaw 的 skills 不是 Alembic 的 Capability。它更像可被模型按需读取的操作手册集合。

`src/agents/skills/workspace.ts` 会从多来源加载 skills，处理：

- bundled skills、plugin skills、本地目录。
- frontmatter eligibility、agent-level skill filter。
- 最大候选数、最大载入数、最大 prompt 数、最大 prompt 字符数、最大文件大小。
- symlink/path escape 防护。
- 将 home path 压缩为 `~` 减少 prompt token。

`src/agents/system-prompt.ts` 中的 Skills section 明确要求模型先扫描 `<available_skills>` 的 description，只有明确适用时再用 read 工具读取对应 `SKILL.md`。所以 skills 是“模型可发现的程序性知识”，不直接等于 runtime 挂载的工具能力。

### 4.3 Session write lock 与 transcript

OpenClaw 的 session transcript 是核心状态。`runEmbeddedAttempt()` 会 acquire session write lock，然后打开 `SessionManager.open(sessionFile)`。`src/agents/pi-embedded-runner/session-manager-init.ts` 还专门修复 PI SessionManager 的持久化边界：如果预创建的 session file 没有 assistant message，SessionManager 可能把自己标成 `flushed=true`，导致初始 user message 不落盘；OpenClaw 会清空并重置 fileEntries，确保 header/user/assistant 顺序持久化。

这和 Alembic 很不同。Alembic 的 Agent run 结果主要回到 workflow 和 repository，OpenClaw 则把 transcript 当成会话连续性、runtime pin、compaction、replay、agent.wait 和 channel resume 的基础设施。

### 4.4 工具空间创建

工具由 `createOpenClawCodingTools()` 生成。它先从 PI coding tools 派生 read/write/edit 等基础工具，再替换和扩展：

- `read`：OpenClaw 自定义读取，按模型上下文窗口和图片清洗限制调整输出。
- `write` / `edit`：host workspace 或 sandbox workspace 版本。
- `apply_patch`：仅对 OpenAI family 且 policy 允许时启用，默认 workspace-contained。
- `exec` / `process`：替换 PI `bash`，接入 approval、安全 profile、background process、session scope、sandbox backend。
- channel tools：由 channel plugin 提供登录、动作等能力。
- OpenClaw tools：由 `createOpenClawTools()` 提供 canvas、nodes、cron、message、TTS、media generation、web_search/web_fetch、gateway、agents_list、update_plan、sessions_list/history/send/spawn/yield、subagents、session_status 等。
- plugin tools：通过插件注册并被 allowlist/policy 过滤。

工具还会经过多层策略：

- global policy。
- provider policy。
- agent policy。
- agent/provider profile policy。
- group/channel policy。
- sandbox policy。
- subagent policy。
- owner-only policy。
- message provider filter。
- provider/model specific schema normalization。
- before_tool_call hooks。
- AbortSignal wrapper。

这条工具管线服务的是“真实世界工具执行安全”，而不是只做 LLM tool schema 映射。

### 4.5 Bootstrap/context files 与 context engine

OpenClaw 有 workspace bootstrap 机制，也有 context engine 插件接口。`runEmbeddedAttempt()` 会：

- 根据 run kind、sessionKey、workspace 是否 canonical、bootstrap 是否 pending，决定 full/limited/none bootstrap。
- 注入或剥离 `BOOTSTRAP.md`。
- 统计 bootstrap 注入字符预算并生成 warning。
- 在 context engine 存在时调用 assemble，可能替换 messages 或给 system prompt 增加 addition。
- turn 结束后调用 context engine after-turn lifecycle 和 maintenance。
- 当 context engine owns compaction 时，通过 `applyPiAutoCompactionGuard()` 禁用 PI auto compaction。

OpenClaw 的 context engine 更偏“长会话上下文治理和 memory 插件生命周期”。Alembic 的 cold-start contextWindow 更偏“项目扫描任务的证据压缩、维度状态和候选去重”。

### 4.6 System prompt 构造

OpenClaw 的 system prompt 不是单一模板，而是由大量 section 拼装：

- Project context files。
- Heartbeats。
- Exec approval guidance。
- Skills mandatory section。
- Memory section。
- Authorized senders。
- Current date/time。
- Assistant output directives。
- Runtime info，包括 host、OS、arch、Node、model、default model、shell、channel、capabilities。
- Sandbox info。
- TTS hint。
- Channel actions 和 message tool hints。
- OpenClaw docs/source path。
- Provider/plugin system prompt contribution。

这个 prompt 面向“一个可以跨渠道、跨工具、跨 runtime 生存的长期 Agent”。Alembic 的 system prompt 则更围绕 persona、capability、阶段上下文、项目知识和任务格式。

### 4.7 Session 创建与 PI AgentSession

OpenClaw 最终调用 PI SDK：

```text
createAgentSession({
  cwd,
  agentDir,
  authStorage,
  modelRegistry,
  model,
  thinkingLevel,
  tools,
  customTools,
  sessionManager,
  settingsManager,
  resourceLoader,
})
```

然后调用：

```text
applySystemPromptOverrideToSession(session, systemPromptText)
session.setActiveToolsByName(sessionToolAllowlist)
```

所以 PI 拥有底层 agent loop：LLM call、tool call continuation、tool execution callback、message state。OpenClaw 在外部包上系统提示词、工具、streamFn wrapper、session persistence、context engine、policy 和 lifecycle。

### 4.8 streamFn 包装与 provider 适配

OpenClaw 会重建 `activeSession.agent.streamFn`，再按 provider/model/runtime 包装：

- provider runtime stream override。
- OpenAI WebSocket transport。
- provider text transforms。
- extra params 和 transport override。
- prompt cache observability。
- Anthropic thinking block replay sanitize。
- tool call id sanitize。
- OpenAI responses API reasoning/function-call pair downgrade。
- malformed tool call name trim。
- malformed tool call args repair。
- xAI HTML entities decoding。
- sensitive stop reason recovery。
- LLM idle timeout。
- diagnostic model call events。

这说明 OpenClaw 的 model/provider 兼容层非常重。它不是只把 model name 传给 SDK，而是在每次出边界前后修正 transcript、tool call、reasoning block、transport、cache 和 diagnostics。

### 4.9 prompt 提交、事件订阅和 lifecycle

在提交 prompt 前，OpenClaw 会：

- sanitize/validate replay turns。
- 过滤 heartbeat pairs。
- 根据 DM/group 限制 history。
- 修复 tool_use/tool_result pairing。
- context engine assemble。
- 运行 before_prompt_build hook。
- 注入 bootstrap warning 和 runtime context。
- 检测 prompt 中的图片并只在当前 turn 注入。
- 做 preemptive compaction 或 tool-result truncation。

然后才调用：

```text
activeSession.prompt(prompt, { images })
```

同时 `subscribeEmbeddedPiSession()` 把 PI event 转为 OpenClaw stream：

- `assistant`：文本、reasoning、partial/block reply。
- `tool`：tool start/update/end/result。
- `lifecycle`：start/end/error。
- `compaction`：compaction start/end/retry。

这条桥接让同一个 Agent turn 能同时服务 Telegram/Discord/Slack/WhatsApp/CLI/WebChat/agent.wait，而不是只返回一个字符串。

### 4.10 compaction、结果归档和 cleanup

prompt 结束后，OpenClaw 会等待 compaction retry，记录 usage、prompt cache、trajectory、tool metadata、message tool side effect、pending media reply、successful cron add、last tool error 等。若 context engine 存在，还会执行 after-turn lifecycle。

最后 cleanup 包括：

- unsubscribe events。
- detach reply backend。
- clear active embedded run。
- flush pending tool results after idle。
- release WS session。
- cleanup bundle MCP/LSP runtime。
- release session write lock。
- restore skill env。

这就是 OpenClaw Agent run 能长期稳定运行的根本：它把一次模型循环包装成一个可中断、可排队、可恢复、可观测、可落盘、可投递的事务。

## 5. OpenClaw 的主要 Agent 能力

### 5.1 多渠道 Agent 网关

OpenClaw 的 Agent 可以从 Gateway RPC、CLI、聊天渠道、cron、hooks、subagent 等入口触发。Channel 层负责消息进入和回传，Agent runtime 不直接等于 channel。

这带来几个能力：

- 同一 Agent 能在不同渠道运行。
- channel capabilities 和 actions 能进入 system prompt。
- message tool 可以显式发送到目标 channel/thread。
- assistant delta 和 tool event 可以按渠道策略流式或最终投递。

### 5.2 多 runtime 和 harness

OpenClaw 支持：

- `pi`：默认 embedded PI runner。
- plugin harness：例如 bundled Codex app-server harness。
- CLI backend：例如 Claude CLI。
- ACP：外部 agent/control plane。
- native subagent：仍通过 OpenClaw Gateway 创建新的 agent session/run。

关键点是 runtime ownership 可变：PI path 中 OpenClaw/PI 共同拥有 transcript 和 loop，Codex app-server path 中 Codex 可能拥有 native thread、resume、compaction，OpenClaw负责 channel、visible mirror、tool policy、session selection。

### 5.3 会话持久化和可等待 run

OpenClaw 的 session file 和 session store 是一等公民：

- `agent` RPC 异步 accept，run 后台执行。
- `agent.wait` 等待 lifecycle 终态。
- 每个 session 有 transcript、sessionKey、sessionId、runtime pin、model、workspace、spawn lineage。
- session write lock 保护 transcript。
- active run snapshot 支持 steer/cancel/replay 相关能力。

### 5.4 工具安全和真实世界动作

OpenClaw 工具不只是 read/write/exec。它面向真实用户环境，包括：

- shell/process/apply_patch。
- browser、canvas、nodes、camera/location 等设备能力。
- message、reactions、channel actions。
- cron。
- web search/fetch。
- media generation 和 TTS。
- gateway/session 操作。
- subagent orchestration。
- plugin tools。

因此 OpenClaw 的工具治理要同时覆盖 owner-only、group policy、sandbox、provider quirks、approval UI、schema compatibility 和 abort/cleanup。

### 5.5 Skills 和 memory

OpenClaw skills 是 runtime prompt 的“可调用程序性知识目录”。模型先看 description，再决定是否 read `SKILL.md`。Memory section 则由插件 memory state 构建，并根据 available tools 和 citations mode 注入。

这和 Alembic 的“项目知识库/候选/recipe/skill 持久化”概念不同。OpenClaw skills 更像 Agent 操作手册，Alembic skills 更像从项目中提炼出的可复用代码知识或行为规范。

### 5.6 子 Agent 和多 Agent 编排

OpenClaw 的 `sessions_spawn` 工具支持两类 runtime：

- `runtime="subagent"`：native subagent，经 `spawnSubagentDirect()` 创建 child sessionKey，写 session store，处理 depth、max children、allowed agent、sandbox、model/thinking override、context fork/isolated、attachments、thread binding，然后通过 Gateway `agent` RPC 启动 child run。
- `runtime="acp"`：外部 ACP runtime，经 `spawnAcpDirect()` 启动。

`subagents` 工具支持 `list`、`kill`、`steer`，用于控制 requester session 下的子 run。OpenClaw 还限制 spawn depth、max active children、subagent control scope，防止无限递归和失控子进程。

### 5.7 插件扩展

OpenClaw 插件可以扩展：

- provider。
- channel。
- tools。
- hooks。
- agent harness。
- context engine。
- runtime helper。
- command/control UI 等。

Agent harness 是最低层 executor，只接收一个 prepared attempt。插件 harness 不应该偷偷选 provider 或改 channel delivery。这种分层让 OpenClaw 的 core 保持 extension-agnostic，同时允许 Codex 等 native runtime 进入底层执行。

## 6. Alembic Agent 架构摘要

Alembic 当前主路径是：

```text
Surface / Workflow
  -> AgentService.run(AgentRunInput)
    -> AgentProfileCompiler.compile(profile)
      -> AgentRunCoordinator.run(...) 可选接管 fanout/concurrency
      -> AgentRuntimeBuilder.build(compiledProfile)
        -> AgentRuntime.execute(AgentMessage, opts)
          -> Strategy.execute(runtime, message, opts)
            -> runtime.reactLoop(prompt, loopOpts)
              -> ToolExecutionPipeline.execute(...)
                -> ToolRouter.execute(...)
```

关键抽象：

- `AgentService`：统一服务入口，隐藏 profile 编译、runtime 创建、coordination 和结果归一化。
- `AgentProfileCompiler`：把 profile ref / override / definition 编译为 `CompiledAgentProfile`，解析 actionSpace、strategy、policies、concurrency。
- `AgentRuntimeBuilder`：根据 preset 和 compiled overrides 构造 `AgentRuntime`，注入 capabilities、strategy、PolicyEngine、persona、memory 和 additionalTools。
- `AgentRuntime`：Alembic 自有 ReAct 内核，负责 `execute()`、`reactLoop()`、policy 前后校验、timeout、LLM call、tool call、diagnostics、forced summary、tracker/contextWindow/memory/trace 注入。
- `Strategy`：组织调用方式，包括 Single、Pipeline、FanOut、Adaptive。Pipeline 可以按 stage 覆盖 capability、system prompt、budget、additionalTools。
- `ToolExecutionPipeline`：工具执行中间件，执行 allowlist、event/progress、observation、tracker signal、trace、submit dedup，最终统一走 `ToolRouter.execute()`。
- `SystemRunContext`：为系统任务提供 contextWindow、ExplorationTracker、ActiveContext trace、MemoryCoordinator、sharedState 等。

Alembic 的 cold-start/bootstrap 不是普通 chat，它在 workflow 层先构建确定性项目快照，再用 `bootstrap-session` 父 profile 分发 `bootstrap-dimension` 子 profile，并用共享状态做跨维度去重、消费和持久化。因此 Alembic 的复杂度在项目知识构建，而不是渠道 runtime。

## 7. OpenClaw vs Alembic 逐项对比

| 维度 | OpenClaw | Alembic |
| --- | --- | --- |
| 产品目标 | 多渠道个人/团队 Agent 网关，连接真实聊天渠道、机器、工具和模型 runtime。 | 项目知识库、冷启动理解、代码知识提炼、候选治理和演化。 |
| Agent 本质 | 一个 Gateway 中的长生命周期运行系统，由 session、runtime/harness、tools、context、channel、plugins 组合。 | 一个自有统一 ReAct 内核，由 profile、strategy、capability、policy、ToolRouter 配置。 |
| 主入口 | Gateway `agent` RPC、`agent.wait`、CLI `agent`。 | `AgentService.run(AgentRunInput)`。 |
| 底层 loop owner | 默认由 PI SDK `AgentSession` 执行，plugin harness 或 CLI/ACP 也可拥有 loop。 | Alembic 自己的 `AgentRuntime.reactLoop()` 拥有 loop。 |
| runtime 抽象 | `AgentHarness` 是 prepared attempt executor，Provider/Model/Runtime/Channel 分层清晰。 | `AgentRuntime` 是唯一执行内核，Strategy 只是组织调用。 |
| 模型/provider | 强调 provider auth、model catalog、auth profile、fallback、provider-specific transcript/stream 修复。 | 通过 `aiProvider` 接入 LLM，重点不在多 provider runtime 兼容层。 |
| 会话状态 | session file、SessionManager、session store、runtime pin、agent.wait、active run snapshot 是核心。 | run 结果和 workflow 状态更重要，交互 history 有但不是全系统中心。 |
| 工具系统 | 面向真实世界操作，policy 极多：owner、group、sandbox、provider、plugin、subagent、approval。 | 面向知识任务和项目工具，统一 ToolRouter，Capability/additionalTools 白名单，SafetyPolicy。 |
| Prompt | 大量 runtime/channel/context/skills/memory/sandbox/provider section。 | persona、capability、阶段上下文、项目 brief、memory、系统任务上下文。 |
| Skills | 模型可发现并按需读取的操作手册。 | 项目内可沉淀和复用的知识/规范/代码模式，也可作为 agent 能力配置的一部分。 |
| Memory/context | 长会话 transcript、context engine、memory plugin、prompt cache、compaction。 | MemoryCoordinator、ContextWindow、ActiveContext、bootstrap scope、候选和 recipe 持久化。 |
| 并发模型 | session lane + global lane，确保同一 session transcript 串行。 | AgentRunCoordinator 和 workflow 维度并发，重点是系统任务切分。 |
| 子 Agent | `sessions_spawn` 创建 child session/run，支持 depth、thread、ACP、kill/steer/list。 | `bootstrap-session` 可分发 child profile；更偏任务维度 fanout，不是面向聊天的可控子会话。 |
| 插件扩展 | provider、channel、tool、hook、harness、context engine 全面插件化。 | 主要通过内部 registry、ToolRouter、Profile/Capability/Strategy 扩展。 |
| 安全边界 | 网络入口权限、owner-only、channel/group、sandbox、approval、runtime fallback、path guard。 | SafetyPolicy、PathGuard、ToolRouter source/actor/surface、项目仓库保护、bootstrap write zone。 |
| 冷启动/项目理解 | 有 BOOTSTRAP.md 和 context files，但目标是让 agent 可在 workspace 中正确工作。 | 冷启动是核心业务，确定性扫描 + 多维度 Agent 提取 + 写库 + 报告。 |
| 输出形态 | streaming events、channel messages、tool event、lifecycle、session transcript、agent.wait payload。 | `AgentRunResult`、候选、recipes、relations、reports、knowledge entries、diagnostics。 |

## 8. 两者复杂度来源完全不同

### 8.1 OpenClaw 为什么复杂

OpenClaw 的复杂度来自“真实运行环境”：

- 多渠道输入和输出，每个 channel 有不同能力、thread、reply、approval、media 语义。
- 多 runtime，包括 PI、Codex app-server、CLI、ACP。
- 多 provider 和模型兼容，必须修复 tool call id、reasoning blocks、responses API、cache、transport。
- 长会话 transcript 要可持久、可 replay、可 compact、可 wait、可 steer。
- 工具能真实操作用户机器、浏览器、消息渠道、cron、media、子 Agent，因此权限和 cleanup 很重。
- 插件体系要允许第三方能力进入，但 core 不能写死 owner-specific behavior。

所以 OpenClaw 代码里大量逻辑围绕 run lifecycle，而不是围绕“如何从代码库提取知识”。

### 8.2 Alembic 为什么复杂

Alembic 的复杂度来自“项目知识代谢”：

- 冷启动必须先做确定性扫描，建立可信项目快照。
- 需要把大项目分成维度、层级、候选、关系、证据、recipe。
- Agent 需要在有限 context 内处理项目事实，避免幻觉和重复提交。
- 结果要进入知识库，需要去重、质量门、guard、delivery、report。
- 演化路径要响应文件变化、审计、生成建议和持续维护。

所以 Alembic 代码里大量逻辑围绕 workflow、profile、strategy、ToolRouter、MemoryCoordinator、ContextWindow 和 repository。

## 9. 架构启发：Alembic 可以借鉴什么

### 9.1 更明确地区分“执行 runtime”和“入口 surface”

OpenClaw 很清楚地区分 Channel、Provider、Model、Agent runtime。Alembic 当前也已经有 `source`、`runtimeSource`、`AgentService`、`AgentRuntime`，但文档和命名上还可以继续强化：

- HTTP chat、MCP、bootstrap、system workflow 是入口 surface。
- AgentRuntime 是执行内核。
- Profile 是业务语义。
- Strategy 是执行组织。
- ToolRouter 是工具执行边界。

这个分层能避免再次出现历史上 `ChatAgentTasks` 这类“文件名暗示 chat，实际是 HTTP task handler”的问题。

### 9.2 为长任务 run 建立更明确的 lifecycle 事件

OpenClaw 的 `agent.wait` 依赖 lifecycle end/error，而不是靠同步返回。Alembic 的 bootstrap/evolution 也有长任务特征。可以考虑把长任务抽象成更明确的 run lifecycle：

- accepted。
- started。
- stage_started / stage_completed。
- child_started / child_completed。
- degraded。
- completed / failed / aborted。

这不一定要引入 OpenClaw 式 Gateway，但可以让 dashboard/API/MCP 对系统任务的观察更统一。

### 9.3 子任务控制可从“fanout result”进化为“可控 child run”

Alembic 的 `bootstrap-session` 已经有 service-level coordination，但 child run 更像内部 worker。OpenClaw 的 subagent 体系展示了另一种方向：child run 有 sessionKey、runId、depth、cleanup、kill、steer、list。

Alembic 不需要照搬聊天式 subagent，但可以借鉴：

- bootstrap dimension run 可显式拥有 runId 和 lifecycle。
- 支持取消某个 dimension。
- 支持重跑某个 dimension。
- 支持对某个维度追加 steer/context，而不是重跑全局。

### 9.4 Tool policy 可以继续显式化

Alembic 已经有 Capability allowlist、additionalTools、SafetyPolicy、ToolRouter source/actor/surface。OpenClaw 的经验说明，一旦工具能产生真实副作用，policy 需要按更多维度组合：

- source surface。
- actor role。
- profile/actionSpace。
- project/workspace guard。
- system workflow phase。
- tool side effect class。
- approval/confirmation。

Alembic 后续如果增加更多写入型、远程型、终端型工具，可以考虑把这些维度在 ToolRouter 层继续结构化，而不是散落在 prompt 或 workflow 中。

### 9.5 Context engine 与 cold-start contextWindow 的边界要保持清楚

OpenClaw 的 context engine 是长会话上下文引擎，Alembic 的 cold-start contextWindow 是项目分析任务上下文管理器。二者都叫 context，但目标不同。

Alembic 后续若引入更通用的会话 memory/context engine，应避免和 bootstrap 的维度压缩混在一起：

- 会话 context：面向多轮用户交互、history、memory、summary。
- 系统任务 context：面向项目事实、维度证据、候选去重、写库。

### 9.6 插件 runtime 不一定适合 Alembic，插件工具更适合

OpenClaw 需要 plugin harness，因为它要接 Codex app-server、CLI、ACP 等外部原生 agent runtime。Alembic 当前核心价值在自有 AgentRuntime 和 ToolRouter，不一定需要开放替换 runtime。

更适合 Alembic 的扩展点可能是：

- 新 Tool provider。
- 新 Profile definition。
- 新 Stage factory。
- 新 Memory/Repository backend。
- 新 evidence extractor。
- 新 delivery/report renderer。

也就是说，Alembic 可以学习 OpenClaw 的 extension boundary 思想，但不需要照搬 harness 体系。

## 10. 对 Alembic 当前 Agent 设计的再定位

结合 OpenClaw 对比，Alembic 当前 AgentRuntime 的定位可以更明确：

```text
Alembic AgentRuntime 不是 Gateway runtime。
Alembic AgentRuntime 是项目知识任务的统一 ReAct 执行内核。
```

推荐的架构语言：

- `AgentService.run()` 是所有业务层发起 Agent 的首选入口。
- `AgentProfile` 描述“要做什么业务任务”。
- `Strategy` 描述“怎么组织推理步骤”。
- `Capability/actionSpace` 描述“允许使用哪些工具”。
- `Policy` 描述“预算、安全和质量约束”。
- `SystemRunContext` 描述“系统任务需要的长上下文能力”。
- `Workflow` 描述“确定性准备、调度、持久化、副作用和报告”。

在这个定位下，冷启动代码多并不是架构失败，而是说明它属于 workflow 层的系统任务：AgentRuntime 只负责一个维度或一个阶段的推理和工具调用，workflow 负责项目级生命周期。

## 11. 总结

OpenClaw 和 Alembic 都在做 Agent，但重心完全不同。

OpenClaw 的 Agent 是“接入真实世界的运行系统”。它最重要的能力是：

- 多渠道消息入口。
- 长会话 transcript。
- 多 runtime/harness。
- 真实工具和权限治理。
- streaming/lifecycle/wait。
- 子 Agent 和插件。

Alembic 的 Agent 是“项目知识代谢的推理内核”。它最重要的能力是：

- 统一 `AgentService.run()`。
- 自有 `AgentRuntime.reactLoop()`。
- profile/strategy/capability/policy 可组合。
- ToolRouter 统一工具边界。
- ContextWindow/Tracker/Memory/Trace 服务系统任务。
- bootstrap/evolution workflow 把项目事实转成可复用知识。

因此，两者不应该简单互相替代。OpenClaw 展示了一个成熟 Agent Gateway 应如何处理入口、会话、工具、安全和 runtime 多样性；Alembic 则应该继续强化自己的项目知识 workflow 和统一 runtime 内核，同时吸收 OpenClaw 在 lifecycle、工具 policy、子任务可控性和分层命名上的经验。