# Token 预算管理体系

> 版本: v1.0 | 日期: 2026-05-03

## 1. 现状诊断

### 1.1 两套独立的 Token 管理系统

当前系统存在 **两套互不感知的 token 管理机制**，这是所有问题的根源。

#### ContextWindow（单次调用级）
- **职责**: 管理每次 LLM 调用的上下文大小
- **预算来源**: `ContextWindow.resolveTokenBudget(model)` — 根据模型上下文窗口计算
- **DeepSeek V4**: 1M 上下文窗口 → tokenBudget = **48,000**
- **压缩策略**: L0-L4 五级递进
- **精度**: `estimateTokensFast(text) = Math.ceil(text.length / 3.5)` — 粗估

#### BudgetPolicy（Session 累计级）
- **职责**: 限制整个 pipeline 的总 token 消耗
- **预算来源**: `maxSessionInputTokens = maxIterations × 3500`
- **默认值**: 24 × 3500 = **84,000**
- **检查时机**: 仅在每轮迭代开始时（`#shouldExit` → `ExitController.checkBeforeIteration`）

### 1.2 根本矛盾：预算假设 vs 实际消耗

```
预算假设:  每轮平均 input token = 3,500
实际消耗:  每轮 input token ≈ ContextWindow.tokenBudget = 48,000 (DeepSeek V4)

预算总量:  24 × 3,500 = 84,000
实际总量:  12 × 48,000 = 576,000（仅 12 轮就远超预算）
```

**`3500/轮` 的假设从何而来？** 这是一个历史遗留值，可能基于早期小上下文模型。当前大模型（DeepSeek V4、Gemini 3、GPT-5.5）的上下文窗口远超预期，每轮的 input token 远高于 3500。

**即使 ContextWindow 有压缩**，单次 LLM 调用的 input 仍然至少包含：
- 系统提示词: ~2,000-5,000 token
- 工具 Schema (6 个 V2 工具): ~600 token
- 最近 1-2 轮的完整消息: ~8,000-15,000 token
- 历史消息（被压缩后）: ~3,000-8,000 token
- 每轮最低 input ≈ **14,000-28,000 token**

### 1.3 Token 增长模式分析

```
轮次  累计 input  本轮 input  ContextWindow 估算
 1     8,000       8,000       8,000
 2    18,000      10,000       10,000
 3    30,000      12,000       12,000
 ...  (消息持续增长，ContextWindow 开始压缩)
 8    76,000      10,000       压缩后维持 ~10,000
 9    86,000      10,000       > 84,000 ← 超限
10    96,000      10,000       ← 实际在第 10 轮开始时才被检测
11   106,000      10,000       ← 或更晚
```

**关键问题**: LLM API 返回的 `usage.inputTokens` 是真实 tokenizer 计数，而 ContextWindow 的
`estimateTokensFast` 只是 `text.length / 3.5` 粗估。两者可能有 20-40% 偏差。

### 1.4 检查时序问题

```
iteration N:
  ① #shouldExit → BudgetPolicy 检查 → OK (累计 token 在限额内)
  ② #prepareIteration → ContextWindow.compactIfNeeded()
  ③ #callLLM → 发送 ~15,000 input token → LLM 返回 usage
  ④ tokenUsage.input += 15,000  ← 累计可能已超限！但无检查
  ⑤ #processToolCalls → 8 个工具 → 追加 ~30,000 字符结果到消息
  ← 没有 token 检查！

iteration N+1:
  ① #shouldExit → BudgetPolicy 检查 → 超限！→ 硬退出
```

## 2. 工具输出 Token 消耗审计

### 2.1 各工具最大输出分析

| 工具.操作 | 内部限制 | limitToolResult 后 | 实际最大 token |
|-----------|---------|-------------------|---------------|
| code.search | maxResults=10, context=2行 | maxChars=6000 | ~1,700 |
| code.read (≤500行) | **无限制** — 全量返回 | maxChars=6000 | ~1,700 |
| code.read (>500行) | AST outline / 头尾预览 | maxChars=6000 | ~1,700 |
| code.structure | 全量目录树 | maxChars=6000 | ~1,700 |
| code.outline | AST outline | maxChars=6000 | ~1,700 |
| terminal.exec | compressor: 32,000 字符 | maxChars=6000 | ~1,700 |
| knowledge.submit | 固定 500 字符 | 500 字符 | ~143 |
| graph.query | 变长 | maxChars=6000 | ~1,700 |
| meta.tools | 固定列表 | maxChars=6000 | ~500 |

### 2.2 风险点：大量数据交付

