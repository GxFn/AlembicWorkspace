# AlembicPlugin RFR-6D Batch Cleanup

日期：2026-05-22
状态：已通过总控验收
对应总控计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](../workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)

## 完成范围

- 删除旧 Dashboard HTTP compatibility operation layer：`lib/http/compatibility/operations/*`、`dashboard.*` operation dispatch、`/commands/spm-map`、`/commands/embed`、`/modules/scan-project`、`/modules/update-map`、`/modules/bootstrap`、`/modules/bootstrap/cancel`、`/modules/rescan` 和旧单元测试已移除。
- 删除旧 HTTP fail-closed compatibility surface：`lib/http/routes/ai.ts`、`lib/http/routes/recipes.ts` 以及 `HttpServer` 中 `/api/v1/ai`、`/api/v1/recipes` mount 已移除。
- 将 `lib/injection/modules/AgentModule.ts` 收敛为 `SkillHooksModule.ts`，保持 `skillHooks` service key、`SkillHooks` load 行为、MCP skill/guard hook 消费链不变。
- 新增 `test/unit/PluginHttpSurfaceBoundary.test.ts`，固定旧 HTTP surface 不再回流、`SkillHooksModule` 语义注册仍存在。
- 同步 Codex portable runtime artifact：`plugins/alembic-codex/runtime` 与 `runtime.tgz` 已刷新。

## 调用链分类

| Cluster | 分类 | 处理 |
| --- | --- | --- |
| Dashboard compatibility operations | 旧残留 / 旧 Dashboard HTTP compatibility surface | Dashboard 不再接入 Plugin，真实 Dashboard API 闭环在 Alembic daemon/API；Plugin 内无真实保留消费方，已删除。 |
| `/api/v1/ai/*` fail-closed route | 旧残留 / 旧 AI HTTP compatibility surface | 只返回旧配置/host-managed 提示，真实 AI HTTP API 不在 Plugin，已删除。 |
| `/api/v1/recipes/discover-relations` fail-closed route | 旧残留 / 旧 Agent/AI relation discovery compatibility surface | Plugin 无真实 relation discovery producer/consumer，已删除。 |
| `SkillHooks` DI 模块 | Plugin Codex 自洽闭环 | 保留功能，仅将 `AgentModule` 命名收敛为 `SkillHooksModule`。 |
| `candidates` route `HOST_AI_MANAGED` | 保留项，本波非目标 | 总控计划明确不纳入 RFR-6D，避免混入候选补齐 / 润色 UI 语义。 |

## 提交与 artifact

- AlembicPlugin 提交：`433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`
- AlembicCodex runtime artifact 子仓库提交：`c270080c8861163d13bf4b850374c9e02dd72014`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`417ba41d885171be06b74fdd167a3da5eea44640e3d772c15924f1e0f63adf92`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run test:unit -- test/integration/ServiceContainer.test.ts test/unit/KnowledgeService.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/PluginHttpSurfaceBoundary.test.ts` | 通过；unit config 实际执行 3 个 unit 文件，58 tests。 |
| `npx vitest run test/integration/ServiceContainer.test.ts` | 通过；15 tests，确认 `skillHooks` 仍可解析且无 local agent runtime services。 |
| `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` | 通过；2 个文件，40 tests。 |
| `npm run build` | 通过。 |
| `npm run prepare:codex-plugin-runtime` | 通过，已刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过。 |
| `npm run verify:codex-channel` | 通过。 |
| `rg -n "DashboardCompatibility|dashboard-compatibility|DASHBOARD_COMPATIBILITY|dashboard\\.update_module_map|dashboard\\.rebuild_semantic_index|dashboard\\.scan_project|dashboard\\.bootstrap_project|dashboard\\.cancel_bootstrap|dashboard\\.rescan_project|dashboard-operation" lib test dist plugins/alembic-codex/runtime --glob '!**/*.map'` | 无命中。 |
| `rg -n "routes/ai|aiRouter|/api/v1/ai|PLUGIN_AI_CONFIG_REMOVED|routes/recipes|recipesRouter|discover-relations" lib test dist plugins/alembic-codex/runtime --glob '!**/*.map'` | 无命中。 |
| `rg -n "AgentModule|modules/AgentModule|agentModule" lib test dist plugins/alembic-codex/runtime --glob '!**/*.map'` | 无命中。 |
| `rg -n "HOST_AI_MANAGED" lib test dist plugins/alembic-codex/runtime --glob '!**/*.map'` | 仅命中 `candidates` route 及其 runtime dist，符合本波保留边界。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

补充说明：额外尝试 `npm run lint` 仍失败于既有 Biome 债，主要命中 `lib/bootstrap.ts` 非空断言和 `lib/cli/SetupService.ts` console 使用，非 RFR-6D 改动引入，未作为本波验收门槛。

## 遗留风险

- 本轮未刷新本机 Codex plugin cache；如总控需要让当前本机 Codex 立即消费新 runtime，需要单独执行 cache refresh。
- 未创建 AlembicTest 真实项目复测单；RFR-6D 属于 Plugin HTTP surface / runtime artifact 边界清理，已用 Plugin build、targeted unit、MCP/session unit、plugin/channel verify 覆盖。
- `candidates` route 中的 `HOST_AI_MANAGED` 保留；若后续要继续收紧候选补齐 / 润色 HTTP 语义，应另开独立小波次，避免与本轮旧 Dashboard / AI / Recipe compatibility 删除混在一起。
- 仓库既有 Biome lint 债仍在，建议后续作为质量线单独处理，不应塞回 RFR-6D。

## 总控验收

- 2026-05-22：总控复核 AlembicPlugin 提交 `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`、AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`、旧 Dashboard / AI / Recipe HTTP surface 负向扫描、`AgentModule` 负向扫描、Plugin/channel verify 和 diff check 证据，RFR-6D 通过验收。
- `candidates` route 的 `HOST_AI_MANAGED` 语义与既有 Biome lint 债已回写到当前 workspace 计划 TODO，等待后续单独分析或质量线处理。

## 下一步建议

- RFR-6D 已标为完成；后续如继续目录 / 边界收敛，先由总控滚动 TODO / Backlog 并按任务包规则派发。
- 如需要本机立即使用新插件能力，由总控决定是否刷新 Codex plugin cache。
- 后续继续目录/边界收敛时，建议仍按单个真实 cluster 推进，优先从 `candidates` host-managed HTTP 语义、Dashboard HelpView / MCP surface 文案或 Core public API deep export 债中选择一个单独开波次。
