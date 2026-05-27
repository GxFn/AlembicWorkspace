# AlembicPlugin Agent / 外部 AI / Tool 清理执行计划

日期：2026-05-17

仓库范围：只针对 `AlembicPlugin`。本文档基于 AlembicPlugin 真实源码扫描，不修改 workspace 下其他仓库。

## 目标

AlembicPlugin 后续只作为 Codex 等 IDE 的插件/宿主集成层，不再内置独立 Agent 能力：

- 不再在 Plugin 内部运行 `AgentService` / `AgentRuntime` / profile / strategy / memory / tool loop。
- 不再在 Plugin 内部维护独立的外部 AI provider、模型注册、API key 探测、LLM chat/gateway 运行时。
- 不再保留“给内部 Agent 使用”的 tool registry / tool router / terminal tool / V2 tool capability 体系。
- 保留 Codex/IDE 宿主驱动的 MCP 工具、Core 能力适配、项目状态、知识库、Guard、搜索、诊断、Dashboard 管理表面。

重要边界：Codex 或 IDE 本身仍然可以作为外部宿主 Agent 使用 Alembic MCP 工具；要删除的是 AlembicPlugin 自己内置的 agent/AI/tool 执行引擎。

## 本轮真实扫描结论

这不是只删 `shared` 或只删 `lib/agent` 的问题。当前 AlembicPlugin 内部 agent 能力由三条主链路交织：

| 链路 | 当前源码 | 判断 |
| --- | --- | --- |
| 内部 Agent runtime | `lib/agent/**`、`lib/workflows/capabilities/execution/internal-agent/**` | 目标删除。它们是独立 agent 平台，不属于 Codex 插件边界。 |
| 外部 AI provider | `lib/external/ai/**`、`lib/injection/modules/AiModule.ts`、`lib/http/routes/ai.ts`、Dashboard LLM 配置 | 目标删除或改为 host-managed 状态展示。Plugin 不再保存/探测/调用外部 LLM key。 |
| Agent tool system | `lib/tools/**`、`AgentModule.ts`、`McpServer.ts` 的 catalog/router/adapter 投影 | 目标拆除。MCP 工具定义保留，但不再通过内部 agent tool router 执行。 |

本轮扫描到 `lib/agent`、`lib/external/ai`、`lib/tools`、`lib/workflows/capabilities/execution/internal-agent` 合计 217 个文件。直接删除其中任意一个目录都会破坏 DI、MCP、HTTP、Dashboard、Knowledge、Vector、Search、daemon job 和测试链路，因此需要按阶段收敛。

## 关键证据

### DI 容器仍然启动内部 agent 与 AI

- `lib/injection/ServiceContainer.ts` 直接导入 `AgentModule` 和 `AiModule`。
- `ServiceContainer.initialize()` 先执行 `AiModule.initialize(this)`，再注册 `AgentModule.register(this)` 和 `AiModule.register(this)`。
- `ServiceContainer.reloadAiProvider()` 仍假设 `_aiProviderManager.switchProvider()` 存在。
- `ServiceContainer.buildToolContext()` 仍把 `aiProvider` 注入 tool context。
- `lib/injection/ServiceMap.ts` 仍暴露 `aiProvider`、`aiProviderManager`、`toolRegistry`、`toolRouter`、`agentService`、`_embedProvider` 等服务。

### AgentModule 混合了两种边界

`lib/injection/modules/AgentModule.ts` 同时注册：

- Agent 专属对象：`agentService`、`agentRuntimeBuilder`、`agentRunCoordinator`、`agentProfileRegistry`、`agentStageFactoryRegistry`、`agentProfileCompiler`、`systemRunContextFactory`、`toolForge`。
- Tool/Skill 中性对象：`toolRouter`、`toolRegistry`、`workflowRegistry`、`terminalSessionManager`、`skillHooks`。

新的边界要求是：如果某个对象只服务内部 agent loop，就删除；如果是 MCP/Plugin 必须表面，就迁出到更窄的 Plugin module，且不能再依赖 `#agent` 或 `#external/ai`。

### MCP 同时存在外部宿主路径和内部 agent job 路径

应保留的宿主驱动路径：

