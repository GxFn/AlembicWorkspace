# 扫描生命周期管线通盘落地方案

> 日期：2026-04-27  
> 定位：这不是实施日志，也不是每完成一步就追加一次的进度文档。它是基于当前代码实现重新校准后的整体落地方案，用来约束后续实现方向，核心改动是把当前膨胀的 cold-start / bootstrap 拆除成一条简单 baseline 管线，并把 run、evidence、job、recommendation 等横切能力迁回 scan lifecycle。

## 1. 重新校准：为什么要拆分

原始目标不是“把冷启动拆得更细”，而是把 Alembic 的知识生产和维护拆成四种生命周期：

- cold-start：建立基线。
- deep-mining：围绕已有基线反复补洞。
- incremental-correction：在文件变更后修正受影响知识。
- maintenance：低成本维持 source refs、索引、提案和健康信号。

拆分的根本原因是四类任务的成本、触发频率、输入范围、产出语义完全不同：

| 管线 | 触发频率 | 成本 | 主要目标 | 典型输入 | 典型输出 |
| --- | --- | --- | --- | --- | --- |
| cold-start | 低 | 高 | 建立 baseline | 全项目文件、维度定义 | baseline snapshot、候选知识、skills、关系、报告 |
| deep-mining | 中 | 中到高 | 多轮补洞 | baseline、模块/维度/主题/缺口 | 新候选、覆盖率增量、专题报告 |
| incremental-correction | 高 | 低到中 | 保持知识不过时 | file events、git diff、受影响 recipes | 修正提案、废弃建议、局部候选、影响报告 |
| maintenance | 很高或定时 | 低 | 维护健康状态 | TTL、source refs、proposal queue、index 状态 | sourceRef 修复、index 刷新、decay/enhancement 信号、推荐扫描 |

如果继续围绕 cold-start 增加逻辑，会得到一个更复杂的 bootstrap，而不是四条生命周期管线。正确的拆分逻辑是：

```text
触发入口 -> 规划 -> 证据组装 -> 模式执行 -> 副作用提交 -> run/evidence 持久化 -> 后续推荐
```

cold-start 只应是这个骨架上的一种简单执行模式：负责建立 baseline，不负责持久化框架、后台队列、增量策略、深挖策略或维护调度。

## 2. 当前代码事实

当前实现已经有四条管线的雏形，但边界不稳定。

### 2.1 已经成形的公共层

- `lib/workflows/scan/ScanTypes.ts` 定义了 `ScanMode`、`ScanPlan`、`KnowledgeEvidencePack` 以及四类 workflow 的输入输出。
- `lib/workflows/scan/ScanPlanService.ts` 已经能根据 intent、changeSet、baseline 和显式 mode 选择模式。
- `lib/workflows/scan/retrieval/KnowledgeRetrievalPipeline.ts` 已经把 `ChangeLens`、`KnowledgeLens`、`GraphLens`、`ProjectSnapshotLens`、`CodeEntityLens` 和 `EvidenceBudgeter` 编成 evidence pack。
- `lib/repository/scan/ScanRunRepository.ts` 和 `lib/repository/scan/ScanEvidencePackRepository.ts` 已经能保存 run 与 evidence。
- `lib/workflows/scan/ScanJobQueue.ts` 已经提供进程内 queued/running/cancelling/completed/failed/cancelled 生命周期。
- `lib/http/routes/scan.ts` 已经暴露 plan、retrieve、incremental-correction、deep-mining、maintenance、runs、evidence、jobs 路由。

这些东西应该成为主线，而不是继续依附在 bootstrap 里。

### 2.2 cold-start 当前状态

