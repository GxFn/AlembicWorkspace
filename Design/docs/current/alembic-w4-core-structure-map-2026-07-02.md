# W4 Core 结构批执行底稿

- 生成:2026-07-02,只读扫描产物(未改任何源码);沿用 W3 底稿方法论(`Design/docs/current/alembic-w3-vocabulary-map-2026-07-02.md`)
- 扫描基线:AlembicCore@`268690c`(W3 全部落地后:workflows/capabilities→surfaces 已改名、src/sustain.ts 已建、evolution.ts 为 shim)
- 范围:`AlembicCore/{src,test,scripts,config,docs,package.json}`;外部消费面 `Alembic/{lib,bin,test}`、`AlembicPlugin/{lib,test}`、`AlembicAgent/{src,test}`、`AlembicDashboard/src`(逐目录 `find -exec grep`,共 1041 行 `@alembic/core` 命中,原始清单在扫描工作区)
- 「外部消费」列出的是 `@alembic/core/<subpath>` import(含动态 import 与 vi.mock 整串);注释引用单独标注,不算 wire
- ⚠️ **基线红灯**:`node scripts/lint-layer-contract.mjs`(node v22.22.1)当前 **3 违规**,全在 `src/service/planFacts/`(见 4-3)。W4 任何批次动工前先修,否则 `npm run check` 全程假红基线

---

## 0 硬约束与门禁锚点总表(全批共用)

### 0a exports 冻结面(package.json,共 66 键)

| 分类(config/public-api-boundary.json) | 数量 | 与 W4 相关键 |
|---|---|---|
| stablePublicExports | 29 | `./service/planFacts`、`./plans`、`./host-agent-workflows`、`./capability`、`./repositories`、`./dimensions`、`./knowledge`、`./sustain`、`./evolution`、`./project-context-capabilities` |
| provisionalPublicExports | 8 | `./service/candidate`、`./service/quality`、`./service/recipe`、`./service/bootstrap`、`./types`、`./shared` |
| transitionalInternalExports | 29(22 精确+7 wildcard) | `./workflows`、`./workflows/surfaces`、`./workflows/surfaces/host-agent`、`./workflows/surfaces/planning/{dimensions,knowledge}`、`./workflows/surfaces/{persistence,presentation}`、`./workflows/cold-start`、`./workflows/knowledge-rescan`、`./workflows/shared`、`./repository`、`./core`、`./types/{graph-shared,search-wire}` |

- 无 `./service/planIntent`、`./service/recipeStatus`、`./repository/evolution`、`./repository/coverage` 条目(这些目录是纯内部,搬迁无 exports 联动)
- expectedCounts(public-api-boundary.json)= stable 29 / provisional 8 / transitional 29:**W4 全部子项都不增删键,只改目标路径 → 三份清单与 expectedCounts 字面不变**
- W3 先例(W3 底稿 3-4a):外部消费 0 的子路径可原子切换 exports 目标;外部消费 >0 的必须保持解析结果不变(键不动+新目标导出集合等值即满足;vi.mock 按 specifier 匹配,目标切换无感)

### 0b 路径串门禁锚点(改目录必查)

| 文件:行 | 内容 | W4 触点 |
|---|---|---|
| test/CoreToolSystemBoundary.test.ts:72-77 | 扫描目录白名单 `src/workflows/surfaces/{coverage,host-agent,planning/knowledge}`、`src/workflows/{cold-start,knowledge-rescan,project-index}` | 扫描是递归(listFiles),host-agent/project-index **内部**分子目录不需改此表;顶层目录改名才需改 |
| test/CoreCodexBoundary.test.ts:72-79 | 同上白名单(HOST_AGENT_WORKFLOW_DIRS) | 同上 |
| test/CoreDeliveryBoundary.test.ts:8-17 | 禁目录 `src/service/delivery`、`src/repository/delivery` 等 | host-agent/delivery/ 子目录**不在禁列**(禁的是 service/repository 根下) |
| test/CoreDeliveryBoundary.test.ts:19-27 | **禁 exports 键含 `/delivery` 段**(BANNED_EXPORT_SEGMENTS,`key.includes` 判定) | ⚠️ 4-4 拆出 delivery/ 子目录后**绝不能**为它加 exports 子路径 |
| test/CoreDeliveryBoundary.test.ts:42-45 | 禁 import 串 `service/delivery`/`repository/delivery` | 相对 `./delivery/xx.js` 不匹配,安全 |
| test/BlessedSingletons.test.ts:57 | 硬路径串 `src/workflows/surfaces/host-agent/SessionSupport.ts` | 4-4 移 SessionSupport 时同批改 |
| config/blessed-singletons.json:89(blessed[].module)、:173(lintExemptions[].file) | 同一路径串两处 | 同上,共 **3 处**联动 |
| test/PublicProjectIntelligenceEntrypoints.test.ts:66-71,77-87 | 动态 import `../src/index.js`、`../src/host-agent-workflows.js`、`../src/workflows/surfaces/index.js`+exports 缺席断言 | facade 导出集合等值校验的现成回归 |
| scripts/smoke-public-api.mjs:28,36,169,276 | 硬编码 `'./core/capability'`、`'@alembic/core/capability'`、`'@alembic/core/service/candidate': ['aggregateCandidates','findSimilarRecipes']` | 附带项 core/capability 若动须改 :28;4-2 键不动自动过 |
| config/naming-lint.json:56-59 | 豁免 `src/host-agent-workflows.ts` | 不动 |
| config/naming-lint.json:61-64 | 豁免 `src/recipe-context.ts` —— **该文件已不存在**(src 无此文件、exports 无 ./recipe-context) | 死条目,4-7 批顺手删 |

### 0c 每批统一验证命令

`npm run build:check` + `npm run test`(至少边界 5 测 + 涉动测试)+ `node scripts/lint-layer-contract.mjs` + `node scripts/smoke-public-api.mjs` + facade 导出集合等值(拆分批:构建前后 `Object.keys(await import('./dist/host-agent-workflows.js')).sort()` diff);exports 目标改指批加外层 `tsc`(Alembic/AlembicPlugin/AlembicAgent)。Node≥22(.nvmrc)。

---

## 4-1 plan 三合一 —— 【动,中等规模】

### 现状文件清单

