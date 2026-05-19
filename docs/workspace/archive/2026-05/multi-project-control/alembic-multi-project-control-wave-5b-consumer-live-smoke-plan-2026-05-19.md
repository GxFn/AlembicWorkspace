# Alembic Multi Project Control Wave 5B Consumer Live Smoke Plan

日期：2026-05-19
状态：阶段 5B 已完成
维护窗口：AlembicWorkspace

## 目标

Wave 5A 已证明 `Alembic` 本体的双项目 runtime / projects API / handoff 链路可以真实跑通。本波解除 `AlembicDashboard` 和 `AlembicPlugin` 阻塞，让两个消费层窗口基于真实 Alembic 多项目链路做 live consumer smoke。

本波不是让消费层重新实现 fixture、复制 Alembic smoke 脚本或发明新 contract。Dashboard 只验证 UI 对真实 API 的消费和交互状态；Plugin 只验证 Codex host project alignment 与 Alembic selected / active 状态一致，不做项目切换。

`AlembicDashboard` 和 `AlembicPlugin` 可以并行执行：它们都消费 Wave 5A 已验收的 Alembic contract 和 smoke foundation，彼此没有 producer / consumer 依赖。

## 上游依据

- Wave 5A Alembic smoke foundation：[alembic-multi-project-control-wave-5-e2e-smoke-foundation-plan-2026-05-19.md](alembic-multi-project-control-wave-5-e2e-smoke-foundation-plan-2026-05-19.md)
- Alembic 执行记录：[../Alembic/alembic-multi-project-control-wave-5-e2e-smoke-foundation-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-5-e2e-smoke-foundation-2026-05-19.md)
- Wave 4 Dashboard / Plugin consumer handoff：[alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md](alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md)
- 需求设计：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicDashboard`<br>已完成 | 已使用真实 Alembic 多项目 runtime/API 做 Dashboard live consumer smoke，验证 projects UI、selected / active 状态、open-dashboard / switch / stop、handoff 后重连/跳转和 stop 后断线展示；总控验收通过。 |
| `AlembicPlugin`<br>已完成 | 已完成真实 Alembic runtime-control / daemon state 的 Codex host project live smoke，验证 connected、selected mismatch、active mismatch、disconnected/unavailable，以及 Dashboard handoff fail-closed；总控验收通过。 |
| `Alembic`<br>已完成 | Wave 5A 已验收；本波不派发。若消费层证明需要持久 fixture 或 `--keep-alive` 模式，再由总控单独回派。 |
| `AlembicCore`<br>已完成 | Core contract 已验收；本波不派发。 |
| `AlembicAgent`<br>观察中 | 当前不涉及 internal AI runtime；只观察是否暴露 project scope 缺口。 |
| `BiliDili`<br>观察中 | 本波仍不用真实测试项目；Dashboard / Plugin live smoke 通过后再判断是否需要只读真实项目验证。 |

## AlembicDashboard 执行要求

范围：

- 读取 `AlembicDashboard/AGENTS.md`、本文档、Wave 4 Dashboard 回填、Wave 5A Alembic 总控验收记录。
- 基于真实 Alembic 本地源码和隔离 Ghost 项目，启动可交互 Dashboard live smoke。可以参考 `Alembic/scripts/smoke-multi-project-control.mjs` 的流程创建临时项目，但不要复制长脚本到 Dashboard 仓库；如确实需要持久 fixture 支持，应回填为 Alembic 需求而不是在 Dashboard 内造一套 runtime。
- 必须验证：
  - Projects 下拉或项目控制入口能显示两个真实项目。
  - selected / active / ghost / stopped / ready / missing 或 unavailable 等状态与 Alembic API 返回一致。
  - `open-dashboard` 对当前项目复用或跳转正确。
  - `switch` 成功后处理 handoff：跨 origin 时跳转目标 Dashboard，同源时刷新数据；project-scoped cache 和主要数据不能停留在旧项目。
  - `stop` 后 UI 展示 action snapshot 或断线状态，不假装 runtime 仍 active。
  - action 失败路径有明确错误展示，至少覆盖无效 projectId 或 unavailable 项目。

禁止事项：

- 不允许把 live smoke 改成纯 mock / MSW / 静态 fixture。
- 不允许 Dashboard 调 CLI 作为产品逻辑；验证脚本可启动 Alembic fixture，但产品代码仍只能走 HTTP API。
- 不允许修改 Alembic / AlembicCore / AlembicPlugin 代码，除非先回填阻塞并由总控重新派发。

建议验证：

```bash
npm run build
```

如可行，补充浏览器 / Playwright / curl 证据；如果无法自动化浏览器，必须回填可复现的手工 live smoke 步骤和 HTTP / screenshot / log 证据。

文档动作：

- 新建 / 更新：`docs/AlembicDashboard/alembic-multi-project-control-wave-5b-dashboard-live-consumer-smoke-2026-05-19.md`
- 回填位置：本文档“回填区”的 `AlembicDashboard` 小节。
- 挂载入口：本文档和 `docs/workspace/index.md`。

## AlembicPlugin 执行要求

范围：

- 读取 `AlembicPlugin/AGENTS.md`、本文档、Wave 4 Plugin 回填、Wave 5A Alembic 总控验收记录。
- 基于真实 Alembic runtime-control / daemon state，验证 Plugin 的 Codex host project alignment。可以使用隔离 Ghost 项目和本地 Alembic CLI 创建状态，但 Plugin 产品代码不得调用 `switch`。
- 必须验证：
  - host project 与 Alembic selected / active 一致时，`connectionState=connected`，Dashboard handoff 允许继续。
  - host project 与 selected 不一致时，`connectionState=mismatch`，Dashboard handoff fail-closed，提示用户到 Alembic / Dashboard 切回。
  - host project 与 active runtime 不一致时，`connectionState=mismatch`，不会启动错误项目 runtime。
  - selected 等于 host 但 active 为空或 daemon stopped 时，状态为 disconnected / unavailable 的实际实现结果明确记录，Dashboard handoff 不自动切换项目。
  - diagnostics / status / module boundary 输出包含 alignment 证据且不泄漏 token。

禁止事项：

- 不允许 Plugin 自动调用 Alembic `switch`、`select` 或 action API 来消除 mismatch。
- 不允许为了通过 smoke 启动错误项目 runtime。
- 不允许复制 Dashboard UI 或 Alembic runtime 编排。
- 不允许修改 Alembic / AlembicCore / AlembicDashboard 代码，除非先回填阻塞并由总控重新派发。

建议验证：

```bash
npm run build:check
npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts
npm run lint:consumer-core-imports
npm run smoke:codex-plugin
```

如需要补充 live fixture 命令，按仓库现有脚本和 AGENTS 规则选择，并记录是否需要提权启动本地 daemon。

文档动作：

- 新建 / 更新：`docs/AlembicPlugin/alembic-multi-project-control-wave-5b-host-project-live-smoke-2026-05-19.md`
- 回填位置：本文档“回填区”的 `AlembicPlugin` 小节。
- 挂载入口：本文档和 `docs/workspace/index.md`。

## 验收重点

- Dashboard 是否真的消费 Alembic live API，而不是只消费 mock 或旧 snapshot。
- Dashboard switch / stop 后是否表现出真实状态变化和错误路径。
- Plugin 是否基于真实 runtime-control / daemon state 判定 connected / mismatch / disconnected。
- Plugin 是否保持不切项目、不启动错误 runtime 的边界。
- 如果任一消费层证明缺少可复用持久 fixture 或 `--keep-alive` 支持，总控再回派 `Alembic`；消费层不要自行复制 runtime orchestration。

## 可复制提示词

发送给：无

```text
Wave 5B 已完成总控验收；当前不发送新的执行提示词。
```

不发送给：`AlembicDashboard`（已完成）、`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicAgent`（观察中）、`BiliDili`（观察中）。

## 回填区

### AlembicDashboard

- 状态：已通过总控验收
- 执行文档：[../AlembicDashboard/alembic-multi-project-control-wave-5b-dashboard-live-consumer-smoke-2026-05-19.md](../../../../AlembicDashboard/alembic-multi-project-control-wave-5b-dashboard-live-consumer-smoke-2026-05-19.md)
- 完成范围：未修改 Dashboard 产品源码；使用隔离 Ghost 双项目和真实 Alembic runtime/API 完成 Dashboard dev server live consumer smoke，并补充本机浏览器 UI 检查。
- 提交 hash：`bf493c9eb6a395b294c0e9e22d96327ebedb00e2`（本轮无新增 Dashboard 源码提交）
- 验证命令：`npm run build`；`node <system-temp>/alembic-dashboard-live-consumer-smoke.mjs`；`node <system-temp>/alembic-dashboard-live-consumer-hold.mjs`；`curl -sS --max-time 2 http://127.0.0.1:5178/`；`curl -sS --max-time 2 http://127.0.0.1:3000/api/v1/projects`；`git status --short`
- 验证结果：build 通过；live smoke 授权运行通过；UI smoke 通过；清理后 `5178` / `3000` 均不可连接；Dashboard 仓库保持干净。
- live consumer 证据：Dashboard dev server 经真实 Alembic API 看到两个项目；`Project-A` selected / active / ready，`Project-B` stopped；无效 projectId switch 返回 404；open-dashboard 返回 handoff；switch 到 `Project-B` 后 selected / active 切换且旧 `Project-A` API 不可达；stop `Project-B` 后 active runtime 清空且目标 API 不可达；浏览器项目控制下拉展示两个 Ghost 项目，并在点击 `Project-B` switch 后跳转到目标 daemon origin，Header 显示 `Project-B`。
- 遗留风险：Dashboard 仓库尚无持久浏览器 e2e 依赖；本轮临时脚本不进入仓库。若要长期回归，应由 Alembic 提供可复用 keep-alive fixture 或专门 e2e 启动入口，Dashboard 不复制 runtime orchestration。
- 下一步建议：总控验收 Dashboard 证据；如需要 CI 级 live regression，再单独派发 Alembic fixture / Dashboard e2e 支撑。

