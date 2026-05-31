# Global TODO Completed Archive

归档日期：2026-05-31
来源：../../../../../codex-control-workspace/.workspace-active/workspace/current/global-todo-board.md

本文件保存从 `.workspace-active/workspace/current/global-todo-board.md` 压缩下来的已完成 TODO 和旧同步记录。活动项和观察项仍留在全局 TODO 列表。

## 已完成 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CODEX-DIRECT-THREAD-DISPATCH-2026-05-31 | 已完成 | automation flow transport | P1 | `codex-control-workspace` / `AlembicWorkspace` | 将 Codex Automation Closed Loop 默认 transport 从旧 1 分钟 automation 投递改为 direct thread dispatch only；线程投递作为正常工作流水线；automation-enabled 时 continuous loop + keep-live；子窗口 runtime 文件配置与脚本 runtime contract 已实现，target direct-thread、controller-return current-thread 和 bounded continuous automation + keep-live smoke 均已通过；历史 runtime 已清理。 | 否 | Design 已验证 host `send_message_to_thread` idle / busy / invalid 行为；用户裁决清理旧投递路线和旧 runtime；runtime 计数已归零，当前职责窗口 thread registry / window-config 已保留。 | `AlembicWorkspace` | [archive](../codex-direct-thread-dispatch/codex-direct-thread-dispatch-workspace-plan-2026-05-31.md) |

## 旧同步记录

## 追加已完成 TODO（2026-05-31）

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR-2026-05-31 | 已完成 | plugin architecture interface refactor | P1 | `AlembicPlugin` | 按功能和接口边界重构 AlembicPlugin；Stage 0 dossier 与 Stage 1+ implementation wave 均已通过总控复核。 | 否 | AlembicPlugin commit `646c034`；runtime 子仓库 commit `6ceefca`；总控复跑 targeted tests、build、lint、repo-boundary、plugin/channel/session verify、plugin smoke 和 diff check 均通过。 | 无 | [archive](../plugin-architecture-interface-refactor/plugin-architecture-interface-refactor-workspace-plan-2026-05-31.md) |
