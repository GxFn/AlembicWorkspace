# AlembicAgent Global Function Boundary Evidence

日期：2026-05-22
执行窗口：AlembicAgent
任务包：GFBD-P1-G
状态：待总控验收
对应计划：`docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md`

## 完成范围

- 已读取 `AlembicAgent/AGENTS.md`，确认本窗口只修改 workspace 协作文档，不改 AlembicAgent 产品源码。
- 已挖掘 `package.json` exports/imports、`config/agent-public-api-boundary.json`、`config/core-import-boundary.json`、Agent runtime boundary、Agent service/runtime builder、AI provider、Tool V2/terminal、memory/context、prompts、tasks 和 release staging 脚本。
- 已只读参考 Alembic 主仓库对 `@alembic/agent` public subpaths 的真实消费方式。
- 本轮未改产品源码、未移动目录、未删除兼容层、未更新 release staging、未运行真实项目测试。

## 关键代码证据

### package / public API

- `AlembicAgent/package.json` 声明 package 为 `@alembic/agent@0.2.0`，入口是 `dist/index.js` / `dist/index.d.ts`。
- `package.json` 声明 15 个 public exports：`.`、`./agent`、`./service`、`./runtime`、`./prompts`、`./domain`、`./forge`、`./tasks`、`./profiles`、`./ai`、`./tools`、`./tools/terminal`、`./tools/v2`、`./memory`、`./context`。
- `package.json` private imports 只覆盖 `#agent/*`、`#external/*`、`#shared/*`、`#tools/*`，dev/types 指向 `src`，default 指向 `dist`。
- `config/agent-public-api-boundary.json` 固定 `stable-public: 15`，并禁止 consumer 使用 `@alembic/agent/dist/*`、`@alembic/agent/src/*`、`@alembic/agent/*/*/*`。
- `config/agent-public-api-boundary.json` 的 contract matrix 明确：Host 拥有 HTTP/MCP/CLI adapter、进程生命周期、credential retrieval、真实 terminal/PTY、UI/daemon lifecycle；Agent 拥有 runtime、AI provider、tool contracts、memory/context、prompts、domain、tasks 和 profiles。

边界判断：这些 public exports 是跨仓库 contract，后续不能为了清理目录改变 subpath；任何删除、下沉或移动必须先保证 Alembic 主仓库消费者迁移和 smoke import 证据。

### internal agent runtime 与 host agent 区分

- `src/agent/runtime/AgentRuntimeBoundary.ts` 声明 `runtimeLine: 'alembic-internal-ai'`，`hostAgentRouteSupported: false`。
- 同一文件把 `codex-mcp`、`codex-marketplace`、`plugin-host-agent-route` 放入 `unsupportedHostRoutes`。
- `src/agent/runtime/AgentRuntimeBoundary.ts` 将 `host-agent-route` 的 owner 标为 `host`，summary 写明 Codex MCP、marketplace、channel packaging 和 host-agent route remain Plugin-owned。
- `test/contract-surface.test.ts` 验证 `supportsAgentRuntimeRoute('alembic-internal-ai')` 为 true，`supportsAgentRuntimeRoute('plugin-host-agent-route')` 为 false，并断言 terminal sandbox 仍通过 Core host-agent-workflows contract。

边界判断：AlembicAgent 是 internal AI / Agent runtime，不是 Codex host agent 入口。Plugin 不应复制本仓库 AI provider、runtime loop、tool execution pipeline 或 memory/context；Plugin 只应通过 host agent route 和 service request 边界消费必要 contract。

### Agent service / runtime

- `src/agent/service/AgentService.ts` 提供统一 `AgentService.run(input)`：校验 `AgentRunInput`，编译 profile，必要时通过 `AgentRunCoordinator` 协调 child run，再通过 `AgentRuntimeBuilder` 构造 runtime 并执行。
- `AgentService.run()` 在进入 runtime 前记录 `runtimeSource`，执行后返回 `AgentRunResult`，包含 `runId`、`profileId`、`reply`、`status`、`phases`、`toolCalls`、`usage` 和 diagnostics。
- `src/agent/service/AgentRuntimeBuilder.ts` 注入 host container、toolRegistry、toolRouter、aiProvider、memoryCoordinator、projectRoot、dataRoot，再创建 `AgentRuntime`。
- `AgentRuntimeBuilder` 从 profile preset 生成 capabilities、strategy、policies、persona、memory 和 allowed tools。

