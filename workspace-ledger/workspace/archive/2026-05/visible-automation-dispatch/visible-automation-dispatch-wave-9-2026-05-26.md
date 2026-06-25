# Visible Automation Dispatch Wave 9

日期：2026-05-26
状态：Wave 9 smoke 已跑完，角色守卫修复待验证
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：用真实 Codex heartbeat / thread automation 跑一圈 Visible Automation Dispatch，但任务内容使用有诊断价值的 fake TODO；除任务内容外，claim、finish、chain-next、record-arm、record-stop、总控验收和停止开关都按真实流程执行。
- 最终完成定义：总控在 mode enabled 下从本计划生成队列，真实创建第一条 heartbeat；每个目标窗口被真实唤醒后读取规则、claim 自己的任务、执行只读诊断、用结构化 backfill finish；非特殊下一跳只有在 `handoffPolicy=target-courier` 且 `courierAllowed=true` 时才可由目标窗口机械创建下一窗口 heartbeat 并执行 `record-arm`；`AlembicTest` 下一跳默认由总控调起；最后一个窗口完成后不再生成下一跳，总控能看到 6 个 completed task、6 份结构化 backfill、automation run stop 记录，并能独立 accept 或指出失败层。
- 当前是否已经达到：自动化链路已真实跑完，`status --json` 显示 6 个 completed task / 6 条 automation run，mode 已关闭；但治理验收发现两项缺口：下一跳 `AlembicTest` 的调起由 `AlembicPlugin` 执行、`AlembicPlugin` 没有明确守住“只处理 Plugin 任务”的职责边界。
- 未达到时剩余差距：将无人值守规则抽成 `skills/dev/visible-automation-dispatch-target/SKILL.md`，同步给需要参与 VAD 的仓库 `AGENTS.md`；脚本 prompt 引用 skill 并增加 `AlembicTest` 默认 total-control arm 守卫；完成脚本测试和总控校验后再裁决是否接受本轮 smoke。
- 已达到时验收 / 归档判断：本轮可裁决为“真实多窗口 fake TODO 链路到达 completed”，但不能裁决为“无人值守治理规则完整通过”，直到角色守卫修复和脚本验证完成。
- 当前任务分区：总控脚本与自动化治理、窗口分派、TODO 状态滚动。
- 不纳入本轮事项：不改产品仓库源码，不运行真实项目测试，不创建 `AlembicTest` 测试单，不领取 PCVM / Plugin intent / file monitor 等真实全局 TODO，不把 raw thread id 写入 Git 跟踪文档。

## 总控决策记录

- 本次决策触发：用户确认先做 fake TODO，但其它流程保持真实，并要求 fake TODO 不要太简单、保留主要日志信息便于后续纠错。
- 需求 / 测试结果理解：这轮要验证的是 VAD 自动化链路本身，不是产品任务实现能力。为了避免把产品任务失败和自动化投递失败混在一起，任务内容必须无产品副作用，但 backfill 要包含足够诊断字段。
- 已核对证据：Wave 8 已实现 `FREQ=MINUTELY;INTERVAL=1` heartbeat payload、target finish-chain、mode disabled 断链门禁；Wave 9 完成后发现 `AlembicTest` registry 使用了 `current-codex-thread` 占位符，已通过 `unregister --window AlembicTest --write` 清理，当前 registry 只保留 5 个真实登记窗口；脚本已新增 placeholder thread id 拒绝门禁。
- 是否需要先验证 / 重新计划 / 用户确认：需要先完成本计划、队列和校验准备；不启动真实 heartbeat，直到用户明确说开启。
- 本次允许更新：当前 Wave 9 计划、总控索引 / 状态同步、全局 TODO 的 VAD 行、`check-test-boundary` 非测试型 VAD smoke 例外、脚本索引说明、本地 ignored VAD queue。
- 本次不得更新：不得改 Alembic 系列产品源码；不得把 fake TODO 结论写成真实产品能力结论；不得自动开启 mode 或创建 heartbeat；不得把 `AlembicTest` 当测试验证窗口；不得提交 `.wakeflow-local`。

