# Visible Automation Dispatch Wave 4

日期：2026-05-26
状态：Wave 4 阻塞
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：建立可见 Codex 窗口自动化派发生产线，减少用户手动复制提示词；第一版接受分钟级延迟，只覆盖 Alembic 系列窗口，不依赖 Lark Remote，普通 Codex 输入关闭。
- 最终完成定义：自动化模式默认关闭；开启后可从当前计划和合规 TODO 主线生成 queue；目标可见 Codex 窗口通过 heartbeat automation 收到消息后 pull / claim / 回填；关闭后不再 armed。
- 当前是否已经达到：尚未达到；AlembicTest 已完成 Wave 4 单窗口测试并回填阻塞，真实 Codex heartbeat 在观察窗口内未触发 claim / complete；总控自驱本地闭环已跑通 `queued -> claimed -> completed -> accepted`。
- 未达到时剩余差距：还缺目标可见窗口真实 heartbeat claim / complete 闭环、TODO 主线循环和多窗口验证；若第一版改由 Codex 追求目标模式驱动总控循环，目标 heartbeat 需降级为后续能力或重新设计。
- 已达到时验收 / 归档判断：本轮完成后只验收 single-window visible heartbeat；不归档整条 VAD 主线。
- 当前任务分区：测试交接 + 当前 wave 分派。
- 不纳入本轮事项：不跑 full cold-start，不修改产品仓库，不操作真实测试项目业务代码，不做多窗口并发，不实现 TODO 主线自动选择。

## 总控决策记录

- 本次决策触发：用户指出总控把 `AlembicTest` 自线程验证结果放大为主线事实，并在回填后用写文档替代继续验证和重新计划。
- 需求 / 测试结果理解：VAD 目标仍是可见窗口自动化派发；Test-12 只能说明当时 single-window / 当前可见线程 heartbeat 未 claim / complete，不能推出其它目标线程或后续 heartbeat 触发模型一定不可用；总控后续已经用独立 ignored state 自测证明本地 state machine 与自驱闭环可达。
- 已核对证据：Test-12 回填、`record-stop` / `block` runtime 归口、自驱 `mode-enable -> register -> enqueue -> claim -> complete -> accept -> cleanup` 闭环摘要，以及用户对“Test 不再作为默认测试窗口、总控先自测”的明确规则更新。
- 是否需要先验证 / 重新计划 / 用户确认：需要先由总控重新判断真实触发模型和后续验证方式；在完成裁决前，不再把 Test-12 结论作为继续派发或归档依据。
- 本次允许更新：总控规则、当前计划中的决策边界、模板和机械校验；允许把 Test-12 结论范围收窄为“当时自线程测试未触发”。
- 本次不得更新：不得把 Test-12 写成 VAD 全局不可行结论，不得启动新的 `AlembicTest` 测试单，不得把文档修改当作 VAD 主线完成或失败验收。

## Design / 需求来源

