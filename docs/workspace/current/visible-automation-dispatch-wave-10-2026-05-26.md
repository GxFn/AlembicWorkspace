# Visible Automation Dispatch Wave 10

日期：2026-05-26
状态：Wave 10 准备完成，等待开启第一跳
发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：在 Wave 9 暴露 Plugin 越权调起 `AlembicTest` 和 `AlembicTest` registry placeholder 污染后，跑下一轮真实 VAD heartbeat，验证修复后的 role guard、target skill、prompt 收敛和 registry gate 是否生效。
- 最终完成定义：总控只向 5 个已有真实 registry 的窗口创建真实 heartbeat 链路；每个目标窗口按 `skills/dev/visible-automation-dispatch-target/SKILL.md` claim 自己的任务、只读诊断、finish backfill、record-stop；`AlembicPlugin` 完成后不得创建 `AlembicTest` heartbeat；总控看到 5 个新任务 completed，且 `AlembicTest` 因缺真实 thread id 保持未发送 / gate 状态。
- 当前是否已经达到：未达到；Wave 9 修复已通过脚本验证，但还没有在真实 heartbeat 跨窗口链路里复测。
- 未达到时剩余差距：创建 Wave 10 队列、开启 mode、arm `Alembic` 第一跳，等待 5 个目标窗口真实唤醒并回填；最后由总控确认没有 `AlembicTest` 自动化被创建。
- 已达到时验收 / 归档判断：若 5 个目标窗口完成且无 Test 下一跳 automation，VAD role guard 修复可验收；六窗口完整无人值守仍等待 `AlembicTest` 真实 thread id 重新登记。
- 当前任务分区：总控脚本与自动化治理、窗口分派、TODO 状态滚动。
- 不纳入本轮事项：不发送 `AlembicTest`；不运行真实项目测试；不改产品仓库源码；不领取真实全局 TODO；不提交 `.workspace-local`；不把 5 窗口通过解释为六窗口完整通过。

## 总控决策记录

- 本次决策触发：用户要求“下一轮”，且上一轮已确认 `AlembicTest` registry 中 `current-codex-thread` 是虚假信息。
- 需求 / 测试结果理解：这轮要验证修复后的自动化治理，而不是产品实现；当前真实 registry 只有 5 个窗口，所以必须把 `AlembicTest` 明确设为 gate，不得为了凑完整链路重新制造假登记。
- 已核对证据：`node scripts/visible-dispatch.mjs status --json` 显示 mode disabled、registeredWindows=5、Wave 9 queue 已 completed；`register --window AlembicTest --thread current-codex-thread --write --json` 已被脚本拒绝；完整 `verify-control-center --with-script-tests` 已通过。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认下一轮；当前可以新建 Wave 10 并准备队列，但只允许发送 5 个真实登记窗口。
- 本次允许更新：当前 Wave 10 计划、总控索引 / 状态同步、全局 TODO 的 VAD 行、ignored VAD queue / mode / automation run runtime。
- 本次不得更新：不得把 `AlembicTest` 标为待启动；不得创建 `AlembicTest` heartbeat；不得写产品源码；不得把 fake TODO 结果写成真实产品任务结论；不得提交 `.workspace-local`。

## Design / 需求来源

- 来源类型：用户直接需求 / VAD 主线修复复测。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
  - [visible-automation-dispatch-wave-9-2026-05-26.md](visible-automation-dispatch-wave-9-2026-05-26.md)
- 用户确认状态：用户确认继续下一轮。
- 总控接收结论：创建 Wave 10 真实 5 窗口 heartbeat role-guard smoke，`AlembicTest` 作为真实 thread id gate。
- 是否需要目标阶段确认：不新增；属于已确认 VAD 路线内的修复复测。
- 是否需要代码实现依赖调研：不需要；本轮只使用 workspace 脚本、skill 和本地 runtime。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `skills/dev/visible-automation-dispatch-target/SKILL.md`
  - `.workspace-local/visible-dispatch/state.json`
  - `.workspace-local/visible-dispatch/window-registry.json`
  - `.workspace-local/visible-dispatch/dispatch-queue.json`
  - `.workspace-local/visible-dispatch/automation-runs.json`
