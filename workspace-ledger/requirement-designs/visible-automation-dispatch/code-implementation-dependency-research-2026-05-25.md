# Visible Automation Dispatch Code Implementation Dependency Research

日期：2026-05-25
状态：已完成，支撑目标阶段确认
维护窗口：AlembicWorkspace

## 调研结论

- 本需求第一版应落在 `AlembicWorkspace` 的总控脚本、当前计划和本地运行态文件中，不进入 `Alembic` / `AlembicPlugin` 产品包。
- 自动化只替代“用户复制提示词到其它 Codex 窗口”的搬运动作，不替代总控对 TODO、目标阶段、窗口覆盖、producer / consumer 顺序和确认门禁的判断。
- Codex thread automation 是可见窗口投递通道；但 Node 脚本不能直接调用本会话的 `codex_app.automation_update` 工具。第一版脚本应生成 queue / registry / arm payload 和校验结果，由总控窗口在自动化模式开启时通过 Codex 工具创建或清理 heartbeat automation。
- 用户已确认第一版接受分钟级延迟、只覆盖 Alembic 系列窗口、不依赖 Lark Remote；关闭自动化模式不需要独立远程通道，用户用普通 Codex 输入关闭即可。
- `windowName -> threadId` 属于本机运行态，不应写入长期文档或 git；建议保存在 `.workspace-local/visible-dispatch/window-registry.json`，并由 `.gitignore` 忽略。

## 相关现有能力

### 总控文档与同步

- `docs/workspace/index.md` 已有唯一总控入口和窗口覆盖状态。
- `docs/workspace/current/workspace-current-status.md` 已有短状态快照、发送名单和可复制提示词。
- `templates/workspace-control-plan-template.md` 已固定当前计划中的 `目标判断`、`任务包`、`TODO / Backlog`、`空闲窗口调度`、`窗口分派`、`可复制提示词`、`测试交接` 和 `workspace-sync` block。
- `scripts/sync-current-plan.mjs` 可把当前计划中的窗口分派、可复制提示词和 `workspace-sync` 元数据同步到 index / current status；它不做 readiness、TODO priority、Design acceptance 或 window acceptance 判断。

### 总控脚本

