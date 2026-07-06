# W3 词族统一执行底稿

- 生成:2026-07-02,只读扫描产物(未改任何源码);沿用 S4 批3 底稿方法论(`Design/docs/current/alembic-s4-bootstrap-symbol-map-2026-07-02.md`)
- 范围:`AlembicCore/{src,test}`、`AlembicAgent/{src,test}`、`Alembic/{lib,bin,test}`、`AlembicPlugin/{lib,test}`、`AlembicDashboard/src`(排除 dist/node_modules/vendor/generated;共 1744 个 ts/tsx/js/mjs 文件)
- 权威冻结表:`AlembicCore/docs/wire-contract.md`(下引「wire 行N」即该文件行号);本清单不重复其条目,只在 3-7 引用
- 「出现文件数」= 全范围 `grep -lw` 全词匹配文件数;标注「处」的是原始出现次数
- 风险四层:**A 纯代码内部名(可改)** / **B 持久化值(冻结)** / **C 对外表面(冻结或 alias)** / **D 文案(随产品文案层)**
- 扫描基线:S4 批3a 已落地(Bootstrap*→Generate* 已完成,本文按改名后现状引用路径)

---

## 3-1 进化族(表+保留边界)

### 保留 evolution 作为机制词的边界(建议)

概念四环域词已定:Plan→Generate→Curate→**Sustain**(域目录/facade/service 层已 sustain 化:`AlembicCore/src/service/sustain/`、`Alembic/lib/recipe-pipeline/sustain/`)。evolution 不再是域词,但作为**机制词**必须保留,判据三条:

1. **机制本体保留**:符号指「Recipe 进化提案-决策-执行机制」本体(提案 Proposal、进化决策 EvolutionAction/EvolutionDecision、进化候选 EvolutionCandidate*、进化审计 runEvolutionAudit、反应式进化 ReactiveEvolution*/UnifiedEvolution*、进化预筛 EvolutionPrescreen、机会式进化 PluginOpportunisticEvolution*)→ 保留 evolution。
2. **持久化/wire 冻结锚**:`evolution_proposals` 表(wire 行13)、`/api/v1/evolution/*`(wire 行34)、TransitionTrigger `'evolution-gateway'`(落 `lifecycle_transition_events`,wire 行14)、source `'rescan-evolution'`(wire 行26)——机制词在现场数据里抹不掉,符号层强行 sustain 化会造成「符号叫 sustain、数据叫 evolution」的双词撕裂。
3. **域杂项随域词**:符号只是「sustain 域的归属标签」而非机制语义(如 repository 类型别名前缀、误挂 evolution 的 Generate 概念)→ 去 evolution 化。

结论:进化族的实际改名面很小(下表 6 行);大部队按机制词保留(表 3-1c)。`EvolutionGateway` 遗词注释 = **0 处**(批2 改 ProposalGateway 后已清干净,本次全词扫描无残留)。

### 3-1a 改名项

| 旧符号 | 新符号 | 定义文件:行 | 出现文件数 | 备注 |
|---|---|---|---|---|
| EvolutionCoverageLedgerRepository(type 别名) | 删别名,消费方改直名 CoverageLedgerRepository(或 GenerateCoverageLedgerRepository) | AlembicCore/src/repositories.ts:179 | 13 | coverage_ledger/deep_mining_rounds 是 **Generate deepMining** 概念(wire 行12),别名挂 Evolution 名实不符;DI key `'coverageLedgerRepository'`(ALEMBIC_REPOSITORY_KEYS,repositories.ts:236)中性**不动**;AlembicRepositoryBundle 属性类型引用(repositories.ts:222)同批 |
| EvolutionProposalRepository(type 别名) | 删别名,直名 ProposalRepository | AlembicCore/src/repositories.ts:175 | 5 | 直名类 ProposalRepository(repository/evolution/ProposalRepository.ts)已导出;bundle 属性 `proposalRepository` 中性不动 |
| EvolutionWarningRepository(type 别名) | 删别名,直名 WarningRepository | AlembicCore/src/repositories.ts:176 | 3 | 同上 |
| EvolutionLifecycleEventRepository(type 别名) | 删别名,直名 LifecycleEventRepository | AlembicCore/src/repositories.ts:177 | 4 | 同上 |
| EvolutionGitDiffCheckpointRepository(type 别名) | 删别名,直名 GitDiffCheckpointRepository | AlembicCore/src/repositories.ts:178 | 2 | 同上;五条别名删除后 `@alembic/core/repositories` 导出面收窄,须跑 Core `npm run build:check`+外层 tsc |
| src/evolution.ts(顶层 facade 文件) | 新增 src/sustain.ts 承载内容;evolution.ts 变 `export * from './sustain.js'` shim | AlembicCore/src/evolution.ts:1-69 | 34(外部消费:Alembic 13/Plugin 20/Agent 1) | `@alembic/core/evolution` 是 wire 入口(wire 行37 同族):**exports './evolution' 冻结保留**,新增 exports `'./sustain'` 指向新文件;外层迁移到 './sustain' 列后续批,本批不强制;⚠️ shim 的再导出集合必须与 sustain.ts 字节级同集(见 3-8 第10条) |

### 3-1b 目录与文件评估

| 对象 | 判定 | 依据 |
|---|---|---|
| AlembicCore/src/domain/evolution/(EvolutionPolicy.ts、RecipeSimilarity.ts) | **保留** | 机制词目录:EvolutionPolicy 是进化决策策略本体(update/deprecate verdict);路径拼写 'domain/evolution' 16 文件全 Core 内部,非导出子路径;改 domain/sustain 会与 service/sustain 语义撞车。RecipeSimilarity 放此目录名实偏弱(相似度是通用能力)→ 迁移列**决策项**(可延后,不属 W3 改名) |
| AlembicCore/src/repository/evolution/(Proposal/Warning/LifecycleEvent/GitDiffCheckpoint/CoverageLedger 5 repo+index) | **目录保留**;CoverageLedgerRepository.ts **移出评估** | 4/5 是 sustain 提案机制 repo(机制词成立);CoverageLedgerRepository 是 Generate 概念(wire 行12)住错目录 → 建议移 `repository/coverage/`(非导出子路径,纯内部移动+15 文件路径拼写更新),列**决策项** |
| AlembicCore/src/types/evolution.ts | **保留** | 装 ContentPatcher/LifecycleSupervisor/TransitionTrigger 等进化-生命周期机制类型;冻结值 `'evolution-gateway'`(:69)住这里,文件名与内容一致;'types/evolution' 拼写 7 文件 |
| AlembicCore/src/types/ReactiveEvolution.ts | **保留** | ReactiveEvolution=文件变更驱动进化机制名;拼写引用 1 文件 |
| Alembic/lib/recipe-pipeline/sustain/evolution/(DaemonFileChangeCollector/EvolutionMaintenanceSweep/FileChangeHandler/InProcessFileChangeHandler,4 文件) | **保留** | 域(sustain)/机制(evolution)两级命名,名实相符;拼写 6 文件 |
| AlembicPlugin/lib/recipe-generation/evolution/(9 文件:PluginOpportunisticEvolution、HostAgentFileChangeHandler、git-diff-checkpoint/×7) | **归属错位,列决策项(本批不动)** | sustain 机制住在 generate 域目录(recipe-generation);迁移是结构改动非改名,牵 `#recipe-generation/*` package imports(拼写 11 文件)+dist 布局,建议归 W6/RG9 承载 |
| AlembicAgent/src/agent/runs/evolution/EvolutionAgentRun.ts、profiles/definitions/evolution.profile.ts | **保留(决策项确认)** | 任务预判成立:preset `'evolution'`(AgentRunContracts.ts:10 BuiltinAgentPreset)、profile id `'evolution-audit'`(evolution.profile.ts:5;AgentProfileCompiler.ts:218 有按 id 特判;EvolutionAgentRun.ts:79,84 直构)、skills key `'evolution_analysis'`、projection `'evolution-audit'` 全是「进化决策」语义,名实相符;runEvolutionAudit 经 `@alembic/agent/service` 被主体消费(Alembic/bin/cli.ts:1129、lib/recipe-pipeline/sustain/KnowledgeRescanWorkflow.ts:18) |
| Alembic/lib/http/routes/evolution.ts | **保留** | 对应冻结路由面 `/api/v1/evolution/*`(mount 于 lib/http/provider-contracts.ts:478),文件名与 wire 面一致 |

