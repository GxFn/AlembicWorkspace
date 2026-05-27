# 基于文件变化驱动的 Recipe 进化管线设计

> 创建日期: 2026-04-29
>
> 状态: 详细设计方案
>
> 前置文档: [incremental-rescan-evolution-pipeline-design.md](./incremental-rescan-evolution-pipeline-design.md)
>
> 目标: 基于现有代码中已成熟的文件变更检测、sourceRef 索引、diff 影响分析等基础设施，设计并实现完整的「文件变化 → 受影响 Recipe → Evolution Agent 决策」进化管线。**RelevanceAuditor 已完全删除**，进化入口改为三层架构：Layer 0 实时工程快决策 + Layer 1 VSCode 弹窗提示 + Layer 2 增量扫描 Agent 分析。

---

## 1. 核心问题

~~当前 rescan 的进化入口是 `RelevanceAuditor.audit()`，它对**所有保留 Recipe** 执行全量启发式评分，产生的 `decay/severe/dead` 判定直接通过 `EvolutionGateway.submit()` 写 `deprecate` proposal。~~

> **✅ 已解决**: `RelevanceAuditor` 已完全删除。进化入口改为三层架构（详见 §17）。

这个路径**原来有**三个致命缺陷（现已消除）：

1. ~~**全量污染**: 没有文件变更的 Recipe 也被扫到，启发式误判扩散到全库。~~ → RecipeImpactPlanner 只处理有变更的文件关联 Recipe
2. ~~**无 diff 证据**: 评分基于静态特征，不知道哪些文件实际变了。~~ → ContentImpactAnalyzer 基于 git diff token 交集
3. ~~**绕过 Agent**: decay/severe 直接写 proposal 到 DB。~~ → 所有进化决策必须经过 Agent 验证

项目中已有的精确变更检测链路现在已经串联完整。

---

## 2. 现有代码基础设施审计

### 2.1 文件快照与 Diff 系统

| 组件 | 文件 | 能力 |
| --- | --- | --- |
| `FileDiffSnapshotStore` | `lib/workflows/capabilities/project-intelligence/FileDiffSnapshotStore.ts` | 基于 SHA-256 hash 的文件指纹存储；`computeDiff()` 产出 `{ added, modified, deleted, unchanged, changeRatio }`；`inferAffectedDimensions()` 推断受影响维度 |
| `FileDiffPlanner` | `lib/workflows/capabilities/project-intelligence/FileDiffPlanner.ts` | 封装 `evaluate()` → 加载 previous snapshot → computeDiff → inferAffectedDimensions；产出 `{ canIncremental, diff, affectedDimensions, restoredEpisodic }` |

**关键接口**:

```ts
interface DiffResult {
  added: string[];
  modified: string[];
  deleted: string[];
  unchanged: string[];
  changeRatio: number;
}
```

### 2.2 SourceRef 索引系统

| 组件 | 文件 | 能力 |
| --- | --- | --- |
| `RecipeSourceRefRepository` | `lib/repository/sourceref/RecipeSourceRefRepository.ts` | `recipe_source_refs` 桥接表 CRUD；`findBySourcePath(path)` 反查关联 Recipe；`findByRecipeId(id)` 正查所有 sourceRef |
| `SourceRefReconciler` | `lib/service/knowledge/SourceRefReconciler.ts` | 从 `reasoning.sources` 填充桥接表；验证路径存在性(active/stale)；`repairRenames()` 通过 git log 检测 rename；`applyRepairs()` 写回 DB + .md |

**数据来源**: `RecipeSnapshotEntry` 已包含 `sourceRefs?: string[]`（从 `reasoning.sources` JSON 解析），以及 `content?: { markdown, rationale, coreCode }`。

### 2.3 Diff 影响分析

| 组件 | 文件 | 能力 |
| --- | --- | --- |
| `ContentImpactAnalyzer` | `lib/service/evolution/ContentImpactAnalyzer.ts` | `assessFileImpact(projectRoot, path, recipeTokens)` → `git diff -U0` → parseDiffHunks → tokenizeDiffLines → 与 Recipe token 交集计算 |
| `extractRecipeTokens` | `lib/shared/recipe-tokens.ts` | 从 Recipe 全字段提取特征标识符集合 |

**分级结果**:

```ts
interface DiffImpactResult {
  level: 'direct' | 'pattern' | 'reference';
  score: number;          // |T_R ∩ T_Δ| / |T_R|
  matchedTokens: string[];
}
```

- `score >= 0.3` → `pattern`（diff 动到了 30%+ 的 Recipe 关键标识符）
- `score > 0` → `reference`（少量命中）
- `score === 0` → `reference`（兜底：至少有 sourceRef 关联）

### 2.4 FileChangeHandler（实时文件变更路径）

`FileChangeHandler`（`lib/service/evolution/FileChangeHandler.ts`）已经实现了：

- `renamed` → ContentPatcher + replaceSourcePath 自动修复
- `deleted` → 检查 remaining active refs，无则 `Gateway.submit(deprecate)`
- `modified` → `assessFileImpact()` → pattern 级别写 `Gateway.submit(update)` proposal

但它是**实时路径**（IDE/HTTP 触发），rescan 没有复用这套逻辑。

### 2.5 Evolution Agent 系统

| 组件 | 文件 | 能力 |
| --- | --- | --- |
| `runEvolutionAudit` | `lib/agent/runs/evolution/EvolutionAgentRun.ts` | 调用 `agentService.run({ profile: 'evolution-audit' })` 执行 Agent |
| `evolution-tools` | `lib/tools/handlers/evolution-tools.ts` | `propose_evolution` / `confirm_deprecation` / `skip_evolution` 三个工具 |
| `EvolutionGateway` | `lib/service/evolution/EvolutionGateway.ts` | 统一决策入口：update → proposal、deprecate → immediate/proposal、valid → verified |

**EvolutionAuditRecipe 接口**（Agent 输入）:

```ts
interface EvolutionAuditRecipe {
  id: string;
  title: string;
  trigger: string;
  content?: { markdown?: string; rationale?: string; coreCode?: string };
  sourceRefs?: string[];
  auditHint?: {
    relevanceScore: number;
    verdict: string;
    evidence: { triggerStillMatches, symbolsAlive, depsIntact, codeFilesExist };
    decayReasons: string[];
  } | null;
}
```

### 2.6 当前 Rescan 流程断点

`InternalKnowledgeRescanWorkflow` 当前流程：

```text
runRescanCleanPolicy          ← 快照 + 清理（清除 bootstrap_snapshots, recipe_source_refs）
  → syncKnowledgeStoreForRescan
  → ProjectIntelligenceCapability.run({ incremental: false })  ← 固定全量
  → auditRecipesForRescan     ← new RelevanceAuditor → Gateway.submit(deprecate)
  → buildRescanPrescreen
  → buildKnowledgeRescanPlan
  → dispatchInternalDimensionExecution
```

**五个断点**：

1. `KnowledgeRescanWorkflowPlan` 中 `scan.incremental` 固定 `false`。
2. `rescanClean()` 不应存在于增量路径——增量管线不需要清理，当前的"先清场再建设"是冷启动思维的遗留（详见 §5）。
3. ~~`auditRecipesForRescan()` 直接 new `RelevanceAuditor` → `Gateway.submit()` 写 proposal。~~ ✅ 已修复：RelevanceAuditor 已删除，函数改为空操作桩。
4. `AgentStageFactoryRegistry` 在 `prescreenDone=true` 时跳过 evolution stage。
5. `evolutionGateEvaluator` 统计 `submit_knowledge with supersedes` 而非 `propose_evolution`。

---

## 3. 目标架构

### 3.1 总体数据流

```text
                    ┌──────────────────────────────────────────────┐
                    │          Rescan Workflow Entry                │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 0: snapshotRecipes()                  │
                    │  → RecipeSnapshot { entries, sourceRefs }    │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 0.5: collectProjectFiles()            │
                    │  → currentFiles[]                            │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 1: evaluateFileDiffPlan()             │
                    │  FileDiffPlanner.evaluate(currentFiles)      │
                    │  → DiffResult { added, modified, deleted }   │
                    │  → affectedDimensions[]                      │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 2: reconcileSourceRefs()              │
                    │  SourceRefReconciler.reconcile()             │
                    │  SourceRefReconciler.repairRenames()         │
                    │  SourceRefReconciler.applyRepairs()          │
                    │  → ReconcileReport + RepairReport            │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 3: buildEvolutionCandidatePlan()      │
                    │  ★ RecipeImpactPlanner.plan()                │
                    │  → EvolutionCandidatePlan {                  │
                    │      candidates[], autoRepairs[],            │
                    │      ignored[], summary{}                    │
                    │    }                                         │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 4: ProjectIntelligenceCapability.run()│
                    │  增量 Phase 1-4 分析（仅受影响文件/维度）      │
                    │  ← 无前置清理，直接分析                       │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 6: runEvolutionAudit(candidates)      │
                    │  ★ 对每个受影响维度调用 Evolution Agent       │
                    │  → EvolutionAuditResult per dimension        │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 7: buildKnowledgeRescanPlan()         │
                    │  evolutionResults + coverage → gap planning  │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │  Phase 8: dispatchInternalDimensionExecution()│
                    │  只处理 gap-fill 维度                         │
                    └──────────────────────────────────────────────┘
```

