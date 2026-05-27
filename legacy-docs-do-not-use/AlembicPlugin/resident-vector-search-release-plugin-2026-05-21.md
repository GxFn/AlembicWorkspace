# AlembicPlugin Resident Vector Search Release Execution

状态：VEC-2/VEC-3/VEC-4R/VEC-5R 已完成并通过总控验收
执行窗口：AlembicPlugin
日期：2026-05-21
对应总控计划：`docs/workspace/archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md`

## 完成范围

- 修正 `HostAiAdapter`：host-managed provider 的占位 `chat()` / `embed()` 不再被 `normalizeHostProvider()` 误判为可执行 AI / embedding provider；`embedProvider` 只返回 `__hostEmbedExecutable=true` 的真实 provider。
- 修正 `VectorModule`：只向 Core `VectorService` 注入真实可执行的 embed provider；AlembicPlugin 不再把 host-managed placeholder 作为本地向量 executor。
- 新增 `ResidentSearchClient`：从 Core daemon state 读取本项目 resident service 地址，调用 Alembic `/api/v1/search`，消费 `searchMeta.route/service/coreRoute/requestedMode/actualMode/semanticUsed/vectorUsed/degradedReason/fallbackReason/residentVector/workspace` 等字段，并在 daemon/token/http/fetch 不可用时返回 `residentVector.available=false` 诊断。
- 接入 `PrimeSearchPipeline`：prime 期间对主查询请求 resident semantic search；成功时融合 resident 结果；resident service 未就绪或失败时保留 Plugin embedded baseline search，并把降级原因写入 `primeKnowledgeMaterial.searchMeta.residentSearch`。
- 接入 `alembic_search` embedded handler：在 direct embedded handler 场景下对 `auto` / `semantic` 查询尝试 resident search；CodexMcpServer 的 service boundary 已收紧为所有 Codex-facing Alembic tools 均由 Plugin-owned embedded handler 执行。
- VEC-4R 删除 daemon MCP compatibility bridge：移除 CodexMcpServer 的 daemon MCP bridge 调用、`callDaemonBridge()`、Plugin 本地 HTTP `/api/v1/mcp/call` route 和 Codex session mock；`alembic_search` 通过 ResidentSearchClient 请求 Alembic `/api/v1/search`，失败时回到 baseline embedded search。
- VEC-4R 补齐 Plugin-owned host-agent bootstrap/rescan 的真实清理依赖：External workflow 调用 Core cleanup policy 时注入 Plugin `CleanupService`，避免切掉 bridge 后 direct `alembic_bootstrap` 无法在 Plugin 内产出 Mission Briefing。
- VEC-5R 修复 resident request mode：Codex-facing `auto` 仍作为 direct search / skill 使用语义保留，但 `ResidentSearchClient` 请求 Alembic `/api/v1/search` 时规范化为 daemon schema 支持的 `semantic`，并在 metadata 中同时保留 `requestedMode=auto`、`residentRequestMode=semantic`、`codexRequestedMode=auto`；semantic telemetry 缺失时标记 `resident_search_telemetry_missing`，不把无证据的 resident 结果声称为 vector available。
- 更新 task intent metadata：`IntentState.searchMeta` / `IntentChainRecord.searchMeta` 可保存 resident search 诊断。
- 更新 Alembic Codex Skill / injectable Skill：明确 semantic/vector recall 来自本地 Alembic resident service，`residentVector.available=false` 是增强不可用边界，不是 Plugin embedding 失败。
- 刷新 Codex plugin runtime artifact：`runtime.tgz`、runtime dist、runtime Skill 快照和 embedded `vendor/AlembicCore` 均已同步。

## 提交

