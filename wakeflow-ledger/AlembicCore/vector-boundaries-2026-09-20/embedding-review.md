# Embedding 边界逐文件审查

日期：2026-09-20。初次只读审查基线：`f39e139`。本文对应本批 EmbeddingPort、VectorIndexPorts、EmbedProviderSelector、BatchEmbedder 的职责分析、窄探针和后续差异复核，不代表整个 vector 目录已由本审查者全文检查。

本审查者没有修改产品、测试、AGENTS.md、CLAUDE.md、coverage/index，也没有运行 Vitest、构建、类型检查或全量 gate。本次仅按主线程要求补写此审查文档。产品实现、正式 RED/GREEN 与提交由主线程负责；没有执行外仓写入、provider 网络请求或 Wakeflow 调度/状态更新。

## 实际阅读范围

### 完整文件

以下四份基线源码均全文语义读取，共 636 行：

| 基线文件 | 行数 | 职责与边界 |
| --- | ---: | --- |
| `src/service/vector/EmbeddingPort.ts` | 134 | query/document 用途接口、能力描述、legacy 协议适配、单向量/矩阵形状归一化及 AbortSignal 检查。没有 ID 映射、并发调度或索引写入。 |
| `src/service/vector/VectorIndexPorts.ts` | 112 | 读写能力分离；reader 委托检索、详情、统计，并对 listIds 做 limit 截断；writer 独立暴露写操作。两个 adapter 避免只读消费者得到写方法。 |
| `src/service/vector/EmbedProviderSelector.ts` | 177 | local-first 有序可用性探测、逐通道诊断、首个可用通道选择，以及将真实 provider 交给 migrateDimension。keyword/null 的既有 apply 行为为 no-op。 |
| `src/infrastructure/vector/BatchEmbedder.ts` | 213 | 批次、并发上限、transport hint、8K 截断、进度、ID→vector 映射和局部失败恢复；原文件末尾另有重复 legacy 协议适配。 |

后续实现差异复核还全文读取了新增的 `src/infrastructure/vector/EmbeddingPort.ts` 及旧 service 路径的 17 行显式转发文件；该次全文读取对应仍包含原始 provider 错误文本的日志版本，因此下述日志发现有直接代码与运行证据。固定 reason 的最终修复状态来自主线程回报和本目录检查记录，不冒称由本审查者再次运行验证。

完整阅读的相关测试文件：

- `test/EmbeddingPort.test.ts`：基线全部 93 行，随后读取取消矩阵、双方法兼容回归及其余保留用例的修改后文件。
- `test/VectorIndexPorts.test.ts`：全部 43 行。
- `test/EmbedProviderSelector.test.ts`：全部 196 行，包含真实 VectorService.migrateDimension 编排消费（存储、pipeline 为受控测试端口），并非真实 provider 网络测试。

### 局部消费者与测试追踪

以下是局部读取或符号追踪，**不计为完整文件审查**。行号对应读取时版本，后续整理可能移动。

| 文件/范围 | 实际确认内容 |
| --- | --- |
| `src/infrastructure/vector/IndexingPipeline.ts` 构造/setAiProvider，约 104–132；embed/upsert，约 416–465 | 生产创建并更新 BatchEmbedder；接受其局部结果，按 ID 合并 vector，缺失向量允许以 `[]` 继续既有写入。后续 diff 仅核对类型导入下移及注释。 |
| `src/service/vector/VectorService.ts` 约 143–175、818–851；其他 embed 调用点通过搜索定位 | 构造和模型迁移使用 asEmbeddingPort；迁移仍 clear→换 provider→更新协调器/pipeline→fullBuild。查询与文档 embedding 是独立用途。 |
| `src/service/vector/SyncCoordinator.ts` 约 25–115、126–157 | 配置消费 VectorIndexReader/Writer，内部 LifecycleVectorStoreBridge 委托只需的方法；没有据此修改生命周期或终态删除协议。 |
| `src/service/search/KnowledgeRetrieval.ts` 约 136–224 | query embedding 传 request.signal；await 后再次检查取消，取消不归为普通降级；reader/sparse 收集另有 before/after 检查。 |
| `src/service/vector/RecipeRegionVectorIndex.ts` 约 564–605；query 调用点搜索定位 | 文档 embedding 经 asEmbeddingPort；随后按 chunk ID 写入并读回。没有评审整个 region 生成/恢复协议。 |
| `src/vector.ts` 约 10–57、85–135；相关 barrel/import 扫描 | 确认既有 embedding 类型/运行时类与 vector 读写端口的公开出口。旧 service 入口是现存消费面。 |
| `AlembicPlugin/lib/recipe-pipeline/vector/LocalEmbedding.ts` 约 85–157 | 宿主处理本地配置、精确模型选择与 probe，再调用 Core selectEmbedLane；没有向 Core 新增宿主/provider runtime。 |
| `Alembic/lib/service/vector/RecipeVectorGenerationRuntime.ts`、`AlembicPlugin/lib/host-runtime/mcp/host/read-only-search-executor.ts` | 仅 import/符号及调用点追踪：真实宿主调用 asEmbeddingPort；没有全文审查这些宿主文件。 |
| `test/HnswVector.test.ts` 基线约 847–904 | BatchEmbedder 分批/进度、无 provider、legacy batch 失败回退用例；随后只复核被删除 fallback 用例的 diff。其他 RRF diff 不算本次 embedding 评审范围。 |
| `test/Ad5FoundationalUpgrades.test.ts` 约 67–119 | 并发 hint、默认 2、显式选项覆盖三个行为测试。 |
| `test/KnowledgeRetrievalPolicy.test.ts` 等额外测试 | 只做取消/embedding 调用的符号定位，不声称完整读取或执行。 |
| `src/shared/concurrency.ts`、`src/infrastructure/logging/Logger.ts` 相关实现 | 核对 createLimit 的现有边界以及窄探针不会创建文件 transport；不纳入本批四文件全文统计。 |

