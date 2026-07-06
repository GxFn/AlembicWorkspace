# W6 Agent 结构批执行底稿

- 生成:2026-07-03,只读扫描产物(未改任何源码);沿用 W4/W5 底稿方法论(`Design/docs/current/alembic-w5-plugin-structure-map-2026-07-03.md`)
- 扫描基线:AlembicAgent@`e4e8a3f`(W0-W5 相关批已落地:W1 已删 chat-default profile/AdaptiveStrategy/types/agent.d.ts ambient——05d24f5;W3 已改 tools/runtime/capabilities→toolsets——e4e8a3f、PcvNodeEvidence→PcvNodeEvidenceRecorder——9732d21;tools/kernel 单源已定)
- 方案锚:`Design/docs/current/alembic-workspace-unification-plan-2026-07-02.md` §2.2 Agent 段(runs/profiles/evaluation/prompts/evidence+memory;tools/kernel 保持;capabilities 别名层删)
- 消费面全部用 `find -exec grep` 实扫(workspace ripgrep 漏文件已知);行号为本基线实测
- 规模:src/agent 101 文件 32,675 行;test 48 文件(vitest 全绿基线,W3 commit 自述"48 全绿")

---

## 0 硬约束与门禁锚点总表(全批共用)

### 0a package.json exports 全表(12 键,wire 冻结——键与符号名集全程不动)

外部消费仓实扫结论:**只有主体(Alembic)消费 @alembic/agent;AlembicPlugin(lib/bin/test/scripts/package.json)、AlembicCore、AlembicDashboard 全部为 0**——任务背景"Plugin 大量消费"与实扫不符,以实扫为准(Plugin 经 Codex host agent 走 MCP,不 link Agent 包)。

| exports 键 | dist 目标 | 主体 lib/bin 消费(文件) | 主体 test | 代表锚点 |
|---|---|---|---|---|
| `.` | dist/index.js | 12 | 6 | ToolContextFactory.ts:9、ServiceMap.ts:10、AgentModule.ts:8、ai.ts:6;test V2ToolSystem.test.ts:11(**GenerateAnalyze 类名**) |
| `./agent` | dist/agent/index.js | 0 | 3 | AgentProfileCompiler.test.ts:1(BudgetPolicy)、PipelineStrategy.test.ts:1、StrategyPolicy.test.ts:22 |
| `./service` | dist/agent/service/index.js | **21** | 11 | bin/cli.ts:1137,1151;PlanSelectionGate.ts:79、ModuleMiningWorkflow.ts:45(动态 import);**vi.mock('@alembic/agent/service') DaemonJobRunnerPlanGate.test.ts:20(钉 runModuleMining/runPlanAgent 命名导出)** |
| `./runtime` | dist/agent/runtime/index.js | 6 | 10 | DimensionRuntimeBuilder.ts:8、AgentRunProcessEvents.ts:1、GenerateEfficiency.ts:1 |
| `./prompts` | dist/agent/prompts/index.js | 1 | 5 | DimensionRuntimeBuilder.ts:3(computeAnalystBudget);test InsightGate/computeAnalystBudget/evolution-gate-evaluator/evolution-agent-prompt/InsightProducerPrompt |
| `./domain` | dist/agent/domain/index.js | 1 | 0 | **CompletionSteps.ts:142 动态 import(EpisodicConsolidator)** |
| `./tasks` | dist/agent/tasks/index.js | 1 | 1 | ai.ts:23;AgentTaskHandlers.test.ts:2 |
| `./profiles` | dist/agent/profiles/index.js | 1 | 0 | **ai.ts:9 import PRESETS;:76 `profile:{preset:'chat'}`;:716 遍历 Object.entries(PRESETS) 投 HTTP** |
| `./ai` | dist/ai/index.js | 5 | 4 | AiModule.ts:16,33、ServiceContainer.ts:181、bin/cli.ts:1659,1750 |
| `./tools/runtime` | dist/tools/runtime/index.js | 2 | 4 | ToolContextFactory.ts:17、AgentModule.ts:18(RuntimeCapabilityCatalog/ToolRouterAdapter) |
| `./memory` | dist/agent/memory/index.js | 7 | 12 | **CompletionSteps.ts:131,143 动态 import(MemoryEmbeddingStore/PersistentMemory)**;RuntimeInitializer.ts:7 |
| `./context` | dist/agent/context/index.js | 2 | 1 | ai.ts:8(ConversationStore)、DimensionRuntimeBuilder.ts:1(ExplorationTracker) |

- 目录重组铁律:**键不动+目标改指或原址 re-export**。W6 所有子项都不新增/删除 exports 键(boundary 配置 stable-public=12 精确计数,见 0d)
- package.json imports 别名 4 条全 wildcard(`#agent/*`/`#ai/*`/`#shared/*`/`#tools/*`,package.json:60-83)——目录搬迁只改 import 的子路径段,**别名键零联动**(与 Plugin W5 的具名别名不同,无三份映射同步问题)

### 0b 半 wire/持久化面(冻结,B 层)

