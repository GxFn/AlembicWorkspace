# BudgetController — 预算与压缩管理系统重构设计

> 版本: v1.1 | 日期: 2026-05-03
> 前置: [token-budget-v2-design.md](./token-budget-v2-design.md)
> 动机: AgentRuntime.ts 已膨胀到 1600+ 行，预算/压缩逻辑散布在 5+ 个方法中，职责耦合严重

---

## 0. 问题诊断

### 0.1 现状：预算逻辑在 AgentRuntime 中的分布

```
AgentRuntime.ts (1624 行)
│
├── #checkSessionTokenBudget()     ← Session 预检 (700-756)
├── #estimateNextCallInputTokens() ← Token 估算 (764-787)
├── #prepareIteration()            ← 混合了压缩+nudge+toolChoice+动态上下文 (597-687)
├── #callLLM()                     ← 混合了 L4 compaction + TurnTelemetry (788-924)
├── #processToolCalls()            ← 混合了工具执行+并行预算分摊+limitToolResult (1051-1210)
├── #shouldExit()                  ← 混合了 policy check + session token 检查 (537-587)
├── tokenUsage (实例字段)           ← Session 累计值
└── _lastRoundInputTokens (ctx字段) ← 估算辅助
```

### 0.2 核心问题

| 问题 | 症状 | 根因 |
|------|------|------|
| **职责耦合** | AgentRuntime 同时处理 LLM 调用、工具执行、预算控制、压缩触发、遥测记录 | 预算逻辑没有独立的状态容器和决策接口 |
| **传递断层** | `computeAnalystBudget` 的 session 限额只传到 ExplorationTracker，未传到 reactLoop budget | Session 预算、Per-call 预算、Policy 预算三者独立，没有统一的 budget source of truth |
| **估算割裂** | `estimateFullContextTokens` 和 `_lastRoundInputTokens` 分散在不同模块 | 没有统一的 "下一轮消耗预测器" |
| **压缩分散** | `compactIfNeeded()` 在 `#prepareIteration` 和 `#checkSessionTokenBudget` 各调用一次，结果需要手动合并 | 压缩触发时机和压缩结果没有统一管理 |
| **遥测散落** | TurnTelemetry 是 `#callLLM` 中 30 行 inline 代码，无法复用/测试 | 遥测与 LLM 调用逻辑耦合 |

### 0.3 目标

1. **AgentRuntime 瘦身**: 从 1600+ 行降到 ~1100 行，移除 ~500 行预算/压缩/遥测代码
2. **单一职责**: 预算决策、压缩触发、遥测记录各自独立，通过清晰接口协作
3. **消除传递断层**: 统一的 budget source of truth，从入口到执行一路传递
4. **可测试**: 每个模块可独立单元测试，无需 mock 完整 AgentRuntime

---

## 1. 架构设计

### 1.1 模块拆分

```
lib/agent/runtime/
├── AgentRuntime.ts          ← 瘦身: 只做 ReAct loop + LLM 调用 + 工具执行
├── BudgetController.ts      ← 新增: 预算决策 + 压缩触发 + 遥测
├── TurnTelemetry.ts         ← 新增: 每轮 token 可观测性
├── ExitController.ts        ← 保持: 退出决策
├── LoopContext.ts            ← 精简: 移除 _pendingL4Compaction 等预算状态
└── ...
```

### 1.2 BudgetController 职责

```
BudgetController
│
├── 【预算决策】
│   ├── checkBeforeLLMCall()     → 'normal' | 'compress' | 'summarize'
│   ├── estimateNextCallTokens() → number
│   └── getSessionUsageRatio()   → number
│
├── 【压缩触发】
│   ├── runCompactionCycle()     → CompactionResult
│   ├── requestL4Compaction()    → void
│   └── executeL4IfPending()     → Promise<void>
│
├── 【遥测记录】
│   ├── recordTurn()             → void
│   └── getSessionSummary()      → SessionBudgetSummary
│
├── 【工具预算】
│   ├── getToolBudget(parallelCount) → { perToolMaxChars, perToolMaxMatches, roundMaxChars }
│   └── recordToolCharsUsed(chars)   → void
│
└── 【状态同步】
    ├── syncSessionPressure()    → void  (更新 ContextWindow.sessionPressure)
    └── syncForceTerminal()      → void  (触发 ExplorationTracker.forceTerminal)
```

