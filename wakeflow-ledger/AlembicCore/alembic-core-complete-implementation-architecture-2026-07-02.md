# AlembicCore 完整实现与架构文档

> **对象**：`@alembic/core`（v0.2.0）—— Alembic 运行时家族共享的、无头（headless）、确定性的知识内核。
> **目的**：完整挖掘 AlembicCore 的实现逻辑、功能、架构层级与设计模式，作为跨仓库长期参考文档。
> **基线**：AlembicCore `main` @ commit `9ec3050`（2026-07-02）；`src/` 共 **528** 个 `.ts` 文件 / **126,562** LOC；`test/` **161** 文件；`package.json` 暴露 **62** 个公共导出子路径。
> **测绘方法**：14 个只读 agent 按 `src/` 分层并行深读真实源码（逐文件打开、按 `file:line` 取证），再由一个综合 agent 归纳跨切面数据流；全程 15 个 agent、约 233 万 token、505 次工具调用。
> **权威性提示**：本文中的 `file:line` 锚点反映上述基线快照；按 Core 教条，**原始源码读取与仓库测试才是当前行为的最终证据**，据此行动前请对照当前 HEAD 复核。

---

## 目录

本文按编号导航（渲染器锚点对 CJK 标题不稳定，故用编号 + 全文检索）。

1. **一、顶层架构总览** —— 使命定位、10 层依赖契约、公共包 API 表面、技术栈、设计教条
2. **二、跨子系统端到端数据流** —— 冷启动 Recipe 生成、知识/Recipe 生命周期与进化、搜索+向量、code_guard、ProjectContext 组装、持久化
3. **三、阅读导航指南** —— 子系统索引表、常见任务的入口、门禁与契约位置
4. **四、各子系统实现详解**（14 个分区，按层序）
   - 4.1 `shared/` 叶层基础设施
   - 4.2 `types/` 类型桥 + 根门面与公共包 API 表面
   - 4.3 `domain/` 实体与领域契约
   - 4.4 `core/ast` + `core/analysis` 多语言 AST 解析与调用图分析 LEAF
   - 4.5 `core/discovery` + `enhancement` + `capability` 结构发现与框架增强
   - 4.6 `infrastructure/` 持久化、向量、信号总线与基础设施
   - 4.7 `repository/` 持久化实现与契约
   - 4.8 `service/project-context` Project Intelligence / ProjectContext 服务
   - 4.9 `service/knowledge` + `service/evolution` 知识生命周期与进化自动化
   - 4.10 `service` Guard / Search / Source-Graph / Vector
   - 4.11 `service` Recipe / Candidate / Plan / Bootstrap / Quality
   - 4.12 `workflows/capabilities/host-agent` 宿主 Agent 编排
   - 4.13 `workflows` 其余能力（project-index、planning、coverage、persistence、presentation、cold-start、rescan）
   - 4.14 `daemon/` 契约层与验证/门禁/测试面
5. **五、附录 A：关键入口索引（全子系统）**
6. **六、附录 B：层间依赖与消费关系**
7. **七、生成溯源与使用说明**

---

## 一、顶层架构总览

### 使命与定位

`@alembic/core`(v0.2.0)是一个 **共享、headless、确定性的知识内核**,被三个宿主仓库消费:`AlembicAgent`(host-agent 工具处理器)、`Alembic`(主体应用,in-process AI)、`AlembicPlugin`(可移植运行时快照,经 `file:` link)。它提供可复用的模型、类型、配置、SQLite/Drizzle 持久化、仓储、服务、搜索/向量、Guard、AST/语法、项目智能、workflow/session/briefing 契约与规划能力,但 **从不实现宿主 Agent 本体、工具系统、AI provider、marketplace/CLI/Dashboard UI**。四道边界墙测试(`CoreCodex`/`ToolSystem`/`Delivery`/`Package`,test/ 158 文件之四)以「禁目录 + 禁导出前缀 + 禁具名实现文件」三重扫描守护这一定位。

### 核心设计信条(design doctrine)

| 信条 | 落地方式 | 关键载体 |
| --- | --- | --- |
| **确定性 headless 内核** | 只读文件系统、无交互、无副作用;所有 IO 失败归类成结构化 error 而非抛出;多次执行字节一致 | `service/project-context`、`workflows` plan、`SnapshotViews` |
| **.md 为真相源(file-first)** | 先落盘 `.md` 再写 DB;DB 仅索引缓存;`contentHash` 检测手改;DB 失败抛 `DivergenceError` 不回滚文件,靠 `KnowledgeSyncService.sync` 重建 | `KnowledgeFileWriter`、`KnowledgeUnitOfWork.commit`(CO3 W2 write-strict) |
| **Session vs Snapshot** | Session = LIVE 有状态执行上下文(写快照);Snapshot = 不可变持久化投影(`Object.freeze`) | `BootstrapSession`(LIVE) vs `ProjectSnapshot`(SSOT 不可变) |
| **Validate vs Score vs Aggregate** | Validate = 确定性 pass/fail(唯一门禁);Score = 咨询性质量(Core 内永不作门禁);Aggregate = 批内 dedup | `UnifiedValidator`/`validateCandidatesUnified` vs `QualityScorer` vs `aggregateCandidates` |
| **Plan-vs-Execute 分离** | Core 只算「扫什么/留什么/缺口在哪/账本怎么记」,真实清理/扫描/写库由外层注入 service 执行 | `buildKnowledgeRescanPlan`、`buildProjectIndexWorkflowPlanParts` |
| **Plan 不猜** | 域层 payload 只投射事实、不排序不筛选不推荐;选择权交 Agent confirm | `buildDimensionCatalogPayload`、`resolvePlanDimensionDefinitions` |
| **advisory-not-a-gate** | 覆盖账本/完成度评审的 grade/valueScore/stopReason 全是建议信号;写失败吞异常返零计数,绝不阻断维度完成 | `CoverageLedgerAdvisor`、`CompletenessCritic.shouldBlockCompletion`(恒 false) |
| **诚实降级** | `truncated` 永不省略;稳定诊断码不可重命名;`degraded`/`uncertain` 结构化写入而非静默丢失 | `OutputBudget`、`DiagnosticCodes`、`UncertaintyCollector` |

### 十层依赖契约(10-layer contract)

由 `config/layer-contract.json` + `docs/layer-contract.md` 定义,`scripts/lint-layer-contract.mjs` 强制(type-only import 作为豁免桥梁,不计入)。

| 层 | 目录 | 允许运行时 import | 职责 |
| --- | --- | --- | --- |
| shared | `src/shared/` | (无任何层) | 叶子工具:errors、schemas、taxonomies、similarity、PathGuard、LanguageProfiles、TargetClassifier、OutputBudget |
| types | `src/types/` | shared | 跨层 TYPE 桥(全 `import type`):ProjectSnapshot、SnapshotViews、KnowledgeWire、workflows 契约 |
| domain | `src/domain/` | shared, types | 实体与域契约:KnowledgeEntry、Lifecycle、DimensionRegistry、EvolutionPolicy、gateRules |
| core | `src/core/` | shared, types, infrastructure | 多语言 AST / discovery / capability 分析叶子(**blessed 可导入叶子**) |
| infrastructure | `src/infrastructure/` | shared, types | database(drizzle/migrations)、io、logging、signal、report、vector、config plumbing |
| repository | `src/repository/` | shared, types, domain, infrastructure | 持久化实现与契约(drizzle/SQLite + .md file store) |
| service | `src/service/` | shared, types, domain, **core\***, infrastructure, repository | 业务编排与规则 |
| workflows | `src/workflows/` | shared, types, domain, **core\***, infrastructure, repository, service | 高层编排 |
| daemon | `src/daemon/` | shared, types | 作业/运行时展示 + 常驻服务契约(daemon-less) |
| root facades | `src/*.ts` | \*(任意层) | 公共 package 入口门面 |

**blessed core-leaf 例外(core\*)**:`service`/`workflows` 允许直接 import 三个受祝福的 core 叶子——`GuardCheckEngine` 消费方(`core/AstAnalyzer`)、`ProjectIntelligenceRunner`、`ASTChunker`。豁免必带书面 reason(仅两条:`migration→domain`、`ASTChunker→core`),写入 `blessedImports` 矩阵。

**已知债**:`service/panorama → workflows`(动态 import,临时例外,非 blessing);`layer-contract.md` 文档仍 stale 引用不在 Core src 中的 `ProjectIntelligenceRunner`/`runProjectIndexWorkflow`。

### 公共导出面(public API surface)

`package.json` `exports` 约 60 条子路径,每条映射一个 dist barrel,由 `config/public-api-boundary.json` 分三级并强制窄度基线(`scripts/check-public-api-boundary.mjs` 接入 `npm run check`):

| 级别 | 数量 | 语义 | 约束 |
| --- | --- | --- | --- |
| stable | 25 | 长期契约 | 收敛-only,removedExports 复活即失败 |
| provisional | 8 | 试验中 | shrink-only 窄度预算(`./shared:190`、`./config:47`、`./types:6`),只降不升,升需受控授权 + note |
| transitional | 29 | 迁移期 | facadeReadiness 标注 targetFacade |

代表性门面:`src/index.ts`(根门面窄化纪律——小层 `export *`、大层逐一具名以避免同名 DTO 冲突;把 `OutputBudget`/`DivergenceError`/`PersistenceError` 从冻结的 `./shared` **re-point** 到根门面作稳定接入路)、`src/repositories.ts`(`createAlembicRepositories` 一次装配 14 仓储 + `ALEMBIC_REPOSITORY_KEYS` 可枚举守卫)、`src/guard.ts`(`createGuardCheckEngine`)、`src/project-context-capabilities.ts`(`Object.freeze` 能力门面)。兼容别名双写:`HostAgent*`↔`IDEAgent*`、`buildColdStart*`↔`buildProjectIndexFull*`、`Bootstrap`↔`AppRuntime`。

三消费仓经各自 `core-import-boundary.json` allowlist 约束,并由 `scripts/lint-consumer-core-imports.mjs` 反向扫描 `Alembic`/`AlembicAgent`/`AlembicPlugin`。

### 技术栈

TypeScript ESM(import 路径带 `.js`)、Node≥22、Biome lint、Vitest;`better-sqlite3` + `drizzle-orm`(22 业务表 + 001–016 迁移)、`web-tree-sitter`(11 语言 WASM 插件)、`zod`、`winston`、`uuid`、`p-limit`。`npm run check` 串 11 道阻断门:`build:check → public-api-boundary → layer-contract → consumer-core-imports → scope-resolution → smoke → output-budgets → space-edges → doctrine → naming → test → lint`。

---

## 二、跨子系统端到端数据流

以下六条流水线均跨越层边界,用真实类/文件锚定 digest 中列出的 entrypoint。

### 1. 冷启动 Recipe 生成(cold-start,主脊柱)

`alembic_plan` / `alembic_bootstrap` 驱动的完整闭环,横跨 service → workflows → domain → repository。

1. **Plan 前置事实收集**:`service/planFacts/collect-project-context.ts` `collectPlanProjectContext` 驱动 `service/project-context` 的查询阶梯(space→repo→map→module→module-layers),honor 原生 `ProjectScope`(经 `shared/ProjectScope.ts` `loadProjectScopeForFolder`,从 `~/.asd/project-scopes.json`)。
2. **Plan facts 投影**:`service/planFacts/project-info-tree.ts` `buildPlanFactsProjection` 产预算化 `projectInfoTree`(金字塔按 `budgetBytes` 逐节点试探/修剪,超限外置 `fullTreeRef`)+ `candidateDimensions`(经 `domain/dimension/DimensionCatalogPayload.ts` `buildDimensionCatalogPayload`,只投射事实不推荐)+ `projectProfile`。
3. **Plan 决策**:host-agent 返回 `PlanSelection`,`service/planIntent/planIntent.ts` `applyPlanSelection` 投影成执行维度 + 预算 + 模块范围(clamp);`validateCompletePlanIntent`/`normalizeConfirmedPlanIntent` 在 confirm 阶段冻结。
4. **workflow plan 装配**:`workflows/project-index/ProjectIndexPlan.ts` `buildProjectIndexWorkflowPlanParts`(full-reset 清理根经 `assertFullResetCleanupRoot` 拒绝指向 ProjectScope 成员目录,防误删源码 RISK-2)→ `ColdStartPlan.ts` `buildColdStartWorkflowPlan`;`TierScheduler` 三层依赖调度(层内 p-limit 并行、层间串行)。
5. **host-agent 维度完成**:`workflows/capabilities/host-agent` `buildMissionBriefing`(100KB 预算三级降级)+ `buildHostAgentAnalysisPacket`(稳定 key,`createHostAgentAnalysisUnitKey` content-hash 主键)投递给宿主;宿主逐维度回 `runHostAgentDimensionCompletionWorkflow`:恢复 `HostAgentSubmissionTracker` 证据 → 绑定 Recipe 维度 tag → `markDimensionComplete` → 存 checkpoint → 算 4 维质量报告。
6. **覆盖写回**:`workflows/capabilities/coverage/CoverageLedgerWrite.ts` `writeCoverageLedgerForCompletion`(advisory,写失败吞异常)→ `repository/evolution/CoverageLedgerRepository.ts` `upsertCell`(per module×dimension cell)。
7. **候选→校验→发布**:见流水线 2。
8. **响应投影**:`ColdStartPresenters.ts` / `KnowledgeRescanPresenters.ts` 的四条 internal/host × cold-start/rescan presenter 输出稳定 envelope。

### 2. 知识/Recipe 生命周期与进化(candidate→Recipe→六态)

1. **候选校验**:`service/candidate/CandidateValidationFacade.ts` `validateCandidatesUnified` 纯合取三验证器——`aggregateCandidates`(批内 title Jaccard 0.85 去重)+ `service/recipe/RecipeCandidateValidator.ts` `validate`(V3 结构字段)+ `domain/knowledge/UnifiedValidator.ts`(字段/内容质量/跨提交唯一性三层链,stage-3 常量从 `gateRules` 读)。
2. **磁盘/会话去重**:`service/candidate/SimilarityService.ts` `findSimilarRecipes`(title30/summary30/code40 加权)+ `service/bootstrap/BootstrapDedup.ts`(会话级 4 维缓存)。
3. **统一生产管道**:`service/knowledge/RecipeProductionGateway.ts` `create` 6 步(校验→去重→融合扫描→`KnowledgeService.create`→`QualityScorer` 评分→supersede 提案),收敛 Agent/MCP/Host-Agent/Batch 全部生产入口。
4. **发布落盘**:`KnowledgeService` 委托 `KnowledgeFileWriter`(唯一 .md 写策略,实现 `repository/knowledge/KnowledgeFileStore` 契约)经 `KnowledgeUnitOfWork.commit` file-first 两阶段提交。`ConfidenceRouter.route` 决定新条目 `auto_approve(→staging+grace)`/`pending`/`reject(→deprecated)`。
5. **六态生命周期**:`service/evolution/LifecycleStateMachine.ts` `transition` 是 **唯一权威**(Guard→Exit→DB→Entry→Event→Signal),转移合法性委托 `domain/knowledge/Lifecycle.ts` `isValidTransition`(pending/staging/active/evolving/decaying/deprecated + `VALID_TRANSITIONS` 表)。`StagingManager.checkAndPromote`(grace-period 自动晋级)、`DecayDetector.scanAll`(5 策略 + 4 维 decayScore 驱动 active→decaying)。
6. **信号驱动进化闭环**:`EvolutionGateway.submit`(update|deprecate|valid)→ `ProposalExecutor`(订阅 `SignalBus`,按 `domain/evolution/EvolutionPolicy` 门禁,`#inFlight` re-entrancy 守卫)→ `ContentPatcher.applyProposal`(字段白名单 before/after 打补丁)。`ProposalRepository`(去重 + 观察窗 + WHERE status 乐观守卫)。所有 sweep total-budget cap 有界化 + 最旧优先,cap===undefined 保持无界字节兼容。daemon-less:`DaemonJobRunner` tick-on-access 驱动 `checkAndPromote`/`scanAll`/`checkTimeouts`。

### 3. 搜索 + 向量排序 + guardHits/searchHits

1. **统一检索入口**:`service/search/SearchEngine.ts`(keyword/weighted/semantic/auto(RRF) 多模式)。默认 `FieldWeightedScorer`(trigger5>title3>tags2>desc1.5>content1>facet0.5 + IDF)结构化召回。
2. **排序管线**:CrossEncoder→CoarseRanker→`MultiSignalRanker`(7 信号场景化加权,订阅 `SignalBus` 的 quality|usage 实时调权)→contextBoost。auto 模式 weighted-first + confidence gate 决定是否投入昂贵 embed。
3. **向量融合**:`service/vector/VectorService.ts`(`fullBuild`/`incremental`/`hybridSearch` RRF + embed 熔断器 3 连败→60s + `getAvailability` 五态降级)编排 `infrastructure/vector/HnswVectorAdapter`(HNSW 图 + SQ8 量化 + WAL + `.asvec` 持久化)。`HybridRetriever` RRF `Σ1/(k+rank)`。
4. **观测**:全程 `searchMeta` + `degraded` 降级;`searchHits` 是 Core-owned KnowledgeWire per-entry 命中计数。索引缺表记 `degradedReason` 而非静默空。

### 4. code_guard 检查路径(AST → GuardCheckEngine → verdict)

1. **入口**:`src/guard.ts` `createGuardCheckEngine` 稳定工厂 → `service/guard/GuardCheckEngine.ts`(blessed core-leaf 消费者)。
2. **规则来源**:`domain/knowledge/KnowledgeEntry.getGuardRules`(kind=rule 的 KnowledgeEntry)+ 内置规则 + `service/guard/EnhancementGuardRules.ts` `resolveEnhancementGuardRules`(enhancement 唯一业务消费路径,经 `core/enhancement` 的 14 个 `EnhancementPack`)。
3. **四层管线**:行级正则 → 跨行 code-level → 跨文件 → Tree-sitter AST(经 `core/AstAnalyzer.ts` `findCallExpressions`/`checkProtocolConformance` 等 Guard AST 查询 API,底层 `parseToTree` + 11 语言 WASM 插件)。
4. **verdict 与信号**:产出 `GuardViolation`,回写 `guard_hit_count`(`guardHits` = Core-owned per-entry),发射 `guard` + `guard_blind_spot` 信号;`UncertaintyCollector` 把能力边界记为 `uncertain` 而非假阴性(anti-fabrication 不变量)。`GuardService.checkCode` 优先代理引擎、失败降级 DB-only。

### 5. ProjectContext 装配 + project-index rescan + 覆盖账本

1. **9-kind 查询阶梯**:`service/project-context/ProjectContextService.ts`(`ProjectContext` 单例 + `PROJECT_CONTEXT_DEFAULT_HANDLERS` 注册表)→ `interface/projectContext.ts` `createProjectContext.execute`(canonicalize→dispatch→envelope,顶层 try/catch 降级成 unavailable 信封)。自下而上:sourceSlice→fileSymbols/fileFlow→moduleLayers→module→map→repo→space。`spaceProjectContextHandler` 加载原生 `ProjectScope`;`mapProjectContextHandler` Tarjan SCC 环检测。
2. **事实抽取**:经 blessed core-leaf `core/AstAnalyzer` `analyzeFile`(file-flow/file-symbols)与 `core/discovery` `collectDiscoveryFacts`(`DiscovererRegistry` confidence 竞标 + generic 0.1 兜底),不可用返空 + `unavailableReason`。
3. **能力引擎**:`architectureIntelligence`(领域/风格/复杂度三分类)+ `dimensionPlanning` `aggregateDynamicPlanningSignals`(模块 delta/覆盖/proposal/decay → frozen planSignals)。
4. **增量 rescan**:`workflows/capabilities/persistence/FileDiffSnapshotStore`(文件指纹快照 + Drizzle transaction 写)+ `FileDiffPlanner`(diff → 受影响维度推断)→ `workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts` `buildKnowledgeRescanPlan`(per-dimension/per-cell gap + produce/verify-only/skip 决策)+ `auditRecipesForRescan`(三层相关性审计 + dead/drifted→proposal)。
5. **覆盖账本**:`CoverageLedgerBuilder.buildCoverageLedger`(per module×dimension)→ `CoverageLedgerAdvisor.adviseCoverageLedger`(deepMining 停止建议,全 advisory)。

### 6. 持久化(SQLite/drizzle 索引缓存 + .md file store 真相源 + snapshots)

1. **连接门面**:`infrastructure/database/DatabaseConnection.ts`(用 `projectRoot` 而非 cwd 解析路径、Ghost/excluded 重定向、WAL + busy_timeout 无重试 CO3 C7、gap-tolerant migration runner + 加列幂等)。`schema.ts`(22 表 Drizzle 单一真相,DB 列名权威)+ 001–016 迁移。热路径经 `PreparedStatementCache.prepareCached`(AD5 连接域 WeakMap + 128 LRU)。
2. **仓储实现**:`repository/` 34 文件经 `RepositoryBase<TTable,TEntity>`;`KnowledgeRepositoryImpl`、`KnowledgeEdgeRepository`、`ProposalRepository`、`CoverageLedgerRepository`、`SourceGraphRepository.replaceGeneration`(四表代际快照整代替换)、`RecipeSourceRefRepository`。SQL 注入防护 `_assertSafeColumn` + PRAGMA 列白名单,raw SQL 仅限白名单目录。
3. **.md file store 真相源**:`KnowledgeFileWriter`(candidates/ → recipes/ lifecycle 搬移)file-first,DB 失败抛 `DivergenceError`,靠 `KnowledgeSyncService.sync` 重建(contentHash 检测手改 .md)。
4. **snapshots**:`ProjectSnapshot`(Phase1-4 SSOT,`Object.freeze`)+ `SnapshotViews` `toResponseData`/`toSessionCache` 纯投影;`daemon/DaemonState`(daemon.json/pid/lock 原子写 tmp+rename 0o600)+ `JobStore`(逐 job JSON + 状态机守卫)+ `JobDisplaySnapshotContracts`(stableStringify + sha256 校验和,重启回读 checksum_mismatch)。
5. **向量持久化**:`infrastructure/vector/AsyncPersistence`(WAL NDJSON + CRC32 先写日志,定时/批量 flush `.asvec`,启动 replay 损坏行跳过)。

---

## 三、阅读导航指南

### 子系统索引表

| 层 | 目录 | 职责 | 公共导出路径 | 关键 entrypoint |
| --- | --- | --- | --- | --- |
| shared | `src/shared/` | 叶子工具(errors/taxonomy/budget/path/lang) | `./shared`(+ 根门面 re-point) | `OutputBudget.ts` `applyOutputBudget`、`PathGuard.ts` `pathGuard`、`LanguageService.ts` |
| types | `src/types/` | 跨层 TYPE 桥 + 根门面 | 60 条 `exports` 子路径 | `ProjectSnapshot.ts`、`SnapshotViews.ts`、`KnowledgeWire.ts` |
| root facades | `src/*.ts` | 公共 package 入口 | `@alembic/core` 及子路径 | `src/index.ts`、`src/repositories.ts` `createAlembicRepositories`、`src/guard.ts` |
| domain | `src/domain/` | 实体与域契约 | `./knowledge` `./dimensions` `./evolution` `./project-context` `./recipe-context` | `KnowledgeEntry.ts`、`Lifecycle.ts`、`DimensionRegistry.ts`、`gateRules.ts`、`EvolutionPolicy.ts` |
| core | `src/core/` | AST/discovery/enhancement/capability 分析叶子(blessed) | `./enhancement` `./capability` `@alembic/core/core/discovery` | `AstAnalyzer.ts` `analyzeFile`、`ast/index.ts` `loadPlugins`、`discovery/index.ts` `getDiscovererRegistry`、`CapabilityProbe.ts` |
| infrastructure | `src/infrastructure/` | DB/vector/signal/io/logging/report/config | `./guard`(部分)`./events` | `DatabaseConnection.ts`、`drizzle/schema.ts`、`SignalBus.ts`、`HnswVectorAdapter.ts`、`ASTChunker.ts`、`WriteZone.ts` |
| repository | `src/repository/` | 持久化实现与契约 | `./repository[/base|bootstrap|code|sync]` | `RepositoryBase.ts`、`KnowledgeUnitOfWork.ts`、`KnowledgeRepositoryImpl.ts`、`ProposalRepository.ts`、`CoverageLedgerRepository.ts` |
| service | `src/service/` | 业务编排与规则 | `./knowledge` `./plans` `./recipe-context(-capabilities)` `./project-context(-capabilities)` `./guard` | `RecipeProductionGateway.ts`、`LifecycleStateMachine.ts`、`GuardCheckEngine.ts`、`SearchEngine.ts`、`VectorService.ts`、`ProjectContextService.ts`、`CandidateValidationFacade.ts`、`planIntent.ts` |
| workflows | `src/workflows/` | 高层编排(cold-start/rescan/coverage) | `@alembic/core/workflows/capabilities/host-agent`、`src/host-agent-workflows.ts` facade | `HostAgentDimensionCompletionWorkflow.ts`、`BootstrapSession.ts`、`MissionBriefingBuilder.ts`、`KnowledgeRescanPlanBuilder.ts`、`ProjectIndexPlan.ts`、`TierScheduler.ts` |
| daemon | `src/daemon/` | 作业/运行时展示 + 常驻服务契约(daemon-less) | `@alembic/core/daemon` | `JobStore.ts`、`DaemonState.ts`、`RuntimeContracts.ts`、`ResidentServiceContracts.ts`、`ProjectRuntimeContracts.ts` |

### 常见任务从哪里开始读

- **理解冷启动/Recipe 生成全链**:从 `service/planFacts/collect-project-context.ts` `collectPlanProjectContext` 起,顺 `service/planIntent/planIntent.ts` → `workflows/project-index/ColdStartPlan.ts` → `workflows/capabilities/host-agent/HostAgentDimensionCompletionWorkflow.ts` → `RecipeProductionGateway.create`(数据流 1+2)。
- **理解知识生命周期/进化**:从 `domain/knowledge/Lifecycle.ts`(六态 + `VALID_TRANSITIONS`)起,读 `service/evolution/LifecycleStateMachine.ts`(唯一权威)与 `domain/evolution/EvolutionPolicy.ts`(纯函数门禁),再看 `ProposalExecutor`/`StagingManager`/`DecayDetector` 的信号驱动闭环。
- **理解 Guard 检查**:`src/guard.ts` → `service/guard/GuardCheckEngine.ts` 四层管线 → `core/AstAnalyzer.ts` Guard 查询 API + `service/guard/EnhancementGuardRules.ts`。
- **理解搜索/排序**:`service/search/SearchEngine.ts` → `FieldWeightedScorer`/`MultiSignalRanker` → `service/vector/VectorService.ts` → `infrastructure/vector/HnswVectorAdapter.ts`。
- **理解 ProjectContext**:`service/project-context/ProjectContextService.ts` 注册表 → `interface/projectContext.ts` 管道 → 各 kind handler(space/map/module...)。
- **理解持久化真相源**:`repository/knowledge/KnowledgeUnitOfWork.ts`(file-first 两阶段)+ `service/knowledge/KnowledgeFileWriter.ts` + `infrastructure/database/DatabaseConnection.ts`。
- **理解公共 API 契约**:`package.json` `exports` + `src/index.ts` 窄化纪律 + `config/public-api-boundary.json`。

### 层契约与门禁位置

- **十层运行时 import 方向门**:`config/layer-contract.json` + `docs/layer-contract.md`,由 `scripts/lint-layer-contract.mjs`(`allowedRuntimeImports` 矩阵 + `blessedImports` 豁免,type-only 豁免)强制。
- **公共 API 窄度门**:`config/public-api-boundary.json` + `scripts/public-api-boundary-policy.mjs`(`makePublicApiBoundaryClassifier` + narrowness baselines)。
- **消费方反向扫描**:各仓 `core-import-boundary.json` + `scripts/lint-consumer-core-imports.mjs`。
- **输出预算/空间 DAG 门**:`scripts/check-output-budgets.mjs`(四不变量)、`scripts/check-space-edges.mjs`(Core 零空间边)。
- **边界墙硬门**:`test/` 的 `CoreCodex`/`ToolSystem`/`Delivery`/`Package` 四个 `*Boundary` 测试(禁目录 + 禁导出前缀 + 禁具名实现文件三重扫描)。
- **总门**:`npm run check` 串 11 道阻断链(见总览「技术栈」);`release:check` 留发版期。

### 已知技术债(阅读时警惕)

- `service/panorama → workflows` 动态 import(临时例外,非 blessing)。
- `docs/layer-contract.md` stale 引用 `ProjectIntelligenceRunner`/`runProjectIndexWorkflow`(不在 Core src)。
- god-file:`service/project-context` 约 11.7k 行、`ProjectRuntimeContracts.ts`(1050 行)、`CustomConfigDiscoverer.ts`(1476 行)、plan-tool/god-file 多处。
- `HostAgent*`↔`IDEAgent*`、`buildColdStart*`↔`buildProjectIndexFull*` 兼容别名双写,迁移期保留。
- `enhancement/index.ts` 注释「16 packs」已过时(实为 14);`getReferenceSkillPath` 全未实现;7 条通配导出待收敛;`recipe-context` 双份;`KnowledgeEntryWire` 的 `[key]:unknown` 兜底。
- coverage 阈值实测棘轮但尚未接进 `check` 门禁;「daemon」是历史词非真进程(daemon-less tick-on-access)。

---

## 四、各子系统实现详解

以下 14 节由对应分区的只读 agent 直接产出，覆盖 `src/` 全部 9 个源码层。每节结构大体为「职责与层次 → 关键文件与模块 → 核心类型与契约 → 关键类/函数与实现逻辑 → 模式与不变量 → 依赖与消费方 → 注意点/技术债」。

### 4.1 shared/ — 叶层基础设施 (leaf utilities)

#### 职责与层次

`src/shared/` 是 AlembicCore 十层契约的最底层：`config/layer-contract.json:22` 明确 `"shared": []`，即 shared 运行时 **不允许 import 任何其它层**（`import type` 作为纯类型桥被 `typeOnlyImportsExempt` 豁免，见 `config/layer-contract.json:5`）。因此本层必须是零耦合、纯确定性、可被上面所有层安全复用的叶子工具集。它承载三类东西：(1) 全局错误类型与诊断/失败/字段分类学 (taxonomies)；(2) 无状态计算工具（相似度、token 估算、内容哈希、diff 解析、markdown 提取）；(3) 进程级共享设施（PathGuard 单例、TimerRegistry 单例、并发限流器、语言服务、ProjectScope/Registry/WorkspaceResolver 工作区路径解析）。共 38 个文件、约 9.1k LOC，是被 Core 内部引用最广的一层——`grep` 统计 Core 内部有 **176 处** `from '.../shared/'` 运行时 import；对外则通过 package export `./shared`（`CoreContractSpine.ts:199` 的 I01 行确认 `./shared` 是必需公共子路径）被 Alembic/AlembicPlugin/AlembicAgent 消费。

一个关键的层内例外要注意：`ProjectRegistry.ts:16` 有 `import type { WriteZone } from '../infrastructure/io/WriteZone.js'`——这是跨到 infrastructure，但因是 `import type` 属类型桥豁免，不违反 shared→(nothing) 的运行时规则。

#### 关键文件与模块

| 文件 | 角色 | 锚点 |
|---|---|---|
| `errors/BaseError.ts` | 错误基类 + 9 个子类（含 CO3 的 PersistenceError/DivergenceError） | `errors/BaseError.ts:2,95,115` |
| `OutputBudget.ts` | 每工具输出字节预算 + 截断诚实性 + 破坏性重置归档契约 | `OutputBudget.ts:56,179,230` |
| `FieldTaxonomy.ts` | 字段暴露分类学（11 类）+ 策略校验器 | `FieldTaxonomy.ts:1,140,242` |
| `FailureTaxonomy.ts` | 16 种失败 kind 的统一映射表 + 校验/汇总 | `FailureTaxonomy.ts:144,451` |
| `CoreContractSpine.ts` | D2 契约脊柱 9 行 + D9 遗留收敛候选 | `CoreContractSpine.ts:182,554` |
| `DiagnosticCodes.ts` | 稳定诊断 reason code 常量表 | `DiagnosticCodes.ts:14` |
| `PathGuard.ts` | 双层写入路径守卫单例 | `PathGuard.ts:80,206,249` |
| `similarity.ts` | Jaccard/cosine/文本相似度 + bigram 分词 | `similarity.ts:23,51,77,102` |
| `LanguageService.ts` | 唯一语言映射/检测来源（静态单例） | `LanguageService.ts:440,754,884` |
| `LanguageProfiles.ts` | 8 语言族分析知识注册中心（lazy 合并缓存） | `LanguageProfiles.ts:748,779,927` |
| `TargetClassifier.ts` | Target 名→角色 / 文件名→优先级正则推断 | `TargetClassifier.ts:14,56` |
| `recipeTokens.ts` / `diffParser.ts` / `markdownUtils.ts` | Recipe 标识符提取 / git diff 解析 / 代码块提取 | `recipeTokens.ts:51,108`；`diffParser.ts:35,63` |
| `schemas/common.ts` / `schemas/config.ts` | Zod 校验片段 / 配置 schema | `schemas/common.ts:13`；`schemas/config.ts:130,181` |
| `TimerRegistry.ts` / `lifecycle.ts` / `concurrency.ts` | 定时器注册单例 / Disposable 接口 / p-limit 预设 | `TimerRegistry.ts:44`；`lifecycle.ts:16`；`concurrency.ts:20` |
| `ProjectScope.ts` / `ProjectRegistry.ts` / `WorkspaceResolver.ts` | Ghost 感知的项目空间/注册表/路径解析 | `ProjectScope.ts:281,348`；`ProjectRegistry.ts:80` |
| `isOwnDevRepo.ts` / `ProjectMarkers.ts` / `folderNames.ts` | 排除项目判定 / 项目探测 / 目录名单源 | `isOwnDevRepo.ts:98`；`ProjectMarkers.ts:53` |
| `contentHash.ts` / `tokenUtils.ts` / `utils/common.ts` / `developerIdentity.ts` / `testMode.ts` | 内容哈希 / token 估算 / JSON 工具 / 身份 / 测试维度过滤 | `contentHash.ts:24`；`tokenUtils.ts:21` |

#### 核心类型与契约

**错误家族**（`errors/BaseError.ts`）：`BaseError` 持 `code`/`statusCode`，`toJSON()` 稳定序列化（:13）。七个原始子类（PermissionDenied/ConstitutionViolation/ValidationError/NotFoundError/ConflictError/InternalError + BaseError）通过 `shared/index.ts:14-22` 冻结再导出——注释明确这是 **CO1 shrink-only narrowness 预算**：`shared/index.ts:7-13` 说明 CO3 新增的 `PersistenceError`（`PERSISTENCE_ERROR`/500，write-strict 语义，:95）和 `DivergenceError`（`STATE_DIVERGENCE`/500，文件已落盘但 DB 提交失败，`details.reconcileVia` 指向 `KnowledgeSyncService.sync` 修复路径，:115）**故意不从 `./shared` 门面再导出**，消费者只能观察到它们作为带稳定 code 的 BaseError 实例；命名 import 走 ROOT 门面 `@alembic/core`（SD-5 phase-2 B2=re-point）。这是本层最重要的兼容不变量之一。

**三套分类学**互相咬合：`FieldTaxonomy.ts` 定义 11 个字段暴露类（public/consumer-needed/diagnostic/internal/sensitive/raw-provider/hidden-reasoning/detailRef-only/artifactRef-only/compatibility-private/typed-extension，:1）与 16 个 `CORE_FIELD_FAILURE_KINDS`（:49）；`FailureTaxonomy.ts:144` 的 `CORE_FAILURE_TAXONOMY` 把每个 kind 映射成一条完整行（httpStatus/mcpErrorCode/agentBranch/problemClass/retryPolicy/exposureClass 等），`owner` 恒为 `'AlembicCore'`、`privateDataSafe` 恒 `true`；`CoreContractSpine.ts:182` 的 9 行 spine（I01/I03…I23）用这些暴露类描述每个公共契约面（package boundary、runtime health、jobs、guard、file-changes 等）的 consumers/removalBlocker/validationCommands。三者都是**纯数据表 + 校验器**模式。

#### 关键类/函数与实现逻辑

**OutputBudget（MT2 预算/截断诚实性）**：`CORE_TOOL_OUTPUT_BUDGETS`（:56）是一张冻结的、由 MT1 实测（BiliDili fixture）背书的预算表——每工具声明 `budgetBytes`/`measuredMaxBytes`/`class`/`rawRef`；`alembic_job` 预算 16KB 但实测 767KB → class `diagnostics-composite`（:60）。`applyOutputBudget(toolName,payload,opts)`（:179）用 UTF-8 字节测量：未知工具或未超预算原样返回但仍带显式 `truncated:false`（诚实信号永不省略）；超预算则调 `truncateToBytes`（:157）——它按字节切，并回退剥掉尾部残缺多字节序列（:164-169，检查 `0b10xxxxxx` 续字节和 `0b11xxxxxx` 起始字节），保证不切碎 code point，结果带 `overflow.route`（artifact-ref|pagination）与 `omittedBytes`。`assertDestructiveResetHasArchive`（:230）是硬断言：若破坏性重置 `removedCount>0 && claimsRetention && !archiveRef` 则抛错——这把 MT1 P1 发现的「alembic_rescan 删投影却谎称保留」结构化为不可能。执行门禁是 `scripts/check-output-budgets.mjs`（:19 注释）。

**PathGuard（双层写入守卫）**：单例（`PathGuard.ts:451` 导出 `pathGuard` 默认实例 + `PathGuardError`）。`configure()`（:116）绑定 `projectRoot`（必须绝对，否则抛错 :124），并**一次性冻结** excluded-project 判定（:131-142 的 CO3 C6 documented decision：per-write 重查会带来磁盘 I/O，故 stale 窗口只持续一个进程生命周期）。`assertSafe`（:206，Layer 1）允许 projectRoot / packageRoot / allowList 内的路径（改已有文件）；`assertProjectWriteSafe`（:249，Layer 2）更严：即使在 projectRoot 内也只放行 `.asd/`（`PROJECT_WRITE_SCOPE_PREFIXES` :57）、知识库目录（委托 `ProjectMarkers.detectKnowledgeBaseDir` 动态探测 :406）、`.gitignore`（:62）以及宿主 adapter 显式扩展的前缀/文件。排除项目额外禁止创建 `.asd/` 与知识库（:275-302）。设计意图是 BiliDemo/data 事件根因（cwd 解析到非预期目录）（:5-6 头注释）。