| 目录 | 文件 | 行数 |
|---|---|---|
| src/service/planFacts/ | collect-project-context.ts | 513 |
| | index.ts | 13 |
| | project-info-tree.ts | 1149 |
| | project-source-facts.ts | 275 |
| | transient-transport.ts | 68 |
| src/service/planIntent/ | contracts.ts | 79 |
| | index.ts | 3 |
| | plan-authoring-spec.ts | 94 |
| | planIntent.ts | 386 |
| src/service/recipeStatus/ | contracts.ts | 135 |
| | index.ts | 2 |
| | recipeStatus.ts | 436 |
| 合计 | 12 文件 | 3153 |

- exports 精确条目:**`./service/planFacts`**(→ dist/service/planFacts/index.js,**stablePublicExports**);planIntent/recipeStatus **无**子路径(经 `./plans` facade + service barrel 出)
- **planLedger 残留 = 0**:src/test/scripts/config/docs 全词零命中(W1 删净,实证)

### 消费面

Core 内(planFacts):src 内零消费(只有目录内部相互引);test/PlanFactsDimensionDensity.test.ts:6(深路径 `src/service/planFacts/project-info-tree.js`)。
Core 内(planIntent):src/plans.ts:15,31;src/service/recipeStatus/contracts.ts:1、recipeStatus.ts:2(`../planIntent/index.js`);src/service/planFacts/project-info-tree.ts:20(`../planIntent/contracts.js`);test/PlanAuthoringSpec.test.ts:7(深路径 plan-authoring-spec.js)。workflows/project-index/ColdStartPlan.ts:60,63 的 `planIntent` 是**局部变量**非 import,不联动。
Core 内(recipeStatus):src/plans.ts:42,50;src/service/index.ts:8(barrel,经根 index.ts:62 泄到 `.` 根表面)。

外部(`@alembic/core/service/planFacts`,9 文件 10 处):
- Alembic/lib/recipe-pipeline/plan/PlanSelectionGate.ts:15
- Alembic/test/unit/DaemonJobRunnerPlanGate.test.ts:9 + :34(**vi.mock 整串**)
- AlembicPlugin/lib/recipe-generation/plan-tool.ts:14
- AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts:27、briefing-budget.ts:12(另 :5 注释)、cold-start.ts:29
- AlembicPlugin/test/unit/BriefingBudget.test.ts:7、McpCoreToolsCleanOutputContract.test.ts:1、PlanDraftNativeScopeWiring.test.ts:4
- AlembicAgent / AlembicDashboard:0

外部(`@alembic/core/plans`,13 文件 14 处,facade 不动、仅证 plans.ts 表面冻结):Alembic/lib/daemon/DaemonJobWorkflowTypes.ts:2、DaemonJobWorkflowHelpers.ts:1、lib/recipe-pipeline/plan/PlanSelectionGate.ts:10、generate/DeepMiningRoundGate.ts:3、GenerateWorkflow.ts:6、ColdStartWorkflow.ts:44、test/unit/ColdStartPlanSelection.test.ts:3;AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts:1、plan-confirm.ts:11、plan-tool.ts:2、test/unit/PlanDrivenGenerationGate.test.ts:7;AlembicAgent/src/agent/profiles/definitions/plan.profile.ts:1、runs/plan/PlanAgentRun.ts:5(另 :79 注释)、test/plan-agent-run.test.ts:2。

### 目标布局(推荐:三子目录)

```
src/service/plan/
├── facts/    ← planFacts 5 文件原样
├── intent/   ← planIntent 4 文件原样
└── status/   ← recipeStatus 3 文件原样(误名修正:目录名 recipeStatus→status;文件 recipeStatus.ts→status.ts 可选,推荐同批改;导出符号 PlanGenerationState 等不动)
```
不推荐平铺:12 文件三职责(事实收集/意图契约/生成态投影)会糊;三子 barrel 与 exports 目标、plans.ts 分组 import 一一对应。不建 service/plan/index.ts 总 barrel(聚合职责已在根 src/plans.ts,再加一层=第四轨,违背 4-6 收口方向)。

### 执行步骤

1. `git mv src/service/planFacts src/service/plan/facts`;`git mv src/service/planIntent src/service/plan/intent`;`git mv src/service/recipeStatus src/service/plan/status`(先 `mkdir src/service/plan`)
2. 目录间相对 import 更新(移后相对关系不变的不动):
   - plan/status/contracts.ts:1、status/recipeStatus.ts:2:`../planIntent/index.js` → `../intent/index.js`
   - plan/facts/project-info-tree.ts:20:`../planIntent/contracts.js` → `../intent/contracts.js`
   - 三目录内对 `../../` 上两级的引用(domain/shared/根 facade)深度不变(service/planFacts→service/plan/facts 深度 +1!)——⚠️ **深度 +1**:facts/intent/status 内所有 `../../xx` 需改 `../../../xx`(collect-project-context.ts:11-20、project-info-tree.ts:7-19、project-source-facts、transient-transport、planIntent.ts、plan-authoring-spec.ts、recipeStatus.ts 逐文件过一遍;与 4-3 的 import 改写同文件,**必须与 4-3 合批或排其后**,避免同文件两改)
3. barrel/facade 更新:src/service/index.ts:8 `./recipeStatus/index.js` → `./plan/status/index.js`(成员不增删,根表面字节不变);src/plans.ts:15,31 → `./service/plan/intent/index.js`,:42,50 → `./service/plan/status/index.js`
4. exports:`./service/planFacts` 目标改 `./dist/service/plan/facts/index.{d.ts,js}`(键不动;10 处外部 import 与 vi.mock 全部无感)。config/public-api-boundary.json:三清单键不变,零编辑
5. 测试:test/PlanFactsDimensionDensity.test.ts:6、test/PlanAuthoringSpec.test.ts:7 深路径改;test/PlanSelectionProjection.test.ts:9 走 `../src/plans.js` 不动
6. 验证:0c 全套 + AlembicPlugin `tsc`(plan-tool.ts 是最重外部消费者)

### 风险注记

- **同文件双改**:4-3 的 3 条 lint 红全在 planFacts——先修 4-3 再搬,否则行号漂移+同文件冲突
- 同名冲突:plan/ 下三个 index.ts 分居子目录,无冲突;`contracts.ts` 在 intent/ 与 status/ 各一份(现状已如此),不合并
- wire 触点:`./service/planFacts` 是 stable 面;docs/wire-contract.md:22 冻结的 `generationStage` union 住 intent/contracts(纯搬迁不动字面);外层 vi.mock(DaemonJobRunnerPlanGate.test.ts:34)按 specifier,零联动