- producer / consumer 依赖：
  - Producer：总控 `mode --enable`、`enqueue --from-plan`、`arm --task`、Codex automation 创建 heartbeat、`record-arm`。
  - Consumer：5 个目标窗口 heartbeat 醒来后读取 VAD target skill、`claim`、执行只读 fake TODO、`finish --chain-next`、仅在 finish JSON 明确允许 target-courier 时机械创建下一跳、`record-arm`、`record-stop`。
  - Gate：`AlembicTest` 当前没有真实 registry，不是 producer / consumer；如果链路尝试触发 Test，必须停止并归因。
  - Acceptance：总控读取 queue / runs / backfill，逐项 `accept` 或裁决失败层。
- 不可提前消费的上游：`AlembicTest` 真实 thread id 未登记前，不得把 Test 作为可发送窗口。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码；不提交 `.workspace-local`。
- 真实测试项目是否涉及：不涉及；本轮不发送 `AlembicTest`，不创建测试单。

## 阶段顺序

1. Wave 9：真实 6 task smoke 暴露 Plugin 越权 Test 下一跳和 Test placeholder registry。
2. Wave 9 修复：抽取 VAD target skill、同步 AGENTS、脚本拒绝 placeholder thread id、Test 下一跳默认 total-control-owned。
3. Wave 10：只对 5 个真实登记窗口跑真实 heartbeat，验证修复后的 target skill / role guard / no Test auto-arm。
4. 后续：`AlembicTest` 用真实 thread id 登记后，再做六窗口完整无人值守复测。

