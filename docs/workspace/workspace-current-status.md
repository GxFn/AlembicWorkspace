# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-6A 待启动；AlembicPlugin 真实修正第一轮

## 状态摘要

当前新主线是 [repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)：在不破坏功能完整性的前提下，重新调整各仓库文件夹层级关系。

总控已完成 RFR-0 和 RFR-1：

- 原始计划：[../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md)。
- 需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)。
- 代码依赖调研：[../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md)。
- RFR-1 五个产品仓库路径依赖清单均已回填并通过总控验收；五个产品仓库工作区干净，没有产品源码迁移。
- RFR-2A 已通过总控验收：`lib/codex` runtime/status/diagnostics/preflight 已迁入内部语义目录，AlembicPlugin 提交 `6abb643e62cceed4642028b4000fc5ed518dda43`，AlembicCodex runtime artifact 子仓库提交 `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`；总控补跑 targeted unit、plugin verify、channel verify 均通过。
- RFR-2B 已通过总控验收：`CodexMcpServer.ts` 内部 helper 已抽入 `lib/external/mcp/codex/`，MCP server 入口、tool schema、Skill contract 和 runtime artifact 外部路径保持不变；AlembicPlugin 提交 `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，AlembicCodex runtime artifact 子仓库提交 `b47d44a8558570cef2a2195c9b0b7eb13d020d95`，`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。总控补跑 RFR-2B targeted unit、plugin verify、channel verify 和提交 diff check 均通过。
- RFR-3A 已通过总控验收：主仓库 `lib/core` constitution / gateway / permission 已迁入 `lib/governance`，提交 `07273a64a413c59a8d5b247f098859d9658a1985`；总控补跑 build:check、targeted unit、release package guard、负向扫描和 diff check 通过。
- `npm run lint:repo-boundary` 仍因既有 DB boundary 违规失败，命中 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts` 等非本轮改动文件；已转入独立 TODO，不阻塞 RFR-3A。
- RFR-6 已完成深度代码审计：[repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)。总控确认 RFR-3A 不是整体完成；拆仓残留仍包括 `AlembicPlugin` embedded runtime 边界、Plugin 旧 `lib/core` / `#core/*`、主产品 package 与 Plugin runtime package 身份重叠、MCP surface 分叉与 Dashboard help 旧口径、Core deep export 迁移债、Agent 文档路径口径债和 Alembic DB boundary lint 债。
- 用户已确认采用“先做一轮真实修正，然后收集真实代码，再深入分析下一轮”的持续增强节奏。
- RFR-6A 已激活：只派发 `AlembicPlugin` 处理旧 `lib/core` / `#core/*` governance 命名残留。完成后总控基于真实 diff、runtime artifact 和残留扫描进入 RFR-6B 深入分析下一轮。

当前发送窗口：`AlembicPlugin`。

