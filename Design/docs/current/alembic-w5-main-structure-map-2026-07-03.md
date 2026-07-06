# W5 主体结构批执行底稿(Alembic 主仓)

- 生成:2026-07-03,只读扫描产物(未改任何源码);格式沿用 W4 底稿(`Design/docs/current/alembic-w4-core-structure-map-2026-07-02.md`)
- 扫描基线:Alembic@`b3f9888`(2026-07-03);Core 侧参照 AlembicCore(W4 后:RECIPE_PIPELINE_EVENTS 已单源)
- 范围:`Alembic/{lib,bin,test,scripts,config,package.json}`;消费面逐目录 `find -exec grep`(workflows/daemon/service/project-context/tools 五族全量);跨仓对照 `AlembicPlugin/lib`、`AlembicDashboard/src`、`AlembicCore/src`
- ✅ **基线绿灯实证**:`node scripts/lint-layer-contract.mjs`(node v22.22.1)= `Layer contract OK: 162 cross-area runtime imports; 44 type-only bridges exempt`(W0 修复有效,无 W4 式基线红)
- ⚠️ 首轮 workflows 消费扫描曾因 `grep -v` 未锚定路径漏掉 test 消费行,已用 `-not -path "lib/workflows/*"` 重扫修正——本文所有消费清单以修正版为准

---

## 0 硬约束与门禁锚点总表(全批共用)

### 0a wire 冻结面(本批只动文件位置,键/串/路由零改)

