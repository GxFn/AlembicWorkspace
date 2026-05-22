# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-6D 暂停（合并清理待用户确认）

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
- RFR-6A 已通过总控验收：旧 `lib/core` / `#core/*` governance 命名残留已收敛为 `lib/governance` / `#governance/*`；constitution / gateway / permission 已分类为 Plugin Codex 自洽闭环与 portable compatibility，不是可删旧残留。AlembicPlugin 提交 `cef5e419440064c056d6b3408cd961fac5047b7a`，AlembicCodex runtime artifact 子仓库提交 `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`，`runtime.tgz` SHA-256 `dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`；总控复核残留扫描、runtime artifact 状态和提交 diff check 通过。
- 用户补充确认长期前提：`Plugin first, Alembic install enhances`。`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座；Plugin 可以通过请求 Alembic service 工作。因此 RFR-6A 需要把旧功能先分类为 Plugin-owned 请求治理、Alembic service request client、portable compatibility 或旧残留，再做最小真实修正。
- 用户进一步强调 `AlembicPlugin` 自己也有围绕 Codex / IDE Agent 的自洽闭环，不能把 Plugin 做成空壳 client。RFR-6A 分类顺序修正为：先判断是否属于 Plugin Codex 自洽闭环，再判断 Alembic service request client、portable compatibility 或旧残留。
- RFR-6B 总控真实代码分析已完成：[repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)。下一轮不做 package 身份、大面积 HTTP/service/injection/daemon 搬迁、Dashboard HelpView 文案或 service bridge；RFR-6C 只派发 `AlembicPlugin`，处理 HTTP `DashboardOperations` compatibility 命名歧义，同时保留外部 `dashboard.*` operation id 和 HTTP route 行为。
- RFR-6C 已通过总控验收：[../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md](../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md)。完成范围：`DashboardOperations` cluster 分类为 Plugin portable HTTP compatibility operation dispatcher，源码迁入 `lib/http/compatibility/operations/`，内部命名收敛为 `DashboardCompatibility*`；外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema、Skill contract 和 channel/cache 行为保持不变。提交：AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e`，AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`，`runtime.tgz` SHA-256 `c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`；总控复核残留扫描、runtime artifact 状态和提交 diff check 通过。
- RFR-6D 总控原真实代码分析已完成：[repository-split-rfr-6d-real-code-analysis-2026-05-22.md](repository-split-rfr-6d-real-code-analysis-2026-05-22.md)。用户进一步修正：Dashboard 已不再接入 Plugin，RFR-6C 保留的 Dashboard HTTP compatibility operation layer 不应作为长期兼容继续保留；同时 AlembicPlugin 小改动不应每次单独打包验证。总控已补充合并清理分析：[repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)。当前 RFR-6D 暂停等待用户确认，确认后合并派发 `AlembicPlugin` 删除旧 Dashboard HTTP compatibility operation layer，并同时处理 `AgentModule.ts` 命名残留。

当前发送窗口：无，等待用户确认 RFR-6D 删除范围。

确认后发送窗口：`AlembicPlugin`。

当前不发送给：`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicPlugin`（暂停）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | RFR-6D 不改 Alembic 主仓库；Dashboard API 真实闭环继续在 Alembic daemon/API 与 AlembicDashboard 之间。 |
| `AlembicCore`<br>观察中 | RFR-6D 不触碰 Core public API / deep import。 |
| `AlembicAgent`<br>观察中 | RFR-6D 不触碰 AlembicAgent 仓库，也不引入 Agent runtime。 |
| `AlembicDashboard`<br>观察中 | RFR-6D 不改 Dashboard 前端；Dashboard 不接入 Plugin，继续消费 Alembic 主仓库 API。 |
| `AlembicPlugin`<br>暂停 | 等待用户确认 RFR-6D 合并清理：删除旧 Dashboard HTTP compatibility operation layer；清理或重命名受影响 route；同时将 `AgentModule.ts` 收敛为 SkillHooks 语义模块；最后一次性重建 runtime artifact 和验证 plugin/channel。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；RFR-6D 属于 Plugin 代码边界和 runtime artifact 验证，确认后先由 Plugin 窗口完成 build / unit / runtime verify。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：无，等待用户确认 RFR-6D 合并清理删除范围。

确认后发送给：`AlembicPlugin`。

```text
读取 docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md，按照文档领取并完成 RFR-6D 合并清理。目标是在 Plugin first, Alembic install enhances 前提下，一次性处理 AlembicPlugin 的两个同边界残留：删除旧 Dashboard HTTP compatibility operation layer，并将 `lib/injection/modules/AgentModule.ts` 收敛为 SkillHooks 语义模块。先读取 RFR-6D batch cleanup analysis，扫描 `DashboardCompatibilityOperations`、`dashboard-compatibility-operation`、`commands/modules` routes、`AgentModule`、`ServiceContainer`、`ServiceMap.skillHooks` 和 runtime artifact 消费链；没有真实 Plugin 消费方的 `dashboard.*` operation 分派和旧兼容 route 要删除，若发现真实 Plugin 消费方则改成非 Dashboard 命名的直接实现并回填证据。必须保留 `alembic_codex_dashboard` URL handoff、`skillHooks` service key、SkillHooks lifecycle、Codex MCP/Skill 行为和 plugin/channel 交付。完成后回填执行记录、提交 hash、验证命令、验证结果、runtime artifact hash、残留风险和下一步建议。
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
- 2026-05-22：用户补充确认长期前提：`Plugin first, Alembic install enhances`，Plugin 可以请求 Alembic service 工作。总控修订 RFR-6A 派发口径：旧功能必须先分类为 Plugin-owned 请求治理、Alembic service request client、portable compatibility 或旧残留，不能把 service enhancement 误判为 Plugin 本地永久实现，也不能把 portable compatibility 误删。
- 2026-05-22：用户进一步强调 `AlembicPlugin` 自己也有围绕 Codex / IDE Agent 的自洽闭环，职责权衡微妙。总控再次修订 RFR-6A：旧功能分类顺序改为先判断是否属于 Plugin Codex 自洽闭环，再判断 Alembic service request client、portable compatibility 或旧残留，避免把 Plugin 做成空壳 client，也避免维护第二套 Alembic。
- 2026-05-22：`AlembicPlugin` 已完成 RFR-6A 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md`。完成范围：将 `lib/core/{constitution,gateway,permission}` 迁入 `lib/governance/{constitution,gateway,permission}`，将 `#core/*` 改为 `#governance/*`，同步 bootstrap、HTTP、MCP embedded server、DI、targeted unit tests、Vitest alias、AGENTS 和 Codex runtime artifact；未移动 HTTP/service/injection/daemon/external-mcp/codex/plugin shell/channel/vendor/runtime artifact 所在路径。提交：AlembicPlugin `cef5e419440064c056d6b3408cd961fac5047b7a`，AlembicCodex runtime artifact `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`，`runtime.tgz` SHA-256 `dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`。验证：build/check、targeted unit、runtime prepare、plugin/channel verify、残留扫描和 diff check 均通过；额外 `npm run lint` 仍失败于既有 Biome 债，后续单独处理。
- 2026-05-22：总控验收 RFR-6A 通过。复核范围：`git -C AlembicPlugin show --name-status --stat HEAD`、`lib/core/#core` 负向扫描、`#governance/lib/governance` 正向扫描、AlembicCodex runtime artifact 子仓库状态和提交 diff check。功能完整性检查：Plugin governance 仍被 bootstrap、HTTP、MCP embedded server、DI 和 targeted tests 消费，runtime artifact 已同步；未触碰 HTTP/service/injection/daemon/external MCP/codex/plugin shell/channel/vendor/runtime artifact 所在路径。
- 2026-05-22：总控完成 RFR-6B 真实代码分析，新增 [repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)。当前进入 RFR-6C，只派发 `AlembicPlugin` 处理 HTTP `DashboardOperations` compatibility 命名歧义；暂不创建 AlembicTest 测试单。
- 2026-05-22：`AlembicPlugin` 完成 RFR-6C 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md`。完成范围：`DashboardOperations` / `dashboard-operation` cluster 迁入 `lib/http/compatibility/operations/`，内部命名改为 `DashboardCompatibility*`，保留外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema 和 channel/cache 行为。提交：AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e`，AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`，`runtime.tgz` SHA-256 `c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`。验证：build:check、targeted unit、build、runtime prepare、plugin/channel verify、残留扫描和 diff check 均通过。当前状态改为 RFR-6C 待验收，暂不创建 AlembicTest 测试单。
- 2026-05-22：总控验收 RFR-6C 通过。复核范围：AlembicPlugin 提交 `a535d16e6974fdcba2b643b64dc24c8315c9b51e`、AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`、旧 `http/dashboard` / `DashboardOperations` / `dashboard-operation` import 负向扫描、new compatibility operation 正向扫描、runtime artifact 子仓库状态和提交 diff check。功能完整性检查：外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema 和 channel/cache 行为保持不变；残留的 `kind: 'dashboard-operation'` 属于 fallback manifest payload 兼容语义，不是源码目录边界残留。
- 2026-05-22：总控完成 RFR-6D 真实代码分析，新增 [repository-split-rfr-6d-real-code-analysis-2026-05-22.md](repository-split-rfr-6d-real-code-analysis-2026-05-22.md)。当时进入 RFR-6D 的原计划是只派发 `AlembicPlugin` 处理 `AgentModule.ts` 命名残留；暂不创建 AlembicTest 测试单。
- 2026-05-22：用户修正 Dashboard 不再接入 Plugin，要求总控思考 RFR-6C 保留兼容层后续如何清理，并建议多个小任务合并执行，避免 AlembicPlugin 每次小改都单独打包验证。总控新增 [repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)，将 RFR-6D 从单独 `AgentModule` 命名修正改为待确认合并批处理：删除 Plugin 旧 Dashboard HTTP compatibility operation layer，同时收敛 `AgentModule.ts` 为 SkillHooks 语义模块。当前发送窗口改为无，等待用户确认删除范围。
