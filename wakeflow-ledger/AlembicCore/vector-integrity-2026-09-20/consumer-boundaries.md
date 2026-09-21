# Chunk/AST 与量化 snapshot 消费边界

日期：2026-09-20。Core 基线：`9e8d033ac4dbab4e3555d243fc711269b48eeab9`。

本轮只读追踪公开分块入口、Main/Plugin 装配以及 snapshot 读取消费者。未修改产品、宿主或配置，未运行测试或构建。以下结论来自实际代码，不代表运行时语料中某种策略的使用频率，也不重复审查 WAL/HNSW 写入算法。

## 已确认结论

1. `chunk` 和 `chunkByAST` 都是同步接口；`ensureParser` 才是异步预热接口。实际 Core pipeline 正确地按需 await 预热，再同步取 chunks 数组。
2. 活跃 Main/Plugin 源码通过 IndexingPipeline 间接使用分块。未找到把 Core chunk 当 Promise 调用的实际消费者；两仓集成测试直接同步调用公开 chunk。
3. 两个宿主的 pipeline 工厂都未传 chunking 配置，因此实际依赖 Core 的 `auto / 512 / 50 / true` 默认值。不能将 Core 构造器支持参数等同于宿主已经接线该参数。
4. 两仓默认配置均为 `quantize: auto`、`quantizeThreshold: 3000`，工厂原样透传。Plugin 只读 HNSW reader 自己固定阈值 3000，没有共享宿主自定义 threshold。
5. Plugin 的非 strict 只读搜索消费已落盘 `.asvec`，不加载 HnswVectorAdapter，也不重放向量 WAL。strict publication 则使用独立 JSON reader 与精确 ID 集校验。
6. Main 的 generation store 复用配置工厂，可能是 HNSW 或 JSON；Plugin 的 generation factory 明确使用 JsonVectorAdapter。不能将 base HNSW 的量化配置泛化成所有 generation 的配置。

## 公开分块合同与实际调用

| 入口 | 定义与可见性 | 实际合同 |
| --- | --- | --- |
| `chunk` | `AlembicCore/src/infrastructure/vector/Chunker.ts:45`；`src/vector.ts:26` 具名导出；基础设施 barrel 也转发 Chunker | 同步返回 chunks 数组。空/纯空白输入返回 `[]`。支持 whole、section、fixed、ast、auto。 |
| `chunkByAST` | `ASTChunker.ts:175`；`src/vector.ts:8` 具名导出 | 同步返回数组或 null。空输入返回 `[]`；parser未就绪、不支持或没有可用解析结果时可返回 null，调用者承担 fallback。成功分块在 finally 中删除 tree。 |
| `ensureParser` | `ASTChunker.ts:128`，文件末尾具名导出；`src/vector.ts:9` 转发 | 异步加载 AST 插件与 analyzer，返回 Promise<boolean>。不是 chunk 内部隐式 awaited 的步骤。 |

Core `IndexingPipeline.ts:267–296` 的真实链：

- `useAST` 启用，且策略为 ast，或 auto 下遇到超过 token 阈值的 code 文件时，先 `await ensureParser()`。
- 随后检查 language 是否可用；不可用时记录 debug 并保留配置的 fallback。
- 直接执行 `const chunks = chunk(...)`，读取 `chunks.length` 并逐项处理，没有 Promise 包装假设。

`Chunker.auto` 的顺序保持：小于等于预算 → whole；满足代码语言及已加载 grammar 条件 → AST；含 Markdown 标题提示 → section；否则 fixed。显式 ast 得不到非空 AST chunks 时回 fixed。这里不声称每种语言已经在当前宿主语料中运行过。

真实外层装配：

- Main `lib/injection/modules/KnowledgeModule.ts:201–214`：创建 Core IndexingPipeline，传 dataRoot、resolveKnowledgeScanDirs、vectorStore、embed provider。
- Plugin `lib/injection/modules/KnowledgeModule.ts:238–245`：创建 Core IndexingPipeline，传 dataRoot、scanDirs、vectorStore；该工厂没有直接传 provider。
- 两仓 VectorModule 负责 provider/VectorService 初始化、可选 contextual enrichment 接入，不在这里重写 chunk strategy 或尺寸参数。

