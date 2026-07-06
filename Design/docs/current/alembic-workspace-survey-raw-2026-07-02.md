# Alembic 空间结构深挖原始供料(九路,2026-07-02)

> Workflow wf_2f2dcb26-2f1 产物(348 tool calls/79 万 tokens)。全局统一方案的事实基础;结论采信前须亲验关键锚点。



---

# 【core-service-domain】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| service/bootstrap | 冷启动 session 级候选去重缓存(仅此一件事) | 2/190loc | GenerateDedup |
| service/candidate | 候选去重聚合+统一验证门面 | 4/295 | CandidateValidationFacade, CandidateAggregator, SimilarityService |
| service/guard | 代码守卫检查引擎+规则学习+违规存储 | 12/4648 | GuardService, GuardCheckEngine(1783loc) |
| service/knowledge | 知识 CRUD/图谱/同步 + Recipe 生产入口/新鲜度/路径重写/源引用修复 | 13/7081 | KnowledgeService, RecipeProductionGateway, CodeEntityGraph |
| service/planFacts | plan 事实收集+projectInfoTree 精简投影(双宿主共用,U1 下沉) | 5/2018 | buildProjectInfoTree, collect-project-context |
| service/planIntent | plan 意图契约+规模规则+plan-authoring-spec 渲染 | 4/562 | PlanIntent, PLAN_SCALE_RULES, renderPlan* |
| service/planLedger | 纯 re-export 垫片(planIntent+recipeStatus) | 3/6 | 无自有内容 |
| service/project-context | ProjectContext 9 级(space→anchorRange)编排+架构智能+维度规划 | 67/11709 | ProjectContextService(仅45行,薄编排) |
| service/quality | 咨询性质量评分+反馈收集 | 3/626 | QualityScorer, FeedbackCollector |
| service/recipe | Recipe 解析+V3 候选结构校验 | 3/552 | RecipeParser, RecipeCandidateValidator |
| service/recipe-context | RecipeContext 查询分发(interface/handlers/adapters 三层) | 26/1863 | RecipeContextService |
| service/recipeStatus | **实为 plan 生成态投影**(coverage/signature/draft 包) | 3/573 | buildPlanDraftInformationPackage, projectPlanGenerationState |
| service/search | 混合检索+多信号排序 | 9/3565 | SearchEngine(1643loc), HybridRetriever |
| service/source-graph | 源码符号图索引/查询/生命周期 | 5/3067 | SourceGraphService, SourceGraphQueryService(1763loc) |
| service/sustain | 进化提案环:衰减/冗余/整合/提案执行(evolution 刚改名) | 13/4693 | ProposalGateway, ProposalExecutor, DecayDetector |
| service/vector | 向量嵌入+Recipe 区域向量索引+同步 | 6/2519 | VectorService, RecipeRegionVectorIndex |
| domain/dimension | 25 维度注册表单源+统一维度类型 | 7/3602 | DimensionRegistry, UnifiedDimension |
| domain/evolution | 进化决策纯函数规则集(未随 sustain 改名) | 2/588 | EvolutionPolicy, RecipeSimilarity |
| domain/knowledge | KnowledgeEntry 实体+Lifecycle+UnifiedValidator+recipe-authoring-spec 单源 | 27/4685 | KnowledgeEntry, UnifiedValidator, recipe-authoring-spec/ |
| domain/project-context | ProjectContext 契约/refs/map 类型 | 5/885 | ProjectContextContracts |
| domain/recipe-context | RecipeContext 契约/refs 类型 | 4/340 | RecipeContextContracts |
| domain/snippet | Snippet 值对象(单文件微域) | 1/133 | Snippet |
| domain/source-graph | 源码图契约+快照类型 | 2/1448 | SourceGraphContracts |

## 层级与归属问题
**P0 职责错位**
- `service/planLedger/planLedger.ts:1-2` — 全目录 6 loc 纯转发 planIntent+recipeStatus;src/tests/四仓 grep 零消费、不在 package exports → 死垫片,直接删。
- `service/recipeStatus/recipeStatus.ts:2` (import PlanIntent)、`src/plans.ts:33-50` — 名叫 recipeStatus,内容全是 PlanGenerationState/PlanCoverage/PlanDraftInformationPackage,经 plans.ts 出口 → 归 plan 族,建议 `service/plan/{facts,intent,status}` 三合一分组(呼应主体仓 recipe-pipeline 四环先例)。
- `service/bootstrap/GenerateDedup.ts:1` — bootstrap 词已在主体消灭,此目录仅剩 session 去重缓存,唯一消费者 `service/knowledge/RecipeProductionGateway.ts:24` → 并入 knowledge 生产链(或 generate 命名),同时收掉 package export `./service/bootstrap`。
- sustain 改名只切了 service 半层:`domain/evolution/` 目录、顶层 `src/evolution.ts` facade、`src/types/evolution.ts`、`types/ReactiveEvolution.ts`、`repository/evolution/` 仍叫 evolution;sustain 文件内部类型体系仍是 Evolution*(`service/sustain/RecipeImpactPlanner.ts:20-69` 38 处、`ProposalGateway.ts:28-34` EvolutionAction/EvolutionDecision)→ 一次性统一为 sustain(或承认 evolution 保留,但当前是双词并存)。

**P1 边界模糊**
- candidate/quality/recipe 三个微目录同属"候选验证/评分"族:`candidate/CandidateValidationFacade.ts:15` 组合 `../recipe/RecipeCandidateValidator` + `domain/knowledge` UnifiedValidator;`knowledge/ConfidenceRouter.ts:4` 消费 QualityScorer → 三者应合并分组(如 service/knowledge/validation 或独立 validation 族),消灭三个 3-4 文件平铺目录。
- `service/knowledge/CodeEntityGraph.ts`(1232loc,"代码实体关系图谱",repository/code)与 `service/source-graph/`(3067loc,符号图,repository/source-graph)职责相邻、双图并存,分界未在目录名中可读 → 至少要一句 wire-contract 级说明,或合并 graph 族。
- authoring-spec 分层不一致:plan 的在 **service** (`service/planIntent/plan-authoring-spec.ts`),recipe 的在 **domain** (`domain/knowledge/recipe-authoring-spec/`) — 同类"AI 写作契约单源"应同层。
- 出口双轨:`src/service/index.ts` 只 barrel 10/16 子目录(planFacts/planIntent/planLedger/project-context/recipe-context/source-graph 不在),另有顶层 facade 文件(plans.ts/knowledge.ts/evolution.ts/project-context.ts…)+package.json 深路径 exports(`./service/planFacts`、`./service/bootstrap`、`./core/ast/*`、`./repository/base/*`)三套机制并存;`AlembicPlugin/lib/recipe-generation/plan-tool.ts:17` 深 import `@alembic/core/service/planFacts` 绕过 plans facade → 即记忆里"接口收口"的具体形态。
- `service/project-context/` 内 9 个 level 目录(space…anchorRange)与 2 个能力目录(architectureIntelligence、dimensionPlanning)平铺一层,层级与分析能力混排;capabilities 实际经 `src/project-context-capabilities.ts` 单独出口 → 能力目录宜挪出或分组为 capabilities/。

**P2 命名不清**
- 目录命名三风格混用:camelCase(planFacts/planIntent/recipeStatus) vs kebab(project-context/source-graph) vs 单词小写(bootstrap/guard/sustain);project-context 子目录又是 camelCase(fileFlow/moduleLayers)。
- `domain/knowledge/RecipeReadinessChecker.ts:4` 自述"已重构为 UnifiedValidator 的薄封装,兼容旧调用方",消费者仅剩 `src/knowledge.ts` facade → 可收。
- `domain/dimension/UnifiedDimension.ts:4` 注释仍说"Bootstrap / Panorama / Rescan 共用"——Panorama/Bootstrap 旧词残留(bootstrap 词在 service+domain 还有 21 个文件出现)。

## 命名词汇观察
- 概念词清单:plan(Facts/Intent/Ledger/Status 四缀)、recipe、knowledge、candidate、quality、guard、search、vector、dimension、context(Project/Recipe 两族)、graph、proposal、snapshot。
- **进化族五词交叠**(像 bootstrap 五词先例):sustain(service 目录) / evolution(domain+types+facade+repository) / proposal(ProposalGateway/Executor/Repository) / enhancement(sustain/EnhancementSuggester + core/enhancement + src/enhancement.ts facade) / consolidation+decay(Advisor/Detector)。同一生命周期环,五个词根。
- **Lifecycle 三义**:`domain/knowledge/Lifecycle.ts`(Recipe 生命周期状态)、`service/sustain/LifecycleStateMachine.ts`(进化状态机)、`service/source-graph/SourceGraphLifecycle.ts`(索引新鲜度)。
- **graph 三义**:CodeEntityGraph(代码实体)、KnowledgeGraphService(知识关系)、SourceGraph*(源码符号)。
- **Gateway 三处**:RecipeProductionGateway(knowledge)、ProposalGateway(sustain)、DynamicSignalGateway(project-context/dimensionPlanning)——均为"统一入口"语义,可作为正词例保留。
- **Unified 前缀**:UnifiedDimension/UnifiedValidator/统一XX——"统一"是历史修复语,不是职责语。
- recipeStatus vs planIntent:status 实为 plan 投影(见 P0),"recipe"在此是误导词。

## 依赖方向
- domain→service:0 处(干净);service→domain/repository/infrastructure 单向正常。
- service→core 平行引擎层:`service/guard/EnhancementGuardRules.ts:13-14`→core/enhancement、`GuardCheckEngine.ts:8`→core/AstAnalyzer——core 若定位为引擎原语层则合法,但"core"目录名读不出层序(与 service 谁上谁下不可见)。
- 跨 service 边(全部单向,无循环):knowledge→vector(`RecipeFreshnessService.ts:15-16`)、knowledge→quality(`ConfidenceRouter.ts:4`)、knowledge→bootstrap(`RecipeProductionGateway.ts:24`)、candidate→recipe(`CandidateValidationFacade.ts:15`)、vector→search(`VectorService.ts:21`)、recipe-context→vector(`adapters/vectorPort.ts:9`)、recipeStatus→planIntent(`contracts.ts:1`)、planFacts→planIntent(`project-info-tree.ts:20`)。
- planFacts 主消费在宿主仓:`AlembicPlugin/lib/recipe-generation/plan-tool.ts:10-17`(深路径 import),Core 内部仅 CompletenessCritic 有同形 shape——投影能力的真实消费边界跨仓。

## 死区与重复
- **死区**:service/planLedger 整目录(零消费,证据见 P0);`domain/knowledge/RecipeReadinessChecker.ts` 兼容壳(仅 knowledge.ts 转发)。
- **相似度四处实现**:`shared/similarity.ts`(jaccardSimilarity,被 candidate 两文件+search.ts 用)、`service/bootstrap/GenerateDedup.ts:84+`(自带 titleJaccard/extractWords/中文 2-gram,注释称"复用 ConsolidationAdvisor 的 4 维权重"实为复制常量)、`domain/evolution/RecipeSimilarity.ts`(sustain 三文件用)、`service/candidate/SimilarityService.ts`。至少 GenerateDedup 应改用 shared/similarity。
- `service/recipe/RecipeParser.ts` src 内零调用,仅被 `Alembic/lib/injection/ServiceMap.ts`、`AlembicPlugin/lib/injection/ServiceMap.ts` 经 `./service/recipe` 深路径注入——非死码,但出口位置与"宿主注入专用"用途不匹配,收口时须保住这条跨仓边。
- `service/project-context/shared/` 7 个 pairwise 目录(repo-space、module-map、fileFlow-moduleLayers 等)每个仅 contracts.ts+index.ts(共 15 文件/1382loc)——是"相邻层共享契约"的独特先例,统一重构时应明确采纳或折叠,不宜半保留。


---

# 【core-workflows】

## 目录职责表

