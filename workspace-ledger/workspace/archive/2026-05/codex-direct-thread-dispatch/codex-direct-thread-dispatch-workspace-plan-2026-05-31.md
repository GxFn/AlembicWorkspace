# Codex Direct Thread Dispatch Workspace Plan

日期：2026-05-31
状态：Stage 5 legacy runtime cleanup 已完成 / direct-thread automation 主线完成
发送给：无
总控定位：本文件是 AlembicWorkspace 对 `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31` 的接收、阶段目标和文档落实计划；它只承载总控判断、账本、文档契约和后续实现边界，不直接修改产品仓库。

## 目标判断

- 用户目标：领取 `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31` 并开始推进；基于 Codex 已支持直接向窗口线程投递提示词，将旧 1 分钟 automation 投递改为 direct thread dispatch，并把线程投递视为正常工作流水线。
- 最终完成定义：Codex Automation Closed Loop 的普通 target fan-out 和 controller-return 只走 direct thread dispatch；旧投递路线从 active contract 中清理；thread id 仍只保存在 `.workspace-local/`；direct send 成败有 delivery log / thread readback 证据；真实两窗口 smoke 证明目标线程收到并处理，且普通路径不创建旧 1 分钟 automation；用户明确开启无人值守自动化时进入 continuous / infinite loop，并启用 keep-live 支撑。
- 当前是否已经达到：功能完成定义已达到。Design 已完成需求设计、代码事实复核和 host thread-send probe；总控已完成 direct-thread 文档契约、子窗口文件配置设计、脚本 runtime contract、target direct smoke、controller-return 回跳当前总控线程 smoke、automation-enabled continuous + keep-live bounded smoke，以及 legacy runtime cleanup。host `send_message_to_thread` 投递、`read_thread` / 当前线程回读、`TargetResultEnvelope`、`ControllerReturnEnvelope`、`DirectThreadDeliveryRun`、keep-live state 和 stop marker 均在测试时生成并复核；按用户裁决，历史 runtime 记录已删除，不作为长期证据保留。
- 未达到时剩余差距：无功能缺口，无 cleanup 阻塞。
- 已达到时验收 / 归档判断：线程投递和自动化主链路可验收；当前可进入归档 / 提交整理。
- 当前任务分区：Design 交接接收 + 规则治理 / skill 治理 + workspace 脚本实现。
- 不纳入本轮事项：不启动长期无人值守 automation；不派产品仓库；不写 raw thread id 到 tracked 文档；不把 direct delivery success 单独当成目标任务完成。已完成的真实投递证明 target direct-thread transport、controller-return current-thread transport 和 bounded continuous automation + keep-live exit 可用。

## 总控决策记录

