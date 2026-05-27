# Incremental Rescan Evolution Pipeline Design

> 创建日期: 2026-04-29
>
> 状态: 设计方案
>
> 目标: 让增量扫描基于真实文件变更标记受影响 Recipe，再交给 Evolution AgentRuntime 做源码验证和进化决策；`RelevanceAuditor` 退回为非权威 fallback，不再承担主进化入口。

---

## 1. 结论

`RelevanceAuditor` 当前不应该再作为增量扫描的主进化入口。

它回答的是“这条 Recipe 在当前项目里看起来还相关吗”，而增量扫描更应该回答：

> “这次项目变更实际动到了哪些 Recipe 声称依赖的源码证据？”

所以正确主线应改为：

```text
FileDiffSnapshotStore / FileDiffPlanner
  -> changed files
  -> recipe_source_refs / reasoning.sources 反查受影响 Recipe
  -> ContentImpactAnalyzer 判断 modified 影响强度
  -> EvolutionCandidatePlan
  -> Evolution AgentRuntime / alembic_evolve
  -> EvolutionGateway 写 proposal / valid / deprecate
  -> gap-fill Producer 只补新增知识缺口
```

`RelevanceAuditor` 可以保留为低置信 fallback，例如首次无快照、sourceRefs 缺失、或需要全量健康巡检时生成 audit hint；但它不应直接提交 deprecate/update proposal，也不应决定哪些 Recipe 必须进化。

---

## 2. 当前代码事实

### 2.1 rescan 当前确实走 RelevanceAuditor

内部 rescan 在 `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`:

```text
snapshotRecipes
  -> rescanClean
  -> ProjectIntelligenceCapability.run
  -> auditRecipesForRescan
  -> buildRescanPrescreen
  -> buildKnowledgeRescanPlan
  -> dispatchInternalDimensionExecution
```

`auditRecipesForRescan()` 位于 `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`，内部直接 new `RelevanceAuditor`。

外部 rescan 同样走 `auditRecipesForRescan()`，然后把结果投影到 Mission Briefing。

### 2.2 项目内已有更成熟的变更/源码证据体系

已经存在的能力：

| 能力 | 文件 | 当前职责 |
| --- | --- | --- |
| 文件快照 diff | `FileDiffSnapshotStore.ts`, `FileDiffPlanner.ts` | 基于上次 snapshot 的 file hash 计算 added/modified/deleted，并推断 affectedDimensions |
| sourceRef 桥接表 | `RecipeSourceRefRepository.ts` | `recipe_id <-> source_path` 索引 |
| sourceRef 校验修复 | `SourceRefReconciler.ts` | 从 `reasoning.sources` 填充 `recipe_source_refs`，校验路径存在性，检测 rename，修复路径 |
| 文件变更处理 | `FileChangeHandler.ts` | renamed/deleted/modified 的 Recipe 影响处理 |
| diff 影响评估 | `ContentImpactAnalyzer.ts` | `git diff -U0` -> diff tokens -> Recipe tokens，判断 `pattern/reference` |
| Evolution AgentRuntime | `EvolutionAgentRun.ts`, `evolution.profile.ts`, `insight-evolver.ts` | Agent 读取源码后调用 `propose_evolution/confirm_deprecation/skip_evolution` |
| 决策落库 | `evolution-tools.ts`, `evolve-external.ts`, `EvolutionGateway.ts` | Agent/MCP 决策最终统一走 Gateway |

这些能力比 `RelevanceAuditor` 更适合作为增量扫描进化入口。

### 2.3 但当前 rescan 没有把它们串起来

当前关键断点：

1. `KnowledgeRescanWorkflowPlan.ts` 中 rescan scan options 固定 `incremental: false`。
2. `rescanClean()` 会清掉 `bootstrap_snapshots` 和 `recipe_source_refs`，导致后续无法基于历史快照和 sourceRef 索引做精确影响分析。
3. `FileChangeHandler` 的 modified 处理只返回 `needs-review` 和 signal，没有被 rescan 消费成 EvolutionCandidate。
4. `runEvolutionAudit()` 已存在，但内部 rescan 没有调用。
5. `AgentStageFactoryRegistry` 中 bootstrap-dimension pipeline 只有在 `hasExistingRecipes && !prescreenDone` 时才插入 evolution stage；rescan 总是传入 `evolutionPrescreen`，所以内部 rescan 的 dimension pipeline 实际跳过了 evolution stage。
6. `evolutionGateEvaluator` 目前统计 `submit_knowledge with supersedes`、`confirm_deprecation`、`skip_evolution`，但 Evolution Agent prompt 和工具已经改为 `propose_evolution`，两者不完全一致。

