# Evolution Pipeline 架构设计文档

> 文件变更 → Recipe 变更检测 → 进化/衰退逻辑生成 → Proposal 附加与合入

---

## 目录

**Part I — 问题诊断**
- [1. 现有架构问题分析](#1-现有架构问题分析)

**Part II — 重新设计**
- [2. 设计原则](#2-设计原则)
- [3. 新架构分层总览](#3-新架构分层总览)
- [4. Domain 层：EvolutionPolicy](#4-domain-层evolutionpolicy)
- [5. 基础能力层：LifecycleStateMachine](#5-基础能力层lifecyclestatemachine)
- [6. 服务层：EvolutionGateway（简化）](#6-服务层evolutiongateway简化)
- [7. 服务层：ProposalExecutor（简化）](#7-服务层proposalexecutor简化)
- [8. 服务层：FileChangeHandler（重命名）](#8-服务层filechangehandler重命名)
- [9. 服务层：RelevanceAuditor / ContentPatcher（保留）](#9-服务层relevanceauditor--contentpatcher保留)
- [10. 信号发射策略](#10-信号发射策略)
- [11. DI 注册拓扑（新）](#11-di-注册拓扑新)
- [12. 全链路数据流图（新）](#12-全链路数据流图新)
- [13. 状态机（保留）](#13-状态机保留)
- [14. 旧→新对照表](#14-旧新对照表)
- [15. 迁移路径](#15-迁移路径)
- [16. 涉及文件清单](#16-涉及文件清单)

---

# Part I — 问题诊断

## 1. 现有架构问题分析

### P1: 生命周期权威碎片化

**3 个组件**可以直接修改 Recipe 的 lifecycle 状态：

| 组件 | 调用方式 | 绕过 Guard/Event？ |
|------|---------|-------------------|
| RecipeLifecycleSupervisor | `.transition()` | 否（正规路径） |
| EvolutionGateway | `knowledgeRepo.updateLifecycle()` | **是** |
| ProposalExecutor | `knowledgeRepo.updateLifecycle()` | **是** |

Gateway 和 Executor 中存在**完全相同的 bypass 模式**：

```typescript
// EvolutionGateway L232-241 / ProposalExecutor L387-399 — 同一模式出现两次
if (this.#supervisor) {
  const result = await this.#supervisor.transition({ ... });
  if (!result.success) {
    // Supervisor 拒绝 → 绕过 Guard，直接写 DB
    await this.#knowledgeRepo.updateLifecycle(recipeId, 'deprecated');
  }
} else {
  // 无 Supervisor → 直接写 DB
  await this.#knowledgeRepo.updateLifecycle(recipeId, 'deprecated');
}
```

**后果**：
- Supervisor 的 Guard（合法转移检查）可被绕过 → 非法状态转移不可拦截
- Entry/Exit Actions（时间戳写入）被跳过 → stats 数据不一致
- TransitionEvent 不会被记录 → 审计日志缺失
- Signal 不会被发射 → 下游监听者无法感知状态变化
- Supervisor 设计为"可选增强层"但实际是**关键基础设施**

### P2: 决策逻辑散落

业务规则分布在 **4 个不同的文件** 中：

| 规则 | 所在位置 | 类型 |
|------|---------|------|
| 风险分级 `resolveRiskTier()` | EvolutionGateway L289 | 导出函数 |
| 立即执行判定 `confidence >= 0.8 && source !== 'metabolism'` | EvolutionGateway L177 | 内联条件 |
| 观察窗口时长 `OBSERVATION_WINDOWS` | EvolutionGateway L66 | 常量 |
| Proposal 初始状态 `#resolveInitialStatus()` | ProposalRepository L385 | 私有方法 |
| Update 执行判据 `fpOk && hasUsage` | ProposalExecutor L207-208 | 内联逻辑 |
| Deprecate 执行判据 `decayScore <= 19/40` | ProposalExecutor L314-325 | 内联逻辑 |
| 相关性分级 `dead/severe/decay/watch/healthy` | RecipeRelevanceAuditor L477 | 内联分支 |
| 相关性→置信度映射 `dead=0.95, severe=0.6, decay=0.4` | RecipeRelevanceAuditor L498 | 内联常量 |
| Pending 过期天数 `PENDING_EXPIRY_DAYS = 14` | ProposalExecutor L54 | 常量 |

**后果**：
- 无法集中查看/修改/测试决策规则
- 阈值分散在多处，修改时容易遗漏
- 测试需要 mock 整个服务链才能验证一个阈值

### P3: ProposalExecutor 职责过重

533 行代码承担了 **6 项职责**：

1. **业务规则评估** — FP rate < 0.4、hasUsage、decayScore 阈值
2. **状态编排** — active → evolving → staging/active 转移序列
3. **内容修补编排** — ContentPatcher 调用 + 失败回退
4. **关系创建** — deprecated_by edge 写入
5. **信号发射** — lifecycle signal emit
6. **指标收集** — stats/quality 字段解析

**后果**：
- 单一类修改成本高（任何变更都可能影响其他职责）
- 难以单独测试某一职责
- 错误处理路径指数增长（每个 nullable 依赖 × 每个失败分支）

### P4: 可选依赖组合爆炸

| 组件 | 可选依赖 | 路径数 |
|------|---------|--------|
| EvolutionGateway | supervisor?, signalBus? | 4 条路径 |
| ProposalExecutor | supervisor?, signalBus?, contentPatcher?, edgeRepo? | 16 条路径 |
| RecipeLifecycleSupervisor | proposalRepo?, lifecycleEventRepo?, signalBus? | 8 条路径 |
| ReactiveEvolutionService | signalBus? | 2 条路径 |

**理论组合数：4 × 16 × 8 × 2 = 1024 种运行时配置**

每种配置的行为略有不同（是否有审计日志、是否有信号、是否有 Guard），但没有文档化哪些配置是预期的、哪些是降级的。

### P5: 信号发射散落

| 组件 | 发射 `lifecycle` 信号 | 发射 `quality` 信号 |
|------|---------------------|---------------------|
| ReactiveEvolutionService | ✓ (deleted/deprecated) | ✓ (rename fix / modified) |
| EvolutionGateway | ✓ (proposal created) | |
| RecipeLifecycleSupervisor | ✓ (state transition) | |
| ProposalExecutor | ✓ (proposal executed/rejected) | |

- 同一个 Recipe 弃用可能触发 **3 次** lifecycle 信号（ReactiveEvolution + Gateway + Supervisor）
- 无法从信号消费者的角度理解 "一次操作发几个信号"

### P6: Gateway 身兼执行者

Gateway 的设计意图是**决策路由**，但 `#immediateDeprecate()` 使其也承担了**执行者**角色：

```
submit(deprecate, confidence=0.95)
  → #handleDeprecate()
    → #immediateDeprecate()  // Gateway 自己执行了状态变更
      → supervisor.transition(deprecated)
      → resolveExistingDeprecateProposals()
```

这与 ProposalExecutor 的职责重叠：两者都做 "判断 + 执行 lifecycle 转移"。

### P7: ReactiveEvolutionService 名称不清

- 名称暗示"进化服务"，实际是"文件变更对 Recipe 的影响处理器"
- 内部混合了 4 种不同职责：
  1. 路径修复（rename → ContentPatcher 调用）
  2. 源引用管理（sourceRefRepo 操作）
  3. 弃用决策（delete → Gateway.submit）
  4. 信号发射

---

# Part II — 重新设计

## 2. 设计原则

### 原则 1: 单一生命周期权威

> **LifecycleStateMachine 是修改 Recipe lifecycle 的唯一路径。**

任何组件（Gateway、Executor、FileChangeHandler）如需变更 Recipe 状态，
必须且只能调用 `LifecycleStateMachine.transition()`。
`knowledgeRepo.updateLifecycle()` 从公开 API 中移除或标记为 `@internal`。

### 原则 2: 决策规则集中化

> **所有阈值、分级、判据集中在 EvolutionPolicy 中，以纯函数形式存在。**

服务层组件只做编排（调用 Policy 获取决策 → 按决策执行动作），不内联业务规则。

### 原则 3: 必需依赖

> **核心管线组件的依赖全部为必需（non-nullable），不存在降级路径。**

如果某个 subsystem 没初始化完成，整个服务不应启动。
消除 `?? null` + `if (this.#x)` 分支。

### 原则 4: 信号由状态机集中发射

> **所有 lifecycle 信号从 LifecycleStateMachine 内部发射。**

服务层不直接操作 SignalBus（quality 信号除外，由产生 quality 事件的源头发射）。

### 原则 5: 编排与决策分离

> **服务层是编排器（Orchestrator），域层是决策者（Policy）。**

ProposalExecutor 不包含 "FP < 0.4" 这样的阈值。
它只调用 `EvolutionPolicy.evaluateUpdate(metrics)` 获取 `{ pass, reason }`。

---

## 3. 新架构分层总览

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer（纯逻辑，无 I/O，无副作用）                     │
│                                                              │
│  lib/domain/evolution/EvolutionPolicy.ts                     │
│    ├── assessRisk(action, confidence, source) → RiskTier     │
│    ├── observationWindow(risk) → ms                          │
│    ├── shouldImmediateExecute(action, confidence, source)    │
│    ├── resolveInitialStatus(type, confidence)                │
│    ├── evaluateUpdate(metrics) → { pass, reason }            │
│    ├── evaluateDeprecate(currentDecay, snapshotDecay)        │
│    ├── classifyRelevance(score) → { verdict, confidence }    │
│    └── shouldExpirePending(proposedAt, now) → boolean        │
│                                                              │
│  lib/domain/knowledge/Lifecycle.ts  (保留)                   │
│    ├── VALID_TRANSITIONS                                     │
│    ├── isValidTransition(from, to)                           │
│    └── 六态定义 + 辅助函数                                    │
├──────────────────────────────────────────────────────────────┤
│  基础能力层（唯一状态权威 + 事件总线）                          │
│                                                              │
│  lib/service/evolution/LifecycleStateMachine.ts              │
│    ├── transition(request) → TransitionResult    必经路径     │
│    ├── checkTimeouts() → TimeoutCheckResult                  │
│    ├── getHistory(recipeId, limit)                           │
│    └── getHealth() → HealthSummary                           │
│  所有依赖必需: knowledgeRepo, eventRepo, signalBus           │
├──────────────────────────────────────────────────────────────┤
│  服务层（编排器，组合 Domain + 基础能力）                      │
│                                                              │
│  EvolutionGateway         纯路由，不执行状态变更（除 valid）   │
│  ProposalExecutor         纯编排，不含阈值                    │
│  FileChangeHandler        文件变更处理（重命名自 Reactive...） │
│  RelevanceAuditor         相关性审计（简化名称）               │
│  ContentPatcher           内容修补（保留）                     │
├──────────────────────────────────────────────────────────────┤
│  数据层（保留）                                               │
│                                                              │
│  ProposalRepository       Proposal CRUD                      │
│  LifecycleEventRepository TransitionEvent 审计                │
│  KnowledgeEdgeRepository  Recipe 关系边                       │
│  RecipeSourceRefRepository 文件↔Recipe 映射                   │
├──────────────────────────────────────────────────────────────┤
│  接入层（保留）                                               │
│                                                              │
│  HTTP routes: file-changes, evolution                        │
│  MCP handlers: rescan-internal, rescan-external              │
│  CLI: evolve-check                                           │
│  Dashboard: EvolutionPanel                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Domain 层：EvolutionPolicy

**新增文件**: `lib/domain/evolution/EvolutionPolicy.ts`

纯函数集合，零依赖，所有进化决策规则的**唯一来源 (Single Source of Truth)**。

```typescript
/**
 * EvolutionPolicy — 进化决策规则集
 *
 * 纯函数，无 I/O，无副作用。
 * 所有阈值和分级逻辑集中在此，服务层只做编排。
 */

/* ═══ 类型 ═══ */

export type RiskTier = 'low' | 'medium' | 'high';

export type RelevanceVerdict = 'healthy' | 'watch' | 'decay' | 'severe' | 'dead';

export interface UpdateVerdict {
  pass: boolean;
  reason: string;
}

export interface DeprecateVerdict {
  action: 'deprecated' | 'decaying' | 'reject';
  reason: string;
}

/* ═══ 常量（集中定义） ═══ */

/** 观察窗口（毫秒） */
const OBSERVATION_WINDOWS: Record<RiskTier, number> = {
  low:    24 * 60 * 60 * 1000,     // 24h
  medium: 72 * 60 * 60 * 1000,     // 72h
  high:   7 * 24 * 60 * 60 * 1000, // 7d
};

/** Pending 自动过期天数 */
const PENDING_EXPIRY_DAYS = 14;

/** Update 执行阈值 */
const UPDATE_FP_THRESHOLD = 0.4;

/** Deprecate 死亡/严重阈值 */
const DECAY_DEAD_THRESHOLD = 19;
const DECAY_SEVERE_THRESHOLD = 40;
const DECAY_RECOVERY_DELTA = 10;

/** 相关性评分 → Verdict 分界线 */
const RELEVANCE_THRESHOLDS = {
  healthy: 80,
  watch: 60,
  decay: 40,
  severe: 20,
  // < 20 = dead
};

/** Verdict → 置信度 */
const RELEVANCE_CONFIDENCE: Record<string, number> = {
  dead: 0.95,
  severe: 0.6,
  decay: 0.4,
};

/* ═══ 策略函数 ═══ */

export class EvolutionPolicy {

  /** 风险分级 */
  static assessRisk(
    action: 'update' | 'deprecate',
    confidence: number,
    _source?: string,
  ): RiskTier {
    if (action === 'deprecate') { return 'high'; }
    if (confidence >= 0.8) { return 'low'; }
    return 'medium';
  }

  /** 观察窗口时长（毫秒） */
  static observationWindow(risk: RiskTier): number {
    return OBSERVATION_WINDOWS[risk];
  }

  /** 是否应立即执行（跳过 Proposal 观察） */
  static shouldImmediateExecute(
    action: string,
    confidence: number,
    source: string,
  ): boolean {
    return action === 'deprecate'
      && confidence >= 0.8
      && source !== 'metabolism';
  }

  /** Proposal 创建时的初始状态 */
  static resolveInitialStatus(
    type: 'update' | 'deprecate',
    confidence: number,
  ): 'pending' | 'observing' {
    if (type === 'deprecate') { return 'observing'; }
    return confidence >= 0.7 ? 'observing' : 'pending';
  }

  /** Update Proposal 到期评估 */
  static evaluateUpdate(metrics: {
    ruleFalsePositiveRate: number;
    guardHits: number;
    searchHits: number;
  }): UpdateVerdict {
    const fpOk = metrics.ruleFalsePositiveRate < UPDATE_FP_THRESHOLD;
    const hasUsage = metrics.guardHits > 0 || metrics.searchHits > 0;

    if (!fpOk) {
      return { pass: false, reason: `FP rate too high: ${(metrics.ruleFalsePositiveRate * 100).toFixed(0)}%` };
    }
    if (!hasUsage) {
      return { pass: false, reason: 'no usage during observation' };
    }
    return { pass: true, reason: 'observation passed' };
  }

  /** Deprecate Proposal 到期评估 */
  static evaluateDeprecate(
    currentDecay: number,
    snapshotDecay: number,
  ): DeprecateVerdict {
    if (currentDecay > snapshotDecay + DECAY_RECOVERY_DELTA) {
      return { action: 'reject', reason: `decay recovered: ${snapshotDecay} → ${currentDecay}` };
    }
    if (currentDecay <= DECAY_DEAD_THRESHOLD) {
      return { action: 'deprecated', reason: `dead: decayScore=${currentDecay}` };
    }
    if (currentDecay <= DECAY_SEVERE_THRESHOLD) {
      return { action: 'decaying', reason: `severe: decayScore=${currentDecay}` };
    }
    return { action: 'reject', reason: `decay slowed: decayScore=${currentDecay}` };
  }

  /** 相关性评分 → Verdict + 置信度 */
  static classifyRelevance(score: number): {
    verdict: RelevanceVerdict;
    confidence: number;
  } {
    if (score >= RELEVANCE_THRESHOLDS.healthy) {
      return { verdict: 'healthy', confidence: 0 };
    }
    if (score >= RELEVANCE_THRESHOLDS.watch) {
      return { verdict: 'watch', confidence: 0 };
    }
    if (score >= RELEVANCE_THRESHOLDS.decay) {
      return { verdict: 'decay', confidence: RELEVANCE_CONFIDENCE.decay };
    }
    if (score >= RELEVANCE_THRESHOLDS.severe) {
      return { verdict: 'severe', confidence: RELEVANCE_CONFIDENCE.severe };
    }
    return { verdict: 'dead', confidence: RELEVANCE_CONFIDENCE.dead };
  }

  /** Pending Proposal 是否应过期 */
  static shouldExpirePending(proposedAt: number, now: number): boolean {
    return now - proposedAt > PENDING_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  }
}
```

### 设计优势

- **零依赖** → 单元测试只需传入参数、断言返回值
- **所有阈值在一个文件** → 修改一处生效全局
- **纯函数** → 可直接在 REPL / 测试中验证行为

### 从旧代码中迁出的规则

| 旧位置 | 旧实现 | 新方法 |
|--------|--------|--------|
| `EvolutionGateway.resolveRiskTier()` L289 | 导出函数 | `EvolutionPolicy.assessRisk()` |
| `EvolutionGateway.OBSERVATION_WINDOWS` L66 | 模块常量 | `EvolutionPolicy.observationWindow()` |
| `EvolutionGateway.#handleDeprecate()` L177 | 内联 `if` | `EvolutionPolicy.shouldImmediateExecute()` |
| `ProposalRepository.#resolveInitialStatus()` L385 | 私有方法 | `EvolutionPolicy.resolveInitialStatus()` |
| `ProposalExecutor.#executeUpdate()` L207-208 | 内联逻辑 | `EvolutionPolicy.evaluateUpdate()` |
| `ProposalExecutor.#executeDeprecate()` L272-325 | 内联逻辑 | `EvolutionPolicy.evaluateDeprecate()` |
| `RecipeRelevanceAuditor.#executeDecay()` L477-504 | 内联分支 | `EvolutionPolicy.classifyRelevance()` |
| `ProposalExecutor.PENDING_EXPIRY_DAYS` L54 | 常量 | `EvolutionPolicy.shouldExpirePending()` |

---

## 5. 基础能力层：LifecycleStateMachine

**重命名**: `RecipeLifecycleSupervisor` → `LifecycleStateMachine`

**文件**: `lib/service/evolution/LifecycleStateMachine.ts`（新建，替代旧 Supervisor）

### 5.1 核心变更

| 维度 | 旧 Supervisor | 新 StateMachine |
|------|--------------|-----------------|
| 定位 | "可选增强层" | **唯一权威** |
| 依赖性质 | 全部可选 (`?? null`) | **全部必需** |
| bypass 路径 | Gateway/Executor 可绕过 | **不存在绕过** |
| 信号发射 | 可选 signalBus | **内置，总是发射** |
| 事件记录 | 可选 eventRepo | **内置，总是记录** |

### 5.2 接口签名

```typescript
export class LifecycleStateMachine {
  constructor(
    knowledgeRepo: KnowledgeRepositoryImpl,    // 必需
    eventRepo: LifecycleEventRepository,        // 必需
    signalBus: SignalBus,                       // 必需
    proposalRepo: ProposalRepository,           // 必需（getHealth 统计）
  )

  /**
   * 状态转移 — THE ONLY WAY
   *
   * 流程:
   *   1. 读取当前 lifecycle
   *   2. Guard: isValidTransition(from, to)
   *   3. Exit Action
   *   4. DB 更新
   *   5. Entry Action
   *   6. 记录 TransitionEvent
   *   7. 发射 lifecycle signal
   *
   * 如果 Guard 拒绝 → 返回 { success: false }
   * 调用者不应 fallback 到 updateLifecycle()
   */
  async transition(request: TransitionRequest): Promise<TransitionResult>

  /** 超时检查（evolving 7d→active, decaying 30d→deprecated, pending 30d→deprecated） */
  async checkTimeouts(): Promise<TimeoutCheckResult>

  /** 审计日志 */
  getHistory(recipeId: string, limit?: number): TransitionEvent[]

  /** 健康摘要 */
  async getHealth(): Promise<LifecycleHealthSummary>
}
```

### 5.3 Guard 拒绝处理策略

旧设计中 Guard 拒绝后 Gateway/Executor 会 fallback 到直接 `updateLifecycle()`。

新设计中 **Guard 拒绝 = 操作不执行**：

```typescript
// EvolutionGateway — 新写法
async #immediateDeprecate(decision: EvolutionDecision): Promise<EvolutionResult> {
  const result = await this.#lifecycle.transition({
    recipeId: decision.recipeId,
    targetState: 'deprecated',
    trigger: 'evolution-gateway',
    evidence: { reason: decision.reason },
    operatorId: decision.source,
  });

  if (!result.success) {
    // Guard 拒绝 → 降级为创建 Proposal（让人类审查）
    // 而非绕过 Guard 强制执行
    return this.#createProposal(decision, 'high');
  }

  this.#resolveExistingDeprecateProposals(decision.recipeId, ...);
  return { recipeId, action: 'deprecate', outcome: 'immediately-executed' };
}
```

**关键差异**：Guard 拒绝时不再强制执行，而是降级为创建 Proposal 进入观察流程。
这保证了状态机的完整性 — 如果状态转移不合法，系统不会强行绕过。

### 5.4 `knowledgeRepo.updateLifecycle()` 的保护

两种方案（二选一）：

**方案 A — 接口隔离**：定义 `LifecycleWriter` 接口，仅 StateMachine 持有实现引用。
服务层组件注入的 `KnowledgeRepository` 不包含 `updateLifecycle()` 方法。

```typescript
// 仅 LifecycleStateMachine 使用
interface LifecycleWriter {
  updateLifecycle(id: string, state: string): Promise<void>;
}

// 服务层使用的 readonly 视图
interface KnowledgeReader {
  findById(id: string): Promise<RecipeEntry | null>;
  // ... 不含 updateLifecycle
}
```

**方案 B — 运行时断言**（更轻量）：在 `updateLifecycle()` 内添加调用栈检查（debug 模式），
或通过 code review 约定 "只有 StateMachine 可调用"。

**推荐方案 A**，通过 TypeScript 类型系统强制约束。

---

## 6. 服务层：EvolutionGateway（简化）

**文件**: `lib/service/evolution/EvolutionGateway.ts`（重构）

### 6.1 新旧对比

| 维度 | 旧 Gateway | 新 Gateway |
|------|-----------|-----------|
| 依赖 | proposalRepo, knowledgeRepo, supervisor?, signalBus? | proposalRepo, lifecycle, knowledgeRepo |
| 决策逻辑 | `resolveRiskTier()` 内联 | `EvolutionPolicy.assessRisk()` 外部 |
| 立即执行 | `#immediateDeprecate()` 直接调 supervisor/updateLifecycle | `lifecycle.transition()` 唯一路径 |
| Guard 拒绝 | fallback 绕过 | 降级为 Proposal |
| 信号发射 | 手动 `signalBus.send()` | StateMachine 内部自动 |
| 行数 | ~314 行 | ~180 行 |

### 6.2 新构造函数

```typescript
export class EvolutionGateway {
  constructor(
    proposalRepo: ProposalRepository,
    lifecycle: LifecycleStateMachine,    // 必需，替代 supervisor + knowledgeRepo
    knowledgeRepo: KnowledgeRepositoryImpl, // 仅用于 findById 和 updateStats
  )
}
```

### 6.3 `submit()` 新逻辑

```typescript
async submit(decision: EvolutionDecision): Promise<EvolutionResult> {
  // 前置检查
  const entry = await this.#knowledgeRepo.findById(decision.recipeId);
  if (!entry) { return { outcome: 'error', error: 'not found' }; }

  switch (decision.action) {
    case 'valid':
      return this.#handleValid(decision, entry);

    case 'update':
      return this.#createProposal(decision);

    case 'deprecate':
      if (EvolutionPolicy.shouldImmediateExecute(
        decision.action, decision.confidence, decision.source
      )) {
        return this.#immediateDeprecate(decision);
      }
      return this.#createProposal(decision);
  }
}
```

### 6.4 `#createProposal()` — 统一 update/deprecate 的 Proposal 创建

```typescript
#createProposal(decision: EvolutionDecision): EvolutionResult {
  const risk = EvolutionPolicy.assessRisk(decision.action, decision.confidence, decision.source);
  // 信号驱动：expiresAt = 0，不再依赖定时过期
  // Proposal 的推进由 ProposalExecutor 订阅 SignalBus 信号触发
  const expiresAt = 0;

  const proposal = this.#proposalRepo.create({
    type: decision.action as 'update' | 'deprecate',
    targetRecipeId: decision.recipeId,
    confidence: decision.confidence,
    source: decision.source,
    description: decision.description ?? '',
    evidence: decision.evidence ?? [],
    expiresAt,
    relatedRecipeIds: decision.replacedByRecipeId ? [decision.replacedByRecipeId] : [],
  });

  if (!proposal) {
    return { recipeId: decision.recipeId, action: decision.action, outcome: 'skipped' };
  }

  // 无需手动 signalBus — Proposal 创建不涉及 lifecycle 变更
  // Proposal 执行时 lifecycle.transition() 会自动发射信号
  return { recipeId: decision.recipeId, action: decision.action, outcome: 'proposal-created', proposalId: proposal.id };
}
```

### 6.5 移除项

- ❌ `#supervisor` 字段 → 替换为 `#lifecycle`
- ❌ `#signalBus` 字段 → StateMachine 内部处理
- ❌ `resolveRiskTier()` 导出 → 迁移到 `EvolutionPolicy.assessRisk()`
- ❌ `OBSERVATION_WINDOWS` 常量 → 迁移到 `EvolutionPolicy`
- ❌ `#emitSignal()` 方法 → 不再需要
- ❌ bypass 代码（L236-241） → 不再存在

---

## 7. 服务层：ProposalExecutor（简化）

**文件**: `lib/service/evolution/ProposalExecutor.ts`（重构）

### 7.1 新旧对比

| 维度 | 旧 Executor | 新 Executor |
|------|------------|------------|
| 依赖 | knowledgeRepo, proposalRepo, supervisor?, signalBus?, contentPatcher?, edgeRepo? | knowledgeRepo, proposalRepo, lifecycle, contentPatcher, edgeRepo |
| 触发方式 | 定时 `checkAndExecute()`（轮询过期 Proposal） | **信号驱动** `subscribeToSignals(signalBus)` + 启动时兜底 `checkAndExecute()` |
| 决策逻辑 | 内联 FP/usage/decay 阈值 | `EvolutionPolicy.evaluateUpdate()` / `evaluateDeprecate()` |
| 状态转移 | `#transitionRecipe()` 含 bypass | `lifecycle.transition()` 唯一路径 |
| 信号发射 | `#emitSignal()` 手动 | StateMachine 内部自动 |
| 可选依赖 | 4 个 | 0 个 |
| 行数 | ~533 行 | ~300 行 |

### 7.2 新构造函数

```typescript
export class ProposalExecutor {
  constructor(
    knowledgeRepo: KnowledgeRepositoryImpl,  // for metrics
    proposalRepo: ProposalRepository,
    lifecycle: LifecycleStateMachine,        // 必需
    contentPatcher: ContentPatcher,           // 必需
    edgeRepo: KnowledgeEdgeRepositoryImpl,    // 必需
  )
}
```

### 7.3 `#executeUpdate()` 新实现

```typescript
async #executeUpdate(proposal, result): Promise<void> {
  const metrics = await this.#collectRecipeMetrics(proposal.targetRecipeId);
  const verdict = EvolutionPolicy.evaluateUpdate(metrics);  // 决策外置

  if (!verdict.pass) {
    this.#proposalRepo.markRejected(proposal.id, verdict.reason);
    result.rejected.push({ id: proposal.id, type: 'update', reason: verdict.reason });
    return;
  }

  // 编排：evolving → patch → staging/active
  const evolveResult = await this.#lifecycle.transition({
    recipeId: proposal.targetRecipeId,
    targetState: 'evolving',
    trigger: 'proposal-attach',
    proposalId: proposal.id,
  });

  if (!evolveResult.success) {
    this.#proposalRepo.markRejected(proposal.id, `transition failed: ${evolveResult.error}`);
    result.rejected.push({ id: proposal.id, type: 'update', reason: evolveResult.error });
    return;
  }

  const patchResult = await this.#contentPatcher.applyProposal(proposal, 'agent-suggestion');
  const nextState = patchResult?.success ? 'staging' : 'active';

  await this.#lifecycle.transition({
    recipeId: proposal.targetRecipeId,
    targetState: nextState,
    trigger: 'content-patch-complete',
    proposalId: proposal.id,
  });

  const resolution = patchResult?.success
    ? `patched=[${patchResult.fieldsPatched.join(',')}]`
    : 'patch skipped, reverted to active';
  this.#proposalRepo.markExecuted(proposal.id, resolution);
  result.executed.push({ id: proposal.id, type: 'update', targetRecipeId: proposal.targetRecipeId });
}
```

### 7.4 `#executeDeprecate()` 新实现

```typescript
async #executeDeprecate(proposal, result): Promise<void> {
  const metrics = await this.#collectRecipeMetrics(proposal.targetRecipeId);
  const snapshot = this.#extractSnapshot(proposal);
  const verdict = EvolutionPolicy.evaluateDeprecate(
    metrics.decayScore,
    snapshot?.decayScore ?? metrics.decayScore,
  );  // 决策外置

  if (verdict.action === 'reject') {
    this.#proposalRepo.markRejected(proposal.id, verdict.reason);
    result.rejected.push({ id: proposal.id, type: 'deprecate', reason: verdict.reason });
    return;
  }

  // 编排：transition to verdict.action ('deprecated' | 'decaying')
  const transResult = await this.#lifecycle.transition({
    recipeId: proposal.targetRecipeId,
    targetState: verdict.action,  // 'deprecated' 或 'decaying'
    trigger: 'proposal-execution',
    proposalId: proposal.id,
  });

  if (!transResult.success) {
    this.#proposalRepo.markRejected(proposal.id, `transition failed: ${transResult.error}`);
    result.rejected.push({ id: proposal.id, type: 'deprecate', reason: transResult.error });
    return;
  }

  this.#proposalRepo.markExecuted(proposal.id, verdict.reason);
  result.executed.push({ id: proposal.id, type: 'deprecate', targetRecipeId: proposal.targetRecipeId });

  // supersede edge
  if (proposal.relatedRecipeIds?.[0]) {
    await this.#edgeRepo.upsertEdge(
      proposal.relatedRecipeIds[0],
      proposal.targetRecipeId,
      'deprecated_by',
    );
  }
}
```

### 7.5 移除项

- ❌ `#supervisor` 字段 → 替换为 `#lifecycle`
- ❌ `#signalBus` 字段 → 不再需要
- ❌ `#transitionRecipe()` 私有方法（含 bypass） → 直接调 `lifecycle.transition()`
- ❌ `#restoreRecipe()` 私有方法 → 不再需要（Guard 拒绝 = 操作失败，不需要恢复）
- ❌ `#emitSignal()` 私有方法 → 不再需要
- ❌ `PENDING_EXPIRY_DAYS` 常量 → 迁移到 `EvolutionPolicy`
- ❌ 内联阈值 `0.4` / `19` / `40` / `10` → 迁移到 `EvolutionPolicy`

### 7.6 信号驱动评估（Phase B 新增）

旧 Executor 依赖定时 `checkAndExecute()` 扫描过期 Proposal。
新设计**全面从时间驱动转为信号驱动**：

**核心机制：**

```typescript
// 启动时订阅信号总线
subscribeToSignals(signalBus: SignalBus): void {
  // 订阅 guard / search / decay / quality / usage / lifecycle 信号
  for (const type of ['guard','search','decay','quality','usage','lifecycle']) {
    signalBus.subscribe(type, (signal) => this.#onSignal(signal));
  }
}

// 信号到达 → 查找该 Recipe 的 observing Proposal → 逐个评估
async #onSignal(signal: Signal): Promise<void> {
  const target = signal.metadata?.target;
  if (!target) return;
  const proposals = this.#repo.findByTarget(target, 'observing');
  for (const p of proposals) {
    await this.#evaluateOnSignal(p, signal);
  }
}
```

**Proposal 创建时 `expiresAt = 0`**：不再设置过期时间，Proposal 的推进完全由信号触发。

**启动时兜底**：`checkAndExecute()` 保留为启动清理 —— 扫描 `repo.find({ status: 'observing' })` 并对每个 Proposal 做一次性评估，处理离线期间累积的信号。

**在 `UiStartupTasks` 中的注册（Stage 6-7）**：
- Stage 6: 启动时兜底清理（过期 Pending + Observing 评估）
- Stage 7: `proposalExecutor.subscribeToSignals(signalBus)` — 订阅 SignalBus 开始实时响应

---

## 8. 服务层：FileChangeHandler（重命名）

**重命名**: `ReactiveEvolutionService` → `FileChangeHandler`

**文件**: `lib/service/evolution/FileChangeHandler.ts`（重命名 + 简化）

### 8.1 新旧对比

| 维度 | 旧 ReactiveEvolutionService | 新 FileChangeHandler |
|------|---------------------------|---------------------|
| 名称 | 模糊（"进化服务"） | 精确（"文件变更处理器"） |
| 依赖 | sourceRefRepo, knowledgeRepo, contentPatcher, signalBus?, gateway | sourceRefRepo, knowledgeRepo, contentPatcher, gateway |
| 信号发射 | 手动 quality/lifecycle signal | 仅 quality signal（lifecycle 由 StateMachine 通过 Gateway 链路自动发射） |

### 8.2 新构造函数

```typescript
export class FileChangeHandler implements FileChangeSubscriber {
  readonly name = 'FileChangeHandler';

  constructor(
    sourceRefRepo: RecipeSourceRefRepositoryImpl,
    knowledgeRepo: KnowledgeRepositoryImpl,  // for reasoning updates
    contentPatcher: ContentPatcher,
    gateway: EvolutionGateway,
  )
}
```

### 8.3 变更点

- 移除 `#signalBus` — lifecycle 信号由 Gateway → StateMachine 链路自动发射
- 保留 quality signal 发射（rename fix → quality=0.1, modified → quality=0.5），通过 gateway 传递或直接保留 SignalBus 依赖（二选一，取决于 quality signal 的发射频率）
- 类名和文件名更清晰

### 8.4 职责边界

```
FileChangeHandler 只做:
  ✓ 事件分类路由 (renamed/deleted/modified/created)
  ✓ Source reference 管理 (stale/renamed/active)
  ✓ 路径修复编排 (ContentPatcher 调用)
  ✓ 弃用决策委托 (Gateway.submit)
  ✓ Quality signal 发射 (rename fix 质量度量)

FileChangeHandler 不做:
  ✗ Lifecycle 直接变更
  ✗ Proposal 创建/管理
  ✗ 业务规则判定
```

---

## 9. 服务层：RelevanceAuditor / ContentPatcher（保留）

### RelevanceAuditor

**重命名**: `RecipeRelevanceAuditor` → `RelevanceAuditor`

变更点：
- `#executeDecay()` 中的分级逻辑迁移到 `EvolutionPolicy.classifyRelevance()`
- 内联的 `confidenceMap` 删除 → 从 `EvolutionPolicy` 返回值中获取

```typescript
// 旧
const confidenceMap = { dead: 0.95, severe: 0.6, decay: 0.4 };
gateway.submit({ confidence: confidenceMap[verdict] });

// 新
const { verdict, confidence } = EvolutionPolicy.classifyRelevance(score);
if (verdict === 'healthy' || verdict === 'watch') { return; }
gateway.submit({ confidence });
```

### ContentPatcher

**保留不变** — 职责清晰、边界明确、无架构问题。

---

## 10. 信号发射策略

### 新策略

| 信号类型 | 发射者 | 时机 | 说明 |
|----------|--------|------|------|
| `lifecycle` | **LifecycleStateMachine** | `transition()` 成功后 | 自动、必然、集中 |
| `quality` | FileChangeHandler | rename fix / modified | 源头发射，与 lifecycle 无关 |

### 变更

- ❌ EvolutionGateway 不再发射 `lifecycle` signal（Proposal 创建不是 lifecycle 变更）
- ❌ ProposalExecutor 不再发射 `lifecycle` signal（transition 内部已发射）
- ❌ ReactiveEvolutionService 不再发射 `lifecycle` signal（Gateway → StateMachine 链路自动发射）
- ✅ LifecycleStateMachine 在每次成功 transition 后发射 `lifecycle` signal
- ✅ FileChangeHandler 保留 `quality` signal 发射

### 信号去重

旧架构中一次 "delete → deprecate" 操作可能触发 3 次 lifecycle signal：
1. ReactiveEvolutionService 发射 `reactive_deprecate`
2. EvolutionGateway 发射 `proposals-created`
3. RecipeLifecycleSupervisor 发射 transition event

新架构中只有 **1 次**：StateMachine 在 `transition(deprecated)` 成功后发射。

---

## 11. DI 注册拓扑（新）

**文件**: `lib/injection/modules/KnowledgeModule.ts`

### 新注册顺序

```
proposalRepository          ← drizzle
lifecycleEventRepository    ← drizzle
knowledgeEdgeRepository     ← drizzle
recipeSourceRefRepository   ← drizzle

lifecycleStateMachine       ← knowledgeRepo, lifecycleEventRepo, signalBus, proposalRepo
                               (全部必需，无 ?? null)

contentPatcher              ← knowledgeRepo, recipeSourceRefRepo

evolutionGateway            ← proposalRepo, lifecycleStateMachine, knowledgeRepo
                               (无 supervisor?, 无 signalBus?)

proposalExecutor            ← knowledgeRepo, proposalRepo, lifecycleStateMachine,
                               contentPatcher, knowledgeEdgeRepo
                               (全部必需，无 ?? null)

fileChangeHandler           ← sourceRefRepo, knowledgeRepo, contentPatcher, evolutionGateway

fileChangeDispatcher        ← (register: fileChangeHandler)
```

### 对比旧拓扑

| 服务 | 旧可选依赖 | 新可选依赖 |
|------|-----------|-----------|
| LifecycleStateMachine | signalBus?, eventRepo?, proposalRepo? | **无** |
| EvolutionGateway | supervisor?, signalBus? | **无** |
| ProposalExecutor | supervisor?, signalBus?, contentPatcher?, edgeRepo? | **无** |
| FileChangeHandler | signalBus? | **无** |

**总可选依赖数: 11 → 0**

---

## 12. 全链路数据流图（新）

```
                     ┌──── IDE / 编辑器 ────┐
                     │  文件 create/rename/  │
                     │  delete/modify        │
                     └──────────┬────────────┘
                                │
                    POST /api/v1/file-changes
                                │
                                ▼
                   ┌────────────────────────┐
                   │  FileChangeDispatcher  │  fire-and-forget
                   └───────────┬────────────┘
                               │
                               ▼
              ┌──────────────────────────────┐
              │   FileChangeHandler          │
              │                              │
              │  renamed → ContentPatcher    │
              │  deleted → Gateway.submit()  │
              │  modified → needs-review     │
              └─────────┬────────────────────┘
                        │
        ┌───────────────┤
        │               │
  MCP rescan Step 4     │                   Agent evolve-check
        │               │                        │
        ▼               │                        │
  ┌──────────────────┐  │                        │
  │RelevanceAuditor  │  │                        │
  │ + EvolutionPolicy│  │                        │
  │   .classifyRelevance│                        │
  └─────────┬────────┘  │                        │
            │            │                        │
            └────────────┴────────────────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │  EvolutionGateway   │
                │  + EvolutionPolicy  │
                │    .shouldImmediate │
                │    .assessRisk      │
                └────────┬────────────┘
                         │
            ┌────────────┴──────────────┐
            │                            │
      shouldImmediate                 otherwise
      Execute = true                     │
            │                            ▼
            ▼                   ┌─────────────────┐
  ┌──────────────────┐         │ ProposalRepo     │
  │ LifecycleState   │         │ .create()        │
  │ Machine          │         │ expiresAt: 0     │
  │ .transition()    │         │ (信号驱动)        │
  │  → deprecated    │         └────────┬──────────┘
  │  (Guard+Entry+   │                  │
  │   Event+Signal)  │     ┌────────────┴──────────────┐
  └──────────────────┘     │                            │
                      手动 executeOne     信号驱动 #onSignal()
                           │         (guard/search/decay/
                           │          quality/usage/lifecycle)
                           └────────────┬──────────────┘
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │   ProposalExecutor       │
                           │   + EvolutionPolicy      │
                           │     .evaluateUpdate()    │
                           │     .evaluateDeprecate() │
                           └──────────┬───────────────┘
                                      │
                      ┌───────────────┤
                      │               │
                update 通过      deprecate 通过
                      │               │
                      ▼               ▼
           ┌──────────────┐  ┌──────────────────┐
           │ Lifecycle     │  │ LifecycleState   │
           │ StateMachine  │  │ Machine          │
           │ evolving →    │  │ → deprecated     │
           │   patch →     │  │   / decaying     │
           │   staging     │  │                  │
           └──────┬────────┘  └─────────┬────────┘
                  │                     │
                  └──────────┬──────────┘
                             │
                      ┌──────┴──────┐
                      │ 自动发射     │
                      │ lifecycle   │
                      │ signal     │
                      └─────────────┘
```

### 关键改进（vs 旧图）

1. **`LifecycleStateMachine` 是唯一的状态变更路径** — 无 bypass 箭头
2. **`EvolutionPolicy` 嵌入各调用点** — 决策逻辑可视化
3. **信号只从 StateMachine 发出** — 一个箭头，无散落
4. **无 `knowledgeRepo.updateLifecycle()` 直接调用** — 从图中消失
5. **Proposal 评估从时间驱动转为信号驱动** — `expiresAt: 0`，ProposalExecutor 订阅 SignalBus 实时响应考察信号

---

## 13. 状态机（保留）

### 13.1 Recipe Lifecycle 六态

```
                       ┌─────────────┐
                       │   pending   │  初始状态（所有新 Recipe）
                       └──────┬──────┘
                              │ confidence-route / grace-period-expire
                              ▼
                       ┌─────────────┐
                       │  staging    │  暂存期（7d grace period）
                       └──────┬──────┘
                              │ grace-period-expire / manual
                              ▼
                       ┌─────────────┐
                       │   active    │  稳态（可被搜索/Guard/Export 消费）
                       └──────┬──────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
            ┌────────────┐       ┌──────────┐
            │  evolving  │       │ decaying │
            │ (7d timeout│       │(30d grace│
            │  → active) │       │→ deprecated)
            └─────┬──────┘       └─────┬────┘
                  │                    │
                  │ patch → staging    │ 30d 超时 / 确认
                  │ fail → active      │
                  │                    ▼
                  │            ┌──────────────┐
                  └───────────→│ deprecated   │  终态
                               └──────┬───────┘
                                      │ resurrection
                                      ▼
                               ┌─────────────┐
                               │   pending   │
                               └─────────────┘
```

### 13.2 合法状态转移表

```
pending    → staging, active, deprecated
staging    → active, pending
active     → evolving, decaying, deprecated
evolving   → staging, active, decaying
decaying   → active, deprecated
deprecated → pending  (复活)
```

### 13.3 Proposal 五态

```
┌─────────┐  创建（低置信度 或 明确 pending）
│ pending │──────────────────────┐
└────┬────┘                     │ 14d 无操作
     │ startObserving()         │
     │ 或自动（高置信度）         ▼
     ▼                    ┌──────────┐
┌──────────┐              │ expired  │
│observing │              └──────────┘
└────┬─────┘
     │ expiresAt 到期 / executeOne()
     │
     ├─── 判据通过 ──→ ┌──────────┐
     │                 │ executed │
     │                 └──────────┘
     │
     └─── 判据不通过 ─→ ┌──────────┐
     │                 │ rejected │
     │                 └──────────┘
     │
     └─── 手动拒绝 ──→ ┌──────────┐
                       │ rejected │
                       └──────────┘
```

### 13.4 TransitionTrigger 枚举

```typescript
type TransitionTrigger =
  | 'confidence-route'        // 置信度路由（新 Recipe 分流）
  | 'grace-period-expire'     // Grace Period 到期
  | 'guard-conflict'          // Guard 冲突检测
  | 'proposal-execution'      // Proposal 执行
  | 'proposal-attach'         // Proposal 附着（evolving 入口）
  | 'content-patch-complete'  // ContentPatcher 完成
  | 'decay-detection'         // 衰退检测
  | 'manual-deprecation'      // 手动弃用
  | 'evolution-gateway'       // Gateway 立即执行
  | 'timeout-recovery'        // 超时恢复
  | 'evidence-recovery'       // 证据恢复（decaying → active）
  | 'resurrection';           // 复活（deprecated → pending）
```

---

## 14. 旧→新对照表

### 组件改名/替换

| 旧组件 | 新组件 | 变更类型 |
|--------|--------|---------|
| `RecipeLifecycleSupervisor` | `LifecycleStateMachine` | 重命名 + 必需化 |
| `ReactiveEvolutionService` | `FileChangeHandler` | 重命名 + 简化 |
| `RecipeRelevanceAuditor` | `RelevanceAuditor` | 简化名称 |
| _(分散在 4 文件)_ | `EvolutionPolicy` | **新增** |
| `EvolutionGateway` | `EvolutionGateway` | 简化（移除 bypass） |
| `ProposalExecutor` | `ProposalExecutor` | 简化（移除内联规则） |
| `ContentPatcher` | `ContentPatcher` | **保留不变** |
| `ProposalRepository` | `ProposalRepository` | 移出 `#resolveInitialStatus` |

### 方法迁移

| 旧方法/常量 | 旧位置 | 新位置 |
|------------|--------|--------|
| `resolveRiskTier()` | EvolutionGateway | `EvolutionPolicy.assessRisk()` |
| `OBSERVATION_WINDOWS` | EvolutionGateway | `EvolutionPolicy.observationWindow()` |
| `confidence >= 0.8 && source !== 'metabolism'` | EvolutionGateway | `EvolutionPolicy.shouldImmediateExecute()` |
| `#resolveInitialStatus()` | ProposalRepository | `EvolutionPolicy.resolveInitialStatus()` |
| `fpOk && hasUsage` | ProposalExecutor | `EvolutionPolicy.evaluateUpdate()` |
| `decayScore <= 19/40` | ProposalExecutor | `EvolutionPolicy.evaluateDeprecate()` |
| `PENDING_EXPIRY_DAYS = 14` | ProposalExecutor | `EvolutionPolicy.shouldExpirePending()` |
| `confidenceMap = { dead: 0.95, ... }` | RelevanceAuditor | `EvolutionPolicy.classifyRelevance()` |

### 删除项

| 被删除的代码 | 原因 |
|-------------|------|
| `#transitionRecipe()` in ProposalExecutor | bypass 模式，替换为直接调 `lifecycle.transition()` |
| `#restoreRecipe()` in ProposalExecutor | bypass 恢复逻辑，不再需要 |
| `#emitSignal()` in ProposalExecutor | 信号由 StateMachine 自动发射 |
| `#emitSignal()` in EvolutionGateway | 信号由 StateMachine 自动发射 |
| `#emitSignals()` in ReactiveEvolutionService (lifecycle 部分) | 信号由 StateMachine 自动发射 |
| Gateway L236-241 bypass 代码 | 不再存在绕过路径 |
| Executor L393-399 bypass 代码 | 不再存在绕过路径 |
| `resolveRiskTier()` compat 导出 | 零消费者，迁移到 `EvolutionPolicy.assessRisk()` |
| `HttpServer.#proposalCheckInterval` | 定时轮询移除，信号驱动替代 |
| `HttpServer.#startProposalCheckInterval()` | 定时轮询移除 |
| `HttpServer.#runProposalCheck()` | 定时轮询移除 |

---

## 15. 迁移路径

> **全部 Phase 已实施完毕** — tsc 0 错误，Biome 通过，1763/1763 测试通过。

### Phase 1: 新增 EvolutionPolicy ✅

1. ✅ 创建 `lib/domain/evolution/EvolutionPolicy.ts`
2. ✅ 编写纯函数，从旧代码中提取常量和逻辑
3. ✅ 添加单元测试 `test/unit/EvolutionPolicy.test.ts`（35 tests）

### Phase 2: LifecycleStateMachine 替代 Supervisor ✅

1. ✅ 创建 `lib/service/evolution/LifecycleStateMachine.ts`
   - 基于现有 `RecipeLifecycleSupervisor` 重构
   - 移除所有 `?? null`，依赖全部必需（4 个：knowledgeRepo, eventRepo, signalBus, proposalRepo）
2. ✅ 更新 DI 注册（KnowledgeModule）— `ct.get('signalBus')` 直接获取，无 fallback
3. ✅ 更新所有消费者：Gateway、Executor
4. ✅ 删除旧 `RecipeLifecycleSupervisor.ts`
5. ✅ 更新测试 `test/unit/lifecycle-supervisor.test.ts`（16 tests）

### Phase 3: Gateway / Executor 简化 ✅

1. ✅ Gateway: 移除 bypass，使用 `EvolutionPolicy` + `LifecycleStateMachine`
2. ✅ Executor: 移除内联规则，使用 `EvolutionPolicy` + `LifecycleStateMachine`
3. ✅ 移除所有 `signalBus` 依赖（由 StateMachine 内置）
4. ✅ 移除 `resolveRiskTier()` compat 导出（零消费者）

### Phase 4: 重命名 ✅

1. ✅ `ReactiveEvolutionService` → `FileChangeHandler`（compat re-export 保留）
2. ✅ `RecipeRelevanceAuditor` → `RelevanceAuditor`（compat re-export 保留）
3. ✅ 更新所有 import 路径和 DI 注册
4. ✅ 删除旧文件：`ReactiveEvolutionService.ts`、`RecipeRelevanceAuditor.ts`

### Phase 5: ProposalRepository 清理 ✅

1. ✅ `#resolveInitialStatus()` 替换为 `EvolutionPolicy.resolveInitialStatus()` 调用

### Phase B: 信号驱动转换 ✅

> 全面从时间驱动转为信号驱动

1. ✅ `HttpServer`: 移除 `#proposalCheckInterval`、`#startProposalCheckInterval()`、`#runProposalCheck()`
2. ✅ `ProposalExecutor`: 新增 `subscribeToSignals(signalBus)` + `#onSignal()` + `#evaluateOnSignal()`
3. ✅ `ProposalExecutor.checkAndExecute()`: 从"扫描过期"转为"启动时兜底清理"
4. ✅ `EvolutionGateway.#createProposal()`: `expiresAt: 0`（信号驱动，不设过期时间）
5. ✅ `UiStartupTasks`: Stage 6（启动兜底清理）+ Stage 7（SignalBus 订阅）
6. ✅ ProposalExecutor 测试更新（14 tests，使用 `setupObservingProposals` helper）

---

## 16. 涉及文件清单

### 新增

| 文件 | 职责 |
|------|------|
| `lib/domain/evolution/EvolutionPolicy.ts` | 进化决策规则集（纯函数） |
| `lib/service/evolution/LifecycleStateMachine.ts` | 唯一生命周期权威 |
| `test/unit/EvolutionPolicy.test.ts` | Policy 单元测试（35 tests） |

### 重构

| 文件 | 变更 |
|------|------|
| `lib/service/evolution/EvolutionGateway.ts` | 移除 bypass + supervisor → lifecycle |
| `lib/service/evolution/ProposalExecutor.ts` | 移除内联规则 + bypass → Policy + lifecycle |
| `lib/repository/evolution/ProposalRepository.ts` | `#resolveInitialStatus` → `EvolutionPolicy` |
| `lib/injection/modules/KnowledgeModule.ts` | DI 拓扑更新 |

### 重命名（已完成，旧文件已删除）

| 旧文件 | 新文件 | 状态 |
|--------|--------|------|
| `lib/service/evolution/ReactiveEvolutionService.ts` | `lib/service/evolution/FileChangeHandler.ts` | ✅ 已删除，compat re-export 在新文件中 |
| `lib/service/evolution/RecipeRelevanceAuditor.ts` | `lib/service/evolution/RelevanceAuditor.ts` | ✅ 已删除，compat re-export 在新文件中 |
| `lib/service/evolution/RecipeLifecycleSupervisor.ts` | `lib/service/evolution/LifecycleStateMachine.ts` | ✅ 已删除 |

### 保留不变

| 文件 | 说明 |
|------|------|
| `lib/domain/knowledge/Lifecycle.ts` | 六态定义 + 转移表 |
| `lib/service/evolution/ContentPatcher.ts` | 内容修补 |
| `lib/service/FileChangeDispatcher.ts` | Pub-Sub 分发器 |
| `lib/types/evolution.ts` | 类型定义 |
| `lib/types/reactive-evolution.ts` | 文件变更类型 |
| `lib/http/routes/file-changes.ts` | HTTP 端点 |
| `lib/http/routes/evolution.ts` | HTTP 端点 |
| `lib/repository/evolution/LifecycleEventRepository.ts` | 审计日志 |
| `lib/repository/evolution/WarningRepository.ts` | 告警 |
| `lib/repository/sourceref/RecipeSourceRefRepository.ts` | 文件映射 |
| `lib/repository/knowledge/KnowledgeEdgeRepository.ts` | 关系边 |
| `dashboard/src/api.ts` | 前端 API |
| `dashboard/src/types.ts` | 前端类型 |
| `dashboard/src/components/Views/EvolutionPanel.tsx` | Dashboard UI |