### 3-1c 机制词保留符号(按族)

| 符号族 | 定义文件:行 | 出现文件数 | 备注 |
|---|---|---|---|
| EvolutionPolicy | AlembicCore/src/domain/evolution/EvolutionPolicy.ts:69 | 11 | 经 src/evolution.ts facade 导出(:8),外层 mock `@alembic/core/evolution` 的测试 4+ 处 |
| EvolutionAction / EvolutionDecision / EvolutionResult | AlembicCore/src/service/sustain/ProposalGateway.ts:28/34/47 | 4/3/3 | 进化决策三元组;⚠️ Agent 侧有同名 EvolutionAction 局部副本(AlembicAgent/src/tools/runtime/handlers/knowledge.ts:762,'update'\|'deprecate'\|'valid'),双定义同形,列同名注记 |
| EvolutionCandidate / EvolutionCandidatePlan / EvolutionCandidateReason / EvolutionAuditRecipe / toEvolutionAuditRecipe / isEvolutionTrackableLifecycle | AlembicCore/src/service/sustain/RecipeImpactPlanner.ts:30/46/24/73/312/302 | 4/7/3/4/3/2 | RecipeImpactPlanner 内 Evolution 词 36 处(任务估 38,实测 36),全机制词;主体 KnowledgeRescanWorkflow.ts:96-97,123 有派生别名 CoreEvolutionAuditRecipe/AgentEvolutionAuditRecipe/EvolutionAuditResult |
| runEvolutionAudit / projectEvolutionAuditResult / EvolutionAgentRun 族 | AlembicAgent/src/agent/runs/evolution/EvolutionAgentRun.ts:46/112(+:5,31,37 局部 interface) | 6/3/1 | 经 runs/index.ts:1 再导出到 `@alembic/agent/service` |
| EvolutionPrescreen / buildEvolutionPrescreen + 载荷字段 evolutionPrescreen | AlembicCore/src/workflows/capabilities/planning/knowledge/EvolutionPrescreen.ts:30/38;字段:types/SnapshotViews.ts:68、host-agent/MissionBriefingSupport.ts:385,410 | 5/3/11 | ⚠️ 字段 `evolutionPrescreen` 进 mission briefing 载荷(宿主 LLM 读)=半 wire,类型与字段整组保留 |
| ReactiveEvolutionReport / ReactiveEvolution 族 | AlembicCore/src/types/ReactiveEvolution.ts:81 | 7 | eventSource 透传契约,外层 handler 消费 |
| UnifiedEvolutionReport / UnifiedEvolutionModuleMiningRoute / UnifiedEvolutionProposalSignal / UnifiedEvolutionChangeLogEntry / runRescanUnifiedEvolution 族 | AlembicPlugin/lib/recipe-generation/evolution/HostAgentFileChangeHandler.ts:106/71/84/95;host-agent-workflows/knowledge-rescan.ts:1514 | 4/1/1/1/2 | ⚠️ MCP 响应字段 `unifiedEvolution`(public-tools/output.ts、core-tools/output.ts、PlanDrivenGenerationGate.test 断言 result.data?.unifiedEvolution)=半 wire 冻结 |
| PluginOpportunisticEvolution* 全族(Verdict/Surface/ServiceGate/GuardDecision/ToolOutcome/build/sample/attach…) | AlembicPlugin/lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts:9-220;runtime/mcp/host/opportunistic-evolution-presenter.ts:12 | 12(build 函数)/4(attach) | 机会式进化面,zod schema 进 MCP 输出(output.ts:148,156) |
| EvolutionMaintenanceSweep(+Options/Result/DriverError/resolve*×2/start*) | Alembic/lib/recipe-pipeline/sustain/evolution/EvolutionMaintenanceSweep.ts:77(43/50/55/219/223);bin/daemon-server.ts:108,206 | 3 | **决策项**:保留(推荐,=执行进化提案的维护扫描)或改 SustainMaintenanceSweep;消费仅 daemon-server+测试 |
| evolutionGateEvaluator / evolution_gate / EvolutionToolCallRecord / isSuccessfulEvolutionToolCall | AlembicAgent/src/agent/prompts/insightGate.ts:1230/1210/1315;stage 名:presets.ts:360 | 3/3/1/1 | ⚠️ `'evolution_gate'` 是 stage 名,进主体 PCV 节点表(Alembic/lib/recipe-pipeline/generate/execution/PcvNodeEvidence.ts:703)→ 落证据信封,冻结 |
| propose_evolution / skip_evolution / evolve(操作串) | Agent 工具契约:tools/runtime/registry.ts:288,303;handlers/knowledge.ts:738,749;虚拟工具名:EvolutionAgentRun.ts:149,281、insightGate.ts:1287、insightEvolver.ts:8 | 10/14 | AI 可见工具操作枚举(prompt+transcript 层),动它=行为漂移非改名;保留 |
| evolution_verified / evolution_proposed / evolution_proposal_upgraded / evolution_skipped(状态串) | AlembicAgent/src/tools/runtime/handlers/knowledge.ts:942,947 | 3/3/2/1 | 工具结果状态,进 run 记录;保留 |
| evolution_analysis(能力键) | AlembicAgent/src/agent/capabilities/CapabilityRegistry.ts:20;evolution.profile.ts:11;presets.ts:338,346 | 5 | 与 3-4 Agent 能力层联动(W6 删别名层时一并定);本批保留 |
| evolutionProposals(Drizzle 表对象) | AlembicCore/src/infrastructure/database/drizzle/schema.ts:379 | 3 | 表名串 `'evolution_proposals'` 冻结(13 文件);TS 对象名与表对应,**不改**(与 S4 对 bootstrapSnapshots 的处理不同:那是域词残留,这是机制词) |
| EvolutionListQuery / EvolutionIdParams(zod) | Alembic/lib/http/routes/evolution.ts:29/37 | 1/1 | 冻结路由的入参 schema,随路由面保留 |
| EvolutionPanel / EvolutionPanelProps + Dashboard evolution.* i18n 段 + agentArchPresetEvolution | AlembicDashboard/src/components/Views/EvolutionPanel.tsx:49/27;i18n/locales/en.ts:1968 段、zh.ts 同段;en.ts:1282 | 2/—/3 | D 层:UI 组件+文案对应冻结 API 面与 preset 名;保留 |
| Evolution(Agent 能力类) | AlembicAgent/src/tools/runtime/capabilities/Evolution.ts:32 | 41(裸词 Evolution,含注释) | 类本体保留(进化决策能力组);其所在目录改名见 3-4 |

