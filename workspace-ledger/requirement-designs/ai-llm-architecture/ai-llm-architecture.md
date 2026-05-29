# Alembic AI / LLM 调用架构与接入现状

> 适用范围：`@alembic/agent`（provider / gateway / transport 层）+ `Alembic`（冷启动、数据挖掘、依赖注入接线）。
> 编写日期：2026-05-29。基于对 `AlembicAgent/src/external/ai/**`、`AlembicAgent/src/agent/runtime/**` 与 `Alembic/lib/**` 真实代码的逐文件追踪。
> 用途：说明多厂商 LLM 接入方式、中转站配置、冷启动 AgentRuntime 的 LLM 调用路径与项目内调用分叉，以及当前架构遗留问题。

---

## 1. 总览：两套并行的 LLM 调用实现

代码里**同时存在两套独立的 LLM 调用实现**，它们各自完成协议转换，互不复用：

| 实现 | 位置 | 状态 | 入口方法 |
| --- | --- | --- | --- |
| **Provider 层**（厂商直连） | `AlembicAgent/src/external/ai/providers/*.ts` | ✅ 生产实际使用 | `chat()` / `chatWithTools()` / `chatWithStructuredOutput()` / `embed()` |
| **Gateway + Transport 层** | `AlembicAgent/src/external/ai/gateway/` + `transport/` | ⚠️ 预留，**生产未启用** | `LLMGateway.chatWithTools()` → `*Transport.chatWithTools()` |

关键事实：**生产环境（含冷启动数据挖掘）只走 Provider 层**。Gateway/Transport 是为「集中参数校验 + 模型映射 + Transport 选择」预留的可选优化路径，但当前没有任何生产代码构造 `LLMGateway` 或把 `gateway` 注入 `AgentRuntime`（详见 §4、§6）。

---

## 2. Provider 层：多厂商接入现状

所有 Provider 继承自 `AiProvider`（`AlembicAgent/src/external/ai/AiProvider.ts`），互不继承，各自独立实现协议转换。由 `AiFactory.createProvider()` 按 provider 名构造（`AlembicAgent/src/external/ai/AiFactory.ts`）。

### 2.1 工厂映射表

`AiFactory.ts` 的 `PROVIDER_MAP`：

| provider 名（别名） | Provider 类 | 协议 |
| --- | --- | --- |
| `google` / `google-gemini` / `gemini` | `GoogleGeminiProvider` | Gemini REST `v1beta` |
| `openai` | `OpenAiProvider` | Chat Completions **或** Responses API（可切换） |
| `deepseek` | `DeepSeekProvider` | OpenAI 兼容 Chat Completions（含 V4 thinking） |
| `claude` / `anthropic` | `ClaudeProvider` | Anthropic Messages API |
| `ollama` | `OllamaProvider` | 本地 OpenAI 兼容 API |

### 2.2 各 Provider 关键特征

| Provider | 默认模型 | API Key 环境变量 | baseUrl 覆盖环境变量 | 原生工具调用 | 备注 |
| --- | --- | --- | --- | --- | --- |
| `OpenAiProvider` | `ALEMBIC_AI_MODEL` | `ALEMBIC_OPENAI_API_KEY` | ✅ `ALEMBIC_OPENAI_BASE_URL` | ✅ | 支持 `apiStyle` 切换 chat / responses（见 §3、§5） |
| `ClaudeProvider` | `claude-sonnet-4-6` | `ALEMBIC_CLAUDE_API_KEY` | ✅ `ALEMBIC_CLAUDE_BASE_URL` | ✅ | Messages API；Opus 4.7 等模型禁非默认 temperature |
| `DeepSeekProvider` | `deepseek-v4-flash` | `ALEMBIC_DEEPSEEK_API_KEY` | ✅ `ALEMBIC_DEEPSEEK_BASE_URL` | ✅ | V4 thinking + `reasoning_effort`（high/max） |
| `GoogleGeminiProvider` | `gemini-3-flash-preview` | `ALEMBIC_GOOGLE_API_KEY` | ❌ **无 baseUrl 覆盖** | ✅ | baseUrl 硬编码 `generativelanguage.googleapis.com`；并发可调 |
| `OllamaProvider` | `llama3` | 固定 dummy `ollama` | ✅ `ALEMBIC_OLLAMA_BASE_URL` | ✅ | 本地服务，无需真实 key |

> ⚠️ **不一致点**：`GoogleGeminiProvider` 是唯一没有 baseUrl 环境变量覆盖的 provider，无法直接指向兼容网关/中转站。其余 4 家都支持 `ALEMBIC_<PROVIDER>_BASE_URL`。

### 2.3 Provider 选择与 fallback