### 1.3 数据流

```
                                      ┌────────────────────┐
   computeAnalystBudget ──────────┬──▶│  BudgetController   │
                                  │   │                    │
   ContextWindow.tokenBudget ─────┤   │  sessionBudget     │ ← single source of truth
                                  │   │  perCallBudget     │
   PolicyEngine.getBudget() ──────┘   │  lastRoundTokens   │
                                      │  cumulativeTokens   │
                                      │  pendingL4          │
                                      └──────┬─────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
          ContextWindow              ExplorationTracker          TurnTelemetry
          .setSessionPressure()      .forceTerminal()            .record()
          .compactIfNeeded()
          .compactL4()
```

---

## 2. 接口设计

### 2.1 BudgetController

```typescript
/** 可变引用 — BudgetController 直接读写此对象，跨 pipeline stage 共享 */
type TokenUsageAccumulator = {
  input: number;
  output: number;
  reasoning: number;
  cacheHit: number;
};

interface BudgetControllerConfig {
  /** Session 级 input token 总限额 (0 = 不限制，退化为 no-op) */
  maxSessionInputTokens: number;
  /** Session 级 total token 总限额 (input + output) */
  maxSessionTokens?: number;
  /**
   * AgentRuntime.tokenUsage 的引用（非拷贝！）。
   * 跨 pipeline stage 共享：analyze 写入的值，produce 可读到。
   */
  cumulativeUsage: TokenUsageAccumulator;
  /** ContextWindow 引用 (Per-call 压缩) */
  contextWindow: ContextWindow | null;
  /** ExplorationTracker 引用 (forceTerminal) */
  tracker: ExplorationTracker | null;
  /** Logger 实例 */
  logger: Logger;
}

interface PreLLMCheckResult {
  action: 'normal' | 'compress' | 'summarize';
  /** 预估的下一轮 input token */
  estimatedNextCallTokens: number;
  /** 当前 session 使用率 (0-1) */
  sessionUsageRatio: number;
  /** 压缩结果 (如果触发了压缩) */
  compaction: CompactionResult;
}

interface CompactionResult {
  level: number;     // 0-4
  removed: number;   // 被移除的条目数
}

interface ToolBudget {
  roundMaxChars: number;
  perToolMaxChars: number;
  perToolMaxMatches: number;
}

class BudgetController {
  constructor(config: BudgetControllerConfig);

  // ── 预算决策 ──

  /**
   * LLM 调用前的预算预检。
   *
   * 职责链:
   *   1. 估算下一轮 input token
   *   2. 计算 projected session 使用率
   *   3. 同步 sessionPressure 到 ContextWindow
   *   4. 按阈值决定动作 (normal/compress/summarize)
   *   5. 如果 compress: 触发 compaction cycle
   *   6. 如果 summarize: 触发 forceTerminal
   *
   * 阈值:
   *   - projected < 75%  → normal
   *   - 75% ≤ projected < 90% → compress
   *   - projected ≥ 90% → summarize
   */
  checkBeforeLLMCall(): PreLLMCheckResult;

  /** 获取当前 session 使用率 */
  get sessionUsageRatio(): number;

  /** 获取 session 预算是否已配置 */
  get hasSessionBudget(): boolean;

  // ── 压缩触发 ──

  /**
   * 执行压缩周期: compactIfNeeded + 可选的 L4 标记。
   *
   * 融合了之前 #prepareIteration 中的 compactIfNeeded()
   * 和 #checkSessionTokenBudget 中的二次压缩。
   */
  runCompactionCycle(): CompactionResult;

  /** 标记需要 L4 compaction (异步 LLM 摘要) */
  requestL4Compaction(): void;

  /** 执行挂起的 L4 compaction (在 LLM 调用前) */
  executeL4IfPending(aiProvider: AiProvider): Promise<CompactionResult>;

  // ── Token 追踪 ──

  /**
   * 记录本轮 LLM 返回的 token 使用情况。
   * 更新累计值、lastRoundInputTokens、cacheHit 追踪。
   */
  recordLLMUsage(usage: UnifiedTokenUsage): void;

  /** 获取累计 token 使用 */
  get cumulativeUsage(): CumulativeTokenUsage;

  // ── 工具预算 ──

  /**
   * 获取本轮工具调用的 token 预算。
   *
   * 并行工具共享 roundMaxChars 预算:
   *   roundMaxChars = baseQuota.maxChars × ceil(parallelCount / 2)
   *   perToolMaxChars = roundMaxChars / parallelCount
   */
  getToolBudget(parallelCount: number): ToolBudget;

  /**
   * 记录工具结果字符消耗 (用于剩余预算动态分摊)
   */
  recordToolCharsUsed(chars: number): void;

  /**
   * 获取当前剩余工具预算 (用于后续工具的 quota 计算)
   */
  getRemainingToolBudget(): { maxChars: number; maxMatches: number };

  // ── 遥测 ──

  /**
   * 记录并输出 TurnTelemetry。
   *
   * 在 #callLLM 的 token 累计之后调用，
   * 输出一行结构化日志。
   */
  emitTurnTelemetry(params: {
    iteration: number;
    compaction: CompactionResult;
  }): void;

  /** 获取 session 级遥测汇总 */
  getSessionSummary(): SessionBudgetSummary;
}
```

