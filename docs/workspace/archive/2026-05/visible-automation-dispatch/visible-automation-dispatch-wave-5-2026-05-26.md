# Visible Automation Dispatch Wave 5

日期：2026-05-26
状态：Wave 5 总控验收通过
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：继续可见 Codex 窗口自动化派发生产线，但修正 Wave 4 后暴露的总控流程问题：总控必须自己判断、验证和裁决，不再把不需要真实场景的测试推给 `AlembicTest`，也不把一次 heartbeat 未触发外推为全局失败。
- 最终完成定义：在 Codex 追求目标 / 长期运行模式下，总控可以用脚本读 mode、queue、当前计划和全局 TODO，判断下一步是停止、处理 queue、从当前计划 enqueue、停在当前计划决策门禁、还是只提出 TODO 主线候选；脚本只分类，不自动接受完成、不跳过确认门禁、不调用 Codex automation API。
- 当前是否已经达到：本轮 baseline 已达到；新增 `controller-tick` 并通过脚本单测和当前 workspace 实跑验证。
- 未达到时剩余差距：完整 VAD 仍未完成多窗口可见唤醒和无人值守 TODO 循环；这些不作为 Wave 5 完成定义。
- 已达到时验收 / 归档判断：Wave 5 可验收，不归档整条 VAD 主线；VAD 后续进入“TODO loop / 多窗口接入”后续波次。
- 当前任务分区：总控脚本与自动化治理。
- 不纳入本轮事项：不创建 heartbeat automation，不派发 `AlembicTest`，不触碰 Alembic 产品仓库，不运行真实项目验证，不做 Dashboard UI，不做 Lark Remote。

## 总控决策记录

- 本次决策触发：用户要求继续自动化流程，并明确指出此前问题的第一位不是 Test 本身，而是总控在回填后缺少独立判断、验证和重新计划。
- 需求 / 测试结果理解：Wave 4 的 Test-12 只能说明当时 single-window / 当前可见线程 heartbeat 未触发 claim / complete；不能证明所有 target-thread heartbeat 模型不可行。用户已确认可由 Codex 追求目标模式驱动总控持续执行，因此本轮先补总控自驱 loop 判定，而不是继续创建新的测试 heartbeat。
- 已核对证据：Wave 4 当前计划、`scripts/visible-dispatch.mjs` 的 mode / queue / arm / claim / complete / accept 状态机、`scripts/visible-dispatch.test.mjs`、`scripts/README.md` 和 script skill reference。
- 是否需要先验证 / 重新计划 / 用户确认：需要先总控自测脚本能力；已完成 targeted unit 和当前 workspace `controller-tick` 实跑。无需用户再确认，因为本轮不改变用户原始 VAD 第一版目标，只收窄触发模型并补总控自驱判定。
- 本次允许更新：`visible-dispatch.mjs`、脚本测试、脚本 README、script-pipeline skill reference、当前 Wave 5 计划、全局 TODO 中 VAD 主线状态、同步索引和状态页。
- 本次不得更新：不得把 Wave 4 写成 VAD 全局失败，不得启动新的 `AlembicTest` 测试单，不得把 TODO candidate 自动提升为新主线，不得创建或 arm heartbeat automation。

## Design / 需求来源

- 来源类型：用户直接需求 / 已确认 VAD 主线续波。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：已确认分钟级延迟、Alembic 系列窗口、不依赖 Lark Remote、普通 Codex 输入关闭；用户确认总控可进入追求目标 / 长期运行模式，并可通过普通 Codex 输入关闭。
- 总控接收结论：Wave 5 改为总控自驱 controller baseline；目标 heartbeat 投递模型降级为后续能力，不作为本轮阻塞。
- 是否需要目标阶段确认：已完成；本轮不新增确认门禁。
- 是否需要代码实现依赖调研：已完成；本轮只改 workspace 脚本和治理文档。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `scripts/README.md`
  - `skills/dev/alembic-workspace-control/references/script-pipeline.md`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：当前总控计划和 `global-todo-board` 提供候选任务事实；`visible-dispatch` runtime 提供 mode、registry、queue 和 runs。
  - Consumer：总控窗口在追求目标模式下读取 `controller-tick`，再由总控人工裁决是否 enqueue、arm、等待、验收或选择新 TODO。
