# Codex 会话模拟与 Agent 产出验证方案

## 结论

Alembic 需要一套本地化、可重复、可诊断的 Codex 插件验证链路，用来模拟用户输入、驱动 Alembic MCP 工具、记录会话状态，并分析 Agent 最终产出是否满足预期。

这个方案不应该照搬 Lark Remote 的 Feishu/Lark 桥接能力，但非常值得借鉴它的会话管理经验：

- 会话必须有明确绑定，不猜测目标。
- 每次输入都应变成可追踪的任务或回合记录。
- 状态要可恢复、可查询、可取消。
- 产出分析要基于结构化事件和精简摘要，不把大段过程塞回对话。
- 缺关键上下文时 fail closed，并返回可供 Agent 转述给用户的结构化原因。

Alembic 侧建议建设 `Codex Session Scenario Runner`：用场景文件模拟用户输入，通过确定性 Agent 模拟器或真实 MCP stdio 包装层调用 Alembic 工具，再用 Analyzer 解析工具调用、状态变化、最终回答和敏感信息泄露风险。

## 本次阅读的真实代码依据

### codex-lark-remote 会话绑定

源码位置：

- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/handoff.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/codex-context.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/test/handoff.test.mjs`

关键实现：

- `applyCodexContext()` 会从 MCP request metadata 或环境变量里提取 `threadId`、`threadPath`、`cwd`。
- `activateHandoff()` 默认要求显式 thread id，`requireExplicitThread` 默认为严格模式。
- 如果没有当前 Codex thread id，它会直接报错：拒绝只靠 workspace path 猜测会话。
- `listCodexThreads()` 会扫描 Codex sessions JSONL，但会跳过 subagent、exec、guardian 等隐藏会话。
- 会话标题从 session meta 或初始用户消息推断，并清理 AGENTS / remote note 这类噪声。

对 Alembic 的启发：

- 验证运行必须绑定明确的 `scenarioId`、`runId`、`projectRoot`、`dataRoot`，不能从进程 cwd 猜真实用户项目。
- 如果测试目标是项目初始化、知识挖掘、AI 配置，缺 `projectRoot` 就必须验证为阻断结果，而不是尝试继续。
- 会话记录要保存“输入来自哪里、绑定到哪个项目、调用了哪些工具、最终答复是什么”。

### codex-lark-remote 队列与任务生命周期

源码位置：

- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/queue.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/runner.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/test/runner.test.mjs`

关键实现：

- `RemoteCommandQueue` 用一个 JSON 文件保存 `commands` 和 `events`。
- 命令状态包括 `pending`、`running`、`waiting_review`、`completed`、`failed`、`cancelled`。
- `claimNext()` 只领取 pending，避免同一个 worker 重复处理。
- 每次状态变化都会追加 event，例如 `queued`、`claimed`、`codex_completed`、`runner_error`。
- `CodexCliRunner` 在 worktree 模式下用 `codex exec --json` 运行，在 handoff 模式下用 `codex exec resume --json` 继续指定会话。
- `extractFinalMessage()`、`extractProgressSummary()`、`readSessionLastTurnSummary()` 会从 Codex JSONL / stdout 事件里提取最终答复和进度摘要。

对 Alembic 的启发：

- Alembic 验证不应该只看函数返回值，还要看一整轮“用户输入 -> 工具调用 -> 状态转移 -> Agent 输出”。
- 每个场景运行都应写入独立 transcript，失败时能回放证据。
- Analyzer 应读取结构化事件，不依赖肉眼看控制台。
- 对可能写文件、启动 daemon、配置 secret 的路径，需要能断言“发生了”或“没有发生”。

### codex-lark-remote 接管与忙碌保护

源码位置：

- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/takeover.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/observer.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/test/bridge-server.test.mjs`

关键实现：

- `detectSessionStatus()` 通过读取 session JSONL 最后一条事件和文件 mtime 判断目标会话是 `idle`、`running` 还是 `unknown`。
- 如果目标 Codex Desktop 会话正在运行，Lark Remote 不把新消息继续排队，而是明确回复“没有发送，也不会排队”。
- `CodexSessionObserver` 只读观察 session 进度，不把观察消息路由为用户输入。
- pending takeover 会等待目标 idle，超时则取消。

对 Alembic 的启发：

- 验证 runner 也应有 run lock，避免同一个场景或同一个临时项目被并发写入。
- “观察/分析输出”和“继续输入”必须分开。Analyzer 读取 transcript，不应反过来影响被测会话。
- 如果某一步期望 fail closed，验证必须确认没有启动 daemon、没有写 secret、没有生成 job。

### codex-lark-remote MCP 工具边界

源码位置：

- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/bin/codex-lark-remote-mcp.mjs`
- `/Users/gaoxuefeng/Documents/github/codex-lark-remote/plugins/codex-lark-remote/src/diagnostics.mjs`

关键实现：

- MCP 工具层先处理 `initialize`、`tools/list`、`tools/call`。
- `codex_lark_handoff` 要求 `confirmedLocalBridgeHandoff=true`。
- handoff 时如果拿不到 thread id，会返回明确的缺失原因，不尝试猜测。
- `codex_lark_prepare_takeover` 如果拿不到 cwd，会返回“当前 workspace cwd 不可用”。
- diagnostics 返回 sanitized 状态，不输出 secret。

对 Alembic 的启发：

- Alembic 的验证要覆盖 `tools/list` 和直接 `tools/call` 两种入口。
- 场景里要能断言工具是否可见、直接调用隐藏工具是否被 preflight 阻断。
- 对 key、token、路径、daemon 状态的返回必须做脱敏和结构化断言。

### Alembic 当前 Codex 入口

