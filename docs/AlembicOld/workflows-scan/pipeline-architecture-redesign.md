# Alembic 管线架构重设计

> 日期：2026-04-28  
> 状态：重新校准设计，不是当前实现完成情况。  
> 目标：用新 `cold-start` 替换旧 `bootstrap`，用新 `incremental-scan` 替换旧 `rescan`，并把两者共享能力拆成独立公共管线，避免冷启动继续膨胀。

## 1. 先纠正命名

当前最大问题不是文件移动不够，而是命名让职责继续混在一起。

### 1.1 产品入口名

| 产品动作 | 用户看到的入口 | 新管线归属 | 说明 |
| --- | --- | --- | --- |
| 冷启动建库 | `alembic_bootstrap` / Dashboard bootstrap | `cold-start` | 替换旧 `bootstrap` 管线。 |
| 一次性重建数据 | `alembic_bootstrap` / Dashboard bootstrap | `cold-start` | 替换旧 `bootstrap` 管线，只在首次建库或强制重建时使用。 |
| 日常检查和新扫描 | `alembic_rescan` / Dashboard rescan | `incremental-scan` | 高频日常扫描入口，替换旧 `rescan` 管线。 |
| 文件变更实时增量扫描 | `/api/v1/file-changes` opt-in scan | `incremental-scan` | 同属增量扫描，只是触发源不同。 |
| 冷启动后补充挖掘 | `/api/v1/scan/deep-mining` | `deep-mining` | 配合 cold-start 使用，是冷启动后的补充，不是日常入口。 |

### 1.2 代码命名原则

- `bootstrap` 只允许出现在旧兼容入口、旧工具名说明或迁移注释里。新业务代码不能继续新增 `Bootstrap*`。
- `rescan` 是日常检查和新扫描入口，底层替换管线是 `incremental-scan`。
- `cold-start` 只表示 baseline 建立，不表示“全项目分析公共能力”。
- `project-analysis`、`evidence-retrieval`、`run-tracking`、`job-queue`、`recommendation` 都属于共享管线，不属于 cold-start。
- `deep-mining` 是 cold-start 之后的补充挖掘，不是日常使用入口，也不是 rescan 的默认实现。

## 2. 目标架构

最终结构应当是“三层”，不是把旧 bootstrap 平铺成更多目录。

```text
Entry Adapters
  MCP / HTTP / Dashboard / scheduler
      |
      v
Shared Scan Pipeline
  Normalize -> Project Facts -> Plan -> Evidence -> Track -> Execute -> Project -> Persist -> Recommend
      |
      +-- cold-start
      +-- incremental-scan
      +-- deep-mining
```

核心判断：任何能力只要会被 `cold-start` 和 `incremental-scan/rescan` 同时使用，就不能放在 `cold-start` 目录里。

## 3. 推荐目录

```text
lib/workflows/
  scan/
    ScanLifecycleTypes.ts
    ScanPlanService.ts
    ScanLifecycleRunner.ts
    ScanJobQueue.ts
    normalization/
      ScanRequestNormalizer.ts
      ScanChangeSetNormalizer.ts
    project-analysis/
      ProjectAnalysisPipeline.ts
      ProjectPhaseRunner.ts
      ProjectDimensions.ts
      ProjectSnapshotDiff.ts
      ProjectFactTypes.ts
    retrieval/
      KnowledgeRetrievalPipeline.ts
      ChangeLens.ts
      KnowledgeLens.ts
      GraphLens.ts
      CodeEntityLens.ts
      ProjectSnapshotLens.ts
      EvidenceBudgeter.ts
    tracking/
      ScanRunTracker.ts
      ScanBaselineResolver.ts
      ScanRecommendationScheduler.ts

  cold-start/
    ColdStartPipeline.ts
    ColdStartTypes.ts
    ColdStartBaselineBuilder.ts
    ColdStartDimensionExecutor.ts
    ColdStartBaselineProjector.ts

  incremental-scan/
    IncrementalScanPipeline.ts
    IncrementalScanTypes.ts
    RescanInputAdapter.ts
    IncrementalImpactAnalyzer.ts
    IncrementalAuditExecutor.ts
    IncrementalScanProjector.ts
    IncrementalRecommendationPolicy.ts

  deep-mining/
    DeepMiningPipeline.ts
    DeepMiningTypes.ts
    DeepMiningEvidencePolicy.ts
    DeepMiningAgentExecutor.ts
    DeepMiningProjector.ts

  deprecated-cold-start/
    ...
```

`deprecated-cold-start/` 只能递减，不能新增业务含义。它的代码要么迁到新 `cold-start`，要么迁到 `scan` 共享层，要么删除。

## 4. 共享管线职责

共享管线不是额外业务管线，而是 `cold-start`、`incremental-scan` 和 `deep-mining` 都必须复用的公共骨架。

