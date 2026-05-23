# Capability Code Interface Cleanup Workspace Plan

日期：2026-05-23
状态：已完成，CCIC-8 总体验收通过，待归档，发送给无
总控窗口：AlembicWorkspace

## 目标

本计划基于已生效的全局职责契约和长期职责功能划分方案，按各仓库真实职责进行能力代码梳理、接口清洁、冗余删除和边界收敛。

长期依据：

- [alembic-global-responsibility-function-division-scheme.md](../../../alembic-global-responsibility-function-division-scheme.md)
- [alembic-repository-responsibility-function-boundary-contract.md](../../../alembic-repository-responsibility-function-boundary-contract.md)
- [global-function-boundary-design-workspace-plan-2026-05-22.md](../global-function-boundary-design/global-function-boundary-design-workspace-plan-2026-05-22.md)

本计划不是重新发明职责边界，而是把 GFBD 后续候选和全局 TODO 中已经有证据的事项，滚动组合成可执行任务包。所有删除、重命名、接口清洁都必须保留真实替代入口、消费方扫描、负向扫描和验证命令。

## 目标完成定义与后续阶段

当前是否达到目标：已达到本轮主线完成定义。CCIC-1 到 CCIC-8 已经关闭一批明确的边界债、high-reference consumer replacement、residual readiness 分类、resident handler retained consumer 收窄、可安全行动的 residual replacement / alias closeout、Plugin 旧 Dashboard / 旧调用方兼容删除、Plugin runtime 身份重命名和 Alembic `lib/external/mcp` entrypoint pruning。总目标不是“deep import 数字下降”或“派完下一批任务”，而是让各仓库能力代码、接口和兼容残留能被长期职责边界解释清楚，并能通过真实调用链和验证命令证明没有功能缺失；本轮主线已通过总体验收，剩余 Core `normalizeLifecycle` additive readiness 转入全局长期观察，不阻塞归档。

最终完成定义：

- `AlembicCore` public API / facade 账本清楚：stable、provisional、keep-transitional、test-only、consumer-replace-later 都有真实消费方证据、保留理由和后续触发条件；不得存在“没人敢动但也没人能解释”的 public export。
- `Alembic` 本地增强底座边界清楚：CLI、daemon、HTTP/API、resident service handler、Dashboard server、internal jobs 和 local install/release 都保留真实入口；`lib/external/mcp` 旧路径要么已迁到 Alembic-owned 语义入口，要么有 retained consumer、保留理由和删除条件。
- `AlembicPlugin` Codex host agent 入口边界清楚：MCP tool schema、Skill、runtime artifact、channel/cache、resident service client 和 portable fallback 保持完整；不重新引入外部 AI / Agent / Tool runtime，不把 Plugin 做成 Alembic daemon 的空壳 client。
- `AlembicAgent` 和 `AlembicDashboard` 没有被其它仓库职责误伤：Agent runtime / provider / tool system 不被 Plugin 或 Core 吞掉；Dashboard 只消费 Alembic API / UI contract，不再作为 Plugin 兼容层借口。
- 所有删除、兼容保留和 transitional 入口都要有扫描、替代入口、验证命令、回填文档和 TODO 状态；没有未解释的主线 TODO 阻塞归档。

目标导向后续阶段：

| 阶段 | 目标导向 | 预计动作 | 进入条件 | 完成后判断 |
| --- | --- | --- | --- | --- |
| CCIC-5 | 先分清残留性质，避免盲目删或盲目迁。 | Core residual readiness 分类、Alembic `external/mcp` retained consumer 收窄、Plugin runtime impact 分类。 | CCIC-4 已验收。 | 得到可删 / 可迁 / 必须保留 / 等待上游的清单。 |
| CCIC-6 | 只执行 CCIC-5 证明“现在可以安全行动”的项。 | 基于 P5 证据做 consumer replacement、alias 删除、allowlist 收紧或确认不做；不处理仍无替代入口的项。 | CCIC-5 三窗口回填并通过总控验收。 | 关闭一批真实残留，或把不可动项转成明确长期 contract。 |
| CCIC-7 | 收束 Plugin 旧 Dashboard / 旧调用方残留和 Alembic resident handler 旧命名。 | Plugin 删除所有旧 Dashboard / 旧调用方兼容，仅保留本地 Alembic Dashboard URL handoff；Plugin package / runtime 身份改成 IDE plugin artifact 语义；Alembic 从入口继续剪枝 `lib/external/mcp`，把仍需要的能力迁到 Alembic-owned resident / service 位置。 | CCIC-6 已验收，用户已确认 CCIC-7 删除和重命名口径。 | Plugin / Alembic 回填提交、验证和删除证据后再判断是否进入 CCIC-8 总体验收或追加 Core service contract 对齐。 |
| CCIC-8 | 总体验收与归档。 | 滚动 TODO、复核各仓库工作区 / 提交 / 验证、必要时创建 AlembicTest 测试单、归档 workspace 计划。 | 主线 TODO 已关闭或转长期观察。 | 当前“职责功能清晰 + 接口清洁 + 冗余删除”主线完成。 |

因此 CCIC-5 之后不能自动继续“小步派发”。总控必须先基于回填证据判断是否进入 CCIC-6；如果 P5 证明某些残留属于合理长期 contract，应关闭或降级 TODO，而不是继续追求表面清零。

## 总控判断

当前任务分区是“分配计划 + 代码事实分析 + TODO 滚动”。用户明确要求按各仓库职责做能力代码梳理、接口清洁和删除冗余，并要求深入思考后进行计划派发。因此本轮直接基于已确认的长期职责契约 / 方案启动执行计划，不再新建原始需求目录；若执行中发现需要删减能力、改变完整功能闭环、重命名公共发布身份或删除 Core public API，则必须暂停并回到用户确认。

当前真实阻塞点：CCIC-7 已关闭本轮用户确认可删除 / 可重命名的阻塞点。仍不能删除 Core public export，也不能把 Plugin 做成 Alembic daemon 空壳 client；这些属于后续 service contract / Core public API closeout 议题，不再阻塞本轮“职责功能清晰 + 接口清洁 + 冗余删除”收口。下一步不是继续给执行窗口派零散清理，而是做 CCIC-8 总体验收 / 归档判断。

阻塞点之前已完成：

- `Alembic` 已替换 `domain/knowledge`、`domain/evolution/EvolutionPolicy`、`repository/memory`、`workflows/capabilities`、`service/quality`、`service/recipe`、`service/bootstrap`、`ContentImpactAnalyzer` 和 `CapabilityProbe` 中已验收 stable / provisional 的残留入口，并收紧 boundary config。
- `Alembic` 已删除 `bootstrap-internal` / `rescan-internal` / `bootstrap/refine` 三条旧纯 alias；未触碰仍无替代入口的 `knowledge` / `panorama` 等 legacy handlers。
- `AlembicPlugin` 已完成同类 source residual replacement，并同步 AlembicCodex runtime artifact。
- `AlembicCore`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest` 本波无需发送；当前可直接派发 `AlembicPlugin` 和 `Alembic`。不创建测试单，原因是本轮仍是代码边界 / package 身份 / resident handler 路径清理，尚未刷新本机 Codex plugin cache 或改变真实项目 prime/search/cold-start 验证路径。

## 真实代码扫描快照

本快照只用于派发任务，不替代执行窗口的完整扫描。

- `Alembic`：`npm run lint:repo-boundary` 初始失败 18 处，集中在 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts`。CCIC-P1-A 已通过 Alembic 提交 `df36eb364b3a2d5e8e1868f2db979ffea8d974f8` 修复，当前 `npm run lint:repo-boundary` 通过。
- `Alembic`：`lib/external/mcp` 仍被 CLI、daemon jobs、HTTP routes、unit/integration tests 消费，例如 `bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/http/routes/task.ts`、`lib/http/routes/candidates.ts`、`test/unit/AgentModuleBoundaries.test.ts`。本波不得直接删除或整体搬迁。
- `AlembicPlugin`：`HOST_AI_MANAGED` / `hostManaged` 仍出现在 `lib/http/routes/candidates.ts`、`lib/http/routes/extract.ts`、`lib/service/module/ModuleService.ts`、`lib/injection/modules/VectorModule.ts` 和 runtime dist；其语义是 Plugin 不再本地执行 AI，而不是 Plugin 拥有第三方 AI。
- `AlembicDashboard`：`src/api.ts` 和 `CandidatesView.tsx` 明确消费 `HOST_AI_MANAGED` / `hostManaged`；因此 Plugin 不能单方面删除旧 code。Dashboard `HelpView` 和双语 i18n 中仍有旧 MCP / Skill / Agent Runtime / AI 扫描口径和硬编码数量。
- `AlembicAgent`：`src/agent/runtime/AgentRuntimeBoundary.ts` 已表达 Codex MCP / marketplace / host-agent route 归 Plugin，但 `AGENTS.md` 和部分 runtime / message / tool comments 中仍有 host adapter / MCP 表达需要校准，避免和 Codex host agent 混用。
- `AlembicCore`：存在 `scripts/report-public-api-closeout.mjs` 和 `config/public-api-boundary.json`；外层仓库仍有 `@alembic/core/core/*`、`@alembic/core/service/*`、`@alembic/core/repository/*`、`@alembic/core/infrastructure/*` 等 deep import，必须 consumer-replace-first。

## CCIC-2 代码扫描快照

本轮用户要求继续在“明确各代码库职责和清理冗余”上深挖，因此总控基于 CCIC-1 回填和 2026-05-23 代码扫描启动第二波。当前不需要联网：问题全部来自本 workspace 内已确认的真实源码、lint 策略和执行回填。

- `AlembicCore` 已有 `@alembic/core/project-intelligence` exact facade，源码 `src/project-intelligence.ts` 已导出 `getDiscovererRegistry`、`resetDiscovererRegistry`、`LanguageService`、`analyzeProject`、`isProjectAstAvailable`、`loadProjectAstPlugins` 等能力；这可以承接 Alembic scripts 中一部分 `@alembic/core/core/*` deep import。
- `Alembic` 仍有 4 个 Core import boundary 阻塞点，集中在 `scripts/bench-real-projects.mts` 与 `scripts/collect-test-project-stats.mts`：`@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer`。其中 discovery / AstAnalyzer 已有 `project-intelligence` 替代入口；`core/enhancement` 仍在 Alembic allowlist 内，本波不强行迁移。
- `Alembic` 的 `lib/external/mcp` 仍有真实消费：`bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/http/routes/task.ts`、`lib/http/routes/candidates.ts`、`lib/http/routes/skills.ts`、多份 unit/integration tests 和 boundary tests。该目录当前是 Alembic resident service handler / schema legacy naming，不是 Plugin Codex MCP ownership；本波仍不得整目录删除。
- `AlembicPlugin` repo-boundary 债真实存在，扫描命中 `bin/daemon-server.ts`、`lib/http/routes/daemon.ts`、`lib/codex/KnowledgeState.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts` 等 raw sqlite / `prepare()` / `getDb()` 路径。该问题与 CCIC-P1-P host-managed 语义无关，但属于 Plugin 自身分层债，可以独立修复。
- `AlembicPlugin` 与 `AlembicDashboard` 的 host-managed canonical / legacy 双轨目前已经形成 producer-consumer 兼容闭环：Plugin 产出 `HOST_AGENT_MANAGED` / `PLUGIN_DETERMINISTIC_EXTRACT` 与 legacy `HOST_AI_MANAGED` / `hostManaged`，Dashboard 宽解析并保留 UI 消费。删除 legacy 字段仍需下一轮 contract 收窄证据，本波不触碰。
- `AlembicCore` 仍有少量口径残留：`BatchEmbedder` 注释提到 OpenAI / Gemini，`Logger` 的日志 tag 包含 `AgentRuntime` / `ToolRegistry`。这些不是 Core 拥有 provider 或 Agent runtime 的实现证据，但会继续造成职责阅读噪音，可与 facade readiness 同波清理。

## CCIC-3 代码扫描快照

本轮继续基于本 workspace 内真实代码证据派发，不需要联网：问题集中在既有源码目录语义、Core public facade readiness、Plugin audit contract 双轨。

- `Alembic` 的 `lib/external/mcp` 当前没有 Codex Plugin MCP server；真实消费集中在 Alembic 自身 CLI / daemon / HTTP routes / tests：`bin/cli.ts` 动态导入 `bootstrap-internal` / `rescan-internal`，`lib/daemon/DaemonJobRunner.ts` 调用 internal cold-start / rescan workflow compatibility exports，`lib/http/routes/task.ts` / `skills.ts` / `candidates.ts` 消费 task / skill / bootstrap refine handlers，`test/unit/KnowledgeAPI.test.ts`、`McpPanorama.test.ts`、`AgentModuleBoundaries.test.ts` 等仍引用旧路径。`tools.ts` 仍声明 Alembic resident tool schemas，`envelope.ts`、`errorHandler.ts`、`handlers/types.ts` 是 legacy MCP vocabulary / tool envelope contract。
- `Alembic` 与 `AlembicPlugin` 仍有大量 Core high-reference deep imports。已经存在的 exact facade 包括 `@alembic/core/knowledge`、`@alembic/core/evolution`、`@alembic/core/repositories`、`@alembic/core/database`、`@alembic/core/events`、`@alembic/core/project-intelligence` 等；但 `src/knowledge.ts` 尚未导出 `CodeEntityGraph`、`ConfidenceRouter`、`KnowledgeFileWriter`、`KnowledgeGraphService`、`KnowledgeSyncService`、`RecipeExtractor`、`SourceRefReconciler` 等高频 service classes，`src/evolution.ts` 尚未导出 `ConsolidationAdvisor`、`ContentPatcher`、`DecayDetector`、`EnhancementSuggester`、`LifecycleStateMachine`、`ProposalExecutor` 等高频 service classes，`@alembic/core/core/enhancement` 仍无稳定替代。外层 consumer replacement 需要 Core 先补 readiness，不应让 Alembic / Plugin 猜 facade。
- `AlembicPlugin` 的 audit 双轨真实存在但消费不对称：`AuditStore` 被 `AuditLogger`、HTTP audit route、Gateway flow tests、bootstrap lifecycle 和 `auditStore` service key 真实消费；`AuditRepositoryImpl` 目前只在 `ServiceMap.ts` 类型和 `InfraModule.ts` 注册 `auditRepository`，总控扫描未发现 `ct.get('auditRepository')` 或其它真实调用方。下一步可以优先删除无消费方 repository 注册 / 文件，或在执行窗口发现真实消费方时把它收敛成唯一后端；不得同时保留两个无清理条件的 audit 读写 contract。
- `AlembicDashboard` 当前没有新的上游 contract 可消费；host-managed canonical / legacy 收窄仍依赖 Plugin / Dashboard 专门 contract 轮次，不进入 CCIC-3。`AlembicTest` 暂不需要真实项目复测，因为本轮先做代码边界、facade readiness 和 runtime artifact 级验证，不改变用户项目 prime/search/cold-start 行为。

## CCIC-4 代码扫描快照

本轮继续基于本 workspace 内真实代码证据派发，不需要联网：Core P3 已提供替代入口，当前工作是下游 consumer replacement，不涉及通用架构标准或外部平台规则。

- `Alembic` 当前仍有 high-reference Core deep import，集中在 `bin/cli.ts`、`lib/cli/KnowledgeSyncService.ts`、`lib/cli/SetupService.ts`、`lib/injection/modules/{AppModule,KnowledgeModule,SignalModule,InfraModule}.ts`、`lib/injection/ServiceMap.ts`、`lib/http/routes/{signals,evolution,recipes}.ts`、`lib/service/bootstrap/UiStartupTasks.ts`、`lib/service/evolution/FileChangeHandler.ts`、`lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`、`lib/external/mcp/handlers/consolidate.ts` 和相关 unit / integration tests。可替换范围是 `service/knowledge/*` -> `@alembic/core/knowledge`、`service/evolution/*` -> `@alembic/core/evolution`、`repository/{evolution,knowledge,sourceref,sync,token}/*` -> `@alembic/core/repositories`、`infrastructure/signal/*` -> `@alembic/core/events`，`infrastructure/report/ReportStore` 可按 provisional exact entry 替换为 `@alembic/core/infrastructure/report` 并在回填中标注。
- `AlembicPlugin` 命中类似，集中在 `lib/cli/KnowledgeSyncService.ts`、`lib/cli/SetupService.ts`、`lib/injection/modules/{AppModule,KnowledgeModule,SignalModule,InfraModule}.ts`、`lib/injection/ServiceMap.ts`、`lib/http/routes/{signals,evolution}.ts`、`lib/service/bootstrap/UiStartupTasks.ts`、`lib/service/evolution/FileChangeHandler.ts`、`lib/external/mcp/handlers/{consolidate,evolve-external}.ts` 和相关 tests。Plugin 改动通常会进入 Codex runtime dist，执行窗口必须判断并同步 runtime artifact。
- 本轮明确不替换：`@alembic/core/core/enhancement`、`@alembic/core/core/capability/CapabilityProbe`、`@alembic/core/core/ast/lang-*`、`@alembic/core/infrastructure/database/*`、migration deep import、`@alembic/core/service/candidate`、`service/bootstrap`、`service/quality`、`service/recipe`、domain value paths，以及 `@alembic/core/service/evolution/ContentImpactAnalyzer`。这些路径没有本波已验收 stable replacement，或属于测试 / DB / AST / workflow 特殊边界，不能为了降计数伪迁移。
- 两个执行窗口都必须更新各自 core import boundary config 的 `allowedSpecifiers` / `referenceLimits` / 计数，只删除已经归零或下降的 high-reference 项，不扩大 allowlist；若某个导入因真实 API 不匹配无法替换，必须回填阻塞原因和建议是否需要 Core 下一波 facade readiness。

## CCIC-5 代码扫描快照

本轮继续基于本 workspace 内真实代码证据派发，不需要联网：问题集中在 residual public API 分类和 Alembic 旧 resident handler 路径收窄，不涉及外部平台规则。