---

## 3-2 session 消歧(逐义)

canonical:**session = Generate 生成会话(bs_)及其投影**(义①);其余义逐个改/留。

| # | 符号/义 | 定义文件:行 | 出现文件数 | 判定 | 理由与全部引用点 |
|---|---|---|---|---|---|
| ① | GenerateSession(Core 类)+Manager/Shape/Snapshot/Status/Opts/LeaseError 族 | AlembicCore/src/workflows/capabilities/host-agent/GenerateSession.ts:172(:426/63/94/26/126);GenerateSessionShape:types/ProjectSnapshot.ts:316 | 19(五重同名混计,见⑦) | **留(正解)** | bs_ 生成会话本体;`.asd/bootstrap-sessions/`、`bs_` 前缀冻结(wire 行27)。⚠️ 同文件残留私有 `interface BootstrapSessionStoreFile`(GenerateSession.ts:112)= 批3a 漏网,顺手改 GenerateSessionStoreFile(A 层,1 文件) |
| ② | McpSession → **McpConnection** | Alembic/lib/service/handler-runtime/types.ts:63;AlembicPlugin/lib/runtime/mcp/handlers/types.ts:27;AlembicPlugin/lib/runtime/mcp/McpServer.ts:51(私有) | 3 | **改** | 语义=MCP transport 连接态(非生成会话);全部引用点:两处 export 定义+字段 `session?: McpSession`(Alembic types.ts:75;Plugin handlers/types.ts:39)+McpServer.ts:158 `_session: McpSession`;字段名 session→connection 一并改(纯 A 层,双胞胎文件同批) |
| ③ | SseSessionRegistry → **SseConnectionRegistry** | Alembic/lib/http/utils/sse-sessions.ts:32 | 5(def+消费) | **改(类/文件);函数与载荷两案** | SSE 客户端连接注册表(非生成会话)。符号:SseSessionRegistry(:32,33,137,140,141)、getDefaultSseSessionRegistry(:140)、resetDefaultSseSessionRegistry(:146)、createStreamSession(:155)、getStreamSession(:160);消费:lib/http/routes/modules.ts:28,204,212,358+、ai.ts:51、candidates.ts:18、test/unit/ModulesScanStream.test.ts:39-40。⚠️ HTTP 载荷字段 `sessionId`(modules.ts:214 `res.json({sessionId})`、:362,369)与路由段 `/scan/events/:sessionId`(:401)是 **C 层冻结**;推荐折中案:类+文件名改 Connection,create/getStreamSession 与 sessionId 术语保留(与 wire 字段一致);激进案(函数也改)需接受 TS 层与 wire 字段术语分裂 |
| ④ | DimensionExecutionSession | Alembic/lib/recipe-pipeline/generate/execution/AiDimensionDispatcher.ts:13 | 1 | **留 -Session(不改 DimensionRun)** | 实为 `ReturnType<typeof startTaskManagerSession>` = GenerateSessionShape\|null(TaskManagerDispatch.ts:36-41),对象就是义①的会话句柄,改 DimensionRun 名实反而错;⚠️ 同文件残留字段 `bootstrapSession`(:17 AiDimensionSessionPlan、:31-37)→ **generateSession**(A 层,批3a 残留) |
| ⑤ | ProduceSession* 族(ControllerProduceSessionRequest/Gap、ProduceSessionRoutePlan/Projection/Like、build*/read*) | Alembic/lib/recipe-pipeline/sustain/ProduceSessionRoute.ts:14/6/22/29/58/107/114/144;消费:sustain/KnowledgeRescanWorkflow.ts:91-94,543-813 | 5 | **留** | 语义=「controller 授权的 produce(生成)会话路由」= 义①衍生;⚠️ MCP 入参字段 `produceSession`/`produceSessionGaps`/`produceSessionDimensions`(Alembic/lib/shared/schemas/mcp-tools.ts:469-479;AlembicPlugin/lib/shared/schemas/mcp-tools.ts:1197+、runtime/mcp/tools.ts:98-100、HostMcpServer.ts:1078-1082)与载荷值 `'no-produce-session'`/`'NO_PRODUCE_SESSION'`(lib/workflows/project-context/ProjectContextPresenters.ts:94,141)= C 层冻结,符号名与 wire 字段一致是保留的第二理由 |
| ⑥ | MiningSessionStore(+Config/Serialized) | AlembicCore/src/workflows/capabilities/host-agent/MiningSessionStore.ts:133(89/118) | 5 | **类名留;删 alias 改名项** | 生成挖掘会话存储,session=义①;持久化 `.asd/bootstrap-checkpoint/session-store.json` 冻结(S4 3b 已登记)。⚠️ `export { MiningSessionStore as SessionStore }`+default(:669-670)与 **Agent memory SessionStore**(AlembicAgent/src/agent/memory/SessionStore.ts:171)同名异物,且经 host-agent/index.ts:73 `export *` 泄到 `@alembic/core/host-agent-workflows`(64 外部消费文件的可见面);工作区内 alias 零外部消费(外层 SessionStore 全部来自 `@alembic/agent/memory`:Alembic/lib/recipe-pipeline/generate/execution/{GenerateConsumers.ts:12,DimensionRestoreState.ts:1,DimensionAdmission.ts:1,RuntimeInitializer.ts:151}) → **删 alias+default,Core 内唯一 alias 消费点 GenerateSession.ts:21 改直名**(半 wire 面收窄,跑 build:check+外层 tsc) |
| ⑦ | 私有 class GenerateSession(双胞胎)+局部 type | Alembic/lib/recipe-pipeline/generate/runtime/GenerateTaskManager.ts:67;AlembicPlugin/lib/recipe-generation/generate/GenerateTaskManager.ts:63;AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts:57(`type GenerateSession = ReturnType<typeof resolveGenerateSession>`) | (与①共 19) | **改** | 与 Core 正解类重名消歧:两处私有 class → **GenerateTaskSession**(任务管理器内部会话记录,含 id/tasks/userCancelled);tool-router 局部 type → **ResolvedGenerateSession**;全部 A 层(未导出/局部)。Dashboard `interface GenerateSession`(useGenerateSocket.ts:69,socket 投影)→ 评估改 **GenerateSessionView**,列决策项(S4 已判两义分改,W3 建议收敛掉第五重同名) |
| ⑧ | RecipeSessionScope | AlembicCore/src/types/recipeAuthoringSpec.ts:86 | 9 | **留** | evidence gate 把 Recipe 绑到生成会话(SESSION_NOT_FOUND 语义)= 义①;经 `@alembic/core/knowledge`(src/knowledge.ts:53)+types/index.ts:33+recipe-authoring-spec/{gateRules.ts:23,541,index.ts:22} 导出,Plugin port 实现 recipe-evidence-gate.ts:20,222+drift tripwire 测试(AlembicPlugin/test/unit/recipe-gate-drift-tripwire.test.ts:16,53-55;Core test/RecipeAuthoringSpecDrift.test.ts:25,202、RecipeAuthoringProfile.test.ts:15,28);改名=Core+Plugin 同批且零语义收益 |
| ⑨ | bs_ 前缀 / `.asd/bootstrap-sessions/` / `.asd/bootstrap-report.json` | 生成点:Alembic/lib/recipe-pipeline/generate/runtime/GenerateTaskManager.ts、Plugin 同名文件 | — | **冻结** | wire 行27;B 层,永不随词族批 |
| ⑩ | (扫描新增)SessionRepository 族(SessionEntity/SessionInsert/SessionRepositoryImpl;表 `sessions`) | AlembicCore/src/repository/session/SessionRepository.ts:16/28/41 | — | **留** | 义①的 SQLite 持久化投影;表名 `sessions` B 层冻结 |
| ⑪ | (扫描新增)Agent memory SessionStore(+Serialized/Config)/SessionBudgetSummary | AlembicAgent/src/agent/memory/SessionStore.ts:171(SessionStoreSchema.ts:19);runtime/BudgetController.ts:93 | — | **留** | 第二个正当义:**agent 运行会话**(一次 agent run 的记忆/预算);持久化 `.asd/bootstrap-checkpoint/session-store.json` 冻结;与⑥的冲突由删 Core alias 解决 |
| ⑫ | (扫描新增)局部/port 杂项 | AgentMessage.ts:31 私有 interface Session;Alembic/lib/tools/v2/ToolContextFactory.ts:30 SimpleSessionStore;Core generateDimensionConfigs.ts:99 TierSessionStore;Core SnapshotViews.ts:35 SessionCacheShape;Core HostAgentDimensionCompletionWorkflow.ts:29/74 HostAgentSessionContainer/HostAgentWorkflowSession;主体+Plugin CompletionSession*Like(CompletionTypes.ts:29,35/WorkflowCompletionTypes.ts:29,35);Plugin completeness-critic.ts:32-51 SessionSnapshot*Like;Plugin tool-router.ts:883 SessionTrackerLike;Plugin recipe-evidence-gate.ts:62 GenerateSessionLike | — | **全留** | 均为义①或义⑪的内部投影/port,名实相符;列出仅为防全局替换误伤 |

