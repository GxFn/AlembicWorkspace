# AlembicPlugin Runtime Contract Consumption Wave 2 Plugin Route

日期：2026-05-18
窗口：AlembicPlugin
状态：待验收
对应总控：`docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md`

## 领取范围

本窗口只处理 `AlembicPlugin` 仓库内容：`EnhancementRoute`、Codex status / diagnostics 暴露面、module boundary metadata、Codex runtime artifact 与相关单测。未修改 `Alembic`、`AlembicCore`、`AlembicAgent` 或 `AlembicDashboard` 源码。

## 完成范围

- `lib/codex/EnhancementRoute.ts` 继续优先消费 `@alembic/core/daemon#summarizeAlembicRuntimeCapabilities()`，并新增 Alembic daemon health `runtimeBoundary` 消费：
  - 支持读取 `data.capabilities.runtimeBoundary`，兼容 `data.runtimeBoundary`。
  - 从 `runtimeBoundary` 读取 route、workspace project identity、Dashboard handoff、daemon owner、file monitor owner / mode、internal AI owner、jobs owner / store。
  - 当 canonical `capabilities.dashboard`、`capabilities.fileMonitor`、`capabilities.internalAi` 或 `capabilities.jobs` 不完整时，用 `runtimeBoundary` 作为兼容 fallback；不新增 Plugin 长期 runtime policy 主实现。
- route choice 仍保留在 Plugin adapter 层：
  - `local-alembic` / `local-alembic-daemon` 映射到 Plugin `local-alembic-daemon` choice。
  - `embedded-plugin-runtime` 继续作为 portable compatibility fallback。
  - `host-agent` 仍只表示 Codex 宿主 Agent 路线，internal AI provider 仍只是 provider / config state。
- `lib/codex/ModuleBoundary.ts` 更新为 Wave 2：
  - `phase` 改为 `runtime-contract-consumption-wave-2`。
  - 新增 `runtimeContract` 状态，暴露 Core summary helper 来源、daemon health path、runtimeBoundary 是否可用和 file monitor mode。
  - Dashboard artifact 边界补充 release asset 切换检查项，继续保留 `dashboard/dist`，不声明 Plugin 拥有前端源码。
- 测试更新：
  - `CodexEnhancementRoute` 新增 runtimeBoundary 消费与 partial capabilities fallback 覆盖。
  - `CodexModuleBoundary` 覆盖 Wave 2 phase、release asset 切换检查项和 runtimeContract 状态。
- 刷新 `plugins/alembic-codex` portable runtime artifact，保持 runtime/dist 与 `runtime.tgz` 对齐本次源码。

## 提交 hash

- AlembicPlugin：`61144ef8e3d26f25596d46d01fb311642ab7c93b`
- embedded Codex runtime 子仓库：`be01059d3f6dfc9f3980f09b10a701edc31baa37`
- portable runtime 内嵌 Core source：`58e21d64fc47e8c96b2885ac23b2d32460317497`

## 验证命令与结果

- `./node_modules/.bin/biome check --write lib/codex/EnhancementRoute.ts lib/codex/ModuleBoundary.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts`：通过，无需修复。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 58e21d64fc47e8c96b2885ac23b2d32460317497`。
- `npm run test:unit -- test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts`：通过，4 个测试文件 / 40 个测试。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-ai@0.1.2`。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed；recovery / daemon skipped。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 遗留风险

- `runtimeBoundary` 目前仍是 Alembic-owned adapter 摘要；Plugin 已消费它作为 attribution / fallback，但不应把它扩展成 Plugin-local runtime policy。
- `dataRootSource`、`runtimeDir`、`databasePath` 可以从 future `runtimeBoundary.workspace` 读取；如果 Plugin / Dashboard 都稳定依赖，应由下一波上提到 Core canonical project identity。
- `DaemonSupervisor`、`DaemonJobRunner`、git-diff checkpoint 和 JobStore fallback 仍作为 embedded runtime compatibility 存在；本波只确保 route/status/diagnostics 不扩张长期 daemon 主实现。
- Dashboard artifact 仍通过 Plugin release flow 打包 `dashboard/dist`；本波只补 release asset 切换检查项，没有删除 dist，也没有改前端源码所有权。
- 本波按总控要求只做 build、局部单测、plugin verify/smoke；没有做跨仓库大验收或真实 daemon + Dashboard live smoke。

## 下一波建议

- 若 Alembic 和 Dashboard 均继续依赖 `dataRootSource`、`runtimeDir`、`databasePath`、Dashboard handoff owner 字段，下一波由 `AlembicCore` 扩展 canonical runtime project identity / handoff typing。
- AlembicPlugin 可继续收缩 embedded runtime compatibility：当 Alembic daemon API 覆盖 job status、file monitor checkpoint 和 Dashboard handoff 后，逐步降低 Plugin fallback 面。
- Dashboard artifact 后续可要求 AlembicDashboard release asset 提供 source version / commit metadata；Plugin 只验证并打包 release asset，不运行或维护前端源码。
- 总控可安排一次 Alembic daemon + Plugin `alembic_codex_status` / `alembic_codex_dashboard` + Dashboard runtime chip 的轻量 live smoke。