- `autoDetectProvider()`（`AiFactory.ts`）：优先用 `ALEMBIC_AI_PROVIDER` 指定的 provider；若指定但对应 key 缺失，则回退到「有 key 的第一个」（顺序：google → openai → claude → deepseek）。全无 key 时返回 `null`，AI 功能跳过。
- `getProviderWithFallback()`：主 provider `probe()` 失败且判定为地理限制/provider 级错误（`isGeoOrProviderError`）时，自动切换到其它有 key 的 provider。
- `createEmbedProvider()`：当设置 `ALEMBIC_EMBED_PROVIDER` 时，创建**独立的 embedding provider**（独立 key / baseUrl / model），使 embedding 与生成可用不同厂商。

---

## 3. 中转站（OpenAI 兼容代理）配置

中转站（例如本次使用的第三方聚合网关）通过 **baseUrl 覆盖 + apiStyle 切换**接入，无需改动业务代码。

### 3.1 gpt 系（仅开放 Responses API 的中转站）

部分中转站对 gpt 系只暴露 `/v1/responses`，不提供 `/chat/completions`（请求会 404），也无 `/embeddings`。需开启 Responses 模式：

```bash
export ALEMBIC_AI_PROVIDER=openai
export ALEMBIC_OPENAI_BASE_URL=https://<中转站域名>/v1
export ALEMBIC_OPENAI_API_STYLE=responses        # 关键：切到 Responses API
export ALEMBIC_OPENAI_API_KEY=sk-...
export ALEMBIC_AI_MODEL=gpt-5.x                   # 用中转站套餐里的模型名
```

### 3.2 Claude 系（Anthropic 原生 Messages API）

中转站若以 Anthropic 原生 `/v1/messages` 暴露 Claude，则用 `claude` provider，无需 apiStyle：

```bash
export ALEMBIC_AI_PROVIDER=claude
export ALEMBIC_CLAUDE_BASE_URL=https://<中转站域名>/v1
export ALEMBIC_CLAUDE_API_KEY=sk-...
export ALEMBIC_AI_MODEL=claude-opus-4-x
```

### 3.3 Embedding 走本地（与 LLM 解耦）

数据挖掘的 embedding 已下沉本地（如本地 Qwen / Ollama），与中转站 LLM 解耦，因此中转站没有 `/embeddings` 端点不影响主链路。可用 `ALEMBIC_EMBED_PROVIDER` + `ALEMBIC_EMBED_*` 配置独立 embed provider。

---

## 4. Gateway + Transport 层（第二套实现，未启用）

### 4.1 结构

- `LLMGateway`（`gateway/LLMGateway.ts`）：`chatWithTools({ modelRef, ... })` → `#resolveModel(modelRef)`（按 `provider:model` 解析）→ `ParameterGuard` → `transport.chatWithTools()` → 响应归一化。单例 `getLLMGateway()`。
- `LLMTransport`（`transport/LLMTransport.ts`）：抽象协议层，只做 `TransportRequest ↔ 厂商 HTTP ↔ TransportResponse`。子类：`OpenAiTransport`、`ClaudeTransport`、`DeepSeekTransport`、`GoogleTransport`。

### 4.2 与 Provider 层的关键差异（风险点）

`OpenAiTransport`（`transport/OpenAiTransport.ts`）**硬编码 `/chat/completions`**，且**不支持 Responses API**：

```ts
const data = await this.post(`${this.baseUrl}/chat/completions`, body, ...);
```

它带 baseUrl 覆盖（构造时 `config.baseUrl || OPENAI_BASE`），但没有 `apiStyle` 概念。**若未来启用 Gateway 路径接中转站 gpt，会直接 404**——因为 §3.1 的 Responses 适配只做在 Provider 层，没同步到 Transport 层。

### 4.3 ModelRegistry 对未知模型的处理

`ModelRegistry.resolveOrCreate()`（`registry/ModelRegistry.ts`）对未注册模型名会 `createDynamicDef()` 生成保守默认（128K ctx / 8K out / toolCalling=true）。所以中转站自定义模型名不会因「未注册」而报错，但能力声明是猜测值。

---

## 5. OpenAiProvider 的 Responses API 适配（本次新增）

`OpenAiProvider` 通过 `#apiStyle: 'chat' | 'responses'` 字段在两套 OpenAI 协议间切换：

- 来源优先级：`config.apiStyle` → `ALEMBIC_OPENAI_API_STYLE` → 默认 `'chat'`。
- `chat()` / `chatWithTools()` / `chatWithStructuredOutput()` 在 `apiStyle === 'responses'` 时分流到 `#responsesChat` / `#responsesChatWithTools` / `#responsesChatWithStructuredOutput`。
- Responses 专有实现要点：
  - `#buildResponsesInput()`：统一消息 → Responses `input` 项；`user` → `input_text`，`assistant` 文本 → `output_text` + `function_call` 项，`tool` → `function_call_output`；`call_id` 在 function_call / output 间原样回传，保证 ReAct 多轮闭合。
  - `#parseResponsesOutput()`：聚合 `output_text`、提取 `function_call`（call_id/name/arguments）、归一化 usage（`input_tokens`/`output_tokens`）、`finishReason = status`。
  - 工具 schema 用扁平格式 `{ type:'function', name, description, parameters }`（非 Chat Completions 的嵌套 `function:{...}`）。
  - 结构化输出用 `text.format = { type:'json_object' }` + `max_output_tokens`。
