# Codex 统一 Preflight 层设计与实现记录

## 背景

Alembic Codex 插件的每次 MCP 调用都可能发生在不同会话状态下：Codex 重启、项目目录未注入、用户手动传入 `projectRoot`、Ghost workspace 尚未初始化、知识库为空、AI Provider 未配置、daemon 未启动、admin tier 未显式启用。

因此，Codex 侧不能依赖“上一次对话已经确认过”。每次 Alembic 与 Codex 交互前，都需要一个完整、独立、可恢复的前置检查。如果缺少关键信息，工具应返回结构化结果，让 Codex 向用户申请信息或确认，而不是猜测、降级或继续执行。

## 现有真实链路

### Codex MCP 入口

核心文件：

- `lib/external/mcp/CodexMcpServer.ts`
- `lib/codex/ProjectRootResolver.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/StatusService.ts`

原入口逻辑集中在 `CodexMcpServer.handleToolCallInCurrentProject()`：

1. 检查 `projectRootResolution` 是否可信。
2. 读取 `inspectCodexKnowledge(projectRoot)`。
3. 使用 `isToolAllowedForCodexKnowledge()` 判断工具是否可用。
4. 对 `dashboard/bootstrap/rescan/job` 做 init-on-demand。
5. 进入具体 tool handler。

问题是这几类判断揉在入口里：

- projectRoot 门禁
- knowledge gate
- init-on-demand
- admin tier
- AI Provider
- 用户确认
- tool visibility

这会导致后续每加一个能力，都容易在 `CodexMcpServer` 里继续追加分支。

### ToolPolicy 现状

`lib/codex/ToolPolicy.ts` 负责“哪些工具可见”：

- 未初始化：只暴露 status / diagnostics / init / cold-start 相关工具。
- 已初始化但无知识：继续只暴露 cold-start 相关工具。
- 知识可用：暴露全部 Codex local tools 与 agent tier core tools。
- admin tier 需要 `ALEMBIC_CODEX_ENABLE_ADMIN=1` 二次开关。

它的问题不是能力不足，而是只参与了 list tools。旧入口在真正执行 tool call 时没有完整复用这个 policy，因此存在“隐藏工具被直接调用仍可能走 daemon”的缺口。

### AI 配置链路

核心文件：

- `lib/shared/WorkspaceSettingsStore.ts`
- `lib/http/routes/ai.ts`
- `lib/external/ai/AiFactory.ts`

已有能力：

- workspace `settings.json` 保存 provider / model / proxy / reasoning effort。
- workspace `secrets.json` 保存 API key，权限 `0600`。
- `applyToProcessEnv()` 能把 workspace 配置应用到当前进程。
- HTTP Dashboard 路由已有 mask 后配置读写。

缺口：

- Codex MCP local tools 没有 AI 配置状态。
- `alembic_codex_bootstrap` 缺少“内部 AI Provider 必须真实可用”的执行前门禁。
- 没有统一字段告诉 Codex 缺哪个 key、是否可以 internal bootstrap。

## 设计原则

### 1. ToolPolicy 决定可见性，Preflight 决定可执行性

`ToolPolicy` 不启动 daemon，不写文件，只回答“这个状态下应该展示哪些工具”。

`Preflight` 也默认不执行业务逻辑，只回答“这次调用能不能继续，如果不能，缺什么”。

具体执行仍由 `CodexMcpServer` 的 tool handler 负责。

### 2. Preflight 允许分阶段

有些工具支持 init-on-demand，例如 `alembic_codex_bootstrap`。如果 workspace 未初始化，第一次 preflight 不能直接失败，而应该告诉入口“先初始化，再复核”。

因此当前实现分两段：

```text
preflight(before-auto-init)
  -> 如果需要并允许 auto-init，执行 Ghost init
preflight(execute)
  -> 复核 projectRoot / policy / AI / admin / knowledge
  -> 执行 handler
```

### 3. 缺关键信息必须结构化返回

返回结构必须包含：

- `success: false`
- `data.errorCode`
- `data.needsUserInput`，如果需要用户提供信息
- `data.required`
- `data.requiredActions`
- `data.nextActions`

