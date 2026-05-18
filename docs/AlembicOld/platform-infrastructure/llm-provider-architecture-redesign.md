# LLM Provider 架构重设计 — 模型能力注册 + 参数约束驱动

> **状态**: P0-P4 全部已实现  
> **日期**: 2026-04-29 (更新: 2026-05-02)  
> **关联**: `lib/external/ai/` 全量改造
>
> ### 实现进度
>
> | 优先级 | 任务 | 状态 | 说明 |
> |--------|------|------|------|
> | **P0** | ModelRegistry + 模型定义 | ✅ 已实现 | 35+ 模型注册，含 deprecated 迁移 |
> | **P1** | ParameterGuard | ✅ 已实现 | 超出设计：**全部 4 个 Provider** 接入 (含 OpenAI/Google) |
> | **P2** | ProviderConfig 集中定义 | ✅ 已实现 | Dashboard/Routes 完全去硬编码化 |
> | **P3** | LLMGateway + Transport 重构 | ✅ 已实现 | 4 个 Transport + Gateway 统一入口 + AgentRuntime 双路径集成 |
> | **P4** | Dashboard 动态化 | ✅ 已实现 | LlmConfigModal 动态获取模型列表 |
>
> ### 测试覆盖
>
> | 测试文件 | 类型 | 数量 |
> |----------|------|------|
> | `test/unit/LlmRegistryAndGuard.test.ts` | 单元测试 | 45 |
> | `test/unit/LlmGatewayTransport.test.ts` | Gateway+Transport 单元测试 | 23 |
> | `test/integration/LlmConnectivity.test.ts` | 连通性测试 (真实 API) | 13 |

---

## 1. 现状问题深度剖析

### 1.1 模型差异处理碎片化

当前每个 Provider 都用硬编码逻辑处理模型差异，散落在至少 **8 个文件**中：

| 文件 | 模型差异处理 | 问题 |
|------|------------|------|
| `DeepSeekProvider.ts` | `#isV4()` 判断 → thinking 模式开关、`reasoning_content` 回传、`tool_choice` 禁用 | 300+ 行 V4 特化逻辑与通用逻辑混杂 |
| `ClaudeProvider.ts` | `#isOpus47()` 判断 → 跳过 temperature 参数 | 每出一个新 Claude 就要加新 regex |
| `ContextWindow.ts` | `MODEL_CONTEXT_WINDOWS` 正则匹配表 → 确定上下文窗口 | 30+ 行正则独立维护，与 Provider 无关联 |
| `AgentRuntime.ts` | `reasoningContent` 透传逻辑 → DeepSeek V4 专用 | Agent 层不应知道 Provider 细节 |
| `MessageAdapter.ts` | `reasoningContent ?? ''` 空值兜底 → V4 防御 | 存储层不应做 Provider 补丁 |
| `LlmConfigModal.tsx` | 各 Provider 的 `defaultModel` 硬编码 | 新增模型需同步修改 UI |
| `ai.ts` | 各 Provider 的 `defaultModel` 硬编码 | 与 UI 重复维护 |
| `.env.example` | 模型名称列表 | 文档级重复 |

**核心问题**: 添加一个新模型（如 Claude Opus 4.7）需要修改 5-8 个文件，且修改分散、容易遗漏。

### 1.2 类型系统分裂与降级路径风险

深度代码分析揭示的关键缺陷：

| 缺陷 | 位置 | 风险 |
|------|------|------|
| `chatWithTools` 默认实现**丢弃 tool 消息** | `AiProvider.ts` 329-347 行 | 未覆盖 `chatWithTools` 的 Provider 多轮工具链断裂 |
| `ChatWithToolsOptions.messages` 类型为 `unknown[]` | `AiProvider.ts` 67-75 行 | 与 `UnifiedMessage[]` 不强制一致，边界混用 |
| `FunctionCall` 缺少 `thoughtSignature` | `AgentRuntimeTypes.ts` 38-39 行 | Gemini thought 回传链路依赖扩展字段但类型层不对称 |
| `forced-summary.ts` 重新定义 `ChatWithToolsResult`，无 `reasoningContent` | `forced-summary.ts` 48-53 行 | 强制摘要时 reasoning 数据丢失 |
| `SimpleArrayAdapter` 无 `resolveTokenBudget` | `MessageAdapter.ts` 239-241 行 | 对话场景 vs 系统管线的上下文策略分裂 |
| `probe()` 固定 `chat('ping')` | `AiProvider.ts` 291-294 行 | 无法测试模型的实际能力（如 thinking、tools） |
| 基类型上放厂商专用字段 (`reasoningContent`) | `AiProvider.ts` 47-48 行 | "统一模型 + 厂商专用字段"耦合 |

这些问题的根源都是缺乏统一的模型能力描述和端到端的类型一致性。

