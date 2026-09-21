# 搜索职责审查、来源与整理映射

起点 8ab3783；工作跨 2026-09-19 / 2026-09-20。用户授权继续逐文件 review、职责分层、接口/验证/测试整理，并自主控制提交。范围以搜索内核、实际仓储生产方、消费测试为主，不冒充重新全文审完所有其他模块。

## 一手资料与落地

- [Tencent IMemoryStore](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/MemoryCore/src/core/store/types.ts)：普通读取、FTS/vector/native hybrid 召回分开定义。借鉴这种边界，将存储列选择与 Recipe 文档投影分别交给 repository 和 service。保留原始正文和 canonical 角色，不用检索加工替换事实。
- [Tencent search-utils](https://github.com/TencentCloud/TencentDB-Agent-Memory/blob/06414ac10766b9bd61e4a69f3cf0ea414afb6d4f/MemoryCore/src/core/store/search-utils.ts)：提炼融合数学的组织意图有参考价值，但本检出三个调用入口仍自行融合，helper 未接线。不能仅因存在 helper 就声称整合完成。本轮 Engine 分组实际调用公共 groupByKind，两个 dense 来源实际调用共用后处理。
- [Vespa hybrid search](https://docs.vespa.ai/en/learn/tutorials/hybrid-search)：明确区分召回与排名。本轮保留 canonical truth/budget、旧 weighted RRF、粗排/精排/会话加成的不同语义，只合并实际同义步骤。
- [SQLite LIKE/ESCAPE](https://www.sqlite.org/lang_expr.html#like)：确认显式 ESCAPE 的匹配语义。真实 Core producer 使用已转义 pattern，正式仓储遗漏 ESCAPE 而 raw 端有，导致包含下划线等的模式漏命中；已对齐参数绑定查询。
- [SQLite query planning](https://www.sqlite.org/queryplanner.html)：查询条件、选列与索引有各自职责。本轮只集中投影和移除重复 schema 读取，没有凭经验新加索引，也未声称测得整体吞吐提升。

Tencent 本地检出固定 06414ac10766b9bd61e4a69f3cf0ea414afb6d4f，只读审查 types、search-utils、bm25-local、sqlite 搜索段、factory 及必要消费链。其 provider/API key 构造、异常吞为空数组、固定倍数取窗、未接线 RRF helper 没有照搬。

## 文件职责设计

见产品文档 docs/search-architecture.md。逐文件记录（含实际阅读范围、最终摘要和 digest）见 file-review.json：

- 排名五文件本轮全文读取；词法、不同衰减、质量/上下文公式保持独立。
- SearchEngine/SearchTypes/HybridRetriever/KnowledgeRetrieval/两个 facade 和旧 search-wire 在复用先前全文审查基础上，本轮核对消费、职责和差异；新 projection helpers 全文审查。
- KnowledgeRepositoryImpl 本轮聚焦四个搜索读取方法，不声称重读无关 CRUD；SearchRepoAdapter 全文核对。
- 原始 DocMeta/DbRow、旧 wire 的 finalScore 及现代 score 不是可直接互换的 DTO；保留接口和符号，不做纯搬文件或扩大公共导出。

## 清理与行为变化

1. 删除 MultiSignalRanker 没有读取方的实时 Map/Set、回调和两个订阅。signalBus 选项仍接收；SearchEngine 仍发 search 信号。listenerCount 减少是实际诊断变化，评分没有依赖这些状态。
2. updateDocument 委托 addDocument 的既有 upsert，去除重复 remove 检查。保留 DF/topicDF、tombstone、压缩、avgLength、公开 documents 与旧权重转译。
3. full/refresh 共用 27 字段投影，raw schema 从 11 次 PRAGMA 降到一次快照；11 项旧默认值和现存 NULL 语义不变，必需列缺失仍报错。
4. 文档 text/meta 共用一次 canonical document set 与 sparse projection；新增内部 SearchDocumentProjection，旧 _buildDocText/_buildDocMeta 保留转发。独立新旧比较覆盖 6 组普通/native/坏 JSON/共同拒绝输入。
5. VectorService 与直接 vectorStore 来源保留分数/空值适配，共用映射及 dedup → live lookup → filters → slice。原空 lane 与 orphan-only 的差异不变；独立比较 12 组正常、零 similarity、空、孤儿、truth failure、lane failure 返回。
6. 修复继承属性被误当配置项：未知场景变零分、难度 NaN、语言抛错、JSON own __proto__ 配置丢失。采用无原型私有字典，不新增校验层；正常/default/seasonality 和浅覆盖逻辑不变。
7. 正式详情投影漏 kind/knowledgeType，向量 metadata 缺少 knowledgeType 时 advertised facet 丢命中。真实两来源×两适配器先 RED 后 GREEN；原 20 个字段、nullable 和查询边界保留。
8. SearchEngine 的分组循环与公共 groupByKind 重复且都会误读继承属性。Engine 改用共享实现，固定三种输出 bucket；unknown kind 回落 pattern，保留普通对象、原 item 引用和组内顺序。

## 测试整理映射

| 原位置/重复 | 保留与替代 |
| --- | --- |
| Engine 内 tokenizer、FieldWeightedScorer 基础单元 | 迁到现有 SearchRanking 算法套件，去掉对完整 Engine 的纯算法导入；Engine 留仓储与调用链验证 |
| add duplicate + update replacement | 按两个公开 upsert 入口参数化，保留计数/旧词消失/新词命中 |
| remove 数量 / DF / tombstone / membership | 合并同一状态迁移断言；topicDF、compact、avgLength、clear 独有覆盖保留 |
| 初始空索引 + 添加计数 | 合为一个连续状态用例 |
| 三段 camelCase 样板 | 参数化三例，仍执行三个案例 |
| seasonality 只看正分 | 改成与等价 contextMatch 配置完整结果一致 |
| 空结果 groupByKind 只看属性存在 | 改为公共 helper 与真实 SQLite/Engine 分组，覆盖正常/未知/原型属性及组内顺序 |

没有删除 canonical retrieval、真相、预算或边界门禁。新增回归集中在现有文件，未为 private helper 单独建立镜像测试。

## 证据说明

- baseline-search 的旧 PublicSearchEntrypoints 文件名未匹配，实际只有 7 套件；随后以正确 PublicSearchVectorGuardEntrypoints 补跑 3 例。
- 初版 LIKE 用例误以 keyword 模式只有 SQL，实际还合并 sparse 召回。该失败不算 SQL 缺陷证据；改在真实 keywordSearchSync port 验证，并恢复旧 LIKE 实现取得有效 RED，再修复。
- 首版单次投影探针漏填 createdAt，NOT NULL 失败不是优化证据；修正 fixture 后，用 HEAD 的旧 Engine 实现重放得到真实 4 次 vs 期望 2 次 RED，随后恢复当前改动并 GREEN。临时源码替换用 finally 恢复。
- green-search-orchestration 中旧 SlimSearchResultDrift 根路径未匹配；实际文件 test/unit/SlimSearchResultDrift.test.ts 已在后续相关测试与最终全量包含。
- 最后完整 check 后只补一条组内顺序断言及文档/注释说明；该断言另行定向验证，未更动执行逻辑。
