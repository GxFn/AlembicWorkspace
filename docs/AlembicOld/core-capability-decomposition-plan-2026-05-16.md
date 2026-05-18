# AlembicCore 能力拆解计划

日期：2026-05-16

## 背景

当前工作空间统一维护在 `/Users/gaoxuefeng/Documents/AlembicWorkspace`，已有三个仓库：

| 仓库 | 当前角色 | 当前状态 |
| --- | --- | --- |
| `AlembicCore` | 共享核心能力仓库 | 已有首个最小提交，包名为 `@alembic/core`，当前包含 folder names 契约和最小 runtime factory。 |
| `Alembic` | 独立全能力本地版 | 已通过 `vendor/AlembicCore` submodule 和 `file:vendor/AlembicCore` 指向 Core。 |
| `AlembicPlugin` | 插件统一仓库，当前先承载 Codex 插件 | 已通过 `vendor/AlembicCore` submodule 和 `file:vendor/AlembicCore` 指向 Core。 |

本计划承接 `three-repository-restructure-plan-2026-05-16.md` 的三仓库边界，但更聚焦一个问题：哪些能力应该进入 `AlembicCore`，按什么顺序迁移，以及每一轮迁移完成后如何验收。

## 当前基线

`AlembicCore` 当前不是空仓库，已有：

- `package.json`：`@alembic/core`，ESM，NodeNext，Node.js 22+。
- `src/folder-names.ts`：从现有运行时抽出的目录命名契约。
- `src/runtime.ts`：最小 `createAlembicRuntime`。
- `src/index.ts`：Core 第一版导出入口。
- `src/scan/**`：宿主 Agent 辅助扫描 contract、task 分片、scan session 状态机。
- `src/workflows/**`：bootstrap/rescan workflow 入口、宿主结果 intake、维度 checkpoint。
- `src/discovery/**`：项目类型识别、target/file 收集、语言画像、依赖图基础结构。
- `src/analysis/**`：基础符号分析、符号表、调用图、ProjectGraph、parser adapter contract。
- `src/candidate/intake/**`：候选知识证据校验、readiness、去重前置。
- `src/storage/**` 与 `src/repository/**`：SQLite 连接、migration、核心 repository。
- `src/search/**`：确定性 tokenizer、sparse scoring、hybrid fusion、coarse/multi-signal ranking、knowledge graph 查询、无 embedding fallback。
- `src/vector/**`：JSON/SQLite vector record store、chunker、索引读写契约。
- `src/guard/**`：Guard 规则模型、regex/code/cross-file 检查、source collector、report model、quality gate。
- `src/jobs/**` 与 `src/events/**`：SQLite job store、job events、recover snapshot、EventBus、SignalBus、SignalTraceStore。

两个外层仓库当前都已经引用：

```json
"@alembic/core": "file:vendor/AlembicCore"
```

后续迁移的基本节奏应该是：

1. 先在 `AlembicCore` 添加真实能力和测试。
2. 再在 `Alembic` 与 `AlembicPlugin` 中切换 import 到 `@alembic/core`。
3. 最后删除两个外层仓库中已经被 Core 替代的重复实现。

## 核心目标

`AlembicCore` 的目标不是做一个抽象接口仓库，而是承载两个外层仓库都要使用的真实 Headless Runtime。

它应该满足：

- `Alembic` 可以用它支撑 CLI、daemon、Dashboard、冷启动、知识存储、检索和 Guard 流程；本地 AI 编排留在 `Alembic` 外层。
- `AlembicPlugin` 可以用它支撑 Codex MCP tools、Skills、preflight、Ghost 初始化、知识检索和 Guard 检查；智能体能力由 Codex 主 Agent 提供。
- Core API 不猜测宿主环境，不直接读 Codex、CLI、Dashboard、插件 manifest，也不把用户交互策略写死。
- 所有核心 API 接受明确输入，尤其是 `projectRoot`、`dataRoot`、runtime settings、候选知识、证据、扫描选项和任务上下文。

### 重要修正：Core 不包含 AI/Agent Runtime

`AlembicCore` 不负责调用模型，也不负责运行自主 Agent。插件版依赖 Codex 主 Agent，本地全能力版如果需要外部 AI，则由 `Alembic` 自己负责 provider 配置、prompt 编排、授权提示和审计。

Core 只处理宿主产物进入 Alembic 知识系统之后的确定性环节：

- 接收候选知识、SourceRef、证据、扫描结果和结构化任务输入。
- 校验、去重、合并、存储、检索、Guard 检查。
- 生成宿主无关的 context payload、报告和 job 状态。

换句话说，Core 是知识系统和项目理解内核，不是模型网关，也不是 Agent SDK。

## 边界原则

