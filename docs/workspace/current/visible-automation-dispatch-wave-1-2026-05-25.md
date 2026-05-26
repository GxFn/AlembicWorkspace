# Visible Automation Dispatch Wave 1

日期：2026-05-25
状态：Wave 1 总控验收通过，Wave 2 待创建
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：建立可见 Codex 窗口自动化派发生产线，减少用户手动复制提示词；第一版接受分钟级延迟，只覆盖 Alembic 系列窗口，不依赖 Lark Remote，普通 Codex 输入关闭。
- 最终完成定义：自动化模式默认关闭；开启后可从当前计划和合规 TODO 主线生成 queue；目标可见 Codex 窗口通过 heartbeat automation 收到消息后 pull / claim / 回填；关闭后不再 armed。
- 当前是否已经达到：Wave 1 已达到；Visible Automation Dispatch 整体能力还未达到。
- 未达到时剩余差距：还缺实际 heartbeat arming、单窗口可见验证、TODO 主线循环和多窗口验证。
- 已达到时验收 / 归档判断：Wave 1 只验收 workspace 脚本基础层；不归档整条 VAD 主线。
- 当前任务分区：总控文档 / 规则治理 + workspace 脚本自动化。
- 不纳入本轮事项：不创建真实 Codex automation，不发送 Alembic 系列执行窗口，不做 Dashboard UI，不改产品仓库，不触碰真实项目。

## Design / 需求来源

- 来源类型：用户直接需求 / 需求设计提升为当前主线。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：已确认分钟级延迟、Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭。
- 总控接收结论：进入 Wave 1，由 AlembicWorkspace 自执行脚本基础层；其它窗口观察。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `scripts/README.md`
  - `scripts/verify-control-center.mjs`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：当前计划窗口分派 / global TODO / visible-dispatch queue generator。
  - Consumer：后续目标 Alembic 系列可见 Codex 窗口。
- 不可提前消费的上游：Wave 1 未完成前，不能让 `AlembicTest` 或其它窗口真实领取 automation 任务。
- 不允许触碰的目录 / 仓库：不写入 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 和真实项目。
- 真实测试项目是否涉及：否。

## 阶段顺序

1. 本地状态 schema、mode switch、registry、queue、claim / lease 和 arm payload。
2. 总控工具调用 heartbeat automation 的 armed / cleanup contract。
3. `AlembicTest` 单窗口可见 pull 验证。
4. TODO 主线循环和多窗口生产线。

- 下一处真实阻塞点：Node 脚本不能直接调用 Codex automation tool；Wave 2 必须由总控工具调用承接 arming。
- 阻塞点之前还能做：把本地状态和 queue 管理做成可测试脚本，并明确 `arm` 只输出 payload。
- 当前可派发窗口：无其它窗口；AlembicWorkspace 自执行。
- 当前阻塞 / 观察窗口：Alembic 系列窗口均观察；`AlembicTest` 等 Wave 2 后再验证。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P1-WORKSPACE-SCHEMA-QUEUE | `AlembicWorkspace` | 本地状态 schema、开关、registry、queue、claim / lease、arm payload 和脚本测试 | 已完成 |

### VAD-P1-WORKSPACE-SCHEMA-QUEUE：本地派发状态基础层

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 23:34 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 23:46 CST

阶段目标：

- 建立 Visible Automation Dispatch 的本地运行态基础层，让后续 heartbeat automation 可以消费明确 queue / registry，而不是直接解析散落提示词。

主线动作：

- 新增 `scripts/visible-dispatch.mjs`。
- 新增 `scripts/visible-dispatch.test.mjs`。
- 更新 `.gitignore`，忽略 `.workspace-local/` 本机运行态。
- 更新 `scripts/README.md`、`verify-control-center.mjs`、`workspace-control.mjs` 和 script pipeline skill reference。
- 明确 `arm` 只输出 Codex heartbeat automation payload，不在 Node 脚本里伪装调用 Codex 工具。

合并 TODO：

- `VAD-TODO-1`：定义 dispatch queue 与 window registry schema。
- `VAD-TODO-4`：明确自动派发安全门禁，保留确认门禁和权限审批。

明确不包含：

- 不创建真实 heartbeat automation。
- 不唤醒任何 Alembic 系列窗口。
- 不实现 TODO 主线自动选择。
- 不写产品仓库和真实测试项目。

下一处真实阻塞点：

- Wave 2 需要把脚本 `arm` payload 与总控窗口 `codex_app.automation_update` 工具调用连接起来。

阻塞点之前还能做：

- 本轮完成本地 schema / mode / registry / queue / claim / complete / cleanup dry-run 和 fixture tests。

验证命令：

```text
node --test scripts/visible-dispatch.test.mjs
node scripts/check-script-docs.mjs
node scripts/verify-control-center.mjs --with-script-tests
node scripts/workspace-control.mjs sync --write --verify --dispatch
```

回填要求：

