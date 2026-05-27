# Alembic Capability Code Interface Cleanup Main Execution

日期：2026-05-22
窗口定位：Alembic 执行窗口
目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`
任务包：CCIC-P1-A
状态：待总控验收

## 当前窗口定位与仓库职责

本窗口只负责 Alembic 主仓库。本轮职责是修复 Alembic 本地增强底座内已可复现的 DB boundary lint 违规，并对 `lib/external/mcp` 做只读消费方盘点。

Alembic 主仓库本轮职责边界：

- 拥有 CLI、daemon、HTTP/API、Dashboard server、本地 runtime、ProjectRegistry、JobStore、file monitor、internal AI jobs、平台能力和本地安装 / dev / release。
- 本轮可以修改 Alembic 自己的 `bin/`、`lib/http/`、`lib/service/`、`lib/infrastructure/` 和相关边界 helper。
- 本轮不修改 Core / Agent / Dashboard / Plugin 产品仓库。
- 本轮不删除、不重命名 `lib/external/mcp`，不改变 Codex Plugin MCP tool ownership，不把 DB helper 下沉到 Core。

## 完成范围

提交：Alembic `df36eb364b3a2d5e8e1868f2db979ffea8d974f8` (`fix: centralize sqlite boundary access`)

源码完成范围：

- 新增 `lib/infrastructure/database/SqliteDatabaseAccess.ts`，统一承载 Alembic 本仓库 SQLite unwrap、schema migration version 读取、CleanupService snapshot 查询、HitRecorder stats update runner 等底层 DB 访问。
- 新增 `lib/infrastructure/database/AuditStoreQueries.ts`，将 `AuditStore` 的 insert/query/find/stats/cleanup raw SQL 收敛到 database infrastructure 层。
- `lib/http/routes/daemon.ts`、`bin/daemon-server.ts` 不再直接 `getDb().prepare()` 读取 schema version，改为调用 database helper。
- `lib/service/cleanup/CleanupService.ts` 不再直接 `prepare()`/`getDb()` 做 recipe snapshot 查询和 snapshot table export，保留原有清理行为。
- `lib/service/signal/HitRecorder.ts` 不再直接 `prepare()` 更新 knowledge entry stats，改为调用 database helper 生成 update runner。
- `lib/infrastructure/audit/AuditStore.ts` 保持原有对外方法和同步/异步调用形状，只委托 database query helper；未切换外部 API。

本轮未做事项：

- 未删除或重命名 `lib/external/mcp`。
- 未改变 CLI / daemon / HTTP route 对 bootstrap/rescan/task/skill/candidates handler 的行为。
- 未扩大 `scripts/lint-repo-boundary.mjs` allowlist。
- 未触碰 AlembicCore / AlembicAgent / AlembicDashboard / AlembicPlugin 源码。

## 验证命令与结果

在 Alembic 仓库执行：

```text
npm run lint:repo-boundary
npm run build:check
npm run test:unit -- test/unit/CleanupService.test.ts test/unit/HitRecorder.test.ts test/unit/AuditLogger.test.ts test/unit/Gateway.test.ts test/unit/DaemonCapabilities.test.ts test/unit/DaemonSupervisor.test.ts test/unit/ProjectRuntimeControl.test.ts
npx biome check bin/daemon-server.ts lib/http/routes/daemon.ts lib/infrastructure/audit/AuditStore.ts lib/service/cleanup/CleanupService.ts lib/service/signal/HitRecorder.ts lib/infrastructure/database/SqliteDatabaseAccess.ts lib/infrastructure/database/AuditStoreQueries.ts
git diff --check HEAD^ HEAD
```

验证结果：

- `npm run lint:repo-boundary` 通过；`@escape-hatch` 计数为 `1 / 75`，无剩余 DB boundary 违规。
- `npm run build:check` 通过，使用本地 `../AlembicCore` source build。
- Targeted unit tests 通过：7 个 test files、62 个 tests。
- Targeted Biome 通过：7 个本轮修改文件无诊断。
- `git diff --check HEAD^ HEAD` 通过。
- 额外尝试 `npm run lint` 仍失败于既有非本轮 Biome 债，例如 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/external/mcp/handlers/browse.ts` 等既有 noNonNullAssertion / formatting diagnostics；未纳入本轮修复范围。
- Alembic 工作区提交后干净，当前 `main` ahead `origin/main` 1 个提交。

## `lib/external/mcp` 消费方盘点

源码消费方：

