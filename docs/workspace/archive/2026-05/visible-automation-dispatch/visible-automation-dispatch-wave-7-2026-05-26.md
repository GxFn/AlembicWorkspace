# Visible Automation Dispatch Wave 7

日期：2026-05-26
状态：Wave 7 自动化模式脚本联动与旧 runtime 清理已实现
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；只承载目标裁决、窗口分派、TODO 归口、测试交接和验收回填，不承载产品实现。

## 目标判断

- 用户目标：把 Visible Automation Dispatch 明确收敛为一种显式自动化模式；模式开启时，总控可以继续验收、领取新 TODO，并通过脚本生成窗口唤醒 payload；模式关闭时，总控不再验收后自动领取新 TODO，窗口结束脚本也不再生成下一跳唤醒。
- 最终完成定义：`visible-dispatch.mjs` 支持目标窗口在结束时运行 `finish --window <name> --thread <id> --backfill <text> --write --chain-next --json`，完成线程登记、任务完成、证据回填和下一跳 payload 生成；该 payload 只在 `mode --enable --write` 后生成，`mode --disable --write` 后拒绝生成；旧 wave 的 terminal runtime 残留可用 `prune-history --write` 清理；总控验收和 TODO 选择仍由 `controller-tick` / `accept` 的显式循环驱动，不由脚本私自裁决。
- 当前是否已经达到：已达到；新增 `finish` 命令、模式关闭保护和历史残留清理入口，并补脚本单测。
- 未达到时剩余差距：真实 Codex 窗口之间用返回 payload 调起下一窗口仍待后续真实窗口 smoke；本轮只证明脚本状态机和模式门禁。
- 已达到时验收 / 归档判断：Wave 7 可作为 VAD 显式 automation mode 的脚本基线，后续真实窗口 smoke 单独开启。
- 当前任务分区：总控脚本与自动化治理。
- 不纳入本轮事项：不创建真实 heartbeat automation，不派发 `AlembicTest`，不触碰产品仓库，不改真实测试项目，不跑 cold-start，不证明真实窗口已经互相唤醒成功。

## 总控决策记录

- 本次决策触发：用户确认不应依赖追求目标；自动化应作为一种可开关模式，开启时才允许总控持续验收 / 领取 TODO / 调起窗口，关闭时全部停止。
- 需求 / 测试结果理解：这不是让脚本替代总控判断，而是把“调起窗口”变成可由任一窗口使用的工具 payload；脚本只做登记、完成、排队和模式门禁，总控验收、TODO 选择和门禁判断仍需显式循环。
- 已核对证据：Wave 6 `controller-tick`、`arm` / `record-arm` / `claim` / `complete` / `accept` 状态机、脚本流水线规则和用户对 `mode enabled/disabled` 的新边界定义。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认方向；本轮由总控自测脚本即可，不需要真实项目或 `AlembicTest`。
- 本次允许更新：`visible-dispatch.mjs`、`visible-dispatch.test.mjs`、脚本说明、skill 脚本流水线说明、VAD 目标确认路线更新、当前计划和同步状态。
- 本次不得更新：不得直接调用 Codex automation API，不得让脚本接受回填证据，不得让脚本自动创建 / 选择新 TODO，不得派发真实窗口或 Test。

## Design / 需求来源

- 来源类型：用户直接需求 / VAD 主线调整。
- 来源文档：
  - [../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/original-plan-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/requirement-design-2026-05-25.md)
  - [../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md](../../../../requirement-designs/visible-automation-dispatch/code-implementation-dependency-research-2026-05-25.md)
  - [visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md](../../../current/visible-automation-dispatch-goal-stage-confirmation-2026-05-25.md)