### 2.2 CumulativeTokenUsage

```typescript
interface CumulativeTokenUsage {
  input: number;
  output: number;
  reasoning: number;
  cacheHit: number;
}
```

### 2.3 SessionBudgetSummary

```typescript
interface SessionBudgetSummary {
  totalIterations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalReasoningTokens: number;
  avgCacheHitRate: number;
  peakSessionUsageRatio: number;
  maxCompactionLevel: number;
  totalCompactedItems: number;
  forcedSummarize: boolean;
}
```

---

## 3. AgentRuntime 重构后的调用流程

### 3.1 reactLoop 初始化

```typescript
// 当前 (AgentRuntime.#initLoop)
const budget = budgetOverride || this.policies.getBudget() || { ... };
// Session token 限额埋在 budget.maxSessionInputTokens 中
// 各处需要自己取值、自己计算

// 重构后
const budget = budgetOverride || this.policies.getBudget() || { ... };
const budgetCtrl = new BudgetController({
  maxSessionInputTokens: budget.maxSessionInputTokens || 0,
  maxSessionTokens: budget.maxSessionTokens,
  cumulativeUsage: this.tokenUsage,   // ← 引用！跨 stage 共享
  contextWindow: ctx.contextWindow,
  tracker: ctx.tracker,
  logger: this.logger,
});
ctx.budgetController = budgetCtrl;
```

### 3.2 每轮迭代

```typescript
// 当前 (复杂的 #prepareIteration + #checkSessionTokenBudget + #callLLM 交织)
const compactResult = messages.compactIfNeeded();
const sessionCompact = { level: 0, removed: 0 };
const tokenBudgetAction = this.#checkSessionTokenBudget(ctx, sessionCompact);
// ... 手动合并 compactResult 和 sessionCompact ...
// ... #callLLM 中: if (ctx._pendingL4Compaction) { ... } ...
// ... #callLLM 中: 30 行 TurnTelemetry 代码 ...

// 重构后
const budgetCtrl = ctx.budgetController!;

// Step 1: L4 compaction (如果上一轮标记了)
await budgetCtrl.executeL4IfPending(this.aiProvider);

// Step 2: 常规压缩 + session 预检 (一个调用搞定)
const preLLMCheck = budgetCtrl.checkBeforeLLMCall();

// Step 3: 根据结果设置 toolChoice
if (preLLMCheck.action === 'summarize') {
  toolChoice = 'none';
}

// Step 4: 调用 LLM
const llmResult = await this.#callLLM(ctx, toolChoice, ...);

// Step 5: 记录 usage + 输出遥测 (一个调用搞定)
if (llmResult?.usage) {
  budgetCtrl.recordLLMUsage(llmResult.usage);
  budgetCtrl.emitTurnTelemetry({
    iteration: ctx.iteration,
    compaction: preLLMCheck.compaction,
  });
}
```

### 3.3 工具执行

