# Repository Folder Boundary Restructure Workspace Plan

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：RFR-6D 已完成（等待下一轮总控分析 / 用户决策）
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

RFR-6 深度补充审计已完成，文档见 [repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)。本次审计确认 RFR-3A 不是整体收口，只是主仓库 governance bounded context 的一个可验证收敛；拆仓残留仍包括 `AlembicPlugin` embedded runtime 边界、Plugin 旧 `lib/core` 命名、主产品 package 与 Plugin runtime package 身份重叠、MCP surface 分叉与 Dashboard help 旧口径、Core deep export 迁移债、Agent 文档路径口径债和 Alembic DB boundary lint 债。

用户已确认采用“先做一轮真实修正，再收集真实代码，随后深入分析下一轮”的持续增强节奏。RFR-6A 选择最小真实修正点：`AlembicPlugin` 仍保留旧 `lib/core` / `#core/*` governance 命名，而 Alembic 主仓库 RFR-3A 已迁入 `lib/governance` / `#governance/*`。本波只处理 Plugin governance 命名残留，并要求回填真实 diff、runtime artifact、残留扫描和下一轮代码证据；不触碰 Plugin HTTP/service/daemon/injection 大面积兼容层。

RFR-6A 必须建立在长期产品前提上重新认识旧功能：`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座；Plugin first，Alembic install enhances。这里的权衡很微妙：`AlembicPlugin` 不是空壳 client，它围绕 Codex / IDE Agent 拥有自己的自洽闭环，包括 MCP 工具入口、Skill 约束、Codex 可见响应、权限 / tier、host project 对齐、prime / search / Guard 的 Codex 交互语义、runtime/channel/cache 交付和无 Alembic 时的最小可用路径；但它也不应复制 Alembic 作为本地增强底座的长期 daemon / service / Dashboard / internal AI 主实现。

因此 RFR-6A 的旧功能判断顺序必须是：先确认是否属于 Plugin 的 Codex 自洽闭环；再判断是否应该通过 Alembic service 增强；再判断是否需要 portable compatibility；最后才判断是否是真正旧残留或重复实现。只有最后一类进入删除候选；Alembic service 增强应转成明确 service request 边界；portable compatibility 要写清保留条件和降级语义；Plugin-owned Codex 自洽闭环要保留并命名准确。

RFR-6A 已通过总控验收。RFR-6B 总控基于真实 diff 和残留扫描完成下一轮代码分析，文档见 [repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)。RFR-6C 已通过总控验收：`AlembicPlugin` HTTP `DashboardOperations` compatibility 命名歧义已收敛到 `lib/http/compatibility/operations/`，外部 `dashboard.*` operation id、HTTP route 行为、runtime artifact 和 portable compatibility 保持不变。

RFR-6D 原计划只处理 `AlembicPlugin/lib/injection/modules/AgentModule.ts` 命名残留。用户进一步修正：Dashboard 已不再接入 Plugin，因此 RFR-6C 保留的 Dashboard HTTP compatibility operation layer 不应作为长期兼容继续保留；同时 AlembicPlugin 每次小改都需要重建 runtime artifact 和插件验证，应把同一边界内的低风险清理合并成一波。总控已补充真实代码分析，文档见 [repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)。用户已确认执行，`AlembicPlugin` 已回填并通过总控验收：旧 Dashboard HTTP compatibility operation layer、旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP surface 已删除，`AgentModule.ts` 已收敛为 `SkillHooksModule.ts`；当前无发送窗口。

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
| RFR-6 | 已完成 | `AlembicWorkspace` | 根据用户要求继续完整深挖拆仓残留，不因发现主仓库 `lib/core` 一个目标就停止；横向复核 Alembic / Core / Agent / Dashboard / Plugin 真实代码和边界文档。 | [repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)；当前只形成审计和下一主线候选，不派发实现。 | 否 |
| RFR-6A | 已完成 | `AlembicPlugin` | 第一轮真实修正：已在 Plugin first / Alembic install enhances 前提下，将 Plugin 旧 `lib/core` / `#core/*` governance 命名残留收敛为 `lib/governance` / `#governance/*`；分类确认 constitution / gateway / permission 属于 Plugin Codex 自洽闭环与 portable compatibility，不是可删旧残留。 | `docs/AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md`；AlembicPlugin `cef5e419440064c056d6b3408cd961fac5047b7a`；AlembicCodex runtime artifact `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`；`runtime.tgz` SHA-256 `dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`；总控复核残留扫描和 diff check 通过。 | 否 |
| RFR-6B | 已完成 | `AlembicWorkspace` | 基于 RFR-6A 真实 diff 和残留扫描，在 Plugin 可请求 Alembic service 的前提下重新分析下一轮修正对象：Plugin embedded runtime HTTP/service/injection/daemon、package 身份、MCP / Dashboard 口径或 Core/Agent 后续债。 | [repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)；确认下一轮不做大面积迁移，优先处理 Plugin HTTP `DashboardOperations` compatibility 命名歧义。 | 否 |
| RFR-6C | 已完成 | `AlembicPlugin` | 第二轮真实修正：已证明旧 Dashboard HTTP operation compatibility layer 的真实位置并收紧命名；用户后续确认 Dashboard 不再接入 Plugin，因此该 layer 不作为长期保留项，转入 RFR-6D 删除候选。 | `docs/AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md`；AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e`；AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`；`runtime.tgz` SHA-256 `c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`；总控复核残留扫描和 diff check 通过。 | 否 |
| RFR-6D | 已完成 | `AlembicPlugin` | 合并清理：已删除 Plugin 旧 Dashboard HTTP compatibility operation layer、旧 AI/Recipe fail-closed HTTP compatibility surface，并将 `lib/injection/modules/AgentModule.ts` 收敛为 `SkillHooksModule.ts`。 | `docs/AlembicPlugin/repository-folder-boundary-rfr-6d-plugin-batch-cleanup-2026-05-22.md`；AlembicPlugin `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`；AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`；`runtime.tgz` SHA-256 `417ba41d885171be06b74fdd167a3da5eea44640e3d772c15924f1e0f63adf92`；总控复核提交、残留扫描、runtime artifact 与验证证据通过。 | 否 |

## 窗口分派

RFR-6D 已由 `AlembicPlugin` 执行并通过总控验收。旧 Dashboard HTTP compatibility operation layer、旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP surface 已删除；只注册 SkillHooks 的 DI 模块已收敛为 `SkillHooksModule`。当前不发送执行提示词；下一步需先由总控滚动 TODO，再决定是否进入下一轮真实代码分析或独立质量线。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | RFR-6D 不改 Alembic 主仓库；Dashboard API 真实闭环保留在 Alembic daemon/API 与 AlembicDashboard 之间。 |
| `AlembicCore`<br>观察中 | RFR-6 确认 Core 的主要问题是 `src/core` / wildcard exports / deep import 迁移债；当前不直接搬源码，后续先做 public API closeout。 |
| `AlembicAgent`<br>观察中 | RFR-6 确认 Agent public API 较干净，主要是 AGENTS 路径口径与 `src/external/ai` 真实实现不一致；当前不派发。 |
| `AlembicDashboard`<br>观察中 | RFR-6D 不改 Dashboard 前端；Dashboard 继续消费 Alembic 主仓库 API，不接入 Plugin。 |
| `AlembicPlugin`<br>已完成 | RFR-6D 已通过总控验收：旧 Dashboard / AI / Recipe HTTP compatibility surface 已删除，`AgentModule.ts` 已收敛为 `SkillHooksModule.ts`，runtime artifact 已刷新并有验证证据。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；RFR-6D 属于 Plugin 代码边界和 runtime artifact 验证，先由 Plugin 窗口完成 build / targeted unit / plugin verify / channel verify。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## RFR-6A AlembicPlugin 执行要求

目标：做一轮真实修正，而不是继续停留在审计文档。处理 `AlembicPlugin` 中旧 `lib/core` / `#core/*` governance 命名残留，使 constitution / gateway / permission bounded context 的目录表达与实际职责一致，并为下一轮总控深挖收集真实代码证据。