| 冻结物 | 锚点 | W5 触点 |
|---|---|---|
| MCP 工具名(alembic_bootstrap/alembic_rescan 等) | AlembicCore/docs/wire-contract.md:33 | M1/M2 搬迁的 envelope `meta.tool` 字面不动 |
| Socket 事件 `bootstrap:*` | wire-contract.md:36:"发射端已切常量;**消费端字符串随批次切换**"——单源 `RECIPE_PIPELINE_EVENTS`(AlembicCore/src/domain/knowledge/recipe-authoring-spec/pipelineEvents.ts:14-29,7 键;出口 `@alembic/core/knowledge`,knowledge.ts:84) | M5 就是被授权的消费端切换;事件字符串值恒为 `bootstrap:*` 不改 |
| bootstrapSession 等 envelope 载荷键 | lib/workflows/project-context/ProjectContextPresenters.ts:38,99(toJSON 直通) | M2 只搬文件;键名消费链见 2-W3D4 |
| HTTP 路由(/modules/bootstrap、/wiki 等) | lib/http/routes/*(24 路由文件) | wiki 路由只改 import 目标,URL 不动 |

### 0b package.json imports(别名=全仓串联动)

现有 13 条别名(`#shared/#infra/#service/#inject/#governance/#platform/#types/#http/#workflows(×2 含 .js 变体)/#tools/#sandbox/#recipe-pipeline`)。实扫结论:

- **`#workflows/*` 与 `#workflows/*.js`(全仓唯一 .js 变体别名)在 lib/bin/test/scripts 消费=0**(仅 test/unit/AgentModuleBoundaries.test.ts:230 把 `#workflows/capabilities/persistence/...` 作**退役串黑名单**拼接,非 import)→ workflows 消亡批(B2)同批删这两条+lint 脚本映射行,安全
- `#tools/*` 保留(v2 收平只改子路径段,别名本体不动);**不新增 `#project-facts`**(现状 project-context 全走相对路径,维持;避免 imports 面扩张)
- 其余别名零触碰

### 0c layer-contract 三件套(W0 教训,目录增删必须同 commit)

机制实证(scripts/lint-layer-contract.mjs):

- FROM 侧:lib/ 新顶层目录不在 `allowedRuntimeImports` 键中 → 每文件 1 条 `area not declared` 红(脚本 :130-136)
- TO 侧:目标区不在 `areas[]` → 该边**静默跳过**(脚本 :148-158)——"缺别名/缺区=整条边不可见"的机制根源
- 别名:脚本内 `ALIAS_TO_AREA`(:29-42)与 package.json imports 双份维护,同批改
- 涉动区当前边数(--report 实跑):`daemon->workflows: 1`、`recipe-pipeline->workflows: 7`、`workflows->{service:4, injection:1, infrastructure:1, project-scope:1, shared:1}`、`service->project-context: 1`、`recipe-pipeline->injection: 2`、`http->recipe-pipeline: 2`、`tools->daemon: 2`
- config/layer-contract.json cycleFindings 末条(W0 注记)预告的"待 W5 收紧"四项=本批的 M1/M2/M5,落地后同批回写该注记

### 0d 其他门禁/路径串锚点

| 锚点 | 内容 | W5 触点 |
|---|---|---|
| test/unit/AgentModuleBoundaries.test.ts | 多测试递归扫 lib/workflows;`collectTypeScriptFiles` 对缺失目录返回 `[]`(:319-321) | **workflows 目录删除后全部断言自动通过,零改动**;其退役 specifier 黑名单(旧 bootstrap/common-capabilities 串)与本批新路径无交集 |
| config/agent-extraction-boundary.json:331,336,341 | `expectedSpecifiers: ["#tools/v2/ToolContextFactory.js"]`(×2)+`["../../lib/tools/v2/ToolContextFactory.js"]`——lint:agent-extraction-boundary **强制匹配面**(脚本 :80,:194,:222 读 expectedSpecifiers) | M6 tools/v2 收平同批改 3 处;:325 `hostOwnedToolV2Paths` 脚本不读(文档性),顺手同步 |
| config/shared-asset-manifest.json(15 资产) | lib 侧仅 6 条 w2-shell-*:infrastructure/cache×3、types/{graph-shared,search-wire}、shared/shutdown | **W5 全部涉动路径(workflows/daemon/service/wiki/handler-runtime/project-context/tools)零 manifest 条目→drift 门禁零联动(实证)** |
| 同路径 twin(未入 manifest,本批不动内容) | lib/service/{cleanup/CleanupService.ts, module/ModuleService.ts, skills/SkillHooks.ts, skills/types.ts, FileChangeDispatcher.ts}、lib/shared/schemas/mcp-tools.ts(Plugin 同相对路径存在,ls 实证) | M4 判"留 service"的目录恰是 twin 目录——**留=同时保住未来 drift 扩容的同路径前提**;wiki/handler-runtime/completion 在 Plugin 侧路径本就不同(surfaces/completion、runtime/mcp/handlers),主体单侧搬不产生 drift 红,但见各节协同注记 |
| lib/recipe-pipeline/README.md:12-13 | "共用事实层(不属于任一环,保持原位):`../workflows/project-context/`" | M2 落地后必须重写此行(B6) |
| 双胞胎内容纪律 | GenerateTaskManager 主体/Plugin 各 6 处裸 emit(见 5-2) | M5 只动 daemon 订阅侧;emit 侧留 Plugin 镜像批成对切换 |

### 0e 每批统一验证命令

`npm run build:check` + `npm run test:unit` + `node scripts/lint-layer-contract.mjs`;涉 tools 批加 `npm run lint:agent-extraction-boundary`;每批跑 `npm run check:shared-asset-drift`(应恒绿);B2/B5 大批后跑全量 `npm run check`;纯文档批 `git diff --check`。**Node≥22(.nvmrc=22;Node18=假红)**。

---

## M1 workflows 消亡评估 —— 【动,中等规模;"唯一消费者"判词全部实锤】

### 现状全目录树(7 文件 3257 行)

| 目录 | 文件 | 行数 |
|---|---|---|
| lib/workflows/completion/ | CompletionFinalizer.ts | 109 |
| | CompletionSteps.ts | 205 |
| | CompletionTypes.ts | 115 |
| lib/workflows/project-context/ | ProjectContextPresenters.ts | 184 |
| | ProjectContextWorkflowFacts.ts | 1661 |
| | ProjectMapModules.ts | 420 |
| lib/workflows/skill-delivery/ | SkillCompletionCapability.ts | 563 |

### 消费面(find -exec grep 修正版,全量)

**completion/**(lib 消费 1 文件+test 2 文件):
- lib/recipe-pipeline/generate/execution/AiDimensionFinalizer.ts:20(runtime,唯一 lib 消费)
- test/unit/SemanticMemoryCompletionStep.test.ts:5,6;test/unit/WorkflowCompletionFinalizer.test.ts:6
- ✅ 判词"唯一消费者是 generate 执行链"成立

**skill-delivery/**(lib 消费 1 文件+test 1 文件):
- lib/recipe-pipeline/generate/execution/GenerateConsumers.ts:26(runtime,唯一 lib 消费)
- test/unit/WorkflowSkillCompletionCapability.test.ts:6
- ✅ 判词成立

**project-context/** → 非唯一消费(四方),按方案独立成事实层,见 M2。

**completion 语义定位(去 generate 而非 curate 的证据)**:CompletionSteps.ts:34-47 动态 import `../../service/wiki/WikiGenerator.js`(wiki 生成)+:133,144,145 动态 import `@alembic/agent/{memory,domain}`(语义记忆固化)——全是"生成会话收尾"步骤;curate/README.md 自证 curate 是"门禁→落库→晋级"指针占位环,与收尾无关。**归 generate/**。

**completion 自身出边**(搬迁后区域归属变化):CompletionFinalizer.ts:97 动态 `import('#inject/ServiceContainer.js')`(= 当前 workflows->injection 唯一 runtime 边,AD4 reach-through 残留)→ 搬后变 recipe-pipeline->injection(既有方向,2→3 边,contract 已允许);CompletionSteps 的 4 处 wiki 引用与 M4a 同批变 intra-area。

### 目标布局

```
lib/recipe-pipeline/generate/
├── completion/        ← 3 文件原样(CompletionFinalizer/Steps/Types)
├── skill-delivery/    ← SkillCompletionCapability.ts
└── wiki/              ← M4a 同批并入(见 4-1),CompletionSteps 的 wiki import 一步到位
```
与 Plugin 镜像批协同:Plugin 侧 completion twin 现在 `AlembicPlugin/lib/workflows/surfaces/completion/`——**登记协同项:Plugin W5 批应落 `lib/recipe-pipeline/generate/completion/` 同相对路径**,为未来 drift manifest 扩容保同路径前提。

### 执行步骤(与 M4a wiki 合为一批,见执行顺序 B2)

1. `git mv lib/workflows/completion lib/recipe-pipeline/generate/completion`;`git mv lib/workflows/skill-delivery lib/recipe-pipeline/generate/skill-delivery`;(同批 `git mv lib/service/wiki lib/recipe-pipeline/generate/wiki`)
2. 组内 import:completion 内部相对 `./` 不变;CompletionFinalizer.ts:97 `#inject` 别名不变;CompletionSteps.ts:34,41,45,47 `../../service/wiki/WikiGenerator.js` → `../wiki/WikiGenerator.js`
3. skill-delivery 上引深度 +1:SkillCompletionCapability.ts:20 `../../project-scope/ProjectScopeRegistry.js` → `../../../project-scope/...`;:21 `../../shared/package-assets.js` → `../../../shared/...`
4. 消费点:AiDimensionFinalizer.ts:20 → `'../completion/CompletionFinalizer.js'`;GenerateConsumers.ts:26 → `'../skill-delivery/SkillCompletionCapability.js'`
5. 测试深路径 4 文件 5 行:SemanticMemoryCompletionStep.test.ts:5,6、WorkflowCompletionFinalizer.test.ts:6、WorkflowSkillCompletionCapability.test.ts:6(+WikiGenerator.test.ts:18 随 M4a)
6. **workflows 目录清算(M2 落地为前提,此时目录已空)**:删 lib/workflows;package.json 删 `#workflows/*`+`#workflows/*.js` 两条;config/layer-contract.json 删 areas 'workflows'+allowedRuntimeImports.workflows 键+recipe-pipeline/daemon allowed 中的 'workflows' 项;scripts/lint-layer-contract.mjs 删 ALIAS_TO_AREA `'#workflows'` 行(:39);layerRationale 文字同步
7. 验证:0e 全套(lint-layer-contract 应回报 workflows 相关边全消)

### 风险注记

- **顺序硬依赖**:必须 M2 先行(project-context 迁走),否则第 6 步删不掉目录;两批间 workflows 区短暂只剩 completion/skill-delivery,contract 不需中间态修改(区仍存在)
- CompletionTypes 的 `ServiceContainerLike` 是结构类型非 import,零联动
- CompletionSteps 动态 import `@alembic/agent/*` 是包入口,搬迁无感
- vi.mock 检查:completion/skill-delivery/wiki 三族**无 vi.mock 整串**(全仓 vi.mock 扫描仅 DaemonJobRunnerPlanGate.test.ts:25 一处涉动,归 M2)

---

## M2 project-facts 合并 —— 【动,中等规模;准循环判词方向修正后成立】

### 现状(两处 4 文件 2604 行)

| 来源 | 文件 | 行数 |
|---|---|---|
| lib/workflows/project-context/ | ProjectContextWorkflowFacts.ts | 1661 |
| | ProjectContextPresenters.ts | 184 |
| | ProjectMapModules.ts | 420 |
| lib/project-context/(单文件确认) | ProjectContextConsumerFacts.ts | 339 |

内部依赖自洽:Facts→Presenters(:45 再导出)+MapModules(:39,46);MapModules→Facts 仅 type(:10);ConsumerFacts 零 lib 内依赖(只吃 `@alembic/core/*`)。合并无文件名冲突。

### 消费面(全量,"四方"实锤=recipe-pipeline 三环+daemon+service;http=0 直连)

**workflows/project-context 消费(lib 13 行+test 6 行)**:
- daemon(2):DaemonJobRunner.ts:13(runtime,releaseProjectContextWorkflowSessionByProjectRoot,使用点 :435 rescan 取消清理)、DaemonJobWorkflowTypes.ts:4(type)
- recipe-pipeline/plan(1):PlanSelectionGate.ts:28(runtime,buildProjectContextWorkflowFacts)
- recipe-pipeline/generate(9):ColdStartWorkflow.ts:57,66(runtime×2);GenerateWorkflow.ts:8、ModuleMiningSelection.ts:4、execution/{AiDimensionDispatcher.ts:2, AiDimensionPipeline.ts:3, AiDimensionPreparation.ts:11, GenerateConsumers.ts:22, TaskManagerDispatch.ts:2}(全 type)
- recipe-pipeline/sustain(2):KnowledgeRescanWorkflow.ts:67,79(runtime×2)
- test(3 文件):DaemonJobRunnerPlanGate.test.ts:18 + **:25 vi.mock 整串**;ModuleMiningSelection.test.ts:3;ProjectContextWorkflowFacts.test.ts:16,24,28

**lib/project-context 消费(唯一)**:lib/service/module/ModuleService.ts:33(= 当前 service->project-context 的全部 1 边)

### 准循环实扫(证实,方向修正)

- recipe-pipeline→workflows:**7 runtime 边**(lint --report 实证;即上面 5 处 runtime 行)
- workflows→recipe-pipeline:**2 边且全 type-only**(ProjectContextWorkflowFacts.ts:30、ProjectMapModules.ts:9,均 `import type { GenerateFileEntry } from '#recipe-pipeline/generate/execution/AgentRunInputBuilders.js'`)
- 修正判词:runtime 层从无真循环(单向 7 边+type 回流 2 边);"准循环"是区域级双向观感。合并后:recipe-pipeline→project-facts 单向 runtime,project-facts→recipe-pipeline 保留 2 条 type 桥(typeOnlyImportsExempt=true,合法),**runtime 双向观感全消** ✓

### 目标布局与命名判定

**推荐 `lib/project-facts/`(方案名成立)**:①与 Core 的 `@alembic/core/project-context`(服务)、`@alembic/core/project-context-capabilities` 长期同名混淆,改名即消歧;②"facts"准确覆盖两文件家族(WorkflowFacts=采集态事实,ConsumerFacts=消费投影)。备选 `project-context-facts` 冗长不推荐。**文件名保持原样(纯 git mv)**,ProjectContextWorkflowFacts→ProjectFacts 类改名属 W3 词族批,不夹带。

```
lib/project-facts/
├── ProjectContextWorkflowFacts.ts   (自 workflows/project-context/)
├── ProjectContextPresenters.ts      (同上)
├── ProjectMapModules.ts             (同上)
└── ProjectContextConsumerFacts.ts   (自 lib/project-context/)
```

### 执行步骤

1. `mkdir lib/project-facts` + `git mv lib/workflows/project-context/*.ts lib/project-facts/` + `git mv lib/project-context/ProjectContextConsumerFacts.ts lib/project-facts/` + 删空的 lib/project-context/
2. 内部深度 -1(workflows/project-context 深 2 → project-facts 深 1):Facts:34 `../../infrastructure/database/SqliteDatabaseAccess.js` → `../infrastructure/...`;Facts:38 `../../project-scope/ProjectScopeAnalysis.js` → `../project-scope/...`;`./` 同目录引用(:7,:10,:39,:45,:46)不变;`#recipe-pipeline`/`@alembic/core` 引用不变
3. 消费点 15 行:daemon 2、plan 1、generate 9、sustain 2、ModuleService.ts:33(`../../project-context/ProjectContextConsumerFacts.js` → `../../project-facts/...`)
4. 测试 6 行:含 **DaemonJobRunnerPlanGate.test.ts:25 vi.mock 串**('../../lib/workflows/project-context/...' → '../../lib/project-facts/...',与 :18 import 同步)
5. **layer-contract 三件套同 commit**:areas 增 `project-facts`、删 `project-context`;allowedRuntimeImports 增 `"project-facts": ["infrastructure", "project-scope"]`;daemon 的 allowed `workflows`→`project-facts`(daemon->workflows 唯一边随迁移消);recipe-pipeline allowed 增 `project-facts`(`workflows` 项留待 B2 删);service 的 `project-context`→`project-facts`;ALIAS_TO_AREA 无需改(无别名)
6. lib/recipe-pipeline/README.md:13 事实层指针改 `../project-facts/`(或留 B6 统一改,二选一,勿漏)
7. 验证:0e;lint --report 应见 `daemon -> project-facts: 1`、`recipe-pipeline -> project-facts: 7`、`service -> project-facts: 1`、`project-facts -> {infrastructure:1, project-scope:1}`

### W3-D4 联动:bootstrapSession 载荷键消费链(登记供真机实证,本批零键改)

键面:ProjectContextPresenters.ts:38(coldStart envelope `data.bootstrapSession = input.bootstrapSession.toJSON()`)与 :99(rescan 同键);coldStart data 键全集=analysisFramework/autoSkills/bootstrapCandidates/bootstrapSession/cleanup/dimensionSelection/files/filesByTarget/languageStats/nextSteps/primaryLanguage/projectContext/report/secondaryLanguages/targets/taskCount/warnings/sessionId?/message(:35-53);rescan 键全集见 :98-139。

已实扫的读方(搬迁不动任何一环):

| 读方 | 锚点 | 通道 |
|---|---|---|
| Dashboard | api.ts:3417(POST `/modules/bootstrap` 响应 `data.bootstrapSession`)、:3528(rescan 同键)→ App.tsx:696-697,746-747(`initFromApiResponse` 喂 socket hook) | HTTP |
| CLI | bin/cli.ts:775-783(`result.bootstrapSession`) | 进程内 |
| jobs 面 | lib/http/routes/jobs.ts:515(`result.finalSession \|\| result.bootstrapSession`);JobsView.tsx:671-673(bootstrapSessionId) | HTTP |
| daemon 内部 | DaemonJobRunner.ts(finalizeBootstrapJobFromSession 族)、JobDisplaySnapshotStore.ts | 进程内 |
| MCP 宿主 | 主体 envelope `meta.tool='alembic_bootstrap'/'alembic_rescan'` 的响应字段由 host agent(AI)读——**真机实证项**;Plugin 侧 cold-start.ts 等的 bootstrapSession 是 Plugin 自有实现的同名键,不读主体响应(路径已核) | MCP |
| 输入 schema 辨析 | lib/shared/schemas/mcp-tools.ts:133,392 是 `bootstrapSessionRef`(输入参数,另一个名字),勿与响应键混算 | — |

### 风险注记

- 最大风险=vi.mock 整串漏改(DaemonJobRunnerPlanGate.test.ts:25)——vi.mock 按 specifier 匹配,漏改则 mock 失效、测试打真 sqlite
- Facts 文件同时是 bare 事件订阅方(:621,643,644 `'bootstrap:all-completed'`)——**本批纯搬不改内容**,常量切换归 B4(M5 节)
- layer-contract 若漏第 5 步任何一半:FROM 红("project-facts not declared")或边隐形(TO 不在 areas)——W0 教训原样适用

---

## M3 daemon 三群 —— 【动,大而机械;13 文件实锤,归属表全给】

### 现状(13 文件 5923 行)+ 归属表

| 文件 | 行数 | 归属 | 依据(文件头注释/主要导出) |
|---|---|---|---|
| DaemonJobRunner.ts | 1315 | jobs/ | createDaemonJob/enqueueDaemonJob/runDaemonJob+executeApiAiWorkflow(job 执行编排) |
| DaemonJobServices.ts | 79 | jobs/ | 头注:"AD4 managed lifecycle: daemon-job fallbacks…lazy registry"(job DI fallback) |
| DaemonJobWorkflowHelpers.ts | 281 | jobs/ | buildDaemonRescanWorkflowArgs+recordJobProcessEvent 等 job 参数/记录助手 |
| DaemonJobWorkflowTypes.ts | 100 | jobs/ | DaemonJobOptions/RunDaemonJobOptions/LoggerLike(job 契约类型) |
| JobDisplaySnapshotStore.ts | 671 | observability/ | 快照读写+summarizeJobDisplaySnapshotForApi(job 展示观测) |
| JobProcessEventRecorder.ts | 285 | observability/ | 事件环形缓冲+broadcast(DEFAULT_JOB_PROCESS_EVENT_LIMIT=240) |
| JobProcessEventArtifacts.ts | 173 | observability/ | JOB_ARTIFACT_ROOT 事件工件物化(0o600) |
| PcvObservabilityLinkage.ts | 475 | observability/ | PCV_N9 可观测性 carry(PCV_N9_OBSERVABILITY_CONTRACT_VERSION=1) |
| DaemonSupervisor.ts | 384 | runtime/ | DaemonStatus/start/stop/computeDaemonLockBackoffMs(进程守护) |
| ProjectRuntimeControl.ts | 1076 | runtime/ | per-project 运行时控制快照与动作 |
| ProjectRuntimeSourceOfTruth.ts | 747 | runtime/ | PROJECT_RUNTIME_SOURCE_OF_TRUTH_CONTRACT_VERSION=1 路由/写策略契约 |
| RuntimeBoundary.ts | 180 | runtime/ | LOCAL_ALEMBIC_ROUTE/DAEMON_JOB_KINDS(运行时边界常量) |
| FileMonitorStatus.ts | 157 | runtime/ | DaemonFileMonitorRuntimeState/Status(监视器运行态;RuntimeBoundary.ts:15 组内引用) |

组间内部依赖(18 行,实扫):jobs→observability 单向(DaemonJobServices:5,6;DaemonJobRunner:38,39,40;Helpers:7);runtime 组内(ProjectRuntimeControl:39→Supervisor、:46→SourceOfTruth;RuntimeBoundary:15→FileMonitorStatus);observability 组内(JobDisplaySnapshotStore:20,24)。**jobs↮runtime、observability↛jobs——无环** ✓

### 消费面(65 import 行,全实扫)

- bin/cli.ts:18 行(ProjectRuntimeControl 动态 ×13+静态 :43;DaemonSupervisor 动态 :244,270,287)
- bin/daemon-server.ts:2 行(:19 DaemonJobRunner、:20 FileMonitorStatus)
- lib/http:11 行(daemon.ts:26-29 ×4、file-changes.ts:23、jobs.ts:29,34,35、modules.ts:21、projects.ts:4,13)
- lib/infrastructure/realtime/RealtimeService.ts:8(JobProcessEventRecorder)
- lib/injection:4 行(ServiceMap.ts:68,69、modules/InfraModule.ts:24,25)
- lib/recipe-pipeline:12 行(DeepMiningRoundGate.ts:9,19,25、ModuleMiningSelection.ts:2,3、ModuleMiningWorkflow.ts:2,8,9、PlanSelectionGate.ts:16,22,26、sustain/evolution/DaemonFileChangeCollector.ts:32)
- lib/tools/adapters/DashboardOperations.ts:210,253(动态)
- test:~23 行/12 文件(DaemonJobRunner.test、DaemonJobRunnerPlanGate.test、DaemonSupervisor.test、JobsRoute.test、ProjectRuntimeControl.test、ProjectsRoute.test、SetupService.test、DaemonCapabilities.test、DaemonHealthRoute.test、JobProcessEventRecorder.test、Ao4NegativeSuites.test、DaemonFileChangeCollector.test)
- vi.mock 整串:**0**(实扫)

### 目标布局与执行步骤

```
lib/daemon/{jobs,observability,runtime}/   ← 13 文件按归属表 git mv,不改文件名
```
1. `git mv` 按归属表(3 组)
2. 组内 `./X.js` 不变;跨组改 `../<组>/X.js`(上表 18 行中跨组的 7 行:DaemonJobServices:5,6、DaemonJobRunner:38,39,40、Helpers:7 → `../observability/...`)
3. 组外上引深度 +1:DaemonJobRunner.ts:4-13(injection/project-scope/recipe-pipeline/project-facts 各 `../` → `../../`)、PcvObservabilityLinkage 的 `../project-scope/...` → `../../...`(:2 的 `#recipe-pipeline` 别名不变)、其余每文件过一遍
4. 消费点 65 行:路径中插组名段(`daemon/DaemonJobRunner.js` → `daemon/jobs/DaemonJobRunner.js` 等),纯机械
5. 门禁零联动实证:area 判定取 `lib/` 第一段(lint 脚本 areaOf),子目录不改区;无 config/scripts 硬编码 `lib/daemon/<file>` 路径串(实扫);manifest 零条目
6. 验证:0e + `npm run test:unit`(daemon 相关 12 测试文件)

### daemon→workflows 反向 1 边现状(方案诊断核实)

实锤:DaemonJobRunner.ts:13(runtime import releaseProjectContextWorkflowSessionByProjectRoot,唯一使用点 :435 `cleanupCancelledRescanJob`)+DaemonJobWorkflowTypes.ts:4(type-only,不计)。**M2 落地即消**(变 daemon→project-facts)——M3 本项只动目录,不处理该边 ✓

### 风险注记

- 规模最大(78 行 import 改动)但全机械;建议独立 commit 置后(B5),与 M5 的内容改动分离——**两批同 touch DaemonJobRunner.ts,先内容(M5)后搬迁(M3),避免 review 混淆与行号漂移**
- bin/cli.ts 13 处动态 import 是字符串 specifier,漏改运行期才爆——用 `grep -rn "daemon/" bin lib test` 清零复核

---

## M4 service 收敛 —— 【wiki 动/handler-runtime 解散/其余留;判定与证据】

### 现状全目录(15 文件 7482 行)

| 子目录 | 文件(行数) | 判定 |
|---|---|---|
| wiki/ | WikiGenerator(1094)/WikiRenderers(1916)/WikiTypes(137)/WikiUtils(1033)=4180 | **动→ generate/wiki/** |
| handler-runtime/ | envelope(58)/problem(60)/types(345)=463 | **解散(三去向)** |
| cleanup/ | CleanupService(888) | 留 |
| module/ | ModuleService(949) | 留 |
| skills/ | SkillFileService(736)/SkillHooks(428)/types(33)=1197 | 留 |
| vector/ | ContextualEnricher(196)/RecipeRegionFixtureGeneration(470)=666 | 留(后者死区登记,见 M6) |
| (根) | FileChangeDispatcher.ts(133) | 留 |

### 4-1 wiki → recipe-pipeline/generate/wiki(与 M1 同批 B2)

- 内聚自洽:WikiGenerator→Renderers(:45)+Utils(:55);Renderers→Types(:29)+Utils(:36);无外部 lib 内依赖
- 消费面(全量 3 处):lib/http/routes/wiki.ts:23-28(1 条 import 语句,WikiGenerator+3 类型)、lib/workflows/completion/CompletionSteps.ts:34,41,45,47(动态,generate 收尾主消费——方案判词实锤)、test/unit/WikiGenerator.test.ts:18
- http 路由改 `'#recipe-pipeline/generate/wiki/WikiGenerator.js'`(jobs.ts:22 已有 `#recipe-pipeline` 别名先例);http→recipe-pipeline 区向 contract 已允许(现 2 边→3)
- 注:wiki 双消费(completion 收尾+HTTP 按需再生成),"generate 收尾"是主语义;HTTP 是 host 面向下调用,不构成留 service 的理由
- Plugin 无 service/wiki twin(ls 实证)→ 单侧搬零 drift 影响

### 4-2 handler-runtime 解散(B3)

types.ts 头注自证(:6-8):"RIC-3: relocated out of the deleted lib/resident/ MCP-mirror layer. Some handler-arg interfaces here are now orphaned…can be trimmed in RIC-4"——**主仓已无 MCP handler 层**,方案句"它被 MCP handler 消费"过时;W3 的 McpConnection 改名已体现(types.ts:63)。实扫消费:

| 文件 | 消费(全量) | 去向 |
|---|---|---|
| types.ts(345) | GenerateRefine.ts:15(KnowledgeEntryJSON+McpContext)、SkillFileService.ts:20(McpContext)、test×3(DimensionRestoreState.test:20/GenerateDimensionAdmission.test:13/GenerateRuntimeInitializer.test:6,全是 IncrementalPlan——它本就是 :321 对 `@alembic/core/types` 的再导出) | **→ lib/types/handler-runtime.ts**(#types 别名既有;types 区=类型底座,零 runtime import 合规;搬后 5 处 import 改 `'#types/handler-runtime.js'`) |
| envelope.ts(58) | GenerateRefine.ts:14 唯一 | **→ lib/recipe-pipeline/generate/runtime/envelope.ts**(贴唯一消费者;recipe-pipeline->service 3 边随之减 1) |
| problem.ts(60) | **0 消费**(4 个导出符号 ToolFieldProblem/ToolUsageProblem/BuildToolUsageProblemOptions/buildToolUsageProblem 全仓零命中,删除三件套之扫描件已备) | **删除** |

- 类型消歧注记:main handler-runtime `McpContext`(container:McpServiceContainer+connection?)与 Core `@alembic/core/types` 的 `McpContext`(=WorkflowMcpContext,AlembicCore/src/types/workflows.ts:7-14)是**两个同名类型并存**(GenerateWorkflow.ts:7 用 Core 版,GenerateRefine/SkillFileService 用本地版)——本批只搬不并;并轨登记 W3 词族/Core 化后续
- 备选方案(次优):types.ts → lib/shared/schemas/(与 mcp-tools.ts 同居)——schemas 目录是 zod 定义域且 mcp-tools.ts 是 Plugin 同路径 twin,塞入非 zod 类型文件增加镜像噪音,不推荐

### 4-3 留 service 的证据

- cleanup/:lib 消费=ColdStartWorkflow.ts:47+KnowledgeRescanWorkflow.ts:54(`#service/cleanup/CleanupService.js`)+test×2——虽然唯一 lib 消费方是 recipe-pipeline,但 ①方案明示留;②**Plugin 同路径 twin 存在**(AlembicPlugin/lib/service/cleanup/CleanupService.ts),搬=双胞胎路径分叉;③DB 清理是数据层横切。留。
- module/:cli/AiScanService.ts:183,185(动态)+injection(ServiceMap:78,AppModule:17)——cli+injection 双面,真横切;Plugin twin 同路径。留。
- skills/:Bootstrap.ts:12+http/routes/skills.ts:14+injection(ServiceMap:79,AgentModule:23)——三面;SkillHooks.ts/types.ts 是 Plugin 同路径 twin。留。
- vector/:injection(ServiceMap:81,VectorModule:13)+test。留。
- FileChangeDispatcher.ts:bin/daemon-server:193+http/file-changes:25+injection/KnowledgeModule:54+sustain/evolution×2(:32-33,:29)+test×2——最横切;Plugin twin 同路径。留。

---

## M5 RecipePipelineFacade(O-3)+O-4 —— 【动,中等;行号已重定位】

### 锚点重定位(基线 b3f9888)

| 原 O-3 锚点 | 现位置 |
|---|---|
| 裸事件串(任务书 :59-65"×4") | 实为 **union 6 名**:DaemonJobRunner.ts:56-62(`BootstrapProcessEventName`);**订阅 6 处**:attachGenerateProcessEventBridge(:621 起)内 subscribe :681,:701,:725,:777,:798,:828;**on/off 2 处**::969,:972(linkBootstrapSessionCompletion) |
| 直 import 三执行器(任务书 :873-901) | **静态 3 处**::9(runDeepMiningRounds)、:10(runModuleMiningWorkflow)、:12(runGeneratePlanGate);**动态 2 处**::871,:897(runGenerateWorkflow);分派本体=executeApiAiWorkflow **:868-903**(bootstrap→planGate+full;deepMining/moduleMining→两执行器;默认→incremental) |

Core 常量已备:`RECIPE_PIPELINE_EVENTS`(pipelineEvents.ts:14-29,7 键含 aiUnavailable)出口 `@alembic/core/knowledge`;主体 GenerateEventEmitter.ts:12 已消费(切换先例);wire-contract.md:36 明示消费端切换是预定动作。

### Facade 接口草案

```ts
// lib/recipe-pipeline/RecipePipelineFacade.ts(新文件,~120 行)
// daemon 唯一入口:原 DaemonJobRunner.executeApiAiWorkflow(:868-903)本体整体迁入。
import type { RunDaemonJobOptions } from '../daemon/DaemonJobWorkflowTypes.js'; // type-only(recipe-pipeline→daemon 既有方向)
import {
  buildDaemonRescanWorkflowArgs, generationStageArg, stringArrayArg, unwrapEnvelope,
} from '../daemon/DaemonJobWorkflowHelpers.js'; // runtime,recipe-pipeline→daemon 8 边先例内(决策项①)
import { runGeneratePlanGate } from './plan/PlanSelectionGate.js';
import { runDeepMiningRounds } from './generate/DeepMiningRoundGate.js';
import { runModuleMiningWorkflow } from './generate/ModuleMiningWorkflow.js';

export type RecipePipelineStage = 'coldStart' | 'incremental' | 'deepMining' | 'moduleMining';

/** kind==='bootstrap' → planGate+GenerateWorkflow(mode:'full');generationStage 分派 deepMining/moduleMining;默认 incremental */
export async function executeRecipePipelineJob(options: RunDaemonJobOptions): Promise<unknown>;
```

daemon 侧改动面:
1. DaemonJobRunner.ts 删 :9,:10,:12 静态 import + :871,:897 动态 import + :868-903 本体 → 换 1 行 `import { executeRecipePipelineJob } from '../recipe-pipeline/RecipePipelineFacade.js'`(M3 后为 `../../recipe-pipeline/...`)
2. 事件常量切换:`import { RECIPE_PIPELINE_EVENTS } from '@alembic/core/knowledge'`;:56-62 union 改 `type BridgedEvent = Exclude<RecipePipelineEventName, typeof RECIPE_PIPELINE_EVENTS.aiUnavailable>`(daemon 不订阅 aiUnavailable)或保留局部 union(值=常量,编译期校验);8 处字符串换 `RECIPE_PIPELINE_EVENTS.started/…`
3. 同族顺手项(同批):lib/project-facts/ProjectContextWorkflowFacts.ts:621,643,644 三处 `'bootstrap:all-completed'` 裸订阅切常量(主体独有文件,非 twin,可安全切)

改动面统计:DaemonJobRunner.ts(约 -60/+15 行)+新 facade 1 文件+facts 3 行;区向零新增(recipe-pipeline→daemon 既有;daemon→recipe-pipeline 5 边收敛为 1 个 specifier,contract 不变)。

### 双胞胎纪律(不动项)

GenerateTaskManager.ts **主体 :295,:354,:460,:508,:562,:638 六处裸 emit;Plugin twin 同为 6 处**(实扫 `AlembicPlugin/lib/recipe-generation/generate/GenerateTaskManager.ts`)——emit 侧切常量必须两侧成对改,**登记给 Plugin 镜像批,本批不碰**(单侧改内容违反 twin 纪律)。

### O-4 判定:不动(W2 已决的保留项)

PcvObservabilityLinkage.ts:2 `import type { GenerateProcessEventDraft } from '#recipe-pipeline/generate/runtime/generate-event-types.js'` 是 **type-only(exempt)**;且 generate-event-types.ts:19-21 注释明示 W2 决策:"基础 payload 骨架收编 Core 单源;本文件保留主体收窄…与 **daemon 专属 process-event 类型**"。类型上移 Core daemon 契约(GenerateProcessEventDraft 本就是 `Omit<CreateJobProcessEventInput,…>`,:62,母型在 `@alembic/core/daemon`)登记为 backlog 候选,不入本批。DaemonJobRunner.ts:11 同型引用同判。

### 风险注记

- **与 M3 同文件**:先 M5(内容)后 M3(搬迁),两独立 commit
- 测试面:DaemonJobRunner.test.ts 10 处调用 attachGenerateProcessEventBridge——事件名字面值不变,常量替换无感;DaemonJobRunnerPlanGate.test.ts(:9 vi.mock `@alembic/core/service/planFacts` 整串+:14 import runGenerateWorkflow+:25 mock facts)——facade 化后 runDaemonJob→facade→planGate 链不变,vi.mock 按 specifier 无感;**但 GenerateWorkflow 动态 import 移进 facade 后,若该测试依赖对 '../../lib/recipe-pipeline/generate/GenerateWorkflow.js' 的替身,需确认其 mock 机制仍可达(执行时逐测试核)**
- unwrapEnvelope 等 4 助手留 daemon(决策项①):备选=随 facade 迁 recipe-pipeline,但 helpers 同时服务 daemon 其余路径,迁移反而扩 churn——推荐留

---

## M6 杂项清算

### 6-1 governance:非空,无动作(方案判词过时)

- 实况:lib/governance/gateway/{Gateway.ts, GatewayActionRegistry.ts},lib 消费 4 处(Bootstrap.ts:7、http/HttpServer.ts:13、injection/ServiceMap.ts:71、injection/modules/InfraModule.ts:26)+test/unit/Gateway.test.ts:5——活体,受 CLAUDE.md 保留边界保护
- 历史:constitution/permission 三文件已于 99a69fc(2026-06-13"Remove residual role semantics")删除;当前 lib/governance 下无空目录(find -type d -empty 实证)。W1 的"governance 空目录"项**已不存在,无事可做**
- `#governance` 别名保留(有活体消费面)