---

## 4-2 validation 并入 knowledge —— 【动,小规模】

### 现状(真实名单确认)

`ls src/service/` = bootstrap, candidate, guard, knowledge, planFacts, planIntent, project-context, quality, recipe, recipe-context, recipeStatus, search, source-graph, sustain, vector(15 目录)。方案说的"验证族三微目录"= **candidate / quality / recipe** 成立。

| 目录 | 文件 | 行数 | 导出 |
|---|---|---|---|
| candidate/ | CandidateAggregator.ts | 59 | aggregateCandidates |
| | CandidateValidationFacade.ts | 77 | validateCandidatesUnified + Unified* 3 类型(**不在 candidate/index barrel**,经根 ./knowledge facade 出,src/knowledge.ts:136-141) |
| | SimilarityService.ts | 157 | findSimilarRecipes |
| | index.ts | 2 | 仅 Aggregator+SimilarityService |
| quality/ | FeedbackCollector.ts | 218 | FeedbackCollector |
| | QualityScorer.ts | 406 | QualityScorer |
| | index.ts | 2 | |
| recipe/ | RecipeCandidateValidator.ts | 240 | RecipeCandidateValidator |
| | RecipeParser.ts | 310 | RecipeParser |
| | index.ts | 2 | |
| 合计 | 10 文件 | 1473 | |

### 消费面

Core 内:
- src/service/index.ts:2,6,7(barrel 三行)
- src/knowledge.ts:141(`./service/candidate/CandidateValidationFacade.js`)
- src/service/knowledge/ConfidenceRouter.ts:4(`../quality/QualityScorer.js`)
- src/service/candidate/CandidateValidationFacade.ts:15(`../recipe/RecipeCandidateValidator.js`,族内)
- src/service/knowledge/index.ts(13 文件 barrel)**不含**三目录任何符号——并入后不得加进去(见风险)

外部:
- `./service/candidate`(6):Alembic/lib/injection/modules/KnowledgeModule.ts:41;Alembic/lib/http/routes/search.ts:828(动态);AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:46;AlembicPlugin/lib/runtime/mcp/handlers/candidate.ts:143(动态)、tool-router.ts:354(动态);AlembicPlugin/test/unit/SubmitKnowledgeRouter.test.ts:112(**vi.mock 整串**)
- `./service/quality`(4):Alembic/lib/injection/ServiceMap.ts:64、modules/AppModule.ts:13;AlembicPlugin/lib/injection/ServiceMap.ts:53、modules/AppModule.ts:14
- `./service/recipe`(4):Alembic/lib/injection/ServiceMap.ts:65、modules/AppModule.ts:14;AlembicPlugin/lib/injection/ServiceMap.ts:54、modules/AppModule.ts:15
- Agent/Dashboard:0

Core 测试(深路径):test/CandidateValidationFacade.test.ts:4,5,6;CandidateValidationFloor.test.ts:10,11;FailureSemanticsCO3.test.ts:25,28;QualityScorerDepthCoverage.test.ts:10;PublicResidualReadinessEntrypoints.test.ts:9,10。

### 目标布局(推荐:三子目录平移,保留粒度)

```
src/service/knowledge/validation/
├── candidate/   ← 4 文件原样
├── quality/     ← 3 文件原样
└── recipe/      ← 3 文件原样
```
理由:与三条 exports 键一一对应、layer-contract.md:111 的 B3 判词(CandidateValidationFacade 统一验证入口)直接映射、族内相对 import(`../recipe/`)不变。备选"合成单层 validation/ 8 文件"要新造三个子 barrel 才能接 exports 目标,不推荐。knowledge/ 现有 13 文件,加一个 validation/ 子树无同名冲突(已核 knowledge/index.ts 成员)。

### 执行步骤

1. `mkdir src/service/knowledge/validation` + `git mv src/service/{candidate,quality,recipe} src/service/knowledge/validation/`
2. 三目录内上引深度 +2(`../../domain/...` → `../../../../domain/...`):CandidateValidationFacade.ts:14、SimilarityService、QualityScorer、FeedbackCollector、RecipeCandidateValidator、RecipeParser 逐文件(族内 `../recipe/`、`../quality/` 相对关系保持)
3. Core 内消费点:src/service/index.ts:2,6,7 → `./knowledge/validation/{candidate,quality,recipe}/index.js`;src/knowledge.ts:141 → `./service/knowledge/validation/candidate/CandidateValidationFacade.js`;src/service/knowledge/ConfidenceRouter.ts:4 → `./validation/quality/QualityScorer.js`
4. exports 三条目标改指:`./service/candidate|quality|recipe` → `./dist/service/knowledge/validation/<x>/index.{d.ts,js}`(键不动,动态 import 与 vi.mock 无感);public-api-boundary.json 零编辑
5. 测试 5 文件深路径改(上表逐行)
6. 验证:0c + smoke(:169 键不动自动过)+ Alembic/Plugin `tsc`

### 风险注记

- **根表面不变量**:三目录符号现经 service barrel 泄到 `.`;barrel 三行只改路径不增删 → 根导出集合字节不变。**禁止**把 validation 子树加进 service/knowledge/index.ts(那会经 `./knowledge` facade 和根 `.` 双重泄出制造重复导出)
- layer-contract.md:111(B3 validator entry 路径串)与 4-7 同批更新
- 无循环:validation/candidate → domain/knowledge/UnifiedValidator(:14)+族内 recipe;knowledge/ 本体文件不回指 validation(ConfidenceRouter 单向)

---

## 4-3 types 反向修复 —— 【动,小规模,P0 先行(基线红灯)】

### 反向边清单(实测)

**运行时反向(lint 现红,`scripts/lint-layer-contract.mjs` 输出原文)**:
| # | 位置 | 边 | 符号 |
|---|---|---|---|
| R1 | src/service/planFacts/collect-project-context.ts:15 | service → root-facade | `import { baseDimensions } from '../../host-agent-workflows.js'`(本体:src/workflows/surfaces/planning/dimensions/BaseDimensions.ts:69) |
| R2 | src/service/planFacts/collect-project-context.ts:16 | service → root-facade | `import { ProjectContextCapabilities } from '../../project-context-capabilities.js'`(运行时 const,装配在该 facade 尾部 `createProjectContextCapabilities(ProjectContext)`) |
| R3 | src/service/planFacts/project-info-tree.ts:7 | service → root-facade | `buildDimensionCatalogPayload` 等 from `../../dimensions.js`(facade 本体= src/domain/dimension/index.js) |