### 1.3 缺失模型能力注册中心

当前没有统一的地方声明"一个模型能做什么、不能做什么"：

```
问题链:
  "Opus 4.7 能否设置 temperature?" → 看 ClaudeProvider.ts
  "DeepSeek V4 支持 tool_choice 吗?" → 看 DeepSeekProvider.ts
  "GPT-5.5 上下文窗口多大?" → 看 ContextWindow.ts
  "哪些模型支持 reasoning?" → 没有统一入口，分散在各处
```

### 1.4 Provider 职责过重

每个 Provider 都在做三件不同的事：

1. **协议转换** — 消息格式 → API 特定格式（OpenAI vs Anthropic vs ...）
2. **模型约束执行** — 参数过滤、默认值填充、pre-flight 校验
3. **响应解析** — API 响应 → 统一格式

这三者本应分离，当前全部耦合在同一个类中。

### 1.5 配置灵活性不足

```
当前配置方式:
  ALEMBIC_AI_PROVIDER=deepseek   ← 一个 provider
  ALEMBIC_AI_MODEL=deepseek-v4   ← 一个 model

问题:
  1. 无法表达 "agent 用 deepseek-v4, 聊天用 gpt-5.5"
  2. 无法为不同任务配置不同参数 (reasoning_effort, temperature)
  3. 无法配置 fallback 链 (V4 超限 → 降级到 V3)
  4. 新增 provider 需要修改 AiFactory 的 PROVIDER_MAP
```

---

## 2. 业界成熟方案参考

### 2.1 Vercel AI SDK — Provider Registry + Middleware

```typescript
// 关键设计: 声明式注册 + 中间件包装
const registry = createProviderRegistry({
  anthropic: customProvider({
    languageModels: {
      fast: anthropic('claude-haiku-4-5'),
      reasoning: wrapLanguageModel({
        model: anthropic('claude-sonnet-4-5'),
        middleware: defaultSettingsMiddleware({
          settings: {
            maxOutputTokens: 100_000,
            providerOptions: {
              anthropic: { thinking: { type: 'enabled', budgetTokens: 32000 } },
            },
          },
        }),
      }),
    },
    fallbackProvider: anthropic,
  }),
});

// 使用: 统一的 providerId:modelId
const model = registry.languageModel('anthropic:reasoning');
```

**启发**: 注册 + 别名 + 中间件 → 声明式配置模型行为

### 2.2 LLMRing — 模型能力数据库

```json
{
  "openai:gpt-5-2025-08-07": {
    "max_input_tokens": 272000,
    "max_output_tokens": 128000,
    "supports_function_calling": true,
    "supports_json_mode": true,
    "is_reasoning_model": true,
    "min_recommended_reasoning_tokens": 2000,
    "supports_thinking": false
  }
}
```

**启发**: 每个模型的能力是**数据**而非代码，应声明式描述。

### 2.3 openai-structured — 参数约束验证

```yaml
# parameter_constraints.yml
reasoning_effort:
  type: "enum"
  allowed_values: ["low", "medium", "high"]

temperature:
  type: "numeric"
  min_value: 0.0
  max_value: 2.0
```

```python
# 使用前校验
caps.validate_parameter("temperature", 0.7)  # o3 模型 → 抛出异常
```

**启发**: 参数约束应该是数据驱动的验证，而非 `if (isOpus47) skip` 式的硬编码。

### 2.4 llm-fns — 任务预设模式

```typescript
const reasoner = createLlm({
  defaultModel: { model: 'o3', reasoning_effort: 'high' }
});
const extractor = createLlm({
  defaultModel: { model: 'gpt-4o-mini', temperature: 0 }
});
```

**启发**: 按任务场景创建预配置客户端，一次配置、多处使用。

---

## 3. 设计方案

### 3.1 架构总览

```
目标架构分为 4 层 (全部 ✅ 已实现):

┌──────────────────────────────────────────────────────┐
│                  消费层 (AgentRuntime)                 │  ✅ 双路径: Gateway / Provider
│   modelRef = 'deepseek:deepseek-v4'                  │
│   result = await gateway.chatWithTools(...)           │
├──────────────────────────────────────────────────────┤
│               LLMGateway (统一入口)                    │  ✅ 已实现
│   - 解析 modelRef → provider + modelId               │
│   - 查询 ModelRegistry → 能力 & 约束                  │
│   - 执行 ParameterGuard → 过滤/默认值/校验            │
│   - 委托 Transport.chatWithTools()                   │
│   - 执行 ResponseNormalizer → 统一输出                │
├──────────────────────────────────────────────────────┤
│              ModelRegistry (能力注册)                  │  ✅ 已实现
│   - 声明式 TS 模型定义 (35+ 模型)                     │
│   - 上下文窗口、支持能力、参数约束                      │
│   - ParameterGuard 参数执行器                         │  ✅ 已实现
├──────────────────────────────────────────────────────┤
│          Transport 层 (纯协议转换)                     │  ✅ 已实现
│   OpenAiTransport │ ClaudeTransport │ DeepSeekTransport │ GoogleTransport
│   - 消息格式转换 + HTTP 请求 (不含参数校验)             │
│   - Provider 层保留为兼容层 (未使用 Gateway 时降级)     │
└──────────────────────────────────────────────────────┘
```

