# Alembic Agent 子系统深度分析

> 本文档基于 `lib/agent/` 全量源码（约 6,866 行 TypeScript / 60+ 文件）的深度走读，系统性梳理
> `AgentRuntime` 及其周边模块（编排、策略、记忆、上下文、工具、Forge、域函数等）的设计方案与实现细节，
> 作为内部架构参考与重构 / 演进的基线。

> 文档位置：[docs-dev/agent-runtime-deep-dive.md](docs-dev/agent-runtime-deep-dive.md)
> 相关源码根目录：[lib/agent/](lib/agent/)

---

## 0. 总览

Alembic 的 Agent 子系统是一个**统一 ReAct 引擎**：所有"角色"（用户聊天、冷启动 Analyst/Producer、
飞书机器人、远程命令执行……）共用同一份 `AgentRuntime`，通过 **Preset = Capability + Strategy + Policy**
的可组合配置实现差异化行为。

设计哲学可概括为四点：

1. **统一 Runtime** —— 不存在 `ChatAgent` / `BootstrapAgent` / `LarkAgent` 等多态子类，只有一个 Runtime。
2. **配置胜过硬编码** —— 行为差异通过 Preset / Policy / Capability 的组合表达，新增能力无需改 Runtime。
3. **引擎级能力可选注入** —— `ContextWindow` / `ExplorationTracker` / `MemoryCoordinator` / `ActiveContext`
   均可独立注入，未注入时优雅退化。
4. **横切关注点中间件化** —— 工具执行链、错误恢复、缓存、记忆记录、事件发布全部以中间件形式插拔。

整体目录布局：

```
lib/agent/
├── AgentRuntime.ts            # ReAct 主循环与生命周期
├── AgentFactory.ts            # 统一工厂
├── AgentRouter.ts             # 渠道→Preset 路由
├── IntentClassifier.ts        # 自然语言意图分类
├── AgentMessage.ts            # 渠道无关消息信封
├── AgentState.ts              # 类型安全状态机
├── AgentEventBus.ts           # 事件总线 + RPC
├── ConversationStore.ts       # 对话持久化
├── PipelineStrategy.ts        # 多阶段管线策略
├── strategies.ts              # Strategy 抽象 + Single/FanOut/Adaptive
├── presets.ts                 # 预设配置
├── policies.ts                # Budget / Safety / QualityGate
├── capabilities.ts            # 可组合 Capability
├── forced-summary.ts          # 强制摘要（熔断兜底）
├── core/                      # 内部管道（LoopContext、Pipeline、PromptBuilder…）
├── tools/                     # 11 类，~58 个工具
├── memory/                    # 三层记忆 + Coordinator
├── context/                   # ContextWindow + ExplorationTracker
├── forge/                     # 动态工具锻造
└── domain/                    # 领域函数（Analyst / Producer / Evolver / Consolidator）
```

---

## 1. AgentRuntime —— 核心执行引擎

文件：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts)（1121 行）

### 1.1 类结构与依赖

```ts
class AgentRuntime {
  // ── DI 容器 ──
  aiProvider:     AiProvider          // LLM 提供商
  toolRegistry:   ToolRegistry        // 工具注册表
  container:      ServiceContainer    // 依赖注入容器
  capabilities:   Capability[]        // 可组合能力模块
  strategy:       Strategy            // 执行策略
  policies:       PolicyEngine        // 约束引擎

  // ── 配置 ──
  id:             string
  presetName:     string              // chat / insight / remote-exec / lark
  persona:        Record<string, unknown>
  memoryConfig:   Record<string, unknown>
  lang:           string | null

  // ── 运行时统计 ──
  iterationCount: number
  toolCallHistory: ToolCallEntry[]
  tokenUsage:     { input: number; output: number }

  // ── 内部协作者 ──
  state:          AgentState
  bus:            AgentEventBus
  #toolPipeline:  ToolExecutionPipeline
  #promptBuilder: SystemPromptBuilder
}
```

### 1.2 执行入口

```
execute(message: AgentMessage, opts?)
   ├─ Policy.validateBefore()         // 前置校验
   ├─ withTimeout(strategy.execute, 300s)
   ├─ Policy.validateAfter()          // 输出质量校验
   └─ bus.publish(AGENT_COMPLETED)
```

`execute()` 不直接做循环控制，而是委托 `strategy.execute()`。这把"如何编排"和"循环本身"解耦。

### 1.3 ReAct 主循环 `reactLoop`

伪代码：

```text
while (true):
  ── 1. 退出判定 #shouldExit ──
       abortSignal / tracker 阶段终止 / Policy 预算上限
  ── 2. #prepareIteration ──
       钩子、Nudge 注入、上下文压缩、首轮 toolChoice 强制
  ── 3. #callLLM ──
       AIError 2-strike、空响应 rollback、熔断 OPEN → 强制摘要
  ── 4. #processToolCalls ──
       走 ToolExecutionPipeline（中间件链）+ 提交去重
  ── 5. #processTextResponse ──
       清理答案 / Policy 通过 / 退出循环
```

**错误恢复约定**：

| 场景 | 策略 |
|------|------|
| `AIError`（连续 2 次） | 抛出，由 strategy 决定是否回退/降级 |
| 空响应（连续 N 次） | 回滚消息后重试，避免污染上下文 |
| 熔断器 OPEN | 跳过 LLM，调用 `produceForcedSummary` 强制收口 |
| 工具异常 | 由中间件 `safetyGate` / `observationRecord` 捕获并写回 |

### 1.4 引擎级能力可选注入

`reactLoop` 接受一组可选的引擎能力，**全部缺省时退化为最朴素的 ReAct**：

| 注入项 | 来源 | 作用 |
|--------|------|------|
| `contextWindow` | [context/ContextWindow.ts](lib/agent/context/ContextWindow.ts) | 三级递进压缩、token 预算、消息原子性 |
| `tracker` | [context/ExplorationTracker.ts](lib/agent/context/ExplorationTracker.ts) | 阶段状态机、信号收集、Nudge、优雅退出 |
| `trace` | [memory/ActiveContext.ts](lib/agent/memory/ActiveContext.ts) | 推理链记录、findings 抽取 |
| `memoryCoordinator` | [memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts) | 缓存命中、动态 prompt 注入、观察记录 |
| `sharedState` | 调用方传入 | 提交去重、维度元数据、自举去重 |

### 1.5 关键设计模式

- **Strategy** —— 编排"如何执行"（Single / Pipeline / FanOut / Adaptive）
- **Pipeline** —— 工具执行中间件链
- **DI** —— 通过 `ServiceContainer` 解耦 LLM、工具、策略
- **Observer / Pub-Sub** —— `AgentEventBus`
- **State Machine** —— `AgentState` 阶段流转

---

## 2. 编排层：路由、意图、工厂

### 2.1 AgentRouter —— 渠道 → Preset 路由

文件：[lib/agent/AgentRouter.ts](lib/agent/AgentRouter.ts)

四级路由策略（延迟递增）：

1. **手动指定** —— API `preset` 参数
2. **渠道特征** —— 例如 Lark 终端命令 `^[>$]`
3. **关键词正则** —— `bootstrap|冷启动` → insight；`运行命令` → remote-exec
4. **LLM 意图分类** —— 兜底，~500 ms 延迟

预设枚举：

```ts
PresetName = { CHAT, INSIGHT, LARK, REMOTE_EXEC }
```

### 2.2 IntentClassifier —— 自然语言意图分类

文件：[lib/agent/IntentClassifier.ts](lib/agent/IntentClassifier.ts)

