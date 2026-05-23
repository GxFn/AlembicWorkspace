# AlembicWorkspace Current Status

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：空闲，发送给无

## 状态摘要

小问题修复 / 清理修复主线已完成总控验收并归档到 [small-fix-cleanup](../archive/2026-05/small-fix-cleanup/)。

当前没有执行中的 workspace 总控计划；后续启动新功能时，在 `docs/workspace/current/` 新建新的总控文档，并从 [index.md](../index.md) 切换当前入口。

近期完成主线、历史计划、已完成 TODO 和测试记录统一从 [workspace-record-map.md](../workspace-record-map.md) 查询；当前状态文档只保留当前发送名单和活跃观察项。

长期生效入口：

- [全局职责功能划分长期契约](../alembic-repository-responsibility-function-boundary-contract.md)。
- [全局职责功能划分方案](../alembic-global-responsibility-function-division-scheme.md)。
- [Plugin first 增强契约](../alembic-plugin-first-enhancement-contract.md)。
- [全局 TODO 列表](global-todo-board.md)。
- [Workspace 文档归档规则](../workspace-doc-archive-policy.md)。

当前活跃观察 TODO：

- `GTODO-2026-05-21-003`：观察 prime / Recipe evidence projection 是否需要下沉为 Core 共享 contract。
- `GTODO-2026-05-21-004`：观察 Alembic resident service API / capability / contract version 是否需要进入后续主线。
- `GTODO-2026-05-21-005`：观察 Recipe evidenceRef 行号级证据是否需要补强。
- `GTODO-2026-05-23-019`：Core 已导出 `normalizeLifecycle`；继续观察 Alembic test-only allowance 是否需要 consumer 收敛。
- `GTODO-2026-05-23-022`：Dashboard `src/api.ts` 剩余动态 contract `any` 类型化。
- `GTODO-2026-05-23-023`：Dashboard Mermaid async chunk 性能专项。
- `GTODO-2026-05-23-024`：AlembicAgent L4 compaction 低优等待用户再次提及。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 小问题修复 / 清理修复已验收；等待新功能目标。 |
| `AlembicCore`<br>观察中 | `GTODO-2026-05-23-019` 仅在后续 consumer 收敛目标触发时启动。 |
| `AlembicAgent`<br>观察中 | L4 compaction 当前不处理，低优等待用户再次提及。 |
| `AlembicDashboard`<br>观察中 | `GTODO-2026-05-23-022` / `GTODO-2026-05-23-023` 等待后续 Dashboard contract typing 或性能目标触发。 |
| `AlembicPlugin`<br>无任务 | 小问题修复 / 清理修复已验收；等待新功能目标。 |
| `AlembicTest`<br>无任务 | 当前无测试单；真实项目测试仍通过测试交流文档派发。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：无

当前无可复制执行提示词；没有 `待启动` 或 `执行中` 的窗口。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 回填区

- 2026-05-23：小问题修复 / 清理修复主线完成归档；四份 workspace current 执行文档已移动到 `docs/workspace/archive/2026-05/small-fix-cleanup/`，当前状态切回空闲。