前提：

- 长期路线固定为 `Plugin first, Alembic install enhances`。
- `AlembicPlugin` 是 Codex host agent 入口，负责 Codex MCP、Skill、channel、host project 对齐、prime / search / Guard 等 Codex-facing 入口和请求治理。
- `AlembicPlugin` 自己必须保持 Codex / IDE Agent 自洽闭环：MCP tool schema、tool result payload、Skill instruction、Codex 可见呐喊 / 诊断、tier / permission gate、host project resolution、baseline knowledge search、Guard 调用入口、runtime packaging、channel/cache 验证和无 Alembic 时的最小可用体验。
- `Alembic` 是本地增强底座。Alembic 安装且 daemon / service 可用时，Plugin 应通过明确 service request 消费 Alembic 的增强能力，而不是复制一套长期主实现。
- 旧功能的新认识必须先问：它是否属于 Plugin 的 Codex 自洽闭环；如果不是，再判断它是请求 Alembic service 的 client、无 Alembic 时的 portable compatibility，还是早期拆仓遗留的重复实现。

范围：

- 必须先读取 `AlembicPlugin/AGENTS.md`、本计划、[repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md) 和 `docs/AlembicPlugin/repository-folder-boundary-inventory-plugin-2026-05-22.md`。
- 必须先扫描并记录 `lib/core`、`#core/*`、`../core`、constitution/gateway/permission 的真实 imports、tests、scripts、runtime prepare / verify 影响。
- 必须在执行记录中为每个 `lib/core` 子目录写明分类：Plugin Codex 自洽闭环 / Alembic service request client / portable compatibility / 旧残留。分类要写真实消费方，不得只按目录名推断。
- 建议目标目录名为 `lib/governance/`，并将 package import alias 从 `#core/*` 改为 `#governance/*`；如执行窗口认为 Plugin embedded runtime 语境下应使用 `lib/embedded-runtime/governance/`，必须回填真实消费链路和命名理由。
- 如果发现某项本应通过 Alembic service 提供，不要在 RFR-6A 顺手重写服务请求链路；先记录 service request candidate、当前消费方、缺口和下一轮建议，除非当前 `lib/core` 命名修正无法安全完成。
- 更新源码 imports、`package.json` imports、测试 imports、必要文档和执行记录。
- 如源码进入 Codex runtime artifact，必须运行 runtime prepare / verify，并回填 AlembicCodex runtime artifact commit / tarball hash；如判断无需重建 runtime，必须说明依据。
- 保存执行记录到 `docs/AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md`，并回填当前计划。

