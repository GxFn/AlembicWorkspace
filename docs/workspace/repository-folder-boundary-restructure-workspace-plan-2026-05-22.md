# Repository Folder Boundary Restructure Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-3A 总控验收通过；RFR-5 观察中（无发送窗口）
来源 TODO：`GTODO-2026-05-22-012`
需求目录：[repository-folder-boundary-restructure](../requirement-designs/repository-folder-boundary-restructure/)
目标阶段确认：[repository-folder-boundary-restructure-goal-stage-confirmation-2026-05-22.md](repository-folder-boundary-restructure-goal-stage-confirmation-2026-05-22.md)

## 用户目标

用户希望在主线功能链路相对稳定后，重新调整各仓库文件夹层级关系；同时明确要求保证功能完整性，不能为了调整结构导致功能缺失。

## 总控判断

本主线是边界固化工程，不是普通目录清理。任何实际搬目录之前，必须先确认：

- 当前入口：CLI、MCP、daemon、HTTP/API、Dashboard server、public package exports、Codex plugin shell。
- 当前生成物：`dist/`、`.release/`、`plugins/alembic-codex/runtime`、`runtime.tgz`、`vendor/*`。
- 当前发布 / 安装 / cache 链路：publish staging、Codex channel、plugin cache sync、local-mcp refresh。
- 当前测试和验证入口：build、typecheck、lint、unit/integration/e2e、release guard、runtime verify。

RFR-1 五个产品仓库清单已通过总控验收：

- `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 源仓库工作区均为干净状态；本轮只新增 workspace 执行记录，没有产品源码迁移。
- `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 当前目录表达与 public API / runtime / frontend 入口高度绑定，RFR-2/RFR-3 不优先安排源码移动。
- `Alembic` 主仓库涉及 CLI、daemon、HTTP/API、Dashboard server、release staging、resources、injectable skills 和 vendor/source resolver，实际迁移应晚于 Plugin 并单独开窄波次。
- `AlembicPlugin` 是 Codex host agent 入口，且 RFR-1 已确认 `lib/codex` 有 Codex-facing 平铺表达可小步收敛；因此 RFR-2A 只启动 `AlembicPlugin`，先做小范围、可验证的 Plugin 内部目录表达优化。

## 功能完整性护栏

- RFR-1 只做路径依赖清单和目标层级建议，不移动文件、不改 import、不删目录，已完成。
- 后续实际迁移必须一仓一波，且每波只有一个主要源码仓库做移动。
- 任何目录移动都必须更新 package manifest、tsconfig、build/lint/test/release scripts、runtime prepare、cache sync 和文档。
- `dist/`、`.release/`、`runtime/`、`vendor/`、`plugins/alembic-codex`、`channels/codex`、`.agents` 默认按生成物 / 发布物 / 渠道资产处理，不能当普通源码整理。
- 不删除仍有真实消费方的能力，不把完整实现变成薄实现。
- RFR-2A 不移动 `plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/` 或 `runtime.tgz` 的路径；如源码改动需要重建 runtime artifact，只重建发布物，不改变发布物所在路径。

## 阶段计划