### 3.2 ModelRegistry — 模型能力注册中心

**设计原则**: 模型的能力和约束是**声明式数据**，而非散落的 `if` 判断。

```typescript
// lib/external/ai/registry/model-defs.ts  ← ✅ 已实现

export type ProviderId = 'openai' | 'deepseek' | 'claude' | 'google' | 'ollama' | 'mock';

export interface ModelDef {
  id: string;                    // 唯一标识: provider:apiModelId
  displayName: string;
  provider: ProviderId;
  apiModelId: string;            // 实际 API 调用使用的模型 ID
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: ModelCapabilities;
  reasoning: ReasoningSpec;
  parameterConstraints: ParameterConstraints;
  deprecated?: { retireDate: string; migrateToId: string };
}

export interface ModelCapabilities {
  toolCalling: boolean;
  vision: boolean;
  embedding: boolean;
  jsonMode: boolean;
  streaming: boolean;
}

export interface ReasoningSpec {
  supported: boolean;
  mode?: 'thinking' | 'adaptive' | 'reasoning_effort';
  requiresContentPassback?: boolean;
  defaultEffort?: string;        // 实现中放宽为 string (支持 'none'/'max' 等)
  effortLevels?: string[];
}

export interface ParameterConstraints {
  temperature?: ParameterRule<number>;
  topP?: ParameterRule<number>;
  topK?: ParameterRule<number>;
  toolChoice?: ParameterRule<string>;
  reasoningEffort?: ParameterRule<string>;
}

export interface ParameterRule<T> {
  allowed: boolean;
  disabledWhen?: string;
  defaultValue?: T;
  min?: T;
  max?: T;
  allowedValues?: T[];
}
```

**已注册模型总览** (截至 2026-05-02):

| Provider | 模型数 | 代表模型 | 文件 |
|----------|--------|----------|------|
| OpenAI | 10 | gpt-5.5, gpt-5.5-pro, gpt-5.4, gpt-5.4-pro, gpt-5.4-mini, gpt-5.4-nano, gpt-5, gpt-5-mini, gpt-5-nano, ~~gpt-4o~~ | `models/openai.ts` |
| Claude | 9 | claude-opus-4-7, sonnet-4-6, opus-4-6, opus-4-5, haiku-4-5, sonnet-4-5, opus-4-1, ~~sonnet-4~~, ~~opus-4~~ | `models/claude.ts` |
| DeepSeek | 4 | deepseek-v4-flash, v4-pro, ~~deepseek-chat~~, ~~deepseek-reasoner~~ | `models/deepseek.ts` |
| Google | 8 | gemini-3.1-pro-preview, 3-flash-preview, 3.1-flash-lite-preview, 3.1-flash, 2.5-pro, 2.5-flash, 2.0-flash, 1.5-pro | `models/google.ts` |
| Ollama | 4 | llama3, codellama, mistral, qwen3 | `models/ollama.ts` |

> ~~删除线~~ 表示 deprecated 模型（声明 `retireDate` + `migrateToId`）

**关键差异约束示例**:

```typescript
// Claude Opus 4.7: temperature/topP/topK 全部禁止 (API breaking change)
parameterConstraints: {
  temperature: { allowed: false },
  topP: { allowed: false },      // ← 实现中新增 (非原始设计)
  topK: { allowed: false },
  toolChoice: { allowed: true },
}

// DeepSeek V4: toolChoice 在 thinking 模式下被过滤，maxOutputTokens=384K
maxOutputTokens: 384_000,        // ← 修正: 原设计写 64K，实际 API 支持 384K
parameterConstraints: {
  temperature: { allowed: true, min: 0, max: 2 },
  toolChoice: { allowed: true, disabledWhen: 'thinking' },
  reasoningEffort: { allowed: true, allowedValues: ['high', 'max'] },
}

// OpenAI GPT-5.5: 全参数支持
parameterConstraints: {
  temperature: { allowed: true, min: 0, max: 2 },
  toolChoice: { allowed: true },
  reasoningEffort: { allowed: true, allowedValues: ['none','low','medium','high','xhigh'] },
}
```

### 3.3 ModelRegistry 运行时 API

