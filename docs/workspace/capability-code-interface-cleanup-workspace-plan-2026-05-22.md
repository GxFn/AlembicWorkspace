# Capability Code Interface Cleanup Workspace Plan

日期：2026-05-23
状态：CCIC-3 待启动
总控窗口：AlembicWorkspace

## 目标

本计划基于已生效的全局职责契约和长期职责功能划分方案，按各仓库真实职责进行能力代码梳理、接口清洁、冗余删除和边界收敛。

长期依据：

- [alembic-global-responsibility-function-division-scheme.md](alembic-global-responsibility-function-division-scheme.md)
- [alembic-repository-responsibility-function-boundary-contract.md](alembic-repository-responsibility-function-boundary-contract.md)
- [global-function-boundary-design-workspace-plan-2026-05-22.md](global-function-boundary-design-workspace-plan-2026-05-22.md)

本计划不是重新发明职责边界，而是把 GFBD 后续候选和全局 TODO 中已经有证据的事项，滚动组合成可执行任务包。所有删除、重命名、接口清洁都必须保留真实替代入口、消费方扫描、负向扫描和验证命令。

## 总控判断

当前任务分区是“分配计划 + 代码事实分析 + TODO 滚动”。用户明确要求按各仓库职责做能力代码梳理、接口清洁和删除冗余，并要求深入思考后进行计划派发。因此本轮直接基于已确认的长期职责契约 / 方案启动执行计划，不再新建原始需求目录；若执行中发现需要删减能力、改变完整功能闭环、重命名公共发布身份或删除 Core public API，则必须暂停并回到用户确认。

当前真实阻塞点：不能在没有上游替代入口和 consumer replacement 证据前做跨仓库删除；尤其是 Core high-reference deep imports、Alembic `lib/external/mcp` legacy path、Plugin audit 双轨 contract 都需要先建立可消费的真实入口和保留 / 删除条件。

阻塞点之前还能做：

- `AlembicCore` 补 `knowledge` / `evolution` / `repositories` / `core/enhancement` high-reference facade readiness，不删除 public export，不迁移外层 consumer。
- `Alembic` 为 `lib/external/mcp` 建立 Alembic-owned resident tool / service handler 新语义入口，先迁移内部 consumers，并保留 legacy alias。
- `AlembicPlugin` 收敛 `AuditStore` / `AuditRepositoryImpl` 双轨 contract，删除无消费方 repository 或合并为唯一后端，必要时同步 runtime artifact。
- `AlembicDashboard` 暂不收窄 host-managed parser，`AlembicAgent` 暂不改 runtime，`AlembicTest` 暂不做真实项目复测；三者本波观察 / 无任务。

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

## 阶段计划

| 阶段 | 状态 | 目标 | 发送窗口 |
| --- | --- | --- | --- |
| CCIC-0 | 已完成 | 总控基于职责契约、长期方案、TODO 和轻量代码扫描确定第一波任务包。 | 无 |
| CCIC-1 | 已完成 | 第一波低耦合真实清理已通过总控验收：Alembic DB boundary、Plugin/Dashboard host-managed 语义、Agent 口径、Core public API closeout 证据。 | 无 |
| CCIC-2 | 已完成 | 第二波 consumer-replace-first 与分层清理已验收：Core facade readiness / 口径清洁、Alembic scripts deep import replacement + `external/mcp` 命名迁移前置盘点、Plugin repo-boundary DB 访问收敛。 | 无 |
| CCIC-3 | 待启动 | 第三波从“前置证据”进入“可消费替代入口”：Core 补 high-reference facade readiness，Alembic 做 resident tool handler 命名迁移第一片，Plugin 收敛 audit 双轨 contract。 | `AlembicCore`、`Alembic`、`AlembicPlugin` |
| CCIC-4 | 观察中 | 验收、更新长期契约 / 方案、关闭 TODO、归档。 | 总控 |

## 任务包

下一处真实阻塞点：Core public export 删除、Alembic `external/mcp` 旧 alias 删除、Plugin/Dashboard legacy host-managed 字段删除、真实项目复测，都必须等替代入口、consumer replacement 和 producer-consumer contract 证据更完整之后才能启动。