禁止事项：

- 不移动 `lib/http/`、`lib/service/`、`lib/injection/`、`lib/daemon/`、`lib/external/mcp/`、`lib/codex/`、plugin shell、channel、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/` 或 `runtime.tgz` 所在路径。
- 不删除 HTTP compatibility routes、DashboardOperation compatibility、daemon-server、JobStore、git-diff checkpoint、resident search、prime shout、MCP tools 或 Codex runtime 能力。
- 不把“Plugin 可请求 Alembic service 的增强能力”误判为 Plugin 必须永久内置，也不把“Plugin 围绕 Codex / IDE Agent 的自洽闭环”误判为空壳 client，更不把“portable compatibility”误判为死代码。
- 不把完整实现改成薄 wrapper，不新增无真实调用方的兼容层，不顺手处理 package name、Dashboard help、Core exports 或 Agent 文档路径。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`
- `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig*.json vitest*.config.*`
- `git diff --check`

如果某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

## RFR-6D AlembicPlugin 合并清理确认项

状态：已完成，总控验收通过。

目标：把下一波 AlembicPlugin 小范围边界修正合并成一次执行，避免每次两三行修改都重建 runtime artifact。确认后，RFR-6D 同时处理三类真实残留：

1. 删除 Plugin 旧 Dashboard HTTP compatibility operation layer。Dashboard 已不再接入 Plugin，真实 Dashboard API 闭环在 `AlembicDashboard` -> `Alembic` daemon/API；Plugin 不应继续保留 `dashboard.*` operation id 兼容层。
2. 删除 Plugin 旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP compatibility surface。真实 AI / Recipe relation HTTP API 在 Alembic 主仓库；Plugin 不应继续表现为旧 Dashboard / Agent / AI HTTP 能力中心。
3. 处理 `AlembicPlugin/lib/injection/modules/AgentModule.ts` 命名残留。该模块当前只注册 `SkillHooks`，不承载 Agent runtime、AI provider runtime 或 tools runtime；应收敛为 SkillHooks 语义模块。

前提：

- 长期路线固定为 `Plugin first, Alembic install enhances`。
- `AlembicPlugin` 是 Codex host agent 入口，但不得重新引入本地 Agent runtime、AI provider runtime 或 Tool runtime。
- Dashboard 前端不接入 Plugin；Plugin 保留的是 `alembic_codex_dashboard` URL handoff 到本地 Alembic daemon，不是 Dashboard 反向消费 Plugin HTTP API。
- `SkillHooks` 属于 Plugin Codex 自洽闭环和 plugin delivery lifecycle，不是可删旧残留。
- 旧 `/ai/*` 与 `/recipes/discover-relations` route 如果只返回 `PLUGIN_AI_CONFIG_REMOVED` / `HOST_AI_MANAGED`，不能作为长期兼容层保留；除非扫描发现 Plugin 自有真实消费方，否则应删除或改到非 AI / 非 Dashboard 语义。

范围：