- 完成范围。
- 验证命令和结果。
- 遗留风险。
- 下一步建议。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和相关脚本 README。
- 开始执行前先明确当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-1 | 已完成 | schema / queue | P0 | `AlembicWorkspace` | 定义 visible dispatch state、window registry、dispatch queue 和 automation run 本地 schema。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-2 | 下波 | automation arming | P0 | `AlembicWorkspace` | 将 `arm` payload 与总控窗口 Codex heartbeat automation 创建 / 删除动作连接。 | 是 | Wave 1 通过后 | `AlembicWorkspace` |
| VAD-TODO-3 | 后续测试 | visible window validation | P0 | `AlembicTest` | 验证目标可见窗口收到 heartbeat 后 pull / claim 测试队列并回填。 | 是 | Wave 2 arming 可用后 | `AlembicTest` |
| VAD-TODO-4 | 已完成 | safety / gate | P0 | `AlembicWorkspace` | 明确默认关闭、显式开启、普通输入关闭、非 Alembic 窗口拒绝和脚本不直接调用 automation API。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-5 | 后续 | automation loop | P0 | `AlembicWorkspace` | 从 current plan / global TODO 中选择合规主线循环推进，缺确认门禁时停止等待。 | 是 | queue / arming / single-window 验证后 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 后续作为目标窗口，Wave 1 不消费。 |
| `AlembicCore` | 观察 | 否 | 后续作为目标窗口，Wave 1 不消费。 |
| `AlembicAgent` | 观察 | 否 | 后续作为目标窗口，Wave 1 不消费。 |
| `AlembicDashboard` | 观察 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 观察 | 否 | 第一版不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 阻塞 | 否 | 等 Wave 2 arming contract 可用后再创建可见窗口验证单。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicCore`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicAgent`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicDashboard`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicPlugin`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 1 不发送。 |
| `AlembicTest`<br>阻塞 | 等 Wave 2 arming contract 可用后再创建单窗口可见验证单。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

```text
当前不发送其它窗口。Visible Automation Dispatch Wave 1 由 AlembicWorkspace 自执行：本地状态 schema、mode switch、registry、queue dry-run、claim / lease、arm payload 和脚本测试。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 测试交接

- 是否需要 `AlembicTest`：本轮不需要。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)。
- 真实项目保护说明：Wave 1 不触碰真实项目；后续可见窗口验证也先用测试队列，不改真实项目源码。

## 回填区

- 2026-05-25 23:46 CST：Wave 1 总控验收通过。完成 `scripts/visible-dispatch.mjs`、`scripts/visible-dispatch.test.mjs`、`.workspace-local/` git ignore、脚本 README / verifier / workspace-control test list / skill reference 更新；验证 `node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过，22 个脚本测试全部通过。遗留：Wave 2 仍需把 `arm` payload 与总控 `codex_app.automation_update` 工具调用连接，不得在 Node 脚本中伪装直接调用 automation API。
- 2026-05-25 23:34 CST：Wave 1 创建并开始 AlembicWorkspace 自执行；当前发送给无。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 1 总控验收通过，Wave 2 待创建",
  "indexPlanDescription": "Wave 1 已完成 visible-dispatch 本地状态、mode、registry、queue、claim / lease 和 arm payload；验证通过，当前不发送其它窗口。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 1 总控验收通过；当前发送给无，Wave 2 将连接 Codex heartbeat automation 工具调用边界。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 1：本地 schema / mode / registry / queue dry-run 和脚本测试。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 1 已通过总控验收：本轮完成 AlembicWorkspace 本地脚本基础层，不创建真实 automation，不发送其它窗口；Wave 2 待创建。",
  "indexRows": [
    {
      "type": "Visible Automation Dispatch 目标阶段确认",
      "doc": "docs/workspace/current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md",
      "status": "已确认",
      "description": "用户已确认 VAD 第一版边界、自动化模式开关和阶段路线。",
      "insertAfter": "当前状态"
    },
    {
      "type": "Visible Automation Dispatch 代码实现依赖调研",
      "doc": "docs/requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md",
      "status": "已完成",
      "description": "确认第一版落在 AlembicWorkspace 脚本和本地运行态，不依赖 Lark Remote，Node 脚本不伪装调用 Codex automation 工具。",
      "insertAfter": "Visible Automation Dispatch 目标阶段确认"
    }
  ],
  "currentIndexRows": [
    {
      "type": "VAD 目标阶段确认",
      "doc": "docs/workspace/current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md",
      "description": "Visible Automation Dispatch 目标、完成定义、阶段顺序和确认记录。",
      "insertAfter": "当前计划"
    },
    {
      "type": "VAD 代码实现依赖调研",
      "doc": "docs/requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md",
      "description": "Visible Automation Dispatch 本地脚本、运行态和 automation 工具边界调研。",
      "insertAfter": "VAD 目标阶段确认"
    }
  ]
}
-->