**type-only 反向(lint 豁免 config/layer-contract.json:4,但属方案定义的反向依赖)**:
| # | 位置 | 边 | 符号 |
|---|---|---|---|
| T1 | src/types/ProjectSnapshot.ts:17(使用点 :374 `sourceGraphResult`) | types → service | `SourceGraphLifecycleResult`(def: src/service/source-graph/SourceGraphLifecycle.ts:18;伴生 Reason:10/Action:12) |
| T2 | src/types/SnapshotViews.ts:10(使用点 :68 `evolutionPrescreen?`) | types → workflows | `EvolutionPrescreen`(def: src/workflows/surfaces/planning/knowledge/EvolutionPrescreen.ts:30) |
| T3 | src/types/SnapshotViews.ts:11(使用点 :70 `rescanExecutionDecisions?`) | types → workflows | `KnowledgeRescanExecutionDecision`(def: src/workflows/surfaces/planning/knowledge/KnowledgeRescanPlanBuilder.ts:88) |
| T4 | src/service/planFacts/{collect-project-context.ts:18 附近, project-info-tree.ts:18} | service → root-facade(type-only) | `DimensionDef` from `../../host-agent-workflows.js`(正源:src/types/ProjectSnapshot.ts,types/index.ts 亦再导出) |

### 解法(逐条)

- **R1(baseDimensions)**:直连 workflows 仍是 service→workflows ✗。**下沉 BaseDimensions.ts → src/domain/dimension/BaseDimensions.ts**(其 import 仅 domain/dimension/index.js:10-14,合法;移入后改引具体文件 `./DimensionRegistry.js` 等**避免与 domain/dimension/index.ts 互引成环**);原址 src/workflows/surfaces/planning/dimensions/BaseDimensions.ts 留 1 行 shim `export * from '../../../../domain/dimension/BaseDimensions.js'`(W3 host-agent/CoverageLedger* shim 先例),planning/dimensions/index.ts:1 与 host-agent-workflows.ts:93 表面不变;**不加进 domain/dimension/index.ts**(否则 `./dimensions` stable 面扩张)。collect-project-context.ts:15 改 `../../domain/dimension/BaseDimensions.js`(4-1 落地后 `../../../`)。同目录消费 generateDimensionConfigs.ts:15 经 shim 零改(或顺手直连)。test/PlanFactsDimensionDensity.test.ts:11 深路径可留 shim 路径
- **R2(ProjectContextCapabilities)**:**装配下沉**——`createProjectContextCapabilities` + `export const ProjectContextCapabilities`(project-context-capabilities.ts 尾部)移入新文件 src/service/project-context/capabilities.ts;根 facade 改纯转发(`export { ... } from './service/project-context/capabilities.js'`,`./project-context-capabilities` wire 面不变,外部 8 处消费无感——W3 底稿 3-4a 已证该子路径冻结);collect-project-context.ts:16 改 `../project-context/capabilities.js`(service→service ✓)
- **R3(dimensions)**:project-info-tree.ts:7 直改 `../../domain/dimension/index.js`(dimensions.ts 本体即它,service→domain ✓,符号 buildDimensionCatalogPayload/DimensionCatalogPayloadItem/ProjectLanguageFrameworkFacts 全在)
- **T1(SourceGraphLifecycleResult)**:字段链牵 `SourceGraphFreshnessReport`/`SourceGraphIndexBuildResult`(def: src/service/source-graph/SourceGraphIndexer.ts:65/:50)。三案按优先:
  1. **类型链整组下沉 domain/source-graph/SourceGraphContracts.ts**(既有契约家,service 引回 domain ✓;types→domain type-only 比 types→service 干净一级,但仍留一条 types→domain 桥)——执行时先核两接口字段是否只引 domain/自包含
  2. 本体上移 types/(新文件,不进 types/index barrel 防 `./types` 面扩张),service 从 types 引回(矩阵双向最干净;代价同样要整链)
  3. 兜底:ProjectSnapshot.ts:374 改 `unknown` + 消费点收窄(:429 已有 `sourceGraphResult?: unknown` 先例;消费仅 3 文件:types/projectSnapshotBuilder.ts、workflows/project-index/ColdStartPresenters.ts)——丢类型安全,列最后
  **列决策项**(1 与 2 都可,推荐 1)
- **T2/T3(EvolutionPrescreen / KnowledgeRescanExecutionDecision)**:两接口本体移 types/(建议并入 SnapshotViews.ts 同文件或新 types/planningViews.ts;执行时核字段自包含性——EvolutionPrescreen.ts:30 起、KnowledgeRescanPlanBuilder.ts:88 起);原文件改 `import type ... from '../../../types/...'` + **re-export 原名**(`./workflows/surfaces/planning/knowledge` transitional 子路径与 host-agent-workflows.ts:94 `export *` 表面不变)。⚠️ W3 3-1c:`evolutionPrescreen` 字段进 mission briefing 载荷=半 wire,只动类型宿主不动字段名
- **T4(DimensionDef)**:两处改 `import type { DimensionDef } from '../../types/ProjectSnapshot.js'`(1 行/文件,顺手)

### 执行步骤与验证

1. R3、T4(纯 import 改写,4 行)→ 2. R1(1 mv+1 shim+2 import)→ 3. R2(1 新文件+facade 转发+1 import)→ 4. T2/T3(类型搬家+re-export)→ 5. T1(按决策项定案后做)。每步后 `node scripts/lint-layer-contract.mjs`;步 1-3 完成即红灯清零。导出集合等值:`./dimensions`、`./project-context-capabilities`、`./host-agent-workflows`、`./workflows/surfaces/planning/{dimensions,knowledge}` 五个面构建前后 diff。

### 风险注记

- BaseDimensions 移 domain 后若误加 domain/dimension/index.ts → `./dimensions`(stable)与 `./knowledge` 等 export * 链表面扩张;shim 文件是防漂移锚
- R2 装配含 `Object.freeze`(运行时行为),纯平移不改语义;根 facade 转发后 `ProjectContextCapabilities` 仍同时是 interface+const 双名导出,保持
- T1 兜底案(unknown)会让 ColdStartPresenters.ts 的读取点转窄化断言——若选它须补消费点类型守卫