### 3.2 内部 Rescan 改造后流程

```ts
async function runInternalKnowledgeRescanWorkflow(ctx, args) {
  // Phase 0: 快照（在清理之前）
  const recipeSnapshot = await cleanupService.snapshotRecipes();

  // Phase 0.5: 收集当前文件
  const currentFiles = await collectProjectFiles(projectRoot, scanOptions);

  // Phase 1: 计算文件 diff（需要 previous snapshot，所以必须在 clean 之前）
  const diffPlan = fileDiffPlanner.evaluate(currentFiles, allDimIds);

  // Phase 2: SourceRef 校验修复
  const reconcileReport = await sourceRefReconciler.reconcile({ force: true });
  const repairReport = await sourceRefReconciler.repairRenames();
  await sourceRefReconciler.applyRepairs();

  // Phase 3: 构建进化候选计划（核心新增）
  const candidatePlan = recipeImpactPlanner.plan({
    projectRoot,
    recipeEntries: recipeSnapshot.entries,
    diff: diffPlan.diff,
    sourceRefRepo,
  });

  // Phase 4: 增量 Phase 1-4 分析（无前置清理）
  const phaseResults = await ProjectIntelligenceCapability.run({
    ...scanOptions,
    incremental: true,
    affectedDimensions: diffPlan.affectedDimensions,
  });

  // Phase 5: Evolution Agent 显式调度（核心新增）
  const evolutionResults = {};
  if (candidatePlan.candidates.length > 0) {
    const candidatesByDim = groupCandidatesByDimension(candidatePlan.candidates);
    for (const [dimId, dimCandidates] of candidatesByDim) {
      evolutionResults[dimId] = await runEvolutionAudit({
        agentService,
        recipes: dimCandidates.map(toEvolutionAuditRecipe),
        projectOverview,
        dimensionId: dimId,
        dimensionLabel: `进化审计: ${dimId}`,
      });
    }
  }

  // Phase 6: 知识重扫计划（基于 evolution 结果 + coverage gap）
  const rescanPlan = buildKnowledgeRescanPlan({
    recipeEntries: recipeSnapshot.entries,
    evolutionResults,
    candidatePlan,
    dimensions: allDimensions,
  });

  // Phase 7: Gap-fill 维度执行（只补缺口）
  dispatchInternalDimensionExecution({...gapDimensionsOnly});

  // Phase 8: 保存新 snapshot（不需要前置清理，自动淘汰旧快照）
  fileDiffPlanner.saveSnapshot({...});
}
```

### 3.3 外部 Rescan 改造后流程

```ts
async function runExternalKnowledgeRescanWorkflow(ctx, args) {
  // Phase 0-3: 同内部流程
  const recipeSnapshot = await cleanupService.snapshotRecipes();
  const currentFiles = await collectProjectFiles(projectRoot, scanOptions);
  const diffPlan = fileDiffPlanner.evaluate(currentFiles, allDimIds);
  const candidatePlan = recipeImpactPlanner.plan({...});

  // Phase 4: 增量 Phase 1-4 分析（无前置清理）
  const phaseResults = await ProjectIntelligenceCapability.run({
    ...scanOptions,
    incremental: true,
  });

  // Phase 5: Mission Briefing（把 candidates 传给外部 Agent）
  const briefing = buildExternalMissionBriefing({
    ...existingParams,
    rescan: {
      evolutionCandidatePlan: candidatePlan,
      evidencePlan,
    },
  });

  // 外部 Agent 执行顺序:
  // 1. alembic_evolve(candidates)  → 逐个处理受影响 Recipe
  // 2. alembic_submit_knowledge()  → gap-fill 新知识
  // 3. alembic_dimension_complete()
}
```

---

## 4. 新增核心组件: RecipeImpactPlanner

### 4.1 文件位置

```text
lib/service/evolution/RecipeImpactPlanner.ts
```

### 4.2 核心数据模型

```ts
/** 进化候选计划 */
interface EvolutionCandidatePlan {
  candidates: EvolutionCandidate[];
  autoRepairs: SourceRefRepair[];
  ignored: IgnoredChange[];
  summary: {
    changedFiles: string[];
    affectedRecipeCount: number;
    byReason: Record<EvolutionCandidateReason, number>;
    byDimension: Record<string, number>;
    totalCandidates: number;
    diffStats: {
      added: number;
      modified: number;
      deleted: number;
    };
  };
}

/** 进化候选 */
interface EvolutionCandidate {
  recipeId: string;
  title: string;
  dimensionId: string;
  trigger: string;
  sourceRefs: string[];
  content?: {
    markdown?: string;
    rationale?: string;
    coreCode?: string;
  };
  impact: {
    reason: EvolutionCandidateReason;
    level: 'direct' | 'pattern' | 'reference' | 'unknown';
    changedFiles: string[];
    deletedFiles?: string[];
    renamedFiles?: Array<{ oldPath: string; newPath: string }>;
    score?: number;
    matchedTokens?: string[];
  };
  agentInstruction: string;
}

type EvolutionCandidateReason =
  | 'source-deleted'
  | 'source-deleted-partial'
  | 'source-modified-pattern'
  | 'source-modified-reference'
  | 'source-renamed'
  | 'source-missing';

/** 自动修复记录 */
interface SourceRefRepair {
  recipeId: string;
  oldPath: string;
  newPath: string;
  applied: boolean;
}

/** 被忽略的变更 */
interface IgnoredChange {
  filePath: string;
  reason: string;
}
```

### 4.3 RecipeImpactPlanner 实现伪代码

```ts
class RecipeImpactPlanner {
  plan(opts: {
    projectRoot: string;
    recipeEntries: RecipeSnapshotEntry[];
    diff: DiffResult | null;
    sourceRefRepo?: RecipeSourceRefRepositoryImpl;
  }): EvolutionCandidatePlan {
    // 无 diff → 无候选
    if (!opts.diff) {
      return { candidates: [], autoRepairs: [], ignored: [], summary: emptySummary() };
    }

    const { projectRoot, recipeEntries, diff, sourceRefRepo } = opts;

    // Step 1: 构建 sourceRef → Recipe 反向索引
    const sourceIndex = this.#buildSourceIndex(recipeEntries, sourceRefRepo);

    // Step 2: 收集候选（去重：同一 recipeId 只保留最高优先级 reason）
    const candidateMap = new Map<string, EvolutionCandidate>();
    const autoRepairs: SourceRefRepair[] = [];
    const ignored: IgnoredChange[] = [];

    // 2a. 处理 deleted 文件
    for (const deletedPath of diff.deleted) {
      const affectedRecipes = sourceIndex.findByPath(deletedPath);
      if (affectedRecipes.length === 0) {
        ignored.push({ filePath: deletedPath, reason: 'no-recipe-reference' });
        continue;
      }

      for (const recipe of affectedRecipes) {
        const remainingRefs = recipe.sourceRefs.filter(ref => ref !== deletedPath);
        const allDeleted = remainingRefs.length === 0 ||
          remainingRefs.every(ref => diff.deleted.includes(ref));

        const reason = allDeleted ? 'source-deleted' : 'source-deleted-partial';
        const level = allDeleted ? 'direct' : 'reference';

        this.#upsertCandidate(candidateMap, recipe, {
          reason,
          level,
          changedFiles: [],
          deletedFiles: [deletedPath],
          agentInstruction: allDeleted
            ? `此 Recipe 的所有源文件已被删除(${deletedPath})，请验证知识是否仍有价值，` +
              `或确认废弃。`
            : `此 Recipe 的部分源文件已删除(${deletedPath})，剩余引用: ` +
              `${remainingRefs.join(', ')}。请验证 Recipe 是否需要更新。`,
        });
      }
    }

    // 2b. 处理 modified 文件
    for (const modifiedPath of diff.modified) {
      const affectedRecipes = sourceIndex.findByPath(modifiedPath);
      if (affectedRecipes.length === 0) {
        ignored.push({ filePath: modifiedPath, reason: 'no-recipe-reference' });
        continue;
      }

      for (const recipe of affectedRecipes) {
        const recipeTokens = extractRecipeTokens(recipe);
        const impact = assessFileImpact(projectRoot, modifiedPath, recipeTokens);

        if (!impact) {
          ignored.push({ filePath: modifiedPath, reason: 'no-git-diff' });
          continue;
        }

        if (impact.level === 'pattern') {
          this.#upsertCandidate(candidateMap, recipe, {
            reason: 'source-modified-pattern',
            level: 'pattern',
            changedFiles: [modifiedPath],
            score: impact.score,
            matchedTokens: impact.matchedTokens,
            agentInstruction:
              `文件 ${modifiedPath} 的 diff 命中了此 Recipe 描述的 ` +
              `${(impact.score * 100).toFixed(0)}% 关键标识符` +
              `(${impact.matchedTokens.slice(0, 5).join(', ')})。` +
              `请读取文件验证 Recipe 是否需要更新。`,
          });
        } else if (impact.level === 'reference' && impact.score > 0) {
          this.#upsertCandidate(candidateMap, recipe, {
            reason: 'source-modified-reference',
            level: 'reference',
            changedFiles: [modifiedPath],
            score: impact.score,
            matchedTokens: impact.matchedTokens,
            agentInstruction:
              `文件 ${modifiedPath} 有少量变更命中此 Recipe 的标识符` +
              `(score=${impact.score.toFixed(2)})，可能不影响核心知识。请快速验证。`,
          });
        }
      }
    }

    // 2c. 处理 added 文件 — added 文件不产生 evolution candidate
    //     但可能影响 gap-fill（新维度推断），由 FileDiffPlanner 负责

    // Step 3: 组装结果
    const candidates = [...candidateMap.values()];

    return {
      candidates,
      autoRepairs,
      ignored,
      summary: {
        changedFiles: [...diff.added, ...diff.modified, ...diff.deleted],
        affectedRecipeCount: candidates.length,
        byReason: this.#countByReason(candidates),
        byDimension: this.#countByDimension(candidates),
        totalCandidates: candidates.length,
        diffStats: {
          added: diff.added.length,
          modified: diff.modified.length,
          deleted: diff.deleted.length,
        },
      },
    };
  }
}
```

