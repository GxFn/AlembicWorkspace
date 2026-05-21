# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime immediate receipt shout 已验证，`AlembicPlugin` 待启动可见摘要优化

## 状态摘要

`prime -> Codex 自主呐喊` V1、`AlembicPlugin` service request 边界、以及 BiliDili 真实项目 service-boundary 复测都已完成。`AlembicTest` 上一轮已封口提交测试证据，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`；当前新测试单是 Test-2026-05-21-03。

新的主线是用户确认的“prime 后立即知识接收呐喊”：Codex host agent 拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，应先向开发者可见说明它接收到了哪些 Recipe / Guard / 项目知识，再继续搜索、读代码、编辑或最终总结。`AlembicPlugin` immediate receipt shout 已完成并通过总控验收，本机 Codex plugin cache 也已刷新到该提交；`AlembicTest` 已完成 BiliDili 真实项目复测和封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`。

用户在 BiliDili 新窗口人工验证后确认：Codex 确实能在 prime 后自己立即呐喊，符合时序预期；但当前可见呐喊过度输出 evidenceRefs 路径 / 行号。新的优化目标是让开发者可见呐喊默认变成简短知识摘要，证据指向继续留在 payload 中给 Codex 后续读代码、复核或按需引用；同时保留“呐喊”的感觉，让 Codex 主动、明确、有声量地喊出接收到的关键知识。

- 当前总控计划：[prime-immediate-receipt-shout-workspace-plan-2026-05-21.md](prime-immediate-receipt-shout-workspace-plan-2026-05-21.md)。
- 全局 TODO 列表：[global-todo-board.md](global-todo-board.md)，记录跨计划待办；当前派发仍以当前计划为准。
- 上一完成计划：[alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md](alembic-plugin-service-request-boundary-workspace-plan-2026-05-21.md)，`AlembicPlugin` service request 边界和 Test-2026-05-21-02 均已收口。
- 当前测试交流：[alembic-test-exchange.md](alembic-test-exchange.md)，Test-2026-05-21-03 已完成并封口提交。
- 当前发送窗口：`AlembicPlugin`。
- 当前不发送给：`AlembicTest`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行 SHOUT-5：保持 prime 后立即 receipt shout 的时序和 evidenceRefs 结构，但优化 `shoutInstruction` / Skill / 测试 / runtime artifact，让开发者可见呐喊主动、有声量地喊出简短知识摘要，不倾倒长路径证据清单。 |
| `AlembicTest`<br>已完成 | Test-2026-05-21-03 已完成并封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；等待 Plugin 完成 SHOUT-5 后再决定是否创建新复测单。 |
| `Alembic`<br>观察中 | daemon `/api/v1/mcp/call` 兼容 bridge 已完成；当前不修改，不承接 Codex-facing prime ownership。 |
| `AlembicCore`<br>观察中 | 暂无共享层下沉证据；只有 Plugin 回填证明有真实双向消费方时，再考虑 shared contract。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md，按照 SHOUT-5 完成 AlembicPlugin 的 prime receipt shout 摘要可读性优化。目标：保持 prime tool result 后立即 developer-visible receipt shout 的时序、`hostResponse` 字段和 `primeKnowledgeMaterial.evidenceRefs` 结构不变，但调整 `shoutInstruction`、Alembic Codex Skill、相关测试和 runtime artifact，让开发者可见呐喊像真的呐喊一样主动、明确、有声量地喊出简短知识摘要，说明接收到的 Recipe / Guard 约束、模式和后续判断依据；不要默认倾倒 evidenceRefs 路径 / 行号，也不要把“缺少行号”作为可见呐喊重点。证据仍保留在 payload 中供 Codex 后续读代码、复核或在用户要求时引用。禁止修改 BiliDili、Alembic daemon bridge 或新增 `codex_host_response` tool。完成后回填提交 hash、验证命令 / 结果、改动范围、Skill / runtime artifact 是否同步、是否需要总控刷新本机 Codex plugin cache，以及是否需要创建新的 AlembicTest 复测单。
```

不发送给：`AlembicTest`（已完成）、`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）。

## 回填区

- 当前计划回填入口：`docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- `AlembicTest`：Test-2026-05-21-03 已完成并封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；Test-2026-05-21-02 已完成并封口提交，commit `af0430ad69b4da50469eeaded8caa77c59e996e5`。
- `AlembicPlugin`：当前 immediate receipt shout 时序契约已通过总控验收，提交 hash `829f838704159c7ed205f93ecd986c6234173721`，AlembicCodex runtime hash `682e5d32b9442c1caba9df87f61efb8b0835e870`；本机 Codex plugin cache 已刷新到 `829f838704159c7ed205f93ecd986c6234173721`；详细记录见 [../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md)。上一轮 service request boundary 已通过总控验收，提交 hash `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，AlembicCodex runtime hash `7a7c5dce492c632e4ee3301f7eb989faec1d5118`。
- `AlembicPlugin`：SHOUT-5 待启动。当前真实代码证据显示 `task.ts:421` 和 Skill `alembic/SKILL.md:25` 会诱导 Codex 输出 evidenceRefs；下一步改为知识摘要优先、证据内部使用。