源码位置：

- `lib/external/mcp/CodexMcpServer.ts`
- `lib/codex/Preflight.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/ProjectRootResolver.ts`
- `lib/codex/StatusService.ts`
- `test/unit/CodexMcpServer.test.ts`

当前真实链路：

- `CodexMcpServer.handleToolCall()` 支持显式 `projectRoot` 参数；如果可信，会保存为 Codex saved project root。
- `handleToolCallInCurrentProject()` 先读取 knowledge，再执行 `preflight(before-auto-init)`。
- 对 `dashboard/bootstrap/rescan/job` 这类 init-on-demand 工具，preflight 允许先做 Ghost 初始化，再执行 `preflight(execute)` 复核。
- `Preflight` 会拦截不可信 projectRoot、隐藏工具、未启用 admin、缺 AI Provider 的 internal bootstrap/rescan。
- `alembic_codex_ai_config` 在配置 API key 时要求 `confirmChatSecret=true`，并且返回 mask 后结果。
- 单元测试已经覆盖缺 AI Provider 时 bootstrap fail closed，且确认 `supervisor.ensure` 不会被调用。

当前缺口：

- 单元测试验证的是工具函数和 MCP handler，没有模拟完整“用户自然语言输入 -> Agent 决策 -> 工具调用 -> Agent 最终回复”。
- 没有统一 transcript，可以在失败时回放 Agent 为什么选了某个工具。
- 没有场景级断言来验证“缺上下文时 Agent 是否应该向用户要信息，而不是继续调用”。
- 没有打包后的 stdio MCP 冒烟验证，难以及时发现插件安装形态与源码形态的差异。

## 目标

### 要验证什么

第一层验证 Alembic MCP 行为：

- 工具列表是否符合初始化状态、知识状态、admin 状态。
- 缺 projectRoot 时是否只允许 discovery 工具。
- init-on-demand 是否只在允许的工具上发生。
- 缺 AI Provider 时 bootstrap/rescan 是否不启动 daemon。
- AI key 是否永不明文出现在返回值、transcript、summary。
- 显式 projectRoot 是否被保存，并在后续调用中可复用。

第二层验证 Agent 行为：

- 用户说“初始化 Alembic”时，Agent 是否先检查 status，再按状态调用 init。
- 用户说“开始知识挖掘”但缺 AI key 时，Agent 是否提示配置 AI，而不是硬跑 bootstrap。
- 用户提供 provider/key 时，Agent 是否要求或携带 `confirmChatSecret=true`。
- 用户没有提供项目目录时，Agent 是否要求提供绝对路径。
- 工具返回 `needsUserInput` 时，Agent 最终回复是否把缺失信息转述清楚。

第三层验证会话产出：

- 一轮会话最终状态是否与预期一致。
- Agent 最终答复是否包含必要结论。
- Agent 最终答复是否没有误导性内容，例如“已经开始扫描”但实际上 preflight 阻断。
- 运行中是否没有不应发生的副作用。

## 不做什么

本方案不引入 Feishu/Lark。

本方案不建设新的 Dashboard 或浏览器 UI。

本方案不依赖真实云端 LLM 才能跑基础验证。

本方案不在 Alembic 核心验证里读取用户真实 Codex 历史会话。

本方案不把随机的真实 Agent 输出作为 CI 唯一判断标准。CI 默认走确定性模拟；真实 Codex 路径作为本地冒烟和发布前验证。

## 形态决策

这套能力最终可以做成通用 Codex 插件，但第一步不应该直接从通用插件开始。

更稳的路线是两层：

1. 先在 Alembic 仓库内做工程模块，把真实场景跑通，并进入 Alembic CI。
2. 场景模型、MCP stdio harness、transcript、Analyzer、redaction 稳定后，再抽成通用 Codex 插件。

原因是 Alembic 当前要验证的不是抽象的 MCP 协议，而是很具体的冷启动、projectRoot、Ghost 初始化、AI key、knowledge gate、daemon job 这些高风险链路。过早抽象成通用插件，容易把 Alembic 真正需要的断言冲淡。

### 工程模块、Skill、通用插件的职责

工程模块是事实来源：

- 负责执行 scenario。
- 负责启动 in-process 或 stdio MCP harness。
- 负责写 transcript。
- 负责做结构化断言。
- 负责进入 CI。

Skill 是薄入口：

- 负责告诉 Codex 什么时候运行验证。
- 负责说明常用命令和失败报告怎么看。
- 负责提醒修改 Codex 插件入口后必须跑哪些场景。
- 不承担核心判断逻辑。

通用 Codex 插件是第二阶段产品化形态：

- 负责验证任意 Codex 插件的 MCP stdio 入口。
- 负责加载目标插件、场景包、适配器。
- 负责输出统一报告。
- 不内置 Alembic 业务判断。

### 最终形态

最终应该形成三件套：

```text
codex-plugin-verifier
  通用验证器核心与 Codex 插件壳

alembic-codex-verifier-scenarios
  Alembic 自己的场景包、fixture、断言扩展

alembic-codex-verify skill
  给 Codex Agent 使用的薄说明入口
```

在 Alembic 仓库内可以先不拆包，目录上预留边界即可。等至少 4-6 个 Alembic 真实场景稳定后，再抽出通用插件。

## 总体架构

```text
scenario.json
  -> SessionScenarioRunner
  -> ProjectFixture / IsolatedAlembicHome
  -> AgentSimulator
       -> MCP Harness
          -> CodexMcpServer 或 packaged stdio MCP
       -> TranscriptWriter
  -> AgentOutputAnalyzer
  -> result.json / summary.md
```

抽成通用插件后的架构会变成：

