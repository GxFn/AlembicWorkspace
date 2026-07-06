# Alembic 主体 Recipe 生命周期适配（plan 作为主体 AI Agent 正交前置组件）— 需求设计(strict)

Date: 2026-06-26
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-mainbody-lifecycle-adaptation-2026-06-26
Scope: Alembic 主体(`alembic-ai`,lib/)+ AlembicAgent(`@alembic/agent`,src/)+ AlembicCore(共享内核,plan 契约已 owner)
Grounding: 6-agent 主体真实架构勘探 + **6-agent 全阶段代码级 grounding(A-F,~1.1M tokens,全 file:line 对 HEAD 接地 Core 799ceac/Plugin·Alembic 2090793,见《§4b 全阶段代码级落地》authoritative)**；参照在途 Plugin 伞形需求 [alembic-recipe-lifecycle-global](alembic-recipe-lifecycle-global-2026-06-26.md) + plan 无状态终稿

## 触发与定位

刚完成的几轮需求是 **AlembicPlugin 宿主插件**侧的 Recipe 生命周期逻辑(plan→coldStart/deepMining/moduleMining/evolution),其中 AI = host agent(Claude Code)经 MCP 决策回填。现在要把这套**适配到 Alembic 主体**——主体的 AI 是**进程内** `@alembic/agent`(非 host agent),`plan` 作为主体 AI Agent **新增正交组件**,与现有进化/分析/产出 Agent 正交组合,作为 coldStart 等链路的**前置 precondition**。本需求是**主体侧适配**,不重做 Plugin/Core 已落部分,复用共享内核。

## 1. 主体真实架构 map(全部已核)

### 1.1 主体当前两条(且仅两条)生命周期链
主体 `Alembic/lib/` 全仓 grep `deepMining/moduleMining/generationStage/planSelection/alembic_plan` = **0 命中**。今天只有:
- **coldStart** = `runColdStartWorkflow`(`Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts:90`):full-reset → `buildProjectContextWorkflowFacts` → 维度硬编码 → 异步 AI 填充。
- **rescan** = `runKnowledgeRescanWorkflow`(`Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts:165`):增量 diff → `RecipeImpactPlanner` + `runEvolutionAudit` + 衰退分级 → gap 维度异步填充。
- 唯一调度入口 = `executeApiAiWorkflow`(`Alembic/lib/daemon/DaemonJobRunner.ts:793`):`kind==='bootstrap'`→coldStart(maxFiles/skipGuard/contentMaxLines,**无 plan 入参**,核于 :801-805),else→rescan。**job kind 是二值枚举,无 deepMining/moduleMining kind**。

### 1.2 维度 = 硬编码全量(plan 缺位的根因)
`ProjectContextWorkflowFacts.ts:217` `const dimensions: DimensionDef[] = [...baseDimensions];` 是主体决定"扫哪些维度"的**唯一真源**,直接展开 Core 静态注册表 `baseDimensions = DIMENSION_REGISTRY.map(toBaseDimension)`(`AlembicCore/.../dimensions/BaseDimensions.ts:59`)。唯一裁剪 = 调用方可选传 `intent.dimensionIds`(CLI/MCP 参数,**非 AI 决策**)。规模 = 运行时 `computeAnalystBudget`(token 级,非规划级)。采样范围 = 硬常量 `maxModuleSeeds=6/maxModuleDetails=3/maxFileDetails=8`(`ProjectContextWorkflowFacts.ts:118-120`),**无 moduleBindings**。

### 1.3 AlembicAgent 组合模型
主体没有可实例化的"Agent 对象";一个 agent = 声明式 **AgentProfile**。
- **7 个 profile 族**(`profiles/definitions/index.ts:10-18`):CHAT/SCAN/RELATION/EVOLUTION/TRANSLATION/SIGNAL/BOOTSTRAP。
- **4 个正交 run wrapper**(`agent/runs/index.ts`):`runEvolutionAudit / runRelationDiscovery / runScanAgentTask / runTranslationJson`。
- 模板 = `runEvolutionAudit`(`runs/evolution/EvolutionAgentRun.ts:46`):薄函数,内部 `agentService.run({profile:{id:'evolution-audit'},params,message,context,presentation})`(:78-92)再投影。**precondition 排序由 CALLER(主体 lib)负责**,Agent 内部无"先 X 后 Y"机制。

### 1.4 主体 / AlembicAgent / Core 三者职责
| 维度 | Alembic 主体 | AlembicAgent | AlembicCore |
|---|---|---|---|
| evolution 内核(Gateway/Decay/Proposal/Staging/Lifecycle) | **运行宿主**(DI new + daemon 真跑) | — | **owner**(`@alembic/core/evolution`) |
| knowledge/recipe 落库 | 写入方(同一 alembic.db) | — | schema + repository owner |
| daemon/HTTP/Dashboard/CLI | **owner** | — | — |
| AI 执行 | **in-process** `@alembic/agent` AgentService | runtime/profile/strategy owner | — |
| plan 契约(PlanIntent/PlanSelection) | **0 消费** | 0 实现 | **已 owner 未被主体接**(`service/planIntent`+`service/planLedger`,export `@alembic/core/plans`) |

- evolution 维护真跑证据:`UiStartupTasks.ts:93/97`(`stagingManager.checkAndPromote`)、`:155/163`(`proposalExecutor.checkAndExecute`)、`:184`(`subscribeToSignals`)。主体唯一自有 evolution 薄层 = `FileChangeHandler.ts`,import `EvolutionGateway/ContentPatcher` from `@alembic/core/evolution`(:21-24)。
- **关键架构差异(适配设计核心)**:Plugin AI = host agent 经 MCP `alembic_plan` draft/confirm 决策并**回填 hostAgentContract**(两段跨进程往返);主体 AI = **进程内** `@alembic/agent`,主体侧 `hostAgentContract` 0 命中。**所以主体 plan 不需要回填层 —— 它是"主体内置 AI 自决策、直接产 planSelection、直接驱动下游"。**

## 2. 用户目标 + 完成定义

**用户目标**:把 Plugin 已落的 Recipe 生命周期(coldStart/deepMining/moduleMining/evolution)按主体真实代码适配落地;`plan` 作为主体 AI Agent 新增正交组件,作为 coldStart 等链路的前置 precondition。

