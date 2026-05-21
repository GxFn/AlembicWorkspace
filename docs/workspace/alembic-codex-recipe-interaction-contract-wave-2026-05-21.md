# Alembic Codex Recipe Interaction Contract Wave 1

状态：待启动，发送给 `AlembicCore`、`AlembicPlugin`
总控窗口：AlembicWorkspace
创建日期：2026-05-21
适用范围：`AlembicCore`、`AlembicPlugin`

## 背景

`prime -> Codex 自主呐喊` V1 最小闭环已在 [alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md](alembic-codex-prime-knowledge-shout-workspace-plan-2026-05-21.md) 验收完成。测试窗口仍在持续生成 Recipes，本轮不打断 `AlembicTest`，也不新增测试单。

本 wave 只处理 Recipe 生成后会直接影响 Codex host agent 交互的契约问题：工具名、nextAction 可执行性、默认权限可见文案、host-response 动作表达，以及 `host-agent` 信任策略确认。

## 本轮目标

- 让 Mission Briefing / rescan / cold-start 输出只指向真实 Codex MCP 工具 `alembic_submit_knowledge`，不再提示旧 `knowledge({ action: "submit" })` / `submit_batch`。
- 让 `pendingSemanticReview` 后续的 `alembic_consolidate` 指令具备真实 `newRecipeId` 来源，不再给 Codex 空字符串占位。
- 收敛默认 Codex 可见的 lifecycle 文案，明确默认 agent tier 不能 publish / deprecate Recipe。
- 把 `codex_host_response` 从“看起来像 MCP tool”的表达中移出或标清，保留 Codex 公开呐喊动作但避免误调用。
- 对 `host-agent` 是否纳入 ConfidenceRouter trusted source 做代码证据驱动的策略确认；没有足够把握时先回填决策依据，不扩权。

## 非目标

- 不改 AlembicTest 当前测试任务，不新增真实项目复测。
- 不修改真实测试项目；真实项目相关操作统一通过 `AlembicTest` 承接。
- 不恢复或引入 AlembicAgent / internal AI / tool runtime 到 `AlembicPlugin`。
- 不把默认 Codex agent tier 扩权为可直接 publish / deprecate Recipe。
- 不更新 portable runtime / marketplace / channel，除非 `AlembicPlugin` 实现明确要求并在回填中说明。

## 真实代码事实

- Core cold-start 响应仍提示旧工具：`AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts:240` 输出 `knowledge({ action: "submit_batch" })`。
- Core rescan 响应仍提示旧工具：`AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts:207` 输出 `knowledge({ action: "submit" })`。
- Core Mission Briefing 支持层仍提示旧工具：`AlembicCore/src/workflows/capabilities/execution/external/MissionBriefingSupport.ts:227`、`:228`、`:474`、`:480`。
- Plugin 下游测试仍断言旧 Mission Briefing 字符串：`AlembicPlugin/test/unit/MissionBriefingProfile.test.ts:18`。
- `pendingSemanticReview` 类型当前只有 `index`、`title`、`relatedRecipe`、`reason`：`AlembicCore/src/service/knowledge/RecipeProductionGateway.ts:142`。
- `pendingSemanticReview` 在 create 之前收集，创建后 `result.created` 只有 `id` / `title` / `lifecycle` / `raw`，没有稳定 index：`AlembicCore/src/service/knowledge/RecipeProductionGateway.ts:447`、`:525`。
- Plugin 组装 `alembic_consolidate` nextAction 时把 `newRecipeId` 写成空字符串：`AlembicPlugin/lib/external/mcp/handlers/consolidated.ts:432`。
- `ConfidenceRouter` 默认 trusted sources 为 `bootstrap`、`cursor-scan`、`mcp`，不包含 `host-agent`：`AlembicCore/src/service/knowledge/ConfidenceRouter.ts:49`；Codex 写入来源已规范化为 `host-agent`：`AlembicCore/src/shared/source-contracts.ts:1`、`AlembicPlugin/lib/external/mcp/handlers/consolidated.ts:335`。
- Plugin lifecycle 工具实际只允许 `reactivate`：`AlembicPlugin/lib/external/mcp/handlers/knowledge.ts:376`，但工具描述仍写 approve / fast_track / reject / deprecate / publish：`AlembicPlugin/lib/external/mcp/tools.ts:478`。
- V1 prime 的 nextActions 里把宿主回复动作放在 `tool: 'codex_host_response'`：`AlembicPlugin/lib/external/mcp/handlers/task.ts:423`。

## Producer / Consumer 依赖