### 6-2 tools/v2 收平:动(小批 B0)

- 现状:lib/tools/ = adapters/(6 文件)+ v2/(仅 ToolContextFactory.ts 1 文件)——"W1 后已单 kernel"部分成立:V2 通用运行时已归 `@alembic/agent/tools/v2`(config/agent-extraction-boundary.json:121-124 wave 记录),主仓 v2/ 只剩 host DI 桥一文件,目录名失义
- 步骤:`git mv lib/tools/v2/ToolContextFactory.ts lib/tools/ToolContextFactory.ts` + 删空 v2/;import 4 处:injection/modules/AgentModule.ts:22、test/unit/V2ToolSystem.test.ts:548,575(`#tools/v2/…` → `#tools/ToolContextFactory.js`)、test/unit/ToolContextFactory.test.ts:4(相对);**config/agent-extraction-boundary.json 强制字段同批**::331,:336 expectedSpecifiers、:341 相对串、:325 hostOwnedToolV2Paths(文档性);验证 `npm run lint:agent-extraction-boundary`
- ToolContextFactory 内部 import(@alembic/agent 系,:9,:17)不动;`#tools` 别名不动
- 顺手:`rmdir lib/tools/adapters/terminal-adapter`(空目录,git 不追踪的工作树残留)

### 6-3 死区/错位登记(不执行;删除属用户门)

