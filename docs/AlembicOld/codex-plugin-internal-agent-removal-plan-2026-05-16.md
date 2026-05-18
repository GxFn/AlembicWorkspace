# AlembicPlugin 内部 Agent 能力拆除计划

日期：2026-05-16

## 结论速览

本轮只在 `AlembicPlugin` 仓库做真实代码扫描，未扫描或修改 workspace 下其他仓库源码。结论是：`AlembicPlugin` 不是只残留了一个 `lib/agent` 目录，而是把内部 AgentRuntime 贯穿到了 Codex MCP 冷启动工具、daemon job、Dashboard AI 路由、模块扫描、rescan evolution audit、DI 容器、测试与插件文案里。

推荐拆除目标是：Codex 插件不再内置“自动跑 Agent 的 AI 执行引擎”，只保留本地项目知识、Guard、结构扫描、外部宿主驱动的 Mission Briefing、候选提交与审核边界。Codex 自身可以作为外部执行者阅读 Mission Briefing 并调用 Alembic 工具提交结果，但 AlembicPlugin 不再启动自己的 AgentService / AgentRuntime / bootstrap-session 子 Agent。

关键判断：

| 边界 | 当前状态 | 拆除判断 |
| --- | --- | --- |
| `lib/agent/**` | 完整 Agent 平台，含 runtime、profiles、strategies、memory、tools、prompts、runs | 目标删除，但必须先迁出少量中性类型/工具。 |
| `lib/workflows/capabilities/execution/internal-agent/**` | bootstrap/rescan 自动填维度主链路，依赖 `AgentService` | 目标删除或改名为 deprecated internal path，默认不可达。 |
| `alembic_codex_bootstrap/rescan` | Codex 工具入队 daemon job，最终调用 internal Agent workflow | 必须改语义：改为外部执行 briefing，或拆掉这两个 internal job 工具。 |
| `alembic_bootstrap/rescan` | Core MCP tool 文案是外部 Agent 路径，返回 Mission Briefing | 应保留，但建议把 `external-agent` 命名迁为 `host-driven` / `codex-driven`，避免继续强化 agent 概念。 |
| Dashboard `/api/v1/ai/*` | chat、summarize、translate、extract 等直接用 `AgentService` | Codex-only 插件应删除或降级；如果保留 Dashboard AI，则改成窄 LLM task adapter，不走 AgentRuntime。 |
| `agent` tier | MCP 权限层字符串，不等于内部 AgentRuntime | 可短期保留为 ACL 名称；若产品上要完全去 Agent 化，再另做 `default` tier 迁移。 |
| 插件 runtime/dist | 由 `scripts/prepare-codex-plugin-runtime.mjs` 从 `dist` 复制生成 | 不直接编辑，源码拆除后重新 build/prepare。 |

## 扫描范围

本轮实际检查了这些 AlembicPlugin 路径：

- `package.json`
- `lib/agent/**`
- `lib/injection/modules/AgentModule.ts`
- `lib/injection/modules/AppModule.ts`
- `lib/injection/ServiceMap.ts`
- `lib/codex/RuntimeContext.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/Preflight.ts`
- `lib/codex/StatusService.ts`
- `lib/codex/Diagnostics.ts`
- `lib/external/mcp/CodexMcpServer.ts`
- `lib/external/mcp/tools.ts`
- `lib/external/mcp/handlers/bootstrap-internal.ts`
- `lib/external/mcp/handlers/rescan-internal.ts`
- `lib/external/mcp/handlers/bootstrap-external.ts`
- `lib/workflows/cold-start/**`
- `lib/workflows/knowledge-rescan/**`
- `lib/workflows/capabilities/execution/internal-agent/**`
- `lib/workflows/capabilities/execution/external/**`
- `lib/daemon/DaemonJobRunner.ts`
- `lib/http/routes/ai.ts`
- `lib/http/routes/extract.ts`
- `lib/http/routes/recipes.ts`
- `lib/http/routes/jobs.ts`
- `lib/http/routes/modules.ts`
- `lib/service/module/ModuleService.ts`
- `lib/tools/v2/**`
- `test/unit/*Agent*`
- `test/unit/Bootstrap*`
- `plugins/alembic-codex/**` 中的 manifest、MCP config、README、Skill、release/smoke 相关文案
- `scripts/prepare-codex-plugin-runtime.mjs`
- `scripts/verify-codex-plugin.mjs`
- `scripts/smoke-codex-plugin.mjs`

