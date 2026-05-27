# 增量 Rescan 进化管线 — 落地实现方案

> 创建日期: 2026-04-29
>
> 状态: **已实现** ✅（commit `4603e4b`）
>
> 前置文档: [file-change-driven-recipe-evolution-pipeline.md](./file-change-driven-recipe-evolution-pipeline.md)
>
> 目标: 基于真实代码接口，确定具体代码范围、接口签名、数据流、边界情况和连通性，可直接按此文档编码。

---

## 0. 统一基础设施审计：变更检测与快照管理

> **核心结论**：项目已有成熟的统一基础设施，不需要为不同场景写不同方法。实时变更和增量 rescan 的差异仅在于**变更信息的来源**不同，而非处理逻辑不同。应复用现有基础设施，避免重复建设。

### 0.0.1 变更检测：两条输入通道，一套处理逻辑

项目中文件变更检测存在两条**输入通道**，但本质产出相同——一组 `{ path, changeType }` 的变更清单：

| 通道 | 触发方式 | 变更来源 | 产出格式 | 已有组件 |
| --- | --- | --- | --- | --- |
| **实时通道** | VSCode 文件事件 / Git HEAD 变化 | IDE 推送 `FileChangeEvent[]` | `{ path, type: created/renamed/deleted/modified }` | `FileChangeDispatcher` → `FileChangeHandler` |
| **快照通道** | Rescan 触发 | `FileDiffSnapshotStore.computeDiff()` hash 对比 | `DiffResult { added[], modified[], deleted[], unchanged[] }` | `FileDiffPlanner` → `FileDiffSnapshotStore` |

**两者的产出可以归一化为相同的 `FileChangeEvent[]` 格式**：

```ts
// DiffResult → FileChangeEvent[] 的转换是纯机械映射
function diffResultToEvents(diff: DiffResult): FileChangeEvent[] {
  return [
    ...diff.deleted.map(path => ({ type: 'deleted' as const, path })),
    ...diff.modified.map(path => ({ type: 'modified' as const, path })),
    ...diff.added.map(path => ({ type: 'created' as const, path })),
  ];
}
```

**关键认识**：变更检测不需要统一——两条通道各有其不可替代的物理来源。需要统一的是**下游处理逻辑**（影响评估 + 进化决策），这部分已有成熟实现。

### 0.0.2 快照管理：已有统一存储

| 组件 | 文件 | 操作表 | 关系 |
| --- | --- | --- | --- |
| `FileDiffSnapshotStore` | `lib/workflows/capabilities/project-intelligence/FileDiffSnapshotStore.ts` | `bootstrap_snapshots` + `bootstrap_dim_files` | 主用入口，含 diff 计算 |
| `BootstrapRepositoryImpl` | `lib/repository/bootstrap/BootstrapRepository.ts` | 同上两表 | 纯 CRUD 接口，同一张表的另一套 API |

**重要发现**：这两个组件操作的是**同一对 DB 表**，数据结构完全一致。`FileDiffSnapshotStore` 包含 hash 计算 + diff 逻辑 + 快照保存，是更完整的入口。`BootstrapRepository` 是纯仓储层。**不存在两套快照**，是同一套。

### 0.0.3 Hash 计算：事实统一但需提取公共函数

项目中 4 处独立实现了完全相同的 SHA256-hex-16 hash 函数：

| 位置 | 实现 | 用途 |
| --- | --- | --- |
| `FileDiffSnapshotStore.#computeContentHash()` | `createHash('sha256').update(content).digest('hex').substring(0, 16)` | 文件快照 diff |
| `GraphCache.computeContentHash()` | 同上 | SPM/AST 图缓存 |
| `IndexingPipeline.hashContent()` | `...slice(0, 16)` | 向量索引去重 |
| `KnowledgeFileWriter.computeKnowledgeHash()` | 同上（多一步 strip `_contentHash` 行） | Recipe 内容完整性 |

**结论**：算法已统一（SHA256-hex16），只需提取为 `shared/content-hash.ts` 公共函数。

### 0.0.4 影响评估：已有统一层，rescan 场景需降级方案

| 组件 | 影响评估方式 | 适用场景 |
| --- | --- | --- |
| `ContentImpactAnalyzer.assessFileImpact()` | `git diff HEAD -U0` → 行级 diff token vs Recipe token 交集 | **实时变更**（IDE 编辑后文件有 uncommitted changes） |
| `ContentImpactAnalyzer.assessDiffImpact()` | 通用 token 交集计算（输入是任意 `Set<string>` vs `RecipeTokens`） | 两者共用的核心算法 |
| `recipe-tokens.ts` | `extractRecipeTokens()` / `tokenizeIdentifiers()` | 两者共用的 token 提取 |

**核心发现**：`assessDiffImpact(diffTokens, recipeTokens)` 是**与输入来源无关的通用算法**。差异仅在 `diffTokens` 的获取方式：
- 实时通道：`getFileDiff()` → `parseDiffHunks()` → `tokenizeDiffLines()` → `Set<string>`
- 快照通道：无行级 diff，需用文件全文 `tokenizeIdentifiers(fileContent)` → `Set<string>`

两者最终都喂给同一个 `assessDiffImpact()`。**不需要写新的评估方法，只需要为快照通道提供 diffTokens 的替代获取方式**。

### 0.0.5 统一架构总结

```
┌─────────────────────────────────────────────────────────┐
│                  变更检测统一架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  输入层（不可统一，各有物理来源）                           │
│  ┌──────────────┐    ┌──────────────────────┐           │
│  │ IDE 文件事件   │    │ FileDiffSnapshotStore │           │
│  │ FileChange    │    │ .computeDiff()        │           │
│  │ Event[]       │    │ → DiffResult          │           │
│  └──────┬───────┘    └──────────┬───────────┘           │
│         │                       │                        │
│         │    归一化为同一格式     │                        │
│         ▼                       ▼                        │
│  ┌──────────────────────────────────────────┐           │
│  │  统一变更清单: { path, changeType }[]     │           │
│  └──────────────────┬───────────────────────┘           │
│                     │                                    │
│  处理层（已统一，直接复用）                                │
│  ┌──────────────────▼───────────────────────┐           │
│  │  SourceRefRepository.findBySourcePath()   │           │
│  │  → 关联受影响 Recipe                      │           │
│  └──────────────────┬───────────────────────┘           │
│                     │                                    │
│  ┌──────────────────▼───────────────────────┐           │
│  │  影响评估（统一核心算法）                    │           │
│  │  assessDiffImpact(diffTokens, recipeTokens)│          │
│  │                                            │          │
│  │  diffTokens 来源:                          │           │
│  │    实时 → getFileDiff + tokenizeDiffLines  │           │
│  │    快照 → tokenizeIdentifiers(fileContent) │           │
│  └──────────────────┬───────────────────────┘           │
│                     │                                    │
│  ┌──────────────────▼───────────────────────┐           │
│  │  EvolutionGateway.submit()                │           │
│  │  → 统一进化决策入口                        │           │
│  └──────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 0.0.6 对实现方案的影响

基于以上审计，快照通道的影响评估**不应作为独立的新方法**，而是对现有 `assessDiffImpact` 的参数适配（最终统一封装为 `assessImpactUnified`，见 §1.2）：

```ts
// 不需要新方法，只需要一个 token 获取适配函数
function getFileContentTokens(projectRoot: string, relativePath: string): Set<string> | null {
  try {
    const content = readFileSync(join(projectRoot, relativePath), 'utf-8');
    return new Set(tokenizeIdentifiers(content));
  } catch {
    return null;
  }
}

