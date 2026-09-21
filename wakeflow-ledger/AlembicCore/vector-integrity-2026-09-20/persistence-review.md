# BinaryPersistence / VectorMigration 审查与执行记录

日期：2026-09-20，基线 `9e8d033`。本轮原为只读审查；Root 随后明确授权有界实现。本审查者最终只修改 `BinaryPersistence.ts` 和 `test/VectorPersistence.test.ts`，不提交，由 Root 独立复核与整批验证。VectorMigration 已由 Root 另行交给量化/Adapter 审查者处理发布与归档失败闭环，本审查者没有改动该文件。

状态：本域产品与测试已冻结；最终 VectorPersistence 53 项、TypeScript、scoped Biome、层级 gate 和 scoped diff-check 通过。没有运行全 Core 测试，也不把局部完成当作 Root 最终验收。

## 已完成阅读

- 全文：`src/infrastructure/vector/BinaryPersistence.ts`（461 行）、`VectorMigration.ts`（102 行）、`test/VectorPersistence.test.ts`（803 行）。测试的 WAL 段用于识别现有恢复契约，不意味着本轮重构 WAL。
- 局部：HnswVectorAdapter 初始化/同步初始化/保存调用；HnswIndex serialize/deserialize、节点删除、随机 level、搜索引用处理；WriteZone.writeFile/writeFileAsync/rename；Plugin 只读 snapshot 入口与 ReadOnlyHnswVectorReader 加载部分。没有全文审查这些消费者，也不修改外仓。

## 已实证与最小实施顺序

1. 相关基线：`persistence-baseline`，VectorPersistence 35 tests pass。
2. 格式边界：真实编码快照截为 32 字节仍被 isValid 接受，load 抛越界，公开 migrate 因此返回 binary 而跳过有效 JSON；正数越界 entryPoint 被 decode 接受并使 HNSW 搜索返回空。正式测试先 RED，校验只集中到 decode，再让 isValid 委托该判定。
3. 保存边界：公开 save/saveAsync 在真实 fs 部分写入后抛 ENOSPC，旧 144 字节目标变为 20 字节损坏文件。正式测试先 RED；改为同目录唯一临时文件→rename，失败清理临时文件并保留旧目标。WriteZone 继续参与授权写入/重命名，不宣称 fsync 耐久性。
4. 高 level：旧测试只 addPoint 两次，没有设置 level>255，也没有断言读取 level；修正为明确 level=300、断言解码 255，不改变已存在的 clamp 策略。
5. 量化：等待量化审查者捕获其正式 RED 后，Binary encoder 已改为只在正维度且匹配已训练模型时写量化 section；历史零维带 quantizer flag 的快照继续可读。Adapter 的历史模型诊断/丢弃由量化审查者处理，详见 `quantization-review.md`。
6. 自审补全：临时文件不能先用默认 0644 写入旧 0600 快照的内容。复用现有 8 个故障用例捕获实际部分写入 mode，4 项 RED 后修复为先创建空临时文件、继承旧 mode、再写正文；新文件仍用旧默认 mode。未修改 WriteZone 接口。
7. Root 独立复核补全：检查旧 HnswIndex 的 addPoint 先 ensureLevel 再设置 maxLevel，删除节点只降低 maxLevel，证明正常 writer 的 header numLevels 不大于 graph section 层数。新增小 header 篡改 RED，统一在 decode 校验上界；允许删除后保留多余空图层，并删除 decode 内只写不读的 idToIndex Map。

## 必须保留的兼容边界

