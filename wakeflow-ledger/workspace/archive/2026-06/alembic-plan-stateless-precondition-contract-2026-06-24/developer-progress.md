# Make alembic_plan a stateless precondition run before EACH cold-start/deep-scan/module-scan: draft returns only a byte-budget-bounded projectInfoTree pyramid (64KB stop-point) + all candidate dimensions with miningGuidance; Agent selects dimensions+scale for that one stage; confirm validates (no re-analysis, no DB) and returns single-stage planSelection; bootstrap/rescan require planSelection (gate storage-read deleted). DELETE the whole plan persistence layer (plans table/migration 012/PlanRepository/PlanLedgerService persistence/get/signature/version); RELOCATE the pure coverage-projection engine to a Recipe-domain module; git-diff checkpoint seeds from current HEAD; SOP+missionBriefing become fixed bindings from selected dimensions at generation. Developer-decision strict spec with per-field/interface/deletion/rewire file:line + per-phase pass criteria. Fixes the live 4.5MB draft. Supersedes pure-collection; reverses recipe-evolution plan-persistence. 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-plan-stateless-precondition-contract-2026-06-24 - Make alembic_plan a stateless precondition run before EACH cold-start/deep-scan/module-scan: draft returns only a byte-budget-bounded projectInfoTree pyramid (64KB stop-point) + all candidate dimensions with miningGuidance; Agent selects dimensions+scale for that one stage; confirm validates (no re-analysis, no DB) and returns single-stage planSelection; bootstrap/rescan require planSelection (gate storage-read deleted). DELETE the whole plan persistence layer (plans table/migration 012/PlanRepository/PlanLedgerService persistence/get/signature/version); RELOCATE the pure coverage-projection engine to a Recipe-domain module; git-diff checkpoint seeds from current HEAD; SOP+missionBriefing become fixed bindings from selected dimensions at generation. Developer-decision strict spec with per-field/interface/deletion/rewire file:line + per-phase pass criteria. Fixes the live 4.5MB draft. Supersedes pure-collection; reverses recipe-evolution plan-persistence.
主状态: completed
阶段: 无
当前任务包: p0-core-plan-persistence-delete-relocate-engine-p1(accepted), p0-plugin-plan-persistence-consumer-cleanup-p1(accepted), p1-plugin-stateless-draft-two-block-projector-p1(accepted), p2-plugin-stateless-confirm-plan-selection-p1(accepted), p3-plugin-executor-planselection-gate-job-forwarding-p1(accepted), p3-plugin-executor-planselection-stage-compat-rework-1-p1(accepted), p4-core-checkpoint-current-head-primitives-p1(accepted), p4-plugin-checkpoint-routing-sop-briefing-p1(accepted), p5-test-bilidili-stateless-plan-e2e-p1(accepted), p5-core-plan-persistence-dist-residue-repair-p1(accepted), p5-test-bilidili-stateless-plan-e2e-after-core-repair-p1(accepted)
窗口: AlembicCore(accepted), AlembicPlugin(accepted), Test(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-24 10:01 CST
来源状态: revision 47 / event evt-20260624020145-0047
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md) [design](../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md) [design](../../../Design/docs/current/alembic-plan-stateless-precondition-contract-2026-06-24.md)

## 任务包

## 回填摘要

## 决策和追加日志