// 快照通道的影响评估：复用 assessDiffImpact
function assessFileImpactByContent(
  projectRoot: string,
  relativePath: string,
  recipeTokens: RecipeTokens
): DiffImpactResult | null {
  const fileTokens = getFileContentTokens(projectRoot, relativePath);
  if (!fileTokens) return null;
  return assessDiffImpact(fileTokens, recipeTokens);
}
```

**同理，`RecipeImpactPlanner` 不应维护独立的 diff/影响分析逻辑**，而是：
1. 从 `runAllPhases(incremental: true)` 返回值获取 `incrementalPlan.diff`（已在内部计算完成）
2. 通过 `SourceRefRepository.findBySourcePath()` 找关联 Recipe（已有）
3. 通过 `assessDiffImpact()` 评估影响（已有）
4. 生成 `EvolutionCandidatePlan` 传给 `runEvolutionAudit`

**需要新建的只有编排层（`RecipeImpactPlanner`），所有基础能力全部复用**。

---

## 0-A. 现有基础设施盘点（已存在，可直接调用）

### 0-A.1 文件 Diff 基础设施

| 组件 | 文件 | 关键方法 | 状态 |
| --- | --- | --- | --- |
| `FileDiffSnapshotStore` | `lib/workflows/capabilities/project-intelligence/FileDiffSnapshotStore.ts` | `getLatest(projectRoot)` → `SnapshotData \| null` | ✅ 可用 |
| | | `computeDiff(prev, currentFiles, projectRoot)` → `{ added, modified, deleted, unchanged, changeRatio }` | ✅ 可用 |
| | | `inferAffectedDimensions(prev, diff, allDimIds)` → `{ mode, dimensions, skippedDimensions, reason }` | ✅ 可用 |
| | | `save(params)` — 内置 MAX_SNAPSHOTS=5 自动淘汰 | ✅ 可用 |
| `FileDiffPlanner` | `lib/workflows/capabilities/project-intelligence/FileDiffPlanner.ts` | `evaluate(currentFiles, allDimIds)` → `IncrementalPlan` | ✅ 可用 |
| | | `saveSnapshot(params)` | ✅ 可用 |

**`IncrementalPlan` 完整结构**:

```ts
interface IncrementalPlan {
  canIncremental: boolean;
  mode: 'full' | 'incremental';
  affectedDimensions: string[];
  skippedDimensions: string[];
  previousSnapshot: SnapshotData | null;
  diff: {
    added: string[];       // 新增文件的 relativePath
    modified: string[];    // 内容变化文件的 relativePath
    deleted: string[];     // 已删除文件的 relativePath
    unchanged: string[];
    changeRatio: number;   // (added+modified+deleted) / total
  } | null;
  reason: string;
  restoredEpisodic: Record<string, unknown> | null;
}
```

**关键常量**:
- `MAX_SNAPSHOTS = 5` — 每项目最多保留 5 条快照
- `FULL_REBUILD_THRESHOLD = 0.5` — `inferAffectedDimensions` 中 `changeRatio > 0.5` 转全量
- Hash 算法: SHA256 前 16 字符

**边界情况**:
- 无快照时 → `canIncremental=false, mode='full'`, `diff: null`（但 `incrementalPlan` 非 null）
- `changeRatio > 0.5`（非 0.6）→ `mode='full'`（变化过大，全量更合理）
- `inferAffectedDimensions` 的 changeRatio 与 `computeDiff` 的 changeRatio 公式不同
- `computeDiff` 的 `changeRatio` 分母是当前文件集大小（至少 1），大量删除时可以 > 1
- diff 计算基于 SHA256 hash 对比，不走 git
- 维度推断依赖 `bootstrap_dim_files` 表的路径集合 + `#inferDimsByFileType` 文件扩展名规则
- 有任意变更文件时强制 `affected.add('project-profile')`

### 0.2 SourceRef 基础设施

| 组件 | 文件 | 关键方法 | 状态 |
| --- | --- | --- | --- |
| `RecipeSourceRefRepositoryImpl` | `lib/repository/sourceref/RecipeSourceRefRepository.ts` | `findBySourcePath(path)` → `RecipeSourceRefEntity[]` | ✅ 可用 |
| | | `findByRecipeId(id)` → `RecipeSourceRefEntity[]` | ✅ 可用 |
| | | `findStale()` → `RecipeSourceRefEntity[]` | ✅ 可用 |
| | | `upsert(data)` — ON CONFLICT DO UPDATE | ✅ 可用 |
| | | `getStaleCountsByRecipe()` | ✅ 可用 |
| `SourceRefReconciler` | `lib/service/knowledge/SourceRefReconciler.ts` | `reconcile({ force })` → `ReconcileReport` | ✅ 可用 |
| | | `repairRenames()` → `RepairReport` | ✅ 可用 |
| | | `applyRepairs()` → `ApplyReport` | ✅ 可用 |

**`RecipeSourceRefEntity` 结构**:

```ts
interface RecipeSourceRefEntity {
  recipeId: string;
  sourcePath: string;
  status: string;         // 'active' | 'stale' | 'renamed'
  newPath: string | null;  // renamed 时的新路径
  verifiedAt: number;      // 上次验证时间戳
}
```

**边界情况**:
- Recipe 无 `reasoning.sources` → reconcile 跳过
- 路径不存在 → 标记 `stale`
- TTL 24h → 近期已验证的跳过（`force=true` 可绕过）

### 0.3 内容影响分析基础设施

| 组件 | 文件 | 关键方法 | 状态 |
| --- | --- | --- | --- |
| `ContentImpactAnalyzer` | `lib/service/evolution/ContentImpactAnalyzer.ts` | `assessFileImpact(projectRoot, relativePath, recipeTokens)` → `DiffImpactResult \| null` | ✅ 可用 |
| | | `assessDiffImpact(diffTokens, recipeTokens)` → `DiffImpactResult` | ✅ 可用 |
| `recipe-tokens` | `lib/shared/recipe-tokens.ts` | `extractRecipeTokens(entry)` → `RecipeTokens { tokens: Set, sources: Map }` | ✅ 可用 |
| `diff-parser` | `lib/shared/diff-parser.ts` | `getFileDiff(projectRoot, relativePath)` → `string \| null` | ✅ 可用 |

**`DiffImpactResult` 结构**:

```ts
interface DiffImpactResult {
  level: ImpactLevel;       // 'pattern' (≥0.3) | 'reference' (<0.3)
  score: number;            // |T_R ∩ T_Δ| / |T_R|
  matchedTokens: string[];
}
```

**限制**: `getFileDiff` 使用 `git diff HEAD -U0`（5s 超时），要求项目在 git 仓库中且文件已 tracked。增量 rescan 场景（非实时 IDE 事件）中，diff 来自 `FileDiffSnapshotStore.computeDiff` 的 hash 对比——只知道哪些文件变了，不知道具体哪些行变了，因此无法直接用 `assessFileImpact`。需要降级方法（见 1.2）。

### 0.4 进化决策基础设施

| 组件 | 文件 | 关键方法 | 状态 |
| --- | --- | --- | --- |
| `EvolutionGateway` | `lib/service/evolution/EvolutionGateway.ts` | `submit(decision: EvolutionDecision)` → `EvolutionResult` | ✅ 可用 |
| `runEvolutionAudit` | `lib/agent/runs/evolution/EvolutionAgentRun.ts` | `runEvolutionAudit({ agentService, recipes, projectOverview, dimensionId })` → `EvolutionAuditResult` | ✅ 可用 |

**`EvolutionDecision` 结构**:

```ts
interface EvolutionDecision {
  recipeId: string;
  action: EvolutionAction;      // 'update' | 'deprecate' | 'valid'
  source: ProposalSource;       // 'decay-scan' | 'file-change' | 'rescan-evolution' | ...
  confidence: number;            // 0-1
  description?: string;
  evidence?: Record<string, unknown>[];
  reason?: string;
  replacedByRecipeId?: string;   // supersede 场景
}
```

**`EvolutionAuditRecipe` 结构（当前）**:

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
    evidence: { triggerStillMatches: boolean; symbolsAlive: number; depsIntact: boolean; codeFilesExist: number };
    decayReasons: string[];
  } | null;
}
```

### 0.5 实时文件变更基础设施

| 组件 | 文件 | 状态 |
| --- | --- | --- |
| `FileChangeHandler` | `lib/service/evolution/FileChangeHandler.ts` | ✅ 已完整实现 Layer 0 |
| | `handleFileChanges(events)` → `ReactiveEvolutionReport` | ✅ renamed/deleted/modified 全处理 |
| | `#handleModified` 已使用 `ContentImpactAnalyzer + RecipeSourceRefRepo` | ✅ 可复用模式 |

---

## 1. 需要新建的组件