- 下一处真实阻塞点：5 个窗口完成后，总控需要确认没有 `AlembicTest` automation 被创建；若需要六窗口，则等待真实 Test thread id。
- 阻塞点之前还能做：当前可以 arm 第一跳并等待 5 窗口链路。
- 当前可派发窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`。
- 当前阻塞 / 观察窗口：`AlembicTest` 阻塞于真实 thread id 未登记；`BiliDili` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P10-ROLE-GUARD-REAL-HEARTBEAT-SMOKE | 5 个已登记目标窗口 | 真实 heartbeat role guard smoke，不自动调起 AlembicTest | 待启动 |

### VAD-P10-ROLE-GUARD-REAL-HEARTBEAT-SMOKE：5 窗口 role guard 复测

窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 12:26 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 12:26 CST

阶段目标：

- 用真实 heartbeat 依次唤醒 5 个已登记窗口，验证目标窗口加载 VAD target skill、只处理自己的 task，并且不会把 `AlembicTest` 当成可自动调起目标。

主线动作：

- 每个窗口醒来后先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本计划、`skills/dev/visible-automation-dispatch-target/SKILL.md`，以及目标仓库自己的 `AGENTS.md`。
- 在 AlembicWorkspace 工作目录运行 `node scripts/visible-dispatch.mjs claim --window <窗口名> --write --json`。
- 执行只读诊断：确认当前窗口定位、目标仓库职责、目标仓库 HEAD、目标仓库 `AGENTS.md` 可读、workspace VAD status 可读、未修改产品仓库。
- 用 `finish --chain-next --json` 写入结构化 backfill；只有返回 `chain.nextAction=armNext`、`handoffPolicy=target-courier` 且 `payload.courierAllowed=true` 时，才按 payload 创建下一条 heartbeat，并执行 `chain.recordArmCommand`。
- 如果返回 `controllerArm`、`registerWindow`、`modeDisabled`、`review` 或没有 payload，停止并报告总控；不得创建 `AlembicTest` automation。
- 结束前删除当前 heartbeat automation，并执行 `record-stop --automation-id <当前 automation id> --write --reason "target completed"`。

合并 TODO：

- `GTODO-2026-05-25-005`：Visible Automation Dispatch role guard 修复复测。

明确不包含：

- 不发送 `AlembicTest`，不运行真实测试，不改产品仓库源码，不执行真实 TODO。

下一处真实阻塞点：

- `AlembicPlugin` 完成后若链路仍尝试创建 `AlembicTest` heartbeat，则判为修复失败；若没有下一跳或总控需要 Test 真实 registry，则判为 gate 正确。

阻塞点之前还能做：

- 当前 5 个窗口均有真实 registry，可执行到 Plugin 结束。

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
- 遗留风险：thread id 不稳定、heartbeat 未触发、record-arm 未执行、record-stop 未执行、finish-chain 返回非预期 action。
- 下一步建议：是否继续链到下一窗口；`AlembicPlugin` 必须说明是否停止在 Test gate。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、`skills/dev/visible-automation-dispatch-target/SKILL.md` 和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 禁止使用 `current-codex-thread`、`<thread id>`、`unknown` 等占位符登记 thread。

### Fake TODO backfill 日志字段

每个窗口 finish 的 `--backfill` 至少包含以下字段：

```text
smokeRun=VAD-SMOKE-2026-05-26-B
window=<窗口名>
taskId=<claim 返回 taskId>
heartbeatReceived=yes/no
claimStatus=<claimed/null/error>
readWorkspaceAgents=yes/no
readCurrentPlan=yes/no
readVadTargetSkill=yes/no
readTargetAgents=yes/no
targetRepoHead=<short hash or none>
targetRepoDirty=<clean/dirty/not-checked>
visibleDispatchMode=<enabled/disabled>
queueObservation=<queued/armed/claimed/completed counts>
productWrites=no
createdNextHeartbeat=<yes/no/not-last>
recordArm=<yes/no/not-applicable>
recordStop=<yes/no>
testAutoArmAttempted=no
risk=<一句话>
```

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-10 | 待启动 | real heartbeat role guard smoke | P0 | `AlembicWorkspace` | 5 窗口真实 heartbeat role guard 复测，确认 Plugin 不再自动调起 AlembicTest，placeholder thread id 不再进入 registry。 | 是 | 用户要求下一轮；`AlembicTest` 无真实 registry，故本轮不发送 Test。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | fake TODO role guard smoke | 是 | 已有真实 registry，验证本地增强底座窗口可加载 VAD skill 并 claim / finish。 |
| `AlembicCore` | fake TODO role guard smoke | 是 | 已有真实 registry，验证 Core 窗口可加载 VAD skill 并 claim / finish。 |
| `AlembicAgent` | fake TODO role guard smoke | 是 | 已有真实 registry，验证 Agent 窗口可加载 VAD skill 并 claim / finish。 |
| `AlembicDashboard` | fake TODO role guard smoke | 是 | 已有真实 registry，验证 Dashboard 窗口可加载 VAD skill 并 claim / finish。 |
| `AlembicPlugin` | fake TODO role guard smoke | 是 | 已有真实 registry，重点验证 Plugin 不处理 / 不调起 AlembicTest。 |
| `AlembicTest` | gate | 否 | 真实 thread id 未登记；placeholder 已被清理并由脚本拒绝。 |

## 窗口分派

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 非产品 fake TODO role guard smoke：真实 heartbeat 唤醒后读取 VAD skill，claim `Alembic` 任务，执行只读诊断，finish 并按允许条件 chain-next。 |
| `AlembicCore`<br>待启动 | 非产品 fake TODO role guard smoke：真实 heartbeat 唤醒后读取 VAD skill，claim `AlembicCore` 任务，执行只读诊断，finish 并按允许条件 chain-next。 |
| `AlembicAgent`<br>待启动 | 非产品 fake TODO role guard smoke：真实 heartbeat 唤醒后读取 VAD skill，claim `AlembicAgent` 任务，执行只读诊断，finish 并按允许条件 chain-next。 |
| `AlembicDashboard`<br>待启动 | 非产品 fake TODO role guard smoke：真实 heartbeat 唤醒后读取 VAD skill，claim `AlembicDashboard` 任务，执行只读诊断，finish 并按允许条件 chain-next。 |
| `AlembicPlugin`<br>待启动 | 非产品 fake TODO role guard smoke：真实 heartbeat 唤醒后读取 VAD skill，claim `AlembicPlugin` 任务，执行只读诊断，finish 后不得创建 AlembicTest automation。 |
| `AlembicTest`<br>阻塞 | 真实 thread id 未登记；本轮不发送、不创建 heartbeat、不运行测试。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/visible-automation-dispatch-wave-10-2026-05-26.md、skills/dev/visible-automation-dispatch-target/SKILL.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

本轮是 Visible Automation Dispatch Wave 10 真实 heartbeat role guard smoke。只领取你所在窗口的 fake TODO 任务；不要改产品源码，不要运行真实项目测试，不要领取全局真实 TODO，不要创建 AlembicTest heartbeat。

醒来后在 AlembicWorkspace 工作目录运行：

node scripts/visible-dispatch.mjs claim --window <你的窗口名> --write --json

再执行当前计划要求的只读诊断，并用结构化 backfill 运行：

node scripts/visible-dispatch.mjs finish --window <你的窗口名> --backfill "<按计划 Fake TODO backfill 日志字段填写>" --write --chain-next --json

只有 finish JSON 返回 chain.nextAction === "armNext"、chain.handoffPolicy === "target-courier" 且 chain.payload.courierAllowed === true 时，才用 Codex automation 工具按 payload 创建下一条 heartbeat；创建成功后运行 finish JSON 中的 chain.recordArmCommand，把 <automation-id> 替换成真实返回 id。若返回 controllerArm、modeDisabled、review、wait、registerWindow 或下一跳目标是 AlembicTest，停止并报告总控。

结束前删除当前 heartbeat automation，并运行：

node scripts/visible-dispatch.mjs record-stop --automation-id <当前 automation id> --write --reason "target completed"
```