### AlembicPlugin

- 状态：已通过总控验收
- 执行文档：[../AlembicPlugin/alembic-multi-project-control-wave-5b-host-project-live-smoke-2026-05-19.md](../../../../AlembicPlugin/alembic-multi-project-control-wave-5b-host-project-live-smoke-2026-05-19.md)
- 完成范围：
  - 使用隔离 `ALEMBIC_HOME` 和两个临时 Ghost 项目，通过真实 `SetupService` 初始化项目并写入 Core `ProjectRegistry`。
  - 使用 Core `createProjectRuntimeControlState()` 写入真实 global runtime-control state，覆盖 connected、selected mismatch、active mismatch、disconnected、unavailable 五类状态。
  - 使用 `DaemonSupervisor.start()` 启动 host project 真实 daemon，验证 connected 场景下 Dashboard handoff 成功。
  - 使用 `CodexMcpServer.handleToolCall()` 真实调用 `alembic_codex_status`、`alembic_codex_dashboard` 和 `alembic_codex_diagnostics`。
  - mismatch / disconnected / unavailable 场景均确认 Dashboard handoff fail-closed 且 host daemon 不被自动启动。
  - diagnostics / module boundary 输出包含 alignment 证据，且 status / dashboard / diagnostics 输出不泄漏 daemon token。