- 用户确认状态：用户确认将自动化作为一种模式，开启后自动推进，关闭后停止自动推进。
- 总控接收结论：在 workspace 脚本内实现模式门禁和窗口 finish-chain 工具 payload。
- 是否需要目标阶段确认：不新增；属于已确认 VAD 路线内的实现调整。
- 是否需要代码实现依赖调研：已完成；本轮不需要联网或产品代码调研。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`。
- 关键入口：
  - `scripts/visible-dispatch.mjs`
  - `scripts/visible-dispatch.test.mjs`
  - `.workspace-local/visible-dispatch/`
- producer / consumer 依赖：
  - Producer：当前计划或队列中已存在的 send-eligible task，以及各窗口主动传入的 `--thread` 与 `--backfill`。
  - Consumer：目标窗口可使用 `finish` 返回的 payload 调起下一已排队窗口；总控使用 `controller-tick` 和 `accept` 做验收与下一 TODO 判断。
- 不可提前消费的上游：真实 Codex automation 创建结果仍需由拥有工具的 Codex 窗口执行并用 `record-arm` 记录；脚本自身不能直接调用 automation API。
- 不允许触碰的目录 / 仓库：不写 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 产品源码；不写真实测试项目业务代码。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Wave 6：完成多轮全窗口假 TODO 预飞，暴露真实窗口调起路线不应依赖外部目标模式。
2. Wave 7：把自动化模式与窗口 finish-chain 脚本补齐，并清理旧 terminal runtime 残留。
3. 后续：真实 Codex 窗口 smoke，验证窗口收到 payload 后可创建 automation、claim、finish、record-arm 并继续链路。

- 下一处真实阻塞点：需要真实 Codex 窗口 smoke 才能证明跨窗口互相唤醒的 UI/runtime 行为。
- 阻塞点之前还能做：已完成脚本状态机与模式门禁测试；继续留在脚本 fixture 会变成重复验证。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：Alembic 系列产品仓库均观察；`AlembicTest` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-P7-AUTOMATION-MODE-FINISH-CHAIN | `AlembicWorkspace` | 自动化模式门禁和窗口 finish-chain 脚本 | 已完成 |
| VAD-P7-HISTORY-PRUNE | `AlembicWorkspace` | 旧 wave runtime terminal 残留清理 | 已完成 |

### VAD-P7-AUTOMATION-MODE-FINISH-CHAIN：自动化模式与窗口结束联动

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 02:20 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 02:20 CST

阶段目标：

- 将 VAD 自动化明确实现为可开关模式，并提供目标窗口结束时可运行的脚本入口。

主线动作：

- `visible-dispatch.mjs` 新增 `finish`：登记当前窗口线程、完成任务、写入 backfill，并在 `--chain-next` 下生成下一 queued / registered 窗口的 heartbeat payload。
- `finish --chain-next` 受 `mode` 约束：enabled 才生成下一跳 payload；disabled 只记录完成，不生成调起。
- `controller-tick` 继续作为总控验收 / 领取 TODO 的显式循环入口；脚本不自动接受证据、不自动创建新 TODO。

合并 TODO：

- `VAD-TODO-5`：automation loop 调整为显式 mode loop。
- `VAD-TODO-8`：真实多窗口目标线程调起留后续 smoke，本轮只完成脚本工具边界。

明确不包含：

- 不创建真实 Codex heartbeat。
- 不派发 `AlembicTest`。
- 不触碰产品仓库。
- 不证明真实 Codex UI 跨窗口唤醒已经完成。

下一处真实阻塞点：

- 真实窗口 smoke 需要用户允许开启自动化模式并使用至少两个可见 Codex 窗口。

阻塞点之前还能做：

- 已完成脚本级验证。

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
- 遗留风险：真实窗口间 automation 创建 / 唤醒仍需后续 smoke。
- 下一步建议：由用户决定是否开启 automation mode 做真实双窗口 smoke。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### VAD-P7-HISTORY-PRUNE：旧 runtime 残留清理

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 02:50 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 02:50 CST

阶段目标：

- 清理旧 `追求目标 / controller heartbeat` 路线在当前运行态和活跃说明中的残留，避免后续 controller 判断长期依赖 ignored historic tasks。

主线动作：

- `visible-dispatch.mjs` 新增 `prune-history`：默认 dry-run，`--write` 时只移除非当前计划、terminal 状态且无 active automation run 的历史 queue task，并同步移除对应 stopped run。
- VAD 目标阶段确认新增 2026-05-26 路线更新：追求目标路线只作为历史来源，当前正式路线是显式 automation mode 和窗口 finish-chain。
- 脚本 README / skill reference 补齐 `prune-history` 用法和边界。

合并 TODO：

- `VAD-TODO-5`：旧 automation loop 口径收敛为显式 mode loop。

明确不包含：

- 不删除历史 wave 文档证据。
- 不清理当前计划任务、未验收完成项或仍有 active automation run 的历史项。
- 不调用真实 Codex automation API。

下一处真实阻塞点：

- 真实窗口 smoke 仍需要用户显式开启 automation mode。

阻塞点之前还能做：

- 已完成脚本级 prune dry-run / write 测试和当前本地 runtime 清理。

验证命令：

```text
node --test scripts/visible-dispatch.test.mjs
node scripts/visible-dispatch.mjs prune-history --json
node scripts/visible-dispatch.mjs prune-history --write --json
node scripts/visible-dispatch.mjs controller-tick --json
node scripts/check-script-docs.mjs
node scripts/sync-current-plan.mjs --check
node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests
```

回填要求：

- 完成范围：已在回填区记录。
- 提交 hash：workspace 文档 / 脚本待总控统一提交。
- 验证命令和结果：已在回填区记录。
- 遗留风险：真实多窗口 smoke 仍待后续专项。
- 下一步建议：本轮不再创建旧 heartbeat / 追求目标路径。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和脚本流水线 skill reference。
- 清理前先 dry-run，确认只命中旧 terminal runtime 残留后再 `--write`。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VAD-TODO-5 | 部分完成 | automation loop | P0 | `AlembicWorkspace` | 自动化模式脚本循环已具备；真实窗口 smoke 待后续。 | 是 | 需要用户开启 automation mode 并准备目标窗口 | `AlembicWorkspace` |
| VAD-TODO-8 | 已裁决为后续 | trigger model | P0 | `AlembicWorkspace` | 目标 thread heartbeat / 多窗口真实唤醒留后续专项。 | 是 | 本轮只做脚本工具与门禁 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 本轮只改 workspace 总控脚本。 |
| `AlembicCore` | 无任务 | 否 | 无 shared contract 改动。 |
| `AlembicAgent` | 无任务 | 否 | 不改 Agent runtime / prompt。 |
| `AlembicDashboard` | 无任务 | 否 | 第一版无 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 不做 MCP / plugin 沉淀。 |
| `AlembicTest` | 无任务 | 否 | 本轮验证由总控脚本 fixture 完成，不需要真实项目、cold-start、Dashboard 手动观察或跨仓库环境证据。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 后续可作为 visible dispatch 目标窗口；Wave 7 不发送。 |
| `AlembicCore`<br>无任务 | 无 shared contract 改动。 |
| `AlembicAgent`<br>无任务 | 不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | 第一版无 UI。 |
| `AlembicPlugin`<br>无任务 | 不做插件化沉淀。 |
| `AlembicTest`<br>无任务 | 总控自测即可回答本轮问题。 |
| `BiliDili`<br>无任务 | 不作为自动化派发目标，不改真实项目源码。 |

## 可复制提示词

发送给：无

当前无窗口需要发送提示词。后续真实 smoke 时再生成目标窗口提示词。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：`finish` 可登记当前线程、完成任务、生成下一 queued / registered 窗口 payload；mode disabled 时拒绝生成下一跳 payload。
- 需要真实场景的理由：无；本轮只验证 workspace 脚本状态机和模式门禁。
- 测试前边界与多条件判断：
  - 测试要回答的问题：自动化模式是否能控制总控循环和窗口 finish-chain payload；关闭模式后是否停止自动推进。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：临时 fixture workspace、fake thread ids、ignored runtime state；不涉及真实 Codex thread 或真实项目。
  - 成功能推出的结论：脚本级自动化模式门禁可用；可以进入后续真实窗口 smoke。
  - 失败能推出的结论：脚本状态机或 mode 门禁需返修；不能推出 Codex automation UI 失败。
  - 不能推出的结论：不能证明真实多窗口可见唤醒已成功。
  - 停止或不开始条件：若需要真实 thread 投递、Dashboard 手动观察、cold-start 或真实项目证据，另开专项。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不涉及真实项目。

## 回填区

- 2026-05-26 02:20 CST：`visible-dispatch.mjs` 新增 `finish` 命令，支持目标窗口传入 `--window` / `--thread` / `--backfill`，完成任务并在 `--chain-next` 下生成下一 queued / registered 窗口 payload。
- 2026-05-26 02:20 CST：`finish --chain-next` 已接入 mode 门禁：`mode=enabled` 时可生成下一跳 payload，`mode=disabled` 时只记录完成并返回 `nextAction=modeDisabled`。
- 2026-05-26 02:20 CST：`visible-dispatch.test.mjs` 新增 finish-chain、缺少目标线程、mode disabled 三个覆盖场景；后续补 `prune-history` 覆盖后，`node --test scripts/visible-dispatch.test.mjs` 通过，26 个测试全绿。
- 2026-05-26 02:22 CST：`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过；包含 workspace boundary、repo status、workspace docs、script docs、current plan sync、decision preflight、current layout、dispatch coverage、test boundary、TODO board、task packages、`git diff --check` 和 48 个 workspace script tests。
- 2026-05-26 02:50 CST：`visible-dispatch.mjs` 新增 `prune-history`，用于清理旧 wave terminal queue residue；默认 dry-run，`--write` 只删除非当前计划、`accepted` / `rejected` / `blocked` 且无 active automation run 的历史任务，并移除对应 stopped automation run。
- 2026-05-26 02:50 CST：VAD 目标阶段确认已补 2026-05-26 路线更新：旧“追求目标 / controller heartbeat 常驻”不再是当前操作路径；当前正式路线是显式 automation mode 和窗口 finish-chain。
- 2026-05-26 02:52 CST：真实本地 runtime 执行 `node scripts/visible-dispatch.mjs prune-history --write --json`，清理旧 `visible-automation-dispatch-wave-4-2026-05-26__AlembicTest` blocked task 和 stopped automation run `vad-p4-alembictest-heartbeat`；随后 `controller-tick` 不再需要依赖 ignored historic task 过滤。
- 2026-05-26 02:55 CST：`node scripts/verify-control-center.mjs --require-todo --require-task-packages --with-script-tests` 通过；当前计划同步、dispatch coverage、TODO board、2 个任务包、`git diff --check` 和 49 个 workspace script tests 均通过。

<!-- workspace-sync
{
  "status": "Visible Automation Dispatch Wave 7 自动化模式脚本联动与旧 runtime 清理已实现",
  "indexPlanDescription": "Wave 7 将 VAD 收敛为显式 automation mode：开启时允许总控验收 / 领取 TODO 循环和窗口 finish-chain 调起，关闭时停止自动推进，并提供旧 terminal runtime 残留清理。",
  "indexStatusDescription": "Visible Automation Dispatch Wave 7 已实现自动化模式门禁、窗口 finish-chain 和旧 runtime 清理脚本，脚本单测覆盖 mode enabled / disabled / prune-history。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch Wave 7：automation mode、窗口 finish-chain 与旧 runtime 清理。",
  "currentStatusSummary": "Visible Automation Dispatch Wave 7 已实现自动化模式门禁：mode enabled 才允许总控验收 / 领取 TODO 循环和窗口 finish-chain 调起；mode disabled 停止自动推进；旧 wave terminal runtime residue 可用 prune-history 清理。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