### 1.1 `RecipeImpactPlanner` — 批量进化候选生成器

**位置**: `lib/service/evolution/RecipeImpactPlanner.ts`

**职责**: 接收 `runAllPhases(incremental: true)` 返回值中的 `incrementalPlan.diff`（来自 `FileDiffSnapshotStore.computeDiff` 的 hash 对比），批量分析所有变更文件对 Recipe 的影响，生成 `EvolutionCandidatePlan`。

**与 `FileChangeHandler` 的区别**:
- `FileChangeHandler` 处理实时 IDE 事件，使用 `git diff HEAD`，逐个文件分析
- `RecipeImpactPlanner` 处理 rescan 批量 diff（hash 对比），不独立调用 `FileDiffPlanner`，而是消费 `runAllPhases` 的产出

```ts
// ── 输入/输出类型 ──

interface RecipeImpactPlannerInput {
  projectRoot: string;
  diff: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  sourceRefRepo: RecipeSourceRefRepositoryImpl;
  knowledgeRepo: KnowledgeRepositoryImpl;
}

type EvolutionCandidateReason =
  | 'source-deleted'           // 所有 sourceRef 文件都被删除
  | 'source-deleted-partial'   // 部分 sourceRef 文件被删除
  | 'source-modified-pattern'  // diff token score ≥ 0.3
  | 'source-missing';          // sourceRef 路径验证失效（来自 SourceRefReconciler stale）

interface EvolutionCandidate {
  recipeId: string;
  recipeTitle: string;
  reason: EvolutionCandidateReason;
  affectedFiles: string[];
  impactScore: number;          // 0-1, 取最高分
  matchedTokens: string[];      // pattern 候选的命中 token
  sourceRefs: string[];         // 该 Recipe 的所有 sourceRef
  activeRefCount: number;       // 仍 active 的 sourceRef 数
}

interface IgnoredChange {
  filePath: string;
  reason: 'no-recipe-reference' | 'impact-below-threshold' | 'recipe-not-active';
}

interface EvolutionCandidatePlan {
  candidates: EvolutionCandidate[];
  ignored: IgnoredChange[];
  summary: {
    totalChangedFiles: number;
    filesWithRecipeRef: number;
    candidateCount: number;
    ignoredCount: number;
    byReason: Record<EvolutionCandidateReason, number>;
  };
}
```

**核心逻辑**:

```ts
export class RecipeImpactPlanner {
  readonly #projectRoot: string;
  readonly #sourceRefRepo: RecipeSourceRefRepositoryImpl;
  readonly #knowledgeRepo: KnowledgeRepositoryImpl;

  // ⚠️ 注意: plan() 是 async，因为 knowledgeRepo.findById 是 async
  async plan(diff: DiffInput | null): Promise<EvolutionCandidatePlan> {
    if (!diff) {
      return this.#buildPlanFromStaleOnly();
    }
    const candidateMap = new Map<string, EvolutionCandidate>();
    const ignored: IgnoredChange[] = [];

    // ── Phase A: deleted 文件 → source-deleted / source-deleted-partial ──
    for (const deletedPath of diff.deleted) {
      const refs = this.#sourceRefRepo.findBySourcePath(deletedPath);
      if (refs.length === 0) {
        ignored.push({ filePath: deletedPath, reason: 'no-recipe-reference' });
        continue;
      }
      for (const ref of refs) {
        const allRefs = this.#sourceRefRepo.findByRecipeId(ref.recipeId);
        const activeRefs = allRefs.filter(r => r.status === 'active' && r.sourcePath !== deletedPath);
        const reason: EvolutionCandidateReason = activeRefs.length === 0
          ? 'source-deleted'
          : 'source-deleted-partial';
        await this.#mergeCandidate(candidateMap, ref.recipeId, {
          reason,
          affectedFiles: [deletedPath],
          impactScore: reason === 'source-deleted' ? 1.0 : 0.7,
          matchedTokens: [],
          activeRefCount: activeRefs.length,
        });
      }
    }

    // ── Phase B: modified 文件 → source-modified-pattern / ignored ──
    for (const modifiedPath of diff.modified) {
      const refs = this.#sourceRefRepo.findBySourcePath(modifiedPath);
      if (refs.length === 0) {
        ignored.push({ filePath: modifiedPath, reason: 'no-recipe-reference' });
        continue;
      }
      for (const ref of refs) {
        const entry = await this.#knowledgeRepo.findById(ref.recipeId);
        if (!entry || entry.lifecycle !== 'active') {
          ignored.push({ filePath: modifiedPath, reason: 'recipe-not-active' });
          continue;
        }
        const recipeTokens = extractRecipeTokens(entry);
        const impact = assessImpactUnified(this.#projectRoot, modifiedPath, recipeTokens);
        if (impact && impact.level === 'pattern') {
          await this.#mergeCandidate(candidateMap, ref.recipeId, {
            reason: 'source-modified-pattern',
            affectedFiles: [modifiedPath],
            impactScore: impact.score,
            matchedTokens: impact.matchedTokens,
            activeRefCount: -1,
          });
        } else {
          ignored.push({ filePath: modifiedPath, reason: 'impact-below-threshold' });
        }
      }
    }

    // ── Phase C: stale sourceRef → source-missing ──
    const staleRefs = this.#sourceRefRepo.findStale();
    for (const ref of staleRefs) {
      if (!candidateMap.has(ref.recipeId)) {
        await this.#mergeCandidate(candidateMap, ref.recipeId, {
          reason: 'source-missing',
          affectedFiles: [ref.sourcePath],
          impactScore: 0.5,
          matchedTokens: [],
          activeRefCount: -1,
        });
      }
    }

    return this.#buildPlan(candidateMap, ignored, diff);
  }
}
```

**关键边界情况**:

| 边界情况 | 处理 |
| --- | --- |
| 同一 Recipe 被多个 modified 文件命中 | `#mergeCandidate` 合并，取最高 impactScore + reason 优先级 |
| modified 文件无法做 git diff（rescan 场景） | `assessImpactUnified` 自动降级到全文 token 路径（见 §0.0.4 + §1.2） |
| 首次 rescan（无 diff、无 snapshot） | `plan(null)` → `#buildPlanFromStaleOnly()`，跳过 Phase A/B，只有 source-missing 来自 SourceRefReconciler |
| Recipe 处于非 active 状态 | 跳过，推入 `ignored` |
| added 文件 | 不分析（新文件不影响已有 Recipe） |
| `changeRatio > 0.5` | `FileDiffPlanner` 降级为 `mode='full'`，但 **diff 结果仍可用**，仍可生成 candidates |

### 1.2 统一影响评估：`assessImpactUnified` — 复用现有 `assessDiffImpact` 核心算法

**位置**: 扩展 `lib/service/evolution/ContentImpactAnalyzer.ts`

**设计原则**：不新建独立评估方法。所有场景共用同一个核心算法 `assessDiffImpact(diffTokens, recipeTokens)`，只是 `diffTokens` 的获取方式不同。

```ts
const FULL_CONTENT_PATTERN_THRESHOLD = 0.5;

export function assessImpactUnified(
  projectRoot: string,
  relativePath: string,
  recipeTokens: RecipeTokens
): DiffImpactResult | null {
  // 路径 1: git diff（已有 assessFileImpact）
  const gitResult = assessFileImpact(projectRoot, relativePath, recipeTokens);
  if (gitResult) {
    return gitResult;
  }

  // 路径 2: 文件全文 token（降级）
  const absPath = path.resolve(projectRoot, relativePath);
  if (!fs.existsSync(absPath)) {
    return null;
  }

  let content: string;
  try {
    content = fs.readFileSync(absPath, 'utf-8');
  } catch {
    return null;
  }

  const fileTokens = new Set(tokenizeIdentifiers(content));
  const result = assessDiffImpact(fileTokens, recipeTokens);

  return {
    ...result,
    level: result.score >= FULL_CONTENT_PATTERN_THRESHOLD ? 'pattern' : 'reference',
  };
}
```

