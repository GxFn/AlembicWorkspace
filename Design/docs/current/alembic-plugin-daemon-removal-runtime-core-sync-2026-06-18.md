# AlembicPlugin Daemon 删除与运行时下沉 Core 需求设计

Status: Design 草案（2026-06-18）/ **当前唯一推进的 Plugin 架构净化需求** / 独立自包含、不依赖也不等待其他需求 / 待控制器 intake
Date: 2026-06-18
Design Key: alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18
Primary Windows: AlembicPlugin（删 daemon + 净化非职责代码 + 消费 Core 既有运行时契约）；**Core 不新增**（暂复用既有契约/状态，本需求基本为 Plugin 单窗口）

## 背景

职责净化与 daemon 探查得出一个关键事实：**MCP 工具同进程直调 Core Service**
（`McpServer.ts:380-416` 经 `_resolveHandler→wrapHandler→直调`，`263-264` 持 `ServiceContainer`），
从不经过 Plugin 嵌入式 daemon。daemon 的存在理由只有两个：① Dashboard 后端 ② 异步可恢复 job。
用户已定：**Dashboard 归 Alembic 主体、Plugin 不支持**；**bootstrap/rescan 改宿主本地阶段缓存**。
两个理由都消失，故 **Plugin 删除完整嵌入式 daemon**，退化为纯 MCP 进程。

**统领原则（用户 2026-06-18 指挥）**：去 daemon 后用**一套 Plugin 非强进程实现**保证功能完整，
**结构上杜绝以后再建 daemon**；凡需对接 Alembic 主体 daemon 之处，**Plugin 调用对应的 Core 接口或
状态**来对接，而非 Plugin 自起进程或自持连接。"阶段缓存 / 多对一绑定 / 纯 MCP+本地缓存"不是三件事，
是这一套逻辑的三个面（见《统领设计》）。

## 真实代码锚点（已核实）

- **MCP 不依赖 daemon**：`McpServer.ts:380-416` 直调 handler；同进程 `getServiceContainer()`（263-264）。
  四 agent 工具（prime/work/code_guard + admin）纯同进程 Service。
- **daemon 唯一触发点**：`ensureEnhancementDaemon` 全仓唯一调用在 `HostMcpServer.ts:932`（enqueueJob，
  bootstrap/rescan 异步）。`openDashboard`(728)/`readJob`(1000) 只查/读不启 daemon。
- **Plugin / Core daemon 切分**：Plugin 侧 `lib/daemon/`(DaemonSupervisor+DaemonJobRunner 编排)、
  `bin/daemon-server.ts`、`lib/http/`(HttpServer+9 路由+middleware) **可删**；Core 侧
  `@alembic/core/daemon`（`src/daemon/`：JobStore / DaemonState / ProjectRuntimeContracts /
  ResidentServiceContracts / RuntimeContracts + 读取助手 `readDaemonState`/`resolveDaemonPaths`）**须留**。
- **对接主体的连接逻辑当前在 Plugin 侧**：`lib/service/resident/AlembicResidentServiceClient.ts` 自己做
  HTTP fetch（probe/resolveProjectScope/search/prime/enqueueJob/readJob + 多对一 `#resolveActiveProjectScopeProbe`
  读 runtime-control + DaemonState url/token + Bearer；endpoints `/api/v1/{daemon/health,project-scope/
  resolve-folder,search,task,jobs,intent-episodes,decision-register}`），仅借 Core 的状态助手 + 契约。
  即"状态"侧 Core 已有、"接口（连接编排）"侧今天在 Plugin——**本需求暂不上提**：Plugin 瘦身后消费 Core
  既有契约/状态对接主体（暂不新增 Core；客户端上提 Core 留作后续可选优化）。
- **Core 已拥有运行时状态 + resident 契约族，且把 Plugin 建模为 consumer**（`@alembic/core/daemon`）：
  `ProjectRuntimeContracts` 的 `ProjectRuntimeControlSnapshot.projects[]`（多项目快照=**多对一视图**）/
  `ProjectRuntimeControlState`（active/selected runtime-control schema）/ `ProjectRuntimeDaemonSummary`(daemon
  状态)/ `ProjectRuntimeJobsSummary`(job 状态)；`ProjectRuntimeScopeOwnerSummary` 已声明 `controlPlaneOwner:
  'alembic'`(主体)/`jobStoreOwner:'@alembic/core/daemon/JobStore'`，`PROJECT_RUNTIME_FIELD_POLICIES`
  consumers 含 `AlembicPlugin`/`AlembicDashboard`、owner `AlembicCore`、分 consumer-projection/internal-runtime/
  sensitive 字段类。`ResidentServiceContracts` 的 `ALEMBIC_RESIDENT_SERVICE_OWNERS=['alembic','alembic-plugin']`、
  `AlembicEnhancementRoute='local-alembic'`(已单路线，印证 PDR-5)。**required services 无 "thread"**
  （project-identity/project-scope/daemon/jobs/api-ai/dashboard/file-monitor）。