**LanguageService + LanguageProfiles（互补的语言双源）**：`LanguageService.ts:440` 是静态单例，唯一的 ext→lang 映射源（`EXT_TO_LANG` 冻结 :24），提供 `inferLang`/`normalize`（别名归一 :485）/`detectPrimary`（按规范语言聚合避免 ObjC 的 .h/.m/.mm 分散 :530）/`detectProfile`（主+次语言画像 :582）/`detectProjectLanguages`（两路径：discovererId 映射优先，否则扫构建标记文件，支持 monorepo 多层扫描 + node 与其他生态共存时去掉 JS/TS 的启发式 :773,857）。`LanguageProfiles.ts:748` 承载**分析知识**：8 个 `FamilyProfile`（apple/jvm/dart/python/web/go/rust/dotnet，:82-541）各含 importPatterns/superclassRoles/protocolRoles/importRolePatterns/knownLibraries/artifactSuffixes/vendorDirs。所有聚合 API（`importPatterns`/`knownLibraries`/`skipDirs`/`thirdPartyPathRegex`/`baseClassExclusions`/`validCodeLanguages`）用 **lazy 缓存**（模块级 `_importPatterns` 等 :645-652），首次访问才合并全族，「新增语言只需加一条 FamilyProfile，所有消费者自动生效」（:5 头注释）。`thirdPartyPathRegex`（:927）从 vendorDirs+knownLibraries 动态拼正则并做元字符转义，供 Agent 工具层过滤三方库结果。

**相似度与 token（Recipe dedup/impact 的计算内核）**：`similarity.ts` 的 `tokenizeForSimilarity`（:23）小写去标点后同时产 word + character n-gram，兼容 CJK 单字与英文整词；`jaccardSimilarity`（:51）遍历较小集合优化交集计算；`textSimilarity`（:102）在 Jaccard 上加可选子串包含 +0.3 加分。`recipeTokens.ts:51` 的 `extractRecipeTokens` 从 coreCode/markdown 代码块/pattern/steps 四来源提取 API 标识符，`extractApiTokens`（:108）过滤长度<4、占位符前缀（My/Example/Sample…）、语言关键字（委托 `LanguageService.languageKeywords`）；`tokenizeIdentifiers`（:135）先剥注释与字符串字面量再匹配标识符。`diffParser.ts` 的 `getFileDiff`（:35）用 `execFileSync('git','diff',...,'-U0')`（无 shell，`revisionRange` 作单个修订实参安全传入 :42-44，支持 committed-impactful 的 commit-range diff），失败静默降级返回 null。这三者被 `ContentImpactAnalyzer`/`RecipeSimilarity`/`diffParser` 复用（`recipeTokens.ts:6-9`）。

**TimerRegistry（进程级资源回收）**：`TimerRegistry.ts:44` 单例，所有 setInterval/setTimeout 经此创建并自动 `unref()`（除非 `blocking`）+ 登记；`dispose()`（:153）幂等，是最后一个生命周期步骤——先清全部 timer 再 `Promise.allSettled` 并行 dispose 已注册 Disposable（单个失败不阻断，:170）。CO3 C8 契约（:12-22）：dispose 后的注册仍会发生但不会被清理，并打印稳定诊断码 `CORE_DIAGNOSTIC_CODES.timerPostDisposeRegistration`（`DiagnosticCodes.ts:38`）。

**ProjectScope/WorkspaceResolver（Ghost 感知空间）**：`ProjectScope.ts` 是纯函数式不可变契约（`createProjectDescriptor` :281 用 `stableProjectScopeId` sha256 派生稳定 id，`addProjectScopeFolder` :311 做 path/id 去重与冲突断言，`resolveProjectScopeForFolder` :348 返回 matched-folder/empty-scope/folder-not-bound 三态）。`WorkspaceResolver.ts:61` 提供 `dataRoot`——标准模式=projectRoot，Ghost 模式=`~/.asd/workspaces/<id>/`，消费者只需把写入基准从 projectRoot 改成 `resolver.dataRoot` 即自动适配（:8 头注释）。`resolveProjectRoot.ts:30` 三级 fallback（container→env→cwd）。

#### 模式与不变量

- **契约-vs-实现（纯数据表 + 校验器 + 汇总器）**：FailureTaxonomy/FieldTaxonomy/CoreContractSpine 都是 `const … as const satisfies readonly T[]` 冻结表 + `validate*`（返回 issue 列表而非抛错，`FailureTaxonomy.ts:451`）+ `summarize*`。校验器交叉一致性：`validateCoreFailureTaxonomy` 检查每 kind 的 `stableId===core.failure.<kind>`、私有 detail 必须有 refPolicy（:517）、覆盖全部 `CORE_FIELD_FAILURE_KINDS`。
- **单例 + lazy 缓存 + memo**：PathGuard/TimerRegistry/LanguageService(静态)/timerRegistry 单例；LanguageProfiles 全部聚合器 lazy；`isOwnDevRepo.ts` 用 `_cache`/`_excludeCache`（:22,25），`developerIdentity.ts:26` 进程级单值 memo（AD4 'memo-caches' blessed）。
- **诚实降级 + 稳定诊断码**：`DiagnosticCodes.ts:8` 明确 code 是稳定可观测契约，重命名等同 API rename 破坏。OutputBudget 的 `truncated` 永不省略、`assertDestructiveResetHasArchive` 的硬断言都是「不静默丢数据」不变量。
- **单一数据源**：folderNames（`DEFAULT_FOLDER_NAMES` :37）是所有目录名的唯一源，PathGuard/ProjectMarkers/WorkspaceResolver/packageRoot 全部消费它；LanguageService 是唯一 ext→lang 源（禁止业务代码自建 langMap，:8 头注释）。

#### 依赖与消费方

对内：176 处 Core 引用，几乎每层都吃 shared——repository 用 `utils/common`/`contentHash`/`errors`，service/workflows 用 similarity/recipeTokens/LanguageProfiles/OutputBudget（`RescanEvidenceProjectors.ts`、`HostAgentSubmissionTracker.ts` 消费 `CORE_CONTENT_SLICE_BUDGETS` :122），infrastructure 用 concurrency/TimerRegistry。对外：`./shared` 是 D2 spine I01 声明的必需公共子路径；OutputBudget 的 import 路由被 SD-5 phase-2 重定向到 ROOT 门面 `@alembic/core`（`OutputBudget.ts:22-26`），`./shared/*` 通配已在 phase-2 移除。

#### 注意点/技术债/兼容标记

1. **`./shared` 门面冻结**（CO1 shrink-only）：只导出七个原始错误类，PersistenceError/DivergenceError 与 `TargetClassifier`（`TargetClassifier.ts:10` 明确「不加入 shared/index.ts，受 narrowness 预算约束」）**故意不进门面**，改动需评审。
2. **TargetClassifier 迁移标记**：CO2 B2 从 `workflows/capabilities/presentation/` 迁到 shared 叶层，public 表面靠 presentation 门面原样再导出（`TargetClassifier.ts:9`）。
3. **PathGuard exclusion staleness**（CO3 C6，:131）与 **TimerRegistry post-dispose**（CO3 C8）都是 documented decision，非 bug。
4. **schemas/config.ts 陈旧字段主动报错**：WorkspaceRuntimeConfig 对 `core.dir`/`core.constitution`/`watch.*` 用 `superRefine` 报 stale（:157,199），是有意的迁移守卫。
5. **CoreContractSpine 的 D9 遗留收敛**（:554）记录 D9-C01（preserved-with-owner）等候选与其 removalTrigger/validationCommands（含 `rg` 消费者扫描命令），是 Core 公共表面收口的活账本，非产品代码但载重。
6. **AiConfig 默认 `provider:'openai'/model:'gpt-4'`**（`schemas/config.ts:58`）仅为配置 schema 默认值占位，Core 本身不实现 AI provider runtime（符合 `CORE_CONTRACT_SPINE_FORBIDDEN_RESPONSIBILITIES` :24 的 `ai-provider-runtime` 禁项）。

---

### 4.2 契约层：types/ 类型桥 + 根门面(root facades)与公共包 API 表面

#### 职责与层次

本分区是 `@alembic/core` 对三个消费方(AlembicAgent / Alembic 主体 / AlembicPlugin)暴露的**唯一长期接入契约**，由两部分构成：一是 `src/*.ts` 的一批"根门面"(root facades)——它们是 10 层分层契约里唯一被授权 `import *`(任意层)的公共包入口(见 `config/layer-contract.json` 的 `root facades (src/*.ts) -> *`)；二是 `src/types/`——横跨各层的**纯类型桥**(type-only bridges，`types -> shared`)，把 snapshot/workflow/wire 契约在 domain↔service↔workflows 之间传递而不产生运行时依赖。每个门面文件与 `package.json` 的 `exports` 子路径一一对应(`./capability`→`src/capability.ts`、`./knowledge`→`src/knowledge.ts` …)，`.` 根入口对应 `src/index.ts`。构建产物落在 `dist/`(不提交)，`exports` 里全部指向 `./dist/*.js` + `./dist/*.d.ts`。

#### 关键文件与模块

| 文件 | 行数 | 作用 |
|---|---|---|
| `package.json:8-256` | — | `exports` 声明全部子路径→dist 映射(约 60 条) |
| `src/index.ts` | 80 | 根入口，窄暴露 + `export *` 少数小层 |
| `src/repositories.ts` | 292 | 稳定仓储门面 + `createAlembicRepositories` 工厂/Bundle |
| `src/knowledge.ts` | 162 | Knowledge domain/service 契约聚合 |
| `src/host-agent-workflows.ts` | 98 | 宿主 Agent workflow 门面 + IDEAgent* 兼容别名 |
| `src/types/ProjectSnapshot.ts` | 450 | 项目快照类型的单一真源(SSOT) |
| `src/types/SnapshotViews.ts` | 177 | 面向消费者的投影视图 + `toResponseData`/`toSessionCache` |
| `src/types/KnowledgeWire.ts` | 164 | 后端↔前端唯一传输合约 |
| `src/types/workflows.ts` | 83 | workflow 结构性接口(container/ctx/plan) |
| `src/types/recipeAuthoringSpec.ts` | 91 | §C.11 注入端口(fs/session 解耦) |
| `config/public-api-boundary.json` | — | 边界策略：稳定/临时/通配分级 + 窄度基线 |
| `scripts/public-api-boundary-policy.mjs` | 446 | 策略加载/分类/校验器 |

#### 核心类型与契约

`src/types/index.ts:1-50` 是 `./types` 子路径的桶，聚合五组类型：`evolution`(状态机转移证据 `TransitionEvent`/`TransitionRequest`/`LifecycleHealthSummary`，见 `types/evolution.ts:60-143`)、`KnowledgeWire`(`KnowledgeEntryWire`，`types/KnowledgeWire.ts:95-164` 明确"后端 `KnowledgeEntry.toJSON()` 与前端 Dashboard 共享的唯一定义"，末尾 `[key: string]: unknown` 保留 `as Record` 兼容)、`ProjectSnapshot` 的一批 named type、`ReactiveEvolution`、以及 `recipeAuthoringSpec` 的注入端口。注意 `./types` 门面刻意只 re-export **类型**(纯 `export type`)，`expectedCounts` 中它的运行时符号窄度基线仅 6(见下)。

`ProjectSnapshot.ts:1-16` 自述为"Phase 1-4 数据的唯一类型来源(SSOT)"，设计原则包含**不可变**(`Object.freeze`)与**单一定义**，消除了历史上 `bootstrap-phases.ts`/`MissionBriefingBuilder.ts` 等多处重复类型。它作为 type-only 桥导入 `service/source-graph/SourceGraphLifecycle`、`shared/ProjectScope`(`CanonicalSourceIdentity`)与 `types/workflows`(`FileDiffPlan`)，把跨层结构收敛为一个可被 domain/service/workflows 共享的形状。

`SnapshotViews.ts` 是"衍生视图"契约(`SnapshotViews.ts:1-8`)：核心理念是消费者不直接操作 `ProjectSnapshot` 每个字段，而由 View Factory 做轻量投影。它含两个**运行时纯函数**——`toResponseData`(`SnapshotViews.ts:85-155`，把 snapshot 压成 MCP 响应摘要，含 AST/graph/guard/dep 各种 `?.` 空安全折叠)与 `toSessionCache`(`SnapshotViews.ts:164-177`，产出类型化 `SessionCacheShape`，替代此前 `Record<string,unknown>` 的擦除转型)。`PipelineFillView`(`SnapshotViews.ts:54-75`)是 handler→dispatchPipelineFill→orchestrator 的统一入参，`mode:'bootstrap'|'rescan'` 区分冷启动全量 finalize 与增量轻量收尾。

`recipeAuthoringSpec.ts:1-11` 承载 §C.11 端口思想：canonical spec 在 `domain/knowledge/recipe-authoring-spec` 保持**纯净**(只 import shared+types，零 node:fs/path)，把两处运行时耦合(on-disk source-ref 读取、bootstrap-session scope)切成注入型 typed port(`RecipeSourceRefResolver` `:70-78`、`RecipeSessionScope` `:86-91`)，宿主注入 I/O，spec 跑同一套纯谓词；未注入时跳过 fs/session 检查(pure-only run)。

#### 关键类/函数与实现逻辑

`src/index.ts` 是"根门面窄化"纪律的现场教材(`index.ts:60` 注释直言"根入口只暴露外层收敛需要的稳定契约，避免把内部重复类型通过 export * 撞到一起")。它对小而无冲突的层用 `export *`(`core`/`daemon`/`domain`/`infrastructure`/`service`/`shared`)，而对大且有同名 DTO 风险的层**只具名导出**：`host-agent-workflows` 的每个符号被逐一列出(`index.ts:4-58`)，`repository` 只放出 `KnowledgeRepositoryImpl`(`index.ts:61`)。

`index.ts:63-80` 记录了一个明确的**再指向(re-point)决策**(SD-5 phase-2 / RW1 / B2)：把 MT2 的 OutputBudget 机制(`applyOutputBudget`/`CORE_TOOL_OUTPUT_BUDGETS`/`CORE_CONTENT_SLICE_BUDGETS`，实现在 `shared/OutputBudget.ts:56-230`)与 CO3 的持久化/分歧错误类(`DivergenceError`/`PersistenceError`)从 `./shared` 通配移到**根门面** `@alembic/core`——因为 `./shared` 的具名门面被冻结在 CO1 窄度预算，通配导出将在 RW2 移除，所以根门面成为这些表面的稳定接入路。

`repositories.ts` 是仓储层的稳定门面，除了 re-export 各 `*RepositoryImpl` 并给出语义化 `type` 别名(`repositories.ts:166-179`，如 `EvolutionProposalRepository = ProposalRepository`)，还提供**工厂**：`createAlembicRepositories(database)`(`:244-265`)用 `resolveRepositoryDatabase` 先做 `getDb()/getDrizzle()` 结构校验(`:271-292`)，再一次性装配 14 个仓储成 `AlembicRepositoryBundle`；`ALEMBIC_REPOSITORY_KEYS`(`:225-240`)与 `isAlembicRepositoryKey` 守卫构成可枚举契约。类似的**装配下沉**模式见 `memory.ts:50-113` 的 `createSemanticMemoryRepository`——它接受 Drizzle DB / 裸 SQLite / handle 三形态源(`SemanticMemoryRepositorySource`)，用 `isDrizzleDb`/`isRawSqliteDatabase`/`isSemanticMemoryDatabaseHandle` 三个结构化类型守卫(`:115-140`)分派，并在需要时 `ensureSemanticMemorySchema`(`:58-85`，内联建表 SQL)，让外层无需 import `infrastructure/database/drizzle/schema`。

能力门面(capabilities facade)家族用 `Object.freeze` 冻结方法表：`project-context-capabilities.ts:78-111` 的 `createProjectContextCapabilities` 把 `ProjectContext.execute` 收敛成一组 `executeXxxQuery` 便捷方法(每个方法只是 `execute({...input, kind:'space'|'repo'|'map'...})`)；`recipe-context-capabilities.ts:143-174` 同理，并额外提供 `createRecipeContextServiceFromCore`(从原始 Core 服务件装配)。这体现"契约 vs 实现"分离——门面稳定，底层 `service/*` 可演进。

`database.ts:65-76` 的 `assertAlembicDatabaseHandle` 是 `asserts x is` 断言守卫，`openAlembicDatabase`(`:43-63`)封装 connect+migrations 的启动序列。工具类门面(`guard.ts:41-49`/`search.ts:86-91`/`vector.ts:134-160`)统一用 `createXxx(...)` + 类型双投(`as unknown as ConstructorParameters<...>`)把构造细节藏在 Core 内。

`host-agent-workflows.ts` 与 `plans.ts` 展示了**兼容别名**双写：`HostAgent*` 是新规范，`IDEAgent*` 是 compat 别名(`host-agent-workflows.ts:41-59` 并列导出两套同形状类型)；`plans.ts:45-56` 把 `buildColdStartWorkflowPlan`/`buildKnowledgeRescanWorkflowPlan` 再命名为 `buildProjectIndexFullPlan`/`buildProjectIndexIncrementalPlan`(`ProjectIndexMode` 轴)。

#### 模式与不变量

- **根门面窄化(narrowness discipline)**：策略文件 `public-api-boundary.json` 把每条 `exports` 分成 `stable-public`(25)、`provisional-public`(8)、`transitional-internal`(29)、`internal-only`(0)、`forbidden`(0)，通配导出统一记为 `transitional-internal`(`wildcardExportStatus`)。`scripts/public-api-boundary-policy.mjs:48-84` 的 `makePublicApiBoundaryClassifier` 是分类器，`check-public-api-boundary.mjs` 用它对 `package.json` 实际 exports 做计数比对(`expectedCounts`)并按 `maxCounts`(transitional≤29、wildcard≤7)设上限。
- **冻结窄度基线(frozen budgets)**：`closeout.narrowness.baselines`(shrink-only)给每个 provisional 门面定死"最多再导出多少个运行时符号"：`./shared:190`、`./config:47`、`./types:6`、`./service/*:1~2`。基线只可降不可升；`./shared` 由 189→190 是一次**受控器授权**(alembic-plan-space-membership-scoping P0/P1，为原生 ProjectScope registry loader 开一个符号)，并写进 `note` 留痕。这解释了根门面为何刻意不 `export *` 大目录:同名 DTO 冲突 + 预算爆表都会被门禁拦下(参见 `CLAUDE.md` 的 Package 入口规则)。
- **稳定门面替代深引用**：`facadeReadiness.specifiers`/`groups` 给每个仍被消费的临时深路径标注 `targetFacade`(如 `core/analysis`→`./test-fixtures`、`infrastructure/config/*`→`./config`、`repository/*/*`→`./repositories`)，`must-keep-transitional` 列表记录必须保留的 drizzle/migration/AST/base 仓储管道。
- **已退场路由(removedExports)**：约 90 条通配/聚合路由已带 `removedAt`+`scanEvidence`+`replacementFacade` 记录删除(如 `./project-intelligence`、`./service/panorama`、`./recipe-context` 公共路由、大量 `./*/*` 通配)，`./recipe-context` 源文件仍留作 Core 内部读门面(`recipe-context.ts:1-6` 注释：公共路已迁到 `./recipe-context-capabilities`)。
- **type-only 桥**：`types/` 全部通过 `import type`/`export type` 传递，`ReactiveEvolution.ts` 零运行时导出，`projectSnapshotBuilder.ts` 仅 1 个；`SnapshotViews`/`toResponseData` 是少数刻意放在 types 层的纯投影函数。
- **capabilities 冻结**：所有 `createXxxCapabilities` 返回 `Object.freeze(...)`，防止消费方篡改方法表。

#### 依赖与消费方

三个 sibling 消费仓在 `public-api-boundary-policy.mjs:24-40` 明确登记：`AlembicAgent`、`Alembic`、`AlembicPlugin`(后者通过 live `file:` link 消费，其 keep-alive specifier 列表是硬运行时约束，见 `plugin-keep-alive` ownership)。门面向下依赖各实现层(`service/*`、`repository/*`、`domain/*`、`infrastructure/*`、`shared`、`workflows/*`)，向上被这三仓通过包子路径导入——`CLAUDE.md` 要求外层完整模块接入优先走子路径(`@alembic/core/repository/knowledge` 等)、禁止绕过包入口直引 `vendor/AlembicCore/src/**`。`types/` 被 domain/service/workflows 层横向依赖以传递 snapshot/wire 契约。

#### 注意点/技术债/兼容标记

1. **通配导出仍是迁移债**：`./core`、`./repository`、`./workflows` 等 16 条 provisional 门面仍靠 `export *`(`keep-provisional`)，`wildcardExports` 上限 7 条通配尚在(`./core/ast/*`、`./infrastructure/database/drizzle/*` 等 `must-keep-transitional`)。这些是 grammar 注册/迁移/schema 内部件的兼容表面，未被判定为稳定产品 API。
2. **`./recipe-context` 双份**：`recipe-context.ts`(Core 内部读门面)与 `recipe-context-capabilities.ts`(公共路由)并存，前者注释声明为 service 测试与 wiring 保留，易被误当公共入口。
3. **IDEAgent* 兼容别名**：`host-agent-workflows.ts` 里 IDEAgent* 与 HostAgent* 全量并列导出，是历史命名兼容，长期应随 downstream 迁移收敛。
4. **`[key:string]:unknown` 兜底**：`KnowledgeEntryWire`(`KnowledgeWire.ts:163`)与多个 RecipeContext* 接口保留索引签名以兼容 `as Record` 转型，牺牲了一部分类型精度换取跨仓 wire 兼容。
5. **窄度基线只降不升**是硬不变量：任何新增根门面符号都要么落在冻结基线内，要么走受控器授权改 `narrowness.baselines` 并留 `note`，否则 `lint:public-api-boundary` 门禁(`npm run check` 的一环)会红。

---

### 4.3 domain/ — 实体与领域契约（entities & domain contracts）

#### 职责与层次

`src/domain/`（46 文件，约 11.4k LOC）是 Core 10 层契约中的第三层。按 `config/layer-contract.json`，`domain` 的 `allowedRuntimeImports` 只有 `shared` 与 `types`（`typeOnlyImportsExempt: true`，即 `import type` 是类型桥不算运行时耦合）。因此这一层是「知识域的纯实体与纯规则」：它定义 `KnowledgeEntry` 聚合根、六态生命周期状态机、25 维度的唯一注册表、进化决策纯函数、相似度算法、Snippet 实体、以及 ProjectContext/RecipeContext/SourceGraph 的类型契约。它对 repository/service/workflow **一无所知**——所有落盘、AI、fs 交互都通过注入的 typed port 或留给上层实现（如 `KnowledgeRepository` 只是抛 `Not implemented` 的抽象接口，实现在 `lib/repository/knowledge/KnowledgeRepositoryImpl.js`）。

域内七个子域各自成 barrel：`knowledge/`（聚合根+值对象+验证+RecipeAuthoringSpec，最重）、`dimension/`（维度单一真源）、`evolution/`（进化策略+相似度）、`snippet/`、`source-graph/`、`project-context/`、`recipe-context/`。根 facade `src/index.ts:3` 通过 `export * from './domain/index.js'` 把核心实体暴露到 `@alembic/core`，其余通过子路径（如 `@alembic/core/knowledge`、`@alembic/core/dimensions`）导出。

#### 关键文件与模块

| 文件 | 锚点 | 角色 |
| --- | --- | --- |
| `src/domain/knowledge/KnowledgeEntry.ts` | :77 / :425 | 统一知识聚合根 + 生命周期转移 `_transition` |
| `src/domain/knowledge/Lifecycle.ts` | :12 / :76 / :163 | 六态常量 + `VALID_TRANSITIONS` 转移表 + `inferKind` |
| `src/domain/knowledge/values/*.ts` | Content/Constraints/Relations/Stats/Quality/Reasoning | 六个值对象（`from`/`toJSON` 归一化） |
| `src/domain/knowledge/UnifiedValidator.ts` | :30 / :66 | 三层验证链（字段/内容/去重） |
| `src/domain/knowledge/FieldSpec.ts` | :33 | `V3_FIELD_SPEC` 字段权威表 |
| `src/domain/knowledge/recipe-authoring-spec/gateRules.ts` | :302 / :566 | 门禁规则表 + `validateAgainst` 编排器 |
| `src/domain/dimension/DimensionRegistry.ts` | :551 / :632 / :695 | 25 维度唯一注册表 + Plan 解析 + 分类 |
| `src/domain/dimension/UnifiedDimension.ts` | :15 | 维度统一接口 + ID 常量 |
| `src/domain/dimension/DimensionCatalogPayload.ts` | :97 / :189 | draft Pillar B 事实投影 + 提交规范单源 |
| `src/domain/dimension/RecipeDimension.ts` | :41 | Recipe→维度归属解析（scoped） |
| `src/domain/evolution/EvolutionPolicy.ts` | :69 | 进化决策纯函数（阈值集中） |
| `src/domain/evolution/RecipeSimilarity.ts` | :85 | 5 维相似度 + embedding 注入器 |
| `src/domain/snippet/Snippet.ts` | :31 | 可安装代码片段实体 |
| `src/domain/source-graph/SourceGraphContracts.ts` | :1 | 源码图状态/边/符号枚举契约 |

#### 核心类型与契约

**KnowledgeEntry 聚合根**（`KnowledgeEntry.ts:77`）：candidate 与 recipe 不是两个实体，而是同一 `KnowledgeEntry` 的 `lifecycle` 阶段（注释 :2-5）。构造函数（:144）把 6 个值对象用各自的 `.from()` 归一化（`content = Content.from(props.content)` 等，:177-182），并给几十个扁平字段补默认值：`knowledgeType` 默认 `code-pattern`，`kind` 由 `inferKind(knowledgeType)` 推导（:161），时间戳用 Unix 秒（`Math.floor(Date.now()/1000)`）。`toJSON()`（:363）返回 `KnowledgeEntryWire`（type-only 从 types 层导入，:7），camelCase 直出，全链路统一；`fromJSON` 直接 new。这体现了「Wire 契约在 types，实体在 domain，type-only 桥接」的分层。

**值对象的统一模式**：Content/Constraints/Relations/Stats/Quality/Reasoning 都遵循 `static from(input: unknown)` 防御式构造——若已是实例直接返回；若为字符串尝试 `JSON.parse` 失败则返回空实例；否则按 props 构造。`Relations`（`Relations.ts:33`）特殊：内部 `_b` 按 14 个 `RELATION_BUCKETS`（`inherits/calls/depends_on/...`）分桶，`from` 能兼容三种输入——已分桶对象、扁平数组（按 `type` 自动分桶，:67-83）、以及 AI 常返的纯字符串数组（`["recipeName"]` → `{target, description:''}`，:42-45）。`Stats`（`Stats.ts`）标注 Phase 0 扩展：新增 `lastHitAt`/滑窗 `hitsLast30d`/`version`/`ruleFalsePositiveRate`，全有默认值「与旧 JSON 100% 向后兼容」；`recordHit`（:103）在自增计数同时按 counter 类型更新对应时间戳。`Quality`（:60）用 `calcGrade` 把 0-1 分映射到 A-F 等级。

**Guard 消费桥**：`KnowledgeEntry.getGuardRules()`（:315）是实体给 `GuardCheckEngine` 的产出接口——仅当 `isActive() && isRule()` 时，从 `constraints.getRegexGuards()` / `getAstGuards()`（`Constraints.ts:72/77`）映射成 Guard 规则 DTO（含 `severity` 默认 `warning`、`fixSuggestion`）。`Constraints._normalizeGuard`（:59）在没有显式 `type` 时用「有 `ast_query` 则 ast，否则 regex」推断，AST 类型是为语义规则预留的前瞻设计。

#### 关键类/函数与实现逻辑

**六态生命周期状态机**（`Lifecycle.ts`）：状态为 `pending / staging / active / evolving / decaying / deprecated`（:12）。`VALID_TRANSITIONS`（:76）是硬编码转移表，例如 `active → [evolving, decaying, deprecated]`、`deprecated → [pending]`（可重新激活）。`KnowledgeEntry` 的生命周期方法（`publish`/`stage`/`evolve`/`decay`/`restore`/`deprecate`/`reactivate`，:217-277）全部委托私有 `_transition(to)`（:425）：先 `isValidTransition` 校验，非法则返回 `{success:false, error}`，合法则 push 一条 `{from,to,at,by?}` 到 `lifecycleHistory` 并更新 `lifecycle`+`updatedAt`。`publish` 额外要求 `isValid()`（title 非空 + content 有内容）并写 `publishedAt/publishedBy`。`stampLastTransition(by)`（:283）由 `KnowledgeService._lifecycleTransition` 在实体方法执行后回填操作人——体现「实体只管状态机，服务管审计人」。域内还导出多组消费口径常量：`CONSUMABLE_STATES`（staging/active/evolving，Guard/Search 可用）、`DEGRADED_STATES`（decaying 降权）、`GUARD_LIFECYCLES`、`COUNTABLE_LIFECYCLES`（看板计数含 pending），以及 `lifecycleInSql()`（:134）生成 `column IN (?,?,...)` 片段供 raw SQL 安全引用。`inferKind`（:163）用 `KIND_MAP` 把 knowledgeType 映射为 `rule/pattern/fact` 三大类，未知默认 `pattern`。

**DimensionRegistry 单一真源**（`DimensionRegistry.ts`）：25 个维度分三层——Layer 1 通用 13 个（`architecture` … `agent-guidelines`）、Layer 2 语言 7 个（`swift-objc-idiom` … `csharp-dotnet`，带 `conditions.languages`）、Layer 3 框架 5 个（`react-patterns` … `django-fastapi`，带 `conditions.frameworks`）。每个 `UnifiedDimension`（`UnifiedDimension.ts:15`）携带显示面（icon/colorFamily/displayGroup）、提取面（extractionGuide/allowedKnowledgeTypes/outputMode）、评估面（qualityDescription/weight/matchTopics/matchCategories）、条件面（conditions）、执行面（tierHint）。注释明确「这是整个系统中维度定义的唯一来源，Bootstrap/Panorama/Rescan/Dashboard 均从此消费」。关键函数：`resolvePlanDimensionDefinitions`（:632）是 Plan 生成 scope 的 canonical 路径——只做 ID→定义解析、去重、记 `missingDimensionIds`，**刻意不按语言/framework/signal 重新裁剪**（注释 :628-631 解释「避免无信号时把已确认维度收窄」），返回 `Object.freeze` 的不可变结果；`buildTierPlan`（:670）按 `tierHint` 动态分桶为 N 层（不再硬编码 3 层，未声明默认 3）；`classifyRecipeToDimension`（:695）按 `category 精确==维度ID → topicHint matchTopics → category matchCategories → null` 优先级为旧数据回推维度。`DIMENSION_DISPLAY_GROUP`（:601）由注册表 `Object.fromEntries` 自动派生，避免手维护。

**DimensionCatalogPayload 事实投影**（`DimensionCatalogPayload.ts:97`）：`buildDimensionCatalogPayload` 为 alembic_plan 的 draft Pillar B 构建全量维度资料。注释（:91-95）强调「故意只投射事实：全量注册表、完整 SOP、提交规范、透明 languageApplicable 标签；它不排序、不筛选、不推荐、不估算规模」——这是「Plan 不猜、Agent 决策」纪律在域层的落点。`resolveDimensionLanguageApplicability`（:143）用 `TOKEN_ALIASES`（`objc→objectivec`、`ts→typescript` 等，:77）归一化后做语言/框架交集判定，产出带 `reason`（`universal-dimension`/`language-match`/`framework-match`/`no-factual-match`）的可解释标签，但**只标注不过滤**。整个 payload 层层 `Object.freeze`。`buildDimensionSubmissionSpec`（:189）是提交规范的唯一真源（P2.1 collapse），从 RecipeAuthoringSpec 喂入 `minCandidates>=3`、祈使动词白名单、证据下限，使「渲染指引文本 == 门禁」逐字一致（guidance==gate）。

**UnifiedValidator 三层验证**（`UnifiedValidator.ts:66`）：Layer 1 按 `V3_FIELD_SPEC` 逐字段检查 REQUIRED（缺失→error）/EXPECTED（→warning）/OPTIONAL（忽略），并做格式校验（content/reasoning 必须对象、kind 合法值、category 白名单等）；Layer 2 内容质量启发式（markdown ≥ `markdownFloor`、需含代码块或文件引用、coreCode 不以闭合括号开头、标题不过于通用、来源路径质量建议）；Layer 3 去重（title/trigger/`codeFingerprint(pattern)` 命中已提交集则报重复）。关键：所有 stage-3 常量（markdownFloor/各正则/指纹下限）不再内联字面量，而是 P1.3 起从 `recipe-authoring-spec/gateRules.ts` 的 `getStage3FieldPolicy()`（:26）读取，「取值与原内联字节级一致」。去重缓存用私有字段 `#titles/#codeFingerprints/#triggers`，`recordSubmission` 提交成功后回填，`createStatelessValidator()` 提供无状态一次性校验。

**RecipeAuthoringSpec 门禁真源**（`recipe-authoring-spec/gateRules.ts`）：这是「唯一表被两个投影读」的核心——`gateRules()`（:435）返回 10 条 `GateRule`（`clause-imperative`/`content-contrast`/`source-refs`/`evidence-floor`/`snippet-match`/`graph-evidence`/`session-scope`/`field-content`/`uniqueness` 等，跨 stage 1/2/3），每条含 `rejectCodes`、逐字 `params`、`guidanceText`、`failureModeKey`。执行投影 `validateAgainst`（:566）按 stage 分派 `validateStage1/2/3`，返回与 live 门禁**字节相同**的 violation 对象。层纯度靠 typed port 保证（注释 :10-15）：fs 相关的 source-ref 读（`SOURCE_REF_INVALID/NOT_FOUND/LINE_OUT_OF_RANGE`）和 bootstrap session scope（`SESSION_NOT_FOUND/WRONG_SCOPE`）通过注入的 `sourceRefResolver`/`sessionScope`（定义在 `types/recipeAuthoringSpec.ts`）执行，模块本身零 `node:fs`。`resolveAuthoringProfile`（:532）镜像 live `shouldRunRecipeEvidenceGate` 决策，判定 `cold-start`（跑全门禁）vs `opportunistic`（跳过 3-file 证据下限和 session-scope）。`resolveGroundedSourcePaths`（:603）复用门禁同一套 `collectSourceRefs→cleanSourceRef→SOURCE_REF_RE→resolver` 管线抽出「已接地的 file:line 证据集」但绝不产 violation，供质量评分/深度裁判用字节同源判定重算接地——注释明确「刻意镜像而非重构，门禁拒绝集是 rev-60 字节不变量」。

**EvolutionPolicy 与 RecipeSimilarity**：`EvolutionPolicy`（`EvolutionPolicy.ts:69`）是「纯函数、无 I/O、所有阈值集中」的静态类：`assessRisk`（deprecate 恒 high）、`observationWindow`（low 24h/medium 72h/high 7d）、`evaluateUpdate`（FP<0.4 且有使用才 pass）、`evaluateMerge`（:131，consolidation 不要求 hasUsage，避免此前误卡死）、`evaluateDeprecate`（decayScore≤19 死亡→deprecated，≤40 严重→decaying，恢复+10 则 reject）、`classifyRelevance`（分数→healthy/watch/decay/severe/dead + 置信度）。`RecipeSimilarity`（`RecipeSimilarity.ts`）实现统一 5 维加权相似度（title 0.15 / clause 0.25 / code 0.15 / content 0.30 / guard 0.15），content 维度复用 `shared/recipeTokens` 的 `extractRecipeTokens`；`EmbeddingSimProvider`（:109）是同步注入器——domain 不发起 embed，只接收上层算好的 sim，无 id/未注入则回退纯 Jaccard。

#### 模式与不变量

- **contract-vs-impl**：`KnowledgeRepository`（抽象基类抛 `Not implemented`）与 ProjectContext/RecipeContext/SourceGraph 的纯类型契约都属此——域定义形状，上层实现。
- **单一真源（single source of truth）**：DimensionRegistry（维度）、FieldSpec（字段）、gateRules（门禁）、buildDimensionSubmissionSpec（提交规范）。guidance==gate 是结构性成立而非手工维护。
- **防御式归一化**：所有值对象 `from(unknown)` 容忍字符串/数组/实例三态；`normalizeLifecycle` 把未知值归 pending。
- **不可变投影**：DimensionCatalogPayload 与 resolvePlanDimensionDefinitions 全程 `Object.freeze`。
- **Plan 不猜纪律**：域层 payload「只投射事实、不排序不筛选不推荐」，选择权交 Agent。
- **值对象的兼容标记**：Stats/Snippet 显式记「与旧 JSON 100% 向后兼容」「旧 installed/installedPath 迁移到 targets.xcode」。

#### 依赖与消费方

域内 runtime 依赖仅 `shared`（`LanguageService`、`recipeTokens`）与 `uuid`；跨层引用一律 `import type`（如 `KnowledgeEntryWire`、`RecipeAuthoring*` ports 来自 types）。消费方遍布上层：`domain/dimension` 被 `service/planIntent`、`service/knowledge/KnowledgeFileWriter`、`workflows/capabilities/planning/*`（TierScheduler/BaseDimensions/KnowledgeRescanPlanBuilder）、`workflows/capabilities/host-agent/MissionBriefingBuilder` 消费；`domain/knowledge`（KnowledgeEntry/UnifiedValidator/gateRules）被 `repository/knowledge/*`（FileStore/UnitOfWork/RepositoryImpl）、`service/knowledge/*`（KnowledgeService/ConfidenceRouter/RecipeProductionGateway）、`service/guard/GuardCheckEngine`、`service/evolution/*`（LifecycleStateMachine/RedundancyAnalyzer/ConsolidationAdvisor）消费。对外经 `src/index.ts`（根 facade）、`src/knowledge.ts`、`src/dimensions.ts`、`src/evolution.ts`、`src/project-context.ts`、`src/recipe-context.ts` 等子路径导出给 AlembicAgent / Alembic / AlembicPlugin。

#### 注意点/技术债/兼容标记

- `RecipeReadinessChecker.ts:5-13` 显式标注「已弃用归档」——已重构为 UnifiedValidator 的薄封装，外部四仓零消费者，仍经 `./knowledge` 门面导出（`checkRecipeReadiness`/`checkReadinessFromCandidate`），受「公开面形状不变」约束本波不移除；Owner=AlembicCore，移除条件=下次允许稳定面收缩的表面波 + 当时新鲜扫描为零。
- STANDARD_CATEGORIES/WHITELISTED_CATEGORIES 在 FieldSpec、RecipeReadinessChecker、UnifiedValidator 三处出现（RecipeReadinessChecker 内是本地副本 :20-32），存在轻度重复。
- gateRules 的「字节同源」纪律脆弱：`validateAgainst` 与 `resolveGroundedSourcePaths` 共用 `collectSourceRefs/cleanSourceRef/SOURCE_REF_RE` 三原语，改门禁解析循环必须同步只读投影，否则接地集与拒绝集会漂移。
- `SourceGraphContracts.ts`（约 1.4k LOC）与 ProjectContext/RecipeContext 均为纯类型/常量契约（枚举如 `SOURCE_GRAPH_FRESHNESS_STATES`、边种类、符号种类、诊断码），无运行时逻辑；`Snippet` 是可安装代码片段实体（区别于抽象 Recipe），支持多 IDE target 安装状态与旧字段迁移。DimensionCopy 提供按语言族的差异化文案（apple/js/jvm 归族 + fallback）。`DimensionSop.ts`（约 1.8k LOC，最大文件）用 `_sop` 从紧凑 `COMPACT_SOPS` 生成 25 维度的完整 SOP（步骤/工具/质检清单），并附 `SHARED_SUBMIT_CHECKLIST`（候选下限统一 ≥3，删除旧「提交 0 条」措辞，决策 D-B）。