阻塞点之前还能做：Core 先补 `knowledge` / `evolution` / `repositories` / `core/enhancement` readiness；Alembic 先把内部消费者迁到 Alembic-owned resident tool / service handler 命名，并保留 legacy alias；Plugin 先删除或统一无消费方 `AuditRepositoryImpl` 双轨。三者互不等待、验证链路独立，可以同波派发；Alembic / Plugin 的 Core deep import consumer replacement 必须等 Core 回填后再启动。

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| CCIC-P1-A | `Alembic` | DB boundary lint 修复 + `lib/external/mcp` 命名债只读盘点。 | 已验收 |
| CCIC-P1-C | `AlembicCore` | Public API / deep import closeout 证据和安全候选清单。 | 已验收 |
| CCIC-P1-G | `AlembicAgent` | `host agent` / internal Agent runtime 口径清洁。 | 已验收 |
| CCIC-P1-D | `AlembicDashboard` | Dashboard Help/i18n 与 host-managed consumer 语义清洁。 | 已验收 |
| CCIC-P1-P | `AlembicPlugin` | Plugin host-managed AI 边界语义与冗余残留清洁。 | 已验收 |
| CCIC-P2-C | `AlembicCore` | Project-intelligence facade readiness + Core provider / agent 口径残留清洁。 | 已验收 |
| CCIC-P2-A | `Alembic` | Alembic scripts Core deep import replacement + `lib/external/mcp` 命名迁移前置盘点。 | 已验收 |
| CCIC-P2-P | `AlembicPlugin` | Plugin repo-boundary DB 访问收敛 + runtime artifact 同步判断。 | 已验收 |
| CCIC-P3-C | `AlembicCore` | High-reference facade readiness：`knowledge` / `evolution` / `repositories` / `core/enhancement` 替代入口补齐，不删 public export。 | 待启动 |
| CCIC-P3-A | `Alembic` | `lib/external/mcp` resident tool handler 命名迁移第一片：新语义入口 + 内部 consumer replacement + legacy alias。 | 待启动 |
| CCIC-P3-P | `AlembicPlugin` | Audit 双轨 contract 收敛：删除无消费方 `AuditRepositoryImpl` 或统一为唯一后端，并同步 runtime artifact 判断。 | 待启动 |

