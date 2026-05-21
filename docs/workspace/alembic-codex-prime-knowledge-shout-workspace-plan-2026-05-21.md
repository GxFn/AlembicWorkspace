# Alembic Codex Prime Knowledge Shout Workspace Plan

状态：最小闭环已完成，发送给无
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicPlugin`，`AlembicCore` 观察

## 背景

本文件是 Recipe 产出后，Codex 通过 `alembic_task prime` 拿到知识库信息，并由 Codex 自己向开发者公开声明“我接受到了哪些知识”的最小闭环计划。

用户已确认本轮先做闭环：

- Codex 的呐喊内容先由 Codex 自己决定，不在本轮固定模板。
- 可见程度本轮不做限制，不先做摘要 / delta / 降噪策略。
- 源码证据本轮只做一个指向和行号，不先做片段、symbol、复杂可信度分级。
- 最重要的是先让 `prime -> Codex 接受知识 -> Codex 公开呐喊 -> 开发者知道 Codex 接受了哪些知识` 跑通，后续再优化逻辑。

上一测试线 `alembic-agent-evidence-recording-phase-chain-workspace-plan-2026-05-20.md` 继续作为测试线入口保留；测试窗口按既有节奏持续运行。本文件不创建 `AlembicTest` 测试单，不改变测试窗口发送名单。

## 主线目标

当项目已有 Recipe / Guard 规则后，Codex agent 在执行真实开发任务前调用 `alembic_task prime`，应能拿到足够结构化的知识材料，并主动对开发者说出自己接受到了哪些知识。

最小闭环完成后应满足：

- `prime` 返回结构化 `primeKnowledgeMaterial`，保留现有 `knowledge` / `searchMeta` 兼容字段。
- `primeKnowledgeMaterial` 至少列出 Codex 可接受的 Recipe / Guard：`id`、`title`、`trigger`、`actionHint` / `summary`、`score`。
- 每条 Recipe 尽量上浮源码证据：`evidenceRefs: [{ path, line }]`；证据只能来自真实 `sourceRefs` / `reasoning.sources` / Recipe 内容里的路径行号，不得伪造。
- `prime` 返回 `shoutInstruction`，明确要求 Codex 拿到材料后，用自己的话向开发者声明接受了哪些知识。
- 空结果也要形成闭环：Codex 应声明没有从 `prime` 接受到可用项目知识，而不是静默继续。
- 本轮不要求固定呐喊文案、不限制可见长度、不做 trust 分级、不做复杂策略。

## 非目标

- 不在 AlembicPlugin 内实现 Codex agent runtime。
- 不把 `AlembicAgent` 当作 Codex host agent。
- 不修改真实测试项目业务代码；如需真实项目验证，后续只通过 `AlembicTest` 测试单承接。
- 不创建新的 AlembicTest 测试单；需要产品验证时后续再按测试交流文档单独派发。
- 不直接把 Recipe publish / deprecate 权限开放给默认 Codex agent tier。
- 不在本轮实现知识呐喊降噪、增量呐喊、强中弱可信度分级或完整证据片段展示。

## 真实代码事实摘要

- `AlembicPlugin` 通过 Codex MCP 工具、Skill 文档和工具返回的 `message` / `data` / `nextAction` 引导 Codex host agent；插件内部不实现 Codex agent runtime。
- `alembic_task prime` 入口在 `AlembicPlugin/lib/external/mcp/handlers/task.ts`：抽取 intent，调用 PrimeSearchPipeline，返回 related knowledge 和 guard rules。
- `PrimeSearchPipeline` 位于 `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts`：auto / semantic / keyword 多路召回，用加权 RRF 合并，最多返回 5 条 knowledge 和 3 条 guard。
- 当前搜索结果投影来自 `AlembicCore/src/service/search/SearchTypes.ts` 的 `SlimSearchResult`，字段包括 `id`、`title`、`trigger`、`kind`、`language`、`score`、`description`、`actionHint`、`knowledgeType`、`sourceRefs`。
- `sourceRefs` 真实来源是 `recipe_source_refs` 桥接表；`SearchEngine` 会批量读取非 stale source refs 并挂到搜索结果。
- `recipe_source_refs` 由 `SourceRefReconciler` 从 `knowledge_entries.reasoning.sources` 填充，并验证路径是否存在，记录 `active` / `stale` / `renamed`。
- 当前 `prime` 只把 `sourceRefs` 作为 message 附加行和 slim result 字符串数组返回，没有把“Codex 应公开声明接受了哪些知识”作为结构化协议。

## 当前 `prime` 输出现状

真实输入：

- `operation=prime`
- `userQuery`：用户当前自然语言任务。
- `activeFile`：IDE / Codex 当前文件路径。
- `language`：当前语言，可选。

当前返回给 Codex 的内容：

- `message`：一句 `Found X recipe(s), Y guard rule(s).`，再列出 Recipe trigger / title、`actionHint` 和 `sourceRefs`；Guard 目前只列 `[rule] trigger/title`。
- `data.knowledge.relatedKnowledge[]`：`id`、`title`、`trigger`、`kind`、`language`、`score`、`description`、`actionHint`、`knowledgeType`、`sourceRefs`。
- `data.knowledge.guardRules[]`：同样是 slim search projection。
- `data.searchMeta`：`queries`、`scenario`、`language`、`module`、`resultCount`、`filteredCount`。
- `data._taskRules`：提醒 Codex 每条消息先 prime、非简单任务 create、完成后 close 并 guard。

当前缺口：

- Codex 拿到了搜索摘要，但没有被要求主动向开发者呐喊“我接受到了哪些知识”。
- 开发者不能稳定知道 Codex 接受了哪些 Recipe / Guard，也看不到 Codex 接受这些知识的源码依据。
- `sourceRefs` 只作为字符串数组附在下层，没有被组织成顶层证据材料。
- `No matching recipes found.` 仍是 success，但缺少“没有接收到项目知识”的呐喊指令。

## V1 呐喊机制设计

本轮只实现最小协议，不先做复杂策略。

`prime` 应新增结构化字段：

```ts
{
  primeKnowledgeMaterial: {
    status: 'delivered' | 'empty' | 'degraded',
    receiptId: string,
    intent: {
      userQuery: string,
      activeFile?: string,
      language?: string,
      module?: string,
      scenario: string,
      queries: string[]
    },
    acceptedKnowledge: Array<{
      id: string,
      kind: string,
      title: string,
      trigger: string,
      actionHint?: string,
      summary: string,
      score: number,
      evidenceRefs: Array<{
        path: string,
        line: number | null
      }>
    }>,
    acceptedGuards: Array<{
      id: string,
      title: string,
      trigger: string,
      actionHint?: string,
      score: number,
      evidenceRefs: Array<{
        path: string,
        line: number | null
      }>
    }>,
    shoutInstruction: string,
    nextActions: Array<{
      tool: string,
      args: Record<string, unknown>,
      reason: string,
      required: boolean
    }>
  }
}
```

V1 规则：

- `status=delivered`：至少命中 1 条 Recipe 或 Guard。Codex 应自己公开声明接受到了哪些知识。
- `status=empty`：没有命中 Recipe / Guard。Codex 应公开声明没有从 `prime` 接受到可用项目知识。
- `status=degraded`：检索链路异常、pipeline 不可用或无法完成。Codex 应公开声明 prime 降级，并说明不会假装已接受项目知识。
- `shoutInstruction` 只规定动作，不规定文案：Codex 应用自己的话向开发者声明本次接受的 Recipe / Guard、源码证据指向和后续行动。
- `evidenceRefs` 只要求 `path + line`；如果只拿到路径，没有行号，则 `line=null`，Codex 呐喊时应如实说“有路径但缺行号”。不得编造行号。
- `line` 可以从 `sourceRefs` 字符串中的 `path:line`、`reasoning.sources` 中的 `path:line`、Recipe markdown 中的来源标注提取；没有真实来源就保持 `null`。
- 保留现有 `data.knowledge` / `data.searchMeta`，避免破坏现有调用方。

Codex 应做出的呐喊动作：

```text
我已从 prime 接受到这些项目知识：
- Recipe / Guard: <id/title>
  我接受的原因：<trigger/actionHint/summary>
  源码证据：<path:line 或 path:行号缺失>

