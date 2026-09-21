# 逐文件审查清单

覆盖 352 个起始 tracked 文件与 8 个新增文件，共 360 条。已删除测试仍留在清单中记录迁移去向；AGENTS.md 和 CLAUDE.md 为用户预先改动。完整职责、验证、哈希见同目录 CSV / JSON。

| 文件 | 职责 | 当前处置 |
| --- | --- | --- |
| `.claude/settings.json` | 既有工具权限及相邻目录访问声明；只读审阅，保留宿主配置。 | 审查后保留 |
| `.git-blame-ignore-revs` | 历史批量改名提交的 blame 排除记录。 | 审查后保留 |
| `.github/workflows/ci.yml` | CI checkout Core sibling、安装构建测试链。 | 修改并验证 |
| `.gitignore` | 忽略依赖、构建、临时证据与本机私密配置。 | 审查后保留 |
| `AGENTS.md` | 本仓边界、验证、Core 依赖与协作约束；保留用户预先改动。 | 保留用户修改 |
| `CLAUDE.md` | 宿主协作规则；保留用户预先改动。 | 保留用户修改 |
| `README.md` | 英文当前架构、目录、公共API与验证发布说明。 | 修改并验证 |
| `README.zh-CN.md` | 中文对等入口说明。 | 修改并验证 |
| `biome.json` | 单一格式/lint规则，产品fixture明确排除。 | 审查后保留 |
| `config/agent-public-api-boundary.json` | 15个精确公共出口与主机边界/禁止消费样本的规范数据。 | 审查后保留 |
| `config/agent-public-api-signatures.json` | 各公共出口绑定名+runtime kind的精确哈希快照。 | 审查后保留 |
| `config/agent-validation-floor.json` | 不应随便下调的验证下限与关键行为suite清单。 | 审查后保留 |
| `config/core-import-boundary.json` | Core公共facade/禁止deep import基线及例外解释。 | 审查后保留 |
| `config/layer-contract.json` | 内部层图允许矩阵与已解决循环历史。 | 修改并验证 |
| `config/naming-lint.json` | 各目录命名规则与有范围例外。 | 审查后保留 |
| `config/side-effect-doctrine.json` | blessed singleton/managed state/机检例外的机器规范。 | 修改并验证 |
| `docs/entrypoint-effects.md` | 当前公共入口/工具副作用承诺。 | 修改并验证 |
| `docs/side-effect-doctrine-census.md` | 2026-06-12指定baseline的历史副作用清点与决策出处。 | 修改并验证 |
| `package-lock.json` | 可复现依赖图和唯一Core本地链接；生成数据。 | 审查后保留 |
| `package.json` | 公共exports/imports、源码Core依赖、构建验证发布脚本。 | 修改并验证 |
| `scripts/build-agent.mjs` | 清理本仓 dist 后编译，符号链接仅删除链接本身。 | 新增并验证 |
| `scripts/check-agent-space-edges.mjs` | Core所有的空间依赖DAG/toolchain配置的只读消费门禁。 | 审查后保留 |
| `scripts/codemod-rename.mjs` | 显式--apply的结构改名维护脚本，默认dry-run；支持NodeNext specifier。 | 修改并验证 |
| `scripts/eval-judge-calibration.mjs` | 人工导出样本的 judge 校准 CLI、报告与源文件收据 | 修改并验证 |
| `scripts/eval-mining.mjs` | 真实普通/严格挖掘评估 CLI，隔离 project/data root 和内存 gateway | 修改并验证 |
| `scripts/eval-strict-production.mjs` | frozen/mock 严格语义 helper 链评估及报告 | 修改并验证 |
| `scripts/fixtures/strict-public-connected-probe.mjs` | 公开 package consumer、真实 Core fact executor、Agent lineage/V5 durable authority、fresh-process 连通探针 | 修改并验证 |
| `scripts/guard-agent-release-package.mjs` | 根manifest/lock禁止file:../依赖进入pack/publish的预发布保护。 | 审查后保留 |
| `scripts/lib/mining-eval-core.mjs` | 候选启发式匹配、指标聚合、报告纯函数 | 审查后保留 |
| `scripts/lib/mining-eval-runtime.mjs` | 隔离评估用知识写入端口及失败证据收据。 | 新增并验证 |
| `scripts/lint-agent-import-boundary.mjs` | 禁止Agent引入Plugin/MCP/Codex/channel交付层及禁目录。 | 审查后保留 |
| `scripts/lint-agent-public-api-boundary.mjs` | 冻结公共出口分类、contract matrix及禁止subpath样本验证。 | 审查后保留 |
| `scripts/lint-doctrine.mjs` | module-scope let与空Map/Set两类副作用信条可机器检查项。 | 审查后保留 |
| `scripts/lint-layer-contract.mjs` | src内部区域runtime import图与明确例外校验，type-only独立统计。 | 审查后保留 |
| `scripts/lint-naming.mjs` | 按源码/脚本/配置区域应用命名约束及具owner例外。 | 审查后保留 |
| `scripts/lint-provider-neutral-kernel.mjs` | runtime/evaluation/strategy中的厂商字符串回归门禁。 | 审查后保留 |
| `scripts/probe-agent-public-strict-consumer.mjs` | 真实Alembic宿主上下文中的公共严格链运行与NodeNext类型消费验证。 | 审查后保留 |
| `scripts/probe-embedding-capacity-hint.mjs` | 构建后dist AI能力提示的只读独立probe，无provider调用。 | 审查后保留 |
| `scripts/smoke-agent-public-imports.mjs` | 真实package export动态导入及禁止deep import反向验证。 | 审查后保留 |
| `scripts/smoke-agent-public-signatures.mjs` | 构建后公共出口精确名字+runtime kind哈希快照校验。 | 审查后保留 |
| `scripts/stage-agent-publish-package.mjs` | 本地源码基线转registry依赖的发布stage与Core提交溯源。 | 修改并验证 |
| `scripts/verify-agent-validation-floor.mjs` | 测试/公共出口/Core reference/pack条目及必需suite的冻结下限。 | 修改并验证 |
| `src/agent/context/ContextWindow.ts` | Provider 消息缓冲、工具 transcript 原子轮次、分级压缩与工具结果配额。 | 修改并验证 |
| `src/agent/context/ConversationStore.ts` | 宿主对话索引及 JSONL 读写、预算裁剪和模型摘要。 | 修改并验证 |
| `src/agent/context/ExplorationTracker.ts` | 探索阶段状态机、工具证据/提交计数和退出决策。 | 修改并验证 |
| `src/agent/context/exploration/ExplorationStrategies.ts` | Analyst/Producer/Generate 的声明式阶段转换与配额。 | 审查后保留 |
| `src/agent/context/exploration/NudgeGenerator.ts` | 阶段、停滞、预算和反思提示生成；有限次数 bootstrap nudge。 | 审查后保留 |
| `src/agent/context/exploration/PlanTracker.ts` | 计划提示、重规划、动作与计划步骤的启发式覆盖评分。 | 审查后保留 |
| `src/agent/context/exploration/SignalDetector.ts` | 根据工具动作及目标跟踪新文件、新关键词和新查询。 | 审查后保留 |
| `src/agent/context/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/agent/context/l4MemoryPackage.ts` | L4 摘要的结构化输入包、证据引用与保留校验。 | 审查后保留 |
| `src/agent/coordination/AgentRunCoordinator.ts` | 按 profile 的 partitioner/tier/concurrency 运行子任务，处理懒加载输入、回调与结果合并。 | 修改并验证 |
| `src/agent/domain/index.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/agent/evaluation/DurableSemanticReviewRuntime.ts` | 真实 provider 调用、权威证据装载、Core V5 durable attestation 与取消/超时错误分类 | 审查后保留 |
| `src/agent/evaluation/IndependentValueReviewer.ts` | 冻结证据上的独立六轴价值评审与输出校验 | 审查后保留 |
| `src/agent/evaluation/InvestigatedEmptyReviewer.ts` | investigated-empty Core consumer 的兼容 class 入口 | 审查后保留 |
| `src/agent/evaluation/MiningJudge.ts` | 评估脚本证据重切、judge rubric、模型装载收据、校准指标 | 修改并验证 |
| `src/agent/evaluation/StrictProductionFixtureEvaluation.ts` | 离线真实 runtime 评估所用冻结 fixture provider/port | 审查后保留 |
| `src/agent/evaluation/analysisArtifact.ts` | 普通分析工件、证据摘要与受限源码补齐 | 修改并验证 |
| `src/agent/evaluation/gateEvaluators.ts` | 普通质量门、模块覆盖、演化完成与提交拒绝率接线 | 修改并验证 |
| `src/agent/evaluation/index.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/agent/evaluation/qualityGates.ts` | 普通分析多维评分、修复路由、深度接地规则 | 修改并验证 |
| `src/agent/evaluation/stageBuilders.ts` | 普通 scan 与 relations 流水线阶段工厂 | 审查后保留 |
| `src/agent/evidence/EvidenceCapture.ts` | 真实工具返回归一、台账录入和模型可见 E-id 标注 | 修改并验证 |
| `src/agent/evidence/EvidenceCollector.ts` | 普通分析工具轨迹的片段、图谱与负空间信号提取 | 修改并验证 |
| `src/agent/evidence/EvidenceLedgerStore.ts` | append-only JSONL、hash、freshness、hydration 与检索 | 审查后保留 |
| `src/agent/evidence/ProductionEvidenceLedgerAuthority.ts` | trusted coordinates 上 capture/read facet 与私有 WeakMap authority | 审查后保留 |
| `src/agent/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/memory/ActiveContext.ts` | 单运行工作记忆：发现 scratchpad、观察日志、计划和蒸馏。 | 修改并验证 |
| `src/agent/memory/EpisodicConsolidator.ts` | 将会话 findings/reflections/文本事实提取为持久记忆候选。 | 审查后保留 |
| `src/agent/memory/MemoryConsolidator.ts` | 持久记忆冲突更新、相似去重/合并及旧 JSONL 迁移。 | 修改并验证 |
| `src/agent/memory/MemoryCoordinator.ts` | 记忆作用域、三层预算和注入、发现写入、缓存及 checkpoint 协调。 | 修改并验证 |
| `src/agent/memory/MemoryEmbeddingStore.ts` | 记忆向量 JSON sidecar、延迟刷盘和 GC。 | 审查后保留 |
| `src/agent/memory/MemoryFlushContract.ts` | 工作记忆蒸馏与维度刷新类型契约及高重要性筛选。 | 审查后保留 |
| `src/agent/memory/MemoryRetriever.ts` | 词汇/向量混合检索、时间/重要性评分、prompt 生成及旧 append 兼容。 | 修改并验证 |
| `src/agent/memory/MemoryStore.ts` | Core semantic_memories schema 的同步 SQLite 适配、CRUD 和维护。 | 审查后保留 |
| `src/agent/memory/PersistentMemory.ts` | MemoryStore/Retriever/Consolidator 公共门面及宿主 embedding 注入。 | 审查后保留 |
| `src/agent/memory/SessionStore.ts` | 跨维度报告与证据索引、公开只读工具缓存、序列化及 checkpoint。 | 修改并验证 |
| `src/agent/memory/SessionStoreSchema.ts` | 会话快照顶层形状验证及兼容缺省值。 | 修改并验证 |
| `src/agent/memory/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/agent/policies/BudgetPolicy.ts` | 轮次、时间、会话 token 的策略限制及 runtime budget 配置。 | 审查后保留 |
| `src/agent/policies/Policy.ts` | 执行前/中/后与配置处理的策略基类契约。 | 审查后保留 |
| `src/agent/policies/PolicyEngine.ts` | 组合策略并提供 budget 与工具安全校验入口。 | 修改并验证 |
| `src/agent/policies/QualityGatePolicy.ts` | 执行后证据长度、文件引用、工具调用数量与自定义质量提示。 | 修改并验证 |
| `src/agent/policies/SafetyPolicy.ts` | 发送者、文件范围、命令黑名单和需要审批工具的策略。 | 审查后保留 |
| `src/agent/policies/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/production/StrictProductionPipeline.ts` | 严格分析 epoch、扩展登记、归纳反证、fixpoint、Producer lineage 与 terminal receipt 校验 | 审查后保留 |
| `src/agent/production/StrictProductionPrompts.ts` | 冻结语义投影上的无工具 Analyst/Producer 提示 | 审查后保留 |
| `src/agent/production/StrictProductionStages.ts` | 严格生产四阶段接线与宿主端口边界 | 审查后保留 |
| `src/agent/production/index.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/agent/profiles/AgentProfileCompiler.ts` | 将可序列化 profile/ref/override 编译成 preset、stage、policy、actionSpace 与并发计划。 | 修改并验证 |
| `src/agent/profiles/AgentProfileRegistry.ts` | 内置与自定义 profile 注册、查找及禁止函数/Set/Map 的序列化检查。 | 审查后保留 |
| `src/agent/profiles/AgentStageFactoryRegistry.ts` | scan/relation/generate/strict stage 工厂；组合动态分析预算与终端提示。 | 审查后保留 |
| `src/agent/profiles/definitions/evolution.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/generate.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/profiles/definitions/module-mining/ScopedModuleMiningProfile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/plan.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/relation.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/scan.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/signal.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/definitions/translation.profile.ts` | 可序列化业务profile定义；声明技能、strategy工厂、预算/并发或strict投影。 | 审查后保留 |
| `src/agent/profiles/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/profiles/presets/chatPreset.ts` | 对话运行时默认块：conversation+analysis、Single、Budget与memory。 | 审查后保留 |
| `src/agent/profiles/presets/evolutionPreset.ts` | 知识进化运行时默认块及decision-only retry提示。 | 审查后保留 |
| `src/agent/profiles/presets/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/profiles/presets/insightPreset.ts` | analyze→quality_gate→produce→rejection_gate及独立预算/提示。 | 审查后保留 |
| `src/agent/profiles/presets/types.ts` | preset工厂与可执行strategy配置结构。 | 审查后保留 |
| `src/agent/prompts/index.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/agent/prompts/insightAnalyst.ts` | Analyst 系统提示、规模预算、上下文装配 | 修改并验证 |
| `src/agent/prompts/insightEvolver.ts` | 已有 Recipe 验证与演化提案提示 | 审查后保留 |
| `src/agent/prompts/insightGate.ts` | retry/record-repair/summary-rewrite 提示 | 修改并验证 |
| `src/agent/prompts/insightProducer.ts` | Producer 结构化发现、证据引用、Core authoring 指引与压缩 | 审查后保留 |
| `src/agent/prompts/scanPrompts.ts` | scan extract/summarize 任务文本配置 | 审查后保留 |
| `src/agent/runs/evolution/EvolutionAgentRun.ts` | 演化审计 run 入口及工具决策结果投影 | 修改并验证 |
| `src/agent/runs/index.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/agent/runs/module-mining/ModuleContextAssembler.ts` | 模块导航上下文和保目录内聚的超大模块拆分 | 审查后保留 |
| `src/agent/runs/module-mining/ScopedModuleMiningAgentRun.ts` | 模块归一、fanout 入口和按规模预算下发 | 审查后保留 |
| `src/agent/runs/plan/PlanAgentRun.ts` | 普通/严格 Plan cognition、Core receipt 校验与修复因果链 | 审查后保留 |
| `src/agent/runs/relation/RelationAgentRun.ts` | 关系发现 run 与 JSON 输出投影 | 修改并验证 |
| `src/agent/runs/scan/ScanAgentRun.ts` | 普通 scan run 与系统上下文入口 | 审查后保留 |
| `src/agent/runs/scan/ScanRunProjection.ts` | 仅 persisted knowledge-submit created 结果可成为 Recipe | 审查后保留 |
| `src/agent/runs/translation/TranslationAgentRun.ts` | translation run 与安全 JSON 字段投影 | 审查后保留 |
| `src/agent/runtime/AgentEventBus.ts` | 进程内语义事件、订阅与公开 request/reply API。 | 修改并验证 |
| `src/agent/runtime/AgentInterfaceContract.ts` | 公共结果分支、Core failure taxonomy 投影和契约静态一致性校验。 | 审查后保留 |
| `src/agent/runtime/AgentMessage.ts` | HTTP/CLI/MCP/internal 消息与回复 callback 的统一输入信封。 | 审查后保留 |
| `src/agent/runtime/AgentRuntime.ts` | 执行入口、ReAct 主循环、工具调用、预算、信号、过程事件与最终结果。 | 修改并验证 |
| `src/agent/runtime/AgentRuntimeBoundary.ts` | 包公开入口和 Agent/Core/Host 的责任边界数据。 | 审查后保留 |
| `src/agent/runtime/AgentRuntimeResponsibility.ts` | 运行时分解 seam、术语、feature flag 与模型/API边界元数据。 | 审查后保留 |
| `src/agent/runtime/AgentRuntimeTypes.ts` | 运行时输入、LLM响应、工具记录、诊断与结果的类型契约。 | 审查后保留 |
| `src/agent/runtime/AgentState.ts` | 带历史、guard/action 与 EventEmitter 的状态机。 | 审查后保留 |
| `src/agent/runtime/AnalyzeGroundingGuard.ts` | 显式 guard 模式下构建 grounding 政策与 analyze 文本轮阻断决策。 | 审查后保留 |
| `src/agent/runtime/BudgetController.ts` | 上下文压缩触发、L4 冷却、token 使用计量及工具输出预算。 | 修改并验证 |
| `src/agent/runtime/DiagnosticsCollector.ts` | 统一诊断/效率计数、聚合、序列化及去重调用信封记录。 | 审查后保留 |
| `src/agent/runtime/ExitController.ts` | 实际使用 pre-iteration 退出检查；另含尚未接入主循环的 post-* 公共检查器。 | 修改并验证 |
| `src/agent/runtime/HookSystem.ts` | 有顺序/once/错误诊断的同步与异步 hook，含可阻断工具执行事件。 | 修改并验证 |
| `src/agent/runtime/LLMInputAssembly.ts` | 组装 identity/stage/tool/task/evidence/runtime layer，并压缩重复输入与提交历史。 | 审查后保留 |
| `src/agent/runtime/LLMInputMeasurement.ts` | provider 输入与分节 token估算、重复文本度量。 | 修改并验证 |
| `src/agent/runtime/LLMResultType.ts` | LLM循环 continue 控制结果及公开枚举。 | 审查后保留 |
| `src/agent/runtime/LoopContext.ts` | 一次 reactLoop 的依赖、状态、预算、证据、累计token与结果投影。 | 审查后保留 |
| `src/agent/runtime/MessageAdapter.ts` | ContextWindow 与裸消息数组的统一适配接口。 | 审查后保留 |
| `src/agent/runtime/PcvNodeEvidenceRecorder.ts` | 观察运行节点/输入/工具/发现/quality gate/source ref 证据并供宿主审计投影。 | 审查后保留 |
| `src/agent/runtime/ProviderToolChoicePolicy.ts` | ModelQuirks 驱动的工具可见性/toolChoice provider 兼容策略，与 grounding guard 解耦。 | 审查后保留 |
| `src/agent/runtime/SystemPromptBuilder.ts` | persona、预加载文件清单、capability context、语言与轮次预算提示组装。 | 审查后保留 |
| `src/agent/runtime/SystemRunContext.ts` | 规范构建和投影 scope/ActiveContext/trace/sharedState，维护同scope关联。 | 审查后保留 |
| `src/agent/runtime/ToolExecutionPipeline.ts` | action权限/阶段门、参数大小、重复缓存、实际router执行、证据与提交记账中间件。 | 修改并验证 |
| `src/agent/runtime/finalAnswer.ts` | 清除响应中的显式Final Answer前缀、memory标记与部分系统nudge噪声。 | 审查后保留 |
| `src/agent/runtime/forcedSummary.ts` | 无最终文本时生成受限Markdown/dimensionDigest及失败时本地摘要。 | 修改并验证 |
| `src/agent/runtime/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/service/AgentRunContracts.ts` | AgentService/profile/run/runtime 的公开契约。 | 修改并验证 |
| `src/agent/service/AgentRuntimeBuilder.ts` | 编译profile/preset与宿主依赖组装成真实Runtime。 | 审查后保留 |
| `src/agent/service/AgentService.ts` | 对外run入口，编译profile、协调child或执行Runtime并映射结果。 | 修改并验证 |
| `src/agent/service/SystemRunContextFactory.ts` | 为system运行创建ContextWindow/MemoryCoordinator/scope/tracker。 | 审查后保留 |
| `src/agent/service/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/strategies/FanOutStrategy.ts` | 直接Strategy级tier并行执行，复用Runtime并合并item结果。 | 审查后保留 |
| `src/agent/strategies/PipelineStrategy.ts` | stage执行与timeout、gate retry/degrade/strict失败及阶段状态隔离。 | 修改并验证 |
| `src/agent/strategies/SingleStrategy.ts` | 单阶段委托 reactLoop。 | 审查后保留 |
| `src/agent/strategies/Strategy.ts` | StrategyRuntime、StrategyResult、FanOutItem及策略基类契约。 | 审查后保留 |
| `src/agent/strategies/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/tasks/AgentTaskHandlers.ts` | 宿主task接口的查重/关系发现/enrich/quality/guard编排；依赖宿主工具invoke入口。 | 审查后保留 |
| `src/agent/tasks/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/agent/utils/Redaction.ts` | 开发者可见输入、输出与证据内容中的凭证脱敏。 | 修改并验证 |
| `src/agent/utils/toolOutcomes.ts` | 统一工具观察归一、持久化提交判定与演化结果语义。 | 新增并验证 |
| `src/ai/AiFactory.ts` | Provider 创建、环境探测、备用 provider 与 embedding provider 选择。 | 修改并验证 |
| `src/ai/AiProvider.ts` | 统一 AI 公共契约、provider 配置、网关委派、摘要和 embedding。 | 修改并验证 |
| `src/ai/AiProviderManager.ts` | 宿主 provider 热切换、token recorder、embedding fallback 和 DI 回调。 | 审查后保留 |
| `src/ai/deepseekToolCallCompat.ts` | 受工具名称白名单约束的 DeepSeek 文本 function_calls 兼容解析。 | 审查后保留 |
| `src/ai/gateway/LLMGateway.ts` | 模型/参数解析、provider 可靠性控制、transport 生命周期和响应归一化。 | 修改并验证 |
| `src/ai/gateway/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/ai/guard/ParameterGuard.ts` | 基于模型声明过滤、限幅或降级生成参数。 | 审查后保留 |
| `src/ai/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/ai/providers/ClaudeProvider.ts` | Claude 默认配置及网关委派；当前 embedding 空结果。 | 修改并验证 |
| `src/ai/providers/DeepSeekProvider.ts` | DeepSeek 默认模型/推理强度及网关委派。 | 审查后保留 |
| `src/ai/providers/GoogleGeminiProvider.ts` | Gemini 默认并发、模型、embedding 配置及网关委派。 | 审查后保留 |
| `src/ai/providers/OllamaProvider.ts` | Ollama base URL 归一化、本地默认模型和 OpenAI 兼容网关接入。 | 审查后保留 |
| `src/ai/providers/OpenAiProvider.ts` | OpenAI base URL、Chat/Responses 风格和 embedding 配置。 | 审查后保留 |
| `src/ai/registry/ModelDefs.ts` | 厂商/模型能力、推理特性、参数规则和配置类型。 | 审查后保留 |
| `src/ai/registry/ModelQuirks.ts` | 模型特殊行为的共享查询及文本工具调用来源标识。 | 审查后保留 |
| `src/ai/registry/ModelRegistry.ts` | 内置模型索引、动态模型降级定义和公共注册入口。 | 审查后保留 |
| `src/ai/registry/ProviderConfig.ts` | 对外展示的 provider 默认模型、环境变量与 endpoint 元数据。 | 审查后保留 |
| `src/ai/registry/models/claude.ts` | Claude 模型能力与参数限制声明。 | 审查后保留 |
| `src/ai/registry/models/deepseek.ts` | DeepSeek 模型能力与 V4 tool_choice 限制声明。 | 审查后保留 |
| `src/ai/registry/models/google.ts` | Gemini 模型能力和上下文声明。 | 审查后保留 |
| `src/ai/registry/models/ollama.ts` | 本地 Ollama 模型默认能力声明。 | 审查后保留 |
| `src/ai/registry/models/openai.ts` | OpenAI 模型能力和推理参数声明。 | 审查后保留 |
| `src/ai/shared/errorClassify.ts` | LLM 中止、网络、可重试与熔断错误分类。 | 审查后保留 |
| `src/ai/shared/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/ai/shared/reliability.ts` | Provider 独立并发、限流窗口、可取消重试和熔断状态。 | 审查后保留 |
| `src/ai/shared/structuredOutput.ts` | JSON 提取、围栏容错和截断数组回收。 | 修改并验证 |
| `src/ai/shared/usage.ts` | 不同厂商 token 字段归一化。 | 审查后保留 |
| `src/ai/toolTranscript.ts` | 不完整 Chat Completions 工具轮次安全转换为文本。 | 审查后保留 |
| `src/ai/transport/ClaudeTransport.ts` | Anthropic HTTP 协议、连续 tool_result 合并及统一响应。 | 审查后保留 |
| `src/ai/transport/DeepSeekTransport.ts` | DeepSeek HTTP 协议、V4 thinking transcript 和文本调用兼容。 | 修改并验证 |
| `src/ai/transport/GoogleTransport.ts` | Gemini generateContent/embedding 协议、schema 清理和 thoughtSignature。 | 修改并验证 |
| `src/ai/transport/LLMTransport.ts` | 共享 HTTP、代理 dispatcher、取消/超时、错误和 API key 检查。 | 修改并验证 |
| `src/ai/transport/OpenAiTransport.ts` | OpenAI Chat/Responses/embedding 协议转换和工具结果回传。 | 修改并验证 |
| `src/ai/transport/index.ts` | 公共 barrel 导出；保留 package export/内部模块访问边界。 | 审查后保留 |
| `src/evaluation.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/index.ts` | 公开或内部barrel；逐行审阅re-export，保留稳定消费边界。 | 审查后保留 |
| `src/production.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/runs.ts` | 受限公开 facade 或内部 barrel；已核对转导出归属 | 审查后保留 |
| `src/shared/concurrency.ts` | 无外部依赖的 Promise 并发 limiter，供 AgentRunCoordinator/FanOutStrategy 使用。 | 审查后保留 |
| `src/shared/packageAssets.ts` | 定位 @alembic/agent 安装根，为 Conversation 读取可选 SOUL.md 提供路径。 | 审查后保留 |
| `src/shared/projectPath.ts` | 统一词法与真实路径的项目根约束。 | 新增并验证 |
| `src/shared/serialization.ts` | 稳定序列化，统一工具与会话缓存键。 | 新增并验证 |
| `src/shared/structuredOutput.ts` | 字符串感知 JSON 提取和受限修复。 | 新增并验证 |
| `src/shared/tokenUtils.ts` | 按字符估算 token 及快速估算，供运行时输入测量与上下文预算使用。 | 审查后保留 |
| `src/tools/catalog/CapabilityCatalog.ts` | manifest 注册、删除、过滤与 provider schema 投影。 | 审查后保留 |
| `src/tools/catalog/CapabilityManifest.ts` | 宿主/Agent 共享的风险、治理、执行与 schema manifest 类型。 | 审查后保留 |
| `src/tools/catalog/UnifiedToolCatalog.ts` | 在 manifest catalog 上叠加 handler definitions、router 绑定、模型覆盖与展开状态。 | 修改并验证 |
| `src/tools/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/kernel/context.ts` | 调用身份、服务端口、runtime 元数据与 EvidenceLedgerLike 契约。 | 审查后保留 |
| `src/tools/kernel/decision.ts` | 允许/拒绝决策类型与构造帮助函数。 | 审查后保留 |
| `src/tools/kernel/handler.ts` | 内部 handler/store 契约与 ToolCallContext 到旧形状上下文的映射。 | 审查后保留 |
| `src/tools/kernel/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/kernel/presenter.ts` | 信封识别和 ordinary output 文本呈现。 | 审查后保留 |
| `src/tools/kernel/registry.ts` | 工具/action/schema/handler/context/capability 类型，以及 ok/fail/token 估算帮助函数。 | 审查后保留 |
| `src/tools/kernel/request.ts` | 共享 ToolCallRequest、ToolRouterContract 与执行 adapter 契约。 | 审查后保留 |
| `src/tools/kernel/result.ts` | 外部稳定的工具结果信封、普通输出投影、字段清理和诊断摘要。 | 修改并验证 |
| `src/tools/kernel/routing.ts` | 通过 serviceContracts 解析 ToolRouterContract。 | 审查后保留 |
| `src/tools/runtime/adapter/RuntimeCapabilityCatalog.ts` | 把内置 registry 的 tool/action 白名单投影成模型可见 schema。 | 审查后保留 |
| `src/tools/runtime/adapter/ToolRouterAdapter.ts` | 宿主 ContextFactory 到内置 ToolRouter 的真实执行桥接并构造统一信封。 | 修改并验证 |
| `src/tools/runtime/adapter/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/runtime/cache/DeltaCache.ts` | 带文件指纹与简易行 diff 的缓存，用于重复读取与写前新鲜度。 | 审查后保留 |
| `src/tools/runtime/cache/SearchCache.ts` | 按调用方 key 的 LRU 搜索结果缓存。 | 审查后保留 |
| `src/tools/runtime/cache/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/runtime/compressor/OutputCompressor.ts` | 延迟装载命令专用 parser，ANSI/重复行清理与预算截断。 | 修改并验证 |
| `src/tools/runtime/compressor/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/GitDiffParser.ts` | 将 git diff/stat 汇总成逐文件增删数。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/GitLogParser.ts` | 解析完整/oneline/custom git log，截取前 20 条。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/GitStatusParser.ts` | 解析 porcelain/human git status 并按状态归桶。 | 修改并验证 |
| `src/tools/runtime/compressor/parsers/GrepParser.ts` | 解析 rg JSON 或 file:line 文本，按位置去重并上限 30 条。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/LintOutputParser.ts` | 识别 ESLint/tsc/Biome diagnostics 并返回计数与前 10 个问题。 | 修改并验证 |
| `src/tools/runtime/compressor/parsers/PackageParser.ts` | 压缩 npm/pnpm/yarn 安装概要与警告。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/TestOutputParser.ts` | 解析 Vitest/Jest/Pytest/Mocha 概要与失败片段。 | 修改并验证 |
| `src/tools/runtime/compressor/parsers/TreeParser.ts` | 尝试把 tree/ls -R/find 输出标准化为目录树。 | 审查后保留 |
| `src/tools/runtime/compressor/parsers/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/runtime/compressor/strip.ts` | ANSI 清理、连续重复折叠、保留头尾的通用输出截断。 | 审查后保留 |
| `src/tools/runtime/handlers/code.ts` | 真实代码搜索/读取/AST outline/目录树/文件写入，与缓存及路径/写前校验集成。 | 修改并验证 |
| `src/tools/runtime/handlers/evidence.ts` | 运行证据台账 get/search，只读并限制返回规模。 | 审查后保留 |
| `src/tools/runtime/handlers/graph.ts` | 调用宿主注入的 projectGraph/codeEntityGraph，Agent 不实现 AST 内核。 | 审查后保留 |
| `src/tools/runtime/handlers/knowledge.ts` | 知识查询、候选准备/证据与 authoring gate/风格修复/Core production/生命周期管理。 | 修改并验证 |
| `src/tools/runtime/handlers/memory.ts` | 会话保存/召回、引用台账的结构化发现、前序维度证据召回。 | 审查后保留 |
| `src/tools/runtime/handlers/meta.ts` | registry 自省、执行计划记录与会话提交汇总。 | 审查后保留 |
| `src/tools/runtime/handlers/recipeAuthoringGate.ts` | 注入文件来源解析器，调用 Core validateAgainst 的 in-process 包装。 | 修改并验证 |
| `src/tools/runtime/handlers/recipeProductionAdapter.ts` | 验证 bounded coreCode；构建 Core retrievalProfile 身份、provenance 和 source hash。 | 审查后保留 |
| `src/tools/runtime/handlers/submitEvidenceExpansion.ts` | 从台账 refs 展开 sources、检查新鲜度、净化来源与限定风格修复子调用。 | 修改并验证 |
| `src/tools/runtime/handlers/terminal.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 修改并验证 |
| `src/tools/runtime/handlers/terminalSafety.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 修改并验证 |
| `src/tools/runtime/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/runtime/recipeProductionContract.ts` | 各可提交知识的 Agent 提示共用 retrieval profile 契约文字。 | 审查后保留 |
| `src/tools/runtime/registry.ts` | 7 个内置工具/22 个 action 的 schema、风险、缓存、并发与 handler 注册真相源。 | 审查后保留 |
| `src/tools/runtime/router.ts` | 解析、参数校验、capability 检查、并发控制、handler 执行和输出预算。 | 修改并验证 |
| `src/tools/runtime/toolsets/Capability.ts` | 能力基类和 buildContext/step hook seam。 | 审查后保留 |
| `src/tools/runtime/toolsets/CapabilityRegistry.ts` | 能力名到具体能力类的工厂注册映射。 | 审查后保留 |
| `src/tools/runtime/toolsets/Conversation.ts` | 会话工具白名单、persona/project briefing/memory 提示注入与步骤后缓存。 | 审查后保留 |
| `src/tools/runtime/toolsets/Evolution.ts` | 知识进化工具白名单及只读终端命令白名单。 | 审查后保留 |
| `src/tools/runtime/toolsets/GenerateAnalyze.ts` | 冷启动分析工具集与证据/发现记录指引。 | 审查后保留 |
| `src/tools/runtime/toolsets/GenerateProduce.ts` | 常规知识生产工具集/提示及 strict proposal-only 无工具模式。 | 审查后保留 |
| `src/tools/runtime/toolsets/RuntimeCapability.ts` | 声明式 allowedTools、命令白名单、registry 驱动提示与 CapabilityDef。 | 审查后保留 |
| `src/tools/runtime/toolsets/ScanAnalyze.ts` | 增量扫描分析能力的工具集与发现要求。 | 审查后保留 |
| `src/tools/runtime/toolsets/ScanProduce.ts` | 增量扫描生产能力及 strict 无工具模式。 | 审查后保留 |
| `src/tools/runtime/toolsets/System.ts` | 系统交互工具集，包含代码写入与终端。 | 审查后保留 |
| `src/tools/runtime/toolsets/index.ts` | 公开或内部模块 barrel；逐个读取并核查 re-export 路由。 | 审查后保留 |
| `src/tools/workflow/WorkflowRegistry.ts` | WorkflowDefinition 注册/读取/删除容器，具体执行交由宿主。 | 审查后保留 |
| `test-reports/strict-production/judge-calibration/calibration.json` | 历史 frozen/mock 评估产物；结构、记录数量及来源核验，不作为本轮验证或真实人工校准证据。 | 审查后保留 |
| `test-reports/strict-production/mining/report.json` | 历史 frozen/mock 评估产物；结构、记录数量及来源核验，不作为本轮验证或真实人工校准证据。 | 审查后保留 |
| `test-reports/strict-production/mining/report.md` | 历史 frozen/mock 评估产物；结构、记录数量及来源核验，不作为本轮验证或真实人工校准证据。 | 审查后保留 |
| `test-reports/strict-production/report.json` | 历史 frozen/mock 评估产物；结构、记录数量及来源核验，不作为本轮验证或真实人工校准证据。 | 审查后保留 |
| `test/ActiveContext.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/AgentRuntime.test.ts` | 行为测试：AgentRuntime.test | 审查后保留 |
| `test/AiFactory.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/BudgetController.test.ts` | 行为测试：BudgetController.test | 修改并验证 |
| `test/ClaudeTransport.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/ContextWindow.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/DeepSeekProvider.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/DeepSeekTransport.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/DimensionSchemaVariant.test.ts` | 行为测试：DimensionSchemaVariant.test | 审查后保留 |
| `test/EvidenceCapture.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/EvidenceLedgerBoundary.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/EvidenceLedgerStore.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/EvidenceToolAndQuota.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/ExplorationStrategies.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/GoogleTransport.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/LLMGateway.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/NoteFindingEvidenceRefs.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/OllamaBaseUrlNormalize.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/OpenAiProvider.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/OpenAiTransportResponses.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/Redaction.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/SubmissionSanitize.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/SubmitEvidenceExpansion.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/agent-dcr-retirements.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 审查后保留 |
| `test/agent-interface-contract.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 修改并验证 |
| `test/agent-lifecycle.test.ts` | 运行时取消、超时、恢复、权限、阻断 hook 与预算边界回归。 | 新增并验证 |
| `test/agent-surface-floor.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 修改并验证 |
| `test/ai-provider.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 修改并验证 |
| `test/contract-surface.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/durable-semantic-review-runtime.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/embedding-capacity-hint.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/entrypoint-effects.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/evidence-collector-fidelity.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/evidence-ledger-baseline.characterization.test.ts` | 行为测试：evidence-ledger-baseline.characterization.test | 修改并验证 |
| `test/evidence-recording-phase-chain.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/feishu-remote-removal.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 审查后保留 |
| `test/fixtures/coldstart-baseline-2026-07-04.json` | 历史真机对照资料，保留原始记录；移除只断言自身数字的伪回归。 | 审查后保留 |
| `test/fixtures/mining-e2e/src/handlers/billing-handler.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/mining-e2e/src/handlers/order-handler.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/mining-e2e/src/handlers/user-handler.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/mining-e2e/src/shared/result.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/mining-eval/golden.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/public-strict-consumer/strict-facades.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/golden.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/judge-calibration.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/projects/alembic-workspace-single-file/src/agent/production/StrictProductionStages.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/projects/bilidili-three-file/BiliDili/Assets.xcassets/AccentColor.colorset/Contents.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/projects/bilidili-three-file/BiliDili/Assets.xcassets/Contents.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-production/projects/bilidili-three-file/BiliDili/Assets.xcassets/LaunchScreenImage.imageset/Contents.json` | 相关测试或可控 fixture | 审查后保留 |
| `test/fixtures/strict-semantic-authority.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/generate-analyze-budget.test.ts` | 行为测试：generate-analyze-budget.test | 审查后保留 |
| `test/helpers/tempProject.ts` | 统一临时项目创建及测试后清理。 | 新增并验证 |
| `test/hook-system.test.ts` | 行为测试：hook-system.test | 修改并验证 |
| `test/index.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 并入 contract-surface.test.ts，公共导出断言保留。 |
| `test/insight-depth-retry.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/l4-memory-package.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/llm-input-correctness.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/llm-input-layering.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/memory-context.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/memory-note-finding.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/mining-e2e-pipeline.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/mining-eval-harness.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/model-quirks.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/module-context-assembler.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/module-mining-agent-run.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/pcv-observe-only-baseline.characterization.test.ts` | 行为测试：pcv-observe-only-baseline.characterization.test | 审查后保留 |
| `test/pcv-observe-only-five-scenario.acceptance.test.ts` | 行为测试：pcv-observe-only-five-scenario.acceptance.test | 审查后保留 |
| `test/pipeline-outcome-abandoned.test.ts` | 相关测试或可控 fixture | 修改并验证 |
| `test/plan-agent-run.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/production-evidence-ledger-authority.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/public-strict-facades.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/recipe-authoring-inprocess-flatten.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/recipe-authoring-inprocess-parity.test.ts` | 行为测试：recipe-authoring-inprocess-parity.test | 修改并验证 |
| `test/recipe-production-profile-adapter.test.ts` | 行为测试：recipe-production-profile-adapter.test | 修改并验证 |
| `test/reliability.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `test/remaining-host-contract.test.ts` | 补齐公共契约、host seam、retirement或provider测试审查。 | 并入 contract-surface.test.ts，宿主适配及负向契约保留。 |
| `test/runtime-efficiency.test.ts` | 行为测试：runtime-efficiency.test | 修改并验证 |
| `test/runtime-terminal-safety.test.ts` | 行为测试：runtime-terminal-safety.test | 修改并验证 |
| `test/scan-run-production-integration.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/scan-run-projection.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/shared-ai-utils.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 修改并验证 |
| `test/strict-iterative-analysis.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/strict-production-chain.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/strict-production-rework.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/style-waiver.test.ts` | 行为测试：style-waiver.test | 删除与 Core 单源算法重复的规则枚举；保留函数引用一致性及真实 handler 接线。 |
| `test/summary-rewrite-gate.test.ts` | 相关测试或可控 fixture | 审查后保留 |
| `test/tool-system.test.ts` | 行为测试：tool-system.test | 修改并验证 |
| `test/tool-v2-contract.test.ts` | 行为测试：tool-v2-contract.test | 修改并验证 |
| `test/transport-proxy.test.ts` | 直接相关单元/协议/存储行为回归；已阅读测试输入、断言和fixture。 | 审查后保留 |
| `tsconfig.json` | NodeNext ESM strict源码声明构建边界。 | 审查后保留 |
| `vitest.config.ts` | 测试源码alias、timeout与覆盖率ratchet；未设置默认启用coverage。 | 审查后保留 |
