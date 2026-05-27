# AlembicCore Facade Readiness Wave 3B Execution Record

日期：2026-05-18
状态：已完成
对应总控文档：`docs/workspace/alembic-core-facade-readiness-wave-3b-core-plan-2026-05-18.md`
Core 提交：`75fac5642b6da736a00667539a720172d23b85c3`

## 完成范围

- 补齐 `@alembic/core/config` exact facade，让 config consumers 可以直接消费 `ConfigLoader`、`ConfigDefaults`、`ConfigPaths`、常用 Defaults 常量和 Paths helpers。
- 在 public API boundary policy 中新增 `closeout.facadeReadiness`，为 `shared / config / types / candidate` 的真实 deep imports 建立目标 facade、决策和替换理由。
- 增强 `report-public-api-closeout`，输出 replacement readiness 汇总、目标 specifier 和按决策分类的 refs 计数。
- 扩展 `smoke-public-api`，覆盖本波目标 facade 的真实 runtime imports；`@alembic/core/types` 作为 type-only facade 保持 importable 检查。
- 本波没有修改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 或 `BiliDili` 代码；没有删除仍被消费的 wildcard exports。

## Readiness 总结

`npm run report:public-api-closeout` 输出：

- replacement readiness：`readyRefs=113/113`
- `consumer-ready-stable=6`
- `consumer-ready-provisional=107`
- `split-required=0`
- `keep-transitional=0`

这表示本波覆盖的 113 个真实 consumer refs 已全部有下一波可执行替换目标。其中 6 个可直接替换到已有 stable facade，107 个可先替换到 exact provisional facade，但暂不宣称 stable。

## Deep Import 替换地图

