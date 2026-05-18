# 冷启动、深度扫描、增量修正与日常维护管线拆分方案

> 日期：2026-04-27  
> 目的：基于当前 Alembic 源码实现，设计一个可落地的扫描管线重构方案：把现有冷启动 workflow 拆成冷启动、深度挖掘扫描、增量修正扫描、日常维护扫描几类生命周期，同时抽取公共的知识检索/证据组装管线，为未来大项目多次深度挖掘和低成本维护打基础。

## 0. 实施进度

### 2026-04-27 第一轮落地

优先级纠偏：`ScanJobQueue` 属于扫描运行生命周期支撑，不是“管线拆分”的核心主线。真正的主线应优先压缩 `BootstrapWorkflow.fillDimensionsV3()` 的总控职责，把冷启动内部拆成可独立演进的阶段，再让 cold-start、deep-mining、incremental-correction、maintenance 共享计划与检索层。

已完成：

- 新增 `lib/workflows/scan/ScanTypes.ts`，定义 `ScanMode`、`ScanPlan`、`KnowledgeEvidencePack`、四类 workflow 的输入输出契约。
- 新增 `ScanPlanService`，集中处理 cold-start / deep-mining / incremental-correction / maintenance 的模式选择，并包装现有 `IncrementalBootstrap.evaluate()`。
- 新增 `KnowledgeRetrievalPipeline` 第一版，复用 `SearchEngine`、`KnowledgeRepository`、`RecipeSourceRefRepository`、`KnowledgeGraphService`，输出统一 evidence pack。
- 新增 `EvidenceBudgeter`，按 mode/depth 裁剪 files、knowledge、graph edges 和总字符预算。
- 新增 `ColdStartWorkflow` facade，仍调用现有 `fillDimensionsV3()`，避免破坏冷启动主链路。
- 新增 `IncrementalCorrectionWorkflow`，先走 `FileChangeDispatcher` 的确定性处理，再组装 evidence pack，并在显式或报告建议时复用 `evolution-audit`。
- 新增 `DeepMiningWorkflow`，默认只做 scoped evidence retrieval，`runAgent: true` 时复用 `runScanAgentTask()`。
- 新增 `MaintenanceWorkflow`，聚合 `SourceRefReconciler`、`ProposalExecutor`、`SearchEngine.refreshIndex()`、`DecayDetector`、`EnhancementSuggester`，默认不跑 `RedundancyAnalyzer`。
- 新增 `ScanOrchestrator` 和 `ScanModule`，把 scan 服务注册进 `ServiceContainer` 和 `ServiceMap`。
- 新增 `/api/v1/scan` 路由，提供 `plan`、`retrieve`、`incremental-correction`、`deep-mining`、`maintenance` 五个入口；其中增量修正和深度挖掘默认不触发重 Agent，必须显式 `runAgent: true`。
- 新增 `test/unit/ScanPipelines.test.ts` 和 `test/unit/ScanRoutes.test.ts`，覆盖规划、检索、维护 workflow 和 HTTP 路由委托。
- 新增 `scan_runs` 持久化：`009_scan_runs` migration、Drizzle schema、`ScanRunRepository`，记录 mode/depth/status/scope/changeSet/budget/summary/error/duration。
- `/api/v1/scan/incremental-correction`、`/api/v1/scan/deep-mining`、`/api/v1/scan/maintenance` 已自动创建并完成/失败 scan run；新增 `GET /api/v1/scan/runs` 和 `GET /api/v1/scan/runs/:id` 查询入口。
- 新增 `test/unit/ScanRunRepository.test.ts`，验证 run 创建、完成、失败、过滤和 latest 查询。
- 新增 `scan_evidence_packs` 持久化：`010_scan_evidence_packs` migration、Drizzle schema、`ScanEvidencePackRepository`，按 run 保存 evidence pack、summary、charCount、truncated。
- 增量修正和深度挖掘执行成功后会自动保存 evidence pack；新增 `GET /api/v1/scan/runs/:id/evidence` 查询入口。
- 新增 `test/unit/ScanEvidencePackRepository.test.ts`，验证 evidence pack 写入、查询和 truncated diagnostics。
- 将 `KnowledgeRetrievalPipeline` 内部职责拆成独立 lens：`ChangeLens`、`KnowledgeLens`、`GraphLens`、`ProjectSnapshotLens`，并新增 `RetrievalTypes` / `RetrievalUtils` 承载共享契约和投影工具。
- `KnowledgeRetrievalPipeline` 现在只负责编排变更、知识、图谱、项目证据与预算裁剪；新增 retrieval lens 边界测试，避免后续检索层继续膨胀。
- 新增 `CodeEntityLens`，复用已有 `CodeEntityGraph` 查询 code entities、继承/依赖/调用边，把 AST/entity/call/dependency 证据合并进 `KnowledgeEvidencePack.graph`。
- `ScanModule` 已把 DI 中的 `codeEntityGraph` 注入公共检索管线；该 lens 只读取已有图谱，不在 scan retrieval 阶段重新执行 AST 或依赖扫描。
- 新增独立 `deep-scan` Agent profile/task：使用专题深挖 produce prompt、更高分析预算，并由 `DeepMiningWorkflow` 在 `runAgent: true` 时显式调用。
- `/api/v1/file-changes` 新增可选 `scan.enabled: true` 触发路径：默认仍只做轻量同步分发；显式开启时复用已生成的 `ReactiveEvolutionReport` 运行 `IncrementalCorrectionWorkflow`，并写入 scan run/evidence pack。
- 新增 `ScanJobQueue` 进程内后台队列，支持 concurrency 控制、queued/running/cancelling/completed/failed/cancelled 生命周期、排队任务取消、自动重试、失败/取消后的手动重试和 `waitFor()` 测试/内部等待能力。
- `/api/v1/scan/incremental-correction`、`/api/v1/scan/deep-mining`、`/api/v1/scan/maintenance` 现在支持 `async: true` 提交后台 job，立即返回 `202 + job`；同步执行语义保持不变。
- 新增 `/api/v1/scan/jobs`、`/api/v1/scan/jobs/:id`、`/api/v1/scan/jobs/:id/cancel`、`/api/v1/scan/jobs/:id/retry`，让扫描生命周期从单次同步 HTTP 调用升级为可查询、可取消、可重试的任务模型。
- 冷启动核心管线开始实质拆分：新增 `BootstrapDimensionSessionPipeline`，把维度恢复、增量跳过、rescan 上下文、维度 Agent 输入构造、bootstrap-session 父任务执行、维度结果消费和 tier reflection 从 `fillDimensionsV3()` 中抽出。
- 新增 `BootstrapCompletionPipeline`，把 skill 生成、候选关系消费、Semantic Memory consolidation、report/snapshot 保存、file cache 清理和 delivery/wiki 消费从 `fillDimensionsV3()` 中抽出。
- `BootstrapWorkflow.fillDimensionsV3()` 现在收敛为薄编排器：解析输入与模式 → 校验/选择 AI 或 mock → 初始化 runtime → 执行维度会话管线 → 执行收尾消费管线。后续瘦身应继续沿这个阶段边界推进，而不是继续扩大单个 workflow 函数。
- 新增 `BootstrapProjectAnalysisPipeline`，把 Phase 1-4 的 `runAllPhases()` 与 `buildProjectSnapshot()` 收束成统一项目分析入口；`bootstrap-internal`、`bootstrap-external`、`rescan-internal`、`rescan-external` 不再各自构建 `ProjectSnapshot`。
- `BootstrapProjectAnalysisPipeline` 现在可生成 `scanContext`：复用 Phase 1-4 已算出的 `incrementalPlan` 构建 `ScanPlan`，并可调用 `KnowledgeRetrievalPipeline` 组装 cold-start evidence pack；`ScanPlanService` 支持 `precomputedIncrementalPlan`，避免 bootstrap 重复做增量评估。
- `PipelineFillView` 新增 `scanPlan` / `scanEvidencePack`，内部 bootstrap 维度会话会把公共检索证据投影进既有 `evidenceStarters`，让 Analyst prompt 能看到统一扫描层裁剪出的 files、knowledge、graph、gap 入口。
- 新增 `BootstrapScanRunPersistence`，cold-start 项目分析阶段会创建 `scan_runs` 记录并以 `cold-start` 类型保存 retrieval evidence pack；内部 bootstrap 异步填充完成/失败会更新 run 终态，外部 Mission Briefing 或 `skipAsyncFill` 路径会完成项目扫描 run。