- `lib/external/mcp/handlers/bootstrap-internal.ts` 和 `bootstrap-external.ts` 仍然是主要入口。
- `lib/workflows/deprecated-cold-start/pipeline/BootstrapProjectAnalysisPipeline.ts` 已抽出 Phase 1-4 + `ProjectSnapshot` 构建，并能生成 `scanContext`。
- `lib/workflows/scan/lifecycle/ColdStartBaselinePipeline.ts` 已明确 simple baseline contract：ProjectAnalysis、DimensionExecution、BaselineProjection。
- `lib/workflows/scan/lifecycle/ScanLifecycleRunner.ts` 已负责 cold-start context、run/evidence 绑定和 baseline completion projection。
- `lib/workflows/deprecated-cold-start/BootstrapWorkflow.ts` 已拆成薄执行节点，调用 `BootstrapDimensionSessionPipeline` 和 `BootstrapCompletionPipeline`，返回 execution result。

剩余问题：bootstrap handlers 仍保留清理、session、envelope 和兼容响应拼装；这些是入口适配，不应再继续吸收 run/evidence/job/recommendation 等 scan lifecycle 能力。

### 2.3 deep-mining 当前状态

- `lib/workflows/scan/workflows/DeepMiningWorkflow.ts` 已经能按 scope 调用 `KnowledgeRetrievalPipeline`。
- `runAgent: true` 时会走 `runScanAgentTask()`，并使用 `deep-scan` task/profile。
- `/api/v1/scan/deep-mining` 已经会创建 scan run，并保存 evidence pack。
- `ScanBaselineResolver` 已要求 deep-mining 挂到显式 baseline 或最新 cold-start baseline。
- `rescan-internal` 的 gap-fill 已作为 baseline-anchored deep-mining 进入 `ScanLifecycleRunner`，不再由 handler 直接调用 `fillDimensionsV3`。
- `rescan-external` 的 mission briefing 已绑定 deep-mining baseline/evidence/run summary；它生成外部 Agent 任务包，不伪装成服务端异步 fill。

缺口：deep-mining 还缺更明确的 coverage/gap 结果投影、多轮专题计划，以及对外部 Agent 完成结果的更细粒度 lifecycle 回写。

### 2.4 incremental-correction 当前状态

- `lib/workflows/scan/workflows/IncrementalCorrectionWorkflow.ts` 已经把 file events 转成 changeSet。
- 它先复用 `FileChangeDispatcher` 的确定性处理，再构造 evidence pack。
- 在 `runAgent` 显式开启或 `ReactiveEvolutionReport.suggestReview` 时复用 `evolution-audit`。
- `/api/v1/file-changes` 已经有 `scan.enabled: true` opt-in 路径。
- `/api/v1/scan/incremental-correction` 已经有同步和 async 路径。

缺口：触发策略仍然分散在 HTTP 参数里，没有 debounce/聚合策略；deterministic handler、scan workflow、evolution proposal 的职责边界还需要固化。

### 2.5 maintenance 当前状态

- `lib/workflows/scan/workflows/MaintenanceWorkflow.ts` 已聚合 sourceRef reconcile、rename repair、proposal executor、search index refresh、decay、enhancement、redundancy。
- 默认不跑 redundancy，符合低成本维护定位。
- 它会输出 recommendedRuns。
- `ScanRecommendationScheduler` 已把 recommendedRuns 持久化为 pending/queued/dismissed/executed recommendation 状态。

缺口：recommendation 到队列的自动策略还未固化；maintenance 没有自己的 evidence pack，也没有周期调度、TTL 策略和 run 去重。

## 3. 目标架构

目标不是再拆出更多 bootstrap 文件，而是建立一个所有模式共享的 scan lifecycle kernel：

```text
ScanRequestNormalizer
  -> ScanPlanService
  -> ScanRunTracker
  -> ScanEvidenceBuilder / KnowledgeRetrievalPipeline
  -> ModeWorkflow(cold-start | deep-mining | incremental-correction | maintenance)
  -> ScanResultProjector
  -> ScanRecommendationScheduler
```

### 3.1 公共阶段契约

所有管线都应该显式经过同一组阶段，只是每个阶段的实现强度不同。