命名、别名和路径扫描未发现活跃宿主对 chunk/chunkByAST/ensureParser 的其它直接调用。Agent 的 `ensureParsers` 是另一函数，不计作 Core ensureParser 消费。

两仓 `test/integration/IndexingPipeline.test.ts` 从 `@alembic/core/vector` 导入 chunk，直接检查返回数组的 length、内容及 metadata；可见用例显式选择 whole/auto、section、fixed。这是同步接口的实际兼容证据，不是将 chunk 改成 async 的授权。Core `PublicSearchVectorGuardEntrypoints.test.ts` 同样直接同步消费 chunk。

## 参数实际接线

| 参数 | Core 缺省/处理 | Main 与 Plugin 的实际接线 |
| --- | --- | --- |
| chunk strategy | `auto` | 两个 pipeline 工厂均未传，依赖缺省。 |
| maxChunkTokens | 512 | 未传。 |
| overlapTokens | 50 | 未传。 |
| useAST | true | 未传；按 pipeline 条件预热。 |
| adapter | 宿主分流；hnsw/auto 尝试 HNSW，失败回 JSON | 两仓 default.json 为 auto。 |
| HNSW M / efConstruct / efSearch | 16 / 200 / 100 | 两仓 default.json 显式同值；KnowledgeModule 读取并透传。 |
| quantize | `options.quantize ?? 'auto'` | 两仓 default.json 显式 auto；原样透传，未提供时依赖 Core 默认。 |
| quantizeThreshold | `options.quantizeThreshold || 3000` | 两仓 default.json 显式 3000；原样透传。此处只记录现行兼容表达式，不重定义零值等输入语义。 |
| flushIntervalMs / flushBatchSize | 2000 / 100 | 两仓 default.json 显式同值；读取 persistence 子配置并透传。 |
| walEnabled | 未显式 false 时开启 | 这两个宿主工厂没有传入此选项。 |
| HNSW indexDir | 缺省为 dataRoot 下 `.asd/context/index` | 工厂没有传入，base 文件路径因此为 `vector_index.asvec`。 |

证据位置：Main `KnowledgeModule.ts:421–454`，Plugin `KnowledgeModule.ts:185–233`，两仓 `config/default.json` 的 vector 段，Core `HnswVectorAdapter.ts:61–101` 与 `IndexingPipeline.ts:79–108`。

default.json 中还存在 `vector.dimensions`、`vector.indexPath` 和 `persistence.format`。在这两个 HNSW 构造点没有将它们作为选项传入；不能据配置项存在就认定它控制了 HNSW 的维度、路径或文件格式。本报告没有据此判定这些字段在整个宿主中都可删除。

## quantize 默认依赖与只读消费者

Core 当前训练路径中，none 不训练；auto 在低于 threshold 时不训练；还存在最低训练样本数 100 的检查。查询是否进入量化路径，则另取决于 quantizer 已训练且 index size 大于 threshold。宿主工厂仅选择/传递配置，不自行重写这些条件。

Plugin `lib/host-runtime/mcp/host/read-only-hnsw-vector-reader.ts` 是实际外部解码消费者：

1. `BinaryPersistence.load(indexPath)`。
2. 使用返回的 `dimension`、`indexData`、`metadata`、`contents`、`quantizerData`。
3. `HnswIndex.deserialize(indexData)`；有 quantizerData 时调用 ScalarQuantizer.deserialize，再重建量化向量。
4. 查询量化条件使用本文件常量 `QUANTIZE_THRESHOLD = 3000`，而非宿主配置；最终结果还经过其现有过滤、排序与 topK。

