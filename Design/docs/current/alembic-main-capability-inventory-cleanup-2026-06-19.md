# Alembic 主体功能与代码逻辑全量测绘（净化准备）

Status: Design 草案（2026-06-19）/ 全量测绘 + 清理候选识别 / **清理范围待用户逐项确认**（类比 Plugin 净化需求流程）/ 待控制器 intake
Date: 2026-06-19
Design Key: alembic-main-capability-inventory-cleanup-2026-06-19
Primary Windows: Alembic（主体测绘 + 净化）；AlembicCore / AlembicDashboard（observing，边界对照）

## 背景与定位

用户要做"类似 AlembicPlugin 的清理"，先要主体的**全部功能与代码逻辑清单**。本文档先做全量测绘 +
清理候选识别；具体删除范围按 Plugin 模式后续逐项确认，不在本稿擅自定稿删除。

**与 Plugin 净化的性质区别（关键）**：Plugin 净化 = 删完整 daemon（非必要胶水）退化纯 MCP。**主体相反**——
`AGENTS.md` 最高停止卡明确：**CLI / daemon / HTTP-API / Dashboard server / ProjectRegistry / file monitor /
JobStore / 内部 AI jobs / platform / sandbox / injection / native·IDE / release** 都是主体本职、**不得迁走/
删除/空壳化**。故主体净化 = **保留能力边界内**的死代码 / 无消费 / 空壳占位 / 已退役 / 新旧并存清理，**非能力删除**。

测绘altitude：模块/能力 + 关键代码逻辑 + 入口·消费方 + Core 边界 + 清理旗标（非逐函数）。规模：`alembic-ai`，
lib/ ~63k LOC、16 模块、3 入口（cli/api-server/daemon-server）、自带 daemon+http（44 文件）、dashboard、
vendor 内嵌 Core+Dashboard。git log 见在途清理（CCR-ALMB：retire coverage/compliance、删 DecisionRegisterStore 等）。

## 真实代码锚点（doctrine + 已核实）

- **主体定位（AGENTS.md）**：本地完整能力主仓库；消费 `@alembic/core`（不空壳 wrap）+ `@alembic/agent`
  contract（不重载 Agent runtime）；服务 Dashboard 构建/后端（前端源码在 AlembicDashboard 仓）；Codex
  MCP/Skill/marketplace 属 AlembicPlugin、不在主体。
- **Core 接入**：`@alembic/core: file:../AlembicCore`（本地）；`vendor/AlembicCore` 仅 fallback/release snapshot；
  禁止绕过包入口直接引 `src/**`。
- **路径别名**：`#shared/#infra/#service/#inject/#governance/#platform/#types/#http/#workflows/#tools/#sandbox`。
- **共享资产漂移门禁**（Alembic ↔ AlembicPlugin）：`config/shared-asset-manifest.json` + `check-shared-asset-drift.mjs`；
  工具契约段是有意分叉（main: alembic_guard/alembic_knowledge_lifecycle/alembic_bootstrap；plugin: alembic_code_guard 等）。
- 边界 lint：`lint:core-import-boundary`/`lint:repo-boundary`/`lint:layer-contract`/`lint:doctrine`/`lint:agent-extraction-boundary`/`lint:naming`。

## 全量功能与代码逻辑清单

### A. 入口与对外服务表面

**3 入口**：`bin/cli.ts`（CLI / Commander）｜`bin/api-server.ts`（Express HTTP，开发）｜`bin/daemon-server.ts`
（生产常驻：HTTP + job runner + file monitor）。环境标志 `ALEMBIC_API_SERVER` / `ALEMBIC_DAEMON_MODE`。

**`lib/cli/`（3 文件）+ bin/cli.ts**：CLI 命令树——`start`（启动/切项目 runtime+daemon+Dashboard）、`setup`、
`ai`(status/configure/import-env)、`daemon`(start/status/stop)、`projects`(list/status/current/inspect/select/
start/stop/switch/open-dashboard/clear)、`project-scope`(add/list/resolve)、`remote`、`coldstart`、`rescan`、
`evolve-check`、`ais`、`search`、`guard`/`guard:ci`、`status`/`health`。`SetupService`/`AiScanService`/`CliLogger`。