当前仍未完成：

- `CodeEntityLens` 当前只消费已有 `CodeEntityGraph`；还没有为 scan 单独触发在线 AST/entity/call/dependency 重建或增量刷新。
- cold-start baseline run/evidence 已接入 `scan_runs` / `scan_evidence_packs`，但 baseline snapshot id 与后续 deep-mining parent baseline 的显式关联还没有落库。
- `ScanJobQueue` 当前是进程内队列；尚未做跨进程持久化恢复、分布式 worker 或基于 `AbortSignal` 的深层 workflow 中断传播。running job 的取消是 best-effort：会标记 cancelling，并在执行函数返回后把 job 终态置为 cancelled。
- `/api/v1/file-changes` 的增量扫描触发仍是请求级 opt-in；还没有后台策略自动按事件来源、影响级别或 debounce 窗口调度扫描。

## 1. 结论先行

这个拆分非常有意义，但正确的拆法不是把 `BootstrapWorkflow` 复制成多条 workflow，而是把当前混在一起的三个层次拆开：

```text
ScanOrchestrator          选择扫描模式、记录 run、处理取消/重试/报告
  -> ScanPlan             判断 full/deep/incremental/maintenance，计算范围与预算
    -> KnowledgeRetrievalPipeline  统一组装 evidence pack / knowledge pack / graph context
      -> Agent/Profile/Workflow    根据模式执行冷启动、深挖、修正或维护
```