- `scripts/workspace-control.mjs` 已作为聚合入口，支持 `status`、`verify`、`sync`、`dispatch`、`design`、`runtime`、`scripts` 和 `pipeline`。
- `scripts/check-dispatch-coverage.mjs` 已能验证当前计划覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`，并检查发送名单和提示词硬规则。
- `scripts/check-todo-board.mjs` 与 `scripts/check-task-packages.mjs` 已支持 TODO / Backlog 和任务包派发校验。
- `scripts/run-workspace-pipeline-e2e.mjs` 已能在 fixture workspace 中跑完整治理流水线，不触碰产品仓库。

### Codex automation 边界

- `codex_app.automation_update` 支持创建 / 更新 / 查看 / 删除 cron 或 heartbeat automation。
- heartbeat automation 可挂到 thread，适合分钟级唤醒可见 Codex 窗口。
- 当前工具接口不是普通 Node API；workspace 脚本不能把创建 heartbeat automation 伪装成自己独立完成的能力。
- 因此第一版需要区分：
  - 脚本负责：mode、queue、registry、claim / lease、arm payload、cleanup candidates、校验。
  - 总控窗口负责：在用户开启自动化模式后，用 Codex 工具按脚本输出创建 / 删除 automation。
  - 执行窗口负责：收到可见 automation 消息后读取 queue，claim 属于自己的任务，执行并回填。

## 建议文件与状态模型

### 提交到 workspace 的文件

- `scripts/visible-dispatch.mjs`：自动化派发本地状态和 queue 管理入口。
- `scripts/visible-dispatch.test.mjs`：schema、mode、registry、queue、claim / lease 的 fixture 测试。
- `scripts/README.md`：登记 `visible-dispatch.mjs` 的用途、禁止事项和验证命令。
- `skills/dev/control-workspace-governance/references/script-pipeline.md`：补充何时使用 visible dispatch 脚本。
- 当前 wave 计划：记录自动化模式状态、queue 来源、执行窗口和测试边界。

### 本地运行态文件

建议统一放在 `.workspace-local/visible-dispatch/`：

- `state.json`：`mode`、`loopEnabled`、`lastTickAt`、`stopRequestedAt`、`currentGoal`。
- `window-registry.json`：`windowName`、`threadId`、`cwd`、`role`、`lastSeenAt`、`status`、`source`。
- `dispatch-queue.json`：`taskId`、`targetWindow`、`status`、`controlDoc`、`promptRef`、`claim`、`leaseUntil`、`backfill`。
- `automation-runs.json`：`automationId`、`taskId`、`targetThreadId`、`createdAt`、`deletePolicy`、`lastObservedAt`。

这些文件不得提交到 git，不得写入 API key、token 或用户私密信息。

## Producer / Consumer 依赖

| 上游产出 | 生产方 | 消费方 | 硬边界 |
| --- | --- | --- | --- |
| 当前计划的发送窗口、任务包、提示词 | AlembicWorkspace 总控 | visible dispatch queue generator | 只消费已确认当前计划；不能从未确认 Design signal 直接派发 |
| global TODO 主线候选 | AlembicWorkspace 总控 | automation loop selector | 只能提升已满足目标阶段确认或可进入确认文档的 TODO；不能绕过确认门禁 |
| window registry | 用户 / 目标窗口自注册 / 总控手动登记 | arm payload generator | 不依赖 Lark Remote；threadId 过期时必须停止并等待重新登记 |
| dispatch queue | visible dispatch script | 目标可见 Codex 窗口 | 目标窗口只能 claim 自己的任务；lease 过期前不得重复执行 |
| automation heartbeat | 总控窗口通过 Codex 工具创建 | 目标可见 Codex 窗口 | 接受分钟级延迟；无 run-now 承诺 |
| backfill evidence | 目标窗口 | 总控验收 / loop selector | 证据不足时不能自动进入下一主线 |

## 自动化模式循环边界

- 默认关闭：平时不运行循环，不创建 armed automation。
- 显式开启：用户离开前通过普通 Codex 输入要求开启自动化模式。
- 普通关闭：用户通过普通 Codex 输入关闭自动化模式；关闭后不再创建新的 armed automation，并清理未触发 / stale automation。
- 循环来源：优先处理当前计划中 `待启动` / `执行中` 且可发送的窗口；当前计划无可发送窗口且已验收 / 待裁决时，才从 global TODO 中选择下一条主线候选。
- TODO 提升规则：TODO 若缺少原始计划书、需求设计、代码调研或目标阶段确认，循环只能创建 / 更新对应确认文档并停止等待确认，不能直接实现。
- 执行窗口范围：第一版只覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`；不覆盖真实项目窗口，不把 `BiliDili` 当目标。
- 测试节奏：如果总控已经定位源码缺口且不需要 Test 环境，先派源码仓库修复；`AlembicTest` 只承接需要真实测试 / 复测环境的任务。

## 第一波实现建议

1. 定义并测试 `.workspace-local/visible-dispatch/` 本地状态 schema。
2. 实现 `visible-dispatch.mjs status / mode / registry / enqueue / claim / complete / cleanup` 的 dry-run 与显式 `--write` 写入。
3. `enqueue` 第一版只从当前计划的发送名单生成 queue，不先做 TODO 主线选择。
4. `arm` 第一版不假装直接创建 automation，只输出可供总控工具调用的 payload 和目标 thread 信息。
5. 通过 fixture 测试证明：默认关闭、开启后可生成 queue、关闭后不再 arm、非 Alembic 系列窗口被拒绝、同一任务不能重复 claim。

## 仍需后续验证

- 目标 threadId 在窗口关闭、恢复或 fork 后是否稳定。
- 多个 heartbeat automation 同时 armed 时的触发顺序和限流表现。
- 目标窗口收到消息后执行 `claim` / `complete` 的真实可见回填。
- TODO 主线循环选择是否需要额外人工确认策略或优先级字段。
