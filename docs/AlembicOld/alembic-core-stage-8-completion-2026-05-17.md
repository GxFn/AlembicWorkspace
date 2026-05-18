# AlembicCore 阶段 8 完成记录

日期：2026-05-17
范围：Core 仓库内的 knowledge / candidate / recipe / sourceRef / deterministic evolution / panorama / quality 服务闭包
状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行
Core 提交：`8a0706f Migrate knowledge service core`

## 1. 本阶段目标

把 Alembic / AlembicPlugin 共同需要的确定性知识生产链路迁入 `@alembic/core`。

本阶段迁入的是不依赖 Alembic internal agent、MCP tool runtime、HTTP transport、Dashboard delivery 或具体 AI provider 的服务内核：

- 候选去重聚合与相似度服务。
- Recipe 解析、候选校验、统一生产 Gateway。
- KnowledgeService CRUD、生命周期、关系同步、质量更新、发布后外层 hook。
- SourceRef 健康检查、rename repair、path rewrite。
- CodeEntityGraph 与 CodeEntityRepository。
- 确定性 evolution 计划、proposal、衰退检测、内容 patch、staging 管理。
- Panorama 结构扫描、模块发现、角色细化、耦合/层级/健康聚合。
- QualityScorer 与 FeedbackCollector。

本阶段不迁 Alembic 自身 agent 能力，不迁 tool system，不迁多渠道交付实现。

## 2. 已迁入 Core 的文件

Repository：

- `src/repository/code/CodeEntityRepository.ts`
- `src/repository/code/index.ts`

Bootstrap service：

- `src/service/bootstrap/BootstrapDedup.ts`
- `src/service/bootstrap/index.ts`

Candidate / recipe / quality：

- `src/service/candidate/CandidateAggregator.ts`
- `src/service/candidate/SimilarityService.ts`
- `src/service/candidate/index.ts`
- `src/service/recipe/RecipeCandidateValidator.ts`
- `src/service/recipe/RecipeParser.ts`
- `src/service/recipe/index.ts`
- `src/service/quality/FeedbackCollector.ts`
- `src/service/quality/QualityScorer.ts`
- `src/service/quality/index.ts`

Knowledge：

- `src/service/knowledge/CodeEntityGraph.ts`
- `src/service/knowledge/ConfidenceRouter.ts`
- `src/service/knowledge/KnowledgeGraphService.ts`
- `src/service/knowledge/KnowledgeService.ts`
- `src/service/knowledge/RecipeExtractor.ts`
- `src/service/knowledge/RecipePathRewriter.ts`
- `src/service/knowledge/RecipeProductionGateway.ts`
- `src/service/knowledge/SourceRefReconciler.ts`
- `src/service/knowledge/index.ts`

Evolution：

- `src/service/evolution/ConsolidationAdvisor.ts`
- `src/service/evolution/ContentImpactAnalyzer.ts`
- `src/service/evolution/ContentPatcher.ts`
- `src/service/evolution/DecayDetector.ts`
- `src/service/evolution/EnhancementSuggester.ts`
- `src/service/evolution/EvolutionGateway.ts`
- `src/service/evolution/LifecycleStateMachine.ts`
- `src/service/evolution/ProposalExecutor.ts`
- `src/service/evolution/RecipeImpactPlanner.ts`
- `src/service/evolution/RedundancyAnalyzer.ts`
- `src/service/evolution/StagingManager.ts`
- `src/service/evolution/index.ts`

Panorama：

- `src/service/panorama/CouplingAnalyzer.ts`
- `src/service/panorama/DimensionAnalyzer.ts`
- `src/service/panorama/LayerInferrer.ts`
- `src/service/panorama/ModuleDiscoverer.ts`
- `src/service/panorama/PanoramaAggregator.ts`
- `src/service/panorama/PanoramaScanner.ts`
- `src/service/panorama/PanoramaService.ts`
- `src/service/panorama/PanoramaTypes.ts`
- `src/service/panorama/RoleRefiner.ts`
- `src/service/panorama/TechStackProfiler.ts`
- `src/service/panorama/index.ts`

Types / package exports：

- `src/types/reactive-evolution.ts`
- `src/types/index.ts`
- `src/service/index.ts`
- `src/repository/index.ts`
- `package.json` exports for `service/bootstrap`、`candidate`、`recipe`、`knowledge`、`evolution`、`panorama`、`quality`、`repository/code`。

## 3. 关键边界决策

### 3.1 KnowledgeService 不再触达 CursorDelivery / ServiceContainer

源实现中的 `publish()` 会异步加载外层 `ServiceContainer` 并触发 `cursorDeliveryPipeline`。Core 内不保留这个依赖。

