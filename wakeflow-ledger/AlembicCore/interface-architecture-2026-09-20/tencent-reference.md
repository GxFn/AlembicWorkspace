# TencentDB Agent Memory 接口接线参考

研究版本：`TencentDB-Agent-Memory` commit `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f`，origin 为 `https://github.com/TencentCloud/TencentDB-Agent-Memory.git`。仓库工作树干净，未发现仓库内 AGENTS.md。本次只读代码并写本记录；没有修改腾讯/Core 产品，没有安装依赖、启动服务或运行测试。以下是源码链路证据与可移植建议，不把 README 的设计描述当作已验收事实。

为简洁起见，以下 `MemoryCore/...` 与 `sdk/...` 路径均相对于腾讯仓库根目录。

## 一条完整的实际 tool → 业务 → storage 链

选择当前仓库中独立 OpenClaw 插件的 HTTP/SDK 路径。它与 `MemoryCore/index.ts` 内嵌 TdaiCore 的旧路径并存，不能把两条装配方式混称为同一个运行时。

下表选择 Gateway 已注入 per-instance resolver 的分支；没有该 resolver 时，同一路由使用 Core singleton（`v2-router.ts:373–382`），并非所有部署都经过 StorePool。

| 阶段 | 实际入口与输入 | 输出／状态变化 |
| --- | --- | --- |
| Tool 注册 | `MemoryCore/openclaw-plugin/index.ts:96` 注册 `tdai_memory_search`，execute 把 query/limit/type 传给 handleMemorySearch | 宿主 tool schema 与回调，不创建数据库 |
| Tool 适配 | `MemoryCore/openclaw-plugin/src/tools/memory-search.ts:12`；空 query 返回文本，否则调用 client.searchAtomic | 将 SDK 的 items 格式化为 content 文本与 count；错误转成宿主文本，不在此做 SQL/RRF |
| SDK 请求 | `sdk/memory-core/typescript/src/v3/client.ts:291` | POST `/v3/atomic/search`，组合固定 isolation、可选 session、query、limit、type/time；HTTP transport 校验 envelope 后取 data（`v3/http.ts:97`） |
| Gateway 路由 | `MemoryCore/src/gateway/server.ts:1029` → `v2-router.ts:471`；`DATAPLANE_HANDLERS` 的 atomic/search 同时挂载 v2/v3（`:413–440`） | 解析认证/请求体；不是 v3 另写一套 search 实现 |
| 请求资源绑定 | `v2-router.ts:563` 调 resolveStoreForRequest；`:568` 创建本次请求的 resolvedDeps，替换 getStore/getEmbedding/getStorage | 每次请求闭包绑定解析出的资源，不修改全局“当前实例” |
| StorePool 装配 | `server.ts:948` 先按 instanceId 解析 VDB config，再 `StorePool.getStore`；`core/store/store-pool.ts:171` | 命中刷新 lastAccessedAt；miss/config变化时创建实例、放入 pool 并调用 init；详见后文状态边界 |
| 业务 handler | `v2-router.ts:1192` 的 handleAtomicSearch 校验 body，生成 team/user/agent/task 搜索 filter | L1 跨 session，特意不传 sessionId；把 query/limit/type/filter 与本次 store、embedding 注入 executeMemorySearch |
| 召回编排 | `core/tools/memory-search.ts:87` | 依据能力选 nativeHybrid；否则并行 FTS 与 embedding/vector，映射命中、RRF 合并、业务过滤、截断，返回 `{results,total,strategy}` |
| SQLite 读取 | `core/store/sqlite.ts:1137` 的预编译 SQL 与 `:3149` 的 searchL1Fts | FTS MATCH + BM25 rank，从 content_original 取原始正文；过滤 isolation，再映射 L1FtsResult。向量路由在 `:1470` 取 KNN、查 metadata、过滤 orphan/isolation |
| 返回 | `v2-router.ts:1267` 投影 AtomicSearchHit，`:1278` 返回 successEnvelope `{items}`；SDK 解包，tool 格式化 | 不写 L1 事实内容。首次资源初始化可能建表；pool 访问时间、诊断/观测指标会变化。不能称整个请求链“完全无状态” |

内嵌路径同样真实存在：`MemoryCore/index.ts:283` 构造 OpenClawHostAdapter，`:294` 构造 TdaiCore，`:379` 注册 tool，`:423` 调 `core.searchMemories`；`src/core/tdai-core.ts:438` 再调用同一个 executeMemorySearch 并格式化结果。这条旧工具路径没有使用 StorePool。

## 六个可移植经验与不可照搬的边界

### 1. 用实际使用角色定义 port，并把能力选择放到编排层