### 4.4 SourceRef 反向索引构建

```ts
#buildSourceIndex(
  recipeEntries: RecipeSnapshotEntry[],
  sourceRefRepo?: RecipeSourceRefRepositoryImpl
): SourceIndex {
  const pathToRecipes = new Map<string, Set<string>>();
  const recipeMap = new Map<string, RecipeSnapshotEntry>();

  for (const entry of recipeEntries) {
    recipeMap.set(entry.id, entry);

    // 优先从 RecipeSnapshotEntry.sourceRefs（来自 reasoning.sources）
    const refs = entry.sourceRefs || [];
    for (const ref of refs) {
      const normalized = this.#normalizePath(ref);
      if (!pathToRecipes.has(normalized)) {
        pathToRecipes.set(normalized, new Set());
      }
      pathToRecipes.get(normalized)!.add(entry.id);
    }
  }

  // 补充从 recipe_source_refs 表（如果可用且 snapshot 中缺失）
  if (sourceRefRepo) {
    try {
      for (const entry of recipeEntries) {
        if (entry.sourceRefs && entry.sourceRefs.length > 0) continue;
        const dbRefs = sourceRefRepo.findByRecipeId(entry.id);
        for (const ref of dbRefs) {
          if (ref.status !== 'stale') {
            const normalized = this.#normalizePath(ref.sourcePath);
            if (!pathToRecipes.has(normalized)) {
              pathToRecipes.set(normalized, new Set());
            }
            pathToRecipes.get(normalized)!.add(entry.id);
          }
        }
      }
    } catch {
      // sourceRefRepo 不可用时静默降级
    }
  }

  return {
    findByPath(path: string): RecipeSnapshotEntry[] {
      const normalized = normalizePath(path);
      const ids = pathToRecipes.get(normalized) || new Set();
      return [...ids].map(id => recipeMap.get(id)!).filter(Boolean);
    },
  };
}
```

### 4.5 Candidate 优先级合并

当同一个 Recipe 被多个变更文件命中时，保留最高优先级的 reason：

```ts
const REASON_PRIORITY: Record<EvolutionCandidateReason, number> = {
  'source-deleted': 6,
  'source-deleted-partial': 5,
  'source-modified-pattern': 4,
  'source-renamed': 3,
  'source-modified-reference': 2,
  'source-missing': 1,
};

#upsertCandidate(
  map: Map<string, EvolutionCandidate>,
  recipe: RecipeSnapshotEntry,
  impact: Partial<EvolutionCandidate['impact']> & { agentInstruction: string }
) {
  const existing = map.get(recipe.id);
  if (existing) {
    const existingPriority = REASON_PRIORITY[existing.impact.reason];
    const newPriority = REASON_PRIORITY[impact.reason!];

    if (newPriority > existingPriority) {
      // 升级 reason，合并 changedFiles
      existing.impact = {
        ...existing.impact,
        ...impact,
        changedFiles: [...new Set([
          ...existing.impact.changedFiles,
          ...(impact.changedFiles || []),
        ])],
        deletedFiles: [...new Set([
          ...(existing.impact.deletedFiles || []),
          ...(impact.deletedFiles || []),
        ])],
      };
      existing.agentInstruction = impact.agentInstruction;
    } else {
      // 只合并文件列表
      existing.impact.changedFiles = [...new Set([
        ...existing.impact.changedFiles,
        ...(impact.changedFiles || []),
      ])];
    }
    return;
  }

  map.set(recipe.id, {
    recipeId: recipe.id,
    title: recipe.title,
    dimensionId: recipe.knowledgeType || 'unknown',
    trigger: recipe.trigger,
    sourceRefs: recipe.sourceRefs || [],
    content: recipe.content,
    impact: {
      reason: impact.reason!,
      level: impact.level!,
      changedFiles: impact.changedFiles || [],
      deletedFiles: impact.deletedFiles,
      renamedFiles: impact.renamedFiles,
      score: impact.score,
      matchedTokens: impact.matchedTokens,
    },
    agentInstruction: impact.agentInstruction,
  });
}
```

### 4.6 进入 Agent 的默认策略

| impact reason | 默认行为 | 理由 |
| --- | --- | --- |
| `source-deleted` | 进入 Agent | 所有源文件丢失，需要 Agent 确认废弃 |
| `source-deleted-partial` | 进入 Agent | 部分源文件丢失，需要 Agent 判断影响 |
| `source-modified-pattern` | 进入 Agent | diff 命中 30%+ 关键标识符，高概率需要更新 |
| `source-renamed` | 自动修复 | SourceRefReconciler 已处理，不进 Agent |
| `source-modified-reference` | 记录 hint | 低影响，只在 full-audit 模式下进 Agent |
| `source-missing` | 进入 Agent | sourceRef 路径验证失效（首次 rescan 或路径失活）|

---

## 5. 管线拆分: 冷启动 vs 增量 vs 强制重扫

> **核心结论：增量管线不需要清理。**
>
> 之前冷启动和增量没有拆分清楚——`rescanClean()` 本质是一个"弱化版 fullReset"，
> 先删后建、再从零分析，把 rescan 变成了"保留 Recipe 的二次冷启动"。
> 真正的增量管线应该是**纯追加/更新**的——读取现有状态 → 计算 diff → 只处理变化 → 写入新状态。
> 不需要任何前置清理步骤。

### 5.1 问题根源：当前 rescan 是"伪增量"

审计现有代码发现：**rescan workflow 本质上在做一次"有 Recipe 遗产的冷启动"**。

```text
当前 rescan 实际执行路径:

  snapshotRecipes()           → 把 Recipe 数据拍快照到内存
  rescanClean()               → 删除 10 张表 + 清空 candidates/skills/wiki/向量索引
  syncKnowledgeStoreForRescan → 恢复 Recipe 文件↔DB 一致性
  Phase 1-4 全量分析           → 重新扫描所有文件（incremental: false 写死）
  auditRecipesForRescan       → 空桩（RelevanceAuditor 已删）
  buildKnowledgeRescanPlan    → 计算 gap 维度
  dimension execution         → 对 gap 维度执行 AI 补齐
```

这条路径有三个设计缺陷：

| 缺陷 | 表现 | 根因 |
| --- | --- | --- |
| **删后建** | `rescanClean()` 先删 `bootstrap_snapshots`/`recipe_source_refs`/`bootstrap_dim_files`，再做全量分析 | rescan 沿用冷启动的"先清场再建设"思路 |
| **分析永远全量** | `KnowledgeRescanWorkflowPlan` 中 `incremental: false` 写死 | 因为 snapshot 被删了，`FileDiffPlanner` 找不到上次快照，只能 fallback 全量 |
| **进化靠猜** | `auditRecipesForRescan()` 原来是 `RelevanceAuditor` 全量扫描，现在是空桩 | 没有 diff 信息，只能启发式猜测哪些 Recipe 过时 |

