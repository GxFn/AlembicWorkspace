# Agent 与工具系统架构升级设计

> 状态: **P0-P3 All Implemented** | 日期: 2026-05-02
>
> Streaming 和子代理（TaskTool）暂不纳入本轮实施范围，保留为 Future Work。
>
> **实施进度**:
> - [x] P0: ExitController — `lib/agent/runtime/ExitController.ts` (已接入 AgentRuntime)
> - [x] P0: JSON Schema 校验 — `lib/tools/core/SchemaValidator.ts` (ajv, GovernanceEngine 已切换)
> - [x] P0: Token Budget — `lib/agent/policies/BudgetPolicy.ts` (maxSessionTokens/maxSessionInputTokens)
> - [x] P1: ToolDefinitionV2 — `lib/tools/catalog/ToolDefinitionV2.ts` + `UnifiedToolCatalog.ts`
> - [x] P1: MCP 接入主 Router — `AgentModule.ts` 已注册 McpToolAdapter
> - [x] P1: Per-model harness — `UnifiedToolCatalog.toToolSchemasForModel()` + `#getToolSchemas(model)`
> - [x] P2: 5 层 Compaction — `ContextWindow.ts` (L0-L4 + toProjectedMessages + CompactionConfig)
> - [x] P2: HookSystem — `lib/agent/runtime/HookSystem.ts`
> - [x] P2: Tool Lazy Loading — `UnifiedToolCatalog.toMixedSchemas()` + markExpanded
> - [x] P3: 集成与打磨 — 10 项已实施（P3.1-P3.10），详见 §5 P3 章节

## 0. 文档目标

基于 Alembic 现有 Agent/Tool 系统的深度代码分析，对标 OpenAI Codex、Claude Code、Cursor 三大业界标杆方案，提出系统性的架构升级路径。本文档包含基于实际代码逻辑的具体落地方案。

---

## 1. 业界标杆架构提炼

### 1.1 OpenAI Codex

| 维度 | 方案 |
|------|------|
| **Agent Loop** | ReAct while-loop，Responses API 驱动，prefix prompt caching（线性成本） |
| **协议层** | App Server — 双向 JSON-RPC over stdio；三层原语 Item/Turn/Thread |
| **工具** | shell（默认沙箱）、update_plan、web_search、MCP servers；工具定义符合 Responses API schema |
| **上下文** | `/responses/compact` 端点，返回 `type=compaction` + `encrypted_content` 不透明压缩 |
| **沙箱** | 平台原生：macOS Seatbelt, Linux bwrap/Landlock；三级 sandbox_mode |
| **审批** | `approval_policy`（untrusted/on-request/never）+ `guardian_approval` 子代理审批 + 规则 allow/deny |
| **多表面** | CLI/Web/IDE/Desktop 共用同一 Codex harness，App Server 是唯一集成点 |

**核心启示**：
- **协议与循环分离**：Agent 逻辑（core）与 UI 呈现（App Server）完全解耦
- **Compaction 由 API 提供**：客户端不需要自己实现摘要，而是让模型侧返回压缩表示
- **沙箱与审批正交**：sandbox 定义"能做什么"，approval 定义"何时问人"

### 1.2 Claude Code

| 维度 | 方案 |
|------|------|
| **Agent Loop** | `while(tool_call)` — 98.4% 是确定性基础设施，1.6% 是 AI 决策 |
| **工具** | 8 核心工具（Bash/Read/Edit/Write/Grep/Glob/Task/TodoWrite）+ MCP；Lazy loading |
| **子代理** | Task 工具生成 6 种子代理（Explore/Plan/General/Guide/Verification/Statusline），depth=1 |
| **上下文** | 5 层 compaction（budget reduction → snip → microcompact → context collapse → auto-compact） |
| **权限** | 7 种模式（plan→default→acceptEdits→auto→dontAsk→bypassPermissions）；deny-first 7 层安全 |
| **可扩展** | 4 机制 — Hooks(零成本) → Skills(低) → Plugins(中) → MCP(高) |
| **记忆** | file-based（CLAUDE.md/memory/），无向量数据库，完全可检视可版本化 |

**核心启示**：
- **"Less Scaffolding, More Model"**：极简循环，让 LLM 自己做路由决策
- **子代理隔离**：只返回摘要，保护主上下文不被中间结果膨胀
- **渐进式 compaction**：5 层阶梯而非单一阈值，延迟激进操作
- **Hook 系统**：27 事件 × 4 执行类型，几乎所有动作都有前后切点

### 1.3 Cursor

| 维度 | 方案 |
|------|------|
| **Agent Loop** | ReAct + RLVR（强化学习验证奖励），模型理解"过程"而非只理解"结果" |
| **索引** | Merkle tree 增量同步 + AST 语义 chunking（tree-sitter），替代朴素文本切割 |
| **多代理** | 递归 planner-worker 层级；worker 在 Git worktree 隔离；handoff report 通信 |
| **工具** | 15+ 专用工具 + MCP；per-model 定制 harness（不同模型不同指令/工具组合） |
| **可扩展** | Rules（静态持久）+ Skills（动态按需）+ Hooks（前后切点） |
| **长任务** | plan-first → approval → autonomous execution → verification loop |
| **规模** | ~1000 commits/hour, 10M tool calls/week 级别 |

**核心启示**：
- **Per-model harness**：不同模型需要不同的 prompt 和工具配置
- **Plan-first autonomy**：长任务先计划再执行，减少中途偏离
- **Worker 隔离**：每个 worker 独立仓库副本，不共享状态

---

## 2. Alembic 现状深度分析（基于代码审计）

### 2.1 Agent 退出逻辑 — 6+ 路径散落

**现状代码路径完整清单**：

| # | 退出路径 | 文件位置 | 触发条件 |
|---|---------|----------|----------|
| 1 | `#shouldExit` → `abortSignal` | `AgentRuntime.ts:~505` | 外部中止（含 Pipeline 硬超时的 abort） |
| 2 | `#shouldExit` → `tracker.shouldExit()` | `AgentRuntime.ts:~510` | 终结阶段 + phaseRounds≥3；或 iteration≥maxIterations+2 |
| 3 | `#shouldExit` → `ctx.budget.timeoutMs` | `AgentRuntime.ts:~520` | 阶段级超时（`budgetOverride`） |
| 4 | `#shouldExit` → `BudgetPolicy.validateDuring` | `AgentRuntime.ts:~551` | 全局 timeout；tracker 时 iteration 恒传 0 绕过迭代检查 |
| 5 | `#callLLM` → 空响应 + SUMMARIZE grace 用尽 | `AgentRuntime.ts:~746` | phaseRounds≥2 且仍空 → return null |
| 6 | `#callLLM` → 连续 AI 错误≥2 | `AgentRuntime.ts:~821` | 错误累积，重置 messages → null |
| 7 | `#callLLM` → 熔断 CIRCUIT_OPEN | `AgentRuntime.ts:~812` | LLM 熔断器触发 → null |
| 8 | `#callLLM` → graceful + toolChoice 违反（有 text） | `AgentRuntime.ts:~782` | cleanFinalAnswer → null |
| 9 | `#processToolCalls` → 无 tracker + iteration≥maxIter | `AgentRuntime.ts:~1014` | 额外调一次 LLM 生成摘要 → true |
| 10 | `#processTextResponse` → tracker + isFinalAnswer | `AgentRuntime.ts:~1089` | tracker 判定终答 → true |
| 11 | `#processTextResponse` → 无 tracker 纯文本 | `AgentRuntime.ts:~1132` | 文本即终答 → true |
| 12 | `execute()` 层 `Promise.race` | `AgentRuntime.ts:~229` | 全局 timeoutMs（默认 300s）→ abort |
| 13 | `PipelineStrategy` 硬超时 | `PipelineStrategy.ts:~657` | stageTimeout + 60s → abort + 空 StageResult |

**耦合问题**：
- **超时三重来源**：`execute()` 全局 race / `#shouldExit` 阶段 `ctx.budget.timeoutMs` / `BudgetPolicy.validateDuring` 全局 `#timeoutMs` — 三者阈值可能不一致
- **迭代上限双轨**：tracker 模式传 `iteration=0` 绕过 BudgetPolicy，由 tracker 自管；无 tracker 时由 BudgetPolicy + `#processToolCalls` 末轮共管
- **"Forced summary" 多名义**：`#prepareIteration` 的 toolChoice 收敛 / `#processToolCalls` 末轮额外 LLM / `#finalize` 的 `produceForcedSummary` — 各有不同入口和产物

### 2.2 工具注册双源耦合

**当前注册链条**：

```
ToolDefinition (name, handler, parameters, metadata)
  → withToolCapabilityMetadata()          // 推断 sideEffect/surface/gateway 等
  → createInternalToolManifest()          // id=name, kind='internal-tool'
  → ToolCapabilityManifest               // 进 CapabilityCatalog
  
同一 ToolDefinition
  → ToolRegistry.register()              // name → handler Map
```

**id 对齐约束**：`ToolDefinition.name` = `manifest.id` = 调用时 `toolId` = `InternalToolAdapter` 查询 key。任一环节遗漏即出现「治理发现 manifest 但无 handler」或「有 handler 但治理拒绝」。

**validateToolInput 能力边界**（`ToolInputSchema.ts`）：
- ✅ `type`、`required`、`enum`、嵌套 `object`、`array.items`
- ❌ 无 `$ref`、`allOf/oneOf`、`pattern`、`min/max`、`format`、`additionalProperties`
- ⚠️ 未出现在 `properties` 的额外字段**静默放行**

### 2.3 ContextWindow 压缩

**当前实现**（`ContextWindow.ts`）：

| 层级 | 阈值 | 操作 | 局限 |
|------|------|------|------|
| L1 | usage ≥ 0.6 | 截断旧 tool result > 2000 字符为 500 字符 | 不迭代，单次可能不够 |
| L2 | usage ≥ 0.8 | 删除索引 1..倒数第二轮，插入模板摘要 | "摘要"是固定字符串，非 LLM 语义摘要 |
| L3 | usage ≥ 0.95 | 仅保留最后 1 轮 + 模板摘要 | 连续两条 user 依赖 Provider 合并 |

**token 估算**：`estimateTokensFast` = `ceil(length / 3.5)`，**不含 system prompt 和 tool schemas**，与真实 API 输入可能偏差 20-30%。

**`getToolResultQuota` 动态配额**（独立于 L1-L3）：usage < 0.4 → 6000 chars / 15 matches；≥ 0.8 → 800 / 3。

**ForcedSummary**（`forced-summary.ts`）：使用**空 messages** 调 LLM，故意不带对话历史，丢失论证链。

### 2.4 事件系统碎片化

**当前 4 个并存的事件通道**：

