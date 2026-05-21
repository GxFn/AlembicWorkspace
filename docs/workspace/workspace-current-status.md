# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime immediate receipt shout 已验收，`AlembicTest` 待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1、`AlembicPlugin` service request 边界、以及 BiliDili 真实项目 service-boundary 复测都已完成。`AlembicTest` 上一轮已封口提交测试证据，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`；当前新测试单是 Test-2026-05-21-03。

新的主线是用户确认的“prime 后立即知识接收呐喊”：Codex host agent 拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，应先向开发者可见说明它接收到了哪些 Recipe / Guard / 证据，再继续搜索、读代码、编辑或最终总结。也就是说，呐喊发生在接受 prime 后的下一个可见动作，而不是任务完成总结时。`AlembicPlugin` 已完成并通过总控验收，本机 Codex plugin cache 也已刷新到该提交；当前发送 `AlembicTest` 做 BiliDili 真实项目可见行为复测。

- 当前总控计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)。
- 全局 TODO 列表：[global-todo-board.md](global-todo-board.md)，记录跨计划待办；当前派发仍以当前计划为准。
- 上一完成计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，`AlembicPlugin` service request 边界和 Test-2026-05-21-02 均已收口。
- 当前测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)，Test-2026-05-21-03 已创建，等待 `AlembicTest` 执行。
- 当前发送窗口：`AlembicTest`。
- 当前不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | 当前计划 SHOUT-1/2 已通过总控验收；本机 Codex plugin cache 已刷新到 `829f838704159c7ed205f93ecd986c6234173721`，不再发送。 |
| `AlembicTest`<br>待启动 | 执行 Test-2026-05-21-03：在 BiliDili 真实项目中验证 prime 后下一条可见响应就是 knowledge receipt shout，并检查 payload 新时序字段。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不修改，不承接 Codex-facing prime ownership。 |
| `AlembicCore`<br>观察中 | 暂无共享层下沉证据；只有 Plugin 回填证明有真实双向消费方时，再考虑 shared contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 可复制提示词

发送给：`AlembicTest`。

```text
读取 docs/workspace/alembic-test-exchange.md，按照文档完成 Test-2026-05-21-03：在 BiliDili 真实项目中验证 Alembic Codex prime immediate receipt shout，可见行为必须是 prime tool result 后下一条开发者可见响应先声明接收到的 Recipe / Guard / evidenceRefs，再继续任务；完成后回填测试结论、版本证据、payload 摘要、Codex 可见呐喊原文或摘要、BiliDili git 前后状态、验证命令 / 日志和遗留风险。
```

不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-02 已完成并封口提交，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`；详细报告见 [../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md](../../AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md)。
- `AlembicPlugin`：当前 immediate receipt shout 时序契约已通过总控验收，提交 hash `829f838704159c7ed205f93ecd986c6234173721`，AlembicCodex runtime hash `682e5d32b9442c1caba9df87f61efb8b0835e870`；本机 Codex plugin cache 已刷新到 `829f838704159c7ed205f93ecd986c6234173721`；详细记录见 [../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md)。上一轮 service request boundary 已通过总控验收，提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
