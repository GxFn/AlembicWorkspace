# AlembicCore 阶段 5 完成记录

日期：2026-05-17
范围：Core 仓库内的 event / signal / report / daemon job state 完整迁移
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`c89e368 Migrate event job state core`

## 1. 本阶段目标

把 Alembic / AlembicPlugin 共同依赖的事件、信号、报告留痕、daemon 状态和 job 状态内核迁入 `@alembic/core`。

本阶段只迁确定性状态数据层：

- 进程内事件分发。
- 结构化 signal 分发、桥接、JSONL 留痕和聚合指标。
- report JSONL 持久化。
- daemon state 文件读写。
- daemon job JSON 文件状态机。

本阶段不迁 transport、WebSocket、HTTP route、daemon 进程管理、MCP handler 或工作流执行器。

## 2. 已迁入 Core 的文件

Daemon state：

- `src/daemon/DaemonState.ts`
- `src/daemon/JobStore.ts`
- `src/daemon/index.ts`

Infrastructure：

- `src/infrastructure/event/EventBus.ts`
- `src/infrastructure/event/index.ts`
- `src/infrastructure/signal/SignalBus.ts`
- `src/infrastructure/signal/SignalBridge.ts`
- `src/infrastructure/signal/SignalTraceWriter.ts`
- `src/infrastructure/signal/SignalAggregator.ts`
- `src/infrastructure/signal/index.ts`
- `src/infrastructure/report/ReportStore.ts`
- `src/infrastructure/report/index.ts`

Package exports：

- `@alembic/core/daemon`
- `@alembic/core/daemon/*`
- `@alembic/core/infrastructure/event`
- `@alembic/core/infrastructure/event/*`
- `@alembic/core/infrastructure/signal`
- `@alembic/core/infrastructure/signal/*`
- `@alembic/core/infrastructure/report`
- `@alembic/core/infrastructure/report/*`

## 3. 关键边界决策

### 3.1 RealtimeService 不进入 Core

`lib/infrastructure/realtime/RealtimeService.ts` 直接绑定 Socket.io、HTTP server、Dashboard 实时通知和外层 logger。它是外层 transport adapter，不是 Core 状态内核。

外层接入时保留该文件，只把它监听或消费的 EventBus/SignalBus 改为 Core import。

### 3.2 DaemonSupervisor 和 DaemonJobRunner 不进入 Core

`DaemonSupervisor` 负责进程启动、端口、健康探测、打开 Dashboard、清理 lock，这些是宿主进程管理。

`DaemonJobRunner` 负责调 MCP internal handlers、bootstrap task manager、event completion hook 和 cancel 行为。这些依赖外层 ServiceContainer 与工作流执行器。

Core 只迁入：

- `DaemonState`
- `JobStore`

外层 runner/supervisor 后续只改用 Core 的状态和 job store。

### 3.3 ReportStore 随 SignalAggregator 进入 Core

`SignalAggregator` 会把滑窗统计写入 report JSONL。`ReportStore` 是它的确定性持久化依赖，没有 provider、MCP、Dashboard 或 agent runtime 依赖，因此随阶段 5 迁入 Core。

### 3.4 JobStore 使用 AlembicPlugin 的 metadata superset

AlembicPlugin 的 `JobStore` 比 Alembic 主仓库多出以下字段：

- `actor`
- `channelId`
- `client`
- `createdByTool`
- `sessionId`

这些字段是宿主 job 上下文元数据，不是 Codex transport 实现。Core 保留这些字段，避免 Plugin 接入后 job 状态丢信息。

### 3.5 Signal/Event 是内核，DI wiring 留外层

Core 迁入 `EventBus`、`SignalBus`、`SignalBridge`、`SignalTraceWriter`、`SignalAggregator`。但 `SignalModule` / `InfraModule` 属于外层 DI 注册和生命周期 wiring，继续留在 Alembic / AlembicPlugin。

## 4. 已迁移测试

从 Alembic 迁入并修正 import：

- `test/EventBus.test.ts`
- `test/SignalBus.test.ts`
- `test/JobStore.test.ts`

新增 Core 级测试：

- `test/DaemonState.test.ts`
- `test/SignalPersistence.test.ts`

覆盖重点：