边界判断：AgentService / AgentRuntimeBuilder 是 Alembic 主仓库消费 internal runtime 的稳定入口；主仓库注入具体 projectRoot/dataRoot/container/tool execution，Agent 仓库不拥有 Alembic daemon、HTTP route、CLI 或 Dashboard server。

### AI provider

- `src/external/ai/AiProvider.ts` 定义 provider 基类、统一 message/tool schema、token usage、并发闸门、rate-limit/circuit breaker 等 AI 调用语义。
- `src/external/ai/AiFactory.ts` 支持 google/gemini、openai、deepseek、claude/anthropic、ollama、mock provider，并通过 `ALEMBIC_AI_PROVIDER` 和 provider key 环境变量进行 auto-detect。
- `src/external/ai/AiFactory.ts` 支持 fallback provider 和独立 embedding provider。
- Alembic 主仓库 `lib/injection/modules/AiModule.ts` 从 `@alembic/agent/ai` 导入 `AiProviderManager`，并动态 import `@alembic/agent/ai` 进行 provider auto-detect；主仓库负责把 provider 放进 DI container、绑定 token recorder 和 embedding fallback 生命周期。

边界判断：AI provider adapter 和 provider manager 属于 AlembicAgent；credential retrieval、Dashboard AI Settings、env 写入、DI 生命周期和 provider 热切换触发属于 Alembic 主仓库。Plugin 不应重新引入第三方 AI provider 或本地 provider config UI。

### tool system / terminal / Tool V2

- `src/tools/index.ts` 导出 capability catalog、manifest、unified catalog、internal tool handler、lightweight router、tool context、contracts、decision、result envelope、presenter、routing services、terminal、Tool V2 capability 和 workflow registry。
- `src/tools/v2/index.ts` 导出 adapter、cache、compressor、capabilities、TOOL_REGISTRY、ToolRouterV2、Tool V2 types 和 `ok/fail/estimateTokens`。
- `src/tools/terminal/index.ts` 导出 terminal capabilities、envelope、policy 和 session contract。
- `scripts/lint-agent-import-boundary.mjs` 明确禁止 AlembicAgent 引入 Plugin/Codex/MCP/channel/marketplace/skills/injectable-skills 路径。
- Alembic 主仓库 `lib/injection/modules/AgentModule.ts` 从 `@alembic/agent/tools`、`@alembic/agent/tools/terminal`、`@alembic/agent/tools/v2` 导入 generic contracts、terminal manifests、V2CapabilityCatalog 和 V2ToolRouterAdapter；同时主仓库保留本地 `ToolContextFactory`、Dashboard/Mac/Skill/Terminal/Workflow adapters 和 service container wiring。

边界判断：generic tool contract、Tool V2 router/cache/compressor/adapter contract 和 terminal portable policy/session 属于 AlembicAgent；具体 tool service、sandbox/PTY 执行、Dashboard operation、Skill adapter、Mac adapter、approval UI、host permission 和 dataRoot/projectRoot wiring 属于宿主仓库。

### memory / context / prompts / tasks / domain

- `src/agent/memory/index.ts` 导出 `ActiveContext`、`MemoryCoordinator`、`MemoryEmbeddingStore`、`MemoryRetriever`、`MemoryStore`、`PersistentMemory`、`SessionStore`、flush contract 和 session schema validator。
- `src/agent/context/index.ts` 导出 `ContextWindow`、`ConversationStore`、`ExplorationTracker` 和 L4 memory package helpers。
- `src/agent/prompts/index.ts` 导出 insight analyst/evolver/gate/producer 和 scan prompts。
- `src/agent/tasks/index.ts` 导出 `taskCheckAndSubmit`、`taskDiscoverAllRelations`、`taskFullEnrich`、`taskGuardFullScan`、`taskQualityAudit` 及 task contract types。
- Alembic 主仓库 `lib/workflows/capabilities/execution/internal-agent/**` 消费 `@alembic/agent/memory`、`@alembic/agent/context`、`@alembic/agent/prompts`、`@alembic/agent/runtime`、`@alembic/agent/service` 组装 bootstrap internal agent 执行链路。

边界判断：memory/context/prompt/task 的 Agent-side orchestration 和 runtime contract 应留在 AlembicAgent；durable storage placement、workflow state、JobStore、ProjectRegistry、HTTP route、Dashboard presentation 和真实 project selection 属于 Alembic/Core/Dashboard。

### Core 消费边界

