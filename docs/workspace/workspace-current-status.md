# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime immediate receipt shout 可读性优化复测功能通过，`AlembicTest` 封口执行中

## 状态摘要

`prime -> Codex 自主呐喊` V1、`AlembicPlugin` service request 边界、BiliDili 真实项目 service-boundary 复测、以及 prime 后立即呐喊时序复测都已完成。`AlembicTest` 已封口提交 Test-2026-05-21-03，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；当前新测试单是 Test-2026-05-21-04。

新的主线是用户确认的“prime 后立即知识接收呐喊”：Codex host agent 拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，应先向开发者可见说明它接收到了哪些 Recipe / Guard / 项目知识，再继续搜索、读代码、编辑或最终总结。`AlembicPlugin` immediate receipt shout 已完成并通过总控验收，本机 Codex plugin cache 也已刷新到该提交；`AlembicTest` 已完成 BiliDili 真实项目复测和封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`。

用户在 BiliDili 新窗口人工验证后确认：Codex 确实能在 prime 后自己立即呐喊，符合时序预期；但当前可见呐喊过度输出 evidenceRefs 路径 / 行号。`AlembicPlugin` SHOUT-5 已通过总控验收：开发者可见呐喊默认改成简短知识摘要，证据指向继续留在 payload 中给 Codex 后续读代码、复核或按需引用；同时保留“呐喊”的感觉，让 Codex 主动、明确、有声量地喊出接收到的关键知识。本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`。

`AlembicTest` 已回填 Test-2026-05-21-04，总控功能验收通过：BiliDili 上下文 `prime` delivered，5 条 Recipe / 1 条 Guard 已注入；Codex 下一条开发者可见响应先喊出 SchemeRouter、RouteError / RouteResult、AnalyticsMiddleware、lazy var UI、ModuleManager、Protocol 命名后缀等知识摘要，未默认倾倒 evidenceRefs 路径 / 行号；BiliDili 测试前后保持干净。当前不标最终完成，因为 `AlembicTest` 仓库还有测试报告、probe 脚本和测试文档变更未提交。

- 当前总控计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)。
- 全局 TODO 列表：[global-todo-board.md](global-todo-board.md)，记录跨计划待办；当前派发仍以当前计划为准。
- 上一完成计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，`AlembicPlugin` service request 边界和 Test-2026-05-21-02 均已收口。
- 当前测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)，Test-2026-05-21-04 功能验收通过，等待 `AlembicTest` 封口提交。
- 当前发送窗口：`AlembicTest`（封口提交）。
- 当前不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | SHOUT-5 已通过总控验收；本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`，不再发送。 |
| `AlembicTest`<br>执行中 | Test-2026-05-21-04 功能验收通过；提交本次 readable receipt shout 测试报告、probe 脚本和相关测试文档变更，并回填 commit hash。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不修改，不承接 Codex-facing prime ownership。 |
| `AlembicCore`<br>观察中 | 暂无共享层下沉证据；只有 Plugin 回填证明有真实双向消费方时，再考虑 shared contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 可复制提示词

发送给：`AlembicTest`（封口提交）。

```text
读取 docs/workspace/alembic-test-exchange.md，完成 Test-2026-05-21-04 的 AlembicTest 仓库封口：不要扩大测试范围，优先提交本次 readable receipt shout 测试报告、probe 脚本和相关测试文档变更；提交后回填 AlembicTest commit hash、提交范围、是否仍有未提交变更和遗留风险。
```

不发送给：`AlembicPlugin`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-04 功能验收通过；当前 `AlembicTest` 仓库仍有未提交变更 `scripts/README.md`、`scripts/probe-codex-prime.mjs` 和 `docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md`，需封口提交后回填 commit hash。Test-2026-05-21-03 已完成并封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；Test-2026-05-21-02 已完成并封口提交，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`。
- `AlembicPlugin`：当前 immediate receipt shout 时序契约已通过总控验收，提交 hash `829f838704159c7ed205f93ecd986c6234173721`，AlembicCodex runtime hash `682e5d32b9442c1caba9df87f61efb8b0835e870`；SHOUT-5 可见摘要优化也已通过总控验收，提交 hash `58b82f8526d68aef516d68477d7a0e505fc114e9`，AlembicCodex runtime artifact hash `df608057bd274ebb6b39f6a9c0e964f1b8517426`；本机 Codex plugin cache 已刷新到 `58b82f8526d68aef516d68477d7a0e505fc114e9`。上一轮 service request boundary 已通过总控验收，提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
