# Recipe 进化系统重构方案

> 状态：**Phase 1–2.5 已实现** | 创建于 2026-04-16 | 最后更新 2026-04-16（§16 深度审计）

## 1. 问题诊断

### 1.1 类型定义碎片化

当前有 **4 套并行的进化类型系统**，描述的是同一件事：

| 系统 | 类型名 | 值 | 位置 |
|------|--------|-----|------|
| Proposal 仓储层 | `ProposalType` | 7 种: merge, supersede, enhance, deprecate, reorganize, contradiction, correction | `ProposalRepository.ts` |
| Metabolism 服务层 | `ProposalType`（重定义） | 5 种: merge, enhance, deprecate, contradiction, correction | `KnowledgeMetabolism.ts` |
| Agent 工具 | tool names | 3 种: propose_evolution, confirm_deprecation, skip_evolution | `evolution-tools.ts` |
| MCP 外部接口 | `action` enum | 3 种: propose_evolution, confirm_deprecation, skip | `mcp-tools.ts` |
| 文件变更响应 | `ReactiveAction` | 5 种: fix-rename, fix-symbol, deprecate, skip, needs-review | `reactive-evolution.ts` |

**问题**：同一个"更新内容"的意图，在不同层叫 `enhance` / `correction` / `propose_evolution`；同一个"废弃"的意图，叫 `deprecate` / `confirm_deprecation` / `deprecated`。开发者需要在脑中维护 5 套映射。

### 1.2 职责模糊

| 问题 | 表现 |
|------|------|
| `contradiction` 不是进化方向 | 它是一个**发现型信号**（两个 Recipe 存在矛盾），但被塞进了 ProposalType。ProposalExecutor 对它的处理是 `skipped`（HIGH_RISK_TYPES），永远不会自动执行。 |
| `reorganize` 无人创建 | 没有任何 Analyzer 会产出 reorganize 类型的 Proposal。它只存在于 ProposalType 定义和 ProposalExecutor 的 skip 列表中。 |
| `merge` 和 `supersede` 是同一件事的两面 | merge = 两 Recipe 合并为一。supersede = 新 Recipe 取代旧 Recipe。最终效果相同：一条 Recipe 退役、一条存活。 |
| `enhance` 和 `correction` 几乎一样 | ProposalExecutor 对两者的执行逻辑完全相同（FP rate + 使用量 → ContentPatcher）。区别仅在观察窗口长度（48h vs 24h）。 |
| `ReactiveAction` 与 `ProposalType` 正交 | fix-rename 是运维动作不走 Proposal；needs-review 不是动作而是信号。强行拉通只会更乱。 |

### 1.3 触发时机单一

- `ProposalExecutor.checkAndExecute()` 仅在 `alembic ui` / `alembic start` 启动时触发（UiStartupTasks Stage 5）
- 开发者可能一天只启动一次 UI，高置信度提案可能延迟数小时才被执行
- `evolve-check` 命令会批量创建提案，但不触发 `checkAndExecute()`
- Dashboard 无 Proposal 列表视图，开发者无法看到待处理提案

## 2. 设计原则

1. **一条 Recipe 只有三种归宿**：内容刷新、废弃退休、确认有效
2. **运维动作不是进化决策**：自动修复 sourceRef 不走 Proposal
3. **观察窗口统一**：按风险等级分 tier，不按 Proposal 类型分
4. **信号和动作分离**：矛盾/冗余是信号，进化/废弃是动作
5. **触发时机多元化**：不只依赖启动时一次性检查

## 3. 统一进化模型

### 3.1 三个进化方向（EvolutionAction）

```typescript
/**
 * Recipe 进化的三种且仅有三种方向。
 * 所有入口（Agent 工具、MCP、Metabolism、CLI）最终都映射到这三种。
 */
export type EvolutionAction = 'update' | 'deprecate' | 'valid';
```

| 方向 | 含义 | 走 Proposal？ | 对应旧类型 |
|------|------|--------------|-----------|
| **update** | 模式仍在，内容需刷新 | ✅ 创建 observing proposal → 观察窗口到期 → ContentPatcher | enhance, correction, propose_evolution |
| **deprecate** | 模式已消失，Recipe 退休 | ⚠️ 看来源（见 3.2） | deprecate, confirm_deprecation |
| **valid** | 确认仍然准确 | ❌ 直接刷新 lastVerifiedAt | skip, skip_evolution, still_valid |

### 3.2 废弃路径的两种模式

```
Agent 验证后确认（高置信）→ 立即 deprecated（无观察窗口）
  ↳ confirm_deprecation 工具 / MCP action
  ↳ 场景：Agent 已读过源码，确认文件删除且无替代

规则引擎检测到衰退（低置信）→ 创建 observing proposal → 7d 观察窗口
  ↳ KnowledgeMetabolism: decayScore ≤ 40
  ↳ 场景：统计数据显示 Recipe 无人使用，但无法确认源码是否真的删除
```

### 3.3 归并旧类型

| 旧 ProposalType | 归入 | 理由 |
|-----------------|------|------|
| `enhance` | **update** | 语义相同：内容需要刷新 |
| `correction` | **update** | 与 enhance 执行逻辑相同，只是程度不同 |
| `deprecate` | **deprecate** | 直接对应 |
| `supersede` | **deprecate** + **relationship** | 废弃旧 Recipe + 建立 `replaced_by` 关系边。不再是独立 ProposalType，而是 deprecate 的一个参数 |
| `merge` | **update**（DB 迁移合并） | 实际实现中并未移到独立的 `StructureOperation`，而是直接通过 Migration 007 合并为 `update` |
| `contradiction` | **移出进化系统** → 信号/warning | 不是动作。改为 `RecipeWarning` 类型信号（内存对象，未持久化到独立表） |
| `reorganize` | **删除** | 无人创建，无实现。如需要可用 merge/split 替代 |

### 3.4 新 ProposalType

```typescript
/** Proposal 表中存储的进化提案类型 */
export type ProposalType = 'update' | 'deprecate';

// merge → update（DB 迁移直接合并，未建 StructureProposal）
// contradiction → RecipeWarning（KnowledgeMetabolism 内存对象，未持久化到独立表）
// reorganize → 删除
// supersede → deprecate + relatedRecipeIds[0]（复用已有 JSON 字段，未新增 replacedByRecipeId 列）
// correction → update（合并）
// enhance → update（合并）
```

### 3.5 观察窗口策略

从"按类型分"改为"按风险等级分"：

```typescript
/** 风险等级决定观察窗口时长 */
type RiskTier = 'low' | 'medium' | 'high';

// EvolutionGateway 中定义（创建 Proposal 时使用）
const OBSERVATION_WINDOWS: Record<RiskTier, number> = {
  low:    24 * 60 * 60 * 1000,  // 24h — 高置信度 update（confidence ≥ 0.8）
  medium: 72 * 60 * 60 * 1000,  // 72h — 普通置信度 update
  high:   7 * 24 * 60 * 60 * 1000, // 7d — deprecate（规则引擎来源）
};

// ProposalRepository 中也保留了按类型分的窗口（用于没走 Gateway 直接 create 的场景）
const OBSERVATION_WINDOWS: Record<ProposalType, number> = {
  update:    72 * 60 * 60 * 1000,  // 72h
  deprecate: 7 * 24 * 60 * 60 * 1000, // 7d
};

const AUTO_OBSERVE_THRESHOLDS: Record<ProposalType, number> = {
  update:    0.7,   // confidence ≥ 0.7 → 直接 observing
  deprecate: 0.0,   // 任意置信度 → 直接 observing
};

export function resolveRiskTier(decision: {
  action: EvolutionAction;
  confidence: number;
}): RiskTier {
  if (decision.action === 'deprecate') return 'high';
  if (decision.action === 'update' && decision.confidence >= 0.8) return 'low';
  return 'medium';
}
```

> **实现说明**：`resolveRiskTier()` 是 `EvolutionGateway.ts` 的导出函数，不接受 `source` 参数。
> Gateway 创建 Proposal 时通过 `expiresAt` 传入计算好的到期时间，ProposalRepository 的 `create()` 优先使用调用方传入的 `expiresAt`。

## 4. 分层架构