- **意图链 = 四工具共享 intake，含两半**：`buildIntentIntake`(agent-public-tools.ts:932) 被 prime(经
  `buildPrimeRequirementIntake`)/workStart(468)/workFinish(564)/codeGuard(668) 共用，`ReturnType` 为全文
  ~20 处 intake 类型。**(A) 旧意图范式**：`hostIntentFrame`/`RecognizedIntentDraft`/`residentIntentHandoff`
  (HostIntentFrame.ts:135/196，PrimeSearchPipeline:120 用)/`intentKind` + 死值 `vectorPlan`(构造未消费)。
  **(B) `IntentExtractor` 实为查询扩展层**——硬编码 EN↔CJK 同义词表 + 多查询 + 技术术语/场景，产出
  `queries`/`keywordQueries` 当前喂 prime 多查询检索；**仅 prime 用其做检索**，`alembic_search` 用原始
  query 直走 SearchEngine。intent 输入入口已删（`alembic_intent` + obsolete 拒绝，1174/1190）。
- **Plugin 向量语义能力（须保住，与 daemon/intake 无关）**：Core `SearchEngine`/`VectorService` + 本地
  Ollama 嵌入（qwen3-embedding，多语言）+ 本地 HNSW/JSON 向量存储（`dataRoot/.alembic/vector/`），全进程内
  自洽；`alembic_search` 三级路由（resident → 本地 SearchEngine → SQL fallback），删 daemon 后 resident 路
  退化、本地语义检索完整。**多语言嵌入已承担跨语言匹配，故 B 层词法扩展可弃**。
- **三个同名 "Gateway" 需区分**：`lib/governance/gateway/Gateway`（治理网关）**活路径已死**——
  无 handler 读 `ctx.gateway`（grep 空），`NoOpGateway.ts` 自注"no route uses the gateway middleware path"；
  `EvolutionGateway`（consolidate.ts:59/99、evolve.ts:96 真调 `.submit()`）与 `RecipeProductionGateway`
  （tool-router.ts:221/230 真调 `.create()`）**是另两件、保留**。
- **ghost 即 dataRoot、无独立同步步**：ghost 模式下 `~/.asd/workspaces/<projectId>` 本身就是
  `WorkspaceResolver` 解析出的 dataRoot，Core JobStore 直接写在那里；无"本地→ghost"二段同步。
- **bootstrap 已宿主同步、跨轮驱动**：`runHostAgentColdStartWorkflow` 4 阶段、rescan 5+ 阶段，均同步
  不启 AI；daemon 的"异步 job"与宿主多轮循环重复。当前**无任何阶段级进度持久化**（仅 job 级 status +
  完成时一次性 result JSON，中间阶段只在 daemon 内存 bootstrapTaskManager）。
- **HitRecorder 死代码**：零 record 调用点，flush 的 stats 字段无读取方。

## 目标（用户决策）

1. **删完整 Plugin 嵌入式 daemon**；Plugin = 纯 MCP 进程（同进程调 Core Service），非强进程。
2. **bootstrap/rescan 交互不变，仅数据后端本地化**：job/进度数据从 daemon JobStore 迁**本地临时缓存**
   （进程内文件），替代 daemon 异步 job；完成后落解析出的 dataRoot（ghost 模式即 ghost 公共区）。交互方式不变。
3. **运行时状态同步经 Core（消费既有、不新增 Core）**：Plugin（瘦身后非强进程客户端）消费 Core **既有**
   接口/状态对接主体，同步 daemon / job 运行时状态；**多个 Plugin → 一个 Alembic 主体（多对一）**。
4. **净化删除 Plugin 内非职责功能/代码**（核心需求）：`HitRecorder`、文件变化监控（`FileChangeHandler` +
   `GitDiffCheckpointService`）、`IntentExtractor` 意图链、治理 `Gateway`，及死代码清单——**耦合项先解耦拆分、
   再删**；保留 git-commit 机会性进化（`PluginOpportunisticEvolution`）。

## 统领设计：Plugin 非强进程运行时模型