执行前置硬规则：所有窗口必须先读取本 workspace `AGENTS.md`、本计划和目标仓库自己的 `AGENTS.md`，并先明确声明当前窗口定位、目标仓库职责、本轮任务职责和明确不承担的职责；无法确认定位时必须停下回填阻塞。

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
| CCIC-TODO-7 | 观察中 | 发布身份 | P2 | `Alembic` / `AlembicPlugin` | `alembic-ai@0.2.0` 主包与 Plugin runtime 身份重叠澄清。 | 否 | 需要单独发布设计。 | `AlembicWorkspace` |
| CCIC-TODO-8 | 观察中 | 测试边界 | P2 | `AlembicTest` | restart / clean 脚本继续留在测试授权边界。 | 否 | 本波不需要真实项目复测。 | `AlembicTest` |
| CCIC-TODO-9 | 已完成 | consumer replacement | P1 | `Alembic` / `AlembicCore` | Alembic scripts 4 个 Core deep import boundary issue 已关闭，Core `project-intelligence` readiness 已补齐；Alembic 提交 `1a27cba52f767c223b201fe3e620f0c4cb4f6790`，AlembicCore 提交 `4d8d1df417e5f34d5166627bcdbf28547b04736a`。 | 否 | 总控验收 deep import 负向扫描、Core readiness 和 consumer boundary 证据通过。 | `AlembicCore` / `Alembic` |
| CCIC-TODO-10 | 观察中 | producer / consumer contract | P1 | `AlembicPlugin` / `AlembicDashboard` | Host-managed canonical contract 可进一步固化：Dashboard 当前宽兼容，Plugin 保留 legacy `HOST_AI_MANAGED` / `hostManaged`。 | 否 | 只有准备删除 legacy 字段或收窄 parser 时启动；本波不做 breaking change。 | `AlembicPlugin` / `AlembicDashboard` |
| CCIC-TODO-11 | 已完成 | repo-boundary 债 | P1 | `AlembicPlugin` | Plugin raw sqlite / `prepare()` / `getDb()` 已收敛到 `lib/infrastructure/database/SqliteDatabaseAccess.ts`，业务层和 runtime dist 负向扫描无残留；AlembicPlugin 提交 `90d00e923f43017d4ae9aaaa927b7d540effb6cf`，AlembicCodex runtime artifact `6d0f15687a6c05690bdcbb2e35f77f3e306f7cec`。 | 否 | 总控验收 repo-boundary、runtime artifact 和 raw DB 负向扫描证据通过。 | `AlembicPlugin` |
| CCIC-TODO-12 | 已完成 | 口径清洁 | P2 | `AlembicCore` | Core `BatchEmbedder` 与 `Logger` 口径已清洁，具体 OpenAI / Gemini / provider ownership 和 `AgentRuntime` / `ToolRegistry` 日志标签已移除；AlembicCore 提交 `4d8d1df417e5f34d5166627bcdbf28547b04736a`。 | 否 | 总控验收口径负向扫描通过。 | `AlembicCore` |
| CCIC-TODO-13 | 待启动 | 命名迁移 | P1 | `Alembic` | `lib/external/mcp` 仍是 Alembic resident service handler / legacy schema vocabulary 命名债；CCIC-P3-A 启动第一片：新语义入口 + 内部 consumer replacement + legacy alias，不做 old path 最终删除。 | 是 | 依赖 CCIC-P2-A 分类表；无 alias / consumer-replace-first 前不得删除旧路径。 | `Alembic` |
| CCIC-TODO-14 | 待启动 | public API 收敛 | P1 | `AlembicCore` / `Alembic` / `AlembicPlugin` | `@alembic/core/core/enhancement` 仍为 transitional import，`service/knowledge` / `service/evolution` 等高引用 deep import 需要 Core 先补 facade readiness；CCIC-P3-C 只做 Core 上游 readiness，不做外层 consumer replacement。 | 是 | Alembic / Plugin consumer replacement 依赖 CCIC-P3-C 回填；不得直接删除 public export。 | `AlembicCore` |
| CCIC-TODO-15 | 待启动 | audit contract | P2 | `AlembicPlugin` | Plugin `AuditStore` / `AuditRepositoryImpl` 双轨收敛：当前扫描显示 `AuditRepositoryImpl` 只有注册无消费方；CCIC-P3-P 删除无消费方 repository 或统一为唯一后端。 | 否 | CCIC-P2-P 已记录不合并理由；本波独立处理，不混入 DB boundary 修复链路。 | `AlembicPlugin` |
| CCIC-TODO-16 | 观察中 | consumer replacement | P1 | `Alembic` / `AlembicPlugin` | 等 CCIC-P3-C Core readiness 回填后，再把 Alembic / Plugin high-reference Core deep imports 迁到 exact facade。 | 是 | 阻塞于 CCIC-P3-C；下游不得提前猜 facade 或复制临时 contract。 | `Alembic` / `AlembicPlugin` |
| CCIC-TODO-17 | 观察中 | legacy alias 删除 | P2 | `Alembic` | 等 CCIC-P3-A 完成并有一次后续验证窗口后，再判断是否删除 `lib/external/mcp` compatibility alias。 | 否 | 依赖 CCIC-P3-A 的 alias / negative scan / retained consumer 证据；删除前需再次 consumer scan。 | `Alembic` |

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 执行 CCIC-P3-A：`lib/external/mcp` resident tool handler 命名迁移第一片，新语义入口 + 内部 consumer replacement + legacy alias。 |
| `AlembicCore`<br>待启动 | 执行 CCIC-P3-C：high-reference facade readiness，补 `knowledge` / `evolution` / `repositories` / `core/enhancement` 替代入口证据。 |
| `AlembicAgent`<br>无任务 | CCIC-1 已完成；本波不涉及 AlembicAgent runtime、provider 或 tool system。 |
| `AlembicDashboard`<br>观察中 | 本波不收窄 host-managed parser；Dashboard canonical contract 继续观察，等 Plugin 专门 contract 轮次再启动。 |
| `AlembicPlugin`<br>待启动 | 执行 CCIC-P3-P：Audit 双轨 contract 收敛，删除无消费方 `AuditRepositoryImpl` 或统一唯一后端，并同步 runtime artifact 判断。 |
| `AlembicTest`<br>无任务 | 本波不操作真实项目；只有 CCIC-3 改动影响 Codex plugin cache、Dashboard 手动体验或真实项目路径时再创建测试单。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

