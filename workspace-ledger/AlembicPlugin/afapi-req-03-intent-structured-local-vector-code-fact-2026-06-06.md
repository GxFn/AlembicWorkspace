# AFAPI REQ 03 Plugin Intent Structured Local Vector Code Fact

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR-CODE-FACT-T1

## 范围

- 本轮只在 AlembicPlugin 仓库边界内做 Stage 0 只读代码事实复核。
- 复核对象：`alembic_intent` public schema、handler、local intent record、source policy、vector plan、prime consumption boundary、redaction、focused tests。
- 不做产品实现，不提交 runtime bundle / submodule，不代领 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目职责。
- 当前 TargetResultEnvelope 只作为目标窗口回填，不能替代总控验收或产品最终裁决。

## 结论

- 当前 AlembicPlugin 已有 active `alembic_intent` public MCP tool，公开 schema 能接收 `hostDeclaredIntent`、`hostTurnMeta`、`sourceRefs`、`intentKind`、`inputSource`，handler 能返回 `intentRef`、`recognizedIntent`、`detailRefs`、`sourcePolicy` 和 `vectorPlan`。
- 当前实现已经防止 raw automation envelope 直接成为 semantic intent：无 curated host intent 时 `alembic_intent` 返回 `skipped / mechanical-envelope-only`；`alembic_prime` 对 `automation-envelope` 且缺 `sourceRefs` 的请求返回 `blocked / missing-referenced-docs`。
- 当前 Host turn metadata 已做 redaction：raw `threadId` / `conversationId` / `sessionId` 在 handler 内只转换为 hash，私有绝对路径不会作为 evidence/sourceRef 保留；`sourcePolicy.rawThreadIdsPersisted=false`。
- 当前 `alembic_intent` 的 local record 是 Plugin 进程内 `Map`，最多 100 条；它不是 durable resident `IntentEpisode`，也不是 Alembic dataRoot 持久化 producer。Plugin 侧 prime pipeline 只把 resident intent handoff 传给 resident semantic search。
- Design 提到的 enum 要求当前只有一部分是 public contract，其余多数是 internal classifier、自由文本字段、result status/reason 或尚未实体化字段。Stage 1 需要裁决是扩大 public schema，还是明确保留为内部推导字段。
- 重要缺口：`intentHandler` 当前会在 `skipped` / `degraded` 路径也生成 `intentRef` 并写入 local in-memory record。若完成定义要求 status-only / mechanical / no-semantic 不创建可消费 local intent record，需要 Stage 1 修改 handler 行为和测试。

## 代码事实

### Public Schema

- `lib/shared/schemas/mcp-tools.ts:38` 定义 `HostDeclaredIntentInput`，字段包括 `query`、`summary`、`goal`、`action`、`scenario`、`language`、`module`、`labels`、`keywords`、`sourceRefs`、`confidence`、`source`。
- `lib/shared/schemas/mcp-tools.ts:66` 定义 `HostTurnMetaInput`，schema 允许 raw `turnId`、`messageId`、`threadId`、`conversationId`、`sessionId`，描述明确 raw ids 由 handler redaction。
- `lib/shared/schemas/mcp-tools.ts:99` 定义 public `AgentInputSourceSchema`：`host-declared-intent`、`host-turn-metadata`、`user-message`、`automation-envelope`、`source-ref`、`tool-result`、`legacy-compatibility`。
- `lib/shared/schemas/mcp-tools.ts:108` 定义 public `AgentIntentKindSchema`：`implementation-task`、`fix-task`、`refactor-task`、`review-task`、`read-only-analysis`、`status-only`、`decision`、`design-or-planning`、`mechanical-envelope`、`unknown`。
- `lib/shared/schemas/mcp-tools.ts:164` 定义 `IntentInput`，description 承诺返回 `recognizedIntent`、`intentRef`、`detailRefs`、`structure-first vectorPlan`。
- `lib/shared/schemas/mcp-tools.ts:169` 定义 `PrimeInput`，接受 `intentRef`、fallback `query`、fallback `recognizedIntent`。

### Public Contract

