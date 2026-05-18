# Alembic Plugin First Enhancement Wave 1 Daemon Capabilities

日期：2026-05-18
窗口：Alembic
状态：已完成

## 完成范围

- 扩展 `/api/v1/daemon/health`，在既有 daemon identity 之外增加 `dashboardUrl`、`enhancement` 和 `capabilities`，供 `AlembicPlugin` 判断是否可把重任务交给本地 Alembic daemon/API。
- `capabilities` 覆盖：
  - `api`：本地 API base URL 与 health endpoint。
  - `dashboard`：Dashboard 是否由 daemon 挂载，以及可打开 URL。
  - `jobs`：bootstrap / rescan job 能力和稳定 API endpoints。
  - `fileMonitor`：daemon git worktree file monitor 能力、`host-edit` / git source 输入、旧 source alias 兼容。
  - `internalAi`：是否已配置 Alembic internal AI、provider、model、配置来源。
- daemon 启动时写入 `ALEMBIC_DAEMON_DASHBOARD_MOUNTED`，让 health endpoint 能区分 API-only 和带 Dashboard 的 daemon。
- file-change route 接受 `host-edit` 作为新宿主编辑输入，同时继续兼容旧编辑 source；新归一化结果写入 `host-edit`。
- 清理 Alembic 主包剩余可见旧 source / Extension 注释：`HttpServer` route 注释改为 Dashboard / CLI / external host；`status --json` 默认 AI source 改为 `host-agent`；删除已经无消费方的 `LanguageExtensions` shim，调用方改为直接消费 `@alembic/core/host-agent-workflows`。
- 保留 daemon、HTTP/API、Dashboard server、JobStore、ProjectRegistry 和 internal AI jobs；未修改 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`BiliDili` 源码。

## Daemon Capability Shape

`GET /api/v1/daemon/health` 仍返回：

- `mode`
- `projectRoot`
- `dataRoot`
- `projectId`
- `version`
- `pid`
- `uptime`
- `databasePath`
- `schemaMigrationVersion`

新增：

- `dashboardUrl`
- `enhancement: { apiVersion, packageName, route, version }`
- `capabilities.api`
- `capabilities.dashboard`
- `capabilities.jobs`
- `capabilities.fileMonitor`
- `capabilities.internalAi`

Plugin 下一步可用判断：

- `capabilities.jobs.available && capabilities.jobs.kinds` 判断能否投递 bootstrap / rescan。
- `capabilities.dashboard.available && dashboardUrl` 判断是否可打开本地 Dashboard。
- `capabilities.fileMonitor.available` 判断 daemon 是否能承担 file-change monitor。
- `capabilities.internalAi.available` 判断 internal AI job 是否具备 Provider。

## File-Change 兼容策略

- 新输入：`host-edit`、`git-head`、`git-worktree`。
- 旧输入：历史编辑 source 仍兼容，作为 `fileMonitor.compatibilityAliases` 暴露给消费层。
- route 内部将宿主编辑输入归一为 `host-edit`；旧 source 只用于兼容读取，不作为新默认文案或 capabilities 主路线。

## 提交

- Alembic：`91fbe993f389868b9895f086c3695d222027cd0c`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run lint:core-import-boundary`：通过，扫描 415 个文件和 556 个 `@alembic/core` imports。
- `npm run lint:consumer-core-imports`：通过，扫描 415 个文件和 556 个 `@alembic/core` imports。
- `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`：通过，5 个测试通过。
- `npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts`：通过，10 个测试通过。
- `git diff --check`：通过。
- `npx biome check --diagnostic-level=error <modified files>`：通过。
- `rg -n "VSCode|VS Code|Extension|ide-agent|ide-edit|native/IDE" lib bin config templates README.md README_CN.md --glob '!**/dist/**' --glob '!CHANGELOG.md'`：0 命中。

## 遗留风险

- 本轮 Alembic 构建使用 workspace 本地 `../AlembicCore` 源码；复核时 Core 工作区已 clean，HEAD 为 `c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`。Alembic 没有修改 Core，但后续消费层启动仍应以 Core 窗口回填证据为准。
- `fileMonitor.compatibilityAliases` 会在运行时暴露历史编辑 source alias，目的是旧客户端输入兼容；源码扫描无旧字面量命中。
- Plugin 仍未消费新 daemon capabilities；需等 Core / Alembic Wave 1A 都回填后进入 Wave 1B。

## 下一步建议

- `AlembicPlugin` 在 Wave 1B 新增 local Alembic install / daemon probe，优先读取 `/api/v1/daemon/health` 的 `enhancement` 和 `capabilities` 决定 route choice。
- `AlembicPlugin` 的 dashboard/bootstrap/rescan 工具优先使用 `capabilities.dashboard` 与 `capabilities.jobs`，没有本地 daemon 时再回退 embedded runtime。
- 总控应等待 `AlembicCore` source contract 回填后，再向 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 发放消费层任务。
