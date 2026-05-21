# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：BiliDili prime 插件验证待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1 与 Recipe 生成后 Codex host agent 交互契约 Wave 1 均已验收完成。当前活动项是 `AlembicTest` 测试单：在 BiliDili 真实项目中验证插件 `prime` 注入和 Codex 知识呐喊。

- 当前总控计划：[alembic-codex-recipe-interaction-contract-wave-2026-05-21.md](alembic-codex-recipe-interaction-contract-wave-2026-05-21.md)。
- 当前测试任务：[alembic-test-exchange.md](alembic-test-exchange.md) 中 Test-2026-05-21-01。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- 用户说明 BiliDili 项目的 Recipes 已生成完成；已创建 `AlembicTest` 测试单，验证 BiliDili 项目中的插件 `prime` 注入和 Codex 知识呐喊。
- 本 wave 优先修复会直接带偏 Codex 的交互契约：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略确认、Plugin lifecycle 可见文案、prime host-response action 表达。
- `AlembicCore` 已完成 Core 侧修复并提交，`AlembicPlugin` 已完成消费侧和可见契约修正；总控验收通过。
- 发送窗口：`AlembicTest`。
- 不发送给：`AlembicCore`、`AlembicPlugin`、`Alembic`、`AlembicAgent`、`AlembicDashboard`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已完成 W1-PKS-1、W1-PKS-2A、W1-PKS-3：Core briefing 工具名已收敛到 `alembic_submit_knowledge`；pending semantic review 已提供真实 `newRecipeId` / `createdRecipe`；`host-agent` 已纳入 trusted source 且保留各质量门。 |
| `AlembicPlugin`<br>已完成 | 已完成 W1-PKS-2B、W1-PKS-4、W1-PKS-5 并通过总控验收：消费 Core `pendingSemanticReview[].newRecipeId` / `createdRecipe.id`；收敛 lifecycle 可见契约；修正 prime host-response action 表达；刷新 AlembicCodex runtime artifact。 |
| `Alembic`<br>无任务 | 当前不涉及 daemon、HTTP/API、Dashboard server、ProjectRegistry 或 internal AI job。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent MCP / Core workflow 契约，不涉及 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不改 Dashboard UI；lifecycle publish/deprecate 仍通过 Dashboard/admin 路径，不在本 wave 改前端。 |
| `AlembicTest`<br>待启动 | 执行 Test-2026-05-21-01：以 BiliDili 为目标项目，验证 Alembic Codex 插件 `prime` 注入、`primeKnowledgeMaterial` payload 和 Codex 开发者可见知识呐喊；测试单见 [alembic-test-exchange.md](alembic-test-exchange.md)。 |

## 可复制提示词

发送给：`AlembicTest`。

```text
读取 docs/workspace/alembic-test-exchange.md，领取状态为 `待启动` 且执行窗口为 `AlembicTest` 的测试单；按测试单执行测试，详细报告写入 AlembicTest/docs/，并回填本文的测试结果、证据摘要、报告路径、遗留风险和下一步建议。
```

不发送给：`AlembicCore`（已完成）、`AlembicPlugin`（已完成）、`Alembic`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md` 的“回填区”。
- `AlembicCore`：已完成，提交 hash `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`；执行记录见 [../AlembicCore/alembic-core-recipe-interaction-contract-wave-1-2026-05-21.md](../AlembicCore/alembic-core-recipe-interaction-contract-wave-1-2026-05-21.md)。
- `AlembicPlugin`：已完成并通过总控验收，完成 W1-PKS-2B、W1-PKS-4、W1-PKS-5；执行记录见 [../AlembicPlugin/alembic-plugin-recipe-interaction-contract-wave-1-2026-05-21.md](../AlembicPlugin/alembic-plugin-recipe-interaction-contract-wave-1-2026-05-21.md)，提交 hash `8602ae9e71874af389709db680104b2c1ee0edbb`，AlembicCodex runtime hash `4abb80efca55d37dc39667facdd18e8a35a08cad`。
- `AlembicTest`：待启动；测试单 Test-2026-05-21-01 已写入 [alembic-test-exchange.md](alembic-test-exchange.md)，目标为 BiliDili prime 注入与 Codex 知识呐喊插件验证。
