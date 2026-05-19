# Alembic Multi Project Control Wave 5B Host Project Live Smoke

日期：2026-05-19
状态：已通过总控验收
归属窗口：AlembicPlugin
总控计划：../workspace/alembic-multi-project-control-wave-5b-consumer-live-smoke-plan-2026-05-19.md

## 任务摘要

基于真实 `runtime-control.json`、Core `ProjectRegistry`、Ghost dataRoot、Plugin daemon state 和 Codex MCP tool 调用，验证 Codex host project alignment 在 connected / mismatch / disconnected / unavailable 场景下的实际输出和 Dashboard handoff 边界。

本轮只验证 `AlembicPlugin` 消费层，不修改 `Alembic`、`AlembicCore`、`AlembicDashboard` 或 `BiliDili`。Plugin 产品代码未调用 `switch` / `select` / action API 来消除 mismatch。

## 完成范围

- 使用隔离 `ALEMBIC_HOME` 和两个临时 Ghost 项目做 live smoke；项目通过真实 `SetupService` 初始化并写入 Core `ProjectRegistry`。
- 使用 Core `createProjectRuntimeControlState()` 写入真实 global runtime-control state，覆盖 selected / active 指向 host、selected 指向其它项目、active 指向其它项目、selected host 但 active 为空、runtime-control 缺失五类状态。
- 使用 `DaemonSupervisor.start()` 启动 host project 真实 daemon，验证 connected 场景下 `connectionState=connected`、`handoffAllowed=true`，且 `alembic_codex_dashboard` 可继续 handoff。
- 使用 `CodexMcpServer.handleToolCall()` 真实调用 `alembic_codex_status`、`alembic_codex_dashboard` 和 `alembic_codex_diagnostics`，不是直接读取内部函数。
- 在 mismatch / disconnected / unavailable 场景下确认 Dashboard handoff fail-closed，并确认不会自动启动 host daemon。
- 验证 diagnostics / module boundary 输出包含 alignment 证据，且 status / dashboard / diagnostics 输出不泄漏 daemon token。

## 验证命令

- `npm run build:check`
- `npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts`
- `npm run lint:consumer-core-imports`
- `npm run build`
- Live smoke Node 脚本：
  - 使用 `node --input-type=module` 执行临时脚本。
  - 首次沙箱内运行 daemon start 失败。
  - 按权限规则提权后重跑同一套临时脚本并通过。
- `npm run smoke:codex-plugin`
- `git diff --check`

## 验证结果

- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ ab5e332843d6da89c3def6bf33631e0397552566`。
- targeted tests：通过，`CodexStatusService` 和 `CodexMcpServer` 共 34 个测试通过。
- `npm run lint:consumer-core-imports`：通过，扫描 326 个文件和 508 个 `@alembic/core` imports。
- `npm run build`：通过。
- Live smoke：首次非提权运行在本地 daemon start 阶段失败；提权重跑后通过，临时项目和 daemon 已 best-effort stop 并删除。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed，recovery / daemon skipped。
- `git diff --check`：通过。
- `AlembicPlugin` 与嵌套 `plugins/alembic-codex` 工作区均保持干净。

## Live Consumer 证据

提权 live smoke 输出摘要：

- 临时 Ghost 项目数量：2。
- host project 示例 id：`699c7c16`。
- other project 示例 id：`06d6f7ed`。
- runtime-control state 路径：`<smoke-root>/home/.asd/runtime-control.json`。
- connected：
  - `connectionState=connected`
  - `handoffAllowed=true`
  - `alembic_codex_dashboard` 返回 `success=true`
  - dashboard URL 存在。
- selected mismatch：
  - `connectionState=mismatch`
  - `handoffMismatch.reason=selected-project-differs`
  - `alembic_codex_dashboard` 返回 `success=false`
  - `errorCode=CODEX_HOST_PROJECT_MISMATCH`
  - host daemon 未被自动启动。
- active mismatch：
  - `connectionState=mismatch`
  - `handoffMismatch.reason=active-runtime-project-differs`
  - `alembic_codex_dashboard` 返回 `success=false`
  - `errorCode=CODEX_HOST_PROJECT_MISMATCH`
  - host daemon 未被自动启动。
- disconnected：
  - selected 等于 host，active 为空，host daemon stopped。
  - `connectionState=disconnected`
  - `alembic_codex_dashboard` 返回 `success=false`
  - `errorCode=CODEX_HOST_PROJECT_DISCONNECTED`
  - host daemon 未被自动启动。
- unavailable：
  - runtime-control 缺失，host daemon stopped。
  - `connectionState=unavailable`
  - `alembic_codex_dashboard` 返回 `success=false`
  - `errorCode=CODEX_HOST_PROJECT_DISCONNECTED`
  - host daemon 未被自动启动。
- diagnostics / module boundary：
  - diagnostics 中 `hostProjectAlignment.connectionState=unavailable`。
  - module boundary 中 `hostProjectAlignment.switchOwnership=Alembic/Dashboard`。
  - token leak check：passed。
- cleanup：best-effort stop completed and smoke root removed。

## 提交 Hash

- 新增源码提交：无。本轮是 live smoke 和 workspace 文档回填。
- 验证对象：
  - AlembicPlugin：`a591367f3b4f3b59b6517e7a149312440ebeef80`
  - Codex plugin artifact：`0607fb8b8224cb01f83a51e520570d4f250e1b12`
  - Alembic smoke foundation：`edec0a52c1dffb5f8c09fdc4545422995cdad157`

## 遗留风险

- live smoke 使用 Plugin dist runtime 和 Core runtime-control state 验证 Codex consumer 行为；未把 Alembic Wave 5A `smoke:multi-project-control` 的 running daemon 保持为 long-lived fixture 供 Plugin 复用。
- 本轮未引入 Plugin 直接读 projects API 的额外 probe；仍以 ready daemon `runtimeBoundary`、`DaemonStatus` 和 Core runtime-control state 为 alignment 数据来源。
- `disconnected` / `unavailable` 的 Dashboard handoff 当前 fail-closed；如果产品后续希望 selected host inactive 时由 Codex 启动，需要用户和总控另行确认。

## 下一步建议

- 总控可将本轮 Plugin live smoke 与 Dashboard live smoke 合并验收，重点复核 Dashboard 切换后的 selected / active 状态是否与 Plugin alignment 一致。
- 如需要复用同一个长驻双项目 fixture，建议回派 `Alembic` 给 `smoke:multi-project-control` 增加明确的 keep-alive / evidence export 模式；不要在 Plugin 仓库复制 runtime orchestration。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 本轮没有新增 Plugin 产品源码，验证对象仍为 `a591367f3b4f3b59b6517e7a149312440ebeef80`，Codex plugin artifact 为 `0607fb8b8224cb01f83a51e520570d4f250e1b12`。
  - 总控复跑 `npm run build:check`、`npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts`、`npm run lint:consumer-core-imports`、`npm run build`、`npm run smoke:codex-plugin` 和 `git diff --check` 均通过；父仓库和嵌套 artifact 工作区干净。
  - 回填 live consumer 证据覆盖 connected、selected mismatch、active mismatch、disconnected、unavailable 五类状态；Dashboard handoff fail-closed 且不自动启动 host daemon，符合 Plugin 不切项目、不启动错误 runtime 的边界。
  - diagnostics / module boundary 证据包含 alignment，token leak check passed。
- 下一步：
  - 当前不返工 Plugin。若后续要把 live smoke 固化为长期回归，应先由 `Alembic` 提供可复用 keep-alive fixture，Plugin 只消费 fixture / runtime-control 证据。