- EventBus 同步/异步 emit、历史和统计。
- SignalBus 精确订阅、pipe 订阅、通配符、异常隔离、计数。
- SignalTraceWriter 写入和查询 typed JSONL。
- SignalBridge 转发 `signal:event` 和 `guard:updated`。
- SignalAggregator 写入 metric report，并在突增时发出 anomaly signal。
- DaemonState ghost runtime 路径、状态读写、token 校验、lock 保留删除。
- JobStore 状态机、终态保护、active job interruption、Plugin host metadata 持久化。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run build:check
npm run test
npm run lint
npm run build
node --input-type=module -e "const daemon=await import('@alembic/core/daemon'); const event=await import('@alembic/core/infrastructure/event'); const signal=await import('@alembic/core/infrastructure/signal'); const report=await import('@alembic/core/infrastructure/report'); console.log(JSON.stringify({daemonState:!!daemon.resolveDaemonPaths, jobStore:!!daemon.JobStore, eventBus:!!event.EventBus, signalBus:!!signal.SignalBus, traceWriter:!!signal.SignalTraceWriter, signalAggregator:!!signal.SignalAggregator, reportStore:!!report.ReportStore}, null, 2));"
```

结果：

- TypeScript build check 通过。
- Vitest 21 个测试文件通过。
- Vitest 335 个测试通过。
- Biome lint 通过。
- 实际构建通过。
- daemon、event、signal、report entrypoints 的 self-reference import smoke 全部通过。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

阶段 5 外层接入前必须确认：

- 阶段 1 shared imports 已收敛。
- 阶段 2 workspace/path/config/io imports 已收敛。
- 阶段 3 domain/types imports 已收敛。
- 阶段 4 database/repository/storage imports 已收敛。
- `vendor/AlembicCore` 更新到 `c89e368` 或更新提交。

### 6.2 Alembic 接入

替换 imports：

- `#infrastructure/event/EventBus.js` → `@alembic/core/infrastructure/event/EventBus`
- `#infrastructure/signal/SignalBus.js` → `@alembic/core/infrastructure/signal/SignalBus`
- `#infrastructure/signal/SignalBridge.js` → `@alembic/core/infrastructure/signal/SignalBridge`
- `#infrastructure/signal/SignalTraceWriter.js` → `@alembic/core/infrastructure/signal/SignalTraceWriter`
- `#infrastructure/signal/SignalAggregator.js` → `@alembic/core/infrastructure/signal/SignalAggregator`
- `#infrastructure/report/ReportStore.js` → `@alembic/core/infrastructure/report/ReportStore`
- `#daemon/DaemonState.js` → `@alembic/core/daemon/DaemonState`
- `#daemon/JobStore.js` → `@alembic/core/daemon/JobStore`

保留在 Alembic：

- `lib/infrastructure/realtime/RealtimeService.ts`
- `lib/daemon/DaemonSupervisor.ts`
- `lib/daemon/DaemonJobRunner.ts`
- `lib/injection/modules/SignalModule.ts`
- `lib/injection/modules/InfraModule.ts`
- HTTP jobs/daemon/signals routes
- Dashboard/WebSocket adapter
- ServiceContainer wiring

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/(event|signal)|#infrastructure/report/ReportStore|#daemon/(DaemonState|JobStore)|\\.\\.?/.*lib/infrastructure/(event|signal|report/ReportStore)|\\.\\.?/.*lib/daemon/(DaemonState|JobStore))" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- EventBus SignalBus JobStore DaemonSupervisor JobsRoute SignalIntegration
```

实际测试命令按 Alembic 仓库脚本调整；重点是 daemon state/job route/signal wiring 不能回退。

### 6.3 AlembicPlugin 接入

替换 imports 同 Alembic，同时注意：

- Plugin 的 `JobStore` metadata 字段已在 Core 保留，Codex job context 可以继续写入。
- Codex MCP job-status handler 只改为读取 Core `JobStore`。
- Codex daemon/status/preflight 只改为读取 Core `DaemonState`。

保留在 Plugin：

- Codex MCP server
- daemon supervisor
- preflight/status/diagnostics
- plugin/channel 发布脚本
- Codex runtime/context/project root resolver
- ServiceContainer wiring

建议扫描：

```bash
rg -n "from ['\"](#infrastructure/(event|signal)|#infrastructure/report/ReportStore|#daemon/(DaemonState|JobStore)|\\.\\.?/.*lib/infrastructure/(event|signal|report/ReportStore)|\\.\\.?/.*lib/daemon/(DaemonState|JobStore))" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- EventBus SignalBus JobStore CodexMcpServer CodexStatusService
```

## 7. 外层删除计划

只有在两个外层仓库完成接入、扫描无遗留、代表测试通过后，才删除重复文件。

可删除候选：

- `lib/infrastructure/event/**`
- `lib/infrastructure/signal/**`
- `lib/infrastructure/report/ReportStore.ts`
- `lib/daemon/DaemonState.ts`
- `lib/daemon/JobStore.ts`

不得删除：

- `lib/infrastructure/realtime/RealtimeService.ts`
- `lib/daemon/DaemonSupervisor.ts`
- `lib/daemon/DaemonJobRunner.ts`
- `lib/injection/modules/SignalModule.ts`
- `lib/injection/modules/InfraModule.ts`
- HTTP routes
- Codex MCP server
- Dashboard/WebSocket adapter
- ServiceContainer wiring

## 8. 下一阶段入口

下一阶段按手册进入阶段 6：discovery / AST / project intelligence 基础迁移。

阶段 6 需要特别注意 grammar 资源和自动安装/解析能力属于 Core：Core 要拥有 grammar resolver、WASM 可用性检查和 AST plugin reload 逻辑；外层只负责把 Core 的资源正确打包到各自发布物中。
