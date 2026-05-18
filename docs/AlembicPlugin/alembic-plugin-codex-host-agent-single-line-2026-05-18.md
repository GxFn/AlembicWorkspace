# AlembicPlugin Codex Host-Agent Single-Line Execution Record

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成

## 完成范围

- 将 Codex 插件默认 cold-start / rescan 推荐从 `alembic_codex_bootstrap` / `alembic_codex_rescan` internal AI daemon job 切到 `alembic_bootstrap` / `alembic_rescan` Codex host-agent workflow。
- `alembic_codex_status`、初始化后 `nextActions`、onboarding、Dashboard handoff、smoke 断言均改为推荐 host-agent bootstrap/rescan。
- 在 cold-start 阶段提前暴露 `alembic_bootstrap`、`alembic_rescan`、`alembic_submit_knowledge`、`alembic_dimension_complete`，让 Codex 能读取 Mission Briefing、提交知识并完成维度。
- 保留 `alembic_codex_bootstrap` / `alembic_codex_rescan`，但工具描述、annotation、preflight、README、skill 和测试均明确它们是显式 Alembic internal AI job，不是 Codex 默认路径。
- Preflight 仍对显式 internal AI job 要求 AI Provider；失败时优先给出 host-agent fallback action。
- 补充单测和 Codex 会话场景，覆盖无 AI Provider 时 `alembic_bootstrap` 可通过 daemon bridge 转发，不再 fail closed。
- 刷新 `plugins/alembic-codex` portable runtime artifact，保留 embedded runtime 的 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`。
- Root `prepublishOnly` 仍指向 `release:root-npm-publish:disabled`，根包保持 `private: true`；本轮未引入 npm registry 发布链路。

## 文件 / 模块变化

- `lib/codex/ToolPolicy.ts`：新增 host-agent workflow allowlist，并允许 cold-start 阶段显示 host-agent workflow tools。
- `lib/codex/StatusService.ts`：重写 post-init、knowledge gate、onboarding 和 ready 状态推荐 action。
- `lib/codex/Preflight.ts`：统一 init-on-demand allowlist，internal AI job 缺 provider 时返回 host-agent fallback。
- `lib/external/mcp/CodexMcpServer.ts`、`lib/external/mcp/tools.ts`：Dashboard follow-up 和 MCP annotations 区分 host-agent workflow 与 internal AI job。
- `README.md`、`package.json`、`plugins/alembic-codex/*`、`scripts/smoke-codex-plugin.mjs`：文案与 smoke 断言收束为 Codex-only plugin / host-agent default。
- `test/unit/*`、`test/support/codex-session/*`、`test/codex-scenarios/cold-start/*`：覆盖工具可见性、status 推荐、无 provider host-agent bootstrap 和会话流程。
- `plugins/alembic-codex/runtime*`：通过 `npm run prepare:codex-plugin-runtime` 刷新 portable runtime snapshot。

## 提交 Hash

- AlembicPlugin：`36cde99` (`feat: default codex bootstrap to host agent`)
- `plugins/alembic-codex` nested plugin artifact：`47c9b38` (`feat: align codex host-agent defaults`)

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ 9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。 |
| `npm run build` | 通过。 |
| `npm run test:unit -- test/unit/CodexToolPolicy.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts` | 通过，3 个文件 40 个测试。 |
| `npm run verify:codex-session` | 通过，6 个 Codex 会话场景；包含 `bootstrap-missing-ai-uses-host-agent` 和 `init-then-bootstrap-host-agent`。 |
| `npm run prepare:codex-plugin-runtime` | 通过，生成 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过，`./runtime.tgz -> alembic-ai@0.1.2`。 |
| `npm run verify:codex-channel` | 通过，Codex channel verification passed。 |
| `npm run smoke:codex-plugin` | 通过，install / stdio / npxRuntime passed，daemon recovery skipped。 |
| `npm run verify:release-package-boundary` | 通过；root registry publish disabled，Codex plugin artifact release true，embedded runtime core dependency 为 `file:vendor/AlembicCore`。 |
| `npm run release:root-npm-publish:disabled` | 按预期阻断 root registry publication，输出 artifact-only 发布提示。 |
| `npm run lint:core-import-boundary` | 通过，扫描 320 files 和 505 个 `@alembic/core` imports。 |
| `git diff --check` | AlembicPlugin 根仓库通过。 |
| `git -C plugins/alembic-codex diff --check` | nested plugin artifact 通过。 |
| `npm run check` | 未完全通过：`typecheck` 通过，`lint` 在既有未改文件 `lib/bootstrap.ts`、`lib/cli/SetupService.ts` 的 `noNonNullAssertion` / `noConsole` 旧债处失败；未继续到脚本内的 `lint:core-import-boundary`，已单独运行通过。 |

## 残留扫描结果

执行：

```text
rg -n "alembic_codex_bootstrap|alembic_codex_rescan|AI Provider|internal bootstrap|internal rescan" lib plugins test README.md channels
```

结果：120 行命中。

分类：

- 源码 / 测试 / 文档非 runtime 命中 72 行，集中在以下允许范围：
  - `ToolPolicy`、`Preflight`、`CodexMcpServer`、`tools` 中显式 internal AI job 定义、preflight 和 dispatch。
  - `StatusService`、README、skill 中说明 host-agent path 不需要 AI Provider。
  - 单测、JobStore / KnowledgeState 兼容测试和会话测试中验证显式 internal job 与 host-agent default 的边界。
  - `AgentSimulator` 的 AI config 场景仍保留用户明确配置 provider 时的确认流程。
- runtime 命中 48 行，来自 `plugins/alembic-codex/runtime` 的同步产物与 embedded Core / Dashboard 静态资源：
  - `runtime/dist/lib/codex/**` 和 `runtime/plugins/alembic-codex/**` 与源码一致。
  - `runtime/vendor/AlembicCore/**` 保留 Core 自身 AI Provider 文档和 vector/search 注释。
  - `runtime/dashboard/dist/**` 仍有 Dashboard 生成产物内的 `AI` / host-managed 文案；此处属于 Dashboard 静态产物同步范围，不是 Plugin agent default 推荐。

结论：未发现 `alembic_codex_status` / onboarding / skill / README 默认推荐 internal AI job 的残留；剩余命中均为显式 internal AI job、AI config、测试断言或 portable runtime 产物说明。

## 遗留风险

- `npm run check` 仍被既有 lint 旧债阻断；本轮未修改 `lib/bootstrap.ts` / `lib/cli/SetupService.ts`，未扩大范围修复。
- `plugins/alembic-codex/runtime/dashboard/dist/**` 中 Dashboard 生成产物仍可能包含 Dashboard 侧历史措辞，需等待 Dashboard 发布产物同步策略统一后复核。
- `plugins/alembic-codex` portable runtime 通过准备脚本同步了当前 `../AlembicCore` snapshot；这是 artifact 变化，不是修改 Core 源仓库。

## 下一步建议

- 总控在 Alembic 主包完成删除多 IDE Agent 支持路径后，复核 Plugin README / skill 与 Alembic internal AI CLI 命名是否一致。
- 若后续希望进一步降低误读，可把 `alembic_codex_bootstrap` / `alembic_codex_rescan` 从默认工具列表降为更窄的显式 internal AI 工具入口，但本轮先保留兼容。
- Dashboard 窗口完成产物发布后，再决定是否刷新 Plugin runtime 内的 Dashboard dist。