```typescript
// 当前 (30+ 行预算计算逻辑散落在 #processToolCalls 中)
const baseQuota = messages.getToolResultQuota();
const roundMaxChars = baseQuota.maxChars * Math.ceil(activeCalls.length / 2);
const perToolMaxChars = Math.max(400, Math.floor(roundMaxChars / activeCalls.length));
const perToolMaxMatches = Math.max(2, ...);
let roundCharsUsed = 0;
// ... 循环中: const remainingBudget = Math.max(400, roundMaxChars - roundCharsUsed) ...

// 重构后
const budgetCtrl = ctx.budgetController!;
const toolBudget = budgetCtrl.getToolBudget(activeCalls.length);

for (const fc of activeCalls) {
  // ... 工具执行 ...
  const remaining = budgetCtrl.getRemainingToolBudget();
  const resultStr = limitToolResult(fc.name, rawForLimit, {
    maxChars: Math.min(toolBudget.perToolMaxChars, remaining.maxChars),
    maxMatches: toolBudget.perToolMaxMatches,
  });
  budgetCtrl.recordToolCharsUsed(resultStr.length);
  messages.appendToolResult(fc.id, fc.name, resultStr);
}
```

---

## 4. 代码删减分析

### 4.1 从 AgentRuntime 移除的代码

| 方法/逻辑 | 行数 | 迁移去向 |
|-----------|------|---------|
| `#checkSessionTokenBudget()` | ~57 行 | `BudgetController.checkBeforeLLMCall()` |
| `#estimateNextCallInputTokens()` | ~24 行 | `BudgetController` 内部方法 |
| TurnTelemetry 代码块 (在 `#callLLM`) | ~30 行 | `BudgetController.emitTurnTelemetry()` |
| L4 compaction 触发 (在 `#callLLM`) | ~14 行 | `BudgetController.executeL4IfPending()` |
| 并行工具预算计算 (在 `#processToolCalls`) | ~12 行 | `BudgetController.getToolBudget()` |
| `_pendingL4Compaction` 状态管理 | ~8 行 | `BudgetController` 内部状态 |
| `_lastRoundInputTokens` 追踪 | ~5 行 | `BudgetController.recordLLMUsage()` |
| `_consecutiveZeroCacheHits` 追踪 | ~10 行 | `BudgetController.emitTurnTelemetry()` |
| 压缩结果合并逻辑 | ~8 行 | `BudgetController.runCompactionCycle()` |
| **合计** | **~168 行** | |

### 4.2 从 LoopContext 移除的字段

```typescript
// 删除:
_pendingL4Compaction: boolean;
_consecutiveZeroCacheHits: number;
_lastRoundInputTokens: number;

// 新增:
budgetController: BudgetController | null;
```

---

## 5. 关键设计决策

### 5.1 为什么不把 ContextWindow 的压缩逻辑也抽到 BudgetController？

**结论: 不抽。** ContextWindow 的 L1-L3 压缩是 **per-call** 级别的消息管理，语义上属于 "上下文窗口的自我管理"，不应该暴露给外层。BudgetController 只负责 **何时触发** 压缩（通过调用 `contextWindow.compactIfNeeded()`），不负责 **怎么压缩**。

```
BudgetController           ContextWindow
    │                          │
    │  compactIfNeeded() ──▶   │  L1: 截断旧 tool results
    │                          │  L2: 摘要历史轮次
    │  ◀── { level, removed }  │  L3: 仅保留 prompt + 最后 1 轮
    │                          │
    │  compactL4(ai) ──────▶   │  L4: LLM 摘要压缩 (异步)
    │                          │
```

### 5.2 Session 预算的 source of truth

**当前问题**: `maxSessionInputTokens` 有三个来源:
1. `BudgetPolicy`（preset 编译时的静态值 — 已移除）
2. `computeAnalystBudget`（运行时动态计算 — 通过 `_computedBudget` 传递）
3. `LoopContext.budget`（reactLoop 的合并值）

**重构后**: BudgetController 在构造时接收 `maxSessionInputTokens`，作为 **唯一的 session 预算 source of truth**。所有预算决策都从 BudgetController 获取。

```
computeAnalystBudget(fileCount, cwBudget)
    │
    ├──▶ ExplorationTracker (iteration control)
    │
    └──▶ _computedBudget (via strategyContext)
          │
          └──▶ PipelineStrategy → budgetOverride → reactLoop
                │
                └──▶ BudgetController({ maxSessionInputTokens })
                      │
                      ├── checkBeforeLLMCall()   ← 用这个值
                      ├── emitTurnTelemetry()    ← 用这个值
                      └── getSessionUsageRatio() ← 用这个值
```