```ts
Intent = {
  BOT_AGENT: 'bot_agent',  // 知识管理 → 服务端 AgentRuntime
  IDE_AGENT: 'ide_agent',  // 编码任务 → VSCode Copilot
  SYSTEM:    'system',     // 系统操作 → 本地处理
}
```

三层分类：

- `SYSTEM_RULES`（硬编码模式：状态/截图/帮助/取消…）
- `IDE_STRONG_SIGNALS`（修改代码、写函数、`.ts/.js` 文件引用）
- `BOT_STRONG_SIGNALS`（知识库、搜索、recipe、bootstrap）

策略：宁可走一次 LLM，也不要误分类。

### 2.3 AgentFactory —— 统一工厂

文件：[lib/agent/AgentFactory.ts](lib/agent/AgentFactory.ts)

```ts
class AgentFactory {
  createRouter(): AgentRouter
  createRuntime(preset, overrides?): AgentRuntime

  createChat(message, opts?):       Promise<AgentResult>
  createInsight(config):            Promise<AgentResult>
  createRemoteExec(message, opts?): Promise<AgentResult>

  scanKnowledge(files, task, opts?): Promise<ScanResult>
  buildSystemContext(opts?):         SystemContext
}
```

工厂只产出 `AgentRuntime` + Preset 差异，**不创建任何 Agent 子类**。

---

## 3. 内部管道（`core/`）

### 3.1 LoopContext

文件：[lib/agent/core/LoopContext.ts](lib/agent/core/LoopContext.ts)

把原本散落在 `reactLoop` 内的 ~60 行初始化 + 10 余个局部变量统一封装：

```ts
class LoopContext {
  // 注入依赖
  messages: MessageAdapter
  tracker:  ExplorationTracker | null
  trace:    ActiveContext | null
  memoryCoordinator: MemoryCoordinator | null
  sharedState: SharedState | null

  // 易变状态
  iteration = 0
  lastReply = ''
  toolCalls: ToolCallEntry[] = []
  tokenUsage = { input: 0, output: 0 }

  // 错误恢复
  consecutiveAiErrors = 0
  consecutiveEmptyResponses = 0

  // 不可变配置
  source: 'user' | 'system'
  budget: BudgetConfig
  capabilities: Capability[]
  baseSystemPrompt: string
  toolSchemas: ToolSchema[]
  toolChoiceOverride?: string  // 首轮可强制工具调用
}
```

### 3.2 ToolExecutionPipeline

文件：[lib/agent/core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts)

```ts
interface ToolMiddleware {
  name: string
  before?(call, ctx, meta): BeforeVerdict   // 可拦截、可改写
  after?(call, result, ctx, meta): void     // 记账、发信
}
```

预置中间件：

| 中间件 | 职责 |
|--------|------|
| `allowlistGate` | Forge fallback 工具白名单 |
| `safetyGate` | `SafetyPolicy` 拦截 |
| `cacheCheck` | `MemoryCoordinator` 只读结果缓存命中 |
| `submitDedup` | `submit_knowledge` 去重 |
| `observationRecord` | 写入 `ActiveContext.ObservationLog` |
| `trackerSignal` | `ExplorationTracker` 信号采集 |
| `traceRecord` | 推理链记录 |
| `eventBusPublisher` | 工具事件广播 |
| `progressEmitter` | 进度回调 |

设计目标：把横切关注点从 `reactLoop` 中剥离，改用可组合中间件，**支持运行时动态注册**。

### 3.3 SystemPromptBuilder

文件：[lib/agent/core/SystemPromptBuilder.ts](lib/agent/core/SystemPromptBuilder.ts)

构建顺序：

1. Persona 基础提示
2. 各 Capability 的 `promptFragment`
3. 缓存记忆注入（`MemoryCoordinator`）
4. 预算注入（`SystemPromptBuilder.injectBudget`）
5. 阶段提示（`ExplorationTracker`）

### 3.4 MessageAdapter

文件：[lib/agent/core/MessageAdapter.ts](lib/agent/core/MessageAdapter.ts)

三种工作模式：

- **`useCtxWin` 模式（推荐）** —— 完全委托 `ContextWindow`
- **裸消息模式** —— 直接数组，简单场景
- **混合模式** —— 迁移期向后兼容

### 3.5 LLMResultType

文件：[lib/agent/core/LLMResultType.ts](lib/agent/core/LLMResultType.ts)

```ts
enum LLMResultType {
  CONTINUE,       // 继续循环（错误重试等）
  TOOL_CALLS,     // 有工具调用
  TEXT_RESPONSE,  // 纯文本回复 → 退出循环
}
```

---

## 4. 工具系统（`tools/`，~58 个工具，11 个类别）

### 4.1 ToolRegistry

文件：[lib/agent/tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts)

```ts
class ToolRegistry {
  register(toolDef: ToolDefinition): void
  registerAll(defs: ToolDefinition[]): void
  getToolSchemas(allowedTools?): ToolSchema[]
  execute(name, params, ctx): Promise<unknown>

  #normalizeParams(params, schema)  // snake_case ↔ camelCase
}

interface ToolDefinition {
  name: string                  // snake_case
  description: string           // 给 LLM
  parameters?: JSONSchema
  handler: (params, ctx) => Promise<unknown>
}
```

### 4.2 工具目录

索引文件：[lib/agent/tools/index.ts](lib/agent/tools/index.ts)

| 类别 | 文件 | 数量 | 主要工具 |
|------|------|------|----------|
| 查询 | [query.ts](lib/agent/tools/query.ts) | 6 | `searchRecipes`、`searchCandidates`、`searchKnowledge`、`getRecipeDetail`、`getProjectStats`、`getRelatedRecipes` |
| 项目数据访问 | [project-access.ts](lib/agent/tools/project-access.ts) | 5 | `searchProjectCode`、`readProjectFile`、`listProjectStructure`、`getFileSummary`、`semanticSearchCode` |
| AI 分析 | [ai-analysis.ts](lib/agent/tools/ai-analysis.ts) | 2 | `enrichCandidate`、`refineBootstrapCandidates` |
| Guard 安全 | [guard.ts](lib/agent/tools/guard.ts) | 4 | `listGuardRules`、`getRecommendations`、`guardCheckCode`、`queryViolations` |
| 知识图谱 | [knowledge-graph.ts](lib/agent/tools/knowledge-graph.ts) | 2 | `checkDuplicate`、`addGraphEdge` |
| 生命周期 | [lifecycle.ts](lib/agent/tools/lifecycle.ts) | 10 | `submitCandidate`、`approveCandidate`、`rejectCandidate`、`publishRecipe`、`deprecateRecipe`、`updateRecipe`、`recordUsage`、`qualityScore`、`validateCandidate`、`getFeedbackStats` |
| 基础设施 | [infrastructure.ts](lib/agent/tools/infrastructure.ts) | 7 | `bootstrapKnowledgeTool`、`createSkillTool`、`loadSkill`、`suggestSkills`、`rebuildIndex`、`graphImpactAnalysis`、`queryAuditLog` |
| 组合 / 元工具 | [composite.ts](lib/agent/tools/composite.ts) | 6 | `analyzeCode`、`knowledgeOverview`、`submitWithCheck`、`getToolDetails`、`planTask`、`reviewMyOutput` |
| AST 结构化 | [ast-graph.ts](lib/agent/tools/ast-graph.ts) | 11 | `getProjectOverview`、`getClassHierarchy`、`getClassInfo`、`getProtocolInfo`、`getMethodOverrides`、`getCategoryMap`、`getPreviousAnalysis`、`noteFinding`、`getPreviousEvidence`、`queryCodeGraph`、`queryCallGraph` |
| 知识演进 | [evolution-tools.ts](lib/agent/tools/evolution-tools.ts) | 3 | `proposeEvolution`、`confirmDeprecation`、`skipEvolution` |
| 扫描 Recipe | [scan-recipe.ts](lib/agent/tools/scan-recipe.ts) | 1 | `collectScanRecipe` |
| 系统交互 | [system-interaction.ts](lib/agent/tools/system-interaction.ts) | 3 | `runSafeCommand`、`getEnvironmentInfo`、`writeProjectFile` |

