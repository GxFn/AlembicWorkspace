# AlembicDesign Window Contract

更新日期：2026-05-25

## 定位

`AlembicDesign` 是受 `AlembicWorkspace` 总控管理的独立需求设计 / signal 判断窗口。它用于把用户的新想法、产品目标、bug 线索、TODO 候选、方案取舍和待确认问题先讨论清楚，再交回总控决定是否进入 TODO、bug 返修、需求设计、目标阶段确认或 wave 执行。

正规流程是：`AlembicDesign` 完成需求设计、目标和完成定义后，把 TODO / Backlog 挂载建议登记到 `AlembicDesign/docs/current/workspace-handoff-board.md`，必要时再附 handoff；`AlembicWorkspace` 用 `scripts/import-design-handoffs.mjs` 自动生成总控收件箱，再正式入账到全局 TODO、当前计划 TODO 或需求目录，并按当前主线、优先级、依赖和目标阶段确认正常领取推进。随时的小交流 / `workspace-signal` 只在确实需要同步 bug、当前主线风险、用户决策、轻量 TODO 或调研发现时使用，不能替代正式需求 handoff board 和 TODO 入账。

它不是产品实现仓库，也不是第二个总控。

## 关系

- `AlembicWorkspace`：唯一总控，负责当前主线、TODO 优先级、窗口分派、测试交接、验收、归档和 workspace 提交。
- `AlembicDesign`：需求讨论与方案设计窗口，负责产出 workspace signal、原始计划、需求设计草案、方案比较和 handoff 草案。
- 产品实现窗口：只接收 `AlembicWorkspace` 派发的执行任务，不直接接受 `AlembicDesign` 的实现指令。
- `AlembicDesign` 若脱离完整 workspace 单独打开，只能产出 `detached-design-mode` 草案；该草案必须经 `AlembicWorkspace` 导入并复核当前状态后，才能进入 TODO、目标阶段确认或 wave。

## 可以做

- 和用户讨论新需求、目标、场景、边界、阶段、风险和完成定义。
- 判断讨论内容属于 bug、TODO、research、decision、current-mainline-risk、requirement-candidate 还是背景信息。
- 生成 `original-plan`、`requirement-design` 和 `workspace-handoff` 草案。
- 生成轻量 `workspace-signal`，把 bug / TODO / 调研 / 决策随时交给总控接收。
- 维护 `docs/current/workspace-handoff-board.md`，把已准备交给总控的正式需求登记为 `ready-for-workspace`。
- 记录 open questions、用户决策、方案取舍、非目标和验证需求。
- 给总控提出代码调研请求或下一步建议。
- 对照 `AlembicDesign/docs/workspace-alignment-checklist.md` 做交接前自检，确认目标、闭环、证据、TODO、阶段候选和确认问题都能被总控接收。

## 不可以做

- 不修改 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或真实测试项目源码。
- 不直接创建实现 wave，不直接给实现窗口发提示词。
- 不替代 `docs/workspace/current/global-todo-board.md`、`test-exchange.md` 或当前总控状态。
- 不把 signal 直接写入 workspace 全局 TODO 或当前 wave。
- 不把 handoff board 条目直接写入 workspace 全局 TODO 或当前 wave；总控脚本只能自动发现和汇总。
- 不把未确认的方案写成执行结论。

## Signal 标准

交回 `AlembicWorkspace` 的 signal 至少包含：

1. 类型：bug、todo、research、decision、current-mainline-risk 或 requirement-candidate。
2. 触发内容：用户原话或准确摘要。
3. Design 判断：为什么属于该类型，是否建议打断当前主线。
4. 影响范围建议：可能涉及哪些仓库 / 窗口。
5. 证据状态：用户描述、截图 / 日志、代码事实、待调研项或测试需求。
6. 给总控的下一步建议：入 TODO、当前 wave 返修、测试单、原始计划确认、继续设计或不入账。

Signal 是随时交流路线，不受当前需求设计文档进度影响；总控接收后仍要独立判断。它不是 Design 正规需求完成后的默认交接方式；完整需求应走 handoff board + TODO / Backlog 挂载建议。

## Handoff 标准

交回 `AlembicWorkspace` 的 handoff 至少包含：

1. 用户目标和最终完成定义。
2. 当前状态：草案、用户已确认、阻塞、准备总控复核。
3. 需求场景、输入输出、状态变化、生产方和消费方。
4. 仓库职责边界和预计覆盖窗口。
5. 已知代码事实与仍需调研的问题。
6. 阶段候选、验证策略、非目标和禁止捷径。
7. 用户仍需确认的问题。
8. 与 `AlembicWorkspace` 当前主线的关系：不影响当前主线、TODO 候选、下一主线候选、当前主线阻塞，或需要总控确认。
9. TODO / Backlog 挂载建议：建议进入全局 TODO、当前计划 TODO、需求设计 TODO，或明确不入 TODO 的理由。

## 调度规则

- 当前主线执行中，`AlembicDesign` 可以并行讨论新需求，但不得改变当前主线完成定义。
- 如果讨论内容不影响当前主线，`AlembicDesign` 输出 handoff 后，由总控决定加入 TODO、作为下一主线候选或不入账；完成的正规需求设计优先走 handoff + TODO / Backlog 挂载建议，而不是不断发送小 signal。
- 如果讨论内容会影响当前主线，`AlembicDesign` 只能标明风险和确认问题，由总控决定是否暂停、返修、改线或继续当前主线。
- `AlembicDesign` 的 handoff 不得包含可复制实现窗口提示词；若需要派发，必须由 `AlembicWorkspace` 在当前总控文档中生成。
