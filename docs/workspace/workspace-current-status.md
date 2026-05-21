# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Recipe 交互契约 Wave 1 已完成

## 状态摘要

当前主任务线已从 `prime -> Codex 自主呐喊` V1 验收完成，滚动到 Recipe 生成后 Codex host agent 交互契约修复。

- 当前总控计划：[alembic-codex-recipe-interaction-contract-wave-2026-05-21.md](alembic-codex-recipe-interaction-contract-wave-2026-05-21.md)。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- 用户说明 `AlembicTest` 那边 Recipes 仍在生成中；本轮不新增测试单，不打断测试窗口。
- 本 wave 优先修复会直接带偏 Codex 的交互契约：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略确认、Plugin lifecycle 可见文案、prime host-response action 表达。
- `AlembicCore` 已完成 Core 侧修复并提交，`AlembicPlugin` 已完成消费侧和可见契约修正；总控验收通过。
- 发送窗口：无。
- 不发送给：`AlembicCore`、`AlembicPlugin`、`Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicTest`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已完成 W1-PKS-1、W1-PKS-2A、W1-PKS-3：Core briefing 工具名已收敛到 `alembic_submit_knowledge`；pending semantic review 已提供真实 `newRecipeId` / `createdRecipe`；`host-agent` 已纳入 trusted source 且保留各质量门。 |
| `AlembicPlugin`<br>已完成 | 已完成 W1-PKS-2B、W1-PKS-4、W1-PKS-5 并通过总控验收：消费 Core `pendingSemanticReview[].newRecipeId` / `createdRecipe.id`；收敛 lifecycle 可见契约；修正 prime host-response action 表达；刷新 AlembicCodex runtime artifact。 |
| `Alembic`<br>无任务 | 当前不涉及 daemon、HTTP/API、Dashboard server、ProjectRegistry 或 internal AI job。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent MCP / Core workflow 契约，不涉及 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不改 Dashboard UI；lifecycle publish/deprecate 仍通过 Dashboard/admin 路径，不在本 wave 改前端。 |
| `AlembicTest`<br>观察中 | Recipes 仍在生成中；本 wave 不新增测试单，不打断现有测试；后续真实测试项目相关操作也由此窗口承接。 |

## 可复制提示词

发送给：无。

```text
当前无可发送窗口；Recipe 交互契约 Wave 1 已完成。
```

不发送给：`AlembicCore`（已完成）、`AlembicPlugin`（已完成）、`Alembic`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（观察中，当前 Recipes 生成继续）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md` 的“回填区”。
- `AlembicCore`：已完成，提交 hash `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；执行记录见 [../AlembicCore/alembic-core-recipe-interaction-contract-wave-1-2026-05-21.md](../AlembicCore/alembic-core-recipe-interaction-contract-wave-1-2026-05-21.md)。
- `AlembicPlugin`：已完成并通过总控验收，完成 W1-PKS-2B、W1-PKS-4、W1-PKS-5；执行记录见 [../AlembicPlugin/alembic-plugin-recipe-interaction-contract-wave-1-2026-05-21.md](../AlembicPlugin/alembic-plugin-recipe-interaction-contract-wave-1-2026-05-21.md)，提交 hash `8602ae9e71874af389709db680104b2c1ee0edbb`，AlembicCodex runtime hash `4abb80efca55d37dc39667facdd18e8a35a08cad`。
- `AlembicTest`：观察中；现有 Recipes 生成继续，本轮不创建测试单。
