# AlembicAgent Phase 0 Inventory

日期：2026-05-17
阶段：Phase 0 - Alembic 源代码清单与 Plugin 删除清单
范围：只读扫描 `Alembic`、`AlembicPlugin`、`AlembicCore`；未修改任何相邻仓库。

## 结论

Phase 0 已建立迁移基线。`Alembic` 主仓库仍是 `AlembicAgent` 的唯一实现源；`AlembicPlugin` 只作为删除风险与 Codex adapter 保留点参考。

| 区域 | Alembic | AlembicPlugin | 相同 | 分叉 | 主仓库专有 | Plugin 专有 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `lib/agent` | 98 | 96 | 77 | 19 | 2 | 0 |
| `lib/tools` | 79 | 77 | 60 | 17 | 2 | 0 |
| `lib/external/ai` | 26 | 26 | 26 | 0 | 0 | 0 |
| `lib/service/skills` | 10 | 2 | 0 | 2 | 8 | 0 |

## 五类边界表

| 类别 | Phase 0 判断 |
| --- | --- |
| 从 `Alembic` 迁入 | `lib/agent/**`、`lib/types/agent.d.ts`、`lib/external/ai/**`、Agent-facing 的 `lib/tools` 通用子系统、Agent-facing 的 `lib/service/skills` 推荐/recall 链路。 |
| 留在 `Alembic` | CLI、daemon、HTTP/API、Dashboard/native/IDE/product shell、Lark/Feishu runtime、Mac system tool platform adapter、Dashboard operation bridge。 |
| `AlembicPlugin` 删除候选 | `lib/agent/**`、`lib/external/ai/**`、`lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/v2/**`、`lib/tools/workflow/**`、通用 terminal abstraction；必须等接入 `AlembicAgent` 且验证通过后删除。 |
| `AlembicPlugin` 保留 adapter | `lib/codex/**`、`lib/external/mcp/**`、`bin/codex-mcp.ts`、`plugins/**`、`channels/**`、`skills/**`、`injectable-skills/**`、Codex release/smoke/cache sync 脚本。 |
| 反馈 Core | Agent import 仍引用 `@alembic/core/shared/token-utils`、`shared/concurrency`、`shared/similarity`、`shared/constants`、`@alembic/core/infrastructure/database/drizzle/schema`、`@alembic/core/service/evolution/RecipeImpactPlanner` 等，需要 Phase 2-5 迁移时判断是否已有 stable facade 或需要 Core 补口。 |

## Alembic 源清单

### `Alembic/lib/agent` - 98 files

