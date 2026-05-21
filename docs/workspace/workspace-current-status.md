# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：AlembicPlugin service request 边界待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1 与 Recipe 生成后 Codex host agent 交互契约 Wave 1 均已验收完成。`AlembicTest` 已在 BiliDili 真实项目执行 prime 插件验证，结果为失败但有效：Recipes/status 可读，`prime` 未返回 `primeKnowledgeMaterial`。`Alembic` 已补齐 `/api/v1/mcp/call` 兼容 bridge，但用户确认：更好的设计是 `Alembic` 作为常驻本地服务，由 `AlembicPlugin` 按需请求服务；不要把 Plugin MCP tool ownership 桥接给 Alembic。当前活动项切换为 `AlembicPlugin` service request 边界，确保 `alembic_task prime` 留在 Plugin 并保留 Codex 呐喊契约。

- 当前总控计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)。
- 上一收口计划：[bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md](bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md)，`Alembic` bridge 已完成但不作为 prime 主路径。
- 当前测试结果：[alembic-test-exchange.md](alembic-test-exchange.md) 中 Test-2026-05-21-01，结论为失败，等待 Plugin service request 边界修正后复测。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- `AlembicTest` 回填：BiliDili `alembic_codex_status` 成功，`recipeCount=79`、`sourceRefs=196`，但 `alembic_task prime` 未返回可验收的 `primeKnowledgeMaterial`。
- Recipe 交互契约 Wave 1 已完成：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略、Plugin lifecycle 可见文案、prime host-response action 表达均已收口并通过总控验收。
- 当前新增风险是 route ownership：`AlembicPlugin` 已实现的 Codex-facing prime payload 不应被 local daemon ready 的 blanket bridge 绕开。
- 发送窗口：`AlembicPlugin`。
- 不发送给：`Alembic`、`AlembicTest`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行 [alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md) 的 SERVICE-1/2：`alembic_task` 的 Codex intent lifecycle 留在 Plugin，建立 Plugin 请求 Alembic resident service 的边界规则。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不派发，不继续复制 Plugin prime 呐喊契约；后续作为 resident service 被请求。 |
| `AlembicTest`<br>阻塞 | Test-2026-05-21-01 已完成并失败；等待 Plugin service request 边界修正后复测。 |
| `AlembicCore`<br>观察中 | 等 Plugin 回填是否需要下沉 `primeKnowledgeMaterial` schema / evidenceRefs builder。 |
| `AlembicAgent`<br>无任务 | 当前问题是 Codex host agent / Plugin service request 边界，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及前端 UI。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`（观察中，bridge 已完成）、`AlembicTest`（阻塞，等待 Plugin 修正后复测）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-01 已完成，结论失败；报告见 [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)。
- `Alembic`：BRIDGE-1 已回填完成，提交 `83130a6add9806c124d334281a0ec7f219afd33e`；当前不派发。