这样 Codex Agent 可以把缺失项转成自然语言提示，而不是猜流程。

### 4. discovery 工具必须轻量

`alembic_codex_status` 和 `alembic_codex_diagnostics` 必须能在 projectRoot 不可信时运行，用来解释为什么不能继续。

它们不能：

- 初始化 workspace
- 启动 daemon
- 调用 AI
- 写入 secrets

## 已落地实现

### `CodexAiConfigState`

新增文件：

- `lib/codex/AiConfigState.ts`

职责：

- 合并 workspace settings/secrets 与 process env。
- 推断 provider。
- 计算 `requiredKeyEnv` / `missingKeyEnv`。
- 判断 `allowsInternalBootstrap`。
- mask secret，不返回明文 key。

关键状态：

```ts
interface CodexAiConfigState {
  allowsInternalBootstrap: boolean;
  ready: boolean;
  provider: string | null;
  model: string | null;
  requiredKeyEnv: string | null;
  missingKeyEnv: string | null;
  source: "workspace-settings" | "runtime-overrides" | "empty";
  vars: Record<string, string>;
}
```

`StatusService` 现在会返回 `aiConfig`，Codex 可以直接看到：

- 当前 provider 是否配置。
- key 是否缺失。
- 内部 bootstrap 是否允许启动。
- 返回中不会泄露原始 key。

### `Codex Preflight`

新增文件：

- `lib/codex/Preflight.ts`

职责：

- 校验工具是否存在。
- 校验 projectRoot 是否可信。
- 复用 `resolveCodexToolPolicy()` 校验工具是否在当前状态下可见。
- 阻断未启用 admin opt-in 的 admin tool 直接调用。
- 给 init-on-demand 工具返回 `autoInit: true`。
- 对 internal AI job 工具执行 AI Provider 门禁。

当前 internal AI 门禁覆盖：

- `alembic_codex_bootstrap`
- `alembic_codex_rescan`

如果缺 AI Provider，返回：

```text
AI_PROVIDER_REQUIRED
```

并带上缺失的 provider / key env 信息。

### Codex MCP 入口集成

`CodexMcpServer.handleToolCallInCurrentProject()` 已改为：

```text
knowledge = inspectCodexKnowledge(projectRoot)

initialPreflight = preflight(before-auto-init)
if blocked -> return failure

if initialPreflight.autoInit
  runWorkspaceInitialization()
  knowledge = inspectCodexKnowledge(projectRoot)

executePreflight = preflight(execute)
if blocked -> return failure

switch tool -> handler
```

这让入口逻辑从“一串混合 if”变成统一裁决流程。

### Codex AI 配置工具

新增 local tool：

- `alembic_codex_ai_config`

模式：

- `status`：返回 mask 后 AI 配置状态。
- `configure`：写入 workspace settings/secrets，并应用到当前进程。

安全规则：

- `apiKey` 存在时必须传 `confirmChatSecret=true`。
- 未确认时不初始化、不写文件。
- API key 不进入返回值。
- 写入后只返回 mask 状态。
- 如果 workspace 未初始化，configure 会先执行 Ghost init-on-demand，再写入对应 Ghost dataRoot。

## 工具前置矩阵