- `capabilities/Capability.ts`
- `capabilities/CapabilityRegistry.ts`
- `capabilities/CodeAnalysis.ts`
- `capabilities/Conversation.ts`
- `capabilities/EvolutionAnalysis.ts`
- `capabilities/KnowledgeProduction.ts`
- `capabilities/ScanProduction.ts`
- `capabilities/SystemInteraction.ts`
- `capabilities/index.ts`
- `context/ContextWindow.ts`
- `context/ConversationStore.ts`
- `context/ExplorationTracker.ts`
- `context/exploration/ExplorationStrategies.ts`
- `context/exploration/NudgeGenerator.ts`
- `context/exploration/PlanTracker.ts`
- `context/exploration/SignalDetector.ts`
- `coordination/AgentRunCoordinator.ts`
- `domain/EpisodicConsolidator.ts`
- `domain/EvidenceCollector.ts`
- `domain/consolidation-gate.ts`
- `forge/DynamicComposer.ts`
- `forge/SandboxRunner.ts`
- `forge/TemporaryToolRegistry.ts`
- `forge/ToolForge.ts`
- `forge/ToolRequirementAnalyzer.ts`
- `index.ts`
- `memory/ActiveContext.ts`
- `memory/MemoryConsolidator.ts`
- `memory/MemoryCoordinator.ts`
- `memory/MemoryEmbeddingStore.ts`
- `memory/MemoryRetriever.ts`
- `memory/MemoryStore.ts`
- `memory/PersistentMemory.ts`
- `memory/SessionStore.ts`
- `memory/index.ts`
- `memory/memory-flush-contract.ts`
- `memory/session-store-schema.ts`
- `policies/BudgetPolicy.ts`
- `policies/Policy.ts`
- `policies/PolicyEngine.ts`
- `policies/QualityGatePolicy.ts`
- `policies/SafetyPolicy.ts`
- `policies/index.ts`
- `profiles/AgentProfileCompiler.ts`
- `profiles/AgentProfileRegistry.ts`
- `profiles/AgentStageFactoryRegistry.ts`
- `profiles/definitions/bootstrap.profile.ts`
- `profiles/definitions/chat.profile.ts`
- `profiles/definitions/evolution.profile.ts`
- `profiles/definitions/index.ts`
- `profiles/definitions/relation.profile.ts`
- `profiles/definitions/remote.profile.ts`
- `profiles/definitions/scan.profile.ts`
- `profiles/definitions/signal.profile.ts`
- `profiles/definitions/translation.profile.ts`
- `profiles/presets.ts`
- `prompts/insight-analyst.ts`
- `prompts/insight-evolver.ts`
- `prompts/insight-gate.ts`
- `prompts/insight-producer.ts`
- `prompts/scan-prompts.ts`
- `runs/evolution/EvolutionAgentRun.ts`
- `runs/index.ts`
- `runs/relation/RelationAgentRun.ts`
- `runs/scan/ScanAgentRun.ts`
- `runs/scan/ScanRunProjection.ts`
- `runs/translation/TranslationAgentRun.ts`
- `runtime/AgentEventBus.ts`
- `runtime/AgentMessage.ts`
- `runtime/AgentRuntime.ts`
- `runtime/AgentRuntimeTypes.ts`
- `runtime/AgentState.ts`
- `runtime/BudgetController.ts`
- `runtime/DiagnosticsCollector.ts`
- `runtime/ExitController.ts`
- `runtime/HookSystem.ts`
- `runtime/LLMResultType.ts`
- `runtime/LoopContext.ts`
- `runtime/MessageAdapter.ts`
- `runtime/SystemPromptBuilder.ts`
- `runtime/SystemRunContext.ts`
- `runtime/ToolExecutionPipeline.ts`
- `runtime/final-answer.ts`
- `runtime/forced-summary.ts`
- `service/AgentRouter.ts`
- `service/AgentRunContracts.ts`
- `service/AgentRuntimeBuilder.ts`
- `service/AgentService.ts`
- `service/SystemRunContextFactory.ts`
- `service/index.ts`
- `strategies/AdaptiveStrategy.ts`
- `strategies/FanOutStrategy.ts`
- `strategies/PipelineStrategy.ts`
- `strategies/SingleStrategy.ts`
- `strategies/Strategy.ts`
- `strategies/StrategyRegistry.ts`
- `strategies/index.ts`
- `tasks/AgentTaskHandlers.ts`

### `Alembic/lib/types` - 1 file

- `agent.d.ts`

### `Alembic/lib/external/ai` - 26 files

- `AiFactory.ts`
- `AiProvider.ts`
- `AiProviderManager.ts`
- `gateway/LLMGateway.ts`
- `gateway/index.ts`
- `guard/ParameterGuard.ts`
- `providers/ClaudeProvider.ts`
- `providers/DeepSeekProvider.ts`
- `providers/GoogleGeminiProvider.ts`
- `providers/MockProvider.ts`
- `providers/OllamaProvider.ts`
- `providers/OpenAiProvider.ts`
- `registry/ModelRegistry.ts`
- `registry/ProviderConfig.ts`
- `registry/model-defs.ts`
- `registry/models/claude.ts`
- `registry/models/deepseek.ts`
- `registry/models/google.ts`
- `registry/models/ollama.ts`
- `registry/models/openai.ts`
- `transport/ClaudeTransport.ts`
- `transport/DeepSeekTransport.ts`
- `transport/GoogleTransport.ts`
- `transport/LLMTransport.ts`
- `transport/OpenAiTransport.ts`
- `transport/index.ts`

### `Alembic/lib/service/skills` - 10 files

- `AIRecallStrategy.ts`
- `EventAggregator.ts`
- `FeedbackStore.ts`
- `RecommendationMetrics.ts`
- `RecommendationPipeline.ts`
- `RuleRecallStrategy.ts`
- `SignalCollector.ts`
- `SkillAdvisor.ts`
- `SkillHooks.ts`
- `types.ts`

### `Alembic/lib/tools` - 79 files

