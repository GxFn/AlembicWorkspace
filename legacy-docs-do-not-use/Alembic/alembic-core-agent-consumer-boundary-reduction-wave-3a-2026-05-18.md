# Alembic Core / Agent Consumer Boundary Reduction Wave 3A

日期：2026-05-18
窗口：Alembic
状态：已完成

## 完成范围

- 将 Alembic 主仓库内全部 `@alembic/core/domain/dimension*` transitional imports 收敛到稳定 facade `@alembic/core/dimensions`。
- 覆盖 DI、MCP handlers、cleanup、internal-agent bootstrap/rescan runtime，以及相关 integration / unit tests。
- 收紧 `config/core-import-boundary.json`：删除 `@alembic/core/domain/dimension`、`@alembic/core/domain/dimension/DimensionCopy`、`@alembic/core/domain/dimension/DimensionSop`、`@alembic/core/domain/dimension/RecipeDimension` 四个 transitional specifier 及其 frozen/reference limits；新增稳定入口 `@alembic/core/dimensions`。
- 保持 Agent extraction boundary 不回退：local Agent duplicate、generic Tool V2 duplicate、terminal duplicate 均为 0。
- 未触碰 release、vendor、remote pointer、npm publish 或 portable runtime 入口。

## 提交

- Alembic：`6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31` (`chore: reduce core dimension boundary imports`)

## 验证命令

```bash
rg -n '@alembic/core/domain/dimension' lib test bin scripts config -g '*.ts' -g '*.js' -g '*.mjs' -g '*.json'
npm run lint:core-import-boundary
npm run lint:agent-extraction-boundary
npm run build:check
node --input-type=module -e "await Promise.all(['@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context','@alembic/agent/domain','@alembic/agent/prompts','@alembic/agent/runtime','@alembic/agent/service'].map((specifier)=>import(specifier))); console.log('agent public import smoke ok');"
rg -n 'file:vendor/AlembicCore' package.json package-lock.json config scripts bin lib test
npm run check
node scripts/core-source-command.mjs lint-consumer-imports --format=json
```

## 验证结果

- `@alembic/core/domain/dimension` 负向扫描：0 命中。
- `npm run lint:core-import-boundary`：通过；扫描 455 files / 598 `@alembic/core` imports；issue 0。
- `npm run lint:agent-extraction-boundary`：通过；local Agent relative imports 0；local Agent duplicate 0；generic Tool V2 duplicate 0；terminal duplicate 0；`@alembic/agent/tools` consumer files 33、`tools/v2` 4、`tools/terminal` 10 保持 host-owned 消费形态。
- `npm run build:check`：通过。
- Agent public import smoke：通过，10 个 Alembic 当前消费的 Agent public subpaths 均可导入。
- `file:vendor/AlembicCore` 默认入口负向扫描：0 命中。
- `npm run check`：通过；Biome 仍输出既有 warning，但命令退出码为 0，本轮未修改相关 warning 文件。
- Core consumer JSON scan：issue 0；stable-public 412、provisional-public 7、transitional-internal 179。与基线相比，dimension transitional specifier 清零，但总 import 数仍为 598，因为替换为稳定 facade 后引用数量不变。

## 剩余 Core facade 缺口

- Knowledge service runtime：`CodeEntityGraph`、`ConfidenceRouter`、`KnowledgeFileWriter`、`KnowledgeGraphService`、`KnowledgeSyncService`、`RecipeExtractor`、`SourceRefReconciler` 仍通过 `@alembic/core/service/knowledge/*` 消费；`@alembic/core/knowledge` 当前没有覆盖这些 host wiring 需要的构造类/契约。
- Evolution runtime：`ConsolidationAdvisor`、`ContentPatcher`、`DecayDetector`、`EnhancementSuggester`、`EvolutionGateway`、`LifecycleStateMachine`、`ProposalExecutor`、`RedundancyAnalyzer`、`StagingManager`、`ContentImpactAnalyzer`、`EvolutionPolicy` 等仍缺稳定 facade 判断；`@alembic/core/evolution` 当前只覆盖部分 rescan/impact planner contract。
- Candidate services：`SimilarityService.findSimilarRecipes`、`CandidateAggregator` 仍无稳定 candidate facade；`@alembic/core/search` 只覆盖 search engine / similarity primitives，不等价于 candidate service contract。
- Repository implementation constructors：Alembic DI 仍需要部分 repository implementation / concrete store 类型；`@alembic/core/repositories` 已覆盖 bundle/factory 和部分类型别名，但尚未替代所有直接构造或动态类型引用。

## 遗留风险

- 本轮只做已有 stable facade 能安全覆盖的替换，没有迁移 service/evolution、service/knowledge、candidate 或 repository implementation imports，避免在 Core 未明确 contract 前改变宿主 wiring。
- Core consumer scan 仍有 179 transitional-internal references，需要 Core Wave 3A closeout inventory 决定 promote、keep-provisional、consumer-replace-first 或 must-keep-transitional。
- `npm run check` 输出既有 Biome warning，当前非阻塞；如果后续把 warning 升为 error，需要独立清理，不属于本轮边界替换。

## 下一步建议

- 等 AlembicCore 给出 Knowledge / Evolution / Candidate / Repository facade 决策或提交后，Alembic 再做下一批 consumer replacement。
- 继续保持 `config/core-import-boundary.json` no-growth 口径；新增 Core specifier 必须说明 stable/provisional/transitional 分类。
- 下一轮 Alembic 可优先处理 Core 已经明确稳定的 repository type alias 或 evolution facade，避免一次性触碰 runtime-heavy DI 构造链。