**可核完成定义**:
1. **CD-1 plan 组件存在**:AlembicAgent 新增 `plan` profile + `runPlanAgent` run wrapper(与 4 现有 run 并列),`agentService.run({profile:{id:'plan-*'}})` 跑通,输出结构化 `PlanSelection`(复用 `@alembic/core/plans`,不重造契约)。
2. **CD-2 plan 前置接线**:coldStart/rescan 入口消费 `PlanSelection`;`ProjectContextWorkflowFacts.ts:217` 的 `[...baseDimensions]` 改"有 planSelection→`resolvePlanDimensionDefinitions(planSelection.dimensions)`(`BaseDimensions.ts:68`,现成未接),否则回退全量"。
3. **CD-3 四链映射可跑**:coldStart 走现有 bootstrap;deepMining/moduleMining 在主体有真实载体(待 PD-4)并由 planSelection 驱动;evolution 维护链在主体 daemon 真跑(复用 Core,补缺口)。
4. **CD-4 正交不耦合**:plan 是独立 profile/run,不嵌入 bootstrap stage 数组、不放进 Coordinator pre-step。
5. **CD-5 同 schema 贯通**:plan/stage 产出落 `knowledge_entries/recipe_source_refs/evolution_proposals/lifecycle_transition_events`,落库侧零适配。
6. **CD-6 真机验收**:真实测试项目走通 coldStart(plan 前置)→维度按 plan 选→落库→daemon 维护,有 commit hash + 运行 JSON/日志证据。

**非目标**:不重做 Plugin host-agent-workflows/plan-tool/plan-generation-gate;不重写 Core evolution 内核与 plan 契约;不放松 recipe-evidence-gate/evaluateMerge/transition Guard;不动落库 schema。

## 3. plan-as-Agent 组件设计

### 3.1 接入抽象三选一 + 依据
| 选项 | 说明 | 评价 |
|---|---|---|
| **A. 新 AgentProfile + run wrapper(推荐)** | `definitions/plan.profile.ts` 注册进 `BUILTIN_PROFILES`(`definitions/index.ts:10`);`runs/plan/PlanAgentRun.ts` 镜像 `runEvolutionAudit`;主体 lib 在 coldStart 入口前 `agentService.run` 它,输出喂 `buildBootstrapSessionRunInput`。 | **正交**(独立 profile,不入 bootstrap stage)**且 precondition**(caller 先跑、喂 dimensions),与今天"Core 定维度→bootstrap 分派"的 caller 排序一致。 |
| B. Coordinator pre-step | `AgentRunCoordinator` 加 plan 前置步 | **否决**:Coordinator 是单 profile 内 fan-out 机制,耦合进 bootstrap-session 生命周期破坏正交。 |
| C. PipelineStrategy gate | plan 当 bootstrap pipeline 的一个 stage | **否决**:同样耦合进单 profile;plan 需在 ProjectContext 采样后、维度解析前,跨 run 排序不属 intra-run gate。 |

**结论:选 A**。依据:precondition 跨链排序天然属于 CALLER(主体 lib workflows),与 `runEvolutionAudit` 是独立 run、由 `KnowledgeRescanWorkflow` 调用的现有事实同构。

### 3.2 plan 是否需独立 Capability(→ PD-3)
- 若 plan 需 ReAct loop 内用工具(读项目文件/查 graph)→ `src/tools/runtime/capabilities/` 新增 `Plan` RuntimeCapability + 注册 `CapabilityRegistry`(参照 `Evolution.ts`)。
- 若 plan 纯编排(复用 ProjectContext facts + 荐 candidateDimensions,无新工具)→ 只加 profile + run wrapper。

### 3.3 与进化/分析/产出 Agent 正交组合
`plan` run 与 `evolution/scan/relation/translation` run **并列**,经 `agent/runs/index.ts` 导出,主体经 `AgentModule.ts` 同一 `AgentService` 编排。组合点 = 主体 lib caller:plan run 先跑→产 `PlanSelection`→注入 coldStart/deepMining/moduleMining intent→现有"分析(BootstrapAnalyze)/产出(BootstrapProduce)/进化(Evolution)"capabilities 在 bootstrap pipeline 内照常组合。**plan 不进它们的 stage,只喂参数**。

### 3.4 前置接线点(主体 file:line)
- **注入点①(维度,facts 层)**:`ProjectContextWorkflowFacts.ts:217` `[...baseDimensions]` → `planSelection ? resolvePlanDimensionDefinitions(planSelection.dimensions) : [...baseDimensions]`。
- **注入点②(入口,precondition 层)**:`ColdStartWorkflow.ts:90`/`KnowledgeRescanWorkflow.ts:165` 入口前消费 `PlanSelection`;`scale` 下沉覆盖 `computeAnalystBudget`(`DimensionRuntimeBuilder.ts:207`)与采样常量(`ProjectContextWorkflowFacts.ts:117-121`)。
- **dimensions→bootstrap 喂入点**:`AgentRunInputBuilders.ts:215`(`buildBootstrapSessionRunInput` 的 `dimensions:children.map(...)`)——plan 维度经 children 投进 fanout partitioner,**最小新接线**(结构已匹配)。
- **统一触发校验点(硬 gate,PD-5 已定)**:`DaemonJobRunner.ts:793` `executeApiAiWorkflow` 在分派 coldStart/rescan 前先跑 `runPlanAgent`;**plan 失败/无有效 PlanSelection → abort job + surface,不放行下游、不回退全量**。CLI/Dashboard 入口同此硬前置。

### 3.5 无状态契约映射主体 AI(差异处理)
Core `PlanSelection`(`contracts.ts:63-70`:`generationStage/dimensions/scale{totalRecipeBudget,maxFiles,contentMaxLines,depthLevels?}/moduleBindings`)是**内存态不持久**。
- Plugin:host agent MCP draft→confirm→回填 hostAgentContract(两段跨进程)。
- **主体:主体 AI 自决,可压成单段一次 `agentService.run` 直产 `PlanSelection`**(无回填层);draft/confirm 作同一次 plan-profile 运行的内部两段输出。
- 持久层:Core 有 `service/planLedger`(living-ledger),但 plan 无状态终稿主张不持久。**主体应对齐无状态:plan 不写 planLedger,每次 coldStart/rescan 前临场跑一遍**(→ PD-1)。

## 4. 分阶段适配设计(高层意图;代码级落地见 §4b)

