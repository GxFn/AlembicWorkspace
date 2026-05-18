# 四条扫描管线目录化重拆分实施方案

> 日期：2026-04-28  
> 定位：这是 `lib/workflows/` 下四条扫描生命周期管线的目录化重拆分方案。它承接 `scan-lifecycle-pipeline-holistic-plan.md`，但比原方案更严格：`lib/workflows/deprecated-cold-start/` 只允许作为迁移源，最终必须完全删除；四条业务管线必须分别落在 `cold-start`、`deep-mining`、`incremental-correction`、`maintenance` 目录下；共享生命周期能力保留在 `scan` kernel。

## 1. 总目标

当前代码已经把旧 `bootstrap` 重命名为 `deprecated-cold-start`，这一步只是在命名层面表明它不再是主架构。下一步不能继续在 `deprecated-cold-start` 上修修补补，而是要把它拆成四条清晰管线，并把旧目录删掉。

最终目录形态：

```text
lib/workflows/
  scan/                         # 共享 kernel：Normalize / Plan / Track / Evidence / Persist / Recommend
  cold-start/                   # 建 baseline，只负责冷启动业务执行
  deep-mining/                  # 基于 baseline 补覆盖
  incremental-correction/       # 文件变更后的局部修正
  maintenance/                  # 低成本健康维护和推荐
```

其中：

- `scan/` 不拥有具体业务扫描策略，只提供四条管线共用的生命周期骨架。
- `cold-start/` 不再继承旧 bootstrap 的“万能入口”地位，只建立 baseline。
- `deep-mining/` 不允许清库、重建 baseline 或依赖 cold-start handler。
- `incremental-correction/` 默认轻量，不允许文件保存事件直接触发重 Agent。
- `maintenance/` 是健康维护和推荐来源，不直接偷偷执行 deep-mining 或 incremental heavy work。
- `deprecated-cold-start/` 在迁移期间只能减少文件和引用，不能新增能力；完成后目录必须不存在。

## 2. 当前事实

当前实现大致分为两块：

```text
lib/workflows/scan/
  ScanTypes.ts
  ScanPlanService.ts
  ScanJobQueue.ts
  ScanOrchestrator.ts
  lifecycle/
  normalization/
  retrieval/
  workflows/

lib/workflows/deprecated-cold-start/
  BootstrapWorkflow.ts
  agent-runs/
  briefing/
  checkpoint/
  config/
  consumers/
  context/
  delivery/
  incremental/
  mock/
  phases/
  pipeline/
  projections/
  reports/
  session/
```

`scan/` 已经有共享 run/evidence/job/recommendation 的雏形，但仍混有具体模式执行类，例如 `scan/workflows/ColdStartWorkflow.ts`、`DeepMiningWorkflow.ts`、`IncrementalCorrectionWorkflow.ts`、`MaintenanceWorkflow.ts`。

`deprecated-cold-start/` 仍承载旧冷启动的大量实现：

- Phase 1-4 项目分析：`phases/BootstrapPhaseRunner.ts`、`pipeline/BootstrapProjectAnalysisPipeline.ts`。
- 维度执行：`BootstrapWorkflow.ts`、`pipeline/BootstrapDimensionSessionPipeline.ts`、`agent-runs/*`。
- baseline 完成副作用：`pipeline/BootstrapCompletionPipeline.ts`、`consumers/*`、`reports/*`、`delivery/*`、`projections/*`。
- 外部 Agent 会话：`session/*`、`briefing/*`、`checkpoint/*`。
- 冷启动配置：`config/*`。
- 增量 bootstrap 旧能力：`incremental/*`。

这些内容不能整体保留在一个“废弃冷启动”目录里。保留目录会让后续实现继续绕回旧结构，最终仍然需要读旧 bootstrap 才能理解 scan lifecycle。

## 3. 目标边界

### 3.1 `scan/` 共享 kernel

`scan/` 只保存跨模式共享设施。

目标职责：

- `ScanLifecycleRequest` / `ScanLifecycleResult`。
- `ScanRequestNormalizer`。
- `ScanPlanService`。
- `ScanLifecycleRunner` 或同等阶段机。
- `ScanRunTracker`。
- `KnowledgeRetrievalPipeline` 与通用 evidence lens。
- `ScanJobQueue`。
- `ScanRecommendationScheduler`。
- 通用 repository-facing summary/projector contract。

禁止职责：

- 不放 `ColdStartWorkflow`、`DeepMiningWorkflow`、`IncrementalCorrectionWorkflow`、`MaintenanceWorkflow` 这类业务执行类。
- 不放 cold-start 的 session、dimension text、checkpoint、delivery/wiki 细节。
- 不放 maintenance 的具体 health check 策略。
- 不放 incremental 的确定性 file-change dispatcher 包装逻辑。

### 3.2 `cold-start/`

`cold-start/` 只负责建立 baseline。

目标目录建议：

```text
lib/workflows/cold-start/
  ColdStartPipeline.ts
  ColdStartTypes.ts
  project-analysis/
    ColdStartProjectAnalysisPipeline.ts
    ColdStartPhaseRunner.ts
  dimension-execution/
    ColdStartDimensionExecutor.ts
    ColdStartDimensionRuntimeBuilder.ts
    ColdStartDimensionInputBuilder.ts
    ColdStartSessionExecutionBuilder.ts
    ColdStartSessionInputBuilder.ts
  baseline-projection/
    ColdStartBaselineProjector.ts
    ColdStartReportProjector.ts
    ColdStartSnapshotProjector.ts
  external-agent/
    ColdStartMissionBriefingBuilder.ts
    ColdStartSession.ts
    ColdStartCheckpointStore.ts
    ExternalSubmissionTracker.ts
  config/
    ColdStartDimensions.ts
    ColdStartTerminalToolset.ts
    TierScheduler.ts
  legacy-adapters/
    DeprecatedBootstrapResponseAdapter.ts
```

允许行为：

- 读取项目文件、AST、依赖、Guard、代码实体图，形成 `ProjectSnapshot`。
- 执行维度 Agent，生产候选知识、skills、baseline summary。
- 构造外部 Agent mission briefing 和维度完成会话。
- 输出 `ColdStartBaselineResult`。

禁止行为：

- 不创建或完成 `scan_runs`。
- 不保存 `scan_evidence_packs`。
- 不操作 `scan_recommendations`。
- 不决定 deep-mining、incremental、maintenance 的触发策略。
- 不保留 `Bootstrap*` 作为长期主命名。迁移期可以有 compatibility adapter，但最终业务类应使用 `ColdStart*` 命名。

### 3.3 `deep-mining/`

`deep-mining/` 只围绕既有 baseline 多轮补覆盖。

目标目录建议：

```text
lib/workflows/deep-mining/
  DeepMiningPipeline.ts
  DeepMiningTypes.ts
  DeepMiningPlanner.ts
  DeepMiningEvidencePolicy.ts
  DeepMiningAgentExecutor.ts
  DeepMiningResultProjector.ts
  DeepMiningRecommendationPolicy.ts
  external-agent/
    DeepMiningBriefingBuilder.ts
    DeepMiningCompletionRecorder.ts
```