| 阶段 | 名称 | 职责 | 不应该做 |
| --- | --- | --- | --- |
| S0 | Normalize | 统一 HTTP/MCP/CLI/IDE 输入，形成 `ScanLifecycleRequest` | 不访问数据库，不跑 Agent |
| S1 | Plan | 由 `ScanPlanService` 判断 mode/depth/scope/budget | 不创建候选知识，不写副作用 |
| S2 | Track | 创建/关联 `scan_runs`，处理 async/job/cancel/retry | 不知道具体业务 prompt |
| S3 | Evidence | 调用 `KnowledgeRetrievalPipeline` 或轻量维护证据构建 | 不调用 Agent，不提交 proposal |
| S4 | Execute | 按 mode 调用对应 workflow | 不重复做 run/evidence 持久化 |
| S5 | Project | 把 workflow 结果投影成统一 summary、recommendations、side effects | 不重新扫描项目 |
| S6 | Persist | 完成/失败/cancel run，保存 evidence pack 和结果摘要 | 不决定业务逻辑 |
| S7 | Recommend | 根据结果排队 deep-mining / incremental / maintenance 后续任务 | 不直接偷偷跑重 Agent |

后续所有实现都要问一句：这个代码属于哪一个阶段？如果回答是“bootstrap handler 里顺手做了”，通常就是跑偏。

### 3.2 共享类型建议

当前 `ScanTypes.ts` 已经有基础，但缺一个把四类请求统一起来的生命周期请求/结果层。

建议新增或演进为：

```ts
export interface ScanLifecycleRequest {
  projectRoot: string;
  source: 'http' | 'mcp-internal' | 'mcp-external' | 'cli' | 'ide' | 'scheduler';
  requestedMode?: ScanMode;
  intent?: ScanPlanRequest['intent'];
  scope?: ScanScope;
  changeSet?: ScanChangeSet;
  dimensions?: string[];
  files?: ScanFileEvidenceInput[];
  budget?: ScanBudget;
  execution?: {
    async?: boolean;
    runAgent?: boolean;
    maxAttempts?: number;
    allowSideEffects?: boolean;
  };
  baseline?: {
    snapshotId?: string;
    runId?: string;
  };
}

export interface ScanLifecycleResult {
  run: ScanRunRecord | null;
  plan: ScanPlan;
  evidencePack?: KnowledgeEvidencePack | null;
  result: unknown;
  recommendations: ScanRecommendation[];
}
```

这不是为了多一层抽象，而是为了让 HTTP route、bootstrap handler、file-changes route 不再各自实现一套 run tracking。

## 4. 四条管线的阶段设计

### 4.1 cold-start：完全拆除为简单 baseline 管线

定位：首次建库、强制 rebuild、没有可用 baseline 时建立完整知识基线。

这里的“拆除”不是删除冷启动能力，而是拆掉当前 bootstrap 作为事实总控的地位。cold-start 最终只保留一条简单线性管线：

```text
ProjectAnalysis -> BaselinePlan -> DimensionExecution -> BaselineProjection
```

除此之外的能力一律迁出：run tracking、evidence persistence、async job、recommendation、deep-mining gap 调度、incremental fallback 都不属于 cold-start。

阶段设计：