**不变量（"避免以后再建 daemon"的可执行形态）**：
> Plugin 任何功能都不得依赖**活过一次 MCP 工具调用的进程**。跨调用要存活的状态 → 落**本地阶段缓存**；
> 跨进程 / 对接主体的状态 → 走 **Core 接口或状态**。不满足此不变量的新功能属架构变更，须显式决策，
> 不得默默把 daemon 加回来。

**三个面（同一套实现）**：

| 面 | 非强进程实现 | 落点 |
|---|---|---|
| ① 本地临时缓存 | bootstrap/rescan **交互不变**，仅 job/进度数据后端从 daemon JobStore → 进程内**本地临时缓存** | Plugin 编排（非强进程）+ 复用 Core JobStore/存储原语（纯文件 I/O，不需 daemon）。删 DaemonJobRunner，不删 Core 存储原语 |
| ② 多对一对接主体 | Plugin 调 Core **既有**接口/读 Core 状态对接主体；多 Plugin 共享同一主体快照 = 多对一自然成立 | Plugin（瘦身后）非强进程客户端消费 Core 既有契约（`ProjectRuntimeControlSnapshot` 多对一 + `AlembicResidentService*` + `readDaemonState`）；**暂不新增 Core、暂不上提客户端** |
| ③ 纯本地首类 | 无主体 → 进程内 MCP + 本地缓存 + 本地向量，完整可用，是**首类 route 非降级 fallback** | Core 接口返回"无主体"，Plugin 全程本地；本地向量/SearchEngine 已是 Core 进程内实现 |

**反向 gap 核验（确认不会被迫加回 daemon）**：bootstrap/rescan 本是宿主同步执行，把 daemon job 数据换成
本地临时缓存即可，交互不变、**无需常驻进程**；进化能力（显式 `alembic_evolve` + git-commit 机会性进化）均
进程内、按提交/调用触发、非常驻；**文件变化监控因需常驻、与不变量冲突，已删**。**净化后无残留功能需要 Plugin
常驻进程**，不变量站得住。

## 分阶段方案（PDR-0~6）

### PDR-0 盘点（不改码）
- 复核：MCP 全工具不依赖 daemon（同进程 Service 全覆盖）；`ensureEnhancementDaemon` 仅 job 触发；
  daemon 载体删除影响面（Plugin 侧 vs Core 侧切分）；bootstrap/rescan 阶段划分；意图链四工具耦合面；
  治理 Gateway 活路径死的确认；ghost=dataRoot；`CacheCoordinator` 实例模型（决定其去留）。
- 死代码清单复核（memory 已列，PDR-0 重验是否仍在）：`lib/repository/skills`、`lib/types` 通用存根、
  `WorkflowCompletionFinalizer` 的 `refreshPanorama`/`consolidateSemanticMemory` 空壳、
  `http/routes/auth`（410 退役）、`KnowledgeSyncService`、`CrossEncoderReranker`。

### PDR-1 非职责功能净化：解耦拆分设计 → 删除（核心需求）
原则：**耦合项先解耦拆分、验证活路径不断，再删**；孤立死代码直删。按耦合深度排序。

**①（直删）HitRecorder —— 孤立死代码**
- 现状：`HitRecorder.ts` + `SignalModule` 注册（`recorder.start()` 定时 flush + shutdown `stop()`）；
  零 record 调用点、stats 无读取方。
- 删除（无需解耦）：`HitRecorder.ts` + SignalModule 注册与 shutdown hook + `ServiceMap.hitRecorder` 类型。
- 验证：grep 无 `hitRecorder`/`guardHit`/`searchHit` 残留。

**②（删文件变化监控，留 git-commit 机会性进化）**
- 核实：响应式进化 `FileChangeHandler`（KnowledgeModule 注册、`GitDiffCheckpointService.dispatch` 驱动）=
  **文件变化监控**路径；机会性进化 `PluginOpportunisticEvolution`（自建 GitDiffScanner、与 FileChangeHandler
  不共享；原触发 `alembic_task close` 已随退役失效）= **git-diff 按需**路径。显式 `alembic_evolve` 始终保留。
- **已决（用户）：文件变化监控无法在插件内运行（需常驻进程、与非强进程不变量冲突）→ 删** `FileChangeHandler`
  + `GitDiffCheckpointService` + KnowledgeModule 注册 + dispatcher subscriber；**保留** `PluginOpportunisticEvolution`
  + `GitDiffScanner`，**后续按代码提交触发**进化（触发时机另定，park）。
- `EvolutionGateway` 为保留服务，仅移除 FileChangeHandler 这个消费方。
- 删除：`FileChangeHandler.ts` + `GitDiffCheckpointService` + 注册 + dispatcher subscriber。
- 验证：显式 `alembic_evolve` + git-commit 机会性进化正常；无文件变化监控/响应式残留触发。

