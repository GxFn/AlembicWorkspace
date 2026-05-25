# Requirement To Wave Execution Flow

状态：长期流程规则
维护窗口：AlembicWorkspace

本文档固化从用户需求到第一波执行派发的成熟路线。它不是某一次任务计划，而是总控窗口后续处理较大需求时的默认流程。

探索性需求讨论、方案取舍、bug / TODO / 调研 / 决策 signal 优先由 `AlembicDesign` 承接。正规需求路线是 `AlembicDesign` 完成需求设计、目标和完成定义，并把 TODO / Backlog 挂载建议登记到 `AlembicDesign/docs/current/workspace-handoff-board.md`；`AlembicWorkspace` 通过 `scripts/import-design-handoffs.mjs --write` 自动生成 [current/design-handoff-inbox.md](current/design-handoff-inbox.md)，再正式入全局 TODO、当前计划 TODO 或需求目录，并判断是否继续代码调研、创建测试单、进入目标阶段确认或启动 wave。随时的小交流 / `workspace-signal` 只在确实需要同步 bug、当前主线风险、用户决策、轻量 TODO 或调研发现时使用，不替代 handoff board 和正式 TODO 入账。

## 成熟路线

0. Design signal / handoff 接收
   - `AlembicDesign/docs/current/workspace-handoff-board.md` 是正规需求设计完成后的默认清单入口，状态为 `ready-for-workspace` 的条目必须带目标、完成定义、阶段候选和 TODO / Backlog 挂载建议。
   - `AlembicWorkspace` 运行 `node scripts/import-design-handoffs.mjs --write` 自动校验清单并刷新 `docs/workspace/current/design-handoff-inbox.md`。
   - `AlembicDesign/docs/current/*-workspace-handoff-YYYY-MM-DD.md` 可用于较完整方案交接，但不是每个需求的硬要求；如果需求设计已包含足够交接信息，handoff board 可以直接引用原始计划和需求设计。
   - `AlembicDesign/docs/current/*-workspace-signal-YYYY-MM-DD.md` 只用于必要的小交流：bug、TODO、research、decision、current-mainline-risk 或临时 requirement-candidate；不要把每个正规需求进展都拆成 signal。
   - 总控接收后先判断是否影响当前主线；不影响则正式进入全局 TODO、当前计划 TODO、需求目录或等待当前主线后评估，影响则按阻塞 / 返修 / 待确认处理。
   - Signal / handoff 不是执行计划，不能直接派发实现窗口。

1. 原始需求进入需求目录
   - 在 `docs/requirement-designs/<需求名>/` 新建 `original-plan-YYYY-MM-DD.md`。
   - 若来源是 `AlembicDesign` handoff，可由总控复制 / 转写 Design 已确认内容，并保留来源链接。
   - 只记录用户目标、约束、口径和确认问题，不提前拆执行任务。
   - 用户确认前，发送给必须是无。

2. 原始计划书确认
   - 用户确认原始计划书后，才进入需求设计。
   - 如果用户补充或改变目标，先更新原始计划书或需求目录 README，再继续。

3. 需求设计
   - 创建 `requirement-design-YYYY-MM-DD.md`。
   - 若 Design 已有需求设计草案，总控只做接收审查、缺口补齐和 workspace 落点转换；不要在总控重复整段需求讨论。
   - 写清用户场景、完整功能闭环、输入输出、状态变化、生产方、消费方、验证方式和完成定义。
   - 这里可以写阶段候选方向，但不能作为执行派发依据。
   - 如果用户在需求讨论中新增 TODO、风险、设计候选、验证点或优先级调整，先写入需求设计文档的 `TODO / Backlog`；它只是设计输入，不得绕过代码调研和目标阶段确认。

4. 深度代码实现依赖调研
   - 对跨仓库、架构边界、运行时、发布链路、删除清理、多项目控制等任务，必须在需求目录下创建 `code-implementation-dependency-research-YYYY-MM-DD.md` 或等价调研附件。
   - 该文档记录真实代码入口、调用链、生命周期、共享状态、持久化位置、producer / consumer、不能切换或不能删除的硬边界。
   - 外部调研是否需要由总控判断；需要时引用官方文档或权威来源，不需要时写明理由。

5. 目标阶段确认
   - 基于需求设计和深度代码证据，在 `docs/workspace/current/` 创建任务级目标阶段确认文档。
   - 目标阶段确认文档必须写清最终完成定义、非目标、影响窗口、依赖链、阶段计划、验证策略和确认问题。
   - 用户确认前，确认文档和 `current/workspace-current-status.md` 都必须保持不派发；发送给为无。

6. 用户确认目标阶段
   - 在确认文档回填用户确认。
   - 仍不要把确认文档当作长期执行文档堆叠所有 wave。

7. 创建第一波执行计划
   - 用户确认后，新建或激活 `docs/workspace/current/<topic>-wave-N-...-plan-YYYY-MM-DD.md`。
   - 把 `docs/workspace/index.md` 当前计划第一行切到 wave 执行计划。
   - `current/workspace-current-status.md` 同步成当前 wave 状态。
   - 只把当前无上游阻塞、发送后能推进的窗口标为 `待启动` 或 `执行中`。
   - 派发前先识别下一处真实阻塞点，并把阻塞点之前同阶段、同窗口、同边界、同验证链路下可推进的主线动作和可关闭 TODO 组成任务包；不要每次只派最小一小步。
   - 任务包至少写清阶段目标、主线动作、合并 TODO、明确不包含事项、阻塞 / 依赖、验证命令、回填要求，以及执行前置硬规则：读取目标仓库 `AGENTS.md` 并明确当前窗口定位 / 仓库职责。模板见 `templates/workspace-task-package-template.md`。

