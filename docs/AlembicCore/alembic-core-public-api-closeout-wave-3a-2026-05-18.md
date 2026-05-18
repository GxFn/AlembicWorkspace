# AlembicCore Public API Closeout Wave 3A

日期：2026-05-18

状态：已完成

执行窗口：`AlembicCore`

## 目标

建立 `@alembic/core` public API closeout inventory，把现有 98 个 `transitional-internal` export 与 61 个 wildcard export 纳入可复现分类，并先落地 no-growth gate，防止迁移期兼容面继续扩大。

本轮只处理 Core 源仓库，不删除仍被 Alembic / AlembicPlugin 使用的 export，不新增 thin facade，不改 Alembic / AlembicPlugin consumer 代码。

## 完成范围

- 更新 `config/public-api-boundary.json`：
  - 新增 `closeout.schemaVersion = 1`。
  - 新增 no-growth 上限：`transitional-internal <= 98`、`wildcardExports <= 61`。
  - 新增人工分类种子：`keep-provisional` 18 项、`must-keep-transitional` 13 项。
- 更新 `scripts/public-api-boundary-policy.mjs`：
  - 增加 closeout category 枚举。
  - 校验 closeout schema、maxCounts、manualCategories、重复项和非法类别。
- 更新 `scripts/check-public-api-boundary.mjs`：
  - 将 no-growth gate 纳入 `npm run lint:public-api-boundary`。
  - 校验 closeout manual category 中的 export 必须仍属于 transitional / wildcard surface。
  - JSON report 输出 `closeoutSummary`。
- 新增 `scripts/report-public-api-closeout.mjs` 与 `npm run report:public-api-closeout`：
  - 从 package exports、Core policy 和 sibling consumer scan 生成 closeout inventory。
  - 对 exact stable/provisional export 做精确排除，避免 `./*` wildcard 误吸稳定 facade 消费。
  - 自动扫描 AlembicAgent / Alembic / AlembicPlugin；缺失 consumer workspace 时跳过，存在时纳入统计。
- 更新 `package.json`：
  - 将 report script 纳入 npm package `files`。
  - 新增 `report:public-api-closeout` 脚本。

## 提交

- 提交 hash：`4679f004c923ab32ad2b5407f6c9dfa7561c840e`
- 提交信息：`Add public API closeout inventory`

## Inventory 摘要

`npm run report:public-api-closeout` 当前输出：

| 类别 | 数量 | 含义 |
| --- | ---: | --- |
| `promote-to-stable` | 0 | 本轮不直接提升，避免在未完成 consumer 替换前承诺过宽 API。 |
| `keep-provisional` | 18 | 适合后续收窄为模块级 provisional facade 的目录级入口，目前没有 sibling consumer refs。 |
| `consumer-replace-first` | 21 | Alembic / AlembicPlugin 已有真实消费，必须先替换或补 facade，不能直接删除。 |
| `no-consumer-deprecate-candidate` | 46 | 当前 sibling consumer 没有命中，可作为后续 deprecate / 删除候选，但仍需 release 兼容窗口。 |
| `must-keep-transitional` | 13 | AST language、Drizzle / migrations、repository bootstrap/sync 等内部链路仍需要保留 transitional 入口。 |

Consumer scan 摘要：

| Consumer | refs | stable | provisional | transitional | closeout refs | issues |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `AlembicAgent` | 48 | 48 | 0 | 0 | 0 | 0 |
| `Alembic` | 598 | 412 | 7 | 179 | 179 | 0 |
| `AlembicPlugin` | 507 | 360 | 8 | 139 | 139 | 0 |

说明：Wave 3A 总控文档创建时 AlembicPlugin 基线是 517 refs；本窗口执行时 sibling workspace 中 AlembicPlugin 已推进到 507 refs。Core 记录执行时扫描结果，不把旧基线写成当前事实。

## 完整分类

### `promote-to-stable`

无。本轮只做 inventory 和 no-growth gate，不新增稳定承诺。

### `keep-provisional`

- `./core`
- `./core/analysis`
- `./core/discovery`
- `./domain/knowledge`
- `./infrastructure/database`
- `./repository`
- `./service/panorama`
- `./workflows`
- `./workflows/capabilities`
- `./workflows/capabilities/execution/external`
- `./workflows/capabilities/persistence`
- `./workflows/capabilities/planning/dimensions`
- `./workflows/capabilities/planning/knowledge`
- `./workflows/capabilities/presentation`
- `./workflows/capabilities/project-intelligence`
- `./workflows/cold-start`
- `./workflows/knowledge-rescan`
- `./workflows/shared`

### `consumer-replace-first`