| 通道 | 实现 | 用途 | 问题 |
|------|------|------|------|
| `AgentEventBus` | 全局单例 EventEmitter | Agent 生命周期、工具起止、progress | 多租户需 resetInstance |
| `EventBus` | infrastructure 继承 node:events | 知识/Bootstrap/审计等应用层 | 与 Agent 运行时平行 |
| `SignalBus` | 结构化 emit/subscribe | ExplorationTracker phase 转换 | 可选注入，不接即无 |
| Pipeline Middleware | ToolExecutionPipeline | 工具白名单/记忆/去重 | 固定 5 个，`createToolPipeline()` 写死 |

**`createToolPipeline()` 硬编码**：`AgentRuntime` 构造时直接调用，无配置点注入自定义中间件。`progressEmitter` 和 `eventBusPublisher` 已实现但默认不启用（注释说明与旧事件顺序一致）。

### 2.5 预算控制 — 无 Token 一级约束

**BudgetPolicy 检查项**：仅 `iteration ≥ maxIterations` + `elapsed > timeoutMs`。

**`maxTokens` 的实际语义**：单次补全的 max output tokens（传给 `chatWithTools`），**不是**会话级累计 token 预算。

**会话级 token 仅做统计**：`AgentRuntime.tokenUsage` 按每次 LLM 返回的 `usage` 累加（`inputTokens` / `outputTokens`），但不触发任何退出决策。

**工具 schema 注入链路**：`#collectTools(capabilities)` → `capabilityCatalog.toToolSchemas(ids)` → `chatWithTools({ tools })` → `ParameterGuard` → Provider API。全量注入，每轮不变。

---

## 3. 架构升级设计 — 具体落地方案

### 3.1 设计原则

1. **"Less Scaffolding, More Model"**（Claude Code）— 简化确定性路由
2. **渐进式压缩**（Claude Code 5 层）— 延迟激进操作
3. **沙箱与审批正交**（Codex）— 技术边界与信任决策分离
4. **Per-model harness**（Cursor）— 不同模型不同配置
5. **Hook 可扩展性**（Claude Code + Cursor）— 所有动作有前后切点
6. **向后兼容**— 渐进式迁移，不一次性破坏现有管线

---

### 3.2 ExitController — 统一退出逻辑

#### 3.2.1 现状问题精确定位

`AgentRuntime` 中退出判断散落 13 处（见 §2.1），核心冲突：

- `#shouldExit` 用 `ctx.budget.timeoutMs` 做阶段墙，但 `BudgetPolicy.validateDuring` 也检查自己的 `#timeoutMs`，两者可能是不同值
- tracker 模式下 `iteration` 传 0 绕过 BudgetPolicy，使得迭代控制完全由 tracker 私有逻辑决定，外部不可知
- `#processToolCalls` 在无 tracker + 迭代用尽时自己发起额外 LLM 调用生成摘要，这是"业务逻辑内嵌退出决策"

#### 3.2.2 落地方案

**新建文件**：`lib/agent/runtime/ExitController.ts`

```typescript
import type { ExplorationTracker } from '../context/ExplorationTracker.js';
import type { LoopContext } from './LoopContext.js';

interface ExitSignal {
  action: 'continue' | 'exit' | 'graceful_exit';
  reason?: ExitReason;
  needsSummary?: boolean;
  gracePeriod?: number;           // graceful_exit 时剩余轮数
  nudge?: string | null;          // 需注入的消息（digest/phase_transition）
}

type ExitReason =
  | 'abort_signal'                // P0: abortSignal.aborted
  | 'iteration_exhausted'         // P0: tracker 或 policy 的迭代上限
  | 'time_exhausted'              // P0: 统一超时（消除三重来源）
  | 'token_exhausted'             // P1: 上下文 L4 压缩后仍不够
  | 'task_complete'               // P0: 模型决定停止（纯文本终答）
  | 'task_complete_with_nudge'    // P0: tracker isFinalAnswer 但 needsDigestNudge
  | 'empty_response'              // P0: 连续空响应（含 SUMMARIZE grace 逻辑）
  | 'error_accumulated'           // P0: 连续 AI 错误 ≥ 2
  | 'circuit_open'                // P0: LLM 熔断
  | 'llm_continue';              // 非退出：LLMResultType.CONTINUE（重试信号）

class ExitController {
  #tracker?: ExplorationTracker;
  #effectiveTimeoutMs: number;    // min(stageBudget, policyTimeout)
  #loopStartTime: number;
  #abortSignal?: AbortSignal;

  // 累积状态
  #consecutiveEmpty: number;
  #consecutiveErrors: number;
  #gracefulExitRemainder: number;

  // 入口检查（每轮开始前，替代 #shouldExit）
  check(ctx: LoopContext): ExitSignal;

  // LLM 结果后检查（替代 #callLLM 中的 null 返回路径）
  // 注意：返回 'llm_continue' 时调用方应 continue 跳过本轮
  onLLMResult(result: LLMResult | null, ctx: LoopContext): ExitSignal;

  // 纯文本响应后检查（同步，匹配 #processTextResponse 的同步签名）
  // 注意：需处理 tracker.onTextResponse 的 4 个返回字段
  onTextResponse(text: string, ctx: LoopContext): ExitSignal;

  // 工具调用处理后检查
  // 注意：需调用 tracker.endRound() 并处理 phase_transition nudge
  onToolCallsProcessed(ctx: LoopContext): ExitSignal;
}
```

**具体改造步骤**：

1. **统一超时**：ExitController 构造时计算 `effectiveTimeoutMs = min(ctx.budget.timeoutMs, policyTimeout)`，消除三重来源
2. **吸收 tracker.shouldExit**：ExitController 内部持有 tracker 引用，`check()` 内部调用 `tracker.shouldExit()` 并翻译为 `ExitSignal`
3. **吸收 #callLLM 的 null 返回**：新增 `onLLMResult()` 方法统一处理空响应、错误累积、熔断；`#callLLM` 只负责调用 LLM，不做退出判断
4. **吸收 #processToolCalls 末轮摘要**：迁移到 ExitController 的 `onToolCallsProcessed()` → 返回 `{ action: 'exit', needsSummary: true }`；`reactLoop` 根据 `needsSummary` 在退出前调用 summary 逻辑
5. **保留 `reactLoop` 的 break 为唯一出口**：`reactLoop` 仅检查 `exitController.check()` 的返回值决定是否 break

**`reactLoop` 改造后伪代码**：

```typescript
while (true) {
  const preCheck = exitController.check(ctx);
  if (preCheck.action !== 'continue') break;

  const llmResult = await this.#callLLM(ctx);
  const llmSignal = exitController.onLLMResult(llmResult);
  if (llmSignal.action !== 'continue') break;

  if (llmResult.toolCalls.length > 0) {
    await this.#processToolCalls(ctx, llmResult.toolCalls);
    const toolSignal = exitController.onToolCallsProcessed(ctx.iteration);
    if (toolSignal.action !== 'continue') break;
  } else {
    const textSignal = exitController.onTextResponse(llmResult.text, ...);
    if (textSignal.action !== 'continue') break;
  }
}
// 使用最后一个 ExitSignal 的 reason/needsSummary 决定 finalize 行为
```

**向后兼容**：
- ExitController 默认行为完全复刻现有散落逻辑，通过配置参数切换新旧行为
- 分阶段迁移：先合并超时 → 再合并 tracker → 再合并 LLM 错误 → 最后合并末轮摘要

---

### 3.3 ToolDefinitionV2 — 统一工具注册

#### 3.3.1 现状问题精确定位

- `ToolRegistry` 存 `name → handler`（Map）
- `CapabilityCatalog` 存 `manifest.id → ToolCapabilityManifest`（Map）
- `CapabilityProjection.buildInternalToolCapabilities()` 做 ToolDefinition → manifest 转换
- `AgentModule` 分别注册两边，`manifest.id` 必须 = `ToolDefinition.name`

#### 3.3.2 落地方案

**新建类型**：`lib/tools/catalog/ToolDefinitionV2.ts`

```typescript
import type { ToolDefinition, ToolMetadata as ToolDefinitionMeta } from './ToolDefinition.js';
import type { ToolCapabilityManifest, CapabilityKind, ToolRiskProfile,
  ToolGovernanceProfile, ToolExecutionProfile } from './CapabilityManifest.js';

// 显式定义 handler 类型（V1 内联为 (...args: never[]) => unknown）
type ToolHandler = (args: Record<string, unknown>, context: ToolCallContext) => unknown | Promise<unknown>;

interface ToolDefinitionV2 {
  id: string;
  title: string;
  description: string;
  kind: CapabilityKind;                // 'internal-tool' | 'mcp-tool' | ... (CapabilityManifest.ts:1-8)

  inputSchema: Record<string, unknown>; // JSON Schema（与 V1 ToolDefinition.parameters 类型一致）
  outputSchema?: Record<string, unknown>;

  risk: ToolRiskProfile;
  governance: ToolGovernanceProfile;
  execution: ToolExecutionProfile;

  handler: ToolHandler;

  // per-model 描述覆盖（可选）
  modelOverrides?: Record<string, {
    description?: string;
    inputSchema?: Record<string, unknown>;
  }>;
}

// 桥接函数（非 static method，因为需要复用 CapabilityProjection 逻辑）
function toolDefV1ToV2(def: ToolDefinition): ToolDefinitionV2;
// 内部调用 withToolCapabilityMetadata + createInternalToolManifest 的等价逻辑
```

**新建统一目录** `lib/tools/catalog/UnifiedToolCatalog.ts`：

```typescript
import type { CapabilityCatalog, CapabilityListFilter } from './CapabilityCatalog.js';
import type { ToolSchemaProjection, ToolCapabilityManifest } from './CapabilityManifest.js';
import type { InternalToolHandlerEntry } from '../core/InternalToolHandler.js';

// 继承 CapabilityCatalog 保证 ToolRouter 构造函数类型兼容（ToolRouterOptions.catalog）
class UnifiedToolCatalog extends CapabilityCatalog {
  #defs: Map<string, ToolDefinitionV2>;

  register(def: ToolDefinitionV2): void;
  registerAll(defs: ToolDefinitionV2[]): void;

  // 继承自 CapabilityCatalog，无需改写（但内部实现从 #defs 生成 manifest）
  // getManifest(id: string): ToolCapabilityManifest | null;
  // list(filter?: CapabilityListFilter): ToolCapabilityManifest[];

  // 替代 ToolRegistry.getInternalTool（InternalToolAdapter 依赖此签名）
  getInternalTool(name: string): InternalToolHandlerEntry | null;

  // 扩展：支持 model 参数的 schema 投影
  override toToolSchemas(ids?: string[], model?: string): ToolSchemaProjection[];

  // Forge 临时工具支持（运行时动态注册/注销）
  registerTemporary(def: ToolDefinitionV2): void;
  unregisterTemporary(id: string): void;
}
```

**迁移策略**（渐进式，不一次性破坏）：