### 必须进入 Core

- Recipe / Knowledge 领域模型、生命周期、校验、SourceRef、readiness。
- Ghost workspace、项目目录解析、数据目录布局、项目注册表。
- Project discovery、语言识别、tree-sitter AST、项目结构图、调用图基础能力。
- 数据库、repository、文件知识库、向量索引、搜索管线。
- Guard 正向检查、规则加载、违规结构、报告结构。
- 宿主 Agent 辅助扫描链路的计划、任务分片、结果 contract、覆盖率、重试和恢复状态机。
- Bootstrap、rescan、candidate、consolidation 的核心流水线。
- daemon job 的领域契约、JobStore、可恢复任务状态。
- 候选知识 intake、证据校验、source attribution、合并和发布前 readiness。
- `Alembic` 与 `AlembicPlugin` 都需要的项目可信度、初始化状态、知识状态等 preflight 基础判断。

### 不进入 Core

- `alembic` 用户 CLI 命令、CLI 文案、交互式配置。
- Codex MCP server、Codex tool schema、Codex Skill、Codex marketplace/plugin manifest。
- Dashboard 产品 UI、本地 API server 产品壳、浏览器打开。
- VS Code/Cursor/JetBrains/Xcode 等宿主插件 UI 和投递逻辑。
- Lark Remote、旧 IDE 扩展、文件 watcher、截图采集、macOS GUI 工具。
- AI Provider、模型注册、prompt 执行、embedding 生成、token usage accounting、外部 AI transport。
- Agent runtime、自主任务循环、tool calling 编排、Codex 主 Agent 策略。
- 宿主策略：例如 Codex 如何驱动候选知识生成、本地版如何提示用户授权、Dashboard 如何展示审核。

### 可分层进入 Core

某些能力有核心层和宿主层之分，需要拆开：

| 能力 | Core 部分 | 外层仓库部分 |
| --- | --- | --- |
| Daemon | job contract、job store、runner abstraction | 进程 supervisor、端口选择、Dashboard 打开、Codex tool 包装 |
| Agent-Assisted Scan | scan plan、analysis task、result schema、coverage、retry、resume | Codex Agent 执行分析、本地 AI/Agent 执行分析 |
| Candidate Intake | 候选知识 schema、证据、SourceRef、readiness、去重 | Codex Agent 生成候选、本地 AI 生成候选、Dashboard 审核 |
| Delivery / Injection | 知识压缩、通用 context payload | Codex Skill 文案、Cursor/VS Code 文件投递、CLI 输出格式 |
| Preflight | 项目可信度、初始化状态、知识状态 | Codex 错误文案、CLI repair 命令、Dashboard 引导 |
| Guard | 检查引擎、规则模型、报告结构 | MCP tool schema、CLI 参数解析、UI 展示 |

## 目标目录结构

建议 `AlembicCore/src` 最终逐步扩展为：

```text
src
├── runtime
├── workspace
├── domain
├── config
├── storage
├── repository
├── discovery
├── analysis
├── scan
├── knowledge
├── search
├── guard
├── context
├── workflows
├── jobs
├── preflight
├── events
└── index.ts
```

`src/index.ts` 只导出稳定 API。内部实现可以用二级入口控制暴露面，例如：

```ts
export { createAlembicRuntime } from "./runtime/index.js";
export { resolveAlembicWorkspace } from "./workspace/index.js";
export { checkGuard } from "./guard/index.js";
export { searchKnowledge } from "./search/index.js";
export { runBootstrap, runRescan } from "./workflows/index.js";
```

如果某些实现还未稳定，可以先导出类型和工厂，不导出内部类。

当前边界加固：

- `@alembic/core` 的 `package.json` 只暴露根入口 `.`。
- `scripts/check-boundaries.mjs` 会检查 root-only package exports、`src/index.ts` 的 public aggregator allowlist、以及 `dist/` 未被 git 跟踪。
- 外层仓库必须从 `@alembic/core` 根入口导入，禁止 deep import `@alembic/core/dist/*`、`@alembic/core/src/*` 或 submodule 内部相对路径。
- `MIGRATION_CHECKLIST.md` 已作为后续阶段外层接入和删除窗口的固定检查清单。

## 能力拆解顺序

### 第 0 层：Core 包与运行时契约

当前状态：已开始。

目标：

- 保持 `@alembic/core` 可被两个外层仓库通过 submodule + file dependency 使用。
- 建立 Core 的 package、tsconfig、exports、README、基础 runtime 契约。
- 为后续能力迁移建立固定 API 入口。

已完成内容：

- `src/folder-names.ts`
- `src/runtime.ts`
- `src/index.ts`

下一步补齐：

