# 把完整 Recipe 生成规则+契约+逐字段含义与生成规则+可过门富范例 汇总为独立解耦通用模块 RecipeAuthoringSpec（Core domain/knowledge，经 @alembic/core/knowledge，domain 层 lint 强制解耦无环）；两路(host-agent + in-process 主体 AI)全打平=统一 validateAgainst+renderGuidance，context-profile(cold-start严/opportunistic轻)+ports注入+fieldSuppliers；生成前 front-load 逐字段{含义、生成规则、示例值}全表+profile+gate-clean富范例+失败模式（gate退安全网/契约成指令路径，不靠打回）。门禁字节级不变(只改 agent 看到什么)。最危险纪律：§13.C.1 范例必须新写 gate-clean(旧 EXAMPLE_TEMPLATES 全过不了门)+stage-2 拆分(纯谓词进 Core/fs+session 经 port)+L4 内链加门排 L2 后。CG-1~4/D-A/D-B/严格度=profile/全打平 全决。 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-recipe-authoring-guidance-optimization-2026-06-29 - 把完整 Recipe 生成规则+契约+逐字段含义与生成规则+可过门富范例 汇总为独立解耦通用模块 RecipeAuthoringSpec（Core domain/knowledge，经 @alembic/core/knowledge，domain 层 lint 强制解耦无环）；两路(host-agent + in-process 主体 AI)全打平=统一 validateAgainst+renderGuidance，context-profile(cold-start严/opportunistic轻)+ports注入+fieldSuppliers；生成前 front-load 逐字段{含义、生成规则、示例值}全表+profile+gate-clean富范例+失败模式（gate退安全网/契约成指令路径，不靠打回）。门禁字节级不变(只改 agent 看到什么)。最危险纪律：§13.C.1 范例必须新写 gate-clean(旧 EXAMPLE_TEMPLATES 全过不了门)+stage-2 拆分(纯谓词进 Core/fs+session 经 port)+L4 内链加门排 L2 后。CG-1~4/D-A/D-B/严格度=profile/全打平 全决。
主状态: planned
阶段: 无
当前任务包: p0-recipe-authoring-spec-module(accepted), p0b-core-module-build(accepted), p1-plugin-gate-repoint(accepted), p1-core-stage3-repoint(accepted), p1-core-profile-model(accepted), p1-agent-inprocess-flatten(accepted), p1-mainbody-inprocess-repoint(accepted), p1-mainbody-aiscan-gate(accepted), p2-core-builder-checklist-collapse(accepted), p2-plugin-coldstart-frontload(accepted), p3-core-examples(accepted), p4-core-drift-parity(accepted), p4-plugin-drift-parity(accepted), p4-agent-inprocess-parity(accepted), p5-realmachine-coldstart-acceptance(accepted)
窗口: AlembicCore(accepted), AlembicPlugin(accepted), AlembicAgent(accepted), Alembic(accepted), AlembicWorkspace(accepted)
阻塞项: 无
下一步: add-task-package, complete-demand, wakeflow-render-progress
评审: decision-accept
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-30 12:50 CST
来源状态: revision 59 / event evt-20260630044952-0059
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](../../Design/docs/current/alembic-recipe-authoring-guidance-optimization-original-plan-2026-06-29.md) [design](../../Design/docs/current/alembic-recipe-authoring-guidance-optimization-2026-06-29.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](../../Design/docs/current/alembic-recipe-authoring-guidance-optimization-original-plan-2026-06-29.md) [design](../../Design/docs/current/alembic-recipe-authoring-guidance-optimization-2026-06-29.md)

## 任务包

## 回填摘要

## 决策和追加日志