### 5.3 BudgetController 生命周期与作用域

#### 5.3.1 执行拓扑（必须理解）

```
AgentService.run(bootstrapSessionInput)
  │
  └──▶ AgentRunCoordinator.run()
        │  （为每个 dimension 分派 childInput）
        │
        ├──▶ AgentService.run(dimension-A)        ← 新 AgentRuntime ①
        │     │  tokenUsage 在 execute() 入口重置
        │     └──▶ runtime.execute(message)
        │           └──▶ PipelineStrategy.execute()
        │                 ├── runtime.reactLoop() [analyze]  ← BudgetController A-analyze
        │                 │     tokenUsage 跨 stage 累积 ────┐
        │                 ├── [quality_gate]                   │
        │                 ├── runtime.reactLoop() [produce]  ← BudgetController A-produce
        │                 │     共享 runtime.tokenUsage ◀─────┘
        │                 └── [rejection_gate]
        │
        ├──▶ AgentService.run(dimension-B)        ← 新 AgentRuntime ②
        │     tokenUsage 独立，与 A 无关
        │
        └──▶ ... (并发 concurrency=3, tiered 执行)
```

**关键事实**:
1. **每个维度创建独立的 AgentRuntime**（`AgentService.run → runtimeBuilder.build`），`tokenUsage` 在 `execute()` 入口重置
2. **同一维度内的 Pipeline 阶段（analyze → produce）共享 `runtime.tokenUsage`**
3. **跨维度完全隔离** — 维度 A 的 token 消耗不影响维度 B 的预算
4. **Tier 调度** — `AgentRunCoordinator` 按 tier 分组，同 tier 内并发，tier 间串行

#### 5.3.2 BudgetController 作用域：Per-ReactLoop + 共享累计

BudgetController **每次 `reactLoop` 新建一个**，但必须引用 **AgentRuntime 级别的 `tokenUsage`**（跨 stage 累积）：

```typescript
// #initLoop 中创建
const budgetCtrl = new BudgetController({
  maxSessionInputTokens: budget.maxSessionInputTokens || 0,
  cumulativeUsage: this.tokenUsage,   // ← 引用，非拷贝！跨 stage 共享
  contextWindow: ctx.contextWindow,   // ← 当前 stage 的 ContextWindow
  tracker: ctx.tracker,               // ← 当前 stage 的 tracker
  logger: this.logger,
});
```

- **创建**: `reactLoop.#initLoop()` 中创建，绑定到 `LoopContext`
- **累计**: `recordLLMUsage()` 同时更新 `this.cumulativeUsage`（共享引用）和内部 per-loop 计数
- **stage 切换**: produce 阶段新建 BudgetController 时，`this.tokenUsage` 已包含 analyze 阶段的消耗
- **销毁**: reactLoop 结束时随 LoopContext 一起 GC

### 5.4 为什么把 TurnTelemetry 放在 BudgetController 而非独立模块？

TurnTelemetry 的所有输入数据（token counts、cache hit、compaction level、session usage）都来自 BudgetController 的内部状态。独立模块需要大量参数传递，而内聚到 BudgetController 中只需读取自身字段。

**权衡**: 如果未来 TurnTelemetry 需要收集非预算相关数据（如工具调用时间、LLM 延迟），再抽出独立模块。当前所有遥测字段都与预算相关。

### 5.5 与 ExitController 的关系

ExitController 管理 **退出决策**（何时终止 loop），BudgetController 管理 **预算决策**（压缩/降级/工具配额）。两者互补:

```
每轮迭代:
  ExitController.checkBeforeIteration()   → 是否应该退出？
  BudgetController.checkBeforeLLMCall()   → 本轮应该怎么调配预算？
```

BudgetController 的 `summarize` 动作会触发 `tracker.forceTerminal()`，这是对 ExitController 的 **间接** 协作 — ExitController 下一轮会看到 tracker 已进入终结阶段。