**`rescanClean()` 删除的 10 张表**：

```ts
const RESCAN_CLEAN_TABLES = [
  'bootstrap_dim_files',     // ← 增量 diff 需要（维度→文件映射）
  'recipe_source_refs',      // ← sourceRef 反查需要（Recipe→源文件映射）
  'bootstrap_snapshots',     // ← 增量 diff 需要（上次文件指纹）
  'code_entities',           // 纯缓存，Phase 2 会重建
  'guard_violations',        // 纯缓存，Phase 3 会重建
  'semantic_memories',       // Agent 会话记忆
  'sessions',                // Agent 会话元数据
  'audit_logs',              // 操作日志
  'remote_commands',         // 瞬态
  'remote_state',            // 瞬态
];
```

前 3 张正是增量管线的核心输入，删掉它们等于自毁增量能力。

### 5.2 设计原则：三条管线、三种清理策略

| 管线 | 触发方式 | 清理策略 | 分析模式 | 进化方式 |
| --- | --- | --- | --- | --- |
| **冷启动** | `alembic bootstrap` | `fullReset()` — 全清 13 表 + 垃圾桶备份 | 全量 Phase 1-4 | 无（从零建设） |
| **增量 rescan** | `alembic rescan` | **无清理** — 直接读取现有状态 | 增量 Phase 1-4（只分析变化文件） | diff-driven：FileDiff → SourceRef → ImpactPlan → Agent |
| **强制重扫** | `alembic rescan --force` | `forceRescanClean()` — 清 7 张衍生表，保留增量证据 | 全量 Phase 1-4 | 同增量，但基于全量重新分析 |

### 5.3 冷启动管线（不变）

```text
ColdStart Pipeline:
  ┌──────────────────────────────────────┐
  │  fullReset()                          │
  │  • ALL_DATA_TABLES 13 表全清          │
  │  • candidates/recipes/skills/wiki/    │
  │    移入垃圾桶                          │
  │  • 向量索引清空                        │
  └────────────────┬─────────────────────┘
                   ▼
  ┌──────────────────────────────────────┐
  │  Phase 1-4 全量分析                   │
  │  • 文件收集 → AST → 依赖 → Guard     │
  │  • incremental: false（无历史数据）    │
  └────────────────┬─────────────────────┘
                   ▼
  ┌──────────────────────────────────────┐
  │  Dimension Execution                  │
  │  • 全部维度从零执行                    │
  │  • 产出 Recipe + Skill                │
  └────────────────┬─────────────────────┘
                   ▼
  ┌──────────────────────────────────────┐
  │  FileDiffSnapshotStore.save()        │
  │  • 保存首次文件指纹快照               │
  │  • 为后续增量 rescan 建立基线         │
  └──────────────────────────────────────┘
```

**现有代码**：`InternalColdStartWorkflow` / `ExternalColdStartWorkflow` 已经正确实现。

### 5.4 增量 rescan 管线（重新设计）

**核心理念：增量管线不清理、只读取→计算→更新。**

```text
Incremental Rescan Pipeline:
  ┌──────────────────────────────────────────────────────┐
  │  Step 0: 读取现有状态（不修改任何数据）                │
  │                                                       │
  │  snapshotRecipes()                                    │
  │  → 从 knowledge_entries 读取活跃 Recipe 到内存         │
  │                                                       │
  │  FileDiffPlanner.evaluate()                           │
  │  → 从 bootstrap_snapshots 读取上次文件指纹             │
  │  → 扫描当前文件 → computeDiff(added/modified/deleted) │
  │  → inferAffectedDimensions() 定位受影响维度            │
  │                                                       │
  │  没有上次快照？ → 自动降级为强制重扫（见 5.5）         │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 1: 增量进化分析                                 │
  │                                                       │
  │  SourceRefReconciler.reconcile()                      │
  │  → 读取 recipe_source_refs                            │
  │  → 校验路径、修复 rename、标记 stale                   │
  │                                                       │
  │  RecipeImpactPlanner.plan(diff, sourceRefs)           │
  │  → 对 diff.modified 文件反查关联 Recipe                │
  │  → ContentImpactAnalyzer 评估影响等级                  │
  │  → 输出 EvolutionCandidatePlan[]                      │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 2: 增量 Phase 1-4 分析（仅受影响文件/维度）      │
  │                                                       │
  │  ProjectIntelligenceCapability.run({                   │
  │    incremental: true,                                 │
  │    affectedDimensions: diff.affectedDims              │
  │  })                                                   │
  │  → code_entities/guard_violations 增量更新（非全清重建）│
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 3: Agent 验证 + Gap Fill                        │
  │                                                       │
  │  runEvolutionAudit(candidates)                        │
  │  → Agent 读源码验证每个候选，决定 update/deprecate/skip│
  │                                                       │
  │  Gap Analysis → Dimension Execution                   │
  │  → 只对受影响维度执行 AI 补齐                          │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 4: 写入新状态                                   │
  │                                                       │
  │  FileDiffSnapshotStore.save()                         │
  │  → 保存新文件指纹快照（自动淘汰旧快照，MAX_SNAPSHOTS=5）│
  │                                                       │
  │  SourceRefReconciler.persist()                        │
  │  → upsert 更新 recipe_source_refs                     │
  │                                                       │
  │  EvolutionGateway.submit()                            │
  │  → 写入 evolution_proposals                           │
  └──────────────────────────────────────────────────────┘
```

**关键点**：

| 维度 | 说明 |
| --- | --- |
| **前置清理** | **无**。直接从 DB 读取上次状态 |
| **DB 表** | 全部保留，只做增量 upsert / update |
| **文件系统** | `recipes/` 保留、`candidates/` 保留（新候选追加）、`skills/` `wiki/` 保留 |
| **向量索引** | 不清空，由 SyncCoordinator 增量更新 |
| **Phase 1-4** | `incremental: true`，只重新分析 diff 中的 added/modified 文件 |
| **Snapshot 生命周期** | `FileDiffSnapshotStore` MAX_SNAPSHOTS=5 自动淘汰 |
| **SourceRef 生命周期** | `SourceRefReconciler` upsert 模式，路径失效标 `stale` |
| **知识条目** | `pending/rejected` 条目不主动清理——它们是上次未完成的工作，可能仍需处理 |

### 5.5 强制重扫管线（`--force` 模式）

用于用户认为知识库状态不一致或需要全面重新审视的场景。

```text
Force Rescan Pipeline:
  ┌──────────────────────────────────────────────────────┐
  │  Step 0: 清理会话态缓存（保留增量证据）               │
  │                                                       │
  │  forceRescanClean():                                  │
  │  • 清除 code_entities, guard_violations               │  ← Phase 1-4 会全量重建
  │  • 清除 semantic_memories, sessions                    │  ← Agent 会话数据过期
  │  • 清除 audit_logs, remote_commands, remote_state      │  ← 瞬态日志
  │  • 清除 tasks/task_dependencies/task_events            │  ← 上次会话任务
  │  • 清除 pending/rejected/deprecated knowledge_entries  │  ← 旧候选
  │  • 清空 candidates/ skills/ wiki/ 向量索引             │  ← 全量重建
  │  •                                                     │
  │  • 保留 bootstrap_snapshots ✅                         │  ← diff 的参照物
  │  • 保留 bootstrap_dim_files ✅                         │  ← 维度映射
  │  • 保留 recipe_source_refs  ✅                         │  ← sourceRef 索引
  │  • 保留 knowledge_entries (active/published/staging) ✅│  ← Recipe 知识
  │  • 保留 knowledge_edges, evolution_proposals ✅         │  ← 进化记录
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 1: 全量分析 + diff 对比                         │
  │                                                       │
  │  FileDiffPlanner.evaluate()                           │
  │  → 读取上次快照 → 计算 diff（但不缩小分析范围）        │
  │                                                       │
  │  Phase 1-4 全量分析                                   │
  │  → incremental: false，全部文件重新分析                │
  │  → 但 diff 信息仍用于 RecipeImpactPlanner              │
  └──────────────────────┬───────────────────────────────┘
                         ▼
  ┌──────────────────────────────────────────────────────┐
  │  Step 2-4: 同增量管线的 Step 1-4                      │
  │  SourceRef → ImpactPlan → Agent → Gap Fill → Save    │
  └──────────────────────────────────────────────────────┘
```

**与增量管线的区别**：
- 有前置清理（清会话态缓存）
- Phase 1-4 全量执行（不跳过未变化文件）
- 但仍保留增量证据表，仍使用 diff 驱动进化分析

### 5.6 三种模式的 DB 表处理汇总

