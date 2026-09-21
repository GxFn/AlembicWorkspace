# 接口与模块分层执行计划

Gate conclusion：用户要求继续深入整理接口对接层、文件和模块职责。最低闭环为真实宿主装配 → Core 依赖契约/业务实现 → 原行为验证 → 分切片提交。沿用 Core 与两宿主必要接线授权；不接管旧 planned Wakeflow demand，不改控制状态或在途 Agent/ToolContext 工作。

基线 Core 22db575、Main bea42bb、Plugin 0f7d203。保护原有规则文件、Core coverage/index.ts，以及 Main 的 AgentModule、ToolContextFactory、AgentRunInputBuilders、DimensionRuntimeBuilder 及相关新文件/测试。

1. 将知识服务的依赖类型和更新输入 schema 从业务编排文件分离；复用 FileStore/窄 graph、routing、scoring 能力，准确承接通用 hooks 的 unknown 返回。导出供两宿主使用的 options 类型，消除整块 options 强转，保持位置参数和业务失败/写入顺序。
2. 明确仓储类型边界：精化真实非空行的映射及 SQL 聚合结果类型，不改 SQL/null 数据值。用户已明确选择保留运行时行为、补齐可空返回类型并修正调用方。因此用 KnowledgeServiceRepository 准确声明写入 nullable，保留旧 runtime 类和同名 Impl 别名；保持 DB-only 的 null、TypeError、审计/事件/afterPublish 顺序，不用 ! 或整体 adapter 断言隐藏。
3. 归拢宿主装配：仓储注册归 Infra；KnowledgeModule 的重复假 EventBus import 去除；ServiceMap 补齐已注册的知识/演化服务，使真实 get 调用受类型检查。按依赖图把大型注册文件中的检索/演化装配拆成有实际调用的模块，保留注册与初始化时机、公开入口和宿主行为差异。
4. 基线先行；新能力用真实编译/调用 probe 固定，保持行为的重构使用改前/改后对照。优先复用既有持久化、hooks、演化接线、freshness 和运行根测试，不为文件搬迁增加同义结构测试。每切片验证后提交，最后跑 Core 组合检查和必要宿主构建/门禁/集成 smoke。

仓储 nullable 的兼容决定已由用户确认。Main 工作树有在途修改，使用从 bea42bb 建立的独立 worktree 验证本轮接线，验证后仅整合本轮提交。最初模块加载基线失败在补建本仓 dist 后消失；隔离构建还暴露一个既有 logger 声明可移植性问题，仅补明确类型，不修改业务逻辑。

## 用户确认后的整合

用户随后授权 Agent 的两个知识结果消费文件与必要测试，并明确选择“采用并行的新结果语义，合并本轮类型与分层改动”。这覆盖原计划中外层 TypeError 的兼容安排，Core 的 DB-only 行为仍保持不变。Main 的共享空回执错误、HTTP/strict 调用和对应测试，以及 Agent 两个消费文件与已有测试，按快照复核后纳入本轮整合。其它 Agent/ToolContext 改动保留。

整合顺序：在隔离工作树复制已批准策略 → Agent 构建和定向测试 → Main 构建、接线/HTTP/真实 strict 测试 → 对比原工作树快照与隔离成品 → 仅提交明确文件 → 对原工作树执行必要接入验证。旧的隔离兼容提交保留历史，不把旧错误语义带回工作树。
