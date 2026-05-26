# Plugin Intent Knowledge Route Stage 1 Mainline

日期：2026-05-26
状态：待启动（GTODO-2026-05-24-037 已确认为下一主线，Stage 1 代码调研待启动）
发送给：无
总控定位：本文件是 VAD 归档后的 037 当前总控入口；它只承接 037 下一主线、代码事实调研和后续 Stage 1 计划准备，不把 VAD 自动化验证当作产品实现完成。

## 目标判断

- 用户目标：归档 Visible Automation Dispatch，把 `GTODO-2026-05-24-037 / Plugin intent knowledge route` 提升确认为下一主线，并提交本轮 workspace 变更。
- 最终完成定义：VAD 当前计划和短期 wave 文档从当前工作面移入归档；当前总控入口切到 037；TODO 账本明确 037 是下一主线、VAD 后续问题按 bug / optimization 入队；自动化模式关闭或不再抢跑；workspace 校验通过并提交。
- 当前是否已经达到：VAD real-loop 目标已达到并可归档；037 产品功能尚未完成。
- 未达到时剩余差距：037 还需要先做 Stage 1 真实代码调研和执行计划，确认 `IntentExtractionFrame` / `RecognizedIntentDraft`、host turn meta、prime 快速路径和 episode 连续性的最小代码链路。
- 已达到时验收 / 归档判断：VAD 作为工具能力完成归档；后续 VAD 问题不阻塞 037 主线，作为 bug / optimization TODO 独立处理。
- 当前任务分区：验收 / 归档 + TODO 主线提升；不是产品实现派发。
- 不纳入本轮事项：不实现 037 Stage 1；不派发子窗口；不创建 heartbeat；不派 `AlembicTest`；不触碰产品源码或真实测试项目。

## 总控决策记录

- 本次决策触发：用户明确要求“把 VAD 归档，提升确认 037 为下一个主线，然后提交代码，后续 VAD 问题作为 bug 和优化点处理”。
- 需求 / 测试结果理解：VAD 真实关系链、脚本跳转稳定性、thread session preflight 和 mode 防睡眠生命周期已经通过总控脚本验证；这些证据只证明自动化投递层可用，不证明 037 产品功能完成。
- 已核对证据：当前 VAD real-loop 计划回填、`visible-dispatch` 脚本测试结果、当前 workspace status、global TODO 中 037 / VAD 两条状态、归档脚本规则。
- 是否需要先验证 / 重新计划 / 用户确认：用户已经确认主线切换；当前不需要重新 Design 确认。提交前仍必须运行 workspace 脚本校验。
- 本次允许更新：当前计划、workspace index / current status / current index、global TODO、VAD 归档文件、workspace record map、VAD local mode 状态。
- 本次不得更新：不得把 VAD 问题继续写成当前主线阻塞；不得把 037 标为产品完成；不得写入 raw thread id；不得修改子仓库产品源码。

## Design / 需求来源

- 来源类型：AlembicDesign handoff + 用户主线提升确认。
- 来源文档：
  - `AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md`
  - `AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md`
- 用户确认状态：已确认 037 是 VAD 归档后的下一主线。
- 总控接收结论：Design 两份需求共同构成 037；先从 Stage 1 intent recognition / episode continuity 代码事实调研开始。
- 是否需要目标阶段确认：下一步需要为 Stage 1 建立执行计划或目标阶段确认，不能直接派发实现。
- 是否需要代码实现依赖调研：需要；自动化不会跳过真实代码调研。

## 代码事实与边界

- 相关仓库：`AlembicPlugin`、`Alembic`、`AlembicCore`、后续可能涉及 `AlembicAgent` / `AlembicDashboard`。
- 关键入口：待 Stage 1 代码调研确认，候选包括 Plugin MCP tool metadata / prime path、Alembic resident search / source refs、Core shared source-ref / intent contract。
- producer / consumer 依赖：先确认 Plugin host intent 输入与 Alembic prime/search 消费链路；Core contract 只有在出现真实双向消费时才下沉。
- 不可提前消费的上游：不得在 Stage 1 contract / source refs 未确认前让 Dashboard 或真实测试窗口空跑。
- 不允许触碰的目录 / 仓库：本轮不触碰子仓库产品源码；VAD thread id 只保留在 ignored `.workspace-local/visible-dispatch/`。
- 真实测试项目是否涉及：否。037 真实项目验证应等代码链路形成后再判断。