```text
Alembic scenario pack
  -> codex-plugin-verifier
      -> ScenarioRunner
      -> TargetPluginResolver
      -> McpStdioHarness
      -> AgentSimulator / RealCodexAgentAdapter
      -> TranscriptWriter
      -> OutputAnalyzer
  -> report.json / summary.md
```

Alembic 内部 in-process harness 是第一阶段特权能力，用来精确断言 `CodexMcpServer` 内部副作用；通用插件不能依赖这个内部类。通用插件的默认能力应该走 packaged stdio MCP，因为它验证的是插件真实安装形态。

### Scenario

Scenario 是验证输入的单一来源。

建议路径：

- `test/codex-scenarios/cold-start/*.json`
- `test/codex-scenarios/preflight/*.json`
- `test/codex-scenarios/ai-config/*.json`

字段草案：

```json
{
  "id": "bootstrap-without-ai-fails-closed",
  "description": "用户要求开始知识挖掘，但项目未配置 AI Provider",
  "fixture": {
    "project": "minimal-node",
    "initialized": true,
    "knowledge": "empty",
    "ai": "missing"
  },
  "turns": [
    {
      "user": "开始 Alembic 知识挖掘"
    }
  ],
  "expect": {
    "toolCalls": [
      { "name": "alembic_codex_status" },
      { "name": "alembic_codex_bootstrap", "result": { "data.errorCode": "AI_PROVIDER_REQUIRED" } }
    ],
    "sideEffects": {
      "daemonEnsureCalled": false,
      "jobCreated": false,
      "secretWritten": false
    },
    "assistant": {
      "mustMention": ["需要配置 AI Provider", "alembic_codex_ai_config"],
      "mustNotMention": ["已经开始扫描", "bootstrap job 已启动"]
    }
  }
}
```

### ProjectFixture

每个场景必须使用独立项目目录和独立 Alembic 数据目录。

建议运行目录：

- `/tmp/alembic-codex-session-runs/<timestamp>-<scenarioId>/project`
- `/tmp/alembic-codex-session-runs/<timestamp>-<scenarioId>/alembic-home`
- `/tmp/alembic-codex-session-runs/<timestamp>-<scenarioId>/transcript.jsonl`
- `/tmp/alembic-codex-session-runs/<timestamp>-<scenarioId>/result.json`

默认 run root 必须在 Alembic 开发仓库之外。原因是 Alembic 自身有开发仓库写入保护；如果把“被测用户项目”放在 Alembic 仓库的 `scratch/` 下面，数据库会被保护逻辑重定向，导致冷启动验证不再代表真实用户项目。需要特殊保留产物时可以显式传 `--run-root`，但不应指向 Alembic 仓库内部执行完整用户项目链路。

默认规则：

- 不使用当前 Alembic 仓库作为被测用户项目。
- 不读取真实 `~/.codex`。
- 不读取真实 `~/.alembic` 或未来全局数据目录。
- 所有环境变量由 runner 显式注入。
- 每个 run 结束时保留证据，除非传 `--clean`。

本地开发验证还需要支持显式绑定真实测试项目，例如：

```bash
npm run verify:codex-session -- \
  --scenario test/codex-scenarios/cold-start/explicit-init.json \
  --project-root /Users/gaoxuefeng/Documents/github/BiliDili
```

默认情况下，即使传入真实测试项目，runner 仍使用隔离的 `ALEMBIC_HOME`，避免污染真实 `~/.asd`。如果要验证已经预置好的本机 Ghost workspace，可以显式传：

```bash
npm run verify:codex-session -- \
  --scenario test/codex-scenarios/cold-start/explicit-init.json \
  --project-root /Users/gaoxuefeng/Documents/github/BiliDili \
  --real-alembic-home
```

`--real-alembic-home` 只用于本地手动验证，不进入默认 CI。它会让场景使用真实 `~/.asd`，因此只应该指向明确可清理的测试项目。

安全护栏：

- `--real-alembic-home` 必须同时提供 `--scenario` 和 `--project-root`。
- `--real-alembic-home` 不能指向 Alembic 开发仓库本身。
- 默认 `npm run verify:codex-session` 永远使用隔离 `ALEMBIC_HOME`。

projectRoot 绑定规则：

- `projectRootSource=generated-fixture`：默认最安全模式，生成最小测试项目。
- `projectRootSource=cli-option`：通过 `--project-root` 绑定真实测试项目。
- `projectRootSource=env`：通过 `CODEX_SESSION_PROJECT_ROOT` 绑定。
- `projectRootSource=scenario-path`：场景文件内写 `fixture.projectPath`，可使用 `$CODEX_SESSION_PROJECT_ROOT` 占位。

所有 run 的 transcript 必须记录 `projectRoot`、`expectedProjectRoot`、`projectRootSource`、`alembicHomeMode`。显式 projectRoot 场景下，Analyzer 默认要求每一次 Alembic tool call 都携带同一个 `projectRoot`；任何缺失或漂移都会直接失败。

每个 run 会生成：

- `transcript.jsonl`：脱敏后的事件流。
- `result.json`：断言事实、错误列表、运行配置。
- `run-config.json`：真实绑定的 `projectRoot`、`runRoot`、`alembicHome`、`alembicHomeMode`。
- `summary.md`：人工快速阅读入口。

### BiliDili 真实链路验证模式

为了验证“Agent 模拟是否真的驱动 Alembic 产出知识”，仅靠 in-process fake daemon 不够。新增 `live-local` 模式，专门用于本机真实项目验证：

```bash
npm run verify:codex-session -- \
  --mode live-local \
  --scenario test/codex-scenarios/live/bilidili-bootstrap-real.json \
  --project-root /Users/gaoxuefeng/Documents/github/BiliDili \
  --real-alembic-home \
  --wait-job-timeout-ms 600000
```

