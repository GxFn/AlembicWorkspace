# Alembic Multi Project Control Wave 4 Dashboard Plugin Consumer Handoff Plan

日期：2026-05-19
状态：阶段 4 已完成
维护窗口：AlembicWorkspace

## 目标

本波启动 `AlembicDashboard` 和 `AlembicPlugin`，消费已经稳定的 Alembic projects API / handoff，而不是继续让消费层猜字段。

`AlembicDashboard` 负责多项目可视化和用户切换入口：展示 registered projects、selected project、active runtime project、project status，并调用 Alembic HTTP `open-dashboard / switch / stop` action。

`AlembicPlugin` 负责 Codex host project 对齐：识别 Codex host project 与 Alembic selected / active project 是否一致；不一致时显示 disconnected / mismatch，不做项目切换，不启动错误项目的 runtime。

本波不是重新改 Alembic control-plane，也不是让 Plugin 拥有多项目切换能力。

## 上游依据

- Wave 3B 计划：[alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md](alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md)
- Alembic Wave 3B 回填：[../Alembic/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-2026-05-19.md)
- Alembic safe handoff 提交：`633448f`
- Core contract 提交：`ab5e332843d6da89c3def6bf33631e0397552566`
- 需求设计：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicDashboard`<br>已完成 | 已接入 projects list/current/action API，完成项目列表 / 当前项目 / open-dashboard / switch / stop UI，并处理 handoff 后重连或跳转；已通过总控功能完整性验收。 |
| `AlembicPlugin`<br>已完成 | 已接 hostProject mismatch / disconnect 状态；Codex host project 与 Alembic selected / active 不一致时不做项目切换；已通过总控功能完整性验收。 |
| `Alembic`<br>已完成 | Wave 3B safe handoff 已验收；本波不改 Alembic。 |
| `AlembicCore`<br>已完成 | Contract 已验收；本波不改 Core。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务。 |
| `BiliDili`<br>无任务 | 本波不做真实项目 smoke；待 Dashboard / Plugin 接入后再考虑只读验证。 |

## AlembicDashboard 执行要求

范围：

- 读取 `AlembicDashboard/AGENTS.md`、本文档、Wave 3B 计划和回填、`src/api.ts`、`src/types.ts`、`src/App.tsx`、`src/components/Layout/Header.tsx`。
- 在 Dashboard API 层新增或扩展 projects client：
  - `GET /api/v1/projects`
  - `GET /api/v1/projects/current`
  - `POST /api/v1/projects/:projectId/open-dashboard`
  - `POST /api/v1/projects/:projectId/switch`
  - `POST /api/v1/projects/:projectId/stop`
- 在 `src/types.ts` 增加 Dashboard 侧 transport DTO。Dashboard 不需要引入 Node 版 `@alembic/core`；但字段命名必须跟 Alembic API 对齐，并在注释中说明 source of truth 是 Alembic / Core contract。
- UI 要接入真实 API：
  - 显示项目列表、selected project、active runtime project、status、ghost / standard、missing / unavailable。
  - 提供 open-dashboard / switch / stop 操作，使用现有 design system、lucide 图标和 tooltip。
  - `switch` 成功后，如果 handoff dashboardUrl 与当前 origin 不同，按可用策略跳转或打开目标 Dashboard；如果同源，刷新当前项目数据和 projects snapshot。
  - action 失败时显示明确错误，不假装已切换。
- 保持现有 `data.projectRoot` 相关缓存 key 行为；切换项目后必须重新加载 project-scoped cache、custom folder targets、selected target 和主要数据。

禁止事项：

- 不允许 Dashboard 调 CLI。
- 不允许把 switch 做成本地 UI selected state，不调用 Alembic API。
- 不允许在 Plugin 或 Dashboard 内复制 Alembic runtime 编排逻辑。
- 不允许修改 Alembic / AlembicCore / AlembicPlugin 代码。

建议验证：

```bash
npm run build
```

如仓库已有 lint / test 脚本，按现有脚本补跑。必须回填是否做了本地 API mock / browser smoke；如果没有可运行 daemon，也要说明替代验证。

文档动作：

- 新建 / 更新：`docs/AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md`

## AlembicPlugin 执行要求

范围：

- 读取 `AlembicPlugin/AGENTS.md`、本文档、Wave 3B 计划和回填、`lib/codex/StatusService.ts`、`lib/codex/EnhancementRoute.ts`、`lib/codex/ModuleBoundary.ts`、`lib/codex/ProjectRootResolver.ts`、`test/unit/CodexStatusService.test.ts`、`test/unit/CodexEnhancementRoute.test.ts`。
- 增加 Codex host project 与 Alembic selected / active project 的对齐状态：
  - `hostProject`
  - `selectedProject`
  - `activeRuntimeProject`
  - `connectionState`: `connected` / `mismatch` / `disconnected` / `unavailable`
  - `handoffMismatch`：包含 host root、selected root、active root、reason。
- 读取策略：
  - 优先消费 Alembic ready daemon 的 projects API / runtime boundary。
  - 当 host project 没有 ready daemon 时，可以只读 Core registry / global runtime-control state 来判断 mismatch；不要启动或切换项目。
  - 字段类型使用 Core / Alembic public contract，不能在 Plugin 内新建永久 runtime contract。
- Codex status / dashboard handoff / onboarding 要体现 mismatch：
  - host project 与 selected / active 一致时，状态为 connected，可继续 handoff。
  - 不一致时，默认 disconnected / mismatch，提示用户去 Alembic / Dashboard 切回该项目；Plugin 不自动切换。
  - 不要因为 mismatch 启动 embedded runtime 覆盖 Alembic 当前项目。
- 更新 module boundary / diagnostics，明确 Plugin 只拥有 Codex 入口和 mismatch presentation，不拥有多项目 control-plane。

禁止事项：

- 不允许 Plugin 做项目切换。
- 不允许 Plugin 为了消除 mismatch 自动调用 Alembic `switch`。
- 不允许复制 Dashboard UI 或 Alembic orchestration。
- 不允许修改 Alembic / AlembicCore / AlembicDashboard 代码。

建议验证：

```bash
npm run build:check
npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts
npm run lint:consumer-core-imports
npm run build
```

如触及 MCP status 输出，补跑相关 Codex MCP / status tests。

文档动作：

- 新建 / 更新：`docs/AlembicPlugin/alembic-multi-project-control-wave-4-host-project-mismatch-handoff-2026-05-19.md`

## 验收重点

- Dashboard 是否真实调用 Alembic projects API，而不是只做 UI mock。
- Dashboard switch 后是否处理 handoff / 重连 / project-scoped cache refresh。
- Plugin 是否只判断 hostProject mismatch，不做项目切换。
- Plugin mismatch 是否能在 host project 与 selected / active 不一致时阻止错误 handoff。
- 功能完整性检查：如果只是新增类型、静态 UI、静态 status 字段、或没有真实 API / 状态来源，视为最小实现，必须补一轮非最小完整实现。

## 可复制提示词

发送给：无

```text
当前 Wave 4 已完成总控验收；下一步读取 docs/workspace/alembic-multi-project-control-wave-5-e2e-smoke-foundation-plan-2026-05-19.md。
```

不发送给：`AlembicDashboard`（已完成）、`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### AlembicDashboard