- `Alembic` 的 `lib/external/mcp` 仍有真实引用：`bin/cli.ts` 动态导入 bootstrap / rescan handlers，`lib/daemon/DaemonJobRunner.ts` 调用 internal workflow compatibility exports，`lib/http/routes/candidates.ts` 仍导入 bootstrap refine handler，`test/unit/McpPanorama.test.ts`、`KnowledgeAPI.test.ts`、`AgentModuleBoundaries.test.ts`、`ResidentServiceBoundary.test.ts` 仍覆盖旧路径或旧边界。当前不能整目录删除；只能让 Alembic 扫描 retained consumers，能安全迁到 `lib/resident/**` 新语义入口的先迁，仍需保留的 legacy alias 必须写清消费方、原因和移除条件。
- `Alembic` residual Core imports 仍包含 `@alembic/core/core/enhancement`、`CapabilityProbe`、AST lang tests、database / migration、domain knowledge values、`service/candidate`、`service/bootstrap`、quality / recipe service、`ContentImpactAnalyzer`、`@alembic/core/types` 等。这里混有 stable exact、provisional exact、test-only、DB-infrastructure 和真正缺 facade 的路径，不能用同一“deep import”结论处理。
- `AlembicPlugin` residual Core imports 类似，并额外影响 Codex runtime dist / vendor snapshot：若只做扫描和分类，不需要同步 runtime artifact；若实际替换 source import 并进入 runtime dist，必须同步 AlembicCodex runtime artifact 并回填 hash。
- `AlembicCore` 的 `config/public-api-boundary.json` 已有 `facadeReadiness` map，标明 `./types`、`./service/candidate`、`./infrastructure/report` 等 consumer-ready provisional，以及 `./core/enhancement` keep-transitional。CCIC-5 的 Core 任务不是删除 export，而是把 CCIC-4 后 residual consumers 重新分类为 stable / provisional / keep-transitional / test-only / consumer-replace-later，并只在确定已有真实消费方和测试覆盖时做 additive facade readiness。

## 阶段计划

| 阶段 | 状态 | 目标 | 发送窗口 |
| --- | --- | --- | --- |
| CCIC-0 | 已完成 | 总控基于职责契约、长期方案、TODO 和轻量代码扫描确定第一波任务包。 | 无 |
| CCIC-1 | 已完成 | 第一波低耦合真实清理已通过总控验收：Alembic DB boundary、Plugin/Dashboard host-managed 语义、Agent 口径、Core public API closeout 证据。 | 无 |
| CCIC-2 | 已完成 | 第二波 consumer-replace-first 与分层清理已验收：Core facade readiness / 口径清洁、Alembic scripts deep import replacement + `external/mcp` 命名迁移前置盘点、Plugin repo-boundary DB 访问收敛。 | 无 |
| CCIC-3 | 已完成 | 第三波从“前置证据”进入“可消费替代入口”：Core high-reference facade readiness、Alembic resident tool handler 命名迁移第一片、Plugin audit 双轨 contract 收敛均已通过总控验收。 | 无 |
| CCIC-4 | 已完成 | Alembic / Plugin high-reference Core consumer replacement 已通过总控验收；只消费 Core P3 已验收 facade，未删除 Core public export、`lib/external/mcp` legacy alias 或 host-managed legacy 字段。 | 无 |
| CCIC-5 | 已完成 | Residual boundary 分类与 alias 收窄已通过总控验收：Core residual readiness 账本、Alembic `lib/external/mcp` retained consumer 收窄、Plugin residual import / runtime impact 分类均成立。 | 无 |
| CCIC-6 | 已完成 | 已处理 CCIC-5 证明可安全行动的 residual consumer replacement、alias 删除和 allowlist 收紧；`Alembic`、`AlembicPlugin` 均已通过总控验收。 | 无 |
| CCIC-7 | 已完成 | 用户确认的删除 / 重命名口径已通过总控验收：Plugin 清理旧 Dashboard / 旧调用方兼容并重命名 package/runtime/channel 身份；Alembic 从入口剪枝 `lib/external/mcp` 并迁出仍需要的 resident handler 能力。 | 无 |
| CCIC-8 | 已完成 | 总体验收通过：主线 TODO 已关闭或转全局长期观察，各产品仓库工作区干净，执行记录 / 提交 / 验证证据齐全；当前计划进入 workspace 归档。 | 无 |

## 任务派发时序（北京时间 UTC+8）

本节用于防止总控混淆“派发、用户口径更新、执行窗口回填、总控验收”的先后顺序。历史 CCIC-1 / CCIC-2 / CCIC-3 初始派发在旧计划中只记录了日期和发送窗口，没有记录精确北京时间；这些历史派发不反推具体时分秒。从 2026-05-23 11:13:54 CST 起，后续新增派发、返工派发和状态切换必须登记精确北京时间。

| 北京时间 | 类型 | 窗口 / 对象 | 事件 | 发送名单 / 状态 |
| --- | --- | --- | --- | --- |
| 2026-05-23（早前，未记录具体时分秒） | 派发补记 | CCIC-3 | 总控激活 CCIC-3，任务包为 Core high-reference facade readiness、Alembic resident handler 命名迁移第一片、Plugin audit contract 收敛。 | 当时发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`。 |
| 2026-05-23 10:58:53 CST | 提交证据 | `AlembicPlugin` | `CCIC-P3-P` 提交 `87de9fdee8feb20ce000bf30c3d0ba79559afdc5`，删除无消费方 `AuditRepositoryImpl` 并同步 runtime artifact。 | `AlembicPlugin` 转为待验收。 |
| 2026-05-23 11:01:00 CST | 提交证据 | `Alembic` | `CCIC-P3-A` 提交 `c7e8c8d798103c549756ede5e7b1ac533917d64c`，完成 resident tool handler / schema 第一片迁移和 old path alias。 | `Alembic` 转为待验收。 |
| 2026-05-23 11:02:16 CST | 提交证据 | `AlembicCore` | `CCIC-P3-C` 提交 `5994a058038217635580cf68358c0e133c73f747`，补 high-reference facade readiness。 | `AlembicCore` 转为待验收。 |
| 2026-05-23 11:13:54 CST | 总控状态切换 | `AlembicWorkspace` | 根据用户提醒补时序规则，并把 CCIC-4 写成观察预案；下一波只在三项 P3 证据全部验收后启动。 | 当前发送给无；三窗口均待验收。 |
| 2026-05-23 11:21:11 CST | 总控补验 | `Alembic` | 在 AlembicCore P3 完成后补跑 `npm run build:check`，确认此前 Core export mismatch 阻塞已解除，命令退出码 0。 | Alembic build 验收缺口关闭。 |
| 2026-05-23 11:21:57 CST | 总控验收 | CCIC-3 | 复核三份执行记录、提交证据、工作区状态、运行时 artifact 和验证命令；Core / Alembic / Plugin 三项 P3 均通过。 | CCIC-3 标为已完成；当前发送给无，CCIC-4 进入候选待派发。 |
| 2026-05-23 11:32:43 CST | 派发 | CCIC-4 | 基于 Core P3 readiness 和 Alembic / Plugin deep import 扫描，激活 high-reference Core consumer replacement。 | 发送给 `Alembic`、`AlembicPlugin`；`AlembicCore` 观察中，其它窗口无任务。 |
| 2026-05-23 11:56:39 CST | 执行回填 | `Alembic` | `CCIC-P4-A` 完成 Alembic high-reference Core consumer replacement，提交 `b3eb9ab0accf597dd046b4fc2bcb8cfc8d20ca34` 并回填执行记录。 | `Alembic` 转为待验收；当前仍发送给 `AlembicPlugin`。 |
| 2026-05-23 12:00:44 CST | 执行回填 | `AlembicPlugin` | `CCIC-P4-P` 完成 Plugin high-reference Core consumer replacement，提交 `2060aed9dd0fa0eb684df52826f15dbdac820918`，同步 AlembicCodex runtime artifact `add1db81adfbe1ac7d76e24e432012c35904b21a` 并回填执行记录。 | `AlembicPlugin` 转为待验收；当前发送给无。 |
| 2026-05-23 12:55:55 CST | 总控验收 | CCIC-4 | 复核 Alembic / AlembicPlugin / runtime artifact 提交、执行记录、关键门禁命令、负向扫描和工作区状态；两项 P4 均通过。 | CCIC-4 标为已完成；当前发送给无。 |
| 2026-05-23 13:05:49 CST | 派发 | CCIC-5 | 基于 CCIC-4 验收后的 residual scans，激活 Core residual readiness 分类、Alembic `external/mcp` alias 删除条件评估和 Plugin residual runtime impact 分类。 | 发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`；`AlembicAgent` 无任务，`AlembicDashboard` 观察中，`AlembicTest` 无任务。 |
| 2026-05-23 13:20:23 CST | 执行回填 | `AlembicPlugin` | `CCIC-P5-P` 完成 Plugin source / tests / runtime dist / vendor snapshot residual Core import 分类；未修改产品源码，未刷新 AlembicCodex runtime artifact。 | `AlembicPlugin` 转为待验收；当前仍发送给 `AlembicCore`、`Alembic`。 |
| 2026-05-23 13:24:11 CST | 执行回填 | `AlembicCore` | `CCIC-P5-C` 完成 Core residual readiness 分类，提交 `a60dde335d76e901d31fd32eb7762bee35e7c9ea` 并回填执行记录。 | `AlembicCore` 转为待验收；三窗口均待验收，当前发送给无。 |
| 2026-05-23 13:25:03 CST | 执行回填 | `Alembic` | `CCIC-P5-A` 完成 Alembic `lib/external/mcp` retained consumer 收窄：CLI / daemon / HTTP bootstrap-rescan-refine 消费切到 `lib/resident/tool-handlers`，旧 bootstrap/rescan/refine paths 只保留 compatibility alias，并回填 residual Core import 分类输入。 | `Alembic` 转为待验收；三窗口均待验收，当前发送给无。 |
| 2026-05-23 13:37:30 CST | 总控验收 | CCIC-5 | 复核 Core / Alembic / Plugin 三份执行记录、提交 / artifact 状态、工作区状态和关键负向扫描；三项 P5 均通过。 | CCIC-5 标为已完成；CCIC-6 进入观察候选，当前发送给无。 |
| 2026-05-23 13:46:07 CST | 派发 | CCIC-6 | 基于 CCIC-5 证据激活 residual replacement / alias closeout：Alembic 做已验收 Core facade replacement 与 bootstrap/rescan/refine 纯 alias 删除条件执行，Plugin 做 source/runtime residual replacement 并同步 runtime artifact。 | 发送给 `Alembic`、`AlembicPlugin`；`AlembicCore` 观察中，其它窗口无任务。 |
| 2026-05-23 14:05:29 CST | 执行回填 | `AlembicPlugin` | `CCIC-P6-P` 完成 Plugin accepted Core facade consumption：旧 residual Core deep imports 已收敛到 `core/capability`、`service/bootstrap`、`service/quality`、`service/recipe` 和 stable `evolution` facade，boundary allowlist 收紧到 457 references / 36 unique specifiers，并同步 AlembicCodex runtime artifact。 | `AlembicPlugin` 转为待验收；当前仍发送给 `Alembic`。 |
| 2026-05-23 14:11:00 CST | 执行回填 | `Alembic` | `CCIC-P6-A` 完成 Alembic residual replacement / alias closeout，提交 `bfd03984079caea94aae2ce32aa455422db0fa3a`：已删除 bootstrap/rescan/refine 三条 old external MCP alias，已将可替换 residual Core imports 切到已验收 facade，并收紧 core import boundary。 | `Alembic` 转为待验收；CCIC-6 两个执行窗口均待验收，当前发送给无。 |
| 2026-05-23 14:22:18 CST | 总控验收 | CCIC-6 | 复核 Alembic `bfd03984079caea94aae2ce32aa455422db0fa3a`、AlembicPlugin `e5295ab57221e9ccbb7abb3a3099a7a83d3b1e3b`、AlembicCodex runtime artifact `fda5b97a3ed1d9f015f8cdec0afcffd5ec716010`、两个执行记录、三个工作区状态、提交 diff check 和旧路径负向扫描。 | CCIC-6 标为已完成；当前发送给无，CCIC-7 进入目标判断。 |
| 2026-05-23 14:40:14 CST | 用户口径确认 / 派发 | CCIC-7 | 用户确认：Plugin producer 不按 Dashboard 关系理解；Plugin 不再保留旧 Dashboard / 旧调用方兼容，只保留跳转；Plugin 可重命名为 IDE 插件产出库；Alembic `lib/external/mcp` 从入口剪枝，提取真实需要能力；Core 交流接口后续慢慢对齐。 | 发送给 `AlembicPlugin`、`Alembic`；`AlembicCore` 观察中，其它窗口无任务。 |
| 2026-05-23 14:59:50 CST | 执行回填 | `Alembic` | `CCIC-P7-A` 完成 Alembic `lib/external/mcp` entrypoint pruning，提交 `2704216fdfda47b3327c7caf60f3a7df9b3429d2`：剩余 resident handlers 迁入 `lib/resident/tool-handlers`，无消费方 schema / handler alias 和 `#external/*` import map 已删除，`lib/external/mcp` 仅保留 README 边界标记。 | `Alembic` 转为待验收；当前仍发送给 `AlembicPlugin`。 |
| 2026-05-23 15:16:38 CST | 执行回填 | `AlembicPlugin` | `CCIC-P7-P` 完成 Plugin old Dashboard / old caller closeout 与 package identity rename，提交 `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`，AlembicCodex runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`，`runtime.tgz` SHA-256 `318099ac67031a493840f18d77d4916fe457b420bd5249f72ce69a0e54652ce8`。 | `AlembicPlugin` 转为待验收；CCIC-7 两个执行窗口均待验收，当前发送给无。 |
| 2026-05-23 15:26 CST | 总控验收 | CCIC-7 | 复核 Alembic `2704216fdfda47b3327c7caf60f3a7df9b3429d2`、AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`、AlembicCodex runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`、两份执行记录、三个工作区状态、提交 diff check、Alembic `lib/external/mcp` 负向扫描、Plugin Dashboard / legacy / package identity 负向扫描。 | CCIC-7 标为已完成；GTODO-2026-05-22-018 转观察中；当前发送给无，CCIC-8 进入总体验收 / 归档判断。 |
| 2026-05-23 15:40 CST | 总体验收 | CCIC-8 | 复核 Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin 和 AlembicCodex runtime artifact 工作区状态，确认 CCIC-1 至 CCIC-7 执行记录 / 提交 / 验证证据齐全；`CCIC-TODO-21` 转入全局长期观察，`GTODO-2026-05-22-018` 完成。 | CCIC 主线标为已完成；当前发送给无，不创建 AlembicTest 测试单，准备归档。 |

## 任务包

下一处真实阻塞点：CCIC-7 已把本轮可执行的 Plugin old Dashboard / old caller closeout、package/runtime identity rename 和 Alembic `lib/external/mcp` entrypoint pruning 封口。Core public export 删除、Plugin 与 Alembic 主体 service contract 对齐、真实项目复测都不应在本计划里惯性续派；如果需要推进，先在 CCIC-8 总体验收时判断是否另开窄任务。

阻塞点之前当前能做：本轮阻塞点之前的可安全动作已经完成。当前只做总控级复核、TODO 滚动、归档判断和是否需要后续窄任务的目标判断，不再发送执行窗口。

| 任务包 ID | 窗口 | 阶段 / 目标 | 主线 | 合并 TODO | 明确不包含 / 排除事项 | 阻塞 / 依赖 | 验证 | 回填 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CCIC-P1-A | `Alembic` | 第一波边界修复。 | DB boundary lint 修复 + `lib/external/mcp` 命名债只读盘点。 | CCIC-TODO-1 | 不迁移 `lib/external/mcp`。 | 无。 | repo-boundary lint、build、targeted tests、diff check。 | `docs/Alembic/capability-code-interface-cleanup-main-2026-05-22.md` | 已验收 |
| CCIC-P1-C | `AlembicCore` | 第一波 public API 账本。 | Public API / deep import closeout 证据和安全候选清单。 | CCIC-TODO-5 | 不删 public export。 | 无。 | build、public API scripts、consumer scans。 | `docs/AlembicCore/capability-code-interface-cleanup-core-2026-05-22.md` | 已验收 |
| CCIC-P1-G | `AlembicAgent` | 第一波口径清洁。 | `host agent` / internal Agent runtime 口径清洁。 | CCIC-TODO-4 | 不改变 Agent runtime 行为。 | 无。 | build、contract test、diff check。 | `docs/AlembicAgent/capability-code-interface-cleanup-agent-2026-05-22.md` | 已验收 |
| CCIC-P1-D | `AlembicDashboard` | 第一波 consumer 兼容。 | Dashboard Help/i18n 与 host-managed consumer 语义清洁。 | CCIC-TODO-2 / 3 | 不收窄 legacy parser。 | Plugin producer 仍保留 legacy 字段。 | build、文案 / parser 负向扫描、diff check。 | `docs/AlembicDashboard/capability-code-interface-cleanup-dashboard-2026-05-22.md` | 已验收 |
| CCIC-P1-P | `AlembicPlugin` | 第一波 Plugin host-managed 语义。 | Plugin host-managed AI 边界语义与冗余残留清洁。 | CCIC-TODO-2 | 不删除 Dashboard legacy consumer 字段。 | Dashboard 仍宽兼容。 | build、targeted tests、runtime prepare、plugin / channel verify、diff check。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-2026-05-22.md` | 已验收 |
| CCIC-P2-C | `AlembicCore` | 第二波 Core facade readiness。 | Project-intelligence facade readiness + Core provider / agent 口径残留清洁。 | CCIC-TODO-9 / 12 | 不迁移外层 consumer，不删 export。 | Alembic scripts consumer replacement 需要先使用 readiness。 | build、public API scripts、targeted tests、consumer scans、lint。 | `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-2-2026-05-23.md` | 已验收 |
| CCIC-P2-A | `Alembic` | 第二波 consumer replacement。 | Alembic scripts Core deep import replacement + `lib/external/mcp` 命名迁移前置盘点。 | CCIC-TODO-6 / 9 | 不删除 `core/enhancement` 和 `external/mcp`。 | 依赖 Core project-intelligence readiness。 | build、core import boundary、repo-boundary lint、targeted tests、diff check。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-2-2026-05-23.md` | 已验收 |
| CCIC-P2-P | `AlembicPlugin` | 第二波 Plugin 分层清理。 | Plugin repo-boundary DB 访问收敛 + runtime artifact 同步判断。 | CCIC-TODO-11 | 不处理 audit 双轨和 host-managed legacy。 | runtime artifact 受影响需同步。 | repo-boundary lint、build、targeted tests、runtime prepare、plugin / channel verify、diff check。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-2-2026-05-23.md` | 已验收 |
| CCIC-P3-C | `AlembicCore` | 第三波 Core high-reference readiness。 | `knowledge` / `evolution` / `repositories` / `events` 替代入口补齐，`core/enhancement` 保持 transitional。 | CCIC-TODO-14 | 不删 public export，不迁移 Alembic / Plugin consumer。 | 下游 consumer replacement 等总控验收后启动。 | build、targeted tests、public API scripts、lint、consumer scans、diff check。 | `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-3-2026-05-23.md` | 已验收 |
| CCIC-P3-A | `Alembic` | 第三波 Alembic resident 命名迁移第一片。 | `lib/external/mcp` resident tool handler 新语义入口 + internal consumer replacement + legacy alias。 | CCIC-TODO-13 | 不做 old path 最终删除，不改 Plugin MCP ownership。 | 删除 alias 需后续 consumer scan。 | build、boundary scans、targeted tests、负向扫描、diff check；总控补跑 `npm run build:check` 通过。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-3-2026-05-23.md` | 已验收 |
| CCIC-P3-P | `AlembicPlugin` | 第三波 Plugin audit contract 收敛。 | 删除无消费方 `AuditRepositoryImpl`，保留 `AuditStore` 主路径，并同步 runtime artifact 判断。 | CCIC-TODO-15 | 不改 audit schema / Gateway 审计语义 / Dashboard socket event。 | runtime artifact 受影响需同步。 | repo-boundary lint、build、targeted tests、runtime prepare、plugin / channel verify、负向扫描、diff check。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-3-2026-05-23.md` | 已验收 |
| CCIC-P4-A | `Alembic` | 第四波 Core consumer replacement。 | 把 Alembic 中已由 Core P3 验收的 high-reference deep imports 迁到 `knowledge` / `evolution` / `repositories` / `events` / provisional `infrastructure/report` facade，并更新 core import boundary 计数。 | CCIC-TODO-16 | 不处理 `core/enhancement`、CapabilityProbe、AST lang、database/migration、candidate/bootstrap/quality/recipe、`ContentImpactAnalyzer`；不删除 `lib/external/mcp` alias。 | 依赖 Core P3-C 已验收；删除 Core public export仍阻塞。 | `npm run lint:consumer-core-imports`、`npm run build:check`、`npm run lint:repo-boundary`、相关 targeted tests、replacement 负向扫描、`git diff --check`。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-4-2026-05-23.md` | 已验收 |
| CCIC-P4-P | `AlembicPlugin` | 第四波 Plugin Core consumer replacement。 | 把 Plugin 中已由 Core P3 验收的 high-reference deep imports 迁到 `knowledge` / `evolution` / `repositories` / `events` / provisional `infrastructure/report` facade，更新 allowlist 计数，并同步 runtime artifact。 | CCIC-TODO-16 | 不重新打开 audit contract，不删除 host-managed legacy compatibility，不把 Plugin 改成 Alembic daemon 空壳 client；不处理无本波 stable replacement 的 Core deep paths。 | 依赖 Core P3-C 已验收；runtime artifact 受影响需同步。 | `npm run lint:consumer-core-imports`、`npm run lint:repo-boundary`、`npm run build:check`、相关 targeted tests、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、负向扫描、`git diff --check`。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-4-2026-05-23.md` | 已验收 |
| CCIC-P5-C | `AlembicCore` | 第五波 residual readiness 分类。 | 基于 Alembic / Plugin CCIC-4 后残留 imports，更新 public API boundary / readiness map，分类 stable / provisional / keep-transitional / test-only / consumer-replace-later；只做必要 additive facade readiness。 | CCIC-TODO-19 | 不删除 public export，不让外层 consumer 迁移本轮尚未验收的新 facade，不下沉 CLI / Codex / Dashboard / Agent runtime。 | 下游 replacement 依赖本包回填和总控验收。 | `npm run build:check`、public API boundary / closeout scripts、targeted facade tests、`git diff --check`。 | `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-5-2026-05-23.md` | 已验收 |
| CCIC-P5-A | `Alembic` | 第五波 alias 删除条件评估与 retained consumer 收窄。 | 重新扫描 `lib/external/mcp` retained consumers；能安全迁到 `lib/resident/**` 的 consumer 先迁，无法迁的 alias 写清消费方 / 原因 / 移除条件；同步 residual Core import 分类输入。 | CCIC-TODO-17 / 19 | 不硬删仍被 CLI / daemon / HTTP / tests 消费的 old path；不删除 Core public export；不猜 Core 新 facade。 | Core P5-C 新 facade 若未验收，不做对应 consumer replacement。 | `npm run build:check`、`npm run lint:repo-boundary`、`npm run lint:consumer-core-imports`、resident / MCP targeted tests、old-path retained scan、`git diff --check`。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-5-2026-05-23.md` | 已验收 |
| CCIC-P5-P | `AlembicPlugin` | 第五波 residual runtime impact 分类。 | 扫描 Plugin source / runtime dist residual Core imports，分类哪些是 exact/provisional、test-only、runtime-impacting 或等待 Core P5；只替换已有验收 facade，不触发无意义 runtime artifact。 | CCIC-TODO-19 | 不删除 host-managed legacy compatibility，不重新引入 AI / Agent / Tool runtime，不把 Plugin 改成 Alembic daemon 空壳 client。 | 若改 source 且进入 runtime dist，必须同步 AlembicCodex runtime artifact；Core P5-C 未验收的新 facade 不消费。 | `npm run lint:consumer-core-imports`、`npm run lint:repo-boundary`、`npm run build:check`、必要 targeted tests、必要 plugin/channel verify、runtime impact scan、`git diff --check`。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-5-2026-05-23.md` | 已验收 |
| CCIC-P6-A | `Alembic` | 第六波 Alembic residual replacement / alias closeout。 | 已消费 CCIC-5 已验收 stable / provisional facade，替换 Alembic residual Core imports 并收紧 boundary config；已删除 `bootstrap-internal` / `rescan-internal` / `bootstrap/refine` 三个无真实消费方纯 alias，并更新 boundary tests。提交 `bfd03984079caea94aae2ce32aa455422db0fa3a`。 | CCIC-TODO-17 / 20 | 未消费 `core/enhancement`、AST lang、Drizzle / migrations 等 keep-transitional 路径；未删除 `knowledge` / `panorama` 等仍无 resident replacement 的 legacy handlers；未删除 Core public export。 | Core `@alembic/core/knowledge` 仍缺 `normalizeLifecycle`，Alembic 保留 2 处 test-only `domain/knowledge/Lifecycle` allowance 并回填给 Core 后续处理。 | 执行窗口验证通过；总控补跑 `git diff --check HEAD^ HEAD`、旧 deep import / old external path 负向扫描和工作区状态复核通过。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-6-2026-05-23.md` | 已验收 |
| CCIC-P6-P | `AlembicPlugin` | 第六波 Plugin residual replacement / runtime artifact。 | 只消费 CCIC-5 已验收 stable / provisional facade，替换 Plugin source residual Core imports，更新 core import boundary allowlist；source/runtime dist 已重建并同步 AlembicCodex runtime artifact。 | CCIC-TODO-20 | 不消费 `core/enhancement`、AST lang、Drizzle / migrations 等 keep-transitional 路径；不删除 host-managed legacy compatibility；不重新引入 AI / Agent / Tool runtime；不把 Plugin 改成 Alembic daemon 空壳 client。 | 依赖 CCIC-5 已验收；本轮未发现 Core facade symbol gap。 | 执行窗口验证通过；总控补跑 AlembicPlugin / runtime `git diff --check HEAD^ HEAD`、旧 deep import source/runtime 负向扫描和工作区状态复核通过。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-6-2026-05-23.md` | 已验收 |
| CCIC-P7-P | `AlembicPlugin` | 第七波 Plugin old Dashboard / old caller closeout + package identity rename。 | 已删除 Plugin 旧 Dashboard / 旧调用方兼容残留，只保留 `alembic_codex_dashboard` 作为本地 Alembic daemon 已提供 Dashboard URL 时的 handoff；root/runtime/channel/docs/tests 中 `alembic-ai` package 身份已改为 `alembic-codex-plugin-runtime@0.2.0`，避免 Plugin 被理解为 npm 产品包或 Alembic 主体。提交 `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`，runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`。 | CCIC-TODO-7 / 10 / 22 / 23 | 未删除 Codex MCP、Skill、channel/marketplace、runtime artifact、resident service client、portable fallback；未恢复外部 AI provider；未修改 Dashboard 仓库；未把 Plugin 做成空壳 client。 | 总控验收通过；如需本机实际切换新 artifact，后续再刷新 Codex plugin cache。 | 执行窗口验证通过；总控补跑 AlembicPlugin / runtime `git diff --check HEAD^ HEAD`、Dashboard / legacy / package identity 负向扫描、package/channel 身份正向扫描和工作区状态复核通过。 | `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-7-2026-05-23.md` | 已验收 |
| CCIC-P7-A | `Alembic` | 第七波 `lib/external/mcp` entrypoint pruning。 | 已从 CLI / daemon / HTTP / tests 入口扫描真实消费方，并将剩余 resident handlers 迁到 `lib/resident/tool-handlers`；已删除无消费方 alias 与 `#external/*` import map；`lib/external/mcp` 仅保留 README 边界标记。 | CCIC-TODO-24 | 未移动 cold-start / rescan 真实 workflow 到错误仓库，未改 Plugin MCP ownership，未删除 Core public export。 | 总控验收通过；后续不再把 `lib/external/mcp` 作为 Alembic resident runtime 入口。 | 执行窗口验证通过；总控补跑 `find Alembic/lib/external/mcp -name '*.ts' -print`、old external MCP path 负向扫描、`git diff --check HEAD^ HEAD` 和工作区状态复核通过；`npm run lint` 仍失败于既有 Biome 债。 | `docs/Alembic/capability-code-interface-cleanup-main-ccic-7-2026-05-23.md` | 已验收 |