这条命令会使用真实 `~/.asd`、真实 `CodexMcpServer`、真实 `DaemonSupervisor`、真实 daemon HTTP job API。它会调用：

1. `alembic_codex_status`
2. `alembic_codex_init`
3. `alembic_codex_bootstrap`

随后 runner 会作为旁路观察者轮询真实 `JobStore`，直到 bootstrap job 进入 `completed`、`failed` 或 `cancelled`，并把下面事实写入 `result.json` 和 `summary.md`：

- daemon job id、kind、status、error。
- `knowledge_entries` 表是否存在、总数、按 lifecycle 统计。
- `Alembic/candidates` 下的 Markdown 文件。
- `Alembic/recipes` 下的 Markdown 文件。
- workspace 基础文件是否存在。

这里的目标不是模拟“看起来像成功”，而是把真实链路问题暴露出来：

- projectRoot 是否漂移。
- Ghost workspace 是否写到了预期 BiliDili 项目。
- AI 配置是否可用。
- daemon 是否真的启动。
- bootstrap job 是否真的完成。
- 知识条目或候选文件是否真的生成。

`live-local` 不进入默认 CI，因为它会写真实测试项目的 Ghost 数据，也可能调用真实 AI Provider。默认 `npm run verify:codex-session` 仍只跑可重复的 in-process 场景。

### MCP Harness

MCP Harness 分两种模式。

第一种是 in-process 模式：

- 直接实例化 `CodexMcpServer`。
- 注入 fake supervisor、fake fetch、fake daemon status。
- 适合 CI，速度快，稳定。
- 可以精确断言 `supervisor.ensure` 是否调用、fetch 是否发生、body 是否正确。

第二种是 live-local 模式：

- 直接实例化真实 `CodexMcpServer`。
- 使用真实 `DaemonSupervisor`，只包一层 recorder 记录 ensure/status/stop。
- fetch 不再 mock，而是记录后继续请求真实本机 daemon。
- 显式要求 `--scenario`、`--project-root`、`--real-alembic-home`。
- 适合 BiliDili 这类可清理测试项目的本地深度验证。

第三种是 stdio packaged 模式：

- 启动打包后的 Alembic MCP 入口。
- 通过 JSON-RPC 调用 `initialize`、`tools/list`、`tools/call`。
- 验证插件安装形态、tool schema、真实 stdio 协议。
- 作为发布前本地验证和 action 冒烟测试。

in-process 是 CI 主线，live-local 是真实 Recipe 产物验证，stdio 是插件安装形态连通性补充。三者使用同一份 scenario 断言模型，但只有 live-local 会等待真实 daemon job 并检查知识产物。

抽成通用插件后，MCP Harness 的默认接口应该只认“目标插件 MCP 入口”：

```json
{
  "target": {
    "kind": "mcp-stdio",
    "command": "node",
    "args": ["./dist/external/mcp/codex-server.js"],
    "cwd": "/path/to/plugin",
    "env": {
      "CODEX_WORKSPACE_DIR": "<fixture.projectRoot>"
    }
  }
}
```

Alembic 的 in-process harness 可以作为仓库内 adapter：

```json
{
  "target": {
    "kind": "alembic-in-process",
    "fakeSupervisor": "stopped",
    "fakeFetch": true
  }
}
```

这样通用 verifier 不需要知道 Alembic 的 TypeScript 类，也不会把 Alembic 内部实现泄露成通用接口。

### AgentSimulator

确定性 Agent 模拟器不是一个空壳，它要模拟 Codex Agent 在 Alembic 冷启动场景里的关键决策。

输入：

- 用户自然语言。
- 当前 scenario state。
- `tools/list` 返回的可见工具。
- 每次 tool call 的结构化结果。

输出：

- 一系列 tool call。
- 一条最终 assistant message。
- 中间 reasoning 不需要模拟，只记录决策原因。

默认决策规则：

- 每个新场景先调用 `alembic_codex_status`，除非 scenario 明确指定直接调用某工具。
- 如果 status 或 tool result 返回 `projectRootResolution.trust !== trusted`，最终回复要求用户提供绝对 `projectRoot`。
- 如果 `knowledge.initialized === false` 且用户要求初始化，调用 `alembic_codex_init`。
- 如果用户要求知识挖掘，先确认 initialized；未初始化则走 init-on-demand 或先 init。
- 如果 bootstrap/rescan 返回 `AI_PROVIDER_REQUIRED`，最终回复要求配置 provider/key，不继续尝试 daemon。
- 如果用户提供 key，只有在 scenario 明确包含用户确认时才调用 `alembic_codex_ai_config` 携带 `confirmChatSecret=true`。
- 如果工具返回 `success: true`，最终回复必须准确描述实际已完成的动作。

这个模拟器的目的不是替代 Codex，而是把 Alembic 希望 Agent 遵循的会话协议固化成可测试规范。

### TranscriptWriter

Transcript 使用 JSONL，记录每个关键事件：

```json
{"type":"run.started","scenarioId":"...","projectRoot":"..."}
{"type":"user.message","turn":1,"text":"开始 Alembic 知识挖掘"}
{"type":"agent.tool_call","turn":1,"name":"alembic_codex_status","arguments":{"projectRoot":"..."}}
{"type":"tool.result","turn":1,"name":"alembic_codex_status","success":true,"data":{}}
{"type":"agent.tool_call","turn":1,"name":"alembic_codex_bootstrap","arguments":{"projectRoot":"..."}}
{"type":"tool.result","turn":1,"name":"alembic_codex_bootstrap","success":false,"data":{"errorCode":"AI_PROVIDER_REQUIRED"}}
{"type":"assistant.final","turn":1,"text":"需要先配置 AI Provider..."}
{"type":"run.completed","status":"passed"}
```

