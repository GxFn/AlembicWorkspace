# Alembic Module Boundary Foundation Wave 1 Core Contracts

日期：2026-05-18
窗口：AlembicCore
状态：已完成

## 完成范围

- 新增 `src/daemon/RuntimeContracts.ts`，在 `@alembic/core/daemon` 下提供 headless runtime / capability / file monitor contract。
- 新增 runtime identity contract：
  - `AlembicRuntimeProjectIdentity`
  - `AlembicRuntimeEnhancementIdentity`
  - `AlembicRuntimeHealthData`
  - `createAlembicRuntimeHealthData()`
  - `createAlembicRuntimeEnhancementIdentity()`
- 新增 capability contract：
  - `AlembicRuntimeCapabilities`
  - `AlembicApiCapability`
  - `AlembicDashboardCapability`
  - `AlembicFileMonitorCapability`
  - `AlembicInternalAiCapability`
  - `AlembicJobsCapability`
  - `createAlembicRuntimeCapabilities()`
  - `summarizeAlembicRuntimeCapabilities()`
- 新增 file monitor / route 常量和类型：
  - `ALEMBIC_RUNTIME_HEALTH_PATH`
  - `ALEMBIC_FILE_CHANGES_PATH`
  - `ALEMBIC_JOB_ENDPOINTS`
  - `ALEMBIC_FILE_MONITOR_EVENT_SOURCES`
  - `ALEMBIC_FILE_MONITOR_COMPATIBILITY_ALIASES`
  - `AlembicRuntimeRouteKind`
  - `AlembicFileMonitorMode`
  - `normalizeAlembicRuntimeRouteKind()`
  - `normalizeAlembicFileMonitorMode()`
- `src/daemon/index.ts` 导出新 contract；public API smoke 增加 `@alembic/core/daemon` 检查。
- 新增 `test/RuntimeContracts.test.ts`，覆盖 runtime capability shape、health data、summary 和 route kind normalizer。
- 更新 `test/PublicFoundationEntrypoints.test.ts`，确认既有 daemon entrypoint 暴露 runtime capability contract。

## 边界判断

- Core 只提供类型、常量和纯 helper，不引入 HTTP server、Dashboard UI、Codex MCP、AI provider 或 daemon supervisor 实现。
- `Alembic` 后续可用 `createAlembicRuntimeCapabilities()` 生成 `/api/v1/daemon/health` 的 `capabilities`，避免本地 daemon 自定义 shape。
- `AlembicPlugin` 后续可用 `summarizeAlembicRuntimeCapabilities()` 读取 local daemon / embedded runtime health，避免继续维护一套孤立 summary type。
- `AlembicDashboard` 后续可直接消费 `AlembicRuntimeHealthData` / `AlembicRuntimeCapabilities` 对齐前端 API 类型，但不拥有 route policy。
- File monitor contract 明确 `daemon-git-worktree` 是 Alembic daemon 长期主实现；`host-event-bridge` 和 `embedded-runtime-adapter` 只描述 adapter 模式，不把主实现迁给 Plugin。

## 提交

- AlembicCore commit：`58e21d64fc47e8c96b2885ac23b2d32460317497`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run lint`：通过，419 files checked。
- `npm run test -- test/RuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts`：通过，2 files / 10 tests。
- `npm run lint:public-api-boundary`：通过，136 package exports classified；stable=17 / provisional=21 / transitional=98。
- `npm run build`：通过；`dist/` 为 ignored 构建产物，未提交。
- `npm run smoke:public-api`：通过，Imported 75 exact public API entrypoints。
- `git diff --check`：通过。

## 遗留风险

- 本阶段只补 Core contract，尚未改 Alembic / AlembicPlugin / AlembicDashboard 的真实消费代码；外层仍可能暂时保留各自的本地 shape。
- `@alembic/core/daemon` 目前仍是既有包入口，public API 边界状态未在本阶段提升或收敛，只作为前期模块划分 contract 使用。
- `embedded-plugin-runtime` 作为 route kind 进入 Core contract，是为了描述现有 Plugin adapter route；它不代表 Core 拥有 Plugin runtime。

## 下一波模块划分建议

- `Alembic`：把 `/api/v1/daemon/health` 的 `enhancement` / `capabilities` 改为使用 Core 的 runtime contract helper 生成，并保留 daemon-owned file monitor 主实现。
- `AlembicPlugin`：删除或收敛本地 `CodexDaemonCapabilitySummary` / route summary duplication，改为消费 Core summary helper；`DaemonSupervisor` 继续只是 Codex adapter / embedded runtime adapter。
- `AlembicDashboard`：将前端 `ProjectData` / API health 类型逐步对齐 `AlembicRuntimeHealthData`，只展示 capability 和 route，不实现 route policy。
- `AlembicAgent`：如果需要展示 internal AI runtime availability，优先消费 `AlembicInternalAiCapability`，不要复刻 Plugin host-agent route。
