# AlembicPlugin CCIC-2 Repo-boundary DB 访问收敛执行记录

日期：2026-05-23
窗口：AlembicPlugin
任务包：CCIC-P2-P
状态：待总控验收

## 窗口定位

当前窗口定位：`AlembicPlugin` 执行窗口。

目标仓库职责：`AlembicPlugin` 是 Codex host agent 入口，负责 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex 宿主适配；在 `Plugin first, Alembic install enhances` 前提下，Plugin 保持围绕 Codex / IDE Agent 的自洽闭环，并按需请求 Alembic resident service。

本轮任务职责：完成 CCIC-P2-P，收敛 Plugin 仓库内 raw SQLite / `prepare()` / `getDb()` repo-boundary 债，把 daemon health、Codex KnowledgeState 只读状态、CleanupService / HitRecorder 的底层 DB 操作集中到 database infrastructure helper；必要时同步 Codex runtime artifact。

明确不承担：不修改 AlembicCore public facade 源码；不修改 Alembic 主仓库 resident service handler；不处理 AlembicDashboard parser；不恢复或新增 AlembicPlugin 内置 AI provider / agent tool runtime；不运行真实项目测试；不刷新本机 Codex plugin cache。

## 完成范围

- 新增 `lib/infrastructure/database/SqliteDatabaseAccess.ts`，作为 Plugin repo-boundary 下集中 raw SQLite 访问点，封装：
  - schema migration latest version 读取；
  - Codex source refs 与 bootstrap snapshot 只读状态；
  - CleanupService 使用的 table 清理、recipe snapshot 查询、DB trash export；
  - HitRecorder stats JSON 更新；
  - `getDb()` wrapper 解析。
- 更新 `bin/daemon-server.ts` 与 `lib/http/routes/daemon.ts`，schema version 读取改走 `getLatestSchemaMigrationVersion(...)`，route / daemon 入口不再直接 `getDb().prepare(...)`。
- 更新 `lib/codex/KnowledgeState.ts`，移除本文件内 `better-sqlite3` 只读打开、`prepare()`、`sqliteTableExists`、`numeric`、`jsonArrayLength` 等底层实现，改由 database infrastructure helper 返回同构状态。
- 更新 `lib/service/cleanup/CleanupService.ts`，将 raw table delete、pending/rejected/deprecated 清理、recipe snapshot SQL、DB snapshot export 下沉到 helper；service 层保留业务流程和结果聚合。
- 更新 `lib/service/signal/HitRecorder.ts`，移除对 Core search `unwrapRawDb` 的依赖，改由 Plugin database helper 解析 DB 并刷新 stats。
- 删除无消费方旧类型 `lib/types/database.ts`，避免保留裸 `getDb()` 类型 surface。
- 新增 `test/unit/SqliteDatabaseAccess.test.ts`，覆盖 wrapper schema version、Codex source refs / snapshot 只读状态、recipe snapshot rows 查询。
- 同步 `plugins/alembic-codex` runtime dist 与 `runtime.tgz`。同步过程中 vendor AlembicCore 快照更新到本地干净 Core HEAD `4d8d1df417e5f34d5166627bcdbf28547b04736a`，仅作为 Plugin portable runtime artifact 的 vendored snapshot 记录；本窗口没有修改 AlembicCore 源仓库。

## 提交 Hash

