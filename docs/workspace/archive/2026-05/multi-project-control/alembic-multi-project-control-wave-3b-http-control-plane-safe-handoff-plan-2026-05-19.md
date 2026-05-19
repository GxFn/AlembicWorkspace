# Alembic Multi Project Control Wave 3B HTTP Control Plane Safe Handoff Plan

日期：2026-05-19
状态：阶段 3B 已验收，Wave 4 Dashboard / Plugin 待启动
维护窗口：AlembicWorkspace

## 目标

本波只启动 `Alembic`，修复 Wave 3 验收发现的 HTTP control-plane 安全交接问题。

Wave 3 的 CLI 线路和 Core contract 消费已经成立，但 HTTP `projects stop / switch` route 挂载在 per-project daemon 内。如果 Dashboard 从当前 active daemon 发起 `switch`，当前实现会在 handler 中直接停止当前 daemon，可能导致请求进程在返回 handoff 前退出。Wave 3B 的目标是让 HTTP `switch / stop / open-dashboard` 真实可供 Dashboard 使用：返回 action result / handoff 后再安全关闭旧 daemon，或者失败时不破坏当前 active runtime。

## 上游依据

- Wave 3 计划：[alembic-multi-project-control-wave-3-alembic-consumer-switch-orchestration-plan-2026-05-19.md](alembic-multi-project-control-wave-3-alembic-consumer-switch-orchestration-plan-2026-05-19.md)
- Alembic Wave 3 回填：[../Alembic/alembic-multi-project-control-wave-3-consumer-switch-orchestration-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-3-consumer-switch-orchestration-2026-05-19.md)
- Alembic Wave 3 提交：`aa6ff57d960797633c2d19f1ab23c277d7eae60b`
- Core contract 提交：`ab5e332843d6da89c3def6bf33631e0397552566`

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已修复 HTTP `projects stop / switch / open-dashboard` self-daemon safe handoff；提交 `633448f` 已通过总控验收。 |
| `AlembicCore`<br>已完成 | Contract 已验收；本波不派发。 |
| `AlembicPlugin`<br>Wave 4 待启动 | 下一波接 hostProject mismatch / disconnect，不做项目切换。 |
| `AlembicDashboard`<br>Wave 4 待启动 | 下一波接项目列表、当前项目、open-dashboard / switch UI。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke。 |

## Alembic 执行要求

范围：

- 读取 `Alembic/AGENTS.md`、本文档、Wave 3 计划和回填、`lib/daemon/ProjectRuntimeControl.ts`、`lib/http/routes/projects.ts`、`lib/daemon/DaemonSupervisor.ts`、`bin/daemon-server.ts`。
- 明确区分 CLI controller 场景和 HTTP self-daemon 场景：
  - CLI / 非 self controller 可以保持 stop current -> start target -> write state -> return handoff。
  - HTTP 请求来自当前 active daemon 时，不允许在 response 发出前杀掉当前进程。
- 对 HTTP self-daemon `switch` 实现安全交接：
  - 识别当前 route 所在 daemon 是否就是 current active runtime，例如比较 `process.env.ALEMBIC_PROJECT_DIR`、daemon state pid、`process.pid` 或等价可靠信号。
  - 先启动目标 daemon 并确认 ready；启动失败时不停止当前 daemon，不清空当前可用 handoff。
  - 成功后写入 selected / active state，返回目标 project handoff。
  - 在 response 完成之后再异步停止旧 daemon，或通过安全 helper / detached controller 完成旧 daemon 停止。
- 对 HTTP self-daemon `stop` 实现安全响应：
  - 必须先返回 action result，再停止当前 daemon；不能让客户端收到 socket reset 代替 JSON 结果。
  - 停止后 activeRuntimeProject 应清空，selected 可保留。
- `open-dashboard` 对当前 selected / active 项目和显式 target 都要保持可用：
  - 同项目时复用 ready daemon。
  - 不同项目时遵循 safe handoff 规则，返回目标 Dashboard URL。
- 保持 Wave 3 已有 CLI 行为、Core contract 消费和 registry 不删除语义。

## 禁止事项

- 不允许把 Dashboard 或 Plugin 改成调用 CLI 来绕过 HTTP 问题。
- 不允许删除 HTTP `start / stop / open-dashboard / switch` action。
- 不允许在同一个 ServiceContainer 内直接改 `projectRoot` 冒充切换。
- 不允许用静态 mock handoff 或仅更新 selected state 代替真实 target daemon ready。
- 不允许启动目标失败后仍停止当前可用 daemon。
- 不允许本波修改 `AlembicDashboard`、`AlembicPlugin` 或 `AlembicAgent` 代码。

## 验收重点