---

### 4.4 core/ast + core/analysis — 多语言 Tree-sitter AST 解析与调用图分析 LEAF

#### 职责与层次

`src/core/ast` 与 `src/core/analysis`（连同上一级的 `src/core/AstAnalyzer.ts`）共同构成 Core 里被“祝福”（blessed）的**可导入分析叶子层**。它把源代码文本变成结构化事实：类/协议/扩展声明、继承图、方法指标、导入记录、调用点（call sites），并把这些事实解析为跨文件调用边与数据流边。整个子系统是**确定性、Headless、无 I/O 副作用（除读 `.wasm` 语法与 `tsconfig`）**的纯计算，符合 Core 仓库定位。

按 10 层契约（`config/layer-contract.json:27-31`），`core` 运行时仅允许 import `shared` / `types` / `infrastructure`。本子系统实际只依赖 `shared`（`packageRoot.RESOURCES_DIR`、`LanguageService`、`ProjectScope`）与外部包 `web-tree-sitter`，未反向依赖 `service`/`repository`，因此是干净的叶子。反过来，它被 `service` 与 `workflows` 通过**矩阵祝福**边消费（`layer-contract.json:81-90`：`service -> core` 供 `GuardCheckEngine`，`workflows -> core` 供 `ProjectIntelligenceRunner`），另有一条**文件级祝福**允许 `infrastructure/vector/ASTChunker.ts` 懒加载 `parseToTree`（`layer-contract.json:74-79`）。两个目录都作为独立包子路径导出：`@alembic/core/core/ast`、`@alembic/core/core/ast/*`、`@alembic/core/core/analysis`（`package.json:117-127`）。

#### 关键文件与模块

- **`src/core/AstAnalyzer.ts`（1124 行）**：中枢。插件注册表 + 公共 API（`analyzeFile`/`analyzeProject`/`parseToTree`/`findCallExpressions`/`findPatternInContext`/`checkProtocolConformance`/`generateContextForAgent`/`isAvailable`/`supportedLanguages`）。虽在分区上一级，但被两个目录双向引用，是本节主体。
- **`src/core/ast/index.ts`（264 行）**：语言插件自动加载器。`LANG_REGISTRY`（:135）列出 11 个 langId→wasm→模块映射；`loadPlugins()`（:204）幂等加载并 `registerLanguage`。
- **`src/core/ast/parserInit.ts`（79 行）**：`web-tree-sitter` WASM 运行时生命周期（`initParser`/`getParserClass`/`isParserReady`/`loadLanguageWasm`）。
- **`src/core/ast/ensureGrammars.ts`（122 行）**：WASM 文件可用性检查（不再 npm install）、`reloadPlugins`、`inferLanguagesFromStats`。
- **`src/core/ast/lang-*.ts`（10 个，376–1154 行）**：每语言的 walker + 模式检测 + 调用点提取插件。
- **`src/core/ast/ProjectGraph.ts`（806 行）**：Bootstrap Phase 1 的一次性只读项目结构图，支持增量更新与 JSON 序列化。
- **`src/core/analysis/*`**：Phase 5 调用图五段流水线。

#### 核心类型与契约

`LangPlugin` 接口（`AstAnalyzer.ts:37-49`）是语言插件契约：`getGrammar()`、`walk(root, ctx)`（必需）、可选 `detectPatterns`、`extractCallSites`、`extensions`。`AstWalkerContext`（:52-64）是 walker 唯一副作用出口——walker 往 `ctx.classes/protocols/categories/methods/properties/imports/exports/callSites/references` 里 push。`AstFileSummary`（:173-187）是 `analyzeFile` 的输出契约；`ProjectAnalysisResult`（:212-222）是 `analyzeProject` 的输出，是唯一被 `export type` 的公共类型（:1124）。

`CallSiteInfo`（`CallSiteExtractor.ts:24-34`）：`{callee, callerMethod, callerClass, callType, receiver, receiverType, argCount, line, isAwait}`，`callType` 枚举 `function|method|constructor|super|static`。`ImportRecord`（`ImportRecord.ts:28`）是**鸭子类型兼容 string 的类**：代理 `includes/startsWith/split/replace/toString/toJSON/valueOf` 到 `this.path`，同时携带结构化 `symbols/alias/kind/isTypeOnly`——这是一个刻意的向后兼容设计（旧代码把 import 当 string 用仍工作，注释 :11-13 明确 `typeof` 不再是 `'string'`）。`ResolvedEdge`（`CallEdgeResolver.ts:17-26`）带 `resolveMethod`（`direct|cha|inferred|rta`）标注解析来源。`DataFlowEdge`（`DataFlowInferrer.ts:14-21`）区分 `argument`（forward）/`return-value`（backward，固定低置信 0.3）。

#### 关键类/函数与实现逻辑

**WASM 语法加载（惰性 + 优雅降级）**：`loadPlugins()`（`index.ts:204`）用 `_loaded` 标志幂等；先 `initParser()`，若 `web-tree-sitter` 不可用则直接 return（降级为“无 AST”）。它**串行**（非 `Promise.all`）加载 11 个 `.wasm`，注释 :216 说明并行会偶发竞态失败。每个 wasm 独立 try/catch，失败仅跳过该语言；随后按 `moduleCache` 去重加载插件模块（typescript 与 tsx 共享 `lang-typescript.js`，:241），注入 grammar（`setGrammar`/`setTsxGrammar`），`registerLanguage(langId, plugin)`。文件尾 `await loadPlugins()`（:264）是 ESM 顶层 await 的**副作用自动注册**。`parserInit.loadLanguageWasm`（:65）自行 `readFile` 成 `Uint8Array` 再 `Language.load`，注释 :72 说明是绕开 ESM 下 `__require("fs/promises")` 兼容问题。`ensureGrammars`（:52）在 WASM 模式下不再运行时安装——`installed` 恒空，只检查文件存在，缺失记 `failed` 并 warn。

**`analyzeFile`（`AstAnalyzer.ts:250`）** 是核心单文件管线：`_langPlugins.get(lang)` 无插件→返回 `null`（优雅降级）；`_getParser(lang)`（:532）从 `_parserCache` 取或 `new ParserClass()+setLanguage(grammar)`。解析→`plugin.walk(root, ctx)`→可选 call-site 二次遍历（`options.extractCallSites !== false`，优先 `plugin.extractCallSites`，否则 `getCallSiteExtractor(lang)`，最后 `defaultExtractCallSites`，整段 try/catch **非致命**，:288-292）→`_buildInheritanceGraph`→模式检测（插件自带 `detectPatterns` 否则通用 `_detectPatterns`，:299-301）→`_computeMetrics`。

**Parser 缓存策略（AD4, blessed-singletons）**：`_parserCache`（:525）每语言一个 parser，进程级存活；`_langPlugins` 是永不驱逐的插件注册表；`registerLanguage` 会 `_parserCache.delete(lang)`（:237）以便新语法生效；`_resetAstParserCacheForTesting`（:528）供测试清缓存（grammar 可确定性重建）。

**通用模式检测 `_detectPatterns`（:588）** 用方法名/属性名正则识别 singleton（`^shared|^default|^instance$|^current$` 且 isClassMethod）、delegate（属性名含 delegate，检 `weak` 判 `isWeakRef`）、factory、observer，各带 `confidence`。TS 插件自带 `detectTSPatterns`（`lang-typescript.ts:644`）额外识别 react-hook、middleware、decorator（`@Injectable|Component|...`）。**复杂度/嵌套**：`_estimateComplexity`（:745）圈复杂度基线 1，遇 `BRANCH_TYPES` 分支节点与 `&&/||` 递增；`_maxNesting`（:785）计最大嵌套层。注意每个 `lang-*.ts` 各自复制了一份 `_estimateComplexity`/`_maxNesting`（如 `lang-typescript.ts:734,765`），不共享——是完整迁移遗留。

**继承图 `_buildInheritanceGraph`（:658）** 产 `{from,to,type:inherits|conforms|extends}` 边，**兼容 ObjC category（`className/categoryName`）与 Dart extension（`name/targetClass`）两种形状**（:685-687）。

**Guard AST 查询 API**：`findCallExpressions`（:893）遍历 AST 找 `call_expression|message_expression|function_call_expression|navigation_expression` 中文本包含 `targetCallee` 的节点，带去重防父子重复（:940-948）；`findPatternInContext`（:971）在叶节点做上下文过滤（`forbiddenContext`/`requiredContext`，向上找 enclosing method/class）；`checkProtocolConformance`（:1073）复用 `analyzeFile` 判类是否遵循协议（含 extension/category 路径）。这三者专供 `GuardCheckEngine`（`service/guard/GuardCheckEngine.ts:1097` 调 `findCallExpressions`）。

**调用点提取 `CallSiteExtractor`（750 行）** 用 post-walk 二次遍历（方案 B，零改 walker）。TS/JS 版 `_collectTSScopes`（:63）收集 function/method/箭头函数作用域，`_extractCallSitesFromBody`（:174）递归找 `call_expression`/`new_expression`/JSX 元素（大写开头视为 constructor 调用，:263），`await`/`await_expression` 标记 `isAwait`。`_parseTSCallExpression`（:320）推断 receiverType：`this/self`→当前类、`super`→callType=super、大写 receiver→callType=static。`_isNoiseCall`（:672）用 `NOISE_RECEIVERS`（console/Math/JSON…）与 `NOISE_CALLEES`（require/log/map/isinstance/super…）黑名单剔除内置噪声。`_extractors`（:630）注册 ts/tsx/js/python；`defaultExtractCallSites`（:646）对未适配语言返回空（降级）。Go/Swift/Rust/Dart 在各自 `lang-*.ts` 提供 `extractCallSites`（如 `lang-go.ts:561`），**ObjC 无 extractCallSites**（`lang-objc.ts:471` 插件仅 walk+detectPatterns）。

**调用图编排 `CallGraphAnalyzer`（419 行）** 是顶层流水线，`analyze()`（:95）默认 timeout 15s、每文件 500 call sites 上限。**分级降级 `_computeTier`（:393）**：`<100`→`full-cha`（启用 CHA）、`≤500`→`full`、`≤2000`→`sampled`（`_sampleCoreFiles` 优先 src/lib/core/… 目录取前 500）、`>2000`→`import-only`（直接返空调用边，仅模块级）。`_doAnalyze`（:257）逐文件解析并**渐进式超时**——每文件检查 deadline，超时返回 `partial:true` 的部分结果（:320-339）。`analyzeIncremental`（:120）：>10 个变更文件回退全量；否则符号表始终全量重建（保证跨文件符号可解），通过 `ImportPathResolver` 计算**反向依赖**（affectedFiles），只对受影响文件解析调用边。

**符号表 `SymbolTableBuilder.build`（`SymbolTableBuilder.ts:39`）** 从 `analyzeProject` 结果构建全局表：`declarations`（FQN=`file::[Class.]name`→声明）、`fileExports`、`fileImports`（兼容 string/ImportRecord，:116-118）、Phase 5.3 的 `instantiatedClasses`（RTA，从 `callType==='constructor'` 收集）、`propertyTypes`（DI，className→field→type）。`_extractExportNames`（:155）能从 `export class X`/`export {A as B}` 文本正则回捞导出名。

**调用边解析 `CallEdgeResolver`（476 行）** 是最精巧的部分，构造时建 `nameIndex`（symbol→fqn[]）、`fileIndex`（file→decl[]，Issue #14 性能优化）、`classNames`。`_resolveCallSite`（:197）是**优先级瀑布**：P0 `super.xxx()` 走 CHA 且禁止 fallthrough（防自引用边）；P1 `this/self.xxx()` 同类方法→CHA；P1.5 `this.field.method()` 先查显式 `propertyTypes`（DI-aware）→`receiverType`→命名约定 `_inferFieldType`（userRepo→UserRepo，:426）；P2 import-based（namespace vs named）；P2.5 隐式 this（OOP 语言 bare `method()`）；P3 同文件函数（过滤 callerFqn 防重载假边）；P4 全局唯一匹配（低置信），多候选时用 RTA `instantiatedClasses` 过滤到唯一（:342-361）。**核心不变量：解析不出就不建边（宁缺勿滥，:363）**。`_resolveByCHA`（:377）沿继承图 BFS 向上最多 10 层防循环。`DataFlowInferrer.infer`（:25）从调用边派生数据流：有参数→forward argument 边，每边额外一条 backward return-value 边（confidence 0.3）。

**`ImportPathResolver`（202 行）** 把 import 路径映射到项目内文件：构造 `fileIndex`（含去扩展名、index 约定、Python `__init__.py`，:36-61），`_loadTsconfigPaths`（:70）读 tsconfig/jsconfig 的 `paths` alias（去注释后 JSON.parse，容错静默）。`resolve`（:121）：相对路径→normalize join；alias 解析；`_isExternal` 判外部依赖返 null；Python 点分路径转斜线。不负责 webpack alias 与 Node exports map（注释 :12-14）。

#### 模式与不变量

- **插件注册表 + 副作用自动加载**：`import '../core/ast/index.js'` 即注册全部语言（顶层 await）。
- **优雅降级贯穿全链**：`web-tree-sitter` 缺失、wasm 缺失、单语言加载失败、单文件解析失败、call-site 提取失败均不抛，返回 null/空/跳过。`isAvailable()`（:507）= parser ready 且至少 1 插件。
- **预算/截断**：per-file 500 call sites、maxFiles 500、maxFileSizeBytes 500KB（`ProjectGraph.ts:26`）、CHA 深度 10、渐进式超时 partial 结果。
- **确定性重建**：parser cache 可清后由 grammar 确定性重建（AD4 注释 :520-524）。
- **鸭子类型兼容**：`ImportRecord` 假装是 string。
- **宁缺勿滥**：CallEdgeResolver 不确定不建边，`resolveMethod` 标注证据来源（direct/cha/inferred/rta），供下游判置信。
- **frozen/迁移标记**：`AstCallSiteRecord`（:128 `biome-ignore`）保留占位；每语言复制 complexity/nesting 是完整迁移遗留。

#### 依赖与消费方

依赖：`web-tree-sitter`、`shared/packageRoot`、`shared/LanguageService`、`shared/ProjectScope`。消费方（全部为祝福边）：`infrastructure/vector/ASTChunker.ts:130-187`（懒加载 `parseToTree` 做语义分块）；`service/guard/GuardCheckEngine.ts:8,1097`（AST 规则用 `findCallExpressions` 等）；`service/project-context/fileSymbols/extract.ts:47`（`analyzeFile` + `extractCallSites:false`）与 `fileFlow/extract.ts:65-79`（`extractCallSites:true` 取 callSites）；`service/knowledge/CodeEntityGraph.ts:239`（消费 `analyzeProject` 产出）；`types/projectSnapshotBuilder.ts`、`workflows/capabilities/host-agent/MissionBriefingBuilder.ts`、`core/enhancement/EnhancementPack.ts`。`ProjectGraph` 是 Bootstrap Phase 1 的项目结构图（build 后只读，支持 `incrementalUpdate`/`toJSON`/`fromJSON`），是 project-intelligence 编排的基础。

#### 注意点/技术债/兼容标记

1. **语言覆盖不对称**：11 个 langId 有 walker/继承/模式，但调用点提取仅 ts/tsx/js/python（`_extractors`）+ go/swift/rust/dart（各插件自带），**ObjC 无 extractCallSites**，Java/Kotlin 需确认插件是否自带（默认降级空）。
2. **DataFlow 极粗**：仅 L0/L1，return-value 边保守全量生成，L2/L3 明确留待后续（`DataFlowInferrer.ts:9`）。
3. **重复代码债**：`_estimateComplexity`/`_maxNesting` 在 AstAnalyzer 与各 `lang-*.ts` 多份复制，分支节点集合各语言可能不一致。
4. **`ImportRecord` 破坏 `typeof===string`**：跨模块传递需注意仍是 object。
5. **tsconfig 解析是启发式**：只读第一个命中的配置文件、简单去注释正则，复杂 JSONC 或 extends 链未处理。
6. **大量 `any`**：`lang-*.ts`、`ProjectGraph.ts`、`parserInit.ts` 未严格类型化，与 Core “避免 any” 规则有张力，属迁移遗留。

关键文件锚点：
- `src/core/AstAnalyzer.ts:250` `analyzeFile`；:329 `analyzeProject`；:566 `parseToTree`；:893 `findCallExpressions`
- `src/core/ast/index.ts:204` `loadPlugins`；:135 `LANG_REGISTRY`
- `src/core/ast/parserInit.ts:30/65` `initParser`/`loadLanguageWasm`
- `src/core/ast/ensureGrammars.ts:52` `ensureGrammars`
- `src/core/ast/ProjectGraph.ts:98` `ProjectGraph.build`
- `src/core/analysis/CallGraphAnalyzer.ts:95/393` `analyze`/`_computeTier`
- `src/core/analysis/CallEdgeResolver.ts:197/377` `_resolveCallSite`/`_resolveByCHA`
- `src/core/analysis/SymbolTableBuilder.ts:39` `build`
- `src/core/analysis/ImportPathResolver.ts:121` `resolve`
- `src/core/analysis/CallSiteExtractor.ts:320/672` `_parseTSCallExpression`/`_isNoiseCall`
- `config/layer-contract.json:74-90` 祝福边

---

### 4.5 core/discovery + core/enhancement + core/capability（项目结构发现、框架增强与写权限探针）

#### 职责与层次

这三个子系统同属 `core/` 层，是 layer-contract 中"multi-language 分析叶子"（blessed importable leaf）的一部分，只允许 import `shared`、`types`、`infrastructure`，禁止反向依赖 `service`/`workflows`/`repository`。它们都是**确定性、Headless、无交互 I/O** 的能力：把磁盘上的构建配置与目录结构解析成结构化事实，或把宿主写权限探测成一个枚举值，交给上层 `service`/`workflows` 与宿主 Agent 消费。

- **discovery**（21 文件/~7.6k）：多语言/多构建系统的**项目结构发现器**。核心抽象是 `ProjectDiscoverer`（detect/load/listTargets/getTargetFiles/getDependencyGraph 五方法契约），由 `DiscovererRegistry` 按 confidence 竞标选出最佳实现，产出 `DiscoveredTarget[]`（模块/target）、`DiscoveredFile[]`（源码文件）和 `DependencyGraph`（模块依赖图）。
- **enhancement**（17 文件/~3.3k）：**语言/框架特有增强包**。每个 `EnhancementPack` 为某框架（React/Vue/Django/Spring/…）贡献额外 Bootstrap 维度、Guard 规则、设计模式检测和 SFC 预处理，由 `EnhancementRegistry` 按 `primaryLang + detectedFrameworks` 筛选。它**增强**的正是 discovery 阶段判定出的语言与框架。
- **capability**（2 文件/278 行）：`CapabilityProbe`，探测子仓库（默认 `Alembic/recipes/`）的写入范围（`local-write`/`remote-write`/`read-only`），供 Recipe 发布链判断能否写/推送。

三者的公共接入口分别是包子路径 `@alembic/core/core/discovery`、facade `@alembic/core/enhancement`（`src/enhancement.ts`）、facade `@alembic/core/capability`（`src/capability.ts`）。

#### 关键文件与模块

| 文件 | 关键锚点 | 作用 |
|---|---|---|
| `src/core/discovery/ProjectDiscoverer.ts:68` | 抽象基类 + DTO | discover 五方法契约、`DiscoveredTarget`/`DiscoveredFile`/`DependencyGraph` 类型 |
| `src/core/discovery/DiscovererRegistry.ts:16` | `detect`/`detectAll`/`analyzeConflict` | confidence 竞标、偏好提升、模糊检测 |
| `src/core/discovery/index.ts:20` | `getDiscovererRegistry` | 懒单例，注册 9 个 discoverer（含 generic 兜底） |
| `src/core/discovery/DiscovererPreference.ts:51` | `detectConflict`/`loadPreference`/`savePreference` | 模糊判定阈值 + 偏好持久化到 `.asd/discoverer-preference.json` |
| `src/core/discovery/SourceScanExclusions.ts:8` | `COMMON_SOURCE_SCAN_EXCLUDE_DIRS` | 冷启动源码扫描共享排除集（node_modules/dist/vendor…） |
| `src/core/discovery/SpmDiscoverer.ts:32` | 正则解析 Package.swift | 代表性单语言 discoverer |
| `src/core/discovery/GenericDiscoverer.ts:24` | confidence 0.1 恒匹配 | 兜底目录扫描 discoverer |
| `src/core/discovery/CustomConfigDiscoverer.ts:339` | 两级检测 + 7 parser 分派 | 自研/非标准构建系统（Bazel/Tuist/EasyBox…） |
| `src/core/discovery/ConfigWatcher.ts:80` | fs.watch + debounce | 配置热更新、增量重解析、SignalBus 通知 |
| `src/core/discovery/parsers/*.ts` | CMake/Gradle/Json/Ruby/Starlark/Yaml | 无编译器的轻量正则/状态机 parser |
| `src/core/enhancement/EnhancementPack.ts:99` | 抽象基类 | 6 个可选钩子（默认全空实现） |
| `src/core/enhancement/EnhancementRegistry.ts:10` | `resolve` | 按 lang+framework 筛包 |
| `src/core/enhancement/index.ts:37` | `initEnhancementRegistry` | 异步动态 import 14 包 |
| `src/core/enhancement/ReactEnhancement.ts:15` | 4 维度 + 7 Guard 规则 + detectPatterns | 代表性框架包 |
| `src/core/capability/CapabilityProbe.ts:60` | `probeStatus`/`_runProbe`/`_probePush` | git push --dry-run 探针 + 24h 缓存 |

#### 核心类型与契约

`ProjectDiscoverer`（`ProjectDiscoverer.ts:68`）是抽象基类，所有方法默认 `throw new Error('Not implemented')`——这是**契约-实现分离**模式，强制子类覆盖。三个核心 DTO：`DiscoveredTarget`（name/path/type/language/framework/metadata，含 `[key: string]: unknown` 允许扩展）、`DiscoveredFile`（name/path/relativePath/language）、`DependencyGraph`（nodes 可为 string 或富节点对象；edges 为 `DependencyEdge` 带 scope/configuration/bridgeType；可选 `layers` 承载自研构建系统的分层声明）。`DependencyEdge` 的 `bridgeType` 字段专门表达跨语言桥接（flutter-engine/native-module/cinterop）。

`EnhancementPack`（`EnhancementPack.ts:99`）契约含 6 个钩子：`getExtraDimensions()` 返回 `ExtraDimension[]`（id/label/guide/tierHint/knowledgeTypes/skillWorthy/dualOutput/skillMeta，供 Bootstrap 的 TierScheduler 调度）、`getGuardRules()` 返回 `GuardRule[]`（带 RegExp pattern/severity/dimension）、`detectPatterns(astSummary)` 返回 `DetectedPattern[]`、`preprocessFile(content, ext)` 做 SFC 预处理、`getReferenceSkillPath()` 返回参考 Skill 路径。基类除 `displayName`/`id`/`conditions` 外全部返回空/null，子类**按需覆盖**——实测只有 `VueEnhancement` 覆盖了 `preprocessFile`（`.vue` → 提取 `<script setup>`），没有任何包覆盖 `getReferenceSkillPath`（全部继承基类 null）。

`CapabilityProbeResult = 'local-write' | 'remote-write' | 'read-only'`（`CapabilityProbe.ts:29`）配合 8 种 `CapabilityProbeReason`，仅描述**写入范围而非产品职责角色**（注释明确强调）。

#### 关键类/函数与实现逻辑

**DiscovererRegistry 竞标选择**（`DiscovererRegistry.ts:29`）：`detect()` 对所有 discoverer 并发跑 `detect(projectRoot)`（单个 detect 抛错被 `.catch` 降级为 `{match:false, confidence:0}`，保证不因单点失败中断），过滤 match、按 confidence 降序，取 top-1；全不命中则回退到 `id==='generic'`。`detectAll()` 额外读取 `WorkspaceResolver.fromProjectScopeRegistry(projectRoot).dataRoot` 下的用户偏好，若 `userConfirmed` 则把偏好 discoverer 提升到首位。`analyzeConflict()` 委托 `detectConflict`（`DiscovererPreference.ts:51`）：两条模糊判据——(1) 有 ≥2 个 confidence≥0.6 且 top1-top2 差值 < `AMBIGUITY_THRESHOLD(0.1)`；(2) 最高分 < `HEURISTIC_UNCERTAIN_THRESHOLD(0.6)`（仅启发式命中）。模糊时返回 `ambiguous:true`，由**宿主层**负责用户确认（Core 不做交互），确认结果经 `savePreference` 落盘。

**SpmDiscoverer**（`SpmDiscoverer.ts`）是无 Swift 编译器的纯正则解析样板：`detect` 根目录有 Package.swift → 0.95，子目录有 → 0.85；`load` 递归找所有 Package.swift（深度上限 5，用 `SKIP_DIRS` 跳依赖目录），逐个 `#parsePackageSwift` 用括号配平（depth 计数 `(`/`)`）+ 正则抽取 name/targets/dependencies/products/platforms。`getDependencyGraph` 处理 umbrella package（无 targets/products）、local/remote 依赖、`contains`/`depends_on` 边。`#walkSourceFiles` 有 `MAX_FILES=300`、单文件 ≤512KB 的**预算/截断**保护。

**GenericDiscoverer**（`GenericDiscoverer.ts:36`）恒返回 `match:true, confidence:0.1`，`load` 采样统计语言分布（深度上限 5）取最多扩展名为主语言，按约定目录（src/lib/app/pkg/cmd/internal/test）分 target，无约定目录则整项目为一个 target；`getDependencyGraph` 明确返回空边（无法推断）。

**CustomConfigDiscoverer**（`CustomConfigDiscoverer.ts:339`）是最大最复杂的 discoverer，两级检测：Level 1 用冻结的 `KNOWN_CUSTOM_SYSTEMS`（Bazel/Buck2/Gradle-convention/Melos/EasyBox/Tuist/KSComponent/MTComponent/Flutter-add-to-app 等，各带 markers/markerStrategy(`all`/`any`/`ordered`)/antiMarkers/confidence 0.7-0.85）指纹匹配，先查 antiMarkers 排除再按策略验 markers；Level 2 启发式目录探测，基础分 0.35 逐信号加 boost、上限 0.65，要求 ≥0.5 且 ≥2 信号才 match。`getEffectiveSystemProfiles`（`:329`）会先加载用户在 project-spec 里声明的 `customDiscoverer`（`loadUserCustomSystems`，含结构校验与 parser 白名单归一化），**用户系统优先于内置**。`load` 按匹配系统的 `parser` 字段 switch 分派到 7 个 parser（ruby-dsl/yaml/starlark/gradle-dsl/cmake/json-config/swift-dsl），失败降级 `#loadHeuristic`。parser 层（`parsers/`）全部是**无编译器的正则+逐行状态机**轻量解析（如 `StarlarkParser.ts` 不做宏展开，靠 `RULE_TO_LANGUAGE` 把 `swift_library`→swift 推断语言）。

**ConfigWatcher**（`ConfigWatcher.ts:80`）：监听自研构建配置（`WATCH_PATTERNS` 内置 easybox/tuist/xcodegen），debounce 3s、MD5 hash 差量检测跳过无效重解析、60s 全量重建最小间隔防批量变更风暴，用 `timerRegistry` 管理定时器，变更经 `SignalBus` 发布 lifecycle 事件、经 `onChange` 回调推送 Dashboard。

**EnhancementRegistry.resolve**（`EnhancementRegistry.ts:20`）：`langMatch = !cond.languages || includes(primaryLang)`；有 frameworks 条件时要求 `detectedFrameworks` 命中其一，无 frameworks 条件则只看 lang。`initEnhancementRegistry`（`index.ts:37`）用 `Promise.allSettled` 动态 import 14 个包文件（每个导出 `export const pack = new XxxEnhancement()`），fulfilled 且有 `.value.pack` 才 register——**部分失败不影响整体**。注意 `getEnhancementRegistry`（同步路径）无法动态 import，未初始化时返回空 registry，`resolve()` 结果为空但不抛错。各包的 `detectPatterns` 消费 `AstSummary`（来自 AST 分析），用正则匹配方法/类名产出带 confidence 的模式（如 React 的 `^use[A-Z]`→custom-hook 0.9、`componentDidCatch`→error-boundary 0.95）。

**CapabilityProbe**（`CapabilityProbe.ts:85`）：`probeStatus` 先查缓存（默认 TTL 86400s=24h），未命中跑 `_runProbe` 的四段状态机：无子仓库→local-write；有目录非 git→local-write；有 git 无 remote→按 `noRemote` 策略（allow→local-write / deny→read-only）；有 remote→`_probePush` 执行 `git push --dry-run`（15s 超时），成功或 "Everything up-to-date"→remote-write，含 permission/denied/403/401→read-only，其余（网络错误等不确定）**保守降级为 read-only**（`push-inconclusive`），避免把不确定当可写。`_hasRemote` 有快速路径：config 里读到 `subRepoUrl` 即认为有 remote。

#### 模式与不变量

- **契约-实现分离**：`ProjectDiscoverer`/`EnhancementPack` 抽象基类，前者未实现方法抛错、后者返回空默认，子类按需覆盖。
- **Registry + confidence 竞标**：discovery 用并发 detect + 降序取 top + generic 兜底；enhancement 用 lang/framework filter。
- **Blessed lazy singleton**：`getDiscovererRegistry`/`getEnhancementRegistry` 都是进程内懒单例，无持久化状态，重启即确定性重建（`index.ts:13` AD4 注释）。`resetDiscovererRegistry` 仅供测试。
- **预算/截断保护**：SpmDiscoverer MAX_FILES=300 + 512KB 上限；repo.ts 消费侧有 `maxFiles` 截断并回报 truncated。
- **Headless 边界**：Core 不做交互，模糊/用户确认交宿主，偏好持久化到 dataRoot（Ghost 模式外置工作区）。
- **保守降级**：detect 抛错降级为不匹配、parser 失败降级 heuristic、push 不确定降级 read-only、enhancement 包加载失败静默跳过——所有分叉均可诊断。
- **数据/配置冻结**：`KNOWN_CUSTOM_SYSTEMS`、`COMMON_SOURCE_SCAN_EXCLUDE_DIRS` 均 `Object.freeze`/`as const`。

#### 依赖与消费方

**依赖**：discovery 依赖 `shared`（LanguageService/WorkspaceResolver/ProjectMarkers/TimerRegistry/resolveProjectRoot）、`infrastructure`（config/Paths、signal/SignalBus——ConfigWatcher 仅 type-only 引用 SignalBus，属类型桥接豁免）；capability 依赖 `infrastructure/logging/Logger` 与 `shared/ProjectMarkers`；enhancement 几乎零外部依赖（只 import 自身 EnhancementPack）。

**消费方**：discovery 的主消费者是 `src/service/project-context/repo/repo.ts:528`（`collectDiscoveryFacts`）——它调 `analyzeConflict` 判模糊、`detect`/`getAll().find` 选 discoverer、`load` → `listTargets`（排序）→ `getTargetFiles`，把结果归一化为 ProjectContext 的 `DiscoveryFacts`（targets/files/discovererId/confidence），供 ProjectIntelligence 与宿主 Agent 冷启动使用。enhancement 的**唯一业务消费路径**是 Guard：`src/service/guard/EnhancementGuardRules.ts:45`（`resolveEnhancementGuardRules`，支持 frameworkAgnostic/language 两模式）经 `@alembic/core/guard` facade 暴露给外层 Plugin/Alembic 的 guard handler，注释明确"enhancement 唯一业务用途是产 Guard 规则"（RIC-2a/R1）；`src/enhancement.ts` 另提供 `FrameworkEnhancements` facade。capability 经 `src/capability.ts` facade 供 Recipe 发布链探测写权限。三者都在 `CoreContractSpine.ts` 与 `package.json` exports 中登记为长期公共契约。

#### 注意点/技术债/兼容标记

- **`index.ts:13` 注释"16 stateless packs"已陈旧**：当前实际只有 14 个 `*Enhancement.ts` 文件，`initEnhancementRegistry` 也只 import 14 个，无遗漏但注释数字过时。
- **CO-4 契约说明与 facade 并存**：`CoreContractSpine.ts:557` 记载"capability 与 enhancement 的 **duplicate** routes 在消费方迁移后已被 CO-4 retired"，但 `src/capability.ts`、`src/enhancement.ts` 及 `package.json` 的 `./capability`/`./enhancement` exports 仍在——即被撤的是重复路由，保留的是单一 facade，需注意别误删仍被消费的 facade。
- **`getReferenceSkillPath` 全未实现**：`EnhancementPack` 声明的该钩子无任何包覆盖，是预留但当前 dead 的契约面（Bootstrap 自动加载 Reference Skill 的能力尚未接线）。
- **`markerStrategy: 'ordered'` 未真正实现**：`CustomConfigDiscoverer.ts:374` 注释明确 'ordered' 当前与 'all' 同义（"未来可扩展"）。
- **CustomConfigDiscoverer 是 god-file（1476 行）**：含配置表、两级 detect、7 parser 分派、多个 `#load*` 分支，是本分区最重的重构候选。
- **正则解析的固有脆弱性**：SpmDiscoverer 等无编译器解析在复杂/动态 DSL（如条件生成 target）下可能漏解或误解，靠 try/catch 降级但不保证完整性——这是 Headless 无宿主运行时的确定性取舍。
- **CapabilityProbe 用 `execSync`**：同步阻塞调 git（`_hasRemote` 5s、`_probePush` 15s 超时），24h 缓存缓解但首次探测会阻塞调用线程。

---

### 4.6 infrastructure/ 层：持久化、向量检索、信号总线与运行时基础设施

#### 职责与层次

`src/infrastructure/` 是 AlembicCore 十层契约中的第 5 层，向上服务于 `repository/`、`service/`、`workflows/`，向下只允许 import `shared/` 与 `types/`（`src/infrastructure/index.ts:1-8` 桶只 re-export 八个子域：config、database、event、io、logging、report、signal、vector）。它把「与外部世界打交道」的确定性能力集中在这里：SQLite/Drizzle 持久化与 migration、HNSW 纯 JS 向量索引与 SQ8 量化、跨仓承重的 SignalBus、三区写入的 WriteZone、winston 日志、JSONL 报告存储、以及配置加载。此层刻意不含宿主 Agent、AI provider（`OllamaEmbedProvider` 是唯一例外——一个零推理依赖的纯 HTTP 客户端）、UI 或 tool system，符合仓库「Headless 确定性内核」的定位。

#### 关键文件与模块

- database：`DatabaseConnection.ts`（连接/migration runner）、`drizzle/schema.ts`（22 表单一真相）、`drizzle/index.ts`（延迟单例）、`PreparedStatementCache.ts`（连接域 LRU）、`migrations/001..016`（gap-tolerant 迁移文件）。
- vector：`VectorStore.ts`（抽象基类契约）、`HnswVectorAdapter.ts`（生产实现门面）、`HnswIndex.ts`（HNSW 图算法）、`ScalarQuantizer.ts`（SQ8）、`AsyncPersistence.ts`（WAL+CRC32）、`BinaryPersistence.ts`（.asvec 格式）、`ASTChunker.ts`（blessed core-leaf 消费方）、`IndexingPipeline.ts`、`Chunker.ts`、`BatchEmbedder.ts`、`OllamaEmbedProvider.ts`、`VectorMetadataFilter.ts`、`JsonVectorAdapter.ts`、`VectorMigration.ts`。
- signal：`SignalBus.ts`（4 仓骨架）、`SignalAggregator.ts`（滑窗+异常检测）、`SignalBridge.ts`（→EventBus）、`SignalTraceWriter.ts`（全类型 JSONL 留痕）。
- io/logging/report/event/config：`WriteZone.ts`、`Logger.ts`、`ReportStore.ts`、`EventBus.ts`、`ConfigLoader.ts`/`Defaults.ts`/`Paths.ts`/`TriggerSymbol.ts`。

#### 核心类型与契约

`DrizzleDB = BetterSQLite3Database<typeof schema>`（`drizzle/index.ts:13`）是持久化的类型锚点，`schema.ts` 是 DB 列名的单一真相，实体映射由 repository 层完成（`schema.ts:5`）。`Signal`（`SignalBus.ts:33-46`）定义 `{type, source, target, value(0-1), metadata, timestamp}`，`SignalType`（:18-30）为 12 值联合枚举。`WriteZone` 用 branded `ZonedPath<Z>`（`WriteZone.ts:42-49`）在编译期区分 Project/Data/Global 三区路径混用。`ReportEntry`（`ReportStore.ts:19-30`）四分类 `governance|compliance|metrics|analysis`。`WAL_OP`（`AsyncPersistence.ts:23-27`）冻结为 `{UPSERT:1, REMOVE:2, CLEAR:3}`。

#### 关键类/函数与实现逻辑

**DatabaseConnection**（`DatabaseConnection.ts:37`）是 unit-of-work + 门面。`connect()`（:54）核心是路径安全：相对 DB 路径按 `projectRoot`（而非 `process.cwd()`，因为 MCP server 的 cwd 不是项目目录）解析；Ghost 模式下用 `WorkspaceResolver.dataRoot` 重定向并 `pathGuard.addAllowPath`（:59-64）；命中 `isExcludedProject`（:75）时若属于 project-scope 则抛错，否则重定向到 `os.tmpdir()/alembic-dev/alembic.db`（:84-92）。连接后设三条 pragma：`journal_mode=WAL`、`foreign_keys=ON`、`busy_timeout=3000`（:122-124）——这是 CO3 C7 用户裁定的「全部并发策略」，刻意无应用级重试/退避，超时后错误上抛并由 `isSqliteBusyError`（:23）打诊断码 `core.diagnostic.db.sqlite-busy`。`runMigrations()`（:133）是 gap-tolerant runner：读取 `migrations/` 目录按文件名排序，逐个查 `schema_migrations` 表决定是否应用，`.ts`/`.js` 走 `import` 后调 `default` 函数、`.sql` 走 `db.exec`，两者都包在事务里并 `INSERT OR IGNORE` 记录版本（:161-200）。已知编号缺口 002/003（:139-147）被明确注释为「不是错误」。

**Drizzle 单例**（`drizzle/index.ts`）延迟初始化，与 raw better-sqlite3 共享同一连接（:23）；`getDrizzle()` 全局单例标注 `@deprecated`（:29-34），优先走 `DatabaseConnection.getDrizzle()` 或 DI。

**PreparedStatementCache**（`PreparedStatementCache.ts`）是 AD5/AD4 blessed bounded-cache：以 SQL 字符串为 key、经 `WeakMap` 按连接隔离（:32），上限 128 条，命中时 `delete`+`set` 实现 LRU touch（:47-52），溢出时删 Map 迭代序首个 key（:56-60）。reconnect 得新缓存、close 随句柄释放，行为等价（同 SQL 同结果，只复用 prepare）。