> 本表是阶段概览;每项 file:line + change + 可证伪验收见《§4b 全阶段代码级落地》(authoritative)。

| 阶段 | 主体接入点(file:line) | 复用 Core/已有 | 主体需自造等价 | change 类型 | 该阶段验收 |
|---|---|---|---|---|---|
| **coldStart** | `ColdStartWorkflow.ts:90` 入口 + `ProjectContextWorkflowFacts.ts:217` 维度 | bootstrap profile、Core `resolvePlanDimensionDefinitions`(`BaseDimensions.ts:68` 现成未接)、同 alembic.db 落库 | 接线:维度源 `[...baseDimensions]`→plan 驱动 + scale 覆盖 budget 常量 | **接线为主**(直接复用) | 真机 coldStart:plan 选维度生效、维度数=plan.dimensions、scale 覆盖默认 |
| **deepMining(多轮覆盖+覆盖账本)** | 待定:新链路 or `KnowledgeRescanWorkflow` 参数化(`buildDaemonRescanWorkflowArgs` 已支持 dimensions 过滤) | Core `KnowledgeRescanPlanner` executionDecisions、gap/affectedDimensions(已存在) | **主体专属**:多轮覆盖循环 + 覆盖账本;主体 0 处,净增 | **新增载体** | 多轮迭代收敛、覆盖账本随轮推进、达 target 停(→ PD-4 定"深") |
| **moduleMining(per-cell)** | `ProjectContextWorkflowFacts.ts:117-212` 采样层 + 新 module 维度 partitioner | Core `ProjectMap.modules`(单源 module 轴,**不用** Plugin seed)、`selectProjectContextModuleSeeds`(fact 用) | **主体专属**:moduleBindings 驱动 per-module 预算 fan-out(`AgentRunCoordinator` 新 partitioner,按 module 切) | **新增载体** | per-module 预算独立、每 module 产 recipe、module 轴单源 ProjectMap.modules |
| **evolution(衰减+OUTCOME+保鲜)** | `UiStartupTasks.ts:93/155/184`(已真跑)+ `FileChangeHandler.ts` + `runEvolutionAudit`/`auditRecipesForRescan` | **全复用 Core**:DecayDetector/ProposalExecutor/StagingManager/LifecycleStateMachine/ConsolidationAdvisor/ContentPatcher | 缺口补接线:衰减触发 tick/OUTCOME 回写/保鲜(若伞形结论沉淀 Core 则主体复用) | **接线 + 缺口补接**(内核零改) | daemon 真跑 staging 晋升 + proposal 执行 + 衰减分级有运行 JSON 证据 |

- **直接复用** = coldStart 维度解析、evolution 全套内核、落库 schema、Core plan 契约。
- **主体专属适配** = plan profile/run(AlembicAgent 净增)、deepMining 多轮+覆盖账本、moduleMining per-cell fan-out、各 workflow 的 plan 前置接线。
- ⚠️ 命名消歧:`ColdStartWorkflow.ts:95` 已有 `buildColdStartWorkflowPlan`(仅 cleanup/analysis 参数计划),与新 AI plan 组件**同名易混**;落地用 `planSelection`/`dimensionPlan` 硬区分。

## 4b. 全阶段代码级落地 + 验收(authoritative,2026-06-26 grounding)

> 6+6 agent 全阶段 grounding(全 file:line 对 HEAD 接地:Core `799ceac`、Plugin/Alembic `2090793`),10 PD 固化进各落地点。**§4 是高层意图,落地以本节为准**。阶段 A-F 对应 §4 的 plan 组件/Core 投影/coldStart/deepMining/moduleMining/evolution。

### 阶段 A — plan 组件(AlembicAgent,producer)
模板 = `translation-json`(chat preset + single + actionSpace none + 纯 JSON),**非** evolution-audit(后者挂 skill+pipeline 多阶段,违 PD-2/3)。

| # | file:line | change | 怎么改 |
|---|---|---|---|
| A1 | `AlembicAgent/src/agent/profiles/definitions/plan.profile.ts`(新) | add | 镜像 `translation.profile.ts:3-31`。`PLAN_PROFILES` 单条 `id:'plan-selection'`、`basePreset:'chat'`(= `strategy{single}`,PD-2 单段)、`policies:[{type:'budget',maxIterations:1,...}]`、`actionSpace:{mode:'none'}`(PD-3 零工具)、`memory:{enabled:false}`、persona 写满(消费 ProjectContext facts→纯 JSON PlanSelection)、`projection:'json-object'`。 |
| A2 | `definitions/index.ts:2-8/10-18` | extend | import `PLAN_PROFILES` + 追加 `...PLAN_PROFILES` 进 `BUILTIN_PROFILES`。 |
| A3 | `AlembicAgent/src/agent/runs/plan/PlanAgentRun.ts`(新) | add | 镜像 `TranslationAgentRun.ts`。`runPlanAgent({agentService,generationStage,projectContextFacts}):Promise<PlanSelection>` 单次 `agentService.run({profile:{id:'plan-selection'},...})`(无 sharedState/repository=PD-1)。`status!=='success'→throw`(PD-5 R8 阻断,风格仿 `EvolutionAgentRun.ts:104-107`);成功→`parsePlanSelection(reply)`→`validatePlanSelection`(A4)。`PlanSelection` from `@alembic/core/plans`(已 re-export)。**R1 命名**:`runPlanAgent`/`projectPlanSelectionResult`,禁 `*Plan`/`buildColdStart*`。 |
| A4 | 本地轻校验 / Core 共享(**decision→见 §5 归属**) | decision | Core 无 `validatePlanSelection`(只有完整 PlanIntent 的 `validateCompletePlanIntent planIntent.ts:19`,强制 plannedNextActions/evidenceRefs,不适薄 PlanSelection)。**(A)本地轻校验**起步 / **(B)Core 新增 export**(PD-7 共享)。**R8 硬约束:只查结构(generationStage∈3 值、dimensions 非空 string[]、totalRecipeBudget>0),不查维度数量下限;`length===1` 放行、`length===0`/解析失败 abort。** |
| A5 | `runs/index.ts:8` 后 + `agent/service/index.ts` 具名块 | extend | re-export `runPlanAgent`,使主体 `import { runPlanAgent } from '@alembic/agent/service'` 可用。 |
| A6 | `AlembicAgent/test/contract-surface.test.ts:17` | extend | 断言 `typeof service.runPlanAgent==='function'`。 |