允许行为：

- 强制解析 baseline anchor。
- 根据 module、dimension、query、gap 组织 evidence。
- 默认只检索；显式 `runAgent` 时执行 deep-scan。
- 生成 coverage delta、candidate refs、下一轮 deep-mining 或 maintenance 推荐。

禁止行为：

- 不清库。
- 不建立 baseline。
- 不调用 cold-start 的 phase runner 或 dimension fill 作为主执行路径。
- 不从 rescan handler 里直接做 deep-mining 编排。

### 3.4 `incremental-correction/`

`incremental-correction/` 只处理变更后的局部修正。

目标目录建议：

```text
lib/workflows/incremental-correction/
  IncrementalCorrectionPipeline.ts
  IncrementalCorrectionTypes.ts
  IncrementalChangeSetNormalizer.ts
  DeterministicRepairStage.ts
  ImpactEvidencePolicy.ts
  IncrementalAuditExecutor.ts
  IncrementalCorrectionResultProjector.ts
  IncrementalRecommendationPolicy.ts
```

允许行为：

- 从 IDE/git/manual/file-change HTTP 输入归一化 changeSet。
- 先执行确定性 `FileChangeDispatcher` 路径。
- 根据 impacted recipes、stale refs、changed files 组装 evidence。
- 只有 `runAgent: true` 或 deterministic report 建议 review 时才执行 semantic audit。
- 输出 fixed/deprecated/skipped/needsReview、proposal refs、recommendations。

禁止行为：

- 不默认跑重 Agent。
- 不把新增文件直接升级成 cold-start。
- 不在 `/file-changes` handler 里复制 lifecycle tracking。
- 不把 deterministic repair 和 semantic audit 混成一个不可分阶段。

### 3.5 `maintenance/`

`maintenance/` 只做低成本健康维护和推荐。

目标目录建议：

```text
lib/workflows/maintenance/
  MaintenancePipeline.ts
  MaintenanceTypes.ts
  MaintenanceEvidence.ts
  SourceRefHealthCheck.ts
  ProposalQueueHealthCheck.ts
  SearchIndexHealthCheck.ts
  DecayHealthCheck.ts
  EnhancementHealthCheck.ts
  RedundancyHealthCheck.ts
  MaintenanceResultProjector.ts
  MaintenanceRecommendationPolicy.ts
```

允许行为：

- source refs reconcile 和 rename repair。
- proposal executor 检查。
- search index refresh。
- decay/enhancement/redundancy health signals。
- 生成 pending recommendations。

禁止行为：

- 不构造完整 `KnowledgeEvidencePack` 伪装成扫描。
- 不直接执行 deep-mining 或 incremental heavy work。
- 不在没有 TTL / dedupe 策略时重复制造 recommendation。
- 不让 redundancy 默认开启。

## 4. 统一生命周期流

四条管线都必须经由同一生命周期骨架：

```text
S0 Normalize
  -> S1 Plan
  -> S2 Track
  -> S3 Evidence
  -> S4 Execute
  -> S5 Project
  -> S6 Persist
  -> S7 Recommend
```

各阶段归属：

| 阶段 | 所在目录 | 说明 |
| --- | --- | --- |
| S0 Normalize | `scan/` + 各管线少量 input adapter | 输出统一 `ScanLifecycleRequest` |
| S1 Plan | `scan/` | 只决定 mode/depth/scope/budget/baseline |
| S2 Track | `scan/` | 创建 run、接入 job queue、处理 cancel/retry |
| S3 Evidence | `scan/retrieval/` + 各管线 evidence policy | 通用 evidence 由 `scan` 提供，管线只声明策略 |
| S4 Execute | 四条管线目录 | 执行业务，不写 run/evidence/recommendation |
| S5 Project | 四条管线目录 | 投影业务结果为统一 summary/output/recommendation intents |
| S6 Persist | `scan/` | 完成或失败 run，保存 evidence/output |
| S7 Recommend | `scan/` + 各管线 recommendation policy | 持久化 recommendation，不偷偷执行重任务 |

## 5. `deprecated-cold-start/` 迁移去向

| 旧位置 | 新位置 | 处理方式 | 删除条件 |
| --- | --- | --- | --- |
| `BootstrapWorkflow.ts` | `cold-start/ColdStartPipeline.ts` 或 `cold-start/dimension-execution/ColdStartDimensionExecutor.ts` | 拆掉旧 `fillDimensionsV3` 对外入口，改为 cold-start 内部 executor | 无生产 import 指向 `BootstrapWorkflow` |
| `pipeline/BootstrapProjectAnalysisPipeline.ts` | `cold-start/project-analysis/ColdStartProjectAnalysisPipeline.ts` | 保留项目分析能力，改名并去 bootstrap 语义 | MCP handlers 不再 import deprecated path |
| `phases/BootstrapPhaseRunner.ts` | `cold-start/project-analysis/ColdStartPhaseRunner.ts` | 迁移 Phase 1-4；长期再按 file/ast/dependency/guard 拆细 | `PanoramaScanner` 等动态 import 已改新路径 |
| `pipeline/BootstrapDimensionSessionPipeline.ts` | `cold-start/dimension-execution/ColdStartDimensionExecutionPipeline.ts` | 改为纯维度执行节点 | 不再处理 scan run/evidence |
| `pipeline/BootstrapCompletionPipeline.ts` | `cold-start/baseline-projection/ColdStartCompletionProjector.ts` | 拆分 report/snapshot/semantic memory/skill/delivery 投影 | 输出只进入 `ColdStartBaselineResult` 或明确 side effects |
| `agent-runs/*` | `cold-start/dimension-execution/*` | 改名为 `ColdStart*` | 测试 import 全部改新路径 |
| `briefing/*` | `cold-start/external-agent/*` | 外部 Agent briefing 属于 cold-start 外部执行形态 | `bootstrap-external.ts` 只经 lifecycle request |
| `session/*` | `cold-start/external-agent/*` | 外部 Agent session/checkpoint 迁入 cold-start | `handlers/bootstrap/shared/session-helpers.ts` 不引用 deprecated |
| `checkpoint/*` | `cold-start/external-agent/*` | 与 session 一起迁移 | dimension-complete handler 改新路径 |
| `config/*` | `cold-start/config/*` | 维度配置和 terminal toolset 改 ColdStart 命名 | `AgentStageFactoryRegistry` 不引用 deprecated |
| `consumers/*` | `cold-start/baseline-projection/*` 或更细子目录 | 按 candidate/skill/report/session/tier reflection 分组 | 无 `Bootstrap*Consumer` 主业务命名 |
| `projections/*` | `cold-start/baseline-projection/*` | 改 ColdStart projection | 测试改新路径 |
| `reports/*` | `cold-start/baseline-projection/*` | report snapshot 只作为 baseline projection 的一部分 | 不直接从 handler 调用 |
| `delivery/*` | `cold-start/baseline-projection/delivery` 或独立 service | 明确这是 cold-start completion side effect | completion pipeline 不再是旧 bootstrap 总控 |
| `incremental/*` | `scan/` planning 或 `cold-start/project-analysis/incremental` | 若只服务 cold-start incremental rebuild，迁入 cold-start；若是跨模式规划，迁入 `scan/planning` | `ScanModule` 不引用 deprecated |
| `mock/*` | `cold-start/testing` 或 test fixtures | 只保留测试需要的 mock | 生产代码不引用 |

