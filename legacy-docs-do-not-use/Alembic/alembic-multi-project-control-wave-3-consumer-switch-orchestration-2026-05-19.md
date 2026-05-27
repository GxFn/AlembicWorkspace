# Alembic Multi Project Control Wave 3 Consumer Switch Orchestration

日期：2026-05-19
状态：待总控验收
归属窗口：Alembic
总控计划：../workspace/alembic-multi-project-control-wave-3-alembic-consumer-switch-orchestration-plan-2026-05-19.md

## 任务摘要

消费 `AlembicCore` Wave 2 已验收的 project runtime public contract，替换 Alembic 本地重复类型，并补齐 projects start / stop / open-dashboard / switch 的真实 CLI + HTTP 控制面。

## 回填要求

- 完成范围：已完成 Alembic consumer switch orchestration。`ProjectRuntimeControl` 现在消费 Core project runtime contract，提供 start / stop / open-dashboard / switch action result；CLI 与 HTTP 都有真实控制入口；单 active runtime 下 switch 会停止当前 active daemon、启动目标 daemon、写入 selected / active state，并返回 API / Dashboard handoff。
- Core contract 替换范围：`lib/daemon/ProjectRuntimeControl.ts` 移除本地重复的 `ProjectRuntimeTarget`、`ProjectConnectionState`、`ProjectRuntimeControlState`、`ProjectRuntimeJobsSummary`、`ProjectRuntimeFileMonitorSummary`、`ProjectRuntimeInternalAiSummary`、`ProjectRuntimeDaemonSummary`、`ProjectRuntimeScopeSummary`、`ProjectRuntimeControlSnapshot` 和本地 schema 常量，改为从 `@alembic/core/daemon` 消费并 re-export 这些 public types；state 初始化和读取统一使用 `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION` / `createProjectRuntimeControlState()`，target 校验使用 `isProjectRuntimeTarget()`。
- 新增 / 更新 CLI 控制入口：`alembic projects start`、`stop`、`open-dashboard`、`switch`；`inspect` / `select` 同步支持 `--project-root`；`open-dashboard` 无显式 target 时走当前 active / selected runtime，有 target 时按 target 启动 / 复用并返回 handoff。
- 新增 / 更新 HTTP 控制入口：`POST /api/v1/projects/:projectId/start`、`/stop`、`/open-dashboard`、`/switch`；补充 `POST /api/v1/projects/open-dashboard` 用于当前 active / selected runtime handoff；`POST /api/v1/projects/select` 对 projectId / projectRoot 做 Core target 校验。
- `switch` 编排顺序：读取当前 snapshot；解析目标项目并构造目标 runtime summary；若当前 active runtime 与目标不同，先调用 `DaemonSupervisor.stop()` 停止当前 active；随后调用 `DaemonSupervisor.start()` 启动目标 daemon；根据目标 daemon ready 状态写入 selected / active state；返回 previousActiveProject、stoppedProject、targetProject、snapshot 和 handoff。
- 失败 / missing / stale / unavailable 处理：目标项目路径缺失时不启动并返回 `ok:false`；停止当前 active 失败时不继续启动目标并返回失败 action result；目标 daemon 未 ready 或启动失败时只保留 selected、清空 active，并返回 daemon message / start error；missing / unavailable / stale / failed 项目仍保留在 registry summary 中，不自动删除用户项目记录。
- 关键文件：`Alembic/lib/daemon/ProjectRuntimeControl.ts`、`Alembic/bin/cli.ts`、`Alembic/lib/http/routes/projects.ts`、`Alembic/test/unit/ProjectRuntimeControl.test.ts`。
- 提交 hash：`aa6ff57d960797633c2d19f1ab23c277d7eae60b`
- 验证命令：`npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts bin/cli.ts test/unit/ProjectRuntimeControl.test.ts`
- 验证命令：`npm run build:check`
- 验证命令：`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
- 验证命令：`npm run lint:consumer-core-imports`
- 验证命令：`npm run build`
- 验证命令：`node dist/bin/cli.js projects list --json`（isolated temp `ALEMBIC_HOME`）
- 验证命令：`node dist/bin/cli.js projects current --json`（isolated temp `ALEMBIC_HOME`）
- 验证命令：`node dist/bin/cli.js projects start --project-root <isolated-temp-project-a> --json --wait 10000`（授权本地 127.0.0.1 daemon 绑定）
- 验证命令：`node dist/bin/cli.js projects open-dashboard --project-root <isolated-temp-project-a> --json --wait 10000`（授权本地 127.0.0.1 daemon 访问）
- 验证命令：`node dist/bin/cli.js projects switch --project-root <isolated-temp-project-b> --json --wait 10000 --stop-wait 5000`（授权本地 127.0.0.1 daemon 绑定 / 访问）
- 验证命令：`node dist/bin/cli.js projects open-dashboard --json --wait 10000`（无 target，使用 selected runtime；授权本地 127.0.0.1 daemon 绑定 / 访问）
- 验证命令：`node dist/bin/cli.js projects stop --project-root <isolated-temp-project-b> --json --wait 5000`（授权停止临时 daemon）
- 验证命令：`git diff --check HEAD~1..HEAD`
- 验证结果：通过。Biome focused check 无 error；`build:check` 通过；3 个 unit test 文件共 14 个测试通过；consumer Core import boundary 扫描 419 files / 562 imports 通过；`npm run build` 通过；CLI smoke 的 list/current/start/open-dashboard/switch/open-dashboard(no target)/stop 均返回预期 JSON，switch 结果包含 previous active、stopped project、target ready handoff，最后 stop 后 activeRuntimeProject 为 null 且 selected 保留。
- 未完成项 / 风险：本波未修改 Dashboard / Plugin / Agent；HTTP route 已具备 projectId action 与 current open-dashboard action，但 Dashboard UI 尚未消费；Codex sandbox 内无法直接绑定 127.0.0.1，daemon smoke 需授权后运行，授权后通过。
- Plugin / Dashboard 下一波是否可以启动：可以。建议下一波让 Dashboard 消费 projects list/current/action result 与 handoff 字段；Plugin 在 Alembic API 稳定基础上处理 hostProject mismatch / disconnect 状态，不再猜测本地 contract。

## 总控验收记录

- 验收状态：未通过，需 Wave 3B 补齐
- 验收时间：2026-05-19
- 验收结论：
  - 部分通过。Alembic 已真实消费 `@alembic/core/daemon` project runtime contract，CLI `projects start / stop / open-dashboard / switch`、核心 action result、单测和 import boundary 证据成立。
  - 功能完整性检查发现阻塞问题：HTTP `projects stop / switch` route 挂载在 per-project daemon 内，当前实现会在 route handler 中直接 `DaemonSupervisor.stop()` 当前 active runtime。如果请求来自当前 active daemon，服务进程可能在返回 handoff 前被终止，Dashboard 无法可靠收到切换结果。
  - 这不是文档问题，也不是 Plugin / Dashboard 可绕过的问题；Dashboard 后续不能用 CLI，只能消费 HTTP/API handoff，因此 HTTP control-plane 必须先补安全交接。
  - 总控补跑验证：`npm run build:check` 通过；`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts` 通过，3 个测试文件、14 tests；`npm run lint:consumer-core-imports` 通过，419 files / 562 imports；`npm run build` 通过；`git diff --check HEAD~1..HEAD` 通过。
- 最小实现判断：
  - 不是空实现，CLI 和 service 编排是真实的；但 HTTP action 还不能算真实可用控制面。按“功能完整性检查”规则，需要补一轮非最小完整实现。
- 下一步：
  - 启动 Wave 3B `Alembic` HTTP control-plane safe handoff：识别 self-daemon 场景，保证 HTTP `switch / stop / open-dashboard` 能在返回 action result / handoff 后再安全关闭当前 daemon，或在失败时不破坏当前 active runtime。