```typescript
// lib/external/ai/registry/ModelRegistry.ts  ← ✅ 已实现 (含设计外增强)

export class ModelRegistry {
  #models = new Map<string, ModelDef>();

  constructor() {
    // 注册所有内置模型: OPENAI + CLAUDE + DEEPSEEK + GOOGLE + OLLAMA
    for (const def of ALL_BUILTIN_MODELS) {
      this.#models.set(def.id, def);
    }
  }

  /** 精确查找: 'openai:gpt-5.5' */
  get(modelRef: string): ModelDef | undefined;

  /** 模糊匹配: (provider, apiModelId) → 先尝试直接组合，再遍历 */
  resolve(provider: string, apiModelId: string): ModelDef | undefined;

  /** [新增] 智能解析 — 精确 → 组合 → 动态默认定义 (永不返回 undefined) */
  resolveOrCreate(provider: string, apiModelId: string): ModelDef;

  /** 列出指定 provider 的所有非废弃模型 */
  listByProvider(provider: string): ModelDef[];

  /** [新增] 列出所有非废弃模型 */
  listActive(): ModelDef[];

  /** 按能力查询 (只返回非废弃模型) */
  findByCapability(cap: keyof ModelDef['capabilities']): ModelDef[];

  /** 获取上下文窗口 — 签名改为 (provider, apiModelId) 更灵活 */
  getContextWindow(provider: string, apiModelId: string): number | undefined;

  /** 运行时注册自定义模型 */
  register(def: ModelDef): void;

  /** [新增] 为未注册模型创建保守默认定义 (128K ctx, 8K out, 无 reasoning) */
  createDynamicDef(provider: ProviderId, apiModelId: string): ModelDef;
}

/** 全局单例 */
export function getModelRegistry(): ModelRegistry;
```

**与原始设计的差异**:

| 项目 | 原始设计 | 实际实现 |
|------|----------|----------|
| `resolve()` | 遍历全量匹配 | 先 Map 直接查找，再 fallback 遍历 (性能优化) |
| `resolveOrCreate()` | 不存在 | 新增，保证永不返回 undefined |
| `listByProvider()` | 返回包含 deprecated | 自动过滤 deprecated |
| `listActive()` | 不存在 | 新增全局查询 |
| `getContextWindow()` | 接受 modelRef | 接受 (provider, apiModelId) 二元组 |
| `createDynamicDef()` | 内联在 Gateway 中 | 提取到 Registry 公开方法 |

### 3.4 ParameterGuard — 参数约束执行器

**设计原则**: 在 API 调用**之前**，根据 `ModelDef.parameterConstraints` 自动过滤/修正参数，**替代各 Provider 中分散的 if 判断**。

```typescript
// lib/external/ai/guard/ParameterGuard.ts  ← ✅ 已实现 (增强版)

export interface GuardedParams {
  temperature?: number;
  topP?: number;
  topK?: number;              // ← 新增: 原设计未包含
  maxTokens?: number;
  toolChoice?: string;
  reasoningEffort?: string;
  filtered: FilteredParam[];  // 被过滤的参数审计日志
}

export class ParameterGuard {
  static guard(model: ModelDef, rawParams: Record<string, unknown>): GuardedParams;

  // 内部实现分为 6 个独立 guard 方法:
  static #guardTemperature(...)   // null 安全，范围 clamp
  static #guardTopP(...)          // null 安全，范围 clamp
  static #guardTopK(...)          // ← 新增: Claude Opus 4.7 topK 禁止
  static #guardToolChoice(...)    // disabledWhen='thinking' 条件过滤
  static #guardReasoningEffort(.) // ← 修复: 不允许时也记录 filtered 审计日志
  static #guardMaxTokens(...)     // clamp to model.maxOutputTokens
}
```

**与原始设计的差异**:

| 项目 | 原始设计 | 实际实现 |
|------|----------|----------|
| `topK` guard | 不存在 | 新增，处理 Claude Opus 4.7 的 topK 禁止 |
| `topP` guard | 不存在 | 新增，处理 Claude Opus 4.7 的 topP 禁止 |
| `toolChoice` null 检查 | `!== 'auto'` 跳过 | null/undefined 安全检查，`'auto'` 也正常通过 |
| `reasoningEffort` 不允许 | 静默丢弃 | 记录 filtered 审计日志 (一致性修复) |
| 接入 Provider | 仅 Claude + DeepSeek | **全部 4 个 Provider**: OpenAI、Claude、DeepSeek、Google |

**Guard 已接入的 Provider 方法**:

| Provider | chat() | chatWithTools() | 保护参数 |
|----------|--------|-----------------|----------|
| OpenAiProvider | ✅ | ✅ | temperature, maxTokens, toolChoice |
| ClaudeProvider | ✅ | ✅ | temperature, maxTokens, toolChoice |
| DeepSeekProvider | — | ✅ (toolChoice) | toolChoice (temperature 由 V4 协议层单独处理) |
| GoogleGeminiProvider | ✅ | ✅ | temperature, maxTokens |

