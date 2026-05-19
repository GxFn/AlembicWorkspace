# Alembic Multi Project Control Wave 1 Runtime Control Foundation

日期：2026-05-18
状态：待验收
归属窗口：Alembic
总控计划：../workspace/alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md

## 任务摘要

按总控计划完成 Alembic Project Runtime Control Foundation。重点是基于真实 Core registry、WorkspaceResolver、daemon state、DaemonSupervisor、JobStore、file monitor、internal AI 能力聚合项目 summary / inspect / status-all 起点，不做空 contract，不提前派发下游。

## 回填要求

- 完成范围：
  - 新增 Alembic repo-local `ProjectRuntimeControl` foundation，基于 Core `ProjectRegistry.list()` / `ProjectRegistry.inspect()` / `WorkspaceResolver.fromProject()`、Core daemon paths、Alembic `DaemonSupervisor.status()`、daemon health、job files 和 workspace AI settings 聚合真实 project runtime scope summary。
  - 新增只读 projects control plane 起点：`snapshot()` / `listProjects()` / `inspectProject()`，覆盖 registry project、project identity、workspace facts、daemon status、Dashboard URL、jobs summary、file monitor capability、internal AI availability、missing / stale / stopped / ready / unavailable 状态。
  - 新增 selected / active state 基础：状态文件位于全局 registry 目录 `runtime-control.json`，不写入任一项目 dataRoot；selected project 显式持久化，active runtime project 从 selected project 的真实 daemon ready 状态派生。
  - 新增 HTTP API：`GET /api/v1/projects`、`GET /api/v1/projects/status`、`GET /api/v1/projects/current`、`GET /api/v1/projects/:projectId`、`POST /api/v1/projects/select`、`DELETE /api/v1/projects/select`。
  - 新增 CLI：`alembic projects list/status/inspect/current/select/clear`，作为 `ghost list` 之外的多项目 control plane 起点。
  - 保持同进程不切项目边界：本波没有在现有 `ServiceContainer` 内重绑 projectRoot，没有复用旧项目 JobStore、file monitor、internal AI runtime、tool context 或 terminal sandbox。
- 关键文件 / 模块变化：
  - `lib/daemon/ProjectRuntimeControl.ts`：新增 project runtime target / summary / scope / selected state foundation。
  - `lib/http/routes/projects.ts`：新增 projects HTTP route。
  - `lib/http/HttpServer.ts`：挂载 `/api/v1/projects`。
  - `bin/cli.ts`：新增 `projects` CLI 命令组和人类可读输出。
  - `test/unit/ProjectRuntimeControl.test.ts`：覆盖 registry/resolver/daemon/jobs 聚合、全局 selected state、missing project 保留。
- 提交 hash：`5802057e99e87a6b3fc0282fc59bfc7eb0bfd175`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
  - `npm run test:unit -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
  - `npm run lint:consumer-core-imports`
  - `npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts lib/http/HttpServer.ts bin/cli.ts test/unit/ProjectRuntimeControl.test.ts`
  - `git -C Alembic diff --check`
  - `git -C Alembic diff --check HEAD~1..HEAD`
- 验证结果：
  - `npm run build:check`：通过，使用 workspace 本地 `../AlembicCore`。
  - `npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`：通过，3 个测试文件、12 个测试通过。
  - `npm run test:unit -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`：通过，3 个测试文件、12 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 419 个文件、562 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error ...`：通过。
  - `git -C Alembic diff --check`：通过。
  - `git -C Alembic diff --check HEAD~1..HEAD`：通过。
- 未完成项 / 风险：
  - 本波只实现 foundation、read-only summary / inspect / status-all 和 selected state 基础；尚未实现 start / stop / open-dashboard / switch orchestration。
  - selected state 已落地，但 active runtime 仍是从 selected project 的真实 daemon ready 状态派生；后续切换编排需要明确停止旧 runtime、启动目标 runtime、返回 handoff 的顺序。
  - HTTP `POST /api/v1/projects/select` 只更新全局 selected state，不启动或停止 daemon，避免本波把“选择”伪装成“切换运行时”。
  - jobs summary 当前只读 job files，不实例化 `JobStore`，避免 status-all 扫描时为缺失项目创建目录；后续若要控制 jobs，需要在目标项目 runtime scope 内显式使用 JobStore。
- 建议 Core contract 下沉字段：
  - `ProjectRuntimeTarget`：`projectId` / `projectRoot` 二选一的目标解析输入。
  - `ProjectConnectionState`：`ready`、`stopped`、`starting`、`stale`、`failed`、`missing`、`unavailable`。
  - `ProjectRuntimeScopeSummary`：project identity、workspace facts、daemon summary、dashboardUrl、jobs summary、fileMonitor summary、internalAi summary、selected / activeRuntime flags、cacheKey 和 owner attribution。
  - `ProjectRuntimeControlState`：global selected project、derived active runtime project、schemaVersion、updatedAt。
  - `ProjectHandoffMismatch` 后续由 Plugin 消费时再沉淀，当前 Alembic 已能提供 selected / active project evidence。
- 是否发现 Plugin / Dashboard / Agent 必须提前参与：
  - 未发现必须提前参与的真实阻塞。
  - `AlembicPlugin` 继续等待 selected / active project contract 后再做 hostProject mismatch。
  - `AlembicDashboard` 继续等待 projects API 稳定后再做项目列表 / handoff UI。
  - `AlembicAgent` 无需提前派发；本波没有发现 internal AI projectRoot / dataRoot 隔离缺口，Alembic scope summary 已把 internal AI availability 作为项目绑定字段暴露。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 通过。实现不是最小连接，已形成 Wave 1 要求的真实 foundation：repo-local `ProjectRuntimeControl`、CLI `projects` 命令组、HTTP `/api/v1/projects` route、全局 selected state、registry / resolver / daemon / jobs / internal AI / file monitor summary 和 focused tests。
  - 功能完整性检查通过：存在真实 CLI / HTTP 入口，summary 来自真实 Core registry / WorkspaceResolver / daemon state / job files / workspace settings；selected state 写在全局 registry 目录，不写入任一项目 dataRoot；`select` 没有伪装成 runtime switch。
  - 总控补跑验证：`npm run build:check` 通过；`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts` 通过，12 tests；`npm run lint:consumer-core-imports` 通过；`npm run build` 通过；临时 `ALEMBIC_HOME` 下 `node dist/bin/cli.js projects list --json` smoke 通过，能读取真实 registry 项目并返回 stopped summary。
- 最小实现判断：
  - 未发现最小实现风险。本波没有只做类型 / 空 route / 静态 mock；具备真实入口、真实数据来源、状态持久化和可执行验证。
- 下一步：
  - 启动 Wave 2 `AlembicCore` contract sedimentation，将 Wave 1 已验证字段沉淀为 public contract；`AlembicPlugin`、`AlembicDashboard` 继续等待；`Alembic` 暂不派发 start / stop / handoff 编排，等 Core contract 后再收口消费。