---

## 5. 记忆子系统（`memory/`）

### 5.1 三层记忆模型

| 层级 | 类 | 范围 | 典型内容 |
|------|----|------|----------|
| Tier 1 | `ActiveContext` | 维度级（一次 ReAct 任务） | Scratchpad（`note_finding`）、ObservationLog（每轮观察）、Plan |
| Tier 2 | `SessionStore` | 会话级（一次 bootstrap） | DimensionReports、ReadOnlyCache |
| Tier 3 | `PersistentMemory` | 跨会话 | fact / insight / preference |

### 5.2 MemoryCoordinator

文件：[lib/agent/memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts)

预算配置（`BUDGET_PROFILES`）：

```ts
user:     { activeContext: 0.20, persistentMemory: 0.60, ... }
analyst:  { activeContext: 0.45, sessionStore:      0.35, ... }
producer: { activeContext: 0.25, sessionStore:      0.55, ... }
```

### 5.3 SessionStore（合并 EpisodicMemory + ToolResultCache）

文件：[lib/agent/memory/SessionStore.ts](lib/agent/memory/SessionStore.ts)

```ts
class SessionStore {
  DimensionReports         // 跨维度分析 + 结构化证据
  ReadOnlyCache            // 只读工具结果（LRU）

  addDimensionReport(dimId, report)
  getDimensionReport(dimId): DimensionReport
  getStats(): SessionStoreStats
  saveCheckpoint(path): void
  loadCheckpoint(path): void
}

const NON_CACHEABLE = new Set([
  'submit_knowledge', 'submit_with_check',
  'note_finding', 'get_previous_analysis', 'get_previous_evidence',
])
```

### 5.4 ActiveContext（合并 WorkingMemory + ReasoningTrace）

文件：[lib/agent/memory/ActiveContext.ts](lib/agent/memory/ActiveContext.ts)

```ts
class ActiveContext {
  Scratchpad        // 经 note_finding 标记，不可压缩
  ObservationLog    // 每轮 ReAct 记录，滑窗压缩
  Plan              // 计划追踪

  startRound(iteration)
  setThought(text)
  recordObservation(toolName, result)
  distill(mode): DistilledContext
}

// 工具压缩策略示例
TOOL_COMPRESS_STRATEGIES = {
  search_project_code: '汇总文件 + 行号',
  read_project_file:   '汇总文件 + 行数',
  get_class_info:      '类名 + 继承 + 协议',
  ...
}
```

### 5.5 PersistentMemory

文件：[lib/agent/memory/PersistentMemory.ts](lib/agent/memory/PersistentMemory.ts)

三种条目：

- `fact` —— 陈述性知识，例 *"项目使用 MVP 模式"*
- `insight` —— 关联性洞察，例 *"X 与 Y 存在循环依赖"*
- `preference` —— 团队偏好，例 *"禁止使用 Singleton"*

### 5.6 其他

| 文件 | 职责 |
|------|------|
| [MemoryStore.ts](lib/agent/memory/MemoryStore.ts) | 落盘到 `.asd/memory/`，支持 checkpoint |
| [MemoryRetriever.ts](lib/agent/memory/MemoryRetriever.ts) | 跨层检索接口 |
| [MemoryEmbeddingStore.ts](lib/agent/memory/MemoryEmbeddingStore.ts) | 向量化 + 语义召回 |
| [MemoryConsolidator.ts](lib/agent/memory/MemoryConsolidator.ts) | 短期 → 长期固化 |
| [session-store-schema.ts](lib/agent/memory/session-store-schema.ts) | SessionStore 序列化 schema |
| [memory-flush-contract.ts](lib/agent/memory/memory-flush-contract.ts) | 记忆蒸馏契约 |

---

## 6. 上下文与探索（`context/`）

### 6.1 ContextWindow —— 三级递进压缩

文件：[lib/agent/context/ContextWindow.ts](lib/agent/context/ContextWindow.ts)

| 等级 | 触发 | 行为 |
|------|------|------|
| L1 | 60-80% token | 截断旧的工具结果内容 |
| L2 | 80-95% token | 摘要历史轮次，保留最后 2 轮完整链 |
| L3 | >95% token | 仅保留 prompt + 最后 1 轮 + 已提交列表 |

不变量：

- `messages[0]` 始终是原始 prompt
- `assistant(toolCalls)` + `tool results` **原子不拆分**
- 自动维护消息合法性

### 6.2 ExplorationTracker —— 统一生命周期控制

文件：[lib/agent/context/ExplorationTracker.ts](lib/agent/context/ExplorationTracker.ts)

合并 `PhaseRouter` + 进度追踪 + `ReasoningLayer` 三个旧系统，统一职责：

- 阶段状态机（phase hold + 转换规则）
- 信号收集（`SignalDetector`）
- Nudge 生成（`NudgeGenerator`）
- 计划跟踪（`PlanTracker`）
- 优雅退出

指标包括：`uniqueFiles / uniquePatterns / uniqueQueries`、`totalToolCalls`、`submitCount`、
`roundsSinceNewInfo`、`roundsSinceSubmit` 等。

### 6.3 exploration/ 子模块

| 文件 | 职责 |
|------|------|
| [SignalDetector.ts](lib/agent/context/exploration/SignalDetector.ts) | 检测某次工具调用是否带来新信息 |
| [NudgeGenerator.ts](lib/agent/context/exploration/NudgeGenerator.ts) | 生成反思 / 规划 / 停滞 nudge |
| [PlanTracker.ts](lib/agent/context/exploration/PlanTracker.ts) | 追踪 Agent 计划状态 |
| [ExplorationStrategies.ts](lib/agent/context/exploration/ExplorationStrategies.ts) | bootstrap / analyst / producer 策略预设 |

---

## 7. Forge —— 动态工具锻造

文件夹：[lib/agent/forge/](lib/agent/forge/)

### 7.1 ToolForge —— 三级锻造瀑布

```ts
async forge(req: ForgeRequest): Promise<ForgeResult> {
  // 1. Reuse    (~0 ms)   直接复用已注册工具
  // 2. Compose  (~10 ms)  通过 DynamicComposer 组合原子工具
  // 3. Generate (~5 s)    LLM 生成 + SandboxRunner 验证
}
```

### 7.2 关键模块

| 文件 | 职责 |
|------|------|
| [ToolForge.ts](lib/agent/forge/ToolForge.ts) | 主编排（reuse / compose / generate） |
| [ToolRequirementAnalyzer.ts](lib/agent/forge/ToolRequirementAnalyzer.ts) | 需求分析、置信度评分 |
| [DynamicComposer.ts](lib/agent/forge/DynamicComposer.ts) | 多原子工具组合规则 |
| [SandboxRunner.ts](lib/agent/forge/SandboxRunner.ts) | 沙箱验证生成代码 |
| [TemporaryToolRegistry.ts](lib/agent/forge/TemporaryToolRegistry.ts) | 临时工具 TTL 与清理 |

---

## 8. 域函数（`domain/`）

### 8.1 Analyst / Producer / Evolver