| 表名 | 冷启动 `fullReset` | 增量 rescan | 强制重扫 `--force` | 说明 |
| --- | --- | --- | --- | --- |
| `bootstrap_snapshots` | 🗑 全清 | ✅ 保留 | ✅ 保留 | diff 参照物 |
| `bootstrap_dim_files` | 🗑 全清 | ✅ 保留 | ✅ 保留 | 维度→文件映射 |
| `recipe_source_refs` | 🗑 全清 | ✅ 保留 | ✅ 保留 | Recipe→源文件索引 |
| `knowledge_entries` | 🗑 全清 | ✅ 保留全部 | ⚠️ 清 pending/rejected/deprecated | 知识条目 |
| `knowledge_edges` | 🗑 全清 | ✅ 保留 | ✅ 保留 | 知识边 |
| `evolution_proposals` | 🗑 全清 | ✅ 保留 | ✅ 保留 | 进化提案记录 |
| `lifecycle_transition_events` | 🗑 全清 | ✅ 保留 | ✅ 保留 | 生命周期日志 |
| `code_entities` | 🗑 全清 | ✅ 增量更新 | 🗑 全清重建 | AST 衍生 |
| `guard_violations` | 🗑 全清 | ✅ 增量更新 | 🗑 全清重建 | Guard 衍生 |
| `semantic_memories` | 🗑 全清 | ✅ 保留 | 🗑 全清 | Agent 记忆 |
| `sessions` | 🗑 全清 | ✅ 保留 | 🗑 全清 | 会话元数据 |
| `audit_logs` | 🗑 全清 | ✅ 保留 | 🗑 全清 | 操作日志 |
| `remote_commands` | 🗑 全清 | ✅ 保留 | 🗑 全清 | 瞬态 |
| `remote_state` | 🗑 全清 | ✅ 保留 | 🗑 全清 | 瞬态 |

### 5.7 对现有代码的影响

#### `CleanupService` 改造

```ts
// 现有方法保留:
fullReset()    // 冷启动用，不变

// 现有方法废弃:
rescanClean()  // @deprecated — 增量管线不再调用

// 新增方法:
forceRescanClean()  // 强制重扫用：清会话态缓存，保留增量证据
```

#### `WorkflowCleanupPolicies` 改造

```ts
// 现有:
runFullResetPolicy(ctx)    // 冷启动路径调用，不变

// 废弃:
runRescanCleanPolicy(ctx)  // @deprecated — 增量路径不再调用

// 新增:
runForceRescanCleanPolicy(ctx)  // 强制重扫路径调用
```

#### `KnowledgeRescanIntent` 改造

```ts
interface KnowledgeRescanWorkflowIntent {
  kind: 'knowledge-rescan';
  // ...
  analysisMode: 'incremental' | 'full';   // 替代固定的 'full'
  cleanupPolicy: 'none' | 'force-rescan'; // 替代固定的 'rescan-clean'
  // ...
}
```

#### `KnowledgeRescanWorkflowPlan` 改造

```ts
// Before:
const scan: ProjectAnalysisScanOptions = {
  incremental: false,  // ← 写死
};

// After:
const scan: ProjectAnalysisScanOptions = {
  incremental: intent.analysisMode === 'incremental',  // 由 intent 决定
};
```

#### `InternalKnowledgeRescanWorkflow` 改造

```ts
// Before:
//   Step 1: runRescanCleanPolicy()    ← 清理
//   Step 3: Phase 1-4 全量分析        ← 永远全量
//   Step 4: auditRecipesForRescan()  ← 空桩

// After (增量模式):
//   Step 0: snapshotRecipes()           ← 读取 Recipe 到内存（不清理）
//   Step 0: FileDiffPlanner.evaluate()  ← 读取上次快照 → 计算 diff
//   Step 1: SourceRefReconciler         ← 校验+更新 sourceRef
//   Step 1: RecipeImpactPlanner         ← diff + sourceRef → candidates
//   Step 2: Phase 1-4 增量分析          ← 只分析 diff 中的文件
//   Step 3: runEvolutionAudit()         ← Agent 验证候选
//   Step 4: gap-fill + save snapshot    ← 更新状态

// After (强制重扫模式):
//   Step 0: forceRescanClean()          ← 只清会话态缓存
//   Step 0: snapshotRecipes()           ← 读取 Recipe
//   Step 0: FileDiffPlanner.evaluate()  ← 计算 diff（但不限制分析范围）
//   ... 后续同增量
```

### 5.8 数据生命周期管理（不靠清理，靠内建淘汰）

| 数据 | 淘汰机制 | 说明 |
| --- | --- | --- |
| `bootstrap_snapshots` | `FileDiffSnapshotStore` 内置 MAX_SNAPSHOTS=5，`save()` 时自动淘汰最旧快照 | 容量控制 |
| `bootstrap_dim_files` | 随 snapshot 的 CASCADE DELETE 自动清理 | FK 级联 |
| `recipe_source_refs` | `SourceRefReconciler.reconcile()` 以 upsert 模式维护，路径失效标 `stale`；`fullReset()` 全清 | 增量更新 |
| `code_entities` | Phase 2 AST 分析时，增量模式 upsert 更新变化文件的实体 | 覆盖写 |
| `knowledge_entries` | 进化管线通过 `confirm_deprecation` 标记 deprecated → 下次 `fullReset` 清除 | 进化驱动 |
| `evolution_proposals` | 完成的 proposal 自然归档，不需要主动清理 | 审计留痕 |

### 5.9 `rescanClean()` 的最终定性

| 问题 | 结论 |
| --- | --- |
| `rescanClean` 在清理什么？ | 10 张 DB 表（含 3 张增量关键表）+ 4 个目录 + 向量索引 + 报告文件 |
| 冷启动和增量已拆分，`rescanClean` 是否合适？ | **不合适**。它是冷启动思维的遗留——"先清场再建设"。增量管线应该是"读取→计算→更新"，不需要清理 |
| 修改方案？ | 增量路径移除 `rescanClean` 调用；新增 `forceRescanClean()` 供 `--force` 模式使用（只清会话态，保留增量证据） |
| `rescanClean()` 是否保留？ | `@deprecated`。现有两个调用方（Internal/External RescanWorkflow）切换到新路径后可删除 |

---

## 6. KnowledgeRescanWorkflowPlan 改造

### 6.1 开启增量扫描支持

```ts
// Before:
const scan: ProjectAnalysisScanOptions = {
  // ...
  incremental: false,  // ← 固定全量
};

// After:
const scan: ProjectAnalysisScanOptions = {
  // ...
  incremental: intent.incremental ?? true,  // 默认开启增量
};
```

### 6.2 新增 evolution planning 配置

```ts
interface KnowledgeRescanWorkflowPlan {
  intent: KnowledgeRescanWorkflowIntent;
  cleanup: {
    policy: 'rescan-clean-derived';  // ← 改为只清衍生缓存
    projectRoot: string;
  };
  evolutionPlanning: {                // ← 新增
    enabled: boolean;
    candidateThresholds: {
      patternScoreMin: number;        // default 0.3
      referenceScoreMin: number;      // default 0 (记录但不进 Agent)
      includeReference: boolean;      // default false
    };
    agentEnabled: boolean;            // 是否调用 Evolution Agent
    staleRefDetectionEnabled: boolean; // 是否在无 diff 时通过 SourceRefReconciler 检测 stale refs
  };
  projectAnalysis: {
    projectRoot: string;
    prepare: ProjectAnalysisPreparationOptions;
    scan: ProjectAnalysisScanOptions;
    materialize: ProjectAnalysisMaterializationPlan;
  };
  response: { tool: string };
}
```

---

## 7. Evolution Agent 调度改造

### 7.1 内部 Rescan: 显式 Evolution Pass

在 `InternalKnowledgeRescanWorkflow` 中，Phase 6 改为:

```ts
// Phase 6: Evolution Agent 显式调度
if (candidatePlan.candidates.length > 0) {
  const candidatesByDim = groupCandidatesByDimension(candidatePlan.candidates);

  for (const [dimId, dimCandidates] of Object.entries(candidatesByDim)) {
    // 只对 pattern 和 direct 级别的候选调 Agent
    const agentCandidates = dimCandidates.filter(c =>
      c.impact.level === 'direct' || c.impact.level === 'pattern'
    );

    if (agentCandidates.length === 0) continue;

    const result = await runEvolutionAudit({
      agentService,
      recipes: agentCandidates.map(c => ({
        id: c.recipeId,
        title: c.title,
        trigger: c.trigger,
        content: c.content,
        sourceRefs: c.sourceRefs,
        // 新增: 传入文件变更证据供 Agent 参考
        impactEvidence: {
          reason: c.impact.reason,
          changedFiles: c.impact.changedFiles,
          deletedFiles: c.impact.deletedFiles,
          matchedTokens: c.impact.matchedTokens,
          score: c.impact.score,
          agentInstruction: c.agentInstruction,
        },
      })),
      projectOverview,
      dimensionId: dimId,
      dimensionLabel: `进化审计: ${dimId} (${agentCandidates.length} candidates)`,
    });

    evolutionResults[dimId] = result;
  }
}
```