- `adapters/DashboardOperationAdapter.ts`
- `adapters/DashboardOperations.ts`
- `adapters/MacSystemAdapter.ts`
- `adapters/MacSystemCapabilities.ts`
- `adapters/SkillAdapter.ts`
- `adapters/SkillCapabilities.ts`
- `adapters/TerminalAdapter.ts`
- `adapters/TerminalSession.ts`
- `adapters/TerminalSessionManager.ts`
- `adapters/WorkflowAdapter.ts`
- `adapters/terminal-adapter/TerminalArtifacts.ts`
- `adapters/terminal-adapter/TerminalAudit.ts`
- `adapters/terminal-adapter/TerminalEnvelopes.ts`
- `adapters/terminal-adapter/TerminalEnvironment.ts`
- `adapters/terminal-adapter/TerminalExecutorShared.ts`
- `adapters/terminal-adapter/TerminalExecutors.ts`
- `adapters/terminal-adapter/TerminalPtyExecutor.ts`
- `adapters/terminal-adapter/TerminalPtyRunner.ts`
- `adapters/terminal-adapter/TerminalRunExecutor.ts`
- `adapters/terminal-adapter/TerminalScriptExecutor.ts`
- `adapters/terminal-adapter/TerminalSessionExecutor.ts`
- `adapters/terminal-adapter/TerminalShellExecutor.ts`
- `adapters/terminal-capabilities/TerminalCapabilityHelpers.ts`
- `adapters/terminal-capabilities/TerminalExecutionCapabilities.ts`
- `adapters/terminal-capabilities/TerminalSessionCapabilities.ts`
- `adapters/terminal-capabilities/index.ts`
- `adapters/terminal-policy/TerminalPolicyShared.ts`
- `adapters/terminal-policy/TerminalPolicyTypes.ts`
- `adapters/terminal-policy/TerminalRunPolicy.ts`
- `adapters/terminal-policy/TerminalScriptPolicy.ts`
- `adapters/terminal-policy/TerminalShellPolicy.ts`
- `adapters/terminal-policy/index.ts`
- `catalog/CapabilityCatalog.ts`
- `catalog/CapabilityManifest.ts`
- `catalog/UnifiedToolCatalog.ts`
- `core/InternalToolHandler.ts`
- `core/LightweightRouter.ts`
- `core/ToolCallContext.ts`
- `core/ToolContracts.ts`
- `core/ToolDecision.ts`
- `core/ToolResultEnvelope.ts`
- `core/ToolResultPresenter.ts`
- `core/ToolRoutingServices.ts`
- `v2/adapter/ToolContextFactory.ts`
- `v2/adapter/V2CapabilityCatalog.ts`
- `v2/adapter/V2ToolRouterAdapter.ts`
- `v2/adapter/index.ts`
- `v2/cache/DeltaCache.ts`
- `v2/cache/SearchCache.ts`
- `v2/capabilities/BootstrapAnalyze.ts`
- `v2/capabilities/BootstrapProduce.ts`
- `v2/capabilities/CapabilityV2.ts`
- `v2/capabilities/ConversationV2.ts`
- `v2/capabilities/Evolution.ts`
- `v2/capabilities/ScanAnalyze.ts`
- `v2/capabilities/ScanProduce.ts`
- `v2/capabilities/SystemV2.ts`
- `v2/capabilities/index.ts`
- `v2/compressor/OutputCompressor.ts`
- `v2/compressor/parsers/GitDiffParser.ts`
- `v2/compressor/parsers/GitLogParser.ts`
- `v2/compressor/parsers/GitStatusParser.ts`
- `v2/compressor/parsers/GrepParser.ts`
- `v2/compressor/parsers/LintOutputParser.ts`
- `v2/compressor/parsers/PackageParser.ts`
- `v2/compressor/parsers/TestOutputParser.ts`
- `v2/compressor/parsers/TreeParser.ts`
- `v2/compressor/strip.ts`
- `v2/handlers/code.ts`
- `v2/handlers/graph.ts`
- `v2/handlers/knowledge.ts`
- `v2/handlers/memory.ts`
- `v2/handlers/meta.ts`
- `v2/handlers/terminal.ts`
- `v2/index.ts`
- `v2/registry.ts`
- `v2/router.ts`
- `v2/types.ts`
- `workflow/WorkflowRegistry.ts`

## 差异清单

### `Alembic/lib/agent` 与 `AlembicPlugin/lib/agent`

主仓库专有：

- `profiles/definitions/remote.profile.ts`
- `profiles/definitions/signal.profile.ts`

同名分叉：

- `capabilities/Conversation.ts`
- `capabilities/KnowledgeProduction.ts`
- `capabilities/ScanProduction.ts`
- `context/ConversationStore.ts`
- `index.ts`
- `memory/SessionStore.ts`
- `profiles/AgentProfileCompiler.ts`
- `profiles/definitions/chat.profile.ts`
- `profiles/definitions/index.ts`
- `profiles/presets.ts`
- `prompts/insight-producer.ts`
- `prompts/scan-prompts.ts`
- `runtime/AgentEventBus.ts`
- `runtime/AgentMessage.ts`
- `runtime/AgentRuntimeTypes.ts`
- `runtime/forced-summary.ts`
- `service/AgentRouter.ts`
- `service/AgentRunContracts.ts`
- `service/AgentService.ts`