- `src/runtime/index.ts` 目录化。
- `src/errors.ts` 或 `src/errors/index.ts`，定义结构化错误基类。
- `src/types.ts` 或按领域分布类型，避免所有类型堆到根目录。

验收：

- `npm run build:check`
- `npm run build`
- `Alembic` 和 `AlembicPlugin` 可通过 `@alembic/core` 导入当前公开 API。

### 第 1 层：Workspace 与路径系统

优先级：最高。

迁移来源：

- `Alembic/lib/shared/WorkspaceResolver.ts`
- `Alembic/lib/shared/resolveProjectRoot.ts`
- `Alembic/lib/shared/ProjectRegistry.ts`
- `Alembic/lib/shared/ProjectMarkers.ts`
- `Alembic/lib/shared/PathGuard.ts`
- `Alembic/lib/shared/folder-names.ts`
- `AlembicPlugin/lib/codex/ProjectRootResolver.ts` 中可通用的判断逻辑

Core 应包含：

- `resolveAlembicWorkspace(projectRoot, options)`
- Ghost / standard workspace 判定。
- dataRoot、runtimeDir、knowledgeDir、recipesDir、candidatesDir、skillsDir、wikiDir 解析。
- 项目目录可信度检查的基础结果结构。
- 项目注册表读写的通用实现。

Core 不包含：

- Codex 如何从环境变量、当前会话、tool 参数推导项目目录。
- CLI 默认 `.` 的交互策略。
- 安装 IDE 配置文件的逻辑。

验收：

- Core 单元测试覆盖 Ghost 与 standard 两种模式。
- `Alembic` 的 `setup --ghost --dir <project>` 使用 Core workspace resolver。
- `AlembicPlugin` 的 status/diagnostics 使用 Core workspace resolver，但仍保留 Codex 文案。

### 第 2 层：领域模型与校验

优先级：最高。

迁移来源：

- `lib/domain/knowledge/**`
- `lib/domain/dimension/**`
- `lib/domain/evolution/**`
- `lib/domain/snippet/**`
- `lib/shared/recipe-tokens.ts`
- `lib/shared/markdown-utils.ts`
- `lib/shared/similarity.ts`

Core 应包含：

- KnowledgeEntry / Recipe / Candidate 的稳定模型。
- Lifecycle、readiness、SourceRef、FieldSpec、StyleGuide。
- UnifiedValidator、RecipeReadinessChecker。
- DimensionRegistry 与统一维度定义。
- Recipe similarity 的纯领域算法。

Core 不包含：

- Dashboard 里的编辑体验。
- Codex Skill 里如何解释 Recipe。
- CLI 输出格式。

验收：

- Core 有领域模型 round-trip 测试。
- 两个外层仓库不再维护各自的领域模型副本。
- `Alembic` 与 `AlembicPlugin` 的 Recipe 校验结果完全一致。

### 第 3 层：配置、数据库与 Repository

优先级：高。

迁移来源：

- `lib/infrastructure/config/**`
- `lib/infrastructure/database/**`
- `lib/repository/base/**`
- `lib/repository/knowledge/**`
- `lib/repository/sourceref/**`
- `lib/repository/search/**`
- `lib/repository/guard/**`
- `lib/repository/bootstrap/**`
- `lib/repository/token/**`
- `lib/shared/WorkspaceSettingsStore.ts`

Core 应包含：

- 数据库连接和 migration contract。
- KnowledgeFileStore、KnowledgeRepository、KnowledgeUnitOfWork。
- SourceRef repository。
- Guard violation repository。
- TokenUsageStore。
- ConfigLoader 中通用配置读取和默认值。

Core 不包含：

- Dashboard API route。
- CLI 配置命令。
- Codex plugin install 配置。

验收：

- Core 可以在 fixture workspace 中初始化数据库。
- Core repository 测试覆盖 knowledge write/read/search metadata。
- 外层仓库只通过 Core repository 或 Core service 访问知识数据。

### 第 4 层：项目发现、语言识别与 AST 分析

优先级：高。

当前状态：已完成第一版 Core extraction。

已进入 Core：

- `src/shared/language-service.ts`
- `src/discovery/**`
- `src/analysis/**`
- `discoverProject`
- `detectProject`
- `analyzeSymbols`
- `buildSymbolTable`
- `buildCallGraph`
- `buildProjectGraph`
- `createSyntaxParserRegistry`
- `buildProjectSnapshot`

迁移来源：

- `lib/core/discovery/**`
- `lib/core/ast/**`
- `lib/core/analysis/**`
- `lib/core/AstAnalyzer.ts`
- `lib/shared/LanguageProfiles.ts`
- `lib/shared/LanguageService.ts`
- `lib/types/ast.d.ts`
- `lib/types/project-snapshot*.ts`
- `resources/grammars` 的使用契约