### 4.1 目标架构（设计意图）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 0: 自动修复（即时，不走 Proposal）                                 │
│  ReactiveEvolutionService: rename → 修复 sourceRefs / delete → deprecate │
│  触发：VSCode rename/delete 事件、Git HEAD watcher                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ suggestReview = true 时
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: 进化审计（所有入口 → EvolutionGateway → Proposal）             │
│                                                                         │
│  入口 A: Agent 审计       入口 B: 规则引擎       入口 C: 提交管道        │
│  ┌───────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │ AgentFactory      │   │ KnowledgeMetab-  │   │ RecipeProduction │   │
│  │  .evolveCheck()   │   │ olism.runFull-   │   │ Gateway.create() │   │
│  │ + MCP alembic_evolve  │   │ Cycle()          │   │  (consolidation) │   │
│  └────────┬──────────┘   └────────┬─────────┘   └────────┬─────────┘   │
│           │                       │                       │             │
│           ▼ Gateway ✅            ▼ Gateway ✅            ▼ Gateway ✅  │
│  ┌───────────────────────────────────────────────────────────┐          │
│  │ EvolutionGateway（统一入口）                               │          │
│  │   valid     → 刷新 lastVerifiedAt，结束                   │          │
│  │   update    → ProposalRepository.create(type='update')    │          │
│  │   deprecate → 高置信非规则引擎? 立即执行 : 创建 proposal  │          │
│  └───────────────────────────────────────────────────────────┘          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ proposals in DB
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2: 提案执行（到期自动 + 启动 + 定时）                             │
│  ProposalExecutor.checkAndExecute()                                    │
│    update   → RecipeMetrics 评估 → ContentPatcher → staging            │
│    deprecate → decayScore 评估 → deprecated / decaying / 拒绝           │
│                                                                         │
│  触发时机：                                                             │
│    1. alembic ui/start 启动时（Stage 5）                                    │
│    2. evolve-check 完成后                                               │
│    3. 定时 30min interval（HttpServer 运行期间）                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ lifecycle transitions
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3: 信号层（只读，不触发进化）                                     │
│  RecipeWarning: contradiction / redundancy / stale-ref                  │
│  → Dashboard 展示 / CLI list-warnings / 飞书通知                        │
│  → 不创建 Proposal，仅供开发者参考                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 实际数据流（Phase 2.5 后）

> Phase 2.5 已完成所有入口收敛。以下为当前实际数据流。

```
入口 A: Agent 工具                入口 B: MCP alembic_evolve
  evolution-tools.ts                evolve-external.ts
  source='decay-scan'               source='ide-agent'
        │                                 │
        └──────────┐       ┌──────────────┘
                   ▼       ▼
          EvolutionGateway.submit()         ← ✅ 正确走 Gateway
                   │
                   ├─ update  → ProposalRepo.create(expiresAt=risk-tier)
                   ├─ deprecate(≥0.8 非-metabolism) → 立即 deprecated
                   ├─ deprecate(其他) → ProposalRepo.create(7d)
                   └─ valid → 刷新 lastVerifiedAt

入口 C: KnowledgeMetabolism.runFullCycle()
        │
        └─→ EvolutionGateway.submit()              ← ✅ Phase 2.5 收敛
             action='deprecate', source='metabolism'
             ✅ 走 resolveRiskTier()
             ✅ 触发 proposals-created 信号
             ✅ source='metabolism' 确保走 7d 观察窗口（不走即时路径）

入口 D: RecipeProductionGateway.create()
        │
        ├─ consolidation advice:                    ← ✅ Phase 2.5 收敛
        │   merge      → Gateway.submit({ action:'update' })
        │   reorganize → 仅记录日志，不创建 proposal
        │   insufficient → Gateway.submit({ action:'update' })
        │   （降级：无 Gateway 时 → ProposalRepo.create({ type:'update' })）
        │
        └─ supersede:                               ← ✅ Phase 2.5 收敛
            Gateway.submit({ action:'deprecate', replacedByRecipeId })
            （降级：无 Gateway 时 → ProposalRepo.create({ type:'deprecate' })）

Layer 0: ReactiveEvolutionService
        │
        └─→ Supervisor.transition('deprecated')   ← ✅ 设计意图（不走 Proposal）

checkAndExecute() 触发：
  ✅ UiStartupTasks Stage 5
  ⚠️ Stage 6 (Metabolism) 在 Stage 5 之后执行 → Metabolism 创建的 proposals 当次启动不处理（§16 Q2）
  ✅ evolve-check 完成后（§16 Q4）
  ✅ HttpServer 30min interval（Phase 4 #24）

信号发射 vs 监听：
  ✅ Gateway emit('lifecycle', 'proposals-created') → 无人监听（设计决策：不需要）

DI 注入：
  ✅ KnowledgeMetabolism 注入 EvolutionGateway + ReportStore
  ✅ RecipeProductionGateway 通过构造参数接收 evolutionGateway
```

## 5. 接口变更

### 5.1 Agent 工具（保持不变） ✅ 已实现

Agent 的三个工具名不改，它们已经很清晰：

| 工具 | 映射到 EvolutionAction | Gateway source | 备注 |
|------|----------------------|----------------|------|
| `propose_evolution` | `update` | `'decay-scan'` | `params.type`（enhance/correction）不传递给 Gateway |
| `confirm_deprecation` | `deprecate`（confidence=0.9 → 即时） | `'decay-scan'` | 满足 `!= metabolism && >= 0.8` → 立即执行 |
| `skip_evolution` | `valid` | `'decay-scan'` | 刷新 lastVerifiedAt |

### 5.2 MCP `alembic_evolve` ✅ 已实现

```typescript
// 保持现有 3 种 action，语义不变
action: 'propose_evolution' | 'confirm_deprecation' | 'skip'

// Gateway source 统一为 'ide-agent'
// propose_evolution → gateway.submit({ action: 'update', confidence: 0.8, source: 'ide-agent' })
// confirm_deprecation → gateway.submit({ action: 'deprecate', confidence: 0.9, source: 'ide-agent' })
// skip + reason === 'still_valid' → gateway.submit({ action: 'valid', source: 'ide-agent' })
// skip + other reason → 仅计数，不调 Gateway
```

### 5.3 ProposalRepository

```typescript
// 变更前
export type ProposalType = 'merge' | 'supersede' | 'enhance' | 'deprecate' | 'reorganize' | 'contradiction' | 'correction';

// 变更后 ✅ 已实现
export type ProposalType = 'update' | 'deprecate';

/** @deprecated 用于 DB 迁移兼容 */
export type LegacyProposalType =
  | 'merge' | 'supersede' | 'enhance' | 'deprecate'
  | 'reorganize' | 'contradiction' | 'correction';

// supersede 场景：复用 relatedRecipeIds JSON 字段存储替代 Recipe ID
// ⚠️ 未新增 replacedByRecipeId 独立列（设计文档原提议），改为在 EvolutionGateway 层
//   将 decision.replacedByRecipeId 转换为 relatedRecipeIds: [replacedByRecipeId]
```

### 5.4 ProposalExecutor

```typescript
// 变更前：switch 7 种类型
// 变更后 ✅ 已实现：switch 2 种类型

switch (proposal.type) {
  case 'update':
    // 合并 enhance + correction 的逻辑
    // FP rate < 0.4 && hasUsage (guardHits > 0 || searchHits > 0) → ContentPatcher → staging
    // 失败时 lifecycle 回退到 active
    break;
  case 'deprecate':
    // 对比当前 decayScore 与提案创建时快照
    // currentDecay > snapshotDecay + 10 → 恢复 → reject
    // currentDecay ≤ 19 → deprecated（dead）
    // currentDecay 20-40 → decaying（severe）
    // currentDecay > 40 → reject（"not critical enough"） 
    // 如有 relatedRecipeIds[0] → 创建 deprecated_by edge
    break;
}
```

### 5.5 KnowledgeMetabolism

```typescript
// 变更前: 产出 merge, enhance, deprecate, contradiction, correction
// 变更后 ✅ 已实现: 产出 deprecate + RecipeWarning

// Metabolism 内部的 ProposalType 仅保留 'deprecate'
export type ProposalType = 'deprecate';

// 新增 Warning 类型
export type WarningType = 'contradiction' | 'redundancy';

export interface RecipeWarning {
  type: WarningType;
  targetRecipeId: string;
  relatedRecipeIds: string[];
  confidence: number;
  description: string;
  evidence: string[];
  detectedAt: number;
}

// MetabolismReport 增加 warnings 字段
export interface MetabolismReport {
  contradictions: ContradictionResult[];
  redundancies: RedundancyResult[];
  decayResults: DecayScoreResult[];
  proposals: EvolutionProposal[];    // 仅 deprecate（来自 DecayDetector）
  warnings: RecipeWarning[];          // contradiction + redundancy 信号
  summary: {
    totalScanned: number;
    contradictionCount: number;
    redundancyCount: number;
    decayingCount: number;
    proposalCount: number;
    warningCount: number;
  };
}
```