**③（intake 整层删除；prime 直调正常向量语义）IntentExtractor + 意图链**
- 链路真相（核实）：`buildIntentIntake`(932) 被 prime(经 `buildPrimeRequirementIntake`)/work/code_guard
  共用，产物分两半——(A) 旧意图范式（hostIntentFrame/RecognizedIntentDraft/residentIntentHandoff/
  intentKind + 死值 vectorPlan）；(B) `IntentExtractor` 查询扩展层（EN↔CJK 硬编码同义词表 + 多查询 +
  技术术语/场景，产出 `queries`/`keywordQueries` 当前喂 prime 多查询检索）。
- **决策（用户拍板）：A、B 全删**。B 的跨语言/同义召回已被多语言语义嵌入（qwen3 + Recipe 语义区向量）取代，
  硬编码词法层是残留；**prime 检索改为直调正常向量语义能力**（Core `SearchEngine`/`VectorService` 语义检索，
  同 `alembic_search`），query 直接来自结构化 `StandalonePrimeRequirementFrame`（requirementGoal/
  locatorFacets/keywords），无 `IntentExtractor`、无 `ExtractedIntent`、无 intent 框架。
- 删除清单：
  1. `IntentExtractor.ts`（B 全删）；
  2. `HostIntentFrame.ts` 全文（A：`buildHostIntentFrame`/`RecognizedIntentDraft`/`HostIntentFrame`/
     `ResidentIntentHandoff`/`buildResidentIntentHandoff`）；
  3. intake 聚合：`buildIntentIntake`/`buildPrimeRequirementIntake`/`mergeRecognizedIntent` +
     `ReturnType<typeof buildIntentIntake>` 类型 + `buildVectorPlan`；
  4. `PrimeSearchPipeline` 的 ExtractedIntent 驱动检索编排（多查询/RRF/residentIntentHandoff）——被正常
     语义检索取代。
- 工具改造：prime 检索 = 结构化 query → 正常向量语义检索；**保留 `buildPrimeKnowledgeMaterial` 的知识材料/
  信任门禁/receipt 产出**（prime 本职、非检索层）。work/code_guard 去 intake、仅用各自结构化 args（其原
  intake 用途只是 lifecycle/intent 元数据绑定）。**对外输出去除 `intentKind`**（已决；后续由 Agent 从维度/
  类型列表选输入）；agentHost/inputSource 从 args 重取保留。
- **无主体全质量（已决）**：prime 检索用 **Plugin 本地向量语义**（Core VectorService + 本地 Recipe 语义区向量），
  须产出 `recipe-semantic-region` 证据（matchedRegionClasses）供信任门禁——**无主体也全质量、不降级 lexical**。
  这正是"给 Plugin 加向量语义 = 为 prime 准备"的落点。
- 验证：prime（结构化输入 → 正常向量语义检索 → 知识材料/信任产出）、work、code_guard 全链路跑通；全仓无
  `extractIntent`/`buildHostIntentFrame`/`buildIntentIntake`/`ExtractedIntent`/`ResidentIntentHandoff`
  引用；向量语义能力（SearchEngine/VectorService/本地嵌入/HNSW）不受影响。
- 归属：本需求处理（APQ 已作为完成需求关闭、不可追加）。

**④（表面广但活路径死，先撤注入再删）治理 Gateway**
- 关键澄清：**只删** `lib/governance/gateway/Gateway`（治理）；**保留** `EvolutionGateway`、
  `RecipeProductionGateway`（不同服务、活）。校正需求原"改 consolidate/evolve/tool-router 直调 Service"——
  它们调的是后两者、与治理 Gateway 无关、**无需改**。
- 耦合：`McpServer` init `registerGatewayActions`(277-283) 注册 25+ 动作；每调用注入 `ctx.gateway`(396/653)；
  `system.ts:57-58` 健康检查引用；daemon 注 NoOpGateway。无 handler 消费 `ctx.gateway` → 活路径已死。
- 解耦拆分设计：① 撤注入链（删 `_resolveMcpGatewayMapping` + `ctx.gateway` 注入 +
  `registerGatewayActions` 调用 + `system.ts` gateway 健康检查）；② 25+ 注册动作若确无活调用方（已示空），
  随框架删，如发现个别活用先迁该动作直调 Service。
- 删除：`Gateway.ts`、`GatewayActionRegistry.ts`、`NoOpGateway.ts`（daemon 删后失去唯一用户，与 PDR-3 配对）。
- 验证：四工具调用不经治理 Gateway 仍正常；EvolutionGateway/RecipeProductionGateway 不受影响。