### 7.2 EvolutionAuditRecipe 接口扩展

```ts
export interface EvolutionAuditRecipe {
  id: string;
  title: string;
  trigger: string;
  content?: { markdown?: string; rationale?: string; coreCode?: string };
  sourceRefs?: string[];
  auditHint?: {
    relevanceScore: number;
    verdict: string;
    evidence: Record<string, unknown>;
    decayReasons: string[];
  } | null;
  // 新增: 文件变更影响证据
  impactEvidence?: {
    reason: EvolutionCandidateReason;
    changedFiles: string[];
    deletedFiles?: string[];
    matchedTokens?: string[];
    score?: number;
    agentInstruction: string;
  };
}
```

### 7.3 外部 Rescan: Mission Briefing 增强

```ts
interface RescanBriefingInput {
  // 新增: 基于文件变更的进化候选
  evolutionCandidatePlan: EvolutionCandidatePlan;
  // 原有
  evidencePlan: ExternalRescanEvidencePlan;
  // 降级为 fallback
  prescreen?: EvolutionPrescreen;
}
```

Mission Briefing 中 `evolutionCandidatePlan` 的呈现格式:

```markdown
## Evolution Candidates (文件变更驱动)

以下 Recipe 的源文件发生了变更，需要你逐一验证并做出进化决策:

### source-deleted (2)
1. **Recipe: API 响应模型规范** (recipe_abc123)
   - 源文件 `src/models/Response.swift` 已删除
   - 操作: 请使用 `alembic_evolve` 验证是否仍有价值，或调用 `confirm_deprecation` 废弃

### source-modified-pattern (3)
1. **Recipe: 网络请求错误处理** (recipe_def456)
   - 文件 `src/network/ErrorHandler.ts` 的 diff 命中 45% 关键标识符
   - 匹配 tokens: ErrorHandler, NetworkError, retryPolicy
   - 操作: 请读取文件，使用 `propose_evolution` 提交更新建议

## Gap-fill Dimensions
... (覆盖缺口维度列表)
```

### 7.4 evolutionGateEvaluator 修正

```ts
// Before: 统计 submit_knowledge with supersedes
const evolved = toolCalls.filter(tc => {
  const tool = tc.tool || tc.name;
  return tool === 'submit_knowledge' && tc.args?.supersedes;
}).length;

// After: 统计 propose_evolution
const evolved = toolCalls.filter(tc => {
  const tool = tc.tool || tc.name;
  return tool === 'propose_evolution';
}).length;
```

---

## 8. AgentStageFactoryRegistry 改造

### 8.1 当前逻辑的问题

```ts
// 当前: prescreenDone 为 true 时跳过 evolution stage
if (hasExistingRecipes && !prescreenDone) {
  return [evolutionStages..., analyzeStage, ..., produceStage, ...];
}
// rescan 总是传入 evolutionPrescreen → prescreenDone = true → 跳过
```

### 8.2 改造方案

bootstrap-dimension pipeline 不再隐式决定是否插入 evolution stage。Evolution pass 由 rescan workflow **在 pipeline 之前显式调度**。

```ts
// After: evolution pass 与 dimension pipeline 解耦
this.register('bootstrapDimensionPipeline', ({ params, context }) => {
  const needsCandidates = params.needsCandidates !== false;

  // Evolution stage 不再由 pipeline 管理
  // 它由 rescan workflow 显式调用 runEvolutionAudit() 完成

  if (!needsCandidates) {
    return [analyzeStage];
  }

  // 标准 pipeline: analyze → gate → produce → submit
  return [analyzeStage, gateStage, produceStage, submitStage];
});
```

---

## 9. RelevanceAuditor 已删除

### 9.1 删除决策

`RelevanceAuditor` **已完全删除**，不再保留为 fallback。理由：

1. **全量启发式评分已被精确替代**：`RecipeImpactPlanner` 基于 `DiffResult` + `sourceRef` 反向索引精确定位受影响 Recipe，不需要对全库做猜测性评分。
2. **直接写 proposal 是反模式**：`RelevanceAuditor.#executeDecay()` 绕过 Agent 直接调 `EvolutionGateway.submit(deprecate)`，违背"进化决策必须经过 Agent 验证"的原则。
3. **无 diff 场景有更好的替代方案**：首次 rescan 无 snapshot 时，可基于 `SourceRefReconciler.reconcile()` 的路径存活检测 + `source-missing` 候选类别覆盖，无需启发式评分。

### 9.2 删除文件清单

| 文件 | 操作 |
| --- | --- |
| `lib/service/evolution/RelevanceAuditor.ts` | **删除** |
| `test/unit/RelevanceAuditor.test.ts` | **删除** |

### 9.3 受影响文件修改

| 文件 | 修改 |
| --- | --- |
| `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts` | `auditRecipesForRescan()` 改为返回空结果的桩函数；`RelevanceAuditSummary`/`RelevanceAuditResult` 类型定义移到本文件 |
| `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts` | import 路径改为从 `KnowledgeRescanPlanner` 导入类型 |
| `lib/workflows/capabilities/planning/knowledge/RescanEvidenceProjectors.ts` | import 路径改为从 `KnowledgeRescanPlanner` 导入类型 |
| `lib/workflows/capabilities/planning/knowledge/EvolutionPrescreen.ts` | import 路径改为从 `KnowledgeRescanPlanner` 导入类型 |
| `lib/workflows/knowledge-rescan/KnowledgeRescanPresenters.ts` | import 路径改为从 `KnowledgeRescanPlanner` 导入类型 |

### 9.4 首次 Rescan 无 Snapshot 的处理

当 `FileDiffPlanner.evaluate()` 返回 `canIncremental=false`（无 previous snapshot）时：

```ts
if (!diffPlan.canIncremental) {
  // 首次 rescan: 无 diff → RecipeImpactPlanner 返回 0 candidates
  // 但仍然执行 SourceRefReconciler.reconcile() 校验路径存活性
  // 路径失效的 Recipe 以 'source-missing' 候选进入 Agent 验证
  const reconcileReport = await sourceRefReconciler.reconcile({ force: true });
  for (const staleRef of reconcileReport.staleRefs) {
    // 通过 sourceRefRepo 找到关联 Recipe → 标记为 source-missing 候选
    candidatePlan.candidates.push({
      recipeId: staleRef.recipeId,
      impact: { reason: 'source-missing', level: 'reference', changedFiles: [] },
      agentInstruction: `此 Recipe 的源引用 ${staleRef.path} 已不存在，请验证知识是否仍有价值。`,
    });
  }
}
```

这比 RelevanceAuditor 的全量启发式评分更精确：只有 **sourceRef 路径确实不存在** 的 Recipe 才进入进化审计，而非对全库做猜测性评分。

---

## 10. FileChangeHandler 与 RecipeImpactPlanner 统一

### 10.1 复用 candidate builder

`FileChangeHandler.handleFileChanges()` 的 modified 处理逻辑与 `RecipeImpactPlanner.plan()` 的 modified 处理逻辑高度相似。统一为:

```ts
// FileChangeHandler 复用 RecipeImpactPlanner 的影响评估
async #handleModifiedViaImpactPlanner(
  events: FileChangeEvent[]
): Promise<EvolutionCandidatePlan> {
  const diff: DiffResult = {
    added: events.filter(e => e.type === 'created').map(e => e.path),
    modified: events.filter(e => e.type === 'modified').map(e => e.path),
    deleted: events.filter(e => e.type === 'deleted').map(e => e.path),
    unchanged: [],
    changeRatio: 0,
  };

  return this.#recipeImpactPlanner.plan({
    projectRoot: this.#projectRoot,
    recipeEntries: await this.#snapshotCurrentRecipes(),
    diff,
    sourceRefRepo: this.#sourceRefRepo,
  });
}
```

### 10.2 保留原有 renamed 和 deleted 的自动处理

`FileChangeHandler` 的 `renamed` 自动修复和 `deleted` 自动废弃逻辑保持不变，因为它们是**实时路径**（IDE 文件变更事件触发），需要快速响应。

`RecipeImpactPlanner` 用于**批量路径**（rescan 时基于快照 diff），候选收集后统一交给 Agent 处理。

---

## 11. 数据流对比

### 11.1 当前

```text
all recipes
  → RelevanceAuditor.audit()
    → heuristic score (trigger match, symbol alive, deps intact, code files exist)
    → decay/severe/dead verdict
    → Gateway.submit(deprecate) ← 直接写 proposal！
  → prescreen → pipeline (可能跳过 evolution stage)
  → gap-fill
```