## Design / 需求来源

- 来源类型：用户直接需求 / VAD 主线调整。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：用户确认使用 fake TODO，但要求真实自动化流程和足够日志。
- 总控接收结论：创建 Wave 9 真实 heartbeat smoke，准备本地队列，等待用户开启。
- 是否需要目标阶段确认：不新增；属于已确认 VAD 路线内的真实 smoke。
- 是否需要代码实现依赖调研：不需要；本轮只使用 workspace 脚本和本地 runtime。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `.wakeflow-local/visible-dispatch/state.json`
  - `.wakeflow-local/visible-dispatch/window-registry.json`
  - `.wakeflow-local/visible-dispatch/dispatch-queue.json`
  - `.wakeflow-local/visible-dispatch/automation-runs.json`
- producer / consumer 依赖：
  - Producer：总控 `mode --enable`、`enqueue --from-plan`、`arm --task`、Codex automation 创建 heartbeat、`record-arm`。
  - Consumer：目标窗口 heartbeat 醒来后 `claim`、执行只读 fake TODO、`finish --chain-next`、仅在 finish JSON 明确允许 target-courier 时按 `chain.payload` 创建下一跳、`record-arm`、`record-stop`；`AlembicTest` 下一跳默认由总控创建。
  - Acceptance：总控读取 queue / runs / backfill，逐项 `accept` 或裁决失败层。
- 不可提前消费的上游：用户未明确开启前不得 enable mode 或创建 heartbeat；若任一窗口无法唤醒或无法 record-arm，必须暂停链路并归因，不得继续空转。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码；不提交 `.wakeflow-local`。
- 真实测试项目是否涉及：不涉及；`AlembicTest` 本轮只作为非测试型可见窗口参与 VAD heartbeat smoke，不运行真实项目测试。

## 阶段顺序

1. Wave 8：完成无人值守 payload、关闭断链和六窗口 thread registry。
2. Wave 9 准备：写入本计划、补 test-boundary 非测试型 smoke 例外、准备队列、等待用户开启。
3. Wave 9 执行：用户开启后真实创建 heartbeat，按六窗口顺序完成 fake TODO chain。
4. Wave 9 验收：总控复核 6 个 backfill、automation run stop 记录、queue 状态和 mode，裁决通过 / 失败层。

- 下一处真实阻塞点：角色守卫修复后的脚本 / 文档 / AGENTS 校验；本轮不再继续自动跳转。
- 阻塞点之前还能做：抽取 VAD target skill，收敛提示词，补脚本测试和子仓库 AGENTS 职责守卫。
- 当前可派发窗口：当前不继续派发；`AlembicTest` 需要真实 thread id 重新登记后才能参与下一轮 VAD。
- 当前阻塞 / 观察窗口：`AlembicTest` registry 曾被 placeholder 污染，已清理；`BiliDili` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P9-REAL-HEARTBEAT-FAKE-TODO-SMOKE | Alembic 系列目标窗口 / `AlembicTest` | 真实 heartbeat chain + 结构化 fake TODO backfill | 待验收 |

### VAD-P9-REAL-HEARTBEAT-FAKE-TODO-SMOKE：真实自动化链路 fake TODO smoke

窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 11:34 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 11:34 CST

阶段目标：

- 使用真实 VAD heartbeat 链路依次唤醒 6 个已登记窗口，证明 claim / finish / chain-next / record-arm / record-stop 可以跨线程接续。

主线动作：