**附：死代码直删（PDR-0 复核后随本阶段清）**：见 PDR-0 死代码清单，逐项 grep 确认无引用后直删。

### PDR-2 bootstrap/rescan 数据后端本地化（统领设计 ① 落地）
- **交互不变（已决）**：bootstrap/rescan 的工具调用、返回、宿主交互方式全部维持现状；本阶段**只换数据后端**——
  把 daemon JobStore 持有的 job/进度数据迁到**进程内本地临时缓存**（文件），删 `alembic_job` 的 daemon 异步
  路线 + `DaemonJobRunner`；
- 临时缓存落 `WorkspaceResolver` 解析出的 dataRoot（ghost 模式即 `~/.asd/workspaces/<projectId>`）；完成后
  落地最终知识（临时→最终），无独立"本地→ghost"同步步；
- **多对一原子可见性**：多 Plugin 共享主体 ghost 公共区时，临时数据本地暂存、**完成时原子落地**，避免半成品
  被兄弟 Plugin 读到（仍非强进程）；
- 保持宿主同步语义（宿主分析、不启 AI）；
- **本地 Recipe 语义区向量构建（支撑无主体 prime）**：bootstrap/rescan 须在本地构建 Recipe 语义区向量
  （复用 Core `VectorService`/`RecipeRegionVectorIndex`，暂不新增 Core），供无主体 prime 的 region 信任证据；
  PDR-0 复核是否已进程内构建（纯接线）还是需补索引编排。

### PDR-3 删完整 daemon（统领设计落地）
- 删 `lib/daemon/`（DaemonSupervisor+DaemonJobRunner）、`bin/daemon-server.ts`、`lib/http/`（HttpServer+9
  路由+middleware）、`HostMcpServer.ensureEnhancementDaemon` 及 enqueueJob 的 daemon 启动逻辑；
- **DaemonSupervisor 消费方全清单**：`HostMcpServer`（ensure/status/stop）+ `StatusService`（status）——一并
  改造勿留悬空 import；`DaemonStatus` 类型在 EnhancementRoute/Diagnostics/ProjectRuntimeContext 等 type-only
  引用，随路线/状态改造收口；
- **3 个 daemon 相关本地工具处置（MCP 表面变更，已决）**：`alembic_dashboard` 删（归主体）；`alembic_runtime`
  删 daemon 控制语义（stop/cleanup），**保留本地 runtime-dir/缓存清理**（改本地 fs、不经 daemon）；
  `alembic_status` 去 daemon 状态字段、降级显示；
- 撤 `NoOpGateway`（daemon 注入，与 PDR-1④ Gateway 撤注入配对）；`infrastructure/audit/NoOpAuditLogger`
  随删，保留 AuditLogger/AuditStore（MCP 用）；
- `EmbeddedRuntimeContract` 留结构、删 daemon 相关 required-files/routes 条目（**无运行时硬 gate，仅 ModuleBoundary
  诊断；同步删条目避免构建期缺 daemon-server.js**）；
- `CacheCoordinator` 去留按 PDR-0 实例模型定（无第二进程后理论多余）；
- 保留 `ServiceContainer`（MCP 同进程）+ 本地向量 + 宿主路线。

### PDR-4 运行时状态同步：Plugin 消费 Core 既有接口/状态 + 多对一（统领设计 ② 落地）
代码事实：Core `@alembic/core/daemon` 已拥有"状态侧"(`ProjectRuntime*`)与"接口侧"(`AlembicResidentService*`)
两套契约，已声明 Plugin 为 consumer、主体为 control/runtime producer、JobStore 为 Core。**故本需求零 Core
新增**——Plugin 直接消费这些既有契约/状态对接主体。

落地（贴合"调 Core 接口或状态"，暂不新增 Core）：
1. **连接客户端暂留 Plugin、瘦身**：`AlembicResidentServiceClient` 仍是 Plugin 的非强进程实现，收敛为
   消费 Core 既有契约/状态；删 `/intent-episodes`(意图链)/`/decision-register`(跨仓下线)/dashboard 三路，
   留 probe/projectScope/search/job。（把客户端整体上提进 Core 留作后续可选优化，**本需求不做**。）
2. **"状态"路径**：Plugin 读 Core 既有 `ProjectRuntimeControlSnapshot`/`ProjectRuntimeScopeSummary`
   （daemon + job 运行时状态）；**多对一天然由 `snapshot.projects[]` 表达**，多 Plugin 共享同一主体快照。