| 阶段 | cold-start 行为 | 当前代码 | 目标改造 |
| --- | --- | --- | --- |
| S0 Normalize | MCP/HTTP/CLI 参数归一化，识别 maxFiles、dimensions、skipGuard、terminal options | `bootstrap-internal.ts` / `bootstrap-external.ts` | handler 只转换为 `ScanLifecycleRequest`，不直接编排 cold-start |
| S1 Plan | `intent: bootstrap`，无 baseline 或 force 时选择 cold-start | `ScanPlanService` + `BootstrapProjectAnalysisPipeline` | `ScanPlanService` 只规划；`BootstrapProjectAnalysisPipeline` 不创建 run/evidence |
| S2 Track | 创建 cold-start run，记录 baseline intent | `BootstrapScanRunPersistence` | 删除 bootstrap 专属 tracker，改由共享 `ScanRunTracker` 负责 |
| S3 Evidence | Phase 1-4 文件/AST/依赖/Guard；需要 retrieval 时由 lifecycle 调用 | `runAllPhases()`、`KnowledgeRetrievalPipeline` | 项目分析保留，公共 retrieval 迁出 cold-start 入口 |
| S4 Execute | 分维度 Agent 生产候选和 skills | `BootstrapDimensionSessionPipeline` | 保留为 `ColdStartDimensionExecutor`，只接收输入并返回结果 |
| S5 Project | report、snapshot、semantic memory、delivery/wiki | `BootstrapCompletionPipeline` | 拆成 `BaselineResultProjector`，只产出 baseline result |
| S6 Persist | 保存 baseline snapshot id、run summary、evidence pack | `BootstrapCompletionPipeline` + persistence helper | 由共享 lifecycle 完成 run/evidence/snapshot 关联 |
| S7 Recommend | 输出后续 deep-mining gaps，不自动重跑 | 目前无 | 由共享 recommendation 阶段生成，cold-start 不调度 |

cold-start 后续实现原则：

- 不再新增 bootstrap 专属 scan persistence。
- 不再把 deep-mining、incremental、maintenance 的策略塞进 `BootstrapWorkflow`。
- 保留 Phase 1-4 和 dimension session，但它们只能作为 cold-start 简单管线的两个执行节点。
- 冷启动完成后必须产出一个可引用的 baseline anchor：`baselineSnapshotId`、`baselineRunId`、coverage summary。

### 4.2 deep-mining：围绕 baseline 多轮补洞

定位：大项目不可能一次 cold-start 就完整覆盖。deep-mining 是在已有 baseline 上，对模块、维度、主题、缺口反复做高质量补洞。

阶段设计：

| 阶段 | deep-mining 行为 | 当前代码 | 目标改造 |
| --- | --- | --- | --- |
| S0 Normalize | 接收 modules/dimensions/query/files/maxNewCandidates/runAgent | `/api/v1/scan/deep-mining` | 支持从 maintenance recommendations 或 cold-start gaps 生成请求 |
| S1 Plan | `intent: deep-mining`，depth 默认 deep，可 exhaustive | `ScanPlanService` | 加入 baseline requirement：没有 baseline 时返回 cold-start fallback |
| S2 Track | 创建 deep-mining run，关联 `baselineSnapshotId` / `parentRunId` | `scan.ts trackScanRun` | 统一 `ScanRunTracker`，强制 baseline 关联 |
| S3 Evidence | retrieval 按 scope 裁剪 files/knowledge/graph/gaps | `DeepMiningWorkflow` | 增强 gap lens：按低覆盖维度、模块热点、stale refs 召回 |
| S4 Execute | 默认只检索；`runAgent: true` 时执行 `deep-scan` | `DeepMiningWorkflow` | Agent 输出进入候选提交/审核路径，不只是返回 projection |
| S5 Project | 生成专题报告、coverage delta、新候选摘要 | 目前弱 | 新增 `DeepMiningResultProjector` |
| S6 Persist | evidence pack、run summary、coverage delta、candidate refs | HTTP route 已保存 evidence | 增加 `scan_run_outputs` 或 summary schema，至少记录 produced candidate ids |
| S7 Recommend | 如果仍有 gaps，推荐下一轮 scoped deep-mining；否则推荐 maintenance | 目前无 | 由 `ScanRecommendationScheduler` 决定是否排队 |

最重要的落地点不是更多 prompt，而是 baseline 关联和 coverage delta：

```text
cold-start baseline
  -> deep-mining run 1: module=api, dimension=networking
  -> deep-mining run 2: module=auth, dimension=security
  -> deep-mining run 3: query="event flow"
```