| 项 | 证据 | 备注 |
|---|---|---|
| lib/tools/adapters/WorkflowAdapter.ts | lib/bin/test 消费 0(仅 config 提及) | CLAUDE.md 停止卡:tool adapter 属受保护宿主能力,删除需用户决策+extraction-boundary config 同步 |
| lib/tools/adapters/MacSystemCapabilities.ts | 同上 0 消费 | 同上 |
| lib/tools/adapters/DashboardOperationAdapter.ts | 外部消费 0(仅自身 :6 引 DashboardOperations) | 同上 |
| lib/tools/adapters/SkillAdapter.ts | 仅 test/unit/SkillAdapter.test.ts 消费 | 同上 |
| lib/service/vector/RecipeRegionFixtureGeneration.ts | 仅 test/unit/RecipeRegionFixtureGeneration.test.ts 消费 | fixture 生成器;确认是否有 scripts 场景后再议 |
| handler-runtime/problem.ts | 0 消费 | **本批 B3 内执行删除**(证据链在 4-2) |
| CLAUDE.md 文件地图 | lib/ 树含已删的 resident、缺 recipe-pipeline/project-scope/generated;别名清单缺 `#recipe-pipeline` | 文档批(B6)顺手,或留仓库自维护 |

---

## W3-D5 联动(登记级):KnowledgeEntryJSON 并入 Core KnowledgeEntryWire 可行性

