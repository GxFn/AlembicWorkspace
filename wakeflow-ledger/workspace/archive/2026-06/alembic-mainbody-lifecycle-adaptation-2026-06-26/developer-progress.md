# plan 作主体 AI Agent 正交前置组件(新 AgentProfile+runPlanAgent，方案 A)；coldStart 接线/deepMining 单 job 多轮/moduleMining per-cell fan-out/evolution 宿主接线(Core 零改)；PD-5 plan 硬 gate(失败 abort 不回退全量)；Core 补共享 applyPlanSelection 投影收敛 Plugin 双写；全 10 PD 闭合；A-F 全阶段代码级(§4b)。 进度

## Post-Archive Corrective Note

2026-06-27 controller intake correction: this archived demand remains a historical record of A-F code-level acceptance, but must not be treated as proof that the mainbody lifecycle adaptation was truly completed end to end. The follow-up demand `alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26` carries finding#1 as a fatal residual: deepMining coverage ledger per-cell writeback is missing, so coverage cells can remain `empty` with `coveredCount=0` and the `converged` path is unreachable. CD-6 true BiliDili real-machine verification was also not completed in this archived demand. The follow-up owns the finding#1 repair and first true BiliDili verification; A-F code implementation is not to be redone from this archive.

## 统一状态

<!-- unified-status:start -->
需求: alembic-mainbody-lifecycle-adaptation-2026-06-26 - plan 作主体 AI Agent 正交前置组件(新 AgentProfile+runPlanAgent，方案 A)；coldStart 接线/deepMining 单 job 多轮/moduleMining per-cell fan-out/evolution 宿主接线(Core 零改)；PD-5 plan 硬 gate(失败 abort 不回退全量)；Core 补共享 applyPlanSelection 投影收敛 Plugin 双写；全 10 PD 闭合；A-F 全阶段代码级(§4b)。
主状态: planned
阶段: 无
当前任务包: w1-core-planselection-foundation-p1(pending), w1-main-evolution-host-wiring-p1(pending)
窗口: AlembicCore(pending), Alembic(pending)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-27 09:52 CST
来源状态: revision 4 / event evt-20260627015240-0004
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](Design/docs/current/alembic-mainbody-lifecycle-adaptation-original-plan-2026-06-26.md) [design](Design/docs/current/alembic-mainbody-lifecycle-adaptation-2026-06-26.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](Design/docs/current/alembic-mainbody-lifecycle-adaptation-original-plan-2026-06-26.md) [design](Design/docs/current/alembic-mainbody-lifecycle-adaptation-2026-06-26.md)

## 任务包

## 回填摘要

## 决策和追加日志