| 阶段 | 状态 | 主窗口 | 目标 | 输出 / 证据 | 是否可派发 |
| --- | --- | --- | --- | --- | --- |
| RFR-0 | 已完成 | `AlembicWorkspace` | 建立原始计划、需求设计、代码依赖调研和第一波分派计划。 | 需求目录和当前计划已创建。 | 否 |
| RFR-1 | 已完成 | `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` / `AlembicPlugin` | 各仓库输出路径依赖清单、目标层级建议、禁止移动项和验证矩阵。 | `docs/<Repo>/repository-folder-boundary-inventory-*-2026-05-22.md`；五个产品仓库工作区干净。 | 否 |
| RFR-2A | 已完成 | `AlembicPlugin` | 在 `lib/codex` 内做第一轮 Codex-facing 目录表达优化，已迁移 runtime/status/diagnostics/preflight 到内部子目录；保持 MCP、plugin shell、channel、runtime artifact 路径不变。 | `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-codex-runtime-2026-05-22.md`；AlembicPlugin `6abb643e62cceed4642028b4000fc5ed518dda43`；AlembicCodex runtime artifact `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`；总控补跑 targeted unit / plugin verify / channel verify 通过。 | 否 |
| RFR-2B | 已完成 | `AlembicPlugin` | 继续整理 `lib/external/mcp/CodexMcpServer.ts` 的纯 helper / tool visibility / result / daemon job query 边界，已抽入 `lib/external/mcp/codex/` 内部支持目录；保持 MCP server 入口、tool schema、Skill contract 和 runtime artifact 外部路径不变。 | `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-mcp-helpers-2026-05-22.md`；AlembicPlugin `7afd689dc1654611b7f9de742aa170a3a9de7fa3`；AlembicCodex runtime artifact `b47d44a8558570cef2a2195c9b0b7eb13d020d95`；总控补跑 MCP/session targeted unit / plugin verify / channel verify 通过。 | 否 |
| RFR-3A | 已完成 | `Alembic` | 处理 Alembic 主仓库 `lib/core` 与 `@alembic/core` 命名歧义：已扫描真实 import/alias，并在保持 constitution/gateway/permission 行为不变的前提下，将 host-owned governance 目录收敛为 `lib/governance`。 | `docs/Alembic/repository-folder-boundary-rfr-3-main-governance-2026-05-22.md`；Alembic `07273a64a413c59a8d5b247f098859d9658a1985`；总控补跑 build:check / targeted unit / release package guard / residual scan / diff check 通过；`lint:repo-boundary` 仍有既有 DB boundary 违规，已转独立 TODO。 | 否 |
| RFR-4 | 观察中 | `AlembicCore` / `AlembicAgent` / `AlembicDashboard` | 只在 RFR-1 证明有必要且低风险时做内部目录收敛。 | 后续按仓库决定。 | 否 |
| RFR-5 | 观察中 | `AlembicWorkspace` / `AlembicTest` | 跨仓库验收、cache refresh、必要时创建真实项目测试单。当前 RFR-2/RFR-3 只改 Plugin runtime artifact 与 Alembic 内部 imports，尚未判断需要真实项目复测或 cache refresh。 | workspace 验收记录；如后续触发真实复测，再创建测试单。 | 否 |

## 窗口分派

当前 RFR-3A 已通过总控验收；暂无新的执行窗口。其它窗口保留为观察 / 无任务，既有 DB boundary lint 失败转入独立 TODO，不混入本轮目录命名波次。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | RFR-3A 已通过总控验收：`lib/core` constitution/gateway/permission 已迁入 `lib/governance`，`#core/*` package imports 已替换为 `#governance/*`，测试和脚本 imports 已更新；后续仅观察是否需要处理既有 DB boundary lint TODO。 |
| `AlembicCore`<br>观察中 | RFR-1 清单已验收；当前不进入源码移动。若未来需要收敛，应先减少 wildcard / transitional exports 和 deep import，而不是直接移动目录。 |
| `AlembicAgent`<br>观察中 | RFR-1 清单已验收；当前目录结构与 Agent runtime / external AI / tools 边界一致，不安排 RFR-2 实际迁移。 |
| `AlembicDashboard`<br>观察中 | RFR-1 清单已验收；Dashboard 暂不进入 RFR-2/RFR-3。若未来优化，单独开 Dashboard 波次，从低耦合 View 试点。 |
| `AlembicPlugin`<br>观察中 | RFR-2A/RFR-2B 已通过总控验收；当前不继续扩大 MCP handler 分层，后续等 Alembic RFR-3A 回填后再决定是否需要 cache refresh。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；RFR-3A 是 Alembic 内部 governance 目录命名和 import 收敛，未触发真实 Codex / BiliDili 复测。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## RFR-2A AlembicPlugin 执行要求

目标：把 `AlembicPlugin` 中已经明确属于 Codex host agent 的 runtime/status/diagnostics/preflight 表达从平铺 `lib/codex` 中小步收敛，形成真实目录边界，而不是创建空 provider 或无消费方 wrapper。

范围：

- 必须先读取 `AlembicPlugin/AGENTS.md`、本计划和 `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`。
- 优先候选为 `lib/codex/RuntimeContext.ts`、`lib/codex/StatusService.ts`、`lib/codex/Diagnostics.ts`、`lib/codex/Preflight.ts` 及其直接相关 imports/tests；具体移动集合以真实调用链为准。
- 允许更新 `lib/codex/index.ts`、相关 unit tests、runtime prepare / verify 脚本中因路径变化产生的引用。
- 如源码变更会进入 Codex runtime，必须运行 runtime prepare / verify，并回填新的 AlembicCodex runtime artifact hash；如判断无需重建 runtime，必须在回填中说明依据。

禁止事项：

- 不移动 `plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/`、`runtime.tgz` 所在路径。
- 不移动 `lib/external/mcp/`，不改 MCP tool schema / Skill contract，除非 RFR-2A 的 import 更新无法避免；若需要进入 MCP 目录重排，应回填给总控拆成 RFR-2B。
- 不把完整实现改成薄 wrapper，不新增没有真实调用方的兼容层，不为了目录好看删除诊断、状态、preflight、cache sync 或 runtime verify。
- 不启动 `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 的代码迁移。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- CodexRuntimeContext CodexStatusService CodexPluginCacheSync`
- `npm run test:unit -- CodexMcpServer CodexSessionScenarioRunner`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `git diff --check`