1. **Phase 1 — 桥接层**：
   - 实现 `ToolDefinitionV2.fromV1()`，自动从现有 `ToolDefinition` + `CapabilityProjection` 生成 V2
   - `UnifiedToolCatalog` 构造时接受 V1 工具数组，内部调用 `fromV1`
   - `UnifiedToolCatalog` 同时暴露 `getManifest()` 和 `getHandler()`，兼容 `ToolRouter` / `InternalToolAdapter`

2. **Phase 2 — 新工具用 V2**：
   - 新增工具直接编写 `ToolDefinitionV2`，handler + schema + governance 在一处
   - 现有工具保持 V1 格式，通过 `fromV1` 桥接

3. **Phase 3 — 全量迁移**：
   - 逐个工具从 V1 迁移到 V2
   - 删除 `CapabilityProjection`、旧 `ToolRegistry`

**AgentModule 改造**：

```typescript
// 现有
const { tools, manifests } = buildInternalToolCapabilities(RAW_TOOLS);
const catalog = new CapabilityCatalog(manifests);
const registry = new ToolRegistry();
registry.registerAll(tools);

// 改造后
const catalog = new UnifiedToolCatalog();
catalog.registerAll(RAW_TOOLS.map(ToolDefinitionV2.fromV1));
// catalog 同时提供 getManifest / getHandler，ToolRouter 只依赖 catalog
```

---

### 3.4 JSON Schema 校验 — ajv 替代

#### 3.4.1 现状问题

`validateToolInput()`（`ToolInputSchema.ts`）是自定义实现，仅覆盖 JSON Schema 的子集：type / required / enum / 嵌套 object / array items。**缺失**：`$ref`、`allOf/oneOf`、`pattern`、`minLength/maxLength`、`minimum/maximum`、`format`、`additionalProperties: false`。

#### 3.4.2 落地方案

**添加依赖**：`ajv`（轻量，~150KB，无外部依赖）

**新建文件**：`lib/tools/core/SchemaValidator.ts`

```typescript
import Ajv from 'ajv';

const ajv = new Ajv({
  allErrors: true,       // 收集所有错误而非只报第一个
  coerceTypes: false,    // LLM 输出已是 JSON，不需要类型强制
  removeAdditional: false,
  useDefaults: false,
});

export function validateToolInputV2(
  args: Record<string, unknown>,
  schema: JSONSchema
): ValidationResult {
  const validate = ajv.compile(schema);
  const valid = validate(args);
  if (valid) return { ok: true };

  return {
    ok: false,
    errors: (validate.errors ?? []).map(err => ({
      path: err.instancePath || '/',
      message: err.message ?? 'validation failed',
      keyword: err.keyword,
    })),
  };
}
```

**GovernanceEngine 改造**（`GovernanceEngine.ts #plan`）：

```typescript
// 现有
const errors = validateToolInput(request.args, manifest.inputSchema);
// 改造后
const result = validateToolInputV2(request.args, manifest.inputSchema);
if (!result.ok) {
  return denyDecision('plan', `参数校验失败: ${result.errors.map(e => e.message).join('; ')}`);
}
```

**向后兼容**：
- 保留 `normalizeToolInput()` 的别名/蛇形转 camel 逻辑（在 ajv 校验之前执行）
- 旧 `validateToolInput` 保留但标记 `@deprecated`，CI 级别检查不再有新调用
- 对现有工具的 `parameters` schema 逐个验证 ajv 兼容性（多数已是合法 JSON Schema 子集）

---

### 3.5 MCP 接入主 Router

#### 3.5.1 现状

- `McpToolAdapter`（`lib/external/mcp/McpToolAdapter.ts`）已实现，`kind = 'mcp-tool'`
- `McpCapabilityProjection.buildMcpToolCapabilities()` 可生成 `kind: 'mcp-tool'` 的 manifest
- `McpServer._getToolRouter()` 单独创建 `CapabilityCatalog` + `ToolRouter`，**不复用** AgentModule 的 Router
- Agent 默认 Router 的 adapter 表里**没有** `McpToolAdapter`

#### 3.5.2 落地方案

**AgentModule 改造**（`lib/injection/modules/AgentModule.ts`）：

```typescript
// 现有 adapters 列表（AgentModule.ts:71-79）
adapters: [
  new InternalToolAdapter(registry),
  new DashboardOperationAdapter(DASHBOARD_OPERATION_HANDLERS),
  new TerminalAdapter({ sessionManager }),
  new SkillAdapter(),
  new MacSystemAdapter(),
  new WorkflowAdapter(workflowRegistry),
]

// 添加 McpToolAdapter
import { McpToolAdapter } from '#external/mcp/McpToolAdapter.js';
import { buildMcpToolCapabilities } from '#external/mcp/McpCapabilityProjection.js';

// ⚠️ McpToolAdapter 构造函数需要 McpToolExecutor:
// type McpToolExecutor = (toolName, args, request) => Promise<unknown>
// 需要新建 McpHandlerRegistry 来桥接 McpServer 的 handler 表
const mcpRegistry = new McpHandlerRegistry();  // 新增
const mcpExecutor: McpToolExecutor = (name, args, req) => mcpRegistry.execute(name, args, req);

const mcpManifests = buildMcpToolCapabilities(mcpRegistry.getDeclarations()).manifests;
catalog.registerAll(mcpManifests);

adapters: [...existingAdapters, new McpToolAdapter(mcpExecutor)]
```

**治理层增强**：
- MCP 工具的 manifest 默认设置 `externalTrust.trusted = false`，`governance.approvalPolicy = 'confirm-every-time'`
- `GovernanceEngine.#approve` 已有对 `externalTrust` 的检查逻辑，MCP 工具自动受限
- 对于已验证的 MCP server，可通过配置将特定工具标记为 `trusted = true`

**MCP 工具动态发现**：
- 新增 `McpToolDiscovery` 服务：启动时扫描注册的 MCP servers → 获取工具列表 → 生成 manifest → 注入主 catalog
- 支持运行时动态添加/移除 MCP server

---

### 3.6 5 层渐进 Compaction

#### 3.6.1 现状问题精确定位

- token 估算 `estimateTokensFast` = `ceil(length/3.5)`，不含 system prompt / tool schemas
- `messages.length <= 4` 时完全跳过压缩
- L1 不迭代：一次压缩可能仍 ≥ 0.8，要等下一轮才进 L2
- L2/L3 的"摘要"是模板字符串 `[Context compressed: ...]`，非语义摘要
- `compactIfNeeded()` 每轮仅执行一次，单次只进一个级别

#### 3.6.2 落地方案

**改造 `ContextWindow.ts`**，新增 5 层策略：

| 层 | 名称 | 阈值 | 操作 | 对应现有 |
|----|------|------|------|----------|
| L0 | Budget Reduction | usage ≥ 0.40 | `getToolResultQuota` 降档（已有） | 现有 quota 逻辑 |
| L1 | Snip | usage ≥ 0.55 | 截断旧 tool result > 1500 chars 为 400 chars | 改进现有 L1 |
| L2 | Merge | usage ≥ 0.70 | 合并连续同角色消息；去重重复的 submit 记录 | 新增 |
| L3 | Collapse | usage ≥ 0.82 | 读时投影：保留原始消息但 `toMessages()` 时折叠中间轮次为摘要行 | 新增 |
| L4 | Auto-compact | usage ≥ 0.92 | **带上下文**的 LLM 摘要（保留最后 2 轮 + 摘要前 3 轮关键发现） | 替代 forced-summary |

**关键改进**：

1. **token 估算增强**：新增 `estimateFullContextTokens()` 方法，包含 system prompt 估算 + tool schemas 估算（基于注册工具数量和 schema 复杂度的经验公式）

2. **L3 读时投影（非破坏性）**：
   ```typescript
   class ContextWindow {
     #messages: ContextMessage[];         // 原始消息始终保留
     #collapseThreshold: number = -1;     // 折叠起点 index，-1=未激活
   
     // ⚠️ 保留原始 toMessages() 返回引用（现有行为，ContextWindow.ts:436-438）
     toMessages(): ContextMessage[] {
       return this.#messages;
     }
   
     // 新增：读时投影方法（供 #callLLM 使用）
     toProjectedMessages(): ContextMessage[] {
       if (this.#collapseThreshold < 0) return this.#messages;
       return [
         this.#messages[0],               // system/prompt
         this.#buildCollapseSummary(),     // 折叠区摘要
         ...this.#messages.slice(this.#collapseThreshold),
       ];
     }
   }
   // MessageAdapter 对应新增 toProjectedMessages() 委托
   ```

3. **L4 带上下文摘要**（替代 `produceForcedSummary` 的空 messages）：
   ```typescript
   // ⚠️ compactIfNeeded 现有签名是同步的（ContextWindow.ts:281-297）
   // L4 需要异步调 LLM — 两种方案：
   // 方案 A：compactIfNeeded() 变为 async（影响 MessageAdapter + #prepareIteration）
   // 方案 B（推荐）：L4 单独方法，由 AgentRuntime 在特定时机调用
   
   // 方案 B 实现：
   async compactL4(aiProvider: AIProvider): Promise<{ level: 4; removed: number }> {
     const recentMessages = this.#messages.slice(-6);
     const keyFindings = [...this.#compactedSubmits];     // 已有压缩记录
     const summaryPrompt = buildCompactionPrompt(keyFindings);
     // 使用 produceForcedSummary 同款 aiProvider（ForcedSummaryOpts 兼容）
     const summary = await aiProvider.chatWithTools(summaryPrompt, {
       messages: recentMessages,       // 带上下文（非空 messages）
       toolChoice: 'none',
     });
     const oldLen = this.#messages.length;
     this.#spliceAndSummarize(oldLen - 6, 4);
     // 用 LLM 摘要替换模板摘要
     this.#messages[1].content = summary.text;
     return { level: 4, removed: oldLen - 6 - 1 };
   }
   // AgentRuntime.#prepareIteration 中：
   // if (compactResult.level >= 3 && usage still > 0.92) await contextWindow.compactL4(aiProvider);
   ```

4. **多级递进**：单次 `compactIfNeeded()` 可从当前 usage 对应的层级开始，如果压缩后仍超过下一级阈值则继续（最多到 L4）

5. **管线级配置覆盖**：
   ```typescript
   interface CompactionConfig {
     thresholds: [number, number, number, number, number]; // L0-L4 阈值
     enableL4LLM: boolean;    // 是否启用 LLM 摘要（scan 管线可关闭）
   }
   ```

---

### 3.7 HookSystem — 统一事件与可扩展切点

#### 3.7.1 现状问题