---

## 3-3 dimension 收敛

| 对象 | 定义文件:行 | 出现文件数 | 判定 | 备注 |
|---|---|---|---|---|
| UnifiedDimension | AlembicCore/src/domain/dimension/UnifiedDimension.ts:15 | 9(全 Core:dimensions.ts、types/ProjectSnapshot.ts、domain/dimension/{DimensionCatalogPayload,DimensionRegistry,index}.ts、service/project-context/dimensionPlanning/dimensionPlanning.ts:1、workflows/capabilities/planning/dimensions/BaseDimensions.ts:13、test/PlanFactsDimensionDensity.test.ts) | **留(单源)** | 统一维度注册表本体 |
| DimensionDef(正解) | AlembicCore/src/types/ProjectSnapshot.ts:238 | 52(全空间经 `@alembic/core/types`) | **留(单源)** | 注释自述「兼容旧 BaseDimension 字段+新 UnifiedDimension 字段」 |
| DimensionDef(testMode 副本) | AlembicCore/src/shared/testMode.ts:16(`{id: string; [key:string]: unknown}`) | (同串 52 内) | **删副本** | 仅 testMode.ts 内 2 签名用(:106,:108 applyTestDimensionFilter);改法:`import type { DimensionDef } from '../types/ProjectSnapshot.js'` 或泛型 `<T extends { id: string }>`(推荐泛型,避免 shared→types 反向耦合);消费方(getTestModeConfig/applyTestDimensionFilter:AlembicCore/src/workflows/capabilities/planning/dimensions/GenerateTerminalToolset.ts:1、test/SharedBasics.test.ts:12、test/GenerateTerminalToolset.test.ts:3)签名不破 |
| ModuleDimensionTarget(三重定义→Core 单源) | 单源:AlembicCore/src/workflows/project-index/KnowledgeRescanIntent.ts:40(U2b 注释);副本1:Alembic/lib/daemon/DaemonJobWorkflowTypes.ts:29(export);副本2:Alembic/lib/recipe-pipeline/sustain/KnowledgeRescanWorkflow.ts:872(私有) | 6(上 3+消费:Alembic/lib/daemon/DaemonJobWorkflowHelpers.ts、lib/recipe-pipeline/generate/DeepMiningRoundGate.ts、AlembicPlugin/lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts:29 已用 Core 入口) | **收敛到 Core** | 三定义形状完全一致 `{dimensionId; moduleId?; moduleName?; targetRecipes}`;主体两副本删,改 import Core 入口(Plugin 同款先例);DaemonJobWorkflowTypes 的 export 面收窄需同批扫主体消费(Helpers/DeepMiningRoundGate 改 import 来源) |
| BaseDimension | AlembicCore/src/workflows/capabilities/planning/dimensions/BaseDimensions.ts:21 | 3 | **留(过渡层)** | 有 toBaseDimension(UnifiedDimension→旧格式)转换器(:44)+具名消费者(MissionBriefingBuilder/dimension-configs 兼容,注释自述);合并到 DimensionDef 是结构改动,列后续批决策项,W3 不动 |
| CandidateDimension | AlembicCore/src/service/planFacts/project-info-tree.ts:965 | 2(消费:AlembicPlugin/lib/recipe-generation/plan-tool.ts:12 经 planFacts 入口) | **留** | alembic_plan draft 候选维度,名实相符(plan 无状态终稿设计词) |
| SkillDimensionDef(双胞胎) | Alembic/lib/workflows/skill-delivery/SkillCompletionCapability.ts:32(私有);AlembicPlugin/lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts:14(私有) | 2 | **留名,登记双胞胎** | 双宿主复制件(RG 系),名实相符(skill 交付用维度投影);单源化归双宿主 drift 治理(shared-asset-drift 门),非 W3 改名 |

---

## 3-4 capability 全改(含 exports 冻结面判定)

用户已决策 capability 全改;唯一例外 = Core 写权限探针(任务定名「唯一正解」)。

### 3-4a exports 子路径判定(AlembicCore/package.json)

