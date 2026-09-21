# 向量服务边界与 availability 提取独立复核

日期：2026-09-20。基线：`f39e139cb127a094caf052c68adbd6e0c88a0913`。

本记录汇总本轮已经完成的只读审查与内存差分验证。产品与测试由主审实现；本审查没有修改产品、测试或宿主仓库，没有提交。本次收尾仅写本文档，不重新执行验证。

结论：availability 提取与两个私有死字段删除，未发现 P1/P2 回归。五态 DTO、原始 provider 的方法接收者、探测次数、stats 含义以及队列和资源归属保持原行为。本结论限于下述实际阅读和执行范围，不替代整体向量系统验收。

## 实际阅读范围

下表行数来自本轮开始时的基线文件。availability 修改后，阅读了新文件全文和两个调用方的完整相关 diff；没有把其它同时进行的 embedding 重构纳入本结论。

| 文件 | 实际深度 | 本轮核对内容 |
| --- | --- | --- |
| `src/service/vector/VectorService.ts` | 基线全文，920 行；随后完整 availability diff | 配置与 provider 适配；initialize/destroy；构建委托；查询入口；兼容同步；generation manager 委托；可用性与 stats；provider 切换与公开 reconcile 入口。 |
| `src/service/vector/SyncCoordinator.ts` | 基线全文，747 行；随后完整 availability/死字段 diff | reader/writer 兼容桥；终态 Recipe 删除 port；三个事件监听；Map 合并；debounce；串行处理和排空；失败回队；DB 补全；对账与 provider 探测。 |
| `src/service/vector/EnrichmentTypes.ts` | 全文，20 行 | 三个纯类型的输入输出、实际增强消费者、公开兼容边界。 |
| `src/service/vector/index.ts` | 全文，6 行 | 六个模块的转发；与公共根入口及稳定 vector facade 的关系。 |
| `src/service/vector/VectorAvailability.ts` | 新文件全文 | 从 VectorService 原位置搬出的四个类型，以及共享 `probeEmbeddingAvailability` 的五态与异常转换。 |

前四个文件的全文阅读共 **1,693 行**。这表示实际阅读深度，不表示每个方法都独立运行过。

辅助阅读与追踪分开记录：

- `EmbeddingPort.ts`：读取本轮前段的旧适配器实现，核对 `asEmbeddingPort`、query/document 分工及原始 provider 的探测能力；未独立复核后续其它 embedding 变更。
- `IndexingPipeline.ts`：局部读取 enrichment 接口、设置与执行位置，核对 `enrichChunks` 的真实消费；未重新全文审查扫描、embedding 批次或写入实现。
- `RecipeRegionVectorIndex.ts`：定位 `asEmbeddingPort`、query/document 调用与 region 同步引用；此次没有重新阅读全文或验证生成算法。
- `src/vector.ts`、`src/service/index.ts`：局部核对稳定具名导出、类型转发和 root 转发链。
- 本轮没有重新审查 WAL、HNSW、二进制存储和持久化格式，也没有修改 RRF、排名或预算。

## 逐文件职责结论

### VectorService

VectorService 是宿主服务门面：委托 IndexingPipeline 构建索引，提供查询、兼容单条/批量同步、Recipe generation 管理入口，并拥有 coordinator 的创建与排空职责。

原始 `#embedProvider` 与适配后的 `#embeddingPort` 不是可直接合并的重复状态。query/document embedding 使用后者；原始对象可能携带旧 `isAvailable()`。如果把 readiness 探测改为检查适配器，会把原 provider 的不可用结果误变成“不支持探测但已配置”。本次 `getAvailability()` 仍传入原始 `#embedProvider`。

`getStats().embedProviderAvailable` 的既有含义是“是否配置 provider”，并不等于实时探测成功。它仍使用 `!!this.#embedProvider`，没有新增 I/O 或 readiness 调用。

`fullBuild` 与 `incrementalUpdate` 都委托 pipeline，但原结果与调用策略并非完全相同；兼容 `batchSync` 写 `entry_*`，canonical Recipe region 同步又是另一条格式和来源路径。本轮没有将这些相似方法合并，也没有改变其持久化语义。

### SyncCoordinator / VectorLifecycleCoordinator

这是事件与维护协调器。`knowledge:changed`、`knowledge:deleted`、`lifecycle:transition` 转为内部变更，以 `Map.set(entryId, change)` 保留同 ID 最后到达的操作。处理顺序不依赖 `timestamp`。