**风险**: 全量启发式误判 → 所有 Recipe 被污染 → DB 中出现大量误报 proposal。

### 11.2 目标

```text
changed files (from FileDiffPlanner)
  → sourceRef reverse index (from RecipeSnapshotEntry.sourceRefs)
  → impacted recipes only
  → ContentImpactAnalyzer: diff tokens ∩ recipe tokens
  → EvolutionCandidatePlan (candidates grouped by dimension)
  → Evolution Agent reads real code
    → propose_evolution / confirm_deprecation / skip_evolution
    → EvolutionGateway writes decisions
  → gap-fill only covers missing dimensions
```

**收益**:

| 维度 | 当前 | 目标 |
| --- | --- | --- |
| 进入进化审计的 Recipe 范围 | 全部 | 仅受文件变更影响的 |
| 进化决策来源 | 启发式评分 | Agent 读取真实源码 |
| 误判半径 | 全库 | 变更文件关联的 Recipe |
| proposal 来源 | RelevanceAuditor 直接写 | 仅 Agent/MCP 决策 |
| 无变更 Recipe | 也被扫到 | 不进入 evolution pass |
| RelevanceAuditor | 全量启发式评分，直接写 proposal | **已删除**，替代为 RecipeImpactPlanner + Agent |

---

## 12. 需要调整的文件清单

### 12.1 新增

| 文件 | 作用 |
| --- | --- |
| `lib/service/evolution/RecipeImpactPlanner.ts` | 基于 diff + sourceRefs 生成 EvolutionCandidatePlan |
| `test/unit/RecipeImpactPlanner.test.ts` | 覆盖 modified/deleted/renamed/reference/no-change 场景 |

### 12.2 修改

| 文件 | 修改点 | 优先级 |
| --- | --- | --- |
| `lib/service/cleanup/CleanupService.ts` | `rescanClean()` 标记 `@deprecated`；新增 `forceRescanClean()` 保留增量证据 | P1 |
| `lib/workflows/capabilities/cleanup/WorkflowCleanupPolicies.ts` | 废弃 `runRescanCleanPolicy`；新增 `runForceRescanCleanPolicy`；增量路径不调用任何清理 | P1 |
| `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts` | `analysisMode` 改为 `'incremental' \| 'full'`；`cleanupPolicy` 改为 `'none' \| 'force-rescan'` | P1 |
| `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts` | `scan.incremental` 由 intent 决定（不再写死 `false`） | P1 |
| `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts` | 增量模式移除清理调用；Phase 0 读取现有状态 → diff → sourceRef → candidate planning → 增量分析 | P1 |
| `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts` | Briefing 输出 `evolutionCandidatePlan` | P2 |
| `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts` | `auditRecipesForRescan` 改为空操作桩；类型定义移入 | P0 ✅ |
| `lib/workflows/capabilities/planning/knowledge/RescanEvidenceProjectors.ts` | allRecipes 改为 candidates + coverage gap 两类视图 | P2 |
| `lib/agent/profiles/AgentStageFactoryRegistry.ts` | pipeline 不再根据 `prescreenDone` 决定 evolution stage | P2 |
| `lib/agent/prompts/insight-gate.ts` | `evolutionGateEvaluator` 统计 `propose_evolution` | P2 |
| `lib/agent/runs/evolution/EvolutionAgentRun.ts` | `EvolutionAuditRecipe` 接口扩展 `impactEvidence` | P1 |
| `lib/service/evolution/FileChangeHandler.ts` | modified 影响分析复用 `RecipeImpactPlanner` | P3 |
| `lib/service/evolution/RelevanceAuditor.ts` | **已删除**（§9） | P0 ✅ |
| `test/unit/RelevanceAuditor.test.ts` | **已删除** | P0 ✅ |

---

## 13. 实施阶段

### P0: 止血 — 完全删除 RelevanceAuditor ✅ 已完成

**目标**: 消除全量启发式误判对 DB 的污染，彻底移除 RelevanceAuditor。

**改动**:

1. ✅ 删除 `lib/service/evolution/RelevanceAuditor.ts` 和 `test/unit/RelevanceAuditor.test.ts`。
2. ✅ `auditRecipesForRescan()` 改为返回空结果的桩函数，保留签名兼容性。
3. ✅ `RelevanceAuditSummary`/`RelevanceAuditResult` 类型定义移入 `KnowledgeRescanPlanner.ts`。
4. ✅ 所有引用文件 import 路径更新。

**验证**: rescan 后 `evolution_proposals` 表不再新增任何 `source='relevance-audit'` 的记录。tsc 编译通过。

### P1: 管线拆分 + Candidate Builder — 核心进化管线

**目标**: 拆分冷启动/增量/强制重扫三条管线；实现基于文件变更的 Recipe 影响分析。

**改动**:

1. 新增 `RecipeImpactPlanner` 类。
2. `EvolutionAuditRecipe` 接口扩展 `impactEvidence`。
3. `InternalKnowledgeRescanWorkflow` 增量模式移除清理调用，改为读取→diff→分析→更新。
4. `KnowledgeRescanIntent` `analysisMode`/`cleanupPolicy` 参数化。
5. `KnowledgeRescanWorkflowPlan` `incremental` 由 intent 决定。
6. `CleanupService` 新增 `forceRescanClean()`，`rescanClean()` 标记 `@deprecated`。
7. `WorkflowCleanupPolicies` 新增 `runForceRescanCleanPolicy`，废弃 `runRescanCleanPolicy`。

**单测覆盖**:

| 场景 | 预期 |
| --- | --- |
| modified 无关文件 → | 0 candidates |
| modified referenced file, token score < 0.3 → | 0 agent candidates, 1 hint |
| modified referenced file, token score >= 0.3 → | 1 pattern candidate |
| deleted 唯一 sourceRef → | 1 direct candidate |
| deleted 其中一个 sourceRef → | 1 partial candidate |
| 无 diff（首次 rescan） → | 0 diff candidates, source-missing 候选来自 SourceRefReconciler |
| ghost 模式路径规范化 → | sourceRef 正确匹配 |
| 多个变更文件命中同一 Recipe → | 合并为 1 candidate，取最高优先级 |

**预计工作量**: 2 天

### P2: Rescan 接入 + 外部 Briefing

**目标**: 内部/外部 rescan 完整走新管线。

**改动**:

1. `KnowledgeRescanPlanner.auditRecipesForRescan()` 已改为空操作桩（P0 完成）。
2. `RescanEvidenceProjectors` 增加 candidate 视图。
3. `ExternalKnowledgeRescanWorkflow` Briefing 输出 `evolutionCandidatePlan`。
4. `AgentStageFactoryRegistry` 解耦 evolution stage。
5. `evolutionGateEvaluator` 修正统计口径。

**预计工作量**: 2 天

### P3: 统一

**目标**: 统一 FileChangeHandler 和 rescan 的影响分析路径。

**改动**:

1. `FileChangeHandler` modified 复用 `RecipeImpactPlanner`。
2. SourceRefReconciler 路径存活检测覆盖首次 rescan 无 snapshot 场景（替代已删除的 RelevanceAuditor fallback）。

**预计工作量**: 1 天

---

## 14. 验证方案

### 14.1 单元测试

#### RecipeImpactPlanner

```ts
describe('RecipeImpactPlanner', () => {
  it('should return 0 candidates when no diff', () => {
    const plan = planner.plan({ diff: null, ... });
    expect(plan.candidates).toHaveLength(0);
  });

  it('should detect pattern impact on modified sourceRef file', () => {
    const plan = planner.plan({
      diff: { modified: ['src/api/Handler.ts'], ... },
      recipeEntries: [{ id: 'r1', sourceRefs: ['src/api/Handler.ts'], ... }],
    });
    expect(plan.candidates).toHaveLength(1);
    expect(plan.candidates[0].impact.reason).toBe('source-modified-pattern');
  });

  it('should detect direct impact when all sourceRefs deleted', () => {
    const plan = planner.plan({
      diff: { deleted: ['src/model/User.ts'], ... },
      recipeEntries: [{ id: 'r1', sourceRefs: ['src/model/User.ts'], ... }],
    });
    expect(plan.candidates[0].impact.reason).toBe('source-deleted');
    expect(plan.candidates[0].impact.level).toBe('direct');
  });

  it('should merge multiple changed files for same recipe', () => {
    const plan = planner.plan({
      diff: { modified: ['a.ts', 'b.ts'], deleted: ['c.ts'], ... },
      recipeEntries: [{ id: 'r1', sourceRefs: ['a.ts', 'b.ts', 'c.ts'], ... }],
    });
    expect(plan.candidates).toHaveLength(1);
    expect(plan.candidates[0].impact.changedFiles).toContain('a.ts');
    expect(plan.candidates[0].impact.deletedFiles).toContain('c.ts');
  });

  it('should normalize ghost mode paths', () => {
    const plan = planner.plan({
      projectRoot: '/Users/dev/BiliDili',
      diff: { modified: ['Packages/Core/API.swift'], ... },
      recipeEntries: [{
        id: 'r1',
        sourceRefs: ['Packages/Core/API.swift'],
        ...
      }],
    });
    expect(plan.candidates).toHaveLength(1);
  });

  it('should ignore unrelated file changes', () => {
    const plan = planner.plan({
      diff: { modified: ['README.md', 'docs/guide.md'], ... },
      recipeEntries: [{ id: 'r1', sourceRefs: ['src/api/Handler.ts'], ... }],
    });
    expect(plan.candidates).toHaveLength(0);
    expect(plan.ignored).toHaveLength(2);
  });
});
```