- 状态：待验收
- 执行文档：[../AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md](../../../../AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md)
- 完成范围：
  - Dashboard 新增 projects runtime-control DTO / normalizer，字段对齐 Alembic / Core project runtime contract，未引入 Node 版 `@alembic/core`。
  - Header 顶部新增项目控制入口，展示 projects list、selected project、active runtime project、status、Ghost / Standard、missing / unavailable。
  - App 在 action 成功后清理 project-scoped UI 状态并重载 `fetchData()`、`fetchTargets()`、`fetchProjectsSnapshot()`；self-daemon `stop` 使用 action snapshot，避免立即重拉已停止 origin。
- API 接入：
  - `GET /api/v1/projects`：`api.getProjectsSnapshot()`。
  - `GET /api/v1/projects/current`：`api.getCurrentProjectSnapshot()`。
  - `POST /api/v1/projects/:projectId/open-dashboard`：`api.openProjectDashboard()`。
  - `POST /api/v1/projects/:projectId/switch`：`api.switchProject()`。
  - `POST /api/v1/projects/:projectId/stop`：`api.stopProject()`。
  - action 结果归一化 `ok/error/handoff/deferredStopProject/snapshot`；失败时 UI toast 明确报错，不假装已切换。
- UI / handoff 行为：
  - 每个可寻址项目提供打开 Dashboard、切换项目、停止 runtime 三个图标操作；缺少 `projectId`、missing project、已 active project 等不适用状态会禁用对应按钮。
  - `open-dashboard` / `switch` 成功后，如果 `handoff.dashboardUrl` 与当前 origin 不同，直接跳转目标 Dashboard；同源则刷新当前项目数据和 projects snapshot。
  - `stop` 成功后优先使用 action result snapshot 更新 UI；self-daemon deferred stop 不立即重拉当前 origin。
