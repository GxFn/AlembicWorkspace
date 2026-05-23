# AlembicWorkspace Current Status

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：CCIC-3 待启动（发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`）

## 状态摘要

当前主线为：[capability-code-interface-cleanup-workspace-plan-2026-05-22.md](capability-code-interface-cleanup-workspace-plan-2026-05-22.md)：按各仓库长期职责进行能力代码梳理、接口清洁、冗余删除和边界收敛。CCIC-1 / CCIC-2 已通过总控验收；当前进入 CCIC-3 待启动。

前序 GFBD 主线已完成：[global-function-boundary-design-workspace-plan-2026-05-22.md](global-function-boundary-design-workspace-plan-2026-05-22.md)：总控统一设计 Alembic 系列仓库的全局职责功能划分长期文档，同时派发各窗口做真实代码挖掘，并已完成总控验收与长期契约整合。

长期职责契约已生效：[alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md)。

长期职责功能划分方案已新增：[alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md)。该方案基于长期契约和六份 GFBD 证据，补充能力分层、能力流、归属判断步骤、跨仓库连接方式和开发者可读检查卡；不新增执行窗口。

CCIC-1 已完成并通过总控验收：`Alembic` DB boundary lint、`AlembicCore` public API closeout 证据、`AlembicAgent` host-agent 口径、`AlembicDashboard` host-managed/UI 文案、`AlembicPlugin` host-managed AI 边界语义均已封口。

本轮 CCIC-3 派发 `AlembicCore`、`Alembic`、`AlembicPlugin` 三个窗口。任务包分别是 Core high-reference facade readiness、Alembic `lib/external/mcp` resident tool handler 命名迁移第一片、Plugin audit 双轨 contract 收敛。`AlembicAgent` 无任务，`AlembicDashboard` 观察中，`AlembicTest` 本波无任务。

发送窗口：`AlembicCore`、`Alembic`、`AlembicPlugin`。

不发送给：`AlembicAgent`（无任务）、`AlembicDashboard`（观察中）、`AlembicTest`（无任务）、`BiliDili`（无任务）。

前序 RFR 主线已完成：RFR-6D 已通过总控验收，`AlembicPlugin` 旧 Dashboard / AI / Recipe HTTP compatibility surface 已删除，`AgentModule.ts` 已收敛为 `SkillHooksModule.ts`；相关全局 TODO 已收口为已完成。

## 前序 RFR 摘要

以下为上一主线背景，供新职责文档设计参考。

总控已完成 RFR-0 和 RFR-1：

- 原始计划：[../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/original-plan-2026-05-22.md)。
- 需求设计：[../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/requirement-design-2026-05-22.md)。
- 代码依赖调研：[../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md](../requirement-designs/repository-folder-boundary-restructure/code-implementation-dependency-research-2026-05-22.md)。
- RFR-1 五个产品仓库路径依赖清单均已回填并通过总控验收；五个产品仓库工作区干净，没有产品源码迁移。
- RFR-2A 已通过总控验收：`lib/codex` runtime/status/diagnostics/preflight 已迁入内部语义目录，AlembicPlugin 提交 `6abb643e62cceed4642028b4000fc5ed518dda43`，AlembicCodex runtime artifact 子仓库提交 `bded1ee21f33a7f4e68fa69ddad3e304f6fa7cab`；总控补跑 targeted unit、plugin verify、channel verify 均通过。
- RFR-2B 已通过总控验收：`CodexMcpServer.ts` 内部 helper 已抽入 `lib/external/mcp/codex/`，MCP server 入口、tool schema、Skill contract 和 runtime artifact 外部路径保持不变；AlembicPlugin 提交 `7afd689dc1654611b7f9de742aa170a3a9de7fa3`，AlembicCodex runtime artifact 子仓库提交 `b47d44a8558570cef2a2195c9b0b7eb13d020d95`，`runtime.tgz` SHA-256 `1a4d66a33511ddc7a88e20d3dae9bb30a7c2a2c20fe2db63f2a828b8c2a4281f`。总控补跑 RFR-2B targeted unit、plugin verify、channel verify 和提交 diff check 均通过。
- RFR-3A 已通过总控验收：主仓库 `lib/core` constitution / gateway / permission 已迁入 `lib/governance`，提交 `07273a64a413c59a8d5b247f098859d9658a1985`；总控补跑 build:check、targeted unit、release package guard、负向扫描和 diff check 通过。
- `npm run lint:repo-boundary` 曾因既有 DB boundary 违规失败，命中 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts` 等文件；已由 CCIC-P1-A 修复，当前 `npm run lint:repo-boundary` 通过。
- RFR-6 已完成深度代码审计：[repository-split-residue-deep-audit-2026-05-22.md](repository-split-residue-deep-audit-2026-05-22.md)。总控确认 RFR-3A 不是整体完成；拆仓残留仍包括 `AlembicPlugin` embedded runtime 边界、Plugin 旧 `lib/core` / `#core/*`、主产品 package 与 Plugin runtime package 身份重叠、MCP surface 分叉与 Dashboard help 旧口径、Core deep export 迁移债、Agent 文档路径口径债和 Alembic DB boundary lint 债。
- 用户已确认采用“先做一轮真实修正，然后收集真实代码，再深入分析下一轮”的持续增强节奏。
- RFR-6A 已通过总控验收：旧 `lib/core` / `#core/*` governance 命名残留已收敛为 `lib/governance` / `#governance/*`；constitution / gateway / permission 已分类为 Plugin Codex 自洽闭环与 portable compatibility，不是可删旧残留。AlembicPlugin 提交 `cef5e419440064c056d6b3408cd961fac5047b7a`，AlembicCodex runtime artifact 子仓库提交 `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`，`runtime.tgz` SHA-256 `dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`；总控复核残留扫描、runtime artifact 状态和提交 diff check 通过。
- 用户补充确认长期前提：`Plugin first, Alembic install enhances`。`AlembicPlugin` 是 Codex host agent 入口，`Alembic` 是本地增强底座；Plugin 可以通过请求 Alembic service 工作。因此 RFR-6A 需要把旧功能先分类为 Plugin-owned 请求治理、Alembic service request client、portable compatibility 或旧残留，再做最小真实修正。
- 用户进一步强调 `AlembicPlugin` 自己也有围绕 Codex / IDE Agent 的自洽闭环，不能把 Plugin 做成空壳 client。RFR-6A 分类顺序修正为：先判断是否属于 Plugin Codex 自洽闭环，再判断 Alembic service request client、portable compatibility 或旧残留。
- RFR-6B 总控真实代码分析已完成：[repository-split-rfr-6b-real-code-analysis-2026-05-22.md](repository-split-rfr-6b-real-code-analysis-2026-05-22.md)。下一轮不做 package 身份、大面积 HTTP/service/injection/daemon 搬迁、Dashboard HelpView 文案或 service bridge；RFR-6C 只派发 `AlembicPlugin`，处理 HTTP `DashboardOperations` compatibility 命名歧义，同时保留外部 `dashboard.*` operation id 和 HTTP route 行为。
- RFR-6C 已通过总控验收：[../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md](../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md)。完成范围：`DashboardOperations` cluster 分类为 Plugin portable HTTP compatibility operation dispatcher，源码迁入 `lib/http/compatibility/operations/`，内部命名收敛为 `DashboardCompatibility*`；外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径、Codex MCP tool schema、Skill contract 和 channel/cache 行为保持不变。提交：AlembicPlugin `a535d16e6974fdcba2b643b64dc24c8315c9b51e`，AlembicCodex runtime artifact `85c8fbdc2a94d86a4f721301c42a3fe618c4da76`，`runtime.tgz` SHA-256 `c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`；总控复核残留扫描、runtime artifact 状态和提交 diff check 通过。
- RFR-6D 总控原真实代码分析已完成：[repository-split-rfr-6d-real-code-analysis-2026-05-22.md](repository-split-rfr-6d-real-code-analysis-2026-05-22.md)。用户进一步修正：Dashboard 已不再接入 Plugin，RFR-6C 保留的 Dashboard HTTP compatibility operation layer 不应作为长期兼容继续保留；同时 AlembicPlugin 小改动不应每次单独打包验证。总控已补充合并清理分析：[repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)。用户已确认执行，`AlembicPlugin` 已回填并通过总控验收：旧 Dashboard HTTP compatibility operation layer、旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP surface 已删除，`AgentModule.ts` 已收敛为 `SkillHooksModule.ts`。提交：AlembicPlugin `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`，AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`，`runtime.tgz` SHA-256 `417ba41d885171be06b74fdd167a3da5eea44640e3d772c15924f1e0f63adf92`；旧 surface 残留扫描、Plugin/channel verify 和 diff check 证据通过。

当前发送窗口：`AlembicCore`、`Alembic`、`AlembicPlugin`。

当前不发送给：`AlembicAgent`（无任务）、`AlembicDashboard`（观察中）、`AlembicTest`（无任务）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 执行 CCIC-P3-A：`lib/external/mcp` resident tool handler 命名迁移第一片，新语义入口 + 内部 consumer replacement + legacy alias。 |
| `AlembicCore`<br>待启动 | 执行 CCIC-P3-C：high-reference facade readiness，补 `knowledge` / `evolution` / `repositories` / `core/enhancement` 替代入口证据。 |
| `AlembicAgent`<br>无任务 | CCIC-1 已完成；本波不涉及 AlembicAgent runtime、provider 或 tool system。 |
| `AlembicDashboard`<br>观察中 | 本波不收窄 host-managed parser；Dashboard canonical contract 继续观察，等 Plugin 专门 contract 轮次再启动。 |
| `AlembicPlugin`<br>待启动 | 执行 CCIC-P3-P：Audit 双轨 contract 收敛，删除无消费方 `AuditRepositoryImpl` 或统一唯一后端，并同步 runtime artifact 判断。 |
| `AlembicTest`<br>无任务 | 本波不操作真实项目；只有 CCIC-3 改动影响 Codex plugin cache、Dashboard 手动体验或真实项目路径时再创建测试单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`AlembicCore`、`Alembic`、`AlembicPlugin`。

不发送给：`AlembicAgent`（无任务）、`AlembicDashboard`（观察中）、`AlembicTest`（无任务）、`BiliDili`（无任务）。

```text
先读取 AGENTS.md、docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md，以及你所在窗口/目标仓库的 AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给你所在窗口的 CCIC-3 任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-23：用户要求深入思考目标、设计方案并继续下一批派发计划。总控基于 CCIC-2 验收后的真实代码扫描激活 CCIC-3，发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`。任务包：Core high-reference facade readiness；Alembic resident tool handler 命名迁移第一片；Plugin audit 双轨 contract 收敛。`AlembicAgent` 无任务，`AlembicDashboard` 观察中，`AlembicTest` 无任务，原因是本波不直接改变真实项目 prime/search/cold-start 用户路径。

- 2026-05-23：总控完成 CCIC-2 验收。复核范围：Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790`、AlembicCore `4d8d1df417e5f34d5166627bcdbf28547b04736a`、AlembicPlugin `90d00e923f43017d4ae9aaaa927b7d540effb6cf`、AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`。总控复核 `diff --check`、Alembic Core deep import 负向扫描、Core provider / Agent runtime 口径负向扫描、Plugin raw DB 访问负向扫描和四个工作区干净状态均通过。CCIC-2 标为已验收；`AlembicTest` 本波不创建测试单，原因是本轮不改变真实项目 prime/search/cold-start 用户路径，也未刷新本机 Codex plugin cache。

- 2026-05-23：`AlembicPlugin` 完成 CCIC-P2-P 并回填，文档见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-2-2026-05-23.md`。完成范围：新增 Plugin database infrastructure helper，收敛 daemon health、Codex KnowledgeState、CleanupService、HitRecorder 的 raw sqlite / `prepare()` / `getDb()` 访问；删除无消费方旧 `lib/types/database.ts`；新增 targeted unit；同步 AlembicCodex runtime artifact。提交 AlembicPlugin `90d00e923f43017d4ae9aaaa927b7d540effb6cf`，AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`，`runtime.tgz` SHA-256 `ac244ca4471e0e43fd1e2bb142468d1a2ae478d52350ca8742217a1073bcad03`。验证：repo-boundary lint、build:check、targeted unit 5 files / 48 tests、targeted Biome、raw DB 负向扫描、build、runtime prepare、plugin/channel verify、agent boundary report、Agent / AI / tool 禁止项扫描和 diff check 均通过；已通过总控验收。

- 2026-05-23：`AlembicCore` 完成 CCIC-P2-C 并回填，文档见 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-2-2026-05-23.md`。完成范围：补充 `@alembic/core/core/discovery`、`@alembic/core/core/AstAnalyzer`、`@alembic/core/core/ast` 到 `@alembic/core/project-intelligence` 的 readiness，明确 `@alembic/core/core/enhancement` 暂保持 transitional；清理 `BatchEmbedder` 中具体 OpenAI / Gemini / provider ownership 口径，清理 `Logger` 中 `AgentRuntime` / `ToolRegistry` 高亮标签，补充 project-intelligence facade 断言测试。提交 AlembicCore `4d8d1df417e5f34d5166627bcdbf28547b04736a`；验证：build:check、public API policy / boundary / closeout、targeted Vitest、三仓库 consumer boundary scan、口径负向扫描、lint、diff check 均通过；已通过总控验收。