- 经典 Chat Completions 路径保持不变（默认），新逻辑不污染旧路径。

测试：`AlembicAgent/test/OpenAiProvider.test.ts`（mock fetch，覆盖 baseUrl 覆盖、Responses chat/tools/结构化、function_call 多轮映射）。

---

## 6. 冷启动数据挖掘的 LLM 调用链路

### 6.1 完整调用链

```
Alembic/lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts
  runInternalColdStartWorkflow()
    ↓ dispatchInternalDimensionExecution()
Alembic/lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts
  runInternalDimensionExecution()
    ↓
InternalDimensionFillSessionRunner.ts  (≈L288)
  parentRunResult = await services.agentService.run(bootstrapSessionInput)
    ↓  AgentService.run() → AgentRuntime ReAct 循环
AlembicAgent/src/agent/runtime/AgentRuntime.ts  (≈L914-926)
  if (this.#gateway) { ... }          // 生产为 false，永不进入
  else  llmResult = await this.aiProvider.chatWithTools(ctx.prompt, {...})   // ✅ 实际路径
```

### 6.2 结论：冷启动只走 Provider 路径

- `AgentRuntime` 构造时 `this.#gateway = config.gateway || null`（`AgentRuntime.ts` L169）。
- 接线方 `AgentRuntimeBuilder.build()`（`AlembicAgent/src/agent/service/AgentRuntimeBuilder.ts` L84）构造 `new AgentRuntime` 时**不传 `gateway`、不传 `modelRef`**。
- `Alembic/lib/injection/modules/AgentModule.ts`（≈L154）构造 `AgentRuntimeBuilder` 时只注入 `aiProvider: ct.singletons.aiProvider`。
- 全仓库 `getLLMGateway` / `new LLMGateway` 只出现在 `LLMGateway.ts` 自身与单元测试中，**无生产注入点**。

→ 因此冷启动数据挖掘的 ReAct 循环最终落到 `aiProvider.chatWithTools()`，即 §2/§3/§5 适配过的 Provider 层。中转站 gpt（Responses）/ Claude 配置可正常生效，§4.2 的 `OpenAiTransport` 404 风险在当前不会触发。

### 6.3 aiProvider 单例的来源

- 创建：`Alembic/lib/injection/modules/AiModule.ts`（≈L45）`c.singletons.aiProvider = aiFactory.autoDetectProvider()`。
- 全局共享：internal AI、HTTP 路由、Guard 等共用同一个 `aiProvider` 单例，**没有 internal-AI 专属 LLM 实例**。
- Embedding 例外：`AiModule.ts` 优先用 `createEmbedProvider()`（`ALEMBIC_EMBED_PROVIDER`），否则 fallback；存于 `c.singletons._embedProvider`，供 `PersistentMemory` 等向量功能使用。

---

## 7. 项目内 LLM 调用分叉一览

除 AgentRuntime ReAct 路径外，以下服务**绕过 AgentRuntime，直接 `container.get('aiProvider')` 调用 Provider 方法**：

| 文件 | 用途 | 调用方法 |
| --- | --- | --- |
| `Alembic/lib/resident/tool-handlers/bootstrap/refine.ts` | Bootstrap 润色 | `chatWithStructuredOutput()` |
| `Alembic/lib/http/routes/candidates.ts`（多处） | 候选知识条目 HTTP API | `chatWithStructuredOutput()` |
| `Alembic/lib/service/vector/ContextualEnricher.ts` | 向量上下文增强 | `chat()` |
| `Alembic/lib/service/wiki/WikiGenerator.ts` | Wiki 生成 | `chat()` |
| `Alembic/lib/service/search/CrossEncoderReranker.ts` | 检索重排序 | `chatWithStructuredOutput()` |

这些路径同样受益于 Provider 层的中转站适配（共享同一 `aiProvider` 单例）。

---

## 8. 当前架构问题与建议