**HnswIndex**（`HnswIndex.ts:155`）是零依赖纯 JS 的分层可导航小世界图（Malkov & Yashunin 2018）。内含手写 `MinHeap`/`MaxHeap`（:18-151）。`addPoint`（:248）：`#randomLevel`（:217，几何分布，用 `1-Math.random()` 避免 log0）定层；已存在 id 先 `removePoint` 支持更新；Phase1 从 `maxLevel` 贪心下降到 `nodeLevel+1`，Phase2 从 `min(nodeLevel,maxLevel)` 逐层 `#searchLayer(efConstruct)` 选 M（L0 层 M0=2M）个邻居双向连接并对超限邻居 `#pruneConnections`（:271-311）。`removePoint`（:317）是软删除——断开各层连接、slot 置 null（保留避免 index 移位）、删入口点时 `#findNewEntryPoint` 全扫（:349-368）。`searchKnn`（:391）支持 2-pass：传 `quantizedQuery`+`quantizer` 时先 SQ8 量化距离图遍历粗排，再对候选做 Float32 余弦精排。余弦距离 `1 - cosineSimilarity`（:206）。

**HnswVectorAdapter**（`HnswVectorAdapter.ts:29`）是实现 `VectorStore` 的生产门面，编排 HnswIndex + ScalarQuantizer + BinaryPersistence + AsyncPersistence(WAL)。默认超参 M=16/efConstruct=200/efSearch=100/quantizeThreshold=3000（:75-84）。`init()`（:103）：优先 `BinaryPersistence.load` 反序列化，量化向量 `qvector` 不入盘、启动时经 `setQuantizedVectors` 重建（:129-130）；失败则 `VectorMigration` 从 JSON 旧格式迁移；随后 `#initWal` + `recover()` replay 崩溃前未刷盘操作（:137-165）。`upsert`（:306）有维度一致性守卫——维度不符抛出「embedding 模型被换、请 `alembic embed --clear --force`」（:322-329）；每 500 次 `#maybeTrainQuantizer`（:349）；WAL 启用则 `appendWal` 否则 `#scheduleFlush`。`searchVector`（:470）在量化器已训练且 `size>threshold` 时走 2-pass，`filter` 存在时召回 `topK*3` 再过滤（:481），距离转相似度 `1-dist`（:508）。`#maybeTrainQuantizer`（:818）在 `quantize!=='none'` 且节点数达阈值、且训练向量 ≥100 时训练 SQ8 并批量回填 HNSW 节点。`hybridSearch`（:528，标 `@deprecated`）用 RRF 融合 dense+keyword。

**ScalarQuantizer**（`ScalarQuantizer.ts:15`）SQ8 per-dimension min/max 线性缩放到 Uint8（768d×4B→×1B，75% 内存节省），`train`（:45）统计 min/max 并对零 range 维度设 1e-10 下限防除零（:66-71）。

**AsyncPersistence**（`AsyncPersistence.ts:58`）WAL：写操作先追加 NDJSON+CRC32（`crc32` 纯 JS 查表实现，:33-56），2s 定时或积 100 条后 flush 完整 .asvec 并清 WAL；启动时先加载 .asvec 再 replay，损坏行（CRC 不符）跳过由 .asvec 兜底。**BinaryPersistence** 定义 32 字节头 `ASVEC` magic 的自定义二进制格式（:1-46），含 quantizer/graph/metadata section。

**ASTChunker**（`ASTChunker.ts`）是 blessed core-leaf 消费方——它经动态 `import('../../core/ast/index.js')` + `AstAnalyzer`（:130-134）延迟加载 tree-sitter grammar（避免 import 即初始化 parser），是 infrastructure 里少见的向上/横向依赖 core 的点。`chunkByAST`（:170）按 AST 顶层声明节点（`TOP_LEVEL_TYPES` 覆盖 10 种语言，:40-97）分块，超大节点 `splitLargeNode` 递归拆分（:283）、无子节点 `splitByLines`（:382）兜底，非声明代码合并成 preamble/epilogue；解析失败或无 chunk 返回 `null` 让调用方 fallback（:183-262）。

**SignalBus**（`SignalBus.ts:56`）是同步发布订阅：`emit`（:65）先精确类型匹配再通配符 `*`，每个 handler 用 try/catch 包裹使「消费者异常不阻断分发」（:73-76）；`subscribe`（:101）支持 `guard|search|usage` 管道多类型订阅并返回 unsubscribe。设计公理 <0.1ms/emit。`SignalAggregator`（`SignalAggregator.ts:35`，实现 `Startable`）订阅事实型信号做 5 分钟滑窗统计，`#record`（:88）有 AD5 ring cap（每类型 5000 条上限，溢出丢最旧并计 `droppedSinceFlush`），`#flush`（:103）60s 周期写 metrics 报告、突增 3 倍发 `anomaly` 信号、EMA 更新 baseline，溢出打 `core.diagnostic.signal.window-overflow` 诊断码。`SignalBridge`（`SignalBridge.ts:13`）全量转发 SignalBus→EventBus 实现内核化，`SignalTraceWriter` 订阅 `*` 按类型分 JSONL 落盘并支持 query/stats。

**WriteZone**（`WriteZone.ts:53`）三区（Project/Data/Global）写入门面，所有写操作前经 `#guardWrite`（:198）：Project/Data 走 `pathGuard.assertProjectWriteSafe`、Global 走独立 `#assertGlobalSafe` 白名单（:228）；`rename`（:155）处理跨挂载点 EXDEV 降级为 cp+rm。**Logger**（`Logger.ts:119`）winston 单例，MCP 模式（`ALEMBIC_MCP_MODE=1`）输出 stderr 禁色防污染 stdout JSON-RPC，file transport 分 error/combined/audit 三文件，日志目录越界时降级到 tmpdir。**ReportStore**/**EventBus**/**ConfigLoader**（三级 default→env→local deepMerge + Zod 非阻塞校验，:40-80）分别负责报告、事件历史、配置。

#### 模式与不变量

- 契约-实现分离：`VectorStore` 抽象基类（每方法抛「Not implemented」）+ `HnswVectorAdapter`/`JsonVectorAdapter` 双实现，`matchesVectorMetadataFilter` 是两适配器共享的元数据过滤门（`VectorMetadataFilter.ts:36`）。
- WAL + 二进制快照的崩溃恢复不变量：写先入 WAL、快照兜底、启动 replay。
- 有界缓存 doctrine（AD4/AD5）：PreparedStatementCache 128 上限、SignalAggregator 窗口 5000 上限，均确定性重建、连接/类型域隔离。
- 迁移 gap-tolerant + 加列幂等（011/014/016 先 `PRAGMA table_info` 缺列才 ALTER，对旧行字节兼容）。
- 明确的用户裁定标记：CO3 C7 无重试并发策略、coverage_ledger「只持久化覆盖状态不含计划/会话字段」的 U2 红线（`015:3-11`）。
- deprecated/frozen 标记：`getDrizzle` 全局单例、`HnswVectorAdapter.hybridSearch`。

#### migration 清单与持久化对象

`schema.ts:7-19` 与各 migration 忠实对应，共 22 业务表：001 建 10 表（knowledge_entries 核心知识条目/knowledge_edges 图谱边/guard_violations/audit_logs/sessions/token_usage/semantic_memories 项目语义记忆/bootstrap_snapshots+bootstrap_dim_files 快照/code_entities AST 实体）；004 加 evolution_proposals（M2 Recipe 治理提案）+ `knowledge_entries.staging_deadline`；005 recipe_source_refs（来源引用证据链）；006 lifecycle_transition_events（生命周期转移）；007 收敛 evolution type（7→2：merge/enhance/correction→update，supersede→deprecate，contradiction/reorganize 删除转 RecipeWarning）；008 recipe_warnings；009 `knowledge_entries.dimensionId`；010 source_graph_{generations,files,symbols,edges}（确定性源码图）；011 guard_violations 加 tool/surface 归属列；013 git_diff_checkpoints（git diff 路由检查点，从确认 Plan 初始化而非猜 HEAD^）；014 recipe_source_refs 加 content_fp（内容级保鲜指纹）；015 coverage_ledger + deep_mining_rounds（deepMining 多轮覆盖账本）；016 deep_mining_rounds 加 rescan_id + partial unique index。Task/intent 系统为纯内存+JSONL 不用 DB 表（`schema.ts:21`）。

#### 依赖与消费方

依赖：仅 `shared/`（PathGuard、WorkspaceResolver、DiagnosticCodes、TimerRegistry、LanguageService、concurrency）与 `types/`；外部 npm：better-sqlite3、drizzle-orm、winston、web-tree-sitter（经 core 动态 import）。消费方：`repository/` 全部经 Drizzle/DatabaseConnection 落盘；`service/vector`、`service/search`（SearchEngine/MultiSignalRanker）消费向量适配器；SignalBus 被 `guard.ts`、`events.ts`、`service/search`、`service/knowledge`、`service/evolution`（ProposalExecutor/StagingManager/DecayDetector/LifecycleStateMachine/RedundancyAnalyzer）、`service/guard`（GuardCheckEngine/RuleLearner/FeedbackLoop）广泛消费——证实其「跨 4 仓承重骨架」定位。

#### 注意点/技术债/兼容标记

- SignalBus 是承重骨架，删除会断生命周期晋级/搜索实时排序/source-ref（对应 SPM 删除需求 CG-1=A 保骨架）。
- `getDrizzle` 全局单例待移除、`hybridSearch` 已 deprecated 转 HybridRetriever。
- `OllamaEmbedProvider` 反向 import 了 `service/vector/VectorService` 的 `EmbedProvider` 类型（`OllamaEmbedProvider.ts:8`），是 type-only 桥接（type import 豁免层契约）而非运行时违规。
- `ASTChunker` 动态 import core 是 blessed core-leaf 例外，非普通 blessing。
- HNSW `removePoint` 只软删除留 null slot，长期不 compaction 会累积空洞（注释称 compaction 可在持久化时做，但当前未见实现）。

---

### 4.7 repository/ — 持久化实现与契约

#### 职责与层次

`src/repository/` 是 AlembicCore 第 6 层（layer=`repository`），承载对 SQLite/Drizzle 表以及 `.md` 文件存储的所有 CRUD/查询/聚合/upsert 能力。它是 `service`、`workflows`、`daemon`（经 facade）之上一切业务编排的持久化底座，自身只允许导入 `shared / types / domain / infrastructure` 四层（`config/layer-contract.json:36-41`），不得反向依赖 `service`/`workflows`。共 34 个 `.ts`、约 7.3k 行，最大的三个实现是 `KnowledgeRepositoryImpl`（1234 行）、`SourceGraphRepository`（938 行）、`KnowledgeEdgeRepository`（693 行）。

本层遵循一条贯穿全仓的红线（`CLAUDE.md` 停止卡）：`.md` 文件 = 唯一真相源（Source of Truth），DB = 索引缓存。因此 repository 层不仅是"数据访问对象"，还承担了**写契约（write contract）**的裁定：定义"文件持久化能有哪些动作"，而把"如何序列化/命名/搬移文件"的写策略留给 `service` 层实现（CO2 B4，详见下文）。

对外暴露方式有两条：`package.json` 只把 `./repository`、`./repository/base`、`./repository/bootstrap`、`./repository/code`、`./repository/sync` 显式列入 `exports`（`package.json:153-187`）；更完整的接入是通过根 facade `src/repositories.ts` 命名再导出（`src/repositories.ts:1-292`），把 `*Impl` 类映射为对外稳定别名（`KnowledgeRepository = KnowledgeRepositoryImpl` 等，`repositories.ts:166-179`）。注意 `evolution/index.ts` 只 barrel 了 4 个仓，唯独 `CoverageLedgerRepository` **未进 barrel**，只通过 `repositories.ts:17-23` 直接从文件路径再导出——这是该仓的正式对外通道，不是遗漏。

#### 关键文件与模块

| 文件 | 行 | 角色 |
| --- | --- | --- |
| `base/RepositoryBase.ts` | 61 | Drizzle-first 抽象基类；`transaction()` 包装、`findById/create/delete` 抽象契约、`DrizzleTx` 类型 |
| `knowledge/KnowledgeFileStore.ts` | 55 | **写契约接口**（B4）+ `KnowledgeFileScanner` 接口 |
| `knowledge/KnowledgeRepositoryImpl.ts` | 1234 | `knowledge_entries` 统一仓；CRUD + 分页 + 生命周期/统计/Guard 查询 |
| `knowledge/KnowledgeUnitOfWork.ts` | 210 | 文件优先 + DB 补偿的原子写协调器 |
| `knowledge/KnowledgeEdgeRepository.ts` | 693 | `knowledge_edges` 图谱边仓 + Panorama 域 JOIN 查询 |
| `evolution/ProposalRepository.ts` | 467 | `evolution_proposals`：去重 + 观察窗 + 状态机守卫 |
| `evolution/CoverageLedgerRepository.ts` | 304 | `coverage_ledger`（module×dimension cell）+ `deep_mining_rounds` upsert |
| `evolution/GitDiffCheckpointRepository.ts` / `LifecycleEventRepository.ts` / `WarningRepository.ts` | 177/195/292 | checkpoint upsert / 转移事件 append / 去重告警 |
| `code/CodeEntityRepository.ts` | 490 | `code_entities` upsert/batch + Panorama 查询 |
| `source-graph/SourceGraphRepository.ts` | 938 | 4 表（generations/files/symbols/edges）代际快照 replace |
| `sourceref/RecipeSourceRefRepository.ts` | 272 | Recipe↔源码桥接表（复合主键）+ 保鲜/漂移 |
| `memory/MemoryRepository.ts` | 441 | `semantic_memories`：compact/衰减/相似度 |
| `guard/GuardViolationRepository.ts` | 322 | Guard 运行结果 + 容量限制 |
| `session/SessionRepository.ts` / `token/TokenUsageStore.ts` | 154/234 | 会话 CRUD / token 用量 + 确定性 prune |
| `search/SearchRepoAdapter.ts` / `sync/SyncRepoAdapter.ts` | 222/113 | raw-db 降级适配器（SearchEngine / SyncService 用） |

#### 核心类型与契约

**RepositoryBase**（`base/RepositoryBase.ts:40-61`）是新一代基类：构造器收 `DrizzleDB` + `SQLiteTable`，提供 `protected transaction(fn)` 事务包装，并强制子类实现 `findById/create/delete` 三个抽象方法；它明确"无 `_assertSafeColumn()`——Drizzle 自带列类型约束"（注释 `:8`），以及 `rawQuery` 作为复杂查询逃生舱的定位。`DrizzleTx` 类型用 `Parameters<Parameters<DrizzleDB['transaction']>[0]>[0]` 抽取（`:17`），供 UnitOfWork 与批量事务复用。`SourceGraphRepositoryImpl`、`BootstrapRepositoryImpl`、`CodeEntityRepositoryImpl`、`SessionRepositoryImpl`、`MemoryRepositoryImpl`、`KnowledgeEdgeRepositoryImpl`、`GuardViolationRepositoryImpl` 都 `extends RepositoryBase`；而 `KnowledgeRepositoryImpl`、`ProposalRepository`、`CoverageLedgerRepository`、`WarningRepository`、`LifecycleEventRepository`、`GitDiffCheckpointRepository`、`RecipeSourceRefRepositoryImpl` 则**不继承基类**（多为组合式 `#drizzle` 私有字段），因为它们的键结构（复合主键、无自增 id）或读写模式不契合基类的单主键抽象。

**KnowledgeFileStore**（`knowledge/KnowledgeFileStore.ts:26-38`）是 B4 写契约的核心：`serialize/persist/remove/moveOnLifecycleChange` 四个方法定义"文件持久化能力面"。文件头注释把边界写死（`:12-18`）：repository 层拥有**写契约**（本接口），`service` 层的 `KnowledgeFileWriter` 拥有**写策略**（序列化格式、文件名/目录、生命周期搬移）；方向合法（service→repository 接口依赖），不重复不合并，新增写路径"必须先扩展本接口、再在 service 实现"。同文件还有 `KnowledgeFileScanner`（`:46-55`）扫描/解析接口。`KnowledgeFileWriter` 实现端（`src/service/knowledge/KnowledgeFileWriter.ts:1-26`）反向印证：它 `implements KnowledgeFileStore`，落盘到 `Alembic/{candidates|recipes}/{category}/`，文件名策略 `trigger slug > title slug > id[:8]`，并在头注释重申"不存在第二份文件写实现"。

#### 关键类/函数与实现逻辑

**KnowledgeUnitOfWork**（`knowledge/KnowledgeUnitOfWork.ts`）是本层最具设计密度的类，落实"文件优先 + DB 补偿"事务语义。`registerFileOp/registerDbChange` 收集意图（`:74-81`），`commit()` 分两阶段（`:94-156`）：Phase 1 逐个执行文件操作（`writeFileSync` 同步），任一失败即 `#rollbackFileOps()` 逆序回滚已完成文件（write→remove、delete→persist；move 无法自动回滚只记 warn 等 SyncService，`:178-203`），并抛 `FileWriteError`，DB 完全不触碰得到干净状态；Phase 2 文件全落盘后才开 SQLite 事务提交 `#dbChanges`。若 DB 事务失败（CO3 W2 write-strict），**文件不回滚**（真相源优先），改为记录稳定诊断码 `knowledgeFileDbDivergence`、判定是否 `isSqliteBusyError`、并抛出携带 `reconcileVia: 'KnowledgeSyncService.sync'` 的 `DivergenceError`（`:119-144`）——旧行为是降级 warn + 无人检查的 `dbCommitted=false` 标志，现在强制调用方感知分歧。为何文件优先而非 DB 优先，注释给了完整理由（`:13-19`）：文件成功+DB 失败可从文件重建 DB；反之 DB 有行无文件会被 SyncService 标 deprecated 导致数据丢失。

**KnowledgeRepositoryImpl** 是"全链路 camelCase（DB 列名=实体属性名）"的巨型仓。它同时持有 raw `Database`（复杂动态查询逃生舱）和 `#drizzle`（`:60-72`），迁移策略是 CRUD 与固定形状查询走 Drizzle 类型安全 API，`findWithPagination`/`getStats` 保留 raw SQL 并渐进迁移。`findWithPagination`（`:247-316`）自建 WHERE：`lifecycle` 支持标量/数组 IN；普通过滤先过 `_assertSafeColumn`（`:78-95`，`/^[a-zA-Z_]\w*$/` + 惰性从 `PRAGMA table_info` 建列白名单，双重防 SQL 注入）；`_tagLike`/`_search` 用 `ESCAPE '\\'` 转义 `%_\`。热路径统计与数据查询用 `prepareCached()`（`:299-310`，AD5 预编译语句 LRU 复用）。生命周期驱动方专用写方法 `updateLifecycle`/`updateStats`/`updateReasoning` 直改单列 + `updatedAt`；`findAllByLifecycles(lifecycles, limit?)`（`:415-437`）体现 P1 有界化设计：不传 limit 保持无界全表读取（SQL 字节与历史一致，零影响），传 limit 则追加 `orderBy(asc(createdAt))+limit`（"最旧优先"≈到期顺序，让 StagingManager 跨 tick 排空积压不饿死）。Guard 热路径有一整组 sync 方法：`findActiveGuardRecipes`（rule OR boundary-constraint，`:359-376`）、`findGuardRulesSync`、`incrementGuardHitsSync`（用 `json_set + COALESCE(json_extract)` 原子自增 `stats.guardHits`，`:765-774`）、`getGuardHitsSync`。行↔实体映射集中在 `_rowToEntity`（JSON 列 `safeJsonParse`、INTEGER→boolean，`:1035-1060`）与 `_entityToRow`（`safeJsonStringify` + `inferKind` 兜底，`:1063-1112`）。

**KnowledgeEdgeRepository** 面向 `knowledge_edges`，核心是 `upsertEdge`（`onConflictDoUpdate`，唯一键 `(fromId,fromType,toId,toType,relation)`，`:76-126`）与 `bulkInsertIgnore`（事务内 `onConflictDoNothing`，`:643-669`）。图查询覆盖出入边、按关系过滤、`getHotNodes`（入度 Top，排除 `LanguageProfiles.baseClassExclusions` 基类/框架根，`:287-307`）、`deleteByEntryId`（知识删除时 or(from,to) 清边，`:352-358`）。Panorama 域（Phase 5e）有一组与 `code_entities` 的 `innerJoin`/`exists` 查询：`countEdgesJoinedByEntityFiles`（fan-in/fan-out）、`findEntryPoints`（有 calls 出度无入度）、`findTopDataFlowSources/Sinks`（`having count > threshold`）、`findModuleDependencyPairs`。

**ProposalRepository**（`evolution/`）是最像状态机的仓。`create`（`:155-205`）先 `#hasDuplicate`（同 target+type 已有 pending/observing 则返回 null，`:413-427`），ID 用 `ep-{ts}-{rand}`，`expiresAt` 按 type 默认窗（update 72h/deprecate 7d，`OBSERVATION_WINDOWS:127-130`），初始 status 交 `EvolutionPolicy.resolveInitialStatus`。状态转移方法都带**乐观并发守卫**：`startObserving` 仅 `status='pending'` 才更新、`markExecuted` 仅 `observing`、`markRejected/markExpired` 仅 `IN(pending,observing)`（`:294-361`），靠 WHERE 里的 status 条件防竞态双写。`find` 的 `limit`/`oldestFirst`（`:107-119,258-263`）是 P1/P3 有界化，`oldestFirst=true → asc(proposedAt)` 供 capped checkAndExecute 排空。source 经 `normalizeProposalSource` 写入 host-neutral 值（旧 `ide-agent` 仅读兼容）。

**CoverageLedgerRepository** 与 **GitDiffCheckpointRepository** 共享同一 upsert 骨架：`getCell/upsertCell`（键 `(project_root, module_id, dimension_id)`，`:93-166`）用 `onConflictDoUpdate` 复用一份 `mutable` 集合但更新时不重写 `createdAt`，upsert 后立即回读校验、未持久化则抛错。`deep_mining_rounds` 的 upsert 更复杂：优先按 `rescanId` 命中，回落 `roundIndex`，逐字段 `input ?? existing ?? default` 合并（`:207-251`）。红线注释明确本仓只持久化"覆盖状态"，不含计划/会话字段（`:8`）。

**SourceGraphRepository** 管四张表的代际快照。`replaceGeneration`（`:153-223`）先 `createGeneration`，再**删净该 generation 的 edges→symbols→files**，然后逐条 upsert 新数据，最后 `refreshGenerationStats`——即"整代替换"语义。`getLatestSnapshot` 按 `indexedAt`/`startedAt` 降序取最新（`:235-247`），`completeGeneration` 用 domain 工厂 `createSourceGraphSnapshot` 合并 freshness 状态。

**MemoryRepository** 的 `compact()`（`:271-324`）在单事务内做三档衰减：删过期（`expiresAt < now`）、自然遗忘（90 天未访问 + importance<7）、衰减（30 天未访问 + importance<3，`importance=MAX(1,importance-1)`），返回各计数。`enforceCapacity` 超限时按 `importance ASC, accessCount ASC, updatedAt ASC` 淘汰最不重要的（`:327-347`）。`static computeSimilarity`（`:393-407`）用 Jaccard + 子串包含 0.3 加成的确定性相似度。

**TokenUsageStore** 体现"Headless Core 禁止概率控制流"的不变量：把旧的"每写 1% 随机 prune"改成确定性 `PRUNE_EVERY_N_WRITES=100`（每第 N 次成功插入触发，`:20-27`），并由单测钉死节奏。

#### 模式与不变量

- **契约 vs 实现分离（B4）**：`KnowledgeFileStore` 接口在 repository、`KnowledgeFileWriter` 策略在 service，方向 service→repository 合法，杜绝第二份文件写实现。同理 `SyncRepo`/`SearchKnowledgeRepo`/`GuardKnowledgeRepo` 接口 + `RawDb*Adapter` 降级实现（`search/`、`sync/`）。
- **Unit of Work + 文件优先补偿**：写路径的原子性由 `KnowledgeUnitOfWork` 统一，失败模式分级为 `FileWriteError`（干净）与 `DivergenceError`（分歧，走 sync 重建），CO3 W2 write-strict 禁止静默降级。
- **Upsert + onConflictDoUpdate/DoNothing**：edges/code_entities/coverage/checkpoint/source-refs 全用冲突更新语义，复合唯一键决定幂等；`RecipeSourceRefRepository.upsert` 的 `contentFp` 仅在显式提供时更新（`undefined` 保留旧指纹，`:126-137`）。
- **状态机乐观守卫**：Proposal 转移用 WHERE status 条件保证转移合法且防并发双写。
- **确定性优先**：无界/有界分支保持"未传参字节一致"（`findAllByLifecycles`/`ProposalFilter.limit`），prune 用固定节奏而非随机。
- **SQL 注入防护 + 逃生舱**：`_assertSafeColumn` 双检 + `ESCAPE`；raw SQL 仅限 `lib/repository/` 白名单目录（`SearchRepoAdapter.ts:6` 注释）。
- **AD5 预编译缓存**：热路径分页/搜索走 `prepareCached` LRU。

#### 依赖与消费方

上游依赖：`infrastructure/database/drizzle`（schema、`getDrizzle`、`DrizzleDB`、`PreparedStatementCache`、`DatabaseConnection.isSqliteBusyError`）、`infrastructure/logging`、`domain/*`（`KnowledgeEntry`、`EvolutionPolicy`、`source-graph` 工厂）、`shared/*`（`errors` 的 `DivergenceError/PersistenceError`、`DiagnosticCodes`、`sourceContracts`、`LanguageProfiles`、`utils/common` 的 `safeJson*`/`unixNow`）。

下游消费方（均在 service/workflows，经 `repositories.ts` facade）：Guard（`GuardCheckEngine._loadCustomRules/_recordHits`）消费 `findGuardRulesSync/incrementGuardHitsSync`；`SearchEngine` 消费 `findNonDeprecatedSync/keywordSearchSync/...` 及 raw 适配器；`KnowledgeSyncService` 消费 `RawDbSyncAdapter` 与 `KnowledgeUnitOfWork`；`RecipeLifecycleSupervisor`/`ProposalExecutor`/`StagingManager` 消费 lifecycle/proposal/coverage 仓；`SourceRefReconciler` 消费 `RecipeSourceRefRepository`；`CoverageLedgerAdvisor/Builder/Write`（`workflows/capabilities/coverage/`）消费 `CoverageLedgerRepository`；Panorama 域消费 edge/code JOIN 查询。

#### 注意点/技术债/兼容标记

- `LegacyProposalType`（`ProposalRepository.ts:54-61`）标 `@deprecated`，仅剩类型层引用无运行时消费，移除条件绑定迁移链 004+ 与 SD-5 phase-2。
- `evolution/index.ts` 只导 4 仓、缺 `CoverageLedgerRepository`：这是有意的，正式通道是 `repositories.ts` 直引路径导出；改 barrel 前需确认 facade 才是对外契约。
- `RecipeSourceRefRepository.getStaleCountsByRecipe`（`:192-224`）注释记录了 CO4 缺陷修复：旧关联子查询把外表名解析到别名 r2 导致 `totalCount` 报全表行数，现改两条分组查询回避关联作用域歧义（回归测试 `RecipeSourceRefRepositoryFloor.test.ts`）。
- `RepositoryBase` 头注释提到"旧 `BaseRepository`"已退役但 `KnowledgeRepositoryImpl._assertSafeColumn` 是从它复制过来的（`:75`），属迁移期残留的手写列校验，与基类"Drizzle 自带约束"的定位并存。
- `KnowledgeUnitOfWork` 的 move 操作无法自动回滚（`:188-192`），依赖 SyncService 修复，是已知的补偿局限。
- raw SQL 在 `SearchRepoAdapter`/`SyncRepoAdapter`/`KnowledgeRepositoryImpl.getStats`/`findWithPagination` 存在，属 lint 白名单授权的逃生舱，非债务，但迁移策略注释均标注"渐进迁移"待收口。

---

### 4.8 service/project-context — Project Intelligence / ProjectContext 服务

#### 职责与层次

`src/service/project-context` 是 Core 中最大的单一 service 子目录（67 个文件、约 11.7k 行），承担「把磁盘上的真实源码事实、原生 ProjectScope 配置，确定性地投影成一组可导航、可预算化、可脱敏的 ProjectContext 结构」这一职责。它是纯 headless 内核能力：不实现宿主 Agent、不做 AI 调用、不落库，输入是 `ProjectContextRequest` + 真实文件系统，输出是 `ProjectContextEnvelope<ProjectContextResult>`。

按 10 层契约它属 `service`，允许 import `shared,types,domain,core*,infrastructure,repository`。实测它主要依赖：`domain/project-context`（全部 DTO 契约）、`shared/ProjectScope`（原生空间配置）、`shared/LanguageProfiles`/`LanguageService`、`shared/contentHash`，以及 blessed core-leaf —— `core/discovery`（`getDiscovererRegistry`）与 `core/AstAnalyzer`（tree-sitter 分析）。它不依赖 `repository`（不落库，只读文件系统），这与「确定性投影」定位一致。

整个子系统由三块组成：(1) **查询阶梯**（9 个 handler，从 `source-slice` 到 `space` 的分层投影）；(2) **interface 管道**（canonicalize→dispatch→envelope 的 request/response 编排）；(3) **两个上层能力引擎** `architectureIntelligence` 与 `dimensionPlanning`（消费聚合后的 ProjectContext 事实，产出架构画像与规划信号）。

#### 关键文件与模块

| 文件 | 锚点 | 作用 |
|---|---|---|
| `ProjectContextService.ts` | :19、:31、:43 | handler 注册表 `PROJECT_CONTEXT_DEFAULT_HANDLERS`（9 kind）+ facade 类 + 单例 `ProjectContext` |
| `interface/projectContext.ts` | :11 | `createProjectContext` 组装 canonicalize→dispatch→envelope 管道 |
| `interface/request.ts` | :33、:82、:188 | 请求归一化、scope 收束、`normalizeContainedPath` 越界校验 |
| `interface/dispatch.ts` | :12、:24 | 按 kind 路由到 handler；缺失时返 `query-unavailable` |
| `interface/response.ts` / `projection.ts` / `pruning.ts` / `redaction.ts` | :23、:4、:12、:3 | 信封构造、compact 投影、ref 排序截断（默认 50）、敏感字段脱敏 |
| `space/space.ts` | :85、:213、:276 | 空间级：加载原生 ProjectScope，构造 repos/boundaries/projectTree |
| `repo/repo.ts` | :528、:493、:940 | 仓库级：core discoverer 选择、manifest/config/entrypoint/command 探测 |
| `map/map.ts` | :37、:515、:401 | 项目图：模块聚合、Tarjan SCC 环检测、分层推断、hotspot |
| `module/module.ts` / `moduleLayers/moduleLayers.ts` | :19、:39 | 模块级 owned files→symbols/flows；模块内文件分组与边界穿越 |
| `fileFlow/extract.ts` / `fileSymbols/extract.ts` | :39、—  | 经 `core/AstAnalyzer` 抽取 import/export/callSite/symbol |
| `sourceSlice/fileAccess.ts` | :11 | 唯一真实读文件入口，realpath 越界防护 + contentHash |
| `architectureIntelligence/architectureIntelligence.ts` | :234、:303、:476 | 领域信号/架构风格/复杂度三分类器 |
| `dimensionPlanning/dimensionPlanning.ts` | :33、:156、:211 | 模块 delta、per-module 覆盖、动态规划信号聚合 |
| `shared/index.ts` | :1 | 相邻对（adjacent-pair）共享契约的 7 个目录索引 |

#### 核心类型与契约

契约都定义在 `domain/project-context`（本目录只做实现）。请求维度 `ProjectContextRequestKind` 有 9 个值（`ProjectContextContracts.ts:10`）：`anchor-range | space | repo | map | module | module-layers | file-flow | file-symbols | source-slice`，其中 `ProjectContextLevel` 排除 `anchor-range`。`ProjectContextResult`（`ProjectContextMap.ts:313`）是这 9 类上下文加 `ProjectContextUnavailableData` 的联合类型；每个结果都带 `nextRefs: ProjectContextRef[]`，形成可继续下钻的导航图。错误码 `ProjectContextQueryErrorCode` 统一为 `invalid-scope/outside-scope/project-root-conflict/query-unavailable/not-found/ambiguous/redacted/too-large` 等（:26），错误分 `error`/`warning` 且带 `retryable`。信封 `ProjectContextEnvelope` 固定 `contractVersion: 1`（:8）。

interface 层内部契约在 `interface/contracts.ts`：`ProjectContextHandler` 接收 `CanonicalProjectContextRequest`（已收束的 `project` + `scope`），返回 `{ data, refs?, errors? }`；`PROJECT_CONTEXT_INTERFACE_ALLOWED_OPERATIONS`（:11）把管道拆成 11 个白名单操作（validation/canonicalization/dispatch/pruning/redaction/ref-selection…），是一种可审计的操作分类。

`shared/ProjectScope.ts` 是空间事实的权威来源：`ProjectDescriptor`（:66）描述一个 project-scope（controlRoot + folders + dataRoot，storage 恒为 `ghost`），`readProjectScopeRegistryDocument`（:665）从 `~/.asd` 下 `project-scopes.json` 读注册表，`loadProjectScopeForFolder`（:697）按 folder 路径反查所属 scope。一个硬不变量在 `assertFolderCanEnterScope`（:751）：**controlRoot 不能作为 folder**，避免把整个 workspace 当扫描源——这正是 memory 里记录的 alembic-plan-space-membership 修复的落点。

#### 关键类/函数与实现逻辑

**管道编排（interface）**：`createProjectContext.execute`（`interface/projectContext.ts:15`）三步——`canonicalizeProjectContextRequest` 归一 → `dispatchProjectContextRequest` 路由 → `createProjectContextEnvelope` 封装；任何 `ProjectContextRequestError` 被捕获后降级成带 `errors` 的 unavailable 信封而不抛出（:26-41）。`canonicalizeProjectContextRequest`（`request.ts:33`）做三件严格的事：kind 白名单校验、`project.projectRoot` 与 `scope.projectRoot` 一致性检查（不一致抛 `project-root-conflict`，:92-107）、payload 递归 JSON 规范化（`canonicalizeJson` 对对象 key 排序，:57，保证确定性）。`normalizeContainedPath`（:188）用 `path.relative` 判断 `activeFile/sourceFolder` 是否逃逸 projectRoot，逃逸即 `outside-scope`。响应侧 `projection`→`redaction` 用正则 `(?:api[_-]?key|password|secret|token)` 递归把敏感 key 替换成 `[redacted]`（`redaction.ts:1`），`pruning` 把 refs 稳定排序后截断到 50（`pruning.ts:3`）。

**查询阶梯的自下而上组合**：这是本子系统最核心的模式。底层 `sourceSlice/fileAccess.loadSourceSliceFile`（:11）是唯一真正 `fs.readFile` 的地方，做 realpath 越界防护、`computeContentHash`、按扩展名 `inferLanguage`。`fileFlow`/`fileSymbols` 的 handler 拿到文本后交给 `extract.ts`：`extractFileFlowFromSource`（`fileFlow/extract.ts:39`）经 blessed core-leaf `analyzeFile(text, lang, {extractCallSites:true})` 抽 import/export/callSite，若 `isAstAvailable()` 为假或解析异常则**优雅降级**返回空结果 + `unavailableReason`（:47-90），从不抛错。往上，`module` handler（`module/module.ts:19`）对 seed 的每个 owned file 调用 fileFlow+fileSymbols，再据 export 关系推导 `publicSurfaces`（`createPublicSurfaces` 用 exportedRefIds/exportedNames 交叉匹配，:130）；`moduleLayers` 把文件分组、分类模块内/边界穿越关系；`map` handler（`map/map.ts:37`）对每个 moduleSeed 递归调 `module`+`module-layers`，再做全局分析：`detectCycleComponents`（:515）是完整的 **Tarjan 强连通分量**算法检测依赖环，`createGlobalLayers`（:344）优先用声明层（`configLayer`）分层、否则退到 `groupModulesByDependencyDepth`（:401，迭代松弛求依赖深度），`createHotspots`（:589）用 `fanIn*2+fanOut+relationCount+externalFanOut` 打分排序。`space` handler（`space/space.ts:85`）在最顶层：若 payload 无显式 folders 就 `loadProjectScopeForSpaceRoot`（:276）加载原生 scope，否则读显式 folder；对每个 folder 做 realpath 校验（missing/outsideSpace 各出对应错误码），构造 projectTree 采样（默认 80 节点，超限出 `query-unavailable` 截断警告）、structuralHotspots（按顶层子目录数打分）与 activeRepo 选择的多级回退链（currentFolder→activeFile→requestedSourceFolder→scope.currentFolder→firstAvailable，:383-432）。

**repo handler 的发现集成**：`repo/repo.ts` 用 blessed core-leaf `getDiscovererRegistry`。`collectDiscoveryFacts`（:528）先 `analyzeConflict` 判断多发现器冲突（`ambiguous` 直接短路返错），再 `detect` 选定发现器、`load` 加载、逐 target 收集源文件，超 `DEFAULT_MAX_FILES=2000` 即截断并出警告；manifest 探测（`readRepoManifestFacts`，:493）用 `CONFIG_FILE_KINDS` 表（:58，biome/gradle/cargo/package.json/Package.swift…）识别配置，进而推 packageSystems/buildSystems/entrypoints/commands。所有 fs 错误都归类成 retryable 与否的 `query-unavailable`，绝不中断。

**两个能力引擎**：`architectureIntelligence`（:566 `analyzeArchitectureIntelligence`）把 ProjectContext 信封列表经 `buildProjectContextPresenterInput` 归一为 presenter，再跑三个分类器：`DomainSignalDetector`（:234，从 import/symbol/config/manifest/graph 五路收证据，按加权 score≥0.35 判 9 个 `ArchitectureDomain` 存在）、`ArchitectureStyleClassifier`（:303，据 entrypoint/密度/环/部署配置判 monolith/layered/microservices/event-driven/cli/library/plugin/frontend/backend）、`ComplexityAnalyzer`（:476，`loc/180 + files*0.35 + fanIn*0.7 + fanOut*0.55 + cycle*2 + hotspot/20` 综合复杂度并分级 severity）。注意 `ProjectInformationSupplementAnalyzer.analyze`（:292）已退化为只返 `{panoramaServiceFree:true}`——这是 Panorama 服务退场后遗留的空壳标记，与全局词汇表「Panorama 退场」一致。`dimensionPlanning`（:33 `aggregateDynamicPlanningSignals`）把 proposals/decay/coverage/moduleDelta/hotspot 汇成排序后的 `planSignals`，全部返回 `Object.freeze` 的不可变结构；`detectModuleDelta`（:156）用文件集合 + `fingerprint` 算 added/changed/removed，并用 Levenshtein（`levenshtein`，:369）+ 文件 Jaccard 算 rename 候选（阈值 0.9）；`queryPerModuleCoverage`（:211）按每模块每维度目标数（默认 2）判 covered/weak/missing。