| exports 子路径 | 外部消费(文件) | 判定 | 备注 |
|---|---|---|---|
| `./capability` | 0 | **保留(正解)** | src/capability.ts → core/capability/CapabilityProbe(写权限探针);capability 词在此名实相符,任务已定保留;CapabilityProbe 9 文件(含 Alembic/test/fixtures/factory.ts、test/integration/SourceResolver.test.ts) |
| `./project-context-capabilities` | 8(lib 5:Alembic/lib/project-context/ProjectContextConsumerFacts.ts、lib/workflows/project-context/ProjectContextWorkflowFacts.ts、AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts、lib/service/module/ModuleService.ts、lib/service/project-knowledge-context/project/ProjectGraphProvider.ts;test 3 含 vi.mock 整路径:Alembic/test/unit/ProjectContextWorkflowFacts.test.ts:43、AlembicPlugin/test/unit/{PlanConfirmStatelessSelection.test.ts:12,HostAgentProjectContextScopeParity.test.ts:15}) | **冻结(wire)** | 顶层 facade 文件 src/project-context-capabilities.ts 在 src 根,不受目录 rename 影响;子路径名不改 |
| `./recipe-context-capabilities` | 3(AlembicPlugin/lib/runtime/mcp/handlers/{recipe-map.ts,agent-public-tools.ts};RecipeMapTool.test.ts:322 以字符串断言 handler 源码含此路径) | **冻结(wire)** | 同上 |
| `./workflows/capabilities` | 0(仅 2 处反向断言:Alembic/test/unit/ProjectContextWorkflowFacts.test.ts:1087、AlembicPlugin/test/unit/HostAgentProjectContextDirectSwitch.test.ts:188 均为 not.toContain) | **可改** | 与下 5 条同批 |
| `./workflows/capabilities/host-agent` | 0 | **可改** | 外层实际走 `./host-agent-workflows` facade(64 文件),facade 子路径名不含 capabilit*,不受影响 |
| `./workflows/capabilities/persistence` | 0 | **可改** | |
| `./workflows/capabilities/planning/dimensions` | 0 | **可改** | |
| `./workflows/capabilities/planning/knowledge` | 0 | **可改** | |
| `./workflows/capabilities/presentation` | 0 | **可改** | |

可改 6 条的过渡策略:目录 rename 后 exports 目标路径同批更新;**旧子路径 alias 保留一个版本**(exports 双别名指同 dist 目标,防 release/vendor 快照外不可见消费者,S4 风险6 先例);工作区封闭下也可原子切换(批3a DI key 先例),二选一列决策项,推荐 alias 一版。

### 3-4b 目录改名项

| 对象 | 新名(评估) | 影响面(file:line 级) |
|---|---|---|
| AlembicCore/src/workflows/capabilities/(53 ts 文件;分组 coverage/host-agent/persistence/planning/presentation+RecipeSnapshotTypes.ts+WorkflowCleanupPolicies.ts+index.ts) | **workflows/surfaces**(推荐,「工作流能力面」);备选 support/facets | ① 拼写 `workflows/capabilities` 的 import:36 行/16 文件(src 4:plans.ts、host-agent-workflows.ts、test-fixtures.ts、types/SnapshotViews.ts;test 12:HostAgentSubmissionTrackingReads/GenerateTerminalToolset/PlanFactsDimensionDensity/IDEAgentAnalysisPacketBuilder/ProjectScopeContracts/unit/HostAgentMiningWorkflow/unit/BuildCoverageLedger/GenerateSessionManager/FileDiffSnapshotStore/unit/KnowledgeRescanPlanBuilder/unit/AuditDeadDeprecate/unit/CoverageLedgerAdvisor);② 兄弟相对 `../capabilities/`:8 行/3 文件(src/workflows/index.ts、project-index/KnowledgeRescanPresenters.ts、project-index/ColdStartPresenters.ts);③ 树内相对 import 不跨界,随目录整体移动零改;④ 非 import 路径字符串 10 处:CoreToolSystemBoundary.test.ts:72-74、CoreCodexBoundary.test.ts:73-75(边界 allowlist)、BlessedSingletons.test.ts:57、PublicProjectIntelligenceEntrypoints.test.ts:71,79(动态 import+exports 反向断言)、TargetClassifier.ts:8(注释);⑤ package.json exports 6 条目标路径+dist 布局;⑥ 根 facade(host-agent-workflows.ts/plans.ts/test-fixtures.ts)内部 import 属① |
| AlembicAgent/src/tools/runtime/capabilities/(10 文件:Capability.ts、RuntimeCapability.ts、Conversation/Evolution/GenerateAnalyze/GenerateProduce/ScanAnalyze/ScanProduce/System.ts、index.ts) | **tools/runtime/toolsets**(推荐:它们是「按场景打包工具集+提示」的组,与既有 GenerateTerminalToolset 词族一致);任务候选 groups 亦可 | 拼写 `runtime/capabilities`:22 import 行/5 文件(tools/index.ts、capabilities/{index.ts,RuntimeCapability.ts}、agent/capabilities/{index.ts,CapabilityRegistry.ts});类名 Capability(Capability.ts:1)/RuntimeCapability(RuntimeCapability.ts:13)→ Toolset/RuntimeToolset **列决策项并建议排在 W6 之后**(别名层 agent/capabilities 对这两个类有再导出,先删别名层再改类名可少一半联动);Agent 无 `./tools/runtime/capabilities` 独立 exports 子路径(仅 `./tools/runtime`),目录 rename 无包契约影响 |
| AlembicAgent/src/agent/capabilities/(index.ts+CapabilityRegistry.ts) | **W6 删,本批只列** | 消费:agent/index.ts:49-54、runtime/AgentRuntime.ts:35,2074(`CapabilityRegistry.create(name)`)、runtime/LoopContext.ts:15、runtime/SystemPromptBuilder.ts:15、service/AgentRuntimeBuilder.ts:3,73;注意 CapabilityRegistry 不只是别名——它是按能力键('evolution_analysis' 等,CapabilityRegistry.ts:12,20)实例化能力组的运行时注册表,W6 删除方案必须先安置注册表职责 |
| AlembicPlugin/lib/workflows/capabilities/(completion/ 3 文件+execution/ 1 文件) | 与 Core 同词改(**workflows/surfaces**) | 拼写 `workflows/capabilities`:7 文件(lib 3:recipe-generation/host-agent-workflows/dimension-completion.ts:43-44、workflows/capabilities/completion/{WorkflowCompletionFinalizer.ts:5,16,25,CompletionSteps.ts:16};test 4:SemanticMemoryCompletionStep/WorkflowSkillCompletionCapability/HostAgentProjectContextDirectSwitch/WorkflowCompletionFinalizer.test.ts);⚠️ 全部经 `#workflows/capabilities/...` package-imports 字符串(package.json imports `#workflows/*` 映射不变,只改中段路径),TS 可静态查出但必须同批;dist 布局变化影响 release staging |

### 3-4c capability 词冻结/例外站点(不随改)

