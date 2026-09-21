# HNSW 测试归属与行为覆盖审查（只读）

快照：Core c1f6d7760a5fe0549420b72babea39b4f9c02e3d；Plugin 11f8d47476fb09b52977242b3ab5a1fa413e4226。文件 SHA256、每个测试 callback、imports、helpers、hooks 和断言保存在 hnsw-vector-inventory.json；逐用例去重映射与处置理由见 hnsw-vector-ownership.json。

两文件各 21 个 describe。Plugin 有 91 个测试声明；Core 文件有 105 个声明（静态展开 3 个 it.each 后 110 个 case，未运行）。Plugin 85 个 callback 去除注释/空白后的 token 与 Core 同组相同，剩余 6 个逐体核对。91 项行为全部有 Core 归属：90 项在 Core HnswVector 文件内，1 项串行 embedding fallback 在 Core EmbeddingPort.test.ts。未发现这份 Plugin 文件中的独有宿主断言。

本审查采用逐 describe 语义/断言与夹具检查，加 callback token 比对；不将静态比对称为测试通过，也不将整个 Core 文件标为新一轮逐行全文审核。没有改产品代码或测试、没有运行大套件、没有控制状态或线程记录。

## 导入和夹具证明

- Plugin 的生产代码导入全部为 @alembic/core/vector 与 @alembic/core/search；其他导入只有 node:fs/os/path。没有调用 Plugin 的 KnowledgeModule、VectorModule、ServiceContainer、McpServer 或宿主 provider。
- Core 对应文件直接导入 src/infrastructure/vector/* 与 src/service/search/HybridRetriever；Plugin 则测 package exports。Plugin package.json 为 file:../AlembicCore，node_modules/@alembic/core 指向该仓库；Core exports 的 vector/search 指向 dist/*.js。Vitest 的 alembic-dev condition 没有对应 Core 源码 override，因此这层 package 可解析性不能完全由 Core 源码单测替代。
- randomVector helper 完全一致：Math.random()-0.5 后 L2 归一化。每组 beforeEach/afterEach 的临时目录、destroy、rm 清理也均与 Core token 相同。Plugin 全局 setup 设置临时 ALEMBIC_HOME，是 runner 隔离，不是该文件的宿主功能断言。
- IndexingPipeline 测试自己创建 recipes/test.md，注入 Map-backed fake store 和本地 mock embed 函数；它们测试 Core pipeline，不测试 Plugin 的 provider 选择或容器装配。

## 逐 describe 覆盖

全部 21 组的算法/格式/存储行为归 Core 单源；Plugin 只保留下面的小型 package/host 接入保障。数量列是 Plugin/Core 测试声明数。

| describe | 数量 | 位置 | 实际断言覆盖 |
| --- | ---: | --- | --- |
| HnswIndex | 9 / 9 | `AlembicPlugin/test/unit/HnswVector.test.ts:81 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:82 @ c1f6d77` | 9个callback完全一致：add/search的首两ID及距离、单点/空索引、删除排除、同ID更新、序列化回读、500×32d自命中、stats、批量size。 |
| MinHeap | 1 / 1 | `AlembicPlugin/test/unit/HnswVector.test.ts:189 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:190 @ c1f6d77` | 同一入堆序列，逐次pop距离1/2/5/8和最终size=0。 |
| MaxHeap | 2 / 2 | `AlembicPlugin/test/unit/HnswVector.test.ts:205 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:206 @ c1f6d77` | pop最大8/5、peek=2；toSortedArray距离[1,2,3]。 |
| cosineDistance | 3 / 3 | `AlembicPlugin/test/unit/HnswVector.test.ts:231 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:232 @ c1f6d77` | 同向distance≈0、正交≈1、空数组和null返回1。 |
| ScalarQuantizer | 5 / 5 | `AlembicPlugin/test/unit/HnswVector.test.ts:249 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:250 @ c1f6d77` | train状态、Uint8Array/Float32Array类型、每维误差<0.1、量化距离、序列化、未训练报错、batch长度。 |
| BinaryPersistence | 5 / 6 | `AlembicPlugin/test/unit/HnswVector.test.ts:331 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:332 @ c1f6d77` | 文件存在/格式有效、dimension/node ID、metadata/content回读、quantizer维度、空索引、坏文件、图连接恢复。 |
| HnswVectorAdapter | 9 / 11 | `AlembicPlugin/test/unit/HnswVector.test.ts:439 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:467 @ c1f6d77` | upsert/search ID与分数、getById正文/元数据、remove/listIds、batch/query别名、hybrid、clear、stats、flush+initSync重启、metadata filter。 |
| VectorMigration | 4 / 4 | `AlembicPlugin/test/unit/HnswVector.test.ts:632 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:782 @ c1f6d77` | new/binary/migrated分类、JSON条目导入、.json.bak存在、needsMigration标志。 |
| BatchEmbedder | 3 / 2 | `AlembicPlugin/test/unit/HnswVector.test.ts:699 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:849 @ c1f6d77` | mock embed返回ID→向量Map、进度回调、null provider空Map；插件独有标题的serial fallback仅断言size=2。 |
| HybridRetriever | 5 / 7 | `AlembicPlugin/test/unit/HnswVector.test.ts:759 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:888 @ c1f6d77` | 双路ID与正分、单路顺序、topK、默认单路原始分数0.5/61及score=rrfScore。 |
| HNSW Recall Quality | 1 / 1 | `AlembicPlugin/test/unit/HnswVector.test.ts:855 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1035 @ c1f6d77` | 200个32d随机向量、10个随机query，以暴力cosine top10为真值，平均Recall@10>0.9。 |
| Chunker v2 | 8 / 8 | `AlembicPlugin/test/unit/HnswVector.test.ts:905 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1085 @ c1f6d77` | whole原文、Markdown sectionTitle、fixed totalChunks、空值、unknown语言fallback、useAST=false无nodeType。 |
| ASTChunker | 1 / 1 | `AlembicPlugin/test/unit/HnswVector.test.ts:995 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1175 @ c1f6d77` | JS/Python返回boolean、未知语言false。 |
| BinaryPersistence Validation | 4 / 4 | `AlembicPlugin/test/unit/HnswVector.test.ts:1006 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1186 @ c1f6d77` | 超大level可encode/decode且节点数/维度正确、garbage/不存在false、有效文件true。 |
| VectorMigration corruption handling | 5 / 5 | `AlembicPlugin/test/unit/HnswVector.test.ts:1055 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1235 @ c1f6d77` | 损坏.asvec+可用JSON→migrated且upserted ID、valid binary、empty new、needsMigration组合。 |
| IndexingPipeline v2 | 4 / 9 | `AlembicPlugin/test/unit/HnswVector.test.ts:1122 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1302 @ c1f6d77` | constructor可构造；真实临时recipes/test.md，Map-backed fake vector store；无provider不embed，有provider每item.vector固定[.1,.2,.3]，二次扫描skipped且upserted=0。 |
| HnswIndex randomLevel safety | 1 / 1 | `AlembicPlugin/test/unit/HnswVector.test.ts:1245 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1650 @ c1f6d77` | 插入100点完成，size=100，搜索结果1..5个。 |
| SQ8 2-pass search | 6 / 6 | `AlembicPlugin/test/unit/HnswVector.test.ts:1264 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1669 @ c1f6d77` | 带quantizer搜索结果数量/ID/距离区间、与exact搜索自命中、qvector类型/引用、serialize排除qvector。 |
| RRF hybridSearch | 5 / 5 | `AlembicPlugin/test/unit/HnswVector.test.ts:1432 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1837 @ c1f6d77` | 混合top1、dense-only、sparse-only、alpha0/1、score/vectorScore/keywordScore/item属性存在。 |
| AsyncPersistence | 6 / 9 | `AlembicPlugin/test/unit/HnswVector.test.ts:1526 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:1944 @ c1f6d77` | CRC稳定/8位、NDJSON+CRC格式、合法重放序列和pending、坏CRC跳过、flush确认并删WAL、disabled不落盘。 |
| HnswVectorAdapter WAL integration | 4 / 6 | `AlembicPlugin/test/unit/HnswVector.test.ts:1706 @ 11f8d47` · `AlembicCore/test/HnswVector.test.ts:2235 @ c1f6d77` | WAL开关文件存在性、重启后IDs/search恢复、remove后仅b。 |

## 六个非同体映射

1. Plugin BinaryPersistence:341 的 7 条 roundtrip 断言在 Core:342 全部保留，Core 另外检查普通 JSON 字节片段，并有 own __proto__ ID 的 save/saveAsync 回归。
2. Plugin BatchEmbedder:734 只有 results.size===2，_callCount 没有断言。[Core EmbeddingPort:122](../../../AlembicCore/test/EmbeddingPort.test.ts:122) 用真实 BatchEmbedder 入口触发 rejected batch→serial，断言完整两条向量结果，并检查诊断不包含文档内容；覆盖更强，无需搬一份同类测试。
3. Plugin Hybrid topK:822 仅检查 length=5；Core:1003 检查完整 [d0,s0,d1,s1,d2] 顺序，包含长度约束。
4. Plugin Hybrid raw-RRF:834 检查 score≈0.5/61 和 score===rrfScore。Core:921 已精确检查默认两条 score；Core:889 用 toStrictEqual 同时检查 score/rrfScore/贡献；Core:1015 保留范围与非归一化断言。不是缺失行为。
5. Plugin RRF hybrid shape:1512 的 score/vectorScore/keywordScore/item 四个属性在 Core:1917 保留；Core 另检查 sparse-only 的完整 payload、own undefined 和 k=0。
6. Plugin WAL recover:1584 与 Core:2002 的 setup、重放顺序、pending/WAL保留、成功flush后删除等 9 条断言语义相同，仅标题/注释调整。

## 覆盖边界（按断言，不按标题）

- Chunker overlap 用例只断言 firstEnd.length + secondStart.length > 0，没有比较重叠内容。
- Chunker auto AST 用例允许 AST 或 fixed fallback，只断言非空；真正 AST 初始化/产物由 Core 后增 pipeline fixture 负责。
- BinaryPersistence level>255 用例只检查能编码/解码、节点数/维度，没有断言 level==255。
- SQ8 restore qvectors 用例使用 quantize:none，重启后只检查 IDs 数量，不证明 qvector 恢复。
- 旧 WAL crash 用例实际调用 destroy()；当前 HNSW destroy 会做最后同步快照，故该用例不能独立证明 kill/crash 恢复。Core 新增的 snapshot失败保WAL与startup失败重试用例才覆盖相关故障边界。
- 以上都是现有覆盖限制，本次只标注，不扩大产品或测试修复范围。

## Plugin 最小保留集合

建议把原 91 个算法 case 收敛为 2 个 package 消费 smoke（可以合并到既有 package/向量集成文件）：

1. @alembic/core/vector：真实 HnswVectorAdapter 一条 upsert→flush→重开→读取，锁定 package 导出、调用契约及 payload；不重复量化、随机召回率、WAL CRC/故障矩阵。
2. @alembic/core/search：真实 HybridRetriever 一条带 metadata 的 dense fuse，检查 id/data.item/score/rrfContribution 的消费形态；不重复公式/极端参数矩阵。

保留这些已经存在的宿主接线保障；无需再把它们复制进 HnswVector.test.ts，也不因本次去重删除其他独有宿主测试：

- [KnowledgeModuleRuntimeRoot.test.ts](../../../AlembicPlugin/test/unit/KnowledgeModuleRuntimeRoot.test.ts:40)：真实KnowledgeModule.register+ServiceContainer.get(vectorStore)，验证excluded source root不产生.asd，重定向runtime root产生index并记录warning。
- [LocalEmbedding.test.ts](../../../AlembicPlugin/test/unit/LocalEmbedding.test.ts:266)：真实VectorModule factory装配：本地provider availability；offline仍通过EventBus knowledge:deleted调用注入的Recipe truth remover。
- [KnowledgeVectorMaintenanceWiring.test.ts](../../../AlembicPlugin/test/unit/KnowledgeVectorMaintenanceWiring.test.ts:19)：真实InfraModule.register获取KnowledgeSyncService，gate确认syncAll等待注入generation维护，检查完成报告。
- [ServiceContainerShutdown.test.ts](../../../AlembicPlugin/test/unit/ServiceContainerShutdown.test.ts:7)：真实McpServer.shutdown/ServiceContainer顺序：await vector service drain→store flush→store destroy→database shutdown。
- [RecipeVectorGenerationRuntime.test.ts](../../../AlembicPlugin/test/unit/RecipeVectorGenerationRuntime.test.ts:374)：真实host generation wrapper：已验证active路由、legacy隐藏、CAS、rollback、跨store删除与错误传播；此文件不属于HnswVector重复算法清理范围。

清理后的验证应先构建 Core 再运行 Plugin 的薄 package smoke 与现有对应宿主用例，使测试消费实际 dist。本文仅提供归属建议，未执行清理或验收。

## 根线程分组方案补充（基线固定）

本映射固定于 Core c1f6d7760a5fe0549420b72babea39b4f9c02e3d，后续移动不重新解释为覆盖丢失。原 21 组 callback/full describe token hash 与计划新文件见 `core-hnsw-describe-baseline.json`：6 组持久化迁入 VectorPersistence，4 组 pipeline 迁入 VectorPipeline，HybridRetriever 迁入 SearchRanking，其余 10 组留在 HnswVector。该记录只描述计划，尚不声明实际迁移已验证。

根线程决定将前述两个 package smoke 合并成真实 package→pipeline→持久化/重开→混检契约，继续保留既有 Setup/DI/generation 等宿主测试。该方向可覆盖原 Plugin 文件唯一的包消费增量价值；不需要保留 91 个底层算法副本。