---

## 3. 设计原则

### 3.1 文件变更是候选入口，Agent 是确认入口

代码路径只负责回答：

- 哪些 Recipe 的 sourceRefs 被 added/modified/deleted/renamed 影响？
- modified 是否真正动到了 Recipe 描述的 API/模式 token？
- 删除/重命名是否可以自动修复？

代码路径不负责最终判断“知识是否应更新/废弃”。最终决策交给 Agent 或外部 `alembic_evolve`。

### 3.2 RelevanceAuditor 不再写 proposal

`RelevanceAuditor` 只能生成 audit hint：

- `healthy/watch/decay/severe/dead`
- evidence summary
- fallback reason

它不能调用 `EvolutionGateway.submit()` 写 proposal，也不能把 `decay/severe` 直接变成 evolution signal。

### 3.3 rescan-clean 不能先删除增量证据

计算增量影响需要：

- 上次 `bootstrap_snapshots.fileHashes`
- 上次 `bootstrap_dim_files`
- 当前 `recipe_source_refs`，或至少 snapshot 出来的 `reasoning.sources`

因此 rescan 必须先完成 file diff + Recipe impact planning，再执行会清缓存的动作；或者调整 `rescanClean`，让它不清除 `bootstrap_snapshots` 和 `recipe_source_refs`，直到新的 planning 产物已经落地。

### 3.4 进化和补齐拆成两个阶段

rescan 里的两件事应分离：

1. Evolution pass：只处理受影响旧 Recipe。
2. Gap fill pass：只补覆盖缺口或新增维度知识。

Producer 不应该替 Evolution Agent 验证旧 Recipe；Evolution Agent 也不应该扫描无关维度找新 Recipe。

---

## 4. 目标架构

### 4.1 内部 rescan

```text
runInternalKnowledgeRescanWorkflow
  -> snapshotRecipes
  -> collectProjectFiles
  -> evaluateFileDiffPlan
  -> reconcileSourceRefs
  -> buildEvolutionCandidatePlan
  -> rescanCleanDerivedCaches
  -> ProjectIntelligenceCapability.run
  -> runEvolutionAudit(candidates grouped by dimension)
  -> buildKnowledgeRescanPlan(evolution results + coverage)
  -> dispatchInternalDimensionExecution(gap dimensions only)
```

### 4.2 外部 rescan

```text
alembic_rescan
  -> snapshotRecipes
  -> evaluateFileDiffPlan
  -> buildEvolutionCandidatePlan
  -> ProjectIntelligenceCapability.run
  -> Mission Briefing:
       - evolutionCandidates
       - changedFiles
       - impact evidence
       - dimension gaps

External Agent:
  -> alembic_evolve(decisions for evolutionCandidates)
  -> alembic_submit_knowledge(gap fill)
  -> alembic_dimension_complete
```

### 4.3 Standalone file-change event path

当前 `FileChangeHandler` 可继续处理 IDE/HTTP 文件变更，但它的 modified 结果应与 rescan 共享同一套 candidate builder。

```text
FileChangeHandler.handleFileChanges(events)
  -> buildEvolutionCandidatePlan(events)
  -> return needsReview candidates
  -> optional: enqueue Evolution Agent task / notify UI
```

---

## 5. 新增核心模型

### 5.1 EvolutionCandidatePlan

```ts
interface EvolutionCandidatePlan {
  candidates: EvolutionCandidate[];
  autoRepairs: SourceRefRepair[];
  ignored: IgnoredChange[];
  summary: {
    changedFiles: string[];
    byReason: Record<string, number>;
    byDimension: Record<string, number>;
  };
}
```

### 5.2 EvolutionCandidate

```ts
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
    reason:
      | 'source-modified'
      | 'source-deleted'
      | 'source-renamed'
      | 'source-missing'
      | 'fallback-audit';
    level: 'direct' | 'pattern' | 'reference' | 'unknown';
    changedFiles: string[];
    deletedFiles?: string[];
    renamedFiles?: Array<{ oldPath: string; newPath: string }>;
    score?: number;
    matchedTokens?: string[];
  };
  agentInstruction: string;
}
```

### 5.3 SourceRefRepair

```ts
interface SourceRefRepair {
  recipeId: string;
  oldPath: string;
  newPath: string;
  applied: boolean;
}
```

