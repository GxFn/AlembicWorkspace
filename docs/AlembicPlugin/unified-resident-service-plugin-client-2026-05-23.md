# AlembicPlugin Unified Resident Service Client 回填

状态：已完成，总控验收通过
窗口：AlembicPlugin
任务包：`URS-P3-Plugin-Unified-Client`
完成时间：2026-05-23 22:30 CST
总控验收时间：2026-05-23 22:41 CST

## 窗口定位

当前窗口定位为 `AlembicPlugin` 执行窗口。本轮仓库职责是消费 `AlembicCore` / `Alembic` 已生产的 resident service contract，在 Codex 插件内收束 search / jobs / dashboard / status 的 resident 连接，同时保持 Codex-facing MCP / skill / prime / host response / shout / tool ownership 归 Plugin。

明确不承担：不改 Alembic producer，不改 AlembicCore contract，不接入 ProjectRuntimeControl，不读取项目列表，不消费 `/api/v1/projects/*`，不恢复 daemon MCP bridge，不操作 Dashboard 或 BiliDili。

## 完成范围

- 新增 `lib/service/resident/AlembicResidentServiceClient.ts`，统一负责 resident probe、health contract normalization、token request、timeout、unavailable reason、search、job submit/read、Dashboard handoff 和 telemetry projection。
- 删除旧 search-only client：`lib/service/search/ResidentSearchClient.ts`。
- 删除旧 Codex MCP job HTTP helper：`lib/external/mcp/codex/daemon-jobs.ts`。
- `alembic_search` 与 `PrimeSearchPipeline` 改用统一 `residentServiceClient`，继续在 resident 不可用时回退 Plugin baseline search。
- `alembic_codex_bootstrap/rescan/job` 改用统一 client 的 `enqueueJob/readJob`，并在结果中投影 resident service summary。
- `alembic_codex_dashboard/status/diagnostics` 统一显示 `residentService` probe / route / capability 信息；Dashboard 只在 `route=local-alembic-daemon` 且 `owner=alembic` 且 `dashboard.handoff` 可用时成功。
- `ServiceRequestBoundary` 扩展 `residentServiceRequested`，覆盖 `alembic_search`、`alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan`、`alembic_codex_job`。
- tool annotation 文案从 “Internal AI Job” 收紧为 “Recoverable Job”，避免把 Plugin embedded host-agent recovery 说成 Alembic internal AI。
- `plugins/alembic-codex` runtime artifact 已同步刷新。

## 提交

- AlembicPlugin commit：`4f58d5e1a1982c13ca307d767e5813ca8e9ea002` (`feat: unify plugin resident service client`)
- AlembicCodex runtime artifact commit：`6a41713d464b069e2764bcdc60f77c612da7cf22` (`chore: refresh unified resident runtime artifact`)
- `plugins/alembic-codex/runtime.tgz` sha256：`cd8c5f099a784d8327ce170732761d0a9477ce47c891ff30fa60b6cdb6ed7ea3`

## 统一 Client API

- `probe(options?)`
- `search(request)`
- `searchWithResult(request)`
- `enqueueJob(kind, options?)`
- `readJob(args, options?)`
- `dashboard(options?)`

client 只从 `/api/v1/daemon/health.data.residentService` 读取 canonical contract，并使用 `@alembic/core/daemon` normalizer / result union。没有新增 `/api/v1/resident/status`。

## 保留兼容字段

- `ResidentSearchResult` / `ResidentSearchAttemptMeta` 作为 Plugin 内部 search / prime 的兼容投影保留，真实消费方是 `lib/external/mcp/handlers/search.ts` 与 `lib/service/task/PrimeSearchPipeline.ts`。
- `EnhancementRoute` 仍保留对 `runtimeBoundary` / legacy capability summary 的读取，真实消费方是 status / diagnostics / host project alignment；Phase 4 可在确认 Alembic producer 和 Plugin consumer 都稳定消费 `residentService` 后，再判断降级或删除。
- Plugin embedded runtime 仍保留 `embedded-plugin-runtime` 的 host-agent recoverable job 能力，不称为 Alembic resident enhancement。

