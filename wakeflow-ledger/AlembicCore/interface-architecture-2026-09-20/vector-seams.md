# Vector 接口与实际消费边界

日期：2026-09-20。读取基线：Core `4a0b277`、Plugin `e0deb9a`、Main `4dc86fb`。本文只记录仓库事实与方案建议；没有修改产品、测试、宿主或控制状态，没有运行测试/构建，也没有把方案当成实施决定。路径均相对 workspace。行业资料和腾讯项目研究由主审另行汇总，本文不作其证据。

## 结论

优先收窄 Core region 同步和检查函数实际需要的存储方法，再简化内部 `LifecycleVectorStoreBridge`。这是有明确调用方、可保留所有行为的局部切片。

`VectorIndexReader/Writer` 应保留能力隔离；`VectorService` 是带 embedding、查询降级、CRUD 同步和维护的业务门面；Plugin 的 snapshot reader 隔离持久化生命周期。三者不能因都有 `search/getById` 就合成一个“大 VectorService”。Main/Plugin generation routing 也不是纯转发，它决定读到哪一代、旧条目是否可见和删除范围。

上一轮的 Plugin 重复读取已在本基线消除：`read-only-search-executor.ts:180–188` 直接构造 reader 并捕获加载失败，不再先调用 `isValid`。不能把旧 P3 当作当前待办。

## 实际调用链

### Main 常驻容器

1. `Alembic/lib/injection/modules/KnowledgeModule.ts:147–198` 注册 base store、generation storage/manager/runtime，最终 `vectorStore` 是 `GenerationRoutingVectorStore`；generation store 复用同一个配置工厂。
2. `KnowledgeModule.ts:420–460` 按配置构造 Core HNSW/JSON 并 `initSync`，HNSW 失败降级 JSON；传入 M、efConstruct、efSearch、quantize、quantizeThreshold、flush 参数与 WriteZone。
3. `KnowledgeModule.ts:200–225` 把 routed store 交给 `IndexingPipeline` 与 `HybridRetriever`；`VectorModule.ts:43–71` 同样把它交给 Core `VectorService`，同时注入 provider、eventBus、generation manager 和跨代 truth remover。
4. `ServiceContainer.ts:148–152` 初始化 VectorService，再绑定知识变化与 keyword 刷新。`KnowledgeModule.ts:124–141` 构造的 SearchEngine 使用 `vectorService` 和 routed store；auto 路径是 weighted confidence gate 后的旧 hybrid 路由。
5. 真实写/维护消费者包括 `Alembic/lib/tools/adapters/DashboardOperations.ts:155–169` 的 clear/fullBuild，以及 `Alembic/lib/cli/SetupService.ts:759–781` 的 stats/fullBuild。它们需要的能力超出 reader。

### Plugin 可写容器

1. `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:185–275` 构造 Core HNSW/JSON，再包装 Plugin generation runtime；base 后端可配置，generation 后端固定 JSON（`lib/recipe-pipeline/vector/recipe-vector-generation-runtime.ts:37–51,189–203`）。
2. `KnowledgeModule.ts:238–256` 将 routed store 交给 pipeline/hybrid；`VectorModule.ts:48–80` 将同一 store 交给 VectorService。Plugin 不创建 AI contextual enricher，embedding 来自本地 lane 选择；`VectorModule.ts:108–114` 先等待选择，再创建和初始化 service。
3. `KnowledgeModule.ts:166–181` 的 SearchEngine 使用 VectorService，legacy `aiProvider` 为 null。`KnowledgeModule.ts:307–320` 将 service 注入 RecipeFreshnessService；`lib/host-runtime/mcp/handlers/recipe-map.ts:728–739` 将其交给 Core RecipeContext adapter；`host/staging-access-sweep.ts:203–207` 调用 reconcileIndex。
4. `ServiceContainer.ts:342–359` 显式先等待 VectorService.destroy 排空同步，再 flush/destroy store。Core `VectorService.ts:817–822` 只销毁自己创建的 coordinator，不销毁借入的 store。

