# Alembic Plugin First Enhancement Wave 1 Core Source Contract

日期：2026-05-18
窗口：AlembicCore
状态：已完成

## 完成范围

- 新增 `src/shared/source-contracts.ts`，集中定义 Core 可公开消费的 source contract、normalizer、display label helper 和兼容判断 helper。
- 新 canonical source：
  - `host-agent`：Codex / 外部宿主 Agent 提交的知识或进化建议。
  - `alembic-agent`：AlembicAgent / Alembic internal AI runtime 提交的知识或进化建议。
  - `host-edit`：宿主编辑事件汇总来源。
- 兼容 source：
  - `ide-agent`：旧外部 Agent / 旧 DB source，读取兼容；新写入归一为 `host-agent`。
  - `ide-edit`：旧编辑事件 source，读取兼容；新语义归一为 `host-edit`。
- `ProposalRepository.create()` 新写入通过 `normalizeProposalSource()` 归一；`find({ source: 'host-agent' })` 同时覆盖旧 `ide-agent` 历史行，保证旧数据可查。
- `RecipeProductionGateway` 改用 Core source helper 生成 user/source label；`ide-agent` 归一为 `host-agent`，`alembic-agent` 保持为内部 Agent source。
- `FileChangeEventSource` 改由共享 contract 导出，注释改为宿主编辑事件 / daemon 汇总语义。
- 清理 Core 注释中不必要的 VSCode 命名；保留 PathGuard 对外层交付目录不得偷渡进 Core 的中性说明。
- 修正 consumer import boundary 根扫描的两个误命中：源码注释改用稳定 facade 示例；测试 fixture 改成动态拼接，避免扫描器把测试字符串当真实 Core import。

## Public Export 变化

- `@alembic/core/shared` 新增导出：
  - `HOST_AGENT_SOURCE`
  - `ALEMBIC_AGENT_SOURCE`
  - `HOST_EDIT_SOURCE`
  - `LEGACY_IDE_AGENT_SOURCE`
  - `LEGACY_IDE_EDIT_SOURCE`
  - `normalizeProposalSource`
  - `proposalSourceStorageValues`
  - `normalizeGatewaySource`
  - `getGatewaySourceUserId`
  - `getGatewaySourceLabel`
  - `normalizeFileChangeEventSource`
  - `getFileChangeEventSourceLabel`
- `@alembic/core/repositories` 新增导出：
  - `normalizeProposalSource`
  - `getProposalSourceLabel`
  - `proposalSourceStorageValues`
- `@alembic/core/knowledge` 新增导出：
  - `normalizeGatewaySource`
  - `getGatewaySourceUserId`
  - `getGatewaySourceLabel`
- `@alembic/core/types` 新增导出：
  - `normalizeFileChangeEventSource`

## 提交

- AlembicCore commit：`c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`

## 验证命令与结果

- `npm run lint`：通过，417 files checked。
- `npm run build:check`：通过。
- `npm run test -- test/SourceContracts.test.ts test/ProposalRepository.test.ts test/unit/production-gateway.test.ts`：通过，3 files / 55 tests。
- `npm run test -- test/PublicConsumerCoreImportBoundary.test.ts test/SourceContracts.test.ts test/ProposalRepository.test.ts test/unit/production-gateway.test.ts`：通过，4 files / 59 tests。
- `npm run lint:consumer-core-imports`：通过，scanned 422 files and 3 `@alembic/core` imports。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，Imported 75 exact public API entrypoints。
- `npm run lint:public-api-boundary`：通过，136 package exports classified；stable=17 / provisional=21 / transitional=98。
- `git diff --check`：通过。
- `npm run check`：通过，61 files / 923 tests；Vitest 仍打印既有 `Could not access 'HEAD'` stderr，但命令退出码为 0。
- `rg -n "VSCode|VS Code|ide-agent|ide-edit|alembic-agent" src --glob '!**/dist/**'`：无 `VSCode` / `VS Code` 命中；剩余命中为 `alembic-agent` canonical source 与 `ide-agent` / `ide-edit` 兼容常量、兼容注释。
- `rg -n "VSCode|VS Code|Extension|ide-agent|ide-edit" src --glob '!**/dist/**'`：剩余 `Extension` 命中均为语言特性 / AST / Guard 规则语义，非旧 IDE delivery 语义；旧 source 命中仅为兼容常量和兼容说明。

## 遗留风险

- 消费层仍需切换：`AlembicPlugin` 外部宿主路径应使用 `host-agent`；`AlembicAgent` 内部 AI runtime 应使用 `alembic-agent`；`AlembicDashboard` 需要更新类型与显示标签。
- Core 为兼容历史 DB 和旧调用方继续保留 `ide-agent` / `ide-edit`，这些值不应作为新写入默认值。
- Core `dist/` 未提交；发布或 runtime snapshot 仍应由对应发布流程生成。

## 下一步建议

- `AlembicPlugin`：读取 Core helper，外部 MCP / Codex host 写入切到 `host-agent`；新增本地 Alembic daemon enhancement probe / route choice。
- `AlembicAgent`：Tool V2 knowledge / evolution 默认 source 切到 `alembic-agent`，不要使用 `host-agent`。
- `AlembicDashboard`：source 类型和 label 同时支持 `host-agent`、`alembic-agent` 和旧兼容值；旧值显示为兼容来源，不作为主路线。
- 总控：Wave 1A 的 `AlembicCore` 与 `Alembic` 均已回填后，可以启动 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 的 Wave 1B 任务。