自动修复只适合 rename/path rewrite，不适合内容语义变更。

---

## 6. Candidate Builder 设计

新增服务建议命名：

```text
lib/service/evolution/RecipeImpactPlanner.ts
```

职责：

1. 输入 `recipeSnapshot.entries`、`FileDiffPlan.diff`、可选 `recipe_source_refs`。
2. 规范化 source path，支持 ghost 模式下 `projectRoot` 和 `dataRoot` 分离。
3. 对 deleted/renamed/modified 建立 Recipe 影响映射。
4. 对 modified 文件调用 `ContentImpactAnalyzer.assessFileImpact()`。
5. 输出 `EvolutionCandidatePlan`。

伪代码：

```ts
class RecipeImpactPlanner {
  plan(opts: {
    projectRoot: string;
    recipeEntries: RecipeSnapshotEntry[];
    diff: FileDiffSummary | null;
    sourceRefRepo?: RecipeSourceRefRepositoryImpl;
  }): EvolutionCandidatePlan {
    const sourceIndex = buildSourceIndex(recipeEntries, sourceRefRepo);
    const candidates = new Map<string, EvolutionCandidate>();

    for (const deletedPath of diff.deleted) {
      for (const recipe of sourceIndex.findByPath(deletedPath)) {
        candidates.set(recipe.id, buildDeletedCandidate(recipe, deletedPath));
      }
    }

    for (const modifiedPath of diff.modified) {
      for (const recipe of sourceIndex.findByPath(modifiedPath)) {
        const impact = assessFileImpact(projectRoot, modifiedPath, extractRecipeTokens(recipe));
        if (impact?.level === 'pattern') {
          candidates.set(recipe.id, buildModifiedCandidate(recipe, modifiedPath, impact));
        }
      }
    }

    return { candidates: [...candidates.values()], ... };
  }
}
```

注意：`reference` 是否进入 Agent 可配置。默认建议：

| impact | 默认行为 |
| --- | --- |
| direct/delete | 进入 Agent |
| pattern | 进入 Agent |
| reference | 只记录 hint，不进入 Agent，除非手动 full-audit |
| unknown | fallback audit hint，不自动写 proposal |

---

## 7. Rescan 接入顺序调整

### 7.1 当前顺序的问题

当前顺序：

```text
snapshotRecipes
  -> rescanClean
  -> ProjectIntelligenceCapability.run
```

问题：

- `rescanClean` 清 `recipe_source_refs`。
- `rescanClean` 清 `bootstrap_snapshots` 和 `bootstrap_dim_files`。
- 后续即使打开 `incremental: true`，也找不到 previous snapshot。

### 7.2 建议顺序

```text
snapshotRecipes
  -> collect current files
  -> evaluate FileDiffPlan using previous bootstrap_snapshot
  -> sourceRef reconcile / repair plan
  -> build EvolutionCandidatePlan
  -> rescanClean derived caches
  -> ProjectIntelligenceCapability.run
```

如果为了实现成本先不拆 Phase 1 文件收集，也可以采用过渡方案：

1. `rescanClean` 暂时不清 `bootstrap_snapshots` 和 `bootstrap_dim_files`。
2. `ProjectIntelligenceCapability.run({ incremental: true })` 先产出 `incrementalPlan`。
3. 在 `auditRecipesForRescan` 前改为 `buildEvolutionCandidatePlan(incrementalPlan.diff)`。
4. 新 snapshot 保存成功后，再由 snapshot store 清理旧 snapshot。

长期方案更推荐 7.2，因为它明确把“增量证据读取”放在清理之前。

---

## 8. Evolution AgentRuntime 接入

### 8.1 内部 Agent

已有 `runEvolutionAudit()` 可复用。

改造点：

1. 在 `runInternalKnowledgeRescanWorkflow` 中，`buildEvolutionCandidatePlan` 后按 dimension 分组。
2. 对每个有候选的 dimension 调用：

```ts
await runEvolutionAudit({
  agentService,
  recipes: candidatesForDimension,
  projectOverview,
  dimensionId,
  dimensionLabel,
});
```

3. Evolution 结果写入 `rescanContext.evolutionResultByDimension`。
4. 后续 `dispatchInternalDimensionExecution` 只处理需要 gap-fill 的维度。
5. `bootstrap-dimension` pipeline 不再隐式插入 evolution stage；Evolution pass 由 rescan workflow 显式调度。

### 8.2 外部 Agent

Mission Briefing 增加：

