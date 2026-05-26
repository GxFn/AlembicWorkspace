# Visible Automation Dispatch Wave 8

日期：2026-05-26
状态：Wave 8 无人值守 payload 与关闭断链已实现，等待本地线程登记
发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：VAD 自动化模式下按 1 分钟 heartbeat 跳转，由代码保证无人值守接续；窗口线程 ID 单独开派发任务交给各窗口收集；后续真实验证另找时机；关闭模式后，下一次窗口完成不再携带自动化下一跳。
- 最终完成定义：`visible-dispatch.mjs arm` 生成的 heartbeat payload 固定使用 `FREQ=MINUTELY;INTERVAL=1`，并携带目标窗口 claim / finish / 创建下一跳 heartbeat / record-arm / record-stop 的完整无人值守步骤；`mode --disable --write` 后，即使已有目标 heartbeat 已经被 armed，目标窗口醒来并执行 `finish --chain-next` 也只能得到 `modeDisabled`，没有 `chain.payload`，因此不会继续跳转；当前计划单独派发窗口线程登记任务，等待各窗口把 thread id 写入本地 ignored runtime `.workspace-local/visible-dispatch/window-registry.json`，不得写入 Git 跟踪文档或提交到 GitHub。
- 当前是否已经达到：脚本侧已达到；窗口线程登记尚待各窗口回填。
- 未达到时剩余差距：需要 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 把各自可见 Codex thread id 登记到本地 ignored runtime；真实多窗口无人值守 smoke 留后续用户确认时机。
- 已达到时验收 / 归档判断：脚本侧可先验收为已实现；线程登记完成后再准备真实 heartbeat smoke。
- 当前任务分区：总控脚本与自动化治理、窗口分派。
- 不纳入本轮事项：不触碰产品源码，不跑真实项目测试，不把 `AlembicTest` 用作验证窗口，不启动真实多窗口 smoke，不自动领取新的产品 TODO，不把 raw thread id 写入 Git 跟踪文件。

## 总控决策记录

- 本次决策触发：用户确认完全无人值守应由代码保证，接受 `FREQ=MINUTELY;INTERVAL=1` 分钟级跳转，并要求关闭模式后下一次窗口跳转不再带自动化。
- 需求 / 测试结果理解：脚本不能直接调用 Codex automation API，但可以让每个 heartbeat payload 自带下一跳创建和登记步骤；真正的无人值守边界是“目标窗口醒来后，按 payload 指令创建下一条 heartbeat”。关闭模式必须在 `finish --chain-next` 处断链，因为这是已有目标 heartbeat 醒来后的最后一道代码门禁。
- 已核对证据：`visible-dispatch.mjs` 的 `arm`、`finish`、`mode`、`record-arm`、`record-stop` 和 `controller-tick` 链路；Wave 7 real smoke 已证明真实窗口可被 heartbeat 唤醒并回到总控；现有脚本单测覆盖模式门禁和多轮 fake TODO。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认方向；总控先完成脚本自测和当前计划更新，真实多窗口验证等后续时机。
- 本次允许更新：`visible-dispatch.mjs`、`visible-dispatch.test.mjs`、`scripts/README.md`、脚本流水线 skill reference、当前 VAD Wave 8 计划、总控索引 / 状态同步和全局 TODO row。
- 本次不得更新：不得改 Alembic 系列产品仓库源码；不得把窗口回填结论直接视为总控验收；不得在 mode disabled 后继续创建下一跳；不得把线程登记任务扩大成真实测试；不得把 raw thread id 写入当前计划、回填文档、Git commit 或 GitHub。

## Design / 需求来源

- 来源类型：用户直接需求 / VAD 主线调整。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：用户确认使用分钟级 heartbeat 跳转，线程 ID 由各窗口单独收集并只保存在本地 ignored runtime，关闭模式后断开后续自动化。
- 总控接收结论：在 workspace 脚本中补强 unattended target prompt 与 disable-after-arm 断链测试；创建线程登记分派任务。
- 是否需要目标阶段确认：不新增；属于已确认 VAD 路线内的实现收敛。
- 是否需要代码实现依赖调研：不需要；本轮只改 workspace 脚本和总控计划。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：`arm` 生成 heartbeat payload；目标窗口按 payload 执行 claim / finish / next-arm / record-arm / record-stop；`mode` 状态决定是否允许下一跳。
  - Consumer：总控使用 `controller-tick` / `accept` 做显式验收和 TODO 选择；目标窗口只按当前计划领取自己窗口任务。
