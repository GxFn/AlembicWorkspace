# AlembicPlugin RFR-2A Codex Runtime Boundary Execution

创建日期：2026-05-22
执行窗口：AlembicPlugin
对应总控计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
状态：已完成，已通过总控验收

## 任务目标

在保持 Codex MCP / plugin shell / channel / runtime artifact 外部路径不变的前提下，复核 `lib/codex` runtime、status、diagnostics、preflight 的真实调用链，并将这组 Codex-facing 平铺文件迁入更清晰的内部语义目录。

## 调用链复核

- 外部入口保持 `lib/codex/index.ts` barrel：`bin/codex-mcp.ts` 与 `lib/external/mcp/CodexMcpServer.ts` 都通过 `../lib/codex/index.js` 或 `../../codex/index.js` 消费 Codex runtime/status/diagnostics/preflight 能力。
- 单元测试主要通过 barrel 入口消费：`CodexRuntimeContext.test.ts`、`CodexStatusService.test.ts`、`CodexPluginCacheSync.test.ts`、`CodexMcpServer.test.ts` 和 `CodexSessionScenarioRunner.test.ts` 覆盖 runtime context、status、plugin cache、MCP host-agent bootstrap/rescan 等闭环。
- `lib/external/mcp/**`、MCP tool schema、Skill contract、`plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/` 和 `runtime.tgz` 所在路径未移动。
- 旧 flat path 负向扫描在源码和 refreshed runtime dist 中无命中：`RuntimeContext.ts`、`StatusService.ts`、`Diagnostics.ts`、`Preflight.ts` 不再位于 `lib/codex/` 根层级。

## 完成范围

- 迁移源码：
  - `lib/codex/runtime/RuntimeContext.ts`
  - `lib/codex/status/StatusService.ts`
  - `lib/codex/diagnostics/Diagnostics.ts`
  - `lib/codex/preflight/Preflight.ts`
- 更新 `lib/codex/index.ts`，保持外部 barrel exports 可用，但指向新的内部目录。
- 更新直接依赖这些文件的内部 imports：`EnhancementRoute.ts`、`ModuleBoundary.ts`、`PluginRegistry.ts`、`ProjectRootResolver.ts`、`ToolPolicy.ts`。
- 更新 `lib/codex/README.md` 和 `test/unit/TaskPrimeKnowledgeMaterial.test.ts` 中的路径表达。
- 重新生成 Codex plugin runtime artifact，保留原 `plugins/alembic-codex/runtime/` 和 `runtime.tgz` 发布物位置。

## 提交与产物

- AlembicPlugin 提交：`6abb643e62cceed4642028b4000fc5ed518dda43`
- AlembicCodex runtime artifact 子仓库提交：`bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`fea0738ede4ad1519a9cea3225ae81badb4c766274a55c6a3b39c34ff989952a`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ f30beacedf89abab13b91e87e4686d0db38e7d29`，TypeScript no-emit 检查通过。 |
| `npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexPluginCacheSync.test.ts` | 通过；3 个文件、13 个测试通过。 |
| `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` | 通过；2 个文件、40 个测试通过。 |
| `npm run build` | 通过；重新生成 Plugin dist。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `rg -n "from './(RuntimeContext|StatusService|Diagnostics|Preflight)\\.js'|from '../(RuntimeContext|StatusService|Diagnostics|Preflight)\\.js'|lib/codex/(RuntimeContext|StatusService|Diagnostics|Preflight)\\.ts" lib test bin scripts plugins/alembic-codex/runtime/dist` | 通过；无命中。 |
| `git diff --check` | 通过。 |

## 遗留风险

- 本轮只整理 `lib/codex` 内部四个 Codex-facing 文件，不触碰 `lib/external/mcp` handler 分层；MCP 内部目录是否需要 RFR-2B 仍需总控按回填结果判断。
- runtime artifact 已刷新但尚未推送远端；如总控需要本机 Codex plugin cache 使用新 artifact，需要另开 cache refresh / install 验收步骤。
- 未创建 AlembicTest 真实项目复测单；本轮以 Plugin 内部 build、unit、runtime verify 和 channel verify 为验收口。

## 下一步建议

- 总控先验收 RFR-2A 的提交、扫描和 runtime artifact；验收通过后再决定是否启动 RFR-2B。
- 若启动 RFR-2B，建议只评估 `lib/external/mcp` handler 内部分层，不移动 MCP shell、tool schema、Skill contract 或 Codex plugin runtime 路径。

## 总控验收

- 2026-05-22：总控验收通过。复核 `AlembicPlugin` 提交 `6abb643e62cceed4642028b4000fc5ed518dda43`，确认本轮只是将 `lib/codex/Diagnostics.ts`、`Preflight.ts`、`RuntimeContext.ts`、`StatusService.ts` 移入 `diagnostics/`、`preflight/`、`runtime/`、`status/` 子目录，并更新内部 import、barrel、README、测试和 runtime artifact 指针。
- 复核结果：`lib/external/mcp/**`、MCP tool schema、Skill contract、`plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/` 和 `runtime.tgz` 所在路径未被当源码目录移动；旧 flat path 负向扫描无命中。
- 总控补充验证：`npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts` 通过，3 个测试文件 / 46 个测试；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`git -C AlembicPlugin diff --check HEAD^ HEAD` 通过。
- 功能完整性判断：外部消费仍通过 `lib/codex/index.ts` barrel 和 `lib/external/mcp/CodexMcpServer.ts`，Codex runtime/status/MCP smoke 级单元验证和 plugin/channel artifact 验证均通过，满足 RFR-2A 完成定义。
