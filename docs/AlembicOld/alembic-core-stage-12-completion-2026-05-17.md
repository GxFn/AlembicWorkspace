# AlembicCore 阶段 12 完成记录：Tool system 边界固化

日期：2026-05-17

状态：Core 内部边界测试完成；本阶段不迁移 `lib/tools/**`。

Core 提交：`f8b5f7b Lock tool system outside core`

## 范围

阶段 12 的目标是明确 Alembic 自身 tool system 不进入 Core。Core 不提供 tool catalog、tool router、tool handlers、terminal/mac/dashboard/skill adapters，也不提供 tool output compressor 或 terminal policy。

Core 本阶段只新增边界测试，确保以后不会误把以下内容迁入 Core：

- `lib/tools/core/**`
- `lib/tools/catalog/**`
- `lib/tools/v2/**`
- `lib/tools/adapters/**`
- terminal policy / terminal capability adapters
- Alembic tool router / registry / handler
- tool output compressor / cache

## 扫描结论

Core 当前不存在这些目录：

- `src/tools`
- `src/tool`
- `src/tool-system`
- `src/service/tools`
- `src/service/tool`
- `src/infrastructure/tools`
- `src/repository/tools`

扫描中出现的以下内容属于允许保留的宿主协议或兼容提示，不是 Alembic tool system：

- `BootstrapTerminalToolset.ts`：只生成 host-agent briefing 中的终端工具能力提示，不实现 terminal adapter、policy 或 executor。
- `MiningSessionStore` 中的 `toolName` / `toolCallSummary`：只缓存宿主 agent 的只读 `code.search` / `code.read` 结果，不调用 Alembic tool router。
- `ColdStartPlan` / `KnowledgeRescanWorkflowPlan` 中的 `tool: 'alembic_bootstrap'` / `tool: 'alembic_rescan'`：外层 transport envelope 元数据，不是 Core tool system。

## Core 变更

新增测试：

- `test/CoreToolSystemBoundary.test.ts`

该测试锁定五条边界：

- 不允许新增 Alembic tool-system source 目录。
- 不允许 package exports 暴露 tool-system entrypoint。
- 不允许复制典型 tool-system 实现文件，例如 `UnifiedToolCatalog.ts`、`InternalToolHandler.ts`、`ToolContracts.ts`、`V2ToolRouterAdapter.ts`、`OutputCompressor.ts`、`TerminalAdapter.ts`。
- 不允许 Core 源码 import `#tools`、`lib/tools` 或 `/tools/` 模块。
- host-agent workflow 不能引用 `InternalToolHandler`、`ToolCallContext`、`ToolRoutingServices`、`UnifiedToolCatalog`、`V2ToolRouterAdapter` 等 tool router 类。

## 验证

- `npx vitest run test/CoreToolSystemBoundary.test.ts` 通过：1 个测试文件、5 个测试。
- `npm run build:check` 通过。
- `npx biome check test/CoreToolSystemBoundary.test.ts` 通过。
- `npm run test` 通过：51 个测试文件、889 个测试。
- `npm run build` 通过。

说明：全量 `npm run test` 期间仍会打印一行既有非阻断 stderr：`error: Could not access 'HEAD'`；命令退出码为 0，测试全部通过。

## 外层接入任务

本阶段没有 Core 接入任务。外层仓库只需要继续遵守边界：

Alembic 外层：

- MCP/tool handlers 继续使用外层 `lib/tools/**`。
- terminal/mac/dashboard/skill adapters、terminal policy、tool output compressor、tool cache 继续留在 Alembic。
- 若外层 tool handler 需要 Core 能力，外层显式调用 Core service，而不是把 tool router 下沉到 Core。

AlembicPlugin 外层：

- Codex MCP tools 继续由 Plugin 暴露和治理。
- Codex tool policy、preflight、transport、tool metadata 继续留在 Plugin。

## 删除计划

- 无 Core 删除计划。
- 不删除 Alembic / AlembicPlugin 外层 `lib/tools/**`。
- 不迁移 `V2ToolSystem.test.ts`、`ToolExecutionPipeline.test.ts`、`ToolForgeIntegration.test.ts`、`ToolRequirementAnalyzer.test.ts`、`TemporaryToolRegistry.test.ts`、`v2/ToolRegistryV2.test.ts` 到 Core。

## 下一阶段提示

阶段 13 是 Codex 边界留在 Plugin。执行方式应继续以扫描、边界测试和文档为主：不复制 `AlembicPlugin/lib/codex/**`、`CodexMcpServer.ts`、MCP tool metadata、channel/plugin 发布资产。
