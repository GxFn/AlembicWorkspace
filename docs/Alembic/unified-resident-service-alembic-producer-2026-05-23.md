# Alembic 统一 Resident Service Producer 回填

状态：已完成，总控验收通过
窗口：Alembic
任务包：`URS-P2-Alembic-Producer`
完成时间：2026-05-23 21:57 CST
验收时间：2026-05-23 22:02 CST
Alembic commit：`70917fa509aed03cbd322d1d46acb1eb50f8f0cc`

## 当前窗口定位

本窗口定位为 `Alembic` 主仓库执行窗口。本轮职责是让 Alembic 主体成为 unified resident service canonical producer，在现有 `/api/v1/daemon/health` 中生产 Core contract 定义的 `residentService` block。

本轮不承担 AlembicPlugin unified client、Codex host-agent workflow、Dashboard 接入、ProjectRuntimeControl 对外开放，也不新增 `/api/v1/resident/status`。

## 完成范围

- 从 `@alembic/core/daemon` 导入 `createAlembicResidentServiceStatus`、resident capability override / status 类型，没有从 Core 深层路径或 Plugin 源码复制类型。
- 在 `lib/http/routes/daemon.ts` 的 `/api/v1/daemon/health` 响应中新增 top-level `data.residentService` canonical block。
- route 固定为 `local-alembic-daemon`，owner 固定为 `alembic`。
- 将现有 health producer 的 API、search、internal AI jobs、Dashboard handoff、file monitor / git worktree collector 和 service scope 映射到 resident capabilities。
- `serviceScope.projectIdentity` 只输出 `dataRootSource`、`projectId`、`schemaMigrationVersion`、`workspaceMode` 等非路径身份摘要；`projectRoot`、`dataRoot`、`databasePath`、`runtimeDir`、`statePath` 只进入 `diagnosticPaths`。
- 保留现有 `runtimeBoundary` 与 `capabilities.residentSearch` 兼容字段，不破坏 `/api/v1/search`、`/api/v1/jobs/*`、`/api/v1/projects/*`。
- 新增 `/api/v1/daemon/health` route 单测，覆盖 response 中的 `residentService` block、capability 可用 / 不可用、internal AI job 与 host-agent recoverable job 区分、Dashboard / file monitor、service scope 非路径身份。

## 变更文件

- `lib/http/routes/daemon.ts`
- `test/unit/DaemonCapabilities.test.ts`
- `test/unit/DaemonHealthRoute.test.ts`

## `residentService` 摘要

```ts
{
  contractVersion: 1,
  route: 'local-alembic-daemon',
  owner: 'alembic',
  healthPath: '/api/v1/daemon/health',
  apiBaseUrl: string | null,
  serviceScope: {
    kind: 'current-project',
    scopeId: 'project:<projectId>' | 'workspace:<workspaceMode>:<dataRootSource>',
    projectIdentity: {
      dataRootSource,
      projectId,
      schemaMigrationVersion,
      workspaceMode
    },
    diagnosticPaths: {
      databasePath,
      dataRoot,
      projectRoot,
      runtimeDir,
      statePath
    }
  },
  capabilities: {
    'status.health',
    'search.keyword',
    'search.semantic',
    'jobs.internal-ai.bootstrap',
    'jobs.internal-ai.rescan',
    'jobs.host-agent-recoverable.bootstrap',
    'jobs.host-agent-recoverable.rescan',
    'dashboard.handoff',
    'file-monitor.git-worktree'
  }
}
```

## 保留兼容字段及消费方

- `data.runtimeBoundary`：继续服务现有 Plugin / Dashboard / ProjectRuntimeControl 诊断读取，保留到 Phase 4 明确迁移消费方后再评估删除或降级。
- `data.capabilities.residentSearch`：继续服务现有 Plugin search resident telemetry 判断，等待 AlembicPlugin Phase 3 unified client 改为读取 `residentService.capabilities` 后再评估收口。
- `/api/v1/projects/*`：仍属于 Alembic 主体 ProjectRuntimeControl，不进入 Plugin resident client contract。

## 未覆盖 capability 及理由

- `jobs.host-agent-recoverable.bootstrap` / `jobs.host-agent-recoverable.rescan`：在 Alembic producer 中显式不可用，owner 为 `alembic-plugin`；该能力只属于 Plugin embedded recoverable host-agent runtime。
- `/api/v1/resident/status`：用户已确认第一版只 formalize `/api/v1/daemon/health`，本轮不新增新 route。
- project list / switch / start / stop：Plugin 不参与项目控制；路径只作诊断，不作为项目身份。

## 验证命令与结果

- `npm run test:unit -- DaemonCapabilities DaemonHealthRoute`：通过，`2` 个测试文件、`4` 个测试通过。
- `./node_modules/.bin/biome check lib/http/routes/daemon.ts test/unit/DaemonCapabilities.test.ts test/unit/DaemonHealthRoute.test.ts`：通过。
- `npm run build:check`：通过，先构建本地 `../AlembicCore`，再执行 `tsc --noEmit`。
- `npm run check`：通过，包含 typecheck、Biome lint、agent extraction boundary、Core import boundary、consumer Core imports。
- `npm run test:unit:codex`：通过，`111` 个测试文件、`1069` 个测试通过。
- `git diff --check`：通过。

## 遗留风险

- `AlembicPlugin` 仍未实现统一 `AlembicResidentServiceClient`，当前只是 Alembic producer 完成上游 contract 生产。
- 兼容字段 `runtimeBoundary` 与 `capabilities.residentSearch` 仍需等 Plugin Phase 3 消费迁移后，在 Phase 4 再判断删除 / 降级。
- internal AI job capability 表示 Alembic daemon 提供 internal workflow job route；provider/model 是否可用仍通过 capability message 与现有 `internalAi` 状态表达，Plugin 不应把它等同 host-agent recoverable job。

## 总控验收结论

验收通过。总控复核了 `Alembic` 干净工作区、commit `70917fa509aed03cbd322d1d46acb1eb50f8f0cc`、`data.residentService` 生产逻辑、`serviceScope.projectIdentity` 非路径身份、`jobs.host-agent-recoverable.*` 在 Alembic producer 中不可用且 owner 为 `alembic-plugin`、兼容字段 `runtimeBoundary` / `capabilities.residentSearch` 保留说明，并复跑 `npm run test:unit -- DaemonCapabilities DaemonHealthRoute` 与 `git -C Alembic diff --check HEAD`。本阶段 producer 可供 `AlembicPlugin` Phase 3 unified client 消费。

## 给 AlembicPlugin Phase 3 的接入建议

- 从 `/api/v1/daemon/health` 读取 `data.residentService`，并使用 `@alembic/core/daemon` 的 resident contracts normalizer / result union；不要猜字段。
- `route === 'local-alembic-daemon' && owner === 'alembic'` 时，才把服务显示为 Alembic resident enhancement。
- `search.keyword` / `search.semantic`、`jobs.internal-ai.bootstrap` / `jobs.internal-ai.rescan`、`dashboard.handoff`、`file-monitor.git-worktree` 均从 `residentService.capabilities` 判断可用性和 unavailable reason。
- embedded fallback 仍只能称为 `embedded-plugin-runtime`，并只声明 `jobs.host-agent-recoverable.*`；不得说成 Alembic internal AI job。
- 不新增 project list / switch / start / stop，不消费 `/api/v1/projects/*`；如果 UI 或 diagnostics 需要展示服务范围，只展示 `serviceScope` 摘要与 `diagnosticPaths`，不要把 `projectRoot` 当项目身份。
