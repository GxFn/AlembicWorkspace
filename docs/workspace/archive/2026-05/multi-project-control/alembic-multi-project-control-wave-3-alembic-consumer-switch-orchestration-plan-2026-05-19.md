# Alembic Multi Project Control Wave 3 Alembic Consumer Switch Orchestration Plan

日期：2026-05-19
状态：阶段 3 验收未通过，Wave 3B Alembic 待启动
维护窗口：AlembicWorkspace

## 目标

本波只启动 `Alembic`。目标是消费 `AlembicCore` 已验收的 project runtime public contract，并把 Alembic 自己的 projects runtime control 做成真实可用的控制面：start、stop、open-dashboard、switch 都要能围绕单 active runtime 完成关闭 / 启动 / 重连 / 状态更新。

本波不是 Plugin / Dashboard 接入波，也不是把多项目同时运行一次做完。当前模型保持“同一时刻一个 active runtime”，但实现方式必须为后续多项目并行留下清晰边界：project binding、runtime scope、daemon / Dashboard / jobs / file monitor / internal AI 状态都按项目归属表达。

## 上游依据

- Wave 1 执行计划：[alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md](alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md)
- Alembic Wave 1 回填：[../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md](../../../../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md)
- Wave 2 Core 计划：[alembic-multi-project-control-wave-2-core-contract-sedimentation-plan-2026-05-19.md](alembic-multi-project-control-wave-2-core-contract-sedimentation-plan-2026-05-19.md)
- AlembicCore Wave 2 回填：[../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md](../../../../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md)
- 目标阶段确认：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | Wave 3 已完成 CLI 与 service 编排，但 HTTP `switch / stop` 存在 self-daemon handoff 风险；转入 Wave 3B 修复。 |
| `AlembicCore`<br>已完成 | Wave 2 contract 已验收，提交 `ab5e332843d6da89c3def6bf33631e0397552566`；本波不再派发。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic projects API 和 handoff / mismatch 字段稳定后再处理 hostProject mismatch。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic projects API 稳定后再做项目列表、当前项目、切换 / 打开 Dashboard UI。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；internal AI isolation 本波不触发 Agent 修改。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke；稳定后再作为只读真实项目验证。 |

## Alembic 执行要求

范围：

- 读取 `Alembic/AGENTS.md`、本文档、Wave 1 / Wave 2 文档，以及 `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` 的真实实现。
- 在 Alembic 中消费 `@alembic/core/daemon`：
  - `ProjectRuntimeTarget`
  - `ProjectConnectionState`
  - `ProjectRuntimeControlState`
  - `ProjectRuntimeJobsSummary`
  - `ProjectRuntimeFileMonitorSummary`
  - `ProjectRuntimeInternalAiSummary`
  - `ProjectRuntimeDaemonSummary`
  - `ProjectRuntimeScopeSummary`
  - `ProjectRuntimeControlSnapshot`
  - `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION`
  - `createProjectRuntimeControlState()`
  - `isProjectRuntimeTarget()` / connection state helpers，按实际入口需要使用。
- 替换 `lib/daemon/ProjectRuntimeControl.ts` 中本地重复类型、schema 常量和 empty state 生成逻辑；保留 Alembic service、route、CLI、DaemonSupervisor、JobStore 的运行职责。
- 补齐真实控制面：
  - CLI：`alembic projects start`、`stop`、`open-dashboard`、`switch`，或按现有命令结构给出等价能力。
  - HTTP：`/api/v1/projects/:projectId/start`、`/stop`、`/open-dashboard`、`/switch`，或按现有 route 结构给出等价能力。
  - `switch` 必须完成 target 解析、停止当前 active runtime、启动目标项目 daemon、更新 selected / active state、返回 Dashboard/API handoff。
  - `open-dashboard` 必须基于目标项目或 active runtime 返回可用 Dashboard URL / handoff，不只返回静态占位。
- 保持 `list`、`status` / `inspect`、`current`、`select`、`clear` 等现有能力；`select` 仍然只是选择状态，`switch` 才执行 runtime 改变。
- 对 missing / unavailable / stale / failed 项目给出明确状态或错误，不自动删除用户项目记录。
- 更新本地 consumer import boundary，避免继续复制 Core 已有 public contract。

## 禁止事项

- 不允许只做类型替换，不补可用 CLI / HTTP 控制入口。
- 不允许把 `switch` 做成只改 selected state；必须真实关闭当前 runtime 并启动目标 runtime，无法启动时要有 failed / stale 状态证据。
- 不允许在同一个 ServiceContainer 内直接改 `projectRoot` 冒充切换。
- 不允许继续保留一份与 Core contract 重复的临时类型作为主路径。
- 不允许删除或重写用户已有 registry 项目记录。
- 不允许本波修改 `AlembicPlugin`、`AlembicDashboard` 或 `AlembicAgent` 代码；需要下游字段时写入回填建议。

## 验收重点

- Alembic 是否真正消费 Core public contract，而不是继续复制本地 contract。
- CLI 和 HTTP 是否都有可用的 start / stop / open-dashboard / switch 入口。
- `switch` 是否有真实 runtime 编排：stop current、start target、update selected / active、return handoff。
- 错误项目、缺失项目、未启动 daemon、Dashboard 不可用等状态是否可解释。
- 功能完整性检查：如果只是补空 route、空命令、静态 mock URL、只替换类型、或没有真实 orchestration，视为最小实现，必须补一轮非最小完整实现。