推荐目标：

- `ColdStartWorkflow`：只负责首次建库或强制全量重建，建立 baseline。
- `DeepMiningWorkflow`：面向大项目的多次深度挖掘，不清空 baseline，按主题/维度/模块重复补洞。
- `IncrementalCorrectionWorkflow`：面向文件变更、git diff、用户手动 rescan 的语义修正扫描，主要处理受影响 Recipe 和局部新增 gap。
- `MaintenanceWorkflow`：面向日常低成本健康维护，主要跑 sourceRef、decay、proposal、search index、冗余/增强信号，默认不进入重 Agent。
- `KnowledgeRetrievalPipeline`：公共能力，不是业务 workflow。它负责把项目快照、变更 diff、已有知识、source refs、知识图谱、搜索结果、AST/entity/call/dependency 证据组装成有预算的 `KnowledgeEvidencePack`。

一句话：

```text
冷启动建立知识基线；深度扫描持续补洞；增量修正保持知识不过时；日常维护保持索引、引用和提案健康；公共检索层保证四者看到同一套证据事实。
```

## 2. 当前代码现状

### 2.1 冷启动已经承担了太多职责

当前主入口在 `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts` 的 `fillDimensionsV3()`。它实际承担：

- 识别 full / incremental：读取 `snapshot.incrementalPlan`。
- 初始化 runtime：`initializeBootstrapRuntime()` 创建 `DimensionContext`、`SessionStore`、`PersistentMemory`、`MemoryCoordinator`、`CodeEntityGraph`。
- 调度维度：`TierScheduler` + `bootstrap-session` profile + `AgentRunCoordinator`。
- 构造每个维度的 Agent 输入：`createBootstrapDimensionRuntimeInput()`。
- 跨维度上下文：`DimensionContext` 累积 completed dimension digest 和 submitted candidates。
- rescan 上下文：`prepareBootstrapRescanState()` 把 existing recipes、decaying recipes、occupied triggers 注入每个维度。
- 去重：`BootstrapDedup`、submittedTitles、submittedPatterns、submittedTriggers。
- 消费结果：candidate、skill、semantic memory、relation、tier reflection、report、snapshot、delivery/wiki。

这说明 `BootstrapWorkflow` 已经不只是“冷启动”。它现在是全量扫描、增量跳维度、rescan 上下文、候选消费、报告和投递的总编排器。

### 2.2 现有增量冷启动是维度级跳过，不是独立增量扫描

`lib/workflows/deprecated-cold-start/incremental/IncrementalBootstrap.ts` 和 `BootstrapSnapshot.ts` 已经有增量能力：

- `BootstrapSnapshot.save()` 保存 file hash、dimension stats、dimension-file mapping、episodic memory、changedFiles、affectedDims。
- `computeDiff()` 对比上一次 snapshot 和当前文件列表，得到 added/modified/deleted/unchanged。
- `inferAffectedDimensions()` 根据维度引用文件、文件类型、变更比例推断 affected dimensions。
- 变更超过 50% 时回退全量。
- 可恢复 `SessionStore`，让未变维度沿用历史结果。

但它仍然绑定在 bootstrap 语义里：

```text
IncrementalBootstrap.evaluate()
  -> incrementalPlan
    -> fillDimensionsV3()
      -> skip unaffected dimensions
      -> still uses bootstrap session/dimension profiles
```

所以当前的 incremental 更准确叫“增量冷启动重跑”，不是“语义修正扫描”。它解决的是少跑维度，不解决日常文件变更后的 targeted correction。

### 2.3 文件变更维护已经是轻量事件路径

`lib/service/evolution/FileChangeHandler.ts` 当前做得很清楚：

- `renamed`：根据 `RecipeSourceRefRepository.findBySourcePath()` 找到受影响 Recipe，调用 `ContentPatcher` 和 `rewriteRecipePaths()` 修复 sourceRefs / DB / markdown。
- `deleted`：标记 sourceRef stale；若 Recipe 没有其他 active refs，则通过 `EvolutionGateway.submit({ action: 'deprecate' })` 进入生命周期提案。
- `modified`：使用 `ContentImpactAnalyzer` 的 diff token x recipe token 影响评估，按 `direct` / `pattern` / `reference` 发出 quality signal，并在 pattern 级别创建 update proposal。
- `created`：当前跳过。

这是日常维护路径的好基础：毫秒级、无 Agent、事件驱动、可被 VSCode/HTTP/MCP 触发。

### 2.4 Evolution Agent 是系统级审计，不是文件事件 handler

`lib/agent/runs/evolution/EvolutionAgentRun.ts` 通过 `AgentService.run({ profile: { id: 'evolution-audit' } })` 执行 Agent 审计，输入是 recipes + projectOverview，输出通过 tool calls 计数：

- `propose_evolution`
- `confirm_deprecation`
- `skip_evolution`

它适合处理“需要语义判断”的修正，而不是每次文件保存都同步触发。

### 2.5 搜索和图谱已有基础，但没有形成公共 evidence pack

