# Codex 会话式冷启动入口设计

## 背景

Alembic 的 Codex 插件冷启动入口将从 Dashboard / 独立 UI 转向 Codex 会话输入。用户第一次在 Codex 中使用 Alembic 时，Agent 需要能判断项目目录、初始化状态、AI Provider 配置、知识库状态，并用清晰的会话提示引导用户选择冷启动路线。

这个入口不能只是把 `alembic_codex_init` 和 `alembic_codex_bootstrap` 串起来。冷启动会触发全项目扫描、AI 分析、Recipe 生成与本地持久化，必须在关键前置条件不满足时 fail closed，并把需要用户决策的地方显式抛给 Codex / 用户。

## 当前真实代码链路

### Codex 项目目录门禁

相关代码：

- `lib/codex/ProjectRootResolver.ts`
- `lib/external/mcp/CodexMcpServer.ts`
- `lib/codex/StatusService.ts`

当前 `resolveCodexProjectRoot()` 的可信来源包括：

- 显式 `projectRoot` 参数
- `ALEMBIC_PROJECT_DIR`
- `CODEX_WORKSPACE_DIR`
- `CODEX_WORKSPACE_ROOT`
- 已保存的 `codex-project-root.json`

`INIT_CWD`、`PWD`、`process.cwd()` 只作为 fallback，不会被当成可信项目目录。`CodexMcpServer.handleToolCallInCurrentProject()` 已经在非 discovery 工具前做了目录门禁：目录不可信时返回 `CODEX_PROJECT_ROOT_UNRESOLVED` 或 `CODEX_PROJECT_ROOT_REJECTED`。

这个判断应该继续作为会话式冷启动的第一道硬门槛：没有可信项目目录，就不要初始化、不要写入、不要启动 daemon、不要扫描。

### 初始化链路

相关代码：

- `lib/external/mcp/CodexMcpServer.ts`
- `lib/cli/SetupService.ts`
- `lib/shared/WorkspaceResolver.ts`

当前有两条初始化路线：

- 用户主动调用 `alembic_codex_init`
- 用户调用 init-on-demand 工具时自动执行 `ensureWorkspaceInitializedForTool()`

`SetupService` 在 `codex-plugin` profile 下默认使用 Ghost 模式，把运行时、数据库、知识目录放到外置 dataRoot，避免直接污染用户仓库。初始化内容包括：

- 运行时目录与 `config.json`
- Alembic 知识目录、`recipes/`、`skills/`、`candidates/`
- SQLite 数据库
- 向量索引
- Codex 初始化 marker

初始化只建立底座，不等同于完成知识挖掘。

### AI Provider 配置链路

相关代码：

- `lib/shared/WorkspaceSettingsStore.ts`
- `lib/http/routes/ai.ts`
- `lib/external/ai/AiFactory.ts`
- `lib/external/ai/registry/ProviderConfig.ts`

当前已有 workspace 级 AI 配置读写能力：

- `settings.json` 保存 provider、model、proxy、reasoningEffort、embed 配置
- `secrets.json` 保存 provider API key，文件权限为 `0600`
- `WorkspaceSettingsStore.applyToProcessEnv()` 在 Alembic 初始化时把配置应用到进程环境
- HTTP 路由 `/api/v1/ai/workspace-config` 可以读写配置，并返回 mask 后的变量

但 Codex MCP 本地工具目前没有一个会话友好的 AI 配置入口。Codex status 只暴露了 `workspace.secretsExists/settingsExists`，没有明确告诉 Agent：

- 当前是否有真实 LLM Provider
- 当前 provider 是谁
- 缺哪个 key
- 应该让用户设置哪个环境变量
- 是否允许继续 internal bootstrap

这是会话式冷启动需要补齐的核心缺口。

### 冷启动挖掘路线

相关代码：

