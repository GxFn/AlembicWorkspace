# W5 Plugin 结构批执行底稿

- 生成:2026-07-03,只读扫描产物(未改任何源码);沿用 W4 底稿方法论(`Design/docs/current/alembic-w4-core-structure-map-2026-07-02.md`)
- 扫描基线:AlembicPlugin@`6e4c944`(W0-W4 已落地:W1 已删 15 个 RG9/P12/P13 shim+死别名;W3 lib/workflows/capabilities→surfaces 已改)
- 范围:`AlembicPlugin/{lib,bin,test,scripts,config,packages,plugins,docs,package.json,tsconfig.json,vitest*.ts}`;镜像参照 `Alembic/lib/recipe-pipeline`;W3-D5 对照 `AlembicCore/src/types/KnowledgeWire.ts`
- 消费面全部用 `find -exec grep` 实扫(workspace ripgrep 漏文件已知);行号为本基线实测
- 基线门禁状态(2026-07-03 实跑):`node scripts/lint-layer-boundary.mjs` **PASS**;`node scripts/lint-scope-resolution.mjs` **PASS**;test 基线按任务给定 16 failed 预存(本底稿未复跑全量)

---

## 0 硬约束与门禁锚点总表(全批共用)

### 0a MCP 工具面 wire 冻结(绝不动)

- 工具名 16 个(lib/runtime/mcp/tools.ts 实扫):alembic_{bootstrap,code_guard,consolidate,dimension_complete,evolve,graph,knowledge_lifecycle,plan,prime,project_skill,recipe_map,rescan,search,status,submit_knowledge,work}
- 入参 schema:lib/shared/schemas/mcp-tools.ts(TOOL_SCHEMAS)——**lib/shared 不在 W5 任何搬迁范围内,零联动**
- 响应载荷字段(bootstrapState/toolCapabilities/unifiedEvolution/produceSession 等):载荷构建器随 mcp/ 目录移动,但**字段名字面全程不动**
- ⚠️ 特别锚点:alembic_status 载荷含 **`daemon` 字段键**(lib/runtime/status/StatusService.ts:67 `daemon: Pick<DaemonSummary,...>`)与磁盘状态文件名 `daemon.json/daemon.pid/daemon.lock/daemon.log`(StatusService.ts:174-177,241)——P4 的 DaemonStatus 改名**只改 TS 类型名,载荷键与磁盘文件名冻结**
- 宿主 id 串 `'codex'`/`'claude-code'`(ALEMBIC_PLUGIN_HOST 等 env、host-adapter 判定)是运行时 wire,**#codex 别名改名不涉及它们**

### 0b package-imports 别名:三份映射必须同批同步