---

## 4-4 host-agent 拆分 —— 【动,最大单批】

### 现状(23 文件 10196 行;顶层 17 文件 8742 行)

`src/workflows/surfaces/host-agent/`,intra-dir 依赖图(实测,无环):
GenerateSession→{SubmissionTracker,MiningSessionStore};SessionSupport→GenerateSession;HostAgentDimensionCompletionWorkflow→HostAgentMissionWorkflow;HostAgentMissionWorkflow→{MissionBriefingBuilder,MissionBriefingSupport,SessionSupport};MissionBriefingBuilder→{EvidenceStarterBuilder,MissionBriefingSupport};IDEAgentAnalysisPacketBuilder(shim)→HostAgentAnalysisPacketBuilder→analysis-packet/*。

### 每文件归属表

| 文件 | 行数 | 归属 | 依据 |
|---|---|---|---|
| GenerateSession.ts | 745 | session/ | bs_ 会话本体(wire:`.asd/bootstrap-sessions/`) |
| SessionSupport.ts | 113 | session/ | sessionManagers 单例(blessed) |
| MiningSessionStore.ts | 667 | session/ | fs-backed 会话存储 |
| HostAgentSubmissionTracker.ts | 600 | session/ | 会话内提交追踪与质量评估(文件头注释) |
| HostAgentDimensionCompletionWorkflow.ts | 734 | session/(completion 判归 session) | 运行在活动 session 上,唯一 intra 依赖 MissionWorkflow |
| HostAgentMissionWorkflow.ts | 95 | session/ | 产物是 workflow session 容器(create+getActive) |
| CompletenessCritic.ts | 693 | session/(completion 群) | 维度完成度评审器,advisory(CoverageLedgerBuilder.ts:183-184 注释锚) |
| MissionBriefingBuilder.ts | 1479 | briefing/ | briefing 构建本体 |
| MissionBriefingSupport.ts | 434 | briefing/ | briefing 配置/模板(文件头注释) |
| EvidenceStarterBuilder.ts | 448 | briefing/ | briefing 证据 starter |
| HostAgentAnalysisPacketBuilder.ts | 1518 | briefing/(packet 判归 briefing) | packet=briefing 的结构化分析载荷,直连 analysis-packet/* |
| IDEAgentAnalysisPacketBuilder.ts | 3 | briefing/(随 packet,R1 shim) | 1 行转发 |
| analysis-packet/(6 文件) | 454 | briefing/analysis-packet/(整树随 packet) | 既有子目录平移 |
| ProjectSkillDeliveryContracts.ts | 690 | delivery/ | 交付契约常量+校验 |
| CoverageLedgerAdvisor.ts | 1 | 根留或删(决策项) | W3 shim→../coverage;唯一消费 test/unit/CoverageLedgerAdvisor.test.ts:13 |
| CoverageLedgerWrite.ts | 1 | **删(推荐)** | W3 shim,src/test **0 消费**(index.ts 不含它,exports 面不含它) |
| index.ts | 77 | 根留 | exports `./workflows/surfaces/host-agent` 的目标,原位重写 |

session 7 文件 3647 行 / briefing 5+6 文件 4336 行 / delivery 1 文件 690 行。跨组依赖单向:session→briefing(MissionWorkflow→Briefing*;DimensionCompletion→MissionWorkflow),briefing 不回指 → 无环。

### 两入口不变量(硬约束)

1. `src/host-agent-workflows.ts`(根 facade,**外部 76 处 import**,`./host-agent-workflows` stable):内部 import 3 处更新——:73(`./workflows/surfaces/host-agent/HostAgentAnalysisPacketBuilder.js`→`.../briefing/HostAgentAnalysisPacketBuilder.js`)、:74(`.../host-agent/index.js` 不动)、:91(`.../ProjectSkillDeliveryContracts.js`→`.../delivery/...`)。导出集合等值校验必做
2. `host-agent/index.ts`(`export *` 泄出面,exports 目标+surfaces/index.ts:2 链式再泄):原位改写为按新路径重导出(:1 `../coverage/index.js` 保留;:2-77 各行加子目录段)。导出集合等值校验必做
3. exports 判定:**`./workflows/surfaces/host-agent` 外部消费 0(本扫描复核:外部仅 2 处 not.toContain 反向断言字符串,Alembic/test/unit/ProjectContextWorkflowFacts.test.ts:1087、AlembicPlugin/test/unit/HostAgentProjectContextDirectSwitch.test.ts:188,且都是 project-intelligence 旧串)→ 内部三分后 exports 键与目标(dist/workflows/surfaces/host-agent/index.js)都不动,零 exports 变更**;三个新子目录一律不加子路径(delivery 段被 CoreDeliveryBoundary.test.ts:19-27 明令禁止)

### 执行步骤

1. `mkdir` 三子目录;`git mv` 按归属表(analysis-packet 整树 `git mv src/workflows/surfaces/host-agent/analysis-packet src/workflows/surfaces/host-agent/briefing/analysis-packet`)
2. 组内相对 import:同组文件间 `./X.js` 不变;跨组改 `../<组>/X.js`(SessionSupport→GenerateSession 同组;MissionWorkflow→Briefing* 改 `../briefing/...`;DimensionCompletion→MissionWorkflow 同组;PacketBuilder→`./analysis-packet/...` 不变)
3. 组外上引深度 +1:各文件 `../../../types|shared|domain|infrastructure/...` → `../../../../...`;兄弟 surfaces 引用(`../planning/dimensions/TierScheduler.js`、`../planning/knowledge/KnowledgeRescanPlanner.js`、`../presentation/LanguageExtensionBuilder.js`、`../persistence/DimensionCheckpoint.js`、`../coverage/*` 共 8 处)→ `../../<兄弟>/...`
4. 跨目录消费点更新:src/workflows/surfaces/persistence/WorkflowReportTypes.ts:2、WorkflowSnapshotStore.ts:10(`../host-agent/MiningSessionStore.js`→`../host-agent/session/MiningSessionStore.js`);src/workflows/project-index/ColdStartPresenters.ts:12(`../surfaces/host-agent/MissionBriefingSupport.js`→`.../briefing/MissionBriefingSupport.js`);src/host-agent-workflows.ts:73,91
5. blessed 三联动:config/blessed-singletons.json:89 module、:173 lintExemptions.file、test/BlessedSingletons.test.ts:57 → `src/workflows/surfaces/host-agent/session/SessionSupport.ts`
6. 测试深路径:test/GenerateSessionManager.test.ts:10,11;HostAgentSubmissionTrackingReads.test.ts:10;IDEAgentAnalysisPacketBuilder.test.ts:31,32;unit/HostAgentMiningWorkflow.test.ts:9-12;unit/CoverageLedgerAdvisor.test.ts:13(若删 Advisor shim 则改指 `src/workflows/surfaces/coverage/CoverageLedgerAdvisor.js`)。经 facade 的 CompletenessCritic.test.ts:3、ProjectSkillDeliveryContracts.test.ts:11、unit/BuildCoverageLedger.test.ts:16 零改
7. shim 清算(决策项):CoverageLedgerWrite.ts 直接删(0 消费);CoverageLedgerAdvisor.ts 改 1 处 test import 后删
8. 验证:0c + 两入口导出集合 diff + CoreCodexBoundary/CoreToolSystemBoundary(扫描递归,白名单字面不动,自动覆盖新子目录)

### 风险注记

- 最大风险=**index.ts/facade 重写时导出集合漂移**(index.ts 对 PacketBuilder 是 51 行具名子集而非 export *,漏一行即表面缩水)——用 PublicProjectIntelligenceEntrypoints.test.ts:66-87 现成动态 import 断言 + 前后 keys diff 兜底
- `delivery/` 目录名合法(禁的是 exports 段与 service/repository 根目录),但**永不加 exports 子路径**
- D3 已知跨界(layer-contract.md:75-84,session 状态↔persistence 快照↔completion)拆分后仍在 host-agent 内部,不加剧;md 文案随 4-7 更新路径
- MiningSessionStore 被 persistence 两文件 type-only 消费(:2/:10)——路径改漏会即时 build:check 红,风险可见

---

## 4-5 project-index 内部三分 —— 【推荐无动作(证据充分);若做=纯装饰小批】

### 真实现状(ls 实证)

- `src/workflows/cold-start/`、`src/workflows/knowledge-rescan/` **已是独立目录**,但为 **1 行 shim 目录**:cold-start/{ColdStartIntent,ColdStartPlan,ColdStartPresenters}.ts 各 1 行 `export * from '../project-index/<同名>.js'` + index.ts 3 行;knowledge-rescan/ 同构(3+1 文件)。exports `./workflows/cold-start`、`./workflows/knowledge-rescan` 指向 **shim 目录 dist**(dist/workflows/{cold-start,knowledge-rescan}/index.js),transitional、外部消费 0
- 本体 8 文件平铺 `src/workflows/project-index/`:ColdStartIntent 150 / ColdStartPlan 141 / ColdStartPresenters 386 / KnowledgeRescanIntent 155 / KnowledgeRescanPresenters 255 / KnowledgeRescanWorkflowPlan 61 / ProjectIndexPlan 265 / index.ts 19(共 1432 行)
- 消费:src/plans.ts:52-61、src/host-agent-workflows.ts:13-24(均经 project-index/index.js);shim 目录 8 文件;src/workflows/index.ts:1,2;test/ProjectIndexWorkflowPlan.test.ts:24;边界测试白名单(路径串,0b)

### 判定:无动作,证据

1. 方案骨架诉求"cold-start/knowledge-rescan/shared-plan 可独立寻址+shim 目录冻结面保持"中,**独立寻址已由顶层 shim 目录+两条 exports 子路径满足**(这正是"shim 目录冻结面");
2. 本体 8 文件文件名前缀已自然三分(ColdStart×3/KnowledgeRescan×3/ProjectIndexPlan=shared-plan),无混装文件;
3. 内部再分三子目录收益=目录树可读性一档,代价=8 个 shim 重导出行+project-index/index.ts 19 行+22 行 outbound 相对深度 +1(ColdStartPresenters.ts:1-15 等)+测试 1 处,纯机械且零行为差。

若用户仍要骨架字面一致,最小 mv 序列:`git mv` 三组文件入 project-index/{cold-start,knowledge-rescan,shared-plan}/ → 改 shim 目录 8 行指新路径 → project-index/index.ts 重写 → outbound 相对深度 +1 → 0c 验证。exports 键与目标全程不动。

---

## 4-6 出口收口 —— 【政策批,零/极小代码增量】

### 盘点

① **根 facade src/index.ts(80 行)导出全集**:`export *` × {core/index, daemon/index, domain/index, infrastructure/index, shared/index, service/index(:62)} + 具名 host-agent 子集(:4-58,54 符号)+ KnowledgeRepositoryImpl(:61)+ DivergenceError/PersistenceError(:63)+ OutputBudget 8 具名(:71-80,SD-5 RW1 注释锚)。
② **service barrel 存在**:src/service/index.ts,10 行/15 目录含 10(bootstrap,candidate,sustain,guard,knowledge,quality,recipe,recipeStatus,search,vector),**漏 5**(planFacts,planIntent,project-context,recipe-context,source-graph);唯一消费者=根 index.ts:62(即它的全部内容都泄在 stable 根 `.` 上)。
③ **exports 66 键分类**:见 0a。聚合 facade 类(根 . + 24 个根 src/*.ts 单文件 facade:capability/config/database/dimensions/enhancement/events/evolution/guard/host-agent-workflows/io/knowledge/logging/memory/plans/project-context/project-context-capabilities/recipe-context-capabilities/report/repositories/search/sustain/test-fixtures/vector/workspace)vs 深路径类(service/* 5、repository 族 9、workflows 族 11、core 族 5、infrastructure 族 7、domain/knowledge、daemon、shared、types 族 3)。
④ 环级聚合 facade 现状:plan=src/plans.ts(62 行,已聚合 intent+status+project-index 投影)✓;sustain=src/sustain.ts(74 行,W3)✓ + evolution.ts shim 冻结;generate 工作流面=src/host-agent-workflows.ts(98 行,外部 76 处)✓(名字不叫 generate——词族议题留 W5+,本批不动);curate/knowledge=src/knowledge.ts ✓。**四环聚合已齐,无需新建**。
⑤ 死资产:src/recipe-context.ts 已不存在(exports 亦无),但 config/naming-lint.json:61-64 豁免条目残留(0b)。

### 收口政策推荐(写进 layer-contract.md,4-7 同批)

1. **service barrel:废弃补全路线,冻结现员**。理由:补全会把 planFacts/planIntent/project-context 等 ~5k 行符号灌进 stable 根 `.`(表面扩张需全量碰撞审查:planIntent 的 PlanIntent 与 planFacts 引的同名类型、project-context 9 子域 contracts 与 domain/project-context 的同名 DTO 高危);外层已有正道(`./plans`、`./service/planFacts`、`./project-context`)。W4 动作=只随 4-1/4-2 改 barrel 内路径,成员零增删
2. **每环一聚合 facade 政策**:新符号出口顺序=环 facade(plans/sustain/knowledge/host-agent-workflows)优先,深路径子 exports 仅为"整模块接入"保留;根 `.` 只收敛稳定契约(现状已是,CLAUDE.md Package 入口规则同义)
3. **深路径 exports 键全部冻结**:目录重组一律"键不动+目标改指"(0a 先例);新目录不加新键
4. 增量代码=0 新文件;顺手项=删 naming-lint.json 死条目(⑤)

---

## 4-7 layer-contract.md 修复 —— 【动,文档+config 同批】

docs/layer-contract.md(123 行)腐坏逐处(实证:`find src -name` 三豁免对象全灭——ProjectIntelligenceRunner*/PanoramaScanner*/BootstrapSession* 均 0 命中;src/service/panorama 目录不存在):