## 6. 严格执行计划表

这张表是执行顺序，不是建议列表。未完成前一行验收条件，不进入后一行。任何代码实现都必须按这张表推进。

| 序号 | 目标 | 必须改动 | 禁止改动 | 验收条件 | 验证 |
| --- | --- | --- | --- | --- | --- |
| P0 | 冻结废弃目录 | 在团队约定中声明 `deprecated-cold-start/` 只减不增 | 不向 deprecated 增加新功能、测试或 adapter | 新增业务文件只落在 `scan/` 或四条管线目录 | `git diff --name-status` 人工检查 |
| P1 | 建立四条管线目录骨架 | 新增首批真实 `.ts` 文件，不使用 `.gitkeep` | 不创建空目录占位提交 | `cold-start`、`deep-mining`、`incremental-correction`、`maintenance` 都有实际入口文件 | `rg "export .*Pipeline" lib/workflows/{cold-start,deep-mining,incremental-correction,maintenance}` |
| P2 | 定义共享 lifecycle request/result | 在 `scan/` 增加 `ScanLifecycleRequest`、`ScanLifecycleResult`、source/execution/baseline 类型 | 不让 HTTP/MCP route 自己拼 run tracking | 所有入口能表达为统一 request | `npm run typecheck` |
| P3 | 收敛 S0 normalizer | 新增 `ScanRequestNormalizer`，覆盖 HTTP、MCP、file-change、scheduler 来源 | 不在 route/handler 中继续复制解析逻辑 | `/scan/*`、`/file-changes` opt-in、bootstrap/rescan handler 都能构造 request | normalizer 单测 |
| P4 | 将业务 workflow 移出 `scan/workflows` | `ColdStartWorkflow` -> `cold-start`；`DeepMiningWorkflow` -> `deep-mining`；`IncrementalCorrectionWorkflow` -> `incremental-correction`；`MaintenanceWorkflow` -> `maintenance` | 不保留双份业务 workflow | `lib/workflows/scan/workflows/` 删除或只剩兼容 re-export，最终删除 | `rg "workflows/scan/workflows" lib test` 无生产引用 |
| P5 | 迁移 cold-start project analysis | `deprecated-cold-start/phases` 和 project analysis pipeline 改到 `cold-start/project-analysis` | 不在 deprecated 中修 Phase bug | cold-start 项目分析从新路径运行 | cold-start project analysis 单测 |
| P6 | 迁移 cold-start dimension execution | `BootstrapWorkflow`、dimension session、agent-runs 改成 `cold-start/dimension-execution` | 不继续暴露 `fillDimensionsV3` 作为跨模式 API | `ScanLifecycleRunner` 不 import deprecated | `rg "deprecated-cold-start" lib/workflows/scan lib/workflows/deep-mining` 无结果 |
| P7 | 迁移 cold-start external-agent 能力 | briefing/session/checkpoint/external submission 进入 `cold-start/external-agent` | 不让 MCP handler 直接 import deprecated | `bootstrap-external`、`dimension-complete` 只经 cold-start/lifecycle 新路径 | external bootstrap 相关单测 |
| P8 | 迁移 cold-start baseline projection | consumers/projections/reports/delivery 进入 `cold-start/baseline-projection` | 不把 run/evidence persistence 塞进 projector | projector 输出 `ColdStartBaselineResult` 和明确 side effects | baseline projection 单测 |
| P9 | 建立 deep-mining 独立管线 | 新增 `DeepMiningPipeline`、baseline resolver 接入、projector、recommendation policy | 不调用 cold-start dimension fill 补洞 | deep-mining 可在同一 baseline 多次运行并记录 delta | deep-mining route/lifecycle 单测 |
| P10 | 建立 incremental 独立管线 | 新增 deterministic stage、audit executor、result projector、recommendation policy | 不让 file save 默认跑 Agent | file-changes 和 scan incremental 共享 request/result 语义 | file-changes + incremental 单测 |
| P11 | 建立 maintenance 独立管线 | 新增 health checks、maintenance evidence、result projector、recommendation policy | 不强行使用 `KnowledgeEvidencePack` | maintenance 可输出 health summary 和去重 recommendation | maintenance 单测 |
| P12 | 收敛 ScanLifecycleRunner 为阶段机 | runner 只按 S0-S7 调四条管线，不含旧特殊方法集合 | 不让 route/handler 直接调内部 workflow 阶段 | 四条管线同步/异步都经同一 runner | `ScanLifecycleRunner.test.ts` 重写后通过 |
| P13 | 删除 `ScanOrchestrator` 或降级 | 若 runner 已覆盖分派，删除闲置 orchestrator；否则让它成为 runner 内部私有策略 | 不保留两个公开编排入口 | 只有一个公共 lifecycle 编排入口 | `rg "ScanOrchestrator" lib test` 符合预期 |
| P14 | 删除 deprecated 生产引用 | 所有 import 从 `deprecated-cold-start` 迁出 | 不保留 compatibility barrel | `rg "deprecated-cold-start" lib test` 只允许文档命中 | `rg "deprecated-cold-start" lib test` |
| P15 | 删除 deprecated 目录 | 删除 `lib/workflows/deprecated-cold-start/` | 不留下空目录或 `.gitkeep` | 目录不存在 | `test ! -d lib/workflows/deprecated-cold-start` |
| P16 | 更新测试命名 | Bootstrap 相关测试按新模块改名，必要时拆成 cold-start/deep/incremental/maintenance 测试 | 不让测试继续强化旧命名 | 测试名反映新管线结构 | `npm run test:unit` |
| P17 | 全量验证 | typecheck、lint、unit tests、必要 route tests | 不跳过失败测试提交 | 所有验证通过 | `npm run typecheck && npm run lint && npm run test:unit` |

## 7. 分阶段提交建议

为了降低 review 风险，建议按以下提交拆分：

1. `refactor(scan): introduce lifecycle request contracts`
2. `refactor(cold-start): move project analysis from deprecated bootstrap`
3. `refactor(cold-start): move dimension execution and baseline projection`
4. `refactor(deep-mining): isolate baseline anchored pipeline`
5. `refactor(incremental): isolate correction pipeline stages`
6. `refactor(maintenance): isolate health maintenance pipeline`
7. `refactor(scan): route all modes through lifecycle runner`
8. `refactor: remove deprecated cold-start workflow`

每个提交必须能单独通过 typecheck。允许中间提交保留 deprecated 目录，但不允许新增 deprecated 能力。

## 8. 关键设计细节

### 8.1 cold-start 不再导出 bootstrap API

冷启动新入口应长这样：