因此，两仓默认 3000 与此 reader 对齐；自定义运行时 threshold 与只读 reader 不是同一参数源。这里只记录已证实的依赖，未运行自定义阈值的排名对照，也未要求增加跨仓配置能力。

BinaryPersistence/HnswIndex/ScalarQuantizer 的公开返回形状仍是此 reader 的接入合同。外层没有手工解析 `.asvec` 字节偏移，但会直接读取 decoded index、quantizer、metadata、contents 等字段。Core 内部实现调整不能只验证可写 adapter 自己能重新打开文件。

## snapshot 入口与格式边界

Plugin `read-only-search-snapshot.ts:54` 的非 strict 分支复制：

- SQLite 主 DB 与存在的 DB `-wal`。
- `.asd/config.json`。
- `.asd/context/index/vector_index.asvec`。

还观察 DB `-shm` 的指纹，但不将它作为普通复制源。复制前后比较内容 hash、mtime、大小与存在性，最多重试三次。本文没有重新验证这套捕获算法。

向量 `vector_index.wal` 不在复制/观察列表。`read-only-search-executor.ts:180` 对 `.asvec` 调用 BinaryPersistence.isValid，再构建只读 HNSW reader。该 reader 不创建 HnswVectorAdapter，不执行迁移、WAL replay 或 flush；dispose 不拥有持久化句柄。

所以这一路的向量可见性是已写成的 `.asvec` snapshot。不能把仅存在于向量 WAL 的更新自动描述成已经进入该只读结果。这是消费边界记录，不是对本轮 WAL 实现的新审查或修改建议。

strict publication 分支不同：按 publication 声明的文件复制，选择指定 vector index；executor 用 ReadOnlyJsonVectorReader，验证 expectedIds，并解析该 publication 的 embedding 配置。不得把普通 HNSW 的 quantize 默认套用于这个分支。

## Main 与 Plugin generation storage 的差异

- Main `KnowledgeModule.ts:156–171` 为 FileRecipeVectorGenerationStorage 注入 `createStore: storeRoot => createConfiguredVectorStore(storeRoot, config, ...)`。因此 base 和 generation 复用宿主选择的 HNSW/JSON 工厂与量化配置；generation 根目录不同。`RecipeVectorGenerationRuntime.ts:224` 在 ready manifest 写出前可等待 store.flush。
- Plugin `recipe-vector-generation-runtime.ts:190–204` 的 JsonGenerationStoreFactory 明确创建 JsonVectorAdapter，文件为 generation 下的 `vector_index.json`。base store 仍可以是 HNSW。
- 两仓 routing store 都会组合 base 与 active generation 的读取，但其实现、存储类型和过滤/合并规则不是本轮统一对象。此次只追踪接线，不改变排序、topK 或 generation 格式。

## 阅读深度与验证边界

- 完整读取了 Chunker 的公开选路部分、ASTChunker 的加载/公开同步入口与 tree 生命周期、IndexingPipeline 构造参数及预热调用段；没有重新审核每个分割算法与语言解析器。
- HnswVectorAdapter 仅读取配置、加载 snapshot、训练触发与查询量化条件；BinaryPersistence 读取公开格式/类型头部及消费者字段关系，未重新验证序列化/恢复实现。
- 完整读取 Plugin ReadOnlyHnswVectorReader 和 ReadOnlySearchSnapshot；executor、Main/Plugin generation storage 与宿主工厂为局部调用追踪。
- 抽读外层 IndexingPipeline 集成测试和 ReadOnlySearchFingerprint 用例。后者证明的测试意图是 live DB/WAL/SHM/vector 文件不被搜索修改，且只读容器不暴露 writer 服务；本轮没有运行这些用例，也未把它当作量化精度或自定义阈值一致性的证明。
- 未发现活跃宿主把同步 chunk API 当作 Promise 使用的证据。公开 API 与外层同步测试仍须保留；扫描无额外调用不是删除授权。

所有结论使用仓库相对位置描述。没有引入新功能、宿主修改、预算调整、排序调整或持久化格式变化。