| 行 | 现文 | 腐坏点 | 修正方向 |
|---|---|---|---|
| :3 | Status: CO2, 2026-06-12 | 未反映 W3/W4 | 追加修订行(保留 CO2 历史) |
| :15 | core/ 職責含 "capability ANALYSIS LEAF" | capability 探针是 infra 性质(见附带项判定);若判"不动"则只加注 | 随附带项判定措辞 |
| :18 | service 列 "(knowledge, evolution, candidate, recipe, guard, panorama, search, vector, quality, bootstrap)" | evolution→sustain(W3);panorama 已删;缺 plan(facts/intent/status)、project-context、recipe-context、source-graph;candidate/recipe 将并入 knowledge/validation | 4-1/4-2 落地后按真实 `ls src/service` 重写 |
| :19 | workflows 列 "capabilities (host-agent, persistence, planning, presentation, **project-intelligence**)" | capabilities→surfaces(W3 目录已改,此行漏改);project-intelligence 已退役;缺 project-index/shared/coverage | 重写为 surfaces{coverage,host-agent(briefing/session/delivery),persistence,planning,presentation}+project-index+shared+shim 目录说明 |
| :51-54 | blessed:`workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` → core | **文件不存在**(整仓 0 命中) | 删该 blessed 条;联动 config/layer-contract.json:86-89 matrixBlessings "workflows -> core" reason 仍引 ProjectIntelligenceRunner——且实测 workflows 现存 **0 条 runtime→core 边**。决策项:保留矩阵边(为 host-agent 证据构建留通道)改 reason,或删边收窄矩阵(契约变更须用户/控制器决策,md:119-123) |
| :64-73 | Known debt:`service/panorama/PanoramaScanner.ts` → project-intelligence 动态 import | **双方文件均不存在** | 整节删,注记"随 panorama/project-intelligence 退役已消解" |
| :75-84 | D3 straddle:`workflows/surfaces/host-agent/BootstrapSession.ts` | **文件不存在**(S4 已改名 GenerateSession.ts) | 改写为现名 GenerateSession.ts ↔ persistence/WorkflowSnapshotStore.ts ↔ HostAgentDimensionCompletionWorkflow.ts;4-4 落地后路径带 session/ 段 |
| :99-107 | CO2 repair 记录(TargetClassifier) | shared/TargetClassifier.ts 存在 ✓,历史记录 | 保留 |
| :111 | B3:`service/candidate/CandidateValidationFacade.ts#validateCandidatesUnified` | 4-2 后路径变 | 改 `service/knowledge/validation/candidate/CandidateValidationFacade.ts` |
| :30-41 | 矩阵表 | 与 config 一致 ✓;但 root-facade 行只写"may compose every area",未写反向禁令 | 增补一句:非 root-facade 区**不得 import 根 facade**(4-3 教训成文) |
| 新增 | — | 4-6 收口政策三条(barrel 冻结/环 facade 优先/键冻结目标改指) | 追加节 |