BudgetPolicy 不再设置 session token 限制（已在本次修复中移除），因此 ExitController 的 P3 policy check 不会因 token 触发 stop。Session token 管控完全由 BudgetController 统一处理。

### 5.6 全场景覆盖分析

#### 场景 1: 增量扫描（insight preset, pipeline strategy）

```
维度: design-patterns, error-resilience, ... (TierScheduler 编排)
每个维度: analyze → quality_gate → produce → rejection_gate
```

- **analyze 阶段**: BudgetController 活跃，`maxSessionInputTokens` 来自 `computeAnalystBudget(fileCount, 48000)`
- **produce 阶段**: 新建 BudgetController，继承 analyze 的 `cumulativeUsage`。produce 通常轮次少（~6），但 session 预算继续消耗
- **跨阶段**: 如果 analyze 消耗了 session 预算的 70%，produce 只剩 30% 可用 — **这是正确的行为**

#### 场景 2: 冷启动（insight preset, 同上）

与增量扫描完全相同的执行链路。唯一差异是 `rescanContext` 为 null，不影响预算逻辑。

#### 场景 3: 对话模式（chat/lark preset, single strategy）

- BudgetPolicy 无 `maxSessionInputTokens`
- BudgetController 构造时 `maxSessionInputTokens = 0`
- `hasSessionBudget` = false → `checkBeforeLLMCall()` 直接返回 `normal`
- **完全退化为 no-op**，不影响对话模式的现有行为

#### 场景 4: 进化审计（evolution preset, pipeline strategy）

- BudgetPolicy 无 `maxSessionInputTokens`（16 轮 / 180s timeout）
- `strategyContext._computedBudget` 未设置（不经过 `BootstrapDimensionRuntimeBuilder`）
- BudgetController 退化为 no-op
- 预算控制由 BudgetPolicy 的 `maxIterations=16` 和 `timeoutMs=180_000` 处理

#### 场景 5: ForcedSummary（循环退出后）

`produceForcedSummary` 在 reactLoop 结束后、`#finalize` 中调用，产生额外的 LLM 调用:

```typescript
// AgentRuntime.#finalize 中:
this.tokenUsage.input += forcedResult.tokenUsage.input || 0;
```

- ForcedSummary 的 token **计入 `runtime.tokenUsage`**（影响 AgentService 返回的 usage 统计）
- **不需要 BudgetController 参与** — 此时 reactLoop 已结束，无预算决策可做
- BudgetController 的 `getSessionSummary()` 不含 ForcedSummary 消耗 — 可接受，因为它是 loop 外的一次性调用

#### 场景 6: compactL4（循环内，#callLLM 中）

`compactL4` 在 reactLoop 内的 `#callLLM` 开头执行，产生额外的 LLM 调用:

```typescript
this.tokenUsage.input += usage.inputTokens || 0;
ctx.addTokenUsage({ inputTokens: usage.inputTokens, ... });
```

- L4 compaction 的 token **计入 `cumulativeUsage`**（通过 `this.tokenUsage` 引用）
- BudgetController 的 `executeL4IfPending()` 执行后应更新 `cumulativeUsage` — **需要在实现中确保**
- 下一轮 `checkBeforeLLMCall()` 会看到 L4 的消耗

#### 场景 7: 并发多维度（concurrency=3）

多个维度同时运行，各自独立的 AgentRuntime + BudgetController:
- **互不影响** — 每个维度有自己的 session budget
- **总费用** = Σ(每维度的 token 消耗) — 在 SessionStore 层面汇总

### 5.7 不适用 BudgetController 的场景

| 场景 | 原因 | 现有控制方式 |
|------|------|------------|
| chat/lark preset | 无 session token 限制 | BudgetPolicy.maxIterations + timeoutMs |
| evolution preset | 短轮次、无 session 限制 | BudgetPolicy.maxIterations=16, timeoutMs=180s |
| remote-operation preset | 极短轮次 | BudgetPolicy.maxIterations=6, timeoutMs=60s |

BudgetController 在这些场景下 `hasSessionBudget=false`，所有方法退化为 no-op 或直接返回默认值，**零性能开销**。

---

## 6. 实施计划

### Phase 1: 创建 BudgetController 骨架

