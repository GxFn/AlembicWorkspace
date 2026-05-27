# AlembicPlugin Phase 3 AI Provider 删除记录

来源计划：`docs/AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md`
执行日期：2026-05-17
范围：只处理 `AlembicPlugin` 仓库的删除任务，不操作其他仓库。

## 本批删除边界

本批对应 AlembicAgent Phase 3 后交给 Plugin 的任务：

- 不接入 `@alembic/agent`，不使用 `file:../AlembicAgent`。
- 删除 Plugin 内置 AI provider、transport、model registry、parameter guard、LLM gateway。
- 保留 Codex MCP、Skill、channel、plugin release/smoke/verify。
- Plugin 仅保留宿主 AI config/adapter 状态，不再执行 provider 网络调用。

## 删除内容

已删除：

- `lib/external/ai/**` 共 26 个实现文件。
- AI provider 专属测试：
  - `test/unit/AiProviderExtractJSON.test.ts`
  - `test/unit/LlmGatewayTransport.test.ts`
  - `test/unit/LlmRegistryAndGuard.test.ts`
  - `test/integration/LlmConnectivity.test.ts`
- 删除后清理了 `lib/external/ai` 空目录树。

## 替代入口

新增 `lib/codex/HostAiAdapter.ts`：

- 只表达宿主 AI provider/config 状态。
- 支持宿主注入真实 provider 时保持同一对象引用，并同步到 DI。
- 对配置占位 provider 不注入 `singletons.aiProvider`，避免插件继续本地执行 AI。
- `/api/v1/ai/probe` 改为返回 `host-managed`，明确 provider 连通性由宿主 agent 验证。

P4-close 阶段曾为解除删除阻塞，临时保留本地 `lib/agent/**` 的结构类型文件：

- `lib/agent/runtime/RuntimeAiTypes.ts`

该文件只提供当时尚未删除的本地 agent runtime 结构类型，不恢复 provider 实现。P6 已随 `lib/agent/**` 一并删除。

## 生产调用点改动

- `lib/injection/modules/AiModule.ts`：移除 AiFactory 动态导入和 provider 自动探测，改为宿主 provider manager。
- `lib/injection/ServiceContainer.ts`：允许 bootstrap 注入宿主 `aiProvider` / `embedProvider`。
- `lib/injection/ServiceMap.ts`：AI 类型改为 Host AI adapter。
- `lib/external/mcp/handlers/system.ts`：health AI 信息改读宿主 config。
- `lib/http/routes/ai.ts`：providers/config/probe/workspace-config 不再创建本地 provider。
- `lib/agent/context/ContextWindow.ts`：移除 ModelRegistry 查询，使用本地正则 token budget fallback。
- `lib/agent/runtime/**` 与 `SystemRunContextFactory`：移除 `#external/ai` 类型依赖。

## 验证结果

### P4-close 封存记录

封存提交：

- `48779c1 refactor: remove plugin ai provider runtime`

封存结论：

- AI provider 删除成果已经封存；`lib/external/ai/**` 不再存在。
- 当前只允许进入 `P4.5` internal bootstrap/rescan job 切断阶段。
- 仍不允许删除 `lib/agent/**`；必须等 internal job、HTTP AI/Agent 路由、candidate AI 行为、内部 tool router 全部切断后再删除。

删除路径：

- `lib/external/ai/**`
- `test/unit/AiProviderExtractJSON.test.ts`
- `test/unit/LlmGatewayTransport.test.ts`
- `test/unit/LlmRegistryAndGuard.test.ts`
- `test/integration/LlmConnectivity.test.ts`

保留路径：

- `lib/codex/**`
- `lib/external/mcp/**`
- `plugins/**`
- `channels/**`
- `injectable-skills/**`
- release / smoke / verify / cache sync 脚本链
- `lib/codex/HostAiAdapter.ts`
- `lib/injection/modules/AiModule.ts`
- `lib/agent/runtime/RuntimeAiTypes.ts`，仅作为 P4-close 阶段尚未删除 agent runtime 的结构类型过渡文件，P6 已删除

本轮封存扫描：

- `sourceFilesScanned: 570`
- `filesWithBoundaryImports: 86`
- `aiImportFiles: 0`
- `aiOutsideImplementationFiles: 0`
- `agentOutsideImplementationProductionFiles: 20`
- `toolOutsideImplementationProductionFiles: 23`

生成产物专项检查：

- `dashboard/dist` 与 `plugins/alembic-codex/runtime/dist` 不再暴露 `#external/ai`、`lib/external/ai`、`AiProviderManager`、`LLMGateway`、`ModelRegistry` 源码入口。
- `dashboard/dist` 仍存在旧 AI/Agent UI 文案，例如 AI 润色、AI 补齐、AI 扫描、AI 设置等。这些来自 `vendor/AlembicDashboard` 构建产物，不能手改 dist，后续需要通过前端插件模式适配或 Dashboard 源码收敛处理。
- `plugins/alembic-codex/runtime/dist` 仍存在 `lib/agent/**`、internal bootstrap/rescan workflow、HTTP AI/Agent route 与 candidate AI 语义。这属于 `P4.5`、`P4.6`、`P5`、`P6` 的后续切断/删除范围，不能在 P4-close 阶段直接删 dist。

通过：

```bash
npm run report:agent-extraction-boundary
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:core-import-boundary
npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts test/unit/VectorService.test.ts test/unit/SearchEngine.test.ts
npm run test:e2e -- test/e2e/FullPipeline.test.ts --testNamePattern "AI Provider hot reload"
npm run build
npm ci --prefix vendor/AlembicDashboard
npm run build:dashboard
npm run prepare:codex-plugin-runtime
npm run smoke:codex-plugin -- --no-npx-runtime
npm run verify:codex-plugin
git diff --check
```

