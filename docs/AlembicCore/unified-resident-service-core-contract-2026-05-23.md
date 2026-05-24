# AlembicCore 统一 Resident Service Contract 回填

状态：已完成，总控验收通过
窗口：AlembicCore
任务包：`URS-P1-Core-Contract`
完成时间：2026-05-23 21:34 CST
验收时间：2026-05-23 21:45 CST
Core commit：`b5e3bd5496d8831ae167ecfa79598dd6d792b60b`

## 当前窗口定位

本窗口定位为 `AlembicCore`。本轮职责是提供 Plugin 与 Alembic 统一 resident service 的 Core contract foundation，作为 Alembic producer 与 AlembicPlugin consumer 的上游契约来源。

本轮不承担 Alembic daemon health producer 接入、不承担 AlembicPlugin unified client 实现、不承担项目控制实现、不承担 Dashboard 接入，也不新增 `/api/v1/resident/status`。

## 完成范围

- 新增 `src/daemon/ResidentServiceContracts.ts`，由 `@alembic/core/daemon` 导出 resident service contract。
- 覆盖 route kind、service owner、feature capability、unavailable reason、result union、service scope summary、probe summary、search / job / dashboard request-response 类型。
- 复用现有 `RuntimeContracts` 的 route、health path、project identity summary，以及 `JobStore` 的 job status 类型；没有新增 provider、runtime 或外层服务实现。
- 明确 `jobs.internal-ai.*` 属于 Alembic resident internal workflow，`jobs.host-agent-recoverable.*` 属于 AlembicPlugin embedded recoverable host-agent workflow。
- 明确 `serviceScope` 只描述当前服务范围：项目语义字段只保留非路径身份摘要，路径只进入 `diagnosticPaths`，不得作为 Plugin 项目列表、切换、启停或 folder-as-project 身份。
- 增加 `test/ResidentServiceContracts.test.ts`，覆盖 local Alembic、embedded Plugin、unavailable normalizer、capability summary、job family 区分和 probe wrapper。
- 更新 `scripts/smoke-public-api.mjs`，锁住 resident runtime symbols 和 `.d.ts` 类型出口。

## 变更文件

- `src/daemon/ResidentServiceContracts.ts`
- `src/daemon/index.ts`
- `test/ResidentServiceContracts.test.ts`
- `scripts/smoke-public-api.mjs`

## 导出路径

- 稳定消费入口：`@alembic/core/daemon`
- 关键运行时符号：`ALEMBIC_RESIDENT_FEATURES`、`ALEMBIC_RESIDENT_SERVICE_CONTRACT_VERSION`、`createAlembicResidentServiceStatus`、`normalizeAlembicResidentServiceStatus`、`summarizeAlembicResidentServiceStatus`、`classifyAlembicResidentJobFeature`
- 关键类型：`AlembicResidentServiceStatus`、`AlembicResidentServiceResult`、`AlembicResidentServiceProbe`、`AlembicResidentSearchRequest`、`AlembicResidentJobSubmitRequest`、`AlembicResidentJobReadRequest`、`AlembicResidentDashboardHandoff`

## 验证命令与结果

- `npm run check`：通过。包含 `build:check`、public API boundary、全量 Vitest `66 files / 955 tests`、Biome lint。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，成功导入 `75` 个 exact public API entrypoints，并检查 resident service 类型声明。
- `git -C AlembicCore diff --check`：通过。

## 未纳入字段及理由

- 未新增 `/api/v1/resident/status`：本轮只 formalize `/api/v1/daemon/health` 的 resident capability discovery。
- 未加入 project list / switch / start / stop：Plugin 不参与 ProjectRuntimeControl；项目控制仍归 Alembic 主体。
- 未把 `projectRoot` 放入 `projectIdentity`：路径只作为 `diagnosticPaths`，避免 Plugin 把文件夹误认为项目身份。
- 未实现 HTTP client / daemon producer / Plugin adapter：本轮只做 Core contract foundation，消费和生产在后续窗口按 contract 接入。

## 遗留风险

- Alembic producer 还未把现有 `runtimeBoundary`、`residentSearch`、jobs、dashboard 映射到 `residentService` canonical block。
- AlembicPlugin 还未收束分散的 search、jobs、status、dashboard client；在 Alembic producer 完成前不应猜字段。
- `serviceScope.scopeId` 的生产规则需要 Alembic 在 Phase 2 固定，Core 目前只提供字段和 normalizer。

## 总控验收结论

验收通过。总控复核了 `AlembicCore` 干净工作区、commit `b5e3bd5496d8831ae167ecfa79598dd6d792b60b`、新增 contract / test / export / public API smoke 文件，以及 `git -C AlembicCore diff --check HEAD`。本阶段 contract foundation 可供 `Alembic` Phase 2 producer 消费；`AlembicPlugin` 仍等待 Alembic producer 回填后再启动。

## 给 Alembic 的下一步接入建议

- 在 `/api/v1/daemon/health` 中新增 `residentService` block，使用 `createAlembicResidentServiceStatus` 或等价结构生产。
- route 固定为 `local-alembic-daemon`，owner 固定为 `alembic`。
- capability 至少声明 `status.health`、`search.keyword`、`search.semantic`、`jobs.internal-ai.bootstrap`、`jobs.internal-ai.rescan`、`dashboard.handoff`、`file-monitor.git-worktree` 的可用性与 unavailable reason。
- `serviceScope.projectIdentity` 只放 `projectId`、`workspaceMode`、`dataRootSource`、`schemaMigrationVersion` 等非路径身份摘要；路径进入 `diagnosticPaths`。
- 保留现有 `runtimeBoundary` / `residentSearch` 兼容字段，先新增 canonical block，不破坏现有 Plugin 和 Dashboard 调用方。

## 给 AlembicPlugin 的下一步接入建议

- 等 Alembic producer 回填后再实现 unified client，避免 Plugin 侧猜字段。
- 统一从 `@alembic/core/daemon` 导入 resident contracts，不从 Core 深层文件或 Alembic 主仓库源码取类型。
- `alembic_search`、prime search、jobs、dashboard、status 后续都应投影同一套 `AlembicResidentServiceResult<T>` / unavailable reason。
- embedded fallback 必须声明为 `embedded-plugin-runtime` 和 `jobs.host-agent-recoverable.*`，不要称为 Alembic resident internal AI job。
- 不新增项目控制方法，不消费 `/api/v1/projects/*`，不把 `diagnosticProjectRoot` 或 `serviceScope.diagnosticPaths.projectRoot` 作为项目身份。
