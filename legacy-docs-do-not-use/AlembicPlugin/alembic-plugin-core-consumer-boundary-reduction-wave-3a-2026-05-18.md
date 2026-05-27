# AlembicPlugin Core Consumer Boundary Reduction Wave 3A

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成
总控入口：`docs/workspace/alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md`

## 任务边界

本轮只处理 AlembicPlugin 作为 Core consumer 的接口边界收敛：

- 减少已有 stable facade 可覆盖的 `@alembic/core` transitional imports。
- 收紧 `config/core-import-boundary-allowlist.json` 的 allowed specifiers / reference limits。
- 保持 `@alembic/agent` 0 依赖、root registry publish disabled、Codex embedded runtime 的 `@alembic/core: file:vendor/AlembicCore` 例外不被误删。
- 不做 release / npm publish / runtime artifact refresh / vendor pointer 同步。

## 完成范围

已替换到稳定 Core facade 的调用点：

- `@alembic/core/domain/knowledge/FieldSpec` → `@alembic/core/knowledge`
- `@alembic/core/domain/knowledge/UnifiedValidator` → `@alembic/core/knowledge`
- `@alembic/core/domain/knowledge/values/*` → `@alembic/core/knowledge`
- `@alembic/core/repository/memory/MemoryRepository` → `@alembic/core/memory`
- `@alembic/core/repository/sourceref/RecipeSourceRefRepository` 测试类型断言 → `SourceRefRepository` from `@alembic/core/repositories`
- `@alembic/core/domain/dimension` → `@alembic/core/dimensions`

同时删除 `KnowledgeAPI.test.ts` 中已失效的 `RecipeReadinessChecker` deep mock；当前 handler 已使用 `UnifiedValidator`，测试直接覆盖真实 hints 行为。

`config/core-import-boundary-allowlist.json` 已同步收紧：

- `referenceCount`：`634` → `507`
- `uniqueSpecifierCount`：`96` → `79`
- 删除 13 个已替换或已无命中的旧 transitional specifier / limit。

Core import scan 结果：

- 基线：320 files / 517 imports；stable 357 / provisional 8 / transitional 152
- 完成后：320 files / 507 imports；stable 360 / provisional 8 / transitional 139

## 提交

- AlembicPlugin：`170f52a407914ebf1d484e269980c40cc6eee90c` (`chore: tighten plugin core import boundary`)

## 验证命令

- `npm run lint:core-import-boundary`
- `npm run report:agent-extraction-boundary`
- `npm run verify:release-package-boundary`
- `npm run verify:codex-plugin`
- `npm run smoke:codex-plugin`
- `npm run build:check`
- `npm run check`
- `npm run test:unit -- test/unit/KnowledgeAPI.test.ts test/unit/KnowledgeEntry.test.ts test/unit/RecipeImpactPlanner.test.ts`
- `rg -n "@alembic/agent" package.json package-lock.json lib bin config scripts plugins test channels .github`
- `rg -n "@alembic/core/(domain/dimension|domain/knowledge/(FieldSpec|RecipeReadinessChecker|UnifiedValidator|values)|repository/memory/MemoryRepository|repository/sourceref/RecipeSourceRefRepository)" lib test bin scripts config`
- `git diff --check`

## 验证结果

- `npm run lint:core-import-boundary` 通过：320 files / 507 `@alembic/core` imports / issue 0。
- `npm run report:agent-extraction-boundary` 通过：agent / AI / tool boundary imports 全 0。
- `npm run verify:release-package-boundary` 通过：root registry publish disabled，root package private，embedded runtime dependency 保持 `file:vendor/AlembicCore`。
- `npm run verify:codex-plugin` 通过：`runtime.tgz` → `alembic-ai@0.1.2`。
- `npm run smoke:codex-plugin` 通过：install / stdio / npxRuntime passed，recovery / daemon skipped。
- `npm run build:check` 通过，Core build 使用 workspace `../AlembicCore`。
- `npm run check` 通过；Biome 仍报告既有 warning/info，但命令退出 0，本轮未扩大。
- Focused unit tests 通过：3 files / 107 tests passed；Vitest 仍输出既有 `Could not access 'HEAD'` 提示，不影响退出码。
- `@alembic/agent` 负向扫描 0 命中。
- 已替换的 Core deep import 负向扫描 0 命中。
- `git diff --check` 通过。

## 剩余 Core Facade 缺口

以下 deep imports 仍不应在 Plugin 单侧强行替换；需要 AlembicCore Wave 3A closeout inventory 决定稳定 facade、provisional facade 或继续 transitional allowlist：

- `service/knowledge` runtime wiring：`CodeEntityGraph`、`ConfidenceRouter`、`KnowledgeFileWriter`、`KnowledgeGraphService`、`KnowledgeSyncService`、`RecipeExtractor`、`RecipePathRewriter`、`SourceRefReconciler`。Core 已有 `./service/knowledge` provisional exact export，但稳定 `@alembic/core/knowledge` 只覆盖部分 gateway/service contract。
- `service/evolution` runtime classes：`ConsolidationAdvisor`、`ContentPatcher`、`DecayDetector`、`EnhancementSuggester`、`EvolutionGateway`、`LifecycleStateMachine`、`ProposalExecutor`、`RecipeImpactPlanner`、`RedundancyAnalyzer`、`StagingManager`。稳定 `@alembic/core/evolution` 当前只覆盖部分 types/functions，不覆盖多数 class constructors。
- `service/candidate`：`CandidateAggregator`、`SimilarityService` 仍无稳定 facade。
- repository / database implementation constructors 与 migration helpers：个别测试和 DI wiring 仍需要具体 repository constructor、Drizzle schema 或 migration module；稳定 `@alembic/core/repositories` 已覆盖 bundle 和部分 type aliases，但未覆盖所有 per-repository constructor / migration 场景。
- config/shared helper deep paths：`Defaults`、`Paths`、`ConfigLoader`、部分 `shared/*` helper 仍依赖 provisional 或 transitional 子路径；需要 Core 决定是否 promote `@alembic/core/config` / `@alembic/core/shared` 还是保留窄 allowlist。

## 遗留风险

- 本轮未刷新 `runtime.tgz`，因为源码 import boundary 收敛不改变 Codex portable runtime artifact 内容要求；`verify:codex-plugin` 和 `smoke:codex-plugin` 已确认当前 artifact 仍有效。
- Core stable facade 未覆盖的服务类和 repository constructor 仍保留在 allowlist；后续必须等待 Core 侧给出稳定入口或明确保留 transitional 口径。
- `npm run check` 仍输出既有 Biome warning/info；本轮未处理这些非任务范围问题。

## 下一步建议

- 等待 AlembicCore Wave 3A closeout inventory 回填 stable promotion / provisional keep / transitional keep 决策。
- Core 如果 promote `service/knowledge`、`service/evolution`、`service/candidate`、repository constructor 或 config/shared facade，AlembicPlugin 再做下一批 consumer replacement。
- 继续保持 Plugin agent-free、artifact-only release 边界；不得恢复 root npm registry publish，也不得引入 `@alembic/agent`。