> **实现说明**：`RecipeWarning` 是内存对象，随 `MetabolismReport` 返回。
> ✅ 已创建 `recipe_warnings` 数据库表（migration 008）和 `WarningRepository`（Phase 3 完成）。
> Governance report 在 `proposals.length > 0 || warnings.length > 0` 时写入 ReportStore。
>
> **Phase 2.5 已修复**：Metabolism 现在通过 `EvolutionGateway.submit()` 提交 deprecate 提案（source=`'metabolism'`），
> 并注入了 `ReportStore`，治理报告正常写入。

### 5.6 ReactiveEvolutionService

不变。它本来就不走 Proposal（Layer 0 直接修复或 Layer 1 推送信号）。

> **审计确认（§13）**：ReactiveEvolutionService 直接调用 `Supervisor.transition('deprecated')` 和
> `ContentPatcher` 是 **设计意图**（Layer 0 即时自动修复不走 Proposal）。不需要改走 Gateway。
>
> **代码卫生（§16 Q6）**：`#handleRenamed()` 中构造临时 proposal 传给 ContentPatcher 时使用
> `type: 'correction'`（旧 ProposalType）。ContentPatcher 不检查 `proposal.type`，无功能影响，
> 但应统一为 `'update'`。

### 5.6b createSupersedeProposal ✅ 已删除（Phase 2.5）

> 该文件已在 Phase 2.5 中删除。supersede 逻辑现在由 `RecipeProductionGateway` Step 6 直接调用
> `EvolutionGateway.submit({ action: 'deprecate', replacedByRecipeId })` 实现。
>
> 原 `createSupersedeProposal.ts` 及其测试文件均已删除，无生产代码引用。

### 5.7 新概念：EvolutionGateway ✅ 已实现

统一所有进化决策的入口函数，消除 Agent tools / MCP handler / Metabolism 各自独立处理的碎片化：

```typescript
// lib/service/evolution/EvolutionGateway.ts

export interface EvolutionDecision {
  recipeId: string;
  action: EvolutionAction;           // 'update' | 'deprecate' | 'valid'
  source: ProposalSource;            // 'ide-agent' | 'metabolism' | 'decay-scan'
  confidence: number;
  description?: string;
  evidence?: Record<string, unknown>[];
  reason?: string;
  replacedByRecipeId?: string;       // supersede 场景（转为 relatedRecipeIds）
}

export interface EvolutionResult {
  recipeId: string;
  action: EvolutionAction;
  outcome: 'proposal-created' | 'immediately-executed' | 'verified' | 'skipped' | 'error';
  proposalId?: string;
  error?: string;
}

class EvolutionGateway {
  constructor(
    proposalRepo: ProposalRepository,
    knowledgeRepo: KnowledgeRepositoryImpl,
    options?: { supervisor?: RecipeLifecycleSupervisor; signalBus?: SignalBus }
  )

  /**
   * 所有进化决策的统一入口。
   * Agent tools、MCP handler、Metabolism 最终都调这里。
   */
  async submit(decision: EvolutionDecision): Promise<EvolutionResult> {
    // 先验证 Recipe 存在
    const entry = await this.#knowledgeRepo.findById(decision.recipeId);
    if (!entry) return { outcome: 'error', error: 'Recipe not found' };

    switch (decision.action) {
      case 'valid':
        // 刷新 lastVerifiedAt，不创建 Proposal
        return { recipeId, action: 'valid', outcome: 'verified' };

      case 'update':
        // 由 resolveRiskTier() 决定观察窗口 → 创建 observing proposal
        const tier = resolveRiskTier(decision);
        const expiresAt = Date.now() + OBSERVATION_WINDOWS[tier];
        const proposal = this.#proposalRepo.create({ type: 'update', ..., expiresAt });
        return { recipeId, action: 'update', outcome: 'proposal-created', proposalId };

      case 'deprecate':
        // ⚠️ 实际条件：source !== 'metabolism' && confidence >= 0.8
        // （不是 source === 'ide-agent'，而是排除 metabolism 来源）
        if (decision.source !== 'metabolism' && decision.confidence >= 0.8) {
          // 高置信非规则引擎来源 → 立即执行 deprecated 转换
          this.#supervisor.transition(recipeId, 'deprecated');
          // 同时解决该 Recipe 上已有的 deprecate proposals
          return { recipeId, action: 'deprecate', outcome: 'immediately-executed' };
        }
        // 规则引擎 / 低置信度 → 创建 proposal with 7d 观察窗口
        const proposal = this.#proposalRepo.create({ type: 'deprecate', ..., expiresAt: 7d });
        return { recipeId, action: 'deprecate', outcome: 'proposal-created', proposalId };
    }
  }

  /** 批量提交，顺序执行 */
  async submitBatch(decisions: EvolutionDecision[]): Promise<EvolutionResult[]>;
}
```

> **DI 注册位置**：`KnowledgeModule.ts` 中注册为 `c.singleton('evolutionGateway', ...)`，
> 注入 `proposalRepository`、`knowledgeRepository`、`lifecycleSupervisor`（可选）、`signalBus`（可选）。

## 6. 数据库迁移

### evolution_proposals 表 ✅ 已实现（Migration 007）

```sql
-- 1. type 列值迁移
UPDATE evolution_proposals SET type = 'update'    WHERE type IN ('merge', 'enhance', 'correction');
UPDATE evolution_proposals SET type = 'deprecate'  WHERE type = 'supersede';
DELETE FROM evolution_proposals WHERE type IN ('contradiction', 'reorganize');
```

> **与原设计的差异**：
> - `merge` 未移到独立的 `StructureProposal` 表，而是直接合并为 `update`
> - 未新增 `replaced_by_recipe_id` 列。supersede 场景复用 `related_recipe_ids` JSON 字段
> - `contradiction` 和 `reorganize` 从 proposals 表直接删除

### 新表 recipe_warnings ❌ 未实现

设计提议的 `recipe_warnings` 表和 `WarningRepository` 尚未创建。
当前 `RecipeWarning` 仅作为 `KnowledgeMetabolism.runFullCycle()` 的内存返回值存在于 `MetabolismReport.warnings` 中。

如需持久化，后续可按以下 Schema 建表：

```sql
CREATE TABLE IF NOT EXISTS recipe_warnings (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  related_recipe_ids TEXT DEFAULT '[]',    -- JSON array
  type TEXT NOT NULL,                      -- 'contradiction' | 'redundancy' | 'stale-ref'
  severity TEXT NOT NULL DEFAULT 'info',   -- 'info' | 'warning' | 'error'
  description TEXT NOT NULL,
  evidence TEXT DEFAULT '[]',              -- JSON array
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by TEXT                         -- 'auto' | 'manual' | null
);
```

## 7. 触发时机改进

### 现状

| 触发点 | 机制 | 问题 |
|--------|------|------|
| `alembic ui` 启动 | UiStartupTasks Stage 5 调 `checkAndExecute()` | 只在启动时跑一次 |

### 改进方案与实现状态

| 触发点 | 机制 | 时机 | 状态 |
|--------|------|------|------|
| 启动时 | UiStartupTasks Stage 5 | 保持不变 | ✅ 已有 |
| Metabolism 后 | Stage 6 后补跑一次 checkAndExecute | Metabolism 创建的 proposals 即时处理 | ❌ 未实现（§16 Q2） |
| evolve-check 后 | CLI 执行完 Agent 后立即调 `checkAndExecute()` | 批量创建的高置信提案可即时生效 | ❌ 未实现（§16 Q4） |
| 定时调度 | HttpServer 运行期间 `setInterval(30min)` | 覆盖长时运行场景 | ❌ 未实现 |

> **关于 Signal 驱动触发的决策变更**：
> 原设计包含 "监听 `evolution:proposals-created` 信号，debounce 5s 触发 `checkAndExecute()`"。
> 审计后（§13.1 P4）认为**不需要实现**：
> - Proposal 创建时距 observation window 到期至少 24h，5s 内触发毫无意义
> - 30min 定时 interval（Phase 4）已足够覆盖
> - 信号发射保留（Gateway 已实现），但不增加 Executor 监听

> **注**：EvolutionGateway 已在创建 Proposal 后 emit `lifecycle` 信号（`proposals-created`），
> 目前 `SignalAggregator` 和 `PanoramaService` 会统计/记录此信号。
> `KnowledgeMetabolism` 订阅 `decay|quality|anomaly`，不匹配 `lifecycle`。

## 8. 实施路线

> **已迁移至 §15**。以下为归档记录。

### Phase 1–2 ✅ 完成（详见 §15）