- v1 头部、字段宽度、float32 字节编码、节点 ID 与 tombstone 重映射规则不变，不增加新磁盘版本。
- header 的 maxLevel 与 graphs.length 不要求相等：删除高层节点后可以留下空高层图。
- metadata section 可以缺省；完整但损坏的 metadata JSON 沿用忽略策略。已声明的长度越过 Buffer 边界与 JSON 内容容错是不同问题。
- metadata/contents 允许包含没有 ANN node 的 ID，保留 keyword-only 条目与 `__proto__` 等不透明 ID。不能做集合强制相等或重编号。
- 历史 dimension=0 + HAS_QUANTIZER 不据此整份丢弃；格式校验与量化模型可用性属于不同信任边界。
- 原子 rename 会替换目录项/inode，与任意符号/硬链接目标的原地覆写并不等价；已读实际生产者使用普通快照路径。此边界已向 Root 回报，不自行扩展链接协议。
- 原子替换需要同目录可创建/重命名临时文件；不为此修改目录权限。保留普通 permission bits，未承诺复制 inode 身份、ACL 或其他扩展元数据。

## 可重跑窄探针

`persistence-probes.mjs` 用 Node 22 从当前 Core 源码做内存转译；仅写独立 os.tmpdir 子树并在 finally 删除，不修改仓库源码/测试。包含 level300、真实头部截断+JSON迁移、entryPoint/图引用、metadata 长度/可选省略、同步/异步部分写故障。执行结果由 `persistence-probes-baseline.log` / 后续验证记录保留。

探针新旧结果：基线的完整魔数头截断仍 isValid=true、migrate=binary、恢复 0 条；修复后拒绝损坏并进入 JSON 迁移。越界 entryPoint/graph node/neighbor 从接受变为拒绝。声明 metadata 长度越界从接受变为拒绝，可选 metadata 完全缺省继续可读。save/saveAsync 的部分写 ENOSPC 从破坏旧目标变为保留旧字节、继续可读。

第一轮即时 probe 的单节点旧快照是 144 字节；落盘可复跑脚本使用两节点和 keyword-only metadata，文件大小不同。证据比较的是同一操作前后的完整字节，不将两个不同 fixture 的文件长度互相比较。

## 最终改动与必要验证的归属

- `BinaryPersistence.decode` 统一检查头部、量化 section、每个向量记录、图层/记录/邻接表及声明 metadata 的可读字节范围。计数对应的最小字节数在分配或遍历前确认。
- entryPoint 必须与实际 node 数量相容；图 node/neighbor 索引不能越界；header 不得引用不存在的图层。没有增加拓扑策略、节点重编号或跨层重复验证。
- `BinaryPersistence.isValid` 委托 load/decode，避免单独魔数规则与真正可读性漂移。VectorMigration 的截断回退由这一共同判定修复，而非另复制一套 parser。
- save/saveAsync 使用同目录 UUID 临时路径，WriteZone 分支仍通过现有 write/rename/remove；失败只清理临时文件，不删除旧快照。清理本身失败会诊断而不覆盖原始写入错误。没有声称 fsync 或跨文件事务。
- 旧 private snapshot mode 在任何正文写入前生效；成功发布保留旧 mode，新目标保持原默认 mode。同步/异步与 WriteZone 分支均由真实文件验证。
- 头部常量、字段宽度、版本、普通 metadata JSON wire、opaque ID、正常正维量化数据不变。只有不适用的量化模型不再编码进新快照。

ASVEC v1 不含整文件 checksum，本次没有新增 checksum 或宣称能检测一切位翻转。metadata JSON 语法损坏的既有容错按授权保留；长度越界检查不是对其重复做业务校验。磁盘格式边界、HNSW 恢复模型可用性和业务读取过滤是不同层，不能因为调用链上都有检查就一并删除。

## 正式测试映射

