# AlembicPlugin RFR-2B Codex MCP Helper Boundary Execution

创建日期：2026-05-22
执行窗口：AlembicPlugin
对应总控计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
状态：已完成，已通过总控验收

## 任务目标

在保持 `lib/external/mcp/CodexMcpServer.ts`、MCP tool schema、Skill contract、Codex plugin shell、channel 和 runtime artifact 外部路径不变的前提下，复核 `CodexMcpServer.ts` 内部 helper 调用链，并只抽取已有真实调用方的 helper 到 `lib/external/mcp/codex/` 内部支持目录。

## 调用链复核

- `bin/codex-mcp.ts`、`test/support/codex-session/McpHarness.ts`、`test/unit/CodexMcpServer.test.ts` 仍通过 `lib/external/mcp/CodexMcpServer.ts` 消费 `CodexMcpServer`、`getVisibleCodexTools` 和 `startCodexMcpServer`。
- `CodexMcpServer.ts` 仍是 MCP server orchestration / tool dispatch 入口，保留 `ListToolsRequestSchema`、`CallToolRequestSchema` 注册、workspace init、daemon start/stop/cleanup、Plugin-owned tool dispatch。
- `getVisibleCodexTools` 的 tool visibility / projectRoot input helper 有真实 list-tools、session harness 和 unit test 消费。
- `failureResult`、`isErrorResult`、result attachment helper 同时服务 tool-call response、daemon job fallback、Plugin-owned service boundary 和 host handoff block。
- daemon job HTTP helper 和 query builder 同时服务 `alembic_codex_bootstrap`、`alembic_codex_rescan` 和 `alembic_codex_job` 的 daemon-first / local JobStore fallback。
- host project handoff block 同时服务 Dashboard handoff 和 jobs enhancement daemon guard。

## 完成范围

- 新增内部支持目录 `lib/external/mcp/codex/`：
  - `tool-visibility.ts`：`getVisibleCodexTools`、tool annotations、projectRoot input schema helper。
  - `results.ts`：MCP failure envelope、error result 判定、enhancement route / service boundary attachment。
  - `daemon-jobs.ts`：daemon jobs HTTP call、JSON response parsing、job query builder。
  - `host-project-handoff.ts`：Codex host project 与 Alembic runtime project handoff block。
  - `project-root.ts`：stale cwd 安全 fallback。
- `CodexMcpServer.ts` 改为导入这些内部 helper，并继续 re-export `getVisibleCodexTools`；保留 `CodexMcpServer`、`startCodexMcpServer` 和 default export。
- 未移动 `CodexMcpServer.ts`、`McpServer.ts`、`tools.ts`、`plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/` 或 `runtime.tgz` 所在路径。
- 重新生成 Codex plugin runtime artifact，保留原 `plugins/alembic-codex/runtime/` 与 `runtime.tgz` 发布物位置。

## 提交与产物

- AlembicPlugin 提交：`7afd689dc1654611b7f9de742aa170a3a9de7fa3`
- AlembicCodex runtime artifact 子仓库提交：`b47d44a8558570cef2a2195c9b0b7eb13d020d95`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ f30beacedf89abab13b91e87e4686d0db38e7d29`，TypeScript no-emit 检查通过。 |
| `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` | 通过；2 个文件、40 个测试通过。 |
| `npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts` | 通过；2 个文件、11 个测试通过。 |
| `npm run build` | 通过；重新生成 Plugin dist。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `rg -n "from './(CodexMcpServer\|McpServer\|tools)\\.js'\|from '../(CodexMcpServer\|McpServer\|tools)\\.js'" lib/external/mcp test bin scripts` | 完成；命中均为保留的 MCP server / embedded server / tool schema 内部关系：`CodexMcpServer.ts`、`McpServer.ts` 和 `codex/tool-visibility.ts` 对 `tools.js` / `McpServer.js` 的必要导入。 |
| `rg -n "function (failureResult\|isErrorResult\|callDaemonHttpEndpoint\|buildJobQuery\|buildCodexHostProjectHandoffBlock\|buildExplicitProjectRootRequiredKnowledgeState\|withCodexProjectRootInput\|safeProjectRootFallback)\|export function getVisibleCodexTools" lib/external/mcp/CodexMcpServer.ts lib/external/mcp/codex` | 完成；helper 定义只保留在 `lib/external/mcp/codex/`，`CodexMcpServer.ts` 不再内联这些 helper。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## 遗留风险

- 本轮只抽取 `CodexMcpServer.ts` 中已有真实 helper，不移动 MCP server 入口文件、不修改 tool schema、不调整 Skill 文案；如果后续要整理 handler 分层，需要另开更窄 RFR 波次。
- runtime artifact 已刷新但尚未推送远端；如总控需要本机 Codex plugin cache 使用新 artifact，需要另开 cache refresh / install 验收步骤。
- 未创建 AlembicTest 真实项目复测单；本轮以 Plugin 内部 build、unit、runtime verify 和 channel verify 为验收口。

## 下一步建议

- 总控先验收 RFR-2B 的提交、扫描和 runtime artifact；验收通过后再决定是否启动 RFR-3 Alembic 主仓库窄波次。
- 若继续整理 Plugin MCP，建议不要再扩大到 tool schema 或 handler 行为重写，只在真实调用链证明需要时拆一个 bounded helper 区块。

## 总控验收

- 2026-05-22：总控验收通过。复核 `AlembicPlugin` 提交 `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，确认本轮新增 `lib/external/mcp/codex/` 内部支持目录，只抽取 `CodexMcpServer.ts` 里已有真实调用方的 tool visibility、result envelope、daemon job、host handoff 和 project root fallback helper。
- 复核结果：`CodexMcpServer.ts` 入口文件仍保留，继续导出 `CodexMcpServer`、`getVisibleCodexTools`、`startCodexMcpServer` 和 default export；`McpServer.ts`、`tools.ts`、MCP tool schema、Skill contract、plugin shell、channel、vendor 和 runtime artifact 所在路径未被移动。
- 总控补充验证：`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` 通过，2 个测试文件 / 40 个测试；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`git -C AlembicPlugin diff --check HEAD^ HEAD` 通过。
- 功能完整性判断：MCP list/call tool、projectRoot override、Codex host-agent bootstrap、Codex session scenario 与 plugin/channel artifact verify 均被覆盖；本轮满足 RFR-2B 完成定义。
