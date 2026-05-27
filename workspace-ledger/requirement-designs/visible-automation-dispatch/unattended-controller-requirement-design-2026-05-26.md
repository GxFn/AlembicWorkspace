# Visible Automation Dispatch Unattended Controller Requirement Design

日期：2026-05-26
状态：已确认，进入脚本 / skill 实现
Design Key：VAD-UNATTENDED-CONTROLLER-2026-05-26
总控定位：本文是 Visible Automation Dispatch 的无人值守总控增强需求设计；它不重写 AlembicWorkspace 原总控流程，只定义自动化投递 / 回跳如何穿插到原流程。

## 用户目标

用户希望在开启自动化模式后，总控不仅能把任务发给多个 Codex 窗口，还要有无人值守自我认知：围绕已确认最终目标持续验收、测试、打回、重验、推进下一阶段和选择下一个大方向任务。自动化不应让总控变成机械派发器，也不应让流程陷入小需求、小修补或文档噪声里。

## 核心需求

1. 总控可以一次发起多个自动化目标窗口开始任务。
2. 多个窗口完成后，目标窗口必须通过固定脚本 / skill 判断是否自动化回跳。
3. 非最后完成窗口只记录完成，不创建总控回跳。
4. 最后一个子窗口完成时才创建真实总控回跳，并记录 controller-return 状态。
5. 总控被唤醒后进入无人值守总控模式，继续原总控流程：验收、证据复核、自测、真实测试判断、打回、重派、下一阶段、下一 TODO。
6. 自动化只穿插在既有总控流程中，不替代需求判断、确认门禁、测试边界或验收裁决。

## 非目标

- 不让脚本自动决定证据是否通过。
- 不让子窗口代替总控验收、规划下一阶段或领取其它窗口任务。
- 不把 VAD 改成独立产品实现仓库。
- 不让 `AlembicTest` 重新成为默认测试窗口。
- 不为低优文档整理、格式清理或局部小修自动消耗主线。

## 模式定义

| 模式 | 含义 | 行为 |
| --- | --- | --- |
| manual | 普通总控模式 | 用户驱动，一轮完成后汇报。 |
| automation-goal | 无人值守目标模式 | 围绕当前确认目标持续推进，直到完成、阻塞、门禁触发或关闭。 |
| automation-backlog | 自动化候选 TODO 模式 | 当前目标完成后，只选择 automation-eligible 的高价值大方向 TODO。 |
| paused / disabled | 停止模式 | 不再 enqueue / arm / return，已唤醒窗口只记录完成后停止。 |

## Dispatch Group

新增 `dispatchGroup` 作为自动化批次单位。

- 一个 group 归属一个总控计划和一个已裁决阶段。
- group 内包含多个窗口任务。
- group 可一次性生成多个目标 heartbeat payload。
- group 使用 `returnPolicy` 控制回跳：
  - `controller-last`：所有 group task 终止后，最后完成窗口回跳总控。
  - `target-courier`：保持旧模式，完成窗口可 courier 下一目标窗口。

第一版默认使用 `controller-last`，因为它更符合“总控原流程 + 批次结束后验收”的定位。

## 子窗口完成规则

目标窗口完成任务后运行 `finish --chain-next --json`，并只按脚本 JSON 行动：

- `noReturn`：本批次未结束；删除本条 heartbeat，停止。
- `returnToController` + `controller-return` + `controllerReturnAllowed=true`：创建总控回跳 heartbeat，并记录 `record-return`。
- `armNext` + `target-courier` + `courierAllowed=true`：仅在计划允许 target courier 时创建下一目标窗口 heartbeat。
- `controllerArm` / `modeDisabled` / `registerWindow` / `registerController` / `wait` / `review`：不创建 heartbeat，回报总控或停止。

子窗口不得自行验收整个 group，不得处理其它窗口任务，不得根据自然语言判断跳过脚本结果。

## 总控回跳规则

总控被 controller-return heartbeat 唤醒后：

1. 读取 `AGENTS.md`、workspace index、current status、当前总控计划和 controller skill。
2. 运行 `group-status --group <id> --json` 和 `controller-tick --json`。
3. 独立复核每个 backfill，把窗口自述、原始证据和总控裁决分开。
4. 决定接受、驳回、待补证、阻塞、自测、真实测试、下一阶段、下一批派发或停止确认。
5. 当前目标未完成时，优先推进最终目标剩余差距。
6. 当前目标完成后，才考虑下一个 automation-eligible 大方向 TODO。

## 避免钻牛角尖

- 每轮先判断是否推进最终目标。
- 小问题只在阻塞主链路时处理；否则记录 TODO。
- 同一问题最多自动返工两次，之后转阻塞或待用户确认。
- 文档陈旧、格式噪声、低优清理不应打断主线。
- 验证失败必须回到同一最小链路修复，不扩大成全系统验证。

## 文档 / 脚本 / Skill 分工

- 长期需求设计：本文记录用户目标、模式、边界和完成定义。
- 当前总控计划：只记录本轮 group id、参与窗口、return policy、任务包和验收入口。
- `scripts/visible-dispatch.mjs`：管理 mode、registry、queue、group、claim、finish、last-window return、record-return、status 输出。
- `skills/dev/visible-automation-dispatch-target/`：目标窗口 claim / finish / next heartbeat / role guard。
- `skills/dev/visible-automation-dispatch-controller/`：总控回跳后无人值守验收、测试边界、下一阶段和大方向判断。

## 完成定义

- 脚本支持 current plan 创建 dispatch group。
- 脚本可一次生成 group 内多个 heartbeat payload。
- 子窗口 finish 时能判断 `noReturn` / `returnToController`。
- 最后完成窗口能生成总控回跳 payload 并记录 `record-return`。
- target skill 和 controller skill 分别固定目标窗口与总控窗口规则。
- 单元测试覆盖 batch arm、controller-last 非最后不回跳、最后回跳、controller return 记录。
- VAD 关闭后不再生成新 payload。
- 全流程不触碰产品仓库、不写 raw thread id 到 tracked docs。