**复用关系图**:
```
assessImpactUnified()                    （统一入口）
  ├→ assessFileImpact()                  （已有：git diff 路径）
  │    └→ getFileDiff() → parseDiffHunks() → tokenizeDiffLines() → diffTokens
  │         └→ assessDiffImpact(diffTokens, recipeTokens)  ← 核心算法
  │
  └→ tokenizeIdentifiers(fileContent) → fileTokens   （降级路径）
       └→ assessDiffImpact(fileTokens, recipeTokens)  ← 同一个核心算法
```

### 1.3 `forceRescanClean` — 强制重扫清理方法

**位置**: 扩展 `lib/service/cleanup/CleanupService.ts`

```ts
/** 强制重扫时清理的表（保留增量证据） */
const FORCE_RESCAN_CLEAN_TABLES = [
  'code_entities',
  'guard_violations',
  'semantic_memories',
  'sessions',
  'audit_logs',
  'remote_commands',
  'remote_state',
];

async forceRescanClean(): Promise<CleanupResult> {
  // 同 rescanClean 的逻辑，但不清 bootstrap_snapshots/bootstrap_dim_files/recipe_source_refs
  // 只清 FORCE_RESCAN_CLEAN_TABLES + pending/rejected/deprecated entries + 文件系统缓存
}
```

---

## 2. 需要修改的组件

### 2.1 `KnowledgeRescanIntent` — 参数化清理和分析模式

**文件**: `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`

**改动**:

```ts
// Before:
interface KnowledgeRescanWorkflowIntent {
  analysisMode: 'full';
  cleanupPolicy: 'rescan-clean';
}

// After（保留 'rescan-clean' 以向后兼容）:
interface KnowledgeRescanWorkflowIntent {
  analysisMode: 'incremental' | 'full';
  cleanupPolicy: 'none' | 'force-rescan' | 'rescan-clean';
}
```

**`createInternalKnowledgeRescanIntent` 改动**:

```ts
export function createInternalKnowledgeRescanIntent(
  args: InternalKnowledgeRescanArgs
): KnowledgeRescanWorkflowIntent {
  const forceMode = args.force ?? false;
  return {
    // ...existing
    analysisMode: forceMode ? 'full' : 'incremental',
    cleanupPolicy: forceMode ? 'force-rescan' : 'none',
  };
}
```

**连通性**: `InternalKnowledgeRescanArgs` (来自 `RescanInput` schema) 需新增 `force?: boolean` 字段。

### 2.2 `KnowledgeRescanWorkflowPlan` — incremental 由 intent 决定

**文件**: `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`

```ts
// Before:
const scan: ProjectAnalysisScanOptions = {
  incremental: false,  // 写死
};

// After:
const scan: ProjectAnalysisScanOptions = {
  incremental: intent.analysisMode === 'incremental',
};
```

### 2.3 `WorkflowCleanupPolicies` — 新增强制重扫策略

**文件**: `lib/workflows/capabilities/cleanup/WorkflowCleanupPolicies.ts`

```ts
// 新增:
export async function runForceRescanCleanPolicy(
  ctx: CleanupPolicyContext
): Promise<RescanCleanupResult> {
  const cleanupService = createCleanupService(ctx);
  const recipeSnapshot = await cleanupService.snapshotRecipes();
  const cleanResult = await cleanupService.forceRescanClean();
  return { recipeSnapshot, cleanResult };
}
```

### 2.4 `InternalKnowledgeRescanWorkflow` — 核心改造

**文件**: `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`

**改动范围**: Step 0-3 重写（原流程拆分为 SourceRef 校验 → Phase 1-4 → 影响分析 → Evolution Agent），Step 4-7 保持结构但调整输入。

```ts
export async function runInternalKnowledgeRescanWorkflow(ctx, args) {
  const intent = createInternalKnowledgeRescanIntent(args);
  const plan = buildKnowledgeRescanWorkflowPlan({ intent, projectRoot, dataRoot });

  // ════════════ Step 0: 清理策略（三路分支）════════════
  if (intent.cleanupPolicy === 'force-rescan') {
    const result = await runForceRescanCleanPolicy({ projectRoot, db, logger });
    recipeSnapshot = result.recipeSnapshot;
    cleanResult = result.cleanResult;
  } else if (intent.cleanupPolicy === 'rescan-clean') {
    const result = await runRescanCleanPolicy({ projectRoot, db, logger });
    recipeSnapshot = result.recipeSnapshot;
    cleanResult = result.cleanResult;
  } else {
    // 'none': 增量 — 不清理，只快照
    const cleanupService = new CleanupService({ projectRoot, db, logger });
    recipeSnapshot = await cleanupService.snapshotRecipes();
    cleanResult = { deletedFiles: 0, clearedTables: [], preservedRecipes: recipeSnapshot.count, errors: [] };
  }

  // ════════════ Step 0.5: Recipe 文件↔DB 一致性 ════════════
  syncKnowledgeStoreForRescan({ container, db, logger, logPrefix: 'Rescan-Internal' });

  // ════════════ Step 1: SourceRef 校验 + 反向清理 ════════════
  // 注意：实现中用 try/catch 包裹，repo 不可用时 graceful 跳过
  const reconciler = new SourceRefReconciler(projectRoot, sourceRefRepo, knowledgeRepo, { signalBus });
  reconcileReport = await reconciler.reconcile({ force: true });
  await reconciler.repairRenames();
  await reconciler.applyRepairs();

  // ════════════ Step 2: Phase 1-4 项目分析（含增量 diff 计算）════════════
  const phaseResults = await ProjectIntelligenceCapability.run({
    projectRoot, ctx, prepare: plan.projectAnalysis.prepare,
    scan: plan.projectAnalysis.scan,  // scan.incremental 由 intent.analysisMode 决定
    materialize: plan.projectAnalysis.materialize,
  });
  const { allFiles, incrementalPlan: _incrementalPlan } = phaseResults;

  // ════════════ Step 2.5: 构建进化候选 ════════════
  // try/catch 包裹，planner 异常时 graceful 跳过
  const diff = _incrementalPlan?.diff ?? null;
  const impactPlanner = new RecipeImpactPlanner(projectRoot, sourceRefRepo, knowledgeRepo);
  const candidatePlan = await impactPlanner.plan(diff);  // ⚠️ async

  // ════════════ Step 3: Evolution Agent 验证 ════════════
  if (candidatePlan?.candidates.length > 0) {
    // toEvolutionAuditRecipe 是 async，需 Promise.all
    const auditRecipes = await Promise.all(
      candidatePlan.candidates.map(c => toEvolutionAuditRecipe(c, knowledgeRepo))
    );
    await runEvolutionAudit({
      agentService, recipes: auditRecipes,
      projectOverview: { primaryLang, fileCount: allFiles.length, modules },
      proposalSource: 'rescan-evolution',
    });
  }

  // ════════════ Step 4: auditRecipesForRescan (保留用于 gap analysis) ════════════
  const auditSummary = await auditRecipesForRescan({ ... });

  // ════════════ Step 5-7: Gap analysis + Dimension Execution + 快照保存（基本不变）════════════
}
```

**连通性确认**:

| 依赖 | 来源 |
| --- | --- |
| `allFiles` / `_incrementalPlan` | `ProjectIntelligenceCapability.run()` 返回值，Phase 1 收集 + 内部自动计算（§7.3 已确认） |
| `agentService` | `ctx.container.get('agentService')` |
| `sourceRefRepo` / `knowledgeRepo` | `ctx.container.get('sourceRefRepository')` / `ctx.container.get('knowledgeRepository')` |
| `auditSummary` 下游消费者 | 保持 `auditRecipesForRescan` 原有流程不变，`candidatePlan` 独立用于 Step 3 Evolution Agent |
| `toEvolutionAuditRecipe` | async 函数，需传入 `knowledgeRepo`，通过 `Promise.all` 批量转换 |

### 2.5 `EvolutionAuditRecipe` — 扩展 impact 证据

**文件**: `lib/agent/runs/evolution/EvolutionAgentRun.ts`

```ts
// 扩展:
interface EvolutionAuditRecipe {
  // ...existing
  /** 新增: diff-based 影响证据 */
  impactEvidence?: {
    reason: EvolutionCandidateReason;
    affectedFiles: string[];
    impactScore: number;
    matchedTokens: string[];
  };
}
```

**转换函数**（async，位于 `RecipeImpactPlanner.ts` 中导出）:

```ts
export async function toEvolutionAuditRecipe(
  candidate: EvolutionCandidate,
  knowledgeRepo: KnowledgeRepositoryImpl
): Promise<EvolutionAuditRecipe> {
  const entry = await knowledgeRepo.findById(candidate.recipeId);
  let content: EvolutionAuditRecipe['content'];
  try {
    if (entry?.content) {
      const raw = typeof entry.content === 'string' ? JSON.parse(entry.content) : entry.content;
      content = raw as EvolutionAuditRecipe['content'];
    }
  } catch {
    content = undefined;
  }
  return {
    id: candidate.recipeId,
    title: candidate.recipeTitle,
    trigger: entry?.trigger ?? '',
    content,
    sourceRefs: candidate.sourceRefs,
    impactEvidence: {
      reason: candidate.reason,
      affectedFiles: candidate.affectedFiles,
      impactScore: candidate.impactScore,
      matchedTokens: candidate.matchedTokens,
    },
    auditHint: null,
  };
}
```

### 2.6 `ExternalKnowledgeRescanWorkflow` — 并行改造

**文件**: `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts`

改动与 Internal 完全对称，区别在于 Step 4 不直接调 `runEvolutionAudit`，而是将 `candidatePlan` 放入 Mission Briefing 传给外部 Agent。

```ts
const briefing = buildExternalMissionBriefing({
  ...existingParams,
  rescan: {
    evolutionCandidatePlan: candidatePlan,
    evidencePlan,
    prescreen,
  },
});
```

### 2.7 `RescanInput` schema — 新增 force 参数

**文件**: `lib/shared/schemas/mcp-tools.ts`

```ts
// 在 RescanInput 中新增:
force?: boolean;  // 强制全量重扫（清会话态缓存 + 全量 Phase 1-4）
```

---

## 3. 数据流连通性验证

### 3.1 增量模式完整数据流

```
用户调用 alembic rescan (force=false)
  │
  ├─ KnowledgeRescanIntent: analysisMode='incremental', cleanupPolicy='none'
  │
  ├─ Step 0: snapshotRecipes()
  │   └─ 读取 knowledge_entries WHERE lifecycle IN consumable → RecipeSnapshot
  │
  ├─ Step 0.5: syncKnowledgeStoreForRescan()
  │   └─ KnowledgeSyncService.sync() — recipes/ 目录 ↔ knowledge_entries 一致性
  │
  ├─ Step 1: SourceRefReconciler.reconcile({ force: true })
  │   ├─ knowledgeRepo.findAllIdAndReasoning() → [{ id, reasoning }]
  │   ├─ 遍历 reasoning.sources → 验证路径存在性 → upsert recipe_source_refs
  │   ├─ repairRenames() → git log --diff-filter=R → 检测 rename → status='renamed'
  │   └─ applyRepairs() → rewriteRecipePaths() + replaceSourcePath()
  │
  ├─ Step 2: Phase 1-4 项目分析 (incremental: true)
  │   ├─ ProjectIntelligenceCapability.run() — 全量 Phase 1-4（见 §7.1）
  │   ├─ Phase 1: 文件收集 → allFiles: BootstrapFile[]
  │   ├─ Phase 1.5: AST 分析 → astProjectSummary
  │   ├─ Phase 2: 依赖图 → depGraphData
  │   ├─ Phase 3: Guard 审计
  │   ├─ Phase 4: 维度解析 → activeDimensions
  │   └─ 内部自动计算 incrementalPlan（FileDiffPlanner.evaluate）
  │
  │   ✅ 连通性: allFiles 来自 phaseResults，格式为 BootstrapFile[]
  │   ✅ incrementalPlan 由 runAllPhases 内部自动计算（当 incremental: true 时）
  │
  ├─ Step 2.5: RecipeImpactPlanner.plan(incrementalPlan.diff)
  │   ├─ 从 phaseResults.incrementalPlan.diff 获取 DiffResult
  │   ├─ diff.deleted → sourceRefRepo.findBySourcePath() → source-deleted / source-deleted-partial
  │   ├─ diff.modified → sourceRefRepo.findBySourcePath() → assessImpactUnified() → source-modified-pattern
  │   ├─ sourceRefRepo.findStale() → source-missing
  │   └─ 返回 EvolutionCandidatePlan { candidates[], ignored[], summary }
  │
  │   ℹ️ incrementalPlan.diff 可能为 null（首次 rescan 无快照时）→ plan(null) 跳过 Phase A/B，只走 Phase C (stale)
  │
  ├─ Step 3: runEvolutionAudit({ recipes: await Promise.all(candidates.map(c => toEvolutionAuditRecipe(c, knowledgeRepo))), proposalSource: 'rescan-evolution' })
  │   ├─ AgentService.run({ profile: 'evolution-audit', strategyContext.sharedState.evolutionProposalSource })
  │   ├─ Agent 工具: propose_evolution / confirm_deprecation / skip_evolution
  │   ├─ EvolutionGateway.submit() 写入 evolution_proposals
  │   └─ ✅ evolutionGateEvaluator 统计口径已修复（按 recipeId 去重，§7.2）
  │
  ├─ Step 4-6: buildKnowledgeRescanPlan → gap analysis → dimension execution
  │
  └─ Step 7: FileDiffSnapshotStore.save()
      ├─ 保存新快照（自动淘汰旧快照 MAX_SNAPSHOTS=5）
      └─ allFiles 来自 Step 2 的 phaseResults
```

### 3.2 首次 rescan（无 snapshot）的降级路径

```
ProjectIntelligenceCapability.run({ incremental: true }) 内部:
  Phase 1: 文件收集 → allFiles
  evaluateProjectAnalysisIncrementalPlan:
    FileDiffPlanner.evaluate(allFiles, dimIds)
      └─ getLatest() → null（无历史快照）
      └─ 返回 { canIncremental: false, mode: 'full', diff: null }
  Phase 1.5~4: 全量执行（与 incremental 无关）

RecipeImpactPlanner.plan(null)
  └─ diff 为 null → 跳过 Phase A/B
  └─ Phase C: sourceRefRepo.findStale() → source-missing candidates
  └─ 返回只有 source-missing 候选的计划

Step 7: FileDiffSnapshotStore.save()
  └─ 保存首份快照，下次 rescan 即可产生 diff
```

### 3.3 `changeRatio > 0.5` 的降级路径

```
FileDiffPlanner.evaluate()
  └─ computeDiff → changeRatio=0.75
  └─ inferAffectedDimensions → mode='full', reason='变更比例 75% 超过阈值 (50%)'
  └─ 返回 { canIncremental: false, mode: 'full', diff: DiffResult }

关键: diff 仍然可用！只是 Phase 1-4 走全量。
RecipeImpactPlanner 仍然可以用 diff.deleted/modified 生成候选。
```

---

## 4. 边界情况清单

| # | 场景 | 预期行为 | 涉及组件 |
|---|------|---------|---------|
| 1 | 首次 rescan（无 snapshot） | `canIncremental=false`, 只有 source-missing 候选 | FileDiffPlanner, RecipeImpactPlanner |
| 2 | 无文件变化（diff 全 unchanged） | 0 candidates, 跳过 evolution audit, 只做 gap-fill | RecipeImpactPlanner |
| 3 | changeRatio > 0.5 | `mode='full'`, 但 diff 仍可用，可生成候选 | FileDiffPlanner |
| 4 | 同一 Recipe 被 3 个 modified 文件命中 | 合并为 1 candidate, impactScore 取最高 | RecipeImpactPlanner.#mergeCandidate |
| 5 | modified 文件不在 git（untracked） | `assessImpactUnified` 自动降级到文件全文 token 路径 | ContentImpactAnalyzer |
| 6 | Recipe 无 reasoning.sources | SourceRefReconciler.reconcile 跳过, 无 sourceRef → 不被 diff 命中 | SourceRefReconciler |
| 7 | recipe_source_refs 表为空（首次 bootstrap 后未填充） | reconcile() 从 knowledge_entries.reasoning 填充 → 首次建立映射 | SourceRefReconciler |
| 8 | Agent 超时不返回 | runEvolutionAudit → AgentService.run 有内置 timeout → 返回空结果 | EvolutionAgentRun |
| 9 | Agent 不调用任何 tool | proposed=0, deprecated=0, skipped=0 → 无进化决策写入 | EvolutionAgentRun |
| 10 | `--force` 模式 | forceRescanClean() + 全量分析 + diff 候选 | CleanupService, workflow |
| 11 | Ghost 模式（dataRoot ≠ projectRoot） | 路径解析使用 dataRoot，sourceRef 路径相对于 projectRoot | 全链路 |
| 12 | 大量文件变更（1000+ modified） | RecipeImpactPlanner 逐文件查 sourceRef，O(files × refs_per_file) | RecipeImpactPlanner — 可加索引缓存 |
| 13 | deleted 文件的 sourceRef 在 reconcile 时已标 stale | Phase A 和 Phase C 可能重复 → `#mergeCandidate` 去重 | RecipeImpactPlanner |