- `lib/external/mcp/McpServer.ts` 中 `alembic_bootstrap` 调用 `bootstrapExternal()`。
- `alembic_rescan` 调用 `rescanExternal()`。
- `alembic_dimension_complete` 调用 `dimensionComplete()`。
- `lib/external/mcp/tools.ts` 的 briefing 文案已经描述“由外部执行者按维度完成”。

应删除的内部 agent job 路径：

- `lib/daemon/DaemonJobRunner.ts` 对 `bootstrap` 动态 import `../external/mcp/handlers/bootstrap-internal.js`。
- `lib/daemon/DaemonJobRunner.ts` 对 `rescan` 动态 import `../external/mcp/handlers/rescan-internal.js`。
- `bootstrap-internal.ts` re-export `InternalColdStartWorkflow`。
- `rescan-internal.ts` re-export `InternalKnowledgeRescanWorkflow`。
- `InternalColdStartWorkflow` 启动 `internal-agent/InternalDimensionExecutionWorkflow`。
- `InternalKnowledgeRescanWorkflow` 除 deterministic impact plan 外，还调用 `agentService` 和 `runEvolutionAudit()`。

结论：Codex plugin 的 daemon recoverable job 如果保留，必须改成“创建/恢复 host-driven briefing 任务”，不能继续在 daemon 内启动内部 AgentRuntime。

### HTTP / Dashboard 仍然是独立 AI 产品表面

`lib/http/routes/ai.ts` 仍包含完整独立 AI 面板与 agent API：

- `/api/v1/ai/providers`
- `/api/v1/ai/probe`
- `/api/v1/ai/config`
- `/api/v1/ai/mock/cleanup`
- `/api/v1/ai/chat`
- `/api/v1/ai/chat/stream`
- `/api/v1/ai/agent/tool`
- `/api/v1/ai/agent/task`
- `/api/v1/ai/agent/capabilities`
- `/api/v1/ai/token-usage`

Dashboard 也仍有对应客户端：

- `dashboard/src/api.ts` 调用 `/ai/providers`、`/ai/probe`、`/ai/mock/cleanup`。
- `dashboard/src/components/Modals/LlmConfigModal.tsx` 仍提供 provider/API key 探测 UI。
- `dashboard/src/components/Layout/Header.tsx` 仍处理 AI 配置变化。

结论：如果 AlembicPlugin 不再作为独立 AI 应用，Dashboard LLM 配置必须删除或改为只读提示：“AI 由 Codex/IDE 宿主管理”。

### Candidates / Extract / Recipes / ModuleService 仍调用 Agent 或 AI

- `lib/http/routes/candidates.ts` 仍用 `container.get('aiProvider')` 执行 enrich、bootstrap-refine、structured refine、chat refine。
- `lib/http/routes/candidates.ts` 的 `bootstrap-refine` 通过 `bootstrap-internal.js` 复用 AI refine。
- `lib/http/routes/extract.ts` 用 `AgentService` 跑 `runScanAgentTask()`。
- `lib/http/routes/recipes.ts` 用 `AgentService` 跑 `runRelationDiscovery()`。
- `lib/service/module/ModuleService.ts` 注入 `agentService` 与 `systemRunContextFactory`，用于 AI extract / scan / relation 类辅助。

结论：这些不是 MCP plugin 的基础能力。删除内部 AI 后必须同时删除、降级或改成 host-submitted workflow，不能留空壳 fallback。

### Knowledge / Vector / Search 有 AI 依赖边界

- `lib/injection/modules/KnowledgeModule.ts` 注册 `aiProvider`，并把 `_embedProvider || aiProvider` 传给搜索/知识管线。
- `lib/injection/modules/VectorModule.ts` 用 `aiProvider` 构造 `ContextualEnricher`，用 `_embedProvider || aiProvider` 构造向量服务。
- `lib/service/vector/ContextualEnricher.ts` 调用 `aiProvider.chat()`。
- `lib/service/search/CrossEncoderReranker.ts` 调用 `chatWithStructuredOutput()` 做语义重排。
- `lib/external/mcp/handlers/search.ts` 已有降级提示：`vectorStore/aiProvider 不可用，已降级到 BM25`。

