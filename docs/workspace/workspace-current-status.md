# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：AIP-0 已完成，当前准备派发 `AlembicPlugin` 执行 AIP-1

## 状态摘要

用户确认功能完成，要求进行文档归档并准备下一条 TODO 主线。总控已经把两条完成主线收口为历史归档：

- prime immediate receipt shout 计划已归档到 [archive/2026-05/prime-immediate-receipt-shout/](archive/2026-05/prime-immediate-receipt-shout/)；SHOUT-7 已通过总控验收，用户确认不新增 AlembicTest 复测。
- resident vector search release 计划已归档到 [archive/2026-05/resident-vector-search-release/](archive/2026-05/resident-vector-search-release/)；Test-2026-05-22-01 通过，Plugin cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`。

当前新主线是 [alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)：长线删除 `AlembicPlugin` 中旧内置第三方 AI 能力残留。用户已补充确认，Plugin 侧 AI 配置来自早期“整体做成 Codex 插件”的路线；现在产品已改为 Codex 插件 + Alembic 主体模式，所以 Plugin 侧旧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围。AIP-0 总控真实调用方扫描已完成，当前只派发 `AlembicPlugin` 执行 AIP-1。

当前已确认的代码事实：

- `AlembicPlugin/lib/codex/HostAiAdapter.ts` 仍保留 `HostAiProvider` 可执行 provider 外形，包含 `chat()` / `embed()` / `probe()` 等方法。
- `AiModule` 仍把 `aiProvider` 与 `_embedProvider` 同步进 DI，`KnowledgeModule` 仍把 `_embedProvider || aiProvider` 传给 Core search / indexing。
- HTTP `/ai/*` routes 与 MCP `alembic_codex_ai_config` 仍提供 AI 配置 / 状态 surfaces；按最新用户口径，这些是重点删除候选，只有短期兼容需要时才允许 fail-closed 边界提示。
- `Preflight`、`AiConfigState`、status / diagnostics / daemon health / system health、Plugin 内部 `DashboardOperations` 兼容 API、codex-session 测试模拟器和 runtime dist 也仍消费旧 Plugin AI config / provider manager。
- 用户确认 Plugin 已不直接引用 Dashboard；代码证据显示 Plugin 只做 Dashboard URL handoff，不构建、不打包、不服务 Dashboard 前端，因此本轮不派发 `AlembicDashboard`。
- 当前主闭环是删除 Plugin 旧 AI 配置与 provider runtime 后，Codex prime/search 继续工作，resident vector 增强仍可用，需要 AI 的 Alembic 主体能力回到 Alembic 主体配置入口。

- 当前发送窗口：`AlembicPlugin`。
- 当前不发送给：`Alembic`（观察中）、`AlembicCore`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（观察中）、`AlembicAgent`（无任务）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 保留 resident/internal AI 配置和 embedding 服务能力；当前不派发，只有 AIP-1 证明需要主体入口补文案或能力字段才启动。 |
| `AlembicCore`<br>无任务 | 暂无共享 contract 变更证据；Plugin 删除旧 provider 注入应在 Plugin adapter 层完成。 |
| `AlembicAgent`<br>无任务 | 本主线不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | Plugin 已不直接引用 Dashboard；本轮不改 Dashboard 源码。 |
| `AlembicPlugin`<br>待启动 | 当前主实现窗口：删除旧 AI provider runtime / config surfaces / status permission surfaces，并更新 tests、Skill / README、runtime artifact。 |
| `AlembicTest`<br>观察中 | 当前无测试单；产品变更完成后再判断是否需要真实 Codex / BiliDili 验证。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码，只可能作为后续测试对象。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md，按照 AIP-1 领取并完成分配给 AlembicPlugin 窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 当前总控计划：[alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)。
- 全局 TODO：[global-todo-board.md](global-todo-board.md) 的 `GTODO-2026-05-21-010` 已切入当前 AIP-1 派发态。
- AlembicPlugin SHOUT 执行记录：[../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md) 已记录 SHOUT-7 总控验收。
- AlembicPlugin resident vector 执行记录：[../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md](../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md) 已记录 VEC-2/VEC-3/VEC-4R/VEC-5R/VEC-6 相关证据。
- 2026-05-22：AIP-0 代码依赖调研完成；当前只派发 `AlembicPlugin`，`AlembicDashboard` 因 Plugin 不直接引用 Dashboard 而标为无任务。
