# Core Public API Phase 5 Plugin Search / Vector / Guard 接入记录

日期：2026-05-17
范围：AlembicPlugin 仓库
依据：workspace `docs/alembic-core-public-api-boundary-construction-plan-2026-05-17.md` Phase 5

## 目标

本阶段只处理 AlembicPlugin 对 Core Search / Vector / Guard 稳定入口的接入，不移动 Codex MCP tool、tool schema、policy、response envelope、Skill、marketplace/channel 发布、AI provider、API key readiness 或模型调用策略。

Phase 5 的稳定入口：

- `@alembic/core/search`
- `@alembic/core/vector`
- `@alembic/core/guard`

## Core 版本

`vendor/AlembicCore` 已前进到 `7865bf3`。

本阶段实际需要的 Core facade 来自其中的 `ffa05eb feat: add stable core API facades`，包括：

- `AlembicCore/src/search.ts`
- `AlembicCore/src/vector.ts`
- `AlembicCore/src/guard.ts`
- `AlembicCore/test/PublicSearchVectorGuardEntrypoints.test.ts`

## 完成批次

### Search 批次

以下旧入口已改为 `@alembic/core/search`：

- `@alembic/core/repository/search/SearchRepoAdapter`
- `@alembic/core/service/search/SearchEngine`
- `@alembic/core/service/search/SearchTypes`
- `@alembic/core/service/search/HybridRetriever`
- `@alembic/core/service/search/CoarseRanker`
- `@alembic/core/service/search/FieldWeightedScorer`
- `@alembic/core/service/search/MultiSignalRanker`
- `@alembic/core/service/search/contextBoost`
- `@alembic/core/service/search/tokenizer`

覆盖的 Plugin 文件包括：

- `lib/bootstrap.ts`
- `lib/cli/KnowledgeSyncService.ts`
- `lib/external/mcp/handlers/search.ts`
- `lib/injection/ServiceContainer.ts`
- `lib/injection/ServiceMap.ts`
- `lib/injection/modules/AppModule.ts`
- `lib/injection/modules/GuardModule.ts`
- `lib/injection/modules/KnowledgeModule.ts`
- `lib/service/search/CrossEncoderReranker.ts`
- `lib/service/signal/HitRecorder.ts`
- `lib/service/task/IntentExtractor.ts`
- `lib/service/task/PrimeSearchPipeline.ts`

### Guard 批次

以下旧入口已改为 `@alembic/core/guard`：

- `@alembic/core/service/guard/GuardCheckEngine`
- `@alembic/core/service/guard/ComplianceReporter`
- `@alembic/core/service/guard/CoverageAnalyzer`
- `@alembic/core/service/guard/ExclusionManager`
- `@alembic/core/service/guard/GuardFeedbackLoop`
- `@alembic/core/service/guard/GuardService`
- `@alembic/core/service/guard/RuleLearner`
- `@alembic/core/service/guard/UncertaintyCollector`
- `@alembic/core/service/guard/ViolationsStore`

覆盖的 Plugin 文件包括：

- `lib/external/mcp/handlers/guard.ts`
- `lib/http/routes/guard.ts`
- `lib/http/routes/guardReport.ts`
- `lib/injection/ServiceMap.ts`
- `lib/injection/modules/GuardModule.ts`

Codex MCP tool definition、policy、preflight 和 human-readable result formatting 继续留在 Plugin。

### Vector 批次

以下旧入口已改为 `@alembic/core/vector`：

- `@alembic/core/infrastructure/vector/*`
- `@alembic/core/service/vector/VectorService`
- `@alembic/core/service/vector/SyncCoordinator`
- `@alembic/core/service/vector/EnrichmentTypes`

覆盖的 Plugin 文件包括：

- `lib/injection/ServiceMap.ts`
- `lib/injection/modules/KnowledgeModule.ts`
- `lib/injection/modules/VectorModule.ts`
- `lib/service/vector/ContextualEnricher.ts`

embedding provider 装配、API key 读取、workspace settings readiness、模型选择、重试限流继续留在 Plugin。

### 测试批次

同步替换了现有测试里的 Search / Vector / Guard deep import，避免旧路径继续作为新测试模板：

- `test/integration/*Guard*.test.ts`
- `test/integration/SearchPipeline.test.ts`
- `test/integration/SignalIntegration.test.ts`
- `test/integration/IndexingPipeline.test.ts`
- `test/integration/PrimeInjection.test.ts`
- `test/integration/DiagPrime.test.ts`
- `test/integration/GoSupport.test.ts`
- `test/unit/*Search*.test.ts`
- `test/unit/*Vector*.test.ts`
- `test/unit/HnswVector.test.ts`
- `test/unit/CoverageAnalyzer.test.ts`
- `test/unit/UncertaintyCollector.test.ts`

## Boundary gate

AlembicPlugin 仓库的 `config/core-import-boundary-allowlist.json` 已更新：

- `phase`: `Phase 1 baseline with Phase 2/3/4/5 gates`
- `referenceCount`: `852`
- `uniqueSpecifierCount`: `174`
- 新增稳定入口：`@alembic/core/search`、`@alembic/core/vector`、`@alembic/core/guard`
- 移除旧 Search / Vector / Guard deep path allowlist：
  - `@alembic/core/repository/search/*`
  - `@alembic/core/service/search/*`
  - `@alembic/core/service/vector/*`
  - `@alembic/core/service/guard/*`
  - `@alembic/core/infrastructure/vector/*`

阶段 5 后禁止新增上述旧 deep path。

## 验证

已通过：

```bash
npm run lint:core-import-boundary
npm run build:check
```

额外执行：

```bash
./node_modules/.bin/biome check --write <Phase 5 touched files>
```

结果：自动整理 import / format。剩余提示为既有 lint warning，例如 `lib/bootstrap.ts` 的 non-null assertion 和部分测试里的 implicit any / unused import，不属于本阶段行为变更。

## 后续入口

下一阶段按主计划进入 Phase 6：Project Intelligence 与 Grammar 资源边界。

Plugin 侧重点：

- discovery、LanguageService、AST/tree-sitter、call graph、panorama 的稳定入口接入。
- Core 提供 grammar 资源契约和可用性检测。
- Plugin 继续负责 Codex package/channel 资源复制、插件缓存路径、发布渠道包装。
- AST/grammar 不可用必须降级，不应阻断完整 host-agent knowledge mining workflow。