| 当前 deep specifier | 当前符号 | refs / 文件数 | 消费方 | 目标 facade | 决策 | 风险 |
| --- | --- | ---: | --- | --- | --- | --- |
| `@alembic/core/infrastructure/config/Paths` | `getProjectSkillsPath`、`ConfigPaths` | 10 / 10 | Alembic 6；AlembicPlugin 4 | `@alembic/core/config` | `consumer-ready-provisional` | 命名空间 import 需要改为 `ConfigPaths` 或直接 named helper。 |
| `@alembic/core/shared/test-mode` | `applyTestDimensionFilter`、`getTestModeConfig` | 10 / 8 | Alembic 6；AlembicPlugin 4 | `@alembic/core/shared` | `consumer-ready-provisional` | 测试 mock 需要改 mock facade 入口。 |
| `@alembic/core/shared/developer-identity` | `getDeveloperIdentity` | 9 / 9 | Alembic 4；AlembicPlugin 5 | `@alembic/core/shared` | `consumer-ready-provisional` | 测试 mock 需要改 mock facade 入口。 |
| `@alembic/core/service/candidate/SimilarityService` | `findSimilarRecipes` | 8 / 8 | Alembic 4；AlembicPlugin 4 | `@alembic/core/service/candidate` | `consumer-ready-provisional` | Candidate facade 仍为 provisional，不扩大稳定承诺。 |
| `@alembic/core/shared/errors/BaseError` | `ConstitutionViolation`、`InternalError`、`PermissionDenied` | 8 / 8 | Alembic 4；AlembicPlugin 4 | `@alembic/core/shared` | `consumer-ready-provisional` | 错误类运行时值可替换；消费者要保持错误语义不变。 |
| `@alembic/core/shared/errors/index` | `NotFoundError`、`ValidationError` | 7 / 7 | Alembic 4；AlembicPlugin 3 | `@alembic/core/shared` | `consumer-ready-provisional` | 错误 index 不单独 stable，先收敛到 shared facade。 |
| `@alembic/core/shared/WorkspaceSettingsStore` | `PROVIDER_KEY_ENV`、`WorkspaceSettingsStore` | 7 / 7 | Alembic 2；AlembicPlugin 5 | `@alembic/core/shared` | `consumer-ready-provisional` | 属于共享 runtime support，暂不放入 workspace stable facade。 |
| `@alembic/core/infrastructure/config/Defaults` | `CANDIDATES_DIR`、`RECIPES_DIR`、`ConfigDefaults` | 6 / 6 | Alembic 4；AlembicPlugin 2 | `@alembic/core/config` | `consumer-ready-provisional` | 命名空间 import 需要改为 `ConfigDefaults` 或直接 named constants。 |
| `@alembic/core/shared/concurrency` | `cpuLimit`、`createLimit`、`ioLimit` | 6 / 6 | Alembic 3；AlembicPlugin 3 | `@alembic/core/shared` | `consumer-ready-provisional` | 并发限制器是运行时值，替换后需保留单例语义。 |
| `@alembic/core/types/snapshot-views` | `PipelineFillView` | 6 / 6 | Alembic 6 | `@alembic/core/types` | `consumer-ready-provisional` | type-only 替换；不能引入 runtime import。 |
| `@alembic/core/types/workflows` | `IncrementalPlan`、`McpContext` | 6 / 6 | Alembic 6 | `@alembic/core/types` | `consumer-ready-provisional` | type-only 替换；保持 `import type`。 |
| `@alembic/core/shared/folder-names` | `DEFAULT_FOLDER_NAMES`、`validateFolderNameSegment` | 4 / 4 | Alembic 4 | `@alembic/core/workspace` | `consumer-ready-stable` | 需要改到 workspace stable facade，避免继续从 shared deep import 取 workspace contract。 |
| `@alembic/core/shared/isOwnDevRepo` | `isExcludedProject` | 4 / 4 | Alembic 2；AlembicPlugin 2 | `@alembic/core/shared` | `consumer-ready-provisional` | 仍是开发仓库判断 helper，不提升 stable。 |
| `@alembic/core/shared/schemas/config` | `AppConfigSchema`、`ConstitutionSchema` | 4 / 4 | Alembic 2；AlembicPlugin 2 | `@alembic/core/shared` | `consumer-ready-provisional` | Schema 是 runtime value，消费者替换后需保持 zod schema 引用一致。 |
| `@alembic/core/types/reactive-evolution` | `FileChangeEvent`、`FileChangeEventSource`、`ImpactLevel` | 4 / 4 | Alembic 2；AlembicPlugin 2 | `@alembic/core/types` | `consumer-ready-provisional` | type-only 替换；保持 `import type`。 |
| `@alembic/core/infrastructure/config/ConfigLoader` | `ConfigLoader`、`default` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/config` | `consumer-ready-provisional` | 默认导出可从 config facade 获取；下一波需要确认消费端写法。 |
| `@alembic/core/service/candidate/CandidateAggregator` | `aggregateCandidates` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/service/candidate` | `consumer-ready-provisional` | Candidate aggregation 只进入 candidate facade，不进入 root。 |
| `@alembic/core/shared/content-hash` | `computeContentHash` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/shared` | `consumer-ready-provisional` | 运行时 helper，可替换到 shared facade。 |
| `@alembic/core/shared/diff-parser` | `parseDiffHunks`、`tokenizeDiffLines` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/shared` | `consumer-ready-provisional` | Diff parser 暂不单独 stable；先收敛 import 面。 |
| `@alembic/core/shared/markdown-utils` | `extractCodeBlocksFromMarkdown` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/shared` | `consumer-ready-provisional` | Markdown helper 暂不单独 stable。 |
| `@alembic/core/shared/similarity` | `jaccardSimilarity` | 2 / 2 | Alembic 1；AlembicPlugin 1 | `@alembic/core/search` | `consumer-ready-stable` | 已有 stable search facade，下一波应直接改到 search。 |
| `@alembic/core/shared/constants` | `KNOWLEDGE_CONFIDENCE` | 1 / 1 | Alembic 1 | `@alembic/core/shared` | `consumer-ready-provisional` | 常量可替换，但 shared facade 仍为 provisional。 |
| `@alembic/core/shared/token-utils` | `estimateTokens` | 1 / 1 | Alembic 1 | `@alembic/core/shared` | `consumer-ready-provisional` | Token helper 暂不单独 stable。 |

## 修改文件

- `src/config.ts`：补齐 config facade 直接导出和命名空间导出。
- `config/public-api-boundary.json`：新增 `closeout.facadeReadiness`。
- `scripts/public-api-boundary-policy.mjs`：校验 readiness schema 和决策枚举。
- `scripts/report-public-api-closeout.mjs`：输出 replacement readiness。
- `scripts/smoke-public-api.mjs`：增加目标 facade import smoke。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint:public-api-boundary` | 通过；136 exports classified；stable 17 / provisional 21 / transitional 98；no-growth 保持 98 / 61。 |
| `npm run report:public-api-closeout` | 通过；replacement readiness `113/113`，Alembic / AlembicPlugin / AlembicAgent consumer scan issue 均为 0。 |
| `npm run smoke:public-api` | 通过；`Imported 75 exact public API entrypoints.` |
| `npm run build:check` | 通过。 |
| `npm run lint` | 通过；Biome checked 415 files。 |
| `npm run check` | 通过；60 test files / 919 tests passed；Vitest 期间出现既有 `Could not access 'HEAD'` 提示但退出码为 0。 |
| Alembic consumer scan | 通过；issue 0；598 refs，stable 412 / provisional 7 / transitional 179。 |
| AlembicPlugin consumer scan | 通过；issue 0；507 refs，stable 360 / provisional 8 / transitional 139。 |
| AlembicAgent consumer scan | 通过；issue 0；48 refs，stable 48 / transitional 0。 |
| `git diff --check` | 通过，无空白错误。 |
| `git status --short` | Core 提交后干净。 |

## 遗留风险

- `@alembic/core/shared`、`@alembic/core/config`、`@alembic/core/types`、`@alembic/core/service/candidate` 本波仍是 consumer-ready provisional，不是 stable 承诺。
- 下游测试里的 dynamic import / mock 需要跟随 facade 入口一起替换，否则会继续锁定 deep specifier。
- `@alembic/core/types` 目标替换必须保持 `import type`，避免 type-only contract 变成 runtime import。
- 本地为 public API smoke 重新生成了 ignored `dist/`，但 `dist/` 不进入提交。

## 下一步建议

开启 Wave 3B-Consumer，仅派 `Alembic` 和 `AlembicPlugin`：

- 先替换 `@alembic/core/shared/folder-names` 到 `@alembic/core/workspace`，以及 `@alembic/core/shared/similarity` 到 `@alembic/core/search`。
- 再按本表替换 config / shared / types / candidate 到 exact provisional facade。
- 替换后收紧各自 Core import boundary allowlist/reference limits，并回填 consumer scan、build/check/lint 结果。
- 不要在 consumer wave 删除 Core wildcard exports；删除只能在替换、扫描和代表性验证都完成后另开 closeout wave。