### 3.5 LLMGateway — 统一调用网关 ✅ 已实现

> **文件**: `lib/external/ai/gateway/LLMGateway.ts`

**设计原则**: 消费者只与 Gateway 交互，不直接接触 Provider/Transport。Gateway 协调 Registry + Guard + Transport。

**核心职责链**: `resolve model → guard params → delegate to transport → normalize response`

**实际实现 API**:

| 方法 | 说明 |
|------|------|
| `chatWithTools(request: GatewayRequest)` | 统一工具调用入口，自动 resolve + guard + transport |
| `chat(request: GatewayChatRequest)` | 简单单轮对话 |
| `chatStructured(request: GatewayChatRequest)` | JSON 格式约束的 chat |
| `embed(modelRef, texts)` | 向量嵌入 |
| `getModelDef(modelRef)` | 查询模型定义 |
| `getLLMGateway()` | 单例工厂 |

**关键实现细节**:

- **参数过滤语义**: 被 ParameterGuard 过滤的参数 **不会回退到原始值**，通过 `wasFiltered()` 辅助函数实现
- **Transport 懒创建**: Transport 实例按需创建并缓存，通过 `#transports: Map<ProviderId, LLMTransport>` 管理
- **环境变量自动读取**: 如未显式传入 API key，自动从 `ALEMBIC_*_API_KEY` 读取
- **模型名推测**: 支持 `provider:model`、纯 `modelId`、以及从 model name 前缀推断 provider

### 3.6 LLMTransport — 纯协议转换层 ✅ 已实现

> **文件**: `lib/external/ai/transport/LLMTransport.ts` (抽象基类) + 4 个具体实现

**设计原则**: Transport **只做协议转换**，不做参数校验。所有参数约束由 Gateway + ParameterGuard 处理。

| Transport | 文件 | 特殊处理 |
|-----------|------|----------|
| OpenAiTransport | `transport/OpenAiTransport.ts` | OpenAI Chat Completions 标准格式 |
| ClaudeTransport | `transport/ClaudeTransport.ts` | Anthropic Messages API, content blocks, 消息交替合并 |
| DeepSeekTransport | `transport/DeepSeekTransport.ts` | V4 thinking 开关, reasoning_content 回传, max_tokens 自动提升 |
| GoogleTransport | `transport/GoogleTransport.ts` | Gemini contents 格式, functionDeclarations, thoughtSignature, schema 清理 |

**TransportRequest / TransportResponse 核心接口**:

```typescript
interface TransportRequest {
  model: string;
  messages: UnifiedMessage[];
  systemPrompt?: string;
  tools?: ToolSchema[];
  toolChoice?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: string;
  responseFormat?: 'text' | 'json';
  abortSignal?: AbortSignal;
}

interface TransportResponse {
  text: string | null;
  functionCalls: TransportFunctionCall[] | null;
  usage: TokenUsage | null;
  reasoningContent?: string | null;
}
```

**与原始设计的差异**:

| 项目 | 原始设计 | 实际实现 |
|------|----------|----------|
| 主方法名 | `execute()` | `chatWithTools()` + `chat()` (分离简单/工具场景) |
| `_modelDef` 传递 | Transport 接收 ModelDef | Transport 自行处理协议差异，不需要 ModelDef |
| embed 支持 | 未设计 | 基类提供默认空实现，OpenAi/DeepSeek/Google 覆写 |
| HTTP 工具 | 未设计 | 基类提供 `post()` + `requireApiKey()` 共享方法 |

### 3.7 Provider 配置集中管理 ✅ 已实现

```typescript
// lib/external/ai/registry/ProviderConfig.ts  ← ✅ 已实现

export interface ProviderConfig {
  id: string;
  displayName: string;
  defaultModelId: string;       // 引用 ModelDef.id
  keyEnvVar: string;
  baseUrlEnvVar?: string;
  baseUrl: string;              // 默认 base URL
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'openai',
    displayName: 'OpenAI',
    defaultModelId: 'openai:gpt-5.5',
    keyEnvVar: 'ALEMBIC_OPENAI_API_KEY',
    baseUrlEnvVar: 'ALEMBIC_OPENAI_BASE_URL',
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'claude',
    displayName: 'Claude',
    defaultModelId: 'claude:claude-sonnet-4-6',
    keyEnvVar: 'ALEMBIC_CLAUDE_API_KEY',
    baseUrlEnvVar: 'ALEMBIC_CLAUDE_BASE_URL',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    defaultModelId: 'deepseek:deepseek-v4-flash',
    keyEnvVar: 'ALEMBIC_DEEPSEEK_API_KEY',
    baseUrlEnvVar: 'ALEMBIC_DEEPSEEK_BASE_URL',
    baseUrl: 'https://api.deepseek.com',
  },
  {
    id: 'google',
    displayName: 'Google Gemini',
    defaultModelId: 'google:gemini-3-flash-preview',
    keyEnvVar: 'ALEMBIC_GOOGLE_API_KEY',
    baseUrlEnvVar: 'ALEMBIC_GOOGLE_BASE_URL',
    baseUrl: 'https://generativelanguage.googleapis.com',
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    defaultModelId: 'ollama:llama3',
    keyEnvVar: '',
    baseUrlEnvVar: 'ALEMBIC_OLLAMA_BASE_URL',
    baseUrl: 'http://127.0.0.1:11434/v1',
  },
];
```

