# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime immediate receipt shout 派发中，`AlembicPlugin` 待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1、`AlembicPlugin` service request 边界、以及 BiliDili 真实项目 service-boundary 复测都已完成。`AlembicTest` 已封口提交测试证据，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`；当前没有需要发送给 `AlembicTest` 的测试单。

新的主线是用户确认的“prime 后立即知识接收呐喊”：Codex host agent 拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，应先向开发者可见说明它接收到了哪些 Recipe / Guard / 证据，再继续搜索、读代码、编辑或最终总结。也就是说，呐喊发生在接受 prime 后的下一个可见动作，而不是任务完成总结时。

- 当前总控计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)。
- 全局 TODO 列表：[global-todo-board.md](global-todo-board.md)，记录跨计划待办；当前派发仍以当前计划为准。
- 上一完成计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，`AlembicPlugin` service request 边界和 Test-2026-05-21-02 均已收口。
- 当前测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)，Test-2026-05-21-02 已完成；下一轮等 `AlembicPlugin` immediate receipt shout 完成后再创建新测试单。
- 当前发送窗口：`AlembicPlugin`。
- 当前不发送给：`AlembicTest`（阻塞，等 Plugin 完成后再测）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行当前计划 SHOUT-1/2：强化 `primeKnowledgeMaterial.hostResponse`、`shoutInstruction` 和 Alembic Codex Skill / runtime artifact，让 Codex 在 prime tool result 后立即做开发者可见知识接收呐喊，再继续后续动作。 |
| `AlembicTest`<br>阻塞 | 暂不发送；等待 `AlembicPlugin` 回填提交 hash、runtime artifact 和总控验收后，再由总控在测试交流文档创建 BiliDili 真实项目复测单。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不修改，不承接 Codex-facing prime ownership。 |
| `AlembicCore`<br>观察中 | 暂无共享层下沉证据；只有 Plugin 回填证明有真实双向消费方时，再考虑 shared contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md，按照文档领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicTest`（阻塞，等 Plugin 完成后创建新测试单）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-02 已完成并封口提交，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`；详细报告见 [../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md)。
- `AlembicPlugin`：上一轮 service request boundary 已通过总控验收，提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`；当前新任务是 immediate receipt shout 时序契约。