| 行为 | 最终测试位置/覆盖 |
| --- | --- |
| 普通、量化、空索引、opaque ID、图连接读取 | 保留原 BinaryPersistence describe 全部用例；既有普通 metadata 字符串断言不改期望。 |
| level clamp | 将原弱用例改为实际 level=300、maxLevel=300、完整图层，再断言两个节点都解码为 255。没有只检查“不抛错”。 |
| entryPoint / graph node / neighbor / future version | 一个参数化用例以真实 encode 输出改字节；isValid=false 且 decode 抛错。 |
| metadata 长度与兼容 | 同一用例区分声明长度 overrun、完全省略、完整但坏 JSON、历史 dimension0+HAS_QUANTIZER 和额外 keyword-only ID。 |
| header 图层上界 | 先真实 add→remove，证明空索引可保留多余空图层；仅修改 header 为不存在的层数后必须拒绝。 |
| JSON 恢复 | 真实 32 字节截断文件和同目录有效 JSON，经公开 VectorMigration.migrate 验证 migrated、完整数据和备份，而非只 mock isValid。 |
| 原子保存 | 8 项：save/saveAsync × raw/WriteZone × 部分写/rename 失败；真实部分字节写入后故障，校验原目标字节、内容、临时文件清理与重试。 |
| mode | 在同 8 项内验证新文件默认权限、部分写时继承旧 0600、成功替换后仍为 0600，没有新增重复 suite。 |
| quantizer flag | 0/2/3 维数据配同一真实 2 维已训练模型；匹配正维为保留，其余省略，keyword-only 正文仍在。 |
| WAL | 本文件原 WAL 保留/恢复/错误传播用例全部保留；它们不能被原子 save 的局部测试替代。 |

## 验证证据

均使用本批 `run-check.py` 和 Node 22。精确命令、耗时、退出状态在 `checks.jsonl`，对应 log 文件在同目录。

| label | 结果 |
| --- | --- |
| `persistence-baseline` | 原 VectorPersistence 35 项通过。 |
| `persistence-probes-baseline` | 观察型 probe exit0，输出明确显示上述缺陷；不是行为通过的 gate。 |
| `persistence-red-structure` | 6 项因真实结构/迁移问题失败；9 通过、26 按名称过滤跳过。 |
| `persistence-green-structure` | 全 VectorPersistence 41 项通过。 |
| `persistence-red-atomic` | 8 项失败，复现旧目标损坏/无 rename 发布边界。 |
| `persistence-green-atomic` | 49 项通过。 |
| `persistence-red-quantizer` | 0 维和维度不匹配两个 RED，匹配正维 control 通过。 |
| `persistence-green-quantizer` | 52 项通过。 |
| `persistence-probes-green` | probe 输出旧快照保留、引用/长度损坏拒绝、可选 metadata 保留。 |
| `persistence-red-temp-mode` | 4 个实际写入 mode 为 0644 而非 0600 的 RED；另外 4 个 rename 故障路径通过。 |
| `persistence-green-temp-mode` | 52 项通过。 |
| `persistence-red-graph-levels` | header 引用不存在图层的单项 RED。 |
| `persistence-green-graph-levels` | 53 项通过。 |
| `persistence-related-green` | 当时的 VectorPersistence + HnswVector + PublicSearchVectorGuardEntrypoints 共 112 项通过；这是 mode/header 最终补全前的联验 checkpoint。 |
| `persistence-final-tests` | 最终 VectorPersistence 53 项通过，包含原有 WAL 用例。 |
| `persistence-final-types` | TypeScript noEmit exit0。 |
| `persistence-final-format` | 本域两文件 scoped Biome 通过。 |
| `persistence-layer` | 层级 gate exit0。 |

另外已执行本域 `git diff --check`，exit0。未运行全 Core 测试。

## 两轮自审与交接

需求对照：格式校验只集中在 decode；isValid 复用；没有改 v1 编码宽度、metadata 容错或历史空量化读取。原子写入包含 WriteZone、失败临时清理、原始错误传播和 mode；没有改外层仓库、公开 exports 或引入新持久化票据。

代码质量自审：发现首次实现存在临时正文写入权限窗口，已通过同一故障用例 RED/GREEN 关闭；Root 复核提出图层上界与死 Map，已按正常 writer 状态证明边界、测试并修复。当前本域无已确认未修的 P1/P2。

Root 后续发现并分派的 JSON 归档早于 durable save、同步迁移 catch 吞写入失败，是相邻闭环，由另一审查者修改 Adapter/VectorMigration/HnswVector.test；本报告不冒认其实现或验证。最终需要 Root 联合检查“旧目标保留 + JSON 留存 + WAL 错误不降级”的整条恢复链。

所有产品改动仍留待 Root 独立 review 与统一提交。无独立 commit；本域冻结后只补审查材料。