### 派发细节

- `AlembicCore`：文档动作新建；保存位置 `docs/AlembicCore/capability-code-interface-cleanup-core-ccic-3-2026-05-23.md`；挂载入口为本计划；回填到本计划“回填区”。
- `Alembic`：文档动作新建；保存位置 `docs/Alembic/capability-code-interface-cleanup-main-ccic-3-2026-05-23.md`；挂载入口为本计划；回填到本计划“回填区”。
- `AlembicPlugin`：文档动作新建；保存位置 `docs/AlembicPlugin/capability-code-interface-cleanup-plugin-ccic-3-2026-05-23.md`；挂载入口为本计划；回填到本计划“回填区”。
- `AlembicAgent`：无需新建文档；本波无任务，原因是不触碰 Agent runtime / provider / tool system。
- `AlembicDashboard`：无需新建文档；本波不收窄 host-managed parser，不改变 UI。

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 |
| --- | --- | --- |
| `Alembic` | CCIC-P3-A 待启动；可独立完成 resident tool handler 命名迁移第一片。 | 是 |
| `AlembicCore` | CCIC-P3-C 待启动；作为 Alembic / Plugin consumer replacement 上游。 | 是 |
| `AlembicAgent` | 无任务；本波不涉及 Agent runtime。 | 否 |
| `AlembicDashboard` | 观察中；本波不收窄 host-managed contract。 | 否 |
| `AlembicPlugin` | CCIC-P3-P 待启动；可独立完成 audit 双轨 contract 收敛。 | 是 |
| `AlembicTest` | 无真实项目操作，无测试单。 | 否 |
| `BiliDili` | 无任务。 | 否 |

## 可复制分派提示词

发送给：`AlembicCore`、`Alembic`、`AlembicPlugin`。

不发送给：`AlembicAgent`（无任务）、`AlembicDashboard`（观察中）、`AlembicTest`（无任务）、`BiliDili`（无任务）。

```text
先读取 AGENTS.md、docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md，以及你所在窗口/目标仓库的 AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给你所在窗口的 CCIC-3 任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 验收标准

- 所有发送窗口必须回填执行记录、提交 hash、验证命令、验证结果和遗留风险。
- `AlembicCore` 必须证明 high-reference facade readiness 和 public API boundary 没有退化；不得删除 public export，不得新增无真实消费方 facade。
- `Alembic` 必须证明 Alembic-owned resident tool / service handler 新语义入口可用，内部消费者已迁移，旧 `lib/external/mcp` 只剩明确 compatibility alias / legacy contract / 仍需保留的真实消费者。
- `AlembicPlugin` 必须证明 audit contract 已收敛为单一真实后端，`AuditLogger`、HTTP audit route、Gateway 审计、socket event 和 tests 不断。若 runtime dist 受影响，必须同步 runtime artifact 并回填 hash。
- `AlembicAgent` 本波无任务；若执行窗口发现 Agent runtime / provider 受影响，必须回填给总控重新派发。
- `AlembicDashboard` 本波只观察；不得要求 Plugin 删除 legacy `HOST_AI_MANAGED` / `hostManaged` 字段或收窄 parser。
- 无产品窗口回填前，不创建 AlembicTest 测试单；若 CCIC-3 影响 Codex plugin cache、Dashboard 手动体验或真实项目 prime/search/cold-start 路径，再通过测试交流文档创建测试单。
- 验收后滚动 TODO：完成项关闭，仍有效项进入下一波，新增风险补入当前计划和全局 TODO。

## 回填区

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
