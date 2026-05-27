# Plugin Intent Knowledge Route VAD Real Loop Test

日期：2026-05-26
状态：GTODO-2026-05-24-037 VAD 真实关系链验收通过，自动化跳转加固已验证，037 产品 Stage 1 待裁决
发送给：无
总控定位：本文件是 037 当前总控计划；本轮使用真实 Codex heartbeat 和 037 真实任务上下文验证 VAD 自动化关系链，不做产品实现，不派 `AlembicTest`。

## 目标判断

- 用户目标：用 `GTODO-2026-05-24-037` 做真实 VAD 测试，验证“总控多窗口分发 -> 最后一个窗口回跳 -> 总控验收 -> 生成新的派发计划 -> 循环继续”这条关系链。
- 最终完成定义：总控在 037 当前计划下批量创建 `AlembicPlugin` / `Alembic` / `AlembicCore` 三个真实 heartbeat；三窗口只 claim / finish 自己任务；前两个窗口完成时不得回跳总控；最后窗口完成后创建 controller-return heartbeat；总控回跳后 review group evidence，并决定下一阶段计划或停止。
- 当前是否已经达到：VAD 真实关系链目标已达到。三窗口真实 heartbeat 均完成并被总控验收；`controller-last` group 直到最后窗口完成后才登记 controller-return；总控回跳后完成独立 review。037 产品功能尚未完成。
- 未达到时剩余差距：无 VAD real-loop 剩余差距。037 后续仍需回到 Stage 1 `IntentExtractionFrame` / `RecognizedIntentDraft` 实现计划，不得把本次自动化验证当作产品完成。
- 已达到时验收 / 归档判断：VAD real-loop 可标为验收通过；当前先按用户要求完成自动化跳转稳定性加固和验证，再由总控裁决 037 下一阶段是否继续无人值守派发。
- 当前任务分区：VAD 真实自动化验证 + 037 Wave 0 事实基线复核。
- 不纳入本轮事项：不实现 Stage 1；不启动 038 / 039；不做 Dashboard UI；不跑真实项目 / cold-start / rescan；不让 `AlembicTest` 承接本轮。

## 总控决策记录

- 本次决策触发：用户指出 VAD 不能只验证分段状态机，要求使用 037 做真实测试。
- 需求 / 测试结果理解：上一轮 fixture 已发现并修复 open `controller-last` group 提前 review 风险，但 fixture 不能替代真实 Codex heartbeat。037 Wave 0 已有旧 backfill，被总控接受为事实基线证据；本轮新建独立 real-loop 任务，不复用旧 completed taskId。
- 已核对证据：`docs/workspace/current/plugin-intent-knowledge-route-wave-0-2026-05-26.md`、`.workspace-local/visible-dispatch/window-registry.json`、`visible-dispatch status/controller-tick`、新增 fixture 测试 `unattended controller loop waits for full group, accepts, then arms the next refreshed plan`。
- 是否需要先验证 / 重新计划 / 用户确认：用户已要求使用 037 做真实测试；当前只需创建真实 VAD group 并启动，不需要额外 Design 确认。
- 本次允许更新：当前计划、workspace index/status、`.workspace-local/visible-dispatch/` runtime 队列和 automation run 记录。
- 本次不得更新：不得改产品源码；不得把 raw thread id 写入 tracked 文档；不得把真实 heartbeat 结果写成 037 产品完成；不得派 `AlembicTest`。

## 代码事实与边界

- 相关仓库：`AlembicPlugin`、`Alembic`、`AlembicCore`。
- 本轮任务类型：真实窗口 heartbeat + 只读复核。目标窗口可以读取代码、运行 `rg` / `git status` / targeted read-only commands，但不得写产品源码。
- 旧 037 Wave 0 证据：三窗口已有 completed backfill，已由总控接受为事实基线证据；本轮只验证真实自动化链路和必要复核，不重复判定最终功能完成。
- 真实测试项目是否涉及：否。
- `AlembicTest` 是否涉及：否。这里验证的是 Codex 窗口自动化关系链，目标窗口就是真实执行窗口。