| 站点 | 层 | 位置 |
|---|---|---|
| MCP 字段 `toolCapabilities` | C 冻结 | 插件 onboarding 契约字段(alembic_status/alembic_bootstrap 输出),7 文件 |
| HTTP `GET /api/v1/ai/agent/capabilities` | C 冻结 | Alembic/lib/http/routes/ai.ts:703-706 |
| daemon 能力 id(`jobs.api-ai.bootstrap` 等 ResidentServiceContracts) | C 冻结 | S4 3b 已登记,复合 id 对外健康面 |
| CapabilityProbe 族(+capability.ts facade) | 正解保留 | AlembicCore/src/core/capability/{CapabilityProbe.ts,index.ts}、src/capability.ts;9 文件 |
| AgentProfileDefinition `defaults.capabilities`/`skills` 字段名 | A 决策项 | Agent profile 定义面字段(presets.ts:338,346 等);建议 W6 随能力层重构一并定,W3 不动 |
| SkillCompletionCapability / WorkflowSkillCompletionCapability 类名 | A 决策项 | 主体 skill-delivery+Plugin execution 双胞胎;「skill 完成能力」业务名,评估保留;若随 toolsets 词改则双仓同批 |
| DirectCapabilityCatalogLike 等 -Like port | A 保留 | Alembic/lib/http/routes/ai.ts:102 等,随其指向的真名走 |

---

## 3-5 insight 文案

| 对象 | 位置(处数) | 判定 | 备注 |
|---|---|---|---|
| 日志前缀 `[Insight-v3]` → **`[generate]`** | 43 处/10 文件:AlembicCore/src/workflows/capabilities/persistence/WorkflowReportWriter.ts(2)、WorkflowResultPersistence.ts(1);Alembic/lib/recipe-pipeline/generate/execution/GenerateConsumers.ts(17)、SessionExecutionBuilder.ts(7)、AiDimensionSessionRunner.ts(6)、DimensionRestoreState.ts(5)、RuntimeInitializer.ts(2)、DimensionAdmission.ts(1)、RescanContext.ts(1)、AiDimensionPreparation.ts(1) | **本批改(D 层)** | 纯日志文案;全范围 0 测试断言该前缀;Core+主体两仓同批(无运行时耦合,各自 commit 亦可) |
| 文件名 insightAnalyst.ts / insightEvolver.ts / insightGate.ts / insightProducer.ts(Agent prompts) | AlembicAgent/src/agent/prompts/;barrel index.ts:1-5 `export *`;消费 11 文件(Agent:AgentStageFactoryRegistry.ts、presets.ts:27-44、scanPrompts.ts:17、strategies/PipelineStrategy.ts+测试 6;主体经 `@alembic/agent/prompts`:lib/recipe-pipeline/generate/execution/DimensionRuntimeBuilder.ts:3 computeAnalystBudget+test/unit/{InsightGate,InsightProducerPrompt,computeAnalystBudget,evolution-gate-evaluator}.test.ts) | **列决策项,本批不改** | 任务定:W6 拆 evaluation 时一并定(随 generate 改 generateAnalyst 等,或按 persona 词保留);文件名藏在 './prompts' barrel 后,rename 无包契约影响,只动 Agent 仓内 import+符号名(insightGateEvaluator/InsightGateStrategyContext(insightGate.ts:160)等随文件名决策) |
| preset `'insight'` | 定义:AlembicAgent/src/agent/service/AgentRunContracts.ts:10(BuiltinAgentPreset='chat'\|'insight'\|'evolution');PRESETS.insight:presets.ts:179;basePreset 引用:generate.profile.ts:9,34、scan.profile.ts:24,34、relation.profile.ts:9、module-mining/ScopedModuleMiningProfile.ts:9,39 等;主体测试:AgentProfileCompiler.test.ts:41,157、GenerateProcessEvents.test.ts:121-291、GenerateSessionExecutionBuilder.test.ts:206 | **列决策项,推荐保留** | 「深度洞察」预设名与 preset 'evolution' 对称,名实相符;preset 名进 process events(preset: 'insight' 断言)= 半持久化,改名成本>收益 |
| Dashboard i18n:agentArchPresetInsight(en.ts:1281/zh.ts:1278/HelpView.tsx:331)、mcpKnowledgeDesc(en.ts:1211/zh.ts:1208)、knowledge.aiInsight(en.ts:572/zh.ts:569;RecipesView.tsx:1163/KnowledgeView.tsx:867) | D 层 | **跟随决策** | preset 与 operation 枚举不改则文案不动;aiInsight 文案对应冻结字段,保留 |
| MCP operation `'insights'` → `'quality'` 评估 | Alembic/lib/shared/schemas/mcp-tools.ts:45,179,197(KnowledgeInput) | **判定:非活跃 wire,本批登记不改** | Plugin(现役 MCP 宿主)knowledge 工具面**无** 'insights' 枚举;主体 handler-runtime(envelope/problem/types)无路由消费;唯一消费=Alembic/test/integration/ZodSchemas.test.ts(schema 自测)→ 属遗留 schema,改 'quality' 无运行时收益;建议归 W6/退役清理(删或改),若改须同批 ZodSchemas.test+mcpKnowledgeDesc 两语言文案 |
| aiInsight / ai_insight | 80/3 文件(列+载荷+Dashboard 渲染,AlembicDashboard/src/types.ts:76、api.ts:2167 等) | **冻结(B/C 层)** | knowledge_entries 列+MCP/HTTP 载荷字段;insight 词在此永不随批 |
| (同串异义)记忆类型 `type: 'insight'` | AlembicAgent/src/agent/domain/EpisodicConsolidator.ts:290,306,405;test/memory-context.test.ts:61-81 | **冻结(B 层)** | 语义记忆条目类型,持久化进记忆库;与 preset 'insight' 同串不同义,防误伤 |

---

## 3-6 实体后缀收敛+同名异物

### 3-6a Wire/JSON/Like/Lite 对照表(knowledge/recipe 实体族)

后缀规范建议:**Wire**=跨进程/LLM 投影权威形状(Core 单源);**JSON**=宿主 handler 层投影(应逐步并入 Wire);**Like**=依赖倒置结构 port(惯例保留;全空间约 140 个 *Like port 不属收敛对象,本表只收实体族);**Lite**=有损轻量投影(保留)。