#### 模式与不变量

- **分层查询阶梯 + 自组合**：9 个 kind 严格自下而上（sourceSlice→fileSymbols/fileFlow→moduleLayers→module→map→repo→space），上层 handler 通过直接调用下层 handler 复用事实，`shared/` 的 7 个 adjacent-pair 目录（`shared/index.ts:1`）承载相邻两级的共享 ref/契约构造。
- **确定性投影**：JSON key 排序、refs 与 errors 全部稳定排序 + dedup、contentHash 固定，保证同一磁盘状态多次执行结果字节一致（下游 parity 依赖此点）。
- **预算/截断**：ref 默认截断 50、projectTree 默认 80 节点、repo 源文件默认 2000、hotspot 8，超限均出 `query-unavailable` warning 而非静默丢弃。
- **只读、无副作用、绝不抛出到边界**：所有 IO 失败被归类成结构化 `ProjectContextQueryError`，管道顶层 try/catch 兜底成 unavailable 信封；`source-slice` 是唯一读盘点。
- **越界与身份防护**：三处独立的 `..`/realpath 越界检查（request、space、fileAccess），projectRoot 冲突显式报错，ProjectScope controlRoot 禁入 folder。
- **契约-实现分离**：本目录零 DTO 定义，全部 `import type` 自 `domain/project-context`；capability 引擎输出用 `Object.freeze` 固化。

#### 依赖与消费方

对外公共入口有两个 package 子路径（`package.json:57`、`:61`）：`@alembic/core/project-context`（`src/project-context.ts` 导出 `ProjectContext` 单例 + 全部只读类型）与 `@alembic/core/project-context-capabilities`（`src/project-context-capabilities.ts` 导出 `ProjectContextCapabilities` —— 一个把 `execute` 包装成 `executeSpaceQuery/executeRepoQuery/...` 便捷方法并挂上 `analyzeArchitectureIntelligence`/`aggregateDynamicPlanningSignals` 的 frozen facade）。

主消费方是 `service/planFacts/collect-project-context.ts`（`collectPlanProjectContext`，:52）：这正是 `alembic_plan` 冷启动前置组件。它 `resolvePlanProjectScopeContext` 加载原生 ProjectScope 定 scanBase/sourceFolders，然后按顺序驱动 `space`（含 projectTree）→`repo`（含 mapSummary）→从 repo 抽 moduleSeeds→`map`→逐 seed `module`+`module-layers`，把所有 envelopes 交给 `buildProjectContextPresenterInput` 归一，推 primaryLanguage/frameworks/projectType/moduleCount，并算 `understandingGaps` 决定 `contextStatus: partial|complete`（:135）。此外 `workflows/capabilities/host-agent/*`（AnalysisPacketBuilder、MissionBriefingBuilder、analysis-packet 的 ProjectContextNormalize/Scoring）与 `service/recipe-context/RecipeContextService.ts`、`service/planFacts/project-info-tree.ts`、`workflows/.../planning/dimensions/BaseDimensions.ts` 也是消费方——即宿主 Agent 的 recipe_map/graph/plan 三条链共同的结构化事实来源。

#### 注意点/技术债/兼容标记

1. **`ProjectInformationSupplementAnalyzer` 是空壳**（`architectureIntelligence.ts:292`）：`panoramaServiceFree:true` 是 Panorama 退场的兼容遗留，仍被 `ArchitectureStyleClassifier`/`ComplexityAnalyzer` 作可选入参传递但从不产生实质补充信息，属可清理债。
2. **dispatch 缺失兜底文案带 PCQ 措辞**（`dispatch.ts:29`）：unavailable 消息写「declared by PCQ-0 but belongs to a later PCQ phase」，实际 9 个 handler 均已注册，此文案只在 handler 缺失（理论不发生）时触发，是历史分期措辞残留。
3. **repo/space 双路径读 ProjectScope**：`space` 走 `loadProjectScopeForSpaceRoot`（folder 匹配 + controlRoot 回退），`repo` 有独立的 `loadProjectScopeForControlRoot`（:484），两处逻辑相近但未统一，是重复面。
4. **无 repository 依赖是刻意的**：ProjectContext 是即时磁盘投影而非持久快照，与 `Session/Snapshot` 词汇正交；MCP instructions 也明确「matrix/graph facts are orientation evidence，raw source reads still prove current behavior」，即本子系统输出是导航证据不是验收依据。
5. **AST 降级静默但有 reason**：`extract.ts` 在 tree-sitter 不可用/失败时返空 + `unavailableReason`，会冒泡成 file-flow/file-symbols 的 `query-unavailable` warning——上层 map/module 事实随之变薄，`collectPlanProjectContext` 的 understandingGaps 会捕获这种「有语言文件但无 symbol/flow」的部分性（:328、:338）。

---

### 4.9 service/knowledge + service/evolution — 知识生命周期与进化自动化

#### 职责与层次

这两个 service 子目录共同构成 Alembic 的"知识全生命周期"引擎：`service/knowledge`（12 文件 / ~6.9k）负责知识条目的生产、写盘、图谱、来源引用与新鲜度；`service/evolution`（13 文件 / ~4.7k）负责六态生命周期状态机、暂存晋级、衰退检测、提案生成与执行、内容打补丁。二者都严格落在 10 层契约的 `service` 层：可导入 `shared/types/domain/core*/infrastructure/repository`，业务编排与规则在此，但持久化写契约留在 `repository`，判定纯函数留在 `domain`。

核心词汇统一为 `KnowledgeEntry`：Candidate（未发布，`candidates/` 目录，lifecycle=pending/staging）与 Recipe（已发布，`recipes/` 目录，lifecycle=active/deprecated 等）是同一实体，仅由 `lifecycle` 字段区分（`Lifecycle.ts:12-25`）。六态与其合法转移由 `domain/knowledge/Lifecycle.ts:76` 的 `VALID_TRANSITIONS` 表驱动，`isValidTransition` 是全局唯一裁定入口。

#### 关键文件与模块

| 文件 | 锚点 | 角色 |
| --- | --- | --- |
| `KnowledgeService.ts` | :106 | CRUD + 生命周期转换编排门面 |
| `RecipeProductionGateway.ts` | :340 | Recipe 生产统一 6 步管道 |
| `KnowledgeFileWriter.ts` | :81 | 唯一 .md 写策略（实现 `KnowledgeFileStore`） |
| `ConfidenceRouter.ts` | :76 | 新条目 6 阶段置信度路由 |
| `KnowledgeSyncService.ts` | :112 | .md → SQLite 增量回灌 + contentHash 违规检测 |
| `SourceRefReconciler.ts` | :90 | 来源引用健康（active/renamed/stale）+ git rename 修复 |
| `KnowledgeGraphService.ts` / `CodeEntityGraph.ts` | :27 / :214 | knowledge_edges 关系图谱与代码实体图谱 |
| `LifecycleStateMachine.ts` | :110 | 六态转移唯一权威 + 超时回收 + 健康快照 |
| `StagingManager.ts` | :111 | staging grace-period 自动晋级 |
| `DecayDetector.ts` | :133 | 衰退检测 5 策略 + 4 维 decayScore |
| `EvolutionGateway.ts` | :82 | 进化决策统一入口（update/deprecate/valid） |
| `ProposalExecutor.ts` | :61 | 信号驱动提案执行引擎 |
| `ContentPatcher.ts` | :88 | Proposal suggestedChanges → StructuredPatch 应用 |
| `ConsolidationAdvisor.ts` / `RedundancyAnalyzer.ts` | :126 / :59 | 提交前融合建议 / 多维冗余检测 |
| `EnhancementSuggester.ts` / `RecipeImpactPlanner.ts` | :41 / :103 | 使用数据反推增强 / rescan 批量进化候选 |

#### 核心类型与契约

`KnowledgeEntry` 是全链路载体，wire-format JSON 双向可序列化，生命周期方法（publish/deprecate/stage/evolve/decay/restore）内置转移合法性检查。`RouteResult`（`ConfidenceRouter.ts:18`）携带 `action` 与目标态 `staging|pending|deprecated` 及 `gracePeriod`。进化侧核心契约在 `types/evolution.ts`：`TransitionRequest/TransitionResult/TransitionEvent`、`StructuredPatch/PatchChange/ContentPatchResult`；`EvolutionAction = 'update'|'deprecate'|'valid'`（`EvolutionGateway.ts:28`）；`ProposalRecord` 状态机为 pending→observing→executed/rejected/expired。判定门禁全部是 `domain/evolution/EvolutionPolicy` 静态纯函数：`evaluateUpdate/evaluateMerge/evaluateDeprecate/shouldExpirePending/shouldImmediateExecute`（`EvolutionPolicy.ts:91-189`），service 层只编排不判定。

#### 关键类/函数与实现逻辑

**生产管道（RecipeProductionGateway.create，:340）** 是所有来源（Agent/MCP/Host-Agent/Batch-import）的唯一入口，6 步：①`UnifiedValidator` schema 校验（失败入 rejected）；②Bootstrap 会话级内存去重（`bootstrapDedup.findDuplicate`，冷启动跨维度）；③相似度检测（`findSimilarRecipes`，普通通道不可跳过，仅 batch-import 可显式跳）；④`ConsolidationAdvisor.analyzeBatch` 融合扫描——advice=create 才放行，merge/reorganize/insufficient 转为经 `EvolutionGateway` 创建 update 提案（:988 `#createProposalFromAdvice`），批内重叠 ≥0.65 移除较弱方；⑤`KnowledgeService.create`（内含 ConfidenceRouter 路由）；⑥`updateQuality` best-effort 评分与 supersede 提案。`#deriveModuleName`（:306）体现"不猜"约束：显式 moduleName 须属注入的 canonical 模块轴否则留空+诊断，未显式则从 sourceRefs 落点派生。

**ConfidenceRouter.route（:76）** 6 阶段：内容不完整→pending；confidence<0.2→reject(→deprecated)；内容过短→pending；缺 reasoning→pending；质量分<0.3 即使置信度够也降 pending；否则 auto_approve→目标态 staging + 分级 grace（≥0.90→24h，0.85-0.89→72h）。可信来源（bootstrap/cursor-scan/mcp/host-agent）用更松阈值 0.7。注意它只标记 `autoApprovable` 并把条目送入 staging，真正 staging→active 的晋级由 StagingManager 到期执行。

**KnowledgeService（:106）** 是 file-first 编排门面：create 时先 `_fileWriter.persist()` 落 .md（设置 sourceFile）再 `repository.create()`；update 用白名单字段，且 CO3 W3 硬拒生命周期字段旁路（`update()` 传入 lifecycle/publishedAt 等直接抛 ValidationError，:297-315），强制走 publish/stage/evolve 等方法。`_lifecycleTransition`（:838）统一编排：委托实体做转移、盖操作人戳、file-first `moveOnLifecycleChange`（candidates↔recipes 目录搬移）再更新 DB，最后发 `lifecycle:transition` 事件。删除时手动清 edges、evolution_proposals（无 CASCADE）、反向 relations。`updateQuality`（:756）接入 P0/C7 接地 port：注入 `groundedSourcePaths` 时重算与门禁字节同源的真接地集喂 QualityScorer 的 depthCoverage；未注入退化为 0（additive）。deprecated 别名 submit/approve/reject/toDraft/fastTrack 保留兼容。

**KnowledgeFileWriter（:81）** 是唯一 .md 写实现，文件头 CO2 B4（:20-25）明确其为 service 层写策略、写契约归 `KnowledgeFileStore`。serialize 把标量字段/简单数组/`_` 前缀 JSON 值对象拼成 YAML frontmatter + body，并计算 16 字符 SHA-256 `_contentHash`（先占位后回填，`computeKnowledgeHash`:490）。落盘目录由 `isCandidate()` 决定 candidates/ 或 recipes/，文件名 slug 优先级 trigger>title>id[:8]。安全关键点：`_cleanupOldFile`（:409）只删知识目录内的普通文件——防 AI 把 sourceFile 误设为项目源文件（如 .xcdatamodeld）而误删。可选 `WriteZone` 沙箱化写入（护真 ~/.asd）。`parseKnowledgeMarkdown`（:503）反向解析，支持多行 JSON 拼接。

**KnowledgeSyncService.sync（:112）** 实现文件=真相源回灌：扫 candidates/recipes 两目录，逐文件重算 hash 与 frontmatter 存储 hash 比对，不一致且非 force 即计入 `violations` 并写 audit_logs（`isManualEdit`，:158-171）；DB 有而 .md 缺的为 orphan。CO3 W1 write-strict：PersistenceError 上抛，仅 per-file 读/解析错误容错跳过。

**LifecycleStateMachine.transition（:110）** 是六态唯一权威，7 步：读当前态→`isValidTransition` Guard（拒绝即 `{success:false}`，调用方不得 fallback）→Exit Action（active 退出记 lastActiveAt）→`updateLifecycle`→Entry Action（写 stagingEnteredAt/evolvingStartedAt/decayStartedAt/activeSince 等元数据，进 active 清进化痕迹）→`#recordEvent` 不可变审计→`#emitSignal('lifecycle')`。`checkTimeouts`（:174）按 `TIMEOUT_MS`（evolving 7d→active、decaying 30d→deprecated、pending 30d→deprecated）回收；staging 因不在 `TIMEOUT_TARGET` 而天然不被触碰（与 StagingManager 互斥，必须保持）。P2 有界化用跨状态共享 `remaining` 预算 + 最旧优先 LIMIT，cap 缺省时透传 undefined 保持无界字节一致。`getHealth` 输出状态分布、卡死统计、近期转移与 proposal 指标。

**StagingManager.checkAndPromote（:111）** 遍历 staging 条目：deadline=0 或未到或非 autoApprovable→waiting；到期且 autoApprovable→`#promote` 经状态机 `grace-period-expire` 转 active 并回填 publishedAt。P1 有界化同样 cap + 最旧优先。

**DecayDetector（:133）** scanAll 加载 active recipe，对每条 evaluate：策略 1（>90d 无 hit）、策略 2（FP 率>0.4 且触发≥10）、策略 3（source_ref stale，来自 SourceRefReconciler）、策略 4（有 deprecated_by 边=被取代）。decayScore = freshness(0.3)+usage(0.3)+quality(0.2)+authority(0.2)，分段成 healthy/watch/decaying/severe/dead。U4：注入 lifecycleStateMachine 后 decaying/severe/dead 直接驱动 active→decaying（B1：不依赖信号订阅，因 decay 无预建 observing proposal 会落空），decaying→deprecated 仍交 checkTimeouts 30d。冷启动 grace（CG-4，:341）：缺 lastHitAt 回落 createdAt 作新鲜度锚点，避免新 recipe 首 tick 被误判 dead。authority 量纲修正（:357-361）：/5 归一（源自 KnowledgeService 写入 `authority=round(score*5)`），修旧 /100 掩盖衰减 bug。

**EvolutionGateway.submit（:82）→ ProposalExecutor** 构成信号驱动闭环。Gateway 三分支：valid→更新 lastVerifiedAt 并拒绝已有提案；update→创建 `expiresAt=0` 的信号驱动 Proposal（dedup 命中则尝试用更富的 suggestedChanges evidence 升级已有提案，:227）；deprecate→高置信+可信源（`shouldImmediateExecute`）立即经状态机废弃，否则/Guard 拒绝则降级建 Proposal。ProposalExecutor 订阅 `guard|search|decay|quality|usage|lifecycle` 信号（:100），信号到达时对目标 recipe 的 observing 提案按 `#gateUpdate` 分流：consolidation 走 evaluateMerge（不要求 hasUsage、保 FP 护栏），其余走 evaluateUpdate。执行 update 时 evolving→`ContentPatcher.applyProposal`→有真补丁则 staging 否则 active；merge 空补丁 U5 #4 退伪成功改为 markRejected。deprecate 臂含 §9.1：source_modified + direct/pattern 信号视为恢复证据直接拒绝废弃。`#inFlight` 集合（:76,343）是 F-A re-entrancy 守卫，防提案自身触发的 lifecycle 信号二次进入造成 evolving→evolving invalid 误判。`checkAndExecute`（:289）是启动/CLI 兜底，P3-Core-2 让 observing+pending GC 共享单一 cap 预算、最旧优先排空。

**ContentPatcher.applyProposal（:88）** 从 evidence 提取 `suggestedChanges`→仅接受合法 `StructuredPatch` JSON（U5 #5 退役了"纯文本≥20 全量替换 markdown"的破坏式降级，非结构化一律 null 跳过、字节不变）→before 快照→按 `PATCHABLE_FIELDS` 白名单（coreCode/doClause/dontClause/whenClause/content.markdown/content.rationale/sourceRefs/headers）应用 replace/append/replace-section/replace-item→持久化并同步 recipe_source_refs→after 快照。append 做去重与段落边界保护。

#### 模式与不变量

- **唯一权威状态机**：lifecycle 只能经 LifecycleStateMachine.transition 变更；KnowledgeService `update()` 硬拒生命周期字段旁路。
- **契约-实现分离 + file-first**：KnowledgeFileWriter 是写策略，KnowledgeFileStore 是写契约；.md=真相源，DB=索引缓存，contentHash 检测手改。
- **纯函数门禁下沉 domain**：service 不写判定阈值，全部 EvolutionPolicy；cap 只限"扫描/处理多少条"，绝不改判定。
- **信号驱动 + daemon-less**：Proposal expiresAt=0，tick-on-access sweep；所有周期任务 total-budget cap 有界化 + 最旧优先排空、cap 缺省字节兼容无界。
- **Core headless/fs-free**：afterPublish、groundedSourcePaths、findSimilarRecipes、consolidationAdvisor、embeddingSimProvider、resolveModuleFromSourceRefs 全由宿主注入 port，缺省安全退化。
- **降级容忍非阻塞**：edges/事件表缺失、审计失败、auto-discover relations、向量刷新均 try/catch 静默，不阻塞主流程。

#### 依赖与消费方

上游依赖 domain（KnowledgeEntry/Lifecycle/EvolutionPolicy/RecipeSimilarity/UnifiedValidator）、repository（Knowledge/Proposal/LifecycleEvent/SourceRef/Edge/GitDiffCheckpoint）、infrastructure（SignalBus/Logger/WriteZone）、service/quality（QualityScorer）、service/vector（经 RecipeFreshnessService）。下游消费方：AlembicPlugin 宿主（注入 port + 驱动 sweep）、AlembicAgent in-process 主体、workflows 层（KnowledgeRescanWorkflow / dimension-completion 覆盖回写 hook）、daemon（DaemonJobRunner tick）、Dashboard（健康快照 + 手动 executeOne）。

#### 注意点 / 技术债 / 兼容标记

1. **staging 与 checkTimeouts 必须互斥**：staging 不在 TIMEOUT_TARGET，晋级只由 StagingManager 负责；改动 TIMEOUT_MS 时勿把 staging 纳入回收（`LifecycleStateMachine.ts:183`）。
2. **DecayDetector 记忆中残留 F-B**：decayScore→deprecate 量纲问题历史上被标为 Design followup（authority /5 修正已 land，但 F-B decayScore 不可 seed→deprecate 不可达仍在 Design 侧）。
3. **KnowledgeService 大量 `@deprecated` 别名**（submit/approve/autoApprove/reject/toDraft/fastTrack，:582-610）为旧调用方保留，语义已收敛到 publish/deprecate/reactivate。
4. **ContentPatcher 破坏式降级已退役**（U5 #5）：非结构化 suggestedChanges 不再覆盖 markdown，只跳过——依赖它做全文替换的旧路径会静默 no-op。
5. **CodeEntityGraph（1232 行）** 是本分区体量最大的文件，属"代码实体图谱"（Phase E/Semantic Memory 之上），复用 knowledge_edges 表存 inherits/conforms/calls/data_flow 等边，与 Recipe 生命周期正交，供 Agent 结构化上下文生成。
6. **cap 缺省字节兼容契约**是硬约束：所有 sweep（checkTimeouts/checkAndPromote/checkAndExecute/scanAll）在 cap===undefined 时必须与旧无界全表行为字节一致，改动时勿破坏。

---

### 4.10 service 层：Guard 合规引擎、Search 检索排序、Source-Graph 关系、Vector 语义

#### 职责与层次

这四个子系统同属 `service/` 层（`shared,types,domain,core*,infrastructure,repository` 可导入），是 Core 把"宿主 Agent 分析/扫描代码"闭环所需的业务编排面。它们不实现宿主 Agent、工具系统或 AI provider，只提供确定性、可复用的规则检查、检索、关系查询与向量生命周期能力，经由 `@alembic/core/guard`、`@alembic/core/search`、`@alembic/core/vector` 三个包子路径（`src/guard.ts`/`src/search.ts`/`src/vector.ts` facade barrel）向 AlembicAgent、Alembic 主体、AlembicPlugin 暴露。其中 `service/guard` 是全仓少数几个"blessed core-leaf 例外"之一：`GuardCheckEngine` 直接 `import * as AstAnalyzerModule from '../../core/AstAnalyzer.js'`（`src/service/guard/GuardCheckEngine.ts:8`）并经 `EnhancementGuardRules.ts` 消费 `core/enhancement`，这是 layer-contract 明确放行的 `service → core*` 桥。

#### 关键文件与模块

- Guard：`GuardCheckEngine.ts`（1784 行，核心引擎+BUILT_IN_RULES）、`GuardCodeChecks.ts`（跨行/配对检查）、`GuardCrossFileChecks.ts`（跨文件重名/循环依赖）、`UncertaintyCollector.ts`（三态边界）、`GuardService.ts`（规则生命周期）、`GuardPatternUtils.ts`（正则缓存+掩码）、`ViolationsStore.ts`（Drizzle 持久化，MAX_RUNS=200）、`RuleLearner.ts`/`ExclusionManager.ts`/`GuardFeedbackLoop.ts`/`EnhancementGuardRules.ts`（治理闭环）。
- Search：`SearchEngine.ts`（1641 行统一入口）、`SearchTypes.ts`（契约类型+投影函数）、`FieldWeightedScorer.ts`（默认 Scorer）、`MultiSignalRanker.ts`（7 信号）、`CoarseRanker.ts`（粗排 EEAT）、`HybridRetriever.ts`（RRF）、`contextBoost.ts`（会话加成）、`tokenizer.ts`（中英混合分词）。
- Source-Graph：`SourceGraphService.ts`（facade）、`SourceGraphQueryService.ts`（1764 行查询核心）、`SourceGraphIndexer.ts`（构建/增量/freshness）、`SourceGraphLifecycle.ts`（冷启动/catch-up 编排）。
- Vector：`VectorService.ts`（867 行统一服务）、`RecipeRegionVectorIndex.ts`（Recipe 语义区块索引）、`SyncCoordinator.ts`（EventBus debounce 增量同步）、`EmbedProviderSelector.ts`（local-first lane 选择）、`EnrichmentTypes.ts`。

| 文件 | 关键锚点 |
| --- | --- |
| GuardCheckEngine.checkCode | `src/service/guard/GuardCheckEngine.ts:851` |
| Guard 四层管线拼装 | `src/service/guard/GuardCheckEngine.ts:982-996` |
| AST Layer2 analyzeFile 检查 | `src/service/guard/GuardCheckEngine.ts:1205` |
| trackGuardHits 回写 | `src/service/guard/GuardCheckEngine.ts:1608` |
| auditFiles + 信号发射 | `src/service/guard/GuardCheckEngine.ts:1669-1755` |
| GuardService.checkCode 代理/降级 | `src/service/guard/GuardService.ts:231` |
| SearchEngine.search 多模式 | `src/service/search/SearchEngine.ts:211` |
| auto 模式 confidence gate | `src/service/search/SearchEngine.ts:288`,`:897` |
| _applyRanking 管线 | `src/service/search/SearchEngine.ts:452` |
| FieldWeightedScorer.search | `src/service/search/FieldWeightedScorer.ts:211` |
| MultiSignalRanker.rank | `src/service/search/MultiSignalRanker.ts:314` |
| HybridRetriever.fuse (RRF) | `src/service/search/HybridRetriever.ts:60` |
| SourceGraphQueryService.search | `src/service/source-graph/SourceGraphQueryService.ts:156` |
| scoreSymbol 排序 | `src/service/source-graph/SourceGraphQueryService.ts:842` |
| SectionBudget 行预算 | `src/service/source-graph/SourceGraphQueryService.ts:1719` |
| VectorService.hybridSearch + 熔断 | `src/service/vector/VectorService.ts:393` |
| VectorService.getAvailability | `src/service/vector/VectorService.ts:727` |

#### 核心类型与契约

Search 的解耦靠 `SearchTypes.ts` 的鸭子接口：`Scorer`（`:36`，`FieldWeightedScorer` 默认实现）、`SearchVectorService`（`:541`）、`SearchHybridRetriever`、`SearchCrossEncoder`、`SearchVectorStore`；`SearchResponse`/`SearchResponseMeta`（`:229`）承载 route/requestedMode/actualMode/semanticUsed/vectorUsed/fallbackReason/degraded 等观测契约，`buildSearchResponseMeta`（`:287`）统一构造并只写非空字段避免旧客户端误判。`slimSearchResult`（`:494`）把内部排序信号剥离、description 截断 120 字、生成 `whenClause → doClause` 的 actionHint、并保留 `sourceRefs` 证据链，供 Agent/Bridge 消费。Guard 侧核心类型是 `GuardRule`/`GuardViolation`（含 `reasoning{whatViolated,whyItMatters,suggestedFix}`）与 `GuardCapabilityReport`（`UncertaintyCollector.ts:55`，含 executedChecks/boundaries/checkCoverage）。Source-Graph 全部 DTO 由 `domain/source-graph` 工厂（`createSourceGraphSearchResult` 等）构造，`SourceGraphDiagnostic` 用稳定 code（`source-ref-unproven`/`low-confidence-query`/`ambiguous-symbol`/`affected-tests-unknown`/`catch-up-failed`/`worktree-index-mismatch`）表达能力边界。

#### 关键类/函数与实现逻辑

**GuardCheckEngine.checkCode**（`:851`）是合规检查心脏。它先 `getRules(language)`（`:708`）合并三类规则：DB 自定义规则（从 `knowledge_entries` 经 `RawDbGuardAdapter.findGuardRulesSync(GUARD_LIFECYCLES)` 读，解析 `constraints.guards[]`，`decaying` 生命周期把 `error` 降级为 `warning`，`:748`）、`BUILT_IN_RULES`（跨 ObjC/Swift/JS/TS/Python/Java/Kotlin/Go/Dart/Rust 的行级正则，`:144`）、Enhancement Pack 外部规则（幂等注入、pattern 去重，`:658`）；再按 language（`LanguageService.toGuardLangId` 归一化）、`excludePaths`、`skipTestFiles`、`scope` 层级（`project⊇target⊇file`+`universal`，`:882`）过滤。随后逐行跑正则（`compilePattern` 带缓存，配 `skipComments`/`skipTestBlocks` 掩码与 `excludeLine/PrevLinePatterns` 排除，如 UIKit `dequeueReusableCell as!`、`//go:embed` 前置指令），然后依次拼接四层结果（`:982-993`）：`runCodeLevelChecks`（跨行配对，如 ObjC `addObserver` 无 `removeObserver`、Go 循环内 `defer` 回溯花括号判断是否在匿名函数内、Java 资源泄露、Rust unwrap 计数阈值）、`_runAstRuleChecks`（3 种 AST query：`mustCallThrough`/`mustNotUseInContext`/`mustConformToProtocol`，Tree-sitter 不可用时记 uncertain）、`_runAstLayer2Checks`（`analyzeFile` 深层度量：class bloat>30、圈复杂度>20、方法>120 行、嵌套>6、继承>4、协议>5、God Class、单例滥用、ObjC assign 对象属性/缺 nonatomic/可变集合暴露/缺 weakify，阈值可经 `codeLevelThresholds` 覆盖）。最后 `trackGuardHits`（`:1608`）把命中数按 ruleId 聚合、经 `incrementGuardHitsSync` 回写 Recipe 的 `guard_hit_count`（内置规则忽略），并给每条 violation 附 `reasoning`。`auditFiles`（`:1669`）批量审计后追加 `runCrossFileChecks`（ObjC Category 跨文件重名、JS/TS 直接双向循环依赖 `resolveImportPath` 归一化、Java 同名类、Go 多 init、Swift Extension 冲突），并在 `totalViolations>0`/`uncertain≥5` 时经 SignalBus 去重发射 `guard`/`guard_blind_spot`(CapabilityRequest) 信号。**GuardService.checkCode**（`:231`）优先代理引擎完整管线，捕获异常后降级为仅 DB `findActiveRules()` 的正则匹配。

**SearchEngine.search**（`:211`）先规范化元数据过滤、判 `bm25`(unsupported)/空查询短路，构 LRU cacheKey（session-context 查询不缓存），`ensureIndex()` 后按 mode 分派：`weighted` 走 `_scorerSearch`（`FieldWeightedScorer` + title/trigger 精确匹配 bonus）；`semantic` 走 `_semanticSearch`（优先 VectorService、legacy 回退 aiProvider embed+vectorStore，按 entryId `deduplicateByEntryId` 去 chunk，失败逐层记 fallbackReason 降级 weighted）；`keyword` 走 SQL LIKE（ESCAPE 防注入，无结果降级 weighted）；`auto` 是亮点——先跑 weighted(~40ms) 用 `#computeWeightedConfidence`（`:897`：top1/top2 分差、title/trigger 匹配等级、代码术语正则加分，中英自然语言疑问句/长查询减分）评分，`conf≥60` 直接返回跳过 2-22s embed，否则按 `adaptiveAlpha`(conf 越低 semantic 权重越高) 调 `vectorService.hybridSearch` 做 RRF 融合。排序阶段 `_applyRanking`（`:452`）串联可选 CrossEncoder → `CoarseRanker`(recall0.45/semantic0.3/freshness0.15/popularity0.1，semantic 缺失时按比例重分配权重) → `MultiSignalRanker`(按 scenario 选权重) → `contextBoost`(会话关键词重叠+语言匹配)。`refreshIndex`（`:1136`）支持增量：只加载 `updatedAt>lastIndexTime` 与 deprecated 条目，失败降级全量重建；缺表时记 `_indexDegradedReason` 经 searchMeta.degradedReason 暴露，绝不静默空列表。**FieldWeightedScorer** 对每字段独立打分（trigger5>title3>tags2>desc1.5>content1>facet0.5），长文本用 IDF 加权 overlap，删除用 tombstone+懒压缩（空洞>30% 触发 `_compact`）。**MultiSignalRanker**（`:259`）7 信号（relevance/authority/recency 半衰期90天/popularity 对数/difficulty/contextMatch/vector）按 SCENARIO_WEIGHTS(lint/generate/search/learning/default) 加权，构造时订阅 `quality|usage` 信号更新 `#realtimeWeights`/`#recentlyUsed` 实现实时排序，兼容旧 `seasonality` 键。**HybridRetriever.fuse**（`:60`）实现 RRF `score=α·1/(k+rank)+（1-α)·1/(k+rank)`（k=60），免归一化、对 outlier 不敏感。

**SourceGraphQueryService** 全部查询走 `createContext`（`:429`）：解析 snapshot（按 generationId/projectRoot+repoId）、装载 files/symbols/edges、构建 fileByPath/symbolById Map、依 snapshot.status/freshness 产 diagnostics；无 snapshot 时返 `uninitialized`/`unavailable` + `build_source_graph` nextAction。`search`（`:156`）用 `scoreSymbol`（`:842`：精确符号名+150、路径匹配+120、token coverage、exported+8、图连通度、按 classification penalty——generated 未请求时 -60）排序，再叠加 `buildTextRecallSections` 文本召回，`buildSectionsFromPlans` 用 `SectionBudget` 逐段预留行预算（config 分类源码 redact），只在 `freshness==='fresh'` 才读源码文本。`impact`/`affectedTests`/`validationPlan` 从确定性 edge 推导受影响文件与 `symbol_to_test` 测试，找不到时明确记 `affected-tests-unknown`；`validationPlan` 分 mustRun/recommended/manualReview/unknown 四桶并只"推荐不断言 acceptance"（`appendRepositoryScriptRecommendations` 读 package.json scripts）。

**VectorService** 统一向量生命周期：`fullBuild`/`incrementalUpdate` 委托 IndexingPipeline，`search`/`hybridSearch`（`:393`）内建 embed 熔断器（3 连败→打开 60s 跳过 embed 只跑 sparse，`#EMBED_CIRCUIT_THRESHOLD`/`COOLDOWN_MS`）；`getAvailability`（`:727`）返回五态 reason（`embed-provider-missing/ready/configured/unavailable/probe-failed`）实现可观测降级；`syncEntry`/`batchSync` 用 `entry_<id>` 前缀 upsert，`removeEntry` 连带清理 `recipe_region_` 前缀区块；`syncRecipeSemanticRegions` 明确注释只允许 rebuild/refresh/sync 调用，查询路径绝不 mutate 索引以防检索期臆造证据（APQ3 anti-fabrication）。`SyncCoordinator` 经 EventBus 监听 CRUD、2s debounce 合并后批量 chunk→embed→upsert，`destroy` 显式解绑 listener 防泄漏。`EmbedProviderSelector` local-first 选 lane（ollama→resident→keyword baseline），切换经 `migrateDimension`(clear→swap→rebuild) 防维度混用。

#### 模式与不变量

- 契约优先解耦：Search 依赖 `Scorer`/`SearchVectorService` 接口而非实现，运行时可注入替换。
- graceful degrade 是一等公民：SearchEngine 每条降级路径都写 `fallbackReason`/`degradedReason`；VectorService embed 熔断与五态可用性；缺表记录而非静默。
- anti-fabrication/determinism：Guard uncertain 是"承认能力边界"的确定性输出（不调 AI）；SourceGraph 只输出可证符号/关系与 diagnostics，validationPlan 不断言 acceptance；Recipe 语义区块只在写路径生成。
- budget/truncation：SectionBudget 行预算、slim 投影 120 字截断、_buildDocText token 重复 boost、edgeLimit/limit 上界 `normalizeBoundedInteger`。
- signal-driven realtime：Guard 发 guard/guard_blind_spot（去重）、MultiSignalRanker 订阅 quality|usage、SyncCoordinator EventBus 增量同步。
- 兼容标记：`seasonality→contextMatch`、`detectLanguage` 向后兼容重导出、decaying 规则 error→warning 降级。

#### 依赖与消费方

上游依赖 shared（LanguageService/PathGuard/ProjectRegistry/ProjectScope/DiagnosticCodes）、core（AstAnalyzer/enhancement，blessed）、domain（Lifecycle/KnowledgeEntry/source-graph 工厂）、infrastructure（Logger/SignalBus/drizzle/EventBus/VectorStore/IndexingPipeline/OllamaEmbedProvider）、repository（KnowledgeRepositoryImpl/SearchRepoAdapter/SourceGraphRepositoryImpl）。下游消费方：AlembicAgent 与 Alembic 主体 in-process AI 的 `alembic_code_guard`/`alembic_search`/`guardAuditFiles`/`KnowledgeRescanWorkflow`/prime handler，AlembicPlugin 便携运行时快照，以及 workflows 层的 project-intelligence/dimension-completion（消费 vector sync 与 SourceGraph 关系）。

#### 注意点/技术债/兼容标记

- `GuardCheckEngine` 是 blessed core-leaf 例外，改动时须保持 layer-contract 边界；`incrementalUpdate`（`VectorService.ts:225`）目前 pipeline 不支持 file filter，用 `force` 全量近似（注释标注"未来扩展"）。
- SearchEngine 内 legacy 语义路径（aiProvider embed+vectorStore）与新 VectorService 路径并存，是兼容层；`bm25` mode 明确返回 `unsupported`。
- Guard 规则大量 excludeLinePatterns/excludePrevLinePatterns 是精确误报抑制（UIKit/cobra/go:embed），删改会改变 violation 输出，需保持兼容。
- SourceGraph `panorama` 类的动态 import 债在别处；此分区未见 workflows 反向依赖，边界干净。

---

### 4.11 Recipe/Candidate/Plan/Bootstrap/Quality 业务编排层

#### 职责与层次

本分区位于 `service/` 层（层契约允许 `shared,types,domain,core*,infrastructure,repository` 运行时导入），承担 Alembic 知识管线中两条核心业务链的编排：一是 **Candidate → 校验/去重 → Recipe** 的"提交前把关"，二是 **Plan 前置事实收集 → 意图/选择契约 → 生成状态投影** 的"规划闭环"。它不做持久化（那属于 `repository/`），也不做高层 workflow 编排（那属于 `workflows/`），而是承载"确定性业务规则与投影"这一中间态。整层通过三个根门面对外发布：`src/knowledge.ts`（`validateCandidatesUnified`）、`src/plans.ts`（planIntent + recipeStatus 全套函数）、`src/recipe-context-capabilities.ts` 与 `src/recipe-context.ts`（RecipeContext 门面）。分区总计约 6356 行，其中 `recipe-context` 26 文件最重。

关键的词汇边界（与全仓一致）：**Validate**（确定性 pass/fail）、**Score**（`QualityScorer` 咨询性、Core 内永不作门禁）、**Aggregate**（批内 dedup）三者职责严格分离；Candidate（`candidates/`、lifecycle=candidate）与 Recipe（`recipes/`、active/deprecated）都是 `KnowledgeEntry`，由 lifecycle 字段区分。

#### 关键文件与模块

| 文件 | 锚点 | 角色 |
| --- | --- | --- |
| `src/service/candidate/CandidateValidationFacade.ts` | :51 | 统一候选验证入口，组合三验证器 |
| `src/service/candidate/CandidateAggregator.ts` | :30 | 批内 title Jaccard 去重（阈值 0.85） |
| `src/service/candidate/SimilarityService.ts` | :131 | 候选 vs 磁盘 Recipe 加权相似度 |
| `src/service/recipe/RecipeCandidateValidator.ts` | :65 | V3 结构字段校验 |
| `src/service/recipe/RecipeParser.ts` | :63 | Recipe Markdown 解析（frontmatter/代码块/Usage） |
| `src/domain/knowledge/UnifiedValidator.ts` | :66 | 三层验证（字段/质量/唯一性，被门面组合） |
| `src/service/planIntent/planIntent.ts` | :111 | PlanSelection 投影/断言/PlanIntent 完整校验 |
| `src/service/planIntent/contracts.ts` | :52 | PlanIntent / PlanSelection 类型契约 |
| `src/service/recipeStatus/recipeStatus.ts` | :61 | 生成状态投影 + 覆盖度 + ProjectContext 签名 |
| `src/service/planFacts/project-info-tree.ts` | :1006 | 双宿主统一 plan facts 投影入口 |
| `src/service/planFacts/collect-project-context.ts` | :52 | honor 原生 ProjectScope 的收集器 |
| `src/service/recipe-context/RecipeContextService.ts` | :31 | DB-backed 只读 Recipe 门面 |
| `src/service/quality/QualityScorer.ts` | :95 | 5 维咨询性质量评分 |
| `src/service/bootstrap/BootstrapDedup.ts` | :41 | 冷启动会话级内存去重 |

