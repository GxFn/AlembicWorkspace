# 接口清理执行计划

Gate conclusion：用户已确认继续 interface-architecture-2026-09-20 的整理方案。当前窗口负责 AlembicCore，共享能力先在 Core 实现、验证并按切片提交；必要外层接线沿用既有授权。本轮不改变可见业务语义，不处理无关 planned Wakeflow demand，也不修改控制状态。

基线 Core `4a0b277`、Main `4dc86fb`、Plugin `e0deb9a`。保护三个仓库原有 AGENTS.md / CLAUDE.md 修改及 Core 未跟踪的 coverage/index.ts。新增 review 材料仅放本 ledger。

顺序与完成条件：

1. **向量窄能力。** 先运行 SyncCoordinator / RecipeRegionVectorIndex / RecipeVectorGeneration / VectorIndexPorts 基线。用实际函数调用的编译探针记录四方法同步、两方法检查被旧全量 VectorStore 类型拒绝的 RED；固定有状态 ports 的 this 与 aggregate store 优先级。收窄函数参数，删除私有继承桥接，以方法组合复用既有 ports；不增加公共导出名或改变持久化/排序/错误语义。运行定向回归和类型检查后独立提交。
2. **评分投影。** 先对照 ConfidenceRouter 与 KnowledgeService 的完整 scorer 输入和现有路由测试；抽取内部纯字段投影，保留不同 fallback 与 Service 附加字段。验证真实业务入口，不新增总服务或最终评分缓存。
3. **内部写入端口。** persistKnowledgeUpdate 去除具体仓储类型依赖，准确表达实际使用方法及 nullable 返回，保留 file-first / DB-only 分支与错误合同。验证真实持久化故障矩阵；不删同名公共仓储 class/type。
4. **宿主 relay 评估。** 只读复核 16 个 relay 的发布、动态加载与跨仓消费者；仅在替代入口和验证证据齐备时删除无行为私有转发。行为策略对齐仍是后续议题，不合并 generation、sourceRef 或只读/可写生命周期。
5. 每个切片先验证再进入下一个；最终跑 Core 所需组合检查及必要宿主边界检查，做范围/兼容性与代码质量两阶段自审，记录提交、命令、结果、风险和下游使用方式。

本轮为用户直接确认的仓库开发，未收到正式 TaskPackage / acceptanceAnchors；不伪造 dispatch 或 controller acceptance。遵循 wakeflow-target-craft 的基线、测试先行、最小范围与验前完成要求。类型收窄是接口能力改进，RED 来自真实 TypeScript 调用被拒绝；既有行为的 GREEN 对照不冒充运行时 bug 复现。