结论：删除外部 AI provider 后，搜索必须明确进入 deterministic 模式：BM25/关键词/Core 已有索引可保留；embedding、contextual enrich、AI cross encoder 必须删除、禁用或改成 Core/host 明确提供的可选端口。

### MCP system health 仍探测 AI 配置

- `lib/external/mcp/handlers/system.ts` 动态 import `#external/ai/AiFactory.js` 获取 `getAiConfigInfo()`。

结论：health 可以保留，但 `ai` 字段应改成 `hostManaged: true` 或删除，不再探测 Plugin 本地 provider/key。

## 新边界定义

### Host / IDE 负责

- LLM 选择、API key、模型调用、tool planning。
- 文件编辑、终端、浏览器、代码推理、循环执行。
- 阅读 Alembic mission briefing 后调用 MCP 工具提交结果。

### AlembicPlugin 负责

- Codex/IDE plugin packaging、stdio MCP server、diagnostics、status、init。
- Project root / data root / Ghost workspace / settings 解析。
- 通过 `@alembic/core` 调用知识库、Guard、搜索、SourceRef、Recipe、workflow planner。
- MCP tools 的 schema、权限声明、请求/响应 envelope。
- Dashboard 中的项目状态、知识库、任务状态、诊断管理。

### AlembicCore 负责

- 领域模型、repository、deterministic workflow planner、search/guard/knowledge/source-ref。
- Plugin 只能通过 `@alembic/core` public exports 使用 Core，不回读 vendor 源码。

### 不再属于 Plugin

- 独立 `AgentRuntime`。
- 独立 LLM provider registry / gateway / transport / API key probe。
- Agent memory / profile / prompt / strategy。
- 内部 tool registry / terminal tool / agent tool router。
- Dashboard chat agent、AI refine、AI extract、AI relation discovery。

## 前端插件模式适配决策

AlembicPlugin 内的前端主要是 `dashboard/`。

当前决策（2026-05-17）：不删除前端。`dashboard/**`、`build:dashboard`、Dashboard 静态托管、`alembic_codex_dashboard`、release/smoke/verify 中的 Dashboard 产物检查继续保留。

原因：这份前端逻辑后续可能进入统一前端/统一插件 UI 逻辑。当前清理目标不是删除前端实现，而是把前端从“Plugin 本地独立 AI/Agent 工作台”适配成“插件模式 UI 壳 + 统一逻辑/宿主能力入口”。

### 需要适配的前端表面

这些 UI 当前直接绑定 Plugin 内部独立 AI/Agent 后端。处理方式不是删除前端文件，而是解除本地 `agent` / `external/ai` API 绑定，改成 plugin-mode adapter、host-managed 状态或统一前端逻辑入口：

- `dashboard/src/components/Modals/LlmConfigModal.tsx`
- Header 中 AI provider 状态、切换、API key 配置入口
- `dashboard/src/api.ts` 中 `/ai/providers`、`/ai/probe`、`/ai/config`、`/ai/mock/cleanup`、chat/stream/token usage API
- `dashboard/src/components/Charts/TokenUsageChart.tsx`
- Candidate 页面中的 `AI 润色`、`AI 补齐`、bootstrap refine 进度和相关按钮
- Recipes 页面中的 `AI 发现关系`
- 全局 Chat drawer / 内置 Agent 对话入口
- i18n 中 `AI Provider`、`内置 Agent`、`AgentRuntime`、`AI 全量扫描`、`Mock AI` 等产品文案

对应后端会删除或改写：

- `lib/http/routes/ai.ts`
- `lib/http/routes/candidates.ts` 中 AI enrich/refine route
- `lib/http/routes/extract.ts`
- `lib/http/routes/recipes.ts` 中 AI relation discovery route
- `lib/http/utils/sse-sessions.ts` 中服务 chat stream 的逻辑

### 前端适配原则