1. **双实现漂移（最高优先级）**：Provider 层已支持 OpenAI Responses + 中转站 baseUrl，Transport 层（`OpenAiTransport`）仍硬编码 `/chat/completions` 且无 `apiStyle`。当前 Gateway 未启用所以无影响，但**一旦启用 Gateway 路径，gpt 中转站会 404**。建议：要么删除/封存未使用的 Gateway+Transport 层，要么在启用前把 Responses + baseUrl 适配同步过去，并补 mock 测试。
2. **Google 无 baseUrl 覆盖**：`GoogleGeminiProvider` 无法指向兼容网关/中转站，与其它 4 家不一致。若需统一通过中转站，需补 `ALEMBIC_GOOGLE_BASE_URL`。
3. **dist 产物易失同步**：`@alembic/agent` 以 `file:` 软链 + `dist/index.js` 入口被 Alembic 消费，源码改动**必须 `npm run build` 重新编译 dist** 才对冷启动生效（本次曾踩坑：dist 未含 `apiStyle`）。建议在验证流程里固化「改 provider → build → 校验 dist」。
4. **未知模型能力为猜测值**：中转站自定义模型名经 `createDynamicDef()` 得到保守默认能力声明（128K/8K/toolCalling=true），参数约束可能与真实模型不符；必要时通过 `ModelRegistry.register()` 显式登记。
5. **单一全局 aiProvider**：internal AI 与 HTTP / 其它服务共用同一 provider 单例，无法按场景（挖掘 vs 交互）分流到不同模型/厂商；如需差异化需引入按用途的 provider 选择。

---

## 9. 验证命令（AlembicAgent 仓库）

```bash
npm run build                       # 重新编译 dist（改 provider 后必跑）
grep -c apiStyle dist/external/ai/providers/OpenAiProvider.js   # 校验 dist 含改动
npm run lint
npm run lint:agent-import-boundary
npm run lint:public-api-boundary
npx vitest run test/OpenAiProvider.test.ts
```

---

## 10. Gateway + Transport 层深度分析（能否完全接管 LLM 调用）

### 10.1 结论

**当前形态下 Gateway + Transport 层不能完全接管 LLM 调用。** 它在结构上是一套设计更干净的「模型路由 → 参数守卫 → Transport 委派 → 响应归一」分层，但相比生产中实际使用的 Provider 层，缺失多项**生产必需的可靠性与可观测能力**，且存在若干会直接导致调用失败的实现缺口。在补齐这些能力之前，切换到 Gateway 路径会造成功能退化（中转站 gpt 直接 404、预算/成本统计失效、无重试/无并发控制等）。

### 10.2 各 Transport 实现完整度

| Transport | 协议端点 | baseUrl 覆盖 | embed | 结构化输出 | 完整度评估 |
| --- | --- | --- | --- | --- | --- |
| `OpenAiTransport` | 硬编码 `/chat/completions` | ✅ `config.baseUrl` | ✅ `/embeddings` | 仅基类默认（chat+JSON.parse） | **不完整**：无 Responses API，gpt-5.x 中转站走 `/v1/responses` 时会 404 |
| `ClaudeTransport` | `/messages`（Anthropic Messages） | ✅ | ❌ 退回基类 → `[]` | 仅基类默认 | 较完整，但 embed 缺失 |
| `DeepSeekTransport` | `/chat/completions` + V4 thinking | ✅ | ✅ `deepseek-embedding` | 仅基类默认 | **最完整**：含 reasoning_effort、文本→toolcall 兼容、reasoning/cache token 统计 |
| `GoogleTransport` | Gemini REST `generateContent` | ✅ `GEMINI_BASE` | ✅ batch 100 | 仅基类默认 | 完整 |

注：基类 `LLMTransport` 提供的 `chatStructured()` 默认实现仅为 `chat()` + `JSON.parse()`，**无 `extractJSON` 边界提取、无截断 JSON 修复**，远弱于 Provider 层。

### 10.3 相对 Provider 层缺失的能力（核心差距）

`AiProvider` 基类已具备、而 Gateway/Transport 层**完全缺失**的能力：

1. **重试**：Provider 有 `_withRetry`（指数退避 + cause 日志，`maxRetries` 默认 3，`AiProvider.ts:918`）；Transport 的 `post()` 一次性请求，无任何重试。
2. **Token 用量上报**：Provider 有 `_emitTokenUsage(usage, source)`（`AiProvider.ts:287`）驱动预算/成本统计；Gateway 的 `#normalizeResponse()` 只把 usage 映射进结果，**不触发任何统计事件** → 预算与成本追踪失效。
3. **并发控制**：Provider 有 `_maxConcurrency`（默认 4 / `ALEMBIC_AI_MAX_CONCURRENCY`）+ `_activeRequests` 排队（`AiProvider.ts:227/237`）；Transport 无队列，并发请求不受限。
4. **探活与降级**：Provider 有 `async probe()`（`AiProvider.ts:316`）+ `getProviderWithFallback` 链；Gateway 层无 probe、无 fallback。
5. **稳健结构化输出**：Provider 的 `chatWithStructuredOutput` 带 `extractJSON` + 截断修复（`AiProvider.ts:768/898`）；Gateway 仅 chat+JSON.parse，模型多输出一句解释就解析失败。
6. **OpenAI Responses API**：Provider 已支持 `apiStyle: chat|responses`；`OpenAiTransport` 无此分支。