规则：

- 写入前必须脱敏。
- `apiKey`、`*_API_KEY`、token、daemon secret 不能进入 transcript。
- 大型 tool result 做结构摘要，完整结果可选写入 `raw/`，但仍要脱敏。
- 每个 transcript 都要包含 tool call 顺序和 side effect 证据。

### AgentOutputAnalyzer

Analyzer 负责把 transcript 转为可断言事实。

建议输出：

```ts
interface AgentSessionFacts {
  assistantFinalText: string;
  daemonEnsureCalled: boolean;
  jobCreated: boolean;
  secretWritten: boolean;
  toolCalls: Array<{
    name: string;
    arguments: Record<string, unknown>;
    success: boolean;
    errorCode?: string;
  }>;
  leakedSecrets: string[];
  requestedUserInput: Array<{
    kind: 'projectRoot' | 'aiProvider' | 'apiKey' | 'confirmation';
    evidence: string;
  }>;
}
```

断言类型：

- `toolCalls`：顺序、次数、参数、结果字段。
- `sideEffects`：daemon、job、secret、workspace marker、saved project root。
- `assistant.mustMention`：必须转述的用户行动。
- `assistant.mustNotMention`：禁止误报的状态。
- `redaction`：原始 secret 不得出现在任意 transcript / result / summary。
- `state`：初始化 marker、settings/secrets、job store、policy state。
- `artifacts`：真实 job 是否进入终态、`knowledge_entries` 数量、candidate/recipe 文件数量。

当前 `result.json` 已包含：

- `harnessMode`：`in-process` 或 `live-local`。
- `jobs.createdJobIds`：本轮 bootstrap/rescan 返回的 job id。
- `jobs.latest`：真实 JobStore 最新 job 摘要。
- `jobs.terminal`：已进入终态的 job。
- `knowledgeArtifacts.database.totalEntries`：真实 DB 知识条目总数。
- `knowledgeArtifacts.database.byLifecycle`：生命周期分布。
- `knowledgeArtifacts.candidateFiles` / `recipeFiles`：真实 Markdown 产物列表。

### 真实 Codex 输出分析

后续如果接入真实 Codex CLI 或 Desktop session JSONL，可以借鉴 Lark Remote 的解析方式：

- 解析 `item.completed` 里的 `agent_message`。
- 解析 `response_item` / `event_msg` 的 final answer。
- 解析 tool call / command / file update 事件为 progress summary。
- 只把最后一轮 turn 的最终答复纳入判断。

这一层不作为基础 CI 的唯一依据，原因是真实模型输出存在非确定性。它更适合作为发布前 smoke：

- 插件打包后能被 MCP stdio 加载。
- Codex 能看到工具列表。
- 一个简单场景能被真实 Agent 正确引导。
- 输出没有明显泄露 secret 或错误声称。

## 推荐目录与模块

第一阶段建议在 Alembic 内做测试辅助，不进入运行时核心路径：

```text
test/codex-scenarios/
  preflight/
  cold-start/
  ai-config/

scripts/
  verify-codex-session-scenarios.mjs

lib/codex/validation/
  ScenarioTypes.ts
  ScenarioRunner.ts
  AgentSimulator.ts
  McpHarness.ts
  TranscriptWriter.ts
  AgentOutputAnalyzer.ts
  Redaction.ts
```

如果担心 `lib/codex/validation` 被误认为产品能力，也可以先放在：

```text
test/support/codex-session/
```

等接口稳定后再提升到 `lib/codex/validation`。

更推荐的第一阶段落点是：

```text
test/support/codex-session/
  ScenarioTypes.ts
  ScenarioRunner.ts
  AgentSimulator.ts
  McpHarness.ts
  AlembicInProcessHarness.ts
  McpStdioHarness.ts
  TranscriptWriter.ts
  AgentOutputAnalyzer.ts
  Redaction.ts

test/codex-scenarios/
  preflight/
  cold-start/
  ai-config/

scripts/
  verify-codex-session-scenarios.mjs
```

抽成通用插件后的目标目录：

```text
codex-plugin-verifier/
  .codex-plugin/
    plugin.json
  skills/
    plugin-verifier/
      SKILL.md
  src/
    scenario/
    mcp/
    agent/
    transcript/
    analyzer/
    redaction/
  bin/
    codex-plugin-verifier.mjs
    codex-plugin-verifier-mcp.mjs
  scenarios/
    common/
```

Alembic 仓库届时保留：

```text
test/codex-scenarios/
  alembic-preflight/
  alembic-cold-start/
  alembic-ai-config/

scripts/
  verify-codex-session-scenarios.mjs
```

这个脚本可以薄封装通用插件 CLI，避免 Alembic CI 直接绑定通用插件内部路径。

## 通用 Codex 插件设计

通用插件建议命名为 `codex-plugin-verifier`。它的目标不是“替用户操作 Codex”，而是“验证一个 Codex 插件是否能在模拟会话中稳定工作”。

### 插件能力边界

通用插件应该支持：

- 读取 scenario 文件或目录。
- 启动目标插件 MCP stdio server。
- 调用 `initialize`、`tools/list`、`tools/call`。
- 用确定性 AgentSimulator 执行用户输入。
- 可选调用真实 `codex exec --json` 做 smoke。
- 写 transcript。
- 执行通用断言。
- 加载项目自定义 analyzer。
- 生成 `result.json` 和 `summary.md`。

通用插件不应该内置：

