# Visible Automation Dispatch Unattended Controller Wave 0

日期：2026-05-26
状态：VAD unattended controller Wave 0 已验证完成
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；本轮只修改 workspace 脚本、skill 和协作文档，不触碰产品源码，不派发子仓库窗口。

## 目标判断

- 用户目标：在现有总控流程里插入无人值守自动化能力，让总控可以批量发起多个窗口任务，子窗口完成后由脚本判断是否回跳，最后一个子窗口才真实回跳总控；总控被唤醒后要有 automation-goal 自我认知，能验收、测试、打回、重验、推进下一阶段和选择下一个大方向任务。
- 最终完成定义：`visible-dispatch` 支持 dispatch group、批量 arm payload、controller-last return policy、最后窗口 controller-return、controller return 记录；target skill 和 controller skill 固化窗口 / 总控职责；脚本测试覆盖关键路径；当前 VAD 规则不重写 AGENTS 原总控流程。
- 当前是否已经达到：已达到。脚本和 skill 第一版已实现，完整 workspace 验证已通过。
- 未达到时剩余差距：无。后续应回到 `GTODO-2026-05-24-037` Wave 0 验收和下一阶段裁决。
- 已达到时验收 / 归档判断：验证通过后可将 VAD unattended controller 标为 Wave 0 完成，再回到 `GTODO-2026-05-24-037` Wave 0 验收和下一阶段裁决。
- 当前任务分区：规则治理 / skill 治理 + workspace script pipeline。
- 不纳入本轮事项：不实现产品功能，不启动 AlembicTest，不改真实测试项目，不自动验收 037 产品链路。

## 总控决策记录

- 本次决策触发：用户指出自动化没有持续到最终目标，并补充需求：总控要保留原流程，但在无人值守模式下能批量派发、批次结束回跳、自动验收 / 测试 / 打回 / 下一阶段推进，避免在小需求小修改上钻牛角尖。
- 需求 / 测试结果理解：现有 VAD 只有目标窗口 courier 和 completed -> review 状态，缺少 dispatch group、最后窗口回总控和总控 automation-goal skill；如果直接做常驻 controller loop，会偏离用户“自动化穿插原总控流程”的要求。
- 已核对证据：`scripts/visible-dispatch.mjs` 现有 mode / registry / queue / finish-chain / controller-tick；`skills/dev/visible-automation-dispatch-target/SKILL.md`；当前 runtime 显示 037 Wave 0 三个窗口已 completed 并等待总控 review。
- 是否需要先验证 / 重新计划 / 用户确认：用户已确认需求汇总并要求进行下一步；本轮可直接实现 workspace 脚本 / skill，不需要子仓库执行窗口。
- 本次允许更新：`scripts/visible-dispatch.mjs`、`scripts/visible-dispatch.test.mjs`、`scripts/README.md`、VAD target / controller skill、VAD requirement design、workspace 当前状态 / 索引。
- 本次不得更新：不得触碰 Alembic / AlembicPlugin / AlembicCore 等产品源码；不得把 runtime thread id 写入 tracked docs；不得把 037 Wave 0 backfill 自动验收为最终目标完成。

## 需求来源

- 来源类型：用户直接确认的 workspace 自动化治理需求。
- 需求设计文档：[../../requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md](../../requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md)。
- 用户确认状态：已确认进入下一步。
- 总控接收结论：作为 VAD 第一版后的增强 Wave 0，由总控直接实现 workspace 脚本 / skill；不交给子仓库。

## 代码事实与边界

- 修改范围：workspace `scripts/`、`skills/dev/`、`docs/requirement-designs/visible-automation-dispatch/`、`docs/workspace/current/` 和索引。
- 关键入口：
  - `scripts/visible-dispatch.mjs`：mode / registry / queue / group / finish / record-return。
  - `scripts/visible-dispatch.test.mjs`：状态机回归测试。
  - `skills/dev/visible-automation-dispatch-target/`：目标窗口 finish 后动作规则。
  - `skills/dev/visible-automation-dispatch-controller/`：总控回跳后 automation-goal 规则。
- 真实测试项目是否涉及：否。
- AlembicTest 是否涉及：否。本轮是 workspace 脚本状态机验证，总控自测即可。

## 阶段顺序

1. Wave 0A：需求设计落账，明确“不重写原总控流程，只插入自动化投递 / 回跳层”。
2. Wave 0B：脚本实现 dispatch group、batch payload、controller-last、record-return、group-status。
3. Wave 0C：skill 更新：目标窗口和总控窗口职责分离。
4. Wave 0D：脚本 README / skill index 更新。
5. Wave 0E：运行脚本测试与总控验证。
6. Wave 0F：验收后回到 037 Wave 0 review，决定 Stage 1 或返工。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| VAD-UC-W0-SCRIPT | `AlembicWorkspace` | 扩展 visible-dispatch group / batch / controller return 状态机。 | 已完成 |
| VAD-UC-W0-SKILL | `AlembicWorkspace` | 更新 target skill，新增 controller skill。 | 已完成 |
| VAD-UC-W0-VERIFY | `AlembicWorkspace` | 运行 visible-dispatch tests、script docs 和总控验证。 | 已完成 |