执行前置硬规则：所有窗口必须先读取本 workspace `AGENTS.md`、本计划和目标仓库自己的 `AGENTS.md`，并先明确声明当前窗口定位、目标仓库职责、本轮任务职责和明确不承担的职责；无法确认定位时必须停下回填阻塞。

## CCIC-5 派发方案

本节记录 CCIC-5 当前派发方案。CCIC-4 已完成 high-reference consumer replacement，但剩余残留不能用“继续降计数”简单处理：`@alembic/core/types`、`@alembic/core/service/candidate`、`@alembic/core/infrastructure/report` 这类 exact / provisional 入口和 `@alembic/core/core/enhancement`、AST lang、DB migration、Quality / Recipe service、`ContentImpactAnalyzer` 这类 transitional / special-boundary 入口需要先分清楚；Alembic `lib/external/mcp` old path 也仍有真实消费方，不能硬删。

启动门禁：

- CCIC-4 已通过总控验收，Alembic / Plugin 已完成可替换 high-reference Core deep imports 的 consumer replacement。
- `lib/external/mcp` retained consumer 扫描显示 old path 仍被 CLI、daemon、HTTP routes 和 tests 引用，因此本轮目标是“删除条件评估 + 可迁移 consumer 收窄”，不是直接删除目录。
- Core `facadeReadiness` 已有部分 provisional / stable map，但 CCIC-4 后 residual path 混杂；本轮需要 Core 先给账本，不让 Alembic / Plugin 猜 facade。

当前任务包：

- `CCIC-P5-C` / `AlembicCore`：更新 residual readiness 账本，必要时做 additive facade readiness；不删除 public export，不要求下游本轮消费新 facade。
- `CCIC-P5-A` / `Alembic`：扫描并收窄 `lib/external/mcp` retained consumers；能迁到 `lib/resident/**` 的先迁，不能迁的保留 alias 并写明移除条件；同时回填 Alembic residual Core import 分类。
- `CCIC-P5-P` / `AlembicPlugin`：区分 source / runtime dist residual Core imports 和 runtime artifact 影响；只替换已有验收 facade，若没有 source/runtime 实际改动可以只回填分类文档，不打包 runtime artifact。
- `CCIC-P5-T` / `AlembicTest`：默认不启动。只有本波改动触发本机 Codex plugin cache、prime/search/cold-start、daemon HTTP contract、Dashboard 手动体验或真实项目行为时，才通过 `docs/workspace/alembic-test-exchange.md` 创建测试单。

完成定义：

- `AlembicCore` 给出 residual path 的明确分类：stable / provisional / keep-transitional / test-only / consumer-replace-later，并用 public API scripts 和 targeted tests 证明新增 readiness 可用。
- `Alembic` 证明 `lib/external/mcp` old path 要么继续减少真实消费者，要么已记录 retained consumers、保留理由和删除触发；不得把仍有消费者的 old path 标为可删。
- `AlembicPlugin` 证明 residual Core import 分类区分 source、runtime dist、vendor snapshot 和测试路径；若 runtime artifact 未同步，必须证明本轮没有 runtime-impacting source 改动。
- 三个窗口都回填执行记录、提交 hash（如有代码改动）、验证命令、验证结果、遗留风险和下一步建议。

## CCIC-6 派发方案

本节记录 CCIC-6 当前派发。总控基于 CCIC-5 回填和 2026-05-23 13:46:07 CST 真实代码扫描判断：目标仍未完成，但现在存在两类能直接推进目标的安全动作。

目标判断：

- `Alembic` 与 `AlembicPlugin` 仍有 production / runtime residual Core imports，其中部分已由 CCIC-5 明确为 stable 或 provisional exact facade；继续替换能减少“能解释但尚未收口”的边界残留。
- `Alembic` 的 `bootstrap-internal` / `rescan-internal` / `bootstrap/refine` 旧 external MCP 路径已不被 CLI、daemon、HTTP 和 GoSupport 主链路消费；可在全仓、package exports、release guard 和 tests 复核后删除纯 alias，或保留并写清仍存在的真实消费方。
- `core/enhancement`、AST lang、Drizzle / migrations 仍是 keep-transitional / test-only / DB-infrastructure，不进入本波 replacement；`knowledge` / `panorama` 等 legacy handlers 本轮仍无 resident replacement，不进入删除。

当前任务包：

- `CCIC-P6-A` / `Alembic`：基于 CCIC-5 已验收 readiness 替换 Alembic residual Core imports，收紧 `config/core-import-boundary.json`；同时对三条纯 alias 做最终 consumer scan，若无真实消费方则删除 alias 文件并更新 boundary tests。若发现 old path 仍有真实消费方，则不得删除，改为保留理由和移除条件。
- `CCIC-P6-P` / `AlembicPlugin`：基于 CCIC-5 已验收 readiness 替换 Plugin source residual Core imports，收紧 `config/core-import-boundary-allowlist.json`；若 source 改动进入 runtime dist，必须同步 AlembicCodex runtime artifact、回填 runtime 子仓库 hash 和 `runtime.tgz` SHA-256。
- `CCIC-P6-C` / `AlembicCore`：默认观察，不发送。只有 Alembic / Plugin 回填明确 symbol gap 或 facade 编译缺口时，才返工 Core 做 additive readiness。
- `CCIC-P6-T` / `AlembicTest`：默认不启动。只有本波刷新本机 Codex plugin cache、改变 prime/search/cold-start、Dashboard 手动体验、daemon HTTP contract 或真实项目路径时，才通过测试交流文档创建测试单。

完成定义：

- Alembic / Plugin 的 replacement 只消费 CCIC-5 已验收的 stable / provisional facade；没有新增未解释 deep import，没有扩大 allowlist。
- Alembic 三条 old alias 要么删除并通过 full scan / tests / release guard，要么保留并写清真实消费方、保留理由和移除条件；不得整目录删除 `lib/external/mcp`。
- Plugin 若有 source/runtime 改动，runtime artifact 必须同步并通过 plugin / channel verify；不得重新引入 AI / Agent / Tool runtime，不得删除 host-managed legacy compatibility。
- 本波完成后，总控重新判断目标是否进入 CCIC-7 contract 收束，还是还需继续同一边界内 replacement。

## CCIC-7 用户确认口径与派发方案

本节记录 2026-05-23 14:40:14 CST 用户确认后的 CCIC-7 生效口径。这里的 `AlembicPlugin producer` 不再指 Dashboard producer，也不是指 AlembicAgent 冷启动产出；它指 Plugin 作为 Codex / IDE host-facing 插件产出库所生产的 MCP tool schema、Skill、channel、runtime artifact、diagnostics/status、package identity 和 resident service request surface。

用户确认口径：

- `AlembicPlugin` 不需要与 `AlembicDashboard` 保持旧 producer / consumer 兼容关系；所有与 Dashboard 相关的旧兼容都要清理，只保留跳转 / handoff 到本地 Alembic daemon 提供的 Dashboard URL。
- `AlembicPlugin` 不再为旧 Dashboard / 旧调用方保留兼容入口；如果代码里仍出现 Dashboard 语义，必须分类为允许保留的 URL handoff、文案 / 测试安全负向、AlembicCore vendor 注释，或待删除旧兼容。
- `AlembicPlugin` 当前只产出各个 IDE / Codex 插件相关 artifact；可以重命名 package/runtime/channel 身份，让它明确不是 npm 产品包或 Alembic 主体发布包。
- `AlembicCore` 本轮不抢做 public export 删除；后续重点是慢慢对齐 Plugin 与 Alembic 主体交流接口。
- `Alembic` 的 `lib/external/mcp` 存在真实消费方，不能整目录删除；应从 CLI / daemon / HTTP / tests 入口剪枝，对仍需要的能力提取到 Alembic-owned resident / workflow / service 位置。

真实代码证据：

- `AlembicPlugin/package.json` 与 `package-lock.json` 当前 root name 仍是 `alembic-ai`；`plugins/alembic-codex/runtime/package.json` 由 `scripts/prepare-codex-plugin-runtime.mjs` 使用 root package name 生成，`scripts/verify-codex-channel.mjs`、`scripts/verify-codex-plugin.mjs`、`scripts/smoke-codex-plugin.mjs` 和多份 unit tests 仍断言 `alembic-ai`。
- `AlembicPlugin` 仍有允许保留的 Dashboard handoff 入口：Skill `alembic_codex_dashboard`、`CodexMcpServer` dashboard handoff、status / diagnostics 中的 local daemon Dashboard capability；这些应保留为“跳转 / handoff”，不是 Plugin 内置 Dashboard 兼容。
- `AlembicPlugin` 仍有待删除或重写的旧 Dashboard / 旧调用方语义：`lib/http/routes/daemon.ts` 中 `packageName: 'alembic-ai'` 与 dashboard status payload、`lib/http/routes/candidates.ts` 的 legacy `HOST_AI_MANAGED` / `hostManaged` 兼容、若干 HTTP route / service comments 中“Dashboard 调用 / Dashboard 冷启动 / Dashboard 可视化用”口径、runtime dist 中同步残留。
- `Alembic` 入口已经部分迁到 `lib/resident/**`：`bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/http/routes/task.ts`、`lib/http/routes/skills.ts`、`lib/http/routes/candidates.ts` 消费 resident tool handlers / schema；但 `lib/external/mcp/handlers/{knowledge,panorama,search,candidate,guard,structure,consolidate,consolidated,browse,system}` 和 `test/unit/KnowledgeAPI.test.ts`、`McpPanorama.test.ts`、`AgentModuleBoundaries.test.ts` 等仍证明 old path 有真实消费或边界测试。

当前任务包：

