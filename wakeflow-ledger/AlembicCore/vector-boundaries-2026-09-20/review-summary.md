# 向量边界审查与整合结果

日期：2026-09-20。基线：`f39e139cb127a094caf052c68adbd6e0c88a0913`。

本批完成 embedding 协议、provider 可用性和旧 RRF 融合的职责收敛，修复串行 embedding 最后一次 await 漏判取消的问题，移除明确无读者的私有状态，并清理一条被更强用例覆盖的测试。公共 exports 的 68 个 key 和映射保持原样。

提交：

- Core：`c1f6d7760a5fe0549420b72babea39b4f9c02e3d`，`refactor(vector): unify embedding, availability and ranking boundaries`。
- AlembicPlugin：`11f8d47476fb09b52977242b3ab5a1fa413e4226`，`test(vector): align plugin WAL recovery with durable snapshots`。
- Alembic 无提交：既有 `file:../AlembicCore` 已消费本次实现，类型与相关行为测试通过，无需修改装配。

本批是用户直接要求的持续 review，不是 Wakeflow delivery。没有更新总控状态、vendor、release 快照或发布/推送代码。Core 先验证并提交，随后完成插件测试接入修正。三个仓库原有 AGENTS.md / CLAUDE.md，以及 Core 未跟踪的 coverage/index.ts 保持原状。

## 逐文件范围与职责决定

[file-review.json](file-review.json) 记录 16 份源码的阅读深度、结论和 SHA256；其中包括完整基线及差异复核、局部调用追踪，以及两份只读缓存候选。不能将这份清单解释为整个仓库或整个 HNSW 文件已完成全面审计。

| 变化 | 为什么这样分层 | 保留的兼容边界 |
| --- | --- | --- |
| EmbeddingPort 实现下移 infrastructure，旧 service 文件转发 | BatchEmbedder 与服务使用同一旧协议适配，基础设施不运行时依赖 service | 原类型/类身份和包出口；只有两个用途方法但无 descriptor 的旧接入；单次 hint 读取 |
| BatchEmbedder 删除重复协议实现 | 自身只处理批次、并发、ID 对应和部分结果 | 8K 截断、默认并发、进度及局部失败恢复 |
| VectorAvailability 内部模块 | 一处维护原始 provider 的五态探测，服务与队列按需消费 | this、每次即时探测、错误 detail、stats 的“已配置”语义；无 embedding 探测副作用 |
| WeightedRrfAccumulator 内部叶子 | 共享加权名次累积与稳定排序，调用方保留身份和 DTO 策略 | 缺 ID 占位、重复证据、payload 引用、Infinity/undefined、原默认值、signed zero |
| coordinator 私有 timestamp/enricher 删除 | 两者只有赋值，没有读取、排序或执行路径 | 最后到达覆盖、串行 flush、失败回队、公开 enrichment 配置与 pipeline 实现 |

产品职责文档随 Core 提交在 `docs/vector-boundaries.md`，分层说明链接已加入 `docs/layer-contract.md`。未新增分层例外或公共 helper。

## 缺陷与独立复核

1. **P2，已修复：最后一次串行 await 后取消仍返回成功。** 声明串行、批量拒绝回退、扁平批量结果回退三个路径均在旧代码 RED；新增 await 后检查保留原取消对象。legacy provider 不接收 signal，因此不宣称中断底层网络请求。
2. **P2，实现复核中发现并修复：新诊断回显文档内容。** 不受控 provider Error.message 可包含文本。现有 fallback 用例增加合成文本断言，先 RED 后改为 provider/count/固定 reason；没有新增一套镜像测试。
3. **P3，精确兼容已处理：HNSW sparse 首项的 -0。** 共用累加器初版从零累加，与旧直接初始化在特殊参数下不同。保留调用方初值语义，无新增参数校验或排序策略。
4. **宿主测试漂移，已修复。** 插件 WAL 测试仍期待 recover 后立即删日志。Core 的 AsyncPersistence 自既有 `fec4b76` 提交起即保留 WAL 到快照成功，本轮没有改该文件。插件用例已对齐“重放后保留 → flush 成功后删除”，没有削弱数据恢复断言。

独立审查细节见 [embedding-review.md](embedding-review.md)、[availability-review.md](availability-review.md)。RRF 对照脚本与结果见 [weighted-rrf-differential.mjs](weighted-rrf-differential.mjs)、[weighted-rrf-differential-result.json](weighted-rrf-differential-result.json)：4,312 组 Hybrid + 3,920 组 HNSW，共 8,232 组零差异；另外检查 1,743 次 dense payload 引用。结果记录中的三个源码 SHA256 已核对为已提交版本。HNSW dense 使用受控结果，sparse 使用真实读取；该对照不测 ANN 质量或性能。

在本批明确阅读和验证的改动范围内，最终复核无遗留 P1/P2。其余模块正确性不据此作保证。

## 测试清理与验证结果

删除 `HnswVector.test.ts` 内仅断言 size=2 的批量回退用例及其只写不读计数；替代覆盖在 `EmbeddingPort.test.ts`，检查完整 ID/vector 映射与诊断不含文档。保留分批、并发、无 provider、用途差异、队列恢复、持久化和四个 Core 边界测试。没有通过删掉失败测试获得通过。

| 检查 | 最终结果 |
| --- | --- |
| Core `npm run check` | 退出 0；193 suites 通过、1 skipped；2199 tests 通过、1 skipped，跳过数与基线一致 |
| Core `npm run build:check` | 退出 0 |
| Core build / public API / 分层 / consumer imports / smoke / budgets / doctrine / naming / Biome / retired symbols | 均在完整 check 通过 |
| Alembic `tsc --noEmit` + 三套向量接入测试 | 退出 0；22 tests 通过 |
| AlembicPlugin `tsc --noEmit` + 六套向量接入测试 | 退出 0；修正旧断言后 162 tests 通过 |
| 插件修改文件 Biome | 退出 0；原有 24 条隐式 any 等警告未在此接入修正中扩大处理 |
| Core / Plugin `git diff --check` | 通过 |

完整命令、结果和中间失败归因在 [verification.md](verification.md)，原始记录为 [checks.jsonl](checks.jsonl)。测试使用现有 Node 22.23.2，与 better-sqlite3 的已安装 ABI 一致；未重建依赖。Core 的 dist 已构建但不提交。未运行两个宿主的全量测试、模型网络请求或插件发布/会话安装验收；本批宿主仅测试断言变更，不涉及这些运行时入口。

## 下游接入与下一批审查

两个宿主继续经 `@alembic/core: file:../AlembicCore` 消费现有 exports，无需迁移导入路径或复制实现。portable/release 固定点仍留给明确发布流程。

[research-and-next.md](research-and-next.md) 记录 TencentDB 本地代码与官方资料的取舍，以及下一批候选：先映射测试归属和漂移，再追踪缓存生命周期。它们来自当前用户持续优化目标下的代码观察，不是新增产品能力，也不表示已经实施或完成。