若某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

## RFR-3A Alembic 执行要求

目标：解决 Alembic 主仓库中 `lib/core` 与外部共享包 `@alembic/core` 容易混淆的问题。该目录当前实际承载 host-owned governance 能力：constitution、gateway、permission；本波只做一个 bounded context 的目录命名收敛，不触碰 CLI、daemon、HTTP route、Dashboard dist、release staging、resources、vendor 或 workspace source resolver。

范围：

- 必须先读取 `Alembic/AGENTS.md`、本计划和 `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md`。
- 必须先扫描并记录 `lib/core`、`#core/*`、constitution/gateway/permission 的真实 imports、tests、scripts 和 package imports。
- 建议目标目录名为 `lib/governance/`；如执行窗口发现更准确命名，必须在回填中说明理由，但不能扩大到其它 bounded context。
- 更新源码 imports、`package.json` imports、测试 imports、必要文档和执行记录；如果需要保留临时兼容 alias，必须说明真实消费方和移除条件。
- 保存执行记录到 `docs/Alembic/repository-folder-boundary-rfr-3-main-governance-2026-05-22.md`，并回填当前计划。

禁止事项：

- 不移动 `bin/`、`lib/daemon/`、`lib/http/`、`lib/service/`、`lib/workflows/`、`scripts/`、`dashboard/dist`、`injectable-skills/`、`templates/`、`resources/`、`vendor/`、`dist/`、`.release/`。
- 不修改 `@alembic/core` 本地源码 resolver、release staging 行为、Dashboard build 输出、runtime data、daemon API、MCP / Plugin contract 或真实项目。
- 不保留没有真实消费方的空 compatibility layer；不把 governance 行为改成薄 wrapper。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`
- `npm run lint:repo-boundary`
- `npm run release:package-guard`
- `rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig*.json vitest*.config.*`
- `git diff --check`

若某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

## RFR-2B AlembicPlugin 执行要求

目标：继续收敛 `AlembicPlugin` 的 Codex MCP 入口内部结构，优先从 `lib/external/mcp/CodexMcpServer.ts` 抽出真实复用 helper，让 MCP server 类保留 orchestration / tool dispatch 职责，不改变 Codex 对外工具契约。

范围：

- 必须先读取 `AlembicPlugin/AGENTS.md`、本计划、`docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md` 和 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-codex-runtime-2026-05-22.md`。
- 优先候选：`getVisibleCodexTools` 相关 tool visibility / projectRoot input helper、`failureResult` / `isErrorResult` / response error helpers、daemon job query / HTTP response helper、Codex host project handoff result builder。具体移动集合以真实调用链为准。
- 建议新增 `lib/external/mcp/codex/` 内部支持目录，但必须保持 `CodexMcpServer.ts` 继续导出 `CodexMcpServer`、`getVisibleCodexTools`、`startCodexMcpServer` 和默认导出，避免破坏 `bin/codex-mcp.ts`、`test/support/codex-session/McpHarness.ts` 和既有测试。
- 如源码变更会进入 Codex runtime，必须运行 runtime prepare / verify，并回填新的 AlembicCodex runtime artifact hash；如判断无需重建 runtime，必须在回填中说明依据。

禁止事项：

- 不移动 `lib/external/mcp/CodexMcpServer.ts` 入口文件本身，不移动 `lib/external/mcp/McpServer.ts` 或 `tools.ts` 的对外 tool schema。
- 不改 MCP tool 名称、输入 schema、annotations、Skill contract、`bin/codex-mcp.ts` 启动路径、`plugins/alembic-codex/`、`channels/codex/`、`.agents/`、`vendor/AlembicCore/`、`runtime.tgz` 所在路径。
- 不新增无真实调用方的空 wrapper，不把 helper extraction 变成行为重写，不做 daemon bridge / resident search / prime shout 的顺手改造。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`
- `npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `rg -n "from './(CodexMcpServer|McpServer|tools)\\.js'|from '../(CodexMcpServer|McpServer|tools)\\.js'" lib/external/mcp test bin scripts`
- `git diff --check`

若某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

## RFR-1 通用执行要求

每个产品仓库窗口都必须：

