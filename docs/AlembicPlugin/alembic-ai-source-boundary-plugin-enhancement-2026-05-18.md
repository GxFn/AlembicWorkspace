# AlembicPlugin AI Source Boundary Plugin Enhancement

日期：2026-05-18
窗口：AlembicPlugin
状态：待验收
总控计划：`docs/workspace/alembic-ai-source-boundary-plugin-enhancement-workspace-plan-2026-05-18.md`

## 完成范围

- 新增 `lib/codex/SourceBoundary.ts`，消费 `@alembic/core/shared` 的 `HOST_AGENT_SOURCE` / legacy source contract，将外部宿主旧默认值 `mcp`、`mcp-external`、`cursor-scan`、`ide-agent` 归一为 `host-agent`。
- `alembic_submit_knowledge`、legacy knowledge handler、`alembic_evolve`、dimension complete 的新写入 source / verifiedBy / progress event 统一切到 `host-agent`；旧 `ide-agent` / `ide-edit` 不再作为 Plugin 新写入值出现。
- 新增 `lib/codex/EnhancementRoute.ts`，输出统一 route choice：`local-alembic-daemon`、`embedded-plugin-runtime`、`local-alembic-install`、`unavailable`，并同时返回 host-agent route、local Alembic daemon/install probe、embedded runtime 和 internal AI provider config。
- `alembic_codex_status`、`alembic_codex_diagnostics`、onboarding notes 增加 `enhancementRoute`，明确区分：
  - Codex host-agent route：写入 source=`host-agent`，不需要 Alembic AI Provider。
  - local Alembic enhancement route：本地 Alembic daemon / install / embedded plugin runtime 的选择和原因。
  - internal AI provider config：`provider`、`model`、`configSource`、`available`，不作为 knowledge source。
- `alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 和 daemon bridge 返回 `enhancementRoute`；可用 daemon 通过 `DaemonSupervisor.ensure()` 优先复用，本地 Alembic daemon 版本允许与 Plugin package version 不同但必须与 daemon state identity 匹配。
- Plugin embedded daemon health 新增 `enhancement.route = embedded-plugin-runtime` 和 `capabilities.api/dashboard/jobs/internalAi`，供 resolver 与外部总控判定。
- 刷新 `plugins/alembic-codex` portable runtime artifact，保留 `runtime/vendor/AlembicCore`、`runtime/vendor/AlembicCore/.alembic-source.json` 和 `runtime.tgz`，未引入 `@alembic/agent`，未恢复 npm registry publish 链路。

## Route Choice Shape

`enhancementRoute` 结构包含：

- `selected`：`local-alembic-daemon` / `embedded-plugin-runtime` / `local-alembic-install` / `unavailable`。
- `requirement`：`status` / `dashboard` / `jobs` / `mcp`。
- `reason` 与 `missingCapabilities`：解释选择原因和缺失能力。
- `hostAgentRoute`：`source: host-agent`，tools 为 `alembic_bootstrap`、`alembic_rescan`、`alembic_submit_knowledge`、`alembic_dimension_complete`，`requiresAiProvider: false`。
- `internalAiProvider`：只表达 provider 配置状态，不参与 source 判定。
- `localAlembic.daemon` / `localAlembic.install` / `embeddedRuntime`：分别描述本地 daemon、本地 CLI install、embedded portable runtime。

## 降级策略

- status / diagnostics 不启动 daemon，只读取当前 daemon state / health 并探测本地 Alembic CLI install；如果只有 CLI install 且无 daemon API，状态显示 `local-alembic-install`，实际 job/dashboard 工具仍按需启动 embedded runtime。
- dashboard / jobs / mcp 工具先通过 `DaemonSupervisor.ensure()` 复用已可用 daemon；本地 Alembic daemon health 若提供 `enhancement.route = local-alembic`，即标记为 local enhancement route。
- 缺失 dashboard / jobs / mcp capability 时写入 `missingCapabilities`，工具返回中携带 route choice，便于 Codex / Dashboard / 总控判断，不把 provider config fallback 成 `host-agent`。

## 提交 Hash

- AlembicPlugin：`3a82f2c9e29e2cfe4e6b3fad87cfc83c29a1b223`
- Codex plugin runtime artifact：`344e7c54362df287a1378a5da1f4d8b694fdee71`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run test:unit -- test/unit/CodexEnhancementRoute.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts test/unit/KnowledgeAPI.test.ts test/unit/ExternalDimensionCompletionWorkflow.test.ts test/unit/ProposalRepository.test.ts test/unit/EvolutionGateway.test.ts test/unit/ConsolidatedProposal.test.ts test/unit/ProposalExecutor.test.ts`：通过，9 个测试文件、152 个测试通过。
- `npm run lint:core-import-boundary`：通过，扫描 323 个文件和 507 个 `@alembic/core` imports。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed。
- `git diff --check`：通过。
- `git diff --check HEAD~1..HEAD`：通过。
- `git -C plugins/alembic-codex diff --check HEAD~1..HEAD`：通过。
- `rg -n "ide-agent|ide-edit" lib skills README.md test --glob '!**/dist/**'`：无命中。
- `rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider" lib skills README.md test --glob '!**/dist/**'`：通过；剩余命中为 host-agent route 文案、Core `host-agent-workflows` public import、internal AI provider 配置字段和相关测试断言。

额外验证：

- `npm run lint`：未通过；失败点为既有 `lib/bootstrap.ts` 非空断言与 `lib/cli/SetupService.ts` console 规则，非本轮改动文件，本轮未顺手修改无关 lint 债。

## 遗留风险

- `aiProvider` 仍作为 Plugin 内部 provider manager / embedding / HTTP AI route 的配置字段残留；本轮只完成 source/provider/route choice 边界，没有删除这些仍被当前运行时引用的配置层。
- `@alembic/core/host-agent-workflows` public import path 仍会在扫描中出现；这是 Core 暴露给 Codex host-agent workflow 的 public subpath，不是本地 Agent runtime 或 provider fallback。
- 本地 Alembic CLI install probe 通过 `alembic daemon --help` 识别产品 CLI，避免误把 Python Alembic 当作增强底座；若未来 CLI 名称或 daemon 子命令变化，需要同步 resolver。

## 下一步建议

- 总控复核 `enhancementRoute` 在 Dashboard / Codex 使用侧的显示方式，确认 Dashboard 不重新定义 route policy。
- 若后续 Alembic daemon capability 字段新增 MCP bridge 细粒度能力，可由 Plugin resolver 只消费字段，不复制 daemon / JobStore / ProjectRegistry 实现。