```ts
export interface ColdStartPipeline {
  analyzeProject(input: ColdStartProjectAnalysisInput): Promise<ColdStartProjectAnalysisResult>;
  executeDimensions(input: ColdStartDimensionExecutionInput): Promise<ColdStartDimensionExecutionResult>;
  projectBaseline(input: ColdStartBaselineProjectionInput): ColdStartBaselineResult;
}
```

兼容旧 MCP response 的逻辑放在 `legacy-adapters/DeprecatedBootstrapResponseAdapter.ts`，并且只能被 handler 临时调用。adapter 不允许访问 run repository、evidence repository 或 recommendation repository。

### 8.2 deep-mining 不再复用 cold-start dimension fill

deep-mining 的 Agent 任务是补洞，不是重新跑冷启动维度填充。它应该使用：

- baseline evidence。
- scoped files。
- existing knowledge/gaps。
- `deep-scan` profile。
- candidate/proposal submission path。

如果某些 prompt 或 runtime builder 与 cold-start 相似，应抽到 agent 层或 shared prompt utility，而不是从 `cold-start` 反向 import。

### 8.3 incremental-correction 拆成两段

incremental 必须显式分成：

```text
DeterministicRepairStage
  -> ImpactEvidencePolicy
  -> OptionalIncrementalAuditExecutor
  -> IncrementalCorrectionResultProjector
```

`FileChangeDispatcher` 的确定性路径可独立存在。语义审计只是增强路径，不是文件变更处理的默认成本。

### 8.4 maintenance 使用自己的 evidence

maintenance 输出的是 health signals，不是代码扫描 evidence。目标类型应类似：

```ts
export interface MaintenanceEvidence {
  sourceRefs: SourceRefHealthEvidence;
  proposals: ProposalQueueEvidence;
  searchIndex: SearchIndexEvidence;
  decay: DecayEvidence;
  enhancements: EnhancementEvidence;
  redundancy?: RedundancyEvidence;
  warnings: string[];
}
```

它可以被 run summary 持久化，但不要强行塞进 `KnowledgeEvidencePack`。

### 8.5 recommendation 只计划，不偷偷执行

四条管线都可以产出 recommendation intents：

- cold-start：低覆盖维度 -> deep-mining。
- deep-mining：仍有 gaps -> 下一轮 scoped deep-mining；覆盖稳定 -> maintenance。
- incremental：新增文件或影响范围扩大 -> deep-mining；长期 stale -> maintenance。
- maintenance：stale refs -> incremental；enhancement signals -> deep-mining。

`ScanRecommendationScheduler` 负责去重、持久化、queue/execute/dismiss 状态。除非用户或明确 scheduler 策略触发，不允许同步请求里直接执行推荐任务。

## 9. 禁止事项

- 不再把任何新实现放进 `lib/workflows/deprecated-cold-start/`。
- 不在四条业务管线里复制 run/evidence/job/recommendation persistence。
- 不保留 `BootstrapWorkflow` 作为生产入口。
- 不让 `deep-mining` import `cold-start` 的 dimension executor。
- 不让 `maintenance` 调用 Agent 或 deep scan。
- 不让 `file-changes` 默认跑 semantic audit。
- 不创建空目录占位文件作为实现完成标志。
- 不把“改 import 路径”当成迁移完成；必须完成命名、职责、测试和删除 deprecated。

## 10. 最终验收

完成时必须同时满足：

- `lib/workflows/deprecated-cold-start/` 不存在。
- `lib/workflows/scan/` 只包含共享 lifecycle kernel。
- `lib/workflows/cold-start/` 能独立解释 cold-start baseline 创建。
- `lib/workflows/deep-mining/` 能独立解释 baseline anchored gap filling。
- `lib/workflows/incremental-correction/` 能独立解释 file change correction。
- `lib/workflows/maintenance/` 能独立解释 health maintenance 和 recommendations。
- HTTP、MCP、file-changes、scheduler 入口都只提交统一 lifecycle request。
- 四条管线都使用同一套 run/evidence/job/recommendation 语义。
- `rg "deprecated-cold-start" lib test` 无结果。
- `npm run typecheck && npm run lint && npm run test:unit` 全部通过。

一句话目标：

```text
scan 负责生命周期内核；cold-start 建 baseline；deep-mining 补覆盖；incremental-correction 修变化；maintenance 管健康；deprecated-cold-start 迁空后删除。
```

## 11. 真实代码依赖详图

本节是执行时必须对照的真实代码清单。后续实现不得只按概念移动文件，必须先切断这些生产引用和测试引用。

### 11.1 当前生产引用 `deprecated-cold-start` 的文件

| 引用方 | 当前引用 | 目标 |
| --- | --- | --- |
| `lib/agent/profiles/AgentStageFactoryRegistry.ts` | `config/BootstrapTerminalToolset.ts` | 改到 `cold-start/config/ColdStartTerminalToolset.ts` |
| `lib/external/mcp/handlers/bootstrap-external.ts` | `briefing/MissionBriefingBuilder.ts` | 改到 `cold-start/external-agent/ColdStartMissionBriefingBuilder.ts`，最终由 lifecycle request 驱动 |
| `lib/external/mcp/handlers/bootstrap-internal.ts` | `briefing/BootstrapDimensionText.ts` | 改到 `cold-start/external-agent/ColdStartDimensionText.ts` 或 `cold-start/dimension-execution/ColdStartDimensionText.ts` |
| `lib/external/mcp/handlers/dimension-complete-external.ts` | `BOOTSTRAP_COMPLETE_ACTIONS`、`saveDimensionCheckpoint` | 改到 `cold-start/external-agent/ColdStartCheckpointStore.ts` 和 completion action 新命名 |
| `lib/external/mcp/handlers/rescan-external.ts` | `MissionBriefingBuilder`、`runBootstrapProjectAnalysis` | project analysis 改到 `cold-start/project-analysis`；deep-mining briefing 改到 `deep-mining/external-agent` |
| `lib/external/mcp/handlers/rescan-internal.ts` | `runBootstrapProjectAnalysis` | 项目分析只能从 `cold-start/project-analysis` 临时复用；gap-fill 必须迁到 `deep-mining` |
| `lib/external/mcp/handlers/bootstrap/shared/session-helpers.ts` | `BootstrapSessionManager` | 改到 `cold-start/external-agent/ColdStartSession.ts` |
| `lib/injection/modules/ScanModule.ts` | `IncrementalBootstrap` | 先裁决归属，再改到 `scan/planning` 或 `cold-start/project-analysis/incremental` |
| `lib/service/panorama/PanoramaScanner.ts` | 动态 import `BootstrapPhaseRunner` | 改到 `cold-start/project-analysis/ColdStartPhaseRunner.ts`，避免动态旧路径 |
| `lib/workflows/scan/lifecycle/ColdStartBaselinePipeline.ts` | `BootstrapProjectAnalysisPipeline`、`BootstrapDimensionFillResult` | cold-start pipeline 自身迁出 `scan/lifecycle` 后改新类型 |
| `lib/workflows/scan/lifecycle/ColdStartBaselineProjection.ts` | `BootstrapDimensionFillResult` | 改成 `ColdStartDimensionExecutionResult` |
| `lib/workflows/scan/lifecycle/ScanLifecycleRunner.ts` | `fillDimensionsV3`、`BootstrapProjectAnalysisPipeline` | runner 不再 import 旧 cold-start 实现，只调四条管线接口 |
| `lib/workflows/scan/workflows/ColdStartWorkflow.ts` | `fillDimensionsV3` | 迁到 `cold-start/` 后改为内部 executor |