`flush()` 等待排队和处理中变更；`#processingPromise` 保持批次串行排空。终态删除交给 storage-owned `RecipeVectorTruthRemover`，失败时保留未完成变更，并避免覆盖处理期间新到达的同 ID 操作。无 embedding provider 仍能执行删除；生成不可用与删除失败不是同一种降级。

`#hydrateEntries` 每批按 ID 一次读取完整行，随后保留队列实体覆盖补全字段的原优先级。查询失败退回队列字段并记录诊断。该职责是补全 Recipe 输入，不是重复做 embedding 适配或搜索结果映射。

`reconcile()` 是显式维护入口，读取当前真相、检查 generation 集合并决定清理/补建；它不能由单纯 stats 检查或初始化事件绑定替代。本切片仅将私有 availability 判断改为消费共享 DTO 的 `.available`。

### EnrichmentTypes

`VectorChunkData`、`VectorDocumentInfo`、`VectorChunkEnricher` 是被实际使用的纯接口。Main 的 ContextualEnricher 实现该接口；Plugin 保留兼容实现；真正的 chunk 增强调用在 IndexingPipeline。coordinator 的私有 enricher 字段未被读取，不意味着这些公共类型或 pipeline 增强能力可以删除。

### index

`service/vector/index.ts` 经 `src/service/index.ts` 的 `export *` 接入公共根入口；`src/vector.ts` 还保留稳定具名导出。`SyncCoordinator` 兼容类以及现有类型仍保留。本轮没有根据直接 import 数量推导这些转发为死代码。

## 宿主装配与所有权

以下属于局部调用追踪，不是外层仓库全文审查。

| 宿主位置 | 已核对的实际接入 |
| --- | --- |
| `Alembic/lib/injection/modules/VectorModule.ts` | 阅读模块装配与初始化：注入原始 embed provider、store、pipeline、event bus、generation manager 和终态删除器；按配置将 enricher 交给 pipeline；等待 VectorService.initialize。 |
| `Alembic/lib/injection/modules/KnowledgeModule.ts` | 阅读 vectorStore / pipeline / hybridRetriever 工厂片段：使用同一容器资源，pipeline 接收宿主 provider。 |
| `AlembicPlugin/lib/injection/modules/VectorModule.ts` | 阅读工厂、初始化及 provider 选择入口片段：先 prepare 本地 embedding 选择，再实例化/初始化 VectorService；注入 generation manager 与 storage-owned 终态删除器；contextualEnricher 默认 null。provider 选择器余下实现未全文复核。 |
| `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts` | 阅读 pipeline / hybridRetriever 装配片段，核对仍由容器提供共享 store 与 pipeline。 |
| `AlembicPlugin/lib/injection/ServiceContainer.ts` | 阅读 shutdownVectorRuntime：先 `await vectorService.destroy()`，再等待 store flush/destroy。服务排空不等于服务拥有底层共享 store 的销毁权。 |
| `Alembic/lib/recipe-pipeline/generate/runtime/UiStartupTasks.ts` | 阅读 Stage 3：在 generation 条件满足后显式调用 reconcileIndex；不是 initialize 自动对账。 |
| `AlembicPlugin/lib/host-runtime/mcp/host/staging-access-sweep.ts` | 阅读节流后的 reconcileIndex 调用及结果计数消费。 |
| `AlembicPlugin/lib/cli/SetupService.ts` | 阅读同时消费 getStats 与 getAvailability 的入口；实际用户输出依赖结构化 reason/status，不能把它缩成一个配置布尔值。 |

还通过符号扫描确认 Main `service/vector/ContextualEnricher.ts` 和 Plugin `recipe-pipeline/vector/ContextualEnricher.ts` 使用 Core 的 enrichment 类型。两份实现没有作为本轮完整代码审查对象。

## availability 兼容核对

四个既有类型移动到内部模块：

- `VectorAvailability`
- `VectorAvailabilityStatus`
- `VectorAvailabilityReason`
- `VectorAvailabilityProbeStatus`

VectorService 保留 type re-export，`getAvailability(): Promise<VectorAvailability>` 签名未变；`src/vector.ts` 的旧类型导出路径继续经 VectorService 可达。新运行时函数没有加入 `service/vector/index.ts` 或 `src/vector.ts` 的公开转发。

| 输入状态 | available | status | probeStatus | reason |
| --- | --- | --- | --- | --- |
| provider 缺失 | false | unavailable | not-applicable | embed-provider-missing |
| provider 无 readiness 方法 | true | available | not-supported | embed-provider-configured |
| readiness 返回 true | true | available | available | embed-provider-ready |
| readiness 返回 false | false | degraded | unavailable | embed-provider-unavailable |
| readiness 抛出异常 | false | degraded | error | embed-provider-probe-failed |

