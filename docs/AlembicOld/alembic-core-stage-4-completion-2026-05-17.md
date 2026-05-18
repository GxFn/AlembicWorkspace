# AlembicCore 阶段 4 完成记录

日期：2026-05-17
范围：Core 仓库内的 SQLite / repository / 文件存储完整迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`4ed0fda Migrate storage repository core`

## 1. 本阶段目标

把 Alembic 主源中的持久化内核完整迁入 `@alembic/core`，包括 SQLite 连接、Drizzle schema、migrations、repository 实现、知识文件写入、确定性的文件到 DB 同步服务，以及这些文件的最小依赖闭包。

本阶段继续遵守完整复制迁移：

- 以 `Alembic/lib/**` 为主源，不写薄 facade。
- 只做必要的 import 修正、包导出、边界解耦和 lint 修正。
- SQLite、migration 历史、repository 行为进入 Core。
- CLI/MCP/daemon/Dashboard/Lark/Codex/delivery/remote handler 仍留外层。

## 2. 已迁入 Core 的文件

Infrastructure：

- `src/infrastructure/database/DatabaseConnection.ts`
- `src/infrastructure/database/drizzle/index.ts`
- `src/infrastructure/database/drizzle/schema.ts`
- `src/infrastructure/database/migrations/001_initial_schema.ts`
- `src/infrastructure/database/migrations/003_add_remote_commands.ts`
- `src/infrastructure/database/migrations/004_evolution_proposals.ts`
- `src/infrastructure/database/migrations/005_recipe_source_refs.ts`
- `src/infrastructure/database/migrations/006_lifecycle_transition_events.ts`
- `src/infrastructure/database/migrations/007_evolution_type_simplification.ts`
- `src/infrastructure/database/migrations/008_recipe_warnings.ts`
- `src/infrastructure/database/migrations/009_knowledge_dimension_id.ts`
- `src/infrastructure/logging/Logger.ts`

Repository：

- `src/repository/base/**`
- `src/repository/bootstrap/**`
- `src/repository/evolution/**`
- `src/repository/guard/**`
- `src/repository/knowledge/**`
- `src/repository/memory/**`
- `src/repository/search/**`
- `src/repository/session/**`
- `src/repository/sourceref/**`
- `src/repository/sync/**`
- `src/repository/token/**`

Service / types：

- `src/service/knowledge/KnowledgeFileWriter.ts`
- `src/service/knowledge/KnowledgeSyncService.ts`
- `src/types/evolution.ts`

入口与 package exports：

- `@alembic/core/infrastructure/database`
- `@alembic/core/infrastructure/database/drizzle`
- `@alembic/core/infrastructure/database/migrations/*`
- `@alembic/core/infrastructure/logging`
- `@alembic/core/repository`
- `@alembic/core/repository/{base,bootstrap,evolution,guard,knowledge,memory,search,session,sourceref,sync,token}`
- `@alembic/core/service/knowledge`
- `@alembic/core/types/evolution`

新增依赖：

- `better-sqlite3`
- `drizzle-orm`
- `winston`
- `@types/better-sqlite3`

## 3. 关键边界决策

### 3.1 SQLite 和 migrations 属于 Core

SQLite 是知识闭环的确定性持久化底座，必须进入 Core。migrations 也必须完整进入 Core，不能只迁当前 schema，否则外层历史数据库无法按同一顺序升级。

Core 保留 `003_add_remote_commands` migration 与 `remote_commands` 表定义，是为了保持迁移历史和数据库兼容；这不表示 Core 拥有 remote bridge。以下仍留外层：

- `lib/repository/remote/**`
- Lark/Feishu bridge
- remote command handlers
- daemon/MCP/HTTP transport

### 3.2 Delivery repository 不进入 Core

`lib/repository/delivery/**` 绑定外层交付状态和宿主文件写入渠道，不属于 Core 存储内核。本阶段没有迁入 delivery repository，也不能在外层接入阶段删除它。

### 3.3 KnowledgeSyncService 改归 Core service