### 阶段 B — Core 共享投影 applyPlanSelection(AlembicCore,producer,PD-7 收敛 Plugin 双写)
| # | file:line | change | 怎么改 |
|---|---|---|---|
| B1 | `AlembicCore/src/service/planIntent/planIntent.ts`(紧邻 :19) | add | `applyPlanSelection(selection,options?):{executionDimensions:string[];budget:{totalRecipeBudget,maxFiles,contentMaxLines};moduleScope:string[];unknownDimensionIds?}`。算法逐字搬 Plugin 三段(`plan-generation-gate.ts:494/498/514`):unique(dimensions)+unique(moduleBindings.modulePath)+budget 三级回退(override 仅 testMode→planScale→default)+clamp,常量 `DEFAULT_MAX_FILES=500/CONTENT=120/TEST_MODE=80` 迁入;**先解 executionDimensions 再用 length 作 totalRecipeBudget 下限(保 :525/537)**。**PD-1 纯函数零 I/O 不碰 planLedger**;**PD-8 签名禁出现 analyst/token 字段**(不吞 computeAnalystBudget)。 |
| B2 | 同上(调 `DimensionRegistry.ts:632 resolvePlanDimensionDefinitions`) | reuse | 可选透传 `unknownDimensionIds`,判定权交消费方;**投影不抛错不裁剪**保纯函数。 |
| B3 | `AlembicCore/src/plans.ts:12-17`(value)+`:1-11`(type) | extend | export `applyPlanSelection`+`PlanSelectionProjection`;`service/planIntent/index.ts:2 export *` 自动外溢,`package.json ./plans` 已映射。 |
| B4 | `AlembicPlugin/.../plan-generation-gate.ts:494/498/514`+`buildPlanGenerationGateReady:255` | extend | 三连调用换一次 `applyPlanSelection(...)`,取 `.executionDimensions/.budget/.moduleScope`;**删**三 private 函数体+`DEFAULT_*`常量;**保留 MCP 壳**(`validatePlanSelection:191` 输入/stage 校验、lease、blocked、`attachPlanGenerationGateData:386` 字段结构不变)。 |

⚠️ **R1 升级**:Plugin gate 既有 `validatePlanSelection:191`(stage 匹配壳)与 Core 拟新增 `validatePlanSelection` **同名不同职** → Core 改名 `assertPlanSelectionShape` 避免 import 混淆。

### 阶段 C — coldStart 接线(主体,consumer,PD-5 硬 gate + 维度源)
唯一 daemon 入口 `DaemonJobRunner.ts:793 executeApiAiWorkflow`(`:794 kind==='bootstrap'→runColdStartWorkflow`)= PD-5 硬 gate 唯一外科插点;主体是 PlanSelection 首个消费方。

| # | file:line | change | 怎么改 |
|---|---|---|---|
| C1 | `DaemonJobRunner.ts:793`(`:794 if` 之前) | extend | 函数首行插:facts→`runPlanAgent`→`applyPlanSelection`→executionDimensions+budget+moduleScope。**PD-5 三态**:(a) 抛错/超时/provider 失败=AI 失败→`recordJobProcessEvent kind:'error'`+`store.update status:'failed'`+**不回退全量不降级**(R8,日志「plan agent failed→abort」无「fallback to full」);(b) `length≥1` 合法窄选→放行;(c) `length===0`/无 stage→同(a)。coldStart 必有 plan。日志打印分叉判定依据。 |
| C2 | `ColdStartWorkflow.ts:152-158`(facts.dimensions 选择点)+ ColdStartArgs 增形参 | extend | dimensions 用 gate 传入 executionDimensions,**不**从 `:217 [...baseDimensions]` 全量起;`:217` 保留作全量种子池(facts 仍枚举全集供 plan 选 + 保 rescan 增量语义),裁剪在 `:152`;`selectProjectContextWorkflowDimensions:336` 复用为过滤器。回退全量仅限无 plan 的非 coldStart 路径。 |
| C3 | `ColdStartWorkflow.ts:152-158/:175` | extend | **PD-9** 优先级:`intent.dimensionIds`(显式,`:175` 已有分支)> plan executionDimensions >(coldStart 不回退全量)。显式存在则**旁路** plan(非取交集);`selectionSummary:159-163` 记 source(explicit/plan)。 |
| C4 | `DimensionRuntimeBuilder.ts:207`(computeAnalystBudget,**不改**)+ ColdStartArgs 接 budget | extend | **PD-8 正交**:plan.scale.maxFiles/contentMaxLines/totalRecipeBudget=体量上限,覆盖 `ColdStartIntent.ts:69-70` 的 500/120;`computeAnalystBudget` 保持=token 质量地板,**禁用 plan.scale 替换/吞掉**。 |

### 阶段 D — deepMining(主体:参数化 rescan + 单 job 多轮,PD-4/PD-10)
「深」=多轮覆盖(账本跨轮补缺口)非更深符号。**R2 硬 5 三处**:`KnowledgeRescanPlanBuilder.ts:124`(默认 `TARGET_RECIPES_PER_DIMENSION=5:6`)+`RescanContext.ts:147-148` fallback +`RescanEvidenceProjectors.ts:204-211` 消费 gap,外加 `CompletenessCritic.ts:178` 独立 target——**一并核,只改一处会被另一处压回 5**。