- 来源类型：用户直接需求 / 需求设计提升为当前主线。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：已确认分钟级延迟、Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭；用户确认总控可进入长期运行模式，并可通过正常 Codex 输入关闭。
- 总控接收结论：进入 Wave 4，创建 `AlembicTest` 单窗口可见验证单。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`、`AlembicTest`。
- 关键入口：
  - [alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：Wave 3 已完成 `record-arm`、`armed` 状态和外部 automation id 落账；总控 5 分钟 controller heartbeat 已按用户确认撤销，不再作为正式路线。
  - Consumer：`AlembicTest` 作为单窗口可见目标，验证 heartbeat 触发后的 claim / complete / backfill。
- 测试边界：
  - `AlembicTest` 可以创建临时 Codex heartbeat automation，但结束时必须暂停或删除。
  - `AlembicTest` 可以写 ignored runtime state 和自身测试报告 / evidence。
  - `AlembicTest` 不修改产品源码和真实测试项目业务代码。
- 不允许触碰的目录 / 仓库：不写入 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码，不写真实测试项目业务目录。
- 真实测试项目是否涉及：不涉及真实项目业务验证；只使用 `AlembicTest` 测试窗口和 workspace ignored runtime state。

## 阶段顺序

1. 本地状态 schema、mode switch、registry、queue、claim / lease 和 arm payload。
2. 等待 / 验收状态机：总控用 `tick` 巡检 queue，用 `accept` 记录证据审查结论。
3. Arming contract：`arm` payload、`record-arm` 落账、`record-stop` 停止落账、`block` 失败归口和 `armed -> claimed` 状态链。
4. `AlembicTest` 单窗口可见 pull / claim / backfill 验证。
5. TODO 主线循环和多窗口生产线。

- 下一处真实阻塞点：真实 Codex heartbeat automation 已创建并指向当前 thread，但未在活跃观察窗口内投递到 `AlembicTest` 可见线程执行 claim。
- 阻塞点之前还能做：本地 queue / claim / complete / accept 自驱闭环已通过；record-arm / record-stop / block / cleanup 证据已回填；继续推进需总控裁决 heartbeat 投递模型、追求目标模式接棒方式或目标线程注册同步能力。
- 当前可派发窗口：无。
- 当前观察窗口：Alembic 系列产品仓库均观察。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P4-TEST-SINGLE-WINDOW-HEARTBEAT | `AlembicTest` | 单窗口可见 heartbeat 验证：queue、record-arm、armed claim、complete backfill、cleanup | 阻塞 |

### VAD-P4-TEST-SINGLE-WINDOW-HEARTBEAT：单窗口可见 heartbeat 验证

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 00:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 00:24 CST

阶段目标：

- 用 `AlembicTest` 作为单个可见目标窗口，验证真实 Codex heartbeat automation 能触发 claim / complete / backfill，而不是只通过本地脚本单测证明状态机。

主线动作：

- 读取 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md) 中 `Test-2026-05-26-12 / VAD-P4-Single-Window-Visible-Heartbeat-Validation`。
- 用当前 Wave 4 plan 生成或复用一个 `AlembicTest` visible dispatch task。
- 创建临时测试 heartbeat automation，prompt 只执行本轮 claim / complete / backfill。
- 使用 `record-arm` 记录临时 automation id。
- 等待 heartbeat 触发并回收临时 automation。
- 回填测试结论、runtime JSON 摘要、automation id、报告路径和风险。

合并 TODO：

- `VAD-TODO-3`：验证目标可见窗口收到 heartbeat 后 pull / claim 测试队列并回填。

明确不包含：

- 不启动 paused controller heartbeat。
- 不修改产品源码。
- 不跑 full cold-start / rescan。
- 不验证多窗口调度。
- 不自动 accept 完成项。

下一处真实阻塞点：

- 需要总控确认 Codex heartbeat 是否可在同一活跃 thread / 当前 assistant turn 中投递；若不可，需要调整触发模型或下一轮使用空闲目标线程复测。

阻塞点之前还能做：

- 本轮 `AlembicTest` 已回填阻塞证据；总控已补 `record-stop` 消除本地 active run 噪音，并用 `block` 将失败派发归口为任务阻塞。后续需要裁决目标 heartbeat 是否继续作为触发通道，或改由 Codex 追求目标模式驱动总控循环。

验证命令：

```text
node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests
```

回填要求：

- 测试结论。
- 执行范围。
- 使用配置、automation id 和 heartbeat 状态。
- queued / armed / claimed / completed 状态变化。
- `tick` / `status` / `cleanup` JSON 摘要。
- 真实项目是否干净。
- 详细报告路径。
- 遗留风险和下一步建议。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、当前总控文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`。
- 开始执行前先明确当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-1 | 已完成 | schema / queue | P0 | `AlembicWorkspace` | 定义 visible dispatch state、window registry、dispatch queue 和 automation run 本地 schema。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-2 | 已完成 | automation arming | P0 | `AlembicWorkspace` | 将 `arm` payload 与 Codex heartbeat automation 创建 / 删除动作连接，并通过 `record-arm` / `record-stop` / `block` 记录外部 automation 生命周期和失败归口。 | 是 | Wave 3 完成 `record-arm`；Wave 4 验收后补 `record-stop` 与 `block` | `AlembicWorkspace` |
| VAD-TODO-3 | 阻塞 | visible window validation | P0 | `AlembicTest` / `AlembicWorkspace` | 验证目标可见窗口收到 heartbeat 后 pull / claim 测试队列并回填。 | 是 | Wave 4 回填：真实 heartbeat 未触发 claim / complete | `AlembicWorkspace` |
| VAD-TODO-4 | 已完成 | safety / gate | P0 | `AlembicWorkspace` | 明确默认关闭、显式开启、普通输入关闭、非 Alembic 窗口拒绝和脚本不直接调用 automation API。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-5 | 后续 | automation loop | P0 | `AlembicWorkspace` | 从 current plan / global TODO 中选择合规主线循环推进，缺确认门禁时停止等待。 | 是 | single-window 验证后 | `AlembicWorkspace` |
| VAD-TODO-6 | 已完成 | waiting / acceptance | P0 | `AlembicWorkspace` | 明确总控长期运行模式如何等待：`tick` 分类状态，`accept` 记录总控验收结论，缺证据和 stale lease 不自动推给 `AlembicTest`。 | 是 | Wave 2 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-7 | 取消 | controller heartbeat | P0 | `AlembicWorkspace` | 原计划创建默认暂停的总控 controller heartbeat，作为离开时开启循环的 Codex automation 开关对象。 | 否 | 用户确认 Codex 追求目标模式承担总控持续执行；`visible-automation-dispatch-controller` 已删除，不再作为正式路线。 | `AlembicWorkspace` |
| VAD-TODO-8 | 待裁决 | trigger model | P0 | `AlembicWorkspace` | 裁决 VAD 后续是否继续依赖目标 thread heartbeat，还是改为追求目标模式驱动总控循环 + 手动/可见窗口领取。 | 是 | Test-12 证明当前 single-window heartbeat 未投递到可见线程；5 分钟 controller 已撤销；失败 runtime 已 `record-stop` + `block`；总控自驱本地闭环已通过。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 4 不改产品仓库。 |
| `AlembicCore` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 4 不消费。 |
| `AlembicAgent` | 观察 | 否 | 后续作为 visible dispatch 目标窗口，Wave 4 不消费。 |
| `AlembicDashboard` | 观察 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 观察 | 否 | 第一版不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 阻塞 | 否 | single-window visible heartbeat 验证已回填阻塞结果。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 4 不发送。 |
| `AlembicCore`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 4 不发送。 |
| `AlembicAgent`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 4 不发送。 |
| `AlembicDashboard`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 4 不发送。 |
| `AlembicPlugin`<br>观察中 | 后续作为 visible dispatch 目标窗口；Wave 4 不发送。 |
| `AlembicTest`<br>阻塞 | 已执行 `Test-2026-05-26-12 / VAD-P4-Single-Window-Visible-Heartbeat-Validation`；真实 heartbeat 未触发 claim / complete，已回填阻塞证据和报告。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