4 个事件通道（AgentEventBus / EventBus / SignalBus / Pipeline Middleware）各自独立：
- ExplorationTracker 的 phase_transition 走 SignalBus，前端订阅 AgentEventBus 看不到
- Pipeline 中间件写死在 `createToolPipeline()`，无法外部注入
- `progressEmitter` / `eventBusPublisher` 中间件已实现但默认不用，与 `#processToolCalls` 手动发事件重复

#### 3.7.2 落地方案

**新建文件**：`lib/agent/runtime/HookSystem.ts`

```typescript
type HookEvent =
  // Agent 循环
  | 'agent:iteration:before'        // 每轮开始前
  | 'agent:iteration:after'         // 每轮结束后
  | 'agent:exit'                    // 退出决策做出后
  | 'agent:finalize'                // finalize 前

  // 工具执行（替代 Pipeline 固定中间件）
  | 'tool:execute:before'           // 工具执行前（可 block）
  | 'tool:execute:after'            // 工具执行后

  // 上下文管理
  | 'context:compact:before'        // 压缩前
  | 'context:compact:after'         // 压缩后

  // 探索阶段
  | 'exploration:phase_transition'  // 阶段转换
  | 'exploration:budget_warning'    // 预算警告

  // LLM 调用
  | 'llm:call:before'              // LLM 调用前
  | 'llm:call:after';             // LLM 调用后

interface HookHandler<E extends HookEvent = HookEvent> {
  name: string;
  priority?: number;               // 越小越先执行，默认 100
  handler: (payload: HookPayload<E>) => Promise<HookVerdict>;
}

type HookVerdict =
  | { action: 'continue' }
  | { action: 'block'; reason: string }    // 仅 :before 事件
  | { action: 'modify'; payload: unknown }; // 修改事件数据

class HookSystem {
  #hooks: Map<HookEvent, HookHandler[]>;

  register(event: HookEvent, handler: HookHandler): void;
  unregister(event: HookEvent, name: string): void;

  async emit(event: HookEvent, payload: HookPayload): Promise<HookResult>;
  async emitBefore(event: HookEvent, payload: HookPayload): Promise<BeforeResult>;
}
```

**与现有系统的集成策略**：

1. **Pipeline 中间件 → Hook 迁移**：
   - ⚠️ **前置条件**：`ToolMiddleware` / `BeforeVerdict` / `ToolCall` / `ToolExecContext` 等类型
     当前均为 `ToolExecutionPipeline.ts` 内部未导出 interface，需先 export 或在 HookSystem 中重新定义
   - 现有 5 个中间件逐个改写为 HookHandler：
     - `allowlistGate` → `register('tool:execute:before', { name: 'allowlistGate', ... })`
       ⚠️ 需携带 `LoopContext.allowedToolIds` + `TemporaryToolRegistry.isTemporary` 信息
     - `submitDedup` → before + after 两个 Hook
     - `observationRecord` / `trackerSignal` / `traceRecord` → after Hook
   - `ToolExecutionPipeline.execute()` 内部改为 `hookSystem.emitBefore()` + `hookSystem.emit()`

2. **AgentEventBus 桥接**：
   - Hook payload 格式需兼容 `AgentEvents` 常量（`AgentEventBus.ts:17-46`）：
     `TOOL_CALL_START` / `TOOL_CALL_END` / `PROGRESS` 等
   - `register('tool:execute:after', { name: 'agentEventBusBridge', handler: ... })`
   - 消除 `#processToolCalls` 中手动 `bus.publish` / `#emitProgress` 代码

3. **SignalBus 桥接**：
   - ⚠️ `Signal` 类型（`SignalBus.ts:33-46`）使用 `type: SignalType`（枚举）、`value: number`、`metadata`
   - HookPayload 需能映射到 Signal 结构：
     `exploration:phase_transition` → `Signal { type: 'exploration', source: 'ExplorationTracker.phase', value: 0.5|1.0, metadata: { from, to } }`
   - ExplorationTracker 改为双发：hook + signalBus（过渡期），最终收敛到仅 hook

4. **避免与 SkillHooks 重复**（`lib/service/skills/SkillHooks.ts`）：
   - `SkillHooks` 提供 `tap` / `run` 模式，语义接近通用 Hook
   - 方案：HookSystem 参考 `SkillHooks` 的 tap/run 模式设计 API，或让 `SkillHooks` 内部委托给 `HookSystem`

5. **AgentRuntime 注入**：
   ```typescript
   // 注意：当前 AgentRuntime 构造函数中 toolPipeline 在 line 151 写死
   // this.#toolPipeline = createToolPipeline();
   // 改造后：
   constructor(options: AgentRuntimeOptions) {
     this.#hookSystem = options.hookSystem ?? new HookSystem();
     registerDefaultHooks(this.#hookSystem);  // 5 个默认中间件
     this.#toolPipeline = createToolPipeline(this.#hookSystem); // 注入 hook
   }
   ```

---

### 3.8 Tool Lazy Loading

#### 3.8.1 现状

`#callLLM` 每轮传入 `toolSchemas`（从 `capabilityCatalog.toToolSchemas(allowedToolIds)` 获取），包含所有允许工具的完整 schema。当前 Alembic 约 20-30 个内部工具，每个 schema 平均 200-500 tokens，全量约 6000-15000 tokens。

#### 3.8.2 落地方案

**两阶段注入模型**：

```typescript
interface ToolSchemaProjection {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface LightweightToolProjection {
  name: string;
  description: string;  // 一行简述（≤50 tokens）
  // 无 parameters
}
```

**CapabilityCatalog / UnifiedToolCatalog 扩展**：

```typescript
class UnifiedToolCatalog {
  toLightweightSchemas(ids?: string[]): LightweightToolProjection[];
  toFullSchemas(ids: string[], model?: string): ToolSchemaProjection[];

  // 按需展开：模型选择了某工具后，下次请求注入完整 schema
  #expandedTools: Set<string>;
  markExpanded(toolId: string): void;
  toMixedSchemas(ids?: string[], model?: string): ToolSchemaProjection[];
}
```

**AgentRuntime 改造**：

```typescript
// #callLLM 中
const schemas = this.#catalog.toMixedSchemas(allowedToolIds, model);
// toMixedSchemas: expanded 的用完整 schema，其余用 lightweight

// #processToolCalls 中，模型每次选择工具后
for (const call of toolCalls) {
  this.#catalog.markExpanded(call.name);
}
```

**限制与降级**：
- 部分 Provider（如 Claude）要求 tool schema 中必须有 `input_schema`，不支持纯 name+description
- 降级策略：对不支持的 Provider 退回全量注入
- 首轮或 `toolChoice === 'required'` 时使用全量 schema（确保模型有足够信息做选择）

---

### 3.9 Token Budget — BudgetPolicy 增加一级约束

#### 3.9.1 现状

- `BudgetPolicy.maxTokens` 实际是单次 `max_output_tokens`，不是会话预算
- `AgentRuntime.tokenUsage` 每次 LLM 返回后累加真实 usage（input + output），但不触发退出
- 无法控制"这个 Agent 运行总共花了多少 token"

#### 3.9.2 落地方案

**BudgetPolicy 扩展**（`lib/agent/policies/BudgetPolicy.ts`）：

```typescript
interface BudgetConfig {
  maxIterations: number;        // 现有
  timeoutMs: number;            // 现有
  maxOutputTokens: number;      // 原 maxTokens，改名明确语义
  temperature: number;          // 现有

  // 新增
  maxSessionTokens?: number;    // 会话级 input+output 累计上限
  maxSessionInputTokens?: number; // 会话级 input 累计上限
}
```

**validateDuring 扩展**：

```typescript
// 实际返回类型（BudgetPolicy.ts:42-58）：{ ok: boolean; action: string; reason?: string }
// StepState 有索引签名 [key: string]: unknown — 可直接传 totalTokens 无需改接口
validateDuring(stepState: StepState) {
  // 现有检查
  if (stepState.iteration >= this.#maxIterations)
    return { ok: false, action: 'stop', reason: 'iteration_limit' };
  if (Date.now() - stepState.startTime > this.#timeoutMs)
    return { ok: false, action: 'stop', reason: 'timeout' };

  // 新增 token 检查（利用 StepState 索引签名）
  const totalTokens = stepState.totalTokens as number | undefined;
  if (this.#maxSessionTokens && totalTokens && totalTokens >= this.#maxSessionTokens) {
    return { ok: false, action: 'stop', reason: 'token_budget_exhausted' };
  }
  const totalInput = stepState.totalInputTokens as number | undefined;
  if (this.#maxSessionInputTokens && totalInput && totalInput >= this.#maxSessionInputTokens) {
    return { ok: false, action: 'stop', reason: 'input_token_budget_exhausted' };
  }

  return { ok: true, action: 'continue' };
}
```

**AgentRuntime 配合**：

```typescript
// #shouldExit 或 ExitController.check 中
// 已有的 tokenUsage 累计传入 BudgetPolicy.validateDuring
policies.validateDuring({
  iteration: ctx.iteration,
  startTime: ctx.loopStartTime,
  totalTokens: this.tokenUsage.input + this.tokenUsage.output,
  totalInputTokens: this.tokenUsage.input,
});
```

**默认值策略**：
- `maxSessionTokens` 默认 `undefined`（不限制，向后兼容）
- 管线级覆盖：分析阶段可设置较高的 token 预算，生产阶段较低
- 在 `presets.ts` 中为 analyst 管线配置合理默认值（基于 `computeAnalystBudget` 的迭代数推算）

---

### 3.10 Per-model Harness

#### 3.10.1 现状

- `ModelRegistry` + `model-defs.ts` 定义模型能力（contextWindow, toolCalling, reasoning 等）
- `ParameterGuard` 根据模型能力过滤不支持的参数
- **工具描述不区分模型**：所有模型看到相同的 tool description

#### 3.10.2 落地方案

**ToolDefinitionV2 的 `modelOverrides` 使用**：

```typescript
// 示例：read_project_file 工具
const readProjectFile: ToolDefinitionV2 = {
  id: 'read_project_file',
  description: '读取项目内的文件内容...',
  modelOverrides: {
    'deepseek-*': {
      description: '读取项目文件。路径必须是相对路径。返回文件全部内容，请勿用于大文件。',
    },
    'claude-*': {
      description: '读取项目内的文件内容。支持相对路径。...',
    },
  },
  // ...
};
```

**CapabilityCatalog.toToolSchemas 改造**：

```typescript
toToolSchemas(ids?: string[], model?: string): ToolSchemaProjection[] {
  return this.list({ ids }).map(def => {
    const override = model ? this.#matchModelOverride(def, model) : undefined;
    return {
      name: def.id,
      description: override?.description ?? def.description,
      parameters: override?.inputSchema ?? def.inputSchema,
    };
  });
}

#matchModelOverride(def: ToolDefinitionV2, model: string) {
  if (!def.modelOverrides) return undefined;
  for (const [pattern, override] of Object.entries(def.modelOverrides)) {
    if (this.#matchPattern(model, pattern)) return override;
  }
  return undefined;
}
```