| # | file:line | change | 怎么改 |
|---|---|---|---|
| D1 | `DaemonJobRunner.ts:793-820` | add | `generationStage==='deepMining'`→`runDeepMiningRounds`:**单 job 内 while 循环**①每轮 `runPlanAgent(deepMining)`(PD-5 硬 gate);②module-scoped dims+per-cell target 调 `buildDaemonRescanWorkflowArgs→runKnowledgeRescanWorkflow`;③轮末读 Core `CoverageLedgerAdvisor` 决 continue/stop;④`dimension_complete` upsert 账本。**不 enqueue 新 job(PD-10)**;每轮 plan 不持久(PD-1)。 |
| D2 | `DaemonJobRunner.ts:103-126`+`DaemonRescanWorkflowArgs:95-101` | extend | 扩 args 加可选 `moduleScope?`/`perDimensionTargets?`/`moduleDimensionTargets?`/`roundIndex?`;**仅 deepMining 填,coldStart/普通 rescan 不填**(逐字段退回护现链)。 |
| D3 | `KnowledgeRescanWorkflow.ts:431-449`(buildKnowledgeRescanPlan 调用) | extend | 透 per-cell target 到 `buildKnowledgeRescanPlan`(`targetPerDimension?` 入参 `:78` 已存在;per-cell 需 Core U2b 扩 options+existingCount 优先读账本=cross-repo);plan 选的格用 plan target、existingCount≥5 也不被 gap=0 skip;未提供退回 5。 |
| D4 | `RescanContext.ts:147-148`(fallbackGap=max(0,5-existing)) | extend | fallback target 从同源(plan per-cell target,无则 5)取,避免运行期又压回 5;同步核 `RescanEvidenceProjectors.ts:204-211`。 |
| D5 | Core `CoverageLedgerAdvisor`/`CoverageLedgerRepository`(伞形 U2,主体只 consume) | reuse | coverage_ledger 表/Repo/Advisor 由 Core 出(伞形 U2a/d),主体循环 `import @alembic/core` 消费(同 `RecipeImpactPlanner` 模式 `KnowledgeRescanWorkflow.ts:18`);**主体绝不自造账本(PD-4)**;**前置:Core U2 未 land→本阶段 blocked**。 |
| D6 | `DaemonJobRunner.ts`(runDeepMiningRounds 内) | add | 停止三类(**绝不读 git_diff_checkpoints**,伞形 D3):收敛=无 blank/thin 或全 exhausted;递减=`new_recipes<K`;轮上限=`last_round≥maxRounds`。K/maxRounds 从 `PlanSelection.scale` 投影,缺省才用默认表(**不硬编码**)。记 `deep_mining_rounds`。**advisory 不自动后台**:单 job 内按 maxRounds 自走,**不跨 job 自启不 enqueue**。 |
| D7 | `KnowledgeRescanWorkflow.ts:634-655`(0 execution=All covered) | reuse | 某轮 0 execution=该轮无缺口→收敛信号之一,**不当失败**。 |
| D8 | `KnowledgeRescanWorkflow.ts:165` | decision | PD-4 不新建 workflow,每轮复用 `runKnowledgeRescanWorkflow` 全链,只多传 `moduleScope+per-cell target+roundIndex`(防净增空壳)。 |

### 阶段 E — moduleMining(主体:per-module fan-out)
全代码库 fan-out 今天都按 dimension 切(`AgentRunCoordinator.ts:311` 读 `params.dimensions`);moduleMining 净增 module-轴 fan-out。**R5**:采样层 `moduleSeeds.slice(0,maxModuleDetails):164` 先于维度解析且耦合 dimension 轴,moduleMining **不复用**它作 fan-out 单元——fan-out 集来自 `ProjectMap.modules`(map envelope)。

| # | file:line | change | 怎么改 |
|---|---|---|---|
| E1 | `AgentRunCoordinator.ts:311`(partitioner)+`:26`(注册) | add | `partitionProjectContextModules(input,profile)` 读 `params.modules` 非 `dimensions`,每 module→一 child(`moduleId/moduleName/ownedFiles`、`phase:'module-mining-child'`);注册 partitioner+merger;复用 runChildren/tier concurrency;空 modules→throw(无静默 zero-fanout)。 |
| E2 | `profiles/definitions/`(新或扩 bootstrap.profile.ts:3-41)+index.ts | add | `module-mining-session`:`strategy{fanout,childProfile:'module-mining-dimension',partitioner:'projectContextModules',merge}`+tiered concurrency(`env:ALEMBIC_MODULE_MINING_CONCURRENCY default:2`)。PD-3 profile-only,fanout 契约 `AgentRunContracts.ts:49-57` 已支持。 |
| E3 | `AlembicAgent/src/agent/runs/ModuleMiningAgentRun.ts`(新)+runs/index.ts | add | `runModuleMining({modules,projectFacts,budget,scaleCap})`:`modules.slice(scaleCap)`(**PD-8 plan.scale=module 数量上限,建 children 前强制**)；每 child 带自己 `computeAnalystBudget`(**非 budget/module 数**)。 |
| E4 | `ProjectContextWorkflowFacts.ts:155-161`(map envelope 已请求)+返回 :246-263 | extend | 暴露 `projectMapModules:{id,name,ref,ownedFileCount}[]`(`ProjectContextMap.ts:250-260`,guard `:993 isProjectMapContext`);**显式旁路 `selectProjectContextModuleSeeds:817`**(采样启发式,非 module 轴)。 |
| E5 | `DaemonJobRunner.ts:793`(job kind) | extend | 加第三路 `moduleMining`(PD-4 参数化 rescan per-module mode 非 fork);**PD-5 硬 gate 仍适用**;有效 plan→从 projectMapModules 解 module 轴 intersect executionDimensions→`runModuleMining`。 |
| E6 | `KnowledgeRescanWorkflow.ts:165/:373`(presenterInput.modules 已 mapped) | extend | 加 `intent.miningMode='per-module'`,dispatch `module-mining-session` over projectMapModules,复用 Core 账本;**保 dimension 路径 additive 不回归(R5)**。 |
| E7 | `ProjectContextWorkflowFacts.ts:118-119,164` | decision | R5:采样 loop **禁改/禁抬 maxModuleSeeds 驱动 fan-out**;fan-out 集独立来自 projectMapModules;inline 注释记理由。 |

### 阶段 F — evolution 宿主接线(主体,consumer,**AlembicCore/src 零改动**=边界证据)
边界:主体只补「宿主把内核 driver 周期/按机跑起来 + 正确注入」;伞形修「内核 driver 内部正确性」(authority/freshness/OUTCOME/content 指纹=U4/U5/U6/UM)。