Core 应包含：

- ProjectDiscoverer 与语言 discoverer。
- tree-sitter parser 初始化和 grammar contract。
- ProjectGraph、CallGraphAnalyzer、SymbolTableBuilder。
- ImportPathResolver、CallSiteExtractor、DataFlowInferrer。
- 项目结构 snapshot 的纯数据模型。

当前 Core 边界：

- `discoverProject` 已覆盖 Node/SPM/Xcode/Python/JVM/Go/Rust/Dart/.NET/Ruby/Generic marker 检测、target 拆分、source file 收集和语言画像。
- `analyzeSymbols` 已覆盖 TS/JS、Swift、Python、Java/Kotlin、Go、Rust、Dart、ObjC 的基础符号、import/export、call site 提取。
- `createSyntaxParserRegistry` 已定义 tree-sitter/grammar adapter contract，但 grammar 二进制和资源加载策略暂由外层继续维护。
- 外层 tree-sitter walker 接入 adapter 前，旧 `AstAnalyzer.ts` 和 `lib/core/ast/**` 暂不删除。

Core 不包含：

- 插件打包 grammar 到 runtime.tgz 的发布脚本。
- Dashboard 可视化。
- 宿主对扫描范围的 UI 配置。

验收：

- Core 对 TypeScript / Python / Swift / Rust 等代表性 fixture 有只读 discovery 测试。
- `Alembic` 冷启动和 `AlembicPlugin` 结构查询共用同一 discovery API。
- 外层 tree-sitter adapter smoke 通过后，再删除旧 AST walker 公共模型。

### 第 5 层：知识存储、检索与向量索引

优先级：高。

当前状态：第一版 Search/Vector Core 已完成，Core commit 为 `0fa0e7c Add search and vector core`。

迁移来源：

- `lib/service/knowledge/**`
- `lib/service/search/**`
- `lib/service/vector/**`
- `lib/infrastructure/vector/**`
- `lib/repository/search/**`
- `lib/types/knowledge-wire.ts`
- `lib/types/search-wire.ts`

Core 应包含：

- Knowledge graph、knowledge unit、source ref link。
- SearchEngine / SearchService 的核心算法。
- VectorStore、chunker、embedding record storage、索引读写契约。
- 索引构建、迁移、重建、降级策略。

已进入 Core：

- `searchKnowledge(query, options)`：支持 entries/repository/database 输入。
- `rebuildSearchIndex(options)`：支持 snapshot 构建和预生成 vector record 写入。
- `FieldWeightedScorer`、`BM25Scorer`、`HybridRetriever`。
- `CoarseRanker`、`MultiSignalRanker`。
- `queryKnowledgeGraph`：支持 entries/edges 或 SQLite `knowledge_edges` 只读查询。
- `JsonVectorStore`、`SqliteVectorStore`。
- SQLite `vector_index_records` migration。
- `chunkText` / `estimateTokens`。
- no-query-vector fallback：有 vector store 但没有 query vector 时，走 sparse search。

Core 不包含：

- Codex tool 的输出字段裁剪。
- CLI 表格展示。
- Dashboard 搜索页。
- embedding 生成、模型调用、第三方 provider transport。

验收：

- Core 提供 `searchKnowledge(query, options)` 和 `rebuildSearchIndex(options)`。
- 同一 fixture 在 `Alembic` 和 `AlembicPlugin` 中搜索结果排序一致。
- 无 embedding 数据时必须有明确降级路径；embedding 数据由外层或既有索引流程提供，Core 不调用模型生成。

### 第 5.5 层：宿主 Agent 辅助扫描链路

优先级：高。

当前状态：已完成第一版 Core contract 与 workflow 包装。

已进入 Core：

- `src/scan/**`
- `src/workflows/bootstrap/**`
- `src/workflows/rescan/**`
- `src/workflows/shared/**`
- `createScanPlan`
- `getNextAnalysisTask`
- `submitAnalysisResult`
- `runBootstrap`
- `runRescan`
- `submitBootstrapAnalysisResult`
- `submitRescanAnalysisResult`
- `saveDimensionCheckpoint`
- `loadDimensionCheckpoints`

迁移来源：

- `lib/workflows/cold-start/**` 中扫描计划、任务进度、覆盖率相关逻辑。
- `lib/workflows/knowledge-rescan/**` 中增量扫描和重试逻辑。
- `lib/service/bootstrap/**` 中任务切片和候选结果整理逻辑。
- `lib/codex/JobContext.ts` 中可通用的 job context 结构。
- `lib/types/workflows.ts` 中可通用的 workflow/task 类型。

Core 应包含：