错误态的 `detail` 保持 `Error.message` / `String(error)` 规则。共享函数使用 `provider.isAvailable()`，没有抽走方法接收者；没有缓存，也没有调用 embedQuery/embedDocuments/embed 来证明可用性。

coordinator 只读取 `.available`。只有 `.probeStatus === 'error'` 才保留原来的 `[SyncCoordinator] embed provider availability probe failed` warn，error 内容取相同转换结果。无 provider、不支持探测、正常 false 三种状态没有新增该警告。

## 已执行的新旧差分

独立验证采用 Node 22 的 stdin 脚本，未新建 probe 文件。通过 `git show HEAD:src/service/vector/VectorService.ts` 读取当时基线源码，以内存 module hook 加载旧类，再加载当前工作树类。没有构建 dist，没有运行全量测试。

差分输入包含五态以及一项抛字符串异常，共 **6 种形态**。实际执行和结果：

1. 新旧 `getAvailability()` 返回值 `deepStrictEqual` 通过。
2. `JSON.stringify` 对比通过，包括字段出现与排列顺序。
3. 新旧 `getStats()` 相等；调用 stats 不增加 probe 次数。
4. 支持 probe 的对象连续两次 availability 调用各执行一次 probe；缺失和不支持 probe 的对象为零次。
5. 通过依赖 `this.ready` 的普通 async 方法验证接收者；将 ready 从 true 改为 false 后，下一次调用立即反映新状态，没有缓存。
6. 所有输入的 embedding 调用次数均为零。

工具输出结论为 `status: "equal"`。支持 probe 的四种输入各记录 2 次探测；缺失/不支持两种输入记录 0 次；所有 `embeddingCalls` 为 0。

差分边界：仅旧 VectorService 源码来自基线，其依赖模块取当前工作树。因此这轮差分证明的是 availability/stats 行为等价，不是整套旧 embedding 实现与新实现的全栈比较。

这份 stdin 验证当时只有工具回显，没有保存独立日志文件。本记录没有补造日志路径。

## 私有死字段证据

本轮对两个源文件做了 `#contextualEnricher`、`timestamp`、`#pendingChanges`、`#embedProvider` 的定向引用扫描，并结合全文阅读确认：

| 删除项 | 删除前实际引用 | 保留边界 |
| --- | --- | --- |
| coordinator `#contextualEnricher` | 一次私有声明、一次 constructor 赋值；没有读取或调用 | `VectorLifecycleCoordinatorConfig.contextualEnricher` 仍存在；VectorService 公开配置仍接受该字段；Main 的 pipeline enrichment 仍保留。 |
| private `PendingChange.timestamp` | 一次类型字段及五处入队赋值；没有读取、比较、排序、持久化或日志消费 | Map 的最后到达覆盖、debounce 参数、batch 上限、失败回队和 processing promise 均未修改。 |

这里的死状态结论只针对上述私有成员。title/content/kind 等队列字段有真实读取，没有顺带删除。VectorService 持有的 enricher 配置与公开类型也没有被误判为 coordinator 的死字段。

## 测试阅读与未执行范围

- `VectorAvailability.test.ts`：读取 fixture、五态相关用例片段及本轮完整 diff；新增 this 绑定、精确调用次数、stats 不探测、状态变化不缓存、不调用 embed 的断言均已核对。
- `VectorService.test.ts`：读取初始化幂等、无 provider 仍移除终态向量、终态删除 port 接入的相关片段；其它构建/迁移/销毁用例只定位，不声称全文阅读。
- `SyncCoordinator.test.ts`：读取不可用 provider 延后生成与 embedding 失败后不误报已同步的相关片段；对绑定、销毁和排空测试做定位扫描，没有重新阅读全文。
- `FailureSemanticsCO3.test.ts`：定位现有 reconcile 诊断和 destroy listener 用例，本轮未重读整套。
- 主审报告的 **95 个相关测试通过**是实现方验证结果；本独立审查没有重新执行这 95 个用例，也没有将其写成自己的执行记录。
- 本轮实际独立执行仅为上面的 6 形态内存差分。队列、日志和所有权的保持结论来自本次 diff 与调用链阅读，不冒称重新做过所有并发时序测试。

当前没有需要本审查继续实施的产品修改。本文仅保留已发生的阅读、扫描和差分事实。
