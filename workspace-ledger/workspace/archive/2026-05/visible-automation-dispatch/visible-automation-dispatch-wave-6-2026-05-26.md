# Visible Automation Dispatch Wave 6

日期：2026-05-26
状态：Wave 6 追求目标预飞通过
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：在用户开启 Codex 追求目标模式前，由总控先跑真实脚本环境里的假 TODO / 全窗口多轮闭环，确认自动化流水不会误派发、不会重复 enqueue、不会把测试推给 `AlembicTest`。
- 最终完成定义：脚本级 fixture 覆盖 3 轮、6 个 Alembic 系列窗口、18 个假任务；每个假任务完成 `controller-tick -> enqueue -> arm payload -> record-arm -> claim -> complete -> accept`，且每轮完成后 `controller-tick` 不再重复 enqueue 已有任务，而是要求总控关闭 / 刷新当前计划。
- 当前是否已经达到：已达到；`visible-dispatch.test.mjs` 新增多轮全窗口假任务测试并通过。
- 未达到时剩余差距：真实 Codex 追求目标模式下的总控持续执行尚未启动；多窗口真实可见唤醒仍是后续专项，不属于本轮。
- 已达到时验收 / 归档判断：Wave 6 可验收；准备让用户开启追求目标模式做真实总控线程测试。
- 当前任务分区：总控脚本与自动化治理 / 测试前预飞。
- 不纳入本轮事项：不创建 heartbeat automation，不派发 `AlembicTest`，不触碰产品仓库，不改真实测试项目，不跑 cold-start，不验证真实目标线程可见唤醒。

## 总控决策记录

- 本次决策触发：用户问是否需要开启追求目标做真实假 TODO 全窗口简单任务；总控判断应先完成脚本级预飞，再让用户开启追求目标。
- 需求 / 测试结果理解：追求目标模式要验证的是总控长期运行时能持续按 `controller-tick` 做判断；在开启前，脚本必须先证明多窗口假任务、多轮轮转和重复 enqueue 边界可靠。
- 已核对证据：Wave 5 `controller-tick` baseline、`visible-dispatch.mjs` 当前计划 / queue 判定逻辑、`visible-dispatch.test.mjs` 现有 mode / queue / arm / claim / accept 测试。
- 是否需要先验证 / 重新计划 / 用户确认：需要先由总控自测；已完成。下一步需要用户开启追求目标模式。
- 本次允许更新：`visible-dispatch.mjs` controller 判定边界、`visible-dispatch.test.mjs` 多轮全窗口 fixture、当前 Wave 6 计划、全局 TODO 状态、同步索引和状态页。
- 本次不得更新：不得启动真实目标窗口 heartbeat，不得把脚本 fixture 结论写成真实多窗口可见唤醒完成，不得创建 `AlembicTest` 测试单，不得自动领取新的产品 TODO。

## Design / 需求来源

- 来源类型：用户直接需求 / VAD 主线预飞。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：用户要求总控先准备，准备好了再喊用户开启追求目标。
- 总控接收结论：Wave 6 做脚本级预飞和重复 enqueue 边界修复；完成后向用户请求开启追求目标。
- 是否需要目标阶段确认：已完成；本轮不新增确认门禁。
- 是否需要代码实现依赖调研：已完成；本轮只改 workspace 脚本和测试。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：fixture 当前计划提供 6 个 send-eligible Alembic 系列窗口任务；runtime queue 记录每轮 6 个任务。
  - Consumer：`controller-tick` 判定是否 enqueue、是否等待 queue、是否停在 close / refresh 当前计划门禁。
- 不可提前消费的上游：脚本 fixture 不等于真实 Codex thread 投递；追求目标模式仍需用户开启后验证。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 5：完成 `controller-tick` baseline。
2. Wave 6：完成 3 轮全窗口假 TODO 脚本预飞。
3. 下一步：用户开启追求目标模式，总控在线程内用 `controller-tick` 做真实持续执行测试。
4. 后续：多窗口真实可见唤醒 / 目标线程接入专项。

- 下一处真实阻塞点：需要用户开启追求目标模式，才能验证总控长期运行是否按 `controller-tick` 持续判断。
- 阻塞点之前还能做：已完成脚本级多窗口预飞；当前不需要再派发 Test 或改产品仓库。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：Alembic 系列产品仓库均观察；`AlembicTest` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P6-FAKE-TODO-FULL-WINDOW-PREFLIGHT | `AlembicWorkspace` | 3 轮全窗口假 TODO 脚本闭环，修复重复 enqueue 边界 | 已完成 |