删除 `deprecated-cold-start/` 前，以上生产引用必须全部为零。

### 11.2 当前测试引用 `deprecated-cold-start` 的文件

以下测试不能只改 import 路径，迁移时应同步改名或拆分测试主题，否则测试会继续强化旧 bootstrap 概念：

- `test/unit/BootstrapCandidateRelationConsumer.test.ts`
- `test/unit/BootstrapDeliveryConsumer.test.ts`
- `test/unit/BootstrapDimensionConsumer.test.ts`
- `test/unit/BootstrapDimensionRuntimeBuilder.test.ts`
- `test/unit/BootstrapInputBuilder.test.ts`
- `test/unit/BootstrapProjection.test.ts`
- `test/unit/BootstrapReportSnapshotConsumer.test.ts`
- `test/unit/BootstrapRescanState.test.ts`
- `test/unit/BootstrapRestoreState.test.ts`
- `test/unit/BootstrapRuntimeInitializer.test.ts`
- `test/unit/BootstrapSemanticMemoryConsumer.test.ts`
- `test/unit/BootstrapSessionConsumer.test.ts`
- `test/unit/BootstrapSessionExecutionBuilder.test.ts`
- `test/unit/BootstrapSessionInputBuilder.test.ts`
- `test/unit/BootstrapSkillConsumer.test.ts`
- `test/unit/BootstrapTierReflectionConsumer.test.ts`
- `test/unit/ScanLifecycleRunner.test.ts`
- `test/unit/AuditEmission-MissionBriefing.test.ts`

测试迁移目标：

| 旧测试主题 | 新测试主题 |
| --- | --- |
| `BootstrapDimension*` | `ColdStartDimension*` |
| `BootstrapSession*` | `ColdStartExternalSession*` 或 `ColdStartDimensionSession*` |
| `BootstrapReportSnapshot*` | `ColdStartBaselineReport*` |
| `BootstrapSkillConsumer` | `ColdStartSkillProjection` |
| `BootstrapDeliveryConsumer` | `ColdStartDeliveryProjection` |
| `BootstrapRescanState` | 若只服务 cold-start，改 `ColdStartRescanState`；若服务 deep-mining，拆入 `deep-mining` |
| `AuditEmission-MissionBriefing` | `ColdStartMissionBriefing` 或 `DeepMiningMissionBriefing`，按真实使用路径拆分 |

### 11.3 `deprecated-cold-start` 内部模块真实职责

| 目录 | 关键导出 | 真实职责 | 迁移难度 |
| --- | --- | --- | --- |
| 根 `BootstrapWorkflow.ts` | `fillDimensionsV3`、`BootstrapDimensionFillResult`、`clearSnapshots` | 旧冷启动维度填充总入口，串 mock、runtime initializer、dimension session、completion pipeline | 高，必须拆职责 |
| `agent-runs/` | input/runtime/session execution builders | 维度 Agent 与 session Agent 的输入构造 | 中，可整体迁移后改名 |
| `briefing/` | `buildMissionBriefing`、`buildInternalNextSteps`、completion action 常量 | 外部/内部 Agent 任务说明与提交格式 | 中，高耦合但边界明确 |
| `checkpoint/` | `saveDimensionCheckpoint`、`restoreCheckpointDimensions` | 外部 Agent 和冷启动维度执行的 checkpoint 保存/恢复 | 中，可迁 external-agent |
| `config/` | `baseDimensions`、terminal toolset、tier scheduler | 冷启动维度定义、工具策略、维度执行层级 | 中，可迁 config |
| `consumers/` | dimension/skill/session/tier/semantic/candidate relation consumers | baseline completion 的候选、skill、语义记忆、关系、反思消费 | 高，应拆进 baseline projection |
| `context/` | `DimensionContext`、runtime initializer、rescan state | 冷启动维度上下文、运行时初始化、旧 rescan 去重输入 | 中，需决定 rescan state 归属 |
| `delivery/` | `consumeBootstrapDeliveryAndWiki` | 冷启动完成后的 delivery/wiki 副作用 | 中，应变成 cold-start completion side effect |
| `incremental/` | `BootstrapSnapshot`、`IncrementalBootstrap` | 文件快照、diff、冷启动增量评估，同时被 `ScanPlanService` 使用 | 高，必须先裁决归属 |
| `mock/` | `fillDimensionsMock` | AI mock 模式下的冷启动填充 | 低到中，生产 mock 不能误放 test-only |
| `phases/` | `runAllPhases`、Phase 1-4 函数 | 文件收集、AST、依赖、Guard、维度解析、动态清理与增量评估 | 高，体量大且有动态 import |
| `pipeline/` | project analysis、dimension session、completion pipeline | 旧 bootstrap 三段主流程 | 高，是拆分核心 |
| `projections/` | dimension/session projection | Agent 输出结构化 | 中，可迁 baseline projection / dimension execution |
| `reports/` | report/snapshot consumer | baseline 报告、snapshot 写入、summary | 高，依赖 checkpoint/incremental/consumers |
| `session/` | `BootstrapSessionManager`、`ExternalSubmissionTracker` | 外部 Agent session 与提交质量追踪 | 中，可迁 external-agent |

## 12. 共享 scan kernel 的真实职责收敛

当前 `scan/` 已经拥有 kernel 雏形，但还不是纯 kernel。迁移时按以下清单处理。

### 12.1 必须长期保留在 `scan/`

| 当前文件 | 长期职责 |
| --- | --- |
| `ScanTypes.ts` | 保留通用 `ScanMode`、`ScanPlan`、`ScanBudget`、`ScanScope`、`KnowledgeEvidencePack`；新增 lifecycle request/result 类型时可拆到 `ScanLifecycleTypes.ts` |
| `ScanPlanService.ts` | S1 Plan。只规划 mode/depth/scope/budget/fallback/baseline，不执行管线 |
| `ScanJobQueue.ts` | S2 async job lifecycle。仍为进程内队列 |
| `lifecycle/ScanRunTracker.ts` | S2/S6 run tracking 和 evidence persistence |
| `lifecycle/ScanBaselineResolver.ts` | baseline anchor 解析，供 deep-mining 和 planning 共用 |
| `lifecycle/ScanRecommendationScheduler.ts` | S7 recommendation 状态持久化 |
| `normalization/ScanChangeSetNormalizer.ts` | change event/changeSet 通用归一化 |
| `retrieval/*` | S3 通用 evidence retrieval 和 lens |
| `index.ts` | 只 re-export kernel；迁移完成后不得 re-export 具体业务 workflow |

### 12.2 必须迁出 `scan/`