- scan plan：根据项目结构、文件列表、语言、上次扫描状态决定分析范围。
- analysis task slicing：把扫描计划拆成宿主 Agent 可执行的任务。
- agent analysis request contract：定义每个任务需要宿主返回哪些结构化字段。
- analysis result contract：候选知识、SourceRef、evidence、coverage、diagnostics。
- scan session state machine：pending、running、succeeded、failed、retrying、cancelled。
- coverage/progress：记录哪些文件已覆盖、哪些失败、哪些需要重试。
- result intake：接收宿主 Agent 结果，进入 candidate 校验、去重、合并前置队列。

Core 不包含：

- Codex Agent prompt 和 MCP tool schema。
- 本地 AI provider 调用。
- Agent loop、tool calling 执行器。
- 面向用户的 CLI/Dashboard/Codex 文案。

验收：

- Core 提供 `createScanPlan`、`getNextAnalysisTask`、`submitAnalysisResult`。
- 同一 scan session 可以中断后通过状态恢复继续。
- `AlembicPlugin` 可以把 Core task 交给 Codex Agent，再把结果按 Core contract 交回。
- `Alembic` 可以把本地 AI/Agent 结果按同一 contract 交回。

后续外层动作：

- 其他窗口把 `Alembic` / `AlembicPlugin` bootstrap、rescan wrapper 接到 Core workflow。
- 外层只保留宿主执行器、prompt/Agent 策略、UI/CLI/Codex 适配。

### 第 6 层：Guard 检查引擎

优先级：高。

当前状态：第一版 Guard Engine Core 已完成，Core commit 为 `63ecf4f Add guard engine core`。

迁移来源：

- `lib/service/guard/**`
- `lib/repository/guard/**`
- `lib/types/guard.d.ts`
- `lib/shared/diff-parser.ts`
- `lib/shared/content-hash.ts`

Core 应包含：

- GuardCheckEngine。
- GuardService 的核心检查路径。
- SourceFileCollector、GuardCodeChecks、GuardCrossFileChecks。
- ComplianceReporter 的数据层和报告模型。
- ExclusionManager、RuleLearner、feedback loop 中不依赖宿主的部分。

已进入 Core：

- `checkGuard(runtime, target, options)`。
- `GuardCheckEngine`、`BUILT_IN_GUARD_RULES`。
- `collectGuardSourceFiles` / `collectGuardSourceFilesWithContent`。
- `runCodeLevelChecks`、`runCrossFileChecks`。
- `createGuardReport`、quality gate、top violations、file hotspots。
- 从 `knowledgeEntries` 或 `database` 读取 `constraints.guards[]` 的规则 intake。
- `computeContentHash`。
- `parseDiffHunks` / `tokenizeDiffLines`。
- Guard violation 持久化复用 `createGuardViolationRepository`。

尚未进入 Core：

- AST tree-sitter runtime；Core 当前保留 AST rule contract，外层 adapter 接好前记录 uncertain result。
- SignalBus realtime metrics。
- RuleLearner / feedback loop 的宿主交互策略。
- CLI / Codex / Dashboard 的输出和交互。

Core 不包含：

- Codex `alembic_guard` MCP schema。
- CLI 参数和 exit code 策略。
- Dashboard 报告页面。

验收：

- Core 提供 `checkGuard(runtime, target, options)`。
- Guard fixture 测试覆盖无 Recipe、有 Recipe、跨文件、排除规则。
- 外层仓库只包装参数和输出，不复制检查逻辑。

### 第 7 层：Bootstrap、Rescan 与 Candidate 流水线

优先级：中高。

当前状态：部分完成。Bootstrap/rescan 的可恢复 workflow、宿主结果 intake、checkpoint 已进入 Core；candidate readiness、source attribution 和去重前置已在 Phase 4/6 进入 Core。尚未完成的部分是更深的 consolidation、snapshot、job/event、Discovery/AST 驱动的增量计划。

迁移来源：

- `lib/service/bootstrap/**`
- `lib/service/candidate/**`
- `lib/workflows/cold-start/**`
- `lib/workflows/knowledge-rescan/**`
- `lib/workflows/shared/**`
- `lib/repository/bootstrap/**`
- `lib/cli/AiScanService.ts` 中与 AI 调用无关的 candidate intake、证据整理、去重和落库部分

Core 应包含：

- runBootstrap。
- runRescan。
- CandidateAggregator。
- BootstrapDedup。
- BootstrapTaskManager 的核心任务状态，不含 UI startup。
- candidate readiness、source attribution、consolidation 输入输出。

Core 不包含：

- CLI 命令 `alembic coldstart` 的交互提示。
- Codex 主 Agent 如何生成候选知识的策略。
- 本地版如何调用外部 AI 生成候选知识的实现。
- Dashboard 审核按钮和任务页面。

