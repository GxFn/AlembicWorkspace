# Prime Immediate Receipt Shout Workspace Plan

状态：`AlembicPlugin` 待启动
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`、`AlembicTest`、`AlembicCore`、`Alembic`

## 用户目标

`prime` 的知识呐喊不是最终总结动作，也不是 Plugin 直接替 Codex 生成一段固定摘要。目标是：Codex host agent 在拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，立刻用自己的话向开发者发出可见的知识接收声明，说明“我接收到了哪些 Recipe / Guard / 项目知识、证据在哪里、是否为空或降级”，然后再继续后续搜索、读代码、编辑或验收。

这对应用户提出的“共有知识 / 公共知识”区别：Recipe 被注入后只是 Codex 知道；Codex 立即呐喊后，开发者也知道 Codex 知道了哪些内容，知识才变成公共知识。

## 当前真实代码证据

- `AlembicPlugin/lib/external/mcp/handlers/task.ts:251` 当前已经构造 `primeKnowledgeMaterial`，并在 `task.ts:287` 返回给 Codex。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:410` 当前 `shoutInstruction` 已使用 `Before continuing` 文案，但没有机器可读的“必须在下一步动作前立即发声”字段。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:433` 当前 `hostResponse` 只有 `action`、`receiptId`、`status`、`required`、`reason`；缺少 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true` 或等价字段。
- `AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts:167` 只断言 `hostResponse.action === "shout_prime_knowledge_receipt"` 和 `required: true`，没有断言立即时序。
- `AlembicPlugin/test/unit/CodexMcpServer.test.ts:1061` 已证明 local daemon ready 时 `alembic_task prime` 留在 Plugin-owned 路径，但 `test.ts:1092` 仍只验收 action / required / serviceBoundary。
- `AlembicPlugin/plugins/alembic-codex/skills/alembic/SKILL.md:24` 当前 Daily Coding Flow 只是“先 prime，再 search / edit / guard”；没有明确要求 prime tool result 之后的下一个可见动作必须是知识接收呐喊。

## 完成定义

- `alembic_task prime` 返回的 `data.primeKnowledgeMaterial.hostResponse` 明确包含立即时序契约：`action: "shout_prime_knowledge_receipt"`、`timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`，或等价且测试覆盖的字段。
- `shoutInstruction` 对 delivered / empty / degraded 三种状态都明确要求：收到 prime 结果后，任何后续工具调用、代码阅读、编辑、Guard 或最终总结之前，Codex 必须先输出开发者可见的接收声明。
- Skill 文案明确 Codex 的执行顺序：prime tool call -> 立即知识接收呐喊 -> 再继续任务；不得把呐喊推迟到最终总结。
- Codex 的呐喊内容由 Codex 根据 `primeKnowledgeMaterial` 自己总结，不由 Plugin 生成固定全文；Plugin 只提供结构化材料、证据指向和强约束。
- 单元测试覆盖 delivered / empty / degraded 的时序字段和文案，`CodexMcpServer` 测试覆盖 local daemon ready 时这些字段仍保留。
- 生成或刷新 Alembic Codex runtime artifact；如需要真实 Codex 安装态验证，回填是否已刷新本机 plugin cache，或明确由总控验收后另行刷新。

## 非目标

- 不修改 BiliDili 产品源码。
- 不重新生成 BiliDili Recipes。
- 不启动 AlembicTest 真实项目复测；等 `AlembicPlugin` 回填提交后，总控再在 `alembic-test-exchange.md` 创建新测试单。
- 不把 Codex-facing prime ownership 交给 `Alembic` daemon。
- 不在本轮下沉 Core schema，除非 Plugin 实现时发现类型 / builder 已经出现真实重复消费方。
- 不扩大默认 Codex agent 的 publish / deprecate / approve / fast_track 权限。

## 建议数据契约

`AlembicPlugin` 可以在不改变现有外层 payload 的前提下扩展 `hostResponse`：

```json
{
  "action": "shout_prime_knowledge_receipt",
  "timing": "immediate_after_prime",
  "required": true,
  "requiredBeforeNextAction": true,
  "visibility": "developer_visible",
  "receiptId": "<prime-receipt-id>",
  "status": "delivered"
}
```

