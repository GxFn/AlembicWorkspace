# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：BiliDili prime MCP bridge 修复待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1 与 Recipe 生成后 Codex host agent 交互契约 Wave 1 均已验收完成。`AlembicTest` 已在 BiliDili 真实项目执行 prime 插件验证，结果为失败但有效：Recipes/status 可读，`prime` 失败在 Plugin -> Alembic daemon `/api/v1/mcp/call` 404。当前活动项是修复 Alembic daemon MCP bridge。

- 当前总控计划：[bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md](bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md)。
- 当前测试结果：[alembic-test-exchange.md](alembic-test-exchange.md) 中 Test-2026-05-21-01，结论为失败，等待 Alembic 修复后复测。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- `AlembicTest` 回填：BiliDili `alembic_codex_status` 成功，`recipeCount=79`、`sourceRefs=196`，但 `alembic_task prime` 返回 `CODEX_MCP_ERROR` / `Route not found: POST /api/v1/mcp/call`。
- 本 wave 优先修复会直接带偏 Codex 的交互契约：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略确认、Plugin lifecycle 可见文案、prime host-response action 表达。
- `AlembicCore` 已完成 Core 侧修复并提交，`AlembicPlugin` 已完成消费侧和可见契约修正；总控验收通过。
- 发送窗口：`Alembic`。
- 不发送给：`AlembicPlugin`、`AlembicTest`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 执行 [bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md](bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md) 的 BRIDGE-1：在本地 daemon 中补齐 `/api/v1/mcp/call` bridge route，让 Plugin `alembic_task prime` 不再 404。 |
| `AlembicPlugin`<br>观察中 | 当前不派发；等待 Alembic 修复和 AlembicTest 复测。若 daemon bridge 修复后仍有 route selection / capability 判断问题，再启动 Plugin hardening。 |
| `AlembicTest`<br>阻塞 | Test-2026-05-21-01 已完成并失败；等待 Alembic 修复提交后复测。 |
| `AlembicCore`<br>无任务 | 本波不改 shared runtime capability contract；主闭环先修 daemon route。 |
| `AlembicAgent`<br>无任务 | 当前问题是 Plugin -> Alembic daemon HTTP bridge，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及前端 UI。 |

## 可复制提示词

发送给：`Alembic`。

```text
读取 docs/workspace/bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicPlugin`（观察中）、`AlembicTest`（阻塞，等待 Alembic 修复后复测）、`AlembicCore`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-01 已完成，结论失败；报告见 [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)。
- `Alembic`：待启动，负责补齐 daemon `/api/v1/mcp/call` bridge。
