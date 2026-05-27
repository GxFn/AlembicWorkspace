# AlembicCore Capability Code Interface Cleanup CCIC-3

日期：2026-05-23
窗口：AlembicCore
任务包：CCIC-P3-C
状态：已完成，待总控验收
对应计划：../workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md

## 窗口定位

当前窗口定位：`AlembicCore`。

目标仓库职责：`AlembicCore` 是 `@alembic/core` 源码仓库，负责共享、确定性、可复用、可运行的 Headless 内核能力。

本轮任务职责：为 Alembic / AlembicPlugin 下一波 high-reference deep import consumer replacement 补齐真实可消费的 Core facade readiness，重点覆盖 `knowledge`、`evolution`、`repositories`、`events` 和 `core/enhancement` 判断。

明确不承担：

- 不删除、重命名或收紧任何 Core public export。
- 不修改 Alembic / AlembicPlugin consumer。
- 不把 CLI、Codex MCP、Dashboard、AI provider、Agent runtime 或 Plugin runtime 下沉 Core。
- 不新增无真实消费方的空 facade。
- 不运行真实项目测试。

## 完成范围

已读取：

- workspace `AGENTS.md`
- `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md`
- `AlembicCore/AGENTS.md`
- `src/knowledge.ts`
- `src/evolution.ts`
- `src/repositories.ts`
- `src/database.ts`
- `src/infrastructure/signal/index.ts`
- `src/infrastructure/report/index.ts`
- `package.json`
- `config/public-api-boundary.json`

已完成：

- `src/knowledge.ts` additive export：
  - 补齐 `CodeEntityGraph`、`ConfidenceRouter`、`KnowledgeFileWriter`、`KnowledgeGraphService`、`KnowledgeSyncService`、`RecipeExtractor`、`SourceRefReconciler`、`rewriteRecipePaths`、`computeKnowledgeHash`、`parseKnowledgeMarkdown` 等高引用 knowledge service / helper。
  - 保留既有 `KnowledgeService`、`RecipeProductionGateway` 和 domain contracts，不删除任何旧 deep export。
- `src/evolution.ts` additive export：
  - 补齐 `ConsolidationAdvisor`、`ContentPatcher`、`DecayDetector`、`EnhancementSuggester`、`EvolutionGateway`、`LifecycleStateMachine`、`ProposalExecutor`、`RecipeImpactPlanner`、`RedundancyAnalyzer`、`StagingManager`。
  - 补齐 `assessDiffImpact`、`assessFileImpact`、`assessImpactUnified`、`extractRecipeTokens`、`tokenizeIdentifiers` 等 diff impact / token helper。
- `src/repositories.ts` additive export：
  - 补齐 `KnowledgeRepositoryImpl`、`KnowledgeEdgeRepositoryImpl`、`CodeEntityRepositoryImpl`、`RecipeSourceRefRepositoryImpl`、`ProposalRepository`、`WarningRepository` 等 high-reference repository implementation / contracts。
  - 补齐 `RawDbSyncAdapter` / `SyncRepo` 和 `TokenUsageStore`，支持外层 DI 从 `@alembic/core/repositories` 替代深路径导入。
  - 未把 `TokenUsageStore` 加入 `ALEMBIC_REPOSITORY_KEYS` 或 `createAlembicRepositories()` bundle；它仍由外层 runtime 用 raw DB / Drizzle 句柄显式构造。
- `config/public-api-boundary.json` readiness map：
  - `./service/knowledge/*` -> `./knowledge`，`consumer-ready-stable`。
  - `./service/evolution/*` -> `./evolution`，`consumer-ready-stable`。
  - `./repository/evolution/*`、`./repository/knowledge/*`、`./repository/sourceref/*`、`./repository/sync/*`、`./repository/token/*` -> `./repositories`，`consumer-ready-stable`。
  - `./infrastructure/signal/*` -> `./events`，`consumer-ready-stable`。
  - `./infrastructure/report/*` -> `./infrastructure/report`，`consumer-ready-provisional`。
  - `@alembic/core/core/enhancement` 继续保持 `keep-transitional`，原因是 Enhancement registry 当前仍被 Alembic / AlembicPlugin runtime 和 tests 消费，暂无本轮稳定替代 facade。
