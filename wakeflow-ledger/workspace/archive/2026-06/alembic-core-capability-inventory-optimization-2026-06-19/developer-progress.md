# Alembic Core Capability Inventory And Interface Optimization 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-core-capability-inventory-optimization-2026-06-19 - Alembic Core Capability Inventory And Interface Optimization
主状态: planned
阶段: 无
当前任务包: co-0-core-precheck-inventory(accepted), co-1-core-public-api-gate-capability-replacement(accepted), co-2-core-replacement-capability-outputs(accepted), co-3a-alembic-consumer-capability-output-migration(accepted), co-3b-plugin-consumer-capability-output-migration(accepted), co-4-core-internalize-cleared-legacy-routes(accepted), co-5a-core-internal-optimization-rebaseline(accepted), co-5b-core-test-fixture-public-surface-support(accepted), co-5c-plugin-test-fixture-consumer-migration(needs-rework), co-5d-core-residual-test-fixture-support(pending)
窗口: AlembicCore(pending), Alembic(accepted), AlembicPlugin(needs-rework)
阻塞项: 无
下一步: prepare-dispatch-from-state, add-task-package, wakeflow-render-progress
评审: decision-rework
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-21 05:11 CST
来源状态: revision 45 / event evt-20260620211055-0045
<!-- unified-status:end -->

## 目标

按已确认 Design handoff 推进 AlembicCore 的能力导向统一输出层优化：先修/验证接口门禁，先给替代能力输出，再迁移 Alembic/AlembicPlugin consumer，最后内部化底层 AST/语言/散乱接口，并完成局部内部优化与跨仓验收。

## 完成定义

CO-6 完成：public-api 门禁绿，消费门禁三仓绿，AlembicCore/Alembic/AlembicPlugin build:check/test 绿；能力输出是能力导向而非 barrel；production 无内部化 AST 残留消费；在途波次未被打断；exports/DTO/预算/状态机/错误语义/持久化兼容未破。

## 阶段计划

执行序 CO-0 → CO-1 → CO-2 → CO-3 → CO-4 → CO-5 → CO-6。硬序：CO-2 先给替代能力输出且旧导出并存；CO-3 迁移 consumer；CO-4 再内部化收口，禁止裸断。CO-0 是硬前置：复核 CCR/RIC/GMAP/MTC/D25/CO3/SD-5 终态、接口门禁实况、跨仓 consumer 映射、RecipeContext 4 个无 consumer kind 去留。

## 任务包

## 回填摘要

## 决策和追加日志