- AlembicPlugin：`90d00e923f43017d4ae9aaaa927b7d540effb6cf`
- AlembicCodex runtime artifact 子仓库：`6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`ac244ca4471e0e43fd1e2bb142468d1a2ae478d52350ca8742217a1073bcad03`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:repo-boundary` | 通过；Repository boundary check passed，`@escape-hatch count: 0 / 75`。 |
| `npm run build:check` | 通过；Core build 使用本地 AlembicCore `4d8d1df417e5f34d5166627bcdbf28547b04736a`。 |
| `npm run test:unit -- test/unit/SqliteDatabaseAccess.test.ts test/unit/CleanupService.test.ts test/unit/HitRecorder.test.ts test/unit/AuditLogger.test.ts test/unit/Gateway.test.ts` | 通过；5 个文件、48 个测试全绿。 |
| `node_modules/.bin/biome check bin/daemon-server.ts lib/http/routes/daemon.ts lib/codex/KnowledgeState.ts lib/infrastructure/database/SqliteDatabaseAccess.ts lib/service/cleanup/CleanupService.ts lib/service/signal/HitRecorder.ts test/unit/SqliteDatabaseAccess.test.ts` | 通过；Checked 7 files。 |
| `rg -n "prepare\(|getDb\(" lib bin plugins/alembic-codex/runtime/dist --glob '!lib/repository/**' --glob '!lib/infrastructure/database/**' --glob '!plugins/alembic-codex/runtime/dist/lib/repository/**' --glob '!plugins/alembic-codex/runtime/dist/lib/infrastructure/database/**'` | 无输出；业务层和 runtime dist 业务层不再命中 raw DB 访问。 |
| `npm run build` | 通过。 |
| `npm run prepare:codex-plugin-runtime` | 通过；生成 `plugins/alembic-codex/runtime.tgz`，runtime package `alembic-ai@0.2.0`。 |
| `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `npm run report:agent-extraction-boundary` | 通过；`filesWithBoundaryImports=0`，agent / AI / tool outside implementation 均为 0。 |
| `rg -n "@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai" lib test scripts plugins/alembic-codex/runtime/dist` | 仅命中 `scripts/report-agent-extraction-boundary.mjs` 自检规则字符串；无产品代码残留。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## AuditStore / AuditRepository 判断

本轮不合并 `lib/infrastructure/audit/AuditStore.ts` 与 `lib/repository/audit/AuditRepository.ts`。

判断证据：

- `AuditStore` 是当前 runtime audit sink，仍被 `bootstrap.ts`、`AuditLogger`、`Gateway`、HTTP audit route 和现有 unit tests 直接消费。
- `AuditRepositoryImpl` 注册在 DI `auditRepository` 中，并以 repository bundle 形式存在，但本轮扫描没有发现生产业务路径直接依赖它替换 `AuditStore`。
- 若在 CCIC-P2-P 中强行合并，需要同时迁移 `AuditLogger`、Gateway 和 HTTP audit consumer，范围会超过“repo-boundary DB 访问收敛”的验证链路。

后续安全条件：先明确 audit 读写的唯一生产 contract，再把 `AuditLogger` / route / Gateway consumer 迁移到同一 repository 或 store API；targeted audit / gateway tests 通过后，才删除重复层。

## 残留扫描结果

- `prepare()` / `getDb()` 在 `lib`、`bin`、runtime dist 的非 repository / database infrastructure 区域无残留。
- Agent / AI / tool runtime 禁止项无产品代码残留；仅保留 `scripts/report-agent-extraction-boundary.mjs` 自检规则字符串。
- `plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json` 指向 Core HEAD `4d8d1df417e5f34d5166627bcdbf28547b04736a`，与本地干净 Core 仓库一致。

## 遗留风险

- `AuditStore` / `AuditRepositoryImpl` 仍存在历史双轨语义，本轮只记录判断，不做合并。
- Plugin `HOST_AI_MANAGED` / `hostManaged` legacy compatibility、package identity 重叠和 Dashboard consumer 收窄不属于本轮范围，仍按当前计划后续观察。
- 本轮刷新了 Codex runtime artifact，但未刷新本机 Codex plugin cache；如果总控需要马上用本机 cache 运行最新 artifact，需要另行执行 cache refresh。
- 本轮不创建 AlembicTest 复测单；原因是变更集中于 Plugin DB repo-boundary 与 runtime artifact，不改变真实项目 prime/search/cold-start 用户路径。

## 下一步建议

- 总控验收 CCIC-P2-P 后，将 `CCIC-TODO-11` 标为已完成或待验收关闭。
- 若继续 CCIC-3，优先在总控层判断：AuditStore / AuditRepository 是否进入统一 contract 任务包、Dashboard legacy host-managed 字段是否具备 consumer 收窄条件、Alembic `lib/external/mcp` 是否具备 alias / consumer-replace-first 迁移条件。
- 仅当总控决定立即验证本机 Codex 插件缓存时，再安排 cache refresh；本轮不自行刷新。