---

## 5. 实施顺序（按依赖关系排序）

> 全部已实现，commit `4603e4b`。

### Phase 1: 基础组件（无外部依赖）

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 1.0 | 提取 `computeContentHash()` 公共函数 | `lib/shared/content-hash.ts`（新建） + 4 处消费者替换 | ✅ |
| 1.1 | 新增 `assessImpactUnified()` 统一入口 | `lib/service/evolution/ContentImpactAnalyzer.ts` | ✅ |
| 1.2 | 新增 `forceRescanClean()` | `lib/service/cleanup/CleanupService.ts` | ✅ |
| 1.3 | 新增 `runForceRescanCleanPolicy()` | `lib/workflows/capabilities/cleanup/WorkflowCleanupPolicies.ts` | ✅ |
| 1.4 | `RescanInput` schema 新增 `force` 字段 | `lib/shared/schemas/mcp-tools.ts` | ✅ |
| 1.5 | 修复 `evolutionGateEvaluator` 统计口径（§7.2） | `lib/agent/prompts/insight-gate.ts` + test | ✅ |
| 1.6 | evolution-tools `source` 改为读 `_sharedState.evolutionProposalSource`（§7.4） | `evolution-tools.ts` + `EvolutionAgentRun.ts` + `ProposalRepository.ts` | ✅ |
| 1.7 | `SourceRefReconciler.reconcile()` 反向清理旧行（§7.5） | `lib/service/knowledge/SourceRefReconciler.ts` | ✅ |

### Phase 2: RecipeImpactPlanner（核心新组件）

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 2.1 | 新建 `RecipeImpactPlanner` 类 | `lib/service/evolution/RecipeImpactPlanner.ts` | ✅ |
| 2.2 | 单测（7 cases，全部通过） | `test/unit/RecipeImpactPlanner.test.ts` | ✅ |
| 2.3 | 扩展 `EvolutionAuditRecipe` 接口 + async `toEvolutionAuditRecipe` | `lib/agent/runs/evolution/EvolutionAgentRun.ts` + `RecipeImpactPlanner.ts` | ✅ |
| 2.4 | `runEvolutionAudit` 增加 `proposalSource` 透传到 strategyContext | `lib/agent/runs/evolution/EvolutionAgentRun.ts` | ✅ |

### Phase 3: Intent / Plan 参数化

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 3.1 | `KnowledgeRescanIntent` 参数化（含 `'rescan-clean'` 向后兼容） | `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts` | ✅ |
| 3.2 | `KnowledgeRescanWorkflowPlan` incremental 联动 | `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts` | ✅ |

### Phase 4: Workflow 改造（主战场）

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 4.1 | `InternalKnowledgeRescanWorkflow` 重写 Step 0-3 | `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts` | ✅ |
| 4.2 | `ExternalKnowledgeRescanWorkflow` 并行改造 | `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts` | ✅ |
| 4.3 | ~~`KnowledgeRescanPlanBuilder` 适配 candidatePlan~~ | 保持原有 `auditSummary` 流程不变，`candidatePlan` 独立消费 | ⏭️ 跳过 |
| 4.4 | ~~`RescanEvidenceProjectors` 适配 candidatePlan~~ | 同上 | ⏭️ 跳过 |

### Phase 5: CLI + 集成

| # | 任务 | 文件 | 状态 |
|---|------|------|------|
| 5.1 | CLI `--force` 参数传递 | `bin/cli.ts` | ✅ |
| 5.2 | MCP tools `force` 参数传递 | `lib/shared/schemas/mcp-tools.ts`（schema 层已覆盖） | ✅ |
| 5.3 | `ProposalSource` 枚举扩展 + dashboard 同步 | `ProposalRepository.ts` + `dashboard/src/types.ts` | ✅ |
| 5.4 | 集成测试: 增量路径 e2e | — | 🔲 待补充 |
| 5.5 | 集成测试: 强制重扫路径 e2e | — | 🔲 待补充 |

---

## 6. 文件变更清单（完整）

### 新建文件

| 文件 | 说明 |
| --- | --- |
| `lib/shared/content-hash.ts` | 统一 SHA256-hex16 hash 公共函数（消除 4 处重复实现） |
| `lib/service/evolution/RecipeImpactPlanner.ts` | 批量进化候选生成器 + `toEvolutionAuditRecipe` 转换函数 |
| `test/unit/RecipeImpactPlanner.test.ts` | 单测（7 cases） |

### 删除文件

| 文件 | 说明 |
| --- | --- |
| `lib/service/evolution/RelevanceAuditor.ts` | 旧启发式相关性审计，已被 `RecipeImpactPlanner` + diff-based 影响评估完全替代 |
| `test/unit/RelevanceAuditor.test.ts` | 对应单测 |

### 修改文件

| 文件 | 改动点 | 状态 |
| --- | --- | --- |
| `lib/service/evolution/ContentImpactAnalyzer.ts` | 新增 `assessImpactUnified()` + `FULL_CONTENT_PATTERN_THRESHOLD` 常量 | ✅ |
| `lib/service/cleanup/CleanupService.ts` | 新增 `forceRescanClean()` + `FORCE_RESCAN_CLEAN_TABLES`（`rescanClean` 保留，未标 deprecated） | ✅ |
| `lib/workflows/capabilities/cleanup/WorkflowCleanupPolicies.ts` | 新增 `runForceRescanCleanPolicy`（`runRescanCleanPolicy` 保留，未标 deprecated） | ✅ |
| `lib/shared/schemas/mcp-tools.ts` | `RescanInput` 新增 `force?: boolean` | ✅ |
| `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts` | `analysisMode` / `cleanupPolicy` 参数化（含 `'rescan-clean'` 向后兼容） | ✅ |
| `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts` | `scan.incremental` 由 `intent.analysisMode` 决定，`cleanup.policy` 直传 | ✅ |
| `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts` | 重写 Step 0-3（三路清理 + SourceRef + ImpactPlanner + EvolutionAgent） | ✅ |
| `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts` | 清理策略三路分支对齐 | ✅ |
| `lib/agent/runs/evolution/EvolutionAgentRun.ts` | `EvolutionAuditRecipe` 扩展 `impactEvidence`；`runEvolutionAudit` 增加 `proposalSource` | ✅ |
| `bin/cli.ts` | `rescan` 命令新增 `--force` 参数 | ✅ |
| `lib/agent/prompts/insight-gate.ts` | `evolutionGateEvaluator` 按 recipeId 去重，覆盖 4 个 tool 类型 | ✅ |
| `test/unit/evolution-gate-evaluator.test.ts` | 新增 `propose_evolution` 和去重测试用例 | ✅ |
| `lib/tools/handlers/evolution-tools.ts` | 新增 `resolveProposalSource(ctx)` 辅助函数，3 处 `source` 动态化 | ✅ |
| `lib/repository/evolution/ProposalRepository.ts` | `ProposalSource` 枚举扩展 `'rescan-evolution'` | ✅ |
| `dashboard/src/types.ts` | 前端 `ProposalSource` 同步扩展 | ✅ |
| `lib/service/knowledge/SourceRefReconciler.ts` | `reconcile()` 增加反向清理旧行 + `ReconcileReport.cleaned` | ✅ |
| `lib/workflows/capabilities/project-intelligence/FileDiffSnapshotStore.ts` | 替换内联 hash 为 `computeContentHash` | ✅ |
| `lib/infrastructure/cache/GraphCache.ts` | 替换内联 hash 为 `computeContentHash` | ✅ |
| `lib/infrastructure/vector/IndexingPipeline.ts` | 替换内联 hash 为 `computeContentHash` | ✅ |
| `lib/service/knowledge/RecipeExtractor.ts` | 内容 hash 替换为 `computeContentHash`（保留 md5 用于 ID 生成） | ✅ |

