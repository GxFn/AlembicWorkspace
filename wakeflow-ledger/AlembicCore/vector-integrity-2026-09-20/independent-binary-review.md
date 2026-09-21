# BinaryPersistence 冻结差分独立复核

日期：2026-09-20。基线 `9e8d033`。本次只读复核 `BinaryPersistence.ts` 与 `VectorPersistence.test.ts` 的指定差分，未修改产品、测试、宿主或控制状态，未运行 Vitest/构建。仅运行一个受控公共入口 probe，并将文档与证据写入本目录。没有创建提交，由主审统一提交与验收。

## 严重度结论与最小建议

- **P0/P1/P2：未发现阻断或已证实回归。** 统一 decode/isValid、有效快照单次加载、长度/引用边界、正文写入前 mode 继承、失败保持旧快照、历史零维量化器和可选 metadata 兼容与本轮约定一致。建议保持当前最小实现，不扩展持久化协议。
- **P3，非阻断下游成本：Plugin legacy read-only 路径仍重复完整解析。** `AlembicPlugin/lib/host-runtime/mcp/host/read-only-search-executor.ts:180` 调用 `isValid`，随后 `:187` 创建 reader；`read-only-hnsw-vector-reader.ts:32` 又调用 `load`。以前已读两次文件，本次 isValid 委托 decode 后两次都完整解析。Core adapter 的 init/initSync 已去掉这个重复。最小后续建议是在 Plugin 构造 reader 一次并沿用原失败降级处理，不改 Core API；没有实测延迟或内存超限，不把它升级为功能故障，也不在本次修改宿主。

## 读取范围

| 对象 | 实际深度 |
| --- | --- |
| `src/infrastructure/vector/BinaryPersistence.ts`，569 行 | 全文及全部当前差分。 |
| `test/VectorPersistence.test.ts`，1034 行快照 | 全部指定差分；BinaryPersistence 正文与故障矩阵（1–266）、Validation 正文（331–464）；迁移新增案例按差分读取。未全文复审剩余 WAL 用例。 |
| `src/infrastructure/io/WriteZone.ts:65–240` | 写入、异步写入、rename、remove、授权 guard 的局部调用追踪。 |
| `src/infrastructure/vector/HnswVectorAdapter.ts:100–227` | init/initSync/restoreSnapshot 单次读取和 catch 边界追踪；不审查正在另案修改的 JSON 归档时序。 |
| `test/HnswVector.test.ts:801–812` | 已有真实快照单读断言，结合对应 2 用例 GREEN 日志。 |
| Plugin `read-only-search-executor.ts:158–199`、`read-only-hnsw-vector-reader.ts:1–132` | legacy request snapshot 的验证→构造→load 链路局部读取，不修改。 |
| 本目录 persistence review、probe 与检查日志 | 用来定位既有 RED/GREEN 原因，不把他人执行当成本次重新执行。 |

## 具体边界判断

**格式与计数。** `load:144–147` 读取一次并调用 `decode`；`isValid:513–519` 只封装同一读取/解码边界，不维持第二套魔数规则。`requireBytes` 在 header、quantizer、vectors、graphs 与 metadata 的相应分配/遍历之前检查声明长度；UInt16/UInt32 计数的乘积在 JavaScript 安全整数范围内。图 node/neighbor 与 entryPoint 仅接受有效索引；空索引继续使用 0xffffffff 哨兵。header 层数只要求不大于存储层数，保留删除节点后残留空层。

**兼容。** 正常 v1、正维且匹配的量化数据与基线逐字节相同。新 encoder 省略空索引或维度不匹配的量化 section，metadata/contents 不因此丢失；decoder 继续接收旧 dimension=0 + quantizer flag。metadata 整节省略、完整但无法解析的 JSON 沿用容错；声明字节数超出文件才拒绝。没有把 keyword-only metadata/contents 与 ANN node ID 集合强制相等，也未改变不透明 ID、删除节点重映射或旧 level clamp。