- 必须先读取 `AlembicPlugin/AGENTS.md`、本计划、[repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)、[repository-split-rfr-6d-real-code-analysis-2026-05-22.md](repository-split-rfr-6d-real-code-analysis-2026-05-22.md) 和 `docs/AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md`。
- 必须扫描并记录 Dashboard compatibility layer 的真实消费方：`lib/http/compatibility/operations/*`、`lib/http/routes/commands.ts`、`lib/http/routes/modules.ts`、`test/unit/DashboardCompatibilityOperations.test.ts`、runtime artifact、scripts、plugin/channel verify 和跨仓 `AlembicDashboard` / `Alembic` API 闭环。
- 删除候选包括 `DashboardCompatibilityOperations.ts`、`dashboard-compatibility-operation.ts`、`DashboardCompatibilityOperations.test.ts`、旧 `dashboard.*` operation id 分派和只服务该兼容层的 route handler。
- 受影响 route 的处理规则：没有真实 Plugin 消费方的 Dashboard 兼容端点应删除；若执行窗口发现某端点仍有 Plugin 自有消费方，必须改成非 Dashboard 命名的直接实现并写明消费方、输入输出和验证证据。
- 必须扫描并记录旧 AI / Recipe compatibility surface 的真实消费方：`lib/http/routes/ai.ts`、`lib/http/routes/recipes.ts`、`lib/http/HttpServer.ts` 的 route mount、相关 tests/scripts/runtime artifact，以及跨仓 `AlembicDashboard` / `Alembic` API 闭环。
- `/ai/lang`、`/ai/format-usage-guide` 如果仍有 Plugin 自有消费方，可保留但必须迁出 `/ai` 命名并写明后续清理条件；如果只有 Dashboard 历史消费，则随旧 `/ai` compatibility surface 删除。
- `/recipes/discover-relations` 如果仍有 Plugin 自有消费方，必须改成非 Agent/AI relation discovery 语义并写明真实 producer/consumer；否则删除。
- 必须扫描并记录 `lib/injection/modules/AgentModule.ts`、`lib/injection/ServiceContainer.ts`、`lib/injection/ServiceMap.ts`、`SkillHooks` 消费方、相关 tests、runtime prepare / verify 影响。
- 必须在执行记录中分类该 cluster：Plugin Codex 自洽闭环 / Alembic service request client / portable compatibility / 旧残留。分类要写真实消费方。
- 建议目标是将 `AgentModule.ts` 收敛为 `SkillHooksModule.ts` 或等价更准确名称，更新 imports / 调用点；具体命名以执行窗口真实调用链和最小 diff 为准。
- 必须保留 `skillHooks` service key、`SkillHooks` load / hook 行为、Codex Skill lifecycle、MCP skill handler 和 runtime artifact 外部行为。
- 必须保留 `alembic_codex_dashboard` MCP handoff、`CodexEnhancementRoute` / `CodexModuleBoundary` 中的 Dashboard URL handoff 语义和本地 Alembic daemon capability 状态。
- 必须保留 Alembic 主仓库 `/api/v1/ai/*`、`/api/v1/recipes/discover-relations` 与 AlembicDashboard 对这些 API 的真实消费；本波只改 Plugin。
- `candidates` route 中的 `HOST_AI_MANAGED` fail-closed 提示暂不纳入本波，避免混入候选补齐 / 润色 UI 语义。
- 如源码进入 Codex runtime artifact，必须运行 runtime prepare / verify，并回填 AlembicCodex runtime artifact commit / tarball hash；如判断无需重建 runtime，必须说明依据。
- 保存执行记录到 `docs/AlembicPlugin/repository-folder-boundary-rfr-6d-plugin-batch-cleanup-2026-05-22.md`，并回填当前计划。

禁止事项：