3. **"接口"路径**：Plugin 调 Core 既有 `AlembicResidentService*`（probe/search/job）做主动同步/检索。
4. **运行时状态 = daemon + job**（已决）：Core 无 thread 契约，"线程"项收敛掉、不新增。
5. **所有权不变**：主体=control/runtime producer、Core=契约+JobStore、Plugin=consumer；多对一默认只读镜像。
6. **绑定/并发**：现多对一为隐式（读 runtime-control + 探测）；显式绑定/缓存/token 处理属后续增强，本需求
   不新增 Core。

### PDR-5 EnhancementRoute 改写（统领设计 ③ 落地）
- **改写 `selectEnhancementRoute` 选择逻辑**（非仅删 enum）：现逻辑在无 daemon 时仍兜底选
  `embedded-plugin-runtime`（EnhancementRoute.ts:305/310），删嵌入 daemon 后指向空——必须改为：
  **有主体 → 经 Core 接口/状态（resident 消费）；无主体 → 纯本地（MCP 同进程 Service + 本地阶段缓存 + 本地向量）**；
- 去 `embedded-plugin-runtime` 分支；纯本地为**显式首类 route**，非现"resident 超时/失败降级"的隐式 fallback；
- prime/search 检索路由对齐此选择；prime 直调正常向量语义写成**路由无关**（经统一 search 入口）。

### PDR-6 验收（claude-code 版本）
- **验收仅针对 claude-code 宿主壳**（已决，不要求 codex 双壳 parity）；
- Plugin 无 daemon 进程仍完整可用（四工具同进程 Service）；bootstrap/rescan 数据本地临时缓存 → 完成落地
  dataRoot/ghost 走通；**无主体纯本地 prime 全质量**（本地 Recipe 语义区证据 → 信任门禁）；有主体时多对一
  运行时同步；净化各项解耦后活路径（prime/work/code_guard、显式 alembic_evolve、保留的 git-commit 机会性进化）
  不断；全仓 build/check 绿。

## Core 能承担的共享能力

实现几乎全在 Core（guard/knowledge/search/向量/workspace/JobStore 原语、daemon 状态契约）；Plugin 删
daemon 后只剩"宿主适配 + 本地阶段缓存编排 + 消费 Core 既有接口/状态"。**本需求不新增 Core**：复用 Core 既有
`ProjectRuntime*` / `AlembicResidentService*` 契约 + JobStore；Plugin 瘦身后消费它们对接主体（连接客户端
上提 Core 留作后续可选优化）。

## 与 Alembic 主体的联通（净化后）

- 联通收敛为消费 **Core 既有接口 + 状态**（运行时状态 + 检索，不新增 Core），多 Plugin → 一主体；
- resident 瘦身后边界干净（去 DecisionRegister/IntentEpisode/Dashboard）；
- 删 embedded daemon 后，消除"Plugin daemon 与 Alembic daemon 两份同样 HTTP 实现"的结构性重复。

## 非目标

- 不改 prime 向量语义方向（本需求整层删意图链 intake、prime 直调正常向量语义，不重开已关闭的 APQ）；
- 四工具对外 MCP 语义基本不变——**除去除 `intentKind` 输出字段**（已决，后续由 Agent 从维度/类型列表选输入）；
  agentHost/inputSource 等从 args 重取保留；
- 不恢复 Dashboard（归 Alembic 主体）；
- 不在 Plugin 保留任何常驻 HTTP / daemon 进程；
- 不动 `EvolutionGateway` / `RecipeProductionGateway`（保留服务）。

注：删 daemon 必然移除 `alembic_dashboard` 工具后端、降级 `alembic_job` daemon 异步路线——这是**可见行为/
MCP 表面变更**，已显式记入目标（非藏在非目标下），需控制器/用户确认。

## 需求定位（当前唯一推进项）

- **其他需求不再单独推进**（GMAP / MTC / RIC / 跨仓下线 / cleanup / 推进编排等）；本需求是当前唯一推进的
  Plugin 架构净化需求，独立自包含、不依赖也不等待它们。
- 既成事实承认：MTC 命名整改已落地（git log）、APQ 已转 prime 向量语义并**作为完成需求关闭**——本需求基于
  这些已执行现状展开。
- 不回头补做其他需求未完成的零散项；Plugin 真正需要的架构净化由本需求一次性覆盖。

## 确认点

**已决（统领设计已收敛 CP1-3，用户 2026-06-18 指挥）**：
- 阶段缓存 = Plugin 非强进程本地缓存（Core 存储原语）+ 宿主跨轮续跑 + 完成时原子发布；ghost 即 dataRoot；
- 多对一 = Plugin 消费 Core **既有**接口/状态（**不新增 Core**），多 Plugin 共享同一主体快照（`ProjectRuntimeControlSnapshot.projects[]`）；
- 独立运行 = 纯 MCP + 本地阶段缓存 + 本地向量，显式首类 route。