已有组件：

- `SearchEngine`：keyword / weighted / semantic / auto RRF，支持 context boost 和 multi-signal rank。
- `HybridRetriever`：Dense + Sparse RRF 融合。
- `KnowledgeGraphService`：关系查询、impact analysis、path、stats。
- `SourceRefReconciler`：从 reasoning.sources 填充 source refs，验证 active/stale，尝试 git rename 修复。
- `BootstrapPhaseRunner`：Phase 1-4 做文件收集、AST、Code Entity Graph、Panorama、Dependency、Guard、维度过滤。
- `MissionBriefingBuilder`：把 Phase 1-4 结果压缩成外部 Agent 可消费的 briefing。

缺口是：这些能力没有统一成一个“给任意扫描模式拿上下文”的检索/证据管线。现在冷启动、进化、搜索、sourceRef 维护各自拿各自的证据。

## 3. 目标管线分层

### 3.1 总体拓扑

```text
ScanOrchestrator
  ├── ColdStartWorkflow
  ├── DeepMiningWorkflow
  ├── IncrementalCorrectionWorkflow
  └── MaintenanceWorkflow

Shared services
  ├── ScanPlanService
  ├── KnowledgeRetrievalPipeline
  ├── ProjectSnapshotService
  ├── ChangeImpactService
  ├── EvidenceBudgeter
  └── ScanRunStore
```

### 3.2 模式定义

```ts
export type ScanMode =
  | 'cold-start'
  | 'deep-mining'
  | 'incremental-correction'
  | 'maintenance';

export type ScanDepth = 'light' | 'standard' | 'deep' | 'exhaustive';
```

四类模式不是按“是否全量读文件”区分，而是按生命周期目标区分：

| 模式 | 主要目标 | 输入 | 是否 Agent | 输出 |
| --- | --- | --- | --- | --- |
| cold-start | 建立 baseline | projectRoot + dimensions | 是，重 | snapshot、candidates、skills、relations、report |
| deep-mining | 多次补洞和专题深挖 | scope/module/dimension/topic | 是，重但定向 | 新候选、关系、coverage 增量、专题报告 |
| incremental-correction | 文件变更后的语义修正 | changeSet / git diff / impacted recipes | 是，轻到中 | update/deprecate proposals、局部新候选、impact report |
| maintenance | 日常健康维护 | time window / signal / TTL | 默认否，必要时轻 Agent | sourceRef 修复、decay/enhancement signals、proposal 执行、index refresh |

## 4. 公共知识检索管线设计

### 4.1 设计原则

`KnowledgeRetrievalPipeline` 不负责“跑什么扫描”，只负责“为扫描拿什么证据”。它必须满足：

- 可被 cold-start、deep-mining、incremental-correction、maintenance 复用。
- 输入是意图、范围、预算和变更；输出是结构化、可裁剪、可追踪的 evidence pack。
- 不直接写 DB；最多记录 retrieval diagnostics。
- 不调用 Agent；Agent 调用由上层 workflow/profile 决定。
- 不替代 `SearchEngine`、`KnowledgeGraphService`、`BootstrapSnapshot`，而是编排它们。

### 4.2 建议位置

新增目录：

```text
lib/workflows/scan/
  ScanOrchestrator.ts
  ScanPlanService.ts
  ScanTypes.ts
  retrieval/
    KnowledgeRetrievalPipeline.ts
    EvidenceBudgeter.ts
    ProjectSnapshotLens.ts
    KnowledgeLens.ts
    ChangeLens.ts
    GraphLens.ts
  workflows/
    ColdStartWorkflow.ts
    DeepMiningWorkflow.ts
    IncrementalCorrectionWorkflow.ts
    MaintenanceWorkflow.ts
```

第一阶段可以不移动现有文件，只新增 facade，内部仍调用 `BootstrapWorkflow`、`FileChangeHandler`、`EvolutionAgentRun`。

### 4.3 输入契约

```ts
export interface KnowledgeRetrievalInput {
  projectRoot: string;
  mode: ScanMode;
  intent:
    | 'build-baseline'
    | 'fill-coverage-gap'
    | 'repair-stale-knowledge'
    | 'audit-impacted-recipes'
    | 'maintain-health';
  scope?: {
    dimensions?: string[];
    files?: string[];
    modules?: string[];
    symbols?: string[];
    recipeIds?: string[];
    query?: string;
  };
  changeSet?: {
    added: string[];
    modified: string[];
    deleted: string[];
    renamed?: Array<{ oldPath: string; newPath: string }>;
    source?: 'ide-edit' | 'git-head' | 'git-worktree' | 'manual';
  };
  budget?: {
    maxFiles?: number;
    maxFileChars?: number;
    maxKnowledgeItems?: number;
    maxGraphEdges?: number;
    maxTotalChars?: number;
  };
}
```

### 4.4 输出契约

