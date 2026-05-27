# Alembic Local Agent Tool Implementation Deletion

日期：2026-05-17
状态：已完成，待总控验收
提交：`6abf1321b39b31a4a33c59b4d357d7f1e191cf39`

本文记录 Alembic 在 Wave 4 中删除本地重复 Agent implementation 与 generic Tool V2 implementation 的结果。本轮只处理 Alembic 仓库内容；AlembicAgent 继续作为 Agent/runtime/tool generic implementation 的唯一维护仓库。

## 完成范围

- 删除 `lib/agent/**` 本地 duplicate implementation，不再保留本地 Agent runtime、memory、context、service、runtime、prompts、domain、forge、tasks、profiles、policies、strategies、capabilities、runs 等实现树。
- 删除 local generic Tool V2 implementation：`lib/tools/v2/cache/**`、`lib/tools/v2/capabilities/**`、`lib/tools/v2/compressor/**`、`lib/tools/v2/handlers/**`、`lib/tools/v2/index.ts`、`lib/tools/v2/registry.ts`、`lib/tools/v2/router.ts`、`lib/tools/v2/types.ts`、`V2CapabilityCatalog`、`V2ToolRouterAdapter` 和 adapter barrel。
- 删除 `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/workflow/**` 中已由 `@alembic/agent/tools` / `@alembic/agent/tools/v2` 覆盖的 generic duplicate。
- 保留 Alembic host-owned bridge：`lib/tools/v2/adapter/ToolContextFactory.ts`、`lib/tools/adapters/**`、CLI、daemon、HTTP/API、Dashboard/native/IDE/Lark/product shell、DI/repository/search/gateway/projectRoot/dataRoot/sandbox wiring。
- 移除 `package.json` 的 `#agent/*` imports alias，测试侧改为消费 `@alembic/agent/*` public subpaths 或删除纯 Agent implementation coverage。
- 更新 `scripts/lint-agent-extraction-boundary.mjs` 和 `config/agent-extraction-boundary.json`，把 Wave 4 删除结果设为硬 gate：本地 Agent 文件 0、生产 `#agent` 调用 0、generic Tool V2 duplicate 0、tool core/catalog/workflow duplicate 0。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；`product #agent call sites: 0`，`local Agent relative import files: 0`，`local Agent relative imports: 0`，`preserved local Agent files: 0`，`duplicate generic Tool V2 files: 0`，`duplicate generic tool core/catalog/workflow files: 0`。 |
| `npm run build:check` | 通过。 |
| `npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentService.test.ts test/unit/AgentRuntime.test.ts test/unit/MemorySystem.test.ts` | 通过；7 个 test files，177 个 tests。 |
| `npm run check` | 通过；仍有既有 Biome warnings，未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace 检测成功，当前测试环境 database not found。 |
| `rg -n "#agent/\|\.\./agent/\|\.\./\.\./agent/\|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'` | 通过；无匹配。 |
| `find lib/agent -type f` | 通过删除证据；`lib/agent` 已不存在。 |
| `find lib/tools/v2 -type f \| sort` | 通过；只剩 `lib/tools/v2/adapter/ToolContextFactory.ts`。 |
| `npm run test:unit` | 已尝试；受当前 sandbox 环境阻塞，`SandboxNetworkProxy.test.ts` 因 `listen EPERM 127.0.0.1` 失败，`TerminalAdapter.test.ts` 因 `sandbox-exec sandbox_apply Operation not permitted` 失败；Wave 4 targeted suites 已通过。 |

## 遗留风险

- `ToolContextFactory` 仍保留在 Alembic，因为它组合 Alembic 宿主容器服务、repositories、search/gateway、projectRoot/dataRoot、sandbox execution 与 runtime request context；后续不要把它误判为 generic Tool V2 duplicate。
- 以后 Alembic host code 若需要 Agent capabilities / policies / strategies 等更深 public contract，应该在 AlembicAgent 增加 export/type/test，而不是恢复本地 duplicate 文件。
- 完整 `npm run test:unit` 当前受本机 sandbox 权限限制，需在允许 loopback listen 与 `sandbox-exec` 的环境中复跑。

## 下一步建议

- 总控复验 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39` 的删除清单与 validation 输出。
- 下游窗口如需复验，只做消费 smoke/API contract 检查，不恢复 Alembic 本地 Agent/tool duplicate implementation。
- 后续边界巡检继续以 `npm run lint:agent-extraction-boundary` 作为硬门禁，防止 `#agent/*`、本地 `lib/agent/**` 或 generic Tool V2 duplicate 回流。