**SystemPromptBuilder 差异化**：
- 在 `injectBudget` 或 capability prompt 中，根据模型系列调整提示风格
- DeepSeek 系列：更直接的指令风格
- Claude 系列：更结构化的 XML 标签风格

---

## 4. 对比矩阵

| 维度 | Alembic 现状 | 升级后 | Codex | Claude Code | Cursor |
|------|-------------|--------|-------|-------------|--------|
| **退出控制** | 13 处散落 | ExitController 统一 | model 决定 | 5 条件 | plan-verify |
| **工具注册** | 双源 drift | 单源 V2 + JSON Schema | Responses API | 8 核心 + MCP | 15+ + MCP |
| **Schema 校验** | 自定义子集 | ajv 标准 JSON Schema | 标准 | Zod | 标准 |
| **MCP** | 独立 Router | 主 Router 一等公民 | 一等公民 | 一等公民 + lazy | 一等公民 |
| **上下文压缩** | 3 级模板 | 5 层渐进 + LLM 摘要 | API compact | 5 层 | 动态 chunking |
| **Hook** | 4 通道碎片 | 统一 HookSystem | 规则 + 审批 | 27 事件 × 4 类型 | Rules + Hooks |
| **工具加载** | 全量 | Lazy + 按需展开 | 全量 | Lazy loading | 按需 |
| **Token 预算** | 仅统计 | 一级约束 | 不透明 | 内置 | 内置 |
| **Per-model** | ParameterGuard | harness + 描述覆盖 | 单模型 | 内置 | per-model harness |
| **沙箱** | ✅ P2 完成 | ✅ + Hook 联动 | ✅ 平台原生 | ✅ shell 级 | ✅ worktree |

---

## 5. 实施计划

> Streaming（流式 ReAct）和子代理（TaskTool）暂缓，标记为 Future Work。

### P0 — 退出逻辑与工具基础（2 周）✅

- [x] **ExitController** — `lib/agent/runtime/ExitController.ts`
  - [x] 新建类，提供 checkBeforeIteration / checkAfterLLM / checkAfterAiError / checkAfterToolCalls / checkAfterTextResponse / checkToolChoiceViolation
  - [x] 统一超时：`effectiveTimeoutMs = min(stageBudget, policyTimeout)`
  - [x] 吸收 ExplorationTracker.shouldExit() + graceful 逻辑
  - [x] `reactLoop` 的 `#shouldExit` 委托给 ExitController（通过 createExitController 工厂注入 LoopContext）
  - [x] 单元测试：覆盖全部退出路径 → **P3.1** ✅
- [x] **JSON Schema 校验** — `lib/tools/core/SchemaValidator.ts`
  - [x] 添加 `ajv` 依赖
  - [x] 实现 `validateToolInputV2`（async，lazy-load ajv）
  - [x] GovernanceEngine.#plan 替换调用（#plan 改为 async）
  - [x] 保留旧 `validateToolInput` 标记 `@deprecated`
  - [x] 对现有工具 schema 做 ajv 兼容性扫描 → **P3.2** ✅
- [x] **Token Budget** — `lib/agent/policies/BudgetPolicy.ts`
  - [x] 扩展 `BudgetPolicyConfig` 增加 `maxSessionTokens` / `maxSessionInputTokens`
  - [x] `validateDuring` 增加 token 检查
  - [x] `AgentRuntime.#shouldExit` 传递 totalTokens/totalInputTokens 到 stepState
  - [x] `presets.ts` 为 analyst 管线配置合理默认值 → **P3.3** ✅

### P1 — 工具统一注册与 MCP（2 周）✅

- [x] **ToolDefinitionV2** — `lib/tools/catalog/ToolDefinitionV2.ts`
  - [x] 定义 V2 接口（含 ToolHandler 类型、modelOverrides）
  - [x] 实现 `toolDefV1ToV2()` 桥接（复用 createInternalToolManifest）
  - [x] 新建 `UnifiedToolCatalog` (`lib/tools/catalog/UnifiedToolCatalog.ts`)，继承 CapabilityCatalog，暴露 getManifest / getHandler / getInternalTool
  - [x] AgentModule 改造：全量迁移到 UnifiedToolCatalog 替代 Registry + Catalog → **P3.4** ✅
  - [x] ToolRouter 改为仅依赖 UnifiedToolCatalog → **P3.4** ✅
- [x] **MCP 接入主 Router** — `lib/injection/modules/AgentModule.ts`
  - [x] McpToolAdapter 注册进主 Router 的 adapter 表
  - [x] MCP manifest 注入主 catalog（通过 mcpToolDeclarations singleton）
  - [x] McpToolDiscovery 服务：启动时扫描 + 动态注册 → **P3.5** ✅
- [x] **Per-model harness** — 工具描述差异化
  - [x] `UnifiedToolCatalog.toToolSchemasForModel(ids, model)` 支持 model 参数
  - [x] `#getToolSchemas` 传入 `this.#modelRef`
  - [x] 为 DeepSeek / Claude / GPT 编写工具描述覆盖模板 → **P3.10** ✅

### P2 — 上下文管理与 Hook 系统（3 周）✅

- [x] **5 层 Compaction** — `lib/agent/context/ContextWindow.ts`
  - [x] 实现 L0 动态配额（已有 getToolResultQuota）
  - [x] 实现 L1 Snip（阈值降低到 0.55，可通过 CompactionConfig 配置）
  - [x] 实现 L2 Merge（#compactL2Merge：合并同角色消息、去重 submit）
  - [x] 实现 L3 Collapse（#compactL3Collapse + toProjectedMessages：读时投影，#collapseThreshold）
  - [x] 实现 L4 Auto-compact（compactL4：async LLM 摘要，needsL4Compaction 检测）
  - [x] 支持多级递进（compactIfNeeded 从 L1 → L2 → L3 递进）
  - [x] 管线级配置覆盖（CompactionConfig 接口，thresholds + enableL4LLM）
  - [x] 增强 token 估算（含 system prompt + tool schemas）→ **P3.8** ✅
- [x] **HookSystem** — `lib/agent/runtime/HookSystem.ts`
  - [x] 实现 HookSystem 类（on/once 注册、优先级排序、emit async / emitSync）
  - [x] 类型安全的 HookEvent + HookPayloadMap（12 种事件）
  - [x] registerDefaultHooks 占位（渐进迁移入口）
  - [x] Pipeline 中间件桥接 + tool hook 发射 → **P3.6 Phase C** ✅
  - [x] AgentEventBus / SignalBus 桥接为 Hook → **P3.6 Phase B** ✅
  - [x] AgentRuntime 构造时注入 HookSystem → **P3.6 Phase A** ✅
- [x] **Tool Lazy Loading** — 按需 schema 注入
  - [x] UnifiedToolCatalog 增加 `toLightweightSchemas` / `toMixedSchemas`
  - [x] markExpanded / markExpandedAll / resetExpanded 状态管理
  - [x] `#callLLM` 使用 `toMixedSchemas` → **P3.9** ✅
  - [x] `#processToolCalls` 后 `markExpanded` → **P3.9** ✅

### P3 — 集成与打磨（已实施 ✅）

> 以下为 P0-P2 已创建的基础设施与现有运行时的**深度集成**任务。
> 每项均包含基于实际代码分析的具体落地方案。

**实施依赖关系**：

```
P3.1 ExitController 测试 ─────────────────────────── 无前置，可立即开始
P3.2 ajv 兼容性扫描 ─────────────────────────────── 无前置，可立即开始
P3.3 Token Budget 默认值 ────────────────────────── 无前置，可立即开始
P3.4 AgentModule 全量迁移 UnifiedToolCatalog ────── 无前置（核心，阻塞 P3.9）
P3.5 McpToolDiscovery 动态注册 ──────────────────── 无前置，可并行
P3.6 HookSystem 集成 AgentRuntime ──────────────── 无前置，可并行
  └─ Phase A: 注入 → Phase B: 桥接 EventBus → Phase C: 迁移中间件
P3.7 toProjectedMessages 接入 ───────────────────── 无前置（MessageAdapter 改动小）
P3.8 Token 估算增强 ─────────────────────────────── 依赖 P3.7（compactIfNeeded 签名变化）
P3.9 Tool Lazy Loading 运行时接入 ───────────────── 依赖 P3.4
P3.10 Per-model 工具描述覆盖 ────────────────────── 依赖 P3.4（在 V2 定义中设置覆盖）
```

**推荐执行顺序**：

| 批次 | 任务 | 预计时间 | 风险等级 |
|------|------|----------|----------|
| 批次 1（并行） | P3.1 + P3.2 + P3.3 | 2 天 | 低 |
| 批次 2（核心） | P3.4 | 3 天 | 高 — 影响全局工具链路 |
| 批次 3（并行） | P3.5 + P3.6 Phase A + P3.7 | 2 天 | 中 |
| 批次 4（整合） | P3.8 + P3.6 Phase B + P3.9 + P3.10 | 3 天 | 中 |
| 批次 5（收尾） | P3.6 Phase C | 2 天 | 高 — 需充分回归测试 |

---

#### P3.1 ExitController 单元测试

**目标**：覆盖 ExitController 的 6 个 check 方法中所有分支路径。

**退出路径清单**（来自 `ExitController.ts` 实际代码）：

| 方法 | 分支 | ExitSignal.action | ExitSignal.reason |
|------|------|-------------------|-------------------|
| `checkBeforeIteration` | abortSignal.aborted | exit | abort_signal |
| | tracker.shouldExit() | exit | tracker_exit |
| | elapsed > effectiveTimeoutMs | exit | stage_timeout |
| | policy.validateDuring → token | exit | token_budget_exhausted |
| | policy.validateDuring → other | exit | policy_stop |
| | all pass | continue | — |
| `checkAfterLLM` | null result | exit | empty_response |
| | empty in SUMMARIZE grace<2 | retry | empty_response_terminal |
| | empty in SUMMARIZE grace≥2 | exit | empty_response_terminal |
| | system empty retries<2 | retry | empty_response |
| | system empty retries≥2 | exit | empty_response |
| | normal result | continue | — |
| `checkAfterAiError` | abortSignal.aborted | exit | abort_signal |
| | CIRCUIT_OPEN | exit | circuit_open |
| | consecutiveAiErrors≥2 | exit | error_accumulated |
| | retryable | retry | error_accumulated |
| `checkAfterToolCalls` | no tracker + iter≥max | exit | iteration_exhausted |
| | otherwise | continue | — |
| `checkAfterTextResponse` | metricsTransition + final | graceful_exit | task_complete |
| | isFinalAnswer | exit | task_complete |
| | needsDigestNudge | continue (with nudge) | — |
| | shouldContinue | continue | — |
| | fallthrough | exit | task_complete |
| `checkToolChoiceViolation` | terminal + calls + text | exit | tool_choice_violation |
| | terminal + calls + no text | retry | tool_choice_violation |
| | not terminal | continue | — |

