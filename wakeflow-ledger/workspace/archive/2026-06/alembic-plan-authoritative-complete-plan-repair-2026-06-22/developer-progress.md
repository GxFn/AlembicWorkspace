# Alembic Plan 权威完整计划语义修复 进度

## Controller Status Correction (2026-06-22)

Status: **user-obsoleted / not in use / dispatch forbidden / pending official machine-state cancellation or obsoletion path**.

User instruction on 2026-06-22: this demand is no longer used. This state root is the earlier, too-narrow Plan repair root. Wakeflow MCP projection currently shows machine state `planned` rev 2 with one pending package, `p1-core-complete-plan-intent-repair-p1`, and dispatchCount=0. It must not be dispatched, claimed, repaired, or used as demand authority, because the user has since required the broader GPT5.5 fabrication/deletion repair demand: `wakeflow-ledger/requirement-designs/alembic-recipe-evolution-gpt55-fabrication-audit/gpt55-fabrication-delete-repair-demand-2026-06-22.md`.

The current Wakeflow MCP surface does not expose a safe cancel/obsolete/remove-pending-package tool, so the machine state is intentionally left untouched. Do not hand-edit `wakeflow-state.json` to fake cancellation. Do not use the generated `prepare-dispatch` next step below as authority; it is stale and invalid after the user's not-in-use decision.

Excluded from this cleanup: `Design/docs/current/alembic-recipe-plan-no-guess-correction-2026-06-22.md`.

## 统一状态

<!-- unified-status:start -->
需求: alembic-plan-authoritative-complete-plan-repair-2026-06-22 - Alembic Plan 权威完整计划语义修复
主状态: planned
阶段: 无
当前任务包: p1-core-complete-plan-intent-repair-p1(pending)
窗口: AlembicCore(pending)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-22 17:01 CST
来源状态: revision 2 / event evt-20260622090105-0002
<!-- unified-status:end -->

## 目标

修复 alembic-recipe-evolution-optimization-2026-06-21 验收后发现的核心语义偏差：alembic_plan 的 Plan 不是推荐列表、top-N 或测试子集，而是用于后续冷启动、深挖、单模块挖掘和进化维护的完整权威计划。Plan intent 必须覆盖完整项目计划、阶段目标、模块绑定、维度/领域/工具执行计划与预算；testMode/selectedDimensions/scaleOverride/moduleScope 只能作为执行 overlay，不能缩窄、替代或改写 Plan 本体。

## 完成定义

修复需求只有在以下全部满足时完成：1. Core Plan draft information package 不再把 recommendedDimensions/top/list slice 当作 Plan intent，必须从完整 ProjectContext、动态信号、内置 SOP、领域 registry 和工具菜单形成完整 project-wide Plan intent；recommendation/top 只能作为 planningBrief 辅助证据。2. Plan confirm 接受并持久化内置 Agent 制定的完整计划载荷，保留完整 dimensions、moduleBindings、stages、plannedNextActions、scale/budget、rationale/evidenceRefs；selectedDimensions/test subset 只能作为 execution overlay 或确认时的审阅字段，不能删除未执行维度/模块/阶段目标。3. plans 表仍只持久 intent，generation-state 继续从 DB 投影，不新增双写。4. bootstrap/rescan/moduleMining 三段 gate 消费完整 confirmed Plan，根据 generationStage 读取对应阶段目标；testMode 的 bounded dimensions/scale/moduleScope 只能限制本次执行，Plan get 返回的 active Plan 仍保持完整。5. Plugin public alembic_plan draft/confirm/get 输出清晰区分 completePlan/intent 与 executionSelection/recommendations，避免把推荐或 top 结果呈现为权威 Plan。6. 新增单元/集成测试覆盖：完整计划持久化、confirm 不缩窄、testMode 不污染 Plan、三段读取完整 Plan 对应阶段、BiliDili/fixture 上 Plan 覆盖真实 Swift/UI/networking/concurrency/module signals 且不是语言单因子或 top-N。7. 真实 BiliDili 测试模式重跑：alembic_plan get 必须显示完整计划；随后以 scoped overlay 执行小规模链路，并证明 overlay 未改写完整 Plan；commit-driven evolution/向量降级仍保留原 RG-10 已验收能力。8. 不改四工具对外 MCP 业务语义、不重建 daemon/watch、不删除证据/提案/向量结构、不启动主体 follow-on。

## 阶段计划

P0 控制器证据审计：记录原完成结论撤回原因，核实 Core/Plugin 当前 Plan 语义偏差与具体入口。P1 AlembicCore 修复 Plan intent/ledger：完整计划 schema/构建/投影/测试，recommendation/top 降为辅助。P2 AlembicPlugin 修复 alembic_plan confirm/get/public output：完整计划载荷、execution overlay 分离、输出契约更新、测试。P3 AlembicPlugin 修复 Plan-driven generation gate：bootstrap/rescan/moduleMining 消费完整 Plan，testMode 不污染 Plan。P4 Test 真实 BiliDili 验收：证明完整 Plan + scoped overlay + 已有进化/向量链路全绿。P5 控制器最终验收/归档：只有 P1-P4 raw evidence 全部满足后才可完成。

## 任务包

## 回填摘要

## 决策和追加日志