```ts
interface RescanBriefingInput {
  evolutionCandidatePlan: EvolutionCandidatePlan;
  evidencePlan: ExternalRescanEvidencePlan;
  prescreen?: EvolutionPrescreen; // fallback only
}
```

外部执行顺序：

1. 对 `evolutionCandidatePlan.candidates` 调用 `alembic_evolve`。
2. 再对 gap dimensions 调用 `alembic_submit_knowledge`。
3. 最后 `alembic_dimension_complete`。

`alembic_evolve` 应只要求处理 candidates，不要求处理所有旧 Recipe。

### 8.3 Evolution gate 修正

`evolutionGateEvaluator` 应统计：

- `propose_evolution`
- `confirm_deprecation`
- `skip_evolution`

不应继续依赖旧的 `submit_knowledge + supersedes` 作为 evolve 计数。

---

## 9. RelevanceAuditor 的新定位

建议改名或降级：

```text
RelevanceAuditor -> RecipeRelevanceFallbackAuditor
```

保留场景：

1. 没有 previous snapshot。
2. Recipe 没有 sourceRefs。
3. 用户显式要求 full relevance audit。
4. 定期 metabolism 健康巡检需要一个粗筛 hint。

限制：

- 不直接调用 `EvolutionGateway`。
- 不产生 proposal。
- 不直接改变 lifecycle。
- 输出只作为 `auditHint` 传给 Agent。

---

## 10. 数据流对比

### 10.1 当前

```text
all recipes
  -> RelevanceAuditor heuristic score
  -> decay/severe/dead
  -> proposal / prescreen / gap planning
```

风险：全量启发式误判会扩散到所有 Recipe。

### 10.2 目标

```text
changed files
  -> sourceRef reverse index
  -> impacted recipes only
  -> diff token impact
  -> Evolution Agent reads real code
  -> explicit evolution decision
```

收益：

- 没变的 Recipe 不进入 evolution pass。
- 误判半径从“全库”收缩到“变更文件关联的 Recipe”。
- proposal 只来自 Agent/MCP 明确决策。
- `RelevanceAuditor` 错误不会污染 DB。

---

## 11. 需要调整的文件

### 11.1 新增

| 文件 | 作用 |
| --- | --- |
| `lib/service/evolution/RecipeImpactPlanner.ts` | 基于 diff + sourceRefs 生成 EvolutionCandidatePlan |
| `test/unit/RecipeImpactPlanner.test.ts` | 覆盖 modified/deleted/renamed/reference/no-change |

### 11.2 修改

| 文件 | 修改点 |
| --- | --- |
| `KnowledgeRescanWorkflowPlan.ts` | rescan 支持增量证据读取；不要固定 `incremental: false`，或拆出 pre-clean diff evaluation |
| `InternalKnowledgeRescanWorkflow.ts` | 在 gap-fill 前显式运行 `runEvolutionAudit(candidates)` |
| `ExternalKnowledgeRescanWorkflow.ts` | Briefing 输出 `evolutionCandidatePlan` |
| `KnowledgeRescanPlanner.ts` | `auditRecipesForRescan` 降级为 fallback，不再是主流程 |
| `RescanEvidenceProjectors.ts` | allRecipes 改为 candidates + coverage/gap 两类视图 |
| `AgentStageFactoryRegistry.ts` | bootstrap-dimension pipeline 不再根据 `prescreenDone` 隐式决定是否插 evolution stage |
| `insight-gate.ts` | evolution gate 统计 `propose_evolution` |
| `CleanupService.ts` | 调整 rescanClean 对 `bootstrap_snapshots`、`recipe_source_refs` 的清理时机 |
| `FileChangeHandler.ts` | modified/deleted 影响分析复用 `RecipeImpactPlanner` |
| `RelevanceAuditor.ts` | 标记 fallback/deprecated，不再持有 `EvolutionGateway` 依赖 |

---

## 12. 实施步骤

### P0: 止血

- `RelevanceAuditor` 不再为 `decay/severe` 写 proposal。
- `dead` 是否自动 deprecate 也建议改为 feature flag，默认进 Agent 验证。

### P1: Candidate builder

- 新增 `RecipeImpactPlanner`。
- 输入使用 `RecipeSnapshotEntry.sourceRefs`，不强依赖 `recipe_source_refs` 表，避免 rescan-clean 顺序阻塞。
- 单测覆盖：
  - modified unrelated file -> no candidates
  - modified referenced file but token score low -> hint only
  - modified referenced file with pattern impact -> candidate
  - deleted last sourceRef -> candidate direct
  - deleted one of multiple refs -> candidate reference/direct，根据 remaining refs 标记