- `lib/codex/mcp/public-tools/contract.ts:6` 的 active public tool list 包含 `alembic_intent`。
- `lib/codex/mcp/public-tools/contract.ts:199` 的 `AgentPublicToolResultEnvelopeSchema` 固定 `contractVersion`、`toolName`、`actionKind`、`status`、`agentHost`、`inputSource`、可选 `intentKind`、`summary`、`refs`、可选 `reason`，并要求 skipped/degraded/blocked/failed 匹配 reason kind。
- `lib/codex/mcp/public-tools/contract.ts:299` 的 `AGENT_PUBLIC_TOOL_CONTRACT_CATALOG` 将 `alembic_intent` 标为 `activeMcpSurface=true`、`implementationStatus=active-tool`、`handlerDependency=McpServer.agent-public-tools`，required fields 为 `agentHost`、`inputSource`，produces refs 为 `intentRef`、`detailRefs`。

### Handler And Local Record

- `lib/codex/mcp/handlers/agent-public-tools.ts:175` 定义 `INTENT_RECORDS` 为 in-memory `Map`。
- `lib/codex/mcp/handlers/agent-public-tools.ts:178` 的 `intentHandler()` 执行 `buildIntentIntake()`、`resolveIntentStatus()`、`buildVectorPlan()`，然后创建 `intentRef` 和 public result envelope。
- `lib/codex/mcp/handlers/agent-public-tools.ts:212` 无论 result status 是 `ready`、`skipped` 还是 `degraded`，当前都会调用 `rememberIntentRecord(record)`。
- `lib/codex/mcp/handlers/agent-public-tools.ts:1816` 的 `rememberIntentRecord()` 将 record 写入 `INTENT_RECORDS`，超过 100 条删除 oldest。
- `lib/codex/mcp/handlers/agent-public-tools.ts:226` 返回 `sourcePolicy`，其中 `rawThreadIdsPersisted=false`。

### Skip / Block Policy

- `lib/codex/mcp/handlers/agent-public-tools.ts:992` 的 `resolveIntentStatus()` 对 `lifecycle.inputSource === 'automation-envelope'` 返回 `skipped / mechanical-envelope-only`。
- 同函数对空 semantic query 返回 `skipped / no-semantic-intent`，对 low-confidence draft 返回 `degraded / low-confidence-intent`。
- `lib/codex/mcp/handlers/agent-public-tools.ts:1040` 的 `resolvePrimeBlockingReason()` 要求 `alembic_prime` 必须有 `intentRef` 或 fallback recognized intent；当 inputSource 为 `automation-envelope` 且没有 `sourceRefs` 时返回 `blocked / missing-referenced-docs`。
- `lib/service/task/TaskLifecyclePolicy.ts:12` 的 internal input source enum 与 public input source 不同，包含 `user-intent`、`automation-envelope`、`direct-thread-follow-up`、`system-or-tool-continuation`、`status-or-readonly`、`unknown`。
- `lib/service/task/TaskLifecyclePolicy.ts:20` 的 internal intent kind 包含 `code-change-task`、`read-only-analysis`、`design-discussion`、`status-report`、`automation-control`、`knowledge-query`、`explicit-task-anchor`、`unknown`。
- `lib/service/task/TaskLifecyclePolicy.ts:337` / `:380` 已对 raw automation envelope 和 status-only 做 prime / task anchor skip policy；但 `alembic_intent` handler 当前没有因 public `intentKind=status-only` 直接 skip 的专门分支。

### Redaction And Handoff

- `lib/service/task/HostIntentFrame.ts:178` 对 raw automation envelope without declared intent 加入 degraded reason `hostIntent.rawAutomationEnvelopeWithoutDeclaredIntent`。
- `lib/service/task/HostIntentFrame.ts:382` 的 `normalizeHostTurnMeta()` 会 hash raw `threadId`、`conversationId`、`sessionId`，并通过 `markPathRedactions()` 标记路径 redaction。
- `lib/service/task/HostIntentFrame.ts:196` 的 `buildResidentIntentHandoff()` 能把 normalized host intent、turn meta、recognized intent draft、sourceRefs、sessionHistory 组合成 resident handoff。
- `lib/service/task/PrimeSearchPipeline.ts:300` 附近的 resident semantic search 只在有 resident client 时将 `residentIntentHandoff` 作为 post body metadata 传给 Alembic resident service；Plugin 本身不是 resident producer。