### 4.1 Normalize

归一化所有入口输入：

- `alembic_bootstrap` -> `ScanLifecycleRequest`，目标 mode 为 `cold-start`。
- `alembic_rescan` -> `ScanLifecycleRequest`，目标 mode 为 `incremental-scan`。
- `/file-changes` -> `ScanLifecycleRequest`，目标 mode 为 `incremental-scan`。
- `/scan/deep-mining` -> `ScanLifecycleRequest`，目标 mode 为 `deep-mining`。

入口层禁止直接做项目扫描、run tracking、evidence persistence 或 Agent 调度。

### 4.2 Project Facts

共享项目事实采集，替代旧 `BootstrapPhaseRunner` 的公共部分：

- 文件收集。
- AST / code entity / call graph / dependency graph。
- Guard audit。
- language stats。
- active dimensions。
- panorama / module facts。
- snapshot diff。

它不属于 cold-start。冷启动需要它，rescan 也需要它。

### 4.3 Evidence

共享 evidence 组装：

- changeSet / snapshot diff。
- impacted recipes。
- stale source refs。
- existing knowledge。
- search results。
- graph context。
- project files excerpts。

业务管线只能声明自己需要什么 evidence，不能复制检索逻辑。

### 4.4 Tracking / Jobs / Recommendations

这些都是共享能力：

- `scan_runs`
- `scan_evidence_packs`
- `scan_recommendations`
- `ScanJobQueue`
- completion/failure/cancel/retry

不能放进 cold-start，也不能放进 incremental-scan。

## 5. `cold-start` 新语义

`cold-start` 只替代旧 `bootstrap` 的一次性数据重建能力。

```text
cold-start
  input: project facts + dimensions + baseline options
  output: baseline snapshot + initial candidates/skills/report
```

允许：

- 建立第一次完整 baseline。
- 强制 rebuild baseline。
- 重新建立项目知识数据。
- 执行维度 Agent 生成初始知识。
- 产出 baseline projection。

禁止：

- 决定 rescan 语义。
- 保存通用 scan run。
- 承担冷启动后的持续补充挖掘。
- 处理日常 file changes。
- 承载共享项目分析。

最小冷启动应当是：

```text
ProjectFacts from scan/shared
  -> ColdStartBaselineBuilder
  -> ColdStartDimensionExecutor
  -> ColdStartBaselineProjector
```

旧 `bootstrap-internal/external` 应逐步变成 thin adapter，只构造 `ScanLifecycleRequest(mode: cold-start)`。

## 6. `incremental-scan` 新语义

`incremental-scan` 替代旧 `rescan`，是日常高频使用的检查和新扫描主线，也承接实时文件变更触发的增量扫描。

```text
incremental-scan
  input: rescan trigger | file events | git diff | snapshot diff
  output: correction report + stale/decay decisions + update/deprecate proposals + optional refill candidates
```

允许：

- 保留已有 Recipes。
- 执行日常检查和新扫描。
- 从 `rescan` 派生 snapshot diff / affected dimensions / impacted recipes。
- 从 `/file-changes` 消费真实 `FileChangeEvent[]`。
- 调用 deterministic repair / source-ref repair。
- 调用 RelevanceAuditor / Evolution audit。
- 生成修正、废弃、review、补齐建议。

禁止：

- 重新建立 baseline。
- 清空知识库。
- 直接使用 cold-start phase 作为私有实现。
- 在 handler 中自己做大编排。

`rescan-internal/external` 的新定位：

```text
rescan entry
  -> RescanInputAdapter
  -> ScanLifecycleRequest(mode: incremental-scan, source: mcp/dashboard)
  -> Shared Project Facts + Evidence
  -> IncrementalScanPipeline
```

这意味着当前实现里的 `incremental-correction` 命名需要废弃或迁移为 `incremental-scan`。增量扫描不能只接受 `FileChangeEvent[]`，还必须接受：

- manual rescan trigger。
- dimensions filter。
- snapshot diff。
- stale source refs。
- existing recipe snapshot。
- project facts summary。

`FileChangeEvent[]` 只是增量扫描的一种触发源，不是整个增量管线的定义。

## 7. `deep-mining` 新语义

`deep-mining` 配合 `cold-start` 使用，是冷启动建立 baseline 之后的补充挖掘管线。

它只负责：

- 基于已有 baseline 做专题深挖。
- 补低覆盖维度。
- 新模块扩展分析。
- 执行较重 Agent。

它不是日常使用入口，不替代 rescan，也不能被 `rescan` handler 直接内嵌调用。日常检查和新扫描一律进入 `incremental-scan`；只有在冷启动后需要补充覆盖或专题挖掘时，才显式进入 `deep-mining`。

## 8. 删除 `maintenance` 独立管线

`maintenance` 不再作为独立业务管线存在。原来被放进 maintenance 的能力要拆成共享能力或增量扫描阶段：