- `package.json` 依赖 `@alembic/core: file:../AlembicCore`，本地开发保持 local-source-first。
- `config/core-import-boundary.json` 说明 Agent code 必须消费 stable `@alembic/core` facades，而不是 Core shared/service/infrastructure internals。
- Agent 当前消费 Core logging、io、events、dimensions、knowledge、search、memory、workspace、project-intelligence、host-agent-workflows 等 public facade。
- `scripts/stage-agent-publish-package.mjs` 会在 publish staging 中把 `@alembic/core` 从 `file:../AlembicCore` 替换为 Core registry version，并记录 Agent/Core source commit。

边界判断：Core 提供确定性 facades，Agent 消费它们完成 orchestration；不应把 Core repository/search/AST/Guard/project registry 复制到 Agent，也不应把 Agent AI provider/runtime loop 下沉到 Core。

## Alembic 主仓库真实消费方式

只读扫描 Alembic 主仓库得到以下消费事实：

- `package.json` 依赖 `@alembic/agent: file:../AlembicAgent`。
- `lib/injection/modules/AgentModule.ts` 通过 public subpaths 消费 `@alembic/agent/forge`、`@alembic/agent/service`、`@alembic/agent/tools`、`@alembic/agent/tools/terminal`、`@alembic/agent/tools/v2`。
- `lib/injection/modules/AiModule.ts` 消费 `@alembic/agent/ai`，但 Alembic 主仓库自己管理 DI lifecycle、token recorder 和 provider reload。
- `lib/http/routes/ai.ts` 消费 `@alembic/agent/ai`、`@alembic/agent/context`、`@alembic/agent/profiles`、`@alembic/agent/service`、`@alembic/agent/tasks`、`@alembic/agent/tools`。
- `lib/workflows/capabilities/execution/internal-agent/**` 消费 `@alembic/agent/memory`、`@alembic/agent/runtime`、`@alembic/agent/service`、`@alembic/agent/prompts`。
- `scripts/lint-agent-extraction-boundary.mjs` 和 `config/agent-extraction-boundary.json` 记录了 Alembic 已从旧本地 Agent 实现切到 `@alembic/agent` public subpaths，且 ToolContextFactory 等宿主 bridge 留在 Alembic 主仓库。

边界判断：Alembic 主仓库是 AlembicAgent public API 的主要消费者和宿主。AlembicAgent 不应接管 Alembic 的 HTTP/daemon/CLI/release 入口；Alembic 主仓库也不应重新复制 Agent runtime/provider/tool generic contracts。

## 职责边界判断

### 应留在 AlembicAgent

- internal AI / Agent runtime：`AgentRuntime`、loop、message、diagnostics、budget、strategy、policy、profile、service orchestration。
- AI provider adapter：provider base class、provider manager、model registry、transport、fallback、tool-call compatibility 和 error/rate-limit classification。
- generic tool system：Tool V2 router/cache/compressor/adapter contract、tool result envelope、decision、catalog、workflow registry、terminal portable policy/session contract。
- Agent memory/context/prompt/domain/task：MemoryCoordinator、SessionStore、L4 memory package、ConversationStore、ContextWindow、ExplorationTracker、prompt builders、evidence/consolidation helpers、task handlers。
- release staging for `@alembic/agent` package：只负责 package publish staging，不负责 Codex channel/runtime artifact。

### 应留在 Alembic 主仓库

- CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、file monitor、resident semantic/vector search、local install/release staging。
- Agent host wiring：ServiceContainer、AI Settings/env persistence、provider hot reload trigger、ToolContextFactory、Dashboard/Skill/Mac/Terminal concrete adapters、projectRoot/dataRoot resolution。
- Internal AI jobs 的产品入口和状态持久化。

### 应留在 AlembicPlugin

- Codex MCP server、tool schema、Skill、marketplace/channel/cache、portable runtime artifact、host project alignment presentation、baseline knowledge search、Guard/prime/search Codex-facing route。
- Codex host agent route。Plugin 不需要也不应内置 AlembicAgent runtime loop 或第三方 AI provider。

### 应留在 AlembicCore

- deterministic public facades：workspace/project registry、daemon/job store contracts、events/io/logging、search/vector primitives、knowledge/dimensions/host-agent-workflows、memory data primitives。
- Core 只提供可复用 contract 和 deterministic helpers，不拥有 Agent runtime、AI provider 或 prompt loop。

## 删除 / 下沉 / 不得移动候选

### 删除候选

