# Alembic Agent 子系统 — 修复计划

> 配套文档：[agent-runtime-deep-dive.md](agent-runtime-deep-dive.md) §15。
> 本文档把 §15 列出的 38 条风险项落到**可执行的工程任务**：每条都给出
> 已验证状态、变更范围、最小代码方案、验证手段、影响面与排期波次。

---

## 0. 验证修订（基于源码 re-check）

re-check 后对若干条目作如下修订：

| 编号 | 原结论 | 修订 |
|------|--------|------|
| **H2** AgentEventBus.request 超时清理 | Medium 泄漏 | **撤销** —— 实际已在超时与 reply 路径删除 `pendingReplies`（[AgentEventBus.ts](lib/agent/AgentEventBus.ts) ~L105/L123）。本项不再列入修复计划。 |
| **F2** FanOut 默认并发 | "未声明层无限并发" | **部分确认** —— `tier 1` 默认 `concurrency: 3`（[strategies.ts](lib/agent/strategies.ts) L188）；但**未声明的 tier 仍走 p-limit 默认**，且 tier 内 item 失败时聚合策略未显式表达，仍需修复。 |
| **A8** forced-summary 失败兜底 | Medium | **加重** —— 验证发现 user 模式无 try/catch 兜底，AI 抛错时 `finalReply` 为空字符串；同时 forced-summary 本地回退路径不会累计 token，会出现"实际花费 ≠ 上报花费"。新增子任务 A8a / A8b。 |
| **C2** ContextWindow `messages[0]` 不变量 | Low | 维持 —— 不变量靠下标，需独立字段持有原始 prompt。 |

新发现的相关问题：

- **A8a** `forced-summary.ts` 中 user 模式分支无 catch-all 兜底，LLM 失败直接抛出；
- **A8b** forced-summary 本地"结构化兜底"路径下 `tokenUsage` 不被累计，监控失真；
- **D6**（新增 Low）`ToolRegistry.execute` 把异常序列化为 `{ error }` 时丢失 stack/cause，难以排障。

---

## 1. 整体策略

### 1.1 三波交付

| 波次 | 目标 | 主题 | 大致范围 |
|------|------|------|----------|
| **P0 — Hardening** | 阻止数据损坏 / 安全 / 长期泄漏 | 并发安全、Sandbox、Conv 写入、生命周期 | A1 / I1 / E1 / G2 / A2 / H3 |
| **P1 — Reliability** | 提升正确性与可观测性 | 兜底、预算、缓存、checkpoint、工具异常 | A3 / A5 / A6 / A7 / A8(a/b) / A9 / B1 / B3 / D2 / D3 / F1~F4 |
| **P2 — Polish** | 类型 / 文档 / 边界打磨 | 类型固化、nudge 去重、Tracker 转移表、配置校验 | C1 / C2 / C3 / C4 / D1 / D4 / D5 / D6 / I2 / I3 / I4 / I5 / G1 / G3 / G4 / B2 / B4 / B5 / E2 / E3 / E4 / F5 / H1 |

### 1.2 三个跨切前置改造

很多问题的根因相同，先做三件"基础设施改造"，让后续修复成本降到最低：

#### **PRE-1 引入 `RuntimeInvocation` 上下文**（依赖：P0 多项）

- 现状：`AgentRuntime` 把 `iterationCount` / `toolCallHistory` / `tokenUsage` /
  `#toolPipeline` / `#promptBuilder` 等绑在实例字段上 → 并发执行时互相覆盖
  （A1 / I1 根因）。
- 改造：新建 `core/RuntimeInvocation.ts`（或扩展现有 `LoopContext`），在
  `execute()` 入口构造**单次调用上下文**，把所有可变状态、私有协作者
  全部放进去；Runtime 实例字段降级为只读"原型/工厂"。
- 影响面：`AgentRuntime` 主类、`strategies.ts`、`PipelineStrategy.ts`、
  `forced-summary.ts` 调用处、所有 `runtime.toolCallHistory.push(...)` 现存
  访问点（grep `runtime\.(toolCallHistory|tokenUsage|iterationCount)` 评估）。