#### 核心类型与契约

`planIntent/contracts.ts:52` 定义 `PlanIntent`（`generationStage`/`dimensions`/`scale`/`moduleBindings`/`plannedNextActions`/`evidenceRefs`/`draftSource`），`PlanSelection`（`planIntent/contracts.ts:63`，host-agent confirm 返回的精简三件套：stage+dimensions+scale+moduleBindings）。`PlanStageId` 三值 `coldStart|deepMining|moduleMining`（:1）。`recipeStatus/contracts.ts` 定义 `RecipeStatusReadRepositories`（结构化读端口：`knowledgeRepository.findAllByLifecycles`、`recipeSourceRefRepository.findAll`、可选 `proposalRepository`/`lifecycleEventRepository`），以及 `PlanCodeRecipeMapping`（status ∈ `planned|generated|stale|missing`）、`PlanCoverageBucket`、`PlanGenerationState`、`PlanView`。`recipe-context/ports.ts:98` 定义 `RecipeContextDeps`——只读端口集合（`read`+`sourceRefs` 必需，`search`/`vector` 可选），刻意无 create/update/delete/publish，注释明言"KnowledgeService 生命周期不能经门面泄漏"（:1-6）。

`planLedger` 是纯聚合 barrel：`planLedger.ts` 仅 `export *` 转发 `planIntent` 与 `recipeStatus`，`contracts.ts` 用 `export type *`——它本身无独立实现，只是给下游一个"计划账本"命名空间。

#### 关键类/函数与实现逻辑

**统一候选校验（`validateCandidatesUnified`，CandidateValidationFacade.ts:51）** 是本分区最重要的组合点。它先 `aggregateCandidates`（批内去重），再对保留项逐条跑 `RecipeCandidateValidator.validate`（V3 结构）与 `UnifiedValidator.validate`（三层），最终 `valid = unified.pass && recipe.valid`（:72）——纯合取，注释与 CLAUDE 记忆均强调"不丢弃、不弱化、不重排任何单项验证器的 errors/warnings"，且不做 enforcement（质量门禁归别处）、不纳入 `QualityScorer`（:9-11）。`unifiedValidator` 可复用有状态实例（携带跨提交去重缓存），默认新建无状态实例。

**`RecipeCandidateValidator.validate`（RecipeCandidateValidator.ts:65）** 校验 V3 结构：必填字段从 `getRequiredFieldNames()` 派生并排除容器字段（:39）；`content` 必须是对象且 `pattern|markdown` 至少一非空 + `rationale` 必填（:82-94）；`trigger` 长度 2-64 且建议 `@` 开头（:97-110）；`kind ∈ rule/pattern/fact`（硬 error）、`category` 不在 8 类白名单仅 warning、`headers` 必须是数组（空数组允许）、`reasoning.whyStandard/sources/confidence` 校验（:148-164）。

**`UnifiedValidator`（domain/knowledge/UnifiedValidator.ts:66，被门面组合的第三方）** 三层：Layer1 依 `V3_FIELD_SPEC` 逐字段（REQUIRED→error / EXPECTED→warning / OPTIONAL 忽略）+ content/reasoning 类型校验；Layer2 内容质量启发式，阈值（`markdownFloor`、代码块/文件引用正则、`coreCode` 起始字符黑名单、通用标题正则）统一从 `recipe-authoring-spec/gateRules` 表读取而非内联字面量（:20-26，P1.3 re-point）；Layer3 唯一性用 `#titles`/`#triggers`/`#codeFingerprints` 私有 Set，`recordSubmission` 提交成功后登记。`systemInjectedFields` 可跳过特定字段的 REQUIRED，`skipUniqueness` 可关 Layer3。

**去重家族三件套**：`aggregateCandidates`（CandidateAggregator.ts:30）线性两两比较 title 的 Jaccard（`jaccardSimilarity(tokenizeForSimilarity)`），≥0.85 判重并记 `duplicateOf`；`SimilarityService.findSimilarRecipes`（:131）加载磁盘 `recipes/` 全部 `.md`（`loadRecipesFromDisk` 带 `MAX_WALK_DEPTH=16` 深度守卫 + 符号链接跳过 + 截断诊断码 :14/:71-119），综合相似度 title30%+summary30%+code40%（:56），排序取 topK；`BootstrapDedup`（:41）是冷启动会话级纯内存缓存，用 4 维权重 title0.2+clause0.3+code0.3+guard0.2（:37），解决 DB 写入延迟盲区与并行维度竞态，`clear()` 于 session 结束调用。三者算法风格一致（Jaccard / n-gram），但作用域不同（同批内 / 跨磁盘 / 会话内）。

**PlanSelection 投影链（planIntent.ts）**：`assertPlanSelectionShape`（:51）校验 stage 合法、dimensions 非空全字符串、`scale.totalRecipeBudget>0`；`assertPlanSelectionStageRequirements`（:90）在 deepMining/moduleMining 追加 module×dimension 目标校验（`validatePlanSelectionModuleTargets`:292）；`applyPlanSelection`（:111）产出 `PlanSelectionProjection`：`resolvePlanDimensionDefinitions` 解析维度（未知维度进 `unknownDimensionIds`），`resolvePlanSelectionBudget`（:226）对预算/maxFiles/contentMaxLines 做 clamp（下限=维度数、上限 `MAX_TOTAL_RECIPE_BUDGET=500` 等，testMode 另有 `dimensionCount*2` 上界）。`validateCompletePlanIntent`（:157）是 confirm 硬门：校验 dimensions/scale/moduleBindings/plannedNextActions/evidenceRefs 全非空且 moduleBinding 引用的维度存在，`normalizeConfirmedPlanIntent` 做防御性数组拷贝并盖章 `draftSource='host-agent'`（:141）。

**生成状态投影（recipeStatus.ts）**：`projectPlanGenerationState`（:61）从 `RecipeStatusReadRepositories` 拉 recipes（可数 lifecycle）/sourceRefs/proposals/lifecycleEvents，交给纯函数 `projectPlanGenerationStateFromRecords`（:81）：以 sourceRef 为主键建 `PlanCodeRecipeMapping`（stale 依 ref.status 或 recipe lifecycle ∈ decaying/deprecated 判定），无 ref 的 recipe 补 missing/stale，未生成的 moduleBinding 补 planned；`mergeMappingStatus` 用 rank(planned<missing<generated<stale) 合并（:374）。`buildCoverage`（:212）按 dimension/module/module×dimension 三粒度聚合 planned/generated/stale/missing 并算 gaps（按 missing 降序稳定排序）。`computeProjectContextSignature`（:171）用 `stableStringify`（键排序 + 数组排序 :425）+ sha256 生成 `pcsig:...` 确定性签名，`compareProjectContextSignature` 做 match/mismatch——这是 Plan 新鲜度比对的确定性基石。

**双宿主 plan facts 投影（planFacts）**：这是记忆里"21M 自重复爆炸"修复的落点。`buildPlanFactsProjection`（project-info-tree.ts:1006）产出精简三件套：`buildProjectInfoTree` 按 `budgetBytes` 构建金字塔——`tryAppendProjectInfoNode`（:744）append 后测 `JSON.stringify` 字节数超则 pop 回退，`pruneProjectInfoTreeToBudget`（:758）超预算时按 symbol→file→module 顺序修剪；超预算则 `attachFullProjectInfoTreeRefIfNeeded`（:211）把完整树经 `writeTransientTransport` 写到 `.asd/tmp/plan-tree-<hash>.json`（transient-transport.ts:37）并在 `meta.fullTreeRef` 挂引用。`collectPlanProjectContext`（collect-project-context.ts:52）honor 原生 `ProjectScope`（记忆里"cold-start 从不加载 ProjectScope"修复）：经 `loadProjectScopeForFolder` / registry 定位 scope，选 active folders 的 primary-source，经 `ProjectContextCapabilities.execute` 跑 space/repo/map/module/module-layers 有限 requestKinds，产 `PlanProjectContextAnalysis`。`project-source-facts.ts` 的 `collectProjectSourceFileFacts`（:36）BFS 扫源文件（排除 `.asd/.git/node_modules/DerivedData` 等，默认上限 5000），并把文件分派给 module seeds。整簇是"从 host 交付层纯提取、行为字节不变"，双宿主（host-agent MCP + 主体 in-process）共用。

**RecipeContext 只读门面（recipe-context）**：`RecipeContextService`（:18）实现 `RecipeContext` 契约，`execute` 经 `createRecipeContext`（recipeContext.ts:15）canonicalize→dispatch→envelope；`dispatchRecipeContextRequest`（dispatch.ts:10）按 kind 查 registry，缺 handler 返回 unavailable envelope 而非 throw，`RecipeContextRequestError`（坏 kind/payload）也被转成 unavailable envelope（recipeContext.ts:30）。6 个 handler 均由 `deps` 闭包生成（handlers/index.ts:18）：`detail`（id→单条+source refs+staleness 诊断）、`list`（元数据过滤）、`search`（keyword+vector，无 search 端口报 unavailable）、`prime`（语义区块，无 vector 端口优雅降级返空 blocks + `embed-provider-unavailable` :30-43）、`relations`（BFS 关系链，maxHops 1-5/fanout 1-20 clamp、per-path cycle-safe、conflict/deprecated 边标 `neutral-or-caution` shared.ts:14/:24）、`source-refs`（多维批查，选最窄索引查询后 post-filter，stale/renamed 出诊断）。`fromCore.ts` 提供从具体 Core 服务结构化装配的便捷工厂。

**QualityScorer（quality）**：5 维加权（completeness0.25/contentDepth0.30/deliveryReady0.20/actionability0.15/provenance0.10，权重来自 `shared/constants.ts:12`），`textScore` 做长度渐进评分，`#toGrade` 按 A≥0.85/B≥0.70/C≥0.55/D≥0.35（constants.ts:21）分级。关键不变量：Core 内它是**咨询性**输出，从不作为发布门禁——这条在门面注释与 CLAUDE 记忆中反复强调。`FeedbackCollector`（:30）记录 view/click/rate 事件到 `feedback.json`，读容错（损坏→空 + `feedbackLoadFailed` 诊断码 :158）、写严格（失败抛 `PersistenceError` :185），并经 `pathGuard.assertProjectWriteSafe` 守卫写路径。

#### 模式与不变量

组合而不改判定（Facade）、契约-实现分离（`export type *` contracts + impl）、Registry+闭包 handler、只读端口门面、预算/截断（金字塔 append 回退 + transient 外置）、确定性归一化（stableStringify 签名）、有界 BFS + per-path cycle-safe、read-tolerant/write-strict 双策略。核心不变量：`validateCandidatesUnified` 的合取语义、`QualityScorer` 非门禁、RecipeContext 无写路径、planFacts 双宿主行为字节一致。

#### 依赖与消费方

依赖 `shared`（similarity/LanguageService/PathGuard/errors/constants/ProjectScope/WorkspaceResolver）、`domain/knowledge`（UnifiedValidator/FieldSpec/gateRules）、`domain/dimension`（DimensionRegistry）、`domain/project-context`、`infrastructure`（Paths/Logger/WriteZone），以及 `core` 叶子（project-context-capabilities/dimensions/host-agent-workflows）。消费方：AlembicPlugin 与主体 in-process AI 经三根门面接入；`knowledge.ts:116` 再导出 `validateCandidatesUnified` 给 Gateway/KnowledgeService；`plans.ts` 把 planIntent+recipeStatus 全套以 `buildProjectIndex*` 别名对外；`recipe-context-capabilities.ts` 提供 `createRecipeContextServiceFromCore` 装配。

#### 注意点/技术债/兼容标记

- `CandidateValidationFacade` **未**在 `candidate/index.ts` re-export（只导出 Aggregator+SimilarityService），仅经 `knowledge.ts` 根门面暴露——`@alembic/core/service/candidate` 子路径取不到它，是刻意的门面收口。
- `RecipeParser.ts:38` 有保留但未用的 `_SNIPPET_HEADING_RE`；`RecipeCandidateValidator.ts:44` 有注释掉的 `REQUIRED_CONTENT_FIELDS`（预留 content 子字段校验）。
- `project-info-tree.ts` 内 `mergePlanModuleSeeds`（:302）在 collect-project-context 中被 `mergeProjectContextModuleSeeds` 取代，属重复工具痕迹。
- UnifiedValidator 的 stage-3 阈值已从内联字面量迁到 `gateRules` 单源（P1.3），注释承诺"取值字节级一致，仅搬移不重解释"——修改阈值须改表而非此处。
- `recipe-authoring-spec` 属 `domain/knowledge` 域，UnifiedValidator 导入合法且该模块零 fs。
- planFacts 全部 `readRecord/readString` 等私有工具从 plan-tool "复制、byte 一致、不导出以免污染 barrel"，是双宿主提取的兼容代价（两文件各有一份），后续可考虑收敛但当前刻意保留以保证行为不变。

---

### 4.12 workflows/capabilities/host-agent — 宿主 Agent 编排（冷启动 Recipe 生成闭环）

#### 职责与层次

该子系统位于 `workflows/` 层（10 层契约里可 import 到 `service/repository/core*` 的最高编排层），承载 CLAUDE.md 里反复强调的那条边界：**Core 需要支持“由宿主 Agent 分析和扫描代码”的完整闭环，但只实现可复用的 workflow / session / briefing / persistence / contract，不实现宿主 Agent 本体、工具系统或多渠道交付**。这里的“宿主 Agent”既指外部 host（Cursor/Copilot/Claude Code），也指 Alembic 主体的 in-process AI——两者都通过同一批契约驱动。`HostAgentDimensionCompletionWorkflow.ts:171` 的注释把分工写得很清楚：Core 负责校验、恢复证据、绑定 Recipe、存 checkpoint、写关键发现、返回质量反馈；Skill 生成、事件广播、交付 finalizer、MCP tool meta/nextActions 全部由外层仓库处理。

整个链路的核心生命周期是 **session → snapshot**：一个 LIVE 有状态的 `BootstrapSession` 收集维度完成、跨维度 hints、分析缓存与提交证据，其可序列化投影（`BootstrapSessionSnapshot`）落盘为 durable index，用于跨进程重建。

#### 关键文件与模块

| 文件 | 角色 |
|---|---|
| `BootstrapSession.ts:172` | LIVE 会话状态机 `BootstrapSession` + 项目级 lease 管理器 `BootstrapSessionManager` |
| `HostAgentDimensionCompletionWorkflow.ts:178` | `runHostAgentDimensionCompletionWorkflow` 每维度完成闭环 |
| `HostAgentAnalysisPacketBuilder.ts:124` | Snapshot/ProjectContext → 分析包投影（1518 行主实现） |
| `analysis-packet/Types.ts:167` | `HostAgentAnalysisPacket` 契约 + `IDEAgent*` 兼容别名 |
| `analysis-packet/UnitProgress.ts:13` | 稳定 unit key / progressSeed 生成 |
| `analysis-packet/StableIdentity.ts:11` | `stableStringify`+`computeContentHash` 确定性哈希 |
| `analysis-packet/Scoring.ts:27` | 按 dimensionId 选证据种类 / 打分 |
| `MissionBriefingBuilder.ts:1064` | 100KB 预算的一站式任务简报（1479 行） |
| `MissionBriefingSupport.ts:54` | Briefing profile / 压缩策略 / tier 执行指令 / rescan 投影 |
| `HostAgentSubmissionTracker.ts:373` | 4 维质量评分 + 负空间信号 + 跨维度证据 |
| `MiningSessionStore.ts:133` | headless 维度报告 / 证据 / 缓存存储（`SessionStore` 别名） |
| `SessionSupport.ts:28` | per-dataRoot manager 单例解析 |
| `CompletenessCritic.ts:184` | advisory 完成度评审（永不阻断） |
| `HostAgentMissionWorkflow.ts:20` | session 创建 + briefing + 取活跃 session 的门面 |

#### 核心类型与契约

`HostAgentAnalysisPacket`（`Types.ts:167`）是投影输出契约：`packetId`/`projectRootHash`(content-hash)、`profile`(`cold-start`|`rescan`)、`projectSummary`(含 `degraded`/`warnings`)、`units[]`、去重后的 `sourceRefs`/`requiredReadSet`/`structuralEvidenceRefs`、`retrievalHints`(`stableKeyFormat`+`aliasPolicy`)、`budget`(`includedUnits`/`totalUnits`/`omittedReason`)、`progressSeed`，以及 `meta.compressionIndependent: true`。每个 `HostAgentAnalysisUnit` 带 `HostAgentStableUnitKey`、`requiredReadSet`、`structuralHints`、`HostAgentCompletionContract`（`minDistinctFiles`/`mustReferenceAssignedSources`/`expectedEvidence`/`allowNoRecipeWithReason`）和 `degraded`/`warnings`。`HostAgentAnalysisDegradedReason`（`Types.ts:38`）把 ast/callgraph/depgraph/guard/panorama/project-context 不可用与 `empty-read-set`/`source-path-compressed` 结构化枚举。

`Types.ts:224` 起给出全套 `IDEAgent*` 类型别名（`export type IDEAgentAnalysisPacket = HostAgentAnalysisPacket` 等），`HostAgentAnalysisPacketBuilder.ts:97-104` 与 `UnitProgress.ts:82-84` 把函数/值也做等价 re-export——这是 R1 兼容层，迁移期公共门面从 IDEAgent 词汇平移到 HostAgent，旧名保持可用。根入口 `src/index.ts` 与 `package.json` 子路径 `./workflows/capabilities/host-agent`（`package.json:237`）、`./host-agent-workflows`（`package.json:73`）都导出这些符号，是外层长期接入契约。

#### 关键类/函数与实现逻辑

**BootstrapSession 生命周期与 lease。** 构造时生成 `bs-<uuid>` id、`SESSION_TTL_MS=2h`（`BootstrapSession.ts:120`），派生态 `isExpired`/`isComplete`（完成数≥维度数）/`isBlockingLease`（未过期且未完成）。`markDimensionComplete`(`:284`) 是写路径核心：记录 `completedAt`、把 `keyFindings` 转成 `{finding, importance:7}` 存入 `SessionStore`、调 `submissionTracker.extractNegativeSignals` 提负空间信号、`buildQualityReport` 算质量、触发 `#emitChange` 级联持久化，返回 `{updated, qualityReport}`。`storeHints`(`:323`) 按 targetDim 累积跨维度提示并对同源 dim 去重。`setSnapshotCache`(`:371`) 缓存 `toSessionCache(snapshot)`（Phase1-4 结果的 session 投影）供 wiki_plan / dimension-complete 复用。

`BootstrapSessionManager`(`:426`) 是 per-dataRoot 单例（`SessionSupport.ts:26` 的 `sessionManagers` Map，blessed lazy lifecycle AD4）。`createSession`(`:446`) 遇同项目未过期且未完成 session 抛 `BootstrapSessionLeaseError`（HTTP 409 / `state=bootstrap_in_progress`，可 `replace` 覆盖）；`getSessionStatus`(`:502`) 把 not-found/expired/project-mismatch/complete/active/in-progress 全映射成结构化 `BootstrapSessionStatus`（带 `errorCode`/`failureKind`/`problemClass`），供外层 clean-output。`#persist`(`:665`) 用 `.tmp` + `renameSync` 原子写 `.asd/bootstrap-sessions/active-sessions.json`，`#loadFromDisk` 带类型守卫（`isStoreFile`/`isSessionSnapshot`）逐条重建——这就是“MCP/Core 进程重启后可经 `bootstrapSessionRef` 恢复同一条会话”的机制。

**维度完成闭环 `runHostAgentDimensionCompletionWorkflow`(`:178`)。** 流程严格：`normalizeCompletionInput`(`:314`) 强校验 `dimensionId` 与 `analysisText≥10 字符`、`submittedRecipeIds` 必须是数组 → `resolveHostAgentCompletionSession`(`:360`) 取活跃 session（缺失返 `SESSION_NOT_FOUND`）→ `extendSessionTtl` 续 1h → 校验 dimensionId 属于 session.dimensions → 解析 dataRoot（`ctx.dataRoot` > `safeResolveDataRoot` > `projectRoot`）→ 入参空时用 `recoverReferencedFiles`(`:412`，从 submission.sources 的 `file:line` 取文件)/`recoverSubmittedRecipeIds`(`:426`) 从 tracker 恢复 → `bindSubmittedRecipes`(`:440`) 对每条 recipe 打 `dimensionTags(dimensionId)` + `bootstrap:<sessionId>` tag（降级容错，失败只 warn 不中断）→ `markDimensionComplete` → `persistDimensionCheckpoint`(`:514`)/`persistKeyFindings`(`:551`，写 knowledgeGraph edge)→ 存 crossDimensionHints → 触发 `onDimensionComplete` 事件回调。返回体含 `progress`(`n/total`)、`isBootstrapComplete`、`qualityFeedback`、`evidenceHints`（前序维度分析摘要+负空间信号，供下一维度避免重复，`:653`）、`subpackageCoverageWarning`（`:614` 检测未覆盖本地子包）。注意：**依赖注入设计**——`getActiveSession`/`saveCheckpoint`/`now`/`onDimensionComplete` 全可通过 `dependencies` 覆盖，便于外层与测试。

**分析包投影 `buildHostAgentAnalysisPacket*`。** 三个入口：`FromSnapshot`(`:135`)/`FromProjectContext`(`:221`)/`buildHostAgentAnalysisPacket`(`:124`，先 `normalizeProjectIntelligence` 归一化)。逻辑：`collectSourceRefCandidates`(`:812`) 从 AST(class/method/protocol 100/94/86 分)、依赖边(80)、Guard 违规(78/76)、模块 keyFiles(72)、文件(70/50) 收候选并确定性排序；`buildAnalysisUnit`(`:362`) 按 `preferredEvidenceKinds(dimensionId)` 选证据、取前 8 条、生成稳定 key、算 `priority=max(1,100-index*5-degraded*3)`、拼 `completionContract`。`empty-read-set` 会写进 degraded。`packetId=ide_packet_<stableHash(identity)>`，identity 只含 profile/root/dimensions/requiredReadSet/evidenceRefs——保证压缩无关。ProjectContext 变体额外处理 file-flow/module-layer/symbol 等 ref kind。

**稳定 unit key（`UnitProgress.ts:13`）。** `createHostAgentAnalysisUnitKey` 归一化 sourceRef/qualifiedPath，取 `qualifiedPath ?? sourceRef`+projectScopeId+folderId+fqn+entityType+line+symbol 做 `stableHash` 得 `ide_unit_<hash>`，另附 `shortAlias`（symbol→fqn→路径末段）。packet 的 `retrievalHints.aliasPolicy` 明令 “shortAlias is display/search only and must not be used as the primary key”。`STABLE_HOST_AGENT_ANALYSIS_UNIT_KEY_FORMAT` 常量把格式契约固化。

**Mission Briefing。** `buildMissionBriefing`(`:1064`) 把 AST/EntityGraph/DepGraph/Guard + 维度（经 `TierScheduler` 分 tier + `buildEvidenceStarters` 附证据启发）+ `SUBMISSION_SCHEMA` + 语言自适应 example 组装。`MissionBriefingSupport.ts` 管三件事：`createBriefingPlan`(`:54`) 校验 profile 与 rescan 互斥；`applyBriefingCompressionPolicy`(`:181`) 在 100KB(`DEFAULT_RESPONSE_BUDGET`)硬上限下三级降级（none→moderate：截 30 边/20 类/10 协议→aggressive：删 evidenceStarters、technologyStack、SOP 压成紧凑文本），并写 `meta.compressionLevel`/`warnings`；`buildWorkflowInstruction`(`:348`) 给冷启动/增量两套逐维度指令（冷启动“每维度最少 3 条目标 5 条”，增量按 `executionMode` produce/verify-only/skip）。

**质量与证据。** `HostAgentSubmissionTracker`(`:126`) 显式对标内部 Agent 的 EvidenceCollector：`recordSubmission` 累积提交并建 `fileEvidenceMap`（超 20 条记 tracker-overflow 负信号），`extractNegativeSignals`(`:247`) 用中英文正则抓“未找到/not found/does not use”等负空间结论，`buildQualityReport`(`:373`) 算 coverage(30%)/evidence(30%)/diversity(20%)/coherence(20%) 加权分，阈值 50 出 `pass`——但这是**建议性**反馈，非 Core 门禁。`getAccumulatedEvidence`(`:468`) 汇总前序维度摘要 + 多维共享文件 + 负信号。`MiningSessionStore`(`:133`) 存维度报告/证据/跨维度引用/候选摘要，并带 TTL 只读缓存（search/file 各 100/200 上限 LRU），显式声明“不依赖 internal agent / MemoryCoordinator / TimerRegistry / 工具执行器”。`CompletenessCritic`(`:184`) 产接地 hints，`shouldBlockCompletion` 恒 `false`、`targetGate='advisory'`，`noPadding` 时诚实标 `exhausted` 而非编造 Recipe。

#### 模式与不变量

契约-实现门面（Core 不碰 Skill/事件/MCP meta）；HostAgent*/IDEAgent* 兼容别名（R1 迁移）；content-hash 稳定标识 + 压缩无关；lease + 2h TTL + 原子文件持久化的 session 状态机；预算截断（100KB briefing / MAX_SUBMISSIONS 20 / OutputBudget 切片）；按 dimensionId 关键字选证据 + 确定性排序；degraded reasons 显式化；**评分/覆盖只做建议不做门禁**（CompletenessCritic 与 CoverageLedgerWrite 写失败吞掉零计数）；per-dataRoot blessed lazy singleton；跨 Agent 语义对标（宿主 Agent 与 in-process Agent 能力对齐）。

#### 依赖与消费方

向下依赖 shared(OutputBudget/PathGuard/contentHash/developerIdentity/resolveDataRoot/ProjectScope)、types(ProjectSnapshot/SnapshotViews/projectSnapshotBuilder)、domain(dimension/knowledge/project-context)、infrastructure(Logger)、repository(EvolutionCoverageLedgerRepository)、以及同层 planning(TierScheduler/KnowledgeRescanPlanner)、presentation(LanguageExtensionBuilder)、persistence(DimensionCheckpoint)、coverage(barrel 直接 re-export)。消费方：AlembicPlugin 的 MCP 工具（alembic_bootstrap/rescan/dimension_complete/prime）与 Alembic 主体 in-process AI，均经 `src/index.ts` 门面或 `@alembic/core/workflows/capabilities/host-agent` 子路径接入。

#### 注意点/技术债/兼容标记

- **IDEAgent* 兼容别名**是显式迁移债（`Types.ts:224`“Keep old exported type names available while the public facade moves to HostAgent* vocabulary”），未来收敛时需同步外层消费方。
- **`ide_packet_`/`ide_unit_` 前缀**仍带旧 IDE 命名，虽 key 语义已是 HostAgent 词汇，属命名残留。
- **覆盖写回 `writeCoverageLedgerForCompletion`（coverage 子系统 `CoverageLedgerWrite.ts:61`）** 是维度完成后的 advisory per-(module×dimension) 账本写入，红线是“写失败吞掉返回零计数，绝不阻断维度完成”、只写 `coverage_ledger` 不碰 `git_diff_checkpoints`、deferred 行只写调用方明确判定不扫的 cell（no-guess）；该文件在 host-agent 目录有同名 1 行 re-export 桩（`host-agent/CoverageLedgerWrite.ts` 仅 1 行），真实实现在 coverage 分区。
- **`CompletenessCritic` 与 `HostAgentSubmissionTracker.buildQualityReport` 都是建议性**：totalScore/pass、targetGate 都不构成 Core 门禁，外层若把它们当生产门会违反 CLAUDE.md 停止卡“诊断/评分不得升级为成功门”。
- **session 持久化仅在 dataRoot 可解析时生效**（`SessionSupport.ts` 回落 `__memory__` 内存态），无 dataRoot 时进程重启会丢 session。
- 维度不足时 packet 兜底注入 `project-overview` 单元（`HostAgentAnalysisPacketBuilder.ts:148`），避免空包。

---

### 4.13 workflows 编排层：project-index 冷启动/重扫管线、planning/coverage/persistence 能力与 host-agent facade

#### 职责与层次

本分区是 `workflows/` 层(层契约允许 import 全部下游 + blessed `core*`)的编排骨架，覆盖两条核心用户链路的**纯确定性数据装配**：`alembic_bootstrap`(冷启动 cold-start)与 `alembic_rescan`(增量知识重扫 knowledge-rescan)。它的根本设计是 **Plan-vs-Execute 分离**——Core 只把「怎么扫、扫哪些维度、留哪些 Recipe、缺口在哪、账本怎么记」算成不可变的 plan/projection 数据结构，而真正的文件清理、AST 扫描、DB 写入、AI 调用全部由外层(Plugin 的 in-process internal-agent、AlembicAgent 的 host-agent)注入的 service 执行。`WorkflowCleanupPolicies.ts:29` 的 `createCleanupPolicyService` 在缺注入时直接抛错(`cleanupService or createCleanupService is required in Core`)正是这条边界的显式化：Core 编排清理**顺序**(先 `snapshotRecipes()` 后 `rescanClean()`)，但绝不实现清理本体。

#### 关键文件与模块

- 冷启动/重扫真实实现全部在 `src/workflows/project-index/`；`src/workflows/cold-start/index.ts` 与 `src/workflows/knowledge-rescan/index.ts` 是**纯 re-export 兼容壳**(各 3 行 `export * from '../project-index/...'`)，对应 package.json 的 `./workflows/cold-start`、`./workflows/knowledge-rescan` 子路径导出(package.json:225,229)。
- `src/host-agent-workflows.ts`(根 facade，`./host-agent-workflows` 导出)是 host-agent 协议的稳定门面，大量用 `as` 别名把 `ColdStart*`/`KnowledgeRescan*` 映射为 `ProjectIndexFull*`/`ProjectIndexIncremental*`，并把 `IDEAgent*` 作为 `HostAgent*` 的 compat 别名(host-agent-workflows.ts:87-97)。
- `capabilities/planning/{dimensions,knowledge}`、`capabilities/coverage`、`capabilities/persistence`、`capabilities/presentation` 是被上述管线复用的能力单元。

#### 核心类型与契约

Intent 三段式：`InternalColdStartArgs`/`HostAgentColdStartArgs` → `ColdStartWorkflowIntent`(ColdStartIntent.ts:54) → `ColdStartWorkflowPlan`(ColdStartPlan.ts:10)。Intent 携带 `executor:'internal-agent'|'host-agent'`、`completionPolicy:'auto-fill'|'host-agent-dimension-complete'`、`cleanupPolicy`、`projectAnalysis`(maxFiles/contentMaxLines/sourceTag/generateAstContext)。重扫侧对称：`KnowledgeRescanWorkflowIntent`(KnowledgeRescanIntent.ts:47)额外带 `perDimensionTargets`/`moduleDimensionTargets`(U2b：Agent confirm 的 per-维度/per-cell 目标 recipe 数，替代硬编码 5/维)。Plan 输出 `ProjectAnalysisScanOptions`/`ProjectAnalysisMaterializationPlan`(shared/ProjectAnalysisPlanTypes.ts)与 `response.tool`。所有响应经 `envelope()`(shared/WorkflowEnvelope.ts:23)包成 `{success,errorCode,message,data,meta}` 的稳定形状——注释明确外层 MCP/HTTP 可再包自己的 transport envelope。

#### 关键类/函数与实现逻辑

**双执行者(D4)。** `createInternalColdStartIntent`(ColdStartIntent.ts:66)与 `createHostAgentColdStartIntent`(:93)是并存的两个意图工厂：前者 `auto-fill`、带 `internalExecution`(skipAsyncFill/skipTargetDelivery)、`generateAstContext:true`；后者 `host-agent-dimension-complete`、`sourceTag:'bootstrap-host-agent'`、`generateAstContext:false`(host-agent 不需要 Core 生成 AST context，由 host agent 自己读码)。文件头注释记录 B6 裁决：`skip*` 布尔簇因经 `export *` 从 `./workflows/cold-start` 可达而 DEFER「布尔→模式类型」重构。`sourceFolders` 经 `normalizeSourceFolder`(:138)剔除绝对路径/`..`/`.`，防止越界。

**统一 plan 装配 + 空间成员安全。** `buildProjectIndexWorkflowPlanParts`(ProjectIndexPlan.ts:61)是 full/incremental 泛型分派中枢。full 模式下：`resolveFullProjectAnalysisScope`(:136)通过 `loadProjectScopeForProjectIndexRoot`(:173)加载 Alembic 原生 `ProjectScope`(经 `shared/ProjectScope`，即 `~/.asd/project-scopes.json`)——这是 space-membership-scoping 修复的接线点，让冷启动扫描路径从 ProjectScope 的 `controlRoot` + 成员 folders 派生 `sourceFolders`，而非污染性地扫整个 workspace 根。清理根 `cleanupProjectRoot` 在 host-agent 下取 `dataRoot`、internal 下取 `projectRoot`，再经 `assertFullResetCleanupRoot`(:241)做**关键安全不变量**：若清理根落在任一 ProjectScope 成员 folder 内(或其 realpath)，直接抛错——这防止 full-reset 误删真实源码(memory 中 RISK-2 的 `cleanup.projectRoot wipe 错目录`)。incremental 分支不做 scope 解析，`prepare:{}`、cleanup 只清 `dataRoot`。

**重扫 gap 决策核心。** `buildKnowledgeRescanPlan`(KnowledgeRescanPlanBuilder.ts:154)对每个 requested 维度算 `existingCount`(优先读账本 `ledgerCoverageByDimension`，否则现算 `buildCoverageByDimension`——只把 active/evolving 或 healthy staging 计入覆盖，:350)、`dimensionTarget`(优先 `perDimensionTargets` 否则 `targetPerDimension`，`TARGET_RECIPES_PER_DIMENSION=5` 仅兜底)、`gap=max(0,target-existing)`。`buildKnowledgeRescanExecutionDecision`(:316)据此定 `mode`：`gap>0 → produce`(createBudget=gap)、否则若有 decay/file-change reason → `verify-only`、再否则 `skip`。执行原因 `buildDimensionExecutionReasons`(:381)分 manual-request/file-change/recipe-decay/coverage-gap/fully-covered 五类。`moduleBindings` 提供时旁路产出 `cellPlans`(per-module×dimension gap，:291)，tier 由 `resolveModuleTier`(modules.length：S≤3/M4-12/L≥13，:19)决定 per-cell 默认(`D2_PER_CELL_TARGET_DEFAULT={S:5,M:3,L:2}`)——L 首扫只取代表性 2 条，靠 deepMining 多轮补。

**三层 Recipe 审计。** `auditRecipesForRescan`(KnowledgeRescanPlanner.ts:202)对保留 Recipe 逐条 `classifyRecipe`(:433)：层1 用 `RecipeImpactPlanner` 的 diff-based 候选(source-deleted→score 10 等，impactToScore:495)；层2 用 `RecipeSourceRefRepository` 的 active/stale 桥接健康度(refHealthToScore:517)；层3 用 lifecycle 兜底(active+sourceRefs 全丢→55，:587)。分数经 `EvolutionPolicy.classifyRelevance`(阈值 80/60/40/20)转 verdict。副作用是 U6：drifted refs → `submit({action:'update'})`、dead recipe → `submit({action:'deprecate',source:'metabolism'})`，经 `resolveEvolutionGateway`(:159)三级解析(直接取→组装 `new EvolutionGateway(...)`→null 降级跳过、proposalsCreated=0)。`source:'metabolism'` 走 observation-window 非立即执行。

**覆盖账本(coverage)。** 这是 rescan/coldStart 覆盖治理的核心，三文件分工清晰且全带 advisory 红线注释。`buildCoverageLedger`(CoverageLedgerBuilder.ts:188)把跨维候选 + coveredPaths 聚合成 per-(module×dimension) cell：module 归属靠 caller 提供的 canonical `ownedPaths` 经 `pathsOverlap`(coveragePathMatching.ts:17，做 equal/contains/suffix 三种匹配)，覆盖判定靠候选 sourceRefPaths 与 coveredPaths overlap；`resolveCoverageGrade`(:288)给 empty/thin/partial/covered。`writeCoverageLedgerForCompletion`(CoverageLedgerWrite.ts:61)薄适配 build→`repository.upsertCell`，再为 `deferredCells` 中未建格写空 deferred 行(grade=empty,deferred=1)——已建实测格绝不被空行覆盖(builtCellKeys 去重)。整段 try/catch 吞异常返回零计数(advisory 永不阻断)。`reflowDeepMiningRoundOnCompletion`(:164)在维度完成时把新增 recipe 数累加进最新一轮 `newRecipesThisRound`，无已开轮则不造轮。`adviseCoverageLedger`(CoverageLedgerAdvisor.ts:88)读账本 cells + 最近轮，给三类停止：converged(无 blank/thin 或全 exhausted-with-reason)、diminishing-returns(上一轮产出<K)、round-cap(≥maxRounds)，K/maxRounds 优先 plan 值否则 D2[tier]+env 覆盖。这些是「建议再扫一轮」而非自动调度。

**持久化(persistence)：增量冷启动引擎。** `FileDiffPlanner.evaluate`(FileDiffPlanner.ts:96)在 bootstrap 开头调用：加载上次快照→`computeDiff`→`inferAffectedDimensions`→若 incremental 则恢复 `SnapshotEpisodicMemory`；无快照或变更>50%(`FULL_REBUILD_THRESHOLD`)回退 full。`FileDiffSnapshotStore`(FileDiffSnapshotStore.ts:200)用 Drizzle 事务(:271)一次写 `bootstrap_snapshots` 主记录 + `bootstrap_dim_files` 维度文件关联 + `#enforceCapacity`(保留 `MAX_SNAPSHOTS=5`)。`inferAffectedDimensions`(:476)先查快照 dimFileMap(变更文件被哪些维度引用)，再按扩展名 `#inferDimsByFileType`(:569，如 .swift→code-standard/architecture、.py→python-package-scan 等)推断新增文件维度，并始终附加 `project-profile`。`reconcileSnapshotHashes`(:139)处理旧快照路径与当前扫描路径的 suffix 唯一匹配重映射(多候选歧义则跳过)。`saveWorkflowSnapshot`(WorkflowSnapshotStore.ts:45)是薄 wrapper，注释记录 D3 层契约 known exception：host-agent↔persistence 跨界耦合。`saveDimensionCheckpoint`(DimensionCheckpoint.ts:31)写 `.asd/bootstrap-checkpoint/<dim>.json`(TTL 1h)，清理经 `PathGuard.assertSafe`。

**dimensions 调度。** `TierScheduler`(TierScheduler.ts:56)按 domain `buildTierPlan()` 生成的三层(基础数据/规范架构模式/流转实践)调度：层内 `createLimit(concurrency=3)` p-limit 并行、层间串行；未在任何 tier 的维度按 `tierHints` 归位否则默认 Tier1。`BaseDimensions.ts`/`bootstrapDimensionConfigs.ts` 全从 `DIMENSION_REGISTRY` 派生瘦适配层。