### 未修改文件（计划中但实际跳过）

| 文件 | 原计划 | 跳过原因 |
| --- | --- | --- |
| `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts` | 适配 `candidatePlan` | 保持原有 `auditSummary` 流程不变 |
| `lib/workflows/capabilities/planning/knowledge/RescanEvidenceProjectors.ts` | 适配 `candidatePlan` | 同上 |

### 不需要修改的文件（已确认连通性）

| 文件 | 原因 |
| --- | --- |
| `lib/workflows/capabilities/project-intelligence/FileDiffPlanner.ts` | 接口完全匹配，直接调用 |
| `lib/repository/sourceref/RecipeSourceRefRepository.ts` | `findBySourcePath` / `findByRecipeId` / `findStale` / `deleteOne` 已存在 |
| `lib/service/evolution/EvolutionGateway.ts` | `submit()` 接口不变 |
| `lib/service/evolution/FileChangeHandler.ts` | Layer 0 独立运行，不受影响 |
| `lib/shared/recipe-tokens.ts` | 直接复用 |
| `lib/shared/diff-parser.ts` | 直接复用 |

---

## 7. 风险点深度分析与处理方案

> 以下每个风险点均基于源码逐行确认，附具体修改方案和代码片段。

### 7.1 `runAllPhases` 增量模式的真实行为与优化路径

**代码确认**（`ProjectIntelligenceRunner.ts:1185-1413`）：

`runAllPhases({ incremental: true })` 的实际执行顺序是：
1. Phase 1（文件收集）→ 产出 `allFiles: BootstrapFileEntry[]`
2. **`evaluateProjectAnalysisIncrementalPlan({ allFiles })`** → 内部调用 `FileDiffPlanner.evaluate(allFiles, dimensionIds)` → 产出 `incrementalPlan`
3. Phase 1.5~4 **全量执行**，不受 `incrementalPlan` 影响

**关键发现**：`incrementalPlan`（含 `diff`）已经在 `runAllPhases` 内部计算完成，且包含在返回值中（`result.incrementalPlan`）。不需要单独调用 `FileDiffPlanner`。

**P1 处理方案**：直接使用 `runAllPhases` 返回值

```ts
// InternalKnowledgeRescanWorkflow 改造
const phaseResults = await runAllPhases(projectRoot, ctx, { incremental: true });

// incrementalPlan 已在内部计算完成，直接使用
const { incrementalPlan, allFiles } = phaseResults;
const diff = incrementalPlan?.diff ?? null;

// 传给 RecipeImpactPlanner
const candidatePlan = recipeImpactPlanner.plan(diff);
```

**P2 优化方案 — 跳过未受影响 Phase 的物化**：

`runAllPhases` 的 `materialize` 选项已支持细粒度控制。当 `incrementalPlan.mode === 'incremental'` 时，可以跳过部分写入：

```ts
const phaseResults = await runAllPhases(projectRoot, ctx, {
  incremental: true,
  materialize: incrementalPlan?.mode === 'incremental'
    ? { codeEntityGraph: false, callGraph: false, guardViolations: false, panorama: false }
    : true,  // full 模式全量写入
});
```

但这有鸡生蛋问题（`incrementalPlan` 在 `runAllPhases` 内部产出）。解决方案：**拆分为两步调用**：

```ts
// Step A: 先单独做 Phase 1 + incremental evaluation
const phase1 = await runPhase1_FileCollection(projectRoot, ctx.logger);
const { incrementalPlan } = await evaluateProjectAnalysisIncrementalPlan({
  enabled: true, projectRoot, ctx, allFiles: phase1.allFiles, report: null,
});

// Step B: 用 incrementalPlan 决定 materialize 策略，再跑 Phase 1.5-4
// 但当前 runAllPhases 不支持"跳过 Phase 1"，需要改接口
// → P2 新增 runPhases1_5to4(phase1Result, ctx, options) 函数
```

**P1 决策**：不拆分，直接用 `runAllPhases(incremental: true)`，Phase 1-4 全量执行（1-3s，可接受）。`incrementalPlan.diff` 直接传给 `RecipeImpactPlanner`。

**P2 任务**（加入实施计划）：
- 新增 `runPhasesAfterFileCollection(phase1Result, ctx, options)` 函数
- 让 `materialize` 能根据 `incrementalPlan` 动态决定
- 预计节省 Phase 1.6（Entity Graph）和 Phase 2.2（Panorama）的物化开销

### 7.2 `evolutionGateEvaluator` 统计口径不匹配 — ✅ 已修复

**代码确认**（`insight-gate.ts:610-658`）：

**原问题**：`evolutionGateEvaluator` 统计 `processed` 的方式是三种 tool 调用的次数之和（非按 recipeId 去重），且不包含 `propose_evolution`。

**已实现的修复**（按 recipeId 去重，覆盖所有 4 个 tool 类型）：

当前实现用**调用次数**与 `totalRecipes` 比较，存在两个问题：
1. `propose_evolution` 未计入 → gate 误判为"未处理"
2. 同一 Recipe 多次调用 → 次数虚高通过 gate

改为**按 recipeId 去重**更健壮：

```ts
// 注意：实际类型为 EvolutionToolCallRecord，字段名为 tool/name + args（非 params）
function countProcessedRecipes(toolCalls: EvolutionToolCallRecord[]): number {
  const processedIds = new Set<string>();
  for (const call of toolCalls) {
    const tool = call.tool || call.name;
    if (tool === 'submit_knowledge' && call.args?.supersedes) {
      processedIds.add(String(call.args.supersedes));
    }
    if (['propose_evolution', 'confirm_deprecation', 'skip_evolution'].includes(tool!)) {
      if (call.args?.recipeId) {
        processedIds.add(String(call.args.recipeId));
      }
    }
  }
  return processedIds.size;
}
```

**测试更新**：

```ts
// evolution-gate-evaluator.test.ts — 新增用例
it('should count propose_evolution as processed', () => {
  const toolCalls = [
    { tool: 'propose_evolution', args: { recipeId: 'r1' } },
    { tool: 'skip_evolution', args: { recipeId: 'r2' } },
    { tool: 'confirm_deprecation', args: { recipeId: 'r3' } },
  ];
  expect(countProcessedRecipes(toolCalls)).toBe(3);
});

it('should deduplicate same recipeId across tools', () => {
  const toolCalls = [
    { tool: 'propose_evolution', args: { recipeId: 'r1' } },
    { tool: 'submit_knowledge', args: { supersedes: 'r1' } },
  ];
  expect(countProcessedRecipes(toolCalls)).toBe(1);
});
```

| 文件 | 改动 | 状态 |
| --- | --- | --- |
| `lib/agent/prompts/insight-gate.ts` | `evolutionGateEvaluator` 已处理计数增加 4 个 tool 名 + 按 recipeId 去重 | ✅ 已完成 |
| `test/unit/evolution-gate-evaluator.test.ts` | 新增 `propose_evolution` 和去重测试用例 | ✅ 已完成 |

**实际返回 artifact 格式**（改为只包含 `processed` 和 `totalRecipes`，不再拆分 `evolved/deprecated/skipped`）：

```ts
return { action: 'pass', artifact: { processed, totalRecipes } };
```

### 7.3 `currentFiles` 收集时序 — 已解决

**代码确认**（`ProjectIntelligenceRunner.ts:1247-1256`）：

```ts
// runAllPhases 内部流程（行 1247-1256）
const incrementalEvaluation = await evaluateProjectAnalysisIncrementalPlan({
  enabled: options.incremental === true,
  projectRoot,
  ctx,
  allFiles,  // ← Phase 1 产出的 allFiles 直接传入
  report,
});
const incrementalPlan = incrementalEvaluation.incrementalPlan;
```