关键扫描结果：

- `aiImportFiles: 0`
- `aiOutsideImplementationFiles: 0`

注意：

- 默认 `npm run smoke:codex-plugin` 的 npx runtime 分支超时在 MCP connect 180000ms；本地 package install + stdio smoke 使用 `--no-npx-runtime` 通过。
- 完整 `test/e2e/FullPipeline.test.ts` 第二次重跑因共享测试 DB 已存在固定标题 `E2E Test: React useState Hook` 失败；目标热重载子集已单独通过。

## 后续阶段顺序

必须按 `docs/AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md` 第 19 节顺序执行：

1. `P4.5`：切断 internal bootstrap/rescan daemon job。
2. `P4.6`：切断 HTTP AI/Agent 路由与 candidate AI 行为。
3. `P5`：删除内部 tool router，保留 MCP schema/handler。
4. `P6`：生产 `#agent/*` 归零后，才允许删除 `lib/agent/**` 和 internal-agent workflow。

P4-close 本批未删除 Codex MCP、Skill、channel、plugin release/smoke/verify，也未删除 `lib/agent/**`；后续 P6 删除记录见下节。

## P4.5-P6 删除执行记录

执行日期：2026-05-17

执行顺序按计划第 19 节完成：

1. `P4.5`：`lib/daemon/DaemonJobRunner.ts` 从 `bootstrap-internal` / `rescan-internal` 切换到 `bootstrap-external` / `rescan-external`，daemon job 只触发 host-driven workflow。
2. `P4.6`：HTTP AI/Agent 路由全部 fail closed；candidate enrich/refine 不再调用插件 provider；extract、recipes、module、wiki、vector、search 不再执行本地 LLM。
3. `P5`：删除内部 tool router 与 adapter，实现 MCP handler 直接分派；dashboard operation 从 `lib/tools/**` 迁到 `lib/http/dashboard/DashboardOperations.ts`。
4. `P6`：在生产和测试引用归零后，删除 `lib/agent/**` 与 `lib/workflows/capabilities/execution/internal-agent/**`。

本轮删除路径：

- `lib/agent/**`
- `lib/tools/**`
- `lib/workflows/capabilities/execution/internal-agent/**`
- `lib/external/mcp/handlers/bootstrap-internal.ts`
- `lib/external/mcp/handlers/rescan-internal.ts`
- `lib/external/mcp/handlers/bootstrap/InternalColdStartWorkflow.ts`
- `lib/external/mcp/handlers/rescan/InternalKnowledgeRescanWorkflow.ts`
- `lib/external/mcp/McpCapabilityProjection.ts`
- `lib/external/mcp/McpToolAdapter.ts`
- 旧 agent/tool/internal bootstrap 相关单元、集成、E2E 测试

本轮保留边界：

- `lib/external/mcp/tools.ts` 与 `handlers/*.ts`：MCP schema/handler 继续作为插件对 Codex/IDE 宿主暴露的工具面。
- `lib/codex/HostAiAdapter.ts` 与 `AiModule`：只保留 host-managed AI 配置/状态桥接，不恢复插件内 provider 网络调用。
- `lib/http/utils/sse*.ts`：只作为 HTTP stream/session 基础设施保留，不再承载本地 agent runtime。
- `dashboard/dist` 与 `plugins/alembic-codex/runtime/**`：只通过源码 build 和 `prepare:codex-plugin-runtime` 生成，不手改 dist。

专项扫描：

```bash
rg -n "#agent/|#tools/|lib/agent|lib/tools|ToolRouter|ToolRegistry|ToolForge|CapabilityCatalog|LightweightRouter|McpToolAdapter|TerminalAdapter|terminalSessionManager|internal-agent|InternalColdStartWorkflow|InternalKnowledgeRescanWorkflow|bootstrap-internal|rescan-internal|runEvolutionAudit|EvolutionAgentRun|RuntimeAiTypes|AgentRuntime" lib test package.json
```

结果：无匹配。

生成产物专项扫描：

```bash
rg -n "#agent/|#tools/|lib/agent|lib/tools|bootstrap-internal|rescan-internal|internal-agent|InternalColdStartWorkflow|InternalKnowledgeRescanWorkflow|AgentRuntime|ToolRouter|ToolForge|CapabilityCatalog|McpToolAdapter|LLMGateway|ModelRegistry" dist plugins/alembic-codex/runtime/dist
```

结果：无匹配。

边界报告：

- `sourceFilesScanned: 316`
- `filesWithBoundaryImports: 0`
- `agentImportFiles: 0`
- `agentOutsideImplementationFiles: 0`
- `agentOutsideImplementationProductionFiles: 0`
- `aiImportFiles: 0`
- `aiOutsideImplementationFiles: 0`
- `toolImportFiles: 0`
- `toolOutsideImplementationFiles: 0`
- `toolOutsideImplementationProductionFiles: 0`

通过验证：

```bash
npm run build:check
npm run lint -- --diagnostic-level=error
npm run lint:core-import-boundary
npm run report:agent-extraction-boundary
npm run build
npm run build:dashboard
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run smoke:codex-plugin -- --no-npx-runtime
```

验证结论：

- AlembicPlugin 内部 agent runtime、内部 tool router、internal bootstrap/rescan workflow 已删除。
- HTTP AI/Agent 执行面和 candidate AI 行为已改为 host-managed fail closed。
- Codex MCP、Skill、channel、plugin release/smoke/verify 保留。
- 未接入 `@alembic/agent`。