- HTTP self-daemon `switch` 不会在 response 前终止当前请求进程。
- `switch` 成功结果包含 target ready handoff；失败时当前 daemon 仍可用。
- HTTP self-daemon `stop` 能返回 JSON action result，然后再停止 daemon。
- CLI 行为没有回退。
- 功能完整性检查：如果只改测试、不跑真实 route；或只规避 stop 但 Dashboard 仍拿不到 handoff，视为未完成。

## 建议验证

```bash
npm run build:check
npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts
npm run lint:consumer-core-imports
npm run build
git diff --check HEAD~1..HEAD
```

必须新增或扩展 focused tests，覆盖：

- HTTP self-daemon `switch` 返回 handoff 后才触发旧 daemon stop。
- HTTP self-daemon `switch` 目标启动失败时不停止当前 daemon。
- HTTP self-daemon `stop` 返回 action result 后再停止当前 daemon。
- CLI 或非 self controller 的 stop-before-start 行为不回退。

建议补充 isolated temp smoke：

```bash
node dist/bin/cli.js projects start --project-root <isolated-project-a> --json --wait 10000
curl -X POST <project-a-api>/api/v1/projects/<project-b-id>/switch
curl <project-b-api>/api/v1/projects/current
```

如果 Codex sandbox 需要授权才能绑定 / 访问 127.0.0.1，按权限规则执行；不能执行时必须回填替代证据和原因。

## 文档动作

- 新建 / 更新：`docs/Alembic/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-2026-05-19.md`
- 保存位置：workspace 顶层 `docs/Alembic/`
- 挂载入口：本文档“回填区”
- 回填位置：Alembic 执行回填文档 + 本文档“回填区”

回填必须包含：

- 完成范围
- self-daemon 识别方式
- safe handoff 顺序
- HTTP route 变化
- CLI 行为保持证据
- 提交 hash
- 验证命令和结果
- 未完成项 / 风险
- Dashboard / Plugin 是否可以启动

## 可复制提示词

本波已验收完成，不再发送本文档。下一步发送 Wave 4 独立计划。

```text
读取 docs/workspace/alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

发送给：`AlembicDashboard`、`AlembicPlugin`。不发送给：`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### Alembic

- 状态：待总控验收
- 执行文档：[../Alembic/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-2026-05-19.md)
- 完成范围：完成 HTTP `projects stop / switch / open-dashboard` self-daemon safe handoff；保持 CLI / 非 self controller 行为；新增 focused unit tests 和 isolated HTTP route smoke。
- self-daemon 识别方式：`ALEMBIC_DAEMON_MODE=1` + realpath 后的 `ALEMBIC_PROJECT_DIR` 匹配 + `process.pid` 或 `ALEMBIC_DAEMON_STATE_PATH` 匹配 daemon status。
- safe handoff 顺序：HTTP self `switch` 先启动 target 并确认 ready，失败保留 current；成功写入 target active / selected state，返回 target handoff，response `finish` 后异步停止旧 daemon。HTTP self `stop` 先返回 JSON action result，再停止当前 daemon；activeRuntimeProject 在结果中清空，selected 保留。
- HTTP route 变化：HTTP action 统一传入 `deferSelfDaemonStop: true`；`sendAction` 发送响应前登记 deferred stop，响应完成后调用 `DaemonSupervisor.stop()`。
- CLI 行为保持证据：CLI 默认不传 `deferSelfDaemonStop`，非 self controller 测试继续覆盖 stop current -> start target -> persist state -> return handoff。
- 提交 hash：`633448f` (`fix: defer self daemon handoff stops`)
- 验证命令：`npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts test/unit/ProjectRuntimeControl.test.ts`；`npm run build:check`；`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`；`npm run lint:consumer-core-imports`；`npm run build`；`git diff --check`；`git diff --check HEAD~1..HEAD`。
- 验证结果：全部通过；focused tests 为 3 个文件 17 个测试通过；consumer core import lint 扫描 419 个文件和 562 个 `@alembic/core` imports；HTTP smoke 验证 A->B switch 返回 target handoff 后 A 端口退出，B current active 可读，B stop 返回 JSON 后 B 端口退出。
- 遗留风险：本波未修改 Dashboard / Plugin；response finish 后异步 stop 若失败只记录 warning，后续可用 daemon status / 再次 stop 处理。未发现阻塞下一波的 Alembic 侧风险。
- Dashboard / Plugin 下一波建议：总控验收 `633448f` 后可启动 Dashboard 项目列表 / 切换 UI 和 Plugin hostProject mismatch / disconnect 对接。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 通过。HTTP self-daemon switch / stop 的 response-before-stop 问题已修复，Dashboard 可以在下一波消费 HTTP handoff。
  - 总控补跑 `build:check`、目标单测、consumer Core import boundary、`build`、`git diff --check` 均通过。
- 下一波建议：
  - 新建 Wave 4，同时派 `AlembicDashboard` 和 `AlembicPlugin`。Dashboard 做项目列表 / 切换 UI；Plugin 做 hostProject mismatch / disconnect。
