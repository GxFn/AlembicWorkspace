# Alembic Multi Project Control Wave 3B HTTP Control Plane Safe Handoff

日期：2026-05-19
状态：Alembic 已提交，待总控验收
归属窗口：Alembic
总控计划：../workspace/alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md

## 任务摘要

修复 Wave 3 验收发现的 HTTP self-daemon handoff 问题：Dashboard 从当前 active daemon 发起 `projects switch / stop / open-dashboard` 时，必须先返回 action result / handoff，再安全关闭旧 daemon；目标启动失败时不能破坏当前 active runtime。

## Alembic 回填

- 完成范围：完成 HTTP `projects stop / switch / open-dashboard` 的 self-daemon safe handoff；保持 CLI / 非 self controller 的 stop-before-start 行为；补齐 focused unit tests 和 isolated HTTP route smoke。
- self-daemon 识别方式：仅在 `ALEMBIC_DAEMON_MODE=1` 时启用；通过 realpath 后的 project root 对比 `ALEMBIC_PROJECT_DIR` 确认同一项目，再用 daemon status pid 等于 `process.pid`，或 `ALEMBIC_DAEMON_STATE_PATH` 等于目标 daemon state path，确认当前 HTTP route 所在进程就是当前 active daemon。
- safe handoff 顺序：HTTP self `switch` 先启动 target daemon 并确认 ready；失败时不停止当前 daemon、不改 active / selected state；成功时写入 target selected / active state，返回 target handoff，并在 response `finish` 后异步停止旧 daemon。HTTP self `stop` 先清空 active state 并返回 action result，response 完成后再停止当前 daemon。CLI / 非 self controller 仍保持先 stop current、再 start target、再写 state、再返回 handoff。
- HTTP route 变化：`lib/http/routes/projects.ts` 对 HTTP action 统一注入 `deferSelfDaemonStop: true`；`sendAction` 在发送 JSON 前登记 deferred stop，在 response 完成后用 `DaemonSupervisor.stop()` 执行旧 daemon 停止，失败只记录 warning，不让客户端收到 socket reset。
- CLI 行为保持证据：既有 `switch stops current active runtime, starts target and persists selected runtime` 测试继续覆盖非 self controller；`ProjectRuntimeControl` 只在显式 `deferSelfDaemonStop` 且识别为当前 daemon 时改变顺序，CLI 默认路径不传该选项。
- 关键文件：`lib/daemon/ProjectRuntimeControl.ts`、`lib/http/routes/projects.ts`、`test/unit/ProjectRuntimeControl.test.ts`
- 提交 hash：`633448f` (`fix: defer self daemon handoff stops`)
- 验证命令：
  - `npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts test/unit/ProjectRuntimeControl.test.ts`
  - `npm run build:check`
  - `npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
  - `npm run lint:consumer-core-imports`
  - `npm run build`
  - `git diff --check`
  - `git diff --check HEAD~1..HEAD`
- 验证结果：全部通过；focused tests 为 3 个文件 17 个测试通过，consumer core import lint 扫描 419 个文件和 562 个 `@alembic/core` imports。
- HTTP smoke 结果：isolated temp A daemon 启动后从 A API `POST /api/v1/projects/<project-b-id>/switch` 返回 `success: true`、target B ready handoff 和 `deferredStopProject` A；A 端口在 response 后断开。随后 B API `GET /api/v1/projects/current` 返回 B 为 active / selected；`POST /api/v1/projects/<project-b-id>/stop` 返回 `success: true`、`deferredStopProject` B 和 `activeRuntimeProject: null`；B 端口在 response 后断开。
- 未完成项 / 风险：本波不修改 Dashboard / Plugin；如果 response 完成后的异步 stop 失败，route 只记录 warning，后续可通过 daemon status / 再次 stop 观察和修复。当前未发现阻塞下一波的 Alembic 侧风险。
- Dashboard / Plugin 下一波是否可以启动：Alembic 侧 HTTP handoff 已具备可消费基础；建议总控验收 `633448f` 后启动 Dashboard 项目列表 / 切换 UI 和 Plugin hostProject mismatch / disconnect 对接。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 通过。Alembic 已修复 HTTP self-daemon handoff：HTTP action 传入 `deferSelfDaemonStop`，service 层识别当前进程 daemon，成功时返回 target handoff 并在 response `finish` 后停止旧 daemon；目标启动失败时保留当前 active runtime。
  - 功能完整性检查通过：不是只改文档或 mock。`ProjectRuntimeControlActionResult` 增加 `deferredStopProject`，`projects` route 在响应完成后异步 stop，focused tests 覆盖 self switch、self stop、目标启动失败和 CLI/非 self 行为保持。
  - 总控补跑验证：`npm run build:check` 通过；`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts` 通过，3 个测试文件、17 tests；`npm run lint:consumer-core-imports` 通过，419 files / 562 imports；`npm run build` 通过；`git diff --check` 与 `git diff --check HEAD~1..HEAD` 通过。
- 下一步：
  - 启动 Wave 4 `AlembicDashboard` + `AlembicPlugin` 下游消费：Dashboard 接 projects list/current/action handoff 和切换 UI；Plugin 接 hostProject mismatch / disconnect，不做项目切换。