| 文件 | 关键导出 | 角色 |
|------|----------|------|
| [insight-analyst.ts](lib/agent/domain/insight-analyst.ts) | `ANALYST_SYSTEM_PROMPT`、`ANALYST_BUDGET = { maxIter: 16, timeout: 300s, maxTools: 24 }`、`buildAnalystPrompt`、`insightGateEvaluator` | 深度代码分析，产出 findings + evidence |
| [insight-producer.ts](lib/agent/domain/insight-producer.ts) | `PRODUCER_SYSTEM_PROMPT`、`PRODUCER_BUDGET = { maxIter: 8, timeout: 120s, maxTools: 12 }`、`buildProducerPromptV2`、`producerRejectionGateEvaluator` | 把分析结果转化为结构化知识候选（`submit_knowledge`） |
| [insight-evolver.ts](lib/agent/domain/insight-evolver.ts) | `EVOLVER_SYSTEM_PROMPT`、`EVOLVER_BUDGET = { maxIter: 6, ... }`、`buildEvolverPrompt`、`EvolutionContext` | 标记知识过时、提议演进、生成弃用建议 |

### 8.2 质量门控与固化

| 文件 | 职责 |
|------|------|
| [insight-gate.ts](lib/agent/domain/insight-gate.ts) | `insightGateEvaluator`、`evolutionGateEvaluator`、`producerRejectionGateEvaluator`、`buildRetryPrompt` |
| [consolidation-gate.ts](lib/agent/domain/consolidation-gate.ts) | 固化质量门控 |
| [EpisodicConsolidator.ts](lib/agent/domain/EpisodicConsolidator.ts) | Episodic → Semantic 固化（`FACT_PATTERNS` / `INSIGHT_PATTERNS` 抽取，再走 `PersistentMemory.consolidate`） |
| [EvidenceCollector.ts](lib/agent/domain/EvidenceCollector.ts) | 证据收集 |
| [ChatAgentTasks.ts](lib/agent/domain/ChatAgentTasks.ts) | Chat 任务编排 |
| [scan-prompts.ts](lib/agent/domain/scan-prompts.ts) | 扫描管线提示词集合 |

---

## 9. 执行策略层

### 9.1 strategies.ts —— Strategy 多态

文件：[lib/agent/strategies.ts](lib/agent/strategies.ts)

```ts
abstract class Strategy {
  get name(): string
  abstract execute(runtime, message, opts): Promise<AgentResult>
}
```

四种内置策略：

| 策略 | 用途 |
|------|------|
| `SingleStrategy` | 单次 ReAct 循环（用户聊天） |
| `PipelineStrategy` | 顺序多阶段 + 质量门控（分析→提交） |
| `FanOutStrategy` | 并行 + 合并（多维度冷启动），支持 tiers 分层 |
| `AdaptiveStrategy` | 运行时根据消息内容/Preset 自动选择 |

### 9.2 PipelineStrategy

文件：[lib/agent/PipelineStrategy.ts](lib/agent/PipelineStrategy.ts)

```ts
interface PipelineStage {
  name: string
  gate?:           GateConfig
  capabilities?:   CapabilityRef[]
  promptBuilder?:  Function
  systemPrompt?:   string
  budget?:         StageBudget
  retryBudget?:    StageBudget
  skipOnDegrade?:  boolean
}
```

执行流：

```text
for each stage:
  1. buildPrompt()
  2. runtime.reactLoop(...)
  3. gate.evaluate()
       ├─ pass    → 下一阶段
       ├─ retry   → 同阶段重试（retryPrompt + retryBudget）
       └─ degrade → 跳过后续阶段
```

等价于 Anthropic 的 **Prompt Chaining + Evaluator-Optimizer**。

### 9.3 Presets

文件：[lib/agent/presets.ts](lib/agent/presets.ts)

| Preset | Capabilities | Strategy | Policies |
|--------|--------------|----------|----------|
| `chat` | Conversation + CodeAnalysis | Single | StandardBudget |
| `insight` | CodeAnalysis + KnowledgeProduction | FanOut + Pipeline | DeepBudget + QualityGate |
| `remote-exec` | Conversation + System | Single | ShortBudget + Safety |
| `lark` | Conversation + Analysis（飞书风格） | Adaptive | StandardBudget + Safety |

### 9.4 Policies

文件：[lib/agent/policies.ts](lib/agent/policies.ts)

```ts
class Policy {
  validateBefore(ctx):    { ok, reason? }
  validateDuring(state):  { ok, action?, reason? }
  validateAfter(result):  { ok, reason? }
  applyToConfig(config):  config
}
```

三类约束：

- `BudgetPolicy` —— `maxIterations` / `maxTokens` / `timeoutMs` / `temperature`
- `SafetyPolicy` —— `fileScope` / `allowedSenders` / `commandBlacklist`
- `QualityGatePolicy` —— `minEvidenceLength` / `minFileRefs` / `minToolCalls`

---

## 10. 状态、事件、对话

### 10.1 AgentState（类型安全状态机）

文件：[lib/agent/AgentState.ts](lib/agent/AgentState.ts)

```ts
AgentPhase = {
  IDLE, PLANNING, EXECUTING, REFLECTING,
  WAITING_INPUT, HANDOFF, COMPLETED, FAILED, ABORTED,
}

class AgentState extends EventEmitter {
  send(event: string, data): void
  toJSON(): AgentStateSnapshot
  static fromJSON(snap): AgentState
}
```

设计借鉴 LangGraph + XState。

### 10.2 AgentEventBus

文件：[lib/agent/AgentEventBus.ts](lib/agent/AgentEventBus.ts)

```ts
class AgentEventBus extends EventEmitter {
  // 标准事件
  AGENT_CREATED / STARTED / COMPLETED / FAILED
  TOOL_CALL_START / TOOL_CALL_END
  LLM_CALL_START / LLM_CALL_END
  HANDOFF_REQUEST / ACCEPT / RESULT

  publish(type, payload, opts)
  subscribe(topic, handler)

  // RPC
  request(type, data, timeout)
  reply(requestId, data)
}
```

### 10.3 AgentMessage（渠道无关消息信封）

文件：[lib/agent/AgentMessage.ts](lib/agent/AgentMessage.ts)

```ts
class AgentMessage {
  content:  string
  channel:  'http' | 'lark' | 'cli' | 'mcp'
  sender:   Sender
  session:  Session
  metadata: Record<string, unknown>

  static fromHttp(req)
  static fromLark(msg)
  static fromCli(opts)
  static fromMcp(req)
}
```

**Agent 与渠道完全解耦**，由 Transport 适配器负责消息转换。

### 10.4 ConversationStore

文件：[lib/agent/ConversationStore.ts](lib/agent/ConversationStore.ts)

```ts
class ConversationStore {
  create(opts): conversationId
  append(id, message): void
  load(id, opts?: { tokenBudget }): Message[]
  summarize(id, opts): Promise<void>
}
```

存储位置：`.asd/conversations/{id}.jsonl`，索引：`.asd/conversations/index.json`。

---

## 11. Capabilities & forced-summary

### 11.1 Capabilities

文件：[lib/agent/capabilities.ts](lib/agent/capabilities.ts)

```ts
class Capability {
  get name(): string
  get promptFragment(): string
  get tools(): string[]
  buildContext(ctx): string | null
  onBeforeStep(state): void
  onAfterStep(result): void
}
```

预置：

| Capability | 工具集 |
|-----------|--------|
| Conversation | `search_knowledge`、`search_recipes`、… |
| CodeAnalysis | `get_class_info`、`query_code_graph`、… |
| KnowledgeProduction | `submit_knowledge`、`validate_candidate`、… |
| SystemInteraction | `run_safe_command`、`get_environment_info`、… |

组合示例：

- 用户聊天 = `Conversation + CodeAnalysis`
- 冷启动 = `CodeAnalysis + KnowledgeProduction`
- 远程执行 = `Conversation + SystemInteraction + SafetyPolicy`

### 11.2 forced-summary —— 熔断兜底

