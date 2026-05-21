# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：AIP-1 总控验收通过，主线功能完成

## 状态摘要

用户确认功能完成，要求进行文档归档并准备下一条 TODO 主线。总控已经把两条完成主线收口为历史归档：

- prime immediate receipt shout 计划已归档到 [archive/2026-05/prime-immediate-receipt-shout/](archive/2026-05/prime-immediate-receipt-shout/)；SHOUT-7 已通过总控验收，用户确认不新增 AlembicTest 复测。
- resident vector search release 计划已归档到 [archive/2026-05/resident-vector-search-release/](archive/2026-05/resident-vector-search-release/)；Test-2026-05-22-01 通过，Plugin cache 已刷新到 AlembicPlugin `2c98f69b1388c478bbbb255e487c51fde621cff7`。

当前新主线是 [alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)：长线删除 `AlembicPlugin` 中旧内置第三方 AI 能力残留。用户已补充确认，Plugin 侧 AI 配置来自早期“整体做成 Codex 插件”的路线；现在产品已改为 Codex 插件 + Alembic 主体模式，所以 Plugin 侧旧 AI 配置 / 状态 / 权限 surfaces 默认进入删除范围。AIP-0 总控真实调用方扫描已完成；`AlembicPlugin` AIP-1 已完成并通过总控验收。

当前已回填的实现事实：

- `AlembicPlugin` 已删除 `HostAiAdapter` / `AiConfigState` / `AiModule`，移除旧 provider runtime 外形和 Plugin AI config 状态。
- MCP `alembic_codex_ai_config` 已从 tool policy、annotations、server handler、preflight 推荐和测试场景中移除。
- HTTP `/ai/*` 的 provider/config/env/workspace-config/chat/agent 旧入口统一 `410 PLUGIN_AI_CONFIG_REMOVED` fail-closed，不再写入 Plugin workspace AI env 或 API key。
- `SearchEngine` / `IndexingPipeline` / `VectorService` 不再注入 Plugin AI / embedding provider；Codex prime/search 保留 Plugin baseline search，resident vector 增强继续走 Alembic resident service API。
- Skill 与 AlembicCodex runtime artifact 已同步，`plugins/alembic-codex/runtime` 负向扫描仅剩 Core-owned `vendor/AlembicCore` 快照中的 AI env 常量。
- 提交：AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`；AlembicCodex runtime `01fb042afe87264ad213dfc13444dc9dc48b77ca`。
- 总控复核：targeted unit 4 files / 52 tests 通过；关键负向扫描通过；AIP-2 Alembic 无任务，AIP-3 暂不创建 AlembicTest 测试单。
- 本机 Codex plugin cache 已刷新：`~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2/.alembic-dev-refresh.json` 记录 `mode=local-mcp`、`gitHead=747b40f2abb2b9d8cb2714656fab164267d1d105`。

- 当前发送窗口：无。
- 当前不发送给：`Alembic`（无任务）、`AlembicCore`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（观察中）、`AlembicAgent`（无任务）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 保留 resident/internal AI 配置和 embedding 服务能力；AIP-1 不需要主体入口补文案或能力字段。 |
| `AlembicCore`<br>无任务 | 暂无共享 contract 变更证据；Plugin 删除旧 provider 注入应在 Plugin adapter 层完成。 |
| `AlembicAgent`<br>无任务 | 本主线不改 Agent runtime。 |
| `AlembicDashboard`<br>无任务 | Plugin 已不直接引用 Dashboard；本轮不改 Dashboard 源码。 |
| `AlembicPlugin`<br>已完成 | AIP-1 已完成并通过总控验收。执行记录：[../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md](../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md)。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；用户需要真实 Codex / BiliDili 验证时再启动。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码，只可能作为后续测试对象。 |

## 可复制提示词

发送给：无。

```text
当前无可复制派发提示词；AIP-1 已通过总控验收。
```

## 回填区

- 当前总控计划：[alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md](alembic-plugin-external-ai-remnants-removal-workspace-plan-2026-05-22.md)。
- 全局 TODO：[global-todo-board.md](global-todo-board.md) 的 `GTODO-2026-05-21-010` 已完成。
- AlembicPlugin SHOUT 执行记录：[../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md) 已记录 SHOUT-7 总控验收。
- AlembicPlugin resident vector 执行记录：[../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md](../AlembicPlugin/resident-vector-search-release-plugin-2026-05-21.md) 已记录 VEC-2/VEC-3/VEC-4R/VEC-5R/VEC-6 相关证据。
- 2026-05-22：AIP-0 代码依赖调研完成；当前只派发 `AlembicPlugin`，`AlembicDashboard` 因 Plugin 不直接引用 Dashboard 而标为无任务。
- 2026-05-22：`AlembicPlugin` AIP-1 已完成并推送。验证通过：targeted unit、`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run verify:release-package-boundary`、`npm run verify:codex-session`、`npm run report:agent-extraction-boundary`、`git diff --check`。执行记录：[../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md](../AlembicPlugin/alembic-plugin-external-ai-remnants-removal-2026-05-22.md)。
- 2026-05-22：总控验收 AIP-1 通过：复核关键代码删除点、负向扫描和 targeted unit 通过；本轮不启动 `Alembic` / `AlembicDashboard`，也暂不创建 AlembicTest 测试单。
- 2026-05-22：总控按用户要求刷新本机 Codex plugin cache，命令 `npm run dev:codex-plugin:local-mcp -- --clean --all-installed` 成功；cache marker 指向 AlembicPlugin `747b40f2abb2b9d8cb2714656fab164267d1d105`，mode=`local-mcp`。