排除：

- `Alembic/**` 与 `AlembicCore/**` 源码。
- `plugins/alembic-codex/runtime/dist/**` 作为生成物只做影响确认，不作为编辑目标。
- Dashboard 已构建产物只作为文案残留观察，不作为直接编辑目标。

## 当前真实调用链

### Codex 工具到 internal Agent job

当前 `alembic_codex_bootstrap` 和 `alembic_codex_rescan` 的链路是：

```text
Codex MCP tool
  -> lib/external/mcp/CodexMcpServer.ts
  -> enqueueJob("bootstrap" | "rescan")
  -> POST /api/v1/jobs/bootstrap|rescan
  -> lib/http/routes/jobs.ts
  -> enqueueDaemonJob()
  -> lib/daemon/DaemonJobRunner.ts
  -> dynamic import bootstrap-internal.ts / rescan-internal.ts
  -> InternalColdStartWorkflow / InternalKnowledgeRescanWorkflow
  -> internal-agent execution pipeline
  -> AgentService.run()
  -> AgentRuntime
```

关键证据：

- `CodexMcpServer.enqueueJob()` 只把 Codex tool call 转成 daemon job。
- `DaemonJobRunner.executeInternalWorkflow()` 对 `bootstrap` 动态 import `../external/mcp/handlers/bootstrap-internal.js`，对 `rescan` 动态 import `../external/mcp/handlers/rescan-internal.js`。
- `bootstrap-internal.ts` re-export `runInternalColdStartWorkflow`。
- `rescan-internal.ts` re-export `runInternalKnowledgeRescanWorkflow`。
- `InternalDimensionExecutionPipeline.ts` 在非 mock 模式下初始化 bootstrap runtime，并调用 `runInternalDimensionAgentSession()`。
- `InternalDimensionFillSessionRunner.ts` 最终执行 `services.agentService.run(bootstrapSessionInput)`。

这说明 Codex 插件所谓“recoverable bootstrap job”当前不是外部 Codex 执行任务，而是 Alembic 自己在 daemon 内部跑 AgentRuntime。

### MCP core tools 与 external 路径

`lib/external/mcp/tools.ts` 中 `alembic_bootstrap` / `alembic_rescan` 仍是 agent tier 工具，但它们的文案描述的是外部执行流程：返回 Mission Briefing，之后由执行者按维度调用 `submit_knowledge`、`evolve`、`dimension_complete`。

外部路径在代码中已经存在：

- `ExternalColdStartWorkflow.ts`：Phase 1-4 结构扫描，返回 Mission Briefing，不启动异步 AI pipeline。
- `ExternalKnowledgeRescanWorkflow.ts`：保留 Recipe，做 rescan 分析，返回 evolution guide 和按维度执行计划。
- `ExternalDimensionCompletionWorkflow.ts`：消费外部执行者提交的维度完成结果。

这条路径是拆除内部 Agent 后最接近产品目标的替代主链路。它仍然使用 `external-agent` 命名，但实际含义可以迁移为“host-driven executor”：Codex、CLI 用户或其他宿主读 briefing 后主动调用 Alembic 工具。

### DI 与服务边界

`AgentModule.ts` 当前混合注册了两类东西：

1. 中性工具系统：
   - `capabilityCatalog`
   - `v2ToolContextFactory`
   - `toolRouter`
   - `toolRegistry`
   - `workflowRegistry`
   - `terminalSessionManager`
   - `skillHooks`

