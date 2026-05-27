# 09. 新主线底层基础设施设计

> 目标：把底座从旧 `ServiceContainer` 的“大平台装配”改成一组可组合、可测试、可裁剪的基础端口。上层内容挖掘与知识注入只依赖这些稳定接口，不再被 Wiki、Tool Forge、ReverseGuard、AI mock、Dashboard 后台任务拖重。

## 1. 本轮核心判断

新主线要全面替代旧项目，但替代方式不是把旧能力等比例搬家，而是先打一个更小、更硬的底座：

1. `foundation` 只做环境、路径、日志、单例、并发、定时器、Worker 端口、共享能力目录。
2. `data` 只暴露数据库端口、Artifact Store、ContextIndex，不直接绑定 Drizzle 或旧数据库单例。
3. `language` 只暴露语言识别和 AST 解析端口，不默认启动 tree-sitter 全家桶。
4. `compile` 与 `runtime` 通过领域对象通信，不互相启动对方后台流程。
5. 旧系统只通过 `legacy` adapter 给新主线供血，不再作为新逻辑的中心。

底层建设的核心不是“功能更多”，而是“能力边界更清楚”：每个能力都能明确回答它是否可用、如何被替换、是否进入主路径。

## 2. 新增底座模块

| 模块 | 文件 | 职责 | 是否主路径 |
| --- | --- | --- | --- |
| 环境数据 | `foundation/Environment.ts` | 统一读取 env、布尔值、数字、列表、脱敏快照 | 是 |
| 单例能力 | `foundation/SingletonRegistry.ts` | 小型惰性单例缓存，不做模块自动注册 | 是 |
| Kernel | `foundation/MainlineKernel.ts` | 轻量装配根，聚合底座端口 | 是 |
| 日志端口 | `foundation/LoggerPort.ts` | `MainlineLogger`、`Noop`、`Memory` | 是 |
| 定时器 | `foundation/Scheduler.ts` | 统一 timeout/interval、可 snapshot、可 dispose | 是 |
| 并发闸门 | `foundation/Concurrency.ts` | 限制编译/运行任务并发，不升级成任务系统 | 是 |
| Worker 端口 | `foundation/WorkerPool.ts` | 多线程/后台执行抽象，默认显式 unavailable | 是 |
| 共享能力目录 | `foundation/CapabilityRegistry.ts` | 统一暴露 DB、AST、Worker、路径等能力状态 | 是 |
| Ghost 路径 | `foundation/WorkspacePaths.ts` | `projectRoot` 读代码，`dataRoot` 写数据 | 是 |

这批模块都不导入旧 `ServiceContainer`、旧 `DatabaseConnection`、Drizzle、tree-sitter、`AgentRuntime`、Tool Forge 或 mock provider。

## 3. Ghost 主路径模式

旧系统 Ghost 模式的正确核心是：

```text
projectRoot = 真实源码目录
dataRoot    = 标准模式下 projectRoot；Ghost 模式下 ~/.asd/workspaces/<id>
runtimeDir  = dataRoot/.asd
database    = dataRoot/.asd/alembic.db
knowledge   = dataRoot/Alembic
recipes     = dataRoot/Alembic/recipes
candidates  = dataRoot/Alembic/candidates
```

新 `MainlineWorkspacePaths` 保留这个模型，并把它放进新主线底座。这样内容挖掘读取真实源码时不会误写用户项目，知识注入写 Recipe/候选/索引时也不会绕开 Ghost 边界。

后续迁移规则：

1. 扫描真实代码使用 `workspacePaths.projectRoot`。
2. 写数据库、日志、候选、Recipe、ContextIndex 使用 `workspacePaths.dataRoot` 派生路径。
3. 旧 `WorkspaceResolver` 只作为 adapter 传入 `MainlineWorkspacePaths`，不能被 compile/runtime 直接依赖。
4. 新代码不能直接拼 `process.cwd()`、`.asd`、`Alembic`，除非在 `WorkspacePaths` 里。
5. 未接入旧 registry 时，Ghost dataRoot 只能标记为 `derived` fallback；正式运行应由 registry/adapter 传入明确 `projectId` 或 `dataRoot`。

## 4. 日志主线

日志现在先抽象成 `MainlineLogger`：

```text
NoopMainlineLogger   默认，不写 stdout/file
MemoryMainlineLogger 测试与调试面板用
LegacyLoggerAdapter  后续接旧 winston logger
```

这解决两个问题：

1. 新主线能统一打日志，但不会默认创建日志文件。
2. 旧 winston 配置、PathGuard、MCP quiet 模式都被隔离到 adapter，不进入底座。

后续如要接真实日志，应该新增 `legacy/LegacyLoggerAdapter.ts`，不要让 `foundation/LoggerPort.ts` 直接导入旧 logger。

## 5. 定时器与多线程

旧系统的问题不是没有定时器，而是 timer 往往散落在 daemon、Signal、Workflow、AgentRuntime 里，生命周期难以统一。

新主线使用两层：