### Vector Plan

- `lib/codex/mcp/handlers/agent-public-tools.ts:1590` 的 `buildVectorPlan()` 返回：
  - `queries`
  - `keywordQueries`
  - `language`
  - `module`
  - `scenario`
  - `retrievalOrder`
  - `route='structure-first-recipe-retrieval'`
- 当前没有 public `recipeRetrievalHint` 字段名，也没有 Design 所列 `vectorUseKind` enum；现有 equivalent 是 `vectorPlan.route`、`queries`、`retrievalOrder` 和 `IntentExtractor` 的 scenario/module/language。

## Design Enum Requirement Mapping

| Design 方向 | 当前 AlembicPlugin 事实 | 判断 |
| --- | --- | --- |
| `agentHost` | Public schema / envelope 已有 `codex`、`claude-code`、`generic-host-agent` | 已 public |
| `inputSource` | Public schema 已有 7 类；internal policy 另有 task lifecycle source | 已 public，但 internal mapping 不等同 Design 全量模型 |
| `intentKind` | Public schema 已有 9 类；internal policy 另有 code-change/status/knowledge 等分类 | 已 public，但不是 full Design enum |
| `actionKind` | Public envelope `actionKind` 表示 MCP tool action：`intent`、`prime` 等；`hostDeclaredIntent.action` 是自由文本 | 字段名已存在，但语义不是用户 intent action enum |
| `hostSurface` | `hostTurnMeta.surface` 是自由文本 metadata | 未 public enum 化 |
| `objectKind` / `scopeKind` | 当前由 `module`、`activeFile`、`sourceRefs`、recognized target/constraints 间接表达 | 未 public enum 化 |
| `persistenceKind` | local record 是 in-memory `Map`；resident producer 不在 Plugin | 未 public enum 化 |
| `primeNeed` / `workNeed` / `guardNeed` | internal `TaskLifecyclePolicy` 有 prime/task anchor/guard decisions | 仅 internal，未纳入 `alembic_intent` result |
| `vectorUseKind` | `vectorPlan.route='structure-first-recipe-retrieval'` 与 retrieval order 表达策略 | 未 public enum 化 |
| `confidenceBand` | `hostDeclaredIntent.confidence` 是 number；internal task anchor confidence 是 high/medium/low | 未 public enum 化 |
| `status/outcome` | Public envelope statuses / reason codes 已覆盖 ready/skipped/degraded/blocked/failed | 已 public |

## Focused Test Evidence

- `test/unit/AgentPublicToolsActive.test.ts:235` 断言 host-declared `alembic_intent` 返回 `intentRef`、`detailRefs`、`recognizedIntent.status='recognized'` 和 `vectorPlan.route='structure-first-recipe-retrieval'`。
- `test/unit/AgentPublicToolsActive.test.ts:276` 断言 `alembic_prime` 可以用 `intentRef` 调用 `PrimeSearchPipeline`，并返回 `primeRef`、Trust Receipt material 和 retrieval consumer metadata。
- `test/unit/AgentPublicToolsActive.test.ts:452` 断言 raw automation intent 被 skipped，并且 automation prime without `sourceRefs` 被 blocked。
- `test/unit/AgentPublicToolsEvaluation.test.ts:382` / `:559` 断言 raw-envelope golden scenario 是 `skipped / mechanical-envelope-only`，不走 legacy task fallback。
- `test/unit/HostIntentFrame.test.ts:15` 断言 raw automation envelope without host intent 不作为 effective query。
- `test/unit/HostIntentFrame.test.ts:27` 断言 host-declared intent 可以覆盖 raw automation envelope text。
- `test/unit/HostIntentFrame.test.ts:62` 断言 sourceRefs 只保留非 private refs。
- `test/unit/TaskLifecyclePolicy.test.ts:28` 断言 raw automation envelopes without curated intent skip prime and task anchor。
- `test/unit/TaskLifecyclePolicy.test.ts:50` 断言 hostDeclaredIntent 可以从 raw automation envelope 场景恢复 semantic intent。
- `test/integration/ZodSchemas.test.ts:225` / `:324` 断言 schema 接受 `hostDeclaredIntent`、`hostTurnMeta` 并剥离未知 payload。
- `test/integration/ZodToMcpSchema.test.ts:144` / `:163` 断言 MCP schema 输出包含 `hostDeclaredIntent`、`hostTurnMeta`、`sourceRefs`。