- 2026-05-23：`Alembic` 完成 CCIC-P2-A 并回填，文档见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-2-2026-05-23.md`。完成范围：`scripts/bench-real-projects.mts` 与 `scripts/collect-test-project-stats.mts` 从 Core deep imports 迁移到 `@alembic/core/project-intelligence`，关闭 4 个 consumer boundary issue；`bench-real-projects` 使用 `loadProjectAstPlugins()` 和 `isProjectAstAvailable()`；保留 allowlisted `@alembic/core/core/enhancement` 并写明原因；补齐 `lib/external/mcp` resident handler / legacy schema / 不得删除 / 删除候选分类表。提交 Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790`；验证：`npm run lint:consumer-core-imports`、`npm run lint:core-import-boundary`、`npm run build:check`、`npm run lint:repo-boundary`、`npm run test:unit -- test/unit/CorePublicSurfaceSmoke.test.ts`、targeted Biome、Core deep import 负向扫描和 `git diff --check HEAD^ HEAD` 均通过；已通过总控验收。

- 2026-05-23：用户要求继续在明确各代码库职责和清理冗余上深度挖掘并派发计划。总控基于 CCIC-1 回填和真实代码扫描激活 CCIC-2，发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`。本轮不发送 `AlembicAgent`，原因是 Agent runtime / provider / tool system 不受影响；`AlembicDashboard` 观察中，原因是本波不收窄 host-managed parser；`AlembicTest` 无任务，原因是本波尚未触发真实项目复测、cache 刷新或 Dashboard 手动体验验证。

- 2026-05-23：总控完成 CCIC-1 验收。五个产品窗口均通过：`Alembic` DB boundary lint 修复与 `lib/external/mcp` 消费方盘点成立；`AlembicCore` public API / deep import closeout 证据成立，本波未删 export；`AlembicAgent` host agent / internal runtime 口径清洁成立，未改变 runtime；`AlembicDashboard` host-managed consumer 宽兼容和 Help/i18n 口径清洁成立；`AlembicPlugin` canonical host-managed boundary、legacy compatibility、无消费方私有残留删除与 runtime artifact 同步成立。五个产品仓库 `git status --short` 均无输出。CCIC-2 候选已写入当前计划 TODO：Alembic scripts Core deep import replacement、`lib/external/mcp` 命名收敛、Plugin repo-boundary 债、host-managed canonical contract、发布身份澄清和 Core 口径清洁。`AlembicTest` 本波无任务，原因是本轮未改变真实项目 prime/search/cold-start 行为，产品窗口已有 targeted build/test/scans 与 runtime artifact 证据。

- 2026-05-22：用户提出新思路：总控统一思考全局职责功能划分长期文档，同时派发各窗口做真实代码挖掘。总控创建 [global-function-boundary-design-workspace-plan-2026-05-22.md](global-function-boundary-design-workspace-plan-2026-05-22.md) 和长期草案 [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md)。当前进入 GFBD-1，只派发证据采集任务，不改产品源码，不运行真实项目测试。
- 2026-05-22：用户指出 `AlembicCore` 在 GFBD-P1-C 中把自身当成了 `AlembicAgent`。总控记录为证据质量问题，不进入 GFBD-2 整合；当时发送窗口改为 `AlembicCore` 返工纠偏。
- 2026-05-22：`AlembicCore` 已按 Core 身份完成 GFBD-P1-C 返工并回填，文档见 `docs/AlembicCore/global-function-boundary-evidence-core-2026-05-22.md`；当前发送窗口改为无，等待总控统一验收和 GFBD-2 整合。
- 2026-05-22：总控重新以 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 六个窗口均完成为基线进行 GFBD-1 验收。六份证据均满足本轮只读证据采集要求，没有产品源码改动或真实项目测试；Core 返工后身份口径正确。GFBD-2 已完成，长期职责契约 [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md) 已生效，当前等待用户指定下一主线。
- 2026-05-22：根据用户要求，基于长期契约和六份 GFBD 证据新增长期方案 [alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md)，用于指导后续能力归属、跨仓库连接、删除 / 下沉判断和开发者可读检查；本轮不派发窗口。
- 2026-05-22：用户要求按各仓库职责进行能力代码梳理、清洁整理接口、删除冗余并计划派发。总控创建 [capability-code-interface-cleanup-workspace-plan-2026-05-22.md](capability-code-interface-cleanup-workspace-plan-2026-05-22.md)，当前进入 CCIC-1，发送给 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`；`AlembicTest` / `BiliDili` 无任务。
- 2026-05-22：`AlembicDashboard` 完成 CCIC-P1-D 并回填，执行记录见 `docs/AlembicDashboard/capability-code-interface-cleanup-dashboard-2026-05-22.md`。提交：AlembicDashboard `502b078c4d1a7123542ae4bce4d92bf916c79c8f`；验证：`npm run build`、固定 MCP / Skill / internal tool 数量与旧 `Agent Runtime` 文案负向扫描、host-managed 兼容扫描、`git diff --check`、`git status --short` 均符合本轮要求。当前不建议继续发送给 `AlembicDashboard`，等待总控统一验收。
- 2026-05-22：`AlembicCore` 完成 CCIC-P1-C 并回填，文档见 `docs/AlembicCore/capability-code-interface-cleanup-core-2026-05-22.md`；已通过总控验收。
- 2026-05-22：`AlembicAgent` 完成 CCIC-P1-G 并回填，文档见 `docs/AlembicAgent/capability-code-interface-cleanup-agent-2026-05-22.md`；完成范围覆盖 internal Agent runtime / Codex host agent / MCP-like adapter 口径清洁，提交 `929cded9e449823f0f6e4feae27f15f249352c3a`，`npm run build:check`、`npm run test -- test/contract-surface.test.ts`、`git diff --check` 均通过；已通过总控验收。
- 2026-05-22：`Alembic` 完成 CCIC-P1-A 并回填，文档见 `docs/Alembic/capability-code-interface-cleanup-main-2026-05-22.md`；完成范围覆盖 DB boundary lint 修复、database infrastructure helper、新增 `AuditStoreQueries` / `SqliteDatabaseAccess`、`lib/external/mcp` 消费方盘点和后续候选。提交 Alembic `df36eb364b3a2d5e8e1868f2db979ffea8d974f8`；`npm run lint:repo-boundary`、`npm run build:check`、targeted unit tests、targeted Biome、`git diff --check HEAD^ HEAD` 均通过；已通过总控验收。
- 2026-05-22：`AlembicPlugin` 完成 CCIC-P1-P 并回填，文档见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-2026-05-22.md`；完成范围覆盖 host-managed boundary helper、candidates / extract / ModuleService canonical 字段、legacy `HOST_AI_MANAGED` / `hostManaged` 兼容、无消费方私有残留删除和 AlembicCodex runtime artifact 同步。提交 AlembicPlugin `de77740f20a7178c195030bb871b634a202c7a3c`，AlembicCodex runtime artifact 子仓库 `b7373430aa155f2980fe6e0e10e269e2707bd0a2`，`runtime.tgz` SHA-256 `044f8f52887f27f0c32c0f961a426eaba4461cd62803afcd5286355c8e2117a3`；targeted unit、`npm run build:check`、targeted Biome、runtime prepare、plugin/channel verify、agent boundary report、负向扫描和 diff check 通过；`npm run lint:repo-boundary` 仍失败于 AlembicPlugin 既有 DB boundary 债，非本轮引入，已在 CCIC-P2-P 关闭；已通过总控验收。
- 2026-05-22：`Alembic` 完成 GFBD-P1-A 真实代码挖掘并回填，文档见 `docs/Alembic/global-function-boundary-evidence-main-2026-05-22.md`；当前不建议继续发送给 `Alembic`，等待总控统一验收。
- 2026-05-22：`AlembicAgent` 完成 GFBD-P1-G 真实代码挖掘并回填，文档见 `docs/AlembicAgent/global-function-boundary-evidence-agent-2026-05-22.md`；当前不建议继续发送给 `AlembicAgent`，等待总控统一验收。
- 2026-05-22：`AlembicDashboard` 完成 GFBD-P1-D 真实代码挖掘并回填，文档见 `docs/AlembicDashboard/global-function-boundary-evidence-dashboard-2026-05-22.md`；当前不建议继续发送给 `AlembicDashboard`，等待总控统一验收。
- 2026-05-22：`AlembicPlugin` 完成 GFBD-P1-P 真实代码挖掘并回填，文档见 `docs/AlembicPlugin/global-function-boundary-evidence-plugin-2026-05-22.md`；当前不建议继续发送给 `AlembicPlugin`，等待总控统一验收。完成范围覆盖 Codex MCP / Skill / channel / runtime artifact、Codex runtime/status/diagnostics/preflight、resident service client、candidate fail-closed route、governance 和 SkillHooks；未改产品源码、未移动目录、未删除兼容层、未运行真实项目测试。
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
- 2026-05-22：用户修正 Dashboard 不再接入 Plugin，要求总控思考 RFR-6C 保留兼容层后续如何清理，并建议多个小任务合并执行，避免 AlembicPlugin 每次小改都单独打包验证。总控新增并补充 [repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md](repository-split-rfr-6d-batch-cleanup-analysis-2026-05-22.md)，将 RFR-6D 从单独 `AgentModule` 命名修正改为待确认合并批处理：删除 Plugin 旧 Dashboard HTTP compatibility operation layer、旧 `/ai/*` 与 `/recipes/discover-relations` fail-closed HTTP compatibility surface，同时收敛 `AgentModule.ts` 为 SkillHooks 语义模块。当前发送窗口改为无，等待用户确认删除范围。
- 2026-05-22：`AlembicPlugin` 完成 RFR-6D 并回填，执行记录见 `docs/AlembicPlugin/repository-folder-boundary-rfr-6d-plugin-batch-cleanup-2026-05-22.md`。完成范围：删除旧 Dashboard HTTP compatibility operation layer、旧 `/api/v1/ai/*` 与 `/api/v1/recipes/discover-relations` fail-closed HTTP compatibility surface；`AgentModule.ts` 收敛为 `SkillHooksModule.ts`；新增 Plugin HTTP surface boundary 单元测试；同步 Codex runtime artifact。提交：AlembicPlugin `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`，AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`，`runtime.tgz` SHA-256 `417ba41d885171be06b74fdd167a3da5eea44640e3d772c15924f1e0f63adf92`。验证：build:check、targeted unit、ServiceContainer targeted integration、Codex MCP/session unit、build、runtime prepare、plugin/channel verify、旧 surface 残留扫描和 diff check 均通过；`HOST_AI_MANAGED` 仅剩 candidates route，符合本波保留边界；额外 `npm run lint` 仍失败于既有 Biome 债。回填后进入 RFR-6D 待验收，暂不创建 AlembicTest 测试单。
- 2026-05-22：总控验收 RFR-6D 通过。复核范围：AlembicPlugin 提交 `433e41e5aa1d5de060eca08b1dbbeb3c132b3c9a`、AlembicCodex runtime artifact `c270080c8861163d13bf4b850374c9e02dd72014`、旧 Dashboard / AI / Recipe HTTP surface 负向扫描、`AgentModule` 负向扫描、Plugin/channel verify 和 diff check。后续观察项：`candidates` route 的 `HOST_AI_MANAGED` 语义和 AlembicPlugin 既有 Biome lint 债已转入当前计划 TODO。
