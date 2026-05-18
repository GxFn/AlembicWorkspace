# AlembicCore 阶段 13 完成记录：Codex 边界固化

日期：2026-05-17

状态：Core 内部边界测试完成；本阶段不迁移 `AlembicPlugin/lib/codex/**`、Codex MCP server 或 MCP tool metadata。

Core 提交：`be15964 Lock Codex boundary outside core`

## 范围

阶段 13 的目标是明确 Codex runtime、preflight、tool policy、MCP tool metadata、plugin/channel/marketplace 发布资产全部留在 AlembicPlugin。Core 不实现 Codex host 边界，也不实现 Codex tool exposure。

Core 本阶段只新增边界测试，防止以后误把以下内容迁入 Core：

- `AlembicPlugin/lib/codex/**` runtime、diagnostics、project root resolver、preflight、tool policy。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 和 MCP adapter/server 实现。
- `channels/**`、`plugins/alembic-codex/**`、`scripts/*codex*` 等插件交付资产。
- `@modelcontextprotocol/sdk`、`alembic-codex` 等 Codex/MCP runtime dependency。

## 扫描结论

Core 当前没有以下目录：

- `src/codex`
- `src/service/codex`
- `src/infrastructure/codex`
- `src/external/mcp`
- `src/mcp`
- `src/plugin`
- `src/plugins`
- `src/channels`
- `src/marketplace`

扫描中出现的以下内容属于允许保留的宿主无关元数据，不是 Codex runtime：

- `JobStore` 里的 `source`、`actor`、`channelId`、`client`、`sessionId`：用于记录任务来源和宿主上下文。
- workflow / service 注释中的 `MCP`、`codex` 字样：只描述外层调用场景或兼容来源，不提供 MCP server。
- `Snippet` comment target 中的 `codex` 字段：属于知识投递目标元数据，不是 Codex adapter。

## Core 变更

新增测试：

- `test/CoreCodexBoundary.test.ts`

该测试锁定六条边界：

- 不允许新增 Codex、MCP、plugin、channel、marketplace source 目录。
- 不允许 package exports 暴露 Codex/MCP/plugin/channel/marketplace entrypoint。
- 不允许依赖 Codex 或 MCP runtime 包。
- 不允许复制典型 Codex runtime / MCP implementation 文件，例如 `RuntimeContext.ts`、`ProjectRootResolver.ts`、`Preflight.ts`、`ToolPolicy.ts`、`CodexMcpServer.ts`、`McpToolAdapter.ts`。
- 不允许 Core 源码 import `lib/codex`、`external/mcp`、`@modelcontextprotocol` 或 `alembic-codex`。
- host-agent workflow 不能引用 Codex runtime、preflight 或 MCP adapter 类。

## 验证

- `npx vitest run test/CoreCodexBoundary.test.ts` 通过：1 个测试文件、6 个测试。
- `npx biome check test/CoreCodexBoundary.test.ts` 通过。
- `npm run build:check` 通过。
- `npm run test` 通过：52 个测试文件、895 个测试。
- `npm run build` 通过。

说明：全量 `npm run test` 期间仍会打印一行既有非阻断 stderr：`error: Could not access 'HEAD'`；命令退出码为 0，测试全部通过。

## 外层接入任务

AlembicPlugin 外层：

- Codex MCP server 继续保留在 Plugin，只把底层 workspace/domain/storage/search/guard/host-agent mining loop 调用切到 Core。
- `Preflight`、`ToolPolicy`、MCP tool metadata、plugin registry、runtime diagnostics 继续留在 Plugin。
- `KnowledgeState` 若只是读取 Core 已拥有的数据，应改为调用 Core service；不要把 `KnowledgeState.ts` 搬进 Core。
- Codex session/plugin smoke 继续在 Plugin 执行，用于证明接入 Core 后 Codex 外层行为没有回退。

Alembic 外层：

- 若 Alembic 本体仍保留 Codex CLI 辅助命令或 MCP shim，它们继续作为外层 adapter 存在。
- Alembic 不从 Core 引入 Codex runtime/preflight/tool metadata 契约。

## 删除计划

- 无 Core 删除计划。
- 不删除 AlembicPlugin 的 Codex MCP/server/runtime/channel/plugin 发布链路。
- 不迁移 `CodexKnowledgeState.test.ts`、`CodexToolPolicy.test.ts`、`CodexStatusService.test.ts`、`CodexMcpServer.test.ts` 到 Core。

## 下一阶段提示

阶段 14 是外层接入、边界收敛与删除。当前窗口继续只负责 Core 与文档；Alembic / AlembicPlugin 的 import 替换、外层测试、删除执行交给其他窗口按手册推进。