## 阶段顺序

1. VAD 归档和当前入口切换。
2. 037 Stage 1 代码事实调研：确认真实入口、调用链、producer / consumer 和验证方式。
3. 037 Stage 1 执行计划：按调研结果决定窗口覆盖、任务包和是否启用自动化派发。

- 下一处真实阻塞点：037 Stage 1 代码链路尚未复核，不能直接派发实现。
- 阻塞点之前还能做：完成 VAD 归档、关闭 VAD 自动化模式、提交 workspace 变更。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：`AlembicPlugin` / `Alembic` / `AlembicCore` 等待 Stage 1 代码调研后再确定；`AlembicTest` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| G037-STAGE1-PREP | `AlembicWorkspace` | 归档 VAD、切换 037 当前入口、提交 workspace 变更；后续再创建 Stage 1 调研 / 派发计划。 | 已完成 |

### G037-STAGE1-PREP

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:19 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:25 CST

阶段目标：

- 把 VAD 当前工作面移出当前主线。
- 明确 037 是下一主线。
- 提交 workspace 脚本 / 文档 / skill 资产变更。

主线动作：

- 切换当前计划到本文。
- 归档 VAD current wave 文档。
- 关闭 VAD automation mode，避免旧自动化抢跑。
- 运行 workspace 校验并提交。

合并 TODO：

- `GTODO-2026-05-24-037`：提升为下一主线。
- `GTODO-2026-05-25-005`：VAD 已完成待归档；后续问题作为 bug / optimization 入队。

明确不包含：

- 不实现 037 产品功能。
- 不继续修 VAD 新问题。
- 不派发 `AlembicTest`。

下一处真实阻塞点：

- 037 Stage 1 真实代码链路未完成调研。

阻塞点之前还能做：

- 完成归档、账本切换、校验和提交。

验证命令：

```text
node scripts/sync-current-plan.mjs --check --json
node scripts/check-script-docs.mjs
node scripts/verify-control-center.mjs --with-script-tests
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和相关 skill references。
- 开始执行前先明确这是总控归档 / 主线切换，不是子仓库实现。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-037 | 下一主线已确认 / Stage 1 代码调研待启动 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicDashboard` | Plugin 意图同步，以及意图下面的知识注入与知识检索链路优化增强；让 Codex 当前任务意图驱动 prime / search / Recipe evidence / shout。 | 是 | 用户已确认 Design 037；VAD 已归档，不再阻塞 037 产品主线。 | 总控 |
| GTODO-2026-05-25-005 | 已完成待归档 / 后续问题转 bug 优化 | visible automation dispatch | P2 | `AlembicWorkspace` | 可见 Codex 窗口自动化派发生产线已经通过真实关系链验证；后续只按 bug / optimization 处理增量问题。 | 否 | 若出现新的 VAD 投递、role guard、thread id、mode lifecycle 或归档残留问题，再单独入队。 | `AlembicWorkspace` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察 | 否 | 等 037 Stage 1 代码调研确认 Alembic resident / search 消费边界。 |
| `AlembicCore` | 观察 | 否 | 等真实双向消费出现后再判断 shared contract 是否下沉。 |
| `AlembicAgent` | 无任务 | 否 | 当前 Stage 1 尚未确认 Agent runtime 是否参与。 |
| `AlembicDashboard` | 观察 | 否 | Stage 1 不做 UI，等 source refs / metrics 消费稳定后再判断。 |
| `AlembicPlugin` | 观察 | 否 | 等 Stage 1 代码调研确认 Plugin host intent 输入链路。 |
| `AlembicTest` | 无任务 | 否 | 当前不需要真实项目验证、cold-start / rescan 或 Dashboard 手动观察。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实测试项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 等 037 Stage 1 代码调研后再判断是否派发。 |
| `AlembicCore`<br>观察中 | 等真实 contract 下沉需求出现后再判断。 |
| `AlembicAgent`<br>无任务 | 当前不涉及。 |
| `AlembicDashboard`<br>观察中 | 当前不做 UI。 |
| `AlembicPlugin`<br>观察中 | 等 Stage 1 代码调研后再判断是否派发。 |
| `AlembicTest`<br>无任务 | 当前不涉及真实项目验证。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无。当前没有可复制给子窗口的提示词；下一步先由总控完成 037 Stage 1 代码事实调研和执行计划。

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮是 workspace 归档、索引切换和脚本校验，总控可自行验证。
- 需要真实场景的理由：无。
- 测试前边界与多条件判断：
  - 测试要回答的问题：workspace 当前入口、归档、TODO 状态、脚本索引和 VAD runtime mode 是否一致。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：仅 AlembicWorkspace 文档、脚本和 ignored VAD local runtime；不涉及子仓库和真实项目。
  - 成功能推出的结论：VAD 已从当前主线移出，037 可以作为下一主线入口继续推进。
  - 失败能推出的结论：失败只归因于 workspace 文档 / 脚本 / 归档状态，不代表 037 产品功能失败。
  - 不能推出的结论：不能证明 037 Stage 1 代码实现完成。
  - 停止或不开始条件：归档脚本拒绝当前计划、sync check 失败、workspace boundary 失败、或出现 tracked raw thread id。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)