| # | file:line | change | 怎么改 |
|---|---|---|---|
| F1 | `DaemonFileChangeCollector.ts:368-374/:397-407`→`FileChangeHandler.ts:89-157` | reuse | reactive 进化链(native watcher/git 60s fallback→Handler→Core EvolutionGateway)已真跑,作「主体已是 evolution 宿主」实证,不动。 |
| F2 | `UiStartupTasks.ts:92-109/:154-180/:183-196`(调用方 `bin/daemon-server.ts:131`) | reuse | 三 driver 启动一次真跑(subscribeToSignals 常驻=轨①);**缺口=无周期兜底 sweep** 复跑 promote/execute(对照 Plugin `staging-access-sweep.ts:140/145/152`)。 |
| F3 | `Alembic/lib/service/evolution/EvolutionMaintenanceSweep.ts`(新) | add | 镜像 Plugin `staging-access-sweep.ts:129-170` 4-driver 信封,形态= daemon `@alembic/core/events timerRegistry.setInterval`(与 `DaemonFileChangeCollector.ts:368` 同源 timer,关停统一清理)。周期调 `checkAndPromote(cap)→checkTimeouts(cap)→checkAndExecute(cap)→scanAll(cap)`,各 try/catch 有界、单 tick≤driver数×cap、重入保护。**只驱动不碰判定不绕 transition Guard**。 |
| F4 | `KnowledgeModule.ts:230-243`(new DecayDetector options) | add | **致命修复**:已核 options 缺 `lifecycleStateMachine`→Core `DecayDetector.ts:146 if 守卫` 直接 no-op、U4 transition 在主体静默跳过(build/lint 抓不到)。增 `lifecycleStateMachine: ct.services.lifecycleStateMachine ? ct.get(...) : undefined`(单例已注册 `:274`)。纯宿主 wiring,与伞形 authority bug 正交。 |
| F5 | `http/routes/governance.ts:40-66/:68-97` | reuse | DecayDetector/staging HTTP 按需入口=主体宿主本职(Dashboard),保留;与周期 sweep 共用 Core driver 单例,幂等(`DecayDetector.ts:144 decaying→decaying no-op`)。 |
| F6 | `KnowledgeRescanWorkflow.ts:367-384/:402-420` | reuse | rescan 链内 decay audit(Agent)+auditRecipesForRescan(Core)已真接,与周期 sweep 互补;U6 内容指纹是伞形 Core 改,本阶段不碰。 |

### 每阶段验收(可执行可证伪;真机用 ALEMBIC_HOME 沙箱、Node≥22)
- **A**:① `new AgentProfileRegistry()` 含 `plan-selection`,actionSpace.none/strategy.single/skills.length===0。② fake runtime→`runPlanAgent` 返合法 PlanSelection 且 `runtime.execute` **仅 1 次**(PD-2)、不读 API key。③ **PD-5 R8 三子例**:status≠success/非数组→throw;`length===1`→正常返回不抛(只查结构不查数量下限)。④ PD-1:grep 无 repository/ledger import。⑤ contract-surface 断言 `service.runPlanAgent`。
- **B**:① `node -e import('@alembic/core/plans').applyPlanSelection`→function。② **收敛双写**:固定 PlanSelection,Core `applyPlanSelection` 输出与 Plugin `resolvePlanGenerationGate` 的 dimensionIds/scale/moduleScope **逐字相等**。③ budget 下限/testMode override/clamp 对照迁移前。④ Plugin grep `selectPlanDimensions/DEFAULT_MAX_FILES` 为空、`test:unit PlanDrivenGenerationGate` 绿。⑤ PD-1 纯函数 grep 无 planLedger/db/await。⑥ Core 边界测试全绿。
- **C**:① **PD-5 阻断**:mock runPlanAgent 抛错→`status='failed'`、`runColdStartWorkflow` spy 0 次、日志无「fallback to full」;真机失效凭证 bootstrap→job failed、全量未执行。② 合法窄选放行(length 2→executionDimensions 2)。③ 维度源 plan 驱动(传 3 项→最终严格 3 项非全集)。④ **PD-8**:plan.scale.maxFiles=200→ColdStartArgs 200、computeAnalystBudget 仍被调未替换。⑤ **PD-9**:explicit `[idA]`+plan `[idB,idC]`→最终 `[idA]`、source=explicit。⑥ R1 命名不碰撞。
- **D**(真机 BiliDili 02a25032):① **R2 单测**:existing=6+target=8→gap=2 produce、不传 target→gap=0 skip(回归)。② **多轮单 job(防空壳)**:≥2 round_index、`new_recipes` 递减、`deep_mining_rounds`≥2 行、`coverage_ledger` blank/thin 减、停止原因落日志、**同一 job id 无新 enqueue**。③ **「深」=覆盖增量**:第 N 轮 recipe 落第 1 轮未覆盖格、grade `empty/thin→partial/covered`、**module 产 0 recipe 不算 pass**。④ module-scope+depth budget 真驱动。⑤ grep 无 git_diff_checkpoints、循环无 planLedger 写。
- **E**(防空壳硬验收):① partitioner 喂 3 modules→恰 3 child 无维度交叉;空→throw。② module 轴源自 `projectMapModules`(8 modules)非 moduleSeeds(cap 6)。③ **真机每 module ≥1 recipe + moduleName 非空∈ProjectMap.modules，module 产 0 recipe=FAIL**。④ PD-8:scale=3+8 modules→恰 3 child 各全额 budget(非 budget/8)。⑤ R5:`git diff ProjectContextWorkflowFacts.ts:118-178` byte-unchanged、coldStart/rescan 套件绿。⑥ PD-5 硬 gate 先于 fan-out。
- **F**:① **F4 回归**:修前 `#lifecycleStateMachine===null`+scanAll 后 dead recipe 仍 active;修后注入非 null+`active→decaying`+transition 日志;真机 sqlite 直读。② **周期 sweep 真跑(防空壳)**:预置到期 staging/proposal/dead recipe→sweep tick 日志非全 0、空 DB 全 0 无伪状态、单 driver 失败不阻断其余。③ sweep 有界+timerRegistry 清理(daemon 关停无残留 timer)。④ reactive 链未破坏(改名仍产 update 提案)、轨①②幂等不双执行。⑤ **边界**:`git diff` 仅 `Alembic/lib`、**`AlembicCore/src` 零改动**。

## 5. 跨仓职责 + producer/consumer 顺序 + 波次

**单向 import 边界**:main→core / main→agent(包入口),不反向。

| 阶段 | 仓库(角色) | 落点 |
|---|---|---|
| B | AlembicCore(PRODUCER)+ Plugin(CONSUMER-A 收敛) | applyPlanSelection 投影 + plans.ts 导出;Plugin gate 收敛 |
| A | AlembicAgent(PRODUCER) | plan-selection profile + runPlanAgent + service barrel(仅消费 Core PlanSelection 类型) |
| C | 主体(CONSUMER) | DaemonJobRunner 硬 gate + ColdStartWorkflow 维度/budget/优先级(首个 PlanSelection 消费方) |
| D/E | AlembicAgent(module partitioner/profile)+ 主体(daemon 循环/分支)+ **Core 覆盖账本(伞形 U2)** | deepMining 单 job 多轮 / moduleMining fan-out |
| F | 主体(CONSUMER,**Core 零改**) | decay 注入 + 周期 sweep driver |