- 测试：
  - 新增 `test/PublicEvolutionEntrypoints.test.ts`。
  - 更新 `test/PublicKnowledgeEntrypoints.test.ts`。
  - 更新 `test/PublicDatabaseRepositoryEntrypoints.test.ts`。

## 提交 Hash

AlembicCore 提交：

```text
5994a058038217635580cf68358c0e133c73f747
```

提交说明：

```text
chore: expose high reference core facades
```

提交文件：

```text
config/public-api-boundary.json
src/evolution.ts
src/knowledge.ts
src/repositories.ts
test/PublicDatabaseRepositoryEntrypoints.test.ts
test/PublicEvolutionEntrypoints.test.ts
test/PublicKnowledgeEntrypoints.test.ts
```

## 验证命令与结果

已执行：

```text
npm run build:check
npm run test -- test/PublicKnowledgeEntrypoints.test.ts test/PublicEvolutionEntrypoints.test.ts test/PublicDatabaseRepositoryEntrypoints.test.ts test/PublicFoundationEntrypoints.test.ts test/PublicApiInventory.test.ts
node scripts/public-api-boundary-policy.mjs
node scripts/check-public-api-boundary.mjs --format json
node scripts/report-public-api-closeout.mjs
npm run lint
node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json
node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json
node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json
git diff --check
git status --short
```

结果：

- `npm run build:check` 通过。
- Targeted Vitest 通过：5 files / 22 tests。
- `node scripts/public-api-boundary-policy.mjs` 通过，无输出。
- `node scripts/check-public-api-boundary.mjs --format json` 通过，`issueCount=0`；package export 数量未变化：136 exports、75 exact、61 wildcard、`stable-public=17`、`provisional-public=21`、`transitional-internal=98`。
- `node scripts/report-public-api-closeout.mjs` 通过：closeout inventory 98 exports / 61 wildcard；`consumer-replace-first=16`、`no-consumer-deprecate-candidate=51`、`must-keep-transitional=13`；consumer scans 均为 `issues=0`。
- Replacement readiness：`readyRefs=117/117`；`consumer-ready-stable=110`、`consumer-ready-provisional=7`、`split-required=0`、`keep-transitional=0`。
- 三个 consumer boundary 扫描均通过：
  - Alembic：370 files / 483 `@alembic/core` imports。
  - AlembicPlugin：334 files / 500 `@alembic/core` imports。
  - AlembicAgent：230 files / 49 `@alembic/core` imports。
- `npm run lint` 通过，Biome checked 422 files。
- `git diff --check` 通过。
- `git status --short` 无输出，AlembicCore 工作区干净。

## 遗留风险

- 本轮只提供 Core 上游 readiness，不执行 Alembic / AlembicPlugin consumer replacement；外层 deep imports 仍需下一波由各自窗口替换。
- `@alembic/core/core/enhancement` 暂无稳定替代 facade，继续保留 transitional exact entry；不得在下游窗口中伪迁移或删除。
- `ReportStore` 目前只给到 `@alembic/core/infrastructure/report` provisional exact entry；若后续需要稳定 `report` facade，应单独设计，不在本轮临时新增。
- Core public API 面仍较大，136 exports / 61 wildcard / 98 transitional-internal；本轮未进入删除阶段。

## 下一步建议

- Alembic / AlembicPlugin 下一波 consumer replacement 可按以下路径替换：
  - `@alembic/core/service/knowledge/*` -> `@alembic/core/knowledge`
  - `@alembic/core/service/evolution/*` -> `@alembic/core/evolution`
  - `@alembic/core/repository/{evolution,knowledge,sourceref,sync,token}/*` -> `@alembic/core/repositories`
  - `@alembic/core/infrastructure/signal/*` -> `@alembic/core/events`
  - `@alembic/core/infrastructure/report/ReportStore` -> `@alembic/core/infrastructure/report`，仍按 provisional 处理。
- Alembic / AlembicPlugin 暂不处理 `@alembic/core/core/enhancement`，等 Enhancement stable facade 或独立收敛计划确认后再做。
- 总控验收本轮 Core 后，可把 `CCIC-TODO-14` 的 Core readiness 部分关闭，并把 `CCIC-TODO-16` 从观察中推进为下一波外层 consumer replacement 候选。