- 不删除 `SkillHooks`，不改变 `skillHooks` service key。
- 不新增 `@alembic/agent`、`#agent/*`、`#tools/*`、`#external/ai/*`、`lib/agent/**`、`lib/tools/**` 或 `lib/external/ai/**`。
- 不删除 `alembic_codex_dashboard` handoff tool，不删除 Dashboard URL handoff 状态字段，不改 Alembic 主仓库 Dashboard API，也不改 AlembicDashboard 前端。
- 不删除或改变 Alembic 主仓库真实 `/api/v1/ai/*`、`/api/v1/recipes/discover-relations` API；不改 AlembicDashboard 对 Alembic 主仓库 API 的消费。
- 不处理 `candidates` route 的 host-managed preview/enrich/refine 语义，不处理 `alembic_codex_bootstrap` / `alembic_codex_rescan` internal AI daemon job 工具。
- 不处理 `service` 整体、`daemon`、resident search、package 身份、Dashboard HelpView / i18n 或 Alembic DB boundary lint。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- test/integration/ServiceContainer.test.ts test/unit/KnowledgeService.test.ts test/unit/CodexModuleBoundary.test.ts`
- `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`
- `npm run build`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `rg -n "DashboardCompatibility|dashboard-compatibility|dashboard\\.update_module_map|dashboard\\.rebuild_semantic_index|dashboard\\.scan_project|dashboard\\.bootstrap_project|dashboard\\.cancel_bootstrap|dashboard\\.rescan_project|dashboard-operation" lib test bin scripts package.json tsconfig*.json vitest*.config.* plugins/alembic-codex/runtime/dist`
- `rg -n "routes/ai|aiRouter|/api/v1/ai|PLUGIN_AI_CONFIG_REMOVED|routes/recipes|recipesRouter|discover-relations|HOST_AI_MANAGED" lib test bin scripts package.json tsconfig*.json vitest*.config.* plugins/alembic-codex/runtime/dist`
- `rg -n "AgentModule|modules/AgentModule|agentModule" lib test bin scripts package.json tsconfig*.json vitest*.config.* plugins/alembic-codex/runtime/dist`
- `git diff --check`

如果某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

## RFR-6C AlembicPlugin 历史执行要求

状态：已完成。该阶段当时按“保留兼容协议、修正命名歧义”执行；用户后续确认 Dashboard 不再接入 Plugin 后，RFR-6D 已将其遗留的 `dashboard.*` operation layer 改为删除候选。当前派发以 RFR-6D 合并清理确认项为准。

目标：处理 `AlembicPlugin` 内部 HTTP `DashboardOperations` compatibility 命名歧义。当前代码中的 `dashboard.*` operation id 需要继续保留为外部兼容语义，但源码路径和内部命名不应让开发者误读为 Plugin 直接引用 Dashboard 前端或打包 `AlembicDashboard`。

前提：

- 长期路线固定为 `Plugin first, Alembic install enhances`。
- `AlembicPlugin` 是 Codex host agent 入口，同时保留 embedded runtime / portable compatibility 的最小自洽闭环。
- `Alembic` 是本地增强底座。RFR-6C 不新增 service bridge，不重写 Alembic resident service 请求链路。
- `dashboard.*` operation id 如果仍被 HTTP compatibility、tests、runtime artifact 或外部调用消费，必须保留；本波只修源码目录 / 内部命名歧义和执行记录。

范围：

- 必须先读取 `AlembicPlugin/AGENTS.md`、本计划、[repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md) 和 `docs/AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md`。
- 必须扫描并记录 `lib/http/dashboard/DashboardOperations.ts`、`lib/http/utils/dashboard-operation.ts`、`lib/http/routes/commands.ts`、`lib/http/routes/modules.ts`、相关 tests、runtime prepare / verify 影响。
- 必须在执行记录中分类该 cluster：Plugin Codex 自洽闭环 / Alembic service request client / portable HTTP compatibility / 旧残留。分类要写真实消费方。
- 建议目标是把源码目录和内部 helper 命名收敛到 `compat` 或 `operations` 语义；具体路径以执行窗口真实调用链和最小 diff 为准。
- 必须保持 HTTP routes、`dashboard.*` operation id、operation payload、runtime artifact 路径、Codex MCP tool schema、Skill contract 和 channel/cache 外部行为不变。
- 如源码进入 Codex runtime artifact，必须运行 runtime prepare / verify，并回填 AlembicCodex runtime artifact commit / tarball hash；如判断无需重建 runtime，必须说明依据。
- 保存执行记录到 `docs/AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md`，并回填当前计划。

禁止事项：

- 不移动 `lib/http/` 整体，不重构所有 routes，不把 HTTP compatibility operation 改成 Alembic service bridge。
- 不删除 `dashboard.*` operation id，除非扫描证明没有任何真实消费方且能提供替代入口；若要删除必须先回到总控确认。
- 不重写 `ResidentSearchClient`、`PrimeSearchPipeline`、`EnhancementRoute`、`ServiceRequestBoundary`、`CodexMcpServer` 或 daemon supervisor。
- 不处理 `alembic-ai` package 身份、Dashboard HelpView / i18n 文案、Core exports 或 Alembic DB boundary lint。

建议验证命令：

- `npm run build:check`
- `npm run test:unit -- test/unit/DashboardOperations.test.ts test/unit/CodexModuleBoundary.test.ts`
- `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`
- `npm run build`
- `npm run prepare:codex-plugin-runtime`
- `npm run verify:codex-plugin`
- `npm run verify:codex-channel`
- `rg -n "http/dashboard|dashboard-operation|DashboardOperations" lib test bin scripts package.json tsconfig*.json vitest*.config.* plugins/alembic-codex/runtime/dist`
- `git diff --check`

如果某条命令不存在或不适合当前最小改动，执行窗口可以替换为等价 targeted check，但必须说明替换原因。

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
| RFR-TODO-10 | 已完成 | 真实修正 | P0 | `AlembicPlugin` / `AlembicWorkspace` | RFR-6A 第一轮真实修正：在 Plugin first / Alembic install enhances 前提下，处理 Plugin 旧 `lib/core` / `#core/*` governance 命名残留，并收集真实 diff / runtime artifact / 残留扫描作为下一轮深入分析输入。 | 是，影响后续 Plugin 目录迁移、runtime artifact、cache 和真实 Codex 验证。 | AlembicPlugin `cef5e419440064c056d6b3408cd961fac5047b7a` 已通过总控验收；残留扫描和 diff check 通过。 | `AlembicWorkspace` |
| RFR-TODO-12 | 已完成 | 下一轮分析 | P0 | `AlembicWorkspace` | RFR-6A 完成后，总控基于真实提交 diff、残留扫描和 Plugin 回填，在 Plugin 可请求 Alembic service 的前提下重新判断下一轮修正对象：embedded runtime HTTP/service/injection/daemon、package 身份、MCP / Dashboard 口径或 Core/Agent 后续债。 | 是，决定下一轮派发。 | 已形成 [repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)，下一轮选择 Plugin HTTP `DashboardOperations` compatibility 命名歧义。 | `AlembicWorkspace` |
| RFR-TODO-13 | 已完成 | 真实修正 | P0 | `AlembicPlugin` | RFR-6C 第二轮真实修正：已处理 Plugin HTTP `DashboardOperations` compatibility 命名歧义，将源码路径 / 内部命名收敛为 compatibility / operations 边界；用户后续确认 Dashboard 不再接入 Plugin，因此该兼容层转入 RFR-6D 删除候选。 | 是，影响 Plugin embedded runtime / HTTP compatibility 理解、runtime artifact 和后续 cache 验证。 | AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e` 已通过总控验收；残留扫描和 diff check 通过；删除判断见 RFR-6D 合并分析。 | `AlembicWorkspace` |
| RFR-TODO-14 | 已完成 | 真实修正 | P0 | `AlembicPlugin` | RFR-6D 合并清理：删除 Plugin 旧 Dashboard HTTP compatibility operation layer、旧 AI/Recipe fail-closed HTTP compatibility surface，并同时处理 `AgentModule.ts` 命名残留，减少重复 runtime artifact 打包验证。 | 是，影响 Plugin HTTP surface、DI 边界、Skill lifecycle 可读性、runtime artifact 和后续 cache 验证。 | AlembicPlugin `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a` 已通过总控验收；runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014` 已刷新；旧 surface 残留扫描、Plugin/channel verify 和 diff check 通过。 | `AlembicPlugin` |
| RFR-TODO-15 | 观察中 | 清理候选 | P1 | `AlembicPlugin` | `candidates` route 中仍保留 `HOST_AI_MANAGED` fail-closed 语义；本波明确不混入候选补齐 / 润色 UI 语义，后续如继续收紧 Plugin HTTP surface，应单独分类该入口的真实消费方和命名边界。 | 否，当前不影响 RFR-6D 完成；影响后续 Plugin HTTP surface 语义清晰度。 | RFR-6D 回填确认只剩 candidates route 命中，符合本波保留边界；等待下一轮代码分析决定是否派发。 | `AlembicPlugin` |
| RFR-TODO-16 | 观察中 | 质量债 | P2 | `AlembicPlugin` | AlembicPlugin 既有 Biome lint 债仍在，主要命中 `lib/bootstrap.ts` 非空断言和 `lib/cli/SetupService.ts` console 使用；不属于 RFR-6D 引入问题。 | 否，当前 targeted build/unit/plugin/channel 验证均已通过；影响后续质量线。 | RFR-6D 额外 `npm run lint` 仍失败；后续按独立质量线处理，不塞回本波边界清理。 | `AlembicPlugin` |
| RFR-TODO-11 | 观察中 | contract / UI 口径 | P1 | `AlembicDashboard` / `AlembicPlugin` / `Alembic` | 对齐 MCP tool surface 和 Dashboard HelpView / i18n 文案，避免旧 `wiki_plan` / `wiki_finalize` / `knowledge_lifecycle` 口径与实际 Alembic / Plugin 工具分叉产生歧义。 | 否，当前不影响代码运行；影响开发者理解。 | RFR-6 深度审计发现；等待 RFR-6A 分类后决定是否单独派发 Dashboard。 | `AlembicDashboard` |
| RFR-TODO-7 | 无任务 | 真实复测 | P1 | `AlembicTest` | 如 RFR-2/RFR-3 改动影响 Codex plugin 或 resident service，创建真实复测单。 | 否 | RFR-3A 只改 Alembic 内部 governance 目录命名和 imports，当前不触发真实项目复测。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察中 | 否 | RFR-6D 不改 Alembic 主仓库；Dashboard API 真实闭环仍在 Alembic daemon/API。 |
| `AlembicCore` | 观察中 | 否 | RFR-6D 不触碰 Core public API / deep import。 |
| `AlembicAgent` | 观察中 | 否 | RFR-6D 不触碰 AlembicAgent 仓库，也不引入 Agent runtime。 |
| `AlembicDashboard` | 观察中 | 否 | RFR-6D 不改 Dashboard 前端；Dashboard 不接入 Plugin，继续消费 Alembic 主仓库 API。 |
| `AlembicPlugin` | 已完成 | 否 | RFR-6D 已通过总控验收；提交、runtime artifact、残留扫描和验证结果已记录。 |
| `AlembicTest` | 观察中 | 否 | RFR-6D 先由 Plugin 窗口完成 build / unit / runtime verify；暂无真实项目复测单。 |
| `BiliDili` | 无任务 | 否 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无，RFR-6D 已通过总控验收，当前无可发送窗口。