- `CCIC-P7-P` / `AlembicPlugin`：合并处理 Dashboard / 旧调用方兼容删除、host-managed legacy 收束、package/runtime/channel 身份重命名和 runtime artifact 同步。该包故意合并多个同验证链路事项，避免每次改两行就重建 runtime。
- `CCIC-P7-A` / `Alembic`：从入口继续剪枝 `lib/external/mcp`，把仍需要的能力迁到 Alembic-owned 位置，删除无消费方 alias，保留项必须写清真实消费方和删除触发。
- `CCIC-P7-C` / `AlembicCore`：观察中，不发送。只有 Plugin / Alembic 回填明确 service contract / facade gap 时，才另开 additive readiness 或 shared contract 对齐。
- `CCIC-P7-D` / `AlembicDashboard`：无任务。用户已确认 Dashboard 不再接入 Plugin；Dashboard 不作为 Plugin 兼容保留理由。
- `CCIC-P7-T` / `AlembicTest`：默认不启动。只有本波刷新本机 Codex plugin cache、改变 prime/search/cold-start、daemon HTTP contract 或真实项目验证路径时，才通过测试交流文档创建测试单。

完成定义：

- Plugin 删除旧 Dashboard / 旧调用方兼容后，Codex MCP / Skill / channel / runtime artifact / resident service client 仍完整；dashboard 只以 URL handoff 存在，且验证脚本 / tests / docs 不再把 Plugin 描述成 Dashboard 兼容服务。
- Plugin package/runtime/channel 身份不再让开发者误读为 `alembic-ai` 主体 npm 包；所有 release/check/smoke/tests 同步更新，runtime artifact hash 回填。
- Alembic `lib/external/mcp` 的剩余 old path 要么被迁到 Alembic-owned 位置，要么有真实消费方、保留理由和删除触发；不得再保留无解释 alias。
- 本波结束后，总控判断是否进入 CCIC-8 总体验收，或只针对 Plugin <-> Alembic service contract / Core additive readiness 追加窄任务。

## CCIC-4 派发方案

本节记录 CCIC-4 派发与验收方案。`Alembic`、`AlembicCore`、`AlembicPlugin` 三个 CCIC-3 执行窗口均已通过总控验收，Core P3 readiness 已成为 CCIC-4 上游证据。`Alembic` 已完成 `CCIC-P4-A`，`AlembicPlugin` 已完成 `CCIC-P4-P`；总控已于 2026-05-23 12:55:55 CST 完成验收，当前发送给无。

启动门禁：

- `AlembicCore` CCIC-P3-C 已通过总控验收：提交 `5994a058038217635580cf68358c0e133c73f747`、执行记录、public API boundary、consumer scans、readiness map 和工作区干净证据成立；`@alembic/core/core/enhancement` 仍保持 transitional，不能被下游伪迁移。
- `Alembic` CCIC-P3-A 已通过总控验收：新 Alembic-owned resident tool / service handler 入口、内部 consumer replacement、旧 `lib/external/mcp` compatibility alias / legacy contract / retained consumer 证据、负向扫描和验证命令齐全；总控补跑 `npm run build:check` 通过。
- `AlembicPlugin` CCIC-P3-P 已通过总控验收：`AuditRepositoryImpl` source/runtime 残留已删除，`AuditStore` / `AuditLogger` / HTTP audit route / Gateway 审计路径仍完整，runtime artifact hash 成立。
- 若任一门禁失败，不启动 CCIC-4；只把失败窗口改为返工，且不让下游窗口猜字段、复制临时 contract 或提前删除兼容入口。
- 三项门禁已通过；CCIC-4 只能启动当前已具备替代入口的 consumer replacement；仍不进入 Core public export 删除、`lib/external/mcp` old path 最终删除、host-managed legacy 字段删除、package identity / release 身份重命名或真实项目复测。

CCIC-4 当时任务包：

- `CCIC-P4-A` / `Alembic`：只替换已由 Core P3-C 验收确认的 high-reference Core deep imports，例如 `service/knowledge/*` -> `@alembic/core/knowledge`、`service/evolution/*` -> `@alembic/core/evolution`、repository high-reference paths -> `@alembic/core/repositories`、`infrastructure/signal/*` -> `@alembic/core/events`。不处理 `@alembic/core/core/enhancement`，不删除 `lib/external/mcp` alias，不扩大 allowlist。
- `CCIC-P4-P` / `AlembicPlugin`：同样只做已确认 facade 的 Core consumer replacement；若改动进入 Codex runtime dist，必须同步 runtime artifact。不得重新打开 audit contract，不删除 host-managed legacy compatibility，不把 Plugin 改成 Alembic daemon 空壳 client。
- `CCIC-P4-T` / `AlembicTest`：默认不启动。只有 P4 触发本机 Codex plugin cache、prime/search/cold-start 用户路径、daemon HTTP contract、Dashboard 手动体验或真实项目行为时，才通过 `docs/workspace/alembic-test-exchange.md` 创建测试单。

完成定义：

- Alembic / Plugin 的 Core deep import 数量下降，且下降项都能追溯到 Core P3-C readiness 证据；没有新增 deep import、没有新增 allowlist、没有删除 public export。
- `@alembic/core/core/enhancement`、Core public wildcard、Alembic `lib/external/mcp` compatibility alias 和 host-managed legacy 字段保持原状，除非另有独立用户确认。
- 每个执行窗口都有提交 hash、验证命令、负向扫描、工作区状态和执行记录；`Alembic` / `AlembicPlugin` 均已通过总控验收；`CCIC-TODO-17` / `CCIC-TODO-19` 继续观察。

## 历史任务包细节（已验收，不领取）

以下 CCIC-P1 / P2 / P3 / P4 细节只作为历史验收依据保留。当前 CCIC-5 已通过总控验收，无可继续领取窗口；CCIC-6 需先按目标判断再派发。

### CCIC-P3-C：AlembicCore High-Reference Facade Readiness

窗口：`AlembicCore`

阶段目标：为下一轮 Alembic / AlembicPlugin consumer replacement 提供真实、可编译、可测试的 Core exact facade，不删除任何 public export，不让下游窗口猜字段或猜入口。

主线动作：

- 读取 `AlembicCore/AGENTS.md`、`package.json` exports、`config/public-api-boundary.json`、`src/knowledge.ts`、`src/evolution.ts`、`src/repositories.ts`、`src/database.ts`、`src/infrastructure/signal/index.ts`、`src/infrastructure/report/index.ts`。
- 基于本轮扫描结果，补齐 `@alembic/core/knowledge` 对高引用 knowledge service classes 的 additive exports；补齐 `@alembic/core/evolution` 对高引用 evolution service classes 的 additive exports；必要时补 `@alembic/core/repositories` / `@alembic/core/database` / `@alembic/core/events` 的 additive readiness，但不得把整棵 service / repository 树无脑塞进根入口。
- 为 `@alembic/core/core/enhancement` 做明确决定：若能提供稳定 exact facade，则新增 readiness 并补测试；若仍必须 transitional，则写清仍不能替换的真实消费者和阻塞点。
- 更新 public API boundary / closeout readiness map，让 Alembic / AlembicPlugin 下一波可以按表替换 deep imports。
- 增加或更新 targeted package / facade tests，证明新增 facade exports 可用且无命名冲突。

合并 TODO：`CCIC-TODO-14` 的 Core readiness 部分。

明确不包含：

- 不删除 `@alembic/core/core/*`、`@alembic/core/service/*`、`@alembic/core/repository/*` 或 `@alembic/core/infrastructure/*` public export。
- 不修改 Alembic / AlembicPlugin consumer。
- 不把 CLI、Codex MCP、Dashboard、AI provider 或 Agent runtime 下沉 Core。

下一处真实阻塞点：Core readiness 未回填前，Alembic / Plugin 不能做 high-reference deep import consumer replacement。

阻塞点之前还能做：补 exact facade、补 readiness map、补 package tests、跑 public API boundary。

统一验证命令：

```text
npm run build:check
node scripts/public-api-boundary-policy.mjs
node scripts/check-public-api-boundary.mjs --format json
node scripts/report-public-api-closeout.mjs
相关 targeted Vitest
git diff --check
```