| 工具类别 | 代表工具 | projectRoot | 初始化 | knowledge | AI Provider | daemon | 用户确认 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| discovery | `status`, `diagnostics` | 可不可信 | 不需要 | 不需要 | 不需要 | 不启动 | 不需要 |
| init | `alembic_codex_init` | 必须可信 | 执行初始化 | 不需要 | 不需要 | 不启动 | `standard/force` 参数由用户显式传入 |
| AI 配置 | `alembic_codex_ai_config` | 必须可信 | configure 可 on-demand | 不需要 | 不要求已存在 | 不启动 | 写 key 需 `confirmChatSecret=true` |
| job 查询 | `alembic_codex_job` | 必须可信 | 可 on-demand | 不需要 | 不需要 | 只 status，不 ensure | 不需要 |
| internal bootstrap | `alembic_codex_bootstrap` | 必须可信 | 可 on-demand | 不需要 | 必须可用 | ensure daemon | 后续 cold-start 入口可加 `confirmStart` |
| internal rescan | `alembic_codex_rescan` | 必须可信 | 可 on-demand | 当前可见 | 必须可用 | ensure daemon | 后续可加 token 成本确认 |
| core read | `alembic_search`, `alembic_health` | 必须可信 | 必须已初始化 | 必须 usable | 不需要 | ensure daemon | 不需要 |
| core write | `submit`, `skill`, `task` | 必须可信 | 必须已初始化 | 必须 usable | 视工具而定 | ensure daemon | 由 tool schema / gateway 控制 |
| admin | `knowledge_lifecycle` | 必须可信 | 必须已初始化 | 必须 usable | 不需要 | ensure daemon | `ALEMBIC_CODEX_ENABLE_ADMIN=1` |
| cleanup | `alembic_codex_cleanup` | 必须可信 | 不强制 knowledge | 不需要 | 不需要 | stop only when confirmed | `confirm=true` |

## 已覆盖测试

更新测试：

- `test/unit/CodexMcpServer.test.ts`
- `test/unit/CodexToolPolicy.test.ts`
- `test/unit/CodexStatusService.test.ts`

覆盖点：

- local tools 列表包含 `alembic_codex_ai_config`。
- AI config 写 key 必须 `confirmChatSecret=true`。
- 未确认 secret 不初始化、不写入。
- AI config 返回 mask 后状态。
- `alembic_codex_bootstrap` 缺 AI Provider 时 fail closed，不启动 daemon。
- 配置 DeepSeek key 后 bootstrap 才会入队 daemon job。
- 直接调用 admin tool 时，如果没有 Codex admin opt-in，会被 preflight 阻断。
- status 返回 `aiConfig`，且不会泄露 daemon token 或 AI key。

## 验证结果

已通过：

```bash
npx biome check lib/codex/AiConfigState.ts lib/codex/Preflight.ts lib/codex/index.ts lib/codex/StatusService.ts lib/codex/ToolPolicy.ts lib/external/mcp/CodexMcpServer.ts lib/external/mcp/tools.ts test/unit/CodexMcpServer.test.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts
npx vitest run test/unit/CodexMcpServer.test.ts test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts test/unit/WorkspaceSettingsStore.test.ts
npm run build
```

全仓库 `npm run lint` 当前仍会被历史 lint 问题阻断，主要在 `lib/agent/context`、`lib/agent/memory`、`scripts/release.ts` 等非本次改动文件。本次改动文件的 Biome check 已通过。

## 后续切片

### 1. cold-start 统一入口

下一步可以新增：

- `alembic_codex_cold_start`

它应复用当前 preflight：

- route 未选时返回路线选择。
- internal route 检查 `aiConfig.allowsInternalBootstrap`。
- external route 不要求 Alembic AI key。
- internal route 启动前可加入 `confirmStart=true`，明确真实 provider token 成本。

### 2. Job 结果瘦身

当前 `jobs.ts` 仍会把 `job` 原样返回。应继续做：

- 默认剥离 `result`。
- 只返回 `progress` / `summary` / `job meta`。
- detail 查询也要剥离 `analysisText` 等长字段。

### 3. 细化工具级 requirements

当前 preflight 仍以内置 set 管理特殊工具：

- init-on-demand set
- discovery set
- internal AI set

后续可以把它提升为显式 requirements registry：

```ts
{
  tool: "alembic_codex_bootstrap",
  requires: {
    trustedProjectRoot: true,
    init: "on-demand",
    aiProvider: "internal",
    daemon: "ensure",
    confirmation: "token-cost"
  }
}
```

这样新增工具时不用再散落修改多个判断点。

## 当前结论

统一 preflight 层应该成为所有 Codex-Alembic 交互的固定入口。它不负责执行业务，但负责拒绝不安全或信息不足的调用，并把缺失信息结构化返回给 Codex。

这能避免三类高风险假成功：

- 目录不可信但继续初始化或扫描。
- 知识库为空但调用项目知识工具。
- 内部 bootstrap 没有真实 AI Provider，却进入 mock / 空产出路径。