**Dashboard / Routes 消费**: 不再硬编码，直接读取 `PROVIDER_CONFIGS` + `ModelRegistry`。

```typescript
// 替代当前 LlmConfigModal.tsx / ai.ts 中的硬编码列表
const providers = PROVIDER_CONFIGS.map(p => ({
  id: p.id,
  label: p.displayName,
  defaultModel: registry.get(p.defaultModelId)?.apiModelId,
  models: registry.listByProvider(p.id).map(m => ({
    id: m.apiModelId,
    name: m.displayName,
    contextWindow: m.contextWindow,
    deprecated: !!m.deprecated,
  })),
}));
```

---

## 4. 改造路径 (增量迁移)

### 4.1 阶段一: 引入 ModelRegistry (无破坏性) ✅ 已完成

**范围**: 新增文件，不改现有 Provider

```
新增:                                              状态
  lib/external/ai/registry/
    ├── model-defs.ts                              ✅ ModelDef/ParameterRule/ProviderConfig 接口
    ├── ModelRegistry.ts                           ✅ 注册中心 + 全局单例
    ├── ProviderConfig.ts                          ✅ 5 个 Provider 配置
    └── models/
        ├── openai.ts                              ✅ 10 个模型 (含 1 deprecated)
        ├── claude.ts                              ✅ 9 个模型 (含 2 deprecated)
        ├── deepseek.ts                            ✅ 4 个模型 (含 2 deprecated)
        ├── google.ts                              ✅ 8 个模型
        └── ollama.ts                              ✅ 4 个动态模型模板

修改:
  lib/agent/context/ContextWindow.ts               ✅ 优先 Registry 查询, regex fallback 保留
```

### 4.2 阶段二: 引入 ParameterGuard ✅ 已完成 (超出原设计范围)

**范围**: 新增 Guard，**全部 4 个 Provider** 接入 (原设计仅 Claude + DeepSeek)

```
新增:                                              状态
  lib/external/ai/guard/ParameterGuard.ts          ✅ 6 个参数 guard (含 topP/topK)

修改:
  lib/external/ai/providers/ClaudeProvider.ts      ✅ 移除 #isOpus47(), guard 处理 temp/topP/toolChoice
  lib/external/ai/providers/DeepSeekProvider.ts    ✅ guard 处理 toolChoice thinking 过滤
  lib/external/ai/providers/OpenAiProvider.ts      ✅ [超出设计] 新增 guard 集成
  lib/external/ai/providers/GoogleGeminiProvider.ts ✅ [超出设计] 新增 guard 集成, name 修正为 'google'
```

**额外修复 (代码审查发现)**:
- `ParameterGuard`: 新增 `#guardTopK` (Claude Opus 4.7 声明 `topK: false` 但无处执行)
- `ParameterGuard`: `reasoningEffort` 不允许时也记录审计日志 (一致性)
- `GoogleGeminiProvider`: `this.name` 从 `'google-gemini'` 修正为 `'google'` (匹配 Registry `ProviderId`)
- `ClaudeProvider.chatWithTools`: `toolChoice` 也传给 guard (原实现遗漏)

### 4.3 阶段三: 抽取 LLMTransport + LLMGateway ✅ 已完成

**范围**: 从 Provider 中提取纯协议层为 Transport，创建 Gateway 统一入口

```
新增:                                              状态
  lib/external/ai/transport/
    ├── LLMTransport.ts                            ✅ 抽象基类 + 共享 HTTP 工具
    ├── OpenAiTransport.ts                         ✅ OpenAI Chat Completions 协议
    ├── ClaudeTransport.ts                         ✅ Anthropic Messages API 协议
    ├── DeepSeekTransport.ts                       ✅ DeepSeek V4 + thinking 协议
    ├── GoogleTransport.ts                         ✅ Gemini REST API 协议
    └── index.ts                                   ✅ barrel export

  lib/external/ai/gateway/
    ├── LLMGateway.ts                              ✅ 统一调用网关 + 单例
    └── index.ts                                   ✅ barrel export

修改:
  lib/agent/runtime/AgentRuntime.ts                ✅ #gateway 双路径 (Gateway / Provider 兼容)
  lib/agent/runtime/AgentRuntimeTypes.ts           ✅ RuntimeConfig.gateway + FunctionCall.thoughtSignature
```

