# Prime Immediate Receipt Shout Workspace Plan

状态：`AlembicPlugin` 待验收（SHOUT-7 已回填），`AlembicTest` 已完成（SHOUT-7 不新增真实项目复测）
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`、`AlembicTest`、`AlembicCore`、`Alembic`

## 用户目标

`prime` 的知识呐喊不是最终总结动作，也不是 Plugin 直接替 Codex 生成一段固定摘要。目标是：Codex host agent 在拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，立刻用自己的话向开发者发出可见的知识接收声明，说明“我接收到了哪些 Recipe / Guard / 项目知识、这些知识会怎样约束接下来的判断、是否为空或降级”，然后再继续后续搜索、读代码、编辑或验收。

这对应用户提出的“共有知识 / 公共知识”区别：Recipe 被注入后只是 Codex 知道；Codex 立即呐喊后，开发者也知道 Codex 知道了哪些内容，知识才变成公共知识。

2026-05-21 用户在 BiliDili 新窗口人工验证后确认：当前 prime 后确实会自己呐喊，符合时序预期；但可见内容过度暴露 evidenceRefs 路径 / 行号，开发者第一眼读到的是证据清单而不是知识摘要。下一步优化目标是：证据指向继续保留在 payload 里供 Codex 自己使用和后续复核；开发者可见呐喊默认输出简短、可读、有声量的知识摘要，像真的呐喊一样把接收到的关键内容喊出来，不把 evidenceRefs 当作主要可见内容倾倒出来。

2026-05-21 用户继续反馈：当前可见呐喊出现了 “Alembic prime 已接收” 这种主语。总控判断这会削弱公共知识效果：呐喊的说话者应是 Codex host agent，`prime` 只是工具动作 / 知识注入入口。后续可见 receipt 应优先使用 “Codex 已接收…”、“我已接收…” 或等价表达，不应让 “Alembic prime” 成为语法主语。

用户随后明确：SHOUT-7 不需要再走 AlembicTest 真实项目测试。该项按 `AlembicPlugin` 内部文案 / 契约 / 单元测试自验收口；完成后不创建新的 BiliDili 测试单。

## 立项时真实代码证据

- `AlembicPlugin/lib/external/mcp/handlers/task.ts:251` 当前已经构造 `primeKnowledgeMaterial`，并在 `task.ts:287` 返回给 Codex。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:410` 当前 `shoutInstruction` 已使用 `Before continuing` 文案，但没有机器可读的“必须在下一步动作前立即发声”字段。
- `AlembicPlugin/lib/external/mcp/handlers/task.ts:433` 当前 `hostResponse` 只有 `action`、`receiptId`、`status`、`required`、`reason`；缺少 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true` 或等价字段。
- `AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts:167` 只断言 `hostResponse.action === "shout_prime_knowledge_receipt"` 和 `required: true`，没有断言立即时序。
- `AlembicPlugin/test/unit/CodexMcpServer.test.ts:1061` 已证明 local daemon ready 时 `alembic_task prime` 留在 Plugin-owned 路径，但 `test.ts:1092` 仍只验收 action / required / serviceBoundary。
- `AlembicPlugin/plugins/alembic-codex/skills/alembic/SKILL.md:24` 当前 Daily Coding Flow 只是“先 prime，再 search / edit / guard”；没有明确要求 prime tool result 之后的下一个可见动作必须是知识接收呐喊。
- 2026-05-21 可读性优化证据：`AlembicPlugin/lib/external/mcp/handlers/task.ts:421` 当前 delivered 态 `shoutInstruction` 要求 Codex “Cite evidenceRefs as path:line...”，`AlembicPlugin/plugins/alembic-codex/skills/alembic/SKILL.md:25` 也要求可见 receipt shout “with evidence refs when present”；这会诱导 Codex 把开发者可见呐喊写成路径 / 行号清单。

## 完成定义

- `alembic_task prime` 返回的 `data.primeKnowledgeMaterial.hostResponse` 明确包含立即时序契约：`action: "shout_prime_knowledge_receipt"`、`timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`，或等价且测试覆盖的字段。
- `shoutInstruction` 对 delivered / empty / degraded 三种状态都明确要求：收到 prime 结果后，任何后续工具调用、代码阅读、编辑、Guard 或最终总结之前，Codex 必须先输出开发者可见的接收声明。
- Skill 文案明确 Codex 的执行顺序：prime tool call -> 立即知识接收呐喊 -> 再继续任务；不得把呐喊推迟到最终总结。
- Codex 的呐喊内容由 Codex 根据 `primeKnowledgeMaterial` 自己总结，不由 Plugin 生成固定全文；Plugin 只提供结构化材料、证据指向和强约束。
- 开发者可见呐喊默认是知识摘要，不是 evidenceRefs dump：应优先表达本次 prime 接收到的约束、模式、风险和后续判断依据；证据路径 / 行号仍保留在 `primeKnowledgeMaterial` 里供 Codex 后续读代码、复核或在用户要求时引用。
- 呐喊必须有“喊出来”的感觉：主动、明确、有声量，用一眼能抓住的短句或少量 bullet 说出关键知识；不能退化成安静的元信息提示、日志式报告或“已接收若干知识”的空泛声明。
- 呐喊的说话者必须是 Codex / 我，而不是工具名或流程名：可见 receipt 可以提到来自 Alembic prime 的知识，但不要用 “Alembic prime 已接收” 作为主语；应表达为 “Codex 已接收…”、“我已接收…” 或等价语义，让开发者明确知道 Codex 知道了什么。
- delivered 态可见呐喊应简短、扫一眼能懂，避免逐条输出长路径；可以说明“已接收证据指向并会用于后续复核”，但不要要求默认列出 path:line 或专门提示“缺少行号”。
- 单元测试覆盖 delivered / empty / degraded 的时序字段和文案，`CodexMcpServer` 测试覆盖 local daemon ready 时这些字段仍保留。
- 生成或刷新 Alembic Codex runtime artifact；如需要真实 Codex 安装态验证，回填是否已刷新本机 plugin cache，或明确由总控验收后另行刷新。

## 非目标

- 不修改 BiliDili 产品源码。
- 不重新生成 BiliDili Recipes。
- 不在 `AlembicPlugin` 验收前启动 AlembicTest 真实项目复测；Plugin 通过后，真实行为验证必须通过 `alembic-test-exchange.md` 创建测试单执行。
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
| SHOUT-1 | 已完成 | 主线实现 | P0 | `AlembicPlugin` | 已强化 `primeKnowledgeMaterial.hostResponse` 与 `shoutInstruction`：增加立即时序字段和文案，让 Codex 在 prime 返回后、任何后续动作前先做开发者可见知识接收呐喊。 | 是 | AlembicPlugin commit `829f838704159c7ed205f93ecd986c6234173721`；总控验收通过。 | `AlembicPlugin` |
| SHOUT-2 | 已完成 | Skill / runtime | P0 | `AlembicPlugin` | 已更新 Alembic Codex Skill / runtime artifact：Daily Coding Flow 明确 prime -> 立即 receipt shout -> 再继续任务；runtime artifact 已刷新。 | 是 | AlembicCodex commit `682e5d32b9442c1caba9df87f61efb8b0835e870`；本机 Codex plugin cache 已刷新到 Plugin `829f838704159c7ed205f93ecd986c6234173721`。 | `AlembicPlugin` |
| SHOUT-3 | 已完成 | 真实项目复测 | P0 | `AlembicTest` | 在 BiliDili 真实项目里验证 Codex 可见行为：prime 后下一条可见响应是 receipt shout，而不是最终总结时才呐喊。 | 是 | Test-2026-05-21-03 功能验收通过；AlembicTest commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；BiliDili 前后干净。 | `AlembicTest` |
| SHOUT-4 | 观察中 | shared contract | P2 | `AlembicCore` | 观察是否需要把 `PrimeHostResponseInstruction` / evidence ref projection 下沉为共享类型；本轮没有第二个真实生产方前不启动。 | 否 | Plugin 回填发现重复消费方时再判断。 | `AlembicCore` |
| SHOUT-5 | 已完成 | 可见摘要优化 | P0 | `AlembicPlugin` | 已优化 prime receipt shout 指令：开发者可见内容改为主动、有声量的短知识摘要；证据路径 / 行号继续保留在 payload 中供 Codex 内部使用，不默认倾倒到可见呐喊。 | 是 | AlembicPlugin commit `58b82f8526d68aef516d68477d7a0e505fc114e9`；AlembicCodex runtime artifact commit `df608057bd274ebb6b39f6a9c0e964f1b8517426`；总控验收通过，本机 Codex plugin cache 已刷新到该提交。 | `AlembicPlugin` |
| SHOUT-6 | 已完成 | 真实项目复测 | P0 | `AlembicTest` | 在 BiliDili 真实项目中验证 SHOUT-5 后的 Codex 可见呐喊：prime 后下一条响应应主动、有声量地喊出 Recipe / Guard 知识摘要，且不默认倾倒 evidenceRefs 路径 / 行号。 | 是 | Test-2026-05-21-04 功能验收通过并封口；AlembicTest commit `60bbd360be147062f834ee881630ca25918663d0`；BiliDili 前后干净。 | `AlembicTest` |
| SHOUT-7 | 待验收 | 可见语义修正 | P0 | `AlembicPlugin` | 已收紧 prime receipt shout 的说话者主语：开发者可见呐喊应由 Codex / 我来声明“我接收到了哪些知识”，不要默认生成 “Alembic prime 已接收” 这类工具名作主语的表达。 | 不新增 AlembicTest 复测；只影响 Plugin 自验 | AlembicPlugin commit `45db3a780759b7e4db24f920acbd56f0b4684d63`；AlembicCodex runtime artifact commit `2d4d8f0ce2b0a884e88a799be4fba7dffd47626a`；等待总控验收。 | `AlembicPlugin` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待验收 | SHOUT-7 已回填：在 `shoutInstruction`、tool result message、Skill、单元测试和 runtime artifact 中明确可见 receipt 的说话者应是 Codex / 我，不要让 “Alembic prime” 作为主语；保持 SHOUT-5 的知识摘要和证据不默认倾倒要求。本项不新增 AlembicTest 真实项目复测。 |
| `AlembicTest`<br>已完成 | Test-2026-05-21-04 功能验收通过并封口提交完成，commit `60bbd360be147062f834ee881630ca25918663d0`；BiliDili 前后干净，本轮无动作。 |
| `Alembic`<br>观察中 | 不修改 daemon bridge，不承接 Codex-facing prime ownership；后续仍作为 resident service 被 Plugin 按需请求。 |
| `AlembicCore`<br>观察中 | 本轮不派发；除非 Plugin 实现证明 shared contract 已有真实双向消费需求。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 Alembic internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 待验收 | SHOUT-7 已提交并回填，等待总控复核证据；用户确认不走测试。 | 否 |
| `AlembicTest` | 已完成 | Test-2026-05-21-04 已封口提交，且 SHOUT-7 用户确认不走 AlembicTest 真实项目测试。 | 否 |
| `Alembic` | 观察 | daemon bridge 已完成且不承接 prime ownership，本轮无需修改。 | 否 |
| `AlembicCore` | 观察 | 暂无真实双向消费方，不启动共享层下沉。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及 Alembic internal AI runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及 Dashboard UI。 | 否 |

## 当前执行顺序

发送给：无。

不发送给：

- `AlembicPlugin`：SHOUT-7 待验收，等待总控复核。
- `Alembic`：观察中，daemon bridge 不作为 prime 主路径。
- `AlembicCore`：观察中，本轮暂无共享层下沉证据。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。
- `AlembicTest`：已完成 Test-2026-05-21-04 封口；SHOUT-7 不走真实项目测试。

## 可复制分派提示词

发送给：无。

当前 SHOUT-7 已由 `AlembicPlugin` 回填，等待总控验收；暂不向其它窗口发送执行提示词。

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
- 2026-05-21：`AlembicPlugin` 已完成 SHOUT-1/2，详细记录见 [../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-immediate-receipt-shout-2026-05-21.md)。
  - 完成范围：`primeKnowledgeMaterial.hostResponse` 新增 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`；`shoutInstruction` 和 tool result message 覆盖 delivered / empty / degraded 的 immediate-before-next-action 文案；Alembic Codex Skill Daily Coding Flow 改为 prime -> immediate receipt shout -> search/read/edit/guard；runtime artifact 已刷新。
  - 提交 hash：AlembicPlugin `829f838704159c7ed205f93ecd986c6234173721`；AlembicCodex runtime artifact `682e5d32b9442c1caba9df87f61efb8b0835e870`。
  - 验证命令：`npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run build:check`；`npm run build`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run verify:codex-channel`；`npm run verify:release-package-boundary`；`git diff --check`（AlembicPlugin 和 AlembicCodex）。
  - 验证结果：targeted Biome 通过；targeted vitest 38 tests passed；build/check、runtime prepare、Codex plugin/channel/release boundary 验证均通过；两个仓库 `git diff --check` 均通过。
  - 负向边界：未修改 `Alembic` daemon bridge，未修改 BiliDili，未新增 `codex_host_response`，local daemon ready 时 `alembic_task prime` 仍由 Plugin-owned Codex-facing handler 生成 payload。
  - Core 下沉判断：本轮无第二个真实生产方或稳定共享消费方，不需要下沉 Core shared contract。
  - 遗留风险：真实 Codex 可见行为仍需 `AlembicTest` 在 BiliDili 中复测，验证 prime 之后的下一条可见响应确实是 receipt shout，而不是最终总结。
  - 下一步建议：总控验收后创建 `Test-2026-05-21-03`，派发 `AlembicTest` 做 BiliDili 真实项目 prime immediate receipt shout 行为复测。
- 2026-05-21：总控验收 `AlembicPlugin` SHOUT-1/2 通过。代码证据：`AlembicPlugin/lib/external/mcp/handlers/task.ts:79` 的 `PrimeHostResponseInstruction` 已包含 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`；`task.ts:416` 的三态 `shoutInstruction` 都要求 "Immediately after this prime tool result" 且在任何 further tool call / code reading / edit / Guard / final summary 之前发声；`task.ts:439` 构造的 `hostResponse` 实际填入三项时序字段；`AlembicPlugin/plugins/alembic-codex/skills/alembic/SKILL.md:24` 把 Daily Coding Flow 改成 prime 后下一条可见响应必须是 receipt shout；`AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts:173` 和 `AlembicPlugin/test/unit/CodexMcpServer.test.ts:1098` 均断言新的时序字段和 Plugin-owned 路径。功能完整性检查结论：真实入口、结构化 payload、三态失败 / 空结果说明、Skill 消费方、local daemon ready 下 Plugin ownership、runtime artifact 与测试覆盖均已满足；允许启动 AlembicTest 真实项目复测。
- 2026-05-21：总控已刷新本机 Codex plugin cache 以便真实 Codex Skill 覆盖本轮变更。命令：`npm run dev:codex-plugin:refresh`。结果：成功；cache marker `gitHead=829f838704159c7ed205f93ecd986c6234173721`，`localMcpEntry=/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/dist/bin/codex-mcp.js`；cache Skill 已包含 immediate receipt shout；cache runtime dist 已包含 `immediate_after_prime` 和 `requiredBeforeNextAction`。刷新后 `AlembicPlugin` 和 `AlembicCodex` 工作区均干净。
- 2026-05-21：`AlembicTest` 回填 Test-2026-05-21-03，总控功能验收通过。关键证据：BiliDili 上下文 `alembic_task prime` 返回 `success=true`、`primeKnowledgeMaterial.status=delivered`、`acceptedKnowledge=5`、`acceptedGuards=1`、`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`、`timing=immediate_after_prime`、`requiredBeforeNextAction=true`、`visibility=developer_visible`；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`residentServiceRequested=false`；tool list / `nextActions` 不含 `codex_host_response`；prime tool result 后下一条开发者可见响应先声明收到 5 条 Recipe 和 1 条 Guard，再继续读取 probe JSON、复核 git 和写报告；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。当时封口判断：`AlembicTest` 仓库仍有未提交变更 `scripts/README.md`、`scripts/probe-codex-prime.mjs` 和 `docs/bilidili-prime-immediate-receipt-shout-test-2026-05-21.md`，因此曾发送 `AlembicTest` 做封口提交并回填 commit hash。
- 2026-05-21：`AlembicTest` 已完成 Test-2026-05-21-03 封口提交，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`，提交范围为测试报告、`scripts/probe-codex-prime.mjs` 和 `scripts/README.md`；`AlembicTest` 与 BiliDili 工作区均干净。
- 2026-05-21：用户在 BiliDili 新窗口人工验证后确认：Codex 确实能在 prime 后自己立即呐喊，符合预期；但当前可见呐喊包含大量 evidenceRefs 路径 / 行号，开发者不容易一眼看到知识摘要。用户进一步补充：希望 Codex 像真的呐喊那样大声喊出内容。总控据此新增 SHOUT-5，派发 `AlembicPlugin` 优化指令和 Skill：证据继续给 Codex 内部使用，可见呐喊默认用主动、有声量的短知识摘要把内容喊出来。
- 2026-05-21：`AlembicPlugin` 完成 SHOUT-5 可见摘要优化并回填，等待总控验收。
  - 完成范围：`lib/external/mcp/handlers/task.ts` 的 delivered 态 `shoutInstruction` 改为要求 Codex “shout a short, active knowledge receipt”，优先喊出接收到的 Recipe / Guard 约束、模式和后续判断依据；tool result `message` 不再把 `sourceRefs` 作为可见路径清单输出。empty / degraded 态继续保持 prime 后立即发声时序，但改为“shout a clear receipt”。`hostResponse` 字段、`timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"` 和 `primeKnowledgeMaterial.evidenceRefs` 结构保持不变。
  - Skill / runtime artifact：`plugins/alembic-codex/skills/alembic/SKILL.md` 已同步为“briefly and actively shout”知识摘要，并明确 evidence refs 留在 payload 中按需验证；`npm run prepare:codex-plugin-runtime` 已刷新 AlembicCodex `runtime.tgz`、runtime dist `task.js` 与 runtime Skill。
  - 提交 hash：AlembicPlugin `58b82f8526d68aef516d68477d7a0e505fc114e9`；AlembicCodex runtime artifact `df608057bd274ebb6b39f6a9c0e964f1b8517426`。
  - 验证命令：`npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run build:check`；`npm run build`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run verify:codex-channel`；`npm run verify:release-package-boundary`；`rg "Cite evidenceRefs|line number is missing|evidence refs when present|📍" lib plugins/alembic-codex/skills plugins/alembic-codex/runtime/dist/lib/external/mcp/handlers/task.js plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md`；`git diff --check`（AlembicPlugin 和 AlembicCodex）。
  - 验证结果：targeted Biome 通过；targeted vitest 38 tests passed；`build:check` / `build` / runtime prepare 通过；Codex plugin / channel / release package boundary 验证均通过；生产代码、Skill 和 runtime artifact 中旧证据倾倒提示负向扫描 0 命中；两个仓库 `git diff --check` 均通过。
  - 边界：未修改 BiliDili，未修改 `Alembic` daemon bridge，未新增 `codex_host_response` tool；`CodexMcpServer` 测试仍覆盖 local daemon ready 时 `alembic_task prime` 保持 Plugin-owned Codex-facing 路径。
  - Core 下沉判断：不需要。当前仍只有 AlembicPlugin 生产并直接面向 Codex host agent 消费该契约，没有第二个真实生产方或稳定共享消费方。
  - 本机 Codex plugin cache：需要总控验收后刷新。推荐仍由总控运行 `npm run dev:codex-plugin:refresh`，把本机 cache 更新到 AlembicPlugin `58b82f8526d68aef516d68477d7a0e505fc114e9` / AlembicCodex `df608057bd274ebb6b39f6a9c0e964f1b8517426`，再派发真实 Codex 行为复测。
  - AlembicTest 复测单：建议创建新的 BiliDili 可见行为复测单，重点验证 prime tool result 后的下一条开发者可见响应是否简短、主动、有声量地喊出 Recipe / Guard 摘要，并确认不默认倾倒 evidenceRefs 路径 / 行号。
  - 遗留风险：单元测试和 artifact 验证只能证明 payload / Skill / runtime 文案与边界；真实可见“呐喊”的语气和摘要质量仍需要 Codex host agent 在 BiliDili 场景中复测确认。
  - 下一步建议：总控复核提交与文档，刷新本机 Codex plugin cache，然后在 `docs/workspace/alembic-test-exchange.md` 创建新的 AlembicTest 测试单。
- 2026-05-21：总控验收 `AlembicPlugin` SHOUT-5 通过。代码证据：`AlembicPlugin/lib/external/mcp/handlers/task.ts:280` 的 tool result message 要求 “shout a short knowledge receipt” 并明确把 `evidenceRefs` 留在 payload 中；`task.ts:418` 的 delivered 态 `shoutInstruction` 要求 “shout a short, active knowledge receipt”，`task.ts:419` 要求 “Make it feel like a real shout”，`task.ts:420` 明确不要默认列出 evidenceRefs 路径或行号；`task.ts:448-451` 保持 `timing: "immediate_after_prime"`、`requiredBeforeNextAction: true`、`visibility: "developer_visible"`；`plugins/alembic-codex/skills/alembic/SKILL.md:25` 与 runtime Skill 均要求 “briefly and actively shout” 且不默认 dump paths / line numbers；`test/unit/TaskPrimeKnowledgeMaterial.test.ts:173-205` 覆盖短知识 receipt、负向旧文案和 message 不输出路径；`test/unit/CodexMcpServer.test.ts:1098-1118` 保持 local daemon ready 下 Plugin-owned prime payload 和新字段。负向扫描 `Cite evidenceRefs|line number is missing|evidence refs when present|📍` 对生产代码、Skill 与 runtime artifact 0 命中。`AlembicPlugin` 与 AlembicCodex 工作区均干净。
- 2026-05-21：总控已刷新本机 Codex plugin cache。命令：`npm run dev:codex-plugin:refresh`。结果：成功；cache marker `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，`localMcpEntry=/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin/dist/bin/codex-mcp.js`，runtime tarball hash `0f37bf3acaaa31df9d56531bafe46e853feaddd6815f50c9e958bdfa4a8697eb`；cache Skill 已包含 “briefly and actively shout”，cache runtime dist 已包含 “shout a short, active knowledge receipt”。允许启动 AlembicTest 真实项目复测 Test-2026-05-21-04。
- 2026-05-21：`AlembicTest` 回填 Test-2026-05-21-04，总控功能验收通过。关键证据：BiliDili 上下文 `alembic_task prime` 返回 `success=true`、`primeKnowledgeMaterial.status=delivered`、`acceptedKnowledge=5`、`acceptedGuard=1`、`evidenceRefs=18`；`hostResponse.action=shout_prime_knowledge_receipt`、`timing=immediate_after_prime`、`requiredBeforeNextAction=true`、`visibility=developer_visible`；`shoutInstruction` 要求 short / active / real shout，且不要默认列 evidenceRefs 路径 / 行号；`serviceBoundary.executionPath=plugin-owned-codex-facing`、`residentServiceRequested=false`；tool list / `nextActions` 不含 `codex_host_response`；prime tool result 后下一条开发者可见响应先喊出 BiliDili 已收到 5 条 Recipe 和 1 条 Guard，并把 SchemeRouter、RouteError / RouteResult、AnalyticsMiddleware、lazy var UI、ModuleManager、Protocol 命名后缀总结成开发者一眼能懂的知识摘要；`codexVisibleShoutDefaultsDumpEvidenceRefs=false`；BiliDili 测试前后 `git status --short --branch` 均为 `## main...origin/main`。当时封口判断：`AlembicTest` 仓库仍有未提交变更 `scripts/README.md`、`scripts/probe-codex-prime.mjs` 和 `docs/bilidili-prime-readable-receipt-shout-test-2026-05-21.md`，因此先让 Test-2026-05-21-04 保持 `执行中` 并发送 `AlembicTest` 做封口提交；随后封口结果见下一条。
- 2026-05-21：`AlembicTest` 完成 Test-2026-05-21-04 封口提交，commit `60bbd360be147062f834ee881630ca25918663d0`，提交范围为 readable receipt shout 测试报告、`scripts/probe-codex-prime.mjs` 和 `scripts/README.md`；`AlembicTest` 当前无未提交文件变更，`main` ahead 1；BiliDili 仍为 `## main...origin/main`。
- 2026-05-21：用户根据实际截图反馈：“Alembic prime 已接收” 的主语不符合预期，可以改成 Codex。总控复核真实代码后确认：`AlembicPlugin/lib/external/mcp/handlers/task.ts:280` 与 `task.ts:418` 已要求 “Codex must” / “in your own words”，Skill `plugins/alembic-codex/skills/alembic/SKILL.md:25` 也要求开发者可见 receipt shout，但当前没有显式禁止 Codex 把工具动作 “Alembic prime” 当成可见主语。新增 SHOUT-7 派发给 `AlembicPlugin`：收紧主语为 Codex / 我；用户明确该项不走 AlembicTest 真实项目测试，只按 Plugin 内部文案 / 契约 / 单元测试自验收口。
- 2026-05-21：`AlembicPlugin` 完成 SHOUT-7 可见主语收紧并回填，等待总控验收。
  - 完成范围：`lib/external/mcp/handlers/task.ts` 的 delivered / empty / degraded 三态可见提示与 `shoutInstruction` 均明确要求 Codex / first-person 作为 receipt 说话者，禁止把 “Alembic prime”、prime 或其它工具 / 流程作为可见 receipt 的语法主语；`hostResponse.reason` 改为 “As Codex...” 口径。保持 prime 后立即呐喊、知识摘要、不默认倾倒 evidenceRefs、Plugin-owned Codex-facing 路径不变。
  - 测试范围：`test/unit/TaskPrimeKnowledgeMaterial.test.ts` 覆盖 delivered / empty / degraded 的 first-person 主语约束、`hostResponse.reason` 的 Codex 口径、负向 “Alembic prime received / has received” 文案；`test/unit/CodexMcpServer.test.ts` 覆盖 local daemon ready 下 Plugin-owned prime payload 仍带 first-person 主语约束。
  - Skill / runtime artifact：`plugins/alembic-codex/skills/alembic/SKILL.md` 已要求 “shout as Codex or I”；`npm run prepare:codex-plugin-runtime` 已刷新 AlembicCodex `runtime.tgz`、runtime dist `task.js` 与 runtime Skill。
  - 提交 hash：AlembicPlugin `45db3a780759b7e4db24f920acbd56f0b4684d63`；AlembicCodex runtime artifact `2d4d8f0ce2b0a884e88a799be4fba7dffd47626a`。
  - 验证命令：`npx biome check --write lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts`；`npm run build:check`；`npm run build`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-plugin`；`npm run verify:codex-channel`；`npm run verify:release-package-boundary`；`npm run verify:codex-session`；`rg "Alembic prime (has )?(accepted|received)|Alembic prime 已接收|prime 已接收|Cite evidenceRefs|line number is missing|evidence refs when present|📍" lib plugins/alembic-codex/skills plugins/alembic-codex/runtime/dist/lib/external/mcp/handlers/task.js plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md`；`git diff --check`（AlembicPlugin 和 AlembicCodex）。
  - 验证结果：targeted Biome 通过；targeted vitest 38 tests passed；`build:check` / `build` / runtime prepare 通过；Codex plugin / channel / release package boundary / session scenarios 验证均通过；可见工具主语和旧 evidenceRefs 倾倒提示负向扫描 0 命中；两个仓库 `git diff --check` 均通过。
  - 边界：未修改 BiliDili，未修改 `Alembic` daemon bridge，未新增 `codex_host_response` tool；没有引入 Core shared contract。
  - 本机 Codex plugin cache：已在 resident vector search VEC-6 中一并刷新到后续 AlembicPlugin commit `2c98f69b1388c478bbbb255e487c51fde621cff7`，该提交包含 SHOUT-7 主语文案；cache marker `mode=local-mcp`，`.mcp.json` 指向 workspace local MCP entry。
  - AlembicTest 复测单：不创建。用户明确 SHOUT-7 不走真实项目测试，本项按 Plugin 内部文案 / 契约 / 单元测试自验收口。
  - 遗留风险：没有真实 Codex 可见截图复测，因此只能证明 Plugin payload、Skill、runtime artifact 和单元契约已收紧；真实宿主是否仍自行改写主语，需后续用户人工观察或另行授权测试。
  - 下一步建议：总控复核提交与文档，刷新本机 Codex plugin cache；如后续用户仍看到工具名主语，再追加更强的 Skill 例句或 host receipt schema 约束。