- 不删除 `dashboard/**` 作为执行目标。
- 不删除 UI 组件来“解决”后端移除；优先改造成插件模式视图、统一逻辑 hook、host-managed 状态或不可用态。
- `dashboard/src/api.ts` 保留为前端 API adapter，但移除对已删除本地 AI/Agent route 的直接调用；未来统一逻辑可在这里接入。
- AI provider/API key 配置不再由 AlembicPlugin 前端保存或探测；如仍需展示，展示“由 Codex/IDE 宿主管理”。
- Candidate/Recipe/Chat 类交互不再调用 Plugin 内部 AgentRuntime；如保留入口，应转为 host-driven briefing、MCP follow-up、统一任务入口或只读状态。
- i18n 文案从“内置 Agent / AI 全量扫描 / Mock AI”改为“宿主驱动 / 插件模式 / 待宿主处理”。

### 明确保留的前端交付链路

以下内容继续保留：

- `dashboard/**`
- `package.json` 中 `build:dashboard`、`dashboard/dist` files 声明
- `bin/daemon-server.ts` 中 `mountDashboardIfAvailable()` 和 `dashboardUrl` 语义
- `lib/http/HttpServer.ts` 中 `mountDashboard()` 静态资源托管
- `lib/codex/ToolPolicy.ts` / `StatusService.ts` / `Preflight.ts` 中 `alembic_codex_dashboard`
- `scripts/prepare-codex-plugin-runtime.mjs` 对 `dashboard/dist` 的复制和必需产物校验
- `scripts/release-codex-plugin.mjs` 的 Dashboard build step
- `scripts/smoke-codex-plugin.mjs` 的 Dashboard HTML smoke
- `scripts/verify-codex-plugin.mjs` 对 `dashboard/dist/index.html` 的断言
- `plugins/alembic-codex/README.md` 中 Dashboard handoff 文案

当前执行顺序：Phase 2 清理本地 AI/Agent API 绑定，并完成前端插件模式适配；Dashboard 的状态、知识、Guard、job、诊断能力和所有 Dashboard 交付链路保持可用。

## 分阶段执行计划

### Phase 0：建立清理基线与禁止新增入口

目标：先让边界可见，避免一边清理一边新增。

动作：

- 新增或更新边界扫描脚本，输出所有 `#agent`、`#external/ai`、`#tools`、`agentService`、`aiProvider`、`toolRouter`、`_embedProvider` 引用。
- 建立 allowlist，初始允许列表只包含迁移阶段文件；每个 phase 后收缩。
- 在文档中明确：AlembicPlugin 新代码不得新增内部 agent/AI/tool 依赖。

验收：

```bash
rg -n "#agent/|lib/agent|#external/ai|external/ai|#tools/|lib/tools|agentService|toolRouter|toolRegistry|aiProvider|aiProviderManager|_embedProvider" lib bin scripts package.json
```

输出必须被归档并按 phase 递减。

### Phase 1：拆掉 internal bootstrap/rescan job 入口

目标：先停止 Plugin daemon 在后台启动内部 AgentRuntime。

动作：

- 删除或改写 `lib/daemon/DaemonJobRunner.ts` 中 `bootstrap-internal`、`rescan-internal` 动态 import。
- `alembic_codex_bootstrap` / `alembic_codex_rescan` 如果保留，应改成生成 host-driven briefing job，不执行内部填充。
- 删除 MCP `bootstrap-internal.ts`、`rescan-internal.ts` 的导出入口，或保留 deprecated error response 一版并确保任何 public tool 不调用。
- `lib/external/mcp/handlers/bootstrap/InternalColdStartWorkflow.ts` 和 `rescan/InternalKnowledgeRescanWorkflow.ts` 从 public graph 中断开。
- `rescan` 的 deterministic `RecipeImpactPlanner` / `submitRescanImpactDecisions()` 若仍需要，应迁到 external rescan 或 Core planner，不再走 `runEvolutionAudit()`。

验收：

```bash
rg -n "bootstrap-internal|rescan-internal|InternalColdStartWorkflow|InternalKnowledgeRescanWorkflow|internal-agent|runEvolutionAudit|EvolutionAgentRun" lib test
```

除迁移文档或明确 deprecated 测试外，不应有生产入口。

### Phase 2：清理 HTTP 独立 AI 并适配 Dashboard 插件模式

目标：让 Dashboard 不再表现为独立 LLM 应用，同时保留前端作为插件模式/统一逻辑 UI 层。

动作：