验收：

- Core 可以对 fixture 项目跑只读 dry-run，整理结构化候选知识输入并完成校验、去重、落库前检查。
- `Alembic` 的 coldstart 调用 Core。
- `AlembicPlugin` 的 bootstrap/rescan job wrapper 调用 Core，默认策略仍由 Codex 层决定。

### 第 8 层：Job、事件与可恢复任务

优先级：中。

当前状态：第一版 Jobs/Events Core 已完成，Core commit 为 `3bf551c Add jobs and events core`。

迁移来源：

- `lib/daemon/JobStore.ts`
- `lib/daemon/DaemonJobRunner.ts` 中不涉及进程 supervisor 的部分
- `lib/infrastructure/event/EventBus.ts`
- `lib/infrastructure/signal/**`
- `lib/service/task/**`
- `lib/types/workflows.ts`

Core 应包含：

- JobStore。
- Job status、progress、recoverable state 的数据模型。
- Bootstrap / rescan / guard / search 等任务的统一 job contract。
- EventBus 的纯运行时实现。

已进入 Core：

- `createJobStore(database, context)`。
- `recoverJob(store, id)`。
- `appendJobEvent(store, jobId, input)`。
- SQLite `core_jobs`、`core_job_events`、`signal_trace` migration。
- `EventBus`：emit/emitAsync/history/stats。
- `SignalBus`：同步 signal emit/subscribe/send。
- `SignalBridge`：SignalBus 到 EventBus 的桥接。
- `SignalTraceStore`：信号 append/query/stats/aggregate。

Core 不包含：

- DaemonSupervisor 进程生命周期。
- 端口、PID 文件、Dashboard URL。
- Codex job tool 文案。
- 外层 workflow handler import 和后台执行策略。

验收：

- Core job store 支持创建、更新、恢复、取消。
- `Alembic` daemon 与 `AlembicPlugin` daemon wrapper 使用相同 job contract。

### 第 9 层：Host 边界契约

优先级：中。

迁移来源：

- `lib/codex/Preflight.ts` 中可通用的状态结构
- `lib/codex/KnowledgeState.ts` 中可通用的知识状态判断
- `lib/tools/core/**` 中不依赖 Codex/MCP 的输入输出结构
- `lib/types/knowledge-wire.ts`
- `lib/types/search-wire.ts`
- `lib/types/workflows.ts`

Core 应包含：

- 宿主无关的 candidate submission contract。
- evidence/source attribution contract。
- context request / context payload 的数据结构。
- tool result / workflow result 的纯数据结构。
- capability descriptor 的静态描述能力，不包含 tool calling 执行器。

Core 不包含：

- Codex 主 Agent prompt、tool schema、MCP handler。
- 本地 Agent loop。
- 外部 AI provider、模型调用、token usage accounting。
- CLI / Dashboard / Codex 的交互文案。

验收：

- Core 可以接收来自 Codex Agent 或本地 Alembic 的候选知识输入，并返回统一校验结果。
- `AlembicPlugin` 只包装 Codex tool schema，不在 Core 中引入 MCP SDK。
- `Alembic` 的本地 AI 生成结果通过同一 candidate submission contract 进入 Core。

### 第 10 层：注入、投递与压缩的通用部分

优先级：中低。

迁移来源：

- `lib/service/delivery/KnowledgeCompressor.ts`
- `lib/service/delivery/TokenBudget.ts` 中不绑定具体模型/provider 的预算和裁剪算法
- `lib/service/delivery/TopicClassifier.ts`
- `lib/injection/**` 中不依赖具体宿主的服务容器能力
- `lib/tools/core/**` 中通用输入输出 contract

Core 应包含：

- 知识压缩。
- context budget。
- 通用 context payload。
- tool/action 的静态描述和结果结构。

当前 Core 落地状态：

- 已新增 `src/context/**`，提供 `buildContextPayload`、`compressKnowledgeForContext`、`estimateContextBudget`、`TopicClassifier`、`KnowledgeCompressor`。
- 已覆盖 rule line、When/Do/Don't pattern、fact line、topic description、Channel A/B budget 和可选 total budget 裁剪。
- 已确认输出为宿主无关 payload；外层 adapter 决定如何写入 Codex Skill、Cursor rules、CLI 或 Dashboard。

Core 不包含：

- CursorDeliveryPipeline。
- Codex Skill 生成。
- VS Code/Cursor 文件投递。
- tool calling 执行器和 Agent 编排。
- 任何宿主专属配置写入。

验收：

- Core 可以生成宿主无关的 context payload。
- Codex、CLI、Dashboard 分别在外层把 payload 转成自己的展示或注入形式。

