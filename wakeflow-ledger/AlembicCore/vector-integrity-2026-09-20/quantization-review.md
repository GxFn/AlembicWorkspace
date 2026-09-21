# 量化链审查与有界修复输入

Gate conclusion: 本轮为用户直接授权的 Core 审查/修复，不是 Wakeflow delivery。目标是保留既有量化策略和 ASVEC/WAL 格式，修复两个已复现的恢复边界；当前无额外授权阻塞。只修改 HnswVectorAdapter.ts 与 test/HnswVector.test.ts，BinaryPersistence 由另一位实现者负责，未授权提交。

基线：Core `9e8d033ac4dbab4e3555d243fc711269b48eeab9`。本记录使用仓库相对路径。

## 消费方与责任边界

- Core `src/vector.ts` 公开 HnswVectorAdapter、HnswIndex、ScalarQuantizer；普通宿主通过 adapter/VectorIndexReader 使用检索。
- Alembic 与 AlembicPlugin 的 `lib/injection/modules/KnowledgeModule.ts` 都创建 HnswVectorAdapter 并透传 quantize/quantizeThreshold。
- Plugin `lib/host-runtime/mcp/host/read-only-hnsw-vector-reader.ts:31` 直接读取 BinaryPersistence、反序列化 index/quantizer 并重建 qvectors，供 `read-only-search-executor.ts` 读取快照。此宿主实现不在本次修改范围。
- 基线中的训练函数实际为 `HnswVectorAdapter.#maybeTrainQuantizer`，没有 #ensureQuantization。单条写每 500 pendingOps 检查，批量写末尾检查；至少 100 个活跃向量；auto 有阈值，none 跳过训练。检索当前以 trained && index.size > threshold 决定二阶段搜索。
- qvector 不序列化是既有设计：持久化原始 Float32 向量和量化 min/max，恢复时调用 setQuantizedVectors。保留该格式与策略，不因本次审查引入新 ANN 调参/重训练规则。

## 已确认问题及正向控制

可复现脚本：`quantization-probe.mjs`，固定从 git 基线加载源码到内存，不受后续修复影响。结果：`quantization-probe-result.json`。两种初始化入口 init/initSync 都运行同一 128 个确定性 4 维 Float32 单位向量夹具，quantize=sq8、threshold=64、WAL关闭；Math.random 固定种子，临时目录清理。prototype 观察包装保留原函数返回值。

1. **P2：quantize:none 重开仍执行 SQ8。** 正常训练/flush 后，以 none 新建 adapter 读取同一快照；stats.quantized=true，查询调用 ScalarQuantizer.distance 69 次。根因是恢复无视 none，搜索也只检查 trained/size。修复归 Adapter：恢复时尊重运行配置，避免把禁用的量化模型作为活跃搜索模型；不修改 ANN 阈值/距离公式。
2. **P1：删除至空的快照恢复出 0 维 trained 模型。** 训练→逐条 remove 全部→flush 导出 dimension=0，但 BinaryPersistence 仍写 HAS_QUANTIZER；恢复得到 `{dimension:0,mins:[],maxs:[]}` 并标 trained。重新写入 128 个 4 维向量后，训练因 trained 早停，408 次粗排距离全部 NaN。6 个自查询仅 1 个返回自身、1 个无结果；同种子/向量的 none 对照 6/6 自命中。

正常量化快照是正向控制：重开后 128 个 qvector 字节完全一致，top5 顺序相同，实际执行了 69 次 SQ8 距离。不存在依据本探针将全部量化恢复判为失效的理由。

最小分工：BinaryPersistence 不给空维度写量化 flag/section（由另一实现者负责）；Adapter 对历史 0 维或维度不一致的模型诊断后忽略，保留 index/metadata/contents，允许后续沿原训练时机重建。不能要求 metadata/contents 的 key 与 ANN nodes 完全一致，keyword-only 条目必须保留。已与持久化审查者对齐，不重复其独立的文件结构与写入故障发现。

## 执行顺序与验证映射

1. 运行现有 ScalarQuantizer 与 SQ8 分组作为 baseline。
2. 在现有 HnswVector.test.ts 添加真实已训练快照 none 重开回归，捕获 RED；修复 Adapter 两种恢复入口的配置分支，验证 GREEN。
3. 添加删除至空→重开→再填入回归及历史 0 维模型恢复夹具，捕获 RED；补充恢复模型维度边界，验证 GREEN。该历史夹具不能被新 Binary encoder 的修复掩盖。
4. 将旧 quantize:none、仅断言20个ID的“restore qvectors”用例替换为真实 SQ8 训练/保存/重开，断言 qvector 字节和检索排序，固定随机性。
5. 必要分组联跑、类型/格式检查、自审；不跑全量，不提交。日志通过提供的 run-check.py 写入本 ledger，label 使用 quantization- 前缀。