- 提交 hash：`bf493c9eb6a395b294c0e9e22d96327ebedb00e2`
- 验证命令：
  - `npm run build`
  - `git diff --check`
  - `rg -n "@alembic/core|ProjectRegistry|WorkspaceResolver|DaemonSupervisor|ProjectRuntimeControl|child_process|exec\\(|spawn\\(|node:fs|from 'fs'|from \"fs\"|/bin/|ALEMBIC_DAEMON|process\\.env" src --glob '!**/dist/**'`
  - `npm run dev -- --host 127.0.0.1 --port 5178`
  - `curl -I http://127.0.0.1:5178/`
  - `curl -I http://127.0.0.1:5178/`（停止 dev server 后确认端口关闭）
  - `node scripts/verify-workspace-docs.mjs --all-workspace`
  - `node scripts/check-dispatch-coverage.mjs`
  - `git diff --check -- docs/workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md`
  - `rg -n "/Users/|sk-|AIza|token|API key|api key" docs/workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md docs/workspace/index.md docs/workspace/workspace-current-status.md docs/AlembicDashboard/alembic-multi-project-control-wave-4-project-switching-ui-2026-05-19.md`
- 验证结果：
  - `npm run build`：通过，执行 `tsc && vite build`；Vite 仍有既有大 chunk warning。
  - `git diff --check`：通过。
  - 边界扫描：未发现 CLI 调用、Node fs、daemon supervisor、ProjectRegistry / WorkspaceResolver 实现引用；命中项仅为 DTO 注释 / 类型名、既有 i18n 规则字符串和 Markdown 解析正则。
  - 本地 Vite smoke：沙箱内绑定 `127.0.0.1:5178` 被 `EPERM` 拒绝；按权限规则提权后 dev server 启动成功，`curl -I` 返回 `HTTP/1.1 200 OK`。
  - smoke 后已停止 dev server，再次 `curl -I` 返回连接失败，确认端口释放。
  - workspace 文档校验：通过；当前计划识别为 Wave 4 文档，Markdown links checked: 96。
  - 分派覆盖校验：通过；当前只发送给 `AlembicPlugin`，不发送 `AlembicDashboard` / `Alembic` / `AlembicCore` / `AlembicAgent` / `BiliDili`。
  - 文档 diff check：通过。
  - 长期文档私密信息扫描：仅命中 `index.md` 中既有文档规则文字；本轮文档未写入本机绝对路径或密钥。
  - 未做真实 Alembic daemon projects API live smoke；当前窗口没有可运行目标 daemon，本轮以类型检查、构建、真实 HTTP client 接入和 Vite 页面 smoke 作为替代验证。
- 遗留风险：
  - 未验证真实多项目 daemon 切换链路；需要 Alembic daemon 和至少两个已注册项目后做 end-to-end smoke。
  - `stop` 当前 self-daemon 后页面会保留 action result snapshot，不立即重拉已停止 origin；后续可在全链路 smoke 中确认是否需要更明确的断线状态 UI。
  - `projectId` 为空的项目只展示状态，不提供 route action；若 Alembic 后续允许 projectRoot action endpoint，Dashboard 可补充 fallback。
- 下一步建议：
  - 等 `AlembicPlugin` 完成 mismatch / disconnect 后，总控启动一次 Alembic + Dashboard + Plugin 的端到端多项目切换 smoke。
  - 使用两个注册项目验证 Dashboard `switch` 跨 origin 跳转、同源刷新、`stop` self-daemon deferred stop 和 cache reload 行为。

### AlembicPlugin