| 面 | 锚点 | 判定 |
|---|---|---|
| preset id `'chat'/'insight'/'evolution'` | BuiltinAgentPreset(AgentRunContracts.ts:10);主体 ai.ts:76;process events 链:AgentRuntime.ts:181(presetName)→:228,235,359,2083(事件 preset 字段)→主体 AgentRunProcessEvents.ts:199 透传→GenerateProcessEvents.test.ts:121-291 断言 preset:'insight' | 冻结(W3 已判保留) |
| PRESETS/getPreset/resolveStrategy 符号 | ./profiles 签名名集 7(含 BUILTIN_PROFILES);主体 ai.ts:9,716,76 | 冻结 |
| stage 名 `'analyze'/'quality_gate'/'record_repair'/'produce'/'rejection_gate'/'evolve'/'evolution_gate'` | 主体 PcvStageNodeMap.ts:29(类型)、:166-168(pcvm:n9:quality_gate)、:701-704(**硬编码 canonical 序列**);产生端 presets.ts:190,228,237,294,345,360+scanPrompts.ts:224,305 | 冻结 |
| 能力键 7 个 `'conversation'/'code_analysis'/'knowledge_production'/'scan_production'/'scan_analyze'/'system_interaction'/'evolution_analysis'` | CapabilityRegistry.ts:14-21 注册表键;profile defaults.skills 值(evolution/relation/scan.profile);主体 AgentProfileCompiler.test.ts:44,110、V2ToolSystem.test.ts:639,659(`cap.name==='code_analysis'`);AgentRuntimeBuilder.ts:141(`name==='system_interaction'` 特判) | **判定=半 wire,冻结**(A5⑥) |
| profile id 11 个(`'generate-session'/'generate-dimension'/'scan-extract'/'scan-summarize'/'relation-discovery'/'evolution-audit'/'plan-selection'/'module-mining-session'/'module-mining-dimension'/'translation-json'/'signal-analysis'`) | 主体 lib 直构:AgentRunInputBuilders.ts:101,216、SessionExecutionBuilder.ts:452;Agent runs 包装器;主体测试大量;AgentRunCoordinator.ts:319 默认 childProfile 'generate-dimension' | 冻结(S4 已改名后的现状即终态) |
| runs 包装器符号 runPlanAgent/runEvolutionAudit/runModuleMining/runRelationDiscovery/runScanAgentTask/runTranslationJson+projectEvolutionAuditResult/projectRelationDiscoveryResult/projectScanRunResult/toScanFileCache | ./service 上的再导出(service/index.ts:5-16);主体 21 lib 文件+vi.mock | 冻结(**runModuleMining 是 alias const 但符号本身是 wire**,ScopedModuleMiningAgentRun.ts:161) |
| 记忆类型 `type:'insight'` | EpisodicConsolidator.ts:290,306,405 | 冻结 |
| 持久化路径 `.asd/bootstrap-checkpoint/session-store.json` | SessionStore.ts:689,710,723,727 | 冻结(memory/ 本批不动内容) |
| GenerateAnalyze 类名 | 主体 V2ToolSystem.test.ts:11,637-659 | 冻结 |

### 0c 主体 config/agent-extraction-boundary.json 逐条核(结论:W6 零联动)