**写入与失败。** save/saveAsync 都先 encode，再创建同目录唯一临时路径；旧目标存在时先写空临时文件并继承 mode，再写 Buffer 正文；新目标沿用默认 mode。WriteZone 的文件写入、rename、remove 均经过既有 guard。正文失败或 rename 失败均清理临时文件并抛原错误，不能删除旧目标作“回滚”；临时清理再失败时记录诊断并保留原异常。原子发布限定为本轮既定普通同目录路径：不将 WriteZone 的跨设备复制退化路径、链接/ACL、inode 或 fsync 议题扩成新增需求。

**测试有效性。** 8 路矩阵覆盖 save/saveAsync × 直接/WriteZone × 真实部分写入/rename 失败；部分写入先落 20 字节再抛 ENOSPC，核查旧文件字节、可读内容、临时文件清理与 0600 mode；恢复原 fs 后再保存新内容并核查 mode。`syncBuiltinESMExports` 使 fault 覆盖 BinaryPersistence 的命名导入，finally 恢复替身。旧高 level 测试改为真实 level=300 并断言 255，消除了随机普通节点无法证明 clamp 的弱断言。

## 既有证据核对

- `persistence-red-structure.log`：6 个真实断言失败，包括 header 尚完整但正文截断导致迁移错误选择 binary，以及 metadata 声明长度超界未拒绝。
- `persistence-red-atomic.log`：8 个矩阵用例失败，包含旧目标已被部分覆盖的 Buffer 差分。
- `persistence-red-temp-mode.log`：4 个正文部分写入场景观察到 0644 而非 0600；对应 `persistence-green-temp-mode.log` 为 52 用例通过。
- `persistence-red-graph-levels.log`：1 个缺少图层的真实 decode 断言失败。
- `persistence-final-tests.log`：53 用例通过；`persistence-final-types` 在 checks.jsonl 中退出码 0。
- `quantization-green-single-read.log`：init/initSync 两个实际快照读取次数用例通过。

本次没有重复上述套件，也没有复验正在由其他审查者处理的 JSON 归档修复。

## 本次独立小型 probe

脚本：[binary-independent-probe.mjs](binary-independent-probe.mjs)。从 Core 根目录以 Node.js 22 运行：

```sh
node --disable-warning=ExperimentalWarning ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/binary-independent-probe.mjs
```

结果：[binary-independent-probe.log](binary-independent-probe.log)。Node `v22.23.2`，30 秒子进程上限，实际小于 1 秒，**6 检查组通过 / 0 失败，退出码 0**：

1. 普通和已量化 v1：编码与 `9e8d033` 字节相同，解码结果逐值相同。
2. 一个真实编码快照的 191 个截断前缀：只有完整图之后省略可选 metadata 的边界可读，其余全部拒绝。
3. 8 个超大计数/非法引用变体：decode 抛错，isValid 为 false，没有按声明巨大计数分配/遍历。
4. 完整坏 JSON 忽略后 ANN 正常；历史零维量化器保留 keyword-only 内容。
5. isValid 与 load 各自只调用一次真实 readFileSync。
6. sync/async mode 准备失败注入 EACCES：正文 Buffer 写入次数均为 0，旧目标字节保持，临时文件清理。

probe 只在唯一临时目录写入样本并在 finally 清理；基线源码只在内存加载，不生成 dist 或产品副本。`git diff --check -- src/infrastructure/vector/BinaryPersistence.ts test/VectorPersistence.test.ts` 退出码 0。

本次冻结复核 SHA-256：

```text
3d197b2784d4bd5d25afd6866a00effa2edf829a426ddc8b9a52f74c9e573e49  src/infrastructure/vector/BinaryPersistence.ts
55869a5e7ec4edc02e7567e7b627618d0857143fb1b60c2380dbc5676d9daa26  test/VectorPersistence.test.ts
```