对 Core、Alembic、AlembicPlugin 的符号扫描中，VectorIndexReaderAdapter/WriterAdapter/createVectorIndexPorts 的直接引用主要是公开出口和测试；reader/writer **类型**有真实检索与协调器消费。这不构成删除已发布 adapter 或接口的依据，未虚构外层 factory 消费。

## 已实证问题：最后一次串行 await 后漏取消检查

位置：基线 `EmbeddingPort.ts:99–104`。串行循环在调用 provider 前检查 signal，但在最后一次 await 返回后直接归一化并 push，然后 resolve。

本审查者使用 Node 22.23.2，将当前 TypeScript 源码在内存中转译后直接调用公开 LegacyEmbedProviderAdapter；注入受控 provider，并在最后一条异步请求完成前调用 AbortController.abort。未写临时源码/测试文件，未请求网络。

| 路径 | 基线实际结果 |
| --- | --- |
| embedQuery | reject；错误与原 abort reason 为同一对象 |
| 正常批量 embedDocuments | reject；错误与原 abort reason 为同一对象 |
| `batchSupported:false` 串行 | signal 已取消却 resolve `[[5],[4]]` |
| 批量抛错后串行回退 | signal 已取消却 resolve `[[5],[4]]` |
| 多输入批量返回扁平向量后串行回退 | signal 已取消却 resolve `[[5],[4]]` |

建议与实现复核：每次单条 await 后立即 `throwIfAborted()`，然后 normalize/push。保留取消原因本身，不把取消转换为普通 provider 失败或串行重试；不用 document 路径调用可重写的公共 embedQuery，以免用途耦合。

这是现有 EmbeddingExecutionContext 的结果取消边界修复，不是新增取消能力：legacy embed 签名本来不接收 signal，本次不宣称能中断其底层网络请求。BatchEmbedder.embedAll 仍没有新增 cancellation 参数。

## 协议整合的兼容反例

原 BatchEmbedder 私有 toEmbeddingPort 只检测 `embedDocuments + embedQuery`，而公共 isEmbeddingPort 还要求 describeCapabilities。直接把前者整体替换成 asEmbeddingPort 会改变既有路径。

本审查者另外执行了真实 BatchEmbedder.embedAll 窄探针：对象同时具有 legacy embed（受控抛错）、embedQuery、embedDocuments，但没有 describeCapabilities。它仍符合 LegacyEmbedProvider 的结构类型，不能简单当成完全非法输入。

| 路径 | 实际调用与结果 |
| --- | --- |
| 原 BatchEmbedder(provider) | document 方法调用 1 次，legacy 0 次；Map 为 `[['doc',[7]]]` |
| 不加区分地 BatchEmbedder(asEmbeddingPort(provider)) | document 0 次，legacy 4 次；空 Map |

因此本轮实现保留双方法直通，只将剩余 legacy 代码委托共享 LegacyEmbedProviderAdapter。hint 仍由构造函数读取一次，并将已读 provider 名传给适配器；并发决策保持“显式选项→hint→默认 2”。

该窄探针读取当前 BatchEmbedder 源码并在内存中转译，使用工作区已有 dist 的 concurrency/Logger 依赖；没有重建 dist，也没有复制或安装 provider。它证明兼容差异，不代表完整构建验证。

## 后续差异复核：日志回显输入

实现下移后的首次复核发现新增 warn 将任意 `Error.message` 或 `String(error)` 原样写入元数据。这不能满足“不记录输入内容”的诊断边界，因为 provider 的错误可能回显请求文本。

本审查者通过公开 embedDocuments 注入批量错误 `Error('Bad input: ' + texts.join('|'))`，串行分支正常返回；仅在隔离进程中捕获并恢复 Logger.warn 方法。使用的输入为合成标记，不涉及用户文档。实际结果：

```json
{"resolved":true,"warningCount":1,"metadataKeys":["provider","count","error"],"diagnosticContainsInput":true}
```