- `AlembicCore` 是 briefing 文案和 pending semantic review 生产侧。它必须先给出真实可消费的工具名和 `newRecipeId` / created item 关联。
- `AlembicPlugin` 是 Codex MCP tool 可见契约消费侧。它可以并行处理 lifecycle 文案与 host-response 表达；`pendingSemanticReview -> alembic_consolidate` 的完整消费侧修复必须等待 Core 回填稳定字段。
- `AlembicTest` 当前只是观察：测试那边 Recipes 继续生成，不参与本 wave。

## TODO / Backlog

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W1-PKS-1 | 待启动 | 交互契约修复 | P0 | `AlembicCore` | 把 Core cold-start、rescan、Mission Briefing 中旧 `knowledge({ action: ... })` / `submit_batch` 全部收敛为真实 `alembic_submit_knowledge({ items: [...] })` 调用说明，并更新 Core 测试。 | 否 | V1 验收后滚动 TODO-PKS-1。 | `AlembicCore` |
| W1-PKS-2A | 待启动 | 交互契约生产侧 | P0 | `AlembicCore` | 让 `RecipeProductionGateway.pendingSemanticReview` 在返回时能关联真实新 Recipe ID，或提供稳定 created item reference；不得让下游只能猜 title 或填空字符串。 | 否 | TODO-PKS-2；Plugin consumer 依赖此项。 | `AlembicCore` |
| W1-PKS-2B | 阻塞 | 交互契约消费侧 | P0 | `AlembicPlugin` | 在 Core 回填真实 `newRecipeId` 后，把 `alembic_submit_knowledge` 的 `nextAction.args.decisions[].newRecipeId` 改为真实 ID；当前不让 Plugin 猜字段。 | 否 | 阻塞于 W1-PKS-2A Core 提交和验证回填。 | `AlembicPlugin` |
| W1-PKS-3 | 待启动 | 策略确认 | P1 | `AlembicCore` | 基于 `host-agent` 已是 Codex 默认写入来源的事实，确认 ConfidenceRouter 是否应把 `host-agent` 作为 trusted source。若实现，必须保留 reasoning / quality / content gates；若不实现，回填明确策略理由。 | 否 | TODO-PKS-3。 | `AlembicCore` |
| W1-PKS-4 | 待启动 | 可见契约收敛 | P1 | `AlembicPlugin` | 收敛 `alembic_knowledge_lifecycle` 默认可见文案、schema 描述和相关测试，明确默认 Codex agent 只允许 `reactivate`，publish / deprecate / approve / fast_track 需 Dashboard 或 admin 路径。不得扩权。 | 否 | TODO-PKS-4。 | `AlembicPlugin` |
| W1-PKS-5 | 待启动 | Host response 契约优化 | P2 | `AlembicPlugin` | 调整 prime `nextActions` / payload 表达，把 `codex_host_response` 从真实 MCP tool call 语义中分离或标清；保留 `shoutInstruction` 和开发者可见呐喊动作。 | 否 | TODO-PKS-5。 | `AlembicPlugin` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>待启动 | 执行 W1-PKS-1、W1-PKS-2A、W1-PKS-3：修正 Core briefing 工具名；给 pending semantic review 提供真实新 Recipe ID / stable reference；确认或实现 `host-agent` ConfidenceRouter 策略。 |
| `AlembicPlugin`<br>待启动 | 执行 W1-PKS-4、W1-PKS-5：收敛 lifecycle 可见契约；修正 prime host-response action 表达。观察 W1-PKS-2B，不得在 Core 回填前猜 `newRecipeId` 字段。 |
| `Alembic`<br>无任务 | 当前不涉及 daemon、HTTP/API、Dashboard server、ProjectRegistry 或 internal AI job。 |
| `AlembicAgent`<br>无任务 | 当前是 Codex host agent MCP / Core workflow 契约，不涉及 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 当前不改 Dashboard UI；lifecycle publish/deprecate 仍通过 Dashboard/admin 路径，不在本 wave 改前端。 |
| `AlembicTest`<br>观察中 | Recipes 仍在生成中；本 wave 不新增测试单，不打断现有测试；后续真实测试项目相关操作也由此窗口承接。 |

## 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `AlembicCore` | 待启动 | P0 briefing 工具名与 pending review 生产侧在 Core。 | 是 |
| `AlembicPlugin` | 待启动 | lifecycle 可见契约与 prime host-response 表达为 Plugin 独立任务。 | 是 |
| `Alembic` | 无任务 | 当前无本地增强底座变更。 | 否 |
| `AlembicAgent` | 无任务 | 当前不涉及 AlembicAgent runtime。 | 否 |
| `AlembicDashboard` | 无任务 | 当前不涉及前端。 | 否 |
| `AlembicTest` | 观察中 | 既有 Recipes 生成继续，本 wave 不新增测试任务；真实测试项目操作统一由此窗口承接。 | 否 |

## 当前执行顺序

发送给：`AlembicCore`、`AlembicPlugin`。

不发送给：