| 当前文件 | 目标 |
| --- | --- |
| `scan/workflows/ColdStartWorkflow.ts` | `cold-start/dimension-execution/ColdStartWorkflow.ts` 或 `ColdStartDimensionExecutor.ts` |
| `scan/workflows/DeepMiningWorkflow.ts` | `deep-mining/DeepMiningPipeline.ts` 或 `DeepMiningAgentExecutor.ts` + `DeepMiningPipeline.ts` |
| `scan/workflows/IncrementalCorrectionWorkflow.ts` | `incremental-correction/IncrementalCorrectionPipeline.ts`，并拆 deterministic/evidence/audit/projector |
| `scan/workflows/MaintenanceWorkflow.ts` | `maintenance/MaintenancePipeline.ts`，并拆 health checks |
| `scan/lifecycle/ColdStartBaselinePipeline.ts` | `cold-start/ColdStartPipeline.ts` 或 `cold-start/baseline-projection/ColdStartBaselineProjector.ts` |
| `scan/lifecycle/ColdStartBaselineProjection.ts` | `cold-start/baseline-projection/ColdStartBaselineProjector.ts` |
| `scan/lifecycle/ColdStartLifecycleRunner.ts` | 拆入 `cold-start/`；run/persist 部分留给 `ScanLifecycleRunner` |
| `scan/lifecycle/ColdStartScanContext.ts` | 业务上下文迁 `cold-start/`；run/evidence 创建逻辑迁回 kernel |

### 12.3 `ScanLifecycleRunner` 方法级重构落点

| 当前方法 | 当前职责 | 目标处理 |
| --- | --- | --- |
| `prepareColdStartBaseline` | analyze project + build scan context + create run/evidence | 改为 `run(request)` 阶段机中的 cold-start 分支；项目分析由 `ColdStartPipeline` 执行，run/evidence 由 kernel 阶段处理 |
| `prepareColdStartContext` / `buildColdStartContext` | 规划、retrieval、create run | 拆为 S1/S3/S2，不再是 cold-start 专属 context builder |
| `completeColdStartRun` / `completeAndProjectColdStartRun` | baseline projection + complete run | projection 由 `cold-start` 返回，complete 由 S6 完成 |
| `runColdStartFill` | 调 cold-start dimension fill | 移到 `cold-start` pipeline 内部，不暴露给 runner 外部 |
| `prepareDeepMiningGapFillContext` | baseline resolve + plan + retrieve + create run | 拆到 `deep-mining` planning/evidence policy + kernel track |
| `runDeepMiningFill` / `#runTrackedDimensionFill` | 使用 `fillDimensionsV3` 做 gap-fill | 删除此路径；deep-mining 使用自己的 executor，不再调用 cold-start fill |
| `completeDeepMiningBriefingRun` | mission briefing run completion | 迁入 `deep-mining/external-agent/DeepMiningCompletionRecorder.ts`，由 runner S6 调用 |
| `runIncrementalCorrection` | eventsToChangeSet + track + workflow | 只保留通用 `run(request)`；业务执行迁 `incremental-correction` |
| `enqueueIncrementalCorrection` / `enqueueDeepMining` / `enqueueMaintenance` | queue 封装 | 合并为 `enqueue(request)`，mode 从 request 决定 |
| `resolveDeepMiningRequest` | baseline resolve | baseline resolver 留在 `scan`，deep-mining request enrichment 迁入 `deep-mining` planner |
| `runDeepMining` | track + deep workflow | 由通用 runner 调 `DeepMiningPipeline.execute` |
| `runMaintenance` | track + maintenance + persist recommendations | maintenance 执行迁出；recommendation persist 留 S7 |
| `summarize*` 函数 | 各模式 summary | 通用 summary contract 留 scan，具体 projector 迁各管线 |

目标 runner 最终只暴露：

```ts
class ScanLifecycleRunner {
  plan(request: ScanLifecycleRequest): ScanLifecyclePlanResult;
  run(request: ScanLifecycleRequest, options?: ScanLifecycleRunOptions): Promise<ScanLifecycleResult>;
  enqueue(request: ScanLifecycleRequest, options?: ScanLifecycleQueueOptions): ScanJobRecord;
  cancel(jobOrRunId: string, reason?: string): ScanLifecycleCancellationResult;
}
```

## 13. 统一 `ScanLifecycleRequest` 字段落地

当前 HTTP/MCP/file-changes 输入分散。新增类型时不要只复制文档示例，必须覆盖以下真实字段。

### 13.1 建议类型

```ts
export type ScanLifecycleSource =
  | 'http'
  | 'mcp-internal'
  | 'mcp-external'
  | 'file-changes'
  | 'scheduler'
  | 'cli'
  | 'test';

export interface ScanLifecycleRequest {
  projectRoot: string;
  source: ScanLifecycleSource;
  requestedMode?: ScanMode;
  intent?: ScanPlanRequest['intent'];
  force?: boolean;
  hasBaseline?: boolean;
  baseline?: {
    runId?: string | null;
    snapshotId?: string | null;
  };
  scope?: ScanScope;
  dimensions?: string[];
  modules?: string[];
  query?: string;
  files?: ScanFileEvidenceInput[];
  changeSet?: ScanChangeSet;
  events?: FileChangeEvent[];
  reactiveReport?: ReactiveEvolutionReport;
  impactedRecipeIds?: string[];
  budget?: ScanBudget;
  depth?: ScanDepth;
  primaryLang?: string;
  execution?: {
    async?: boolean;
    runAgent?: boolean;
    runDeterministic?: boolean;
    maxAttempts?: number;
    allowSideEffects?: boolean;
    reason?: string;
    label?: string;
  };
  coldStart?: {
    ctx?: unknown;
    sourceTag?: string;
    phaseOptions?: {
      maxFiles?: number;
      contentMaxLines?: number;
      skipGuard?: boolean;
      clearOldData?: boolean;
      generateReport?: boolean;
      generateAstContext?: boolean;
      incremental?: boolean;
      dataRoot?: string;
      summaryPrefix?: string;
    };
    terminalTest?: boolean;
    terminalToolset?: string;
    allowedTerminalModes?: string[];
    loadSkills?: boolean;
  };
  maintenance?: {
    forceSourceRefReconcile?: boolean;
    refreshSearchIndex?: boolean;
    includeDecay?: boolean;
    includeEnhancements?: boolean;
    includeRedundancy?: boolean;
  };
  metadata?: Record<string, unknown>;
}
```

### 13.2 入口映射