发现被标为 P2，定位审查时新增 `src/infrastructure/vector/EmbeddingPort.ts:97–100`。建议只记录本地固定原因及 provider/count，不把不受控错误文本复制进日志；保留原运行失败与取消错误的传播。

主线程随后已在既有 fallback 用例中先 RED，再改为固定 reason。此最终修复未由本审查者重新跑测试；证据来源与验证归属见下节。

## 实现与公共面复核结论

- 协议实现移到 `src/infrastructure/vector/EmbeddingPort.ts`，旧 `src/service/vector/EmbeddingPort.ts` 显式转发原有六个类型和三个运行时出口；不是第二套类实现，既有调用路径继续指向同一实现。
- `src/vector.ts` 与 service barrel 的既有出口保留；没有为内部移动扩大新的公共 subpath。
- BatchEmbedder 与 IndexingPipeline 的依赖方向改为基础设施内部引用；IndexingPipeline 的行为代码没有因该移动改变。
- 普通 query/document、空文档列表、单条扁平向量/矩阵归一化和 native document 路由未发现其他回归。空文档列表原本在 provider 调用前返回空数组；已取消 signal 的前置检查仍先于空输入返回。
- 双方法但无 descriptor 的直通、nullable provider、构造参数、8K 截断、hint 单次读取和进度语义保持。
- 不把 BatchEmbedder 的 ID 映射、批次并发和局部恢复删成“重复校验”。它与端口的协议转换处于不同边界；当前消费者允许部分向量缺失，不应在此次清理中擅自新增严格批次数量门禁。
- VectorIndexPorts 的读写分离及 EmbedProviderSelector 的顺序探测/诊断/迁移编排保留。未借本次整合改变 keyword no-op、维度迁移或宿主配置策略。

除已回报并由主线程修复的取消与日志问题外，这次差异复核没有发现其他 P1/P2；这不是未读取或未执行边界的全面正确性声明。

## 测试保留与删除映射

| 原有覆盖 | 本轮处置与依据 |
| --- | --- |
| EmbeddingPort query/document 用途与完整 descriptor | 保留；协议目的和能力描述契约。 |
| 声明 batchSupported=false 的单条调用 | 保留；它与尝试 batch 后失败回退是不同路径。 |
| BatchEmbedder 的 native document 方法消费 | 保留，并新增缺 descriptor 的双方法兼容回归。 |
| 三种 serial 最后 await 取消 | 主线程新增参数化回归，断言拒绝原 reason 对象。 |
| HnswVector 原 `should fallback to serial on batch failure`，基线约 884–903 | 删除；只验证 size=2，且 `_callCount` 只写不读。EmbeddingPort 原约 75–92、后续约 119–135 的 single-only legacy 用例保留完整 ID/vector 断言，覆盖同一 fallback；没有移除独有批次数量或并发断言。 |
| HnswVector BatchEmbedder 分批、进度、无 provider | 保留，其他端口测试不替代这些边界。 |
| AD5 并发 hint/default/explicit override | 保留，不能用“构造成功”代替真实峰值并发验证。 |
| VectorIndexPorts 读口不含写方法、写 adapter 委托 | 保留公开能力分离契约；本次未修改。 |
| EmbedProviderSelector 顺序/错误诊断/真实 VectorService 迁移消费 | 保留；本次未修改 selector。 |

## 验证归属与状态

本审查者实际执行的只有上述三个窄探针：取消对照、双方法路由对照、合成输入日志回显。结果最初返回于任务工具输出，未另行保存成测试或 log 文件，不将主线程日志冒充本审查者运行。

已读取本目录 `checks.jsonl` 的记录。与 embedding 直接相关的主线程证据如下；这里只记录命令与退出状态，不声称读过不存在于本目录列表中的全部 log 正文：

| 主线程记录 | 命令范围 | 记录结果 |
| --- | --- | --- |
| `red-embedding-cancellation` | EmbeddingPort.test.ts | exit 1，正式 RED |
| `green-embedding-boundary` | EmbeddingPort、HnswVector、VectorService、PublicSearchVectorGuardEntrypoints、Ad5FoundationalUpgrades | exit 0 |
| `embedding-types` | `npm run build:check` | exit 0 |
| `embedding-layer` | `npm run lint:layer-contract` | exit 0 |
| `red-fallback-diagnostics` | EmbeddingPort.test.ts | exit 1，日志回显 RED |
| `green-vector-boundaries` | EmbeddingPort、HnswVector、VectorAvailability、SyncCoordinator、VectorService | exit 0；主线程报告 200 项通过 |
| `final-vector-types` | `npm run build:check` | exit 0 |
| `core-check` | `npm run check` | exit 0，属于主线程整批检查，不扩大本审查者的阅读范围 |

本次文档回填不再运行测试或修改产品。最终提交 hash、整批验收和交付说明由主线程维护；本审查者没有独立提交。