### P2: Rescan diff 接入

- 在 rescan workflow 中拿到 `FileDiffPlan.diff`。
- 修复 `rescanClean` 清 snapshot 的时机。
- `KnowledgeRescanPlan` 的 `fileDiff` 参数真正传入 `affectedDimensionIds` 和 `changedFiles`。

### P3: 内部 Evolution Agent 显式调度

- 在 internal rescan 中对 candidates 调用 `runEvolutionAudit()`。
- 将结果写入返回响应和 session report。
- gap-fill 只处理 coverage gap / new files 推断出的维度。

### P4: 外部 briefing 改造

- Mission Briefing 明确列出 `evolutionCandidates`。
- `alembic_evolve` 校验 candidates 是否全部处理。
- 不再要求外部 Agent 审查所有旧 Recipe。

### P5: RelevanceAuditor 退役

- 移除 Gateway 依赖。
- 改名或标记 `@deprecated`。
- 仅保留 fallback audit hint。

---

## 13. 验证方案

### 13.1 单元测试

1. `RecipeImpactPlanner` path normalization 覆盖 ghost mode：
   - projectRoot: `/Users/.../BiliDili`
   - dataRoot: `~/.asd/workspaces/<id>`
   - sourceRefs 必须仍按 projectRoot 相对路径解析。
2. `ContentImpactAnalyzer` modified diff token 命中才进入 pattern candidate。
3. deleted sourceRef 不直接 proposal，只生成 candidate。
4. no diff 时不生成 evolution candidates。

### 13.2 workflow 测试

1. 有 previous snapshot + 只修改一个 sourceRef 文件：
   - evolution candidates 只包含关联 Recipe。
   - 其他 Recipe 不出现 proposal。
2. 修改无关文件：
   - 不触发 evolution Agent。
   - 可触发 gap-fill 维度推断。
3. 删除 sourceRef 文件：
   - candidate 进入 Evolution Agent。
   - 只有 Agent `confirm_deprecation` 后才 deprecate。
4. 外部 rescan：
   - briefing 输出 candidates。
   - `alembic_evolve` 后 proposal 数和 decisions 对齐。

### 13.3 BiliDili 回归

使用 `/Users/gaoxuefeng/Documents/github/BiliDili`：

1. 第一次 rescan 建立 snapshot。
2. 修改一个 Recipe sourceRef 文件。
3. 第二次 rescan：
   - candidates 数量应接近被改文件关联的 Recipe 数，而不是全部 35。
   - `evolution_proposals.source='relevance-audit'` 不再新增。
   - 只有 Agent/MCP 决策后才出现 `source='decay-scan'` 或 `source='ide-agent'` proposal。

---

## 14. 开放问题

1. deleted sourceRef 是否允许非 Agent 自动 deprecate？
   - 建议默认否。自动路径只能标记 candidate，避免误删文件或临时 checkout 导致 Recipe 被废弃。
2. renamed 是否必须进 Agent？
   - 建议否。rename 是结构性路径修复，`SourceRefReconciler + RecipePathRewriter` 可自动处理。
3. reference-level modified 是否进 Agent？
   - 建议默认否，只作为 low-priority hint；用户显式 full audit 时再进。
4. rescan 是否还需要全量 Phase 1-4？
   - 可以继续全量分析项目结构，但 evolution candidate selection 必须基于 diff/sourceRefs，而不是全量 RelevanceAuditor。
5. `recipe_source_refs` 是否应从 rescanClean 中移除？
   - 建议保留到 impact planning 完成后再清，或改为 reconcile 后 upsert，不再作为清理对象。

---

## 15. 最小可行改造

如果只做最小闭环，建议顺序：

1. 新增 `RecipeImpactPlanner`，仅使用 `recipeSnapshot.entries.sourceRefs + incrementalPlan.diff`。
2. rescan 开启/提前计算 `FileDiffPlan`，不要先删 snapshot。
3. internal rescan 对 candidates 调 `runEvolutionAudit()`。
4. external rescan briefing 输出 candidates，要求 `alembic_evolve` 只处理 candidates。
5. `RelevanceAuditor` 保留 fallback hint，不再作为 proposal 入口。

这样可以先把“所有 Recipe 都被进化信号污染”的风险降到最低，同时不破坏现有 gap-fill、candidate submit、dimension complete 链路。