**已决（用户指挥）**：意图链 **intake 整层删除（A 意图范式 + B 查询扩展全删）**；**prime 检索改为直调正常
向量语义能力**（SearchEngine/VectorService，query 来自结构化 args），跨语言交给多语言嵌入；保留
`buildPrimeKnowledgeMaterial` 信任产出；不保留任何 intake 中间对象（含 IntentExtractor / ResidentIntentHandoff）。

**已决（用户指挥）**：**暂不新增 Core**——PDR-4 纯消费 Core 既有契约/状态；"线程运行时状态"收敛为
**daemon + job**（Core 无 thread 契约，新增项延后）。

**已决（用户 2026-06-18）**：
- intake 整删 + prime 直调正常向量语义；**对外去除 `intentKind` 字段**（后续 Agent 从维度/类型列表选输入）。
- pure-local prime **用 Plugin 本地向量语义**产 region 证据、**无主体全质量**不降级；PDR-2 须本地构建 Recipe 语义区向量。
- **死代码清单随本需求一并删**；**验收仅 claude-code 版本**（不要求 codex 双壳 parity）。
- bootstrap/rescan **交互不变**，仅数据后端 daemon → 本地临时缓存。
- `alembic_dashboard` 删；`alembic_runtime` 删 daemon 控制、保留本地清理；`alembic_status` 去 daemon 字段。
- 暂不新增 Core；运行时同步 = daemon+job（线程延后）；多对一显式绑定延后。

- **进化**：删**文件变化监控**（FileChangeHandler + GitDiffCheckpointService，需常驻、无法在插件内）；**保留
  git-commit 机会性进化**（PluginOpportunisticEvolution + GitDiffScanner），后续按代码提交触发（时机另定）。

**待确认（仅剩 PDR-0 实现期复核，非设计决策）**：
- CacheCoordinator 去留（无第二进程后是否仍需内存一致性）。
- 本地 Recipe 语义区向量是否已进程内构建（纯接线 vs 需补索引编排）。

## 边界情况与连通性核验（深审，真实代码）

**已核实安全**：
- bootstrap/rescan/cold-start/dimension-complete **零依赖 intake**（用 `createHostAgentColdStartIntent`/
  `createHostAgentKnowledgeRescanIntent` 自建意图，不碰 IntentExtractor）→ PDR-1 与 PDR-2 独立。
- resident 客户端连**外部主体** daemon（读 DaemonState file url/token），不自管 daemon 生命周期；删嵌入
  daemon 后退化干净（resident 返回 unavailable）。
- 本地向量语义（SearchEngine/VectorService/Ollama/HNSW）进程内自洽，删 daemon/intake 不影响检索本身。
- `EmbeddedRuntimeContract` 无运行时硬 gate（仅 ModuleBoundary 诊断元数据）；删 daemon-server 时同步删其条目。

**边界情况（影响范围/需决策）**：
1. **进化双路径均 dormant**：`FileChangeHandler`（dispatcher 驱动）+ `PluginOpportunisticEvolution`（触发
   `alembic_task close`，**已退役 → 孤儿**，自建 GitDiffScanner 不共享）。唯一活进化是显式 `alembic_evolve`。
   → **已决**：删**文件变化监控**（FileChangeHandler + GitDiffCheckpointService，需常驻、无法在插件内运行）；
   **保留 git-commit 机会性进化**（PluginOpportunisticEvolution + GitDiffScanner），后续按代码提交触发（时机另定）。
2. **pure-local prime 信任证据降级**：`recipe-semantic-region` 证据（matchedRegionClasses）当前**仅来自
   resident 语义区路**（`primeInjectionPackage.residentRegionRetrieval`）；无主体纯本地缺该证据 → 降级 lexical
   `recipe-locator`。**已决：本地 `RecipeRegionVectorIndex` 接进本地 prime 路，无主体全质量、不接受 lexical-only
   （Plugin 本地向量语义即为 prime 准备）**。
3. **intake 删除连带意图会话**：`workStartHandler.bindWorkSession(ctx,record,intake)` 用 extracted/hostIntentFrame/
   lifecycle；`McpServer._trackSession` 亦有意图会话跟踪（drift 检测）。均属意图范式 → PDR-1③ 一并清；
   work/code_guard 的 envelope 元数据（agentHost/inputSource/intentKind）改 args 直传或存 WorkRecord（低成本）。
