# AlembicCore 阶段 11 完成记录：交付渠道边界固化

日期：2026-05-17

状态：Core 内部边界测试完成；本阶段不迁移 delivery 实现。

Core 提交：`031b85e Lock delivery boundary outside core`

## 范围

阶段 11 的目标不是继续复制 `lib/service/delivery/**`，而是明确交付渠道仍属于 Alembic / AlembicPlugin 外层。

Core 本阶段只新增边界测试，确保以后不会误把以下内容迁入 Core：

- Cursor / IDE delivery pipeline。
- AGENTS.md / Skills / rules 生成器。
- Codex plugin channel / marketplace / MCP transport。
- Alembic internal tool system。
- Alembic internal agent runtime。
- 通用 delivery repository 或多渠道交付抽象。

## 扫描结论

Core 当前不存在这些目录：

- `src/service/delivery`
- `src/repository/delivery`
- `src/tools`
- `src/agent`
- `src/codex`
- `src/external/mcp`
- `src/channels`
- `src/plugins`

扫描中出现的以下字段或注释属于允许保留的共享数据/兼容边界，不是交付实现：

- `deliveryReady`：Knowledge/Quality 的评分维度。
- `getCursorDeliverySpec`：历史兼容别名，实际指向宿主无关的 `getAgentAdapterFieldSpec`。
- `.cursor` / `AGENTS.md`：ProjectIntelligence 用于识别并排除 Alembic 生成物，避免自引用循环知识。
- `MCP` / `HTTP` 字样：外层 handler 调 Core 时的兼容上下文注释或日志环境判断，不是 MCP/HTTP server 实现。

## Core 变更

新增测试：

- `test/CoreDeliveryBoundary.test.ts`

该测试锁定四条边界：

- 不允许新增 delivery / tool / agent / Codex / MCP / plugin source 目录。
- 不允许 package exports 暴露 delivery / tool / agent / Codex / MCP / plugin entrypoint。
- 不允许复制典型 delivery 实现文件，例如 `CursorDeliveryPipeline.ts`、`RulesGenerator.ts`、`SkillsSyncer.ts`、`AgentInstructionsGenerator.ts`、`DeliveryRepoAdapter.ts`。
- 不允许 Core 源码 import 外层 delivery、internal agent、Codex 或 tool-system 模块。

## 验证

- `npx vitest run test/CoreDeliveryBoundary.test.ts` 通过：1 个测试文件、4 个测试。
- `npm run build:check` 通过。
- `npx biome check test/CoreDeliveryBoundary.test.ts` 通过。
- `npm run test` 通过：50 个测试文件、884 个测试。
- `npm run build` 通过。

说明：全量 `npm run test` 期间仍会打印一行既有非阻断 stderr：`error: Could not access 'HEAD'`；命令退出码为 0，测试全部通过。

## 外层接入任务

本阶段没有 Core 接入任务。外层仓库只需要继续遵守边界：

Alembic 外层：

- `cursor-rules`、`upgrade`、context injection、Rules/Skills/AGENTS 生成继续使用外层 delivery service。
- `CursorDeliveryPipeline`、`RulesGenerator`、`SkillsSyncer`、`AgentInstructionsGenerator`、`FileProtection`、`DeliveryRepoAdapter` 继续留外层。
- 若外层需要 Core 的知识结果，调用 Core knowledge/search/guard/workflow 服务，再由外层决定如何投递。

AlembicPlugin 外层：

- plugin channel、Codex marketplace、runtime tarball、MCP wrapper、skills packaging、injectable skills 同步继续留在 Plugin。
- Codex MCP tool exposure、preflight、transport、tool policy 继续留在 Plugin。

## 删除计划

- 无 Core 删除计划。
- 不删除 Alembic 外层 `lib/service/delivery/**` 或 `lib/repository/delivery/**`。
- 不删除 AlembicPlugin 的 `channels/**`、`plugins/**`、injectable skills、Codex release/smoke 脚本。

## 下一阶段提示

阶段 12 是 Tool system 不迁移。执行方式应与本阶段一致：不复制 `lib/tools/**`，只补 Core 边界测试和文档，确认 host-agent mining loop 没有通过 Alembic tool router 执行。