结论：Phase 2 复制时以 `Alembic/lib/agent/**` 为准，不把 Plugin 分叉实现合并进 `AlembicAgent`。Plugin 分叉文件只用于后续 adapter 风险分析。

### `Alembic/lib/tools` 与 `AlembicPlugin/lib/tools`

主仓库专有：

- `adapters/MacSystemAdapter.ts`
- `adapters/MacSystemCapabilities.ts`

同名分叉：

- `adapters/terminal-adapter/TerminalAudit.ts`
- `adapters/terminal-adapter/TerminalEnvironment.ts`
- `adapters/terminal-adapter/TerminalExecutorShared.ts`
- `adapters/terminal-adapter/TerminalPtyExecutor.ts`
- `adapters/terminal-adapter/TerminalRunExecutor.ts`
- `adapters/terminal-adapter/TerminalShellExecutor.ts`
- `adapters/terminal-policy/TerminalRunPolicy.ts`
- `core/ToolCallContext.ts`
- `v2/adapter/ToolContextFactory.ts`
- `v2/capabilities/BootstrapProduce.ts`
- `v2/capabilities/ConversationV2.ts`
- `v2/compressor/parsers/TreeParser.ts`
- `v2/handlers/code.ts`
- `v2/handlers/knowledge.ts`
- `v2/handlers/terminal.ts`
- `v2/registry.ts`
- `v2/types.ts`

结论：Phase 4 不能按整个 `lib/tools` 粗暴迁移。`core`、`catalog`、`v2`、`workflow` 和 terminal abstraction 是 Agent 候选；Mac system、Dashboard operation、宿主 platform bridge 需要留在外层 adapter。

## Agent import 图摘要

`Alembic/lib/agent` 直接依赖最多的外部或跨目录 specifier：

| Import | 次数 | Phase 0 分类 |
| --- | ---: | --- |
| `@alembic/core/logging` | 20 | Core stable |
| `@alembic/core/events` | 6 | Core stable |
| `@alembic/core/io` | 5 | Core stable |
| `#external/ai/AiProvider.js` | 6 | Agent package 内部候选 |
| `#external/ai/gateway/LLMGateway.js` | 2 | Agent package 内部候选 |
| `#tools/core/ToolResultEnvelope.js` | 6 | Agent tool core 候选 |
| `#tools/core/ToolContracts.js` | 3 | Agent tool core 候选 |
| `#tools/v2/capabilities/*` | 20 | Agent tool v2 候选 |
| `#tools/workflow/WorkflowRegistry.js` | 3 | Agent tool workflow 候选 |
| `@alembic/core/infrastructure/database/drizzle/schema` | 2 | Core deep/transitional，需要反馈判断 |
| `@alembic/core/shared/concurrency` | 2 | Core shared/transitional，需要反馈判断 |
| `@alembic/core/shared/similarity` | 2 | Core shared/transitional，需要反馈判断 |
| `@alembic/core/shared/token-utils` | 2 | Core shared/transitional，需要反馈判断 |
| `@alembic/core/service/evolution/RecipeImpactPlanner` | 1 | Core deep/transitional，需要反馈判断 |

## Plugin 删除清单与逻辑

Plugin 删除必须按“明确宿主 agent contract -> 替换/删除内置 import -> 验证 -> 删除文件”的顺序执行，不允许先删。Plugin 不新增 `@alembic/agent` dependency，也不从 `AlembicAgent` package import 运行时能力。

### 可删除候选

- `AlembicPlugin/lib/agent/**`：96 files。等宿主 agent contract 明确并验证后，逐批删除 `#agent/*` 本地实现引用，必要调用改到宿主 agent adapter。
- `AlembicPlugin/lib/external/ai/**`：26 files。两边当前完全一致，等宿主 agent/config contract 明确后删除内置 provider，不改成 package import。
- `AlembicPlugin/lib/tools/core/**`：8 files。等宿主 tool execution contract 明确后删除内置 tool core runtime，不改成 package import。
- `AlembicPlugin/lib/tools/catalog/**`：3 files。等宿主 tool execution contract 明确后删除内置 catalog runtime，不改成 package import。
- `AlembicPlugin/lib/tools/v2/**`：35 files。需要先区分 generic capability/router/compressor 与 Codex adapter 调用点。
- `AlembicPlugin/lib/tools/workflow/**`：1 file。等宿主 workflow/tool contract 暴露后删除或改到 Plugin adapter。
- `AlembicPlugin/lib/tools/adapters/terminal-adapter/**`、`terminal-capabilities/**`、`terminal-policy/**`：22 files。需要先确认 Codex sandbox/permission 差异是否留在 Plugin adapter。

