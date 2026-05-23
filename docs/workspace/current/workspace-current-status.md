# AlembicWorkspace Current Status

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：空闲，文档归档逻辑已优化，发送给无

## 状态摘要

当前没有执行中的跨仓库计划，发送给无。

近期完成主线、历史计划、已完成 TODO 和测试记录统一从 [workspace-record-map.md](../workspace-record-map.md) 查询；当前状态文档不直接挂具体归档文件。

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
- `GTODO-2026-05-23-019`：观察 `normalizeLifecycle` 是否需要成为 `@alembic/core/knowledge` public export。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 当前没有 Alembic 主体实现任务；后续若启动 resident service contract 或 daemon/API 清理，再另开计划。 |
| `AlembicCore`<br>观察中 | `normalizeLifecycle` additive readiness 已转入 `GTODO-2026-05-23-019`；未触发前不派发。 |
| `AlembicAgent`<br>无任务 | 当前不涉及 Agent runtime、provider、tool system 或执行循环。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI、API client、路由或前端状态。 |
| `AlembicPlugin`<br>无任务 | 当前没有 Codex MCP / Skill / channel / runtime artifact 变更。 |
| `AlembicTest`<br>无任务 | 本轮是 workspace 文档治理，不操作真实项目、不创建测试单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：无。

当前没有可复制提示词。后续若启动新主线，先在 `docs/workspace/current/` 新建当前计划，更新 `docs/workspace/index.md` 第一行，再按任务包派发。

## 回填区

- 2026-05-23：CCIC 总体验收已完成并归档，`GTODO-2026-05-22-018` 关闭，Core `normalizeLifecycle` additive readiness 转入 `GTODO-2026-05-23-019` 长期观察。
- 2026-05-23：执行 workspace 文档归档优化：完成主题归档、索引压缩、全局 TODO 完成项归档，并将本文件压缩为当前状态快照；历史流水记录统一进入长期记录地图。
- 2026-05-23：新增 `docs/workspace/current/` 短期工作区，当前状态、活跃 TODO、测试交流和后续执行计划统一放入该目录；根层级只保留长期入口和长期文档。
- 2026-05-23：完成 workspace 文档 / 长期规则 / 脚本 / 模板 / `AGENTS.md` 自洽审计，补充 `check-workspace-current-layout.mjs` 并接入 `verify-control-center`，防止短期文档路径回流到根层级。