- Alembic projectRoot 规则。
- Alembic AI Provider 规则。
- Alembic Recipe / knowledge gate 规则。
- Alembic daemon job 结构。
- 对真实用户项目的默认写入。

这些都由 Alembic scenario pack 或 adapter 提供。

### 插件 MCP 工具草案

通用插件可以暴露这些 MCP 工具：

```text
codex_verifier_status
codex_verifier_run
codex_verifier_result
codex_verifier_list_scenarios
codex_verifier_validate_scenario
```

工具职责：

- `codex_verifier_status`：检查 verifier 运行时、Node、目标路径、最近 run。
- `codex_verifier_list_scenarios`：列出某个 scenario 目录。
- `codex_verifier_validate_scenario`：只校验 schema，不运行目标插件。
- `codex_verifier_run`：运行一个或一组 scenario。
- `codex_verifier_result`：读取 run 结果和 transcript 摘要。

这些工具默认不应该接受 API key，不应该读取真实 Codex session，不应该写目标插件仓库以外路径。需要写外部路径时必须由 scenario 显式声明。

### CLI 接口草案

通用 CLI：

```bash
codex-plugin-verifier run --scenario test/codex-scenarios/preflight/missing-project-root.json
codex-plugin-verifier run --scenarios test/codex-scenarios --target ./plugins/alembic-codex/.mcp.json
codex-plugin-verifier validate --scenarios test/codex-scenarios
codex-plugin-verifier result --run-id 2026-05-16T10-00-00Z-bootstrap-without-ai
```

Alembic 本地脚本：

```bash
node scripts/verify-codex-session-scenarios.mjs --all
node scripts/verify-codex-session-scenarios.mjs --all --target in-process
node scripts/verify-codex-session-scenarios.mjs --all --target packaged-stdio
```

### Scenario 插件化扩展点

通用 scenario schema 只定义通用字段：

```json
{
  "id": "string",
  "target": {},
  "fixture": {},
  "turns": [],
  "expect": {}
}
```

业务扩展放在命名空间里：

```json
{
  "fixture": {
    "project": "minimal-node",
    "extensions": {
      "alembic": {
        "initialized": true,
        "knowledge": "empty",
        "ai": "missing"
      }
    }
  },
  "expect": {
    "extensions": {
      "alembic": {
        "daemonEnsureCalled": false,
        "jobCreated": false,
        "initMarkerWritten": false
      }
    }
  }
}
```

通用 analyzer 只处理通用断言：

- tool call 顺序。
- tool result 字段。
- assistant 文本 must/mustNot。
- secret redaction。
- 文件存在/不存在。
- 进程退出码。

Alembic analyzer 处理 Alembic 断言：

- `projectRootResolution.trust`。
- Codex init marker。
- Ghost workspace facts。
- AI config mask。
- daemon supervisor 调用。
- job API body。
- knowledge usable 状态。

### Skill 的定位

通用插件可以提供一个 `plugin-verifier` skill，但它必须保持薄：

- 解释什么时候用 verifier。
- 告诉 Agent 如何选择 scenario。
- 告诉 Agent 失败时先看 `summary.md`，再看 transcript。
- 明确不要手动“脑补”测试结果。

Alembic 可以另外提供 `alembic-codex-verify` skill：

- 修改 `lib/codex/*` 后跑 preflight 场景。
- 修改 `lib/external/mcp/*` 后跑 stdio 场景。
- 修改 AI 配置和 cold-start 后跑 AI/cold-start 场景。
- action 失败时如何定位 transcript。

Skill 不能替代工程代码。它只是让 Codex 更稳定地使用工程代码。

## 首批必备场景

### 1. 缺 projectRoot 时阻断项目工具

输入：

- 用户要求初始化或 bootstrap。
- runner 不提供可信 `projectRoot`。

预期：

- `alembic_codex_status` 可以返回诊断。
- 非 discovery 工具返回 `CODEX_PROJECT_ROOT_UNRESOLVED`。
- assistant 最终要求提供绝对路径。
- 不写 workspace，不启动 daemon。

### 2. 显式 projectRoot 后保存目录

输入：

- 用户提供绝对项目路径。
- 调用 status 或 init。

预期：

- `projectRootResolution.source` 是 `explicit-option`。
- saved project root 写入隔离的 Codex data root。
- 后续不带 projectRoot 的同 run 调用可以使用 saved-project-root。

### 3. 主动初始化

输入：

- 用户要求“初始化 Alembic”。
- 项目未初始化。

预期：

- Agent 调用 `alembic_codex_status`。
- Agent 调用 `alembic_codex_init`。
- 生成 Codex init marker。
- 不启动 daemon。
- assistant 说明初始化完成，但不声称完成知识挖掘。

### 4. init-on-demand 初始化

输入：

- 用户要求“开始知识挖掘”。
- 项目未初始化。
- AI Provider 已配置。

预期：

- bootstrap 触发 Ghost init。
- 再通过 execute preflight。
- daemon ensure 被调用。
- bootstrap job 创建。
- assistant 只返回 job id / 后续查询动作，不展示大段挖掘内容。

### 5. 缺 AI Provider fail closed

输入：

- 用户要求 bootstrap。
- 项目已初始化但 AI 缺失。

预期：

- `alembic_codex_bootstrap` 返回 `AI_PROVIDER_REQUIRED`。
- `supervisor.ensure` 不调用。
- 不创建 job。
- assistant 要求配置 AI Provider 或选择外部 Agent 路线。

### 6. AI key 配置需要确认

输入：

- 用户提供 key，但没有确认可以通过 Codex tool call 保存。

预期：

- `alembic_codex_ai_config` 返回 `CODEX_AI_SECRET_CONFIRMATION_REQUIRED`。
- 不写 init marker。
- 不写 secrets。
- assistant 要求用户确认。