2. 内部 Agent 平台：
   - `toolForge`
   - `agentProfileRegistry`
   - `agentStageFactoryRegistry`
   - `agentProfileCompiler`
   - `agentRunCoordinator`
   - `systemRunContextFactory`
   - `agentRuntimeBuilder`
   - `agentService`

拆除时不能直接删除整个 `AgentModule.ts`，因为 V2 tool router、workflow registry、skill hooks 仍被 MCP/Dashboard/Guard 工作流使用。正确动作是先把中性工具注册移到 `ToolModule` 或 `RuntimeToolModule`，再删除 Agent 专属注册项。

`AppModule.ts` 还把 `agentService` 和 `systemRunContextFactory` 注入 `ModuleService`。如果删除 AgentService，需要同步把 `ModuleService` 的 AI extraction 降级或替换成窄 LLM adapter。

### Dashboard AI 表面

这些 HTTP 路由直接依赖 AgentService：

- `lib/http/routes/ai.ts`
  - `/summarize` 走 `runScanAgentTask`
  - `/translate` 走 `runTranslationJson`
  - `/chat` 和 `/chat/stream` 直接 `agentService.run()`
  - 还引用 `ConversationStore`、profiles、AgentTaskHandlers
- `lib/http/routes/extract.ts`
  - `runAiExtract()` 使用 `runScanAgentTask`
- `lib/http/routes/recipes.ts`
  - `/discover-relations` 使用 `runRelationDiscovery`
- `lib/service/module/ModuleService.ts`
  - `#aiExtractRecipes()` 使用 `runScanAgentTask`

这批不是 Codex MCP 必须能力。若 AlembicPlugin 目标收束为 Codex 项目知识插件，建议删除或关闭 Dashboard 内置 Chat Agent、AI extract、AI relation discovery。若仍要保留“AI 辅助润色/摘要”，也应改成 `LLMGateway` 级别的单次 task，不走 AgentRuntime、profiles、tools、memory、strategies。

### Rescan evolution audit

`InternalKnowledgeRescanWorkflow.ts` 在 Step 3 中已经先走 `RecipeImpactPlanner` 和 `submitRescanImpactDecisions()`，随后还尝试取 `agentService` 并调用 `runEvolutionAudit()`。

拆除内部 Agent 后，推荐边界是：

- 保留 deterministic `RecipeImpactPlanner` 与 `submitRescanImpactDecisions()`。
- 删除 `runEvolutionAudit()` 的内部 Agent fallback。
- 需要语义确认时交给外部 briefing：在 Mission Briefing 中列出 pending evolution decisions，由 Codex/用户调用 `alembic_evolve`。

### Memory 与报告类型耦合

内部 Agent 目录中有一部分被非 Agent 文件引用：

- `BootstrapRuntimeInitializer.ts` 使用 `MemoryCoordinator`、`MemoryEmbeddingStore`、`PersistentMemory`、`SessionStore`。
- `CompletionSteps.ts`、`WorkflowCompletionTypes.ts`、`WorkflowSnapshotStore.ts`、`WorkflowReportWriter.ts`、`DimensionCheckpoint.ts` 引用了 `#agent/memory/*` 或 `internal-agent/BootstrapConsumers` 类型。
- `WorkflowResultPersistence.ts` 引用了 `BootstrapConsumers` 里的 `CandidateResults` / `SkillResults` / `DimensionStat`。

这些不能随手删除。需要先把中性类型与存储对象迁到 workflow 或 repository 命名空间，例如：

```text
lib/workflows/capabilities/persistence/WorkflowResultTypes.ts
lib/workflows/capabilities/persistence/SessionDigestStore.ts
lib/repository/session/SessionStore.ts
lib/repository/memory/PersistentMemory.ts
```

再删除 `lib/agent/memory/**`。

## 目标边界定义

### 保留