| 目录 | 职责一句话 | 文件数(非测试) | 主要导出/入口 |
|---|---|---|---|
| workflows/ (根) | 高层编排总桶 | 1+74 | `src/workflows/index.ts`(5 行 export *) |
| workflows/capabilities/coverage | deepMining 覆盖账本(建/写/停止建议) | 5 | `buildCoverageLedger`(ext=4) |
| workflows/capabilities/host-agent | 宿主 Agent 任务简报/分析包/会话/挖矿缓存/技能交付 | 22, 8755 loc | `HostAgentAnalysisPacketBuilder.ts`(1518 行), `MissionBriefingBuilder.ts`(1479 行) |
| workflows/capabilities/persistence | 工作流快照/报告/维度检查点持久化 | 9, 1969 loc | `WorkflowSnapshotStore.ts`, `WorkflowResultPersistence.ts` |
| workflows/capabilities/planning | 维度配置/Tier 调度 + rescan 计划/进化预筛 | 11, 2250 loc | `dimensions/BaseDimensions.ts`, `knowledge/KnowledgeRescanPlanner.ts` |
| workflows/capabilities/presentation | 语言扩展表+目标文件图谱构建(喂 Agent 的输入准备) | 3, 1032 loc | `buildTargetFileMap`/`buildLanguageExtension`(仅内部消费) |
| workflows/project-index | 冷启动+rescan+索引三类 intent/plan/presenter 实现混居 | 8, 1432 loc | `ProjectIndexPlan.ts`(`buildGenerateWorkflowPlanParts`) |
| workflows/cold-start | 纯 shim(6 loc),全部 `export * from '../project-index/...'` | 4 | 冻结 subpath `./workflows/cold-start` |
| workflows/knowledge-rescan | 纯 shim(6 loc),同上 | 4 | 冻结 subpath `./workflows/knowledge-rescan` |
| workflows/shared | 工作流 envelope/plan 类型 | 4, 112 loc | `WorkflowEnvelope.ts:23 envelope()` |
| core/ | 多语言 AST/发现/增强分析叶(层契约钦定 leaf) | 64, 23108 loc | `AstAnalyzer.ts`(1124 行), `core/index.ts` |
| core/analysis | 调用图/符号表/数据流 | 8, 2225 loc | `CallGraphAnalyzer.ts` |
| core/ast | tree-sitter 11 语言 + ProjectGraph | 14, 8534 loc | `ProjectGraph.ts`(806 行) |
| core/discovery | 项目/语言发现器注册表 + 配置热监听 | 21, 7617 loc | `DiscovererRegistry.ts` |
| core/enhancement | 15 个框架增强包 | 17, 3324 loc | `EnhancementRegistry.ts` |
| core/capability | git push --dry-run 写权限探针(非分析) | 2, 278 loc | `CapabilityProbe.ts` |
| daemon/ | Job/runtime 展示与常驻服务契约 + JobStore 实现 | 8, 3590 loc | `ProjectRuntimeContracts.ts`(1050 行), `index.ts` |

## 层级与归属问题