## 验证命令

以下命令均在 `AlembicPlugin/` 执行，除特别注明 embedded plugin 子仓库外：

```bash
git status --short
git status --short # in plugins/alembic-codex
git rev-parse HEAD
git rev-parse HEAD # in plugins/alembic-codex
rg -n "HostDeclaredIntentInput|HostTurnMetaInput|AgentInputSourceSchema|AgentIntentKindSchema|IntentInput|PrimeInput" lib/shared/schemas/mcp-tools.ts
rg -n "alembic_intent|AgentPublicToolResultEnvelopeSchema|AGENT_PUBLIC_TOOL_CONTRACTS" lib/codex/mcp/public-tools/contract.ts
rg -n "INTENT_RECORDS|rememberIntentRecord|intentHandler|resolveIntentStatus|buildVectorPlan|buildSourcePolicy|resolvePrimeBlockingReason|primeHandler" lib/codex/mcp/handlers/agent-public-tools.ts
rg -n "rawAutomationEnvelopeWithoutDeclaredIntent|normalizeHostTurnMeta|buildResidentIntentHandoff|threadIdHash|activeFile" lib/service/task/HostIntentFrame.ts
rg -n "TaskLifecycleInputSource|TaskLifecycleIntentKind|automation-envelope|status-only|decidePrime|decideTaskAnchor|classifyInputSource|classifyIntentKind" lib/service/task/TaskLifecyclePolicy.ts
npm test -- test/unit/HostIntentFrame.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/integration/ZodSchemas.test.ts test/integration/ZodToMcpSchema.test.ts
npm run build:check
npm run lint:repo-boundary
git diff --check
```

## 验证结果

- Focused intent / public tools tests：通过，7 files / 114 tests。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`。
- `npm run lint:repo-boundary`：通过；`@escape-hatch count: 0 / 75 threshold`。
- `git diff --check`：通过。
- `git status --short`：AlembicPlugin 父仓库和 `plugins/alembic-codex` embedded plugin 子仓库最终均为空。

当前提交基线：

- AlembicPlugin HEAD：`8ba07705cfa9b655317309a1a3f1194f6117ccab`
- embedded plugin HEAD：`7036b3281cc894bd2373d729c7a6e264a7bd923f`
- 本轮无产品代码提交。

## 未修改范围

- 未修改 AlembicPlugin 产品源码、runtime bundle、embedded submodule pointer 或 channel assets。
- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 未执行 Stage 1+ implementation。
- 未创建目标窗口下一跳。

## 风险与下一步建议

- 风险：当前 `alembic_intent` 会为 skipped / degraded intent 创建 `intentRef` 和 local in-memory record；如果 REQ-03 completion definition 要求 mechanical/status-only/no-semantic 不产生可消费 record，Stage 1 必须改 handler 与 tests。
- 风险：Design enum 中 `objectKind`、`scopeKind`、`persistenceKind`、`primeNeed`、`workNeed`、`guardNeed`、`vectorUseKind`、`confidenceBand` 尚未成为 public `alembic_intent` result 字段；继续实现前需要总控裁决哪些进入 public contract，哪些保留 internal。
- 风险：Plugin 侧 local record 非 durable；resident `IntentEpisode` producer 属于 Alembic resident/service 边界，Plugin 当前只能提供 normalized handoff 与 prime consumer metadata。
- 建议：Stage 1 优先做最小契约裁决和 handler 行为收敛：跳过类 intent 是否禁止 local record、是否新增 `recipeRetrievalHint` / `nextAction` / `persistence` / enum diagnostics，以及 `status-only` 是否在 `alembic_intent` 层直接 skipped。
- 建议：如果总控需要 runtime-level acceptance，再派 runtime probe 任务验证 packaged cache 的 `alembic_intent` / `alembic_prime` readback；本轮按 T1 只做 code fact，不启动 runtime automation。
