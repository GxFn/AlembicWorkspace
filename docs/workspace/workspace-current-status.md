# AlembicWorkspace Current Status

更新日期：2026-05-21
总控窗口：AlembicWorkspace
状态：Prime 知识呐喊 V1 最小闭环已完成，发送给无

## 状态摘要

当前主任务线已切到 Codex 通过 `alembic_task prime` 接收知识后，主动向开发者公开声明自己接受到了哪些知识。

- 当前总控计划：[alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md)。
- 用户已确认 V1 先做闭环：Codex 的呐喊内容先由 Codex 自己决定；可见程度不做限制；源码证据先只做路径 + 行号；后续再优化逻辑。
- 本轮目标是让 `prime` 返回 `primeKnowledgeMaterial`、路径行号证据和 `shoutInstruction`，让 Codex 自己公开声明接受到的 Recipe / Guard；`AlembicPlugin` 已回填实现并通过总控验收。
- 发送窗口：无。
- `AlembicCore` 不启动；V1 可使用现有 `SlimSearchResult.sourceRefs`、`description`、`actionHint` 和 `searchMeta` 完成。
- 原四个交互问题保留为后续 TODO：Mission Briefing 旧工具名、`pendingSemanticReview` nextAction 缺 `newRecipeId`、`host-agent` 信任阈值策略、lifecycle schema / handler 文案收敛；总控验收新增 `codex_host_response` host-response action 与真实 MCP tool call 区分的 V2 TODO。
- 上一测试线计划 [alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md](alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md) 仍作为历史 / 测试线入口保留；测试窗口按既有节奏持续运行，总控当前不新增关注项。
- 测试交流入口仍是 [alembic-test-exchange.md](alembic-test-exchange.md)，但当前 `prime` 知识呐喊 V1 不创建 `AlembicTest` 测试单。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | V1 最小闭环已通过总控验收：`alembic_task prime` 返回 `primeKnowledgeMaterial`、路径行号证据和 `shoutInstruction`；提交 `d83683bd23b6027b99c6085943639f2df9868840`，runtime artifact `a76fa073ecabf1a6c1bfd83eeffeb0146892b5e0`。 |
| `AlembicCore`<br>无任务 | V1 不需要修改 Core search/sourceRef 类型；后续 sourceRef 元数据增强另起任务。 |
| `Alembic`<br>无任务 | 当前主线不涉及本地增强 daemon、Dashboard server、HTTP/API 或 internal AI job 实现。 |
| `AlembicAgent`<br>无任务 | 当前主线是 Codex host agent prime 知识接收与公开声明，不涉及 AlembicAgent runtime / provider / tool loop。 |
| `AlembicDashboard`<br>无任务 | 当前主线不涉及 Dashboard UI 或前端状态消费。 |
| `BiliDili`<br>无任务 | 当前主线不涉及真实 iOS 项目修改、接入或验证。 |
| `AlembicTest`<br>无任务 | 当前不创建测试单；既有测试线继续独立运行，本状态不新增测试执行任务。 |

## 可复制提示词

发送给：无。

不发送给：`AlembicPlugin`（已完成）、`AlembicCore`（无任务）、`Alembic`（无任务）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）、`BiliDili`（无任务）、`AlembicTest`（无任务）。

当前 V1 闭环已通过总控验收，不再发送领取提示词。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md` 的“回填区”。
- 新任务线：`MAIN-PKS-1` / `MAIN-PKS-2` 已通过总控验收，执行记录 `docs/AlembicPlugin/alembic-plugin-prime-knowledge-shout-v1-2026-05-21.md`；AlembicPlugin 提交 `d83683bd23b6027b99c6085943639f2df9868840`，AlembicCodex runtime artifact `a76fa073ecabf1a6c1bfd83eeffeb0146892b5e0`；总控实跑 targeted tests、build check、diff check 和 handler payload 样例均通过。
- 上一测试线：`docs/workspace/alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md` 保留为上一测试线计划；既有测试运行不在本轮新增 TODO 范围内。