- 先读取本仓库 `AGENTS.md`。
- 不移动文件，不改源码 import，不删目录，不重命名 package exports，不重建 runtime / release artifact。
- 扫描并记录 package scripts、package exports/imports、tsconfig/vite/vitest/biome、release/runtime/cache scripts 中的路径依赖。
- 标出“可迁移目录”“应保留目录”“生成物 / 发布物目录”“禁止移动目录”“需要总控确认目录”。
- 给出建议目标层级，但只能是方案，不是执行结果。
- 给出后续实际迁移时的最小验证命令。
- 回填完成范围、文档路径、验证命令、验证结果、遗留风险和下一步建议。

## RFR-1 文档动作

| 窗口 | 保存位置 | 挂载入口 |
| --- | --- | --- |
| `Alembic` | `docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md` | 当前计划回填区 |
| `AlembicCore` | `docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md` | 当前计划回填区 |
| `AlembicAgent` | `docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md` | 当前计划回填区 |
| `AlembicDashboard` | `docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md` | 当前计划回填区 |
| `AlembicPlugin` | `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md` | 当前计划回填区 |

执行窗口可以回填 workspace 文档，但不得提交 AlembicWorkspace 仓库。

## RFR-1 验证建议

文档清单阶段至少运行：

- `git status --short`
- `rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig*.json vite.config.* vitest*.config.* biome.json scripts src lib bin config test`
- `git diff --check`

如果某仓库没有某些路径，按实际存在范围调整 `rg` 参数并在回填里说明。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RFR-TODO-1 | 已完成 | 路径依赖清单 | P0 | `Alembic` | 梳理本地增强底座目录与 release/dashboard/resource 路径依赖。 | 是 | 清单已回填并通过总控验收；暂不进入源码移动。 | `Alembic` |
| RFR-TODO-2 | 已完成 | 路径依赖清单 | P0 | `AlembicPlugin` | 梳理 Codex plugin runtime/channel/cache/MCP 路径依赖。 | 是 | 清单已回填并通过总控验收。 | `AlembicPlugin` |
| RFR-TODO-3 | 已完成 | public API 清单 | P1 | `AlembicCore` | 梳理 `src/` 与 package exports，标记不可破坏 public API。 | 是 | 清单已回填并通过总控验收；暂不进入源码移动。 | `AlembicCore` |
| RFR-TODO-4 | 已完成 | public API 清单 | P1 | `AlembicAgent` | 梳理 Agent runtime / AI provider / tools exports 与目录边界。 | 是 | 清单已回填并通过总控验收；暂不进入源码移动。 | `AlembicAgent` |
| RFR-TODO-5 | 已完成 | 前端目录清单 | P2 | `AlembicDashboard` | 判断 Dashboard 是否需要 feature-based 迁移，列出低风险建议。 | 否 | 清单已回填并通过总控验收；暂不进入源码移动。 | `AlembicDashboard` |
| RFR-TODO-6A | 已完成 | 代码迁移 | P0 | `AlembicPlugin` | 在 `lib/codex` 内做 runtime/status/diagnostics/preflight 小范围目录表达优化，更新 imports/tests/runtime artifact。 | 是 | AlembicPlugin `6abb643e62cceed4642028b4000fc5ed518dda43` 已通过总控验收；targeted unit / plugin verify / channel verify 通过。 | `AlembicPlugin` |
| RFR-TODO-6B | 已完成 | 代码迁移 | P0 | `AlembicPlugin` | 整理 `lib/external/mcp/CodexMcpServer.ts` 纯 helper / tool visibility / result / daemon job query 边界，抽入 `lib/external/mcp/codex/` 内部支持目录。 | 是 | AlembicPlugin `7afd689dc1654611b7f9de742aa170a3a9de7fa3` 已通过总控验收；MCP/session targeted unit / plugin verify / channel verify 通过。 | `AlembicPlugin` |
| RFR-TODO-8 | 已完成 | 代码迁移 | P0 | `Alembic` | 处理主仓库 `lib/core` 与 `@alembic/core` 命名歧义，将 host-owned constitution/gateway/permission bounded context 收敛到更准确目录。 | 是 | Alembic `07273a64a413c59a8d5b247f098859d9658a1985` 已通过总控验收；build:check / targeted unit / release package guard / residual scan / diff check 通过。 | `Alembic` |
| RFR-TODO-9 | 观察中 | 既有边界债 | P1 | `Alembic` | `npm run lint:repo-boundary` 仍因既有 DB boundary 违规失败，需要后续单独判断是否作为新主线收敛。 | 否，不影响 RFR-3A 目录命名验收；可能影响后续 repo-boundary 质量线。 | RFR-3A 总控验收发现；命中 `daemon.ts`、`CleanupService.ts`、`HitRecorder.ts`、`AuditStore.ts`、`daemon-server.ts` 等非本轮改动文件。 | `Alembic` |
| RFR-TODO-7 | 无任务 | 真实复测 | P1 | `AlembicTest` | 如 RFR-2/RFR-3 改动影响 Codex plugin 或 resident service，创建真实复测单。 | 否 | RFR-3A 只改 Alembic 内部 governance 目录命名和 imports，当前不触发真实项目复测。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察中 | 否 | RFR-3A 已通过总控验收；既有 DB boundary lint 问题转独立 TODO，不在本波继续扩大。 |
| `AlembicCore` | 观察中 | 否 | RFR-1 清单已验收；当前不做源码移动，后续如需收敛先处理 public API / deep import。 |
| `AlembicAgent` | 观察中 | 否 | RFR-1 清单已验收；当前目录结构与仓库职责一致，不做源码移动。 |
| `AlembicDashboard` | 观察中 | 否 | RFR-1 清单已验收；Dashboard 若优化需单独开前端波次。 |
| `AlembicPlugin` | 观察中 | 否 | RFR-2A/RFR-2B 已通过总控验收；当前不继续扩大 Plugin MCP handler 分层。 |
| `AlembicTest` | 观察中 | 否 | 当前无真实项目行为验证单；RFR-3A 未触发真实 Codex / BiliDili 复测。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无。

