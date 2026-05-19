# Alembic Multi Project Control Wave 2 Core Contract Sedimentation

日期：2026-05-19
状态：已完成
归属窗口：AlembicCore
总控计划：../workspace/alembic-multi-project-control-wave-2-core-contract-sedimentation-plan-2026-05-19.md

## 任务摘要

按总控计划沉淀 Alembic Wave 1 已验证的 project runtime contracts。重点是 public export、边界测试和后续消费映射，不接管 Alembic runtime control service。

## 回填要求

- 完成范围：
  - 新增 Core daemon 层 project runtime control public contract，只沉淀 Alembic Wave 1 已验证的数据形状、状态枚举和少量 helper。
  - 覆盖 `ProjectRuntimeTarget`、`ProjectConnectionState`、`ProjectRuntimeControlState`、`ProjectRuntimeJobsSummary`、`ProjectRuntimeFileMonitorSummary`、`ProjectRuntimeInternalAiSummary`、`ProjectRuntimeDaemonSummary`、`ProjectRuntimeScopeSummary`、`ProjectRuntimeControlSnapshot`。
  - 保留 registry v1 兼容：新增 `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION = 1` 和 `createProjectRuntimeControlState()`，不改 `ProjectRegistry`、`WorkspaceResolver`、daemon state 或 JobStore schema。
  - 新增 target / state helper：`isProjectRuntimeTarget()`、`isProjectConnectionState()`、`normalizeProjectConnectionState()`、`hasSelectedProjectRuntime()`、`hasActiveProjectRuntime()`，服务后续 HTTP / CLI / Plugin / Dashboard 消费。
  - 更新 `@alembic/core/daemon` barrel export、public API smoke 和 focused tests，避免只新增未导出类型。
- 新增 / 更新 public exports：
  - 新增文件：`src/daemon/ProjectRuntimeContracts.ts`。
  - 更新 barrel：`src/daemon/index.ts`，通过 `@alembic/core/daemon` 暴露 project runtime contracts。
  - 运行时 exports：`PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION`、`PROJECT_CONNECTION_STATES`、`PROJECT_RUNTIME_DAEMON_STATUSES`、`PROJECT_RUNTIME_INTERNAL_AI_CONFIG_SOURCES`、`createProjectRuntimeControlState()`、`isProjectConnectionState()`、`normalizeProjectConnectionState()`、`isProjectRuntimeTarget()`、`hasSelectedProjectRuntime()`、`hasActiveProjectRuntime()`。
  - 类型 exports：`ProjectRuntimeTarget`、`ProjectConnectionState`、`ProjectRuntimeControlState`、`ProjectRuntimeJobsSummary`、`ProjectRuntimeFileMonitorSummary`、`ProjectRuntimeInternalAiSummary`、`ProjectRuntimeDaemonSummary`、`ProjectRuntimeScopeSummary`、`ProjectRuntimeControlSnapshot` 等。
- 与 Alembic Wave 1 字段的对应关系：

| Alembic Wave 1 字段 | Core contract | 说明 |
| --- | --- | --- |
| `ProjectRuntimeTarget` | `ProjectRuntimeTarget` + `isProjectRuntimeTarget()` | 明确 `projectId` / `projectRoot` 二选一，避免 route 猜测优先级。 |
| `ProjectConnectionState` | `PROJECT_CONNECTION_STATES` / `ProjectConnectionState` | 覆盖 `ready`、`stopped`、`starting`、`stale`、`failed`、`missing`、`unavailable`。 |
| `ProjectRuntimeControlState` | `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION` + `ProjectRuntimeControlState` + `createProjectRuntimeControlState()` | 保持 Wave 1 `runtime-control.json` schemaVersion 1，支持 selected / active project identity。 |
| `ProjectRuntimeJobsSummary` | `ProjectRuntimeJobsSummary` | 保持 `DaemonJobStatus` 统计、active、latest job 字段。 |
| `ProjectRuntimeFileMonitorSummary` | `ProjectRuntimeFileMonitorSummary` | 保持 accepted sources、endpoint、mode、available 字段。 |
| `ProjectRuntimeInternalAiSummary` | `PROJECT_RUNTIME_INTERNAL_AI_CONFIG_SOURCES` / `ProjectRuntimeInternalAiSummary` | 只沉淀 Wave 1 已验证的 `empty`、`process-env`、`workspace-settings`、`unavailable`。 |
| `ProjectRuntimeDaemonSummary` | `PROJECT_RUNTIME_DAEMON_STATUSES` / `ProjectRuntimeDaemonSummary` | 保留 per-project daemon status、pid、url、state/log path 和 ready 字段。 |
| `ProjectRuntimeScopeSummary` | `ProjectRuntimeScopeSummary` | 保留 registry / workspace facts / daemon / jobs / file monitor / internal AI / flags / owner attribution。 |
| `ProjectRuntimeControlSnapshot` | `ProjectRuntimeControlSnapshot` | 保留 `projects`、`selectedProject`、`activeRuntimeProject`、`state`、`generatedAt`。 |
| selected / active project identity | `ProjectRuntimeControlState` + `hasSelectedProjectRuntime()` / `hasActiveProjectRuntime()` | 作为后续 Plugin hostProject mismatch 和 Dashboard handoff 的最小稳定基础。 |