### Phase 2.5 ✅ 完成（详见 §14、§15）

### Phase 3–5 ❌ 重新排列为 §15 的 Phase 3–5

## 9. 风险评估

| 风险 | 等级 | 状态 | 缓解措施 |
|------|------|------|---------|
| DB 迁移丢失 supersede 的 related_recipe_ids | 中 | ✅ 已规避 | 复用 `relatedRecipeIds` 字段，未新增列，无数据丢失 |
| 移除 contradiction/reorganize/merge 后规则引擎产出无处写入 | 低 | ⚠️ 临时方案 | `RecipeWarning` 作为内存对象随 `MetabolismReport` 返回，未持久化 |
| Agent prompt 中的工具名变更 | 低 | ✅ 已规避 | 工具名保持 `propose_evolution` / `confirm_deprecation` / `skip_evolution` |
| 外部 MCP 接口变更影响用户 | 低 | ✅ 已规避 | MCP action 名保持不变，内部透明映射到 EvolutionGateway |
| RecipeProductionGateway 旧类型 proposals 堆积 | 高 | ✅ Phase 2.5 已修复 | §14.2 改造后走 Gateway，旧类型不再产生 |
| KnowledgeMetabolism 绕过 Gateway 导致策略不一致 | 高 | ✅ Phase 2.5 已修复 | §14.1 改为注入 EvolutionGateway |
| ReportStore 未注入导致治理报告缺失 | 中 | ✅ Phase 2.5 已修复 | §14.4 补齐 DI 注入 |

## 10. 效果对比

| 维度 | Before | Phase 1–2 After | Phase 2.5 After | 当前状态 |
|------|--------|-----------------|-----------------|--------|
| ProposalType 值数量 | 7 | 2 | 2 | ✅ |
| ProposalExecutor switch cases | 5（+ 2 skipped） | 2 | 2 | ✅ |
| 进化入口走 Gateway 的比例 | 0/5 | 2/5（Agent + MCP） | 4/5（+Metabolism +Production） | ✅ 4/5 |
| 进化方向心智模型 | 7 种 | update/deprecate/valid | update/deprecate/valid | ✅ |
| Consolidation proposals 可执行性 | ✅（旧 Executor 有对应 case） | ❌（旧类型 → skipped） | ✅（新类型走 Gateway） | ✅ |
| 触发时机 | 启动时 1 次 | 启动时 1 次 | 启动 + evolve-check + 定时 | ❌（Phase 4） |
| 信号与动作 | 混在一起 | 分离（RecipeWarning vs Proposal） | 分离 + 持久化 | ⚠️ 内存分离 |
| Metabolism 治理报告 | 可写入 ReportStore | 不写入（ReportStore 未注入） | 正常写入 | ✅ |
| Proposal 可观测性 | 无 | 无 | Dashboard 列表视图 | ❌（§16 Q10） |

## 11. 实现与设计的差异总结

| 设计提议 | 实际决策 | 理由 |
|---------|---------|------|
| `merge` 移到独立 `StructureOperation` | 直接合并为 `update`（Migration 007） | 简化实现，merge 本质也是内容变更 |
| 新增 `replacedByRecipeId` DB 列 | 复用 `relatedRecipeIds` JSON 字段 | 避免 schema 变更，`relatedRecipeIds[0]` 语义等价 |
| `recipe_warnings` 持久化表 | `RecipeWarning` 仅为内存对象 | ✅ Phase 3 已实现（migration 008 + WarningRepository） |
| `EvolutionResult.outcome` 无 `error` 值 | 增加 `'error'` outcome + `error` 字段 | Gateway 需处理 Recipe 不存在等错误 |
| `resolveRiskTier(action, confidence, source)` 三参数 | `resolveRiskTier({ action, confidence })` 两字段对象 | `source` 未参与 risk 计算 |
| 废弃即时执行条件 `source === 'ide-agent'` | `source !== 'metabolism'` | 更宽松：排除规则引擎即可，`decay-scan` 高置信也可即时执行 |
| `EvolutionDecision.evidence` 为简单对象 | `evidence: Record<string, unknown>[]`（数组） | 兼容多条 evidence 记录 |
| `RecipeProductionGateway` 不降级 | Gateway 优先 + ProposalRepo 降级模式 | RecipeProductionGateway 采用 Gateway 优先 + 无 Gateway 时降级到 ProposalRepo 的双路径策略，确保向后兼容 |
| `reorganize` 映射为 `update` | reorganize 仅记日志，不创建 proposal | reorganize 历来无执行逻辑且概率极低，创建无用 proposal 反而干扰 |
| `KnowledgeMetabolism.test.ts` mock Gateway | 测试中 `#gateway` 为 null | 测试覆盖本地提案生成逻辑（`#proposalsFromDecay`），Gateway 集成路径通过 production-gateway 和 evolution-tools 测试覆盖 |
| ReactiveEvolutionService 使用新 ProposalType | `type: 'correction'` 硬编码传给 ContentPatcher | ContentPatcher 不检查 proposal.type，无功能影响。代码卫生问题（§16 Q6） |
| `PROPOSAL_TTL` 用于 Gateway expiresAt | Gateway 独立计算 expiresAt，Metabolism 的 `PROPOSAL_TTL` 和 `EvolutionProposal.expiresAt` 为死代码 | Gateway 有自己的 `OBSERVATION_WINDOWS`，本地 TTL 仅用于 `EvolutionProposal` 内存对象（§16 Q7） |

## 12. 变更文件清单

### Phase 1–2 新增文件
| 文件 | 说明 |
|------|------|
| `lib/service/evolution/EvolutionGateway.ts` | 统一进化决策入口 |
| `lib/infrastructure/database/migrations/007_evolution_type_simplification.ts` | 类型收敛迁移 |

### Phase 1–2 修改文件
| 文件 | 变更概述 |
|------|---------|
| `lib/repository/evolution/ProposalRepository.ts` | `ProposalType` 7→2，新增 `LegacyProposalType`，`ProposalSource` 新增 `'metabolism'`，观察窗口/阈值简化 |
| `lib/service/evolution/ProposalExecutor.ts` | switch 7→2 case，移除 `HIGH_RISK_TYPES`/`#executeMergeOrEnhance`/`#executeSupersede`/`#executeCorrection` |
| `lib/agent/tools/evolution-tools.ts` | 改为调用 `EvolutionGateway.submit()` |
| `lib/external/mcp/handlers/evolve-external.ts` | 改为调用 `EvolutionGateway.submit()` |
| `lib/service/evolution/KnowledgeMetabolism.ts` | 矛盾/冗余 → `RecipeWarning`，`ProposalType = 'deprecate'` |
| `lib/injection/modules/KnowledgeModule.ts` | 注册 `evolutionGateway` singleton |
| `lib/types/evolution.ts` | `TransitionTrigger` 增加 `'evolution-gateway'` |

### Phase 2.5 修改文件
| 文件 | 变更概述 |
|------|---------|
| `lib/service/evolution/KnowledgeMetabolism.ts` | `#proposalRepo` → `#gateway`（EvolutionGateway），调用改为 `gateway.submit({ source: 'metabolism' })` |
| `lib/injection/modules/KnowledgeModule.ts` | Metabolism DI 改为注入 `evolutionGateway` + `reportStore`（替代 `proposalRepository`） |
| `lib/service/knowledge/RecipeProductionGateway.ts` | 新增 `GatewayEvolutionGateway` 接口 + `#evolutionGateway` 字段；`#createProposalFromAdvice` 改为 async，merge/insufficient → `gateway.submit({ action:'update' })`，reorganize → 仅记日志返回 null；Step 6 supersede → `gateway.submit({ action:'deprecate', replacedByRecipeId })` |
| `lib/agent/tools/composite.ts` | 构造 RecipeProductionGateway 时传入 `evolutionGateway` |
| `lib/agent/tools/lifecycle.ts` | 同上 |
| `lib/external/mcp/handlers/consolidated.ts` | 同上，从容器 resolve `evolutionGateway` |
| `lib/service/evolution/ProposalExecutor.ts` | 文件头注释移除 "Signal 驱动" 触发时机（仅保留 3 种） |

### Phase 2.5 删除文件
| 文件 | 说明 |
|------|------|
| `lib/service/evolution/createSupersedeProposal.ts` | 死代码，逻辑已被 RecipeProductionGateway + EvolutionGateway 覆盖 |
| `test/unit/createSupersedeProposal.test.ts` | 随源文件删除 |