`core/store/types.ts:577–620` 区分 L1/L0 普通读取、FTS、vector 与可选 nativeHybrid；`StoreCapabilities` 在 `:250` 明确 vectorSearch/ftsSearch/nativeHybridSearch/sparseVectors。并非只有声明：`core/tools/memory-search.ts:149` 实际检查 nativeHybridSearch 与方法存在性；`:197` 调 FTS；`:233` 调向量接口。输入是查询表达式/向量、候选数和 isolation filter，输出是带身份和原始内容的 typed rows。

适合 Alembic：接线层依赖所需的读取/召回/写入能力，结果 DTO 与能力状态明确；factory 负责选实现，业务不检查具体 class。继续利用已有的 EmbeddingPort、VectorIndexReader/Writer、KnowledgeTruthReader 等角色，而不是把多个门面拼成更大的总接口。

不宜照搬：IMemoryStore 同时继承 prompt/generation-ref port，并包含大量可选 profile、entity、audit 操作（`:551`、`:622`、`:677–707`）；整个 720 行接口不是“最小契约”的范例。其总原则允许错误返回空结果/false（`:12`），SQLite 搜索也确实吞错返回 `[]`（`sqlite.ts:3195`）；这不能替代 Alembic 对失败、降级与合法空结果的区别。

### 2. 在宿主边界归一化输入并绑定请求资源，业务保留结构化结果

真实例子是 `v2-router.ts:568` 的 resolvedDeps：认证确定 instanceId 后，把本次 store/embedding/storage 绑定为 getter，再送入 handler。不是让每个业务方法自己查配置池。独立插件 `handleMemorySearch` 只做空 query、SDK 调用和文本输出；旧内嵌 tool 在 `MemoryCore/index.ts:411` 归一化 query，并将 limit 限制到 1..20。

适合 Alembic：tool/MCP/CLI 的参数形状、显示文本与上下文身份留在宿主适配层；业务入口收到明确输入与已绑定 ports，输出可复用 DTO。一个 adapter 应能说明“翻译了什么、绑定了哪个资源”，纯无语义的多层转发则应评估收敛。

边界：腾讯不同入口并非完全一致。内嵌 TdaiCore.searchMemories 把格式化文本纳入 core 返回值（`tdai-core.ts:449`）；这不是把 tool 文案移入 AlembicCore 的依据。旧工具说明写“每轮最多3次”，源码 `MemoryCore/index.ts:377` 明确仍是待实现的硬限制；不能把描述文本当执行门禁。

### 3. 配置解析、实例构造、ready 屏障分别承担职责

`core/store/factory.ts:45` 接收已解析 config + dataDir/logger，返回 StoreBundle（store/embedding/bm25/storeSnapshot）；它没有调用 store.init。实际调用方在 `utils/pipeline-factory.ts:301`，随后 `:309` 等待 init(providerInfo)，检查 degraded，并处理 needsReindex。`initStores` 在 `:245–266` 缓存按 dataDir 的初始化 Promise，同目录并发调用共享一次初始化；`resetStores` 在 `:279` 负责解除绑定。不是一个未消费的工厂。

适合 Alembic：集中装配能确定配置来源，异步 ready 独立表达，实例复用由明确 owner 决定。配置解析不应反复散落在每个业务调用，也不应靠 bool 标志跨 await 猜测“已经可用”。

边界：该 Promise 缓存只按 dataDir，不含配置版本；_doInitStores 失败会返回 store/embedding undefined（`:350–358`），这个降级结果仍会被缓存。TdaiCore.initialize 在 `:249` 启动 storeReady 后不等待它完成；handleBeforeRecall/handleTurnCommitted 会等待，但 searchMemories 没有同样等待（`:375`、`:413`、`:438`）。不能把“有 initialize 方法”或“有 Promise 字段”概括为所有入口 ready 有保证。

另外，StorePool 又自行实现 createSqliteStore/createTcvdbStore，和 createStoreBundle 的构造代码有重叠（`store-pool.ts:340,372`）。两处 SQLite 分支的字段/空 embedding 表达并不完全相同：factory 返回时把可能 undefined 的 embedding 强转成必选接口（`factory.ts:126`），pool 则注入 Noop（`store-pool.ts:398`）。这提示 Alembic 应集中真实构造策略并诚实表达 optional/capability，而不是再复制一层 factory。

### 4. 资源池应绑定业务身份与配置身份，生命周期不等同普通值缓存

StorePool 是真实生产依赖：Gateway 在 `server.ts:1791` 创建它，在 `:948` 为请求解析资源，在 `:1289` 驱逐实例，在 `:805` 关闭全部资源。`getStore(instanceId, config)` 的状态转换可直接读到：同指纹命中→touch；配置变化→移除旧 entry；容量到限→LRU 淘汰；创建→pool.set→init（`store-pool.ts:171–220`）。共享 BM25 encoder 在 pool 构造时创建一次（`:126`），避免每个实例重复持有词典。