字段名可按现有 TypeScript 类型做局部调整，但语义必须可测试、可读、可被 Skill 说明消费。重点不是增加复杂协议，而是让 Codex host agent 和开发者都能看懂：prime 之后的下一步不是静默继续，而是先公开说明收到的知识。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SHOUT-1 | 待启动 | 主线实现 | P0 | `AlembicPlugin` | 强化 `primeKnowledgeMaterial.hostResponse` 与 `shoutInstruction`：增加立即时序字段和文案，让 Codex 在 prime 返回后、任何后续动作前先做开发者可见知识接收呐喊。 | 是 | 用户确认“先做闭环，Codex 的呐喊可以先由他来决定；重要的是先做到呐喊”。 | `AlembicPlugin` |
| SHOUT-2 | 待启动 | Skill / runtime | P0 | `AlembicPlugin` | 更新 Alembic Codex Skill / runtime artifact：Daily Coding Flow 明确 prime -> 立即 receipt shout -> 再继续任务；确保发布 / runtime 包含同样文案。 | 是 | SHOUT-1 同步完成。 | `AlembicPlugin` |
| SHOUT-3 | 阻塞 | 真实项目复测 | P0 | `AlembicTest` | Plugin 完成后，在 BiliDili 真实项目里验证 Codex 可见行为：prime 后立即呐喊，而不是最终总结时才呐喊。 | 是 | 等 `AlembicPlugin` 提交 hash、runtime artifact 和总控验收；届时总控创建 `Test-2026-05-21-03`。 | `AlembicTest` |
| SHOUT-4 | 观察中 | shared contract | P2 | `AlembicCore` | 观察是否需要把 `PrimeHostResponseInstruction` / evidence ref projection 下沉为共享类型；本轮没有第二个真实生产方前不启动。 | 否 | Plugin 回填发现重复消费方时再判断。 | `AlembicCore` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行 SHOUT-1/2：修改 prime host response / shout instruction / Skill 文案 / runtime artifact，并补齐单元测试。 |
| `AlembicTest`<br>阻塞 | 暂不发送。等待 Plugin 完成并由总控创建新测试单后，再验证 BiliDili 中 prime 后立即可见呐喊。 |
| `Alembic`<br>观察中 | 不修改 daemon bridge，不承接 Codex-facing prime ownership；后续仍作为 resident service 被 Plugin 按需请求。 |
| `AlembicCore`<br>观察中 | 本轮不派发；除非 Plugin 实现证明 shared contract 已有真实双向消费需求。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 Alembic internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 待启动 | 唯一当前 producer，需要修改 Codex-facing prime payload、Skill 和 runtime artifact。 | 是 |
| `AlembicTest` | 阻塞 | 真实项目复测依赖 Plugin 提交和总控验收；现在发送会空转。 | 否 |
| `Alembic` | 观察 | daemon bridge 已完成且不承接 prime ownership，本轮无需修改。 | 否 |
| `AlembicCore` | 观察 | 暂无真实双向消费方，不启动共享层下沉。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及 Alembic internal AI runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及 Dashboard UI。 | 否 |

## 当前执行顺序

发送给：`AlembicPlugin`。

不发送给：

- `AlembicTest`：阻塞，等 Plugin 完成后总控创建新测试单。
- `Alembic`：观察中，daemon bridge 不作为 prime 主路径。
- `AlembicCore`：观察中，本轮暂无共享层下沉证据。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。

## 可复制分派提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md，按照文档领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## AlembicPlugin 执行要求

目标：

- 让 `alembic_task(operation="prime")` 的返回契约明确表达：Codex 必须在 prime tool result 后立即向开发者做知识接收呐喊，再继续任何后续动作。
- 保持 Codex 自主总结：Plugin 提供结构化材料、证据和强时序约束，不生成固定全文替 Codex 发言。
- 保持 service boundary：local Alembic daemon ready 时，prime 仍由 Plugin-owned Codex-facing handler 生成 payload。

范围：

- 优先查看 `AlembicPlugin/lib/external/mcp/handlers/task.ts`、`AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts`、`AlembicPlugin/test/unit/CodexMcpServer.test.ts`、`AlembicPlugin/plugins/alembic-codex/skills/alembic/SKILL.md`。
- 若 runtime / package 内有复制后的 Skill 或 artifact，需要按 AlembicPlugin 现有 release / prepare 流程同步，避免源码 Skill 与 runtime Skill 不一致。
- 可以更新类型定义和测试夹具；不把字段设计扩展成跨仓库大协议。

禁止事项：

- 不修改 `Alembic` daemon bridge。
- 不修改 BiliDili。
- 不启动 AlembicTest 真实项目复测。
- 不新增虚构 MCP tool，例如 `codex_host_response`。
- 不让 Plugin 直接生成整段最终呐喊文本来替代 Codex 自主总结。

建议验证：

```bash
npm run build:check
npm run test -- --runInBand TaskPrimeKnowledgeMaterial
npm run test -- --runInBand CodexMcpServer
npm run prepare:codex-plugin-runtime
git diff --check
```

如仓库测试命令名称不同，使用等价 targeted tests，并在回填中写明。若需要刷新本机 Codex plugin cache 但当前窗口权限不足，回填推荐命令，由总控验收后执行。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令：
- 验证结果：
- `hostResponse` 新增字段 / 等价时序契约：
- `shoutInstruction` 对 delivered / empty / degraded 的立即时序文案：
- Skill / runtime artifact 是否已同步：
- local daemon ready 时 prime 是否仍由 Plugin 生成 Codex-facing payload：
- 是否需要 Core 共享层下沉：
- 是否可以创建 AlembicTest 真实项目复测单：
- 遗留风险：
- 下一步建议：

## 回填区

- 2026-05-21：总控根据用户确认创建本计划。当前主线从“prime 能返回知识材料”推进到“prime 返回后 Codex 立即发出开发者可见知识接收呐喊，再继续任务”。本轮只派发 `AlembicPlugin`，不提前派发 `AlembicTest`，避免真实项目复测空转。