- Codex plugin shell、MCP stdio wrapper、diagnostics/status/init/dashboard/job/status/cleanup。
- Ghost workspace、project root resolver、workspace settings、AI config status。
- Daemon supervisor、JobStore、Dashboard URL handoff。
- Knowledge / Recipes / Candidates / SourceRef / Graph / Search / Guard。
- ProjectIntelligence Phase 1-4：文件收集、语言识别、AST、dependency graph、Guard audit、Panorama。
- 外部执行 Mission Briefing 链路：bootstrap/rescan briefing、dimension completion、candidate submission。
- V2 ToolRouter、ToolContextFactory、UnifiedToolCatalog 中非 Agent 必需部分。
- AI Provider 配置和 LLMGateway 类低层 adapter，如果用于单次 task 或未来 Core 能力。

### 删除或默认不可达

- `AgentService`
- `AgentRuntime`
- `AgentRunCoordinator`
- `AgentRuntimeBuilder`
- Agent profiles、presets、strategies、policies、capabilities、prompts。
- ToolForge、DynamicComposer、TemporaryToolRegistry、ToolRequirementAnalyzer、SandboxRunner。
- internal-agent bootstrap/rescan auto-fill pipeline。
- Dashboard Chat Agent、streaming AgentRuntime、AI task route 中的 AgentService 入口。
- MockBootstrapPipeline 默认入口。
- `alembic_codex_bootstrap/rescan` 的 internal AI job 语义。

### 需要改名但不一定立刻删除

- `agent` tier：这是权限层命名，不是内部 AgentRuntime。短期保留能降低风险；长期建议迁为 `default` 或 `standard`，同时保留兼容 env alias。
- `external-agent` executor：当前实际是“宿主驱动执行”。建议迁为 `host-driven`，保留旧值兼容一版。
- Dashboard i18n 中 “Agent Runtime / 内置 Agent / AI Agent” 文案：源码拆除后必须统一改掉。

## 分阶段执行计划

### P0：冻结新增 internal Agent 入口

目标：先阻止继续把新功能绑到 `AgentService`。

动作：

- 在 docs 和 AGENTS 约束里声明：AlembicPlugin 新代码不得新增 `#agent/*` import。
- 给 `rg "#agent|agentService|AgentRuntime"` 建一个边界检查脚本或 lint 规则，允许列表只包含迁移中的 legacy 文件。
- 将后续新 AI 能力统一要求走 `LLMGateway` / `AiPort` / `host-driven briefing`。

验收：

- 新增脚本能列出所有现存 `#agent` 引用。
- 文档标注允许列表，不误杀尚未迁移文件。

### P1：把工具系统从 AgentModule 拆出来

目标：删除 Agent 平台前，先保住 MCP/Guard/Skill/Workflow 需要的中性工具系统。

动作：

- 新建 `lib/injection/modules/ToolModule.ts`。
- 把 `capabilityCatalog`、`v2ToolContextFactory`、`toolRouter`、`toolRegistry`、`workflowRegistry`、`terminalSessionManager`、`skillHooks` 从 `AgentModule.ts` 移入 `ToolModule.ts`。
- 保留一个临时 `AgentModule.ts`，只注册 Agent 专属服务，后续整文件删除。
- 更新 `ServiceMap.ts`：中性工具服务与 Agent 服务分区。

验收：

- `npm run typecheck` 通过。
- `alembic_codex_status`、`alembic_codex_diagnostics`、`alembic_guard`、`alembic_search` 不依赖 `agentService`。
- `AgentModuleBoundaries.test.ts` 更新为 ToolModule 边界测试。

### P2：改 Codex bootstrap/rescan 工具语义

目标：Codex 插件不再提供“内部 Agent job”。

推荐方案：把 `alembic_codex_bootstrap/rescan` 改成 host-driven job 或 briefing job，不再调用 internal workflow。

具体动作：

- `lib/codex/Preflight.ts`
  - 删除 `INTERNAL_AI_TOOL_NAMES` 对 `alembic_codex_bootstrap/rescan` 的真实 AI Provider 强制要求。
  - 如果保留 AI config，只作为可选增强状态，不阻塞 briefing。
- `lib/codex/ToolPolicy.ts`
  - 改写 `alembic_codex_bootstrap/rescan` 描述：不再说 internal Alembic bootstrap/rescan job。
  - 如果不保留这两个工具，则把 `alembic_bootstrap/rescan` 加入冷启动可见工具策略。
