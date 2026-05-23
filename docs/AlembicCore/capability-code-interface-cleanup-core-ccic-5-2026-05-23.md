# AlembicCore CCIC-5 Residual Readiness 回填

日期：2026-05-23
窗口：AlembicCore
任务包：CCIC-P5-C
状态：待总控验收

## 窗口定位

当前窗口定位为 `AlembicCore`。本轮目标仓库职责是维护 `@alembic/core` 的 Headless 内核、package public API、public API boundary / closeout 账本和可复用 deterministic 能力。

本轮承担 `CCIC-P5-C`：基于 Alembic / AlembicPlugin CCIC-4 后 residual Core imports，更新 residual readiness 分类账本，并只做必要 additive facade readiness。

明确不承担：

- 不修改 `Alembic` 或 `AlembicPlugin` consumer import。
- 不删除 Core public export、wildcard export 或 compatibility export。
- 不把 CLI、Codex MCP、Dashboard、Agent runtime、AI provider、tool system 或多渠道交付下沉到 Core。
- 不创建 AlembicTest 测试单；本轮未触发真实项目、Codex plugin cache、Dashboard 手动体验或 daemon HTTP contract 验证。

## 完成范围

- 更新 `config/public-api-boundary.json` 的 `facadeReadiness`：
  - 将 `./core/capability/*` 标为 `consumer-ready-provisional`，目标 `./core/capability`。
  - 将 `./service/quality/*` 标为 `consumer-ready-provisional`，目标 `./service/quality`。
  - 将 `./service/recipe/*` 标为 `consumer-ready-provisional`，目标 `./service/recipe`。
  - 将 `./service/bootstrap/*` 标为 `consumer-ready-provisional`，目标 `./service/bootstrap`。
  - 将 `./domain/knowledge/*` 标为 `consumer-ready-stable`，目标 `./knowledge`。
  - 将 `./domain/evolution/*` 标为 `consumer-ready-stable`，目标 `./evolution`。
  - 将 `./repository/memory/*` 标为 `consumer-ready-stable`，目标 `./memory`。
  - 将 `./workflows/capabilities/*` 标为 `consumer-ready-stable`，目标 `./host-agent-workflows`。
  - 将 `./core/ast/*`、`./infrastructure/database/drizzle/*`、`./infrastructure/database/migrations/*` 标为 `keep-transitional`。
  - 将 `@alembic/core/service/evolution/ContentImpactAnalyzer` 标为 `consumer-ready-stable`，目标 `./evolution` functional impact helpers。
- 在稳定 `src/evolution.ts` facade 中补充 `EvolutionPolicy` 与其相关类型导出，避免外层继续 deep import `domain/evolution/EvolutionPolicy`。
- 新增 `test/PublicResidualReadinessEntrypoints.test.ts`，断言 stable / provisional residual facade 可导入，并保留中文说明注释。

## Residual 分类