- 替代降级方案（若 PRE-1 风险过大）：在 `FanOutStrategy` 内部对每个分支
  调 `factory.createRuntime(preset, overrides)` 派生子 Runtime，**禁止跨分支共享同一实例**。
  这条作为 PRE-1 的回退方案，单独完成即可解 A1/I1，但 A9/A3/A5 等仍需
  各自局部修复。

#### **PRE-2 标准化 `AgentRuntime.dispose()` 生命周期**（依赖：A2 / H3 / E3）

- 在 Runtime 上新增：
  ```ts
  async dispose(): Promise<void>
  ```
  统一关闭：bus 订阅、timers、AbortController、`MemoryCoordinator`/
  `ContextWindow` 中持有的资源、`TemporaryToolRegistry` 会话级清理等。
- 在 `AgentFactory.createRuntime(...)` 返回前注册到全局
  `runtimeRegistry`，由 `AgentFactory.shutdownAll()` 兜底清理；HTTP/MCP/Lark
  入口处在请求结束 / 进程关闭时统一调用。
- 不强制改 caller —— 但增加 lint：长期持有 Runtime 必须显式 dispose。

#### **PRE-3 工具 schema 增加 `cacheable` / `maxResultBytes` 字段**（依赖：B1 / A7）

- `ToolDefinition` 增加可选字段：
  ```ts
  cacheable?: boolean      // 默认 true，写通工具需显式 false
  maxResultBytes?: number  // 默认 64 KB，超出由 pipeline 截断
  recursionAllowed?: boolean // 与 D5 联动
  ```
- `cacheCheck` 中间件改为读 `tool.cacheable !== false`，废弃硬编码黑名单
  `NON_CACHEABLE`。
- 新增 `resultSizeGuard` 中间件，基于 `maxResultBytes` 截断（A7）。

---

## 2. 详细任务清单

下列任务表格每行包含：编号、标题、波次、文件、最小变更、验证手段、估算量级（S=半天 / M=1-2 天 / L=>2 天）。

### 2.1 P0 —— 并发安全 / 安全 / 数据持久化（必须先行）

| ID | 标题 | 文件 | 关键变更 | 验证 | 量级 |
|----|------|------|----------|------|------|
| **A1 + I1 + A9** | 并发安全 + 调用上下文 | [AgentRuntime.ts](lib/agent/AgentRuntime.ts)、[core/LoopContext.ts](lib/agent/core/LoopContext.ts)、[strategies.ts](lib/agent/strategies.ts) | 走 PRE-1：`#toolPipeline` / `#promptBuilder` / `iterationCount` / `toolCallHistory` / `tokenUsage` 全部下沉到 `RuntimeInvocation`；`FanOutStrategy.execute` 不再共享 runtime 实例字段，结果合并通过 invocation 收集 | 新增并发用例：FanOut N=8，断言 `tokenUsage` 等于各分支求和、`toolCallHistory` 无交叉、`iterationCount` 单分支独立 | L |
| **E1** | SandboxRunner 强化 | [forge/SandboxRunner.ts](lib/agent/forge/SandboxRunner.ts) | 短期：白名单收紧 —— 移除/冻结 `Object.constructor`、`Function`、`Reflect`，禁止 `setTimeout`/`Promise` 反射；长期：评估迁到 `isolated-vm` 或子进程沙盒（独立 task） | 新增逃逸用例：`({}).constructor.constructor('return process')()` 应抛错；超时控制单测 | M (短期) / L (迁移) |
| **G2** | ConversationStore 写并发 | [ConversationStore.ts](lib/agent/ConversationStore.ts) | per-conversationId 串行队列（进程内 `Map<id, Promise>` 链化）；保留 `appendFileSync` 实现，但所有 append 走队列；可选项：写入失败时落到 `*.broken.jsonl` | 并发用例：100 个并行 `append(sameId, ...)`，断言行数 = 100 且每行 JSON.parse 通过 | M |
| **A2 + H3** | Runtime 生命周期 + dispose | [AgentRuntime.ts](lib/agent/AgentRuntime.ts)、[AgentFactory.ts](lib/agent/AgentFactory.ts) | 走 PRE-2：实现 `dispose()`、`AgentFactory.shutdownAll()`；HTTP/MCP/Lark transport 关闭时调用；Bus 订阅在 dispose 中 unsubscribe；构造期登记 / dispose 时摘除 | 长跑用例：循环 1000 次 `factory.createChat → dispose`，断言 `AgentEventBus.listenerCount(...)` 不增长；`process.memoryUsage().heapUsed` 不持续上升 | M |