当前不发送给任何窗口。下一轮应由总控裁决 heartbeat 投递模型、追求目标模式接棒方式或目标线程注册同步后，再决定是否复测。

## 测试交接

- 是否需要 `AlembicTest`：需要。
- 测试单：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md#test-2026-05-26-12vad-p4-single-window-visible-heartbeat-validation)。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)。
- 真实项目保护说明：Wave 4 不触碰真实项目业务源码；`AlembicTest` 自身测试资产可保持未提交，不作为总控验收阻塞。

## 回填区

- 2026-05-26 00:10 CST：Wave 4 创建并待启动；当前发送给 `AlembicTest`。已创建 `Test-2026-05-26-12 / VAD-P4-Single-Window-Visible-Heartbeat-Validation`。
- 2026-05-26 00:24 CST：`AlembicTest` 回填阻塞。`queued -> armed`、真实 heartbeat 创建、`record-arm`、暂停和删除均有证据；automation id `vad-p4-alembictest-heartbeat`。heartbeat 在 3 分钟以上观察窗口内未投递到当前可见线程执行 `claim`，任务未进入 `claimed` / `completed`。报告：[../../../AlembicTest/docs/vad-single-window-visible-heartbeat-validation-2026-05-26.md](../../../../../AlembicTest/docs/vad-single-window-visible-heartbeat-validation-2026-05-26.md)。
- 2026-05-26 00:30 CST：总控验收 Test-12 证据有效，结论保持阻塞：问题不归咎于 `AlembicTest` 未执行，而是目标可见 heartbeat 投递 / 当前活跃线程调度模型未打通。按用户确认，`visible-automation-dispatch-controller` 已删除，5 分钟总控 heartbeat 不再作为正式路线。总控已补 `scripts/visible-dispatch.mjs record-stop`，并对 `vad-p4-alembictest-heartbeat` 记录 stopped，`cleanup` 后不再误报 active automation run。
- 2026-05-26 00:35 CST：总控继续处理自动化失败，将 `visible-automation-dispatch-wave-4-2026-05-26__AlembicTest` 从 `armed` 转为 `blocked`，原因 `Test-2026-05-26-12-heartbeat-did-not-claim-visible-thread`；后续 tick 不再把该任务当成等待中的 automation，而是明确要求总控解决触发模型阻塞。
- 2026-05-26 00:40 CST：总控按用户要求直接自跑最小闭环，使用独立 ignored stateDir `.workspace-local/vad-self-loop-test/state` 和临时 fixture plan `.workspace-local/vad-self-loop-test/plan.md`，完成 `mode-enable -> register -> enqueue -> tick-ready -> claim -> complete -> tick-review -> accept -> tick-done -> mode-disable -> cleanup`。结果：task `plan__AlembicTest` 依次进入 `queued`、`claimed`、`completed`、`accepted`；`tick-review` 为 `topAction=review / nextAction=acceptanceReview`；最终 `cleanup` 为 `staleTasks=0`、`activeAutomationRuns=0`。结论：本地 state machine 与总控自驱闭环已通过，剩余阻塞收窄为真实目标 thread heartbeat 投递 / 触发模型。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 4 阻塞",
  "indexPlanDescription": "Wave 4 已完成 AlembicTest single-window visible heartbeat 验证回填；真实 heartbeat 未触发 claim / complete；总控自驱本地闭环已跑通，当前阻塞收窄到触发模型。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 4 阻塞：AlembicTest 已回填真实 heartbeat 未投递到可见线程；测试 heartbeat 已删除并已 record-stop；总控自驱闭环已通过。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 4：AlembicTest 单窗口可见 heartbeat 验证已回填阻塞。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 4 阻塞：AlembicTest 已回填，真实 heartbeat automation 创建后未触发 claim / complete；测试 heartbeat 已删除并已 record-stop，失败任务已 block；总控自驱本地闭环已跑通；5 分钟 controller heartbeat 已撤销。",
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
