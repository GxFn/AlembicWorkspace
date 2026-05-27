# AlembicAgent CCIC-P1-G 执行记录

日期：2026-05-22

窗口定位：`AlembicAgent` 执行窗口。

目标仓库职责：`AlembicAgent` 负责 Alembic internal Agent runtime、AI provider adapter、tool system、memory/context/prompt、执行循环、宿主注入 adapter contract 和可观测事件。

本轮任务职责：完成 `CCIC-P1-G`，只做 `host agent` / internal Agent runtime 口径清洁，避免把 AlembicAgent 误当成 Codex Plugin host-agent route 或 MCP/channel/marketplace 承载仓库。

明确不承担：不修改 `AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`Alembic` 或 `AlembicTest`；不实现 Codex MCP server；不接入 marketplace/channel；不改变 AI provider、Tool V2、runtime 行为或 Core deterministic code。

## 完成范围

- 更新 `AlembicAgent/AGENTS.md`，将仓库定位从容易混淆的“宿主 Agent 能力”收敛为 Alembic internal Agent runtime、宿主注入 adapter contract 和可复用执行逻辑。
- 更新 `src/agent/runtime/AgentRuntimeBoundary.ts`，明确 `host-agent-route` 归宿主 / Plugin，AlembicAgent 只暴露 internal runtime contracts。
- 更新 `src/agent/runtime/AgentMessage.ts`，把 MCP 相关注释改为 host/plugin adapter 注入的 MCP-like 消息归一化，不声明本仓库实现 Codex MCP server。
- 更新 `src/agent/index.ts`、`src/tools/core/LightweightRouter.ts`、`src/tools/v2/adapter/V2ToolRouterAdapter.ts`，补充 Codex MCP / marketplace / channel 由 Plugin 承载，AlembicAgent 只消费宿主注入 adapter/context。

## 提交 Hash

- AlembicAgent：`929cded9e449823f0f6e4feae27f15f249352c3a`

## 验证命令

```bash
npm run build:check
npm run test -- test/contract-surface.test.ts
git diff --check
```

## 验证结果

- `npm run build:check`：通过。
- `npm run test -- test/contract-surface.test.ts`：通过，1 个测试文件、5 个测试用例通过。
- `git diff --check`：通过，无 whitespace error。

## 复核记录（2026-05-23）

复核前重新读取：

- `AGENTS.md`
- `docs/workspace/index.md`
- `docs/workspace/workspace-current-status.md`
- `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md`
- `AlembicAgent/AGENTS.md`

Alembic Codex 状态：`alembic_codex_status` / `alembic_codex_diagnostics` 显示 AlembicAgent 未初始化项目知识库，且当前 Codex 插件诊断存在 `NPM_UNAVAILABLE`、`NPX_UNAVAILABLE`、`PLUGIN_RUNTIME_PIN_MISMATCH`。本次复核不使用项目记忆作为证据，只使用本地文件、提交 diff、扫描和验证命令；这些插件运行态问题不属于 CCIC-P1-G 的 AlembicAgent 代码变更范围。

### 复核结论

- 是否误删真实消费方：未发现。提交 `929cded9e449823f0f6e4feae27f15f249352c3a` 仅修改 6 个文件，均为 `M`，无删除文件、无 rename、无 package exports / imports / public subpath 变更。`git show --summary --diff-filter=D --format=oneline 929cded9e449823f0f6e4feae27f15f249352c3a` 无删除输出。
- 是否改变职责边界：未改变 runtime 职责，只把已有计划边界写清。Agent 仍 owns internal agent runtime、AI provider、tool system、memory/context/prompt、宿主注入 adapter contract；Codex MCP server、marketplace、channel、host-agent route 仍归 Plugin / host。`AgentRuntimeBoundary` 仍保持 `runtimeLine: 'alembic-internal-ai'`、`hostAgentRouteSupported: false`、`unsupportedHostRoutes` 包含 `codex-mcp` / `codex-marketplace` / `plugin-host-agent-route`。
- 兼容字段 / 兼容入口保留或删除证据：本轮没有删除兼容字段、route、public export 或 tool adapter。`Channel.MCP`、`McpRequest`、`fromMcp`、`ALEMBIC_MCP_MODE`、`unsupportedHostRoutes`、`hostAgentRouteSupported:false` 均仍在；本轮只把注释改为 MCP-like / host adapter 归一化语义。
- 负向扫描：旧混淆口径 `MCP (IDE 扩展)`、`MCP request shape`、`从 MCP 请求构建`、`宿主 Agent 能力`、`宿主 Agent 接入 adapter`、`MCP 工具`、`Workflow / MCP 等平台适配器` 在 `AGENTS.md src` 下无命中。
- 正向边界证据：`AGENTS.md`、`AgentRuntimeBoundary.ts`、`AgentMessage.ts`、`agent/index.ts`、`LightweightRouter.ts`、`V2ToolRouterAdapter.ts` 均明确写出 Codex MCP / marketplace / channel / host-agent route 不在 AlembicAgent 实现，AlembicAgent 只消费宿主注入的 adapter/context 或暴露 internal runtime contract。

### 复核命令

```bash
git show --name-status --stat --oneline 929cded9e449823f0f6e4feae27f15f249352c3a
git show --summary --diff-filter=D --format=oneline 929cded9e449823f0f6e4feae27f15f249352c3a
rg -n "MCP \(IDE 扩展\)|MCP request shape|从 MCP 请求构建|宿主 Agent 能力|宿主 Agent 接入 adapter|MCP 工具|Workflow / MCP 等平台适配器" AGENTS.md src
rg -n "Channel\.MCP|fromMcp|McpRequest|ALEMBIC_MCP_MODE|unsupportedHostRoutes|hostAgentRouteSupported|host-agent-route|Channel = Object" src test AGENTS.md
rg -n "Codex MCP|marketplace|channel delivery|host-agent route|MCP-like|host/plugin adapter|宿主注入|宿主接入 adapter contract" AGENTS.md src/agent/runtime/AgentMessage.ts src/agent/runtime/AgentRuntimeBoundary.ts src/agent/index.ts src/tools/core/LightweightRouter.ts src/tools/v2/adapter/V2ToolRouterAdapter.ts
npm run build:check
npm run test -- test/contract-surface.test.ts
npm run lint:agent-import-boundary
git diff --check HEAD^ HEAD
```

### 复核结果

- `git show --name-status --stat --oneline 929cded9e449823f0f6e4feae27f15f249352c3a`：仅 6 个 `M` 文件，27 insertions / 16 deletions，未出现删除文件。
- `git show --summary --diff-filter=D --format=oneline 929cded9e449823f0f6e4feae27f15f249352c3a`：无删除文件输出。
- 旧混淆口径负向扫描：无命中。
- 兼容符号保留扫描：命中 `Channel.MCP`、`McpRequest`、`fromMcp`、`ALEMBIC_MCP_MODE`、`hostAgentRouteSupported:false`、`unsupportedHostRoutes` 和 contract-surface 测试断言，证明本轮未删除兼容入口。
- 正向边界扫描：命中 Plugin-owned Codex MCP / marketplace / channel / host-agent route 和 Agent-owned internal runtime contract 说明，符合当前总控计划。
- `npm run build:check`：通过。
- `npm run test -- test/contract-surface.test.ts`：通过，1 个测试文件、5 个测试用例通过。
- `npm run lint:agent-import-boundary`：通过，未引入 AlembicPlugin / Codex delivery / MCP delivery / channel / marketplace import 边界违规。
- `git diff --check HEAD^ HEAD`：通过。

### 复核后判断

CCIC-P1-G 可以继续保持 `待验收` 状态：本轮没有误删真实消费方，没有改变 runtime 行为或职责边界，没有删除兼容字段；负向扫描、兼容符号保留扫描、Agent import boundary、typecheck 和 contract-surface 测试均通过。后续仍需等待 `AlembicPlugin` CCIC-P1-P 回填后，由总控统一复核跨仓库 host-agent / host-managed 语义是否完全一致。

## 遗留风险

- 本轮只清洁 AlembicAgent 侧口径，不验证 Plugin/Dashboard 对 host-managed 语义的消费结果。
- `ALEMBIC_MCP_MODE` 仍作为 runtime 环境分支名称存在；本轮判断它属于已有内部运行时模式开关，不改变行为。若后续要重命名，需要单独兼容设计和消费方扫描。
- Alembic Codex 插件运行时状态本轮不可用作项目记忆来源；已按本地真实文件和计划执行。

## 下一步建议

- 等 `AlembicPlugin` 回填 Codex MCP / channel / marketplace 侧 host-agent route 语义后，由总控统一判断是否需要把长期职责契约里的 host agent wording 再同步一轮。
- 如果 CCIC-2 启动跨仓库命名收敛，建议优先扫描 `ALEMBIC_MCP_MODE`、`Channel.MCP` 和外部 MCP-like contract 的真实消费方，再决定是否仅文档澄清或进入兼容迁移。