- `lib/external/mcp/CodexMcpServer.ts`
  - `enqueueJob()` 不再调用 internal job endpoint。
  - 方案 A：同步调用 external workflow 并返回 briefing。
  - 方案 B：仍建 job，但 `DaemonJobRunner` 执行 external workflow，job result 是 briefing，不含 async internal fill。
- `lib/daemon/DaemonJobRunner.ts`
  - 删除对 `bootstrap-internal.ts` / `rescan-internal.ts` 的 dynamic import。
  - 改为 `bootstrap-external.ts` / `rescan-external.ts` 或新的 `host-driven` workflow。
  - 删除 `asyncFill: true` 和 bootstrapSession 监听逻辑，或只用于旧 internal job 兼容模式。
- `lib/http/routes/jobs.ts`
  - job summary/progress 不再假设 bootstrap session 由 internal dimension fill 推动。
- `plugins/alembic-codex/skills/alembic/SKILL.md`
  - 改写 Long-Running Work：Codex 自己执行 briefing，不再说 internal jobs。
- `plugins/alembic-codex/README*.md`
  - 改写 “build or refresh through recoverable daemon jobs” 的 internal 暗示。

验收：

- fresh project listTools 仍能完成 init 后的下一步，但不会要求 AI Provider。
- `alembic_codex_bootstrap` 返回 Mission Briefing 或 host-driven job result。
- 没有真实 AI key 时 bootstrap 不再报 `AI_PROVIDER_REQUIRED`。
- `scripts/smoke-codex-plugin.mjs` 中有关 required tools、bootstrap primary action、job 行为的断言更新。

### P3：删除 internal-agent 自动填充管线

目标：拆除 `lib/workflows/capabilities/execution/internal-agent/**` 的执行逻辑。

动作：

- 删除或弃用：
  - `InternalDimensionExecutionPipeline.ts`
  - `InternalDimensionExecutionWorkflow.ts`
  - `InternalDimensionFillPreparation.ts`
  - `InternalDimensionFillSessionRunner.ts`
  - `BootstrapDimensionRuntimeBuilder.ts`
  - `BootstrapSessionExecutionBuilder.ts`
  - `BootstrapInputBuilders.ts`
  - `BootstrapRuntimeInitializer.ts`
  - `MockBootstrapPipeline.ts`
- 迁出中性类型：
  - `DimensionStat`
  - `CandidateResults`
  - `SkillResults`
  - report/history/snapshot 需要的 projection 类型
- 更新 `InternalColdStartWorkflow.ts` / `InternalKnowledgeRescanWorkflow.ts`：
  - 若 P2 已转向 external workflow，可直接删除 internal workflow 文件。
  - 若保留兼容入口，则抛明确 deprecated error，不能启动 AgentRuntime。

验收：

- `rg "#workflows/capabilities/execution/internal-agent" lib` 只剩迁移兼容或为 0。
- `rg "MockBootstrapPipeline|bootstrap-session|bootstrap-dimension" lib` 为 0 或只剩迁移说明。
- bootstrap/rescan 不再创建 internal dimension session。

### P4：拆 Dashboard / HTTP Agent 表面

目标：移除插件内置 Chat Agent 和 AgentService 任务路由。

动作：

- `lib/http/routes/ai.ts`
  - 删除 `/chat`、`/chat/stream`，或返回功能已移除的结构化错误。
  - `/summarize`、`/translate` 如需保留，改为窄 LLM task adapter。
  - 删除 `ConversationStore`、`PRESETS`、`AgentTaskHandlers` 依赖。
- `lib/http/routes/extract.ts`
  - 删除 AI extract fallback，保留 RecipeParser 解析与基础 fallback。
  - 或改为 LLMGateway 单次 JSON extraction。
- `lib/http/routes/recipes.ts`
  - 删除 AI discover-relations，或改为 deterministic graph suggestions。
