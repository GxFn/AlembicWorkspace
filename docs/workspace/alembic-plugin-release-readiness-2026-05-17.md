# AlembicPlugin Release Readiness

日期：2026-05-17
窗口：AlembicPlugin
状态：已完成

本文记录 `alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md` 分派给 AlembicPlugin 的 release readiness 封口任务。

## 1. 完成范围

- 清理 `lib/injection/ServiceMap.ts` 中无运行时意义的 legacy Agent unknown fields：
  - `toolRegistry`
  - `agentProfileRegistry`
  - `agentStageFactoryRegistry`
  - `agentProfileCompiler`
  - `agentRunCoordinator`
  - `systemRunContextFactory`
  - `agentRuntimeBuilder`
  - `agentService`
- 保留 `skillHooks`，因为 Codex plugin delivery、MCP skill handlers 和 workflow skill hooks 仍需要它。
- 更新 `test/integration/ServiceContainer.test.ts`，验证 plugin-mode DI 只解析 `skillHooks`，并确认 `toolRegistry` 不再注册。
- 重跑 Codex plugin release gate，覆盖 runtime build、Dashboard build、embedded runtime prepare、Codex channel verify、Codex plugin verify 和完整 plugin smoke。
- 追加 daemon/dashboard smoke，验证 daemon 能启动、Dashboard HTML 能服务、interrupted job recovery 能通过。

本轮没有重新引入：

- `@alembic/agent`
- `lib/agent/**`
- `lib/tools/**`
- `lib/external/ai/**`
- 本地 AI provider
- 本地 Agent/Tool runtime

## 2. 提交

- AlembicPlugin：`e7840d0 chore: finalize codex plugin release readiness`

## 3. 验证命令与结果

通过：

```text
npm run build:check
npm run lint -- --diagnostic-level=error
npm run report:agent-extraction-boundary
npm run verify:codex-plugin
npm run verify:codex-channel
./node_modules/.bin/vitest run test/integration/ServiceContainer.test.ts
npm run smoke:codex-plugin
npm run smoke:codex-plugin -- --daemon
npm run release:codex-plugin
```

关键结果：

- `report:agent-extraction-boundary`：Agent / AI / Tool 边界导入均为 0。
- `verify:codex-plugin`：通过，`./runtime.tgz -> alembic-ai@0.1.2`。
- `verify:codex-channel`：通过，`alembic-ai@0.1.2`。
- `ServiceContainer.test.ts`：通过，1 个 test file、15 个 tests。
- 普通 `smoke:codex-plugin`：通过，`install: passed`、`stdio: passed`、`npxRuntime: passed`。
- daemon smoke：通过，`install: passed`、`stdio: passed`、`npxRuntime: passed`、`recovery: passed`，daemon 返回 Dashboard URL。
- `release:codex-plugin`：通过 6/6 steps；Dashboard build 仍只有既有 large chunk warning。

说明：

- 普通沙箱下 daemon smoke 会因本机端口绑定限制出现 `listen EPERM`；已在允许本机端口绑定后重跑通过。
- 曾尝试通过 `npm run test:integration -- test/integration/ServiceContainer.test.ts` 跑单测目标，但该 npm script 固定包含整个 `test/integration` 目录，导致两个 HTTP 端口测试在普通沙箱里 `listen EPERM`。最终改用 Vitest 直接运行目标文件并通过。

## 4. 遗留风险

- daemon/dashboard live smoke 在当前 Codex 沙箱中需要本机端口绑定权限；普通无端口权限环境会失败在 `listen EPERM`，不是 Plugin release chain 的代码失败。
- Dashboard 三条 host-managed UI 点击路径仍属于 AlembicDashboard 窗口任务；Plugin 侧已证明 daemon/dashboard path 可以启动并服务 Dashboard HTML。
- `ServiceMap` 已清理类型表面，但历史测试或外部脚本如果仍调用 `container.get('toolRegistry')`，现在会按预期失败，需要迁移到宿主工具能力或删除旧调用。

## 5. 下一步建议

- release / marketplace sync 前继续以 `npm run release:codex-plugin` 作为基础 gate，并在允许本机端口绑定的环境额外跑 `npm run smoke:codex-plugin -- --daemon`。
- AlembicDashboard 窗口继续做 Candidates enrich/refine、Global Chat refine、AI Chat 的 live host-managed UI 复验。
- 后续如再改 embedded runtime packaging，必须保留 `verify:codex-plugin`、`verify:codex-channel`、完整 smoke 和 daemon smoke 证据。