文件：[lib/agent/forced-summary.ts](lib/agent/forced-summary.ts)

```ts
async function produceForcedSummary(opts: {
  aiProvider: AiProvider
  source?: 'user' | 'system'
  toolCalls: ToolCallRecord[]
  tracker?: ExplorationTracker
  contextWindow?: ContextWindow
  prompt: string
  tokenUsage?: TokenUsage
}): Promise<string>
```

按 `source + tracker.pipelineType` 走三种摘要模式：

- `system + analyst` → Markdown 分析报告
- `system + bootstrap` → `dimensionDigest` JSON
- `user` → 人类可读 Markdown 总结

### 11.3 AgentRuntimeTypes

文件：[lib/agent/AgentRuntimeTypes.ts](lib/agent/AgentRuntimeTypes.ts)

从 Runtime 提取的共享类型，便于其他层独立消费：
`ToolCallEntry` / `LLMResult` / `AiError` / `ProgressEvent` / `ToolMetadata` / `RuntimeConfig`。

---

## 12. 模块依赖关系总览

```text
AgentRuntime (入口)
  ├─ Strategy (Single / Pipeline / FanOut / Adaptive)
  ├─ ToolRegistry + ToolExecutionPipeline
  ├─ CapabilityRegistry + SystemPromptBuilder
  ├─ PolicyEngine (Budget / Safety / QualityGate)
  ├─ AgentState + AgentEventBus
  └─ LoopContext (可选)
       ├─ ContextWindow (压缩)
       ├─ ExplorationTracker (阶段 + 信号 + Nudge)
       ├─ ActiveContext (推理链)
       ├─ MemoryCoordinator (缓存 + 记忆注入)
       └─ MessageAdapter (消息格式)

ToolRegistry
  ├─ tools/* (query / project-access / ast-graph / ...)
  └─ ToolForge (动态生成)
       ├─ ToolRequirementAnalyzer
       ├─ DynamicComposer
       ├─ SandboxRunner
       └─ TemporaryToolRegistry

Domain Layer
  ├─ insight-analyst / producer / evolver / gate
  ├─ EpisodicConsolidator
  ├─ EvidenceCollector
  └─ ChatAgentTasks / scan-prompts

Memory Layer
  ├─ MemoryCoordinator (协调)
  ├─ ActiveContext (维度级)
  ├─ SessionStore (会话级)
  ├─ PersistentMemory (跨会话)
  ├─ ConversationStore (对话历史)
  └─ MemoryStore (二级存储)

Context & Exploration
  ├─ ContextWindow
  └─ ExplorationTracker
       ├─ SignalDetector
       ├─ NudgeGenerator
       ├─ PlanTracker
       └─ ExplorationStrategies

Orchestration
  ├─ AgentRouter
  ├─ IntentClassifier
  ├─ AgentFactory
  └─ AgentMessage / Channel
```

---

## 13. 关键数据流：冷启动管线

```text
factory.createInsight({ files, task })
  ↓
AgentFactory.scanKnowledge()
  ├─ new ExplorationTracker(strategy: bootstrap)
  ├─ new MemoryCoordinator(mode: bootstrap)
  ├─ new SessionStore()
  └─ FanOut over dimensions
       ↓
       PipelineStrategy.execute()
         ├─ Stage 1: buildAnalystPrompt → Analyst
         │     reactLoop(tracker, trace, memoryCoord)
         │       ├─ LLM 多轮工具调用 (get_class_info, query_code_graph, …)
         │       ├─ 抽取 findings + evidence
         │       └─ 写入 SessionStore
         │
         ├─ Gate 1: insightGateEvaluator
         │     pass / retry / degrade
         │
         ├─ Stage 2: buildProducerPromptV2 → Producer
         │     reactLoop()
         │       ├─ 读 SessionStore.findings
         │       ├─ read_project_file 取代码片段
         │       └─ submit_knowledge × N
         │
         └─ Gate 2: producerRejectionGateEvaluator
  
  全部维度结束 (FanOut merge):
    └─ EpisodicConsolidator.consolidate()
         ├─ FACT_PATTERNS 抽取 fact 记忆
         ├─ INSIGHT_PATTERNS 抽取 insight 记忆
         └─ PersistentMemory.consolidate (去重合并)

返回 AgentResult:
  {
    reply: "冷启动完成，发现 N 个候选",
    toolCalls: [...],
    phases: { analyst: {...}, producer: {...} },
    state: {...},
  }
```

---

## 14. 设计要点回顾

1. **统一 Runtime + Preset** —— 消除 Agent 子类爆炸，差异下沉到配置。
2. **策略多态** —— Single / Pipeline / FanOut / Adaptive 适配不同工作流。
3. **能力组合** —— Capability 模块自由组合，能力与约束（Policy）正交。
4. **工具中间件** —— `ToolExecutionPipeline` 把横切关注点变成可插拔环节。
5. **分层记忆 + 预算** —— `ActiveContext / SessionStore / PersistentMemory` 三层，按角色分配预算。
6. **三级压缩 + 阶段管理** —— `ContextWindow` 防爆 + `ExplorationTracker` 防散漫。
7. **Forge 动态工具锻造** —— Reuse → Compose → Generate 三级瀑布。
8. **域函数解耦** —— Analyst / Producer / Evolver / Consolidator 各自独立、易测试可演进。
9. **熔断兜底** —— `produceForcedSummary` 在熔断器 OPEN 时强制收口，避免无声失败。
10. **渠道无关** —— `AgentMessage` + `Channel` 让 HTTP / Lark / CLI / MCP 共享同一 Runtime。

整体设计遵循 **"配置胜过硬编码、能力可组合、关注点可插拔"** 的原则，
为新增 Preset、Policy、Capability、Tool 提供了开放扩展点而无需触动核心 Runtime。

---

## 15. 已知问题、边界情况与连通性风险

> 本节基于对 `lib/agent/` 的代码走读整理出的**真实风险点**。每条均标注严重级别、源码定位、
> 触发场景与影响。所有问题均与上面章节中的设计点对应，**未实地复现的内容标注"（未验证）"**，
> 避免误导。优先级供后续 issue / 重构计划参考。
>
> 严重级别约定：
> - **High** —— 涉及数据损坏 / 安全 / 长期资源泄漏，需尽快修复
> - **Medium** —— 影响正确性、稳定性或可观测性，应排期修复
> - **Low** —— 设计气味、一致性差，可在重构窗口处理

### 15.1 AgentRuntime 主循环（`AgentRuntime.ts`）

#### A1. 并发 reactLoop 共享私有字段 — 竞态 [High]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts)，`#toolPipeline` / `#promptBuilder` 等实例字段
- 场景：`FanOutStrategy` 复用同一 `AgentRuntime` 时，多个 `execute()` / `reactLoop()`
  并发调用 `#toolPipeline.execute(...)` / `#promptBuilder.build(...)`；中间件链状态、prompt
  组装上下文未做隔离。
- 影响：工具结果交叉、`tokenUsage` / `iterationCount` / `toolCallHistory` 叠加错乱、维度间状
  态污染。
- 建议：要么 per-invocation 创建一对私有协作者，要么显式以 `LoopContext` 为唯一共享载体，
  Runtime 实例字段只承担"原型"作用。

#### A2. EventBus 订阅未清理 — 长期泄漏 [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) 构造函数 `bus.publish(AGENT_CREATED)` 与
  其他 `bus.subscribe(...)` 调用。
- 场景：常驻进程（HTTP / MCP / Lark）每次 chat/insight 都新建 Runtime，但 Runtime **没有**
  `dispose()` / 反注册路径，全局 `AgentEventBus` 上的监听器与请求/响应映射只增不减。