8. 通用 TODO 子模式
   - 如果当前目标、需求设计、真实运行、监控、验收或用户反馈中存在一组待办、风险、候选优化、验证点或问题，相关文档必须包含 `TODO / Backlog`。
   - 如果 TODO 会影响 wave 派发、并行安排或下一波顺序，执行计划必须同时包含 `空闲窗口调度`。
   - TODO 列表要区分 `主线`、`可并行`、`阻塞`、`观察`、`待验收`、`已完成` 和 `取消/不做`。
   - TODO 不是零散小工单；影响派发的 TODO 应先进入任务包判断，能和当前主线同窗口、同边界、同验证链路完成的应合入本波。
   - 总控可以把互不依赖、互不冲突、能独立验证且对需求设计、真实复测或后续验收有价值的任务安排给空闲窗口；不要为了利用窗口而制造空转。
   - 用户可以在需求或派发过程中调整 TODO；总控必须按最新 TODO 重算下一轮需求设计、目标阶段确认、wave 顺序和发送名单。
   - 长期规则见 `docs/workspace/todo-window-scheduling-policy.md`。

9. 测试验证分派
   - 需要真实项目测试、冷启动监控、复现、smoke 或回归时，总控不得直接执行测试。
   - 先在 `docs/workspace/current/alembic-test-exchange.md` 按统一模板创建测试单，写清目标、范围、禁止事项、观察点和回填要求。
   - 只有测试单状态为 `待启动`，才把 `AlembicTest` 标为可发送窗口。
   - `AlembicTest` 回填后，总控只做证据验收和后续分派判断。
   - 长期规则见 `docs/workspace/alembic-test-exchange-policy.md`。

10. 输出可复制提示词
   - 只输出当前 wave 中应发送窗口的提示词。
   - 提示词必须要求执行窗口先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库 `AGENTS.md`，并先声明当前窗口定位和本轮仓库职责。
   - 状态为 `阻塞`、`观察中`、`无任务`、`暂停`、`已完成`、`待验收` 的窗口不发送。

11. Wave 验收
   - 总控验收必须检查功能完整性，不能只检查最小接口连接或测试命令通过。
   - 验收时确认真实入口、真实数据来源、真实状态变化、真实消费方、错误 / 边界路径和用户可执行验证。
   - 如果实现只是空壳 API、静态 mock、未被消费的 contract、只改类型 / 导出、或没有用户可用路径，不能标为已完成。
   - 如果发现最小实现，必须新开一轮“非最小完整实现补齐”任务，补齐真实入口、真实数据、真实状态变化、真实消费方和用户可执行验证后，才能继续下游。
   - 如果当前计划有 TODO / Backlog，验收时必须同步滚动 TODO 状态：已修复、转下波、阻塞、取消 / 不做、优先级调整或新增事项。

12. Workspace 提交节奏
   - AlembicWorkspace 默认按阶段 / wave 稳定点批量提交：总控验收完成、下一波派发稳定、归档收口、脚本 / 模板治理完成，或用户明确要求提交时再提交。
   - 窗口零散回填、状态快照、小范围 TODO 滚动和临时派发调整先保留在工作区继续滚动；不要每个窗口回填或每次状态小改都单独提交。
   - 提交前必须完成去重、索引修正、状态一致性检查和必要脚本校验，只 stage workspace 自身文档、脚本、模板或 skill 资产。

## 强化检查点

- 需求是否是完整功能模块，而不是抽象连接。
- 需求设计的阶段是否仍然只是候选方向。
- 是否已有足够代码证据支撑最终阶段顺序。
- 是否逐一覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`；真实测试项目只作为 `AlembicTest` 的目标项目，不作为独立派发窗口。
- producer / consumer 是否清晰：上游 contract / API / artifact / evidence 未完成前，下游不得猜字段。
- 验收是否覆盖功能完整性：真实入口、真实数据、真实状态变化、真实消费方、失败路径和用户可操作验证。
- 如果发现最小实现，是否已经创建非最小完整实现补齐 wave，而不是继续推进下游。
- 当前计划是否指向真正的 wave 执行文档，而不是还在等待确认的目标阶段文档。
- `发送给` 是否与 `待启动` / `执行中` 状态一致。
- 可复制提示词是否包含 `AGENTS.md` 读取要求和“定位”声明要求。
- 是否运行 `node scripts/verify-workspace-docs.mjs --all-workspace`、`node scripts/check-dispatch-coverage.mjs` 和 `git diff --check`。
- 使用 TODO 子模式影响派发或下一波顺序的计划是否运行 `node scripts/check-todo-board.mjs --require`，并且 TODO / 空闲窗口调度没有缺失。
- 使用任务包派发或主线动作与 TODO 合并派发的计划是否运行 `node scripts/check-task-packages.mjs --require`，并且任务包没有缺失阶段目标、主线动作、合并 TODO、明确不包含事项、阻塞 / 依赖、验证命令和回填要求。

## 文档关系

- 需求目录保存原始计划书、需求设计、代码实现依赖调研。
- `docs/workspace/current/` 保存目标阶段确认、wave 执行计划、当前状态、活跃 TODO 和当前测试交流面。
- `docs/workspace/` 根层级保存唯一索引、长期规则、长期契约和长期记录地图。
- `docs/<Repo>/` 保存单仓库执行回填文档。
- `templates/` 保存可复用模板；具体执行文档复制模板后落到需求目录或 `docs/workspace/current/`。
- `docs/workspace/index.md` 永远指向当前实际入口；确认阶段指向目标阶段确认，执行阶段指向当前 wave 执行计划。