```ts
export interface KnowledgeEvidencePack {
  project: {
    root: string;
    primaryLang: string;
    fileCount: number;
    modules: string[];
  };
  changes?: {
    files: string[];
    impactedDimensions: string[];
    impactedRecipeIds: string[];
    impactDetails: Array<{
      recipeId: string;
      file: string;
      level: 'direct' | 'pattern' | 'reference';
      matchedTokens: string[];
      score: number;
    }>;
  };
  files: Array<{
    relativePath: string;
    language?: string;
    role?: 'changed' | 'neighbor' | 'evidence' | 'entrypoint';
    excerpt?: string;
    content?: string;
    hash?: string;
  }>;
  knowledge: Array<{
    id: string;
    title: string;
    lifecycle: string;
    knowledgeType?: string;
    sourceRefs?: string[];
    reason?: 'source-ref' | 'search' | 'graph' | 'stale' | 'coverage-gap';
    score?: number;
  }>;
  graph: {
    entities: Array<{ id: string; name: string; kind: string; file?: string }>;
    edges: Array<{ from: string; to: string; relation: string }>;
  };
  gaps: Array<{
    dimension: string;
    reason: 'low-coverage' | 'new-module' | 'changed-hotspot' | 'decaying-knowledge';
    priority: 'low' | 'medium' | 'high';
  }>;
  diagnostics: {
    truncated: boolean;
    warnings: string[];
    retrievalMs: number;
  };
}
```

### 4.5 Lens 分工

| Lens | 复用现有实现 | 输出 |
| --- | --- | --- |
| `ProjectSnapshotLens` | `BootstrapPhaseRunner`、`BootstrapSnapshot`、`DimensionContext` | 文件 hash、AST summary、dependency/call graph、guard summary、dimension refs |
| `ChangeLens` | `ContentImpactAnalyzer`、`BootstrapSnapshot.computeDiff()`、`FileChangeEvent` | changed files、diff tokens、impact level、affected recipes/dimensions |
| `KnowledgeLens` | `SearchEngine`、`HybridRetriever`、`KnowledgeRepository`、`RecipeSourceRefRepository` | 相关知识、stale/decaying recipes、sourceRef 命中 |
| `GraphLens` | `KnowledgeGraphService`、`CodeEntityGraph` | 知识关系、代码实体邻居、impact analysis |
| `EvidenceBudgeter` | 新增 | 按 mode/depth 对 files/knowledge/graph 做预算裁剪 |

## 5. 四条 workflow 的落地设计

### 5.1 ColdStartWorkflow：首次建库和强制重建

目标：建立可信 baseline。它应该保留当前 `BootstrapWorkflow` 的重能力，但把职责变窄。

保留：

- Phase 1-4 全量项目快照。
- `bootstrap-session` 父 profile 和 `bootstrap-dimension` 子 profile。
- tiered concurrency。
- `BootstrapDedup`。
- candidate / skill / relation / semantic memory / report / snapshot / delivery consumer。

调整：

- `fillDimensionsV3()` 改为由 `ColdStartWorkflow.run(plan)` 调用。
- full/incremental 判断从 `BootstrapWorkflow` 上移到 `ScanPlanService`。
- `BootstrapWorkflow` 不再直接关心“这是增量还是全量”，只接收 active dimensions、skipped dimensions、restored state 和 evidence pack。
- rescan existing recipes 的投影由 `KnowledgeRetrievalPipeline` 产出，而不是 `prepareBootstrapRescanState()` 自己从原始 `existingRecipes` 拼。

第一阶段不需要大改：可以先新增 `ColdStartWorkflow` facade，内部仍调用现有 `fillDimensionsV3()`。

### 5.2 DeepMiningWorkflow：大项目多次深度挖掘扫描

目标：解决“大项目不可能一次冷启动挖完”的现实问题。它不是 full rebuild，也不是文件变更修正，而是有计划地补洞。

触发方式：

- 用户手动选择某个维度深挖。
- Dashboard 根据 coverage/gaps 推荐。
- 冷启动后自动生成后续深挖计划，但不立刻执行。
- 大项目按模块分批：如 `Packages/*`、`apps/*`、核心 service、dashboard 等。

输入：

```ts
interface DeepMiningRequest {
  projectRoot: string;
  dimensions?: string[];
  modules?: string[];
  query?: string;
  depth: 'deep' | 'exhaustive';
  maxNewCandidates?: number;
}
```

执行策略：

1. `KnowledgeRetrievalPipeline` 查当前 coverage：已有 recipes、decaying recipes、occupied triggers、sourceRefs、knowledge gaps。
2. 根据 scope 选择文件，不再把 `allFiles` 全塞给每个维度。
3. 复用 `bootstrap-dimension` pipeline 或新增 `deep-mining-dimension` profile。
4. `actionSpace` 仍以候选提交工具为核心，但必须带 existing knowledge pack，避免重复。
5. 每次 deep mining 生成独立 `scan_runs` 记录，并挂到 parent baseline snapshot。

与 cold-start 的区别：

- 不清空 snapshot 和 checkpoint。
- 不默认覆盖所有维度。
- 不要求每维度都产出；目标是补洞和强化证据。
- 更重视 sourceRefs、已有知识和知识图谱邻居。