- `lib/workflows/cold-start/ColdStartIntent.ts`
- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/workflows/cold-start/external/ExternalColdStartWorkflow.ts`
- `lib/daemon/DaemonJobRunner.ts`

当前有两类冷启动执行器：

- internal-agent：Alembic 自己的 AgentRuntime 自动分析项目并生成 Recipe，需要真实 AI Provider。
- external-agent：Alembic 只完成 Phase 1-4 项目分析并返回 Mission Briefing，外部 Agent 负责阅读、提交知识、完成维度。

Codex 插件现在暴露的 `alembic_codex_bootstrap` 走 daemon job，并调用 internal bootstrap。它适合作为自动化主路线，但在没有真实 AI Provider 时不应该继续运行。

## 会话式入口目标

Codex 冷启动入口应该表现为一个可恢复的状态机，而不是一次性命令：

1. 确认可信项目目录。
2. 确认 Alembic workspace 是否已初始化。
3. 确认用户要走哪条冷启动路线。
4. 如果选择内部自动挖掘，确认 AI Provider 是否可用。
5. 配置缺失时，明确提示用户配置方式。
6. 配置满足后启动 bootstrap job。
7. 后台 job 只向 Codex 返回轻量状态，详细分析保留在本地。

## 用户可选路线

### 路线 1：Alembic 内部自动挖掘

推荐作为默认路线。

适用场景：

- 用户愿意为 Alembic 配置 DeepSeek / OpenAI / Claude / Gemini / Ollama。
- 希望后台自动扫描并生成初始 Recipe。
- 希望 Codex 会话只看到轻量进度，不被大段分析结果占用上下文。

必要前置：

- `projectRoot` 可信
- workspace 已初始化
- 有真实 AI Provider，不能是 mock
- 对应 provider 的 API key 已存在，或 provider 是本地 Ollama

启动动作：

- 若未初始化，先执行 Ghost 初始化。
- 若 AI 配置缺失，返回配置提示，不启动 bootstrap。
- AI 配置可用后，调用 `alembic_codex_bootstrap` 入队 daemon job。

### 路线 2：Codex / 外部 Agent 辅助挖掘

作为无 Alembic API key 时的可选路线。

适用场景：

- 用户不想给 Alembic 配置额外 AI key。
- 用户愿意使用当前 Codex 会话 token 完成首次知识挖掘。
- 需要人工更强地参与初始 Recipe 质量控制。

必要前置：

- `projectRoot` 可信
- workspace 已初始化
- 外部冷启动 Mission Briefing 能被 Codex 获取
- Codex 需要逐维度提交知识，而不是让 Alembic 内部 AgentRuntime 自动跑

代价：

- 会消耗 Codex 会话上下文和 token。
- 不适合大型项目的一次性全量分析展示。
- 需要把 Mission Briefing 和维度任务做摘要化，避免把全量项目材料塞回 Codex。

这条路线不应该伪装成后台自动挖掘。它是明确的外部 Agent 协作路线。

### 路线 3：仅初始化，稍后挖掘

适用场景：

- 用户只是想先安装 / 初始化 Alembic。
- 暂时没有 API key。
- 暂时不想产生 Recipe。

动作：

- 执行 Ghost 初始化。
- 返回当前状态、配置路径、后续可选路线。
- 不启动 daemon job。

## 会话状态机

| 状态 | 判断条件 | Codex 应提示 | 允许自动动作 |
| --- | --- | --- | --- |
| `project_root_unresolved` | projectRoot 不可信 | “Alembic 需要目标项目绝对路径，请提供 projectRoot。” | 无 |
| `runtime_issue` | Codex runtime / plugin 诊断失败 | “运行时未就绪，请先查看 diagnostics。” | 无 |
| `needs_init` | workspace 未初始化 | “是否为当前项目初始化 Alembic Ghost workspace？” | 用户已请求 bootstrap 时可 on-demand 初始化 |
| `route_required` | 已初始化但没有知识，未选择路线 | “请选择内部自动挖掘、Codex 辅助挖掘、仅初始化。” | 无 |
| `ai_config_required` | 选择 internal，但无真实 AI Provider | “请选择 provider 并配置 API key，或改走 Codex 辅助路线。” | 无 |
| `ready_to_bootstrap` | internal 前置满足 | “可以启动后台挖掘，会消耗 provider token。” | 可入队 bootstrap job |
| `bootstrap_running` | bootstrap job 正在运行 | “后台挖掘进行中，可查询轻量状态。” | 可查询 job summary |
| `knowledge_ready` | Recipe 或 Skill 已存在且可用 | “可以 prime Codex 或按需 rescan。” | 可 prime / rescan |

## AI 配置交互设计

### 配置来源优先级

1. 已保存 workspace settings / secrets。
2. 进程环境变量。
3. 用户在 Codex 会话中主动提供。

`WorkspaceSettingsStore.readAiConfig()` 已经能合并 workspace settings 与 secrets。`readLlmConfig()` 还能叠加进程环境变量并 mask secret。Codex MCP 侧应该复用这套能力，避免再建一套配置格式。

### 会话提示原则

Codex 不应该默认要求用户把 API key 粘贴到聊天里。默认提示应先给安全选项：

- 设置环境变量，例如 `ALEMBIC_DEEPSEEK_API_KEY`
- 或把 key 写入 Alembic workspace `secrets.json`
- 或用户确认愿意在 Codex 会话中输入 key，再由工具写入 `secrets.json`

如果用户选择在会话中输入 key，需要明确说明：

- key 会经过 Codex 会话与 MCP tool call。
- Alembic 不会在返回值、日志、job 结果中回显原文。
- 本地持久化后只返回 mask 后状态。

### 建议新增 Codex 本地工具

新增 `alembic_codex_ai_config`：

```ts
{
  mode: "status" | "configure",
  projectRoot?: string,
  provider?: "deepseek" | "openai" | "claude" | "google" | "ollama",
  model?: string,
  apiKey?: string,
  baseUrl?: string,
  reasoningEffort?: string,
  confirmChatSecret?: boolean
}
```

行为：

- `status`：只返回 mask 后配置、是否 ready、缺失的 key env、推荐 nextActions。
- `configure`：写入 `WorkspaceSettingsStore.writeAiConfig()`，立即 `applyToProcessEnv({ override: true })`，返回 mask 后配置。
- `apiKey` 存在但 `confirmChatSecret !== true` 时拒绝，提示用户确认 key 会经过 Codex 会话。
- 永远不回显原始 API key。
- 写入后可热重载 AI Provider；若热重载失败，返回“重启 daemon 后生效”。

### AI ready 判定

新增 Codex 侧 `CodexAiConfigState`：

```ts
interface CodexAiConfigState {
  ready: boolean;
  provider: string | null;
  model: string | null;
  source: "workspace-settings" | "runtime-overrides" | "empty";
  requiredKeyEnv: string | null;
  missingKeyEnv: string | null;
  allowsInternalBootstrap: boolean;
  secretsPath: string;
  settingsPath: string;
  vars: Record<string, string>;
}
```

规则：

- provider 为 `ollama` 时可不要求 API key，但需要后续 provider probe。
- provider 为 `mock` 或 `auto` 且没有任何真实 key 时，`allowsInternalBootstrap=false`。
- provider 为 `deepseek/openai/claude/google` 时，必须存在对应 key。
- key 只以 mask 形式出现。

## 冷启动入口工具设计

建议新增一个会话入口工具 `alembic_codex_cold_start`，由它统一做前置检查和返回下一步提示，而不是让 Codex Agent 记住多个低层工具的顺序。

```ts
{
  projectRoot?: string,
  route?: "internal-ai" | "external-agent" | "init-only",
  provider?: "deepseek" | "openai" | "claude" | "google" | "ollama",
  model?: string,
  maxFiles?: number,
  contentMaxLines?: number,
  confirmStart?: boolean
}
```

行为分层：

1. projectRoot 不可信：返回 `project_root_unresolved`，不写入。
2. runtime 诊断失败：返回 `runtime_issue`，不写入。
3. 未初始化：如果用户只是在询问状态，返回 `needs_init`；如果用户明确要 cold start，可先执行 Ghost 初始化。
4. route 缺失：返回三条路线选择。
5. route 为 `init-only`：完成初始化后停止。
6. route 为 `internal-ai`：检查 AI config；缺失则返回 `ai_config_required`。
7. route 为 `external-agent`：启动外部 cold-start briefing，不调用内部 AI。
8. route 为 `internal-ai` 且配置满足：需要 `confirmStart=true` 后入队 bootstrap job。

这里的 `confirmStart` 不是为了增加摩擦，而是因为内部路线会消耗真实 AI provider token；Codex 会话入口应该把这个成本边界说清楚。

## Token 与展示护栏

后台 DeepSeek / OpenAI 扫描不应与 Codex 做逐轮展示。Codex 只应该看到：

- jobId
- status
- progress
- counts
- errors
- compact summary
- nextActions

默认不返回：

- `analysisText`
- `dimensionStats`
- `finalSession`
- 大段 Mission Briefing
- 原始 tool transcript

详细产物保存到本地 DB、JobStore 或报告文件。Codex 需要时再按维度、按摘要、按显式 detail 参数查询。

## 必须修正的边界

### 内部 bootstrap 无 AI Provider 时必须硬失败

当前 `autoDetectProvider()` 在没有 key 时返回 mock provider。对 Dashboard 的某些旧功能这可能是可接受的降级，但对 Codex 会话式冷启动不合适。

Codex internal bootstrap 的前置检查必须在入队前拒绝：

```text
AI_PROVIDER_REQUIRED
内部自动知识挖掘需要真实 AI Provider。请配置 API key，或选择 Codex / 外部 Agent 辅助挖掘路线。
```

不要出现“任务 completed 但没有 Recipe”的成功状态。

### Codex job 查询默认不能返回大 result

当前 jobs API 的 `decorateJobForResponse()` 会 `...job` 原样返回，完成后的 job 可能带 `result.finalSession`。会话式入口要同步做结果瘦身：

- 默认只返回 `job` 的元信息、`progress`、`summary`。
- `result` 需要显式 `includeResult=true` 或专门 detail 工具。
- 即使 detail，也应剥离 `analysisText` 等长字段，除非用户明确请求具体维度详情。

### API key 不能进入日志或返回值

新增 AI 配置工具和 cold-start 工具都必须：

- 原始 key 不写日志。
- 原始 key 不进入 MCP response。
- 原始 key 不进入 daemon job request/result。
- `secrets.json` 保持 `0600`。
- 测试覆盖 mask 与权限。

## 实现切片

### 切片 1：Codex AI 配置状态

- 新增 `lib/codex/AiConfigState.ts`。
- 复用 `WorkspaceSettingsStore`、`PROVIDER_KEY_ENV`、`maskAiRuntimeConfig()`。
- `buildCodexStatus()` 增加 `aiConfig` 字段。
- `buildCodexStatusOnboarding()` 在 `needs_bootstrap` 前后加入 AI 配置提示。

验收：

- 无 key 时 status 明确返回 `allowsInternalBootstrap=false`。
- 有 `ALEMBIC_DEEPSEEK_API_KEY` 时 status 返回 provider / key mask / ready。
- workspace secrets 存在时无需环境变量也能 ready。

### 切片 2：Codex AI 配置 MCP 工具

- 在 `CODEX_LOCAL_TOOLS` 增加 `alembic_codex_ai_config`。
- 在 `CodexMcpServer` 增加 handler。
- `status` 模式不启动 daemon。
- `configure` 模式写入 workspace settings/secrets。

验收：

- `apiKey` 未确认时拒绝。
- 写入后 `secrets.json` 权限为 `0600`。
- 返回值只包含 mask。

### 切片 3：会话式 cold-start 入口

- 新增 `alembic_codex_cold_start`。
- 内部复用现有 `initializeWorkspace()`、`enqueueJob('bootstrap')`。
- route 缺失时只返回选择提示。
- internal route 在 AI 配置缺失时不启动 job。
- init-only route 初始化后停止。

验收：

- 不可信 projectRoot 时 fail closed。
- 未初始化 + internal route 可先 Ghost 初始化，再检查 AI config。
- 无 AI Provider 时返回 `AI_PROVIDER_REQUIRED`。
- 有 AI Provider + `confirmStart=true` 时返回 jobId。

### 切片 4：external-agent 路线接入

- 确认 Codex 插件是否要暴露外部 cold-start briefing。
- 如果暴露，返回必须是摘要化 Mission Briefing，不把全量项目材料塞入 Codex。
- Codex 后续按维度调用 submit / dimension_complete。

验收：

- 不消耗 Alembic AI key。
- 返回数据大小可控。
- 用户明确选择该路线才启动。

### 切片 5：bootstrap job 结果瘦身

- jobs API 默认剥离 `result`。
- `alembic_codex_job` 增加 `includeResult` / `detail` 参数时再返回受控详情。
- 完成态 summary 包含 Recipe count、Skill count、created/rejected/failed counts。

验收：

- 查询 running job 只返回轻量进度。
- 查询 completed job 不会把 `analysisText` 带回 Codex。

## 推荐会话文案

项目目录缺失：

```text
Alembic 需要目标项目目录才能初始化和扫描。请提供当前项目的绝对路径，例如 projectRoot: "/path/to/project"。
```

需要选择路线：

```text
Alembic 已准备好冷启动。请选择路线：
1. 内部自动挖掘：配置 DeepSeek/OpenAI/Claude/Gemini/Ollama 后，Alembic 在后台生成 Recipe。
2. Codex 辅助挖掘：不配置 Alembic API key，但会使用当前 Codex 会话读取摘要并提交知识。
3. 仅初始化：先创建 Alembic 工作区，稍后再挖掘。
```

需要 AI key：

```text
你选择了内部自动挖掘，但 Alembic 还没有可用 AI Provider。请配置 provider 和 API key，或改选 Codex 辅助挖掘。推荐 DeepSeek 时需要 ALEMBIC_DEEPSEEK_API_KEY。
```

准备启动：

```text
Alembic 将在后台扫描项目并调用已配置的 AI Provider 生成 Recipe。Codex 只会接收轻量 job 状态，详细分析保存在本地。确认后开始。
```

## 最终判断

会话式冷启动入口的核心不是“自动帮用户一路跑完”，而是把不可推断的选择显式化：

- 项目目录无法可信确定时，必须让用户提供。
- 用户没有选择挖掘路线时，必须让用户选择。
- 内部自动挖掘没有 AI Provider 时，必须让用户配置或改路线。
- 涉及真实 token 消耗时，必须让用户确认。

底层初始化和 daemon job 可以自动化，但用户意图、密钥配置、成本边界不能隐藏在自动化里。