下一波需先由总控滚动 TODO / Backlog，识别下一处真实阻塞点，再按任务包规则派发。

不发送给：`Alembic`（观察中）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

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
- 2026-05-22：根据用户要求“不因为发现一个目标就停止”，总控完成 RFR-6 深度代码审计，新增 [repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)。审计确认：Alembic 与 AlembicPlugin 仍有 117 个共同 `lib` 相对路径，其中 69 个同名不同内容；Plugin portable runtime 兼容层是真实消费链路，不能按死代码删除；Plugin 仍保留旧 `lib/core` / `#core/*` governance 命名；Alembic 与 Plugin 的 `alembic-ai` package 身份存在发布语义歧义；MCP surface 已分叉但 Dashboard HelpView / i18n 有旧口径风险；Core 的 `src/core` / wildcard exports 是 public API 迁移债；Agent 主要是文档路径口径债；Alembic DB boundary lint 保持独立 TODO。当前无发送窗口，建议下一步先由用户确认是否启动 RFR-6A：`AlembicPlugin` embedded runtime 分类表。
- 2026-05-22：用户确认采用“先做一轮真实修正，然后收集真实代码，再深入分析下一轮”的持续增强节奏。总控激活 RFR-6A，只派发 `AlembicPlugin`，目标是处理 Plugin 旧 `lib/core` / `#core/*` governance 命名残留；完成后由总控基于真实 diff 和残留扫描启动 RFR-6B 深入分析。当前不派发 Alembic / Core / Agent / Dashboard / Test。
- 2026-05-22：用户补充确认长期前提：`Plugin first, Alembic install enhances`，`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座，Plugin 可以通过请求 Alembic service 工作。总控据此修订 RFR-6A：旧功能必须先分类为 Plugin-owned 请求治理、Alembic service request client、portable compatibility 或真正旧残留，不能把 service enhancement 误判为 Plugin 本地永久实现，也不能把 portable compatibility 误删。
- 2026-05-22：用户进一步强调 `AlembicPlugin` 自己也有围绕 Codex / IDE Agent 的自洽闭环，职责权衡微妙。总控再次修订 RFR-6A：旧功能分类顺序改为先判断是否属于 Plugin Codex 自洽闭环，再判断 Alembic service request client、portable compatibility 或旧残留，避免把 Plugin 做成空壳 client，也避免维护第二套 Alembic。
- 2026-05-22：`AlembicPlugin` 窗口完成 RFR-6A 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6-plugin-governance-2026-05-22.md`。完成范围：先复核 `lib/core`、`#core/*`、constitution/gateway/permission 调用链，确认 `constitution`、`gateway`、`permission` 属于 Plugin Codex 自洽闭环与 portable compatibility，不是 Alembic service client 或可删旧残留；将 `lib/core/{constitution,gateway,permission}` 迁入 `lib/governance/{constitution,gateway,permission}`，将 `#core/*` 改为 `#governance/*`，同步 bootstrap、HTTP、MCP embedded server、DI、targeted unit tests、Vitest alias、AGENTS 和 Codex runtime artifact。提交 hash：AlembicPlugin `cef5e419440064c056d6b3408cd961fac5047b7a`；AlembicCodex runtime artifact 子仓库 `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`；`runtime.tgz` SHA-256 `dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`。验证命令：`npm run build:check`、`npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`、`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`lib/core/#core` 残留扫描、`#governance/lib/governance` 正向扫描、`git diff --check`、`git -C plugins/alembic-codex diff --check`。验证结果：RFR-6A 必须项均通过；`npm run lint` 额外尝试仍失败于既有 Biome 债，等待后续质量线单独处理。遗留风险：`lib/http` / `lib/service` / `lib/injection` / `lib/daemon` 分类仍待 RFR-6B 深挖；本轮未刷新本机 Codex plugin cache、未创建 AlembicTest 复测单。
- 2026-05-22：总控验收 RFR-6A 通过。复核范围：`git -C AlembicPlugin show --name-status --stat HEAD`、`lib/core/#core` 负向扫描、`#governance/lib/governance` 正向扫描、AlembicCodex runtime artifact 子仓库状态、提交 diff check。功能完整性检查：Plugin governance 仍被 bootstrap、HTTP、MCP embedded server、DI 和 targeted tests 消费，runtime artifact 已同步；未触碰 HTTP/service/injection/daemon/external MCP/codex/plugin shell/channel/vendor/runtime artifact 所在路径。
- 2026-05-22：总控完成 RFR-6B 真实代码分析，新增 [repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)。分析确认下一轮不做 package 身份、大面积 HTTP/service/injection/daemon 搬迁、Dashboard HelpView 文案或 service bridge；RFR-6C 只派发 `AlembicPlugin`，处理 HTTP `DashboardOperations` compatibility 命名歧义，同时保留外部 `dashboard.*` operation id 和 HTTP route 行为。
- 2026-05-22：`AlembicPlugin` 窗口完成 RFR-6C 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md`。完成范围：先分类 `lib/http/dashboard/DashboardOperations.ts`、`lib/http/utils/dashboard-operation.ts`、`commands` / `modules` routes 消费链，确认该 cluster 是 Plugin portable HTTP compatibility operation dispatcher，不是 Dashboard 前端依赖或可删旧残留；将源码迁入 `lib/http/compatibility/operations/`，内部导出名收敛为 `DashboardCompatibility*`，保留外部 `dashboard.*` operation id、HTTP route、operation payload、Codex MCP tool schema、Skill contract、channel/cache 行为和 runtime artifact 外部路径。提交 hash：AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e`；AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`；`runtime.tgz` SHA-256 `c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`。验证命令：`npm run build:check`、`npm run test:unit -- test/unit/DashboardCompatibilityOperations.test.ts test/unit/CodexModuleBoundary.test.ts`、`npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、旧路径 / 旧内部名负向扫描、新 compatibility 正向扫描、`git diff --check`、`git -C plugins/alembic-codex diff --check`。验证结果：全部通过；残留风险是 `dashboard.*` 作为外部兼容协议仍保留，本轮未刷新本机 Codex plugin cache、未创建 AlembicTest 真实项目复测单。下一步建议：总控验收后，再决定是否继续选择 `lib/service` 或 `lib/injection` 的单个真实 cluster 做下一轮分类修正。
- 2026-05-22：总控验收 RFR-6C 通过。复核范围：AlembicPlugin 提交 `a535d16e6974fdcba2b643b64dc24c8315c9b51e`、AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`、旧 `http/dashboard` / `DashboardOperations` / `dashboard-operation` import 负向扫描、new compatibility operation 正向扫描、runtime artifact 子仓库状态和提交 diff check。功能完整性检查：外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema 和 channel/cache 行为保持不变；残留的 `kind: 'dashboard-operation'` 属于 fallback manifest payload 兼容语义，不是源码目录边界残留。
- 2026-05-22：总控完成 RFR-6D 真实代码分析，新增 [repository-split-rfr-6d-real-code-analysis-2026-05-22.md](repository-split-rfr-6d-real-code-analysis-2026-05-22.md)。当时分析确认下一轮不做整个 `service`、整个 `injection` 或整个 `daemon`，原计划只派发 `AlembicPlugin` 处理 `AgentModule.ts` 命名残留。
- 2026-05-22：用户修正 Dashboard 不再接入 Plugin，要求总控思考 RFR-6C 保留兼容层后续如何清理，并建议多个小任务合并执行，避免 AlembicPlugin 每次小改都单独打包验证。总控新增并补充 [repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)，将 RFR-6D 从单独 `AgentModule` 命名修正改为待确认合并批处理：删除 Plugin 旧 Dashboard HTTP compatibility operation layer、旧 `/ai/*` 与 `/recipes/discover-relations` fail-closed HTTP compatibility surface，同时收敛 `AgentModule.ts` 为 SkillHooks 语义模块。当前发送窗口改为无，等待用户确认删除范围。
- 2026-05-22：`AlembicPlugin` 完成 RFR-6D 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6d-plugin-batch-cleanup-2026-05-22.md`。完成范围：删除旧 Dashboard HTTP compatibility operation layer、旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP compatibility surface；`AgentModule.ts` 收敛为 `SkillHooksModule.ts`；新增 Plugin HTTP surface boundary 单元测试；同步 Codex runtime artifact。提交：AlembicPlugin `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`，AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`，`runtime.tgz` SHA-256 `417ba41d885171be06b74fdd167a3da5eea44640e3d772c15924f1e0f63adf92`。验证：build:check、targeted unit、ServiceContainer targeted integration、Codex MCP/session unit、build、runtime prepare、plugin/channel verify、旧 surface 残留扫描和 diff check 均通过；`HOST_AI_MANAGED` 仅剩 candidates route，符合本波保留边界；额外 `npm run lint` 仍失败于既有 Biome 债。回填后进入 RFR-6D 待验收，暂不创建 AlembicTest 测试单。
- 2026-05-22：总控验收 RFR-6D 通过。复核范围：AlembicPlugin 提交 `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`、AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`、执行记录中的旧 Dashboard / AI / Recipe HTTP surface 负向扫描、`AgentModule` 负向扫描、`SkillHooksModule` 语义保留、Plugin/channel verify 和 diff check。功能完整性检查：Plugin Codex 自洽闭环仍保留 `skillHooks` service key、`SkillHooks` load 行为、MCP skill/guard hook 消费链和 runtime artifact；旧 Dashboard HTTP compatibility operation layer 与旧 fail-closed HTTP routes 已无真实消费方且已删除；RFR-6D 不需要 AlembicTest 真实项目复测单。后续观察项：`candidates` route 的 `HOST_AI_MANAGED` 语义和 AlembicPlugin 既有 Biome lint 债已转入 TODO。