**波次**(伞形 Core 前置:U2 覆盖账本 + U4 authority/freshness 先 land):
- **W1(并行)**:① Core applyPlanSelection(B1-3) + ② Agent plan profile/run(A) + ④ 主体 F wiring(decay 注入 + sweep driver,**不依赖伞形可先落**)。
- **W2**:③ Plugin gate 收敛(B4) + ⑤ 主体 C coldStart 硬 gate + 维度源(消费 ①②,首个 PlanSelection 消费方)。
- **W3(依赖 C 模式 + 伞形 U2 账本 land)**:⑥ 主体 D deepMining 多轮 + ⑦ 主体 E moduleMining fan-out。
- **W4(真机验收,依赖伞形 U4 land)**:C/D/E/F 真机 BiliDili 落库证据;F 的 decay→正确分级真机验收等 U4(否则分级污染 DB)。

**与伞形不重叠**:伞形修「内核 driver 内部对不对」,主体修「宿主有没有把 driver 周期/按机跑起来 + 依赖注全」(`AlembicCore/src` 零改 = 边界证据)。D/E 的覆盖账本依赖伞形 U2a/b/d 先 land,未 land 则 blocked(PD-4 不自造)。

## 6. 范围:拥有 / 不拥有
**拥有**:主体侧把 Plugin 生命周期适配进 in-process 模型(plan 自决非回填);plan 作 AlembicAgent 正交新组件 + 主体前置接线;deepMining/moduleMining 在主体的真实载体(净增);evolution 维护在主体 daemon 的缺口补接(复用 Core)。
**不拥有**:不重做 Plugin host-agent-workflows/plan-tool/plan-generation-gate/FileChangeHandler git-diff-checkpoint(Plugin 侧,总控在修);不重写 Core evolution 内核与 plan 契约。Plugin 伞形需求修的 deepMining"深"/moduleMining per-cell/evolution 维护三断点,**若结论沉淀 Core,主体直接复用**;主体只补"宿主侧接线 + in-process plan"。
**依赖**:Core 须先落 umbrella 修复(post-umbrella HEAD),主体适配 base 在其上。

## 7. 待决 Confirmation Gate(决策表)

| # | 决策点 | 选项 | Design 建议 | 影响 | 用户裁定 |
|---|---|---|---|---|---|
| **PD-1** | plan 持久层 | 无状态(临场跑不写 planLedger)/ 消费 Core planLedger living-ledger | **无状态**(对齐 plan 无状态终稿;主体 in-process 每次 coldStart/rescan 前临场跑一遍) | plan 形态/持久化 | ✅ 采纳 |
| **PD-2** | plan 形态 | 单段一次 run 直产 PlanSelection(draft/confirm 内部两段)/ 保留跨进程 draft→confirm 两段 | **单段一次 run**(主体 AI 自决无回填层,无须两段往返;draft+confirm 作内部输出) | 实现复杂度/对齐 Plugin | ✅ 采纳 |
| **PD-3** | plan 是否需独立 Capability | 只加 profile/run(复用 ProjectContext facts)/ 加 `Plan` capability(主动探查工具) | **先只加 profile/run**(plan 消费 ProjectContext facts 决策即满足不猜;若后续需主动探查再加 capability) | Agent 工具面 | ✅ 采纳 |
| **PD-4** | deepMining/moduleMining 主体载体 | 参数化 `KnowledgeRescanWorkflow`(module-scoped dimensions+depth budget,复用 RecipeImpactPlanner/gap)/ 新增独立 workflow | **参数化 rescan 起步 + 复用 Core 覆盖账本**(伞形若把覆盖账本沉淀 Core,主体直接接);"深"定义对齐伞形(多轮覆盖非更深符号) | 净增风险/复用 | ✅ 采纳 |
| **PD-5** | plan 触发/决策权 | daemon 触发时自动跑 plan(失败回退全量,软门禁)/ 必须 plan 成功放行(硬 gate) | ~~自动跑+软回退~~ → **硬 gate(用户裁定 2026-06-26·覆盖建议)** | 无人值守/可见行为/正确性 | ✅ **硬 gate**:plan 是硬前置,plan run 必须产出有效 PlanSelection;**失败即阻断 coldStart/rescan、不回退全量、surface AI 失败**(plan 轻量正常不该失败,失败=AI 层问题,静默回退会掩盖故障+产降级结果)。与 Plugin 终稿 planSelection 必填对齐。 |
| **PD-6** | 同一 alembic.db | 共用同一 Core schema/db(不隔离)/ 隔离 | **共用不隔离**(已核同 schema,plan/stage 产出直落 knowledge_entries 等表) | 落库归属 | ✅ 采纳 |
| **PD-7** | Core 补 `applyPlanSelection` 投影 | Core 补一份共享(主体/Plugin 复用)/ 各写各的 | **Core 补共享投影**(planSelection→executionDimensions+budget 单源,避免双写漂移) | 跨仓复用 | ✅ 采纳 |
| **PD-8** | scale budget 真源 | plan.scale 完全替代 computeAnalystBudget / plan.scale 作上限 + computeAnalystBudget 作 token floor 兜底 | **两层共存**(plan.scale=生成体量上限、computeAnalystBudget=token 质量地板,正交不互吞;R7) | 质量地板 | ✅ 采纳 |
| **PD-9** | intent.dimensionIds 优先级 | 保留 CLI/MCP 显式覆盖(显式>plan)/ plan 接入后移除显式覆盖 | **保留显式覆盖,显式>plan**(人工指定维度子集优先,plan 兜底) | 可见行为 | ✅ 采纳 |
| **PD-10** | deepMining 多轮是否需 daemon 多轮 | 单 job 内循环(覆盖账本驱动收敛)/ daemon 反复 enqueue 多 job | **单 job 内循环起步**(避免 daemon 反复 enqueue 复杂度,账本驱动收敛/停止) | 运行时编排 | ✅ 采纳 |