### 14.2 集成测试: Rescan Workflow

```ts
describe('InternalKnowledgeRescanWorkflow', () => {
  it('should use diff-based candidate selection instead of full audit', async () => {
    // Setup: 有 previous snapshot + 修改一个 sourceRef 文件
    // Assert: evolution candidates 只包含关联 Recipe
    // Assert: evolution_proposals 不包含 source='relevance-audit'
  });

  it('should skip evolution pass when no files changed', async () => {
    // Setup: previous snapshot 完全匹配当前文件
    // Assert: 0 evolution candidates
    // Assert: gap-fill 仍然执行
  });

  it('should use SourceRefReconciler stale detection when no previous snapshot', async () => {
    // Setup: 首次 rescan，无 previous snapshot
    // Assert: source-missing 候选来自 SourceRefReconciler 路径存活检测
    // Assert: 不再有 RelevanceAuditor 相关调用
  });
});
```

### 14.3 BiliDili 回归测试

使用 `/Users/gaoxuefeng/Documents/github/BiliDili`:

1. 第一次 rescan 建立 snapshot。
2. 修改一个 Recipe sourceRef 文件。
3. 第二次 rescan:
   - candidates 数量应接近被改文件关联的 Recipe 数（而非全部 35）。
   - `evolution_proposals.source='relevance-audit'` 不再新增。
   - 只有 Agent 决策后才出现 proposal。
4. 不修改任何文件，第三次 rescan:
   - 0 evolution candidates。
   - 只触发 gap-fill。

---

## 15. 开放问题

1. **deleted sourceRef 是否允许非 Agent 自动 deprecate？**
   - 建议默认否。`FileChangeHandler` 实时路径中的自动 deprecate 可保留（因为是精确的单文件事件），但 rescan 批量路径应统一进 Agent。
   - 可通过 `evolutionPlanning.autoDeprecateOnFullDelete: boolean` 配置。

2. **reference-level modified 是否需要区分内部/外部 rescan？**
   - 内部 rescan: reference 不进 Agent（避免浪费 token）。
   - 外部 rescan: reference 作为 low-priority hint 列在 Briefing 末尾。

3. **rescan 是否还需要全量 Phase 1-4？**
   - 增量模式：只分析 diff 中 added/modified 的文件。`code_entities`/`guard_violations` 增量 upsert。
   - 强制重扫模式（`--force`）：全量 Phase 1-4，但仍用 diff 驱动进化分析。
   - 项目概览、维度推断在增量模式下可用上次快照的维度映射补充。

4. **`recipe_source_refs` 长期维护策略？**
   - reconcile 后 upsert 保持最新。增量管线不清理此表，数据由 `SourceRefReconciler` 内建淘汰。
   - `fullReset()` 冷启动时全清。增量路径从不触碰。

5. **首次 bootstrap 后如何填充 sourceRefs？**
   - `SourceRefReconciler.reconcile()` 从 `reasoning.sources` 填充。
   - 新提交的 Recipe 由 Producer stage 在 `submit_knowledge` 时写入 reasoning.sources。
   - 首次 rescan 无 sourceRefs 的 Recipe 通过 `SourceRefReconciler.reconcile()` 路径存活检测发现 stale refs，以 `source-missing` 候选进入 Agent 验证。

6. **RecipeImpactPlanner 的 token 提取是否需要扩展？**
   - 当前 `extractRecipeTokens` 从 Recipe 全字段提取 PascalCase 标识符。
   - 未来可引入 IDF 加权（高频 token 降权，如 `Error`、`Handler`）。

---

## 16. 最小可行改造（MVP）

如果只做最小闭环:

1. **P0** ✅: 完全删除 `RelevanceAuditor`，`auditRecipesForRescan()` 改为空操作桩 → 止血。
2. **P1**: 管线拆分——增量路径移除 `rescanClean()` 调用，`rescanClean()` 标记 `@deprecated`。
3. **P1**: 新增 `RecipeImpactPlanner`，仅使用 `RecipeSnapshotEntry.sourceRefs + DiffResult`。
4. **P1**: `InternalKnowledgeRescanWorkflow` 增量模式：读取→diff→sourceRef→候选→增量分析→Agent→save。
5. **P1**: `KnowledgeRescanIntent` 参数化 `analysisMode`/`cleanupPolicy`，`--force` 走强制重扫。
6. **P2**: 外部 rescan Briefing 输出 candidates。

总计约 **5 个工作日**可完成 MVP（P0 已完成）。

---

## 17. 三层进化架构总览

> 本节描述 RelevanceAuditor 删除后的完整三层进化架构。

### Layer 0: 实时文件变更 → 工程快速决策

**触发源**: IDE 文件事件（rename/delete/create/modify）通过 FileChangeCollector 采集

**处理者**: `FileChangeHandler`（纯代码路径，无 Agent）

| 事件类型 | 处理方式 | 是否需要 Agent |
| --- | --- | --- |
| `renamed` | ContentPatcher 自动修复 sourceRefs + reasoning.sources | **否** |
| `deleted` | 全部 sourceRef 失效时 → `Gateway.submit(deprecate, conf=0.9)` 自动废弃 | **否** |
| `modified` | `#analyzeModifiedImpact()` → 结构化 signal (`quality` with impactLevel) | **否** |
| `created` | skip（新文件不影响已有 Recipe） | **否** |

**输出**: `ReactiveEvolutionReport`（含 affectedRecipes、impactLevel、eventSource）

### Layer 1: VSCode 弹窗提示 → 开发者/Agent 即时处理

**触发条件**: Layer 0 的 `modified` 事件产生 `impactLevel=direct` 影响

**弹窗策略**: 仅当同时满足以下条件：
- `impactLevel = 'direct'`（coreCode/sourceRefs 直接引用的文件被改）
- Recipe 处于 `active` 状态
- 距上次同一 Recipe 弹窗 > 10 分钟
- 事件来源为 IDE 编辑保存（非 git 批量事件）

**两个按钮行为**:

| 按钮 | 行为 |
| --- | --- |
| **Ask Copilot** | 构建 evolve prompt → IDE Copilot Chat → 外部 Agent 通过 MCP `alembic_evolve` |
| **Run alembic evolve-check** | 打开终端 → 内部 Agent Runtime 全自动处理 |

**不弹窗的场景**: `reference`/`pattern` 级别、git 批量事件、非 active Recipe → 只发 signal + Dashboard 汇总

### Layer 2: 增量扫描 → RecipeImpactPlanner → Evolution Agent

**触发源**: `alembic rescan`（内部/外部 Agent）

**核心流程**:

```text
FileDiffPlanner.evaluate()
  → DiffResult { added, modified, deleted }
  → SourceRefReconciler.reconcile() 校验修复
  → RecipeImpactPlanner.plan()
    → sourceRef 反向索引
    → deleted 文件 → source-deleted / source-deleted-partial 候选
    → modified 文件 → ContentImpactAnalyzer → source-modified-pattern / reference 候选
    → EvolutionCandidatePlan { candidates[], ignored[], summary }
  → runEvolutionAudit(candidates)
    → Agent 读取真实源码
    → propose_evolution / confirm_deprecation / skip_evolution
    → EvolutionGateway 写决策
  → gap-fill 维度执行（只补缺口）
```

**关键差异对比**:

| 维度 | 旧（RelevanceAuditor） | 新（三层架构） |
| --- | --- | --- |
| 进入进化的 Recipe | 全部 | 仅受文件变更影响的 |
| 进化决策来源 | 启发式评分直接写 proposal | Agent 读源码后决策 |
| 实时响应 | 无（等 rescan） | Layer 0 + Layer 1 弹窗即时提示 |
| 误判半径 | 全库 | 变更文件关联的 Recipe |
| 无变更 Recipe | 也被扫到 | 不进入 evolution pass |
| 首次 rescan 无 snapshot | 全量启发式评分 | SourceRefReconciler 路径存活检测 + source-missing 候选 |