**结论**：**不存在时序问题**。`runAllPhases` 内部已将 Phase 1 的 `allFiles` 传给 `evaluateProjectAnalysisIncrementalPlan`，后者调用 `FileDiffPlanner.evaluate(allFiles, dimensionIds)` 计算 diff。整个过程在一次 `runAllPhases` 调用中完成。

**返回值确认**：

```ts
return {
  allFiles,           // Phase 1 产出
  incrementalPlan,    // 含 diff: { added, modified, deleted, unchanged, changeRatio }
  // ... 其他 Phase 结果
};
```

**处理方案**：直接使用 `runAllPhases` 返回值，无需任何额外文件收集。方案 B 中"先全量 Phase 1-4，再从结果取文件列表"实际就是 `runAllPhases` 的默认行为。

**从实施计划中移除**：此风险点无需任何代码改动。

### 7.4 evolution-tools `source` 固定为 `'decay-scan'` — ✅ 已通过 `sharedState` 传递

**代码确认**（`evolution-tools.ts:128-131, 200-203, 241-244`）：

三个 tool handler 中 `source` 硬编码：
```ts
// propose_evolution (行 131)
source: 'decay-scan',
// confirm_deprecation (行 203)
source: 'decay-scan',
// skip_evolution (行 244)
source: 'decay-scan',
```

**关键发现**：`ctx.source` 的运行时值是 **pipeline stage 名**（如 `'evolve'`）或 preset 名，由 `ToolExecutionPipeline` 设置（`source.name = loopCtx.context?.pipelinePhase || loopCtx.source`）。**不能直接当 `ProposalSource` 用**——语义完全不同。

**`ProposalSource` 已有值**（`ProposalRepository.ts:46-52`）：

| `source` | 使用位置 |
| --- | --- |
| `'decay-scan'` | `evolution-tools.ts`（Agent 工具） |
| `'file-change'` | `FileChangeHandler.ts`（实时文件变更） |
| `'consolidation'` | `consolidate.ts` / `RecipeProductionGateway.ts` |
| `'ide-agent'` | `evolve-external.ts`（MCP） |
| `'metabolism'` | 代谢管线 |
| `'relevance-audit'` | 旧 RelevanceAuditor（已废弃但类型保留） |

**P1 修复方案 — 通过 `strategyContext.sharedState` 传递**：

`PipelineStrategy` 已将 `strategyContext.sharedState` 传入 `reactLoop`，`contextFromToolCall` 会映射为 `ctx._sharedState`。这是最小侵入路径：

```ts
// EvolutionAgentRun.ts — runEvolutionAudit 增加 sharedState
await agentService.run({
  profile: { id: 'evolution-audit' },
  context: {
    strategyContext: {
      existingRecipes: recipes,
      sharedState: { evolutionProposalSource: 'rescan-evolution' },  // 新增
      // ...
    },
  },
});
```

```ts
// evolution-tools.ts — 每个 handler 中
const proposalSource = (ctx._sharedState as Record<string, unknown>)
  ?.evolutionProposalSource as string | undefined;
// ...
source: proposalSource ?? 'decay-scan',
```

**向后兼容**：`_sharedState` 为可选，不传时降级为 `'decay-scan'`。`ProposalSource` 枚举需扩展 `'rescan-evolution'`：

```ts
// ProposalRepository.ts — ProposalSource 扩展（在现有 6 个值基础上新增）
type ProposalSource =
  | 'ide-agent' | 'metabolism' | 'decay-scan'
  | 'consolidation' | 'relevance-audit' | 'file-change'
  | 'rescan-evolution';  // 新增
```

| 文件 | 改动 | 状态 |
| --- | --- | --- |
| `lib/tools/handlers/evolution-tools.ts` | 3 处通过 `resolveProposalSource(ctx)` 读 `_sharedState?.evolutionProposalSource ?? 'decay-scan'` | ✅ 已完成 |
| `lib/agent/runs/evolution/EvolutionAgentRun.ts` | `runEvolutionAudit` 接受 `proposalSource` 参数，通过 `strategyContext.sharedState` 传入 | ✅ 已完成 |
| `lib/repository/evolution/ProposalRepository.ts` | `ProposalSource` 枚举扩展 `'rescan-evolution'` | ✅ 已完成 |
| `dashboard/src/types.ts` | 前端 `ProposalSource` 同步扩展 | ✅ 已完成 |

### 7.5 `SourceRefReconciler.reconcile()` 旧路径积累 — ✅ 已实现增量清理

**代码确认**（`SourceRefReconciler.ts:82-196`）：

`reconcile()` 遍历 `knowledge_entries.reasoning.sources`，对每个 `(recipeId, sourcePath)` 做 upsert。但**不处理反向情况**：如果某个 Recipe 以前有 `sources: ['a.ts', 'b.ts']`，现在更新为 `sources: ['a.ts']`，则 `b.ts` 的旧行**不会被删除或标记为 stale**。

**影响分析**：

1. **旧行的 `verifiedAt` 不会被更新** → 超过 24h TTL 后，下次 reconcile 会重新验证
2. 如果 `b.ts` 已被删除 → 重新验证时会被标 `stale` → 后续 `RecipeImpactPlanner.findStale()` 会将其标为 `source-missing` 候选 → Evolution Agent 验证
3. 如果 `b.ts` 仍存在但不再被引用 → 行留存为 `active`，但不影响正确性（只会让该 Recipe 多一个"幽灵"关联）

**真正的风险**：幽灵 `active` 行导致 `RecipeImpactPlanner` 误命中 — 当 `b.ts` 被 modified 时，会错误地将该 Recipe 标为候选。

**P1 处理方案 — 在 reconcile 中增加反向清理**：

```ts
// SourceRefReconciler.ts — reconcile() 方法内，for (const row of rows) 循环中
async reconcile(opts?: { force?: boolean }): Promise<ReconcileReport> {
  // ... 现有逻辑 ...

  for (const row of rows) {
    // 提取当前 reasoning.sources
    const sources = /* 现有解析逻辑 */;
    const sourcesSet = new Set(sources);

    // 新增：清理不再被引用的旧行
    const existingRefs = this.#sourceRefRepo.findByRecipeId(row.id);
    for (const ref of existingRefs) {
      if (!sourcesSet.has(ref.sourcePath)) {
        // 该路径不再出现在 reasoning.sources 中 → 删除
        this.#sourceRefRepo.deleteOne(row.id, ref.sourcePath);
        report.cleaned = (report.cleaned ?? 0) + 1;
      }
    }

    // ... 现有 upsert 逻辑 ...
  }
}
```

**性能考虑**：`findByRecipeId` 每个 Recipe 一次 SELECT，在 Recipe 数 < 1000 时可接受。若需优化，可预加载全表到内存 Map。

**向后兼容**：`ReconcileReport` 新增可选 `cleaned?: number` 字段，不影响现有消费者。

| 文件 | 改动 | 状态 |
| --- | --- | --- |
| `lib/service/knowledge/SourceRefReconciler.ts` | `reconcile()` 增加反向清理逻辑（在 upsert 前先删除不在 `sourcesSet` 中的旧行） | ✅ 已完成 |
| `lib/service/knowledge/SourceRefReconciler.ts` | `ReconcileReport` 新增 `cleaned?: number` 字段 | ✅ 已完成 |

### 7.6 风险点总结与实施优先级

| # | 风险点 | 严重性 | 处理方案 | 状态 |
|---|--------|--------|---------|------|
| 7.1 | runAllPhases 增量模式 | 低 | 接受现状，直接用返回值中的 `incrementalPlan.diff` | ✅ 无需改动 |
| 7.2 | evolutionGateEvaluator 统计 | **高** | 按 recipeId 去重，覆盖 4 个 tool 类型 | ✅ 已修复 |
| 7.3 | currentFiles 收集时序 | 无 | **不存在** — `runAllPhases` 内部已处理 | ✅ 无需改动 |
| 7.4 | evolution-tools source | 中 | `resolveProposalSource(ctx)` + strategyContext 传递 | ✅ 已修复 |
| 7.5 | SourceRefReconciler 旧行 | 中 | reconcile 增加反向清理 | ✅ 已修复 |