- 不可提前消费的上游：真实窗口 thread id 未登记到本地 ignored runtime 前不能稳定自动投递；真实 smoke 未跑前不能宣称全窗口无人值守生产可用。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码。
- 真实测试项目是否涉及：不涉及；`AlembicTest` 本轮只作为非测试型可见窗口登记 thread id。

## 阶段顺序

1. Wave 7：完成 automation mode、finish-chain、旧 runtime residue 清理。
2. Wave 8：补强 unattended heartbeat payload、disable-after-arm 断链门禁，并单独派发窗口线程登记任务。
3. 后续：用户确认真实验证时机后，开启 mode enabled，使用已登记 thread id 跑真实多窗口 smoke。

- 下一处真实阻塞点：等待目标窗口回填可见 Codex thread id。
- 阻塞点之前还能做：脚本侧已完成并通过总控自测。
- 当前可派发窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`。
- 当前阻塞 / 观察窗口：无；`AlembicTest` 是非测试型线程登记任务，不创建测试单。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P8-UNATTENDED-PAYLOAD-CLOSE-SWITCH | `AlembicWorkspace` | 1 分钟无人值守 payload 与关闭断链门禁 | 已完成 |
| VAD-P8-WINDOW-THREAD-REGISTRY-COLLECTION | Alembic 系列目标窗口 / `AlembicTest` | 收集目标窗口可见 Codex thread id 到本地 ignored runtime | 待启动 |

### VAD-P8-UNATTENDED-PAYLOAD-CLOSE-SWITCH：无人值守 payload 与关闭断链门禁

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 03:07 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 03:07 CST

阶段目标：

- 让脚本生成的 heartbeat payload 自带无人值守接续步骤，并保证 close switch 后不再生成下一跳。

主线动作：

- `buildTaskPrompt` 增加 target heartbeat 自推进说明：claim 当前任务、完成后运行 `finish --chain-next --json`、仅在 `chain.payload` 存在时创建下一条 heartbeat、随后 `record-arm`，最后删除 / record-stop 当前 heartbeat。
- `buildArmPayload` 明确 heartbeat cadence 为 `FREQ=MINUTELY;INTERVAL=1`，并输出 `chainMode` 和 `stopSwitchCommand` 元数据。
- `buildFinishChain` 在 mode disabled 时只记录完成并返回 `modeDisabled`，不输出下一跳 payload。
- 增加 disable-after-arm 单测：payload 已经发出后再关闭模式，目标窗口醒来完成也不能再链到下一窗口。

合并 TODO：

- `VAD-TODO-5`：automation loop 调整为显式 mode loop，并补无人值守 target prompt。
- `VAD-TODO-8`：真实多窗口目标线程调起仍留后续 smoke。

明确不包含：

- 不创建真实 Codex heartbeat。
- 不触碰产品仓库。
- 不把脚本自测等同于真实多窗口生产验收。

下一处真实阻塞点：

- 真实目标窗口 thread id 未全部登记。

阻塞点之前还能做：

- 已完成脚本级测试和文档同步。

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
- 遗留风险：真实目标窗口创建下一跳 heartbeat 的运行时行为仍待后续 smoke。
- 下一步建议：等待窗口线程登记完成。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和脚本流水线 skill reference。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### VAD-P8-WINDOW-THREAD-REGISTRY-COLLECTION：窗口线程登记收集

窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 03:07 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 03:07 CST

阶段目标：

- 让每个目标窗口把自己的可见 Codex thread id 登记到本地 ignored runtime，供后续真实 heartbeat smoke 使用。

主线动作：

- 每个窗口只确认自己的当前 thread id、窗口名称、工作目录和是否可接收 heartbeat。
- 在 AlembicWorkspace 工作目录执行 `node scripts/visible-dispatch.mjs register --window <窗口名> --thread <threadId> --write --json`，把 raw thread id 写入 `.workspace-local/visible-dispatch/window-registry.json`；该目录已被 `.gitignore` 忽略，不提交 GitHub。
- 回填到聊天或文档时只写“已本地登记 / 未能登记”和命令结果中的 redacted 字段；不得把 raw thread id 写入当前计划、回填文档或其它 Git 跟踪文件。

合并 TODO：

- `VAD-TODO-8`：真实 thread heartbeat 需要先具备目标窗口 thread registry。

明确不包含：

- 不改产品代码。
- 不运行真实项目测试。
- 不创建 heartbeat automation。
- 不领取产品 TODO。

下一处真实阻塞点：

- 线程 ID 不可见、无法本地登记或登记后无法确认 heartbeat 可达时，后续真实 smoke 需要用户手动补充。

阻塞点之前还能做：

- 已提供统一登记提示词。

验证命令：

```text
node scripts/visible-dispatch.mjs status --json
node scripts/visible-dispatch.mjs register --window <窗口名> --thread <threadId> --write --json
```

回填要求：

- 完成范围：本窗口 thread id 是否已本地登记；不得回填 raw thread id。
- 提交 hash：无。
- 验证命令和结果：登记命令输出中的 redacted 字段，或无法登记的原因。
- 遗留风险：thread id 不确定、窗口不是目标窗口、无法确认 heartbeat 可达性。
- 下一步建议：是否可纳入后续真实 smoke。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-5 | 脚本侧已完成，等待 thread registry | automation loop | P0 | `AlembicWorkspace` | 自动化模式脚本循环、无人值守 target prompt 和关闭断链门禁已具备；真实窗口 smoke 待后续。 | 是 | 需要目标窗口 thread id 本地登记 | `AlembicWorkspace` |
| VAD-TODO-8 | 进行中 | trigger model | P0 | `AlembicWorkspace` | 目标 thread heartbeat / 多窗口真实唤醒先完成窗口 thread registry，再等待真实验证时机。 | 是 | 当前只收集 thread id 到本地 ignored runtime，不创建 heartbeat | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 线程登记 | 是 | 后续作为 visible dispatch 目标窗口。 |
| `AlembicCore` | 线程登记 | 是 | 后续作为 visible dispatch 目标窗口。 |
| `AlembicAgent` | 线程登记 | 是 | 后续作为 visible dispatch 目标窗口。 |
| `AlembicDashboard` | 线程登记 | 是 | 后续作为 visible dispatch 目标窗口。 |
| `AlembicPlugin` | 线程登记 | 是 | 后续作为 visible dispatch 目标窗口。 |
| `AlembicTest` | 非测试型线程登记 | 是 | 本轮不做测试交接，只登记可见窗口 thread id，供后续 smoke 选择使用。 |

## 窗口分派

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 本地登记本窗口可见 Codex thread id；执行 register 写入 ignored runtime，登记为 `Alembic`。 |
| `AlembicCore`<br>待启动 | 本地登记本窗口可见 Codex thread id；执行 register 写入 ignored runtime，登记为 `AlembicCore`。 |
| `AlembicAgent`<br>待启动 | 本地登记本窗口可见 Codex thread id；执行 register 写入 ignored runtime，登记为 `AlembicAgent`。 |
| `AlembicDashboard`<br>待启动 | 本地登记本窗口可见 Codex thread id；执行 register 写入 ignored runtime，登记为 `AlembicDashboard`。 |
| `AlembicPlugin`<br>待启动 | 本地登记本窗口可见 Codex thread id；执行 register 写入 ignored runtime，登记为 `AlembicPlugin`。 |
| `AlembicTest`<br>待启动 | 非测试型 thread registry：回填本窗口可见 Codex thread id 到本地 ignored runtime；不做测试交接，不运行真实项目验证。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/visible-automation-dispatch-wave-8-2026-05-26.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

本轮只做 Visible Automation Dispatch 窗口 thread 登记，不改产品代码、不创建 heartbeat、不运行真实项目测试、不领取产品 TODO。AlembicTest 也只作为非测试型可见窗口登记，不创建测试单。

请确认当前 Codex 窗口的 thread id，并只保存到 AlembicWorkspace 本地 ignored runtime，不要写入任何 Git 跟踪文件、当前计划、回填文档或 GitHub。请在 AlembicWorkspace 工作目录执行：

node scripts/visible-dispatch.mjs register --window <你的窗口名> --thread <threadId> --write --json

完成后只回填：窗口名、登记是否成功、命令输出中的 redacted 字段、无法确认 / 无法登记的原因、遗留风险、是否可纳入后续真实多窗口 smoke。不要回填 raw thread id。
```