## 删除 / 下阶段候选

已删除：

- `ResidentSearchClient`
- `callDaemonHttpEndpoint`
- `lib/external/mcp/codex/daemon-jobs.ts`

Phase 4 候选：

- 复核 `EnhancementRoute` 对 `runtimeBoundary` / `capabilities.residentSearch` 的兼容读取是否仍有真实消费方。
- 继续收紧 diagnostics / session scenario 中 internal AI job 与 embedded host-agent recoverable job 的表达。
- 若总控需要更干净的负向扫描，可将 `daemon-server` shutdown hook label 中的 `daemon-jobs` 改成中性 label；当前它不是 HTTP helper 或 MCP bridge。

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run test:unit -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexServiceRequestBoundary CodexMcpServer CodexStatusService CodexEnhancementRoute Diagnostics`：通过，`7` 个测试文件、`58` 个测试。
- `npm run check`：通过，typecheck / Biome lint / core import boundary 均通过。
- `npm run test:unit`：通过，`104` 个测试文件、`1494` 个测试。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。
- `rg -n "ResidentSearchClient|residentSearchClient|callDaemonHttpEndpoint|from './codex/daemon-jobs|from './daemon-jobs|#service/search/ResidentSearchClient" lib test plugins/alembic-codex/runtime/dist -g '!node_modules'`：无命中。

## 遗留风险

- AlembicTest 真实项目未在本轮执行；本轮只做 Plugin 内部 build / unit / plugin smoke。
- `runtimeBoundary` 与 legacy capability summary 仍作为兼容输入保留，需要 Phase 4 做 consumer 稳定后再收敛。
- `/api/v1/search`、`/api/v1/jobs/*` 的 Alembic producer 真实运行态联调仍需要 AlembicTest 或下一阶段集成验证覆盖。

## 总控验收

验收结论：通过。Phase 3 已达到 unified client consumer 阶段完成定义，可进入 Phase 4 行为收敛与残留删除。

总控复核证据：

- `git -C AlembicPlugin status --short`：干净。
- `git -C AlembicPlugin/plugins/alembic-codex status --short`：干净。
- `git -C AlembicPlugin show --stat --oneline HEAD`：确认 `4f58d5e feat: unify plugin resident service client`。
- `git -C AlembicPlugin/plugins/alembic-codex show --stat --oneline HEAD`：确认 `6a41713 chore: refresh unified resident runtime artifact`。
- `shasum -a 256 plugins/alembic-codex/runtime.tgz`：`cd8c5f099a784d8327ce170732761d0a9477ce47c891ff30fa60b6cdb6ed7ea3`。
- `npm run build:check`：通过。
- `npm run test:unit -- AlembicResidentServiceClient SearchHandlerResidentSearch PrimeSearchPipelineResidentSearch CodexServiceRequestBoundary CodexMcpServer CodexStatusService CodexEnhancementRoute Diagnostics`：通过，`7` 个测试文件、`58` 个测试。
- `git diff --check HEAD`：通过。
- `git -C plugins/alembic-codex diff --check HEAD`：通过。
- 旧 `ResidentSearchClient` / `callDaemonHttpEndpoint` / daemon MCP bridge / `/api/v1/mcp/call` / `/api/v1/projects` 精确负向扫描：无命中。

## 下一步建议

- 可以进入 Phase 4：行为收敛与残留删除，重点检查 legacy `runtimeBoundary` / `capabilities.residentSearch` 兼容字段、diagnostics 文案和 session scenario 表达。
- AlembicTest 建议放在 Phase 4 后启动，避免真实项目复测前还有兼容字段 / 文案残留导致验收口径变化。