### Plugin 公共 Search 请求

1. `lib/host-runtime/mcp/host/read-only-search-executor.ts:42–90` 从 route 创建请求快照、以 SQLite readonly/query_only 打开，再在 finally 关闭连接和删除副本。它不使用前面的可写 DI 容器。
2. `read-only-search-snapshot.ts:45–52,72–142` 在源文件指纹稳定的情况下复制数据库家族与向量文件；legacy 向量读的是 `.asvec` 副本，不接入可写 adapter 的 WAL replay。
3. legacy：`read-only-search-executor.ts:180–200` 构造 `ReadOnlyHnswVectorReader`，坏/缺失快照降级为无 dense lane。strict：`:162–178` 构造 `ReadOnlyJsonVectorReader`，校验精确 ID 集合并解析匹配 provider；错误保留 strict publication 契约。
4. `:104–127` 装配 `reader + EmbeddingPort + weighted sparse SearchEngine → HybridCandidateRetriever → KnowledgeTruthProjector → KnowledgeRetrievalPolicy → 对外 SearchEngine`。`:129–148` 的受限容器只暴露 knowledgeService、knowledgeRetrievalPort、searchEngine。
5. Core `KnowledgeRetrieval.ts:188–225` 分别收集 dense/sparse 并隔离单 lane 失败；`:335–387` 从权威知识行过滤孤儿/废弃项、归并 region 后重建 live ranks；`:446–524` 用 32 初始窗口、256 默认预算及稳定性条件补召回。它不是对 VectorService.hybridSearch 的简单改名。

## 每层的真实职责

| 层 | 能力 / 数据 / 所有权 | 合并判断 |
| --- | --- | --- |
| `AlembicCore/src/service/vector/VectorIndexPorts.ts:19–34` | reader 的 search/getById/stats/listIds 与 writer 的 upsert/batch/remove/clear；没有 embedding、init、destroy 或持久化格式。 | 保留两个能力面；只读消费者不能因此拿到写入/迁移能力。 |
| 同文件 `:36–111` 的 Source、adapter、factory | Source 适配既有 store；reader adapter 的三个方法纯转发，listIds 增加 limit 裁切；writer 四方法纯转发。包装隐藏另一侧方法，但不拥有底层 store。 | 可简化局部类型重复；不能删除公共入口或将 reader 改为直接返回完整 store。 |
| `AlembicCore/src/infrastructure/vector/VectorStore.ts:8–94` | 旧聚合契约，含 init、读写、searchByFilter、默认 batch 并发与 destroy。 | 对常驻后端/路由仍有真实消费者。不能全局缩成 reader，也不能为满足它而暴露 snapshot 写接口。 |
| `AlembicCore/src/service/vector/VectorService.ts:139–183,348–510,728–823` | 注入 embedding、创建事件 coordinator、构建维护、查询降级/熔断和统计投影；借入 store。 | 不是薄 wrapper；可在内部复用确定性算法，先保留外层调用和生命周期。 |
| `AlembicCore/src/service/vector/SyncCoordinator.ts:72–97` | 将分离 reader/writer 四方法拼成旧 VectorStore，继承的其他方法只剩未实现默认值。 | 优先简化对象组合和依赖范围；见下方有界切片。 |
| Main/Plugin generation routing | active generation 选择、旧向量隐藏、写入路由、合并与去重、终态全代清理。 | 必须保留策略边界；两端默认后端、无 active 的写入行为、验证和去重不同。 |
| Plugin HNSW / strict JSON reader | 从副本加载一次；仅内存查询，不创建迁移、WAL、flush timer、全局路径策略或 CRUD 监听。 | 保留生命周期隔离；可以复用数据计算，但不能改用完整可写 adapter 初始化。 |
| KnowledgeTruthProjector / Policy | raw vector item → canonical Recipe、孤儿/废弃过滤、region 聚合、权威排名与补召回预算。 | 必须保留数据投影与排名职责，不能放进通用向量 reader。 |