- 删除或拆分 `lib/http/routes/ai.ts` 中 provider/probe/config/mock cleanup/chat/stream/agent tool/agent task/agent capabilities/token usage。
- 保留 `/ai/lang` 这类纯 UI 偏好时，应迁名到非 AI 路由，例如 `/settings/lang`。
- 删除 `ensureAiConfigUpdateAllowed()` 及其 direct tool 逻辑，除非改造成通用 workspace settings guard。
- Dashboard 的 `LlmConfigModal`、provider tab、probe 状态、AI config API 调用改造成 plugin-mode adapter 或 host-managed 状态，不作为本地 key/probe 配置入口。
- Header 中 AI config 状态改为 Host-managed / Plugin mode 状态，不再触发本地 provider switch。
- Candidate/Recipe/Chat 相关前端入口保留时，必须接入 host-driven briefing、统一任务入口或不可用态，不再调用 Plugin 内部 AgentRuntime。
- 更新 i18n 中 LLM provider/Agent Runtime 文案，避免暗示 Plugin 内置 AI/Agent。
- 保留 `dashboard/**`、`build:dashboard`、`alembic_codex_dashboard`、daemon Dashboard URL、release/smoke/verify 中的 Dashboard 产物检查。

验收：

```bash
rg -n "/api/v1/ai|/agent/tool|/agent/task|/agent/capabilities|AiConfig|ProviderConfig|ModelRegistry|providers|probe|mock/cleanup" lib/http dashboard/src test
```

允许保留的只应是迁移后的非 AI 设置、auth probe、host-managed/plugin-mode 前端适配文案或测试文案。
`npm run build:dashboard` 仍应通过。

### Phase 3：清理 Candidates / Extract / Recipes / ModuleService 的 AI 辅助

目标：删除绕过宿主的 AI enrich/refine/extract/relation 能力。

动作：

- `lib/http/routes/candidates.ts` 删除 `/enrich`、`/bootstrap-refine`、AI structured refine、chat refine。
- Candidate 内容补齐改成 host-submitted：Codex/IDE 通过 MCP `submit_knowledge` 或 dimension completion 提交结构化内容。
- `lib/http/routes/extract.ts` 删除 `runScanAgentTask()` 路径；如需要保留 extract，只保留 deterministic parser/structure scan。
- `lib/http/routes/recipes.ts` 删除 `runRelationDiscovery()` agent route；关系生成交给 Core deterministic 规则或 host-submitted proposal。
- `lib/service/module/ModuleService.ts` 移除 `agentService` / `systemRunContextFactory` 构造参数与 AI extract 分支。
- `lib/injection/modules/AppModule.ts` 不再向 `ModuleService` 注入 agent 服务。

验收：

```bash
rg -n "runScanAgentTask|runTranslationJson|runRelationDiscovery|AgentTaskHandlers|bootstrapRefine|chatWithStructuredOutput|container.get\\('aiProvider'\\)" lib/http lib/service lib/external/mcp
```

生产代码不得再通过 Plugin provider 做 LLM 生成。

### Phase 4：删除 AiModule 与 `lib/external/ai`

目标：移除 Plugin 自有 provider/gateway/model registry/key probe。

动作：

- 删除 `lib/injection/modules/AiModule.ts`。
- 删除 `lib/external/ai/**`。
- 从 `ServiceContainer` 移除 `AiModule.initialize/register`、`reloadAiProvider()`、AI dependent singleton 热重载机制。
- 从 `ServiceMap` 移除 `AiProvider`、`AiProviderManager`、`aiProvider`、`aiProviderManager`、`_embedProvider`。
- `lib/external/mcp/handlers/system.ts` 不再 import `AiFactory`；health 改为 host-managed 或无 AI 字段。
- Workspace settings 中如果仍有 AI config 文件读写，需要迁移为 legacy cleanup 或只读迁移提示，不再写入新配置。
- 删除 `LlmConnectivity`、`LlmRegistryAndGuard`、`LlmGatewayTransport` 等 provider 单元/集成测试。

边界处理：

- Search：保留 BM25/关键词/Core deterministic search。
- Vector：如果 Core 需要 embedding，应显式由 Core 或宿主提供端口；Plugin 不提供 provider fallback。
- Wiki：`WikiGenerator` 中 AI compose 分支删除或改成纯模板生成；文档生成如果需要 AI，由 Codex 宿主完成。