- 提交 hash：
  - 新增源码提交：无，本轮是 live smoke 和 workspace 文档回填。
  - 验证对象 AlembicPlugin：`a591367f3b4f3b59b6517e7a149312440ebeef80`
  - 验证对象 Codex plugin artifact：`0607fb8b8224cb01f83a51e520570d4f250e1b12`
  - 上游 Alembic smoke foundation：`edec0a52c1dffb5f8c09fdc4545422995cdad157`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts`
  - `npm run lint:consumer-core-imports`
  - `npm run build`
  - `node --input-type=module` live smoke 临时脚本
  - `npm run smoke:codex-plugin`
  - `git diff --check`
- 验证结果：
  - `npm run build:check`：通过；Core build 使用 `../AlembicCore @ ab5e332843d6da89c3def6bf33631e0397552566`。
  - targeted tests：通过，`CodexStatusService` 和 `CodexMcpServer` 共 34 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 326 个文件和 508 个 `@alembic/core` imports。
  - `npm run build`：通过。
  - live smoke：首次非提权运行在本地 daemon start 阶段失败；按权限规则提权重跑后通过，临时项目和 daemon 已 best-effort stop 并删除。
  - `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime passed，recovery / daemon skipped。
  - `git diff --check`：通过。
  - `AlembicPlugin` 与嵌套 `plugins/alembic-codex` 工作区均保持干净。