- 影响：内存泄漏、事件分发逐渐变慢、陈旧监听器响应到无关事件。
- 建议：增加 `Runtime.dispose()`，集中 `bus.unsubscribe(...)`、清理 `request()` 未完成的
  Promise、关闭超时定时器。

#### A3. 重试时 token 用量重复累计 [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `#callLLM` 周边的 `tokenUsage += result.usage` 与空响应回滚分支。
- 场景：空响应 / 部分结构错误触发 rollback 后再次发起 LLM 调用，但前一次的 input/output
  token 已经累加进 `tokenUsage`。
- 影响：token 报告虚高，`BudgetPolicy.maxTokens` 提前触发，对计费/观测产生误导。
- 建议：rollback 路径同时回滚最近一次 `usage` 增量，或让 `#callLLM` 返回"是否计入"的判定。

#### A4. 异常路径下状态机/统计不一致 [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `execute()` 的 try/catch 与
  `state.send('error')` 调用。
- 场景：`strategy.execute()` 抛出（超时、网络错误、Forge 失败）时，`#safeTransition` 可能因
  非法转移被静默忽略，`toolCallHistory` 留下半截，`AGENT_COMPLETED` 与 `AGENT_FAILED` 事件顺
  序在某些路径上不严格一致。
- 影响：观察者 / 后续 strategy 读取到不一致快照；Dashboard 进度条卡死。
- 建议：在 `finally` 中以"幂等收敛"方式统一发布终态事件，并对状态机非法转移降级为 `ABORTED`
  而非沉默。

#### A5. SUMMARIZE 与 USER 模式 rollback 不对称 [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `#processTextResponse` /
  `#callLLM` 中 source==='system' 的 SUMMARIZE 分支。
- 场景：system 模式的强制摘要阶段空响应不调用 `tracker.rollbackTick()`，但 user 模式调用；
  `iteration` 计数语义随 source 变化。
- 影响：`ExplorationTracker` 阶段决策基于错误计数；nudge / 退出时机被扰动。
- 建议：把 rollback 决策提取为单一入口，由 source + phase 决定，避免双分支漂移。

#### A6. `consecutiveAiErrors` 重置依赖 happy-path [Low]
- 位置：同上 `#callLLM` 错误处理段。
- 场景：若 rollback 自身抛错，`consecutiveAiErrors` 不会被下一次成功重置；连续两次"非真错误"
  也可能错误地触发 2-strike。
- 建议：在每个迭代起点统一重置成功流计数，错误增量只在确认错误时进行。

#### A7. 工具结果体积无上限 — 上下文炸裂 [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `appendToolResult(...)` 调用前后；
  `ToolRegistry.execute()` 也未截断。
- 场景：`search_project_code` / `read_project_file` 大文件批量返回，单次返回数 MB；进入
  `ContextWindow` 后直接逼到 L3 压缩，导致历史轮次被全部抹除。
- 影响：分析链断层、再后一轮 LLM 失忆；强制摘要可能仍超 token 上限。
- 建议：在 `ToolExecutionPipeline.after` 中加入"结果体积守门"中间件（按工具 schema 设软上限 +
  截断 + 提示）。

