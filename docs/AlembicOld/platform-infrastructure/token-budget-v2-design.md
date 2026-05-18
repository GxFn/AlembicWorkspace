# Token 预算管理体系 v2 — 统一设计

> 版本: v2.0 | 日期: 2026-05-03
> 前置: [token-budget-system.md](./token-budget-system.md) — v1 诊断与修复记录

## 0. 设计目标

1. **消除二次增长**: agent loop 的 session token 消耗从 O(N²) 降到接近 O(N)
2. **预算可预测**: 给定 maxIterations，session 总 token 消耗可在 ±20% 内预估
3. **优雅降级**: 接近预算上限时渐进压缩，而非硬杀丢失已有分析
4. **利用供应商缓存**: 最大化 prompt cache hit rate，降低实际费用
5. **可观测性**: 每轮 token 消耗按来源（system/history/tools/reasoning）拆分上报

---

## 1. 业界最佳实践综述

### 1.1 核心共识

| 来源 | 核心观点 |
|------|---------|
| [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 上下文是有限注意力预算，必须精选高信号 token；推荐 compaction + structured note-taking |
| [Augment Code: Agent Loop Token Costs](https://www.augmentcode.com/guides/ai-agent-loop-token-cost-context-constraints) | 朴素 agent loop token 增长是二次的；5 种模式: scope limiting / state reset / coordinator-specialist / context trimming / conversation summarization |
| [Token Budget Strategies (Tianpan)](https://tianpan.co/blog/2025-10-20-token-budget-strategies-llm-production) | 60-70% 容量利用率时性能开始退化（context rot）；定义 Protected/High/Medium/Low 四级内容优先级 |
| [Waxell: $47,000 Agent Loop](https://waxell.ai/blog/ai-agent-token-budget-enforcement) | 预算必须是 enforcement 而非 alert；per-session hard ceiling + pre-call check |
| [AgentBudget SDK](https://github.com/AgentBudget/agentbudget) | soft limit (90%) + hard limit + loop detection 三级保护; finalization_reserve 为最终响应预留 |
| [ACON (Agent Context Optimization)](https://agentmarketcap.ai/blog/2026/04/08/agent-context-window-cost-optimization-2026) | 失败驱动的压缩优化: peak token 减少 26-54%，保持 95%+ 准确率 |
| [clawRxiv: Long-Context Prediction](https://www.clawrxiv.io/abs/2603.00054) | Budgeted Memory 模式: 按 tier 分配固定 token budget, 每步 LLM 调用前强制执行 |

### 1.2 供应商缓存机制对比

| 供应商 | 机制 | 触发条件 | 费用折扣 | API 字段 |
|--------|------|---------|---------|---------|
| **OpenAI** | Automatic prefix caching | ≥1024 token prompt, 前缀匹配 | input 减 50-90% | `usage.prompt_tokens_details.cached_tokens` |
| **DeepSeek** | Context Caching on Disk | 前缀完全匹配, 自动 | cache hit $0.0028/M vs miss $0.14/M (flash) — **50x 差异** | `prompt_cache_hit_tokens`, `prompt_cache_miss_tokens` |
| **Google Gemini** | Implicit (≥2.5) + Explicit | ≥1024 token, 前缀匹配 (implicit) | 90% discount | `usage_metadata.cached_content_token_count` |
| **Anthropic Claude** | Server-side compaction | 配置 trigger threshold | 自动压缩而非缓存 | `compact_20260112` block |

**关键洞察**: 所有供应商都支持 **前缀缓存** — 保持 system prompt + tool schemas **不变**且位于消息前部，即可获得 50-90% 的 input token 费用折扣。

### 1.3 Claude 的 thinking block 处理

Claude API 对 **前一轮的 thinking/reasoning blocks 自动从上下文窗口计算中排除**:

```
context_window = (input_tokens - previous_thinking_tokens) + current_turn_tokens
```

**启示**: DeepSeek V4 的 `reasoningContent` 也应该在压缩时被清理，因为它等价于 Claude 的 thinking block — 对后续推理无价值但占用大量 token。当前 Alembic 已实现此优化（Fix 4）。

---

## 2. 统一预算模型

### 2.1 三维预算空间

```
                    ┌─────────────────────────┐
                    │   Session Budget        │ ← 总量 ceiling
                    │   (BudgetPolicy)        │    per-session hard limit
                    │   maxSessionInputTokens │    + soft limit (85%)
                    └─────────┬───────────────┘
                              │
                    ┌─────────▼───────────────┐
                    │   Per-Call Budget        │ ← 单次 LLM 调用
                    │   (ContextWindow)       │    tokenBudget → compaction
                    │   + Cache Optimization   │    利用前缀缓存
                    └─────────┬───────────────┘
                              │
                    ┌─────────▼───────────────┐
                    │   Per-Tool Budget        │ ← 工具输出
                    │   (ToolResultQuota)      │    动态 quota
                    │   + OutputCompressor     │    session pressure 联动
                    └─────────────────────────┘
```

### 2.2 Session Budget 计算公式

**旧公式**（错误）:
```
maxSessionInputTokens = maxIterations × 3500  ← 假设偏差 13.7x
```

**新公式**:
```
maxSessionInputTokens = maxIterations × contextWindowBudget × avgUsageRatio

其中:
  contextWindowBudget = ContextWindow.resolveTokenBudget(model, {isSystem: true})
  avgUsageRatio = 0.6  (早期轮次 ~40%, 后期 ~70%, 加权平均)
```

**带缓存折扣的实际费用估算**:
```
estimatedCost = Σ(每轮 inputTokens) × (1 - cacheHitRate) × inputPrice
             + Σ(每轮 inputTokens) × cacheHitRate × cachedPrice
             + Σ(每轮 outputTokens) × outputPrice

典型场景 (DeepSeek V4, 24轮):
  session input ≈ 24 × 48000 × 0.6 = 691,200 token
  cache hit rate ≈ 70% (system prompt + tool schema + 稳定前缀)
  actual billable ≈ 691,200 × 0.3 × $0.14/M + 691,200 × 0.7 × $0.0028/M
                  = $0.029 + $0.0014 = $0.03/session
```

### 2.3 预算阶梯（Budget Tiers）

借鉴 Tianpan 的四级优先级和 AgentBudget 的三级保护:

| 消耗比例 | 状态 | 动作 |
|----------|------|------|
| 0-50% | 🟢 Normal | 全量工具输出 (maxChars=6000) |
| 50-70% | 🟡 Elevated | 降档工具输出 (maxChars=3000), 开始 L1 压缩 |
| 70-85% | 🟠 High | 降档工具输出 (maxChars=1500), L1+L2 压缩, reasoning 清理 |
| 85-95% | 🔴 Critical | 最低工具输出 (maxChars=800), L3+L4 压缩, session pressure 联动 |
| >95% | ⛔ Exhausted | 强制 SUMMARIZE + toolChoice=none, 一轮 grace 后退出 |

### 2.4 内容优先级（Protected → Evictable）

```
Protected (永不删除):
  ├── messages[0]: 原始 user prompt
  ├── system prompt (放在消息列表最前，利用 prefix cache)
  └── tool schemas (保持不变，利用 prefix cache)

High Priority (最后压缩):
  ├── 最近 2 轮的完整消息 (assistant + tool results)
  └── 当前计划状态 (plan steps)

Medium Priority (按需压缩):
  ├── 3-5 轮前的消息 (tool results 截断到 500 chars, reasoning 清理)
  └── 搜索/读取结果摘要

Low Priority (优先清除):
  ├── 5+ 轮前的消息 (L3 collapse → 合成摘要)
  ├── 历史 reasoningContent (全部清理)
  └── 重复的 submit/nudge 消息
```

---

## 3. 上下文工程优化

### 3.1 前缀缓存最大化

**原则**: 所有供应商的 prompt cache 都基于**前缀匹配**。消息结构应该是:

```
┌────────────────────────────────────────┐
│ 1. System Prompt (固定)                │ ← Cache 命中区
│ 2. Tool Schemas (固定顺序、固定内容)    │ ← Cache 命中区
│ 3. Compaction Summary (稳定)           │ ← 多数情况 Cache 命中
├────────────────────────────────────────┤
│ 4. 近期消息 (每轮变化)                  │ ← Cache miss，但体积受控
│ 5. 当前 user prompt / nudge           │ ← Cache miss
└────────────────────────────────────────┘
```

**Alembic 当前问题**: system prompt 通过 `effectiveSystemPrompt` 动态拼接 phase context 和 memory prompt，每轮可能不同，**破坏前缀缓存**。

**优化方案**:
- 把 phase context 和 memory prompt 从 system prompt 分离出来，作为 user message 追加到消息列表末尾
- system prompt 保持完全静态
- 预期 cache hit rate 从 ~30% 提升到 ~70%+

### 3.2 工具输出卸载到文件系统

借鉴 Manus AI 的做法 — 大型工具输出（文件内容、搜索结果）不直接放入上下文，而是写入文件系统，只在消息中保留引用路径:

```
传统方式:
  tool result: "1|import React...\n2|const App = () => {...\n...500 行内容"  ← 6000 chars

卸载方式:
  tool result: "✓ Read src/App.tsx (500 lines, 12,340 chars) → .alembic/cache/read_abc123.txt"  ← 80 chars
  agent 需要时: 调用 code.read 重新获取（大概率 DeltaCache 命中 → [unchanged]）
```

**效果**: 工具结果从 ~1700 token/call 降到 ~25 token/call，8 个并行调用从 ~13,700 token 降到 ~200 token。

**权衡**: agent 可能需要额外一次工具调用来重新获取文件内容。但 DeltaCache 会返回 `[unchanged]`，只需 5 token。

### 3.3 Thinking/Reasoning 管理

| 供应商 | 处理方式 | Alembic 策略 |
|--------|---------|-------------|
| Claude | 前一轮 thinking 自动从上下文排除 | 不需要处理 |
| DeepSeek V4 | API 要求带 toolCalls 的 assistant 消息保留 reasoning_content 字段 | Transport 层投影 (`DeepSeekTransport.#projectV4Reasoning`): 只保留最近 2 轮 tool-call assistant 的完整 reasoning，更早的设为空字符串 |
| OpenAI o1/o3/o4 | reasoning_tokens 单独计费，不在 messages 中 | 不需要处理 |
| Gemini | thoughts_token_count 单独统计 | 不需要处理 |

> **设计决策**: reasoning 管理职责下沉到 Transport 层而非 ContextWindow，保持 ContextWindow 供应商无关。`ContextWindow.estimateTokens()` 通过 `#findRecentToolCallIndices(2)` 模拟 Transport 层的投影行为以保持估算精度。

---

## 4. Token 可观测性系统

### 4.1 Per-Turn Telemetry

每轮 LLM 调用后记录:

```typescript
interface TurnTelemetry {
  iteration: number;
  phase: string;

  // 供应商报告的实际 token
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cachedTokens: number;

  // 本地估算的 token 来源分解
  breakdown: {
    systemPrompt: number;     // estimateTokensFast(systemPrompt)
    toolSchemas: number;      // toolSchemaCount × 100
    historyMessages: number;  // 压缩后历史消息
    recentMessages: number;   // 最近 2 轮完整消息
    reasoningContent: number; // 历史 reasoningContent (应为 0, 验证清理是否生效)
    toolResults: number;      // 本轮追加的工具结果
    nudges: number;           // nudge 消息
  };

  // 压缩状态
  compaction: {
    level: number;            // 最高触发的压缩级别 (0-4)
    removed: number;          // 本轮压缩移除的条目数
    contextUsageRatio: number; // ContextWindow 内部 usage ratio
    sessionUsageRatio: number; // session 级 usage ratio
  };

  // 费用估算
  estimatedCost: {
    inputCost: number;        // (inputTokens - cachedTokens) × missPrice + cachedTokens × hitPrice
    outputCost: number;       // outputTokens × outputPrice
    totalCost: number;
  };
}
```

### 4.2 告警阈值

| 指标 | 阈值 | 动作 |
|------|------|------|
| 单轮 inputTokens > contextWindowBudget × 0.9 | ⚠️ | 日志警告，检查 compaction 是否失效 |
| session 累计 > maxSessionInputTokens × 0.7 | 📊 | 记录 breakdown，标记 elevated |
| 连续 3 轮 cachedTokens = 0 | ⚠️ | 检查 system prompt 是否被修改 |
| 单轮工具结果总字符 > 30,000 | ⚠️ | 检查 limitToolResult 是否失效 |
| session 实际消耗 > 估算值 × 2 | 🚨 | 检查 token 估算精度 |

---

## 5. 实施路线图

### Phase 0: 已完成 ✅

- [x] Fix 1: maxSessionInputTokens 动态计算
- [x] Fix 2: LLM 调用前 session 预检
- [x] Fix 3: ExitController 优雅降级
- [x] Fix 4: reasoningContent 渐进清理
- [x] Fix 5: limitToolResult V2 纯文本识别
- [x] Fix 6: L4 compaction 激活
- [x] Fix 7: session pressure 联动工具配额

### Phase 1: 前缀缓存优化

- [x] **P1-1**: system prompt 静态化 ✅
  - 将 phase context / memory prompt 从 system prompt 分离到 ephemeral user message
  - `#prepareIteration` 返回 `dynamicContext`, `#callLLM` 将其作为临时消息注入（不存入 ContextWindow）
  - system prompt 在整个 session 内完全不变，最大化 prefix cache 命中
  - 文件: `AgentRuntime.ts` `#prepareIteration`, `#callLLM`

- [ ] **P1-2**: tool schema 稳定化
  - 确保 tool schemas 在整个 session 内顺序和内容不变
  - 文件: `LoopContext.ts` toolSchemas 构建逻辑

- [x] **P1-3**: cache hit rate 追踪 ✅
  - TurnTelemetry 每轮日志记录 cache hit tokens 和命中率
  - 连续 3 轮 cache hit = 0 时输出告警
  - 文件: `AgentRuntime.ts` `#callLLM`

### Phase 2: 工具输出优化

- [ ] **P2-1**: 工具结果摘要模式
  - code.read 返回摘要引用而非完整内容（agent 需要时可重新获取）
  - 配置开关: `ctx.toolOutputMode: 'full' | 'summary'`
  - 文件: `lib/tools/v2/handlers/code.ts`

- [x] **P2-2**: 并行工具调用的 token 预算分配 ✅
  - 并行调用共享 `roundMaxChars` 预算（而非每个独立获取 maxChars）
  - `roundMaxChars = baseQuota.maxChars × ceil(N/2)`, 每个工具分得 `roundMaxChars / N`
  - 剩余预算动态追踪: 后续工具自动获得前面节省下来的份额
  - 文件: `AgentRuntime.ts` `#processToolCalls`

### Phase 3: 可观测性

- [x] **P3-1**: TurnTelemetry 采集 ✅
  - 每轮记录: input/output/reasoning/cache tokens + cache hit rate + compaction level + session usage ratio
  - 告警: 连续 3 轮无 cache hit
  - 文件: `AgentRuntime.ts` `#callLLM`

- [ ] **P3-2**: Session 总结报告
  - session 结束时输出 token 消耗曲线、cache hit rate、各阶段 breakdown
  - 集成到 PipelineStrategy 返回值

### Phase 4: 高级压缩

- [ ] **P4-1**: 自适应压缩间隔
  - 借鉴 ACON 的失败驱动优化: 如果压缩后 LLM 回答质量下降，调整压缩策略
  - 文件: `ContextWindow.ts`

- [ ] **P4-2**: 结构化笔记 (Structured Note-Taking)
  - 借鉴 Anthropic 推荐: agent 定期将关键发现写入外部存储
  - 压缩时用笔记替代完整消息历史
  - 与现有 MemoryCoordinator 集成

---

## 6. API 参考：各供应商 Token Usage 字段

### OpenAI (GPT-5.x / o-series)

```json
{
  "usage": {
    "prompt_tokens": 2006,
    "completion_tokens": 300,
    "total_tokens": 2306,
    "prompt_tokens_details": {
      "cached_tokens": 1920,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 128,
      "audio_tokens": 0
    }
  }
}
```

### DeepSeek V4

```json
{
  "usage": {
    "prompt_tokens": 10000,
    "completion_tokens": 500,
    "total_tokens": 10500,
    "prompt_cache_hit_tokens": 8500,
    "prompt_cache_miss_tokens": 1500,
    "completion_tokens_details": {
      "reasoning_tokens": 200
    }
  }
}
```

### Google Gemini 3.x

```json
{
  "usageMetadata": {
    "promptTokenCount": 55927,
    "candidatesTokenCount": 105,
    "totalTokenCount": 56032,
    "cachedContentTokenCount": 50000,
    "thoughtsTokenCount": 1200
  }
}
```

### Anthropic Claude (with Compaction)

```json
{
  "usage": {
    "input_tokens": 25000,
    "output_tokens": 1500,
    "cache_creation_input_tokens": 20000,
    "cache_read_input_tokens": 18000
  },
  "content": [
    {
      "type": "compact_20260112",
      "summary": "..."
    },
    {
      "type": "text",
      "text": "..."
    }
  ]
}
```

---

## 7. 统一 Token Usage 数据模型

为了跨供应商统一追踪，定义标准化 usage 结构:

```typescript
interface UnifiedTokenUsage {
  /** 本次请求的 input token 总量 (含 cached) */
  inputTokens: number;
  /** 本次请求的 output token 总量 */
  outputTokens: number;
  /** 推理/thinking token (DeepSeek reasoning, Claude thinking, Gemini thoughts) */
  reasoningTokens: number;
  /** 命中缓存的 input token 数量 */
  cacheHitTokens: number;
  /** 未命中缓存的 input token 数量 (= inputTokens - cacheHitTokens) */
  cacheMissTokens: number;
}
```

映射规则:

| 供应商 | inputTokens | cacheHitTokens | reasoningTokens |
|--------|-------------|----------------|-----------------|
| OpenAI | `prompt_tokens` | `prompt_tokens_details.cached_tokens` | `completion_tokens_details.reasoning_tokens` |
| DeepSeek | `prompt_tokens` | `prompt_cache_hit_tokens` | `completion_tokens_details.reasoning_tokens` |
| Gemini | `promptTokenCount` | `cachedContentTokenCount` | `thoughtsTokenCount` |
| Claude | `input_tokens` | `cache_read_input_tokens` | N/A (thinking 自动排除) |

---

## 8. Session 费用估算模型

```typescript
interface SessionCostEstimator {
  /** 估算 session 总费用 */
  estimate(params: {
    maxIterations: number;
    contextWindowBudget: number;
    model: string;
    provider: string;
    expectedCacheHitRate: number; // 0-1, 默认 0.7
  }): {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: { min: number; max: number; expected: number };
  };
}

// 使用示例:
// DeepSeek V4 Flash, 24 轮, 48k budget, 70% cache hit
// → input: 691,200 token
// → output: 691,200 × 0.35 ≈ 241,920 token
// → cost:
//   input miss: 691,200 × 0.3 × $0.14/M = $0.029
//   input hit:  691,200 × 0.7 × $0.0028/M = $0.0014
//   output:     241,920 × $0.28/M = $0.068
//   total: ≈ $0.10/session
```

---

## 9. 与现有架构的映射

| 设计概念 | 现有模块 | 状态 |
|----------|---------|------|
| Session Budget | `BudgetPolicy.maxSessionInputTokens` | ✅ 已修正公式 |
| Per-Call Budget | `ContextWindow.tokenBudget` | ✅ 已有 |
| Per-Tool Budget | `ContextWindow.getToolResultQuota()` | ✅ 5 级阶梯 + session pressure |
| Budget Tiers | `getToolResultQuota()` 5 级 (50%/70%/85%/95%) | ✅ 对齐文档 |
| L1-L3 Compaction | `ContextWindow.compactIfNeeded()` | ✅ 已增强 |
| L4 LLM Summary | `ContextWindow.compactL4()` | ✅ 已激活 |
| Session 预检 | `AgentRuntime.#checkSessionTokenBudget()` | ✅ 已实现 |
| 优雅降级 | `ExitController` + `ExplorationTracker.forceTerminal()` | ✅ 已实现 |
| reasoning 管理 | `DeepSeekTransport.#projectV4Reasoning()` | ✅ Transport 层投影 |
| System Prompt 静态化 | `AgentRuntime.#prepareIteration` → `dynamicContext` | ✅ 已实现 (Phase 1) |
| Cache Hit 追踪 | TurnTelemetry + 连续零命中告警 | ✅ 已实现 (Phase 1+3) |
| TurnTelemetry | `AgentRuntime.#callLLM` 每轮日志 | ✅ 已实现 (Phase 3) |
| 并行工具预算 | `AgentRuntime.#processToolCalls` roundMaxChars 分摊 | ✅ 已实现 (Phase 2) |
| 工具输出摘要模式 | `code.ts` handlers | ⬜ 待实现 (Phase 2) |
| Session 总结报告 | PipelineStrategy 集成 | ⬜ 待实现 (Phase 3) |