Core 现在提供 `afterPublish?: () => void | Promise<void>` 注入 hook：

- Alembic 外层可以注入 CursorDelivery / Dashboard refresh。
- AlembicPlugin 可以注入自己的 Codex 通知或保持空实现。
- Core 本身只负责生命周期状态与持久化，不实现任何交付渠道。

### 3.2 ModuleService 留在外层

`lib/service/module/ModuleService.ts` 直接依赖 `#agent/service/index.js`、AI provider、Dashboard AI settings 和扫描 agent task。它属于外层编排和 agent 能力，不进入阶段 8 Core。

### 3.3 FileChangeDispatcher 与实时触发留在外层

以下文件没有迁入 Core：

- `lib/service/FileChangeDispatcher.ts`
- `lib/service/evolution/FileChangeHandler.ts`
- `lib/service/evolution/DaemonFileChangeCollector.ts`
- `lib/service/evolution/FileChangeSourceTracker.ts`

原因：

- 它们承担 HTTP/MCP/daemon 事件接入、实时 IDE 文件变更、dispatcher subscriber wiring。
- Core 已迁入可复用的确定性分析与执行内核：`ContentImpactAnalyzer`、`RecipeImpactPlanner`、`EvolutionGateway`、`ProposalExecutor`、`DecayDetector`。
- 外层实时入口后续应调用 Core 内核，而不是把 dispatcher/transport 搬入 Core。

### 3.4 PanoramaScanner 保留，但只指向 Core project-intelligence

`PanoramaScanner` 原来动态 import `#workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.js`。Core 版本改为引用已迁入 Core 的：

- `src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`

这让 Panorama 的结构扫描闭环留在 Core，同时不引入 MCP handler 或 agent runtime。

### 3.5 RecipeImpactPlanner 不依赖 Evolution Agent runtime

`RecipeImpactPlanner` 原来引用 `../../agent/runs/evolution/EvolutionAgentRun.js` 的 `EvolutionAuditRecipe` 类型。Core 版本改成本地导出最小审计输入契约，保留数据形状，不依赖外层 agent runtime。

### 3.6 KnowledgeFileWriter / KnowledgeSyncService 不重复复制

`KnowledgeFileWriter` 与 `KnowledgeSyncService` 已在阶段 4 迁入 Core，本阶段没有覆盖它们，只补齐同目录下尚未迁入的服务闭包。

## 4. 已迁移测试

迁入并修正 import 的测试：

- `test/unit/BootstrapDedup.test.ts`
- `test/unit/ConsolidationAdvisor.test.ts`
- `test/unit/DecayDetector.test.ts`
- `test/unit/KnowledgeService.test.ts`
- `test/unit/LayerInferrer.test.ts`
- `test/unit/PanoramaAggregator.test.ts`
- `test/unit/PanoramaScanner.test.ts`
- `test/unit/PanoramaService.test.ts`
- `test/unit/Phase2-PanoramaIntegration.test.ts`
- `test/unit/RecipeImpactPlanner.test.ts`
- `test/unit/SourceRefReconciler-signal.test.ts`
- `test/unit/content-patcher.test.ts`
- `test/unit/production-gateway.test.ts`
- `test/helpers/panorama-mocks.ts`

覆盖重点：

- Bootstrap session 去重。
- RecipeProductionGateway validation / similarity / consolidation / quality path。
- KnowledgeService CRUD、lifecycle、quality、confidence routing。
- SourceRefReconciler stale signal 与 repair path。
- RecipeImpactPlanner deleted/modified/stale diff 计划与 deterministic submission。
- ConsolidationAdvisor、DecayDetector、ContentPatcher。
- PanoramaService、PanoramaAggregator、PanoramaScanner、LayerInferrer 与 Phase2 panorama 行为。

## 5. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

```bash
npm run build:check
npm run test
npm run lint
npm run build
node --input-type=module -e "const knowledge=await import('@alembic/core/service/knowledge'); const candidate=await import('@alembic/core/service/candidate'); const recipe=await import('@alembic/core/service/recipe'); const evolution=await import('@alembic/core/service/evolution'); const panorama=await import('@alembic/core/service/panorama'); const quality=await import('@alembic/core/service/quality'); const bootstrap=await import('@alembic/core/service/bootstrap'); const code=await import('@alembic/core/repository/code'); console.log(JSON.stringify({KnowledgeService:!!knowledge.KnowledgeService, SourceRefReconciler:!!knowledge.SourceRefReconciler, aggregateCandidates:!!candidate.aggregateCandidates, RecipeParser:!!recipe.RecipeParser, RecipeImpactPlanner:!!evolution.RecipeImpactPlanner, PanoramaService:!!panorama.PanoramaService, QualityScorer:!!quality.QualityScorer, BootstrapDedup:!!bootstrap.BootstrapDedup, CodeEntityRepositoryImpl:!!code.CodeEntityRepositoryImpl}, null, 2));"
```