### VAD-UC-W0-SCRIPT

- 窗口：`AlembicWorkspace`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划，并明确当前定位是 workspace 总控脚本治理，不是产品仓库实现。
- 阶段目标：让 `visible-dispatch` 支持 dispatch group、批量 arm payload、controller-last return policy、最后窗口 controller-return 和 return automation 记录。
- 主线动作：在现有 VAD 状态机上增加自动化投递 / 回跳层，保留原 controller-tick / finish / target-courier 兼容路径。
- 合并 TODO：`GTODO-2026-05-25-005`。
- 明确不包含：不验收 `GTODO-2026-05-24-037`，不派发产品窗口，不创建 AlembicTest 测试单，不修改产品仓库。
- 下一处真实阻塞点：脚本状态机无法证明最后窗口才回跳总控，或 active automation 未完成时 controller 继续 arm 造成多跳并发错位。
- 阻塞点之前还能做：补 fixture 级状态机测试、完善命令输出 JSON、保持旧 target-courier 行为不退化。
- 验证命令：
  ```text
  node --test scripts/visible-dispatch.test.mjs
  ```
- 回填要求：记录新增命令、关键状态机行为、测试结果和任何遗留风险。

### VAD-UC-W0-SKILL

- 窗口：`AlembicWorkspace`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划，并明确当前定位是 workspace skill 治理，不是替执行窗口做产品实现。
- 阶段目标：把自动化和无人值守规则拆成 target window skill 与 total-control controller skill，让各窗口知道自己只 claim / finish 自己的任务，总控回跳后才做验收和下一轮决策。
- 主线动作：更新 `visible-automation-dispatch-target`，新增 `visible-automation-dispatch-controller`，并同步 skill 索引。
- 合并 TODO：`GTODO-2026-05-25-005`。
- 明确不包含：不把总控最高硬规则隐藏进 skill，不把 target 窗口升级为总控裁决者，不让非 AlembicTest 窗口创建 / 处理 AlembicTest heartbeat。
- 下一处真实阻塞点：skill 文案不能阻止窗口越权处理其它窗口任务、提前回跳总控或在没有 permission flag 时创建 heartbeat。
- 阻塞点之前还能做：把 noReturn / returnToController / registerController / recordReturnCommand 的动作边界写清，并在 README 中挂载。
- 验证命令：
  ```text
  node scripts/check-script-docs.mjs
  ```
- 回填要求：记录新增 / 更新 skill 路径、消费方、禁止事项和验证结果。

### VAD-UC-W0-VERIFY

- 窗口：`AlembicWorkspace`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划，并明确当前定位是 workspace 总控验收，自测优先，不使用 AlembicTest。
- 阶段目标：确认 VAD unattended controller Wave 0 的脚本、skill、索引和当前计划格式均可被 workspace pipeline 复核。
- 主线动作：运行 targeted tests、script docs 校验、task package 校验和 `verify-control-center --with-script-tests`。
- 合并 TODO：`GTODO-2026-05-25-005`。
- 明确不包含：不证明 037 产品功能完成，不启动真实窗口 heartbeat，不写入本地 thread id 到 tracked docs。
- 下一处真实阻塞点：workspace 总控验证未通过，或验证通过但 037 Wave 0 回填仍未被总控独立验收。
- 阻塞点之前还能做：修正计划脚本可读字段、补遗漏索引、重跑总控验证。
- 验证命令：
  ```text
  node scripts/check-task-packages.mjs --require --json
  node scripts/verify-control-center.mjs --with-script-tests
  ```