- live consumer 证据：
  - 临时 Ghost 项目数量 2；示例 host project id `699c7c16`，other project id `06d6f7ed`。
  - runtime-control state 路径记录为 `<smoke-root>/home/.asd/runtime-control.json`，未写入本机绝对路径。
  - connected：`connectionState=connected`、`handoffAllowed=true`、`alembic_codex_dashboard success=true`、dashboard URL 存在。
  - selected mismatch：`connectionState=mismatch`、`reason=selected-project-differs`、Dashboard `success=false`、`errorCode=CODEX_HOST_PROJECT_MISMATCH`、host daemon 未被自动启动。
  - active mismatch：`connectionState=mismatch`、`reason=active-runtime-project-differs`、Dashboard `success=false`、`errorCode=CODEX_HOST_PROJECT_MISMATCH`、host daemon 未被自动启动。
  - disconnected：selected 等于 host，active 为空，host daemon stopped；`connectionState=disconnected`、Dashboard `success=false`、`errorCode=CODEX_HOST_PROJECT_DISCONNECTED`、host daemon 未被自动启动。
  - unavailable：runtime-control 缺失，host daemon stopped；`connectionState=unavailable`、Dashboard `success=false`、`errorCode=CODEX_HOST_PROJECT_DISCONNECTED`、host daemon 未被自动启动。
  - diagnostics：`hostProjectAlignment.connectionState=unavailable`；module boundary：`hostProjectAlignment.switchOwnership=Alembic/Dashboard`；token leak check passed。
- 遗留风险：
  - live smoke 使用 Plugin dist runtime 和 Core runtime-control state 验证 Codex consumer 行为；未复用 Alembic Wave 5A running daemon 作为 long-lived fixture。
  - Plugin 仍未直接调用 projects API probe；alignment 数据来源保持 ready daemon `runtimeBoundary`、`DaemonStatus` 和 Core runtime-control state。
  - `disconnected` / `unavailable` 的 Dashboard handoff 当前 fail-closed；如后续希望 selected host inactive 时由 Codex 启动，需要用户和总控另行确认。
- 下一步建议：
  - 总控合并 Dashboard / Plugin live smoke 验收，复核 Dashboard 切换后的 selected / active 状态是否与 Plugin alignment 一致。
  - 如需要复用同一个长驻双项目 fixture，建议回派 `Alembic` 增加 keep-alive / evidence export 模式，不要在 Plugin 仓库复制 runtime orchestration。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - `AlembicDashboard` 本轮没有新增产品源码，验证对象仍是 `bf493c9eb6a395b294c0e9e22d96327ebedb00e2`；总控复跑 `npm run build` 通过，仓库工作区干净。
  - Dashboard 回填的 live consumer 证据覆盖两个真实 Ghost 项目、真实 `/api/v1/projects`、无效 switch 404、open-dashboard handoff、A->B switch、stop 后 active 清空和浏览器 UI 下拉 / 跨 origin 跳转；符合“真实 API 消费”要求，不是 mock-only 验证。
  - `AlembicPlugin` 本轮没有新增产品源码，验证对象仍是 `a591367f3b4f3b59b6517e7a149312440ebeef80`，artifact 为 `0607fb8b8224cb01f83a51e520570d4f250e1b12`；总控复跑 `npm run build:check`、targeted tests、`npm run lint:consumer-core-imports`、`npm run build`、`npm run smoke:codex-plugin` 和 `git diff --check` 均通过，父仓库与嵌套 artifact 工作区干净。
  - Plugin 回填的 live consumer 证据覆盖 connected、selected mismatch、active mismatch、disconnected、unavailable 五类状态；Dashboard handoff 在 mismatch / disconnected / unavailable 下 fail-closed，且不自动启动 host daemon，符合 Plugin 不切项目的边界。
  - 两个消费层都证明了 Wave 5A Alembic runtime/API contract 可以被真实消费；当前不需要回派 `AlembicCore`、`AlembicAgent` 或 `BiliDili`。
- 遗留风险：
  - Dashboard / Plugin live smoke 使用临时脚本和本地浏览器 / 本地 daemon；它证明功能闭环，但尚不是长期 CI 回归入口。
  - 若后续要把 live smoke 固化为长期回归，应优先回派 `Alembic` 增加 keep-alive / evidence export fixture，再让 Dashboard / Plugin 只消费 fixture，不在消费层复制 runtime orchestration。
- 下一步：
  - 多项目控制主链路阶段性完成，当前不派发新执行窗口。
  - 若用户希望继续强化，可单独开启“持久 live fixture / CI e2e 回归入口”需求；若需要真实项目验证，再单独决定是否引入 `BiliDili` 只读 smoke。