- 不可提前消费的上游：窗口 backfill 仍必须经总控验收；TODO candidate 仍必须经过目标确认 / wave 计划，不得由脚本直接派发。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 1-3：本地 schema、queue、claim、accept、arm payload、record-arm / record-stop / block 已完成。
2. Wave 4：single-window visible heartbeat 未触发，结论收窄为触发模型阻塞。
3. Wave 5：追求目标模式下的总控自驱 `controller-tick` baseline。
4. 后续：TODO 主线循环、多窗口注册与真实可见窗口接入。

- 下一处真实阻塞点：完整 VAD 仍缺多窗口可见唤醒 / 目标线程接入闭环；但本轮已经不被 Wave 4 的 Test-12 全局阻塞。
- 阻塞点之前还能做：总控现在可以在长期运行模式下先用 `controller-tick` 判断当前计划、queue 和 TODO，不需要盲目新建测试单或 heartbeat。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：Alembic 系列产品仓库均观察；`AlembicTest` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P5-CONTROLLER-TICK | `AlembicWorkspace` | 新增总控自驱 loop 判定命令和测试，收窄 Wave 4 heartbeat 结论边界 | 已完成 |

### VAD-P5-CONTROLLER-TICK：总控自驱 loop 判定

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 01:32 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 01:32 CST

阶段目标：

- 让总控在追求目标 / 长期运行模式下，有一个只读脚本入口判断下一步，而不是机械创建 heartbeat、派发 Test 或从 TODO 随机取任务。

主线动作：

- 在 `visible-dispatch.mjs` 增加 `controller-tick --json`。
- `controller-tick` 读取 mode、queue、当前计划 dispatch rows 和全局 TODO。
- 决策顺序固定为：mode disabled 停止；queue review / arm / attention / wait 优先；当前计划有 send-eligible 窗口则建议 enqueue；当前计划阻塞 / 待裁决 / 暂停 / 待确认则停在决策门禁；最后才提出 TODO 主线候选。
- 更新脚本测试、脚本 README 和 script-pipeline skill reference。

合并 TODO：

- `VAD-TODO-5`：从 current plan / global TODO 中选择合规主线循环推进，缺确认门禁时停止等待。
- `VAD-TODO-8`：裁决 VAD 后续触发模型；本轮先降级目标 heartbeat 为后续，不再作为当前总控自驱 baseline 阻塞。

明确不包含：

- 不创建、暂停、删除或 arm 任何 Codex heartbeat automation。
- 不自动 accept 完成项。
- 不自动把 TODO candidate 写成新 wave。
- 不派发 `AlembicTest`。
- 不修改产品仓库。

下一处真实阻塞点：

- 多窗口目标线程注册和真实可见唤醒仍未闭合；需要后续单独 wave。

阻塞点之前还能做：

- 总控可以先在长期运行模式下运行 `node scripts/visible-dispatch.mjs controller-tick --json`，按返回的 topAction 决定是停止、处理 queue、enqueue 当前计划、解决当前计划门禁，还是审查 TODO candidate。

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
- 遗留风险：完整多窗口 visible wakeup 仍未关闭。
- 下一步建议：后续如果用户开启长期运行模式，总控先运行 `controller-tick`，再按 topAction 执行，不直接派 Test。

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
| VAD-TODO-5 | 部分完成 | automation loop | P0 | `AlembicWorkspace` | `controller-tick` 已能从 mode / queue / 当前计划 / global TODO 分类下一步；完整无人值守循环仍需后续。 | 是 | Wave 5 baseline 已完成 | `AlembicWorkspace` |
| VAD-TODO-6 | 已完成 | waiting / acceptance | P0 | `AlembicWorkspace` | `tick` 分类等待 / stale / ready-for-acceptance，`accept` 记录总控验收结论。 | 是 | Wave 2 已通过脚本测试 | `AlembicWorkspace` |
| VAD-TODO-7 | 取消 | controller heartbeat | P0 | `AlembicWorkspace` | 5 分钟总控 controller heartbeat 已按用户确认撤销，不再作为正式路线。 | 否 | 用户确认由 Codex 追求目标模式承担总控持续执行 | `AlembicWorkspace` |
| VAD-TODO-8 | 已裁决为后续 | trigger model | P0 | `AlembicWorkspace` | 目标 thread heartbeat 不作为 Wave 5 阻塞；后续另开多窗口 / 目标线程接入 wave。 | 是 | Wave 5 改为总控自驱 baseline | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 本轮只改 workspace 总控脚本，不改本地增强底座。 |
| `AlembicCore` | 无任务 | 否 | 无 shared contract 改动。 |
| `AlembicAgent` | 无任务 | 否 | 不改 Agent runtime / prompt。 |
| `AlembicDashboard` | 无任务 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 无任务 | 否 | 本轮验证由总控脚本测试完成，不需要真实项目、cold-start、Dashboard 手动观察或跨仓库环境证据。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续可作为 visible dispatch 目标窗口；Wave 5 不发送。 |
| `AlembicCore`<br>无任务 | 无 shared contract 改动。 |
| `AlembicAgent`<br>无任务 | 不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | 第一版无 UI。 |
| `AlembicPlugin`<br>无任务 | 不做插件化沉淀。 |
| `AlembicTest`<br>无任务 | 总控自测即可回答本轮问题。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