### 5.3 IncrementalCorrectionWorkflow：简单进化修正扫描

目标：当文件发生变化时，只修正受影响知识，并补少量局部新增。

触发方式：

- `POST /api/v1/file-changes` 返回 `suggestReview=true`。
- VSCode 扩展选择“运行修正扫描”。
- Git HEAD / worktree diff 定时发现 pattern/direct impact。
- 用户手动指定 changed files。

执行流程：

```text
changeSet
  -> FileChangeHandler 先做确定性处理
    -> renamed/deleted 立即修复或提案
    -> modified 产生 impact signal/proposal
  -> KnowledgeRetrievalPipeline(mode='incremental-correction')
    -> impacted recipes + changed files + neighbor files + source refs + graph impact
  -> RelevanceAuditor / evolution-audit Agent
    -> propose_evolution / confirm_deprecation / skip_evolution
  -> optional local scan-extract for new/changed files
    -> submit new candidates only if coverage gap high
```

关键约束：

- 不同步阻塞文件保存路径；`FileChangeHandler` 保持轻量。
- Agent 修正必须异步 run，可由用户确认或后台队列触发。
- changed files 超过阈值或 changeRatio > 50% 时升级为 cold-start 或 deep-mining。
- 只传 impacted recipes，不让 Agent 审全库。
- 对 created files，只有命中新模块/高价值目录/低覆盖维度时才触发局部 `scan-extract`。

建议新增 profile：

```text
incremental-correction-audit
  basePreset: evolution
  strategy: pipeline 或 preset
  actionSpace: none
  输入: KnowledgeEvidencePack
  工具: propose_evolution / confirm_deprecation / skip_evolution
```

第一阶段可先复用 `evolution-audit`，只改变输入构造。

### 5.4 MaintenanceWorkflow：日常维护型扫描

目标：低成本、可频繁运行，保证知识库健康。默认不调用大模型。

触发方式：

- API server 启动后。
- Dashboard 打开时。
- 定时任务。
- SignalBus debounce。
- 用户手动“维护检查”。

执行内容：

1. `SourceRefReconciler.reconcile({ force: false })`：24h TTL 内跳过，发现 stale source refs 发 signal。
2. `SourceRefReconciler.repairRenames()`：尝试 git rename 修复。
3. `SearchEngine.refreshIndex()`：响应 knowledge changed 或定期重建。
4. `ProposalExecutor.checkAndExecute()`：清理 expired pending，兜底评估 observing proposal。
5. `DecayDetector.scanAll()` 只作为 signal/score source，不直接创建 proposal。
6. `EnhancementSuggester.analyzeAll()` 生成增强建议。
7. `RedundancyAnalyzer.analyzeAll()` 默认禁用，只在小库或手动诊断时开启。

维护扫描的输出应该是 health report，而不是候选：

```ts
interface MaintenanceReport {
  sourceRefs: ReconcileReport;
  repairedRenames: RepairReport;
  proposals: ProposalExecutionResult;
  decaySignals: number;
  enhancementSuggestions: number;
  indexRefreshed: boolean;
  recommendedRuns: Array<{
    mode: 'incremental-correction' | 'deep-mining';
    reason: string;
    scope: Record<string, unknown>;
  }>;
}
```

## 6. ScanPlanService：把“何时跑哪条管线”集中化

当前判断散在多个地方：`IncrementalBootstrap.evaluate()`、`BootstrapSnapshot.inferAffectedDimensions()`、`FileChangeHandler.suggestReview`、旧文档里的 rescan 策略。建议新增 `ScanPlanService`：

```ts
interface ScanPlan {
  mode: ScanMode;
  depth: ScanDepth;
  reason: string;
  activeDimensions: string[];
  skippedDimensions: string[];
  scope: {
    files?: string[];
    modules?: string[];
    recipeIds?: string[];
  };
  fallback?: 'cold-start' | 'deep-mining' | null;
  budgets: {
    maxFiles: number;
    maxAgentIterations: number;
    maxEvidenceChars: number;
  };
}
```

规划规则：

| 条件 | 推荐 mode |
| --- | --- |
| 无历史 snapshot | cold-start |
| 用户强制 rebuild | cold-start |
| changeRatio > 50% | cold-start 或 deep-mining |
| changed files 命中已有 sourceRefs 且数量小 | incremental-correction |
| 新增模块/目录且相关维度 coverage 低 | deep-mining |
| sourceRef TTL 到期、proposal observing、search index 过期 | maintenance |
| 用户指定 dimension/topic/module 深挖 | deep-mining |

这样 `IncrementalBootstrap.evaluate()` 可以逐步收敛为 `ScanPlanService.planFromSnapshotDiff()`，不再被 bootstrap 命名限制。

## 7. 数据模型建议

### 7.1 scan_runs

新增 run 级记录，用于支持大项目多次深挖和可追踪维护。