4. **删 daemon 波及 3 本地工具**（MCP 表面）：`alembic_dashboard` 删、`alembic_runtime`（daemon 控制语义失效）、
   `alembic_status`（`StatusService` 起 DaemonSupervisor，去 daemon 字段）。
5. **EnhancementRoute 兜底悬空**：无 daemon 仍兜底选 `embedded-plugin-runtime`（305/310）→ 删后指向空 →
   PDR-5 必须改写选择逻辑。

## 执行顺序与依赖

依赖约束：
- **PDR-2 必先于 PDR-3**：先把 bootstrap/rescan job 移进程内阶段缓存，再删 daemon；否则即断 `alembic_job`
  （`ensureEnhancementDaemon` 是唯一 daemon 触发点，移走后 PDR-3 才安全）。
- **PDR-1 与 PDR-2 独立**（bootstrap 不碰 intake）——任意先后，互不阻塞。
- **治理 Gateway 跨阶段**：撤 `ctx.gateway` 注入 + `registerGatewayActions` + `system.ts` 引用在 PDR-1④；
  `NoOpGateway`（daemon 注入）随 PDR-3。
- **PDR-4（resident 瘦身）晚于 PDR-1 + PDR-3**：删 `/intent-episodes` 须 PDR-1 先去意图链调用方；删 dashboard
  路须 PDR-3 先去 alembic_dashboard；`/decision-register` 须确认无活消费方。
- **PDR-5（路线改写）晚于 PDR-3**：嵌入 daemon 删后才改 `selectEnhancementRoute`。
- **prime 直调正常向量语义（PDR-1③）面向 PDR-5 后路由**：经统一 search 入口、写成路由无关，避免返工。

推荐拓扑序：
**PDR-0 盘点 → PDR-1（1a HitRecorder ｜ 1b 进化双 dormant 删 ｜ 1c Gateway 撤注入 ｜ 1d intake 整删 +
prime 改造 + work/guard 改 args + 意图会话清理）→ PDR-2 bootstrap 本地阶段缓存 → PDR-3 删 daemon（含
NoOpGateway、3 工具处置）→ PDR-5 路线改写 → PDR-4 resident 瘦身 → PDR-6 验收。**
（PDR-4 置于 PDR-5 之后：待 daemon/dashboard/intent 调用方全清，再瘦 resident 客户端最干净。）

## 总控接收提示候选

```text
接管并自动化推进已确认需求：AlembicPlugin Daemon 删除与运行时下沉 Core
demandKey: alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18

先读：CLAUDE.md、.wakeflow-active/index.md、.wakeflow-active/current/workspace-current-status.md；
Design 交付：Design/docs/current/alembic-plugin-daemon-removal-runtime-core-sync-workspace-handoff-2026-06-18.md
与 Design/docs/current/alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18.md。

动作：intake 该 handoff（ready-for-controller-intake、用户逐条确认、无待决策项），建状态根，按拓扑序规划并
自动化推进：PDR-0 → 1 → 2 → 3 → 5 → 4 → 6。基本 Plugin 单窗口（Core 不动）。

护栏（详见 handoff）：
- 非强进程不变量：Plugin 不留任何常驻进程；对接主体只消费 Core 既有接口/状态（ProjectRuntimeControlSnapshot/
  AlembicResidentService*）；暂不新增 Core；运行时态=daemon+job（线程延后）。
- 顺序硬约束：PDR-2（job 移本地临时缓存）必先于 PDR-3（删 daemon）；resident 瘦身（PDR-4）置 PDR-3/5 后。
- 净化删：HitRecorder、文件变化监控（FileChangeHandler+GitDiffCheckpointService，需常驻）、IntentExtractor
  intake 整层、治理 Gateway、死代码清单；保留 git-commit 机会性进化（PluginOpportunisticEvolution）、
  EvolutionGateway/RecipeProductionGateway。
- prime 直调正常向量语义、无主体用 Plugin 本地向量语义全质量；对外去除 intentKind；bootstrap 交互不变、
  仅数据本地临时缓存；删 daemon 波及 alembic_dashboard/runtime/status 三工具（已确认处置）；验收仅 claude-code 版本。
- 产品改动提交各自仓库 main、不开分支；Design 文档提交由控制器评审后进行。

PDR-0 两项实现期复核（非阻塞）：CacheCoordinator 去留、本地 Recipe 语义区向量是否已进程内构建（若需补索引
触及 Core 则停并回报用户）。

停止条件：遇 hard gate、需人裁的缺证据、或超出确认设计的发现，停并回报。
```