- 关键文件 / 模块变化：
  - `src/daemon/ProjectRuntimeContracts.ts`：新增 public contract、constants、type guards 和 state helper。
  - `src/daemon/index.ts`：导出 project runtime contracts。
  - `test/ProjectRuntimeContracts.test.ts`：覆盖 connection states、target 二选一、registry-v1 state、snapshot shape。
  - `test/PublicFoundationEntrypoints.test.ts`：确认 daemon entrypoint 暴露 project runtime contracts。
  - `scripts/smoke-public-api.mjs`：增加 `@alembic/core/daemon` public smoke 检查。
- 提交 hash：`ab5e332843d6da89c3def6bf33631e0397552566`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/ProjectRuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts test/RuntimeContracts.test.ts`
  - `npm run build`
  - `npm run check`
  - `npm run smoke:public-api`
  - `git diff --check`
- 验证结果：
  - `npm run build:check`：通过。
  - `npm run test -- test/ProjectRuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts test/RuntimeContracts.test.ts`：通过，3 个测试文件、16 个测试通过。
  - `npm run build`：通过。
  - `npm run check`：通过；包含 `build:check`、`lint:public-api-boundary`、全量 `test`、`lint`。全量 Vitest 63 个测试文件、933 个测试通过；测试环境输出一行既有 `error: Could not access 'HEAD'`，但命令退出码为 0。
  - `npm run smoke:public-api`：通过，75 个 exact public API entrypoints 成功导入。
  - `git diff --check`：通过。
- 未完成项 / 风险：
  - Core 本波只提供确定性 contract、constants 和 helper，不接管 Alembic runtime control service、HTTP route、CLI 或 DaemonSupervisor orchestration。
  - `ProjectRuntimeTarget` 在 Core 中收紧为 `projectId` / `projectRoot` 二选一；Alembic 下一波替换本地类型时，需要先把 HTTP body / CLI 输入归一化后再调用 target guard。
  - Plugin / Dashboard 仍需等待 Alembic 消费 Core contract 并稳定 projects API 后再接入，不能提前猜字段。
- Alembic 下一波替换本地类型建议：
  - 在 `lib/daemon/ProjectRuntimeControl.ts` 中用 `@alembic/core/daemon` 替换本地 `ProjectRuntimeTarget`、`ProjectConnectionState`、`ProjectRuntimeControlState`、`ProjectRuntimeJobsSummary`、`ProjectRuntimeFileMonitorSummary`、`ProjectRuntimeInternalAiSummary`、`ProjectRuntimeDaemonSummary`、`ProjectRuntimeScopeSummary`、`ProjectRuntimeControlSnapshot`。
  - 用 `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION` 替换本地 `STATE_SCHEMA_VERSION`，用 `createProjectRuntimeControlState()` 替换本地 empty state 生成逻辑。
  - 在 `/api/v1/projects/select` 等 route 的 body 入口使用 `isProjectRuntimeTarget()` 或等价归一化逻辑，保持 `projectId` / `projectRoot` 二选一。
  - Alembic 仍保留 ProjectRuntimeControl service、HTTP route、CLI、DaemonSupervisor、start / stop / handoff / switch orchestration；Core 不承担这些运行时职责。
  - 建议验证：`npm run build:check`、`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`、`npm run lint:consumer-core-imports`、针对 `projects list/status/select/current` 的 CLI smoke。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 通过。Core 本波只沉淀 Alembic Wave 1 已验证 contract，没有接管 Alembic runtime control service、HTTP route、CLI 或 DaemonSupervisor orchestration。
  - 功能完整性检查通过：contract 已通过 `@alembic/core/daemon` public export 暴露，有 constants、type guards、state helper、focused tests、public entrypoint test 和 public API smoke；并明确下游 Alembic 替换路径。
  - 总控补跑验证：`npm run check` 通过，63 个测试文件、933 tests；`npm run smoke:public-api` 通过，75 exact public API entrypoints；`git diff --check` 通过。测试环境输出既有 `error: Could not access 'HEAD'`，但命令退出码为 0。
- 最小实现判断：
  - 未发现最小实现风险。本波不是只新增未导出类型；已更新 public barrel、public API smoke 和测试，并写明 Alembic 下一波消费方式。
- 下一步：
  - 启动 Wave 3 `Alembic` consumer + switch orchestration：用 Core contract 替换 Alembic 本地类型，补 projects start / stop / open-dashboard / switch 的真实控制面。