## 建议验证

```bash
npm run build:check
npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts
npm run lint:consumer-core-imports
npm run build
```

建议补充 smoke：

```bash
node dist/bin/cli.js projects list --json
node dist/bin/cli.js projects current --json
node dist/bin/cli.js projects start --project-root <isolated-temp-project> --json
node dist/bin/cli.js projects open-dashboard --project-root <isolated-temp-project> --json
node dist/bin/cli.js projects stop --project-root <isolated-temp-project> --json
```

如果 isolated temp project smoke 会误伤当前用户 daemon，可以不执行 start / stop，但必须在回填中说明替代验证证据。

## 文档动作

- 新建 / 更新：`docs/Alembic/alembic-multi-project-control-wave-3-consumer-switch-orchestration-2026-05-19.md`
- 保存位置：workspace 顶层 `docs/Alembic/`
- 挂载入口：本文档“回填区”
- 回填位置：Alembic 执行回填文档 + 本文档“回填区”

回填必须包含：

- 完成范围
- Core contract 替换范围
- 新增 / 更新 CLI 与 HTTP 控制入口
- `switch` 编排顺序与失败处理
- 关键文件
- 提交 hash
- 验证命令和结果
- 未完成项 / 风险
- Plugin / Dashboard 下一波是否可以启动

## 可复制提示词

发送给：`Alembic`

```text
读取 docs/workspace/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`（已完成）、`AlembicPlugin`（阻塞）、`AlembicDashboard`（阻塞）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### Alembic

- 状态：待总控验收
- 执行文档：[../Alembic/alembic-multi-project-control-wave-3-consumer-switch-orchestration-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-3-consumer-switch-orchestration-2026-05-19.md)
- 完成范围：Alembic 已完成 Core contract 消费、ProjectRuntimeControl action orchestration、CLI 控制入口、HTTP 控制入口和 switch / open-dashboard 单 active runtime smoke。
- Core contract 替换范围：`ProjectRuntimeControl.ts` 已移除本地重复 project runtime public types / schema constant / empty state copy，改为消费并 re-export `@alembic/core/daemon` 的 project runtime contract；state helper 使用 `PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION` / `createProjectRuntimeControlState()`；target 校验使用 `isProjectRuntimeTarget()`。
- CLI / HTTP 控制入口：CLI 新增 `projects start`、`stop`、`open-dashboard`、`switch`，`inspect` / `select` 支持 `--project-root`；HTTP 新增 `POST /api/v1/projects/:projectId/start|stop|open-dashboard|switch` 和 `POST /api/v1/projects/open-dashboard`。
- `switch` 编排证据：真实 CLI smoke 中先启动 isolated project A，再 `projects switch --project-root <isolated-project-b>`；结果包含 previous active project A、stopped project A、target project B ready、API / Dashboard handoff、selected / active state 更新到 project B；随后 stop 后 activeRuntimeProject 为 null。
- 提交 hash：`aa6ff57d960797633c2d19f1ab23c277d7eae60b`
- 验证命令：`npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts bin/cli.ts test/unit/ProjectRuntimeControl.test.ts`
- 验证命令：`npm run build:check`
- 验证命令：`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
- 验证命令：`npm run lint:consumer-core-imports`
- 验证命令：`npm run build`
- 验证命令：isolated temp `node dist/bin/cli.js projects list/current/start/open-dashboard/switch/open-dashboard(no target)/stop --json` smoke
- 验证命令：`git diff --check HEAD~1..HEAD`
- 验证结果：全部通过；unit 共 14 tests passed；Core import boundary 扫描 419 files / 562 imports passed；CLI smoke 的 daemon start/open/switch/stop 均返回 `ok:true` 并完成 handoff / state 变化；最后临时 daemon 已 stop。
- 遗留风险：Codex sandbox 内 daemon 绑定 127.0.0.1 会触发 EPERM，真实 daemon smoke 已按权限规则授权后通过；本波未修改 Dashboard / Plugin / Agent，下游仍需消费稳定后的 API / handoff 字段。
- Plugin / Dashboard 下一波建议：可以启动 Dashboard / Plugin 下游消费波。Dashboard 优先接入 projects list/current/action result 与 open-dashboard / switch UI；Plugin 优先基于 stable projects API 处理 hostProject mismatch / disconnect，不再自建 runtime contract。

### 总控验收

- 状态：未通过，需 Wave 3B 补齐
- 验收时间：2026-05-19
- 验收结论：
  - 部分通过。Alembic 已消费 Core contract，CLI `projects start / stop / open-dashboard / switch` 和 service action result 具备真实实现；总控补跑 `build:check`、目标单测、consumer Core import boundary、`build`、`git diff --check` 均通过。
  - 阻塞问题：HTTP `projects stop / switch` route 运行在 per-project daemon 内，当前实现会在 handler 中直接停止当前 active daemon。若 Dashboard 从当前 daemon 发起切换，请求进程可能在返回 handoff 前被终止，不能算真实可用的 HTTP control-plane。
- 下一波建议：
  - 新建 Wave 3B，只派 `Alembic` 修 HTTP safe handoff；`AlembicPlugin` / `AlembicDashboard` 继续阻塞，等 HTTP switch / stop 安全后再启动下游消费。
