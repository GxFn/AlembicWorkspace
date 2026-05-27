# AlembicPlugin Capability Code Interface Cleanup Execution

日期：2026-05-22
状态：已完成，待总控验收
窗口：AlembicPlugin
目标仓库：`AlembicPlugin`

## 窗口定位

本窗口是 `AlembicPlugin` 执行窗口。本轮仓库职责是 Codex host agent 插件入口、Codex MCP / Skill / channel、plugin runtime artifact、portable runtime compatibility 和 Codex 宿主适配。

本轮只执行 CCIC-P1-P：清理 Plugin 内容易被误读为本地第三方 AI provider 的 host-managed 语义，同时保留 Dashboard / 旧 consumer 仍需要的 `HOST_AI_MANAGED` / `hostManaged` 兼容字段。

本轮不承担：

- 不恢复第三方 AI provider、embedding provider、Agent Tool V2 或 `@alembic/agent`。
- 不修改 Alembic daemon API、Core public API、Dashboard UI 或 AlembicAgent runtime。
- 不删除仍作为 consumer compatibility 需要的 `HOST_AI_MANAGED` / `hostManaged` 字段。
- 不运行真实项目测试；本轮仅做 Plugin 内部构建、单测、artifact 和边界扫描。

## 完成范围

- 新增 `lib/http/utils/host-managed-boundary.ts`，集中声明兼容 code 与 canonical boundary 字段：
  - legacy compatibility：`HOST_AI_MANAGED`、`hostManaged`
  - canonical host-managed：`HOST_AGENT_MANAGED`
  - deterministic Plugin extract：`PLUGIN_DETERMINISTIC_EXTRACT`
  - boundary metadata：`canonicalCode`、`boundaryCode`、`legacyBoundaryCode`、`legacyHostManaged`、`localAi`、`localAiProvider`、`pluginAiProvider`、`capabilityBoundary`
- 更新 `lib/http/routes/candidates.ts`：
  - fail-closed error 仍返回 `error.code = HOST_AI_MANAGED`，但新增 `canonicalCode` / `boundaryCode = HOST_AGENT_MANAGED`。
  - payload message 改为 Codex host agent 或 Alembic resident service 承担增强路径，避免表达成 Plugin 自有 AI provider。
  - 保留 `reason: HOST_AI_MANAGED`，新增 `canonicalReason: HOST_AGENT_MANAGED`，兼容 Dashboard 宽解析。
- 更新 `lib/http/routes/extract.ts`：
  - deterministic extract 结果使用 `PLUGIN_DETERMINISTIC_EXTRACT` canonical boundary。
  - 保留 `hostManaged: true` 和 `legacyHostManaged: true`，明确 Plugin 只做确定性提取，不执行本地 AI provider。
- 更新 `lib/service/module/ModuleService.ts`：
  - scan result 使用 `HOST_AGENT_MANAGED` canonical boundary，说明 Plugin 返回 files / Guard / deterministic scan，增强由 Codex host agent 或 Alembic resident service 接管。
  - 删除无消费方私有残留 `#enrichRecipes(...)`、`#qualityScorer` 私有字段和赋值；constructor option `qualityScorer?: ...` 保留，避免破坏外部调用签名。
- 更新 `lib/injection/modules/VectorModule.ts` 注释，明确 contextual enrichment 由 Codex host agent / Alembic resident service 管理，不是 Plugin 本地 embedding provider。
- 新增单元测试：
  - `test/unit/HostManagedBoundary.test.ts`
  - `test/unit/CandidatesHostManagedBoundary.test.ts`
  - `test/unit/ModuleServiceHostManagedBoundary.test.ts`
- 同步 AlembicCodex runtime artifact：
  - `plugins/alembic-codex/runtime.tgz`
  - `plugins/alembic-codex/runtime/dist/lib/http/routes/candidates.js`
  - `plugins/alembic-codex/runtime/dist/lib/http/routes/extract.js`
  - `plugins/alembic-codex/runtime/dist/lib/http/utils/host-managed-boundary.js`
  - `plugins/alembic-codex/runtime/dist/lib/injection/modules/VectorModule.js`
  - `plugins/alembic-codex/runtime/dist/lib/service/module/ModuleService.js`

## 提交

- AlembicPlugin：`de77740f20a7178c195030bb871b634a202c7a3c`
- AlembicCodex runtime artifact 子仓库：`b7373430aa155f2980fe6e0e10e269e2707bd0a2`
- `runtime.tgz` SHA-256：`044f8f52887f27f0c32c0f961a426eaba4461cd62803afcd5286355c8e2117a3`

## 兼容字段保留理由

`AlembicDashboard` 已在 CCIC-P1-D 做宽兼容解析，但计划要求 Plugin producer 不能单方面删除旧 consumer 字段。因此本轮保留：

- `HOST_AI_MANAGED`：作为 legacy fail-closed `error.code` / `reason`。
- `hostManaged`：作为旧 Dashboard / consumer compatibility flag。

同时新增 canonical 字段：

