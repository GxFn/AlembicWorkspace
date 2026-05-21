# Prime Immediate Receipt Shout Workspace Plan

状态：`AlembicPlugin` 待启动（prime receipt shout 摘要可读性优化），`AlembicTest` 已完成
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`、`AlembicTest`、`AlembicCore`、`Alembic`

## 用户目标

`prime` 的知识呐喊不是最终总结动作，也不是 Plugin 直接替 Codex 生成一段固定摘要。目标是：Codex host agent 在拿到 `alembic_task(operation="prime")` 返回的 `primeKnowledgeMaterial` 后，立刻用自己的话向开发者发出可见的知识接收声明，说明“我接收到了哪些 Recipe / Guard / 项目知识、这些知识会怎样约束接下来的判断、是否为空或降级”，然后再继续后续搜索、读代码、编辑或验收。

这对应用户提出的“共有知识 / 公共知识”区别：Recipe 被注入后只是 Codex 知道；Codex 立即呐喊后，开发者也知道 Codex 知道了哪些内容，知识才变成公共知识。

2026-05-21 用户在 BiliDili 新窗口人工验证后确认：当前 prime 后确实会自己呐喊，符合时序预期；但可见内容过度暴露 evidenceRefs 路径 / 行号，开发者第一眼读到的是证据清单而不是知识摘要。下一步优化目标是：证据指向继续保留在 payload 里供 Codex 自己使用和后续复核；开发者可见呐喊默认输出简短、可读、有声量的知识摘要，像真的呐喊一样把接收到的关键内容喊出来，不把 evidenceRefs 当作主要可见内容倾倒出来。

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
| SHOUT-5 | 待启动 | 可见摘要优化 | P0 | `AlembicPlugin` | 优化 prime receipt shout 指令：开发者可见内容应像真的呐喊一样有声量地喊出知识摘要；证据路径 / 行号给 Codex 内部使用，不默认倾倒到可见呐喊。 | 是 | 用户 BiliDili 人工验证确认时序正确，但截图显示当前呐喊过度输出 evidenceRefs；代码证据见 `task.ts:421` 与 Skill `alembic/SKILL.md:25`。 | `AlembicPlugin` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>待启动 | 执行 SHOUT-5：保持 prime 后立即呐喊的时序和结构化 evidenceRefs，但调整 `shoutInstruction` / Skill / 测试，让可见呐喊像真的呐喊一样主动喊出知识摘要，不输出长路径证据清单。 |
| `AlembicTest`<br>已完成 | Test-2026-05-21-03 已封口，commit `b532cd8bf7c40c8f12b93f91380befdea617d999`；等待 Plugin 完成 SHOUT-5 后再决定是否创建新复测单。 |
| `Alembic`<br>观察中 | 不修改 daemon bridge，不承接 Codex-facing prime ownership；后续仍作为 resident service 被 Plugin 按需请求。 |
| `AlembicCore`<br>观察中 | 本轮不派发；除非 Plugin 实现证明 shared contract 已有真实双向消费需求。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent / Plugin Skill 行为，不涉及 Alembic internal AI runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不涉及 Dashboard UI。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 待启动 | 当前可独立修改指令、Skill 和测试，不需要等待 AlembicTest。 | 是 |
| `AlembicTest` | 已完成 | Test-2026-05-21-03 已封口；下一轮真实复测等 Plugin 完成后再创建测试单。 | 否 |
| `Alembic` | 观察 | daemon bridge 已完成且不承接 prime ownership，本轮无需修改。 | 否 |
| `AlembicCore` | 观察 | 暂无真实双向消费方，不启动共享层下沉。 | 否 |
| `AlembicAgent` | 无任务 | 不涉及 Alembic internal AI runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 不涉及 Dashboard UI。 | 否 |

## 当前执行顺序

发送给：`AlembicPlugin`。

不发送给：

- `AlembicPlugin`：执行 SHOUT-5 可见摘要优化。
- `Alembic`：观察中，daemon bridge 不作为 prime 主路径。
- `AlembicCore`：观察中，本轮暂无共享层下沉证据。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。

## 可复制分派提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/prime-immediate-receipt-shout-workspace-plan-2026-05-21.md，按照 SHOUT-5 完成 AlembicPlugin 的 prime receipt shout 摘要可读性优化。目标：保持 prime tool result 后立即 developer-visible receipt shout 的时序、`hostResponse` 字段和 `primeKnowledgeMaterial.evidenceRefs` 结构不变，但调整 `shoutInstruction`、Alembic Codex Skill、相关测试和 runtime artifact，让开发者可见呐喊像真的呐喊一样主动、明确、有声量地喊出简短知识摘要，说明接收到的 Recipe / Guard 约束、模式和后续判断依据；不要默认倾倒 evidenceRefs 路径 / 行号，也不要把“缺少行号”作为可见呐喊重点。证据仍保留在 payload 中供 Codex 后续读代码、复核或在用户要求时引用。禁止修改 BiliDili、Alembic daemon bridge 或新增 `codex_host_response` tool。完成后回填提交 hash、验证命令 / 结果、改动范围、Skill / runtime artifact 是否同步、是否需要总控刷新本机 Codex plugin cache，以及是否需要创建新的 AlembicTest 复测单。
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
