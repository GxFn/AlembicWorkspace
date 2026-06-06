# AFAPI REQ 02 Plugin Agent-Facing Public API Contract Code Fact

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT-CODE-FACT-T1

## 范围

- 本轮只在 AlembicPlugin 仓库边界内做 Stage 0 代码事实复核。
- 复核对象：MCP tools/list surface、tool schema、handler map、active Plugin skill、Project Skill / README / setup guidance、embedded runtime cache wording。
- 不做产品实现，不删除旧入口，不提交 runtime bundle / submodule，不代领 Alembic / Core / Dashboard / Test 职责。
- 当前 TargetResultEnvelope 只作为目标窗口回填，不能替代总控验收。

## 结论

- 当前代码已经具备六个 agent-facing public tools 的 contract、description、schema、handler 和 active MCP surface：
  - `alembic_intent`
  - `alembic_prime`
  - `alembic_work_start`
  - `alembic_work_finish`
  - `alembic_code_guard`
  - `alembic_decision_record`
- `alembic_task` 仍物理保留为 hidden direct-call compatibility residue；它不在 active `TOOLS` list 中，也不在 active skill / README guidance 中作为主入口。
- Cross-host contract 当前只允许 `codex`、`claude-code`、`generic-host-agent`，并通过 shared schema signature 避免 host-specific schema fork。
- 本轮未修改 AlembicPlugin 产品源码；AlembicPlugin 父仓库和 embedded plugin 子仓库最终均 clean。

## 代码事实

### Public Contract

- `lib/codex/mcp/public-tools/contract.ts` 定义 `AGENT_PUBLIC_TOOL_NAMES` 六工具、`AGENT_HOSTS`、input source、intent kind、action kind、result statuses、skip / degraded / blocked / failure reason codes。
- `AgentPublicToolResultEnvelopeSchema` 强制：
  - `contractVersion`
  - `toolName`
  - `actionKind`
  - `status`
  - `agentHost`
  - `inputSource`
  - `summary`
  - `refs`
  - degraded / skipped / blocked / failed 必须带匹配 reason kind。
- `AGENT_PUBLIC_TOOL_CONTRACT_CATALOG` 将六工具全部标为：
  - `activeMcpSurface=true`
  - `implementationStatus=active-tool`
  - `handlerDependency=McpServer.agent-public-tools`

### Tool Descriptions

- `lib/codex/mcp/public-tools/descriptions.ts` 为六工具定义 `title`、`purpose`、`selectionHint`、`nonGoal`。
- focused tests 断言 public descriptions 不包含旧 `operation=prime/create/close` public guidance。

### MCP tools/list Surface

- `lib/codex/mcp/tools.ts` 的 active `TOOLS` 数组包含六个 public tools，并通过 `getAgentPublicToolDescriptionBase()` 生成 MCP description。
- 同文件单独定义 `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS`，其中 `alembic_task` description 为 hidden direct-call compatibility；该数组不并入 active `TOOLS`。
- `lib/codex/mcp/McpServer.ts` 的 `ListToolsRequestSchema` handler 只从 active `TOOLS` 做 tier filter 和 `withMcpToolAnnotations`，因此 `alembic_task` 不通过 tools/list 暴露。

### Handler Map

- `lib/codex/mcp/McpServer.ts` 的 `_resolveHandler()` 将六工具路由到 `handlers/agent-public-tools.ts`：
  - `intentHandler`
  - `primeHandler`
  - `workStartHandler`
  - `workFinishHandler`
  - `codeGuardHandler`
  - `decisionRecordHandler`
- 同一 handler map 仍保留 `alembic_task -> taskHandler`，属于 direct-call compatibility；后续若要物理删除，需要先处理旧 direct-call consumers 和 compatibility tests。

### MCP Schemas

- `lib/shared/schemas/mcp-tools.ts` 为六工具提供 `IntentInput`、`PrimeInput`、`WorkStartInput`、`WorkFinishInput`、`CodeGuardInput`、`DecisionRecordInput`。
- `TOOL_SCHEMAS` 映射包含六工具 schema。
- `TaskInput` 仍存在，并明确标注为 `hidden direct-call legacy compatibility`，description 要求优先使用六个 public tools。

### Tool Policy / Catalog

- `lib/codex/ToolPolicy.ts` 定义 `CODEX_AGENT_PUBLIC_TOOL_NAMES` 六工具，并说明这些工具是 active public route。
- `resolveCodexToolPolicy()` 会过滤掉 `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOL_NAMES`，因此 policy surface 不把 `alembic_task` 当作 visible policy tool。
- `lib/codex/mcp/PluginToolSurfaceCatalog.ts` 六工具 catalog entries 的 `handlerOwner` 均为 `McpServer.agent-public-tools`，schema 分别对应 public input schema。

### Cross-Host Readiness

- `lib/codex/mcp/public-tools/cross-host-readiness.ts` 固定三类 host：`codex`、`claude-code`、`generic-host-agent`。
- `buildAgentPublicCrossHostReadinessReport()` 输出一个 shared schema signature，包含 contract version、hosts、tool names 和 statuses。
- `CROSS_HOST_FORBIDDEN_LEGACY_PRIMARY_GUIDANCE` 包含 `alembic_task`、`operation=prime`、`operation=create`、`operation=close` 等旧主入口词，tests 断言 host prompt snapshots 不包含这些旧 primary guidance。

## Public Wording Inventory

### Active Plugin Skill