- 每个窗口醒来后先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本计划，以及目标仓库自己的 `AGENTS.md`。
- 在 AlembicWorkspace 工作目录运行 `node scripts/visible-dispatch.mjs claim --window <窗口名> --write --json`。
- 执行只读诊断：确认当前窗口定位、目标仓库职责、目标仓库 HEAD、目标仓库 `AGENTS.md` 可读、workspace VAD status 可读、未修改产品仓库。
- 用 `finish --chain-next --json` 写入结构化 backfill；只有返回 `chain.nextAction=armNext`、`handoffPolicy=target-courier` 且 `payload.courierAllowed=true` 时，才按 payload 创建下一条 heartbeat，并执行 `chain.recordArmCommand`。
- 如果返回 `controllerArm` 或下一跳目标是 `AlembicTest`，停止并交给总控 arm；非 `AlembicTest` 窗口不得处理 `AlembicTest` 自动化。
- 结束前删除当前 heartbeat automation，并执行 `record-stop --automation-id <当前 automation id> --write --reason "target completed"`。

合并 TODO：

- `GTODO-2026-05-25-005`：Visible Automation Dispatch 真实多窗口 fake TODO smoke。

明确不包含：

- 不执行真实产品任务。
- 不运行 `AlembicTest` 真实项目验证。
- 不把本轮 fake TODO 通过解释为 PCVM、Plugin intent 或 file monitor 主线完成。

下一处真实阻塞点：

- 本轮真实 heartbeat 已完成；当前阻塞点是角色守卫修复与验证，避免 Plugin / 产品窗口越权处理 `AlembicTest` 下一跳。

阻塞点之前还能做：

- 已关闭 mode；可在 workspace 内修复脚本、skill、AGENTS 和当前计划，不触碰产品源码。

验证命令：

```text
node scripts/visible-dispatch.mjs status --json
node scripts/visible-dispatch.mjs tick --json
node scripts/visible-dispatch.mjs controller-tick --json
node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests
```

回填要求：

- 完成范围：本窗口是否被 heartbeat 唤醒、是否 claim 到正确 task、是否完成只读诊断、是否 finish。
- 提交 hash：无；本轮不改产品源码。
- 验证命令和结果：至少包含 `claim --json` 摘要、`status --json` 的 mode / queue 摘要、目标仓库 HEAD / dirty 摘要。
- 遗留风险：thread id 不稳定、heartbeat 未触发、record-arm 未执行、record-stop 未执行、finish-chain 返回非 `armNext`。
- 下一步建议：是否继续链到下一窗口，或应由总控暂停裁决失败层。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### Fake TODO backfill 日志字段

每个窗口 finish 的 `--backfill` 至少包含以下字段；可以用紧凑 Markdown 或单行 JSON-like 文本，最终会保存在 ignored runtime 的 dispatch queue 中：

```text
smokeRun=VAD-SMOKE-2026-05-26-A
window=<窗口名>
taskId=<claim 返回 taskId>
heartbeatReceived=yes/no
claimStatus=<claimed/null/error>
readWorkspaceAgents=yes/no
readCurrentPlan=yes/no
readTargetAgents=yes/no
targetRepoHead=<short hash or none>
targetRepoDirty=<clean/dirty/not-checked>
visibleDispatchMode=<enabled/disabled>
queueObservation=<queued/armed/claimed/completed counts>
productWrites=no
createdNextHeartbeat=<yes/no/not-last>
recordArm=<yes/no/not-applicable>
recordStop=<yes/no>
risk=<一句话>
```

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-9 | 待验收 | real heartbeat smoke / role guard fix | P0 | `AlembicWorkspace` | 使用真实 heartbeat 和 fake TODO 跑完整多窗口 VAD chain，收集可复核 backfill / automation run 证据，并修复 smoke 暴露的跨窗口职责守卫问题。 | 是 | 真实链路已完成；当前需要验证 skill / AGENTS / script guard，尤其 `AlembicTest` 下一跳默认由总控调起。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | fake TODO smoke | 是 | 验证本地增强底座窗口可被 heartbeat 唤醒并 claim / finish。 |
| `AlembicCore` | fake TODO smoke | 是 | 验证 Core 窗口可被 heartbeat 唤醒并 claim / finish。 |
| `AlembicAgent` | fake TODO smoke | 是 | 验证 Agent 窗口可被 heartbeat 唤醒并 claim / finish。 |
| `AlembicDashboard` | fake TODO smoke | 是 | 验证 Dashboard 窗口可被 heartbeat 唤醒并 claim / finish。 |
| `AlembicPlugin` | fake TODO smoke | 是 | 验证 Plugin 窗口可被 heartbeat 唤醒并 claim / finish。 |
| `AlembicTest` | 非测试型 fake TODO smoke | 是 | 只验证可见窗口 heartbeat 链路，不创建测试单、不运行真实项目测试。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待验收 | 非产品 fake TODO smoke 已完成；待总控复核 backfill / automation run 并应用角色守卫修复。 |
| `AlembicCore`<br>待验收 | 非产品 fake TODO smoke 已完成；待总控复核 backfill / automation run 并应用角色守卫修复。 |
| `AlembicAgent`<br>待验收 | 非产品 fake TODO smoke 已完成；待总控复核 backfill / automation run 并应用角色守卫修复。 |
| `AlembicDashboard`<br>待验收 | 非产品 fake TODO smoke 已完成；待总控复核 backfill / automation run 并应用角色守卫修复。 |
| `AlembicPlugin`<br>待验收 | 非产品 fake TODO smoke 已完成；本轮暴露 Plugin 创建 `AlembicTest` 下一跳的职责守卫缺口，当前已归入修复。 |
| `AlembicTest`<br>待验收 | 非测试型 Visible Automation Dispatch smoke 已完成；只作为可见窗口链路参与，不代表真实项目测试结论。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