#### 风险 1: code.read 不带行号范围
LLM 频繁调用 `code.read` 读取 300-500 行的文件，每次返回 ~15,000-25,000 字符的原始内容。
经过 `limitToolResult` 的 `maxChars=6000`（低 usage）截断后约 6000 字符，但：
- 低 usage（< 0.4）时 maxChars = 6000
- 8 个并行 code.read = **48,000 字符 ≈ 13,700 token** 的工具结果加入消息

#### 风险 2: terminal.exec 无 compressor 匹配
`OutputCompressor` 只有 8 种命令模式解析器（git status/diff/log、test、lint、grep、tree、package）。
如果命令不匹配任何模式，退化为 `truncateOutput(cleaned, maxChars=32000)`。
32,000 字符 ≈ 9,100 token，经过 `limitToolResult` 后截为 6,000 字符 ≈ 1,700 token。

#### 风险 3: limitToolResult 只识别旧格式
`limitToolResult` 中 `code.search` 的特殊处理检查 `result.matches || result.batchResults`（V1 结构化对象）。
但 V2 的 `code.search` 返回的是**纯文本**（通过 `formatSearchOutput`）。
走到 `limitToolResult` 时：
- `isToolResultEnvelope(value)` → true → 取 `envelope.text`（字符串）
- 传入 `limitToolResult(toolName='code', result=文本, quota)` 
- 第一个 `if (toolName === 'code' && typeof result === 'object')` → **不匹配**（因为 result 是字符串）
- 落入第二个 `if (toolName === 'code')` → `limitFileContent(result, maxChars)`
- `limitFileContent` 处理的是文件内容截断逻辑

**搜索结果被当作文件内容来截断！** 虽然最终还是按 maxChars 截断，但语义不正确。

#### 风险 4: DeepSeek V4 reasoningContent 累积
每轮 assistant 消息存储 `reasoningContent`（thinking 内容）。
DeepSeek V4 的 thinking 可能有 2,000-10,000 token。
L1 压缩**不清理 reasoningContent**（注释明确说明为了 API 兼容性）。
`estimateTokens()` 包含 reasoningContent → 计入 ContextWindow 的本地估算。
但 reasoningContent 被发送给 LLM 时也计入 `usage.inputTokens`。

**10 轮 × 5,000 token/reasoning = 50,000 token 的无用历史推理内容！**

#### 风险 5: L4 Compaction 从未被调用
`compactL4()` 定义了 LLM-based 的异步压缩摘要功能，但 AgentRuntime 中**从未调用**。
`needsL4Compaction()` 在刚加入的 `#checkSessionTokenBudget` 中被检测，但只是 log，未执行。

#### 风险 6: estimateTokensFast 精度问题
`estimateTokensFast(text) = Math.ceil(text.length / 3.5)` 对于英文代码可能偏低。
实际 tokenizer 中，代码符号（`{`, `}`, `()`, `->`, `===`）可能是独立 token。
偏差: 估算值可能低于实际 15-30%。

### 2.3 单轮最坏场景 Token 消耗

```
系统提示词:              5,000 token
工具 Schema:             600 token
历史 reasoningContent:   30,000 token (6 轮 × 5000)
历史压缩后的消息:        8,000 token
最近 2 轮完整消息:       10,000 token
────────────────────────────────
本轮 LLM input:         53,600 token ← 一次 LLM 调用

工具结果 (8 个并行):     13,700 token (加入消息但不直接消耗 API)
────────────────────────────────
session 累计增量:        53,600 token ← 每轮增加
```

## 3. 统一预算管理体系设计

### 3.1 核心概念: 三层预算协议

```
┌──────────────────────────────────────────────┐
│ Layer 3: Session Budget (BudgetPolicy)       │ ← 总量控制
│   - maxSessionInputTokens                    │
│   - 基于实际 ContextWindow budget 动态计算     │
├──────────────────────────────────────────────┤
│ Layer 2: Per-Call Budget (ContextWindow)      │ ← 单次调用控制
│   - tokenBudget                              │
│   - L0-L4 压缩                               │
│   - reasoningContent 渐进清理                 │
├──────────────────────────────────────────────┤
│ Layer 1: Per-Tool Budget (Tool Output)       │ ← 工具产出控制
│   - limitToolResult (动态 quota)              │
│   - OutputCompressor                          │
│   - DeltaCache                               │
└──────────────────────────────────────────────┘
```

### 3.2 修复方案

#### Fix 1: 修正 maxSessionInputTokens 计算公式

**问题**: `maxIterations × 3500` 假设每轮 3500 token，实际可达 48,000。

**方案**: 基于 ContextWindow 的 tokenBudget 动态计算。

