# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime immediate receipt shout 可读性优化已验收，`AlembicTest` 待启动

## 状态摘要

`prime -> Codex 自主呐喊` V1、`AlembicPlugin` service request 边界、BiliDili 真实项目 service-boundary 复测、以及 prime 后立即呐喊时序复测都已完成。`AlembicTest` 已封口提交 Test-2026-05-21-03，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；当前新测试单是 Test-2026-05-21-04。

新的主线是用户确认的“prime 后立即知识接收呐喊”：Codex host agent 拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，应先向开发者可见说明它接收到了哪些 Recipe / Guard / 项目知识，再继续搜索、读代码、编辑或最终总结。`AlembicPlugin` immediate receipt shout 已完成并通过总控验收，本机 Codex plugin cache 也已刷新到该提交；`AlembicTest` 已完成 BiliDili 真实项目复测和封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`。

用户在 BiliDili 新窗口人工验证后确认：Codex 确实能在 prime 后自己立即呐喊，符合时序预期；但当前可见呐喊过度输出 evidenceRefs 路径 / 行号。`AlembicPlugin` SHOUT-5 已通过总控验收：开发者可见呐喊默认改成简短知识摘要，证据指向继续留在 payload 中给 Codex 后续读代码、复核或按需引用；同时保留“呐喊”的感觉，让 Codex 主动、明确、有声量地喊出接收到的关键知识。本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`。

- 当前总控计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)。
- 全局 TODO 列表：[global-todo-board.md](global-todo-board.md)，记录跨计划待办；当前派发仍以当前计划为准。
- 上一完成计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，`AlembicPlugin` service request 边界和 Test-2026-05-21-02 均已收口。
- 当前测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)，Test-2026-05-21-04 已创建，等待 `AlembicTest` 执行。
- 当前发送窗口：`AlembicTest`。
- 当前不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | SHOUT-5 已通过总控验收；本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`，不再发送。 |
| `AlembicTest`<br>待启动 | 执行 Test-2026-05-21-04：在 BiliDili 真实项目中验证 SHOUT-5 后的可见摘要呐喊是否主动、有声量，且不默认倾倒 evidenceRefs 路径 / 行号。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不修改，不承接 Codex-facing prime ownership。 |
| `AlembicCore`<br>观察中 | 暂无共享层下沉证据；只有 Plugin 回填证明有真实双向消费方时，再考虑 shared contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 可复制提示词

发送给：`AlembicTest`。

```text
读取 docs/workspace/alembic-test-exchange.md，按照文档完成 Test-2026-05-21-04：在 BiliDili 真实项目中验证 Alembic Codex prime receipt shout 的可见摘要优化。重点验证 prime tool result 后下一条开发者可见响应是否主动、有声量地喊出 Recipe / Guard 知识摘要、模式和后续判断依据；不要默认倾倒 evidenceRefs 路径 / 行号，也不要把缺少行号当作可见重点。完成后回填测试结论、版本证据、payload 摘要、Codex 可见呐喊原文或摘要、是否默认倾倒 evidenceRefs、BiliDili git 前后状态、验证命令 / 日志和遗留风险。
```

不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-03 已完成并封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；Test-2026-05-21-02 已完成并封口提交，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`。
- `AlembicPlugin`：当前 immediate receipt shout 时序契约已通过总控验收，提交 hash `829f838704159c7ed205f93ecd986c6234173721`，AlembicCodex runtime hash `682e5d32b9442c1caba9df87f61efb8b0835e870`；SHOUT-5 可见摘要优化也已通过总控验收，提交 hash `58b82f8526d68aef516d68477d7a0e505fc114e9`，AlembicCodex runtime artifact hash `df608057bd274ebb6b39f6a9c0e964f1b8517426`；本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`。上一轮 service request boundary 已通过总控验收，提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