- **P0 service→workflows 运行时反向(经门面绕过 lint)**:`src/service/planFacts/collect-project-context.ts:15` 运行时 import `baseDimensions` from `../../host-agent-workflows.js`(根门面→workflows/capabilities/planning/dimensions);:16 还 import 根门面 `project-context-capabilities.js`。`docs/layer-contract.md` 矩阵 service→workflows=✗,但矩阵只管 area→area 直连,根门面 import 是盲区。建议:`baseDimensions` 下沉到 domain/dimension 或 types,service 禁 import 根门面。
- **P0 core/capability 职责错位**:`src/core/capability/CapabilityProbe.ts:1-10` 是"子仓库写入能力探针"(git push dry-run+读 `.asd/config.json`+24h 缓存),与"分析叶"契约(layer-contract.md:16)无关,且 `core/index.ts:4` 对外导出。建议迁 infrastructure/ 或 service/。类似:`core/discovery/ConfigWatcher.ts:1-8` 是常驻热更新监听器(长生命运行时),混在纯发现器里。
- **P1 host-agent↔persistence 跨界(D3 已知例外仍在)**:`persistence/WorkflowSnapshotStore.ts:10`+`WorkflowReportTypes.ts:2` import type `../host-agent/MiningSessionStore.js`;反向 `host-agent/HostAgentDimensionCompletionWorkflow.ts:6` 运行时 import `../persistence/DimensionCheckpoint.js`。会话态/快照/维度完成三者名义分居两目录实为一体。
- **P1 host-agent 是"按执行者"分组混装功能**:packet 构建+Mission 简报+GenerateSession(冷启动会话)+MiningSessionStore(文件/搜索缓存)+ProjectSkillDeliveryContracts(技能交付)+CompletenessCritic 全在一目录(8.7k loc,capabilities 里最大),且 `host-agent/index.ts:1` 整桶再导出 `../coverage/index.js` — coverage 拆出去了但 wire 面还挂在 host-agent 名下。
- **P1 project-index 目录名下三概念混居**:`ColdStart*`+`KnowledgeRescan*`+`ProjectIndexPlan` 8 文件同层;冻结 subpath 只认 `./workflows/cold-start`/`./workflows/knowledge-rescan`(package.json exports 无 `./workflows/project-index`),即"实现目录名"与"wire 名"永久错位。长期形态建议:project-index 内部分 `cold-start/`、`knowledge-rescan/`、`shared-plan/` 三子目录,shim 目录保持冻结面。
- **P1 daemon/ 契约目录夹带实现**:`src/daemon/JobStore.ts`(293 行 fs 实现,randomUUID/renameSync)与 6 个 *Contracts.ts 混居;对应关系本身健康 — Alembic 主体 `Alembic/lib/daemon/`(13 文件: DaemonJobRunner/DaemonSupervisor/JobDisplaySnapshotStore…)经 `@alembic/core/daemon` 消费契约(`Alembic/bin/daemon-server.ts`、`Alembic/lib/injection/ServiceMap.ts` 等 8 处)。
- **P2 layer-contract.md 已腐**:`docs/layer-contract.md:19,51` 仍写 `workflows/capabilities/project-intelligence`(已退役,git 2675af6"Retire project intelligence draft judgment runner";`config/public-api-boundary.json:189,481,493` 记录其 absent);:66 引用 `service/panorama/PanoramaScanner.ts`(目录不存在);D3 段引用 `BootstrapSession.ts`(现名 GenerateSession.ts)。**project-intelligence 35k 不在 core/**——已退役,现存最近亲缘是 `src/service/project-context`(11709 loc)。
- **P2 presentation 名不符实**:`presentation/TargetFileMapBuilder.ts:1-12` 构建带内容/优先级的目标文件图谱、`LanguageExtensionBuilder.ts` 推断语言 — 是"扫描输入准备"不是展示层;消费者是 project-index presenters 与 HostAgentMissionWorkflow.ts:8。
- **P2 facade 名与内容错位**:`src/host-agent-workflows.ts:61-86` 实际导出整个 workflows 层(host-agent+persistence+planning+presentation+project-index+RecipeSnapshotTypes+CleanupPolicies);外部 46 处 import `@alembic/core/host-agent-workflows` 全走它 — 名字读作"宿主 Agent 工作流",实为"workflows 总线"。

## 命名词汇观察

概念词清单:cold-start / project-index / generate / bootstrap / rescan / mission / briefing / packet / session / mining / coverage / ledger / capability / host-agent / IDE-agent / planning / knowledge / presentation / persistence / daemon / resident-service / envelope / prescreen / evolution。
多义/混用:
- **bootstrap↔generate↔cold-start↔project-index 四词同域**(bootstrap 五词交叠的残余):`GenerateSession.ts:2-8` 文档仍写"Bootstrap 会话"、`@module bootstrap/GenerateSession`、落盘 `.asd/bootstrap-sessions/`;`service/bootstrap/` 目录里文件叫 `GenerateDedup.ts`;冻结 subpath `repository/bootstrap`、`service/bootstrap`(wire-contract.md:37);`ProjectIndexPlan.ts:12` 定义 `GenerateWorkflowRunMode`。
- **capability 三义**:workflows/capabilities(功能分组)、core/capability(git 写权限探针)、根门面 `project-context-capabilities.ts`/`recipe-context-capabilities.ts`(公共 API 面)。
- **HostAgent vs IDEAgent 双词一物**:`IDEAgentAnalysisPacketBuilder.ts:1-3` 是 R1 兼容 shim,`HostAgentAnalysisPacketBuilder.ts:76-81` 仍导出全套 `IDEAgent*` 类型别名;唯一外部消费 `AlembicPlugin/lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`。
- **knowledge 四处**:domain/knowledge、service/knowledge、workflows/capabilities/planning/knowledge(实为 rescan 计划)、workflows/knowledge-rescan。
- **session 三义**:GenerateSession(冷启动租约会话)、MiningSessionStore(TTL 文件/搜索缓存,`MiningSessionStore.ts:5-7`)、repository/session。
- **Mission/Briefing vs AnalysisPacket**:两套"给 Agent 供料"名词并行(MissionBriefingBuilder 1479 行 vs HostAgentAnalysisPacketBuilder 1518 行)。
- **Evolution 残留**:`planning/knowledge/EvolutionPrescreen.ts`(消费者 `AlembicPlugin/lib/runtime/mcp/handlers/evolution-prescreen.ts`),与 EvolutionGateway→ProposalGateway 统一方向不一致。

## 依赖方向

- 反向(P0):`src/service/planFacts/collect-project-context.ts:15` → `../../host-agent-workflows.js`(service→根门面→workflows 运行时值 `baseDimensions`)。
- 跨界互指(已知例外):`workflows/capabilities/persistence/WorkflowSnapshotStore.ts:10` →(type)`../host-agent/MiningSessionStore.js`;`host-agent/HostAgentDimensionCompletionWorkflow.ts:6` → `../persistence/DimensionCheckpoint.js`。
- 健康面:workflows→service 直连 0 处;daemon/ 只 import `../shared/*`(7 个);core 被 service 消费走钦定 leaf(`service/guard/GuardCheckEngine.ts` 等 4 处)。
- 双通道重复导出:`src/workflows/index.ts:2-4` 同时 export * cold-start、knowledge-rescan、project-index 三桶 — 同符号三路可达(shim 目录本身每文件+index 双份 re-export,如 `cold-start/index.ts:1-3` 与 `cold-start/ColdStartPlan.ts:1` 重复)。

## 死区与重复

- **buildProjectIndexGapPlan 别名零外部消费**:`src/host-agent-workflows.ts:82`+`src/plans.ts` 导出的 rename 别名,外部 0 处(仅 `test/PublicHostAgentWorkflowEntrypoints.test.ts` 引用);真名 `buildKnowledgeRescanPlan` 才是活口。
- **coverage shim 双份**:`host-agent/CoverageLedgerAdvisor.ts:1`、`host-agent/CoverageLedgerWrite.ts:1` 各为 1 行 `export * from '../coverage/...'`,加 `host-agent/index.ts:1` 整桶 re-export — 同一符号三条路径。
- **IDEAgent 别名全家桶**:shim 文件 + `host-agent/index.ts:7,11-13` 导出 `buildIDEAgentAnalysisPacketFromProjectContext`/`createIDEAgent*` 系列,外部仅 AlembicPlugin 1 个文件消费;HostAgent 与 IDEAgent 两套符号长期并存。
- **presentation/ 与 WorkflowCleanupPolicies 零外部直接消费**(`buildTargetFileMap`/`LanguageExtensionBuilder` ext=0,仅 Core 内 3-4 文件用;`createCleanupPolicyService` 仅本文件自用)— 不是死码,但被冻结门面整层导出,公共面大于实际 wire 面。
- **文档级幽灵**:layer-contract.md 的 project-intelligence blessed import(:51)与 service/panorama 临时例外(:66)所指路径均已不存在于 src(见上 P2)。

关键路径:`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/{workflows,core,daemon}`、`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/docs/layer-contract.md`、`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/host-agent-workflows.ts`、`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic/lib/daemon/`。


---

# 【core-entries-repo】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| src/repository/ | drizzle 表的仓储实现(13 子目录,每目录 2-6 文件) | 35 | `repository/index.ts` + 顶层 `repositories.ts`(容器工厂 repositories.ts:257) |
| repository/base | RepositoryBase 共用基类 | 2 | RepositoryBase.ts |
| repository/bootstrap | generate 环快照仓储(bootstrap_snapshots/bootstrap_dim_files) | 3 | GenerateRepository.ts + BootstrapRepository.ts 兼容壳 |
| repository/evolution | proposals/lifecycle_events/warnings/git_checkpoints/coverage+deep_mining 5 仓 | 6 | ProposalRepository.ts 等 |
| repository/{code,guard,knowledge,memory,search,session,source-graph,sourceref,sync,token} | 各对应 1-3 张表;search/sync 是 raw-SQL 白名单适配器(SearchRepoAdapter.ts:1-8) | 各 2(knowledge 5) | 各 index.ts |
| src/infrastructure/ | 平台设施:config/database/event/io/logging/report/signal/vector | 52 | infrastructure/index.ts(8 行全通配) |
| infrastructure/vector | HNSW/嵌入/分块/持久化,占 infra 近 1/3 | 15 | 经顶层 vector.ts 出口 |
| infrastructure/signal | SignalBus/Aggregator/Bridge/TraceWriter | 5 | 经顶层 **events.ts** 出口(词不一致) |
| src/shared/ | 大杂烩:契约脊+语言服务+ProjectScope+路径/工作区+纯工具 | 37 | shared/index.ts(冻结面,CO1 budget 189) |
| src/types/ | 跨层 wire/快照类型;ProjectSnapshot.ts 452 行 32 export | 10 | types/index.ts |
| src/*.ts 顶层 barrel | 25 个入口共 2100 行,最大 repositories.ts 292 行 | 25 | package.json exports ~60 条 |

## 层级与归属问题
**P0(职责错位)**
- `types/ProjectSnapshot.ts:17` import `service/source-graph/SourceGraphLifecycle`;`types/SnapshotViews.ts:10-11` import `workflows/capabilities/planning/knowledge/*` — types 层反向依赖 service/workflows,import 类型即拉起工作流实现。建议:把 SourceGraphLifecycleResult/EvolutionPrescreen/KnowledgeRescanExecutionDecision 类型下沉 types,或 SnapshotViews 上移 workflows。
- `repository/evolution/CoverageLedgerRepository.ts` 持有 `deep_mining_rounds` 表(schema.ts:707) — 深挖轮次是 curate/generate 概念,挂在 evolution 名下。建议:随四环词重命名归 curate 环仓储。
- `shared/ProjectRegistry.ts:16` import `infrastructure/io/WriteZone` — shared 应为叶层却上引 infra。建议:WriteZone 类型下沉 shared 或 ProjectRegistry 上移。

**P1(边界模糊)**
- `repository/index.ts` 漏导出 `source-graph/`(仅 repositories.ts:96 出口) — `./repository` 与 `./repositories` 双入口覆盖不一致,应一面收口。
- `service/index.ts` 只聚合 10/16 子目录(缺 planFacts/planIntent/planLedger/project-context/recipe-context/source-graph) — plan 环在根入口不可见,与 exports 的 `./service/planFacts` 零散面并存。
- `guard.ts:1-2` 顶层 barrel 互 import(`./events.js`/`./search.js`) — 入口层内部纠缠,barrel 应只指向 service/domain。
- `dimensions.ts:44` 从 `service/project-context/dimensionPlanning/` 出口 — 维度规划实现挂在 project-context 服务下,归属 plan 环还是 context 模糊。
- shared/ 业务契约(CoreContractSpine.ts 1017 行、FieldTaxonomy、FailureTaxonomy)与纯工具(contentHash/tokenUtils/concurrency)同层无分组;OutputBudget 走根 facade、其余走冻结 ./shared(src/index.ts:66-80 注释自述),同一目录两条出口政策。

**P2(命名不清)**
- `repository/bootstrap/` 目录名残留旧词,内容已是 GenerateRepository;物理表名仍 `bootstrap_snapshots`/`bootstrap_dim_files`(schema.ts:295,326) vs drizzle 导出 `generateSnapshots` — 一概念三层三名。
- sustain 环实现在 `service/sustain/`(ProposalGateway/ProposalExecutor…),出口 barrel 却叫 `evolution.ts`(evolution.ts:45,69),domain/repository/types 又都叫 evolution。
- service 子目录命名混用:camelCase(planFacts/planIntent/planLedger/recipeStatus) vs kebab-case(project-context/recipe-context/source-graph) vs 单词(sustain/candidate)。

## 命名词汇观察
概念词清单(范围内):snapshot、wire、contract-spine、taxonomy(Field/Failure)、scope/registry/workspace/markers、guard、signal/event、vector/embed/chunk、proposal/lifecycle/warning/coverage、sourceref/source-graph、candidate/quality、memory、session、token。
多义/混用组:
- **bootstrap↔generate**:目录名+物理表名+兼容壳仍 bootstrap(repository/bootstrap/BootstrapRepository.ts:1-3 自述兼容壳),导出名已 generate;`service/bootstrap/` 里只有 GenerateDedup.ts。
- **evolution↔sustain↔lifecycle↔proposal↔reactive**:五词覆盖同一环 — repository/evolution、service/sustain、types/evolution.ts、types/ReactiveEvolution.ts、shared/lifecycle.ts(通用 Disposable,与 Recipe lifecycle 撞词)、LifecycleEventRepository。
- **plan 词族碎裂**:plans.ts(出口)、service/planFacts、planIntent、planLedger、recipeStatus、workflows/capabilities/planning、dimensionPlanning — 无单一 plan 环屋顶;plans.ts:51 还把 `buildKnowledgeRescanPlan` 改名 `buildProjectIndexGapPlan` 出口(又一层别名)。
- **event↔signal**:EventBus(infrastructure/event)与 SignalBus(infrastructure/signal)同从 events.ts 出口。
- **HostAgent↔IDEAgent**:host-agent-workflows.ts 同协议两套全量前缀类型族(23 处 IDEAgent 平行别名),index.ts:4-59 双份再导。
- **snapshot 三义**:ProjectSnapshot(分析快照)、generateSnapshots(DB 表)、SnapshotViews(投影)。

## 依赖方向
- types→service:`types/ProjectSnapshot.ts:17`;types→workflows:`types/SnapshotViews.ts:10-11`(P0,见上)。
- infrastructure→service:`infrastructure/vector/OllamaEmbedProvider.ts:8` import `service/vector/VectorService` 的 EmbedProvider 接口 — 接口应下沉。
- shared→infrastructure:`shared/ProjectRegistry.ts:16`。
- repository→domain(实体水合,方向可接受但应显式化):`repository/knowledge/KnowledgeRepositoryImpl.ts:4-5`、`repository/evolution/ProposalRepository.ts:19`、`repository/source-graph/SourceGraphRepository.ts:22`。
- 顶层 barrel 互引:`guard.ts:1-2`→events.ts/search.ts;`memory.ts:3`、`repositories.ts:1`→database.ts。
- domain/ 零上引(service/infra/repository 反查为空) — 唯一干净层,可作分层基准。

## 死区与重复
- **死 barrel**:`src/recipe-context.ts`(86 行) — package.json exports 无 `./recipe-context` 条目,内外零 import(对照 project-context.ts 有出口条目);实际外部走 `./recipe-context-capabilities`(3 消费文件)。
- **死表**:`auditLogs`(schema.ts:185)全仓无仓储、无查询消费(仅 schema 自身)。
- **近死出口**:`./capability`(capability.ts)外部三仓零消费,仅 src/test-fixtures.ts 内部引用;`./enhancement` 仅 4 文件、`./report` 仅 3 文件消费 — 可并入根或邻近面。
- **自述无消费者的兼容壳**:`repository/bootstrap/BootstrapRepository.ts:1-2`("工作区内无"消费者,仅兜 release/vendor 深 import)。
- **evolution 类型双源**:`types/evolution.ts`(PatchChange/ContentPatcher 族) vs `domain/evolution/`(EvolutionPolicy/RecipeSimilarity) — 同名词两处类型域。
- **similarity 双路出口**:`shared/similarity.ts` 同时经 `search.ts:78` 与 shared/index 通配导出。
- **exports 面与四环失配**:~60 条 exports 无 plan/generate/curate/sustain 任何一环屋顶;消费热度(Alembic: logging 53/workspace 37/shared 36/host-agent-workflows 23)集中在横切面,环概念只能从 service/ 子目录名猜。

**关键锚点根目录**:`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/src/`(所有相对锚点基于此);exports 表在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/package.json`。


---

# 【agent-repo】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| src/agent/service | 统一服务入口:profile 编译→Runtime 构建→run | 5 | `AgentService.run` (AgentService.ts:45), AgentRuntimeBuilder, AgentRunContracts |
| src/agent/runs | 各任务 run 包装器(构造 AgentRunInput+profile id) | 9 | runPlanAgent/runEvolutionAudit/runModuleMining/runScanAgentTask/runTranslationJson/runRelationDiscovery (runs/index.ts) |
| src/agent/profiles | Profile 定义/注册/编译 + stage 工厂 + 旧 preset 表 | 16 | 12 个 profile id (definitions/), PRESETS (presets.ts:145), AgentProfileCompiler |
| src/agent/prompts | insight 词族 prompt+质量门+工件构建 | 6 | ANALYST/PRODUCER/EVOLVER_SYSTEM_PROMPT, insightGateEvaluator (insightGate.ts:1102) |
| src/agent/runtime | ReAct 主循环+预算/退出/接口契约+PCV 观测 | 26 | AgentRuntime (2720 行), AgentInterfaceContract, AnalyzeGroundingGuard |
| src/agent/strategies | 编排策略 single/pipeline/fanout/adaptive | 6 | resolveStrategy (presets.ts:415 消费) |
| src/agent/policies | 约束引擎 budget/safety/quality | 6 | PolicyEngine, BudgetPolicy |
| src/agent/context(+exploration) | 上下文窗口/探索追踪/nudge | 9 | ContextWindow, ExplorationTracker, l4MemoryPackage |
| src/agent/memory | 分层记忆 Session/Persistent/Embedding | 11 | MemoryCoordinator, SessionStore, ActiveContext |
| src/agent/domain | generate 环证据收集+情景固化(名不副实) | 3 | EvidenceCollector, EpisodicConsolidator |
| src/agent/capabilities | 对 tools/runtime/capabilities 的旧名注册表 | 2 | CapabilityRegistry (CapabilityRegistry.ts:12) |
| src/agent/coordination | fanout 子 run 分片/合并/并发 | 1 | AgentRunCoordinator |
| src/agent/tasks | HTTP 宿主任务 handler(被 Alembic/lib/http/routes/ai.ts 消费) | 2 | AgentTaskHandlers |
| src/tools/kernel | 工具单契约层(请求/决策/结果/路由类型) | 9 | ToolSpec/ToolRegistry (kernel/registry.ts) |
| src/tools/runtime | 工具实现:注册表+路由器+handlers+压缩+缓存 | 39 | TOOL_REGISTRY (runtime/registry.ts), ToolRouter (router.ts:25), handlers/{code,graph,knowledge,memory,meta,terminal} |
| src/tools/runtime/capabilities | promptFragment+工具白名单分组(非工具实现) | 10 | GenerateAnalyze/GenerateProduce/ScanAnalyze/ScanProduce/Evolution/System |
| src/tools/catalog | 能力 manifest/目录(治理面) | 3 | UnifiedToolCatalog(自述合并 CapabilityCatalog+ToolRegistry) |
| src/tools/workflow | 宿主 workflow 注册表 | 1 | WorkflowRegistry(被 Alembic/lib/tools/adapters/WorkflowAdapter.ts 消费) |
| src/ai | Provider 管理+gateway+transport+registry+guard | 33 | AiProviderManager, LLMGateway, LLMTransport, ModelRegistry |
| src/shared, src/types | 并发/token 工具; 疑似死 d.ts | 4 | concurrency.ts, tokenUtils.ts; types/agent.d.ts |

## 层级与归属问题
- **P0** `src/agent/runs/module/ModuleMiningAgentRun.ts:1-10` 整文件只是对 `runs/module-mining/ScopedModuleMiningAgentRun.js` 的 re-export shim;且该 161 行文件同时承载 runModuleMining+runScopedModuleMining 两个入口而文件名叫 Scoped*。建议:合并为 `runs/module-mining/` 单目录、按入口拆名,删 shim(消费者走包 index,无破坏)。
- **P0** prompts/ 职责错位:`insightGate.ts`(1328 行)承载 analysisQualityGate(:664)/evolutionGateEvaluator(:1230)/buildAnalysisArtifact(:452) 等门禁+工件逻辑;`scanPrompts.ts:186` buildScanPipelineStages 是编排 stage 构建;`insightProducer.ts:655` producerRejectionGateEvaluator。建议:prompt 文本留 prompts/,evaluator/artifact/stage-builder 迁出(evaluation/ 或并入 profiles 阶段层)。
- **P0** 同一能力类三名跨两层:`tools/runtime/capabilities/GenerateAnalyze.ts` → agent/capabilities/CapabilityRegistry.ts:15 注册为 `'code_analysis'` → agent/capabilities/index.ts:2 alias 出 `CodeAnalysis`。建议:统一 Generate* 命名,删 agent/capabilities 别名层(agent/index.ts:47-55 同步)。
- **P1** 双配置系统并存:presets.ts(chat/insight/evolution 三 preset,:148/:184/:340)与 profiles/definitions 12 个 profile,profile 靠 `basePreset: 'insight'`(generate.profile.ts:9)回指。建议:preset 降级为 profile 内部默认块,单一 profile 词汇。
- **P1** 双入口惯例不齐:plan/scan/evolution/module-mining/relation/translation 走 runs/ 包装器,而 generate 由主体直构 AgentRunInput(Alembic/lib/recipe-pipeline/generate/execution/AgentRunInputBuilders.ts 引 'generate-session');chat-default/signal-analysis 两 profile 无任何入口。建议:统一"每 profile 一个 runs/ 包装器"或统一 host 直构,二选一。
- **P1** 工具目录收口未完:UnifiedToolCatalog.ts:1-8 自述已合并 CapabilityCatalog+ToolRegistry,但 CapabilityCatalog 仍被 Alembic/lib/http/routes/ai.ts 直接消费;另有第四个 `tools/runtime/adapter/RuntimeCapabilityCatalog.ts`(duck-type 投影)。建议:host 全部迁 UnifiedToolCatalog,adapter 版并入。
- **P1** `agent/domain/` 名字空泛:EvidenceCollector(注释自称 "Bootstrap 质量门控核心组件",EvidenceCollector.ts:4)被 prompts+context/l4MemoryPackage 消费,EpisodicConsolidator 被 memory/SessionStore 消费。建议:拆归 evidence/(或 prompts 同层)与 memory/。
- **P2** agent/index.ts:40-44 架构注释的 preset 表列 `chat|bootstrap|scan`,与实际 PRESETS(chat/insight/evolution)不符——bootstrap 遗词文档漂移。
- **P2** `module.profile.ts` 只是 module-mining/ScopedModuleMiningProfile 的 re-export(module.profile.ts:1-4),与 runs/module 同款双名。

## 命名词汇观察
概念词清单:profile / preset / capability / catalog / manifest / kernel / runtime / handler / strategy / policy / run / stage / workflow / insight / scan / generate / evolution / signal / domain。
- **capability 四义**:① tools/catalog/CapabilityManifest.ts:1(宿主能力 manifest,kind 含 skill/mcp-tool);② tools/runtime/capabilities/Capability.ts:1(promptFragment+工具白名单);③ agent/capabilities/CapabilityRegistry(②的注册表);④ kernel `CapabilityDef`(router.ts:10 权限检查)。
- **insight 词族横跨两环**:insightAnalyst/insightProducer→generate 环 analyze/produce;insightEvolver→sustain 环(EVOLVER_SYSTEM_PROMPT 自称 "Evolution Agent",insightEvolver.ts:62);insightGate 同文件混装 generate 门(insightGateEvaluator)与 sustain 门(evolutionGateEvaluator:1230);preset 'insight' 又是 generate 环别名(presets.ts:15 "冷启动和扫描统一使用 insight preset")。insight 本身不在四环词表里。
- **scan 多义**:runs/scan(冷启动 extract/summarize)vs 主体 sustain/KnowledgeRescanWorkflow 的 rescan vs module-mining 的 scoped 扫描;ScanAnalyze/ScanProduce capability 又对应 scan profile。
- **evolution 双承载**:runs/evolution/EvolutionAgentRun(sustain 审计)与 tools/runtime/capabilities/Evolution.ts(注册名 'evolution_analysis');主体已把 EvolutionGateway→ProposalGateway,Agent 仓词未跟。
- **fanout 两拼法**:profile 模板用 `type: 'fanout'`(generate.profile.ts:14,AgentProfileCompiler.ts:175 特判),presets/resolveStrategy 用 `'fan_out'`(presets.ts:415)。
- **LLM* 词族跨层**:agent/runtime/LLMInputAssembly/LLMInputMeasurement/LLMResultType vs ai/gateway/LLMGateway vs ai/transport/LLMTransport。
- **generate.profile 遗词**:id 'generate-session' 的 title 仍是 `'Bootstrap Session'`(generate.profile.ts:6)。

## 依赖方向
总体干净的三层:agent → tools(12 文件,如 agent/runtime/ToolExecutionPipeline.ts)、agent → ai(agent/runtime/LLMInputAssembly.ts 等 5 文件)、tools/ai 均零反向 import agent(`grep "from '#agent"` src/tools、src/ai 均空);kernel 不 import runtime。可疑点:
- agent/capabilities/CapabilityRegistry.ts:1-8 从 `#tools/runtime/capabilities/*` 逐类 import 再改旧名注册——层间别名桥,是唯一"agent 层重新定义 tools 层词汇"的点。
- prompts→domain(insightGate.ts、insightProducer.ts、scanPrompts.ts import EvidenceCollector),memory/SessionStore→domain/EpisodicConsolidator:domain 被两侧共享但归属不明(见 P1)。
- profiles/definitions/{scan,evolution}.profile.ts → service/AgentRunContracts.ts(类型),而 service→profiles(编译),类型回边靠 contracts 文件解耦,勉强可但 contracts 放 service/ 使"定义层依赖服务层"字面成立。

## 死区与重复
- `src/types/agent.d.ts`:ambient Plan/PlanStep,零 import;且 agent/memory/ActiveContext.ts:187-195 本地重新声明了同名 PlanStep/Plan——重复+疑死,可删验证(tsc 即证)。
- `signal.profile.ts` 'signal-analysis':仅 definitions/index.ts 注册+AgentProfileCompiler.ts:208 一处 mode==='auto' 特判,四仓无任何触发方——与 SPM 信号删除需求(CG-1 保 SignalBus 骨架)直接相关的死面,建议随该需求一并处置。
- `chat.profile.ts` 'chat-default':in-repo 与 Alembic/AlembicPlugin 均零消费(AgentRuntimeBuilder.ts:121 回落的是 preset 'chat' 非该 profile)。
- `AdaptiveStrategy`:agent/index.ts 导出+presets.ts:426 有 case,但全仓无任何 preset/profile 配置 `type: 'adaptive'`——不可达策略。
- `runs/module/ModuleMiningAgentRun.ts` 与 `module.profile.ts`:两个纯 re-export shim(见 P0/P2)。
- `agent/tasks/AgentTaskHandlers.ts` 在仓内零消费,仅 Alembic/lib/http/routes/ai.ts 跨仓消费——非死,但属"宿主表面代码住在引擎仓"的错层残余。

**与主体四环对称的可行映射**(供重构定盘):runs/plan→plan;runs/scan+generate.profile+module-mining→generate;insightGate 的 producer/analysis 门→curate 入口侧;runs/evolution+insightEvolver→sustain。curate 环在本仓无实体(裁判在 Core),不必硬造目录;把 prompts/ 按环改名(generateAnalyst/generateProducer/sustainEvolver/门禁独立)即可让目录树读出四环。


---

# 【main-repo】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| lib/Bootstrap.ts | 应用组合根:装配 Gateway/Audit/Config/SkillHooks 启动运行时 | 1(261L) | `AppRuntime`(Bootstrap.ts:37,bin 三入口共用) |
| lib/cli | CLI 专属服务:ais 扫描/一键 setup/日志 | 3 | `AiScanService`,`SetupService`(bin/cli.ts 消费) |
| lib/daemon | daemon 宿主层:job 执行+job 观测+进程运行时真源 | 13 | `DaemonJobRunner.ts`(1318L),`ProjectRuntimeControl.ts`(1076L) |
| lib/governance | HTTP 路由 Gateway 包装+审计信封 | 2 | `Gateway.ts:1`;constitution/ permission/ 为**空目录** |
| lib/http | Express 宿主:24 路由注册+中间件+SSE/OpenAPI | 40 | `HttpServer.ts`(627L),routes/16 个 |
| lib/infrastructure | 基础设施叶:audit/cache/config/db/rate-limit/realtime | 11 | `AppConfigLoader`,`SqliteDatabaseAccess` |
| lib/injection | DI 容器+8 模块装配+AI 状态 service-locator | 11 | `ServiceContainer.ts`,`ServiceMap.ts`,modules/ |
| lib/platform | macOS 浏览器控制 | 1 | `OpenBrowser.ts`——**零消费**(见死区) |
| lib/project-context | Core ProjectContext 产物的消费侧事实读取 | 1 | `ProjectContextConsumerFacts.ts`(仅 ModuleService.ts:33 消费) |
| lib/project-scope | workspace/daemon 路径解析+scope 分析 | 2 | `resolveAlembicWorkspace`(Bootstrap/bin/daemon 共用) |
| lib/recipe-pipeline | Recipe 四环:plan/generate/curate/sustain | 37 | plan 1 文件;generate 30;curate **0 代码**(仅指针 README);sustain 6 |
| lib/repository | 审计仓储(单文件目录) | 1 | `AuditRepository`(仅 injection 装配) |
| lib/sandbox | Seatbelt 沙箱策略/执行/违规解析 | 7 | `SandboxExecutor`,`SeatbeltProfileBuilder` |
| lib/service | 领域服务杂烩:cleanup/module/skills/vector/wiki/handler-runtime | 15 | `ModuleService`(949L),`CleanupService`(888L),`WikiGenerator`(1094L) |
| lib/shared | 底层公共:package 资产/shutdown/schemas/语义税则 | 7 | `package-assets.ts`,`shutdown.ts` |
| lib/tools | @alembic/agent 工具契约的主体侧 adapter+V2 上下文工厂 | 7 | `ToolContextFactory`(AgentModule.ts 消费),adapters/6 |
| lib/types | 环境类型+wire 类型(§10.2/§10.6) | 8 | `search-wire.ts`,`graph-shared.ts`,5 个 .d.ts |
| lib/workflows | 残余三目录:completion/project-context/skill-delivery | 7 | `ProjectContextWorkflowFacts.ts`(1661L 神文件) |
| lib/generated | 提交的 codegen 产物 | 1 | `dashboard-api-types.ts`(64KB) |

## 层级与归属问题
- **P0 层契约门禁当前红**:`node scripts/lint-layer-contract.mjs` 报 **41 违规**(Node22 复核过,非假红)。`config/layer-contract.json` 停留在 1dec328,晚于它的 S4 四环搬迁(19732a0/e963607)未回写契约:`recipe-pipeline`/`project-context` 两个 area 未声明(每文件报 "area not declared"),已删除的 `resident`(c1819e7)仍在 areas 与 allowedRuntimeImports。
- **P0 lint 别名盲区**:`scripts/lint-layer-contract.mjs:29` 的 `ALIAS_TO_AREA` 缺 `#recipe-pipeline`,该别名边不可见——如 http/routes/jobs.ts:22 `#recipe-pipeline/generate/runtime/GenerateEfficiency.js` 这条 http→recipe-pipeline 运行时边完全逸出契约。
- **P0 workflows 残余三目录归属**:`workflows/completion` 唯一消费者是 recipe-pipeline/generate/execution/AiDimensionFinalizer.ts:20;`workflows/skill-delivery` 唯一消费者是 generate/execution/GenerateConsumers.ts:26 → 两者实为 generate 环收尾步骤,建议并入 recipe-pipeline(generate/finalize 或 sustain)。`workflows/project-context` 被 plan(PlanSelectionGate.ts:28)/generate(ColdStartWorkflow.ts:57,66)/sustain(KnowledgeRescanWorkflow.ts:66,78)/daemon(DaemonJobRunner.ts:16)共用 → 确是共用事实层,建议下沉与顶层 `lib/project-context` 合并成独立 fact 层,workflows/ 目录随之消亡。
- **P1 双 project-context 目录同名异层**:`lib/project-context/ProjectContextConsumerFacts.ts` 与 `lib/workflows/project-context/ProjectContextWorkflowFacts.ts` 名字几乎相同、层级不同、互不引用,AI 无法从树上读出分工(前者=Core 产物消费读取,后者=工作流事实构建)。
- **P1 curate 环空壳**:lib/recipe-pipeline/curate/ 仅 README(实现在 Core `KnowledgeService`+http/routes/knowledge.ts),四环目录一环无代码——保留占位可以,但与"从目录树读出架构"目标冲突,README 已自述为指针,建议在 wire-contract 层面注明。
- **P1 service 是无主题杂烩**:cleanup(垃圾桶清理)/module(模块扫描)/skills(resident skill 加载+hooks)/vector(上下文增强)/wiki(文档生成)/handler-runtime(响应信封)/FileChangeDispatcher(pub-sub) 七种职责共居;其中 wiki 唯一运行时消费者是 workflows/completion/CompletionSteps.ts:34(动态 import)→ wiki 实际是 generate 收尾产物;handler-runtime 的信封是"历史 MCC-compatible/resident"契约(envelope.ts:2-3),消费者仅 SkillFileService 与 generate/runtime/GenerateRefine.ts。
- **P1 daemon 13 文件三群未分组**:job 执行群(DaemonJobRunner/Services/WorkflowHelpers/WorkflowTypes),job 观测群(JobDisplaySnapshotStore/JobProcessEventRecorder/JobProcessEventArtifacts/PcvObservabilityLinkage),进程运行时群(DaemonSupervisor/FileMonitorStatus/ProjectRuntimeControl/ProjectRuntimeSourceOfTruth/RuntimeBoundary)。DaemonJobRunner.ts:12-15 直接编排四环(runDeepMiningRounds/runModuleMiningWorkflow/runGeneratePlanGate)——它是"pipeline 的 daemon 驱动器",与纯进程管理不同责。
- **P2 单文件目录**:platform/(1)、repository/(1)、project-context/(1)、tools/v2/(1)——v2 目录只剩 ToolContextFactory,"v2"版本号目录名已无对照物(V1 已在 Agent 仓收敛)。
- **P2 governance 空目录**:lib/governance/constitution/、lib/governance/permission/ 均为空目录,树上是噪音。

## 命名词汇观察
概念词清单:plan/generate/curate/sustain(四环)、dimension、mining(deep/module)、coldstart、rescan、evolution、completion、skill-delivery、project-context、project-scope、runtime、daemon、resident、gateway、envelope、workflow、job。
多义/混用:
- **workflow(最重灾)**:目录 lib/workflows ≠ 文件名后缀 *Workflow.ts(8 个,其中 4 个在 recipe-pipeline:ColdStartWorkflow/GenerateWorkflow/ModuleMiningWorkflow/KnowledgeRescanWorkflow)≠ daemon/DaemonJobWorkflow* ≠ tools/adapters/WorkflowAdapter(@alembic/agent 的 WorkflowRegistry 适配)。四种"workflow"互不相关。
- **runtime**:lib/Bootstrap 的 AppRuntime、daemon/ProjectRuntime*、daemon/RuntimeBoundary、injection/AiRuntimeStatus、service/handler-runtime、recipe-pipeline/generate/runtime/、execution/RuntimeInitializer+DimensionRuntimeBuilder——至少 5 层不同含义。
- **evolution 残留**:EvolutionGateway→ProposalGateway 已统一,但 sustain/evolution/ 目录、EvolutionMaintenanceSweep、http/routes/evolution.ts、DaemonJobRunner 的 EvolutionCoverageLedgerRepository 类型仍用旧词,与 sustain 环名并存(sustain vs evolution 二词一义)。
- **resident 残留**:lib/resident 已删(c1819e7),但词汇存活于 config/layer-contract.json areas、service/skills/SkillFileService.ts:4("resident service")、handler-runtime/envelope.ts:2、shared/schemas/mcp-tools.ts 等 10+ 文件。
- **bootstrap**:文件已改名 Bootstrap.ts(=AppRuntime 启动器)且 S4 已做 bootstrap→generate 改名,但全 lib 仍有 52 文件含 bootstrap 字样(部分是 MCP 工具名 alembic_bootstrap 的合法引用,需甄别)。
- **job**:daemon job(执行单元)vs http/routes/jobs.ts(展示 API)vs Core ALEMBIC_JOB_* 常量,语义一致但层次未标注。

## 依赖方向
(观测边来自 `lint-layer-contract.mjs --report`:152 运行时边/38 type-only)
- **反向:daemon→workflows(1 边)** DaemonJobRunner.ts:16 `releaseProjectContextWorkflowSessionByProjectRoot`——契约不允许(daemon 允 [project-scope,resident,shared]),证实 project-context 事实层被上下两层同时抓取。
- **反向:workflows→infrastructure(1 边)** ProjectContextWorkflowFacts.ts:31 `../../infrastructure/database/SqliteDatabaseAccess.js`,契约违规项。
- **准循环:recipe-pipeline↔workflows** 运行时 rp→workflows 7 边(上列锚点)+ 反向 type-only workflows→rp:ProjectMapModules.ts:9 `import type { GenerateFileEntry } from '#recipe-pipeline/generate/execution/AgentRunInputBuilders.js'`——事实层与四环互相知晓,合并/下沉后消解。
- **service-locator 反抓 injection**:recipe-pipeline→injection 2 边(GenerateRefine.ts:13、AiDimensionPreparation.ts:5 `getAiRuntimeStatus`);workflows→injection 1 边(CompletionFinalizer.ts:97 动态 `getServiceContainer`);http routes 内 `getServiceContainer` 共 **144 处**(http→injection 27 边)——AD4 只修了 service/tools 两处,pipeline/workflows 的 reach-through 仍在。
- **http 直穿四环**:routes/candidates.ts:47 动态 import `GenerateRefine.js`、routes/jobs.ts:22 `GenerateEfficiency`——其余 14 路由都走 ServiceContainer,仅这两条绕过 DI 直连 generate/runtime,且 jobs.ts 这条对 lint 不可见(别名盲区)。
- **cli→project-scope**(SetupService.ts:65)契约未允——属契约漏登而非真问题(bin/cli.ts:44 同样直用)。

## 死区与重复
- **lib/platform/OpenBrowser.ts(87L)零消费**:`openBrowserReuseTab`/`hasMacOSBrowserControlGranted` 全仓(lib/bin/test/scripts)无引用,platform 目录随之整体悬空。
- **lib/tools/adapters/WorkflowAdapter.ts(133L)零消费**:类与 default export 均无引用(AgentModule 只用 ToolRouterAdapter 来自 @alembic/agent)。
- **lib/tools/adapters/MacSystemCapabilities.ts(84L)零消费**:`MAC_SYSTEM_CAPABILITY_MANIFESTS` 无任何注册点(对比 SKILL_CAPABILITY_MANIFESTS 在 AgentModule.ts:21 被装配)。
- **lib/tools/adapters/SkillAdapter.ts(461L)+DashboardOperationAdapter.ts(135L)产码零消费**:仅 test/unit/SkillAdapter.test.ts 与 vendor Core 边界测试引用;运行时装配走的是 manifests+`createDashboardOperationHandlers`(http/utils/dashboard-operation.ts),adapter 类本体成孤儿。
- **lib/service/vector/RecipeRegionFixtureGeneration.ts(470L)仅自测消费**:唯一引用是 test/unit/RecipeRegionFixtureGeneration.test.ts,无生产调用方。
- **sustain/evolution/FileChangeHandler.ts(10L)兼容 shim**:自述"R1 compatibility shim",唯一消费者是 test/unit/InProcessFileChangeHandler.test.ts——生产代码已直连 InProcessFileChangeHandler,shim 可删(改测试 import)。
- **重复对:双 FileChange 处理轨**:sustain/evolution/DaemonFileChangeCollector.ts(720L,daemon 原生 watch)与 InProcessFileChangeHandler.ts(498L,in-process 反应式)+service/FileChangeDispatcher.ts(133L,HTTP 推送 pub-sub)三条文件变更入口并存——非 bug(双宿主设计),但目录上一条在 sustain/、一条在 service/,层级未讲清同一事实流。

**核心供料结论**:统一重构的最大杠杆是①回写并扩展 config/layer-contract.json+lint 别名表(把 recipe-pipeline/project-context 纳管、删 resident,当前 41 红);②消灭 lib/workflows(completion/skill-delivery 归 generate 环,project-context 与顶层同名目录合并为独立事实层);③service/ 按消费者拆解(wiki→generate 收尾,skills/handler-runtime→resident 遗产归宿待定);④清 6 处零消费文件与 2 个 governance 空目录。


---

# 【plugin-repo】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| `lib/bootstrap.ts` | app 级启动器(Core db/audit/SkillHooks 装配),与 Recipe cold-start 无关 | 1(235L) | `BootstrapComponents`(lib/bootstrap.ts:24) |
| `lib/cli/` | 安装/Setup 服务,实际被 runtime 消费而非 CLI | 1(909L) | `SetupService.ts`←ClaudeCodeHostAdapter.ts、HostMcpServer.ts |
| `lib/infrastructure/` | audit/cache/config/database 适配器;零向上导入(干净) | 7 | AppConfigLoader.ts、SqliteDatabaseAccess.ts |
| `lib/injection/` | DI 组合根:ServiceContainer+ServiceMap+7 模块(App/Guard/Infra/Knowledge/Signal/SkillHooks/Vector) | 9 | ServiceContainer.ts、ServiceMap.ts(165L) |
| `lib/recipe-generation/` | Recipe 生产域:plan 根散件+generate/+host-agent-workflows/+evolution/+vector/ | 37 | index.ts 仅 `export * from './contracts.js'`,消费者全走深路径 |
| `lib/repository/` | 单文件 42L 技能知识仓储 | 1 | ProjectSkillKnowledgeRepository.ts←KnowledgeState.ts、ProjectSkillService.ts |
| `lib/runtime/` | 宿主运行时:host-adapter(cc/codex)、host-agent surface、MCP server+handlers、status/preflight/diagnostics | 87 | bin/host-mcp.ts:10→`lib/runtime/index.js`(20L,唯一 bin 入口) |
| `lib/service/` | 检索/任务/技能/模块/清理服务+project-knowledge-context 子系统(28 文件)+resident 客户端 | 50 | ProjectSkillService.ts(794L)、AlembicResidentServiceClient.ts(2201L) |
| `lib/shared/` | 包资产、project-scope runtime、shutdown、zod schemas | 5 | schemas/mcp-tools.ts(lib 内 8 消费者) |
| `lib/types/` | ambient d.ts + 2 个 wire 类型文件 | 6 | graph-shared.ts/search-wire.ts 零消费(见死区) |
| `lib/workflows/` | skill 完成工作流能力,唯一域消费者是 recipe-generation | 4 | WorkflowSkillCompletionCapability.ts |

## 层级与归属问题
**P0 职责错位**
- 四目录循环:recipe-generation→workflows(`dimension-completion.ts:43-44` import `#workflows/...`)→service(`WorkflowSkillCompletionCapability.ts:3` import `#service/skills/ProjectSkillService.js`)→runtime(`ProjectSkillService.ts:15` import `#codex/ProjectSkillDelivery.js`)→recipe-generation(`tool-router.ts:25,33`、`handlers/host-agent/generate.ts:12`)。建议:workflows 并入 recipe-generation;ProjectSkillDelivery 下沉 service。
- recipe-generation 直接反向依赖 runtime:`cold-start.ts:31-34`、`knowledge-rescan.ts:40-41`、`dimension-completion.ts:17` import `#codex/HostProjectAlignment|host-agent/HostAgentAnalysisSurface|KnowledgeState|status/OnboardingContract`。域层不应认识宿主 surface;这些 build* 投影函数应归 recipe-generation 或中立 contracts 层。
- recipe-generation 依赖组合根 injection:`cold-start.ts:35`、`knowledge-rescan.ts:42`、`knowledge-index-rebuild.ts:1`、`recipe-region-vector.ts:2-3` import `#inject/ServiceContainer`。type-only 但锁死方向,应改依赖接口。
- `lib/cli/SetupService.ts` 名为 cli 实为 runtime 内部依赖(消费者 ClaudeCodeHostAdapter.ts、HostMcpServer.ts),无 CLI 入口。建议归 runtime/setup。

**P1 边界模糊**
- `lib/runtime/runtime/` 双重嵌套;顶层文件用自指路径 `../runtime/X` 导入同目录(`ModuleBoundary.ts:1-2`、`ToolPolicy.ts:2,8`、`PluginRegistry.ts:3`)——目录改名残留。EmbeddedRuntimeContract.ts 仅 9L 单消费者(ModuleBoundary.ts)。
- runtime alias 仍叫 `#codex`(package.json imports `#codex/*`→`./lib/runtime/*`),双宿主(DH-0~7)后名不副实;shim 注释仍说"旧 #codex/mcp/... 路径"。
- `#governance/*` alias 指向不存在的 `lib/governance/`(package.json:28-30)——死 alias。
- plan 环文件散在 recipe-generation 根(plan-tool.ts 378L、plan-confirm.ts 488L、plan-generation-gate.ts 557L、project-context-anchoring.ts 351L、canonical-module-axis.ts 96L),与主体 `recipe-pipeline/plan/` 不对称。
- `lib/repository/` 单文件目录,与 service/skills 同域,不值一层。

**P2 命名不清**
- `lib/runtime/daemon-status.ts`:PDR-3 注释自认 daemon-less、恒 null/'stopped',但 8 个消费者(StatusService.ts、Diagnostics.ts、EnhancementRoute.ts 等)仍以 DaemonStatus 命名传递——应更名 HostRuntimeStatus 类。
- `tool-router.ts:9` 注释指向不存在的 `host-agent/bootstrap.js`(实际 alembic_bootstrap 走 plan-generation-gate.ts:160+cold-start.ts)。
- mcp 下四种 tool 词并存:`core-tools/`、`local-tools/`、`public-tools/`、`knowledge-context-tools/`(各自 output.ts),taxonomy 无单一定义处;PluginToolSurfaceCatalog.ts(379L)最接近。
- god files:`handlers/search.ts` 2520L、`handlers/agent-public-tools.ts` 2435L、`HostMcpServer.ts` 1154L、`tool-router.ts` 1026L。

## 命名词汇观察
- **recipe-generation vs recipe-pipeline**:同一域两名。主体四环映射→ plugin 侧:plan=根散件;generate=`generate/`(GenerateTaskManager/EventEmitter)+`host-agent-workflows/{cold-start,generate-workflow,dimension-completion}`(≈主体 ColdStartWorkflow/GenerateWorkflow/ModuleMining);curate=`host-agent-workflows/{recipe-evidence-gate,completeness-critic}`(埋没,主体 curate 是指针 README);sustain=`evolution/`+`host-agent-workflows/knowledge-rescan`(≈KnowledgeRescanWorkflow)。`host-agent-workflows` 是传输视角命名,四环是生命周期视角——统一为 `recipe-pipeline/{plan,generate,curate,sustain}` 可直接落位,`coverage-*`/`briefing-budget`/`project-data-root` 归 generate 支撑件。
- **bootstrap 三义仍存**:lib/bootstrap.ts(app 启动器)、service/bootstrap(RG9 shim→generate)、alembic_bootstrap(MCP 工具名=coldStart)。Bootstrap 字样残留于 generate-event-types.ts、GenerateTaskManager.ts、types/generate.d.ts。
- **evolution 三处目录**:recipe-generation/evolution(实)、runtime/evolution(shim)、service/evolution(shim)。
- **codex 撞词**:`#codex/*`=runtime alias,与真 CodexHostAdapter.ts 同词异义。
- **agent 系**:host-agent(实)/ide-agent(17L 别名 shim,标 G6 清理)/host-adapter 三词;FileChangeHandler(shim)/HostAgentFileChangeHandler(实)/FileChangeDispatcher(死接口)。
- **workflows 三层同词**:`lib/workflows`、`host-agent-workflows`、`@alembic/core/host-agent-workflows`。

## 依赖方向
- 循环(上节 P0 首条)与 recipe-generation→runtime/injection 反向是仅有的两类违规;infrastructure/shared/types 零向上导入(干净)。
- runtime→service 13 文件(handlers/search.ts、guard.ts、HostMcpServer.ts…)+runtime→injection(McpServer.ts、HostMcpServer.ts)方向正常——runtime 事实上是组合顶层。目标分层 infra→service→recipe-pipeline→runtime 只需拆掉上述反向锚点即可成立。

## 死区与重复
- **15 个 RG9/P12/P13 shim 全部零 lib/bin 消费者**——唯一引用是 `test/unit/RecipeGenerationSkeleton.test.ts:18-31`(白名单枚举)+`:147-150`(反向断言 lib 不再 import 旧路径)。移除条件("消费者全部切到 #recipe-generation/*")已满足,清理时机成熟,动作=删文件+同步 skeleton test 白名单:
  - `lib/service/bootstrap/{BootstrapEventEmitter,BootstrapTaskManager}.ts`、`lib/service/vector/LocalEmbedding.ts`、`lib/service/evolution/{FileChangeHandler.ts,git-diff-checkpoint/index.ts}`
  - `lib/runtime/evolution/PluginOpportunisticEvolution.ts`、`lib/runtime/mcp/host-agent-workflows/*.ts`(8 个,含 project-index.ts)
  - `lib/recipe-generation/evolution/FileChangeHandler.ts`(消费者仅上述 service shim+`test/unit/HostAgentFileChangeHandler.test.ts:3` 的 legacy 别名断言)
  - `lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`(G6 标记;仅 HostAgentAnalysisSurface.test.ts 引用,注意其"旧插件缓存"保留理由需确认插件缓存已刷新)
- **零消费文件**:`lib/service/FileChangeDispatcher.ts`(接口,lib/test 全零引用)、`lib/types/graph-shared.ts`+`lib/types/search-wire.ts`(全仓零 import)、`lib/runtime/JobContext.ts`(19L,仅被 runtime/index.ts 盲转出,零真实消费者)、`lib/shared/schemas/http-requests.ts`(仅 test/integration/ZodSchemas.test.ts,HTTP daemon 已删)。
- **重复实现**:无真正双实现(evolution/vector 的"重复"均为 shim 转发);`recipe-generation/vector/LocalEmbedding.ts` 与 `service/vector/LocalEmbedding.ts` 是实/shim 关系,非分叉。


---

# 【dashboard-repo】

## 目录职责表(AlembicDashboard/src, 82 文件)
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| `.`(根) | 入口+巨型胶水:god-container、API 层、类型、payload 构建、Header 视图模型混居 | 7 | `main.tsx`→`App.tsx`(1315 行);`api.ts`(4278 行,`export const api`);`types.ts`(762 行) |
| `components/Views` | 9 个 tab 页 + 非 View 的 Panel/Card 混装 | 15 | `RecipesView` `CandidatesView` `KnowledgeView` `GuardView` `JobsView` `SkillsView` `DepGraphView` `ModuleExplorerView` `HelpView` `GenerateProgressView`(默认导出名却是 `BootstrapProgressView`) |
| `components/Layout` | 壳层:侧栏/头部/抽屉/命令板/scope 面板 | 5 | `Sidebar` `Header`(1079 行,含 runtime 诊断面板) `Drawer` `CommandPalette` `ProjectScopePanel` |
| `components/Modals` | 4 个模态框 | 4 | `RecipeEditor` `CreateModal` `SearchModal` `LlmConfigModal` |
| `components/Shared` | 可复用展示件(markdown/code/drawer/分页) | 10 | `DrawerContent` `HighlightedCodeEditor` `MarkdownWithHighlight` `Pagination` |
| `components/ui` | 无业务原子组件(shadcn 风格) | 11 | `ui/index.ts` 桶导出 |
| `components/Panels` | 仅 1 个已死文件 | 1 | `AuditLogPanel.tsx`(零消费,见死区) |
| `components/Charts` | 仅 1 图表 | 1 | `TokenUsageChart`(只被 HelpView 用) |
| `components/Skeletons` | 加载骨架 | 3 | `KnowledgeSkeleton` `RecipesSkeleton` |
| `hooks` | 认证/权限/socket 进度/job 事件/UI 状态 | 5 | `useAuth` `usePermission` `useGenerateSocket` `useJobProcessEvents` `useDrawerWide` |
| `utils` | 业务工具混杂:通知/错误/job 事件缓存/证据状态/来源标签 | 8 | `notification.tsx` `error.ts` `JobProcessEvents.ts`(572 行) `EvidenceStatus.ts` |
| `i18n` + `locales` | 语言上下文 + en/zh 各 ~2000 行字典 | 4 | `i18n/index.tsx` `useI18n`;`locales/{en,zh}.ts` |
| `constants` | tab 定义+维度分类+语言表+icon 尺寸 | 2 | `constants/index.ts:57` `validTabs`;`GENERATE_DIM_LABELS` |
| `generated` | 后端契约产物(wire 类型/失败分类/28 路由表) | 3 | `api-types.ts`(2402 行,权威链注释在头部) |
| `lib` | socket 单例 + `cn()` | 2 | `lib/socket.ts` `getSocket` |
| `theme` | 深色模式 Provider | 1 | `theme/index.tsx` `useTheme` |

## 层级与归属问题
**P0 职责错位**
- `api.ts`(4278 行)= HTTP client + ~40 个 normalize 函数 + ~60 个接口类型 + SSE 投影 + 120+ 方法单对象(`api.ts:3069` `export const api`)。类型该并入 `types.ts`/generated,normalize 是纯投影层,方法该按后端路由族拆(backend `Alembic/lib/http/routes/` 有 24 个路由文件,前端却是单文件)——结构上完全读不出路由对应关系。
- `App.tsx`(1315 行)god-container:持有 SPM 扫描状态(`App.tsx:160` `useState<SPMTarget[]>`)、冷启动(`App.tsx:676` `handleColdStart`)、recipe 保存/删除、candidate 晋级等 20+ handler 再 prop-drill 进各 View(`App.tsx:1232-1242` 一次传 8 个 handler 给 ModuleExplorerView)。四环业务逻辑全部住在壳里。
- `RuntimeDiagnosticsPanelModel.ts`(src 根)只服务 `components/Layout/Header.tsx:14`——视图模型放仓库根,归属应随 Header。
- `KnowledgePayload.ts`(src 根)只被 `App.tsx:21` 与 api.ts 消费,是 knowledge 域的构造器,无域目录可归。

**P1 边界模糊**
- `components/Views` 内 `EvolutionPanel.tsx`、`ContextAwareSearchPanel.tsx`、`ScanResultCard.tsx`(627 行)不是 tab 页:EvolutionPanel 被 `RecipesView.tsx:22` 内嵌,后两个被 `ModuleExplorerView.tsx:9-10` 内嵌。Views=路由页 的约定被破坏,且 `components/Panels/` 目录同时存在。
- `EvolutionPanel.tsx:763` 从组件文件导出 API 函数 `fetchEvolutionCounts()` 给 RecipesView 用——数据获取逻辑住在兄弟组件里。
- `hooks/useAuth.ts:53`、`usePermission.ts:104` 直接 `axios.post('/api/v1/auth/...')`,绕过 `api.ts:60` 的共享 `http` 实例(baseURL/拦截统一失效风险)。
- `utils/JobProcessEvents.ts`(572 行,localStorage 缓存+语义分类)与 `hooks/useJobProcessEvents.ts` 同名分居两层;`utils/EvidenceStatus.ts`、`SourceLabels.ts`、`efficiency.ts` 都是域逻辑而非通用 util。

**P2 命名不清**
- 文件名/导出名/tab 名三方不一致:文件 `GenerateProgressView.tsx` → 默认导出 `BootstrapProgressView`(`GenerateProgressView.tsx:528,705`)→ `App.tsx:42` 又 import 成 `BootstrapProgressView`;tab `'project-pyramid'` 渲染 `DepGraphView`(`App.tsx:1138-1139`);tab `'spm'` 渲染 `ModuleExplorerView`(`App.tsx:1222-1223`)。AI 无法从任一名字推出另两个。
- `components/Panels`(1 死文件) vs Views 里的 *Panel:同词两义。

## 命名词汇观察
概念词清单:recipe / candidate / knowledge(entry) / lifecycle / skill / guard(rule+violation+audit) / evolution(proposal+warning) / bootstrap / generate / coldStart / scan / rescan / extract / job / target / module / spm / project-scope / runtime(boundary+diagnostics) / dep-graph / project-pyramid。
多义/混用(bootstrap 型五词交叠再现):
1. **bootstrap≈generate≈coldStart≈scan≈rescan** 全指知识生产:`api.bootstrap`+`handleColdStart`(`App.tsx:676`)、`useGenerateSocket`(注释"bootstrap progress events",`useGenerateSocket.ts:2`)、i18n 同一视图混用 `t('generate.*')` 与 `t('bootstrap.pipelineLabels.*')`(`GenerateProgressView.tsx:155,171`)、`constants/index.ts:4` `GENERATE_DIM_LABELS` 内含 `'bootstrap'` 维度值。四环 generate 环在此仓有 5 个名字。
2. **spm/module/target**:`SPMTarget` 类型(`types.ts`)、sessionStorage 键 `asd:spm:*`(`App.tsx:173`)、tab `'spm'`、i18n `moduleExplorer`+死键 `spmCompare`(`zh.ts:1654`)、后端 `/commands/spm-map`(`api.ts` grep)。SPM 是 Swift 遗留词泛化成"模块"。
3. **candidate 双源**:candidates=lifecycle `pending|staging` 的 knowledge(`api.ts:3089`),但 ScanResult 的 `promoteToCandidate` 又是另一动作——curate 环入口词不统一。
4. **panel**:目录名、组件后缀、Header 内嵌诊断区三义。
5. **asd** 前缀残留(`theme/index.tsx:17` `'asd-dashboard-theme'`、`App.tsx:173`)——旧产品名未随品牌统一。

## 依赖方向
- 总体单向健康:ui←Shared←Views←App;api.ts 不依赖 components;无循环 import 发现。
- 反向味道:`RecipesView.tsx:22` `import EvolutionPanel, { fetchEvolutionCounts }`——页面依赖兄弟页面的数据函数(应上提 api 层)。
- 跨层:`hooks/useAuth.ts:12`、`usePermission.ts:15` 直接 `import axios` 建独立请求路径,与 `api.ts:60` `axios.create({baseURL:'/api/v1'})` 平行双通道。
- `api.ts:3224,3334` 内混用原生 `fetch('/api/v1/modules/scan/stream')` 与 axios 实例——同文件两套传输。
- 后端路由↔前端结构不可互读:backend `signals.ts/wiki.ts/governance.ts/file-changes.ts` 路由在 dashboard 零调用(api.ts 无匹配);前端 `api` 对象仅靠注释分节,无与 `generated/api-types.ts:936` `DASHBOARD_API_ROUTES`(28 路由契约表)的任何绑定。

## 死区与重复
- **`components/Views/KnowledgeGraphView.tsx`(1003 行)零消费**:find-exec 全仓 grep 仅自身命中;连带 i18n 死命名空间 `knowledgeGraph`(`zh.ts:591`,RecipesView 命中的是别的 key 前缀需复核)、`knowledgeGraphRelations`(`zh.ts:1864`,零消费)。
- **`components/Panels/AuditLogPanel.tsx`(187 行)零消费**;audit 能力实际活在 `GuardView.tsx:512,524` `api.getAuditLogs`——重复实现,Panels 目录可整目录删。
- **api.ts 死方法**(全仓无 `api.X(` 调用):`summarizeCode` `translate` `knowledgeRecordUsage` `knowledgeUpdateQuality` `getLogs` `getProposalStats` `getWarningStats`(anchor:`api.ts:3069` 对象内,方法名 grep 零命中于组件)。
- **generated 契约表零运行时消费**:`DASHBOARD_API_ROUTES`/`DASHBOARD_API_RESPONSE_SCHEMAS`/`DASHBOARD_FAILURE_TAXONOMY`/`DASHBOARD_JOB_KINDS`/`DASHBOARD_API_CONTRACT_VERSION` 在 src 与 scripts/*.mjs 均无 import(仅 `DASHBOARD_FAILURE_KINDS` 被 `api.ts:12` 用)——2402 行产物大半是"运"而不"用"。
- i18n 死命名空间:`spmCompare`(`zh.ts:1654`)零消费;`sandbox`(`zh.ts:1017`)仅 Header 一处待核。
- tab `'spm'` 相关整链(ModuleExplorerView/ScanResultCard/ContextAwareSearchPanel/`asd:spm:*` 缓存)与未 deliver 的「SPM 页+信号系统删除」需求(CG-1)重叠——重构分组时应标记为待删区而非重命名区。

**四环映射现状**:plan=无视图;generate=`GenerateProgressView`+`JobsView`(+bootstrap/coldStart/scan 五词);curate=`CandidatesView`+`KnowledgeView`(candidate 双义);sustain=`EvolutionPanel`(藏在 RecipesView 内,无独立 tab,后端 `/evolution/*` 路由)。产物视图=`RecipesView`。目录树读不出四环——若统一,`components/Views` 按 `{plan,generate,curate,sustain,runtime}` 分组+api.ts 按同轴拆分是最短路径。


---

# 【naming-families】

## 目录职责表
| 目录 | 职责一句话 | 文件数 | 主要导出/入口 |
|---|---|---|---|
| Alembic/lib/recipe-pipeline | Recipe 生命周期四环 plan/generate/curate/sustain | 37 | GenerateWorkflow.ts、KnowledgeRescanWorkflow.ts |
| Alembic/lib/daemon | daemon job 排程与运行时边界 | 13 | DaemonJobRunner.ts、DaemonSupervisor.ts |
| Alembic/lib/http | REST/SSE 路由层 | 40 | routes/jobs.ts、routes/candidates.ts |
| Alembic/lib/service | 杂项服务(vector/wiki/skills/handler-runtime) | 15 | FileChangeDispatcher.ts |
| Alembic/lib/injection | DI 容器与模块装配 | 11 | ServiceContainer.ts、modules/AppModule.ts |
| Alembic/lib/tools | 宿主工具适配(adapters+v2 孤岛) | 7 | v2/ToolContextFactory.ts |
| Alembic/lib/workflows | completion/project-context/skill-delivery 工作流 | 7 | ProjectContextWorkflowFacts.ts |
| Alembic/lib/sandbox | seatbelt 沙箱执行 | 7 | SandboxExecutor.ts |
| Alembic/lib/Bootstrap.ts | 进程 DI 装配根(bin/* 唯一入口) | 1 | 消费者 bin/api-server.ts、bin/cli.ts、bin/daemon-server.ts |
| AlembicCore/src/domain | 领域实体(knowledge/dimension/evolution/recipe-context) | 49 | KnowledgeEntry.ts、UnifiedDimension.ts |
| AlembicCore/src/service | 领域服务(16 子目录含 plan* 四目录) | 179 | KnowledgeService.ts、planFacts/project-info-tree.ts |
| AlembicCore/src/workflows | 工作流意图/呈现(project-index+capabilities) | 74 | capabilities/host-agent/GenerateSession.ts |
| AlembicCore/src/repository | SQLite 仓储 | 35 | knowledge/KnowledgeRepositoryImpl.ts |
| AlembicCore/src/core | AST/静态分析/发现 | 64 | analysis/CallGraphAnalyzer.ts、AstAnalyzer.ts |
| AlembicCore/src/infrastructure | db/io/logging/signal/vector 基建 | 52 | database/、signal/ |
| AlembicCore/src/daemon | daemon 契约(JobStore 等,无进程) | 8 | JobStore.ts:23 DaemonJobRecord |
| AlembicCore/src/*.ts(根) | 公共 API facade(capability.ts 等 ~30 个) | ~30 | index.ts、knowledge.ts、plans.ts |
| AlembicAgent/src/agent | in-process Agent 主体(runs/profiles/prompts/runtime) | 103 | runtime/AgentRuntime.ts:138 |
| AlembicAgent/src/tools | 工具 kernel/catalog/runtime handlers | 53 | kernel/registry.ts:39 ToolSpec |
| AlembicAgent/src/ai | provider/transport/gateway | 33 | AiProviderManager.ts |
| AlembicPlugin/lib/runtime | 宿主运行时大杂烩(mcp/host-agent/ide-agent/evolution/status…) | 87 | mcp/HostMcpServer.ts |
| AlembicPlugin/lib/recipe-generation | 宿主侧生成链(plan-tool/generate/evolution) | 37 | plan-tool.ts、generate/GenerateTaskManager.ts |
| AlembicPlugin/lib/service | 宿主服务(knowledge/task/resident/evolution shim) | 50 | project-knowledge-context/recipe-map/ |
| AlembicDashboard/src | React UI | 78 | hooks/useGenerateSocket.ts、types.ts |

## 层级与归属问题
- P0 AlembicPlugin/lib/runtime(87 文件): mcp/host-agent/ide-agent/evolution/diagnostics/preflight/status 混居,且有嵌套 `runtime/runtime/RuntimeContext.ts`——"runtime"已无区分度;建议按主体四环先例拆出协议层(mcp)/宿主适配(host-adapter)/生成链归 recipe-generation
- P0 双宿主结构不镜像: 主体 `recipe-pipeline/{plan,generate,curate,sustain}` vs Plugin `recipe-generation/{plan-tool.ts,generate,evolution}`——同一生命周期两套目录词(sustain vs evolution),AI 无法从树读出等价;建议 Plugin 侧改四环同名
- P1 Core service/ 下 plan 家族四目录(planFacts/planIntent/planLedger/recipeStatus)靠 re-export 链粘合(planLedger/planLedger.ts:1-2 仅转发 planIntent+recipeStatus);建议合并为 service/plan/
- P1 Alembic/lib/service/handler-runtime(envelope.ts/problem.ts/types.ts)是 MCP 协议类型却挂在 service 下(types.ts:63 McpSession);建议归 shared/schemas 或 http
- P1 Alembic/lib/project-context 仅 1 文件 ProjectContextConsumerFacts.ts,真逻辑在 lib/workflows/project-context/——同概念两目录
- P2 Alembic/lib/tools/v2 仅 ToolContextFactory.ts 一文件,"v2"无 v1 对照(消费者仅 injection/modules/AgentModule.ts)
- P2 Core repository/bootstrap/ 与 service/bootstrap/ 目录名残留(内容已是 GenerateRepository.ts/GenerateDedup.ts)
- P2 Agent runs/module/ 装 ModuleMiningAgentRun.ts 而 runs/module-mining/ 装 ScopedModuleMiningAgentRun.ts——同族分居两目录
- P2 微目录: Alembic/lib/platform(仅 OpenBrowser.ts)、lib/repository(仅 AuditRepository.ts)

## 命名词汇观察(全空间词族扫描)
**① candidate/entry/knowledge/recipe｜混乱度:中高** — 真相已单源: KnowledgeEntry.ts:3 明言"candidate 与 recipe 不是两个实体,而是同一 KnowledgeEntry 的 lifecycle",knowledge_entries 表存全体(SearchRepoAdapter.ts:84)。混用面: HTTP 路由用 /candidates(candidates.ts:30)、Core service/candidate/CandidateAggregator.ts、RecipeRecord(RecipeContextMap.ts:24)+RecipeRecordLite(recipe-map/mounting.ts:22)+KnowledgeEntryWire(KnowledgeWire.ts:95)+KnowledgeEntryJSON(handler-runtime/types.ts:127)+KnowledgeEntryLike(HostAgentFileChangeHandler.ts:22)。建议: 保留"KnowledgeEntry+lifecycle 单实体"为名实相符正解;candidate/recipe 定义为 lifecycle 视图词并写入 wire-contract;收敛 Wire/JSON/Like/Lite 四后缀为 Wire 一种。
**② session｜混乱度:高** — GenerateSession 三处异物同名: Core workflows/capabilities/host-agent/GenerateSession.ts(状态机+store,内含 bootstrap 残词 BootstrapSessionStoreFile:112)、Alembic generate/runtime/GenerateTaskManager.ts:67(私有 class)、Dashboard useGenerateSocket.ts:69(UI 投影)。另四义: McpSession(MCP 连接,handler-runtime/types.ts:63)、SseSessionRegistry(浏览器 SSE,http/utils/sse-sessions.ts:32)、DimensionExecutionSession(维度执行,AiDimensionDispatcher.ts:13)、ProduceSession*(sustain/ProduceSessionRoute.ts:6-58)、MiningSessionStore(host-agent)、RecipeSessionScope(recipeAuthoringSpec.ts:86)。建议: session 只留"一次 generate 运行的可恢复会话"(Core GenerateSession 为正解);MCP/SSE 改 connection;维度执行改 run。
**③ scan/rescan/sweep/mining/analysis｜混乱度:中** — 分工实际成立: scan=冷启动维度扫描(runs/scan/ScanAgentRun.ts、profiles/definitions/scan.profile.ts),rescan=sustain 增量(sustain/KnowledgeRescanWorkflow.ts、Core workflows/project-index/KnowledgeRescanIntent.ts),sweep=维护清扫(sustain/evolution/EvolutionMaintenanceSweep.ts、mcp/host/staging-access-sweep.ts、DecayDetector.ts),mining=深挖(generate/ModuleMiningWorkflow.ts、DeepMiningRoundGate.ts),analysis=静态 AST(core/analysis/)。混乱点: RescanContext.ts 长在 generate 环(generate/execution/RescanContext.ts,rescan 词越环)、cli/AiScanService.ts:2 用 scan 词做独立 CLI 提取通道。建议: 保四分工写成词汇表;RescanContext 更名 IncrementalContext。
**④ insight｜混乱度:中高** — 本属 generate(冷启动分析)环: Agent prompts/insightAnalyst.ts+insightGate.ts、日志前缀 [Insight-v3] 43 处(AiDimensionSessionRunner.ts:111,310)、Dashboard preset 'insight'(i18n/locales/en.ts:1281)。但 mcp-tools.ts:45 的 operation 'insights'=Recipe 质量分析,是另一义;gateRules.ts:138 又把 insightGate 词写进 Core 单源表。建议: 保 insightAnalyst/insightGate(generate 环 persona,名实相符);日志前缀 [Insight-v3] 带版本号入名,改 [generate];knowledge operation 'insights' 改 'quality'。
**⑤ dimension｜混乱度:高** — 类型链三层+四散: UnifiedDimension 单源(domain/dimension/UnifiedDimension.ts:15,56 处)→BaseDimension(workflows/capabilities/planning/dimensions/BaseDimensions.ts:21)→DimensionDef 竟有两定义(types/ProjectSnapshot.ts:238 与 shared/testMode.ts:16,共 167 处引用);外加 CandidateDimension(planFacts/project-info-tree.ts:965)、SkillDimensionDef(SkillCompletionCapability.ts:32)、ModuleDimensionTarget 三处定义(见死区节)。建议: UnifiedDimension 为唯一实体(名实相符),DimensionDef 收敛为单处投影类型,删 testMode.ts 副本。
**⑥ tool/capability/handler/action｜混乱度:capability 高、tool 中** — tool: ToolSpec(Agent kernel/registry.ts:39,V1/V2 收口后的单源契约)vs 两个异义 ToolDefinition(Agent catalog/UnifiedToolCatalog.ts:39 vs Plugin runtime/ToolPolicy.ts:10);ToolAction 双定义(kernel/registry.ts:19 vs context/exploration/PlanTracker.ts:36)。capability 五处四义: Core capability.ts=文件写权限探针(CapabilityProbe)、Core workflows/capabilities/=宿主工作流面、Agent agent/capabilities/CapabilityRegistry.ts、Agent tools/runtime/capabilities/=工具分组(ScanAnalyze.ts/GenerateProduce.ts)、Plugin workflows/capabilities/={completion,execution}。handler 四处含义一致(MCP/工具处理器)。建议: kernel ToolSpec 保为单源;Plugin ToolPolicy 的 ToolDefinition 改 ToolPolicyEntry;capability 词保留给探针义,工作流目录改 surfaces、工具分组目录改 groups。
**⑦ job/task/run｜混乱度:中** — 三层其实分工成立: job=daemon 排程单位(Core daemon/JobStore.ts:23 DaemonJobRecord、Alembic daemon/DaemonJobRunner.ts、MCP alembic_job),task=generate 内维度任务(GenerateTaskManager,Alembic :228/Plugin :162 双实现),run=Agent 一次执行(agent/runs/*AgentRun.ts、AgentRuntime.ts:138)。破格点: GenerateTaskManager 内嵌 class GenerateSession(task 层造 session 词)、agent/tasks/ 仅 AgentTaskHandlers.ts 一文件(task 词侵入 agent 层)、UiStartupTasks.ts(startup 杂用)。建议: job/task/run 三层定义写入 AlembicCore/docs/wire-contract.md 词汇表;agent/tasks 并入 runs。
**bootstrap 残留复查**(先例治理后仍存): HTTP 路由 `/api/v1/candidates/bootstrap-refine`(http/routes/candidates.ts:30)、BootstrapSessionStoreFile(GenerateSession.ts:112)、Core repository/bootstrap/+service/bootstrap/ 目录名、MCP 工具名 alembic_bootstrap(外部面保留是有意的);Alembic/lib/Bootstrap.ts 是"进程 DI 装配"另一义,同词异义仍在树上。

## 依赖方向
- 健康单向: 宿主→Core(Alembic/lib 50×`@alembic/core/logging` 等;AlembicAgent package.json `"@alembic/core": "file:../AlembicCore"`);Core 无反向 import,CoreContractSpine.ts:187 仅以字符串登记 consumers
- 层内方向正确: daemon/http 向下 import recipe-pipeline(daemon/DaemonJobRunner.ts、http/routes/jobs.ts);recipe-pipeline 无向上 import cli/http(扫描 0 命中)
- 可疑跨层: Plugin lib/runtime/evolution/PluginOpportunisticEvolution.ts:3 反向 re-export `#recipe-generation/*`(runtime 层暴露生成链符号);injection/modules/AgentModule.ts 直挂 tools/v2 孤岛
- 已知跨仓 drift: 双宿主 module-id 未统一(Alembic/lib/workflows/project-context/ProjectMapModules.ts vs AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts,即备忘 R-1),统一重构时应并入 module-id 单源

## 死区与重复
- **planLedger 死壳**: AlembicCore/src/service/planLedger/planLedger.ts 全文 2 行 re-export(planIntent+recipeStatus),全 Core 对 "planLedger" 的引用仅其自身 index.ts——零外部消费
- **三目录一实体**: Core workflows/cold-start/*.ts 与 workflows/knowledge-rescan/*.ts 均为 1 行 shim 转发 project-index/(cold-start/ColdStartIntent.ts:1)——同一工作流三个目录名
- **兼容壳(自记无消费者)**: repository/bootstrap/BootstrapRepository.ts:1 注明"工作区内无"消费者;Plugin RG9 shim 三处(runtime/evolution/PluginOpportunisticEvolution.ts、service/evolution/FileChangeHandler.ts、recipe-generation/evolution/FileChangeHandler.ts,均 ≤6 行转发)——有移除条件记录,统一重构可一次清算
- **真双实现(非 shim)**: GenerateTaskManager 两仓各数百行(Alembic generate/runtime/GenerateTaskManager.ts:228 vs AlembicPlugin recipe-generation/generate/GenerateTaskManager.ts:162);KnowledgeRescanWorkflow 双宿主平行(Alembic sustain/ vs Plugin host-agent-workflows/knowledge-rescan.ts);types/generate.d.ts 两仓同文件(Alembic/lib/types 与 AlembicPlugin/lib/types 均 DimensionDigest:3)
- **三重类型定义**: ModuleDimensionTarget(Alembic daemon/DaemonJobWorkflowTypes.ts:29、Core workflows/project-index/KnowledgeRescanIntent.ts:40、Alembic sustain/KnowledgeRescanWorkflow.ts:872);DimensionDef 双定义(Core types/ProjectSnapshot.ts:238、Core shared/testMode.ts:16)
- **空环目录**: Alembic/lib/recipe-pipeline/curate/ 仅 README(自述"指针 README:主体侧薄环",实现在 Core+Agent+Plugin)——四环先例里唯一无代码的环,目录树可读性靠 README 撑


---

# 【cross-repo-dupes】

数据齐了,汇总输出。

## 目录职责表(五仓顶层)
| 目录 | 职责一句话 | 规模 | 主要入口 |
|---|---|---|---|
| AlembicCore/src | 引擎单源:project-context/coverage/host-agent 能力、schemas、daemon 契约 | ~120k LOC | `@alembic/core/*` 子路径导出 |
| Alembic/lib | codex 宿主壳:injection+infrastructure+http+cli+recipe-pipeline/{plan,generate,curate,sustain} | lib 全量 | `lib/Bootstrap.ts` |
| AlembicPlugin/lib | cc/codex 双 shell 宿主壳:injection+infrastructure+runtime/mcp+recipe-generation | lib 全量 | `lib/bootstrap.ts`、`plugins/{alembic-codex,alembic-claude-code}` |
| AlembicAgent/src | in-process Agent 运行时:agent/runtime+tools/kernel+shared | ~2.3k 锚点 | `@alembic/agent/*`(package.json:113 依赖 `@alembic/core`) |
| AlembicDashboard/src | 观测 UI,与其他仓仅 trivial 重名(utils/code.ts、isRecord) | 小 | — |

## ①已知双份逐一验证(锚点+差异度+处置)
| 双份 | 锚点 | 差异度 | 处置 |
|---|---|---|---|
| SkillHooks | `Alembic/lib/service/skills/SkillHooks.ts` vs `AlembicPlugin/lib/service/skills/SkillHooks.ts` | 428/428 行,12 diff 行(1.4%,仅注释措辞) | **Core 化高可行**:imports 全是 `@alembic/core/*`(两侧 :19-21),无宿主依赖;Plugin 另有 `SkillHooksModule.ts` DI 注册可保留 |
| schemas/mcp-tools | `Alembic/lib/shared/schemas/mcp-tools.ts`(612 行) vs Plugin 同路径(1483 行) | 导出:共享 12(TOOL_SCHEMAS/SubmitKnowledgeInput/RescanInput/SearchInput…)/main-only 7/plugin-only 11 | 宿主工具面故意分叉,但 12 个共享 Input schema 是重复定义→**共享子集沉 Core,宿主保 delta** |
| schemas/http-requests | main 426 行 vs Plugin 229 行 | 共享 23 导出/main-only 24(main 有 HTTP server)/plugin-only 2 | 同上:共享 23 个 body/query schema 沉 Core |
| InfraModule/KnowledgeModule DI | `*/lib/injection/modules/{InfraModule,KnowledgeModule}.ts` | Infra 204/206 行 diff 43%;Knowledge 489/520 diff 39%(骨架同、绑定集不同) | 绑定属宿主,**不宜整体 Core 化**;但 injection 层 9 个同名文件(含 ServiceContainer diff 38%/ServiceMap 23%)应纳结构级 drift 纳管或提取共享注册骨架 |
| generate-event-types | `Alembic/lib/recipe-pipeline/generate/runtime/generate-event-types.ts`(120) vs `AlembicPlugin/lib/recipe-generation/generate/generate-event-types.ts`(73) | 共享 8 payload(DimensionCompletePayload/ProgressPayload…);main-only 4/plugin-only 1 | 共享 payload 沉 Core;`DimensionHostCompletePayload`(main) vs `DimensionHostAgentCompletePayload`(Plugin)**同概念异名**,合并时统一 |
| B3 模块候选读法 | main `lib/workflows/project-context/ProjectMapModules.ts:23` 走 Core `buildCanonicalCoverageLedgerModuleId`;Plugin `knowledge-rescan.ts:775` 本地 `inferTargetModulePathsFromSourcePath`+:787 才接 Core axis | 读法分叉(R-1 仍 OPEN) | 删 Plugin 本地推导,统一走 `AlembicCore/src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:82/123` |
| shared-asset-manifest | `Alembic/config/shared-asset-manifest.json`(与 Plugin 副本字节同) | 仅管 9 资产:4 skills(shared-sections)+devdocs+templates/instructions+constitution.yaml+config/default.json+recipes-setup | **不管任何 lib 代码**→见④ |

## ②新挖双份(main↔Plugin lib 共 27 个同相对路径文件)
- **字节全同 5 个**(hash 证实):`infrastructure/cache/CacheService.ts`、`infrastructure/cache/UnifiedCacheAdapter.ts`、`infrastructure/config/AppConfigLoader.ts`、`types/graph-shared.ts`、`types/search-wire.ts` → 直接 Core 化。
- **近同(<2%,已开始漂)**:AuditLogger 0.7%、GraphCache 0.6%、`shared/shutdown.ts` 0.8%、SkillHooks 1.4% → Core 化或立即纳门禁。
- **同名同职责中度分叉**:SetupService 13%、CleanupService 17.5%、GenerateTaskManager 18.6%、GenerateEventEmitter 11%、ModuleService 47%、SqliteDatabaseAccess 76%、AuditStore 64%、VectorModule 61% → 逐个判定 per-host 授权或抽共享骨架。
- **测试/构建资产双份**:`test/helpers/express.ts` 0/422 字节同、`test/fixtures/factory.ts` 12/526、`vitest.unit.config.ts` 字节同、`scripts/codemod-rename.mjs` 五仓五份(main↔Plugin 字节同)、lint-doctrine 5 份(main↔Plugin diff 39%)、lint-naming 5 份(7%)、`check-space-edges.mjs` main↔Core diff 34%。
- **Agent↔Core 三份 token 估算**:`AlembicAgent/src/shared/tokenUtils.ts:1,12` vs `AlembicCore/src/shared/tokenUtils.ts:21,42`(estimateTokens/estimateTokensFast 双份),且 `AlembicAgent/src/tools/kernel/registry.ts` 再有一份 estimateTokens;`shared/concurrency.ts` createLimit 双份(Agent 33 行 vs Core 38 行)。Agent 已依赖 Core→直接引用即可。
- **宿主工作流层同名函数对**:`isSpaceContext/isProjectMapContext`(main `ProjectContextWorkflowFacts.ts:1655/1659` vs Plugin `project-context-analysis.ts:935/939`);`isTargetScopedCoverageModuleId`(Core `CoverageLedgerBuilder.ts:75` 带 normalize vs Plugin `coverage-ledger-target-axis.ts:5` 裸 startsWith,**语义偏弱的影子实现**);`normalizeRecipeRef`(Core `recipe-context/interface/refs.ts:16` vs Plugin `recipe-map/mounting.ts:74`);`failureResult`(Core `recipe-context/handlers/shared.ts` vs Plugin `mcp/host/results.ts`);`getProjectRuntimeControlStatePath`(main `daemon/ProjectRuntimeControl.ts` vs Plugin `runtime/HostProjectAlignment.ts`——**跨宿主状态文件路径双实现,drift 即互不可见**);skill CRUD 5 函数(main `SkillFileService.ts` vs Plugin `handlers/skill.ts`)。
- **假双份(已收敛为 shim,勿动)**:Plugin `service/FileChangeDispatcher.ts`(5 行接口)、`handlers/TargetClassifier.ts`(1 行 re-export Core)、`git-diff-checkpoint/GitDiffCheckpointService.ts`(20 行 re-export Core)、Plugin `ContextualEnricher`(32 行 pass-through)、FileChangeHandler 三份全是 rename shim(文件头注释自证)。

## ③边界错位(P0=职责错位/P1=边界模糊)
- **P0 该沉 Core**:SkillHooks(纯 Core 依赖);5 个字节全同 infrastructure/types 文件——尤其 `types/search-wire.ts`/`graph-shared.ts` 是 wire 类型,wire 冻结表在 `AlembicCore/docs/wire-contract.md` 而类型本体却双份留宿主;Plugin `coverage-ledger-target-axis.ts` 与 `knowledge-rescan.ts:775-790` 的本地 module-axis 推导(Core 已有权威实现)。
- **P1 双宿主各养一套确定性 project-context 分析**:main `ProjectContextWorkflowFacts.ts`(1661 行) vs Plugin `project-context-analysis.ts`(941 行),Core `src/workflows/capabilities/host-agent/` 已有 17 个能力文件承接方向,应继续下沉。
- **P1 Core 中的宿主痕迹**(DH 原则 host-name 仅 L3):`AlembicCore/src/daemon/JobStore.ts:15` `DaemonJobSource='codex'|'dashboard'|…`;`src/service/planFacts/collect-project-context.ts:75` 硬编码 `source:'codex-host-plan'`;`src/domain/snippet/Snippet.ts:58` codex/xcode targets;`src/shared/OutputBudget.ts:58-95` 成批 codex 工具名 rawRef(多为注释,低危)。建议 host-neutral 化或参数化。

## 命名词汇观察
- `host-agent-workflows` 三处异义:Core `workflows/capabilities/host-agent/`(能力)、Plugin `recipe-generation/host-agent-workflows/`(工作流)、Plugin `runtime/mcp/host-agent-workflows/`(RG9 shim);main 同域叫 `workflows/project-context` + `recipe-pipeline`。
- generate 域两套目录词:main `recipe-pipeline/generate/runtime/` vs Plugin `recipe-generation/generate/`。
- sustain/evolution 混用:Core `service/sustain/` vs main `recipe-pipeline/sustain/evolution/` vs Plugin `recipe-generation/evolution/`。
- `#codex/` 路径别名残留:Plugin `knowledge-rescan.ts:40-41` 仍 `from '#codex/HostProjectAlignment.js'`,DH 后已是双宿主,别名与实义脱节。
- **同名不同物**:`PcvNodeEvidence`(main `recipe-pipeline/generate/execution/` 812 行=Agent 投影 vs Agent `agent/runtime/` 1667 行=运行时节点证据,90% diff)——是命名冲突不是重复,应改名其一。