```text
scan_runs
  id
  project_root
  mode
  depth
  status
  parent_snapshot_id
  baseline_snapshot_id
  active_dimensions_json
  scope_json
  change_set_json
  started_at
  completed_at
  summary_json
```

### 7.2 scan_evidence_packs

可选。第一阶段可以只写 report，不持久化完整 pack。后续为了 debug Agent 输入，可保存摘要。

```text
scan_evidence_packs
  id
  run_id
  pack_kind
  pack_json
  char_count
  truncated
  created_at
```

### 7.3 coverage/gap 表或 report

不急于建表。先由 report 输出：

```ts
interface CoverageGap {
  dimension: string;
  module?: string;
  currentCount: number;
  targetCount: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}
```

## 8. 实施顺序

### P0：文档和边界确认

状态：已完成。

- 明确四类扫描模式的目标和非目标。
- 明确 `KnowledgeRetrievalPipeline` 只做证据组装，不调 Agent、不写库。
- 明确 cold-start/deep-mining/incremental/maintenance 的升级和回退规则。

### P1：新增类型和 facade，不改变行为

状态：已完成第一版。

新增：

```text
lib/workflows/scan/ScanTypes.ts
lib/workflows/scan/ScanPlanService.ts
lib/workflows/scan/retrieval/KnowledgeRetrievalPipeline.ts
lib/workflows/scan/workflows/ColdStartWorkflow.ts
```

行为：

- `ColdStartWorkflow.run()` 内部调用现有 `fillDimensionsV3()`。
- `ScanPlanService` 内部包装 `IncrementalBootstrap.evaluate()`。
- `KnowledgeRetrievalPipeline` 第一版只返回 existing recipes、sourceRefs、SearchEngine 结果和 snapshot diff，不接 Agent。

验证：

- 现有 bootstrap 测试不变。
- 新增 unit tests 验证 plan 规则和 evidence pack 裁剪。

### P2：把增量修正从 bootstrap 语义中独立出来

状态：已完成可调用第一版。

新增：

```text
lib/workflows/scan/workflows/IncrementalCorrectionWorkflow.ts
```

行为：

- 输入 `FileChangeEvent[]` 或 snapshot diff。
- 先调用 `FileChangeDispatcher` 或直接调用 `FileChangeHandler` 进行确定性处理。
- 再调用 `KnowledgeRetrievalPipeline` 取 impacted recipes。
- 复用 `runEvolutionAudit()` 执行语义修正。
- 只在有 created/new module gap 时调用 `runScanAgentTask()`。

验证：

- modified reference 级别不触发 Agent。
- modified pattern/direct 级别触发 impacted recipe audit。
- deleted/renamed 不进入 Agent 修正。

当前实现补充：`/api/v1/scan/incremental-correction` 默认 `runAgent=false`，只执行确定性处理和 evidence pack 组装；需要语义审计时必须显式传 `runAgent: true`。这保留了文件保存路径的低延迟边界。

### P3：深度挖掘扫描

状态：已完成检索优先第一版，尚未新增专用 profile。

新增：

```text
lib/workflows/scan/workflows/DeepMiningWorkflow.ts
lib/agent/profiles/definitions/deep-scan.profile.ts 或复用 bootstrap-dimension
```

行为：

- 按 dimensions/modules/query 组装 evidence pack。
- 使用 `bootstrap-dimension` pipeline 的阶段能力，但输入不再是 full `allFiles`，而是 scoped evidence。
- 产出 candidate + relation + coverage report。

验证：

- 同一 baseline 上可多次运行 deep mining。
- 已有 triggers/titles 进入 dedup。
- 不会清除 snapshot/checkpoints。

当前实现补充：`DeepMiningWorkflow` 默认只调用 `KnowledgeRetrievalPipeline`，`runAgent: true` 时复用现有 `scan-extract` profile。后续再根据效果决定是否新增 `deep-scan.profile.ts`。

### P4：日常维护工作流

状态：已完成第一版。

新增：

```text
lib/workflows/scan/workflows/MaintenanceWorkflow.ts
```

行为：

- 聚合 `SourceRefReconciler`、`ProposalExecutor`、`SearchEngine`、`EnhancementSuggester`。
- 只在明确配置或小库时跑 `RedundancyAnalyzer.analyzeAll()`。
- 输出 health report + recommended runs。

验证：

- 无 AI provider 时可运行。
- repeated run 幂等。
- 不创建重复 proposal。

当前实现补充：`MaintenanceWorkflow` 默认运行 sourceRef reconcile/rename repair、proposal check、search index refresh、decay/enhancement signal；`RedundancyAnalyzer` 默认关闭，只有显式 `includeRedundancy: true` 时执行。

### P5：逐步瘦身 BootstrapWorkflow

状态：未开始。

当上面 facade 稳定后，再把 `BootstrapWorkflow` 中与扫描模式无关的逻辑上移：

- incremental plan 计算上移到 `ScanPlanService`。
- existing recipes/rescan context 上移到 `KnowledgeRetrievalPipeline`。
- report/snapshot 写入由 `ScanOrchestrator` 统一记录。