| 位置 | 内容 | W5 触点 |
|---|---|---|
| package.json:11-40(imports) | 7 别名,双条件(alembic-dev→./lib/*,default→./dist/lib/*) | `#recipe-generation/*`:32-35、`#codex/*`:36-39 改 |
| packages/alembic-runtime/package.json:8-45(imports) | **staging 直取此份**(prepare-codex-runtime-package.mjs:75 `imports: sourceManifest.imports \|\| rootPackage.imports`)——漏改=发布包 alias 解析崩 | 同上两条 + **:24-27 残留死别名 `#governance/*`→lib/governance(目录不存在,P4 删)** |
| vitest.config.ts sourceImportAliases 映射表 | `['codex','runtime']`、`['recipe-generation','recipe-generation']` 两活行 + 9 死行(agent/governance/domain/external/http/platform/repo/sandbox/tools,对应目录全灭) | 两活行改 key+目录值;死行 P4 顺手清 |

- tsconfig.json paths 只有 drizzle/zod 重定向,无 lib 路径,零联动
- dist 布局 = lib 布局镜像(rootDir '.', outDir dist)→ **目录改名自动改 dist 布局** → 触发 0c 全链

### 0c release staging / dist 硬路径锚点(每个目录批后必跑 stage 验证)

| 文件:行 | 硬路径 | 断裂条件 |
|---|---|---|
| scripts/prepare-codex-runtime-package.mjs:16 | `dist/lib/runtime/mcp/HostMcpServer.js`(requiredBuildArtifacts) | P2c runtime 改名 |
| scripts/verify-codex-runtime-package-boundary.mjs:86 | `package/dist/lib/runtime/mcp/HostMcpServer.js`(tar 清单断言) | 同上 |
| scripts/verify-codex-runtime-package-boundary.mjs:143 | join(installedRoot,'dist','lib','runtime','mcp','HostMcpServer.js')(entrypoint probe) | 同上 |
| scripts/smoke-codex-plugin.mjs:201,225 | 同上两形态 | 同上 |
| scripts/verify-codex-plugin-tools-local.mjs:53,54,72 | dist/lib/runtime/mcp/{HostMcpServer,output-contract,handlers/tool-router}.js | 同上 |
| scripts/verify-codex-plugin-tools-local.mjs:872 | 'lib/runtime/mcp/HostMcpServer.ts'(graphFile 期望值数据) | 同上(登记级) |
| scripts/probe-mcp-{core-tools,codex-local-tools,clean-output-final-cleanup,error-taxonomy}-*.mjs、probe-plugin-consumer-fixture-replay.mjs、probe-codex-onboarding-contract.mjs:20 | dist/lib/runtime/mcp/* 动态 import 共 11 行/6 文件 | 同上 |
| scripts/rebuild-local-knowledge-indexes.mjs:45 | `dist/lib/recipe-generation/host-agent-workflows/knowledge-index-rebuild.js` | P1b(子路径)与 P1c(目录名)各一次 |
| scripts/probe-agent-public-tools-evaluation.mjs:344,407,420,445 | 'lib/runtime/mcp/source-graph/status.ts'(**fixture 假路径数据**,该目录不存在) | 不断裂,登记级一致性 |
| bin/host-mcp.ts:10,34 | 动态 import '../lib/runtime/index.js'、'../lib/runtime/mcp/HostMcpServer.js' | P2c |
| ⚠️ sed 陷阱 | scripts/lib/runtime-pack-freshness.mjs 的引用串 './lib/runtime-pack-freshness.mjs' 含 'lib/runtime' 子串 | 全局替换必须带尾斜杠 `lib/runtime/`,否则毁此串 |

- 每目录批验证链:`npm run build`(build:core+clean-dist+tsc)→ `npm run prepare:codex-runtime-package` → `npm run verify:codex-runtime-package`(内部再跑 prepare+npm pack+离线 install+entrypoint probe)
- postbuild/.build-manifest sourceHash 对 lib 全树重算,改名自适应,无锚点

### 0d 插件缓存与宿主外壳(实扫结论:无 lib/ 硬路径)

- plugins/alembic-claude-code、plugins/alembic-codex、vendor/AlembicCore 均为 **git submodule**(.gitmodules);cc/codex 外壳 manifest(.claude-plugin/plugin.json、.codex-plugin/plugin.json)只引 `${CLAUDE_PLUGIN_ROOT}/bin/alembic-start.mjs`,**不引本仓 lib/ 内部路径**
- cc 外壳启动脚本按 pinned `@gxfn/alembic-runtime@0.2.0` 包名+版本装 runtime(plugins/alembic-claude-code/bin/alembic-start.mjs:16-18),入口经包 bin 映射 `dist/bin/host-mcp.js`——**老插件缓存钉旧版本 tarball,不加载新 dist,dist 布局变化只影响下一次发版**
- cc 外壳内 `.runtime/runtime-install/node_modules/@gxfn/alembic-runtime` 是预装暂存件(submodule 内),W5 后**下一次发版**须经 0c 链重新 stage——登记进发版 playbook,不是本批动作
- check:shared-asset-drift:manifest(config/shared-asset-manifest.json)6 个 lib 资产全在 lib/{infrastructure/cache,types,shared},**不在 recipe-generation/runtime 两树内,W5 目录移动零联动**;check:cross-shell-drift 只比对两外壳 bin/skills/LICENSE,零联动

### 0e lint/测试路径锚点

| 文件:行 | 内容 | W5 触点 |
|---|---|---|
| scripts/lint-layer-boundary.mjs:26 | L1_DIRS=['lib/service','lib/workflows'] | P3 建议扩 'lib/recipe-pipeline'(见 P3-5);workflows 若并入则删该项 |
| scripts/lint-layer-boundary.mjs:28 | PATTERN="from '([^']*runtime/mcp/\|#codex/mcp/)" | P2c 改 `host-runtime/mcp/`+`#host-runtime/mcp/`(注:`[^']*runtime/mcp/` 本可匹配 host-runtime,但显式改写防歧义);:6-19,49-61 注释/文案同批 |
| scripts/lint-scope-resolution.mjs:34 | GATED_DIRECTORIES=['lib/recipe-generation/host-agent-workflows/'] | P1b 改 'lib/recipe-generation/generate/',P1c 再改 'lib/recipe-pipeline/generate/' |
| scripts/lint-scope-resolution.mjs:36 | GATED_FILES=['lib/runtime/KnowledgeState.ts'] | P3(KnowledgeState 下沉 service)或 P2c 改名,按落点回写 |
| config/doctrine-lint-exemptions.json:6,12,18,24,30,36,42,48,54,60 | 10 条豁免 file 全是 lib/runtime/mcp/* 路径 | P2c 批量回写 |
| config/error-registry-adoption.json:5 | surface 描述串引 lib/runtime/mcp/error-taxonomy.ts | P2c 文案回写(描述性) |
| test/unit/RecipeGenerationSkeleton.test.ts(skeleton 白名单,W1 同步过的那个) | :41 断言 `RECIPE_GENERATION_SUBSYSTEM_ROOT===‘lib/recipe-generation’`;:19-33 共 13 条实现硬路径;:132-135 not.toContain('#codex/mcp/host-agent-workflows/','#service/bootstrap/','#service/evolution/','#service/vector/') | :41+contracts.ts:1 同批;13 条路径 P1b/P1c 各回写一次;:132-135 见 P1 风险(**:135 是 vector 归属的反证锚**) |
| lib/recipe-generation/contracts.ts:1 | `RECIPE_GENERATION_SUBSYSTEM_ROOT = 'lib/recipe-generation'` | P1c 改值 'lib/recipe-pipeline' |
| test 相对路径消费 | lib/runtime:**53 文件/113 行**;lib/recipe-generation:**23 文件/47 行**(文件清单见 P1/P2 节) | 对应批回写 |
| docs/legacy-register.md:16,22,36,51,70 等 | 多处 lib/runtime 路径(含已亡 CodexMcpServer.ts 旧文) | 登记级,P4 清尾顺手 |
| 跨仓注释 | AlembicCore src/domain/knowledge/recipe-authoring-spec/gateRules.ts:6-7 引 'AlembicPlugin/lib/runtime/mcp/handlers/recipe-content-quality-gate.ts' 与 'lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts';Alembic lib/recipe-pipeline/README.md 尾注引 'AlembicPlugin/lib/recipe-generation/' | 登记级;主体 README 一行建议随 P1c 跨仓同批(它在 drift manifest 之外) |

### 0f 每批统一验证命令

`npm run build:check` + `npx vitest run`(对照 16 failed 预存基线,新增红=停)+ `node scripts/lint-layer-boundary.mjs` + `node scripts/lint-scope-resolution.mjs` + `npm run lint:core-import-boundary` + `npm run lint:repo-boundary` + `npm run check:shared-asset-drift` + 0c stage 链(prepare+verify:codex-runtime-package)。Node≥22(engines;主体 memory:Node18=假红)。涉 lib 目录名变化的批加 `npm run lint:naming` 与 `npm run lint:retired-symbols`。

---

## P1 recipe-generation→recipe-pipeline 四环镜像 —— 【动,中大规模】

### ① 现状清单(36 文件 13,965 行,实扫)

| 现路径 | 文件(行数) |
|---|---|
| 根(3) | contracts.ts(119)、canonical-module-axis.ts(96)、index.ts(1,仅 export contracts) |
| 平铺 plan 族(4) | plan-tool.ts(375)、plan-confirm.ts(488)、plan-generation-gate.ts(557)、project-context-anchoring.ts(351) |
| host-agent-workflows/(14) | cold-start.ts(1523)、knowledge-rescan.ts(1944)、dimension-completion.ts(1789)、generate-workflow.ts(50)、completeness-critic.ts(594)、briefing-budget.ts(133)、project-context-analysis.ts(941)、project-data-root.ts(19)、knowledge-index-rebuild.ts(252)、recipe-evidence-gate.ts(549)、recipe-region-vector.ts(658)、coverage-ledger-target-axis.ts(50)、coverage-module-axis.ts(63)、coverage-ledger-write.ts(15,Core 转发件) |
| generate/(3) | GenerateTaskManager.ts(546)、GenerateEventEmitter.ts(188)、generate-event-types.ts(17) |
| evolution/(9=2+7) | HostAgentFileChangeHandler.ts(833)、PluginOpportunisticEvolution.ts(364)、git-diff-checkpoint/{GitDiffScanner(442)、DurableGitDiffCheckpointRouting(260)、CommitDrivenMaintenance(109)、GitDiffCheckpointStatus(77)、ProjectDiffIgnore(62)、index(35)、GitDiffCheckpointService(20)} |
| vector/(3) | recipe-embedding-sim-provider.ts(276)、LocalEmbedding.ts(137)、ContextualEnricher.ts(32) |

### ② 消费面(find -exec grep 实测)

- `#recipe-generation/*` import:lib+bin **45 行/20 文件**;test **20 行/13 文件**。仓外零消费(仓 private,无包发布面;runtime 包整包带 dist 自解析)
- lib 外部消费者(20 文件中除 rg 自身 7 文件):runtime 侧 8——mcp/handlers/tool-router.ts:24,25,33,34,35、handlers/host-agent/{dimension-completion.ts:12、rescan.ts:11、generate.ts:12}、mcp/host/opportunistic-evolution-presenter.ts:2,3,9、handlers/retrieval-checkpoint-diagnostics.ts:5、status/OnboardingContract.ts:13、diagnostics/Diagnostics.ts:6;injection 3——ServiceMap.ts:58,59(+:65 相对路径)、modules/InfraModule.ts:27、modules/VectorModule.ts:14,18(+KnowledgeModule.ts:60 相对路径);cli/SetupService.ts:69;service/knowledge/RecipeFreshnessRuntime.ts:12;runtime/status/StatusService.ts:8(相对路径进 vector)
- rg 自身 import 风格双轨:**24 行别名自引**(#recipe-generation/... 指自己包内)+ **25 行相对引**(./xx、族内)——别名 key 改名牵 24 行,环内搬迁牵两类的子路径/相对深度
- test 别名消费 13 文件:CanonicalModuleAxis、CanonicalModuleSeedRefs、CoverageLedgerTargetAxis、CoverageLedgerWiring、DataLossWorkflowGates、HostAgentDimensionCompletionWorkflow、HostAgentProjectDataRoot、HostAgentRecipeEvidenceGate、ModuleBindingFlatten、RecipeGenerationSkeleton、RescanCoverageModuleAxis、recipe-gate-drift-tripwire、recipe-gate-golden-corpus
- test 相对路径消费 23 文件:BriefingBudget、CommitDrivenMaintenanceDedup、GitDiffCheckpoint、HostAgentFileChangeHandler、HostAgentGenerateCompat、HostAgentGenerateWorkflow、HostAgentProjectContextDirectSwitch、HostAgentProjectContextScopeParity、HostAgentSessionLease、KnowledgeIndexRebuildRepair、LocalEmbedding、MissionBriefingProfile、NativeProjectScopeRuntimeWiring、PlanConfirmStatelessSelection、PlanDraftTwoBlockProjector、PlanDrivenGenerationGate、PlanSelectionGateStateless、PluginOpportunisticEvolution、RecipeAuthoringFrontLoad、RecipeEmbeddingSimProvider、RecipeGenerationSkeleton、RecipeRegionVectorAvailability、ServiceContainerRuntimeConfig

### ③ 目标布局(镜像主体 lib/recipe-pipeline/{plan,generate/{execution,runtime},curate,sustain};README 惯例照主体:根 README 四环表+每环一 README)

```
lib/recipe-pipeline/
├── README.md            ← 新增,照主体根 README 四环表体例(标注"宿主 Agent 皮"分叉)
├── contracts.ts / canonical-module-axis.ts / index.ts   ← 根留(子系统契约;axis 被 plan-confirm+tool-router 双环消费)
├── plan/                ← plan-tool.ts + plan-confirm.ts + plan-generation-gate.ts + project-context-anchoring.ts(+README)
├── generate/            ← host-agent-workflows 13 文件平铺进来(cold-start/knowledge-rescan/generate-workflow/dimension-completion/
│   │                       completeness-critic/briefing-budget/project-context-analysis/project-data-root/knowledge-index-rebuild/
│   │                       coverage-ledger-target-axis/coverage-module-axis/coverage-ledger-write[/recipe-region-vector 若决策留])
│   └── runtime/         ← GenerateTaskManager + GenerateEventEmitter + generate-event-types(**与主体 generate/runtime/ 同名同物镜像**)
├── curate/              ← README 指针(照主体 curate README"薄环+指针"体例)+ 【决策项①】recipe-evidence-gate.ts 入 curate/
├── sustain/             ← evolution/ 整目录改名(git mv evolution sustain):HostAgentFileChangeHandler + PluginOpportunisticEvolution
│   │                       + git-diff-checkpoint/(承载 W3-D3:evolution 9 文件归位 sustain)
│   └── (+【决策项②】RecipeFreshnessRuntime.ts 自 lib/service/knowledge 迁入,P3-C 环解)
└── vector/              ← 3 文件原位平移(**推荐留在 pipeline 内**,见下判定)
```

**host-agent-workflows 归属判定:generate 执行面,平铺并入 generate/。** 依据:cold-start/knowledge-rescan/generate-workflow 即 coldStart/rescan 两 stage 的执行本体(contracts.ts:90-107 stages 契约;generate-workflow.ts:9-10 只路由两者);dimension-completion/completeness-critic/briefing-budget/project-context-analysis 是维度执行与简报支撑;与主体 generate/ 顶层(ColdStartWorkflow/GenerateWorkflow/...)同型。平铺(而非保留 host-agent-workflows 子目录)理由:目录名"host-agent"双宿主后名不副实,且 24 行别名自引反正要重写,不添增量;备选保留子目录仅省 13 条 test 相对路径的一段。主体 generate/execution/ 在 Plugin 无对应物(宿主侧执行在宿主 Agent),不造空目录。

**vector/ 归属判定:子系统内横切,留 lib/recipe-pipeline/vector/,不迁 lib/service。** 反证锚:skeleton test :135 明断言实现文件 not.toContain('#service/vector/')——RG9 曾把 vector 从 service 收进 recipe-generation 并立此门,迁回 service/vector = 复活已退役路径形,须推翻 RG9 残留门(需用户决策,不推荐)。vector 消费面(cli/SetupService:69、injection×3、StatusService:8、search.ts 经 recipe-region-vector)全是 wiring/L2→L1 合法方向,留在 pipeline 无环。

**recipe-evidence-gate 归属【决策项①,推荐 curate/】**:文件头注(:1-14)自证它是 CG-3 提交门禁的宿主接线(委托 Core RecipeAuthoringSpec.validateAgainst stage2),主体 curate README 指针明文点名"宿主接线在 AlembicPlugin tool-router evidence gate";消费=tool-router.ts:33(submit 链)+dimension-completion.ts:39(generate 内)。入 curate/ 则 Plugin curate 不再是纯 README,镜像更实;保守备选=留 generate/(与方案字面"curate/(README 指针)"一致)。

**别名【推荐:key+target 双改】**:`#recipe-generation/*`→`#recipe-pipeline/*`(映射目标同步改 ./lib/recipe-pipeline/*)。备选"只改 target 保留旧 key"零 import 重写,但名实分离正是 #codex 的病,不再造一个;45+20 行重写纯机械 sed。

### ④ 执行步骤(环内先动、目录+key 后动,均可独立验证)

1. **P1b 环化(目录名与别名不动)**:`mkdir plan curate` + `git mv` 四文件入 plan/;`git mv evolution sustain`;`git mv host-agent-workflows generate` + 三 generate/* 文件 `git mv generate/{GenerateTaskManager,GenerateEventEmitter,generate-event-types}.ts` 入 generate/runtime/(注意先把旧 generate/ 腾挪:临时序=先 `git mv generate generate-runtime-tmp && git mv host-agent-workflows generate && git mv generate-runtime-tmp generate/runtime`);(决策①通过则)`git mv generate/recipe-evidence-gate.ts curate/`
2. 子路径回写(同批):24 行别名自引与 45-24=21 行外部别名 import 的 `/host-agent-workflows/`→`/generate/`、`/evolution/`→`/sustain/`、`/generate/GenerateTaskManager`→`/generate/runtime/GenerateTaskManager` 等段替换;25 行相对引仅 plan/ 四文件对 ./contracts.js 深度+1(→ ../contracts.js)与跨环相对引逐条;test 33 文件同段替换;lint-scope-resolution.mjs:34、rebuild-local-knowledge-indexes.mjs:45、skeleton :19-33 同批
3. README 三件(根/plan/curate,sustain/generate 可后补)照主体体例落
4. 0f 验证全套+0c stage 链
5. **P1c 目录+key 终改名**(可与 P2c 分批):`git mv lib/recipe-generation lib/recipe-pipeline`;package.json:32-35 与 packages/alembic-runtime/package.json 对应条 key+target 双改;vitest 映射行改 `['recipe-pipeline','recipe-pipeline']`;全仓 sed `#recipe-generation/`→`#recipe-pipeline/`(65 行)与 `lib/recipe-generation`→`lib/recipe-pipeline`(skeleton 13 条、contracts.ts:1、lint-scope-resolution.mjs:34、rebuild 脚本:45、23 个 test 相对路径文件);0f+0c 再全套
6. 跨仓登记:主体 lib/recipe-pipeline/README.md 尾注路径串同批改(主体窗口一行 commit);Core gateRules.ts:6-7 注释登记不强制

### ⑤ 风险

- **skeleton 契约三方一致**:contracts.ts:1 值、test :41 字面、13 条路径必须同 commit,漏一方 vitest 立红(可见风险,非静默)
- **RECIPE_GENERATION_* 符号词族**(contracts.ts 全文+skeleton import 5 符号)**本批不改名**——那是 W3 词族批范畴;若同批改需过 lint:retired-symbols 词表,徒增面积【决策项③:接受"目录改、符号缓"的不对称】
- 双写点:GenerateTaskManager 同名文件主体/Plugin 双胞胎(跨仓 drift 门候选,W2 已判 per-host),搬迁不动内容,勿顺手"统一"
- generate/ 腾挪三步 mv 若走错序会出现 generate/generate 嵌套——按步骤 1 临时名序执行
- 主体 README 尾注是 drift-manifest 外的跨仓文档,漏改只是文档腐,不断门禁

---

## P2 host-runtime 拆解 —— 【动,最大单批】

### ① 现状分组诊断(79 文件 25,613 行=78 .ts+README,实扫;方案写 87 为 W1 删 shim 前口径)

| 现分组 | 文件数(行数) | 内容 |
|---|---|---|
| mcp/ | 52(15,110) | 协议壳(HostMcpServer 1154/McpServer 484/tools 373/envelope/error-taxonomy/errorHandler/output-contract 323/plugin-host-contracts 320/PluginToolSurfaceCatalog 379/RateLimiter/zodToMcpSchema)+handlers/ 20(**search.ts 2520/agent-public-tools.ts 2435 god files**、tool-router 1026、guard 838、host-agent/ 4、TargetClassifier 1 行与 evolution-prescreen 7 行为 Core 转发件)+host/ 10+public-tools/ 5+knowledge-context-tools/ 4+core-tools/ 1+local-tools/ 1 |
| 顶层平铺 | 13(3,616) | EnhancementRoute 562、HostProjectAlignment 498、ProjectRootResolver 426、ToolPolicy 406、KnowledgeState 611、ProjectSkillDelivery 528、ModuleBoundary 271、PluginRegistry 145、ServiceRequestBoundary 53、daemon-status 25、JobContext 19、SourceBoundary 16、index.ts 20 |
| runtime/runtime **双嵌套** | 3(797) | ProjectRuntimeContext 660、RuntimeContext 128、EmbeddedRuntimeContract 9 |
| status/ | 2(2,224) | StatusService 1011、OnboardingContract 1213 |
| host-adapter/ | 4(288) | HostAdapter/CodexHostAdapter/ClaudeCodeHostAdapter/resolveHostAdapter |
| host-agent/ | 1(361) | HostAgentAnalysisSurface(P3 判迁 pipeline) |
| ide-agent/ | 1(17) | IDEAgentAnalysisSurface=纯改名 re-export shim(头注:G6 清理前保老插件缓存)——老缓存钉旧版本包不加载新 dist,存在理由已弱化【决策项⑦:候删;W5 内默认随迁保留】 |
| diagnostics/ | 1(1,225) | Diagnostics |
| preflight/ | 1(204) | Preflight(仅 index barrel 消费,无 script/test 直连——登记疑似弱死区,本批不删) |

### ② 消费面

- `#codex/*`:lib **15 行/9 文件**(含 runtime 自身别名自引:ide-agent shim 3 行、agent-public-tools.ts:8、handlers/host-agent/{dimension-completion.ts:8,evolve.ts:15};rg 侧 7 行=cold-start.ts:31-34、knowledge-rescan.ts:40,41、dimension-completion.ts:17;service 侧 1=ProjectSkillService.ts:15;tool-router.ts:20);test **11 行/9 文件**+2 动态 import(McpCleanOutputContract.test.ts:295,296)+1 反向断言字符串(skeleton :132)
- 相对路径自引(改名放大器,按深度实测):**A 类 29 行**(顶层文件+index.ts 用 `../runtime/...` 上折返)+**B 类 67 行**(一级子目录 `../../runtime/...`)+**C 类 57 行**(mcp 深层 `../../../runtime/...`)+**E 类 1 行**(handlers/host-agent/dimension-completion.ts:13 四级)=**154 行在 lib/runtime→lib/host-runtime 改名时全部断裂**;另 **D 类 4 行**(host-adapter 4 文件 `../runtime/RuntimeContext.js` 指内层嵌套,外层改名存活但属嵌套消除范围)
- lib 外相对消费仅 1:service/resident/AlembicResidentServiceClient.ts:26(`../../runtime/daemon-status.js`)
- bin/host-mcp.ts:10,34(0c 已列);test 相对路径 **53 文件/113 行**(清单在扫描工作区,代表性:HostMcpServer、PluginHostMcpContract、AgentPublicTools 族 5、Codex* 族 8、McpCleanOutput 族 3、KnowledgeContext 族 3、search/prime/recipe-map 族、StagingAccessSweep、support/codex-session/{McpHarness,AgentOutputAnalyzer});scripts 硬路径 0c 已列
- index.ts barrel 消费者:bin:10 + skeleton test:11-13 + 仓外无

### ③ 目标布局(方案骨架 4 组不够容纳 13 顶层文件,底稿加 context/、policy/ 两组【决策项⑧】)

```
lib/host-runtime/
├── mcp/            ← 52 文件整组原样(handlers 已天然按工具族一文件一族+host-agent/ 子族,再分组收益<0——判无动作,登记)
├── host-adapter/   ← 4 文件原样
├── context/        ← RuntimeContext + ProjectRuntimeContext + EmbeddedRuntimeContract(自 runtime/runtime,嵌套消除)
│                     + ProjectRootResolver + HostProjectAlignment + PluginRegistry + ModuleBoundary + JobContext(8)
├── status/         ← StatusService + OnboardingContract + EnhancementRoute + host-runtime-status.ts(原 daemon-status,P4 改名)(4)
├── diagnostics/    ← Diagnostics + Preflight(2;preflight 环检并归诊断族)
├── policy/         ← ToolPolicy + SourceBoundary + ServiceRequestBoundary(3;三者都是写入/来源/请求边界策略)
├── index.ts + README.md(改写:分组地图+#host-runtime 别名说明)
```
(P3 若过:ProjectSkillDelivery→lib/service/skills、KnowledgeState→lib/service、HostAgentAnalysisSurface→pipeline/generate,host-agent/ 目录消亡;ide-agent/ 按决策⑦)

分组依据:context=运行时身份/环境/对齐事实(README 现文自述);status=面向 alembic_status 的摘要构建(StatusService:26-31 直连 OnboardingContract/EnhancementRoute/daemon-status);diagnostics=诊断与预检(Preflight 仅诊断性环检);policy=工具可见性/写来源/请求边界(ToolPolicy 头注+SourceBoundary 16 行 normalize+ServiceRequestBoundary 53 行 gate)。

### ④ 分步子批(每步独立可验可回退)

- **P2a 嵌套消除**:`git mv lib/runtime/runtime lib/runtime/context` + 3 文件迁移;回写 D 类 4 行(host-adapter `../runtime/`→`../context/`)+ 全部 `runtime/runtime` 中段引用(A/B/C 类中含 `runtime/runtime` 的行,ModuleBoundary.ts:6,12、PluginRegistry.ts:7、ProjectRootResolver.ts:12、ToolPolicy.ts:8、StatusService.ts:26,30、Diagnostics.ts:22,35、Preflight.ts:13、mcp/host/embedded-executor.ts:10、agent-public-tools.ts:8(#codex/runtime/→#codex/context/)、index.ts:15,16、NativeProjectScopeRuntimeWiring.test.ts:13、legacy-register.md:51);验证 0f+0c
- **P2b 顶层分组**:按③表 `git mv` 顶层 13 文件入四组;A 类 29 行与组间相对引重写(建议顺手把"上折返"风格统一为组内 `./`/跨组 `../<组>/`,消灭 `../runtime/` 惯用法,为 P2c 减面);AlembicResidentServiceClient.ts:26、53 个 test 文件涉动行、index.ts 20 行重写;daemon-status→status/host-runtime-status.ts 与类型改名可乘批(见 P4);验证 0f+0c
- **P2c 目录+别名 key 终改名**:`git mv lib/runtime lib/host-runtime`;package.json:36-39 与 packages/alembic-runtime/package.json `#codex/*`→`#host-runtime/*`(key+target);vitest 映射 `['codex','runtime']`→`['host-runtime','host-runtime']`;全仓 sed(**带尾斜杠** `lib/runtime/`→`lib/host-runtime/`、`#codex/`→`#host-runtime/`):26 行别名 import+2 动态+bin 2+scripts 0c 全表+doctrine-lint-exemptions 10 条+lint-layer-boundary.mjs:26,28+lint-scope-resolution.mjs:36+error-registry-adoption.json:5+残余 B/C 类相对行(P2b 未统一的)+53 test 文件;skeleton :132 断言串保留(仍断旧串)可另加 `#host-runtime/mcp/host-agent-workflows/` 断言一行(登记);验证 0f+0c+`npm run check` 全量

### ⑤ 风险

- **最大风险=154 行相对自引+113 行 test 相对引的机械回写遗漏**——但全部是 build:check 编译期红(NodeNext 显式后缀),不是静默错;P2b 先统一风格能把 P2c 的 sed 面缩到只剩别名与 lib/host-runtime 前缀
- **runtime 包 imports 漏同步**(0b):build/test 全绿也发现不了,只有 verify:codex-runtime-package 的离线 install+entrypoint probe 能拦——**P2c 后必跑**
- sed 陷阱:`lib/runtime-pack-freshness.mjs`(0c 表尾)、以及 `#codex` 与宿主 id `'codex'` 字符串的边界(sed 必须带 `#` 与 `/`)
- mcp/ 内部 52 文件不动内部结构,God files(P4)与 handlers 再分组明确判"无动作",防本批夹带
- index.ts barrel 重写时导出集合漂移:重写前后 `Object.keys(await import('./dist/lib/host-runtime/index.js')).sort()` diff 兜底(W4 4-4 同法)

---

## P3 四目录循环拆除 —— 【动,先薄边后改名】

### ① 实扫边清单(全部 file:line;值/类型标注)

**环 A(方案主诊断,四向)**:
| 边 | 位置 | 符号 | 性质 |
|---|---|---|---|
| recipe-generation→workflows | dimension-completion.ts:40-43 | runWorkflowCompletionFinalizer(+type Dependencies) | 值 |
| 〃 | dimension-completion.ts:44 | generateSkill | 值 |
| workflows→service | surfaces/execution/WorkflowSkillCompletionCapability.ts:3 | createProjectSkillService | 值 |
| service→runtime | skills/ProjectSkillService.ts:8-15 | buildContentHash/buildPluginProjectSkillDeliveryReceipt/exportProjectSkillReceiptToRuntime/getProjectSkillRoot/PROJECT_SKILL_MARKER_FILE(+1 type) | 值 |
| runtime→recipe-generation | 0e/P1② 所列 runtime 侧 8 文件 14 行(tool-router:24-35、host-agent 三 handler、opportunistic-evolution-presenter:2,3,9、retrieval-checkpoint-diagnostics:5、OnboardingContract:13、Diagnostics:6) | 多符号 | 值 |

**环 B(直环,rg↔runtime)**:rg→runtime 7 行=cold-start.ts:31(buildLocalSelectionMismatch/HostProjectAlignment)、:32(buildHostAgentAnalysisSurface/host-agent)、:33(inspectKnowledge+type HostKnowledgeState/KnowledgeState)、:34(buildColdStartOnboardingContract/status/OnboardingContract)、knowledge-rescan.ts:40,41、dimension-completion.ts:17;runtime→rg 即上表 14 行。使用位:cold-start.ts:227,330,1175,1229;knowledge-rescan.ts:1487,1765(全在结果装配段)。

**环 C(直环,rg↔service)**:service→rg=knowledge/RecipeFreshnessRuntime.ts:9-12(值 syncRecipeSemanticMemoriesForEntries+type,来自 recipe-region-vector);rg→service=knowledge-rescan.ts:67、cold-start.ts:61(CleanupService,值)。

**环 D(类型环,rg↔injection)**:rg→inject 类型 5 行=recipe-region-vector.ts:2,3、knowledge-index-rebuild.ts:1、knowledge-rescan.ts:42、cold-start.ts:35(全部 `import type` ServiceContainer/ServiceMap);inject→rg 值 5 行=ServiceMap.ts:58,59,65、InfraModule.ts:27、VectorModule.ts:14,18、KnowledgeModule.ts:60(composition root,方向合法)。

### ② 最薄边定位与拆法(方向公理:host-runtime(L2)→pipeline/service(L1) 合法;反向即背滑)

1. **环 A 最薄边=service→runtime**:lib/runtime/ProjectSkillDelivery.ts(528)imports 仅 node+@alembic/core(:1-14,零 runtime 内部依赖),消费仅 ProjectSkillService.ts+runtime/index.ts+test 2 文件 → **实现下沉 `git mv` 至 lib/service/skills/ProjectSkillDelivery.ts**,3-4 处 import 改写,环 A 即断(rg→workflows→service 成单向链)。workflows 是否并入 pipeline/generate 因此**不再是断环必要条件**,降级为镜像忠实度推荐【决策项④:主体侧同型合并已由用户决策,Plugin 侧 lib/workflows 仅 4 文件 536 行且唯一 lib 消费者是 dimension-completion.ts:43,44——推荐并入 recipe-pipeline/generate/(completion 3 文件+execution 1 文件),#workflows 别名随删,L1_DIRS 删 'lib/workflows';否决则原样保留,零代价】
2. **环 B 拆三刀**:(i)HostAgentAnalysisSurface.ts(361)imports 仅 @alembic/core/host-agent-workflows(:5),消费=rg 3 文件+ide-agent shim+test → **迁 pipeline/generate/**,杀 rg→runtime 3 行;(ii)KnowledgeState.ts(611)imports 仅 node+core+#infra+repository(:1-9),runtime 内消费 5 处+rg 1 处 → **下沉 lib/service/knowledge-state/**(或 service/knowledge/),杀 cold-start.ts:33,runtime 侧 5 消费转 hr→service 合法【决策项⑤】;(iii)残余 2 符号 3 行(buildLocalSelectionMismatch=读 host 全局 runtime-control 状态,HostProjectAlignment.ts:424-448,真 host-runtime 语义;buildColdStartOnboardingContract=织 PluginToolSurfaceCatalog 工具面,真 status 语义)——**不宜搬**;拆法二选一【决策项⑥】:(a)DI——两 workflow 已收 ServiceContainer,把两构建器作为可选 hostFacts 端口注入(装配点在 mcp handler 层,方向即正);(b)登记性豁免——lint 白名单显式列 2 符号,后续批清零。推荐 (b) 先行(W5 是结构批,不动行为),(a) 列 follow-up
3. **环 C**:RecipeFreshnessRuntime.ts(消费=injection/KnowledgeModule.ts:61+tool-router.ts:54+host-agent/evolve.ts:24,全是 wiring/L2)→ **迁 pipeline/sustain/**(freshness 刷新=sustain 环机制词),service→rg 边随文件离开 service 而消亡;rg→service 的 CleanupService 边转 rp→service 单向,无环【决策项②,推荐】。**不采用** vector→service/vector 路线(P1③ 反证:skeleton :135 禁 '#service/vector/')
4. **环 D**:类型环,值方向(inject→rg)是 composition root 正向;**W5 无动作,登记**为 tolerated type-only 边(替代 ServiceContainer 结构化 {get} 类型下沉 lib/types 有 RecipeFreshnessRuntime.ts:14-16 先例,列 follow-up)
5. **门禁强化(随批)**:lint-layer-boundary.mjs:26 L1_DIRS += 'lib/recipe-pipeline'(现状 rg 不在 L1 保护列,rg import mcp 无门可拦;P3 落地后加入,把方向公理变门禁);决策④通过则同批删 'lib/workflows'

### ③ P1/P2 改名后的环新形态推演

目录改名是同构映射,不消也不增任何边:P1/P2 落地而 P3 未动时,环 A-D 原样存在,只是换名(recipe-pipeline↔host-runtime/...)。故**P3 薄边搬迁排在 P1b 之前执行**(文件先离开两棵将改名的树,后续 sed 面更小);P3-(iii) 残余 2 符号与 L1_DIRS 扩展排 P1c/P2c 之后收口(白名单写终名)。

---

## P4 命名与杂项

### DaemonStatus→HostRuntimeStatus 【动,微批,乘 P2b】

- 现状:lib/runtime/daemon-status.ts(25 行,PDR-3 头注自述"恒 daemon-less/null 值");全仓 **76 处/12 文件**:定义 1+lib 消费 8(HostProjectAlignment.ts:17,86,351、EnhancementRoute.ts:13,147,213,531、runtime/ProjectRuntimeContext.ts、mcp/HostMcpServer.ts、status/StatusService.ts:34,67,135,160-241、diagnostics/Diagnostics.ts、service/resident/AlembicResidentServiceClient.ts:26、mcp/host/host-project-handoff.ts)+test 3(CodexRuntimeContext/CodexEnhancementRoute/CodexStatusService)
- 改法:文件 daemon-status.ts→status/host-runtime-status.ts(P2b 分组内);类型 DaemonStatus→HostRuntimeStatus、DaemonStatusKind→HostRuntimeStatusKind;**冻结不动**:载荷键 `daemon`(StatusService.ts:67)、`daemonStatus` 参数名可改但其序列化产物键不可、磁盘文件名 daemon.json/pid/lock/log(:174-177)、`import type { DaemonState } from '@alembic/core/daemon'`(Core wire)、PDR-3 注释保留改写
- 旧名进 Core retired-symbols 词表(lint:retired-symbols 由 ../AlembicCore 脚本驱动)——跨仓一行,登记

### #governance 死别名 【动,2 处】

- W1 已删根 package.json 条目;残余:packages/alembic-runtime/package.json:24-27(指向不存在的 lib/governance)+vitest.config.ts sourceImportAliases 'governance' 行。全仓 `#governance` 消费 **0**(实扫)。顺手删 vitest 映射其余 8 死行(agent/domain/external/http/platform/repo/sandbox/tools,对应 lib 目录全灭)

### plan 环文件散平铺 —— 随 P1 解决(指针,无独立动作)

### god files 登记(本批不拆,只记方向)

- mcp/handlers/search.ts **2520 行**:单文件装了 search 工具的检索编排+KnowledgeEntryJSON 投影(:1486-1705)+candidate 转换+resident search 桥;拆分方向=检索编排/投影层(与 W3-D5 合并 KnowledgeEntryWire 后自然剥离)/resident 桥三段
- mcp/handlers/agent-public-tools.ts **2435 行**:agent 公开工具族(prime/work/dimension_complete 等)单文件;拆分方向=按工具族分文件(与 handlers 现惯例对齐),先决=AgentPublicTools 契约测试 5 文件的锚点重排
- 附带登记:preflight/Preflight.ts 仅 index barrel 消费(疑似弱死区)、JobContext.ts 19 行仅 barrel 消费——W1 型死区清算候选,本批不动

---

## W3-D5 联动(登记级):KnowledgeEntryJSON vs Core KnowledgeEntryWire

- Plugin:lib/runtime/mcp/handlers/types.ts:95-159(**全字段可选**,id/title 外皆 `?`,松 `[key:string]:unknown` 五处,含 `toJSON?: () => KnowledgeEntryJSON` 实体鸭型);消费仅 search.ts(:41,1486,1532,1654,1705,2354-2362)
- Core:src/types/KnowledgeWire.ts:95-164(**全字段必填**的严格传输契约,六个 typed 子对象 Wire)
- 主体双胞胎:Alembic lib/service/handler-runtime/types.ts(+消费 lib/recipe-pipeline/generate/runtime/GenerateRefine.ts)

| 差异轴 | Plugin KnowledgeEntryJSON | Core KnowledgeEntryWire | 判定 |
|---|---|---|---|
| 可选性 | 除 id/title 全可选 | 全必填 | 语义不同物:读侧容错投影 vs 序列化完整契约 |
| createdAt/updatedAt | **string?** | **number**(+publishedAt/By) | **硬冲突**,直并必炸 |
| quality | 4 项 number\|null,无 grade | 4 项 number+grade | 缺字段+null 语义差 |
| stats | 5 项+索引签名 | 14 项(authority/lastHitAt/hitsLast30d/version/ruleFalsePositiveRate 等) | Core 超集 |
| relations/constraints/content/reasoning | unknown[]/宽松 | typed 子对象 | Core 严格化 |
| Plugin 独有 | toJSON 方法位 | — | 实体鸭型痕迹 |
| Core 独有 | — | lifecycleHistory/autoApprovable/stagingDeadline/dimensionId/difficulty/topicHint/usageGuide/headerPaths/moduleName/includeHeaders/agentNotes/aiInsight/reviewedBy 组/source 组 | 读投影不需即不列 |

**判定:不可直并**。正路=Core 增设读侧容错投影别名(如 `KnowledgeEntryWireLoose`/`Partial<KnowledgeEntryWire>` 变体+时间戳 string|number 归一),两宿主双胞胎同批切换;createdAt string/number 归一须先查双方真实来源(entity.toJSON 产出 vs DB row)。**列 W5 后独立微批,勿与目录批夹带**(触 Core exports 新增,走 Core 窗口)。

---

## 执行顺序推荐(先薄边、再环化、后改名,每批独立 commit 可回退)

| 批 | 内容 | 规模 | 前置 | 验证 |
|---|---|---|---|---|
| W5-a | P3 薄边搬迁:ProjectSkillDelivery→service/skills;HostAgentAnalysisSurface→recipe-generation(暂入 host-agent-workflows/,随 P1b 进 generate/);(决策②⑤过)RecipeFreshnessRuntime→rg/evolution 侧待 P1b 归 sustain、KnowledgeState→service | 3-4 mv+~15 import | 决策②⑤ | 0f |
| W5-b | P1b 环化(plan/generate/sustain/curate/vector 就位+README 三件)+(决策④过)workflows 并入 generate | 30+ mv+~90 行回写 | W5-a | 0f+0c |
| W5-c | P2a 嵌套消除+P2b 顶层分组+P4 DaemonStatus 改名 | 16 mv+~120 行回写 | 可与 W5-b 换序 | 0f+0c |
| W5-d | P1c recipe-generation→recipe-pipeline+#recipe-pipeline key(sed 一遍) | 1 mv+~110 行 sed+3 配置 | W5-b | 0f+0c+外仓无(仓内闭合) |
| W5-e | P2c runtime→host-runtime+#host-runtime key(sed 一遍,含 0c 全表 scripts+doctrine 豁免 10 条+layer-boundary 脚本) | 1 mv+~200 行 sed+4 配置 | W5-c | 0f+0c+`npm run check` 全量 |
| W5-f | P3 收口(L1_DIRS 扩展+残余 2 符号白名单或 DI)+P4 清尾(#governance×2、vitest 死行、legacy-register 路径、README 定稿) | 小 | W5-d,e | 0f+`git diff --check` |

W5-d 与 W5-e 拆两批的理由:两棵树的 sed 词根(`recipe-generation`/`runtime`)互不重叠,分批则单批失败可独立回退;合批省一轮验证但回退面翻倍。

**用户决策项汇总**:①recipe-evidence-gate 入 curate/(推荐)或留 generate/;②RecipeFreshnessRuntime 迁 pipeline/sustain(推荐,解环 C);③RECIPE_GENERATION_* 符号词族缓议(推荐);④workflows 4 文件并入 generate+#workflows 别名删除(镜像主体决策,推荐);⑤KnowledgeState 下沉 service(推荐,解环 B 一刀);⑥残余 rg→host-runtime 2 符号=白名单豁免(推荐)或 DI;⑦ide-agent shim G6 候删或随迁(默认随迁);⑧context//policy/ 两个计划外分组名;⑨vector 留 pipeline(推荐,RG9 门反证)——若用户坚持镜像主体 service/vector,须同批撤 skeleton :135 断言并留决策记录。

## 统计

| 子项 | 判定 | 涉源文件(行数) | 别名/硬路径联动 | exports/wire 变更 |
|---|---|---|---|---|
| P1 四环镜像 | 动 | 36(13,965)+消费 lib 13+test 33 | #recipe-generation 65 行+skeleton 13 路径+contracts.ts:1+lint-scope:34+rebuild:45+imports 配置×3 | 0(工具面/载荷不动) |
| P2 host-runtime | 动(P2a/b/c 三子批) | 79(25,613)+test 53 | #codex 29 行+相对自引 154+bin 2+scripts ~20 行+doctrine 豁免 10+layer-boundary 脚本+imports 配置×3 | 0 |
| P3 循环拆除 | 动(薄边 4 mv+豁免/DI) | 环边 31 行/4 环 | L1_DIRS 扩展 | 0 |
| P4 DaemonStatus | 动(乘 P2b) | 12(76 处) | retired-symbols 词表(跨仓) | 0(载荷键 daemon 冻结) |
| P4 #governance | 动 | 0 源 | runtime 包 manifest:24-27+vitest 死行 9 | 0 |
| P4 god files | **登记不动** | 2(4,955) | — | — |
| W3-D5 KnowledgeEntryJSON | **登记不动**(判定:不可直并,须 Core 容错投影) | 2 仓 3 文件 | — | 待 Core 微批 |

外部消费总账:`#recipe-generation` lib+bin 45/test 20;`#codex` lib 15/test 11+2 动态;lib/runtime test 相对 113 行/53 文件;lib/recipe-generation test 相对 47 行/23 文件;仓外源代码消费 **0**(Alembic/Dashboard/Agent/Core src 实扫,仅 Core gateRules.ts:6-7 注释);drift manifest/跨壳门/插件 manifest **零联动**。