说明：runtime 搜索显示 Main/Plugin 正式装配没有调用 `createVectorIndexPorts` 或两个 adapter 构造器；coordinator 的常驻入口仍由 VectorService 传 `vectorStore`，独立 reader/writer 分支有 Core 行为测试。**这不等于可删公共 API**：`AlembicCore/src/index.ts:63 → service/index.ts:10 → service/vector/index.ts:5` 以及 `AlembicCore/src/vector.ts:94–106` 都公开这些类型/类/factory。

## 查询、过滤、阈值差异矩阵

| 项目 | Core HNSW store | Core JSON store | Plugin legacy HNSW reader | Plugin strict JSON reader |
| --- | --- | --- | --- | --- |
| 实际宿主 | 两端配置工厂的 base；Main generation 也可用 | 两端 fallback；Plugin generation 固定使用 | 公共 Search 非 strict snapshot | 公共 Search strict publication |
| 查询输入 | 向量；空向量返回 []；不先验证维度，底层 cosine 使用较短长度 | 向量；空向量 []；shared cosine 维度不等返回 0 | 空向量 []；非空维度不等抛 Error | 维度不等抛带 code 的 StrictPublicationError |
| 候选数量 | 无 filter 为 topK；有 filter 为 3×topK，不足且图更大时重试全图 | 先筛 metadata，再对全部带向量项计分 | 无 filter 为 topK；有 filter 直接请求图 size | 全部已验证 JSON items，先筛 metadata |
| 结果排序 | 继承 HnswIndex 距离顺序，无额外 ID tie-break | 分数降序，同分保留现有遍历顺序 | score 降序，再按 ID localeCompare | score 降序，再按 ID localeCompare |
| topK | 默认 10；不做正整数归一化 | 默认 10；不做正整数归一化 | 非正整数/非数字回默认 10 | 同 legacy reader |
| 分数 / minScore | `1-dist`；默认门槛 0 | shared cosine；默认门槛 0 | `1-dist`；数值 minScore，否则 0 | 本地 cosine 实现；数值 minScore，否则 0 |
| metadata filter | 固定 10 个标量键；sourcePath 子串；tags 数组 any；deprecated=false 排除 truthy | 与 Core HNSW 共用 helper | 相同 10 键语义，但 sourcePath 有显式字符串 guard；未知键忽略 | 遍历所有 filter 键按标量/数组相交匹配，未知键也参与；sourcePath 精确值，不是子串 |
| 量化 | config none/auto/sq8；查询需训练且 size > 配置阈值（默认 3000）；none 禁止恢复；无效旧模型丢弃 | 无 | 恢复快照模型并建 qvectors；训练且 size > **固定 3000** 才用于两阶段；不读取运行配置 none/自定义 threshold | 无 |
| 初始化/写盘 | init 可迁移、WAL replay；写入触发刷盘，destroy 清理并保存 | init 读 JSON；CRUD 自动保存 | constructor 只 load/decode/建内存图；dispose 无存储动作 | constructor 校验 manifest 指定 dimension、条目 shape 和重复 ID；无写方法 |

具体证据：`AlembicCore/src/infrastructure/vector/HnswVectorAdapter.ts:488–564,930–1002`；`AlembicCore/src/infrastructure/vector/HnswIndex.ts:391–445,728–746`；`AlembicCore/src/infrastructure/vector/JsonVectorAdapter.ts:100–128`；`AlembicCore/src/shared/similarity.ts:94–107`；Plugin `read-only-hnsw-vector-reader.ts:31–101,134–195`、`read-only-json-vector-reader.ts:17–125`。

过滤函数不能直接统一的具体例子（静态行为推导，本轮未运行 probe）：