- `plugins/alembic-codex/skills/alembic/SKILL.md`：
  - knowledge-backed turn flow 使用 `alembic_intent`、`alembic_prime`、`alembic_work_start`、`alembic_work_finish`、`alembic_code_guard`、`alembic_decision_record`。
  - 明确写入 `alembic_task` is not advertised as a public workflow surface。
- `plugins/alembic-codex/skills/alembic-guard/SKILL.md`：
  - 使用 `alembic_code_guard`，legacy `alembic_guard` 只作 explicit compatibility/report route。

### README / Setup Guidance

- `plugins/alembic-codex/README.md` 的 first-minute guidance 使用 `alembic_codex_diagnostics`、`alembic_codex_status`、`alembic_codex_init`、`alembic_bootstrap` / `alembic_rescan` / `alembic_intent + alembic_prime`。
- `lib/cli/SetupService.ts` 的 Codex plugin 下一步提示使用 `alembic_health`、`alembic_intent + alembic_prime`、`alembic_work_finish + alembic_code_guard`。

### Embedded Runtime Cache

- `plugins/alembic-codex/runtime/dist/lib/codex/mcp/public-tools/contract.js` 包含同一组六工具、host enum、result statuses 和 reason codes。
- `plugins/alembic-codex/runtime/plugins/alembic-codex/skills/alembic/SKILL.md` 与 source skill wording 一致：六工具为 primary host lifecycle guide，`alembic_task` 只作 compatibility。

### Legacy Residue Classification

Hidden compatibility / tests:

- `lib/codex/mcp/tools.ts`：`LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS`
- `lib/codex/mcp/McpServer.ts`：`_resolveHandler()` direct-call map for `alembic_task`
- `lib/shared/schemas/mcp-tools.ts`：`TaskInput` and `TOOL_SCHEMAS.alembic_task`
- `test/integration/ZodSchemas.test.ts`：asserts legacy schema still exists
- `scripts/smoke-codex-plugin.mjs`：asserts fresh / initialized tools/list does not expose `alembic_task`
- `scripts/probe-agent-public-tools-evaluation.mjs`：asserts installed cache exposes six tools and hides `alembic_task`

Compatibility-specific implementation residue:

- `lib/codex/evolution/PluginOpportunisticEvolution.ts` still attaches opportunistic evolution only when `toolName === 'alembic_task' && operation === 'close'`.
- `lib/codex/ServiceRequestBoundary.ts` explicitly classifies legacy `alembic_task` compatibility as Plugin-owned Codex-facing semantics.

Potential active wording residue:

- Safe scan over `plugins/alembic-codex/README*`、source skills、embedded runtime skills、root README、`injectable-skills`、`.agents`、`channels` found only two `alembic_task` occurrences, both in source/runtime `alembic` skill compatibility boundary text.
- No active README / setup / skill guidance was found recommending `operation=prime/create/close` or `prime/create/close` as the primary workflow.

## 验证命令

以下命令均在 `AlembicPlugin/` 执行：

```bash
git status --short
git status --short # in plugins/alembic-codex
rg --files lib/codex/mcp
rg -n 'primary action|alembic_task|operation=prime|operation=create|operation=close|prime/create/close' plugins/alembic-codex/README.md plugins/alembic-codex/README.zh-CN.md plugins/alembic-codex/skills plugins/alembic-codex/runtime/plugins/alembic-codex/skills plugins/alembic-codex/runtime/plugins/alembic-codex/README.md plugins/alembic-codex/runtime/plugins/alembic-codex/README.zh-CN.md README.md injectable-skills .agents channels
npm test -- --run test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/integration/ZodSchemas.test.ts
npm run build:check
npm run lint:repo-boundary
npm run verify:codex-plugin
git diff --check
git diff --check # in plugins/alembic-codex
git rev-parse HEAD
git rev-parse HEAD # in plugins/alembic-codex
```

## 验证结果

- Focused public tools tests：通过，6 files / 96 tests。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`。
- `npm run lint:repo-boundary`：通过，`@escape-hatch count: 0 / 75 threshold`。
- `npm run verify:codex-plugin`：通过；`./runtime.tgz` 验证为 `alembic-codex-plugin-runtime@0.2.0`。
- `git diff --check`：AlembicPlugin 父仓库和 embedded plugin 子仓库均通过。
- `git status --short`：AlembicPlugin 父仓库和 embedded plugin 子仓库最终均为空。

当前提交基线：

- AlembicPlugin HEAD：`8ba07705cfa9b655317309a1a3f1194f6117ccab`
- embedded plugin HEAD：`7036b3281cc894bd2373d729c7a6e264a7bd923f`
- 本轮无产品代码提交。

## 未修改范围

- 未修改 AlembicPlugin 产品源码、runtime bundle、embedded submodule pointer 或 channel assets。
- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 未执行旧入口删除或 Stage 1+ implementation。
- 未创建目标窗口下一跳。

## 风险与下一步建议

- 风险：Stage 0 证明当前代码和 packaged cache 已有六工具 contract / active surface 基线；不等于总控已经接受 REQ-02 全部 completion definition。
- 风险：`alembic_task` 仍有 direct-call compatibility handler、schema、tests 和 opportunistic evolution residue；若后续要物理删除，必须单独验证旧 direct-call consumers、compatibility tests 和 smoke scripts。
- 建议：下一阶段若总控继续推进，可以把“contract 已存在”转成验收 / closeout 或 focused cleanup，而不是重复实现空壳 contract。
- 建议：若需要 runtime-level acceptance，可运行 `scripts/probe-agent-public-tools-evaluation.mjs` 对 installed cache 做 tools/list + six-tool call readback；本轮未启动该 runtime probe，因为任务包要求 Stage 0 code fact inventory。
