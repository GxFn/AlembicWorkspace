# AFAPI REQ 03 Plugin Intent Structured Local Vector Runtime Acceptance

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR-RUNTIME-ACCEPTANCE-T3

## 范围

- 本轮只在 AlembicPlugin 仓库边界内执行 REQ-03 runtime acceptance。
- 目标：证明 packaged / installed-cache runtime 中的 `alembic_intent` readback 与已验收 Plugin contract 一致。
- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 未创建目标窗口下一跳；只按 dispatch group return policy 回到总控。

## 运行时证据

- AlembicPlugin parent commit：`d5afb4e0628edd48decbf3f7ae3b6fd39291c2ab`
- Embedded plugin runtime commit：`da2c327713406babf7ab8d8f8834462557d95323`
- `plugins/alembic-codex/runtime.tgz` sha256：`0299507fe07398068e259f2dd87be10d04cc3fdd4e5b476981a951de0388844e`
- Packaged installed-cache marker：
  - mode：`packaged-runtime`
  - entryMode：`packaged-wrapper`
  - gitHead：`d5afb4e0628edd48decbf3f7ae3b6fd39291c2ab`
  - runtimeTarball hash：`0299507fe07398068e259f2dd87be10d04cc3fdd4e5b476981a951de0388844e`
- 机器报告：
  - `AlembicPlugin/scratch/afapi-req-03-dev-verify-packaged-report.json`
  - `AlembicPlugin/scratch/afapi-req-03-intent-runtime-acceptance-report.json`

## Runtime Acceptance 结果

`scratch/afapi-req-03-intent-runtime-acceptance-report.json` 对 installed-cache packaged MCP wrapper 的结果为 `ok=true`，目标 cache `ok=true`。

已验证的 `alembic_intent` / `alembic_prime` 场景：

| 场景 | status / reason | intentRef | localRecord | vectorUseKind |
| --- | --- | --- | --- | --- |
| semantic ready | `ready` | 有 | 有 | `hybrid-rerank` |
| semantic degraded | `degraded / low-confidence-intent` | 有 | 有 | `hybrid-rerank` |
| status-only | `skipped / status-only-turn` | 无 | 无 | `none` |
| no-semantic | `skipped / no-semantic-intent` | 无 | 无 | `none` |
| mechanical-envelope | `skipped / mechanical-envelope-only` | 无 | 无 | `none` |
| raw automation prime without sourceRefs | `blocked / missing-referenced-docs` | 无 | 无 | n/a |

其它断言：

- `tools/list` 中 `alembic_intent` 和 `alembic_prime` 均可见。
- semantic ready 输出包含 `persistence.kind=session-local`、`sourcePolicy.localIntentRecord.created=true`、`recipeRetrievalHint.vectorUseKind=hybrid-rerank`。
- semantic degraded 输出仍保持可消费 `intentRef` / `localRecord`，`persistence.reason=semanticIntent.degradedButConsumable`。
- status-only / no-semantic / mechanical envelope 输出均为 `persistence.kind=ephemeral`、`sourcePolicy.localIntentRecord.created=false`，`result.refs.intentRef` 为空。
- `diagnostics.enumRequirementMapping` 完整包含 Design 要求的 13 个字段：`agentHost`、`hostSurface`、`inputSource`、`intentKind`、`actionKind`、`objectKind`、`scopeKind`、`persistenceKind`、`primeNeed`、`workNeed`、`guardNeed`、`vectorUseKind`、`confidenceBand`。
- semantic ready 的 host turn raw thread id 未出现在 payload 中，`sourcePolicy.rawThreadIdsPersisted=false`。

## 实际命令

以下命令均在 `AlembicPlugin/` 执行：

```bash
npm run dev:codex-plugin:verify -- --packaged --skip-build --skip-prepare --skip-tests --skip-smoke --report-path scratch/afapi-req-03-dev-verify-packaged-report.json
node scratch/afapi-req-03-intent-runtime-acceptance-probe.mjs --project-root /private/tmp/afapi-req-03-intent-runtime-project --report-path scratch/afapi-req-03-intent-runtime-acceptance-report.json
npm run build:check
git status --short
git -C plugins/alembic-codex status --short
git diff --check
git -C plugins/alembic-codex diff --check
```

验证结果：

- `dev:codex-plugin:verify -- --packaged ...`：通过；`verify:codex-plugin`、packaged cache sync 和 packaged status probe 均 `ok=true`。
- T3 专项 runtime acceptance probe：通过；report `ok=true`。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`。
- 父仓库和 embedded runtime `git status --short` 均无输出。
- 父仓库和 embedded runtime `git diff --check` 均无输出。

## 未修改范围

- 未改 AlembicPlugin tracked source、runtime artifact 或 package metadata。
- 未改 embedded `plugins/alembic-codex` tracked files。
- `scratch/afapi-req-03-intent-runtime-acceptance-probe.mjs`、两个 scratch JSON report 和 `/private/tmp/afapi-req-03-intent-runtime-project` 仅为本轮本地验证资产，不提交为产品改动。
- 未做 Alembic resident `IntentEpisode` durable producer；REQ-03 的跨 turn durable continuity 仍不属于本轮 Plugin runtime acceptance。

## 风险与下一步建议

- 风险：`intentRef` / `localRecord` 仍是 Plugin MCP 进程内 session-local record，不是 Alembic resident durable record。
- 风险：本轮验证的是 installed-cache packaged wrapper readback，不证明当前已经打开的 Codex host session 已热加载新 MCP transport；若需要当前 UI 会话工具调用证据，需要重启 / reload host 后另行做 host-session probe。
- 建议：总控可验收 REQ-03 Plugin runtime acceptance；如后续要做 resident continuity，应另派 Alembic producer 边界任务，而不是在 Plugin 内自造长期 store。