## 测试交接

- 是否需要 `AlembicTest`：否；本轮正是验证没有真实 registry 时不得发送 `AlembicTest`。
- 总控自测结论：脚本层面已验证 placeholder 拒绝和 Test next-hop total-control-owned；本轮只验证真实 heartbeat 跨窗口执行纪律。
- 需要真实场景的理由：需要真实 Codex thread / heartbeat 才能验证目标窗口是否按 skill 执行；不需要真实项目环境。
- 测试前边界与多条件判断：
  - 测试要回答的问题：修复后的真实 heartbeat 是否能让 5 个窗口完成，且 Plugin 不再自动调起 `AlembicTest`。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`.workspace-local/visible-dispatch` runtime、5 个已登记 Alembic 系列可见 Codex 窗口；`AlembicTest` 不在本轮发送名单。
  - 成功能推出的结论：VAD target skill / role guard / no-Test-auto-arm 修复在 5 窗口真实链路中有效。
  - 失败能推出的结论：失败归因在 automation 投递、thread registry、窗口操作、脚本状态机或总控计划边界之一；不能直接归因到产品仓库。
  - 不能推出的结论：不能证明六窗口完整无人值守已通过；不能证明真实产品 TODO 可无人值守完成。
  - 停止或不开始条件：mode disabled 且用户未开启；任一 5 窗口 thread id 缺失；已有 active automation run 未清；用户要求停止。
- 测试单：无。
- 真实项目保护说明：不涉及真实项目；不运行 `AlembicTest`。

## 回填区

- 2026-05-26 12:26 CST：创建 Wave 10 修复复测计划；本轮只发送 5 个已有真实 registry 的窗口，`AlembicTest` 为真实 thread id gate。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 10 准备完成，等待开启第一跳",
  "indexPlanDescription": "Visible Automation Dispatch Wave 10：5 窗口真实 heartbeat role guard smoke，验证 Plugin 不再自动调起 AlembicTest，AlembicTest 等真实 thread id gate。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 10 已准备：当前只发送 5 个真实登记窗口；AlembicTest 无真实 registry，不发送、不创建 heartbeat。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 10：5 窗口真实 heartbeat role guard smoke。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 10 已准备：本轮只向 Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin 五个真实登记窗口发送 heartbeat；AlembicTest 的 placeholder registry 已清理，未重新真实登记前保持 gate，不创建 heartbeat。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