### 测试文件
| 文件 | 状态 |
|------|------|
| `test/unit/ProposalRepository.test.ts` | 类型引用更新（Phase 1） |
| `test/unit/ProposalExecutor.test.ts` | 完全重写为 update/deprecate 测试（Phase 2） |
| `test/unit/evolution-tools.test.ts` | 完全重写为 EvolutionGateway mock（Phase 2） |
| `test/unit/KnowledgeMetabolism.test.ts` | 矛盾/冗余断言改为 warnings（Phase 2）；gateway 为 null 时本地提案生成仍测试通过 |
| `test/unit/ConsolidatedProposal.test.ts` | reorganize → 返回 null；其余旧类型更新为 update/deprecate（Phase 2.5） |
| `test/unit/production-gateway.test.ts` | supersede 改为 EvolutionGateway mock + ProposalRepo 降级测试；merge 类型断言 `'merge'` → `'update'`（Phase 2.5） |

## 13. 自洽性深度审计（2026-04-17）

通过逐链路代码追踪，发现以下**设计与实现的自洽性断裂**。这些问题分为"入口未收敛"和"触发链未闭合"两大类。

> **Phase 2.5 已修复 P1–P5 所有问题**（P6 在 Phase 2.5 前已修正）。以下保留原始审计记录作为历史归档。

### 13.1 问题清单

#### P1 — KnowledgeMetabolism 绕过 EvolutionGateway ✅ Phase 2.5 已修复