**测试文件**：`test/unit/ExitController.test.ts`

**实现方案**：
```typescript
// Mock 依赖：ExplorationTracker（tick/shouldExit/phase/isGracefulExit/metrics）
// Mock 依赖：LoopContext（iteration/isSystem/consecutiveEmptyResponses/consecutiveAiErrors）
// Mock 依赖：validateDuring callback
// 每个 check 方法 3-5 个 test case，覆盖表中所有分支
```

---

#### P3.2 ajv 兼容性扫描

**目标**：验证现有 40+ 工具的 `parameters` schema 与 ajv 的兼容性。

**现状分析**（基于 `lib/tools/handlers/index.ts` → ALL_TOOLS）：
- 所有内部工具的 `parameters` 均为 `{ type: 'object', properties: {...}, required: [...] }` 格式
- 已确认兼容项：type / properties / required / enum / items / nested object
- **潜在风险**：
  1. 部分工具缺少顶层 `type: 'object'`（SchemaValidator 已自动补充 `type: 'object'`）
  2. `additionalProperties` 未设置（SchemaValidator 默认 `additionalProperties: true`，与旧行为一致）
  3. 自定义非标准属性（如 metadata 字段混入 schema）— 需排查

**落地方案**：
```typescript
// test/unit/SchemaValidator.compat.test.ts
// 遍历 ALL_TOOLS，对每个工具的 parameters 调用 ajv.compile()
// 断言：无 compile error；使用空 {} 和有效输入各验证一次
import { ALL_TOOLS } from '#tools/handlers/index.js';
import { validateToolInputV2 } from '#tools/core/SchemaValidator.js';

for (const tool of ALL_TOOLS) {
  test(`ajv compat: ${tool.name}`, async () => {
    // compile 不抛异常
    const result = await validateToolInputV2({}, tool.parameters || {}, tool.name);
    expect(result).toBeDefined();
  });
}
```

---

#### P3.3 Token Budget 默认值配置

**目标**：在 `presets.ts` 和 `computeAnalystBudget` 中为 analyst 管线配置合理的 session token 预算。

**现状分析**（`lib/agent/prompts/insight-analyst.ts:141-187`）：
- `computeAnalystBudget` 基于 fileCount 计算 maxIterations (24-40) 和 timeoutMs (480s-800s)
- `BudgetPolicy` 新增的 `maxSessionTokens` / `maxSessionInputTokens` 目前**无默认值**
- `presets.ts:157-163` 的 analyze 阶段使用 `ANALYST_BUDGET.maxIterations` 和固定 `timeoutMs: 480_000`

**落地方案**：

1. **扩展 `computeAnalystBudget` 返回值**：
   ```typescript
   // insight-analyst.ts — 在返回值中增加 token 预算
   return {
     ...ANALYST_BUDGET,
     maxIterations: maxIter,
     searchBudget: Math.round(maxIter * 0.75),
     timeoutMs: Math.round((maxIter / 24) * 480_000),
     // 新增：session token 预算（基于 maxIter × 平均每轮 token 消耗）
     // 经验值：analyst 每轮约消耗 ~3000 input tokens + ~1500 output tokens
     maxSessionTokens: maxIter * 5000,         // 24轮=120k, 40轮=200k
     maxSessionInputTokens: maxIter * 3500,    // 24轮=84k, 40轮=140k
   };
   ```

2. **`presets.ts` analyze 阶段注入 token budget**：
   ```typescript
   // presets.ts — analyze 阶段 budget 增加 token 限制
   budget: {
     maxIterations: ANALYST_BUDGET.maxIterations,
     temperature: 0.4,
     timeoutMs: 480_000,
     maxSessionTokens: ANALYST_BUDGET.maxIterations * 5000,
     maxSessionInputTokens: ANALYST_BUDGET.maxIterations * 3500,
   },
   ```

3. **`BootstrapDimensionRuntimeBuilder.ts`** 中 `computeAnalystBudget` 的返回值已含新字段，通过 `BudgetPolicy` 传递到 `validateDuring`。

---

#### P3.4 AgentModule 全量迁移到 UnifiedToolCatalog

**目标**：用 `UnifiedToolCatalog` 替代 `CapabilityCatalog` + `ToolRegistry` 双源。

**影响范围分析**：

| 引用点 | 文件 | 依赖接口 | 迁移难度 |
|--------|------|----------|----------|
| `capabilityCatalog` singleton | `AgentModule.ts` | `CapabilityCatalog` | 低 — UnifiedToolCatalog 继承 |
| `toolRegistry` singleton | `AgentModule.ts` | `ToolRegistry` | 中 — 需对齐 handler 注册 |
| `ToolRouter` constructor | `ToolRouter.ts:49` | `catalog: CapabilityCatalog` | 低 — UnifiedToolCatalog 是子类 |
| `ToolForge` | `AgentModule.ts:93-101` | `ForgedInternalToolStore` | 中 — 需 UnifiedToolCatalog 实现 |
| `InternalToolAdapter` | `AgentModule.ts:71` | `InternalToolHandlerStore` | 低 — 已实现 |
| `AgentRuntimeBuilder` | `AgentModule.ts:133` | `toolRegistry` | 中 — 需改为 UnifiedToolCatalog |
| `#getToolSchemas` | `AgentRuntime.ts` | `capabilityCatalog.toToolSchemas` | 低 — 已兼容 |

**落地方案（3 步渐进）**：

**Step 1** — `AgentModule.ts` 改造：
```typescript
// 替换 CapabilityCatalog + ToolRegistry 为 UnifiedToolCatalog
import { UnifiedToolCatalog } from '#tools/catalog/UnifiedToolCatalog.js';
import { toolDefV1ToV2 } from '#tools/catalog/ToolDefinitionV2.js';

c.singleton('capabilityCatalog', () => {
  const catalog = new UnifiedToolCatalog();
  // V1 内部工具 → V2 桥接
  catalog.registerV2All(ALL_TOOLS.map(toolDefV1ToV2));
  // 非内部工具 manifest 直接注册（Dashboard/Terminal/Skill/Mac）
  for (const m of [
    ...DASHBOARD_OPERATION_MANIFESTS,
    ...TERMINAL_CAPABILITY_MANIFESTS,
    ...SKILL_CAPABILITY_MANIFESTS,
    ...MAC_SYSTEM_CAPABILITY_MANIFESTS,
  ]) {
    catalog.register(m);
  }
  return catalog;
});

// toolRegistry 改为包装 UnifiedToolCatalog
c.singleton('toolRegistry', (ct) => {
  const catalog = ct.get('capabilityCatalog') as UnifiedToolCatalog;
  // ToolRouter 直接使用 catalog（UnifiedToolCatalog 是 CapabilityCatalog 子类）
  catalog.setRouter?.(new ToolRouter({ catalog, adapters: [...], ... }));
  return catalog; // 返回 UnifiedToolCatalog，兼容 InternalToolHandlerStore
});
```

**Step 2** — `ToolForge` 兼容：
- `UnifiedToolCatalog` 已有 `registerTemporary` / `unregisterTemporary`
- 需要让 `ToolForge` 接受 `UnifiedToolCatalog` 而非 `ToolRegistry`

**Step 3** — 废弃 `ToolRegistry`：
- 所有 `import ToolRegistry` 替换为 `import UnifiedToolCatalog`
- 删除 `ToolRegistry.ts`

---

#### P3.5 McpToolDiscovery 动态注册

**目标**：启动时从 MCP 配置文件扫描外部 MCP server 的工具声明，动态注入主 catalog。

**现状分析**：
- `lib/external/mcp/tools.ts` 中 `TOOLS` 是静态导出的 bundled 工具列表
- `McpCapabilityProjection.buildMcpToolCapabilities()` 可将 `McpToolDeclaration[]` 转为 manifest
- `AgentModule.ts` 已预留 `mcpToolDeclarations` singleton

**落地方案**：
```typescript
// lib/external/mcp/McpToolDiscovery.ts — 新建
export class McpToolDiscovery {
  #declarations: McpToolDeclaration[] = [];

  /** 从 .vscode/mcp.json 或 .cursor/ 扫描 MCP server 配置 */
  async discover(projectRoot: string): Promise<McpToolDeclaration[]> {
    const configPaths = [
      path.join(projectRoot, '.vscode', 'mcp.json'),
      path.join(projectRoot, '.cursor', 'mcp.json'),
    ];
    for (const p of configPaths) {
      if (await exists(p)) {
        const config = JSON.parse(await fs.readFile(p, 'utf8'));
        // 解析 server 配置 → McpToolDeclaration[]
        this.#declarations.push(...parseMcpConfig(config));
      }
    }
    return this.#declarations;
  }
}
```

**AgentModule 集成**：
```typescript
c.singleton('mcpToolDeclarations', async (ct) => {
  const discovery = new McpToolDiscovery();
  return discovery.discover(resolveProjectRoot(ct));
});
```

---

#### P3.6 HookSystem 集成到 AgentRuntime

**目标**：将 HookSystem 注入 AgentRuntime，桥接 Pipeline 中间件和 AgentEventBus。

**现状分析**（`ToolExecutionPipeline.ts`）：
- 5 个默认中间件：`allowlistGate`、`observationRecord`、`trackerSignal`、`traceRecord`、`submitDedup`
- 2 个可选中间件：`progressEmitter`、`eventBusPublisher`（由 `#processToolCalls` 手动处理）
- `AgentEventBus`：全局单例，15 个事件类型
- `SignalBus`：基础设施级事件总线，用于跨模块信号（搜索、guard、evolution 等）

**迁移策略（渐进式，不一次性替换）**：

**Phase A — AgentRuntime 注入 HookSystem**：
```typescript
// AgentRuntime constructor 增加可选 hookSystem
constructor(config: RuntimeConfig) {
  // ...existing code...
  this.#hookSystem = config.hookSystem ?? new HookSystem();
}

// reactLoop 中在关键点 emit
// #shouldExit 前:
this.#hookSystem.emitSync('agent:iteration:before', { iteration: ctx.iteration, phase: ctx.tracker?.phase });
// #shouldExit 判定退出时:
this.#hookSystem.emitSync('agent:exit', { reason: signal.reason, iteration: ctx.iteration, detail: signal.detail });
// #callLLM 前后:
this.#hookSystem.emitSync('llm:call:before', { iteration: ctx.iteration, toolChoice });
this.#hookSystem.emitSync('llm:call:after', { iteration: ctx.iteration, hasToolCalls, hasText, ...usage });
```

