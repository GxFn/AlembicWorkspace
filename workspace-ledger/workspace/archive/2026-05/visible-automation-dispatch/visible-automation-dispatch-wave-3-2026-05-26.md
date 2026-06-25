# Visible Automation Dispatch Wave 3

日期：2026-05-26
状态：Wave 3 总控验收通过，Wave 4 待创建
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：建立可见 Codex 窗口自动化派发生产线，减少用户手动复制提示词；第一版接受分钟级延迟，只覆盖 Alembic 系列窗口，不依赖 Lark Remote，普通 Codex 输入关闭。
- 最终完成定义：自动化模式默认关闭；开启后可从当前计划和合规 TODO 主线生成 queue；目标可见 Codex 窗口通过 heartbeat automation 收到消息后 pull / claim / 回填；关闭后不再 armed。
- 当前是否已经达到：Wave 3 已达到；Visible Automation Dispatch 整体能力还未达到。
- 未达到时剩余差距：还缺单窗口可见验证、TODO 主线循环和多窗口验证。
- 已达到时验收 / 归档判断：Wave 3 只验收 workspace arming contract、armed 状态落账和默认暂停的 controller heartbeat；不归档整条 VAD 主线。
- 当前任务分区：总控文档 / 规则治理 + workspace 脚本自动化 + Codex heartbeat controller 准备。
- 不纳入本轮事项：不启动真实循环，不创建目标窗口 task heartbeat，不发送 Alembic 系列执行窗口，不做 Dashboard UI，不改产品仓库，不触碰真实项目。

## Design / 需求来源