## 测试交接

- 是否需要 `AlembicTest`：否；本轮 `AlembicTest` 只作为非测试型 thread registry 目标窗口，不创建 `alembic-test-exchange` 测试单。
- 总控自测结论：脚本单测已证明无人值守 payload 包含 claim / finish / next-arm / record-arm / close switch 指令；`mode --disable --write` 后，已 armed payload 醒来也不能继续生成下一跳。
- 需要真实场景的理由：真实多窗口 smoke 仍需要目标窗口 thread id 和用户确认时机，但本轮代码门禁可由总控脚本自测回答。
- 测试前边界与多条件判断：
  - 测试要回答的问题：脚本 payload 是否包含无人值守步骤；关闭模式后是否断开下一跳。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：fixture workspace、fake thread id、visible-dispatch local state；不涉及产品仓库和真实测试项目。
  - 成功能推出的结论：脚本状态机和 close switch 具备；可以进入 thread registry 收集和后续真实 smoke。
  - 失败能推出的结论：脚本状态机或 prompt contract 需返修；不能推出 Codex automation runtime 失败。
  - 不能推出的结论：不能证明所有真实窗口已可无人值守跳转。
  - 停止或不开始条件：若需要真实 thread 投递、Dashboard 手动观察、cold-start 或真实项目证据，后续另开 smoke / 测试任务。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不涉及真实项目；`AlembicTest` 不运行真实项目测试，只本地登记窗口 thread id。