同批 config:config/layer-contract.json:86-89(matrixBlessings reason 文本,随上表决策项);config/naming-lint.json:61-64 死条目删。md 与 config 必须同 commit(md:119-123 自身要求)。

---

## 附带项(W3 遗留决策)

### W3-D1 CoverageLedgerRepository 归位 —— 【动,微批】

- 现状:src/repository/evolution/CoverageLedgerRepository.ts(304 行);**已不在** repository/evolution/index.ts barrel(4 行,仅 GitDiffCheckpoint/LifecycleEvent/Proposal/Warning)→ `./repository` 根 barrel(repository/index.ts:4 经 evolution/index)不含它
- 非导出子路径确认:exports 无 `./repository/evolution` 与 `./repository/coverage`(repository 族仅 base/bootstrap/code/sync+根 `./repository`)→ **纯内部搬迁,零 exports/boundary 联动**
- 消费(全部):src/repositories.ts:17-23(具名 import,:111,112,154 类型再导出、:179 类导出、:216 bundle 属性、:257 实例化——**只有 :23 的 import 路径要改**);src/workflows/surfaces/coverage/CoverageLedgerAdvisor.ts:19;test/unit/CoverageLedgerAdvisor.test.ts:8;test/CoverageLedgerRepository.test.ts(检查其 import 行,同批改);CoverageLedgerWrite.ts:14 经 `../../../repositories.js` 不动
- 步骤:`mkdir src/repository/coverage` + `git mv .../evolution/CoverageLedgerRepository.ts .../coverage/` + 建 1 行 coverage/index.ts(与 repository 子目录惯例一致;**不加进 repository/index.ts** 防 `./repository` 面扩张——现状它就不在)+ 3-4 处 import 路径改 + 0c 验证
- 风险:repositories.ts:179 的 `CoverageLedgerRepository` 类经 `./repositories`(stable,外部 36 处)导出——路径改指后表面不变;W3 底稿 3-1a 第 1 行的 EvolutionCoverageLedgerRepository 别名删除是 W3 范畴,若尚未落地勿在本批夹带