结果：

- TypeScript build check 通过。
- Vitest 44 个测试文件通过。
- Vitest 843 个测试通过。
- Biome lint 通过，保留 baseline warnings。
- 实际构建通过。
- service/knowledge、candidate、recipe、evolution、panorama、quality、bootstrap、repository/code entrypoints 的 self-reference import smoke 全部通过。
- 测试输出中存在 `error: Could not access 'HEAD'`，来自 diff 影响评估在无 HEAD 环境下走容错路径；Vitest 退出码为 0。
- Core 工作区提交后干净。

## 6. 外层仓库接入任务

以下任务由其他窗口执行；本窗口不直接修改 Alembic / AlembicPlugin。

### 6.1 接入前置条件

- 两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到 `8a0706f` 或之后提交。
- 阶段 1-7 的外层 import 必须已经收敛。
- 外层仍保留 provider、DI、CLI、MCP、HTTP、Dashboard、delivery、tool runtime。

### 6.2 Alembic 接入

建议替换 imports：

- `#service/knowledge/KnowledgeService.js` → `@alembic/core/service/knowledge/KnowledgeService`
- `#service/knowledge/ConfidenceRouter.js` → `@alembic/core/service/knowledge/ConfidenceRouter`
- `#service/knowledge/KnowledgeGraphService.js` → `@alembic/core/service/knowledge/KnowledgeGraphService`
- `#service/knowledge/SourceRefReconciler.js` → `@alembic/core/service/knowledge/SourceRefReconciler`
- `#service/knowledge/RecipeExtractor.js` → `@alembic/core/service/knowledge/RecipeExtractor`
- `#service/knowledge/RecipePathRewriter.js` → `@alembic/core/service/knowledge/RecipePathRewriter`
- `#service/knowledge/RecipeProductionGateway.js` → `@alembic/core/service/knowledge/RecipeProductionGateway`
- `#service/knowledge/CodeEntityGraph.js` → `@alembic/core/service/knowledge/CodeEntityGraph`
- `#service/candidate/*` → `@alembic/core/service/candidate/*`
- `#service/recipe/*` → `@alembic/core/service/recipe/*`
- `#service/quality/*` → `@alembic/core/service/quality/*`
- `#service/evolution/{ConsolidationAdvisor,ContentImpactAnalyzer,ContentPatcher,DecayDetector,EnhancementSuggester,EvolutionGateway,LifecycleStateMachine,ProposalExecutor,RecipeImpactPlanner,RedundancyAnalyzer,StagingManager}.js` → `@alembic/core/service/evolution/*`
- `#service/panorama/*` → `@alembic/core/service/panorama/*`
- `#repository/code/CodeEntityRepository.js` → `@alembic/core/repository/code/CodeEntityRepository`
- `#types/reactive-evolution.js` → `@alembic/core/types/reactive-evolution`
- `#service/bootstrap/BootstrapDedup.js` → `@alembic/core/service/bootstrap/BootstrapDedup`

构造器 / wiring 要点：

- `KnowledgeService` 由外层继续注入 `auditLogger`、`gateway`、`knowledgeGraphService`、`fileWriter`、`skillHooks`、`confidenceRouter`、`qualityScorer`、`eventBus`、`edgeRepo`、`proposalRepo`。
- Alembic 如需发布后交付，给 Core `KnowledgeService` 注入 `afterPublish`，在该 hook 内触发 CursorDelivery / Dashboard refresh。
- `RecipeProductionGateway` 的 `knowledgeService`、`similarityService`、`consolidationAdvisor`、`proposalRepo`、`qualityScorer` 仍由外层容器组装。
- `PanoramaService` / `PanoramaAggregator` / `PanoramaScanner` 使用 Core class，外层只保留 route/handler/DI。
- `EvolutionGateway` / `ProposalExecutor` / `LifecycleStateMachine` 使用 Core class，外层只保留触发入口和 agent 判断流程。

保留在 Alembic：

- `lib/service/module/ModuleService.ts`
- `lib/service/FileChangeDispatcher.ts`
- `lib/service/evolution/FileChangeHandler.ts`
- `lib/service/evolution/DaemonFileChangeCollector.ts`
- `lib/service/evolution/FileChangeSourceTracker.ts`
- `lib/agent/**`
- `lib/tools/**`
- `lib/injection/**`
- `lib/service/delivery/**`
- Dashboard / Realtime / HTTP / MCP / CLI handlers。
- provider、API key、model config、chat/embedding adapter。