当前不发送目标窗口提示词；以下只保留为后续重新开启 VAD smoke 时的规则模板，必须先修复并确认真实 thread registry 后再使用。

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/visible-automation-dispatch-wave-9-2026-05-26.md、skills/dev/visible-automation-dispatch-target/SKILL.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

本轮是 Visible Automation Dispatch 真实 heartbeat smoke。任务内容是 fake TODO，但流程必须真实：claim、只读诊断、finish、按 finish JSON 和 VAD target skill 判断是否允许创建下一跳 heartbeat、record-arm、record-stop。不要改产品源码，不要运行真实项目测试，不要领取全局真实 TODO。AlembicTest 也只作为非测试型可见窗口参与，不创建测试单。

醒来后在 AlembicWorkspace 工作目录运行：

node scripts/visible-dispatch.mjs claim --window <你的窗口名> --write --json

再执行当前计划要求的只读诊断，并用结构化 backfill 运行：

node scripts/visible-dispatch.mjs finish --window <你的窗口名> --backfill "<按计划 Fake TODO backfill 日志字段填写>" --write --chain-next --json

只有 finish JSON 返回 chain.nextAction === "armNext"、chain.handoffPolicy === "target-courier" 且 chain.payload.courierAllowed === true 时，才用 Codex automation 工具按 payload 创建下一条 heartbeat；创建成功后运行 finish JSON 中的 chain.recordArmCommand，把 <automation-id> 替换成真实返回 id。若返回 controllerArm、modeDisabled、review、wait、registerWindow 或下一跳目标是 AlembicTest，停止并报告总控。

结束前删除当前 heartbeat automation，并运行：