主源文件位于 `lib/cli/KnowledgeSyncService.ts`，但实际职责是确定性的文件到 SQLite 同步，不是 CLI 命令注册。因此 Core 目的地为：

```ts
src/service/knowledge/KnowledgeSyncService.ts
```

外层 CLI 只保留命令注册、参数解析和输出呈现。

### 3.4 SearchRepoAdapter 不提前迁 search/vector

`SearchRepoAdapter` 只作为 DB adapter 进入 Core，并使用本地 `SearchDb` 最小接口类型。完整 search/vector/indexing、SignalBus、embedding provider、HNSW 仍属于后续阶段。

### 3.5 Logger 是依赖闭包，不是 agent/tool 迁移

repository 与 database 依赖 `Logger`，因此 logging 基础设施进入 Core。它只承担日志记录，不引入 Alembic internal agent、tool router、MCP、Codex runtime 或多渠道交付。

## 4. 已迁移测试

从 Alembic 迁入并修正 import：

- `test/ProposalRepository.test.ts`
- `test/KnowledgeFileWriter.test.ts`

新增 Core 级真实 SQLite 验证：

- `test/DatabaseRepository.test.ts`

覆盖重点：

- 真实临时 SQLite 文件初始化。
- migrations 顺序写入 `schema_migrations`。
- `knowledge_entries`、`recipe_source_refs`、`evolution_proposals`、`remote_commands` 等关键表存在。
- `KnowledgeRepositoryImpl` 可以写入并读取真实 `KnowledgeEntry`。
- `KnowledgeFileWriter` 保留原文件写入、dimension、PathGuard 行为。
- `ProposalRepository` 保留 evolution proposal 行为。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run build:check
npm run test
npm run lint
npm run build
node --input-type=module -e "const db=await import('@alembic/core/infrastructure/database'); const drizzle=await import('@alembic/core/infrastructure/database/drizzle'); const repo=await import('@alembic/core/repository/knowledge/KnowledgeRepository.impl'); const evo=await import('@alembic/core/repository/evolution'); const storage=await import('@alembic/core/service/knowledge'); console.log(JSON.stringify({database:!!db.DatabaseConnection, drizzle:!!drizzle.initDrizzle, knowledgeRepo:!!repo.KnowledgeRepositoryImpl, proposalRepo:!!evo.ProposalRepository, fileWriter:!!storage.KnowledgeFileWriter, syncService:!!storage.KnowledgeSyncService}, null, 2));"
```

结果：

- TypeScript build check 通过。
- Vitest 16 个测试文件通过。
- Vitest 298 个测试通过。
- Biome lint 通过。
- 实际构建通过。
- database、drizzle、knowledge repository、evolution repository、knowledge file writer、knowledge sync service 的 self-reference import smoke 全部通过。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

阶段 4 外层接入前必须确认：

- 阶段 1 shared imports 已全量收敛到 `@alembic/core/shared/...`。
- 阶段 2 workspace/path/config/io imports 已全量收敛到 `@alembic/core/...`。
- 阶段 3 domain/types imports 已全量收敛到 `@alembic/core/domain...` 与 `@alembic/core/types...`。
- `vendor/AlembicCore` 更新到 `4ed0fda` 或更新提交。
- 外层 lockfile 已刷新，能解析 Core 新增依赖。

### 6.2 Alembic 接入

替换 imports：

- `#infrastructure/database/*` → `@alembic/core/infrastructure/database/*`
- `#infrastructure/database/drizzle/*` → `@alembic/core/infrastructure/database/drizzle/*`
- `#infrastructure/logging/*` → `@alembic/core/infrastructure/logging/*`
- `#repository/base/*` → `@alembic/core/repository/base/*`
- `#repository/bootstrap/*` → `@alembic/core/repository/bootstrap/*`
- `#repository/evolution/*` → `@alembic/core/repository/evolution/*`
- `#repository/guard/*` → `@alembic/core/repository/guard/*`
- `#repository/knowledge/*` → `@alembic/core/repository/knowledge/*`
- `#repository/memory/*` → `@alembic/core/repository/memory/*`
- `#repository/search/*` → `@alembic/core/repository/search/*`
- `#repository/session/*` → `@alembic/core/repository/session/*`
- `#repository/sourceref/*` → `@alembic/core/repository/sourceref/*`
- `#repository/sync/*` → `@alembic/core/repository/sync/*`
- `#repository/token/*` → `@alembic/core/repository/token/*`
- `#types/evolution.js` → `@alembic/core/types/evolution`
- `#service/knowledge/KnowledgeFileWriter.js` → `@alembic/core/service/knowledge/KnowledgeFileWriter`
- `#cli/KnowledgeSyncService.js` → `@alembic/core/service/knowledge/KnowledgeSyncService`