| 入口 | 当前输入 | `ScanLifecycleRequest` 映射 |
| --- | --- | --- |
| `POST /api/v1/scan/plan` | `toScanPlanRequest(req.body)` | `source: 'http'`，填 `intent/requestedMode/baseline/scope/changeSet/budget`，只执行 S0-S1 |
| `POST /api/v1/scan/retrieve` | `toKnowledgeRetrievalInput(req.body)` | `source: 'http'`，填 `requestedMode/intent/depth/scope/changeSet/files/budget/primaryLang`，只执行 S0-S3 |
| `POST /api/v1/scan/incremental-correction` | events、runDeterministic、runAgent、depth、budget | `source: 'http'`，`requestedMode: 'incremental-correction'`，填 `events/execution.runDeterministic/execution.runAgent` |
| `POST /api/v1/scan/deep-mining` | baseline、dimensions、modules、query、runAgent、maxNewCandidates | `source: 'http'`，`requestedMode: 'deep-mining'`，填 `baseline/scope/execution.runAgent/budget.maxKnowledgeItems` |
| `POST /api/v1/scan/maintenance` | maintenance options | `source: 'http'`，`requestedMode: 'maintenance'`，填 `maintenance` |
| `POST /api/v1/file-changes` | events + optional `scan` | 总是先 deterministic dispatch；若 `scan.enabled`，构造 `source: 'file-changes'`，填 `events/reactiveReport/execution.runDeterministic=false` |
| `bootstrap-internal` | maxFiles、skipGuard、dimensions、terminal options | `source: 'mcp-internal'`，`requestedMode: 'cold-start'`，填 `coldStart.phaseOptions` 和 `dimensions` |
| `bootstrap-external` | 无参数 + cleanup/session | `source: 'mcp-external'`，`requestedMode: 'cold-start'`，填 `coldStart.phaseOptions` 和 external-agent metadata |
| `rescan-internal` | reason、dimensions、skipAsyncFill | 应拆成 maintenance/evolution audit + deep-mining recommendation；过渡期构造 `requestedMode: 'deep-mining'` 的 baseline anchored request |
| `rescan-external` | reason、dimensions | 构造 `deep-mining/external-agent` briefing request，不再复用 cold-start briefing |

### 13.3 `ScanLifecycleResult` 必备字段

```ts
export interface ScanLifecycleResult<T = unknown> {
  run: ScanRunRecord | null;
  plan: ScanPlan;
  evidencePack: KnowledgeEvidencePack | null;
  evidencePackRecord: ScanEvidencePackRecord | null;
  result: T;
  summary: Record<string, unknown>;
  recommendations: ScanRecommendationRecord[];
  job?: ScanJobRecord<unknown, unknown>;
}
```

`maintenance` 如果使用 `MaintenanceEvidence`，可以让 `evidencePack` 为 `null`，把 health evidence 放入 `summary.health` 或后续 `scan_run_outputs`。不要为了统一字段而伪造 `KnowledgeEvidencePack`。

## 14. 四条管线的文件级首批实现清单

这不是最终理想结构，而是最小可执行迁移批次。每一批都必须能通过 typecheck。

### 14.1 P1 首批真实文件

不要提交空目录。第一批应创建实际 `.ts` 文件：

```text
lib/workflows/cold-start/ColdStartTypes.ts
lib/workflows/cold-start/ColdStartPipeline.ts
lib/workflows/deep-mining/DeepMiningTypes.ts
lib/workflows/deep-mining/DeepMiningPipeline.ts
lib/workflows/incremental-correction/IncrementalCorrectionTypes.ts
lib/workflows/incremental-correction/IncrementalCorrectionPipeline.ts
lib/workflows/maintenance/MaintenanceTypes.ts
lib/workflows/maintenance/MaintenancePipeline.ts
```

第一批可以只做薄包装，但必须满足：

- 不 import `deprecated-cold-start`，除非该批目标就是迁移 cold-start 旧模块。
- 不新增行为。
- 每个 pipeline 导出稳定 class 或 function。
- `ScanModule` 可以注册这些 pipeline，但不应立即删除旧实现，除非所有测试已改。

### 14.2 P4 业务 workflow 迁出

第一轮移动：

| 移动前 | 移动后 | 处理 |
| --- | --- | --- |
| `scan/workflows/DeepMiningWorkflow.ts` | `deep-mining/DeepMiningPipeline.ts` 或 `deep-mining/DeepMiningWorkflow.ts` | 先保留类名也可，但 import path 必须换到 deep-mining |
| `scan/workflows/IncrementalCorrectionWorkflow.ts` | `incremental-correction/IncrementalCorrectionPipeline.ts` | 随后拆 stage |
| `scan/workflows/MaintenanceWorkflow.ts` | `maintenance/MaintenancePipeline.ts` | 随后拆 health check |
| `scan/workflows/ColdStartWorkflow.ts` | `cold-start/dimension-execution/ColdStartWorkflow.ts` | 迁出后立刻改掉 `fillDimensionsV3` 依赖 |

需要同步修改：

- `lib/injection/modules/ScanModule.ts`
- `lib/workflows/scan/lifecycle/ScanLifecycleRunner.ts`
- `lib/workflows/scan/ScanOrchestrator.ts`，如果还未删除
- `test/unit/ScanPipelines.test.ts`
- `test/unit/ScanLifecycleRunner.test.ts`

验收：

```bash
rg "workflows/scan/workflows" lib test
npm run typecheck
```

### 14.3 cold-start 迁移批次

按以下顺序迁，不要反过来：

1. 迁 `config/`：先让 `AgentStageFactoryRegistry` 改新路径，风险小。
2. 迁 `agent-runs/`：输入构造和 runtime builder 是叶子能力。
3. 迁 `context/DimensionContext.ts` 和 `BootstrapRuntimeInitializer.ts`：执行链会用到。
4. 迁 `checkpoint/` 和 `session/`：让 external handler 有新路径。
5. 迁 `briefing/BootstrapDimensionText.ts`：internal next steps 和 dimension complete actions 先改路径。
6. 迁 `briefing/MissionBriefingBuilder.ts`：外部 Agent briefing 体量大，但边界明确。
7. 迁 `pipeline/BootstrapDimensionSessionPipeline.ts`：依赖前面几类。
8. 迁 `consumers/projections/reports/delivery`：组成 baseline projection。
9. 迁 `pipeline/BootstrapCompletionPipeline.ts`：等 projection 组件就位后再迁。
10. 迁 `phases/BootstrapPhaseRunner.ts` 和 `pipeline/BootstrapProjectAnalysisPipeline.ts`：同时改 `PanoramaScanner` 和 MCP handlers。
11. 最后处理 `BootstrapWorkflow.ts`：拆掉 `fillDimensionsV3` 对外 API，改为 `ColdStartPipeline.executeDimensions`。

`incremental/BootstrapSnapshot.ts` 和 `IncrementalBootstrap.ts` 不跟着盲迁。必须先做归属裁决：

- 如果它只服务冷启动增量 rebuild，迁到 `cold-start/project-analysis/incremental/ColdStartIncrementalPlanner.ts`。
- 如果它要服务 `ScanPlanService` 的跨模式变更规划，迁到 `scan/planning/IncrementalPlanningSnapshot.ts` 和 `scan/planning/IncrementalScanPlanner.ts`。

当前 `ScanModule` 用它构造 `ScanPlanService`，所以更倾向先迁到 `scan/planning`，再把 cold-start phase runner 作为消费者。

### 14.4 deep-mining 独立化批次

当前 deep-mining 有两条路径：

- HTTP `/scan/deep-mining` -> `ScanLifecycleRunner.runDeepMining` -> `DeepMiningWorkflow.run` -> retrieval + optional `deep-scan`。
- rescan gap-fill -> `prepareDeepMiningGapFillContext` -> `runDeepMiningFill` -> `fillDimensionsV3`。

目标必须合并成一条 deep-mining 管线。