node scripts/visible-dispatch.mjs record-stop --automation-id <当前 automation id> --write --reason "target completed"
```

## 测试交接

- 是否需要 `AlembicTest`：否；本轮 `AlembicTest` 只作为非测试型 VAD 可见窗口参与 heartbeat smoke，不创建测试单。
- 总控自测结论：脚本层面已通过 fake TODO 多窗口单测；本轮要验证真实 Codex heartbeat 跨线程唤醒，不需要真实项目环境。
- 需要真实场景的理由：需要真实 Codex thread / heartbeat 才能验证唤醒和 finish-chain；但不需要真实产品仓库修改、cold-start、rescan、Dashboard 手动观察或真实测试项目。
- 测试前边界与多条件判断：
  - 测试要回答的问题：真实 heartbeat 是否能按已登记 thread id 唤醒窗口，并由窗口完成 claim / finish / chain-next / record-arm / record-stop。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`.wakeflow-local/visible-dispatch` runtime、Alembic 系列可见 Codex 窗口；`AlembicTest` 必须使用真实 thread id 登记，placeholder 不算可投递窗口；不触碰产品源码和真实测试项目。
  - 成功能推出的结论：VAD 真实多窗口 fake TODO 自动化链路可工作，后续可以用低风险 workspace-only 真实任务继续验证。
  - 失败能推出的结论：失败归因在 automation 投递、thread registry、窗口操作、脚本状态机或总控计划边界之一；不能直接归因到产品仓库。
  - 不能推出的结论：不能证明 PCVM、Plugin intent、file monitor 或真实产品任务已可无人值守完成。
  - 停止或不开始条件：用户未明确开启；mode disabled；任一窗口 thread id 缺失；已有 active automation run 未清；队列存在未裁决旧任务；用户要求停止。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不涉及真实项目；`AlembicTest` 不运行真实项目测试，只参与非测试型 VAD heartbeat smoke。

## 回填区

- 2026-05-26 11:34 CST：创建 Wave 9 真实 heartbeat fake TODO smoke 计划；准备阶段不启用 mode、不创建 heartbeat，等待用户明确开启。
- 2026-05-26 11:37 CST：已执行 `node scripts/visible-dispatch.mjs enqueue --from-plan --write --json`，从本计划创建 6 个 queued fake TODO smoke task；当前 mode 仍为 disabled，未创建任何 heartbeat automation。
- 2026-05-26 11:41 CST：用户确认开启；已执行 `mode --enable --write`、`arm --task visible-automation-dispatch-wave-9-2026-05-26__Alembic --json`、创建第一条 `Alembic` heartbeat，并执行 `record-arm` 写入 automation id。当前 mode enabled，`Alembic` task 为 `armed`，后续 5 个 task 保持 queued；本轮不手动 arm 第二跳，等待目标窗口通过 finish-chain 创建下一跳。
- 2026-05-26 12:10 CST：真实 heartbeat smoke 已跑到 6 个 completed task / 6 条 automation run；总控已关闭 mode。验收发现角色守卫问题：`AlembicPlugin` 完成自身任务后创建了 `AlembicTest` 下一跳，说明无人值守规则没有沉到 skill 且子仓库 AGENTS 未明确禁止跨窗口职责。当前修复方向：新增 VAD target skill、同步各目标仓库 AGENTS、脚本生成提示词引用 skill，并让 `AlembicTest` 下一跳默认返回 `controllerArm` 由总控调起。
- 2026-05-26 12:16 CST：用户指出 `AlembicTest` registry 中 `threadId=current-codex-thread` 是虚假信息；总控确认并执行 `unregister --window AlembicTest --write` 移除该 active entry。脚本新增 `validateThreadId`，`register` / `finish --thread` 均拒绝 `current-codex-thread`、`<thread id>`、`unknown` 等占位符；当前 `status --json` 为 `registeredWindows=5`、`completed=6`、`mode=disabled`。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 9 smoke 已跑完，角色守卫修复待验证",
  "indexPlanDescription": "Visible Automation Dispatch Wave 9 真实 heartbeat fake TODO smoke 已跑完；当前修复并验证 VAD target skill、跨窗口职责守卫和 AlembicTest total-control arm 规则。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 9 已完成 6 个 completed task / 6 条 automation run，mode 已关闭；当前处理 smoke 暴露的 Plugin 越权创建 AlembicTest 下一跳和 AlembicTest placeholder thread registry 问题。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 9：真实 heartbeat fake TODO smoke 已跑完，角色守卫修复待验证。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 9 已完成 6 个 completed task / 6 条 automation run，mode 已关闭；当前结论是自动化链路到达 completed，但无人值守治理未通过，正在修复 skill / AGENTS / script guard，避免 Plugin 或产品窗口越权处理 AlembicTest 下一跳，并已清理 AlembicTest 的 placeholder thread registry。当前 registry 为 5 个真实登记窗口，AlembicTest 需真实 thread id 重新登记后才能参与下一轮。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