## 9. 风险和约束

### 9.1 不要过早抽公共 workflow

四条管线共享的是 evidence retrieval，不是 orchestration。冷启动、增量修正、日常维护的失败模型完全不同：

- 冷启动失败：可按维度 retry 或 checkpoint restore。
- 增量修正失败：应保留 proposal/signal，不阻塞文件事件。
- 日常维护失败：应记录 health warning，下一轮重试。
- 深度挖掘失败：应保留 partial coverage，不影响 baseline。

所以公共层应该停在 `KnowledgeRetrievalPipeline` 和 `ScanPlanService`，不要抽一个大而全的 `BaseScanWorkflow`。

### 9.2 大项目必须预算先行

`MissionBriefingBuilder` 已有 100KB 硬上限和 S/M/L 压缩策略。新的 evidence pack 也必须有硬预算：

- maxTotalChars。
- maxFiles。
- maxKnowledgeItems。
- maxGraphEdges。
- per-file excerpt limit。

否则深度挖掘会比冷启动更容易爆 context。

### 9.3 增量修正不能变成隐藏全量扫描

`IncrementalCorrectionWorkflow` 的默认行为必须是局部：

- impacted recipe 数超过阈值时，升级为 deep-mining 或 cold-start，而不是继续塞给 evolution-audit。
- changed files 过多时，生成 `recommendedRuns`，交给用户或后台调度。
- pattern/direct impact 才进入 Agent，reference 默认只发 signal。

### 9.4 Maintenance 不应重新引入旧 Metabolism 的 O(n²) 成本

`metabolism-redesign.md` 已经指出 Redundancy/Contradiction 全量扫描不可持续。MaintenanceWorkflow 应以 TTL、signal、proposal 和索引健康为主，冗余/矛盾交给 deep-mining 或 Agent 审计处理。

## 10. 推荐的最终文件地图

```text
lib/workflows/scan/
  ScanTypes.ts
  ScanOrchestrator.ts
  ScanPlanService.ts
  retrieval/
    KnowledgeRetrievalPipeline.ts
    EvidenceBudgeter.ts
    ProjectSnapshotLens.ts          # 后续拆分
    KnowledgeLens.ts                # 后续拆分
    ChangeLens.ts                   # 后续拆分
    GraphLens.ts                    # 后续拆分
  workflows/
    ColdStartWorkflow.ts
    DeepMiningWorkflow.ts
    IncrementalCorrectionWorkflow.ts
    MaintenanceWorkflow.ts

lib/http/routes/
  scan.ts                           # 已新增，提供 plan/retrieve/correction/deep/maintenance 入口

lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts              # 保留，但逐步瘦身为 cold-start 执行细节
  incremental/BootstrapSnapshot.ts  # 可保留，作为 ProjectSnapshotService 的底层实现
  incremental/IncrementalBootstrap.ts # 后续改名或由 ScanPlanService 包装

lib/agent/profiles/definitions/
  bootstrap.profile.ts
  evolution.profile.ts
  scan.profile.ts
  deep-scan.profile.ts              # 可选，P3 再加
```

## 11. 判断这次重构是否成功

成功标准不是文件变少，而是以下能力成立：

1. 首次建库仍能走完整 cold-start，并产出 snapshot、candidate、skill、relation、report。
2. 同一个大项目可以在不清空 baseline 的情况下多次 deep-mining，补不同模块和维度。
3. 文件修改后，系统能只审受影响 Recipe，而不是把整个维度重跑一遍。
4. 日常维护可以在无 AI provider 或 AI 暂不可用时运行，并给出 health report。
5. 四条路径拿到的 existing knowledge、source refs、graph impact、search evidence 来自同一套 retrieval 语义。
6. 当变更范围过大时，系统清楚地升级到 deep-mining/cold-start，而不是在 incremental 路径里悄悄做全量。

## 12. 最小可落地版本

最小版本不需要一次性重构所有代码。建议先做：

1. 新增 `ScanTypes.ts` 和 `ScanPlanService.ts`，包装现有 `IncrementalBootstrap.evaluate()`。
2. 新增 `KnowledgeRetrievalPipeline` 第一版，只集成 `SearchEngine`、`RecipeSourceRefRepository`、`KnowledgeGraphService` 和 `BootstrapSnapshot`。
3. 新增 `IncrementalCorrectionWorkflow`，只处理 `pattern/direct modified` 的 impacted recipes，并复用 `runEvolutionAudit()`。
4. 新增 `MaintenanceWorkflow`，聚合 `SourceRefReconciler`、`ProposalExecutor`、`SearchEngine.refreshIndex()`。
5. 暂时不动 `fillDimensionsV3()` 主体，只让 `ColdStartWorkflow` facade 调它。

这样可以在不破坏现有冷启动的前提下，把未来的管线边界先立起来。等增量修正和维护路径稳定后，再把 `BootstrapWorkflow` 里和扫描规划、证据检索相关的逻辑抽出来。