## 回填区

- 2026-05-26 03:07 CST：`visible-dispatch.mjs` 的 heartbeat payload 固定输出 `FREQ=MINUTELY;INTERVAL=1`，并增加无人值守 target prompt：claim 当前任务、finish 后按 `chain.payload` 创建下一跳 heartbeat、record-arm、record-stop；脚本本身仍不直接调用 Codex automation API。
- 2026-05-26 03:07 CST：`mode --disable --write` 明确作为 close switch；新增 disable-after-arm 单测证明 payload 已经 armed 后再关闭模式，目标窗口醒来执行 `finish --chain-next` 也只返回 `modeDisabled`，不生成下一跳 payload。
- 2026-05-26 03:07 CST：`node --test scripts/visible-dispatch.test.mjs` 通过，27 个测试全绿。
- 2026-05-26 03:10 CST：`node scripts/check-script-docs.mjs`、`node scripts/sync-current-plan.mjs --check`、`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 均通过；总控验证覆盖 workspace boundary、docs、dispatch coverage、test boundary、TODO board、task packages、`git diff --check` 和 50 个 workspace script tests。
- 2026-05-26 03:10 CST：已执行 `node scripts/visible-dispatch.mjs mode --disable --write --reason "Wave 8 close switch baseline" --json`，当前 `controller-tick` 返回 `mode=disabled` / `topAction=stopped` / `nextAction=modeDisabled`，不会自动 enqueue、arm 或选择 TODO。
- 2026-05-26 03:18 CST：按用户纠偏，`AlembicTest` 纳入本轮 thread registry 收集，但仍不是测试交接；thread id 只写入本地 ignored runtime `.workspace-local/visible-dispatch/window-registry.json`，不写入 Git 跟踪文档，不提交 GitHub。
- 2026-05-26 11:02 CST：`visible-dispatch register` 已改为 JSON 输出 redacted thread id，raw thread id 仅保存在 ignored runtime；`check-test-boundary` 增加 `AlembicTest` 非测试型 registry-only 例外，普通测试 / 验证任务仍必须有测试单与边界判断。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 8 无人值守 payload 与关闭断链已实现，等待本地线程登记",
  "indexPlanDescription": "Visible Automation Dispatch Wave 8 已补无人值守 heartbeat payload、mode disabled 断链门禁，并派发 Alembic 系列窗口含 AlembicTest 的本地 thread registry 收集任务。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 8 脚本侧已通过总控单测；当前等待 Alembic 系列窗口含 AlembicTest 把可见 Codex thread id 登记到本地 ignored runtime，后续再做真实多窗口 smoke。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 8：无人值守 payload、关闭断链和窗口 thread registry。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 8 已实现 1 分钟 heartbeat 无人值守 payload 和 close switch 断链门禁；当前发送给 Alembic 系列窗口含 AlembicTest 做本地 thread registry 收集，raw thread id 只保存在 ignored runtime，不提交 GitHub。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