第二轮输入：

- 用户确认。

预期：

- 写入 settings/secrets。
- transcript 只包含 mask 后 key。
- raw key 不出现在任何输出文件。

### 7. admin 工具隐藏与直调阻断

输入：

- 未设置 admin env，直接调用 admin tool。

预期：

- `tools/list` 不包含 admin tool。
- 直接 call 返回 `CODEX_ADMIN_OPT_IN_REQUIRED`。
- 不启动 daemon。

### 8. knowledge 不可用时核心工具隐藏

输入：

- workspace 初始化但无 usable knowledge。
- 直接调用核心 daemon tool。

预期：

- 返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- assistant 推荐 bootstrap/status，不调用 daemon core tool。

### 9. job 查询只读

输入：

- 用户查询 job 状态。
- workspace 未初始化。

预期：

- 如果 `alembic_codex_job` 保持 init-on-demand，则只做 Ghost init 后读 job store。
- 不启动 daemon。
- 返回 job not found 或列表为空。

这一条需要和当前实现再对齐：如果未来决定 job 查询不应 init-on-demand，场景预期也要同步更新。

## 命令接口草案

建议新增脚本：

```bash
node scripts/verify-codex-session-scenarios.mjs --all
node scripts/verify-codex-session-scenarios.mjs --scenario test/codex-scenarios/preflight/missing-project-root.json
node scripts/verify-codex-session-scenarios.mjs --mode in-process
node scripts/verify-codex-session-scenarios.mjs --mode stdio
node scripts/verify-codex-session-scenarios.mjs --scenario test/codex-scenarios/cold-start/explicit-init.json --project-root /Users/gaoxuefeng/Documents/github/BiliDili
node scripts/verify-codex-session-scenarios.mjs --scenario test/codex-scenarios/cold-start/init-then-bootstrap-ai-ready.json --project-root /Users/gaoxuefeng/Documents/github/BiliDili --real-alembic-home
```

建议 npm script：

```json
{
  "verify:codex-session": "node scripts/verify-codex-session-scenarios.mjs --all --mode in-process",
  "verify:codex-plugin-stdio": "node scripts/verify-codex-session-scenarios.mjs --all --mode stdio"
}
```

CI 首先接入 `verify:codex-session`。`verify:codex-plugin-stdio` 可以先作为 release 前本地验证，稳定后再进 action。

## 实施计划

### 第一阶段：Alembic 内确定性本地场景

实现：

- Scenario schema。
- in-process `CodexMcpServer` harness。
- isolated project fixture。
- fake supervisor / fake daemon / fake fetch。
- TranscriptWriter。
- AgentOutputAnalyzer。
- 首批 preflight、AI config、cold-start 场景。

验收：

- 不联网。
- 不需要真实 AI key。
- 不启动真实 daemon。
- 能断言副作用发生或未发生。
- 失败时输出 transcript 路径和最小原因。

### 第二阶段：Alembic MCP stdio 打包验证

实现：

- 启动 Alembic packaged MCP server。
- 通过 JSON-RPC 调用 `initialize`、`tools/list`、`tools/call`。
- 复用 Scenario 断言。
- 验证 tool schema 和实际打包入口一致。

验收：

- 能发现源码测试通过但插件入口缺工具、schema 错误、路径解析不同的问题。
- 不依赖 Codex Desktop UI。

### 第三阶段：抽象通用 verifier 核心

实现：

- 把 Scenario schema、MCP stdio harness、TranscriptWriter、Redaction、通用 Analyzer 从 Alembic 测试辅助中抽出。
- 保留 AlembicInProcessHarness 在 Alembic 仓库内。
- 定义 `extensions.alembic` 这类业务扩展点。
- 让 Alembic 脚本改为调用通用 verifier 核心。

验收：

- Alembic 现有场景不降级。
- 通用核心可以验证一个最小 mock MCP 插件。
- 通用核心不 import Alembic 运行时代码。

### 第四阶段：通用 Codex 插件壳

实现：

- 创建 `codex-plugin-verifier` 插件 manifest。
- 提供 `plugin-verifier` skill。
- 提供 MCP 工具：status / list / validate / run / result。
- 提供 CLI。
- 支持加载目标插件 `.mcp.json` 或显式 stdio command。

验收：

- 可在任意插件仓库运行 common scenario。
- 可在 Alembic 仓库运行 Alembic scenario pack。
- 输出统一 result/summary/transcript。

### 第五阶段：真实 Agent 冒烟

实现：

- 可选调用真实 `codex exec --json`。
- 读取 stdout JSONL 或 session JSONL。
- 用真实输出 Analyzer 检查最终答复。

验收：

- 只跑少量稳定场景。
- 不作为核心 CI 唯一标准。
- 主要验证 Agent 是否能理解工具返回并给出正确用户提示。

### 第六阶段：回归门禁

实现：

- 每次修改 `lib/codex/*`、`lib/external/mcp/*`、`scripts/release*`、插件 manifest 时触发场景验证。
- action 输出失败场景的 summary 和 transcript artifact。

验收：

- 任何破坏 projectRoot、preflight、AI 配置、tool visibility 的改动都能被场景捕获。

## 安全护栏

### Secret 护栏

- Scenario 中的 fake key 必须登记到 redaction table。
- 任意输出包含 fake key 原文即失败。
- `apiKey` 参数只允许存在于内存事件，写 transcript 前必须替换为 `<redacted:apiKey>`。
- summary 不允许包含 `sk-`、`sk-ant-`、`AIza` 等常见 key 前缀。

### 项目目录护栏