1. `MainlineScheduler`：统一 `timeout/interval/delay`，支持 `snapshot()` 和 `dispose()`，所有 timer 默认 `unref()`。
2. `MainlineWorkerPool`：表示后台执行能力；默认 `UnavailableWorkerPool`，测试和轻量任务可用 `InlineWorkerPool`。

这意味着：

1. 编译期大扫描可以先通过 `InlineWorkerPool` 跑通语义。
2. 真正 Worker Threads 后续只实现同一个端口。
3. 新主线不会因为“多线程能力”而立刻引入复杂 daemon/job 平台。
4. 定时任务必须被 kernel 持有并可 dispose，避免隐式后台存活。

## 6. 共享能力目录

`MainlineCapabilityRegistry` 是新主线的“能力事实表”：

```text
logger           available
scheduler        available + active timer snapshot
concurrency      available + active/queued snapshot
domain-models    available + 核心业务对象列表
context-index    available
database         available/unavailable + driver/path/reason
language-service available
ast-parser       available/unavailable
worker-pool      available/unavailable
workspace-paths  available + path snapshot
```

它的价值是让上层先看能力再行动。例如：

1. 数据库不可用时，内容挖掘可以产出内存 artifact，不假装已持久化。
2. AST 不可用时，扫描降级到扩展名/文本证据，不伪造符号图。
3. Worker 不可用时，编译期选择串行或小并发，不悄悄启动旧 AgentRuntime。

这条线比 mock 更诚实，也比旧平台自动 fallback 更容易定位问题。

## 7. 语言与业务基础能力边界

语言基础能力分三层推进：

1. `LanguageServicePort`：扩展名识别，已经是主路径。
2. `AstPort`：AST 解析端口，当前显式 unavailable。
3. `LanguageAdapter`：后续接 tree-sitter 或 TypeScript compiler API，但必须在 `language/adapter` 或 `legacy`，不能反向污染 domain/foundation。

业务基础能力也分三层：

1. 领域对象：`Recipe`、`RecipeEdge`、`SourceRef`、`EvidencePackage`、`ContextBundle`、`GuardFinding`。
2. 数据索引：`ContextIndex`、Artifact Store、数据库端口。
3. 使用闭环：内容挖掘生成关系，知识注入生成上下文，Guard Finding 回流成新证据。

底座只给这些能力提供运行条件，不接管业务决策。

## 8. 明确剪枝

以下能力不进入新主线底座：

| 旧能力 | 剪枝原因 | 新位置 |
| --- | --- | --- |
| `ServiceContainer` 全量注册 | 过重，自动装配太多历史能力 | `legacy` adapter 外围 |
| `AgentRuntime` | Agent 平台职责过多，不应成为底层 | 运行期 adapter |
| `ToolForge` | 低频实验能力，偏离内容挖掘/知识注入闭环 | Advanced/实验 |
| `ReverseGuard` | 反向审计不是核心路径 | 用 SourceRef freshness 替代主价值 |
| Wiki 默认生成 | 导出能力，不是主路径 | 手动导出 |
| AI mock provider | 会制造虚假的“AI 已接入”感 | 删除核心路径，使用真实 provider 或 unavailable |
| tree-sitter 默认启动 | 语言能力重，先端口化 | AST adapter |
| Drizzle 直连 | 数据层太早绑定实现 | DatabasePort adapter |

## 9. 多任务窗口推进建议

下一步可以开四个窗口并行，但写入边界要严格：

| 窗口 | 写入边界 | 目标 |
| --- | --- | --- |
| 底座窗口 | `lib/mainline/foundation`, `test/unit/Mainline*Foundation*.test.ts` | 继续补日志 adapter、路径 adapter、worker adapter |
| 数据窗口 | `lib/mainline/data`, `test/unit/MainlineData*.test.ts` | 接真实数据库 adapter、ContextIndex 持久化 |
| 语言窗口 | `lib/mainline/language`, `test/unit/MainlineLanguage*.test.ts` | 接 AST adapter、符号抽取、SourceRef 定位 |
| 业务闭环窗口 | `lib/mainline/compile`, `runtime`, `agent` | 内容挖掘到知识注入的闭环 |

所有窗口共享规则：

1. 只能通过 `lib/mainline/index.ts` 暴露公共接口。
2. 不能在新主线里直接 import 旧重模块。
3. 新能力先注册 capability，再由上层选择是否启用。
4. 每迁入一个旧能力，都要同时写一条“旧功能是否保留、降级、删除”的剪枝判断。

## 10. 当前已落地

本轮已经落地：

1. 新主线日志端口：`MainlineLogger`、`NoopMainlineLogger`、`MemoryMainlineLogger`。
2. 新主线定时器：`MainlineSchedulerImpl`。
3. 新主线并发控制：`MainlineConcurrencyLimiter`。
4. 新主线 Worker 端口：`InlineWorkerPool`、`UnavailableWorkerPool`。
5. 新主线共享能力目录：`MainlineCapabilityRegistry`。
6. 新主线 Ghost 路径模型：`MainlineWorkspacePaths`。
7. Kernel 已统一注册这些基础能力。

这让后续迁移可以从“真实能力 adapter”继续向上走，而不是回到旧项目的大容器里继续叠功能。
