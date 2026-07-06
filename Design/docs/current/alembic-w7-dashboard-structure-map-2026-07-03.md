# W7 Dashboard 结构批执行底稿

- 生成:2026-07-03,只读扫描产物(未改任何源码);沿用 W5/W6 底稿方法论(`Design/docs/current/alembic-w6-agent-structure-map-2026-07-03.md`)
- 扫描基线:AlembicDashboard@`6aa664e`(W0 已修 GenerateProgressView 导出名——971d90a;S4 批3a bootstrap→generate 已落 Dashboard——421101c;工作树干净)
- 方案锚:`Design/docs/current/alembic-workspace-unification-plan-2026-07-02.md` §2.2 Dashboard 段(api 按路由族拆/App 减负/views 对齐/双通道收敛/死区清算)+§三 W7 行+§五-3(CG-1 排期问题——**用户 2026-07-02 已废弃 SPM 删除需求,本批 SPM 整链纯冻结**)
- 消费面全部用 `find -exec grep` 实扫;行号为本基线实测
- 规模:src 79 文件 34,811 行;无 vitest——测试=node --test 契约套件(scripts/dashboard-contract.test.mjs 1,673 行 33 用例)
- ⚠️ **基线预红两处**(0d):契约测试 4/33 红(S4 欠账)+`check:api-types-drift` 红(落后主体 canonical 一个字段)。另有用户可见 i18n 回归(S4 残留)。W7-0 前置必修

---

## 0 硬约束与门禁锚点总表(全批共用)

### 0a SPM 冻结面清单(先行;后续每子项改动面须与本清单零交集)