每次 deep-mining 都不清空 baseline，只补充知识、关系和覆盖率。

### 4.3 incremental-correction：文件变更后的局部修正

定位：文件变了，知识库不应该重建；应该先用确定性路径快速修复，再在需要时进行局部语义审计。

阶段设计：

| 阶段 | incremental-correction 行为 | 当前代码 | 目标改造 |
| --- | --- | --- | --- |
| S0 Normalize | IDE/git/manual events 归一化为 changeSet | `file-changes.ts`、`scan.ts`、`eventsToChangeSet()` | 抽到 shared normalizer，去掉双份解析 |
| S1 Plan | 小变更 + impacted recipes -> incremental；大变更 -> deep-mining 或 cold-start fallback | `ScanPlanService.#planChangeSet()` | 结合 FileChangeDispatcher 的 impacted report，而不是只看请求参数 |
| S2 Track | 创建 incremental run，记录 changeSet 和 event source | `file-changes.ts`、`scan.ts` | 共用 `ScanRunTracker` |
| S3 Evidence | 先用 deterministic report，再 retrieval impacted recipes/source refs/graph | `IncrementalCorrectionWorkflow` | ChangeLens 需要消费 richer impact detail 和 sourceRef statuses |
| S4 Execute | 默认不跑 Agent；suggestReview 或显式 runAgent 时跑 `evolution-audit` | `IncrementalCorrectionWorkflow` | audit 输出应统一投影成 proposals/candidate updates |
| S5 Project | 生成 fixed/deprecated/skipped/needsReview、proposal ids、stale refs | 部分存在 | 新增 `IncrementalCorrectionResultProjector` |
| S6 Persist | evidence pack、run summary、proposal links | HTTP route 已保存 evidence | summary schema 固化，错误时保留 failed run 和 changeSet |
| S7 Recommend | 新文件或覆盖缺口 -> deep-mining；长期 stale -> maintenance | 目前弱 | 输出 recommendations，不在同步请求中偷偷执行 |

关键边界：

- `FileChangeDispatcher` / `FileChangeHandler` 是毫秒级确定性路径，必须先跑，且可以独立存在。
- `IncrementalCorrectionWorkflow` 是语义修正路径，只在需要时接管。
- 文件保存事件不应默认触发重 Agent。
- `/api/v1/file-changes` 应保持轻量，`scan.enabled` 或后台策略再触发 scan lifecycle。

### 4.4 maintenance：低成本健康维护与调度入口

定位：维护不是扫描代码。它负责让知识库“活着”：source refs 可用、proposal 不堆积、搜索索引新鲜、decay/enhancement/redundancy 信号可见。

阶段设计：

| 阶段 | maintenance 行为 | 当前代码 | 目标改造 |
| --- | --- | --- | --- |
| S0 Normalize | 接收 forceSourceRefReconcile、refreshSearchIndex、includeDecay 等低成本选项 | `/api/v1/scan/maintenance` | 增加 scheduled/manual 来源 |
| S1 Plan | `intent: maintenance`，depth 固定 light | `ScanPlanService` | 加 TTL / lastRun 去重策略 |
| S2 Track | 创建 maintenance run | `scan.ts trackScanRun` | 共用 `ScanRunTracker` |
| S3 Evidence | 默认不构造完整 evidence pack，只收集 health signals | `MaintenanceWorkflow` | 定义 `MaintenanceEvidence`，不要强行塞进 `KnowledgeEvidencePack` |
| S4 Execute | sourceRef reconcile、rename repair、proposal executor、index refresh、decay/enhancement；redundancy opt-in | `MaintenanceWorkflow` | 分成 health checks，允许局部失败汇总 warnings |
| S5 Project | 输出 health summary 和 recommendedRuns | `MaintenanceWorkflow` | 推荐项规范化为 `ScanRecommendation` |
| S6 Persist | run summary、health summary、recommendations | HTTP route 只保存 summary | 保存 recommendation 状态，避免重复推荐 |
| S7 Recommend | 按策略排队 incremental/deep-mining，而不是立即跑 | 目前只返回 recommendedRuns | 接入 queue/scheduler，但需要用户或策略确认 |