验收：

```bash
rg -n "#external/ai|external/ai|AiProvider|AiProviderManager|LLMGateway|ModelRegistry|ProviderConfig|aiProvider|_aiProviderManager|_embedProvider" lib test dashboard/src package.json
```

除 legacy migration 文档外，不应有生产依赖。

### Phase 5：拆分并删除 AgentModule / `lib/tools`

目标：保留 MCP 工具契约，删除内部 agent tool execution system。

动作：

- 新建窄的 Plugin MCP tool 层，只保留 MCP tool schema、permission metadata、handler dispatch。
- `McpServer.ts` 不再构造 `CapabilityCatalog`、`LightweightRouter`、`McpToolAdapter` 来模拟 agent tool registry。
- 删除 `lib/tools/v2/**`、terminal adapters、workflow adapters、dashboard operation adapters、tool envelope/presenter 中只服务 agent router 的部分。
- 如果 HTTP modules/commands 仍需要 dashboard operation ids，则迁出一个小型常量文件，例如 `lib/http/dashboard/DashboardOperationIds.ts`，不依赖 `#tools`。
- 删除 `ToolForge`、`DynamicComposer`、`TemporaryToolRegistry`、`ToolRequirementAnalyzer`、`SandboxRunner` 等 agent tool 组合能力。
- 从 `package.json` imports 移除 `#tools/*`。

验收：

```bash
rg -n "#tools/|lib/tools|ToolRouter|ToolRegistry|ToolForge|CapabilityCatalog|LightweightRouter|McpToolAdapter|TerminalAdapter|terminalSessionManager" lib test package.json
```

MCP tools 仍能通过直接 handler dispatch 工作，但不再存在内部 agent tool router。

### Phase 6：删除 `lib/agent` 与 internal-agent workflow

目标：真正移除独立 Agent 平台。

动作：

- 删除 `lib/agent/**`。
- 删除 `lib/workflows/capabilities/execution/internal-agent/**`。
- Completion/persistence 里如果还有中性类型，应提前迁到 `lib/workflows/capabilities/completion` 或 Core public type；禁止通过 `#agent/memory` 复用。
- 从 `package.json` imports 移除 `#agent/*`。
- 删除 agent 专项测试：`AgentModuleBoundaries`、`AgentTaskHandlers`、`evolution-agent-run`、`Bootstrap*internal-agent*`、`InternalDimensionFill*` 等。
- 删除 agent prompt/profile/strategy 相关 fixtures。

验收：

```bash
test ! -d lib/agent
test ! -d lib/workflows/capabilities/execution/internal-agent
rg -n "#agent/|lib/agent|internal-agent|AgentRuntime|AgentService|agentService|systemRunContextFactory" lib test package.json
```

生产代码必须为零。

### Phase 7：测试、构建、插件验收

目标：确认收缩后的 AlembicPlugin 仍作为 Codex/IDE 插件可用。

必须执行：

```bash
npm run build:check
npm run build
node scripts/verify-codex-channel.mjs
node scripts/verify-codex-plugin.mjs
```

建议执行的代表测试：

```bash
npm run test -- CodexKnowledgeState CodexToolPolicy CodexStatusService CodexRuntimeContext CodexProjectRootResolver CodexPluginCacheSync CodexSessionScenarioRunner CodexMcpServer JobStore DaemonSupervisor DaemonJobRunner ZodSchemas ZodToMcpSchema
```

补充验收：

- `alembic_codex_status`、`alembic_codex_init`、diagnostics 仍可工作。
- `alembic_bootstrap` 返回 host-driven mission briefing，不触发内部 AgentRuntime。
- `alembic_dimension_complete` 可消费宿主提交结果。
- `alembic_search` 在无 local AI provider 时走 deterministic/BM25 降级，不报缺 key。
- Dashboard 不再提供 Plugin 本地 provider/API key 配置入口；相关位置改为 host-managed/plugin-mode 或统一逻辑入口。
- package imports 中不存在 `#agent/*`、`#tools/*`、`#external/ai/*`。

## 删除候选清单

高置信删除：