三方对比(main lib/service/handler-runtime/types.ts:127-190;Plugin lib/runtime/mcp/handlers/types.ts 同名接口;Core src/types/KnowledgeWire.ts:95-164):

| 维度 | main/Plugin KnowledgeEntryJSON(**两侧逐字段同构**,实扫确认) | Core KnowledgeEntryWire |
|---|---|---|
| 必填性 | 仅 id/title 必填,其余全可选(读侧宽松投影) | **全字段必填**(全量实体投影) |
| 时间戳 | createdAt/updatedAt **string?** | createdAt/updatedAt **number**(+publishedAt) |
| 字段覆盖 | 无 lifecycleHistory/autoApprovable/stagingDeadline/dimensionId/difficulty/topicHint/usageGuide/headerPaths/moduleName/includeHeaders/agentNotes/aiInsight/reviewed*/rejectionReason/source*/published*(约 20+ 字段缺) | 全有 |
| 特有成员 | `toJSON?: () => KnowledgeEntryJSON`(实体/投影两用痕迹) | 无 toJSON;`[key: string]: unknown` 两侧都有 |
| 消费点 | main:GenerateRefine.ts:15;Plugin:runtime/mcp/handlers/search.ts+types.ts | Core 内外 wire 面 |

**判定:本批不做。** ①语义不同物:Wire=必填实体投影,JSON=可选链读投影,直并会让全部消费点类型语义翻转;②string vs number 时间戳是运行时差异,非纯类型动作;③正确解法=Core 新增读侧投影单源(如 `KnowledgeEntryReadWire`/`Partial` 变体)+两宿主删本地副本——属 Core exports 面新增,归 W2 式 Core 化补批/W8,与主体结构批解耦。登记条目携带上表即可动工。
(注:main 侧该类型随 B3 迁至 lib/types/handler-runtime.ts,迁移不改字段,不影响此登记。)