适合 Alembic：资源 key 必须与项目/数据根/配置身份一致；明确哪些资源可共享、谁负责释放，不能把连接或可变索引当作普通 LRU 返回值随意丢弃。接口接线层可把“已解析身份 + factories + disposer”作为同一所有者的职责。

边界：指纹实际只有 URL/database/API key（`:419`），不覆盖 user 与所有 embedding/timeout 配置；skill cache 甚至只按 instanceId 命中（`:304`）。memory pool 在 await init 前已放入缓存，不能从 getStore 的返回类型推导它有严格 ready 屏障。TCVDB 自身另有 `_initPromise/_ensureInit` 防御（`tcvdb.ts:287,304`），因此这里是职责/保证范围的限制，不据静态池代码直接宣称每个并发查询都会失败。

### 5. 先退出资源索引，再等待工作结束，最后关闭与清理缓存

`store-pool.ts:423` 的 closeEntry 先移除 pool entry，建立 pending close Promise；`:242` closeAll 收集当前 entries 并等待 pendingCloses。Gateway 先停止 worker/timer/state backend，再关闭 pools（`server.ts:784–805`）。单实例 TdaiCore 则等待 storeReady，停 scheduler，处理 bgTasks，关闭 store/embedding，最后 resetStores(dataDir)（`tdai-core.ts:295–362`）。这些 lifecycle 操作有真实调用方。

适合 Alembic：将对象从可获取索引中移除、等待在途操作、flush/close、撤销缓存绑定分清顺序；声明 borrowed/owned 资源，避免多个 facade 都以为自己拥有同一 store 的销毁权。

不宜照搬：StorePool 的30秒 grace是定时缓冲而非引用计数/lease（`:425–427`），Gateway 关闭时会设为0。TdaiCore 等待后台任务最多5秒，超时后仍关闭 store（`:323–340`）；Promise.race 并未取消任务。它不能作为 Alembic 文件/DB真相、WAL确认或可靠关闭的完成保证。StorePool.closeEntry 只关闭 store，没有对整个 PooledStore 的 embedding 逐项 close；不能泛化成完整资源包 disposer。

### 6. 兼容入口共享实现，但必须追踪实际调用，不能以 exports 或注释代替接线证明

正面例子：`v2-router.ts:413–441` 从一张 handler 表生成 v2/v3 路由，协议验证可区分，业务 handler 复用；`core/store/types.ts:720` 把 IEmbeddingService 作为 canonical EmbeddingService 的类型别名，避免维护第二份相同接口。

适合 Alembic：保留已被消费的包入口/旧名称，用显式转发维持兼容；整理目标应是重复实现、重复装配和隐式默认值，而不是仅因为名字或 exports 多就删除能力。接口是否值得保留，应能列出入口、输入、调用者和效果。

本检出反例：`core/store/search-utils.ts:38` 的 rrfMerge 没找到生产 import；memory-search.ts:62、conversation-search.ts:61 与 auto-recall.ts:727 仍各自融合，因此顶部“消除了3处重复”注释不成立。HostAdapter 三个 getter 被 TdaiCore 构造函数实际消费（`tdai-core.ts:224–229`）；但 buildRuntimeContextForRequest/buildRuntimeContextForSession 以及 OpenClaw 的 legacy getter，在本次全 MemoryCore TypeScript 检索里只找到定义/注释，不能宣称它们承载现行请求接线。

## 迁移到 Alembic 时的明确边界

- 腾讯的 MemoryCore 并不等于 AlembicCore 的纯 headless 范围：`tdai-core.ts:54` 直接导入 StandaloneLLMRunner/Factory；StorePool 构造会初始化 Kafka metrics（`:129`），并读取厂商连接/凭据。可借其依赖方向与生命周期职责，不把这些 provider、工具策略、HTTP/SDK 或观测运行时搬入 Core。
- 原有 `StoreCapabilities` 同时与 `isFtsAvailable()`、embedding 对象存在性一起被使用，不能把它称为已经统一的唯一能力判定接口。
- SQLite 搜索的固定倍数预取、后置隔离过滤及吞错空数组是该实现的语义；不应用它们替换 Alembic 已有的候选预算、真相投影、region 聚合、排序/降级合同。
- 当前 tracked 测试检索仅发现 ensure-hook-policy.test.ts；另有 metadata-store.contract.ts 但未见调用者。本次不以这些声明证明 StorePool 并发/关闭或多后端契约已被充分验证，也没有运行这些系统。

建议优先级：先列出现有 Alembic 接线模块实际完成的翻译、身份绑定和资源所有权，再收敛重复装配/同义接口；保留兼容门面和业务确定性结果。以上是研究输入，不构成新增公共 API、删除现有能力或迁移宿主职责的授权。
