# Global TODO Completed Archive

归档日期：2026-06-04
来源：../../../../../codex-control-workspace/.workspace-active/workspace/current/global-todo-board.md

本文件保存从 `.workspace-active/workspace/current/global-todo-board.md` 压缩下来的已完成 TODO 和旧同步记录。活动项和观察项仍留在全局 TODO 列表。

## 已完成 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLUGIN-PRIME-TRUST-RECEIPT-2026-06-02 | 已完成 | Plugin prime visible receipt contract | P1 | `AlembicPlugin` | 让 `alembic_task(operation=prime)` 的 developer-visible receipt 明确表达信任哪些材料、遵守哪些 guard / rule、使用哪些 Recipe / pattern / context，以及哪些只是 context / candidate / degraded / requires verification，防止“收到 / 接收到了”式空 receipt。 | 否 | AlembicPlugin source/runtime/package 证据和 Codex host reload 后 prime 复验通过；当前可归档。 | 无 | [archived plan](../plugin-prime-trust-receipt/plugin-prime-trust-receipt-workspace-plan-2026-06-02.md) |
| PLUGIN-MCP-MULTI-PROJECT-RUNTIME-2026-06-03 | 已完成 | runtime reliability / multi-project MCP contract | P1 | `AlembicWorkspace` / `AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicTest` | 收敛 Codex Plugin MCP 多项目 startup / project identity / daemon restart / ProjectScope handoff：`entry mode -> current real folder -> ghost project identity/dataRoot -> project space membership -> required service -> readiness/failure envelope`；固化 per-window prime、canonical local-dev restart/reload、packaged wrapper/runtime.tgz 和统一 fail-closed。 | 否 | AlembicTest P7 raw evidence 通过；PMMPR 当前完成定义已满足，automation / keep-live 已停止。 | 无 | [archived plan](../plugin-mcp-multi-project-runtime/plugin-mcp-multi-project-runtime-workspace-plan-2026-06-03.md) |
| PLUGIN-CODEX-TASK-LIFECYCLE-REDESIGN-2026-06-03 | 已完成 | Plugin task lifecycle UX-contract | P1 | `AlembicWorkspace` / `AlembicPlugin` | 重设计 `alembic_task prime/create/close/guard` 触发策略：automation/card/direct-thread 不 raw prime，无明确代码修改任务不默认 create，无 task anchor 不 close，无 code-relevant scoped diff 不 Guard；真实代码修改仍保留 task trace 和 Guard compliance。 | 否 | AlembicPlugin 父仓 commit `81a6d2c45c10befe89c76a6431cc19eb7693d1ed` 与 runtime 子仓 commit `a9840e6f6df824e7c82fda3f6eba0a31066accab` 已通过总控复核；automation / keep-live 已停止。 | 无 | [archived plan](../plugin-codex-task-lifecycle-redesign/plugin-codex-task-lifecycle-redesign-workspace-plan-2026-06-03.md) |

## 旧同步记录