回填要求：新建 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-3-2026-05-23.md`，写清新增 facade、未替换原因、readiness map、验证命令、提交 hash、遗留阻塞和给 Alembic / Plugin 下一波 consumer replacement 的建议。

### CCIC-P3-A：Alembic Resident Tool Handler 命名迁移第一片

窗口：`Alembic`

阶段目标：把 Alembic resident service / resident tool handler 的内部实现从误导性的 `lib/external/mcp` 语义中迁出第一片，同时保留旧路径兼容 alias，确保 CLI / daemon / HTTP routes / tests 不断。

主线动作：

- 读取 `Alembic/AGENTS.md`、CCIC-P2-A 回填记录、`lib/external/mcp/**`、`bin/cli.ts`、`lib/daemon/DaemonJobRunner.ts`、`lib/http/routes/{task,skills,candidates}.ts`、相关 tests。
- 设计并实现 Alembic-owned 目标命名空间，例如 resident tool / resident service handler / legacy schema contract 三类目录；目标名必须表达“这是 Alembic 本地增强底座的 resident service handler”，不要暗示 Codex Plugin MCP ownership。
- 先迁移内部 Alembic consumers 到新语义入口；旧 `lib/external/mcp/**` 中被外部或测试仍引用的文件只保留 re-export / compatibility adapter，并写清真实消费方、保留理由、移除条件和下一步删除触发点。
- `tools.ts`、`envelope.ts`、`errorHandler.ts`、`handlers/types.ts` 这类 legacy MCP vocabulary 如果仍需保留，必须标注它们是 Alembic resident tool schema / legacy envelope，不是 Plugin MCP server。
- 更新 boundary tests / residual scans，证明旧路径只剩明确 compatibility alias 或历史负向测试，不再是主实现入口。

合并 TODO：`CCIC-TODO-13` 的第一阶段。

明确不包含：

- 不删除仍被真实消费者引用的 old path。
- 不改 Codex Plugin MCP tool ownership。
- 不移动 cold-start / rescan 真实 workflow 实现出 `lib/workflows/**`。
- 不改变 CLI、daemon、HTTP API、Dashboard server 或真实项目行为。

下一处真实阻塞点：没有 legacy alias 和 consumer replacement 证据前，不能删除 `lib/external/mcp` old path。

阻塞点之前还能做：建立新语义入口、迁移内部 consumers、保留旧 alias、更新 tests 和扫描。

统一验证命令：

```text
npm run build:check
npm run lint:repo-boundary
npm run lint:consumer-core-imports
相关 targeted unit / integration tests
git diff --check
```

回填要求：新建 `docs/Alembic/capability-code-interface-cleanup-main-ccic-3-2026-05-23.md`，写清目标目录选择、迁移文件、保留 alias、删除候选、负向扫描、验证命令、提交 hash 和下一步能否删除旧路径。

### CCIC-P3-P：AlembicPlugin Audit Contract 收敛

窗口：`AlembicPlugin`

阶段目标：消除 Plugin audit 读写 contract 的历史双轨，保留真实消费方，删除或统一无消费方 `AuditRepositoryImpl`，不影响 Gateway / AuditLogger / HTTP audit route / runtime artifact。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、CCIC-P2-P 回填记录、`lib/infrastructure/audit/AuditStore.ts`、`lib/repository/audit/AuditRepository.ts`、`lib/infrastructure/audit/AuditLogger.ts`、`lib/http/routes/audit.ts`、`lib/injection/{ServiceMap.ts,modules/InfraModule.ts}`、相关 audit / gateway tests。
- 先做真实消费扫描：若 `auditRepository` 仍只有 ServiceMap 类型和 InfraModule 注册，删除 `AuditRepositoryImpl` 文件、注册、类型和测试残留；若发现真实消费者，则选择单一 contract，把 `AuditStore` / `AuditRepositoryImpl` 合并为一个后端，不允许继续双轨。
- 保持 `auditStore` / `auditLogger` service key 的外部行为不变，HTTP audit route、Gateway 审计、Dashboard audit socket event 和 tests 不断。
- 若 runtime artifact 受影响，必须同步 AlembicCodex runtime artifact 并回填 artifact hash；不得只改 source 不改 runtime package。

合并 TODO：`CCIC-TODO-15`。

明确不包含：

- 不改 Guard 审计语义。
- 不改 Dashboard 前端。
- 不引入外部 AI / Agent runtime。
- 不借 audit 清理触碰 host-managed legacy 字段。

下一处真实阻塞点：Audit 双轨未收敛前，Plugin repo-boundary 和 repository/service 语义仍会继续制造“保留哪个 contract”的歧义。

阻塞点之前还能做：删除无消费方 repository 或合并为唯一后端，补 tests，重建 runtime artifact。

统一验证命令：

```text
npm run lint:repo-boundary
npm run build:check
相关 targeted unit / integration tests
npm run build
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run verify:codex-channel
npm run report:agent-extraction-boundary
git diff --check
```

回填要求：新建 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-3-2026-05-23.md`，写清 audit contract 选择、删除 / 合并范围、真实消费方扫描、runtime artifact hash、验证命令、提交 hash 和遗留风险。

### CCIC-P1-A：Alembic DB Boundary 与 Service Handler 边界

窗口：`Alembic`

阶段目标：修复已经可复现的 DB boundary lint 违规，避免 HTTP / service / daemon 直接访问底层 DB；同时只读盘点 `lib/external/mcp` 命名债，禁止本波直接整体重命名或删除。

主线动作：

- 读取 `Alembic/AGENTS.md`、`scripts/lint-repo-boundary.mjs`、当前 lint 输出和命中的文件。
- 将 `lib/http/routes/daemon.ts`、`bin/daemon-server.ts` 的 schema version 读取收敛到 repository 或 `lib/infrastructure/database/` 拥有的 helper。
- 将 `CleanupService`、`HitRecorder`、`AuditStore` 中直接 `prepare()` / `getDb()` 的逻辑移动到合适的 repository / database infrastructure helper；不要为了过 lint 简单扩大 lint allowlist。
- 对 `lib/external/mcp` 做消费方盘点，记录哪些是 Alembic service handler / schema legacy name，哪些后续可以改名；本波只写执行记录和候选，不直接做大迁移。

合并 TODO：`GTODO-2026-05-22-013`、`GFBD-OQ-5`、`GFBD-OQ-7`。

明确不包含：

- 不删除 `lib/external/mcp`。
- 不重命名 MCP handler 目录。
- 不改 Codex Plugin MCP tool ownership。
- 不把 DB helper 搬进 Core。

下一处真实阻塞点：DB boundary lint 未修复前，Alembic 主仓库无法把 repository / infrastructure / http / daemon 分层作为后续清理依据；`lib/external/mcp` 消费方未盘清前，不允许进入命名迁移。

阻塞点之前还能做：修复当前 18 处 lint 命中，补充 targeted tests；同时输出 `lib/external/mcp` 消费方盘点和后续候选，不做大迁移。

统一验证命令：

```text
npm run lint:repo-boundary
npm run build:check
相关 targeted unit / integration tests
git diff --check
```

回填要求：新建 `docs/Alembic/capability-code-interface-cleanup-main-2026-05-22.md`，写清完成范围、提交 hash、lint 结果、targeted tests、`lib/external/mcp` 消费方盘点和后续候选。

### CCIC-P1-C：AlembicCore Public API Closeout 证据

窗口：`AlembicCore`

阶段目标：为后续接口清洁建立可靠 public API / deep import 账本，避免执行窗口凭直觉删 export。

主线动作：

- 读取 `AlembicCore/AGENTS.md`、`config/public-api-boundary.json`、`scripts/public-api-boundary-policy.mjs`、`scripts/report-public-api-closeout.mjs` 和 `package.json` exports。
- 运行或更新现有 closeout/report 脚本，输出当前 stable / provisional / transitional / wildcard exports 状态。
- 结合外层消费扫描，标记 `consumer-replace-first`、`no-consumer-deprecate-candidate`、`must-keep` 三类。
- 如果发现无消费者且无 runtime 入口的明显冗余 export，可以列为下一波删除候选；本波不得删除 public export。

合并 TODO：`GFBD-OQ-2`、`GTODO-2026-05-21-003`。

明确不包含：

- 不删除或重命名 public export。
- 不修改 Alembic / Plugin / Agent consumer。
- 不把 Agent runtime 或 Codex host response contract 下沉 Core。

下一处真实阻塞点：没有 Core export 分类和真实消费者映射前，后续窗口不能安全做 consumer replacement 或 export 删除。

阻塞点之前还能做：运行 closeout / policy 脚本，生成 stable / provisional / transitional / wildcard 分类和 consumer-replace-first 清单。

统一验证命令：

```text
npm run build:check
node scripts/public-api-boundary-policy.mjs
node scripts/report-public-api-closeout.mjs
git diff --check
```

回填要求：新建 `docs/AlembicCore/capability-code-interface-cleanup-core-2026-05-22.md`，写清 export 分类、消费者证据、可删候选、不得删项和下一波 consumer replacement 建议。

### CCIC-P1-G：AlembicAgent Host Agent 口径清洁

窗口：`AlembicAgent`

阶段目标：把 AlembicAgent 的 internal AI / Agent runtime 口径和 Codex host agent 口径进一步分开，避免后续窗口误把 Agent 当 Plugin。

主线动作：

- 读取 `AlembicAgent/AGENTS.md`、`src/agent/runtime/AgentRuntimeBoundary.ts`、`src/agent/runtime/AgentMessage.ts`、`src/agent/index.ts`、tool routing comments 和相关 docs。
- 清理或补充注释 / boundary metadata：Codex MCP、marketplace、channel、host-agent route 归 `AlembicPlugin`；本仓库只拥有 internal agent runtime、provider、tool system、memory/context/prompt。
- 如果发现旧文档或注释把 MCP / IDE extension / host agent 与 AlembicAgent runtime 混用，做最小修正；不改变 runtime behavior。

合并 TODO：`GFBD-OQ-6`。

明确不包含：

- 不改 AI provider 行为。
- 不改 Tool V2 runtime 行为。
- 不接入 Codex Plugin channel / marketplace。
- 不移动 Core deterministic 代码。

下一处真实阻塞点：Agent 文档和代码注释仍混用 host agent / MCP / internal runtime 时，后续清理容易把 Codex host agent 误派给 AlembicAgent。

阻塞点之前还能做：只修正文档、boundary metadata 和注释口径，保持 runtime 行为不变并通过 typecheck / targeted tests。

统一验证命令：

```text
npm run build:check
相关 targeted tests 或 typecheck
git diff --check
```

回填要求：新建 `docs/AlembicAgent/capability-code-interface-cleanup-agent-2026-05-22.md`，写清修正文件、仍保留的 runtime 边界和下一步建议。

### CCIC-P1-D：AlembicDashboard 文案与 Host-managed Consumer 清洁

窗口：`AlembicDashboard`

阶段目标：清理 Dashboard 中旧 MCP / Skill / Agent Runtime / AI 扫描口径，修正 host-managed consumer 表达，避免 UI 暗示 Dashboard 或 Plugin 在本地执行第三方 AI。

主线动作：

- 读取 `AlembicDashboard/AGENTS.md`、`src/api.ts`、`src/components/Views/HelpView.tsx`、`src/components/Views/CandidatesView.tsx`、双语 i18n。
- `src/api.ts` 保持兼容 `HOST_AI_MANAGED` / `hostManaged`，并准备接受 Plugin 后续新增的更清晰 canonical code / field；不得要求 Plugin 同步 breaking change。
- Help/i18n 文案按长期方案校准：Codex host agent 归 Plugin，Alembic internal AI 归 Alembic + Agent，Dashboard 只展示和触发，不拥有 runtime。
- 避免继续写死不确定的 MCP / Skill 数量；如果无法从稳定 API 得到数量，改成描述性文案。

合并 TODO：`GFBD-OQ-4`、`GFBD-OQ-3` 的 consumer 侧。

明确不包含：

- 不删除 Candidates AI unavailable UI。
- 不改 Dashboard API 路径。
- 不接入 Plugin 业务 API。
- 不跑真实项目手动验证。

下一处真实阻塞点：Dashboard 仍只理解 `HOST_AI_MANAGED` 且 Help/i18n 仍含旧口径时，Plugin producer 不能进一步清理 host-managed 语义。

阻塞点之前还能做：让 Dashboard consumer 同时兼容旧字段和新 canonical 字段，并修正文案，使其不暗示 Dashboard 或 Plugin 拥有本地第三方 AI runtime。

统一验证命令：

```text
npm run build
npm run typecheck 或仓库现有等价检查
相关 targeted tests
git diff --check
```

回填要求：新建 `docs/AlembicDashboard/capability-code-interface-cleanup-dashboard-2026-05-22.md`，写清文案修正、API parser 兼容策略、验证命令和仍需 Plugin producer 回填的点。

### CCIC-P1-P：AlembicPlugin Host-managed AI 边界语义清洁

窗口：`AlembicPlugin`

阶段目标：清理 Plugin 中容易误导为“Plugin 自己拥有 AI provider”的 host-managed 语义，同时保留 Dashboard 现有消费者兼容。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、`lib/http/routes/candidates.ts`、`lib/http/routes/extract.ts`、`lib/service/module/ModuleService.ts`、`lib/injection/modules/VectorModule.ts`、Skill / runtime artifact 生成链路。
- 将内部注释、日志、payload message 收敛到更清晰的 Plugin 边界：Plugin 不本地执行 AI，Codex host agent 或 Alembic resident service 承担增强路径。
- 如需新增 canonical code / field，必须保持 `HOST_AI_MANAGED` / `hostManaged` 兼容，不能破坏 Dashboard 当前消费。
- 扫描并确认旧第三方 AI provider / embedding provider surface 没有回潮；如果发现无消费方冗余代码，删除并补负向扫描。
- 同步 Codex runtime artifact / channel 所需产物。

合并 TODO：`GFBD-OQ-3`、`GTODO-2026-05-21-010` 后续残留确认。

明确不包含：

- 不恢复第三方 AI provider。
- 不删除 Dashboard 仍消费的兼容字段。
- 不把 search/vector 能力伪装成本地 Plugin embedding。
- 不改 Alembic daemon API。

下一处真实阻塞点：Plugin producer 仍用 `HOST_AI_MANAGED` 作为唯一语义时，Dashboard 和开发者会继续把“host-managed”误读为旧 AI provider 残留。

阻塞点之前还能做：新增或明确 canonical boundary 字段 / message，同时保留 `HOST_AI_MANAGED` / `hostManaged` 兼容；删除无消费方旧 AI/provider/embedding 残留并同步 runtime artifact。

统一验证命令：

```text
npm run build:check
相关 candidates/extract/module/HTTP targeted tests
npm run verify:codex-plugin
npm run verify:codex-channel
runtime artifact 状态检查
旧 AI/provider/embedding surface 负向扫描
git diff --check
```

回填要求：新建 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-2026-05-22.md`，写清提交 hash、runtime artifact hash、保留兼容字段理由、删除项、负向扫描和 Dashboard consumer 兼容证据。

### CCIC-P2-C：AlembicCore Facade Readiness 与口径清洁

窗口：`AlembicCore`

阶段目标：让 Core 提供的 exact facade / readiness 证据足够支撑 Alembic scripts 离开 `@alembic/core/core/*` deep import；同时清理 Core 内会误导为本地 AI provider 或 Agent runtime ownership 的注释 / 日志标签口径。

主线动作：

- 读取 `AlembicCore/AGENTS.md`、`src/project-intelligence.ts`、`config/public-api-boundary.json`、`scripts/report-public-api-closeout.mjs`、`scripts/check-public-api-boundary.mjs`。
- 确认 `@alembic/core/project-intelligence` 是否已经完整覆盖 Alembic scripts 需要的 discovery / AST symbols：`getDiscovererRegistry`、`resetDiscovererRegistry`、`LanguageService`、`analyzeProject`、`isProjectAstAvailable`、`loadProjectAstPlugins`。
- 在 `config/public-api-boundary.json` 的 facade readiness 中补充 `@alembic/core/core/discovery`、`@alembic/core/core/AstAnalyzer`、`@alembic/core/core/ast` 迁移建议；如需涉及 `@alembic/core/core/enhancement`，只能写清为什么本波保留或为何已有替代入口，不能凭空新增不被消费的 facade。
- 清理 `src/infrastructure/vector/BatchEmbedder.ts` 中 OpenAI / Gemini provider ownership 口径，把它改成“外部注入 embedding provider / 批量 embedder utility”；检查 `src/infrastructure/logging/Logger.ts` 的 `AgentRuntime` / `ToolRegistry` tag 是否只是日志高亮，必要时收敛命名或补注释，避免误读为 Core 拥有 AlembicAgent runtime。
- 重新运行 public API boundary / closeout 脚本，确认没有扩大 wildcard export 或新增 public export 删除风险。

合并 TODO：`CCIC-TODO-9` 的 Core readiness 侧、`CCIC-TODO-12`。

明确不包含：

- 不删除 Core public export。
- 不迁移 Alembic / AlembicPlugin consumer。
- 不把 AI provider、Codex MCP、Dashboard UI 或 AlembicAgent runtime 下沉 Core。
- 不新增无真实消费方的 facade；若现有 `project-intelligence` 已足够，只更新 readiness / 注释证据。

下一处真实阻塞点：Core readiness 不明确时，Alembic consumer replacement 会继续靠窗口猜测替代入口；Core 口径残留不清时，后续职责边界仍会把 provider / Agent runtime 误读进 Core。

阻塞点之前还能做：只补 exact facade readiness、清理注释 / 日志口径，并用现有 public API 脚本证明没有破坏 Core package 边界。

统一验证命令：

```text
npm run build:check
node scripts/public-api-boundary-policy.mjs
node scripts/check-public-api-boundary.mjs --format json
node scripts/report-public-api-closeout.mjs
git diff --check
```

回填要求：新建 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-2-2026-05-23.md`，写清 readiness map 变化、是否新增 / 未新增 public facade、口径清洁文件、验证命令、验证结果和仍需 Alembic consumer replacement 的点。

### CCIC-P2-A：Alembic Core Consumer Replacement 与 Resident Handler 命名前置

窗口：`Alembic`

阶段目标：先关闭 Alembic scripts 中当前阻塞 Core consumer boundary 的 4 个 deep import issue；同时把 `lib/external/mcp` 从“看起来像 Plugin MCP ownership”的歧义，进一步整理为 Alembic resident service handler / schema legacy naming 的迁移账本，给下一波实名迁移提供真实入口。

主线动作：

- 读取 `Alembic/AGENTS.md`、`config/core-import-boundary.json`、`scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts`、`package.json` 中 `lint:consumer-core-imports` / `lint:core-import-boundary` 链路。
- 将 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts` 中可替代的 `@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer` 迁到现有 exact facade，优先使用 `@alembic/core/project-intelligence`。不得为了过 lint 扩大 allowlist。
- 如果 `@alembic/core/core/enhancement` 暂无合适 exact facade，保留并写明原因；不要把它伪迁移到不承载真实 symbol 的空 facade。
- 运行 consumer boundary 检查，确认 Alembic scripts 的 4 个 issue 关闭，且没有新增 Core deep import。
- 基于 CCIC-P1-A 的 `lib/external/mcp` 消费方盘点，补一张“进入 Alembic resident service / 留在 legacy handler / 删除候选 / 不得删除 / 反馈给 Plugin 或 Core”的分类表。允许做小范围真实迁移，但仅限已有明确替代入口、能被 targeted tests 覆盖的 import；不得整目录重命名或删除。
- 更新或新增 tests 时优先覆盖 scripts import boundary、CLI bootstrap/rescan、daemon job runner、HTTP candidates/task/skills 的真实消费路径。

合并 TODO：`CCIC-TODO-6`、`CCIC-TODO-9` 的 Alembic consumer 侧。

明确不包含：

- 不删除 `lib/external/mcp` 整目录。
- 不把 Alembic resident service handler 误归给 `AlembicPlugin`。
- 不删除 Core public export。
- 不修改 Dashboard 前端或真实测试项目。
- 不新增空 adapter；任何新入口必须有当前消费者迁移和验证证据。

下一处真实阻塞点：Alembic scripts 不离开 Core deep import，Core export closeout 就无法进入下一阶段；`lib/external/mcp` 不做真实分类，后续实名迁移会继续靠猜测。

阻塞点之前还能做：关闭已确认的 4 个 Core consumer issue，补齐 resident handler 命名迁移分类账本，必要时做小范围有消费者的真实迁移。

统一验证命令：

```text
npm run lint:consumer-core-imports
npm run build:check
相关 scripts / CLI / daemon / HTTP targeted tests
rg -n "@alembic/core/core/(discovery|ast|AstAnalyzer)" scripts lib bin test config
git diff --check
```

回填要求：新建 `docs/Alembic/capability-code-interface-cleanup-main-ccic-2-2026-05-23.md`，写清关闭的 Core import issue、保留的 Core deep import 及理由、`lib/external/mcp` 分类表、提交 hash、验证命令、验证结果和下一波能否进入实名迁移。

### CCIC-P2-P：AlembicPlugin Repo-boundary DB 访问收敛

窗口：`AlembicPlugin`

阶段目标：修复 Plugin 自身 `npm run lint:repo-boundary` 的既有 DB boundary 债，让 Codex plugin runtime 的数据库读取 / 统计 / 健康检查路径符合 Plugin first 职责边界：Codex-facing runtime 可以读自己的状态，但 raw sqlite / `prepare()` / `getDb()` 访问必须收敛到 repository 或 database infrastructure helper。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、`scripts/lint-repo-boundary.mjs`、`bin/daemon-server.ts`、`lib/http/routes/daemon.ts`、`lib/codex/KnowledgeState.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`lib/repository/audit/AuditRepository.ts`。
- 将 daemon health schema version 读取、Codex KnowledgeState 只读 snapshot 统计、CleanupService / HitRecorder raw query 迁入 `lib/infrastructure/database/` 或明确 repository helper；不要为了过 lint 扩大 allowlist。
- 检查 `AuditStore` 与 `AuditRepository` 是否重复；如果本波能安全合并，必须保留真实调用方和测试；如果不能，写清保留理由、移除条件和后续触发点。
- 如果改动进入 Codex runtime dist 消费链，必须重新同步 `plugins/alembic-codex/runtime.tgz` 和 runtime dist，并回填 runtime artifact hash；如果不需要同步，必须写明原因。
- 负向扫描旧 raw DB 违规，确认剩余 `prepare()` / `getDb()` 只在 `lib/repository/`、`lib/infrastructure/database/` 或 test 中，或带有明确合法 escape hatch。

合并 TODO：`CCIC-TODO-11`。

明确不包含：

- 不恢复旧 AI provider / embedding provider。
- 不改 resident vector search service contract。
- 不改 Dashboard UI。
- 不把 Plugin 做成 Alembic daemon 的空壳；Plugin 仍保留 Codex host agent 入口、自有 Skill / MCP / runtime artifact 闭环。
- 不直接处理 `alembic-ai@0.2.0` 发布身份重叠，除非 DB boundary 修改实际触发 release package 证据。

下一处真实阻塞点：Plugin repo-boundary 不清时，后续继续整理 Plugin runtime / service / repository 结构会混入 DB 访问历史债，难以判断哪些是 Codex 自洽闭环、哪些是 Alembic 主体能力。

阻塞点之前还能做：仿照 Alembic CCIC-P1-A 的真实修复方式，先把现有 raw DB 命中收敛到 infrastructure / repository，并用 lint / targeted tests / runtime artifact 证据封口。

统一验证命令：

```text
npm run lint:repo-boundary
npm run build:check
相关 CodexKnowledgeState / CleanupService / HitRecorder / daemon route targeted tests
如涉及 runtime：npm run prepare:codex-plugin-runtime && npm run verify:codex-plugin && npm run verify:codex-channel
旧 raw DB 违规负向扫描
git diff --check
```

回填要求：新建 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-2-2026-05-23.md`，写清完成范围、提交 hash、lint 结果、targeted tests、runtime artifact 是否同步及 hash、AuditStore / AuditRepository 判断、遗留风险和下一步建议。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CCIC-TODO-1 | 已完成 | 边界修复 | P0 | `Alembic` | DB boundary lint 18 处违规已修复；Alembic 提交 `df36eb364b3a2d5e8e1868f2db979ffea8d974f8`，`npm run lint:repo-boundary` 通过。 | 否 | 总控验收通过。 | `Alembic` |
| CCIC-TODO-2 | 已完成 | 接口语义清洁 | P0 | `AlembicPlugin` / `AlembicDashboard` | `HOST_AI_MANAGED` / `hostManaged` 已收敛为 legacy compatibility，Plugin 新增 canonical `HOST_AGENT_MANAGED` / `PLUGIN_DETERMINISTIC_EXTRACT`，Dashboard consumer 宽兼容通过。 | 否 | 总控验收 producer / consumer 兼容证据通过。 | `AlembicPlugin` / `AlembicDashboard` |
| CCIC-TODO-3 | 已完成 | 文案清洁 | P1 | `AlembicDashboard` | Help/i18n 旧 MCP / Skill / Agent Runtime / AI 扫描口径已修正；AlembicDashboard 提交 `502b078c4d1a7123542ae4bce4d92bf916c79c8f`。 | 否 | 总控验收通过。 | `AlembicDashboard` |
| CCIC-TODO-4 | 已完成 | 口径清洁 | P1 | `AlembicAgent` | Internal Agent runtime 与 Codex host agent 口径已分离；AlembicAgent 提交 `929cded9e449823f0f6e4feae27f15f249352c3a`。 | 否 | 总控验收通过。 | `AlembicAgent` |
| CCIC-TODO-5 | 已完成 | 接口账本 | P1 | `AlembicCore` | Public API / deep import closeout 证据已验收，本波未删 export；后续 consumer replacement 候选转入 CCIC-TODO-9。 | 否 | `docs/AlembicCore/capability-code-interface-cleanup-core-2026-05-22.md` 已验收。 | `AlembicCore` |
| CCIC-TODO-6 | 已完成 | 命名债前置 | P2 | `Alembic` | `lib/external/mcp` service handler / schema legacy naming 前置收敛已完成：CCIC-P2-A 已补 resident handler / legacy schema / 不得删除 / 删除候选分类表，本轮未做目录迁移。 | 否 | 总控验收 Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790` 通过；后续实名迁移转入 CCIC-TODO-13。 | `Alembic` |
| CCIC-TODO-7 | 已完成 | 发布身份 | P2 | `Alembic` / `AlembicPlugin` | `alembic-ai@0.2.0` 主包与 Plugin runtime 身份重叠已由 Plugin 侧收敛：root/runtime/channel/docs/tests 改为 `alembic-codex-plugin-runtime@0.2.0`，root npm publish 仍 disabled。 | 否 | 总控验收 AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6` 和 runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297` 通过；若后续要重新设计 Alembic 主体 npm 发布身份，另开发布设计任务。 | `AlembicWorkspace` |
| CCIC-TODO-8 | 观察中 | 测试边界 | P2 | `AlembicTest` | restart / clean 脚本继续留在测试授权边界。 | 否 | 本波不需要真实项目复测。 | `AlembicTest` |
| CCIC-TODO-9 | 已完成 | consumer replacement | P1 | `Alembic` / `AlembicCore` | Alembic scripts 4 个 Core deep import boundary issue 已关闭，Core `project-intelligence` readiness 已补齐；Alembic 提交 `1a27cba52f767c223b201fe3e620f0c4cb4f6790`，AlembicCore 提交 `4d8d1df417e5f34d5166627bcdbf28547b04736a`。 | 否 | 总控验收 deep import 负向扫描、Core readiness 和 consumer boundary 证据通过。 | `AlembicCore` / `Alembic` |
| CCIC-TODO-10 | 已完成 | producer / consumer contract | P1 | `AlembicPlugin` / `AlembicDashboard` | 用户已确认 Dashboard 不再作为 Plugin producer-consumer compatibility 理由；Plugin 已删除 legacy `HOST_AI_MANAGED` / `hostManaged` / `legacyHostManaged` / `legacyBoundaryCode` 输出，保留 canonical host-agent / deterministic extract 边界。 | 否 | 总控验收 Plugin Dashboard / legacy 负向扫描通过；Dashboard 本波无任务且不再作为 Plugin 兼容保留理由。 | `AlembicPlugin` |
| CCIC-TODO-11 | 已完成 | repo-boundary 债 | P1 | `AlembicPlugin` | Plugin raw sqlite / `prepare()` / `getDb()` 已收敛到 `lib/infrastructure/database/SqliteDatabaseAccess.ts`，业务层和 runtime dist 负向扫描无残留；AlembicPlugin 提交 `90d00e923f43017d4ae9aaaa927b7d540effb6cf`，AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`。 | 否 | 总控验收 repo-boundary、runtime artifact 和 raw DB 负向扫描证据通过。 | `AlembicPlugin` |
| CCIC-TODO-12 | 已完成 | 口径清洁 | P2 | `AlembicCore` | Core `BatchEmbedder` 与 `Logger` 口径已清洁，具体 OpenAI / Gemini / provider ownership 和 `AgentRuntime` / `ToolRegistry` 日志标签已移除；AlembicCore 提交 `4d8d1df417e5f34d5166627bcdbf28547b04736a`。 | 否 | 总控验收口径负向扫描通过。 | `AlembicCore` |
| CCIC-TODO-13 | 已完成 | 命名迁移 | P1 | `Alembic` | `lib/external/mcp` resident tool handler 命名迁移第一片已通过验收：Alembic 提交 `c7e8c8d798103c549756ede5e7b1ac533917d64c` 建立 `lib/resident/tool-handlers` / `tool-schema`，旧路径 alias 保留，old path 不做最终删除。 | 否 | 总控 2026-05-23 11:21:57 CST 验收通过；后续删除前必须再次 consumer scan，转入 CCIC-TODO-17 观察。 | `Alembic` |
| CCIC-TODO-14 | 已完成 | public API 收敛 | P1 | `AlembicCore` / `Alembic` / `AlembicPlugin` | Core CCIC-P3-C high-reference facade readiness 已通过验收：`service/knowledge/*` -> `./knowledge`、`service/evolution/*` -> `./evolution`、repository high-reference paths -> `./repositories`、`infrastructure/signal/*` -> `./events`，`core/enhancement` 保持 transitional；外层 consumer replacement 已转入 CCIC-TODO-16 / CCIC-4。 | 否 | AlembicCore `5994a058038217635580cf68358c0e133c73f747` 验收通过；CCIC-4 只能消费已验收 facade，不得直接删除 public export。 | `AlembicCore` |
| CCIC-TODO-15 | 已完成 | audit contract | P2 | `AlembicPlugin` | Plugin `AuditStore` / `AuditRepositoryImpl` 双轨已通过验收：`AuditStore` 保留为唯一真实后端，`AuditRepositoryImpl` 文件 / DI 注册 / ServiceMap 类型已删除，并同步 runtime artifact。 | 否 | AlembicPlugin `87de9fdee8feb20ce000bf30c3d0ba79559afdc5`、AlembicCodex runtime `b80ea951610cf8ee2a3760165ee014288d3d0c1f` 验收通过。 | `AlembicPlugin` |
| CCIC-TODO-16 | 已完成 | consumer replacement | P1 | `Alembic` / `AlembicPlugin` | CCIC-4 两侧均已通过总控验收：Alembic `CCIC-P4-A` 提交 `b3eb9ab0accf597dd046b4fc2bcb8cfc8d20ca34`，Plugin `CCIC-P4-P` 提交 `2060aed9dd0fa0eb684df52826f15dbdac820918`，runtime artifact `add1db81adfbe1ac7d76e24e432012c35904b21a`。两侧 high-reference Core deep imports 已迁到已验收 exact facade，并更新 boundary 计数。 | 否 | 总控 2026-05-23 12:55:55 CST 验收通过；后续 public export 删除、legacy alias 删除和 residual path 分类另开阶段。 | `AlembicWorkspace` |
| CCIC-TODO-17 | 已完成 | legacy alias 删除 | P2 | `Alembic` | Alembic CCIC-P6-A 已删除 `lib/external/mcp/handlers/bootstrap-internal.ts`、`rescan-internal.ts`、`bootstrap/refine.ts` 三条纯 alias；提交 `bfd03984079caea94aae2ce32aa455422db0fa3a`，old external path full scan 无命中。 | 否 | 总控 2026-05-23 14:22:18 CST 验收通过；`knowledge` / `panorama` 等 legacy handlers 本轮无已验收 resident replacement，仍不得整目录删除 `lib/external/mcp`。 | `Alembic` |
| CCIC-TODO-18 | 已完成 | 下一波门禁 | P1 | `AlembicWorkspace` | CCIC-4 门禁已完成检查：Core readiness、Alembic resident handler 迁移第一片、Plugin audit 收敛三项均通过总控验收。 | 否 | 2026-05-23 11:32:43 CST 已按用户要求启动 CCIC-4，只做 Alembic / Plugin high-reference Core consumer replacement。 | `AlembicWorkspace` |
| CCIC-TODO-19 | 已完成 | facade gap / residual classification | P2 | `AlembicCore` / `Alembic` / `AlembicPlugin` | CCIC-5 residual Core path 分类已通过总控验收：Core 完成 readiness map / additive stable `EvolutionPolicy` facade / targeted tests，Plugin 完成 source / tests / runtime dist / vendor snapshot 分类，Alembic 完成 373 files / 456 imports、stable-public 366 / provisional-public 71 / transitional-internal 19 的分类输入。 | 否 | 总控 2026-05-23 13:37:30 CST 复核三份执行记录、提交 / artifact 状态、工作区状态和关键负向扫描通过；后续 replacement 另入 CCIC-TODO-20。 | `AlembicWorkspace` |
| CCIC-TODO-20 | 已完成 | consumer replacement / alias closeout | P1 | `Alembic` / `AlembicPlugin` / `AlembicCore` | CCIC-6 两侧已通过总控验收：Plugin 提交 `e5295ab57221e9ccbb7abb3a3099a7a83d3b1e3b`、AlembicCodex runtime artifact `fda5b97a3ed1d9f015f8cdec0afcffd5ec716010`；Alembic 提交 `bfd03984079caea94aae2ce32aa455422db0fa3a`。两侧均只消费 CCIC-5 已验收 stable / provisional readiness，并收紧 boundary config。 | 否 | 总控 2026-05-23 14:22:18 CST 验收通过；Core `normalizeLifecycle` 缺口转入 CCIC-TODO-21 观察。 | `AlembicWorkspace` |
| CCIC-TODO-21 | 观察中 | Core additive readiness | P2 | `AlembicCore` / `Alembic` | Alembic CCIC-P6-A 回填 `@alembic/core/knowledge` 尚未导出 `normalizeLifecycle`，因此 `DomainLifecycle` / `KnowledgeGovernance` 保留 2 处 test-only `@alembic/core/domain/knowledge/Lifecycle` allowance。 | 否 | 已转入全局 TODO `GTODO-2026-05-23-019` 长期观察；只有继续收束 test-only residual 或准备 Core public API closeout 时启动；不得为清零 deep import 直接删除 test-only allowance。 | `AlembicCore` |
| CCIC-TODO-22 | 已完成 | old Dashboard / old caller cleanup | P0 | `AlembicPlugin` | Plugin 中旧 Dashboard / 旧调用方兼容残留已删除或改为 neutral handoff / HTTP 语义；只保留本地 Alembic daemon Dashboard URL handoff；source、runtime dist、docs、tests 和负向扫描已同步。 | 否 | 总控验收 AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`、AlembicCodex `5c5074346029f4975fa4f8cbb4da662d0838a297`、Dashboard / legacy 负向扫描通过。 | `AlembicPlugin` |
| CCIC-TODO-23 | 已完成 | package / runtime identity rename | P0 | `AlembicPlugin` | Plugin root/runtime/channel/package identity 已改为 `alembic-codex-plugin-runtime@0.2.0`，prepare / verify / smoke / tests / docs 已同步，wrapper 默认 npm cache 切到新 runtime 身份。 | 否 | 总控验收 package/channel 身份正向扫描、runtime artifact diff check 和 `runtime.tgz` SHA-256 `318099ac67031a493840f18d77d4916fe457b420bd5249f72ce69a0e54652ce8` 通过。 | `AlembicPlugin` |
| CCIC-TODO-24 | 已完成 | resident handler entrypoint pruning | P0 | `Alembic` | Alembic `CCIC-P7-A` 已完成：剩余 resident handlers 迁入 `lib/resident/tool-handlers`，无消费方 `lib/external/mcp` alias 与 `#external/*` import map 已删除，`lib/external/mcp` 仅保留 README 边界标记。 | 否 | 总控验收提交 `2704216fdfda47b3327c7caf60f3a7df9b3429d2`、`find Alembic/lib/external/mcp -name '*.ts' -print` 无输出、old path 负向扫描和 diff check 通过。 | `Alembic` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | `CCIC-P7-A` 已通过总控验收：提交 `2704216fdfda47b3327c7caf60f3a7df9b3429d2`，`lib/external/mcp` TypeScript entrypoints 已清空，剩余 resident handlers 已迁入 `lib/resident/tool-handlers`。CCIC-8 总体验收时工作区干净。 |
| `AlembicCore`<br>观察中 | 本波不发送；`normalizeLifecycle` additive readiness 已转入全局 TODO `GTODO-2026-05-23-019`。Core 主要等待 Plugin / Alembic 主体交流接口后续对齐，不抢做当前任务。 |
| `AlembicAgent`<br>无任务 | CCIC-1 已完成；本波不涉及 AlembicAgent runtime、provider 或 tool system。 |
| `AlembicDashboard`<br>无任务 | 用户已确认 Dashboard 不再接入 Plugin；Dashboard 不作为 Plugin 兼容保留理由，本波不发送。 |
| `AlembicPlugin`<br>已完成 | `CCIC-P7-P` 已通过总控验收：提交 `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`，AlembicCodex runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`，旧 Dashboard / old caller compatibility 与旧 `alembic-ai` package identity 已收敛。CCIC-8 总体验收时 root 与 runtime artifact 工作区干净。 |
| `AlembicTest`<br>无任务 | 本波不操作真实项目；只有 CCIC-7 刷新本机 Codex plugin cache、改变 prime/search/cold-start、daemon HTTP contract 或真实项目路径时再创建测试单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

### 派发细节

- `Alembic`：已回填并通过总控验收 `docs/Alembic/capability-code-interface-cleanup-main-ccic-7-2026-05-23.md`；提交 `2704216fdfda47b3327c7caf60f3a7df9b3429d2`。
- `AlembicPlugin`：已回填并通过总控验收 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-7-2026-05-23.md`；提交 `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`，runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`。
- `AlembicCore`：无需新建文档；本波只观察，原因是当前用户把 Core 定位为后续 Plugin 与 Alembic 主体交流接口慢慢对齐，不参与 CCIC-7 主派发。
- `AlembicAgent`：无需新建文档；本波无任务，原因是不触碰 Agent runtime / provider / tool system。
- `AlembicDashboard`：无需新建文档；用户已确认 Dashboard 不再接入 Plugin，本波不改变 UI。

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 |
| --- | --- | --- |
| `Alembic` | 已完成；CCIC-8 总体验收通过，不发送执行提示词。 | 否 |
| `AlembicCore` | 观察中；`normalizeLifecycle` additive readiness 已转入全局 TODO `GTODO-2026-05-23-019`，Plugin / Alembic service contract 后续再慢慢对齐。 | 否 |
| `AlembicAgent` | 无任务；本波不涉及 Agent runtime。 | 否 |
| `AlembicDashboard` | 无任务；Dashboard 不再作为 Plugin 兼容消费方。 | 否 |
| `AlembicPlugin` | 已完成；CCIC-8 总体验收通过，不发送执行提示词。 | 否 |
| `AlembicTest` | 无真实项目操作，无测试单。 | 否 |
| `BiliDili` | 无任务。 | 否 |

## 可复制分派提示词

发送给：无。

不发送给：`Alembic`（已完成）、`AlembicPlugin`（已完成）、`AlembicCore`（观察中）、`AlembicAgent`（无任务）、`AlembicDashboard`（无任务）、`AlembicTest`（无任务）、`BiliDili`（无任务）。

当前没有可复制分派提示词；CCIC-8 总体验收通过，当前计划进入 workspace 归档。

## 验收标准

- 所有发送窗口必须回填执行记录、提交 hash、验证命令、验证结果和遗留风险。
- `Alembic` 必须证明 `lib/external/mcp` 剪枝从真实入口出发；迁移项有替代入口和 tests，删除项无真实消费方，保留项写清消费方、保留理由和移除条件。
- `AlembicPlugin` 必须证明旧 Dashboard / 旧调用方兼容已删除或重写为 handoff / neutral wording；package/runtime/channel identity rename 覆盖 root package、runtime package、channel metadata、prepare / verify / smoke / tests / docs；若 runtime dist 受影响，必须同步 AlembicCodex runtime artifact 并回填子仓库 hash、`runtime.tgz` SHA-256、plugin / channel verify。
- `AlembicCore` 本波观察中；只有 Plugin / Alembic 回填明确 service contract 或 facade 编译缺口时，才返工 Core additive readiness，不得主动删除 public export。
- `AlembicAgent` 本波无任务；若执行窗口发现 Agent runtime / provider 受影响，必须回填给总控重新派发。
- `AlembicDashboard` 本波无任务；Dashboard 不再作为 Plugin 兼容保留理由。
- 无产品窗口回填前，不创建 AlembicTest 测试单；若 CCIC-7 影响 Codex plugin cache、daemon HTTP contract、Dashboard 手动体验或真实项目 prime/search/cold-start 路径，再通过测试交流文档创建测试单。
- 验收后滚动 TODO：完成项关闭，仍有效项进入下一波，新增风险补入当前计划和全局 TODO。

## 回填区

- 2026-05-23 15:40 CST：总控完成 CCIC-8 总体验收。复核范围：Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin、AlembicCodex runtime artifact 工作区状态均干净；CCIC-1 至 CCIC-7 执行记录、提交 hash、验证命令、负向扫描和遗留风险已在本计划与对应 `docs/<Repo>/` 执行记录中闭合。功能完整性检查通过：本轮没有把成熟能力降级为空壳，没有把 Plugin 改成 Alembic daemon 空壳 client，没有删除 Core public export，没有误伤 Dashboard / Agent 职责；Alembic `lib/external/mcp` 只剩 README 边界标记，Plugin 旧 Dashboard / old caller compatibility 与旧 runtime package 身份已收敛。`CCIC-TODO-21` 转入全局 `GTODO-2026-05-23-019` 长期观察，不阻塞本主线；`GTODO-2026-05-22-018` 标为已完成。本轮不刷新本机 Codex plugin cache，也不创建 AlembicTest 测试单，原因是未改变真实项目 prime/search/cold-start、daemon HTTP contract 或 Dashboard 手动体验路径。

- 2026-05-23 15:26 CST：总控完成 CCIC-7 验收。复核范围：Alembic `2704216fdfda47b3327c7caf60f3a7df9b3429d2`、AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`、AlembicCodex runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`、两份执行记录和三个工作区状态。总控补跑 Alembic `find Alembic/lib/external/mcp -name '*.ts' -print`、old external MCP path 负向扫描、提交 diff check，AlembicPlugin / runtime 提交 diff check、Dashboard / legacy / package identity 负向扫描和 package/channel 身份正向扫描，均通过或符合边界测试保留语义。功能完整性检查通过：Alembic `lib/external/mcp` 已退为 README 边界标记，不再承载 resident runtime entrypoint；Plugin 旧 Dashboard / 旧调用方兼容已删除，`alembic_codex_dashboard` 仅保留本地 Alembic daemon Dashboard URL handoff，Codex MCP / Skill / channel / runtime artifact / resident service client 仍完整。`CCIC-TODO-7` / `10` / `22` / `23` / `24` 关闭；`CCIC-TODO-21` 保持观察。本轮不刷新本机 Codex plugin cache，也不创建 AlembicTest 测试单；当前发送给无，CCIC-8 进入总体验收 / 归档判断。

- 2026-05-23 11:13:54 CST：用户要求后续任务派发按北京时间记录，以便总控识别先后顺序。总控在本计划新增“任务派发时序（北京时间 UTC+8）”，补记 CCIC-3 历史派发缺少精确时间的事实，并用三仓库提交时间登记 Plugin / Alembic / Core 的 P3 完成证据顺序；后续派发、返工派发和状态切换必须登记精确北京时间。

- 2026-05-23 11:21:57 CST：总控完成 CCIC-3 验收。复核范围：AlembicCore `5994a058038217635580cf68358c0e133c73f747`、Alembic `c7e8c8d798103c549756ede5e7b1ac533917d64c`、AlembicPlugin `87de9fdee8feb20ce000bf30c3d0ba79559afdc5`、AlembicCodex runtime artifact `b80ea951610cf8ee2a3760165ee014288d3d0c1f`、三份执行记录和三仓库 `git status --short --branch`。功能完整性检查通过：Core 提供真实可消费 high-reference facade 且未删 public export；Alembic resident tool handler / schema 新语义入口已被内部消费者使用，旧 `external/mcp` 只保留明确 compatibility alias / retained legacy handler；Plugin audit contract 已收敛到 `AuditStore` / `AuditLogger` 主路径，无消费方 `AuditRepositoryImpl` source/runtime 残留已删除。总控补跑 Alembic `npm run build:check` 通过，关闭此前 Core export mismatch 阻塞。`AlembicTest` 本波不创建测试单，原因是本轮不改变真实项目 prime/search/cold-start 用户路径，也不刷新本机 Codex plugin cache。CCIC-TODO-13 / 14 / 15 / 18 关闭，CCIC-TODO-16 转为 CCIC-4 候选，CCIC-TODO-17 继续观察。

- 2026-05-23 11:32:43 CST：用户要求进行下一批计划派发。总控基于 Core P3 readiness 和 Alembic / Plugin deep import 扫描激活 CCIC-4，发送给 `Alembic`、`AlembicPlugin`。当前任务包为 `CCIC-P4-A` / `CCIC-P4-P`，只做 high-reference Core consumer replacement；`AlembicCore` 观察中，`AlembicAgent` 无任务，`AlembicDashboard` 观察中，`AlembicTest` 无任务，`BiliDili` 无任务。`CCIC-TODO-16` 转为待启动，`CCIC-TODO-19` 记录本轮排除 deep paths 的后续分类，不创建测试单。

- 2026-05-23 12:00:44 CST：`AlembicPlugin` 完成 CCIC-P4-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-4-2026-05-23.md`。完成范围：`service/knowledge/*` 消费迁移到 `@alembic/core/knowledge`，`service/evolution/*` 消费迁移到 `@alembic/core/evolution`，repository high-reference paths 迁移到 `@alembic/core/repositories`，`infrastructure/signal/*` 迁移到 `@alembic/core/events`，`ReportStore` 迁移到 provisional `@alembic/core/infrastructure/report`；更新 Plugin core import boundary config 到 461 references / 39 unique specifiers，并同步 AlembicCodex runtime artifact。提交：AlembicPlugin `2060aed9dd0fa0eb684df52826f15dbdac820918`，AlembicCodex runtime artifact `add1db81adfbe1ac7d76e24e432012c35904b21a`，`runtime.tgz` SHA-256 `5d2012d38d776ff4d3e67b4eaed211a3d6efaedd594ae1cb62c06efbd978d010`。验证：`npm run lint:consumer-core-imports` 通过（334 files / 461 imports），`npm run lint:repo-boundary` 通过，`npm run build:check` 通过，targeted unit 11 files / 193 tests 通过，targeted integration 3 files / 68 tests 通过，`npm run build`、runtime prepare、plugin/channel verify、agent extraction boundary report、source/runtime replacement 负向扫描、Agent / AI / tool 禁止项扫描和 diff check 均通过。遗留风险：本轮排除 deep paths 继续留在 `CCIC-TODO-19` 分类，不刷新本机 Codex plugin cache，不创建 AlembicTest 测试单。当前 CCIC-4 两个执行窗口均已回填，发送给无，等待总控验收。

- 2026-05-23 12:55:55 CST：总控完成 CCIC-4 验收。复核范围：Alembic `b3eb9ab0accf597dd046b4fc2bcb8cfc8d20ca34`、AlembicPlugin `2060aed9dd0fa0eb684df52826f15dbdac820918`、AlembicCodex runtime artifact `add1db81adfbe1ac7d76e24e432012c35904b21a`、两份执行记录和三个工作区状态。总控补跑 Alembic `npm run lint:consumer-core-imports` / `npm run build:check` / `npm run lint:repo-boundary`，AlembicPlugin `npm run lint:consumer-core-imports` / `npm run build:check` / `npm run lint:repo-boundary` / `npm run verify:codex-plugin` / `npm run verify:codex-channel`，以及两侧 replacement 负向扫描和提交 diff check，均通过。Alembic / AlembicPlugin / AlembicCodex runtime artifact 工作区均 clean 且 ahead 1。`CCIC-TODO-16` 关闭；`CCIC-TODO-17` legacy alias 删除和 `CCIC-TODO-19` residual Core path 分类继续观察。由于本轮未刷新本机 Codex plugin cache，也未改变真实项目 prime/search/cold-start 用户路径，不创建 AlembicTest 测试单。

- 2026-05-23 13:20:23 CST：`AlembicPlugin` 完成 CCIC-P5-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-5-2026-05-23.md`。完成范围：扫描 Plugin source production、source tests、Codex runtime dist、runtime config 和 AlembicCore vendor snapshot residual Core imports，分类 stable public、provisional / accepted public、keep-transitional、special-boundary runtime-impacting 与 test-only residual；确认本轮没有已验收新 facade 可抢跑替换。AlembicPlugin 产品提交保持 `2060aed9dd0fa0eb684df52826f15dbdac820918`，AlembicCodex runtime artifact 保持 `add1db81adfbe1ac7d76e24e432012c35904b21a`，`runtime.tgz` SHA-256 保持 `5d2012d38d776ff4d3e67b4eaed211a3d6efaedd594ae1cb62c06efbd978d010`。验证：`npm run lint:consumer-core-imports`、`npm run lint:repo-boundary`、`npm run build:check`、`npm run report:agent-extraction-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、residual Core import runtime scan、Agent / AI / Tool runtime 负向扫描、AlembicPlugin / AlembicCodex `git diff --check` 均通过。遗留风险：`core/enhancement`、CapabilityProbe、Drizzle、candidate、quality / recipe、`ContentImpactAnalyzer` 等仍待 Core P5-C readiness / keep-transitional 账本；本轮不刷新本机 Codex plugin cache，不创建 AlembicTest 测试单。当前 `AlembicPlugin` 转为待验收，仍发送给 `AlembicCore`、`Alembic`。

- 2026-05-23 13:24:11 CST：`AlembicCore` 完成 CCIC-P5-C 并回填，执行记录见 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-5-2026-05-23.md`。完成范围：更新 residual readiness map，将 `domain/knowledge/*`、`domain/evolution/*`、`repository/memory/*`、`workflows/capabilities/*` 与 `ContentImpactAnalyzer` 分类为 stable replacement，将 `core/capability/*`、`service/quality/*`、`service/recipe/*`、`service/bootstrap/*` 分类为 provisional replacement，将 AST lang、Drizzle schema、migrations 分类为 keep-transitional；在 stable `@alembic/core/evolution` facade additive 导出 `EvolutionPolicy`；新增 residual facade targeted test。提交 AlembicCore `a60dde335d76e901d31fd32eb7762bee35e7c9ea`。验证：`npm run build:check`、public API policy / boundary / closeout、targeted Vitest 4 files / 13 tests、`npm run lint`、三仓库 consumer boundary scan 和 `git diff --check` 均通过；Core 工作区干净。遗留风险：`core/enhancement`、AST lang、Drizzle / migrations 仍不得伪迁移；CCIC-6 必须等总控验收三窗口证据后再启动。当前 `AlembicCore` 转为待验收，三窗口均已回填，发送给无。
- 2026-05-23 13:25:03 CST：`Alembic` 完成 CCIC-P5-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-5-2026-05-23.md`。完成范围：新增 resident bootstrap / rescan handler surface，将 CLI coldstart / rescan、DaemonJobRunner bootstrap / rescan、HTTP candidates bootstrap-refine route 和 GoSupport bootstrap load test 切到 `lib/resident/tool-handlers`；`lib/external/mcp/handlers/bootstrap-internal.ts`、`rescan-internal.ts`、`bootstrap/refine.ts` 降为 compatibility alias；新增 boundary unit 断言生产消费方不再使用旧 external MCP path。提交 Alembic `4c35757ebed1b4ca0a31418a20835b68fbcbc648`。验证：`npm run build:check`、`npm run lint:repo-boundary`、`npm run lint:consumer-core-imports`、targeted unit 4 files / 65 tests、direct GoSupport integration 1 file / 48 tests、old bootstrap/rescan/refine path 负向扫描、`git diff --check HEAD^ HEAD` 均通过。遗留风险：旧 `external/mcp` alias 仍需总控验收后另行决定是否删除，`knowledge` / `panorama` 等 legacy handlers 本轮无 resident replacement；CCIC-6 必须等待总控验收三窗口证据后再启动。当前 `Alembic` 转为待验收，三窗口均已回填，发送给无。

- 2026-05-23 13:37:30 CST：总控完成 CCIC-5 验收。复核范围：AlembicCore `a60dde335d76e901d31fd32eb7762bee35e7c9ea`、Alembic `4c35757ebed1b4ca0a31418a20835b68fbcbc648`、AlembicPlugin `2060aed9dd0fa0eb684df52826f15dbdac820918`、AlembicCodex runtime artifact `add1db81adfbe1ac7d76e24e432012c35904b21a`、三份执行记录和四个工作区状态。总控补跑 Core / Alembic 提交 diff check、Plugin / runtime diff check、Alembic old bootstrap/rescan/refine production path 负向扫描、workspace docs / TODO / task package / dispatch coverage 校验，均通过。功能完整性检查通过：Core 只做 additive readiness 且未删除 public export；Alembic resident handler 主消费已迁到 Alembic-owned path，旧 external MCP 文件只保留有条件 compatibility alias；Plugin 本轮无源码或 artifact 改动，分类证明不需要无意义 runtime 刷新。`CCIC-TODO-19` 关闭，`CCIC-TODO-17` 保持观察，新增 `CCIC-TODO-20` 作为 CCIC-6 候选；本轮不创建 AlembicTest 测试单，原因是未刷新本机 Codex plugin cache，也未改变真实项目 prime/search/cold-start 用户路径。当前发送窗口为无。

- 2026-05-23 14:05:29 CST：`AlembicPlugin` 完成 CCIC-P6-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-6-2026-05-23.md`。完成范围：`CapabilityProbe` 收敛到 `@alembic/core/core/capability`，quality / recipe / bootstrap service 消费收敛到各自 provisional facade，`ContentImpactAnalyzer` helpers 与 `EvolutionPolicy` 收敛到 stable `@alembic/core/evolution`，`config/core-import-boundary-allowlist.json` 更新为 457 references / 36 unique specifiers；`core/enhancement`、AST lang、Drizzle / migrations 等 keep-transitional 路径未触碰。提交：AlembicPlugin `e5295ab57221e9ccbb7abb3a3099a7a83d3b1e3b`，AlembicCodex runtime artifact `fda5b97a3ed1d9f015f8cdec0afcffd5ec716010`，`runtime.tgz` SHA-256 `238b29a55df42dca256971449805713dbebe42d05552d68b1d113bc4ddf3db15`。验证：consumer-core-import lint、repo-boundary lint、build:check、targeted unit 5 files / 115 tests、targeted ProbeResolver integration 1 file / 18 tests、build、runtime prepare、plugin/channel verify、agent extraction boundary report、旧 deep import source/runtime 负向扫描、Agent / AI / tool 禁止项扫描和 diff check 均通过。补充：`npm run test:integration -- test/integration/ProbeResolver.test.ts` 因脚本固定跑完整 integration，在 sandbox HTTP listen 上出现非本轮 EPERM；已用 direct vitest 命令补足目标文件通过证据。当前 `AlembicPlugin` 转为待验收，发送窗口只剩 `Alembic`；本轮不刷新本机 Codex plugin cache，不创建 AlembicTest 测试单。

- 2026-05-23 14:11:00 CST：`Alembic` 完成 CCIC-P6-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-6-2026-05-23.md`。完成范围：将 Alembic 可安全替换 residual Core imports 收敛到 `@alembic/core/knowledge`、`@alembic/core/evolution`、`@alembic/core/memory`、`@alembic/core/host-agent-workflows`、`@alembic/core/core/capability` 和 `@alembic/core/service/{bootstrap,quality,recipe}`；删除旧 `lib/external/mcp/handlers/bootstrap-internal.ts`、`rescan-internal.ts`、`bootstrap/refine.ts` 三条纯 alias；更新 boundary tests 和 `config/core-import-boundary.json`。提交：Alembic `bfd03984079caea94aae2ce32aa455422db0fa3a`。验证：consumer-core-import lint、build:check、repo-boundary lint、targeted unit 8 files / 150 tests、targeted integration 3 files / 54 tests、release package guard、旧 deep import / old external path 负向扫描和 `git diff --check HEAD^ HEAD` 均通过。补充：`@alembic/core/knowledge` 当前未导出 `normalizeLifecycle`，因此 `DomainLifecycle` / `KnowledgeGovernance` 2 处 integration test-only `@alembic/core/domain/knowledge/Lifecycle` allowance 保留并记录为 Core 后续 additive readiness 候选。当前 `Alembic` 转为待验收；CCIC-6 两个执行窗口均已回填，发送给无。本轮未刷新本机 Codex plugin cache，不创建 AlembicTest 测试单。

- 2026-05-23 14:22:18 CST：总控完成 CCIC-6 验收。复核范围：Alembic `bfd03984079caea94aae2ce32aa455422db0fa3a`、AlembicPlugin `e5295ab57221e9ccbb7abb3a3099a7a83d3b1e3b`、AlembicCodex runtime artifact `fda5b97a3ed1d9f015f8cdec0afcffd5ec716010`、两份执行记录和三个工作区状态。总控补跑 Alembic / AlembicPlugin / runtime artifact 提交 `git diff --check HEAD^ HEAD`，Alembic old deep import / old external alias 负向扫描，Plugin source/runtime old deep import 负向扫描，均通过或无命中。功能完整性检查通过：两侧只消费 CCIC-5 已验收 facade，未扩大 allowlist，未删除 Core public export，未删除 Plugin host-managed legacy compatibility，未把 Plugin 改成 Alembic daemon 空壳 client；Alembic 三条纯 alias 删除有 full scan / tests / release guard 证据，`knowledge` / `panorama` 等仍无 resident replacement 的 legacy handlers未被误删。`CCIC-TODO-17` / `CCIC-TODO-20` 关闭，新增 `CCIC-TODO-21` 观察 Core `normalizeLifecycle` additive readiness。本轮未刷新本机 Codex plugin cache，也未改变真实项目 prime/search/cold-start、Dashboard 手动体验或 daemon HTTP contract，因此不创建 AlembicTest 测试单。当前发送给无，下一步先做 CCIC-7 目标判断。

- 2026-05-23 15:16:38 CST：`AlembicPlugin` 完成 CCIC-P7-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-7-2026-05-23.md`。完成范围：root package / lockfile、Codex runtime constants、package asset detection、channel metadata、verify / smoke / release boundary scripts、plugin docs 与 runtime package 身份统一为 `alembic-codex-plugin-runtime@0.2.0`；删除旧 `HOST_AI_MANAGED` / `hostManaged` / `legacyHostManaged` / `legacyBoundaryCode` 输出；job response 从 `dashboardUrl` 收敛为 `apiBaseUrl`，job source 从 `dashboard` 收敛为 `http`，monitoring 旧 `/dashboard` route 收敛为 `/summary`；保留 `alembic_codex_dashboard` 作为本地 Alembic daemon Dashboard URL handoff；同步 AlembicCodex runtime artifact，并将 wrapper 默认 npm cache 名称改为 `alembic-codex-plugin-runtime-npm-cache`。提交：AlembicPlugin `57c8cbb1a6d5c8d3fa22ca79171e9f14ec8863a6`，AlembicCodex runtime artifact `5c5074346029f4975fa4f8cbb4da662d0838a297`，`runtime.tgz` SHA-256 `318099ac67031a493840f18d77d4916fe457b420bd5249f72ce69a0e54652ce8`。验证：`npm run build:check`、targeted unit 11 files / 73 tests、`npm run build`、`npm run prepare:codex-plugin-runtime`、plugin/channel verify、`npm run smoke:codex-plugin`、repo-boundary lint、consumer-core-import lint、agent extraction boundary report、release package boundary、Dashboard/legacy/package identity 负向扫描和 diff check 均通过。遗留风险：本轮不刷新本机 Codex plugin cache，不创建 AlembicTest 测试单；如总控需要当前机器实际消费新 artifact，再安排 cache refresh / 真实项目复测判断。当前 CCIC-7 两个执行窗口均待验收，发送给无。

- 2026-05-23 11:56:39 CST：`Alembic` 完成 CCIC-P4-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-4-2026-05-23.md`。完成范围：将 Alembic 中 Core P3-C 已验收的 high-reference `service/knowledge/*`、指定 `service/evolution/*`、repository high-reference paths、`infrastructure/signal/*` 和 `ReportStore` consumers 分别迁到 `@alembic/core/knowledge`、`@alembic/core/evolution`、`@alembic/core/repositories`、`@alembic/core/events` 与 provisional `@alembic/core/infrastructure/report`；更新 `config/core-import-boundary.json`，移除已归零 deep import allowlist / limits，并保留 `ContentImpactAnalyzer` 1 个受限残留。提交 Alembic `b3eb9ab0accf597dd046b4fc2bcb8cfc8d20ca34`。验证：`npm run lint:consumer-core-imports`、`npm run build:check`、`npm run lint:repo-boundary`、targeted unit 7 files / 106 tests、targeted integration 3 files / 83 tests、replacement 负向扫描和 `git diff --check` 均通过；Alembic 工作区干净且 ahead 1。遗留风险：`ReportStore` 仍为 provisional，`ContentImpactAnalyzer` / `core/enhancement` / database 等排除路径仍待 CCIC-TODO-19 分类；不创建 AlembicTest 测试单。当前 `Alembic` 转为待验收，仍发送给 `AlembicPlugin`。

- 2026-05-23：`Alembic` 完成 CCIC-P3-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-3-2026-05-23.md`。完成范围：新增 `lib/resident/tool-handlers/{task,skill}.ts` 与 `lib/resident/tool-schema/{types,tools,envelope,errorHandler,zodToMcpSchema}.ts` 作为 Alembic resident tool handler / schema 第一片真实入口；旧 `lib/external/mcp/handlers/{task,skill,types}.ts`、`lib/external/mcp/{tools,envelope,errorHandler,zodToMcpSchema}.ts` 改为 compatibility alias；HTTP task / skills routes、旧 handler schema imports 和 targeted tests 已迁到 resident path。提交 Alembic `c7e8c8d798103c549756ede5e7b1ac533917d64c`。验证：Alembic `tsc --noEmit`、repo-boundary lint、consumer-core-import lint、`npm run lint`、targeted unit 4 files / 59 tests、targeted integration 2 files / 25 tests、负向扫描和 diff check 均通过；当时 `npm run build:check` 被本地 AlembicCore evolution export mismatch 阻塞，后续总控在 11:21:11 CST 补跑已通过。遗留风险：bootstrap / rescan internal handlers 和多份 legacy handlers 仍在 `lib/external/mcp`，old path 不能删除；下一片需覆盖 CLI / daemon / bootstrap pipeline consumer replacement。

- 2026-05-23：用户提醒注意 CCIC-3 时序：`AlembicPlugin` 已完成 CCIC-P3-P 并进入待总控验收，不能再作为当前执行窗口处理；同时 `AlembicCore` 已回填 CCIC-P3-C 并进入待总控验收，当时唯一继续发送 / 执行窗口为 `Alembic`。随后 `Alembic` 也已回填 CCIC-P3-A，当前发送窗口为无。总控补充 CCIC-4 下一波预案：下一波只在 Core readiness、Alembic resident handler 迁移第一片、Plugin audit contract 收敛三项全部通过验收后启动；候选仅限 Alembic / Plugin high-reference Core consumer replacement，不删除 Core public export、`lib/external/mcp` compatibility alias、host-managed legacy 字段，不创建 AlembicTest 测试单，除非后续触发真实项目 / cache / prime/search/cold-start 验证条件。

- 2026-05-23：`AlembicCore` 完成 CCIC-P3-C 并回填，执行记录见 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-3-2026-05-23.md`。完成范围：在 stable `@alembic/core/knowledge` 补齐 `CodeEntityGraph`、`ConfidenceRouter`、`KnowledgeFileWriter`、`KnowledgeGraphService`、`KnowledgeSyncService`、`RecipeExtractor`、`SourceRefReconciler`、`rewriteRecipePaths` 等 high-reference service / helper；在 stable `@alembic/core/evolution` 补齐 `ConsolidationAdvisor`、`ContentPatcher`、`DecayDetector`、`EnhancementSuggester`、`EvolutionGateway`、`LifecycleStateMachine`、`ProposalExecutor`、`RecipeImpactPlanner`、`RedundancyAnalyzer`、`StagingManager` 和 diff impact helpers；在 stable `@alembic/core/repositories` 补齐 high-reference repository implementations、`RawDbSyncAdapter`、`SyncRepo` 和 `TokenUsageStore`；更新 readiness map，`service/knowledge/*` -> `./knowledge`、`service/evolution/*` -> `./evolution`、repository high-reference paths -> `./repositories`、`infrastructure/signal/*` -> `./events`、`infrastructure/report/*` -> provisional `./infrastructure/report`，`core/enhancement` 继续保持 transitional。提交：AlembicCore `5994a058038217635580cf68358c0e133c73f747`。验证：`npm run build:check`、targeted Vitest 5 files / 22 tests、public API policy / boundary / closeout、`npm run lint`、三仓库 consumer boundary scan、`git diff --check` 均通过；Core 工作区干净。遗留风险：本轮不迁移 Alembic / Plugin consumer，不删除 Core public export；`ReportStore` 仍为 provisional，`core/enhancement` 暂不伪迁移。下一步建议：总控验收后关闭 `CCIC-TODO-14` 的 Core readiness 部分，并把 `CCIC-TODO-16` 提升为下一波 Alembic / Plugin consumer replacement 候选。

- 2026-05-23：`AlembicPlugin` 完成 CCIC-P3-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-3-2026-05-23.md`。完成范围：真实扫描确认 `AuditStore` 被 `AuditLogger`、HTTP audit route、Gateway flow / bootstrap lifecycle 和 tests 消费，`AuditRepositoryImpl` 只剩 ServiceMap 类型 / InfraModule 注册且无 `ct.get('auditRepository')` / `container.get('auditRepository')` 真实调用方；删除 `lib/repository/audit/AuditRepository.ts`、`auditRepository` DI 注册和 ServiceMap 类型入口；新增 ServiceContainer 负向契约测试；同步 AlembicCodex runtime artifact。提交：AlembicPlugin `87de9fdee8feb20ce000bf30c3d0ba79559afdc5`，AlembicCodex runtime artifact `b80ea951610cf8ee2a3760165ee014288d3d0c1f`，`runtime.tgz` SHA-256 `61e73402b378291b7149cc86f96f527b30280ad767227d0cb960984230246ae4`。验证：`npm run lint:repo-boundary`、`npm run build:check`、targeted unit 4 files / 42 tests、targeted integration 4 files / 65 tests、targeted Biome、`npm run build`、runtime prepare、plugin/channel verify、agent extraction boundary report、source/runtime audit 负向扫描、Agent / AI / tool 禁止项扫描和 diff check 均通过。遗留风险：本轮不改变 audit schema / Gateway 审计语义 / Dashboard socket event，不刷新本机 Codex plugin cache，不创建 AlembicTest 测试单。下一步建议：总控验收后关闭 `CCIC-TODO-15`；Plugin 的 Core high-reference consumer replacement 等 Core readiness 回填后再启动。

- 2026-05-23：用户要求深入思考目标、设计方案并继续下一批派发计划。总控基于 CCIC-2 验收后的真实代码扫描激活 CCIC-3：发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`。本轮代码事实：Core exact facade 已存在但 high-reference knowledge / evolution / enhancement symbols 尚未 readiness；Alembic `lib/external/mcp` 是本地增强底座 resident tool / service handler legacy naming，真实消费者集中在 CLI / daemon / HTTP / tests；Plugin `AuditStore` 有真实消费，`AuditRepositoryImpl` 当前扫描只见注册无调用方。本轮不发送 `AlembicAgent`，原因是 Agent runtime / provider / tool system 不受影响；`AlembicDashboard` 观察中，原因是本波不收窄 host-managed parser；`AlembicTest` 无任务，原因是本波不直接改变真实项目 prime/search/cold-start 用户路径。

- 2026-05-23：总控完成 CCIC-2 验收。复核范围：Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790`、AlembicCore `4d8d1df417e5f34d5166627bcdbf28547b04736a`、AlembicPlugin `90d00e923f43017d4ae9aaaa927b7d540effb6cf`、AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`。功能完整性检查通过：Alembic scripts 已使用 `@alembic/core/project-intelligence` 关闭 4 个 Core deep import issue，`lib/external/mcp` 分类表未误删真实消费者；Core `project-intelligence` readiness 成立且未删除 public export，provider / Agent runtime 口径负向扫描无残留；Plugin raw DB 访问已收敛到 database infrastructure helper，业务层与 runtime dist 负向扫描无残留，runtime artifact 已同步。三个产品仓库与 runtime artifact 子仓库工作区均干净。`AlembicTest` 本波不创建测试单，原因是本轮不改变真实项目 prime/search/cold-start 用户路径，也未刷新本机 Codex plugin cache。CCIC-TODO-6 / 9 / 11 / 12 关闭；后续 `external/mcp` 实名迁移、`core/enhancement` / 高引用 deep import readiness、Plugin audit 双轨 contract 分别转入 CCIC-TODO-13 / 14 / 15。

- 2026-05-23：`AlembicPlugin` 完成 CCIC-P2-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-2-2026-05-23.md`。完成范围：新增 `lib/infrastructure/database/SqliteDatabaseAccess.ts`，将 daemon health schema version、Codex KnowledgeState source refs / bootstrap snapshot 只读状态、CleanupService table clear / recipe snapshot / DB export、HitRecorder stats update 统一收敛到 database infrastructure helper；更新 `bin/daemon-server.ts`、`lib/http/routes/daemon.ts`、`lib/codex/KnowledgeState.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`；删除无消费方旧 `lib/types/database.ts`；新增 targeted `SqliteDatabaseAccess` unit；同步 Codex runtime artifact。提交：AlembicPlugin `90d00e923f43017d4ae9aaaa927b7d540effb6cf`，AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`，`runtime.tgz` SHA-256 `ac244ca4471e0e43fd1e2bb142468d1a2ae478d52350ca8742217a1073bcad03`。验证：`npm run lint:repo-boundary`、`npm run build:check`、targeted unit 5 files / 48 tests、targeted Biome、业务层 raw DB 负向扫描、`npm run build`、runtime prepare、plugin/channel verify、agent extraction boundary report、Agent / AI / tool 禁止项扫描和 diff check 均通过。判断：`AuditStore` 仍被 `AuditLogger`、Gateway、HTTP audit route 和 tests 真实消费，`AuditRepositoryImpl` 仍是注册的 repository bundle；本轮不合并，后续需先确定唯一 audit contract。遗留风险：Audit 双轨语义、host-managed legacy 字段和 package identity 重叠仍留后续；本轮不创建 AlembicTest，不刷新本机 Codex plugin cache。下一步建议：总控统一验收三仓库 CCIC-2 回填后，再决定是否进入 CCIC-3。

- 2026-05-23：`AlembicCore` 完成 CCIC-P2-C 并回填，执行记录见 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-2-2026-05-23.md`。完成范围：在 `config/public-api-boundary.json` 补充 `@alembic/core/core/discovery`、`@alembic/core/core/AstAnalyzer`、`@alembic/core/core/ast` 到 stable `./project-intelligence` facade 的 readiness，并将 `@alembic/core/core/enhancement` 明确标为 `keep-transitional`；清理 `BatchEmbedder` 的具体 OpenAI / Gemini / provider ownership 口径，改为外部注入 `EmbeddingProvider`；清理 `Logger` 中 `AgentRuntime` / `ToolRegistry` 高亮标签口径；补充 `PublicProjectIntelligenceEntrypoints` facade 断言。提交：AlembicCore `4d8d1df417e5f34d5166627bcdbf28547b04736a`。验证：`npm run build:check`、`node scripts/public-api-boundary-policy.mjs`、`node scripts/check-public-api-boundary.mjs --format json`、`node scripts/report-public-api-closeout.mjs`、targeted Vitest、三仓库 consumer boundary scan、口径负向扫描、`npm run lint`、`git diff --check` 均通过；Core 工作区干净。遗留风险：Core public API 面仍大，`core/enhancement` 暂无 stable replacement，本轮不删除任何 public export。下一步建议：等 Alembic / Plugin CCIC-2 回填后统一验收，再决定是否推进 `service/knowledge` / `service/evolution` 等高引用路径 facade readiness。

- 2026-05-23：`Alembic` 完成 CCIC-P2-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-ccic-2-2026-05-23.md`。完成范围：`scripts/bench-real-projects.mts` 与 `scripts/collect-test-project-stats.mts` 从 `@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer` 迁移到 `@alembic/core/project-intelligence`；`bench-real-projects` 用 `loadProjectAstPlugins()` 替代旧 AST side-effect import，用 `isProjectAstAvailable()` 替代 deep `AstAnalyzer.isAvailable`。保留 `@alembic/core/core/enhancement`，原因是当前 allowlist 和 CCIC-2 计划均明确暂无合适 exact facade 时不伪迁移。提交：Alembic `1a27cba52f767c223b201fe3e620f0c4cb4f6790`。验证：`npm run lint:consumer-core-imports` 通过（363 files / 483 imports，Core import boundary OK）、`npm run lint:core-import-boundary` 通过、`npm run build:check` 通过、`npm run lint:repo-boundary` 通过、`npm run test:unit -- test/unit/CorePublicSurfaceSmoke.test.ts` 通过（1 file / 6 tests）、targeted Biome 通过、`rg -n "@alembic/core/core/(discovery|ast|AstAnalyzer)" scripts lib bin test config` 只剩 config allowlist / reference limit 记录、`git diff --check HEAD^ HEAD` 通过。`lib/external/mcp` 分类表已补：bootstrap/rescan 属 resident service handler，task/skill/candidates refine 属 HTTP resident route handler，types/tools/envelope/error/schema helper 属 legacy schema contract，bootstrap shared/pipeline 不得删除，旧 `McpBridgeDispatcher.ts` 仅保留负向测试。遗留风险：`core/enhancement` 仍为 allowlisted transitional import；`lib/external/mcp` 仍需 alias / consumer-replace-first 后才能实名迁移。下一步建议：等 AlembicCore CCIC-P2-C readiness 回填后评估 `core/enhancement` exact facade；CCIC-3 若迁移 `lib/external/mcp`，先设计 resident handler / schema contract / tool inventory 三类目标目录和 alias 策略。

- 2026-05-23：用户要求继续在明确各代码库职责和清理冗余上深度挖掘并派发计划。总控基于 CCIC-1 回填和真实代码扫描激活 CCIC-2：发送给 `AlembicCore`、`Alembic`、`AlembicPlugin`。本轮代码事实：Core 已有 `@alembic/core/project-intelligence` exact facade，可支撑 Alembic scripts 中 discovery / AST deep import replacement；Alembic 仍有 `scripts/bench-real-projects.mts` 与 `scripts/collect-test-project-stats.mts` 的 4 个 Core import boundary issue，`lib/external/mcp` 仍被 CLI / daemon / HTTP / tests 真实消费，不能整目录删除；Plugin 仍有 raw sqlite / `prepare()` / `getDb()` repo-boundary 债，且独立于 host-managed canonical / legacy 兼容主线。`AlembicAgent` 本波无任务；`AlembicDashboard` 观察中，因为当前不收窄 host-managed parser；`AlembicTest` 无任务，因为本波尚未触发真实项目复测、cache 刷新或 Dashboard 手动体验验证。

- 2026-05-23：总控完成 CCIC-1 验收。结论：`Alembic` DB boundary lint 修复与 `lib/external/mcp` 消费方盘点通过；`AlembicCore` public API / deep import closeout 证据通过，本波未删 export；`AlembicAgent` host agent / internal runtime 口径清洁通过，未改变 runtime；`AlembicDashboard` consumer 宽兼容与 Help/i18n 口径清洁通过；`AlembicPlugin` canonical host-managed boundary、legacy compatibility、无消费方私有残留删除和 runtime artifact 同步通过。五个产品仓库 `git status --short` 均无输出。CCIC-TODO-1 至 CCIC-TODO-5 关闭；CCIC-TODO-6 至 CCIC-TODO-12 保留为 CCIC-2 候选。`AlembicTest` 本波无任务，原因是本轮未改变真实项目 prime/search/cold-start 行为，且产品窗口已提供 targeted build/test/scans 与 runtime artifact 证据。

- 2026-05-22：`AlembicPlugin` 完成 CCIC-P1-P 并回填，执行记录见 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-2026-05-22.md`。完成范围：新增 `lib/http/utils/host-managed-boundary.ts`，将 candidates / extract / ModuleService 的 host-managed payload 收敛为 canonical `HOST_AGENT_MANAGED` / `PLUGIN_DETERMINISTIC_EXTRACT`，同时保留 legacy `HOST_AI_MANAGED` / `hostManaged` 兼容；删除无消费方私有残留 `ModuleService.#enrichRecipes(...)` 与 `#qualityScorer` 私有字段；同步 AlembicCodex runtime artifact。提交：AlembicPlugin `de77740f20a7178c195030bb871b634a202c7a3c`，AlembicCodex runtime artifact 子仓库 `b7373430aa155f2980fe6e0e10e269e2707bd0a2`，`runtime.tgz` SHA-256 `044f8f52887f27f0c32c0f961a426eaba4461cd62803afcd5286355c8e2117a3`。验证：targeted unit 3 files / 6 tests 通过，`npm run build:check` 通过，targeted Biome 通过，`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 均通过，`npm run report:agent-extraction-boundary` 通过，旧 AI/provider/embedding surface 负向扫描无命中，Agent / external AI / tool runtime 禁止项仅命中自检脚本规则，`git diff --check` 通过。遗留风险：`HOST_AI_MANAGED` / `hostManaged` 仍需作为 legacy compatibility 保留；`npm run lint:repo-boundary` 仍失败于 AlembicPlugin 既有 DB boundary 债，非本轮引入。下一步建议：总控统一验收 Plugin / Dashboard producer-consumer 兼容后，再决定是否在 CCIC-2 固化 canonical 字段消费契约或启动 legacy 删除条件判断。

- 2026-05-22：`AlembicDashboard` 完成 CCIC-P1-D 并回填，执行记录见 `docs/AlembicDashboard/capability-code-interface-cleanup-dashboard-2026-05-22.md`。完成范围：`src/api.ts` 保持 `HOST_AI_MANAGED` / `hostManaged` 兼容，同时接受 `HOST_AGENT_MANAGED`、`CODEX_HOST_AGENT_MANAGED`、`LOCAL_AI_UNAVAILABLE`、`canonicalCode`、`boundaryCode`、`hostAgentManaged`、`hostAiManaged`、`localAiUnavailable`、`managedBy` 和 nested `meta` / `boundary` 字段；Help 双语 i18n 去掉不稳定 MCP / Skill / internal tool 固定数量，收敛为 Codex host agent 归 Plugin、Alembic internal AI 归 Alembic + Agent、Dashboard 只展示和触发。提交：AlembicDashboard `502b078c4d1a7123542ae4bce4d92bf916c79c8f`。验证：`npm run build` 通过（仅 Vite 既有大 chunk 提醒）；固定数量 / 旧 `Agent Runtime` 文案负向扫描无命中；host-managed 兼容扫描命中符合保留兼容要求；`git diff --check` 通过；Dashboard 工作区干净。遗留风险：Dashboard 当前采用宽兼容解析；Help 页未接入动态 capability 数量 API。下一步建议：总控统一验收 Plugin producer 与 Dashboard consumer 后，决定是否在 CCIC-2 固化 Dashboard API contract 注释或补 consumer targeted test。

- 2026-05-22：`Alembic` 完成 CCIC-P1-A 并回填，执行记录见 `docs/Alembic/capability-code-interface-cleanup-main-2026-05-22.md`。完成范围：新增 `lib/infrastructure/database/SqliteDatabaseAccess.ts` 与 `AuditStoreQueries.ts`，将 daemon health schema version 读取、CleanupService recipe snapshot / table export 查询、HitRecorder stats update、AuditStore raw SQL 和 DB unwrap 收敛到 Alembic database infrastructure helper；`lib/http/routes/daemon.ts`、`bin/daemon-server.ts`、`CleanupService`、`HitRecorder`、`AuditStore` 不再直接触发 repo-boundary DB 违规；未扩大 lint allowlist，未删除或重命名 `lib/external/mcp`。提交：Alembic `df36eb364b3a2d5e8e1868f2db979ffea8d974f8`。验证：`npm run lint:repo-boundary` 通过，`npm run build:check` 通过，targeted unit tests 7 files / 62 tests 通过，targeted Biome 通过，`git diff --check HEAD^ HEAD` 通过。负向/盘点：`lib/external/mcp` 仍被 CLI bootstrap/rescan、daemon jobs、HTTP candidates/task/skills routes、tool schema tests 和 bootstrap / knowledge / schema helper tests 消费；本轮判定其为 Alembic resident service handler/schema legacy naming 债，后续必须 consumer-replace-first，不得直接删除。遗留风险：`lib/external/mcp` 命名仍会误导为 Plugin MCP ownership；`AuditStore` 与 `AuditRepositoryImpl` 仍有历史重复语义；全量 `npm run lint` 仍受既有非本轮 Biome 债阻塞。下一步建议：等待总控统一验收；CCIC-2 若继续 Alembic，先做 `lib/external/mcp` rename / alias / consumer replacement 计划。

- 2026-05-22：总控创建 CCIC 当前计划，基于长期职责方案、职责契约、GFBD 证据和轻量代码扫描，派发第一波能力代码 / 接口 / 冗余清理任务。当前发送窗口为 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`；`AlembicTest` 和 `BiliDili` 无任务。
- 2026-05-22：`AlembicCore` 完成 CCIC-P1-C 并回填，执行记录见 `docs/AlembicCore/capability-code-interface-cleanup-core-2026-05-22.md`。完成范围：读取 Core 规则、public API policy、closeout/report 脚本、package exports 和既有 GFBD Core 证据；运行 public API closeout/report、public API boundary、consumer import boundary 扫描；输出 `consumer-replace-first`、`no-consumer-deprecate-candidate`、`must-keep` / `keep-provisional` 分类和下一波 consumer replacement 建议。提交 hash：AlembicCore 当前 HEAD `f30beacedf89abab13b91e87e4686d0db38e7d29`；本轮未修改 AlembicCore 产品源码，未产生新的 Core 提交。验证命令：`npm run build:check`、`node scripts/public-api-boundary-policy.mjs`、`node scripts/report-public-api-closeout.mjs`、`node scripts/report-public-api-closeout.mjs --format json`、`node scripts/check-public-api-boundary.mjs --format json`、Alembic / AlembicAgent / AlembicPlugin consumer boundary scans、targeted `rg` 扫描。验证结果：Core build:check 通过；public API boundary `issueCount=0`；closeout inventory 为 98 exports / 61 wildcard，`consumer-replace-first=17`、`no-consumer-deprecate-candidate=50`、`must-keep-transitional=13`；AlembicAgent 与 AlembicPlugin consumer boundary 通过；Alembic consumer boundary 失败 4 项，集中在 scripts 的 `@alembic/core/core/discovery`、`@alembic/core/core/ast`、`@alembic/core/core/AstAnalyzer`，已列为 CCIC-2 Alembic consumer replacement 候选。遗留风险：Core public API 面仍大，且 closeout report 的 replacement readiness 尚未覆盖高频 `service/knowledge` / `service/evolution` 路径；删除阶段必须等待 consumer replacement 和再次验证。下一步建议：CCIC-2 先修 Alembic scripts 4 个 consumer boundary issues，再补 Core facade readiness map，最后才评估低风险 no-consumer wildcard 的 deprecation / removal。
- 2026-05-22：`AlembicAgent` 完成 CCIC-P1-G 并回填，执行记录见 `docs/AlembicAgent/capability-code-interface-cleanup-agent-2026-05-22.md`。完成范围：清洁 `AGENTS.md`、`AgentRuntimeBoundary.ts`、`AgentMessage.ts`、`agent/index.ts`、`LightweightRouter.ts`、`V2ToolRouterAdapter.ts` 中 internal Agent runtime / Codex host agent / MCP-like adapter 口径；未改变 runtime、provider 或 Tool V2 行为。提交：`929cded9e449823f0f6e4feae27f15f249352c3a`。验证：`npm run build:check`、`npm run test -- test/contract-surface.test.ts`、`git diff --check` 均通过。当前 `AlembicAgent` 进入待验收；发送窗口移除 `AlembicAgent`。