**presentation。** `TargetFileMapBuilder`(:21)按 target 分组、按 `contentMaxLines` 截断、priority 排序；`LanguageExtensionBuilder`(:948)`buildLanguageExtension` 从冻结的 `LANG_REGISTRY`(14 种语言的 extraDimensions/antiPatterns/guardRules)按主语言取扩展字段。`presentation/index.ts:2` 显式注释 `TargetClassifier moved to shared/`(CO2 B2 层修复)——presenter 只 re-export shared 版。

#### 模式与不变量

四条 presenter(internal/host × coldStart/rescan)保持响应形状稳定：coldStart 骨架响应含 `bootstrapCandidates.status:'filling'` 表示后台逐维填充；rescan 有 `presentRescanArchive`(KnowledgeRescanPresenters.ts:20)的 destructive-reset honesty 契约——删文件但无 snapshot 时置 `archiveMissing:true`(禁止静默数据丢失)。coverage 全链「advisory 非门」不变量、path-safety 不变量、no-guess/no-host-fs 不变量均已在代码注释中固化。

#### 依赖与消费方

依赖 domain(dimension registry/EvolutionPolicy)、repository(CoverageLedgerRepository/sourceref/knowledge/proposal)、service(EvolutionGateway 等)、infrastructure(drizzle schema)、shared(ProjectScope/OutputBudget/PathGuard)。消费方：AlembicPlugin 的 MCP handler、Alembic 主体 in-process(DaemonJobRunner/KnowledgeRescanWorkflow 消费 buildKnowledgeRescanPlan + coverage writer)、AlembicAgent host-agent(经 host-agent-workflows facade)。

#### 注意点/技术债/兼容标记

1. **ProjectIntelligenceRunner 现状**：焦点要求确认其位置——**它不在本分区、也不在整个 Core `src/` 中**。全仓 grep(`grep -rn ProjectIntelligenceRunner src`)零命中；仅 `config/layer-contract.json:88` 与 `docs/layer-contract.md:51,66` 仍把 `workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` 记为 blessed core-leaf orchestrator 与 PanoramaScanner 的动态 import 目标，但该目录/文件已不存在(`workflows/capabilities/` 现只有 coverage/host-agent/persistence/planning/presentation + 两个顶层 .ts)。这与 memory 中「project-index 折叠(RISK-2)」「R-3 §10.2 docs 陈旧」一致：**layer-contract 文档为 stale 技术债**，实测本分区未直接 import 任何 ProjectIntelligenceRunner(唯一 `project-intelligence` 字符串是 HostAgentAnalysisPacket 的 `source:'project-intelligence-result'` tag，语义无关)。
2. **runProjectIndexWorkflow 不存在**：焦点提到的 per-host orchestrator `runProjectIndexWorkflow` 全仓零命中——Core 只提供 `buildColdStartWorkflowPlan`/`buildKnowledgeRescanWorkflowPlan`(+别名 `buildProjectIndexFull/IncrementalPlan`)这类 plan builder，orchestrator 本体(mode 轴的动态 import)在外层宿主仓，不在 Core。
3. 兼容别名密集：`buildProjectIndexGapPlan`=`buildKnowledgeRescanPlan`、`IDEAgent*`=`HostAgent*`，重命名需同步 package exports。
4. WorkflowSnapshotStore 的 D3 host-agent↔persistence 跨界耦合是记录在案的 known exception(owner=AlembicCore window，触发器=post-CKG1)。

---

### 4.14 daemon 契约层与验证/门禁面（daemon/ + build/release/lint gates + test surface）

#### 职责与层次

本分区覆盖两块彼此独立但在 `npm run check` 里交汇的表面：`src/daemon/`（8 文件 / 约 3.6k LOC）和仓库根的验证门禁面（`scripts/*.mjs` + `package.json` 组合脚本 + `test/` 分类）。

`src/daemon/` 是 10 层契约中最靠边的一层。按 `config/layer-contract.json:allowedRuntimeImports` 与 `docs/layer-contract.md`，`daemon -> [shared, types]`，其运行时依赖比 `domain` 还窄——它不能 import `repository/service/workflows`，只能引用叶子工具和跨层类型桥。这个约束在代码里被严格遵守：`JobStore.ts` 只 import `./DaemonState.js`；`ProjectRuntimeContracts.ts` 只以 `import type` 引 `../shared/*`（`FailureTaxonomy`/`FieldTaxonomy`/`ProjectRegistry`/`ProjectScope`），加上同层的 `JobStore`/`RuntimeContracts` 类型。命名叫 "daemon" 是历史词，实际上这一层是 **daemon-less 设计下的"作业/运行时展示 + 常驻服务契约"**：它定义 Alembic 主体、Plugin 便携运行时、Dashboard 三方在 HTTP/常驻服务边界上共享的 DTO、能力清单、失败分类学与只读投影函数，本身不起进程、不监听端口、不跑作业。唯一带真实副作用的是 `DaemonState.ts`（写 `daemon.json`/pid/lock）和 `JobStore.ts`（在 `runtimeDir/jobs/` 下逐 job 写 JSON 文件），这两者是文件型持久化实现，不是常驻进程。

验证/门禁面则是 Core 作为共享内核的"契约警察"：11 个 `.mjs` 脚本 + `npm run check` 组合，把层次方向、公共 API 边界、消费方 import 边界、扫描根解析、输出预算、空间 DAG 边、副作用教条、命名约定这些不变量固化成 CI 阻断步骤；`release:check` 单独留在发版期。

#### 关键文件与模块

| 文件 | 行 | 角色 |
| --- | --- | --- |
| `src/daemon/DaemonState.ts` | 105 | daemon.json/pid/lock 路径解析 + 原子读写（唯一带 fs 副作用的运行时状态） |
| `src/daemon/JobStore.ts` | 293 | 逐 job JSON 文件存储 + 状态机转移守卫 |
| `src/daemon/JobProcessEventContracts.ts` | 422 | 作业过程事件（LLM I/O、工具、工件）契约 + 展示/保留策略默认值 |
| `src/daemon/JobDisplaySnapshotContracts.ts` | 543 | 不可变展示快照 + sha256 校验和 + 证据不完整标注 |
| `src/daemon/ProjectRuntimeContracts.ts` | 1050 | 项目运行时身份/就绪度/失败分类学（本层最大 god-file） |
| `src/daemon/ResidentServiceContracts.ts` | 668 | 常驻服务特性能力矩阵 + owner 归属 + 结果信封 |
| `src/daemon/RuntimeContracts.ts` | 427 | 运行时健康数据 + 能力清单 + 路由/文件监视枚举 |
| `src/daemon/index.ts` | 82 | barrel，`export type` + `export *` 双导出 |
| `scripts/lint-layer-contract.mjs` | 133 | 10 层运行时 import 方向门（type-only 豁免） |
| `scripts/check-public-api-boundary.mjs` | ~450 | 公共 API 表面漂移门（收敛-only） |
| `scripts/lint-consumer-core-imports.mjs` | ~330 | 兄弟仓 `@alembic/core` import 边界扫描 |
| `scripts/lint-scope-resolution.mjs` | 159 | 扫描/写路径禁裸 `fromProject`（`@scope-singleroot` 注解） |
| `scripts/smoke-public-api.mjs` | ~340 | dist/ import 可达性冒烟（非行为测试） |
| `scripts/check-output-budgets.mjs` | 114 | 输出字节预算冻结 + 截断诚实自测 |
| `scripts/check-space-edges.mjs` | 154 | Core=空间 DAG 根，零空间边 + 工具链底线 |
| `scripts/lint-doctrine.mjs` | 119 | 模块级可变 let / 空集合累加器教条 |
| `scripts/lint-naming.mjs` | 94 | 文件名约定（src/ 目前 parked） |
| `scripts/check-release-readiness.mjs` | 256 | 发版期：npm pack 干跑 + sibling-free 校验 |

#### 核心类型与契约

`DaemonState.ts` 定义 `DaemonState`（`schemaVersion=1`、`mode:'daemon'` 字面量、token/port/url/pid/databasePath），`resolveDaemonPaths` 用 `WorkspaceResolver.fromProject` 派生 `runtimeDir/daemon.json/daemon.pid/daemon.lock/jobs/`，这里带 `@scope-singleroot(permanent)` 注解（DaemonState.ts:50）——正是 `lint-scope-resolution.mjs` 门要求的：daemon 状态是"每运行时实例"而非"项目空间数据"，所以豁免多根解析。

`JobStore.ts` 的核心是状态机：`DaemonJobStatus = queued|running|completed|failed|cancelled`，`ALLOWED_STATUS_TRANSITIONS`（JobStore.ts:77）冻结合法转移——`queued` 可去任意态、`running` 只能进终态、三个终态自锁。`TERMINAL_STATUSES`（:76）+ `isTerminalStatus` 保证 `update()` 对终态记录直接返回原值（幂等）。

`RuntimeContracts.ts` 定义 `AlembicRuntimeHealthData`（`/api/v1/daemon/health` 的 payload），聚合 `AlembicRuntimeCapabilities`（api/apiAi/dashboard/fileMonitor/jobs/projectScope 六块能力）。`ALEMBIC_JOB_ENDPOINTS`（:46）、`ALEMBIC_FILE_MONITOR_MODES`、`ALEMBIC_RUNTIME_ROUTE_KINDS` 是对外冻结枚举。文件监视有兼容别名 `ALEMBIC_FILE_MONITOR_COMPATIBILITY_ALIASES`（:59），把 `LEGACY_IDE_EDIT_SOURCE` 映射到 `HOST_EDIT_SOURCE`——典型 compat 桥。

`ResidentServiceContracts.ts` 定义 9 项 `ALEMBIC_RESIDENT_FEATURES`（status/search/jobs/dashboard/file-monitor），关键设计是 **owner 归属规则**：`resolveAlembicResidentFeatureOwner`（:527）把 `jobs.api-ai.*` 恒归 `alembic`（主体，有 API AI），`jobs.host-agent-recoverable.*` 恒归 `alembic-plugin`（宿主 Agent 恢复），其余按路由 owner 回落。`AlembicResidentServiceResult<T>` 是判别联合（`ok:true` 带 value / `ok:false` 带 reason+retryable）。

`ProjectRuntimeContracts.ts` 是最重的契约：`PROJECT_RUNTIME_REQUIRED_SERVICES`（7 项）× `ProjectRuntimeReadinessState`（ready/degraded/blocked）× `PROJECT_RUNTIME_FAILURE_REASONS`（14 个）。`PROJECT_RUNTIME_FAILURE_REASON_TAXONOMY`（:505）把每个失败原因映射到 Core 规范失败种类（`getCoreFailureTaxonomyEntry`）、默认就绪态、retryable。它还内嵌 `PROJECT_RUNTIME_FIELD_POLICIES`（:312）——按字段声明 consumer（Alembic/AlembicPlugin/AlembicDashboard）、诊断策略、扩展策略、字段类别（public/consumer-needed/diagnostic/sensitive/internal），这是"字段级对外契约"的机读表，`projectRoot`/`databasePath` 被标 `sensitive` + `ordinaryOutputAllowed:false`，防止敏感路径泄漏进普通输出。

#### 关键类/函数与实现逻辑

**JobStore 的持久化**：`create()` 生成 `${kind}_${base36 时间}_${uuid8}` id，写 `queued`。`#write`（:264）用 `tmp + renameSync` 原子替换、`mode:0o600`、目录 `0o700`——防半写。`get()` 先过 `isSafeJobId`（`/^[a-zA-Z0-9_-]+$/`）再读，且校验 `parsed.id===id` 防路径混淆。`list()` 上限硬夹 `[1,200]`（:143），按 `updatedAt` 倒序。`update()`（:222）是所有变更的唯一入口：终态守卫 → 转移合法性 → 强制保留不可变字段（id/kind/projectRoot/dataRoot/projectId/createdAt）→ 刷新 `updatedAt`。`markActiveInterrupted`（:201）把所有 queued/running 批量置 failed，用于重启恢复。

**JobDisplaySnapshot 的 sha256 校验和**：`createJobDisplaySnapshot`（:268）构造不可变快照，用 `computeJobDisplaySnapshotChecksum`（:391）——先把 `snapshot.checksum` 置 null，再 `stableStringify`（:529，键排序 + 丢 undefined 的确定性序列化）过 sha256。`validateJobDisplaySnapshot`（:402）校验 contractVersion、`snapshot.jobId===job.id`、ref 非空、checksum 存在且重算一致（`checksum_mismatch`）。这是"重启后可安全回读同一快照"的核心不变量。`manifest` 计数（事件/工件/开发者视图/llmIo/保留工件/告警数）是派生投影。`JOB_DISPLAY_SNAPSHOT_EVIDENCE_INCOMPLETE_REASONS`（12 个，如 `events_missing_after_restart`/`checksum_mismatch`/`producer_error`）是"证据不完整"的诚实标注枚举，配合 `evidenceIncomplete` 数组显式承认缺证据而非静默。

**JobProcessEvent 的展示/保留默认**：`createJobProcessEvent`（:151）按 `sourceClass` 推默认策略——`defaultDisplayPolicyForSourceClass`（:273）只有 `developer-facing` → `full`，其余 → `hidden`；`defaultRetentionForSourceClass`（:279）把 `secret`/`raw-provider`/`hidden-reasoning` → `transient`（不落盘），其余 → `job-retained`。`isJobProcessEventDeveloperVisible`（:268）+ `createJobProcessDeveloperView`（:218）过滤出开发者可见视图，`summary-only` 时丢正文。这是"敏感/原始 provider 内容默认不进前端、不保留"的安全默认。

**ProjectRuntime 就绪度归约**：`summarizeProjectRuntimeScopeReadiness`（:827）对每个必需服务跑 `createReadinessForService`（:909）——daemon 需 `ready===true && status==='ready'`，jobs 需 `jobsDir` 非空，api-ai/dashboard/file-monitor 各查对应能力位；`getDaemonFailureReason`（:1008）把 daemon 状态映射到具体失败原因。`summarizeReadinessState`（:986）取最坏态（blocked > degraded > ready）。`createProjectRuntimeServiceReadiness`（:790）里"必需但不可用 → blocked，非必需不可用 → degraded"是关键分叉。`isProjectRuntimeTarget`（:873）用 `hasProjectId !== hasProjectRoot`（异或）强制二选一，避免下游路由猜优先级。

**门禁脚本逻辑**：`lint-layer-contract.mjs` 用语句级正则（`FROM_IMPORT_RE` 捕获 type-only 分组）逐文件解析相对 import，`areaOf` 按 `src/<area>` 归区，type-only 边计数但豁免，运行时边查 `allowedRuntimeImports` 矩阵 + `blessedImports` 逐文件豁免（当前只有 migration→domain 和 `ASTChunker.ts`→core 两条带书面理由）。`check-output-budgets.mjs` 从 `dist/shared/OutputBudget.js` 动态 import，验证四不变量：预算表完整性（正整数 budgetBytes/measuredMaxBytes + rawRef）、类别诚实（超预算不得标 within-budget）、截断诚实（对 `alembic_prime` 塞超量字符验 `truncated:true` + overflow route + 多字节不裂码点）、破坏性重置契约（`assertDestructiveResetHasArchive` 无 archiveRef 声称保留必须抛）。`check-space-edges.mjs` 验 Core=DAG 根：package.json 零空间依赖、src/scripts 零 `@alembic/*`（除 core 自身）import、工具链底线（node 大版本、tsc `5.9.*`、biome 精确锁、vitest≥4）。`lint-doctrine.mjs` 正则抓模块级可变 `let`（豁免 `=null` 惰性槽）和空 `new Map()/Set()` 累加器，豁免只来自 `config/blessed-singletons.json`。

#### 模式与不变量

- **契约 vs 实现分离**：daemon 层近乎纯契约（类型 + 工厂 + 归一化 `normalize*` + 类型守卫 `is*`），真实作业执行/HTTP 服务在消费方仓。
- **确定性序列化 + 校验和**：`stableStringify` + sha256 保证快照可跨重启回读校验。
- **状态机守卫 + 幂等**：`ALLOWED_STATUS_TRANSITIONS` + 终态自锁 + `update()` 单一入口 + 不可变字段保护。
- **原子文件写**：tmp+rename+受限 mode（DaemonState/JobStore 一致）。
- **安全默认（fail-closed）**：非 developer-facing 事件默认 hidden/transient；sensitive 字段 `ordinaryOutputAllowed:false`。
- **收敛-only 门禁**：public-api trend/maxCounts 只许缩不许涨；removedExports 复活即失败；provisional facade 有 narrowness 预算。
- **豁免必须带书面理由**：blessedImports/lintExemptions/exactEdgeAllowlist 每条都需 owner+reason+cleanupTrigger，无隐式例外。
- **测量而非估计**：output-budget 冻结在 MT1 实测值；coverage 阈值（vitest.config.ts:21）棘轮在 CO4 实测底线（branches 38.06 等），且明确记 coverage 尚未接进 `npm run check`（TODO CO4-COVERAGE-ENFORCEMENT-DECISION）。

#### 依赖与消费方

daemon 层依赖仅 `shared`（`WorkspaceResolver`/`PACKAGE_ROOT`/`ProjectRegistry`/`ProjectScope`/`FailureTaxonomy`/`FieldTaxonomy`/`sourceContracts`）+ `types`（type-only 桥）。经 `package.json` `./daemon` 子路径导出（`src/daemon/index.ts` barrel），消费方是 Alembic 主体、AlembicPlugin、AlembicDashboard——通过 HTTP health/jobs 端点与常驻服务能力矩阵消费这些 DTO；`smoke-public-api.mjs:51` 明确列出 `@alembic/core/daemon` 必须导出的 21+ 符号（各 `ALEMBIC_*`/`JOB_*`/`PROJECT_RUNTIME_*` 常量），是外层接入的冻结契约。

门禁面消费方是 CI 与开发者：`npm run check`（package.json）串联 `build:check → lint:public-api-boundary → lint:layer-contract → lint:consumer-core-imports → lint:scope-resolution → smoke:public-api → check:output-budgets → check:space-edges → lint:doctrine → lint:naming → test → lint`。其中 gate 2/4/`check:output-budgets` 需先 `npm run build`（依赖 dist/）。`lint-consumer-core-imports` 扫三个兄弟仓（`CORE_CONSUMER_REPOS`，各带自己的 core-import-boundary 配置），缺席仓报 skipped。`test/` 158 个 vitest 文件里，四个"边界墙"测试是硬门（CLAUDE.md 要求存在且通过）：`CoreCodexBoundary`（禁 codex/mcp/plugin/channels/marketplace 目录与导出）、`CoreToolSystemBoundary`（禁 tools/tool-system + 具名实现文件如 `ToolContextFactory.ts`/`DeltaCache.ts`/`TerminalSession.ts`）、`CoreDeliveryBoundary`（禁 delivery/agent + `CursorDeliveryPipeline.ts` 等）、`CorePackage`（正向冒烟根导出如 `createHostAgentWorkflowSession`）。其余测试按子系统分类：Public*Entrypoints（公共入口）、ProjectContext*（项目智能）、Recipe*/Knowledge*（生命周期）、Search*/Vector*/Hnsw（检索）、Guard*（守卫）、Ast*/MultiLanguage（AST），以及本层直接对应的 `DaemonState`/`JobStore`/`JobProcessEventContracts`/`JobDisplaySnapshotContracts`/`ProjectRuntimeContracts`/`ResidentServiceContracts`/`RuntimeContracts` 契约测试。

#### 注意点/技术债/兼容标记

1. **coverage 未接门禁**：vitest.config.ts:14-27 明说棘轮值是实测底线、旧的 75/75/80/80 从未可运行；接进 `npm run check` 仍是待用户决策的 TODO——`--coverage` 目前只是回归报告。
2. **compat 桥标记**：`RuntimeContracts.ts:59` 文件监视遗留别名、`JobProcessEventContracts.ts:206` 归一化时兼容验收前的 `parentId` 输入（对外统一 `parentEventId`）。
3. **god-file 债**：`ProjectRuntimeContracts.ts` 1050 行把身份/就绪度/失败分类学/字段策略/控制态五件事塞一个文件。
4. **`release:check` 刻意留发版期**（docs/public-api-gates.md）：它依赖 npm pack 干跑与干净工作树（`dirty-working-tree` 会 fail），做每提交门会误报或退化成空操作。
5. **naming lint 的 src/ parked**：`lint-naming.mjs:6-9` src/ 规则被携带但不扫描，等 SN4 un-park（C3/SD-5-phase2 决策）。
6. **daemon 命名≠进程**：`mode:'daemon'` 字面量与 "daemon" 目录名是历史词，当前是 daemon-less 设计；`DaemonState`/`JobStore` 是文件型持久化，不起常驻进程。

---

## 五、附录 A：关键入口索引（全子系统）

跨 14 个分区汇总的核心公共/被消费符号，共 141 条，供快速定位。

| 子系统 | 符号 | 文件 | 角色 |
| --- | --- | --- | --- |
| `shared` | `applyOutputBudget / CORE_TOOL_OUTPUT_BUDGETS / assertDestructiveResetHasArchive` | `src/shared/OutputBudget.ts` | 每工具输出字节预算表 + UTF-8 安全截断（带 truncated 诚实信号与 overflow 路由）+ 破坏性重置必须带归档 ref 的硬断言；经 ROOT 门面 @alembic/core 被 Alembic/Plugin handler 消费 |
| `shared` | `BaseError / PersistenceError / DivergenceError` | `src/shared/errors/BaseError.ts` | 错误基类与 9 个子类；PersistenceError(PERSISTENCE_ERROR)/DivergenceError(STATE_DIVERGENCE) 是 CO3 write-strict/file-DB 分歧语义，故意不进冻结的 ./shared 门面 |
| `shared` | `CORE_FAILURE_TAXONOMY / validateCoreFailureTaxonomy` | `src/shared/FailureTaxonomy.ts` | 16 种失败 kind→(httpStatus/mcpErrorCode/agentBranch/problemClass/retryPolicy/exposureClass) 的统一冻结映射表 + 交叉一致性校验器 |
| `shared` | `CORE_FIELD_TAXONOMY / validateCoreFieldPolicies` | `src/shared/FieldTaxonomy.ts` | 11 类字段暴露分类学 + 字段策略 shape 校验（closure/consumer/diagnostic/redaction 规则） |
| `shared` | `pathGuard (singleton) / assertProjectWriteSafe` | `src/shared/PathGuard.ts` | 进程级双层写入路径守卫单例，防止 .asd/知识库以外的越界写；configure 一次性冻结 excluded-project 判定 |
| `shared` | `LanguageService (static)` | `src/shared/LanguageService.ts` | 唯一 ext→lang 映射/语言检测源：inferLang/normalize/detectPrimary/detectProfile/detectProjectLanguages/isTestFile |
| `shared` | `LanguageProfiles (static)` | `src/shared/LanguageProfiles.ts` | 8 语言族分析知识注册中心（importPatterns/roles/knownLibraries/thirdPartyPathRegex/baseClassExclusions），lazy 合并缓存，单条 FamilyProfile 增量扩展 |
| `shared` | `extractRecipeTokens / textSimilarity / jaccardSimilarity` | `src/shared/similarity.ts` | Recipe dedup 与 content-impact 的相似度/分词计算内核（配合 recipeTokens.ts / diffParser.ts） |
| `shared` | `CORE_CONTRACT_SPINE_ROWS / CORE_LEGACY_CONTRACT_CONVERGENCE_CANDIDATES` | `src/shared/CoreContractSpine.ts` | D2 公共契约脊柱 9 行 + D9 遗留表面收敛候选账本（含 removalTrigger/validationCommands/消费者扫描命令） |
| `shared` | `timerRegistry (singleton) / Disposable` | `src/shared/TimerRegistry.ts` | 全局定时器与 Disposable 注册中心，shutdown 一键幂等回收；lifecycle.ts 定义 Disposable/Startable 接口 |
| `shared` | `WorkspaceResolver / createProjectDescriptor / resolveProjectScopeForFolder` | `src/shared/WorkspaceResolver.ts` | Ghost 感知的 dataRoot 解析（配合 ProjectScope.ts 纯函数式不可变空间契约与 ProjectRegistry 全局注册表） |
| `shared` | `CORE_DIAGNOSTIC_CODES` | `src/shared/DiagnosticCodes.ts` | 稳定诊断 reason code 常量表（core.diagnostic.<area>.<condition>），renaming 视同破坏性可观测变更 |
| `types-facades` | `exports (60 subpaths)` | `package.json:8` | 包级公共 API 契约表，每条子路径映射到 dist barrel |
| `types-facades` | `createAlembicRepositories / AlembicRepositoryBundle` | `src/repositories.ts:244` | 一次装配 14 个仓储的稳定工厂 + 可枚举 key 契约 |
| `types-facades` | `root re-point block (OutputBudget + error classes)` | `src/index.ts:63` | 把 applyOutputBudget/CORE_*_BUDGETS/DivergenceError/PersistenceError 从冻结 ./shared 迁到根门面作稳定接入路 |
| `types-facades` | `ProjectSnapshot` | `src/types/ProjectSnapshot.ts:1` | Phase1-4 项目快照类型单一真源(SSOT，不可变) |
| `types-facades` | `toResponseData / toSessionCache / PipelineFillView` | `src/types/SnapshotViews.ts:54` | 面向消费者的 snapshot 投影视图与纯函数 |
| `types-facades` | `KnowledgeEntryWire` | `src/types/KnowledgeWire.ts:95` | 后端 toJSON() 与前端 Dashboard 共享的唯一传输合约 |
| `types-facades` | `RecipeSourceRefResolver / RecipeSessionScope` | `src/types/recipeAuthoringSpec.ts:70` | §C.11 把 recipe 门禁的 fs/session I/O 解耦为注入端口 |
| `types-facades` | `makePublicApiBoundaryClassifier / narrowness baselines` | `scripts/public-api-boundary-policy.mjs:48` | 分类器 + 窄度基线校验，强制根门面窄化纪律 |
| `types-facades` | `createProjectContextCapabilities / createRecipeContextCapabilities` | `src/project-context-capabilities.ts:78` | Object.freeze 能力门面，把 execute(kind) 收敛为便捷方法表 |
| `domain` | `KnowledgeEntry` | `src/domain/knowledge/KnowledgeEntry.ts` | 统一知识聚合根：candidate/recipe 同一实体不同 lifecycle 阶段；toJSON 出 KnowledgeEntryWire；getGuardRules 给 GuardCheckEngine 产出规则 |
| `domain` | `Lifecycle / isValidTransition / VALID_TRANSITIONS` | `src/domain/knowledge/Lifecycle.ts` | 六态生命周期状态机 + 转移表 + 消费口径常量 (CONSUMABLE/GUARD/COUNTABLE_LIFECYCLES) + inferKind |
| `domain` | `DIMENSION_REGISTRY / resolvePlanDimensionDefinitions / buildTierPlan` | `src/domain/dimension/DimensionRegistry.ts` | 25 维度唯一真源 + Plan canonical ID→定义解析（不裁剪）+ tierHint 动态分桶 |
| `domain` | `buildDimensionCatalogPayload / buildDimensionSubmissionSpec` | `src/domain/dimension/DimensionCatalogPayload.ts` | draft Pillar B 只投射事实的不可变维度目录 + 提交规范唯一真源（guidance==gate） |
| `domain` | `gateRules / validateAgainst / resolveGroundedSourcePaths` | `src/domain/knowledge/recipe-authoring-spec/gateRules.ts` | Recipe 门禁规则表 + 字节同源执行编排器（typed port 注入保 fs-free）+ 只读接地投影 |
| `domain` | `UnifiedValidator` | `src/domain/knowledge/UnifiedValidator.ts` | 三层验证链（字段/内容质量/去重），stage-3 常量从 gateRules 读取 |
| `domain` | `EvolutionPolicy` | `src/domain/evolution/EvolutionPolicy.ts` | 进化决策纯函数：风险分级/观察窗/update-merge-deprecate 评估/relevance 分类，阈值集中 |
| `domain` | `KnowledgeRepository` | `src/domain/knowledge/KnowledgeRepository.ts` | 抽象仓储契约（contract-vs-impl），实现在 repository 层 |
| `core-ast` | `analyzeFile` | `src/core/AstAnalyzer.ts:250` | 单文件 AST 分析主入口：解析→walk→call-site 二次遍历→继承图→模式检测→指标，返回 AstFileSummary 或 null（降级） |
| `core-ast` | `analyzeProject` | `src/core/AstAnalyzer.ts:329` | 批量多文件分析，产 ProjectAnalysisResult（跨文件继承图/模式统计/聚合指标），被 CodeEntityGraph 消费 |
| `core-ast` | `parseToTree` | `src/core/AstAnalyzer.ts:566` | 低级 API：源码→tree-sitter rootNode，供 ASTChunker（祝福边）语义分块使用 |
| `core-ast` | `findCallExpressions / findPatternInContext / checkProtocolConformance` | `src/core/AstAnalyzer.ts:893` | Guard AST 查询 API，专供 GuardCheckEngine 的 AST 规则 |
| `core-ast` | `loadPlugins` | `src/core/ast/index.ts:204` | 幂等串行加载 11 个 .wasm 语法并 registerLanguage，文件尾顶层 await 自动执行（副作用注册） |
| `core-ast` | `CallGraphAnalyzer.analyze / analyzeIncremental` | `src/core/analysis/CallGraphAnalyzer.ts:95` | 调用图五段流水线顶层编排，分级降级+渐进式超时+增量反向依赖 |
| `core-ast` | `CallEdgeResolver._resolveCallSite` | `src/core/analysis/CallEdgeResolver.ts:197` | 调用点→调用边的四优先级瀑布解析（this/import/local/global）含 CHA/RTA/DI，宁缺勿滥 |
| `core-ast` | `SymbolTableBuilder.build` | `src/core/analysis/SymbolTableBuilder.ts:39` | 从 analyzeProject 结果建全局符号表（declarations/exports/imports/instantiatedClasses/propertyTypes） |
| `core-ast` | `ProjectGraph.build` | `src/core/ast/ProjectGraph.ts:98` | Bootstrap Phase 1 一次性构建的只读项目结构图，支持 incrementalUpdate/toJSON/fromJSON |
| `core-ast` | `ImportRecord` | `src/core/analysis/ImportRecord.ts:28` | 鸭子类型兼容 string 的结构化导入记录（代理 includes/split/toString，携带 symbols/kind/alias/isTypeOnly） |
| `core-discovery` | `ProjectDiscoverer` | `src/core/discovery/ProjectDiscoverer.ts:68` | discoverer 抽象契约：detect/load/listTargets/getTargetFiles/getDependencyGraph 五方法 + DiscoveredTarget/DiscoveredFile/DependencyGraph DTO |
| `core-discovery` | `getDiscovererRegistry` | `src/core/discovery/index.ts:20` | 懒单例，注册 9 个 discoverer（spm/node/python/jvm/go/dart/rust/customConfig/generic） |
| `core-discovery` | `DiscovererRegistry.analyzeConflict/detect/detectAll` | `src/core/discovery/DiscovererRegistry.ts:29` | confidence 竞标选 discoverer + 模糊检测 + 用户偏好提升 |
| `core-discovery` | `CustomConfigDiscoverer` | `src/core/discovery/CustomConfigDiscoverer.ts:339` | 自研/非标准构建系统两级检测 + 7 parser 分派（最大文件 1476 行） |
| `core-discovery` | `collectDiscoveryFacts` | `src/service/project-context/repo/repo.ts:528` | discovery 主消费者：竞标→load→listTargets→getTargetFiles→归一化为 ProjectContext DiscoveryFacts |
| `core-discovery` | `EnhancementPack` | `src/core/enhancement/EnhancementPack.ts:99` | 框架增强包契约：getExtraDimensions/getGuardRules/detectPatterns/preprocessFile/getReferenceSkillPath |
| `core-discovery` | `initEnhancementRegistry` | `src/core/enhancement/index.ts:37` | Promise.allSettled 动态 import 14 个增强包，失败静默跳过 |
| `core-discovery` | `resolveEnhancementGuardRules` | `src/service/guard/EnhancementGuardRules.ts:45` | enhancement 唯一业务消费路径，经 @alembic/core/guard facade 供外层 Guard handler |
| `core-discovery` | `CapabilityProbe.probeStatus` | `src/core/capability/CapabilityProbe.ts:90` | git push --dry-run + 24h 缓存探测子仓库写入范围，不确定保守降级 read-only |
| `infrastructure` | `DatabaseConnection` | `src/infrastructure/database/DatabaseConnection.ts:37` | SQLite 连接/迁移门面：projectRoot 路径解析、Ghost/excluded 重定向、WAL+busy_timeout 并发策略、gap-tolerant migration runner |
| `infrastructure` | `schema (drizzle)` | `src/infrastructure/database/drizzle/schema.ts:24` | 22 业务表的 Drizzle 单一真相，DB 列名权威，实体映射交 repository 层 |
| `infrastructure` | `SignalBus` | `src/infrastructure/signal/SignalBus.ts:56` | 同步发布订阅信号总线，跨 4 仓承重骨架，支持精确/管道/通配订阅，消费者异常隔离 |
| `infrastructure` | `HnswVectorAdapter` | `src/infrastructure/vector/HnswVectorAdapter.ts:29` | VectorStore 生产实现，编排 HNSW 图+SQ8 量化+WAL+.asvec 持久化，2-pass 搜索与维度一致性守卫 |
| `infrastructure` | `HnswIndex` | `src/infrastructure/vector/HnswIndex.ts:155` | 零依赖纯 JS HNSW 近似最近邻图，增量 addPoint/软删 removePoint/2-pass searchKnn |
| `infrastructure` | `chunkByAST / ASTChunker` | `src/infrastructure/vector/ASTChunker.ts:170` | blessed core-leaf：动态 import tree-sitter 按 AST 顶层声明节点语义分块，超大节点递归拆分，失败返回 null 供 fallback |
| `infrastructure` | `WriteZone` | `src/infrastructure/io/WriteZone.ts:53` | 三区(Project/Data/Global) branded-path 写入门面，PathGuard 守卫+EXDEV 降级 |
| `infrastructure` | `AsyncPersistence / WAL_OP` | `src/infrastructure/vector/AsyncPersistence.ts:58` | WAL 崩溃恢复：NDJSON+CRC32 先写日志、定时/批量 flush .asvec、启动 replay 损坏行跳过 |
| `infrastructure` | `PreparedStatementCache.prepareCached` | `src/infrastructure/database/PreparedStatementCache.ts:39` | AD5 blessed 有界缓存：连接域 WeakMap+128 上限 LRU 复用 better-sqlite3 prepared statement |
| `infrastructure` | `Logger` | `src/infrastructure/logging/Logger.ts:119` | winston 单例，MCP 模式 stderr 禁色防污染 JSON-RPC，error/combined/audit 三文件 transport |
| `infrastructure` | `ConfigLoader` | `src/infrastructure/config/ConfigLoader.ts:9` | 三级(default→env→local) deepMerge 配置加载 + Zod 非阻塞校验，包根自动发现 |
| `infrastructure` | `SignalAggregator` | `src/infrastructure/signal/SignalAggregator.ts:35` | 订阅事实型信号做滑窗统计，AD5 ring cap(5000)+溢出诊断码，突增 3 倍发 anomaly，EMA baseline |
| `repository` | `RepositoryBase<TTable,TEntity>` | `src/repository/base/RepositoryBase.ts:40` | Drizzle-first 抽象基类；transaction() 包装 + findById/create/delete 抽象契约 + DrizzleTx 类型 |
| `repository` | `KnowledgeFileStore (interface)` | `src/repository/knowledge/KnowledgeFileStore.ts:26` | B4 写契约接口 serialize/persist/remove/moveOnLifecycleChange；service 的 KnowledgeFileWriter 实现之 |
| `repository` | `KnowledgeUnitOfWork.commit()` | `src/repository/knowledge/KnowledgeUnitOfWork.ts:94` | 文件优先+DB 补偿两阶段提交；DB 失败抛 DivergenceError 不回滚文件 |
| `repository` | `KnowledgeRepositoryImpl` | `src/repository/knowledge/KnowledgeRepositoryImpl.ts:60` | knowledge_entries 统一仓；CRUD+分页+生命周期/统计/Guard 热路径查询+行实体映射 |
| `repository` | `KnowledgeEdgeRepositoryImpl.upsertEdge/bulkInsertIgnore` | `src/repository/knowledge/KnowledgeEdgeRepository.ts:76` | knowledge_edges 图谱边 upsert + Panorama 域 code_entities JOIN 查询 |
| `repository` | `ProposalRepository` | `src/repository/evolution/ProposalRepository.ts:138` | evolution_proposals 去重+观察窗+状态机乐观守卫转移 |
| `repository` | `CoverageLedgerRepository.upsertCell` | `src/repository/evolution/CoverageLedgerRepository.ts:123` | coverage_ledger (module×dimension cell) 与 deep_mining_rounds 的 onConflictDoUpdate upsert |
| `repository` | `SourceGraphRepositoryImpl.replaceGeneration` | `src/repository/source-graph/SourceGraphRepository.ts:153` | 四表代际快照整代替换（清 edges/symbols/files 后逐条 upsert + refreshStats） |
| `repository` | `RecipeSourceRefRepositoryImpl` | `src/repository/sourceref/RecipeSourceRefRepository.ts:42` | Recipe↔源码桥接（复合主键）；contentFp 保鲜/漂移、CO4 分组查询修复 |
| `repository` | `RawDbKnowledgeAdapter / SyncRepo / GuardKnowledgeRepo` | `src/repository/search/SearchRepoAdapter.ts:66` | SearchEngine/SyncService/Guard 的 raw-db 降级适配器（接口+prepareCached 实现） |
| `svc-project-context` | `ProjectContext (singleton) / ProjectContextService` | `src/service/project-context/ProjectContextService.ts` | 9-kind handler 注册表 + facade 单例，公共入口 @alembic/core/project-context |
| `svc-project-context` | `PROJECT_CONTEXT_DEFAULT_HANDLERS` | `src/service/project-context/ProjectContextService.ts` | 把 9 个 RequestKind 映射到各自 handler 的注册表 (:19) |
| `svc-project-context` | `createProjectContext.execute` | `src/service/project-context/interface/projectContext.ts` | canonicalize→dispatch→envelope 管道，顶层 try/catch 降级成 unavailable 信封 (:15) |
| `svc-project-context` | `spaceProjectContextHandler` | `src/service/project-context/space/space.ts` | 空间级：加载原生 ProjectScope、构造 repos/boundaries/projectTree/activeRepo (:85) |
| `svc-project-context` | `mapProjectContextHandler / detectCycleComponents` | `src/service/project-context/map/map.ts` | 项目图：模块聚合 + Tarjan SCC 环检测 + 分层推断 + hotspot (:37,:515) |
| `svc-project-context` | `analyzeArchitectureIntelligence` | `src/service/project-context/architectureIntelligence/architectureIntelligence.ts` | 领域信号/架构风格/复杂度三分类器，消费 presenter 事实 (:566) |
| `svc-project-context` | `aggregateDynamicPlanningSignals` | `src/service/project-context/dimensionPlanning/dimensionPlanning.ts` | 模块 delta/覆盖/proposal/decay 聚合成 frozen planSignals (:33) |
| `svc-project-context` | `createProjectContextCapabilities / ProjectContextCapabilities` | `src/project-context-capabilities.ts` | frozen facade：executeXxxQuery 便捷方法 + 两个能力引擎，公共 package 子路径 (:78) |
| `svc-project-context` | `collectPlanProjectContext` | `src/service/planFacts/collect-project-context.ts` | 主消费方：驱动 space→repo→map→module→module-layers，产 presenterInput 供 plan 使用 (:52) |
| `svc-project-context` | `loadProjectScopeForFolder / readProjectScopeRegistryDocument` | `src/shared/ProjectScope.ts` | 从 ~/.asd project-scopes.json 加载原生空间配置，controlRoot 禁入 folder 不变量 (:697,:751) |
| `svc-knowledge-evolution` | `KnowledgeService` | `src/service/knowledge/KnowledgeService.ts:106` | 知识条目 CRUD + 生命周期转换编排门面：委托实体做转移合法性判定，编排 Repository/FileWriter/Graph/AuditLog/EventBus/afterPublish hook |
| `svc-knowledge-evolution` | `RecipeProductionGateway.create` | `src/service/knowledge/RecipeProductionGateway.ts:340` | 所有 Recipe 生产的统一 6 步管道入口（校验→去重→融合扫描→create→质量评分→supersede 提案） |
| `svc-knowledge-evolution` | `KnowledgeFileWriter` | `src/service/knowledge/KnowledgeFileWriter.ts:81` | 唯一 .md 写策略实现（实现 KnowledgeFileStore 契约）：序列化/解析/落盘/生命周期搬移，文件=真相源 |
| `svc-knowledge-evolution` | `LifecycleStateMachine.transition` | `src/service/evolution/LifecycleStateMachine.ts:110` | 六态生命周期唯一权威（Guard→Exit→DB→Entry→Event→Signal），checkTimeouts/getHealth |
| `svc-knowledge-evolution` | `ProposalExecutor` | `src/service/evolution/ProposalExecutor.ts:61` | 信号驱动的提案执行引擎：订阅 SignalBus→按 EvolutionPolicy 门禁→经状态机+ContentPatcher 执行 update/deprecate，含 re-entrancy 守卫 |
| `svc-knowledge-evolution` | `EvolutionGateway.submit` | `src/service/evolution/EvolutionGateway.ts:82` | 统一进化决策入口（update\|deprecate\|valid），高置信立即执行 / 否则创建信号驱动 Proposal / Guard 拒绝降级为 Proposal |
| `svc-knowledge-evolution` | `DecayDetector.scanAll` | `src/service/evolution/DecayDetector.ts:133` | 衰退检测：5 策略+4 维 decayScore 评分→驱动 active→decaying 迁移+发 decay 信号 |
| `svc-knowledge-evolution` | `StagingManager.checkAndPromote` | `src/service/evolution/StagingManager.ts:111` | staging grace period 到期自动晋级 active（经状态机），有界 cap sweep |
| `svc-knowledge-evolution` | `ContentPatcher.applyProposal` | `src/service/evolution/ContentPatcher.ts:88` | 消费 Proposal.suggestedChanges 的 StructuredPatch，字段白名单内 before/after 快照式打补丁 |
| `svc-knowledge-evolution` | `ConfidenceRouter.route` | `src/service/knowledge/ConfidenceRouter.ts:76` | 6 阶段置信度路由：决定新条目 auto_approve(→staging+grace)/pending/reject(→deprecated) |
| `svc-guard-search-graph-vector` | `GuardCheckEngine` | `src/service/guard/GuardCheckEngine.ts:606` | blessed core-leaf 消费者；正则+code-level+跨文件+AST 四层代码合规检查引擎，产出 GuardViolation 并回写 guard_hit_count / 发射 guard + guard_blind_spot 信号 |
| `svc-guard-search-graph-vector` | `createGuardCheckEngine` | `src/guard.ts:41` | @alembic/core/guard 稳定工厂入口，外层 adapter 通过它构造引擎 |
| `svc-guard-search-graph-vector` | `GuardService` | `src/service/guard/GuardService.ts:78` | Guard 规则生命周期编排（create/enable/disable/list/search over KnowledgeEntry kind=rule），checkCode 优先代理引擎、失败降级 DB-only |
| `svc-guard-search-graph-vector` | `SearchEngine` | `src/service/search/SearchEngine.ts:87` | 统一搜索入口；keyword/weighted/semantic/auto(RRF) 多模式 + 排序管线 + 元数据过滤 + 索引增量刷新 + degraded 观测 |
| `svc-guard-search-graph-vector` | `FieldWeightedScorer` | `src/service/search/FieldWeightedScorer.ts:55` | 默认 Scorer 实现：字段加权(trigger5>title3>tags2>desc1.5>content1>facet0.5) + IDF；小语料结构化召回 |
| `svc-guard-search-graph-vector` | `MultiSignalRanker` | `src/service/search/MultiSignalRanker.ts:259` | 7 信号场景化加权排序 + SignalBus 实时权重订阅 |
| `svc-guard-search-graph-vector` | `SourceGraphQueryService` | `src/service/source-graph/SourceGraphQueryService.ts:153` | 确定性源码关系查询：search/explore/node/callers/callees/impact/affectedTests/validationPlan，带 freshness/diagnostics/证据链与行预算 |
| `svc-guard-search-graph-vector` | `SourceGraphService` | `src/service/source-graph/SourceGraphService.ts:37` | source-graph facade：编排 Indexer/QueryService/Freshness 并按 generationId 分代读写 |
| `svc-guard-search-graph-vector` | `VectorService` | `src/service/vector/VectorService.ts:127` | 统一向量服务：fullBuild/incremental/search/hybridSearch(RRF)/syncEntry/batchSync + embed 熔断器 + getAvailability 分级降级 |
| `svc-guard-search-graph-vector` | `HybridRetriever` | `src/service/search/HybridRetriever.ts:23` | RRF 融合器 score=Σ1/(k+rank)，Dense+Sparse 并行召回免归一化融合 |
| `svc-recipe-candidate-plan` | `validateCandidatesUnified` | `src/service/candidate/CandidateValidationFacade.ts:51` | 统一候选验证入口，组合 aggregateCandidates + RecipeCandidateValidator(V3) + UnifiedValidator，纯合取不弱化任何单验证器 |
| `svc-recipe-candidate-plan` | `RecipeCandidateValidator.validate` | `src/service/recipe/RecipeCandidateValidator.ts:65` | V3 结构化字段校验（content 对象 / trigger / kind / category / headers / reasoning） |
| `svc-recipe-candidate-plan` | `aggregateCandidates` | `src/service/candidate/CandidateAggregator.ts:30` | 批内 title Jaccard 模糊去重（阈值 0.85） |
| `svc-recipe-candidate-plan` | `findSimilarRecipes` | `src/service/candidate/SimilarityService.ts:131` | 候选与磁盘已有 Recipe 的加权相似度检测（title30/summary30/code40），深度/符号链接守卫 |
| `svc-recipe-candidate-plan` | `applyPlanSelection` | `src/service/planIntent/planIntent.ts:111` | 把 host-agent 返回的 PlanSelection 投影成执行维度+预算+模块范围，含 clamp 与 testMode |
| `svc-recipe-candidate-plan` | `validateCompletePlanIntent / normalizeConfirmedPlanIntent` | `src/service/planIntent/planIntent.ts:157` | confirm 阶段完整 PlanIntent 校验与冻结拷贝 |
| `svc-recipe-candidate-plan` | `projectPlanGenerationState / buildCoverage` | `src/service/recipeStatus/recipeStatus.ts:61` | 从 repositories 投影 code↔recipe 映射与覆盖度（planned/generated/stale/missing） |
| `svc-recipe-candidate-plan` | `computeProjectContextSignature` | `src/service/recipeStatus/recipeStatus.ts:171` | 确定性 ProjectContext 签名（sha256 + stableStringify）用于新鲜度比对 |
| `svc-recipe-candidate-plan` | `buildPlanFactsProjection` | `src/service/planFacts/project-info-tree.ts:1006` | 双宿主统一 plan facts 投影：预算化 projectInfoTree + candidateDimensions + projectProfile |
| `svc-recipe-candidate-plan` | `collectPlanProjectContext` | `src/service/planFacts/collect-project-context.ts:52` | honor 原生 ProjectScope 的冷启动 ProjectContext 收集器 |
| `svc-recipe-candidate-plan` | `createRecipeContextService` | `src/service/recipe-context/RecipeContextService.ts:31` | read-only Recipe 上下文门面，按 kind 分发到 6 个 handler |
| `svc-recipe-candidate-plan` | `QualityScorer.score` | `src/service/quality/QualityScorer.ts:95` | 5 维加权咨询性质量评分（A-F），Core 内永不作门禁 |
| `svc-recipe-candidate-plan` | `BootstrapDedup` | `src/service/bootstrap/BootstrapDedup.ts:41` | 冷启动会话级内存去重缓存（4 维权重相似度） |
| `wf-host-agent` | `runHostAgentDimensionCompletionWorkflow` | `src/workflows/capabilities/host-agent/HostAgentDimensionCompletionWorkflow.ts:178` | 宿主 Agent 每维度完成闭环：校验入参→取活跃 session→恢复证据→绑定 Recipe→markDimensionComplete→存 checkpoint/关键发现→回质量反馈+跨维度证据 |
| `wf-host-agent` | `BootstrapSession / BootstrapSessionManager` | `src/workflows/capabilities/host-agent/BootstrapSession.ts:172` | LIVE 会话状态机 + 项目级 lease 管理器；durable 写入 .asd/bootstrap-sessions/active-sessions.json，进程重启可重建 |
| `wf-host-agent` | `buildHostAgentAnalysisPacket / *FromSnapshot / *FromProjectContext` | `src/workflows/capabilities/host-agent/HostAgentAnalysisPacketBuilder.ts:124` | 把 ProjectSnapshot / ProjectContext 投影为压缩无关、稳定 key 的分析包（units + requiredReadSet + completionContract + degraded reasons） |
| `wf-host-agent` | `createHostAgentAnalysisUnitKey` | `src/workflows/capabilities/host-agent/analysis-packet/UnitProgress.ts:13` | 稳定 unit key 生成器：qualifiedSourceRef/folder + fqn + entityType + line/symbol → content-hash 主键；shortAlias 仅展示 |
| `wf-host-agent` | `buildMissionBriefing / buildProjectContextMissionBriefing` | `src/workflows/capabilities/host-agent/MissionBriefingBuilder.ts:1064` | 把 Phase1-4 分析 + 维度 + 提交 schema + tier 执行计划整合成 100KB 预算内的一站式任务简报 |
| `wf-host-agent` | `HostAgentSubmissionTracker.buildQualityReport` | `src/workflows/capabilities/host-agent/HostAgentSubmissionTracker.ts:373` | 对标内部 Agent EvidenceCollector 的 4 维加权质量评分 + 负空间信号提取 + 跨维度累积证据 |
| `wf-host-agent` | `MiningSessionStore (SessionStore)` | `src/workflows/capabilities/host-agent/MiningSessionStore.ts:133` | 维度报告/证据/跨维度上下文/候选摘要/只读缓存的 headless 存储，可序列化进 session、可 checkpoint 落盘 |
| `wf-host-agent` | `getOrCreateSessionManager` | `src/workflows/capabilities/host-agent/SessionSupport.ts:28` | per-dataRoot BootstrapSessionManager 单例解析（blessed lazy lifecycle AD4），跨进程存活 |
| `wf-host-agent` | `buildCompletenessCritic` | `src/workflows/capabilities/host-agent/CompletenessCritic.ts:184` | advisory（永不阻断）完成度评审：接地 hints/覆盖状态/floor-vs-target，noPadding 时诚实标 exhausted |
| `wf-rest` | `createInternalColdStartIntent / createHostAgentColdStartIntent` | `src/workflows/project-index/ColdStartIntent.ts:66,93` | 冷启动双执行者意图工厂(D4)：internal-agent(auto-fill) vs host-agent(dimension-complete) |
| `wf-rest` | `buildProjectIndexWorkflowPlanParts` | `src/workflows/project-index/ProjectIndexPlan.ts:61` | full/incremental 双模式统一 plan 装配器 + ProjectScope 加载 + full-reset 清理根安全断言 |
| `wf-rest` | `buildColdStartWorkflowPlan / buildKnowledgeRescanWorkflowPlan` | `src/workflows/project-index/ColdStartPlan.ts:45 / KnowledgeRescanWorkflowPlan.ts:27` | 两个 workflow 的顶层 plan builder(别名 buildProjectIndexFull/IncrementalPlan) |
| `wf-rest` | `buildKnowledgeRescanPlan` | `src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts:154` | 增量重扫的 gap/execution-mode 决策核心(per-dimension + 可选 per-cell) |
| `wf-rest` | `auditRecipesForRescan` | `src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts:202` | 三层 Recipe 相关性审计 → verdict + dead/drifted→proposal 提交 |
| `wf-rest` | `buildCoverageLedger / writeCoverageLedgerForCompletion / adviseCoverageLedger` | `src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts:188 / CoverageLedgerWrite.ts:61 / CoverageLedgerAdvisor.ts:88` | per-(module×dimension) 覆盖账本 build/write/deepMining 停止建议(全 advisory 非门) |
| `wf-rest` | `FileDiffSnapshotStore / FileDiffPlanner` | `src/workflows/capabilities/persistence/FileDiffSnapshotStore.ts:200 / FileDiffPlanner.ts:77` | 文件指纹快照持久化 + diff/受影响维度推断(增量冷启动引擎) |
| `wf-rest` | `TierScheduler` | `src/workflows/capabilities/planning/dimensions/TierScheduler.ts:56` | 维度三层依赖调度器(层内 p-limit 并行、层间串行) |
| `wf-rest` | `present*ColdStartResponse / present*KnowledgeRescanResponse` | `src/workflows/project-index/ColdStartPresenters.ts:140 / KnowledgeRescanPresenters.ts:71` | 四条 internal/host × cold-start/rescan 的响应投影(envelope 形状稳定契约) |
| `daemon-infra` | `JobStore (class, create/get/list/update/markActiveInterrupted + ALLOWED_STATUS_TRANSITIONS)` | `src/daemon/JobStore.ts:85` | 逐 job JSON 文件持久化 + 状态机转移守卫 + 原子写(tmp+rename,0o600)；重启恢复用 markActiveInterrupted 批量置 failed |
| `daemon-infra` | `resolveDaemonPaths / readDaemonState / writeDaemonState` | `src/daemon/DaemonState.ts:49` | daemon.json/pid/lock 路径解析(带 @scope-singleroot(permanent))+ schemaVersion+token 校验的原子读写；本层唯一运行时状态副作用 |
| `daemon-infra` | `createJobDisplaySnapshot / computeJobDisplaySnapshotChecksum / validateJobDisplaySnapshot` | `src/daemon/JobDisplaySnapshotContracts.ts:268` | 不可变展示快照 + stableStringify+sha256 校验和 + 重启回读校验(checksum_mismatch)+证据不完整诚实标注 |
| `daemon-infra` | `summarizeProjectRuntimeScopeReadiness / PROJECT_RUNTIME_FAILURE_REASON_TAXONOMY / PROJECT_RUNTIME_FIELD_POLICIES` | `src/daemon/ProjectRuntimeContracts.ts:827` | 7 必需服务就绪度归约(最坏态)+14 失败原因映射 Core 规范种类 + 字段级对外契约表(sensitive 字段禁普通输出) |
| `daemon-infra` | `createAlembicResidentCapabilities / resolveAlembicResidentFeatureOwner` | `src/daemon/ResidentServiceContracts.ts:527` | 9 项常驻特性能力矩阵 + owner 归属(api-ai→alembic / host-agent-recoverable→alembic-plugin)+ AlembicResidentServiceResult 判别联合 |
| `daemon-infra` | `createJobProcessEvent / defaultDisplayPolicyForSourceClass / defaultRetentionForSourceClass / createJobProcessDeveloperView` | `src/daemon/JobProcessEventContracts.ts:151` | 作业过程事件契约 + fail-closed 安全默认(仅 developer-facing→full/job-retained;secret/raw-provider/hidden-reasoning→hidden/transient) |
| `daemon-infra` | `createAlembicRuntimeHealthData / createAlembicRuntimeCapabilities / ALEMBIC_JOB_ENDPOINTS` | `src/daemon/RuntimeContracts.ts:231` | /api/v1/daemon/health payload + 六块能力清单 + 路由/文件监视枚举(含 LEGACY_IDE_EDIT_SOURCE compat 别名) |
| `daemon-infra` | `npm run check (composite) 串联 11 gate` | `package.json` | build:check→public-api-boundary→layer-contract→consumer-core-imports→scope-resolution→smoke→output-budgets→space-edges→doctrine→naming→test→lint 的阻断链 |
| `daemon-infra` | `lint-layer-contract.mjs (allowedRuntimeImports 矩阵 + blessedImports 豁免)` | `scripts/lint-layer-contract.mjs:67` | 10 层运行时 import 方向门；type-only 豁免;逐文件 blessed 例外须带书面 reason(仅 migration→domain、ASTChunker→core 两条) |
| `daemon-infra` | `check-output-budgets.mjs (四不变量) / check-space-edges.mjs (DAG 根+工具链底线)` | `scripts/check-output-budgets.mjs:19` | 输出预算表完整性+类别诚实+截断诚实(多字节不裂码点)+破坏性重置须 archiveRef；Core 零空间边、tsc5.9/biome 锁/vitest≥4 底线 |