**Phase B — AgentEventBus 桥接**：
```typescript
// registerDefaultHooks 中桥接
export function registerDefaultHooks(hookSystem: HookSystem) {
  const bus = AgentEventBus.getInstance();

  hookSystem.on('llm:call:before', (p) => {
    bus.publish(AgentEvents.LLM_CALL_START, { iteration: p.iteration });
  });
  hookSystem.on('llm:call:after', (p) => {
    bus.publish(AgentEvents.LLM_CALL_END, {
      hasToolCalls: p.hasToolCalls, hasText: p.hasText, usage: { inputTokens: p.inputTokens, outputTokens: p.outputTokens }
    });
  });
  hookSystem.on('tool:execute:before', (p) => {
    bus.publish(AgentEvents.TOOL_CALL_START, { tool: p.toolId });
  });
  hookSystem.on('tool:execute:after', (p) => {
    bus.publish(AgentEvents.TOOL_CALL_END, { tool: p.toolId, durationMs: p.durationMs, success: p.ok });
  });
}
```

**Phase C — Pipeline 中间件逐步迁移**（最后执行，高风险）：
- `eventBusPublisher` → 通过 Phase B 桥接自动覆盖，移除手动 `bus.publish` 调用
- `progressEmitter` → 映射到 `tool:execute:before` / `tool:execute:after`
- `allowlistGate` / `submitDedup` → 保留在 Pipeline 中（blocking 语义复杂，不适合 fire-and-forget 的 Hook）
- `observationRecord` / `trackerSignal` / `traceRecord` → 保留（紧耦合 LoopContext 和 tracker 状态）

---

#### P3.7 toProjectedMessages 接入 #callLLM

**目标**：当 L3 collapse 激活时，`#callLLM` 使用 `toProjectedMessages()` 而非 `toMessages()` 发送给 LLM。

**现状分析**（`AgentRuntime.ts:664-665`）：
```typescript
const unifiedMessages = ctx.messages.toMessages() as UnifiedMessage[];
```
- `toMessages()` 在 `ContextWindowAdapter` 中委托给 `ContextWindow.toMessages()`，返回原始引用
- `toProjectedMessages()` 已在 `ContextWindow` 中实现，但 `MessageAdapter` 和 `ContextWindowAdapter` 尚未暴露

**落地方案**：

1. **MessageAdapter 增加 toProjectedMessages**：
```typescript
// MessageAdapter.ts — 基类增加
toProjectedMessages(): unknown[] {
  return this.toMessages(); // 默认等同于 toMessages
}

// ContextWindowAdapter — override
toProjectedMessages() {
  return this.#ctxWin.toProjectedMessages();
}
```

2. **AgentRuntime.#callLLM 使用投影**：
```typescript
// 替换 toMessages() → toProjectedMessages()
const unifiedMessages = ctx.messages.toProjectedMessages() as UnifiedMessage[];
```

3. **末轮摘要调用仍使用 toMessages()**（`#processToolCalls:1005`），确保摘要 LLM 看到完整历史。

---

#### P3.8 Token 估算增强

**目标**：`ContextWindow.estimateTokens()` 增强为包含 system prompt + tool schemas 的全量估算。

**现状分析**：
- `estimateTokensFast(text.length / 3.5)` — 纯字符长度估算，不含 system prompt 和 tool schemas
- system prompt 在 `#prepareIteration` 中构建，长度约 2000-8000 chars（500-2300 tokens）
- tool schemas 每个工具约 200-500 chars（50-150 tokens），40 工具总计约 2000-6000 tokens

**落地方案**：
```typescript
// ContextWindow.ts — 新增方法
estimateFullContextTokens(systemPromptChars?: number, toolSchemaCount?: number): number {
  const messageTokens = this.estimateTokens();
  // System prompt: 未传入时使用经验默认值
  const promptTokens = systemPromptChars
    ? Math.ceil(systemPromptChars / 3.5)
    : 1500;  // ~5000 chars 的默认 system prompt
  // Tool schemas: 每工具约 100 tokens
  const toolTokens = (toolSchemaCount ?? 0) * 100;
  return messageTokens + promptTokens + toolTokens;
}

// getTokenUsageRatio 改用全量估算
getTokenUsageRatio(systemPromptChars?: number, toolSchemaCount?: number) {
  return this.estimateFullContextTokens(systemPromptChars, toolSchemaCount) / this.#tokenBudget;
}
```

**AgentRuntime 传入实际值**：
```typescript
// #prepareIteration 中压缩检查前传入 system prompt 长度
const compactResult = messages.compactIfNeeded(
  effectiveSystemPrompt.length,
  ctx.toolSchemas.length
);
```

---

#### P3.9 Tool Lazy Loading 运行时接入

**目标**：`#callLLM` 使用 `toMixedSchemas`，`#processToolCalls` 后 `markExpanded`。

**前置条件**：P3.4（AgentModule 迁移到 UnifiedToolCatalog）完成后才能执行。

**落地方案**：
```typescript
// AgentRuntime.#getToolSchemas — 使用 mixed schemas
#getToolSchemas(allowedTools: unknown[], model?: string): ToolSchemaProjection[] {
  const ids = allowedTools.map(String);
  const catalog = this.#getCatalog();
  if (catalog?.toMixedSchemas) {
    return catalog.toMixedSchemas(ids, model, this.iterationCount === 0);
  }
  // fallback
  return catalog?.toToolSchemas?.(ids) ?? [];
}

// AgentRuntime.#processToolCalls — 执行后标记 expanded
async #processToolCalls(ctx, llmResult, effectiveSystemPrompt) {
  // ...existing tool execution...
  // 标记本轮使用的工具
  const catalog = this.#getCatalog();
  for (const fc of llmResult.functionCalls || []) {
    catalog?.markExpanded?.(fc.name);
  }
  // ...rest of method...
}
```

---

#### P3.10 Per-model 工具描述覆盖模板

**目标**：为 DeepSeek / Claude / GPT 编写核心工具的描述覆盖。

**落地方案**：基于模型差异设置不同描述风格：

| 模型族 | 描述风格 | 关键差异 |
|--------|----------|----------|
| DeepSeek | 直接指令式，无 XML | 对嵌套 JSON 理解较弱，需要简化 schema |
| Claude | 结构化 XML 标签 | 擅长遵循格式指令 |
| GPT | 自然语言描述 | 上下文理解强，可用更丰富的描述 |

```typescript
// 示例：在 ToolDefinitionV2 中设置
const searchProjectCode: ToolDefinitionV2 = {
  id: 'search_project_code',
  description: '在项目代码中搜索匹配的内容...',
  modelOverrides: {
    'deepseek-*': {
      description: '搜索项目代码。参数: pattern(正则), fileFilter(可选, 如*.ts)。返回匹配行和文件路径。',
    },
  },
  // ...
};
```

**实施节奏**：先为使用频率最高的 5 个工具添加覆盖（`search_project_code`、`read_project_file`、`submit_with_check`、`list_project_structure`、`semantic_search_code`），观察效果后再扩展。

---

### Future Work（暂缓）

- [ ] **Streaming ReAct** — LLMGateway.streamChatWithTools + 事件发射
- [ ] **TaskTool / 子代理** — 独立 ContextWindow + 摘要返回
- [ ] **事件流协议** — AgentEvent + HTTP SSE
- [ ] **前端联动** — 流式渲染 / 审批交互 / 上下文可视化

---

## 6. 代码审计 — 接口校准与边界情况

> 基于 3 轮代码审计（ExitController 相关 / 工具系统 / ContextWindow + 事件系统），
> 以下为文档设计与实际代码接口的**偏差修正**和**边界情况补充**。

### 6.1 类型名与路径修正

| 文档中 | 实际代码 | 说明 |
|--------|----------|------|
| `AgentRunResult` | **`AgentResult`** | `AgentRuntimeTypes.ts:149-160`，无 `AgentRunResult` 导出 |
| `LoopContext` 在 `AgentRuntimeTypes.ts` | **`LoopContext` 在独立文件** `lib/agent/runtime/LoopContext.ts:77-159` | `AgentRuntimeTypes.ts` 只有 `ReactLoopOpts` 和 `AgentResult` |
| `ToolHandler` 独立类型 | **不存在** | handler 类型内联在 `ToolDefinition` 中：`(...args: never[]) => unknown`，需显式定义 |
| `CompactResult` 导出类型 | **不存在** | `compactIfNeeded()` 返回推断类型 `{ level: 0\|1\|2\|3; removed: number }`，未 export |
| `ToolResultQuota` | **未 export** | `ContextWindow.ts:76-79` 内部 interface |
| `BeforeVerdict` / `ToolMiddleware` / `ToolCall` | **均未 export** | `ToolExecutionPipeline.ts` 内部 interface |
| `ExplorationTracker` 路径 | 实际为 `lib/agent/context/ExplorationTracker.ts` | 无 `exploration/` 子目录 |

### 6.2 ExitController — 接口兼容性校准

**`StepState` 索引签名**（`Policy.ts:10-14`）：

```typescript
export interface StepState {
  iteration: number;
  startTime: number;
  [key: string]: unknown;    // ← 索引签名允许扩展
}
```

**兼容性结论**：`totalTokens` / `totalInputTokens` 可直接传入 `validateDuring(stepState)`，**无需修改 `StepState` 接口**。但建议仍显式扩展接口以获得类型安全。

**`BudgetPolicy.validateDuring` 返回类型**：

```typescript
// 实际返回（BudgetPolicy.ts:42-58）
{ ok: boolean; action: string; reason?: string }
// 而非简单 boolean — ExitController 需解析 action/reason 字段
```

**`#processTextResponse` 是同步方法**（返回 `boolean`，非 `Promise<boolean>`），ExitController 的 `onTextResponse()` 需对应设计为同步。

**`ExplorationTracker.onTextResponse` 返回复合对象**：

```typescript
{ isFinalAnswer: boolean; needsDigestNudge: boolean; shouldContinue: boolean; nudge: string | null }
```

ExitController 吸收此逻辑时需处理 `needsDigestNudge`（注入 digest nudge 到消息流）和 `shouldContinue`（非终答但需继续），不能简单映射为 exit/continue 二选一。

**`ExplorationTracker.endRound` 返回值**：

```typescript
null | { type: 'phase_transition'; text: string }
```

ExitController 需在 `onToolCallsProcessed` 中调用 `tracker.endRound()` 并处理返回的 phase_transition nudge 文本注入。

**边界情况 — `#callLLM` 的 CONTINUE 路径**：`#callLLM` 返回 `LLMResult` 对象（非 null）但 `type === LLMResultType.CONTINUE` 时，`reactLoop` 执行 `continue`（跳过本轮工具/文本处理）。ExitController 的 `onLLMResult()` 需区分 `null`（退出）、`CONTINUE`（重试）、正常结果三种。

**边界情况 — graceful exit + toolChoice 违反**：当 `isGracefulExit=true` 但 LLM 仍返回 tool calls 时，现有逻辑检查是否有 `text` 可用作终答。ExitController 需保留此分支（`AgentRuntime.ts:782-785`）。