#### A8. `produceForcedSummary` 失败无降级 [Medium]
- 位置：[lib/agent/forced-summary.ts](lib/agent/forced-summary.ts)；调用方 [lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `reactLoop` 末尾。
- 场景：循环正常结束但 `lastReply` 为空 → 再次发起 LLM 摘要，若此时 API 限流 / 网络抖动，
  整个 `reactLoop` 抛异常，前面所有工具调用、findings 一并丢弃。
- 影响：长任务（Bootstrap）数小时成果可能因最后一次 LLM 失败全部作废。
- 建议：摘要调用包 try/catch，失败时回退为本地拼接的"结构化摘要"（直接序列化 toolCallHistory
  关键统计），保证有出参。

#### A9. `toolCallHistory` 无界增长 [Low]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts) `toolCallHistory.push(...)`。
- 场景：持续运行的 chat 会话或长任务，记录全量明细；ContextWindow 控制的是 prompt，但
  Runtime 自身的统计字段无回收。
- 建议：保留滚动窗口或在 `dispose()` 时清空；导出为快照后允许 GC。

---

### 15.2 内存子系统（`memory/`）

#### B1. `NON_CACHEABLE` 黑名单不完整 [Medium]
- 位置：[lib/agent/memory/SessionStore.ts](lib/agent/memory/SessionStore.ts) `NON_CACHEABLE` 集合 +
  [lib/agent/memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts) `cacheCheck` 中间件。
- 场景：写通类工具（如 `collect_scan_recipe`、`add_graph_edge`、`approve_candidate` 等）若不
  在黑名单，会复用旧缓存 → 跨维度看不到新写入。
- 影响：FanOut 维度间知识可见性不一致；最终候选列表缺失。
- 建议：把"是否缓存"改为工具 schema 上的 `cacheable: boolean` 显式声明，黑名单退场。

#### B2. `BUDGET_PROFILES` 总和未校验 [Low]
- 位置：[lib/agent/memory/MemoryCoordinator.ts](lib/agent/memory/MemoryCoordinator.ts) `BUDGET_PROFILES` 与 `allocateBudget(...)`。
- 场景：自定义 profile 若各项加总 > 1.0，会挤占消息缓冲；< 1.0 也无告警。
- 建议：构造时校验 `Σ ≈ 1.0 ± ε`，超界抛错或自动归一化。

#### B3. Checkpoint 非原子写 [Medium]
- 位置：[lib/agent/memory/SessionStore.ts](lib/agent/memory/SessionStore.ts) `saveCheckpoint(...)` /
  [lib/agent/memory/MemoryStore.ts](lib/agent/memory/MemoryStore.ts) 落盘逻辑。
- 场景：`fs.writeFileSync(path, JSON.stringify(...))` 被中断（崩溃 / kill）→ 写到一半的文件覆盖
  原文件 → 下次 `loadCheckpoint(...)` JSON 解析失败。
- 建议：写到 `*.tmp` 后 `fsync` + `rename` 原子替换；保留上一份作为回滚。

#### B4. ReadOnlyCache LRU 与并发遍历 [Low]（未完全验证）
- 位置：同 `SessionStore.ts` LRU/cleanup 区段。
- 场景：清理定时器与并发 `get`/`entries()` 同时操作 Map，理论上 V8 单线程下不会破坏迭代器，
  但若内部使用 async 回调 + 微任务边界，可能读取到部分驱逐后的状态。
- 建议：把 cleanup 放到下一个 tick 或加显式 generation 计数。

#### B5. PersistentMemory 跨会话隔离 [Medium]（待复核）
- 位置：[lib/agent/memory/PersistentMemory.ts](lib/agent/memory/PersistentMemory.ts) +
  [memory/MemoryEmbeddingStore.ts](lib/agent/memory/MemoryEmbeddingStore.ts)。
- 场景：固化时只按内容相似度去重，不带 project / repo namespace，多项目共用一个 `.asd/`
  目录时存在串味风险。
- 建议：固化条目带 `projectKey`，检索时强制按命名空间过滤。

---

### 15.3 上下文与探索（`context/`）

#### C1. L3 压缩仍可能超预算 [Medium]
- 位置：[lib/agent/context/ContextWindow.ts](lib/agent/context/ContextWindow.ts) 三级压缩实现。
- 场景：最后一轮工具结果本身就超过 token 预算，"保留最后 1 轮"的不变量与"必须不超 budget"的
  约束相冲突。
- 建议：在 L3 之上再加 L4：对最后一轮工具结果做强制摘要 / 截断，并保留摘要标记。

#### C2. `messages[0]` 不变量易破 [Low]
- 位置：[lib/agent/context/ContextWindow.ts](lib/agent/context/ContextWindow.ts) 压缩函数依赖 `messages[0]` 是原始 prompt。
- 场景：若任何 capability 在第一次 LLM 调用前 `unshift` 了系统/用户 nudge，原始 prompt 的位
  置漂移。
- 建议：把"原始 prompt"独立持有为字段而非依赖下标。

#### C3. ExplorationTracker 阶段非法转移 [Medium]（部分推断）
- 位置：[lib/agent/context/ExplorationTracker.ts](lib/agent/context/ExplorationTracker.ts) 阶段状态机 + `endRound(...)`。
- 场景：`DONE` 阶段后若仍有信号缓冲，可能再次触发回到 `SEARCH`；阶段转换条件分散在多处。
- 建议：把转换表集中为不可变映射 + 显式拒绝 `DONE → *` 的非终止跳转。

#### C4. Nudge 注入累积 [Low]
- 位置：[lib/agent/context/exploration/NudgeGenerator.ts](lib/agent/context/exploration/NudgeGenerator.ts)。
- 场景：连续多轮反思 / 停滞 nudge 都注入消息流，若没有去重/合并，prompt 中堆叠 N 条相似提示。
- 建议：以 nudge 类别为 key 做"窗口去重"。

---

### 15.4 工具子系统（`tools/`、`core/ToolExecutionPipeline.ts`）

#### D1. 参数别名归一化的覆盖 [Medium]
- 位置：[lib/agent/tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `#normalizeParams`。
- 场景：LLM 同时给出 `file` 与 `filePath` 两个别名，归一化时后写入者覆盖前者，且无告警。
- 建议：检测到多别名命中同一目标时，记录 warning 并选择 schema 中显式声明的字段。

#### D2. 重复工具注册静默覆盖 [Medium]
- 位置：[lib/agent/tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `register(...)`。
- 场景：插件 / 热加载场景下同名工具被默默替换，调用者难以察觉。
- 建议：默认 `throw` 或 warn，提供显式 `replace: true` 选项。

#### D3. 工具异常被当作"正常观察"记录 [Medium]
- 位置：[lib/agent/tools/ToolRegistry.ts](lib/agent/tools/ToolRegistry.ts) `execute(...)` 的 catch 返回
  `{ error: ... }` + [core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts) `after` 记录。
- 场景：异常被序列化为 `{ error: "..." }` 当作工具结果写回 LLM；`observationRecord` /
  `trackerSignal` 把它当作普通调用计入"信息进展"，错误计数不递增。
- 建议：在 pipeline 上区分 `result` 与 `failure`，并把失败计入 `consecutiveToolFailures`。

#### D4. 中间件执行顺序未文档化 [Low]
- 位置：[lib/agent/core/ToolExecutionPipeline.ts](lib/agent/core/ToolExecutionPipeline.ts)。
- 场景：`trackerSignal` 与 `submitDedup` 等中间件存在隐式先后依赖（前者写 meta，后者读 meta）。
- 建议：为中间件引入 `priority` 或显式 `dependsOn`，并在 README 中固化顺序。

#### D5. 递归工具调用无深度上限 [Medium]
- 位置：[lib/agent/tools/composite.ts](lib/agent/tools/composite.ts) `submit_with_check` 等组合工具内部
  又调用 `submit_knowledge` 等。
- 场景：组合工具相互调用，理论上可能形成环；当前无 depth guard。
- 建议：执行上下文携带 depth，超过阈值（如 4）拒绝。

---

### 15.5 Forge 动态工具锻造（`forge/`）

#### E1. SandboxRunner 沙箱强度待审 [High，未完成验证]
- 位置：[lib/agent/forge/SandboxRunner.ts](lib/agent/forge/SandboxRunner.ts)。
- 场景：Node `vm` 模块本身不构成安全边界。若沙箱上下文暴露 `Object` / `Function` /
  `Promise` 原型，可经 `constructor.constructor('return process')()` 等链拿到 `process`、
  `require('child_process')`。
- 建议：彻底转用 `isolated-vm` / 子进程沙盒；最小白名单注入；网络/FS/进程能力默认关闭。

#### E2. 并发 forge 同名工具竞争 [Medium]
- 位置：[lib/agent/forge/ToolForge.ts](lib/agent/forge/ToolForge.ts) +
  [forge/TemporaryToolRegistry.ts](lib/agent/forge/TemporaryToolRegistry.ts)。
- 场景：两个并行维度同时为相同 intent 锻造工具 → 两次生成、两次注册、互相覆盖。
- 建议：对 `(intent, action, target)` 加 in-flight 锁，命中则共享 Promise。

#### E3. 临时工具 TTL 无定时器执行 [Medium]（待复核）
- 位置：[lib/agent/forge/TemporaryToolRegistry.ts](lib/agent/forge/TemporaryToolRegistry.ts)。
- 场景：若仅在 `lookup` 时按需淘汰，无访问期间过期工具长期占名；跨会话可能把上次锻造的临时
  工具暴露给新会话。
- 建议：周期清理 + 会话边界强制清空。

#### E4. 生成工具污染主 Registry [Medium]
- 位置：同上。
- 场景：若 generate 路径走的是 `ToolRegistry.register` 而非临时表，工具会"假"成全局工具，
  且 schema 来源于 LLM 输出未做严格校验。
- 建议：临时工具走独立命名空间 + 在 `getToolSchemas` 时按调用上下文过滤。

---

### 15.6 策略与管线（`strategies.ts` / `PipelineStrategy.ts`）

#### F1. Pipeline 重试不计入全局预算 [Medium]
- 位置：[lib/agent/PipelineStrategy.ts](lib/agent/PipelineStrategy.ts) Gate `retry` 分支。
- 场景：重试使用阶段独立预算，多阶段 × 多重试可能轻易突破 `BudgetPolicy.maxIterations` /
  `maxTokens`。
- 建议：在 strategy 内维护"已消耗预算累计器"，触顶时强制 `degrade`。

#### F2. FanOutStrategy 默认并发不可控 [Medium]
- 位置：[lib/agent/strategies.ts](lib/agent/strategies.ts) `FanOutStrategy.execute(...)`。
- 场景：`tiers` 仅约束已声明层；未声明层落入"无限并发"；N 大时打爆 LLM 提供商。
- 建议：提供全局默认 `concurrency`，并以 `Bottleneck`/`p-limit` 替代手写控制。

#### F3. FanOut 错误聚合策略不明 [Medium]
- 位置：同上。
- 场景：单维度失败时是 fail-fast 还是 continue 未在文档/类型中显式表达，调用方易误用。
- 建议：暴露 `errorMode: 'fail-fast' | 'continue'` 字段，并在结果中携带 `failures[]`。

#### F4. Stage Gate 自身异常不被捕获 [Medium]
- 位置：[lib/agent/PipelineStrategy.ts](lib/agent/PipelineStrategy.ts) `gate.evaluator(...)` 调用点。
- 场景：自定义 evaluator 抛异常时，未做 try/catch，整条 pipeline 崩溃；或在某些路径下被吞，
  低质结果直接通过。
- 建议：统一包装 evaluator，异常 → `degrade` 并记录原因。

#### F5. AdaptiveStrategy 决策不可测 [Low]
- 位置：[lib/agent/strategies.ts](lib/agent/strategies.ts) `AdaptiveStrategy`。
- 场景：决策依赖运行时 message + preset 文本启发式，缺少确定性测试覆盖。
- 建议：把决策函数抽离为纯函数 + 单测。

---

### 15.7 路由与消息（`AgentRouter.ts` / `IntentClassifier.ts` / `AgentMessage.ts` / `ConversationStore.ts`）

#### G1. 关键词路由重叠歧义 [Low]
- 位置：[lib/agent/AgentRouter.ts](lib/agent/AgentRouter.ts) 关键词正则表。
- 场景："扫描代码并生成知识"等混合句可能命中多条规则；当前以"先匹配为准"。
- 建议：当多条命中时，优先走 LLM 分类而非短路。

#### G2. ConversationStore 并发 append 非原子 [High]
- 位置：[lib/agent/ConversationStore.ts](lib/agent/ConversationStore.ts) `append(...)` 中 `fs.appendFile`/
  `appendFileSync` 的使用。
- 场景：同一会话被并发写（多个 SSE / 多渠道），两条 JSONL 行可能交织，导致 `load(...)` 解析失败。
- 建议：进程内 `Mutex`（按 conversationId）+ 跨进程 `proper-lockfile` / 独立写入服务。

#### G3. AgentMessage 工厂缺乏输入限制 [Medium]
- 位置：[lib/agent/AgentMessage.ts](lib/agent/AgentMessage.ts) `fromHttp` / `fromLark` / `fromMcp` / `fromCli`。
- 场景：超大 `content`、超长 metadata、含控制字符的字段未限制，存在 DoS 与 prompt-injection 风险。
- 建议：统一在工厂内校验长度、剥离控制字符；prompt 文本走 `sanitize`。

#### G4. IntentClassifier 强信号正则维护成本 [Low]
- 位置：[lib/agent/IntentClassifier.ts](lib/agent/IntentClassifier.ts) `IDE_STRONG_SIGNALS` /
  `BOT_STRONG_SIGNALS`。
- 场景：规则随产品演进易腐化；当前没有"规则命中率"埋点。
- 建议：增加规则命中统计（落到 `audit` 日志），定期回审。

---

### 15.8 状态、事件、生命周期

#### H1. AgentState catch-all 转移过于宽松 [Medium]
- 位置：[lib/agent/AgentState.ts](lib/agent/AgentState.ts) 阶段转移表。
- 场景：catch-all `from: '*'` 允许任意状态被外部事件拽回 `PLANNING`/`EXECUTING`，破坏终态。
- 建议：终态 (`COMPLETED`/`FAILED`/`ABORTED`) 显式作为 absorbing state。

#### H2. AgentEventBus.request 超时与 Promise 泄漏 [Medium]
- 位置：[lib/agent/AgentEventBus.ts](lib/agent/AgentEventBus.ts) `request(...)`/`reply(...)` 实现。
- 场景：未在超时时清理 `pendingRequests` map；若对端始终不 reply，map 永久持有 Promise。
- 建议：超时定时器 reject 时务必从 map 删除；测试覆盖未 reply 路径。

#### H3. Runtime 缺少 `dispose()` [Medium]
- 位置：[lib/agent/AgentRuntime.ts](lib/agent/AgentRuntime.ts)。
- 场景：长生命周期进程频繁创建 Runtime → 未清理 EventBus 监听、未关闭 LoopContext 中
  `AbortController`、未释放 capability 持有资源。
- 建议：标准化生命周期：`init → execute* → dispose`，dispose 内做幂等清理。

---

### 15.9 跨域与一致性

#### I1. 并发安全总评 [High]
- 综合 A1 / G2 / E2 / B4：当前 `AgentRuntime` 与下游协作者整体上**只在串行场景被充分验证**，
  FanOut 场景隐含较多共享可变状态。
- 建议：明确 Runtime 的"单 invocation 实例"模型；FanOut 内部统一通过 Factory 派生子 Runtime
  或 LoopContext。

#### I2. 类型侵蚀 — `any[]` / `Record<string, unknown>` 滥用 [Medium]
- 位置：例如 [lib/agent/AgentRuntimeTypes.ts](lib/agent/AgentRuntimeTypes.ts) 中 `ToolCallEntry`、
  `LoopContext.toolCalls` 字段；以及 `persona` / `memoryConfig` 等大量 `Record<string, unknown>`。
- 场景：编译期类型不能保护下游消费者；新增字段易漏更新调用点。
- 建议：以 `discriminated union` 描述工具调用，固化常用 config 类型。

#### I3. SystemPromptBuilder 无总长度上限 [Low]
- 位置：[lib/agent/core/SystemPromptBuilder.ts](lib/agent/core/SystemPromptBuilder.ts)。
- 场景：多个 capability 的 `promptFragment` + 阶段提示 + 缓存记忆叠加可能超过模型限制。
- 建议：构建末尾按 token 软上限做截断 + 标注，并把"被截断"事件透出到 EventBus。

#### I4. 配置/Preset 无运行时校验 [Medium]
- 位置：[lib/agent/presets.ts](lib/agent/presets.ts) / [lib/agent/policies.ts](lib/agent/policies.ts) /
  [lib/agent/capabilities.ts](lib/agent/capabilities.ts)。
- 场景：错误的 Preset 名 / 缺失 capability 等会在调用栈深处才暴露。
- 建议：`AgentFactory` 在构造时按 zod/类型守卫做一次性结构校验，失败立即报错。

#### I5. 模块依赖方向：`domain/` ↔ `agent/` [Low]（待复核）
- 位置：`domain/insight-*` 引用 `core/*`、`memory/*`，而 `agent/` 顶层又引用 `domain/`，存在
  扁平依赖隐患。
- 建议：明确"领域函数仅依赖纯类型 + 接口"，避免 capability 与 domain 互相 import 形成环。

---

### 15.10 优先级与建议修复顺序

| Rank | 问题编号 | 主题 | 严重 | 修复方向 |
|------|----------|------|------|----------|
| 1 | A1 / I1 | Runtime 并发安全 | High | per-invocation 协作者；FanOut 用 Factory 派生 |
| 2 | E1 | Sandbox 沙箱强度 | High | 切换 `isolated-vm` / 子进程隔离 |
| 3 | G2 | ConversationStore 写并发 | High | 文件锁 + per-conversation Mutex |
| 4 | A2 / H3 | 生命周期与监听器泄漏 | Medium | `Runtime.dispose()` 标准化 |
| 5 | A8 | 强制摘要兜底 | Medium | try/catch + 本地摘要回退 |
| 6 | A7 | 工具结果体积守门 | Medium | Pipeline 中间件做软上限 |
| 7 | B1 | 缓存黑名单完备性 | Medium | 改 schema-driven `cacheable` |
| 8 | B3 | Checkpoint 原子化 | Medium | `*.tmp` + `fsync` + `rename` |
| 9 | D3 | 工具异常归类 | Medium | `result vs failure` 区分 |
| 10 | F1 / F2 / F3 / F4 | Pipeline / FanOut 健壮性 | Medium | 全局预算累计 + 默认并发 + 错误聚合 + gate try/catch |
| 11 | A3 / A5 / A6 | Token / rollback / 错误计数语义 | Medium | 在 `LoopContext` 上集中管理 |
| 12 | C1 / C3 / C4 | ContextWindow / Tracker 边界 | Medium | L4 兜底 + 终态吸收 + nudge 去重 |
| 13 | I4 | Preset / Policy 运行时校验 | Medium | 构造期 zod 校验 |
| 14 | D1 / D2 / D4 / D5 | ToolRegistry / Pipeline 细节 | Low-Medium | 别名告警、显式覆盖、依赖声明、深度上限 |
| 15 | 其余 Low 项 | 类型 / 文档 / 监控 | Low | 重构窗口逐步处理 |

> 注：以上风险属"基于源码走读 + 经验推断"的清单，部分条目（标注"未验证 / 待复核"）需要补
> 充单元/集成测试或 fault injection 才能完全确认；建议优先为 High 项写复现用例，再决定修复
> 顺序与方案。