| Export | refs | consumers |
| --- | ---: | --- |
| `./shared/*` | 69 | Alembic 37；AlembicPlugin 32 |
| `./service/knowledge/*` | 53 | Alembic 29；AlembicPlugin 24 |
| `./service/evolution/*` | 40 | Alembic 20；AlembicPlugin 20 |
| `./infrastructure/config/*` | 18 | Alembic 11；AlembicPlugin 7 |
| `./types/*` | 16 | Alembic 14；AlembicPlugin 2 |
| `./service/candidate/*` | 10 | Alembic 5；AlembicPlugin 5 |
| `./core/capability/*` | 8 | Alembic 4；AlembicPlugin 4 |
| `./infrastructure/signal/*` | 8 | Alembic 4；AlembicPlugin 4 |
| `./service/quality/*` | 8 | Alembic 4；AlembicPlugin 4 |
| `./service/recipe/*` | 8 | Alembic 4；AlembicPlugin 4 |
| `./infrastructure/report/*` | 7 | Alembic 4；AlembicPlugin 3 |
| `./domain/knowledge/values/*` | 6 | Alembic 6 |
| `./repository/evolution/*` | 5 | Alembic 4；AlembicPlugin 1 |
| `./repository/knowledge/*` | 4 | Alembic 3；AlembicPlugin 1 |
| `./repository/token/*` | 4 | Alembic 2；AlembicPlugin 2 |
| `./domain/knowledge/*` | 3 | Alembic 3 |
| `./service/bootstrap/*` | 3 | Alembic 2；AlembicPlugin 1 |
| `./domain/evolution/*` | 2 | Alembic 1；AlembicPlugin 1 |
| `./repository/memory/*` | 2 | Alembic 2 |
| `./repository/sourceref/*` | 2 | Alembic 2 |
| `./workflows/capabilities/*` | 2 | Alembic 2 |

### `no-consumer-deprecate-candidate`

- `./*`
- `./core/*`
- `./core/analysis/*`
- `./core/discovery/*`
- `./core/discovery/parsers/*`
- `./core/enhancement/*`
- `./daemon/*`
- `./domain/*`
- `./domain/dimension`
- `./domain/dimension/*`
- `./domain/snippet/*`
- `./infrastructure/*`
- `./infrastructure/database/*`
- `./infrastructure/event/*`
- `./infrastructure/io/*`
- `./infrastructure/logging/*`
- `./infrastructure/vector`
- `./infrastructure/vector/*`
- `./repository/evolution`
- `./repository/guard`
- `./repository/guard/*`
- `./repository/knowledge`
- `./repository/memory`
- `./repository/search`
- `./repository/search/*`
- `./repository/session`
- `./repository/session/*`
- `./repository/sourceref`
- `./repository/token`
- `./service/*`
- `./service/guard`
- `./service/guard/*`
- `./service/panorama/*`
- `./service/search`
- `./service/search/*`
- `./service/vector`
- `./service/vector/*`
- `./workflows/capabilities/execution/external/*`
- `./workflows/capabilities/persistence/*`
- `./workflows/capabilities/planning/dimensions/*`
- `./workflows/capabilities/planning/knowledge/*`
- `./workflows/capabilities/presentation/*`
- `./workflows/capabilities/project-intelligence/*`
- `./workflows/cold-start/*`
- `./workflows/knowledge-rescan/*`
- `./workflows/shared/*`

### `must-keep-transitional`

| Export | refs | consumers |
| --- | ---: | --- |
| `./core/ast/*` | 26 | Alembic 13；AlembicPlugin 13 |
| `./infrastructure/database/migrations/*` | 6 | Alembic 2；AlembicPlugin 4 |
| `./infrastructure/database/drizzle/*` | 2 | AlembicPlugin 2 |
| `./repository/sync/*` | 2 | Alembic 1；AlembicPlugin 1 |
| `./infrastructure/database/drizzle` | 1 | AlembicPlugin 1 |
| `./repository/base/*` | 1 | AlembicPlugin 1 |
| `./repository/bootstrap/*` | 1 | AlembicPlugin 1 |
| `./repository/code/*` | 1 | AlembicPlugin 1 |
| `./core/ast` | 0 |  |
| `./repository/base` | 0 |  |
| `./repository/bootstrap` | 0 |  |
| `./repository/code` | 0 |  |
| `./repository/sync` | 0 |  |

## 给 Alembic / AlembicPlugin 的反馈

可先替换的 existing stable facade：

- `@alembic/core/infrastructure/config/*`：优先替换为 `@alembic/core/config` 的 `ConfigDefaults` / `ConfigPaths` / `ConfigLoader`。
- `@alembic/core/shared/folder-names`、`ProjectMarkers`、`ProjectRegistry`、`resolveProjectRoot`、`WorkspaceResolver`：优先替换为 `@alembic/core/workspace`。
- `@alembic/core/shared/similarity`：优先替换为 `@alembic/core/search`。
- `@alembic/core/repository/memory/*`：优先确认能否替换到 `@alembic/core/memory` 或 `@alembic/core/repositories`。
- `@alembic/core/domain/knowledge/*`、`domain/knowledge/values/*`：优先确认能否替换到 `@alembic/core/knowledge`。

