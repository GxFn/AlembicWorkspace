# 跨四仓 Recipe 生命周期架构重构=语义命名+文件夹隔离+功能层级下沉/上浮，链尾最后一个需求。文档分层权威：§-1(2026-06-27 re-ground:多处已 land 翻牌)+§11(整体架构设计:职责语义/god-file 拆分 5 处/layer×role 命名方案/7 隔离门/§11.H Core repo+持久化)+§11.I(cold-start↔knowledge-rescan Core 折叠到 project-index/mode full/incremental)+**§12 实现指导(code-level,doc 1060 行)**:§12.0 6 链双宿主锚定表(host-agent‖in-process‖Core 脊‖共享/分歧锁)、§12.1 orchestrator 统一(每宿主一个 runProjectIndexWorkflow(mode)，不跨宿主单函数；round 循环是 caller 不吸收)、§12.2 P1-P15(COLD P1-4/HOT P5-12/LATE-L2 P13-14/FREEZE P15，每阶段 scope/batch/deps/代码级/验收+REAL-TEST)、§12.3 BiliDili 6 链真测(沙箱忠实副本+双宿主 parity predicate+G0-G6 gate)、§12.4 安全声明。CG-1~8+CG-A/B/C 全闭(CG-B INDEX 内部名/CG-A 路径豁免/CG-C 先 scan)。头号陷阱 R-2 cleanup.projectRoot(full 按 executor·incremental 恒 dataRoot)wipe 错目录→保原 ternary。freeze:PlanStageId 枚举/job kind/source/response.tool/lifecycle/coverage_ledger 列/export path 全 doc-only。**realverify 代码门已清**(finding#1 已 land 主体 1f141c8、CG-3=B sink Core 934d043;用户标 realverify completed)；**realverify 真机覆盖验证已折叠进本需求 §12.3 G4**(in-process cell 翻 non-empty 对真 02a25032)。控制器须按 G0-G6 序、每 Core 行 vendor-repin、REAL-TEST@P6/9/10/11/12/13、不为整洁过度改、不破 freeze。 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26 - 跨四仓 Recipe 生命周期架构重构=语义命名+文件夹隔离+功能层级下沉/上浮，链尾最后一个需求。文档分层权威：§-1(2026-06-27 re-ground:多处已 land 翻牌)+§11(整体架构设计:职责语义/god-file 拆分 5 处/layer×role 命名方案/7 隔离门/§11.H Core repo+持久化)+§11.I(cold-start↔knowledge-rescan Core 折叠到 project-index/mode full/incremental)+**§12 实现指导(code-level,doc 1060 行)**:§12.0 6 链双宿主锚定表(host-agent‖in-process‖Core 脊‖共享/分歧锁)、§12.1 orchestrator 统一(每宿主一个 runProjectIndexWorkflow(mode)，不跨宿主单函数；round 循环是 caller 不吸收)、§12.2 P1-P15(COLD P1-4/HOT P5-12/LATE-L2 P13-14/FREEZE P15，每阶段 scope/batch/deps/代码级/验收+REAL-TEST)、§12.3 BiliDili 6 链真测(沙箱忠实副本+双宿主 parity predicate+G0-G6 gate)、§12.4 安全声明。CG-1~8+CG-A/B/C 全闭(CG-B INDEX 内部名/CG-A 路径豁免/CG-C 先 scan)。头号陷阱 R-2 cleanup.projectRoot(full 按 executor·incremental 恒 dataRoot)wipe 错目录→保原 ternary。freeze:PlanStageId 枚举/job kind/source/response.tool/lifecycle/coverage_ledger 列/export path 全 doc-only。**realverify 代码门已清**(finding#1 已 land 主体 1f141c8、CG-3=B sink Core 934d043;用户标 realverify completed)；**realverify 真机覆盖验证已折叠进本需求 §12.3 G4**(in-process cell 翻 non-empty 对真 02a25032)。控制器须按 G0-G6 序、每 Core 行 vendor-repin、REAL-TEST@P6/9/10/11/12/13、不为整洁过度改、不破 freeze。
主状态: planned
阶段: 无
当前任务包: g1-pre-bilidili-baseline-p1(accepted), p1-rg9-stub-isolation-audit-p1(accepted), p2-freeze-register-p1(accepted), p3-appruntime-rename-p1(accepted), p4-completeness-critic-coverage-split-p1(accepted), p5-core-project-index-aliases-p1(accepted), p6-deep-mining-round-gate-split-p1(accepted), p6-bilidili-deep-mining-realtest-p1(accepted), p6-full-reset-coverage-ledger-cleanup-repair-p1(accepted), p6-bilidili-deep-mining-realtest-rerun-after-full-reset-repair-p1(accepted), p7-plan-confirm-split-p1(accepted), p8-project-context-workflow-facts-split-p1(accepted), p9-core-project-index-collapse-coverage-unify-p1(accepted), p9-bilidili-project-index-parity-realtest-p1(accepted), p10-alembic-run-project-index-workflow-unify-p1(accepted), p10-plugin-run-project-index-workflow-unify-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-p1(accepted), p10-plugin-coverage-ledger-seed-output-repair-p1(accepted), p10-alembic-deep-mining-round-parity-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-repairs-p1(accepted), p10-plugin-host-rescan-seed-session-repair-p1(accepted), p10-alembic-deep-mining-scope-alias-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-source-repairs-p1(accepted), p10-plugin-nopadding-session-cleanup-real-route-repair-p1(accepted), p10-alembic-root-module-scope-alias-real-route-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-combined-source-repairs-p1(accepted), p10-plugin-coverage-ledger-module-axis-normalization-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-module-axis-repair-p1(accepted), p10-plugin-coverage-ledger-target-axis-hardening-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-target-axis-hardening-p1(accepted), p10-plugin-full-reset-corrupt-db-recovery-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-full-reset-corrupt-db-repair-p1(accepted), p10-alembic-full-reset-corrupt-db-live-route-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-p1(accepted), p10-bilidili-project-index-workflow-unify-realtest-rerun-after-data-root-sqlite-repair-p1(accepted), p10-bilidili-no-preclean-parity-rerun-p1(accepted), p10-alembic-host-cold-start-session-completion-repair-p1(accepted), p10-bilidili-post-session-cleanup-rerun-p1(accepted), p10-alembic-rescan-cancellation-cleanup-repair-p1(accepted), p10-bilidili-post-rescan-cancellation-cleanup-rerun-p1(accepted), p10-alembic-daemon-rescan-coverage-seed-output-repair-p1(accepted), p10-bilidili-seed-output-no-preclean-rerun-after-alembic-repair-p1(accepted), p11-alembic-module-mining-binding-rich-selector-p1(accepted), p11-bilidili-module-mining-binding-rich-realtest-p1(pending)
窗口: Test(pending), AlembicPlugin(accepted), AlembicWorkspace(accepted), Alembic(accepted), AlembicCore(accepted)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: decision-accept
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-28 19:02 CST
来源状态: revision 166 / event evt-20260628110217-0166
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](../../../Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-original-plan-2026-06-26.md) [design](../../../Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](../../../Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-original-plan-2026-06-26.md) [design](../../../Design/docs/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md)

## 任务包

## 回填摘要

## 决策和追加日志