### W3-D2 RecipeSimilarity 迁出 —— 【动,微批】

- 现状:src/domain/evolution/RecipeSimilarity.ts(402 行;自身依赖仅 shared/recipeTokens.js(:27),域内另一文件 EvolutionPolicy.ts 192 行留守机制词目录;domain/evolution **无 index barrel**,消费全深路径)
- 目标:**src/domain/similarity/RecipeSimilarity.ts**(相似度=通用域能力;shared/ 已有 similarity.ts/tokenUtils.ts 通用原语,但 RecipeSimilarity 是 Recipe 实体域逻辑+EmbeddingSimProvider port,归 domain 而非 shared)
- 消费面(全部):src/service/sustain/ConsolidationAdvisor.ts:21-23、ProposalExecutor.ts:23-25、RedundancyAnalyzer.ts:15-17(三处 `../../domain/evolution/RecipeSimilarity.js`);src/sustain.ts:10-13(facade type 导出,`./sustain`+`./evolution`(shim `export * from './sustain.js'`)双入口表面不变);src/shared/recipeTokens.ts:8(**注释**,顺手改文案);test/unit/RecipeSimilarityEmbedding.test.ts:11、EmbeddingSimIdFlow.test.ts:13、EmbeddingSimProviderConduit.test.ts:12
- 步骤:`git mv` + 7 处 import 路径改 + 0c(重点 `./sustain`/`./evolution` 导出集合 diff,wire-contract.md:59 SimilarityRecipeLike 判词不动)

### 诊断项 core/capability 探针 —— 【判定:不动,列 W5+】

- 现状:src/core/capability/{CapabilityProbe.ts 277 行, index.ts 1 行};依赖=node 内建+infrastructure/logging/Logger(:25)+shared/ProjectMarkers、resolveProjectRoot(:26-27)→ 移 infrastructure/capability **层级上合法**(infra→infra/shared ✓)
- 消费(全部 3):src/capability.ts(根 facade,exports `./capability` stable、W3 已判"正解保留名"、外部 0 直连但 smoke 驱动)、src/core/index.ts:4(`./core` transitional 面)、src/test-fixtures.ts
- 判定 **不动**,理由:①无 lint 违规、无消费错位、无行为问题——纯语义纯度;②动它牵 scripts/smoke-public-api.mjs:28 硬编码 `'./core/capability'` + `./core` transitional 面成员迁移(要么留 re-export 保表面,要么接受 transitional 面缩水的审查);③"core 是分析叶"的 blessing 叙事(layer-contract.md:15)要同步改写;④与 Core 既有议题"拆 35k project-intelligence/接口收口"(Core capability 测绘)同属 core/ 区重构,合并到那一波处理更划算。本批仅在 layer-contract.md:15 加一句注记(capability 探针属 infra 性质、迁移列后续决策)

---

## 执行顺序推荐(先小后大,每批独立 commit 可回退)

| 批 | 内容 | 规模 | 前置 | 独立回退性 |
|---|---|---|---|---|
| A | 4-3 types 反向修复(R3/T4→R1→R2→T2/T3;T1 决策后补) | ~6 文件+1 mv+1 新文件 | 无(**必须最先:清 lint 基线红**) | 每步独立 |
| B | 附带 W3-D2(RecipeSimilarity)→ W3-D1(CoverageLedgerRepository) | 2 mv+11 import | 无 | 两子批各自回退 |
| C | 4-1 plan 三合一 | 3 目录 mv+~15 import+1 exports 目标 | A(同文件避让) | 单 commit |
| D | 4-2 validation 并入 | 3 目录 mv+~12 import+3 exports 目标 | 无 | 单 commit |
| E | 4-4 host-agent 拆分 | 16 文件 mv+~40 import+blessed×3+测试 6 文件 | 无(建议 A-D 绿后) | 单 commit(最大) |
| F | 4-5(若用户否决"无动作"判定才做) | 6 mv+~30 行 | 无 | 可整体不做 |
| G | 4-6 政策成文+4-7 layer-contract.md/json 重写+naming-lint 死条目删 | 纯文档+config | C/D/E 落地(路径引用最终态) | 单 commit |

每批验证=0c;C/D 批后加 Alembic/AlembicPlugin(/Agent,仅 C)`tsc`;G 批 `git diff --check`。
用户决策项汇总:①T1 三案选型;②matrixBlessings workflows→core 保边改文案还是删边;③4-5 无动作判定是否接受;④4-4 CoverageLedger 双 shim 退役;⑤core/capability 缓议是否接受。

## 统计

| 子项 | 判定 | 涉及源文件 | 行数 | exports 变更 | 门禁/路径串联动 |
|---|---|---|---|---|---|
| 4-1 plan 三合一 | 动 | 12(+barrel/facade/测试 6) | 3153 | 1 条目标改指(键不动) | boundary json 0;wire-contract 0 |
| 4-2 validation 并入 | 动 | 10(+消费 8) | 1473 | 3 条目标改指(键不动) | smoke 键不动;layer-contract.md:111 |
| 4-3 types 反向 | 动(P0) | ~10 | 反向边 3 运行时(现红)+4 type-only | 0 | lint 红清零是验收 |
| 4-4 host-agent 拆分 | 动 | 23(10196 行)+消费 5+测试 6 | 8742(顶层) | 0(键与目标都不动) | blessed×3;delivery exports 段禁令 |
| 4-5 project-index | **无动作**(备选小批) | 0(备选 16) | 0(备选 1432) | 0 | 0 |
| 4-6 出口收口 | 政策(零代码) | 0 新文件 | — | 0 | naming-lint 死条目删 |
| 4-7 layer-contract | 动(文档) | md 123 行 8 处+json 2 处 | — | 0 | md/json 同 commit |
| W3-D1 | 动 | 1 mv+4 import | 304 | 0 | 0 |
| W3-D2 | 动 | 1 mv+7 import | 402 | 0 | wire-contract:59 判词不动 |
| core/capability | **不动** | 0 | 0 | 0 | md:15 注记 |

外部消费总账(本次 find -exec grep 实测):`./service/planFacts` 10 处/9 文件、`./plans` 14 处/13 文件、`./service/candidate` 6、`./service/quality` 4、`./service/recipe` 4、`./host-agent-workflows` 76、`./workflows/*` 全族 0(仅 2 处 not.toContain 反向断言);AlembicDashboard 对以上子路径 0 消费。