### 10.4 Gateway 层自身缺陷

1. **单例配置缓存 bug**：`getLLMGateway(config)` 为模块级单例（`let _gateway`），`config` 仅在**首次调用**生效，后续调用传入的 config 被静默忽略。
2. **`#modelRef` 来源不可靠**：`AgentRuntime` 走 gateway 分支时传 `modelRef: this.#modelRef`（`AgentRuntime.ts:914`），而冷启动注入（`AgentModule.ts`）**不提供 modelRef**，导致其为默认/空值；此时 Gateway 只能靠 `#guessProvider()` 按模型名前缀猜测厂商（gpt-/o1/o3→openai、claude-→claude…），中转站自定义模型名极易猜错。
3. **未被任何生产代码构造**：全仓库无生产路径 `new LLMGateway()` 或向 `AgentRuntimeBuilder` 传 gateway；`AiModule`/`AgentModule` 注入的是 `aiProvider` 单例，gateway 始终为 null。

### 10.5 优化点 / 后续决策建议

二选一，需用户确认方向：

- **方案 A：封存或删除**（推荐，若短期不需要统一网关）。Gateway + Transport 是无消费方的预留层，长期存在会与 Provider 层持续漂移（本次 Responses 适配已只做在 Provider 层）。删除前需：import 扫描确认无引用、确认 `AgentRuntime` gateway 分支可一并移除、补充该决策记录。
- **方案 B：补齐后启用**（若确需「模型路由统一网关」）。需移植：`_withRetry`、`_emitTokenUsage`、并发队列、`probe`/fallback、稳健 `extractJSON`；`OpenAiTransport` 增加 Responses 分支与 baseUrl 已有；修复 `getLLMGateway` 单例配置 bug；让 `AgentRuntime`/注入层传入可靠的 `provider:model` 形式 modelRef；`ClaudeTransport` 补 embed（或显式声明不支持）。每项改动按 `AGENTS.md` 需 mock 单测，并跑 build:check + lint + import/public-api boundary + vitest。

> 备注：本节为研究/分析结论，未对 Gateway/Transport 源码做任何改动；如选择方案 B 落地实现，再单独开任务并补测试。

---

## 11. Gateway 补齐与优化设计方案（方案 B 落地）

### 11.1 根因：为什么会漂移

Provider 层每个厂商类**各自**实现了「协议转换 + 重试 + 并发 + 用量 + probe + 结构化修复」，横切能力与协议细节耦合。Transport 想重做一遍，自然漏掉横切能力。只要「协议」与「可靠性」不分离，无论哪一层都会持续漂移。

正确目标分层（横切能力只实现一次，Transport 永远是纯协议适配器）：

```
AgentRuntime / internalAI
        │  modelRef = "provider:model"
        ▼
┌─────────────────────────────────────────────┐
│ LLMGateway （唯一横切层，厂商无关）              │
│  · 模型解析 / 参数守卫（capabilities 驱动）       │
│  · 重试 withRetry（指数退避 + cause + 可重试分类）│
│  · 并发队列 maxConcurrency（信号量）             │
│  · 用量上报 onUsage 回调                         │
│  · probe / fallback                          │
│  · 稳健结构化 parseStructured（extractJSON+修复）│
│  · 统一可观测（route/usage/retry 日志）          │
└───────────────┬─────────────────────────────┘
                │  纯协议调用（一次性、无横切）
                ▼
   Transport（厂商专属，只做协议 I/O + capabilities 声明）
   OpenAi(apiStyle) / Claude / DeepSeek / Google
```

**核心原则**：横切能力只在 Gateway 实现一次；Transport 无状态、无重试、无并发、无用量逻辑。新增厂商只写协议转换，不可能再漏可靠性能力。

### 11.2 逐项补齐（落在 Gateway，不下沉 Transport）

| 缺点 | 补齐方式 |
| --- | --- |
| 无重试 | Gateway 在 Transport 调用外层包 `withRetry()`（指数退避 + cause 日志 + 可重试错误分类） |
| 无用量上报 | `#normalizeResponse()` 后统一调用注入的 `onUsage(usage, {provider,model,source})` 回调，由 Gateway 触发 |
| 无并发控制 | Gateway 持全局信号量（可按 provider 分桶），所有 Transport 调用过闸 |
| 无 probe/fallback | Gateway 增 `probe(modelRef)` + `resolveWithFallback(candidates[])` 按候选链探活降级 |
| 弱结构化输出 | 抽独立纯函数 `parseStructured()`（extractJSON + 截断修复），Gateway 与 Provider 共用，Transport 不碰 |
| OpenAi 无 Responses | `OpenAiTransport` 内部按 `apiStyle` 选端点（chat/responses）——属协议细节，合理留 Transport |
| 单例配置 bug | `getLLMGateway` 改为配置变更即重建，或去单例交 DI 容器持有 |
| modelRef 不可靠 | 注入层显式传 `provider:model`；Gateway 拒绝无法解析的 modelRef 并报错，不再 `#guessProvider` 静默猜测 |
| Claude 无 embed | Transport 显式声明 `supportsEmbed=false`，Gateway 据此路由到专门 embed provider（本地 Qwen），而非返回 `[]` |