保留在 Alembic：

- CLI command files
- setup/bootstrap/rescan command orchestration
- daemon supervisor
- HTTP routes
- Dashboard
- Lark/Feishu bridge
- `lib/repository/remote/**`
- `lib/repository/delivery/**`
- `lib/repository/audit/**`
- `lib/repository/code/**`
- ServiceContainer wiring

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/database|#repository/(base|knowledge|search|sourceref|bootstrap|guard|evolution|session|memory|token|sync)|#types/evolution|#service/knowledge/KnowledgeFileWriter|#cli/KnowledgeSyncService)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- DatabaseRepository KnowledgeFileWriter ProposalRepository
```

同时补跑 bootstrap/setup/daemon 初始化相关测试，确认外层 orchestrator 调用 Core DB 后仍能启动。

### 6.3 AlembicPlugin 接入

替换 imports 同 Alembic，但保留 Codex 专属外层：

- Codex MCP stdio server
- daemon supervisor
- preflight/status/diagnostics
- Codex runtime/context/project root resolver
- tool exposure/tool policy
- plugin/channel 发布脚本
- injectable skills / marketplace assets

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/database|#repository/(base|knowledge|search|sourceref|bootstrap|guard|evolution|session|memory|token|sync)|#types/evolution|#service/knowledge/KnowledgeFileWriter|#cli/KnowledgeSyncService)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- DatabaseRepository KnowledgeFileWriter ProposalRepository CodexMcpServer CodexStatusService CodexKnowledgeState
```

实际测试命令按 Plugin 仓库脚本调整；重点是同时覆盖 Core storage 调用和 Codex 外层初始化。

## 7. 外层删除计划

只有在两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复文件。

可删除候选：

- `lib/infrastructure/database/**`
- `lib/repository/base/**`
- `lib/repository/bootstrap/**`
- `lib/repository/evolution/**`
- `lib/repository/guard/**`
- `lib/repository/knowledge/**`
- `lib/repository/memory/**`
- `lib/repository/search/**`
- `lib/repository/session/**`
- `lib/repository/sourceref/**`
- `lib/repository/sync/**`
- `lib/repository/token/**`
- `lib/service/knowledge/KnowledgeFileWriter.ts`
- `lib/cli/KnowledgeSyncService.ts`
- `lib/types/evolution.ts`

谨慎删除：

- `lib/infrastructure/logging/**`：只有当外层没有宿主专属 transport、日志路径或 CLI 输出包装需求时才删除；否则保留外层 adapter。

不得删除：

- `lib/repository/delivery/**`
- `lib/repository/remote/**`
- `lib/repository/audit/**`
- `lib/repository/code/**`
- CLI command files
- daemon supervisor
- MCP / HTTP routes
- Dashboard
- Lark/Feishu bridge
- Codex runtime / plugin / channel
- ServiceContainer wiring

## 8. 下一阶段入口

下一阶段仍按手册进入阶段 5：event / signal / job / daemon 状态基础迁移。

阶段 5 只迁确定性数据层和状态/队列内核，不迁 `DaemonSupervisor` 的进程启动、端口选择、打开 Dashboard、transport 或宿主进程管理行为。