当前不发送给：`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | RFR-6A 只改 Plugin governance 命名；Alembic 主仓库已完成 RFR-3A，DB boundary lint 继续保持独立 TODO。 |
| `AlembicCore`<br>观察中 | RFR-6A 不触碰 Core public API / deep import。 |
| `AlembicAgent`<br>观察中 | RFR-6A 不触碰 Agent。 |
| `AlembicDashboard`<br>观察中 | RFR-6A 不触碰 Dashboard help / i18n，后续基于真实修正结果再判断。 |
| `AlembicPlugin`<br>待启动 | RFR-6A：处理旧 `lib/core` / `#core/*` governance 命名残留，回填真实 diff、提交 hash、runtime artifact hash、验证命令和下一轮代码证据。 |
| `AlembicTest`<br>观察中 | RFR-6A 先由 Plugin 窗口完成 build / unit / runtime verify；暂无真实项目复测单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`AlembicPlugin`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 RFR-6A 任务；完成后回填完成范围、提交 hash、验证命令、验证结果、runtime artifact hash、残留风险和下一步建议。
```

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 待启动；本轮只做路径依赖清单和目标层级建议，明确禁止代码移动。
- 2026-05-22：`AlembicAgent` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md`；当前不建议给 `AlembicAgent` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicCore` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md`；当前不建议给 `AlembicCore` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-1 路径依赖清单并回填，文档见 `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`；当前不建议给 `AlembicPlugin` 继续发送 RFR-1 提示词，等待总控统一验收。
- 2026-05-22：`Alembic` 和 `AlembicDashboard` RFR-1 路径依赖清单已回填，文档分别见 `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md`、`docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md`。
- 2026-05-22：总控验收 RFR-1 通过。复核结果：五个产品仓库均已回填路径依赖清单，`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 工作区均干净；RFR-1 未产生产品源码改动。下一步只派发 `AlembicPlugin` 执行 RFR-2A，暂不创建 AlembicTest 测试单。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-2A 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-codex-runtime-2026-05-22.md`。完成范围：迁移 `lib/codex` runtime/status/diagnostics/preflight 四类文件到内部语义目录，更新 imports、tests、runtime artifact；未移动 MCP、plugin shell、channel、vendor 或 runtime artifact 所在路径。提交：AlembicPlugin `6abb643e62cceed4642028b4000fc5ed518dda43`，AlembicCodex runtime artifact `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`。验证：build/typecheck、targeted unit、runtime prepare、codex plugin/channel verify、旧路径负向扫描和 `git diff --check` 均通过。
- 2026-05-22：总控验收 RFR-2A 通过，补跑 `npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 均通过；旧 flat path 负向扫描和 diff 检查通过。下一步只派发 `AlembicPlugin` 执行 RFR-2B，暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-2B 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-mcp-helpers-2026-05-22.md`。完成范围：新增 `lib/external/mcp/codex/` 内部支持目录，抽取 tool visibility / result / daemon job query / host handoff / project root fallback helper；未移动 MCP server 入口、tool schema、Skill contract、plugin shell、channel、vendor 或 runtime artifact 外部路径。提交：AlembicPlugin `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，AlembicCodex runtime artifact `b47d44a8558570cef2a2195c9b0b7eb13d020d95`，`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。验证：build/typecheck、targeted unit、runtime prepare、codex plugin/channel verify、helper 定义负向扫描和 `git diff --check` 均通过。
- 2026-05-22：总控验收 RFR-2B 通过，补跑 `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 和 `git -C AlembicPlugin diff --check HEAD^ HEAD` 均通过；功能完整性检查确认 MCP server 入口、tool schema、Skill contract、runtime artifact 外部路径和对外导出保持完整。下一步只派发 `Alembic` 执行 RFR-3A，暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
- 2026-05-22：`Alembic` 已完成 RFR-3A 并回填，执行记录见 `docs/Alembic/repository-folder-boundary-rfr-3-main-governance-2026-05-22.md`。完成范围：将 host-owned governance bounded context 从 `lib/core` 迁入 `lib/governance`，更新源码 imports、`package.json` imports、targeted tests、历史 Core 脚本路径和 `AGENTS.md`；未移动 CLI、daemon、HTTP route、Dashboard dist、release staging、resources、vendor 或 workspace source resolver。提交：Alembic `07273a64a413c59a8d5b247f098859d9658a1985`。验证：build:check、targeted unit、build、release package guard、`lib/core/#core` 负向扫描和 diff check 通过；`lint:repo-boundary` 仍因既有 DB boundary 违规失败，等待总控决定是否另开任务。
- 2026-05-22：总控验收 RFR-3A 通过。补跑 `npm run build:check`、`npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`、`npm run release:package-guard`、`rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig.json vitest.config.ts vitest.unit.config.ts` 和 `git diff --check HEAD^ HEAD` 均通过；`npm run lint:repo-boundary` 仍失败于既有 DB boundary 违规，已记录为独立 TODO。当前无发送窗口，暂不创建 AlembicTest 测试单。
- 2026-05-22：总控完成 RFR-6 深度代码审计，新增 [repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)。审计确认 RFR-3A 不是整体收口；下一步推荐先确认 `AlembicPlugin` embedded runtime 分类主线，当前不派发实现窗口。
- 2026-05-22：用户确认采用“先真实修正，再收集真实代码，再深入分析下一轮”的节奏。总控激活 RFR-6A，只派发 `AlembicPlugin` 处理旧 `lib/core` / `#core/*` governance 命名残留；其它窗口观察，暂不创建 AlembicTest 测试单。