```typescript
function computeMaxSessionInputTokens(
  maxIterations: number,
  contextWindowBudget: number
): number {
  // 早期轮次上下文较小，后期轮次接近 budget 上限
  // 使用经验系数: 前 30% 轮次平均 40% budget，后 70% 轮次平均 70% budget
  const earlyRounds = Math.ceil(maxIterations * 0.3);
  const lateRounds = maxIterations - earlyRounds;
  const avgEarlyInput = contextWindowBudget * 0.4;
  const avgLateInput = contextWindowBudget * 0.7;

  return Math.ceil(earlyRounds * avgEarlyInput + lateRounds * avgLateInput);
}

// DeepSeek V4: maxIter=24, budget=48000
// → early: 8 × 19200 = 153,600
// → late: 16 × 33600 = 537,600
// → total: 691,200
```

**更简洁的近似**: `maxSessionInputTokens = maxIterations × contextWindowBudget × 0.6`
- DeepSeek V4: 24 × 48000 × 0.6 = **691,200**

#### Fix 2: LLM 调用前的 Session 预算预检（已实现）

在 `#prepareIteration` 中已加入 `#checkSessionTokenBudget`：
- 预估本轮 input token（通过 `ContextWindow.estimateFullContextTokens`）
- 85% → 激进压缩
- 95% → 强制 SUMMARIZE

#### Fix 3: ExitController 优雅降级（已实现）

Token 超限时先 `forceTerminal()` 进入 SUMMARIZE，给一轮 grace 机会。

#### Fix 4: reasoningContent 渐进清理

**问题**: 历史轮次的 reasoningContent 占用大量 token 但对后续推理无价值。

**方案**: 在 L1 压缩时，对非最近 2 轮的 assistant 消息清理 reasoningContent：
- 保留带 toolCalls 的 assistant 消息的 reasoningContent（DeepSeek V4 API 要求）
- 清理纯文本 assistant 消息的 reasoningContent（API 会忽略）
- 清理超过 3 轮之前的所有 reasoningContent（包括带 toolCalls 的）

**预期节省**: 每轮 ~3,000-8,000 token → 10 轮可节省 30,000-80,000 token

#### Fix 5: 工具输出双层截断

**问题**: `limitToolResult` 对 V2 纯文本输出的语义处理不正确。

**方案**:
1. V2 handler 内部截断: 每个 handler 在返回 `ok(data)` 前，尊重 `ctx.tokenBudget`
2. `limitToolResult` 增加 V2 纯文本模式: 识别 V2 搜索结果格式并正确截断

```typescript
// code.search V2 返回格式: "N matches (showing M)\n\nfile:line: content"
if (toolName === 'code' && typeof result === 'string' && /^\d+ matches/.test(result)) {
  return result.length > maxChars
    ? `${result.substring(0, maxChars)}\n... [truncated]`
    : result;
}
```

#### Fix 6: 激活 L4 Compaction

**问题**: `compactL4()` 存在但从未被调用。

**方案**: 在 `#checkSessionTokenBudget` 中，当检测到需要激进压缩（85%-95%）时，
如果 `contextWindow.needsL4Compaction()` 返回 true，异步执行 `compactL4()`。

```typescript
if (ctx.contextWindow && ctx.contextWindow.needsL4Compaction()) {
  const l4Result = await ctx.contextWindow.compactL4(this.aiProvider);
  // l4Result.usage 计入 session token
}
```

注意: L4 自身会消耗一次 LLM 调用的 token，需计入 session budget。

#### Fix 7: 动态 tokenBudget 联动

**问题**: 工具的 `ctx.tokenBudget`（8000）是固定值，不随 session 进度调整。

**方案**: `ToolContextFactory.createContext` 接收当前 session 进度（usage ratio），
动态调整 tokenBudget：

```typescript
createContext(request, sessionProgress?: number): ToolContext {
  const baseTokenBudget = this.#deps.defaultTokenBudget ?? 8000;
  const ratio = sessionProgress ?? 0;
  // 0-50%: full budget; 50-80%: 60% budget; 80%+: 30% budget
  const dynamicBudget =
    ratio < 0.5 ? baseTokenBudget :
    ratio < 0.8 ? Math.ceil(baseTokenBudget * 0.6) :
    Math.ceil(baseTokenBudget * 0.3);
  // ...
  tokenBudget: dynamicBudget,
}
```

### 3.3 优先级排序