maintenance 是整个系统的“低成本调度器”。它应该告诉系统什么时候需要 incremental 或 deep-mining，但不应该自己变成深度扫描。

## 5. 严格执行表

这张表是执行口径，不是“下一步推进建议”。实现必须按顺序推进；未完成前置行时，不进入后续行。每一行都要以验收条件为准，不通过就不算完成。

| 序号 | 目标 | 必须改动 | 禁止改动 | 验收条件 |
| --- | --- | --- | --- | --- |
| E0 | 冻结 bootstrap 增长 | 暂停向 `lib/workflows/deprecated-cold-start/` 新增 scan lifecycle 能力 | 不新增 bootstrap 专属 tracker、scheduler、deep-mining、maintenance、incremental 策略 | 后续公共能力文件只出现在 `lib/workflows/scan/` 或 repository/shared 层 |
| E1 | 定义 simple cold-start 管线契约 | 新增 `ColdStartBaselinePipeline` 或等价契约：ProjectAnalysis、DimensionExecution、BaselineProjection 三段 | 不把 run/evidence/job/recommendation 放入该契约 | cold-start 输入输出只包含 baseline 所需数据和执行结果 |
| E2 | 抽出共享 run tracker | 新增 `lib/workflows/scan/lifecycle/ScanRunTracker.ts`，统一 create/complete/fail/cancel 和 evidence pack 保存 | 不再在 route 或 bootstrap helper 中手写 tracking | `scan.ts`、`file-changes.ts`、cold-start 都能调用同一个 tracker |
| E3 | 删除 bootstrap 专属 persistence | 用 `ScanRunTracker` 替代 `BootstrapScanRunPersistence`，或将其降级为薄 adapter 后删除 | 不保留两套 cold-start run 完成/失败逻辑 | cold-start run/evidence 由 scan lifecycle 管理，bootstrap 下无专属 persistence 主逻辑 |
| E4 | 抽出生命周期 runner | 新增 `ScanLifecycleRunner`，统一 Normalize、Plan、Track、Evidence、Execute、Project、Persist、Recommend | 不让 HTTP/MCP handler 直接编排 workflow 内部阶段 | route/handler 只提交 request，runner 返回 lifecycle result |
| E5 | 瘦身 bootstrap handlers | `bootstrap-internal.ts`、`bootstrap-external.ts` 只做参数解析、权限/清理兼容、envelope | 不在 handler 中拼接 scanContext、run summary、recommendation | handler 行为等价，但 orchestration 下沉到 scan lifecycle |
| E6 | 瘦身 `BootstrapProjectAnalysisPipeline` | 只保留 Phase 1-4 + `ProjectSnapshot`；scan plan/retrieval/persistence 全部迁出 | 不在该文件内调用 `ScanPlanService`、`KnowledgeRetrievalPipeline`、run repository | 该 pipeline 名副其实：只返回 phaseResults/snapshot |
| E7 | 瘦身 `BootstrapWorkflow` | 保留 dimension execution 调用，返回 cold-start execution result | 不处理 scanRunId，不 complete/fail run，不决定 evidence 保存 | `BootstrapWorkflow` 可被 simple cold-start pipeline 当作执行节点调用 |
| E8 | 建立 baseline projection | 将 snapshot id、coverage summary、candidate/skill summary 投影为 `ColdStartBaselineResult` | 不把 deep-mining 推荐直接执行 | cold-start 完成后有明确 baseline anchor：runId/snapshotId/coverage summary |
| E9 | 接入 deep-mining baseline | `DeepMiningRequest` / plan / run 增加 baselineRunId 或 baselineSnapshotId | 不允许 deep-mining 清库、重建 baseline 或依赖 bootstrap handler | 同一 baseline 可多次执行 deep-mining，并记录 parent baseline |
| E10 | 接入 incremental normalizer | 抽出 file event/changeSet normalizer，供 `/file-changes` 和 `/scan/incremental-correction` 共用 | 不让 file-changes 默认跑重 Agent | 两个入口生成一致 changeSet，默认仍轻量 |
| E11 | 接入 maintenance recommendations | 将 `recommendedRuns` 规范化并持久化为 recommendation 状态 | 不让 maintenance 直接执行重 Agent | maintenance 输出可追踪 pending/queued/dismissed/executed recommendations |
| E12 | 回归统一入口 | `/api/v1/scan/*`、`/api/v1/file-changes` opt-in、bootstrap MCP 全部经过 lifecycle runner | 不保留并行的旧编排路径 | 四条管线共享 run/evidence/job/recommendation 语义 |