### 11.3 超出补齐的优化

1. **按用途分流模型**（解决 §8.5 单一全局 provider）：挖掘 `openai:gpt-5.x`、交互 `claude:opus`、embedding `ollama:qwen`，靠 modelRef 路由，无需多 provider 单例。
2. **能力声明驱动参数守卫**：Transport 暴露 `capabilities()`（maxTokens/toolCalling/supportsEmbed/apiStyle），Gateway `#guardParams` 据此裁剪，中转站未知模型有保守上限。
3. **统一可观测**：重试次数、fallback 命中、用量、route 全在 Gateway 一处结构化日志。
4. **中转站统一入口**：所有 Transport 已支持 `baseUrl` 覆盖，Gateway 统一从 `ALEMBIC_<VENDOR>_BASE_URL` 解析，比 Provider 层一致（Provider 层 Google 仍缺）。

### 11.4 分阶段迁移路径（每阶段可验证，避免大改/薄实现）

1. **阶段1 抽公共纯函数**：把 `extractJSON`/截断修复、usage 归一、错误分类从 `AiProvider` 抽到 `external/ai/shared/`，Provider 与 Gateway 共用（先不改行为，补单测）。
2. **阶段2 Gateway 上收横切**：Gateway 包 retry/并发/usage/probe，Transport 保持纯协议；`OpenAiTransport` 加 `apiStyle` 分支。
3. **阶段3 修单例 + modelRef**：去 `getLLMGateway` 单例缓存 bug，注入层传 `provider:model`。
4. **阶段4 灰度切换**：`AgentModule` 增 `ALEMBIC_LLM_ROUTE=gateway|provider` 开关，默认仍 provider；mock + 真实中转站冒烟验证两路径**等价**后再切默认。
5. **阶段5 收口**：gateway 稳定后，Provider 层降级为薄壳或逐步移除，消除双实现。

### 11.5 最终目标方案（确认基线）

- **目标**：Gateway + Transport 成为唯一 LLM 调用横切层，能完全接管 chat / chatWithTools / 结构化 / embed 路由，并支持按用途分流模型；Provider 层最终收口。
- **完成定义**：Gateway 路径在重试、并发、用量上报、probe/fallback、稳健结构化、OpenAI Responses、中转站 baseUrl 上与 Provider 路径功能等价或更优；`ALEMBIC_LLM_ROUTE=gateway` 通过 mock 单测 + 真实中转站冒烟（gpt-5.x Responses + Claude opus chatWithTools）。
- **非目标（本轮）**：不立即删除 Provider 层（阶段5 单独评估）；不改动 Alembic 仓库消费方默认行为（保持 provider 为默认 route）。
- **验证**：每阶段 `npm run build` + `npm run lint` + `lint:agent-import-boundary` + `lint:public-api-boundary` + `npx vitest run`；新增能力均补 mock 单测。
- **约束**：改动只在 AlembicAgent 仓库，不提交；阶段4 切默认前需用户确认。

### 11.6 落地进度（已验证）

> 改动均在 AlembicAgent 仓库，未提交。验证基线：`build:check` 通过、`lint` 通过、`lint:agent-import-boundary` 通过、`lint:public-api-boundary` 通过（15 个精确导出）、`npx vitest run` 全绿 **145 测试**。

- **阶段1 公共纯函数 ✅（已验证）**
  - 新增 `src/external/ai/shared/structured-output.ts`（`extractJSON` + 截断修复，从 `AiProvider` 原样抽出）、`error-classify.ts`（`classifyLlmError`，从 `_withRetry` 抽出）、`usage.ts`（`normalizeRawUsage`，覆盖 Chat/Responses/Anthropic/Gemini 原始字段）、`index.ts`（内部桶文件，未对外 re-export）。
  - `AiProvider` 改为委托 `shared/extractJSON` 与 `classifyLlmError`，删除重复私有方法；行为不变。
  - 新增 `test/shared-ai-utils.test.ts`（18 测试）。`test/ai-provider.test.ts` 熔断/重试断言保持全绿。
