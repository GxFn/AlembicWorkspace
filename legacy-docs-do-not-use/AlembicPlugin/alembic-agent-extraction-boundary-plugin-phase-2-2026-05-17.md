# AlembicPlugin Agent 删除边界扫描与宿主 Adapter 准备

日期：2026-05-17
来源计划：`docs/AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md`
阶段：AlembicAgent Phase 2/3 完成后的 Plugin 侧删除准备
范围：只处理 `AlembicPlugin` 侧扫描、边界标注和宿主 adapter 准备；本记录不删除 Agent / AI / Tool 实现。

## 结论

AlembicPlugin 的主任务是删除内置 Agent/AI/Tool runtime，不是接入或打包 `AlembicAgent`。

本记录阶段仍不能直接删除 `AlembicPlugin/lib/agent/**`、`lib/external/ai/**` 或 `lib/tools/**`。

原因：

- 计划硬性规定 Plugin 不增加 `AlembicAgent` 依赖，不 import `@alembic/agent` 或 `@alembic/agent/ai`。
- AI provider 已在 AlembicAgent Phase 3 完成迁移与测试；Plugin 后续要删除内置 provider，并通过宿主 agent/config contract 获得能力。
- Tool system 目前仅迁入 Agent 直接依赖子集，Phase 4 尚未完成通用 tool contract/router/catalog 的 public boundary。
- Codex MCP、Skill、channel、plugin release/smoke/verify 链路仍是 Plugin 职责，不能迁到 Agent。
- 删除前还需要明确宿主 agent contract / Plugin adapter 的替代入口并通过 smoke/verify。

本轮新增可复跑扫描入口：

- `npm run report:agent-extraction-boundary`
- 脚本：`scripts/report-agent-extraction-boundary.mjs`

该脚本扫描 `lib`、`bin`、`scripts`、`test` 中的 `#agent/*`、`#external/ai/*`、`#tools/*` 引用，输出 JSON 或 Markdown，用作后续每批替换/删除前的 import 证据。

## 真实扫描摘要

命令：

```bash
npm run report:agent-extraction-boundary
```

结果：

| 指标 | 数量 |
| --- | ---: |
| sourceFilesScanned | 598 |
| filesWithBoundaryImports | 89 |
| agentImportFiles | 26 |
| agentOutsideImplementationFiles | 26 |
| agentOutsideImplementationProductionFiles | 20 |
| aiImportFiles | 5 |
| aiOutsideImplementationFiles | 5 |
| toolImportFiles | 62 |
| toolOutsideImplementationFiles | 25 |
| toolOutsideImplementationProductionFiles | 23 |

## `#agent/*` 生产调用点

这些文件是后续删除本地 `#agent/*` runtime 引用、改到宿主 agent adapter 的首批入口。当前只标注，不改 import。

| 区域 | 文件 | 后续处理 |
| --- | --- | --- |
| MCP internal rescan | `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts` | 保留 MCP workflow 外壳，删除本地 evolution run 调用，改到宿主 agent adapter。 |
| HTTP route | `lib/http/routes/ai.ts` | 保留 HTTP/API adapter，删除 AgentRunInput / AgentService / scan / translation 本地 runtime 依赖，改到宿主 agent adapter。 |
| HTTP route | `lib/http/routes/extract.ts` | 保留 HTTP adapter，extract 中 AgentService 调用改到宿主 agent adapter。 |
| HTTP route | `lib/http/routes/recipes.ts` | 保留 recipe route adapter，relation discovery 调用改到宿主 agent adapter。 |
| DI wiring | `lib/injection/modules/AgentModule.ts` | 主要删除点；后续只保留 Codex/Plugin adapter 注册，不再注册本地 AgentRuntimeBuilder / AgentService。 |
| Service | `lib/service/module/ModuleService.ts` | 保留模块扫描服务，删除 scan agent task 本地 runtime 类型和调用，改到宿主 agent adapter。 |
| Tool V2 bridge | `lib/tools/v2/capabilities/CapabilityV2.ts` | Phase 4 后随通用 Tool V2 boundary 一起切换。 |
| Host workflow completion | `lib/workflows/capabilities/completion/CompletionSteps.ts` | Phase 5 后删除本地 memory/consolidator runtime 依赖；workflow orchestration 留在 Plugin/Core contract adapter。 |
| Host workflow completion | `lib/workflows/capabilities/completion/WorkflowCompletionTypes.ts` | Phase 5 后移除本地 MemoryStore database type 依赖。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts` | Phase 5 后移除本地 memory/session/result types。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionAdmission.ts` | Phase 5 后移除本地 SessionStore type。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts` | Phase 5 后移除本地 context/memory/prompt/runtime/service 调用。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapInputBuilders.ts` | Phase 5 后移除本地 memory/runtime/service types。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts` | Phase 5 后移除本地 AgentRunResult type。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapRuntimeInitializer.ts` | Phase 5 后移除本地 MemoryCoordinator / MemoryEmbeddingStore / PersistentMemory / SessionStore。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts` | Phase 5 后移除本地 AgentRunInput / AgentRunResult types。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/DimensionRestoreState.ts` | Phase 5 后移除本地 SessionStore type。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts` | Phase 5 后移除本地 AgentService / SystemRunContextFactory types。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillSessionRunner.ts` | Phase 5 后移除本地 Agent run execution types。 |
| Internal agent workflow | `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillTypes.ts` | Phase 5 后移除本地 AgentService / SystemRunContextFactory types。 |

测试侧还有 6 个 `#agent/*` 调用文件，后续随生产入口一起切换：

