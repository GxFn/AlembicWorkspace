# 向量边界与融合逻辑 review

日期：2026-09-20。基线 f39e139。用户继续要求逐文件 review、深度架构优化与代码清理；沿用自主提交节奏及必要外层接线授权。

Gate conclusion：明确继续实施；本批先核对向量服务/基础设施与实际宿主接入，选择可独立验证的边界。最小闭环是逐文件职责/兼容矩阵 → 基线 → 真实缺陷 RED 或重构差分 → 实现 → 完整检查 → 本地提交。当前无授权阻塞，不修改 Wakeflow 总控状态。

## 初步切片

1. 旧 HybridRetriever 与 HNSW 的 weighted RRF 数学和证据累积存在重复。只提炼内部 shared 纯内核，调用方保留身份提取、默认值与输出/payload 选择；canonical KnowledgeRetrievalPolicy 的 truth/预算/补窗不合并。
2. EmbeddingPort、BatchEmbedder、VectorIndexPorts 的用途、取消与批次边界核对。确认缺陷先用受控真实调用复现，避免把无用校验套在内部每层，也不削弱外部 provider 边界。
3. VectorService/SyncCoordinator 的状态与依赖装配只在明确职责/实际消费者后整理。根据审查结果选择最小可审查切片，不单纯搬文件。
4. 测试按数学契约/真实存储/服务编排分工；删除重复用例要记录替代覆盖。保持公共 exports/DTO/排序/预算、持久化格式以及四个 Core 硬边界测试。

## 操作边界

- Core 为主；TencentDB 与三个宿主只读分析，必要接线仅限已授权 Main/Plugin。无 provider/Agent/CLI/UI 能力迁入。
- 原有 AGENTS.md、CLAUDE.md 和未跟踪 coverage/index.ts 保留。dist 仅构建，不提交；不更新 vendor、不发布、不 push。
- 使用已安装 Node 22.23.2 跑真实 SQLite 等测试，不改全局 Node 或重建依赖。
- RRF 兼容关注：缺ID仍占原rank、重复ID总和/最后通道证据、稳定tie、alpha/k/topK原默认、Hybrid Infinity与HNSW undefined、payload取舍；没有新去重/评分策略。