- 真实项目保护说明：不触碰真实测试项目。

## 回填区

- 2026-05-26 19:19 CST：用户确认 VAD 归档、037 提升为下一主线；总控创建本文作为新的当前入口。VAD 后续问题转入 bug / optimization，不再阻塞 037 主线。
- 2026-05-26 19:25 CST：已将 13 个 VAD current 文档归档到 `docs/workspace/archive/2026-05/visible-automation-dispatch/`；`visible-dispatch` mode 已关闭，防睡眠 inactive。`GTODO-2026-05-24-037` 已切为下一主线，`GTODO-2026-05-25-005` 已降为已完成待归档 / 后续 bug 优化。验证通过：`node scripts/sync-current-plan.mjs --check --json`、`node scripts/check-script-docs.mjs`、`node scripts/verify-workspace-docs.mjs --json`、`git diff --check`、`node scripts/verify-control-center.mjs --with-script-tests`，其中 workspace script tests 70 项通过。

<!-- workspace-sync
{
  "status": "GTODO-2026-05-24-037 已确认为下一主线，Stage 1 代码调研待启动",
  "indexPlanDescription": "GTODO-2026-05-24-037 / Plugin intent knowledge route：VAD 已归档，037 已提升为下一主线；当前先做 Stage 1 代码事实调研与执行计划准备，不派发窗口。",
  "indexStatusDescription": "VAD 已归档；后续 VAD 问题按 bug / optimization 入 TODO。037 已确认为下一主线，Stage 1 待总控补代码调研与执行计划。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "GTODO-2026-05-24-037 下一主线入口：VAD 归档后启动 Plugin intent knowledge route Stage 1 计划准备。",
  "currentStatusSummary": "VAD 已归档；后续 VAD 问题作为 bug / optimization 排队处理。GTODO-2026-05-24-037 已确认为下一主线，当前发送给无，下一步由总控补 Stage 1 代码事实调研和执行计划。",
  "indexRows": [],
  "currentIndexRows": [
    {
      "type": "GTODO 037 Intent Recognition Design",
      "doc": "AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md",
      "description": "037 第一阶段需求设计：prime 快速路径结构化意图、hostTurnMeta、IntentEpisode 连续性和本地 refinement 边界。"
    },
    {
      "type": "GTODO 037 Intent Knowledge Design",
      "doc": "AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md",
      "description": "037 第二阶段需求设计：IntentSearchPlan、keyword / vector / relation 增强和保留 source refs 的 PrimeInjectionPackage。"
    }
  ]
}
-->