- `test/unit/BootstrapDimensionAdmission.test.ts`
- `test/unit/BootstrapDimensionRuntimeBuilder.test.ts`
- `test/unit/BootstrapSessionExecutionBuilder.test.ts`
- `test/unit/InsightProducerPrompt.test.ts`
- `test/unit/ToolExecutionPipeline.test.ts`
- `test/unit/computeAnalystBudget.test.ts`

## AI Provider 边界

扫描确认 `AlembicPlugin/lib/external/ai/**` 与 `AlembicAgent/src/external/ai/**` 26 个文件完全一致。

AlembicAgent Phase 3 已完成 provider public export 和 mock provider 测试。Plugin 下一步应优先删除内置 AI provider，但不从 `AlembicAgent` import；必要能力改为宿主 agent/config adapter。

当前外部调用点：

| 文件 | 当前引用 | 后续处理 |
| --- | --- | --- |
| `lib/agent/runtime/AgentRuntime.ts` | `#external/ai/AiProvider.js`, `#external/ai/gateway/LLMGateway.js` | 随 `lib/agent/**` 删除。 |
| `lib/agent/runtime/AgentRuntimeTypes.ts` | `#external/ai/AiProvider.js`, `#external/ai/gateway/LLMGateway.js` | 随 `lib/agent/**` 删除。 |
| `lib/agent/runtime/forced-summary.ts` | `#external/ai/AiProvider.js` | 随 `lib/agent/**` 删除。 |
| `lib/agent/service/SystemRunContextFactory.ts` | `#external/ai/AiProvider.js` | 随 `lib/agent/**` 删除。 |
| `lib/external/mcp/handlers/system.ts` | `#external/ai/AiFactory.js` | 保留 MCP health handler；provider 信息读取改到宿主 config/agent adapter。 |

## Tool System 边界

`AlembicPlugin/lib/tools/**` 当前 77 个文件；`AlembicAgent/src/tools/**` Phase 2 只包含 30 个 Agent 直接依赖文件。

对比结果：

- 30 个同名文件中 22 个一致。
- 8 个同名文件已分叉：
  - `core/ToolCallContext.ts`
  - `v2/capabilities/BootstrapProduce.ts`
  - `v2/capabilities/ConversationV2.ts`
  - `v2/handlers/code.ts`
  - `v2/handlers/knowledge.ts`
  - `v2/handlers/terminal.ts`
  - `v2/registry.ts`
  - `v2/types.ts`
- Plugin 侧还有 47 个 Agent Phase 2 未迁入的 tool 文件，主要是 Dashboard/Skill/Terminal/Workflow adapter、terminal policy、v2 adapter/cache/compressor/router。

判断：

- `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/v2/**` 中的通用 contract/router/catalog 后续属于 Agent。
- `DashboardOperationAdapter`、`SkillAdapter`、terminal adapter、MCP projection、handler envelope 是否删除，必须等 Phase 4 明确 host adapter contract；目前保留在 Plugin。
- `lib/external/mcp/**` 对 tool contract/envelope 的引用属于 Codex MCP adapter，不迁到 Agent。

## Plugin 与 Agent 源码差异

与 `AlembicAgent/src/agent/**` 对比：

- Plugin `lib/agent/**`：96 个文件。
- Agent `src/agent/**`：98 个文件。
- 同名文件：96。
- 完全一致：76。
- 分叉：20。
- Agent 侧新增但 Plugin 没有：`remote.profile.ts`、`signal.profile.ts`。
- Plugin 没有独有 Agent 文件。

20 个分叉文件后续默认按删除风险处理，不迁回 Agent 主实现：

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
- `runtime/AgentRuntime.ts`
- `runtime/AgentRuntimeTypes.ts`
- `runtime/forced-summary.ts`
- `service/AgentRouter.ts`
- `service/AgentRunContracts.ts`
- `service/AgentService.ts`

如果其中有 Codex 必需差异，必须落在 Plugin adapter 或由宿主 agent contract 提供；不能把 Plugin 分叉实现迁回 `AlembicAgent`。

## 删除与宿主 Adapter 策略

Plugin 不修改 `package.json` 增加 `@alembic/agent` 依赖，不使用 `file:../AlembicAgent`，不把 Agent runtime 打包进插件。

建议后续顺序：

1. Phase 3 后优先删除 `lib/external/ai/**` provider/transport/model registry/LLM gateway；`lib/external/mcp/handlers/system.ts` 改到宿主 config/agent adapter。
2. Phase 4 后删除 `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/v2/**`、`lib/tools/workflow/**` 和通用 terminal abstraction；保留 Codex MCP schema/envelope、Skill/channel/plugin release/smoke。
3. Phase 5 后删除 memory/context/session store 等本地 Agent runtime 依赖。
4. 所有生产调用点和测试切换到宿主 adapter 后，删除 `lib/agent/**`。
5. 每批删除前后都运行扫描、build、lint、core boundary、smoke 和 verify。

## 保留清单

以下目录本阶段明确保留：

- `lib/agent/**`
- `lib/external/ai/**`
- `lib/tools/**`
- `lib/codex/**`
- `lib/external/mcp/**`
- `injectable-skills/**`
- `plugins/**`
- `channels/**`
- `.agents/**`
- Codex release / smoke / verify / sync scripts

## 后续验收门槛

每批实际替换或删除前后至少运行：

```bash
npm run report:agent-extraction-boundary
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:core-import-boundary
npm run smoke:codex-plugin
npm run verify:codex-plugin
```

如果触达 Codex session fixture 或 MCP tool behavior，还要运行：

```bash
npm run verify:codex-session
```