```text
当前 RFR-3A 已通过总控验收，暂无新的执行窗口提示词。
```

不发送给：`Alembic`（观察中）、`AlembicPlugin`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 总控验证

本计划创建后总控需运行：

- `node scripts/verify-workspace-docs.mjs --all-workspace`
- `node scripts/check-dispatch-coverage.mjs`
- `node scripts/check-todo-board.mjs --require`
- `git diff --check`

## 回填区

- 2026-05-22：总控创建 RFR 主线。当前 RFR-0 完成，RFR-1 只派发路径依赖清单，不允许代码移动。RFR-2 之后是否实际迁移，以各仓库清单和总控验收为准。
- 2026-05-22：`AlembicDashboard` RFR-1 已完成，执行记录见 `docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md`。完成范围：读取 Dashboard 仓库规则，扫描 Vite 前端目录、API client、socket hooks、i18n、theme、public assets、配置文件和源码相对 import；未移动文件、未改源码 import、未删目录。文档路径：`docs/AlembicDashboard/repository-folder-boundary-inventory-dashboard-2026-05-22.md`。验证命令：`git status --short`、`rg --files -g '!*node_modules*' -g '!dist/**' -g '!coverage/**'`、`find . -maxdepth 3 -type d -not -path './node_modules*' -not -path './.git*' -not -path './dist*' | sort`、路径依赖 `rg` 扫描、相对 import `rg` 扫描、runtime/API/public asset `rg` 扫描、`git diff --check`。验证结果：确认主要路径依赖集中在 `index.html` -> `/src/main.tsx`、`vite.config.ts` 的 `/api` / `/socket.io` proxy、`src/api.ts` 的 `/api/v1` REST/SSE、`src/lib/socket.ts` 的 `/socket.io`、`public/manifest.json` / `service-worker.js` / `logo.svg`、以及 `src/App.tsx` 对 Views/Modals/Layout 的相对 imports；Dashboard 仓库无源码改动，diff 检查通过。遗留风险：`App.tsx` 聚合度高且无 import alias，大规模 feature-based 迁移会产生较多 import churn；`public/service-worker.js` 有根路径缓存硬编码。下一步建议：Dashboard 暂不进入 RFR-2/RFR-3 实际移动，若后续需要优化，单独开 Dashboard 波次，从低耦合 View 试点并保留旧路径 re-export。
- 2026-05-22：`Alembic` 窗口完成 RFR-1 路径依赖清单。完成范围：梳理 `lib/`、`bin/`、`config/`、`scripts/`、`dashboard/`、`resources/`、`injectable-skills/`、`templates/`、`.release/`、`dist/`、`vendor/`、`test/` 与 release / workspace source resolver 路径依赖；未移动文件、未改源码 import、未删目录、未重建产物。文档路径：`docs/Alembic/repository-folder-boundary-inventory-main-2026-05-22.md`。验证命令：`git -C Alembic status --short`、`rg -n 'lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard|bin/|config/|scripts/' package.json tsconfig.json vitest.config.ts vitest.unit.config.ts biome.json scripts lib bin config test dashboard resources injectable-skills templates .github/workflows`、`git diff --check`。验证结果：通过；`plugins/alembic-codex` 与 `channels/codex` 在 Alembic 当前产品路径中无有效命中。遗留风险：`lib/core/` 与 `@alembic/core` 命名相近、release staging 直接读取 sibling source、`dashboard/dist` 是发布物落点，实际迁移需单独保护。下一步建议：等待其它 RFR-1 清单和总控验收，Alembic 主仓库不建议早于 AlembicPlugin 进入源码移动。
- 2026-05-22：`AlembicCore` 窗口完成 RFR-1 路径依赖清单。完成范围：梳理 `src/` 顶层 stable facade、package exports、`config/public-api-boundary.json`、`resources/grammars`、public API / release 脚本、`test/` boundary tests 和 `src/shared/package-root.ts`；未移动文件、未改源码 import、未删目录、未重建产物。文档路径：`docs/AlembicCore/repository-folder-boundary-inventory-core-2026-05-22.md`。验证命令：`git -C AlembicCore status --short`、`rg --files package.json package-lock.json tsconfig.json vitest.config.ts biome.json config scripts src test resources RELEASE-PLAYBOOK.md`、`rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig*.json vitest*.config.* biome.json config scripts src test resources RELEASE-PLAYBOOK.md`、`node -e "const pkg=require('./package.json'); const policy=require('./config/public-api-boundary.json'); ..."`、`git diff --check`。验证结果：通过；确认 exports 总数 136、exact 75、wildcard 61、stable 17、provisional 21，Core 仓库本身无未提交改动。遗留风险：Core wildcard / transitional exports 数量大，`resources/grammars` 是运行时发布资源，`src/workflows/capabilities/**` 是 host agent 知识挖掘闭环能力，后续不宜优先做源码目录移动。下一步建议：RFR-2/RFR-3 优先处理 `AlembicPlugin` / `Alembic`，Core 若继续收敛应先减少 deep import / transitional exports，再考虑目录移动。
- 2026-05-22：`AlembicAgent` 窗口完成 RFR-1 路径依赖清单。完成范围：读取 AlembicAgent 仓库规则，梳理 `src/agent`、`src/external/ai`、`src/tools`、`src/shared`、`config`、`scripts`、release stage、public exports、private imports、Vitest alias、boundary guard 和测试路径依赖；未移动文件、未改源码 import、未删目录、未重建 `dist` 或 staging artifact。文档路径：`docs/AlembicAgent/repository-folder-boundary-inventory-agent-2026-05-22.md`。验证命令：`git status --short`、`rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig.json vitest.config.ts biome.json scripts src config test`、`git diff --check`。验证结果：AlembicAgent 仓库无源码改动；路径依赖集中在 package exports/imports、`tsconfig` 的 `src`/`dist`、Vitest alias、boundary config、release scripts、public import smoke、测试 fixtures 和运行时类型命名；未发现 `.release`、`vendor/`、`plugins/alembic-codex`、`channels/codex`、`injectable-skills`、`templates`、`resources` 作为 AlembicAgent 产品路径；diff 检查通过。遗留风险：public exports 和 private import map 已稳定，顶层目录改名风险大于收益；Tool V2 adapter/cache/compressor 不应在没有真实迁移目标时拆分；`release:stage` 依赖 sibling Core source 和 `dist` layout。下一步建议：总控验收时将 AlembicAgent 归为观察中 / 暂不实际迁移，RFR-2/RFR-3 优先处理 AlembicPlugin 或 Alembic。
- 2026-05-22：`AlembicPlugin` 窗口完成 RFR-1 路径依赖清单。完成范围：读取 AlembicPlugin 仓库规则，梳理 `lib/`、`lib/codex`、`lib/external/mcp`、`bin/`、`config/`、`scripts/`、`plugins/alembic-codex`、`channels/codex`、`.agents`、`injectable-skills`、`templates`、runtime prepare、cache sync、release scripts、Core local/vendor resolver、package imports 和 Vitest alias；未移动文件、未改源码 import、未删目录、未重建 `plugins/alembic-codex/runtime` 或 `runtime.tgz`。文档路径：`docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`。验证命令：`git -C AlembicPlugin status --short --branch`、`rg --files -g '!node_modules/**' -g '!dist/**' -g '!plugins/alembic-codex/runtime/**' -g '!vendor/**'`、路径依赖 `rg` 扫描、历史 `#agent/#tools` import 负向扫描。验证结果：主要路径依赖集中在 root package imports/scripts、Core resolver、runtime prepare、Codex channel/marketplace/plugin shell/cache sync、runtime diagnostics 和 tests；`#agent/`、`#tools/` 只剩删除边界审计标签；AlembicPlugin 源仓库无源码改动。遗留风险：RFR-1 是清单阶段，未跑 build/test/release；`plugins/alembic-codex`、`vendor/AlembicCore`、`runtime.tgz` 需作为子仓库/发布物冻结。下一步建议：RFR-2 若启动 AlembicPlugin，只做小范围 Codex-facing 内部目录表达优化，禁止移动 plugin shell、channel、runtime artifact 和 vendor Core。
- 2026-05-22：总控验收 RFR-1 通过。复核结果：五个产品仓库均已回填路径依赖清单，`git -C Alembic status --short`、`git -C AlembicCore status --short`、`git -C AlembicAgent status --short`、`git -C AlembicDashboard status --short`、`git -C AlembicPlugin status --short` 均为空；RFR-1 未产生产品源码改动。功能完整性检查：本阶段目标是目录依赖清单和迁移边界，已覆盖入口、生成物、发布物、runtime/cache、public exports、测试/构建入口和禁止移动项，满足进入下一波的证据要求。下一步：只派发 `AlembicPlugin` 执行 RFR-2A，Core / Agent / Dashboard 观察，Alembic 主仓库等待 Plugin 结果，暂不创建 AlembicTest 测试单。
- 2026-05-22：`AlembicPlugin` 窗口完成 RFR-2A 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-codex-runtime-2026-05-22.md`。完成范围：先复核 `lib/codex` runtime/status/diagnostics/preflight 调用链，确认外部入口保持 `lib/codex/index.ts` barrel 后，将 `RuntimeContext.ts`、`StatusService.ts`、`Diagnostics.ts`、`Preflight.ts` 分别迁入 `runtime/`、`status/`、`diagnostics/`、`preflight/` 子目录；更新内部 imports、`lib/codex/index.ts`、`lib/codex/README.md`、`TaskPrimeKnowledgeMaterial` 测试路径和 Codex runtime artifact。提交 hash：AlembicPlugin `6abb643e62cceed4642028b4000fc5ed518dda43`；AlembicCodex runtime artifact 子仓库 `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`；`runtime.tgz` SHA-256 `fea0738ede4ad1519a9cea3225ae81badb4c766274a55c6a3b39c34ff989952a`。验证命令：`npm run build:check`、`npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexPluginCacheSync.test.ts`、`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、旧 flat path `rg` 负向扫描、`git diff --check`。验证结果：全部通过；旧 flat path 扫描无命中；未移动 `lib/external/mcp`、plugin shell、channel、vendor 或 runtime artifact 所在路径。遗留风险：RFR-2B 是否整理 `lib/external/mcp` handler 分层仍需总控验收后决定；本轮未创建 AlembicTest 真实项目复测单。下一步建议：总控复核 RFR-2A 后，再决定是否启动 RFR-2B 或转入 Alembic 主仓库窄波次。
- 2026-05-22：总控验收 RFR-2A 通过。复核范围：`git -C AlembicPlugin show --name-status HEAD`、`find AlembicPlugin/lib/codex -maxdepth 2 -type f`、旧 flat path `rg` 负向扫描、`git -C AlembicPlugin diff --check HEAD^ HEAD`、AlembicCodex runtime artifact 子仓库状态。总控补跑验证：`npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts test/unit/CodexMcpServer.test.ts` 通过，3 个文件 / 46 个测试；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过。功能完整性检查：外部消费仍通过 `lib/codex/index.ts` barrel 和 `lib/external/mcp/CodexMcpServer.ts`，MCP / plugin shell / channel / vendor / runtime artifact 所在路径未被移动，满足 RFR-2A 完成定义。下一步：启动 RFR-2B，只派发 `AlembicPlugin` 抽取 `CodexMcpServer.ts` 内部真实 helper；暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
- 2026-05-22：`AlembicPlugin` 窗口完成 RFR-2B 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-2-plugin-mcp-helpers-2026-05-22.md`。完成范围：先复核 `lib/external/mcp/CodexMcpServer.ts` 的 helper / tool visibility / result / daemon job query / host handoff 调用链，确认 `bin/codex-mcp.ts`、MCP harness 和单元测试仍通过 `CodexMcpServer.ts` 对外导出消费后，将真实 helper 抽入 `lib/external/mcp/codex/` 内部支持目录；`CodexMcpServer.ts` 保留 orchestration / tool dispatch、`getVisibleCodexTools` re-export、`startCodexMcpServer` 和 default export；未移动 MCP server 入口、tool schema、Skill contract、plugin shell、channel、vendor 或 runtime artifact 所在路径。提交 hash：AlembicPlugin `7afd689dc1654611b7f9de742aa170a3a9de7fa3`；AlembicCodex runtime artifact 子仓库 `b47d44a8558570cef2a2195c9b0b7eb13d020d95`；`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。验证命令：`npm run build:check`、`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run test:unit -- test/unit/CodexRuntimeContext.test.ts test/unit/CodexStatusService.test.ts`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、MCP import 关系 `rg` 扫描、helper 定义迁移 `rg` 扫描、`git diff --check`、`git -C plugins/alembic-codex diff --check`。验证结果：全部通过；MCP import 关系扫描命中均为保留的 MCP server / embedded server / tool schema 内部关系；helper 定义只保留在 `lib/external/mcp/codex/`。遗留风险：是否继续整理更深层 handler 分层需总控另开更窄波次；本轮未创建 AlembicTest 真实项目复测单。下一步建议：总控验收 RFR-2B 后，再决定是否启动 RFR-3 Alembic 主仓库窄波次或收口 RFR-2。
- 2026-05-22：总控验收 RFR-2B 通过。复核范围：`git -C AlembicPlugin show --name-status HEAD`、`lib/external/mcp/CodexMcpServer.ts` 导出与 helper import、`lib/external/mcp/codex/*.ts` helper 文件、helper 定义迁移扫描、MCP import 关系扫描、AlembicCodex runtime artifact 子仓库状态。总控补跑验证：`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` 通过，2 个文件 / 40 个测试；`npm run verify:codex-plugin` 通过；`npm run verify:codex-channel` 通过；`git -C AlembicPlugin diff --check HEAD^ HEAD` 通过。功能完整性检查：MCP server 入口、tool schema、Skill contract、Plugin shell、channel、vendor、runtime artifact 所在路径未移动，满足 RFR-2B 完成定义。下一步：启动 RFR-3A，只派发 `Alembic` 处理主仓库 `lib/core` 命名歧义；暂不创建 AlembicTest 测试单，暂不刷新本机 Codex plugin cache。
- 2026-05-22：`Alembic` 窗口完成 RFR-3A 并回填，执行记录见 `docs/Alembic/repository-folder-boundary-rfr-3-main-governance-2026-05-22.md`。完成范围：先复核 `lib/core` constitution/gateway/permission 与 `#core/*` package imports 的真实调用链，确认其实际属于 host-owned governance bounded context 后，将 `Constitution`、`ConstitutionValidator`、`Gateway`、`GatewayActionRegistry`、`PermissionManager` 从 `lib/core` 迁入 `lib/governance`；更新 `lib/bootstrap.ts`、DI/HTTP imports、四组 targeted unit tests、`package.json` imports、两个历史 benchmark/stats 脚本和 `AGENTS.md`；删除迁移后为空的 `lib/core` 目录；未移动 CLI、daemon、HTTP route、Dashboard dist、release staging、resources、vendor 或 workspace source resolver。提交 hash：Alembic `07273a64a413c59a8d5b247f098859d9658a1985`。验证命令：`npm run build:check`、`npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`、`npm run build`、`npm run release:package-guard`、`rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig.json vitest.config.ts vitest.unit.config.ts`、`git diff --check`、`npm run lint:repo-boundary`。验证结果：除 `npm run lint:repo-boundary` 外均通过；负向扫描无输出；`npm run lint:repo-boundary` 仍失败于既有 DB boundary 违规，涉及 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts` 等，非本轮 governance 目录迁移引入。遗留风险：Core 相关脚本改为消费 `@alembic/core` public exports，后续如 Core export policy 收紧需同步；DB boundary lint 需另开任务判断。下一步建议：总控验收 RFR-3A 后，再决定是否创建 AlembicTest 真实复测单或进入 RFR-5 跨仓库验收。
- 2026-05-22：总控验收 RFR-3A 通过。复核范围：`git -C Alembic show --name-status HEAD`、`lib/governance` 文件列表、`package.json` imports、`lib/core/#core` 负向扫描、提交 diff check、Alembic 工作区状态。总控补跑验证：`npm run build:check` 通过；`npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts` 通过，4 个文件 / 59 个测试；`npm run release:package-guard` 通过；`rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig.json vitest.config.ts vitest.unit.config.ts` 无输出；`git diff --check HEAD^ HEAD` 通过。`npm run lint:repo-boundary` 仍失败于既有 DB boundary 违规，已记录为 RFR-TODO-9 / 全局 TODO，不阻塞本轮。功能完整性检查：bootstrap、DI、HTTP gateway action registry、targeted tests、package import map 和发布边界检查均覆盖；未触碰 CLI、daemon runtime、HTTP route 行为、Dashboard dist、release staging、resources、vendor、MCP / Plugin contract 或真实项目。当前无发送窗口，暂不创建 AlembicTest 测试单。