## 依赖方向
- 健康:Plugin/main/Agent → `@alembic/core/*` 单向(如 `SkillHooks.ts:19-21`、`ProjectMapModules.ts:3`、Agent package.json:113);未见 Core 反向 import 宿主。
- 可疑:Core→宿主的"字符串级"反向耦合(上节 `codex-host-plan` 等);Plugin 内 `runtime/mcp/host-agent-workflows/*` shim 层→`#recipe-generation/*` 是声明过 owner/移除条件的过渡层,属可控。

## 死区与重复
- main `Alembic/lib/service/vector/ContextualEnricher.ts`(196 行完整 AI 实现)仅 `VectorModule.ts:25` 注册且标"可选,AI dependent",Plugin 侧已退化为 32 行 pass-through——**双宿主能力级差,需决策是保留 main 特性还是同退**。
- `AlembicCore/scripts/lint-consumer-core-imports.mjs`(410 行) vs Plugin 同名(31 行):同名门禁两个体量,职责是否同一需归并判定。
- estimateTokens 在 Agent 仓内即有两份(shared/tokenUtils.ts 与 tools/kernel/registry.ts)+Core 一份=三份。

## ④应进 drift 门禁而未进
现有三层门禁:`Alembic/scripts/check-shared-asset-drift.mjs`(manifest 9 资产=skills/templates/config)、`AlembicPlugin/scripts/check-cross-shell-drift.mjs`(仅 Plugin 内两 shell 的 bin/skills/LICENSE)、manifest selfCheckFiles。**零覆盖**:27 个 main↔Plugin lib 同路径代码文件、test/helpers+vitest.unit.config(字节同)、codemod-rename.mjs(五仓)、Agent↔Core shared/{concurrency,tokenUtils}。
处置优先级:a) 字节同/近同者(5+4 个文件)**Core 化优于门禁纳管**;b) 结构性分叉者(injection modules、SetupService、CleanupService、GenerateTaskManager)进 manifest 新 mode(exact 或显式 per-host 授权声明);c) 三份 estimateTokens、双份 createLimit 直接删宿主副本引 Core,无需门禁。