**P3 同步修复 (全部已完成)**:
- ✅ `ChatWithToolsOptions.messages` 类型从 `unknown[]` → `UnifiedMessage[]`
- ✅ `ChatWithToolsOptions.toolSchemas` 类型从 `unknown[]` → `ToolSchema[]`
- ✅ `AgentRuntimeTypes.FunctionCall` 补齐 `thoughtSignature` 字段
- ✅ `forced-summary.ts` 复用统一 `ChatWithToolsResult` 类型 (移除本地重复定义)
- ✅ 各 Provider 移除不再需要的 `as` 类型断言 (OpenAi/Claude/DeepSeek/Google/Ollama)

### 4.4 阶段四: Dashboard + 配置统一 ✅ 已完成 (`.env.example` 除外)

```
修改:                                              状态
  dashboard/src/components/Modals/LlmConfigModal.tsx ✅ API 动态获取 provider + model 列表
  dashboard/src/api.ts                             ✅ AiProviderInfo / AiProviderModelInfo 类型更新
  lib/http/routes/ai.ts                            ✅ GET /api/v1/ai/providers 使用 Registry 数据
  .env.example                                     ⚠️ 未更新 (仍为旧格式, 非阻塞)
```

---

## 5. 关键设计决策

### 5.1 为什么不直接用 Vercel AI SDK / LiteLLM？

| 考量 | Vercel AI SDK | LiteLLM | 自建 |
|------|-------------|---------|------|
| 语言 | TypeScript ✅ | Python ❌ | TypeScript ✅ |
| 集成成本 | 需要全面替换 Provider 接口 | 需要额外进程 | 增量迁移 |
| 定制性 | 中 (middleware 可定制) | 低 (proxy 模式) | 高 |
| DeepSeek V4 thinking | 不支持 | 部分支持 | 完全控制 |
| 依赖 | 引入新包依赖 | 引入 Python + 网络 | 零外部依赖 |

**结论**: 吸收 Vercel AI SDK 的 Registry + Middleware **设计理念**，但自建实现以保持对 DeepSeek V4 thinking 等特殊能力的完全控制。

### 5.2 为什么选择声明式 ModelDef 而非 YAML/JSON？

1. **类型安全**: TypeScript 接口 → 编译时检查
2. **IDE 支持**: 自动补全、重构友好
3. **可测试**: 直接 import 后断言
4. **零运行时解析**: 不需要 YAML 解析器

### 5.3 向后兼容策略

- 旧的 `ALEMBIC_AI_PROVIDER` + `ALEMBIC_AI_MODEL` 环境变量**继续支持**
- `LLMGateway.#resolveModel()` 自动将旧格式组合为 `provider:model`
- 旧 Provider 类在阶段三之后作为 **thin wrapper** 存在一段时间
- 所有改造分阶段进行，每阶段独立可验证

---

## 6. 改造前后对比

### 添加新模型的工作量

**改造前** (以 Claude Opus 4.7 为例):
1. `ClaudeProvider.ts` — 添加 `#isOpus47()` + temperature 判断 ← **代码逻辑**
2. `ContextWindow.ts` — 添加正则匹配规则 ← **正则维护**
3. `LlmConfigModal.tsx` — 更新 defaultModel ← **UI 硬编码**
4. `ai.ts` — 更新 defaultModel ← **API 硬编码**
5. `.env.example` — 更新示例 ← **文档**

**改造后 (当前 P0-P2 完成状态)**:
1. `registry/models/claude.ts` — 添加一个 `ModelDef` 对象 ← **唯一数据修改点**
2. Dashboard、Routes、ContextWindow、ParameterGuard **全部自动生效** ✅ 已验证

```typescript
// 一个对象，描述一切
{
  id: 'claude:claude-opus-4-7',
  contextWindow: 1_000_000,
  parameterConstraints: { temperature: { allowed: false }, topP: { allowed: false }, topK: { allowed: false } },
  // ... 完整声明
}
```

> **注**: Provider 仍保留 `#getModelDef()` + `ParameterGuard.guard()` 调用作为兼容层。
> 使用 LLMGateway 路径时，Guard 逻辑由 Gateway 统一执行，Provider 不参与。

### 处理 DeepSeek V4 reasoning_content

**改造前**: 跨 5 个文件的防御性代码
- `DeepSeekProvider.ts`: `#validateV4Messages()`, `reasoning_content` mapping
- `ContextWindow.ts`: `reasoningContent ?? ''` 存储
- `MessageAdapter.ts`: `reasoningContent ?? ''` 存储
- `AgentRuntime.ts`: `reasoningContent` 透传
- `DeepSeekProvider.ts`: `#compactL1()` 不清理 reasoning