## 阶段顺序

1. Wave 0R-A：总控注册自身 thread id 到本地 registry。
2. Wave 0R-B：总控创建 `controller-last` dispatch group，并批量 arm 三个目标窗口 heartbeat。
3. Wave 0R-C：`AlembicPlugin` / `Alembic` / `AlembicCore` 各自 claim / finish 自己窗口任务；前两个完成返回 `noReturn`，不得创建下一跳。
4. Wave 0R-D：最后完成窗口返回 `returnToController`，创建总控回跳 heartbeat 并 `record-return`。
5. Wave 0R-E：总控回跳后运行 `group-status` / `controller-tick`，独立 review evidence，决定接受 / 打回 / 创建下一阶段 037 计划 / 暂停。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| G037-VAD-REAL-PLUGIN | `AlembicPlugin` | 使用真实 heartbeat 复核 037 Plugin facts，并证明本窗口只 claim / finish 自己任务。 | 总控验收通过 |
| G037-VAD-REAL-ALEMBIC | `Alembic` | 使用真实 heartbeat 复核 037 Alembic resident / search / source refs facts，并由最后窗口登记 controller-return。 | 总控验收通过 |
| G037-VAD-REAL-CORE | `AlembicCore` | 使用真实 heartbeat 复核 037 Core contract / source refs / ProjectScope facts。 | 总控验收通过 |

### G037-VAD-REAL-PLUGIN

- 窗口：`AlembicPlugin`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划、`skills/dev/visible-automation-dispatch-target/SKILL.md` 和目标仓库 `AGENTS.md`，并明确当前窗口定位。
- 阶段目标：真实 heartbeat claim / finish `AlembicPlugin` 任务，复核 037 Plugin facts。
- 主线动作：只读复核 MCP metadata / prime schema / IntentExtractor / PrimeSearchPipeline / IntentState 事实，回填与旧 Wave 0 是否一致、是否有新增风险。
- 合并 TODO：`GTODO-2026-05-24-037`。
- 明确不包含：不改源码，不实现 intent schema，不创建 `AlembicTest`。
- 下一处真实阻塞点：Plugin 无法 claim 自己任务，或 finish 后在 group 未终止时仍尝试回跳总控。
- 阻塞点之前还能做：读取旧 backfill、跑只读 `rg`、回填 evidence。
- 验证命令：`git status --short`；`rg -n "hostDeclaredIntent|hostTurnMeta|CallToolRequest|alembic_task|prime|IntentExtractor|PrimeSearchPipeline|IntentState" .`
- 回填要求：完成范围、复核证据、与旧 Wave 0 差异、验证结果、不能推出的结论、风险。

### G037-VAD-REAL-ALEMBIC

- 窗口：`Alembic`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划、`skills/dev/visible-automation-dispatch-target/SKILL.md` 和目标仓库 `AGENTS.md`，并明确当前窗口定位。
- 阶段目标：真实 heartbeat claim / finish `Alembic` 任务，复核 037 Alembic facts。
- 主线动作：只读复核 resident / local AI provider / search / semantic / source refs / ProjectScope storage 事实，回填与旧 Wave 0 是否一致、是否有新增风险。
- 合并 TODO：`GTODO-2026-05-24-037`。
- 明确不包含：不改源码，不接本地模型，不跑 cold-start / rescan。
- 下一处真实阻塞点：Alembic 无法 claim 自己任务，或 group 未终止时提前回跳总控。
- 阻塞点之前还能做：读取旧 backfill、跑只读 `rg`、回填 evidence。
- 验证命令：`git status --short`；`rg -n "qwen|local.*model|resident|semantic|vector|sourceRefs|ProjectScope|prime|search" .`
- 回填要求：完成范围、复核证据、与旧 Wave 0 差异、验证结果、不能推出的结论、风险。

### G037-VAD-REAL-CORE