**`lib/daemon/`（10 文件 5.4k LOC）**：`DaemonSupervisor`(启停/健康/pid)、`DaemonJobRunner`(后台 job:
bootstrap/rescan/coldstart)、`ProjectRuntimeControl`(多项目 runtime state: selected/active/connection)、
`ProjectRuntimeSourceOfTruth`、`RuntimeBoundary`(daemon↔host 隔离)、`FileMonitorStatus`、`JobDisplaySnapshotStore`、
`JobProcessEventRecorder`/`JobProcessEventArtifacts`、`PcvObservabilityLinkage`。与 `@alembic/core/daemon`：Core 出
DaemonState/序列化/health 契约，主体出 HTTP 控制+多项目+UI 集成。

**`lib/http/`（44 文件 13k LOC）= daemon HTTP/socket API + Dashboard 后端**：
- 核心：`HttpServer.ts`(691 行，9 层 middleware: perf/helmet/logger/lifecycle/body/cors/sourceResolver/gateway/timeout)。
- 路由（/api/v1）：health、daemon、jobs、projects、project-scope、**auth(已退役 410)**、monitoring(dev)、guard、
  guardRules、task(prime/create/close/fail/record)、intent-episodes、search(+semantic/graph-impact)、ai(chat/
  summarize/translate/providers)、extract、commands、skills、candidates、modules、knowledge(6 态生命周期)、recipes、
  wiki、file-changes(→ReactiveEvolutionReport)、evolution(proposals/warnings)、violations、audit、logs、signals、panorama。
- middleware：errorHandler/gatewayMiddleware/requestLogger/sourceResolver/validate；`problem-taxonomy`。
- 实时：`RealtimeService`(socket.io)、SSE(sse-sessions/sse)。Dashboard handoff：daemon → `ProjectRuntimeHandoff`(apiBaseUrl/dashboardUrl/projectId)。

### B. 服务核心 `lib/service/`（33 文件 16.6k LOC，12 子目录）

