# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：已归档完成主线，当前准备启动 `GTODO-2026-05-21-010`

## 状态摘要

用户确认功能完成，要求进行文档归档并准备下一条 TODO 主线。总控已经把两条完成主线收口为历史归档：

- prime immediate receipt shout 计划已归档到 [archive/2026-05/prime-immediate-receipt-shout/](archive/2026-05/prime-immediate-receipt-shout/)；SHOUT-7 已通过总控验收，用户确认不新增 AlembicTest 复测。
- resident vector search release 计划已归档到 [archive/2026-05/resident-vector-search-release/](archive/2026-05/resident-vector-search-release/)；Test-2026-05-22-01 通过，Plugin cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`。

当前新主线是 [alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)：长线删除 `AlembicPlugin` 中旧内置第三方 AI 能力残留。用户已补充确认，Plugin 侧 AI 配置来自早期“整体做成 Codex 插件”的路线；现在产品已改为 Codex 插件 + Alembic 主体模式，所以 Plugin 侧旧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围。现阶段是 AIP-0，总控先做真实调用方扫描和删除边界设计，不向实现窗口发送提示词。

当前已确认的代码事实：

- `AlembicPlugin/lib/codex/HostAiAdapter.ts` 仍保留 `HostAiProvider` 可执行 provider 外形，包含 `chat()` / `embed()` / `probe()` 等方法。
- `AiModule` 仍把 `aiProvider` 与 `_embedProvider` 同步进 DI，`KnowledgeModule` 仍把 `_embedProvider || aiProvider` 传给 Core search / indexing。
- HTTP `/ai/*` routes 与 MCP `alembic_codex_ai_config` 仍提供 AI 配置 / 状态 surfaces；按最新用户口径，这些是重点删除候选，只有短期兼容需要时才允许 fail-closed 边界提示。
- 当前主闭环是删除 Plugin 旧 AI 配置与 provider runtime 后，Codex prime/search 继续工作，resident vector 增强仍可用，需要 AI 的 Alembic 主体能力回到 Alembic 主体配置入口。

- 当前发送窗口：无。
- 当前不发送给：`AlembicPlugin`（观察中，等待 AIP-0）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`AlembicAgent`（无任务）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 可能保留 resident/internal AI 配置和 embedding 服务能力；AIP-0 前不派发。 |
| `AlembicCore`<br>观察中 | 暂无共享 contract 变更证据；等 AIP-0 调研。 |
| `AlembicAgent`<br>无任务 | 本主线不改 Agent runtime。 |
| `AlembicDashboard`<br>观察中 | 可能受 HTTP `/ai/*` 可见文案 / schema 影响；等 AIP-0 调研。 |
| `AlembicPlugin`<br>观察中 | 最终实现主窗口，但当前等待总控删除边界调研，不提前删除代码。 |
| `AlembicTest`<br>观察中 | 当前无测试单；产品变更完成后再判断是否需要真实 Codex / BiliDili 验证。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码，只可能作为后续测试对象。 |

## 可复制提示词

发送给：无。

当前不要给任何执行窗口发送提示词。下一步由总控完成 AIP-0 调研后，再决定是否派发 `AlembicPlugin` 或其它窗口。

## 回填区

- 当前总控计划：[alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)。
- 全局 TODO：[global-todo-board.md](global-todo-board.md) 的 `GTODO-2026-05-21-010` 已切入当前主线准备态。
- AlembicPlugin SHOUT 执行记录：[../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md) 已记录 SHOUT-7 总控验收。
- AlembicPlugin resident vector 执行记录：[../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md](../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md) 已记录 VEC-2/VEC-3/VEC-4R/VEC-5R/VEC-6 相关证据。