我会基于这些知识继续执行；如果没有命中，我会说明没有接收到项目知识。
```

## 后续优化 Backlog

以下内容不进入 V1 最小闭环：

- 固定呐喊模板或限制可见程度。
- full / delta shout 策略。
- strong / medium / weak / unknown trust 分级。
- sourceRef status / verifiedAt / origin 上浮。
- 代码片段、symbol、证据摘要。
- Codex 是否需要在 close / guard 时回指 receipt 的强校验。

## 阶段计划

| 阶段 | 状态 | 目标 | 主要窗口 | 完成定义 |
| --- | --- | --- | --- | --- |
| Stage 0 | 已完成 | 总控确认主线，把文档从 Recipe 交互 TODO 调整为 Codex prime 知识接收与公开声明主线。 | `AlembicWorkspace` | 当前文档、索引和状态入口均指向 prime knowledge shout。 |
| Stage 1 | 已完成 | 实现 V1 最小闭环：`prime` 返回 `primeKnowledgeMaterial` 和 `shoutInstruction`，证据只做路径 + 行号。 | `AlembicPlugin` | 真实 handler payload 能返回结构化材料；Codex 能据此自己发出知识接收声明；空结果 / 降级也有呐喊指令。 |
| Stage 2 | 暂停 | 视 Stage 1 回填判断是否需要 Core 类型或 sourceRef 元数据增强。 | `AlembicCore` | 只有 V1 闭环无法在 Plugin 内完成时才启动。 |
| Stage 3 | 已完成 | 总控验收 `prime` 接收与公开声明是否形成真实可用闭环。 | `AlembicWorkspace` | 功能完整性检查覆盖入口、真实数据、返回 payload、Codex 接收声明、失败路径和验证命令。 |

## 主线任务

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 任务 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MAIN-PKS-1 | 已完成 | 主线修复 | P0 | `AlembicPlugin` | 在 `alembic_task prime` 响应中新增 `primeKnowledgeMaterial`，保留旧字段；把 Recipe / Guard 命中、路径行号证据和 `shoutInstruction` 交给 Codex，让 Codex 自己公开声明接受到的知识。 | 否 | 用户确认 V1 先做闭环。 | `AlembicPlugin` |
| MAIN-PKS-2 | 已完成 | 主线验收 | P0 | `AlembicWorkspace` / `AlembicPlugin` | 验收真实 `prime` payload 是否能支撑 Codex 自主呐喊，并覆盖 delivered / empty / degraded。 | 否 | MAIN-PKS-1 已完成回填。 | `AlembicWorkspace` |

## TODO / Backlog

以下 TODO 是主线任务执行时可以并行处理的修复项；它们不替代 Codex 通过 `prime` 接收并公开声明知识的主线，也不应阻塞 V1 闭环。

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TODO-PKS-1 | 暂停 | 并行修复 / 交互契约 | P0 | `AlembicCore` / `AlembicPlugin` | Recipe 产出后的 Mission Briefing 仍提示旧工具名 `knowledge({ action: "submit" })` / `submit_batch`，需要统一为真实暴露的 `alembic_submit_knowledge`，避免 Codex host agent 被错误 next step 带偏。 | 否 | V1 闭环不依赖；主线启动后可并行。 | `AlembicCore` / `AlembicPlugin` |
| TODO-PKS-2 | 暂停 | 并行修复 / 交互契约 | P0 | `AlembicPlugin` / `AlembicCore` | `alembic_submit_knowledge` 返回 `pendingSemanticReview` 时，建议的 `alembic_consolidate` nextAction 中 `newRecipeId` 为空；需要让返回数据能直接关联新 Recipe ID，形成可执行的合并 / 拒绝闭环。 | 否 | V1 闭环不依赖；主线启动后可并行。 | `AlembicPlugin` |
| TODO-PKS-3 | 暂停 | 并行策略确认 | P1 | `AlembicCore` / `AlembicPlugin` | Codex 提交 source 已规范化为 `host-agent`，但 ConfidenceRouter 默认 trusted sources 不包含 `host-agent`；需要确认 Codex host-agent Recipe 应走更高阈值还是纳入受信来源。 | 否 | 后续策略优化时处理。 | `AlembicCore` |
| TODO-PKS-4 | 暂停 | 并行修复 / 契约收敛 | P1 | `AlembicPlugin` | lifecycle schema / tool 描述看起来覆盖 publish / deprecate 等动作，但当前 handler 默认只开放有限 admin 操作；需要收敛 Codex agent 可见文案，避免误以为默认 tier 可直接发布 / 废弃 Recipe。 | 否 | 后续契约收敛时处理；不得把默认 Codex agent tier 扩权作为修复方式。 | `AlembicPlugin` |
| TODO-PKS-5 | 暂停 | 并行优化 / 契约清晰度 | P2 | `AlembicPlugin` | V1 用 `nextActions[].tool = codex_host_response` 表达“宿主可见回复动作”。这能完成呐喊闭环，但 V2 应把 host response action 和真实 MCP tool call 区分得更清楚，避免 Codex 把它误当成可调用工具。 | 否 | V1 验收发现；不阻塞最小闭环。 | `AlembicPlugin` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | V1 最小闭环已通过总控验收：`alembic_task prime` 返回 `primeKnowledgeMaterial`、路径行号证据和 `shoutInstruction`；Codex 呐喊文案由 Codex 自己决定；保留旧字段兼容。 |
| `AlembicCore`<br>无任务 | V1 可完全使用现有 `SlimSearchResult.sourceRefs`、`description`、`actionHint` 和 `searchMeta` 完成；本轮不启动 Core。 |
| `Alembic`<br>无任务 | 当前主线不涉及本地增强 daemon、Dashboard server、HTTP/API 或 internal AI job 实现。 |
| `AlembicAgent`<br>无任务 | 当前主线是 Codex host agent prime 知识接收与公开声明，不涉及 AlembicAgent runtime / provider / tool loop。 |
| `AlembicDashboard`<br>无任务 | 当前主线不涉及 Dashboard UI 或前端状态消费。 |
| `AlembicTest`<br>无任务 | 当前不创建测试单；既有测试线继续独立运行，本文件不新增测试执行任务。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 已完成 | V1 闭环已由 Plugin 回填并通过总控验收；后续 TODO 暂停，不发送新任务。 | 否 |
| `AlembicCore` | 无任务 | V1 不需要修改 Core；后续 sourceRef 元数据增强另起任务。 | 否 |
| `Alembic` | 无任务 | 当前无 daemon / HTTP / CLI / Dashboard server 变更。 | 否 |
| `AlembicAgent` | 无任务 | 当前不涉及 AlembicAgent runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 当前不涉及前端。 | 否 |
| `AlembicTest` | 无任务 | 当前不新增测试单，避免干扰既有持续测试。 | 否 |

## 当前执行顺序

发送给：无。

不发送给：

- `AlembicPlugin`：已完成，后续 TODO 暂停。
- `AlembicCore`：无任务，V1 不需要修改 Core。
- `Alembic`：无任务。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。
- `AlembicTest`：无新测试任务。

## 可复制分派提示词

发送给：无。

当前 V1 闭环已通过总控验收，不再发送领取提示词。

## AlembicPlugin 执行要求

目标：

- 先做 `prime -> Codex 自主呐喊` 的最小闭环。
- `prime` 必须提供足够结构化的 `primeKnowledgeMaterial`，让 Codex 自己向开发者声明接受到了哪些知识。
- 源码证据本轮只要求路径 + 行号；不得编造行号。

范围：

- 优先修改 `AlembicPlugin/lib/external/mcp/handlers/task.ts` 和必要的 Plugin 侧测试。
- 可使用现有 `relatedKnowledge[].sourceRefs`、`guardRules[].sourceRefs`、`description` / `actionHint` 等字段构造 V1 材料。
- 若必须读取完整 Recipe 详情或 Core sourceRef 元数据才能闭环，应先回填阻塞点，不要擅自扩大到 Core 大改。

禁止事项：

- 不实现 Codex agent runtime。
- 不固定 Codex 的最终呐喊文案，只提供 `shoutInstruction` 和结构化材料。
- 不做可见程度限制、delta shout、trust 分级、sourceRef verifiedAt/status 上浮等后续优化。
- 不把弱证据包装成强证据；没有行号就返回 `line: null` 并让 Codex 如实说明。
- 不修改真实测试项目、`AlembicAgent`、`AlembicDashboard` 或测试线文档。

验证命令：

```bash
npm run build:check
npm run test -- test/integration/ZodSchemas.test.ts
npm run test -- test/unit/CodexMcpServer.test.ts
git diff --check
```

如新增 targeted test 覆盖 `taskHandler prime`，需一并回填实际命令。

文档动作：

- 可在 `docs/AlembicPlugin/` 新建单仓库执行记录，文件名建议 `alembic-plugin-prime-knowledge-shout-v1-2026-05-21.md`。
- 回填到本文“回填区”：完成范围、提交 hash、验证命令、验证结果、遗留风险和是否需要启动 `AlembicCore`。

## 回填区

- 2026-05-21：用户确认 V1 先做闭环：Codex 自己决定呐喊内容，不限制可见程度，源码证据先只做路径 + 行号；后续再优化逻辑。总控据此把当前窗口改为 `AlembicPlugin` 待启动。
- `AlembicPlugin`：MAIN-PKS-1 已完成回填。执行记录：[../AlembicPlugin/alembic-plugin-prime-knowledge-shout-v1-2026-05-21.md](../AlembicPlugin/alembic-plugin-prime-knowledge-shout-v1-2026-05-21.md)。提交 hash：AlembicPlugin `d83683bd23b6027b99c6085943639f2df9868840`；AlembicCodex runtime artifact `a76fa073ecabf1a6c1bfd83eeffeb0146892b5e0`；embedded AlembicCore snapshot `15a9fb21301c44e8b9d57ee0343ff54d0b0d1ce0`。
  - 完成范围：`alembic_task prime` 新增 `data.primeKnowledgeMaterial`，包含 `status`、`receiptId`、`intent`、`acceptedKnowledge`、`acceptedGuards`、`shoutInstruction` 和 `nextActions`；保留旧 `knowledge` / `searchMeta` / `_taskRules`；`sourceRefs` 只从真实搜索结果解析路径 + 行号，无行号返回 `line: null`；empty / degraded 路径也返回 Codex 公开声明指令；刷新 AlembicCodex packaged runtime artifact。
  - 验证命令：`npx vitest run --config vitest.unit.config.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts` 通过；`npx biome check lib/external/mcp/handlers/task.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts --diagnostic-level=error` 通过；`npm run build:check` 通过；`npm run test -- test/integration/ZodSchemas.test.ts` 通过；`npm run test -- test/unit/CodexMcpServer.test.ts` 通过；`npm run build` 通过；`npm run prepare:codex-plugin-runtime` 通过；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`npm run verify:release-package-boundary` 通过；`git diff --check` 通过；`git -C plugins/alembic-codex diff --check` 通过。
  - 验证结果：delivered 路径能返回结构化材料并保留旧字段；empty / degraded 路径均给出 `shoutInstruction`，避免 Codex 静默继续或假装接收知识；AlembicPlugin 与 AlembicCodex runtime artifact 均已提交并推送到 `origin/main`。
  - 是否需要启动 `AlembicCore`：暂不需要。V1 闭环使用现有 `SlimSearchResult.sourceRefs`、`description`、`actionHint` 和 `searchMeta` 可完成；本轮没有修改 Core 类型。
  - 遗留风险：本轮未固定 Codex 最终呐喊文案，未做 sourceRef status / verifiedAt / origin 上浮、trust 分级、证据片段或 delta shout；仍需总控用真实 MCP prime 调用验收 Codex 是否会按 `shoutInstruction` 输出开发者可见声明。
  - 下一步建议：总控验收 delivered / empty / degraded payload；验收通过后再决定是否启动固定模板、降噪、sourceRef 元数据上浮或 Core 类型增强。
- `AlembicWorkspace` 总控验收：MAIN-PKS-1 / MAIN-PKS-2 已通过，V1 最小闭环关闭。
  - 代码证据：`AlembicPlugin/lib/external/mcp/handlers/task.ts` 在 `prime` 中构造 `primeKnowledgeMaterial`（line 242）、保留旧 `knowledge` / `searchMeta`（line 275）、定义投影结构（line 293）、投影 Recipe / Guard（line 338 / line 351）、解析 `sourceRefs` 为 `{ path, line }`（line 366 / line 388）、生成 `shoutInstruction`（line 400）和后续动作提示（line 423）。
  - 测试证据：`AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts` 覆盖 delivered、empty、degraded 三条路径（line 80、line 172、line 195）。
  - 产物证据：`AlembicPlugin/plugins/alembic-codex/runtime/dist/lib/external/mcp/handlers/task.js` 已包含同构字段；`plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json` 记录 Core snapshot `15a9fb21301c44e8b9d57ee0343ff54d0b0d1ce0`。
  - 总控实跑：`npm run test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts` 通过 3 个测试；`npm run test -- test/unit/CodexMcpServer.test.ts` 通过 34 个测试；`npm run test -- test/integration/ZodSchemas.test.ts` 通过 65 个测试；`npm run build:check` 通过；`git -C AlembicPlugin diff --check` 通过；直接调用 `dist/lib/external/mcp/handlers/task.js` 的 `taskHandler(prime)` 样例 payload 返回 `status=delivered`、`acceptedKnowledge`、`acceptedGuards`、`evidenceRefs`、`shoutInstruction`，且旧 `knowledge` / `searchMeta` 仍存在。
  - 功能完整性检查：真实入口是 `alembic_task prime`；真实数据来源是 `PrimeSearchPipeline` 返回的 `SlimSearchResult`；状态分支覆盖 delivered / empty / degraded；消费方是 Codex host agent 可见的 `message` + `data.primeKnowledgeMaterial.shoutInstruction`；失败 / 空结果路径不会静默继续或假装接受知识。V1 不需要启动 `AlembicCore`，也不新增 `AlembicTest` 测试单。
  - 遗留风险：`nextActions[].tool = codex_host_response` 是 host-response 语义而非真实 MCP tool；V1 接受，已登记为 TODO-PKS-5，后续契约优化时收敛。
