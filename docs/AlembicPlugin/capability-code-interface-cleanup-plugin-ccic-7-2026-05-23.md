# AlembicPlugin CCIC-7 执行记录

日期：2026-05-23
任务包：CCIC-P7-P
执行窗口：AlembicPlugin
状态：待总控验收

## 窗口定位

- 当前窗口定位：`AlembicPlugin` 执行窗口。
- 目标仓库职责：Codex / IDE 插件入口，维护 Codex MCP、Skill、channel / marketplace、插件 runtime artifact、安装验证、Codex 宿主适配和 resident service client。
- 本轮任务职责：删除 Plugin 旧 Dashboard / 旧调用方兼容残留，只保留 `alembic_codex_dashboard` 对本地 Alembic daemon Dashboard URL 的 handoff；将 root/runtime/channel/docs/tests 中旧 `alembic-ai` package 身份改为 IDE plugin artifact 语义。
- 明确不承担：不修改 `Alembic` 主体 resident handler、不修改 `AlembicCore` public API、不修改 `AlembicDashboard` 仓库、不恢复外部 AI provider、不删除 Codex MCP / Skill / channel / runtime artifact / portable fallback、不运行真实项目测试。

## 完成范围

- 将 AlembicPlugin root package、lockfile、Codex runtime constants、package asset detection、channel metadata、release / verify / smoke scripts、plugin docs 和 AlembicCodex runtime package 身份统一为 `alembic-codex-plugin-runtime@0.2.0`。
- 删除旧 `HOST_AI_MANAGED` / `hostManaged` / `legacyHostManaged` / `legacyBoundaryCode` 兼容字段，保留 canonical `HOST_AGENT_MANAGED` / `PLUGIN_DETERMINISTIC_EXTRACT` 语义，并把可见 payload 改为 `hostAgentManaged`、`deterministicPluginExtract`、`managedBy` / `semanticEnhancementManagedBy`。
- 清理 HTTP 旧 Dashboard / 旧调用方命名：job response 从 `dashboardUrl` 改为 `apiBaseUrl`，无 daemon token 的 job source 从 `dashboard` 改为 `http`，monitoring 旧 `/dashboard` route 收敛为 `/summary`。
- 保留 `alembic_codex_dashboard` 作为本地 Alembic daemon Dashboard URL handoff，不把 Plugin 做成 Alembic daemon 空壳 client。
- 更新相关单元测试和 HTTP surface boundary 断言，覆盖旧 route / old response key / old dashboard source 不再出现。
- 刷新 AlembicCodex runtime artifact：`plugins/alembic-codex/runtime/` 与 `runtime.tgz` 已同步，wrapper 默认 npm cache 名称改为 `alembic-codex-plugin-runtime-npm-cache`，避免旧 `alembic-ai` npx cache 干扰新包名。

## 提交

- AlembicPlugin：`57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`
- AlembicCodex runtime artifact：`5c5074346029f4975fa4f8cbb4da662d0838a297`
- `runtime.tgz` SHA-256：`318099ac67031a493840f18d77d4916fe457b420bd5249f72ce69a0e54652ce8`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，输出 package `alembic-codex-plugin-runtime@0.2.0`。
- `npm run test:unit -- test/unit/HostManagedBoundary.test.ts test/unit/ModuleServiceHostManagedBoundary.test.ts test/unit/CandidatesHostManagedBoundary.test.ts test/unit/PluginHttpSurfaceBoundary.test.ts test/unit/CodexRuntimeContext.test.ts test/unit/CodexModuleBoundary.test.ts test/unit/CodexEnhancementRoute.test.ts test/unit/CodexMcpServer.test.ts test/unit/JobsRoute.test.ts test/unit/JobStore.test.ts test/unit/CodexStatusService.test.ts`：通过，11 files / 73 tests。
- `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-codex-plugin-runtime@0.2.0`。
- `npm run verify:codex-channel`：通过，`alembic-codex-plugin-runtime@0.2.0`。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed。
- `npm run lint:repo-boundary`：通过，escape hatch 0 / 75。
- `npm run lint:consumer-core-imports`：通过，334 files / 457 imports。
- `npm run report:agent-extraction-boundary`：通过，agent / AI / tool outside implementation 均为 0。
- `npm run verify:release-package-boundary`：通过，root npm publish disabled，Codex plugin artifact release true，embedded runtime core dependency 保持 `file:vendor/AlembicCore`。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

## 负向扫描结果

- `rg -n "alembic-ai|HOST_AI_MANAGED|hostManaged|legacyHostManaged|legacyBoundaryCode|dashboard-refine|source: 'dashboard'|source: \"dashboard\"|monitoring/dashboard|router\\.get\\('/dashboard'" ...`：无命中；runtime 扫描排除 `vendor/AlembicCore/**` 和 `node_modules/**`。
- `rg -n "Dashboard compatibility|Dashboard 调用方|共享 Dashboard|via dashboard|mountDashboard|Dashboard 冷启动|Dashboard 可视化|Dashboard API|Dashboard 刷新|Dashboard chat|built-in AI agent|内置 AI Agent|Dashboard 对话" ...`：无命中；runtime 扫描排除 `vendor/AlembicCore/**` 和 `node_modules/**`。
- `rg -n "@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai" lib test bin plugins/alembic-codex/runtime/dist ...`：无命中。

## 工作区状态

- `AlembicPlugin`：提交后 `git status --short --branch` 为 `## main...origin/main [ahead 1]`，无未提交产品改动。
- `AlembicPlugin/plugins/alembic-codex`：提交后 `git status --short --branch` 为 `## main...origin/main [ahead 1]`，无未提交 runtime artifact 改动。
- `AlembicWorkspace`：仅回填文档，不提交 workspace 仓库。

## 遗留风险

- 本轮未刷新本机 Codex plugin cache；若总控要让当前机器实际使用新 runtime artifact，需要后续执行 cache refresh / marketplace sync。
- 本轮未创建 AlembicTest 真实项目复测单；原因是本轮为 Plugin package 身份、compat 命名和 artifact 启动路径清理，未直接改变真实项目 prime/search/cold-start 流程。
- `vendor/AlembicCore` 仍按 portable runtime 例外保留 Core vendored snapshot 与 `.alembic-source.json`，不得误删。

## 下一步建议

- 总控验收 AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`、AlembicCodex `5c5074346029f4975fa4f8cbb4da662d0838a297` 和 Alembic `CCIC-P7-A` 后，决定进入 CCIC-8 总体验收或追加 Plugin / Alembic service contract 对齐。
- 若需要本机实际切换到新 Codex plugin artifact，再由总控安排 cache refresh；届时再判断是否需要 AlembicTest 复测 prime/search/cold-start。
