# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：AlembicTest BiliDili prime shout 复测待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1 与 Recipe 生成后 Codex host agent 交互契约 Wave 1 均已验收完成。`AlembicTest` 已在 BiliDili 真实项目执行 prime 插件验证，结果为失败但有效：Recipes/status 可读，`prime` 未返回 `primeKnowledgeMaterial`。`Alembic` 已补齐 `/api/v1/mcp/call` 兼容 bridge，但用户确认：更好的设计是 `Alembic` 作为常驻本地服务，由 `AlembicPlugin` 按需请求服务；不要把 Plugin MCP tool ownership 桥接给 Alembic。`AlembicPlugin` service request 边界已通过总控验收，当前进入 `AlembicTest` BiliDili prime shout 复测。

- 当前总控计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)。
- 上一收口计划：[bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md](bilidili-prime-shout-mcp-bridge-repair-wave-2026-05-21.md)，`Alembic` bridge 已完成但不作为 prime 主路径。
- 当前测试任务：[alembic-test-exchange.md](alembic-test-exchange.md) 中 Test-2026-05-21-02，状态为待启动，复测 Plugin service request 边界修正后的 BiliDili prime shout。
- 上一完成计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)，V1 `primeKnowledgeMaterial` / `shoutInstruction` 最小闭环已完成。
- `AlembicTest` 回填：BiliDili `alembic_codex_status` 成功，`recipeCount=79`、`sourceRefs=196`，但 `alembic_task prime` 未返回可验收的 `primeKnowledgeMaterial`。
- Recipe 交互契约 Wave 1 已完成：Core Mission Briefing 旧工具名、`pendingSemanticReview` 缺真实 `newRecipeId`、`host-agent` 信任策略、Plugin lifecycle 可见文案、prime host-response action 表达均已收口并通过总控验收。
- route ownership 风险已由 `AlembicPlugin` 修正并通过总控验收：`alembic_task prime` 留在 Plugin，local daemon ready 时不走 `/api/v1/mcp/call`。
- `AlembicPlugin` 已完成 service request 边界修复并通过总控验收，提交 `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime artifact 提交 `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
- 发送窗口：`AlembicTest`。
- 不发送给：`AlembicPlugin`、`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | 已通过总控验收：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md) 的 SERVICE-1/2 完成，`alembic_task` 的 Codex intent lifecycle 留在 Plugin，建立 Plugin 请求 Alembic resident service 的边界规则。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不派发，不继续复制 Plugin prime 呐喊契约；后续作为 resident service 被请求。 |
| `AlembicTest`<br>待启动 | 领取 [alembic-test-exchange.md](alembic-test-exchange.md) 中 Test-2026-05-21-02，复测 BiliDili prime shout、serviceBoundary、Codex 知识呐喊和 BiliDili git 干净状态。 |
| `AlembicCore`<br>观察中 | Plugin 回填本轮暂不需要下沉 `primeKnowledgeMaterial` schema / evidenceRefs builder。 |
| `AlembicAgent`<br>无任务 | 当前问题是 Codex host agent / Plugin service request 边界，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及前端 UI。 |

## 可复制提示词

发送给：`AlembicTest`。

```text
读取 docs/workspace/alembic-test-exchange.md，领取状态为 `待启动` 且执行窗口为 `AlembicTest` 的测试单；按测试单执行测试，详细报告写入 AlembicTest/docs/，并回填本文的测试结果、证据摘要、报告路径、遗留风险和下一步建议。
```

不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中，bridge 已完成）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-01 已完成，结论失败；报告见 [../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-plugin-test-2026-05-21.md)。
- `Alembic`：BRIDGE-1 已回填完成，提交 `83130a6add9806c124d334281a0ec7f219afd33e`；当前不派发。
- `AlembicPlugin`：SERVICE-1/2 已通过总控验收，执行记录见 [../AlembicPlugin/alembic-plugin-service-request-boundary-2026-05-21.md](../AlembicPlugin/alembic-plugin-service-request-boundary-2026-05-21.md)；提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
- `AlembicTest`：Test-2026-05-21-02 已创建，等待领取执行；目标是复测 BiliDili prime shout、`data.serviceBoundary.executionPath === "plugin-owned-codex-facing"`、Codex 知识呐喊和 BiliDili git 干净状态。