| 符号 | 定义文件:行 | 出现文件数 | 语义 | 判定 |
|---|---|---|---|---|
| KnowledgeEntryWire(+KnowledgeContentWire/ReasoningWire/QualityWire/StatsWire/ConstraintsWire/RelationsWire 6 伴生) | AlembicCore/src/types/KnowledgeWire.ts:95(:25/34/42/50/67/86) | 3 | LLM/宿主投影权威 | **留(Wire 正解)**;与 exports `./types/search-wire` 同族命名 |
| KnowledgeEntryJSON(双胞胎) | Alembic/lib/service/handler-runtime/types.ts:127;AlembicPlugin/lib/runtime/mcp/handlers/types.ts:96 | 4 | MCP handler 层 JSON 投影 | **登记决策项**:与 KnowledgeEntryWire 语义重叠,方向=并入 Core Wire(消费 Core 类型或改名 *Wire);合并属双宿主结构改动,W3 只登记 |
| KnowledgeEntryLike(4 处定义) | AlembicCore/src/service/recipe-context/adapters/knowledgeReadPort.ts:17(导出正解);AlembicCore/src/workflows/capabilities/host-agent/HostAgentDimensionCompletionWorkflow.ts:119(私有);AlembicPlugin/lib/recipe-generation/host-agent-workflows/dimension-completion.ts:198(私有);AlembicPlugin/lib/recipe-generation/evolution/HostAgentFileChangeHandler.ts:22(局部 type) | 5 | 结构 port | **留**;私有重名不冲突;knowledgeReadPort 件为正解 |
| KnowledgeEntryLite | 不存在 | 0 | — | 任务假设纠偏:无此符号,无动作 |
| RecipeRecord | AlembicCore/src/domain/recipe-context/RecipeContextMap.ts:24 | 7 | recipe-context 域记录 | **留(单源)**;AlembicPlugin/test/unit/PrimeRegionEvidence.test.ts:9 有局部同名 type(Parameters 派生),不冲突 |
| RecipeRecordLite | AlembicPlugin/lib/service/project-knowledge-context/recipe-map/mounting.ts:22 | 3 | recipe map 有损轻量投影 | **留(Lite 语义成立)** |
| RecipeLike(同名异物 ×2) | AlembicCore/src/domain/evolution/RecipeSimilarity.ts:85(相似度入参:title/doClause/coreCode…);AlembicCore/src/service/recipeStatus/contracts.ts:18(状态计算入参:id 必填/lifecycle/toJSON) | 9 | 两个不同形状的 port | **改名消歧(决策项)**:推荐 RecipeSimilarity 侧 → **SimilarityRecipeLike**(消费:sustain/{ConsolidationAdvisor.ts:21,ProposalExecutor.ts:23,RedundancyAnalyzer.ts:15}、test/unit/RecipeSimilarityEmbedding.test.ts:8 deep import);recipeStatus 侧留;注:AlembicPlugin/lib/recipe-generation/vector/recipe-embedding-sim-provider.ts:31 注释已抱怨「RecipeLike 未从 @alembic/core/evolution 导出」——改名同批把新名补进 evolution/sustain facade 导出可顺手解此欠账 |

### 3-6b PcvNodeEvidence 同名异物

| 对象 | 现状 | 改名方案 | 引用点 |
|---|---|---|---|
| Alembic/lib/recipe-pipeline/generate/execution/PcvNodeEvidence.ts(812 行) | stage node map 构建/合并+PCV 契约常量(buildGeneratePcvStageNodeMap/mergeGeneratePcvNodeEvidence/PCV_GENERATE_STAGE_NODE_MAP_CONTRACT) | → **PcvStageNodeMap.ts** | importers 7 lib(AgentRunProcessEvents/AgentRunInputBuilders/DimensionRuntimeBuilder/SessionExecutionBuilder/AiDimensionFinalizer/GenerateConsumers+自身)+3 test(AiDimensionFinalizer/PcvNodeEvidence/GenerateDimensionConsumer.test.ts);测试文件同批 → PcvStageNodeMap.test.ts;⚠️ 契约字符串值 'PCVGenerateStageNodeMap'/'PCVColdStartNodeLocalBaseline' 冻结(S4 3a-3 既定) |
| AlembicAgent/src/agent/runtime/PcvNodeEvidence.ts(1667 行) | 运行时 PCV 证据记录器(createPcvNodeEvidence/recordPcvInputAssembly/recordPcvLlmOutput/recordPcvToolRoundOutcome/PcvNodeEvidenceSummary…) | → **PcvNodeEvidenceRecorder.ts** | importers 6(runtime/{LoopContext,LLMInputAssembly,index,AgentRuntime,AnalyzeGroundingGuard}.ts、prompts/insightGate.ts);文件内导出符号两侧本就不同名,纯文件名+相对 import 更新(A 层) |

---

## 3-7 排除项(wire 冻结,引 wire-contract)

| 名字 | 层 | 依据 |
|---|---|---|
| `evolution_proposals` 表(status: pending/observing/executed/rejected/expired) | B | wire 行13;13 文件 |
| `lifecycle_transition_events` 表+TransitionTrigger `'evolution-gateway'`(AlembicCore/src/types/evolution.ts:69;写入点 service/sustain/ProposalGateway.ts:156) | B | wire 行14 |
| `knowledge_entries.lifecycle` 值(…evolving/decaying…)与 source `'rescan-evolution'` | B | wire 行15、26 |
| `coverage_ledger`/`deep_mining_rounds` 表 | B | wire 行12(Generate 概念,3-1a 别名改名的依据) |
| SignalBus SignalType 全枚举(AlembicCore/src/infrastructure/signal/SignalBus.ts:18-30;值中无 evolution 词,实测 guard/guard_blind_spot/search/usage/lifecycle/exploration/quality/panorama/decay/forge/intent/anomaly) | B | wire 行25 |
| HTTP `/api/v1/evolution/*`(mount:Alembic/lib/http/provider-contracts.ts:478;路由:lib/http/routes/evolution.ts) | C | wire 行34 |
| MCP 工具名 alembic_bootstrap/alembic_rescan/alembic_submit_knowledge/alembic_dimension_complete/alembic_plan | C | wire 行33 |
| session id 前缀 `bs_`、`.asd/bootstrap-sessions/`、`.asd/bootstrap-report.json`、`.asd/bootstrap-checkpoint/`(session-store.json) | B | wire 行27+批3 新增登记(wire 行59-63) |
| SQLite `sessions` 表(AlembicCore/src/repository/session/SessionRepository.ts) | B | 现场数据,同 wire §SQLite 语义(建议顺手补表登记) |
| HTTP 载荷字段 `sessionId`+路由段 `/api/v1/modules/scan/events/:sessionId`(Alembic/lib/http/routes/modules.ts:214,362,369,401) | C | Dashboard/外部消费的 SSE 会话协议;3-2③ 只改 TS 符号 |
| MCP 入参字段 `produceSession`/`produceSessionGaps`/`produceSessionDimensions`+载荷值 `'no-produce-session'`/`'NO_PRODUCE_SESSION'` | C | alembic_rescan 工具 schema(两仓 mcp-tools.ts+Plugin tools.ts:98-100+HostMcpServer.ts:1078-1082);3-2⑤ 保留符号的锚 |
| MCP 响应字段 `unifiedEvolution`(AlembicPlugin/lib/runtime/mcp/{public-tools,core-tools}/output.ts)与 `bootstrapState`/`isBootstrapComplete`/`bootstrapSession` 等 MCP 状态载荷字段 | C | 插件 onboarding/工具响应契约(S4 3b 先例);TS 侧同名 interface 字段若序列化直通,改前须逐字段实证 |
| PCV 证据契约值 'PCVGenerateStageNodeMap'/'PCVColdStartNodeLocalBaseline'/scope 'alembic-cold-start-bootstrap-node-local'+stage 名 `'evolution_gate'`(Alembic/lib/recipe-pipeline/generate/execution/PcvNodeEvidence.ts:703 节点表) | B | 证据信封落运行时 JSON(S4 3a-3 同族);evolution_gate 同为 Agent stage 契约(presets.ts:360) |
| `aiInsight`/`ai_insight`(knowledge 列+载荷+Dashboard) | B/C | 3-5 表末行;80 处/多仓 |
| MCP 字段 `toolCapabilities`、HTTP `GET /api/v1/ai/agent/capabilities`、daemon 能力 id `jobs.*` | C | 3-4c;capability 词冻结面 |
| Agent 工具操作/状态串 propose_evolution/skip_evolution/evolve/evolution_verified/evolution_proposed/evolution_proposal_upgraded/evolution_skipped+能力键 evolution_analysis | C(AI 可见契约) | 进 prompt/工具 schema/run 记录;3-1c 机制词 |
| 包子路径 `@alembic/core/evolution`、`./project-context-capabilities`、`./recipe-context-capabilities`(+既有 repository/bootstrap、service/bootstrap、workflows/cold-start、workflows/knowledge-rescan) | C | wire 行37 同族;'./evolution' 与 './sustain' 双入口方案见 3-1a;workflows/capabilities 6 条例外判定见 3-4a |

