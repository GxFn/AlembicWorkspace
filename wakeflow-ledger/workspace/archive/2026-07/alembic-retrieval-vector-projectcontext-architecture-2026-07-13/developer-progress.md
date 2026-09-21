# 按已确认架构修复 BiliDili 英文召回，拆分 Core 向量读写/检索端口，并在 Plugin 落地可取消、可续取、Graph/Recipe Map 共用的临时 ProjectContextBuildSession；Core 先、Plugin 后，controller 双项目只读验收。 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-retrieval-vector-projectcontext-architecture-2026-07-13 - 按已确认架构修复 BiliDili 英文召回，拆分 Core 向量读写/检索端口，并在 Plugin 落地可取消、可续取、Graph/Recipe Map 共用的临时 ProjectContextBuildSession；Core 先、Plugin 后，controller 双项目只读验收。
主状态: intake
阶段: 无
当前任务包: 无
窗口: 无
阻塞项: 无
下一步: 由总控判断定义阶段和任务包。
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-07-13 11:20 CST
来源状态: revision 2 / event evt-20260713032017-0002
<!-- unified-status:end -->

## 目标

Deliver the requirement described by the delivered docs: `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-original-plan-2026-07-13.md`, `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-requirement-design-2026-07-13.md`

## 完成定义

Total control confirms the completion definition from the delivered docs before dispatch.

## 阶段计划

Derive the stage plan from the delivered docs: `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-original-plan-2026-07-13.md`, `Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-requirement-design-2026-07-13.md`

## 任务包

## 回填摘要

## 决策和追加日志

## Decisions And Append Log

- 2026-07-13T03:21:58.326Z demand cancelled — Initial controller claim stamped the default AlembicWorkspace controllerWindow onto an isolated-placement demand; pod_open correctly refused it. No task package, dispatch, product edit, or evidence exists, so cancel this empty misclaimed root before append-only recovery delivery.
- 2026-07-13T03:22:07.164Z archived → wakeflow-ledger/workspace/archive/2026-07/alembic-retrieval-vector-projectcontext-architecture-2026-07-13 — Archive the empty cancelled intake root created with an invalid isolated-pod controllerWindow so the append-only recovery delivery can proceed cleanly.