**症状**：`KnowledgeMetabolism.runFullCycle()` 直接调用 `ProposalRepository.create()`（[KnowledgeMetabolism.ts#L203-L217](lib/service/evolution/KnowledgeMetabolism.ts#L203-L217)），不经过 `EvolutionGateway.submit()`。

**矛盾**：设计架构图（§4.1）标注 Metabolism → Gateway ✅，但实际代码是 Metabolism → ProposalRepo（直接）。Gateway 文件头注释也写 "所有进化决策（Agent 工具、MCP handler、KnowledgeMetabolism）最终都汇聚到这里"。

**影响**：
1. Metabolism 创建的 proposal **不走 `resolveRiskTier()`**，observation window 由 ProposalRepo 默认值决定（type-based），而非 Gateway 的 risk-tier-based
2. **不触发 `proposals-created` lifecycle 信号**
3. **不享受高置信即时 deprecate 路径**（即使 confidence ≥ 0.8 也要等 7d）
4. **不传 `expiresAt`**，完全依赖 ProposalRepo 内部默认

**根因分析**：
- `KnowledgeModule.ts` 注入 `proposalRepository` 给 Metabolism（[KnowledgeModule.ts#L290-L293](lib/injection/modules/KnowledgeModule.ts#L290-L293)），而非 `evolutionGateway`
- Phase 2 改造 Metabolism 时只处理了 contradiction/redundancy → RecipeWarning，**遗漏了将 deprecate proposal 创建路径收敛到 Gateway**

**修复方案**：见 §14.1

#### P2 — RecipeProductionGateway 使用旧 ProposalType ✅ Phase 2.5 已修复

**症状**：`RecipeProductionGateway.#createProposalFromAdvice()` 仍使用 `merge`/`reorganize`/`enhance`（[RecipeProductionGateway.ts#L556-L602](lib/service/knowledge/RecipeProductionGateway.ts#L556-L602)），Step 6 supersede 也用 `'supersede'`（[RecipeProductionGateway.ts#L416](lib/service/knowledge/RecipeProductionGateway.ts#L416)）。

**矛盾**：`ProposalType` 已收敛为 `'update' | 'deprecate'`（Phase 1），但 RecipeProductionGateway 仍在往 DB 写旧类型字符串。

**影响**：
1. ProposalExecutor.#processExpiredProposal 的 switch 只处理 `update` 和 `deprecate`，旧类型 → `default → skipped`
2. **所有 consolidation advice proposals（merge/reorganize/enhance）永远不会被自动执行**
3. **supersede proposal 也永远不会被执行**
4. 这些 proposal 记录占用 DB 空间但无实际效果

**根因分析**：
- RecipeProductionGateway 不是 Phase 2 "入口适配"的改造范围（Phase 2 只改了 evolution-tools、evolve-external、Metabolism、createSupersedeProposal）
- RecipeProductionGateway 不在 DI 容器中（每次动态 `new`），不是 singleton 服务，容易被遗漏

**修复方案**：见 §14.2

#### P3 — createSupersedeProposal 死代码 ✅ Phase 2.5 已删除

**症状**：`createSupersedeProposal()` 已正确改为调用 `EvolutionGateway.submit()`，但 **全项目零个 import、零个调用**（[createSupersedeProposal.ts](lib/service/evolution/createSupersedeProposal.ts)）。

**矛盾**：`RecipeProductionGateway` 的 supersede 逻辑（Step 6）直接调 `ProposalRepo.create({ type: 'supersede' })`，而非此函数。

**影响**：正确的 Gateway 路径存在但无人使用，错误的直接路径在运行。

**修复方案**：见 §14.2（RecipeProductionGateway 改造时复用或内联此逻辑）

#### P4 — ProposalExecutor 注释声称的触发机制未实现 ✅ Phase 2.5 已修正注释

**症状**：ProposalExecutor 文件头注释（[ProposalExecutor.ts#L11-L14](lib/service/evolution/ProposalExecutor.ts#L11-L14)）声称四种触发时机：
1. UiStartupTasks Stage 5（✅ 已实现）
2. evolve-check 完成后（❌ 未实现）
3. HttpServer 30min interval（❌ 未实现）
4. Signal 驱动 debounce 5s（❌ 未实现且无 listener）

**影响**：非启动场景下 Proposal 无法被及时执行。Agent 批量创建的高置信提案要等下一次启动才能生效。

**修复方案**：见 §14.3

#### P5 — ReportStore 未注入 KnowledgeMetabolism ✅ Phase 2.5 已修复

**症状**：`KnowledgeModule.ts` 创建 `KnowledgeMetabolism` 时未传 `reportStore`（[KnowledgeModule.ts#L281-L293](lib/injection/modules/KnowledgeModule.ts#L281-L293)），但 Metabolism 内部（[KnowledgeMetabolism.ts#L222-L235](lib/service/evolution/KnowledgeMetabolism.ts#L222-L235)）在 `this.#reportStore` 非空时才写治理报告。

**影响**：`MetabolismReport` 的统计数据（proposalCount、warningCount 等）**永远不写入 ReportStore**，Dashboard 的 SignalReportView 无法展示治理报告。

#### P6 — 效果对比表不准确 ✅ 已修正（§10 已更新）

**症状**：§10 效果对比表中 "进化入口函数: 3 套独立代码 → 1 个 EvolutionGateway ✅" 并不准确。

**事实**：实际仍有 **3 套未收敛的入口**：
- KnowledgeMetabolism → ProposalRepo（直接）
- RecipeProductionGateway → ProposalRepo（直接，旧类型）
- ReactiveEvolutionService → Supervisor（直接，设计意图）

只有 Agent tools 和 MCP handler 真正走了 Gateway。应标记为 ⚠️ 部分完成。

### 13.2 问题关联图（Phase 2.5 修复后）

```
RecipeProductionGateway ──Gateway──→ EvolutionGateway ──→ ProposalRepo ──→ DB ──→ Executor: ✅
          ├─ Step 6: action='deprecate' (supersede)    ↑
          ├─ merge/insufficient: action='update'        │
          └─ reorganize: 仅记日志，不创建 proposal       │
          （降级：无 Gateway → ProposalRepo.create 直接） │
                                                          │
KnowledgeMetabolism ──Gateway──→ EvolutionGateway ──→ ProposalRepo ──→ DB ──→ Executor: ✅
          └─ source='metabolism' ∴ 走 7d 观察窗口                     │
             ✅ 走 resolveRiskTier / 触发信号 / ReportStore 写入     │
                                                          │
Agent tools / MCP ──→ Gateway ──→ ProposalRepo ──→ DB ──→ Executor: ✅
                          ↓
                   emit('proposals-created') → 无人监听（设计决策）

Layer 0: ReactiveEvolutionService → Supervisor.transition() 直接（设计意图）
```

## 14. Phase 2.5 入口收敛方案 ✅ 已完成

> 目标：**消除 §13 中所有 HIGH 和 MEDIUM 问题**，使所有进化决策路径真正汇聚到 EvolutionGateway。
> ✅ 已于 2026-04-18 完成实施，78 test files / 1718 tests 全部通过，tsc 零错误。

### 14.1 KnowledgeMetabolism → EvolutionGateway

**变更范围**：

| 文件 | 变更 |
|------|------|
| `KnowledgeMetabolism.ts` | 构造函数 `options.proposalRepository` 改为 `options.evolutionGateway`，`#proposalRepo` 改为 `#gateway` |
| `KnowledgeModule.ts` | 注入 `evolutionGateway`（替代 `proposalRepository`），同时注入 `reportStore` |

**改造后的 proposal 创建逻辑**：

```typescript
// Before（直接调 ProposalRepo）
for (const p of proposals) {
  this.#proposalRepo.create({
    type: p.type as RepoProposalType,
    targetRecipeId: p.targetRecipeId,
    ...
  });
}

// After（走 Gateway）
for (const p of proposals) {
  await this.#gateway.submit({
    recipeId: p.targetRecipeId,
    action: 'deprecate',               // Metabolism 只产出 deprecate
    source: 'metabolism',               // 新增 source 值
    confidence: p.confidence,
    description: p.description,
    evidence: p.evidence.map(e => ({ detail: e })),
  });
}
```

**source 值设计**：
- 当前 Metabolism 使用 `'decay-scan'` 作为 source
- 改为使用 `'metabolism'` —— 因为 Gateway 的即时 deprecate 条件是 `source !== 'metabolism'`
- 这确保规则引擎检测到的衰退仍走 7d 观察窗口（符合设计意图）
- `ProposalSource` 类型已包含 `'metabolism'` 值（无需新增）

### 14.2 RecipeProductionGateway → EvolutionGateway

**变更范围**：

| 文件 | 变更 |
|------|------|
| `RecipeProductionGateway.ts` | 构造函数增加可选 `evolutionGateway` 依赖，`#createProposalFromAdvice` 和 Step 6 改为调 Gateway |
| `composite.ts` / `lifecycle.ts` / `consolidated.ts` | 构造 RecipeProductionGateway 时传入 `evolutionGateway` |

**类型映射**：

| 旧 advice.action | Gateway 调用 | 理由 |
|-------------------|-------------|------|
| `merge` | `gateway.submit({ action: 'update', confidence, ... })` | merge 本质是内容合并更新 |
| `enhance` (insufficient) | `gateway.submit({ action: 'update', confidence, ... })` | 增强现有 Recipe |
| `reorganize` | 不创建 proposal（或 warn log only） | 无执行逻辑，ProposalExecutor 历来都 skip |
| supersede (Step 6) | `gateway.submit({ action: 'deprecate', replacedByRecipeId })` | 旧 Recipe 废弃 |

**`reorganize` 处理决策**：
- 选项 A：删除 reorganize 分支（Consolidation Advisor 返回 reorganize 时不创建 proposal，仅 log）
- 选项 B：映射为 `update`（但语义不完全匹配）
- **推荐选项 A**：reorganize 历来无执行逻辑且概率极低，创建无用 proposal 反而干扰

**createSupersedeProposal 处置**：
- RecipeProductionGateway Step 6 改为直接调 `gateway.submit({ action: 'deprecate', replacedByRecipeId })`
- `createSupersedeProposal.ts` 作为独立辅助函数保留（非 dead code 后将被其他入口使用），或删除以减少维护负担
- **推荐删除**：其逻辑已被 Gateway 完全覆盖，保留只增加维护成本

### 14.3 ProposalExecutor 注释修正

**立即修正**：将 ProposalExecutor 文件头注释中未实现的触发时机标注为 "planned"：

```typescript
/**
 * 触发时机：
 *   - UiStartupTasks Stage 5（启动时）✅
 *   - evolve-check 完成后（planned, Phase 4）
 *   - HttpServer 运行期间 30min interval（planned, Phase 4）
 */
```

去掉 "Signal 驱动 debounce 5s" — 评估后认为不需要：
- Gateway 发信号时 proposal 刚创建，距离 observation window 到期还有 24h-7d
- 没必要 5s 后就检查一次
- `checkAndExecute` 最低频 30min interval 已足够

### 14.4 ReportStore 注入修复

**变更文件**：`KnowledgeModule.ts`

```typescript
// Before
c.singleton('knowledgeMetabolism', (ct: ServiceContainer) => {
  return new KnowledgeMetabolism({
    contradictionDetector: ct.get('contradictionDetector'),
    redundancyAnalyzer: ct.get('redundancyAnalyzer'),
    decayDetector: ct.get('decayDetector'),
    signalBus: ct.singletons.signalBus || undefined,
    proposalRepository: ct.services.proposalRepository ? ... : undefined,
  });
});

// After
c.singleton('knowledgeMetabolism', (ct: ServiceContainer) => {
  return new KnowledgeMetabolism({
    contradictionDetector: ct.get('contradictionDetector'),
    redundancyAnalyzer: ct.get('redundancyAnalyzer'),
    decayDetector: ct.get('decayDetector'),
    signalBus: ct.singletons.signalBus || undefined,
    evolutionGateway: ct.services.evolutionGateway
      ? ct.get('evolutionGateway') as EvolutionGateway
      : undefined,
    reportStore: ct.services.reportStore
      ? ct.get('reportStore') as ReportStore
      : undefined,
  });
});
```

### 14.5 效果对比表修正

§10 中 "进化入口函数" 行状态改为 ⚠️：

> 3 套独立代码 → **2/5 入口已走 Gateway**（Agent tools + MCP）。Phase 2.5 后 → **4/5 入口走 Gateway**（新增 Metabolism + RecipeProductionGateway）。ReactiveEvolutionService 设计上不走 Gateway。

### 14.6 Phase 2.5 变更清单 ✅

| 文件 | 变更类型 | 说明 | 状态 |
|------|---------|------|------|
| `lib/service/evolution/KnowledgeMetabolism.ts` | 修改 | `#proposalRepo` → `#gateway`，调用改为 `gateway.submit({ source: 'metabolism' })` | ✅ |
| `lib/injection/modules/KnowledgeModule.ts` | 修改 | Metabolism DI 改为注入 `evolutionGateway` + `reportStore` | ✅ |
| `lib/service/knowledge/RecipeProductionGateway.ts` | 修改 | 新增 `evolutionGateway?`，advice/supersede 改走 Gateway（带降级） | ✅ |
| `lib/agent/tools/composite.ts` | 修改 | 构造 RecipeProductionGateway 时传入 `evolutionGateway` | ✅ |
| `lib/agent/tools/lifecycle.ts` | 修改 | 同上 | ✅ |
| `lib/external/mcp/handlers/consolidated.ts` | 修改 | 同上 | ✅ |
| `lib/service/evolution/ProposalExecutor.ts` | 修改 | 文件头注释修正（去掉 Signal 驱动） | ✅ |
| `lib/service/evolution/createSupersedeProposal.ts` | 删除 | 逻辑已被 Gateway 覆盖 | ✅ |
| `test/unit/createSupersedeProposal.test.ts` | 删除 | 随源文件删除 | ✅ |
| `test/unit/production-gateway.test.ts` | 修改 | supersede 改为 EvolutionGateway mock + 降级测试；merge 类型 `'merge'` → `'update'` | ✅ |
| `test/unit/ConsolidatedProposal.test.ts` | 修改 | reorganize → 返回 null；注释更新 | ✅ |

### 14.7 Phase 2.5 完成后的数据流 ✅

```
入口 A: Agent tools (evolution-tools.ts)
入口 B: MCP handler (evolve-external.ts)
入口 C: Metabolism (KnowledgeMetabolism.ts)       ← 新增 Gateway 路径
入口 D: Production (RecipeProductionGateway.ts)   ← 新增 Gateway 路径
        │
        ▼
EvolutionGateway.submit()
        │
        ├─ update  → resolveRiskTier → ProposalRepo.create(expiresAt=tier)
        │            emit('proposals-created')
        ├─ deprecate(≥0.8 非-metabolism) → 立即 deprecated
        │            resolveExistingDeprecateProposals
        ├─ deprecate(其他) → ProposalRepo.create(7d)
        │            emit('proposals-created')
        └─ valid → 刷新 lastVerifiedAt
                        │
                        ▼
入口 E: ReactiveEvolutionService (Layer 0)
        └─→ Supervisor.transition() 直接    ← 设计意图不变
```

## 15. 修订后的完整实施路线

### Phase 1: 核心类型统一 ✅ 完成

1. ✅ 新增 `lib/service/evolution/EvolutionGateway.ts`
2. ✅ 修改 `ProposalRepository.ts` — `ProposalType = 'update' | 'deprecate'`
3. ✅ 修改 `ProposalExecutor.ts` — 2-case switch
4. ✅ DB 迁移 `007_evolution_type_simplification.ts`

### Phase 2: 入口适配（Agent / MCP） ✅ 完成

5. ✅ `evolution-tools.ts` → Gateway
6. ✅ `evolve-external.ts` → Gateway
7. ✅ `KnowledgeMetabolism.ts` — contradiction/redundancy → RecipeWarning
8. ✅ `createSupersedeProposal.ts` → Gateway（但无调用者）
9. ✅ DI 注册 `evolutionGateway`
10. ✅ `TransitionTrigger` 增加 `'evolution-gateway'`
11. ✅ 全部单元测试通过

### Phase 2.5: 遗漏入口收敛 ✅ 完成

12. ✅ KnowledgeMetabolism 改为注入 `EvolutionGateway`（替代 `ProposalRepository`）
13. ✅ KnowledgeMetabolism 注入 `ReportStore`
14. ✅ `ProposalSource` 已包含 `'metabolism'`（无需新增）
15. ✅ RecipeProductionGateway 改为使用 `EvolutionGateway`（advice + supersede，带 ProposalRepo 降级）
16. ✅ 调用方（composite/lifecycle/consolidated）传入 `evolutionGateway`
17. ✅ 删除 `createSupersedeProposal.ts` 及其测试文件
18. ✅ ProposalExecutor 注释修正（移除 Signal 驱动，保留 3 种触发时机）
19. ✅ 单元测试更新（78 files / 1718 tests pass）

### Phase 3: 信号持久化层 ✅ 完成

20. ✅ `recipe_warnings` 表（migration 008）+ `WarningRepository`（upsert 去重、resolve、dismiss、find with filter）
21. ✅ Metabolism `runFullCycle()` → `warningRepository.upsertBatch()` 持久化 warnings
22. ✅ CLI `list-warnings`（--status / --type 过滤、--json 输出）
22b. ✅ DI 注册：ServiceMap + KnowledgeModule（warningRepository singleton + inject into Metabolism）

### Phase 4: 触发时机 + 健壮性 ✅ 完成

23. ✅ CLI `evolve-check` → 完成后调 `checkAndExecute()`（§16 Q4）
24. ✅ HttpServer → `setInterval(30min)` 定时检查（`#startProposalCheckInterval` + `#runProposalCheck` + `.unref()` + stop 清理）
25. ✅ EvolutionGateway `#handleValid` / `#resolveExistingDeprecateProposals` 静默失败改为 warn 日志（§16 Q1）
26. ✅ ProposalExecutor update 路径 evolving→patch fail 回退健壮性（§16 Q3）
27. ✅ RecipeProductionGateway source 标签收敛 → `ProposalSource` 新增 `'consolidation'`（§16 Q5）
27b. ✅ UiStartupTasks 调换 Stage 5/6 顺序：Metabolism 先跑再 checkAndExecute（§16 Q2）
27c. ✅ ReactiveEvolutionService `type: 'correction'` → `type: 'update'`（§16 Q6）
27d. ✅ KnowledgeMetabolism 删除 `PROPOSAL_TTL` 死代码 + `EvolutionProposal.expiresAt` 字段（§16 Q7）

### Phase 5: Dashboard + 可观测性 ❌ 未开始

28. Proposal 列表视图（HTTP `/api/v1/proposals` 端点 + Dashboard 页面）
29. RecipeWarning 在 KnowledgeView 中显示
30. HTTP `/api/v1/proposals/stats` 端点（Proposal 统计信息）

## 16. 深度代码审计（2026-04-16）

> 基于 Phase 2.5 完成后的代码逐文件审阅，发现以下**设计缺陷、健壮性风险和统一机会**。
> 按严重程度分级：CRITICAL → HIGH → MEDIUM → LOW。

### 16.1 问题清单

#### Q1 — EvolutionGateway 静默失败（MEDIUM）

**症状**：`#handleValid()` 中 DB 更新 `lastVerifiedAt` 失败时 catch 块为空，不记录任何日志；
`#resolveExistingDeprecateProposals()` 中 `findByTarget` + `markExecuted` 失败时也静默吞掉异常。

**位置**：
- [EvolutionGateway.ts#L126](lib/service/evolution/EvolutionGateway.ts#L126) — `#handleValid` empty catch
- [EvolutionGateway.ts#L280](lib/service/evolution/EvolutionGateway.ts#L280) — `#resolveExistingDeprecateProposals` empty catch

**影响**：
1. `valid` 操作返回 `{ outcome: 'verified' }` 但 `lastVerifiedAt` 可能未写入
2. 即时 deprecate 后关联 proposal 未清理，下次 checkAndExecute 仍会处理

**修复方案**：两处 catch 添加 `this.#logger.warn(...)` 记录失败原因。不需要阻塞返回值。

#### Q2 — UiStartupTasks 执行顺序导致 Metabolism 提案延迟（HIGH）

**症状**：UiStartupTasks 中 Stage 5 (`ProposalExecutor.checkAndExecute()`) 先于 Stage 6 (`KnowledgeMetabolism.runFullCycle()`) 执行。

**位置**：[UiStartupTasks.ts#L150-L210](lib/service/bootstrap/UiStartupTasks.ts#L150-L210)

**影响**：
- Stage 6 创建的 deprecate proposals **在当次启动中不会被 checkAndExecute 处理**
- 需要等待下一次启动（可能是明天）或 Phase 4 的 30min interval 才能执行
- 对于 Metabolism 的高置信 deprecate（走 Gateway 的即时路径），不受影响（直接 deprecated）
- 对于低于 0.8 置信度的 deprecate → 创建 7d 观察窗口 proposal → 反正要等 7d，启动顺序无实际影响

**评估**：影响有限但违反直觉。两种修复选项：
- 选项 A：调换 Stage 5/6 顺序（Metabolism 先跑，checkAndExecute 后跑）
- 选项 B：Stage 6 完成后再跑一次 checkAndExecute
- **推荐选项 A**：最简单，但可能改变 Metabolism 依赖的指标（先执行 proposals 可能改变 decayScore）
- **延后到 Phase 4**：30min interval 上线后，此问题自动消除

#### Q3 — ProposalExecutor update 路径竞态风险（MEDIUM）

**症状**：`#executeUpdate()` 先将 Recipe 转为 `evolving`，再调 ContentPatcher。如果 patch 失败后回退：

```typescript
// Step 1: active → evolving（已持久化）
await this.#transitionRecipe(recipeId, 'evolving', 'proposal-attach', proposalId);

// Step 2: apply patch（可能失败）
const patchResult = await this.#tryApplyPatch(proposal, 'agent-suggestion');

// Step 3: 失败时回退
if (patchResult?.skipped || ...) {
  await this.#transitionRecipe(recipeId, 'active', 'content-patch-complete', proposalId);
  // 如果这步也失败 → Recipe 卡在 evolving 状态
}
```

**位置**：[ProposalExecutor.ts#L158-L172](lib/service/evolution/ProposalExecutor.ts#L158-L172)

**影响**：Recipe 可能遗留在 `evolving` 状态。Supervisor 有 7d 超时兜底（`evolving > 7d → active`），但 7 天内 Recipe 处于非正常状态。

**缓解**：
- Supervisor `checkTimeouts()` 已在 Stage 7 作为兜底（每次启动检查 evolving > 7d）
- 可在 `#executeUpdate` 的最外层 catch 中添加 `await this.#restoreRecipe(recipeId)` 确保异常时也回退
- 或缩短 evolving 超时时间（7d → 1d）

#### Q4 — evolve-check CLI 不触发 checkAndExecute（HIGH）

**症状**：`alembic evolve-check` 通过 Agent 批量创建进化决策（调 Gateway），但完成后不调用 `ProposalExecutor.checkAndExecute()`。

**位置**：[bin/cli.ts#L508-L720](bin/cli.ts#L508-L720) — Step 5 输出结果后直接 `bootstrap.shutdown()`

**影响**：
- Agent 通过 `confirm_deprecation`（confidence=0.9）创建的高置信提案 → Gateway 即时 deprecate ✅ 不受影响
- Agent 通过 `propose_evolution`（confidence 0.7-0.8）创建的 update 提案 → 进入 observing → 要等下次启动
- 只有 `propose_evolution` 的低置信（< 0.7）→ pending → 更不会被即时处理

**修复方案**（Phase 4）：在 cli.ts evolve-check Step 5 之后添加：
```typescript
// ── Step 6: 立即检查到期 Proposal ──
if (container.services.proposalExecutor) {
  const executor = container.get('proposalExecutor');
  await executor.checkAndExecute();
}
```

#### Q5 — RecipeProductionGateway source 标签塌缩（LOW）

**症状**：Step 6 supersede 和 `#createProposalFromAdvice` 中 `source` 统一写死为 `'ide-agent'`：

```typescript
source: source === 'mcp-external' ? 'ide-agent' : 'ide-agent', // always 'ide-agent'!
```

**位置**：
- [RecipeProductionGateway.ts#L440](lib/service/knowledge/RecipeProductionGateway.ts#L440) — Step 6 supersede
- [RecipeProductionGateway.ts#L600](lib/service/knowledge/RecipeProductionGateway.ts#L600) — `#createProposalFromAdvice` merge

**影响**：Gateway 指标中无法区分提案来自 `agent-tool`、`mcp-external` 还是 `batch-import`。
当前 `ProposalSource` 只有 3 个值（`ide-agent` | `metabolism` | `decay-scan`），无法覆盖 RecipeProductionGateway 的 4 种来源。

**评估**：功能上不影响（Gateway 只检查 `source !== 'metabolism'`），但数据溯源不准确。

**修复方案**：
1. 在 `ProposalSource` 中考虑新增 `'consolidation'` 来源
2. 或保持 `'ide-agent'` 并接受来源信息损失（当前策略）

#### Q6 — ReactiveEvolutionService 使用旧 ProposalType 常量（LOW）

**症状**：`#handleRenamed()` 构造临时 proposal 对象传给 ContentPatcher 时使用 `type: 'correction'`。

**位置**：[ReactiveEvolutionService.ts#L135](lib/service/evolution/ReactiveEvolutionService.ts#L135)

**影响**：无功能影响。ContentPatcher 不检查 `proposal.type`，该字段仅出现在构造的临时对象中，不写入 DB。但作为代码卫生问题，应统一为新类型。

**修复**：`type: 'correction'` → `type: 'update'`（一行变更）。

#### Q7 — KnowledgeMetabolism `PROPOSAL_TTL` 死代码（LOW）

**症状**：`const PROPOSAL_TTL = 7 * 24 * 60 * 60 * 1000` 用于 `#proposalsFromDecay()` 中设置 `EvolutionProposal.expiresAt`，但该值**从未传递给 Gateway**。

```typescript
// #proposalsFromDecay 设置 expiresAt
expiresAt: now + PROPOSAL_TTL,

// 但 Gateway.submit() 调用时不传 expiresAt：
await this.#gateway.submit({
  recipeId: p.targetRecipeId,
  action: 'deprecate',
  source: 'metabolism',
  confidence: p.confidence,
  // no expiresAt field — Gateway 自己用 OBSERVATION_WINDOWS.high
});
```

**位置**：[KnowledgeMetabolism.ts#L96](lib/service/evolution/KnowledgeMetabolism.ts#L96)

**影响**：无功能影响（Gateway 独立计算 expiresAt），但 `PROPOSAL_TTL` 和 `EvolutionProposal.expiresAt` 字段是死代码。

**修复**：删除 `PROPOSAL_TTL` 常量 + `EvolutionProposal.expiresAt` 字段。或保留作为 "fallback TTL"（如果 Gateway 为 null 时本地生成的 proposal 需要）。

#### Q8 — stats 类型安全缺失（MEDIUM）

**症状**：多个文件将 `entry.stats` 强制类型转换为 `Record<string, unknown>` 再通过 key 存取，无类型安全保护。

**位置**：
- [EvolutionGateway.ts#L128](lib/service/evolution/EvolutionGateway.ts#L128) — `stats as Record<string, unknown>`
- [ProposalExecutor.ts#L296](lib/service/evolution/ProposalExecutor.ts#L296) — `(entry.stats ?? {}) as unknown as Record<string, unknown>`
- [RecipeLifecycleSupervisor.ts](lib/service/evolution/RecipeLifecycleSupervisor.ts) — 多处 `stats[entryKey]`

**影响**：
- 缺少的字段（如 `guardHits`、`decayScore`）默认为 `undefined` → `?? 0` / `?? 50` 覆盖
- `decayScore ?? 50` 默认值意味着"找不到衰退分数时假设中等健康"，但 0 做 nullish 值有歧义
- 功能上已被 `??` 兜底，不会 NaN 级联（审计报告 CRITICAL-1 的说法有误）

**修复方案**：定义 `RecipeStats` 接口（与 DB schema 对齐），在仓储层 `#mapRow` 时解析并返回类型安全对象。属于跨 Proposal 系统的基础设施改进，不单独在进化系统内修复。

#### Q9 — 观察窗口双重定义（LOW 设计意图）

**症状**：`ProposalRepository` 和 `EvolutionGateway` 各自定义了 `OBSERVATION_WINDOWS`。

**位置**：
- [ProposalRepository.ts#L94](lib/repository/evolution/ProposalRepository.ts#L94) — 按 `ProposalType` 分
- [EvolutionGateway.ts#L59](lib/service/evolution/EvolutionGateway.ts#L59) — 按 `RiskTier` 分

**评估**：这是**设计意图**而非缺陷：
- Gateway 通过 `expiresAt` 传入精确到期时间（已含 risk-tier 计算）
- ProposalRepo 的窗口仅作为 **降级默认值**（Gateway 未传 expiresAt 时使用）
- RecipeProductionGateway 降级路径（无 Gateway）正好依赖 ProposalRepo 默认窗口

**备注**：ProposalRepo 注释已说明 "EvolutionGateway 按 RiskTier 精确控制"，文档化充分。

#### Q10 — 无 Proposal HTTP 端点和 Dashboard 视图（MEDIUM 可观测性缺口）

**症状**：
- `lib/http/routes/evolution.ts` 仅有 `POST /file-changed`（ReactiveEvolutionService 入口）
- 无 `GET /proposals`、`GET /proposals/stats`、`POST /proposals/:id/execute` 端点
- Dashboard 无 Proposal 列表页面（无法在 UI 中看到待处理提案）

**影响**：开发者完全不知道系统中有哪些 pending/observing 的 proposals。只能通过 CLI 或直接查 DB。

**修复方案**（Phase 5）：
1. 新增 `lib/http/routes/proposals.ts` — GET list, GET stats, POST manual-execute
2. Dashboard 新增 ProposalListView 组件
3. KnowledgeDetailView 中显示关联的 proposals

### 16.2 问题关联矩阵

```
Q2 (启动顺序) ←──→ Q4 (evolve-check)
  └─ 共同根因：checkAndExecute 触发时机单一
  └─ Phase 4 的 30min interval 可同时解决

Q1 (Gateway 静默失败) → Q3 (回退竞态)
  └─ 共同模式：空 catch 块 + 缺乏错误恢复
  └─ 建议统一处理：添加 warn 日志 + 确保关键路径有回退

Q5 (source 塌缩) → Q9 (窗口双重定义) → Q10 (无可观测性)
  └─ 共同主题：数据溯源 / 可观测性不足
  └─ Phase 5 的 Dashboard 视图可覆盖

Q6 + Q7 — 孤立的代码卫生问题（可随时修复）
Q8 — 跨系统基础设施设计问题（不属于进化系统独立修复范围）
```

### 16.3 修复优先级

| 问题 | 严重度 | 归属 Phase | 状态 | 备注 |
|------|--------|-----------|------|------|
| Q1 Gateway 静默失败 | MEDIUM | Phase 4 | ✅ 完成 | 两处 catch 加 warn 日志 |
| Q2 启动顺序 | HIGH | Phase 4 | ✅ 完成 | 调换 Stage 5→Metabolism / Stage 6→ProposalCheck |
| Q3 update 回退竞态 | MEDIUM | Phase 4 | ✅ 完成 | #executeUpdate 外层 try-catch + restoreRecipe |
| Q4 evolve-check 不触发 | HIGH | Phase 4 | ✅ 完成 | Step 5 后加 checkAndExecute |
| Q5 source 标签塌缩 | LOW | Phase 4 | ✅ 完成 | ProposalSource 新增 `'consolidation'` |
| Q6 ReactiveEvolution 旧类型 | LOW | 随时 | ✅ 完成 | `'correction'` → `'update'` |
| Q7 PROPOSAL_TTL 死代码 | LOW | 随时 | ✅ 完成 | 删除常量 + EvolutionProposal.expiresAt |
| Q8 stats 类型安全 | MEDIUM | 长期 | ❌ 延后 | 定义 RecipeStats 接口，仓储层改造 |
| Q9 窗口双重定义 | LOW | 保留 | — | 设计意图，不需要修复 |
| Q10 无 Proposal 端点 | MEDIUM | Phase 5 | ❌ 未开始 | 新路由 + Dashboard 组件 |
