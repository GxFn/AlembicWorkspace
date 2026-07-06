# AlembicPlugin 完整实现深挖：实现逻辑、功能、架构层级与设计模式

> 本文档系统性挖掘 `AlembicPlugin` 仓库的**完整代码实现**，逐层记录其实现逻辑、对外功能、架构分层与设计模式，供工程师仅凭本文即可理解整个插件运行时的实现全貌。

## 文档元信息

| 项 | 值 |
| --- | --- |
| 目标仓库 | `AlembicPlugin`（npm 包名 `alembic-codex-plugin-runtime`，v0.2.0） |
| 仓库定位 | Alembic 知识内核在 **Codex + Claude Code 双宿主** Agent 中的嵌入式插件运行时（MCP 工具表面 `alembic_*`） |
| 远端 | `https://github.com/GxFn/AlembicPlugin.git` |
| 测绘基线 commit | `c1d0daa`（main） |
| 代码规模 | `lib/**` 共 **208 个 TS 文件 / ≈ 62,600 LOC**（另含 `scripts/`、`plugins/`、`config/`、`skills/`、`templates/`） |
| 技术栈 | TypeScript(ESM, `.js` 后缀)、Node ≥ 22、`better-sqlite3`、Zod、Vitest、Biome；依赖 `@alembic/core`（共享内核，`file:../AlembicCore` / 发布期 pin `@alembic/core@0.2.0`） |
| 编写日期 | 2026-07-02 |
| 归档位置 | `wakeflow-ledger/AlembicPlugin/` |

## 测绘方法

本文由多 Agent 并行深读源码合成：12 个测绘 Agent 各负责一个子系统，逐文件真实 `Read` 源码后写出带 `file:line` 引用的详尽章节；再由综合 Agent 基于全部子系统摘要写「架构总览」（第 0 章），并交叉核对关键事实（工具计数、imports 分层、Node/ESM/daemon-less 边界）；最后由完整性审查 Agent 对照 `lib/**` 全量文件清单查漏，补测绘 `SetupService` 与 `knowledge-context-tools` 输出层（第 12 章）。所有 `file:line` 引用相对仓库根，基线为 commit `c1d0daa`；行号会随后续提交漂移，引用后请以当前源码为准。

## 阅读指引

- **只想要全景**：读第 0 章（架构总览、模块地图、对外工具全景、端到端数据流、设计模式目录、双宿主模型、数据持久化、历史包袱）即可。
- **按分层深入**：第 1–12 章按 `package.json` 的 subpath imports 分层自外向内组织（分发/打包 → 启动/DI → 基础设施 → MCP 表面 → handlers → 宿主适配 → 知识检索 → 服务子域 → Recipe 规划 → Recipe 进化 → 工作流/配置 → 补遗）。
- **边界红线**：本仓库是「宿主 ↔ `@alembic/core` 内核」之间的适配/门面层，**不实现知识算法、不在进程内跑本地 AI 提取**（host-agent-managed）；相关硬边界见第 0.9、6、8、10 章。

## 目录

- [0. 架构总览与设计全景](#0-架构总览与设计全景)
- [1. 分发、构建与双宿主打包层](#1-分发构建与双宿主打包层)
- [2. 启动引导与依赖注入层 (Bootstrap + DI)](#2-启动引导与依赖注入层-bootstrap--di)
- [3. 基础设施与共享层 (Infrastructure + Shared + Types)](#3-基础设施与共享层-infrastructure--shared--types)
- [4. MCP 服务器与工具表面层](#4-mcp-服务器与工具表面层)
- [5. 工具处理器与路由层 (MCP Handlers)](#5-工具处理器与路由层-mcp-handlers)
- [6. 宿主适配与运行态上下文层](#6-宿主适配与运行态上下文层)
- [7. 项目知识上下文与检索层 (Project Knowledge Context)](#7-项目知识上下文与检索层-project-knowledge-context)
- [8. 模块/技能/常驻/任务/演化服务层](#8-模块技能常驻任务演化服务层)
- [9. Recipe 规划层 (plan-tool / plan-confirm / gate / anchoring)](#9-recipe-规划层-plan-tool--plan-confirm--gate--anchoring)
- [10. Recipe 冷启动 / 进化 / git-diff 维护工作流层](#10-recipe-冷启动--进化--git-diff-维护工作流层)
- [11. 工作流能力、配置、技能资源与数据模型](#11-工作流能力配置技能资源与数据模型)
- [12. 工作空间初始化与知识上下文输出层(补遗)](#12-工作空间初始化与知识上下文输出层补遗)

---

## 0. 架构总览与设计全景

### 0.1 一句话定位与生态位置

**AlembicPlugin(`alembic-codex-plugin-runtime`)是 Alembic 知识内核在 Codex 与 Claude Code 两个宿主 Agent 中的"嵌入式插件运行时"——它不实现知识算法，只把 `@alembic/core` 的能力接线成一套对宿主 Agent 暴露的 MCP 工具表面(`alembic_*`),并负责双宿主打包、冷启动引导、运行态门禁与 Recipe 生成/进化的编排。**

它在 Alembic 生态中的位置:

- **对上游 `@alembic/core`(内核仓库)**:纯消费方。所有知识/搜索/图谱/演化/守卫/生命周期的**真实算法与数据模型都在 Core**,本仓库经 `@alembic/core` 子路径包入口导入,绝不复制 Core 实现、绝不绕过包入口直引 `../AlembicCore/src/**`。开发期依赖 `file:../AlembicCore`,便携发布包 pin 精确版本 `@alembic/core@0.2.0`。
- **对宿主 Agent(Codex / Claude Code)**:本仓库是"宿主 ↔ 内核"之间的**适配与门面层**。宿主主 Agent(会真正读写代码、跑 AI 分析)通过 stdio MCP 调用 `alembic_*` 工具;Recipe 的**内容生成由宿主 Agent 完成**(host-agent-managed),插件侧只做确定性的编排、门禁、事实收集与投影,**不在插件进程内跑本地 AI 提取**(这是一条被类型层强制的核心边界)。
- **对 Dashboard**:Dashboard 前端**已迁出**到独立仓库 `AlembicDashboard`。本仓库不再新增 Dashboard 源码;仅保留 `express`/`socket.io` 作为常驻服务/进度事件通道的可选后端依赖。
- **发布形态**:两套宿主壳(`plugins/alembic-codex` 的 `.codex-plugin` 格式 + `plugins/alembic-claude-code` 的 `.claude-plugin` 格式)共享同一份 `dist/` runtime,经便携 npm 包 `@gxfn/alembic-runtime` 交付。

### 0.2 分层架构总图(subpath imports 分层)

分层由 `package.json` 的 `imports` map 编码,每层用一个 `#` 别名锚定物理目录,并用 `alembic-dev`(→`lib/` TS 源)/`default`(→`dist/` JS 产物)双条件解析,让开发直接跑 TS、生产跑编译产物。依赖方向自下而上单向收敛:

```text
（宿主壳 / bin）  plugins/*/bin/alembic-start.mjs · bin/host-mcp.ts
        │  spawn / stdio
        ▼
#codex/*  →  lib/runtime/*        【L1-L3 运行态 + MCP 表面】
        │  MCP 服务器(McpServer / HostMcpServer)、host-adapter 双宿主、
        │  工具声明/schema/output-contract、handlers、host 内嵌执行器、
        │  状态/引导/preflight/诊断
        │        依赖 ▼
#recipe-generation/*  →  lib/recipe-generation/*   【Recipe 编排层】
        │  plan-tool / plan-confirm / plan-generation-gate、
        │  host-agent-workflows(cold-start/rescan/dimension-completion)、
        │  evolution(git-diff-checkpoint/commit-driven maintenance)、
        │  bootstrap 进度、vector embedding wiring
        │        依赖 ▼
#workflows/*  →  lib/workflows/*   【工作流能力】
        │  维度完成收尾终结器、Skill 生成能力
        │        依赖 ▼
#inject/*  →  lib/injection/*      【DI 容器】
        │  ServiceContainer(字符串 key service locator + 惰性单例)、
        │  ServiceMap(类型表)、8 个 module(Infra/Knowledge/Vector/
        │  Signal/App/Guard/SkillHooks)、getCoreRepositories 桥接
        │        依赖 ▼
#service/*  →  lib/service/*        【应用服务】
        │  module/skills/resident/task/cleanup/knowledge freshness、
        │  project-knowledge-context(graph/recipe-map/search provider)
        │        依赖 ▼
#infra/*  →  lib/infrastructure/*   【基础设施】
        │  AppConfigLoader(覆写 Core 包根)、SqliteDatabaseAccess(raw
        │  better-sqlite3 收口)、Audit(Drizzle)、Cache
        │        依赖 ▼
#shared/*  →  lib/shared/*          【共享底座】
           package-assets(PACKAGE_ROOT 锚点)、schemas(mcp-tools/
           http-requests Zod 契约)、project-scope-runtime、shutdown、
           types(search-wire/graph-shared)
           ─────────────────────────────────────────
           横向依赖:所有层 →  @alembic/core（包入口，单向消费）
```

要点:

- **`#codex/*` 是保留兼容别名**,当前解析到 `lib/runtime/*`——不代表存在旧 Codex 目录分层,不要据此新增目录。
- **依赖方向严格单向**:`#shared` 不依赖 runtime(schema 内联 `AgentHostSchema` 以免反向依赖);`#service`/`#infra` 不 import MCP 表面;门禁脚本 `lint:layer-boundary`/`lint:scope-resolution` 强制此方向。
- **`@alembic/core` 是所有层的横向底座**,但只经包入口子路径消费(`@alembic/core/knowledge`、`/search`、`/evolution` 等),`lint:consumer-core-imports` 用 `config/core-import-boundary-allowlist.json`(30 个允许子路径)守住这条边界。

### 0.3 模块地图

| 层 | 目录 | 核心职责 | 对外工具 / 入口 |
| --- | --- | --- | --- |
| 分发/打包 | `plugins/`、`scripts/`、`packages/alembic-runtime` | 双宿主壳(Codex/CC)、构建链、便携包物化、真装边界验证、dev 注入 | `bin/host-mcp.ts`、`plugins/*/bin/alembic-start.mjs`、`npm run build`/`release:codex-plugin` |
| Bootstrap+DI | `lib/bootstrap.ts`、`lib/injection/` | 分步启动状态机、DI 容器、8 module 装配、Core repository 桥接 | `Bootstrap.initialize()`、`ServiceContainer.initialize()`、`container.get<K>()` |
| 基础设施/共享 | `lib/infrastructure/`、`lib/shared/`、`lib/types/` | 配置合并、raw SQLite 收口、审计、缓存、Zod 契约、路径锚点、优雅停机 | `AppConfigLoader.load`、`TOOL_SCHEMAS`、`resolveProjectScopeRuntime`、`shutdown.install` |
| MCP 服务器/工具表面 | `lib/runtime/mcp/` | 两个 MCP server、工具声明+catalog、clean-output-contract、错误分类、zod→MCP schema | `startMcpServer`、`startHostMcpServer`、`serializeMcpToolResult`、`wrapHandler` |
| 工具处理器/路由 | `lib/runtime/mcp/handlers/` | 各 `alembic_*` 工具的 handler、tool-router、submit 提交管线、guard 执行、检索管线 | HANDLER_MAP、`routeSearchTool`/`routeSubmitKnowledgeTool`、`primeHandler`/`codeGuardHandler` |
| 宿主适配/运行态 | `lib/runtime/host-adapter/`、`lib/runtime/runtime/`、`lib/runtime/{status,preflight,diagnostics,host-agent,ide-agent}` | L1-L3 host 身份、tool 可见性门禁、状态/引导契约、preflight、诊断、进程内执行器 | `resolveHostAdapter`、`preflightTool`、`buildStatus`、`EmbeddedToolExecutor.execute` |
| 项目知识上下文/检索 | `lib/service/project-knowledge-context/` | graph/recipe_map/search 的 provider 投影引擎(ProjectContext→输出契约)、打分/重排/预算裁剪 | `resolveAlembicGraph`、`resolveRecipeMap`、`listRecipeCandidates`、`rerank` |
| 模块/技能/常驻/任务/演化服务 | `lib/service/{module,skills,resident,task,cleanup,knowledge}/`、`lib/repository/` | canonical 模块轴、Project Skill 写入、常驻 HTTP 客户端、prime 检索/信任姿态、清理、freshness | `ModuleService.listCanonicalModules`、`ProjectSkillService.upsert`、`PrimeSearchPipeline.search`、`CleanupService` |
| Recipe 规划 | `lib/recipe-generation/plan-tool.ts` 等 | `alembic_plan` draft/confirm、生成门禁+租约、ProjectContext 锚定、canonical 模块轴纯函数 | `routePlanTool`、`draftPlan`/`confirmPlan`、`resolvePlanGenerationGate` |
| Recipe 冷启动/进化/维护 | `lib/recipe-generation/host-agent-workflows/`、`lib/recipe-generation/evolution/` | 冷启动生成管线、维度完成、增量重扫、证据门、commit 驱动维护、embedding sim provider | `runHostAgentColdStartWorkflow`、`runProjectIndexWorkflow`、`runCommitDrivenMaintenance` |
| 工作流能力/配置/资源 | `lib/workflows/`、`config/`、`skills/`、`templates/` | 维度完成终结器、Skill 生成、门禁清单(边界/漂移/错误码/命名)、宿主技能说明书、种子模板 | `runWorkflowCompletionFinalizer`、`generateSkill`、`check:shared-asset-drift` |

### 0.4 对外 MCP 工具能力全景

工具表面在 `lib/runtime/mcp/tools.ts` 声明为 **19 个 agent 工具 + 1 个 admin 工具**,输入 schema 单源自 `lib/shared/schemas/mcp-tools.ts`(Zod),经 `zodToMcpSchema` 转成对外 `inputSchema`、同一份 Zod 又经 `wrapHandler` 做对内校验。元数据(owner/tier/gateway/knowledgeGate)集中在 `PluginToolSurfaceCatalog`。按能力分组:

- **知识 / 上下文检索**
  - `alembic_prime` — Agent-facing 任务预热:检索相关 Recipe/规则 + 信任姿态引擎(5 层 trust posture + 2 道信任门 + 反空收据),产出稳定投影 `PrimePublicPackage`。
  - `alembic_search` — 多 lane 融合检索(resident / recipe-region 向量 / 关键词)+ 相关性四路由直接命中门禁 + get/expand 详情。
  - `alembic_recipe_map` — 有界 ProjectContext region + 确定性 Recipe 挂载(只读 source-refs/metadata,不搜索),20KB 预算裁剪。
  - `alembic_graph` — ProjectContext 支撑的结构/源码/依赖关系图(按 queryKind 分派 strategy),Recipe-free 投影。
  - `alembic_submit_knowledge` — 唯一知识写入面:限流→内容质量门→证据门→`RecipeProductionGateway.create`→freshness→多字段投影。
- **Guard(代码守卫)**
  - `alembic_code_guard` — Agent-facing 守卫:check/audit/review(review 轮次状态机 MAX=5 + 内联 recipe 修复指南)/scanProject,复用 `GuardCheckEngine` 单例。
- **Recipe 生成 / 进化(host-agent 工作流)**
  - `alembic_plan` — 生成前置:draft(收集真实 projectInfoTree + candidateDimensions)→confirm(产出 PlanSelection),是所有生成的强制前置门。
  - `alembic_bootstrap` — 冷启动 Recipe 生成管线(plan 门→cleanup→事实收集→Mission Briefing→预算化),host-agent-only。
  - `alembic_rescan` — 增量重扫(保留 Recipe+重建索引→覆盖 seed→gap 建议→commit 驱动进化)。
  - `alembic_dimension_complete` — 维度完成:过证据门→绑定 Recipe 打标→建 Skill→写 per-(模块×维度)覆盖账本。
  - `alembic_evolve` — 批量进化决策状态机(propose_evolution/confirm_deprecation/skip),经 `EvolutionGateway.submit`。
  - `alembic_consolidate` — 待审语义合并(keep/merge/reject)。
- **状态 / 引导 / 本地运维**
  - `alembic_status` — 项目/工作区/knowledge/daemon(daemon-less 合成 stopped)/onboarding 聚合。
  - `alembic_init` / `alembic_job` / `alembic_runtime`(codex-local 三工具)— 按需初始化、in-process job、运行时诊断。
- **技能交付**
  - `alembic_project_skill` — Project Skill 运行时投影/receipt 交付。
- **Admin(1)**
  - `alembic_knowledge_lifecycle` — 知识生命周期管理(仅 reactivate 有权限门)。

### 0.5 端到端关键数据流

#### (a) 冷启动 Recipe 生成(`alembic_bootstrap`)

```text
宿主 Agent tools/call(alembic_bootstrap)
  → HostMcpServer.handleToolCall → 项目根解析+trust(host-adapter) → preflight 门禁
  → EmbeddedToolExecutor / local dispatch → HANDLER_MAP → bootstrapForHostAgent(handlers/host-agent)
  → #recipe-generation/host-agent-workflows/project-index.runProjectIndexWorkflow(full)
  → resolvePlanGenerationGate(强制 planSelection+阶段+lease/epoch)          【无 plan 则 PLAN_REQUIRED 阻断,附 draft/confirm nextActions】
  → CleanupService(可选 trash 归档)
  → ProjectContextCapabilities.execute(Core)：分层事实收集(space→repo→map→module→file)
  → buildProjectContextMissionBriefing + attach(RecipeAuthoringFrontLoad/completeness critic/onboarding)  【指南==门禁,单源 Core RecipeAuthoringSpec】
  → trimColdStartBriefingToBudget(逐级瘦身;超 18KB→writeTransientTransport 落盘 fullBriefingRef)
  → serializeMcpToolResult(clean-output-contract 投影) → 返回宿主 Agent 去真正写 Recipe
```

#### (b) `alembic_prime` / `alembic_search` 检索

```text
宿主 Agent tools/call(alembic_prime|alembic_search)
  → server CallTool → wrapHandler(zod 校验 TOOL_SCHEMAS)
  → primeHandler / search handler(handlers/*)
  → getSearchEngine(DI 单例) + 三 lane：ResidentSearchClient(HTTP,可无) / vectorService.hybridSearch(recipe-region) / SearchEngine.search(Core 关键词)
  → resolveSearchResult 仲裁 + mergeSearchResultItems
  → DefaultRecipeCandidateProvider.scoreCandidate(query/keyword/多维过滤 → scoreBreakdown/whyMatched)
  → DefaultVectorRerankProvider.rerank(覆盖向量分) → ResultRanker/ContextBudgeter 裁剪 → RefRegistry detailRef 化
  → (prime)buildPrimeKnowledgeMaterial(信任门+5 层 trust posture+反空收据+第一人称喊话)
  → assessSearchRelevance 四路由门禁 + retrievalMayBeStale 诊断(读 git-diff checkpoint,stale→建议 alembic_rescan)
  → createAlembicSearchMcpResult / buildPrimePublicPackage(带 summary 逐字门禁) → 返回
```

#### (c) `alembic_code_guard` 校验

```text
宿主 Agent tools/call(alembic_code_guard)
  → codeGuardHandler(handlers/agent-public-tools) → resolveCodeGuardScope(code/files/workRef) → preflight 阻塞
  → executeScopedCodeGuard → guardHandlers.guardCheck/guardReview(复用 handlers/guard)
  → GuardCheckEngine(Core,单例复用) + detectLanguage + resolveEnhancementGuardRules(Enhancement 规则幂等注入)
  → (review 分支)review-round 状态机 MAX=5,内联 recipe 修复指南
  → projectGuardBusinessPayload → createAgentPublicToolOutput(clean envelope) → 返回违规/审阅结果
```

#### (d) commit 驱动的 git-diff 维护/进化

```text
工具调用尾部 surface / alembic_rescan 触发
  → runCommitDrivenMaintenance(CommitDrivenMaintenance)
  → DurableGitDiffCheckpointRouting.runtime 读游标 previousHead(git_diff_checkpoints 表)
  → GitDiffScanner.scanOnce(worktree diff + HEAD range: ancestor/non-ancestor/unavailable → FileChangeEvent;signature hash + scale-guard 截断)
  → shouldRoute 守卫(resident 去抖)
  → HostAgentFileChangeHandler.handleFileChanges(commit-range diff)
       ├─ 既有 Recipe 的 source-ref 修复
       ├─ update 提案 / deprecate 提案 → EvolutionGateway.submit(Core,assessFileImpact)
       └─ created→moduleMining 已退役只计数
  → recordRouteOutcome → 推进 git_diff_checkpoints 游标(routed/catch-up-routed/skipped/failed/truncated/...)
  ── 严格隔离：commit 维护写 git_diff_checkpoints,覆盖账本写 evolution_coverage_ledger,两表 D3 铁律互不触达 ──
```

其中 tick-on-access 生命周期(`staging-access-sweep`)在工具调用时顺带驱动 4 个 Core driver(promote/checkTimeouts/proposal/decay),共享 cap + in-flight 去重,**判定全在 Core**,插件只做有界节流触发——这是 daemon-less 演进后替代常驻 daemon 的机制。

### 0.6 设计模式目录

| 模式 | 作用 | 代表落点 |
| --- | --- | --- |
| DI / service locator + lazy singleton | 字符串 key 类型安全解析、首次 get 才实例化 | `ServiceContainer.get<K>()` + `ServiceMap` 类型表 + 8 module 工厂 |
| host-adapter(adapter+strategy+factory) | 收敛所有 host-specific 身份操作,host-name 分支只在工厂出现 | `resolveHostAdapter`/`hostAdapterForShape` + Codex/ClaudeCode 两实现 |
| provider 组合(interface+Default+注入 deps) | 引擎无 DB/无 MCP 表面即可单测 | project-knowledge-context 全子域(`RecipeMapDeps` 注入 resolveRegion/querySourceRefs/listRecipes) |
| pipeline / decorator | 分层事实收集、装饰器链、校验→handler→输出收敛 | Mission Briefing `attach*` 链、`wrapHandler` 装饰、search runSearchPipeline |
| gateway / 门禁 | 生成/写入/进化前的强制前置校验 | `RecipeProductionGateway`/`EvolutionGateway`/`resolvePlanGenerationGate`/证据门/内容质量门/RateLimiter |
| registry / 单源清单 | 工具元数据、投影器、门禁事实来源集中 | `PLUGIN_TOOL_SURFACE_CATALOG`、`registerMcpOutputProjector`、`config/*.json` 门禁清单 |
| state-machine(常带 reasonCode) | 生命周期与决策全带枚举理由码 | Bootstrap 分步、`ToolPolicy` 7 态、guardReview 轮次、`TaskLifecyclePolicy`、游标状态映射 |
| clean-output-contract | 所有工具输出经统一投影/回退链,禁未投影漏出 | `serializeMcpToolResult` + 投影器 + `CLEAN_OUTPUT_PROJECTOR_MISSING` 硬门禁 |
| strategy + graceful degrade | 择道 + 逐级降级不抛 | vectorStore(HNSW→JSON)、embed(Ollama→keyword baseline)、simProvider(向量→Jaccard)、canonical 模块三级回退 |
| observer / event-driven | 知识变更刷索引、信号驱动进化 | EventBus `knowledge:changed`→refreshIndex、SignalBus/Bridge/Aggregator、`proposalExecutor.subscribeToSignals` |
| adapter+bridge(Core→plugin DI) | Core repository bundle 桥成 plugin 单例 | `getCoreRepositories(ct)` + `registerRepositories` |
| compatibility shim / re-export | 旧路径别名转发到 canonical 实现 | RG9/P12 shim:`lib/runtime/mcp/host-agent-workflows/*`、`lib/runtime/ide-agent/*`、`lib/service/{bootstrap,evolution,vector}/*` |
| discriminated-union / schema-first | 编译期事件与输入校验 | `DimensionCompletePayload`(7 变体)、Zod `.strict()`+superRefine 门禁 |

### 0.7 双宿主(dual-host)模型

核心不变量:**host id(`codex` / `claude-code`)只允许出现在 L3 适配层**,更上层一律 host-agnostic。

- **唯一分支点**:`resolveHostAdapter(env)`(按 `ALEMBIC_PLUGIN_HOST` 期望值)与 `hostAdapterForShape(shape)`(按物理 shell 形态)是 5 层架构中**唯一允许 host-name 分支的工厂**。`detectPluginHostShape(pluginRoot)` 以 shell 形态作为 host identity 的权威来源(env 只是期望值,形态是事实)。
- **契约隔离**:`HostAdapter`(L3 契约)收敛所有真 host-specific 的工作区身份簇——env 读取、项目根解析、init-marker、清单路径、arg 归一、空资产健康判定。两个实现(`CodexHostAdapter`/`ClaudeCodeHostAdapter`)把身份簇委托给 L1 共享函数,专属面只剩 `hostId`/`setupProfile`/`allowsEmptyPluginAssets`/清单路径/arg 归一;Claude Code 额外信任 `CLAUDE_PROJECT_DIR`。
- **表面统一**:两宿主共享**同一份工具 schema signature**(`cross-host-readiness` 证明无分叉),`AGENT_HOSTS` 双宿主枚举贯穿 prime/work/code_guard 契约。有意分叉只在**技能说明书**(`SKILL.md` 用 `wakeflow-shared` 共享段 + `wakeflow-host:plugin` overlay)和宿主壳清单格式(`.codex-plugin` vs `.claude-plugin`)。
- **打包对称**:`plugins/alembic-codex` 与 `plugins/alembic-claude-code` 两 shell 同源(`alembic-start.mjs` 694 行零依赖引导器),都 spawn 同一 `dist/bin/host-mcp.js`。

### 0.8 数据与持久化

- **单一 SQLite,与 Core 共享**:项目数据落在项目 `.asd/alembic.db`(daemon-less 后所有 job/rescan/生成都是 in-process,同库)。数据模型(`knowledge_entries`/`recipe_source_refs`/`evolution_coverage_ledger`/`git_diff_checkpoints`/`evolution_proposals` 等)**全部经 `@alembic/core/repositories` 的 `AlembicRepositoryBundle` 消费**,由 `getCoreRepositories(ct)` 桥接进 DI。
- **plugin 侧唯一 raw 收口**:`lib/infrastructure/database/SqliteDatabaseAccess.ts` 是 plugin 绕过 repository 直接触 better-sqlite3 的**唯一收口点**,只做三类事:只读状态探测(`readSourceRefState`/`readSnapshotState`,喂 `alembic_status`)、破坏性维护清理(`clearTables`/`deleteByLifecycle`,FK 顺序敏感 + fail-closed)、JSONL 导出。标识符经白名单 `assertSqlIdentifier` 防注入,值参数化。业务读写一律走 Core repository,不走这条旁路。
- **配置分层**:`AppConfigLoader` 以 import 副作用覆写 Core `ConfigLoader._findPackageRoot` 为 plugin `PACKAGE_ROOT`,复用 Core 的 default→env→local 三层深合并 + 非阻塞 Zod;运行期再叠加 dataRoot 的 `.asd/config.json`(vector/guard 段)深合并。
- **两表严格隔离(D3 铁律)**:覆盖账本(`evolution_coverage_ledger`,记 module×dimension 覆盖网格)与 commit 游标(`git_diff_checkpoints`,记维护推进)绝不互相触达,是覆盖收敛与提交维护两条独立生命周期的边界。

### 0.9 历史包袱与边界

- **daemon-less 演进(PDR-3)**:独立常驻 daemon 已删除。`HostMcpServer` 用 `buildStoppedDaemonStatus` 合成 `stopped` daemon 状态喂给依赖方;job 经 in-process `JobStore` 同步跑;常驻能力用 `AlembicResidentServiceClient`(HTTP,可无)+ in-process 兜底。生命周期靠 **tick-on-access sweep** 在工具调用时有界驱动,取代了 daemon 的后台 tick。
- **本地 Agent / Tool / AI runtime 已删除边界(硬红线)**:`@alembic/agent`、`#agent/*`、`#tools/*`、`#external/ai/*`、`lib/agent/**`、`lib/tools/**`、`lib/external/ai/**` 全部退役。插件**不在进程内跑本地 AI 提取**——Recipe 内容生成是 host-agent-managed。`host-managed-boundary` 用类型层字面量 `false` 强制"无本地 AI provider"不变量;`scripts/report-agent-extraction-boundary.mjs` 保留旧字符串仅作删除边界审计,**不得据此恢复本地 runtime**。`ContextualEnricher` 恒 null、`SkillHooksModule` 明确不再注册本地 agent/terminal runtime 都是此边界的残留标记。
- **god-file**:`lib/recipe-generation/plan-tool.ts`(约 1589 行)与 `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`(约 4289 行)是两处已知承重巨石,拆分是识别中的技术债但未完成。
- **shim / re-export 重复(RG9/P12)**:同一 canonical 实现存在两条路径——`lib/runtime/mcp/host-agent-workflows/*`、`lib/runtime/ide-agent/*`(IDEAgent→HostAgent 别名)、`lib/service/{bootstrap,evolution,vector}/*` 都是**一行 re-export shim**,真实逻辑在 `#recipe-generation/*`。阅读时以 `#recipe-generation/<file>.js` 具名导入为准,shim 只为向后兼容旧 import 路径存在。
- **legacy envelope**:`lib/runtime/mcp/envelope.ts` 的 v2 envelope(success/errorCode/message/data/meta)是历史包袱,由 clean-output-contract 的 legacy 分支收敛,新工具一律走 clean schema。
```

---

## 1. 分发、构建与双宿主打包层

本节测绘 `alembic-codex-plugin-runtime` 仓库的顶层身份、构建/发布管线、以及 Codex 与 Claude Code 两个宿主插件的打包与分发脚本。这一层的核心命题是：**同一份 TypeScript 源码 (`lib/`) 经 `tsc` 编译成 `dist/`，被打成一个宿主中立的 npm runtime 包 `@gxfn/alembic-runtime`，再由两个轻量 marketplace shell (Codex / Claude Code) 在用户首次启动时按需拉取、缓存并 exec 成一个 MCP stdio 服务**。本仓库根包 (`alembic-codex-plugin-runtime`) 永远 `private:true`、绝不直接发布到 registry；发布物只有 shell + 元数据 + 那一份 pinned runtime 包。

---

### 1.1 顶层身份与仓库契约

#### 1.1.1 根 `package.json`

`package.json:1-10` 定义身份：`name=alembic-codex-plugin-runtime`、`version=0.2.0`、`private:true`、`type:module` (纯 ESM，import 路径必须带 `.js` 后缀)、`main=dist/lib/bootstrap.js`、`engines.node>=22.0.0`。这是「嵌入式 runtime 制品仓库」——它本身不是分发包，而是构建源。

对外唯一的可执行入口是 `bin` 映射 (`package.json:105-107`)：`alembic-codex-mcp -> dist/bin/host-mcp.js`。这个 bin 名字 (`alembic-codex-mcp`) 在整条链路上是硬编码常量，shell 启动脚本、runtime 包 manifest、verify 脚本都以它作为契约锚点。

`files[]` (`package.json:157-181`) 声明了 `npm pack` 时会打进 tarball 的内容：`dist`、`config`、一批 `scripts/*.mjs`(仅发布相关脚本)、`skills`、`packages/alembic-runtime`、`plugins`、`templates`、`template.json`、以及 `.agents/plugins/marketplace.json`。注意：**根包的 tarball 里同时装了 dist、两个 shell 目录 (`plugins/`)、和 runtime 包边界 (`packages/alembic-runtime`)**——这是 smoke 测试模拟「从根 tarball 解出 shell 再 marketplace 安装」的物理基础 (见 §1.5.4)。

`dependencies` (`package.json:133-153`) 里最关键的一条是 `"@alembic/core": "file:../AlembicCore"`——本地开发通过 workspace 内的相对路径消费 Core 源仓库；这是一条 `file:` 依赖，因此根包**不可发布** (release boundary gate 会拦，见 §1.5.5)。其余生产依赖 (`@modelcontextprotocol/sdk`、`better-sqlite3`、`express`、`socket.io`、`web-tree-sitter`、`drizzle-orm`、`zod` 等) 与 runtime 包 manifest 完全一致。

`overrides` (`package.json:200-204`) 钉死 `minimatch`/`diff`/`glob` 的传递版本(供应链安全收口)。`lint-staged` (`package.json:205-210`) + `prepare:husky` (`package.json:101`) 提供提交前 Biome fix/format。

#### 1.1.2 subpath imports map — 分层编码 + dev/prod 双解析(核心设计模式)

`package.json:11-44` 的 `imports` 字段是这一层最重要的机制。它用 Node 原生 **subpath imports** (`#xxx/*` 前缀，只在包内部可见) 同时编码了两件事：

**(a) 目录分层别名**——把物理目录名收敛成语义别名，消费方 import `#service/foo.js` 而不写 `../../service/foo.js`：

| import key | dev (`alembic-dev` condition) | prod (`default`) |
| --- | --- | --- |
| `#shared/*` | `./lib/shared/*` | `./dist/lib/shared/*` |
| `#infra/*` | `./lib/infrastructure/*` | `./dist/lib/infrastructure/*` |
| `#service/*` | `./lib/service/*` | `./dist/lib/service/*` |
| `#inject/*` | `./lib/injection/*` | `./dist/lib/injection/*` |
| `#governance/*` | `./lib/governance/*` | `./dist/lib/governance/*` |
| `#workflows/*` | `./lib/workflows/*` | `./dist/lib/workflows/*` |
| `#recipe-generation/*` | `./lib/recipe-generation/*` | `./dist/lib/recipe-generation/*` |
| `#codex/*` | `./lib/runtime/*` | `./dist/lib/runtime/*` |

**(b) dev/prod 双解析** (adapter/strategy 模式落在 Node 条件解析上)：每个 key 有两个分支。当 Node 以 `alembic-dev` 条件运行时(即 vitest 测试或本地 dev)，`#service/*` 解析到未编译的 `lib/**` TS 源；否则(生产/已构建运行) `default` 分支解析到 `dist/lib/**` 编译产物。这样**同一份 import 语句在测试期直接吃 TS 源、在生产期吃 JS 产物**，无需两套路径。

`#codex/*` 是历史包袱兼容别名：SN5 重命名把 `lib/codex/` 改成了 `lib/runtime/`，但 `#codex` 这个 import 标识符被保留(为了不改所有消费点)，现在解析到 `lib/runtime/*`。`CLAUDE.md` 明确警告：不得据此推断存在旧 Codex 目录分层。

**跨 manifest 一致性坑**：这套 imports map 被复制到了三处 manifest——根 `package.json`、`packages/alembic-runtime/package.json`、以及 CC shell 被 dev-symlink 进去的 `.runtime/.../@gxfn/alembic-runtime/package.json`。前两者的 key 集合完全一致(8 个 key，无 `#http`)。但 CC shell `.runtime` 里那份 staged 副本 (通过 `dev:codex-plugin` 之外的路径生成) **多出一个 `#http/*` key**(`./lib/http/*`)，与两份权威 manifest 漂移。这是一处已存在的、发布前需对齐的 drift(release playbook `plugins/alembic-codex/RELEASE-PLAYBOOK.md:30-42` 要求所有版本面对齐，但 imports-map key 集合不在其显式清单里，因此漏网)。

#### 1.1.3 `tsconfig.json` — 构建与 Core 类型收口

`tsconfig.json:2-27`：`target=ES2022`、`lib=[ES2024]`、`module/moduleResolution=NodeNext`、`outDir=dist`、`rootDir=.`、`declaration:true`、`strict:true`、`isolatedModules:true`、`preserveSymlinks:true`(为了让 `file:../AlembicCore` 与 `.runtime` 符号链接下的模块解析行为可预期)。

`paths` (`tsconfig.json:16-21`) 把 `drizzle-orm` 和 `zod` 强制重定向到 `node_modules/@alembic/core/node_modules/**`——即**类型层面单源化到 Core 自带的那份 drizzle/zod**，避免本仓库与 Core 用了不同版本导致的类型漂移。`include` (`tsconfig.json:28-33`) 覆盖 `lib/bin/config/scripts` 的 `.ts`；`exclude` (`tsconfig.json:34-41`) 排除 `test`(测试由 vitest 单独走) 和 `dashboard/scratch/resources/dist`。

#### 1.1.4 `biome.json` / `.nvmrc` / `.gitmodules`

- `biome.json`：Biome 2.4.6 单工具接管 lint+format(不用 Prettier/ESLint)。格式规则:2 空格缩进、100 列、单引号、es5 trailing comma、总是分号。lint 规则里几条硬门禁：`useConst/useTemplate/useBlockStatements/useThrowOnlyError=error`(`biome.json:44-47`)、`noVar/noDoubleEquals=error`(`biome.json:50-51`)、`noConsole=warn`(仅允许 `console.warn/error`，`biome.json:55-60`)。`noExplicitAny=warn`(允许但告警)。
- `.nvmrc`：单行 `22`。配合根包 `engines.node>=22.0.0`——`MEMORY.md` 记录了 Node 18 会在 build:*-boundary / build:check 上给出假 `ERR_INVALID_ARG_TYPE` 红字，判红前必须 `nvm use 22`。
- `.gitmodules`：三个 submodule——`plugins/alembic-codex -> GxFn/AlembicCodex`(Codex shell)、`plugins/alembic-claude-code -> GxFn/AlembicClaudeCode`(CC shell)、`vendor/AlembicCore -> GxFn/AlembicCore`(Core 快照/fallback)。两个 shell 是独立可发布仓库，本仓库只提交它们的 gitlink 指针。

#### 1.1.5 `vitest.config.ts` — 测试期的 imports-map 再实现

`vitest.config.ts:4-24` 用一张 `sourceImportAliases` Map 独立复刻了 imports-map 的分层(因为 vitest 不完全走 Node 的 package imports 解析)。`resolveSourcePackageImport` (`vitest.config.ts:26-38`) 是一个自定义 Vite 插件的 `resolveId` 钩子(`enforce:'pre'`)：把 `#service/foo.js` 正则拆成 alias+subpath，映射目录后把 `.js` 后缀换回 `.ts`，解析到 `lib/service/foo.ts`。`resolve.conditions=['alembic-dev']` (`vitest.config.ts:51`) 让测试期激活 dev 分支。这张 Map 比 package.json 多列了 `agent/domain/external/http/platform/repo/sandbox/tools/types` 等别名(其中 `codex->runtime`、`infra->infrastructure`、`inject->injection` 与 package.json 一致)——这些多出来的别名是给 `lib/` 内部更细的目录用的测试期解析,不出现在发布 imports-map 里。coverage 门槛(`vitest.config.ts:63-68`)：branches/functions 75%、lines/statements 80%,排除 `index.ts` 和 `bootstrap.ts`。

**设计模式落点**：dev/prod 双解析 = strategy(按运行条件选源目录);vitest 插件 = adapter(把 Node imports 语义翻译成 Vite resolveId)。

---

### 1.2 MCP 入口 shim — `bin/host-mcp.ts`

`bin/host-mcp.ts` 是 runtime 包 bin 指向的真实入口(编译成 `dist/bin/host-mcp.js`)。它是一个「轻量 shim」：立即能列工具，只有工具真正需要 Core 时才起/连 daemon。执行流程(全程用 top-level `await import` 动态加载，避免启动时把重依赖全拉进来):

1. `bin/host-mcp.ts:10-11`：`resolveHostAdapter().ensureRuntimeEnvironment()`——这是**双宿主适配的第一个连接点**。`resolveHostAdapter` 从 `../lib/runtime/index.js` 导出(见 `lib/runtime/index.ts:7`,再导出 `CodexHostAdapter`/`ClaudeCodeHostAdapter`/`HostAdapter`)。DH-2(RC-2) 注释说明:host env 初始化经 L3 HostAdapter,codex 单实现逐行委托旧的 `ensureRuntimeEnvironment`,行为不变;DH-3 起按**物理 shell 形态**选 codex/cc adapter。这是 facade+strategy:一个 `resolveHostAdapter()` 门面按环境选出具体宿主策略。
2. `bin/host-mcp.ts:13-25`：进程级 `uncaughtException`/`unhandledRejection` 兜底,写 stderr 并 `exit(1)`。
3. `bin/host-mcp.ts:27-32`：加载 `../lib/shared/shutdown.js` 与 `@alembic/core/events` 的 `timerRegistry`,注册优雅关闭钩子(dispose timers)。**这是与 @alembic/core 的第一个消费点**:`@alembic/core/events` 子路径,用途=拿到全局 timer registry 以便关停时清理。
4. `bin/host-mcp.ts:34-44`：动态 import `../lib/runtime/mcp/HostMcpServer.js` 的 `startHostMcpServer()`,启动成功后注册 `server.shutdown()`,失败则写 stderr `exit(1)`。

`HostMcpServer` 的 `startHostMcpServer`/`handleToolCall`/`shutdown` 是整个 MCP 表面的门面,但其内部实现属于相邻子系统(runtime/mcp 层),本节只点名不展开——它是 verify/smoke 脚本的被测入口(见 crossLinks)。

---

### 1.3 构建链 — build:core → clean-dist → tsc → postbuild

根 `package.json:46-49` 定义构建脚本:
```
build      = npm run build:core && node scripts/clean-dist.mjs && tsc
build:check= npm run build:core && tsc --noEmit
build:core = node scripts/build-core.mjs
postbuild  = node scripts/postbuild.mjs
```
注意:`tsc` 结束后 npm 生命周期自动触发 `postbuild`。整条链是一个 pipeline:先构 Core 的 dist,再清本仓库旧 dist,再 tsc 出新 dist,最后 postbuild 打 shebang + 记录 freshness 指纹。

#### 1.3.1 `scripts/build-core.mjs` — 先构建 Core dist

`scripts/build-core.mjs:7`：`resolveCoreSource()` 找到 Core 源(见 §1.6);`:8-16` 用 `spawnSync('tsc', ['-p', <core>/tsconfig.json])` 在 Core 目录里跑 tsc(`HUSKY=0` 关掉钩子),`stdio:inherit`。失败即 throw(`:18-20`);成功打印用了哪个 Core 源及其 commit(`:22`)。**为什么必须先构 Core**:本仓库消费的是 `@alembic/core` 的 `dist/`(不是 TS 源),Core 若没先构,本仓库 tsc 会找不到类型/产物。

#### 1.3.2 `scripts/clean-dist.mjs`

`scripts/clean-dist.mjs:4-6`：极简——`rm -rf <cwd>/dist`。作用是保证每次全量重建,避免旧产物残留(与 postbuild 的 freshness 指纹配套:clean 会连 `.build-manifest.json` 一起删)。**坑**:它用 `process.cwd()` 而非脚本自身路径,所以必须从仓库根跑(npm scripts 天然满足)。

#### 1.3.3 `scripts/postbuild.mjs` — shebang + stale-dist 指纹(QD1 门禁)

`scripts/postbuild.mjs:20-33`：对 `dist/bin/host-mcp.js`,若开头无 `#!` 则前置 `#!/usr/bin/env node`,并 `chmod 0755`(让它可作为 bin 直接执行)。失败只 warn 不中断(`:29-32`)。

`scripts/postbuild.mjs:39-46`：**QD1 stale-dist gate 的写入端**——把本次构建所依据的源码指纹写进 `dist/.build-manifest.json`(`{kind:'AlembicDistBuildManifest', version:1, sourceHash: computeSourceHash(repoRoot)}`)。`computeSourceHash` 来自 `scripts/lib/runtime-pack-freshness.mjs`。这个 manifest 后续被 prepare/pack 的 freshness gate 读取:如果打包时源已改但 dist 没重建,gate 会大声失败。该文件写在 `dist/` 下(每次 clean 会清),且被排除出打包制品(见 `runtime-pack-freshness.mjs:13-16` 的 `DIST_METADATA_BASENAMES`)。

#### 1.3.4 `scripts/lib/runtime-pack-freshness.mjs` — 两个确定性内容哈希

纯工具模块,永不被 runtime 引用。提供两个哈希:
- `computeSourceHash(repoRoot)` (`:62-76`)：对 `lib/` + `bin/` 下所有 `.ts/.tsx` + `tsconfig.json` 做排序后的 sha256(`hashFileList` `:41-54` 逐文件 hash 相对路径+长度+内容)。**故意排除 package.json**,以免改脚本/keyword 误判 dist 陈旧。这是「build 输入指纹」。
- `computeDistContentHash(distDir)` (`:83-89`)：对 dist 内实际会发运的文件(跳过 `.d.ts` 和 `DIST_METADATA_BASENAMES`)做同样的 sha256。这是「.tmp 包新鲜度 pin」,写进 runtime 包边界元数据(见 §1.5.2)。

`walkFiles` (`:18-39`) 排序遍历(localeCompare),保证跨平台确定性。

---

### 1.4 两个宿主插件目录 — Codex vs Claude Code

本仓库有两个并列的、**per-host 的 marketplace shell**(用户 2026-06-12 决策:每个 shell 只归属一个宿主),都是独立 submodule。核心共性:两者都是「轻量 shell」,**不含 runtime 代码**,只含 manifest + `bin/alembic-start.mjs` 引导脚本 + skills;真正的 runtime 是那个 pinned npm 包 `@gxfn/alembic-runtime@0.2.0`,首次启动时按需装进可写缓存后复用。

#### 1.4.1 Codex shell (`plugins/alembic-codex/`)

Codex 走的是 Codex 自己的 `.codex-plugin` 插件格式:

- `plugins/alembic-codex/.codex-plugin/plugin.json`：Codex 插件 manifest。`name=alembic`(命名裁定 C2,2026-06-13)、`version=0.2.0`、`skills=./skills/`、`mcpServers=./.mcp.json`(指向同目录 MCP 配置文件)。`interface` 块(`:27-54`)给 Codex UI 用:displayName=Alembic、category=Coding、7 条 `defaultPrompt`、`brandColor`、`composerIcon`/`logo`/`screenshots` 资产路径。
- `plugins/alembic-codex/.mcp.json`：MCP server 声明。`command=node`、`args=["./bin/alembic-start.mjs"]`、`cwd="."`(相对已安装插件根)。`env`(`.mcp.json:7-15`)是**宿主标识注入点**:`ALEMBIC_PLUGIN_HOST=codex`(当前宿主信号)、`ALEMBIC_RUNTIME_MODE=plugin`(通用插件运行信号)、`ALEMBIC_MCP_MODE=1`/`ALEMBIC_CODEX_MCP_MODE=1`、`ALEMBIC_MCP_TIER=agent`(默认只暴露 agent 层工具)、`ALEMBIC_CODEX_ENABLE_ADMIN=0`(admin 工具默认隐藏)、`ALEMBIC_CODEX_PLUGIN_ROOT="."`。
- `plugins/alembic-codex/.agents/plugins/marketplace.json`：**发行 marketplace**(名 `gxfn`,`source.source=local`,`source.path="."`——因为这个 shell 就是它自己的 marketplace 根)。
- `plugins/alembic-codex/PLUGIN-SOURCE.json`：溯源元数据(`package=@gxfn/alembic-runtime@0.2.0`、`sourceRepo=GxFn/Alembic`、`shellEntry=bin/alembic-start.mjs`)。
- `plugins/alembic-codex/bin/alembic-start.mjs`：引导脚本(21636 字节,与 CC 版本同源,见 §1.4.3)。
- `plugins/alembic-codex/skills/`：5 个 skill(alembic/-create/-guard/-recipes/-structure)。
- `plugins/alembic-codex/.codex-marketplace-syncignore`：`package.json`/`scripts/`/`.agents/` 等标记为「仅发布自动化,不进可安装快照」。
- `plugins/alembic-codex/.alembic-codex-plugin-repo`：陈旧生成标记,写着 `source=/Users/.../github/Alembic version=0.1.1`——**历史包袱**,含旧绝对路径与旧版本号,与当前 workspace 无关。
- `RELEASE-PLAYBOOK.md`：完整发布/测试/推广手册(见 §1.5.1)。

`plugins/alembic-codex/package.json` 只是占位(`name=alembic-codex-plugin-repo`,`private:true`,`engines.node>=20`),不承载逻辑。

#### 1.4.2 Claude Code shell (`plugins/alembic-claude-code/`)

CC 走的是官方 Claude Code 插件格式,与 Codex 的差异集中在 manifest 结构与路径变量:

- `.claude-plugin/plugin.json`：CC 官方 manifest。关键差异——`mcpServers` 是**内联对象**(不像 Codex 指向外部 `.mcp.json`),因为 Claude Code 会把已安装插件复制进 cache 并从 session cwd 起 MCP,相对路径解析不了,所以必须用 `${CLAUDE_PLUGIN_ROOT}` 变量:`args=["${CLAUDE_PLUGIN_ROOT}/bin/alembic-start.mjs"]`、`cwd="${CLAUDE_PLUGIN_ROOT}"`(`plugin.json:27-30`)。env 块与 Codex 几乎相同,但 `ALEMBIC_PLUGIN_HOST=claude-code`、`ALEMBIC_CODEX_PLUGIN_ROOT=${CLAUDE_PLUGIN_ROOT}`(`plugin.json:31-40`)。注意 CC manifest **仍保留 `ALEMBIC_CODEX_MCP_MODE=1`**(host-wording debt:变量名还带 Codex,是遗留;CC3 wave 负责改)。
- `.claude-plugin/marketplace.json`：CC 用 `source.source=github`,`repo=GxFn/AlembicClaudeCode`(指回自己),因为这个仓库同时充当自己的 marketplace catalog(spec 默认托管形态)。README 记录了另两个被否的方案(相对 `./` self-source、独立 catalog 仓)。
- `bin/alembic-start.mjs`：与 Codex 版**功能同源**(byte-identical 起点,来自 AlembicCodex commit 05802b1,见 `PLUGIN-SOURCE.json:13`)。
- `skills/`：同样 5 个 skill。skill body 里仍写着 "Codex" 措辞(hostWordingDebt,CC3 未清)。`skills/alembic/SKILL.md` 的 frontmatter `name:alembic`,body 讲 host-agent 工作流:先 `alembic_status`(不起 daemon)、Ghost mode `alembic_init`、project-scoped 才主动 prime/guard。
- `PLUGIN-SOURCE.json`：`host=claude-code`,`manifest=.claude-plugin/plugin.json`。`provenance` 块(`:11-16`)记录了三条关键事实:(1) per-host shell 是 2026-06-12 用户决策;(2) 功能制品是 CC1 已验证的 AlembicCodex shell commit 05802b1 的字节级拷贝(过了 `claude plugin validate --strict` + live scratch-profile 加载:5 skills、stdio MCP、26 工具);(3) **syncRule**:跨 shell 的共享功能内容(bin 引导、skill body、runtime pin)在改动源头编辑后手动镜像到姊妹 shell,直到 cross-shell drift gate 建成;在此之前任何跨 shell 编辑必须在 commit message 里点名两个 shell。
- `.runtime/`：**本地 dev 缓存**——`ls` 显示 `.runtime/runtime-install/node_modules/@gxfn/alembic-runtime/` 里 `dist`/`lib`/`node_modules` 全是**符号链接指回父仓库** (`dist -> /.../AlembicPlugin/dist`、`lib -> /.../AlembicPlugin/lib`)。即本地开发时,CC shell 的「已装 runtime」直接软链到本仓库构建产物,免去真装 npm 包。`.gitignore` 忽略 `node_modules/` 与 `runtime/**/node_modules/`。这份 staged package.json 就是前述**多出 `#http/*` key** 的漂移源(§1.1.2)。

**Codex vs CC 差异小结**:

| 维度 | Codex shell | Claude Code shell |
| --- | --- | --- |
| 插件格式目录 | `.codex-plugin/plugin.json` | `.claude-plugin/plugin.json` |
| MCP 声明 | 外部 `.mcp.json`,相对路径 `./bin/...`,`cwd="."` | 内联进 manifest,`${CLAUDE_PLUGIN_ROOT}` 绝对变量 |
| marketplace source | `local`,`path="."` | `github`,`repo=GxFn/AlembicClaudeCode` |
| `ALEMBIC_PLUGIN_HOST` | `codex` | `claude-code` |
| submodule 远端 | GxFn/AlembicCodex | GxFn/AlembicClaudeCode |
| runtime pin | 同一个 `@gxfn/alembic-runtime@0.2.0` | 同上 |
| skills | 5 个,body 说 Codex | 5 个,body 也说 Codex(wording debt) |

两者共用**同一份 runtime 包和同一个 bin 引导脚本逻辑**——宿主差异只在 shell 的外壳 manifest 与注入的 `ALEMBIC_PLUGIN_HOST` 环境变量。真正的宿主分支在 runtime 内部由 `resolveHostAdapter()` 按该环境/物理 shell 形态决定(§1.2)。

#### 1.4.3 `bin/alembic-start.mjs` — shell 引导状态机(两 shell 同源)

这是分发层最复杂的单文件(694 行),是一个「按需装 runtime 并 exec MCP」的引导器。零第三方依赖(只用 node 内置模块)。以 CC 版 (`plugins/alembic-claude-code/bin/alembic-start.mjs`) 为准描述:

**常量**(`:16-22`)：`RUNTIME_PACKAGE_SPECIFIER=@gxfn/alembic-runtime@0.2.0`、`RUNTIME_BIN=alembic-codex-mcp`、锁超时 60s、锁陈旧阈值 120s。

**主流程**(`:29-79`)：
1. `buildLaunchPlan()` (`:81-137`)：算出缓存路径、npm install 参数、以及要传给子进程的完整 env(注入 `ALEMBIC_CODEX_RUNTIME_*` 系列 + `ALEMBIC_PLUGIN_HOST`(默认 claude-code)+ `ALEMBIC_MCP_TIER`(默认 agent) 等)。返回 schemaVersion:2 的 launchPlan。
2. `--dry-run` 时(`:37-43`)只打印计划(env 脱敏成 `summarizePublicEnv`)后 `exit(0)`——verify/smoke 脚本靠这个 dry-run 断言引导契约,无需真起 MCP。
3. `ensureRuntimeReady()` (`:139-240`)：**引导状态机核心**。
4. 就绪后 `spawn(command, args, {stdio:'inherit'})` 起真正的 MCP 子进程(`:46-74`),转发退出码/信号。

**`selectRuntimeCache()` 缓存选址(strategy + fallback 链)**(`:362-421`)：按优先级尝试候选缓存根,逐个探测可写:
1. `ALEMBIC_CODEX_RUNTIME_CACHE_DIR`/`_CACHE`(env 显式,`required:true`——不可写直接失败)
2. `ALEMBIC_CODEX_PLUGIN_DATA_DIR`/`CODEX_PLUGIN_DATA_DIR`/`PLUGIN_DATA` 下的 `alembic-runtime`
3. `<pluginRoot>/.runtime`(plugin-root,即前述那个软链 dev 缓存)
4. `<userCache>/alembic/codex-runtime`(`required:true`——mac 用 `~/Library/Caches`,否则 `~/.cache` 或 `$XDG_CACHE_HOME`,`:566-574`)

`ensureWritableDirectory` (`:559-564`) 用写探针文件验证可写。`required` 候选不可写即抛 `ALEMBIC_CODEX_RUNTIME_CACHE_NOT_WRITABLE`(exitCode 73)。`runtimeCachePaths` (`:423-439`) 从缓存根派生:`runtime-install/`(npm --prefix 目标)、`node_modules/@gxfn/alembic-runtime`(packageRoot)、entrypoint=`<packageRoot>/dist/bin/host-mcp.js`、`.install.lock`(锁目录)、`npm-cache`。

**`ensureRuntimeReady()` 状态机**(`:139-240`):
- 先 `probeCachedRuntime()`(第一探,`:141`):若 `ready` 直接复用(`:142-149`),emit `runtime-cache-reuse` trace。
- 若 offline(`ALEMBIC_CODEX_RUNTIME_OFFLINE=1` 等,`:576-582`)且缓存未就绪:抛结构化 offline 错误(`:151-166`,exitCode 74,错误码按探测状态分类 `offlineErrorCode` `:584-592`)。
- 否则 `acquireRuntimeLock()`(`:168-173`):跨进程互斥,防并发装包踩踏。
- 拿锁后**二次探测**(double-checked locking,`:175-183`):万一别的进程刚装好则直接复用。
- 否则 `installRuntimePackage()`(`:186`)真装。
- 装完 `installProbe`(`:188`)按结果分派四种失败(version-mismatch→exit70 / entrypoint-missing→exit70 / 非 ready→install-incomplete exit70)或 ready(`:230-236`)。
- `finally releaseRuntimeLock()`(`:237-239`)。

**`probeCachedRuntime()`**(`:441-480`)：读缓存里 package.json,逐项校验:存在→非法 JSON→name 不符→version 不符(`version-mismatch`)→entrypoint 不存在(`entrypoint-missing`)→`ready`。`resolveRuntimeEntrypoint` (`:482-491`) 从 package.json 的 `bin` 字段(string 或 `bin[alembic-codex-mcp]`)解析入口,兜底 `dist/bin/host-mcp.js`。

**`installRuntimePackage()`**(`:242-299`)：`assertNpmAvailable`(`:501-521` 跑 `npm --version`)→`rm -rf packageRoot`→建 installRoot/npmCacheDir→`spawnSync(npm, buildNpmInstallArgs)`。`buildNpmInstallArgs` (`:523-535`)=`install --prefix <installRoot> --no-save --no-audit --no-fund --omit=dev --package-lock=false @gxfn/alembic-runtime@0.2.0`。失败按 `ENOENT`(npm 缺失,exit127) vs 其它(exit70)分类,并用 `classifyInstallFailure` (`:618-626`) 把 stderr 归类成 network/404/generic。

**`acquireRuntimeLock()`**(`:301-353`)：用 `mkdir` 原子性做锁(`EEXIST` 即已被占)。写 `owner.json`(pid+时间戳)。若锁陈旧(超 `staleMs`)则强删重试;若超 `timeoutMs` 抛 `LOCK_TIMEOUT`(exit75)。轮询间隔自适应(`:350`)。

**结构化错误契约**：`createStartupError` (`:649-667`) 把每个失败包成带 `startupDiagnostic`(code/message/exitCode/runtimePackage/details/nextAction/source) 的 Error,`normalizeStartupError` (`:669-687`) 兜底未知错误。所有诊断经 `writeStartupDiagnostic` (`:645-647`) 写 stderr(JSON)。`emitTrace` (`:633-643`) 仅在 `ALEMBIC_CODEX_START_TRACE=1` 时输出——把引导每一步(cache-reuse/lock-acquired/install-start/install-ready)做成可观测 trace 事件。

**设计模式**：缓存选址=fallback 链(strategy);ready 判定=probe/探测器模式;并发装包=double-checked locking + 文件锁;错误=结构化诊断信封(每个失败带 code+nextAction+exitCode),契合 `CLAUDE.md` 「所有 fallback/降级/短路必须打印足够诊断」的要求。

---

### 1.5 打包/同步/发布/验证脚本管线

这批脚本把 `dist/` 打成便携 runtime 包、注入 marketplace 缓存、并做一层层边界验证。它们全用 `resolve(import.meta.dirname,'..')` 定位仓库根(不依赖 cwd)。

#### 1.5.1 `RELEASE-PLAYBOOK.md` — 发布契约总纲

`plugins/alembic-codex/RELEASE-PLAYBOOK.md` 是人读的发布手册,同时也是若干 verify 脚本的断言来源:
- **Release Model**(`:6-16`)：本仓库根包 private 不发 registry;可安装物是 GxFn/AlembicCodex 里的轻量 shell;runtime 经 pinned `@gxfn/alembic-runtime@0.2.0` 消费。
- **版本对齐清单**(`:30-42`)：每次 bump 必须同步的面——根 package.json、lock、runtime 包 manifest、`.agents/plugins/marketplace.json`、shell 的 `.mcp.json`/`bin/alembic-start.mjs`/README(中英)、以及 AlembicCodex submodule commit。
- **Version And Tag Flow**(`:44-72`)：选版本→改元数据→本地 release checks(build/prepare/verify-runtime/verify-boundary/release-codex-plugin[:daemon])→提交 shell 与指针→push main 等 CI→在绿 commit 打注解 tag `v0.2.0`→push tag→Release workflow 校验 tag==package version、装 sibling Core、构 runtime、跑 lint/unit/integration、验 boundary、smoke shell、上传 shell 制品;并确认制品**不含** `runtime.tgz`/`runtime/`/`node_modules/`。
- **Release Workflow Contract**(`:74-95`)：`prepublishOnly` 故意指向 `release:root-npm-publish:disabled`,让误发根包时以显式「artifact-only」消息失败。
- **Test Matrix / Manual Codex App Pass / Failure Triage / Promotion Plan**(`:97-171`)：分层测试矩阵、真机 Codex app 手工过场(装/启用/status/init Ghost 不污染项目/dashboard fail-closed/bootstrap 无需 provider)、故障排查表、三阶段推广。

#### 1.5.2 `prepare-codex-runtime-package.mjs` — 物化便携 runtime 包

`scripts/prepare-codex-runtime-package.mjs` 把当前 build 产物 + 生产依赖 + 本地 Core build 物化成一个可发布的 npm 包目录(默认 `.tmp/alembic-runtime-package`,可 `--output` 覆盖)。流程:
1. `resolveCoreSource({requireDist:true})`(`:13`)——要求 Core 有 dist。
2. **前置门禁**(`:16-37`)：断言 `dist/bin/host-mcp.js` 与 `dist/lib/runtime/mcp/HostMcpServer.js` 存在(`:16-20`);**QD1 clean-build-before-pack gate**——读 `dist/.build-manifest.json.sourceHash` 并与 `computeSourceHash(root)` 实时比对,dist 陈旧则拒绝打包(`:25-33`);断言 runtime manifest 已把 `@alembic/core` 钉到 Core 实际版本(`:34-37`)。
3. `rm -rf outputRoot`→建目录→`writeRuntimePackageJson()`(`:42/:71-80`):以 `packages/alembic-runtime/package.json` 为源,覆盖 version=根版本、`normalizeRuntimeDependencies` 把 `@alembic/core` 换成 Core 实际版本号(`:82-88`)、删 `private`。
4. `copyTree` 拷 `dist`(跳 `.d.ts` 和 `.build-manifest.json`)、`config`、`templates`、`skills`、`.agents`;`copyFile` 拷 template.json、README(可选)、并用 `packages/alembic-runtime/README.md` 覆盖成包 README(`:43-51`)。
5. `copyCoreGrammars()`(`:126-135`)：从 Core resources 拷 tree-sitter 语法 wasm 到 `resources/grammars`(断言 `tree-sitter-typescript.wasm` 在)。
6. `writeRuntimeBoundaryMetadata()`(`:137-160`)：写 `.alembic-runtime-boundary.json`,含 packageName/version、**QD1 .tmp freshness pin=`computeDistContentHash(dist)`**、corePackage/coreSource/coreCommit、`dependencyStrategy` 说明(runtime 包把 `@alembic/core` 钉成精确 npm 版本,MPB1 用模拟已发布 Core 的 tarball 验证 pack/install,无 `file:` 依赖逃逸边界)、`forbiddenShellArtifacts`。

#### 1.5.3 `prepare-codex-plugin-runtime.mjs` — 验证 marketplace shell 就绪

`scripts/prepare-codex-plugin-runtime.mjs` 与上一个不同——它不物化 runtime 包,而是**验证 Codex shell 处于可发布状态**:
- 断言 shell 目录**不含** `runtime`/`runtime.tgz`/`node_modules`(`:15-20`)、含 `bin/alembic-start.mjs`(`:21-23`)。
- 断言 runtime 包名=`@gxfn/alembic-runtime` 且版本==根版本(`:24-31`)。
- 委托 `verify-codex-plugin.mjs`(`:33-40`),失败即抛。
- 打印 `{ok:true, mode:'marketplace-shell', ...}`。

#### 1.5.4 `sync-codex-plugin-cache.mjs` / `dev-reload-codex-plugin.mjs` — 本地 dev 注入

`scripts/sync-codex-plugin-cache.mjs` 把仓库内的 Codex shell 拷进本地 Codex 插件缓存(默认 `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>`),供本地 dev 迭代:
- 从 `.agents/plugins/marketplace.json` 找 alembic 条目,读 shell 的 `.codex-plugin/plugin.json` 拿版本(`:32-42`,缺版本即失败——避免落到旧版本槽位)。
- `resolveTargetRoots()`(`:90-115`)：支持显式 `--target-root`、`--marketplace-name`、`--all-installed`(从 `config.toml` 找已启用插件根 `findConfiguredEnabledPluginRoots` `:117-141`,或扫缓存目录 `findInstalledPluginRoots` `:143-181`)。
- `syncTarget()`(`:195-216`)：拷到 `.tmp-<pid>-<ts>` staging(过滤 `.git`)→可选 `rewriteCachedMcpForLocalDist`→写 refresh marker→原子 `renameSync` 到目标。
- `--local-mcp` 时 `rewriteCachedMcpForLocalDist()`(`:218-247`):把缓存 `.mcp.json` 改成直接跑本地 `dist/bin/host-mcp.js`(而非 shell 引导装包),注入同一组 env。这是 dev 直连本地 dist 的关键。
- `writeRefreshMarker()`(`:316-353`)：写 `.alembic-dev-refresh.json`,记录 mode(local-mcp vs packaged-shell)、gitHead、以及 **localProjection marker**(`buildLocalProjectionMarker` `:355-383` 校验 `knowledge-rescan` 产物里 `releasedEmptySession`/`coverageLedgerSeed`/`noActionableHostAgentWork` 三个标记是否都在)——用于证明本地注入的 dist 确实带了预期的 recipe-generation 投影逻辑。

`scripts/dev-reload-codex-plugin.mjs` 是「build→prepare→sync(--clean --all-installed --local-mcp)→fresh MCP probe」的 orchestrator。它**明确不管理当前 Codex MCP 进程生命周期**(`:262-267` 把旧的 `--stop-mcp`/`--no-stop-mcp` 选项改成抛错):只刷新已装缓存并起一个全新 MCP 探针验证 `alembic_status` 的 projectRuntime identity/sourcePolicy/fallback isolation/entryMode/failureEnvelopes(`:178-194`)。当前 host MCP 传输若已关闭需自行重启 Codex。

#### 1.5.5 验证脚本群(边界门禁)

- `scripts/verify-codex-plugin.mjs`：**静态 shell/元数据验证**(errors[] 累积模式)。校验根包身份(private、bin 映射)、files[] 含必需脚本、scripts[] 值精确匹配;runtime 包名/版本/bin/core-pin;plugin.json(name=alembic、displayName、keywords 含 codex/local-first/dashboard/bootstrap);`.mcp.json`(command=node、args 恰为 `["./bin/alembic-start.mjs"]`、cwd="."、7 个 env 精确值、禁 `ALEMBIC_CHANNEL_ID`/`npm_config_cache`);startup 脚本字符串契约(含 specifier、`'npm'`/`'install'`、各错误码字符串,禁 `latest`/`runtime.tgz`/旧 wrapper/`node_modules`);`verifyStartupDryRun()`(`:330-368` 真跑 `--dry-run` 并断言 JSON);`verifyForbiddenShellArtifacts()`(`:370-400` 递归扫 shell 树禁 runtime/node_modules 路径段);marketplace(根 + shell 两份,均 name=gxfn、local source、AVAILABLE/ON_INSTALL);资产存在(≥3:icon/logo/screenshots);5 个 skill 存在;README 中英文关键短语。
- `scripts/verify-plugin-distribution.mjs`：**marketplace↔runtime 对齐验证**。校验根 `.agents/plugins/marketplace.json` 的 alembic 条目(local、`./plugins/alembic-codex`、AVAILABLE/ON_INSTALL),再 `verifyPlugin()`(`:104-154`) 校验 shell 内 plugin.json/`.mcp.json`/startup 与 runtime specifier 一致,禁旧 runtime 制品;并断言 runtime 包 files[] 不含已删的 `channels`。
- `scripts/verify-codex-runtime-package-boundary.mjs`：**最强的真装验证(MPB1)**。在临时目录里 `prepare` runtime 包→断言无 `file:` 依赖(`expectNoFileDependencies` `:182-192` 扫 runtime 包 + Core manifest)→无禁形制品→`npm pack` runtime 包**和** Core 源(把本地 Core 也打成 tarball 模拟已发布)→校验 runtime tarball 内含 host-mcp.js/HostMcpServer.js/grammar wasm/boundary json,不含 runtime.tgz/旧 shell runtime/→从干净临时目录 `npm install` 两个 tarball(`--ignore-scripts --omit=dev`)→断言装出的入口存在→用 `--eval` 动态 import `HostMcpServer.js` 断言 `startHostMcpServer` 是函数。这证明**便携包不靠任何 `file:` 依赖就能 pack/install/解析 MCP 入口**。
- `scripts/smoke-codex-plugin.mjs`：**端到端插件 smoke**(见完整逻辑)。`npm pack` 根包→校验 tarball 必含/禁含清单(`requiredPackageFiles` `:197-220` / `assertForbiddenPackageFiles` `:263-282`)→解包→`simulateMarketplaceInstall`(`:284-362` 从 tarball 里 marketplace 条目解析 shell、拷成「已装插件」、校验 manifest/`.mcp.json`/env/资产/skills)→`runStartupDryRun`(`:364-393` 跑 shell `--dry-run` 断言引导契约)→`verifyStartupRuntimeProbe`(`:395-415` 委托 `probe-codex-plugin-startup-runtime.mjs` 验 first-run install/cached/offline/version-replacement/lock-concurrency 五种引导路径)→in-process 用打包出的 `HostMcpServer` 真调 `alembic_status`(runtime aspect)/`alembic_status`/`alembic_init`(断言 Ghost)/`alembic_job`(用 `@alembic/core/daemon` 的 `JobStore` 造本地 job)→可选 `runStdioSmoke`(`:417-521` 用 `@modelcontextprotocol/sdk` 的真 stdio client 连本地 host-mcp.js,断言工具表含 `alembic_status/_init/_job/_submit_knowledge/_bootstrap/_rescan/_dimension_complete`、且**退役工具名缺席**(`alembic_guard`/`alembic_work_start` 等 `:470-486`))。与 @alembic/core 的消费点:`@alembic/core/daemon`(JobStore)。
- `scripts/verify-release-package-boundary.mjs`：**发布防线**。校验根包 private、runtime 包 public+版本对齐+core-pin、shell 无禁形制品、`prepublishOnly`/`release:*` 别名全部指向 disabled guard、Release workflow 存在且**不含 `npm publish`**、上传 shell startup 与 runtime 包元数据。`--publish` 模式(经 `prepublishOnly` 触发)**永远追加一个 error 并 exit(1)**(`:100-115`),把误发根包变成显式失败,并列出残留的 `file:..` 开发依赖(`collectFileParentDependencies` `:143-155`)。
- `scripts/verify-codex-session-scenarios.mjs`：把参数翻译成 `CODEX_SESSION_*` 环境变量后 `spawnSync` 跑 `test/unit/CodexSessionScenarioRunner.test.ts`(vitest)。支持 `in-process`/`live-local` 两 mode;`--real-alembic-home` 有强护栏(必须配 scenario+project-root,且**禁止指向本仓库自身**,`:37-42`——防真 `~/.asd` 写坏开发库)。
- `scripts/report-agent-extraction-boundary.mjs`：**删除边界审计**(非门禁,只出报告)。扫 `lib/bin/scripts/test` 里对 `#agent/`/`#external/ai`/`#tools/` 的 import,统计「实现目录外的越界引用」。这是记录「独立 Agent/Tool/AI runtime 已被删除」这一历史决策的审计标签(`CLAUDE.md` 明确:这些字符串标签不得被解释为允许恢复本地 Agent/Tool/AI runtime)。`lint:*`/`probe:*`/其它 dev 脚本本节不展开(见 sec-11)。

---

### 1.6 vendor/AlembicCore submodule vs ../AlembicCore 的角色

Core 源解析集中在 `scripts/local-source-paths.mjs`,是本层与 @alembic/core 的物理接线点:
- `resolveCoreSource()`(`:14-34`)：按固定优先级找 Core——**先 `../AlembicCore`(sibling 检出,本地开发默认),再 `vendor/AlembicCore`(submodule 快照)**(`coreCandidates` `:9-12`)。`requireDist:true` 时还要求候选有 `dist/`。两个都找不到即抛。`withSourceDetails`(`:63-68`)附带读 git commit(`readGitCommit` `:70-79`)。
- `resolveCoreGrammarSource()`(`:36-56`)：找 tree-sitter 语法 wasm,候选=`../AlembicCore/resources/grammars`→`node_modules/@alembic/core/resources/grammars`。

**角色分工**(与 `CLAUDE.md`「Core 接入规则」「vendor/AlembicCore 快照刷新流程」一致):
- `../AlembicCore`：workspace 内的 Core **源仓库**,是开发/build/check/boundary-lint 的默认入口。根 `package.json` 的 `@alembic/core: file:../AlembicCore` 也指它。
- `vendor/AlembicCore`：独立 git submodule,钉在精确 Core commit 上,**仅作 portable/fallback Core 源**——workspace 外 fallback、release snapshot、Codex portable runtime 快照。本地开发始终优先 `../AlembicCore`,所以**快照落后 Core HEAD 是预期内、可解释的状态**,不是异常。已发布 runtime 包消费的是 registry 上的 `@alembic/core` 精确版本(不是快照)。
- 快照刷新只在发布步骤、且仅当本次发布需要快照固定点之后的 Core 变更时进行(`checkout <released-core-commit>` 后 `git add vendor/AlembicCore` 随发布提交 gitlink);禁止直接编辑 vendor 内文件。

**便携包如何切断 `file:` 依赖**:开发期 `@alembic/core` 是 `file:../AlembicCore`;但 `prepare-codex-runtime-package` 生成的便携包 manifest 把它 `normalizeRuntimeDependencies` 成 Core 的**精确 npm 版本号**(`0.2.0`),`verify-codex-runtime-package-boundary` 再用把本地 Core 打成 tarball 的方式模拟「registry 上的已发布 Core」来验证真装——这是「本地 file: 开发、发布时精确版本 pin」双轨的物理实现。

---

### 1.7 已知边界、坑与历史包袱汇总

1. **imports-map key 漂移**：CC shell `.runtime/.../@gxfn/alembic-runtime/package.json` 多一个 `#http/*` key,与根/runtime 权威 manifest(8 key,无 `#http`)不一致。发布对齐清单未显式覆盖 imports-map key 集合,是潜在漏网点。
2. **host-wording debt**：CC manifest 与两 shell 的 skill body 仍带 "Codex" 措辞(`ALEMBIC_CODEX_MCP_MODE` 等变量名、skill 正文),归 CC3 wave 清理;跨 shell 共享内容无自动 drift gate,靠人工镜像(commit message 点名两 shell)。
3. **陈旧生成标记**：`plugins/alembic-codex/.alembic-codex-plugin-repo` 含旧绝对路径 `/Users/.../github/Alembic` 与旧版本 `0.1.1`,是失效的生成产物。
4. **cwd 依赖**：`clean-dist.mjs` 用 `process.cwd()`;`report-agent-extraction-boundary.mjs` 用 `process.cwd()` 作 workspaceRoot——必须从仓库根跑(npm scripts 满足,手动调用需注意)。`MEMORY.md` 记录过 MCP server cwd=plugin cache 导致的 root 解析 bug,同类风险。
5. **Node 版本门**：所有 build:*-boundary/build:check 门禁需 Node≥22;Node 18 会给假红(`ERR_INVALID_ARG_TYPE`),判红前必须 `nvm use 22`。
6. **禁形制品的多层重复校验**:`runtime.tgz`/`runtime/`/`node_modules` 在 prepare/verify-plugin/verify-runtime-boundary/verify-release/smoke 五处反复断言缺席——反映历史上 shell 曾内嵌 runtime,现已彻底外移到 pinned 包 + 缓存,门禁防回归。
7. **根包永不发布**:`prepublishOnly→release:root-npm-publish:disabled→verify-release-package-boundary --publish` 强制 exit(1);`release:patch/minor/major` 全部别名到同一 disabled guard——发布只走 tag-driven GitHub Release workflow 上传 shell 制品。


---

## 2. 启动引导与依赖注入层 (Bootstrap + DI)

本节测绘 `alembic-codex-plugin-runtime` 的启动引导层 (`lib/bootstrap.ts`) 与依赖注入容器层 (`lib/injection/**`)。这一子系统是整个插件 runtime 的「地基」：它把宿主 (Codex / Claude Code) 通过环境变量传入的项目坐标 (`ALEMBIC_PROJECT_DIR`) 转化为一套已连通数据库、日志、审计、知识、搜索、向量、Guard、演化、信号等能力的 `ServiceContainer`，并暴露类型安全的 `container.get('...')` 服务解析入口。所有下游工具/工作流层都从这个容器取服务。

设计总览（读者先建立心智模型）：

- **两阶段启动**：`Bootstrap.initialize()`（构造少量"承重根组件"：PathGuard 配置 → WorkspaceResolver → config → logger → db → audit → skillHooks）→ `ServiceContainer.initialize(components)`（把根组件注入单例缓存，再按模块顺序注册全部惰性服务工厂）。两个阶段由 `lib/runtime/mcp/McpServer.ts:234-249` 顺序驱动。
- **惰性单例 DI**：`ServiceContainer` 是一个手写的、字符串 key 的 service locator + lazy singleton 容器；服务工厂在首次 `get()` 时才实例化（除少数 eager 预热）。
- **类型安全映射**：`ServiceMap.ts` 是一张纯类型接口表，把每个字符串 key 映射到具体服务类型，让 `get<K>()` 编译期推导返回类型。
- **模块化装配**：7 个 DI module（Infra / Signal / App / Knowledge / Vector / Guard / SkillHooks）各自 `register(container)`，注册顺序有严格依赖约束。
- **Core 消费边界**：绝大多数被注册的服务类来自 `@alembic/core/*` 子路径导入；plugin-local 只保留少量适配/桥接服务（audit、SkillHooks、ModuleService、PrimeSearchPipeline、Resident clients、recipe-generation 向量适配等）。

---

### 2.1 Bootstrap — 应用程序启动器

文件：`lib/bootstrap.ts`。职责：按固定次序创建一组「根组件」(`BootstrapComponents`)，这些组件是 DI 容器无法自举、必须由启动器先建立的。它**不注册普通服务**（那是 `ServiceContainer` 的职责），只负责 PathGuard 安全边界、Ghost 模式路径解析、config、logger、db、audit、skillHooks。

#### 2.1.1 数据结构与契约

- `BootstrapOptions` (`lib/bootstrap.ts:16-21`)：可选 `configPath` / `dbPath` / `logLevel` + 开放 `[key: string]: unknown`。实际使用中主要读 `options.env`（见 `loadConfig`）。
- `BootstrapComponents` (`lib/bootstrap.ts:24-33`)：启动器产出的组件袋，字段 `config`（`ConfigLoader` 静态类本体）、`logger`、`db`（`DatabaseConnection`）、`auditStore`、`auditLogger`、`skillHooks`、`workspaceResolver`，同样带开放索引签名。
- `requireBootstrapComponent<T>(value, name)` (`lib/bootstrap.ts:35-40`)：一个「先决条件断言器」——若某步骤依赖的前置组件为 `null/undefined` 则抛 `[Bootstrap] <name> must be initialized before this step runs.`。这是一个显式的**顺序守卫**，把「步骤间时序依赖」编码成运行期错误而非静默 undefined。

#### 2.1.2 `Bootstrap.configurePathGuard(projectRoot, knowledgeBaseDir?)` — 路径安全守卫配置（静态）

`lib/bootstrap.ts:56-63`。这是**必须在任何文件写操作之前调用**的门禁。逻辑：

- 若 `pathGuard.configured` 为 false 且传入了 `projectRoot`，调用 `pathGuard.configure({ projectRoot, packageRoot: PACKAGE_ROOT, knowledgeBaseDir })`。`PACKAGE_ROOT` 来自 `lib/shared/package-assets.ts:45`（沿 `import.meta.dirname` 向上最多 10 层找到含 `@gxfn/alembic-runtime` / `alembic-codex-plugin-runtime` 名字的 `package.json`）。
- 若已配置但后来才知道 `knowledgeBaseDir`（如 `Alembic`），走 `pathGuard.setKnowledgeBaseDir(knowledgeBaseDir)` 补配。

`pathGuard` 来自 `@alembic/core/io`，是一个进程级单例路径白名单守卫；Core 拥有实现，Plugin 只负责在正确时机用正确的 projectRoot/packageRoot 配置它。这是**gateway/门禁模式**在启动层的落点。调用方分布：`McpServer.ts:232`（MCP 模式在 `initialize()` 之前显式配置）、`SetupService.ts:635`（CLI setup 路径，额外带 `knowledgeBaseDir`）。

#### 2.1.3 `Bootstrap.initialize()` — 完整分步启动序列

`lib/bootstrap.ts:66-118`。这是本节最核心的状态机式启动管线。全程包在 `try/catch` 中，失败时把 `error.stack` 写 stderr 并重抛（`lib/bootstrap.ts:113-117`）。记 `startTime` 用于收尾打印耗时。分步（编号即源码注释编号）：

**步 0 — `loadRuntimeSettings()`（`lib/bootstrap.ts:71` → 定义 `120-128`）**
从 `ALEMBIC_PROJECT_DIR || process.cwd()` 解析项目根，用 `WorkspaceSettingsStore.fromProject(projectRoot).applyToProcessEnv({ override: false })`（来自 `@alembic/core/shared`）把工作区落盘设置注入 `process.env`。关键语义：`override: false` — **显式进程环境变量优先**，落盘设置只补空缺。整段被 `try/catch{}` 吞掉（settings 不可读时保留纯显式 env）。这一步先于 PathGuard，是为了让后续步骤能读到工作区级配置。

**步 0.5 — PathGuard 兜底配置（`lib/bootstrap.ts:75-86`）**
若 `pathGuard.configured` 仍为 false（脚本/测试可能跳过了插件宿主的提前配置），进入兜底：
- `isMcpMode = process.env.ALEMBIC_MCP_MODE === '1'`。
- `projectRoot = ALEMBIC_PROJECT_DIR || (isMcpMode ? undefined : process.cwd())`。即**MCP 模式下禁止回落到 `process.cwd()`**——MCP server 的 cwd 是插件缓存目录而非用户项目，回落会污染错误目录。
- 若此时 `projectRoot` 仍空，抛硬错：`[Bootstrap] MCP 模式下缺少 ALEMBIC_PROJECT_DIR 环境变量，且 PathGuard 未提前配置`。这是一条**明确的宿主契约门禁**：宿主必须传准项目目录。
- 否则 `Bootstrap.configurePathGuard(projectRoot)`。

**步 0.8 — `initializeWorkspaceResolver()`（`lib/bootstrap.ts:89` → 定义 `186-201`）**
从 `pathGuard.projectRoot` 取项目根（PathGuard 未配置则整步 return 跳过）。核心：
- `resolveProjectScopeRuntime(projectRoot)`（`lib/shared/project-scope-runtime.ts:49`）解析 Alembic **原生 ProjectScope**（先查 env `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY`，命中且匹配当前 folder 则用；否则经 `WorkspaceResolver.fromProjectScopeRegistry` / `loadProjectScopeForFolder` / 直接读 registry 文档查找 `controlRoot.path === projectRoot` 的 scope）。返回 `{ descriptor, summary }` 或 null。
- `WorkspaceResolver.fromProject(projectRoot, { projectScope: descriptor ?? null })`（`@alembic/core/workspace`）构造出 **Ghost 模式感知**的路径解析器，存入 `components.workspaceResolver`。
- **Ghost 模式**：若 `resolver.ghost` 为真，调用 `pathGuard.addAllowPath(resolver.dataRoot)`——把外置工作区数据目录加入 PathGuard 白名单。Ghost 模式的语义是「用户源仓库不允许写运行时数据，把 `.asd`/日志/DB 重定向到外置 dataRoot」。这条白名单登记是 Ghost 模式能落盘的前提。

**步 1 — `loadConfig()`（`lib/bootstrap.ts:92` → 定义 `130-135`）**
`env = options.env || process.env.NODE_ENV || 'development'`；`ConfigLoader.load(env)`（plugin-local `lib/infrastructure/config/AppConfigLoader.js`，静态类）；`components.config = ConfigLoader`。注意 `config` 存的是**类本体**（静态 loader），不是实例——下游 `config.get('...')` 是静态调用。

**步 2 — `initializeLogger()`（`lib/bootstrap.ts:95` → 定义 `138-148`）**
从 `config.get('logging')` 取日志配置；**Ghost 重定向**：若 `resolver?.ghost && config?.file`，把 `config.file.path` 改写为 `resolver.logsDir`（日志随 Ghost 落到外置工作区）。然后 `Logger.getInstance(config)`（`@alembic/core/logging`，全局单例）→ `components.logger`。随后 `initialize()` 主流程立即 `logger.info('Alembic - Starting initialization...')`（`lib/bootstrap.ts:97-98`），即 logger 是第一个可用于打点的组件。

**步 3 — `initializeDatabase()`（`lib/bootstrap.ts:101` → 定义 `151-160`）**
断言 config/logger 已就绪；`dbConfig = config.get('database')`；`new DatabaseConnection(dbConfig, this.components.workspaceResolver)`（`@alembic/core/database`——把 workspaceResolver 传入使 DB 路径也走 Ghost 解析）；`await db.connect()` → `await db.runMigrations()`（**连接后立即跑迁移**）→ `components.db = db`；`logger.info('Database connected and migrated')`。

**步 4 — `initializeCoreComponents()`（`lib/bootstrap.ts:104` → 定义 `163-180`）**
「Plugin 本地核心组件」，两块：
- **Audit 系统**：`new AuditStore(db)`（plugin-local `lib/infrastructure/audit/AuditStore.js`）→ `new AuditLogger(auditStore)`（`lib/infrastructure/audit/AuditLogger.js`）。注释点名（`lib/bootstrap.ts:167-168`）：这是**真 DB-backed audit**；随 PDR-3 删除内嵌 daemon 时，那条 slim no-op 路径已被移除。存入 `components.auditStore/auditLogger`。⚠️ 注意：这里 `AuditStore` **只用单参 `db`** 构造；而 `InfraModule` 里的 `auditStore` 工厂用了 `new AuditStore(db, drizzle)` 双参（见 2.4）。Bootstrap 产出的 `auditLogger` 会被注入容器单例（见 2.2.4），从而这里的单参 AuditStore 才是运行期实际承载 audit 的实例。
- **SkillHooks**：`new SkillHooks()`（plugin-local `lib/service/skills/SkillHooks.js`）→ `await skillHooks.load()`（**同步 await 加载** `skills/*/hooks.js` + `Alembic/skills/*/hooks.js`）→ `components.skillHooks`。这与 `SkillHooksModule` 里的惰性版本是两套（见 2.9 的兼容说明）。

**收尾**：`duration = Date.now() - startTime`；`logger.info('Alembic initialized successfully (${duration}ms)')`；`return this.components`。

步 5（`registerRoutes`）已注释掉（`lib/bootstrap.ts:106-107`）——路由注册被下沉到各服务，是残留的历史注释。

#### 2.1.4 `Bootstrap.shutdown()` — 优雅关闭

`lib/bootstrap.ts:204-222`。仅处理 DB：
- `unwrapRawDb(this.components.db)`（`@alembic/core/search`）取到底层 better-sqlite 句柄，`rawDb.pragma('wal_checkpoint(TRUNCATE)')` **刷 WAL** 后再 `db.close()`。WAL checkpoint 失败被 `try/catch{}` 吞（不阻断 shutdown）。
- 前后 `logger?.info` 打点。

注意 Bootstrap.shutdown 只是**组件级**关闭；进程级信号处理由独立的 `ShutdownCoordinator`（`lib/shared/shutdown.ts`，见 2.7）承担，二者不是同一路径。

#### 2.1.5 组件访问器

- `getComponent(name)` / `getAllComponents()`（`lib/bootstrap.ts:225-232`）：直接读 `this.components` 袋。DI 容器的 `initialize` 正是消费 `getAllComponents()` 的结果（实际由 McpServer 逐字段传入，见 2.2.4）。

**设计模式落点**：Bootstrap = **facade + 分步初始化状态机**；`requireBootstrapComponent` = 顺序前置断言；PathGuard/Ghost 白名单 = gateway/门禁；Ghost 重定向（logger/db 路径改写）= strategy（由 resolver.ghost 分叉）。

---

### 2.2 ServiceContainer — 依赖注入容器

文件：`lib/injection/ServiceContainer.ts`。这是一个**手写的字符串 key service locator + 惰性单例容器**，是整层 DI 的心脏。

#### 2.2.1 容器数据结构

`ServiceContainer` 类（`lib/injection/ServiceContainer.ts:145-339`）三个字段：
- `services: Record<string, () => unknown>`——注册表：key → **工厂函数**。
- `singletons: Record<string, unknown>`——单例缓存（也兼作「注入值/内部状态」的暂存袋，如 `_projectRoot`/`_config`/`_lang`/`_workspaceResolver`/`coreRepositories`）。
- `logger`——`Logger.getInstance()`（Core 全局单例）。

#### 2.2.2 注册与解析原语

- `register(name, factory)`（`lib/injection/ServiceContainer.ts:303-308`）：把工厂存入 `services[name]`。**重复注册守卫**：非 production 环境下若 key 已存在，`logger.warn('服务 "xxx" 被重复注册')` 并覆盖。
- `singleton(name, factory)`（`lib/injection/ServiceContainer.ts:163-174`）：注册一个**惰性单例**——内部包一层 `register`，工厂体为 `if (!singletons[name]) singletons[name] = factory(this); return singletons[name]`。这消除了每个 module 手写 `if(!this.singletons.xxx)` 的样板。工厂签名 `(container: ServiceContainer) => unknown`，即工厂能拿到容器自身解析其它依赖（**服务定位器模式**）。第三参 `_options` 目前是空对象占位，无实际用途。
- `get(name)`（`lib/injection/ServiceContainer.ts:321-328`）：两个重载——`get<K extends keyof ServiceMap>(name: K): ServiceMap[K]`（类型安全，命中 ServiceMap 键推导返回类型）与 `get(name: string): unknown`（向后兼容）。实现：`services[name]` 不存在则抛 `Service 'name' not found in container`；存在则**调用工厂** `services[name]()`。对 singleton 而言首调实例化、后续返缓存。
- `reset()`（`lib/injection/ServiceContainer.ts:331-333`）：清空 `singletons`（保留 `services` 工厂表），仅测试用。
- `getServiceNames()`（`lib/injection/ServiceContainer.ts:336-338`）：`Object.keys(services)`。

**惰性实例化语义**：`services` 表在 `initialize()` 里被各 module 一次性填满，但绝大多数服务直到第一次 `get()` 才构造。少数被 eager 触发的：`signalBus`（`initialize` 里显式 `this.get('signalBus')`，见 2.2.4）、以及 `initializeVectorService` / `initializeKnowledgeServices` 里被主动解析并 await 的服务。

#### 2.2.3 全局单例与访问器

- 模块级 `containerInstance`（`lib/injection/ServiceContainer.ts:341`）+ `getServiceContainer()`（`344-349`，惰性 new）+ `resetServiceContainer()`（`352-357`，reset 后置 null）。
- `ServiceContainer.getInstance()`（静态，`lib/injection/ServiceContainer.ts:177-179`）代理到 `getServiceContainer()`，供路由层用。

即容器本身也是**进程级单例**（gateway/singleton），与 Bootstrap 各自单例但由 McpServer 组合。

#### 2.2.4 `ServiceContainer.initialize(bootstrapComponents)` — 装配总控

`lib/injection/ServiceContainer.ts:185-266`。这是把 Bootstrap 根组件桥接进容器、并按序注册全部 module 的编排函数。全程 `try/catch`（失败 `logger.error` 后重抛）。分步：

1. **多项目防护**（`lib/injection/ServiceContainer.ts:187-196`）：读 `bootstrapComponents.projectRoot` 与已缓存 `singletons._projectRoot`；若两者都在且不等，抛 `[ServiceContainer] 不允许在同一进程中切换项目`。语义：**一个进程只绑定一个项目**（每项目独立进程），防止同进程内跨项目串数据。
2. **根组件注入单例缓存**（`lib/injection/ServiceContainer.ts:199-224`）——这些值**绕过工厂**直接写 `singletons`：
   - `db → singletons.database`
   - `auditLogger → singletons.auditLogger`（即 Bootstrap 造的 auditLogger 覆盖 module 工厂——运行期用的是这个）
   - `projectRoot → singletons._projectRoot`
   - `workspaceResolver → singletons._workspaceResolver`
   - `config → singletons._config = buildServiceContainerRuntimeConfig(config, workspaceResolver)`（见 2.3，把静态 ConfigLoader 快照 + 工作区运行时 config 合并成纯对象）
   - `skillHooks → singletons.skillHooks`
3. `AppModule.initRecipeExtractor(this)`（`lib/injection/ServiceContainer.ts:226`）：预置 `singletons._recipeExtractor = new RecipeExtractor()`（Core，`@alembic/core/knowledge`）。这是给 `recipeExtractor`/`moduleService` 工厂用的共享实例。
4. `InfraModule.register(this)`（`lib/injection/ServiceContainer.ts:229`）：先注册基础设施 + 仓储（database/logger/audit/eventBus/repositories/writeZone/knowledgeSync/reportStore）。
5. `singletons._lang = null`（`lib/injection/ServiceContainer.ts:232`）：容器级语言偏好初始化。
6. **module 注册顺序**（`lib/injection/ServiceContainer.ts:236-242`，顺序是承重约束）：
   - `SignalModule.register(this)` 然后**立即 eager** `this.get('signalBus')`（`237`）——确保 `singletons.signalBus` 在后续所有工厂（Knowledge/Guard 大量读 `singletons.signalBus`）解析前就已实例化。这是唯一被显式预热的 module。
   - `AppModule.register(this)`（qualityScorer 等基础服务优先）
   - `KnowledgeModule.register(this)`
   - `VectorModule.register(this)`
   - `GuardModule.register(this)`
   - `SkillHooksModule.register(this)`
7. `await initEnhancementRegistry()`（`lib/injection/ServiceContainer.ts:245-251`）：`@alembic/core/enhancement` 的 `initFrameworkEnhancements`，异步加载所有框架增强包；失败仅 `logger.warn`（**non-blocking**）。
8. `await VectorModule.initializeVectorService(this)`（`254`）：绑定 EventBus、选本地 embed provider、初始化 VectorService、预热 embeddingSimProvider（见 2.6）。
9. `KnowledgeModule.initializeKnowledgeServices(this)`（`257`）：接通 proposal 信号驱动、绑定 `knowledge:changed → searchEngine.refreshIndex()` + freshness（见 2.5.5）。
10. `logger.info('Service container initialized successfully')`。

**注册顺序为什么承重**：SignalModule 必须最先（signalBus 被几乎所有下游工厂读取）；InfraModule 提供 database/eventBus/repositories 这些底座；AppModule 的 qualityScorer 被 confidenceRouter 读取；VectorModule/GuardModule/Knowledge 之间存在 vectorStore/vectorService、guardCheckEngine 的交叉引用。虽然工厂是惰性的（注册顺序理论上不影响构造时刻），但 `initialize` 尾部的 eager `get('signalBus')` 和两个 `initialize*` 钩子会立即触发解析，此时被依赖工厂必须已 register。

#### 2.2.5 容器辅助能力

- `getLang()/setLang(lang)`（`lib/injection/ServiceContainer.ts:271-278`）：读写 `singletons._lang`（影响 Agent 回复语言）。
- `buildToolContext(extras)`（`lib/injection/ServiceContainer.ts:288-300`）：构建 internal tool handler 的 legacy context 投影——`{ container, projectRoot: resolveProjectRoot(this), dataRoot: resolveDataRoot(this) || projectRoot, logger, source, lang, fileCache, ...extras }`。`resolveProjectRoot`/`resolveDataRoot` 来自 `@alembic/core/workspace`，内部读容器的 `_projectRoot`/`_workspaceResolver`。这是工具层与容器之间的适配器。

#### 2.2.6 入口连接（谁驱动这两阶段）

`lib/runtime/mcp/McpServer.ts:232-249` 是把 Bootstrap 与 ServiceContainer 串起来的**唯一主入口**（宿主 = Codex / Claude Code 的 MCP stdio）：
1. `Bootstrap.configurePathGuard(projectRoot)`（`232`，宿主在此提前配置）。
2. `this.bootstrap = new Bootstrap(); const components = await this.bootstrap.initialize()`（`234-235`）。
3. 动态 `import('#inject/ServiceContainer.js')` → `getServiceContainer()`（`238-239`）。
4. `await container.initialize({ db, auditLogger, config, skillHooks, projectRoot, workspaceResolver })`（`240-249`）——逐字段从 `components` 摘出根组件传入。

CLI setup 路径（`lib/cli/SetupService.ts:635-642, 788-800`）是第二入口：`configurePathGuard(projectRoot, resolver?.knowledgeBaseDir)` → `new Bootstrap({ env }).initialize()` → 后续 `getServiceContainer().get('vectorService')` 等。两条入口共享同一套 Bootstrap/容器代码。

---

### 2.3 运行期配置合并 — `buildServiceContainerRuntimeConfig`

文件同 `ServiceContainer.ts`（`lib/injection/ServiceContainer.ts:113-140` + 辅助 `17-111`）。这是一个把**静态 `AppConfigLoader` 配置**与**工作区数据根里的运行时 config（`.asd/config.json`）** 合并成一个纯普通对象 `singletons._config` 的函数，供各 module 工厂读取（尤其 `vector`/`guard` 段）。

关键点：
- `CONFIG_LOADER_TOP_LEVEL_KEYS`（`lib/injection/ServiceContainer.ts:21-34`）：枚举要从 ConfigLoader 抽取的顶层段（database/server/cache/monitoring/logging/constitution/paths/features/vector/qualityGate/guard/taskGraph）。
- `readConfigLoaderSnapshot(config)`（`77-90`）：若 `config` 有 `get()`（即 ConfigLoader 类本体），逐 key `cloneConfigValue(config.get(key))` 深拷贝成快照（`get` 抛错的可选段静默跳过）；否则若是普通对象直接深拷。
- `WORKSPACE_RUNTIME_CONFIG_SECTIONS = ['vector', 'guard']`（`36`）：只有这两段允许被工作区 config 覆盖。
- `readWorkspaceRuntimeConfig(resolver)`（`100-111`）：从 `resolver.configPath` 读 JSON（`getWorkspaceConfigPath` 校验 + `existsSync` + `try/catch`），失败返 `{}`。
- 主体（`121-140`）：对 vector/guard 两段做 `deepMergeConfig(base, override)`（`62-75`，递归合并普通对象、数组/标量整体替换）。

**为什么存在**（源码注释 `113-120`）：`AppConfigLoader` 是静态 loader，而项目运行时 config 落在 WorkspaceResolver 的 dataRoot；vector 段必须看到与 `alembic_status` 同一份 `localEmbedding` 设置，否则会出现 status 报 enabled 而 VectorService 却以 disabled provider 初始化的**不一致 bug**。这是一层显式的**配置 gateway/合并层**，把「静态默认 + 工作区覆盖」统一成单一 `_config`。

---

### 2.4 InfraModule — 基础设施 + 仓储装配

文件：`lib/injection/modules/InfraModule.ts`。`register(c)`（`32-38`）依次调 `registerInfrastructure` / `registerWriteZone` / `registerRepositories` / `registerKnowledgeSync` / `registerReportStore`。

**registerInfrastructure（`40-83`）**：
- `database`（`43-50`，普通 `register` 非 singleton）：直接从 `singletons.database`（Bootstrap 注入的实例）返回；未注入则抛 `Database not initialized. Ensure Bootstrap.initialize() is called...`。**database 不由工厂构造**，是 Bootstrap 的产物桥接进来。
- `logger`（`52`）：`Logger.getInstance()`（Core 单例，每次现取）。
- `auditStore`（`54-58`，singleton）：`new AuditStore(db, db.getDrizzle())`（**双参**，plugin-local，`db.getDrizzle()` 取 Drizzle 句柄）。注意：这个工厂几乎不会被解析——运行期 audit 走的是 Bootstrap 注入的单参 `auditLogger`（其内部 store 是 Bootstrap 造的单参 AuditStore）。
- `auditLogger`（`59-68`，singleton）：`new AuditLogger(auditStore, eventBus?)`——但 `singletons.auditLogger` 已被 Bootstrap 注入覆盖，故此工厂通常不触发（惰性 + 已有缓存值）。
- `eventBus`（`69`）：`new EventBus({ maxListeners: 30 })`（`@alembic/core/events`）。
- `bootstrapTaskManager`（`71-78`）：`new BootstrapTaskManager({ eventBus })`（plugin-local `#recipe-generation/bootstrap/BootstrapTaskManager.js`）。注释 RIC-7：slim daemon 砍掉了 RealtimeService(WebSocket)，进度仍走 EventBus，realtime getter 留空。
- `jobStore`（`80-82`）：`new JobStore({ projectRoot: resolveProjectRoot(ct) })`（`@alembic/core/daemon`）。

**registerWriteZone（`85-97`）**：`writeZone` singleton——读 `singletons._workspaceResolver`；无 resolver 返 `null`；有则 `new WriteZone(resolver)`（`@alembic/core/io`）。WriteZone 是 Ghost 模式下所有落盘写的收口——下游 KnowledgeFileWriter/FeedbackCollector/ExclusionManager/RuleLearner/ReportStore/vectorStore/SignalTraceWriter 都注入它。**为 null 是合法态**（非 Ghost 或无 resolver）。

**registerRepositories（`99-159`）**：这是**桥接模式**的集中体现。除 `memoryRepository`（`122-128`，直接 `new MemoryRepositoryImpl(drizzle)`）外，其余仓储都通过 `getCoreRepositories(ct)`（`195-206`）取字段：
- `getCoreRepositories` 惰性缓存 `singletons.coreRepositories`；未缓存则 `createAlembicRepositories(ct.get('database'))`（`@alembic/core/repositories` 的 bundle 工厂，一次性构造全部 Core 仓储），缓存后返回。
- 桥接出的 key：`knowledgeRepository` / `knowledgeEdgeRepository` / `codeEntityRepository` / `bootstrapRepository` / `guardViolationRepository` / `sessionRepository` / `proposalRepository` / `warningRepository` / `lifecycleEventRepository` / `gitDiffCheckpointRepository` / `coverageLedgerRepository`（U2a：deepMining 多轮覆盖账本仓，注释强调它与 gitDiffCheckpointRepository 分坐标系、互不读写）/ `recipeSourceRefRepository`。
- 即：**仓储实例由 Core 的 `AlembicRepositoryBundle` 拥有**，DI 容器只是把 bundle 字段各起一个 DI key 暴露出来（adapter/registry 模式）。

**registerKnowledgeSync（`161-177`）**：
- `knowledgeFileWriter`（`164-168`）：`new KnowledgeFileWriter(resolveDataRoot(ct), writeZone)`（Core，`@alembic/core/knowledge`）。
- `knowledgeSyncService`（`170-176`）：`new KnowledgeSyncService(dataRoot, { sourceRefReconciler })`。`getSourceRefReconciler`（`179-183`）：**软依赖**——仅当 `services.sourceRefReconciler` 已注册（由 KnowledgeModule 提供）才解析，否则传 undefined。这是跨 module 的**弱耦合探测**（`ct.services.<key>` 存在性判断代替强依赖）。

**registerReportStore（`185-193`）**：`reportStore` singleton——`new ReportStore(path.join(dataRoot, '.asd/logs/reports'), writeZone ?? undefined)`（`@alembic/core/infrastructure/report`）。注意 `reportStore` 未列入 ServiceMap 类型表，属 `get(): unknown` 的兼容 key。

**Core 消费点小结**：JobStore(`/daemon`)、EventBus(`/events`)、ReportStore(`/infrastructure/report`)、WriteZone(`/io`)、KnowledgeFileWriter+KnowledgeSyncService(`/knowledge`)、MemoryRepositoryImpl(`/memory`)、createAlembicRepositories(`/repositories`)、resolveDataRoot/resolveProjectRoot(`/workspace`)。plugin-local：AuditStore/AuditLogger、BootstrapTaskManager。

---

### 2.5 KnowledgeModule — 知识 + 搜索 + 向量索引 + 演化装配

文件：`lib/injection/modules/KnowledgeModule.ts`（本层最重的 module）。`register(c)`（`90-95`）调 `registerKnowledgeServices` / `registerSearchServices` / `registerSharedServices` / `registerEvolutionServices`。

#### 2.5.1 knowledge 服务（`106-145`）
- `confidenceRouter`：`new ConfidenceRouter({}, qualityScorer)`（Core `/knowledge`；qualityScorer 来自 AppModule → 依赖 AppModule 先注册）。
- `knowledgeService`（`116-136`）：`new KnowledgeService(knowledgeRepository, auditLogger, null, knowledgeGraphService, {...})`。第 3 参 `null`——注释 PDR-3：governance Gateway 已随死 daemon 路径删除，KnowledgeService 存但从不读该 ctor 参，故传 null 而非解析一个已删的 `gateway` 单例。第 5 参对象注入 fileWriter/skillHooks/confidenceRouter/qualityScorer/eventBus（软探测 `ct.services.eventBus`）/edgeRepo/proposalRepo。
- `knowledgeGraphService`（`138-144`）：`new KnowledgeGraphService(knowledgeEdgeRepository)`。

#### 2.5.2 搜索 + 向量存储（`147-240`）
- `searchEngine`（`148-165`）：`new SearchEngine(db, { aiProvider: null, vectorStore, vectorService?, hybridRetriever, crossEncoderReranker: null, signalBus, knowledgeRepo, sourceRefRepo })`。注释关键（`153-155`）：**Plugin 不再注入第三方 AI/embedding provider**（`aiProvider: null`），语义增强走 Alembic resident service，本地 embedded runtime 保持 baseline/hybrid。`vectorService` 软探测。
- `vectorStore`（`167-218`）：**strategy + fallback 的典型**。先经 `resolveVectorRuntimeRoot(ct)`（`67-88`）解析落盘根：若项目被 `isExcludedProject`（`@alembic/core/shared`）判定为排除项目、且 dataRoot === projectRoot，则把向量运行时重定向到 `tmpdir()/alembic-dev/vector/<sha1(projectRoot).slice(12)>` 并置 `writeZone: undefined`（避免污染源仓库，warn 打点）。然后按 `config.vector.adapter`（default `'auto'`）选适配器：
  - `'json'` → `JsonVectorAdapter`（`initSync()`）。
  - `'hnsw'|'auto'` → `HnswVectorAdapter`（读 M/efConstruct/efSearch/quantize/persistence 参），`try` 内 `initSync()`；**HNSW 初始化失败 → catch → warn → 降级 `JsonVectorAdapter`**。
  - 未知 adapter → 默认 `JsonVectorAdapter`。
  三者均 `@alembic/core/vector`。
- `indexingPipeline`（`220-227`）：`new IndexingPipeline({ projectRoot: dataRoot, scanDirs: resolveKnowledgeScanDirs(ct), vectorStore })`。
- `hybridRetriever`（`229-239`）：`new HybridRetriever({ vectorStore, rrfK: config.vector.hybrid.rrfK ?? 60, alpha: ?? 0.5 })`。

#### 2.5.3 shared 服务（`242-247`，均普通 `register` 直返）
- `enhancementRegistry` → `getEnhancementRegistry()`（Core `/enhancement`）；`languageService` → `LanguageService`（类本体，Core `/shared`）；`dimensionCopy` → `DimensionCopy`（类本体，Core `/dimensions`）；`projectGraph` → `singletons.projectGraph || null`。

#### 2.5.4 演化服务（`249-439`）—— daemon-less Recipe 生命周期的 DI 面
分三组：

**registerEvolutionAnalysisServices（`255-353`）**：
- `sourceRefReconciler`（`256-265`）：`new SourceRefReconciler(projectRoot, sourceRefRepo, knowledgeRepo, { signalBus? })`（Core `/knowledge`）。它同时是 InfraModule `knowledgeSyncService` 软依赖的那个 key。
- `recipeFreshnessService`（`267-281`）：`new RecipeFreshnessService({ sourceRefReconciler, sourceRefRepository, vectorService? })`。
- `stagingManager`（`283-292`）：`new StagingManager(knowledgeRepo, { lifecycle: lifecycleStateMachine, signalBus? })`（Core `/evolution`）。
- `decayDetector`（`294-312`）：`new DecayDetector(knowledgeRepo, { signalBus?, knowledgeEdgeRepo?, sourceRefRepo?, lifecycleStateMachine })`。注释 U4 d2 详解：注入 lifecycleStateMachine 使 staging sweep 命中的 active recipe 经 Core 内部直接 `transition(trigger='decay-detection')→decaying` 并记 `lifecycle_transition_events`（不依赖信号订阅）；且强调 lifecycleStateMachine 工厂不反向依赖 decayDetector，**无循环依赖**；缺省时 Core 仅打分不迁移（向后兼容）。
- `embeddingSimProvider`（`319-327`）：`createRecipeEmbeddingSimProvider({ vectorStore?, logger })`（plugin-local `#recipe-generation/vector/recipe-embedding-sim-provider.js`）。U5#1：无 vectorStore → 句柄 null → 三处演化服务保持缺省纯 Jaccard。
- `redundancyAnalyzer`（`329-337`）/`enhancementSuggester`（`339-346`）/`contentPatcher`（`348-352`）：分别 `new RedundancyAnalyzer` / `EnhancementSuggester` / `ContentPatcher`（Core `/evolution`）。前者注入 `resolveEmbeddingSimProvider(ct)`（`101-104`：从 embeddingSimProvider 句柄取 `.provider`，null → undefined → Core 纯 Jaccard）。

**registerEvolutionWorkflowServices（`355-393`）**：
- `lifecycleStateMachine`（`356-364`）：`new LifecycleStateMachine(knowledgeRepo, lifecycleEventRepo, signalBus, proposalRepo)`——**演化状态机**的核心。
- `proposalExecutor`（`366-380`）：`new ProposalExecutor(knowledgeRepo, proposalRepo, lifecycle, contentPatcher, edgeRepo, resolveEmbeddingSimProvider(ct))`。
- `consolidationAdvisor`（`382-385`）/`evolutionGateway`（`387-392`）：`new ConsolidationAdvisor(knowledgeRepo, simProvider)` / `new EvolutionGateway(proposalRepo, lifecycle, knowledgeRepo)`。

**registerRecipeProductionServices（`395-439`）**：`recipeProductionGateway` singleton——`new RecipeProductionGateway({ knowledgeService, projectRoot: dataRoot, consolidationAdvisor?, proposalRepository?, evolutionGateway?, findSimilarRecipes })`。三个可选依赖各用 `try{ct.get(...)}catch{}` **软解析**（缺失即 null）。注释 U1#5 关键：这是同步 DI 工厂，无法 `await moduleService.load()` 取 canonical 模块轴，故此入口**不注入 knownModuleNames/resolveModuleFromSourceRefs**，Core 的 `#deriveModuleName` 退回 passthrough（加性、向后兼容）；需要 canonical 模块轴的 submit 链路走 tool-router 的 async `createSubmitKnowledgeGateway`。`findSimilarRecipes` 来自 `@alembic/core/service/candidate`。

#### 2.5.5 `initializeKnowledgeServices(c)` — init 后事件绑定（`445-511`）
在容器 `initialize` 尾部由 `ServiceContainer.initialize` 调用。三块：
1. **proposal 信号驱动**（`451-459`）：`proposalExecutor.subscribeToSignals(signalBus)`——best-effort（try/catch），Core 侧 subscribe 幂等（`if(#unsubscribe)return`），重复 init 不放大订阅。刻意放在 eventBus 早 return 之前（proposal 订阅不应依赖 eventBus/searchEngine 就绪）。这是 P3 daemon-less 自动化「轨①」的接通点：真实信号即时驱动 observing proposal 执行。
2. **早退守卫**（`461-463`）：`if (!services.eventBus || !services.searchEngine) return`。
3. **索引一致性 + freshness 绑定**（`465-494`）：`eventBus.on('knowledge:changed', () => searchEngine.refreshIndex())`（修复 keyword 索引与 Vector 索引不一致 bug）；再绑一个 `knowledge:changed` 监听，`action==='create' && entryId` 时 `void _refreshFreshnessForEntry(c, entryId)`（`505-511`，调 plugin-local `refreshRecipeFreshnessByIds`）。全部 try/catch 吞错（non-fatal）。
`await_import_EventBus()`（`498-503`）只是一个占位类型桥（返回 `Object as typeof EventBus`），因实例已通过容器解析，此处仅用于 TS 类型——一个历史遗留的「假动态 import」。

**设计模式落点**：strategy（vectorStore adapter 选择）、fallback/降级（HNSW→JSON、排除项目重定向、simProvider null→Jaccard）、软依赖探测（`ct.services.<key>` / try-catch get）、observer/event-driven（EventBus 绑定 + signalBus 订阅）、state-machine（LifecycleStateMachine + evolution）、gateway（RecipeProductionGateway / EvolutionGateway）。

---

### 2.6 VectorModule — 向量服务装配 + 本地 embed 选道

文件：`lib/injection/modules/VectorModule.ts`。依赖 KnowledgeModule 先注册 vectorStore/indexingPipeline/hybridRetriever，依赖 InfraModule 先注册 eventBus/database。

**register（`33-68`）**：
- `contextualEnricher`（`35`）：**恒 null**——增强由 Codex host agent / Alembic resident service 托管，插件模式禁用本地 enricher（**边界哨兵**）。
- `vectorService`（`38-67`）：`new VectorService({ vectorStore, indexingPipeline, hybridRetriever?, eventBus?, embedProvider: selectedEmbedProvider(ct), contextualEnricher?, autoSyncOnCrud: config.autoSyncOnCrud !== false, syncDebounceMs: ?? 2000, drizzle: db.getDrizzle()? })`（Core `/vector`）。`embedProvider` 由 `selectedEmbedProvider`（`26-31`）从 `singletons._localEmbedSelection`（key 常量 `LOCAL_EMBED_SELECTION_KEY`，`24`）读取——**local-first 选道结果**，null = keyword baseline（向量禁用）。

**initializeVectorService（`75-129`，async 钩子）**：
1. 若 contextualEnricher 且 indexingPipeline 都在且 `config.vector.contextualEnrich`，`pipeline.setContextualEnricher(enricher)`（插件模式下 enricher 恒 null，此分支实际不触发）。
2. 若 `services.vectorService`：**先** `await prepareLocalEmbedProvider(c)` 选道（必须在 vectorService 工厂首跑前，让同步工厂能读到选择），**再** `vectorService.initialize()`；失败仅 warn（non-blocking）。
3. U5#1：`embeddingSimProvider.preheat()`（把预计算 recipe-semantic-region 向量加载进内存、按 recipeId 均值池化），句柄 null 跳过、失败 warn（Jaccard fallback）。

**prepareLocalEmbedProvider（`138-178`）**：GMAP-L3 本地 embed 选道。`resolveLocalEmbeddingConfig(config.vector)` + `selectLocalEmbedLane`（均 plugin-local `#recipe-generation/vector/LocalEmbedding.js`）。若 `!localConfig.enabled` → 置选择 undefined + info「using keyword baseline」。否则 `await selectLocalEmbedLane(...)`（探测本地 Ollama），把结果写 `singletons._localEmbedSelection`；`selection.provider` 命中则 info 打 lane，否则 warn「Ollama unavailable → keyword baseline」。**永不抛**——Ollama 缺席/禁用一律干净降级到 keyword baseline（诚实日志）。

**设计模式**：strategy（embed 选道：local Ollama → keyword baseline）、graceful degrade、边界哨兵（contextualEnricher 恒 null）。

---

### 2.7 SignalModule — 信号基础设施装配

文件：`lib/injection/modules/SignalModule.ts`。注册 4 个 signal 组件（均 `@alembic/core/events`）：
- `signalBus`（`21`）：`new SignalBus()`——统一信号总线，被 Guard/Knowledge/演化几乎所有工厂读 `singletons.signalBus`。**在 ServiceContainer.initialize 里被 eager 预热**（`ServiceContainer.ts:237`），保证 `singletons.signalBus` 提前落缓存。
- `signalBridge`（`25-29`）：`new SignalBridge(signalBus, eventBus)`——SignalBus → EventBus 桥接（adapter）。
- `signalTraceWriter`（`33-38`）：`new SignalTraceWriter(signalBus, path.join(dataRoot, '.asd/logs/signals'), writeZone?)`——全类型信号 JSONL 留痕。
- `signalAggregator`（`42-53`）：`new SignalAggregator(signalBus, reportStore)`，工厂内**立即 `.start()`**，并 `shutdown.register(async () => agg.stop(), 'signalAggregator')`（`lib/shared/shutdown.ts` 的进程级协调器，LIFO 执行、防重入、10s 强杀、install 挂 SIGTERM/SIGINT）。这是 module 与进程级 shutdown 唯一直接耦合点。

注意（`SignalModule.ts:11-13` 注释 RIC-2b）：`ReportStore` 类型从高层 `@alembic/core/report` facade 导入（非低层 `/infrastructure/report`），实例仍走 DI（InfraModule 注册的 reportStore）。

---

### 2.8 AppModule — 应用层杂项服务装配

文件：`lib/injection/modules/AppModule.ts`。
- `qualityScorer`/`recipeParser`/`recipeCandidateValidator`（`28-30`）：分别 `new QualityScorer()`（Core `/service/quality`）/`RecipeParser`/`RecipeCandidateValidator`（Core `/service/recipe`）。qualityScorer 被 KnowledgeModule 的 confidenceRouter 依赖 → AppModule 需在其前（顺序保障）。
- `recipeExtractor`（`31`）：普通 register，直返 `singletons._recipeExtractor`（由 `initRecipeExtractor` 预置的 Core RecipeExtractor 实例）或 null。
- `feedbackCollector`（`33-39`）：`new FeedbackCollector(resolveDataRoot(ct), { wz })`（Core `/service/quality`）。
- `tokenUsageStore`（`41-47`）：`new TokenUsageStore(unwrapRawDb(db), db.getDrizzle())`（Core `/repositories`）。
- `moduleService`（`51-63`）：plugin-local `new ModuleService(projectRoot, { container, qualityScorer, recipeExtractor, guardCheckEngine, violationsStore })`——跨 module 聚合（读 GuardModule 的 guardCheckEngine/violationsStore，惰性解析故无顺序问题）。
- **Resident 能力客户端**（`67-90`）：`residentCapabilityClients` = `createAlembicResidentCapabilityClients({ projectRoot })`（plugin-local）；`residentSearchClient` = 其 `.search`；`residentServiceClient`（`78-90`）= 一个显式 bind 出的聚合门面（enqueueJob/probe/readJob/resolveProjectScopeIdentity/search/searchWithResult）。注释：这是 deprecated 的 HTTP 兼容 key（PDR-4 删掉了 dashboard/decisionRegister/intentEpisode 死 lane，只剩 search+job）。Codex MCP 路径用拆分后的 split clients。
- `primeSearchPipeline`（`92-98`）：`new PrimeSearchPipeline(searchEngine)`（plugin-local）。
- `initRecipeExtractor(c)`（`102-104`）：由 `ServiceContainer.initialize` 在 module 注册前调用，置 `singletons._recipeExtractor = new RecipeExtractor()`。

**Core vs plugin-local**：Core = QualityScorer/FeedbackCollector/RecipeParser/RecipeCandidateValidator/RecipeExtractor/TokenUsageStore；plugin-local = ModuleService/PrimeSearchPipeline/Resident clients。

---

### 2.9 GuardModule 与 SkillHooksModule

**GuardModule**（`lib/injection/modules/GuardModule.ts`，服务均 `@alembic/core/guard`）：
- `guardService`（`27-44`）：`new GuardService(knowledgeRepository, auditLogger, null, { guardCheckEngine })`。第 3 参 null 同 PDR-3（governance Gateway 已删，GuardService 存但不读）。`guardCheckEngine` 用 try/catch 软解析（尚不可用则 null）。
- `guardCheckEngine`（`46-85`）：**配置合并 gateway**——`baseGuard = config.guard`（Alembic 默认）+ `projectGuard`（读 `dataRoot/.asd/config.json` 的 guard 段，try/catch 容错）；`merged = {...base, ...proj}`，并对 `codeLevelThresholds`（对象深并）与 `disabledRules`（数组去重合并 `new Set`）做特殊合并。`new GuardCheckEngine(db, { guardConfig: merged, signalBus?, knowledgeRepo })`。
- `exclusionManager`（`87-91`）/`ruleLearner`（`93-100`）：`new ExclusionManager(dataRoot, { wz })` / `new RuleLearner(dataRoot, { signalBus?, wz })`。
- `violationsStore`（`102-108`）：`new ViolationsStore(unwrapRawDb(db), db.getDrizzle())`。
- `guardFeedbackLoop`（`113-124`）：`new GuardFeedbackLoop(violationsStore, feedbackCollector, { guardCheckEngine, signalBus? })`。
- 注释 W2（`110-112`）：complianceReporter/coverageAnalyzer 的 DI 已随退役的 `alembic_guard` coverage_matrix/compliance_report 路由删除，但 Core 的对应类保留（CCR-3/W3）——**死 DI 已剪、Core 能力仍在**的典型历史包袱记录。

**SkillHooksModule**（`lib/injection/modules/SkillHooksModule.ts`）：只注册 `skillHooks` singleton——`new SkillHooks()` + best-effort `hooks.load().catch(() => {})`（**不 await**，与 Bootstrap 的 await 版不同）。文件头注释点明：AlembicPlugin **不再注册本地 agent runtime 或 terminal execution 服务**，仅保留 Codex-facing SkillHooks。⚠️ 兼容说明：运行期实际用的 `skillHooks` 是 Bootstrap 造好（已 await load）并注入 `singletons.skillHooks` 的那个实例；本 module 的惰性工厂通常不触发（singleton 缓存命中），是「宿主未走 Bootstrap 注入」时的兜底。

---

### 2.10 跨层数据流与设计模式总结

**启动数据流（宿主 → 容器）**：
```
宿主 env (ALEMBIC_PROJECT_DIR / ALEMBIC_MCP_MODE / ALEMBIC_MCP_TIER)
  → McpServer.initialize (configurePathGuard → new Bootstrap().initialize())
    → Bootstrap: settings→pathGuard→workspaceResolver(Ghost)→config→logger→db(migrate)→audit→skillHooks
      → components 袋
  → getServiceContainer().initialize(components)
    → 注入 singletons(database/auditLogger/_projectRoot/_workspaceResolver/_config/skillHooks)
    → initRecipeExtractor → InfraModule → Signal(eager signalBus) → App → Knowledge → Vector → Guard → SkillHooks
    → initEnhancementRegistry → initializeVectorService → initializeKnowledgeServices
  → 下游工具/工作流层 container.get('...') 惰性取服务
```

**服务解析数据流**：`get(key)` → `services[key]()` → 首调 `factory(container)`（工厂再 `container.get(依赖)` 递归解析，或读 `singletons.*` 注入值）→ 结果缓存进 `singletons[key]`。

**设计模式落点**：
- **DI / service locator + lazy singleton**：ServiceContainer 全局；`singleton()`/`register()`/`get()`。
- **facade + 分步初始化状态机**：Bootstrap.initialize 的 0→4 序列；`requireBootstrapComponent` 顺序断言。
- **registry / bridge**：Core `AlembicRepositoryBundle` 经 `getCoreRepositories` 桥接成一组 DI key；enhancementRegistry。
- **gateway / 门禁**：pathGuard、Ghost 白名单、`buildServiceContainerRuntimeConfig`（config 合并）、guardCheckEngine 配置合并、RecipeProductionGateway/EvolutionGateway。
- **strategy + graceful degrade**：vectorStore adapter 选择、HNSW→JSON 降级、排除项目重定向 tmpdir、local embed 选道（Ollama→keyword baseline）、simProvider null→Jaccard。
- **observer / event-driven**：EventBus（knowledge:changed→refreshIndex/freshness）、SignalBus + SignalBridge/Aggregator/TraceWriter、proposalExecutor.subscribeToSignals。
- **state-machine**：LifecycleStateMachine + evolution 服务群（daemon-less Recipe 生命周期）。
- **软依赖探测**：`ct.services.<key>` 存在性 + try/catch get，实现 module 间弱耦合与向后兼容。

**与 @alembic/core 的消费边界**：本层几乎所有服务类都来自 `@alembic/core` 子路径（`/database` `/io` `/logging` `/search` `/shared` `/workspace` `/daemon` `/events` `/infrastructure/report` `/knowledge` `/memory` `/repositories` `/service/quality` `/service/recipe` `/service/candidate` `/dimensions` `/enhancement` `/evolution` `/guard` `/vector` `/report`）。plugin-local 只保留适配/桥接层：Audit（AuditStore/AuditLogger）、SkillHooks、BootstrapTaskManager、ModuleService、PrimeSearchPipeline、Resident capability clients、recipe-generation 向量适配（recipe-embedding-sim-provider / LocalEmbedding / ContextualEnricher）、config（AppConfigLoader）、shared（shutdown / package-assets / project-scope-runtime）。这精确对应仓库 CLAUDE.md「共享内核经 @alembic/core 消费，Plugin 只保留 Codex/host 适配层」的边界规则。

**宿主连接点**：唯一主入口 `lib/runtime/mcp/McpServer.ts`（Codex / Claude Code 的 MCP stdio server）在 `initialize()` 里驱动 Bootstrap + 容器两阶段；`ALEMBIC_MCP_MODE`/`ALEMBIC_PROJECT_DIR`/`ALEMBIC_MCP_TIER`/`ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY` 是宿主传参通道。CLI setup（`lib/cli/SetupService.ts`）是第二入口，复用同一 Bootstrap/容器代码。

**已知历史包袱 / 坑点**：
1. **双 AuditStore/双 SkillHooks**：Bootstrap 造单参 AuditStore + await-load 的 SkillHooks 并注入容器；InfraModule/SkillHooksModule 的工厂（双参 AuditStore、不 await 的 SkillHooks）是未注入时的兜底，运行期通常不触发——阅读时易误判哪个是活的。
2. **PDR-3 死路径**：KnowledgeService/GuardService 第 3 参恒 null（governance Gateway 已随死 daemon 删除，但 ctor 签名保留）。
3. **W2/PDR-4 剪枝残留**：complianceReporter/coverageAnalyzer、residentServiceClient 的 dashboard/decisionRegister/intentEpisode lane 已删，但 residentServiceClient 整体作为 HTTP 兼容 key 仍保留。
4. **假动态 import**：`await_import_EventBus()` 返回 `Object as typeof EventBus`，仅供 TS 类型，无实际动态加载。
5. **同步 DI 工厂的 canonical 模块轴缺口**（U1#5）：recipeProductionGateway 同步工厂无法 await moduleService.load()，故 canonical 模块名注入被推迟到 tool-router 的 async createSubmitKnowledgeGateway。
6. **MCP 模式禁 cwd 回落**：Bootstrap 步 0.5 明确 MCP 模式下不得回落 `process.cwd()`（MCP server cwd = 插件缓存目录），必须由宿主传 `ALEMBIC_PROJECT_DIR`。
7. **多项目单进程绑定**：容器 initialize 硬拒同进程切换项目。


---

## 3. 基础设施与共享层 (Infrastructure + Shared + Types)

本节测绘 `alembic-codex-plugin-runtime`（`package.json:name = alembic-codex-plugin-runtime`，version `0.2.0`）的基础设施与共享层，覆盖三个物理目录：

- `lib/infrastructure/`：audit（审计）、cache（缓存三件套）、config（配置加载收口）、database（plugin 侧 raw SQLite 收口）。
- `lib/shared/`：包资产解析、原生 ProjectScope 运行时解析、优雅停机协调器、HTTP/MCP 两套 Zod schema。
- `lib/types/`：wire 类型（graph/search）与 ambient 类型声明（`*.d.ts`）。

这一层的总体定位是**「plugin 侧的收口边界 + 契约层」**：它自己几乎不实现业务算法，而是把「Core 内核能力」与「Codex / Claude-Code 宿主运行时」之间的**边界原语**集中到少数几个文件里——配置根解析、包根解析、原生空间解析、raw SQLite 访问、缓存策略、审计存储、优雅停机、请求/工具 schema。理解这一层的关键，是理解它如何**注入/覆写 Core 的默认行为**（`_findPackageRoot` 覆写、`getDrizzle()` 依赖注入），以及它守住的两条层级边界：`shared` 不依赖 `runtime`（schema 里内联枚举而不 import contract），`infrastructure` 把所有 raw `prepare()/getDb()` 收口进 `SqliteDatabaseAccess`。

> 术语对照：本仓库通过 `@alembic/core` 包入口消费共享内核（源仓库 `../AlembicCore`）；`.asd/` 是 Alembic 的数据根目录（data root）；`ProjectScope` 是 Alembic 原生的多仓空间配置（`~/.asd/project-scopes.json`），与 Wakeflow 的 `workspace.config.json` 是两套独立配置。

---

### 3.1 config — 配置加载收口 (`AppConfigLoader`)

#### 3.1.1 职责与实现

`lib/infrastructure/config/AppConfigLoader.ts` 是全节最短、但**承重**的一个文件（7 行有效代码）。它不实现任何配置合并逻辑，而是做一件事：**把 Core 的 `ConfigLoader` 的包根发现策略「重定向」到 plugin 自己的 `PACKAGE_ROOT`**。

```
lib/infrastructure/config/AppConfigLoader.ts:1-7
  import ConfigLoader from '@alembic/core/config';
  import { PACKAGE_ROOT } from '../../shared/package-assets.js';
  ConfigLoader._findPackageRoot = () => PACKAGE_ROOT;   // ← 覆写
  export { ConfigLoader };
  export default ConfigLoader;
```

- **输入**：无（模块级副作用）。import 时立刻执行 `ConfigLoader._findPackageRoot = () => PACKAGE_ROOT`。
- **输出**：一个已被 monkey-patch 的 `ConfigLoader` 静态类（默认导出 + 具名导出）。
- **设计模式**：**Adapter + Method Override（猴子补丁）**。plugin 不 fork Core 的配置加载，而是替换掉它唯一的可变发现点。

#### 3.1.2 为什么必须覆写 `_findPackageRoot`

真正的合并逻辑在 Core 里（`../AlembicCore/src/infrastructure/config/ConfigLoader.ts`）。Core 的 `ConfigLoader._findPackageRoot()`（Core `ConfigLoader.ts:17-38`）沿 `import.meta.dirname` 向上最多 10 层查找 `package.json`，且**只认 `pkg.name === '@alembic/core' || 'alembic-ai'`**。

问题：当 Core 作为依赖被 plugin 消费时，Core 的 `import.meta.dirname` 位于 `node_modules/@alembic/core/...`（或 `file:../AlembicCore`），它自动发现到的包根是 **Core 的包根**，于是 `config/default.json` 会去 Core 目录找，而不是 plugin 目录。plugin 需要加载的是**自己 `config/` 目录**下的配置（`lib/shared/package-assets.ts:57 CONFIG_DIR = PACKAGE_ROOT/config`）。因此 `AppConfigLoader` 用 plugin 的 `PACKAGE_ROOT`（认 `@gxfn/alembic-runtime` / `alembic-codex-plugin-runtime` 两个包名，见 3.5.1）覆写这个方法，让 Core 的加载器去 plugin 包根找配置。

这是一个**跨仓兼容层**：Core 侧刻意把 `_findPackageRoot` 设计成 `static` 可覆写属性（而非私有闭包），就是为了给外层留出这个注入点。

#### 3.1.3 Core 侧的三层合并/优先级（被本文件复用）

`ConfigLoader.load(env)`（Core `ConfigLoader.ts:40-81`）实现的加载/合并/优先级链，plugin 完全复用：

1. **default 层**：`{PACKAGE_ROOT}/config/default.json` → `merged`（基线）。
2. **env 层**：`{PACKAGE_ROOT}/config/{env}.json`（`env` 默认取 `process.env.NODE_ENV || 'development'`）→ `_deepMerge(merged, envConfig)` 覆盖 default。
3. **local 层**：`{PACKAGE_ROOT}/config/local.json`（开发者本地覆盖，不入版本控制）→ `_deepMerge` 覆盖前两层。
4. 注入 `merged.env = env`。
5. **非阻塞 Zod 校验**：`AppConfigSchema.safeParse(merged)`，失败**只打印 stderr 警告不抛错**（Core `ConfigLoader.ts:69-75`）——降级路径：配置有瑕疵仍继续运行。
6. 结果缓存到 `ConfigLoader.config`（单例，`load()` 幂等；`get(key)` 支持 `a.b.c` 点路径取值，key 缺失时**抛 Error**，Core `ConfigLoader.ts:108-120`）。

优先级总结：**local > env > default**，object 深合并、array 整体替换（`_deepMerge` 在 `Array.isArray` 时走 else 分支直接覆盖，Core `ConfigLoader.ts:83-106`）。

#### 3.1.4 数据流与唯一消费点

唯一消费者是启动引导 `lib/bootstrap.ts`：

- `lib/bootstrap.ts:9` `import ConfigLoader from './infrastructure/config/AppConfigLoader.js'`
- `lib/bootstrap.ts:133` `ConfigLoader.load(env)` → 完成三层合并
- `lib/bootstrap.ts:134` `this.components.config = ConfigLoader` → 把已加载的配置作为 DI 容器组件挂载，供下游 service/runtime 取用。

**坑/历史包袱**：因为 `AppConfigLoader` 的覆写是**模块级副作用**，它必须在 `ConfigLoader.load()` 被首次调用**之前**被 import。`bootstrap.ts` 通过 `import ... from './infrastructure/config/AppConfigLoader.js'`（而非直接 `@alembic/core/config`）保证了这一点——**任何绕过 `AppConfigLoader` 直接 import Core `@alembic/core/config` 的代码都会拿到未覆写的加载器，读到 Core 目录的配置**。这是一条隐式约束，靠约定而非类型系统保证。

---

### 3.2 database — plugin 侧 raw SQLite 收口 (`SqliteDatabaseAccess`)

`lib/infrastructure/database/SqliteDatabaseAccess.ts`（364 行）是本节最重要的**边界收口点**。文件头注释（`:4-10`）明确了它的定位：

> Codex-facing service / route 可以读取自己的运行态状态，但**不应在业务层直接 `prepare()` / `getDb()`**；所有必须保留的 SQLite fallback、只读状态探测和批量 JSON 更新都经由本文件收口，便于后续继续迁移到 repository 或 Drizzle API。

即：这是 plugin 侧「还没迁到 Core repository / Drizzle」的**残留 raw SQLite 访问的唯一合法出口**。它与 Core repository 的关系是**互补而非重叠**：Core 拥有 Drizzle ORM + repository（`AuditStore` 就走 Core Drizzle，见 3.3.2），而 plugin 侧的**只读状态探测**（source-ref / snapshot）和**破坏性清理**（clearTables / delete-by-lifecycle）因为涉及 plugin 自己的运行态判断，暂时留在这里，用 raw `better-sqlite3` 直连同一个 `alembic.db`。

#### 3.2.1 契约类型（导出的 wire shape）

| 类型 | file:line | 用途 |
| --- | --- | --- |
| `SqliteDb` | `:11-19` | 收窄的 raw sqlite 接口（`exec`/`prepare().get/run/all`/可选 `close`），屏蔽 `better-sqlite3` 全量 API |
| `SourceRefReadState` | `:25-35` | recipe source-ref 表的只读探测结果（active/stale/renamed 计数 + `status: missing/ready/stale/unavailable`） |
| `SnapshotReadState` | `:37-55` | `bootstrap_snapshots` 最新快照的只读探测结果 |
| `RecipeSnapshotRow` | `:57-69` | 从 `knowledge_entries` 导出的 Recipe 快照行 |

#### 3.2.2 `resolveSqliteDb` — 双形态解引用（Adapter）

```
lib/infrastructure/database/SqliteDatabaseAccess.ts:71-80
```
入参 `db: unknown` 可能是「带 `getDb()` 的 wrapper」或「裸 `SqliteDb`」。逻辑：`null` → `null`；有 `getDb` 方法 → 调用；否则原样当 `SqliteDb`。这是一个**Adapter**，让上层无论持有 Core 的 DB wrapper 还是裸 handle 都能取到 raw handle。`getLatestSchemaMigrationVersion`（`:82-92`）就用它读 `schema_migrations` 最新 version（`try/catch` 全吞，失败返回 `null` = 降级）。

#### 3.2.3 只读状态探测：`readSourceRefState` / `readSnapshotState`

两者是**状态机式探测器**，输出带 `status` 判别字段：

`readSourceRefState(databasePath)`（`:94-146`）：
1. 文件不存在 → `status: 'missing'`（`existsSync` 前置门禁，`:95`）。
2. 打开只读 DB（见 3.2.6）→ 表不存在（`recipe_source_refs`）→ `status: 'missing'`。
3. 单条聚合 SQL 统计 `totalCount/activeCount/staleCount/renamedCount/staleRecipeCount`（`:122-132`）。
4. **门禁分支**：`staleCount > 0` → `status: 'stale'` + `reason: 'recipe source references contain stale files'`；否则 `status: 'ready'`（`:137-141`）。

`readSnapshotState(databasePath, projectRoot)`（`:148-205`）：
1. 文件不存在 → `missing`。
2. 表不存在（`bootstrap_snapshots`）→ `missing`。
3. `WHERE project_root = ?` 统计总数 + 取**最新 `status='complete'` 快照**（`ORDER BY created_at DESC LIMIT 1`，`:173-182`）。
4. 无 complete 快照 → `status: 'missing'`；有则解析并**用 `jsonArrayLength` 计算 `changed_files`/`affected_dims` 的数组长度**（`:187-196`）、`is_incremental` 数值转布尔。

**注意 projectRoot 的作用**：snapshot 探测按 `project_root` 过滤，是**多项目共库**下的隔离键——同一个 `alembic.db` 里可以有多个项目的快照。source-ref 探测则不按 project_root 过滤（表本身是当前库范围）。

#### 3.2.4 只读查询：`listTableColumnNames` / `queryRecipeSnapshotRows` / `exportTablesAsJsonLines`

- `listTableColumnNames`（`:207-211`）：`PRAGMA table_info(<ident>)` 读列名。`<ident>` 经 `assertSqlIdentifier` 白名单校验（见 3.2.7）。用于让上层动态判断某列是否存在（如 `hasDimensionId`）。
- `queryRecipeSnapshotRows`（`:213-230`）：从 `knowledge_entries` 导出 Recipe 快照行，**条件拼接 SQL**——`hasDimensionId` 为 true 时选 `dimensionId` 列，否则 `'' AS dimensionId`（兼容旧库无该列）；`sourceRefsJson` 通过 `json_extract(reasoning, '$.sources')` 从 JSON 列抽取；`lifecycleFilterSql` + `lifecycleParams` 由调用方传入（参数化 WHERE）。
- `exportTablesAsJsonLines`（`:232-251`）：把多表全量 `SELECT *` 序列化为 JSONL（每行 `{ _table, ...row }`）。**逐表 `try/catch`**：某表不存在时静默跳过（`:246-248`），继续导其他表——降级路径，用于备份/迁移导出。

#### 3.2.5 破坏性写：`clearTables` / `deleteKnowledgeEntriesByLifecycle`

- `clearTables(db, tables)`（`:253-275`）：逐表 `DELETE FROM <ident>`。**关键分支**：catch 到错误时，只有当消息**不含 `'no such table'`** 才计入 `errors`（`:269`）——「表不存在」被当作可接受的幂等结果，不算失败。返回 `{ clearedTables, errors }`。
- `deleteKnowledgeEntriesByLifecycle(db, lifecycles)`（`:277-294`）：`DELETE FROM knowledge_entries WHERE lifecycle IN (?, ?, ...)`（占位符按数量生成，参数化）。返回 `{ cleared, error }`。

这两个是 `CleanupService` 的底层执行器（见 3.2.8 消费点）。

#### 3.2.6 只读连接生命周期：`withReadonlyDatabase` / `openReadonlyDatabase`

```
lib/infrastructure/database/SqliteDatabaseAccess.ts:296-316
```
- `openReadonlyDatabase`：`new Database(path, { fileMustExist: true, readonly: true })`，打不开返回 `null`（`try/catch`）。
- `withReadonlyDatabase<T>(path, reader)`：**RAII/facade 模式**——打开失败 → `unavailable(path)`（`status: 'unavailable'`, reason `database could not be opened read-only`）；`reader` 抛错 → `unavailable(path, true)`（reason `database table could not be queried`）；`finally` 里 `db.close?.()` **保证关闭**。这是所有只读探测的统一入口，把「打不开/查不了」两种失败态归一成 `unavailable`。

`unavailable(path, queried)`（`:325-340`）返回一个**同时满足 SourceRefReadState 和 SnapshotReadState 的宽联合对象**（含两套字段 `activeCount...` 与 `latest`），靠 TS 的 `as T` 断言让两个探测器复用同一个 fallback 构造器。这是一个小的类型妥协（union 超集）。

#### 3.2.7 SQL 注入防护：`assertSqlIdentifier`

```
lib/infrastructure/database/SqliteDatabaseAccess.ts:342-347
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) throw new Error(`Unsafe SQLite identifier: ${identifier}`);
```
所有**表名/列名拼进 SQL 字符串**的地方（`PRAGMA table_info`、`DELETE FROM`、`SELECT * FROM`）都先过这个白名单正则，因为标识符无法参数化。**值**则一律用 `?` 占位参数化。这是本文件的安全门禁。辅助函数 `numeric`（`:349-351`，容错数值转换）和 `jsonArrayLength`（`:353-363`，JSON 解析失败返回 0）提供防御性归一化。

#### 3.2.8 消费点（谁调用它）

- `lib/runtime/KnowledgeState.ts:5,478,482`：import `readSourceRefState`/`readSnapshotState`，在 `KnowledgeState` 里用 `resolver.databasePath`/`resolver.projectRoot` 探测 source-ref 与快照就绪度（喂给 `alembic_status`）。
- `lib/service/cleanup/CleanupService.ts:37-44`：import `clearTables` / `deleteKnowledgeEntriesByLifecycle` / `exportTablesAsJsonLines`，在 rescan/force-rescan 清理链里对 `ALL_DATA_TABLES` / `TASK_DATA_TABLES` / `RESCAN_CLEAN_TABLES` / `FORCE_RESCAN_CLEAN_TABLES` 执行清理（`:263,270,345,350,363,417`）。

**与 Core 的关系**：本文件用的是同一个物理 `alembic.db`，但走 raw `better-sqlite3` 而非 Core Drizzle。它是「未迁移完的历史残留」的**受控收口**——注释明说「便于后续继续迁移到 repository 或 Drizzle API」。这是本节标记的最大历史包袱。

---

### 3.3 audit — 审计日志（Logger + Store 两层）

#### 3.3.1 `AuditLogger` — 记录器（兼容两种入参格式）

`lib/infrastructure/audit/AuditLogger.ts`（147 行）是审计的**门面/Facade**，屏蔽存储细节，并做**格式归一化**：

- 构造：`constructor(auditStore, eventBus?)`（`:14-18`），持有 `AuditStore` + Core `Logger.getInstance()` + 可选 `#eventBus`（私有字段）。**DI**：store 与 eventBus 都从外部注入。
- `log(entry)`（`:26-88`）：**兼容两种调用风格**（`:20-25` 注释）——
  - Gateway 风格：`{ actor, action, resource, result, data, duration }`
  - Service 风格：`{ actor, action, resourceType, resourceId, details, timestamp }`

  归一逻辑：`resource = entry.resource || (resourceType && resourceId ? '${resourceType}:${resourceId}' : undefined)`（`:41-45`）；`data = entry.data || (details ? { details } : {})`（`:48`）。然后组装 `auditEntry`（id 用 `requestId` 或 `generateId()`，`actor_context`/`operation_data` 都 `JSON.stringify`，`:50-61`）。
  - **失败隔离门禁**（`:81-87`）：`auditStore.save` 抛错时**只记 error 日志、不向上抛**——「审计失败不应阻断业务」。这是关键降级路径。
  - **实时推送**（`:71-80`）：save 成功后若有 `#eventBus`，`emit('audit:entry', {...精简字段})`（M7 §6 Socket.io 审计流）。
- `generateId()`（`:91-93`）：`audit_${Date.now()}_${random36}`。
- `formatResource`（`:96-106`）：string 原样、object 转 JSON、其他 `String()`。
- 查询代理方法（`:108-143`）：`query/getByRequestId/getByActor/getByAction/getFailures/getStats` 全部**直接委托** `auditStore` 对应方法（thin delegation）。

#### 3.3.2 `AuditStore` — 存储（全 Drizzle，消费 Core）

`lib/infrastructure/audit/AuditStore.ts`（224 行）是**唯一直接消费 Core Drizzle 层的基础设施文件**，与 3.2 的 raw sqlite 形成对比：

Core 消费点（`:3-6`）：
- `import type { DrizzleDB } from '@alembic/core/database'`
- `import { getDrizzle } from '@alembic/core/infrastructure/database/drizzle'`
- `import { auditLogs } from '@alembic/core/infrastructure/database/drizzle/schema'`
- `drizzle-orm` 的 `and/avg/count/desc/eq/gte/lte/sql`

构造（`:9-12`）：`constructor(db, drizzle?)` — `this.#drizzle = drizzle ?? getDrizzle()`。**DI + 默认单例**：允许注入测试 drizzle，否则用 Core 全局 `getDrizzle()`。注意入参 `db`（`{ getDb }`）在构造里**未被使用**（历史签名遗留，实际走 Core Drizzle 单例）。

方法（全类型安全 Drizzle 查询构建）：
- `save`（`:15-42`）：`insert(auditLogs).values({...camelCase 映射 snake_case 入参...}).run()`。字段映射：`actor_context → actorContext`、`operation_data → operationData`、`error_message → errorMessage`。
- `query(filters)`（`:45-86`）：**动态条件构建**——按 `actor/action/result/startDate/endDate` push 到 `conditions[]`，`and(...conditions)` 合并（空则 `undefined`），`orderBy(desc(timestamp))`，可选 `limit`。这是把 3.5.4 HTTP 层 filters 落地的执行器。
- `findByRequestId/findByActor/findByAction/findByResult`（`:89-124`）：定向单条件查询。
- `getStats(timeRange)`（`:127-203`）：**多聚合统计**——`timeRange` 映射到小时窗口（`24h→24 | 7d→168 | 其他→720`，即 30d，`:128`），起始条件 `gte(timestamp, startTime)`。分别算 total / success / failure / byActor(groupBy) / byAction(groupBy) / avgDuration（`avg()` 且 `duration IS NOT NULL`）。返回含 `successRate` 百分比字符串、`avgDuration` 带 `ms` 后缀或 `'N/A'`。
- `cleanup({ maxAgeDays = 90 })`（`:209-220`）：`delete(auditLogs).where(timestamp < cutoff)`，**全 `try/catch` 吞错返回 `{ deleted: 0 }`**——清理失败不影响主流程。

**设计模式**：Logger/Store 分层 = **Repository（Store）+ Facade（Logger）**；Store 内是 **Query Builder（Drizzle）**。

---

### 3.4 cache — 缓存三件套 (`CacheService` / `GraphCache` / `UnifiedCacheAdapter`)

三个文件是**两种不同缓存**，被 `UnifiedCacheAdapter` 表面上「统一」，但当前实现只落地内存一种。

#### 3.4.1 `CacheService` — 进程内内存 TTL 缓存

`lib/infrastructure/cache/CacheService.ts`（132 行）：
- `class CacheService`：`cache: Map<string, { value, expiresAt }>` + 定时清理器。
  - 构造（`:13-25`）：`setInterval(cleanupExpired, 60000)` 每 60 秒扫描清过期项，**`.unref()`**（`:22-24`）避免定时器阻止进程退出——关键，否则 plugin stdio 进程无法优雅退出。
  - `get(key)`（`:28-42`）：命中且未过期返回 value；**惰性过期**——过期项在读时删除并返回 `null`。
  - `set(key, value, ttlSeconds=300)`（`:48-51`）：默认 5 分钟 TTL，`expiresAt = now + ttl*1000`。
  - `delete/clear/cleanupExpired/getStats/shutdown`（`:54-89`）：`shutdown` 清定时器 + `clear()`。
- `class CacheKeyBuilder`（`:93-128`）：**静态键生成器**——`candidate/candidatesList/recipe/recipesList/rule/rulesList/health/stats`，把「资源+分页+过滤」编码成稳定 key（如 `candidates:list:${page}:${limit}:${status}`）。避免各处手拼 key 不一致。
- 导出**单例** `cacheService = new CacheService()`（`:131`）。

#### 3.4.2 `GraphCache` — 基于文件的图数据持久化缓存

`lib/infrastructure/cache/GraphCache.ts`（160 行）是完全不同的一种缓存：**磁盘 JSON + contentHash 失效**，用于 SPM 依赖图 / AST ProjectGraph（`:6-10`）。缓存位置 `{projectRoot}/.asd/cache/{key}.json`（`:29`）。

Core 消费点：
- `import type { WriteZone } from '@alembic/core/io'`（`:14`）
- `import Logger from '@alembic/core/logging'`（`:15`）
- `import { computeContentHash } from '@alembic/core/shared'`（`:16`）

关键设计：**WriteZone 双写路径（gateway 门控 vs 直写）**——
- 构造（`:28-32`）：`constructor(projectRoot, writeZone?)`，`#wz = writeZone ?? null`。projectRoot 也可以是 Ghost 模式下的外置 dataRoot（`:24` 注释）。
- `save`（`:40-64`）：payload = `{ version:1, savedAt, ...meta, data }`。**分支**：有 `#wz` → 走 `wz.ensureDir(wz.runtime('cache'))` + `wz.writeFile(wz.runtime('cache/${key}.json'))`（受 WriteZone 管控）；无 `#wz` → 直接 `mkdirSync` + `writeFileSync`。这是 **Ghost/外置工作区**下写入必须经 WriteZone、本地模式下可直写的**兼容双路**。
- `load`（`:71-83`）：读 `{key}.json`、`JSON.parse`；文件不存在返回 `null`，解析失败 `warn` + `null`（降级）。
- `isValid(key, currentHash)`（`:90-96`）：`load().contentHash === currentHash` → 内容 hash 匹配才算有效缓存。
- `invalidate`（`:99-117`）：同样双路（WriteZone `remove` vs `unlinkSync`）。
- `computeFileHash/computeContentHash/computeFileHashes`（`:124-154`）：委托 Core `computeContentHash`（sha256 前 16 字符），批量版返回 `{ relativePath: hash }` 映射（用 `relative(projectRoot, fp)` 归一路径）。

**注意**：`GraphCache` 是**每次 `new`**（无单例导出），构造需注入 projectRoot（可选 WriteZone），符合 per-project 隔离；`CacheService` 是全局单例。两者语义正交，不要混淆。

#### 3.4.3 `UnifiedCacheAdapter` — 统一缓存适配器（仅内存模式）

`lib/infrastructure/cache/UnifiedCacheAdapter.ts`（104 行）：**Adapter + 单例 + 预留扩展**。
- 构造（`:12-15`）：`mode = 'memory'`，`memoryService = memoryCacheService`（复用 3.4.1 单例）。
- 异步门面方法 `get/set/delete/clear`（`:23-62`）：全部 `try/catch` 委托 `memoryService`，出错记 Core Logger 并返回安全默认（`null`/`false`）——**永不抛错**。
- `initialize`（`:18-20`）：仅打印「✅ 内存缓存已启用」。
- `getStats`（`:65-68`）/`healthCheck`（`:71-73`）：返回 `{ mode:'memory', available/healthy:true }`。
- 单例工厂 `initCacheAdapter(_opts)`（`:84-93`）：幂等（已初始化则 `warn` 返回现有实例）；`getCacheAdapter()`（`:96-101`）：未初始化时**抛 Error**。

**历史包袱/降级**：文件头注释（`:1-4`）与 `CacheService` 头注释（`:3-5`）都写「生产环境建议通过 UnifiedCacheAdapter 接入 Redis」，但 `_opts.mode` 参数（`:79-83`）标注「预留配置 (目前仅支持 memory 模式)」——**Redis 路径从未实现**，`mode` 恒为 `'memory'`。这是一个已声明的**预留但未落地的扩展点**（strategy 的空位）。

---

### 3.5 shared — 包资产 / 原生空间 / 停机 / schema

#### 3.5.1 `package-assets.ts` — PACKAGE_ROOT 解析与资产路径

`lib/shared/package-assets.ts`（66 行）是**整个 plugin 的路径锚点**，`AppConfigLoader` 的 `PACKAGE_ROOT` 就来自这里。

- `findPackageRoot()`（`:17-43`）：从 `import.meta.dirname` 向上最多 10 层找 `package.json`，**只认 `PLUGIN_RUNTIME_PACKAGE_NAMES = { '@gxfn/alembic-runtime', 'alembic-codex-plugin-runtime' }`**（`:12-15`）。到根仍未找到 → **抛详细 Error**（`:37-42`，列出候选包名，便于诊断）。
- `export const PACKAGE_ROOT = findPackageRoot()`（`:45`）：模块级求值，进程内只解析一次。
- `getPackageVersion()`（`:47-55`）：读 `PACKAGE_ROOT/package.json` 的 `version`，失败 fallback `'0.0.0'`（降级）。
- 资产目录常量（`:57-65`），全部基于 Core 的 `DEFAULT_FOLDER_NAMES.package.*` 拼接（Core 消费点：`import { DEFAULT_FOLDER_NAMES } from '@alembic/core/workspace'`，`:9`）：
  - `CONFIG_DIR = PACKAGE_ROOT/config`（`AppConfigLoader` 加载的三层 JSON 就在这）
  - `PACKAGE_SKILLS_DIR` = `INTERNAL_SKILLS_DIR`（内置 skills）
  - `TEMPLATES_DIR` / `RESOURCES_DIR`

**为什么两个 `findPackageRoot` 并存（本文件 vs Core `ConfigLoader`）**：算法相同（向上 10 层、认包名、抛错），但**认的包名不同**——Core 认 `@alembic/core`/`alembic-ai`，plugin 认 `@gxfn/alembic-runtime`/`alembic-codex-plugin-runtime`。这正是 3.1.2 覆写存在的根因：两个包在依赖树里是不同目录，各自要找到**自己**的包根。**设计模式**：两处都是**Package-root Resolver（自举定位器）**，plugin 用自己的结果去覆写 Core 的默认结果。

#### 3.5.2 `project-scope-runtime.ts` — 解析 Alembic 原生 ProjectScope

`lib/shared/project-scope-runtime.ts`（159 行）负责在运行时解析 **Alembic 原生的多仓空间配置 ProjectScope**（`~/.asd/project-scopes.json`，与 Wakeflow 的 `workspace.config.json` 无关）。它是冷启动 ProjectContext 质量的关键接线（对应 memory「alembic-plan-space-membership-scoping」需求方向）。

Core 消费点（`:1-12`）——大量走 `@alembic/core/shared` 与 `@alembic/core/workspace`：
- `loadProjectScopeForFolder / normalizeProjectScopeSummary / resolveProjectScopeForFolder / readProjectScopeRegistryDocument / summarizeProjectScopeDescriptor` + 类型 `ProjectDescriptor/ProjectFolderDescriptor/ProjectScopeSummary`（from `@alembic/core/shared`）
- `WorkspaceResolver`（from `@alembic/core/workspace`）

导出接口与函数：
- `ProjectScopeRuntime = { descriptor: ProjectDescriptor; summary: ProjectScopeSummary }`（`:16-19`）。
- `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY_ENV`（`:14`）= 环境变量名 `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY`——宿主可以通过 env 直接注入序列化的 scope summary（transport 通道）。
- `serializeProjectScopeSummary`（`:21-28`）：summary → JSON 字符串（供写入 env）。
- `readProjectScopeRuntimeFromEnv()`（`:30-47`）：读 env → `normalizeProjectScopeSummary(JSON.parse)` → 若有效则 `projectScopeSummaryToDescriptor` 反推 descriptor。**解析失败 `try/catch` 返回 `null`**（降级）。
- `resolveProjectScopeRuntime(projectRoot)`（`:49-67`）**主入口**，**三级 fallback strategy**：
  1. **env 优先**：`readProjectScopeRuntimeFromEnv()` 且 `isProjectScopeSummaryForFolder(summary, projectRoot)` 匹配当前目录 → 直接用（避免磁盘 IO，宿主已注入的快照最快）。
  2. **磁盘加载**：`loadProjectScopeForRuntimeProject(projectRoot)` 得 descriptor → `resolveProjectScopeForFolder` 定位当前 folderId → `summarizeProjectScopeDescriptor` 生成 summary。
  3. 都失败 → `null`。
- `isProjectScopeSummaryForFolder`（`:69-83`）：判定 summary 是否覆盖某 folderPath——匹配 `currentFolderPath` / `controlRoot` / 任一 `folder.path|realpath`（经 `samePath` 用 `path.resolve` 归一比较，`:128-133`）。
- `projectScopeSummaryToDescriptor`（`:85-110`）/`projectScopeFolderSummaryToDescriptor`（`:112-126`）：summary → descriptor 的**反向映射器**，其中 `storage.kind = 'ghost'`、`dataRootSource = 'ghost-registry'`、`projectRootWriteAllowed = false`（`:100-107`）——从 env summary 反推的 descriptor 强制标记为 **Ghost 存储模式**（写受限）。
- `loadProjectScopeForRuntimeProject(projectRoot)`（`:135-159`）**磁盘加载三级 fallback**：
  1. `WorkspaceResolver.fromProjectScopeRegistry(projectRoot)` 且 `resolver.projectScope` 存在 → 用（**首选正式 registry 加载器**）。
  2. `loadProjectScopeForFolder(projectRoot)`（Core 直接按 folder 读）。
  3. 遍历 `readProjectScopeRegistryDocument().scopes`，找 `controlRoot.path === resolve(projectRoot)` 的 scope（`:150-158`）。
  - 每级都 `try/catch` 吞错 fall-through，保证「registry 坏了也能退到直接读」。

**设计模式**：**Strategy/Chain（env → registry-resolver → folder → registry-scan 逐级降级）+ Mapper（summary↔descriptor 双向）**。

消费点（谁调用 `resolveProjectScopeRuntime`）：`lib/bootstrap.ts:191`、`lib/cli/SetupService.ts`、`lib/runtime/runtime/ProjectRuntimeContext.ts`、`lib/runtime/mcp/McpServer.ts`、`lib/runtime/status/StatusService.ts`、`lib/runtime/mcp/host/embedded-executor.ts`——即**所有需要知道「当前项目在哪个原生空间、data root 在哪、是否 Ghost 写限制」的运行时入口**。

#### 3.5.3 `shutdown.ts` — 统一优雅停机协调器

`lib/shared/shutdown.ts`（128 行）是一个**单例 ShutdownCoordinator**，供所有 plugin 运行时入口共用（`:1-11` 头注释列出 5 条保证）。

- `class ShutdownCoordinator`（`:27-121`）：
  - `#hooks: { label, fn }[]`（私有，LIFO 栈语义）；`#shutting`（防重入门禁）；`#timeoutMs`（默认 `DEFAULT_TIMEOUT_MS = 10_000`）。
  - `register(fn, label='anonymous')`（`:46-48`）：压栈。
  - `setTimeout(ms)`（`:54-56`）：调强杀超时。
  - `execute(signal)`（`:64-96`）**核心状态机**：
    1. 防重入——`#shutting` 已 true 直接 return（`:65-67`），保证多次信号只跑一轮。
    2. `#shutting = true`，stderr 打印「draining…」。
    3. **硬超时保护**：`setTimeout(() => process.exit(1), #timeoutMs)` + `.unref()`（`:73-77`）——超时强杀，不让某个卡住的 hook 挂死进程。
    4. **倒序执行**：`[...#hooks].reverse()` LIFO（后注册先关，`:79-80`）。
    5. **hook 隔离**：逐个 `await fn()`，单个抛错记 `✗ label` 并置 `hasFailure`，**不中断后续 hook**（`:82-91`）。
    6. `clearTimeout` + 按 `hasFailure` 决定 `process.exit(0|1)`（`:93-95`）。
  - `install()`（`:102-110`）：注册 `SIGTERM`/`SIGINT` handler，`void this.execute(signal)`（`execute` 自己 `process.exit`，故用 `void` 抑制未处理 promise 告警）。
  - `isShuttingDown` / `hookCount`（`:113-120`）：getter，供诊断/测试。
- 导出**单例** `shutdown = new ShutdownCoordinator()`（`:127`）。

**设计模式**：**Singleton + Observer/Hook Registry + LIFO 栈 + Circuit-breaker（硬超时）**。消费点：`bin/host-mcp.ts`（入口 install + register DB close 等）、`lib/injection/modules/SignalModule.ts`（注册信号相关清理 hook）。WAL checkpoint（`:9`）由注册进来的 DB close hook 完成，本文件只做编排。

#### 3.5.4 `schemas/http-requests.ts` — Express 路由 Zod schema

`lib/shared/schemas/http-requests.ts`（230 行）为 HTTP（Express）路由提供**运行时输入校验**（`:1-13`），覆盖 knowledge / search / guard / skills / modules / graph / ai / auth。

- 复用片段：`BatchIds`（`ids` 1..100，`:22-24`）、`PaginationQuery`（`page≥1 default 1`、`limit 1..1000 default 20`，`coerce.number`，`:26-29`）。
- Knowledge（`:33-90`）：`CreateKnowledgeBody`（`content` 支持 string 或 record 联合、`.loose()` 容忍额外字段）、`UpdateKnowledgeBody`（`.refine` 要求至少一个字段）、`Deprecate/BatchPublish/BatchDelete/BatchDeprecate`、`KnowledgeUsageBody`、`KnowledgeListQuery`（扩展分页）。
- Search（`:94-125`）：`SearchQuery`（`q` 必填、`type/mode` 枚举、`groupByKind` 字符串 `'true'/'false'` transform 成 boolean）、`ContextAwareSearchBody`、`SimilarityBody`。
- Guard（`:129-146`）：`GuardFileBody`、`GuardBatchBody`（`files` 1..50）。
- Skills（`:150-165`）：`CreateSkillBody`、`UpdateSkillBody`（`.refine` 至少一字段）。
- Modules（`:169-197`）：`ScanFolder/ScanTarget/ScanProject/ModuleBootstrap/ModuleRescan`Body（`ScanTargetBody` `.refine` 要求 `target` 或 `targetName` 二选一）。
- Graph（`:201-212`）、AI（`:216-222`）、Auth（`:226-229`，中文错误消息「用户名/密码不能为空」）。

**设计模式**：**Schema-first 校验（Zod）+ 组合复用（`.extend`/`.merge`）**。这是 HTTP 面（Dashboard/API server）的输入门禁，与 3.5.5 的 MCP 面并列但独立。

#### 3.5.5 `schemas/mcp-tools.ts` — MCP 工具输入 Zod schema（承重契约）

`lib/shared/schemas/mcp-tools.ts`（1479 行，本节最大文件）定义**每个 Codex MCP 工具的输入 Zod schema**，既做运行时校验，又通过 `zodToJsonSchema()` 自动生成 `inputSchema` 声明（`:1-10` 消除双重维护）。命名约定 `{ToolSuffix}Input`。

Core 消费点（`:12-22`）：
- `describeSubmitToolFields` from `@alembic/core/knowledge`（V3_FIELD_SPEC 单源字段描述）
- `ComplexityEnum/ContentSchema/IdField/LanguageField/ReasoningSchema/ScopeEnum/StrictKindEnum/TitleField` from `@alembic/core/shared`

**层级边界守卫（关键坑）**：`:114-116` 明确 `AgentHostSchema = z.enum(['codex', 'claude-code'])` **本地内联**而**不 import `runtime/contract`**——注释 RC-5 说明：为守住「**shared 不依赖 runtime**」的层级边界，宁可内联真实双宿主枚举也不跨层 import。这是本节体现的第二条层级纪律（第一条是 3.2 的 sqlite 收口）。

主要 schema（按工具）：
- **Host intent / turn metadata**（`:52-108`）：`HostDeclaredIntentInput`（query/summary/goal/action/scenario/module/labels/keywords/sourceRefs/confidence...）、`HostTurnMetaInput`（turnId/messageId/threadId/conversationId/sessionId —— 注释强调 raw id **由 handler 存 redacted hash**，schema 只收原始值）。
- **Agent-facing 公共工具**（`:138-332`）：`AgentPublicToolBaseInput`（agentHost/inputSource 枚举优先/intentKind/userQuery/hostDeclaredIntent/sourceRefs/projectRoot...）为基类，派生：
  - `PrimeInput`（`:197-248`）：`.strict().superRefine` **门禁**——要求 taskAction + requirementGoal + **至少一个 locator facet**（capability/scenario/domainObjects/integrationBoundary/qualityConcerns），否则加 custom issue（`:228-244`）。
  - `WorkInput`（`:257-308`）：`phase` 判别（start/finish），start/finish 字段全 optional，**per-phase 必填由 handler 强制**（MTC-7 合并 lifecycle，`:253-256`）。
  - `CodeGuardInput`（`:310-332`）：files/code/workRef 三种 scope；注释强调「no-args whole-diff 被有意 block」，`diffRef/primeRef/acceptedGuards` 未公开（`:329-331`）。
- **Search/Graph/RecipeMap**（`:338-635`）：`KnowledgeContextBudgetInput`（预算：token/item/detail/relationHop/contentChar/matrixNode/nextAction 上限，`:338-349`）、`KnowledgeContextFreshnessInput`（`policy: preferFresh/allowStale/requireFresh/snapshotOnly`，`:357-367`）、`SearchInput`（operation search/get/expand + `.superRefine` 要求 search 至少有 query|keywords|显式过滤，get/expand 要求 ref，`:422-451`）、`GraphInput`（`GRAPH_QUERY_KINDS` 13 种 queryKind，`:470-484`；含 deprecated `operation/nodeId/...` 兼容别名，注释说明「不是公共契约、仅让缓存的旧参数仍能 parse 并归一到 queryKind」，`:575-590`）、`RecipeMapInput`。
- **SubmitKnowledge**（`:649-816`）：`SubmitKnowledgeItemSchema`（单条严格 schema，字段描述经 `describeSubmitField` 优先取 Core V3_FIELD_SPEC 规范表、缺失回退本地串，`:27-33,651-774`）；`SubmitKnowledgeInput` 的 `items` 实际用 `z.array(z.record())` 宽容接收（`:777-785`），**严格校验推迟到 handler 层**（schema 只做文档/类型推导）。
- **Plan**（`:822-1065`）：`PlanInput`（operation draft/confirm/get）带**大段 `.superRefine`**——`confirm` 时逐项校验 generationStage/projectProfile/selectedDimensions/scale/moduleBindings/plannedNextActions/evidenceRefs/rationale 全非空且各字段 `targetRecipes>0`（`:956-1064`）。这是「无状态前置契约」（memory alembic-plan-draft-pure-collection）在 schema 层的落点。
- **Bootstrap/Rescan/DimensionComplete/Evolve/Consolidate/KnowledgeLifecycle**（`:1102-1439`）：各生成/生命周期工具输入；`BootstrapInput.rebuild` 带数据丢失门禁描述（`:1112-1119`）；`KnowledgeLifecycleInput.action` 只开放 `reactivate`（publish/deprecate 走 Dashboard/admin，`:1371-1383`）。
- **Retired TaskInput**（`:1306-1364`）：注释明确「仅保留历史 unit 覆盖与迁移证据，**不在 TOOL_SCHEMAS、不得暴露为 MCP 工具**」（`:1300-1305`）。

**注册表与 strict 门禁**（`:1441-1478`）：
- `ROUTED_TOOL_SCHEMAS`（`:1457-1474`）：`toolName → schema` 映射表（17 个活跃工具）。
- `strictToolInput(schema)`（`:1453-1455`）：`ZodObject` → `.strict()`。注释 QD2（`:1445-1452`）解释：call-time parse 拒绝未知顶层 key（结构化 `VALIDATION_ERROR`），但**不改 published wire schema**——`zodToMcpSchema` 会剥掉 `additionalProperties:false`，故 strict/非 strict 序列化结果一致，只收紧运行时 parse。
- `export const TOOL_SCHEMAS`（`:1476-1478`）：对 `ROUTED_TOOL_SCHEMAS` 逐个套 `strictToolInput` 生成最终注册表，供 `wrapHandler` 自动注入校验。

**设计模式**：**Schema-first 契约 + Registry（TOOL_SCHEMAS）+ 组合继承（base→派生）+ 自定义门禁（superRefine）**。宿主连接点：`agentHost` 枚举 = `codex | claude-code`（双宿主）；`projectRoot` 由 Codex host runtime 供入；host intent/turn-meta 是 Plugin-owned Codex intake（`:48-50`）。

---

### 3.6 types — wire 类型与 ambient 声明

#### 3.6.1 `graph-shared.ts` — 图谱共享类型

`lib/types/graph-shared.ts`（46 行）：Bootstrap 管道与 KnowledgeGraphService 共享的实体/边概念（`:1-6`），统一枚举避免 string literal 漂移。
- `EntityType`（`:9-16`）：`class|protocol|category|module|pattern|function|file`。
- `RelationType`（`:19-28`）：`inherits|conforms|extends|depends_on|uses_pattern|is_part_of|calls|data_flow|discovered_in`。
- `GraphNodeRef`（`:31-35`）`{ id, type, name }` / `GraphEdgeRef`（`:38-45`）`{ fromId, fromType, toId, toType, relation, weight? }`。
- 注意：这套 snake_case relation（`depends_on`）与 3.5.5 `GraphInput.relationType` 的 camelCase（`dependsOn`）是**两套不同枚举**——前者是内部图谱实体关系，后者是 MCP 工具面的 ProjectContext relation。不要混用。

#### 3.6.2 `search-wire.ts` — 搜索结果分层类型

`lib/types/search-wire.ts`（70 行）：把 `SearchResultItem` 的 25+ optional 字段拆成有层次的类型（`:1-6`，「现有代码可继续用 SearchResultItem，新代码用分层类型」）。
- `SearchHitBase`（`:13-21`）：所有命中共有（id/title/trigger/kind?/language?/category?/knowledgeType?）。
- `WeightedHit`（`:28-31`，`weightedScore`+matchedTokens?）/ `VectorHit`（`:34-37`，`vectorScore`+embeddingModel?）：**特化命中**（FieldWeighted vs Vector 两种召回源）。
- `RankedSearchItem`（`:44-58`）：排序后统一项，含分数来源（weighted/vector）+ 排序信号（relevance/authority/recency/finalScore）+ 展示字段。
- `SearchResponse`（`:65-70`）：`{ items, total, query, mode: 'weighted'|'semantic'|'hybrid'|'context' }`。
- 对应 memory「搜索多路召回 + 排序」链路的 wire shape；与 3.5.4 `SearchQuery` 的 `mode`（auto/keyword/semantic）是**请求 mode vs 响应 mode**两个不同枚举。

#### 3.6.3 ambient 声明（`*.d.ts`）

`lib/types/global.d.ts`（`:1-13`）是**索引说明**（ambient 声明约定：无 import/export，靠 JSDoc `@param {TypeName}` 全局可用），本身不含类型。它引用的模块：
- `bootstrap.d.ts`（`:1-25`）：`DimensionDigest`（dimId/label/status/candidateCount + 索引签名）、`DimensionContextSnapshot`、`CandidateSummary`。
- `common.d.ts`（`:1-33`）：`WikiResult`、`ProjectOverview`、`FieldDef`、`OverrideInfo`——全带 `[key: string]: unknown` 索引签名（宽松）。
- `guard.d.ts`（`:1-11`）：`ComplianceReport`（total/passed/failed/violations/timestamp + 索引签名）。
- （`global.d.ts` 还提到 `ast.d.ts`，不在本节测绘范围。）

**历史包袱**：这些 `.d.ts` 全是**宽松 ambient interface**（大量 `[key: string]: unknown`），是从早期 JSDoc 迁 TS 时留下的过渡类型，类型约束弱、不做真正门禁，仅供 `@param` 注解引用。新代码应优先用 3.6.1/3.6.2 的具名 wire 类型。

---

### 3.7 本节小结：设计模式与边界地图

**设计模式落点**：
- Adapter / Method-override：`AppConfigLoader`（覆写 Core `_findPackageRoot`）、`resolveSqliteDb`、`UnifiedCacheAdapter`。
- Facade / Repository 分层：`AuditLogger`（Facade）+ `AuditStore`（Drizzle Repository）。
- Singleton：`cacheService`、`cacheAdapterInstance`、`shutdown`、`PACKAGE_ROOT`。
- Registry：`TOOL_SCHEMAS` / `ROUTED_TOOL_SCHEMAS`。
- Strategy / Chain（逐级降级）：`resolveProjectScopeRuntime`（env→registry→folder→scan）、`GraphCache` 双写路径。
- State-machine：`shutdown.execute`（防重入+超时+LIFO+隔离）、`readSourceRefState/readSnapshotState`（status 判别）。
- Schema-first 契约 + superRefine 门禁：`http-requests.ts` / `mcp-tools.ts`。

**与 @alembic/core 的消费点汇总**：
- `@alembic/core/config`（`AppConfigLoader` 覆写其 `_findPackageRoot`）
- `@alembic/core/logging`（`Logger`：Audit/Cache/Graph 全用）
- `@alembic/core/database` + `/infrastructure/database/drizzle` + `/drizzle/schema`（`AuditStore` 全 Drizzle）
- `@alembic/core/io`（`GraphCache` 的 `WriteZone`）
- `@alembic/core/shared`（`computeContentHash`、ProjectScope 系列 loader/summary/descriptor、mcp-tools 的枚举/Schema 片段）
- `@alembic/core/workspace`（`DEFAULT_FOLDER_NAMES`、`WorkspaceResolver`）
- `@alembic/core/knowledge`（`describeSubmitToolFields` V3 字段单源）

**宿主连接点**：`agentHost = codex | claude-code`（双宿主枚举，`mcp-tools.ts:116`）；`ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY` env（宿主注入原生空间快照）；`projectRoot` 由 Codex/CC host runtime 供入所有 agent-facing 工具输入；host intent/turn-meta 是 Plugin-owned 的宿主 intake schema。

**守住的两条层级边界**：① `infrastructure` 把所有 raw `prepare()/getDb()` 收口进 `SqliteDatabaseAccess`（业务层禁止直连）；② `shared`（schema）不依赖 `runtime`，`mcp-tools.ts` 内联 `AgentHostSchema` 而不 import `runtime/contract`。

**最大历史包袱**：`SqliteDatabaseAccess` 是「未迁完的 raw sqlite 残留」的受控收口（注释自陈待迁 repository/Drizzle）；`UnifiedCacheAdapter` 的 Redis 模式是声明但从未实现的空位（恒 memory）；`lib/types/*.d.ts` 是弱约束 ambient 过渡类型。


---

## 4. MCP 服务器与工具表面层

本节测绘 `alembic-codex-plugin-runtime` 对外暴露的 MCP（Model Context Protocol）能力表面：两个 MCP server 骨架（`McpServer` / `HostMcpServer`）、工具声明表（`tools.ts`）、单源工具元数据目录（`PluginToolSurfaceCatalog.ts`）、clean-output-contract（envelope + 投影器注册表）、错误分类学（error-taxonomy）、统一错误处理（errorHandler）、限流器（RateLimiter）、zod→MCP JSON Schema 转换、跨宿主契约（plugin-host-contracts）以及三个 agent-facing 公共工具契约（public-tools）。

这一层是「宿主 Agent（Codex / Claude Code）↔ Alembic 能力」之间的网关：它把宿主发来的 `tools/call` 请求路由到 handler，把 handler 的任意返回值收敛成一个受 schema 约束的「clean output」结构，并把所有错误统一成 Core failure taxonomy。宿主看到的一切工具、schema、annotation、可见性裁剪、输出契约，都由本节的文件决定。

---

### 4.0 两个 MCP server 的分工全景

本仓库存在**两个并存的 stdio MCP server 骨架**，是理解本节最关键的前提：

| | `McpServer`（`lib/runtime/mcp/McpServer.ts`） | `HostMcpServer`（`lib/runtime/mcp/HostMcpServer.ts`） |
|---|---|---|
| 定位 | V3「resident / plugin-embedded-core」内核 shell | Codex/CC 冷启动宿主 shell（对外主入口） |
| SDK server name | `alembic-v3` @ `3.0.0`（`McpServer.ts:256`） | `alembic` @ `getPackageVersion()`（`HostMcpServer.ts:184`） |
| 工具可见性 | `TOOLS` 按 `ALEMBIC_MCP_TIER` 环境变量 tier 过滤（`McpServer.ts:275`） | `getVisibleTools(...)`（tool-visibility 子系统），随 knowledge/resident 状态动态裁剪（`HostMcpServer.ts:210`） |
| 项目根解析 | 依赖 `ALEMBIC_PROJECT_DIR` 环境变量，缺失即拒绝启动（`McpServer.ts:198`） | 经 `HostAdapter.resolveProjectRoot`，带 trust 分级与 fallback（`HostMcpServer.ts:173`） |
| 生命周期 | `initialize()` → Bootstrap → ServiceContainer.initialize → 注册 handler（`McpServer.ts:193`） | `start()` → 直接注册 handler；per-tool 惰性 init-on-demand（`HostMcpServer.ts:181`） |
| tool → handler | 内部 `HANDLER_MAP`（`McpServer.ts:397`），直接调 `handlers/*` | `handleToolCallInCurrentProject` → 本地工具 / `EmbeddedToolExecutor`（`HostMcpServer.ts:273`） |
| daemon | 已假定存在（旧 resident 路径） | 已删（PDR-3，全部 daemon-less，合成 `stopped` 状态）（`HostMcpServer.ts:389`） |

两者共享同一套 `TOOLS`（工具声明）、`TIER_ORDER`、`PluginToolSurfaceCatalog`（annotation/gateway/gate 单源）、`output-contract`（clean-output 收敛）、`error-taxonomy`、`errorHandler`。`HostMcpServer` 是宿主实际连接的**冷启动壳**，它对 embedded-core 工具的真正执行通过 `EmbeddedToolExecutor` 委托给一个 plugin-owned 的内核实例（属于「MCP host 内嵌执行器」子系统，见 crossLinks）；`McpServer` 则是 embedded-core 内核那一侧的路由骨架。本节聚焦这两个 server 的骨架与它们共用的契约层。

**设计模式落点**：facade（两个 server 类各自封装 MCP 生命周期）、registry（`PLUGIN_TOOL_SURFACE_CATALOG`、`outputProjectors` Map、`HANDLER_MAP`）、adapter（`HostAdapter` 抽象宿主差异）、strategy（`residentRoutePolicy` / `knowledgeGate` 决定路由与门禁）、pipeline（`wrapHandler` → handler → `serializeMcpToolResult` → clean output）、gateway（tool → `TOOL_GATEWAY_MAP` action/resource 映射）。

---

### 4.1 `McpServer`（resident / embedded-core 路由骨架）

文件：`lib/runtime/mcp/McpServer.ts`（约 485 行）。文件头注释自述「仅包含服务编排层（初始化、路由、Gateway gating、生命周期）」；工具定义在 `tools.ts`，handler 实现在 `handlers/*`，参数路由在 `handlers/tool-router.js`。

#### 4.1.1 构造与共享上下文

`McpServer` 构造函数（`McpServer.ts:162`）接收 `McpServerOptions`（`actorRole` / `container` / `bootstrap` / `source` / `surface`）。关键点：

- `logger` 故意延迟到 `initialize()` 之后再取（`McpServer.ts:164` 注释：避免在 Bootstrap 之前触发 Logger 单例初始化，因为 Logger 需要先拿到 ghost 路径配置）。
- `_session`（`McpServer.ts:174`）是一个进程内 `McpSession`：随机 id、`toolCallCount`、`toolsUsed: Set`、`lastActivityAt`。这是**唯一保留的会话状态**——注释明确说旧的 intent lifecycle 不再在 MCP server 层记录 tool call / drift / active decision（`_trackSession`，`McpServer.ts:386`，只自增计数）。
- `get _ctx`（`McpServer.ts:184`）返回传给所有 handler 的共享上下文：`{ container, logger, startedAt, session }`。这是 handler 的 DI 载体。

#### 4.1.2 `initialize()` 生命周期与门禁（`McpServer.ts:193`）

若未注入 `container`，则走完整 Bootstrap 冷启动：

1. **强制 `ALEMBIC_PROJECT_DIR`**（`McpServer.ts:198`）：MCP 模式下 `process.cwd()` 在多根工作区不可靠，缺失即向 stderr 写中文错误并 `throw`。这是一道硬门禁。
2. **排除项目检查**（`McpServer.ts:210`）：`import('@alembic/core/shared').isExcludedProject` + `import('@alembic/core/workspace').ProjectRegistry.isGhost`，再叠加 `resolveProjectScopeRuntime`（`../../shared/project-scope-runtime.js`）判断是否 `storageKind==='ghost'` 且属于当前 folder。三个条件（`exclusion.excluded && !isGhost && !isProjectScopeGhostExecution`）同时成立才拒绝——ghost 模式因为数据不写项目目录而豁免。
3. `process.chdir(projectRoot)`（若不同）+ `Bootstrap.configurePathGuard(projectRoot)`。
4. `new Bootstrap()` → `bootstrap.initialize()` 得到 `components`（db/auditLogger/config/skillHooks/workspaceResolver）。
5. 经 `import('#inject/ServiceContainer.js').getServiceContainer()` 拿到容器并 `initialize({...components, projectRoot})` 注入。

随后 `this.logger = Logger.getInstance()`（此时已带 ghost 路径），`new SdkMcpServer({ name:'alembic-v3', version:'3.0.0' }, { capabilities:{ tools:{} } })`，再 `_registerHandlers()`。

**与 Core 的消费点**：`@alembic/core/logging`（Logger 单例）、`@alembic/core/shared`（`isExcludedProject`）、`@alembic/core/workspace`（`ProjectRegistry`）、`#inject/ServiceContainer.js`（DI 容器）、`../../bootstrap.js`（本仓库 Bootstrap）。

#### 4.1.3 `_registerHandlers()`：ListTools + CallTool（`McpServer.ts:268`）

- **ListTools**（`McpServer.ts:275`）：读取 `ALEMBIC_MCP_TIER`（默认 `'agent'`），映射到 `TIER_ORDER` 的数值 `maxTier`，过滤 `TOOLS`（每个工具 `t.tier` 的数值 ≤ maxTier），再 `.map(withMcpToolAnnotations).map(withMcpOutputSchema)`。即：**annotation 注入 + outputSchema 注入都发生在 list 阶段**。tier 是可见性策略的落点（agent=0, admin=1）。
- **CallTool**（`McpServer.ts:285`）：记 `t0`，try 调 `_handleToolCall`，注入 `hostTurnMeta: readHostTurnMetaFromMcpRequest(request)`（来自 `#service/task/host-turn-meta.js`）。catch 到裸异常时用 `createCleanMcpErrorResponse({ code:'TOOL_ERROR', ... responseTimeMs })` 兜底——保证 server 层永不把异常透传给宿主。

#### 4.1.4 工具调用路由链（`_handleToolCall` → `_executeMcpHandler` → `_resolveHandler`）

`_handleToolCall`（`McpServer.ts:307`）的门禁与路由顺序：

1. **退役工具拦截**：`RETIRED_PUBLIC_TOOL_REPLACEMENTS`（`McpServer.ts:102`）是一张 `Record<retiredName, replacementHint>`，覆盖 `alembic_knowledge` / `alembic_project_matrix` / `alembic_structure` / `alembic_call_context` / `alembic_panorama`。命中即 `createRetiredPublicToolResult`（`McpServer.ts:114`）返回 `code:'CODEX_TOOL_RETIRED'` 的 clean error，带迁移建议文案。`alembic_task` 单独硬编码同类拦截（`McpServer.ts:315`）。
2. 解析 actorRole（`options.actor?.role || _defaultActorRole || _resolveMcpActorRole()`，后者恒返回 `'host-mcp'`，`McpServer.ts:443`）、source、surface。
3. 调 `_executeMcpHandler`，把 actor（role/user/sessionId）、source、surface、hostTurnMeta 装配进去。
4. 若结果已是 `CallToolResult`（`isMcpToolResponse`）直接返回；否则 `serializeMcpToolResult(name, result, { isErrorResult })` 收敛成 clean output（见 4.6）。

`_executeMcpHandler`（`McpServer.ts:345`）：把 runtime 字段 `Object.assign` 进 `_ctx`，`_resolveHandler(name)` 找 handler（找不到 `throw new Error('Unknown tool: ...')`），用 `wrapHandler(name, handler)` 包裹（注入 zod 校验 + 统一错误处理，见 4.4），`await wrapped(ctx, args)`，最后 `_trackSession`。

`_resolveHandler`（`McpServer.ts:396`）是**中央 registry：tool name → handler 函数**。这是本 server 对外工具清单的权威路由表。分层如下：

- **Agent 公共工具**（handler 来自 `handlers/agent-public-tools.js`）：
  - `alembic_prime` → `primeHandler`
  - `alembic_work` → **phase 路由**（`McpServer.ts:401`）：`args.phase==='finish'` 走 `workFinishHandler`，否则 `workStartHandler`。这是 MTC-7 把旧的 start/finish 两个工具合并成一个 phase-routed 工具的落点。
  - `alembic_code_guard` → `codeGuardHandler`
- **系统/查询工具**：
  - `alembic_status` → `systemHandlers.status`
  - `alembic_recipe_map` / `alembic_search` / `alembic_graph` / `alembic_plan` / `alembic_submit_knowledge` / `alembic_project_skill` → `toolRouter.route*Tool`（`handlers/tool-router.js`）
- **Host-agent 冷启动工作流工具**（v3.1）：
  - `alembic_bootstrap` → `bootstrapForHostAgent`（`handlers/host-agent/bootstrap.js`）
  - `alembic_rescan` → `rescanForHostAgent`（`handlers/host-agent/rescan.js`）
  - `alembic_evolve` → `evolveForHostAgent`（`handlers/host-agent/evolve.js`）
  - `alembic_dimension_complete` → `dimensionComplete`（`handlers/host-agent/dimension-completion.js`）
  - `alembic_consolidate` → `consolidateHandler`（`handlers/consolidate.js`）
- **Admin 层**：
  - `alembic_knowledge_lifecycle` → `knowledgeHandlers.knowledgeLifecycle`

注释里留有历史包袱标记：`alembic_knowledge`/`structure`/`call_context` 的路由已删（MTC-1）。

#### 4.1.5 `start()` / `shutdown()`（`McpServer.ts:449`）

`start()`：`initialize()` → `new StdioServerTransport()` → `sdkServer.connect(transport)` → 计算 tier 可见工具数 → info 日志 + stderr 打印 `Alembic MCP ready — N tools [tier=...]`。`shutdown()`（`McpServer.ts:468`）：`sdkServer.close()` + `bootstrap.shutdown()`。`startMcpServer()`（`McpServer.ts:478`）是便捷工厂。

---

### 4.2 `HostMcpServer`（Codex/CC 冷启动宿主主入口）

文件：`lib/runtime/mcp/HostMcpServer.ts`（约 1155 行，含末尾一批 arg 归一化 helper）。这是宿主实际连接的 server，承载了 daemon-less 化（PDR-3）、init-on-demand、project-root scope、staging-access-sweep、opportunistic-evolution 表面等大量宿主侧逻辑。

#### 4.2.1 构造与 HostAdapter（`HostMcpServer.ts:151`）

- `#hostAdapter: HostAdapter = resolveHostAdapter()`（`HostMcpServer.ts:170`）：DH-2/RC-2 引入的 L3 host adapter（codex 单实现）。`HostMcpServer` 经它消费宿主特定的**项目根解析 / 运行时上下文 / init-marker 写入**，不再直依赖 Codex* 具体函数。这是 adapter 模式的核心落点（属于 host-adapter 子系统，见 crossLinks）。
- 构造时 `#hostAdapter.resolveProjectRoot({ projectRoot })` → `projectRootResolution`，`projectRoot = resolution.path || safeProjectRootFallback()`（`HostMcpServer.ts:176`，fallback 来自 `host/project-root.js`）。
- `#initRuntimeState`（`HostMcpServer.ts:160`）：init-on-demand 的运行时状态机（attempted/lastError/ok/requestedTool/route）。
- `#embeddedToolExecutor` / `#residentCapabilityClients` / `#initPromise` 三个惰性私有字段。

#### 4.2.2 `start()` / `registerHandlers()`（`HostMcpServer.ts:181`）

`start()`：`getVisibleTools(undefined, projectRoot)` → `new SdkMcpServer({ name:'alembic', version:getPackageVersion() }, { capabilities:{tools:{}}, instructions: buildMcpInitializeInstructions(visibleTools) })`。**注意与 `McpServer` 的差异**：这里把 `instructions`（宿主看到的 MCP 初始化指引，`host/guidance.js`）直接塞进 SDK server 能力声明，且 server name 是 `alembic` 而非 `alembic-v3`。

`registerHandlers()`（`HostMcpServer.ts:204`）：

- **ListTools**（`HostMcpServer.ts:210`）：`getVisibleTools(undefined, projectRoot, { residentProjectScopeAvailable: await isResidentProjectScopeAvailable() })`。可见性**动态依赖 resident project-scope 是否就绪**（比 `McpServer` 的静态 tier 过滤复杂）。
- **CallTool**（`HostMcpServer.ts:216`）：`handleToolCall` → `serializeMcpToolResult(name, result, { isErrorResult })`（`isErrorResult` 来自 `host/results.js`）。catch 兜底 `code:'CODEX_MCP_ERROR'`。

#### 4.2.3 `handleToolCall`：退役拦截 + project-root scope 分流（`HostMcpServer.ts:239`）

1. `alembic_task` 退役硬拦截（返回 clean error，`status:'retired'`）。
2. `resolveProjectRootScope(name, args)`（`host/project-root-scope.js`）判定项目根 scope：
   - `kind==='failure'` → 直接返回 `scope.result`（如非法 projectRoot 参数）。
   - `kind==='scoped-project'`（`HostMcpServer.ts:257`）：**为该调用创建一个 scoped 的 `new HostMcpServer({ projectRoot: override })`**，`persistTrustedProjectRootScope(...)` 落 trust，然后委托 `scopedServer.handleToolCallInCurrentProject(...)`。这是「同一 stdio 连接内切换项目根」的机制。
   - 否则走当前项目 `handleToolCallInCurrentProject`。

这是一处**per-call 动态 server 分裂**的设计，用来在多根工作区里让单条 MCP 连接服务不同 projectRoot；坑点在于 scoped server 各自持有独立的 `#embeddedToolExecutor` / resident client（每次 scoped 调用新建实例，不复用当前 server 的缓存）。

#### 4.2.4 `handleToolCallInCurrentProject`：两段 preflight + 本地/内嵌分流（`HostMcpServer.ts:273`）

核心执行状态机，顺序（每一步都可短路返回失败）：

1. `resolveToolExecutionContext(name)`（`HostMcpServer.ts:996`）：若工具在 `RESIDENT_PROJECT_SCOPE_TOOL_NAMES`（来自 `runtime/index.js`）中，解析 resident project-scope identity，返回 `{ projectRoot, projectScopeIdentity, residentProjectScopeAvailable }`。
2. `inspectKnowledge(projectRoot)`（Core 侧 knowledge 探测，经 `runtime/index.js`）。
3. **before-auto-init preflight**（`preflightTool({ coreTools:TOOLS, knowledge, projectRootResolution, residentProjectScopeAvailable, stage:'before-auto-init', tierOrder:TIER_ORDER, toolName })`，`HostMcpServer.ts:282`）：不 ok 即返回 `failure`；`autoInit===true` 时触发 `ensureWorkspaceInitializedForTool(name)`（init-on-demand，见 4.2.5），再重新 `inspectKnowledge`。preflightTool 属于 preflight 子系统（见 crossLinks）。
4. **execute preflight**（`stage:'execute'`，`HostMcpServer.ts:303`）：再次门禁；不 ok 即返回。
5. staging-access-sweep 判定（`shouldRunStagingAccessSweep`，`HostMcpServer.ts:982`）：需 `knowledge.initialized` 且工具在 `STAGING_ACCESS_SWEEP_TOOL_NAMES`（`host/staging-access-sweep.js`），且排除 `alembic_status aspect==='runtime'`；成立则并发跑一次 staging sweep。
6. `dispatchLocalTool(name, args, {...})`（`host/local-tool-dispatcher.js`，`HostMcpServer.ts:320`）：把一批**本地工具**（`alembic_status` 各 aspect、`alembic_init`、`alembic_runtime` cleanup、`alembic_job` enqueue/read）分派到 `HostMcpServer` 自己的方法（`buildStatus`/`buildDiagnostics`/`buildColdStartKnowledgeStatus`/`initializeWorkspace`/`cleanupRuntime`/`enqueueJob`/`readJob`）。若 `handled` 即返回。
7. 否则 `callPluginOwnedTool(name, args, serviceBoundary, executionContext, options)`（`HostMcpServer.ts:899`）：经 `EmbeddedToolExecutor.execute(...)` 委托给 plugin-owned 内核实例（即 embedded-core 真正干活的地方），再用 `attachPluginOpportunisticEvolutionSurface(...)`（`host/opportunistic-evolution-presenter.js`）附加 commit-driven 维护表面。`serviceBoundary` 来自 `resolveServiceRequestBoundary(name, args)`（`runtime/index.js`）。

设计模式：strategy（`residentRoutePolicy` / `knowledgeGate` 决定路由与门禁）、pipeline（两段 preflight → local dispatch → embedded execute → evolution surface）、facade（`EmbeddedToolExecutor` 封装内嵌内核）。

#### 4.2.5 init-on-demand 状态机（`HostMcpServer.ts:450`–695）

- `initializeWorkspace(args)`（显式 `alembic_init`）与 `ensureWorkspaceInitializedForTool(toolName)`（tool-call 触发）两条入口，都汇入 `runWorkspaceInitialization(input)`（`HostMcpServer.ts:524`）。
- **trust 门禁**（`HostMcpServer.ts:527`）：`isTrustedProjectRoot(projectRootResolution)` 为假时，按 `trust==='rejected'` 返回 `CODEX_PROJECT_ROOT_REJECTED` 否则 `CODEX_PROJECT_ROOT_UNRESOLVED`，`needsUserInput:true`，带 `requiredActions`。这是 D12-P03 legacy-rewrite candidate（见 4.8）保护的诊断路径。
- **并发去重**：`#initPromise` 保证同一 server 同一时刻只跑一次初始化（`HostMcpServer.ts:552`）。
- `performWorkspaceInitialization`（`HostMcpServer.ts:564`）：
  - `resolveWorkspaceModeConflict`（`HostMcpServer.ts:129`）：请求 ghost/standard 与已注册模式冲突时返回 `CODEX_WORKSPACE_MODE_CONFLICT`（ordinary init 不自动切模式）。
  - 已初始化且非 force/seed/standard → 直接返回 `alreadyInitialized`。
  - 否则 `new SetupService({ projectRoot, force, seed, ghost, profile:CODEX_SETUP_PROFILE, quiet:true }).run()`（`cli/SetupService.js`）；全部步骤 ok 后 `#hostAdapter.writeInitMarker(...)` 写 init marker，更新 `#initRuntimeState.ok=true`。失败路径统一 `CODEX_AUTO_INIT_FAILED`。

#### 4.2.6 daemon-less 化（PDR-3）残留与合成状态

多处方法保留了旧 daemon 消费者的类型契约，但用**合成的 daemon-less 值**驱动：

- `buildStoppedDaemonStatus()`（`HostMcpServer.ts:389`）：返回 `status:'stopped', ready:false, ... message:'daemon removed (PDR-3)'`，路径字段来自 `resolveDaemonPaths(projectRoot)`（`@alembic/core/daemon`）。`buildDiagnostics` 用它喂 `buildHostEnhancementRouteChoice` / `buildHostProjectAlignment` / `buildProjectRuntimeContext`（都来自 `runtime/index.js`）。
- `cleanupRuntime(args)`（`HostMcpServer.ts:697`）：不再停 daemon，只做本地文件清理（`daemon.json`/`.pid`/`.log`/`.lock`/`jobs`）。`confirm!==true` 时返回 `dryRun:true` 预览，`confirm===true` 才 `rmSync`。这是 destructive 工具的确认门禁落点。
- `enqueueJob(kind, args)`（`HostMcpServer.ts:754`）：PDR-2a/PDR-3 下 bootstrap/rescan **同步 in-process 跑**并落 `JobStore`（`@alembic/core/daemon`）——`store.create` → `markRunning` → 动态 import `bootstrapForHostAgent`/`rescanForHostAgent` 执行 → `store.complete(job.id, unwrapped.data)`。工具交互不变：`alembic_job` 仍返回 job 记录（现在已 completed），`readJob` 仍从 JobStore 读。args 经 `normalizeBootstrapJobArgs`/`normalizeRescanJobArgs`（`HostMcpServer.ts:1061`+）归一化成 `BootstrapInput`/`RescanInput`（`#shared/schemas/mcp-tools`）。
- `readJob(args)`（`HostMcpServer.ts:812`）：`daemon` 恒 `null`，`tryReadJobFromDaemon` 恒返回 `null`（`HostMcpServer.ts:889`），永远走本地 `JobStore` fallback，并附 `jobRoute`（`fallback:true, reason:'resident-job-api-unavailable-or-not-ready', selected:'embedded-host-agent-recoverable'`）+ `getRuntimeFallbackIsolation('local-jobstore')`。

**降级/兼容日志纪律**：这些路径都带明确的 PDR-3 注释解释「为什么合成 null / stopped」，符合仓库规则要求的 fallback 可解释性。

**与 Core 的消费点（HostMcpServer 专属）**：`@alembic/core/daemon`（`JobStore`, `resolveDaemonPaths`）、`@alembic/core/logging`、`@alembic/core/workspace`（`ProjectRegistry`）、`#service/task/host-turn-meta.js`、`#inject/ServiceContainer.js`（动态）、以及一大批经 `runtime/index.js` 桶导出的宿主构建器（`buildStatus`/`buildRuntimeDiagnostics`/`buildProjectRuntimeContext`/`buildHostEnhancementRouteChoice`/`buildHostProjectAlignment`/`inspectKnowledge`/`preflightTool`/`resolveHostAdapter`/`isTrustedProjectRoot`/`resolveServiceRequestBoundary` 等）。

---

### 4.3 工具声明表 `tools.ts` 与完整对外工具清单

文件：`lib/runtime/mcp/tools.ts`（约 374 行）。文件头自述「V3 Routed Surface（19 agent + 1 admin = 20 tools）」。

#### 4.3.1 结构与副作用导入

- `TIER_ORDER = { agent: 0, admin: 1 }`（`tools.ts:146`）：tier 到数值序，供两个 server 的可见性过滤。
- `withMcpToolAnnotations = withPluginToolAnnotations`（`tools.ts:148`，re-export 自 catalog）；`export { TOOL_GATEWAY_MAP }`。
- **副作用导入注册投影器**：`tools.ts:43`–54 顶部 `import '.../core-tools/output.js'`、`local-tools/output.js`、`knowledge-context-tools/{graph-output,output,recipe-map-output,search-output}.js`、`public-tools/output.js`。这些模块在 import 时执行 `registerMcpOutputProjector`（见 4.6.2）。`tools.ts:44` 注释解释：`alembic_status` 是**跨 server 工具**（resident + cold-start 两个 shell 都 import `tools.ts`），其单一 output projector 落在 `local-tools/output.js`，必须随 `TOOLS` 一起加载，否则 resident 侧 `alembic_status` 无 projector。
- **Vitest 防御性 fallback**：`_RescanSchema`/`_EvolveSchema`/`_ConsolidateSchema`（`tools.ts:58`+）在某些 Vitest 模块 transform 下 `RescanInput`/`EvolveInput`/`ConsolidateInput` 可能为 `undefined`，用 `?? z.object({...})` 内联重建 schema 兜底。这是明确的历史包袱/测试兼容层。
- 三个 agent 公共工具的 description 用 `getAgentPublicToolDescriptionBase('alembic_prime'|'work'|'code_guard')`（`public-tools/descriptions.js`）拼装 title/purpose/selectionHint/nonGoal（`tools.ts:151`）。
- 每个工具的 `inputSchema` 都由 `zodToMcpSchema(<ZodSchema>)` 生成（见 4.5），schema 源自 `#shared/schemas/mcp-tools.js`。

#### 4.3.2 完整对外工具清单（`TOOLS` 数组，`tools.ts:157`）

**Tier: agent（19 个）**，每个含 name / tier / description / inputSchema：

| 工具 | 输入 schema | annotation（来自 catalog） | 用途摘要 |
|---|---|---|---|
| `alembic_prime` | `PrimeInput` | readOnly | 加载 code-development Recipe 上下文，返回 primeRef+detailRefs；跳过非代码/低信息/退役 intent 输入 |
| `alembic_recipe_map` | `RecipeMapInput` | readOnly | 把 Recipe 映射到有界 ProjectContext region（region/recipeMounts/recipeRollups/diagnostics），有界输出无完整 Recipe body |
| `alembic_work` | `WorkInput` | localWrite | phase=start 建 workRef / phase=finish 关闭并带 changedFiles+evidence（MTC-7 合并） |
| `alembic_code_guard` | `CodeGuardInput` | localWrite | 对显式 files/inline code/scoped workRef 跑 code guard |
| `alembic_status` | `StatusInput` | readOnly | runtime/knowledge/full 三视图状态；knowledge 空则提示冷启动 |
| `alembic_search` | `SearchInput` | readOnly | search/get/expand 紧凑 Recipe/knowledge；summary-only 可见文本 + detailRefs |
| `alembic_graph` | `GraphInput` | readOnly | 纯 ProjectContext 图查询（space/repo/map/module/file-flow/anchor-range/path/impact/…），返回 Recipe-free `AlembicGraphOutput` |
| `alembic_plan` | `PlanInput` | aiBackedWrite | 生成前无状态 planSelection（draft 收集 projectInfoTree+候选维度；confirm 校验单阶段选择；不持久化） |
| `alembic_submit_knowledge` | `SubmitKnowledgeInput` | aiBackedWrite | 单/批知识提交统一管线，V3 字段一次给全，overlap→自动进化提案；批内禁交叉冗余 |
| `alembic_project_skill` | `ProjectSkillInput` | localWrite | Codex Project Skill 交付（list/load/upsert/create/update/refresh/export/delete） |
| `alembic_bootstrap` | `BootstrapInput` | aiBackedWrite | plan-selection 驱动冷启动，返回 Mission Briefing；对已有知识库 DESTRUCTIVE（非 testMode 需 rebuild:true） |
| `alembic_rescan` | `_RescanSchema` | aiBackedWrite | plan-selection 驱动增量 rescan/moduleMining；deepMining 清派生缓存，moduleMining 保候选 |
| `alembic_evolve` | `_EvolveSchema` | destructive | 批量 Recipe 进化决策（propose_evolution/confirm_deprecation/skip） |
| `alembic_consolidate` | `_ConsolidateSchema` | localWrite | 语义合并复审（keep/merge/reject），submit 后有 pendingSemanticReview 时调 |
| `alembic_dimension_complete` | `DimensionCompleteInput` | localWrite | 维度分析完成通知：Recipe 绑定/Skill 生成/checkpoint/跨维 hints |

（表内 15 行覆盖 15 个显式声明；文件头「19 agent」的口径是把已合并/跨 server 计数在内的历史标称，实际 `TOOLS` 数组里 agent 声明为 15 个 + admin 1 个 = 16 个声明工具。`HostMcpServer` 侧另有 `alembic_init`/`alembic_job`/`alembic_runtime` 三个 codex-local 工具在 catalog 里、但不在 `tools.ts` 的 `TOOLS` 数组中——它们由 `getVisibleTools`/tool-visibility 注入，见 4.7 与 crossLinks。）

**Tier: admin（1 个）**：

| 工具 | 输入 schema | annotation | 用途 |
|---|---|---|---|
| `alembic_knowledge_lifecycle` | `KnowledgeLifecycleInput` | localWrite | 仅允许 `reactivate`（deprecated Recipe → pending review）；publish/deprecate/approve/fast_track 不对默认 agent 开放 |

**description 的工程意义**：注释明确 description 是「Agent 工具选择的关键」，用 bullet list 枚举所有 operation 及其目的；`.describe()` 会被 `zodToMcpSchema` 转成 JSON Schema 的字段 description。因此 description 文案本身是**载重契约**（宿主 Agent 靠它决定调哪个工具）。

---

### 4.4 统一错误处理 `errorHandler.ts` + `wrapHandler` 管线

文件：`lib/runtime/mcp/errorHandler.ts`（约 158 行）。`wrapHandler(toolName, handlerFn, schema?)`（`errorHandler.ts:98`）是**保证「不会 throw」的 handler 包装器**，被 `McpServer._executeMcpHandler` 用于每次调用。管线：

1. 选 schema：`schema || TOOL_SCHEMAS[toolName]`（`TOOL_SCHEMAS` 来自 `#shared/schemas/mcp-tools.js`）。这是「输入 zod 校验」的落点——与 `tools.ts` 声明的 `inputSchema`（给宿主看的 JSON Schema）是两套：一套对外声明（JSON Schema），一套对内执行时校验（zod parse，应用 defaults + coercion）。
2. `zodSchema.parse(rawArgs ?? {})`（`errorHandler.ts:110`）：校验失败在 handler 之前就被拦截。
3. catch 分类（`errorHandler.ts:113`）：
   - `z.ZodError` → 结构化 `VALIDATION_ERROR`，把 `issues` 拼成 `path: message; ...` 中文前缀 `输入校验失败:`。
   - 其他 → `inferErrorCode(err)`（`errorHandler.ts:45`）：`ValidationError`→`VALIDATION_ERROR`、`NotFoundError`→`NOT_FOUND`、`ConflictError`→`CONFLICT`、`PermissionDenied`→`PERMISSION_DENIED`（四类 Core 错误来自 `@alembic/core/shared`），否则读 `err.errorCode`/`err.code`，最后兜底 `INTERNAL_ERROR`。`extractErrorDetails`（`errorHandler.ts:68`）读 `err.details` 或 `err.toJSON()`。
4. 无论哪条，都用 `createMcpStructuredToolResult(createCleanMcpErrorResponse({...}))` 返回**clean 结构化错误 + responseTimeMs + toolName**。

设计模式：decorator/pipeline（包装 handler，前置校验 + 后置错误收敛）。与 Core 的消费点：`@alembic/core/shared`（四类 error 类型）、`@alembic/core/logging`。

---

### 4.5 `zodToMcpSchema.ts`：Zod v4 → MCP JSON Schema

文件：`lib/runtime/mcp/zodToMcpSchema.ts`（约 102 行）。`zodToMcpSchema(schema)`（`zodToMcpSchema.ts:92`）用 `z.toJSONSchema(schema)` 生成原始 JSON Schema，再 `cleanJsonSchema` 递归清洗（`zodToMcpSchema.ts:26`）：

1. 删顶层 `$schema`（MCP 不需要 meta-schema）。
2. 删 `additionalProperties: false`（允许前向兼容的额外字段——与「MCP 返回结构必须向后兼容」的仓库规则一致）。
3. 清理 integer 的冗余边界：Zod v4 会自动加 `±9007199254740991`（`MAX_SAFE_INTEGER`），命中即删。
4. **default 字段从 required 移除**（`zodToMcpSchema.ts:49`）：带 `default` 的属性从 `required` 数组剔除（Agent 可省略，zod parse 时自动填充）。
5. 递归处理 `properties` / `items` / `anyOf`/`oneOf`/`allOf`（覆盖 union/discriminatedUnion/intersection）。

最后保证输出含 `type:'object'` / `properties` / `required` 三字段。这是「一次定义 zod、双向导出（对外 JSON Schema + 对内校验）」的转换器。

---

### 4.6 clean-output-contract：envelope 与投影器体系

这是本节最核心的横切契约。所有 MCP 工具返回给宿主的都是一个受 `CleanMcpResponseSchema` 约束的结构，而非 handler 的裸返回值。

#### 4.6.1 结构定义（`output-contract.ts`）

文件：`lib/runtime/mcp/output-contract.ts`（约 324 行）。契约版本 `CLEAN_MCP_OUTPUT_CONTRACT_VERSION = 1`（`output-contract.ts:11`）。

- `CleanMcpResponseBaseSchema`（`output-contract.ts:60`，`.strict()`）：`{ ok:boolean, status:CleanMcpStatus, summary:string(min1), error?:CleanMcpError, meta?:CleanMcpMeta }`。`status` 是 `^[a-z][a-z0-9-]*$` 的短标识。`CleanMcpResponseSchema`（`output-contract.ts:70`）= base `.passthrough()`（允许各工具附加自己的 business 字段）。
- `CleanMcpMetaSchema`（`output-contract.ts:43`，`.strict()`）：`contractVersion`（literal 1）+ 可选 `coverageLedgerSeed`/`fullBriefingRef`/`fullMapRef`/`generatedAt`/`outputSchema`/`producer`/`projector`/`responseTimeMs`/`source`/`toolName`/`traceRef`。`fullBriefingRef`/`fullMapRef` 是 `{ bytes, path }` 的 transient transport ref（把超预算的完整 briefing/map 落盘、只在 meta 引用）。`coverageLedgerSeed` 携带覆盖账本种子。
- `CleanMcpErrorSchema`（`output-contract.ts:19`）= failure taxonomy（见 4.9）+ `{ code, message, details? }`，`.strict()`。

#### 4.6.2 投影器 registry（strategy + registry 模式）

- `outputProjectors = new Map<toolName, McpOutputProjector>()`（`output-contract.ts:83`）。`registerMcpOutputProjector(projector)`（`output-contract.ts:85`）：同名重复注册 `throw`（防漂移），返回反注册闭包。`McpOutputProjector` 契约（`output-contract.ts:75`）= `{ outputSchema, outputSchemaName, project(input,{toolName}), projectorName, toolName }`。
- `projectMcpToolOutput(toolName, value)`（`output-contract.ts:101`）：查投影器 → `project(value)` → `outputSchema.parse(response)` → 合并 meta（注入 contractVersion/outputSchema/projector/toolName）。找不到投影器返回 `null`。

三组工具家族各自在模块 import 时注册投影器：core-tools（4.6.5）、local-tools（4.6.6）、public-tools（4.6.4）、以及 knowledge-context-tools（相邻子系统）。

#### 4.6.3 收敛入口 `serializeMcpToolResult`（`output-contract.ts:209`）

这是两个 server 把 handler 返回值收敛成 `CallToolResult` 的唯一出口，回退链（strategy fallback chain）：

1. `isMcpCallToolResult(value)`（`output-contract.ts:124`，判 `content` 数组）→ 已是 MCP 结果，直接透传。
2. `projectMcpToolOutput(toolName, value)` 命中 → `createMcpStructuredToolResult`。
3. `isCleanMcpResponse(value)`（safeParse 成功）→ 直接包。
4. `options.isErrorResult(value)` → `projectLegacyErrorAsCleanResponse`（`output-contract.ts:253`）：从 legacy `{ success/errorCode/message/error/data }` 形状里挖 code/message/details，转成 clean error（兜底 code `TOOL_FAILED`）。
5. 都不命中 → **`CLEAN_OUTPUT_PROJECTOR_MISSING`**（`output-contract.ts:229`，status `blocked`）：这是硬门禁——任何没有注册投影器、又不是 clean/error 形状的返回值都会被显式拒绝，防止裸 legacy payload 泄漏给宿主。（对应 error-taxonomy 里 `CLEAN_OUTPUT_PROJECTOR_MISSING → capability-mismatch`。）

`createMcpStructuredToolResult(response)`（`output-contract.ts:200`）：`CleanMcpResponseSchema.parse` 后组装 `{ structuredContent, content:[{type:'text', text:summary}], isError: ok?undefined:true }`。即：可见文本只放 `summary`，完整结构在 `structuredContent`。

`createCleanMcpErrorResponse`（`output-contract.ts:167`）：注意 `output-contract.ts:181` 注释（MT/CC3 F1）——core-tools 输出 schema 要求**顶层 `toolName`**（每工具 `z.literal`），只放 `meta.toolName` 会让 schema-validating 的 MCP 客户端以 `-32602` 拒绝错误 envelope。所以顶层 `toolName` 是错误 envelope 的载重字段。

`withMcpOutputSchema(tool)`（`output-contract.ts:240`）：list 阶段给有投影器的工具注入 `outputSchema: zodToMcpSchema(projector.outputSchema)`——宿主因此能拿到每个工具的输出 JSON Schema。

#### 4.6.4 public-tools 输出（agent-facing 三工具）

文件：`lib/runtime/mcp/public-tools/output.ts`（约 672 行）。为 `alembic_prime`/`alembic_work`/`alembic_code_guard` 定义各自的 output schema 并注册投影器（模块尾 `output.ts:663` 循环 `registerMcpOutputProjector`）。要点：

- `AgentPublicToolOutputBaseSchema`（`output.ts:347`）= clean base + `actionKind/agentHost/inputSource/reason?/refs/status/toolName`，`superRefine` 双校验：actionKind 必须匹配 `AGENT_PUBLIC_TOOL_ACTION_BY_NAME[toolName]`；`status` 与 `reason.kind` 必须对应（skipped↔skip / degraded↔degraded / blocked↔blocked / failed↔failure）。
- `AgentPrimeOutputSchema`（`output.ts:403`）：literal `actionKind:'prime'` / `toolName:'alembic_prime'`，含 `primePackage:PrimePublicPackageSchema` + `detailRefs`/`diagnostics`/`nextActions`。
- `AgentWorkOutputSchema`（`output.ts:433`）：MTC-7 合并的 union 字段（start 出 workRef/localRecord；finish 加 changedFiles/finishRef/guardRecommendation/outcome）。
- `AgentCodeGuardOutputSchema`（`output.ts:446`）：含 `data.unifiedEvolution?`（R-2 允许 commit-driven 维护 surface 进 data，使 `evidenceGate.verdict` 可读，同时仍 `.strict()` 拒未知字段——`PluginOpportunisticEvolutionSurfaceSchema`，`output.ts:156`，是一个巨型 strict schema）、`explicitScope`/`guard`/`guardResultRef`/`unsupportedScopeFields`。
- `createAgentPublicToolOutput(result, payload, {ok})`（`output.ts:464`）：把 `AgentPublicToolResultEnvelope` + payload 合成 clean response；prime 额外 `scrubPrimeOutputRelationSurface`（`output.ts:501`）**递归剔除** `recipeRelation`/`recipeRelationCount`/`relationChainCount`/`relationHopLimit` 字段并把字符串里的 `recipeRelation` 替换成 `knowledge`（GMAP-8：prime 不再暴露 relation-chain 表面）。
- `createAgentPublicToolCleanError`（`output.ts:529`）+ `mapAgentPublicReasonFailureKind`（`output.ts:574`）：把 agent reason code 映射到 Core failure kind（如 `project-root-untrusted→permission-denied`、`schema-validation-failed→schema-drift`），兜底 `invalid-input`。
- `projectGuardPublicResult`（`output.ts:589`）：把内部 guard 结果收敛成有界 `GuardPublicResultSchema`（只保留 `resultSummary` 计数，不透原始 violations 明细）。

#### 4.6.5 core-tools 输出（embedded-core 家族）

文件：`lib/runtime/mcp/core-tools/output.ts`（约 731 行）。`CORE_CLEAN_OUTPUT_TOOL_NAMES`（`output.ts:11`）覆盖 `alembic_plan`/`submit_knowledge`/`project_skill`/`bootstrap`/`rescan`/`evolve`/`consolidate`/`dimension_complete`/`knowledge_lifecycle` + 三个退役名（`alembic_knowledge`/`structure`/`call_context` 仍在名单里以便投影 legacy）。核心机制：

- **白名单式字段裁剪**：`CORE_TOOL_ALLOWED_BUSINESS_FIELD_NAMES`（`output.ts:110`）为每个工具列出允许的 business 字段；`pickAllowedBusinessFields`（`output.ts:527`）只保留白名单字段。这是 clean-output 的**正向门禁**。
- **禁字段黑名单**：`CORE_FORBIDDEN_BUSINESS_OUTPUT_KEYS`（`output.ts:30`，如 `diagnostics`/`projectRuntime`/`residentService`/`serviceBoundary`/`telemetry`/`truncated`/`outputBudget` 等运行时杂质）、`CORE_FORBIDDEN_TOP_LEVEL_OUTPUT_KEYS`（`output.ts:54`，`data`/`errorCode`/`message`/`result`/`success` 这些 legacy envelope 顶层键）、`CORE_SENSITIVE_BUSINESS_OUTPUT_KEYS`（`output.ts:62`，apikey/token/password 等敏感键）。`findForbiddenCoreOutputField`（`output.ts:407`）递归扫描，命中即在 schema `superRefine` 里报错（`createCoreToolOutputSchema`，`output.ts:445`）。这是 clean-output 的**反向门禁**。
- `projectCoreToolOutput`（`output.ts:359`）：先 safeParse（已 clean 直接返回），否则从 legacy `{ data/success/errorCode/message/error/meta }` 里抽 business（`extractLegacyBusinessValue`）→ sanitize（删禁字段/敏感字段）→ `renameReservedTopLevelFields`（`data→businessData` 等，`output.ts:79`）→ pick 白名单 → `deriveCoreToolStatus`（`output.ts:640`：`!ok→blocked`，`degraded===true→degraded`，`businessStatus` 归一，有 errorCode→blocked，否则 ready）→ `buildCoreToolSummary`（`output.ts:663`，每工具有默认摘要文案）→ `createCleanMcpResponse`。
- meta 只保留 `ALLOWED_CLEAN_META_KEYS`（`coverageLedgerSeed`/`fullBriefingRef`/`fullMapRef`/`responseTimeMs`/`source`），且 `coverageLedgerSeed` 仅 `alembic_rescan` 保留并经 `sanitizeCoverageLedgerSeed` 二次裁剪（`output.ts:563`）。

#### 4.6.6 local-tools 输出（codex-local 家族）

文件：`lib/runtime/mcp/local-tools/output.ts`（约 553 行）。`LOCAL_CLEAN_OUTPUT_TOOL_NAMES`（`output.ts:9`）= `alembic_status`/`alembic_init`/`alembic_job`/`alembic_runtime`。机制同 core-tools（白名单 `LOCAL_TOOL_ALLOWED_BUSINESS_FIELD_NAMES`，`output.ts:90`；禁顶层键；敏感键剔除），差异点：

- **runtime-diagnostic 工具豁免**：`LOCAL_RUNTIME_DIAGNOSTIC_TOOL_NAMES`（`output.ts:29` = status/job/runtime）合法携带 `diagnostics`/`projectRuntime`/`enhancementRoute`/`hostProjectAlignment`/`residentService`/`serviceBoundary` 等运行时字段；`shouldStripRuntimeField`/`shouldForbidRuntimeField`（`output.ts:428`/437）只对**非** runtime-diagnostic 工具（即 `alembic_init`）禁这些键。MTC-4 注释解释：旧 `alembic_mcp_status` 曾禁 diagnostics/runtime 键以保持「轻」，合并后的 `alembic_status` 是 runtime-diagnostic 工具，故移除该 per-tool 特例。
- **业务值归一** `normalizeBusinessValue`（`output.ts:362`）：`alembic_init` 的 `status`→`statusSnapshot`（避免与 clean `status` 冲突）；`alembic_runtime` 把 `daemon.{ready,status,pidAlive}` 摊平成 `daemonReady`/`daemonStatus`/`pidAlive`/`stopped`；`alembic_job` 的 `errorCode`→`reasonCode`。
- `deriveLocalToolStatus`（`output.ts:499`）：`!ok→blocked`；`alembic_runtime` 且 `dryRun===true→preview`；有 reasonCode→blocked；`businessOk===false→degraded`；否则 ready。
- summary builder 表 `LOCAL_TOOL_SUMMARY_BUILDERS`（`output.ts:186`）：每工具定制摘要（runtime 按 dryRun/cleaned/targets 区分 stop vs cleanup）。

`alembic_status` 在 core-tools 与 local-tools 之间的归属：注释（`output.ts:9`，core-tools）说 `alembic_health` 已并入 `alembic_status`，其单一投影器 home 在 **local-tools**（cross-server runtime-diagnostic）。因此 `alembic_status` 的 projector 只注册一次，落 local-tools。

---

### 4.7 `PluginToolSurfaceCatalog.ts`：工具元数据单源

文件：`lib/runtime/mcp/PluginToolSurfaceCatalog.ts`（约 380 行）。这是 annotation / gateway / handler owner / knowledge gate / resident route policy 的**单一权威源**，防止这些元数据在 `tools.ts`、ToolPolicy、Codex router 之间漂移（`PluginToolSurfaceCatalog.ts:108` 注释）。

`PLUGIN_TOOL_SURFACE_CATALOG`（`PluginToolSurfaceCatalog.ts:111`）是一张 `Record<toolName, PluginToolSurfaceEntry>`，每条含：

- `owner`：`'codex-local'`（status/init/job/runtime）或 `'plugin-embedded-core'`（其余）。**这是决定工具在哪个 server 实体上执行的关键**——codex-local 由 `HostMcpServer` 本地方法处理，embedded-core 经 EmbeddedToolExecutor 委托内核。
- `handlerOwner`：`PluginToolHandlerOwner` 枚举（如 `HostMcpServer.local` / `HostMcpServer.resident-jobs` / `McpServer.tool-router` / `McpServer.agent-public-tools` / `McpServer.host-agent-bootstrap` …），精确指向 handler 归属。
- `tier`：`agent`/`admin`（`catalogEntry` 由 tier 自动派生 `admin` 布尔，`PluginToolSurfaceCatalog.ts:101`）。
- `schema`：schema 名字符串。
- `annotations`：`ToolAnnotations`，由四个工厂产生：`readOnlyTool`（readOnly+idempotent+非破坏）、`localWriteTool`（本地写）、`aiBackedWriteTool`（AI 后端写，`openWorldHint:true`）、`destructiveTool`（`destructiveHint:true`）。落点举例：`alembic_bootstrap`/`rescan`/`plan`/`submit_knowledge`/`job` = aiBackedWrite；`alembic_runtime`/`evolve` = destructive；`alembic_status`/`recipe_map`/`search`/`graph`/`prime` = readOnly。
- `gateway`：`PluginToolGatewayMappingEntry | null`。写工具映射到 `{action, resource}`（如 `submit_knowledge → knowledge:create`、`evolve → knowledge:evolve`），`alembic_project_skill` 用 `resolver(args)` 按 `operation`（create/update/delete/export）动态映射（`PluginToolSurfaceCatalog.ts:228`）。`TOOL_GATEWAY_MAP`（`PluginToolSurfaceCatalog.ts:344`）从有 gateway 的条目派生——即 `tools.ts` re-export、供 Gateway gating 使用。
- `knowledgeGate`：`PluginToolKnowledgeGate`（`cold-start`/`initialized`/`knowledge-ready`/`resident-project-scope`/`admin-opt-in`/`none`）。决定工具在什么 knowledge 阶段可见/可用。三个 agent 公共工具 gate 为 `resident-project-scope`；`evolve`/`consolidate` 为 `knowledge-ready`；`knowledge_lifecycle` 为 `admin-opt-in`。
- `residentRoutePolicy`：`status-probe`/`explicit-resident-search`/`resident-project-scope`/`resident-or-embedded-jobs`/`none`。决定是否/如何走 resident 路由。

**Codex-local only 工具**（不在 `tools.ts` 的 `TOOLS` 里，只在 catalog + `getVisibleTools` 注入）：`alembic_init`（`CodexInitInput`，localWrite）、`alembic_job`（`CodexJobInput`，aiBackedWrite，MTC-7 合并 bootstrap_job+rescan_job+codex_job）、`alembic_runtime`（`CodexRuntimeInput`，destructive，MTC-7 合并 stop+cleanup）。这解释了「宿主实际看到的工具数」比 `tools.ts` 的 `TOOLS` 多——catalog 是超集。

导出的辅助：`getPluginToolSurfaceEntry`/`getPluginToolAnnotations`/`withPluginToolAnnotations`（`PluginToolSurfaceCatalog.ts:358`，把 catalog annotation 合进工具声明，tool 自带 annotation 优先覆盖）/`listPluginToolSurfaceCatalog`（返回深拷贝列表）。

设计模式：registry（单一 catalog 对象）+ strategy（annotation/gate/route policy 驱动行为）+ facade（`withPluginToolAnnotations` 一个函数把元数据贴到声明上）。

---

### 4.8 `plugin-host-contracts.ts`：跨宿主契约与合规注册表

文件：`lib/runtime/mcp/plugin-host-contracts.ts`（约 320 行）。这是一层**契约声明/合规元数据**（不参与运行时路由），用于测试与门禁证明「plugin MCP 投影不泄漏私有字段、契约行覆盖齐全」。要点：

- `PLUGIN_HOST_MCP_TOOL_FAMILY_CONTRACTS`（`plugin-host-contracts.ts:92`）：把工具分成 4 个 family（`codex-local`/`embedded-core`/`agent-public`/`knowledge-context`），各自绑定一批 D4 registry row id（I10–I24）和 tool name 列表（分别引用 `LOCAL_CLEAN_OUTPUT_TOOL_NAMES` / `CORE_CLEAN_OUTPUT_TOOL_NAMES` / `AGENT_PUBLIC_TOOL_NAMES` / `KNOWLEDGE_CONTEXT_CLEAN_OUTPUT_TOOL_NAMES`）。
- `PLUGIN_HOST_MCP_ACTIVE_TOOL_NAMES` / `PLUGIN_HOST_MCP_RESIDENT_ROUTE_TOOL_NAMES` / `PLUGIN_HOST_MCP_RESIDENT_ROUTE_POLICIES`（`plugin-host-contracts.ts:115`+）：从 `listPluginToolSurfaceCatalog()` 派生的活跃工具/带 resident 路由的工具/去重后的 route policy 列表。
- `PLUGIN_HOST_RESIDENT_PROVIDER_FIXTURE_REPLAY`（`plugin-host-contracts.ts:130`）+ `PLUGIN_HOST_D24_CONSUMER_REPLAY_SCENARIOS`（`plugin-host-contracts.ts:180`）：把「provider fixture → consumer 期望字段 / 禁止字段」成对声明，用于 replay 测试。例如 `alembic_status` 消费 `/api/v1/daemon/health` fixture 时，`expectedFields` 含 `checks/services/version`，`forbiddenOrdinaryOutputFields` 含 `apiKey/internalTelemetry/providerPrivateTrace/secretToken` 等——这正是 4.6.5/4.6.6 禁字段门禁要保证的。
- `PLUGIN_HOST_LEGACY_REWRITE_CANDIDATES`（`plugin-host-contracts.ts:267`）：记录仍保留的兼容层及其**清理触发条件/owner/替换契约/验证引用**（D12-P03 = fallback project-root 诊断，只有 Codex 总能提供 trusted 显式 root 后才删；D12-P04 = `dev:codex-plugin:refresh` 别名）。这是仓库规则「临时兼容代码必须记录 consumer/removal condition/owner」的落地。
- `summarizePluginHostMcpContracts()`（`plugin-host-contracts.ts:303`）：汇总活跃工具数/clean-output 工具数/replay 场景数/legacy candidate 数/fixture 数/resident route 工具数，供合规报告。

这一层不改运行时行为，是**契约测试的锚点**；理解它有助于知道哪些字段是「有意保留的分叉」而不能随手合并（对应 CLAUDE.md「工具契约段是已验证的有意分叉」）。

---

### 4.9 `error-taxonomy.ts`：错误分类学（Core failure taxonomy 适配）

文件：`lib/runtime/mcp/error-taxonomy.ts`（约 283 行）。把 plugin 侧的任意 error code/status/provider problem 归一成 Core 的失败分类学（`@alembic/core/shared` 的 `CORE_FAILURE_*` 常量 + `getCoreFailureTaxonomyEntry`）。

- `CleanMcpFailureTaxonomySchema`（`error-taxonomy.ts:21`，`.strict()`）：一条完整 taxonomy 有 `agentBranch`/`canonicalHttpStatus`/`dashboardState`/`exposureClass`/`detailExposureClass`/`failureId`（`^core\.failure\.[a-z...]$`）/`failureStatus`/`mcpErrorCode`/`mcpStatus`/`privateDataSafe`（literal true）/`problemClass`/`reasonCode`/`refPolicy`/`retryPolicy`/`retryable`/`taxonomyVersion`。
- `LEGACY_ERROR_CODE_FAILURE_KINDS`（`error-taxonomy.ts:59`）：一张巨大的 legacy code → CoreFieldFailureKind 映射（IC4/P3 step-7 registry adoption）。示例：`CODEX_TOOL_RETIRED→capability-mismatch`、`RATE_LIMIT→unavailable`、`CONSENT_REQUIRED→needs-confirmation`、`CONSTITUTION_VIOLATION→permission-denied`、`QUALITY_GATE_FAILED→invalid-input`、`INSUFFICIENT_EVIDENCE→invalid-input`、`CLEAN_OUTPUT_PROJECTOR_MISSING→capability-mismatch`。注释强调 Recipe evidence gate 拒绝（source-quality / consent）不再表现为 internal failure。
- `createCleanMcpFailureTaxonomy(input)`（`error-taxonomy.ts:137`）：**多级回退推断 failure kind**——`input.failureKind` → provider problem 的 reasonCode/kind/mcpStatus/dashboardState/failureId/mcpErrorCode → `readCoreFailureKind(input.code)` → `readCoreFailureKind(input.status)` → `mapLegacyErrorCodeToFailureKind(input.code)` → provider code → 兜底 `internal-error`。再用 `getCoreFailureTaxonomyEntry(kind)` 取完整 taxonomy entry 填充所有字段。`retryable` 优先取 provider 显式值。
- `extractProviderProblemTaxonomy` / `hasFailureTaxonomyShape`（`error-taxonomy.ts:203`）：识别 provider（如 AI provider）返回的 problem 是否已带 taxonomy 形状（在 value / value.error / value.details 三处探）。
- `sanitizeCleanMcpErrorDetails`（`error-taxonomy.ts:179`）+ `CLEAN_MCP_ERROR_SENSITIVE_KEYS`（`error-taxonomy.ts:119`）：递归删除 details 里的敏感键（`stack`/`authorization`/`apikey`/`cookie`/`privatedaemonurl`/`providerprivatetrace` 等，键名归一化后比对）。这保证错误 details 不泄漏 secret/stack。

与 Core 的消费点：`@alembic/core/shared` 的 `CORE_FAILURE_*` / `CORE_FIELD_*` 常量、`getCoreFailureTaxonomyEntry`、`isCoreFieldFailureKind`——即 failure taxonomy 的**权威定义在 Core**，本文件只做「plugin code → Core kind」的适配（IC4/P3 registry adoption，vendor ef83a41 lineage）。

---

### 4.10 `envelope.ts`：legacy envelope（历史包袱）

文件：`lib/runtime/mcp/envelope.ts`（约 52 行）。`envelope({ success, data, message, meta, errorCode })`（`envelope.ts:26`）产出旧的 `{ success, errorCode, message, data, meta:{ tool?, version(默认'2.0.0'), responseTimeMs?, source? } }` 结构。这是 **clean-output-contract 之前的 v2 envelope**——现在 handler 若返回这种形状，会被 `serializeMcpToolResult` 的 legacy 分支（`projectLegacyErrorAsCleanResponse` 或各 tool 的 `projectXxxToolOutput` 的 legacy 提取路径，见 4.6.3/4.6.5/4.6.6）收敛掉。保留它是为兼容仍返回 v2 envelope 的 handler；新代码应直接产出 clean response。这是本节最明显的历史包袱。

---

### 4.11 `RateLimiter.ts`：进程内滑动窗口限流

文件：`lib/runtime/mcp/RateLimiter.ts`（约 70 行）。极简的内存滑动窗口限流器，防批量提交耗尽资源。

- `checkRecipeSave(projectRoot, clientId, { windowMs=60000, maxRequests=10 })`（`RateLimiter.ts:32`）：key = `${projectRoot}:${clientId}`，命名空间隔离到项目 + 客户端。维护一个 `timestamps` 数组，过滤掉窗口外记录；若 `>= maxRequests` 返回 `{ allowed:false, retryAfter }`（秒），否则 push 当前时间戳返回 `{ allowed:true }`。
- `_pruneIfNeeded(windowMs)`（`RateLimiter.ts:11`）：每 `PRUNE_INTERVAL=300000ms`（5 分钟）清理一次全部空 bucket，防内存泄漏。
- `resetRateLimiter()`（`RateLimiter.ts:65`）：清空（测试用）。

坑点：状态是模块级全局 `_buckets` Map，进程内共享；跨进程/多实例不共享。命名 `checkRecipeSave` 暗示主要用于 `submit_knowledge`/Recipe 保存路径的限流（本节文件未见调用点，属其消费方；限流器本身是被动 util）。

---

### 4.12 public-tools 契约层（agent-facing 三工具的稳定 schema）

除 4.6.4 的 output 外，`public-tools/` 目录还定义了三工具的输入/结果/描述契约，构成一个「双宿主共享、无 schema 分叉」的稳定表面。

#### 4.12.1 `contract.ts`（约 512 行）

文件：`lib/runtime/mcp/public-tools/contract.ts`。契约版本 `AGENT_PUBLIC_TOOL_CONTRACT_VERSION = 1`。

- `AGENT_PUBLIC_TOOL_NAMES = ['alembic_prime','alembic_work','alembic_code_guard']`（`contract.ts:5`）。
- `AGENT_HOSTS = ['codex','claude-code']`（`contract.ts:12`）：RC-5 收敛为真实双宿主，删掉从未实现的 generic-host-agent。这是 CC/Codex 双宿主的契约锚点。
- 一批枚举：`AGENT_INPUT_SOURCES`/`AGENT_INTENT_KINDS`/`AGENT_ACTION_KINDS`（`['prime','work','code-guard']`，MTC-7 合并 work 生命周期）/`AGENT_RESULT_STATUSES`（`['ready','skipped','degraded','blocked','failed']`）/以及 skip/degraded/blocked/failure 各自的 reason code 枚举。
- `AgentPublicToolResultEnvelopeSchema`（`contract.ts:178`）：`superRefine` 强制 `actionKind` 匹配工具名、`status` 匹配 `reason.kind`（与 output schema 同规则，双端一致）。
- `PrimePublicPackageSchema`（`contract.ts:229`，`.strict()`）：Codex/CC host 读取 prime 结果的**稳定投影**——含 `trustPosture`（5 层 `PRIME_PUBLIC_TRUST_LAYERS` 的 receiptChecklist，防空回执）、`projectContextGuidance`、`trustReceipt`、`feedbackDigest`、`compactPackage`（acceptedGuards/acceptedKnowledge 有界列表 + `primeInjectionPackage`，后者 `pluginSynthesized: z.literal(false)`、`producer: z.literal('alembic-resident-service')`——**契约上禁止 plugin 侧合成 prime 注入包**，只能由 resident service 产出）。这是「完整知识走 detailRefs、可见 message 不塞长知识包」原则的 schema 落地。
- `AGENT_PUBLIC_TOOL_CONTRACT_CATALOG`（`contract.ts:434`）：三工具的 input/result 契约定义（acceptedRefs / requiredFields / producesRefs / statuses），三者均 `activeMcpSurface:true`、`handlerDependency:'McpServer.agent-public-tools'`、`implementationStatus:'active-tool'`。`alembic_work` 的注释（`contract.ts:448`）说明 phase=start/finish 的 ref 是两 phase 的并集，finish 强制要 workRef。

#### 4.12.2 `descriptions.ts`（约 52 行）

文件：`lib/runtime/mcp/public-tools/descriptions.ts`。`AGENT_PUBLIC_TOOL_DESCRIPTION_BASE`（`descriptions.ts:15`）为三工具提供 zod 校验过的 `{title, purpose, selectionHint, nonGoal}` 文案（各字段有 max 长度约束）。`getAgentPublicToolDescriptionBase(name)`（`descriptions.ts:48`）被 `tools.ts` 用来拼 description。把描述抽成单源、schema 约束，保证 `tools.ts` 里三工具描述不手写漂移。

#### 4.12.3 `cross-host-readiness.ts`（约 115 行）

文件：`lib/runtime/mcp/public-tools/cross-host-readiness.ts`。证明「跨宿主 prompt snapshot 不把退役入口当主入口、且两宿主共享同一 schema signature」。

- `SHARED_SCHEMA_SIGNATURE`（`cross-host-readiness.ts:60`）：由 contractVersion + hosts + tools + statuses 拼成的签名字符串。
- `buildAgentPublicCrossHostReadinessReport()`（`cross-host-readiness.ts:69`）：为每个 host 生成 `AgentPublicCrossHostPromptSnapshot`，`noSchemaFork = 所有 snapshot 的 schemaSignature 去重后 size===1`（证明无分叉）。
- `CROSS_HOST_FORBIDDEN_LEGACY_PRIMARY_GUIDANCE`（`cross-host-readiness.ts:14`）：`alembic_task`/`operation=prime`/`record_decision` 等退役入口词，用于断言 host prompt 不再把它们当主入口。
- 每个 snapshot 的 firstMove/primeFlow/workLifecycle/guardAndDecision 是**给 host prompt 的标准指引文案**（如「直接调 alembic_prime，obsolete intentRef 被 block」「alembic_work phase=start/finish」）。

#### 4.12.4 `public-tools/index.ts`（barrel）

文件：`lib/runtime/mcp/public-tools/index.ts`（4 行）：re-export contract / cross-host-readiness / descriptions / output。是 public-tools 的对外统一入口（barrel 模式）。

---

### 4.13 数据流总览（一次 `tools/call` 的完整变形）

以宿主调 `alembic_search` 为例（走 `HostMcpServer`）：

1. 宿主 → stdio → `HostMcpServer.registerHandlers` 的 `CallToolRequestSchema` handler（`HostMcpServer.ts:216`）。`readHostTurnMetaFromMcpRequest` 抽 host-turn-meta。
2. `handleToolCall` → 退役拦截 → `resolveProjectRootScope`（可能分裂 scoped server）→ `handleToolCallInCurrentProject`。
3. 两段 `preflightTool`（knowledge gate / resident scope / trust 门禁）→ 可能触发 init-on-demand。
4. `dispatchLocalTool` 不命中 search（search 是 embedded-core）→ `callPluginOwnedTool` → `EmbeddedToolExecutor.execute` 委托内核 → handler 经内核侧 `wrapHandler`（zod 校验 + 错误统一）执行 → 返回裸/legacy/clean 值。
5. `attachPluginOpportunisticEvolutionSurface` 附加维护表面（若适用）。
6. 回到 `registerHandlers`：`serializeMcpToolResult('alembic_search', result, {isErrorResult})` → 命中 knowledge-context `alembic_search` 投影器（相邻子系统注册）→ `outputSchema.parse` → `createMcpStructuredToolResult` → `{ structuredContent, content:[text=summary], isError? }`。
7. 若 handler 抛异常 → `wrapHandler`/server catch → `createCleanMcpErrorResponse`（error-taxonomy 归一 failure kind + 敏感字段清洗）→ 同样的 `CallToolResult` 形状。

走 `McpServer`（resident）时，步骤 3–5 换成 `_resolveHandler` → `HANDLER_MAP` 直接调 handler，其余收敛/错误契约完全一致（两个 server 共用 output-contract + error-taxonomy）。

**跨层边界总结**：宿主只见 clean `CallToolResult`；handler 可返回任意 legacy/裸值，由 output-contract 强制收敛；元数据（annotation/gate/route/gateway）全在 catalog 单源；错误 kind 权威在 Core taxonomy；输入 schema 一次 zod 定义、`zodToMcpSchema` 出对外 JSON Schema、`wrapHandler` 用同 zod 做对内校验。


---

## 5. 工具处理器与路由层 (MCP Handlers)

本节测绘 `lib/runtime/mcp/handlers/**` 这一整层：它是 `alembic-codex-plugin-runtime` 把 MCP 工具调用转成真实业务链的落点。上游的 `McpServer._resolveHandler()`（`lib/runtime/mcp/McpServer.ts:396`）持有一张 `name → handler-lambda` 的注册表，把每个 `alembic_*` 工具名映射到本层的一个入口函数；本层再向下调 `#service/*` 服务层、`#recipe-generation/*` 工作流层与 `@alembic/core` 共享内核。所有对外返回一律经 `envelope()`（`lib/runtime/mcp/envelope.ts:27`）或 public-tools 契约包装成统一 schema。

### 5.0 分层与总体数据流

一次 `alembic_*` 工具调用的完整链路：

```
Codex/Claude Code host
  → MCP stdio/http glue
  → McpServer.callTool → _resolveHandler(name)            (registry, McpServer.ts:397)
  → handlers/<x>.ts (本节)                                (参数解构 + 门禁 + 投影)
      → #service/*  (SearchEngine / ModuleService / ProjectSkillService / project-knowledge-context / RecipeFreshnessRuntime …)
      → #recipe-generation/*  (plan-tool / host-agent-workflows / evidence-gate …)
      → @alembic/core/*  (knowledge / guard / search / evolution / recipe-context-capabilities / host-agent-workflows …)
  → envelope() / createAgentPublicToolOutput()  统一响应
```

`McpServer._resolveHandler` 的注册表把工具分成四族（`lib/runtime/mcp/McpServer.ts:397-439`）：

- Agent 层（`alembic_prime` / `alembic_work` / `alembic_code_guard` / `alembic_status`）→ `agent-public-tools.ts` + `system.ts`。
- 路由层（`alembic_recipe_map` / `alembic_search` / `alembic_graph` / `alembic_plan` / `alembic_submit_knowledge` / `alembic_project_skill`）→ 全部经 `tool-router.ts` 转发。
- Host-Agent 冷启动/进化层（`alembic_bootstrap` / `alembic_rescan` / `alembic_evolve` / `alembic_dimension_complete` / `alembic_consolidate`）→ `host-agent/*` + `consolidate.ts`。
- Admin 层（`alembic_knowledge_lifecycle`）→ `knowledge.ts`。

注意 `alembic_work` 在注册表里就地按 `args.phase` 分叉：`phase==='finish'` 走 `workFinishHandler`，否则走 `workStartHandler`（`McpServer.ts:401-404`）。这是唯一在 registry 层做的二次分叉，其余工具都在 handler 内部分叉。

设计模式总览（落点在后文各小节展开）：

- **Registry / Dispatch table**：`McpServer._resolveHandler` 的 `HANDLER_MAP`。
- **Router（mode/queryKind 归一）**：`tool-router.ts` 的 `routeSearchTool` / `routeGraphTool`。
- **Facade / Adapter（薄转接）**：`skill.ts`（转 `ProjectSkillService`）、`host-agent/bootstrap.ts` `host-agent/rescan.ts` `host-agent/dimension-completion.ts`（转 Core workflow）、`evolution-prescreen.ts` `TargetClassifier.ts`（纯 Core re-export）。
- **Gateway（生产网关）**：`RecipeProductionGateway`（submit_knowledge）与 `EvolutionGateway`（consolidate / evolve）。
- **Pipeline（多阶段投影）**：`search.ts` 的 `runSearchPipeline → assessSearchRelevance → projectAlembicSearchOutput`。
- **Gate（门禁）**：`recipe-content-quality-gate.ts`（stage-1 内容质量）、`recipe-evidence-gate`（bootstrap 生产地板）、`RateLimiter`、`guardReview` 的 review-round 上限。
- **DI（服务定位）**：所有 handler 从 `ctx.container.get(name)` 取服务，取不到即降级。

### 5.1 共享上下文与类型契约 — `handlers/types.ts`

`types.ts`（`lib/runtime/mcp/handlers/types.ts`）是本层的 runtime-free 类型底座，只有 interface 与 type alias，不含逻辑。

- `McpServiceContainer`（`types.ts:17`）：最小 DI 容器形状。`get(name): any`（有意 `any`，因为 MCP handler DI 是动态服务边界，调用方在具体工具内按语义收窄），可选 `getServiceNames?()` 与 `singletons?`。**所有 handler 对服务的访问都收敛到这一个方法**，且几乎都包了 try/catch 降级（下文反复出现的 `optionalContainerService` / `safeContainerGet` / `safeGet`）。
- `McpContext`（`types.ts:36`）：`{ container, startedAt?, session?, hostTurnMeta?, [key]: unknown }`。`logger` 通过 index-signature 挂在上面，取值前必须做类型守卫（`tool-router.ts:364-375` 就是例子）。`consolidate.ts` 与 `evolve.ts` 各自本地重声明了一份带强类型 `logger` 的 `McpContext`（`consolidate.ts:18`、`host-agent/evolve.ts:27`），是有意的局部收窄。
- `McpSession`（`types.ts:27`）：`id / startedAt / toolCallCount / toolsUsed:Set / lastActivityAt`，被 `system.ts` 的 status 投影读出。
- `SearchArgs` / `SearchResultItem` / `SlimSearchItem`（`types.ts:47/67/82`）：search 链路的输入与两级投影结果形状。
- `KnowledgeEntryJSON`（`types.ts:96`）：知识条目 JSON 只读投影的最小形状（含 `content` / `reasoning` / `relations` / `constraints` / `quality` / `stats` 等子块与可选 `toJSON()`），search 的 `toKnowledgeEntryJson()` 依赖它。
- `ToolRouter*Args`（`types.ts:229-261`）：router 转发用的参数别名。`ToolRouterSearchArgs` 加 `mode`，`ToolRouterGraphArgs`/`ToolRouterSkillArgs` 保留旧 `operation` 字段做归一。
- 从 `@alembic/core/types` re-export `BootstrapFile` / `IncrementalPlan` / `SaveSnapshotParams` / `DimensionCheckpointResult` / `LoggerLike`（`types.ts:279-287`），让 handler 层与 Core 的类型对齐而不重复声明。

**与 Core 的消费点**：`import type { … } from '@alembic/core/types'` 与 `HostTurnMetaInput from '#service/task/host-turn-meta.js'`。

### 5.2 参数路由层 — `handlers/tool-router.ts`

文件头注释明确定位：「不包含业务逻辑，仅做参数解构 → 路由 → 转发」。但历史演化让它额外承载了 `alembic_submit_knowledge` 的完整统一提交管线（见 5.2.3），是本层最重的单文件。

#### 5.2.1 纯转发路由（Router 模式）

- `routeRecipeMapTool`（`tool-router.ts:81`）→ `recipeMapHandlers.recipeMap`（单 handler，focus 驱动，替代已退役的 `alembic_project_matrix`）。
- `routeSearchTool`（`tool-router.ts:91`）：按 `args.mode` 分叉——`keyword`→`searchHandlers.keywordSearch`、`semantic`→`searchHandlers.semanticSearch`、其余（`auto`/未指定）→`searchHandlers.search`。三条都最终落到同一个 `search()` 入口（见 5.3）。
- `routeGraphTool`（`tool-router.ts:115`）→ `structureHandlers.graph`。注释说明旧 `operation` 参数已在 handler 边界归一为 `queryKind`，不再二次分支。
- `routePlanTool`（`tool-router.ts:119`）→ `routePlanToolImpl`（`#recipe-generation/plan-tool.js`，相邻子系统，不展开）。
- `routeProjectSkillTool`（`tool-router.ts:126`）：把旧 `args.name` 兼容映射到 `skillName` 后转 `skillHandlers.projectSkill`。

`tool-router.ts:105` 记录了历史退役：`routeKnowledgeTool` / `routeStructureTool` / `routeCallContextTool` 已删（`alembic_knowledge` / `alembic_structure` / `alembic_call_context` 是退役工具），`routeGraphTool` 保留 LIVE。

#### 5.2.2 `alembic_submit_knowledge` 统一提交管线（核心业务链）

入口 `routeSubmitKnowledgeTool`（`tool-router.ts:151`）。文件头（`tool-router.ts:135-149`）声明四条设计原则：不降级（缺字段不自动补全，要求 Agent 一次性生成完整数据）、不碎片化（优先增强已有 Recipe）、不重复提交（拒绝时不建任何记录）、单条/批量走完全一致的校验与融合逻辑。

流水线严格按顺序执行，任一门禁失败即 early-return，**门禁前不落库**：

1. **items 解析** `resolveSubmitKnowledgeItems`（`tool-router.ts:200`）：`items` 必须是非空数组，否则返回 `INVALID_INPUT`。
2. **options 解析** `resolveSubmitKnowledgeOptions`（`tool-router.ts:216`）：解出 `bootstrapSessionId`（`sessionId` 或 `bootstrapSessionRef`，后者去 `bootstrap-session:` 前缀 `normalizeBootstrapSessionRef` `tool-router.ts:822`）、`clientId` / `dimensionId` / `skipConsolidation` / `source`（经 `normalizeHostAgentWriteSource`，来自 `#codex/SourceBoundary.js`）/ `supersedes`。
3. **限流 + projectRoot** `resolveSubmitProjectContext`（`tool-router.ts:232`）：动态 import `../RateLimiter.js` 的 `checkRecipeSave` + `@alembic/core/workspace` 的 `resolveProjectRoot`；超限返回 `RATE_LIMIT`（附 `retryAfter`）。
4. **items 预处理** `preprocessSubmitKnowledgeItems`（`tool-router.ts:254`）：逐条归一 `source`；`dimensionId` 回填；有 `dimensionId` 时用 `dimensionTags`（`@alembic/core/dimensions`）合并出 tags。
5. **内容质量门（stage-1）** `validateSubmitKnowledgeContentQuality`（见 5.9），失败→`buildSubmitKnowledgeContentQualityResponse`（`tool-router.ts:713`），错误码 `QUALITY_GATE_FAILED`，附 `problem.type='alembic.recipe-content-quality.rebuild-required'`。
6. **bootstrap session 解析 + dataRoot** `resolveBootstrapSession`（来自 `#recipe-generation/host-agent-workflows/recipe-evidence-gate.js`）+ `resolveHostAgentDataRoot`（`tool-router.ts:167-171`）：dataRoot 优先用 session 的 `projectRoot`，否则用 projectContext 的。
7. **证据门（bootstrap 生产地板）** `buildSubmitKnowledgeEvidenceGateResponse`（`tool-router.ts:754`）：先 `shouldRunRecipeEvidenceGate` 判断是否需要跑（依据 args/items/session），需要则 `validateRecipeProductionEvidenceGate`；失败返回 `primaryEvidenceGateCode` 错误码 + `problem.type='alembic.recipe-evidence-gate.rebuild-required'`。**这是把「host-agent 冷启动提交」与「普通提交」区分对待的关键门**。
8. **写入** `createSubmitKnowledgeRecipes`（`tool-router.ts:286`）→ `RecipeProductionGateway.create()`（见 5.2.3）。
9. **提交追踪** `trackSubmitKnowledgeResult`（`tool-router.ts:388`）：把 created/rejected 逐条回写 BootstrapSession 的 `submissionTracker`（best-effort，`_trackSubmission`/`_trackRejection` `tool-router.ts:851/869`，取 session 失败静默）。
10. **新鲜度刷新** `refreshCreatedRecipeFreshness`（`#service/knowledge/RecipeFreshnessRuntime.js`），把创建结果喂给新鲜度运行时。
11. **响应组装** `buildSubmitKnowledgeResponse`（`tool-router.ts:407`）。

#### 5.2.3 RecipeProductionGateway 构造与 canonical 模块轴（Gateway 模式 + U1#5）

`createSubmitKnowledgeGateway`（`tool-router.ts:307`）动态 import `@alembic/core/knowledge` 的 `RecipeProductionGateway` 与 `@alembic/core/service/candidate` 的 `findSimilarRecipes`，然后注入一组 DI 服务：`knowledgeService`（必需）、可选 `consolidationAdvisor` / `proposalRepository` / `evolutionGateway`（经 `optionalContainerService` `tool-router.ts:380` 取，取不到为 null）。

`create()` 的入参固定 `source: HOST_AGENT_SOURCE`（来自 `@alembic/core/shared`），`userId: getDeveloperIdentity()`，并透传 `skipConsolidation` / `supersedes` / `existingTitles` / `existingTriggers`（后两者由 `readBootstrapSubmissionSets` `tool-router.ts:272` 从 session 读，做去重防线）。

**canonical 模块轴（U1 #5，注释 `tool-router.ts:311-314/339-342`）**：`resolveSubmitKnowledgeModuleAxis`（`tool-router.ts:343`）best-effort 从 `moduleService.listCanonicalModules()` 拿到内存中的 canonical ProjectMap.modules，用 `buildKnownModuleNames` / `buildResolveModuleFromSourceRefs`（`#recipe-generation/canonical-module-axis.js`）构出 `knownModuleNames` 与 `resolveModuleFromSourceRefs` 两个依赖注入 gateway，让 Core 的 `#deriveModuleName` 按 canonical 轴校验显式 `moduleName` / 反查 `sourceRefs` 落点。取不到模块轴时两个 dep 为 undefined，Core 退回原 passthrough（加性、向后兼容）。异常时通过类型守卫后的 `ctx.logger.warn` 打印降级原因。

#### 5.2.4 响应组装（多字段 append 投影）

`CreateRecipeResult` 被拆成多个 append 函数分别贴到 `data`（`tool-router.ts:419-426`）：

- `appendCreatedSubmitData`（`tool-router.ts:521`）：`ids` + `hostAgentAnalysisLinkage`（`buildHostAgentAnalysisLinkage` `tool-router.ts:905` 把 item 的 `unitId`/`analysisUnitIds`/`sourceRefs` 关联到 created recipe，用于 host-agent 进度回填；同名字段 `ideAgentAnalysisLinkage` 兼容别名并存）。
- `appendRejectedSubmitData`（`tool-router.ts:541`）：`rejectedItems` + `rejectedSummary`（含 `commonErrors` 去重）。
- `appendBlockedSubmitData`（`tool-router.ts:563`）：融合分析阻塞项（与已有 Recipe 重叠或实质性不足），提示 `skipConsolidation:true` 可跳过。
- `appendProposalSubmitData`（`tool-router.ts:577`）：`gatewayResult.merged` 映射成进化提案；`supersedeProposal` 存在时追加一条 `type:'supersede'`（`collectCreatedSubmitProposals` `tool-router.ts:593`）。
- `appendPendingSemanticReviewData`（`tool-router.ts:618`）：处理相似度模糊区间（0.4–0.65）的候选，为每条生成 `_buildPendingSemanticReviewDecision`（`tool-router.ts:890`）。**关键防线**：`_resolvePendingSemanticReviewRecipeId`（`tool-router.ts:960`）只接受 Core 明确返回的 `newRecipeId` 或 `createdRecipe.id`，拿不到就把该条归入 `nextActionBlocked`（`appendConsolidateBlockedAction` `tool-router.ts:667`），并显式声明「Plugin 不会猜测新 Recipe ID，也不会生成不可执行的 consolidate 指令」（`tool-router.ts:688`）。可执行的则组成 `nextAction`（`appendConsolidateNextAction` `tool-router.ts:644`），建议调 `alembic_consolidate`（required:false）。
- `appendRelationshipGroundingData`（`tool-router.ts:634`）：调 `assessProjectContextRelationshipGrounding`（`#recipe-generation/project-context-anchoring.js`）评估关系是否落地。
- `appendSubmitFreshnessData` / `appendSubmitTruthfulnessData`（`tool-router.ts:443/454`）：把 `RecipeFreshnessPublicOutput` 展开成 `freshness` / `retrievalMayBeStale`，并据 `collectSubmitDegradedReasons`（`tool-router.ts:471`，收集 freshness/vector/source-refs/relationship-grounding 各类降级原因）设 `status`（degraded/completed）+ `finality`（non-final/final）+ `degradedReasons`。这是**真实性/降级透传**约束的落点：任何一处降级都会把 `retrievalMayBeStale` 抬成 true。

全部拒绝时（`successCount===0 && rejected.length===items.length`）走 `buildAllRejectedSubmitResponse`（`tool-router.ts:694`），错误码 `INCOMPLETE_SUBMISSION`，附 `requiredFields`（`getRequiredFieldsDescription` from Core）。否则按 `successCount>0` 决定 `success`。

**与 Core 的消费点**：`@alembic/core/dimensions`（dimensionTags）、`@alembic/core/knowledge`（CreateRecipeItem/CreateRecipeResult、getRequiredFieldsDescription、RecipeProductionGateway）、`@alembic/core/shared`（getDeveloperIdentity、HOST_AGENT_SOURCE）、`@alembic/core/service/candidate`（findSimilarRecipes）、`@alembic/core/workspace`（resolveProjectRoot）。**与宿主的连接点**：`normalizeHostAgentWriteSource` from `#codex/SourceBoundary.js` 强制新写入 source 归一为 host-agent 家族。

### 5.3 检索入口 — `handlers/search.ts`

`alembic_search` 是本层最长的文件（2521 行）。文件头（`search.ts:1-12`）声明：把 `search`/`keywordSearch`/`semanticSearch` 收束到 `search()` 单入口、经 SearchEngine singleton（含 vectorStore + aiProvider）执行、统一投影。`keywordSearch`（`search.ts:2513`）与 `semanticSearch`（`search.ts:2518`）只是 `search({...args, mode})` 的别名。

#### 5.3.1 顶层 `search()` 状态机（Pipeline 模式）

`search()`（`search.ts:178`）：

1. `normalizeSearchOperation`（`search.ts:1946`）：`operation` 归一为 `search`/`get`/`expand`。`get`/`expand` 直接走 `projectDetailOperation`（详情/展开分支，`search.ts:874`），不进检索管线。
2. `runSearchPipeline`（见 5.3.2）执行检索。
3. `buildRetrievalCheckpointPosture`（见 5.8）读 git diff checkpoint，产出新鲜度姿态。
4. `buildKnowledgeCandidates`（`search.ts:964`）：合并「pipeline 原始命中 → candidate」与「knowledgeService.list → candidate」，交给 Core 的 `DefaultRecipeCandidateProvider.listRecipeCandidates` 排序。
5. `assessSearchRelevance`（见 5.3.3）做**直接命中判定**（这是本文件的核心业务逻辑）。
6. 投影出 `detailRefs`（`createKnowledgeDetailRef`，经 Core `defaultRefRegistry.createDetailRef`）、`sources`、`inventory`、`result`、`nextActions`。
7. 计算 `status`：`degraded | ready`（degraded 触发条件 = pipeline.degraded ∪ zeroMatch ∪ checkpoint.retrievalMayBeStale）。
8. 组装 `SearchDiagnostic[]`（zero-match 一条 + checkpoint 诊断），`nextActions.unshift(checkpoint nextActions)`。
9. `projectAlembicSearchOutput`（`search.ts:120`）→ Core `createAlembicSearchMcpResult`，带 `contractVersion=ALEMBIC_SEARCH_OUTPUT_CONTRACT_VERSION`、`outputSchema='AlembicSearchOutput'`、`producer='alembic-search-handler'`。

#### 5.3.2 检索管线 `runSearchPipeline`（多 lane 融合）

`runSearchPipeline`（`search.ts:294`）：

- 引擎：`getSearchEngine`（DI 单例，`search.ts:59`）取不到则 `getFallbackEngine`（`search.ts:82`，动态 new `SearchEngine(db, {knowledgeRepo, sourceRefRepo})`，无向量能力降级）。
- 三条 lane 并行准备：
  - **resident lane**：`tryResidentSearch`（`search.ts:2429`）→ `residentSearchClient.search`（DI key `residentSearchClient`，兼容旧 key `residentServiceClient`，`getResidentSearchClient` `search.ts:68`）。仅在 `auto`/`semantic` + 有文本 query 时尝试。
  - **local recipe-region vector lane**：`tryLocalRecipeRegionVectorSearch`（`search.ts:432`）→ `vectorService.hybridSearch(query, {filter:{type:RECIPE_SEMANTIC_REGION_METADATA_TYPE}})`，把命中经 `localRecipeRegionHitsToSearchItems`（`search.ts:510`，按 recipeId 分组去重取最高分 + 构 scoreBreakdown）转成 SearchResultItem。每一步都产出 `meta.reason`（vectorService-unavailable / vector-provider-unavailable / no-local-recipe-region-vector-match / …）作为可诊断降级证据。
  - **embedded keyword lane**：`tryEmbeddedSearch`（`search.ts:757`）→ `engine.search()`。
- `resolveSearchResult`（`search.ts:668`）做 lane 仲裁：有语义命中时 `auto` 模式会再补 embedded keyword 再融合（`mergeSearchResultItems` `search.ts:792` 按 id 取高分并合并 `__alembicSearchRoutes` 内部路由标记）；纯 `semantic` 无语义证据时返回空 + `route:'resident-semantic-unavailable'`（**不降级到 keyword**，见 5.3.3 的门禁语义）。
- Kind 过滤（`filterByKind` `search.ts:91`）+ 截断 + `slimSearchResult`（Core）投影 + `groupByKind`（Core）分组。
- `degraded = mode==='semantic' && actualMode!=='semantic'`。

#### 5.3.3 直接命中判定 `assessSearchRelevance`（相关性门禁）

`assessSearchRelevance`（`search.ts:1022`）是把「检索返回的候选」收敛成「可信直接命中」的门禁。四条 route（`SearchMatchRoute='exact'|'filter'|'keyword'|'semantic'`）：

- `annotateDirectSearchPrecision`（`search.ts:1085`）逐候选标注：`candidateHasExactMatch`（id/ref/title/trigger 精确匹配，含各种 `knowledge:`/`detail:`/`@` 前缀归一 `normalizedExactNeedles` `search.ts:1227`）、`filterMatch`（所有显式 filter 都命中且无文本 query）、`keywordMatchRate`（`directKeywordMatchRate` `search.ts:1250`，按 queryHits+keywordHits/分母，阈值 `KEYWORD_MATCH_THRESHOLD=0.5`）、`semanticMatchRate`（`directSemanticMatchRate` `search.ts:1262`，阈值 `SEMANTIC_MATCH_THRESHOLD=0.55`，且只有存在语义证据 `hasSemanticSearchEvidence` 时才算）。
- **low-information-intent 拦截**（`hasLowInformationIntent` `search.ts:1404`）：像「where do i start」「怎么办」这类低信息 query（正则表 `LOW_INFORMATION_QUERY_PATTERNS` `search.ts:1474` + 中英停用词表）直接判 `matched=[]`，不返回兜底候选。但 `hasMcpToolQualityIntent`（`search.ts:1420`，识别「MCP 四个工具 / 内容质量 / alembic_search 等」）会豁免这条拦截。
- `degradedReason`（`directSearchDegradedReason` `search.ts:1284`）把 zero-match / semantic 无证据 / below-threshold / 被 limit 省略等情况映射成人类可读原因；`laneEvidence`（`buildDirectSearchLaneEvidence` `search.ts:1318`）逐 lane 汇报 attempted/available/candidateCount/returnedCount/threshold。

**门禁语义**：semantic 模式若无 resident/local 语义或向量证据，Plugin **拒绝**用 keyword/filter 兜底（`directSearchDegradedReason` `search.ts:1297`），这是「不假装有语义能力」的诚实降级约束。

#### 5.3.4 resident/vector 证据的规整（诚实性透传）

大量辅助函数负责把 resident 向量遥测规整成不会误报「有语义」的形状：`normalizeResidentVectorTelemetry`（`search.ts:2090`）、`residentVectorUnavailableReason`（`search.ts:2171`，识别 empty-vector-index / sparse-only / unavailable）、`sanitizeResidentSearchMeta`（`search.ts:2279`，含 `projectScopeIdentity` 投影）、`sanitizeResidentVector`（`search.ts:2310`）、`vectorRerankEvidence`（`search.ts:2061`）、`vectorAvailable`/`vectorUsed`（`search.ts:2344/2349`）。核心不变量：向量不可用时把 `semanticUsed`/`vectorUsed`/`available` 全部压成 false，避免下游误信语义证据。

#### 5.3.5 详情/展开分支 `projectDetailOperation`

`projectDetailOperation`（`search.ts:874`）：不走检索引擎，改用 `knowledgeService`：`listKnowledgeEntries`（`search.ts:1482`）+ `getKnowledgeEntry`（`search.ts:1529`，用 `candidateDetailRefIds` `search.ts:2010` 枚举多种兼容 ref 形态逐个 `service.get`）。用 Core 的 `DefaultKnowledgeDetailProvider` + `DefaultContextExpansionProvider`（`get` 只解详情，`expand` 在 `contentCharLimit` 预算内展开）。找不到→`status='degraded'` + `search-detail-not-found` 诊断。

**与 Core 的消费点**：`@alembic/core/search`（groupByKind、slimSearchResult、SearchEngine）、`@alembic/core/vector`（RECIPE_SEMANTIC_REGION_METADATA_TYPE）、`@alembic/core/workspace`（resolveProjectRoot）、`#service/project-knowledge-context/index.js`（大量类型 + `createAlembicSearchMcpResult`/`defaultRefRegistry`/`Default*Provider`/`stableRefSegment`）、`#service/resident/*`（ResidentSearchClient 类型与请求形状）。

### 5.4 ProjectContext 导航 — `handlers/structure.ts`（graph）与 `handlers/recipe-map.ts`

这两个文件是「项目结构/Recipe 地图」导航面，都返回**有界 ProjectContext 区域**，refs 与彼此 round-trip。

#### 5.4.1 `graph()` — `structure.ts`

`graph()`（`structure.ts:185`）是 `alembic_graph` 唯一入口：`normalizeProjectGraphInput`（`structure.ts:210`）把公共 anchor 归一到 provider 字段（`filePath→activeFile`、`refId→nodeId`、`fromRefId/toRefId→fromId/toId`、`radius.maxDepth→maxDepth`），用 Core 的 `ProjectGraphInputSchema.parse` 校验，再交 `defaultProjectGraphProvider.resolveAlembicGraph`（`#service/project-knowledge-context`），最后 `createAlembicGraphMcpResult` 投影。

`graphQuery`/`graphImpact`/`graphPath`/`graphNeighborhood`/`graphStats`（`structure.ts:194-272`）是 stale-input 兼容 wrapper，只把旧 `operation` 塞进 args 后归一到 `queryKind`，不定义第二行为分支（注释 `structure.ts:191-193` 明说）。

模块服务缓存（`_getLoadedModuleService` `structure.ts:87`）：同一 projectRoot 在模块生命期内只 load 一次（`_moduleServiceCache` `structure.ts:85`）；`_resolveModuleService`（`structure.ts:106`）优先用 DI 的 `moduleService`，否则 new `ModuleService(projectRoot)`。`_inferTargetRole`（`structure.ts:140`）用正则把 target 名分类成 core/service/ui/networking/storage/... —— 这是一份 Plugin 侧的本地启发式表。

#### 5.4.2 `recipeMap()` — `recipe-map.ts`

`recipeMap()`（`recipe-map.ts:101`）是 `alembic_recipe_map` 入口（替代退役的 `alembic_project_matrix`）。文件头（`recipe-map.ts:1-8`）强约束：mounting 只读 Core RecipeContext 的 source-refs + metadata（**不做语义/关键词搜索**），且**从不调用另一个 MCP handler**。

- `normalizeRecipeMapRequest`（`recipe-map.ts:112`）：focus.kind 归一（合法集合 `RECIPE_MAP_FOCUS_KINDS = space/repo/map/module/file/symbol/anchor`，非法→`space`，`recipeMapFocusKind` `recipe-map.ts:145`），`recipeMountLimit`（clamp 0–200，默认 50）、`nodeLimit`（clamp 1–500，默认 60）、`detailLevel`（默认 summary）。
- `buildRecipeMapDeps`（`recipe-map.ts:159`）注入两个 dep：`resolveRegion`（Core `defaultProjectGraphProvider.resolveProjectContextRegion`）与 RecipeContext 的 `querySourceRefs`/`listRecipes`。RecipeContext 由 `buildRecipeContextService`（`recipe-map.ts:216`）从 DI 取 `knowledgeService`+`recipeSourceRefRepository`（缺任一→null 降级，返回带 `recipe-context-unavailable` 诊断的空 deps）+ 可选 `vectorService`（PDR-2b，让 region lane 生效），经 Core `createRecipeContextServiceFromCore` 构造。
- provider 用 Core `defaultRecipeMapProvider.resolveRecipeMap`（`#service/project-knowledge-context/recipe-map`），结果经 `attachRecipeMapCheckpointPosture`（`recipe-map.ts:282`）挂上 checkpoint 诊断（retrievalMayBeStale 时把 `status` 从 ready 降为 partial），再 `createAlembicRecipeMapMcpResult` 投影。

**与 Core 的消费点**：`@alembic/core/recipe-context-capabilities`（createRecipeContextServiceFromCore + 三个 RecipeContext 类型）、`#service/project-knowledge-context/*`（graph provider、recipe-map provider、结果投影、region focus 类型）。

### 5.5 Guard 审计 — `handlers/guard.ts`

`guard.ts` 是 `alembic_code_guard` 的真实执行落点（legacy `alembic_guard` 已删，MTC-7）。三个导出入口 + 一个项目扫描。

#### 5.5.1 引擎复用与 Enhancement 注入

- `_getOrCreateEngine`（`guard.ts:792`）：优先复用 DI 单例 `guardCheckEngine`（保持 externalRules/cache 跨调用一致），否则 `new GuardCheckEngine(db)`。`GuardCheckEngine` 从 `@alembic/core/guard` 动态 import。
- `_injectEnhancementGuardRules`（`guard.ts:810`）：幂等（`isEpInjected?()` 已注入则跳过），经 Core facade `resolveEnhancementGuardRules({frameworkAgnostic:true})` 只取「无框架条件」的通用增强规则注入引擎，静默失败。注释（`guard.ts:819-834`，RIC-2d）详细记录：框架相关的 pack（如 go-grpc）由 Bootstrap Phase 4 精确注入，通用集当前为空——与旧路径逐字节等价的历史包袱说明。

#### 5.5.2 三个模式

- `guardCheck`（`guard.ts:166`）：单文件内联检查。空 code 直接返回 `note:'Empty code — skipped'`。`detectLanguage(filePath)` 推断语言 → `engine.checkCode`。**SkillHooks 扩展点**：若 DI 有 `skillHooks` 且 `has('onGuardCheck')`，逐条 `run('onGuardCheck', violation, {language})` 允许 hook 改写 violation（`guard.ts:191-203`，best-effort）。language==='unknown' 追加 warning。
- `guardAuditFiles`（`guard.ts:227`）：批量文件审计（内部/非 public 面）。相对路径经 `resolveProjectRoot` 转绝对（避免 MCP 进程 cwd 不在项目目录），缺 content 从磁盘读，`LanguageService.isTestFile` 标 isTest。结果写 `violationsStore.appendRun` + `guardFeedbackLoop.processFixDetection`（Guard↔Recipe 闭环：检测修复自动确认使用，均 best-effort），并把 `capabilityReport.uncertainResults` 结构化上抛（`uncertainSummary` 按 layer/reason 分组）。
- `guardReview`（`guard.ts:330`）：**编码后质量门禁**，即 `alembic_code_guard` 的 review 模式，是最有状态的一个：
  1. **无参数即阻塞**（`guard.ts:335`）：不再自动读整个 git diff，返回 `blocked:true` + `GUARD_SCOPE_REQUIRED` + `legacyBoundary.noArgsWholeDiffDisabled`（历史包袱显式退役）。
  2. **review-round 状态机**（模块私有 `_reviewRounds` / `_lastReviewPassed` Map，键 projectRoot，`MAX_REVIEW_ROUNDS=5` `guard.ts:162-164`）：每次 +1，超上限→强制 `passed:true` + `maxRoundsReached:true`（防无限循环）。
  3. 逐文件 `engine.auditFile`（捕获 uncertain），violation 内联 recipe 修复指南——`_loadRuleRecipes`（`guard.ts:560`）预加载所有 rule recipe，构 `guardId→recipe(title/doClause/dontClause/coreCode)` 映射，`recipeMap.get(v.ruleId)` 贴到每条 violation。
  4. passed 时清 round，写 `violationsStore`，据 round 组消息（临近上限时提示「下一轮是最后一轮，将强制通过」）。

#### 5.5.3 项目扫描 `scanProject`

`scanProject`（`guard.ts:603`）：用 `ModuleService` 列 targets → 去重收集文件（可选 `includeContent`，按 `contentMaxLines` 截断）→ `engine.auditFiles` 全量审计 → 写 `violationsStore`。`meta.tool='alembic_bootstrap'`——说明它是 bootstrap 项目扫描语义的实现（与 host-agent bootstrap 冷启动是两个不同东西）。

**与 Core 的消费点**：`@alembic/core/guard`（GuardCheckEngine、detectLanguage、resolveEnhancementGuardRules）、`@alembic/core/shared`（LanguageService）、`@alembic/core/workspace`（resolveProjectRoot）、`#service/module/ModuleService.js`。

### 5.6 知识生命周期 — `handlers/knowledge.ts`

`knowledge.ts` 保留两个入口，注意大部分单条/批量提交逻辑已迁到 `tool-router.ts` 的统一管线（文件头 `knowledge.ts:1-4`）。

- `submitKnowledge`（`knowledge.ts:105`）：限流（`_checkRateLimit` `knowledge.ts:16`）→ `UnifiedValidator.validate(args, {skipUniqueness:true})`（Core 统一门控，**必须在 create 前**防不合格入库）→ `_enrichToV3`（`knowledge.ts:57`：归一 source、经 `recipeExtractor.extractFromContent` 补语义标签/category、`dimensionTags` 合并）→ `knowledgeService.create` → **create 后置** `service.updateQuality`（R9：QualityScorer 统一后置，避免双重评分，best-effort）。validation 结果转成 `recipeReadyHints`（ready/missingFields/suggestions）。
- `knowledgeLifecycle`（`knowledge.ts:171`）：`alembic_knowledge_lifecycle`（Admin 层）。**权限门**：`MCP_ALLOWED_LIFECYCLE_ACTIONS=new Set(['reactivate'])`（`knowledge.ts:169`），非 reactivate 抛 `PERMISSION_DENIED`（发布/废弃只能在 Dashboard，提交新知识用 submit_knowledge）。仅调 `service.reactivate`。

历史包袱注释（`knowledge.ts:203-204`）：`saveDocument` 已并入 submit_knowledge 统一管线、`_toReadinessInput` 已统一为 UnifiedValidator。

**与 Core 的消费点**：`@alembic/core/knowledge`（UnifiedValidator）、`@alembic/core/dimensions`（dimensionTags）、`@alembic/core/shared`（getDeveloperIdentity）、`@alembic/core/workspace`（resolveProjectRoot）；宿主 `normalizeHostAgentWriteSource`。

### 5.7 候选校验 / 知识整合

#### 5.7.1 `handlers/candidate.ts`

- `validateCandidate`（`candidate.ts:28`）：把 Agent 输入 candidate 逐块校验成 `{errors, warnings, suggestions}`。分组函数：核心字段（`addCoreFieldFindings` title 必需、strict 下 code 必需）、分类、文档、结构化内容、约束、reasoning（`addReasoningFindings` `candidate.ts:121`：reasoning 缺失/whyStandard 空/sources 空 → error；confidence 非 0–1 → warning）。`ok = errors.length===0`。纯本地校验，不落库。
- `checkDuplicate`（`candidate.ts:141`）：动态 import Core `findSimilarRecipes`（直接读磁盘 .md，不依赖 Repository），dataRoot 用 `resolveDataRoot ?? resolveProjectRoot`，默认 `threshold:0.7 / topK:5`。

注意（`candidate.ts:5-6`）：`submitSingle`/`submitBatch`/`submitDrafts` 已移至 V3 knowledge handlers。

#### 5.7.2 `handlers/consolidate.ts` — `alembic_consolidate`

`consolidateHandler`（`consolidate.ts:40`）处理 Agent 对 pendingSemanticReview 的决策（配合 5.2.4 的 nextAction）。空 decisions 直接 processed:0 返回。取 DI `evolutionGateway`（缺→`SERVICE_UNAVAILABLE`）。逐 decision 分支（state-machine）：

- `keep`（`consolidate.ts:82`）：无操作，`kept++`。
- `merge`（`consolidate.ts:89`）：缺 `mergeTargetId`→记 error。否则两步：Step1 `gateway.submit({action:'update'})` 把合并内容注入目标 Recipe（含 `mergeStrategy` 默认 complement + agentReasoning）；Step2 若无 error 再 `gateway.submit({action:'deprecate', replacedByRecipeId})` 废弃新 Recipe，`merged++`。
- `reject`（`consolidate.ts:145`）：直接 `gateway.submit({action:'deprecate'})` 废弃新 Recipe，`rejected++`。

每条捕获异常记入 `result.errors`。`success = !hasErrors || processed > errors.length`（部分成功也算 true）。

**与 Core 的消费点**：`@alembic/core/evolution`（EvolutionGateway 类型）、`#inject/ServiceContainer.js`、`#shared/schemas/mcp-tools.js`（ConsolidateInput，Zod schema）。

### 5.8 检索新鲜度诊断 — `handlers/retrieval-checkpoint-diagnostics.ts`

`buildRetrievalCheckpointPosture`（`retrieval-checkpoint-diagnostics.ts:47`）是 **search / recipe_map / prime 三处共享**的横切诊断器，读「durable git diff checkpoint」判断检索是否可能陈旧：

- 取 DI `gitDiffCheckpointRepository`（缺/无 `get`→`emptyPosture('unavailable')`）。scope 由 `buildPluginGitDiffCheckpointScope`（`#recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.js`）构。
- `readCurrentGitHead`（`retrieval-checkpoint-diagnostics.ts:182`）用 `execFileSync('git', ['rev-parse','HEAD'], {cwd:projectRoot})` 读当前 HEAD（失败静默）。
- 判定 `retrievalMayBeStale` 的四个触发点（各配一条 diagnostic）：HEAD 不可解析、无 checkpointCommit baseline、`checkpointCommit !== head`（落后需 catch-up）、`lastRouteStatus ∈ {failed,truncated,non-ancestor,unresolved}`（`INCOMPLETE_ROUTE_STATUSES` `retrieval-checkpoint-diagnostics.ts:45`）。
- stale 时 `nextActions` 固定给出 `alembic_rescan`（required:true）——即：先 rescan 路由 checkpoint 再信任检索新鲜度。

这是把「代码已 commit 但知识库未 rescan」这一断路点变成可见诊断的机制，三个检索/导航工具都会因此把 status 降级并提示 rescan。

### 5.9 Recipe 内容质量门 — `handlers/recipe-content-quality-gate.ts`

`validateSubmitKnowledgeContentQuality`（`recipe-content-quality-gate.ts:32`）是 submit_knowledge 的 stage-1 内容质量门。**P1.1 re-point（CG-3，byte-identical）后本文件不再内联校验逻辑**，而是委托 Core 权威 `RecipeAuthoringSpec` 的 `validateAgainst(items, {stage:1, path:'host-cold-start'})`（`@alembic/core/knowledge`）。文件头注释（`recipe-content-quality-gate.ts:1-6`）明确：Core 里的常量/谓词（verb Sets、`NON_ENGLISH_SCRIPT_RE`、`FIRST_WORD_RE`、`hasMarkerExample`、✅/❌ 阈值）是 P0 从本文件原样搬运的副本，「搬运而非重写」保证输出逐字节一致，golden-corpus 快照 re-point 后必须保持绿色。

违规码类型 `RecipeContentQualityViolationCode`（`recipe-content-quality-gate.ts:9`）：`DO_CLAUSE_*` / `DONT_CLAUSE_*`（REQUIRED/NON_ENGLISH/NON_IMPERATIVE）+ `CONTENT_MARKDOWN_REQUIRED` + `CONTENT_CONTRAST_MISSING`。Core 返回的 `field:string` 在此 cast 回更窄的本地联合类型（仅满足 TS，不改字节，注释 `recipe-content-quality-gate.ts:35-37`）。

### 5.10 系统状态 — `handlers/system.ts`

`status()`（`system.ts:16`）是 `alembic_status`（MTC-4：由 health 改名，是合并工具的 resident 半边）。可选 `aspect` 窄化视图：

- 探测：`knowledgeRepository.getStats()`（→ `checks.database=true` + knowledgeBase 统计）、`vectorStore.getStats()`（→ `checks.vectorStore` + vectorIndex.documentCount，`resolveVectorDocumentCount` `system.ts:150` 兼容多字段名）。异常收进 `issues`。
- AI provider 信息固定为「Plugin 不再维护第三方 AI Provider 配置」（`aiInfo` `system.ts:23`，`pluginConfigRemoved:true`，只表达边界不做 key 探测）。
- 版本从 `PACKAGE_ROOT/package.json`（`#shared/package-assets.js`）读并缓存 `_pkgVersion`（不依赖 cwd）。
- `actionHints`（`system.ts:92`）：DB 不可用时提示「不影响冷启动，bootstrap 纯文件系统分析」；知识库为空时给出冷启动三步引导（bootstrap → 按维度分析 → dimension_complete）。
- `overallStatus = checks.database ? 'ok' : 'degraded'`（DB 是唯一硬依赖）。
- `aspect==='knowledge'` 只返 knowledgeBase 块；`'runtime'` 返 runtimeView（含 services 列表 + session 摘要）；省略返全量（保留 legacy alembic_health 输出形状，注释 `system.ts:129-130`）。

### 5.11 Agent 公共工具 — `handlers/agent-public-tools.ts`

`agent-public-tools.ts`（2436 行）承载 `alembic_prime` / `alembic_work`(start/finish) / `alembic_code_guard` 的 Agent-facing 契约层。所有出口经 `createAgentPublicToolOutput` + `createAgentPublicToolResultEnvelope`（`lib/runtime/mcp/public-tools/index.js`）产出「clean output contract」结果。

#### 5.11.1 `primeHandler` — `alembic_prime`

`primeHandler`（`agent-public-tools.ts:205`）：

1. `buildPrimeToolContext`（`agent-public-tools.ts:975`）：构 slim intake（agentHost/inputSource/sourceRefs/lifecycle）。**双宿主锚定**（DH-7/RC-1，`resolveDefaultAgentHost` `agent-public-tools.ts:951`）：默认 agentHost 从 `resolveHostRuntimeContext().pluginHost` 读——codex runtime→'codex'、cc runtime→'claude-code'，替代旧硬编码 'codex'；host 选择仍在 L3，此处只 READ。
2. **阻塞判定** `resolvePrimeBlockingReason`（`agent-public-tools.ts:1091`）：`obsoletePrimeInputFields`（intentRef/recognizedIntent/query/hostDeclaredIntent 是退役输入 → `obsolete-prime-intent-input`）、缺必需 standalone frame（taskAction+requirementGoal+≥1 locator facet → `missing-required-intent`）、automation-envelope 无 sourceRefs（→ `missing-referenced-docs`）。阻塞走 `buildPrimeBlockingOutput`。
3. **检索** `runPrimeSearch`（`agent-public-tools.ts:1152`）：先 `resolvePrimeSkipBeforeRetrieval`（各种 skip：mechanical-envelope / low-information / non-code / status-only 等一大套启发式判定 `agent-public-tools.ts:1459-1587`）；不 skip 则取 DI `primeSearchPipeline.search`（结构化 query → 统一向量检索，同 alembic_search 引擎，PDR-1d/PDR-2b），并叠加 `queryPrimeRegionEvidence`（`agent-public-tools.ts:1315`，`vectorService.hybridSearch` 打 `RECIPE_SEMANTIC_REGION_METADATA_TYPE`，`mapRegionHitsToPrimeEvidence` 按 recipeId 分组投影）与 fallback `queryPrimeSourceRefLocatorEvidence`（`agent-public-tools.ts:1207`，向量空时用显式 sourceRefs 精确匹配 Recipe 落点做 locator 证据）。
4. **状态解析** `resolvePrimeStatus`（`agent-public-tools.ts:1611`）是 prime 的核心状态机：skippedReason → skipped；checkpoint stale → degraded；retrievalConsumer.producerContract 不可用 → degraded（区分 resident-unavailable / 缺 Stage 1A 字段）；searchDegraded → degraded；material.status degraded → degraded；有 accepted 知识/guard → ready；否则 knowledge-empty degraded。
5. `buildPrimeReadyOutput`（`agent-public-tools.ts:300`）组装 `PrimePublicPackage`（`buildPrimePublicPackage` `agent-public-tools.ts:2032`）：compact 化 acceptedKnowledge/acceptedGuards（各截 8 条）、trustPosture（分层 receiptChecklist）、trustReceipt、projectContextGuidance（推荐 alembic_recipe_map/alembic_graph）、`buildPrimeProducerBoundary`（`agent-public-tools.ts:2243`：声明 lexical/vector/trace 等 producer-only 字段属 Alembic resident producer，Plugin 只透传不合成——`pluginSynthesized:false`）。host-neutral 化文本（`hostNeutralPrimeText` `agent-public-tools.ts:2119` 把 Codex/Claude 替换成 host agent）。

#### 5.11.2 `alembic_work` — start / finish（Plugin 本地 workRef 状态）

- `workStartHandler`（`agent-public-tools.ts:491`）：`resolveWorkStartStatus`（`agent-public-tools.ts:1729`）判 skip（automation-envelope 无 sourceRefs / status-only / 无 work-scope）。ready 时 `nextWorkRef()` 生成 workRef，构 `WorkRecord`（scopeFiles 经 `normalizeTaskLifecycleFileRefs` 归一）存入模块级 `WORK_RECORDS` Map（`rememberWorkRecord` `agent-public-tools.ts:1981`，LRU 上限 100 条）。
- `workFinishHandler`（`agent-public-tools.ts:579`）：`args.workRef` 不存在或无对应 record → `missing-work-ref` blocked。否则合并 changedFiles 进 record.scopeFiles，`decideGuardTrigger`（`#service/task/TaskLifecyclePolicy.js`）产出 guard 建议（`buildGuardRecommendation` `agent-public-tools.ts:1789`：run 时给 files，skip 时给 reasonCode；validationPlan 经 `projectValidationPlanAdvisory` 投影成 advisory buckets）。outcome 默认 completed。

**边界坑**：workRef 是 Plugin 进程内内存态（Map），跨进程/重启不持久；`buildMissingWorkRefGuardOutput`（`agent-public-tools.ts:749`）明说「workRef 在本 Plugin session 不 active」。

#### 5.11.3 `codeGuardHandler` — Agent 面的 `alembic_code_guard`

`codeGuardHandler`（`agent-public-tools.ts:681`）是 5.5 guard 的 Agent 契约包装：

- `resolveCodeGuardScope`（`agent-public-tools.ts:701`）：优先 inline code → 显式 files → workRef 关联的 scopeFiles。收集 `unsupportedScopeFields`（diffRef/primeRef/acceptedGuards/applicableRecipe，`agent-public-tools.ts:1927`，public 契约忽略但回报）。
- `buildCodeGuardPreflightOutput`（`agent-public-tools.ts:725`）四种前置阻塞/跳过：workRef 无 record（blocked missing-work-ref）、workRef 有 record 但无文件（skipped no-code-scope）、完全无 scope（blocked missing-guard-scope）。
- `executeScopedCodeGuard`（`agent-public-tools.ts:849`）：有 code → `guardHandlers.guardCheck`，否则 → `guardHandlers.guardReview({files})`——**Agent 面复用 5.5 的内部实现**。结果经 `projectGuardBusinessPayload`（`agent-public-tools.ts:1907`）抽出业务 payload（ok/guardErrorCode/summary/guardResult）。

**与 Core / service 的消费点**：`@alembic/core/recipe-context-capabilities`、`@alembic/core/vector`、`@alembic/core/workspace`；`#codex/runtime/RuntimeContext.js`（resolveHostRuntimeContext，双宿主）、`#service/task/*`（host-turn-meta、PrimeKnowledgeMaterial、PrimeSearchPipeline、TaskLifecyclePolicy）、`lib/runtime/mcp/public-tools/*`（结果契约与工厂）。

### 5.12 Host-Agent 冷启动 / 进化入口 — `handlers/host-agent/*`

这四个文件把 host-agent（Codex/CC 宿主 Agent，非 in-process AI）驱动的冷启动/重扫/进化/维度完成对接到 `#recipe-generation/host-agent-workflows/*` 与 Core。前三个偏 adapter，`evolve.ts` 是重实现。

- `host-agent/bootstrap.ts`（薄 re-export）：从 `#recipe-generation/host-agent-workflows/project-index.js` re-export `getActiveSession`、`runHostAgentColdStartWorkflow as bootstrapForHostAgent`、`runProjectIndexWorkflow`。文件头（`bootstrap.ts:1-6`）说明：Core workflow primitives 在 Core，本 wrapper 只 owns Plugin 传输清理与 MCP 响应整形。这是 `alembic_bootstrap`（host-agent 冷启动语义，注意与 5.5.3 `scanProject` 的项目扫描语义同名但不同）的入口。
- `host-agent/rescan.ts`（薄 re-export）：re-export `runHostAgentKnowledgeRescanWorkflow as rescanForHostAgent` + `runProjectIndexWorkflow`。`alembic_rescan` 入口。**双宿主统一编排**：两者都指向同一个 `project-index.js` 的 `runProjectIndexWorkflow`（mode 轴在 orchestrator 之上靠动态 import 隐式编码）。
- `host-agent/dimension-completion.ts`（薄 adapter）：`dimensionComplete`（`dimension-completion.ts:15`）= `envelope(await runHostAgentDimensionCompletionWorkflow(ctx, args))`。文件头说明：host-agnostic workflow state 在 Core，本 Plugin wrapper 加 MCP envelope 行为与 Codex-facing 完成副作用。`alembic_dimension_complete` 入口。
- `host-agent/evolve.ts`（重实现）：`evolveForHostAgent`（`evolve.ts:60`）是 `alembic_evolve` 批量 Recipe 进化决策，全部经 DI `evolutionGateway` 提交。逐 decision state-machine（`processEvolveDecision` `evolve.ts:130`）：
  - `propose_evolution`（`evolve.ts:163`）：缺 evidence 记 error；`normalizeSuggestedChangesPatch`（`evolve.ts:218`）把 suggestedChanges 归一成 `StructuredPatch`（非结构化 JSON 时包成 `content.markdown` append 的 host-agent evidence block `buildHostAgentEvolutionEvidenceBlock` `evolve.ts:246`），`gateway.submit({action:'update', source:HOST_AGENT_SOURCE, evidence:[...]})`；outcome `proposal-created`/`proposal-upgraded` → `proposed++`。
  - `confirm_deprecation`（`evolve.ts:264`）：`gateway.submit({action:'deprecate'})`；outcome `immediately-executed` 或 `proposal-created` → `deprecated++` + `quotaChange.freed++`。
  - `skip`（`evolve.ts:305`）：`skipReason==='still_valid'` → `gateway.submit({action:'valid'})`，outcome `verified` → `refreshed++`；否则记 skipped。
  - `attachFreshness`（`evolve.ts:336`）：对 verified/deprecated 的 recipeIds `refreshRecipeFreshnessByIds` + 对 proposal-only 的 `skippedRecipe`，`mergeFreshnessOutputs` 合并成 `result.freshness` + `retrievalMayBeStale`。

  **与 Core 的消费点**：`@alembic/core/evolution`（EvolutionGateway）、`@alembic/core/shared`（HOST_AGENT_SOURCE）、`@alembic/core/types`（StructuredPatch）；`#codex/mcp/envelope.js`（注意这里用 `#codex/*` 别名，当前解析到 `lib/runtime/*`）、`#service/knowledge/RecipeFreshnessRuntime.js`。

### 5.13 纯 Core re-export 适配点

两个文件是零逻辑的 Core 能力 re-export，仅作为 Plugin 内的稳定 import 面：

- `handlers/TargetClassifier.ts`（`TargetClassifier.ts:1`）：`export { inferFilePriority, inferTargetRole } from '@alembic/core/host-agent-workflows'`。
- `handlers/evolution-prescreen.ts`（`evolution-prescreen.ts:1-7`）：re-export `DimensionGapInfo`/`EvolutionPrescreen`/`PrescreenAutoResolved`/`PrescreenNeedsVerification` 类型与 `buildEvolutionPrescreen` from `@alembic/core/host-agent-workflows`。

这两处印证了 CLAUDE.md 的 Core 接入规则：共享能力经 `@alembic/core` 子路径消费，Plugin 侧只留 MCP/adapter 面。

### 5.14 跨层边界、坑与历史包袱小结

- **DI 降级无处不在**：`optionalContainerService`/`safeContainerGet`/`safeGet` 全部 try/catch 返回 null，任一服务缺失都走文档化降级路径（返回带 reason 的诊断而非崩溃）。这是「轻量 MCP context」也能跑的前提。
- **门禁前不落库**：submit_knowledge 的内容质量门（5.9）与证据门（5.2.2 步 7）都在 gateway.create 之前 early-return，符合「拒绝时不建任何记录」。
- **不猜测**：pendingSemanticReview 缺 recipeId 时进 `nextActionBlocked` 而非编造 ID（`tool-router.ts:688`）；semantic 无证据时拒绝 keyword 兜底（`search.ts:1297`）；prime producer-only 字段只透传不合成（`agent-public-tools.ts:2277`）。
- **诚实降级透传**：freshness/checkpoint/vector 任一降级都把 `retrievalMayBeStale=true` 并给出 `alembic_rescan` next-action，贯穿 search/recipe_map/prime。
- **退役面清晰标注**：`alembic_knowledge`/`structure`/`call_context`（MTC-1）、legacy `alembic_guard`（MTC-7）、no-args whole-diff review、`saveDocument`、intent-frame 层（PDR-1d）等均以注释保留删除边界。
- **内存态 workRef**：`WORK_RECORDS`（LRU 100）与 guard review-round Map 都是 Plugin 进程内状态，不跨进程持久，跨会话不可依赖。
- **同名不同义**：`alembic_bootstrap` 在注册表指 host-agent 冷启动（`bootstrap.ts`），而 `guard.ts:scanProject` 的 `meta.tool='alembic_bootstrap'` 指项目扫描——阅读响应 meta 时需注意语义来源。
- **byte-identical 约束**：`recipe-content-quality-gate.ts` re-point 到 Core 后必须与旧 inline 实现逐字节一致（golden-corpus 快照守护）。


---

## 6. 宿主适配与运行态上下文层

本节测绘 `alembic-codex-plugin-runtime` 的「宿主适配与运行态上下文层」。这一层是插件 runtime 与外部宿主（Codex CLI、Claude Code）之间的接缝：它把「同一份进程内 MCP runtime + `@alembic/core` 共享内核」适配到两种物理插件壳（Codex shell / Claude Code shell），并向工具执行链路提供运行态身份、项目根信任、知识状态、工具可见性、门禁与降级边界。

本层没有常驻进程（PDR-3 之后 daemon HTTP 表面已删除），是纯非常驻 MCP 进程；所有「daemon 状态」在运行时被解析为 daemon-less 的 `stopped`/`null` 值，仅作为下游消费者类型的占位（见 6.11、6.12）。

### 6.0 分层与总体数据流

代码注释里反复出现「5 层架构 L0..L4」与「双宿主 DH-0..DH-4 / RC-1..RC-3」标记。落到本节的关键分层规则是：

- **host-name 分支只允许落在 L3 的两处**：`resolveHostAdapter()` 与 `hostAdapterForShape()`（`lib/runtime/host-adapter/resolveHostAdapter.ts:16` / `:26`）。其余各层只经 `HostAdapter` 契约或经由「物理 shell 形态」派生值消费宿主差异，不得自带 `if host === 'codex'` 分支。
- **依赖单向 L4→L3→L2→L1→L0**。L3 的 `HostAdapter` 接口（`lib/runtime/host-adapter/HostAdapter.ts:44`）是 host-agnostic 契约；两个具体实现委托 L1 的 shape-aware 共享函数（`RuntimeContext.ts` / `ProjectRootResolver.ts`）。
- 「host identity」的权威来源是**物理 shell 形态**（`detectPluginHostShape`，`RuntimeContext.ts:103`），而不是 env。env（`ALEMBIC_PLUGIN_HOST`）只是回退兜底，未显式声明时按 shell 形态派生。

一次 Codex/Claude Code 侧工具调用穿过本层的典型数据流（谁调用谁）：

```
宿主 MCP 客户端 (Codex/Claude Code)
  → HostMcpServer / McpServer 编排 (sec-05，非本节)
    → resolveHostAdapter(env)                         [L3 选 adapter]
      → adapter.resolveProjectRoot()                  [ProjectRootResolver: 候选+信任]
    → resolveProjectRootScope(tool,args)              [projectRoot arg 覆盖 & 信任]
    → getVisibleTools()/resolveToolPolicy()           [ToolPolicy: 按知识状态+tier 过滤]
    → preflightTool()                                 [Preflight: 门禁/自动 init 决策]
    → EmbeddedToolExecutor.execute()                  [进程内执行本地工具树]
      → EmbeddedMcpServer._executeMcpHandler()        [sec-05 handler tree]
    → attachServiceBoundary/attachExecutionContext    [results: 回填运行态]
    → maybeRunStagingAccessSweep()                    [tick-on-access 生命周期驱动]
    → attachPluginOpportunisticEvolutionSurface()     [commit-driven 维护 surface]
  → buildStatus()/buildRuntimeDiagnostics()           [status/onboarding/diagnostics]
    → buildStatusOnboardingContract()                 [bootstrapState/gates/repairState]
```

对 `@alembic/core` 的消费全部经包子路径入口（禁止绕过引用 Core 源码），本节各文件用到的子路径见 6.14。

---

### 6.1 L3 HostAdapter 契约与双宿主实现（host-adapter/）

#### 6.1.1 HostAdapter 接口（`lib/runtime/host-adapter/HostAdapter.ts`）

`HostAdapter`（`HostAdapter.ts:44`）是本层唯一的「宿主抽象契约」，集中所有真正 host-specific 的「工作区身份簇」操作。设计模式：**Adapter**（把宿主差异收敛到一个统一接口）+ **Strategy**（两个实现按 shell 形态择一）。

接口成员分四类：

- **静态身份/能力标识**：
  - `hostId: string`（`:46`）——`codex` 或 `claude-code`。
  - `setupProfile: string`（`:48`）——init-marker 元数据写入的 setup profile 标识。
  - `allowsEmptyPluginAssets: boolean`（`:54`）——「插件资产为空」是否算健康。Codex shell 的 manifest 要求 marketplace interface 资产（空=缺失）；Claude Code spec-form manifest 无 interface 块，空资产即正确健康态（F-V2-2）。诊断层据此裁定资产健康，替代散在诊断层的 hostShape 分支（见 6.13）。
- **运行时 env / 身份**：
  - `ensureRuntimeEnvironment(env?)`（`:58`）——设置插件运行时 env 默认（runtime mode / host 标识 / MCP 模式 / tier）。
  - `resolveRuntimeContext(env?): HostRuntimeContext`（`:60`）——由 env + 物理 shell 形态解析运行态上下文。
- **项目根解析 / 信任**：
  - `resolveProjectRoot(options?): ProjectRootResolution`（`:64`）——从宿主 env 源（`ALEMBIC_PROJECT_DIR` / 工作区 env / cwd 回退）解析并校验项目根。
- **saved-root / init-marker 持久化 + per-host 清单布局**：
  - `readSavedProjectRoot` / `writeSavedProjectRoot`（`:68`/`:70`）——saved project root 诊断/恢复标记（非有效身份来源）。
  - `readInitMarker` / `writeInitMarker` / `initMarkerPath`（`:72`/`:74`/`:76`）——per-project init marker 读写与路径。
  - `pluginMcpManifestPath(pluginRoot)`（`:81`）——MCP 声明清单路径（codex：`.mcp.json`；cc：内联于 `.claude-plugin/plugin.json`）。
  - `pluginManifestPath(pluginRoot)`（`:83`）——插件清单路径（codex：`.codex-plugin/plugin.json`；cc：`.claude-plugin/plugin.json`）。
  - `normalizePluginMcpArg(arg)`（`:85`）——归一化 MCP arg（cc 把 `${CLAUDE_PLUGIN_ROOT}` 归一为 `.`；codex 原样）。

辅助类型 `HostInitMarkerInput`（`:14`）用 `Omit` 剥掉系统字段（dataRoot/ghost/initializedAt/pluginVersion/profile/projectRoot/schemaVersion），调用方只提供 `initializedBy` / `route` / `results` / `requestedTool`，其余由实现按宿主工作区解析后填充。

接口注释明确划界（`:38-42`）：MCP server 生命周期（start/shutdown/handleToolCall）、tool execution context、workspace init 编排在现实里是 host-agnostic（codex/cc 同走 stdio + 同一 MCP SDK），**不纳入 L3**——它们消费本契约的产物（`HostRuntimeContext` / projectRoot），而非契约本身。

#### 6.1.2 CodexHostAdapter（`lib/runtime/host-adapter/CodexHostAdapter.ts`）

`CodexHostAdapter`（`CodexHostAdapter.ts:31`）实现 `HostAdapter`：
- `hostId = CODEX_PLUGIN_HOST`（'codex'），`setupProfile = CODEX_SETUP_PROFILE`（'codex-plugin'），`allowsEmptyPluginAssets = false`（`:32-35`）。
- 工作区身份簇方法（`ensureRuntimeEnvironment` / `resolveRuntimeContext` / `resolveProjectRoot` / saved-root / init-marker）全部**委托** L1 的 host-agnostic 共享实现（`ProjectRootResolver` + `RuntimeContext`）。注释（`:24-29`）说明：这些函数 shape-aware、函数体零 host-name 分支，cc/codex 共享同一份——委托是合法 L3→L1 分层（DH-3g 据 Design 裁决否决物理迁入、并对该簇 de-Codex 去前缀）。
- 真正的 codex 专属面仅：`pluginMcpManifestPath`→`.mcp.json`（`:69`），`pluginManifestPath`→`.codex-plugin/plugin.json`（`:73`），`normalizePluginMcpArg`→恒等（`:77`）。
- 进程内单例 `CODEX_HOST_ADAPTER`（`:83`）。

#### 6.1.3 ClaudeCodeHostAdapter（`lib/runtime/host-adapter/ClaudeCodeHostAdapter.ts`）

`ClaudeCodeHostAdapter`（`ClaudeCodeHostAdapter.ts:37`）与 Codex 实现结构对称：
- `hostId = CLAUDE_CODE_PLUGIN_HOST`（'claude-code'）。
- `setupProfile` **暂复用** `CODEX_SETUP_PROFILE`（`:41`）——注释解释这是历史包袱：init-marker 的 `profile` 字段类型锁定 `typeof CODEX_SETUP_PROFILE`，独立 cc profile 需同步 `SetupService`，属 DH-4 待办的 per-host 产物。
- `allowsEmptyPluginAssets = true`（`:43`）——cc spec-form manifest 无 interface 块，空资产即健康。
- 身份簇方法同样委托 L1 共享函数（`:45-75`）。注释（`:23-35`）指出：cc 与 codex 的工作区身份簇绝大部分共享 host-agnostic 实现；真正的 cc 专属差异是 ①hostId=claude-code + ②项目根信任 `CLAUDE_PROJECT_DIR`（cc 工作区不再 fail-closed，见 6.9）+ ③由 `resolveHostAdapter` 按 shell 形态选中本实现。
- cc 清单路径统一为 `.claude-plugin/plugin.json`（MCP 声明内联，`:77`/`:81`）；`normalizePluginMcpArg` 把 `${CLAUDE_PLUGIN_ROOT}` 替换为 `.`（`:85`）。
- 进程内单例 `CLAUDE_CODE_HOST_ADAPTER`（`:91`）。
- 关键不变量注释（`:35`）：本类不引入常驻进程（守「纯 MCP 非强进程」不变量）。cluster 5（静态 tool list）/6（无 host introspection→自生成）/8（无 turn-meta）的 cc 优雅降级细化仍是 DH-3b/DH-4 待办。

#### 6.1.4 resolveHostAdapter — L3 唯一 host-name 分支（`resolveHostAdapter.ts`）

这是**整个 5 层架构里唯一允许 host-name 分支的地方**（工厂/Strategy 选择点）：

- `resolveHostAdapter(env = process.env)`（`resolveHostAdapter.ts:16`）：
  取 `resolveHostRuntimeContext(env).expectedPluginHost`（由 `detectPluginHostShape` 从 shell 派生，不依赖 env，故可在 `ensureRuntimeEnvironment` 之前调用），`expectedHost === CLAUDE_CODE_PLUGIN_HOST` 则返回 cc adapter，否则返回 codex adapter。codex shell 恒选 `CodexHostAdapter`（行为逐行不变）。
- `hostAdapterForShape(hostShape)`（`:26`）：当调用方已持有物理 shell 形态（如诊断里的 `registry.plugin.hostShape`）时按形态直接选 adapter。与 `resolveHostAdapter` 同属 L3 唯一 host-name 分支，让上层（`PluginRegistry`、`Diagnostics`）经此取 adapter 能力、不再在 L2/诊断层自带 hostShape 分支。

上层（bin / HostMcpServer / L2 / project-root-scope / tool-visibility / StatusService / Diagnostics）**只经这两个工厂取 adapter**。

---

### 6.2 RuntimeContext — L1 运行态身份与 shell 形态探测（`runtime/RuntimeContext.ts`）

`RuntimeContext.ts` 是本层的常量 + 身份派生中心，被 L3 adapter 与几乎所有下游模块消费。

**关键常量**（`:5-26`）：`CODEX_PLUGIN_NAME='alembic'`、`CODEX_PLUGIN_SHELL_DIR='alembic-codex'`（壳目录保留 host-descriptive 名，只有 distribution identity 统一为 alembic）、`CODEX_RUNTIME_PACKAGE='@gxfn/alembic-runtime'`、`CODEX_RUNTIME_BIN='alembic-codex-mcp'`、`CODEX_SETUP_PROFILE='codex-plugin'`、`DEFAULT_MCP_TIER='agent'`、`CODEX_PLUGIN_HOST='codex'`、`CLAUDE_CODE_PLUGIN_HOST='claude-code'`（RC-1 对称标识）、`CODEX_EMBEDDED_RUNTIME_SPECIFIER='@gxfn/alembic-runtime@0.2.0'`。env 名常量：`ALEMBIC_RUNTIME_MODE`、`ALEMBIC_PLUGIN_HOST`、`ALEMBIC_MCP_MODE`、`ALEMBIC_CODEX_MCP_MODE`、`ALEMBIC_MCP_TIER`、`ALEMBIC_CODEX_ENABLE_ADMIN`、`ALEMBIC_CODEX_PLUGIN_ROOT`。

**`HostRuntimeContext` 接口**（`:28`）：承载运行态身份的不可变快照——`pluginHost` / `expectedPluginHost`（实际 vs 期望 host）、`runtimeMode` / `expectedRuntimeMode`、`requestedTier` / `effectiveTier` / `defaultTier`、`adminEnabled`、`packageRoot` / `packageVersion` / `pluginRoot` / `marketplacePath`、`runtimeBin` / `runtimePackage`、`embeddedRuntimeSpecifier` / `pinnedRuntimeSpecifier`。

**`ensureRuntimeEnvironment(env)`**（`:47`）：幂等设置 env 默认——`ALEMBIC_RUNTIME_MODE` 默认 `plugin`；`ALEMBIC_PLUGIN_HOST` 未显式声明时按物理 shell 形态回退（`derivePluginHostFromShape(detectPluginHostShape(...))`），不再硬编码 codex（RC-1），env 已声明时短路不触发 shell 探测；强制 `ALEMBIC_MCP_MODE=1`、`ALEMBIC_CODEX_MCP_MODE=1`；tier 默认 `agent`。

**`resolveHostRuntimeContext(env)`**（`:59`）：构造 `HostRuntimeContext`——
- `effectiveTier` 经 `resolveEffectiveTier(requestedTier, adminEnabled)`（`:119`）：`admin` tier 但未开 admin 时降级为 `agent`（tier 门禁降级路径）。
- `pluginRoot` 经 `resolveCodexPluginRoot(env)`（`:92`）：优先 `ALEMBIC_CODEX_PLUGIN_ROOT` env（相对路径 resolve 到 cwd），否则 `PACKAGE_ROOT/plugins/alembic-codex`。
- `expectedPluginHost` 与 `pluginHost` 回退均由 `derivePluginHostFromShape(detectPluginHostShape(pluginRoot))` 派生（RC-1，取代恒为 codex 的硬编码），使诊断按真实 shell 校验运行时 host。`pluginHost` 实际值取 `normalizeRuntimeIdentity(env[ALEMBIC_PLUGIN_HOST])` 或回退 `expectedPluginHost`。

**shell 形态探测（host identity 权威来源）** `detectPluginHostShape(pluginRoot)`（`:103`）：
- codex shell 旁挂 `.mcp.json`；cc shell 把 `mcpServers` 内联进 `.claude-plugin/plugin.json` 且无 `.mcp.json`。
- 判定：**仅当「无 `.mcp.json` 且存在 cc manifest」判为 `claude-code`**；其余（含两者皆缺的 fallback）保持历史 `codex` 形态（保守，避免改变既有 Codex 行为）。
- `PluginRegistry` 复用同一探测（`RuntimeContext.ts:102` 注释），避免两处形态判定漂移。
- `derivePluginHostFromShape`（`:115`）把 shell 形态映射到 host 标识字符串。

设计模式：**Factory + Strategy**（形态探测→身份派生）；`ensureRuntimeEnvironment` 是 **idempotent bootstrapping**。

---

### 6.3 EmbeddedRuntimeContract — 嵌入 runtime 契约（`runtime/EmbeddedRuntimeContract.ts`）

极小的常量契约（`EmbeddedRuntimeContract.ts:1`）：
- `EMBEDDED_RUNTIME_REQUIRED_FILES`：portable runtime 快照必须存在的文件（`dist/bin/host-mcp.js`、`dist/lib/runtime/mcp/HostMcpServer.js`、`.alembic-runtime-boundary.json`）。诊断层与 `ModuleBoundary` 消费它校验嵌入 runtime 完整性。
- `EMBEDDED_RUNTIME_REQUIRED_ROUTES = []`（`:9`）：PDR-3 之后 embedded daemon HTTP 表面删除，插件是纯非常驻 MCP 进程，无必需 daemon HTTP 路由。这是「daemon 已删」这一历史包袱在契约层的落点。

---

### 6.4 ProjectRuntimeContext — 统一运行态身份/服务就绪投影（`runtime/ProjectRuntimeContext.ts`）

这是本层最大的运行态聚合器（`ProjectRuntimeContext.ts`，约 660 行）。职责：把「项目身份 + 各必需服务就绪度 + fallback 隔离策略 + MCP 入口模式」聚合成一个可回填给工具响应的 `ProjectRuntimeContext`。

#### 6.4.1 契约与 fallback 隔离策略

- `ProjectRuntimeContext` 接口（`:33`）：`identity`（`ProjectRuntimeIdentityContract`，来自 Core）、`requiredServices`（就绪度数组）、`readinessState`（`ready`/`degraded`/`blocked`）、`failureEnvelopes`、`entryMode`、`sourceOfTruth`、`sourcePolicy`、`blockedFallbacks`、`fallbackIsolation`。
- `sourcePolicy`（`:43`）固化了一组**不可越权的策略常量**：`effectiveIdentitySource: 'codex-current-project'`、`selectedOrActiveCanOverrideEffectiveIdentity: false`——即「Alembic 全局 selected/active 运行时状态不能覆盖 Codex 当前项目身份」。
- `RUNTIME_FALLBACK_ISOLATION`（`:73`）：4 条 fallback 隔离记录（saved-project-root / runtime-control-selected-active / local-jobstore / embedded-plugin-owned-runtime），每条声明 `effectiveIdentityAllowed:false` + `persistenceRootAllowed:false` + 具体 `allowedUse` + `legacyEffectiveIdentityFallback`。这是「哪些状态是只读诊断/恢复上下文、绝不作有效身份或持久化根」的边界表。`getRuntimeFallbackIsolation(id)`（`:112`）按 id 取（未知 id throw）。设计模式：**policy table / registry**。

#### 6.4.2 主构造函数 `buildProjectRuntimeContext`（`:178`）

数据流：
1. `resolveProjectScopeRuntime(projectRoot)`（来自 `shared/project-scope-runtime`）取原生 ProjectScope 描述符。
2. `WorkspaceResolver.fromProject(projectRoot, {currentFolderId, projectScope})`（Core）→ `resolver.toFacts()` 得到 workspace facts。
3. `buildProjectRuntimeIdentity`（`:268`）：**resident 优先**——若 resident ProjectScope identity 可用且带 `dataRoot`，构造 ghost 模式身份契约（`runtimeDir=<residentDataRoot>/.asd`、`databasePath=<runtimeDir>/alembic.db`、`ghost:true`、`registered:true`）；否则回退 workspace facts。这是「原生 ProjectScope registry vs single-folder baseline」的两条身份来源。
4. `extractAlembicRuntimeSourceOfTruth(daemonStatus)`（`:575`）：从 daemon health data 深挖 `projectRuntimeSourceOfTruth`（readiness/requiredService/runtimeControl 等），用一组 `stringFrom/numberFrom/booleanFrom/asRecord` 守卫做防御式解析（daemon-less 时为 null）。
5. `buildRequiredServiceReadiness`（`:330`）：对 7 个服务（`project-identity`/`project-scope`/`daemon`/`jobs`/`api-ai`/`dashboard`/`file-monitor`）逐个算 `isServiceAvailable` + `serviceFailureReason` + `serviceMessage` + `serviceSource`，用 Core 的 `createProjectRuntimeServiceReadiness` 包装。`includeOptionalServices` 决定是全量还是仅 required。
6. `summarizeReadiness`（`:533`）：有 blocked→`blocked`，有 degraded→`degraded`，否则 `ready`。
7. `failureEnvelopes`（`:207`）：非 ready 且有 reason 的服务用 Core `createProjectRuntimeFailureEnvelope` 生成失败信封。

**服务可用性判定 `isServiceAvailable`（`:357`）** 是关键分支表：
- `project-identity`：projectRoot+dataRoot+runtimeDir 齐全且（无 resolution 或 trust==='trusted'）。
- `project-scope`：resident 可用或 facts 有 projectScope。
- `daemon`：`daemonStatus.ready===true && status==='ready'`（daemon-less 恒 false）。
- `jobs`：sourceOfTruth.readiness.ready 或 enhancementRoute 的 jobsAvailable/residentDaemonJobsAvailable。
- `api-ai`：sourceOfTruth ready+reasonCode==='ready' 且 residentDaemonJobProvider.available。
- `dashboard`：enhancementRoute selected==='resident' 且 dashboardAvailable 且有 dashboardUrl。
- `file-monitor`：sourceOfTruth.readiness.ready。

`daemonFailureReason`（`:491`）把 sourceOfTruth reasonCode / daemonStatus.status 映射到细分失败原因（daemon-stale/starting/failed/missing/not-checked），含 runtime-control-active-stale / selected-mismatch → daemon-stale 的特例。

#### 6.4.3 MCP 入口模式检测 `detectMcpEntryMode`（`:545`）

经 `readPluginMcpDeclaration(runtime.pluginRoot)`（per-host 声明读取，见 6.8）拿 command/args，判定 `entryMode.mode`：
- args 含 `alembic-start.mjs` → `marketplace-shell`；
- args 含 `/dist/bin/host-mcp.js` → `local-dev-direct-dist`；
- 否则 `unknown`。

`runtimeSpecifier` 从 `--package` arg 取或回退 `pinnedRuntimeSpecifier`；`source` 按声明文件是否存在（存在性而非解析成功，保历史 Codex 语义字节一致）判 `plugin-mcp-config`/`runtime-context`。此实现修复了 mode=unknown 骑在 F-V2-2 上的问题（`:546-548` 注释）。

`buildPrimeRuntimeContext`（`:247`）是给 prime 工具用的窄投影（只保留 identity/readiness 等子集）。

**设计模式**：facade（把 workspace facts + daemon sourceOfTruth + enhancement route + host alignment 聚合成单一投影）+ policy table（fallback 隔离）。

---

### 6.5 host-agent 分析表面 vs ide-agent shim（host-agent/、ide-agent/）

#### 6.5.1 HostAgentAnalysisSurface（`lib/runtime/host-agent/HostAgentAnalysisSurface.ts`）

这是「host 的主 Agent 冷启动分析」表面：把 Core 的 `HostAgentAnalysisPacket`（重的 AST/callgraph/sourceRefs 投影）**降维投影**成一个 host-agent 可直接消费的精简 surface，并提供进度回填。

- 类型：`HostAgentAnalysisSurface`（`:51`）= `nextUnits` + `packetSummary` + `progress` + `retrieval` 四块。`HostAgentSurfaceSourceRef`（`:13`）是精简后的 source ref（保留 path/alias/fqn/symbol/line/projectScopeId/qualifiedPath 等身份字段）。
- `buildHostAgentAnalysisSurface(packet, options)`（`:85`）：
  - `mergeProgress`（`:210`）合并 seed 进度 + overrides（Map by unitId）。
  - `remainingUnitIds` = status ∈ {pending, claimed}；`nextUnits` 从 packet.units 过滤 remaining、`slice(0, maxNextUnits=5 默认)`、`projectUnitSurface` 投影。
  - `retrieval` 投影 requiredReadSet（`projectRequiredReadSet` `:272` 用 comparable-path 索引把 required path 映射回 readable qualifiedPath）、sourceRefs、structuralEvidenceRefs。
  - `progress.statusCounts` 用 `countProgressStatuses`（`:248`，6 状态计数）。
- `buildHostAgentAnalysisProgressBackfill(input)`（`:129`）：把宿主执行结果（completed/skipped/rejected/remaining unit ids + deviationReason）投影成 `HostAgentAnalysisUnitProgress[]`，checkpointKind 固定 `ide-agent-analysis-unit-progress`（历史命名）。关键注释（`:158`）：**Plugin 只回填宿主执行状态，不重建 Core 的 AST/callgraph/sourceRefs 投影**——这是 Plugin/Core 职责边界的落点。
- path 归一化 `normalizeComparablePath`（`:349`，反斜杠→正斜杠、去 `./` 前缀、折叠多斜杠）保证跨 OS 路径比对稳定。

设计模式：**projection / DTO adapter**（Core 重投影 → host-agent 精简 surface）。

#### 6.5.2 IDEAgentAnalysisSurface — P13/R1 兼容 shim（`lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts`）

**纯 re-export shim**（`IDEAgentAnalysisSurface.ts:1`）。真实实现已迁到 `runtime/host-agent`；本文件把 `HostAgent*` 类型/函数以旧 `IDEAgent*` 别名再导出（`BuildIDEAgentAnalysisSurfaceOptions`、`IDEAgentAnalysisSurface`、`buildIDEAgentAnalysisSurface` 等），并 `export *` 转发，保证旧插件缓存和客户端不破。G6 清理前保留。这是 host-agent（host 主 Agent 冷启动分析）与旧 ide-agent 命名并存的兼容层：**同一对象两个名字**，非两条独立分析表面。

---

### 6.6 进程内本地工具执行（mcp/host/embedded-executor.ts、local-tool-dispatcher.ts）

#### 6.6.1 EmbeddedToolExecutor（`lib/runtime/mcp/host/embedded-executor.ts`）

把 Codex/Claude Code 面向的 alembic 工具**在进程内**用一个「Plugin-owned」的嵌入式 MCP handler tree 执行。

- 模块级共享单例 `sharedPluginOwnedMcpServer` + `sharedPluginOwnedMcpServerKey`（`:33`）：一个进程内复用的 `EmbeddedMcpServer`（来自 `runtime/mcp/McpServer`），按 scope key 缓存。
- `EmbeddedToolExecutor.execute(name, args, serviceBoundary, executionContext, options)`（`:60`）：
  1. 校验 `name` ∈ `TOOLS`，否则 `failureResult('Unknown Alembic tool')`。
  2. `#getPluginOwnedMcpServer(executionContext)` 拿/建共享 server，调 `localMcp._executeMcpHandler(name, args, {actor:{role:'host-mcp',...}, source:{kind:'codex',name:'plugin-owned-codex-facing'}, surface:'codex', hostTurnMeta})`。
  3. 成功/失败都经 `attachServiceBoundary` + `attachExecutionContext` 回填（见 6.6.3）。
- `#getPluginOwnedMcpServer(executionContext)`（`:115`）——**scope key** = `projectRoot \0 projectScopeId \0 currentFolderId`（`:118`）。key 未变则复用；变了先 `resetPluginOwnedMcpServer()` 再重建。重建时：
  - **临时改写 env**（`ALEMBIC_PROJECT_DIR`、`ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY_ENV`）并在 `finally` 恢复原值（含 `process.chdir(previousCwd)` 恢复，cwd 恢复失败打 stderr 诊断日志，`:172-179`）。这是「进程内单例 server 需要在初始化时看到正确 projectRoot/scope env」的坑与补偿。
  - `new EmbeddedMcpServer({actorRole:'host-mcp', source:{kind:'codex',...}, surface:'codex'})` → `initialize()`。失败则 shutdown + `resetServiceContainer()` + rethrow。
- `resetPluginOwnedMcpServer()`（`:36`）：清单例并 shutdown + `resetServiceContainer()`（DI 容器重置）。`withPluginOwnedContainer`（`:104`）暴露容器给 sweep/presenter 复用。

关键不变量：**Plugin-owned Codex 工具用嵌入 Plugin handler tree**；Alembic daemon 仍可服务 resident 能力，但不得替换 Codex-facing task payload 所有权（`:146` 注释）。

#### 6.6.2 local-tool-dispatcher（`lib/runtime/mcp/host/local-tool-dispatcher.ts`）

「本地工具」（冷启动/诊断/init/job/runtime 控制）的**命令路由**，不进 embedded handler tree。

- `LocalToolHandlers` 接口（`:1`）：7 个 handler（buildColdStartKnowledgeStatus/buildDiagnostics/buildStatus/cleanupRuntime/initializeWorkspace/enqueueJob/readJob）。
- `dispatchLocalTool(name, args, handlers)`（`:20`）：discriminated union 返回 `{handled:false}` 或 `{handled:true, result}`。路由（合并后的收口工具，MTC-4/MTC-5/MTC-7）：
  - `alembic_status`：`aspect==='knowledge'`→cold-start knowledge；`aspect==='runtime'`→diagnostics；否则 status 总览。
  - `alembic_init`→initializeWorkspace。
  - `alembic_job`：`op==='bootstrap'`/`'rescan'`→enqueueJob；否则（含缺省）→readJob（不启新 job）。
  - `alembic_runtime`：`action==='cleanup'`→cleanupRuntime；否则返回 `CODEX_RUNTIME_ACTION_REQUIRED` 阻断（PDR-3 删 daemon 后 stop action 已去，MTC-5 要求 action 必填，避免裸调误 cleanup）。

设计模式：**command dispatcher / strategy switch**。

#### 6.6.3 results（`lib/runtime/mcp/host/results.ts`）

Codex-facing MCP 统一返回结构 + 运行态回填 helper：
- `failureResult(tool, message, data)`（`:8`）：`{success:false, errorCode:'CODEX_MCP_ERROR', tool, message, data}`。
- `isErrorResult`（`:22`）/`extractResponseError`（`:30`）：跨形态（ok/success/isError；message/error.message）判错取错。
- `attachEnhancementRoute`（`:42`）/`attachServiceBoundary`（`:63`）：把 route/boundary 塞进 `result.data`；后者遇 `isCleanMcpResponse`（clean output contract）直接短路不污染。
- `attachExecutionContext`（embedded-executor.ts:184）：当 resident ProjectScope 可用时把 `codexProjectScopeExecution`（controlRoot/dataRoot/mode/projectScopeId 等，含「用 resident ghost dataRoot 而非在源目录建 runtime 数据」的 reason）塞进 data；`projectRuntime` 未存在时补 `data.projectRuntime`；clean response 短路。

#### 6.6.4 project-root（`lib/runtime/mcp/host/project-root.ts`）

`safeProjectRootFallback()`（`project-root.ts:4`）：`process.cwd()` 抛错时回退 `PWD`/homedir。注释（`:3`）：Codex stdio 启动可能遇 stale cwd，fallback 必须不抛错。被 tool-visibility 与 embedded-executor 消费。

---

### 6.7 项目根覆盖与信任（mcp/host/project-root-scope.ts）

`resolveProjectRootScope(toolName, args)`（`project-root-scope.ts:30`）：处理工具调用里显式的 `projectRoot` arg。返回 discriminated union：
- 无 `projectRoot` → `{kind:'current-project', args}`（用当前 host 项目）。
- `projectRoot` 非字符串/空/非绝对 → `{kind:'failure', result: failureResult(... CODEX_INVALID_PROJECT_ROOT_ARGUMENT)}`。
- 合法绝对路径 → `{kind:'scoped-project', override}`：剥掉 args.projectRoot，**经 L3 `resolveHostAdapter().resolveProjectRoot({projectRoot})`**（`:61` 注释 DH-3c）解析 + `isTrustedProjectRoot` 判信任。

`persistTrustedProjectRootScope(scope)`（`:74`）：仅当 trusted 时经 adapter `writeSavedProjectRoot`。这是「每次调用可携带 projectRoot 覆盖当前 host 项目」的入口，把 host-operation 收口到 L3 adapter。

---

### 6.8 PluginRegistry — per-host 清单读取（`runtime/PluginRegistry.ts`）

`PluginRegistry` 聚合插件壳的清单/资产/README/MCP 声明，被 Diagnostics 消费。

- `readPluginMcpDeclaration(pluginRoot)`（`PluginRegistry.ts:63`）：**per-host MCP 声明的单一来源**。先 `detectPluginHostShape`，再经 `hostAdapterForShape(hostShape)` 取 per-host 清单路径（`pluginMcpManifestPath`）+ arg 归一化（`normalizePluginMcpArg`）。本函数**不判 hostShape**（DH-3b：hostShape 分支收口到 L3）。codex 的路径是 `.mcp.json`、arg 归一为恒等，故 codex wire bytes 逐字不变（F-V2-2）。返回 `{args, hostShape, json, server}`。
- `loadPluginRegistry(context)`（`:79`）：读 marketplace.json、MCP 声明、manifest（同样经 `hostAdapterForShape(...).pluginManifestPath`）、README，返回 `PluginRegistry`（含 `plugin.assets` = manifest interface 的 icon/logo/screenshots，`plugin.hostShape`）。
- `REQUIRED_SKILLS`（`:10`）：5 个必装 skill（alembic/alembic-create/alembic-guard/alembic-recipes/alembic-structure），诊断层校验其 `SKILL.md` 存在。

设计模式：**registry + adapter delegation**（清单布局差异经 L3 adapter）。

---

### 6.9 ProjectRootResolver — 项目根候选/信任/持久化（`runtime/ProjectRootResolver.ts`）

L1 的 host-agnostic 项目根解析中枢（被两个 adapter 委托），是「多项目 Codex MCP 身份」的信任门。

- `resolveProjectRootFromEnv(options)`（`:76`）：`buildProjectRootCandidates`（`:273`）按优先级构造候选：
  1. explicit-option（trusted）
  2. `ALEMBIC_PROJECT_DIR`（trusted）
  3. `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT`（trusted）
  4. `CLAUDE_PROJECT_DIR`（trusted）——**DH-3① 关键**：Claude Code 工作区根纳入可信候选，使 cc 工作区不再 fail-closed（codex 不设此 env，故 codex 行为不变，`:282` 注释）。
  5. `INIT_CWD` / `PWD` / `process.cwd`（fallback）
  取第一个候选，经 `getProjectRootRejectionReason` 校验；trusted → trusted、fallback → fallback、无候选/被拒 → rejected。
- `getProjectRootRejectionReason(path, env)`（`:324`）：**安全拒绝表**——不存在/非目录/文件系统根/home 目录/tmp 根/Codex 插件缓存内（`isCodexPluginCachePath` `:358` 检 `/.codex/plugins/cache/`）/插件根/runtime 包根。这防止把「插件缓存/临时目录/家目录」误当项目根写入运行态数据。
- `readSavedProjectRoot`/`writeSavedProjectRoot`（`:142`/`:168`）：saved root 标记（`<ALEMBIC_HOME|HOME>/.asd/codex-project-root.json`，0600/0700 权限）。注释（`:286`）：saved root 仅作诊断/readback，**多项目身份必须来自当前 host 文件夹或显式 per-call projectRoot，绝不来自上一个窗口的 saved root**。
- `getInitMarkerPath`/`readInitMarker`/`writeInitMarker`（`:217`/`:222`/`:240`）：per-project init marker（`<runtimeDir>/codex-init.json`），经 Core `WorkspaceResolver.fromProject` 解析路径；`InitMarker` 系统字段（dataRoot/ghost/pluginVersion/profile 等）由本函数按 resolver 填充。`isInitMarker`/`isSavedProjectRoot`（`:412`/`:402`）做严格 schema 守卫。
- `summarizeProjectRootResolution`（`:197`）：给 status/diagnostics 用的可读投影（含 userMessage/requiredActions，仅非 trusted 时非空）。

---

### 6.10 ToolPolicy — 按知识状态 + tier 的工具可见性/门禁（`runtime/ToolPolicy.ts`）

本层最核心的**门禁 state-machine**：决定哪些工具在当前知识状态/tier/resident 可用性下对宿主可见。

- **工具名分组常量**（`:75-149`）：`DISCOVERY_TOOL_NAMES`（alembic_status，恒可见）、`INIT_TOOL_NAMES`、`PUBLIC_KNOWLEDGE_NAVIGATION_TOOL_NAMES`（recipe_map/prime/search/graph）、`INITIALIZED_PUBLIC_READ_TOOL_NAMES`（recipe_map/search/graph——首个 Recipe 前也有用）、`HOST_AGENT_WORKFLOW_TOOL_NAMES`（bootstrap/rescan/plan/submit_knowledge/dimension_complete）、`TOOL_POLICY_AGENT_PUBLIC_TOOL_NAMES`（prime/work/code_guard——即使无本地知识也可见，返回结构化 skipped/degraded/blocked 信封）、`PROJECT_SKILL_DELIVERY_TOOL_NAMES`、`RESIDENT_PROJECT_SCOPE_TOOL_NAMES`、`INIT_ON_DEMAND_TOOL_NAMES`、`COLD_START_TOOL_NAMES`。注释（`:95`）记录 MTC-1 退役工具（knowledge/structure/call_context/panorama/task）已删、退役过滤器随之作废。
- `LOCAL_TOOLS`（`:151`）：4 个本地工具（status/init/job/runtime）的完整 schema 定义（含 `codexInputSchema` 注入 `PROJECT_ROOT_PROPERTY` + `additionalProperties:false`）。这些是冷启动/诊断/控制工具，不进 core TOOLS。
- `resolveToolPolicy(input)`（`:266`）——主门禁：
  - `allowedLocalToolNames`（`allowedToolNames` `:306`）按知识状态选：usable → 全 local + host-agent；initialized → cold-start + task-lifecycle + initialized-read + project-skill；未 init → 仅 cold-start。
  - `effectiveTier` = `resolveEffectiveTier(tierName, adminEnabled)`；`maxTier` 从 `tierOrder` 取。
  - `coreTools` 过滤：排除已在 local 表面出现的名字（避免合并后的 status 重复），且必须满足「knowledge.usable ∨ agent-public ∨ (initialized ∧ read-tool) ∨ (resident ∧ resident-scope-tool) ∨ host-agent-workflow ∨ (initialized ∧ task-lifecycle) ∨ project-skill-delivery」且 tier ≤ maxTier。
  - `hiddenReason`：usable 或 resident 可用 → null；否则 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- `resolveToolPolicyState(input)`（`:335`）——**state machine**：`needs_init` → `bootstrap_running` → `needs_bootstrap` → `daemon_stale` → `ready_stale` → `ready_refreshing` → `ready`。`buildToolPolicySignals`（`:358`）为各状态生成 info/warning 信号（含 vector skipped 非阻断信号）。

设计模式：**state machine + policy/gate**（可见性纯函数派生自知识状态快照）。

---

### 6.11 KnowledgeState — 本地知识状态探测（`runtime/KnowledgeState.ts`）

`inspectKnowledge(projectRoot)`（`KnowledgeState.ts:194`）是 ToolPolicy/Status/Onboarding 的**输入源**：不依赖 daemon，直接扫本地工作区文件系统 + SQLite 得出 `HostKnowledgeState`。

- resolver：优先 `WorkspaceResolver.fromProjectScopeRegistry`（原生 project-scope），异常回退 single-folder `new WorkspaceResolver({projectRoot})`（`:197`，标 `@scope-singleroot(temporary)`）。
- `initialized` = config/db/knowledgeDir/recipesDir 四者都存在。
- 计数：`materializedRecipeCount`（扫 `.md`，排除 `_template.md`）、`skillCount`（扫子目录 SKILL.md）、`databaseEntryCount` + `dbRecipeCount`（经 `ProjectSkillKnowledgeRepository` 查 SQLite）。`hasKnowledge` = 任一计数 > 0；`usable` = initialized ∧ hasKnowledge。
- 子状态探测：`inspectJobActivity`（`:332`，扫 `<runtimeDir>/jobs/*.json`，识别 bootstrap/rescan running）、`inspectSourceRefs`/`inspectSnapshots`（经 `#infra/database/SqliteDatabaseAccess` 读 source-ref/snapshot 表）、`inspectVectorState`（`:485`，探 json/hnsw/memory-embedding 索引，`skipped` 表示语义索引未建但非阻断）。
- `buildKnowledgeFreshness`（`:396`）：source-refs stale / job running / 最近 job failed 且晚于知识 → 得出 `stale` + status（source_refs_stale/refresh_running/refresh_failed/current）。
- `resolveKnowledgeStatus`（`:260`）：not_initialized → bootstrap_running → initialized_empty → knowledge_stale → knowledge_ready。
- `EMPTY_KNOWLEDGE_STATE`（`:132`）：兜底空态常量。

与 daemon-status 的关系：本文件完全 daemon-independent，是「无主体（daemon-less）也能算知识状态」的落点。

---

### 6.12 daemon-status、JobContext、EnhancementRoute、HostProjectAlignment（daemon-less 兼容与 handoff 边界）

#### 6.12.1 daemon-status（`runtime/daemon-status.ts`）

`DaemonStatus` 类型（`daemon-status.ts:11`）+ `DaemonStatusKind`（`:9`）。注释（`:1-8`）：PDR-3 删除 embedded runtime carrier 时把该 shape 迁到此处，它作为 status/diagnostics/enhancement-route/resident 消费者引用的类型存活，**运行时恒被解析为 daemon-less（null/'stopped'）值**。这是最典型的历史包袱：类型保留、实体已删。

#### 6.12.2 JobContext（`runtime/JobContext.ts`）

`createJobContext(input)`（`JobContext.ts:9`）：构造 job 的 actor 上下文（role:'host-mcp'、client:'codex-plugin'、createdByTool、sessionId）。极薄，供 job 路由携带宿主身份。

#### 6.12.3 EnhancementRoute — resident vs pure-local 路由选择（`runtime/EnhancementRoute.ts`）

`buildHostEnhancementRouteChoice(input)`（`EnhancementRoute.ts:146`）：决定插件的「增强路由」——**plugin-local 概念，两条一等路由**（PDR-5，`:17` 注释，刻意不是 Core 的 `AlembicRuntimeRouteKind`）：
- `resident`（有主体）：可达 resident Alembic service，经 Core 契约消费。
- `pure-local`（无主体）：进程内 MCP Services + 本地 stage cache + 本地 vector。**一等、完全可用，非降级 fallback**。
- `selectEnhancementRoute`（`:265`）：`daemon.residentService !== null` → resident，否则 pure-local。
- `summarizeEnhancementDaemon`（`:213`）：从 daemon health 深挖 capabilities/residentService，`mergeCapabilitySummaryWithResidentService`（`:383`）把 resident service 的 `capabilities[feature].available` 映射成 jobKinds/dashboardAvailable/fileMonitorAvailable 等（residentService 是 canonical 能力源，runtimeBoundary 仅诊断、不补能力空缺，`:435`）。
- `probeLocalAlembicInstall`（`:181`）：`spawnSync('alembic --version' / 'alembic daemon --help')` 探本地 CLI（1.5s 超时）。
- `inferRouteFromReadyDaemon`（`:531`）：PDR-3/5 后恒返 null（embedded daemon 已删）。
- `HOST_AGENT_ROUTE_TOOLS`（`:25`）+ `hostAgentRoute.requiresAiProvider:false`（`:160`）：host-agent 路由不需 Alembic AI Provider。

#### 6.12.4 HostProjectAlignment — Codex host 项目 vs Alembic runtime 项目对齐（`runtime/HostProjectAlignment.ts`）

`buildHostProjectAlignment(input)`（`HostProjectAlignment.ts:84`）：只读比对「Codex host 项目」与「Alembic selected/active runtime 项目」，产出 `connectionState`（connected/mismatch/disconnected/unavailable）与 handoff 决策。**不拥有 switch/start 编排**（`ModuleBoundary` 的 `switchOwnership: 'Alembic/Dashboard'`）。
- 来源：`readProjectRuntimeControlState`（`:165`，读 `<projectRegistryDir>/runtime-control.json`，schema 版本校验、unreadable/unsupported-schema 兜底）、resident service scope、daemon state。
- `resolveConnectionState`（`:236`）：selected/active differs → mismatch；project-scope resident ready 或 daemon ready → connected；有 selected/active root → disconnected；否则 unavailable。
- `sameProjectScopeRoot`（`:457`）：当 host 与候选 root 同属一个 resident ProjectScope 的 folders 集时视为不 mismatch（多仓空间对齐）。
- `buildLocalSelectionMismatch`（`:424`）：给 host-local 工作流（bootstrap/rescan）用的**信息性**（非阻断）选择不匹配提示——这些工具只操作 host 项目自己的 data root，故在全局选择不匹配时仍继续，但须 surface 同一对齐事实（MT1 P3-3 no-bypass 规则），note 明确「只影响 Codex host 项目，未读/启/改共享 runtime 选择」。

---

### 6.13 host-project-handoff、guidance、tool-visibility（mcp/host 的呈现/门禁 helper）

#### 6.13.1 host-project-handoff（`mcp/host/host-project-handoff.ts`）

`buildHostProjectHandoffBlock(input)`（`host-project-handoff.ts:19`）：Dashboard/job handoff 前校验 host↔runtime 关系，mismatch/disconnected 时返回阻断信封。**关键设计（MT1 P3-3 修复，`:14-18` 注释）**：mismatch 仍阻断共享运行时动作（在全局选择指向其他项目时启动/接管 daemon/Dashboard 是真实劫持风险），但阻断响应**必须给出插件内可执行的恢复路径**——本地 host-agent 工作流（bootstrap/rescan）只操作 host 项目自己的 data root，是冷启动的法定入口，避免只给「Switch from Alembic」对 plugin-only 用户成环形死路。`localWorkflowAction` 按 knowledge.usable 选 rescan 或 bootstrap（`buildRecommendedAction`，来自 Core）。

#### 6.13.2 guidance（`mcp/host/guidance.ts`）

`buildMcpGuidance(tools)`（`guidance.ts:36`）：从可见工具集派生 MCP `instructions`（onboarding playbook + limitations）。按工具名分类（knowledge/guard/lifecycle/recovery/validation），生成 playbook 行（onboarding→project-context→knowledge→guard→lifecycle→fallback）+ 3 条 limitation（ProjectContext 只是 orientation evidence、knowledge 不证 current source、edit 后仍需 validation）。`buildMcpInitializeInstructions`（`:74`）是其 instructions-only 投影。设计模式：**guidance builder / capability-driven copy**。

#### 6.13.3 tool-visibility（`mcp/host/tool-visibility.ts`）

`getVisibleTools(tierName, projectRoot, options)`（`tool-visibility.ts:19`）：本层「工具可见性」的对外入口——
- 经 **L3 `resolveHostAdapter().resolveProjectRoot`** 解析（`:24` DH-3c）；trusted 时 `inspectKnowledge`，否则 `buildExplicitProjectRootRequiredKnowledgeState`（`:43`，合成一个「已初始化、有 1 条知识、usable」的假知识态，让工具照常暴露但由 handler 返回「需显式 projectRoot」）。
- `resolveToolPolicy(...).visibleTools` 经 `withMcpToolAnnotations` → `withMcpOutputSchema` → `withProjectRootInput`（`:57`，给每个工具 schema 注入 `projectRoot` property）三段装饰。

---

### 6.14 opportunistic-evolution 与 staging-access-sweep（tick-on-access 生命周期驱动）

#### 6.14.1 opportunistic-evolution-presenter（`mcp/host/opportunistic-evolution-presenter.ts`）

`attachPluginOpportunisticEvolutionSurface(input)`（`opportunistic-evolution-presenter.ts:12`）：在工具结果上附加「commit-driven 维护」surface。
- `shouldAttachPluginOpportunisticEvolution`（Core/recipe-generation）门控是否附加；若结果已含 embedded unifiedEvolution 则短路。
- 经 `runCommitDrivenMaintenance`（`#recipe-generation/evolution/git-diff-checkpoint/CommitDrivenMaintenance`）跑单一 commit-driven 维护编排（与 rescan 入口共享，UM#2）；presenter 传入自建的 `createUnifiedEvolutionHandler`（`:104`，从 DI 容器 duck-type 取 `HostAgentFileChangeHandler` 所需仓库/服务，缺失则返 null 优雅降级）、容器、runtimeScope。
- `buildPluginOpportunisticEvolutionSurface`（Core/recipe-generation）产出 surface，含 `serviceGate`（resident ProjectScope 就绪位驱动去抖）。设计模式：**DI + graceful degradation**（服务不全则 surface 降级而非崩溃）。

#### 6.14.2 staging-access-sweep（`mcp/host/staging-access-sweep.ts`）

删 daemon 后 Recipe 生命周期由 **tick-on-access** 驱动：每次特定工具调用顺带跑一次有界 sweep。

- 入口 `maybeRunStagingAccessSweep(input)`（`:100`）：仅 `STAGING_ACCESS_SWEEP_TOOL_NAMES`（submit_knowledge/dimension_complete/status/rescan，`:10`）触发；per-projectRoot 状态（`inFlight` + `lastStartedAt`）做 **in-flight 去重 + min-interval 节流**（默认 15s）；`withTimeout`（2s 默认信封超时，`:227`）避免单 tick 长占。
- `runSweep`（`:139`）在同一 try-catch 信封内、共享同一 `cap`（`resolveStagingAccessSweepCap` `:282`，默认 50，`ALEMBIC_STAGING_ACCESS_SWEEP_CAP` 覆盖，守卫拒 cap=0/负值/非整数）依次驱动 4 个有界 Core driver：
  1. **P1** `stagingManager.checkAndPromote(cap)` — staging→晋级。
  2. **P2** `lifecycleStateMachine.checkTimeouts(cap)` — evolving→active / pending·decaying→deprecated。
  3. **P3** `proposalExecutor.checkAndExecute(cap)` — observing proposal 执行 + 到期 pending GC（轨②有界兜底；轨①即时信号在 KnowledgeModule init 接线）。
  4. **P4** `decayDetector.scanAll(cap)` — active→decaying（注入 lifecycleStateMachine 后直走 transition，B1 不依赖信号订阅）。
  各 driver 各 ≤cap，单 tick 总量 ≤ 驱动数×cap，仍有界；任一 driver 抛错整 sweep 走 skipped 兜底（`:190`）。
- `StagingAccessSweepResult`（`:75`）:additive 可观测计数（promotedCount/checkedTimeouts/timedOutCount/executedCount/rejectedCount/expiredCount/decayScannedCount + skipped/timedOut/reason/durationMs）。注意 `timedOut`（布尔，sweep 信封超时）与 `timedOutCount`（lifecycle 迁移条数）语义不同。
- 门禁边界注释（`:159-170`）反复强调：**判定门禁全在 Core，此处仅接线驱动、不碰判定、不绕 transition Guard**。这是 Plugin/Core 职责边界与「daemon-less 生命周期自动化」的落点。

设计模式：**debounced/throttled tick + bounded batch driver（caller-limited cap）**。

---

### 6.15 状态、onboarding、preflight、诊断（status/、preflight/、diagnostics/）

#### 6.15.1 StatusService（`runtime/status/StatusService.ts`）

`buildStatus(projectRootInput, options)`（`StatusService.ts:148`）是 `alembic_status`（无 aspect）的实现——聚合项目/工作区/knowledge/daemon/localEmbedding/autoInit/onboarding/nextActions 成 `StatusData`。数据流：
1. `WorkspaceResolver.fromProject` + `resolver.toFacts()` + `WorkspaceSettingsStore`（Core）。
2. **daemon-less**：无 supervisor 时构造合成 `stopped` DaemonStatus（`:166`，message `'daemon removed (PDR-3)'`），保下游非 null 类型。
3. `inspectKnowledge`（6.11）→ `AlembicResidentServiceClient.probe` + `resolveProjectScopeIdentity`（resident 探测）→ `buildHostEnhancementRouteChoice`（6.12.3）→ `buildHostProjectAlignment`（6.12.4）→ **经 L3 `resolveHostAdapter().resolveProjectRoot`** 解析根 → `buildProjectRuntimeContext`（6.4）→ `buildModuleBoundaryStatus` → `buildAutoInitStatus`（`:320`，读 init marker）→ `buildRuntimeDiagnostics`（6.15.4）→ `buildStatusOnboarding`（`:660`）。
- `buildStatusOnboarding`（`:660`）是**大 onboarding state machine**：按 project_root_unresolved → runtime_issue → needs_init(_existing_knowledge) → bootstrap_in_progress → needs_bootstrap → project_handoff_{state} → ready(_daemon_running) 逐级产出 `state`/`summary`/`primaryAction`/`nextActions`/`notes`，并 spread `composeStatusOnboardingContract`（`:894`，调 `buildStatusOnboardingContract`）。
- action builder：`buildHostAgentBootstrapAction`/`buildHostAgentRescanAction`/`buildAgentPrimeAction`（`:554`+），`buildKnowledgeGateActions`（`:629`，被 Preflight 复用）、`buildPostInitActions`（`:600`）。
- 大量 `summarize*` helper 把重投影裁剪为 status 响应字段（`summarizeOnboarding`/`summarizeHostAgentContract`/`summarizeStringRecord` 等）。

#### 6.15.2 OnboardingContract — bootstrapState/gates/repairState/hostAgentContract（`runtime/status/OnboardingContract.ts`）

本层最大的「宿主 Agent 契约生成器」（约 47k）。`buildOnboardingContract(input)`（`OnboardingContract.ts:101`）产出 `OnboardingContract`（`:60`）九块：`bootstrapState` / `currentDimensionGuidance` / `currentDimensionNextActions` / `gates` / `hostAgentContract` / `initialToolBriefing` / `progress` / `repairState` / `toolCapabilities`。`buildColdStartOnboardingContract`（source='bootstrap'）与 `buildStatusOnboardingContract`（source='status'）是两个入口（`:89`/`:95`）。

- **bootstrapState**（`buildBootstrapState` `:159`）：`status`（`resolveBootstrapStatus` `:200`——wrong_scope/degraded/needs_init(_existing_knowledge)/bootstrap_in_progress/project_context_stale/knowledge_ready/initialized_empty/bootstrap_ready/needs_status_check）+ `projectIdentity` + `runtime`（aiProviderRequired:false、daemonRequiredForBootstrap:false、defaultRoute:'plugin-owned-codex-facing'）+ `projectContext`（`buildProjectContextState` `:223`，readiness graph_stale/needs_status_check/not_yet_proven）+ `singleWriterLease`（`buildSingleWriterLeaseVisibility` `:246`——bootstrap 单写者租约的**可见性**，硬超时执行属后续 lease-enforcement 路由，非本字段）+ `session` + `progress`。
- **toolCapabilities**（`buildToolCapabilities` `:285`）：从 `PluginToolSurfaceCatalog` 按四组（canonicalProjectContext/knowledgeAndRecipes/guardAndValidation/bootstrapAndRecovery）投影 annotations/handlerOwner/knowledgeGate/residentRoutePolicy/schema/tier。
- **hostAgentContract**（`buildHostAgentContract` `:354`）：plan-neutral 质量契约——scopeBrief、toolCapabilityMatrix、stagedProtocol、languageOverlayContract、recipeGuidanceFloor、recipeOntology、recipeAuthoringRubric、`submitKnowledgeContract`（`:476`，**从 `@alembic/core/knowledge` 规范模块渲染**——`buildSpecSubmitKnowledgeContract`/`getImperativeVerbAllowlist`/`getEvidenceFloorPolicy`，使「指南 == 门禁同一张表」，暴露真实 45 祈使动词与 scope 证据下限逃逸，P2.2）、dimensionCompletionContract（`:588`，含 floors/requiredFields/checkpointRule）、knowledgeResetContract、qualityGates、stopConditions、`llmParticipationBoundary`（"plugin runtime 默认路由不做 provider-backed Recipe 写作；Codex 负责判断"）。
- **gates**（`buildGates` `:1038`）：6 类门禁规则（scope / projectContext / sourceEvidence / relationshipEvidence / validation / runtimeTransport），每类给 rule + 首修工具/degradedStates。
- **repairState**（`buildRepairState` `:1092`）：按 bootstrapState.status 累积 `reasons`，产出 `status`（waiting/repair-needed/ready）+ `rebuildRequired` + `firstRepairTool` + `safeFallback` + `blockedConclusions`（4 条硬结论禁令：不得声称 ProjectContext 完整无证据、不得声称 live 可用无 MCP readback、不得无证据标 dimension complete、bootstrap_in_progress 时不得起第二写者）。
- **progress**（`buildProgress` `:1074`）+ **currentDimensionGuidance**（`buildPlanNeutralDimensionGuidance` `:322`，plan-neutral，说明「bootstrap 会用 Mission Briefing 的 executionPlan current-tier 替换本 status 级摘要，不用静态 task 分解」）+ **currentDimensionNextActions**（`buildCurrentDimensionNextActions` `:1138`）。

这是宿主 Agent 冷启动读取的核心契约表面，MCP server instructions 也直接指向这些字段（`bootstrapState`/`toolCapabilities`/`currentDimensionGuidance`/`hostAgentContract`/`gates`/`repairState`）。设计模式：**contract/spec projection**（门禁与指南单源自 Core knowledge spec）。

#### 6.15.3 Preflight — 工具执行前门禁与自动 init 决策（`runtime/preflight/Preflight.ts`）

`preflightTool(input)`（`Preflight.ts:56`）是每次工具执行**前**的守门：
1. `findKnownTool`（LOCAL_TOOLS ∪ coreTools）——未知 → `CODEX_UNKNOWN_TOOL`。
2. 项目根信任门：非 trusted 且非 discovery 工具（alembic_status）→ 阻断（`CODEX_PROJECT_ROOT_REJECTED`/`CODEX_PROJECT_ROOT_UNRESOLVED`，带 `summarizeProjectRootResolution` + requiredActions）。这是「alembic_status 之外的工具在项目根未信任时 fail-closed」的落点。
3. `resolveToolPolicy`（6.10）→ 工具不在 visible 集 → `buildToolHiddenFailure`（`:137`）：admin-only 未开 admin → `CODEX_ADMIN_OPT_IN_REQUIRED`；knowledge 不 usable 且非 resident → `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`（带 `buildKnowledgeGateActions`）；否则 `CODEX_TOOL_NOT_AVAILABLE`。
4. `autoInit` 决策（`:114`）：`stage==='before-auto-init'` ∧ 未 initialized ∧ 工具 ∈ `INIT_ON_DEMAND_TOOL_NAMES` → true（触发按需 Ghost init）。
返回 `PreflightOk`（含 autoInit + allowedTools）或 `PreflightBlocked`（failure 信封）。设计模式：**gateway / guard pipeline**。

#### 6.15.4 Diagnostics（`runtime/diagnostics/Diagnostics.ts`）

`buildRuntimeDiagnostics(daemonStatus, context, options)`（`Diagnostics.ts:191`）是 `alembic_status aspect=runtime` 的实现——探 Node/npm/npx/plugin 元数据/MCP 入口/embedded runtime/marketplace shell，产出 checks/issues/nextActions/report sections。
- `buildPluginDiagnostics(context)`（`:420`）经 `loadPluginRegistry`（6.8）校验 manifest/assets/skills/README/MCP env。
- **host-shape 收口**：`buildPluginAssetDiagnostics`（`:633`）用 `hostAdapterForShape(registry.plugin.hostShape).allowsEmptyPluginAssets`（`:642`）裁定「空资产是否健康」，诊断层**不直接判 hostShape**（DH-3b，host 选择分支只在 L3）——这是 6.1.1 `allowsEmptyPluginAssets` 能力的唯一消费点。
- env 校验用 `expectedPluginHost`（按物理 shell 形态派生）替代恒 codex 比较（`:600`，RC-1）：`pluginHost` check = `pluginHostValue === registry.context.expectedPluginHost`。
- MCP 入口诊断 `McpEntryDiagnostics`（`:79`）识别 local-dev-direct-dist / marketplace-shell / stale-installed-cache / unknown，含 wrapper startup-lock 诊断。

---

### 6.16 host-agent-workflows 与 evolution 目录 —— 全是 shim（重要标注）

**明确标注**：以下两处目录**全部是薄 re-export shim**（RG9 兼容适配），canonical 实现在 `#recipe-generation/*`（属 sec-10，本节不展开）：

- `lib/runtime/mcp/host-agent-workflows/`：8 个文件（cold-start / dimension-completion / knowledge-rescan / project-context-analysis / project-data-root / project-index / recipe-evidence-gate / recipe-region-vector），每个仅一行 `export * from '#recipe-generation/host-agent-workflows/<name>.js'`。注释：「RG9 兼容适配……保留原因是维持 MCP/相对导入稳定；移除条件是消费者全部切到 `#recipe-generation/*`；owner: AlembicPlugin RG9」。
- `lib/runtime/evolution/PluginOpportunisticEvolution.ts`：一行 `export * from '#recipe-generation/evolution/PluginOpportunisticEvolution.js'`（RG9，消费者为旧 `#codex/evolution` 路径与历史测试）。

这些 shim 只维持插件 runtime 入口/旧路径稳定，**不承载真实逻辑**；真实生命周期/进化实现属 recipe-generation 域（sec-10）。

---

### 6.17 与 @alembic/core 的消费点汇总

本层经以下 Core 子路径入口消费共享内核（禁止绕过包入口）：
- `@alembic/core/host-agent-workflows`：`HostAgentAnalysisPacket`/`HostAgentAnalysisUnit`/`HostAgentAnalysisUnitProgress`（host-agent surface）、`ProjectSkill*` 系列 + `createPluginProjectSkillDeliveryReceipt`/`normalize*`/`validate*`（ProjectSkillDelivery，见 sec-05/10 交叉）。
- `@alembic/core/daemon`：`ProjectRuntimeIdentityContract`/`ProjectRuntimeServiceReadiness`/`createProjectRuntime*`/`normalizeAlembicRuntimeDataRootSource`（ProjectRuntimeContext）、`AlembicResidentService*`/`normalize*`/`summarize*Capabilities`（EnhancementRoute）、`createProjectRuntimeControlState`/`PROJECT_RUNTIME_CONTROL_STATE_SCHEMA_VERSION`（HostProjectAlignment）、`DaemonState`/`DaemonJob*`（daemon-status/KnowledgeState）、`AlembicResidentServiceProbe`（Diagnostics）。
- `@alembic/core/workspace`：`WorkspaceResolver`（ProjectRuntimeContext/StatusService/KnowledgeState/ProjectRootResolver）、`ProjectRegistry`/`getProjectRegistryDir`/`normalizeProjectPath`（HostProjectAlignment）、`resolveProjectRoot`/`resolveDataRoot`（ProjectSkillDelivery）。
- `@alembic/core/shared`：`HOST_AGENT_SOURCE`/`LEGACY_IDE_AGENT_SOURCE`（SourceBoundary/EnhancementRoute）、`WorkspaceSettingsStore`（StatusService）。
- `@alembic/core/knowledge`：`buildSubmitKnowledgeContract`/`getImperativeVerbAllowlist`/`getEvidenceFloorPolicy`（OnboardingContract，指南==门禁单源）。
- `@alembic/core/io`：`pathGuard`（ProjectSkillDelivery 写前守卫）。

宿主连接点：Codex/Claude Code 经 MCP stdio 客户端调用 → sec-05 的 HostMcpServer/McpServer 编排 → 本层的 adapter/policy/preflight/executor。物理壳差异（`.mcp.json` vs `.claude-plugin/plugin.json`、`${CLAUDE_PLUGIN_ROOT}` 归一、`CLAUDE_PROJECT_DIR` 信任）全收口于 L3 HostAdapter。

---

### 6.18 SourceBoundary、ServiceRequestBoundary、ModuleBoundary、ProjectSkillDelivery（边界守卫补充）

- **SourceBoundary**（`runtime/SourceBoundary.ts`）：`normalizeHostAgentWriteSource(source)`（`:10`）把旧写入源（`cursor-scan`/`mcp`/`mcp-external`/`LEGACY_IDE_AGENT_SOURCE`）归一为 `HOST_AGENT_SOURCE`。把「宿主写入来源」统一到 host-agent，防止旧 source 标签污染知识写入。
- **ServiceRequestBoundary**（`runtime/ServiceRequestBoundary.ts`）：`resolveServiceRequestBoundary(tool, args)`（`:17`）恒返 `executionPath:'plugin-owned-codex-facing'` + `owner:'alembic-plugin'`——Codex-facing MCP 工具全 Plugin-owned；`residentServiceRequested` 仅 `alembic_search`/`alembic_job` 为 true（`:15`，可经显式 resident `/api/v1/search` 增强，但绝不经已删的 daemon MCP bridge）。`buildPluginOwnedReason`（`:40`）给出 per-tool 边界理由（含退役 `alembic_task` 的 fail-closed 语义）。这是「谁拥有工具执行」的边界决策，回填进 `result.data.serviceBoundary`（见 6.6.3）。
- **ModuleBoundary**（`runtime/ModuleBoundary.ts`）：`buildModuleBoundaryStatus(input)`（`:200`）产出 `pluginOwns`/`pluginDoesNotOwn` 两组边界条目 + adapters（projectRootResolver/enhancementRoute/hostProjectAlignment/embeddedRuntime/runtimeContract）+ dashboard(`dashboard-url-handoff-only`) + nextWaveGaps。这是「插件拥有什么 / 不拥有什么」的机器可读边界声明（daemon/registry/jobstore/file-monitor/dashboard-frontend/resident-job-runtime 属外部所有）。被 Diagnostics/Status 消费。
- **ProjectSkillDelivery**（`runtime/ProjectSkillDelivery.ts`）：生成/导出 Project Skill 交付 receipt（`buildPluginProjectSkillDeliveryReceipt` `:68` / `exportProjectSkillReceiptToRuntime` `:141`）。导出经 `pathGuard`（Core `@alembic/core/io`）做写前守卫（`addProjectWritePrefix('.agents')` + `assertProjectWriteSafe`），symlink-first 策略，`inspectExistingRuntimeTarget`（`:387`）判 target-missing/compatible-existing/different-existing/blocked，managed marker（`.alembic-managed.json`）做幂等/冲突检测，授权门（`authorization.status !== 'granted'` 且未 authorize → blocked）。这是「把生成的 Project Skill 安全导出到宿主 `.agents/skills/` runtime」的受控写入边界。

---

### 6.19 边界 / 坑 / 兼容层 / 降级路径 / 历史包袱 清单

1. **daemon-less 历史包袱**（PDR-3）：`daemon-status.ts` 的 `DaemonStatus` 类型保留但运行时恒 `stopped`/null；`EmbeddedRuntimeContract.EMBEDDED_RUNTIME_REQUIRED_ROUTES=[]`；`EnhancementRoute.inferRouteFromReadyDaemon` 恒 null；StatusService 合成 `stopped` daemon。下游服务就绪判定（daemon/dashboard）在无 resident service 时恒不可用。
2. **host identity 权威 = shell 形态而非 env**：`detectPluginHostShape` 保守（两者皆缺 → codex），保证既有 Codex 行为字节一致（F-V2-2）。env 只是回退。
3. **cc setupProfile 复用 codex-plugin**（`ClaudeCodeHostAdapter.ts:41`）：init-marker profile 字段类型锁定，独立 cc profile 属 DH-4 待办。
4. **saved-project-root 不作有效身份**：仅诊断/readback；多项目身份必须来自当前 host 文件夹或 per-call projectRoot（防跨窗口污染）。fallback 隔离表（6.4.1）固化此边界。
5. **进程内单例 server 的 env/cwd 临时改写**（embedded-executor `#getPluginOwnedMcpServer`）：init 时改 `ALEMBIC_PROJECT_DIR`/scope env + cwd，`finally` 恢复；cwd 恢复失败打诊断日志。scope key 变化才重建（避免频繁重建）。
6. **tick-on-access 有界化**（staging-access-sweep）：删 daemon 后生命周期靠工具调用顺带驱动；in-flight 去重 + 15s 节流 + 2s 信封超时 + per-driver cap，防单 tick 长占。判定全在 Core，Plugin 仅接线。
7. **mismatch 阻断必须带插件内恢复路径**（host-project-handoff）：避免 plugin-only 用户环形死路（MT1 P3-3）。
8. **shim 层**：ide-agent（→ host-agent 同对象别名）、host-agent-workflows/*（→ recipe-generation）、evolution/PluginOpportunisticEvolution（→ recipe-generation）——全 RG9 兼容，移除条件=消费者切到 `#recipe-generation/*`。
9. **guidance == gate 单源**（OnboardingContract.submitKnowledgeContract）：从 `@alembic/core/knowledge` 规范模块渲染，避免指南与门禁漂移（P2.2）。
10. **admin tier 降级**（`resolveEffectiveTier`）：`admin` tier 未开 `ALEMBIC_CODEX_ENABLE_ADMIN=1` 时静默降级为 `agent`；Preflight 对 admin-only 工具返回 `CODEX_ADMIN_OPT_IN_REQUIRED` 而非静默隐藏。


---

## 7. 项目知识上下文与检索层 (Project Knowledge Context)

本节测绘 `lib/service/project-knowledge-context/` 这个服务内核。它是 plugin 对外「知识 / 上下文 / 结构」能力的**纯计算引擎层**：把 `@alembic/core` 的 ProjectContext 事实 + 知识/向量检索证据，投影为四个 agent 工具(`alembic_search` / `alembic_graph` / `alembic_recipe_map` / `alembic_prime`)各自的**有界、Recipe-free-或按需的、去 envelope 的**公共输出契约。

注意一个反复出现的架构决策(代码注释里以 `GMAP-*` 编号标记的历史迁移):**这一层不再存在统一的 `KnowledgeContextToolOutput` 中间信封**(GMAP-8c 退役)。四个工具各自拥有自己的 output schema，只复用 `contracts/ToolOutputPrimitives.ts` 里的一批叶子原语。因此本层内部**没有一个「大 facade」把四条链串起来**，而是若干个可注入、可单测的 provider + 一堆纯函数投影器。真正把 provider 接到宿主(Codex / Claude Code)MCP 表面的是 `lib/runtime/mcp/handlers/*`(相邻子系统，见 crossLinks)。

### 7.0 目录组成与整体职责划分

```text
lib/service/project-knowledge-context/
├── index.ts                     # barrel: 转出 contracts/project/retrieval/support
├── contracts/                   # 8 个 zod 输出/输入契约 + 叶子原语
├── project/                     # ProjectContext → graph / region 投影引擎(承重god-file)
├── recipe-map/                  # Recipe 挂载引擎(确定性,只用 source_refs+metadata)
├── retrieval/                   # 知识/Recipe 检索 provider(接口 + 打分/重排实现)
└── support/                     # budget / cache / ref-registry / ranker / score-trace 工具
```

四个子域的分工(provider 组合模式 = 每个子域一组 interface + Default 实现，由 handler 层做 DI 组合):

| 子域 | 负责的工具链 | 数据来源 | 关键类/文件 |
| --- | --- | --- | --- |
| `project/` | `alembic_graph`、以及被 `recipe_map` 复用的共享 region | `@alembic/core` ProjectContext | `ProjectContextProjectGraphProvider` (`ProjectGraphProvider.ts:182`) |
| `recipe-map/` | `alembic_recipe_map` | 共享 region + `recipe_source_refs`/metadata | `RecipeMapProvider` (`recipe-map/RecipeMapProvider.ts:65`) + `mounting.ts` 确定性引擎 |
| `retrieval/` | `alembic_search`(search/get/expand) | Core `SearchEngine` + resident-search 证据(由 handler 喂入) | `DefaultRecipeCandidateProvider` / `DefaultVectorRerankProvider` / `DefaultKnowledgeDetailProvider` / `DefaultContextExpansionProvider` / `DefaultRecipeRelationChainProvider` |
| `support/` | 全部 | 无(纯工具) | `ContextBudgeter` / `RefRegistry` / `ResultRanker` / `ContextCache` / `ScoreTrace` |

一条贯穿全层的检索管线(逻辑视角，物理上分布在 handler + retrieval + support):
**search(Core resident/local) → candidate 打分(RecipeCandidateProvider) → 向量重排(VectorRerankProvider) → 排序(ResultRanker) → 预算裁剪(ContextBudgeter) → ref 化(RefRegistry detailRef / KnowledgeDetailProvider 展开)**。

---

### 7.1 contracts/ — 输出/输入契约层

契约层是**纯 zod schema + `create*McpResult` 工厂**，无任何投影逻辑。barrel `contracts/index.ts:1` 转出全部 8 个文件。

#### 7.1.1 `ToolOutputPrimitives.ts` — 跨工具叶子原语(GMAP-8c 的落点)

`ToolOutputPrimitives.ts:1` 头注释明确记录了历史包袱：`KnowledgeContextToolOutput` 统一信封退役后，**没有重建中间层**，而是让四个工具各自拥有 schema，只共享这些「plain value shapes — no projection logic, no shared envelope, no inter-tool coupling」。

导出的原语(`ToolOutputPrimitives.ts:14-74`)：
- `ToolStatusSchema` — 五态 `ready|partial|degraded|blocked|failed`(`:13`)。
- `ToolDiagnosticSchema` — `{code,severity,message,domain?,retryable,detailRefId?}`(`:18`)。
- `ToolNextActionSchema` — `tool` 是**自由字符串不是 enum**，注释说明这样任何工具都能指向另外三个工具，且不暗示调用顺序(`:34`)。
- `ToolRefSchema` / `ToolLimitSchema` / `ToolSourceEvidenceSchema` — ref 往返、预算截断标志、来源证据指针。

设计模式：**value-object / 契约 registry**。

#### 7.1.2 `AlembicSearchOutput.ts` — search 自有契约

头注释(`AlembicSearchOutput.ts:1-16`)记录 GMAP-8b：search **不再走 KnowledgeContext 中间层**(不经 `defaultProjectKnowledgeContextLayer.resolveMcpResult`)，handler 直接把 resident-search + retrieval provider 产出的 payload 投进这个 search-owned 信封。

- 三操作 `search|get|expand`(`:22`)、五态(`:23`)。
- `result` / `inventory` / `items` 是**松散 passthrough**(`SearchObjectSchema = z.record(string, unknown)`，`:36`)——注释解释这是为了让 resident-search 证据(`residentSearch` / `residentVector` / `searchMeta` / `vector`)和 search-quality summary **原样存活**，不被 schema 削平(`:14-15`)。
- `AlembicSearchMcpResultSchema`(`:89`)带 `.superRefine`：强门禁——① 可见 `content[0].text` **必须逐字等于** `structuredContent.summary`(`:99`)；② `ok===true` 时**禁止** `isError`(`:106`)。这是全平台 clean-output 契约(可见文本只放 summary，结构化内容走 `structuredContent`)。
- `createAlembicSearchMcpResult(output)`(`:121`)：双重 parse(先 `AlembicSearchOutputSchema.parse` 再 `McpResultSchema.parse`)后返回 `CallToolResult`；`isError` 由 `ok` 派生。

#### 7.1.3 `AlembicGraphOutput.ts` — graph 自有的 Recipe-free 结构契约

头注释(`AlembicGraphOutput.ts:1-9`，GMAP-1)：graph **绝不携带任何 Recipe 内容**(recipe id/summary/mount/score/relation-chain)、检索分数、prime 语义结果或知识目录类别。

- **queryKind** 是公共选择器：9 个直接映射 ProjectContext 请求类(`space/repo/map/module/module-layers/file-flow/file-symbols/source-slice/anchor-range`，`:16`)+ 4 个派生遍历视图(`path/impact/neighborhood/stats`，`:29`)。
- 节点类型 7 种(`project…symbol`，`:47`)、关系类型 10 种(`partOf/dependsOn/imports/exports/definesSymbol/referencesSymbol/calls/calledBy/ownsFile/entrypointFor`，`:57`)。
- `GraphNodeSummarySchema`(`:79`)带**有界 query 打分诊断**：`queryMatchScore` / `queryMatchedTerms` / `rankingSignals`——注释强调「never Recipe scores」(`:87`)。
- `AlembicGraphLimitsSchema`(`:149`)= `{truncated,itemLimit,refLimit,relationLimit}`。
- `meta.projectContext`(`:158`)= `{requestKinds,refCount,errorCount,partial}` = ProjectContext 执行溯源。
- 同样有 `toolName` literal(全平台 clean-output 判别符)+ `.superRefine`(summary 逐字 + ok/isError 门禁，`:227`)+ `createAlembicGraphMcpResult`(`:244`)。

#### 7.1.4 `AlembicRecipeMapOutput.ts` — recipe_map 自有契约

头注释(`AlembicRecipeMapOutput.ts:1-10`，GMAP-4/7)：recipe_map 取代旧的 `alembic_project_matrix`；返回一块**有界 ProjectContext region**(复用 GMAP-3 `ProjectContextRegion` 投影，所以 refs 能和 graph 往返)+ 确定性 Recipe 挂载 + rollup。**挂载只用 `recipe_source_refs` + 显式 metadata，绝不用语义/关键词搜索**；**不返回完整 Recipe body**(要 body 去 `alembic_search`)。

- `RecipeMountTypeSchema`(`:32`)10 种挂载类型：`global-no-code / metadata-scope / source-file / source-line / source-range / source-ref-nearest-node / multi-ref-common-ancestor / cross-repo-common-ancestor / degraded-stale / degraded-unresolved`——这是确定性挂载引擎的输出分类枚举。
- `MapNodeSummarySchema`(`:47`)= RegionNode + Recipe rollup 计数(`directRecipeCount` / `descendantRecipeCount` / `representativeRecipeIds`)。
- `RecipeMountSummarySchema`(`:63`)= 挂载明细(recipeId/title/mountNodeId/mountLevel/mountType/sourceRefs/matchedRefs/reason/detailRef)。
- `meta.fullMapRef`(`:206`)= `TransientTransportRef | null`——超预算时把完整 map 落盘旁路(见 7.3.2 预算裁剪)。
- `refs` 复用 `AlembicGraphOutput` 的 `ProjectContextRefSummarySchema`(`:13` import)——**跨工具 ref 往返的关键**。

#### 7.1.5 `ProjectContextRegion.ts` — graph 与 recipe_map 共享的内部 region 投影(GMAP-3)

头注释(`ProjectContextRegion.ts:1-12`)是这一层的**架构枢纽说明**：recipe_map **禁止自建第二棵项目树**；这个 region 是 ProjectContext envelope 的 focus-scoped 投影(经共享 graph build)，**绝不调用公共 `alembic_graph` MCP 工具**。`RegionNode` 镜像 recipe_map `MapNodeSummary` 的结构核心(减去 Recipe 字段)，所以一个 ref/node 在 graph(refId)和 recipe_map(focus)之间**免费往返**——因为 `ProjectContextRef.id` 本身就是稳定 id。

- `RegionNodeKindSchema`(`:32`)比 graph 的 nodeType 更细(多了 `map / module-layer / source-slice / anchor-range`)——region 是 recipe_map 的自然坐标系。
- `ProjectContextRegionRequestSchema`(`:100`)= `{focus, projectRoot?}` = recipe_map 的 focus-shaped 输入(区别于 graph 的 queryKind 输入)。

#### 7.1.6 `KnowledgeContextBaseInput.ts` / `KnowledgeContextRefs.ts` / `KnowledgeContextStatus.ts` — 共享输入契约

`KnowledgeContextBaseInputSchema`(`KnowledgeContextBaseInput.ts:43`)是四个工具输入的公共基座(projectRoot/agentHost/query/activeFile/scope/include/filters/detailLevel/budget/freshnessPolicy…),各工具再 `.extend`：
- `PrimeInputSchema`(`:91`，omit `intentRef`)。
- `KnowledgeSearchInputSchema`(`:121`，加 operation/mode/id/refId/kind/category/dimensionId/keywords/limit…)。
- `ProjectGraphInputSchema`(`:163`)——**关键兼容层**：GMAP-1 注释(`:158-162`)说明 `queryKind` 是公共选择器，而 legacy `operation/nodeId/fromId/toId/direction/relationType/maxDepth` **只保留在边界做 stale 宿主参数归一化**，不定义第二条行为分支、不作为公共契约广告。

`KnowledgeContextRefs.ts`:
- `KnowledgeContextBudgetSchema`(`:15`)= 预算旋钮全集(`tokenBudget?` / `itemLimit=20` / `detailLimit=20` / `relationHopLimit=2` / `contentCharLimit=1200` / `matrixNodeLimit=500` / `nextActionLimit=5`)——`ContextBudgeter` 的输入。
- `KnowledgeContextDetailRefSchema`(`:48`)= detailRef 分级加载的载体(id/domain/tool/summary/uri/ref/freshness/budget/`requiredForCompletion`)。
- `KnowledgeContextIncludeSchema`(`:105`)= 域开关(project/knowledge/recipeRelations/vector/documents 默认 on，runtime 默认 off)。

`KnowledgeContextStatus.ts`:
- `KNOWLEDGE_CONTEXT_TOOL_NAMES`(`:5`)仍含 `alembic_project_matrix`(已退役但枚举保留=历史包袱)。
- `KNOWLEDGE_CONTEXT_AGENT_HOSTS = ['codex','claude-code']`(`:31`)——RC-5 注释记录**双宿主收敛**：删了 generic-host-agent 和未实现的 desktop/terminal/automation future-host stub(无消费者)。这是本层与宿主(Codex/Claude Code)连接的唯一 host 判别常量，`agentHost` 仍为可选字段。

---

### 7.2 project/ — ProjectContext → graph / region 投影引擎(承重 god-file)

这是本层最重的模块。`ProjectGraphProvider.ts` **约 4289 行/134KB 的单文件**(已知历史包袱：典型的 god-file，含一个 class + 上百个纯函数投影器)。另有两个极薄的 provider。

#### 7.2.1 三个 project provider(轻/重分层)

- `DefaultProjectIdentityProvider`(`project/ProjectIdentityProvider.ts:23`)：唯一消费点是 `@alembic/core/search` 的 `resolveSearchWorkspaceIdentity`(`:1`)——用 `projectRoot` 解析 workspace 身份(projectId/dataRoot/workspaceMode)。GMAP-8c 注释(`:1-2`)说 KnowledgeContext 中间层输入归一化已退役，身份解析只需 root + 可选 language。projectId 兜底 = `project:${stableRefSegment(projectRoot)}`。
- `ProjectStructureProvider`(`project/ProjectStructureProvider.ts:7`)：**只有 interface，无实现**——预留桩(空能力面)。
- `ProjectContextProjectGraphProvider`(`ProjectGraphProvider.ts:182`)：承重引擎，实现 `ProjectGraphProvider` 接口两个方法：
  - `resolveAlembicGraph(input): AlembicGraphOutput`(`:187`)= `alembic_graph` 的公共路径。
  - `resolveProjectContextRegion(request): ProjectContextRegion`(`:222`)= 供 `recipe_map` 复用的共享 region(GMAP-3)。

#### 7.2.2 `resolveAlembicGraph` 主流程(`ProjectGraphProvider.ts:187`)

管线(strategy + pipeline 模式)：
1. `projectRoot = input.projectRoot ?? process.cwd()`(`:188`)——**降级坑**：无 root 时用进程 cwd(MCP server cwd 未必是用户项目，参见仓库记忆里的 root-resolution 历史问题，此处由 handler 传入正确 root 保证)。
2. `normalizeGraphProviderInput`(`:189`→`:300`)：把 stale 宿主参数归一化(`filePath→activeFile`、`refId→nodeId`、`fromRefId→fromId`、`toRefId→toId`)后重新 `ProjectGraphInputSchema.parse`。这是 legacy-args **兼容层**的物理落点。
3. `resolveGraphQueryKind`(`:190`→`:3203`)：`queryKind` 优先；否则 legacy `operation` 兜底映射；默认 `map`。
4. `preflightAlembicGraphSelection`(`:191`→`:310`)：**前置门禁**——`impact/neighborhood` 无 nodeId、`path` 缺 fromId/toId、file 系列(`file-flow/file-symbols/source-slice/anchor-range`)无显式路径锚点时，**直接返回诊断型 selection 不执行 ProjectContext**(省算力 + 明确回引导)。
5. `buildGraph`(`:203`→`:234`)：真正跑 ProjectContext 采集(见 7.2.3)。异常 → `failedAlembicGraphOutput`(`:205`)。
6. `selectAlembicGraph`(`:207`→`:3221`)：按 queryKind 分派到不同选择器(见 7.2.4)。
7. `projectAlembicGraphOutput`(`:208`→`:3443`)：把 selection 投影为最终 `AlembicGraphOutput`(见 7.2.5)。

#### 7.2.3 事实采集引擎 `buildGraph` → `buildProjectContextGraphFacts`(`:234` / `:406`)

**唯一的 Core 计算消费点**：`ProjectContextCapabilities.execute` (import 自 `@alembic/core/project-context-capabilities`，`:18`；类型自 `@alembic/core/project-context`，`:2-17`)。所有 ProjectContext 请求都经 `executeGraphProjectContextRequest`(`:774`)统一封装:传 `{kind, payload, project:{projectRoot, source:'alembic-plugin-mcp'}, scope:{projectRoot, repoId?, sourceFolder?}}`。

`buildProjectContextGraphFacts`(`:406`)是一条**分层采集流水线**，按需(依 queryKind/query 决定深浅)顺序执行：
1. `collectGraphRepoContexts`(`:477`)：先 `space` envelope(含 project tree / structural hotspots，maxTreeEntries 80)→ 选出最多 4 个 repo folder → 每个跑 `repo` envelope(commands/entrypoints/topAreas，maxFiles 240)。
2. `createGraphModuleSeedsFromRepoContexts`(`:440`/`:1597`)：从 repo context 派生 module 种子。
3. `collectGraphMapContexts`(`:441`/`:516`)：条件执行(非显式文件遍历时)，跑 `map` envelope(cycles/hotspots/majorFlows/moduleSeeds)。
4. `collectGraphModuleContexts`(`:442`/`:550`)：跑 `module` + `module-layers` envelope(dependencies/publicSurfaces/boundaryCrossings)。
5. 四个条件文件级采集(`shouldCollect*` 门控，依 queryKind)：`collectGraphFileFlowContexts`(`:670`) / `collectGraphFileSymbolsContexts`(`:727`) / `collectGraphSourceSliceContexts`(`:745`) / `collectGraphAnchorRangeContexts`(`:696`)。

**门禁/降级要点**：
- 全流程包在 `try/catch`(`:438-467`)：任一 ProjectContext 失败 → push `project-context-execution-failed` 诊断 + `trace.partial=true` + `errorCount++`，**不抛**(降级为 partial)。
- `collectGraphEnvelope`(`:792`)是每个 envelope 的统一收集器：过滤 refs(`includeProjectContextRef`)、过滤 errors(`includeProjectContextError`)、累计 `trace.refCount/errorCount/partial/requestKinds`、把 ref 转成 detailRef(`detailRefFromProjectContextRef`)和 source。
- **生成物过滤(承重降噪门禁)**：`includeGeneratedArtifactPath`(`:836`)剔除 `dist/build/node_modules/vendor/coverage/out/.turbo` 目录(`:137`)与 `.d.ts/.js.map/*.map` 后缀(`:147`)，被剔的路径计入 `trace.generatedArtifactSkipCount/Samples`。这解决「冷启动扫描把生成物当项目源」的历史噪声问题。
- `shouldSuppressDefaultProjectContextError`(`:2020`)/`isBroadRepoScanLimitDiagnostic`(`:2049`)：抑制默认探索路径下的「broad repo scan limit」类噪声诊断，除非 query 显式点名了该路径(`queryExplicitlyAsksForRepoPath`，`:2062`)。

采集完再 `dedupeDetailRefs/dedupeDiagnostics/dedupeSources/dedupeProjectContextRefs/uniqueProjectContextKinds`(`:469-473`)去重。

**节点/关系建图**(build 阶段，`:249-297`)：用两个内部小 store：
- `NodeStore`(`:2297`)：`Map<id,node>`，`add` 时 `isAllowedNodeType` 门禁(`:2306`)+ `includePath` 生成物过滤回调(`:2309`，注入自 `buildGraph`)+ 幂等去重。每个 node 挂 `detailRefId`。
- `RelationStore`(`:2324`)：`add` 时 `isAllowedRelationType` 门禁 + **两端 node 必须都存在**(`:2338`，孤儿边直接丢)+ 用 `from\0relation\0to` key 去重。fromType/toType 从 node 反查填充。

建图函数群(adapter 模式，把每种 ProjectContext 结果 shape 翻译成通用 node/relation)：`addRepoContextNodes`(`:848`，package/target/script/entrypoint/module 节点)、`addModuleContextNodes`(`:907`，ownedFiles/publicSurfaces/inflow/outflow)、`addModuleLayerContextNodes`(`:942`，fileGroups/boundaryCrossings)、`addProjectMapContextNodes`(`:976`)、`addProjectContextFileFlowEdges`(`:1006`，imports/exports/callees)、`addFileSymbolContextNodes`(`:3735`)、`addAnchorRangeContextNodes`(`:1042`)。最后 `addProjectContextPathOwnershipRelations`(`:1096`)从所有采集到的文件路径(`collectProjectContextFilePaths`，`:1222`)反推 directory→package→module→project 的 `partOf`/`ownsFile` 所有权链(`addDirectoryChain`，`:1164`；`selectBestPathOwner` 用最长前缀，`:1428`)。

#### 7.2.4 selection 分派 `selectAlembicGraph`(`:3221`)—— strategy 模式

按 queryKind 分派(`:3227` switch):
- `stats` → `selectStats`(`:2679`)：返回 node/relation 计数 + `countBy` 分类型直方图。
- `path` → `selectPath`(`:2758`)：BFS `findPath`(`:2939`)找两 nodeId 间路径。
- `impact/neighborhood` → `selectNeighborhood`(`:2698`)：从 nodeId `traverse`(`:2900`，BFS 带 depth/direction/relationType 过滤，relationLimit 80)；node 不存在 → `unavailableNodeSelection` + required next-action。
- `space/repo/map` → `selectProjectOverview`(`:3253`)：**若有非低信息 query 则转 `selectQuery`**；否则走**共享 region**(`selectRegionFromBuild` + `regionSelectionToGraphSelection`)——即结构 overview 与 recipe_map 同源。
- `module/module-layers` → `selectModuleView`(`:3267`)：无 query 走共享 region；有 query 则在 module/directory/file 节点上打分过滤。
- `file-flow/file-symbols/source-slice/anchor-range` → `selectFileView`(`:3318`)：需显式路径锚点，用 `resolveRegionFileAnchor`(与 region 同一锚点解析器)找 file node，再按 `fileViewRelationTypes`(`:3371`)取邻边。
- default / 无结构 queryKind 的通用查询 → `selectQuery`(`:2411`)。

**通用查询打分链**(检索/排序核心，落在 `selectQuery`→`selectQueryNodeMatches`→`matchGraphQueryNode`→`scoreGraphQueryNode`):
- `isLowInformationGraphQuery`(`:3105`)+ `hasFocusedGraphQuery`(`:3120`)判断：低信息查询(纯 `show me the project` 之类，`LOW_INFORMATION_GRAPH_QUERY_PATTERNS`/`LOW_INFORMATION_GRAPH_TERMS`)且无聚焦锚点 → 转 `selectProjectOrientation`(`:2624`，返回 project/package/target/module 骨架 + `projectContextRefRequiredForImpact:true` 引导)。
- `scoreGraphQueryNode`(`:2511`)：逐 term 用 `scoreGraphQueryTerm`(`:2553`)算分——变体匹配(`graphQueryTermVariants`)分 searchText / compactText / pathSegments 三档权重，弱词(`WEAK_GRAPH_QUERY_TERMS`)降权。
- `isProjectContextWeightedGraphQuery`(`:3050`)为真时叠加语义加权：`projectContextSemanticNodeBoost`(`:2578`，含 `project-context`/`sourceslice`/`/mcp/` 等路径的正加成)与 `genericRepositoryPathPenalty`(`:2607`，`/vendor/`/`repository` 负惩罚)。`rankingSignals` 记录加权原因(打分溯源，进 `GraphNodeSummary.rankingSignals`)。

`GraphSelection`(`:2359`)是四类选择器的统一中间结构(loose `Record<string,unknown>` items/relations/result + 可选 diagnostics/nextActions)——注释里叫「the loose GraphSelection that alembic_graph projects from」(`:2253`)。

#### 7.2.5 输出投影 `projectAlembicGraphOutput`(`:3443`)

把 `GraphSelection` + `GraphBuild` 收口成 `AlembicGraphOutput`：
- 按 `budget.itemLimit/detailLimit/relationHopLimit` 裁剪 nodes/refs/relations(`:3451-3457`)。
- `sliceOutputForQueryKind`(`:3652`)：仅 `source-slice`/`anchor-range` 附源码 slice。
- 诊断合并去重(`dedupeGraphDiagnostics`，`:3705`)+ `resultSignalGraphDiagnostics`(`:3562`，把 selection.result 里的 noMatchReason 提升为诊断)。
- `deriveGraphStatus`(`:3578`)= **状态机**：partial(build.partial/missing/noMatch/…) > degraded(errorCount>0) > ready。
- `deriveGraphNextActions`(`:3597`)：按 missing 字段(nodeId/filePath/fromId/toId)产 required 引导 action + 通用 `stats` 建议；`dedupeGraphNextActions` 后按 `nextActionLimit` 截断。
- 最终 `AlembicGraphOutputSchema.parse(...)`(`:3472`)——契约 parse 是唯一出口(fail-closed)。
- `failedAlembicGraphOutput`(`:3663`)是异常路径的 fail-safe 输出(status=failed，errorCount=1)。

#### 7.2.6 共享 region 投影(`:3798` 段，GMAP-3)

`resolveProjectContextRegion`(`:222`)→ `regionBuildInput`(`:3870`，把 focus 翻成 build input)→ `buildGraph`(同一采集引擎)→ `selectRegionFromBuild`(`:3898`)→ `projectProjectContextRegion`(`:4159`)。

`selectRegionFromBuild`(`:3898`)按 focus.kind 分派：`module`→`moduleRegion`(`:3957`)、`file/anchor/symbol`→`fileRegion`(`:3996`)、其余→`overviewRegion`(`:3912`)。
- `overviewRegion`：按 `overviewRegionPreferredTypes`(`:3940`，space→project/package，repo→+target/file)取节点，`orientationNodeWeight` 排序，REGION_NODE_LIMIT=40(`:3811`)。
- `fileRegion`：`resolveRegionFileAnchor`(`:4060`，refId→node→ref.filePath→file node 多级解析)找锚点 file node，取其邻边(REGION_RELATION_LIMIT=60)。无锚点/锚点不可用 → 诊断型空 region。
- `buildRegionParentMap`(`:4112`)从 `partOf` 关系推父链(取最长路径父)；`regionBreadcrumb`(`:4139`)沿父链构建面包屑。
- `projectProjectContextRegion`(`:4159`)：`regionNodeFromGraphNode`(`:4202`，附 childCount/parentNodeId/projectContextRef=detailRefId)+ `regionKindFromNodeType`(`:4233`，nodeType→RegionNodeKind 映射)+ `refs` 取前 80 + `ProjectContextRegionSchema.parse` 收口。

**关键往返保证**：graph 结构 overview(`selectProjectOverview`)与 recipe_map region 用**同一 `selectRegionFromBuild`**(经 `regionSelectionToGraphSelection`，`:4265`,把 typed region 桥接回 loose GraphSelection),因此两工具对同一 focus 落在同一 node/ref——契约层承诺的 refId↔focus 免费往返的物理保证。

---

### 7.3 recipe-map/ — 确定性 Recipe 挂载引擎(GMAP-4/6/7)

`RecipeMapProvider.resolveRecipeMap(request, deps)`(`recipe-map/RecipeMapProvider.ts:65`)是编排器：把共享 region + `recipe_source_refs`/metadata 编成 `AlembicRecipeMapOutput`。**依赖注入**(`RecipeMapDeps`，`:54`):`resolveRegion` / `querySourceRefs` / `listRecipes` 三个函数由 handler 注入真实实现(见 crossLinks recipe-map.ts),使引擎**无需 DB 或 MCP 表面即可单测**。头注释(`:1-7`)强调「never calls another MCP tool」。

#### 7.3.1 挂载编排 `resolveRecipeMap`(`:66`)与 `collectRecipeMounts`(`:231`)

流程：
1. `deps.resolveRegion(focus, projectRoot)` 取共享 region(异常→`failedRecipeMapOutput`，`:73`/`:561`)。
2. `buildRegionIndex(region)`(`mounting.ts:158`)建节点索引(byId / ancestorsOf / nodeForPath / lca)。
3. `collectRecipeMounts`(`:231`)：
   - `deps.querySourceRefs({pathPrefix})` 取 `recipe_source_refs` 行(`regionScopePrefix`，`:458`，按 region root path 收窄)。
   - `deps.listRecipes()` 取轻量 Recipe 记录(`RecipeRecordLite`，无 body)。
   - **候选集** = 有 refs 落在 region scope 的 code recipe **∪** 适用于该 focus 的 global/metadata no-code recipe(`noCodeRecipeAppliesToRegion`，`:346`)**∪** record 自带 source 的 fallback(`recordFallbackRefsApplyToScope`，`:328`,置 `usedRecordSourceFallback`)。
   - 逐候选 `selectMountTarget`(`mounting.ts:282`)算挂载决策；**只保留落在 region 可见节点上的挂载**(`index.byId.has(decision.mountNodeId)`，`:280`)。
   - **deferred rollup 规则**(`:284-293`)：`source-ref-nearest-node` 且挂到 region root 且 ref 有真实 filePath 的 code recipe → 不作为直接挂载，转为**后代 rollup 计数**(避免把区域外深层 recipe 当本地证据倾倒)。
4. `mounts.sort(compareMounts).slice(0, recipeMountLimit)`(`:89`，`compareMounts` 见 mounting.ts:499)。
5. `usedRecordSourceFallback` 时 `suppressResolvedSourceRefMissDiagnostics`(`:551`)去掉「No source refs matched」误报。
6. `buildRollups`(`:380`)算每节点 direct/descendant recipe 计数(区域外 deferred 归到 root)；`projectRegionNodes`/`mapNodeSummary`(`:437`)给每个 region node 附 rollup 计数。
7. `deriveStatus`(`:499`)状态机：有 error→degraded；truncated/有诊断/有 degraded 挂载→partial；否则 ready。
8. `budgetRecipeMapOutput`(`:141`)预算裁剪(见 7.3.2)。

#### 7.3.2 预算裁剪(承重 token 预算)`budgetRecipeMapOutput`(`:141`)

阈值 `RECIPE_MAP_INLINE_BUDGET_BYTES = 20*1024`(`:63`)。逻辑(与 Core `@alembic/core/service/planFacts` 协作,消费 `jsonByteLength`/`writeTransientTransport`/`removeTransientTransportIfPresent`/`TransientTransportRef`，`:9-14`):
- inline JSON ≤ 20KB → 直接返回，清掉可能残留的旁路文件(`:147`)。
- 超预算 → `writeTransientTransport` 把**完整 map 落盘**得 `fullMapRef`(旁路 transport)→ `compactRecipeMapOutput` 削减每挂载的 sourceRefs/matchedRefs → `trimRecipeMapOutputToBudget`(`:190`)阶梯式收窄(refsPerMount 8→2→0，再逐级 cap nodes/refs/rollups/diagnostics)直到达标。`meta.fullMapRef` 指向落盘全量,agent 按需再取。

这是本层与「大对象不塞进 MCP 结果」这一平台约束的对接:compact 投影 inline + detailRef/transportRef 旁路展开。

#### 7.3.3 `mounting.ts` — 确定性挂载算法(GMAP-6)

头注释(`mounting.ts:1-8`)：挂载**只用 `recipe_source_refs` + 显式 metadata，绝不用语义/关键词搜索**(即便有 search/vector lane)。挂载目标对着共享 region 选(LCA via region parentage)。

- `normalizeRecipeRef`(`:74`)：解析 `path` / `path:10` / `path:L10` / `path:10-20` / `path#L10`(`parseRefPath`，`:101`；`parseLineSpec`，`:127`);无 filePath 的 ref 标为 `metadata-only`。
- `buildRegionIndex`(`:158`)：`byId` 节点表 + `ancestorsOf`(沿 parentNodeId 上溯,防环 seen+64 上限) + `nodeForPath`(精确路径优先 `pathMountRank` 选 file 而非同路径 symbol,否则最长前缀 owner) + `lca`(多节点求最近公共祖先,交集 ancestor 链)。
- `selectMountTarget`(`:282`)—— **确定性状态机**,按 refs 状态分支产 `MountDecision`:
  - 无 code ref → `metadataOnlyDecision`(`:388`):global/architecture scope→`global-no-code` 挂 root;有 moduleName 且解析到→`metadata-scope`;否则 root + 诊断。
  - 有 code ref 但无 live(全 stale/unresolved)→ `degraded-stale`/`degraded-unresolved` 挂最近可见节点。
  - 单节点命中 → `singleRefMountType`(`:443`):exact file + range→`source-range`;+ line→`source-line`;file→`source-file`;非精确→`source-ref-nearest-node`。
  - 多节点 → `index.lca` → `multi-ref-common-ancestor`(同 repo)或 `cross-repo-common-ancestor`(`isCrossRepo`，`:465`,跨 repo)。
  - stale/unresolved ref 产 `recipe-stale-ref`/`recipe-unresolved-ref` 诊断(`:292`)。
- `compareMounts`(`:499`)/`mountSortKey`(`:490`)：确定性排序(mountType 具体度 → 节点 kind 具体度 → title → recipeId)。`MOUNT_TYPE_ORDER`(`:477`)定义挂载类型优先级(source-range/line 最优,degraded 最劣)。

设计模式:**strategy(挂载分支)+ registry(RegionIndex)+ pure-function state-machine**。

---

### 7.4 retrieval/ — 知识/Recipe 检索 provider(search 链)

这一层是 `alembic_search` 的**服务侧算法内核**,但**不直接消费 Core**——真正的 Core `SearchEngine`/resident-search 调用在 handler(`lib/runtime/mcp/handlers/search.ts`)里;retrieval provider 接收 handler 喂入的 candidate 池 + 证据,做打分/重排/详情/展开/关系链。多数是「interface + Default 实现」的 DI 单元。

#### 7.4.1 检索接口与数据模型

- `KnowledgeRetrievalItem`(`retrieval/KnowledgeRetrievalProvider.ts:1`)= 检索项统一 shape(id/title/summary/score/scoreBreakdown/whyMatched/relations/vector/resident/metadata…)。是本层所有检索 provider 的通用货币。
- `SearchProvider`(`retrieval/SearchProvider.ts:3`)/`KnowledgeRetrievalProvider`(`:34`)/`RecipeCandidateProvider`(`retrieval/RecipeCandidateProvider.ts:6`)/`VectorRerankProvider`(`retrieval/VectorRerankProvider.ts:3`)/`RecipeRelationChainProvider`(`retrieval/RecipeRelationChainProvider.ts:8`)/`KnowledgeDetailProvider`(`retrieval/KnowledgeDetailProvider.ts:13`)/`ContextExpansionProvider`(`retrieval/ContextExpansionProvider.ts:10`)= 七个能力接口。

#### 7.4.2 `DefaultRecipeCandidateProvider`(`RecipeCandidateProvider.ts:13`)—— candidate 打分

`listRecipeCandidates`(`:16`):对注入的 items 逐个 `scoreCandidate`(`:44`)→ 过滤 `filterMatch!==false` → 按 score 降序(tie-break id)→ `slice(limit)`。
- `scoreCandidate`(`:44`):把 id/title/summary/trigger/kind/category/metadata 拼成 searchText → `tokenize`(`:170`,Unicode 词 + ≥2 长度 + 上限 40)算 query/keyword 命中 → `derivedScore = baseScore + queryHits*0.08 + keywordHits*0.05`(`:89`)。
- 多维过滤(`stringFilterMatch`/`tagFilterMatch`):language/kind/category/dimensionId/knowledgeType/scope/tags 全 match 才 `filterMatch=true`。
- `scoreBreakdown` 记录逐维 match 布尔 + hit 计数;`whyMatched` 记录 `query:N`/`keywords:N`/`filter:*` 标签(打分溯源,`filterMatchLabels`，`:144`)。

#### 7.4.3 `DefaultVectorRerankProvider`(`VectorRerankProvider.ts:20`)—— 语义重排

`rerank(query, items, limit, evidence)`(`:21`):
- 从 `evidence.scoreBreakdown` 抽 `{itemId→finalScore}` map(`:27`,即 handler 喂入的向量/resident 最终分)。
- 逐 item:有向量分则用之覆盖 baseScore(`vectorScore ?? baseScore`，`:40`),否则保底本地分;把 `vectorEvidence`/`vectorUsed` 写进 scoreBreakdown、`vector.{available,residentVector,semanticUsed,used}` 写进 vector 字段、命中项 `whyMatched` 加 `vector-rerank`。
- 按 score 降序 slice(limit)。**注意**:provider 自身不算 embedding,只**消费 handler 传入的向量证据**做覆盖式重排(真正的语义检索/embedding 在 Core 侧,由 resident-search/Ollama 决定,见仓库记忆 embed-provider-missing)。

#### 7.4.4 详情/展开/关系链

- `DefaultKnowledgeDetailProvider`(`KnowledgeDetailProvider.ts:17`):从 items 池按 refId(剥 `detail:`/`knowledge:` 前缀多路匹配,`:20`)取单条 `KnowledgeDetail`——**detailRef 分级加载的展开端**(compact 结果只带 detailRefId,agent 再用 `operation=get` 经此展开)。
- `DefaultContextExpansionProvider`(`ContextExpansionProvider.ts:14`):`expandContext(refId, contentCharLimit)` 经 detailProvider 取详情后 `trimText` 到字符预算(`operation=expand` 后端)。
- `DefaultRecipeRelationChainProvider`(`RecipeRelationChainProvider.ts:22`):`expandRecipeRelationChains(refId, maxHops)` 从 items/显式 edges 收集关系边(`collectEdgesFromItems`/`collectExplicitEdges`,多 shape 兼容读),BFS 扩展关系链(fanout 上限、防环);`scoreImpactForRelation`(`:167`)把 `conflicts/deprecated_by/alternative/replaced_by` 标为 `neutral-or-caution`,其余 `positive`(给 agent 关系正负向提示)。

#### 7.4.5 retrieval 与 handler 的接线(消费点)

`lib/runtime/mcp/handlers/search.ts` 是这些 provider 的唯一组合点:
- Core 消费:`@alembic/core/search`(`SearchEngine` 动态 import、`groupByKind`/`slimSearchResult`、`resolveSearchWorkspaceIdentity`)、`@alembic/core/vector`(`RECIPE_SEMANTIC_REGION_METADATA_TYPE`)、`@alembic/core/workspace`(`resolveProjectRoot`)。
- 组合:`new DefaultRecipeCandidateProvider(candidates)` → `new DefaultKnowledgeDetailProvider(candidates)` → `new DefaultContextExpansionProvider(detailProvider)`;resident-search meta / residentVector / scoreBreakdown 作为 `VectorRerankProvider` 的 evidence。

---

### 7.5 support/ — 横切工具(budget / ref / rank / cache / trace)

- `ContextBudgeter`(`support/ContextBudgeter.ts:26`)：token/条数预算裁剪器。`normalize(budget)`(`:27`,经 `KnowledgeContextBudgetSchema.parse` 填默认)、`trimArray`(`:40`,带 originalCount/truncated)、`trimText`(`:50`,超限截断 + trimEnd)。`BudgetedArray`/`BudgetedText` 都带 truncated 标志——**预算裁剪与截断可观测性**的载体。单例 `defaultContextBudgeter`(`:67`)。
- `RefRegistry`(`support/RefRegistry.ts:22`)：detailRef 工厂。`createDetailRef`(`:23`)生成稳定 id `${domain}:${operation}:${stableRefSegment(id)}`(截 240),带 `requiredForCompletion` 分级标志——**detailRef 分级加载的 id 生成端**。`stableRefSegment`(`:40`)是全层通用的 id 规范化器(小写/非法字符替横线/截 160),被 graph/recipe-map/identity 广泛复用。单例 `defaultRefRegistry`(`:50`)。
- `ResultRanker`(`support/ResultRanker.ts:7`)：稳定排序器,score 降序 + id tie-break(`:9`)。单例 `defaultResultRanker`。
- `ContextCache<T>`(`support/ContextCache.ts:8`)：内存派生视图缓存(`Map`,每 entry 标 `derivedView:true`)——纯 in-memory,无 TTL/无驱逐(轻量,当前消费面窄)。
- `ScoreTrace`(`support/ScoreTrace.ts:8`)：**打分溯源结构**。`createScoreTrace(entries)`(`:13`)聚合 `{label,reason,score,sourceRef?}` 明细并求 totalScore——把「为什么这个分」做成可复核记录(与 graph 的 rankingSignals、candidate 的 scoreBreakdown/whyMatched 一起构成全链打分溯源)。

设计模式:全部是**无状态工具 / value-object + 单例**,不持有业务状态,可跨工具复用。

---

### 7.6 数据流总览(跨层边界)

**alembic_graph 链**：
```
handler → ProjectContextProjectGraphProvider.resolveAlembicGraph(input)
  → normalize/preflight 门禁
  → buildGraph → buildProjectContextGraphFacts
        → ProjectContextCapabilities.execute(@alembic/core)  ← 唯一 Core 计算消费
        → collectGraphEnvelope(过滤生成物/去噪) → NodeStore/RelationStore 建图
  → selectAlembicGraph(strategy: stats/path/impact/module/file/region/query)
  → projectAlembicGraphOutput → AlembicGraphOutputSchema.parse → CallToolResult
```

**alembic_recipe_map 链**(复用 graph 的 region):
```
handler(注入 deps) → RecipeMapProvider.resolveRecipeMap
  → deps.resolveRegion = GraphProvider.resolveProjectContextRegion  ← 共享 region(同源)
  → buildRegionIndex + collectRecipeMounts(deps.querySourceRefs/listRecipes)
  → mounting.selectMountTarget(确定性,只用 source_refs+metadata)
  → buildRollups + deriveStatus + budgetRecipeMapOutput(超 20KB → planFacts 落盘旁路)
  → AlembicRecipeMapOutputSchema.parse
```

**alembic_search 链**(算法在 retrieval,Core 调用在 handler):
```
handler → @alembic/core SearchEngine + resident-search(向量证据)
  → DefaultRecipeCandidateProvider.scoreCandidate(query/keyword/filter 打分)
  → DefaultVectorRerankProvider.rerank(消费向量 evidence 覆盖分)
  → ResultRanker/ContextBudgeter 裁剪 → detailRef(RefRegistry) 化
  → operation=get/expand 经 KnowledgeDetailProvider/ContextExpansionProvider 展开
  → AlembicSearchOutputSchema.parse(summary 逐字门禁)
```

### 7.7 边界 / 坑 / 兼容层 / 已知历史包袱

- **GMAP 迁移遗产**:大量 `GMAP-*` 注释是历史迁移标记。核心结论:统一 `KnowledgeContextToolOutput` 信封已退役(GMAP-8c),四工具各自 own schema;`alembic_project_matrix` 已被 `recipe_map` 取代(但 `KNOWLEDGE_CONTEXT_TOOL_NAMES` 枚举仍留残影,`KnowledgeContextStatus.ts:6`)。
- **legacy 输入兼容层**:`ProjectGraphInputSchema` 的 `operation/nodeId/fromId/toId/direction/relationType/maxDepth` 只在 `normalizeGraphProviderInput`/`resolveGraphQueryKind` 边界归一化 stale 宿主参数,**不是第二条行为分支**(`KnowledgeContextBaseInput.ts:158-162`)。
- **god-file 债**:`ProjectGraphProvider.ts` ~4289 行,一个 class + 上百纯函数,是本层最大的可维护性负担。
- **process.cwd() 降级坑**:`resolveAlembicGraph`(`:188`)与 `resolveProjectContextRegion`(`:226`)无 root 时回落 `process.cwd()`;MCP server cwd 未必是用户项目根,必须由 handler 传对 projectRoot(参见工作区记忆里 root-resolution 历史问题)。
- **生成物过滤门禁**:`GENERATED_ARTIFACT_*`(`:137`/`:147`)剔除 dist/build/node_modules/vendor/map/d.ts;误配会让冷启动扫描把生成物当源(历史噪声源)。
- **降级路径**:ProjectContext 执行失败不抛,降级为 partial/degraded 并产诊断;file 锚点缺失/node 不存在都走「诊断型空 selection + required next-action」而非报错——**fail-soft + 明确回引导**。
- **预算旁路**:recipe_map 超 20KB 走 `@alembic/core/service/planFacts` 落盘 `fullMapRef`;若 planFacts 落盘失败会影响 fullMap 可得性(inline compact 仍返回)。
- **retrieval 不算语义分**:`VectorRerankProvider` 只覆盖 handler 喂入的向量证据,自身不做 embedding;真正语义检索依赖 Core resident-search + Ollama,缺 embed provider 时语义 lane 静默跳过(见记忆 embed-provider-missing)。
- **双宿主收敛**:`KNOWLEDGE_CONTEXT_AGENT_HOSTS` 只剩 `codex`/`claude-code`(RC-5,`KnowledgeContextStatus.ts:29`),删除了无消费者的 future-host stub;host 名不进入本计算层的行为分支(host 差异由上层 runtime 处理)。


---

## 8. 模块/技能/常驻/任务/演化服务层

本节测绘 `lib/service/**` 下的核心业务服务子域：模块发现（ModuleService）、
host-managed 边界、项目技能生成与交付（ProjectSkillService / SkillHooks）、
常驻服务客户端（AlembicResidentServiceClient 及其 capability 封装）、prime 组装
管线（PrimeSearchPipeline / PrimeKnowledgeMaterial）、任务生命周期策略
（TaskLifecyclePolicy / host-turn-meta）、本地向量（LocalEmbedding）、清理服务
（CleanupService）、bootstrap 事件/任务（BootstrapEventEmitter / BootstrapTaskManager）、
文件变更演化触发（FileChangeDispatcher / FileChangeHandler / git-diff-checkpoint）、
以及 Recipe 新鲜度运行时（RecipeFreshnessRuntime）。

这些服务是 MCP handler 层（`lib/runtime/mcp/handlers/*`）与 `@alembic/core` 共享
内核之间的**适配/编排层**。它们的共同姿态：Plugin **不执行本地第三方 AI 提取**，
只做确定性扫描、检索组装、生命周期决策和边界标注；语义增强（Recipe 生成、候选
提交）交给 Codex host agent 或 Alembic resident service（daemon-less 后为本地
Alembic 常驻服务 HTTP 面）。

一个关键的历史结构事实：本子域内多个「文件」是 **RG9 兼容 re-export shim**（把
`#service/*` 旧导入路径转发到真实实现所在的 `#recipe-generation/*`）。承重实现
已经迁到 recipe-generation 域，这些 shim 只维持导入稳定，移除条件是消费者全部
切换。本节明确标注每个文件是承重还是 shim。

---

### 8.0 子域文件承重/shim 全景表

| 文件 | 角色 | 承重? |
| --- | --- | --- |
| `lib/service/module/ModuleService.ts` | ProjectContext-backed 模块/扫描服务脊柱 | 承重（1353 行） |
| `lib/service/module/host-managed-boundary.ts` | host-agent-managed / plugin-deterministic 边界标注工厂 | 承重（薄，106 行） |
| `lib/service/skills/ProjectSkillService.ts` | Project Skill 唯一写入面（source + runtime 投影） | 承重（795 行） |
| `lib/service/skills/SkillHooks.ts` | Skill 生命周期钩子管理器 v2 | 承重（426 行） |
| `lib/service/skills/types.ts` | Hook 系统类型 | 承重（薄） |
| `lib/service/resident/AlembicResidentServiceClient.ts` | 常驻服务 HTTP 客户端（search/jobs/project-scope/probe） | 承重（2202 行） |
| `lib/service/resident/AlembicResidentCapabilityClients.ts` | 按能力拆分的 facade 封装 | 承重（薄，95 行） |
| `lib/service/task/PrimeKnowledgeMaterial.ts` | prime 信任姿态/收据组装（trust posture） | 承重（1339 行） |
| `lib/service/task/PrimeSearchPipeline.ts` | prime 检索适配器（单查询质量过滤） | 承重（158 行） |
| `lib/service/task/TaskLifecyclePolicy.ts` | Codex-aware task 生命周期决策（纯函数策略） | 承重（541 行） |
| `lib/service/task/host-turn-meta.ts` | host turn-metadata / host-declared-intent 输入类型 | 承重（薄，102 行） |
| `lib/service/vector/LocalEmbedding.ts` | **RG9 shim** → `#recipe-generation/vector/LocalEmbedding.js` | shim（3 行） |
| `lib/service/cleanup/CleanupService.ts` | 数据清理策略（垃圾桶模式 + fail-closed reset） | 承重（853 行） |
| `lib/service/bootstrap/BootstrapEventEmitter.ts` | **RG9 shim** → `#recipe-generation/bootstrap/BootstrapEventEmitter.js` | shim（7 行） |
| `lib/service/bootstrap/BootstrapTaskManager.ts` | **RG9 shim** → `#recipe-generation/bootstrap/BootstrapTaskManager.js` | shim（4 行） |
| `lib/service/evolution/FileChangeHandler.ts` | **RG9/P12 rename shim** → `#recipe-generation/evolution/FileChangeHandler.js` | shim（4 行） |
| `lib/service/evolution/git-diff-checkpoint/index.ts` | **RG9 shim** → `#recipe-generation/evolution/git-diff-checkpoint/index.js` | shim（4 行） |
| `lib/service/FileChangeDispatcher.ts` | 文件变更派发接口（纯 interface） | 承重（契约，6 行） |
| `lib/service/knowledge/RecipeFreshnessRuntime.ts` | Recipe 新鲜度公共编排（sourceRefs + vector sync） | 承重（549 行） |
| `lib/repository/skills/ProjectSkillKnowledgeRepository.ts` | knowledge_entries 计数（只读 SQLite） | 承重（薄，43 行） |

---

### 8.1 ModuleService — 模块发现脊柱

`lib/service/module/ModuleService.ts` 是本子域最大的承重类。它保留了历史
ModuleService API（HTTP/MCP 调用方仍在用），但 **PCI cleanup 后**其项目信息来源
已从旧 Core discoverer registry 换成 `ProjectContextCapabilities.execute(...)`
（`@alembic/core/project-context-capabilities`）。项目、target、模块、依赖、文件
事实全部来自 ProjectContext 引擎。（文件头注释 `ModuleService.ts:1-8`）

#### 8.1.1 生命周期与状态（lazy load / cache）

- 私有字段：`#projectRoot`、`#repoContext: RepoContext|null`、`#mapContext: ProjectMap|null`、
  `#targets: TargetInfo[]`、`#moduleFileCache: Map<string, FileInfo[]>`、`#loaded`
  （`ModuleService.ts:135-142`）。
- 构造器接收 `projectRoot` + options（`container` / `qualityScorer` / `recipeExtractor` /
  `guardCheckEngine` / `violationsStore`），除 guard 相关外多为历史保留字段
  （`ModuleService.ts:149-165`）。
- `load()`（`ModuleService.ts:171-199`）是核心装载：
  1. `#executeProjectContext('repo', { includeMapSummary, maxFiles: 2000 })` 取
     RepoContext，用类型守卫 `isRepoContext` 校验（`ModuleService.ts:176-181`、`1242-1244`）。
  2. `#targetsFromRepo` 把 RepoContext 投成 `TargetInfo[]`（`754-776`）。
  3. `#moduleSeedsFromRepo` 生成模块种子（去重 + slice 24），若非空则再
     `#executeProjectContext('map', { moduleSeeds, repoName })` 取 ProjectMap
     （`183-190`、`828-862`）。
  4. 空 targets 打 warn，非空打 info（`192-197`）。
- `reload()` 清空全部缓存并重新 load（`201-208`），`updateModuleMap()` 转发到
  reload 并返回统计（`656-668`）。`#ensureLoaded()` 是所有 query 的懒加载前置门
  （`210-214`）。

#### 8.1.2 查询 API（ProjectContext-backed）

- `listTargets()`：返回 `#targets` 浅拷贝（`220-223`）。
- `getTargetFiles(target)`（`225-255`）：
  - `folder-scan` 特例：`discovererId === 'folder-scan'` 且 path 存在 → 走
    `#collectFolderFiles`（本地目录遍历），不查 ProjectContext（`233-239`）。
  - 否则 `#moduleSeedFromTarget` 生成种子 → 以 `JSON.stringify(seed)` 为缓存 key，
    命中 `#moduleFileCache` 直接返回，否则 `#queryModuleFiles`（`241-254`）。
- `getDependencyGraph({level})`（`257-294`）：优先用 `#mapContext.modules` 生成
  nodes，否则回落到 `#targets`；edges 从 `#mapContext.majorFlows` 展开（每条 flow
  的 refs[0] 连向 refs[1..]），带 `source: 'project-context'` 标签。
- **`listCanonicalModules()`（`302-319`）是 U1 #5 / RF-9 的 canonical 模块轴只读
  投影**——这是与 RecipeProductionGateway 和覆盖账本的关键契约点。把
  ProjectMap.modules 投成 `{id, name, path, ownedFiles}`：`path` 取自
  `module.ref.scope.filePath`（ProjectMap 权威坐标），`ownedFiles` 来自
  ProjectContext module 查询。ProjectMap 为空时降级到
  `#fallbackCanonicalModulesFromRepo`（`321-421`）——从 targets（`target:name:path`
  id 前缀）或 localPackages/sourceRoots/topAreas 派生，带 `moduleIdentityKey`
  归一化、`hasMoreSpecificModulePath` 去嵌套、`safeRealPath` 去 symlink 重复。
  这个 fallback 的 id 派生策略（`target:${name}:${modulePath}`）正是 MEMORY 中
  R-1「双宿主 module-id 派生未真统一」的一侧。

#### 8.1.3 扫描（不做本地 AI 提取，只交付文件 + Guard）

- `scanTarget()`（`451-520`）：加载 target 文件 → 读内容 → 但**明确不做 recipe
  提取**，返回 `recipes: []` + `noAi: true`，并通过 `attachHostAgentManagedBoundary`
  贴上 `module-target-scan` 边界。message 直接写死「AlembicPlugin 只返回模块文件
  扫描结果，不执行本地 AI 提取」（`504-513`）。
- `scanProject()`（`522-654`）：遍历所有 target 收集去重文件（MAX_FILES 默认 200），
  若 ProjectContext 无文件则回落 `#walkProjectForFiles`（扫 Sources/src/lib/... 等
  硬编码源目录，`1159-1239`）。**Guard 审计是唯一真实执行的分析**：若注入了
  `#guardCheckEngine` 则 `engine.auditFiles(files, {scope:'project'})`，违规写入
  `#violationsStore.appendRun`（`602-637`）。同样贴 `module-project-scan` 边界并
  声明 `recipes: []`。
- `scanFolder()`（`693-726`）：构造 `isVirtual + discovererId:'folder-scan'` 的
  虚拟 target，委托给 scanTarget。`browseDirectories()`（`674-691`）用
  `#walkDirsForBrowse` 浅层浏览目录并统计源文件数。

#### 8.1.4 ProjectContext 消费点与设计模式

- **facade/adapter**：整个类是对 `ProjectContextCapabilities.execute` 的门面。
  `#executeProjectContext(kind, payload)`（`736-752`）统一封装 project + scope
  参数，三种 kind：`'repo'`/`'map'`/`'module'`。
- **strategy + fallback**：canonical 模块有 map / target-derived / repo-derived
  三级回退；扫描有 ProjectContext-files → directory-walk 回退。
- **过滤/白名单**：`SCAN_EXCLUDE_DIRS`（含 `Alembic` 本身，`35-59`）+
  `SOURCE_CODE_EXTS`（`62-85`）是所有目录遍历共享的门禁。
- Core 消费：`@alembic/core/host-agent-workflows`（`inferLang`）、
  `@alembic/core/logging`、`@alembic/core/project-context`（类型）、
  `@alembic/core/project-context-capabilities`（`ProjectContextCapabilities`）。
- 消费方：`lib/runtime/mcp/handlers/structure.ts`、`.../guard.ts`、
  `lib/injection/modules/AppModule.ts`、`lib/injection/ServiceMap.ts`。

### 8.2 host-managed-boundary — 能力边界标注工厂

`lib/service/module/host-managed-boundary.ts`（106 行，承重薄工厂）定义两个
canonical code 常量与三个纯函数，用于给任意 payload 贴上「谁负责语义增强」的
可复核边界元数据：

- `HOST_AGENT_MANAGED_CODE = 'HOST_AGENT_MANAGED'`、
  `PLUGIN_DETERMINISTIC_EXTRACT_CODE = 'PLUGIN_DETERMINISTIC_EXTRACT'`（`:1-2`）。
- `attachHostAgentManagedBoundary(payload, context, note?)`（`:69-86`）：注入
  `hostAgentManaged:true`、`boundaryCode`、`canonicalCode`、
  `managedBy:'codex-host-agent-or-alembic-resident-service'`，且
  `localAi/localAiProvider/pluginAiProvider` 全为 `false` 字面量类型。这是
  ModuleService 扫描返回的边界来源。
- `attachPluginDeterministicBoundary(...)`（`:88-105`）：用于「Plugin 做确定性提取，
  语义增强仍外包」的场景，贴 `deterministicPluginExtract:true`。
- `makeHostAgentManagedError(message)`（`:60-67`）：构造带 boundaryCode 的错误对象，
  供 handler 在拒绝本地 AI 请求时返回。
- 设计：**registry/factory**（`makeBoundary` `:41-58` 统一构造 CapabilityBoundary），
  类型层用字面量 `false` 强制「无本地 AI provider」不变量，编译期即拦截违规。

---

### 8.3 ProjectSkillService — project skill 唯一写入面

`lib/service/skills/ProjectSkillService.ts`（795 行，承重）是 **AP-KS-1 后唯一的
skill 写入面**。核心不变量（类注释 `:84-88`）：

- **source 永远写到 `dataRoot/Alembic/skills`**（经 `getProjectSkillsPath(dataRoot)`，
  `sourceRoot()` `:566-568`）；
- **Codex runtime 永远通过 `.agents/skills` symlink 投影**（经
  `getProjectSkillRoot(projectRoot)`，`runtimeLocation` `:423-426`）；
- 这里**不接 SkillHooks，也不改 tool visibility**。

#### 8.3.1 三源定位（builtin / project-source / codex-runtime）

`SkillLocation.source` 有三种（`:48-56`）。`effectiveLocation(name)`（`:411-421`）
的优先级：**runtime > project-source > builtin**——即项目技能同名覆盖内置技能
（`list()` hint `:127` 明说 intentional override）。`buildLocation`（`:584-600`）
统一探测 `SKILL.md` 是否存在（`exists`）和 marker 文件是否存在（`managed`，
`PROJECT_SKILL_MARKER_FILE`）。三个源根：`PACKAGE_SKILLS_DIR`（内置，
`#shared/package-assets.js`）、`sourceRoot()`、`getProjectSkillRoot()`。

#### 8.3.2 CRUD + 运行时导出

- `list()`（`:92-130`）：合并三源目录，`effective` 按名字排序取 effectiveLocation。
- `load(args)`（`:132-162`）：读 effective SKILL.md，可选 `extractSection`（正则
  切 `## <section>` 块，`:575-582`），`parseSkill` 解析 frontmatter。
- `upsert(args)`（`:164-250`）：**核心写入路径**。
  - 名字校验 `validateSkillName`（kebab-case，3-64 字符，`:724-735`）。
  - overwrite=false 且已存在 → `ALREADY_EXISTS` 失败（`:179-184`）。
  - 用 `buildSkillDocument` 构造带 frontmatter 的 markdown（name/title/description/
    createdBy/createdAt/updatedAt，`:602-623`），`writeSourceSkill` 写 source。
  - 写 sidecars（`skill.meta.json` + `delivery-receipt.json`，`:491-502`）。
  - **只有 `authorizeProjectSkillExport=true` 才导出到 Codex runtime**：调
    `exportProjectSkillReceiptToRuntime(ctx, {receipt, authorize:true,
    grantedBy: HOST_AGENT_SOURCE, overwriteManaged})`（`:223-230`，来自
    `#codex/ProjectSkillDelivery.js`）。success 取决于
    `runtimeExportStatus === 'exported'`，否则 errorCode=`PROJECT_SKILL_EXPORT_BLOCKED`。
- `delete(args)`（`:252-284`）：删 source + 删 managed runtime 投影；
  `removeManagedRuntimeExport`（`:538-556`）**只删 marker `managedBy==='alembic'`
  的投影**，且 `pathGuard.addProjectWritePrefix('.agents')` +
  `assertProjectWriteSafe` 做写安全门禁。内置技能只读、永不删（`:280-281`）。
- `export(args)`（`:286-320`）：独立导出入口，receipt 来源优先级：入参 receipt →
  stored receipt → 从 source 重建（`:288-297`）；导出成功回写 stored receipt。

#### 8.3.3 knowledge-scoped 技能自动刷新

`refreshKnowledgeSkills(args)`（`:322-381`）是 bootstrap/rescan 后自动生成
「知识依赖型技能」的入口。`KNOWLEDGE_DEPENDENT_SKILLS = ['alembic-recipes',
'alembic-guard', 'alembic-structure', 'alembic-create']`（`:77-82`）：

- `collectKnowledgeScope()`（`:383-409`）判定项目是否有本地知识库：扫
  `dataRoot/Alembic/candidates` + `recipes` 下的 knowledge markdown
  （`collectKnowledgeMarkdown`，排除 readme/template，`:658-682`），并调
  `countProjectSkillKnowledgeEntries(dataRoot)` 数 DB 条目。
  `hasKnowledgeBase = databaseEntries > 0 || markdownFiles.length > 0`。
- **无知识库时**：删掉这 4 个 runtime 投影（避免空项目误挂技能），返回
  `hasKnowledgeBase:false`（`:327-345`）。
- **有知识库时**：对每个模板用 `buildKnowledgeScopedSkill`（`:625-656`，把当前
  scope 的 projectRoot/dataRoot/reasons/entries 数注入技能正文）生成内容，
  upsert（`overwrite:true`, `createdBy:'system-ai'`, 默认授权导出）。

#### 8.3.4 写安全与 DI（WriteZone 抽象）

所有写操作走 `writeDataFile`（`:758-775`）：优先用注入的
`ctx.container.singletons.writeZone`（Core `WriteZone`，Ghost/外置工作区抽象），
否则回落 `pathGuard.assertProjectWriteSafe` + `fs.writeFileSync`。
`relativeToDataRoot`（`:777-783`）确保路径不越出 dataRoot（`..` 抛错）。
Core 消费点：`@alembic/core/config`（getProjectSkillsPath）、`@alembic/core/io`
（pathGuard/WriteZone）、`@alembic/core/shared`（HOST_AGENT_SOURCE）、
`@alembic/core/workspace`（resolveDataRoot/resolveProjectRoot）、
`@alembic/core/host-agent-workflows`（ProjectSkillDeliveryReceipt 类型）。

### 8.4 SkillHooks — Skill 生命周期钩子（v2 tapable-风格）

`lib/service/skills/SkillHooks.ts`（426 行，承重）实现受 Webpack Tapable 启发的
钩子系统。每个 Skill 目录可放 `hooks.js` 导出生命周期回调。

- **Hook Registry**（`:29-56`）：15 个钩子，分组覆盖知识（onKnowledgeSubmit/
  Created/Updated/Expired）、Guard（onGuardCheck/Violation）、Skill 生命周期、
  搜索（onSearch/Miss）、Bootstrap（onBootstrapStart/Complete），外加 2 个向后
  兼容旧名映射（onCandidateSubmit → onKnowledgeSubmit，onRecipeCreated）。
- **4 种执行模式**（types.ts `HookMode`，`:11-20`）：
  - `bail`（`#runBail` `:229-256`）：串行，首个返回 `{block:true}` 短路——用于
    onKnowledgeSubmit 拦截。
  - `waterfall`（`#runWaterfall` `:259-283`）：前一个返回值替换 args[0]——用于
    onGuardCheck/onSearch 结果后处理，出错继续传当前值。
  - `parallel`（`#runParallel` `:286-309`）：`Promise.allSettled` fire-and-forget，
    失败只记 warn 不阻塞。
  - `series`（`#runSeries` `:312-328`）：按优先级串行，忽略返回值。
- **加载**（`load` `:119-142`）：先扫 `PACKAGE_SKILLS_DIR`（内置），再扫
  `_getProjectSkillsDir`（项目级，同名覆盖），动态 `import(hooksPath)`。注册后
  按 priority 排序（越小越先，默认 100）。
- **新旧格式兼容**（`#registerModule` `:341-372`）：新格式
  `export default { hooks: { onXxx: { handler, priority, timeout } } }`，也支持
  hooks 直接是函数；旧格式 module 顶层直接导出 `onXxx` 函数。
- **超时保护**：`withTimeout`（`:79-98`）默认 10s（`DEFAULT_HANDLER_TIMEOUT`），
  超时 reject 但被各模式 catch 降级。
- `tap()`（`:145-169`）是代码级手动注册入口（非 hooks.js）。
- 设计：**registry + strategy（4 模式）+ chain-of-responsibility（bail/waterfall）**。
  注意此类只是通用钩子基础设施，实际是否被 handler 调用不在本文件。

---

### 8.5 常驻服务客户端（daemon-less 后的角色）

#### 8.5.1 AlembicResidentServiceClient — 承重 HTTP 客户端

`lib/service/resident/AlembicResidentServiceClient.ts`（2202 行，本子域最大文件）
是 Plugin 与「本地 Alembic 常驻服务」（旧 daemon 的 HTTP 面）之间的唯一客户端。
**daemon-less 后的关键姿态**（散见 `:836-865`、`:935-939` 注释）：**PDR-3 之后
Plugin 内部不再合成 embedded runtime**——一个没有 `residentService` health 块的
daemon 一律视为 unavailable，不再有本地兜底。resident job 永远是 api-ai
（provider-backed）路由。

- **构造/状态读取**（`:291-307`）：`#readState` 默认经
  `resolveDaemonPaths(projectRoot)` + `readDaemonState(statePath)` 读 DaemonState
  （token/url/databasePath 等）。`#timeoutMs` 默认 2500ms（`RESIDENT_DEFAULT_TIMEOUT_MS`）。
- **HTTP 端点常量**（`:282-286`）：health `/api/v1/daemon/health`、project-scope
  resolve `/api/v1/project-scope/resolve-folder`、search `/api/v1/search`、jobs
  `/api/v1/jobs`。所有请求带 `x-alembic-daemon-token` header（`#fetchJson`
  `:808-833`），用 `AbortSignal.timeout` 超时。

##### search 主链路（`searchWithResult` `:329-441`）

1. `#resolveProbe` 探活 → `#resolveProjectScopeIdentity` 解析 ProjectScope 身份。
2. **feature 门禁** `#ensureFeatureAvailable(status, 'search.semantic'|'search.keyword',
   {requireLocalAlembic:true})`（`:768-791`）：要求 route=`local-alembic-daemon` 且
   owner=`alembic`（`isLocalAlembicResident` `:931-933`），否则 unavailable。
3. token 缺失 → `token-missing` unavailable（`:351-358`）。
4. 构造 body（`buildResidentSearchBody` `:1478-1510`，含 hostDeclaredIntent/
   hostTurnMeta/intentContext 等 host-intent handoff 字段；`shouldUseResidentSearchBody`
   `:1512-1523` 决定用 POST body 还是 GET query）。
5. 成功后 `buildResidentMeta`（`:941-1014`）组装 `ResidentSearchAttemptMeta`
   （含 primeInjectionPackage、retrievalConsumer、residentVector、projectScopeIdentity）。
6. **workspace 防污染门禁** `findResidentSearchWorkspaceMismatch`（`:1181-1218`）：
   若 resident 返回的 workspace 与请求 projectRoot 的 ProjectScope 路径集合无交集
   （且 projectScopeId 不匹配），则丢弃结果，返回 `unsupported-route` unavailable，
   防止跨项目知识污染。
7. 失败/超时统一走 `createAlembicResidentServiceUnavailable`；`buildUnavailableSearchResult`
   （`:1247-1278`）把 unavailable result 折成空 items + meta。

##### 模式归一化（daemon-less 兼容）

`normalizeResidentRequestMode`（`:2118-2128`）：Codex-facing `auto` 映射到 resident
API 的 `semantic`（resident API 只接受明确模式）。keyword 保留，其余默认 semantic。

##### ProjectScope 身份解析（`#resolveProjectScopeIdentity` `:533-626`）

多级来源：resident project-scope endpoint → resident-service-scope（status 内嵌）→
`/resolve-folder` endpoint 校验当前 folder 是否属于同一 ProjectScope →
**降级为 single-folder baseline**（`buildSingleFolderBaselineIdentity` `:1341-1376`，
用 `WorkspaceResolver.fromProject` 算 dataRoot/projectId/workspaceMode）。降级原因
写成 developer-visible 诊断字段而不阻断 baseline 搜索（`:561-571` 注释）。
`#resolveActiveProjectScopeProbe`（`:692-720`）会读 `runtime-control.json`
（`getProjectRegistryDir()`，`readRuntimeControlProjectRoots` `:1403-1428`）找到已
启动的 controlRoot resident，再经 `/resolve-folder` 验证——避免把未绑定临时目录误
接到全局 active daemon。

##### jobs（bootstrap/rescan 入队与查询）

`enqueueJob(kind, {body})`（`:443-458`）POST `/api/v1/jobs/{kind}`，feature
`jobs.api-ai.{kind}`。`readJob(args)`（`:460-475`）GET，支持按 jobId 或
kind/status/limit query（`buildJobQuery` `:2130-2149`）。

##### 隐私冗余保护（redaction）

大量 `redactEvidenceString`（`:2092-2108`）：把 `/Users|home|tmp|private|var/...`
绝对路径替成 `[absolute-path]/<basename>`，保留行号，>240 字符截断。
`compactResidentPrimeInjectionPackage`（`:1560-1590`）等一系列 compact 函数把
resident 返回的巨大 injection package 投影/裁剪成有限字段 + 有限条数（防止 4.5MB
自重复类问题），并对字符串统一 redact。这是 prime 收据下游安全消费的前置。

- 设计：**gateway/client + adapter + strategy（多级 scope 解析）+ 门禁链**。
- Core 消费：`@alembic/core/daemon`（DaemonState/probe/status 工厂）、
  `@alembic/core/search`（SearchResultItem/Meta）、`@alembic/core/shared`
  （ProjectScopeSummary 归一化）、`@alembic/core/workspace`（getProjectRegistryDir/
  WorkspaceResolver）。宿主连接点：读 `.wakeflow`-无关的 `~/.asd` daemon 运行时 +
  runtime-control.json（Alembic/Dashboard 写入的只读控制面）。

#### 8.5.2 AlembicResidentCapabilityClients — 能力 facade

`lib/service/resident/AlembicResidentCapabilityClients.ts`（95 行，薄承重）把单个
`AlembicResidentServiceClient` 按能力拆成 4 个窄接口 facade：`ResidentProbeClient`、
`ResidentProjectScopeClient`、`ResidentSearchClient`、`ResidentJobClient`
（`:16-64`）。`createAlembicResidentCapabilityClients(options)`（`:73-83`）构造一个
共享 client 并分发。`isResidentProjectScopeReady`（`:85-94`）是就绪判定谓词
（available + mode=project-scope + owner=alembic + route=local-alembic-daemon）。
- 设计：**facade（能力隔离）**——让 handler 只依赖它需要的窄接口。
- 消费方：`lib/runtime/mcp/HostMcpServer.ts`、`.../handlers/search.ts`、
  `lib/injection/ServiceMap.ts`、`AppModule.ts`。

---

### 8.6 prime 组装管线

prime 链路两段式：**PrimeSearchPipeline（检索）→ PrimeKnowledgeMaterial（信任
姿态/收据组装）**。两者都是 in-process 本地路径（PDR-1d 后移除了旧 intent-frame
多查询/RRF 编排和 resident-handoff lane）。

#### 8.6.1 PrimeSearchPipeline — 检索适配器

`lib/service/task/PrimeSearchPipeline.ts`（158 行，承重）是对统一 in-process
SearchEngine（`alembic_search` 用的同一引擎）的**路由无关薄适配器**（模块注释
`:1-13`）：

- `search(request)`（`:88-112`）：单次 `search(query, {mode:'auto', limit:8,
  rank:false})`。**`rank:false` 是刻意的**（`:93-94`）：保留原始 lexical/FWS 分数
  幅度供质量过滤，否则 CoarseRanker 的 max-normalization 会把分数挤到一起。
- `#qualityFilter`（`:120-141`）：三重门槛——绝对阈值 `MIN_SCORE_THRESHOLD=0.3`、
  相对最优比 `RELATIVE_SCORE_RATIO=0.15`、gap 检测 `GAP_DROP_RATIO=0.25`（分数
  相对前一个骤降则截断）。
- 结果拆分：`kind !== 'rule'` 为 knowledge（取前 5），`kind === 'rule'` 为
  guardRules（取前 3）（`:105-106`）。
- `PrimeSearchMeta` 保留可选 resident 字段（primeInjectionPackage/retrievalConsumer/
  residentSearch，`:36-41`）——本地适配器不填充，留 null-guarded 让后续 resident
  路径可无契约变更地重填。
- 设计：**adapter + pipeline（search → filter → split）**，SearchEngineLike 是
  duck-typed DI 接口（`:59-64`）。

#### 8.6.2 PrimeKnowledgeMaterial — 信任姿态与收据（trust posture）

`lib/service/task/PrimeKnowledgeMaterial.ts`（1339 行，承重）是 prime 的**信任
分层引擎**——把检索结果收束成一份「Codex 必须在下一步动作前喊出来的
developer-visible 知识收据」，并对每条知识标注信任层级。

##### 主入口 `buildPrimeKnowledgeMaterial(input)`（`:207-299`）

1. 判 `searchDegraded`（入参或 `isPrimeSearchResultDegraded` `:674-687`：
   retrievalConsumer 契约不可用、或 injection package 状态 degraded/empty 且无信任
   证据）。
2. 从 relatedKnowledge + selectedKnowledge-only 候选构造 `trustedKnowledge`，只保留
   `hasTrustedRecipeEvidence`（有 recipe locator 信号或 semantic-region 证据）的项
   （`:217-232`、`hasRecipeLocatorSignal` `:1036-1051`、`collectMatchedRegionClasses`
   `:1053-1066`）。
3. **信任门禁** `assessPrimeTrustedMaterialGate`（`:313-348`）：
   - **low-information-intent 门**（`:323-332`）：查询是低信息量（命中
     `LOW_INFORMATION_PRIME_QUERY_PATTERNS` 或去停用词后无有意义 term，
     `hasLowInformationPrimeIntent` `:350-370`，含中英「从哪里开始/where do i start」
     模式）且无直接需求帧（`hasPrimeCallerContext` `:372-383` 要求 taskAction +
     requirementGoal + keywords/labels/scenario/module）→ 阻断信任材料。
   - **trusted-material-evidence-missing 门**（`:338-346`）：有知识候选但无信任材料
     → 阻断，degradedReason 带详细缺失字段说明（`buildTrustedMaterialEvidenceMissingMessage`
     `:963-994`，直接点名缺哪些 resident producer 字段供 Core follow-up）。
4. 计算 `status`：degraded / delivered / empty（`:243-247`）。
5. `buildPrimeTrustPosture`（`:385-421`）生成 5 层 receiptChecklist。

##### 5 层信任模型（`PrimeTrustLayer` `:9-14`）

- `trusted-to-obey`（`buildTrustedToObey` `:423-431`）：accepted Guard 约束，必须遵守。
- `trusted-to-use`（`buildTrustedToUse` `:433-449`）：accepted Recipe/pattern，可用作
  项目知识——但仅当 status=delivered 且 package 未 needs-verification/unavailable。
- `context-only`（`:451-461`）：query/scenario 只作 hint，不当已验证事实。
- `requires-verification`（`:463-534`）：sourceRefs、candidate、无信任证据的
  selectedKnowledge——必须标注需验证。candidate 状态知识单独列
  （`candidateKnowledgeVerificationItem` `:536-547`）。
- `not-available-or-degraded`（`:579-620`）：empty/degraded 状态 + package unavailable。

##### 反空收据（anti-empty receipt）

`antiEmptyReceipt`（`:410-419`）禁止「received knowledge / I received project
knowledge / 收到了知识」这类通用口号。`buildPrimeShoutInstruction`（`:1236-1271`）
和 `buildPrimeHostResponseInstruction`（`:1273-1292`）生成第一人称、Codex 为主语
（不能让「Alembic prime」当主语/收件人）的详细喊话指令，强调 evidenceRefs 默认
不列路径/行号只留作后续验证。`PRIME_RECEIPT_ORDER`（`:178-179`）强制收据必须是
prime 工具结果后的下一个 developer-visible 响应。

##### nextActions + 路径脱敏

`buildPrimeKnowledgeNextActions`（`:1294-1326`）根据 `TaskAnchorDecision`（来自
TaskLifecyclePolicy）决定是否建议 `alembic_work start`（skip 时标 skipped）。
`redactVisiblePath`（`:1328-1338`）+ `intent.activeFile` 脱敏（`:261-263`）。
- 设计：**builder/strategy（5 层分层）+ 门禁链（2 道信任门）+ evidence-ref 提取
  （`parseEvidenceRef` `:1224-1234` 解析 `path:line`）**。
- 消费方：`lib/runtime/mcp/handlers/agent-public-tools.ts`（prime 工具 handler）。

---

### 8.7 TaskLifecyclePolicy + host-turn-meta — 任务生命周期

#### 8.7.1 TaskLifecyclePolicy — 纯函数策略层

`lib/service/task/TaskLifecyclePolicy.ts`（541 行，承重）是 Codex-aware alembic_task
生命周期决策层。**它不创建任务、不写状态、不执行 Guard**（模块注释 `:1-7`），只把
Codex turn、task anchor、git diff 证据收束成可解释决定，真实 MCP 响应由 handler 做。

- `classifyTaskLifecycleInput(input)`（`:163-182`）主入口，产出
  `TaskLifecycleClassification`（inputSource + intentKind + primeDecision +
  taskAnchorDecision + closeDecision）。
- **输入源分类** `classifyInputSource`（`:281-295`）：`automation-envelope`
  （命中 `AUTOMATION_ENVELOPE_PATTERNS` `:122-134`，含 `<codex_delegation`、
  `ControllerDispatchPacket`、「继续当前窗口任务」等中英模式）→ `status-or-readonly`
  → `user-intent` → `unknown`。
- **意图分类** `classifyIntentKind`（`:297-330`）：automation → automation-control；
  显式任务锚点；status-report；code-change-task（命中
  `CODE_CHANGE_QUERY_PATTERNS` `:147-152`，含中英「实现/修复/重构」）；
  design-discussion；read-only；knowledge-query。注意 action-keyword 检测来自已退休
  的 intent frame，现在 intentKind 只从 query/operation/inputSource 派生（`:302-304`
  `action=''`）。
- **prime 决策** `decidePrime`（`:340-383`）：无 query → skip(no-semantic-query)；
  automation → skip(needs-context)；status → skip；非 code-change/task-anchor →
  skip(non-code-development-turn)；否则 run(knowledge-ready-code-task)。
- **task anchor 决策** `decideTaskAnchor`（`:385-424`）：automation/status → skip；
  显式锚点 → create(high)；code-change → create（multi-step 判定 high/medium，
  `isMultiStepQuery` `:444-450`）。
- **Guard 触发决策** `decideGuardTrigger(input)`（`:184-246`）是独立纯函数状态机：
  无 task anchor → skip；无变更文件 → skip；`isGuardRelevantSourceFile` 过滤
  （`SOURCE_EXTS` `:99-120`）后无源文件 → docs-only-diff；无 taskScope 或与变更无
  交集 → unrelated-dirty-diff；有交集 → run(task-scoped-code-diff)。
- 文件引用归一化 `normalizeTaskLifecycleFileRefs`（`:256-272`）+ `normalizeOneFileRef`
  （`:478-506`）：去 `file://`、去行号、去绝对路径转相对、拒 `..`/knowledge:/host:。
- 设计：**纯函数策略机（state-machine via reasonCode 枚举）**——所有决定带
  `reasonCode` 供可解释性。无副作用，全部可单测。

#### 8.7.2 host-turn-meta — host 元数据读取

`lib/service/task/host-turn-meta.ts`（102 行，承重薄）是从退休的 HostIntentFrame
intake 层保留下来的非 intent-paradigm 工具（注释 `:1-7`）：

- `HostDeclaredIntentInput`（`:9-23`）：host-declared-intent 参数形状。
- `HostTurnMetaInput`（`:25-46`）：host turn 元数据形状（threadId/conversationId/
  sessionId/turnId/activeFile/cwd/projectRoot 等）。
- `readHostTurnMetaFromMcpRequest(request)`（`:82-101`）：从 MCP request 的
  `params._meta` / `_meta` / `params.meta` / `meta` 提取 host turn meta，用
  `HOST_TURN_META_KEYS` 映射表（`:65-79`）做别名归一（如 thread_id/codexThreadId →
  threadId），`firstString` 截断到 1600 字符。这是宿主（Codex/Claude Code）会话
  身份进入 Plugin 的连接点。

---

### 8.8 LocalEmbedding（RG9 shim）— 本地向量

`lib/service/vector/LocalEmbedding.ts`（3 行）是 **RG9 兼容 re-export shim**：
`export * from '#recipe-generation/vector/LocalEmbedding.js'`，保留原因是维持向量
配置入口稳定，移除条件是消费者全部切到 `#recipe-generation/*`（owner: AlembicPlugin RG9）。

真实实现（`lib/recipe-generation/vector/LocalEmbedding.ts`，137 行）是 Plugin 侧
本地 Ollama embedding wiring（GMAP-L2/L3）：消费 Core 已验收的 L1 面
（`@alembic/core/vector`：OllamaEmbedProvider + EmbedProviderSelector），只负责
Plugin 关注点——解析 localEmbedding 配置（`LocalEmbeddingConfigSchema`，默认
endpoint `http://127.0.0.1:11434`、model `qwen3-embedding`、laneOrder `local-first`）、
探测本地 Ollama daemon、选 local-first 的 embed lane。**Plugin 永不下载/打包 embedding
模型**，用户通过本地跑 Ollama opt-in（这也是真机冷启动时「embed-provider-missing=
Ollama 未起语义跳过」的根因）。

---

### 8.9 CleanupService — 数据清理策略（垃圾桶模式）

`lib/service/cleanup/CleanupService.ts`（853 行，承重）是统一数据清理策略，提供
四种模式（模块注释 `:1-22`），核心设计是**垃圾桶模式**（trash-bin）——破坏性删除前
先归档，`.asd/.trash/<ISO-timestamp>/`，保留 `TRASH_RETENTION_DAYS=7` 天。

#### 8.9.1 三种清理模式的表删除策略

- **`fullReset()`（`:219-320`）冷启动全量清理**：
  1. `#purgeExpiredTrash` 清过期垃圾桶。
  2. 创建时间戳垃圾桶，把 `candidates/recipes/skills/wiki/` **move（非 copy）**进
     垃圾桶（`#moveToTrash` `:620-660`，rename 优先、失败回落 cp+rm）。
  3. `#exportDbToTrash`（`:666-702`）导出关键表到 `db-snapshot.jsonl`。
  4. `clearTables(db, ALL_DATA_TABLES)` + `TASK_DATA_TABLES`。**`ALL_DATA_TABLES`
     顺序重要**（`:123-151`）：FK 子表必须先删（lifecycle_transition_events →
     knowledge_entries 等），含 source_graph_* / P10 项目索引表（git_diff_checkpoints/
     coverage_ledger/deep_mining_rounds/project_context_file_snapshots）。
  5. **fail-closed 门禁** `#assertFullResetDatabaseClean`（`:704-717`）：若清表有错
     误则**抛错中止**——避免 stale knowledge_entries/coverage_ledger/deep_mining_rounds
     残留后继续 Recipe 生成。
  6. 清向量索引、bootstrap-report.json、logs/signals/。
- **`rescanClean()`（`:333-390`）保留 Recipe 的 rescan 清理**：只清衍生表
  （`RESCAN_CLEAN_TABLES` `:156-162`：code_entities/guard_violations/semantic_memories/
  sessions/audit_logs）+ pending/rejected/deprecated 知识条目
  （`deleteKnowledgeEntriesByLifecycle`），**保留** recipes/skills/、active/published/
  staging/evolving 条目、knowledge_edges、evolution_proposals、bootstrap_snapshots、
  recipe_source_refs。**MT1 P1 数据丢失门禁**（`#trashRescanProjections` `:595-618`）：
  candidates/ 与 wiki/ 是用户可见投影，声明保留知识时**只能归档进垃圾桶不能直接删**
  （否则违反 Core DestructiveResetReport 契约即静默数据丢失）。**skills/ 保留**
  原因（`:372`）：AP-KS Project Skill source 唯一真源，删了会让 `.agents/skills`
  symlink 断链。
- **`forceRescanClean()`（`:405-458`）保留增量证据的强制清理**：与 rescanClean 区别
  是不清 bootstrap_snapshots/bootstrap_dim_files/recipe_source_refs（增量管线核心
  状态，保留供后续增量 diff）。

#### 8.9.2 快照与垃圾桶管理

- `snapshotRecipes()`（`:466-529`）：查 `CONSUMABLE_LIFECYCLES` 的
  knowledge_entries（`queryRecipeSnapshotRows`），解析 content/sourceRefs JSON，
  按 `recipeDimensionIdOrUnknown` 统计维度覆盖——Evolution Agent 需要 content。
- `#purgeExpiredTrash`（`:720-772`）：从文件夹名解析时间戳算 age，超 maxAge 则
  `fs.rmSync`；根目录空则删。`listTrashFolders`（`:544-561`）供 HTTP/UI 展示。
- **WriteZone 抽象**：所有写/删/移都优先走 `#wz`（Core WriteZone，Ghost/外置工作区），
  否则回落 fs（`#createTrashFolder`/`#moveToTrash`/`#clearDirectory`/`#deleteFile`）。
- 设计：**strategy（4 清理模式）+ fail-closed 门禁 + 命令模式（垃圾桶事务）**。
- Core 消费：`@alembic/core/config`（路径解析）、`@alembic/core/dimensions`、
  `@alembic/core/io`（WriteZone）、`@alembic/core/knowledge`（CONSUMABLE_LIFECYCLES/
  lifecycleInSql）；DB 访问经 `#infra/database/SqliteDatabaseAccess.js`。

---

### 8.10 Bootstrap 事件/任务（均为 RG9 shim）

- `lib/service/bootstrap/BootstrapEventEmitter.ts`（7 行）**RG9 shim** → 转发
  `BootstrapEventEmitter` + default 到 `#recipe-generation/bootstrap/BootstrapEventEmitter.js`。
- `lib/service/bootstrap/BootstrapTaskManager.ts`（4 行）**RG9 shim** →
  `export * from '#recipe-generation/bootstrap/BootstrapTaskManager.js'`。

**与 recipe-generation 同名文件的关系**：这两个 service 层文件不是独立实现，承重
实现已在 recipe-generation 域。真实实现要点（供理解 shim 交付的能力）：

- 真 `BootstrapEventEmitter`（recipe-generation，149 行）：统一 bootstrap 进度事件
  推送，两端（内部 Agent / 宿主 Agent）用相同事件名，同时兼容 EventBus 和
  BootstrapTaskManager。构造时从 DI container 取 `eventBus` + `bootstrapTaskManager`
  （容错各自不存在）。emit 方法：`emitDimensionComplete`（发
  `bootstrap:task-completed`）、`emitAllComplete`（`bootstrap:all-completed`）、
  `emitDimensionStart`、`emitDimensionFailed`（`bootstrap:task-failed`）、
  `emitProgress`（转发到 eventBus + taskManager）。
- 真 `BootstrapTaskManager`（recipe-generation，546 行）：冷启动异步任务管理器，
  任务状态流 skeleton → filling → completed/failed，经 EventBus/SignalBus 发进度、
  经 RealtimeService 推 Socket.io，支持查询 bootstrap 会话状态。消费
  `@alembic/core/events`（EventBus/SignalBus）、`@alembic/core/shared`（getTestModeConfig）。

---

### 8.11 文件变更演化触发

- `lib/service/FileChangeDispatcher.ts`（6 行，承重契约）：纯 interface，
  `dispatch(events: FileChangeEvent[]): Promise<ReactiveEvolutionReport>`，类型来自
  `@alembic/core/types`。这是文件变更 → 反应式演化的**抽象边界**。
- `lib/service/evolution/FileChangeHandler.ts`（4 行）**RG9/P12 rename shim** →
  `#recipe-generation/evolution/FileChangeHandler.js`。真实实现已更名为
  `HostAgentFileChangeHandler`；这里保留旧 `FileChangeHandler` named import 供历史
  测试、下游插件缓存和 service adapter 平滑迁移。
- `lib/service/evolution/git-diff-checkpoint/index.ts`（4 行）**RG9 shim** →
  `#recipe-generation/evolution/git-diff-checkpoint/index.js`。转发的真实 barrel
  导出（供理解交付面）：`GitDiffCheckpointService`（+ Options/Result）、
  `GitDiffScanner`（name-status 事件扫描）、`ProjectDiffIgnore`（安全路径归一：
  `isSafeProjectRelativePath`/`normalizeProjectRelativePath`/`shouldIgnoreProjectPath`/
  `toProjectRelativePath`）、`GitDiffCheckpointStatus` 类型 +
  `createInactiveGitDiffCheckpointStatus`、以及 durable routing 面
  （`createPluginGitDiffCheckpointRuntime`/`buildPluginGitDiffCheckpointScope`/
  `recordPluginGitDiffCheckpointRouteOutcome`）。这是 git 提交驱动维护链（commit →
  checkpoint → propose）的 Plugin 侧接线。

**注意**：git-diff-checkpoint 的真实实现（DurableGitDiffCheckpointRouting /
GitDiffCheckpointService / GitDiffScanner 等）属于 recipe-generation 演化域，本节
只点名 shim 交付的能力，不展开——详见 recipe-generation 章节（crossLinks）。

---

### 8.12 RecipeFreshnessRuntime — Recipe 新鲜度公共编排

`lib/service/knowledge/RecipeFreshnessRuntime.ts`（549 行，承重）是 Recipe 新鲜度的
公共编排层：Recipe 创建/更新后同步其 sourceRefs 活跃度和向量语义记忆，产出
developer-visible 的 `RecipeFreshnessPublicOutput`。

- **两个入口**：
  - `refreshCreatedRecipeFreshness(container, created)`（`:98-136`）：新建 Recipe 后
    刷新，优先用 raw entry（`toRecipeFreshnessEntry` `:445-463`），否则从
    knowledgeRepository 加载（`loadRecipeFreshnessEntry` `:418-429`）。
  - `refreshRecipeFreshnessByIds(container, recipeIds)`（`:138-167`）：按 id 刷新。
- **服务解析**：`getRecipeFreshnessService(container)`（`:431-443`）从 DI container
  取 `recipeFreshnessService`（Core `RecipeFreshnessService`），不可用则
  `skippedFreshnessOutput`（`:196-208`，status=skipped, retrievalMayBeStale=true）。
- **核心刷新** `refreshRecipeFreshnessEntries`（`:234-276`）：调
  `service.refreshRecipes(entries, {maxRecipes})`，summarize 后
  `syncSemanticMemoriesForFreshRecipes`（`:278-299`）——只对
  vector 刷新可运行（`recipeVectorRefreshWasRunnable` `:301-308`）的 Recipe，调
  `syncRecipeSemanticMemoriesForEntries`（来自
  `#recipe-generation/host-agent-workflows/recipe-region-vector.js`）同步 recipe-region
  语义向量。异常时产出 status=failed 输出。
- **状态摘要**（`summarizeRecipeStatus` `:386-398`、`summarizeStatus` `:400-416`）：
  errors/sourceRefs.failed/vector.failed → failed；retrievalMayBeStale/vector.degraded
  → degraded；全 skipped → skipped；否则 completed。
- **公共输出投影**（`summarizeRefreshResult`/`summarizeRecipeResult`/`summarizeVector`
  `:310-384`）：sourceRefs（active/stale/all 计数 + reconcile 明细）、vector
  （availability/entrySync/regionSync 状态），字符串数组用 `boundedStrings` 限 10 条。
- 设计：**编排层/facade（对 Core RecipeFreshnessService 的公共包装）+ DI 解析 +
  降级链**。Core 消费：`@alembic/core/knowledge`（RecipeFreshness* 类型/服务）、
  `@alembic/core/repositories`（KnowledgeRepository）。

---

### 8.13 ProjectSkillKnowledgeRepository — 知识条目计数

`lib/repository/skills/ProjectSkillKnowledgeRepository.ts`（43 行，承重薄）是最底层
的只读 SQLite 计数工具，被 ProjectSkillService.collectKnowledgeScope 用来判定项目
是否有本地知识库。

- `countProjectSkillKnowledgeEntries(dataRoot)`（`:5-7`）+
  `countProjectDatabaseRecipes(dataRoot)`（`:9-13`）都转发到 `countKnowledgeEntries`。
  注释（`:10-12`）说明：统一模型里 knowledge_entries 就是 DB 持久化 Recipe 表，
  磁盘 .md 导出数由 KnowledgeState 单独扫 materializedRecipeCount，避免两来源混淆。
- `countKnowledgeEntries(dataRoot)`（`:15-42`）：探测
  `{dataRoot}/.asd/alembic.db` 和 `{dataRoot}/alembic.db` 两个候选，
  **只读**（`new Database(dbPath, {fileMustExist:true, readonly:true})`）打开，先查
  sqlite_master 确认 `knowledge_entries` 表存在，再 `COUNT(*)`，finally close。
- 直接依赖 `better-sqlite3`（不经 `#infra` 抽象，是本文件的独立轻量路径）。

---

### 8.14 子域数据流总结

1. **模块发现**：MCP handler → `ModuleService.load()` → `ProjectContextCapabilities.execute`
   （repo/map/module）→ TargetInfo/canonical 模块投影 → 回给 structure/guard handler
   与覆盖账本（`listCanonicalModules` 是 RecipeProductionGateway 契约点）。
2. **技能生成/交付**：bootstrap/rescan → `ProjectSkillService.refreshKnowledgeSkills`
   →（有知识库时）`buildKnowledgeScopedSkill` → 写 `dataRoot/Alembic/skills` source →
   authorize 时 `exportProjectSkillReceiptToRuntime` → `.agents/skills` symlink 投影；
   知识库判定经 `ProjectSkillKnowledgeRepository.countKnowledgeEntries`。
3. **常驻检索**：search handler → `ResidentSearchClient.searchWithResult` →
   `AlembicResidentServiceClient` HTTP `/api/v1/search` → workspace 防污染门禁 →
   compact/redact injection package → 回给 handler。
4. **prime 组装**：prime handler → `TaskLifecyclePolicy.classifyTaskLifecycleInput`
   决定 run/skip → `PrimeSearchPipeline.search`（in-process 引擎 + 质量过滤）→
   `buildPrimeKnowledgeMaterial`（信任门禁 + 5 层 trust posture + 反空收据）→ 回给
   Codex（喊话指令）。
5. **清理/演化/新鲜度**：bootstrap fullReset/rescanClean 经 `CleanupService`（垃圾桶
   + fail-closed）；文件变更经 `FileChangeDispatcher` 接口 → HostAgentFileChangeHandler
   （recipe-generation）；Recipe 创建后经 `RecipeFreshnessRuntime` 同步 sourceRefs +
   语义向量。

### 8.15 边界/坑/历史包袱清单

- **多个 service 文件是 RG9/P12 shim**（LocalEmbedding / BootstrapEventEmitter /
  BootstrapTaskManager / FileChangeHandler / git-diff-checkpoint）——改动应去
  `#recipe-generation/*` 真实现，不要在 shim 里加逻辑。
- **daemon-less 姿态**：resident client 无 embedded runtime 兜底（PDR-3），无
  residentService health 块即 unavailable；resident job 恒为 api-ai 路由。
- **Plugin 不做本地 AI 提取**：ModuleService 扫描恒返回 `recipes:[]` + host-managed
  边界；语义增强外包给 host agent / resident service。
- **module-id 派生分歧**（MEMORY R-1）：`#fallbackCanonicalModulesFromRepo` 的
  `target:name:path` id 与 host target 派生未真统一——非空 ProjectMap 项目会分歧。
- **CleanupService 表顺序**：ALL_DATA_TABLES 必须子表先于父表（FK 约束），
  fail-closed 断言会在清表失败时中止 fullReset 保护数据一致性。
- **prime 信任门可能 over-reject**：low-information-intent + trusted-material-missing
  两道门在缺 resident producer 字段时会 withhold 知识（degraded），需 Core 补齐
  selectedKnowledge 的 recipe locator / semantic-region 字段。
- **injection package redaction**：resident 返回的巨大 package 经 compact + redact
  裁剪，绝对路径脱敏成 `[absolute-path]/<basename>`——防 4.5MB 自重复 + 隐私泄露。
- **workspace 防污染**：resident search 若返回不同 workspace 会被整体丢弃
  （unsupported-route），避免跨项目知识污染。


---

## 9. Recipe 规划层 (plan-tool / plan-confirm / gate / anchoring)

本节测绘 `lib/recipe-generation/` 下的「Recipe 无状态前置规划层」，即 `alembic_plan` MCP 工具的完整实现，以及它把「Agent 决策」变成「可下游消费的 `planSelection` 契约」并驱动 `alembic_bootstrap` / `alembic_rescan` 生成的门禁、锚定与模块轴规范化机制。这是冷启动 Recipe 生成链的心脏：它决定「这一轮生成扫哪些维度、多大规模、绑到哪些 canonical 模块」，且**全程无持久化**——每次生成各走一遍 draft→confirm，账本只是被读取的覆盖状态，绝不把 plan 写盘。

覆盖文件（全部为本仓库 `lib/recipe-generation/`，均已逐行真实读取）：

- `plan-tool.ts`（372 LOC）：`alembic_plan` 工具入口 + draft 阶段 + `buildCoverageSeedFromCells` 覆盖信号构建。
- `plan-confirm.ts`（489 LOC）：confirm 阶段——把 Agent 授权的 payload 归一化+校验成 `PlanIntent`，产出 `PlanSelection`，并旁路写 coldStart deferred 覆盖空行。
- `plan-generation-gate.ts`（558 LOC）：生成门禁——`alembic_bootstrap` / `alembic_rescan` 执行前强制 planSelection、阶段一致性、并发租约（lease）、cleanupPolicy 判定、planSelection→执行投影。
- `project-context-anchoring.ts`（352 LOC）：把 Recipe 创建锚定到真实 ProjectContext（recipe_map / graph / search / prime 工具链）+ 关系类主张的证据门禁（sourceRefs/graphRefs）。
- `canonical-module-axis.ts`（97 LOC）：canonical 模块轴纯函数——`knownModuleNames` 集合 + `resolveModuleFromSourceRefs` 前缀反查（解决双宿主 module-id 派生统一）。
- `contracts.ts`（120 LOC）：子系统冻结契约常量（RG-0 骨架契约、工具名清单、投影源清单）。
- `index.ts`（1 LOC）：barrel，仅 `export * from './contracts.js'`。
- `bootstrap/BootstrapEventEmitter.ts`（150 LOC）：统一进度事件推送（EventBus + TaskManager 双通道）。
- `bootstrap/BootstrapTaskManager.ts`（547 LOC）：冷启动异步任务的会话/生命周期状态机 + 双通道（EventBus + Socket.io）推送。
- `bootstrap/bootstrap-event-types.ts`（74 LOC）：Bootstrap 事件 payload 的 discriminated union 类型。

---

### 9.0 全局数据流与边界总览

MCP 侧的调用链（自顶向下）：

1. **入口**：`lib/runtime/mcp/handlers/tool-router.ts:119` 的 `routePlanTool(ctx, args)` 是 `alembic_plan` 的路由薄壳，直接转发到本层 `routePlanToolImpl`（`plan-tool.ts` 的 `routePlanTool`，见 `tool-router.ts:30` import、:123 调用）。args 已由 `lib/shared/schemas/mcp-tools.ts:925` 的 `PlanInput` zod schema（`.strict()` + `superRefine` confirm 分支强校验）过滤。
2. **draft**：`routePlanTool` → `draftPlan`（`plan-tool.ts:179`）→ 收集真实 ProjectContext（`collectPlanProjectContext`）→ 构建有界 `projectInfoTree` + `candidateDimensions` → deepMining 才附 `coverageSeed` → 返回 `nextActions=[confirm]`。
3. **confirm**：`routePlanTool` → `confirmPlan`（`plan-confirm.ts:37`）→ 把 Agent payload 归一化+Core 校验成 `PlanIntent` → coldStart 旁路写 deferred 覆盖空行 → 返回 `planSelection` + `nextActions=[bootstrap|rescan]`。
4. **门禁 + 生成**：Agent 拿 `planSelection` 调 `alembic_bootstrap`（`host-agent-workflows/cold-start.ts:144`）或 `alembic_rescan`（`host-agent-workflows/knowledge-rescan.ts:149`），二者执行前先过 `resolvePlanGenerationGate`（`plan-generation-gate.ts:98`）——缺 planSelection / 阶段不符 → `PLAN_REQUIRED` 阻断；通过后 `acquirePlanGenerationLease` 加并发租约，`applyPlanSelection`（Core）投影出 `executionDimensions` / `moduleScope` / `budget`。
5. **锚定注入**：生成 briefing 时 `attachProjectContextCreationGuide`（`project-context-anchoring.ts:74`）附上「先 ProjectContext 后创建 Recipe」的工具链指引；submit 时 `assessProjectContextRelationshipGrounding`（`tool-router.ts:638`）对关系类主张做证据门禁。
6. **进度事件**：coldStart 异步填充由 `BootstrapTaskManager`（会话状态机）+ `BootstrapEventEmitter`（双通道推送）驱动前端进度。

**跨层边界**：本层是 Plugin 侧的「编排 + 门禁 + 锚定指引」，**决策语义（PlanIntent 校验、planSelection→执行投影、维度定义、模块 tier）全部下沉 `@alembic/core`**。本层不定义维度、不算预算、不派生规模，只做：收集真实事实、透传给 Agent、校验 Agent 回来的 payload、把 Core 的投影结果接到执行工具上。这正是「no-guess / Plugin 收集荐 options、Agent confirm 决策」这条 canonical 边界的落地。

**RED LINE（代码注释里反复出现的红线）**：
- RED LINE 1（`plan-tool.ts:221`）：plan 仍是无状态 draft→confirm，账本只是被读取的覆盖状态，绝不把 plan 持久化。
- RED LINE 6（`plan-confirm.ts:60`）：deferred 覆盖行「写出而非缺席」，但纯副作用，绝不改 confirm 响应。

---

### 9.1 `plan-tool.ts` —— alembic_plan 工具入口 + draft 阶段

#### 9.1.1 路由分发 `routePlanTool`

`plan-tool.ts:152` `routePlanTool(ctx, args)`（async）按 `args.operation` 三路分发（state-machine/facade 模式，工具面单一入口）：

- `'draft'` → `draftPlan(ctx, args)`。
- `'confirm'` → `confirmPlan(ctx, args)`（委托 `plan-confirm.ts`）。
- `'get'` → `blocked('PLAN_GET_REMOVED', ...)`（`:162`）——**历史包袱**：旧的有状态 `alembic_plan get` 路由已随无状态 `planSelection` 契约移除，仍保留一个显式阻断分支给出 `nextActions`（重新 draft+confirm），而非静默 404。这是「无状态契约」的显式退化路径。
- `default` → `blocked('PLAN_INVALID_OPERATION', ...)`（`:172`）。

响应统一形状 `PlanToolResponse`（`plan-tool.ts:29`）：`{ success, message, data?, errorCode? }`。`blocked()`（`:349`）是失败工厂，`success:false` + `errorCode`。

`ctx.container` 是 DI 容器（`{ get(name): unknown }`），`resolvePlanProjectRoot`（`:345`）优先 `args.projectRoot`，否则 `resolveProjectRoot(ctx.container)`（Core `@alembic/core/workspace`）。**这是 DI 模式落点**：所有仓库、moduleService、projectRoot 都从容器按名取，不硬编码。

#### 9.1.2 draft 阶段 `draftPlan`

`plan-tool.ts:179` `draftPlan`：

1. `projectRoot = resolvePlanProjectRoot(ctx, args)`。
2. `analysis = await collectPlanProjectContext(projectRoot, args.hints)`（Core `@alembic/core/service/planFacts`）——**这是「不猜」的锚点**：draft 阶段从真实 ProjectContext 收集项目事实（fileCount / moduleCount / 语言 / 框架 / 模块树），Plugin 不臆造。
3. **空项目护栏**（`:182`）：`analysis.fileCount === 0 && analysis.moduleCount === 0` → `emptyProjectContextResponse`（`:190`），返回 `PLAN_PROJECT_CONTEXT_EMPTY` + `planDiagnostics` warning。避免无事实可锚时凭空 draft（对应 space-membership-scoping 需求里「多仓空间根污染」这类冷启动质量问题的第一道闸）。
4. `draftContext = await buildPlanDraftContext(...)` → `planDraftResponse(draftContext)`。

#### 9.1.3 draft 上下文构建 `buildPlanDraftContext`

`plan-tool.ts:208`，产出 `PlanDraftContext`（`:70`）。三块核心事实：

- **projectInfoTree（金字塔 + 超预算 fullTreeRef）**（`:214`–`:219`）：
  - `budgetBytes = resolveProjectInfoTreeBudgetBytes(args)`（`:319`）：默认 `DEFAULT_PROJECT_INFO_TREE_BUDGET_BYTES = 12*1024`（12 KiB，`:82`）；`args.hints.maxBudget`（KiB，schema 限 1–500）在场时 `max(1024, floor(maxBudget*1024))`。
  - `projectInfoTree = buildProjectInfoTree(analysis, budgetBytes)`（Core planFacts）——inline 金字塔结构（L0 profile → L1 模块 → …），受字节预算裁剪。
  - `await attachFullProjectInfoTreeRefIfNeeded(projectInfoTree, {analysis, projectRoot})`（Core）——**超预算处理**：当 inline 树被预算截断时，附一个 `fullTreeRef`（指向完整树的引用/落盘位置），让 Agent 需要时能取全量而不撑爆响应。这正是 memory 里「projectInfoTree 两块=inline 金字塔+超则 fullTreeRef」的实现。
- **candidateDimensions**（`:230`）：`buildCandidateDimensions(analysis)`（Core planFacts）——**候选维度而非推荐维度**：Plugin 只给「候选清单」，选哪些由 Agent 决定（checklist 明确禁止 infer hidden recommended/skipped，见 `:311`）。
- **coverageSeed（仅 deepMining）**（`:222`）：`args.generationStage === 'deepMining'` 才调 `loadDeepMiningCoverageSeed`，否则 `undefined`（coldStart/moduleMining 从零，coldStart 尤其「仍从零」）。

`requestedStage`（`:233`）透传进 draftContext，供 confirm next-action 回填 generationStage（不再硬编码 coldStart，见 9.1.6）。

#### 9.1.4 deepMining 覆盖信号 `loadDeepMiningCoverageSeed` + `buildCoverageSeedFromCells`

**`loadDeepMiningCoverageSeed`**（`plan-tool.ts:241`，best-effort）：

- 从容器取 `coverageLedgerRepository`（`EvolutionCoverageLedgerRepository`，Core `@alembic/core/repositories`）；不存在 → `undefined`。
- `cells = repo.listByProjectRoot(projectRoot)`；空账本（尚未跑过 coldStart/dimension_complete）→ `undefined`（deepMining 草稿照常返回项目事实，只是没信号）。
- `buildCoverageSeedFromCells(cells, {moduleCount})`。
- **RED LINE 1 落点**（`:240`）：这是「每次草稿重新读账本」，无任何 plan/session 持久化。catch 任何异常都吞掉返回 `undefined`（`:259`）——**降级路径**：读账本失败绝不影响草稿。

**`buildCoverageSeedFromCells`**（`plan-tool.ts:98`，导出、纯函数、可独立单测）——从账本 cells 构建 deepMining 的覆盖「信号」：

1. `tier = resolveModuleTier(moduleCount)`（Core `@alembic/core/host-agent-workflows`）→ `'S'|'M'|'L'`。
2. `perCellTarget = resolvePerCellTargetDefault(tier)`（Core）——每格目标 recipe 数。
3. `perRoundCellBudget = D2_PER_ROUND_CELL_BUDGET[tier]`（`{ S:50, M:60, L:80 }`，`:87`）——**D2 单轮 cell 上限**，防 deepMining 单轮预算爆炸；注释明确它与 Core 的 K/maxRounds 停止条件**正交**（一个限「本轮喂多少格」，一个限「该不该再扫一轮」）。
4. 遍历全量 cells 求 `existingCountByDimension`（每维 coveredCount 求和）+ `ratingByDimension`（每维 empty/thin/partial/covered 评级分布）。
5. `gapCandidates`：`filter` 只取 `grade∈{empty,thin}` 且**非**（`exhausted===true && exhaustedReason` 非空）的 cell——排除 Agent 已声明尽力的格（「已尽」不是「缺口」）；`map` 带 `suggestedDeficit=max(0, perCellTarget−coveredCount)`（advisory）；`sort` 按 `valueScore` 降序（高价值空白排前）；`slice(0, perRoundCellBudget)` 截断（D2 上限）。
6. `CoverageLedgerRecord` 只有 `moduleId/dimensionId` 轴、无 `moduleName`，故 gap 候选只透传 `moduleId`（`:129`）。

**no-guess 关键**（`:96`）：这些只是 SIGNAL，最终扫哪些 cell / 预算多少由 Agent confirm 决定，`suggestedDeficit`/`perRoundCellBudget` 都是 advisory 非强制。数据结构 `CoverageSeed`（`:58`）：`{ gapCandidates, existingCountByDimension, ratingByDimension, perRoundCellBudget, tier }`。

#### 9.1.5 draft 响应 `planDraftResponse`

`plan-tool.ts:265`：`success:true`，`data` 含 `projectInfoTree`、`candidateDimensions`、`agentDecisionChecklist`、可选 `coverageSeed`、`nextActions=[buildDraftConfirmNextAction]`。

`buildAgentDecisionChecklist`（`:309`）返回 5 条硬约束清单（**这是把「Agent 决策权」写进响应的地方**）：从 candidateDimensions 选维度、选一个 generationStage、从 projectInfoTree 证据定 scale.*、需要时绑模块、confirm 时带 projectProfile。

#### 9.1.6 confirm next-action 回填 `buildDraftConfirmNextAction`

`plan-tool.ts:282`：给出下一步调 `alembic_plan confirm` 的模板，`requiredPayloadFields=[selectedDimensions, scale, moduleBindings, plannedNextActions, evidenceRefs, rationale]`。

关键 stage 回填逻辑（`:301`）：`generationStage = coverageSeed ? 'deepMining' : (requestedStage ?? 'coldStart')`——**coverageSeed 在场即等价于 deepMining**（它只在 deepMining draft 才有），否则回退请求的 stage，再退 coldStart。这修掉了「confirm 硬编码 coldStart」的历史包袱（U2b）。`projectProfile = buildProjectProfileFromAnalysis(draftContext.analysis)`（Core planFacts）——从真实 analysis 派生 profile 供 confirm 携带。

`buildStatelessPlanNextActions`（`:327`）：`PLAN_GET_REMOVED` 分支复用的「draft→confirm」两步指引。

---

### 9.2 `plan-confirm.ts` —— confirm 阶段：Agent payload → PlanIntent → PlanSelection

#### 9.2.1 主流程 `confirmPlan`

`plan-confirm.ts:37`（async）：

1. `projectRoot = resolvePlanProjectRoot(ctx, args)`。
2. `payloadResult = buildConfirmedPlanIntent(args)`——Plugin 侧归一化 + 结构校验（见 9.2.2），失败直接返回 `PLAN_CONFIRM_PAYLOAD_REQUIRED` 阻断响应（带逐条 `planDiagnostics`）。
3. **Core 二次校验**（`:47`）：`intent = normalizeConfirmedPlanIntent(payloadResult.intent)` + `validateCompletePlanIntent(intent)`（均来自 `@alembic/core/plans`），抛错则 `PLAN_CONFIRM_PAYLOAD_INVALID`。**双层校验**：Plugin 侧保证「字段齐全 + 引用合法」，Core 侧保证「语义完整 + 维度存在」。
4. **coldStart 旁路副作用**（`:61`）：`intent.generationStage === 'coldStart'` → `await writeColdStartDeferredCoverageRows(...)`（见 9.2.4）。仅在 intent 已校验通过后执行，纯副作用不改响应。
5. `confirmedPlanResponse(projectRoot, intent, buildPlanSelection(intent))`。

#### 9.2.2 payload 归一化 + 结构校验 `buildConfirmedPlanIntent`

`plan-confirm.ts:189`，返回 `BuildConfirmIntentResult`（`{ok:true, intent}` | `{ok:false, response}`）。累积式 `issues[]` 校验（收集所有问题一次性返回，不 fail-fast），逐字段归一化：

- `projectProfile`（`buildConfirmProjectProfile`，`:239`）：缺则 issue；选择性拷 `projectType`/`primaryLanguage`/`moduleCount`/`fileCount`，数组字段 `normalizeStringArray`。
- `dimensions`（`normalizeConfirmedDimensions`，`:274`）：过滤 `decided !== false`（**tri-state**：`decided===false` 视为「已决定不选」被剔除）；空则 issue；逐项校验 `dimensionId`（`dimensionId ?? id`）、`rationale`（`reason ?? rationale`）、`targetRecipes>0`；`priority` 缺省用 `index+1`。
- **维度存在性**（`:194`）：`resolvePlanDimensionDefinitions(dimensionIds).missingDimensionIds`（Core `@alembic/core/dimensions`）——引用未知维度 → issue。**这是「维度定义在 Core」的消费点**。
- `scale`（`normalizeRequiredPlanScale`，`:306`）：`totalRecipeBudget`（>0）、`depthLevels`（非空）必填；`maxFiles`/`contentMaxLines` 选填。
- `moduleBindings`（`normalizeRequiredModuleBindings`，`:324`）：非空必填；每 binding 需 `dimensions`（非空）、`targetRecipes>0`，且其 `dimensions` 必须是已选维度子集（`knownDimensionIds` 集合校验，越界→issue）。
- `plannedNextActions`（`:356`）/`evidenceRefs`（`:373`）：均非空必填。
- `rationale`（`normalizeRequiredRationale`，`:388`）：string→`[string]`，array 原样，其他→`[]`；空则 issue。
- `generationStage`（`normalizeRequiredGenerationStage`，`:266`）：缺则 issue（回退 `coldStart`）。

issues 非空 → `blocked('PLAN_CONFIRM_PAYLOAD_REQUIRED', ...)`，`uniqueStrings(issues)` 去重排序后逐条转 `planDiagnostics`（`severity:'error'`）。成功 → intent 带 `draftSource:'host-agent'`（`:234`，标记这份 intent 来自宿主 Agent 而非 Plugin 臆造）。

> 注意：`mcp-tools.ts:956` 的 zod `superRefine` 已在 schema 层对 confirm 做过一次同构强校验（generationStage/projectProfile/selectedDimensions/scale/moduleBindings/plannedNextActions/evidenceRefs/rationale 全必填）。`buildConfirmedPlanIntent` 是**运行时第二道**，负责归一化 + 跨字段引用一致性（维度存在、binding 维度子集），并产出结构化诊断——schema 挡格式，这里挡语义引用。

#### 9.2.3 PlanSelection 与响应 `buildPlanSelection` / `confirmedPlanResponse`

`buildPlanSelection`（`plan-confirm.ts:427`）：把 `PlanIntent` 投成对外 `PlanSelection`（`@alembic/core/plans` 类型）——`generationStage`、`dimensions`（只取 dimensionId 数组）、`scale`（选择性含 maxFiles/contentMaxLines/depthLevels）、`moduleBindings`。**这就是下游生成工具消费的无状态契约本体**。

`confirmedPlanResponse`（`:402`）：`success:true`，`data.status='confirmed'`、`data.planSelection`、`nextActions=[{tool: nextGenerationToolForStage(stage), args:{planSelection, projectRoot}}]`。`nextGenerationToolForStage`（`:398`）：`coldStart→alembic_bootstrap`，否则→`alembic_rescan`。**pipeline 模式**：confirm 直接把「下一跳工具 + 要透传的 planSelection」拼进响应，Agent 照抄即可，无需自己拼装。

#### 9.2.4 coldStart deferred 覆盖空行 `writeColdStartDeferredCoverageRows`

`plan-confirm.ts:78`（U2c，best-effort、纯副作用、绝不阻断 confirm）——**RED LINE 6 落点**：deferred 覆盖行「写出而非缺席」，让后续 deepMining 的「空白格」语义无歧义。

逻辑：

1. 取 `coverageLedgerRepository` + `moduleService`（`{listCanonicalModules()}`）；任一缺失/无方法 → return（静默）。
2. `canonicalModules = await moduleService.listCanonicalModules()`；空 → return（**no-guess**：无 canonical 模块就没有可信网格，不写任何 deferred 行）。
3. `selectedDimensionIds = intent.dimensions.map(d=>d.dimensionId)`；空 → return。
4. 预归一化每个 binding 的 `{path: normalizeCoveragePath(binding.modulePath), dimensions: Set(binding.dimensions)}`。
5. 双重循环 `canonicalModules × selectedDimensionIds`：判定该 `(模块×维度)` 是否「本轮扫」——`normalizedBindings.some(b => b.dimensions.has(dimensionId) && coveragePathsOverlap(b.path, modulePath))`。scanned 则跳过；**未被绑定 → 写 deferred 空行**：`repo.upsertCell({ projectRoot, moduleId(=module.id??module.name), dimensionId, grade:'empty', deferred:true, coveredCount:0, totalCandidateCount:0, valueScore:0, lastRound:0 })`（round 0 = coldStart 首扫）。
6. `deferredWritten>0` 时 `logCoverageInfo`（advisory 日志，非门禁）。
7. **降级路径**（`:150`）：catch 任何异常吞掉——deferred 写入是旁路副作用，绝不改响应、不阻断 confirm。

**scan-now vs deferred 完全由 Agent 的 `selectedDimensions × moduleBindings` 决定**（`:70`）：一个 cell 算「本轮扫」当且仅当存在 binding 与模块 path 前缀重叠且含此维度，否则 = deferred（Agent 本轮没选它）。**no-guess**：Plugin 不臆造该扫哪些，deferred 纯由「网格 − Agent 已绑定」推导。**D3 约束**（`:76`）：只写 `coverage_ledger`，绝不触达 `git_diff_checkpoints`。

路径工具：`normalizeCoveragePath`（`:156`，统一斜杠、去首尾分隔符、trim）+ `coveragePathsOverlap`（`:167`，任一为空→不重叠；相等或互为「路径段前缀」→重叠，与 canonical-module-axis / Core `pathsOverlap` 同语义）。

`logCoverageInfo`（`:178`）：容器无强类型 logger，安全探测 `ctx.logger?.info?.` 再打印（缺省静默）——**兼容层**。

---

### 9.3 `plan-generation-gate.ts` —— 生成门禁：planSelection 强制 + 阶段一致性 + 并发租约 + 投影

这是 `alembic_bootstrap` / `alembic_rescan` **执行前的守门人**。被 `host-agent-workflows/cold-start.ts:144` 和 `knowledge-rescan.ts:149` 共同消费。gateway 模式的教科书落点。

#### 9.3.1 主门禁 `resolvePlanGenerationGate`

`plan-generation-gate.ts:98`（async），入参 `(ctx, input, {defaultStage, toolName})`，返回 `PlanGenerationGateResult`（`{ok:true, value:PlanGenerationGateReady}` | `{ok:false, response}`）：

1. `projectRoot = input?.projectRoot ?? resolveProjectRoot(ctx.container)`。
2. **阶段解析**（`resolveExecutorGenerationStage`，`:144`）——按 toolName 约束合法 stage：
   - 请求了非法 stage 字符串 → `PLAN_REQUIRED` 阻断（`Unsupported generationStage`）。
   - `alembic_bootstrap`：只允许 `coldStart`；请求了非 coldStart → 阻断（`only supports coldStart`）；未请求 → 默认 `coldStart`。
   - `alembic_rescan`：拒绝 `coldStart`（`requires deepMining or moduleMining`）；接受 `deepMining`/`moduleMining`；否则若 `defaultStage==='coldStart'` → 阻断（rescan 默认必须是挖矿）。
   - 兜底：`normalizedRequestedStage ?? defaultStage`。
3. **planSelection 校验**（`validatePlanSelection`，`:192`）——见 9.3.2；失败 → `PLAN_REQUIRED` 阻断。
4. 通过 → `buildPlanGenerationGateReady(...)`（见 9.3.3）。

阻断响应工厂 `buildPlanGateBlockedResponse`（`:439`）：`success:false`、`errorCode`、`message`（提示「先跑 alembic_plan draft/confirm 再传 planSelection」）、`data.needsUserInput:true`、`data.nextActions`（`buildPlanGateNextActions`，`:471`，即 draft+confirm 两步）、`data.planGate.status='blocked'`。**这是把 Agent「引导回规划」的核心 UX 契约**——门禁不是死路，而是明确指回 plan 工具。

#### 9.3.2 planSelection 校验 `validatePlanSelection`

`plan-generation-gate.ts:192`，产出 `NormalizedPlanSelection`（`:72`，`Required<Pick<..., 'dimensions'|'generationStage'|'moduleBindings'|'scale'>>`）：

- 缺 `selection` → 明确 reason（跑 draft→confirm→传 planSelection）。
- `selection.generationStage` 若在场且 ≠ 请求 stage → 阻断（**阶段一致性**：planSelection 是为某个 stage 授权的，不能拿 coldStart 的 selection 去跑 rescan）。
- `dimensions = uniqueStrings(...)` 非空。
- `scale.totalRecipeBudget > 0`。
- `moduleBindings`（过滤空 modulePath 后）非空；每 binding 需声明 `dimensions`（非空），且其维度必须是 `dimensions` 子集（`knownDimensions` 集合校验，越界→阻断）。

**这是门禁侧的第三道校验**（schema → confirm → gate），保证即使 Agent 手工拼了个 planSelection 直接传给生成工具，也必须满足「维度非空、预算>0、绑定非空、维度自洽、阶段一致」。

#### 9.3.3 就绪态构建 + Core 投影 `buildPlanGenerationGateReady`

`plan-generation-gate.ts:256`，产出 `PlanGenerationGateReady`（`:50`）：

- **Core 投影**（`:264`）：`projection = applyPlanSelection(toCorePlanSelection(planSelection), {moduleScope, scaleOverride, testMode})`（`@alembic/core/plans`）——**这是把「Agent 选择」变成「执行参数」的唯一权威点**。产出 `executionDimensions`、`moduleScope`（flat string[]）、`budget`（含 maxFiles/contentMaxLines/totalRecipeBudget）。`toCorePlanSelection`（`:525`）把 Plugin 侧 `NormalizedPlanSelection` 适配成 Core `PlanSelection`：`targetRecipes` 缺省 `max(1, dimensions.length)`，`priority` 缺省 `index+1`（**adapter 模式**）。
- `cleanupPolicy = resolvePlanCleanupPolicy(...)`（`:490`）：`testMode || moduleMining → 'none'`；`alembic_bootstrap → 'full-reset'`；否则 `force ? 'force-rescan' : 'rescan-clean'`。**这决定生成前对既有 Recipe/表的清理强度**——coldStart 全清重建，deepMining 增量清理，moduleMining/test 不清。
- `planGate`（`:278`）：可观测快照 `{status:'ready', toolName, generationStage, cleanupPolicy, testMode, selectedDimensions, moduleScope, scale}`。
- **U1 #1 加性字段**（`:293`）：直接复用 `planSelection.moduleBindings`（per-模块×维度 意图，含 dimensions/targetRecipes），零派生地 surface 出来，供下游透传给 Core `buildKnowledgeRescanPlan` 驱动 per-cell gap。flat `moduleScope:string[]` 出口**保持不变**（lease key / attachPlanGenerationGateData / creationGuide 仍只依赖 flat scope），新字段不拍扁不替换旧出口——**向后兼容的加性扩展**。

#### 9.3.4 并发租约 `acquirePlanGenerationLease`

`plan-generation-gate.ts:304`——**防重复生成的进程内互斥锁**（模块级 `Map` 单例，`activePlanGenerationLeases`，`:95`）：

- lease key = `idempotencyKey || [toolName, stage, projectRoot, dimensionIds, moduleScope, test|live].join(':')`——**同一 (工具×阶段×项目×维度×模块×模式) 组合唯一**。
- 已存在同 key lease → `PLAN_GENERATION_IN_PROGRESS` 阻断，附 `planGate.status='in-progress'` + 现有 lease 的 epoch/key/startedAt，`needsUserInput:false`（这是「正在跑」而非「缺输入」）。
- 否则登记新 lease（`epoch = nextPlanGenerationLeaseEpoch()` 单调递增，`:376`），返回 `{epoch, key, release}`。
- **`release()` 的 epoch 守卫**（`:359`）：只有当前 Map 里该 key 的 lease epoch 仍等于自己的 epoch 才 delete——防止「A 释放时误删了 B 重新获取的同 key lease」（ABA 防护）。

> 这与 memory「Plugin 侧编排」一致：租约是进程内 best-effort 并发保护，不是分布式锁；防的是同一 MCP 进程内 Agent 重复触发生成产出重复 Candidate。

#### 9.3.5 门禁数据回挂 + intent 投影 `attachPlanGenerationGateData` / `applyPlanGateToProjectAnalysisIntent`

- `attachPlanGenerationGateData`（`:382`，泛型）：把 `generationStage/cleanupPolicy/moduleScope/planGate` 合并进 `response.data`；testMode 时附 `testMode:{enabled, dimensions, moduleScope, scaleOverride}`。被 cold-start.ts:197/278、knowledge-rescan.ts:178/1143 反复调用，让生成响应携带门禁上下文（可观测 + 前端可读）。
- `applyPlanGateToProjectAnalysisIntent`（`:406`）：把门禁的 `dimensions` 覆盖进 `intent.dimensionIds`，把 `scale.maxFiles/contentMaxLines` 写进 `intent.projectAnalysis`——**这是把门禁投影结果真正接到项目分析意图上的桥**（cold-start.ts:182、knowledge-rescan.ts:209 调用）。
- `planGateNoCleanupResult`（`:420`）/`planGateNoRecipeSnapshot`（`:431`）：cleanupPolicy 为 none 时的空占位结果（保持下游响应形状一致）。

---

### 9.4 `project-context-anchoring.ts` —— ProjectContext 锚定 + 关系证据门禁

作用：把「创建 Recipe 前必须先看真实 ProjectContext（不猜）」写进生成响应，并对「关系类主张」做证据门禁。RG-5 契约（`source:'RG-5-project-context-anchored-creation'`，`:52`）。

#### 9.4.1 创建指引 `buildProjectContextCreationGuide` / `attachProjectContextCreationGuide`

`buildProjectContextCreationGuide`（`:46`）：产出结构化指引对象——`rule`（先锚 ProjectContext 证据、比对既有 Recipe、关系类主张引 source/graph refs）、`confirmedPlanBoundary`（含 dimensionIds/planId/generationStage/moduleScope/testMode + `noPluginOnlyPlanStore:true`——**再次声明无 Plugin 侧 plan 存储**）、`toolChain`、`relationshipClaimPolicy`、`nextActions`、`invalidConclusions`（三条禁止结论：orientation 不证当前行为、无 refs 不算 grounded、plan 指引不替代 raw read/Guard/验证）。

`attachProjectContextCreationGuide`（`:74`，泛型）：把 guide + `recipeCreationNextActions` + `meta.projectContextCreationGuide` 挂到 target。被 cold-start.ts:359、knowledge-rescan.ts:1499 调用——**生成 briefing 时注入锚定指引**。

`buildProjectContextCreationNextActions`（`:98`）：产出 5 步工具链模板（**这是把 Alembic 自身工具面接回 Recipe 创建流的地方**）：
1. `alembic_recipe_map`（required）：从 Recipe 挂载的 ProjectContext 区域起步（focus=module/map）。
2. `alembic_graph`（required）：取 ProjectContext refs / source slices / 关系提示（caller/callee/dependency/impact）。
3. `alembic_search`（optional）：比对既有 Recipe 与既往决策，避免重复。
4. `alembic_prime`（optional）：候选涉及规则/边界/验证时 prime 任务语义。
5. `alembic_submit_knowledge`（required）：只在 sourceRefs/reasoning.sources 具体、关系主张带 sourceGraphRefs/graphRefs 时提交。

`buildProjectContextCreationToolChain`（`:230`）+ `buildRelationshipClaimPolicy`（`:256`）给出工具能力矩阵与关系主张策略（claimKinds、必需证据字段、优先工具、partial/stale 时的 fallback）。

#### 9.4.2 关系证据评估 `assessProjectContextRelationshipGrounding`

`project-context-anchoring.ts:177`——**submit 时的关系类主张证据门禁**（被 `tool-router.ts:638` 的 `appendRelationshipGroundingData` 消费，挂到 submit 响应的 `data.relationshipGrounding`）：

1. 逐 item：`hasRelationshipClaim`（`:278`）判定是否含关系主张——检测结构字段（graphRefs/sourceGraphRefs/relations/relationships/relationshipClaim/requiresGraphEvidence/…）或**中英文正则**匹配描述文本（`call chain|caller|callee|depends on|impact path|relationship|invokes` 及 `调用链|调用方|被调用|依赖|影响路径|关系|上游|下游`）。
2. `collectGraphRefs`（`:304`）/`collectSourceRefs`（`:314`）：从 item 多个位置（graphRefs/sourceGraphRefs/relations.*/relationships.*/reasoning.*）收集去重证据。
3. 无关系 item → return `null`（不适用，`not-applicable`）。
4. 有关系但缺 graph 或缺 source 证据 → `status='needs-evidence'`、`finality='non-final'`、`degraded:true`、`retrievalMayBeStale:true`、附 `warning`（关系类主张在 sourceRefs+graphRefs 齐备前非 final）；否则 `grounded`/`final`。
5. `nextActions` 复用创建工具链前两步（recipe_map + graph）。

**这是「no-guess」在提交侧的闭环**：关系类知识（调用链/依赖/影响路径）没有真实 ProjectContext 图证据就标记为 non-final，逼 Agent 补 refs 而非放行臆测。

---

### 9.5 `canonical-module-axis.ts` —— canonical 模块轴（双宿主 module-id 派生统一）

`canonical-module-axis.ts`（纯函数、无副作用、零依赖、可独立单测）——U1 #5。把「canonical ProjectMap.modules」投影成 `RecipeProductionGateway` 需要的两个注入依赖（DI 模式）。**directly 关系到 memory 里记录的「双宿主 module-id 派生未真统一」这条 HIGH 载重残留**（R-1）：canonical 模块名/path 是覆盖轴与 Recipe 归属的共同坐标系。

- **`buildKnownModuleNames`**（`:35`）：canonical 模块名集合（去重去空）。供 Core `knownModuleNames`：Agent 显式给的 `moduleName` 不在此集合 → Core 留空 + 诊断（**越界校验**）。
- **`buildResolveModuleFromSourceRefs`**（`:55`，闭包工厂/strategy 模式）：给定一批 sourceRefs 返回命中的 canonical 模块名。
  - 预计算 `(归一化 path, name)` 候选，按 path 长度**降序**（命中即取最具体/最长 path 模块）；无 path 的模块不参与前缀匹配。
  - 对每条 sourceRef：`extractSourceRefPath`（`:88`）剥掉末尾 `:行号`/`:起-止` 锚点（正则 `:(\d+)(?:-\d+)?$`，注释明确 Windows 盘符 `C:` 不匹配此形态）→ `normalizeAxisPath` → 找 `refPath === candidate.path || refPath.startsWith(candidate.path+'/')` 的候选，命中返回其 name。
  - 全不命中返回 `undefined`（**Core 据此留空+诊断，不再恒空兜底**）。
- **空列表回退**（文件头注释 + `:65`）：模块列表为空时两个 builder 都返回「空/恒 undefined」，让 Core 退回原 passthrough 行为——**加性、向后兼容**。
- `normalizeAxisPath`（`:25`）：统一反斜杠→正斜杠、去首尾分隔符、trim。与 `project-source-facts` 的 normalize 同语义，但本模块零依赖以便独立单测。

**双宿主统一坑（历史包袱）**：memory 记录 in-process 宿主用 plain `module.id`，host target 宿主用 `name:path` 派生——BiliDili 空-ProjectMap 才相等，非空-map 会重新分歧。本模块是「path 前缀反查」这一半的统一逻辑；`plan-confirm.ts:114` 的 `moduleId = module.id ?? module.name` 是另一处派生点。canonical 化未真正端到端统一是 R-1 残留，本文件的 path-前缀语义与 `plan-confirm.ts:167` `coveragePathsOverlap`、Core `pathsOverlap` 三处保持同语义是当前的对齐手段。

---

### 9.6 `contracts.ts` + `index.ts` —— 子系统冻结契约

`contracts.ts` 是纯常量/类型文件（**registry 模式**：把子系统的「冻结事实」集中成机器可读契约），无运行时逻辑：

- `RECIPE_GENERATION_SUBSYSTEM_ROOT = 'lib/recipe-generation'`（`:1`）。
- `RECIPE_GENERATION_PROJECT_CONTEXT_TOOL_NAMES`（`:3`）：`[recipe_map, graph, search, prime]`——被 `project-context-anchoring.ts:1` import 用于 `meta.toolCount`。
- `RECIPE_GENERATION_STATE_PROJECTION_SOURCES`（`:10`）：`[knowledge_entries, recipe_source_refs, evolution_proposals, lifecycle_transition_events]`——声明「生成状态是从这些表**读时投影**、不双写」（`persistenceRule:'projected-from-db-not-double-written'`，`:87`）。**这正是「无状态 plan / 无 Plugin 侧 plan 存储」在契约层的固化**。
- `RECIPE_GENERATION_STAGE_KINDS`（`:17`）：`[cold-start, rescan, evolution]`；`RESCAN_MODES`（`:19`）：`[deep-mining, module-mining]`。
- `RECIPE_GENERATION_CONFIRMED_PLAN_PRECONDITION`（`:66`）：`requirement:'confirmed-plan'`、`blocksStages:全部`、`enforcedFromPackage:'RG-3'`——**「所有生成阶段都以 confirmed plan 为前置」的契约声明**，与 9.3 门禁运行时行为对应。
- `RECIPE_GENERATION_SKELETON_CONTRACT`（`:74`，`satisfies RecipeGenerationSkeletonContract`）：RG-0 骨架契约，记录未来边界而不注册工具/表/handler/job；`rg0Boundary.forbidden` 列出 5 条禁止项（含 `plans-table`、`public-mcp-semantic-change`、`production-behavior-change`）。**历史包袱注记**（`:73`）：RG-0 只记录未来边界，是「future-contract-only」的骨架，实际实现从 RG-3/RG-4/RG-5/RG-8 陆续落地。

`index.ts`（1 行）：`export * from './contracts.js'`——barrel 只导出契约常量。**注意**：plan-tool / plan-confirm / gate / anchoring / module-axis **不经此 barrel 导出**，它们被消费方（tool-router、host-agent-workflows）经 `#recipe-generation/<file>.js` 具名子路径直接 import。

---

### 9.7 `bootstrap/` —— 冷启动进度事件与任务会话状态机

这三个文件服务 coldStart 生成的**异步进度反馈**（非规划契约本身，但属规划层触发的 bootstrap 生命周期）。注意本仓库存在**同名并存副本** `lib/service/bootstrap/BootstrapEventEmitter.ts` 与 `BootstrapTaskManager.ts`（见 9.0 grep 结果），DI 注册在 `lib/injection/`——本节只测绘 `lib/recipe-generation/bootstrap/` 下的这份。

#### 9.7.1 `BootstrapEventEmitter.ts` —— 双通道进度推送（facade）

`BootstrapEventEmitter`（`:12`）：构造时从 DI 容器 best-effort 取 `eventBus` 与 `bootstrapTaskManager`（各自 try/catch 吞未注册，`:24`/`:33`）。方法均**双通道 + 全 non-blocking**（每次 emit 独立 try/catch，绝不因一端失败阻断另一端或主流程）：

- `emitDimensionComplete(dimId, data)`（`:54`）：`taskManager.markTaskCompleted` + `eventBus.emit('bootstrap:task-completed', {dimensionId, ...data})`。
- `emitAllComplete(sessionId, totalDimensions, source)`（`:80`）：`eventBus.emit('bootstrap:all-completed', ...)`。
- `emitDimensionStart`（`:97`）：`taskManager.markTaskFilling`。
- `emitDimensionFailed`（`:111`）：`taskManager.markTaskFailed` + `eventBus.emit('bootstrap:task-failed', ...)`（error 归一化为 message）。
- `emitProgress(event, data)`（`:134`）：`eventBus.emit` + `taskManager.emitProgress`。

**facade 模式**：统一「内部 Agent / 宿主 Agent 两端用相同事件名和数据格式」，同时桥接 EventBus 与 TaskManager 两套后端。

#### 9.7.2 `BootstrapTaskManager.ts` —— 会话生命周期状态机

`BootstrapTaskManager`（`:162`）维护单活跃会话 `#currentSession`（`BootstrapSession`，`:63`），任务状态机 `skeleton → filling → completed/failed`（`TaskStatus` 冻结枚举，`:55`）。

**Session 管理**：
- `startSession(taskDefs)`（`:193`）：**并发锁**——若上一会话仍 running 先 `abortSession('Superseded ...')`（防重复触发产重复 Candidate，与 9.3.4 gate lease 呼应但作用于不同层）；生成 `bs_<ts>_<rand>` sessionId，建 `AbortController`，逐 task `addTask`；探测 `getTestModeConfig()`（Core `@alembic/core/shared`）附 testMode payload；emit `bootstrap:started`。
- `abortSession(reason)`（`:242`）：仅 status==='running' 生效；未完成 task 全标 FAILED；`#sessionAbortController.abort(reason)`（**中断正在执行的 AI 调用**）；status→'aborted'；emit `bootstrap:all-completed` + `signalBus.send('lifecycle','Bootstrap',0.3,...)`。
- `markCancelled`（`:331`）/`isUserCancelled`（`:345`）：处理「LLM 失败后 session 已进 completed_with_errors 但 finalize 链仍在跑」的场景——此时 abortSession 因 status≠running 失效，用 userCancelled 标志 + AbortController 补位。
- `getSessionAbortSignal`（`:304`）：供宿主工作流在可取消步骤读取，避免等到下一维度边界才检测取消。
- `isSessionValid(sessionId)`（`:314`）：running/completed/completed_with_errors 都算有效（completed 后 Phase 5.5 Skills 生成仍需跑），只有被新 session 替代才无效。异步填充函数每轮迭代前用它检测是否该停（防重复产出）。

**任务标记**：`markTaskFilling`/`markTaskCompleted`/`markTaskFailed`（`:350`/`:376`/`:412`）更新 task 状态并 `#emit` 对应事件；`markTaskCompleted`/`markTaskFailed` 后若 `session.isAllDone`（`:113`，skeleton==0 && filling==0）→ `#finishSession`（`:480`：status→completed/completed_with_errors，emit all-completed + `signalBus.send('lifecycle','Bootstrap',1,...)`）。

**双通道 `#emit`**（`:522`）：EventBus（后端监听）+ RealtimeService（前端 Socket.io，`broadcastEvent`，延迟 getter 避循环依赖，未初始化静默忽略）。`BootstrapSession.toJSON`（`:135`）/`getSessionStatus`（`:447`）供 HTTP 轮询进度。

**Core 消费点**：`@alembic/core/events`（`EventBus`/`SignalBus` 类型）、`@alembic/core/logging`（`Logger`）、`@alembic/core/shared`（`getTestModeConfig`）。`signalBus.send('lifecycle', ...)` 把 bootstrap 生命周期信号投进 Core 的 SignalBus 骨架（驱动生命周期晋级等）。

#### 9.7.3 `bootstrap-event-types.ts` —— 事件 payload 类型

`DimensionCompletePayload`（`:60`）是按 `type` 字段判别的 **discriminated union**（skipped / incremental-restored / checkpoint-restored / error / candidate|skill pipeline-complete / skill / host-agent-complete 七个变体，`:12`–`:57`），替代散落的 `Record<string,unknown>` 实现编译期事件校验。`ProgressPayload`（`:71`）为开放 map。

---

### 9.8 设计模式与消费点汇总

**设计模式落点**：
- **facade / 单入口**：`routePlanTool`（`plan-tool.ts:152`）按 operation 分发；`BootstrapEventEmitter` 桥接双后端。
- **gateway**：`resolvePlanGenerationGate`（`plan-generation-gate.ts:98`）——生成执行前强制 planSelection + 阶段 + 租约。
- **state-machine**：`BootstrapTaskManager` 会话 `skeleton→filling→completed/failed` + `running→aborted/completed`；plan draft→confirm→gate→generate 也是宏观状态推进。
- **adapter**：`toCorePlanSelection`（`plan-generation-gate.ts:525`）Plugin→Core selection 适配；`buildPlanSelection`（`plan-confirm.ts:427`）Intent→Selection。
- **strategy / 闭包工厂**：`buildResolveModuleFromSourceRefs`（`canonical-module-axis.ts:55`）返回可注入的解析闭包。
- **pipeline**：confirm/gate 的 `nextActions` 把「下一跳工具 + 透传 payload」拼进响应，Agent 顺序执行。
- **DI**：全程 `ctx.container.get(name)` 取 repo/service/logger/eventBus/moduleService。
- **registry / 冻结契约**：`contracts.ts` 常量集中冻结子系统事实。
- **pure-function + 可测**：`buildCoverageSeedFromCells`、`canonical-module-axis.*`、路径归一化工具刻意零副作用零 DB 以独立单测。

**@alembic/core 消费点（子路径 + 用途）**：
- `@alembic/core/host-agent-workflows`：`resolveModuleTier` / `resolvePerCellTargetDefault`（覆盖信号 tier/perCellTarget，`plan-tool.ts:1`）。
- `@alembic/core/service/planFacts`：`collectPlanProjectContext` / `buildProjectInfoTree` / `attachFullProjectInfoTreeRefIfNeeded` / `buildCandidateDimensions` / `buildProjectProfileFromAnalysis` / 类型 `PlanProjectContextAnalysis` `ProjectInfoTreeRoot` `CandidateDimension`（draft 事实收集，`plan-tool.ts:7`）——**draft「不猜」的事实来源**。
- `@alembic/core/plans`：`normalizeConfirmedPlanIntent` / `validateCompletePlanIntent`（confirm 校验）、`applyPlanSelection`（门禁投影）、类型 `PlanIntent` `PlanSelection` `PlanStageId` `PlanModuleBinding` `PlanScaleDecision` `PlanNextAction`（`plan-confirm.ts:2`、`plan-generation-gate.ts:1`）——**决策语义/投影的权威**。
- `@alembic/core/dimensions`：`resolvePlanDimensionDefinitions`（维度存在性校验，`plan-confirm.ts:1`）。
- `@alembic/core/repositories`：`EvolutionCoverageLedgerRepository` / `CoverageLedgerRecord`（覆盖账本读/写 cell，`plan-tool.ts:3`、`plan-confirm.ts:12`）。
- `@alembic/core/workspace`：`resolveProjectRoot`（projectRoot 兜底，三处）。
- `@alembic/core/events` `@alembic/core/logging` `@alembic/core/shared`：EventBus/SignalBus/Logger/getTestModeConfig（bootstrap 层）。

**宿主（Codex / Claude Code）连接点**：本层不直接感知宿主种类——它对外只是 `alembic_plan` MCP 工具（`mcp-tools.ts:1465` 注册 `alembic_plan: PlanInput`，经 `tool-router.ts:119` 路由）。宿主 Agent（无论 Codex 还是 Claude Code）以「MCP 工具调用者」身份走 draft→confirm→bootstrap/rescan，`draftSource:'host-agent'`（`plan-confirm.ts:234`）标记 payload 来自宿主 Agent。双宿主差异由更外层（`lib/runtime/host-adapter`、`host-agent`）承载，本层保持宿主无关。

---

### 9.9 边界 / 坑 / 降级 / 已知历史包袱

- **无状态红线（RED LINE 1/6）**：plan 绝不持久化；账本只读（deepMining）或旁路写 deferred 空行（coldStart），且写账本失败一律吞掉不阻断。任何「加个 plans 表/plan store」都违 `contracts.ts:110` 的 `forbidden` 与 `noPluginOnlyPlanStore:true`。
- **三道校验叠加**：schema superRefine（`mcp-tools.ts:956`）→ confirm `buildConfirmedPlanIntent`（引用一致性）→ gate `validatePlanSelection`（执行前再校验）。三处规则重叠但目的不同（格式 / 语义引用 / 执行阶段一致），改任一处需同步核对另两处，否则会出现「schema 放行但 gate 拒」的错位。
- **PLAN_GET_REMOVED 历史包袱**：`plan-tool.ts:162` 保留 get 阻断分支，是旧有状态契约的退化残留；不可当活路由。
- **并发保护两层且作用域不同**：gate lease（`plan-generation-gate.ts:304`，按 tool×stage×project×dims×scope×mode）防「重复生成请求」；BootstrapTaskManager session 锁（`:195`）防「重复 bootstrap 会话」。二者都是**进程内 best-effort**，非分布式锁。
- **双宿主 module-id 派生统一（R-1 HIGH 载重残留）**：canonical 模块名/path 是覆盖轴与 Recipe 归属的共同坐标系；`canonical-module-axis.ts` 只统一「path 前缀反查」这一半，`plan-confirm.ts:114` `module.id ?? module.name` 是另一派生点。memory 记录 in-process（plain module.id）与 host（name:path）在非空-ProjectMap 项目会重新分歧——本层三处 path-overlap 同语义（`canonical-module-axis`、`plan-confirm.ts:167`、Core `pathsOverlap`）是当前对齐手段，未端到端真统一。
- **coverageSeed 全 advisory**：`suggestedDeficit`/`perRoundCellBudget`/`gapCandidates` 都是 SIGNAL，Agent confirm 可无视；D2 单轮上限与 Core K/maxRounds 停止条件正交，勿混淆。
- **空项目/空模块护栏**：draft 空 ProjectContext → `PLAN_PROJECT_CONTEXT_EMPTY`；confirm 无 canonical 模块 → 不写任何 deferred 行。二者共同保证「无真实事实不硬 draft」（关联多仓空间根污染的冷启动质量问题）。
- **同名并存副本**：`lib/recipe-generation/bootstrap/` 与 `lib/service/bootstrap/` 各有一份 `BootstrapEventEmitter`/`BootstrapTaskManager`；DI 注册在 `lib/injection/`。本节只覆盖 recipe-generation 下的那份，跨副本一致性不在本节范围。
- **logger 弱类型探测**：`plan-confirm.ts:178` `logCoverageInfo` 与门禁 context 的 `logger?` 都是可选安全探测（缺省静默），生产观测依赖调用方注入 logger。


---

## 10. Recipe 冷启动 / 进化 / git-diff 维护工作流层

本层是 Recipe 知识"从无到有 + 生成之后持续进化"的完整闭环，全部由 **host-agent（宿主 Agent：Codex / Claude Code 内的对话 Agent）驱动**，插件侧只做**编排 + 事实收集 + 门禁 + 覆盖记账 + git-diff 维护**，不在本地启动任何异步 AI pipeline。核心分两大子系统：

- **`lib/recipe-generation/host-agent-workflows/`** —— 冷启动生成（`alembic_bootstrap`）、增量重扫（`alembic_rescan`）、维度完成回写（`alembic_dimension_complete`）、反捏造证据门、完整性批判、覆盖账本轴、简报预算。这是 Mission Briefing 的生产线：一次性把项目结构事实 + 每字段契约 + 每维分析指引一起返回给宿主 Agent，等待它主动提交知识并逐维完成。
- **`lib/recipe-generation/evolution/`** + `evolution/git-diff-checkpoint/` + `lib/recipe-generation/vector/` —— commit 驱动的机会式进化：用 `git_diff_checkpoints` 表做 tick-on-access 的提交游标推进，扫描 HEAD 变化产出 `FileChangeEvent`，交给 `HostAgentFileChangeHandler` 对**既有 Recipe** 做 source-ref 修复 / update 提案 / deprecate 提案；vector 层则做 Recipe 语义 region 向量与 embedding 相似度注入（进化服务的去重/合并判定用）。

关键设计取向（贯穿全层）：
- **host-agent-only**：插件不跑本地 AI，`cold-start.ts` 顶注明确"插件侧不启动本地 AI pipeline"。所有生成由宿主 Agent 完成，插件返回 briefing。
- **advisory 非阻断**：覆盖账本、覆盖建议、语义向量、git-diff 维护全是 best-effort 旁路，任何失败都被吞掉、绝不改变主响应或阻断维度完成。
- **门禁只在两处硬拦**：submit-path 的反捏造证据门（`recipe-evidence-gate.ts` → Core `validateAgainst`）和 dimension-complete 的生产下限门；覆盖记账/建议/临界批判都不是门禁。
- **Core 承重、Plugin 适配**：覆盖账本写入、生命周期契约、RecipeAuthoringSpec、GitDiffCheckpointService 都下沉到 `@alembic/core`，Plugin 保留 MCP 编排 + fs 读取端口 + 宿主连接点。

---

### 10.1 冷启动生成管线（`cold-start.ts`）

`lib/recipe-generation/host-agent-workflows/cold-start.ts`（1524 行）是 `alembic_bootstrap` 的实现主体。它**不生成任何 Recipe**，而是同步执行 ProjectContext 查询、构建一份 Mission Briefing 一次性返回，然后等待宿主 Agent 主动 `alembic_submit_knowledge` + `alembic_dimension_complete`。

#### 入口与 full/incremental 分派

- `runHostAgentColdStartWorkflow(ctx, args)` `lib/recipe-generation/host-agent-workflows/cold-start.ts:113` —— 薄壳，动态 import `./project-index.js` 并以 `{ mode: 'full' }` 转发。这是 `alembic_bootstrap` 的 MCP handler 入口。
- 真正的实现是 `runHostAgentProjectIndexFullWorkflow(ctx, args)` `cold-start.ts:118`。这一层双宿主锚定：`project-index.ts` 用一个 `mode` 轴把 full/incremental 显式化（见 §10.11），full → cold-start、incremental → knowledge-rescan。

#### plan 生成门（PlanGenerationGate）—— 冷启动的前置正交组件

冷启动第一步不是扫描，而是**过 plan 门**。`runHostAgentProjectIndexFullWorkflow` 的骨架：

1. `resolveProjectRoot(ctx.container)` → `resolveHostAgentDataRoot(...)`（见 §10.9 数据根解析）。
2. `prepareColdStartPlanGate(ctx, args, projectRoot)` `cold-start.ts:139`：
   - `resolvePlanGenerationGate(ctx, args, { defaultStage: 'coldStart', toolName: 'alembic_bootstrap' })` —— 来自 `#recipe-generation/plan-generation-gate.js`（相邻子系统，本节不展开）。plan 门决定 `planSelection.dimensions`（Agent confirm 的维度集）、`moduleScope`、`moduleBindings`、`cleanupPolicy`、`generationStage`、`scale`、`testMode`。
   - `acquirePlanGenerationLease({ gate, idempotencyKey: args?.rescanId, toolName })` —— 获取 plan 生成租约（幂等锁，防同一 rescanId 重入）。
   - 门失败或租约失败 → 直接返回门自身的 response（`{ ok: false, response }`）。
3. `runPlanGatedColdStart(...)` `cold-start.ts:162`，`finally` 块 `gate.lease.release()` 保证租约释放（`cold-start.ts:134`）。

**设计模式**：这是典型的 **gateway + lease/lock** 组合。plan 门是"生成前置"，租约是"生成互斥"，两者都由 Core plan-generation-gate 承载，cold-start 只消费其结果。

#### 破坏性重建确认门

`runPlanGatedColdStart` → `buildColdStartDestructiveConfirmationBlock(projectRoot, planGate, args)` `cold-start.ts:222`：
- 仅当 `planGate.cleanupPolicy === 'full-reset'` 时检查 `inspectKnowledge(projectRoot)`（来自 `#codex/KnowledgeState.js`）。
- 委托 `buildBootstrapRebuildConfirmationBlock(knowledge, args)` `cold-start.ts:1123`（导出供单测直接验证门禁矩阵）：**已有可用知识库且未显式 `{ rebuild: true }`** → 返回 `CODEX_BOOTSTRAP_REBUILD_CONFIRMATION_REQUIRED` 拒绝块，附 nextActions（改用 `alembic_rescan` 保留 Recipe，或 `{ rebuild: true }` 归档到 `.asd/.trash/<时间戳>/` 后重建）。**本次不做任何修改**。这是防止 bootstrap 误清知识库的用户确认闸。

#### 冷启动主流程（plan 通过后）

`runPlanGatedColdStart` 骨架 `cold-start.ts:162`：
1. `createHostAgentColdStartIntent()`（Core）→ `applyPlanGateToProjectAnalysisIntent(intent, planGate)` 把 plan 决策注入 intent。
2. `buildColdStartWorkflowPlan({ intent, projectRoot, dataRoot })`（Core）→ 产出 `plan.projectAnalysis.scan`（maxFiles/sourceFolders）、`plan.cleanup`。
3. `runColdStartCleanup(ctx, input, plan)` `cold-start.ts:233`：`cleanupPolicy === 'none'` → `planGateNoCleanupResult()`；否则 `runFullResetPolicy(...)`（Core），通过 `createCleanupService` 回调注入 `CleanupService`（`#service/cleanup/CleanupService.js`）。**full-reset 会把旧知识移入 trash**。
4. `buildHostAgentProjectContextAnalysis({...})` —— §10.3 事实收集引擎（同步 ProjectContext 查询）。**空项目 fast-path**：`projectContextAnalysis.isEmpty` → `presentHostAgentColdStartEmptyProject(...)` + 附 plan 门数据 + 本地选择不一致（见下），提前返回。
5. `selectProjectContextDimensions(analysis.dimensions, planGate.planSelection.dimensions)` `cold-start.ts:206` —— 用 plan 选中的维度过滤（§10.3）。
6. `buildColdStartMissionBriefingResponse(...)` `cold-start.ts:257` —— 组装 briefing（见下）。
7. 全程末尾用 `attachLocalSelectionMismatch(response, projectRoot)` `cold-start.ts:1171` 包裹：**MT1 P3-3 一致性**——本地工作流即便全局选择不一致仍照常工作（只动本项目数据根），但必须把 `codex_*` 门禁依据的同一事实（`buildLocalSelectionMismatch` from `#codex/HostProjectAlignment.js`）带回 `response.meta.hostProjectSelectionMismatch`，不允许静默绕过。

#### Mission Briefing 组装（层层 attach 的装饰器链）

`buildColdStartMissionBriefing(ctx, input, session)` `cold-start.ts:296` 是一条**装饰器管线**，每一步 attach 一层数据到 briefing：

1. `createProjectContextHostAgentSession(...)` `cold-start.ts:269` → Core 侧建 host-agent workflow session（§10.3）。
2. `buildProjectContextMissionBriefing({ activeDimensions, projectContext, projectMeta, profile: 'cold-start-host-agent', session })`（Core）→ 基础 briefing。
3. `attachPlanScopeTargetCounts(briefing, { moduleScope, sourceFileFacts })` `cold-start.ts:377`（**导出，rescan 也复用**）—— 对每个 plan moduleScope，用 `sourceFileFacts` 过滤出该 scope 下的文件，patch 进 `briefing.targets`（补 `fileCount`/`keyFiles`(前12)/`modulePath`/`source: 'plan-module-scope'`）。已存在的 target 合并取 `fileCount` 最大值，否则 push 新 target。
4. `buildHostAgentAnalysisPacketFromProjectContext(...)`（Core）→ `buildHostAgentAnalysisSurface(...)`（`#codex/host-agent/HostAgentAnalysisSurface.js`）→ `attachHostAgentAnalysisSurface(...)` `cold-start.ts:1200`，同时写 `hostAgentAnalysis` 与 `ideAgentAnalysis` 两个别名（双宿主兼容，字段镜像）+ meta 摘要。
5. `attachColdStartOnboardingSurface({...})` `cold-start.ts:1226` → `buildColdStartOnboardingContract(...)`（`#codex/status/OnboardingContract.js`）+ `buildCurrentDimensionGuidanceFromBriefing(...)` `cold-start.ts:1307`（从 `executionPlan.tiers[0]` 投影当前 tier 维度指引 + `completionRule` + `nextActions` + `invalidConclusions`）。
6. `attachRecipeAuthoringFrontLoad(briefing)` `cold-start.ts:459` —— **13.L 前置契约（关键）**：见下。
7. `attachColdStartCompletenessCriticSurface(...)` `cold-start.ts:1269` —— 给每维挂 completenessCritic（§10.7）。
8. `attachProjectContextCreationGuide(...)`（`#recipe-generation/project-context-anchoring.js`）—— 挂 ProjectContext 锚定指引。

#### RecipeAuthoringFrontLoad（13.L 前置契约 —— guidance == gate）

`buildRecipeAuthoringFrontLoad()` `cold-start.ts:431` 是本管线**质量核心**：把"生成第一个 token 之前 Agent 就该看到的完整创作契约"从 `@alembic/core/knowledge` 的单源规范模块渲染出来：
- `renderGuidance('host-cold-start')` → `guidance.profile/text/requiredFields/imperativeVerbs/evidenceFloor/contentContract/example`。
- `describeSubmitToolFields()` → 每字段契约（字段名 → 含义/生成规则，来自 V3_FIELD_SPEC 单源）。
- `failureModes()` → reject-code → 规避指引目录。
- `buildPreSubmitChecklist()` → 提交前清单。
- **worked example**（`guidance.example`，gate-clean 的 ✅/❌ 范例）是"一次过门禁率的关键证据"。

`attachRecipeAuthoringFrontLoad` `cold-start.ts:459`（**导出，cold-start + rescan(deepMining/moduleMining) 共用，C.3 re-point**）把它挂两处：
- 主位 `hostAgentContract.recipeAuthoringFrontLoad`（在 bootstrap clean-output allowlist 内，干净 structuredContent 可见）。rescan 无 `hostAgentContract` 时不创建，避免污染 rescan 业务面。
- 镜像 `submissionSchema.recipeAuthoringFrontLoad`（不在 allowlist，截断时整份 briefing 落 `fullBriefingRef` 仍可取）。

**坑/历史包袱**：`RECIPE_AUTHORING_FRONT_LOAD_KEY = 'recipeAuthoringFrontLoad'` `cold-start.ts:100` 在压缩阶梯中受保护——worked example 不得被瘦身丢弃。

#### 冷启动响应预算化（compact → trim 逐级瘦身阶梯）

`buildColdStartMissionBriefingResponse` `cold-start.ts:257` 末尾 `budgetColdStartResponseData(response, {...})` `cold-start.ts:515`：
- 委托共享步骤 `budgetBriefingResponseData`（§10.8），传 `transportName: 'bootstrap-briefing'`、`inlineBudgetBytes: COLD_START_BRIEFING_INLINE_BUDGET_BYTES(=18KB)` `cold-start.ts:94`。
- **cold-start 专属瘦身阶梯作为 `compact` 回调注入、不下沉共享层**：`compact: (fullInline, ref) => trimColdStartBriefingToBudget(attachFullBriefingRef(compactColdStartBriefing(fullInline), ref), 18KB)`。注意 `attachFullBriefingRef(ref)` 必须在 `trim` 之前（trim 逐级测量含 ref 的体积）。

`trimColdStartBriefingToBudget(briefing, budgetBytes)` `cold-start.ts:688` 是一个**多级降级状态机**，每级测 `jsonByteLength` ≤ 预算就返回：
1. `compactColdStartBriefing` `cold-start.ts:541`：dimensions/currentDimensionGuidance 只保留前 2 维（`MAX_INLINE_CURRENT_DIMENSION_GUIDES`）的完整 analysisGuide/submissionSpec，其余压缩为 summary。
2. 第一遍压 `hostAgentAnalysis`（`compactHostAgentAnalysis` `cold-start.ts:750`，限 nextUnits 3 / progress 20 / readSet 20 / sourceRefs 24 / structuralRefs 12）。
3. 第二遍再压（更狠：1/8/8/8/4）。
4. `compactColdStartLargeAnalysisFields` `cold-start.ts:789`：ast/dependencyGraph/guardFindings/panorama/mustCoverModules 全部 summarize，`hostAgentContract` → `compactHostAgentContract`（`cold-start.ts:872`，只保留契约骨架 + fieldFloors + toolCapabilityMatrix 前 12），删 `initialToolBriefing/progress/session` 等。
5. `reduceCurrentDimensionGuidanceDetail(compact, 1)`：当前维度指引降到 1 维完整。
6. `minimalColdStartInlineData` `cold-start.ts:837`：最后兜底，只保留白名单键（bootstrapState/dimensions/hostAgentContract/planGate/gates 等）。

**关键保护**：`summarizeSubmissionSchema` `cold-start.ts:1058` + `compactRecipeAuthoringFrontLoad` `cold-start.ts:1083`——压缩态"其它分析字段先瘦身，example 保命"，`workedExample` + `evidenceFloor` + 祈使动词永远保留内联，完整前置契约随 `fullBriefingRef` 可取。

**边界收尾**：`attachBriefingTransportMeta(response, data)`（§10.8，把 data 里的 `fullBriefingRef` 投影到顶层 `response.meta`，避免被 clean-output 吞掉）+ `attachColdStartTrashMessage` `cold-start.ts:1105`（cleanup 移入 trash 时提示归档路径与可恢复项数）。

---

### 10.2 维度完成回写（`dimension-completion.ts` = `alembic_dimension_complete`）

`lib/recipe-generation/host-agent-workflows/dimension-completion.ts`（1790 行）是宿主 Agent"完成一个维度"的收口工具。它做四件事：**过证据门 → 绑定 Recipe → 建 Skill → 标记完成并镜像写覆盖账本**。

#### 主入口与阶段编排

`runHostAgentDimensionCompletionWorkflow(ctx, args, dependencies={})` `dimension-completion.ts:281`（`dependencies` 是**依赖注入**测试口：getActiveSession/generateSkill/saveCheckpoint/createEmitter/now/runCompletionFinalizer 全可覆盖）：
1. `normalizeCompletionInput(args)` `dimension-completion.ts:1082`：校验 `dimensionId`（必填）、`analysisText`（≥10 字符）、`submittedRecipeIds`（数组）；归一化 analysisUnitIds/skipped/rejected/remaining/noPadding/crossDimensionHints 等。
2. `resolveHostAgentCompletionSession(...)` `dimension-completion.ts:1138`：取 active bootstrap session（无 → `SESSION_NOT_FOUND`，提示先 `alembic_bootstrap`）。
3. `extendSessionTtl(session)` `dimension-completion.ts:1182`：把 `expiresAt` 至少延到 now+1h（支持旧 session 在新 bootstrap 后继续 dimension_complete）。
4. 校验 `dimensionId` 属于 session.dimensions（否则 `VALIDATION_ERROR` 列出合法维度）。
5. **恢复兜底**：`referencedFiles` 空 → `recoverReferencedFiles`（从 submissionTracker 的 sources 剥行号）`dimension-completion.ts:1188`；`submittedRecipeIds` 空 → `recoverSubmittedRecipeIds`（从 tracker recipeId）`dimension-completion.ts:1208`。
6. **证据门（副作用前）**：`validateDimensionCompletionBeforeSideEffects(...)` `dimension-completion.ts:1022`（§10.6）。失败 → `releaseTerminalNoPaddingRescanResources`（见下）+ 返回门失败响应。
7. `applyDimensionCompletionSideEffects(...)` `dimension-completion.ts:364`：真正的写入。
8. `buildDimensionCompletionSuccessResponse(...)` `dimension-completion.ts:975`：返回 progress/completedDimensions/remaining/skillCreated/projectSkillDelivery/completenessCritic/evidenceHints/hostAgentAnalysisProgress 等。

#### 副作用序列（`applyDimensionCompletionSideEffects` `dimension-completion.ts:364`）

按顺序：
1. `buildHostAgentAnalysisProgressBackfill(...)`（Core，`#codex/host-agent/HostAgentAnalysisSurface.js`）—— 把 analysisUnitIds/skipped/rejected/remaining 拍成进度回填。
2. `bindSubmittedRecipes(...)` `dimension-completion.ts:1228`：对每个 recipeId，`knowledgeService.get` → 打 `dimensionTags(dimensionId,...)` + `bootstrap:${session.id}` 标签 → `knowledgeService.update`。逐条 try/catch 降级（tagging 失败不阻断）。返回 `recipesBound` 计数。
3. `createHostAgentDimensionSkill(...)` `dimension-completion.ts:1302`：仅 `dimension.skillWorthy` 时建 Skill。`synthesizeSkillAnalysisIfNeeded` `dimension-completion.ts:1354` 会把提交的 Recipe 的 title/description/when/do/don't/coreCode(前500) 合成一份更长的 analysisText，再调 `generateWorkflowSkill`（`#workflows/capabilities/execution/WorkflowSkillCompletionCapability.js`）。
4. `markDimensionCompleteOrFailure(...)` `dimension-completion.ts:442`：`session.markDimensionComplete(dimensionId, {...})` → 得 `qualityReport`。**质量门二次拦**：`qualityReport.pass === false` → `validateDimensionCompletionFailedQuality` 再跑一次证据门产出失败响应。
5. `persistAndBroadcastDimensionCompletion(...)` `dimension-completion.ts:477`：持久化 + 广播 + 覆盖账本（见下）。

#### 持久化与广播（`persistAndBroadcastDimensionCompletion`）

- `persistDimensionCheckpoint(...)` `dimension-completion.ts:1446`：`saveDimensionCheckpoint(dataRoot, sessionId, dimensionId, {...})`（Core）——写 candidateCount/analysisChars/referencedFiles/recipeIds/skillCreated/hostAgentAnalysisProgress（+ ideAgentAnalysisProgress 镜像）。
- `persistKeyFindings(...)` `dimension-completion.ts:1487`：对每条 keyFinding，`knowledgeGraphService.addEdge(dimensionId, 'dimension', finding(前80), 'finding', 'discovered_in', {...})` —— 把发现固定进知识图谱。
- `emitHostAgentCompletionProgress(...)` `dimension-completion.ts:1522`：`BootstrapEventEmitter`（`#recipe-generation/bootstrap/BootstrapEventEmitter.js`）发 `emitDimensionComplete` + （若 `isComplete`）`emitAllComplete`。
- `isComplete` → `runWorkflowCompletionFinalizer(...)`（`#workflows/capabilities/completion/WorkflowCompletionFinalizer.js`）——全维完成的终结器。
- `crossDimensionHints` → `session.storeHints`；随后 `buildQualityFeedback`/`buildEvidenceHints`（前序维度证据回喂给 Agent 避免重复分析，`dimension-completion.ts:1680`）/`buildSubpackageCoverageWarning`（未覆盖本地子包告警，`dimension-completion.ts:1632`）/`buildCompletionCompletenessCritic`（§10.7）。

#### per-(module×dimension) 覆盖账本镜像写入（U2a —— 核心 canonical 统一逻辑）

`writeDimensionCompletionCoverageLedger(args)` `dimension-completion.ts:626` 是维度完成的**advisory 覆盖记账**（放在 critic 之后、return 之前，整段 best-effort，账本写失败不改响应、不阻断完成）：
1. `ctx.container.get('coverageLedgerRepository')`（`EvolutionCoverageLedgerRepository`）不可用 → debug 跳过（旧容器/部分启动）。
2. `ctx.container.get('moduleService')`（`CanonicalModuleServiceLike`）不可用或无 `listCanonicalModules` → 跳过。**no-guess：无 canonical 模块就没有可信 module 轴，绝不臆造模块**。
3. `listCanonicalModules()` → 用 `filterGenericParentCoverageModules`（§10.5）剔除泛化父模块 → `buildCoverageLedgerModuleAxisFromSummaries`（Core）→ `rawModules`。module 轴优先 `ownedFiles`，缺失才用模块根路径兜底；Core `pathsOverlap` 是 segment-safe 目录匹配（`src/auth` 不会误归 `src/authentication`）。
4. **target 轴污染守卫**（§10.4）：`preferTargetScopedCoverageItems(rawModules)`。若本批无 target-scoped 模块（`targetScopedCount === 0`）但账本里已有 target cell（`existingTargetCellCount > 0`）→ **跳过**，避免用聚合模块污染已有 target 轴。
5. 候选构造：`coveredPaths` = referencedFiles 去行号（`ref.replace(/:\d+(?:-\d+)?$/, '')`）；`candidates` = coveredPaths（importance 60，已落点=已覆盖）∪ 各模块 ownedPath（importance 50，未被引用→暴露 thin/blank 缺口，正是 deepMining 想要的空白信号）。
6. `perCellTarget = resolvePerCellTargetDefault(resolveModuleTier(modules.length))`（Core，tier→D2 默认目标）。
7. **exhausted 声明**：仅当 Agent 显式 `noPadding === true` 且 `exhaustedReason` 非空时，才对每模块落 `agent-declared` 尽力声明。
8. 轮号戳：`listRoundsByProjectRoot` 取最新轮号（无则 0），这批 cell 归属该轮。
9. `writeCoverageLedgerForCompletion({...})`（§10.4，Core 承载）。
10. **U2d 轮次回流**：`reflowDeepMiningRoundOnCompletion({ repository, projectRoot, newRecipeCount })`（Core）——把本次新增 recipe 数累计进当前已开轮的 `new_recipes_this_round`，推进 completedAt。`newRecipeCount` = candidateCount>0 ? candidateCount : submittedRecipeIds.length。**这是收益递减判定的真实输入**：不回流会把刚开的、产出仍为 0 的本轮当"上一轮"误判递减，令多轮循环每轮立即停止。
- **D3 边界**：本路径只写 `coverage_ledger`，绝不触达 `git_diff_checkpoints`。

#### terminal noPadding 资源释放（rescan 会话生命周期）

`releaseTerminalNoPaddingRescanResources(...)` `dimension-completion.ts:775`：当 `noPadding === true` 且证据门以 `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT` 失败但已提交过 recipe（`submittedRecipeIds.length > 0`）——即 Agent 显式声明"该维已挖尽、无更多 grounded pattern"——释放 host-agent session（`releaseHostAgentSessionById` `dimension-completion.ts:812`，双轨：全局 sessionManager + data-root scoped，`allowBlindClear` 分别 true/false）+ 关闭最新未完成的 host-agent-rescan 轮（`closeLatestOpenHostAgentRescanRound` `dimension-completion.ts:938`，`upsertRound({ completedAt: now })`）。这让"尽力挖尽"能干净收尾而不悬挂空 session/开轮。

#### 失败响应形状

`evidenceGateFailureResponse(tool, evidenceGate)` `dimension-completion.ts:1767`：errorCode=`primaryEvidenceGateCode`（首违规码），data 带 `evidenceGate.violations` + `problem`（type `alembic.dimension-evidence-gate.rebuild-required`、nextAction 取首违规）。

---

### 10.3 项目事实收集引擎（`project-context-analysis.ts`）

`lib/recipe-generation/host-agent-workflows/project-context-analysis.ts`（942 行）是 cold-start / rescan 共用的**同步事实收集**——不跑 AI，只通过 `@alembic/core/project-context` 的 `ProjectContextCapabilities.execute` 逐层查询项目结构/源码/符号，产出 `HostAgentProjectContextAnalysis`。

#### 事实收集主函数

`buildHostAgentProjectContextAnalysis(input)` `project-context-analysis.ts:197` 是一条 ProjectContext **分层查询 pipeline**（每层一次 `executeProjectContextRequest`，`project-context-analysis.ts:365`，它是 `ProjectContextCapabilities.execute` 的薄包装）：
1. `space` 查询（includeProjectTree + sourceFolders）。
2. 首次 `repo` 查询（无 map summary，scoped 到主 sourceFolder）→ `repoData`。
3. `collectProjectSourceFileFacts(projectRoot, { sourceFolders })`（Core `@alembic/core/service/planFacts`）→ `sourceFileFacts`（真实磁盘源文件事实，**module 轴 / 语言推断的唯一权威来源**）。
4. **module seed 三源合并**：`selectProjectContextModuleSeeds`（`project-context-analysis.ts:563`，从 repo 的 localPackages/sourceRoots/topAreas/entrypoints/targets 派生）∪ `createModuleScopeFallbackSeeds`（plan moduleScope 兜底）∪ `createSourceFolderFallbackSeeds`（ProjectScope sourceFolder 兜底）→ 去重 → `attachSourceFilesToProjectContextModuleSeeds`（Core，把真实源文件挂到 seed）→ 取前 `maxModuleSeeds(=25)`。
5. 有 seed → 第二次 `repo`（含 map summary + moduleSeeds）+ `map` 查询。
6. 前 `maxModuleDetails(=3)` 个 seed → `module` + `module-layers` 查询。
7. `selectProjectContextDetailFiles`（`project-context-analysis.ts:738`，从 module ownedFiles + refs 选前 `maxFileDetails(=8)` 文件）→ 每文件 `file-flow`/`file-symbols`/`source-slice`/`anchor-range` 四查询。
8. `buildProjectContextPresenterInput(envelopes)`（Core）→ 汇总成 presenterInput。
9. **语言推断**：`inferProjectContextPrimaryLanguage`（`project-context-analysis.ts:757`，优先真实源文件事实的代码语言，排除 json/md/xml/yaml，回退 repo languages）+ secondary。
10. **U1 #6 canonical 对齐（方案A）**：`canonicalizeModuleSeedRefs(moduleSeeds, presenterInput.map?.modules)` `project-context-analysis.ts:676` —— 对每个派生 seed，用归一化 modulePath（或 ownedFiles 首项）匹配 canonical ProjectMap 模块（`module.ref.scope.filePath`），命中则**覆盖 seed 的 name/id 为 canonical 权威值**（多候选取最长路径=最具体模块）；未命中保留派生名（不丢 seed）。map 不可用则原样返回。这是"派生 seed 名"与"canonical 模块名"统一的第一处落点。

返回 `HostAgentProjectContextAnalysis`：dimensions/envelopes/fileCount/isEmpty/moduleCount/moduleSeeds(canonical化)/presenterInput/primaryLang/projectType/requestKinds/secondaryLanguages/sourceFileFacts。`isEmpty` = `presenterInput.files.length === 0 && refs.length === 0`。

#### 维度选择

`selectProjectContextDimensions(dimensions, requestedDimensionIds?)` `project-context-analysis.ts:355`：无请求维度 → 全量；有 → `resolvePlanDimensionDefinitions(baseDimensions, requestedDimensionIds)`（Core）。冷启动/rescan 都用 plan confirm 的维度过滤基础维度集。

#### host-agent session 生命周期（空-stale 租约回收）

- `createProjectContextHostAgentSession(input)` `project-context-analysis.ts:68`：先 `releaseEmptyHostAgentSessionLease`（回收空-stale 租约）再 `createSession`；若建 session 抛 `BOOTSTRAP_IN_PROGRESS` 且刚释放过空租约 → 重试一次。
- `releaseEmptyHostAgentSessionLease(input)` `project-context-analysis.ts:174`：只回收"空且过期"的 session（`isEmptyStaleHostAgentSession`，默认 staleAfterMs=5min）。`isEmptyHostAgentSession` `project-context-analysis.ts:426` 严格判空：无 completedDimensions、getProgress().completed=0、sessionStore/submissionTracker 都无证据。
- `releaseEmptyHostAgentSessionLeaseForProject`（rescan 用，`allowFreshEmpty` 时 staleAfterMs=0 立即回收）/ `releaseEmptyHostAgentSessionLeaseById`（按 id 回收，dimension-complete terminal 路径用）。

**设计模式**：session 用 **lease/租约 + 惰性回收**，避免空的 bootstrap session 悬挂锁住项目。

---

### 10.4 覆盖账本轴与写入（`coverage-ledger-write.ts` / `coverage-ledger-target-axis.ts`）

覆盖账本（`coverage_ledger` 表）记录 per-(module×dimension) 的覆盖 cell，是 deepMining 多轮收敛的核心数据结构。

#### 写入下沉 Core

`lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts`（16 行）**只是兼容入口**：`writeCoverageLedgerForCompletion` / `reflowDeepMiningRoundOnCompletion` 及相关类型全部 re-export 自 `@alembic/core/host-agent-workflows`。这是刻意的"搬运而非重写"——写入逻辑 CG-3=B sink 到 Core，Plugin 只保留旧 `#recipe-generation/...` import 路径，避免消费方迁移时再复制 Core 实现。

#### target 轴（canonical 统一的关键：target:name:path）

`lib/recipe-generation/host-agent-workflows/coverage-ledger-target-axis.ts`（50 行）定义了 **canonical module-id 判据**——覆盖账本的 canonical 统一选 `target:name:path` 形状（对照残留笔记 R-1：canonical=target:name:path）：
- `isTargetScopedCoverageModuleId(moduleId)` `coverage-ledger-target-axis.ts:5`：`moduleId.trim().startsWith('target:')`。这是"是否真实 target-scoped 模块"的唯一判据。
- `preferTargetScopedCoverageItems(items)` `coverage-ledger-target-axis.ts:9`：若存在 target-scoped item → **只保留它们**（mode `target-scoped`），过滤掉聚合/根模块；否则原样返回（mode `unchanged`）。返回 `filteredCount`/`targetScopedCount`。
- `countTargetScopedCoverageItems` / `uniqueTargetScopedCoverageModuleCount`：计数与去重计数。

这三个函数在 dimension-completion（`dimension-completion.ts:674`）、knowledge-rescan seed（`knowledge-rescan.ts:393`）、coverage advisory（`knowledge-rescan.ts:1613`）三处一致用于"把 module 轴收敛到 target scope，防聚合模块污染"。

**已知历史包袱（对照 memory R-1）**：in-process 主体侧的 module-id 派生（plain module.id）与 host target 侧（target:name:path）在**非空 ProjectMap** 时可能重新分歧；BiliDili 空-map 才恰好相等。本层 Plugin 侧已统一走 target:name:path 判据，但双宿主 module-id 派生的真统一是未闭合残留。

---

### 10.5 module 轴去噪（`coverage-module-axis.ts`）

`lib/recipe-generation/host-agent-workflows/coverage-module-axis.ts`（64 行）—— **R-1：Core 负责 canonical id 生成，Plugin 只在喂 Core 前剔除 host 投影里的泛化父模块**。

`filterGenericParentCoverageModules(modules)` `coverage-module-axis.ts:12`：
- 对每个候选，归一化 moduleId/modulePath。
- 保留条件：无 path、或已是 target-scoped（`target:` 前缀）、或**不是任何其他模块的严格父路径**（`coverageModuleAxisPathContains` = `childPath.startsWith(parentPath + '/')`）。
- 即：`Sources`/`src`（容器轴）与 `Auth`/`src/auth`（真实 target）并存时，剔除前者——泛化父模块不能被 canonical 成真实 target。

在 dimension-completion（`dimension-completion.ts:665`）与 rescan 的三种 module axis builder（`knowledge-rescan.ts:602/610`）前置调用。

---

### 10.6 反捏造证据门（`recipe-evidence-gate.ts`）

`lib/recipe-generation/host-agent-workflows/recipe-evidence-gate.ts`（546 行）是**唯一的硬门禁子系统**——挡住宿主 Agent 提交/完成时的捏造证据。**P1.2 re-point（CG-3, byte-identical）**：纯谓词（floor 表、snippet 算法、source-ref regex、placeholder 黑名单、relationship 关键词）已从本文件搬到 Core 的权威 `RecipeAuthoringSpec`，本文件改为委托 `validateAgainst`（`@alembic/core/knowledge`）。两处运行时耦合以 Core 的 typed port 注入回来。

#### submit-path 证据门（§C.11 两 port 分离）

`validateRecipeProductionEvidenceGate({ args, items, projectRoot, session, skipConsolidation })` `recipe-evidence-gate.ts:237`：
- **session 违规由 Plugin 侧产出并整体前置**（`validateRecipeSessionScope` `recipe-evidence-gate.ts:291`）—— 逐字节保持 live 顺序（所有 session 违规在前）+ 双发 WRONG_SCOPE（projectRoot 不符 + dimension 不符可一次产两条）。
- **per-item 纯 evidence 谓词委托 Core** `validateAgainst(items, { stage: 2, path: 'host-cold-start', sourceRefResolver, projectRoot })`。
- `sourceRefResolver`（§C.11 port，`createSourceRefResolver` `recipe-evidence-gate.ts:133`）—— 包装本仓库原有 on-disk 读取（fs.existsSync/statSync/readFileSync），产出 `SOURCE_REF_INVALID`（绝对路径/`..`/越出 root）/`SOURCE_REF_NOT_FOUND`（文件不存在）/`SOURCE_REF_LINE_OUT_OF_RANGE`（行号越界），或返回 `{ rangeText, sourcePath }` 供纯 snippet/floor 谓词消费。closure 捕获 sourcePath 重建 `acceptedEvidence.referencedFiles`。
- `createSessionScope`（§C.11 port，`recipe-evidence-gate.ts:218`）—— 仅返首个 session 违规，满足 Core 端口契约 + drift tripwire 真实可用性，**不参与 submit-path 逐字节排序**（因 Core 单违规 port 无法表达双发+全部前置）。
- `shouldRunRecipeEvidenceGate` `recipe-evidence-gate.ts:101`：有 session / sessionId / bootstrapSessionRef / requireProductionSession / dimensionId / item.dimensionId 之一 → 跑门。

#### dimension-complete 生产下限门

`validateDimensionCompletionEvidenceGate({...})` `recipe-evidence-gate.ts:353`（dimension-completion 副作用前后各调一次）—— **纯本地 floor 校验，硬拦**：
- `DIMENSION_RECIPE_ID_NOT_BOUND`：无 session-bound recipe / recipeId 不在 session 提交集 / candidateCount 超过实际验证数。
- `DIMENSION_CANDIDATE_COUNT_INSUFFICIENT`：验证的 session-bound recipe < 3（`verifiedCandidateCount < 3`，`recipe-evidence-gate.ts:409`）。
- `DIMENSION_REFERENCED_FILES_MISSING`：无 referencedFiles 且无可恢复提交文件 / referencedFiles 与 session-bound source refs 无重叠。
- `DIMENSION_KEY_FINDINGS_INSUFFICIENT`：具体发现（trim≥20 字符）< 3。
- `DIMENSION_ANALYSIS_TEXT_INSUFFICIENT`：analysisText < 500 字符。
- `QUALITY_GATE_FAILED`：qualityReport.pass=false。
- 全通过 → `acceptedEvidence`（analysisChars/keyFindingCount/recipeIds/referencedFiles/verifiedCandidateCount）。

`buildEvidenceGateFailureData`（`recipe-evidence-gate.ts:484`）/ `primaryEvidenceGateCode`（首违规码或 QUALITY_GATE_FAILED）供响应构造。

**边界**：这两个门是本层唯一"能拒绝写入"的地方，其余全 advisory。`previewDimensionQualityReport`（`recipe-evidence-gate.ts:331`，try/catch 吞错）在副作用前预算质量报告喂给证据门。

---

### 10.7 完整性批判（`completeness-critic.ts`）

`lib/recipe-generation/host-agent-workflows/completeness-critic.ts`（595 行）是 **advisory 的"这维还该挖什么"引导器**（非门禁）——把 ProjectContext / session 事实投影成 Core `buildCompletenessCritic` 的输入，产出每维的覆盖状态 + mining 指引 + 未覆盖缺口提示。

- `buildColdStartCompletenessCriticByDimension({ dimensions, projectContextAnalysis })` `completeness-critic.ts:70`：冷启动每维一份 critic（submittedRecipeCount=0，纯"待挖引导"）。
- `buildDimensionCompletionCompletenessCritic(input)` `completeness-critic.ts:105`：dimension-complete 时用 session snapshot + 已提交 recipe + referencedFiles 算"还差多少到 target"。
- `projectCompletenessCriticForAgent(result, options)` `completeness-critic.ts:134`：把 Core 结果投影成 Agent 可读结构（status/targetGate/shouldBlockCompletion/hints/sortedMiningGuidance/notes，各截断），用于挂进 briefing 与 dimension-complete 响应。
- 事实树构造：`buildProjectContextCompletenessTree`（`completeness-critic.ts:203`，从 presenter files/modules/areas/symbols/majorFlows/hotspots）+ `buildSessionCompletenessTree`（`completeness-critic.ts:326`，已覆盖 vs 未覆盖模块打不同 importance——未覆盖 95、已覆盖 55，暴露空白）。
- `buildDimensionMiningGuidance`（`completeness-critic.ts:433`）产三条指引：definition（该维定义 + knowledgeTypes + 项目规模）/ module-coverage（优先覆盖模块而非灌水相似 Recipe）/ no-padding（挖尽就 noPadding + exhausted reason，别造 Recipe）。

常量：`DEFAULT_TARGET_PER_DIMENSION=5`、`DEFAULT_FLOOR_PER_DIMENSION=3`（`completeness-critic.ts:64`）—— 与证据门的 <3 拦截口径一致。

---

### 10.8 简报预算（`briefing-budget.ts`）

`lib/recipe-generation/host-agent-workflows/briefing-budget.ts`（134 行）是 **cold-start 与 rescan 共享的"响应 data 预算化"步骤**（U3），复用 `@alembic/core/service/planFacts` 的 transient-transport 原语。stage-无关，不持有任何 stage 专属压缩判定。

- `budgetBriefingResponseData(response, options)` `briefing-budget.ts:90` 核心状态机：读 `response.data` → `attachRef(data, null)` 占位测量（保证与最终形态同字节口径）→ ≤预算：内联回填 + `removeTransientTransportIfPresent`（幂等清旧 transient）；>预算：`writeTransientTransport` 完整落盘 → 有 `compact` 回调（cold-start）就跑瘦身阶梯、否则只 `attachRef(fullInline, ref)`。**cold-start 提供 compact（逐级瘦身）、rescan 不提供（超预算只附引用，有意不对称）**。
- `attachFullBriefingRef(briefing, ref)` `briefing-budget.ts:24`：把 ref 写进 `meta.fullBriefingRef`（复用 output allowlist 既有键，扩展到 rescan 无需改 allowlist）。
- `attachBriefingTransportMeta(response, briefing)` `briefing-budget.ts:44`：把 `data.meta.fullBriefingRef` + `coverageLedgerSeed` 投影到顶层 `response.meta`（MCP clean output 只投影顶层 meta，不投影则 ref 被 data 清洗边界吞掉）。
- `BRIEFING_INLINE_BUDGET_BYTES = 18KB`（沿用 cold-start 历史口径）。

---

### 10.9 数据根解析 & 索引重建（`project-data-root.ts` / `knowledge-index-rebuild.ts`）

#### 数据根解析

`lib/recipe-generation/host-agent-workflows/project-data-root.ts`（19 行）—— `resolveHostAgentDataRoot(container, projectRoot)`：**先按当前 Codex 项目身份从原生 ProjectScope 注册表解析**（`WorkspaceResolver.fromProjectScopeRegistry(projectRoot).dataRoot`），失败才回退 `resolveDataRoot(container)`（legacy 容器 fallback，注释标 `@scope-singleroot(temporary)`），再回退 projectRoot。这挡住"共享 MCP 容器携带 resident/旧选择项目状态"导致写错数据根的坑。

#### rescan 派生索引重建

`lib/recipe-generation/host-agent-workflows/knowledge-index-rebuild.ts`（253 行）—— rescan cleanup 后恢复 Recipe 文件↔DB↔source-ref↔region-vector 桥接（rescanClean 保留 recipes/ 与 DB 记录，但可能清派生桥接表）：
`rebuildLocalKnowledgeIndexes(ctx)` `knowledge-index-rebuild.ts:80` 三步：
1. `syncKnowledgeEntries`：`knowledgeSyncService.sync(db, { force: true })`（Recipe 文件 → knowledge_entries）。
2. `reconcileSourceRefs`：`sourceRefReconciler.reconcile({ force: true })`（reasoning.sources → recipe_source_refs）。**U6 P4 rename 修复**：`stale > 0` 时 `maybeRepairRenames` `knowledge-index-rebuild.ts:188` 激活 `repairRenames`（git rename 检测→标 renamed）→ `applyRepairs`（写回 .md+DB→转 active），顺序固定、幂等（Core 早返回保证）、best-effort（缺方法则 info 跳过）。
3. `buildRecipeSemanticRegionVectors`（§10.10）→ `warnIfRegionVectorsNotBuilt` `knowledge-index-rebuild.ts:105`：region-vector 未真建（skipped/failed）时发高可见 warn——"semantic_memories 维持 0、subject-less prime 挣不到 recipe-semantic-region 信任证据"。

**就绪未接线**：`resolveRescanScanBatchCap(tier)` `knowledge-index-rebuild.ts:241` + `D2_SCAN_BATCH_CAP_BY_TIER({S:50,M:150,L:400})` —— fingerprint/rescan 单批扫描上限 tier 表（env `ALEMBIC_RESCAN_SCAN_BATCH_CAP` 覆盖，守卫拒 cap<1）。**⚠ blocked-on-Core**：Core `SourceRefReconciler.reconcile` 尚未暴露 cap 形参，故本 cap 目前无注入出口，先固化权威表避免散落魔数。

---

### 10.10 Recipe 语义 region 向量（`recipe-region-vector.ts`）

`lib/recipe-generation/host-agent-workflows/recipe-region-vector.ts`（659 行）—— PDR-2b：在 in-process bootstrap/rescan 路径内建 Recipe 语义 region 向量。这些 region chunk 是 subject-less prime 检索的、用来挣 `recipe-semantic-region` 信任证据（全质量、无 lexical 降级）的对象。

`buildRecipeSemanticRegionVectors(ctx)` `recipe-region-vector.ts:72`：
- **availability-gated**：先 `vectorService.getAvailability()` 探测，provider 缺失/降级 → **整体跳过**（而非跑 `syncRecipeSemanticRegions`——其 removeStale 步先于 embed 步，会剥掉 changed-recipe chunk 却不 re-embed）。
- **non-blocking**：任何失败 log + swallow，rescan 仍返回。各跳过路径统一 `skippedRegionBuildReport`（services-unavailable / vector-availability-unavailable / vector unavailable / knowledge-list-failed / no-recipe-entries）。
- 主流程：`knowledgeService.list`（单页 100k，避免分页循环）→ `buildSourceRefsBridgeByRecipeId`（`recipe-region-vector.ts:217`，从 recipeSourceRefRepository 取 active/renamed 路径作 bridge）→ `syncRecipeSemanticRegionVectorsInBatches`（批 6 条，`RECIPE_REGION_SYNC_BATCH_SIZE`）→ `syncRecipeSemanticMemoriesForEntries`（`recipe-region-vector.ts:388`，把 Recipe 投影成 semantic memory 行，id 前缀 `recipe-region-memory:`，deprecated 跳过，deleteStale 清孤儿）→ `flushVectorStore`。
- `buildRecipeSemanticMemory` `recipe-region-vector.ts:491`：把 title/trigger/when/do/don't/content/sources 拼成 ≤1200 字符 content，importance 从 quality.overall 映射到 [1,10]。

**宿主连接点**：向量 provider = 本地 Ollama（§10.12），provider 缺（如冷启动无 creds/Ollama 未起）时整段跳过，semantic_memories 维持 0（对照 memory：embed-provider-missing=Ollama 未起语义跳过）。

---

### 10.11 增量重扫（`knowledge-rescan.ts` = `alembic_rescan`）+ 编排入口（`project-index.ts`）

#### full/incremental 编排入口

`lib/recipe-generation/host-agent-workflows/project-index.ts`（54 行）—— Plugin 本地 project-index 编排，保留 Codex host-agent 与 Alembic in-process 宿主分裂，只把 full/incremental 模式选择显式化。`runProjectIndexWorkflow(ctx, args, options)` `project-index.ts:33` 按 `options.mode` 分派：`full` → `runHostAgentProjectIndexFullWorkflow`（cold-start）、`incremental` → `runHostAgentProjectIndexIncrementalWorkflow`（rescan）。这是"6 链双宿主锚定 + orchestrator 统一"的落点：mode 轴在 orchestrator 之上靠动态 import 隐式编码。

#### 增量重扫主流程

`lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`（1948 行）是 `alembic_rescan` 主体：保留已审核 Recipe、清理衍生缓存、按维度/模块重扫、附覆盖 seed + 收敛建议 + commit 驱动进化，返回 Mission Briefing。

`runHostAgentProjectIndexIncrementalWorkflow(ctx, args)` `knowledge-rescan.ts:144`：
1. plan 门 `resolvePlanGenerationGate`（默认 stage = `resolveDefaultRescanGenerationStage` `knowledge-rescan.ts:1278`：有 moduleScope 或 `moduleMining` → `moduleMining`，否则 `deepMining`）。
2. `releaseEmptyHostAgentSessionLeaseForProject`（allowFreshEmpty，rescan 替换空 bootstrap session）+ `acquirePlanGenerationLease`。
3. `prepareRescanState`（见下）→ 空项目 fast-path → `buildRescanResponse`，`finally` 释放租约。

`prepareRescanState(ctx, args, planGate)` `knowledge-rescan.ts:194`：
- `createHostAgentKnowledgeRescanIntent({...})` + **U2b chain**：`derivePerCellTargetsFromGate(planGate.moduleBindings)` `knowledge-rescan.ts:1894` 派生 `perDimensionTargets`（同维多 binding 取 MAX）+ `moduleDimensionTargets`（per-cell 拍扁，`flattenModuleBindingsToCells` `knowledge-rescan.ts:1856`），非空才注入意图（零回归）。这让"Agent confirm 的 per-(模块×维度) 目标 → intent → Core gap"链条显式。
- `cleanupPolicy` 映射（full-reset→rescan-clean）、`analysisMode`（force-rescan→full 否则 incremental）。
- `buildKnowledgeRescanWorkflowPlan` → `runRescanCleanup`（`knowledge-rescan.ts:283`，force-rescan / rescan-clean / none 三政策，snapshot 保留 Recipe）。
- `cleanupPolicy !== 'none'` → `rebuildRescanIndexes`（§10.9）。
- `buildHostAgentProjectContextAnalysis`（§10.3）。
- `seedRescanCoverageLedgerFromSnapshot`（见下）+ `runRescanUnifiedEvolution`（§10.11 commit 驱动）。

#### 覆盖账本 seed（从既有 Recipe 证据播种）

`seedRescanCoverageLedgerFromSnapshot(ctx, input)` `knowledge-rescan.ts:344`（仅 deepMining/moduleMining stage）：
- module 轴三级回退 `buildRescanCoverageModuleAxis` `knowledge-rescan.ts:597`：`project-map`（canonical ProjectMap.modules）→ `project-context-targets`（从 target 名 + sourceFileFacts 推断 target-scoped 模块，`buildProjectContextTargetCoverageModuleSummaries` `knowledge-rescan.ts:653`，用 `normalizeTargetScopedCoverageModuleId` 造 `target:name:path` id）→ `rescan-snapshot`（moduleSeeds + moduleBindings 兜底）。全经 `filterGenericParentCoverageModules` 去泛化父。
- target 轴污染守卫（同 dimension-completion）：`rescan-snapshot` 源 + 无 target 模块但已有 target cell → 跳过。
- 候选：已有 Recipe 的 sourceRefs（importance 70，已覆盖）∪ 各模块 ownedPaths（importance 50）→ `writeCoverageLedgerForCompletion`（Core）→ `summarizeCoverageLedgerSeed`（`knowledge-rescan.ts:925`，统计 targetScopedCells/measuredCells/coveredPathCount/aggregateOrRootModuleIds）。
- `reconcileCoverageLedgerSeedWithPersistedState` `knowledge-rescan.ts:509`：写后从持久 cell 重投影 seed，检测 `aggregate-or-root-coverage-cells` 不一致（`status: 'inconsistent'`）——防降级掩盖（对照残留 R-4：host seed projection 与 SQLite 独立性）。

#### 响应组装与生命周期（`buildRescanResponse`）

`buildRescanResponse(ctx, state, responseTimeMs)` `knowledge-rescan.ts:1125` 是 rescan 的**生命周期决策状态机**：
- `buildRescanPlanning`（`knowledge-rescan.ts:1370`）：`auditRecipesForRescan` + `buildKnowledgeRescanPlan`（喂 moduleCellBindings/canonicalModuleCount/perDimensionTargets/**ledgerCoverageByDimension**——`loadLedgerCoverageByDimension` `knowledge-rescan.ts:1290` 从账本读每维已覆盖计数，让 Core existingCount 优先用账本而非现算）→ executionDimensions/produceDimensions/evidencePlan/prescreen。
- `buildRescanBriefing`（`knowledge-rescan.ts:1435`）：同 cold-start 复用 `buildProjectContextMissionBriefing` + `attachRecipeAuthoringFrontLoad`（C.3 re-point，逐字一致契约）+ hostAgentAnalysis surface + ProjectContext guide。moduleMining stage 才 `attachPlanScopeTargetCounts`（对称 cold-start）。
- attach 链：`attachPlanGenerationGateData` / `attachRescanUnifiedEvolution`（`knowledge-rescan.ts:1556`，surface evolution.pendingProposals/generationChangeLog；**U2e** 退役 gitDiffEvidence/moduleMiningRoutes 杂质）/ `attachTrashArchiveMessage` / `attachHostProjectSelectionMismatch` / `attachCoverageLedgerSeedMeta`。
- **U2d 覆盖收敛建议**（advisory，非阻断）：`attachCoverageAdvisory(ctx, response, state)` `knowledge-rescan.ts:1595` —— 读账本 cells（`preferTargetScopedCoverageItems` 收敛到 target）+ 最近一轮 → `adviseCoverageLedger({ cells, latestRound, moduleCount })`（Core 纯函数）算 shouldStop/stopReason/highValueBlankCount/valueSortedGaps(截 20)/suggestion。**绝不设任何 blocking/gate/autoTrigger 键**——是否再扫由用户/宿主决定。
- **会话/轮次生命周期决策**：`noActionableRescanWork`（无 produce 维度、或 terminal advisory=diminishing-returns/round-cap）→ `releaseNoWorkRescanSession`（`knowledge-rescan.ts:1009`，释放空 session + `closeOpenHostAgentRescanRounds`）；有 actionable produce work（deepMining + produceDimensionCount>0 且非 terminal）→ `openDeepMiningRound`（`knowledge-rescan.ts:1326`，开新轮）+ `attachActionRequiredRescanLifecycle`（`knowledge-rescan.ts:1058`，标 `action-required` / terminalGate.pass=false / nextExpectedTools）。**顺序关键**：开轮必须在 attachCoverageAdvisory 之后，否则 advisory 把刚开、产出 0 的本轮当"上一轮"，触发 `new_recipes(0)<K` 收益递减误判使多轮每轮立即停止。
- 末尾 `budgetBriefingResponseData`（transportName `rescan-briefing`，**无 compact 回调**——超预算只附引用不瘦身）+ `attachBriefingTransportMeta`。

#### commit 驱动进化路由（rescan 内嵌）

`runRescanUnifiedEvolution(ctx, { projectRoot })` `knowledge-rescan.ts:1514`：`runCommitDrivenMaintenance`（§10.13）传 `buildHandler: createRescanUnifiedEvolutionHandler`（`knowledge-rescan.ts:1680`，从容器取 recipeSourceRefRepository/knowledgeRepository/contentPatcher/evolutionGateway/recipeFreshnessService/signalBus 装配 `HostAgentFileChangeHandler`，缺必需仓 → null）。**UM#3** rescan 自拥有路由、从不去抖（`residentSearchEnhancementReady: false`）。产出 `buildPluginOpportunisticEvolutionSurface`（§10.12）。

---

### 10.12 机会式进化编排（`PluginOpportunisticEvolution.ts` / `HostAgentFileChangeHandler.ts` / `FileChangeHandler.ts`）

#### FileChangeHandler 兼容 shim

`lib/recipe-generation/evolution/FileChangeHandler.ts`（7 行）—— **P12/R1 兼容 shim**：真实实现更名 `HostAgentFileChangeHandler`，旧 `FileChangeHandler` named import 继续可用（历史测试 + 下游插件缓存 + service adapter 平滑迁移），全部 re-export。

#### HostAgentFileChangeHandler（既有 Recipe 的维护执行器）

`lib/recipe-generation/evolution/HostAgentFileChangeHandler.ts`（834 行）是 commit 驱动维护的**核心执行器**——把 `FileChangeEvent[]` 转成对**既有 Recipe** 的 source-ref 修复 / update 提案 / deprecate 提案。**注意：只维护既有 Recipe，不生成新 Recipe**（UM#1/#5：created→moduleMining 生成已退役）。

`handleFileChanges(events, commitRange?)` `HostAgentFileChangeHandler.ts:166` 按 event.type 分派：
- **renamed** `HostAgentFileChangeHandler.ts:200`：找该 oldPath 的 active refs → 每 ref `replaceSourcePath`（sourceRef 修复）+ `persistReasoningSourcePathRepair`（改 reasoning.sources）→ `repaired++`。低置信度（< `renameAutoRepairThreshold=0.9`）额外提 update 提案 + needsReview。
- **modified** `HostAgentFileChangeHandler.ts:265`：`extractRecipeTokens(entry)` → `assessFileImpact(projectRoot, path, tokens, revisionRange)`（Core）。**maint-fix-plugin 关键**：git-head（committed）事件用 `commitRange`（scanner 算的 `mergeBase..HEAD`）做影响评估——工作树在 commit 后已为空，必须用 commit-range diff 才拿到真实 token 命中，否则恒零命中被 LP7 误 skip。零命中的 committed 改动 = trivial（记 `source-modified-git-head-no-impact` + skip，不提无证据提案）；有命中 → `emitSourceModified`（signalBus quality 信号）+ reference 级只记 log、direct/pattern 级提 update 提案 + needsReview。
- **deleted** `HostAgentFileChangeHandler.ts:349`：Recipe 还有其他 active ref → 标该 ref stale（`source-ref-stale` + skip）；否则提 deprecate 提案（**不删 Recipe 证据**）。
- **created** `HostAgentFileChangeHandler.ts:396`：命中既有 ref → `coveredCreated++`（维护范畴，不生成）；未覆盖 → `uncoveredCreated++` + skip（**UM#1/#5 退役生成**：新文件首次覆盖由 coldStart/deepMining 专职链负责，纯诊断计数）。
- 末尾 `refreshAffectedRecipes`（recipeFreshnessService.refreshRecipes 标 retrievalMayBeStale）+ `suggestReview = needsReview>0 || deprecated>0`。

提案经 `#evolutionGateway.submit(payload)`（`submitUpdateProposal` confidence direct 0.86/其它 0.72，带 StructuredPatch suggestedChanges；`submitDeprecationProposal` confidence 0.79）；gateway 缺 → status `unavailable`。`isUnifiedEvolutionReportRouteComplete`（`HostAgentFileChangeHandler.ts:636`）= 所有 pendingProposals 都 submitted。

**兼容字段**：`moduleMiningRoutes` 恒空（UM#1 退役后保留为向后兼容 schema）。

#### 机会式进化 surface（`PluginOpportunisticEvolution.ts`）

`lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts`（365 行）—— 把扫描 + 进化报告投影成 MCP 响应 surface（`PluginOpportunisticEvolutionSurface`）。

`buildPluginOpportunisticEvolutionSurface(input)` `PluginOpportunisticEvolution.ts:117` 状态机（verdict：`routed`/`no-op`/`defer-to-alembic-service`）：
- **UM#3 resident 检索增强去抖**：`residentSearchEnhancementReady && !scan.headChanged` → `defer-to-alembic-service`（无新提交需维护）。一旦 HEAD 变化即走维护链、不被拦。
- guard skip / 无扫描 / 无事件 → `no-op`。
- 有事件 + 有 unifiedEvolution report → `routed`（附 `summarizeUnifiedEvolution`）；有事件但未路由 → `no-op`。
- `autoSubmit: false`（永不自动提交）+ `producerBoundary`（producerKind `plugin-opportunistic`，separatedFrom `daemon-file-change`——daemon 退役后的边界标记）。
- `COMMIT_DRIVEN_TRIGGER_TOOLS`（`PluginOpportunisticEvolution.ts:228`）：bootstrap/code_guard/consolidate/dimension_complete/evolve/knowledge_lifecycle/plan/rescan/submit_knowledge/work —— 这 10 个工具尾部触发 commit 驱动维护。`extractTaskCloseGuardDecision` / `extractPluginToolOutcome` 从工具结果提取 guard 决策 / tool outcome 供 surface。

---

### 10.13 git-diff checkpoint 维护（`git-diff-checkpoint/`）

这是 commit 驱动维护的**底盘**——用 `git_diff_checkpoints` 表做 tick-on-access 的提交游标推进，扫描 HEAD 变化产出 `FileChangeEvent`。

#### 唯一编排（`CommitDrivenMaintenance.ts`）

`lib/recipe-generation/evolution/git-diff-checkpoint/CommitDrivenMaintenance.ts`（109 行）—— **UM#2：commit 驱动维护的唯一编排**（原 rescan public workflow 与工具尾 surface 注入两入口各重复一份 runtime→scanOnce→handleFileChanges→recordRouteOutcome，抽成单一）。

`runCommitDrivenMaintenance(input)` `CommitDrivenMaintenance.ts:59`：
1. `createPluginGitDiffCheckpointRuntime(container, {...})`（§下）→ `previousHead = runtime?.checkpointCommit`（**tick-on-access 游标**：上次维护到的 commit）。
2. `new GitDiffScanner({ projectRoot }).scanOnce(now, { previousHead })`（§下）。
3. resident 去抖：`residentSearchEnhancementReady && !scan.headChanged` → 不路由。
4. `shouldRouteCommitDrivenMaintenance(scan)`（`CommitDrivenMaintenance.ts:46`：未扫描/无事件/截断 → 不路由；headChanged + unavailable → 不路由；headChanged + non-ancestor 无 mergeBase → 不路由）→ 路由则 `buildHandler(projectRoot)` → `handler.handleFileChanges(scan.events, commitRange)`（`commitRange = scan.range ? from..to : undefined`——直接取 scanner 算的 range，不另查游标表）。
5. `recordPluginGitDiffCheckpointRouteOutcome({...})`（§下，推进游标）。

#### 扫描器（`GitDiffScanner.ts`）

`lib/recipe-generation/evolution/git-diff-checkpoint/GitDiffScanner.ts`（443 行）—— 纯 git 命令扫描器（`execFile` git，`GIT_TIMEOUT_MS=5000`，rename 相似度阈值默认 90%，`DEFAULT_MAX_DIFF_EVENTS=200`）。

`scanOnce(now, { previousHead })` `GitDiffScanner.ts:88`：
- `rev-parse --is-inside-work-tree` 非 worktree → 空结果。
- `rev-parse HEAD` → currentHead → `collectSnapshot`（`GitDiffScanner.ts:179`：并发 5 个 git 命令——unstaged/staged name-status + untracked ls-files + unstaged/staged binary diff → `addNameStatusEvents`（`GitDiffScanner.ts:308`，R/C→renamed/created 带 oldPath、A/D/M→created/deleted/modified）+ `addUntrackedEvents` + `buildSignature`（sha256 含 head + diff + untracked 内容 hash））。
- `headChanged`（previousHead 存在且 ≠ currentHead）→ `collectHeadRangeEvents`（`GitDiffScanner.ts:204`）：`merge-base` → 无 → `unavailable`（merge-base-unavailable）；mergeBase≠previousHead → `non-ancestor`（catch-up range `mergeBase..currentHead`）；否则 `ancestor`（`previousHead..currentHead`）。committed 事件 key 前缀 `head:`。
- `filterEvents`（`GitDiffScanner.ts:385`，去重 + `isDispatchablePath`）→ `truncated`（> maxEvents 时切片 + `scale-guard` fallbackReason）。
- 返回 `GitDiffScanResult`：dirtyPathCount/events/head/headChanged/headRangeStatus/mergeBase/previousHead/range/scanned/scannedAt/signature/truncated。

`isDispatchablePath`（`GitDiffScanner.ts:405`）= `isSafeProjectRelativePath && !shouldIgnoreProjectPath`（§下）。

#### 忽略规则（`ProjectDiffIgnore.ts`）

`lib/recipe-generation/evolution/git-diff-checkpoint/ProjectDiffIgnore.ts`（63 行）：
- `normalizeProjectRelativePath` / `toProjectRelativePath` / `isSafeProjectRelativePath`（拒绝绝对路径/`..`/越界）。
- `shouldIgnoreProjectPath` `ProjectDiffIgnore.ts:46`：任意段命中 `.asd/.git/.next/.nuxt/.turbo/.vite/DerivedData/node_modules`（IGNORED_ANY），或任意段命中 `build/coverage/dist/target`（IGNORED_GENERATED），或首段命中 `.cache/cache/logs/temp/tmp/vendor`（IGNORED_ROOT），或以 `.log` 结尾 → 忽略。挡住构建产物/依赖/日志噪声进入维护事件。

#### 游标推进（`DurableGitDiffCheckpointRouting.ts`）

`lib/recipe-generation/evolution/git-diff-checkpoint/DurableGitDiffCheckpointRouting.ts`（261 行）—— checkpoint 表读写适配 + 路由结果 → 游标推进映射。
- `createPluginGitDiffCheckpointRuntime(container, input)` `DurableGitDiffCheckpointRouting.ts:45`：容器取 `gitDiffCheckpointRepository`（缺 get/upsert → null）→ `new GitDiffCheckpointService({ checkpointRepository, baselineProvider: createCurrentGitHeadBaselineProvider() })`（Core）→ `buildPluginGitDiffCheckpointScope`（folderId/scopeId 归一化，默认 root/single-folder）→ `service.ensureCheckpoint(scope)` → 返回 checkpointCommit/initializationSource/scope/service。
- `recordPluginGitDiffCheckpointRouteOutcome(input)` `DurableGitDiffCheckpointRouting.ts:85`：`resolveRouteStatus`（`DurableGitDiffCheckpointRouting.ts:144`——scan 状态 + report 分类映射到 `failed/truncated/unresolved/non-ancestor/skipped/catch-up-routed/routed`；`reportOnlySkipped` 检测报告全 skip）→ `service.recordRouteOutcome({ routeStatus, targetCommit: scan.head, mergeBaseCommit, scannedAt })` 推进游标。已在 checkpoint HEAD 且无事件 → 保留上次结果不推进。

#### checkpoint service 兼容入口 + 状态类型

- `GitDiffCheckpointService.ts`（21 行）：re-export `@alembic/core/evolution` 的 `GitDiffCheckpointService` 及全部相关类型（Plugin 侧兼容入口，实现在 Core）。
- `GitDiffCheckpointStatus.ts`（78 行）：`GitDiffScanStatus` / `GitDiffLastDispatchStatus` / `GitDiffCheckpointStatus` 类型 + `createInactiveGitDiffCheckpointStatus`（surface 恒 `codex-plugin`，mode `git-diff-checkpoint`）。
- `index.ts`（36 行）：barrel，统一 re-export runtime/scanner/status/ignore。

---

### 10.14 vector 语义增强（`ContextualEnricher.ts` / `recipe-embedding-sim-provider.ts` / `LocalEmbedding.ts`）

#### ContextualEnricher（确定性直通 adapter）

`lib/recipe-generation/vector/ContextualEnricher.ts`（33 行）—— **AlembicPlugin 不再跑本地 AI enrichment**。`ContextualEnricher implements VectorChunkEnricher` `ContextualEnricher.ts:22` 是**确定性直通 adapter**：`enrichChunks` 原样返回 chunks，`clearCache` 空操作，`cacheSize` 恒 0。保留 VectorChunkEnricher 兼容边界，供 DI/Core vector 契约将来 opt-in 宿主/Core 提供的 enricher。这是 agent-free 净化后的空壳边界（合规保留，非死代码）。

#### embedding 相似度注入器（`recipe-embedding-sim-provider.ts`）

`lib/recipe-generation/vector/recipe-embedding-sim-provider.ts`（277 行）—— **U5 #1 closeout**：把 VectorService/RecipeRegionVectorIndex 已算好的 recipe region 向量，封装成 Core 三处演化服务（RedundancyAnalyzer/ProposalExecutor/ConsolidationAdvisor）ctor 接收的**同步** `EmbeddingSimProvider`（`(a, b) => number | undefined`）。

`createRecipeEmbeddingSimProvider(deps)` `recipe-embedding-sim-provider.ts:168`：
- 无 vectorStore/searchByFilter → 返回 null（不注入，Core 走纯 Jaccard，向后兼容）。
- `preheat()`（DI 初始化 awaited 钩子一次性）：`searchByFilter({ type: 'recipe-semantic-region' })` 拉全部 region 记录 → 按 recipeId 收集向量 → `meanPoolNormalized`（L2 归一化后均值池化，`recipe-embedding-sim-provider.ts:105`，维度以首条为准、不一致跳过）→ 内存 Map `pooledByRecipeId`。失败静默降级（内存空 → 全返 undefined）。
- `provider(a, b)`（同步查表 + 余弦）：`readRecipeId`（结构化读运行时对象 .id，`recipe-embedding-sim-provider.ts:141`）→ 任一侧无 id/向量缺失/维度不一致/非有限数 → 返 undefined（Core 回退 Jaccard，**永不抛错、永不返常量**）→ `1 - cosineDistance` clamp [0,1]。

**关键边界**：domain/service 不发起 embed；本 provider 只读预计算向量（rescan/rebuild 阶段写入的 `recipe-semantic-region` 记录）。这是"进化去重/合并判定用语义相似度、但不在判定路径触发 embed"的 adapter。

#### 本地 Ollama embedding 接线（`LocalEmbedding.ts`）

`lib/recipe-generation/vector/LocalEmbedding.ts`（138 行）—— **Plugin 侧本地 Ollama embedding wiring（GMAP-L2/L3）**。消费 Core L1 surface（`@alembic/core/vector`: OllamaEmbedProvider + EmbedProviderSelector），只拥有 Plugin 关切：解析 localEmbedding 配置、探测本地 Ollama、选 local-first lane。**插件从不下载/打包 embedding 模型，用户自跑 Ollama opt-in**。
- `LocalEmbeddingConfigSchema`（zod strict）：enabled(默认 false)/endpoint(默认 `http://127.0.0.1:11434`)/model(默认 `qwen3-embedding`)/laneOrder(local-first|keyword-only)。
- `resolveLocalEmbeddingConfig(vectorConfig, env)` `LocalEmbedding.ts:63`：config.json（vector.localEmbedding）+ host env 覆盖（env 胜：`ALEMBIC_LOCAL_EMBEDDING_ENABLED`/`ALEMBIC_OLLAMA_ENDPOINT`/`ALEMBIC_OLLAMA_EMBED_MODEL`）。
- `detectOllamaEmbedding`（L2 探测，非抛错，结构化 probe 结果）/ `selectLocalEmbedLane`（L3 选道：enabled+reachable → Ollama，否则 keyword baseline null provider、向量禁用；resident lane slot 保留=检索非 raw embed，GMAP-9）/ `localEmbeddingSetupGuidance`（用户安装指引）。

**宿主连接点**：这是 §10.10 region 向量与 §10.14 embedding provider 的 provider 底座——Ollama 在则语义全质量，缺则干净回退 keyword 搜索（对照 memory：embed-provider-missing=Ollama 未起语义跳过）。

---

### 10.15 与 @alembic/core 的消费点汇总

本层大量消费 Core 子路径（Plugin 只做编排/适配）：
- `@alembic/core/host-agent-workflows`：`buildColdStartWorkflowPlan` / `buildProjectContextMissionBriefing` / `createHostAgentColdStartIntent` / `runFullResetPolicy` / `presentHostAgentColdStart*` / `getActiveHostAgentWorkflowSession` / `getOrCreateSessionManager` / `saveDimensionCheckpoint` / `buildCoverageLedgerModuleAxisFromSummaries` / `resolveModuleTier` / `resolvePerCellTargetDefault` / `writeCoverageLedgerForCompletion` / `reflowDeepMiningRoundOnCompletion` / `adviseCoverageLedger` / `auditRecipesForRescan` / `buildKnowledgeRescanPlan` / `baseDimensions` / `buildCompletenessCritic`（生成/生命周期/会话/覆盖/critic 全在 Core）。
- `@alembic/core/knowledge`：`renderGuidance` / `describeSubmitToolFields` / `failureModes` / `buildPreSubmitChecklist` / `validateAgainst`（RecipeAuthoringSpec 单源，前置契约 == gate）。
- `@alembic/core/project-context` + `project-context-capabilities`：`ProjectContextCapabilities.execute` / `buildProjectContextPresenterInput`（事实收集）。
- `@alembic/core/service/planFacts`：`collectProjectSourceFileFacts` / `jsonByteLength` / `writeTransientTransport` / `removeTransientTransportIfPresent`（源文件事实 + 预算 transport 原语）。
- `@alembic/core/evolution`：`assessFileImpact` / `extractRecipeTokens` / `EvolutionGateway` / `GitDiffCheckpointService` / `createCurrentGitHeadBaselineProvider` / `RedundancyAnalyzer`（影响评估 + checkpoint + 相似度 provider 类型）。
- `@alembic/core/vector`：`VectorChunkEnricher` / `cosineDistance` / `OllamaEmbedProvider` / `EmbedProviderSelector` / `buildLocalFirstEmbedLanes`（向量/embedding）。
- `@alembic/core/repositories`：`EvolutionCoverageLedgerRepository`（账本仓类型）。
- `@alembic/core/workspace`：`resolveProjectRoot` / `resolveDataRoot` / `WorkspaceResolver`（数据根解析）。

宿主连接点：Codex/Claude Code 双宿主通过 `hostAgentAnalysis`/`ideAgentAnalysis` 双别名镜像（cold-start:1200 / knowledge-rescan:1774）+ mode 轴（project-index.ts）+ `#codex/*`（当前解析到 `lib/runtime/*`）的 HostAgentAnalysisSurface/HostProjectAlignment/OnboardingContract 连接；本地 Ollama（LocalEmbedding.ts）是可选语义底座。

---

### 10.16 边界 / 坑 / 降级 / 历史包袱清单

- **advisory 绝不阻断**：覆盖账本写入、覆盖建议、区域向量、git-diff 维护、语义 memory 全 best-effort try/catch 吞错，绝不改主响应或阻断维度完成。
- **两处硬门**：submit-path 反捏造证据门 + dimension-complete 生产下限门（<3 recipe / <500 analysis / <3 findings / source-ref 越界或不存在）。其余皆非门禁。
- **no-guess**：moduleService 无 canonical 模块 → 覆盖账本直接跳过，绝不臆造模块轴。
- **canonical 统一残留（R-1）**：Plugin 侧覆盖账本统一走 `target:name:path`（coverage-ledger-target-axis.ts），但 in-process 主体 module-id 派生（plain module.id）与 host target 派生（target:name:path）在非空 ProjectMap 时可能分歧——BiliDili 空-map 才恰好相等，双宿主 module-id 真统一是未闭合残留。
- **U2d 轮次顺序坑**：开轮必须在 attachCoverageAdvisory 之后，否则刚开、产出 0 的本轮被当"上一轮"触发收益递减误判，多轮每轮立即停止。dimension-complete 的 reflow 是 new_recipes 的真实输入。
- **maint-fix-plugin（committed→propose 收口）**：git-head 事件必须用 commit-range diff（scan.range）做影响评估，否则 committed 改动工作树已空、恒零命中被 LP7 误 skip。
- **生成退役（UM#1/#5）**：created→moduleMining 生成路径已退役，`moduleMiningRoutes` 恒空（保留为向后兼容 schema）；HostAgentFileChangeHandler 只维护既有 Recipe，新文件首次覆盖归 coldStart/deepMining 专职链。
- **region-vector removeStale 顺序坑**：provider 缺失时必须整体跳过而非跑 syncRecipeSemanticRegions（其 removeStale 先于 embed，会剥 chunk 却不 re-embed）。
- **rescan 无 compact 回调**：超预算只附 fullBriefingRef 引用、不瘦身内联（与 cold-start 逐级压缩有意不对称）；但 RecipeAuthoringFrontLoad 契约因此从不被剥离。
- **D3 边界**：dimension-complete / 覆盖 seed / advisory 只读写 `coverage_ledger` + `deep_mining_rounds`，绝不触达 `git_diff_checkpoints`；反之 commit 驱动维护只碰 `git_diff_checkpoints`。
- **就绪未接线**：`resolveRescanScanBatchCap` tier 表已固化但 Core reconcile 尚无 cap 形参（blocked-on-Core），暂无注入出口。
- **兼容 shim**：`FileChangeHandler`（→HostAgentFileChangeHandler）、`coverage-ledger-write`（→Core）、`GitDiffCheckpointService`（→Core）都是刻意保留的旧路径入口，"搬运而非重写"保证字节一致。
- **ContextualEnricher 空壳**：agent-free 净化后的确定性直通 adapter（保留边界供将来宿主/Core enricher opt-in），非死代码。


---

## 11. 工作流能力、配置、技能资源与数据模型

本节测绘 `alembic-codex-plugin-runtime` 中三块彼此正交但共同支撑「Recipe 生命周期 + 宿主技能交付」的横向基础设施：

1. **workflows/capabilities**：workflow 完成阶段的两个能力族——`completion/`（ProjectContext 刷新占位 + 语义记忆固化）与 `execution/`（Project Skill 生成与导出）。它们是 `dimension_complete` 维度完成链在「本轮分析结束、准备落地副产物」阶段调用的收尾器。
2. **config/ 门禁清单**：宪法（constitution）、运行时默认配置（default.json）、以及五张「机器可读门禁清单」（core-import-boundary-allowlist / naming-lint / doctrine-lint-exemptions / error-registry-adoption / shared-asset-manifest）。它们不是运行时代码，而是 `npm run check:*` 门禁脚本读取的权威事实来源。
3. **skills/ 与 templates/**：4 个对外技能 SKILL.md（create/guard/recipes/structure）与 `recipes-setup` 种子 Recipe 模板——这是 plugin 交付给宿主 Agent（Codex / Claude Code）的「怎么用 alembic_* 工具」说明书。
4. **数据模型综述**：plugin 经 `@alembic/core/repositories` bundle 消费的 12 张关键 SQLite 表的「表 → 写者 → 读者」映射，以及 `SqliteDatabaseAccess` 的旁路只读投影层。

> 阅读约定：所有 file:line 引用相对仓库根 `AlembicPlugin/`。技术标识符、类型名、路径、函数名、表名保留英文。

---

### 11.1 workflows/capabilities/completion —— 工作流完成收尾器

`lib/workflows/capabilities/completion/` 是 workflow「完成阶段」的收尾流水线（pipeline），由三个文件组成：类型契约（`WorkflowCompletionTypes.ts`）、编排器（`WorkflowCompletionFinalizer.ts`）、以及各步骤实现（`CompletionSteps.ts`）。它的唯一现役调用方是 `dimension-completion.ts`（维度完成链，见 §11.7 crossLinks）在 `dimension_complete` 落地阶段通过 `runWorkflowCompletionFinalizer(...)` 触发。

设计模式：**pipeline + strategy + dependency injection**。编排器按固定顺序跑「ProjectContext 刷新 → 语义记忆固化」两个步骤（pipeline），每步的执行/跳过由传入的 mode 决定（strategy），且所有外部依赖（`getServiceContainer` / `scheduleTask` / step 实现 / `createPersistentMemory` / `createConsolidator`）都可注入（DI），以便测试替身与「能力退场后仍保持接口在场」。

#### 11.1.1 WorkflowCompletionTypes.ts —— 类型契约层

`lib/workflows/capabilities/completion/WorkflowCompletionTypes.ts` 定义了整条链的结构类型，全部是结构化 `*Like` 接口（duck typing，避免直接依赖 Core 具体类）：

- `CompletionContextLike`（`WorkflowCompletionTypes.ts:6`）：只要求 `{ container: { get?(name): unknown } }`——即 DI 容器的最小读能力。这是能力层与 plugin DI 容器解耦的边界（不 import `ServiceContainer` 具体类型）。
- `CompletionSessionStoreLike`（`WorkflowCompletionTypes.ts:29`）：会话存储读接口，暴露 `getCompletedDimensions()` / `getDimensionReport(dimId)` / `toJSON()`（后者含 `tierReflections`）。语义记忆固化器把它当输入。
- `WorkflowSemanticMemoryMode = 'scheduled' | 'immediate' | 'skip'`（`WorkflowCompletionTypes.ts:60`）：语义记忆固化的三态策略。
- `WorkflowCompletionStepOptions.projectContext = 'run' | 'skip'`（`WorkflowCompletionTypes.ts:62`）：ProjectContext 刷新步骤的开关。
- `WorkflowCompletionFinalizerResult`（`WorkflowCompletionTypes.ts:72`）：编排器返回 `{ semanticMemoryResult, projectContextRefreshStatus }`，状态取值 `'completed' | 'scheduled' | 'skipped'`。
- `WorkflowSemanticMemoryConsolidationResult`（`WorkflowCompletionTypes.ts:66`）：`{ total: { added, updated, merged, skipped }, durationMs, [key]: unknown }`——语义记忆固化的统计产物（索引签名允许额外字段透传）。
- `WorkflowCompletionSummary`（`WorkflowCompletionTypes.ts:79`）：面向上层的摘要，带 `mode: 'bootstrap' | 'rescan'` 与 `isolation: 'full-completion' | 'pipeline-isolation'`——记录本次完成走的是哪种隔离粒度。

关键历史包袱：`PersistentMemoryDb = unknown`（`WorkflowCompletionTypes.ts:51`）——语义记忆的 DB 句柄类型被抽象成 `unknown`，因为本地 Agent 记忆已从 plugin 移除（见 §11.1.3），保留 `unknown` 是「接口在场、实现退场」的标记。

#### 11.1.2 WorkflowCompletionFinalizer.ts —— 编排器（有限状态机）

`runWorkflowCompletionFinalizer(...)`（`WorkflowCompletionFinalizer.ts:29`）是唯一导出的编排入口。

**输入**：`{ ctx, session, dataRoot, log?, dependencies?, semanticMemory?, steps?, shouldAbort? }`。
**输出**：`Promise<WorkflowCompletionFinalizerResult>`。

依赖解析（DI 默认值）：
- `getServiceContainer = dependencies.getServiceContainer ?? defaultGetServiceContainer`（`:48`）——默认实现（`:93`）**动态 import** `#inject/ServiceContainer.js` 拿到 plugin DI 容器。这是能力层与 DI 层之间的懒加载边界（避免静态循环依赖）。
- `scheduleTask = dependencies.scheduleTask ?? defaultScheduleTask`（`:49`）——默认实现（`:98`）用 `setImmediate` 把任务丢到下一个 tick 异步跑，并 `catch` 吞掉错误只打 `warn`（非阻断）。
- `semanticMemoryMode = semanticMemory.mode ?? 'scheduled'`（`:50`）、`projectContextMode = steps.projectContext ?? 'run'`（`:51`）。

状态机分支（两道 `shouldAbort` 闸门 + 两步执行）：

1. **早退闸门 1**（`:53`）：若 `shouldAbort?.()` 为真（用户取消），直接返回 `{ semanticMemoryResult: null, projectContextRefreshStatus: 'skipped' }`，打 `[CompletionFinalizer] Aborted before ProjectContext refresh — user cancelled`。
2. **步骤 1 — ProjectContext 刷新**（`:61`–`:68`）：`projectContextMode === 'run'` 时调 `refreshProjectContextReads(...)` 并把状态置 `'completed'`；否则打 `ProjectContext refresh skipped by workflow option` 保持 `'skipped'`。
3. **早退闸门 2**（`:70`）：语义记忆前再检 `shouldAbort`，命中则带当前 `projectContextRefreshStatus` 返回。
4. **步骤 2 — 语义记忆固化**（`:77`–`:88`）：
   - `mode === 'immediate'`：同步 `await consolidateSemanticMemory(...)`，结果写入 `semanticMemoryResult`。
   - `mode === 'scheduled'`：`scheduleTask(async () => { await consolidateSemanticMemory(...) })`——异步 fire-and-forget，`semanticMemoryResult` 保持 `null`（结果不回传，只在后台跑）。
   - `mode === 'skip'`：两个分支都不进，`semanticMemoryResult = null`。
   - 每个分支进入前都再检一次 `!shouldAbort?.()`，实现「取消尽快生效」。

设计要点：整条链是**非阻断**的收尾器——任何一步的失败或取消都不会阻断上游的维度完成主流程，最坏情况只是少写一份副产物并打 `warn`。这与 `docs/declared-effects.md`「knowledge write 类：recipe evidence gates precede persistence」的边界一致：完成收尾只做投影/固化，不做门禁。

#### 11.1.3 CompletionSteps.ts —— 步骤实现（两个退场占位）

`lib/workflows/capabilities/completion/CompletionSteps.ts` 里两个步骤当前都是**能力退场后的诚实占位**（honest no-op），是本子系统最重的历史包袱标记：

- `refreshProjectContextReads({ log })`（`CompletionSteps.ts:20`）：不做任何刷新，只打 info 日志 `ProjectContext refresh skipped: retired project refresh provider has no work; ProjectContext reads are live.`——即 ProjectContext 已改为**实时读**（live reads），不再需要完成阶段的批量刷新 provider。函数签名仍保留 `getServiceContainer` 参数（未使用），维持接口形状供未来重新接线。
- `consolidateSemanticMemory({ ctx, session, dataRoot, log, dependencies })`（`CompletionSteps.ts:52`）：**降级路径**。核心守卫在 `:65`——若 `dependencies.createPersistentMemory` 或 `dependencies.createConsolidator` 未注入（默认就不注入），直接打 info `Semantic Memory consolidation skipped for ${session.id}: local agent memory has been removed from AlembicPlugin.` 并返回 `null`。这对应 CLAUDE.md「不得重新引入独立 Agent runtime / AI provider runtime」的停止卡——本地 Agent 记忆能力已被删除，此处只留下可注入的空壳。
  - 若依赖被注入（仅测试或未来接线场景）：从容器取 `'database'` 或 `'db'`（`:72`），校验 `session.sessionStore` 在场，然后 `createPersistentMemory(db, dataRoot, log)` → `createConsolidator(semanticMemory, log)` → `consolidator.consolidate(sessionStore, { bootstrapSession: session.id, clearPrevious: true })`（`:83`）。任何异常被 `catch (err: unknown)` 吞掉打 `warn`（非阻断），返回 `null`。

`SemanticMemoryCompletionDependencies`（`CompletionSteps.ts:40`）定义两个可选工厂函数，是这条降级路径唯一的「重新点亮」入口。

---

### 11.2 workflows/capabilities/execution/WorkflowSkillCompletionCapability —— Project Skill 生成

`lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts` 导出 `generateSkill(...)`（`:45`），是把「维度分析文本」转化为「宿主可见的 Project Skill（`.md` 技能文件 + `.agents/skills` 运行时投影）」的能力。它由 `dimension-completion.ts:1334` 在维度完成、且该维度 `skillWorthy` 时调用（别名导入为 `generateWorkflowSkill`，`dimension-completion.ts:44`），并可通过 `dependencies.generateSkill` 注入替身（DI，`dimension-completion.ts:105`/`:1333`）。

**输入**：`(ctx, dim, analysisText, referencedFiles=[], keyFindings=[], source='bootstrap')`。`dim: SkillDimensionDef`（`:14`）含 `id / label / skillWorthy / skillMeta{name,description}`。
**输出**：`WorkflowSkillGenerationResult`（`:27`）——`{ success, skillName, deliveryReceipt?, exportResult?, error? }`，其中 `exportResult` 携带 `authorizationStatus / conflictStatus / runtimeExportStatus / targetPath`。

处理流水线（pipeline + 门禁）：

1. **命名**（`:53`）：`skillName = dim.skillMeta?.name || project-${dim.id}`。
2. **质量门禁 `validateSkillQuality(analysisText)`（`:119`）**——三级检查，是本能力最重的逻辑：
   - **长度门**（`:120`）：`analysisText.trim().length < MIN_ANALYSIS_LENGTH(100)` → 直接 `{ pass:false }`。
   - **重复门（repetition guard）**（`:127`–`:151`）：把非空行归一化（`normalizeLine`，`:207`：剥列表符/编号/引用/标题标记/`(来源:...)` 尾注/压缩空白），算 `uniqueRatio = uniqueNormalized.size / normalizedLines.length` 与最大连续重复 `maxConsecutiveDuplicates`（`:219`）。判定 `isRepetitive = (行数>30 且 uniqueRatio<HARD_REJECT_RATIO(0.1)) || maxConsDupes>=CONSECUTIVE_DUPE_THRESHOLD(8)`。命中后**尝试挽救**：`deduplicateConsecutive`（`:235`，去连续重复行）后若仍 ≥100 字符则 `{ pass:true, deduplicatedText: cleaned }`（打 info 记录挽救前后字符数）；否则 `{ pass:false }`。这是「AI 生成自重复」的防线（对应 MEMORY「4.5MB 自重复根因」类问题）。
   - **结构门**（`:153`–`:164`）：正则探测是否含 Markdown 结构（`#` 标题 / 有序列表 / 无序列表 / 代码块 / emoji 列表 / `**加粗**` / ≥3 个段落）。**仅当**文本短于 `STRUCTURE_CHECK_THRESHOLD(500)` 且无结构时才 `{ pass:false, reason:'no structured content detected' }`——长文本豁免结构检查。
3. **门禁失败**：`validation.pass` 为假直接返回 `{ success:false, error: reason }`，打 `warn`（`:55`）。
4. **内容组装 `buildSkillContent`（`:169`）**：拼 `# ${label}` 标题 + `> Auto-generated by Bootstrap (${source})` 归属 + 「## 关键发现」列表（若有 keyFindings）+ 挽救后正文（`effectiveText = validation.deduplicatedText || analysisText`，`:60`）+ 「## Referenced Files」（截断前 20 个，`:199`）。
5. **导出（gateway 到 ProjectSkillService）**（`:65`）：调 `createProjectSkillService(ctx).upsert({ authorizeProjectSkillExport:true, name, description, content, overwrite:true, createdBy:source })`。这是能力层→服务层的边界（见 §11.8 ProjectSkillService）。
6. **结果归并（多回退链）**（`:74`–`:106`）：从 `result.data.deliveryReceipt` 与 `result.data.runtimeExport` 两个来源交叉取 `runtimeExportStatus`（`runtimeExport?.status ?? deliveryReceipt?.runtimeExport.status`），`success` 严格等价于 `runtimeExportStatus === 'exported'`——即**技能落到 `.agents/skills` 运行时投影**才算成功。授权/冲突/目标路径都走同样的「runtimeExport 优先、deliveryReceipt 兜底、字面量最终兜底（'pending'/'blocked'/null）」链，是典型的**防御性多回退归并**。
7. **异常处理**（`:112`）：`catch (err: unknown)` + `err instanceof Error` 守卫（符合 CLAUDE.md 规则），返回 `{ success:false, error: msg }`。

与 §11.1 的关系：`WorkflowSkillCompletionCapability`（execution 族）与 `WorkflowCompletionFinalizer`（completion 族）是维度完成的**两个正交副产物**——前者产出「技能文件」，后者产出「ProjectContext 刷新 + 语义记忆」。二者都在 `dimension-completion.ts` 同一完成阶段被调，但互不依赖：skill 生成走 `ProjectSkillService.upsert`，completion finalizer 走容器 `database`/`ServiceContainer`。

---

### 11.3 config/constitution.yaml + templates/constitution.yaml —— 宪法（兼容策略文档）

`config/constitution.yaml` 与 `templates/constitution.yaml` 是**逐字节相同**的两份拷贝（`shared-asset-manifest.json` 中 `templates-constitution` 声明 `mode:"exact", authority:"main"`），标题 `Alembic Entrypoint Safety Policy`，version `"4.0"`。

关键定位（`constitution.yaml:5`）：注释明确写 **"It is not a central authorization authority and does not define runtime roles."**——这是历史包袱的诚实标记：旧版宪法曾是中央授权/角色矩阵，现已退役为**入口安全策略文档**。它只声明 4 条操作级保护 rule（`:8`–`:19`），每条带 `id / description / check`：

| id | 语义 | check 标识 |
| --- | --- | --- |
| `destructive_confirm` | 破坏性写入需 HTTP 入口 `confirmed:true` | `destructive_needs_confirmation` |
| `content_required` | 创建/更新入口须校验非空 content + route schema | `creation_needs_content` |
| `ai_no_direct_recipe` | AI 产出走 preview/apply，apply 入口自持确认 | `ai_cannot_approve_recipe` |
| `batch_authorized` | 批量写入需 HTTP 入口 `confirmed:true` | `batch_needs_authorization` |

运行时接入点：`config/default.json` 的 `constitution` 块（`default.json:32`）指向 `./config/constitution.yaml` 且 `strictMode:true`。`shared-asset-manifest.json` 的 notes 强调「Runtime roles and permission matrices are retired; Plugin must not carry host-specific role variants」——plugin 不得携带宿主特化的角色变体。

---

### 11.4 config/default.json —— 运行时默认配置

`config/default.json`（121 行）是 plugin runtime 的默认配置基线。`shared-asset-manifest.json` 中 `config-default` 声明 `mode:"json-exclude-paths", authority:"per-host", excludePaths:["ai"]`——即除顶层 `ai` 块外，其余必须与主仓库 `deep-equal`。缺 `ai` 块是**「plugin-as-guest」设计**：AI provider 配置由宿主（Codex/Claude Code）注入，不在 plugin 侧固化。

关键块：
- `database`（`:2`）：`type:"sqlite", path:"./.asd/alembic.db"`——这是 §11.9 数据模型的落盘位置（相对项目 dataRoot）。
- `constitution`（`:32`）：`path + strictMode:true`（见 §11.3）。
- `paths.folderNames`（`:37`）：三层目录命名字典（package / dev / global / project），例如 `project.knowledgeBase:"Alembic"`、`project.runtime:".asd"`、`project.skills:"skills"`——SKILL.md 与 ProjectSkillService 引用的所有磁盘路径都源出此处。
- `features`（`:68`）：`USE_NEW_GATEWAY:true`、`REASONING_QUALITY_SCORE:true`。
- `vector`（`:72`）：向量检索配置——`dimensions:768`、HNSW（M=16/efConstruct=200/efSearch=100）、`hybrid.rrfK:60/alpha:0.5`（RRF 融合）、`quantizeThreshold:3000`、`autoSyncOnCrud:true`。对应 alembic-recipes SKILL.md 的 `alembic_search(mode=semantic)` 语义检索。
- `qualityGate`（`:100`）：`maxErrors:0 / maxWarnings:20 / minScore:70`——Guard/质量门禁阈值。
- `guard.codeLevelThresholds`（`:106`）：语言级强规则阈值（swift 强解包=5、rust unwrap=3/unsafe=3、dart late=3）。
- `taskGraph.decision`（`:114`）：`staleDays:30 / maxActiveInPrime:20 / maxStaleInPrime:10`——prime 时决策记录的新鲜度与展示上限。

---

### 11.5 config/ 五张门禁清单（machine-readable gates）

这五张 JSON 不是运行时代码，而是 `npm run check` / `lint:*` / `report:*` 门禁脚本读取的**权威事实来源**（registry 模式：清单即真相，脚本比对代码/邻仓与清单是否漂移）。

#### 11.5.1 core-import-boundary-allowlist.json —— Core 导入边界白名单

`config/core-import-boundary-allowlist.json`（`version:2`）是「plugin 允许从 `@alembic/core` 哪些子路径 import」的门禁清单，落实 CLAUDE.md「不要绕过 `@alembic/core` 包入口直接引用 Core 源码」。

- `allowedRootSpecifiers:["@alembic/core"]`（`:7`）+ `allowedSpecifiers`（`:52`–`:82`，30 个子路径白名单，如 `@alembic/core/repositories` / `/knowledge` / `/search` / `/vector` / `/host-agent-workflows` / `/test-fixtures`）——只有这些子路径可被 plugin 消费。
- `referenceLimits`（`:10`）：4 个 infra DB fixture 子路径的**引用计数上限**（`.../drizzle`=4、`.../drizzle/schema`=1、migration 001=1、migration 004=3），且 note 声明「shrink-only」（只能减不能增）——防止 Core 内部 DB 实现细节被 plugin 越界扩散。
- `keepWithOwner`（`:17`）：4 条「有主保留」条目，每条带 `owner / consumers / reason / removalTrigger`。核心 reason（`:26`）：Core 目前没有稳定的 test/fixture facade 暴露 drizzle 单例生命周期（`initDrizzle/getDrizzle/resetDrizzle`），`@alembic/core/database` 走 `DatabaseConnection.connect()` 无法开 `:memory:` fixture，故这些越界 import 在测试隔离场景下暂时保留，`removalTrigger` 是「Core 发布稳定 fixture facade」。
- `scanRoots:["lib","bin","scripts","test"]`（`:6`），`referenceCount:400 / uniqueSpecifierCount:34`（`:8`）——门禁的真实扫描口径。

#### 11.5.2 naming-lint.json —— 文件命名门禁

`config/naming-lint.json`（`schemaVersion:1`）codify（而非 redesign）本仓库现存的命名主导范式（SN5 wave）。5 条规则（`:4`）：
- `lib`（`:5`）：`camelCase / PascalCase / kebab`，**禁 snake_case 与 mixed-case-kebab**（正则 `^([a-zA-Z][A-Za-z0-9]*|[a-z0-9]+(-[a-z0-9]+)+)(\.d)?\.tsx?$`）。description 点名 kebab 家族=MCP tool/contract 模块（`output-contract.ts` / `agent-public-tools.ts` / `error-taxonomy.ts`）。
- `bin` / `scripts`（.mjs/.cjs/.js 与 .ts）/ `config`（.json）：一律 kebab-case。
- `barrelNames:["index.ts"]`（`:36`）豁免 barrel；`test/` 故意不受约束（as-found，PascalCase 主导但 kebab fixture 并存）；`vendor/` 与 `dist/` 从不扫描。
- `exceptions:[]`（`:38`）——异常需 `{file, owner, reason}`，当前为空。

#### 11.5.3 doctrine-lint-exemptions.json —— 副作用 doctrine 豁免

`config/doctrine-lint-exemptions.json`（`schemaVersion:1`，11 行 census）是「模块级可变副作用状态」的豁免清单，由 `scripts/lint-doctrine.mjs` 校验完整性（每行须 `file+binding+owner+reason`，未知行报错）。豁免的都是**进程作用域的合法可变态**：
- `output-contract.ts:outputProjectors`（`:4`）——投影器 registry，import 时由 tool-family 模块一次性填充，重复注册 throw（registry 模式）。
- `handlers/guard.ts:_reviewRounds / _lastReviewPassed`（`:12`/`:18`）——会话级 Guard 复审轮次累加器与判定缓存。
- `handlers/agent-public-tools.ts` 的 4 个 `*Counter`（prime/work/finish/guard，`:24`–`:46`）与 `WORK_RECORDS`（`:48`）——单调回执计数器与会话级工作记录。
- `RateLimiter.ts:_lastPrune / _buckets`（`:54`/`:60`）——限流器 token 桶与 prune 时钟。
- `service/task/PrimeKnowledgeMaterial.ts:primeReceiptCounter`（`:66`）——prime 物料回执计数器。

note 声明「Null-initialized lazy slots are idiom-allowed and not listed」——懒初始化空槽是惯用法，不入清单。

#### 11.5.4 error-registry-adoption.json —— 错误码 → failureKind 采纳映射

`config/error-registry-adoption.json`（`schemaVersion:1`）把 plugin 私有错误码映射到 Core `FailureTaxonomy` 的 `failureKind`，是 MCP 错误信封的权威转译表。
- `registrySource`（`:3`）：`vendor/AlembicCore/config/error-registry.json`（Core 是 registry 权威）。
- `surface`（`:5`）：`lib/runtime/mcp/error-taxonomy.ts` 的 `createCleanMcpFailureTaxonomy` 从 `LEGACY_ERROR_CODE_FAILURE_KINDS` 表推导每个 MCP 错误信封（这张表就是 `docs/legacy-register.md` 的 L1 条目，见 §11.7）。
- `proof`（`:6`）：`test/unit/McpErrorRegistryAdoption.test.ts` 保证每个映射码经 live path 解析到 registry 中真实存在的 failureKind；与 vendor registry 漂移即挂测试。
- `pluginOwnedCodeMappings`（`:7`）：~40 个 `CODEX_* / DIMENSION_* / SOURCE_REF_*` 码 → `permission-denied / invalid-input / needs-confirmation / conflict / unavailable / not-found / internal-error / capability-mismatch`。含一条**故意 deferred** 条目 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`（`:9`）——映射正确但会改动 parity-pinned 的 `alembic_health` 快照，留待下个 parity-budgeted wave。
- `recipeEvidenceGateCodeMappings`（`:50`）：把 Recipe 证据门/修复循环拒绝统一归为 `invalid-input`（caller-repairable），consent 门归 `needs-confirmation`，scope 不匹配归 `conflict`——**禁止回落到 internal-error**（规则 `:52`）。
- `coreRegistryRowNote`（`:77`）：Core 侧 `adoption.alembicPlugin` 行仍写 `deferred-ic5`，更新它属于 AlembicCore 窗口而非从此处编辑（跨仓边界）。

#### 11.5.5 shared-asset-manifest.json —— 跨仓共享资产漂移门

`config/shared-asset-manifest.json`（`schemaVersion:1`）是 Alembic 主仓库（authority）与 AlembicPlugin（sibling）之间「共享资产单源」的机器可读权威清单，被 `scripts/check-shared-asset-drift.mjs` 消费（`npm run check:shared-asset-drift`）。**edit-in-authority-then-sync**：共享内容先在主仓库改，再逐字节同步到 plugin。

- `sibling`（`:4`）：`{ name:"AlembicPlugin", envVar:"ALEMBIC_PLUGIN_PATH", defaultPath:"../AlembicPlugin", sanityPath:"skills" }`。
- `selfCheckFiles`（`:10`）：`["config/shared-asset-manifest.json", "scripts/check-shared-asset-drift.mjs"]`——清单与门禁脚本自身也须两仓字节一致（self-check）。
- `assets`（`:11`）：逐资产的比对模式（strategy）——
  - 4 个 SKILL.md（`:12`–`:41`）：`mode:"skill-shared-sections"`——只比对 `<!-- wakeflow-shared:begin/end -->` 标记段，host 段各自维护。`alembic-recipes` 与 `alembic-structure` 还声明 `perHostSections`（如 `intro-and-overview` / `use-context-tail` / `tools-and-graph`）——这些段承载**宿主分叉的工具面**（main/codex 用 `alembic_knowledge` ↔ plugin/cc 用 `alembic_search(operation=...)` / `alembic_project_matrix`），故跨宿主 coherence 跳过它们。
  - `skill-alembic-devdocs` + `templates-instructions`（`:43`/`:54`）：`mode:"main-only"`——plugin 侧不应出现拷贝（plugin skill registry 硬编码另外 4 个技能）。
  - `templates-constitution`（`:57`）：`mode:"exact"`（见 §11.3）。
  - `config-default`（`:64`）：`mode:"json-exclude-paths", excludePaths:["ai"]`（见 §11.4）。
  - `templates-recipes-setup`（`:75`）：`mode:"directory-exact"` + `fileVariants`——声明 `_template.md` 的标题变体（`# V3 Agent Consumption Fields` ↔ `# V3 Host Agent Required Fields`）与 `README.md` 三行工具表变体（main 的 `alembic_knowledge(confirm_usage|insights)` ↔ plugin 的 `Dashboard Candidates` / `alembic_project_matrix`）。其余文件须逐字节相等。

门禁方向性坑（对应 MEMORY「shared-asset-drift gate direction」）：脚本以「所在仓库=权威侧」运行，plugin 侧包装器须调 `../Alembic` 的权威脚本并把本仓库作 sibling 传入；反向运行会对 main-only 资产误报漂移。

---

### 11.6 skills/ —— 4 个对外技能 SKILL.md

`skills/` 下 4 个 SKILL.md 是 plugin 交付给宿主 Agent 的「怎么用 alembic_* 工具」说明书。它们都用 `<!-- wakeflow-shared:begin/end -->`（共享段，主仓库权威）与 `<!-- wakeflow-host:plugin ... -->`（host overlay，本仓库自持）双标记分层，以支撑 §11.5.5 的漂移门。触发面通过 frontmatter `description` 声明（宿主据此决定何时激活技能）。

宿主工具契约分叉是**已验证的有意分叉**，禁止合并（CLAUDE.md「工具契约段」）——plugin 技能只引用真实的 Codex/CC MCP 工具面（`alembic_code_guard` / `alembic_search` / `alembic_prime` / `alembic_recipe_map` / `alembic_graph`），不得引入 main-only 工具名（`alembic_guard` / `alembic_enrich_candidates` / main 语义的 `alembic_bootstrap`）。

#### 11.6.1 alembic-create/SKILL.md —— 知识提交

`skills/alembic-create/SKILL.md`：指导 Agent 向知识库提交候选（candidates，pending 状态，用户经 Dashboard review/publish）。
- 前置契约（host overlay，`:10`）：MCP 工具返回**干净 `structuredContent`**（`ok/status/summary/error?/meta?`），可见文本仅 summary——这是 plugin 宿主与 main 宿主的响应契约分叉（plugin 干净 structuredContent ↔ main 统一 JSON Envelope）。
- 提交路径（`:24`）：单条 / 批量（`items` 数组）/ Dashboard，均用 `alembic_submit_knowledge`。
- V3 必填 16 字段表（`:38`）：`title/description/trigger/language/kind/category/knowledgeType/doClause/dontClause/whenClause/coreCode/headers/usageGuide/content/reasoning`。`doClause` 是 Channel A+B 硬依赖（`:169`：缺它 .mdc 文件无法生成）。
- 批量反冗余规则（MANDATORY，`:133`）：同批 items 不得交叉冗余；系统只检测「候选 vs 库内条目」融合，**不检查批内冗余**，Agent 须自行强制。
- kind 路由（`:161`）：`rule→Channel A(.mdc rule)` / `pattern→Channel B(.mdc pattern + Snippet)` / `fact→搜索/Guard 上下文`。

#### 11.6.2 alembic-guard/SKILL.md —— 合规检查

`skills/alembic-guard/SKILL.md`：用 `alembic_code_guard` 按 Recipe 标准检查代码。
- 工具契约（host overlay，`:17`）：**plugin 暴露 `alembic_code_guard`（三种 scope：显式 `files` / 内联 `code`+`filePath`/`language` / 活跃 `workRef`）**；main 暴露 `alembic_guard`。公共契约**不接受** `diffRef/primeRef/acceptedGuards/applicableRecipe` 作为 scope，也不再接受无参 whole-diff 检查（`:26`）。
- 边界（共享段，`:11`）：Guard 是 scoped Recipe 遵从检查，**不是** repo lint / 安全审计 / 通用 code review / whole-diff 兜底。
- workRef 形态（`:52`）：只用 `alembic_work` start/finish 记录的 scoped 文件；无 scoped 文件则返回 `no-code-scope` 而非扫描无关仓库状态。
- 知识来源（共享段，`:73`）：`kind=rule`→Guard 规则（error/warning/info）、`kind=pattern`→最佳实践参考、`constraints.guards[].pattern`→自动检测正则。

#### 11.6.3 alembic-recipes/SKILL.md —— Recipe 上下文

`skills/alembic-recipes/SKILL.md`：向 Agent 提供本项目 Recipe 上下文（标准知识库）。
- 知识库总览（共享段，`:19`）：Recipes（`Alembic/recipes/*.md`）/ Snippets（`Alembic/snippets/*.json`）/ Candidates（`Alembic/.asd/candidates.json`）/ Context index（`Alembic/.asd/context/`，`alembic embed` 建向量索引）。
- 权限边界（`:33`）：允许 submit 候选 / search-get-expand / 用 detailRefs；禁止直接创建修改 Recipe / publish-deprecate-delete / 写 `Alembic/recipes/`。
- 检索方式（`:41`）：in-context index → `alembic_search(operation=search)` → `get|expand`。host overlay（`:47`/`:55`）：plugin 用 `mode=auto/keyword/semantic`，运行时诊断（resident/pure-local/vector）归 `alembic_status(aspect:runtime|knowledge)`。
- `perHostSections`：`intro-and-overview` / `use-context-tail` 声明为宿主分叉段（见 §11.5.5）。

#### 11.6.4 alembic-structure/SKILL.md —— 结构与依赖图

`skills/alembic-structure/SKILL.md`：项目结构 / 模块 target / 依赖图 / 项目内部关系导航。
- 导航工具（`:22`）：`alembic_recipe_map(focus={kind:space|file|module})`——Recipe-mounted 区域概览。
- 项目图工具（`:36`）：`alembic_graph(queryKind=map|file-symbols|source-slice|anchor-range|impact|path|neighborhood|stats)`——ProjectContext-backed 结构/源码/依赖关系。
- 边界纪律（host overlay，`:15`）：图输出是 orientation evidence，**当前代码行为须以 raw reads/search、Guard、仓库测试为准**（不以图为验收）。
- 依赖结构文件（`:57`）：`Alembic/Alembic.spmmap.json`（`alembic spm-map` 刷新，支持 SPM/Node/Go/JVM/Python/Dart/Rust）。
- `perHostSections`：`title-intro` / `tools-and-graph` 均为宿主分叉段（plugin 用 `alembic_project_matrix` + project-graph ↔ main 用 `alembic_structure` + knowledge-graph）。

---

### 11.7 templates/recipes-setup —— 种子 Recipe 模板

`templates/recipes-setup/`（`shared-asset-manifest.json` 声明 `directory-exact`，authority=main）是初始化项目时铺到 `Alembic/recipes/` 的 Recipe 格式说明与空白模板。

- `README.md`（179 行）：Recipe 格式权威说明——三段式结构（Frontmatter / `## Snippet` / `## AI Context`，`:28`）、kind 三分类（`rule←boundary-constraint` / `pattern←code-pattern 等` / `fact←code-relation 等`，`:18`）、必填 7 字段（`title/trigger/category/language/summary_cn/summary_en/headers`，`:40`；`trigger` MUST 以 `@` 开头小写下划线，`category` MUST 为 8 个标准值之一）、可选与扩展字段、Usage Guide 结构规范（CRITICAL：必须 `###` 分段 + `-`/`*` 列表，禁止一行堆砌，`:85`）、Recipe 生命周期（Draft→Review→Published→Maintenance→Deprecated，`:146`）、以及 MCP 工具表（`:156`，含 plugin 变体行 `alembic_search` compact 路由 / `Dashboard Candidates` / `alembic_project_matrix`——即 §11.5.5 声明的 `fileVariants`）。
- `_template.md`（123 行）：空白 Recipe 模板，复制改名填空即用。含 Required Fields、`# V3 Host Agent Required Fields`（plugin 变体标题，`:12`，对应 main 的 `# V3 Agent Consumption Fields`）里的 `kind/doClause/dontClause/whenClause/coreCode/usageGuide`、可选字段、以及 `## Snippet` + `## AI Context`（中英混排的标准分段：When to Use / Steps / Key Points / 错误处理 / 性能与资源 / 安全与合规 / 常见误用 / 最佳实践 / 替代方案 / 相关 Recipe）。

这套模板是「submit_knowledge V3 字段」（§11.6.1）与「磁盘 Recipe .md 三段式」两种表示的对齐说明书，保证 Agent 提交的候选与人手写的 Recipe 落到同一 schema。

---

### 11.8 docs/ —— 声明式效果与遗留登记

- `docs/declared-effects.md`：MCP 工具面（agent 26 / usable 39，双宿主壳）的**逐类副作用声明**，配套证明 `test/unit/McpEntrypointEffects.test.ts`（沙箱 ALEMBIC_HOME，绝不碰真 `~/.asd`）。5 个效果类（`:11`）：read-only 知识查询（无 dataRoot 外写、不碰 Alembic-owned `runtime-control.json`）/ session-work 流（dataRoot 内会话态）/ 知识写（限 dataRoot：DB + 知识投影 + `.agents/skills` 技能导出，**recipe 证据门先于持久化**）/ 破坏性-init（限 dataRoot + ALEMBIC_HOME `projects.json`；rescan 归档投影到 `.asd/.trash/<ts>/`，裸 bootstrap 需 `rebuild:true`）/ daemon 控制。硬边界（`:19`）：plugin **NEVER** 写 Alembic-owned `runtime-control.json`（宪章 must-never 线，由 effects 测试断言）。
- `docs/legacy-register.md`：本仓库**每一条遗留兼容路径**的单一账本——一条 legacy 路径只有在此有 owner + 具体退役条件才允许存在于代码中。Active 3 条：L1（`error-taxonomy.ts` 的 `LEGACY_ERROR_CODE_FAILURE_KINDS` 映射，见 §11.5.4，退役条件=所有生成点显式传 `failureKind`）、L2（`LEGACY_IDE_AGENT_SOURCE`，Core-owned，plugin 仅 importer，`SourceBoundary.ts` 把 legacy `'ide-agent'` 写源归一化到 `HOST_AGENT_SOURCE`）、L3（`ProjectRuntimeContext.ts` 的 `legacyEffectiveIdentityFallback` 只读诊断标签，`effectiveIdentityAllowed` 恒 false 从不影响身份解析）。Disposed 4 条（D1–D4）记录已删除路径与删除 commit——如 D3 是 0.3.0 删除的 `evolution/panorama` HTTP 双胞胎路由（byte-identical twins，无 plugin 消费者）。

---

### 11.9 数据模型综述 —— 表 → 写者 → 读者映射

plugin **不自建 SQLite schema**：它经 `@alembic/core/repositories` bundle 消费 Core 定义的表（DB 落盘 `./.asd/alembic.db`，`default.json:2`）。DI 桥接点在 `lib/injection/modules/InfraModule.ts` 的 `registerRepositories(c)`（`:99`）——每个 repository 都注册为 plugin 单例，实现体统一由 `getCoreRepositories(ct).<repo>` 桥接（如 `:102`–`:146`），类型在 `lib/injection/ServiceMap.ts:36`–`:106` 声明。这是典型的 **adapter/bridge + DI singleton registry** 模式：Core 提供实现，plugin 只在容器里挂 key。

**plugin 注册的 12 个 Core repository 单例**（ServiceMap.ts:91–106）：`knowledgeRepository / knowledgeEdgeRepository / codeEntityRepository / bootstrapRepository / guardViolationRepository / memoryRepository / sessionRepository / proposalRepository / warningRepository / lifecycleEventRepository / gitDiffCheckpointRepository / coverageLedgerRepository / recipeSourceRefRepository`。

`RECIPE_GENERATION_STATE_PROJECTION_SOURCES`（`lib/recipe-generation/contracts.ts:11`）明确列出 recipe-generation 子系统投影依赖的 4 张表：`knowledge_entries / recipe_source_refs / evolution_proposals / lifecycle_transition_events`。

#### 关键表 → 写者 → 读者

| 表 | plugin 侧写者（write path） | plugin 侧读者（read path） | 用途 |
| --- | --- | --- | --- |
| `knowledge_entries` | `alembic_submit_knowledge`→`KnowledgeService`（经 `knowledgeRepository`）；`KnowledgeSyncService` 从 `.md` 恢复（`knowledge-index-rebuild.ts:76`）；`deleteKnowledgeEntriesByLifecycle`（`SqliteDatabaseAccess.ts:277`） | `guard.ts:563`（`knowledgeRepository.findById`）；`opportunistic-evolution-presenter.ts:112`；`queryRecipeSnapshotRows`（`SqliteDatabaseAccess.ts:213`）；`ProjectSkillKnowledgeRepository.ts:32`（COUNT） | DB 持久化 Recipe 表（40+ 列），是 search/Guard/生成的核心知识源 |
| `recipe_source_refs` | Core `SourceRefReconciler.reconcile({force:true})` 由 `knowledge-index-rebuild.ts:151` 触发；rename 修复 `maybeRepairRenames`（`:190`） | `readSourceRefState`（`SqliteDatabaseAccess.ts:94`，SELECT FROM recipe_source_refs）；`RecipeFreshnessRuntime`；recipe-region 向量的桥接元数据（`knowledge-index-rebuild.ts:78`） | Recipe→源码锚点（`reasoning.sources`）的物化投影，供新鲜度门与向量桥接 |
| `evolution_proposals` | `EvolutionProposalRepository`（经 `proposalRepository`）；`CleanupService`（`lib/service/cleanup/CleanupService.ts`） | `contracts.ts` state projection；`SubmitKnowledgeProposalRouter`（test 消费）；`ProposalRepository`（test） | 演进提案（propose→apply 流），commit-driven 维护产出 |
| `evolution_coverage_ledger`（per module×dimension cell + `deep_mining_rounds`） | `plan-confirm.ts:127`（coldStart 写 deferred 空行 `upsertCell{grade:'empty',deferred:true,lastRound:0}`）；`dimension-completion.ts:637+`（deepMining per-cell 覆盖回写 + `listRoundsByProjectRoot`） | `plan-tool.ts:253`（`listByProjectRoot` 读 gap 候选）；`dimension-completion.ts:677`（target-scoped 计数） | deepMining 多轮覆盖账本；与 git-diff 维护游标严格分坐标系（`ServiceMap.ts:102` 注释、`plan-confirm.ts:76` RED LINE） |
| `git_diff_checkpoints` | Core `EvolutionGitDiffCheckpointRepository`（经 `gitDiffCheckpointRepository`），由 `GitDiffCheckpoint→HostAgentFileChangeHandler` commit-driven 维护链驱动（`PluginOpportunisticEvolution.ts:24`、`git-diff-checkpoint/*`） | commit-driven 维护链自身（`CommitDrivenMaintenance.ts`：`scanOnce`→`handleFileChanges`→`recordRouteOutcome`） | commit 维护游标（记录已扫描到哪个 diff）；**D3 铁律：coverage_ledger 与它互不读写** |
| `sessions` / session store | `SessionRepository`（经 `sessionRepository`）；work_start/work_finish 会话态 | `WorkflowCompletionFinalizer`→`consolidateSemanticMemory` 读 `session.sessionStore`（`CompletionSteps.ts:73`）；`dimension-completion.ts:1725`（`getDimensionReport`） | 会话/维度分析存储，是完成收尾器与技能生成的输入 |
| `bootstrap_snapshots` | Core `BootstrapRepository`（经 `bootstrapRepository`） | `readSnapshotState`（`SqliteDatabaseAccess.ts:148`，SELECT FROM bootstrap_snapshots WHERE project_root=?） | bootstrap 快照（file/dimension/candidate 计数），KnowledgeState 用它判「知识是否可用」 |
| `lifecycle_transition_events` | Core `EvolutionLifecycleEventRepository`（经 `lifecycleEventRepository`） | `contracts.ts` state projection（`RECIPE_GENERATION_STATE_PROJECTION_SOURCES`） | Recipe 生命周期状态迁移事件流 |
| `guard_violations` | Core `GuardViolationRepository`（经 `guardViolationRepository`） | Guard 复审链 | Guard 违规记录 |
| `knowledge_edges` | Core `KnowledgeEdgeRepository`（经 `knowledgeEdgeRepository`） | 知识图/关系查询 | Recipe 间关系边 |
| `code_entities` | Core `CodeEntityRepository`（经 `codeEntityRepository`） | ProjectContext/graph 查询 | 源码实体（符号/文件节点） |
| `evolution_warnings` | Core `EvolutionWarningRepository`（经 `warningRepository`） | 演进告警查询 | 演进告警 |

#### SqliteDatabaseAccess —— plugin 侧只读投影旁路

`lib/infrastructure/database/SqliteDatabaseAccess.ts` 是 plugin **绕过 repository、直接对 SQLite 做只读/维护查询**的低层旁路（facade over better-sqlite3），用于 KnowledgeState 判定、快照读取、以及 rescan/cleanup 的表级操作。关键导出：
- `resolveSqliteDb(db)`（`:71`）：从容器 database 句柄解析出底层 better-sqlite3 实例。
- `readSourceRefState(databasePath)`（`:94`）/ `readSnapshotState(databasePath, projectRoot)`（`:148`）：被 `lib/runtime/KnowledgeState.ts:5` 消费，回答「本 dataRoot 是否有知识」。
- `queryRecipeSnapshotRows`（`:213`，容忍 `dimensionId` 列缺失的 `hasDimensionId` 分支）、`listTableColumnNames`（`:207`，schema 探测）。
- 维护类：`exportTablesAsJsonLines`（`:232`，SELECT * 导出）/ `clearTables`（`:253`，DELETE FROM）/ `deleteKnowledgeEntriesByLifecycle`（`:277`）——rescan 归档与 cleanup 用。
- `getLatestSchemaMigrationVersion`（`:82`，读 `schema_migrations`）——版本探测。

设计边界：SqliteDatabaseAccess 只做**读与表级清理**，不承载业务写（业务写全走 repository）；且 `deleteKnowledgeEntriesByLifecycle` 等破坏性操作对应 `declared-effects.md` 的「破坏性/init 类」，受 rescan 归档到 `.asd/.trash/<ts>/` 的 t6 门禁约束。

#### ProjectSkillService —— 技能导出的服务层（§11.2 的下游）

`lib/service/skills/ProjectSkillService.ts`（`createProjectSkillService`，`:571`）是 §11.2 `generateSkill` 的导出目标，也是 §11.9 中「知识写类：技能导出 `.agents/skills`」的执行者：
- `upsert(args)`（`:164`）：把技能内容写到 `dataRoot/Alembic/skills` 源（磁盘 `.md`），并在 `authorizeProjectSkillExport===true` 时投影为 `.agents/skills` 符号链接（Codex 运行时投影，`:87`/`:301`），返回 `deliveryReceipt` + `runtimeExport{ runtimeExportStatus, targetPath }`。`success` 严格等价于 `runtimeExportStatus==='exported'`（`:233`）。
- `ProjectSkillKnowledgeRepository.ts`：读 `knowledge_entries` 计数（`:32`）以判定「knowledge-dependent 同名 Project Skill 是否需刷新」（`tools.ts:283` refresh 语义）。

这一层解释了为何 `docs/declared-effects.md` 把技能导出归入「知识写类，限 dataRoot」——技能落盘与 `.agents/skills` 投影都在项目 dataRoot 内，绝不外溢。

---

### 11.10 小结：本子系统的横向定位

本节四块共同构成 plugin 的「横向支撑面」，都不直接实现 alembic_* 工具业务，而是**约束、配置、说明、并落地**这些工具的产物：

- **workflows/capabilities** 是维度完成的收尾器——把分析文本变成技能文件（execution）+ 刷新/固化投影（completion），二者均非阻断、可注入、能力退场后仍留接口。
- **config/ 门禁清单** 是 registry 模式的机器可读事实——Core 导入边界、命名、副作用豁免、错误码映射、跨仓漂移，全部「清单即真相、脚本比对」，落实 CLAUDE.md 的各条硬边界。
- **skills/ + templates/** 是宿主 Agent 的工具说明书，用双标记分层支撑主/plugin 双宿主的工具契约有意分叉，禁止合并。
- **数据模型** 全部来自 `@alembic/core/repositories` bundle，plugin 只做 DI 桥接与只读旁路投影；coverage_ledger 与 git_diff_checkpoints 的坐标系隔离（D3 铁律）是本仓库唯一自持的数据契约红线。

新工程师据此可以理解：改任何门禁清单必须走 edit-in-authority-then-sync 且知道对应 `npm run check:*` 脚本；改 SKILL.md 只能动 host 段、共享段回主仓库；加/删表写者要经 Core repository 而非在 plugin 直写 SQLite；维度完成的技能产物门禁（长度/重复/结构）在 `WorkflowSkillCompletionCapability.ts` 的 `validateSkillQuality`。


---

## 12. 工作空间初始化与知识上下文输出层(补遗)

本节补齐前 11 节遗漏的三块内容:(1) `lib/cli/SetupService.ts` —— Alembic 工作空间/项目初始化底座;(2) `lib/runtime/mcp/knowledge-context-tools/*` —— `alembic_search` / `alembic_graph` / `alembic_recipe_map` 的 MCP 输出格式化(clean-output projector)注册层;(3) `package.json` imports map 中的 `#governance/*` 死别名。所有内容来自真实源码阅读,file:line 引用均指向仓库根下的相对路径(仓库根 = `AlembicPlugin/`)。

---

### 12.1 SetupService —— 工作空间初始化底座

文件:`lib/cli/SetupService.ts`(909 LOC)。它是 Alembic 在一个项目/工作空间上"从零到可用"的落地器:创建运行时缓存目录、知识库目录树、SQLite 数据库、可选的 recipes 子仓库、可选的向量索引。类头注释(`:1-40`)把整套数据架构讲透:核心数据(统一 Recipe 实体)在 `Alembic/recipes/`(Source of Truth),`.asd/` 只是运行时缓存(gitignored),写入安全靠"入口 schema/确认/scope 校验",而非运行时角色或中央权限矩阵。

#### 入口调用者(who calls it)

真实唯一的运行时调用者是 MCP host server 的 init 路径:

- `lib/runtime/mcp/HostMcpServer.ts:13` `import { SetupService }`;
- `lib/runtime/mcp/HostMcpServer.ts:627` `new SetupService({ projectRoot, force, seed, ghost: requestedMode === 'ghost', profile: CODEX_SETUP_PROFILE, quiet: true })`,随后 `await service.run()`(`:635`)。

也就是说 SetupService 是 **`alembic_init`(以及经由同一 init 路径的自动初始化)** 的实现体。调用前 HostMcpServer 有一道幂等短路(`HostMcpServer.ts:606-624`):若 `inspectKnowledge(projectRoot).initialized` 且非 `force`、非 `seed`、`requestedMode !== 'standard'`,直接返回 `alreadyInitialized: true` 而不构造 SetupService。构造使用固定 `profile: CODEX_SETUP_PROFILE` 与 `quiet: true`(结构化 MCP 结果场景,避免 stdout 污染)。`ClaudeCodeHostAdapter.ts:34/40` 只在注释里引用 SetupService 的 `profile` 字段类型锁定(per-host 产物说明),不构造实例。`SetupProfile` 类型(`:87`)有两枚:`'codex-plugin'` 与 `'headless'`。

#### 构造函数:三条路径(`:117-207`)

构造函数把"这个项目的数据落在哪里"一次性解析定,是整个类的地基。按优先级分三条互斥路径:

1. **原生 ProjectScope 优先(`:141-153`)**。`resolveNativeProjectScopeWorkspace(projectRoot)`(`:863-873`)委托 `resolveProjectScopeRuntime`(来自 `lib/shared/project-scope-runtime.ts:49`),后者先读环境变量 `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY`(`:14/30`),否则经 `WorkspaceResolver.fromProjectScopeRegistry` / `loadProjectScopeForFolder` / 直接读 `readProjectScopeRegistryDocument()` 三级回退(`project-scope-runtime.ts:135-159`)。命中原生 scope 时:**强制 `ghost = true`**,并把 `runtimeDir/dbPath/knowledgeDir/recipesDir/candidatesDir/skillsDir` 全部取自 `WorkspaceResolver`(以 `projectScope + currentFolderId` 构造),`subRepoPath = join(dataRoot, subRepoDir)`,然后 `return`——不再走注册/排除逻辑。这条路径是多仓空间(整体空间根)冷启动的正确落点。

2. **多仓 checkout 硬拦(`:155`)**。`assertNativeScopeBeforeMultiRepoInit`(`:875-885`)在没有原生 scope 时检查 `looksLikeMultiRepoCheckout`(`:887-905`):扫描 `projectRoot` 子目录,凡带 `MULTI_REPO_CHILD_MARKERS`(`.git`/`package.json`/`pyproject.toml`/`Cargo.toml`/`go.mod`/`Package.swift`,`:75-82`)的目录计为 member-like,达到 **2 个即判定为多仓**并 `throw`,要求先 `project-scope add <folder>` 再重来。设计意图明确写在错误信息里:拒绝在没有 ProjectScope 的多仓 checkout 上初始化,防止回退到单一根或 `/tmp/alembic-dev`。

3. **普通单仓路径(`:159-207`)**。经 `ProjectRegistry`(来自 `@alembic/core/workspace`)决定 ghost:
   - 若注册表已有条目且显式 `ghost` 与之冲突,`throw`(`:161-168`)——普通 setup 不静默切换 workspace mode,模式迁移必须走 Core 的显式 `setWorkspaceMode()`。
   - `this.ghost = existingEntry?.ghost ?? explicitGhost ?? profile === 'codex-plugin'`(`:169`)——注册表 > 显式参数 > profile 默认(codex-plugin 默认 ghost)。
   - **排除项目保护(`:172-179`)**:`isExcludedProject`(`@alembic/core/shared`),非 ghost 且命中排除时 `throw`,避免在 Alembic 自身仓库等排除目录里写 `.asd/`+`Alembic/`。
   - Ghost 分支 `ProjectRegistry.register(root, true)` + `new WorkspaceResolver({ ghost:true, projectId })`;标准分支同样 `register(root, false)`(`:191`)。
   - 最终六个目录字段全部由 `resolver` 统一计算(`:196-201`),`subRepoPath` 在 ghost 时落在 `resolver.dataRoot` 内、否则落在 `projectRoot` 内(`:204-206`)。

数据流要点:**所有路径的最终产物都是同一组字段**(`runtimeDir`/`dbPath`/`coreDir`/`recipesDir`/`candidatesDir`/`skillsDir`/`subRepoPath`),差别只在"落在项目内还是外置 `~/.asd/workspaces/`"。这是典型的策略/解析器分离——路径决策集中在 `WorkspaceResolver`(Core),SetupService 只消费结果。

#### 执行编排:getSteps / run(`:211-246`)

`getSteps()`(`:211`)固定返回 4 步(标签为中文):
1. 创建运行时目录与配置 → `stepRuntime`
2. 初始化知识库与 recipes 子仓库 → `stepCoreRepo`
3. 初始化数据库 → `stepDatabase`
4. 初始化向量索引 → `stepVectorIndex`

`run()`(`:222-246`)顺序执行,**每步独立 try/catch**:成功 push `{ step, label, ok:true, ...stepResult }`,失败 push `{ ok:false, error }` 并 `writeError`——单步失败不中断后续步骤(step 4 向量索引是 best-effort,失败不阻塞)。结果存 `this._results`。`printSummary`(`:266-297`)按 profile 打印"下一步"指引:`codex-plugin` 提示 `alembic_status`/`alembic_prime`/`alembic_work(phase=finish)+alembic_code_guard`;`headless` 提示由 IDE 插件启动 MCP/daemon。`quiet` 模式下所有 `writeLine`/`writeError`(`:299-309`)静默。

#### Step 1 — stepRuntime(`:313-348`)

`mkdirSync(runtimeDir, {recursive})`,写 `config.json`(**幂等**:已存在且非 force 则跳过,`:318-319`)。config 结构(`:320-339`):`version:2`、`projectName`、`database:'.asd/alembic.db'`、`core.subRepoDir`(+可选 `subRepoUrl`)、`guard.enabled:true`、`vector.localEmbedding`(默认 `enabled:false`,endpoint/model 来自 `DEFAULT_OLLAMA_*`,`laneOrder:'local-first'`)。返回体带 `localEmbeddingGuidance`(`localEmbeddingSetupGuidance(resolveLocalEmbeddingConfig({}))`,来自 `#recipe-generation/vector/LocalEmbedding.js`,`:69`)——GMAP-L2/L3 注释强调:插件永不下载模型,只暴露安装指引,关闭时干净回退到关键词检索。

#### Step 2 — stepCoreRepo(`:352-424`)

先建四个目录(`coreDir/recipesDir/candidatesDir/skillsDir`,`:356-358`)。**子仓库处理是核心分支(`:361-377`)**,只在 `subRepoUrl` 存在时触发:
- 已是 git 仓库(`isGitRepo`)→ `_ensureRemote(url)`(幂等对齐 origin);
- 有文件但非 git → `_cloneWithMerge(url)`(备份→clone→合并→清理,见下);
- 空目录 → `rmdirSync` 后直接 `_git clone`。

无 URL 时 recipes/ 作普通目录随主仓库提交,不 `git init`。随后按序写入(全部走"已存在且非 force 则跳过"幂等语义):`constitution.yaml`(入口安全策略)、`boxspec.json`(项目规格)、`recipes/_template.md`(格式参考)、可选 seed recipes、`README.md`、可选子仓库 `.gitignore`。若是新 clone,末尾把模板文件 `git add . && git commit`(`:406-416`,首次可能无变更,吞异常)。返回 `{ coreInit, alreadyRepo, subRepoPath, hasUrl }`。

关键辅助:
- `_writeEntrypointSafetyPolicy`(`:427-461`):优先从 `templates/constitution.yaml` 复制,模板缺失时**内联生成最小策略**(4 条规则:destructive_confirm / content_required / ai_no_direct_recipe / batch_authorized,version 4.0)——这是"入口安全模型"的落地文件,兼容用途、不定义运行时角色。
- `_writeBoxspec`(`:464-486`):`{ name, schemaVersion:2, kind:'root', root:true, knowledgeBase.dir, subRepo.dir, module.rootDir }`,dir 常量来自 `@alembic/core/workspace`。
- `_copyRecipeTemplate`(`:489-500`)/ `_copySeedRecipes`(`:503-528`):从 `templates/recipes-setup/` 复制 `_template.md` 与 `seed-*.md`(去 `seed-` 前缀),幂等跳过。
- `_writeCoreReadme`(`:531-613`):生成知识库 README,含统一知识模型的 `knowledgeType` 表(code-standard/code-pattern/.../solution 共 12 类)、入口安全模型说明,并按 `subRepoUrl` 有无切换"团队协作(submodule/clone)"vs"随主仓库提交"文案。

`REPO_ROOT` 常量(`:74`)= `PACKAGE_ROOT`(来自 `../shared/package-assets.js`),用于定位 `templates/` 资源——即模板取自插件包自身,而非用户项目。

#### Step 3 — stepDatabase(`:617-670`)

这是最"重"的一步,涉及进程级全局状态的临时改写与严格恢复:
- 动态 import `AppConfigLoader`(`#infra/config/AppConfigLoader.js`)与 `Bootstrap`(`../bootstrap.js`),`:618-619`。
- **保存并临时改写进程状态**:`process.env.ALEMBIC_PROJECT_DIR`、`ALEMBIC_QUIET`、`process.chdir(projectRoot)`(`:627-633`),因为 Bootstrap/ConfigLoader 依赖 cwd 与环境变量定位配置与数据库。
- `Bootstrap.configurePathGuard(projectRoot, resolver?.knowledgeBaseDir)`(`:635`)装 path guard;`ConfigLoader.load(env)` 后 `set('database.path', '.asd/alembic.db')`(`:638-639`)。
- `new Bootstrap({env}).initialize()`(`:641-642`)拿到 `components.db.getDb()`,再 `_syncRecipesToDB(db)`(`:644-648`)。
- **finally 块严格恢复(`:651-669`)**:`bootstrap.shutdown()`、`ConfigLoader.config = null`(重置静态单例)、还原 `ALEMBIC_PROJECT_DIR`/`ALEMBIC_QUIET`/`process.chdir(previousCwd)`。这套"改写-恢复"模式保证 setup 不污染宿主进程的全局状态——是本步最关键的正确性设计。

`_syncRecipesToDB`(`:676-690`):动态 import Core 的 `KnowledgeSyncService`(`@alembic/core/knowledge`),以 `syncRoot = resolver?.dataRoot ?? projectRoot` 构造,`sync(db, { skipViolations:true })`——setup 场景跳过违规记录,把 `Alembic/recipes/*.md + candidates/*.md` 全字段同步进 DB 缓存(统一 Recipe 模型)。这是**主要的 Core 连接点**:SetupService 不自己解析 Recipe,委托 Core 的 KnowledgeSyncService。

#### Step 4 — stepVectorIndex(`:785-847`,best-effort)

整步包在 try/catch,失败返回 `{ status:'warning', error, hint }` 不阻塞。经 `getServiceContainer()`(`../injection/ServiceContainer.js`)取 `vectorService`:
- 未注册 → `status:'skipped'`,提示 embedded runtime 保持 baseline search,语义增强由 resident service 提供(`:791-798`);
- `getStats()`+`getAvailability()` 并行(`:802-805`);
- provider 不可用 → skipped + `localEmbeddingGuidance` + 提示 `ollama pull <model>` 与开关方式(`:808-819`);
- 已有数据且非 force → skipped(`:822-828`);
- 否则 `fullBuild({force})` → `status:'done'`,返回 indexed/skipped/errors(`:831-838`)。
`compactVectorAvailability`(`:850-859`)把可用性对象裁成 compact 字段(available/detail/embedProviderConfigured/probeStatus/reason/status)——与全局 clean-output 契约同向:对外只给精简投影。注释(`:779-784`)明确:插件 embedded runtime 不持有可执行 embedding provider,baseline/hybrid 直接可用,语义增强属 resident service。

#### Helpers 小结

`_git`(`:695-708`,`commit` 退出码 1 视为无变更返回空串)、`_hasFiles`(`:711-718`)、`_ensureRemote`(`:721-731`,无 origin 则 add)、`_cloneWithMerge`(`:737-775`,备份→clone(失败恢复备份并抛)→合并未覆盖文件→清理备份,是有文件非 git 目录接管远端子仓库的安全路径)。

设计模式归纳:**幂等步骤序列 + 策略化路径解析(WorkspaceResolver)+ 进程状态临时改写/严格恢复 + best-effort 降级 + 模板优先内联回退**。核心边界:SetupService 只做"落地与编排",Recipe 解析同步交 Core `KnowledgeSyncService`,路径解析交 Core `WorkspaceResolver`/`ProjectRegistry`,向量交 `vectorService` 容器。

---

### 12.2 knowledge-context-tools 输出层

目录:`lib/runtime/mcp/knowledge-context-tools/`,四个文件,是 `alembic_search` / `alembic_graph` / `alembic_recipe_map` 的 **MCP 对外输出格式化(clean-output projector)注册层**。它们不产生业务数据(数据来自 service 层 provider 产出的 ProjectContext/检索结果),只负责:(a) 向 `tools/list` 广告各工具的公共输出 schema;(b) 提供一个 typed fallback 投影,在 handler 返回体不合契约时兜底成合规的 failed 响应。

#### 共同机制:registerMcpOutputProjector(`runtime/mcp/output-contract.ts`)

四文件都调用 `registerMcpOutputProjector`(`output-contract.ts:85`)注册一个 `McpOutputProjector`(接口 `:75-81`:`outputSchema`/`outputSchemaName`/`project(input,ctx)`/`projectorName`/`toolName`)。注册进程级 `Map<toolName, projector>`(`:83`),重复注册同名 toolName 会 `throw`(`:86-88`)。消费侧 `projectMcpToolOutput(toolName, value)`(`:101-118`):取 projector → `project()` → `outputSchema.parse()` → 强制回填 `meta`(contractVersion=1 + outputSchema/projector/toolName)。这就是 **clean-output-contract 的落地机制**:每个 agent-public 工具的返回都被投影+校验成带统一 `meta` 的 compact 响应,`CleanMcpResponseSchema`(`:70`)是 `.passthrough()` 基座(`ok/status/summary/error?/meta?`)。

真实加载点:`runtime/mcp/tools.ts:49-52` 以 **副作用 import**(`import '.../graph-output.js'` 等)方式在工具注册时执行这四个文件顶层的 `registerMcpOutputProjector`——注册是"import 即生效"的。

#### 与 service/project-knowledge-context/contracts 的关系

三个 output schema 均从 `#service/project-knowledge-context/index.js` 导入:
- `AlembicSearchOutputSchema`(search-output.ts:10)
- `AlembicGraphOutputSchema`(graph-output.ts:10)
- `AlembicRecipeMapOutputSchema`(recipe-map-output.ts:10)

该 index barrel(`lib/service/project-knowledge-context/index.ts`)`export * from './contracts/index.js'` 等四个子模块;contracts 目录真实含 `AlembicSearchOutput.ts`/`AlembicGraphOutput.ts`/`AlembicRecipeMapOutput.ts`(+ `KnowledgeContextRefs`/`ProjectContextRegion`/`ToolOutputPrimitives` 等)。**契约(schema)是单源、定义在 service/contracts 层**,runtime 输出层只 import 并把它 `as unknown as z.ZodType<CleanMcpResponse>` 适配进 projector——契约定义与传输注册职责分离。

#### 各文件逐一

**`output.ts`(共享投影 registry —— 现已清空)**。导出 `KNOWLEDGE_CONTEXT_CLEAN_OUTPUT_TOOL_NAMES = [] as const`(`:11`)。注释(`:1-10`,GMAP-1/4/8/8b/8c)说明:每个旧 knowledge-context 工具现已各自拥有独立输出(graph/recipe-map/search 三个 output 文件),`alembic_prime` 是 agent-public 工具,`alembic_project_matrix` 已退役,**没有任何 agent 工具再用共享 `KnowledgeContextToolOutput` 投影**,故此集合为空,共享契约模块本身在 GMAP-8c 退役。这是一个**历史收敛后的空注册表**,唯一消费者是 `runtime/mcp/plugin-host-contracts.ts:2`(用于 host 契约的 knowledge-context 家族 toolNames 清单,当前为空)。一句话:它是"曾经的共享输出层"的墓碑与空占位,证明输出职责已下放到各工具自有文件。

**`search-output.ts`(alembic_search 输出投影)**。`SEARCH_CLEAN_OUTPUT_TOOL_NAMES = ['alembic_search']`(`:16`)。`projectAlembicSearchCleanOutput`(`:21-27`):`safeParse` 成功即原样返回;失败走 `buildAlembicSearchProjectionFailure`(`:29-55`)——用 `AlembicSearchOutputSchema.parse` 构造一个合规 failed 响应(`ok:false`/`status:'failed'`/空 `items`/`detailRefs`/`sources`/一条 `alembic-search-output-contract-mismatch` diagnostic/`meta.outputSchema:'AlembicSearchOutput'`)。注释(GMAP-8b)明确:search handler 已自返回 `CallToolResult`,此 projector 主要作用是 **在 tools/list 广告 AlembicSearchOutput schema** 并提供 typed fallback。search 特有字段:`items` + `detailRefs`(compact 命中项 + 明细引用,即"精简输出+detailRef"契约的体现)。

**`graph-output.ts`(alembic_graph 输出投影)**。`GRAPH_CLEAN_OUTPUT_TOOL_NAMES = ['alembic_graph']`(`:18`)。结构与 search 同构:成功原样、失败 `buildAlembicGraphProjectionFailure`(`:31-59`)构造 failed 响应,字段体现 graph 语义:`queryKind:'map'`、`project.projectRoot`、`nodes`/`relations`/`refs`(节点/关系/引用)、`limits:{truncated,itemLimit,refLimit,relationLimit}`、`meta.outputSchema:'AlembicGraphOutput'`。注释(GMAP-1)强调 graph 输出是 **Recipe-free** 的 AlembicGraphOutput,不用共享 envelope。这是 ProjectContext 结构/源码/依赖关系的对外 compact 呈现层。

**`recipe-map-output.ts`(alembic_recipe_map 输出投影)**。`RECIPE_MAP_CLEAN_OUTPUT_TOOL_NAMES = ['alembic_recipe_map']`(`:16`)。同构,失败 `buildAlembicRecipeMapProjectionFailure`(`:29-71`)构造 failed 响应,字段最丰富,体现 recipe_map 语义:`project`、`focus:{kind:'space'}`、`radius`、`region:{rootNode(nodeId/kind/label/directRecipeCount/descendantRecipeCount/representativeRecipeIds),breadcrumb,nodes,truncated}`、`refs`、`recipeMounts`、`recipeRollups`、`limits:{nodeLimit,recipeMountLimit,refLimit,detailLevel:'summary'}`。注释(GMAP-4/7)说明它输出 region + Recipe mounts/rollups,是导航面(区域+Recipe 挂载/汇总)的 compact 投影。

#### 三者共性与设计模式

四文件是同一模板的实例:**schema 从 service/contracts 单源导入 → 适配为 `z.ZodType<CleanMcpResponse>` → 定义 `project`(safeParse 成功透传/失败构造 typed failed 投影)→ 顶层 `registerMcpOutputProjector` 注册**。这是"契约优先 + 投影兜底 + 副作用注册"模式。它们与 12.1 SetupService 的 `compactVectorAvailability` 精神一致——对外只暴露精简、可校验、带统一 meta 的结果。clean-output-contract 的强制点在 `projectMcpToolOutput`(`output-contract.ts:107` 的 `outputSchema.parse` + `meta` 回填),这四个文件是它的注册端。

---

### 12.3 `#governance/*` 死别名说明

`package.json` 的 imports map 含:

```json
"#governance/*": {
  "alembic-dev": "./lib/governance/*",
  "default": "./dist/lib/governance/*"
}
```

但 **`lib/governance` 目录不存在**(经 `ls lib/governance` 确认:`ls: lib/governance: No such file or directory`)。因此:

- `#governance/*` 是一个 **dead/stale alias(死别名)**:imports map 里声明了,但源码树里既无 `lib/governance/`,构建产物侧也不会有 `dist/lib/governance/`(源缺失)。
- 全仓无任何 `#governance/*` 导入消费(该别名从未被 import 解析命中);它只是 package.json 中一条无对应实现的映射条目。
- 对比:同一 imports map 的其他别名均有实处——`#shared`→`lib/shared`、`#infra`→`lib/infrastructure`、`#service`→`lib/service`、`#inject`→`lib/injection`、`#workflows`→`lib/workflows`、`#recipe-generation`→`lib/recipe-generation`、`#codex`→`lib/runtime`(兼容别名)。唯独 `#governance` 无落地目录。
- 结论:`#governance/*` 应视为 imports map 中残留的死配置项,不代表任何 governance 子系统在本仓库存在。任何认为"插件内有 governance 层"的推断都应以此别名为据被排除——governance 语义(总控/边界/审计)在本 workspace 属 Wakeflow 与主仓库范畴,不在 AlembicPlugin 的 `lib/` 内。

(附:插件内的"入口安全策略/权限"并非 governance 子系统,而是 12.1 中 `constitution.yaml` + 各入口 schema/确认/scope 校验的分散式入口安全模型,由 SetupService 落地,与该死别名无关。)


---