- 状态：待验收
- 执行文档：[../AlembicPlugin/alembic-multi-project-control-wave-4-host-project-mismatch-handoff-2026-05-19.md](../../../../AlembicPlugin/alembic-multi-project-control-wave-4-host-project-mismatch-handoff-2026-05-19.md)
- 完成范围：
  - 新增 `CodexHostProjectAlignment` 只读适配器，输出 `hostProject`、`selectedProject`、`activeRuntimeProject`、`connectionState`、`handoffMismatch`、`handoffAllowed` 和 `nextActions`。
  - `CodexStatusService` / diagnostics / module boundary / onboarding 均暴露 host project alignment。
  - `alembic_codex_dashboard` handoff 前做只读 preflight；mismatch / disconnected 时返回结构化失败，不调用 `supervisor.ensure()`。
  - `jobs` / `mcp` ensure 路径遇到明确 mismatch 时 fail closed，避免错误项目启动 runtime。
  - 刷新 `plugins/alembic-codex` portable runtime artifact，保留 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`，并同步到 Core commit `ab5e332843d6da89c3def6bf33631e0397552566`。
- mismatch / disconnect 行为：
  - `connected`：host project 与 selected / active 一致，可继续 Dashboard handoff。
  - `mismatch`：selected 或 active 指向其它项目；返回 `CODEX_HOST_PROJECT_MISMATCH`，提示用户从 Alembic / Dashboard 切回当前 Codex host project。
  - `disconnected` / `unavailable`：status 暴露状态和 next actions；Dashboard handoff 返回 `CODEX_HOST_PROJECT_DISCONNECTED`，不自动 start / switch。
  - init / host-agent bootstrap 主流程不被 generic unavailable 抢走；alignment 作为 status / notes 证据展示。
- 数据来源：
  - Codex host root：Codex project root resolver 后的当前 project root。
  - Host project facts：`@alembic/core/workspace` `ProjectRegistry.inspect()` / `normalizeProjectPath()`。
  - selected / active：只读 Core `ProjectRuntimeControlState` / global `runtime-control.json`。
  - active runtime fallback：ready daemon `runtimeBoundary.workspace`，再 fallback 到 `DaemonStatus.state`。
  - 本轮未调用 Alembic `switch` / `select` / action API。
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
  - 指定单元测试：通过，4 个测试文件、42 个测试全部通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 326 个文件和 508 个 `@alembic/core` imports。
  - `npm run build`：通过。
  - `npm run prepare:codex-plugin-runtime`：通过。
  - `npm run verify:codex-plugin`：通过，确认 `./runtime.tgz -> alembic-ai@0.1.2`。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed，recovery / daemon skipped。
  - 父仓库和嵌套 artifact 仓库 `git diff --check`：均通过。
- 遗留风险：
  - 未跑真实 Alembic daemon + Dashboard + Plugin 双项目 live smoke；需要总控下一步组织端到端验收。
  - Plugin 当前消费 ready daemon `runtimeBoundary` 和 Core runtime-control state；未直接调用 projects API，以避免给 bundled runtime 引入额外 HTTP 版本依赖。
  - `disconnected` / `unavailable` Dashboard handoff 当前 fail closed；如果后续要允许 selected host inactive 时由 Codex start，需要用户 / 总控明确确认。
- 下一步建议：
  - 总控用两个已注册项目验证 connected、selected mismatch、active mismatch、inactive selected host 四类状态。
  - Dashboard / Plugin 都待验收后，决定是否把 Plugin 只读 projects API probe 作为下一波增强。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - `AlembicDashboard` 实现不是静态 UI 或 mock：API client 已消费 Alembic-owned `/projects`、`/projects/current` 和 project action endpoints；Header 项目控制调用真实 HTTP action，action 成功后处理 handoff URL、同源刷新和 project-scoped cache reset。
  - `AlembicPlugin` 实现不是空 alignment 字段：`CodexHostProjectAlignment` 读取 Codex host root、Core registry、global runtime-control state 和 ready daemon runtime boundary；Dashboard handoff 前 fail-closed，mismatch / disconnected 不调用 `supervisor.ensure()`，Plugin 不做项目切换。
  - 两个子仓库工作区均干净，提交与回填一致：`AlembicDashboard` `bf493c9eb6a395b294c0e9e22d96327ebedb00e2`；`AlembicPlugin` `a591367f3b4f3b59b6517e7a149312440ebeef80`；Plugin artifact `0607fb8b8224cb01f83a51e520570d4f250e1b12`。
- 总控复核命令：
  - `AlembicDashboard`: `npm run build`
  - `AlembicDashboard`: `rg -n "@alembic/core|ProjectRegistry|WorkspaceResolver|DaemonSupervisor|ProjectRuntimeControl|child_process|exec\\(|spawn\\(|node:fs|from 'fs'|from \"fs\"|/bin/|ALEMBIC_DAEMON|process\\.env" src --glob '!**/dist/**'`
  - `AlembicPlugin`: `npm run build:check`
  - `AlembicPlugin`: `npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexMcpServer.test.ts`
  - `AlembicPlugin`: `npm run lint:consumer-core-imports`
  - `AlembicPlugin`: `npm run build`
  - `AlembicPlugin`: `npm run verify:codex-plugin`
  - `AlembicPlugin`: `npm run smoke:codex-plugin`
  - `AlembicDashboard` / `AlembicPlugin`: `git diff --check`
  - `AlembicPlugin/plugins/alembic-codex`: `git diff --check`
- 总控复核结果：
  - Dashboard build 通过；Vite 仍有既有 large chunk warning。
  - Dashboard 边界扫描未发现 CLI、Node fs、DaemonSupervisor、ProjectRegistry / WorkspaceResolver 实现引用；命中项仅为 DTO 注释 / 类型名、既有 i18n 规则字符串和 Markdown 正则。
  - Plugin build:check、42 个 targeted tests、consumer-core import lint、build、codex plugin verify 和 smoke 全部通过。
  - 两个子仓库和 Plugin artifact diff check 通过，子仓库工作区保持干净。
- 遗留风险：
  - 本轮仍未做真实 Alembic daemon + Dashboard + Plugin 的双项目 live smoke；这不是 Wave 4 失败项，但必须作为下一波功能完整性验收入口。
- 下一波建议：
  - 启动 Wave 5，先由 `Alembic` 产出真实双项目 runtime-control / projects API / safe handoff smoke 证据；`AlembicDashboard` 和 `AlembicPlugin` 等该证据解除阻塞后再做 live consumer 验证，避免各窗口空转或各自造环境。