- `lib/service/module/ModuleService.ts`
  - 删除 `agentService`、`systemRunContextFactory` 字段与构造参数。
  - `scanTarget/scanProject` 的 AI 提取分支改为 unavailable / external briefing。
- Dashboard i18n 和组件中删除 “内置 Agent / Chat Agent / Agent Runtime” 展示。

验收：

- `rg "agentService|SystemRunContextFactory|AgentRuntime|ConversationStore" lib/http lib/service/module dashboard/src` 不再出现生产引用。
- Dashboard 能正常打开项目知识、Guard、Jobs、Candidates、Panorama，不出现断链按钮。

### P5：删除 Agent DI 与 `lib/agent/**`

目标：源码层面移除内部 Agent 平台。

动作：

- 删除 `lib/agent/**`。
- 删除 `#agent/*` package import alias，或保留一版指向空兼容包并立即移除所有引用。
- 删除 `AgentModule.ts` 中 Agent 专属注册，或整文件删除。
- `ServiceMap.ts` 删除 Agent 类型。
- `package.json` keywords 中 `ai-agent` 可改为 `project-memory` / `codex-plugin`。
- 删除/重写 Agent 相关单测：
  - `AgentRuntime.test.ts`
  - `AgentService.test.ts`
  - `AgentRunCoordinator.test.ts`
  - `ToolExecutionPipeline.test.ts`
  - `BootstrapSessionExecutionBuilder.test.ts`
  - `BootstrapDimensionRuntimeBuilder.test.ts`
  - `SystemRunContextFactory.test.ts`
  - 与 internal Agent bootstrap projection 直接绑定的测试。

验收：

- `rg "#agent|lib/agent|AgentService|AgentRuntime|AgentRunInput|AgentRunResult" lib bin test` 为 0，或只剩 compatibility migration note。
- `npm run typecheck` 通过。
- `npm run test:unit` 通过。
- `npm run verify:codex-plugin` 通过。

### P6：插件分发与生成物刷新

目标：保证安装包和 Codex marketplace 与新边界一致。

动作：

- 运行 `npm run build`。
- 运行 `npm run build:dashboard`。
- 运行 `npm run prepare:codex-plugin-runtime`。
- 更新 `plugins/alembic-codex/runtime.tgz`、`plugins/alembic-codex/runtime/**` 生成物。
- 更新 `plugins/alembic-codex/.codex-plugin/plugin.json` longDescription/defaultPrompt，删除 internal Agent 暗示。
- 更新 `plugins/alembic-codex/README.md` 和 `README.zh-CN.md`。
- 更新 `scripts/verify-codex-plugin.mjs` 与 `scripts/smoke-codex-plugin.mjs` 的预期。

验收：

- `npm run verify:codex-plugin` 通过。
- `npm run smoke:codex-plugin` 通过。
- 如仍保留 daemon job：`npm run release:codex-plugin:daemon` 通过，且 job 不触发 AgentRuntime。

## 文件级处理清单

### 直接删除候选

- `lib/agent/**`
- `lib/workflows/capabilities/execution/internal-agent/MockBootstrapPipeline.ts`
- `lib/external/mcp/handlers/bootstrap-internal.ts`
- `lib/external/mcp/handlers/rescan-internal.ts`
- Agent runtime / service / coordinator / strategy / profile / prompt 单测

### 先迁出再删

- `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts`
  - 迁出 report/persistence 需要的类型和纯投影。
- `lib/agent/memory/**`
  - 若 session/history/report 仍需要，迁到 repository 或 workflow persistence。
- `lib/agent/runtime/AgentRuntimeTypes.ts`
  - 如果 `ToolCallEntry` 等类型仍被 evolution/report 使用，迁到 `lib/tools/core` 或 `lib/types`.

### 必改文件