- `HOST_AGENT_MANAGED`：表示增强由 Codex host agent 或 Alembic resident service 承担。
- `PLUGIN_DETERMINISTIC_EXTRACT`：表示 Plugin 只做确定性提取。
- `capabilityBoundary.localAi = false`、`localAiProvider = false`、`pluginAiProvider = false`：明确 Plugin 不拥有本地第三方 AI provider。

## 负向扫描

旧第三方 AI provider / embedding provider surface 未回潮：

```text
rg -n 'HostAiAdapter|AiModule|_aiProviderManager|_embedProvider|reloadAiProvider|/api/v1/ai|routes/ai|createProvider|LLM gateway|third-party AI' lib test scripts plugins/alembic-codex/runtime/dist
```

结果：无命中。

Agent / external AI / tool runtime 禁止项未回潮：

```text
rg -n '@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai' lib test scripts plugins/alembic-codex/runtime/dist
```

结果：仅命中 `scripts/report-agent-extraction-boundary.mjs` 中的自检规则；源码、测试和 runtime dist 无禁止项回潮。

canonical 字段正向扫描命中 `lib/`、`test/`、`plugins/alembic-codex/runtime/dist/`，符合本轮新增边界语义。

## 验证命令与结果

在 `AlembicPlugin` 仓库执行：

```text
npm run test:unit -- test/unit/HostManagedBoundary.test.ts test/unit/CandidatesHostManagedBoundary.test.ts test/unit/ModuleServiceHostManagedBoundary.test.ts
```

结果：通过，3 个测试文件 / 6 个测试。`CandidatesHostManagedBoundary.test.ts` 采用源码契约测试覆盖 candidates route 兼容字段与文案，因为当前沙箱拒绝本地 HTTP listener（`listen EPERM`）；未运行真实项目测试。

```text
npm run build:check
```

结果：通过。

```text
node_modules/.bin/biome check lib/http/routes/candidates.ts lib/http/routes/extract.ts lib/http/utils/host-managed-boundary.ts lib/injection/modules/VectorModule.ts lib/service/module/ModuleService.ts test/unit/HostManagedBoundary.test.ts test/unit/CandidatesHostManagedBoundary.test.ts test/unit/ModuleServiceHostManagedBoundary.test.ts
```

结果：通过。

```text
npm run build
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run verify:codex-channel
```

结果：均通过，runtime artifact 已同步。

```text
npm run report:agent-extraction-boundary
```

结果：通过；`sourceFilesScanned=334`，`filesWithBoundaryImports=0`，`agentImportFiles=0`，`aiImportFiles=0`，`toolImportFiles=0`。

```text
npm run lint:repo-boundary
```

结果：失败，剩余 10 个既有 DB boundary violation，集中在 `lib/codex/KnowledgeState.ts`、`lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`bin/daemon-server.ts`。这些命中不在本轮 Plugin host-managed AI 语义清洁改动范围内，本轮未扩大 allowlist。

```text
git -C AlembicPlugin diff --check
git -C AlembicPlugin/plugins/alembic-codex diff --check
```

结果：提交前通过，无 whitespace error。

## Dashboard Consumer 兼容证据

- Plugin producer 仍保留旧字段：`HOST_AI_MANAGED` / `hostManaged`。
- Plugin producer 新增 Dashboard 已可宽解析的 canonical 字段：`canonicalCode`、`boundaryCode`、`HOST_AGENT_MANAGED`、`capabilityBoundary`。
- fail-closed error 仍用旧 `error.code = HOST_AI_MANAGED`，因此旧 consumer 不会因为 code 删除而破坏。
- 新语义不默认倾倒 provider / embedding / AI surface；Dashboard 可优先显示 canonical boundary，再 fallback legacy 字段。

## 遗留风险

- `HOST_AI_MANAGED` / `hostManaged` 仍因 compatibility 保留，不能在 Dashboard 和其它 consumer 完成 canonical 字段消费前删除。
- Dashboard 当前采用宽兼容解析；后续 CCIC-2 可由总控决定是否固化更窄的 producer / consumer contract 注释或 targeted consumer test。
- `npm run lint:repo-boundary` 仍因 AlembicPlugin 既有 DB boundary 债失败；该风险不由本轮 host-managed AI 语义清洁引入。
- `alembic-ai@0.2.0` 主包与 Plugin runtime 身份重叠仍是发布身份债，继续留在 CCIC 后续 TODO。

## 下一步建议

- CCIC-2 先由总控验收 Plugin / Dashboard 双向 compatibility，再决定是否把 Dashboard consumer 从宽解析收敛为优先 canonical 字段、fallback legacy 字段。
- legacy `HOST_AI_MANAGED` / `hostManaged` 删除必须等待 producer / consumer 证据齐全，不应在本轮继续删除。
- 本轮不需要创建新的 AlembicTest 真实项目测试单；若后续改 Dashboard 手动体验或真实 Codex plugin cache，再由总控创建测试交接。
- 本轮 runtime artifact 已提交；如总控需要本机 Codex plugin cache 立即使用新 artifact，再单独执行 cache refresh。