建议扫描：

```bash
rg -n "from ['\"](#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution|#service/bootstrap/BootstrapDedup|\\.\\.?/.*lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|\\.\\.?/.*lib/repository/code)" lib bin test
```

边界保留检查：

```bash
rg -n "ModuleService|FileChangeDispatcher|FileChangeHandler|DaemonFileChangeCollector|FileChangeSourceTracker|ServiceContainer|CursorDelivery|Dashboard|chatWithStructuredOutput|aiProvider|OpenAI|Gemini|Claude|lib/agent|lib/tools" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- KnowledgeService production-gateway RecipeImpactPlanner SourceRefReconciler DecayDetector Panorama
```

### 6.3 AlembicPlugin 接入

AlembicPlugin 接入方式与 Alembic 相同，但要特别注意：

- Codex plugin 不需要 Alembic internal agent、tool system 或多渠道交付实现。
- Plugin MCP handlers 只调用 Core service，并由 Codex 宿主 agent 执行分析/提交。
- Plugin 不应引入 Alembic `ServiceContainer` 或 CursorDelivery。
- Plugin 内如果有 `git-diff-checkpoint` 之类插件专属 evolution 辅助，本阶段不要求迁入 Core，先保留在 Plugin 外层。

建议扫描：

```bash
rg -n "from ['\"](#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution|#service/bootstrap/BootstrapDedup|\\.\\.?/.*lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|\\.\\.?/.*lib/repository/code)" lib bin test
```

建议验证：

```bash
npm run build:check
npm run test -- KnowledgeService production-gateway RecipeImpactPlanner SourceRefReconciler DecayDetector Panorama
```

## 7. 删除计划

只有在两个外层仓库完成接入、扫描无遗留、代表测试通过后，才执行删除。

可删除候选：

- `lib/repository/code/CodeEntityRepository.ts`
- `lib/service/bootstrap/BootstrapDedup.ts`
- `lib/service/candidate/CandidateAggregator.ts`
- `lib/service/candidate/SimilarityService.ts`
- `lib/service/recipe/RecipeCandidateValidator.ts`
- `lib/service/recipe/RecipeParser.ts`
- `lib/service/quality/FeedbackCollector.ts`
- `lib/service/quality/QualityScorer.ts`
- `lib/service/knowledge/CodeEntityGraph.ts`
- `lib/service/knowledge/ConfidenceRouter.ts`
- `lib/service/knowledge/KnowledgeGraphService.ts`
- `lib/service/knowledge/KnowledgeService.ts`
- `lib/service/knowledge/RecipeExtractor.ts`
- `lib/service/knowledge/RecipePathRewriter.ts`
- `lib/service/knowledge/RecipeProductionGateway.ts`
- `lib/service/knowledge/SourceRefReconciler.ts`
- `lib/service/evolution/ConsolidationAdvisor.ts`
- `lib/service/evolution/ContentImpactAnalyzer.ts`
- `lib/service/evolution/ContentPatcher.ts`
- `lib/service/evolution/DecayDetector.ts`
- `lib/service/evolution/EnhancementSuggester.ts`
- `lib/service/evolution/EvolutionGateway.ts`
- `lib/service/evolution/LifecycleStateMachine.ts`
- `lib/service/evolution/ProposalExecutor.ts`
- `lib/service/evolution/RecipeImpactPlanner.ts`
- `lib/service/evolution/RedundancyAnalyzer.ts`
- `lib/service/evolution/StagingManager.ts`
- `lib/service/panorama/**`
- `lib/types/reactive-evolution.ts`

不删除：

- `lib/service/knowledge/KnowledgeFileWriter.ts` 和 `KnowledgeSyncService.ts` 的外层副本应按阶段 4 接入计划处理，不归本阶段删除。
- `lib/service/module/ModuleService.ts`
- `lib/service/FileChangeDispatcher.ts`
- `lib/service/evolution/FileChangeHandler.ts`
- `lib/service/evolution/DaemonFileChangeCollector.ts`
- `lib/service/evolution/FileChangeSourceTracker.ts`
- Plugin-only `lib/service/evolution/git-diff-checkpoint/**`
- `lib/agent/**`
- `lib/tools/**`
- `lib/injection/**`
- `lib/service/delivery/**`
- CLI/MCP/HTTP/Dashboard/daemon/transport/provider wiring。

删除前最终扫描：

```bash
rg -n "lib/service/(knowledge|candidate|recipe|quality|evolution|panorama)|#service/(knowledge|candidate|recipe|quality|evolution|panorama)|#repository/code|#types/reactive-evolution" lib bin test
```

如果扫描仍命中可删除候选文件，先完成 import 替换，不要直接删除。