- 本次决策触发：用户要求“领取 `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31` 开始推进”。
- 需求 / 测试结果理解：这不是新总控派发协议，也不是恢复旧 VAD；它只替换 delivery transport 路径。直接线程投递应位于 delivery adapter 层，继续保留 dispatch packet / delivery envelope / target result envelope / controller review 分层；用户已裁决不再保留旧投递路线，并补充 automation-enabled 时应按持续闭环推进且开启 keep-live。
- 已核对证据：Design handoff board confirmed；original-plan / requirement-design / code-fact-review 已读取；import-design-handoffs 对本需求已导入，另一个无关 handoff 缺字段导致整体返回失败但不影响本需求接收。
  - `AlembicDesign/docs/current/workspace-handoff-board.md`：条目为 `ready-for-workspace`，用户确认状态 `confirmed`，下一步建议总控接收。
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-original-plan-2026-05-31.md`
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-requirement-design-2026-05-31.md`
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-code-fact-review-2026-05-31.md`
  - `scripts/import-design-handoffs.mjs --write` 已更新 inbox，但因无关 `REPOSITORY-RESIDUE-CLEANUP-2026-05-31` 缺 original-plan / confirmation 整体返回失败；该校验问题不来自本需求。
- 是否需要先验证 / 重新计划 / 用户确认：不需要额外确认即可实现 workspace 内 v2 runtime contract；真实线程投递 smoke 前需确认目标窗口和投递内容边界。
- 本次允许更新：当前计划、global TODO、workspace index/status、README、AGENTS 源文件、automation target/controller skills、control-workspace governance references、scripts README、`codex-automation-loop.mjs` 及其聚焦测试。
- 本次不得更新：产品源码、`.workspace-local` raw thread id、Codex Desktop 真实线程、真实 automation runtime、AlembicTest 测试单。

## Design / 需求来源

- 来源类型：DesignWindow handoff。
- 来源文档：
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-original-plan-2026-05-31.md`
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-requirement-design-2026-05-31.md`
  - `AlembicDesign/docs/current/codex-direct-thread-dispatch-automation-code-fact-review-2026-05-31.md`
- 用户确认状态：`confirmed`
- 用户确认说明：用户要求检查当前自动化无人值守逻辑，基于 Codex 直接线程投递能力，把自动化旧 1 分钟投递换成直接线程投递并新建需求；Design 后续记录用户进一步确认先落实文档，不直接改代码；用户随后裁决旧投递路线可以直接清理，不再作为备用设计；用户进一步确认线程投递是正常工作流水线，自动化开启时走 continuous / infinite loop 并启用 keep-live。
- handoff 状态：`ready-for-workspace`
- 主线关系状态：`todo-candidate / automation-flow-optimization`
- 优先级枚举：`P1`
- 总控接收结论：正式接收为当前 workspace 自动化 transport 文档治理计划。第一轮只把 Stage 0 baseline 和 direct-thread-first contract 写入总控账本与说明资产；脚本实现后置。
- 是否需要目标阶段确认：需要。本文先确认文档阶段；代码阶段需另行把 adapter 入口、direct fail-closed 行为、keep-live support 和 smoke 边界写清。
- 是否需要代码实现依赖调研：Design 已完成初步复核；`codex-automation-loop.mjs` 已进入 v2 runtime contract 实现；后续真实 smoke 前仍需针对 host thread-send adapter 操作边界和 readback evidence 口径做执行前复核。

## 代码事实与边界

- 相关仓库：
  - `codex-control-workspace`：主归属，当前只改文档 / skills / references。
  - `AlembicDesign`：来源文档，不由总控改状态。
  - `AlembicTest-IDE`：后续真实 two-window smoke 候选，当前不创建测试单。
- 关键入口：
  - `codex-control-workspace/scripts/codex-automation-loop.mjs`
  - `codex-control-workspace/scripts/codex-automation-loop.test.mjs`
  - `codex-control-workspace/skills/dev/codex-automation-target/SKILL.md`
  - `codex-control-workspace/skills/dev/codex-automation-controller/SKILL.md`
  - `codex-control-workspace/skills/dev/control-workspace-governance/references/codex-automation-loop.md`
  - `codex-control-workspace/skills/dev/control-workspace-governance/references/control-architecture.md`
  - `codex-control-workspace/README.md`
  - `codex-control-workspace/AGENTS.md`
- producer / consumer 依赖：总控计划生产 dispatch packet；delivery adapter 消费 registry thread id 和 delivery envelope；target thread 执行；target result envelope 回到总控 review。
- 不可提前消费的上游：没有真实 registered thread id 不得 direct dispatch；没有 direct delivery run 证据不得把投递写成已送达；没有 target result envelope 不得验收任务。
- 不允许触碰的目录 / 仓库：不改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicPlugin 产品源码；不改 AlembicTest 测试资产；不把 thread id 写进 tracked 文档。
- 真实测试项目是否涉及：不涉及。

## 阶段顺序

1. Stage 0：接收 Design baseline 并落实文档契约。将 direct-thread-only / busy steer / thread id local-only / fail-closed / automation keep-live 写入当前计划、README、AGENTS、skills 和 references，并清理 active contract 中的旧投递口径。已完成。
2. Stage 1：Subwindow file configuration contract。明确 `thread-registry` v2、derived `window-config`、v2 direct `DeliveryEnvelope`、`delivery-runs`、keep-live state、redaction、legacy runtime cleanup 和 tests。已完成。
3. Stage 2：Runtime contract implementation。在 `codex-automation-loop.mjs` 中实现 v2 registry 兼容读写、window-config 生成、direct delivery envelope、controller return direct envelope、delivery-run 记录、keep-live state、direct-only skill 命令和聚焦测试。已完成聚焦验证。
4. Stage 3：Host direct-send smoke。Stage 3A target direct-thread 已通过：`AlembicWorkspace -> AlembicTest-IDE` 投递和回读 ACK 成功；Stage 3B controller-return current-thread 已通过：`AlembicTest-IDE -> AlembicWorkspace` 回跳当前总控线程成功，且没有创建下一跳。
5. Stage 4：Continuous automation loop smoke。已通过：automation-enabled delivery envelope 标记 `continuousLoop=true` / `keepLive=true`；`AlembicTest-IDE` 写入 `TargetResultEnvelope` 并生成 `ControllerReturnEnvelope`；总控收到回跳后复核 `review-results`，因无 eligible next task 写入 keep-live stopped 和 stop marker，不创建下一跳。
6. Stage 5：Legacy runtime cleanup。已按用户裁决清理历史运行记录：删除 `.workspace-local/codex-automation-loop` 下的 dispatch packets、delivery envelopes、delivery runs、target results、prompts、keep-live state、stop marker 和旧一次性 `AlembicTest-IDE039` thread registry；保留当前职责窗口 thread registry 与 window-config。

- 下一处真实阻塞点：无功能阻塞；只剩提交 / 归档整理。
- 阻塞点之前还能做：跑全量 workspace 脚本校验、同步当前计划和根 AGENTS。
- 当前可派发窗口：无；本轮总控自执行文档治理。
- 当前阻塞 / 观察窗口：`AlembicTest-IDE` 观察，后续 smoke 候选。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| CDTDA-STAGE0-DOCS-P0 | `AlembicWorkspace` | 接收 Design baseline，更新当前计划 / TODO / README / AGENTS / skills / references，统一 direct-thread-only 文档契约 | 已完成 / 总控自验通过 |
| CDTDA-STAGE1-CONFIG-DESIGN-P0 | `AlembicWorkspace` | 设计子窗口本地文件配置：thread registry v2、window-config、direct delivery envelope v2、delivery-runs、keep-live state 和旧 runtime 清理边界 | 已完成 / 总控自验通过 |
| CDTDA-STAGE2-RUNTIME-P0 | `AlembicWorkspace` | 实现 v2 runtime contract：registry v2 兼容、window-config、direct DeliveryEnvelope、controller return direct、delivery-run evidence、keep-live state、direct-only skill 命令和聚焦测试 | 已完成 / 聚焦测试通过 |
| CDTDA-STAGE3A-TARGET-SMOKE-P0 | `AlembicWorkspace` | 基于真实 Codex Desktop thread 工具向 `AlembicTest-IDE` 投递 direct-thread smoke，并记录 delivery-run readback evidence | 已完成 / ACK 回读通过 |
| CDTDA-STAGE3B-CONTROLLER-RETURN-P0 | `AlembicWorkspace` | 基于真实 Codex Desktop thread 工具回跳当前总控线程，验证 controller-return loopGuard 和无 eligible task 时不创建下一跳 | 已完成 / 当前线程回跳通过 |
| CDTDA-STAGE4-CONTINUOUS-SMOKE-P0 | `AlembicWorkspace` | 基于真实 Codex Desktop thread 工具运行 automation-enabled bounded continuous smoke，验证 keep-live state、target result、controller-return 和 no eligible task 退出 | 已完成 / bounded automation smoke 通过 |
| CDTDA-STAGE5-RUNTIME-CLEANUP-P0 | `AlembicWorkspace` | 按用户裁决删除旧 automation runtime 历史记录，保留当前 thread registry / window-config 配置 | 已完成 / runtime 计数归零 |

### CDTDA-STAGE0-DOCS-P0：Direct Thread 文档契约

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:05 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:18 CST

阶段目标：

- 在不改脚本实现的前提下，把当前正式自动化文档口径从旧 1 分钟 automation 默认改为 direct-thread only。

主线动作：

- 正式写入 global TODO 与当前计划。
- 更新 README 的 Closed Loop 说明。
- 更新 AGENTS 源文件中的自动化边界和默认 delivery 口径，并同步 root `AGENTS.md`。
- 更新 `codex-automation-target` / `codex-automation-controller` skill 文案。
- 更新 governance references 的 layer、command 和 automation class 说明。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：direct thread dispatch automation。

明确不包含：

- 不改 `scripts/codex-automation-loop.mjs`。
- 不新增 transport enum / delivery-runs 代码。
- 不运行真实 direct dispatch smoke。
- 不派产品窗口。

下一处真实阻塞点：

- 后续代码阶段需要先确定 adapter 真实调用入口、fail-closed 记录口径与旧 runtime 清理边界。

阻塞点之前还能做：

- 文档和 skill contract 落地、同步根 AGENTS、运行文档校验。

验证命令：

```text
node scripts/verify-control-center.mjs
node scripts/sync-current-plan.mjs --plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --check --json
```

回填要求：

- 完成范围：
- 新增 / 修改的配置契约文件：
- 不进入 tracked 文档的本地 runtime 字段：
- 后续代码实现 checklist：
- 验证命令和结果：
- 未实现代码边界：

回填要求：

- 完成范围：
- 改动文件：
- 验证命令和结果：
- 未实现代码边界：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 Design 来源文档。
- 开始执行前先明确声明本轮只做 workspace 文档 / skill 资产治理，不做产品实现和脚本实现。

### CDTDA-STAGE1-CONFIG-DESIGN-P0：子窗口文件配置契约

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:27 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:27 CST

阶段目标：

- 在不改脚本实现的前提下，把后续代码阶段所需的子窗口本地文件配置设计完整，避免实现阶段继续临时拼字段。

主线动作：

- 新增 direct thread 子窗口配置 reference。
- 明确 `workspace.config.json`、`.workspace-local/workspace.config.json`、`thread-registry`、`window-config`、`delivery-envelopes`、`delivery-runs`、`target-results`、`keep-live/state.json` 和 `stop.json` 的 owner / tracked 边界。
- 设计 `CodexWindowThreadRegistration` v2、`CodexSubwindowDispatchConfig`、direct-thread `DeliveryEnvelope` v2、`DirectThreadDeliveryRun` 和 `AutomationKeepLiveState` 字段。
- 写清 v1 thread registry compatibility、raw thread id redaction、keep-live 层级、legacy schedule / codexAutomation 禁止项和实现 checklist。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：子窗口文件配置 contract。

明确不包含：

- 不改 `scripts/codex-automation-loop.mjs`。
- 不创建 `.workspace-local` 新 runtime 文件。
- 不登记 / 替换真实 thread id。
- 不运行 direct dispatch。

下一处真实阻塞点：

- 代码阶段需要实现 v2 runtime 文件读写、direct send adapter、keep-live state 管理和 legacy envelope 清理策略。

阻塞点之前还能做：

- 当前文档设计已完成；可以进入代码实现任务包设计或直接由总控在 `codex-control-workspace` 内改脚本。

验证命令：

```text
node scripts/verify-control-center.mjs
node scripts/sync-current-plan.mjs --plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --check --json
```

回填要求：

- 完成范围：
- 新增 / 修改的配置契约文件：
- 不进入 tracked 文档的本地 runtime 字段：
- 后续代码实现 checklist：
- 验证命令和结果：
- 未实现代码边界：

### CDTDA-STAGE2-RUNTIME-P0：Direct Thread Runtime Contract

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:35 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:43 CST

阶段目标：

- 在 `codex-control-workspace` 内实现 direct-thread 子窗口文件配置和 delivery evidence 的脚本级 runtime contract，但不启动真实线程投递。

主线动作：

- `register-thread` 写入 `CodexWindowThreadRegistration` v2，并兼容旧 registry 读取。
- 新增 `build-window-config`，生成 `CodexSubwindowDispatchConfig`。
- `build-delivery` / `build-controller-return` 输出 v2 direct-thread envelope，删除公开 `schedule` / `codexAutomation` 路径，不输出 raw thread id。
- 新增 `record-delivery-run` 记录 host send/readback evidence。
- 新增 `keep-live-state` 记录无人值守运行支撑状态。
- 更新 controller / target skill，命令示例改为 direct-thread + delivery-run / keep-live 口径。
- 更新 dispatch / test boundary 聚焦测试中的旧 heartbeat smoke 口径。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：代码层 runtime contract。

明确不包含：

- 不实际调用 host thread-send 工具。
- 不登记或替换真实 thread id。
- 不启动 automation / keep-live 进程。
- 不清理历史 `.workspace-local` runtime 数据。

下一处真实阻塞点：

- 真实 two-window smoke 需要选择目标线程并记录 host send/readback evidence；未做前不能宣称最终完成。

阻塞点之前还能做：

- 跑全量 workspace 校验并同步当前状态。

验证命令：

```text
node --test scripts/codex-automation-loop.test.mjs
node --test scripts/check-dispatch-coverage.test.mjs scripts/check-test-boundary.test.mjs
```

回填要求：

- 完成范围：
- 代码 / skill / reference 改动：
- 验证命令和结果：
- 真实 smoke 未完成边界：

### CDTDA-STAGE3A-TARGET-SMOKE-P0：Target Direct Thread Smoke

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 21:55 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:06 CST

阶段目标：

- 用真实 Codex Desktop thread 工具验证 v2 delivery envelope 可以把最小 smoke prompt 投递到已登记的 `AlembicTest-IDE` 职责窗口，并通过 readback 看到目标线程处理结果。

主线动作：

- 修复 legacy `deliveryRole` 值兼容：读取旧 registry 中的职责名时归一化为 `test-target` / `design` / `controller` / `target`。
- 为 `AlembicTest-IDE` 生成 `CodexSubwindowDispatchConfig`，确认 `dispatchable=true`、`deliveryRole=test-target`、thread id redacted。
- 创建 `CDTDA-SMOKE-002` dispatch packet 和 v2 direct `DeliveryEnvelope`。
- 使用 Codex Desktop `send_message_to_thread` 投递 smoke prompt，并用 `read_thread` 回读 `DIRECT_THREAD_SMOKE_ACK CDTDA-SMOKE-002 AlembicTest-IDE`。
- 使用 `record-delivery-run` 写入 `DirectThreadDeliveryRun`，证据只记录 host action/readback 摘要，不写 raw thread id。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：target direct-thread smoke。

明确不包含：

- 不启动 automation。
- 不运行测试。
- 不修改 `AlembicTest` 文件。
- 不验证 controller-return direct path。
- 不验证 continuous automation loop。

下一处真实阻塞点：

- 已由 Stage 3B 解除；剩余阻塞转为 continuous automation + keep-live smoke 边界。

阻塞点之前还能做：

- 当前阶段已完成；不要为本 smoke 创建下一跳。后续只能在用户确认 continuous automation + keep-live smoke 边界后继续。

验证命令 / 证据：

```text
node scripts/codex-automation-loop.mjs build-window-config --window AlembicTest-IDE --busy-policy append-if-steerable --require-thread --write --json
node scripts/codex-automation-loop.mjs create-dispatch --target-window AlembicTest-IDE --task-id CDTDA-SMOKE-002 --group CDTDA-SMOKE-20260531 --control-plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --objective "Direct-thread delivery smoke only" --prompt-file /private/tmp/cdtda-smoke-prompt.txt --evidence "thread readback ack" --write --json
node scripts/codex-automation-loop.mjs build-delivery --packet-file .workspace-local/codex-automation-loop/dispatch-packets/CDTDA-SMOKE-20260531__AlembicTest-IDE__CDTDA-SMOKE-002.json --require-thread --busy-policy append-if-steerable --write --json
codex_app.send_message_to_thread -> codex_app.read_thread observed ACK
node scripts/codex-automation-loop.mjs record-delivery-run --delivery-file .workspace-local/codex-automation-loop/delivery-envelopes/delivery-CDTDA-SMOKE-20260531__AlembicTest-IDE__CDTDA-SMOKE-002.json --status sent --readback-ok true --evidence "codex_app send_message_to_thread returned target thread; read_thread observed final ack: DIRECT_THREAD_SMOKE_ACK CDTDA-SMOKE-002 AlembicTest-IDE" --write --json
```

回填要求：

- 目标窗口：
- delivery-run 文件：
- readback ACK：
- 未验证边界：

### CDTDA-STAGE3B-CONTROLLER-RETURN-P0：Controller Return Current Thread Smoke

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:20 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:33 CST

阶段目标：

- 按用户裁决用真实当前总控线程测试 controller-return，不新开 controller-test 窗口，并验证没有 eligible task 时不继续跳。

主线动作：

- 设计并实现 controller-return `loopGuard`：`noEligibleTaskAction=stop-without-next-delivery`、`repeatControllerReturnForbidden=true`、next dispatch 仅限当前计划仍有 eligible unfinished task / evidence 需要 rework / 用户批准的 unattended automation 边界内。
- 修复真实流程断点：`build-controller-return` 默认先检查 `review-results`，若 group 仍有 missing result，fail closed，不生成回跳。
- 用干净 group `CDTDA-RETURN-SMOKE-20260531` 先投递 target leg 到 `AlembicTest-IDE`，回读 `DIRECT_THREAD_RETURN_TARGET_ACK CDTDA-RETURN-SMOKE-001 AlembicTest-IDE`。
- 写入 `TargetResultEnvelope` 后 `review-results` 返回 `needs-controller-review`。
- 生成 `ControllerReturnEnvelope` v2，投递到现有 `AlembicWorkspace` 总控线程；当前线程收到 `codex_delegation`，并按 loop guard 停止，不创建下一跳。
- 记录 controller-return `DirectThreadDeliveryRun`，证据只写到本地 runtime，tracked 文档不写 raw thread id。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：controller-return current-thread smoke。

明确不包含：

- 不启动 automation。
- 不验证 continuous / infinite loop。
- 不运行 keep-live 进程。
- 不清理旧 runtime。

下一处真实阻塞点：

- continuous automation + keep-live smoke 要单独设定目标、stop condition 和最大轮次 / 无任务退出边界。

阻塞点之前还能做：

- 本阶段已完成；不要为本 smoke 创建下一跳。后续只能在用户确认 continuous automation + keep-live smoke 边界后继续。

验证命令 / 证据：

```text
node scripts/codex-automation-loop.mjs review-results --group CDTDA-RETURN-SMOKE-20260531 --json
node scripts/codex-automation-loop.mjs build-controller-return --group CDTDA-RETURN-SMOKE-20260531 --last-completed-target AlembicTest-IDE --last-task-id CDTDA-RETURN-SMOKE-001 --control-plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --return-reason smoke --require-thread --write --json
codex_app.send_message_to_thread -> current AlembicWorkspace thread received controller-return codex_delegation
node scripts/codex-automation-loop.mjs record-delivery-run --delivery-file .workspace-local/codex-automation-loop/delivery-envelopes/controller-return-CDTDA-RETURN-SMOKE-20260531__AlembicTest-IDE__CDTDA-RETURN-SMOKE-001.json --status sent --readback-ok true --evidence "controller-return arrived in current AlembicWorkspace thread as codex_delegation for CDTDA-RETURN-SMOKE-20260531 / CDTDA-RETURN-SMOKE-001" --write --json
node --test scripts/codex-automation-loop.test.mjs
```

回填要求：

- controller-return delivery-run 文件：
- review-results 结论：
- no-next-hop 裁决：
- 未验证边界：

### CDTDA-STAGE4-CONTINUOUS-SMOKE-P0：Bounded Continuous Automation Smoke

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:50 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 22:56 CST

阶段目标：

- 在真实 Codex Desktop thread 工具下验证 automation-enabled direct-thread delivery、target result、controller-return、keep-live state 和无 eligible task 退出，不新开窗口、不启动不可控无限循环。

主线动作：

- 写入 keep-live state：`status=running` / `mechanism=manual`，证明 automation-enabled run 的 keep-live 支撑层可记录。
- 生成 `CDTDA-CONTINUOUS-SMOKE-20260531` dispatch packet 和 automation-enabled direct `DeliveryEnvelope`，其中 `continuousLoop=true`、`keepLive=true`、`oneShot=true`。
- 使用 Codex Desktop `send_message_to_thread` 投递到既有 `AlembicTest-IDE` 职责窗口。
- `AlembicTest-IDE` 按 target skill 写入 completed `TargetResultEnvelope`，运行 `review-results` 并生成 `ControllerReturnEnvelope`，不发送 target 下一跳。
- 总控复核 `review-results` 为 `needs-controller-review`、`missing=[]`、`blocked=[]`；读取 controller-return `loopGuard`，确认 `noEligibleTaskAction=stop-without-next-delivery` 且 `repeatControllerReturnForbidden=true`。
- 使用 Codex Desktop `send_message_to_thread` 将 controller-return 回投当前总控线程；当前总控线程收到 `codex_delegation`。
- 记录 target delivery-run 和 controller-return delivery-run，均为 direct-thread 且 raw thread id redacted。
- 写入 keep-live `status=stopped` 和 `stop-loop` marker；因本 smoke 没有 eligible next task，不创建下一批 dispatch。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：continuous automation + keep-live smoke。

明确不包含：

- 不启动长期无人值守 automation。
- 不派产品仓库。
- 不修改 `AlembicTest` 文件。
- 不清理历史 `.workspace-local` runtime。

下一处真实阻塞点：

- 旧 runtime 清理需要独立裁决；当前线程投递和自动化主链路没有功能阻塞。

阻塞点之前还能做：

- 跑全量 workspace 脚本校验、同步当前计划和根 AGENTS。

验证命令 / 证据：

```text
node scripts/codex-automation-loop.mjs keep-live-state --automation-run-id CDTDA-CONTINUOUS-SMOKE-20260531 --status running --mechanism manual --write --json
node scripts/codex-automation-loop.mjs create-dispatch --target-window AlembicTest-IDE --task-id CDTDA-CONTINUOUS-SMOKE-001 --group CDTDA-CONTINUOUS-SMOKE-20260531 --control-plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --objective "Continuous automation direct-thread smoke with keep-live and no-task exit" --prompt-file /private/tmp/cdtda-continuous-smoke-prompt-20260531.txt --evidence "TargetResultEnvelope plus controller-return envelope plus current controller readback" --write --json
node scripts/codex-automation-loop.mjs build-delivery --packet-file .workspace-local/codex-automation-loop/dispatch-packets/CDTDA-CONTINUOUS-SMOKE-20260531__AlembicTest-IDE__CDTDA-CONTINUOUS-SMOKE-001.json --return-route controller --automation-enabled --require-thread --busy-policy append-if-steerable --write --json
codex_app.send_message_to_thread -> AlembicTest-IDE readback observed DIRECT_THREAD_CONTINUOUS_TARGET_ACK CDTDA-CONTINUOUS-SMOKE-001 AlembicTest-IDE
node scripts/codex-automation-loop.mjs review-results --group CDTDA-CONTINUOUS-SMOKE-20260531 --json
codex_app.send_message_to_thread -> current AlembicWorkspace thread received controller-return codex_delegation
node scripts/codex-automation-loop.mjs keep-live-state --automation-run-id CDTDA-CONTINUOUS-SMOKE-20260531 --status stopped --mechanism manual --write --json
node scripts/codex-automation-loop.mjs stop-loop --reason "CDTDA continuous smoke completed: target result and controller-return evidence accepted; no eligible next task, stop without next delivery" --write --json
```

本地 runtime 证据（测试时已生成并复核；随后按 Stage 5 cleanup 删除，不再长期保留）：

- target delivery-run：`.workspace-local/codex-automation-loop/delivery-runs/run-delivery-CDTDA-CONTINUOUS-SMOKE-20260531__AlembicTest-IDE__CDTDA-CONTINUOUS-SMOKE-001.json`
- target result：`.workspace-local/codex-automation-loop/target-results/AlembicTest-IDE__CDTDA-CONTINUOUS-SMOKE-001.json`
- controller-return envelope：`.workspace-local/codex-automation-loop/delivery-envelopes/controller-return-CDTDA-CONTINUOUS-SMOKE-20260531__AlembicTest-IDE__CDTDA-CONTINUOUS-SMOKE-001.json`
- controller-return delivery-run：`.workspace-local/codex-automation-loop/delivery-runs/run-controller-return-CDTDA-CONTINUOUS-SMOKE-20260531__AlembicTest-IDE__CDTDA-CONTINUOUS-SMOKE-001.json`
- keep-live state：`.workspace-local/codex-automation-loop/keep-live/state.json`
- stop marker：`.workspace-local/codex-automation-loop/stop.json`

回填要求：

- target delivery-run 文件：
- TargetResultEnvelope 文件：
- controller-return delivery-run 文件：
- keep-live start / stop 证据：
- no-next-hop 裁决：
- 未验证边界：

### CDTDA-STAGE5-RUNTIME-CLEANUP-P0：Legacy Runtime Cleanup

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 23:02 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-31 23:04 CST

阶段目标：

- 按用户裁决删除旧 runtime 历史信息；功能不依赖保留历史记录，避免旧 packet / envelope / result 干扰后续 `review-results` 判断。

主线动作：

- 清空 `.workspace-local/codex-automation-loop/dispatch-packets`。
- 清空 `.workspace-local/codex-automation-loop/delivery-envelopes`。
- 清空 `.workspace-local/codex-automation-loop/delivery-runs`。
- 清空 `.workspace-local/codex-automation-loop/target-results`。
- 清空 `.workspace-local/codex-automation-loop/prompts`。
- 删除 `.workspace-local/codex-automation-loop/keep-live/state.json`。
- 删除 `.workspace-local/codex-automation-loop/stop.json`。
- 删除旧一次性窗口登记 `.workspace-local/codex-automation-loop/thread-registry/AlembicTest-IDE039.json`。
- 保留当前职责窗口 thread registry 和 window-config，以保证后续 direct-thread delivery 仍可直接使用。

合并 TODO：

- `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`：legacy runtime cleanup。

明确不包含：

- 不删除当前职责窗口 thread registry。
- 不删除 window-config。
- 不改产品仓库。

下一处真实阻塞点：

- 无功能阻塞；只剩提交 / 归档整理。

阻塞点之前还能做：

- 跑全量 workspace 脚本校验、同步当前计划和根 AGENTS。

验证命令 / 证据：

```text
node scripts/codex-automation-loop.mjs status --json
```

验证结果：

- `packetCount=0`
- `deliveryCount=0`
- `deliveryRunCount=0`
- `resultCount=0`
- `registeredThreadCount=9`
- `windowConfigCount=2`
- `keepLiveStateExists=false`

回填要求：

- 清理范围：
- 保留配置：
- status 计数：
- 未清理边界：

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CODEX-DIRECT-THREAD-DISPATCH-2026-05-31 | Stage 5 legacy runtime cleanup 已完成 / direct-thread automation 主线完成 | automation flow transport | P1 | `codex-control-workspace` / `AlembicWorkspace` | 将 Codex Automation Closed Loop 默认 transport 从旧 1 分钟 automation 投递改为 direct thread dispatch only；线程投递作为正常工作流水线；automation-enabled 时 continuous loop + keep-live；子窗口本地配置与脚本 runtime contract 已实现，target direct-thread、controller-return current-thread 和 bounded continuous automation + keep-live smoke 均已通过；历史 runtime 已清理 | 否 | Design 已验证 host `send_message_to_thread` idle / busy / invalid 行为；用户裁决清理旧投递路线和旧 runtime；runtime 计数已归零，当前职责窗口 thread registry / window-config 已保留 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 无任务 | 否 | 产品 runtime 不参与 workspace delivery transport。 |
| `AlembicCore` | 无任务 | 否 | 不涉及 Core contract。 |
| `AlembicAgent` | 无任务 | 否 | 不涉及 Agent runtime。 |
| `AlembicDashboard` | 无任务 | 否 | 不涉及 UI。 |
| `AlembicPlugin` | 观察 | 否 | 可作为后续 smoke target，但不承担产品实现。 |
| `AlembicDesign` | 无任务 | 否 | handoff 已接收。 |
| `AlembicTest-IDE` | 观察 | 否 | 后续真实 Codex two-window smoke 候选，本轮不创建测试单。 |
| `AlembicTest` | 保留 | 否 | 旧 Test / PCVM 窗口继续保留，不占用。 |
| `BiliDili` | 无任务 | 否 | 不涉及真实项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 不改产品 runtime。 |
| `AlembicCore`<br>无任务 | 不涉及。 |
| `AlembicAgent`<br>无任务 | 不涉及。 |
| `AlembicDashboard`<br>无任务 | 不涉及。 |
| `AlembicPlugin`<br>观察中 | 后续可作为 smoke target，当前不派发。 |
| `AlembicDesign`<br>已完成 | handoff 已接收。 |
| `AlembicTest-IDE`<br>观察中 | 后续真实 Codex smoke 候选。 |
| `AlembicTest`<br>观察中 | 旧 Test / PCVM 窗口继续保留。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：无

本轮不向子窗口发送提示词。

## 测试交接

- 是否需要 `AlembicTest`：当前不需要。
- 总控自测结论：Design host thread-send probe 可作为 Stage 0 baseline；文档契约可由总控直接落地。
- 需要真实场景的理由：后续代码实现后，需要真实 Codex target/controller two-window smoke 证明 UI/thread readback / no default old automation。
- 测试前边界与多条件判断：
  - 测试要回答的问题：direct delivery 是否让目标线程立即收到并处理，controller return 是否能直接回到总控，automation-enabled 时是否能记录 keep-live、持续 review、回跳总控并在无 eligible task 时停止，普通路径是否不创建旧 automation。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicWorkspace` controller + 一个已登记 target 职责窗口；不使用真实产品项目。
  - 成功能推出的结论：target direct transport、controller-return current-thread transport、bounded continuous automation + keep-live exit 在当前 Codex Desktop 环境可用。
  - 失败能推出的结论：delivery adapter、thread id registry、busy policy 或 host capability 仍有缺口。
  - 不能推出的结论：不能推出产品仓库功能正确、不能推出所有平台通用。
  - 停止或不开始条件：thread id 未登记、host thread-send capability 不可用、delivery-run evidence 无法记录；automation-enabled smoke 还要求 keep-live state 可记录并有明确无任务退出边界。