- `lib/injection/modules/AgentModule.ts`
- `lib/injection/modules/AppModule.ts`
- `lib/injection/ServiceMap.ts`
- `lib/codex/Preflight.ts`
- `lib/codex/ToolPolicy.ts`
- `lib/codex/StatusService.ts`
- `lib/codex/Diagnostics.ts`
- `lib/external/mcp/CodexMcpServer.ts`
- `lib/external/mcp/tools.ts`
- `lib/daemon/DaemonJobRunner.ts`
- `lib/http/routes/jobs.ts`
- `lib/http/routes/ai.ts`
- `lib/http/routes/extract.ts`
- `lib/http/routes/recipes.ts`
- `lib/http/routes/modules.ts`
- `lib/service/module/ModuleService.ts`
- `lib/workflows/cold-start/ColdStartIntent.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanIntent.ts`
- `lib/workflows/shared/WorkflowTypes.ts`
- `plugins/alembic-codex/skills/alembic/SKILL.md`
- `plugins/alembic-codex/README.md`
- `plugins/alembic-codex/README.zh-CN.md`
- `plugins/alembic-codex/.codex-plugin/plugin.json`
- `scripts/smoke-codex-plugin.mjs`
- `scripts/verify-codex-plugin.mjs`

## 需要特别保护的边界

1. 不要删除 `alembic_submit_knowledge`、`alembic_dimension_complete`、`alembic_guard`、`alembic_search`、`alembic_structure`。这些是外部 Codex 执行 Mission Briefing 所需工具。
2. 不要把 `AgentRuntime` 删除理解成“删除 AI Provider”。AI provider status、配置、transport 可以保留，用于未来窄 AI task 或 Core adapter。
3. 不要直接编辑 `plugins/alembic-codex/runtime/dist/**`。它是 build/prepare 输出。
4. 不要让无 key 环境再走 mock bootstrap。mock 可保留在测试夹具，但不能是产品 fallback。
5. 不要把 `agent` tier 和内部 AgentRuntime 混在一轮里强行改名。权限 tier 改名会影响 `.mcp.json`、diagnostics、smoke、用户环境变量，建议单独兼容迁移。
6. 如果删除 `alembic_codex_bootstrap/rescan` 两个工具，必须提供 init 后的下一步，否则 fresh project 会卡在 `needs_bootstrap`，project-knowledge tools 又不可见。

## 建议最终用户体验

新 Codex 插件第一分钟：

```text
alembic_codex_diagnostics
  -> alembic_codex_status
  -> alembic_codex_init
  -> alembic_bootstrap 或 alembic_codex_bootstrap(返回 host-driven briefing)
  -> Codex 按 briefing 扫描/总结
  -> alembic_submit_knowledge
  -> alembic_dimension_complete
  -> alembic_task prime / alembic_guard
```

无 AI Provider 时：

- status/diagnostics/init 正常。
- bootstrap/rescan briefing 正常。
- Codex 自身负责理解与编写候选，不要求 AlembicPlugin 内部 API key。
- Dashboard 不展示内置 Chat Agent。

有 AI Provider 时：

- 可用于 embedding/search/rerank 或未来窄 LLM task。
- 不自动启动内部 AgentRuntime。
- 不创建 mock candidate。

## 验收命令

分阶段建议：

```bash
npm run typecheck
npm run test:unit
npm run verify:codex-plugin
npm run smoke:codex-plugin
```

最终发布前：

```bash
npm run build
npm run build:dashboard
npm run prepare:codex-plugin-runtime
npm run release:codex-plugin
```

如果保留 daemon job 形态：

```bash
npm run release:codex-plugin:daemon
```

## 推荐执行顺序摘要

1. 先拆 ToolModule，稳住非 Agent 工具体系。
2. 改 Codex bootstrap/rescan 为 host-driven briefing，移除 AI Provider 硬门槛。
3. 删除 internal-agent 自动填充管线。
4. 拆 Dashboard/HTTP Agent 表面。
5. 删除 Agent DI 和 `lib/agent/**`。
6. 更新插件文案、smoke/release 验证与生成物。

这条顺序的核心原因是：`lib/agent/**` 不是叶子目录，它现在是多个产品入口的共享执行引擎。先改入口语义和中性工具边界，再删实现，风险最低。
