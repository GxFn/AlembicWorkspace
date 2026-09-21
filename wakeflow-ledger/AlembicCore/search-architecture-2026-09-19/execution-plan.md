# 搜索链路职责整合与逐文件审查

开始日期：2026-09-19。基线：8ab3783。用户继续要求逐文件 review、模块/文件职责分层、接口精简、冗余验证和测试清理，明确允许自主控制提交节奏。

Gate conclusion：明确的继续实施命令；先读取真实宿主消费、当前代码和测试，再用实际维护收益选择切片。最小闭环为逐文件职责表 → 行为兼容设计 → 有关基线/必要缺陷 RED → 实施 → 验证及独立复核 → 每批本地提交。没有授权阻塞，不创建 Wakeflow dispatch 或改总控状态。

## 边界

- 主体为 Core 搜索模块及其读取适配器；两外层仍仅限已授权的必要接线。TencentDB-Agent-Memory 只读。
- 保持分数、排序、alias、预算、fallback、公开 DTO/入口和旧构造。不同业务语义的 RRF/quality/recency/context 不因相似名称合并。
- AGENTS.md/CLAUDE.md、原有未跟踪 coverage/index.ts 保持原状。无 push/发布/vendor 更新，dist ignored。
- 删除必须有引用扫描、替代入口和独有断言映射。四个硬边界测试保留。

## 顺序与提交

1. 排名与增量索引：去掉 MultiSignalRanker 无读取方的状态/订阅，保留 signalBus 选项；updateDocument 委托已有 upsert。整合重复测试并锁住 seasonality 旧权重等价关系。相关验证通过独立提交。
2. 仓储读取：统一 full-index/incremental 的字段投影所有权；raw schema 只读取一次快照。核实关键词 LIKE 转义的两适配器差异，若复现则先 RED 修复。不合并 SQL 与领域业务策略。
3. 搜索编排：单次生成索引文档与元数据，避免重复 Recipe 投影；合并两条 dense 路径相同的映射/后处理，保留实际来源的分数与空值差异。用现有公开入口/真库测试验证，不给 private helpers 再造镜像测试。
4. 完整 Core check、公共入口/声明兼容与必要外层检查，逐文件清单、删除映射、研究来源、提交和残留边界归档。

## 学习依据

- 腾讯检出 06414ac：store/types 区分读取与召回，sqlite 返回原始内容，宿主能力选择与工具输出分开；共享 RRF helper 未实际接线，不能照注释声称已统一。
- Vespa 官方 hybrid tutorial 明确 retrieval 与 ranking 分工；SQLite 官方 queryplanner 说明查询字段/索引的关系。只迁移职责模式，不修改本产品评分/索引算法。

## 第 1 批完成（2026-09-20）

- 真实 SignalBus 的排名不变/无无效监听回归先 RED（原 2 listener），后 GREEN。
- 排名与搜索、pipeline、公共 facade 125 用例通过；no-emit 与三文件 Biome 通过。
- 删除私有死容器、无效订阅和重复 remove 调用；保留全部公开选项/评分与 SearchEngine 发信号。测试迁移保留频率、membership、tombstone、upsert、压缩等行为。
- baseline-search 命令含一个旧测试名未匹配，实际执行 7 套件150用例；另以正确 PublicSearchVectorGuardEntrypoints 文件单独基线3用例通过，未将其误计为8套件。

## 最终状态

第 2/3 步作为共同搜索边界整合提交，避免共享测试文件的中间 RED 进入历史。额外同模块缺陷（排名原型键、分组重复、详情 facets）均先 RED 后修复。最终 Core 完整检查及顺序补充通过，Main/Plugin 类型与 24/14 消费用例通过。提交为 688cbbb 与 f39e139，完整范围与证据见 review-summary.md / verification.json。