落地步骤：

1. 在 `deep-mining/DeepMiningTypes.ts` 定义 `DeepMiningPipelineInput`、`DeepMiningPipelineResult`、`DeepMiningCoverageDelta`。
2. 把当前 `DeepMiningWorkflow.run` 移入 `DeepMiningPipeline.execute`。
3. 新增 `DeepMiningResultProjector.ts`，从 `scanResult/evidencePack/baseline` 投影 summary。
4. 新增 `DeepMiningRecommendationPolicy.ts`，根据 gaps/coverage delta 产出 recommendedRuns。
5. 新增 `external-agent/DeepMiningBriefingBuilder.ts`，不要复用 cold-start `MissionBriefingBuilder` 作为长期方案。
6. 删除 `ScanLifecycleRunner.runDeepMiningFill` 对 `fillDimensionsV3` 的调用，rescan internal 改成 deep-mining pipeline 的 async job 或 external-agent briefing。

验收：

```bash
rg "fillDimensionsV3" lib/workflows/deep-mining lib/external/mcp/handlers/rescan-internal.ts
rg "deprecated-cold-start" lib/workflows/deep-mining
```

两个命令都应无结果。

### 14.5 incremental-correction 独立化批次

当前 `IncrementalCorrectionWorkflow.run` 同时做 deterministic dispatch、retrieval、optional audit。

拆分目标：

```text
IncrementalCorrectionPipeline
  -> DeterministicRepairStage
  -> ImpactEvidencePolicy
  -> IncrementalAuditExecutor
  -> IncrementalCorrectionResultProjector
  -> IncrementalRecommendationPolicy
```

文件级落地：

| 新文件 | 来源 |
| --- | --- |
| `DeterministicRepairStage.ts` | 当前 `fileChangeDispatcher.dispatch` 和 `emptyReactiveReport/withEventSource` |
| `ImpactEvidencePolicy.ts` | 当前 retrieval input 组装 |
| `IncrementalAuditExecutor.ts` | 当前 `runEvolutionAudit` 逻辑和 recipe projection |
| `IncrementalCorrectionResultProjector.ts` | 当前 `summarizeIncrementalResult` + result normalization |
| `IncrementalRecommendationPolicy.ts` | 新增：added files、stale refs、needsReview 高时推荐 deep-mining/maintenance |

`file-changes.ts` 的规则不变：先 deterministic dispatch，`scan.enabled` 才提交 lifecycle request；进入 pipeline 时必须带 `reactiveReport` 并设置 `runDeterministic: false`，避免重复 dispatch。

### 14.6 maintenance 独立化批次

当前 `MaintenanceWorkflow.run` 串 sourceRef、proposal、search index、decay、enhancement、redundancy，并直接 build recommendedRuns。

拆分目标：

```text
MaintenancePipeline
  -> SourceRefHealthCheck
  -> ProposalQueueHealthCheck
  -> SearchIndexHealthCheck
  -> DecayHealthCheck
  -> EnhancementHealthCheck
  -> RedundancyHealthCheck
  -> MaintenanceResultProjector
  -> MaintenanceRecommendationPolicy
```

文件级落地：

| 新文件 | 来源 |
| --- | --- |
| `SourceRefHealthCheck.ts` | `sourceRefReconciler.reconcile` + `repairRenames` |
| `ProposalQueueHealthCheck.ts` | `proposalExecutor.checkAndExecute` |
| `SearchIndexHealthCheck.ts` | `refreshIndex/buildIndex` |
| `DecayHealthCheck.ts` | `decayDetector.scanAll` |
| `EnhancementHealthCheck.ts` | `enhancementSuggester.analyzeAll` |
| `RedundancyHealthCheck.ts` | `redundancyAnalyzer.analyzeAll`，仍 opt-in |
| `MaintenanceEvidence.ts` | health signals 类型 |
| `MaintenanceRecommendationPolicy.ts` | 当前 `buildRecommendedRuns`，加 dedupe 输入 |

验收重点：maintenance 不创建 `KnowledgeEvidencePack`，只把 health evidence 投到 run summary 或后续 outputs。

## 15. 每批修改后的验证矩阵

| 批次 | 必跑验证 |
| --- | --- |
| P1-P2 类型/骨架 | `npm run typecheck` |
| P3 normalizer | `npm run test:unit -- ScanChangeSetNormalizer ScanRoutes FileChangesRoute` |
| P4 workflow 迁出 | `npm run test:unit -- ScanPipelines ScanLifecycleRunner` |
| cold-start config/agent-runs/context 迁移 | `npm run test:unit -- BootstrapDimensionRuntimeBuilder BootstrapInputBuilder BootstrapRuntimeInitializer`，测试迁名后用新名 |
| cold-start briefing/session/checkpoint 迁移 | `npm run test:unit -- BootstrapSession BootstrapRestoreState AuditEmission-MissionBriefing`，测试迁名后用新名 |
| cold-start projection/consumer/report 迁移 | `npm run test:unit -- BootstrapProjection BootstrapReportSnapshotConsumer BootstrapSkillConsumer BootstrapDeliveryConsumer`，测试迁名后用新名 |
| deep-mining 独立化 | `npm run test:unit -- ScanPipelines ScanLifecycleRunner ScanRoutes` |
| incremental 独立化 | `npm run test:unit -- ScanPipelines FileChangesRoute ScanLifecycleRunner` |
| maintenance 独立化 | `npm run test:unit -- ScanPipelines ScanRecommendationRepository ScanRoutes` |
| runner 阶段机收敛 | `npm run test:unit -- ScanLifecycleRunner ScanRoutes FileChangesRoute` |
| 删除 deprecated | `rg "deprecated-cold-start" lib test`、`test ! -d lib/workflows/deprecated-cold-start`、`npm run typecheck && npm run lint && npm run test:unit` |

如果某个测试命令因为测试文件改名不再匹配，应使用迁名后的对应测试名；不得跳过同等覆盖。

## 16. 执行时的硬性检查点

每完成一个迁移批次，都必须回答下面问题，答案不清楚就不能进入下一批：

1. 这批是否减少了 `deprecated-cold-start` 的生产引用数量？
2. 这批是否新增了任何 `deprecated-cold-start` 文件或逻辑？如果有，立即回退。
3. 这批是否让 `scan/` 更接近纯 kernel，还是又增加了业务职责？
4. 四条管线中是否出现跨业务反向依赖，例如 `deep-mining` import `cold-start`？
5. run/evidence/job/recommendation 是否仍只通过 `scan` kernel 处理？
6. HTTP/MCP/file-changes 入口是否减少了自行编排逻辑？
7. 相关测试是否随命名和职责一起迁移，而不是只改 import？
8. `npm run typecheck` 是否通过？

建议每批结束记录这组指标：

```bash
rg "deprecated-cold-start" lib test | wc -l
rg "workflows/scan/workflows" lib test | wc -l
rg "fillDimensionsV3" lib test | wc -l
rg "ScanOrchestrator" lib test | wc -l
```

这些数字应该单调下降。若某一批让数字上升，说明实现方向偏离了本方案。