### 必须保留

- `AlembicPlugin/bin/codex-mcp.ts`
- `AlembicPlugin/lib/codex/**`
- `AlembicPlugin/lib/external/mcp/**`
- `AlembicPlugin/plugins/**`
- `AlembicPlugin/channels/**`
- `AlembicPlugin/skills/**`
- `AlembicPlugin/injectable-skills/**`
- `AlembicPlugin/scripts/*codex*`
- `AlembicPlugin/scripts/*plugin*`
- `AlembicPlugin/scripts/sync-codex-plugin-cache.mjs`

### 已扫描到的 Plugin 接入点

`#agent/*` 引用出现在 20 个 Plugin 文件中，重点是 `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts`、HTTP routes、`lib/injection/modules/AgentModule.ts`、workflow internal-agent 目录和 completion capability。

`#external/ai/*` 引用出现在 5 个 Plugin 文件中，包含 `lib/external/mcp/handlers/system.ts` 和当前 `lib/agent` runtime/service 文件。

通用 `#tools/*` 引用出现在 55 个 Plugin 文件中。宿主 agent adapter 替代路径验证前不能删除 `lib/tools` 候选目录，因为 MCP、HTTP utils、injection module、tool adapters 仍在本地引用这些 contract。

## Alembic 主仓库接入任务

这些任务交给 `Alembic` 窗口，不由 `AlembicAgent` 窗口实施：

1. 暂不删除 `Alembic/lib/agent/**`、`lib/external/ai/**`、`lib/tools/**` 或 `lib/service/skills/**`。
2. 在 `AlembicAgent` Phase 2-4 完成后，添加 package/file dependency，并把 product shell 里的 `#agent/*`、`#external/ai/*`、通用 `#tools/*` 引用改为 `AlembicAgent` public entrypoint。
3. 保留 CLI、daemon、HTTP/API、Dashboard/native/IDE、Lark/Feishu runtime 和主产品 wiring。
4. 将 `MacSystemAdapter.ts`、`MacSystemCapabilities.ts` 作为主仓库 platform adapter 候选，除非后续有明确 host adapter contract 和测试，不迁入 Agent。
5. 删除主仓库重复 Agent 实现前，必须提供 import 扫描、替代入口、build/check/lint 和 CLI/daemon/Dashboard smoke 证据。

## AlembicPlugin 宿主适配与删除任务

这些任务交给 `AlembicPlugin` 窗口，不由 `AlembicAgent` 窗口实施：

1. 暂不删除 `AlembicPlugin/lib/agent/**`。
2. Phase 2 后不接入 `AlembicAgent` 依赖；逐批删除 `#agent/*` 本地实现引用，必要调用改到宿主 agent adapter；Codex MCP handler 只做 schema、envelope、session、policy 和 Codex adapter。
3. Phase 3 后删除 `lib/external/ai/**` 重复实现，不从 `AlembicAgent` import provider/transport/model registry；AI 能力经宿主 agent/config contract 获得。
4. Phase 4 后逐批删除 tool core/catalog/v2/workflow/terminal abstraction 重复实现；保留 Codex-facing MCP schema projection、handler envelope 和 plugin release/smoke 体系。
5. 对 19 个分叉 Agent 文件逐一判断：默认删除；如果分叉是 Codex 必需行为，必须留在 Plugin adapter 或通过明确 adapter contract 调用 Agent，不能迁回 `AlembicAgent` 主实现。
6. 每批删除前运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。

## Phase 1 输入

下一轮 `AlembicAgent` 窗口进入 Phase 1：初始化可构建 TypeScript 包。Phase 1 只需要建立 package、TypeScript、Biome、boundary lint 和最小 public entrypoint，不复制业务实现。

建议 `@alembic/core` 接入沿用外层仓库的 `file:vendor/AlembicCore` 模式，或者等 workspace 策略确认后改为同级 file dependency。Phase 1 必须包含边界 lint，禁止直接引用 Plugin/MCP/Channel/Codex delivery。