- `expectedSpecifiers` 实际内容(config:331,336,341)= `#tools/ToolContextFactory.js`、`../../lib/tools/ToolContextFactory.js`——**全是主体内部 deferred-import 白名单串,不含任何 @alembic/agent 串**。lint 脚本对它做的是逐文件精确集合比对(lint-agent-extraction-boundary.mjs:193-232),与 Agent 侧 exports 无关
- `@alembic/agent/tools/v2`(config:323 publicV2Entrypoint)、`@alembic/agent/tools`(:346 叙述)、`@alembic/agent/tools/terminal`(:486):脚本只做**精确匹配消费计数**(脚本:163-190,console.log 输出)+terminal 复活拦截(:400-410,retired 后再出现 import 才红)。当前主体对三者消费=0,合法;W6 不新增这些子路径即零破
- 真正的硬断言仅两条:依赖 `@alembic/agent@file:../AlembicAgent` 存在(脚本:149-155)+禁 `#agent` package-imports 别名(:156-158)——W6 不触
- 其余 @alembic/agent/* 串(memory/context/service/runtime/prompts/domain/ai 入口常量)都是"消费计数分类器"+"禁本地重复实现"方向的守卫(脚本:237-314),**只要 12 exports 键与符号面不动,主体门禁与 config 均零回写**

### 0d Agent 自身门禁锚点

- ⚠️ **基线预红(P0,W6 前置):config/agent-public-api-signatures.json 已 stale**——快照(generatedAt 2026-06-27,最后 commit 33ed20d)在 `.`/`./tools/runtime` 名集里仍是 `BootstrapAnalyze/BootstrapProduce`,而 S4 批3a(2355bd4)已把类改名 `GenerateAnalyze/GenerateProduce`(源码实扫 BootstrapAnalyze=0)。smoke-agent-public-signatures.mjs:41-72 按名集+kind+signatureHash 精确比对→`npm run smoke:public-signatures`(在 `npm run check` 链内)**当前必红**。W6 第一批=单独 regen 快照(记录 S4 欠账),否则后续每批验证信号被污染。48 vitest 文件全绿基线不含此 smoke,故"测试全绿"与"check 红"并存
- 快照机制判定:凡"移动文件+barrel 原址 re-export、名集不变"→hash 不变零 regen;凡删/加公共名→regen(有 G5 signatureHash regen 先例)
- config/agent-public-api-boundary.json expectedCounts.stable-public=**12 精确**;forbiddenConsumerSpecifiers 含 `@alembic/agent/*/*/*`(三段深路径全禁)——**evaluation/ 等新目录不得成为新 exports 子路径**,只能经既有 barrel 面世
- config/layer-contract.json:areas=agent/ai/root/shared/tools/types;allowedRuntimeImports `agent→[ai,shared,tools]`、`tools→[shared]`(type-only 豁免)——W6 全部动作在 agent/tools 两区内且方向不变,零回写;layerRationale/cycleFindings 文本仍写旧路径 `tools/runtime/capabilities/Capability.ts`(叙述性字符串,W3 漏改,顺手改)
- config/naming-lint.json:src camelCase/PascalCase+`x.profile.ts` 豁免族+index.ts barrel 通行——新目录 evaluation//evidence/ 内沿用现文件名即绿
- config/agent-validation-floor.json:test 计数下限+stable export 计数精确——W6 不删测试文件即绿
- 每批验证命令:`npm run build:check` + `npx vitest run`(48 文件基线,新增红=停)+ `npm run lint` + `npm run lint:agent-import-boundary` + `npm run lint:public-api-boundary` + `npm run lint:core-import-boundary` + `npm run lint:space-edges` + `npm run lint:layer-contract` + `npm run lint:doctrine` + `npm run lint:naming` + `npm run smoke:public-signatures` + `npm run verify:validation-floor` + `npm run lint:retired-symbols`(即 `npm run check` 全链);跨仓抽验:主体 `npm run lint:agent-extraction-boundary` + 主体 vitest 涉 Agent 的代表测试。Node≥22(engines;主体 memory:Node18=假红)

---

## A1 evaluation 拆出(P0 错位修复)——【动,最大批】

### ① 现状清单(prompts/ 6 文件 3,432 行)

| 文件 | 行数 | 内容诊断 |
|---|---|---|
| index.ts | 5 | 纯 `export *` 五连(insightAnalyst/insightEvolver/insightGate/insightProducer/scanPrompts) |
| insightAnalyst.ts | 562 | 纯 persona/prompt+预算:ANALYST_SYSTEM_PROMPT(:98)/ANALYST_TOOLS(:141)/ANALYST_BUDGET(:148)/computeAnalystBudget(:185)/buildAnalystPrompt(:279)。deps 仅 @alembic/core/{dimensions,knowledge} |
| insightEvolver.ts | 324 | 纯 persona/prompt:EVOLVER_SYSTEM_PROMPT(:62)/EVOLVER_TOOLS(:113)/EVOLVER_BUDGET(:119)/buildEvolverPrompt(:138)+3 类型(:21,34,45)。零 import |
| **insightGate.ts** | **1,328** | **三分混装**(下表) |
| insightProducer.ts | 687 | prompt 为主+**1 个错位 evaluator**:producerRejectionGateEvaluator(:655);其余 PRODUCER_SYSTEM_PROMPT(:81)/PRODUCER_TOOLS(:132)/PRODUCER_BUDGET(:138)/buildProducerPrompt(:196)/buildProducerPromptV2(:252)/buildCodeContextSection(:521)。deps:@alembic/core/knowledge+domain/EvidenceCollector(:23 值) |
| scanPrompts.ts | 526 | 混装:SCAN_TASK_CONFIGS(:77 文本配置)+RELATIONS_EXPLORE/SYNTHESIZE_PROMPT(:431,458)+buildScanProducerPrompt(:346 文本)vs **stage builder 两件**:buildScanPipelineStages(:186,内嵌 quality_gate/rejection_gate 接线 :224-307+inline rejection evaluator :307)/buildRelationsPipelineStages(:492)。deps:./insightAnalyst+./insightGate(:17 buildRetryPrompt+insightGateEvaluator)+./insightProducer(:18)+domain/EvidenceCollector(:48 type) |

### insightGate.ts 1,328 行三分诊断+拆分归属表

| 段 | 符号(:行) | 归属 |
|---|---|---|
| 纯 prompt 文本(retry/repair 修复族) | buildRetryPrompt(:781)、buildRecordRepairPrompt(:853)+stringifyRecordRepairEvidenceMap(:814)+getArtifactMemoryFindingCount(:842)、buildSummaryRewritePrompt(:915) | **留 prompts/** |
| 工件构建(AnalysisArtifact/Report) | sanitizeAnalysisText(:182)、extractFileRefs(:228)、splitMarkdownSections(:239)、shouldSkipDerivedFindingTitle(:252)、deriveFindingsFromAnalysisText(:256)、buildAnalysisReport(:297)、createFsSnippetRangeReader(:418)、countSnippets(:444)、buildAnalysisArtifact(:452) | **→ evaluation/**(工件构建) |
| 质量评估器(QualityGate) | buildQualityScores(:566)、analysisQualityGate(:664)、applyGateThresholds(:680)、analysisQualityGateV1(:737)、reviewInsightDepth(:981)、applyDepthRetryGate(:1002)、applyGraphRetryGate(:1069,F4g 停用零消费,注释明示保留待模型再评估——**随迁不删**) | **→ evaluation/** |
| PipelineStrategy gate.evaluator 适配器 | insightGateEvaluator(:1102)、evolutionGateEvaluator(:1230)、isSuccessfulEvolutionToolCall(:1315)、EvolutionToolCallRecord(:1210) | **→ evaluation/** |
| 跨段路由常量(**静默断裂点**) | DEPTH_GAP_REASON(:52,evaluator :1046 产出前缀+buildRetryPrompt :783-785 startsWith 路由)、REQUIRED_MEMORY_FINDING_SUGGESTION/INSUFFICIENT_MEMORY_FINDINGS_SUGGESTION(:131,132,gate suggestion 产出+buildRetryPrompt hints 键 :802-806) | **→ evaluation/ 导出,prompts 侧 import**(现为模块内私有 const,拆分必须显式导出;漏则深度 retry/记忆修复路由静默失效——字符串仍编译通过) |
| 同批并入 | insightProducer.ts:655 producerRejectionGateEvaluator;scanPrompts.ts:186 buildScanPipelineStages+:492 buildRelationsPipelineStages(stage builder+inline evaluator) | **→ evaluation/** |

- deps 走向核验:evaluation/ 将持有 domain/EvidenceCollector(insightGate.ts:33 值)+runtime/PcvNodeEvidenceRecorder(:34 buildPcvQualityGateEvidence)+@alembic/core 依赖;拆后 prompts/ 只剩 @alembic/core+evaluation 常量——依赖单向 prompts→evaluation→(domain,runtime),presets→(prompts,evaluation),PipelineStrategy→prompts,**无环**
- 建议 evaluation/ 内切三文件:analysisArtifact.ts(工件构建)/qualityGates.ts(评分+门+depth/graph retry)/gateEvaluators.ts(三 evaluator 适配器+stage builders 或第四件 stageBuilders.ts)+index.ts——【决策项①切分粒度,单文件 evaluation.ts 亦可但 1,900+ 行违背拆分本意】

### ② 消费面

- barrel:prompts/index.ts `export *`——拆后 index 继续 `export *` evaluation 各文件(**./prompts 27 名集+signatureHash 不变→零 regen,主体 5 测试+DimensionRuntimeBuilder 零改**)。可另加 evaluation/index.ts 供 Agent 内部新 import,不上 exports
- 主体经 @alembic/agent/prompts:lib 1(DimensionRuntimeBuilder.ts:3 computeAnalystBudget)+test 5(InsightGate.test:1-5 analysisQualityGate/buildAnalysisArtifact/insightGateEvaluator;evolution-gate-evaluator.test:13;evolution-agent-prompt.test:12-18 EVOLVER 四件+EvolutionContext;computeAnalystBudget.test:1;InsightProducerPrompt.test:1)
- Agent src 消费 4 文件:presets.ts:23-44(analyst 3+evolver 4+gate 3:buildRetryPrompt/evolutionGateEvaluator/insightGateEvaluator+producer 4)、PipelineStrategy.ts:24(buildRecordRepairPrompt+buildSummaryRewritePrompt,使用位 :567,:616)、AgentStageFactoryRegistry.ts:7-11(scanPrompts 3 件)、ScanAgentRun.ts:1(SCAN_TASK_CONFIGS)
- Agent test 直连(相对路径,拆分需回写):contract-surface.test.ts:4(`* as prompts`,名集断言面)、llm-input-correctness.test.ts:6、evidence-recording-phase-chain.test.ts:4(insightGate 直引)、insight-depth-retry.test.ts:12(insightGate 直引)、llm-input-layering.test.ts:5,9、recipe-authoring-inprocess-flatten.test.ts:33、summary-rewrite-gate.test.ts:15(insightGate 直引)、evidence-collector-fidelity.test.ts:27,31(insightGate+insightProducer 直引)——8 文件

### ③ W3-D7 联动(insight* 文件名族)推荐

- **拆分批内不改文件名**(单批单关切,防 mv+改名双重 diff 不可审)
- 后续微批推荐:insightAnalyst.ts→analystPrompt.ts、insightProducer.ts→producerPrompt.ts、insightEvolver.ts→evolverPrompt.ts(角色词已是文件主词,insight 前缀在 S4 词汇表里已让位 generate 环词);insightGate.ts 拆余(retry/repair 三件+常量 import)→**repairPrompts.ts**;evaluation/ 侧文件生而新名不带 insight
- **符号名全部不动**:insightGateEvaluator/analysisQualityGate 等经 ./prompts 冻结;preset `'insight'` 不动(0b);文件名是纯内部面(非 wire),改名只牵 Agent 内 4 src+8 test 相对 import

### ④ 执行步骤

1. 建 src/agent/evaluation/,按归属表把 insightGate.ts 四段、insightProducer.ts:655、scanPrompts.ts 两 builder 迁入(git mv 不可用于段级拆分——新建文件+删段,commit 信息记录段级来源行号)
2. 三个路由常量+REQUIRED/INSUFFICIENT suggestion 常量在 evaluation/qualityGates.ts 导出;prompts 拆余文件 import
3. prompts/index.ts 重写为:自家 4 文件 `export *` + evaluation 各文件 `export *`(名集恒等);Agent 内 4 src 消费文件 import 路径改指 evaluation(presets/AgentStageFactoryRegistry/PipelineStrategy 按符号归属分流);8 test 相对路径回写
4. 验证:0d 全链+主体侧 `npx vitest run test/unit/InsightGate.test.ts test/unit/evolution-gate-evaluator.test.ts test/unit/computeAnalystBudget.test.ts`+`node -e "import('@alembic/agent/prompts').then(m=>console.log(Object.keys(m).length))"` 对照 27

### ⑤ 风险

- **最大静默风险=路由常量**(上表):编译期不红,运行期深度 retry 分支退化为通用 hints——迁移后必须跑 insight-depth-retry.test.ts+summary-rewrite-gate.test.ts(两者恰是该链路测试)
- ./prompts 名集完整性:漏一个 re-export 主体 5 测试立红(可见风险);contract-surface.test.ts:4 `* as prompts` 是仓内名集守卫
- buildAnalysisArtifact↔EvidenceCollector 的耦合注释(EvidenceCollector.ts:7 引"bootstrap-gate.js"史前名)顺手更新,防下一轮测绘误判

---

## A2 presets 降级——【动,中批,方案甲】

### ① 现状

- presets.ts **462 行**,PRESETS 3 键:chat(:143)/insight(:179)/evolution(:335)+resolveStrategy(:395)+getPreset(:432)。**W1 删的是 chat-default profile(05d24f5 commit 自述"preset 'chat' 是另一物且保留"),preset 仍 3 个;chat preset 非死区**——主体 ai.ts:76 `profile:{preset:'chat'}` 生产在用
- profiles/definitions **11 个 profile**(9 文件+index+module.profile shim):scan-extract/scan-summarize(scan.profile.ts:20,29)、relation-discovery、evolution-audit、plan-selection、module-mining-session/module-mining-dimension(ScopedModuleMiningProfile.ts:4,33)、translation-json、signal-analysis、generate-session/generate-dimension(generate.profile.ts:4,29)。basePreset 分布:insight×7、chat×3(plan-selection/signal-analysis/translation-json)、evolution×1
- AgentProfileCompiler.ts 294 行,回指机制:#compileRef(:47)→registry 未命中走 #compilePresetRef(:93,preset 名直接成 CompiledAgentProfile.basePreset);**按 id 特判 4 处**:resolveActionSpace(:208 signal-analysis+mode:'auto')、resolvePolicyDeclarations(:218 evolution-audit 按 recipes.length 动态预算)、defaultParamsForProfile(:255 scan-summarize/:258 scan-extract)、serviceKindForPreset(:284-292 按 preset 名)
- AgentStageFactoryRegistry.ts:70-71 **直取 `PRESETS.insight.strategy.stages`/`PRESETS.evolution.strategy.stages`** 做 generateDimensionPipeline 复用(stage 复制+动态预算覆盖 :119-176)——preset 体是 stage 单源
- 运行时消费链:AgentRuntimeBuilder.ts:71 `getPreset(presetName, overrides)`→:72 按 preset.capabilities 逐键 `CapabilityRegistry.create`→AgentRuntime(presetName…)——**每个 runtime 都从 preset 展开,preset=运行时组合基块**

### ② 为什么不能"拆进 profile 定义"(硬约束)

**AgentProfileRegistry.assertSerializableProfile(AgentProfileRegistry.ts:39-50)禁止 profile definition 含函数/Set/Map**(JSON.stringify replacer 抛错)。preset 体满载函数:policy 工厂(presets.ts:149,304,313,370)、promptBuilder/retryPromptBuilder 闭包(:200,214,244,257,353,355)、gate evaluator 引用(:230,296,362)。双配置系统是"可序列化声明(profile)vs 运行时组合(preset)"的刻意分层,不是历史偶然——**字面内联=撞运行时序列化门**。

### ③ 最小方案(甲,推荐)与备选(乙)

- **甲**:presets.ts 按 preset 拆三文件 `profiles/presets/{chat,insight,evolution}.preset.ts` + `profiles/presets/index.ts` 组装 PRESETS(Object.freeze 结构、name/description 字段原样——主体 ai.ts:716 投 HTTP)并留 resolveStrategy/getPreset;profiles/presets.ts 原路径消亡,profiles/index.ts:6 与 agent/index.ts:64 的 re-export 改指。语义"降级"落在:各 preset 文件头注+README 声明 preset 是"profile 的运行时默认块(base runtime block),不是第二套 profile";词汇表(W8 vocabulary.md)收录。**wire 全冻结:PRESETS/getPreset/resolveStrategy 符号、3 preset id、事件 preset 字段、BuiltinAgentPreset(AgentRunContracts.ts:10)全不动**
- **乙**(超 W6 范畴,列 follow-up):把 preset 函数体经注册表间接化(policyFactory/evaluator 名字符串+registry 解析,类似 stageFactoryRegistry 既有模式),AgentProfileDefinition 增 factory 名字段→preset 可降为纯数据。触 AgentRunContracts 类型+编译器+主体测试,收益=特判(:208,:218)可声明化——不在结构批做
- Compiler 4 处 id 特判:甲方案下**登记不动**(移进 profile 定义同样撞序列化门,除非走乙)

### ④ process events preset:'insight' 兼容性证明

方案甲不触链上任何节点:CompiledAgentProfile.basePreset 值域不变('insight' 等)→AgentRuntimeBuilder.normalizeProfile(:118,125 presetName=basePreset)→AgentRuntime.ts:181 this.presetName→事件 :228,235,359,2083→主体 AgentRunProcessEvents.ts:199。主体 GenerateProcessEvents.test 断言的 preset:'insight' 恒成立。

### ⑤ 风险

- AgentStageFactoryRegistry.ts:70-71 的 PRESETS 直取在拆文件后仍指同一对象(经 presets/index 组装)——注意保持 `PRESETS.insight.strategy.stages` 的**数组身份与顺序**(stage 复制按下标 :120,138,157-169 presetStages[0..3]/evolutionPresetStages[0..1],**下标即契约**)
- ./profiles 签名 7 名集不变;`.`/`./agent` 上的 getPreset/PRESETS/resolveStrategy 不变——零 regen(除 W6-0 已 regen 的底座)

---

## A3 runs 统一——【动,小批】

### ① 现状(7 子目录 9 文件 1,198 行)

| 路径 | 行数 | 包装的 profile |
|---|---|---|
| evolution/EvolutionAgentRun.ts | 293 | evolution-audit(:79)+projectEvolutionAuditResult(:112)+collectEvolutionDecisionIds(:241) |
| **module/ModuleMiningAgentRun.ts** | **10** | **纯 re-export shim**→module-mining(S4 批3d f8105ab 兼容件) |
| module-mining/ScopedModuleMiningAgentRun.ts | 161 | module-mining-session(:33);:159-161 三个兼容 alias(ModuleMiningModule/RunModuleMiningInput/runModuleMining=runScopedModuleMining) |
| plan/PlanAgentRun.ts | 291 | plan-selection(:20)+parsePlanSelection(:92) |
| relation/RelationAgentRun.ts | 72 | relation-discovery(:17) |
| scan/ScanAgentRun.ts + ScanRunProjection.ts | 100+166 | scan-extract/scan-summarize(:60 按 task 选 id)+projectScanRunResult |
| translation/TranslationAgentRun.ts | 95 | translation-json(:25) |
| index.ts | 10 | 10 符号再导出(runScopedModuleMining **不在** index 上,只有 runModuleMining 别名) |

### ② "每 profile 一包装器"现状差距

- 有包装器 7 profile(上表);**无包装器 4**:generate-session/generate-dimension(主体在 execution 层直构 AgentRunInput:AgentRunInputBuilders.ts:101,216、SessionExecutionBuilder.ts:452,携带宿主 DI/childInputFactories/coordination hooks/memoryCoordinator——Agent 侧补包装器=把宿主接线搬进包,**空壳/跨仓行为迁移双风险,需用户决策,默认登记不做**)、signal-analysis(全空间零生产调用方,主体仅 AgentProfileCompiler.test.ts:78,81;SPM 删除需求已废弃但 W1 已判"冻结不动"——维持)、chat(preset 非 profile,主体 ai.ts 直走 AgentService)
- 已有 7 包装器形态已统一(AgentService.run+profile id+projection),无重构缺口

### ③ module 双目录合一方案

- 删三件兼容层:runs/module/ 整目录(10 行 shim)、profiles/definitions/module.profile.ts(4 行 shim)、`MODULE_MINING_PROFILES` 别名(ScopedModuleMiningProfile.ts:53)与 ScopedModuleMiningAgentRun.ts:159-160 两 type 别名——消费者**仅 test/module-mining-agent-run.test.ts:3,6,29-31**(兼容性断言本身),同批改写该测试
- **不可动**:`runModuleMining` 值别名(ScopedModuleMiningAgentRun.ts:161)——主体 wire(ModuleMiningWorkflow.ts:45 动态 import+KnowledgeRescanWorkflow.ts:18+DaemonJobRunnerPlanGate.test.ts:4+vi.mock :20);保留 alias const 或改为命名导出函数,符号名不动
- runs/index.ts 与 service/index.ts:5-16 的再导出面(0b)零变化

### ④ 附带判定

- 7 子目录 9 文件是否扁平化(runs/*.ts):可选微批,省 7 目录改 ~10 相对 import;方案原文只要求 module 合一,**默认不动**【决策项③】
- §2.1 词汇表"agent/tasks 并入 runs":./tasks 是 exports 键(主体 ai.ts:23+test 消费 5 task* 符号;tasks/AgentTaskHandlers.ts:9 自身 import service)——并入=键目标改指或留壳,属词族批(W3II/W8)范畴,**W6 不动,登记**【决策项⑦】

### ⑤ 风险

- 极低(删 shim+1 测试改写);PlanAgentRun.ts 有跨仓 followup 在途(双宿主 plan 统一 U3,主体侧修复未落)——W6 不触其内容,只保结构原位,避让冲突

---

## A4 domain 拆归——【动,最小批(热身)】

### ① 现状(3 文件 1,382 行)

- EvidenceCollector.ts(879):**零 import 纯函数模块**(常量+净化正则起手,:1-50 无 import 行);证据萃取/负空间/预算控制
- EpisodicConsolidator.ts(493):仅 import @alembic/core/logging(:16);PersistentMemoryLike 等**全 duck-type**(:29-35)——与 memory/ 零编译期耦合,搬迁零 import 改写
- index.ts(10):EpisodicConsolidator+EvidenceCollector+6 类型再导出

### ② 消费面

- EvidenceCollector:Agent src 3(insightGate.ts:33 值、insightProducer.ts:23 值、scanPrompts.ts:48 type-inline)+test 3(contract-surface.test.ts:3、evidence-collector-fidelity.test.ts:26、recipe-authoring-inprocess-flatten.test.ts:28);context/l4MemoryPackage.ts:39 只是**同名 duck 接口 EvidenceCollectorResultLike,非 import**(勿误计)
- EpisodicConsolidator:仓内仅 domain/index.ts:1+contract-surface.test.ts:137;**外部=主体 CompletionSteps.ts:142 动态 import '@alembic/agent/domain'**(W5-B2 后位置)
- ./domain 签名名集=2(EpisodicConsolidator/EvidenceCollector),hash 8eba8cdb…

### ③ 归属表与目标布局

| 文件 | 去向 | 理由 |
|---|---|---|
| EvidenceCollector.ts | **src/agent/evidence/** | 证据供给件,A1 后主消费者是 evaluation/(工件构建)+prompts/(producer 文本);方案原文"evidence/" |
| EpisodicConsolidator.ts | **src/agent/memory/** | Episodic→Semantic 固化引擎,消费对象全是 memory 三层(SessionStore.ts:396 注释自认 F17 服务它) |
| domain/index.ts | **原址留壳** re-export('../evidence/EvidenceCollector.js'+'../memory/EpisodicConsolidator.js') | ./domain exports 键+dist/agent/domain/index.js 必须继续存在(主体动态 import+签名 2 名集不变) |

- ./memory 名集(14)**不加 EpisodicConsolidator**——加名=regen+扩公共面,无消费需求;它继续只经 ./domain 面世

### ④ 步骤与⑤ 风险

1. `git mv` 两文件+domain/index.ts 改写+9 处 import 回写(src 3+test 3+barrel;EpisodicConsolidator 零 import 改写)→ 0d 全链+主体 `npx vitest run test/unit/*Completion*`(CompletionSteps 动态链)
- 风险:接近零。唯一注意:evidence/ 新目录若只 1 文件,可不设 index.ts(直接文件级 import,naming-lint 通行)

---

## A5 能力三名合一+W3-D6——【动,小批】

### ① 三名链现状

`GenerateAnalyze`(类,toolsets/GenerateAnalyze.ts:7,extends RuntimeCapability)→`'code_analysis'`(键,CapabilityRegistry.ts:15)→`CodeAnalysis`(别名,capabilities/index.ts:6 `export { GenerateAnalyze as CodeAnalysis }`)。全族映射(CapabilityRegistry.ts:14-21):

| toolset 类 | 键 | 别名(capabilities/index.ts) | 别名上公共面? |
|---|---|---|---|
| Conversation | 'conversation' | — | — |
| GenerateAnalyze | 'code_analysis' | CodeAnalysis(:6) | 是(root+./agent,agent/index.ts:50) |
| GenerateProduce | 'knowledge_production' | KnowledgeProduction(:7) | 是(:52) |
| ScanProduce | 'scan_production' | ScanProduction(:8) | 否(仅 capabilities barrel) |
| ScanAnalyze | 'scan_analyze' | — | 类名在 root/./tools/runtime;**键全空间零消费+类零实例化(死键候选,登记)** |
| System | 'system_interaction' | SystemInteraction(:9) | 是(:53) |
| Evolution | 'evolution_analysis' | EvolutionAnalysis(:5) | 否(仅 barrel) |

- W3 commit(e4e8a3f)自述留给 W6 的两件事原文:"agent/capabilities 别名层(CapabilityRegistry 运行时注册表)保留待 W6 安置职责后删;类名 Capability/RuntimeCapability→Toolset 排 W6 之后"

### ② 消费面(capabilities/ 2 文件 66 行)

- agent/index.ts:47-54(6 符号 re-export 上 root+./agent 公共面);AgentRuntime.ts:35(值 Capability+CapabilityRegistry;:2064-2074 instanceof+create)、AgentRuntimeBuilder.ts:3(:72-74 create(name,opts),:141 'system_interaction' 特判)、AgentRuntimeTypes.ts:214(type)、LoopContext.ts:15(type)、SystemPromptBuilder.ts:15(type)
- **别名符号(CodeAnalysis/KnowledgeProduction/SystemInteraction/EvolutionAnalysis/ScanProduction)消费=0**:主体/Plugin/Agent src/test 全空间实扫零命中(除 re-export 行自身);capabilities/index.ts 的 default 导出对象亦零消费

### ③ W3-D6 执行方案

1. **安置 CapabilityRegistry**:平移 `src/agent/capabilities/CapabilityRegistry.ts → src/tools/runtime/toolsets/CapabilityRegistry.ts`(键→构造器注册表,与 toolsets 同居最自然;layer 合法:tools 区内自引,tools→[shared] 不受影响)。⚠️ **不可命名 toolsets/registry.ts**——tools/runtime/registry.ts 已存在(TOOL_REGISTRY 工具注册表,tools/runtime/index.ts:29),同名双 registry 是新的认知地雷;文件名保 CapabilityRegistry.ts(类名改 Toolset 词族排 W6 后,同 W3 判)
2. **删 agent/capabilities/ 别名层**(2 文件):agent/index.ts:47-54 改为直引 `#tools/runtime/toolsets/{Capability,CapabilityRegistry}.js` 并**只保真名 re-export**(Capability/CapabilityRegistry/Conversation 已同名;删 CodeAnalysis/KnowledgeProduction/SystemInteraction 三别名【决策项④,公共 API 删名,零消费者,推荐删;保守备选=agent/index 原地保三行 alias re-export,别名层文件仍可删】);AgentRuntime.ts:35、AgentRuntimeTypes.ts:214、LoopContext.ts:15、SystemPromptBuilder.ts:15、AgentRuntimeBuilder.ts:3 共 5 文件 import 改指 toolsets
3. 签名快照 regen(root/./agent 名集 -3;与 W6-0 的 stale 修复可并批或续批,hash 必变)

### ④ "别名层删后改少一半联动"验证(W3 判断成立)

- 删别名层联动面:6 文件 import 改指+快照 regen+**0 个符号消费者改写**
- 对照类名 Capability/RuntimeCapability→Toolset 改名联动面:AgentRuntime.ts 17 处+LoopContext 3+SystemPromptBuilder 5+AgentRuntimeTypes 1+toolsets 9 文件(8 子类 extends+barrel)+公共名 Capability/RuntimeCapability(root/./agent/./tools/runtime 三面快照)+主体 AgentModule.ts:18 RuntimeCapabilityCatalog(词根牵连)——**远大于别名删除,确应排 W6 后词族批**

### ⑤ 能力键=半 wire 判定(任务问)

**是,冻结**(0b 已列):键是 PRESETS.capabilities 值(presets.ts:146,183,191,238,338,346)+profile defaults.skills 值(evolution/relation/scan.profile)+CompiledAgentProfile.skills 跨包流动+主体测试断言(AgentProfileCompiler.test.ts:44,110;V2ToolSystem.test.ts:639,659)+AgentRuntimeBuilder.ts:141 特判。W6 只动"类的安置与别名",**七个键字面串一个不动**。

---

## A6 杂项

### tokenUtils 语义统一判定(W2 降级项)——**W6 不动**

- Agent 实况**三套**:①src/shared/tokenUtils.ts(estimateTokens:CJK 0.5/ASCII 0.25+estimateTokensFast:/3.5)——**与 Core src/shared/tokenUtils.ts 同权重同名**(Core 版多注释;"Agent↔Core 权重不同"的 W2 供料口径与实扫不符,需修正);②tools/kernel/registry.ts:319(`Math.ceil(text.length/4)` 平权无 CJK)——**真正的语义分叉在 Agent 仓内部**(kernel 版 vs shared 版),且 kernel 版 `estimateTokens` 名经 ./tools/runtime+root **在公共 wire 上**(签名快照在列),消费=handlers 6 文件+router(工具结果预算/截断语义);③消费分布:shared 版←ContextWindow/ConversationStore/ActiveContext/MemoryCoordinator/LLMInputMeasurement
- 判定:统一权重=改工具截断/预算行为(非结构),且公共名撞车(同名两语义都在 wire)——**W6 结构批不动;登记 W2 尾单**:前提是 Core exports 增 tokenUtils facade(Core 现无该出口),Agent shared 副本才可换源;kernel /4 版建议后续改名消歧(如 estimateToolResultTokens)而非改权重
- Agent 内 [Insight-v3] 日志=0(已清,无 W3 残留)

### 死区/腐化登记(本批不删,逐项有主)

| 项 | 锚点 | 处置 |
|---|---|---|
| applyGraphRetryGate 零消费 | insightGate.ts:1069(F4g 注释:实测 DeepSeek 不吃 graph retry,保留待模型再评估) | 随 A1 迁 evaluation/,**不删**(有明示保留决策) |
| 'scan_analyze' 键+ScanAnalyze 零实例化 | CapabilityRegistry.ts:18;类在 root/./tools/runtime 公共面 | W1 型死区候选,删=快照 regen+公共删名→【决策项⑤】 |
| agent/index.ts:38-43 头注 preset 表 stale | 写着 chat/bootstrap/scan,真集是 chat/insight/evolution | W6-0 顺手改(纯注释) |
| layer-contract.json 叙述文本旧路径 | layerRationale/cycleFindings 引 tools/runtime/capabilities/Capability.ts | A5 批顺手改(不触 enforced 字段) |
| Agent CLAUDE.md「工具系统 V1 退役登记」节 | 引已亡 src/tools/v2/(kernel 收敛后 stale) | 登记给仓库文档维护,W6 不动(CLAUDE.md 非本批范围) |
| signal-analysis profile 零生产触发 | signal.profile.ts;主体仅测试引用 | 维持 W1"SPM 冻结不动"判定 |
| EvidenceCollector.ts:7 头注引史前名 bootstrap-gate.js | — | A4 顺手改 |

---

## 执行顺序推荐(先小后大,每批独立 commit 可回退)

| 批 | 内容 | 规模 | 前置 | 验证 |
|---|---|---|---|---|
| **W6-0** | 基线修复:regen agent-public-api-signatures.json(S4 批3a 欠账 Bootstrap*→Generate*,独立 commit 记欠账)+agent/index.ts:38-43 stale 头注 | 微 | 无 | `npm run check` 首次全绿基线确立 |
| **W6-a** | A4 domain 拆归:evidence/+memory/ 迁移+domain/index 留壳 | 2 mv+9 import | W6-0 | 0d 全链+主体 CompletionSteps 链测试 |
| **W6-b** | A3 module 双目录合一:删 runs/module/+module.profile.ts+MODULE_MINING_PROFILES 三别名+改写 module-mining-agent-run.test | 3 删+1 test | 无(可与 W6-a 换序) | 0d 全链 |
| **W6-c** | A5:CapabilityRegistry 迁 toolsets/+删 agent/capabilities/+5 文件 import 改指+(决策④过)删三别名公共名+快照 regen | 1 mv+1 删+6 文件 | W6-0;决策④ | 0d 全链+主体 V2ToolSystem.test |
| **W6-d** | A1 evaluation 拆出:~1,900 行段级迁移(insightGate 四段+producerRejectionGateEvaluator+scanPrompts 两 builder)+路由常量导出+prompts/index 名集恒等重组+4 src/8 test 回写 | 最大批 | W6-a(EvidenceCollector 新址) | 0d 全链+./prompts 27 名集比对+insight-depth-retry/summary-rewrite-gate+主体 5 prompts 测试 |
| **W6-e** | A2 presets 拆三文件(方案甲)+降级头注/README | 1→4 文件 | W6-d(presets 对 evaluator 的 import 新路径一次到位) | 0d 全链+主体 GenerateProcessEvents/ai 路由测试 |
| **W6-f** | 收尾:layer-contract 叙述文本+EvidenceCollector 头注+README 结构地图+死区登记落 ledger | 小 | 全部 | 0d 全链+`git diff --check` |

顺序理由:W6-0 不先行则每批验证被预红污染;A4/A3/A5 小批热身且 A4 先行让 A1 的 EvidenceCollector import 一次写对;A2 排 A1 后避免 presets import 路径二次改写。

**用户决策项汇总**:①evaluation/ 内切分粒度(推荐三~四文件:analysisArtifact/qualityGates/gateEvaluators[/stageBuilders]);②A2 方案甲(拆文件+语义降级,推荐)vs 乙(factory 注册表化,follow-up);③runs/ 七子目录扁平化(可选,默认不动);④CodeAnalysis/KnowledgeProduction/SystemInteraction 三公共别名删除(零消费,推荐删,需授权公共 API 删名+快照 regen);⑤'scan_analyze'+ScanAnalyze 死键处置(登记,W1 型后续);⑥generate-session/generate-dimension 包装器缺口(跨仓行为迁移,登记不做);⑦./tasks 并入 runs(词汇表方向,wire 键牵连,缓议);⑧insight* 文件名族改名(拆分后独立微批:analystPrompt/producerPrompt/evolverPrompt/repairPrompts)。

## 统计

| 子项 | 判定 | 涉源文件(行数) | 消费面联动 | exports/wire 变更 |
|---|---|---|---|---|
| A1 evaluation 拆出 | 动(W6-d) | prompts 6(3,432)→prompts 5+evaluation 3~4 | Agent src 4+test 8;主体 0(名集恒等) | 0(./prompts 27 名集不变) |
| A2 presets 降级 | 动·方案甲(W6-e) | presets.ts(462)→4 文件 | Agent 内 re-export 2 处 | 0(PRESETS/preset id/事件字段全冻结) |
| A3 runs 统一 | 动·module 合一(W6-b) | 删 shim 3(24)| 1 test 改写 | 0(runModuleMining 符号保留) |
| A4 domain 拆归 | 动(W6-a) | 3(1,382):2 迁+1 留壳 | src 3+test 3 | 0(./domain 留壳,名集 2 不变) |
| A5 能力三名 | 动(W6-c) | capabilities 2(66)删+1 mv | 6 文件 import;别名符号消费 0 | 决策④:root/./agent -3 名(regen) |
| A6 tokenUtils | **登记不动** | 3 套实况澄清(shared 与 Core 同权重;分叉在 kernel /4) | — | 待 Core facade(W2 尾单) |
| W6-0 快照 regen | **前置必做** | config 1 | — | 快照追平 S4 现实(非 wire 变更) |

外部消费总账:@alembic/agent 12 键,主体 lib/bin 39 文件/test 44 文件(0a 分键表);Plugin/Core/Dashboard 消费 **0**;主体 config/agent-extraction-boundary.json expectedSpecifiers **零 @alembic/agent 串,W6 零回写**;主体 PcvStageNodeMap/ProcessEvents/HTTP presets 投影三条半 wire 链全程冻结。
