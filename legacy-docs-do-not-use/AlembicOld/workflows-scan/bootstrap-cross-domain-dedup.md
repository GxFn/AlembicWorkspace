# Bootstrap 冷启动领域间去重设计

> 状态: Draft  
> 创建: 2026-04-16  
> 关联: Phase 5 orchestrator, ConsolidationAdvisor, RecipeProductionGateway

---

## 1. 问题陈述

内置 Agent 执行冷启动（bootstrap）时，Phase 5 按维度（dimension）并行/分层扫描项目代码，由 Producer Agent 逐条调用 `submit_knowledge` 提交候选。
当前流程存在 **领域间知识重复** 问题：同一代码模式可能被不同维度各提交一次，或同维度内不同 Target 产出的候选高度相似却未被拦截。

### 1.1 重复的 5 个漏洞

| # | 漏洞 | 根因 | 所在文件 |
|---|------|------|----------|
| **G1** | **ConsolidationAdvisor 被旁路** | `lifecycle.ts` 中 `skipConsolidation: true` 硬编码 | `lib/agent/tools/lifecycle.ts:189-190` |
| **G2** | **相似度检查也被旁路** | `skipSimilarityCheck: true` 硬编码 | `lib/agent/tools/lifecycle.ts:189` |
| **G3** | **类别隔离的比较范围** | `#loadRelatedRecipes` 只加载同 category 的 Recipe，跨维度知识不可见 | `ConsolidationAdvisor.ts:280-330` |
| **G4** | **Producer 逐条提交无批量去重** | Producer 每条独立 submit，不等前一条写入 DB | `insight-producer.ts` 系统提示 |
| **G5** | **并行维度竞态** | Tier 内最多 3 维度并行执行，各自的 Producer 提交可能在 DB 可见前互相竞争 | `orchestrator.ts` TierScheduler |

### 1.2 典型重复场景

```
维度 "code-pattern" 的 Producer 提交:
  → "NetworkClient 重试机制 — 指数退避 + 断路器"

维度 "best-practice" 的 Producer 提交:
  → "API 请求最佳实践 — 重试策略与错误处理"

两条候选核心代码相同（都引用 RetryHandler.swift），
但 category 不同 → ConsolidationAdvisor 永远不会互相比较。
```

---

## 2. 设计目标

1. **Bootstrap 期间启用去重** — ConsolidationAdvisor + Similarity 检查不再被旁路
2. **跨维度可见性** — 相似度比较范围扩展到全库，不限于同 category
3. **批内互查** — 同一 Producer 批次的候选在提交前先互相比较
4. **并行安全** — 解决 Tier 内并行维度的竞态写入问题
5. **性能可控** — 不显著拖慢冷启动速度（目标：增加 < 15% 耗时）

### 非目标

- 不改变 Producer Agent 的提示工程（提示中已有"跨维度去重"提示）
- 不改变维度划分逻辑或 Tier 调度策略
- 不引入向量语义去重（当前结构相似度已够用）

---

## 3. 方案设计

### 3.1 架构概览

```
Producer (submit_knowledge)
    │
    ▼
┌─────────────────────────────────────────────────┐
│  RecipeProductionGateway.create()                │
│                                                   │
│  Step 1: Validation  ← 不变                      │
│  Step 2: Similarity Check  ← ★ 启用             │
│  Step 3: Consolidation     ← ★ 启用 + 跨域      │
│  Step 4: Persist                                  │
│  Step 5: Quality Score                            │
└─────────────────────────────────────────────────┘
         │
  ConsolidationAdvisor.analyze()
         │
    ┌────┴────────────────────┐
    │  #loadRelatedRecipes()  │
    │  ★ 跨 category 加载     │
    │  + BootstrapDedup 缓存  │
    └─────────────────────────┘
```

### 3.2 变更点清单

#### 变更 A: lifecycle.ts — 启用 Consolidation

**文件**: `lib/agent/tools/lifecycle.ts`  
**行**: 189-190

```typescript
// Before:
options: {
  skipSimilarityCheck: true,
  skipConsolidation: true,
  ...
}

// After:
options: {
  skipSimilarityCheck: false,
  skipConsolidation: false,
  ...
}
```

风险: 启用后 ConsolidationAdvisor 对每条候选执行 `analyze()`，含 DB 查询。  
缓解: 见变更 D（内存缓存）。