- 来源类型：用户直接需求 / 需求设计提升为当前主线。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：已确认分钟级延迟、Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭；用户进一步确认总控可开启长期运行模式，且远程关闭通过正常 Codex 输入处理。
- 总控接收结论：进入 Wave 3，由 AlembicWorkspace 自执行 arming contract；其它窗口观察。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `scripts/README.md`
  - `skills/dev/alembic-workspace-control/references/script-pipeline.md`
  - `.wakeflow-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：当前计划窗口分派 / global TODO / visible-dispatch queue generator / total-control controller heartbeat。
  - Consumer：后续目标 Alembic 系列可见 Codex 窗口。
- arming contract：
  - `arm` 只生成 Codex heartbeat automation payload，不直接调用 Codex automation API。
  - 总控调用 `codex_app.automation_update` 创建 automation 后，必须用 `record-arm --task <taskId> --automation-id <id> --write` 落账。
  - `record-arm` 将任务从 `queued` 推到 `armed`，记录 `automationId`、`armLeaseUntil` 和 `automation-runs`，避免下一轮 `tick` 重复 arming。
  - 目标窗口收到 heartbeat 后用 `claim --window <name> --write` 领取 `armed` 任务，再完成回填。
  - `accept` 仍只由总控证据审查后调用，不自动验收。
- controller heartbeat：
  - 已创建 Codex heartbeat automation：`visible-automation-dispatch-controller`。
  - 状态：`PAUSED`，默认不运行，符合“平时不需要，离开时开启循环”。
  - controller 只负责 `tick`、按 payload 创建目标 heartbeat、调用 `record-arm`，不得自动 accept。
- 不允许触碰的目录 / 仓库：不写入 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 和真实项目。
- 真实测试项目是否涉及：否。

## 阶段顺序

1. 本地状态 schema、mode switch、registry、queue、claim / lease 和 arm payload。
2. 等待 / 验收状态机：总控用 `tick` 巡检 queue，用 `accept` 记录证据审查结论。
3. Arming contract：`arm` payload、`record-arm` 落账、`armed -> claimed` 状态链和 paused controller heartbeat。
4. `AlembicTest` 单窗口可见 pull / claim / backfill 验证。
5. TODO 主线循环和多窗口生产线。

- 下一处真实阻塞点：还没有经过目标可见窗口的真实 heartbeat claim 验证；Wave 4 需要创建 `AlembicTest` 单窗口可见验证单或由目标窗口先完成 registry。
- 阻塞点之前还能做：Wave 3 已完成 arming contract 和默认暂停 controller；继续推进会进入真实可见窗口验证。
- 当前可派发窗口：无其它窗口；AlembicWorkspace 自执行。
- 当前阻塞 / 观察窗口：Alembic 系列窗口均观察；`AlembicTest` 等 Wave 4 创建验证单后再执行。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P3-WORKSPACE-ARMING-CONTRACT | `AlembicWorkspace` | `record-arm`、`armed` 状态、目标 claim、cleanup/tick arming 分类、paused controller heartbeat 和脚本测试 | 已完成 |

### VAD-P3-WORKSPACE-ARMING-CONTRACT：arming contract 和 controller heartbeat

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 00:03 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 00:06 CST

阶段目标：

- 把 `arm` payload 与总控 Codex automation 工具调用之间的机械落账链补齐，让任务不会重复 armed，并让目标窗口能从 `armed` 任务继续 claim。

主线动作：

- 在 `scripts/visible-dispatch.mjs` 新增 `record-arm --task --automation-id --write`。
- 新增 `armed` 状态，`tick` 可报告 `waitForClaim`、`stopAutomation`、armed lease 过期 stale。
- `claim` 支持领取 `armed` 任务并记录 `automationClaimedAt`。
- `cleanup` 输出 active automation runs，供总控禁用模式后停止真实 automation。
- 扩展 `scripts/visible-dispatch.test.mjs` 覆盖 record-arm、armed wait、armed claim、armed stale。
- 更新 `scripts/README.md` 和 script pipeline skill reference。
- 创建 paused controller heartbeat automation：`visible-automation-dispatch-controller`。

合并 TODO：

- `VAD-TODO-2`：将 `arm` payload 与总控窗口 Codex heartbeat automation 创建 / 删除动作连接。

明确不包含：

- 不开启 controller heartbeat。
- 不创建目标窗口 task heartbeat。
- 不发送 Alembic 系列窗口。
- 不实现 TODO 主线自动选择。
- 不自动 accept 任何完成项。
- 不写产品仓库和真实测试项目。

下一处真实阻塞点：

- Wave 4 需要通过 `AlembicTest` 或一个目标 Alembic 系列窗口验证真实 heartbeat 可见唤醒后执行 claim / complete / backfill。

阻塞点之前还能做：

- 本轮已完成所有本地 arming 落账和 controller 准备；目标窗口验证前不再继续扩展脚本能力。

验证命令：

```text
node --test scripts/visible-dispatch.test.mjs
node scripts/check-script-docs.mjs
node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests
node scripts/workspace-control.mjs sync --write --verify --dispatch
node scripts/visible-dispatch.mjs tick --json
node scripts/visible-dispatch.mjs cleanup --json
```

回填要求：

- 完成范围。
- 验证命令和结果。
- controller heartbeat id / 状态。
- 遗留风险。
- 下一步建议。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和相关脚本 README。
- 开始执行前先明确当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-1 | 已完成 | schema / queue | P0 | `AlembicWorkspace` | 定义 visible dispatch state、window registry、dispatch queue 和 automation run 本地 schema。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-2 | 已完成 | automation arming | P0 | `AlembicWorkspace` | 将 `arm` payload 与总控窗口 Codex heartbeat automation 创建 / 删除动作连接。 | 是 | Wave 3 已完成 `record-arm`、`armed` 状态和 paused controller heartbeat | `AlembicWorkspace` |
| VAD-TODO-3 | 下波测试 | visible window validation | P0 | `AlembicTest` | 验证目标可见窗口收到 heartbeat 后 pull / claim 测试队列并回填。 | 是 | Wave 3 arming contract 通过后 | `AlembicTest` |
| VAD-TODO-4 | 已完成 | safety / gate | P0 | `AlembicWorkspace` | 明确默认关闭、显式开启、普通输入关闭、非 Alembic 窗口拒绝和脚本不直接调用 automation API。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-5 | 后续 | automation loop | P0 | `AlembicWorkspace` | 从 current plan / global TODO 中选择合规主线循环推进，缺确认门禁时停止等待。 | 是 | queue / arming / single-window 验证后 | `AlembicWorkspace` |
| VAD-TODO-6 | 已完成 | waiting / acceptance | P0 | `AlembicWorkspace` | 明确总控长期运行模式如何等待：`tick` 分类状态，`accept` 记录总控验收结论，缺证据和 stale lease 不自动推给 `AlembicTest`。 | 是 | Wave 2 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-7 | 已完成 | controller heartbeat | P0 | `AlembicWorkspace` | 创建默认暂停的总控 controller heartbeat，作为离开时开启循环的 Codex automation 开关对象。 | 是 | Wave 3 已创建 `visible-automation-dispatch-controller`，状态 `PAUSED` | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 3 不消费。 |
| `AlembicCore` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 3 不消费。 |
| `AlembicAgent` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 3 不消费。 |
| `AlembicDashboard` | 观察 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 观察 | 否 | 第一版不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 阻塞 | 否 | 等 Wave 4 创建单窗口可见验证单后再发送。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 3 不发送。 |
| `AlembicCore`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 3 不发送。 |
| `AlembicAgent`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 3 不发送。 |
| `AlembicDashboard`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 3 不发送。 |
| `AlembicPlugin`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 3 不发送。 |
| `AlembicTest`<br>阻塞 | 等 Wave 4 创建单窗口可见验证单后再执行真实可见窗口验证。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

```text
当前不发送其它窗口。Visible Automation Dispatch Wave 3 由 AlembicWorkspace 自执行：arming contract、record-arm 落账、armed 状态、paused controller heartbeat 和脚本测试。
```

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 测试交接

- 是否需要 `AlembicTest`：本轮不需要。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)。
- 真实项目保护说明：Wave 3 不触碰真实项目；Wave 4 再创建单窗口可见验证单。

## 回填区

- 2026-05-26 00:06 CST：Wave 3 总控验收通过。完成 `record-arm`、`armed` 状态、目标 claim、tick / cleanup arming 分类、脚本 README / skill reference 更新；创建 Codex heartbeat automation `visible-automation-dispatch-controller`，状态 `PAUSED`，未开启循环，未创建目标窗口 automation。`node --test scripts/visible-dispatch.test.mjs` 已通过 14 个用例；后续以 full control-center verification 作为最终提交前验证。
- 2026-05-26 00:03 CST：Wave 3 创建并开始 AlembicWorkspace 自执行；当前发送给无。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 3 总控验收通过，Wave 4 待创建",
  "indexPlanDescription": "Wave 3 已完成 arming contract、record-arm 落账、armed 状态和 paused controller heartbeat；当前不发送其它窗口。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 3 总控验收通过；当前发送给无，Wave 4 将做单窗口可见验证。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 3：arming contract、record-arm、armed 状态和 paused controller heartbeat。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 3 已通过总控验收：本轮完成 arming contract 和默认暂停的 controller heartbeat，不开启循环，不发送其它窗口；Wave 4 待创建。",
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