---

## 3-8 风险注记(同串不同义/半 wire 联动点)

1. **'evolution' 全局替换必炸**:同一词根横跨 A(repository 别名,可改)/B(evolution_proposals、'evolution-gateway'、'rescan-evolution')/C(/api/v1/evolution/*、propose_evolution 工具串、unifiedEvolution 字段)/D(Dashboard evolution.* 文案)。只能按 3-1a 的 6 行执行符号级替换,禁词根级 sed。
2. **'session' 十二义只动三义半**:实改仅②McpSession、③SseSessionRegistry(类/文件)、⑦私有 GenerateSession 双胞胎+tool-router 局部 type(+⑥删 alias、①残留 BootstrapSessionStoreFile、④残留 bootstrapSession 字段);HTTP `sessionId` 载荷/路由段、`sessions` 表、bs_ 前缀全冻结。IDE 全局重命名 GenerateSession 时五重同名互相污染,必须按定义点逐个 rename。
3. **capability exports 三分面**:冻结 2(project-context-capabilities/recipe-context-capabilities)+保留正解 1(./capability)+可改 6(workflows/capabilities 族)。目录 rename 漏掉 Core 边界测试 allowlist(CoreToolSystemBoundary.test.ts:72-74、CoreCodexBoundary.test.ts:73-75、BlessedSingletons.test.ts:57、PublicProjectIntelligenceEntrypoints.test.ts:71,79)会出现「测试绿但守卫失效」(allowlist 指向不存在路径=守卫空转),属静默回归,须把这 10 处路径串列入改名清单同批核对。
4. **批3a 残留 bootstrapSession 字段是半 wire 混合体**:AiDimensionDispatcher.ts:17(纯内部,可改)与 ProjectContextWorkflowFacts.ts:96,588-625、ProjectContextPresenters.ts:24,38,61,99(`bootstrapSession: input.bootstrapSession.toJSON()` 直通 MCP 载荷)、CompletionSteps.ts:109(进记忆归集 payload)不同层。载荷字段名改动=MCP 响应契约变化,须先真机实证载荷消费方(S4 风险9 同款流程),W3 只改纯内部站点。
5. **Plugin `#workflows/capabilities/*` 是 package-imports 字符串**:7 文件拼写走 `#workflows/*` 别名,别名映射不变但中段路径随目录改;TS 能静态查出,但 dist 布局变化影响 release staging(离线打包按 dist 路径拷贝),Plugin 侧改名需带一次 stage 验证。
6. **Core workflows/capabilities rename 的不可见消费者**:工作区内 0 外部 import,但 release/vendor 快照消费者不可见;推荐 exports 旧子路径 alias 保留一版(3-4a),或改名后立即跑 Core build:check+两宿主 tsc+`npm pack` 目录 diff。
7. **'insight' 同串四义**:preset id 'insight'(半持久化:process events 断言)/记忆类型 'insight'(EpisodicConsolidator.ts:290,306,405,B 层)/aiInsight 列(B/C 层)/[Insight-v3] 日志(D 层,本批唯一改动)。改日志前缀时用整串 `[Insight-v3]` 匹配,不碰裸词 insight。
8. **evolution.ts→sustain.ts shim 的导出同集约束**:facade 现导出 4 型+EvolutionPolicy(domain)+43 个 sustain 符号(evolution.ts:1-69);shim 化后 34 个外层消费文件(含 4+ 处 vi.mock('@alembic/core/evolution') 整模块 mock)依赖导出集合不变,任何漏导都在外层测试才炸;执行时以 `export * from './sustain.js'` 整体转发并跑三仓测试,不做逐符号手抄。
9. **删 5 个 Evolution*Repository 别名+删 MiningSessionStore 的 SessionStore alias 是导出面收窄**:类型别名零运行时影响但 13/5/4/3/2 文件的 import 语句要同批;`@alembic/core/host-agent-workflows` 面上消失一个 SessionStore 名,须 grep 确认外层零引用后再删(本扫描已证工作区内零,vendor 面按第 6 条流程兜底)。
10. **ModuleDimensionTarget/DimensionDef 收敛的方向性**:删副本后主体 DaemonJobWorkflowHelpers.ts、DeepMiningRoundGate.ts 的 import 来源从本仓 types 换成 `@alembic/core/workflows/knowledge-rescan`(Plugin 先例同款),形状一致但 Core 入口 barrel 若未导出 ModuleDimensionTarget 会编译红——执行前先核 Core barrel 导出链(KnowledgeRescanIntent → workflows/knowledge-rescan index);testMode 的 DimensionDef 副本删除推荐泛型化而非反向 import types(shared 层不应依赖 types/ProjectSnapshot 大文件)。

---

## 统计

| 分节 | 条数 |
|---|---|
| 3-1a 进化族改名项 | 6(含 5 条别名删除+1 条 facade shim 方案) |
| 3-1b 目录/文件评估 | 8(保留 6、决策项 2) |
| 3-1c 机制词保留符号族 | 18 族(EvolutionGateway 遗词实测 0 处) |
| 3-2 session 义项 | 12(任务 9 义+扫描新增 3);实改 3.5 义(②③⑦+⑥alias/①④残留),留 8,冻结 1 |
| 3-3 dimension 收敛 | 6(删副本 2 处、收敛 1 组、留 4) |
| 3-4a exports 判定 | 9 子路径(冻结 2、正解保留 1、可改 6) |
| 3-4b 目录改名 | 4(Core、Agent toolsets、Agent 别名层列删、Plugin) |
| 3-4c capability 冻结/例外 | 7 |
| 3-5 insight | 7 行(本批实改 1:43 处日志;决策项 3;冻结 3) |
| 3-6a 后缀对照 | 7 行(改名决策 1:RecipeLike 消歧;登记 1:KnowledgeEntryJSON;纠偏 1:Lite 不存在) |
| 3-6b 同名异物文件 | 2(双侧改名) |
| 3-7 排除项 | 17 |
| 3-8 风险注记 | 10 |