1. 创建 `lib/agent/runtime/BudgetController.ts`
2. 实现核心接口: `checkBeforeLLMCall()`, `recordLLMUsage()`, `emitTurnTelemetry()`
3. 将 `#checkSessionTokenBudget` + `#estimateNextCallInputTokens` 逻辑迁移过来
4. 单元测试覆盖

### Phase 2: 集成到 AgentRuntime

1. `#initLoop` 中创建 BudgetController，存入 LoopContext
2. `#prepareIteration` 使用 `budgetCtrl.checkBeforeLLMCall()` 替代内联逻辑
3. `#callLLM` 使用 `budgetCtrl.recordLLMUsage()` + `budgetCtrl.emitTurnTelemetry()`
4. `#callLLM` 使用 `budgetCtrl.executeL4IfPending()` 替代 `_pendingL4Compaction` 判断

### Phase 3: 工具预算迁移

1. `#processToolCalls` 使用 `budgetCtrl.getToolBudget()` 替代内联计算
2. 引入 `recordToolCharsUsed()` + `getRemainingToolBudget()` 替代 `roundCharsUsed` 局部变量

### Phase 4: 清理

1. 从 LoopContext 移除 `_pendingL4Compaction`, `_consecutiveZeroCacheHits`, `_lastRoundInputTokens`
2. 从 AgentRuntime 移除 `#checkSessionTokenBudget`, `#estimateNextCallInputTokens`
3. 确保所有测试通过
4. 更新 `token-budget-v2-design.md` 的架构映射表


---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 重构引入回归 bug | 中 | 高 | 逐 Phase 实施，每步运行完整测试 |
| ContextWindow 和 BudgetController 循环依赖 | 低 | 中 | BudgetController 单向引用 ContextWindow |
| Pipeline 多阶段：produce 的 BudgetController 不知道 analyze 消耗 | 中 | 高 | `cumulativeUsage` 使用 `runtime.tokenUsage` 引用（跨 stage 共享），单测验证 |
| TurnTelemetry 未来需要收集更多非预算数据 | 中 | 低 | 当前内聚设计 + 接口预留，需要时抽出 |
| cumulativeUsage 引用被意外拷贝而非共享 | 低 | 高 | 构造参数类型为 `TokenUsageAccumulator`（引用语义），单测验证跨 stage 累积 |
| L4 compaction token 未回写 cumulativeUsage | 中 | 中 | `executeL4IfPending()` 内部必须更新 `cumulativeUsage`，单测覆盖 |
| ForcedSummary token 不在 BudgetController 统计范围 | 低 | 低 | 可接受 — ForcedSummary 在 loop 外执行，无预算决策意义 |

---

## 8. 验证清单

### 8.1 基础验证
- [ ] AgentRuntime.ts 行数 < 1200
- [ ] BudgetController 100% 覆盖: checkBeforeLLMCall 的三个分支、工具预算分摊、TurnTelemetry
- [ ] TurnTelemetry 输出格式不变（向后兼容日志解析）
- [ ] 所有现有测试通过（AgentRuntime, ExitController, StrategyPolicy, ReasoningLayer）

### 8.2 增量扫描链路验证（insight preset, pipeline strategy）
- [ ] analyze 阶段: session 预算使用正确的 `computeAnalystBudget` 动态值
- [ ] produce 阶段: BudgetController 看到 analyze 阶段的累积 token（跨 stage 验证）
- [ ] 压缩在 75% 阈值正确触发
- [ ] SUMMARIZE 在 90% 阈值正确触发
- [ ] Cache hit rate 在 SUMMARIZE 阶段保持 >50%

### 8.3 多维度/并发验证
- [ ] 维度 A 和维度 B 的 BudgetController 完全独立（不互相影响）
- [ ] 同一 tier 内多维度并发运行时无共享状态冲突

### 8.4 非 insight preset 验证
- [ ] chat/lark preset: BudgetController 退化为 no-op，不影响对话行为
- [ ] evolution preset: BudgetController 退化为 no-op，进化审计正常运行

### 8.5 边界场景验证
- [ ] L4 compaction token 正确回写 cumulativeUsage
- [ ] ForcedSummary 后 runtime.tokenUsage 包含 ForcedSummary 消耗（即使 BudgetController 不跟踪）
- [ ] `maxSessionInputTokens = 0` 时所有方法安全退化为 no-op