- 场景 projectRoot 必须在 run dir 下，除非显式标记 `externalProjectAllowed=true`。
- 默认禁止对 Alembic 仓库本身执行用户项目初始化场景。
- 不可信 projectRoot 场景必须验证无写入。

### Daemon 护栏

- in-process 默认禁止真实 daemon。
- 如果某场景需要 daemon，必须显式 `daemon: "fake-ready"` 或 `daemon: "real-local"`。
- `real-local` 只允许本地手动运行，不进默认 CI。

### Agent 行为护栏

- 工具结果有 `needsUserInput=true` 时，AgentSimulator 不允许继续调用会产生副作用的工具。
- 工具结果失败时，assistant 不能声称成功。
- 未初始化不等于已挖掘知识，assistant 文案必须区分。

## 与现有测试的关系

现有单元测试继续保留，负责低成本精确覆盖：

- `Preflight` 分支。
- `ToolPolicy` 可见性。
- `CodexMcpServer` handler。
- `WorkspaceSettingsStore` secret 写入。

新增 session scenario 测试负责跨模块行为：

- Agent 是否按工具返回作出正确下一步。
- 一轮会话的最终回答是否准确。
- 多工具组合是否有错误副作用。
- 打包后的 MCP 入口是否与源码一致。

两者不是替代关系。单元测试抓局部逻辑，session scenario 抓真实使用链路。

## 推荐优先级

第一批应该先落地这五个场景：

1. 缺 projectRoot 时要求用户提供目录。
2. 主动 init 只初始化，不启动 daemon。
3. bootstrap 缺 AI Provider fail closed。
4. AI key 配置需要确认并脱敏。
5. init 后 AI ready 时 bootstrap 成功入队。

这五个场景覆盖 Alembic Codex 入口最容易出错、也最影响用户信任的路径。

第二批再补：

1. tools/list 与直调隐藏工具一致。
2. stdio packaged MCP 冒烟。
3. job 查询只读行为。

第三批开始为通用插件做抽象准备：

1. 把 scenario schema 拆出通用字段和 `extensions.alembic`。
2. 把 MCP stdio harness 从 Alembic in-process harness 中解耦。
3. 用一个 mock MCP 插件验证通用 verifier 不依赖 Alembic。
4. 给 Alembic 脚本保留稳定命令，内部实现切到通用核心。

## 当前落地状态

第一阶段 Alembic 内确定性本地场景已经落地为测试辅助模块。

新增工程入口：

```text
scripts/verify-codex-session-scenarios.mjs
npm run verify:codex-session
```

新增核心模块：

```text
test/support/codex-session/
  AgentOutputAnalyzer.ts
  AgentSimulator.ts
  FakeDaemonSupervisor.ts
  Fixtures.ts
  McpHarness.ts
  Redaction.ts
  ScenarioRunner.ts
  ScenarioTypes.ts
  TranscriptWriter.ts
```

新增首批场景：

```text
test/codex-scenarios/preflight/missing-project-root.json
test/codex-scenarios/cold-start/explicit-init.json
test/codex-scenarios/cold-start/bootstrap-missing-ai.json
test/codex-scenarios/cold-start/init-then-bootstrap-ai-ready.json
test/codex-scenarios/ai-config/configure-deepseek-with-confirmation.json
```

新增 Vitest 回归入口：

```text
test/unit/CodexSessionScenarioRunner.test.ts
```

当前能力：

- 使用独立临时项目和独立 `ALEMBIC_HOME`。
- 支持 `--project-root` 绑定本地测试项目。
- 支持 `--real-alembic-home` 手动使用真实 `~/.asd` 验证。
- transcript 记录 `projectRootSource` 与 `alembicHomeMode`。
- Analyzer 默认检查 tool call 的 `projectRoot` 缺失和漂移。
- 场景期望支持 `$projectRoot` 占位断言。
- Analyzer 可断言 `initializedAfterRun`、AI ready/provider、workspace 文件状态。
- 运行产物包含 `run-config.json`，便于真实测试回放时确认没有漂移。
- `--real-alembic-home` 有单场景、显式项目、禁止指向 Alembic 仓库的护栏。
- 使用 in-process `CodexMcpServer` harness。
- 使用 fake daemon supervisor。
- 使用 fake fetch 捕获 daemon job API。
- 写入脱敏 transcript。
- 分析 tool call 顺序、工具返回、assistant 最终答复、副作用和 secret 泄露。
- 覆盖缺项目目录、主动初始化、缺 AI 阻断 bootstrap、AI key 确认保存、init 后 bootstrap 入队五条链路。

当前限制：

- `--mode in-process` 已实现。
- packaged stdio MCP 模式还未实现。
- 通用 `codex-plugin-verifier` 插件壳还未抽出。
- 真实 `codex exec --json` 冒烟还未接入。

这些限制是后续阶段的明确边界，不影响第一阶段作为 Alembic Codex 会话回归门禁使用。

## 最终判断

Alembic 不需要 Lark Remote 那套完整远程接管系统，但应该吸收它的会话工程经验：明确绑定、可恢复状态、结构化事件、忙碌/权限边界、脱敏诊断、最终产出解析。

最稳的落点是先在 Alembic 内做一个确定性的 `Codex Session Scenario Runner`。它把“用户怎么说、Agent 应该怎么调用工具、工具应该如何返回、Agent 最终应该怎么告诉用户”固化成场景资产。

等 Alembic 场景稳定后，再把通用部分抽成 `codex-plugin-verifier`。这样后续 Alembic 冷启动、知识挖掘、知识注入、Recipe 提交能继续用同一套验证框架推进，其他 Codex 插件也能复用同一套验证器，而不会把 Alembic 业务规则硬塞进通用插件。