- 回填要求：记录最终命令结果、是否可回到 037 Wave 0 验收、以及 VAD Wave 0 遗留风险。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-005 | Wave 0 已完成 / 待归档 | visible automation dispatch | P0 | `AlembicWorkspace` | 增强 VAD，使其支持无人值守 automation-goal 模式下的多窗口批量派发、最后窗口回跳和总控自我决策。 | 是 | `verify-control-center --with-script-tests` 已通过。 | `AlembicWorkspace` |
| GTODO-2026-05-24-037 | 暂停验收 / 待回到主线 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` | 037 Wave 0 三窗口代码事实已 completed，等待总控在 VAD 增强后回到验收。 | 是 | 当前 runtime `topAction=review`。 | 总控 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicWorkspace` | 主线自处理 | 否 | 本轮是 workspace 脚本 / skill 治理，只有总控可修改并验收。 |
| `AlembicPlugin` | 暂停 | 否 | 037 Wave 0 已回填，等待总控验收。 |
| `Alembic` | 暂停 | 否 | 037 Wave 0 已回填，等待总控验收。 |
| `AlembicCore` | 暂停 | 否 | 037 Wave 0 已回填，等待总控验收。 |
| `AlembicAgent` | 无任务 | 否 | 本轮不涉及 internal Agent。 |
| `AlembicDashboard` | 无任务 | 否 | 本轮不涉及 UI。 |
| `AlembicTest` | 无任务 | 否 | 总控可用脚本自测，不需要真实项目 / cold-start / Dashboard 手动观察。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>无任务 | 037 Wave 0 已完成回填，等待总控后续验收，不发送新任务。 |
| `Alembic`<br>无任务 | 037 Wave 0 已完成回填，等待总控后续验收，不发送新任务。 |
| `AlembicCore`<br>无任务 | 037 Wave 0 已完成回填，等待总控后续验收，不发送新任务。 |
| `AlembicAgent`<br>无任务 | 本轮不涉及。 |
| `AlembicDashboard`<br>无任务 | 本轮不涉及。 |
| `AlembicTest`<br>无任务 | 本轮不涉及真实测试。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制提示词

发送给：无。本轮由总控直接修改 workspace 脚本、skill 和文档。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮是 workspace 脚本状态机、skill 文案和文档索引验证，总控可用 Node tests 和 workspace verify 完成。
- 需要真实场景的理由：无。
- 测试前边界与多条件判断：
  - 测试要回答的问题：dispatch group 能否批量生成 payload，目标窗口 finish 是否只在最后任务回跳总控，旧 target-courier 行为是否保持。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：只限临时 fixture workspace 与 `.workspace-local/visible-dispatch` 结构，不触碰产品仓库。
  - 成功能推出的结论：VAD unattended controller Wave 0 的脚本状态机可用。
  - 失败能推出的结论：脚本状态机或 README / skill 索引仍需修复，不能用于真实 037 自动化。
  - 不能推出的结论：不能证明 037 产品需求已实现。
  - 停止或不开始条件：脚本测试失败、workspace docs 校验失败、出现 tracked raw thread id 或子仓库写入。

## 回填区

- 2026-05-26：用户确认 VAD unattended controller 需求汇总，要求进入下一步；总控开始实现 dispatch group / controller-last / controller-return / controller skill。
- 2026-05-26：Wave 0 已实现并通过验证：`node --test scripts/visible-dispatch.test.mjs` 34 项通过；`node scripts/check-task-packages.mjs --require --json` 通过；`node scripts/check-script-docs.mjs` 通过；`node scripts/verify-control-center.mjs --with-script-tests` 全部通过，包含 workspace script tests 59 项通过。下一步回到 `GTODO-2026-05-24-037` Wave 0 的总控验收，不自动把 037 产品链路判定为完成。

<!-- workspace-sync
{
  "status": "VAD unattended controller Wave 0 已验证完成",
  "indexPlanDescription": "Visible Automation Dispatch unattended controller Wave 0：增强 VAD 作为总控原流程中的自动化投递 / 回跳层，支持 dispatch group、最后窗口回总控和 automation-goal 总控自我决策。",
  "indexStatusDescription": "VAD unattended controller Wave 0 已验证完成：dispatch group、批量 arm、最后窗口 controller-return 和 automation-goal controller skill 已通过总控验证；下一步回到 037 Wave 0 验收。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "Visible Automation Dispatch unattended controller Wave 0：workspace 脚本 / skill / 文档治理。",
  "currentStatusSummary": "VAD unattended controller Wave 0 已验证完成：workspace 脚本、skill、索引和当前计划格式均通过总控验证；037 Wave 0 回填暂缓到本轮后验收。",
  "indexRows": [
    {
      "type": "VAD Unattended Controller 需求设计",
      "doc": "docs/requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md",
      "status": "已验证完成",
      "description": "定义 VAD 无人值守总控增强：dispatch group、最后窗口回跳、总控 automation-goal 自我决策和避免小任务漂移。",
      "insertAfter": "Visible Automation Dispatch 需求设计"
    }
  ],
  "currentIndexRows": [
    {
      "type": "VAD Unattended Controller 需求设计",
      "doc": "docs/requirement-designs/visible-automation-dispatch/unattended-controller-requirement-design-2026-05-26.md",
      "description": "已确认进入实现的 VAD 无人值守总控增强需求设计。",
      "insertAfter": "VAD 需求设计"
    }
  ]
}
-->