需要 Core 后续明确 facade 或继续 transitional 的缺口：

- `KnowledgeSyncService`、`SourceRefReconciler`、`ConfidenceRouter`：当前在 `@alembic/core/knowledge` 有部分相关 contract，但外层仍消费 deep service class，需要 Core 下一波判断是否纳入 stable knowledge facade。
- `EvolutionGateway`、`ProposalExecutor`、`DecayDetector`、`RedundancyAnalyzer` 等 service/evolution deep imports：当前 `@alembic/core/evolution` 只稳定部分 type/helper，class runtime 是否稳定需要下一波判断。
- `SimilarityService.findSimilarRecipes` / `CandidateAggregator`：可先评估是否由 `@alembic/core/search` 或 `RecipeProductionGateway` 取代；不能取代的再申请候选服务 facade。
- `CapabilityProbe`：Alembic / Plugin HTTP/MCP role 判断仍消费 deep import，需要 Core 判断是否提升到 `@alembic/core/project-intelligence`、新增 capability facade，或继续 transitional。
- `shared/errors/*`、`shared/schemas/*`、`shared/developer-identity`、`shared/test-mode`、`WorkspaceSettingsStore`：应拆分到稳定 facade 或由外层 adapter 消化，不能继续散落 deep shared import。
- `types/*`：需要按领域拆到现有 stable facade，或新增最小 stable type facade，避免保留大而泛的 `types/*`。
- AST language modules、Drizzle schema、migrations、repository bootstrap/sync：本轮判断为 `must-keep-transitional`，不得在 Alembic / Plugin 窗口直接删除。

## 验证命令

- `npm run lint:public-api-boundary`
- `npm run report:public-api-closeout`
- `node scripts/report-public-api-closeout.mjs --format=json`
- `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json`
- `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json`
- `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json`
- `npm run smoke:public-api`
- `npm run build:check`
- `npm run lint`
- `npm run check`
- `git diff --check`
- `git status --short`

## 验证结果

- `npm run lint:public-api-boundary`：通过。136 package exports classified；75 exact / 61 wildcard；stable 17 / provisional 21 / transitional 98；closeout no-growth 为 transitional `98 <= 98`、wildcard `61 <= 61`。
- `npm run report:public-api-closeout`：通过。生成 98 export closeout inventory；分类为 0 / 18 / 21 / 46 / 13；consumer scan issue 0。
- `node scripts/report-public-api-closeout.mjs --format=json`：通过。输出完整分类数组和 consumer summary。
- AlembicAgent consumer scan：通过。216 files / 48 Core imports / issue 0；stable 48 / provisional 0 / transitional 0。
- Alembic consumer scan：通过。455 files / 598 Core imports / issue 0；stable 412 / provisional 7 / transitional 179。
- AlembicPlugin consumer scan：通过。320 files / 507 Core imports / issue 0；stable 360 / provisional 8 / transitional 139。
- `npm run smoke:public-api`：通过。Imported 75 exact public API entrypoints。
- `npm run build:check`：通过。
- `npm run lint`：通过。Biome checked 415 files，no fixes applied。
- `npm run check`：通过。60 test files / 919 tests passed；Biome 通过。测试过程仍输出既有 `error: Could not access 'HEAD'` 和 `[TestMode] bootstrap dimension filter: arch (1/2)`，退出码为 0。
- `git diff --check`：通过。
- Core 提交后 `git status --short`：干净。

## 遗留风险

- 本轮没有删除任何 export，也没有新增 stable facade；`consumer-replace-first` 仍需要 Alembic / AlembicPlugin 先减量或反馈不可替换点。
- `no-consumer-deprecate-candidate` 是 sibling workspace 当前扫描结果，不等于立刻可删。后续删除仍需要 release 兼容窗口、package smoke 和下游负向扫描。
- `must-keep-transitional` 包含 AST、Drizzle/migration、repository bootstrap/sync 等真实内部链路，后续只能在替代入口完整接入后收敛。
- `./*` catch-all 当前已被报告脚本排除稳定 exact import 的误计数，但它本身仍是 no-consumer deprecate candidate，后续删除前要做 package export 兼容评估。

## 下一步建议

1. Alembic / AlembicPlugin 已完成本轮第一批 consumer boundary reduction，后续进入下一波 facade 决策与继续减量。
2. Core 下一波可按 Alembic / Plugin 回填结果选择最小 facade：优先 knowledge/evolution/capability/shared-errors/types；不要为了降数字把 internal class 直接薄包装成稳定 API。
3. 后续若进入 deprecate / 删除阶段，必须先跑 closeout report、consumer scans、package smoke 和下游负向扫描，不能只依据当前 no-consumer 分类直接删除。