### VAD-P6-FAKE-TODO-FULL-WINDOW-PREFLIGHT：全窗口假 TODO 预飞

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 01:44 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 01:44 CST

阶段目标：

- 在用户开启追求目标前，证明脚本可以处理多轮、全窗口、简单假任务闭环，并且不会对已存在 / 已接受的当前计划任务重复 enqueue。

主线动作：

- `controller-tick` 增加 `missingSendEligibleWindows`，只在当前计划 send-eligible 窗口缺 queue task 时建议 enqueue。
- 当前计划 send-eligible rows 已有 queue task 时，`controller-tick` 返回 `topAction=decision` / `nextAction=closeOrRefreshCurrentPlan`，要求总控关闭、刷新或重开计划，而不是继续自动选 TODO。
- `visible-dispatch.test.mjs` 新增 3 轮全窗口 fake TODO 测试：6 个窗口、18 个任务全部 accepted。

合并 TODO：

- `VAD-TODO-5`：automation loop 继续推进到多轮假任务预飞。
- `VAD-TODO-8`：真实目标 heartbeat 仍留后续；本轮只证明追求目标前的脚本安全性。

明确不包含：

- 不创建真实 Codex heartbeat。
- 不让 `AlembicTest` 承接测试。
- 不触碰产品仓库。
- 不证明真实多窗口可见唤醒已完成。

下一处真实阻塞点：

- 需要用户开启追求目标模式，验证总控线程在真实长期运行模式下能按脚本判断持续执行。

阻塞点之前还能做：

- 已完成；继续做脚本 fixture 会变成重复验证。

验证命令：

```text
node --test scripts/visible-dispatch.test.mjs
node scripts/check-script-docs.mjs
node scripts/sync-current-plan.mjs --check
node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests
```

回填要求：

- 完成范围：已在回填区记录。
- 提交 hash：workspace 文档 / 脚本待总控统一提交。
- 验证命令和结果：已在回填区记录。
- 遗留风险：真实追求目标模式和真实多窗口可见唤醒仍待后续验证。
- 下一步建议：用户开启追求目标模式后，总控先运行 `node scripts/visible-dispatch.mjs controller-tick --json`，根据 topAction 继续；若返回 stopped，先按用户确认开启 mode；若返回 decision，则停下裁决，不自动派发。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-1 | 已完成 | schema / queue | P0 | `AlembicWorkspace` | 定义 visible dispatch state、window registry、dispatch queue 和 automation run 本地 schema。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-2 | 已完成 | automation arming | P0 | `AlembicWorkspace` | `arm` payload、`record-arm`、`record-stop`、`block` 已具备；脚本不直接调用 Codex automation API。 | 是 | Wave 3 / Wave 4 已完成 | `AlembicWorkspace` |
| VAD-TODO-3 | 后续 | visible window validation | P0 | `AlembicWorkspace` | 验证目标可见窗口收到 heartbeat 后 pull / claim / backfill；Wave 4 仅证明当时 single-window heartbeat 未触发。 | 是 | 需要后续明确目标线程和触发模型 | `AlembicWorkspace` |
| VAD-TODO-4 | 已完成 | safety / gate | P0 | `AlembicWorkspace` | 默认关闭、显式开启、普通输入关闭、非 Alembic 窗口拒绝和脚本不直接调用 automation API。 | 是 | Wave 1 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-5 | 部分完成 | automation loop | P0 | `AlembicWorkspace` | `controller-tick` 已完成 3 轮全窗口 fake TODO 预飞；真实追求目标模式持续执行仍需用户开启后验证。 | 是 | Wave 6 预飞通过 | `AlembicWorkspace` |
| VAD-TODO-6 | 已完成 | waiting / acceptance | P0 | `AlembicWorkspace` | `tick` 分类等待 / stale / ready-for-acceptance，`accept` 记录总控验收结论。 | 是 | Wave 2 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-7 | 取消 | controller heartbeat | P0 | `AlembicWorkspace` | 5 分钟总控 controller heartbeat 已按用户确认撤销，不再作为正式路线。 | 否 | 用户确认由 Codex 追求目标模式承担总控持续执行 | `AlembicWorkspace` |
| VAD-TODO-8 | 已裁决为后续 | trigger model | P0 | `AlembicWorkspace` | 目标 thread heartbeat 不作为 Wave 6 阻塞；后续另开多窗口 / 目标线程接入 wave。 | 是 | Wave 6 只做脚本级假 TODO 预飞 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 本轮只改 workspace 总控脚本，不改本地增强底座。 |
| `AlembicCore` | 无任务 | 否 | 无 shared contract 改动。 |
| `AlembicAgent` | 无任务 | 否 | 不改 Agent runtime / prompt。 |
| `AlembicDashboard` | 无任务 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 无任务 | 否 | 本轮验证由总控脚本 fixture 完成，不需要真实项目、cold-start、Dashboard 手动观察或跨仓库环境证据。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续可作为 visible dispatch 目标窗口；Wave 6 不发送。 |
| `AlembicCore`<br>无任务 | 无 shared contract 改动。 |
| `AlembicAgent`<br>无任务 | 不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | 第一版无 UI。 |
| `AlembicPlugin`<br>无任务 | 不做插件化沉淀。 |
| `AlembicTest`<br>无任务 | 总控自测即可回答本轮问题。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

