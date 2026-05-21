# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Recipe 交互契约 Wave 1 待启动，发送给 `AlembicCore`、`AlembicPlugin`

## 状态摘要

当前主任务线已从 `prime -> Codex 自主呐喊` V1 验收完成，滚动到 Recipe 生成后 Codex host agent 交互契约修复。

- 当前总控计划：[alembic-codex-recipe-interaction-contract-wave-2026-05-21.md](alembic-codex-recipe-interaction-contract-wave-2026-05-21.md)。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- 用户说明 `AlembicTest` 那边 Recipes 仍在生成中；本轮不新增测试单，不打断测试窗口。
- 本 wave 优先修复会直接带偏 Codex 的交互契约：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略确认、Plugin lifecycle 可见文案、prime host-response action 表达。
- 发送窗口：`AlembicCore`、`AlembicPlugin`。
- 不发送给：`Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicTest`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>待启动 | 执行 W1-PKS-1、W1-PKS-2A、W1-PKS-3：修正 Core briefing 旧工具名；给 pending semantic review 提供真实新 Recipe ID / stable reference；确认或实现 `host-agent` ConfidenceRouter 策略。 |
| `AlembicPlugin`<br>待启动 | 执行 W1-PKS-4、W1-PKS-5：收敛 lifecycle 可见契约；修正 prime host-response action 表达。观察 W1-PKS-2B，不得在 Core 回填前猜 `newRecipeId` 字段。 |
| `Alembic`<br>无任务 | 当前不涉及 daemon、HTTP/API、Dashboard server、ProjectRegistry 或 internal AI job。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent MCP / Core workflow 契约，不涉及 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不改 Dashboard UI；lifecycle publish/deprecate 仍通过 Dashboard/admin 路径，不在本 wave 改前端。 |
| `AlembicTest`<br>观察中 | Recipes 仍在生成中；本 wave 不新增测试单，不打断现有测试；后续真实测试项目相关操作也由此窗口承接。 |

## 可复制提示词

发送给：`AlembicCore`、`AlembicPlugin`。

```text
读取 docs/workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（观察中，当前 Recipes 生成继续）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md` 的“回填区”。
- `AlembicCore`：待启动，负责 W1-PKS-1、W1-PKS-2A、W1-PKS-3。
- `AlembicPlugin`：待启动，负责 W1-PKS-4、W1-PKS-5；W1-PKS-2B 阻塞于 Core 回填。
- `AlembicTest`：观察中；现有 Recipes 生成继续，本轮不创建测试单。