当前无窗口需要发送提示词。后续如用户开启总控长期运行模式，总控先运行：

```text
node scripts/visible-dispatch.mjs controller-tick --json
```

再按 `topAction` 裁决下一步。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：`controller-tick` 可在 disabled、current-plan enqueue、current-plan decision gate、TODO candidate 四类关键路径下返回正确 topAction；当前 workspace 实跑在 mode disabled 时正确停止，不 enqueue / arm / 选择 TODO。
- 需要真实场景的理由：无；本轮只验证 workspace 脚本分类逻辑和文档同步，不依赖真实项目、cold-start、Dashboard 手动观察、运行时监控或跨仓库环境。
- 测试前边界与多条件判断：
  - 测试要回答的问题：总控是否有一个可复验的只读入口来决定自动化 loop 下一步。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：仅 `AlembicWorkspace` 脚本和 fixture docs；不涉及目标 Codex 线程、真实项目或产品仓库。
  - 成功能推出的结论：脚本可为总控长期运行提供下一步分类；不会在 mode disabled 时推进工作；不会绕过当前计划门禁直接选 TODO。
  - 失败能推出的结论：脚本判定逻辑需返修；不能推出 Codex heartbeat 触发模型失败。
  - 不能推出的结论：不能证明多窗口可见唤醒已完成，不能证明 target-thread heartbeat 已可用。
  - 停止或不开始条件：若需求变为真实窗口唤醒或真实项目验证，必须另开对应 wave / 测试单。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不涉及真实项目。

## 回填区

- 2026-05-26 01:32 CST：新增 `controller-tick`，读取 mode、queue、当前计划 dispatch rows 和 global TODO，分类输出 stopped / review / arm / attention / wait / enqueue / decision / mainlineCandidate / idle；脚本只读，不写 state。
- 2026-05-26 01:32 CST：`node --test scripts/visible-dispatch.test.mjs` 通过，21 个测试全绿，新增覆盖 disabled stop、current-plan enqueue、blocked plan decision gate、TODO candidate selection、历史旧计划 blocked queue 不阻塞新主线。
- 2026-05-26 01:35 CST：当前 workspace 实跑 `node scripts/visible-dispatch.mjs controller-tick --json` 返回 `topAction=stopped` / `nextAction=modeDisabled`；Wave 4 blocked queue 被报告在 `ignoredHistoricTasks` 中，因为当前计划已切到 Wave 5，后续开启 mode 时不会被旧 Test-12 blocker 卡死；由于 mode disabled，未推进 enqueue / arm / TODO。
- 2026-05-26 01:36 CST：`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过；包含 workspace boundary、repo status、workspace docs、script docs、current plan sync、decision preflight、dispatch coverage、test boundary、TODO board、task package、`git diff --check` 和 44 个 workspace script tests。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 5 总控验收通过",
  "indexPlanDescription": "Wave 5 已完成总控自驱 controller-tick baseline：mode / queue / 当前计划 / global TODO 分类下一步，停在决策门禁，不再把 Test-12 当作全局阻塞。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 5 总控验收通过：新增 controller-tick 并通过脚本自测；当前无发送窗口，不创建 AlembicTest 或 heartbeat。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 5：总控自驱 controller-tick baseline 已完成。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 5 总控验收通过：新增 controller-tick 只读分类 mode / queue / 当前计划 / global TODO 下一步；当前无发送窗口，不创建 AlembicTest 或 heartbeat。",
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