- 测试单：无。
- 测试交流入口：[test-exchange.md](../../../../../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md)
- 真实项目保护说明：不涉及真实项目。

## 回填区

- 2026-05-31 21:05 CST：总控接收 `CODEX-DIRECT-THREAD-DISPATCH-2026-05-31`。已读取 Design original-plan / requirement-design / code-fact-review；确认本需求接续 closed-loop transport 优化，不重建派发协议，不打断 038/039 产品主线；本轮按用户在 Design 侧确认只落实文档，不直接改代码。
- 2026-05-31 21:18 CST：用户进一步裁决旧投递路线可以直接清理；总控将 Stage 0 文档目标改为 `direct-thread only + fail closed`，并把代码中旧 transport 清理留到后续代码阶段。
- 2026-05-31 21:18 CST：Stage 0 文档契约落实完成。已更新 `README.md`、`AGENTS.md`、`skills/dev/codex-automation-target/SKILL.md`、`skills/dev/codex-automation-controller/SKILL.md`、`skills/dev/control-workspace-governance/references/codex-automation-loop.md`、`skills/dev/control-workspace-governance/references/control-architecture.md`、当前计划和 global TODO；已同步根 `AGENTS.md` 与当前计划索引；`node scripts/verify-control-center.mjs`、`node scripts/sync-current-plan.mjs --plan .workspace-active/workspace/current/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md --check --json` 均通过；active automation docs/skills/current plan 中已无旧投递关键字匹配。
- 2026-05-31 21:23 CST：用户补充裁决：线程投递作为正常工作流水线；若开启自动化，走 continuous / infinite automation 并开启 keep-live。总控据此补充 Stage 0 文档契约：direct dispatch 是普通流水线；automation-enabled 才进入持续闭环；keep-live 是无人值守运行支撑，不是投递 transport 或验收证据。
- 2026-05-31 21:27 CST：按用户要求继续推进“子窗口的文件配置”完整设计。新增 `skills/dev/control-workspace-governance/references/direct-thread-window-config.md`，并更新 governance skill、automation loop reference、control architecture reference 和 scripts README；明确 v2 thread registry、derived window-config、direct DeliveryEnvelope v2、delivery-runs、keep-live state、legacy schedule / codexAutomation 禁止项和实现 checklist。本轮仍不改脚本实现、不写 raw thread id、不创建 runtime 文件。
- 2026-05-31 21:43 CST：Stage 2 runtime contract 实现完成。`scripts/codex-automation-loop.mjs` 已支持 `CodexWindowThreadRegistration` v2、`build-window-config`、v2 direct `DeliveryEnvelope` / `ControllerReturnEnvelope`、`record-delivery-run`、`keep-live-state`，并移除公开 `include-thread-id` / legacy schedule / `codexAutomation` 输出路径；controller / target skill、script pipeline 和安装脚本子窗口 access-card 口径已切到 direct-thread delivery。聚焦验证通过：`node --test scripts/codex-automation-loop.test.mjs`（16/16 pass，含 legacy `deliveryRole` 兼容）、`node --test scripts/check-dispatch-coverage.test.mjs scripts/check-test-boundary.test.mjs`（11/11 pass）。未启动真实 automation，未投递真实线程，未写 raw thread id。
- 2026-05-31 22:06 CST：Stage 3A target direct-thread smoke 通过。修复 legacy `deliveryRole` 兼容并新增聚焦测试；为 `AlembicTest-IDE` 生成 window-config，创建 `CDTDA-SMOKE-002` dispatch/delivery，使用 Codex Desktop `send_message_to_thread` 投递到固定测试窗口，并用 `read_thread` 回读 `DIRECT_THREAD_SMOKE_ACK CDTDA-SMOKE-002 AlembicTest-IDE`；`record-delivery-run` 已写入 readback evidence，未暴露 raw thread id，未启动 automation，未修改测试仓库文件。controller-return direct 和 continuous automation + keep-live smoke 尚未验证。
- 2026-05-31 22:08 CST：总控全量自验通过。`node scripts/verify-control-center.mjs --with-script-tests` 全部 PASS：workspace boundary、repository residue、workspace docs、script docs、current plan sync、decision preflight、dispatch coverage、test boundary、TODO board、task packages、git diff whitespace、69 个 workspace script tests 均通过；`node scripts/control-workspace-install.mjs sync-root-agents --write` 返回 `changed=false`，根 `AGENTS.md` 已与源文件同步。
- 2026-05-31 22:33 CST：Stage 3B controller-return current-thread smoke 通过。按用户裁决不新开窗口，直接回跳当前总控线程；先发现旧 `CDTDA-SMOKE-001` 残留 packet 会使 `review-results` 返回 `wait`，据此修复 `build-controller-return` fail-closed，group 有 missing result 时禁止生成回跳；随后用干净 group `CDTDA-RETURN-SMOKE-20260531` 验证 target ACK、`TargetResultEnvelope`、`review-results=needs-controller-review`、`ControllerReturnEnvelope` v2、当前总控线程收到回跳、controller-return `DirectThreadDeliveryRun` 记录均通过。按 loopGuard 裁决：本 smoke 没有 eligible next task，不创建下一跳；未启动 automation。
- 2026-05-31 22:56 CST：Stage 4 continuous automation + keep-live bounded smoke 通过。总控先写入 keep-live `running`，生成 automation-enabled direct `DeliveryEnvelope`（`continuousLoop=true`、`keepLive=true`、`oneShot=true`）并投递既有 `AlembicTest-IDE` 职责窗口；目标窗口回读 `DIRECT_THREAD_CONTINUOUS_TARGET_ACK CDTDA-CONTINUOUS-SMOKE-001 AlembicTest-IDE`，写入 completed `TargetResultEnvelope` 并生成 `ControllerReturnEnvelope`；总控复核 `review-results=needs-controller-review`、`missing=[]`、`blocked=[]`，真实回投当前总控线程并记录 controller-return `DirectThreadDeliveryRun`；随后写入 keep-live `stopped` 和 `stop-loop` marker。按 loopGuard 裁决：本 smoke 没有 eligible next task，不创建下一跳。
- 2026-05-31 23:04 CST：Stage 5 legacy runtime cleanup 已完成。按用户裁决“旧信息可以删除，功能不复杂，不需要保留历史记录”，总控删除旧 dispatch packets、delivery envelopes、delivery runs、target results、prompts、keep-live state、stop marker 和旧一次性 `AlembicTest-IDE039` thread registry；保留当前职责窗口 thread registry / window-config。`node scripts/codex-automation-loop.mjs status --json` 结果为 `packetCount=0`、`deliveryCount=0`、`deliveryRunCount=0`、`resultCount=0`、`registeredThreadCount=9`、`windowConfigCount=2`、`keepLiveStateExists=false`。

<!-- workspace-sync
{
  "status": "Stage 5 legacy runtime cleanup 已完成 / direct-thread automation 主线完成",
  "indexPlanDescription": "Codex Direct Thread Dispatch：Stage 5 legacy runtime cleanup 已完成，direct-thread automation 主线完成。",
  "indexStatusDescription": "当前主线切到 direct thread dispatch；线程投递正常流水线、automation-enabled 持续闭环 + keep-live、子窗口 runtime 文件配置和脚本 contract 已实现；AlembicTest-IDE target direct smoke、当前总控线程 controller-return smoke、bounded continuous automation + keep-live smoke 均已通过；历史 runtime 已清理。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Codex Direct Thread Dispatch：Stage 5 legacy runtime cleanup 已完成，direct-thread automation 主线完成。",
  "currentStatusSummary": "CODEX-DIRECT-THREAD-DISPATCH-2026-05-31 Stage 5 已完成 legacy runtime cleanup：旧 dispatch / delivery / result / run / keep-live / stop 记录已删除，当前 thread registry / window-config 已保留；direct-thread automation 主链路完成。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