- `sourcePath: 'src/'`：Core/legacy HNSW 做子串包含；strict JSON 做精确值匹配。
- `scope: 'project'`：Core/legacy HNSW helper 不处理 scope；strict JSON 会处理。最终 Recipe 过滤仍可能在 truth projection 中执行，不能混淆两个层次。
- `deprecated: false`：Core/legacy 接受缺省字段；strict JSON 要求实际值匹配 false。
- `tags: 'x'`：Core/legacy 仅处理数组形式 tags；strict JSON 可以用标量匹配 metadata 数组。
- 非字符串 metadata.sourcePath：Core 类型断言不会做运行时转换，可能调用失败；legacy reader 显式返回不匹配。局部复用时必须保留这项边界，不能声称现有两个函数完全等价。

## 数据投影与路由差异

| 面 | 已观察到的差异 / 证据 |
| --- | --- |
| `getById` 可见性 | Core HNSW 要有 metadata 或 contents；snapshot HNSW 还允许只有 ANN node。二者都可单点返回 keyword-only 数据。`HnswVectorAdapter.ts:465–478`；Plugin reader `:45–51`。 |
| `listIds` | Core HNSW 列 metadata keys，JSON 列全部 item keys，均保持 Map 顺序；snapshot HNSW 只列 ANN IDs 并按 ID 排序；strict JSON 列所有已验证 IDs 并排序。reader adapter 仅裁切，不统一集合或顺序。 |
| `getStats` | Core HNSW count=metadata 数、indexSize=0，另有 hasVectors；Core JSON indexSize=磁盘字节；snapshot 两 reader 的 indexSize=内存节点/条目数。`VectorService.getStats:738–748` 是兼容投影，不把单位差异自动统一。 |
| Main generation | `RecipeVectorGenerationRuntime.ts:472–488` 在无 verified active 时拒绝 region 写入；`:591–608` 检查 ready/manifestHash；`:784–785` 先按分数排序再 Map 覆盖去重。 |
| Plugin generation | `recipe-vector-generation-runtime.ts:227–240` 无 active 时 region 可写回 base；`:353–355` 按 active route 打开；`:534–552` 对同 ID 保留最高分后排序。这里不宣称两端路由等价，也不据此扩大为本轮修复。 |
| generation 清空/终态 | 两端 clear 都只清 base，active generation 要走替换；Recipe 终态删除由 storage-owned truth remover 覆盖 base 与全部 generation。此职责不能用“当前 reader 可见 ID + writer.remove”替代。 |
| Search facade 投影 | 普通 DI 的 SearchEngine 从 VectorService item/score 归并当前 Recipe；snapshot policy 先投影权威行、再重建 live ranks，并通过预算补召回。`AlembicCore/src/service/search/SearchEngine.ts:309–399,832–876` 与 `KnowledgeRetrieval.ts:335–387,451–524`。 |

## 建议的有界整合顺序

### 1. 首选：去掉内部不必要的完整 VectorStore 继承

范围只需 Core：`SyncCoordinator.ts`、`RecipeRegionVectorIndex.ts`、`RecipeVectorGeneration.ts`。

- `syncRecipeSemanticRegionVectors:449–618` 实际只读 `listIds/getById`、写 `batchUpsert/remove`；把依赖表达为这些方法的结构类型。
- `inspectRecipeVectorGeneration:398–423` 实际只用 `listIds/getById`；收窄对应依赖。
- `SyncCoordinator.ts:72–97` 的桥接类可换成四方法组合，不再继承一组会抛 Not implemented 的无关方法。保留 this 绑定，不直接摘取 `reader.listIds` 或 `writer.batchUpsert` 裸方法。
- 保留 `config.vectorStore ?? 分离 ports 组合` 的现有优先级：同时传 aggregate 与 ports 时，不能顺手改变 region 路由。保留 `RecipeVectorTruthRemover`、所有公开配置名、SyncCoordinator 兼容类和输出 DTO。
- 预期收益：用四方法组合替代 26 行完整继承桥接类，region 依赖可直接看出读写范围；不涉及排序、阈值、磁盘版本或外仓接线。增加方法集类型后是否净减、净减多少，以实施 diff 确认。
- 既有验证位置：`AlembicCore/test/SyncCoordinator.test.ts:93–121` 分离 ports 删除行为；`RecipeRegionVectorIndex.test.ts` 持久化读回与替换失败保护；`RecipeVectorGeneration.test.ts` 检查与生成。实施时补有状态 this 的真实 port 调用和 aggregate/ports 优先级对照，不能只断言 helper 存在。