**全部 PD 已闭合(2026-06-26 用户裁定)**:PD-1 无状态 / PD-2 单段 run / PD-3 先 profile-only / PD-4 参数化 rescan+复用 Core 覆盖账本 / **PD-5 硬 gate(覆盖建议:plan 失败即阻断、不回退全量、surface AI 失败)** / PD-6 共用 db / PD-7 Core 补共享投影 / PD-8 scale 双轨共存 / PD-9 显式>plan / PD-10 单 job 内循环。需求可 deliver。

> **PD-5 硬 gate 落地口径**:plan 作 coldStart/rescan 的硬前置——在 `DaemonJobRunner.ts:793 executeApiAiWorkflow`(及 CLI/Dashboard 入口)先跑 `runPlanAgent`,**plan run 失败或未产出有效 PlanSelection → 直接 abort 该 job、surface AI 错误,不回退全量、不静默降级**。与 Plugin 终稿 planSelection 必填一致。R8 新增:plan 硬 gate 须区分"AI 失败"(abort+surface)与"AI 决策合法地选了少维度"(放行)——前者阻断、后者照跑,勿把合法窄 plan 误判为失败。

## 8. 风险(R1–R8,grounding 更新)
- **R1 命名碰撞(确认真实)**:`buildColdStartWorkflowPlan`(Core `ColdStartPlan.ts:44`,`ColdStartWorkflow.ts:40/95` 已 import)=workflow 执行计划。新符号用 `runPlanAgent`/`plan-selection`/`applyPlanSelection`,禁 `*Plan`/`buildColdStart*`。**另**:Core 拟新增 `validatePlanSelection` 与 Plugin gate 既有 `:191` 同名不同职→Core 改名 `assertPlanSelectionShape`。
- **R2 硬 5 升级为三处 + critic**:`KnowledgeRescanPlanBuilder.ts:124` + `RescanContext.ts:147-148` fallback + `RescanEvidenceProjectors.ts:204-211`(projector 消费 gap)+ `CompletenessCritic.ts:178`(独立 target)——**一并核**,只改一处会被另一处压回 5。`targetPerDimension?` 入参 `:78` 已存在,但 per-cell 级需 Core U2b 扩 options。
- **R3 net-new 空壳**:deepMining/moduleMining 主体 0 处,易滑「stage 只改文案、复用同一分析+固定预算」→ 完成定义**必须真机落库证伪**(deep_mining_rounds 多行+coverage_ledger 增量;per-module ≥1 recipe+moduleName 非空),不能只看 job 跑通。
- **R4 注入回归隐藏性(确认致命)**:`KnowledgeModule.ts:230-243` decayDetector 缺 lifecycleStateMachine,Core `DecayDetector.ts:146 if 守卫`直接 no-op、无报错无日志、build/lint 抓不到→**必须注入断言单测 + 真机 DB 直读**(F 验收①)。
- **R5 采样层排序耦合(确认)**:`moduleSeeds.slice(0,maxModuleDetails):164` 先于维度解析 `:336`,moduleMining 不复用、不抬 maxModuleSeeds,fan-out 集独立来自 `projectMapModules`;sampling-loop byte-unchanged 验收守护。
- **R6 PD-4 账本归属**:Core U2 未 land 时主体 deepMining/moduleMining 的 per-cell「done」无共享真源→易造主体-local 账本与 Core 冲突;**标为 dep 不自造**,W3 blocked 等 Core producer。
- **R7 双 driver 幂等**:`subscribeToSignals`(轨①)与周期 sweep(轨②)都驱动 `checkAndExecute`→须确认 Core transition Guard/proposal 状态机幂等不双执行(对齐 Plugin `staging-access-sweep.ts:147-150`)。
- **R8 阻断 vs 放行边界(已固化)**:`runPlanAgent` 返「`dimensions.length===0`+无报错」=非法 abort(空选无意义);`length≥1` 放行。判定固化在 runPlanAgent 投影/校验(A3/A4),否则 gate 三态塌两态;只查结构有效性不查维度数量下限。
- **其他**:① **C/D 双扫风险**——plan agent 需 ProjectContext 输入、`ColdStartWorkflow.ts:134` 内部又 `buildProjectContextWorkflowFacts` 一次→全量扫两遍;缓解=gate facts 经 args 透传、workflow 检测已注入则跳过 :134(超纯接线)。② **PD-8 吞噬**:`applyPlanSelection.budget` 签名禁出现 analyst/token 字段,验收 grep `computeAnalystBudget` 调用点未删。③ **PD-10 张力**:单 job 内按 maxRounds 自走属「已授权本次任务范围」,但**绝不自动 enqueue 下一 job、不跨 job 自启**(代码注释+验收固化)。④ **maxRounds/K/scale 默认**从 PlanSelection.scale 投影,缺省才用默认表,不硬编码(否则重蹈硬 5)。⑤ **timerRegistry 清理**:F3 setInterval 必经 `@alembic/core/events timerRegistry`,否则 daemon 关停泄漏 timer。
- **A4 校验归属(待确认)**:Core 无 `validatePlanSelection`→本地轻校验(A,起步不阻塞)vs Core 共享(B,PD-7)。推荐 B,本阶段可先 A、Core PD-7 落地后切换。**这条是唯一新浮出的小决策项**(其余 10 PD 已闭合)。

## 证据与链接
- Grounding:6-agent 主体真实架构勘探(~998K tokens,全 file:line 核验)。
- 参照:在途 [Plugin 伞形需求](alembic-recipe-lifecycle-global-2026-06-26.md)(总控在修)、plan 无状态终稿、[coldstart-chain-repair](alembic-coldstart-chain-repair-2026-06-25.md)。
- 关键载重点:主体两链 `ColdStartWorkflow.ts:90`/`KnowledgeRescanWorkflow.ts:165`;维度硬编码 `ProjectContextWorkflowFacts.ts:217`;daemon 二值 kind `DaemonJobRunner.ts:793`;Agent 7 profile/4 run `profiles/definitions/index.ts:10-18`+`agent/runs/index.ts`;run 模板 `EvolutionAgentRun.ts:46`;Core plan 契约 `service/planIntent/contracts.ts:63-70`(主体 0 消费);现成未接入口 `BaseDimensions.ts:68 resolvePlanDimensionDefinitions`;喂入点 `AgentRunInputBuilders.ts:215`;evolution 真跑 `UiStartupTasks.ts:93/155/184`。