- `lib/agent/**`
- `lib/workflows/capabilities/execution/internal-agent/**`
- `lib/external/ai/**`
- `lib/injection/modules/AiModule.ts`
- `lib/external/mcp/handlers/bootstrap-internal.ts`
- `lib/external/mcp/handlers/rescan-internal.ts`
- `lib/external/mcp/handlers/bootstrap/refine.ts`
- `lib/tools/v2/**`
- `lib/tools/adapters/Terminal*`
- `lib/tools/adapters/terminal-*`
- `lib/tools/workflow/**`
- Agent/provider/tool 专项测试文件

需要先迁出或改写后删除：

- `lib/injection/modules/AgentModule.ts`
- `lib/injection/ServiceMap.ts`
- `lib/injection/ServiceContainer.ts`
- `lib/external/mcp/McpServer.ts`
- `lib/external/mcp/McpCapabilityProjection.ts`
- `lib/external/mcp/McpToolAdapter.ts`
- `lib/http/routes/ai.ts`
- `lib/http/routes/candidates.ts`
- `lib/http/routes/extract.ts`
- `lib/http/routes/recipes.ts`
- `lib/http/routes/modules.ts`
- `lib/http/routes/commands.ts`
- `lib/service/module/ModuleService.ts`
- `lib/service/search/CrossEncoderReranker.ts`
- `lib/service/vector/ContextualEnricher.ts`
- `lib/service/wiki/WikiGenerator.ts`
- Dashboard API/types/i18n/Header/LLM modal 的本地 AI/Agent 绑定

保留但要检查命名：

- `dashboard/**`
- `lib/external/mcp/CodexMcpServer.ts`
- `lib/external/mcp/tools.ts`
- `lib/external/mcp/handlers/bootstrap/ExternalColdStartWorkflow.ts`
- `lib/external/mcp/handlers/rescan/ExternalKnowledgeRescanWorkflow.ts`
- `lib/external/mcp/handlers/dimension-complete-external.ts`
- `lib/codex/**`
- `bin/codex-mcp.ts`
- `plugins/alembic-codex/**`
- Codex release/verify/smoke scripts

## 边界风险与处理

### 1. Search / Vector 体验下降

删除 Plugin provider 后，向量和 AI rerank 可能不可用。接受边界是：Plugin 默认 deterministic search；AI 语义分析由 Codex/IDE 宿主在 MCP briefing 上执行。

### 2. Dashboard 插件模式适配

Dashboard 不再是独立 AI 工作台，但前端本身保留。处理方式是把 chat/config/probe/refine 等入口从 Plugin 本地 AI/Agent 后端解绑，改成 host-managed 状态、统一逻辑入口、host-driven briefing 或不可用态。状态、知识库、Guard、任务、诊断继续保留。

### 3. Daemon job 语义变化

旧 job 会自动后台补齐知识；新 job 只能准备 briefing 或状态。需要更新 Codex skill/README/工具说明，避免用户以为 Plugin 会自己跑 AI。

### 4. 测试大量删除

删除 agent/AI/tool 后，不能用 stub 保持旧测试通过。测试应该转向 Plugin host-driven contract：MCP schema、handler dispatch、Core adapter、Codex diagnostics、deterministic fallback。

### 5. 命名里的 agent

不是所有字符串 `agent` 都必须同一阶段删除。短期允许：

- 文档中描述“外部宿主 agent/Codex”。
- 旧配置兼容字段，例如 executor 值 `external-agent`，但新代码应引入 `host-driven` 命名并兼容读取旧值。

不允许：

- 生产代码继续启动 `AgentService` / `AgentRuntime`。
- Plugin 继续保存、探测、调用用户 LLM API key。
- MCP/HTTP 继续暴露内部 agent tool execution。

## 执行前置规则

本计划涉及大量删除和功能收缩。根据 AlembicPlugin 的仓库规则，正式实施前需要用户确认具体 phase。每个 phase 应单独提交，提交前必须：

- 运行对应 `rg` 边界扫描。
- 运行 build/check/代表测试。
- 在提交信息中说明删除的是 Plugin 内部 agent/AI/tool 能力，不影响 Codex/IDE 作为外部宿主使用 Alembic MCP。
