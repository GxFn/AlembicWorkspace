# AlembicCore Types Workflows Facade Wave 3B-Core-2 Record

日期：2026-05-18
状态：已完成
对应总控文档：`docs/workspace/alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md`
Core 提交：`9506dca8ebcd0d59a208a640c7c373d8efd26a7c`

## 完成范围

- 补齐 `@alembic/core/types` 对 `types/workflows.ts` workflow contract 的 type-only facade 导出，包括 `McpContext`、`WorkflowDatabaseLike`、`WorkflowSkillHooks`、`IncrementalPlan`、`BootstrapFile`、`FileDiffPlan`、`RestoredEpisodicMemory` 等。
- 补齐 `@alembic/core/search` 对 individual ranking signal classes 的 runtime facade 导出，包括 `RelevanceSignal`、`AuthoritySignal`、`RecencySignal`、`PopularitySignal`、`DifficultySignal`、`ContextMatchSignal`、`VectorSignal` 和既有 `MultiSignalRanker`。
- 更新 `scripts/smoke-public-api.mjs`，让 public API smoke 同时检查 `@alembic/core/search` runtime signal exports，以及 built declaration 中的 `@alembic/core/types` workflow type-only contract。
- 更新 `config/public-api-boundary.json` 的 `types/workflows -> types` readiness symbols，记录本次补齐的 workflow 类型。
- 本波没有修改消费层代码、没有删除 wildcard exports、没有更新 vendor / portable runtime / release artifact。

## 边界判断

- `@alembic/core/types` 仍是 provisional public facade；本次只补 type-only contract，不把 `types/*` 或 workflow contract 提升为 stable。
- `@alembic/core/search` 已是 stable public facade；individual signal classes 是现有 `MultiSignalRanker` 真实实现的一部分，本次只是从同一真实模块直接 re-export，不新增 wrapper 或薄接口。
- `IncrementalPlan` 在 `project-snapshot` 和 `workflows` 中存在历史同名类型；`src/types/index.ts` 使用显式 `export type` 暴露 workflow contract，避免 `export *` 造成 re-export 歧义。

## 修改文件

- `src/types/index.ts`
- `src/search.ts`
- `scripts/smoke-public-api.mjs`
- `config/public-api-boundary.json`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build` | 通过，刷新本地 ignored `dist/` 用于 package smoke 与消费层本地验证。 |
| `npm run build:check` | 通过。 |
| `npm run lint:public-api-boundary` | 通过；136 package exports classified；stable 17 / provisional 21 / transitional 98；wildcard 61；no-growth 保持。 |
| `npm run smoke:public-api` | 通过；`Imported 75 exact public API entrypoints.`；同时检查 search signal runtime exports 和 types declaration contract。 |
| `npm run report:public-api-closeout` | 通过；当前 consumer replacement readiness 剩 `@alembic/core/types/workflows -> @alembic/core/types`，`readyRefs=6/6`。 |
| `npm run lint` | 通过；Biome checked 415 files。 |
| `npm run check` | 通过；60 test files / 919 tests passed；Vitest 期间仍出现既有 `Could not access 'HEAD'` 提示但退出码为 0。 |
| AlembicPlugin search facade smoke | 通过；`@alembic/core/search` runtime 中 `RelevanceSignal`、`AuthoritySignal`、`ContextMatchSignal` 均为 function。 |
| AlembicPlugin `SearchRanking.test.ts` | 通过；1 file / 51 tests passed。 |
| Alembic type declaration smoke | 通过；`dist/types/index.d.ts` 包含 `McpContext`、`WorkflowDatabaseLike`、`WorkflowSkillHooks`、`IncrementalPlan`。 |
| `git diff --check` | 通过，无空白错误。 |
| `git status --short` | Core 提交后干净。 |

## 遗留风险

- `@alembic/core/types` 仍为 provisional public facade，下游替换必须继续使用 `import type`，不要引入 runtime import。
- 本次只解除 `types/workflows` 与 search signal facade 缺口；Alembic / AlembicPlugin 还需要各自删除 residual imports、收紧 allowlist，并按总控文档复跑消费层验证。
- `dist/` 已为本地验证重新生成，但仍是 ignored 构建产物，不进入提交。

## 下一步建议

- 派 `Alembic` 删除剩余 `@alembic/core/types/workflows` residual，改到 `@alembic/core/types`，并收紧 `config/core-import-boundary.json`。
- 派 `AlembicPlugin` 删除剩余 `@alembic/core/types/workflows` residual，确认 `SearchRanking.test.ts` 可通过后复跑本波验证；不刷新 portable runtime / vendor / release artifact。
- 两个消费层窗口完成后，总控再用 `npm run report:public-api-closeout` 复核 `types/*` 本波 consumer refs 是否归零，再决定是否进入下一组 consumer replacement 或 Core wildcard closeout。