- source refs reconcile / rename repair：属于 `scan` 共享 health 能力，可被 `incremental-scan` 调用。
- proposal queue 检查：属于共享 lifecycle / recommendation 能力。
- search index refresh：属于共享 indexing 能力，不是业务扫描管线。
- decay/enhancement/redundancy signal：作为 `incremental-scan` 的证据或 recommendation 输入。

删除 maintenance 管线后，日常经常使用的检查和新扫描只有 `incremental-scan/rescan`。低成本健康检查只是增量扫描和共享管线的一部分，不再单独命名为一条管线。

## 9. 当前实现偏差

### 9.1 错误偏差

- `rescan-internal/external` 仍是旧大编排：snapshotRecipes、rescanClean、项目分析、RelevanceAuditor、gap fill、session/briefing 都在 handler 里。
- 当前 `incremental-correction` 命名错误，语义应改为 `incremental-scan`；当前实现只覆盖 file-event 增量，尚未替代旧 rescan。
- `ScanLifecycleRunner` 仍包含 cold-start/deep-mining 特殊辅助方法，公共生命周期和模式细节混杂。
- `deprecated-cold-start` 仍承担维度执行主体，不是纯废弃代码。
- 曾经把 `ProjectAnalysisPipeline`、`ProjectPhaseRunner`、`ProjectDimensions` 放入 `cold-start` 是错误方向，应归 `scan/project-analysis`。

### 9.2 必须保留的迁移方向

- `ProjectAnalysisPipeline` 应属于共享 `scan/project-analysis`。
- `cold-start` 应只保留一次性数据重建和最小 baseline 执行。
- `rescan` 的新实现必须进入 `incremental-scan`。
- `deprecated-cold-start` 中的 session/checkpoint/briefing/consumer 能力要按职责拆到 `cold-start`、`incremental-scan` 或共享层，不能整包搬进 cold-start。

## 10. 迁移顺序

### M0：冻结命名

- 文档和代码统一：旧 `bootstrap` -> 新 `cold-start`。
- 文档和代码统一：旧 `rescan` -> 新 `incremental-scan`。
- 共享项目事实只能叫 `ProjectAnalysis` / `ProjectFacts`，不能叫 `ColdStartProjectAnalysis`。

验收：

```bash
rg "ColdStartProjectAnalysis|runColdStartProjectAnalysis|ColdStartPhaseRunner|ColdStartDimensions" lib test
```

只能出现明确兼容注释，不能作为新主路径 API。

### M1：拆共享项目事实

- `BootstrapPhaseRunner` -> `scan/project-analysis/ProjectPhaseRunner`。
- `BaseDimensions` -> `scan/project-analysis/ProjectDimensions`。
- `BootstrapProjectAnalysisPipeline` -> `scan/project-analysis/ProjectAnalysisPipeline`。

验收：`cold-start/` 不包含 `project-analysis/` 或 `config/ColdStartDimensions.ts`。

### M2：最小化 cold-start

- 新 `cold-start` 只接收共享 project facts。
- 新 `cold-start` 只负责 baseline builder、dimension executor、baseline projector。
- `bootstrap-internal/external` 变成 adapter。

验收：`cold-start` 不 import `incremental-scan` 或 `deep-mining`。

### M3：让 incremental-scan 替代 rescan

- 新增 `RescanInputAdapter`。
- `rescan-internal/external` 只构造 lifecycle request。
- 将旧 rescan 的 snapshotRecipes、relevance audit、affected dimensions、evolution prescreen 移入 `incremental-scan`。
- 支持 file events 和 manual rescan 两类触发。

验收：`rescan-internal/external` 不再直接调用 project analysis、cleanup、auditor、gap-fill。

### M4：共享 evidence 和 tracking

- 所有 run/evidence/job/recommendation 都在 `scan` 共享层完成。
- 业务管线返回纯结果，不自己落库。

验收：业务管线目录不直接 import scan repositories。

### M5：删除 deprecated 生产路径

- `deprecated-cold-start` 只剩迁移期 adapter 时删除。
- 所有旧 `Bootstrap*` 命名从生产路径消失。

验收：

```bash
rg "deprecated-cold-start|BootstrapWorkflow|fillDimensionsV3" lib test
```

只允许历史文档或迁移说明命中。

## 11. 最终判断标准

实现完成后，读代码应满足下面三句话：

1. 想理解冷启动，只看 `cold-start`，它只负责一次性重新建立数据和 baseline。
2. 想理解 rescan，只看 `incremental-scan`，它替代旧 rescan，也是日常检查和新扫描入口。
3. 想理解共用能力，只看 `scan`，它提供项目事实、证据、生命周期、队列和推荐。

如果某段代码需要同时解释 cold-start 和 rescan，它就不应该放在任一业务管线里，而应该放到共享 `scan` 管线。