- AlembicAgent 当前未发现应在本轮删除的产品能力。
- 若其它仓库仍残留旧 Agent runtime/provider/tool generic duplicate，应由对应仓库基于 import 扫描和替代入口证据另开删除任务；本轮不删除兼容层。

### 下沉候选

- 当前没有建议从 AlembicAgent 下沉到 Core 的成熟候选。
- 只有当某个 helper 变成多个仓库共同使用的 deterministic contract，且不依赖 AI provider/runtime state/prompt/tool side effect，才可另行评估下沉到 Core。

### 不得移动 / 不得下沉

- `src/agent/runtime`、`src/agent/service`、`src/external/ai`、`src/tools/v2`、`src/tools/terminal`、`src/agent/memory`、`src/agent/context`、`src/agent/prompts`、`src/agent/tasks`。
- `config/agent-public-api-boundary.json` 与 public exports 对应 entrypoints。
- `scripts/stage-agent-publish-package.mjs` 中的 release staging 语义。
- `AgentRuntimeBoundary` 中明确标为 Plugin-owned/host-owned 的 Codex MCP、marketplace、channel、host-agent route 不得被迁回 AlembicAgent。

## 文档口径债

- `AGENTS.md` 中仍有“宿主 Agent 接入 adapter，例如 Codex、CLI agent、local daemon agent 或后续宿主”的长期表达，容易和 `AgentRuntimeBoundary` 中 Plugin-owned Codex host-agent route 产生歧义。建议总控长期契约改为：AlembicAgent 提供通用 host adapter contract / internal runtime 可复用逻辑，但 Codex MCP / Codex host-agent route / marketplace/channel 归 AlembicPlugin。
- `src/external/ai` 的目录名表达“外部 AI provider”，但 package export 是 `@alembic/agent/ai`；后续文档应避免把 external/ai 误解为 Plugin external/mcp 或宿主交付目录。

## 验证命令

在 AlembicAgent 仓库执行：

- `git status --short`
- `rg -n "@alembic/agent|#agent|#external|#tools|#shared|@alembic/core" src test scripts config package.json`
- `rg -n "host-agent|Codex|MCP|marketplace|plugin|internal-ai|alembic-internal-ai|hostAgentRouteSupported|unsupportedHostRoutes" src config test README.md AGENTS.md`
- `git diff --check`

只读参考 Alembic 主仓库：

- `rg -n "@alembic/agent|AgentService|AgentRuntimeBuilder|AiProvider|MemoryCoordinator|ToolRouter|ALEMBIC_AGENT_RUNTIME_BOUNDARY" lib scripts config test package.json`

## 验证结果

- AlembicAgent `git status --short`：无产品源码改动。
- exports/imports 扫描确认：Agent 自身通过 public/private import 边界组织 runtime、AI、tools、memory/context，并通过 `@alembic/core` stable facade 消费 Core 能力。
- host-agent/Codex/MCP 扫描确认：`AgentRuntimeBoundary` 明确 `hostAgentRouteSupported: false`，Codex MCP/marketplace/plugin host-agent route 不属于 AlembicAgent；import boundary lint 脚本禁止 AlembicAgent 引入 Plugin/Codex/MCP/channel/skill delivery 路径。
- Alembic 主仓库只读扫描确认：Alembic 通过 `@alembic/agent/*` public subpaths 消费 Agent runtime/provider/tool/memory/prompt contract，宿主 DI/HTTP/ToolContextFactory 留在 Alembic。
- `git diff --check`：通过。

## 遗留风险

- 本轮没有运行 build/lint/test，因为任务明确只做证据采集和边界判断，且未改产品源码。
- Alembic 主仓库仍是主要 consumer，长期 contract 需要总控继续和 Alembic/AlembicPlugin 回填合并，避免把 internal agent runtime 和 Codex host agent route 混用。
- 如果后续要清理其它仓库的旧 Agent duplicate，必须先扫描真实 consumer 并保持 `@alembic/agent` public subpaths 可用。

## 下一步建议

- 总控长期职责契约中明确写入：`host agent` 默认指 Codex host agent，归 AlembicPlugin；AlembicAgent 只拥有 internal AI / Agent runtime 和通用 contract。
- Alembic 主仓库继续作为 AlembicAgent 的宿主 consumer，保留 DI、daemon、HTTP、ToolContextFactory 和 provider setting 管理。
- AlembicPlugin 后续如果出现 AI provider / Agent runtime duplicate，应归为删除候选，但必须由 Plugin 窗口基于 GFBD-P1-P 证据另开任务。
