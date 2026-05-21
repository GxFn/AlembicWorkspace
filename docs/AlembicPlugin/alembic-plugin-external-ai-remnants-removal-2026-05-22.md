# AlembicPlugin External AI Remnants Removal

日期：2026-05-22
窗口：`AlembicPlugin`
阶段：AIP-1
状态：已完成，待总控验收

## 完成范围

- 删除 Plugin 自有第三方 AI provider runtime 外形：移除 `lib/codex/HostAiAdapter.ts`、`lib/injection/modules/AiModule.ts`，以及 `ServiceContainer` 中的 `_aiProviderManager` / `_embedProvider` / `reloadAiProvider` 注入链路。
- 删除 Plugin AI config 状态 surface：移除 `lib/codex/AiConfigState.ts`、`CodexStatusData.aiConfig`、diagnostics / daemon health / MCP system health 对 Plugin AI config 的读取和健康项。
- 删除 MCP `alembic_codex_ai_config`：从 tool policy、tool annotations、MCP server switch / configure 写入流程、preflight 推荐、codex-session 模拟器和相关测试中移除。
- 收敛 HTTP `/ai/*`：保留 `/lang` 与 `/format-usage-guide` 这类非 provider 配置能力；provider/config/env/workspace-config/chat/agent/tool/task 等旧入口统一 `410 PLUGIN_AI_CONFIG_REMOVED` fail-closed，不再写 workspace AI env、API key 或 reload provider。
- 收敛 DI 搜索 / 向量注入：`SearchEngine` / `IndexingPipeline` / `VectorService` 不再接收 Plugin 内部 AI / embedding provider；语义增强继续由 Alembic resident service API 和 Plugin baseline search 负责。
- 更新 Skill / release playbook / runtime artifact：`plugins/alembic-codex/skills/alembic/SKILL.md` 明确 Plugin 不配置第三方 AI provider、不保存 key；embedded runtime dist 与 `runtime.tgz` 已刷新。
- 删除旧 AI config 场景和单测：移除 `HostAiAdapter.test.ts`、`WorkspaceSettingsStore.test.ts`、`ai-config/configure-deepseek-with-confirmation.json`，更新 Codex tool visibility、status、daemon job、codex-session 场景测试。

## 提交

- `AlembicPlugin`: `747b40f2abb2b9d8cb2714656fab164267d1d105` (`refactor: remove plugin ai config remnants`)
- `AlembicCodex` runtime artifact 子仓库：`01fb042afe87264ad213dfc13444dc9dc48b77ca` (`chore: remove plugin ai config runtime remnants`)

两个提交均已推送到各自 `main`。

## 验证命令与结果

- `npm run test:unit -- --run test/unit/CodexToolPolicy.test.ts test/unit/CodexMcpServer.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexEnhancementRoute.test.ts`：通过，52 tests。
- `npm run build:check`：通过。
- `npm run build`：通过，用于刷新 `dist`。
- `npm run prepare:codex-plugin-runtime`：通过，已刷新 embedded runtime 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，root publish disabled，embedded runtime 继续使用 `@alembic/core: file:vendor/AlembicCore`。
- `npm run verify:codex-session`：通过，5 tests。
- `npm run report:agent-extraction-boundary`：通过，agent / ai / tool boundary imports 均为 0。
- `git diff --check`（`AlembicPlugin` 与 `plugins/alembic-codex`）：通过。

## 负向扫描

命令：

```bash
rg -n "alembic_codex_ai_config|inspectCodexAiConfig|HostAiAdapter|HostAiProvider|_aiProviderManager|_embedProvider|reloadAiProvider|AiConfigBody|AiWorkspaceConfigBody|readHostAiConfigInfo|listHostAiProviders|createHostManagedProvider|ALEMBIC_AI_PROVIDER|ALEMBIC_EMBED_PROVIDER" lib test plugins/alembic-codex/skills README.md
```

结果：无命中。

命令：

```bash
rg -n "alembic_codex_ai_config|inspectCodexAiConfig|HostAiAdapter|HostAiProvider|_aiProviderManager|_embedProvider|reloadAiProvider|AiConfigBody|AiWorkspaceConfigBody|readHostAiConfigInfo|listHostAiProviders|createHostManagedProvider|ALEMBIC_AI_PROVIDER|ALEMBIC_EMBED_PROVIDER" plugins/alembic-codex/runtime
```

结果：仅剩 `plugins/alembic-codex/runtime/vendor/AlembicCore/dist/shared/WorkspaceSettingsStore.{js,d.ts}` 命中 `ALEMBIC_AI_PROVIDER` / `ALEMBIC_EMBED_PROVIDER`。这是 portable runtime 内必须保留的 `AlembicCore` 快照，属于 Core 自身共享配置能力，不是 Plugin-owned AI config surface；本轮按文档边界保留 `vendor/AlembicCore` 与 `.alembic-source.json`。

## 遗留风险

- `/api/v1/ai/*` 旧兼容路径仍存在为 fail-closed 入口；如果未来总控要求连兼容 route 也彻底删，需要先确认 Alembic 主体 / Dashboard / 旧客户端是否仍会请求这些路径。
- `WikiGenerator` 仍保留可注入 `aiProvider` 的单元测试形态，但当前 HTTP 创建路径不传入 provider，且 AIP-1 指定的 Plugin provider/config/tool surface 已清理。若总控后续把 wiki AI 也纳入“外部 AI 残留”范围，应另开专项扫描。
- 未创建 AlembicTest 真实项目复测单；本轮按 Plugin 内部代码、runtime artifact、codex-session 与 release boundary 自验收。

## 下一步建议

- 总控验收 AIP-1 后，将当前计划的 `AlembicPlugin` 状态从待验收改为已完成，并判断是否需要 AIP-2 `Alembic` 主体补文案或能力字段。
- 如需要真实 Codex / BiliDili 验证，再由总控创建 AlembicTest 测试单；当前不建议直接派发 BiliDili。
- 若本机 Codex plugin cache 仍指向旧 revision，需要总控或用户按既有缓存刷新流程同步到 AlembicPlugin `747b40f` / AlembicCodex `01fb042`。