## 迁移执行策略

### 每轮迁移的标准步骤

1. 在 `AlembicCore` 中建立目标目录、类型和测试。
2. 从 `Alembic` 与 `AlembicPlugin` 中挑选共同实现，先复制到 Core 并消除宿主依赖。
3. 在 Core 中补测试，确保能力可以独立构建。
4. 在 `Alembic` 中切换 import 到 `@alembic/core`。
5. 在 `AlembicPlugin` 中切换 import 到 `@alembic/core`。
6. 删除两个外层仓库中被替代的重复实现。
7. 在两个外层仓库更新 `vendor/AlembicCore` submodule 指针并提交。

### 提交顺序

每轮建议至少三个提交：

1. `AlembicCore`: `Extract <capability> into core`
2. `Alembic`: `Use core <capability>`
3. `AlembicPlugin`: `Use core <capability>`

如果外层仓库还不能完全切换，可以先提交 adapter：

- `AlembicCore`: 增加新 API。
- `Alembic` / `AlembicPlugin`: 增加薄 adapter，但保留旧实现。
- 下一轮删除旧实现。

### 依赖处理

Core 依赖必须比外层少。新增依赖前先判断：

- 是否两个外层都需要。
- 是否会引入宿主 UI、CLI、HTTP server、插件 runtime 的方向性依赖。
- 是否可以通过 interface 注入，而不是 Core 直接依赖。

推荐 Core 可接受依赖：

- `zod` 或 `ajv` 中选一个作为 schema/validation 基础。
- `better-sqlite3` 与 `drizzle-orm`，如果数据库层确定进入 Core。
- `web-tree-sitter` 仅在 Core 直接拥有 grammar 加载与 tree-sitter runtime 时引入；当前 Phase 7 先用 adapter contract，暂不新增该依赖。

不推荐 Core 依赖：

- `commander`
- `express`
- `socket.io`
- `open`
- Codex MCP SDK
- Lark SDK
- OpenAI / Anthropic / Gemini / Ollama 等模型或 provider SDK。
- `undici` 等仅用于外部 AI transport 的 HTTP 依赖。
- Dashboard 前端依赖

## API 收敛目标

第一版稳定 API 可以围绕这些函数收敛：

```ts
createAlembicRuntime(options)
resolveAlembicWorkspace(projectRoot, options)
inspectAlembicWorkspace(runtime)
initializeAlembicWorkspace(runtime, options)
loadKnowledgeRepository(runtime)
searchKnowledge(query, options)
checkGuard(runtime, target, options)
runBootstrap(runtime, options)
runRescan(runtime, options)
submitKnowledgeCandidate(runtime, candidate, options)
createJobStore(database, context)
recoverJob(store, id)
validateHostContextPayload(payload)
```

这些 API 都应该返回结构化对象，而不是直接打印、退出进程或写宿主特定文件。

## 外层仓库最终形态

### `Alembic`

最终保留：

- `bin/cli.ts`
- `bin/api-server.ts`
- `bin/mcp-server.ts`
- `dashboard/**`
- 本地 daemon supervisor。
- CLI command handlers。
- 本地 AI 配置交互、provider 调用、prompt 编排和候选知识生成。
- 本地产品 README、release、smoke 脚本。

最终删除或瘦身：

- `lib/domain/**`
- `lib/core/**`
- `lib/repository/**`
- `lib/infrastructure/database/**`
- `lib/infrastructure/vector/**`
- `lib/service/guard/**`
- `lib/service/search/**`
- `lib/workflows/cold-start/**` 中核心逻辑

这些目录不一定一次删除，可以先变成 import/export adapter。

### `AlembicPlugin`

最终保留：

- `bin/codex-mcp.ts`
- `lib/codex/**`
- `channels/codex/**`
- `plugins/alembic-codex/**`
- Codex Skill、manifest、release/smoke/session simulation 脚本。
- 插件宿主 preflight 文案、tool policy、Codex Agent 协作策略。

最终删除或瘦身：

- 与 `Alembic` 重复的领域模型、repository、database、vector、Guard、workflow 实现。
- 插件 runtime 中完整镜像 Alembic 源码的发布方式。

插件仓库应该只拥有宿主适配和发布链路，不拥有第二份 Alembic 知识系统。

## 验收矩阵