| 优先级 | Fix | 预期效果 | 复杂度 |
|--------|-----|---------|--------|
| P0 | Fix 1: 修正 maxSessionInputTokens | 从根本上消除"瞬间打满" | 低 |
| P0 | Fix 4: reasoningContent 渐进清理 | 节省 30-80k token/session | 中 |
| P1 | Fix 2: 预检（已实现） | 预防性措施 | 已完成 |
| P1 | Fix 3: 优雅降级（已实现） | 保护已有分析不丢失 | 已完成 |
| P1 | Fix 5: 工具输出双层截断 | 修正语义 + 减少浪费 | 低 |
| P2 | Fix 6: 激活 L4 Compaction | 极端情况下的安全网 | 中 |
| P2 | Fix 7: 动态 tokenBudget 联动 | 渐进式资源分配 | 中 |

## 4. 数据流全景图

```
LLM Request (per iteration):
  ┌─ systemPrompt (~2,000-5,000 token)
  ├─ toolSchemas (6 tools, ~600 token)
  └─ messages[]
       ├─ [0] user prompt (~500 token)
       ├─ [1..N-2] 历史消息 (L1-L3 压缩后)
       │    ├─ assistant (text + reasoningContent + toolCalls)  ← Fix 4 清理
       │    ├─ tool results (L1 truncated to 500 chars)
       │    └─ user nudges
       └─ [N-1..N] 最近 1-2 轮 (完整)
            ├─ assistant (完整 text + reasoningContent)
            ├─ tool results (limitToolResult 截断)  ← Fix 5 优化
            └─ user nudges
  
LLM Response:
  usage.inputTokens  → tokenUsage.input += N  → BudgetPolicy 检查  ← Fix 1 修正
  usage.outputTokens → tokenUsage.output += N
  text / functionCalls / reasoningContent  → 追加到 messages

Tool Execution:
  handler 返回 result.data  → V2ToolRouterAdapter.#toEnvelope  → envelope.text
  → MessageAdapter.formatToolResult  → limitToolResult(quota)  ← Fix 5 + Fix 7
  → messages.appendToolResult
```

## 5. 实现清单

### Phase 1: 紧急修复（消除根因） ✅ 已完成

- [x] **Fix 1**: `computeAnalystBudget` 接收 `contextWindowBudget` 参数动态计算 session 限额
  - 公式: `maxSessionInputTokens = maxIterations × contextWindowBudget × 0.6`
  - 默认 fallback: 使用 15,000 token/轮（中等模型）
  - 静态 ANALYST_BUDGET 默认值也同步更新为合理范围
  - 文件: `lib/agent/prompts/insight-analyst.ts`, `lib/workflows/.../BootstrapDimensionRuntimeBuilder.ts`
  
- [x] **Fix 4**: ContextWindow L1 压缩时渐进清理旧 reasoningContent
  - 保留最近 2 轮的 reasoningContent
  - 带 toolCalls 的 assistant: 替换为空字符串（API 兼容）
  - 纯文本 assistant: 删除 reasoningContent
  - 文件: `lib/agent/context/ContextWindow.ts` `#compactL1()`

### Phase 2: 语义修正 ✅ 已完成

- [x] **Fix 5**: `limitToolResult` 增加 V2 纯文本搜索结果识别
  - 识别 `"N matches (showing M)\n\n..."` 格式
  - 正确按搜索结果语义截断，而非错误走 limitFileContent 路径
  - 文件: `lib/agent/context/ContextWindow.ts`

### Phase 3: 深度优化 ✅ 已完成

- [x] **Fix 6**: AgentRuntime 中激活 L4 compaction
  - 在 `#checkSessionTokenBudget` 中标记 `_pendingL4Compaction`
  - 在 `#callLLM` 开头（async 上下文）执行 `compactL4()`
  - L4 的 LLM 调用 token 消耗计入 session budget
  - 文件: `lib/agent/runtime/AgentRuntime.ts`, `lib/agent/runtime/LoopContext.ts`
  
- [x] **Fix 7**: session pressure 联动工具结果配额
  - `ContextWindow.setSessionPressure(ratio)` 由 AgentRuntime 每轮更新
  - `getToolResultQuota()` 综合考虑 ContextWindow usage 和 session pressure
  - session 消耗 > 70% 时自动降档工具输出配额
  - 文件: `lib/agent/context/ContextWindow.ts`, `lib/agent/runtime/AgentRuntime.ts`

### 前序修复（上轮已完成）

- [x] **Fix 2**: LLM 调用前 session budget 预检 (`#checkSessionTokenBudget`)
- [x] **Fix 3**: ExitController 优雅降级（token 超限时 forceTerminal 而非硬杀）

### 测试验证

- [x] ExitController: 37 tests passed (含 3 个新增 graceful exit 测试)
- [x] ReasoningLayer: 81 tests passed
- [x] MemorySystem: 80 tests passed
- [x] 全量测试: 3142 passed / 37 failed (失败项为已有 sandbox 限制，非本次引入)