- `AlembicPlugin`：`7a81721061bbaaba437343876a56eec62356297a`
- `AlembicCodex` runtime artifact：`c160c062e95329ff0126cb98f1a9c36bbd451678`
- VEC-4R `AlembicPlugin`：`f46e28179aac306e7fff12fe9d7d68965494c1d8`
- VEC-4R `AlembicCodex` runtime artifact：`daec908a340f4dbe60a8cec643efdc126cf9ff77`
- VEC-5R `AlembicPlugin`：`2c98f69b1388c478bbbb255e487c51fde621cff7`
- VEC-5R `AlembicCodex` runtime artifact：`33689ec1cd0266023fab2d7c1bebf7ad6fd59732`
- Embedded Core source：`39bcebe94c451f92e405b0da38d2cbe67e8e0f82`

## 验证命令 / 结果

- `npx vitest run test/unit/HostAiAdapter.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts`：通过，4 files / 11 tests。
- `npx vitest run test/unit/CodexMcpServer.test.ts test/unit/CodexServiceRequestBoundary.test.ts`：通过，2 files / 38 tests；确认 `alembic_task prime` local daemon ready 时仍为 Plugin-owned。
- VEC-4R `npx vitest run test/unit/CodexServiceRequestBoundary.test.ts test/unit/CodexMcpServer.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts`：通过，4 files / 45 tests；确认 Codex-facing tools 不再调用 daemon MCP bridge，direct bootstrap 在 Plugin 内产出 Mission Briefing。
- VEC-5R `npx vitest run test/unit/ResidentSearchClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts`：通过，3 files / 9 tests；确认 `auto` resident request 被规范化为 daemon `semantic`，且 metadata 保留 Codex requested mode 与 resident request mode。
- VEC-5R `npx biome check lib/service/search/ResidentSearchClient.ts test/unit/ResidentSearchClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts`：通过。
- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，生成 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过，`runtime.tgz -> alembic-ai@0.1.2`。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，root npm publish disabled，embedded runtime Core dependency 保持 `file:vendor/AlembicCore`，embedded Core source 为 `39bcebe94c451f92e405b0da38d2cbe67e8e0f82`。
- `npm run verify:codex-session`：通过，1 file / 6 tests。
- `npm run lint:core-import-boundary`：通过，333 files / 512 `@alembic/core` imports。
- VEC-4R 负向扫描 `rg -n "/api/v1/mcp/call|callDaemonBridge|callDaemonTool|daemon-mcp-compat-bridge" lib test scripts plugins`：无剩余命中。
- VEC-5R 负向扫描 `rg -n "/api/v1/mcp/call|callDaemonBridge|callDaemonTool|daemon-mcp-compat-bridge" lib test scripts plugins`：无剩余命中。
- `npm run lint`：通过退出；仍有既有 Biome warnings（如 `lib/bootstrap.ts` non-null assertion、`lib/cli/SetupService.ts` console），本轮未改。
- `git diff --check`（AlembicPlugin / AlembicCodex）：通过。

补充诊断：

- `npm run lint:repo-boundary`：失败，命中既有 10 个 `db.prepare()` / `getDb()` 边界问题，均不在本轮修改文件中；未作为 VEC-2/VEC-3 阻塞项。

## 总控验收与后续状态

- Test-2026-05-22-01 已通过：direct `alembic_search(auto)` 保留 `codexRequestedMode=auto` 并以 `residentRequestMode=semantic` 请求 Alembic，daemon `/api/v1/search` 与 direct `auto/semantic` 均返回 `semanticUsed=true` / `vectorUsed=true` / `residentVector.available=true`，BiliDili 前后干净。
- 本机 Codex plugin cache 已在 VEC-6 中刷新：命令 `npm run dev:codex-plugin:local-mcp -- --clean --all-installed` 成功，cache marker `gitHead=2c98f69b1388c478bbbb255e487c51fde621cff7`、mode `local-mcp`、target `~/.codex/plugins/cache/gxfn/alembic-codex/0.1.2`。
- `lint:repo-boundary` 仍有历史遗留边界告警，后续可另开 repo-boundary 专项处理；`residentVector.stats.indexSize=0` 的诊断语义可由 `Alembic` / `AlembicCore` 后续解释，不阻塞本轮验收。