---

## 执行顺序推荐(先小后大,每批独立 commit 可回退)

| 批 | 内容 | 规模 | 前置 | 回退性 |
|---|---|---|---|---|
| B0 | M6-2 tools/v2 收平+空目录 rmdir | 1 mv+4 import+config 3 处 | 无 | 单 commit |
| B1 | M2 project-facts 合并(4 mv+21 import/mock+layer-contract 三件套+README:13) | 中 | 无 | 单 commit |
| B2 | M1+M4-1 generate 收尾合并(completion 3+skill-delivery 1+wiki 4 共 8 mv+~14 import)+**workflows 目录/别名/区域清算**(package.json 2 条+contract 3 处+lint 脚本 1 行) | 中大 | B1 | 单 commit |
| B3 | M4-2 handler-runtime 解散(types→lib/types+envelope→generate/runtime+problem 删;7 import) | 小 | 无(排 B2 后避免与 wiki 批同 touch GenerateRefine 邻域) | 单 commit |
| B4 | M5 facade+事件常量(新 facade+DaemonJobRunner 内容改+facts 3 行常量) | 中 | B1(facts 已就位) | 单 commit |
| B5 | M3 daemon 三群(13 mv+65 消费行+18 内部行) | 大(机械) | B4(同文件先内容后搬) | 单 commit |
| B6 | 文档收尾:recipe-pipeline README 事实层行(若 B1 未改)+layer-contract cycleFindings W5 注记回写+CLAUDE.md 地图(可选) | 小 | B1-B5 | 单 commit |