用户决策(2026-07-02):SPM 页+信号系统删除需求已废弃 → SPM 整链**纯冻结:不删、不重命名、不重构**。Dashboard 侧 SignalBus 消费面**已不存在**(SignalReportView/SignalMonitor 早已删除,契约测试 #26 `dashboard-contract.test.mjs:1050-1112` 钉死其缺席+api 零 signal 方法;src 内剩余 "signal" 命中全为 AbortSignal/进化 proposal 徽章注释,实扫核验)。冻结面=SPM 页链:

| 类别 | 冻结项 | 锚点 |
|---|---|---|
| View 文件 3 | ModuleExplorerView.tsx(447 行)、ScanResultCard.tsx(627)、ContextAwareSearchPanel.tsx(355;仅 MEV 消费) | components/Views/;MEV 引两者 ModuleExplorerView.tsx:9-10 |
| tab id | `'spm'`(wire,0b) | constants/index.ts:55;App.tsx:489,512,547,785,1194,1215,1222;Sidebar.tsx:83;CommandPalette.tsx TAB_*_MAP |
| api 方法 8 | fetchTargets(:3194)、getTargetFiles(:3200,零消费也不删)、scanTarget(:3206,零消费也不删)、scanTargetStream(:3217,fetch+EventSource)、scanProject(:3295)、browseDirectories(:3316)、scanFolderStream(:3328,fetch+EventSource,零消费也不删)、refreshProject(:3554,POST /modules/update-map+/commands/spm-map;共享给 KnowledgeView onRefresh App.tsx:1221) | src/api.ts 各行 |
| App.tsx SPM 段 | 状态 :160-167(targets/customFolderTargets/selectedTargetName/isScanning/scanProgress/scanFileList/scanResults/guardAudit)+sessionStorage 缓存 :171-205,237-256+localStorage 自定义目录 :228-235,1048-1069+SCAN_EVENT_PROGRESS :569-576+handleScanTarget :578-673+handleScanProject :779-854+mergedTargets/filteredTargets :1027-1045+MEV 挂载 :1222-1245 | App.tsx |
| 类型 | SPMTarget、ScanResultItem、GuardAuditResult、ScannedFile、ProjectDirectory(types.ts)+utils isShellTarget/isSilentTarget/isPendingTarget(utils/index.ts:1-9) | — |
| i18n 段(zh+en 对称) | moduleExplorer.*(zh.ts:1362)、scanResult.*(:1447)、scanResultCard.*(:1890)、spmCompare.*(:1654)、silentLabels.*(:1691)、app.scan.*/app.fullScan.*(App SPM 处理器文案) | 其中死键 88 个(D3)**登记不删** |
| 持久化串(wire) | sessionStorage `asd:spm:{scan-results,selected-target,guard-audit}:${root}`(App.tsx:173,244,248,253);localStorage `asd:custom-folder-targets:${root}`(:231,1054,1065) | 冻结 |

- 注意两处**共享不冻结**边界:①isScanning/scanProgress/abortControllerRef 同时被 generate 环 handleColdStart(:676)/handleRescan(:730) 写——这两个处理器属 generate 环不冻结,但它们写的状态是 SPM 共享状态,D2 拆分对该状态整体绕行;②extract 三处理器(:480-566)写 setScanResults+navigateToTab('spm')——extract 功能不冻结,但落点状态冻结,同绕行

### 0b wire 冻结面

| 面 | 全集 | 锚点 |
|---|---|---|
| HTTP 路由串 | api.ts 调用 17 个后端路由族(D1 表):projects/project-scope/modules/jobs/commands/extract/knowledge/search/recipes/ai/rules/violations/guard/audit/logs/evolution/daemon;+api.ts 外 auth(/auth/login,/auth/me,/auth/probe——useAuth.ts:53,88、usePermission.ts:104)+/ai/lang(i18n/index.tsx:69,76,93)。后端 mount 锚:Alembic lib/http/HttpServer.ts:244-330(`apiPrefix='/api/v1'`);auth/probe 是 HttpServer.ts:267 内联端点;**后端无 /auth/login、/auth/me 实现**(全仓 grep 零命中;VITE_AUTH_ENABLED 构建期开关默认关,该两调用当前不可达——D4 证据,不扩权修) | 改内不改串 |
| tab id 9 个 | `'recipes','spm','candidates','knowledge','guard','project-pyramid','skills','jobs','help'`(URL path 持久化 App.tsx:143-146,310;popstate :363) | constants/index.ts:55 validTabs;契约测试 :1095-1105 钉 7 个必须保留 |
| Socket 事件名 | 消费侧裸串,**无单源常量**:`bootstrap:{started,task-started,task-completed,task-failed,all-completed}`(useGenerateSocket.ts:310-314/338-342)、`review:round{1,2,3}-*` 7 个(:315-321)、`job:process-event`(useJobProcessEvents.ts,契约测试 :811 钉)、emit `join-notifications`(lib/socket.ts:26)。产生端也是裸串(Alembic lib/recipe-pipeline/generate/{ColdStartWorkflow,GenerateTaskManager}.ts)——跨仓字符串对齐,W7 一律不触;S4 commit 421101c 已明示"socket 事件名 'bootstrap:*' 是 wire 冻结保持裸串" | — |
| i18n key 外部引用实证(W3 底稿遗留项) | **无跨仓引用**:Alembic lib 全仓 grep dimLabels/moduleExplorer./sidebar.* 零命中;locale 只进前端 bundle。运行时拼接族 6 个(死键误判白名单):`tokenUsageChart.weekday${0-6}`(TokenUsageChart.tsx:127)、`llmConfig.effort.${level}`(LlmConfigModal.tsx:428)、`skills.createdBy.${x}`(SkillsView.tsx:331)、`help.${item.key/subKey}`(HelpView.tsx:291-292)、`guardRuleMessages.${ruleId}`(GuardView.tsx:156,**后端规则 id 键控**)、`guardRuleFixSuggestions.${ruleId}`(GuardView.tsx:162,同)+修复后第 7 族 `generate.pipelineLabels.${meta.dimId}`(GenerateProgressView.tsx:155,**后端 dimId 键控**)。另契约测试对 zh/en 各 9 处 read+具名 key 断言(如 projectScope* 17 键 :1596-1617)=测试钉死面 | 键控族删除需后端值域证据,本批不删 |
| localStorage/sessionStorage 串 | 0a SPM 串+`asd-dashboard-lang`(i18n/index.tsx:19)+`auth_token`/`auth_user`(useAuth.ts:36-37,usePermission.ts:100)+JobProcessEvents 缓存 `alembic.dashboard.jobProcessEvents.v1`(utils/JobProcessEvents.ts:契约测试 :540 钉) | 冻结 |

### 0c 构建门禁与验证链

- **npm scripts 全集**(package.json:6-19):dev/lint(scripts/lint-dashboard.mjs)/test(`node --test scripts/dashboard-contract.test.mjs`)/typecheck(tsc --noEmit)/check:api-types-drift/check:space-boundary/check:layer-contract/check:doctrine/check:naming/check(串联全部+build)/build:check/build(`tsc && vite build`)/preview。**无 vitest、无 biome**(space-boundary 输出自证:"no biome, tests use node --test")
- 每批验证命令=`npm run check` 全链;等价拆解:`npm run lint && npm run check:api-types-drift && npm run check:space-boundary && npm run check:layer-contract && npm run check:doctrine && npm run check:naming && npm run test && npm run typecheck && npm run build`。跨仓抽验:主体 `npm run build:dashboard`
- **主体 build:dashboard 链形态**(Alembic package.json:66→scripts/build-dashboard.mjs):经 `resolveDashboardSource()`(dashboard-artifact-metadata.mjs:11-15)按名解析 `../AlembicDashboard` 或 `vendor/AlembicDashboard`;执行 `npm --prefix <repo> run build`(build-dashboard.mjs:38);校验 `dist/index.html`(:51);拷贝 dist→主体 dashboard/dist+写产物元数据(:55-61)。**只依赖仓根 package.json 的 `build` 脚本名与 dist/index.html 产物,零内部文件路径硬编码**——W7 目录重组对该链零联动
- tsconfig.json:**无 path alias**(layer-contract.json:3 自述"no path aliases exist"),include=["src"],moduleResolution=Bundler——相对导入是唯一解析方式,搬文件只改相对路径
- vite.config.ts:manualChunks 按 node_modules 包名分块(:133-145,axios 单独 chunk :143)——与 src 内部结构无关,零联动;/api 与 /socket.io 代理(:100-127)是 dev 面
- **config/layer-contract.json(结构性门禁)**:area=src 顶级目录+src 顶级 *.ts(x) 文件名 stem(lint-layer-contract.mjs:10-11,areaOf :44);`allowedRuntimeImports`(:31-46):`App→[api,components,constants,hooks,i18n,KnowledgePayload,types,utils]`、`api→[generated,types]`、`components→[api,constants,hooks,i18n,lib,RuntimeDiagnosticsPanelModel,theme,types,utils]`、`hooks→[api,lib,utils]`;type-only 豁免(:4)。**api.ts→src/api/ 目录化后 area 名仍是 'api',矩阵零回写**;D2 新 hook 若运行时引 constants(validTabs 值)需加 `hooks→constants` 边(contract 回写,W7 是控制器批次,合法但须显式)
- config/naming-lint.json:components PascalCase.tsx、hooks useX.ts、src camelCase/PascalCase、index.ts barrel 通行——D1 目标名(client.ts/jobs.ts/…)全部合规
- config/doctrine-lint.json:模块级可变 let/空 Map/Set 禁(2 个 blessed 在 MermaidBlock)——D1 拆分不新增模块级可变态即绿

### 0d 基线预红(W7-0 前置必修;不修则每批验证信号被污染)

| # | 红项 | 证据 | 修法 |
|---|---|---|---|
| 1 | 契约测试 4/33 红(实跑 node22:29 pass 4 fail) | ①#3(test:242)期待 Header 含 `t('bootstrap.terminalCapability')`,实为 `t('generate.terminalCapability')`(Header.tsx:937);②#11(test:500-509)`read('src/hooks/useBootstrapSocket.ts')` ENOENT(S4 已改名 useGenerateSocket.ts);③#12(test:511-650)`read('src/components/Views/BootstrapProgressView.tsx')`(:516)ENOENT(已改名 GenerateProgressView.tsx;文件内 BootstrapProcessSummary :370/getBootstrapProcessEventTone :478 等符号仍在,仅路径改即可);④#26(test:1050-1112)preservedView 断言 `BootstrapProgressView` 应挂载于 App(:1089) | 契约测试 4 处改 regex/路径:bootstrap.→generate.(:256 等)、两个 read 路径、preservedView 词。S4 commit 421101c 未触 scripts/(欠账实证) |
| 2 | check:api-types-drift 红 | src/generated/api-types.ts(sha256 508c9871…)vs 主体 canonical lib/generated/dashboard-api-types.ts(ea61a4dc…);diff 仅 1 行:canonical 多 `stagingDeadline: number \| null;`(:113) | 按 src/generated/README.md 同步流程:逐字拷贝 canonical+重写 api-types.sha256 pin。禁手改(README"Do not edit by hand") |
| 3 | 用户可见 i18n 回归(S4 残留,测试不覆盖) | S4 只切了直写 `t('bootstrap.…')`,漏了**变量/模板承载的 key**:①CandidatesView.tsx:29-54 DIM_I18N_KEYS 26 个值仍 `'bootstrap.dimLabels.*'`→t() 查无返回原 key,**候选分组维度标签显示原始 key 串**(:73 `t(DIM_I18N_KEYS[key])` 无回退);②GenerateProgressView.tsx:155 `` `bootstrap.pipelineLabels.${meta.dimId}` ``(有 meta.label 回退,静默退化英文);③GenerateProgressView.tsx:267-269 REVIEW_ROUNDS 6 个 labelKey/descKey 'bootstrap.reviewRounds.*'→**AI 审查面板直接渲染原始 key**(:311-312 `t(labelKey)` 无回退) | 3 文件 5 处前缀改 generate.;修后 generate.dimLabels 26+pipelineLabels 25+reviewRounds 6=**57 个"假死"键复活**(D3 名单已扣除) |

### 0e 契约测试=按文件路径钉死的结构门禁(W7 最大改动税面)

dashboard-contract.test.mjs 用 `read('src/…')`(字面路径 readFileSync+regex 断言)与 `importTranspiled('src/…')`(转译执行)钉死结构。实测密度:**api.ts 12 read+7 importTranspiled=19 处**;App.tsx 7 read;Header.tsx 8 read;zh/en 各 9 read;JobsView 5 read;types/constants/HelpView/Sidebar/CommandPalette 各 3;其余单处。含内容级断言(如 :522 钉 api.ts 内 `` `/jobs/${encodeURIComponent(jobId)}/events` `` 路由串写法、:988 钉 App.tsx 调 buildKnowledgeCreatePayload、:504 钉 App.tsx 内 bootstrap.isAllDone→fetchData 效果)——**D1/D2 每步搬动都必须同步迁移断言目标路径与归属**,测试是 Dashboard 自有资产可改,但逐条对号是主要工作量
- **AD6 transport census ratchet**(test:1630-1672+docs/declared-effects.md):declaredTransportModules=`['src/api.ts','src/lib/socket.ts']`;knownStrayFindings=`['src/hooks/useAuth.ts','src/hooks/usePermission.ts','src/i18n/index.tsx']`(test:1633,1638)。精确集合比对:新增传输点即红;D4 收敛一个 stray=显式删该行;D1 拆分后 axios/fetch/EventSource 所在新文件须改 declared 名单+同步 declared-effects.md 传输表(census 注释 :1631 明示)

---

## D1 api.ts 拆分(god file 4,278 行)

### ① 现状清单(段落地图)

| 段 | 行 | 内容 |
|---|---|---|
| 头注+imports | 1-54 | :8 自述 SSE 架构;:11 axios;:12-13 generated(值 DASHBOARD_FAILURE_KINDS+2 类型);:14 KnowledgePayload;:15-54 types.ts 39 类型 |
| client 层 | **:60 一行** | `const http = axios.create({ baseURL: '/api/v1' })`。**无拦截器、无 Authorization 逻辑**(全文件 grep interceptors/Authorization 零)——"client 层"实际厚度=1 行,拆出 client.ts 是为 D4 后续统一落点 |
| adapter 政策+D25 错误分类 | :67-492 | DASHBOARD_PROVIDER_ADAPTER_POLICIES(:107,契约测试 #27 :1117 执行级消费)、私字段剥离(:205-253)、normalizeDashboardErrorProblem(:425,D25 契约测试 :1401 執行) |
| 通用工具 | :493-623 | firstString/firstRecord/recordArray… 纯函数族 |
| jobs 归一+类型 | :599-937,1774-2115 | normalizeProcessDeveloperView(:624)、normalizeJobProcessEventsResponse(:677)、JobDisplaySnapshot 全族(:701-937,类型 :1891-2036)、DaemonJobRecord(:1774)、AgentDiagnostics/AgentEfficiencySummary(:2077,2088)、normalizeJobProcessArtifactRequestPath(:2037) |
| projects runtime 归一 | :938-1277 | normalizeProjectsSnapshot(:1255,契约测试执行级)、postProjectAction(:1439) |
| project-scope 归一 | :1278-1409 | normalizeProjectScopeResponse(:1382)等 |
| runtime boundary+host-managed | :1410-1773,2412-2638 | normalizeRuntimeBoundary(:1627)、HostManagedUnavailableError(:1746 class)、parseHostManagedUnavailable(:2575) |
| recipe/candidate mapper | :2116-2411 | toRecipe(:2116,fetchData 消费 :3085)、parseFrontmatter(:2231,**仅 saveRecipe :3596 消费——随死方法链亡**)、toCandidatePayload(:2352)、resolveKnowledgeId(:2397) |
| SSE 投影 | :2639-2722 | SSEEvent/projectProviderSseMessage(:2687,契约测试执行级) |
| search/AI/guard 归一+类型 | :2723-3006 | GraphEdge(:2723,**仅 KnowledgeGraphView 消费——随 D3 链亡**)、normalizeSearchResponse(:2843)、normalizeGuard*(:2922-2983) |
| **死函数** | :3007-3068 | `_consumeSSE`——全仓零调用(D3) |
| api 对象 | :3069-4278 | **98 个 async 方法**+`export default api`(:4278) |

计数:模块级函数 99;导出类型 51+导出函数/常量 26+default;api 方法 98(其中 3 个无自有 http 调用:openProjectDashboard/switchProject/stopProject→postProjectAction;getProposalsByRecipe/getWarningsByRecipe→this. 委托 :4214,4257;insertAtSearchMark=**stub 直返 false**(:3894-3898 注释自认))

### ② 后端 24 路由文件 ↔ api 方法对应表(方法→目标文件精确分组)

后端 mount:HttpServer.ts:252-330(24 个 routes/*.ts,22 mount+audit/logs;auth/probe 内联 :267)。Dashboard **零消费族 7**:candidates、file-changes、governance、health、signals(页面已删)、wiki(页面已删,测试 :1043 钉缺席)、daemon(仅 /daemon/health 一点,在 fetchData 聚合内)。

| 目标文件 | 路由族 | 方法(数) | 消费面(api.xxx 调用文件) |
|---|---|---|---|
| src/api/client.ts | — | http 实例(:60)+通用工具(:493-623)+adapter 政策(:67-253) | 全族 |
| src/api/problem.ts | — | D25 taxonomy(:255-492)+host-managed 族(:1717-1773,2412-2638) | client 邻接;契约测试执行级 |
| src/api/sse.ts | — | SSEEvent+projectSse*(:2639-2722) | modules 流方法+契约测试 |
| src/api/projects.ts | projects | getProjectsSnapshot、getCurrentProjectSnapshot(零 UI 消费但契约测试 :325 钉)、openProjectDashboard、switchProject、stopProject(5)+归一 :938-1277 | App、Header |
| src/api/projectScope.ts | project-scope | getProjectScope、listProjectScopeFolders、addProjectScopeFolder、resolveProjectScopeFolder(4)+归一 :1278-1409 | ProjectScopePanel |
| src/api/modules.ts | modules+commands | **SPM 冻结段 8**(0a)+bootstrap、getBootstrapStatus、cancelBootstrap、rescan、getTestModeConfig、getDepGraph、getProjectInfo(死,D3)(7) | App、MEV、Header、useGenerateSocket、DepGraphView |
| src/api/jobs.ts | jobs | listJobs、getJob(死,D3)、getJobProcessEvents、getJobDisplaySnapshot、getJobProcessArtifact、cancelJob、enqueueBootstrapJob、enqueueRescanJob(8)+归一 :599-937,1774-2115 | JobsView、useJobProcessEvents、App |
| src/api/knowledge.ts | knowledge | knowledge* 11+saveRecipe(死)/deleteRecipe/getRecipeByName(死)/setRecipeAuthority/updateRecipeRelations/getCandidate(死)/deleteCandidate/promoteCandidateToRecipe/deleteAllCandidatesInTarget/promoteToCandidate/getKnowledgeLifecycle(21)+mapper :2116-2411 | KnowledgeView、App、RecipesView、CandidatesView、RecipeEditor |
| src/api/search.ts | search | search、getKnowledgeGraph(D3 链亡)、getGraphStats(D3 链亡)(3)+normalizeSearchResponse | SearchModal、ContextAwareSearchPanel(SPM) |
| src/api/recipes.ts | recipes | discoverRelations、getDiscoverRelationsStatus(2,均 D3 链亡→**族文件可不建**) | 仅 KnowledgeGraphView(死) |
| src/api/ai.ts | ai | getAiProviders、getAiProvidersEnhanced(死)、probeProvider、setAiConfig(死)、summarizeCode(死)、translate(死)、aiGenerateSkill、getLlmEnvConfig、getTokenUsage7Days、saveLlmEnvConfig、getLang(D4 复活)、setLang(D4 复活)(12) | Header、LlmConfigModal、SkillsView、App、TokenUsageChart |
| src/api/skills.ts | skills | listSkills、loadSkill、createSkill、updateSkill、deleteSkill(5;aiGenerateSkill 走 /ai/chat 归 ai) | SkillsView |
| src/api/guard.ts | guard+rules+violations+audit+logs | getGuardRules、saveGuardRule(死)、getGuardViolations、clearViolations、getGuardReport(零 UI 消费但测试 :1110 钉)、getAuditLogs、getLogs(死)(7)+normalizeGuard* :2872-3006 | GuardView |
| src/api/extract.ts | extract | extractFromPath、extractFromText(2) | App |
| src/api/evolution.ts | evolution | 10(proposals 6+warnings 4;含 2 个 this. 委托) | EvolutionPanel |
| src/api/fetchData.ts(或并入 index) | 聚合 | fetchData(:3072,并发 /knowledge+/ai/config+/modules/project-info+/daemon/health)+insertAtSearchMark stub | App、CommandPalette;SearchModal |
| **src/api/index.ts** | — | 组装 `export const api = {…spread 各族}`+default+**全部 named re-export**(51 类型+26 函数) | 兼容出口 |

### ③ 消费面

- default `import api`:**26 文件**(App、CommandPalette、ProjectScopePanel、Header、AuditLogPanel(死)、TokenUsageChart、RecipeEditor、LlmConfigModal、SearchModal、EvolutionPanel、SkillsView、MEV、JobsView、KnowledgeGraphView(死)、ContextAwareSearchPanel、KnowledgeView、GuardView、RecipesView、DepGraphView、CandidatesView、useGenerateSocket、useJobProcessEvents 等,find -exec grep 全数)
- named import 6 文件:useJobProcessEvents(**值 normalizeProcessDeveloperView**+2 类型)、JobsView(**值 normalizeJobDisplaySnapshotSummaryRef**+11 类型)、useGenerateSocket(type DaemonJobRecord)、LlmConfigModal(3 类型)、utils/EvidenceStatus·JobProcessEvents·efficiency(各 1-2 类型,layer-contract documented type bridge)、GenerateProgressView(type JobProcessDeveloperView)
- 契约测试 19 处(0e)+AD6 census+docs/declared-effects.md 传输表

### ④ 兼容策略判定(消费点零改 vs 全改直引)

**推荐:保留 api 单对象聚合出口(src/api/index.ts),消费点零改。**
- 成本对比:聚合出口=各族文件导出方法组(如 `export const jobsApi = {…}`),index.ts spread 组装+named re-export,26 个 default 消费文件与 6 个 named 消费文件**一字不改**;契约测试仅改 19 处路径归属。全改直引=26 文件逐个改 import+调用点,且契约测试大量按 `api\.method\(` 形态断言消费文件(如 :614 钉 JobsView `api.getJobProcessArtifact(`、:1569-1572 钉 ProjectScopePanel 4 调用)——直引会连带破更多断言,收益仅"少一层对象",**否**
- fetch/axios 混用点:api.ts 内 fetch×2+EventSource×2 全部位于 **SPM 冻结方法**内(scanTargetStream :3224,3238;scanFolderStream :3334,3348)——**D1 原字节整段搬入 modules.ts,不归一**(归一=改冻结面,判定:与 D4 都不做,census 名单跟着文件走)
- SPM api 方法处置(任务问):**随 modules.ts 族文件整段原字节搬迁**(文件级搬动不改方法名/串/形态,不算重构冻结链内容;保守备选=api.ts 原地留全部 SPM 方法+新 api/ 只装其余族,但那会造成双入口,推荐前者)【决策项①】

### ⑤ 执行步骤

1. 前置:W7-0(0d)+D3(死方法删除后拆分面 98→~80 方法)
2. 建 src/api/ 按 ② 表分族;normalize/类型按"就近其唯一消费族"归族,跨族共用(first* 工具/problem/sse)入 client/problem/sse;index.ts 组装恒等出口(default+named 全集)
3. 契约测试迁移:7 处 `importTranspiled('src/api.ts')`→`'src/api/index.ts'`(test 解析器 :20 已支持 `${joined}/index.ts`,也可直接指 index);12 处 `read('src/api.ts')` 按断言内容归属改指族文件(如 jobs 断言→api/jobs.ts、project-scope 断言→api/projectScope.ts、D21 政策→client.ts)
4. AD6:test:1633 declaredTransportModules→`['src/api/client.ts','src/api/modules.ts','src/lib/socket.ts']`+docs/declared-effects.md 传输表同步(fetch/EventSource 行号引注更新)
5. 验证:0c 全链+主体 `npm run build:dashboard`+浏览器冒烟(仓规:复杂改动需浏览器验证截图)

### ⑥ 风险

- **最大成本=契约测试 19 处断言的归属搬迁**,漏一处即红(可见风险);断言 regex 里含行为级 pin(路由串写法/responseType:'text' 等),搬时不得顺手改内容
- normalize 与类型的族归属有交叉(DaemonJobRecord 被 useGenerateSocket/JobsView/efficiency 消费;JobProcessDeveloperView 横跨 utils/hooks/views)——index.ts named 全集 re-export 兜底,内部族间 import 单向(各族→client/problem/sse,禁族间横向)
- vite manualChunks/主体 build:dashboard/layer-contract area 机制均零联动(0c 已证),残余风险集中在测试与 census 两处纯文本同步

---

## D2 App.tsx 减负(1,315 行)

### ① 现状诊断(壳里装了什么)

| 块 | 行 | 性质 |
|---|---|---|
| ErrorBoundary class | :50-80 | 通用组件,错位在壳 |
| mapExtractedToV3 | :88-135 | 纯映射,SPM/extract 处理器共用 |
| tab 路由+深链 | :143-146,303-311,334-393 | getTabFromPath/navigateToTab/popstate/`?action=search|create` 深链(耦合 createModal/searchAction 状态) |
| 全局数据 | :152-158,396-407 | data/loading/fetchData |
| **SPM 状态+缓存+扫描处理器** | :160-256,569-673,779-854,1027-1069 | **冻结(0a)** |
| projects 控制 | :153-154,418-459 | projectsSnapshot/fetchProjectsSnapshot/handleProjectActionCompleted(仅喂 Header) |
| LLM 配置 | :217-218,461-468 | llmReady/fetchLlmStatus/showLlmConfig(喂 Header+Modal) |
| generate 环编排 | :258-301,675-776 | stopCurrentAiTasks/handleCancelBootstrap/完成通知 effect(:289-301)/handleColdStart/handleRescan——写 SPM 共享扫描状态 |
| extract 三处理器 | :480-566 | 写 setScanResults+跳 'spm'(落点冻结) |
| recipe 编辑+候选操作 | :207-214,313-331,864-1001 | editingRecipe/handleSave*/handleDelete*/handlePromoteToCandidate;isSavingRecipe 与 handleSaveExtracted(SPM 交接面)共享 |
| filteredRecipes | :1004-1024 | 搜索过滤+semanticResults 排序 |
| render | :1078-1312 | tab 九分支(:1124-1250)+4 modal+Sidebar/Header/CommandPalette |

### ② 契约测试对 App.tsx 的 7 处 read 钉(拆分禁区/改税区)

:504 `bootstrap.isAllDone[\s\S]*fetchData()`(完成通知 effect 必须在 App.tsx 文本内);:746-748 布局类名+jobs 分支三元;:786 main 类名;:988-989 buildKnowledgeCreatePayload(extracted, triggers)(handleSaveExtracted 留 App);:1013,1038,1069 chat/wiki/signal 缺席 doesNotMatch;:1083-1093 preservedView 7 组件挂载。→ **bootstrap 完成通知与 handleSaveExtracted 若外拆必须同步改测试**,W7 安全批不动它们

### ③ 目标:useXxx 拆分表(最小安全方案)

| 新 hook/文件 | 搬入 | 行数 | 阻力 |
|---|---|---|---|
| components/Shared/ErrorBoundary.tsx | :50-80 | ~31 | 零(无 pin;components 区内) |
| hooks/useProjectsControl.ts | :153-154,418-429,441-459(fetchProjectsSnapshot/handleProjectActionCompleted;`resetProjectScopedUi` 以回调参数注入,SPM 状态留 App) | ~55 | hooks→api 已允;类型 type-only 豁免 |
| hooks/useLlmStatus.ts | :217-218,461-468 | ~15 | 零 |
| hooks/useTabNavigation.ts(可选) | :143-146,155,303-311,334-336,363-366(activeTab/navigateToTab/popstate;深链 action 解析留 App) | ~45 | **hooks→constants 新运行时边**(validTabs 值)→layer-contract.json:37 回写+叙述段更新【决策项②】 |

留壳(本批不动,登记):generate 环编排+extract 处理器(共享 SPM 扫描状态,拆=动冻结面或引入扫描状态 context=重构);recipe 编辑族(isSavingRecipe 跨 SPM 交接);完成通知 effect+handleSaveExtracted(测试 pin);filteredRecipes(耦合 searchQuery/semanticResults 双链)。**量化:安全批减 ~150-170 行(≈12%),App 降至 ~1,150 行**;进一步减负的前提=契约测试 App pin 解除+扫描状态收拢设计,登记后续批

### ④ 步骤

1. 拆 ErrorBoundary→Shared(App import 补一行)
2. 拆 useProjectsControl/useLlmStatus(Header props 形态不变:aiConfig/llmReady/projectsSnapshot/projectsLoading/onRefreshProjects/onProjectActionCompleted 等 13 props 原样)
3. (决策②过)拆 useTabNavigation+layer-contract.json hooks 行加 "constants"
4. 验证:0c 全链(尤其 test #26 preservedView/#11 布局断言)+浏览器冒烟 tab 切换/项目切换

### ⑤ 风险

- prop-drill 链断点:Header 13 props、MEV 21 props(:1223-1245)、CandidatesView 13 props——本批不改任何子组件 props 形态,只改 App 内部来源;若后续把状态下放到消费组件,MEV 的 21-prop 面属冻结不可动
- popstate/pushState 双写点(navigateToTab :310 与 openRecipeEdit :319/closeRecipeEdit :324 各自 pushState/replaceState)拆散后易漏——useTabNavigation 只收编 navigateToTab 族,recipe URL 同步留在 recipe 族内,边界记录在 hook 头注

---

## D3 死区清算(SPM 链除外;每项删除三件套=扫描/替代/测试)

### ③-1 KnowledgeGraphView 死链(整链删除)

- **零消费实证**:`KnowledgeGraphView` 全 src 唯一命中=自身文件;App.tsx tab 九分支(:1124-1250)无挂载;validTabs 无对应 id;Sidebar/CommandPalette 注册表无入口;契约测试零 pin;sidebar.knowledgeGraph i18n 键在死键名单(入口早已摘除)
- 链上资产:view 1,003 行+**专属 api 方法 4**(getKnowledgeGraph :3720、getGraphStats :3726、discoverRelations :3732、getDiscoverRelationsStatus :3739——消费=仅 KGV,api/recipes.ts 族随之不建)+**GraphEdge 类型**(api.ts:2723,DepGraphView 用的是自定义 DepGraphEdge :22 非此)+**i18n 79 键×2 locale**(knowledgeGraph 24 真死+39 仅 KGV 引用+knowledgeGraphRelations 16 真死)
- 替代:无需(后端 /search/graph、/recipes/discover-relations 路由不动,别的宿主仍可用)
- 测试:typecheck+build+契约套件(零 KGV pin)+lint 全链

### ③-2 Panels/AuditLogPanel 重复实现(目录级删除)

- Panels/ 目录唯一文件=AuditLogPanel.tsx(187 行);**零消费实证**:`AuditLogPanel` 全 src 唯一命中=自身
- **重复对象**:GuardView 内嵌 audit tab(GuardView.tsx:49-51 GuardTab='audit'、:505-530 同样调 api.getAuditLogs 分页渲染)=活实现;AuditLogPanel 是其早期独立版(同 api.getAuditLogs :63,90)
- 删除后 layer-contract areas 无感(Panels 不是 area——components 子目录);方案 §2.2 "Panels 目录删(死)" 原文兑现

### ③-3 api 死方法(实扫 16 个,全部零消费+零契约 pin;任务背景"7 个"为旧诊断口径,以本实扫为准)

| 方法(:行) | 证据补充 |
|---|---|
| getJob(:3441) | JobsView 只用 listJobs/display-snapshot/events/artifact/cancel/enqueue |
| getProjectInfo(:3543) | fetchData :3076 直调 http,不经此方法 |
| saveRecipe(:3595,70 行) | 连带 parseFrontmatter(:2231,~120 行)唯一消费者——**链亡** |
| getRecipeByName(:3671) | — |
| getCandidate(:3701) | — |
| getAiProvidersEnhanced(:3778) | 与 getAiProviders 同路由,增强版零消费 |
| setAiConfig(:3792) | Header 走 saveLlmEnvConfig |
| summarizeCode(:3800)、translate(:3805) | 契约测试 "translate" 命中均为测试助手 `translated:` 前缀,非 pin |
| saveGuardRule(:3887) | GuardView 只读 rules |
| knowledgeGet(:4050) | — |
| knowledgeRecordUsage(:4097)、knowledgeUpdateQuality(:4102) | 后者与活方法 setRecipeAuthority 同端点 PATCH /knowledge/:id/quality 重复 |
| getLogs(:4149) | /logs 族 Dashboard 全零消费 |
| getProposalStats(:4218)、getWarningStats(:4261) | EvolutionPanel 未用 stats 端点 |
| +死模块级函数 `_consumeSSE`(:3007-3068,零调用) | — |

**不删的零消费方法**(逐个有主):getCurrentProjectSnapshot(契约测试 :325 钉)、getGuardReport(:1110 钉)、getProposals/getWarnings(this. 委托被活方法调 :4214,4257)、getLang/setLang(:4110,4116——**D4 复活为 i18n/index.tsx 的收敛落点,先于 D3 判定,勿删**)、getTargetFiles/scanTarget/scanFolderStream(**SPM 冻结,0a**)、insertAtSearchMark(stub 但 SearchModal 活消费,登记为 stub 债)

### ③-4 死 i18n key(zh/en 键集完全对称 1,766=1,766,0 差异;扫描口径=全 src+scripts 字面全文检索,拼接族白名单 0b 七族)

| 类别 | 数量(每 locale) | 处置 |
|---|---|---|
| **真死可删** | **326**(=474 真死 −91 SPM 冻结 −57 W7-0 复活) | 删。大族:candidates 50、guard 37、knowledge 34、recipes 28、knowledgeGraph 24+knowledgeGraphRelations 16(随 ③-1)、generate 真死 46(pipelineSteps 5/taskStatus 5/stats 5/notifications 4/**pipelineDescs 25(零消费含模板,实证)**/retryFailed/viewDetails)、skills 19、depGraph 15、common 14、sidebar 11(含 sidebar.knowledgeGraph/depGraph)、search 10、constants.bootstrapDims 10(整段 :1828-1841 零引)、header 7、app.recipe.deleteFailed、其余 8 |
| KGV 链死 | +39(knowledgeGraph.*) | 随 ③-1 删 |
| W7-0 复活(勿删) | 57 | generate.dimLabels 26+pipelineLabels 25+reviewRounds 6(0d-3 修复后被消费;pipelineLabels 为后端 dimId 键控族) |
| SPM 冻结(登记不删) | 91 | scanResult 32+spmCompare 32+moduleExplorer 23+scanResultCard 1+app.scan.noCode/app.fullScan.timeoutTitle/app.fullScan.scanError 3 |
| 键控族(证据不足不删) | — | guardRuleMessages 37/guardRuleFixSuggestions 8 名义"死"实为后端 ruleId 键控(白名单),删除需后端规则 id 值域扫描,登记 |

- 测试:契约套件 zh/en 各 9 处 read+具名 key 断言全部命中"活键"(死键零 pin,删除即安全);删后跑 0c 全链+切 en/zh 浏览器冒烟

### ③-5 generated 契约表(src/generated/api-types.ts 2,402 行)——**判定:留**

- 消费实证:22 个导出中 13 个被消费(api.ts:12-13 值 DASHBOARD_FAILURE_KINDS+2 类型;types.ts:645-659 桥接 10 个 Knowledge*Wire/Kind/Lifecycle);零消费 9 个=DASHBOARD_FAILURE_TAXONOMY/DASHBOARD_JOB_KINDS/DASHBOARD_API_CONTRACT_VERSION/DASHBOARD_API_RESPONSE_SCHEMAS/DASHBOARD_API_ROUTES 等(占文件大半体积,即"大半零运行时消费"的实体)
- 留的理由:①该文件是主体 canonical 的 sha256-pin 逐字拷贝,drift 门禁(check-generated-api-types.mjs:35-50)双向锁死,README 明禁手改;②vite 构建 tree-shaking 使未消费 const 不进产物,运行时零成本;③瘦身正确路径=改主体生成器(Alembic scripts/generate-dashboard-types --write)输出面——**跨仓需求,登记给 W8/主体窗口,不在 W7**

---

## D4 双通道收敛(useAuth/usePermission/i18n 接共享 http)

### ① 锚点与改法

| 散点 | 现状 | 改法 |
|---|---|---|
| useAuth.ts | :12 `import axios`;:53 `axios.post('/api/v1/auth/login')`;:88 `axios.get('/api/v1/auth/me',{headers:Bearer})` | api/ai… 否——新增 auth 族:api.authLogin/authMe(显式传 headers 参数,**不给共享 http 加拦截器**——那是行为变更,行为恒等原则) |
| usePermission.ts | :15 `import axios`;:104 `axios.get('/api/v1/auth/probe',{headers})` | api.authProbe |
| i18n/index.tsx | :69,76,93 三处裸 `fetch('/api/v1/ai/lang')` | 改调 api.getLang/setLang(:4110,4116 现成死方法**复活**,D3 已豁免) |

- 事实边界(不扩权):后端仅有 /auth/probe(HttpServer.ts:267 内联);/auth/login、/auth/me 后端零实现+VITE_AUTH_ENABLED 默认关→该两方法当前不可达。收敛=纯搬运不修语义;"login/me 是否幻影端点"登记为观察,处置权在原需求
- i18n 特殊性:layer-contract `i18n→[]`(:39)——i18n 运行时引 api 会造成 **i18n→api 新边+api←→i18n 无环性检查**(api 不引 i18n,单向,合法但需矩阵回写)。保守备选:i18n 三处 fetch 保持,census 只收敛 auth 两行【决策项③,推荐全收敛】

### ② 联动(ratchet 显式解除)

- dashboard-contract.test.mjs:1638 knownStrayFindings 删对应行(全收敛后该数组删空或剩 []);census walk 会自动确认 axios/fetch 从 hooks/i18n 消失
- docs/declared-effects.md:"Known stray transport sites" 表 3 行删除+GET/POST 计数段落更新(新增 authLogin/authMe/authProbe 计数)
- 判定:**独立小批(W7-c),先于 D1**——D1 拆分时 auth 族直接落 api/auth.ts,一次到位;fetch/EventSource 混用点(SPM 冻结方法内)本批不动(0a/D1④)

### ③ 风险

- Authorization 头传递形态改变会破登录态:authMe/authProbe 保持"调用处显式组 headers 传入"签名,禁在 client.ts 加全局拦截器(现无,加=所有请求带 token 的行为变更)
- i18n 首屏语言拉取时序(Provider useEffect 内 fetch)改经 api 后仍是同一时机;api/index 循环依赖检查(i18n→api→…→i18n 必须为空)

---

## D5 W3-D8 承载:GenerateSession→GenerateSessionView(第五重同名收敛)

- 现状:`interface GenerateSession`(useGenerateSocket.ts:69-93)——与主体/Agent 侧同名词第五处;纯 Dashboard 内部 TS 符号,零 wire(socket 事件 payload 无此名)
- 消费面(全集 2 文件):useGenerateSocket.ts 内部 :97,107,115,144,359,371;GenerateProgressView.tsx:17 `import type { GenerateSession, GenerateTask, ReviewState }`+:514 prop 类型。App.tsx 经 hook 返回值推断,零字面引用;契约测试零 pin(grep 实证)
- 步骤:两文件改名 GenerateSessionView(连带 `initFromApiResponse(sessionData: GenerateSession)` 签名);同批顺手项【决策项④】:`UseBootstrapSocketReturn`(:95)与 GenerateProgressView 内 `BootstrapProcessSummary`(:370)/`getBootstrapProcessEventTone`(:478)三个 stale bootstrap 词根符号——后两者被契约测试 :644-649 按名 pin,改名须同步测试 regex;推荐仅 UseBootstrapSocketReturn→UseGenerateSocketReturn(零 pin),其余登记词族尾单
- 验证:typecheck+test(契约 #11/#12 改后路径)

---

## D6 views 与 tab 对齐(评估级)

### ① tab 注册表(4 处注册点)与文件名偏差表

注册点:constants/index.ts:55(validTabs,wire)、App.tsx:1124-1250(switch→组件)、Sidebar.tsx:78-89(9 项)、CommandPalette.tsx:10-33(TAB_ICON_MAP/TAB_LABEL_MAP)

| tab id(wire) | 挂载组件 | 文件名对齐 | 判定 |
|---|---|---|---|
| recipes | RecipesView | ✅ | — |
| spm | ModuleExplorerView | ❌ | **冻结,不改**(0a) |
| candidates | CandidatesView | ✅ | — |
| knowledge | KnowledgeView | ✅ | — |
| guard | GuardView | ✅ | — |
| project-pyramid | DepGraphView | ❌ | 可改名 ProjectPyramidView.tsx:成本=git mv+App.tsx:39,1139 两处+零测试 pin(实证);连带 depGraph i18n 命名空间(活键仍叫 depGraph.*)与 sidebar.projectPyramid 标签的词根不齐——改名只动文件不动 i18n 键(键非 wire 但 45 处活引用,词族批处理) |
| skills/jobs/help | 同名 View | ✅ | — |

非 tab 视图(不在对齐范围):GenerateProgressView(candidates 内嵌)、LoginView(auth 门)、EvolutionPanel(RecipesView 内嵌抽屉)、ContextAwareSearchPanel/ScanResultCard(SPM 子件,冻结)、KnowledgeGraphView(D3 删)

### ② 目录级 `components/Views/`→`src/views/` 搬迁成本(方案原文方向)

- 契约测试 12+ 处 `read('src/components/Views/…')` 路径 pin+2 处缺席断言(AiChatView/WikiView 路径也要跟);layer-contract:src/views 成为**新顶级 area**,areas 数组+allowedRuntimeImports 矩阵(App→views、views→…)+layerRationale 叙述全面回写;lint-naming scope 'src/components' 规则不覆盖新目录(namePattern 由 src 兜底,兼容)
- **判定:登记不做**。收益=纯路径语义;成本=测试+契约矩阵双面回写且与 D1(api 拆分的测试迁移)叠加在同一个测试文件上,冲突面大。本批仅做 DepGraphView→ProjectPyramidView 单文件微批(或与 D5 并批)【决策项⑤】

---

## 执行顺序推荐(先小后大,每批独立 commit 可回退)

| 批 | 内容 | 规模 | 前置 | 验证 |
|---|---|---|---|---|
| **W7-0** | 基线三红修复(0d):契约测试 4 红(2 路径+2 regex 组)+api-types 再同步(stagingDeadline+sha256 pin)+stale i18n 消费修(CandidatesView.tsx:29-54、GenerateProgressView.tsx:155,267-269) | 小 | 无 | `npm run check` **首次全绿基线确立**+浏览器验证候选页维度标签/审查轮标签恢复中文 |
| **W7-a** | D3 结构死区:KGV 链(view+4 api 方法+GraphEdge+79 键×2)+Panels/AuditLogPanel 目录+死方法 16+_consumeSSE+parseFrontmatter | 中(-~1,900 行) | W7-0 | 0c 全链+契约套件 |
| **W7-b** | D3 死 i18n:326 键×2 locale(SPM 91+复活 57 除外;键控族在白名单不入死单) | 中(-~730 行) | W7-0(复活名单确定) | 0c+en/zh 切换冒烟 |
| **W7-c** | D4 双通道:auth 3 方法+lang 2 复活+census/declared-effects 回写 | 小 | W7-0;决策③ | 0c+AD6 census 测试+登录态冒烟(VITE_AUTH_ENABLED=true dev) |
| **W7-d** | D5 改名(GenerateSession→GenerateSessionView+UseGenerateSocketReturn)+D6 微批(DepGraphView→ProjectPyramidView,决策⑤过) | 微 | W7-0 | typecheck+test |
| **W7-e** | D2 App 减负安全批:ErrorBoundary+useProjectsControl+useLlmStatus(+决策② useTabNavigation+layer-contract 回写) | 小中 | 无硬前置 | 0c+tab/项目切换冒烟 |
| **W7-f** | D1 api/ 拆分(最大批):16 族文件+index 恒等出口+契约测试 19 处迁移+AD6 census/declared-effects | 大 | W7-a(拆分面已减)、W7-c(auth/lang 已就位) | 0c 全链+主体 `npm run build:dashboard`+全页冒烟截图 |
| 登记 | D6 目录搬迁、generated 生成器瘦身(跨仓)、App 深拆(测试 pin 解除+扫描状态收拢设计)、insertAtSearchMark stub 债、/auth/login 幻影端点观察、Bootstrap* 组件词根尾单、SPM 冻结面死键 88+键控族白名单 | — | — | — |

顺序理由:W7-0 不先行则"测试全绿"信号不存在(基线即 4 红+drift 红);D3 在 D1 前使拆分面缩小且 KGV 删除让 recipes 族文件整个免建;D4 在 D1 前让 auth 族一次落位;D1 契约测试迁移量最大放最后单独承压;每批只碰一个关切,SPM 冻结面(0a)全程零交集自查

**用户决策项汇总**:①SPM api 方法随 modules.ts 整段原字节搬(推荐)vs api.ts 原地留双入口;②useTabNavigation 拆分+layer-contract `hooks→constants` 新边(推荐做);③i18n /ai/lang 三处 fetch 全收敛(推荐,需 layer-contract `i18n→api` 新边)vs 仅收敛 auth 两文件;④D5 顺手改名范围(推荐仅 +UseGenerateSocketReturn;BootstrapProcessSummary/getBootstrapProcessEventTone 有测试 pin,登记);⑤DepGraphView→ProjectPyramidView 微批本批做 vs 登记;⑥D1 族文件命名用后端路由族名(推荐,证据锚 HttpServer.ts mount 前缀)vs 方案示例的四环名(plan/generate/curate/sustain——Dashboard 无 plan 面,modules 族横跨 SPM 冻结段与 generate 环,环名会造成冻结段异族混装)。

## 统计

| 子项 | 判定 | 涉源(行) | 消费面联动 | wire/门禁变更 |
|---|---|---|---|---|
| W7-0 基线修复 | **前置必做** | 测试 1+generated 2+src 2 文件 | 用户可见 bug 修复 | 0(追平 S4 现实) |
| D1 api 拆分 | 动(W7-f,最大批) | api.ts 4,278→16 族+index | 26+6 消费文件**零改**;契约测试 19 处迁移 | AD6 census 名单+declared-effects.md;HTTP 串/方法名全冻结 |
| D2 App 减负 | 动·安全批(W7-e) | App 1,315→~1,150 | Header/子组件 props 零改 | 决策②过:layer-contract +1 边 |
| D3 死区 | 动(W7-a/b) | -KGV 链 ~1,200 行-AuditLogPanel 187-死方法 ~450 行(含 parseFrontmatter/_consumeSSE)-i18n ~730 行 | 全部零消费实证+零测试 pin | 0 |
| D4 双通道 | 动(W7-c) | 3 文件+api 5 方法 | census ratchet 显式解除 3 行 | declared-effects.md;决策③过:layer-contract i18n 行 |
| D5 改名 | 动·微批(W7-d) | 2 文件 | 0 | 0 |
| D6 views 对齐 | **评估=登记为主**(微批仅 DepGraphView) | 1 文件(决策⑤) | 测试 pin 密度=不搬目录的主证据 | 0 |
| SPM 冻结面 | **全程绕行** | 3 View+8 api 方法+App ~500 行+88 死键 | 与每批改动面零交集自查(0a 清单) | — |

外部消费总账:Dashboard 是零包依赖消费端(space-boundary 自证);唯一跨仓面=①generated 契约表(主体 canonical 单源,pin 门禁)②主体 build:dashboard(仅依赖 `build` 脚本名+dist 产物,零内部路径)③HTTP/Socket wire 串(0b 冻结)。