**改造后 (P3 已实现)**:
- `ModelDef.reasoning.requiresContentPassback = true` ← **声明意图** ✅
- `DeepSeekTransport.#buildToolMessages()` ← reasoning_content 回传的唯一实现点 ✅
- `DeepSeekTransport.#validateV4Messages()` ← preflight 校验 ✅
- `ParameterGuard` 自动过滤 V4 thinking 模式下的 `toolChoice` ✅
- `LLMGateway` 自动将 `reasoningContent` 归一化到 `ChatWithToolsResult` ✅

---

## 7. 实施优先级

| 优先级 | 任务 | 影响 | 状态 |
|--------|------|------|------|
| **P0** | ModelRegistry + 模型定义 | 消除 ContextWindow 正则表，统一模型数据源 | ✅ 已完成 |
| **P1** | ParameterGuard | 消除 Provider 中所有 if-model 参数判断 | ✅ 已完成 (全 4 Provider) |
| **P2** | ProviderConfig 集中定义 | 消除 Dashboard/Routes 硬编码 | ✅ 已完成 |
| **P3** | LLMGateway + Transport 重构 | 完成架构分层，端到端类型一致 | ✅ 已完成 |
| **P4** | Dashboard 动态化 | 前端自动感知可用模型 | ✅ 已完成 |

### 当前文件清单

```
lib/external/ai/
├── registry/                     ← P0 新增
│   ├── model-defs.ts             # 核心接口: ModelDef, ParameterRule, ProviderConfig
│   ├── ModelRegistry.ts          # 运行时注册中心 + 全局单例
│   ├── ProviderConfig.ts         # 5 个 Provider 的集中配置
│   └── models/
│       ├── openai.ts             # 10 个 OpenAI 模型
│       ├── claude.ts             # 9 个 Claude 模型
│       ├── deepseek.ts           # 4 个 DeepSeek 模型
│       ├── google.ts             # 8 个 Google Gemini 模型
│       └── ollama.ts             # 4 个 Ollama 模板模型
├── guard/                        ← P1 新增
│   └── ParameterGuard.ts         # 6 参数 guard (temp/topP/topK/toolChoice/effort/maxTokens)
├── gateway/                      ← P3 新增
│   ├── LLMGateway.ts             # 统一调用网关 + 单例工厂
│   └── index.ts                  # barrel export
├── transport/                    ← P3 新增
│   ├── LLMTransport.ts           # 抽象基类 + TransportRequest/Response 类型
│   ├── OpenAiTransport.ts        # OpenAI Chat Completions 协议
│   ├── ClaudeTransport.ts        # Anthropic Messages API 协议
│   ├── DeepSeekTransport.ts      # DeepSeek V4 + thinking 协议
│   ├── GoogleTransport.ts        # Gemini REST API 协议
│   └── index.ts                  # barrel export
├── providers/                    ← P1 修改 (保留为兼容层)
│   ├── OpenAiProvider.ts         # + ParameterGuard 集成
│   ├── ClaudeProvider.ts         # + ParameterGuard 集成
│   ├── DeepSeekProvider.ts       # + ParameterGuard 集成
│   └── GoogleGeminiProvider.ts   # + ParameterGuard 集成, name='google'
├── AiProvider.ts                 # 基类 + 统一类型定义 (ChatWithToolsOptions 类型修复)
├── AiFactory.ts                  # 工厂
└── AiProviderManager.ts          # 管理器

lib/agent/runtime/
├── AgentRuntime.ts               # + Gateway 双路径集成 (#gateway / aiProvider)
├── AgentRuntimeTypes.ts          # + FunctionCall.thoughtSignature, RuntimeConfig.gateway
└── forced-summary.ts             # + 复用统一 ChatWithToolsResult

test/
├── unit/LlmRegistryAndGuard.test.ts          # 45 个单元测试
├── unit/LlmGatewayTransport.test.ts          # 23 个 Gateway+Transport 测试
└── integration/LlmConnectivity.test.ts       # 13 个连通性测试
```

### 连通性验证结果 (2026-05-02, BiliDili API Key)

| Provider | chat() | chatWithTools() | 说明 |
|----------|--------|-----------------|------|
| DeepSeek V4 Flash | ✅ 826ms | ✅ 1.4s + reasoning | toolChoice 被 guard 正确过滤 |
| Google Gemini 2.5 Flash | ✅ 1.7s | ✅ 1.0s + functionCall | temperature 正常传递 |
| OpenAI GPT-5.5 | ⚠️ 429 | ⚠️ 429 | 账户 quota 耗尽 (非代码问题) |
| Claude | — | — | 无 API Key |
