# AlembicPlugin Module Boundary Foundation Wave 1 Plugin Adapters

日期：2026-05-18
窗口：AlembicPlugin
状态：待验收
对应总控：`docs/workspace/alembic-module-boundary-foundation-wave-1-workspace-plan-2026-05-18.md`

## 领取范围

本窗口只处理 `AlembicPlugin` 仓库内容：Codex adapter、embedded runtime adapter、Codex MCP server、status / diagnostics / onboarding、Dashboard artifact 与 portable runtime。未修改 `Alembic`、`AlembicCore`、`AlembicAgent` 或 `AlembicDashboard` 源码。

## 真实代码扫描结论

- `ProjectRootResolver` 只解析、信任和持久化 Codex 目标 `projectRoot`， workspace identity 继续通过 `@alembic/core/workspace` 的 `WorkspaceResolver` / marker path 消费。
- `EnhancementRoute` 已区分 `embedded-plugin-runtime`、`local-alembic-daemon`、`local-alembic-install` 和 `unavailable`；Codex host-agent route 使用 `source=host-agent`，不依赖 internal AI provider。
- `DaemonSupervisor` 是 Plugin portable runtime adapter：启动本包编译后的 `dist/bin/daemon-server.js`，复用 Core daemon path/state helpers；它不是 Alembic 长期 daemon 主实现。
- `CodexMcpServer` 仍拥有 Codex tool schema、tier policy、host-agent workflow route、Dashboard URL handoff 与 local JobStore status fallback；JobStore 来自 `@alembic/core/daemon`，属于兼容存储消费，不是 Plugin 自定义主实现。
- Plugin 内无 Dashboard 源码；`dashboard/dist` 是保留的产物。构建入口为 `npm run build:dashboard` / `scripts/build-dashboard.mjs`，来源由 `scripts/local-source-paths.mjs#resolveDashboardSource` 解析，优先 `../AlembicDashboard`，fallback `vendor/AlembicDashboard`。
- `plugins/alembic-codex/runtime` 继续保留 portable runtime 例外：嵌入 `vendor/AlembicCore` 与 `.alembic-source.json`，本波未引入 `@alembic/agent`。

## 完成范围

- 新增 `lib/codex/ModuleBoundary.ts`，提供 `CodexModuleBoundaryStatus`：
  - `pluginOwns`：Codex entry、host-agent tool route、marketplace artifact、portable runtime packaging、Dashboard URL handoff。
  - `pluginDoesNotOwn`：Alembic daemon 主实现、ProjectRegistry 主实现、JobStore 主实现、file monitor 主实现、internal AI runtime、Dashboard frontend source。
  - `dashboard`：明确 `dashboard/dist` 为 retained artifact，source owner 为 `AlembicDashboard`，本波不允许删除。
  - `adapters`：明确 ProjectRootResolver、EnhancementRoute 和 embedded runtime 的 adapter role。
- `buildCodexStatus()` 与 `buildCodexRuntimeDiagnostics()` 新增 `moduleBoundary` 输出，Codex status / diagnostics 可以直接展示模块归属与 Dashboard artifact 边界。
- `EnhancementRoute` 的 daemon capability summary 改为消费 `@alembic/core/daemon` 的 `summarizeAlembicRuntimeCapabilities()`，不再由 Plugin 手写 API / Dashboard / jobs / fileMonitor summary。
- `lib/codex/index.ts` 导出 `ModuleBoundary` public adapter surface。
- 新增 `test/unit/CodexModuleBoundary.test.ts`，并扩展 `CodexEnhancementRoute`、`CodexStatusService`、`CodexMcpServer` 单测覆盖 Core capability summary、diagnostics / status 中的 boundary shape。
- 刷新 `plugins/alembic-codex` portable runtime artifact，使 runtime.tgz、runtime/dist 和 embedded Core snapshot 与本次 Plugin / Core public contract 对齐。

## 提交 hash

- AlembicPlugin：`bdd98989b11fe6f8aa143913418a99fc37df4a67`
- embedded Codex runtime 子仓库：`014d014fc6474b8ca5514687caf04d34aee1529c`
- portable runtime 内嵌 Core source：`58e21d64fc47e8c96b2885ac23b2d32460317497`

## 验证命令与结果

- `./node_modules/.bin/biome check lib/codex/EnhancementRoute.ts lib/codex/Diagnostics.ts lib/codex/StatusService.ts lib/codex/ModuleBoundary.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 58e21d64fc47e8c96b2885ac23b2d32460317497`。
- `npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过，4 个测试文件 / 39 个测试。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-ai@0.1.2`。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon skipped。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 遗留风险

- `EnhancementRoute` 已消费 Core capability summary helper，但 route choice、internal AI provider config extraction 和 local install fallback 仍是 Plugin adapter 逻辑；下一波应消费 Alembic daemon health 的 canonical `runtimeBoundary` 字段。
- `DaemonSupervisor`、`DaemonJobRunner`、git-diff checkpoint 和 JobStore fallback 仍作为 embedded runtime compatibility 存在；本波只标注边界，没有强拆这些兼容层。
- `dashboard/dist` 仍由 Plugin release flow 构建并打包；切到 Alembic / AlembicDashboard release asset 需要后续明确 artifact contract。
- 本波按总控要求只做必要 build、局部测试和 plugin smoke；未做跨仓库大验收归档，也未启用 smoke 脚本的 daemon / recovery 路径。

## 下一波模块划分建议

- AlembicPlugin 下一波继续把 route choice、file monitor owner 和 local / embedded route reason 对齐到 Alembic daemon health 的 `runtimeBoundary`，避免在 Plugin 保留长期 route policy shape。
- Alembic daemon health 可稳定输出 `runtimeBoundary`、file monitor owner、jobs capability、internal AI provider config 和 Dashboard handoff 字段；Plugin 只消费并展示缺口。
- Dashboard artifact 后续应切到 AlembicDashboard 或 Alembic 发布产物，Plugin 只负责 portable runtime 打包和 Dashboard URL handoff。
- 等 Alembic daemon API 覆盖 job status、file monitor 和 checkpoint 后，再逐步收缩 Plugin embedded runtime compatibility adapter。