结果与修改状态将在实现后追加。当前材料是审查输入，不是根线程验收。

## 实现与自审（待根线程独立复核）

实际修改为 HnswVectorAdapter.ts、test/HnswVector.test.ts，以及根线程追加授权的 ScalarQuantizer.ts 头部注释。没有修改 HnswIndex、BinaryPersistence、WAL格式、公共exports或外层仓库；未提交，按根线程要求统一提交。

- quantization-red-none：2例RED，错误调用SQ8 69次；quantization-green-none：相同2例GREEN。
- quantization-red-empty：init/initSync × 当前删除至空/历史旧字节4例在NaN断言RED；quantization-green-empty：相同4例GREEN。
- 根线程追加单次快照读取范围：quantization-red-single-read的2例均读2次而失败；#restoreSnapshot后quantization-green-single-read均只读1次。WAL恢复后的flush未放入catch，保持写盘错误传播。
- 原quantize:none、仅断言20个ID的弱restore用例已替换为2个真正SQ8恢复case：128个4d编码字节一致、原始向量精排的top5 ID/score一致且实际调用SQ8距离。
- quantization-green-related：25项必要测试通过，包含两种初始化、Scalar/SQ8及原WAL写盘失败/恢复/迁移回归；没有跑全量。
- quantization-types：Core noEmit通过；quantization-fixture-types：新增describe静态诊断0；quantization-final-lint与quantization-final-diff通过。首次格式检查的3个缺少花括号已修正，后续检查无错误。

自审第一阶段：覆盖所有明确授权行为，不扩ANN策略/阈值/格式；none、历史零维、正常有效模型三条恢复分支都有真实入口证据。第二阶段：快照读一次、WAL错误仍传播、恢复fallback日志不输出原始数据；范围内未发现待处理P1/P2。已删去Recall>95%/75%总内存节省的未经本仓基准支持表述，仅描述Uint8编码与原始向量精排；也删去代码未实现的增长50%重训练注释。

精确源码hash、日志命令/返回码/hash与范围记录见 quantization-implementation-evidence.json。下游继续使用既有包入口；根线程完成Binary集成及全量检查后再统一构建/提交。

持久化实现者的Binary empty-flag/结构校验/安全写入修复落盘后，quantization-green-integrated再次运行同一25项必要回归，全部通过；包含固定历史dimension0字节恢复与single-read断言。产品切片现已冻结，等待根线程独立审查，不再扩展范围。

## 根线程追加：迁移归档与持久化失败边界

根线程复核后明确授权继续同一恢复闭环：本片增加 VectorMigration.ts，仍不修改 BinaryPersistence 或其测试。先在 HnswVector.test.ts 用真实 ASVEC 目标目录占位制造 EISDIR，覆盖 init/initSync 与 legacy 数组/对象；要求失败传播且 JSON 原件保留，再用新实例清障重试，成功后才产生 bak。确认 RED 后，async 初始化把持久化纳入传给 Migration 的 batchUpsert 阶段；Migration 与 sync loader 的 catch 只包读取/解析，存储错误传播。保留 DTO、empty/new 以及归档失败不撤销已落盘结果的旧兼容语义。随后跑必要迁移/恢复用例并重新冻结，不提交、不跑全量。

## 追加迁移修复完成与最终冻结

实际RED为4例（init/initSync × 数组/对象）：异步EISDIR已抛出但JSON提前成为bak；同步EISDIR被吞掉而resolve undefined。修复后同4例通过，并检查失败实例在目录障碍仍存在时destroy且移出清理列表，清障后新实例成功恢复、查询且恰好发布一次snapshot，随后才出现bak。

VectorMigration仅捕获读取/JSON解析失败，batchUpsert/持久化错误继续传播；async Adapter把persist放入Migration批次回调，sync save移出解析catch。另有3例empty/bad JSON仍返回new并保留原件、2例bak目录占位造成归档失败仍保留有效snapshot的兼容检查。没有引入新的DTO/公开参数/格式。

固定9e8d033与当前源码的8例对照（migration-legacy-edge-comparison.json）全部相同：async []/{}保留JSON、无bak、无snapshot；async非空invalid-only归档bak但不生成snapshot，因为旧#persist的dirty gate本来就不写；sync上述四种均保存空snapshot并归档。未为被纠正的假设增加persisted状态或强制markDirty。

最终quantization-migration-final-green为43项必要用例通过；quantization-migration-types为Core noEmit通过；quantization-migration-fixture-types覆盖两个新增describe且诊断0；quantization-migration-lint及quantization-migration-diff-check通过。完成范围与源码hash已更新quantization-implementation-evidence.json。再次冻结产品，未commit、未跑全量，整批检查与提交由根线程独立执行。
