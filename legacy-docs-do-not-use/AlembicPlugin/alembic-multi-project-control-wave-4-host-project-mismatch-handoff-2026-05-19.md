# Alembic Multi Project Control Wave 4 Host Project Mismatch Handoff

日期：2026-05-19
状态：已通过总控验收
归属窗口：AlembicPlugin
总控计划：../workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md

## 任务摘要

接入 Codex host project 与 Alembic selected / active project 的 mismatch / disconnect 状态。Plugin 只做 Codex 入口和状态呈现，不做项目切换。

## 回填要求

- 完成范围：
  - 新增 `CodexHostProjectAlignment` 只读适配器，输出 `hostProject`、`selectedProject`、`activeRuntimeProject`、`connectionState`、`handoffMismatch`、`handoffAllowed` 和 `nextActions`。
  - `CodexStatusService` 将 host project alignment 暴露到 status、diagnostics、module boundary 和 onboarding。
  - `CodexMcpServer` 在 `alembic_codex_dashboard` handoff 前做只读 alignment preflight；mismatch / disconnected 时返回结构化失败，不调用 `supervisor.ensure()`，避免启动 embedded runtime 覆盖 Alembic 当前项目。
  - `jobs` / `mcp` ensure 路径遇到明确 mismatch 时同样 fail closed，避免其它 Codex 工具在错误当前项目上启动 runtime。
  - 刷新 `plugins/alembic-codex` portable runtime artifact；保留 `@alembic/core: file:vendor/AlembicCore` 例外，并更新 `.alembic-source.json` 到 Core contract commit `ab5e332843d6da89c3def6bf33631e0397552566`。
- mismatch / disconnect 行为：
  - `connected`：Codex host project 与 Alembic selected / active runtime 一致，可继续 Dashboard handoff。
  - `mismatch`：selected 或 active runtime 指向其它项目；Dashboard / runtime start 路径返回 `CODEX_HOST_PROJECT_MISMATCH`，提示用户从 Alembic / Dashboard 切回当前 Codex host project。
  - `disconnected` / `unavailable`：status 仍暴露状态和 next actions；Dashboard handoff 返回 `CODEX_HOST_PROJECT_DISCONNECTED`，不自动 start / switch。
  - 未初始化或知识库未 usable 时，onboarding 仍保留 init / bootstrap 主流程；alignment 作为 notes/status 证据展示，避免阻断 Codex host-agent bootstrap。
- 数据来源：
  - Codex host root：`ProjectRootResolver` / `WorkspaceResolver` 后的当前 project root。
  - Host project facts：`@alembic/core/workspace` 的 `ProjectRegistry.inspect()` / `normalizeProjectPath()`。
  - selected / active：只读全局 `runtime-control.json`，按 Core `ProjectRuntimeControlState` / `createProjectRuntimeControlState()` 规范化。
  - active runtime fallback：ready daemon 的 `runtimeBoundary.workspace`，再 fallback 到 `DaemonStatus.state`。
  - 本轮未调用 Alembic `switch` / `select` / action API；Plugin 只消费 Core / Alembic public contract 和 ready daemon runtime boundary。
- Codex status / dashboard handoff 变化：
  - `alembic_codex_status` 新增 `hostProjectAlignment`。
  - diagnostics 新增 `hostProjectAlignment`，module boundary 新增 `hostProjectAlignment` adapter，明确 switch ownership 是 `Alembic/Dashboard`。
  - Dashboard handoff 失败时返回 `needsUserInput: true`、`hostProjectAlignment`、daemon summary、enhancement route 和 status/diagnostics nextActions。
- 关键文件：
  - `lib/codex/HostProjectAlignment.ts`
  - `lib/codex/StatusService.ts`
  - `lib/codex/Diagnostics.ts`
  - `lib/codex/ModuleBoundary.ts`
  - `lib/external/mcp/CodexMcpServer.ts`
  - `test/unit/CodexStatusService.test.ts`
  - `test/unit/CodexMcpServer.test.ts`
  - `plugins/alembic-codex/runtime.tgz`
- 提交 hash：
  - AlembicPlugin：`a591367f3b4f3b59b6517e7a149312440ebeef80`
  - Codex plugin artifact：`0607fb8b8224cb01f83a51e520570d4f250e1b12`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexMcpServer.test.ts`
  - `npm run lint:consumer-core-imports`
  - `npm run build`
  - `npm run prepare:codex-plugin-runtime`
  - `npm run verify:codex-plugin`
  - `npm run smoke:codex-plugin`
  - `git diff --check`
  - `git -C plugins/alembic-codex diff --check`
- 验证结果：
  - `npm run build:check`：通过；Core build 使用 `../AlembicCore @ ab5e332843d6da89c3def6bf33631e0397552566`。
  - 指定单元测试：通过，4 个测试文件、42 个测试全部通过；覆盖 status mismatch、module boundary、enhancement route 和 MCP Dashboard mismatch fail-closed。
  - `npm run lint:consumer-core-imports`：通过，扫描 326 个文件和 508 个 `@alembic/core` imports。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过，生成 `plugins/alembic-codex/runtime.tgz`。
  - `npm run verify:codex-plugin`：通过，确认 `./runtime.tgz -> alembic-ai@0.1.2`。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed，recovery / daemon skipped。
  - 父仓库和嵌套 artifact 仓库 `git diff --check`：均通过。
- 未完成项 / 风险：
  - 本轮没有跑真实 Alembic daemon + Dashboard + Plugin 的双项目 live smoke；需要总控在 Dashboard 和 Plugin 都待验收后组织端到端验证。
  - Plugin 当前优先消费 ready daemon `runtimeBoundary` 和 Core global runtime-control state；未直接调用 projects API，以保持 status / diagnostics 轻量且避免对 bundled runtime 版本产生额外 HTTP 依赖。
  - `disconnected` / `unavailable` 的 Dashboard handoff 当前 fail closed；如果后续产品希望“selected project 等于 host 但 inactive 时允许 Codex start”，需要总控确认后再调整。
- 下一步建议：
  - 总控使用两个已注册项目做 end-to-end smoke：Alembic selected / active 与 Codex host 一致、selected mismatch、active mismatch、inactive selected host 四类状态。
  - Dashboard 与 Plugin 验收合并后，决定是否把 Plugin 只读 projects API probe 作为下一波增强，而不是在本轮引入额外 HTTP 依赖。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - `CodexHostProjectAlignment` 有真实数据来源：Codex host root、Core registry、global runtime-control state、ready daemon runtime boundary 和 daemon status fallback。
  - `alembic_codex_dashboard` handoff 前会先做只读 alignment preflight；mismatch / disconnected 返回结构化失败并包含 nextActions，不调用 `supervisor.ensure()`，符合 Plugin 不切项目、不启动错误项目 runtime 的边界。
  - `jobs` / `mcp` ensure 路径对明确 mismatch fail closed；generic unavailable 不阻断 init / host-agent bootstrap 主流程。
  - 总控复跑 `npm run build:check`、42 个 targeted tests、`npm run lint:consumer-core-imports`、`npm run build`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin` 均通过；父仓库和 `plugins/alembic-codex` diff check 通过，工作区保持干净。
- 下一步：
  - 等 Wave 5 `Alembic` 产出真实双项目 runtime-control / projects API smoke 证据后，再验证 connected、selected mismatch、active mismatch、disconnected 四类 Codex host project 状态。