| residual 路径 / 入口 | 分类 | 目标 facade | 判断依据 |
| --- | --- | --- | --- |
| `domain/knowledge/{FieldSpec,UnifiedValidator,RecipeReadinessChecker}` | stable | `@alembic/core/knowledge` | `src/knowledge.ts` 已导出字段规范、validator、readiness 和 value objects；Alembic 残留 3 refs 可迁。 |
| `domain/evolution/EvolutionPolicy` | stable | `@alembic/core/evolution` | 本轮新增 `EvolutionPolicy` 到稳定 evolution facade；纯函数策略，无 I/O。 |
| `repository/memory/MemoryRepository` | stable | `@alembic/core/memory` | `src/memory.ts` 已提供 semantic memory repository 构造和实现导出。 |
| `workflows/capabilities/WorkflowCleanupPolicies` | stable | `@alembic/core/host-agent-workflows` | Core 只定义 cleanup policy 编排，实际 CleanupService 仍由外层注入。 |
| `service/evolution/ContentImpactAnalyzer` | stable | `@alembic/core/evolution` | 下游应使用 `assessDiffImpact`、`assessFileImpact`、`assessImpactUnified` 等 functional facade，而不是 deep service class 路径。 |
| `core/capability/CapabilityProbe` | provisional | `@alembic/core/core/capability` | 已有 exact provisional facade；属于运行时 capability support，暂不提升根级 stable。 |
| `service/quality/{FeedbackCollector,QualityScorer}` | provisional | `@alembic/core/service/quality` | exact provisional facade 已导出 DI 所需 service；适合下一波 consumer replacement。 |
| `service/recipe/{RecipeCandidateValidator,RecipeParser}` | provisional | `@alembic/core/service/recipe` | exact provisional facade 已导出 DI 所需 service；适合下一波 consumer replacement。 |
| `service/bootstrap/BootstrapDedup` | provisional | `@alembic/core/service/bootstrap` | exact provisional facade 已导出 workflow support；暂不提升 stable。 |
| `service/candidate`、`types`、`infrastructure/report` | existing provisional | 对应 exact facade | CCIC-4 前已存在 readiness / exact facade；本轮继续保留，不删除。 |
| `core/enhancement` | keep-transitional | `@alembic/core/core/enhancement` | enhancement registry 仍被 runtime 与集成测试消费；本轮无稳定替代入口。 |
| `core/ast/lang-*` | test-only / keep-transitional | `@alembic/core/core/ast/*` | 主要是 Plugin CallGraphAnalyzer 语言 fixture / grammar registration 测试；项目级入口仍优先 `project-intelligence`，但 lang-* 不在本轮收敛。 |
| `infrastructure/database/drizzle/*`、`infrastructure/database/migrations/*` | DB-infrastructure / keep-transitional | 原 deep export | 作为数据库 schema / migration / test fixture 边界保留；不能伪装成 stable product API。 |

## 提交

- AlembicCore 提交：`a60dde335d76e901d31fd32eb7762bee35e7c9ea`
- 提交信息：`chore: classify residual core readiness`
- Core 工作区：干净

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过，TypeScript no-emit 无错误。 |
| `node scripts/public-api-boundary-policy.mjs` | 通过，无输出错误。 |
| `node scripts/check-public-api-boundary.mjs --format json` | 通过，`issueCount=0`，`exportCount=136`，`exactExportCount=75`。 |
| `node scripts/report-public-api-closeout.mjs` | 通过；AlembicAgent `49 refs / issues=0`，Alembic `456 refs / issues=0`，AlembicPlugin `461 refs / issues=0`；replacement readiness `readyRefs=32/51`，其中 stable 7、provisional 25、keep-transitional 19。 |
| `npm run test -- test/PublicResidualReadinessEntrypoints.test.ts test/PublicEvolutionEntrypoints.test.ts test/PublicKnowledgeEntrypoints.test.ts test/PublicDatabaseRepositoryEntrypoints.test.ts` | 通过，4 files / 13 tests。 |
| `npm run lint` | 通过，Biome 检查 423 files。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json` | 通过，`issueCount=0`，`referencesScanned=49`。 |
| `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json` | 通过，`issueCount=0`，`referencesScanned=456`。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json` | 通过，`issueCount=0`，`referencesScanned=461`。 |
| `git diff --check` | 通过。 |

## 遗留风险

- `readyRefs=32/51` 不是下游立即替换许可。Alembic / AlembicPlugin 仍需等总控验收本回填后，另按 CCIC-6 派发 consumer replacement。
- `core/enhancement` 仍保持 transitional；不能为了降低 deep import 数字伪迁移。
- AST lang 模块、Drizzle schema、migration 文件属于 test-only / DB-infrastructure 边界；后续若要删除或改入口，需要专门验证对应 tests 和迁移链路。
- `service/quality`、`service/recipe`、`service/bootstrap`、`core/capability` 仍是 provisional exact facade，不应被写成稳定根 API。

## 下一步建议

- 总控验收本回填后，可在 CCIC-6 派发 Alembic / AlembicPlugin 只替换已分类为 stable / provisional 的 residual imports，并同步收紧各自 core import boundary config。
- Alembic / AlembicPlugin 下一波不得消费 `core/enhancement`、AST lang、database drizzle / migrations 的新 facade，因为 Core 本轮明确为 keep-transitional。
- 若下一波 replacement 发现某个 residual path 仍无法从目标 facade 编译通过，应回填具体 symbol 差距，再回到 Core 做 additive readiness，不要让下游猜接口。