### 6.3 ToolDefinitionV2 — 接口兼容性校准

**现有 `ToolDefinition`**（`ToolDefinition.ts:35-41`）：

```typescript
export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  metadata?: ToolMetadata;
  handler: (...args: never[]) => unknown;
}
```

**V2 桥接层 `fromV1` 的精确映射**：

| V1 字段 | V2 字段 | 转换 |
|---------|---------|------|
| `name` | `id` | 直接映射 |
| `description` | `description` | 直接映射 |
| `parameters` | `inputSchema` | 直接映射（已是 JSON Schema 子集） |
| `metadata` | `risk` / `governance` / `execution` | 需复用 `withToolCapabilityMetadata` + `createInternalToolManifest` 逻辑 |
| `handler` | `handler` | 直接映射，但需 **显式定义 `ToolHandler` 类型别名** |

**⚠️ `ToolMetadata`（`ToolDefinition.ts`）与 `ToolMetadata`（`ToolExecutionPipeline.ts:43-51`）名称冲突**：
- `ToolDefinition.ts` 的 `ToolMetadata` 是工具元数据（owner/lifecycle/surface/sideEffect 等）
- `ToolExecutionPipeline.ts` 的 `ToolMetadata` 是执行元数据（blocked/cacheHit/isNew/isSubmit 等）
- V2 设计需使用不同的命名避免混淆，建议：`ToolDefinitionMeta` vs `ToolExecMeta`

**`CapabilityCatalog.toToolSchemas` 当前签名**（`CapabilityCatalog.ts:65-71`）：

```typescript
toToolSchemas(ids?: string[]): ToolSchemaProjection[]
// 不接受 model 参数 — 需要扩展接口
```

**`ToolSchemaProjection` 当前定义**（`CapabilityManifest.ts:108-113`）：

```typescript
export interface ToolSchemaProjection {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}
```

Lazy Loading 的 `LightweightToolProjection` 需要在 `parameters` 上做区分 — `ToolSchemaProjection` 的 `parameters` 是 **required**，lightweight 投影若不含 parameters 则需用不同类型或设为 `optional`。

**`ToolRouter` 构造函数**（`ToolRouter.ts:29-36`）：

```typescript
interface ToolRouterOptions {
  catalog: CapabilityCatalog;
  governance?: GovernanceEngine;
  adapters?: ToolExecutionAdapter[];
  projectRoot?: string;
  dataRoot?: string;
  services?: ToolServiceLocator;
}
```

`UnifiedToolCatalog` 替代 `CapabilityCatalog` 时，需要实现相同的 `getManifest` / `list` 接口，或让 `UnifiedToolCatalog extends CapabilityCatalog`，以保证 `ToolRouter` 无需修改构造函数类型。

**`McpToolAdapter` 构造函数**（`McpToolAdapter.ts:14-16`）：

```typescript
constructor(executeTool: McpToolExecutor)
// McpToolExecutor = (toolName: string, args: Record<string, unknown>, request: ToolExecutionRequest) => Promise<unknown>
```

AgentModule 注入时需提供 `McpToolExecutor` 实例，这意味着需要一个 MCP handler 分发器来桥接 `McpServer` 的 handler 表。

### 6.4 ContextWindow — 接口兼容性校准

**`toMessages()` 返回引用而非拷贝**（`ContextWindow.ts:436-438`）：

```typescript
toMessages() { return this.#messages; }
```

L3 Collapse 的读时投影设计 **不能** 修改 `toMessages()` 的默认行为（否则破坏现有所有消费者）。建议：
- 新增 `toProjectedMessages()` 方法返回折叠后的视图
- `#callLLM` 改为调用 `toProjectedMessages()`
- 保留 `toMessages()` 返回原始引用（向后兼容）

**`#messages` 修改点**（需在 Collapse 时全部考虑）：

| 操作 | 位置 | 说明 |
|------|------|------|
| `push` | 214, 223, 245, 254, 271 | append 系列方法 |
| `splice` | 364 (L3), 403 (#spliceAndSummarize) | 压缩删除 |
| `content` 原地修改 | 318-323 (L1) | 截断 |
| `length = 1` | 509 (resetToPromptOnly) | 保留首条 |
| `= []` | 527 (resetForNewStage) | 清空 |

L3 Collapse 需在所有 `push` 后更新 `#collapseThreshold`（若新消息在折叠区后面则不影响，但 `resetToPromptOnly/resetForNewStage` 需重置 threshold）。

**`compactIfNeeded()` 不含 `async`**：现有 L1-L3 均为同步操作。L4 Auto-compact 需要调 LLM，必须改为 `async compactIfNeeded()`。这会影响 `MessageAdapter.compactIfNeeded()` 和 `AgentRuntime.#prepareIteration` 中的调用（当前非 await）。

**边界情况 — `messages.length <= 4` 跳过压缩**：当前逻辑在 `compactIfNeeded` 开头检查，5 层方案需保留此检查但仅对 L1+ 生效（L0 配额降档应始终生效）。

### 6.5 HookSystem — 避免重复实现

**已有类似系统 — `SkillHooks`**（`lib/service/skills/SkillHooks.ts`）：
- 提供 `tap` / `run` 等多模式钩子
- 与 `ToolExecutionPipeline` 中间件是不同子系统
- HookSystem 设计时需 **复用或对齐** `SkillHooks` 的模式，避免项目中出现第三套钩子系统

**`ToolExecutionPipeline` 内部类型未导出**：
- `ToolMiddleware`、`BeforeVerdict`、`ToolCall`、`ToolExecContext`、`ToolMetadata`（Pipeline 版）均为内部 interface
- HookSystem 迁移这些中间件时需 **先 export 或重新定义** 这些类型

**`AgentEvents` 事件名常量**（`AgentEventBus.ts:17-46`）：
- 已有 `TOOL_CALL_START`、`TOOL_CALL_END`、`PROGRESS`、`AGENT_CREATED` 等
- HookSystem 的 `tool:execute:before/after` 与 `TOOL_CALL_START/END` 语义重叠
- 桥接时需确保事件 payload 格式兼容

**`SignalBus` 的 `Signal` 类型**（`SignalBus.ts:33-46`）：

```typescript
interface Signal {
  type: SignalType;    // 枚举，非自由字符串
  source: string;
  target: string | null;
  value: number;
  metadata: Record<string, unknown>;
  timestamp: number;
}
```

HookSystem 桥接 SignalBus 时，`HookPayload` 需能映射到 `Signal` 的 `type/source/value/metadata` 结构。

### 6.6 Token 估算 — 避免重复实现

**项目内已有多个 token 估算/预算模块**：

| 模块 | 位置 | 用途 |
|------|------|------|
| `estimateTokensFast` | `lib/shared/token-utils.ts:42-47` | `ceil(length/3.5)`，ContextWindow 内部 |
| `estimateTokens` | `lib/shared/token-utils.ts` | 另一个估算函数（可能更精确） |
| `ActiveContext.#estimateTokens` | `ActiveContext.ts` | 活跃上下文 token 估算 |
| `MemoryCoordinator.#estimateTokens` | `MemoryCoordinator.ts` | 记忆 token 估算 |
| `TokenBudget` | `lib/service/delivery/TokenBudget.ts` | Cursor 规则投递用，re-export `estimateTokens` |
| `SessionStore` | 按 `tokenBudget` 截断 | 对话历史 token 预算 |

**建议**：5 层 Compaction 的 `estimateFullContextTokens()` 应统一使用 `token-utils.ts` 中的函数，不新增估算实现。新增的是"如何累计 system prompt + tool schemas"的包装逻辑。

### 6.7 关键边界情况汇总

| 场景 | 涉及模块 | 风险 | 对策 |
|------|----------|------|------|
| `tracker` 有/无两种模式 | ExitController | 无 tracker 时迭代由 BudgetPolicy 管，有 tracker 时 iteration=0 绕过 | ExitController 内部分支处理 |
| L4 LLM 摘要失败 | ContextWindow | 网络错误 / 熔断 / 超时 | 降级为 L3 模板摘要，标记 `degraded` |
| `toMessages()` 返回引用 | L3 Collapse | 外部消费者直接修改消息 | 新增 `toProjectedMessages()` 不改原方法 |
| `compactIfNeeded` 变 async | MessageAdapter | `SimpleArrayAdapter` 无需 async | 保持 sync 签名，L4 路径内部 fire-and-forget 或标记 pending |
| MCP handler 分发 | McpToolAdapter | AgentModule 无 MCP handler 表 | 新增 `McpHandlerRegistry` 或复用 `McpServer` 的 handler 映射 |
| Pipeline `ToolMetadata` 名称冲突 | ToolDefinitionV2 | `ToolMetadata` 在两处含义不同 | V2 使用 `ToolDefinitionMeta` / `ToolExecMeta` 区分 |
| `ToolSchemaProjection.parameters` 必填 | Lazy Loading | lightweight 投影无 parameters | 扩展类型为 `parameters?: ...` 或用 union type |
| `BudgetPolicy` 返回值格式 | ExitController | 返回 `{ ok, action, reason }` 非 boolean | ExitController 解析 action/reason 映射到 ExitReason |
| Forge 临时工具 | UnifiedToolCatalog | `projectForgedTool` 动态注册 | V2 Catalog 需支持运行时 register/unregister |
| `allowlistGate` 的 `TemporaryToolRegistry` | HookSystem | 白名单检查需访问 Forge 状态 | Hook payload 需携带 `isTemporary` 信息 |

---

## 7. 参考

- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) — Codex ReAct 循环 + prompt caching
- [Unlocking the Codex harness: App Server](https://openai.com/index/unlocking-the-codex-harness/) — JSON-RPC 协议设计
- [Codex Sandbox & Approvals](https://developers.openai.com/codex/concepts/sandboxing/) — 沙箱与审批正交设计
- [Dive into Claude Code (arXiv)](https://arxiv.org/html/2604.14228v1) — 完整架构分析论文
- [Claude Code Architecture & Internals](https://cc.bruniaux.com/guide/architecture/) — 8 工具 + 5 层 compaction
- [VILA-Lab/Dive-into-Claude-Code](https://github.com/VILA-Lab/Dive-into-Claude-Code) — 7 组件 5 层架构
- [Towards self-driving codebases](https://www.engineering.fyi/article/towards-self-driving-codebases) — Cursor 递归 planner-worker
- [Cursor long-running agents](http://www.cursor.com/blog/long-running-agents) — plan-first + verification loop
- [How AI Coding Agents Actually Work](https://akshayghalme.com/blogs/how-ai-coding-agents-actually-work/) — 7 工程问题对比
- [How AI Coding Agents Work: Models, Context, Sessions, Memory](https://www.abstractalgorithms.dev/how-ai-coding-agents-work) — 3 层记忆架构