---

#### 变更 B: ConsolidationAdvisor — 跨 Category 加载

**文件**: `lib/service/evolution/ConsolidationAdvisor.ts`  
**方法**: `#loadRelatedRecipes()`

当前逻辑:
```
if (category) → findAllByLifecyclesAndCategory(category, 30)
else          → findAllByLifecycles().slice(0, 30)
```

改为 **两阶段加载**:

```typescript
async #loadRelatedRecipes(candidate: CandidateForConsolidation): Promise<RecipeSummary[]> {
  const category = candidate.category || '';
  const results: RecipeSummary[] = [];
  const seenIds = new Set<string>();

  // Phase 1: 同 category（高优先级，完整加载）
  if (category) {
    const entries = await this.#knowledgeRepo.findAllByLifecyclesAndCategory(
      COUNTABLE_LIFECYCLES, category, MAX_CANDIDATES_PER_ANALYSIS,
    );
    for (const e of entries.map(toSummary)) {
      results.push(e);
      seenIds.add(e.id);
    }
  }

  // Phase 2: 全库补充（跨域可见性）
  //   — 仅在结果 < 阈值时触发，避免大库性能问题
  if (results.length < CROSS_DOMAIN_THRESHOLD) {
    const all = await this.#knowledgeRepo.findAllByLifecycles(COUNTABLE_LIFECYCLES);
    for (const e of all) {
      const s = toSummary(e);
      if (!seenIds.has(s.id)) {
        results.push(s);
        if (results.length >= MAX_CANDIDATES_PER_ANALYSIS) { break; }
      }
    }
  }

  return results;
}
```

新增常量: `CROSS_DOMAIN_THRESHOLD = 20`  
语义: 当同域 Recipe 少于 20 条时（冷启动初期几乎一定如此），自动加载全库进行比较。

---

#### 变更 C: BootstrapDedup — 会话级内存缓存

**新文件**: `lib/service/bootstrap/BootstrapDedup.ts`

解决 G4（逐条提交无批量去重）和 G5（并行竞态）的核心组件。

```typescript
/**
 * BootstrapDedup — 冷启动期间的会话级去重缓存
 *
 * 生命周期: 随 bootstrap session 创建/销毁
 * 作用:
 *   1. 缓存当前 session 已提交的候选摘要（解决 DB 写入延迟）
 *   2. 提供快速结构相似度比较（不查 DB）
 *   3. 线程安全：同步写入，避免竞态
 */
export class BootstrapDedup {
  #candidates: CandidateSummary[] = [];

  /** 注册已提交的候选（submit_knowledge 成功后调用） */
  register(summary: CandidateSummary): void;

  /** 检查新候选是否与已注册候选重复 */
  findDuplicate(candidate: CandidateSummary, threshold?: number): DedupMatch | null;

  /** 批量检查（用于 analyzeBatch） */
  findDuplicates(candidates: CandidateSummary[], threshold?: number): DedupMatch[];

  /** 清空（session 结束时调用） */
  clear(): void;

  get count(): number;
}

interface CandidateSummary {
  id: string;
  title: string;
  category: string;
  coreCode: string;
  doClause: string;
  dontClause: string;
  guardPattern?: string;
}

interface DedupMatch {
  existingId: string;
  existingTitle: string;
  similarity: number;
}
```

**集成方式**:

1. `orchestrator.ts` 在 Phase 5 开始前创建 `BootstrapDedup` 实例
2. 通过 AgentFactory context 注入到各维度的 Agent Runtime
3. `lifecycle.ts` 的 `submit_knowledge` handler 中:
   - 提交前调用 `bootstrapDedup.findDuplicate()` 快速检查
   - 提交成功后调用 `bootstrapDedup.register()` 注册
4. `orchestrator.ts` 在 Phase 5 结束后调用 `bootstrapDedup.clear()`

**相似度算法**: 复用 ConsolidationAdvisor 的 4 维权重（title 0.2 + clause 0.3 + code 0.3 + guard 0.2），但是纯内存计算，不涉及 DB 查询。

---

#### 变更 D: ConsolidationAdvisor — 接受外部缓存

**文件**: `lib/service/evolution/ConsolidationAdvisor.ts`

在 `analyze()` 中增加可选的 `sessionCache` 参数:

```typescript
async analyze(
  candidate: CandidateForConsolidation,
  options?: { sessionRecipes?: RecipeSummary[] },
): Promise<ConsolidationAdvice> {
  // #loadRelatedRecipes 结果 + sessionRecipes 合并
  const dbRecipes = await this.#loadRelatedRecipes(candidate);
  const allRecipes = options?.sessionRecipes
    ? this.#mergeUnique(dbRecipes, options.sessionRecipes)
    : dbRecipes;
  // ... 后续逻辑使用 allRecipes
}
```

这样 BootstrapDedup 的缓存可以作为 "虚拟 Recipe" 传入比较范围，解决 DB 写入延迟导致的盲区。

---

#### 变更 E: RecipeProductionGateway — Bootstrap 模式选项

**文件**: `lib/service/knowledge/RecipeProductionGateway.ts`

为 `create()` 的 `options` 增加 `bootstrapDedup` 字段:

```typescript
interface CreateOptions {
  // ... 既有字段
  bootstrapDedup?: BootstrapDedup;  // 冷启动去重缓存
}
```

在 Step 2 (Similarity Check) 前增加:

```typescript
// Step 1.5: Bootstrap session-level dedup (fast, in-memory)
if (options.bootstrapDedup) {
  const match = options.bootstrapDedup.findDuplicate(candidateSummary);
  if (match && match.similarity >= 0.65) {
    result.duplicates.push({
      index, title: item.title || '',
      similarTo: [{ title: match.existingTitle, similarity: match.similarity }],
    });
    continue;  // 跳过此条
  }
}
```

在 Step 4 (Persist) 成功后:

```typescript
// 注册到 session 缓存
options.bootstrapDedup?.register({
  id: saved.id,
  title: saved.title,
  category: saved.category || '',
  coreCode: item.coreCode || '',
  doClause: item.doClause || '',
  dontClause: item.dontClause || '',
  guardPattern: item.content?.pattern,
});
```

---

### 3.3 数据流时序

```
Phase 5 Start
│
├─ 创建 BootstrapDedup 实例（空）
│
├─ Tier 1: 并行执行 3 个维度
│  │
│  ├─ Dim "code-pattern" Producer:
│  │  submit_knowledge("Retry Pattern")
│  │    → BootstrapDedup.findDuplicate() → null（首条）
│  │    → Gateway.create():
│  │      → Step 2: SimilarityCheck → pass
│  │      → Step 3: ConsolidationAdvisor.analyze()
│  │        → #loadRelatedRecipes():
│  │          Phase 1: category="code-pattern" → [] (冷启动，空)
│  │          Phase 2: 全库 → [] (冷启动，空)
│  │        → action: "create"
│  │      → Step 4: Persist → recipe_001
│  │    → BootstrapDedup.register(recipe_001 摘要)
│  │
│  ├─ Dim "best-practice" Producer (并行):
│  │  submit_knowledge("API Retry Best Practice")
│  │    → BootstrapDedup.findDuplicate()
│  │      → 比较 vs recipe_001 摘要
│  │      → similarity = 0.72 ≥ 0.65 → DUPLICATE DETECTED ✓
│  │    → 返回 merged/blocked（不写 DB）
│  │
│  └─ Dim "architecture" Producer (并行):
│     submit_knowledge("网络层架构 — 重试与熔断")
│       → BootstrapDedup.findDuplicate()
│         → 比较 vs recipe_001: similarity = 0.38 < 0.65 → pass
│       → Gateway.create():
│         → ConsolidationAdvisor.analyze()
│           → Phase 2 全库加载 → 找到 recipe_001
│           → similarity = 0.45 → action: "create"（中度差异，允许）
│         → Persist → recipe_002
│       → BootstrapDedup.register(recipe_002 摘要)
│
├─ Tier 2: 下一批维度（此时 cache 已有 2 条）
│  │
│  └─ 后续提交都会与 cache 中的 recipe_001 + recipe_002 比较
│
├─ Phase 5 End
│  └─ BootstrapDedup.clear()
│
└─ Phase 5.5: Skill generation (不受影响)
```

---

## 4. 性能分析