当前无窗口需要发送提示词。下一步等待用户开启追求目标模式。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：多轮全窗口 fake TODO fixture 通过；3 轮、6 窗口、18 任务全部完成 accepted；每轮完成后 controller 停在 `closeOrRefreshCurrentPlan`，不会重复 enqueue。
- 需要真实场景的理由：无；本轮只验证 workspace 脚本状态机和长期运行前的多轮假任务安全边界。
- 测试前边界与多条件判断：
  - 测试要回答的问题：脚本在多轮全窗口 fake TODO 场景下能否稳定 enqueue / arm / claim / complete / accept，并避免重复 enqueue。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：临时 fixture workspace、6 个 allowed visible windows 名称、fake thread ids、ignored runtime state；不涉及真实 Codex thread 或真实项目。
  - 成功能推出的结论：脚本级多轮全窗口状态机可用；可以进入真实追求目标模式测试。
  - 失败能推出的结论：脚本状态机或 controller 判定需返修；不能推出 Codex 追求目标模式失败。
  - 不能推出的结论：不能证明真实多窗口可见唤醒或 target-thread heartbeat 已可用。
  - 停止或不开始条件：若需要真实 thread 投递、Dashboard 手动观察、cold-start 或真实项目证据，另开专项。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不涉及真实项目。

## 回填区

- 2026-05-26 01:44 CST：`visible-dispatch.mjs` 修复当前计划重复 enqueue 边界：current plan send-eligible rows 已有 queue task 时，返回 `topAction=decision / nextAction=closeOrRefreshCurrentPlan`，不再建议重复 enqueue。
- 2026-05-26 01:44 CST：`visible-dispatch.test.mjs` 新增 `fake TODO multi-window rounds complete without duplicate enqueue loops`，覆盖 3 轮、6 个窗口、18 个假任务，全部完成 `arm -> record-arm -> claim -> complete -> accept`，并验证每轮结束后不重复 enqueue。
- 2026-05-26 01:44 CST：`node --test scripts/visible-dispatch.test.mjs` 通过，22 个测试全绿。
- 2026-05-26 01:45 CST：`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过；包含 workspace boundary、repo status、workspace docs、script docs、current plan sync、decision preflight、dispatch coverage、test boundary、TODO board、task package、`git diff --check` 和 45 个 workspace script tests。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 6 追求目标预飞通过",
  "indexPlanDescription": "Wave 6 已完成追求目标开启前预飞：3 轮全窗口 fake TODO 脚本闭环通过，并修复当前计划重复 enqueue 边界。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 6 追求目标预飞通过：22 个 visible-dispatch 脚本测试全绿；当前无发送窗口，等待用户开启追求目标模式。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 6：追求目标开启前全窗口 fake TODO 预飞通过。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 6 追求目标预飞通过：3 轮全窗口 fake TODO 脚本闭环通过，当前无发送窗口；下一步等待用户开启追求目标模式。",
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
      "type": "VAD 原始计划书",
      "doc": "docs/requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md",
      "description": "Visible Automation Dispatch 原始目标和约束。",
      "insertAfter": "VAD 目标阶段确认"
    },
    {
      "type": "VAD 需求设计",
      "doc": "docs/requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md",
      "description": "Visible Automation Dispatch 需求设计和阶段候选。",
      "insertAfter": "VAD 原始计划书"
    },
    {
      "type": "VAD 代码实现依赖调研",
      "doc": "docs/requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md",
      "description": "Visible Automation Dispatch 本地脚本、运行态和 automation 工具边界调研。",
      "insertAfter": "VAD 需求设计"
    }
  ]
}
-->