- `Alembic`：无任务。
- `AlembicAgent`：无任务。
- `AlembicDashboard`：无任务。
- `AlembicTest`：观察中，当前 Recipes 生成继续，不新增测试单。

## 可复制分派提示词

发送给：`AlembicCore`、`AlembicPlugin`。

```text
读取 docs/workspace/alembic-codex-recipe-interaction-contract-wave-2026-05-21.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## AlembicCore 执行要求

目标：

- 修正 Core 输出给 Codex host agent 的 Recipe 生成指令，确保只出现真实工具 `alembic_submit_knowledge`。
- 为 pending semantic review 提供真实新 Recipe ID 或稳定关联，让下游 `alembic_consolidate` nextAction 可执行。
- 对 `host-agent` trusted source 策略做代码证据驱动判断。

范围：

- 优先查看并修改 `AlembicCore/src/workflows/cold-start/ColdStartPresenters.ts`、`AlembicCore/src/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts`、`AlembicCore/src/workflows/capabilities/execution/external/MissionBriefingSupport.ts`。
- W1-PKS-2A 优先在 `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts` 解决生产侧字段，不要求 Plugin 猜 title。
- W1-PKS-3 优先在 `AlembicCore/src/service/knowledge/ConfidenceRouter.ts` 和相关测试中确认策略；若实现，把 `host-agent` 作为显式常量或清楚说明为何加入 trusted list，不得绕过质量门。

禁止事项：

- 不修改 `vendor/AlembicCore`。
- 不引入 Codex MCP / Skill / marketplace 文案到 Core。
- 不把 `host-agent` trusted 策略做成无条件自动发布；必须仍经过内容、reasoning、quality 和 confidence gates。
- 不修改 `AlembicPlugin` 代码；若发现 Plugin 下游测试必须同步，回填阻塞点和建议。

验证命令：

```bash
npm run build:check
npm run test -- test/PublicHostAgentWorkflowEntrypoints.test.ts test/unit/HostAgentMiningWorkflow.test.ts test/unit/production-gateway.test.ts test/unit/KnowledgeService.test.ts
git diff --check
```

文档动作：

- 在 `docs/AlembicCore/` 新建或更新执行记录，建议文件名 `alembic-core-recipe-interaction-contract-wave-1-2026-05-21.md`。
- 回填到本文“回填区”：完成范围、提交 hash、验证命令、验证结果、遗留风险、是否需要 Plugin 消费侧继续执行 W1-PKS-2B。

## AlembicPlugin 执行要求

目标：

- 收敛默认 Codex 可见 lifecycle 工具契约，避免误以为默认 agent 可以 publish / deprecate Recipe。
- 修正 prime payload 中 host-response 动作表达，避免 `codex_host_response` 被误解为真实 MCP tool。
- 观察 W1-PKS-2B；不得在 Core 未回填真实字段前猜 `newRecipeId`。

范围：

- 优先查看并修改 `AlembicPlugin/lib/external/mcp/tools.ts`、`AlembicPlugin/lib/external/mcp/handlers/knowledge.ts`、`AlembicPlugin/lib/external/mcp/handlers/task.ts` 和相关 tests。
- 可同步调整 `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` 中对 lifecycle action 的描述或 enum，如果默认 Codex 可见 schema 需要收敛；但不得破坏 admin / Dashboard 长期能力。
- W1-PKS-5 可以把 `codex_host_response` 改为 `hostAction` / `hostResponse` / `responseInstruction` 等非 MCP tool 语义字段；必须保留旧 `shoutInstruction`。

禁止事项：

- 不扩权：默认 Codex agent tier 不允许 publish、deprecate、approve、fast_track。
- 不实现 Codex agent runtime。
- 不改 Core 源码或 vendor Core。
- 不处理 W1-PKS-2B 的完整 nextAction ID 消费，除非 Core 已回填真实字段和验证结果。
- 不修改真实测试项目、`AlembicDashboard` 或测试线文档。

验证命令：

```bash
npm run build:check
npm run test -- test/unit/KnowledgeAPI.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/integration/ZodSchemas.test.ts
npm run verify:codex-plugin
git diff --check
```

文档动作：

- 在 `docs/AlembicPlugin/` 新建或更新执行记录，建议文件名 `alembic-plugin-recipe-interaction-contract-wave-1-2026-05-21.md`。
- 回填到本文“回填区”：完成范围、提交 hash、验证命令、验证结果、遗留风险，以及 W1-PKS-2B 是否仍阻塞于 Core。

## 回填区

- 2026-05-21：用户说明 `AlembicTest` Recipes 仍在生成中，要求总控再做一轮计划分配。总控启动本 wave，仅发送给 `AlembicCore`、`AlembicPlugin`，不新增 `AlembicTest` 测试单。