> **执行顺序**：先做 PRE-1 → 同步修 A1+I1+A9；并行启动 PRE-2、E1（短期收紧）、G2。
> P0 不必等到 E1 长期方案完成即可发布。

---

### 2.2 P1 —— 可靠性与可观测性

| ID | 标题 | 文件 | 关键变更 | 验证 | 量级 |
|----|------|------|----------|------|------|
| **A3 + A5 + A6** | 错误计数 / token 计费 / rollback 单一入口 | [AgentRuntime.ts](lib/agent/AgentRuntime.ts) `#callLLM` 系列；新建 `core/RetryAccountant.ts` | 把"重试时如何处理 token / iteration / counter"提取为单一函数，由 source/phase 决定；rollback 时同步回滚最近一次 `usage` 增量；`consecutiveAiErrors` 在每轮起点显式置 0 | 单测覆盖：(a) 空响应 → 重试 → token 总数等于真实最终一次；(b) rollback 抛错下次成功 counter 回 0；(c) system+SUMMARIZE 路径与 user 路径行为一致表 | M |
| **A7** | 工具结果体积守门 | [core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts)、`ToolDefinition` schema | 走 PRE-3：新增 `resultSizeGuard` 中间件，超出 `maxResultBytes` 截断 + 注入 `__truncated: true` 元字段；为 `search_project_code` / `read_project_file` / `query_code_graph` 等显式声明上限 | 单测：构造 5 MB 字符串结果，断言被截到上限 ± schema overhead；e2e：长 ReAct 循环不再触发 L3 抹除 | M |
| **A8 + A8a + A8b** | forced-summary 兜底与计费 | [forced-summary.ts](lib/agent/forced-summary.ts)、[AgentRuntime.ts](lib/agent/AgentRuntime.ts) `#finalize` | (a) user 分支补 try/catch；(b) AI 失败时回退为本地"结构化摘要"（直接序列化 `toolCallHistory` 关键字段 + tracker stats）；(c) 本地兜底也累加估算 token（以字符 ÷ 4 估算）并打 `degraded: true` 元字段 | 单测：mock aiProvider 抛错；断言不抛、返回非空字符串、结果含 `degraded` 标记；token usage 非 0 | S-M |
| **A9** | toolCallHistory 增长 | [AgentRuntime.ts](lib/agent/AgentRuntime.ts) | PRE-1 内附带处理：`RuntimeInvocation` 内的 history 在 dispose 时释放；常驻聊天会话以 `maxHistorySize`（默认 500）做滚动 | 单测：构造 1000 次 push，断言长度 ≤ 500 且最近条目保留 | S |
| **B1** | 缓存改 schema 驱动 | [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts)、[memory/SessionStore.ts](lib/agent/memory/SessionStore.ts)、[memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts) | 走 PRE-3：`cacheCheck` 中间件读 `tool.cacheable`；保留 `NON_CACHEABLE` 作为兼容降级 1-2 个版本，加 `// TODO: remove after migration` | 单测：写通工具显式声明后不再缓存；旧黑名单条目仍生效；扫描所有 tool 定义补声明 | M |
| **B3** | Checkpoint 原子写 | [memory/SessionStore.ts](lib/agent/memory/SessionStore.ts)、[memory/MemoryStore.ts](lib/agent/memory/MemoryStore.ts) | 抽 `atomicWriteJson(path, data)`：`writeFileSync(tmp)` → `fsyncSync` → `renameSync(tmp, path)`；保留上一份 `*.bak` | fault injection：写入中模拟崩溃（kill -9 子进程），断言下次启动可加载 bak | S-M |
| **D2** | 工具重复注册告警 | [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `register()` | 默认抛 `Error('tool already registered: ' + name)`；新增 `register(def, { replace: true })` 显式覆盖；现有调用方一次性扫描更新 | 单测：重复注册抛错；带 replace 选项不抛；现有所有 register 调用通过 lint | S |
| **D3 + D6** | 工具异常归类 | [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `execute()`、[core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts) | `execute()` 区分 `result vs failure`，`failure` 携带 `{ message, stack, cause, code }`；pipeline 增加 `consecutiveToolFailures` 计数与触发熔断；同时把 failure 透传给 LLM（用 `tool_error` 字段而非 `error: msg` 字符串）便于模型纠错 | 单测：handler 抛错 → pipeline 收到 failure 而非 result；连续 3 次失败触发降级 | M |
| **F1** | Pipeline 全局预算累计 | [PipelineStrategy.ts](lib/agent/PipelineStrategy.ts) | 在 strategy 内维护 `consumedBudget = { iterations, tokens, ms }`；每次 stage / retry 结束累计；触顶时强制 `degrade` 而非继续 retry | 单测：构造一个总会重试的 evaluator，断言策略在全局预算用尽后停止；不再溢出 BudgetPolicy | M |
| **F2** | FanOut 默认并发 | [strategies.ts](lib/agent/strategies.ts) `FanOutStrategy` | 引入 `defaultConcurrency`（如 3），未声明 tier 也使用；暴露 `concurrency` / `tiers` 二选一 API | 单测：tiers 留空时不超并发；声明 tier 时按 tier 限制 | S |
| **F3** | FanOut 错误模式显式化 | 同上 | 类型扩展 `errorMode: 'fail-fast' \| 'continue'`，结果增加 `failures: { itemId, error }[]`；默认 `continue`（与现状一致）但显式 | 单测：`fail-fast` 在第一个失败处中断；`continue` 收集所有失败 | S-M |
| **F4** | Stage Gate 异常捕获 | [PipelineStrategy.ts](lib/agent/PipelineStrategy.ts) | 包装 `gate.evaluator(...)`；异常 → `degrade` + 记录 `gateError`；同时记录到 EventBus | 单测：gate 抛错 → strategy 降级、不抛 | S |

---

### 2.3 P2 —— 边界与打磨

| ID | 标题 | 文件 | 关键变更 | 量级 |
|----|------|------|----------|------|
| **C1** | ContextWindow L4 兜底 | [context/ContextWindow.ts](lib/agent/context/ContextWindow.ts) | L3 后若仍超预算，对最后一轮工具结果调 `summarizeText()`（同步函数 / 简单截断 + 标注） | M |
| **C2** | messages[0] 不变量 | 同上 | 引入 `#originalPrompt: Message` 字段独立持有；压缩函数不再依赖下标 | S |
| **C3** | Tracker 转移表集中化 | [context/ExplorationTracker.ts](lib/agent/context/ExplorationTracker.ts) | 抽出 `PHASE_TRANSITIONS` 不可变表 + `applyTransition(current, event)` 纯函数；`DONE` 显式吸收态 | M |
| **C4** | Nudge 去重 | [context/exploration/NudgeGenerator.ts](lib/agent/context/exploration/NudgeGenerator.ts) | 维护 `recentNudges: Map<category, lastIteration>`；同类别窗口（如 3 轮）内不重复注入 | S |
| **D1** | 别名碰撞告警 | [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `#normalizeParams` | 检测多别名命中同字段时 warn 一次；优先选 schema 显式字段 | S |
| **D4** | 中间件顺序固化 | [core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts) | 中间件加 `priority?: number`；按 priority 排序，相同时按注册顺序；README 文档化 | S |
| **D5** | 递归工具深度上限 | [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) | 执行上下文携带 `callDepth`；超过 4 抛错；`composite` 工具内部调用计入深度 | S |
| **B2** | BUDGET_PROFILES 校验 | [memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts) | 构造期校验 Σ ∈ [0.95, 1.05]；超界归一化 + warn | S |
| **B4** | LRU 与并发遍历 | [memory/SessionStore.ts](lib/agent/memory/SessionStore.ts) | cleanup 改 `setImmediate(() => ...)`；或 generation 计数防迭代失效 | S |
| **B5** | PersistentMemory 命名空间 | [memory/PersistentMemory.ts](lib/agent/memory/PersistentMemory.ts) | 条目带 `projectKey`；查询/写入强制按命名空间过滤；migration 脚本补齐历史数据 | M |
| **E2** | Forge 并发去重 | [forge/ToolForge.ts](lib/agent/forge/ToolForge.ts) | `(intent,action,target)` 哈希做 in-flight Promise cache；命中复用 | S |
| **E3** | 临时工具 TTL 周期清理 | [forge/TemporaryToolRegistry.ts](lib/agent/forge/TemporaryToolRegistry.ts) | 每 N 秒 sweep；同时 PRE-2 dispose 时清空 | S |
| **E4** | 临时工具命名空间 | 同上 + [tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) | 临时工具注册到独立 sub-registry；`getToolSchemas` 按调用上下文合并；schema 严格校验后再暴露 | M |
| **F5** | AdaptiveStrategy 决策抽离 | [strategies.ts](lib/agent/strategies.ts) | 决策函数抽为纯函数；100% 单测覆盖；策略类只调用 | S |
| **G1** | 路由命中歧义 | [AgentRouter.ts](lib/agent/AgentRouter.ts) | 多规则命中时 → 走 LLM 分类而非短路；保留遥测 | S |
| **G3** | AgentMessage 输入校验 | [AgentMessage.ts](lib/agent/AgentMessage.ts) | 各 `from*` 工厂校验：content 长度 ≤ N（如 256 KB）、metadata 体积、剥离控制字符 | S |
| **G4** | IntentClassifier 命中埋点 | [IntentClassifier.ts](lib/agent/IntentClassifier.ts) | 命中时记录 `(rule_id, matched)` 到 audit log；定期回审脚本 | S |
| **H1** | AgentState 终态吸收 | [AgentState.ts](lib/agent/AgentState.ts) | 已有 catch-all `*→ABORTED/FAILED on event`；显式禁止从 COMPLETED/FAILED/ABORTED 出发的非 idempotent 转移 | S |
| **I2** | 类型固化 | [AgentRuntimeTypes.ts](lib/agent/AgentRuntimeTypes.ts) 等 | `ToolCallEntry` 用 discriminated union；`persona` / `memoryConfig` 给出最小接口 | M |
| **I3** | SystemPromptBuilder 截断 | [core/SystemPromptBuilder.ts](lib/agent/core/SystemPromptBuilder.ts) | 末尾按 token 软上限截断 + 标注；EventBus 发 `prompt.truncated` 事件 | S |
| **I4** | Preset/Policy 运行时校验 | [AgentFactory.ts](lib/agent/AgentFactory.ts) | 用 zod 描述 Preset/Policy/Capability schema；构造期一次性校验；失败抛 | M |
| **I5** | 模块依赖方向 | `domain/*` / `agent/*` | 引入 `lint` 规则（biome import-restriction 或脚本）：`domain/insight-*` 仅允许从纯类型 / 接口 import；现存反向 import 重构 | M |

---

## 3. 关键变更的最小代码草图

下面给出几个对其它任务有连带影响的代码草图，便于把控边界。

### 3.1 PRE-1 `RuntimeInvocation`

```ts
// lib/agent/core/RuntimeInvocation.ts
export class RuntimeInvocation {
  readonly id: string;
  readonly source: 'user' | 'system';
  readonly toolPipeline: ToolExecutionPipeline;
  readonly promptBuilder: SystemPromptBuilder;
  readonly abortController: AbortController;

  // 累计统计（替代 AgentRuntime 实例字段）
  iterationCount = 0;
  tokenUsage: TokenUsage = { input: 0, output: 0 };
  toolCallHistory: ToolCallEntry[] = [];

  constructor(runtime: AgentRuntime, message: AgentMessage, opts: ExecuteOpts) {
    this.id = randomUuid();
    this.source = opts.source ?? 'user';
    this.toolPipeline = runtime.buildToolPipeline(this);
    this.promptBuilder = runtime.buildPromptBuilder(this);
    this.abortController = opts.abortSignal
      ? linkAbort(opts.abortSignal)
      : new AbortController();
  }

  pushToolCall(entry: ToolCallEntry) {
    this.toolCallHistory.push(entry);
    if (this.toolCallHistory.length > MAX_HISTORY) {
      this.toolCallHistory.splice(0, this.toolCallHistory.length - MAX_HISTORY);
    }
  }

  dispose() {
    this.abortController.abort('invocation-dispose');
    this.toolCallHistory.length = 0;
  }
}
```

`AgentRuntime.execute()` 改造为：

```ts
async execute(message: AgentMessage, opts?: ExecuteOpts): Promise<AgentResult> {
  const inv = new RuntimeInvocation(this, message, opts ?? {});
  try {
    await this.policies.validateBefore(...);
    const result = await this.strategy.execute(this, message, { ...opts, inv });
    await this.policies.validateAfter(result);
    return finalize(inv, result);
  } finally {
    inv.dispose();
  }
}
```

### 3.2 PRE-2 `dispose()` 骨架

```ts
async dispose(): Promise<void> {
  if (this.#disposed) return;
  this.#disposed = true;
  for (const off of this.#busSubscriptions) off();
  this.#busSubscriptions.length = 0;
  await this.memoryCoordinator?.dispose();
  await this.contextWindow?.dispose();
  this.tempToolRegistry?.clear();
  this.bus.publish(AgentEvents.AGENT_DISPOSED, { runtimeId: this.id });
}
```

### 3.3 PRE-3 + B1 + A7 `ToolDefinition` 扩展

```ts
export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: JSONSchema;
  cacheable?: boolean;        // 默认 true
  maxResultBytes?: number;    // 默认 64 * 1024
  recursionAllowed?: boolean; // 默认 false
  handler: (params, ctx) => Promise<unknown>;
}
```

```ts
// core/ToolExecutionPipeline.ts 新增
const resultSizeGuard: ToolMiddleware = {
  name: 'resultSizeGuard',
  after(call, result, ctx) {
    const cap = ctx.tool.maxResultBytes ?? 64 * 1024;
    const json = stableStringify(result);
    if (json.length > cap) {
      ctx.replaceResult({
        __truncated: true,
        originalBytes: json.length,
        preview: json.slice(0, cap),
      });
    }
  },
};
```

### 3.4 G2 ConversationStore 串行队列

```ts
class ConversationStore {
  #queues = new Map<string, Promise<void>>();

  append(id: string, msg: Message): Promise<void> {
    const prev = this.#queues.get(id) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(() => {
      // 同步写入仍走 fs.appendFileSync，但已被串行化
      fs.appendFileSync(this.#path(id), JSON.stringify(msg) + '\n');
    });
    this.#queues.set(id, next);
    return next;
  }
}
```

### 3.5 B3 原子写

```ts
// shared/atomicWriteJson.ts
import fs from 'node:fs';
export function atomicWriteJson(target: string, data: unknown) {
  const tmp = `${target}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  const fd = fs.openSync(tmp, 'r+');
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  if (fs.existsSync(target)) fs.copyFileSync(target, `${target}.bak`);
  fs.renameSync(tmp, target);
}
```

---

## 4. 测试与回归策略

### 4.1 必须新增的测试用例（最少集合）

| 用例 | 关联问题 | 类型 |
|------|----------|------|
| FanOut N=8 并发 token/history 隔离 | A1/I1/A9 | unit + e2e |
| EventBus listenerCount 长跑稳定 | A2/H3 | long-run |
| Sandbox `({}).constructor.constructor` 逃逸应抛 | E1 | unit |
| ConversationStore 100 并发 append 行完整 | G2 | concurrency |
| Empty-response retry token 不双计 | A3 | unit |
| produceForcedSummary AI 抛错回退非空 + token 估算 | A8/A8a/A8b | unit |
| 写通工具未声明 cacheable=false 仍跨维度可见（B1 修后用 cacheable=false 不再缓存） | B1 | unit |
| Checkpoint mid-write 崩溃可恢复 | B3 | fault inject |
| 工具 handler 抛错 → consecutiveToolFailures 递增 | D3 | unit |
| Pipeline 总预算用尽强制 degrade | F1 | unit |
| FanOut 默认并发限速 | F2 | unit |
| Stage gate evaluator 抛错 → degrade | F4 | unit |
| Tracker DONE 不再回到 SEARCH | C3 | unit |
| ContextWindow L3 后超预算仍能产出消息序列 | C1 | unit |
| AgentMessage 256 KB+ content 拒绝 | G3 | unit |

### 4.2 回归基线

- 现有 `npm run test:unit` / `test:integration` 必须**全部通过**。
- 新增 `npm run test:concurrency`（vitest project 或 tag），覆盖 FanOut / Conv 写
  / EventBus 长跑。
- Forge 安全用例放在 `test/integration/sandbox.escape.test.ts`，CI 必跑。

---

## 5. 风险与回退预案

| 任务 | 主要风险 | 回退 |
|------|----------|------|
| PRE-1 / A1 | 大面积改造，可能影响 strategies / pipeline 调用方 | 退化为"FanOut 内部派生子 Runtime"方案，A9/A3/A5 局部修复 |
| E1 sandbox 收紧 | 既有 forge 生成代码可能依赖 `Function`/`Reflect` | 灰度白名单 + 失败回滚至旧上下文，记录被拒调用 |
| G2 串行队列 | 极端高并发下吞吐下降 | 按 conversationId 分桶，桶内串行、桶间并发 |
| B1 schema-driven cache | 历史工具未声明 cacheable | 黑名单作为兼容降级，发版后 1-2 个版本再移除 |
| I5 依赖方向重构 | domain/agent 互相 import 较深 | 分阶段：先加 lint warn → 渐进迁移 → 升级为 error |

---

## 6. 排期建议（T = 起始周）

| 周 | 任务 |
|----|------|
| **T+0** | PRE-1 设计 + 评审；E1 短期收紧 + 单测；G2 串行队列；A8 兜底；B3 原子写 |
| **T+1** | PRE-1 实现 + A1/I1/A9 一并落地；PRE-2 dispose；A2/H3 接入；A3/A5/A6 重试单一入口 |
| **T+2** | PRE-3 schema 改造；A7/B1/D3 联动落地；F1/F2/F3/F4 |
| **T+3** | C1/C2/C3/C4；D1/D4/D5/D6；I2/I3/I4 |
| **T+4** | B2/B4/B5；E2/E3/E4；G1/G3/G4；F5；I5 lint 启动 |
| **T+5** | 回归 + 性能对照；E1 长期方案（isolated-vm/子进程）评估与启动 |

---

## 7. 验收标准

- 所有 P0 问题在 release notes 中标注修复 + 含复现/回归用例。
- `concurrency` / `sandbox.escape` 测试套作为 CI 必跑项。
- `AgentRuntime` 暴露 `dispose()`，且全部入口（HTTP / MCP / Lark / CLI）调用。
- `ToolDefinition` 100% 工具显式声明 `cacheable` / `maxResultBytes`。
- `npm run lint` 通过；新增依赖方向 lint 至少为 warn。
- 长跑回归：连续运行 24h chat 流量 + 一次完整 bootstrap，
  `process.memoryUsage().heapUsed` 增长 < 5%，无 EventBus 监听器泄漏。

---

## 8. 与现有架构的契合度

本计划**不引入新概念**，所有新增物均在现有架构边界内：

- `RuntimeInvocation` 是 `LoopContext` 的自然扩展；
- `cacheable` / `maxResultBytes` 是 `ToolDefinition` 自然字段；
- `dispose()` 是 Runtime 生命周期补完；
- `atomicWriteJson` 复用 Node 标准 API；

因此**不会破坏 §14 总结的设计要点**："统一 Runtime + Preset"、
"配置胜过硬编码"、"关注点可插拔"等仍然成立，且这次修复反而把这些原则
落得更彻底（例如把"是否缓存"从隐式黑名单上升为显式 schema 声明）。