每批验证=0e;B0 加 lint:agent-extraction-boundary;B2/B5 后跑全量 `npm run check`。
用户决策项汇总:①M5 助手函数(unwrapEnvelope 等)留 daemon 还是随 facade 迁(推荐留);②M6-3 四个零消费 adapter 是否另开删除批(受停止卡保护,需用户门);③W3-D5 Core 读投影单源化是否排 W8/Core 化补批;④B6 CLAUDE.md 地图是否本波修。

---

## 统计

| 子项 | 判定 | 涉源文件(mv/改) | 行数(移动体) | exports/别名变更 | 门禁联动 |
|---|---|---|---|---|---|
| M1 workflows 消亡 | 动 | 4 mv+2 lib import+4 test 文件 | 992(completion 429+skill-delivery 563) | B2 删 #workflows ×2 | contract workflows 区删;AgentModuleBoundaries 零改(机制实证) |
| M2 project-facts | 动 | 4 mv+15 lib import+6 test 行(含 vi.mock ×1) | 2604 | 无(不新增别名) | contract 三件套(areas+allowed+README:13);daemon→workflows 1 边消 |
| M3 daemon 三群 | 动 | 13 mv+65 消费行+18 内部行 | 5923 | 无 | 零(area 不变;无硬路径串) |
| M4 wiki | 动(随 B2) | 4 mv+2 消费文件+1 test | 4180 | 无 | http→recipe-pipeline 2→3 边(已允许) |
| M4 handler-runtime | 解散 | 2 mv+1 删+7 import | 463(删 60) | 无 | recipe-pipeline→service 3→2 |
| M4 cleanup/module/skills/vector/Dispatcher | **不动** | 0 | 0 | 无 | twin 同路径保全 |
| M5 facade(O-3) | 动 | 新 1 文件+DaemonJobRunner 改+facts 3 行 | ~120 新+~60 迁 | 无 | wire-contract.md:36 授权的消费端常量切换;GenerateTaskManager twin 不碰 |
| M5 O-4 | **不动** | 0 | 0 | 无 | type-only exempt+W2 已决注释为证 |
| M6 governance | **无动作** | 0 | 0 | 无 | 判词过时(gateway 活体 4 消费) |
| M6 tools/v2 | 动 | 1 mv+4 import | 与 v2 目录收平 | 无(#tools 不动) | agent-extraction-boundary.json 3 处强制字段 |
| M6 死区登记 | 登记不执行 | 0 | — | — | 删除属用户门(停止卡) |
| W3-D5 | 登记不做 | 0 | — | — | 归 Core 化补批 |

消费面总账(find -exec grep 实测):workflows 族 lib 16 行+test 10 行(其中 vi.mock 整串 1);daemon 族 65 行;service/wiki 3 处;handler-runtime 7 处(problem=0);lib/project-context 1 处;tools/v2 4 处;`#workflows` 别名消费 0;shared-asset-manifest 涉动条目 0;基线 lint-layer-contract 绿(162/44,node v22.22.1)。
