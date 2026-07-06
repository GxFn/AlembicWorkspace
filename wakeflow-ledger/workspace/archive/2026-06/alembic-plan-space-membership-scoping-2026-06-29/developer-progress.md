# 删除所有 Alembic 中 workspace.config.json 代码逻辑、把原生 ProjectScope（~/.asd/project-scopes.json）提升为前置（chokepoint=新增 fromProjectScopeRegistry，迁移 19 个 fromProject 站点）、插件在成员子仓调用时能拿整空间 Recipe、修复全 5 仓项目空间使用逻辑；§11 权威设计 + §12 代码级分阶段实现指南（P0-P4 + 每阶段可运行验收 + 真机 ecf32806）。最危险纪律：写侧 /tmp 碰撞 + 删除硬门。 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-plan-space-membership-scoping-2026-06-29 - 删除所有 Alembic 中 workspace.config.json 代码逻辑、把原生 ProjectScope（~/.asd/project-scopes.json）提升为前置（chokepoint=新增 fromProjectScopeRegistry，迁移 19 个 fromProject 站点）、插件在成员子仓调用时能拿整空间 Recipe、修复全 5 仓项目空间使用逻辑；§11 权威设计 + §12 代码级分阶段实现指南（P0-P4 + 每阶段可运行验收 + 真机 ecf32806）。最危险纪律：写侧 /tmp 碰撞 + 删除硬门。
主状态: intake
阶段: 无
当前任务包: 无
窗口: 无
阻塞项: 无
下一步: 由总控判断定义阶段和任务包。
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-29 11:06 CST
来源状态: revision 2 / event evt-20260629030636-0002
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: [plan](../../../Design/docs/current/alembic-plan-space-membership-scoping-original-plan-2026-06-29.md) [design](../../../Design/docs/current/alembic-plan-space-membership-scoping-2026-06-29.md)

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: [plan](../../../Design/docs/current/alembic-plan-space-membership-scoping-original-plan-2026-06-29.md) [design](../../../Design/docs/current/alembic-plan-space-membership-scoping-2026-06-29.md)

## 任务包

## 回填摘要

## 决策和追加日志
