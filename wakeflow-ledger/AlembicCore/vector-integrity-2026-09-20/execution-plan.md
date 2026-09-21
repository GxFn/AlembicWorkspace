# 向量底层完整性逐文件审查

日期：2026-09-20。Core 基线 9e8d033；沿用用户持续review、实现与自主提交授权，必要外层接入仍限已授权范围。

Gate conclusion：用户明确命令继续。上一批识别了overlap、level clamp、qvector恢复和crash命名的弱断言，本批先读真实实现/消费者并用可重复入口查证，不把弱断言本身当作产品bug。最小闭环：源码与调用链 → 基线 → 受控RED/兼容对照 → 有限实现与测试清理 → 完整Core检查/必要宿主验证 → 提交和证据归档。目前无阻塞，不操作旧Wakeflow demand/控制状态。

1. Root 完整读取 Chunker、ASTChunker 与管线调用，核对分块预算、重叠、同步/异步边界和降级。
2. 独立只读审查量化/HNSW搜索/重开恢复与binary/migration格式；真实问题先复现，禁止凭泛化最佳实践重写策略。
3. 按发现选择最小架构修复；共享能力留在Core，公开exports、排序、预算、持久化兼容保持。测试替换必须有独有行为映射，四个Core边界套件保留。
4. 每个行为修复先RED后GREEN；最终npm run check、必要的真实包消费者/type检查；分批本地commit，不push。

保护原有AGENTS.md、CLAUDE.md、未跟踪coverage/index.ts；dist仅构建，不提交。长期材料置此ledger，不写线程id或个人绝对路径。