- `bin/cli.ts` 动态导入 `lib/external/mcp/handlers/bootstrap-internal.js` 与 `rescan-internal.js`，属于 Alembic CLI 对 internal bootstrap/rescan service handler 的调用。
- `lib/daemon/DaemonJobRunner.ts` 动态导入 `../external/mcp/handlers/bootstrap-internal.js` 与 `rescan-internal.js`，属于 daemon job runner 对 internal job handler 的调用。
- `lib/http/routes/candidates.ts` 动态导入 `../../external/mcp/handlers/bootstrap-internal.js` 的 `bootstrapRefine`，属于 Alembic HTTP API 复用 internal refine handler。
- `lib/http/routes/task.ts` 导入 `#external/mcp/handlers/types.js` 与 `../../external/mcp/handlers/task.js`，属于 resident service HTTP task route 复用 service handler/schema。
- `lib/http/routes/skills.ts` 导入 `../../external/mcp/handlers/skill.js`，属于 resident service HTTP skill route 复用 service handler/schema。
- `lib/external/mcp/tools.ts` 仍定义 `TOOLS` 与 `TOOL_GATEWAY_MAP`，当前测试仍检查其 Alembic tool schema 与 gateway map。

测试消费方：

- `test/unit/AgentModuleBoundaries.test.ts` 仍以 `lib/external/mcp/handlers/bootstrap/*` 和 `#external/mcp/handlers/*` 作为 boundary fixture。
- `test/unit/KnowledgeAPI.test.ts` 动态导入 `lib/external/mcp/handlers/knowledge.js` 和 `lib/external/mcp/tools.js`，验证 knowledge tool schema 与 gateway map。
- `test/unit/McpPanorama.test.ts`、`test/unit/BootstrapDimensionAdmission.test.ts`、`test/unit/BootstrapRuntimeInitializer.test.ts`、`test/unit/DimensionRestoreState.test.ts` 等仍引用 handler/types。
- `test/integration/ZodToMcpSchema.test.ts`、`test/integration/WrapHandler.test.ts` 验证 `zodToMcpSchema` 和 `errorHandler` helper。
- `test/integration/GoSupport.test.ts` 动态导入 `bootstrap-internal.js`。
- `test/unit/ResidentServiceBoundary.test.ts` 仍有旧 `lib/external/mcp/McpBridgeDispatcher.ts` 删除断言，说明历史 MCP bridge 删除边界仍被测试保护。

边界判断：

- 当前 `lib/external/mcp` 在 Alembic 主仓库内已经不应理解为 Codex-facing Plugin MCP ownership；它更像 Alembic resident service 的 legacy handler/schema/helper 命名区。
- `bootstrap-internal`、`rescan-internal`、`task`、`skill`、`knowledge`、`panorama`、`structure`、`search`、`guard` 等 handler 仍有真实 CLI、daemon、HTTP 或测试消费方，不能直接删除。
- `zodToMcpSchema`、`errorHandler`、`envelope`、`tools.ts` 仍有 schema / error envelope / tool inventory 兼容价值，不能在没有替代入口和 consumer replacement 前移动或删除。

## 后续候选

可进入 CCIC-2 讨论的候选：

- 将 `lib/external/mcp` 在 Alembic 主仓库中的长期语义重命名为 resident service handler / service tool schema / legacy tool contract，但必须先设计 alias 或迁移策略。
- 先拆分 internal handler consumer map：CLI / daemon job / HTTP route / tests 四类分别明确入口，再决定是否分批迁移目录。
- 对 `tools.ts` 的 `TOOLS` / `TOOL_GATEWAY_MAP` 做 consumer replacement 评估，确认它是否仍是 Alembic service schema，还是只剩历史 MCP vocabulary。

不得直接做的候选：

- 不直接删除整个 `lib/external/mcp`。
- 不把 Alembic 主仓库 handler 迁入 AlembicPlugin。
- 不为了消除命名债破坏 CLI bootstrap/rescan、daemon job runner、HTTP task/skill/candidates 或 existing tests。

## 遗留风险

- `lib/external/mcp` 名称仍然容易被误读为 Codex Plugin MCP ownership；本轮只做盘点，目录迁移需要 CCIC-2 consumer-replace-first 计划。
- `AuditRepositoryImpl` 与 `AuditStore` 仍有历史重复语义；本轮只把 `AuditStore` raw SQL 下沉到 DB helper，未统一 audit repository/service API。
- 全量 `npm run lint` 仍受既有非本轮 Biome 债阻塞，需要单独任务清理。

## 下一步建议

- 等 `AlembicPlugin` CCIC-P1-P 回填后，由总控统一验收 CCIC-1。
- CCIC-2 若继续 Alembic 主仓库，优先做 `lib/external/mcp` consumer replacement / rename plan，而不是直接移动目录。
- 如要处理全量 Biome 债，建议单独开 lint debt cleanup 任务包，避免混入能力边界迁移。