- **signal/** `HitRecorder`(231 行)：高频事件 buffer+30s flush+SignalBus 发射（guardHit/searchHit/view/adoption/
  application）。**⚠ 未见明确消费方/Query 侧**（与 Plugin HitRecorder 同症）。
- **cleanup/** `CleanupService`(837 行)：fullReset(垃圾桶 `.asd/.trash`)/rescanClean(保留 Recipe)/forceRescanClean；
  DB 快照 JSONL；FK 顺序删除。消费：ColdStart/KnowledgeRescan workflow（明确）。
- **evolution/** `FileChangeHandler`(500 行，文件改→proposal+quality signal)、`DaemonFileChangeCollector`(721 行，
  native watcher + git fallback)。消费：HTTP `/evolution/file-changed` → `FileChangeDispatcher`。⚠ `ReactiveEvolutionService` 别名(483)疑未用。
- **task/** 意图链：`IntentExtractor`(352 行，查询扩展/多查询，**与 Plugin 同源**)、`TaskDispatchService`(767 行，
  MCP handler: prime/create/close/fail/record + intent state + episode)、`IntentEpisodeStore`、`HostIntentContext`、
  `IntentSearchPlan`、`PrimeSearchPipeline`、`PrimeInjectionPackage`。⚠ `IntentEpisodeStore` 消费去向不明。
- **wiki/** `WikiGenerator`(1107 行 10 阶段)+Renderers/Utils/Types。消费：HTTP `/wiki` + CLI scan。⚠ `WikiUtils` BUILD_SYSTEM_MARKERS 废弃别名。
- **skills/** `SkillFileService`(737 行 CRUD)+SkillHooks。消费：HTTP `/skills` + resident tool。
- **module/** `ModuleService`：ProjectContext repo facts 统一接口（多语言）。消费：HTTP/Wiki/DI。
- **vector/** `ContextualEnricher`(chunk 上下文前缀+缓存)、`RecipeRegionFixtureGeneration`(测试)。消费：VectorModule。
- **bootstrap/** `BootstrapTaskManager`(任务生命周期 skeleton→filling→done)+EventEmitter/Efficiency/Refine/UiStartupTasks。消费：daemon bootstrap 编排。
- **handler-runtime/** `envelope`/`problem`/`types`(McpContext/IntentState/DecisionRecord)。MCP 基础设施。
- **search/** `CrossEncoderReranker`：重排序。消费：HybridRetriever（**待核实**，Plugin memory 曾列其为死代码）。
- 顶层 `FileChangeDispatcher`：pub-sub 分发 file-change 给订阅者。

### C. 编排流 `lib/workflows/`（27 文件 11k LOC）+ 工具表面 `lib/tools/`（21 文件）

**5 编排流**：
- **cold-start** `ColdStartWorkflow`(90)：清理→ProjectContext(文件/AST/SPM/Guard/维度)→AI 维度异步填充（启 AI）。
- **knowledge-rescan** `KnowledgeRescanWorkflow`(165)：清理策略→SourceRef 恢复→ProjectContext 增量→Recipe 一致性→
  Evolution 审计→gap 维度→异步填充（仅 gap 启 AI）。
- **ai-execution** `AiDimensionPipeline`(18)：prepare→runtime init→session run(AgentService 并发+TierScheduler)→finalize；产出 Candidate/Skill/PCV。**主体的 AI 执行核心**（Plugin 侧不启 AI）。
- **skill-delivery** `SkillCompletionCapability`(80)：质检→构建→写 `Alembic/skills/`→receipt（不启 AI）。⚠ `regenerateEditorIndex` 占位空壳。
- **completion** `CompletionFinalizer`(26)：`refreshPanorama`(**确认空壳**："ProjectContext is authoritative")、`generateWiki`(实)、`consolidateSemanticMemory`(实)。⚠ deliveryMode 'run' 分支打印 "Project delivery retired"=死分支。
- 辅助：`project-context/ProjectContextWorkflowFacts`、`agent-project-context/`（⚠ **空目录**，可删）。

**工具表面（两套并行，非重复）**：
- **V2 内核工具** `lib/tools/v2/ToolContextFactory`：Agent 执行期用（代码搜索/知识检索/增强），`V2CapabilityCatalog`/`V2ToolRouterAdapter`(from core/agent)。
- **宿主 adapter** `lib/tools/adapters/`：SkillAdapter / TerminalAdapter(+terminal-adapter/ 9 文件，含 PTY/sandbox)/ DashboardOperationAdapter / MacSystemAdapter / WorkflowAdapter；经 LightweightRouter+UnifiedToolCatalog 路由。
- ⚠ 两套并行系统（V2 内核 vs 宿主 adapter）——非重复，但未来统一是清理点（低优先级）。

### D. 支撑层 + vendor

- **injection/**（12 文件）`ServiceContainer`(单例容器,aiDependent 热重载,跨进程 CacheCoordinator)+`ServiceMap`(100+ 类型)+9 模块：Infra/App/Signal/Knowledge/Vector/Guard/Agent/Ai/**Panorama(⚠ 近空 371B,无 register)**。
- **infrastructure/**（13 文件）：audit(AuditLogger/AuditStore→EventBus)、cache(**CacheCoordinator 活**;CacheService/GraphCache/UnifiedCacheAdapter ⚠ 内存↔Redis 中间态)、monitoring(⚠ ErrorTracker/PerformanceMonitor 未注册 singleton、低频)、config(⚠ AppConfigLoader 7 行过封装)、database(SqliteDatabaseAccess)、rate-limit、realtime。
- **governance/**（2 文件）`Gateway`+`GatewayActionRegistry`(40+ actions: candidate/recipe/guard_rule/search)。**⚠ 与 Plugin 相反：主体 Gateway 是活路径**（所有 HTTP 经 gatewayMiddleware `req.gw` → Gateway.execute → 审计），**保留**。
- **project-scope/**（ProjectScopeRegistry/Analysis）、**project-context/**（ProjectContextConsumerFacts）。
- **sandbox/**（7 文件）：macOS Seatbelt 沙箱执行（SandboxExecutor/Policy/Environment/NetworkProxy/SeatbeltProfileBuilder/Probe/ViolationParser）。消费：TerminalAdapter。**保留**（宿主能力）。
- **repository/** `AuditRepository`：**唯一主体 raw-db 访问点**（其余走 @alembic/core/repositories bundle）。
- **shared/**（package-assets/search-filters/semantic-taxonomy/shutdown/schemas）、**platform/** `OpenBrowser`、**types/**（d.ts）、**generated/** `dashboard-api-types.ts`(2534 行**自动生成**，漂移门禁 DashboardApiTypesDrift.test)。
- **vendor/**：`AlembicCore`（release snapshot/外部 fallback，非主开发路径，权威 `../AlembicCore`）、`AlembicDashboard`（前端源码权威在 AlembicDashboard 仓，主体仅托管 `dashboard/dist` 构建产物）。

## 清理候选（全部待用户逐项确认，非本稿决策）

**① 已退役（低风险，确认无消费后直删）**：HTTP `auth/*`（410 tombstone）、`search/context-aware`（已注释退役）。

**② 空壳/占位**：`CompletionFinalizer.refreshPanorama`（确认空壳）、deliveryMode 'run' 死分支（"delivery retired"）、
`SkillCompletionCapability.regenerateEditorIndex`、`PanoramaModule`（近空无 register）、`AppConfigLoader`（过封装）、
`agent-project-context/`（空目录）。

**③ 无消费/疑似死 —— 已核实分流（2026-06-19 grep）**：
- **确认死、删**：`search/CrossEncoderReranker`（`KnowledgeModule` 配为 `crossEncoderReranker: null`、未启用）；
  `evolution/ReactiveEvolutionService` 未用别名；`WikiUtils.BUILD_SYSTEM_MARKERS` @deprecated 别名（PDR-1 grep 复核无引用后删）。
- **`infrastructure/monitoring`（ErrorTracker/PerformanceMonitor）→ 删（用户决定全删，能力删除）**：是活的 dev 监控
  能力——`HttpServer`(initErrorTracker/Monitor + 中间件 perf timer) + `/api/v1/monitoring` 路由 8+ 处消费。**非死代码**，
  属 dev-capability 删除。解耦面：删 `/monitoring` 路由 + HttpServer 的 init/`errorTracker` 字段/中间件 perf 段 +
  getErrorTracker/getPerformanceMonitor 调用点；确认 dashboard 无 /monitoring 依赖。
- **`KnowledgeSyncService` → 保留**：活的 Core 服务（SetupService/InfraModule/UiStartupTasks 用、from `@alembic/core/knowledge`）。
- （`HitRecorder` / `IntentEpisodeStore` 已并入 ⑤ task 链决策删。）

**④ 新旧并存 / 中间态 —— 已决（2026-06-19）**：
- V2 工具 vs 宿主 adapter：**暂不处理**（本轮不纳入，可能另案）。
- cache：**保留**——`UnifiedCacheAdapter` 硬编码 `mode='memory'`、**无 Redis 实现**（Redis 仅保留参数/注释）；主体本地单机、
  Redis 用不上；CacheService/GraphCache/CacheCoordinator 是功能性本地性能缓存（HTTP/查找缓存 + 项目图缓存 + 跨进程失效），
  **保留**。唯一"Redis 残留"= 未用保留参数+注释，可顺手清（trivial）。

**⑤ 与 Plugin 镜像项 —— 已决（2026-06-19 用户 + 连通核实）**：
- **`task/intent` 意图链 → 删（能力退役）**：删 `alembic_task` MCP 工具 + `/api/v1/task` + `/api/v1/intent-episodes`
  + `lib/service/task/` 全部（IntentExtractor/TaskDispatchService/IntentSearchPlan/PrimeSearchPipeline/
  PrimeInjectionPackage/IntentEpisodeStore/HostIntentContext/IntentEvidence）。
  **连通核实**：`PrimeSearchPipeline` 仅 task `_prime` 用、`/search` 独立用 SearchEngine **不复用它**（与 Plugin 不同，
  无检索主路径耦合，可直接删）；Plugin resident 已停止消费 `/task`+`/intent-episodes`（定义无调用），对齐。
  **能力提示**：主体无 prime/work/code_guard 替代 → 此为**意图/prime MCP 能力彻底退役**（合理：MCP 表面归 Plugin、
  主体保留 CLI/HTTP/Dashboard）。**解耦面**：mcp-tools.ts(去 TaskInput/alembic_task)、HttpServer(去 2 路由挂载)、
  ServiceMap/InfraModule/AppModule(去 intentEpisodeStore/primeSearchPipeline 注册)、handler-runtime/types
  (去 IntentState/IntentChainRecord/McpContext.intent)、SignalModule(去 `subscribe('intent')` 订阅)。
  **PDR-0 运行时核**：Dashboard/host-agent 是否有运行时 HTTP 调 `/task`·`/intent-episodes`（代码审计未见，运行时待确认）。
- **`signal/HitRecorder` → 删**：其信号消费方正是 `signalBus.subscribe('intent')`（意图链）+ dashboard stats
  （guardHits/searchHits），**与意图链联动**——删意图链后主消费方消失，一并删（清 SignalModule 注册 + intent 订阅 +
  ServiceMap.hitRecorder）。**连带**：`dashboard-api-types` 的 guardHits/searchHits/searchHitsLast30d 失去生产者 →
  同步处理（regen 类型 + dashboard 显示，置 0 或移除）。
- **文件变化监控 → 保留**：`FileChangeHandler`/`DaemonFileChangeCollector`/`FileChangeDispatcher` + `/file-changes`
  + `/evolution` **保留**（主体 daemon 常驻、file monitor 是 AGENTS 保留能力；**不**对齐 Plugin 的 git-commit-only 取向）。
  仅可清 `ReactiveEvolutionService` 未用别名（②类候选，独立）。

**⑥ 边界保护（明确不删，AGENTS.md Stop Card）**：CLI、daemon、HTTP/API、Dashboard server、**governance Gateway(活)**、
ProjectRegistry、ProjectRuntimeControl、file monitor、JobStore、内部 AI 执行(ai-execution)、sandbox、platform、injection、
AI/provider、release/install/dev-link、vendor snapshot 机制。Core 已承接的共享内核不在主体重复，但外层 adapter/transport/UX 保留。

## Core / Agent 边界清理（已核查，2026-06-19）

核查 AlembicCore（19 导出模块：logging/io/database/events/dimensions/knowledge/search/vector/evolution/guard/
project-context/recipe-context/report/memory/repositories/workspace/host-agent-workflows/daemon/shared）与
AlembicAgent（runtime/service/tools-v2/terminal/ai/memory/context/forge/tasks/profiles）职责后交叉主体实现——
**结论：主体与 Core/Agent 边界已干净，无重复删除项、无 Agent 能力需下沉/迁移。**

- **Core 边界（无重复）**：搜索/知识/向量/evolution/guard 内核**权威实现全在 Core**，主体经 DI `import @alembic/core/*`
  消费（KnowledgeModule/VectorModule/GuardModule 实例化的都是 Core 类）、**无本地重复实现**。主体侧 `CrossEncoderReranker`
  (SearchCrossEncoder 契约)、`ContextualEnricher`(VectorChunkEnricher 契约)、`FileChangeHandler`(FileChangeSubscriber)、
  `DaemonFileChangeCollector`(平台文件监听，Core 无)、`WikiGenerator`(视图生成)、`ModuleService`(扫描聚合) 均是**合理
  Core-契约 adapter / 宿主专属，保留**。例外：`CrossEncoderReranker` 在 KnowledgeModule 被 `null` 接线、**从未启用**——
  属"未用可选 adapter"，已列删（删=移除未启用的 AI 重排选项，日后需要可再加）。
- **Agent 边界（抽取已完成）**：`lib/agent`、`lib/tools/{core,catalog,workflow}`、`lib/tools/v2` 内核、terminal 可移植
  契约等**已在历史波次删除**，主体改 import `@alembic/agent/*`；由 `lint:agent-extraction-boundary` +
  `config/agent-extraction-boundary.json` 门禁守护（扫描：production `#agent` imports=0、本地 Agent 文件=0、终端可移植
  重复=0）。主体剩余 `lib/tools/v2/ToolContextFactory`(宿主 DI/sandbox 绑定) + `lib/tools/adapters/*`(Terminal/Dashboard/
  Mac/Skill/Workflow 宿主执行适配) + `lib/workflows/ai-execution/*`(主体维度编排、调 Agent public contract) 均是**合理
  host-owned、保留**。**无误置、无需下沉/迁移、无 Agent 重复待删**。

→ 本维度**不新增删除/迁移项**；Core/Agent 边界净化已由历史 V2/agent 抽取波次完成（与在途 CCR-ALMB 同源），本需求只需
复核门禁仍绿。主体净化范围 = 前述已决删除清单（task 链 / HitRecorder / monitoring / 已退役 / 空壳 / 确认死）。

## 与 Plugin 净化的对照（关键差异）

| 维度 | AlembicPlugin（净化中） | Alembic 主体（本测绘） |
|---|---|---|
| daemon / HTTP | 删（非必要胶水）→ 纯 MCP | **保留**（核心存在理由） |
| 治理 Gateway | 活路径已死 → 删 | **活路径 → 保留** |
| 文件变化监控 | 需常驻 → 删，改 git-commit 进化 | daemon 常驻、AGENTS 保留 file monitor；是否对齐 git-commit 取向待定 |
| 意图链 intake | 整删、prime 直调向量语义 | `alembic_task`/intent-episodes 是否退役待对齐 |
| HitRecorder | 删（无消费） | 同症、待定 |
| Dashboard | 不支持（归主体） | **主体后端 + dist 托管（保留）** |
| 净化性质 | 能力删除（去 daemon） | **保留边界内净化**（死/空壳/退役/新旧并存） |

## 非目标

- 不删/不空壳化 AGENTS.md Stop Card 保留能力（CLI/daemon/HTTP/Dashboard/Gateway 活/ProjectRegistry/JobStore/sandbox/
  platform/injection/AI/release）。
- 不把宿主行为迁入 Core；不在主体重建 Codex 插件发布壳（属 AlembicPlugin）；不在主体新增 Dashboard 前端源码（属 AlembicDashboard）。
- 不绕过 `@alembic/core` 包入口；不动 vendor snapshot 机制本身。
- 本稿不擅自定稿任何删除——清理范围逐项用户确认（类比 Plugin）。

## 确认点

**已决（2026-06-19 用户）**：
- **删**：task/intent 意图链 + alembic_task + /task + /intent-episodes（能力退役，见 ⑤）；HitRecorder（与意图链联动，见 ⑤）；
  已退役（auth 410 / search context-aware）；空壳（refreshPanorama / PanoramaModule / AppConfigLoader /
  agent-project-context 空目录 / delivery-retired 死分支 / regenerateEditorIndex）；确认死项（CrossEncoderReranker null /
  ReactiveEvolutionService 别名 / BUILD_SYSTEM_MARKERS 别名）。
- **删（追加）**：`infrastructure/monitoring`（ErrorTracker/PerformanceMonitor + `/monitoring` 路由，dev 监控能力删除）。
- **保留**：文件变化监控；cache（无 Redis 实现、本地性能缓存）；`KnowledgeSyncService`（活 Core 服务）。
- **暂不处理**：V2 工具 vs 宿主 adapter。

**已核查（本轮）：Core / Agent 边界已清** —— 无重复删除项、无 Agent 能力需下沉/迁移（Core 内核全经 DI 消费、无本地重复；
Agent 抽取已由历史波次完成且 `lint:agent-extraction-boundary` 门禁守护）。详见《Core / Agent 边界清理》节。

**待确认（仍开放）**：
1. **task 删除运行时核（PDR-0）**：Dashboard/host-agent 是否实际调 `/task`·`/intent-episodes`（代码未见）；HitRecorder 删后
   dashboard `guardHits/searchHits/searchHitsLast30d` 字段处置（移除 vs 置 0）。
2. **清理边界/排序**：上述删除项 + task 链 + Core/Agent 边界项按"先解耦再删"排 PDR 阶段（CCR-ALMB 在途清理先复核终态避免重叠）。

## 分阶段净化方案（MC-0~4）

原则（同 Plugin）：**耦合项先解耦拆分、验证活路径不断、再删**；孤立死代码直删；**保留能力边界（AGENTS Stop Card）不碰**。

### MC-0 盘点 + 前置核验（不改码）
- **CCR-ALMB 在途清理复核（硬前置）**：git log/分支查 CCR-ALMB 终态（已删 DecisionRegisterStore、retire coverage/
  compliance 等），确认本需求删除项与其无重叠/冲突。
- **运行时消费核**：Dashboard/host-agent 是否实际调 `/api/v1/task`·`/intent-episodes`（代码审计未见，运行时确认）。
- **dashboard stats 链路**：HitRecorder→stats→`dashboard-api-types`(guardHits/searchHits/searchHitsLast30d)→前端显示——
  定删后处置（移除字段 + regen 类型 + 前端 vs 置 0）。
- **边界 lint 基线**：跑 `lint:agent-extraction-boundary`/`lint:core-import-boundary`/`lint:repo-boundary` 留绿基线。
- **确认死项 grep 复核**：CrossEncoderReranker(null)/ReactiveEvolutionService 别名/BUILD_SYSTEM_MARKERS 别名 无活引用。

### MC-1 安全直删（孤立，可并行）
- 已退役路由：`auth`(410)、`search/context-aware`。
- 空壳：`CompletionFinalizer.refreshPanorama`、`PanoramaModule`、`AppConfigLoader`、`agent-project-context/` 空目录、
  delivery-retired 死分支、`regenerateEditorIndex` 占位。
- 确认死：`CrossEncoderReranker`(+ KnowledgeModule null 配置项)、`ReactiveEvolutionService` 别名、`WikiUtils.BUILD_SYSTEM_MARKERS` 别名。
- 验证：grep 无残留引用；`build:check` 绿。无跨工具耦合。

### MC-2 monitoring 删（dev 能力删除，先撤注入再删）
- 解耦：`HttpServer` 撤 `initErrorTracker`/`initPerformanceMonitor` + `errorTracker` 字段 + 中间件 perf timer 段；
  删 `/api/v1/monitoring` 路由 + getErrorTracker/getPerformanceMonitor 调用点。
- 删 `lib/infrastructure/monitoring/`（ErrorTracker/PerformanceMonitor）。
- 验证：HttpServer 启动 + 其余路由正常；dashboard 无 /monitoring 依赖（MC-0 确认）；`build:check` 绿。

### MC-3 意图范式整体删（最大耦合簇，先解耦再删）
对象：task/intent 链 + `alembic_task` + `/task` + `/intent-episodes` + HitRecorder + 意图信号订阅（一个范式、联动删）。
- **解耦拆分（删前）**：① `mcp-tools.ts` 去 `TaskInput` + `AllowedToolsInput.alembic_task`；② `HttpServer` 去
  `/task`·`/intent-episodes` 挂载；③ DI（`ServiceMap`/`InfraModule`/`AppModule`）去 `intentEpisodeStore`/
  `primeSearchPipeline` 注册；④ `handler-runtime/types` 去 `IntentState`/`IntentChainRecord`/`McpContext.intent`；
  ⑤ `SignalModule` 去 `hitRecorder` 注册 + `signalBus.subscribe('intent')`、`ServiceMap` 去 `hitRecorder` 类型；
  ⑥ dashboard stats 按 MC-0 决定（移除 `guardHits/searchHits/searchHitsLast30d` + regen + 前端 / 置 0）。
- **删除**：`lib/service/task/` 全部（IntentExtractor/TaskDispatchService/IntentSearchPlan/PrimeSearchPipeline/
  PrimeInjectionPackage/IntentEpisodeStore/HostIntentContext/IntentEvidence）+ `lib/service/signal/HitRecorder.ts`
  + `lib/http/routes/task.ts` + `lib/http/routes/intent-episodes.ts`。
- **安全性（MC-0 已证）**：`PrimeSearchPipeline` 不被 `/search` 复用 → 无检索主路径断裂；Plugin resident 已停止消费 → 无下游断。
- 验证：daemon/HTTP 启动正常、`/search` 等其余不受影响、`build:check`+`test:unit` 绿；全仓无 `alembic_task`/
  `IntentExtractor`/`IntentEpisode` 残留引用。

### MC-4 验收（claude-code 版本）
- daemon/HTTP/Dashboard/CLI/file-monitor/Gateway/sandbox/AI 执行 等保留能力全功能；意图/prime MCP 能力已退役无残留；
  monitoring 已移除；边界 lint（agent-extraction/core-import/repo-boundary）仍绿；`build:check`+`test:unit`(+ 必要 integration) 绿；
  dashboard stats 处置生效。

## 执行顺序与依赖
- **MC-0 必先**（CCR-ALMB 复核是硬前置；运行时消费核 + dashboard stats 决策喂给 MC-2/MC-3）。
- **MC-1 / MC-2 / MC-3 相互独立**（不同代码区），可并行或任意序；MC-3 最重。
- **MC-4 末**。推荐序：**MC-0 →（MC-1 ‖ MC-2 ‖ MC-3）→ MC-4**。
- **仓库覆盖**：`Alembic`（全部 MC，主窗口）；`AlembicDashboard`（observing/可能触及——若前端显示 guardHits/searchHits 或依赖
  /monitoring·/task，需配套前端调整，MC-0 核）；`AlembicCore`/`AlembicAgent`（no-task，边界已清，仅复核门禁绿）；`Test`（claude-code 验收）。

## 下一步

1. ✅ 清理范围已闭合、分阶段方案（MC-0~4）已成形、Core/Agent 边界已核（无新增项）。
2. 形成 **design-handoff** 交控制器 intake（含 MC-0~4、执行序、仓库覆盖、运行时核验、CCR-ALMB 硬前置）。

（CCR-ALMB 在途清理复核为 MC-0 硬前置，避免与之重叠/冲突。）