- 窗口：`AlembicCore`。
- 执行前置硬规则：先读取 `AGENTS.md`、`docs/workspace/index.md`、本当前计划、`skills/dev/visible-automation-dispatch-target/SKILL.md` 和目标仓库 `AGENTS.md`，并明确当前窗口定位。
- 阶段目标：真实 heartbeat claim / finish `AlembicCore` 任务，复核 037 Core facts。
- 主线动作：只读复核 ProjectScope、knowledge/source refs、search/vector shared contract 和 intent contract 下沉边界。
- 合并 TODO：`GTODO-2026-05-24-037`。
- 明确不包含：不新增导出，不移动类型，不创建空 contract。
- 下一处真实阻塞点：Core 无法 claim 自己任务，或最后窗口无法创建 controller-return。
- 阻塞点之前还能做：读取旧 backfill、跑只读 `rg`、回填 evidence。
- 验证命令：`git status --short`；`rg -n "ProjectScope|sourceRefs|Knowledge|Recipe|Search|Vector|Intent|Prime" .`
- 回填要求：完成范围、复核证据、与旧 Wave 0 差异、验证结果、不能推出的结论、风险。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-037 | VAD real-loop 已验收 / 产品 Stage 1 待裁决 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` | 使用 037 真实任务上下文验证 VAD 自动化关系链，并复核 Wave 0 代码事实。 | 是 | 三窗口 heartbeat 均已完成并经总控接受；VAD 关系链完成，037 产品实现仍待后续 Stage 1。 | 总控 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 已完成 | 否 | 真实 heartbeat 已 claim / finish，并被总控接受。 |
| `Alembic` | 已完成 | 否 | 真实 heartbeat 已 claim / finish，且 final group 已触发总控回跳。 |
| `AlembicCore` | 已完成 | 否 | 真实 heartbeat 已 claim / finish，并被总控接受。 |
| `AlembicAgent` | 无任务 | 否 | 本轮不涉及 internal Agent。 |
| `AlembicDashboard` | 无任务 | 否 | 本轮不涉及 UI。 |
| `AlembicTest` | 无任务 | 否 | 本轮不是真实项目验证。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | `G037-VAD-REAL-PLUGIN`：真实 heartbeat 已完成，任务 accepted。 |
| `Alembic`<br>已完成 | `G037-VAD-REAL-ALEMBIC`：真实 heartbeat 已完成，任务 accepted；controller-return 已回到总控并 record-stop。 |
| `AlembicCore`<br>已完成 | `G037-VAD-REAL-CORE`：真实 heartbeat 已完成，任务 accepted。 |
| `AlembicAgent`<br>无任务 | 不涉及。 |
| `AlembicDashboard`<br>无任务 | 不涉及。 |
| `AlembicTest`<br>无任务 | 不涉及真实项目验证。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无。本轮真实 heartbeat 已完成，不得重复发送旧 payload；下一次派发必须基于新的 037 Stage 1 计划或用户确认。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：这是 Codex heartbeat 和 VAD runtime 真实关系链测试，不需要真实项目环境。
- 需要真实场景的理由：无；真实场景测试等 037 Stage 6。
- 测试前边界与多条件判断：
  - 测试要回答的问题：真实 037 多窗口 heartbeat 是否能批量分发、各窗口各自 claim/finish、最后窗口才回跳总控、总控回跳后能 review 并进入下一计划。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：只限 AlembicWorkspace VAD runtime 和 `AlembicPlugin` / `Alembic` / `AlembicCore` 三个真实 Codex 窗口；thread id 只在 `.workspace-local/visible-dispatch/`。
  - 成功能推出的结论：VAD real-loop transport 可用于 037 后续自动化推进。
  - 失败能推出的结论：失败归因到 automation 投递、窗口 role guard、runtime queue/group、thread registry 或目标窗口操作；不能据此判 037 产品失败。
  - 不能推出的结论：不能证明 037 Stage 1-5 功能实现完成，不能证明真实项目 prime 注入有效。
  - 停止或不开始条件：registry 缺少真实窗口 thread id；current plan 未切到本文；`arm-batch` 不能生成三条 payload；任何窗口 claim 到非自身任务；group 未 terminal 前出现 controller review。

## 回填区

- 2026-05-26：用户要求使用 037 做真实测试；总控裁决旧 037 Wave 0 completed task 只作为已接受事实基线，不作为 VAD real-loop 证明。本计划将创建新的 `controller-last` dispatch group 和三条真实目标 heartbeat。
- 2026-05-26：总控注册 `AlembicWorkspace` 本地 thread id 到 `.workspace-local/visible-dispatch/`；创建 `g037-real-loop-2026-05-26` dispatch group；通过 `arm-batch` 创建并 `record-arm` 三条真实 heartbeat：`visible-dispatch-alembicplugin-037-real-loop`、`visible-dispatch-alembic-037-real-loop`、`visible-dispatch-alembiccore-037-real-loop`。`group-status` 显示 `unfinishedCount=3`，`controller-tick` 显示 `topAction=wait / nextAction=waitForBackfill`。
- 2026-05-26：三窗口真实 heartbeat 均完成并回填；总控独立验收后将三条 queue task 记为 `accepted`。`group-status --group g037-real-loop-2026-05-26 --json` 显示 `terminal=true`、`missingTaskCount=0`、三任务均 accepted；`cleanup --json` 显示无 active automation run。
- 2026-05-26：总控发现并修复自动化跳转边界缺口：controller-return automation run 已 stopped 时，dispatch group 仍可能停留在 `return-armed`。`record-stop` 已加固为 controller-return 幂等修复，现真实 group 状态已补为 `returned`。
- 2026-05-26：脚本加固范围：`finish` / `accept` JSON 输出不再暴露本地 thread id；`preflight` / `arm` / `arm-batch` / controller-return payload 生成会先确认 registry thread id 能解析到本地 Codex session；`record-return` 阻止同 group 重复 controller-return；`group-status` 以 group declared taskIds 为准并暴露 missing task；`finish --chain-next` 对 missing group task 返回 inspect，对已 return-armed / returned group 返回 review；`accept` 拒绝 active automation run 未停止的任务；`prune-history` 同步清理旧 group 和 stopped controller-return run。
- 2026-05-26：验证结果：`node --test scripts/visible-dispatch.test.mjs` 45 项通过，新增覆盖 VAD mode 启动 / 关闭对本地防睡眠进程的生命周期管理、启动前 thread session preflight、缺 session 时拒绝 arm、`arm-batch` 跳过未验证 target，并继续覆盖 duplicate controller-return、controller-return stop/repair、missing group task、active automation accept guard 和完整无人值守循环。
- 2026-05-26：总控整体验证通过：`node scripts/sync-current-plan.mjs --check --json`、`node scripts/check-dispatch-coverage.mjs --json`、`node scripts/check-script-docs.mjs`、`node scripts/verify-control-center.mjs --with-script-tests` 全部通过；workspace script tests 70 项通过。

<!-- workspace-sync
{
  "status": "GTODO-2026-05-24-037 VAD 真实关系链验收通过，自动化跳转加固已验证，037 产品 Stage 1 待裁决",
  "indexPlanDescription": "GTODO-2026-05-24-037 / Plugin intent knowledge route VAD real-loop test：真实 Codex heartbeat 已完成多窗口分发、最后窗口回跳、总控独立验收和自动化跳转边界加固；037 产品 Stage 1 仍待后续裁决。",
  "indexStatusDescription": "037 VAD 真实关系链验收通过：dispatch group `g037-real-loop-2026-05-26` 三条真实 heartbeat 均 accepted，group 已 returned，无 active automation run；已加固 controller-return、missing task、active run accept guard、thread id/session preflight 和 prune cleanup。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "GTODO-2026-05-24-037 VAD real-loop test：真实 heartbeat 多窗口分发 / 最后窗口回跳 / 总控验收 / 跳转边界加固。",
  "currentStatusSummary": "GTODO-2026-05-24-037 VAD 真实关系链已验收通过；自动化跳转稳定性、thread session preflight 和 mode 防睡眠生命周期已加固，并通过 45 项 visible-dispatch 测试。037 产品功能未完成，下一步应单独裁决 Stage 1 是否继续自动化派发。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
