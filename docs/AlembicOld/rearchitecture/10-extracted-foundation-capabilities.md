# 10. 旧底层能力挖掘与新主线提取

> 目标：继续从真实旧代码中挖掘高频底层能力，把能服务“内容挖掘 + 知识注入”的稳定能力迁入新主线；同时记录哪些旧能力虽然强，但过重、低频或属于宿主编排，必须留在 legacy adapter。

## 1. 本轮结论

这次分析覆盖了旧代码中的 IO、路径安全、事件/信号、配置、取消/超时、daemon job、语言识别、源码扫描、Discoverer、AST 和 Panorama 相关实现。

核心判断：

1. 新主线应该继续吸收“纯端口、状态机、边界模型、确定性规则”。
2. 不应该迁入“进程宿主、HTTP/MCP 协议、Dashboard、Bootstrap 工作流、具体 Discoverer、tree-sitter 装载、Panorama 物化、Guard 服务引擎”。
3. 语言和扫描能力要先变成 deterministic foundation/language 能力，再让旧 AST/Discoverer 作为 adapter 供血。
4. 数据层要有 JSON 文档、JSONL 日志和 Job 状态机这些基础持久化语义，但不能把旧 daemon 的 bootstrap/rescan job 直接搬进来。

## 2. 已迁入的新底座能力

| 新主线文件 | 来源旧能力 | 保留内容 | 剪掉内容 |
| --- | --- | --- | --- |
| `foundation/PathScope.ts` | `PathGuard` 里的路径归属判断 | `contains/resolve/assertInside` | 单例配置、dev repo 排除、IDE 白名单 |
| `foundation/WriteBoundary.ts` | `WriteZone` + `WorkspaceResolver` | `project/data/global/runtime/knowledge` zone | 旧 PathGuard、同步写入 API、部署策略 |
| `foundation/FileSystemPort.ts` | 多处 `fs` 调用 | 基础 IO port 和 Node adapter | 业务路径、PathGuard、workflow 语义 |
| `foundation/AtomicFileStore.ts` | `JobStore`/`DaemonState` tmp+rename | 原子 JSON 写、文本读写、JSONL 追加 | daemon state、bootstrap/rescan job |
| `foundation/DirectoryLock.ts` | `DaemonSupervisor` lockDir 思路 | mkdir 目录锁、owner、stale、wait/poll | PID 管理、spawn、health check、dashboard |
| `foundation/EventBus.ts` | `SignalBus`/`EventBus` | 精确/多类型/通配符订阅、history、异常隔离 | 固定 SignalType、Trace/Aggregator/Bridge |
| `foundation/ConfigPort.ts` | `ConfigLoader` deep merge | 不可变配置、点路径读取、secret redaction | 静态全局、package config 自动读取、stderr |
| `foundation/OperationScope.ts` | `BootstrapTaskManager` abort 语义 | deadline、timeout、parent abort、dispose | session UI、Realtime、Bootstrap 维度任务 |
| `data/JsonStores.ts` | Signal/Report/Feedback JSONL 模式 | JSON 文档 store、JSONL log、坏行跳过 | 各业务报告 schema |
| `data/JobLedger.ts` | `JobStore` 状态机 | queued/running/terminal 状态迁移 | daemon 路径、bootstrap/rescan 类型绑定 |
| `language/LanguageCatalog.ts` | `LanguageService` 纯表格 | ext/lang、alias、display、skipDirs、build markers、test file | FS 扫描、旧静态单例 |
| `language/SourceFileScanner.ts` | Source collector / ProjectIntelligence Phase 1 | 递归源码扫描、skip dirs、test skip、profile | AST、DB、Guard、Panorama 编排 |

这批能力共同构成“语言与业务基础能力”的更完整底座：扫描什么、写到哪里、如何记录、如何取消、如何并发、如何观察能力状态。

## 3. 明确不迁入的新剪枝

| 旧模块 | 判断 |
| --- | --- |
| `ServiceContainer` / `bootstrap.ts` | 旧平台总装配，只保留 legacy adapter，不进入 mainline。 |
| `DaemonSupervisor` / `daemon-server.ts` / HTTP jobs route | 进程宿主和 dashboard 协议，不进入底座。只提取 directory lock 和 job 状态机。 |
| `DaemonJobRunner` | 直接调用 MCP bootstrap/rescan handler，属于 legacy runtime。 |
| `BootstrapTaskManager` / `BootstrapEventEmitter` | 借鉴 AbortSignal 传播，不迁 session/UI/progress 编排。 |
| `DiscovererRegistry` 和具体 `*Discoverer` | 作为 `ProjectDiscoveryPort` adapter；具体 Node/Go/Rust/JVM 等不进 compile core。 |
| `CustomConfigDiscoverer` | 生态过多且混杂业务启发，后续只拆确定性 parser。 |
| `AstAnalyzer` / `core/ast/lang-*` | tree-sitter 能力强但重；新主线只认 AST 摘要端口。 |
| `ProjectGraph` | 混合扫描、AST、图查询、序列化，不能进 mainline。 |
| `GraphCache` | 只抽 ArtifactCachePort 思路，不迁旧同步 FS/WriteZone 实现。 |
| `PanoramaScanner` / `CodeEntityGraph` | 物化层和产品分析层，围绕 mainline artifact 做 adapter。 |
| `GuardCheckEngine` | DB、规则、SignalBus、跨文件检查混合；只抽 DTO/模式工具。 |
| `HnswVectorAdapter` / vector persistence | 向量引擎过重；仅借鉴 WAL/CRC 思路，暂不迁。 |

## 4. 新主线能力目录扩展

`MainlineKernel` 现在应该能登记这些基础能力：

```text
logger
scheduler
concurrency
lifecycle
event-bus
write-boundary
file-store
file-system
directory-lock
config
operation-scope
workspace-paths
domain-models
context-index
job-ledger
database
language-service
ast-parser
worker-pool
```

这个能力目录是多窗口同步推进时的共享事实表。任何新窗口要接入真实 DB、AST、Discoverer、Worker Threads，都应该先让 capability 变成明确的 `available/degraded/unavailable`，再让上层选择是否走重路径。

## 5. 后续优先级

1. P0：用 `SourceFileScanner` 接入 `ContentMiningPipeline`，让内容挖掘从真实文件扫描开始形成 `EvidencePackage`。
2. P0：把 `JsonDocumentStore/JsonlLog` 用于 compile artifact、事件日志、候选记录，替代临时内存结构。
3. P1：定义 `ProjectDiscoveryPort` DTO，旧 `DiscovererRegistry` 作为 adapter。
4. P1：扩展 `AstPort` 为 AST 摘要端口，接旧 tree-sitter adapter，但 compile core 只消费摘要。
5. P2：抽 `ImportRecord`、轻量 dependency graph、SCC/fan-in/fan-out 算法，增强 `RecipeRelationMiner`。

主线顺序仍然不变：

```text
foundation -> language/data -> compile 内容挖掘 -> runtime 知识注入 -> agent 使用闭环
```

这条线越清晰，Alembic 越不容易再次长成旧项目那种“所有能力都默认上车”的重量。