- **阶段2 Gateway 上收横切 ✅（已验证）**
  - 新增 `src/external/ai/shared/reliability.ts`：`ReliabilityController`（熔断 CLOSED/OPEN/HALF_OPEN、并发槽、限流窗、重试），行为与 `AiProvider._withRetry` 对齐。
  - `LLMGateway` 接入：每 provider 独立 `ReliabilityController`（`#runWithReliability` 包裹 chat/chatWithTools/embed）；`onUsage` 回调（`#emitUsage` 守空/守零 + try-catch）；`chatStructured` 改用稳健 `extractJSON`；新增 `probe` / `resolveWithFallback`；修复 `getLLMGateway` 单例：传入 config 即重建。
  - `OpenAiTransport` 加 `apiStyle: 'chat' | 'responses'`（来源 `config.apiStyle` ＞ `ALEMBIC_OPENAI_API_STYLE` ＞ `'chat'`）；`responses` 分支移植 `#buildResponsesInput` / `#parseResponsesOutput`，扁平工具格式、`max_output_tokens`、`text.format` JSON；Transport 仍保持纯协议（重试/用量归 Gateway）。
  - 新增 `test/reliability.test.ts`（5 测试）、`test/OpenAiTransportResponses.test.ts`（4 测试）、`test/LLMGateway.test.ts`（3 测试，含 usage 回调、markdown 围栏结构化、单例重建）。
- **方案① 单实现收口 ✅（已验证，替代原阶段4 双路径开关）**
  - **决策变更**：用户确认"不再做分叉，默认优化版，清理旧逻辑代码"。放弃 `ALEMBIC_LLM_ROUTE` 灰度双路径方案，改为：Provider 层保留为公共 API（`AiProvider` / `AiProviderManager` / 各 `*Provider` 类不删，Alembic 主仓 DI、`public-api-boundary` 检查、token 追踪不受影响），但其方法内部统一委托 LLMGateway + Transport；删除 `providers/*.ts` 中重复的协议组装/解析代码；删除 `AgentRuntime.#callLLM` 的 gateway/provider 双分支。协议代码（HTTP body 组装 / 响应解析）此后只存在于 `transport/*.ts`。
  - **批次A**：`TransportRequest` 增 `schema?`；`GoogleTransport` 支持 `responseSchema`；`GatewayChatRequest` 增 `schema/openChar/closeChar`。
  - **批次B**：`AiProvider` 基类新增 gateway 委托辅助方法（`_getGateway` 异步动态 import 规避循环依赖；`_gatewayChat` / `_gatewayChatWithTools` / `_gatewayChatWithStructuredOutput` / `_gatewayEmbed`），按实例构建 per-instance Gateway 并透传 `_transportExtras`；`_withRetry`、熔断字段、`_emitTokenUsage` 保留以兼容现有测试与公共 API。
  - **批次C**：5 个 Provider 全部薄壳化（`OpenAiProvider` / `DeepSeekProvider` / `ClaudeProvider`（`maxRetries=0`、无 embed）/ `OllamaProvider` / `GoogleGeminiProvider`（默认并发 2、`chat` maxTokens 8192）），仅保留构造参数解析 + `_transportExtras` 设置 + 委托 + `summarize`，删除全部重复协议代码。
  - **批次D**：删除 `AgentRuntime` 的 `#gateway` 字段、`RuntimeConfig.gateway`、`LLMGateway` 类型 import 及两处 `route: gateway|provider` 诊断字段；`#callLLM` 与强制摘要路径统一走 `aiProvider.chatWithTools`（provider 内部委托 gateway）；`#modelRef` 因独立用于日志/trace/工具裁剪而保留。确认 AlembicAgent test 目录与 Alembic 主仓 lib 均未消费 `config.gateway`，删除安全。
  - **批次E**：`build:check` + `biome check --write` + `lint` + `lint:agent-import-boundary` + `lint:public-api-boundary`（仍 15 精确导出）+ `npx vitest run` 全部通过，**145 测试全绿**。
  - **过程修复**：(1) gateway 委托辅助方法补默认 `temperature ?? 0.7` / `maxTokens ?? 4096`；(2) DeepSeek 兼容工具调用解析——`_gatewayChatWithTools` 补 `toolChoice ?? 'auto'`，`DeepSeekTransport.#parseResponse` 兼容判定改为 `(request.tools?.length ?? 0) > 0 && request.toolChoice !== 'none'`（独立于被 V4 过滤的 tool_choice）；(3) 循环依赖——`AiProvider` 对 `LLMGateway` 用 type-only import + `_getGateway()` 异步动态 import。
  - **代理支持下沉 ✅（已验证）**：薄壳化后请求统一走 Transport，原 `AiProvider._fetch` / `_resolveProxyUrl`（undici `ProxyAgent` 代理感知）成死代码并造成功能回归（依赖 `HTTPS_PROXY` 等访问境外 API 的部署会直连失败）。已把代理解析下沉到 `LLMTransport`：新增 `protected resolveProxyUrl()`（优先级 `ALEMBIC_<PROVIDER>_PROXY_HTTPS/HTTP` ＞ `ALEMBIC_AI_PROXY` ＞ `HTTPS_PROXY/HTTP_PROXY/ALL_PROXY`）+ 私有 `#fetch()`（检测到代理用 undici `ProxyAgent`，否则回退全局 fetch）；`post()` 改用 `#fetch`，所有 transport（含 embed）经 `post` 统一覆盖；删除 `AiProvider` 上的死代码 `_fetch`/`_resolveProxyUrl`。新增 `test/transport-proxy.test.ts`（5 测试）。全量验证：`build:check` + `lint` + 两 boundary（仍 15 精确导出）+ `npx vitest run` **150 测试全绿**。