执行表的核心是前八项：先把 cold-start 完全拆除为 simple baseline pipeline，再让另外三条管线接入同一生命周期。不能先继续补 cold-start 功能，也不能先写更多局部 adapter。

### 5.1 simple cold-start 最终形态

最终 cold-start 只允许长成下面这样：

```text
ColdStartBaselinePipeline
  1. analyzeProject()       -> ProjectSnapshot
  2. executeDimensions()    -> DimensionExecutionResult
  3. projectBaseline()      -> ColdStartBaselineResult
```

它不允许直接拥有：

- `scan_runs` 创建/完成/失败逻辑。
- `scan_evidence_packs` 保存逻辑。
- async job queue。
- deep-mining recommendation 调度。
- incremental fallback 策略。
- maintenance health check。

这些能力由 `ScanLifecycleRunner` 包在外层：

```text
ScanLifecycleRunner(cold-start)
  -> ScanRunTracker.create()
  -> KnowledgeRetrievalPipeline.retrieve()       可选，由 lifecycle 决定
  -> ColdStartBaselinePipeline.run()
  -> ScanResultProjector.projectColdStart()
  -> ScanRunTracker.complete()
  -> ScanRecommendationScheduler.planOnly()
```

这样 cold-start 是被调用的业务执行节点，而不是扫描系统的主框架。

## 6. 关键边界和禁止事项

为了避免再次跑偏，后续实现遵守这些规则：

- 不在 `BootstrapWorkflow` 里新增 deep-mining、incremental、maintenance 策略。
- 不在 handler 里复制 run tracking、evidence persistence、job queue 逻辑。
- 不把 maintenance 的 health signals 强行塞成完整 `KnowledgeEvidencePack`。
- 不让 `/api/v1/file-changes` 默认跑重 Agent。
- 不让 deep-mining 清库或重建 baseline。
- 不让 cold-start 成为“万能扫描入口”。
- 不再以“先接通 cold-start”为理由新增 bootstrap 目录代码。
- 不保留 bootstrap 专属 lifecycle 设施；已有临时设施必须迁出或删除。
- 新增能力如果能被两个以上模式复用，必须落在 `lib/workflows/scan/`。

## 7. 验收口径

整体拆分完成时，应满足以下判断：

- 看 `lib/workflows/scan/` 就能理解四条管线，而不是必须读 bootstrap handler。
- deep-mining 可以在同一 baseline 上多次运行，并记录每次补洞结果。
- incremental-correction 可以从 IDE/git/manual 事件进入同一管线，并保持默认轻量。
- maintenance 可以定期运行，输出 health summary 和可追踪 recommendations。
- cold-start 已拆除为 simple baseline pipeline，只负责 baseline 创建，不负责任何扫描模式的公共设施。
- run/evidence/job/recommendation 的持久化与查询在四条管线之间一致。

一句话验收：

```text
cold-start 建基线，deep-mining 补覆盖，incremental-correction 修变化，maintenance 管健康；公共 lifecycle 保证它们使用同一套规划、证据、运行记录和推荐机制。
```
