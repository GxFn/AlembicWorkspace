# AFAPI REQ 03 Plugin Intent Structured Local Vector Contract Convergence

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR-CONTRACT-CONVERGENCE-T2

## 范围

- 本轮只在 AlembicPlugin 仓库边界内实施 REQ-03 contract convergence。
- 目标：收敛 `alembic_intent` 的可消费 intent record 行为、Design enum requirement mapping、vector/recipe hint 和 source policy evidence。
- 未代领 Alembic resident `IntentEpisode` producer，未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 已同步 embedded `plugins/alembic-codex` runtime artifact，避免 source/runtime 分叉。

## 完成范围

- `alembic_intent` 现在只在 semantic consumable intent 路径创建 `intentRef` 和 session-local in-memory record。
- `mechanical-envelope`、`status-only`、`no-semantic-intent` 等 non-semantic / skipped 路径不再返回 `intentRef`，不再返回 `localRecord`，result envelope refs 中也不含 `intentRef`。
- low-confidence 但 semantic 的 implementation / review / planning 等路径仍可返回 `degraded` + consumable `intentRef`，满足 semantic degraded 可继续被 host 判断是否 prime/work 的完成定义。
- `alembic_intent` 输出新增：
  - `persistence`：`ephemeral` 或 `session-local`、是否 consumable、是否创建 local record、reason。
  - `sourcePolicy.localIntentRecord`：明确 local record 是否创建、是否可消费、persistence kind。
  - `recipeRetrievalHint`：structure-first route、query seeds、filters、profiles、vectorUseKind。
  - `diagnostics`：Design enum requirement mapping、normalized derived fields、prime/work/guard needs。
  - `vectorPlan.vectorUseKind`：`none` / `semantic-expand` / `hybrid-rerank`。
- Public contract 新增 `AGENT_INTENT_DESIGN_FIELD_MAPPINGS`，把 Design 要求的 `agentHost`、`hostSurface`、`inputSource`、`intentKind`、`actionKind`、`objectKind`、`scopeKind`、`persistenceKind`、`primeNeed`、`workNeed`、`guardNeed`、`vectorUseKind`、`confidenceBand` 逐项映射到 public field、public result field 或 internal derived field。
- Tests 覆盖：
  - semantic ready intent 仍有 `intentRef`、local record、`recipeRetrievalHint`、diagnostics。
  - semantic degraded intent 仍可消费并有 local record。
  - status-only / no-semantic / raw automation envelope 不返回 `intentRef` 或 `localRecord`。
  - raw automation prime without `sourceRefs` 仍 blocked。
  - Design enum mapping 全字段存在且有 evidence。

## 代码证据

- `lib/codex/mcp/handlers/agent-public-tools.ts`
  - `intentHandler()` 通过 `resolveIntentPersistence()` 决定是否创建 `intentRef` 和 `INTENT_RECORDS` entry。
  - `resolveIntentStatus()` 对 explicit `status-only` 和 `mechanical-envelope` 返回 skip reason。
  - `buildIntentDiagnostics()` 输出 enum mapping、normalized derived fields 和 tool needs。
  - `buildRecipeRetrievalHint()` 输出 structure-first recipe hint。
  - `buildSourcePolicy()` 输出 local intent record policy。
- `lib/codex/mcp/public-tools/contract.ts`
  - 新增 `AGENT_INTENT_DESIGN_FIELD_MAPPINGS`。
- `test/unit/AgentPublicToolsActive.test.ts`
  - 新增 consumable/degraded/ephemeral intent contract tests。
- `test/unit/AgentPublicToolsContract.test.ts`
  - 新增 Design enum mapping contract test。
- `plugins/alembic-codex/runtime/dist/...`
  - embedded runtime JS 已包含相同 contract mapping、persistence、diagnostics 和 local record policy。
- `plugins/alembic-codex/runtime.tgz`
  - 已由 `npm run prepare:codex-plugin-runtime` 重新打包并通过 `verify:codex-plugin`。

## 提交

- AlembicPlugin：`d5afb4e0628edd48decbf3f7ae3b6fd39291c2ab` (`Converge intent contract handling`)
- Embedded plugin runtime：`da2c327713406babf7ab8d8f8834462557d95323` (`Update intent contract runtime`)

## 验证命令

以下命令均在 `AlembicPlugin/` 执行，除特别注明 embedded plugin 子仓库外：

```bash
npm test -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/HostIntentFrame.test.ts
npm run build:check
npm run lint:repo-boundary
npm run lint
npm test -- test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/TaskLifecyclePolicy.test.ts test/unit/HostIntentFrame.test.ts test/integration/ZodSchemas.test.ts test/integration/ZodToMcpSchema.test.ts
npm run build
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
git diff --check
git diff --check # in plugins/alembic-codex
rg -n "AGENT_INTENT_DESIGN_FIELD_MAPPINGS|localIntentRecord|vectorUseKind" lib/codex/mcp/handlers/agent-public-tools.ts lib/codex/mcp/public-tools/contract.ts plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/agent-public-tools.js plugins/alembic-codex/runtime/dist/lib/codex/mcp/public-tools/contract.js
git status --short
git status --short # in plugins/alembic-codex
```

## 验证结果

- Focused unit：通过，5 files / 37 tests。
- Focused unit + schema integration：通过，7 files / 116 tests。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`。
- `npm run build`：通过，生成 dist 并执行 postbuild。
- `npm run lint:repo-boundary`：通过，`@escape-hatch count: 0 / 75 threshold`。
- `npm run lint`：通过，Biome checked 201 files。
- `npm run prepare:codex-plugin-runtime`：通过，重建 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-codex-plugin-runtime@0.2.0`。
- `git diff --check`：父仓库和 embedded plugin 子仓库均通过。
- `rg` 抽查确认 source 和 runtime dist 都包含 `AGENT_INTENT_DESIGN_FIELD_MAPPINGS`、`localIntentRecord`、`vectorUseKind`。
- 最终 `git status --short`：AlembicPlugin 父仓库和 `plugins/alembic-codex` embedded plugin 子仓库均为空。

## 未修改范围

- 未修改 Alembic resident `IntentEpisode` producer / route / store。
- 未修改 AlembicCore shared schema 或 Core exports。
- 未修改 AlembicAgent / Dashboard / Design / Test / 真实项目。
- 未启动 Codex host reload、marketplace sync 或真实 runtime smoke；本轮只同步 packaged runtime artifact 并运行 package verification。

## 风险与下一步建议

- 风险：`persistence=session-local` 仍是 Plugin 进程内 in-memory record，不是 Alembic resident durable record；跨 turn / durable IntentEpisode 仍属于 Alembic producer 边界。
- 风险：`hostSurface`、`objectKind`、`scopeKind` 等仍是 derived diagnostics，不是新的 public input enum；若总控后续要求 host 必填这些 enum，需要新一轮 schema-breaking contract task。
- 风险：本轮未做 real Codex installed-cache runtime probe；如果总控要求证明当前 Codex host 会话已加载新 artifact，应另派 runtime acceptance / reload probe。
- 建议：下一阶段若继续 REQ-03，可由总控决定是否派 runtime acceptance，验证 packaged `alembic_intent` readback 中 skipped paths 无 `intentRef`、semantic degraded 有 `intentRef`、diagnostics enum mapping 可见。