| 阶段 | Core 验收 | Alembic 验收 | AlembicPlugin 验收 |
| --- | --- | --- | --- |
| Workspace | workspace unit tests | `alembic setup --ghost --dir <fixture>` | status/diagnostics/init 不猜项目目录 |
| Domain | Recipe validation tests | CLI guard/search 读同一模型 | Codex tools 读同一模型 |
| Storage | DB/repository tests | 本地知识库读写正常 | Ghost 数据目录读写正常 |
| Discovery | fixture discovery tests | coldstart 能识别项目结构 | structure tool 能识别项目结构 |
| Search | deterministic ranking tests | `alembic search` | `alembic_search` |
| Guard | guard fixture tests | `alembic guard` | `alembic_guard` |
| Bootstrap/Rescan | dry-run workflow tests | `alembic coldstart/rescan` | bootstrap/rescan job wrapper |
| Job | recoverable job tests | daemon job 恢复 | Codex job 恢复 |
| Host Contract | candidate/context contract tests | 本地 AI 产物按 contract 入库 | Codex Agent 产物按 contract 入库 |

## 风险与处理

1. Core 抽成空接口。
   - 处理：每轮迁移必须带真实实现和测试，不能只写 interface。

2. 外层仓库临时双实现长期存在。
   - 处理：每轮迁移都要列出待删除旧路径，并在下一轮前清掉。

3. Core 引入宿主依赖。
   - 处理：Core 不依赖 CLI、MCP、Dashboard、Codex SDK、Lark SDK。宿主行为用 interface 或 options 注入。

4. `Alembic` 与 `AlembicPlugin` 的行为漂移。
   - 处理：对 workspace、domain、search、guard、bootstrap 使用同一 fixture 和同一 Core test contract。

5. submodule 指针忘记更新。
   - 处理：每次 Core 提交后，两个外层仓库必须有对应 submodule pointer commit，除非该能力尚未接入外层。

6. AI 或 Agent runtime 混入 Core 导致边界模糊。
   - 处理：Core 只接受结构化产物，不调用模型、不保存 provider 配置、不运行 Agent loop。Codex Agent 策略留在 `AlembicPlugin`，本地 AI 策略留在 `Alembic`。

## 近期执行建议

### Round 1：Workspace Foundation

目标：让 Core 真正拥有 workspace 解析和数据目录布局。

迁移：

- `folder-names` 已在 Core，继续迁 `WorkspaceResolver`、`ProjectMarkers`、`PathGuard` 的通用部分。
- 新增 `src/workspace/**`。
- 新增 workspace fixture tests。

外层接入：

- `Alembic` 的 setup/ghost/status 使用 Core workspace。
- `AlembicPlugin` 的 Codex preflight 继续保留 Codex 输入策略，但底层 workspace inspection 使用 Core。

### Round 2：Domain Model

目标：Recipe / Knowledge 模型唯一化。

迁移：

- `lib/domain/knowledge/**`
- `lib/domain/dimension/**`
- `RecipeReadinessChecker`
- `UnifiedValidator`

外层接入：

- CLI、Codex tools、Dashboard API 都从 `@alembic/core` 获取模型和校验。

### Round 3：Storage Read Path

目标：先统一读路径，再统一写路径。

迁移：

- KnowledgeFileStore。
- KnowledgeRepository read methods。
- SourceRef read methods。

外层接入：

- search/status/diagnostics 先切到 Core read API。
- 写入仍可短期保留旧路径，等 Round 4 合并。

### Round 4：Guard Minimal Slice

目标：找一个高价值闭环验证 Core。

状态：Core 侧已完成第一版，外层接入仍待其他窗口执行。

迁移：

- Guard violation model。
- SourceFileCollector。
- GuardCheckEngine 的最小正向检查路径。

外层接入：

- `alembic guard` 和 Codex `alembic_guard` 同时调用 Core。

### Round 5：Search Minimal Slice

目标：统一知识检索和排序。

状态：Core 侧已完成第一版，外层接入仍待其他窗口执行。

迁移：

- SearchService / SearchEngine 的不含宿主输出部分。
- ranking、confidence、source attribution。

外层接入：

- CLI search 和 Codex search 输出可以不同，但底层结果一致。
- embedding 生成、CrossEncoder rerank、HNSW 性能索引暂时留在外层，通过 Core 的 vector store/search interface 接入。

## 完成定义

当以下条件成立时，可以认为 Core 第一阶段拆解完成：

- `AlembicCore` 不是接口壳，而是包含 workspace、domain、storage read path、guard minimal、search minimal 的真实实现。
- `Alembic` 与 `AlembicPlugin` 都通过 `@alembic/core` 使用上述能力。
- 两个外层仓库中对应重复实现已经删除或只剩 adapter。
- `npm run build`、`npm run test:unit` 在 Core 通过。
- 外层仓库的关键 smoke 通过：
  - `Alembic`: CLI setup/guard/search。
  - `AlembicPlugin`: status/diagnostics/init/guard/search。

第二阶段再继续抽 bootstrap/rescan、job、vector、discovery/AST 的完整能力；AI provider 和 Agent runtime 不进入 Core。