- **待推进**：阶段3（modelRef 解析收紧，注入层传 `provider:model`，单例 bug 已在阶段2 修复，可选）。

### 11.7 方案②：彻底替换 Provider 层（后续工作，未实施）

> 这是方案①之外的另一条收口路线，作为**后续可选工作**记录。方案①已落地（Provider 保留为公共 API、内部委托 Gateway），方案②更激进：**完全删除 Provider 层**，让 Gateway + Transport 成为唯一 LLM 调用入口。实施前必须经用户确认，且必须跨仓库协调（不只在 AlembicAgent）。

- **目标**：移除 `AiProvider` / `AiProviderManager` / 各 `*Provider` 类，所有调用方（AgentRuntime、Alembic 主仓 DI、Dashboard/CLI 等）直接消费 `LLMGateway`；`provider:model` 的 `modelRef` 成为唯一选模型方式，provider 差异全部下沉到 `transport/*.ts` 的 transport 配置与 `_transportExtras` 等价物。

- **与方案①的关键差异**：
  - 方案①：Provider 类仍是公共 API（`public-api-boundary` 维持 15 个精确导出不变），仅内部薄壳化；零跨仓库改动。
  - 方案②：删除 Provider 类即**改变公共 API 契约**，`public-api-boundary` 导出清单必须重写；Alembic 主仓 DI 容器（注入 `aiProvider`/`gateway`）、token 追踪接线、`AiProviderManager` 的 provider 切换/路由事件消费方都要同步迁移到 Gateway 等价能力。

- **必须先解决的阻塞点（实施前评估）**：
  1. **Provider 切换语义**：`AiProviderManager` 负责运行时切换 provider、重接 token 追踪、发 switch 事件。Gateway 需提供等价的「按 modelRef 路由 + 切换 + 用量回调重接」能力，且要保证 Dashboard/CLI 的现有消费方不回归。
  2. **token 追踪接线**：方案①靠 `_emitTokenUsage` + `AiProviderManager` 维持现有 token 统计契约。方案②下需把 `onUsage` 回调统一接到 runtime/budget 层，并验证 BudgetController/TurnTelemetry 数值一致。
  3. **`supportsNativeToolCalling` / `summarize` 等 provider 级行为**：这些当前挂在 Provider 上，删除后需在 Gateway 或调用方按 `modelRef` 重新表达（如能力查表）。
  4. **公共 API 边界重写**：`lint:public-api-boundary` 当前锁定 15 个精确导出（含 Provider 类）。方案②需重新设计对外导出面（很可能改为导出 `LLMGateway` + 配置类型），并更新 boundary 检查与 Alembic 主仓 import。
  5. **代理支持**：`LLMTransport.post` 当前裸 `fetch`，无 undici `ProxyAgent`。方案②彻底移除 Provider 后，旧 `provider._fetch` 的代理能力将无回退，须在 Transport 层补齐（方案①下此项已标为待观察）。

- **分阶段路径（每阶段可验证，避免薄实现）**：
  1. **阶段R1 调用方迁移**：AgentRuntime 与 Alembic 主仓 DI 改为直接持有 `LLMGateway`，`aiProvider` 入参标记为 deprecated（暂保留兼容），mock 单测验证 chat/chatWithTools/结构化/embed 四路径等价。
  2. **阶段R2 能力下沉**：把 `supportsNativeToolCalling` / `summarize` / provider 切换 / token 接线迁到 Gateway，补 Gateway 侧单测覆盖原 Provider 行为。
  3. **阶段R3 删除 Provider 层**：移除 `providers/*.ts`、`AiProvider`、`AiProviderManager`；重写 `public-api-boundary` 导出清单；同步 Alembic 主仓 import 与 DI 注入（跨仓库 commit）。
  4. **阶段R4 收口验证**：全仓 `build` + `lint` + 两个 boundary 检查 + `vitest`；Alembic 主仓 build/smoke；真实中转站冒烟（Responses + Claude tools + 结构化 + embed）。

- **决策提示**：方案②收益是彻底消除 Provider 抽象、单一入口更清晰；代价是跨仓库破坏性 API 变更 + 迁移工作量 + 回归面更大。在方案①已满足「单实现、无重复协议代码、无运行时双分支」的前提下，方案②不紧急；建议仅当确需对外收窄 API 面或彻底下线 Provider 概念时再启动，并先做目标阶段确认。