### 2. 次选：复用 legacy HNSW 的 metadata 匹配规则

Core HNSW/JSON 已共享 `VectorMetadataFilter.ts`。Plugin legacy reader 的固定键、array-any、tags、deprecated 大段重复可复用该能力，留下宿主的 sourcePath 类型保护；strict JSON 的“所有键精确匹配”继续独立。

helper 目前经 `AlembicCore/src/index.ts:60 → infrastructure/index.ts:8 → infrastructure/vector/index.ts` 根入口公开，**未在 `/vector` facade 显式转发**。因此不是零消费者私有文件；可用已有根入口研究最小接线，不必新增第二套 schema 或磁盘字段。是否补 `/vector` 转发由公共入口预算与主审决定。

这个切片需 Main/Core/Plugin 的 filter 对照输入固定下来，保留上表差异；不能同时把全图候选、3×扩窗、排序 tie-break、topK 归一化或量化阈值统一。当前只有研究建议，未授权实施。

### 暂不做的合并

- 不以完整 HnswVectorAdapter 替换请求 reader：会引入初始化、迁移、WAL、flush/destroy 和路径策略所有权。
- 不把 strict JSON reader 合到 JsonVectorAdapter：strict shape/ID/provider/dimension 错误和通用文件存储的容错/写入语义不同。
- 不直接用 HybridCandidateRetriever 替换 VectorService.hybridSearch：前者隔离 lane 失败、支持 abort/candidate session/补召回；后者保留 legacy confidence/RRF 消费、配置 alpha、旧诊断字段和熔断状态。先做消费者行为迁移设计。
- 不因 `VectorIndexWriterSource` 与 Writer 字段相同就删掉公开类型；可以在保留命名接口的前提下研究继承复用。收益很小，不优先引入跨层类型依赖。
- 不直接统一两端 generation router：上表记录了 active 验证、fallback、后端、排序去重和终态删除差异。

## 测试归属与本次阅读限制

已读 Core `VectorIndexPorts.test.ts` 全文、SyncCoordinator 分离 ports 用例；Plugin `ReadOnlySearchFingerprint.test.ts:109–176` 与 `StrictPublicationErrorTransport.test.ts:246–285` 的相关用例。前者真实验证 snapshot 只读容器不暴露 pipeline/vectorService/vectorStore/writer/coordinator，并验证只读文件单次读取；后者锁定严格错误 code。它们不应被纯转发样板清理吞掉。

其余测试只定位名称/范围，没有运行或宣称覆盖已通过：Core `VectorService.test.ts`、`KnowledgeRetrievalPolicy.test.ts`、`RecipeRegionVectorIndex.test.ts`、`RecipeVectorGeneration.test.ts`；两端 generation runtime 测试；Plugin 的 VectorService/SyncCoordinator 测试也直接导入 Core，未来可以评估重复行为归属，但本次未逐条映射，不建议立即删除。

源码全文读取：VectorIndexPorts、VectorStore、Core VectorMetadataFilter、两种 Plugin snapshot reader、read-only executor。其余为本报告列出的构造、查询、过滤、路由、生命周期和调用点追踪，未声称整个 VectorService/HNSW/两宿主容器都再次全文审查。

没有产品改动，因此不需产品构建；文档完成后执行 `git diff --check`，不产生提交（只读研究文档，由主审统一处理）。