---

## 六、附录 B：层间依赖与消费关系

各分区自报的依赖（depends on）与消费方（consumed by），与 `config/layer-contract.json` 的运行时依赖矩阵互为印证。

| 子系统 | 层 | 规模 | 依赖 | 消费方 |
| --- | --- | --- | --- | --- |
| `shared` | shared | src/shared/ 全部 38 个文件（约 9112 LOC）；FOCUS 文件全文精读，ProjectScope.ts(922L)/ProjectRegistry.ts/WorkspaceResolver.ts 读取契约与核心算法段 | (无运行时依赖 — layer-contract 规定 shared→nothing)、第三方: zod (schemas)、p-limit (concurrency)、node:crypto/fs/path/child_process/os、类型桥豁免: import type infrastructure/io/WriteZone (ProjectRegistry.ts:16) | Core 内部全部上层（176 处 shared import）：types/domain/core/infrastructure/repository/service/workflows/daemon/root-facade、外层经 package export ./shared: Alembic (main app)、AlembicPlugin、AlembicAgent、OutputBudget/applyOutputBudget/CORE_TOOL_OUTPUT_BUDGETS 经 ROOT 门面 @alembic/core 被 Alembic resident handler 与 Plugin MCP handler 消费、CORE_CONTENT_SLICE_BUDGETS 被 workflows/capabilities/planning/knowledge/RescanEvidenceProjectors.ts 与 host-agent/HostAgentSubmissionTracker.ts 消费 |
| `types-facades` | types + root-facade | src/*.ts 门面 24 文件约 2074 行 + src/types/ 11 文件约 1645 行 + package.json exports(约60条) + config/public-api-boundary.json + scripts/public-api-boundary-policy.mjs(446行) | shared(errors/OutputBudget/PathGuard/ProjectScope/similarity/WorkspaceResolver/folderNames/ProjectRegistry)、types(自身桥层)、domain(knowledge/dimension/evolution/project-context/recipe-context)、core(ast/analysis/discovery/capability/enhancement)、infrastructure(database/drizzle/io/logging/signal/report/vector/config)、repository(knowledge/code/bootstrap/evolution/memory/session/source-graph/sourceref/search/sync/token/guard)、service(knowledge/evolution/candidate/quality/recipe/planIntent/planFacts/recipeStatus/search/vector/guard/project-context/recipe-context/bootstrap)、workflows(cold-start/knowledge-rescan/project-index/capabilities/host-agent/persistence/planning/presentation/shared)、daemon | AlembicAgent (../AlembicAgent, config/core-import-boundary.json)、Alembic 主体 (../Alembic, config/core-import-boundary.json)、AlembicPlugin (../AlembicPlugin, live file: link, core-import-boundary-allowlist.json, plugin-keep-alive 硬约束) |
| `domain` | domain | ~11.4k LOC / 46 files（src/domain 全部；重点精读 KnowledgeEntry/Lifecycle/6 值对象/UnifiedValidator/FieldSpec/gateRules/DimensionRegistry/UnifiedDimension/DimensionCatalogPayload/RecipeDimension/EvolutionPolicy/RecipeSimilarity/Snippet/SourceGraphContracts/ProjectContext/RecipeContext barrels） | shared (LanguageService, recipeTokens, similarity)、types (KnowledgeEntryWire, recipeAuthoringSpec ports — 均 import type 类型桥)、uuid (第三方) | repository/knowledge (KnowledgeFileStore/KnowledgeUnitOfWork/KnowledgeRepositoryImpl)、service/knowledge (KnowledgeService/ConfidenceRouter/RecipeProductionGateway/KnowledgeFileWriter)、service/guard/GuardCheckEngine、service/evolution (LifecycleStateMachine/RedundancyAnalyzer/ConsolidationAdvisor/RecipeImpactPlanner)、service/candidate + service/recipe (validators)、service/planIntent + service/project-context/dimensionPlanning、workflows/capabilities/planning (TierScheduler/BaseDimensions/KnowledgeRescanPlanBuilder/RescanEvidenceProjectors)、workflows/capabilities/host-agent (MissionBriefingBuilder/HostAgentDimensionCompletionWorkflow)、根 facade: src/index.ts + src/knowledge.ts/dimensions.ts/evolution.ts/project-context.ts/recipe-context.ts 对外 @alembic/core 及子路径导出 |
| `core-ast` | core | ~10.7k（src/core/ast 6717 行 + src/core/analysis 2035 行 + 引用的 src/core/AstAnalyzer.ts 1124 行） | shared (packageRoot.RESOURCES_DIR, LanguageService, ProjectScope)、web-tree-sitter (外部 WASM 包)、core/AstAnalyzer.ts (分区上一级但双向耦合的中枢) | infrastructure/vector/ASTChunker.ts (文件级祝福边，懒加载 parseToTree 做语义分块)、service/guard/GuardCheckEngine.ts (矩阵祝福 service->core，AST 规则用 findCallExpressions 等)、service/project-context/fileSymbols/extract.ts + fileFlow/extract.ts (analyzeFile，取符号与调用点)、service/knowledge/CodeEntityGraph.ts (消费 analyzeProject 产出)、workflows/capabilities/host-agent/MissionBriefingBuilder.ts + ProjectIntelligenceRunner (矩阵祝福 workflows->core)、types/projectSnapshotBuilder.ts、core/enhancement/EnhancementPack.ts |
| `core-discovery` | core | discovery ~7617 行(21 文件) + enhancement 3324 行(17 文件) + capability 278 行(2 文件) = ~11.2k；精读 index barrels、ProjectDiscoverer/DiscovererRegistry/DiscovererPreference/SourceScanExclusions/SpmDiscoverer/GenericDiscoverer 全文、CustomConfigDiscoverer 结构+两级检测、ConfigWatcher 头、EnhancementPack/EnhancementRegistry/ReactEnhancement/VueEnhancement 全文、CapabilityProbe 全文、StarlarkParser 头，及 repo.ts/EnhancementGuardRules.ts/facade 消费方 | shared（LanguageService、WorkspaceResolver、ProjectMarkers、resolveProjectRoot、TimerRegistry、SourceScanExclusions）、infrastructure（config/Paths、signal/SignalBus[type-only 桥接]、logging/Logger）、types（DiscoveryFacts 等经 ProjectSnapshot 类型桥接） | service/project-context/repo/repo.ts（collectDiscoveryFacts 主消费 discovery）、service/guard/EnhancementGuardRules.ts + GuardCheckEngine.ts（enhancement 唯一业务消费=产 Guard 规则）、types/projectSnapshotBuilder.ts + types/ProjectSnapshot.ts（enhancement 类型）、src/enhancement.ts / src/capability.ts / @alembic/core/core/discovery（公共 facade 与子路径 exports）、外层 AlembicPlugin / Alembic（经 CoreContractSpine 登记的公共契约，宿主 Agent 冷启动与 Recipe 发布链） |
| `infrastructure` | infrastructure | ~8.4k / 52 files（infrastructure 全量：完整读取 database 全部含 schema.ts 与 001-016 全部迁移、signal 4 文件全量、io/logging/report/event/config 全量、vector 中 ASTChunker/VectorStore/HnswVectorAdapter/VectorMetadataFilter 全量 + HnswIndex/ScalarQuantizer/IndexingPipeline/AsyncPersistence/BinaryPersistence/OllamaEmbedProvider 核心段） | shared (PathGuard, WorkspaceResolver, DiagnosticCodes, TimerRegistry, LanguageService, concurrency/ioLimit, isOwnDevRepo, ProjectMarkers, contentHash, tokenUtils, lifecycle.Startable, schemas/config)、types (跨层类型桥接)、core (仅 ASTChunker 经动态 import core/ast + AstAnalyzer，blessed core-leaf 例外，运行时非静态依赖)、外部 npm: better-sqlite3, drizzle-orm, winston, web-tree-sitter, node:crypto/fs/os/path | repository/ (全部持久化实现经 DatabaseConnection/Drizzle schema/PreparedStatementCache 落盘 SQLite)、service/vector (VectorService 消费 HnswVectorAdapter + OllamaEmbedProvider + IndexingPipeline)、service/search (SearchEngine/MultiSignalRanker/SearchTypes 消费 SignalBus 与向量搜索)、service/knowledge (KnowledgeService/SourceRefReconciler 消费 SignalBus)、service/evolution (ProposalExecutor/StagingManager/DecayDetector/LifecycleStateMachine/RedundancyAnalyzer/EnhancementSuggester 消费 SignalBus 与 evolution_proposals/recipe_warnings 表)、service/guard (GuardCheckEngine/RuleLearner/GuardFeedbackLoop 消费 SignalBus 与 guard_violations 表)、src/guard.ts, src/events.ts 公共门面、workflows/ (经 ReportStore/WriteZone/coverage_ledger 等做覆盖账本与报告)、外层三仓 AlembicAgent/Alembic/AlembicPlugin 经 @alembic/core 包入口间接消费 |
| `repository` | repository | ~7276 行 / 34 文件（src/repository 全量） | shared (errors: DivergenceError/PersistenceError, DiagnosticCodes, sourceContracts, LanguageProfiles, utils/common safeJson*/unixNow)、types (evolution TransitionEvent/TransitionEvidence)、domain (knowledge KnowledgeEntry/inferKind/Lifecycle, evolution EvolutionPolicy, source-graph 工厂与类型, dimension RecipeDimension)、infrastructure (database/drizzle schema+getDrizzle+DrizzleDB, PreparedStatementCache, DatabaseConnection.isSqliteBusyError, logging/Logger) | service 层（KnowledgeSyncService、KnowledgeFileWriter 实现 KnowledgeFileStore、GuardCheckEngine、SearchEngine、SourceRefReconciler、RecipeLifecycleSupervisor/ProposalExecutor/StagingManager、KnowledgeGraphService）、workflows 层（capabilities/coverage 的 CoverageLedgerAdvisor/Builder/Write、Panorama 域 edge/code JOIN、project-intelligence）、src/repositories.ts 根 facade（命名再导出为对外稳定别名）、外层仓库经 package.json exports 子路径 @alembic/core/repository[/base\|bootstrap\|code\|sync] |
| `svc-project-context` | service | ~11.7k lines across 67 files under src/service/project-context (read: ProjectContextService, full interface/ pipeline, space.ts, map.ts, module.ts, fileFlow.ts+extract.ts head, moduleLayers head, anchorRange head, sourceSlice/fileAccess, dimensionPlanning full, architectureIntelligence full, shared barrels); plus domain/project-context contracts, shared/ProjectScope, and consumer service/planFacts/collect-project-context. | domain/project-context（全部 ProjectContext DTO/契约/联合类型）、shared/ProjectScope（原生空间配置注册表加载与解析）、shared/LanguageProfiles、shared/LanguageService（语言/库分类）、shared/contentHash（source-slice 内容哈希）、shared/ProjectRegistry（project-scopes.json 目录定位）、core/discovery（getDiscovererRegistry，blessed core-leaf，repo handler 发现器选择）、core/AstAnalyzer + core/ast（analyzeFile，blessed core-leaf，file-flow/file-symbols 抽取）、domain/dimension（DIMENSION_REGISTRY，dimensionPlanning 用） | service/planFacts/collect-project-context.ts（collectPlanProjectContext，alembic_plan 冷启动前置事实收集，主消费方）、service/planFacts/project-info-tree.ts、project-source-facts.ts、service/recipe-context/RecipeContextService.ts、workflows/capabilities/host-agent/HostAgentAnalysisPacketBuilder.ts、MissionBriefingBuilder.ts、workflows/capabilities/host-agent/analysis-packet/ProjectContextNormalize.ts、Scoring.ts、Types.ts、workflows/capabilities/planning/dimensions/BaseDimensions.ts、外层：@alembic/core/project-context 与 @alembic/core/project-context-capabilities 两个 package 子路径导出，供 AlembicAgent/Alembic/AlembicPlugin 的 recipe_map/graph/plan 链使用 |
| `svc-knowledge-evolution` | service | ~11,666 行（service/knowledge 6,973 + service/evolution 4,693；逐文件精读 KnowledgeService/KnowledgeFileWriter/RecipeProductionGateway/ConfidenceRouter 与 LifecycleStateMachine/StagingManager/ProposalExecutor/DecayDetector/ContentPatcher/EvolutionGateway，其余文件读头部+签名+关联域文件 Lifecycle/EvolutionPolicy/KnowledgeSyncService） | domain/knowledge（KnowledgeEntry, Lifecycle 状态转移表, UnifiedValidator, Relations, RecipeDimension）、domain/evolution（EvolutionPolicy 纯函数门禁, RecipeSimilarity）、repository/knowledge（KnowledgeRepositoryImpl, KnowledgeEdgeRepository, KnowledgeFileStore 契约）、repository/evolution（ProposalRepository, LifecycleEventRepository, GitDiffCheckpointRepository）、repository/sourceref（RecipeSourceRefRepositoryImpl）、infrastructure（SignalBus, Logger, WriteZone, config/Defaults）、shared（PathGuard, sourceContracts, contentHash, ProjectScope, recipeTokens, diffParser, LanguageService）、service/quality（QualityScorer）、service/vector（RecipeRegionVectorIndex, VectorService — 经 RecipeFreshnessService）、service/bootstrap（BootstrapDedup） | AlembicPlugin（宿主 sweep / RecipeProductionGateway 注入的 findSimilarRecipes/consolidationAdvisor/groundedSourcePaths port）、AlembicAgent（in-process AI 主体，通过同一 KnowledgeService/Gateway 提交 Recipe）、workflows 层（KnowledgeRescanWorkflow / dimension-completion 覆盖回写）、daemon 层（DaemonJobRunner tick-on-access 驱动 checkAndPromote/scanAll/checkTimeouts）、Dashboard（生命周期状态分布、proposal 指标、手动 executeOne 按钮） |
| `svc-guard-search-graph-vector` | service | ~13.8k (service/guard 4648 + service/search 3557 + service/source-graph 3067 + service/vector 2519)，逐文件精读 index barrel 与全部实质实现文件 | shared/ (LanguageService, PathGuard, ProjectMarkers, ProjectRegistry, ProjectScope, DiagnosticCodes, constants, errors)、core/ (blessed leaf: AstAnalyzer, enhancement/EnhancementPack+Registry)、domain/ (knowledge/Lifecycle, knowledge/KnowledgeEntry, source-graph domain factories/types)、infrastructure/ (logging/Logger, signal/SignalBus, database/drizzle, io/WriteZone, event/EventBus, vector/VectorStore+IndexingPipeline+OllamaEmbedProvider)、repository/ (KnowledgeRepositoryImpl, SearchRepoAdapter, SourceGraphRepositoryImpl) | AlembicAgent (host-agent tool handlers for code_guard/search)、Alembic 主体 (in-process AI, guardAuditFiles / KnowledgeRescanWorkflow / prime)、AlembicPlugin (portable runtime snapshot, guard/search/vector wiring)、workflows/ (project-intelligence, dimension-completion, knowledge-rescan 消费 SourceGraph 与 vector sync)、repository/search adapters (RawDbGuardAdapter / RawDbKnowledgeAdapter) |
| `svc-recipe-candidate-plan` | service | ~6356 行（src/service 下 recipe-context 26 文件/recipe 3/recipeStatus 3/candidate 4/planFacts 5/planIntent 3/planLedger 3/bootstrap 2/quality 3），另引用 domain/knowledge/UnifiedValidator.ts 与 shared/constants.ts 作交叉证据 | shared (similarity, LanguageService, PathGuard, errors, constants, DiagnosticCodes, LanguageProfiles, ProjectMarkers, ProjectScope, WorkspaceResolver)、domain/knowledge (UnifiedValidator, FieldSpec, recipe-authoring-spec/gateRules)、domain/dimension (DimensionRegistry)、domain/project-context、domain/recipe-context (contracts/types)、infrastructure (config/Paths, logging, io/WriteZone)、core/project-context-capabilities + dimensions + host-agent-workflows (baseDimensions/DimensionDef) | AlembicPlugin (via @alembic/core/recipe-context-capabilities, @alembic/core/plans, @alembic/core/knowledge)、Alembic 主体 in-process AI Agent (plan facts 投影/候选校验/生命周期覆盖)、AlembicCore 内部 KnowledgeService/Gateway (validateCandidatesUnified via knowledge.ts)、host-agent MCP plan-tool (planFacts collect + projection) |
| `wf-host-agent` | workflows | ~8.8k LOC across 22 files under src/workflows/capabilities/host-agent (+ supporting DimensionCheckpoint.ts, CoverageLedgerWrite.ts read for the write-back path) | shared (OutputBudget, PathGuard, contentHash, developerIdentity, resolveProjectRoot/resolveDataRoot, ProjectScope.CanonicalSourceIdentity)、types (ProjectSnapshot, SnapshotViews/toSessionCache, projectSnapshotBuilder, workflows.ts)、domain (dimension/RecipeDimension+DimensionSop+DimensionCatalogPayload, knowledge/FieldSpec+recipe-authoring-spec, project-context)、infrastructure (logging/Logger)、repository (EvolutionCoverageLedgerRepository via repositories.ts barrel)、workflows/capabilities/planning (TierScheduler, KnowledgeRescanPlanner)、workflows/capabilities/presentation (LanguageExtensionBuilder)、workflows/capabilities/coverage (re-exported by barrel)、workflows/capabilities/persistence (DimensionCheckpoint) | AlembicPlugin (MCP tools: alembic_bootstrap / alembic_rescan / alembic_dimension_complete / alembic_prime — via @alembic/core/workflows/capabilities/host-agent and root src/index.ts facade)、Alembic (main app, in-process AI host-agent driving the same workflow/session contracts)、AlembicCore self: workflows/capabilities/coverage (write-back consumer), workflows/capabilities/persistence (DimensionCheckpoint) |
| `wf-rest` | workflows | 约 7.6k LOC(src/workflows/{capabilities/{planning,persistence,presentation,coverage},project-index,cold-start,knowledge-rescan,shared} + src/host-agent-workflows.ts)，实读约 3.1k LOC 核心实现文件全文 + 全部 barrel | shared (WorkflowTypes/OutputBudget/TargetClassifier/PathGuard/ProjectScope/LanguageService/contentHash/concurrency)、types (ProjectSnapshot/workflows 类型桥)、domain (dimension registry/RecipeDimension/EvolutionPolicy)、infrastructure (logging/database drizzle schema)、repository (evolution/CoverageLedgerRepository, sourceref, knowledge, proposal)、service (evolution: EvolutionGateway/LifecycleStateMachine/RecipeImpactPlanner)、core* (blessed leaf — 但本分区实测未直接 import ProjectIntelligenceRunner) | AlembicPlugin (portable runtime，MCP tool 层 alembic_bootstrap/alembic_rescan/alembic_dimension_complete/alembic_plan 的 handler 通过 @alembic/core 子路径消费 plan/presenter/coverage 契约)、Alembic (主体 in-process internal-agent，DaemonJobRunner/KnowledgeRescanWorkflow 消费 buildKnowledgeRescanPlan + coverage ledger writer)、AlembicAgent (host-agent 侧，消费 host-agent-workflows.ts facade 与 HostAgentAnalysisPacket) |
| `daemon-infra` | daemon + tooling | src/daemon/ 约 3590 LOC(8 文件) + scripts/ 约 1500 LOC(15 文件) + package.json check 组合 + vitest.config.ts/tsconfig.json/biome.json + test/ 158 文件分类(重点读四个 Core*Boundary + DaemonState/JobStore 测试头) | shared (WorkspaceResolver, PACKAGE_ROOT, ProjectRegistry, ProjectScope, FailureTaxonomy, FieldTaxonomy, sourceContracts)、types (type-only 桥) | Alembic (主体, 消费 daemon/jobs/health 契约 + api-ai owner)、AlembicPlugin (便携运行时快照, host-agent-recoverable owner + 经 file: 链)、AlembicDashboard (ProjectRuntime 就绪度/字段策略 consumer)、npm run check / CI (11 门禁脚本)、开发者与兄弟仓 CI (lint-consumer-core-imports 扫 Alembic/AlembicAgent/AlembicPlugin) |

---

## 七、生成溯源与使用说明

**如何生成**：本文由一次多 agent 编排（workflow `alembic-core-deep-map`）产出。`src/` 树按分层与规模切成 14 个均衡分区，每个分区由一个只读 agent 真实打开源文件、按 `file:line` 取证并写出中文技术章节；随后一个综合 agent 拿到全部分区摘要写顶层总览与跨切面数据流。控制器（本窗口）按层序程序化拼装为本文件。

- **基线快照**：AlembicCore `main` @ `9ec3050`（工作区另有 1 个未提交 src 文件 `src/domain/knowledge/recipe-authoring-spec/examples/index.ts`，属正在进行的 recipe-authoring 工作，不影响本文架构结论）。
- **规模**：`src/` 528 文件 / 126,562 LOC；9 个源码层 + 根门面；62 个公共导出子路径；161 个测试文件。
- **编排统计**：15 个 agent、约 2,333,264 output token、505 次工具调用、约 857 秒墙钟。

**使用边界**（遵循 AlembicCore 仓库教条）：
- 本文是**编排取证的参考/导航文档**，不是发布物；`file:line` 反映基线快照，行号会随后续提交漂移。
- ProjectContext / 矩阵 / 图谱类描述是**定位证据**；**原始源码读取与仓库测试**（`npm run build:check`、`npm run test`、`npm run check`）才证明当前真实行为。
- 需长期维护本文时，重跑上述 workflow 并对照新 HEAD 更新锚点，而非手工逐行补丁。

**归档位置**：`wakeflow-ledger/AlembicCore/`（本窗口的长期跨仓协作文档目录，符合 Document Destinations 规则）。