| 操作 | 当前耗时 | 变更后耗时 | 说明 |
|------|----------|-----------|------|
| BootstrapDedup.findDuplicate() | 0ms（不存在） | ~0.1ms | 纯内存 Jaccard 比较，O(n) n=已注册数 |
| ConsolidationAdvisor.analyze() | 0ms（被旁路） | ~5-15ms | 含 1 次 DB 查询 + 结构比较 |
| #loadRelatedRecipes Phase 2 | 0ms（不存在） | ~2-5ms | 冷启动期全库小，仅在 < 20 条时触发 |
| 每条候选总增量 | — | ~5-20ms | |
| 典型 bootstrap 50 条候选 | — | +0.5-1s | 占总耗时 < 5% |

**结论**: 性能影响可忽略。BootstrapDedup 的内存快速检查在大部分情况下能提前拦截，减少不必要的 ConsolidationAdvisor 分析。

---

## 5. 阈值配置

| 阈值 | 值 | 用途 |
|------|-----|------|
| `BOOTSTRAP_DEDUP_THRESHOLD` | 0.65 | BootstrapDedup 内存快速拦截阈值 |
| `CROSS_DOMAIN_THRESHOLD` | 20 | #loadRelatedRecipes 同域结果数 < 此值时加载全库 |
| `ENHANCE_THRESHOLD` | 0.4 | ConsolidationAdvisor 已有，merge 建议阈值 |
| `HIGH_OVERLAP_THRESHOLD` | 0.65 | ConsolidationAdvisor 已有，高重叠阈值 |
| `SIMILARITY_THRESHOLD` | 0.7 | Gateway 已有，相似度检查拦截阈值 |

关系: `BootstrapDedup(0.65)` ≤ `Gateway SimilarityCheck(0.7)`  
含义: 内存缓存用稍宽松的阈值提前拦截明显重复，ConsolidationAdvisor 负责精细判断。

---

## 6. 实施计划

### Phase A: 核心去重（优先级高）

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| A1 | 创建 `BootstrapDedup` 类 | `lib/service/bootstrap/BootstrapDedup.ts` | M |
| A2 | lifecycle.ts 取消 skip 标记 | `lib/agent/tools/lifecycle.ts` | S |
| A3 | lifecycle.ts 集成 BootstrapDedup | `lib/agent/tools/lifecycle.ts` | S |
| A4 | Gateway 集成 BootstrapDedup | `lib/service/knowledge/RecipeProductionGateway.ts` | M |
| A5 | 单元测试: BootstrapDedup | `test/unit/BootstrapDedup.test.ts` | M |

### Phase B: 跨域可见性

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| B1 | ConsolidationAdvisor 跨 category 加载 | `lib/service/evolution/ConsolidationAdvisor.ts` | M |
| B2 | ConsolidationAdvisor 接受 sessionRecipes | `lib/service/evolution/ConsolidationAdvisor.ts` | S |
| B3 | 单元测试: 跨域比较 | `test/unit/ConsolidationAdvisor.test.ts` | M |

### Phase C: 编排集成

| # | 任务 | 文件 | 复杂度 |
|---|------|------|--------|
| C1 | orchestrator.ts 创建/注入/清理 BootstrapDedup | `orchestrator.ts` | M |
| C2 | DI 注册 | `ServiceMap.ts`, `KnowledgeModule.ts` | S |
| C3 | 集成测试 | `test/integration/` | L |

---

## 7. 回退策略

- `BootstrapDedup` 仅在 bootstrap session 存在时激活，非 bootstrap 场景不受任何影响
- 若去重过于激进（误判），可通过环境变量 `ALEMBIC_BOOTSTRAP_DEDUP=false` 关闭:
  - 关闭后退回 `skipSimilarityCheck: true, skipConsolidation: true`
- ConsolidationAdvisor 的跨域加载通过 `CROSS_DOMAIN_THRESHOLD` 控制，设为 0 可禁用

---

## 8. 关联影响

| 组件 | 影响 |
|------|------|
| External Agent (IDE bootstrap) | 不受影响 — 外部 Agent 走 `bootstrap-external.ts`，不经过 Gateway |
| Rescan/Incremental | 受益 — rescan 也走 `submit_knowledge`，同样启用去重 |
| 手动 submit_knowledge | 受益 — Dashboard/MCP 提交也经过 Gateway |
| Evolution Pipeline | 不受影响 — ProposalExecutor 有独立的 `#hasDuplicate` |
| ConsolidationAdvisor.analyzeBatch() | 受益 — 批次内互查已有，加上 BootstrapDedup 补充跨批次检查 |
