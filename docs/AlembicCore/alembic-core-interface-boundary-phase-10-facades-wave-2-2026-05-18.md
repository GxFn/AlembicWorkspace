# AlembicCore Interface Boundary Phase 10 Facades Wave 2

日期：2026-05-18
窗口：AlembicCore
状态：已完成

本文记录 Core Wave 2A：实现 `AlembicAgent` 后续移除剩余 Core allowlist 所需的窄 public facades。实现遵循总控要求：不新增空壳、不稳定化 raw Drizzle schema、不把 Agent 能力迁入 Core。

## 1. 完成范围

- `@alembic/core/search` 新增导出 `cosineSimilarity`、`jaccardSimilarity`、`textSimilarity`、`tokenizeForSimilarity`，供 Agent memory retrieval / lexical similarity 替代 `@alembic/core/shared/similarity`。
- 新增稳定入口 `@alembic/core/evolution`，只暴露 evolution audit / candidate plan 所需类型和共享 helper，不稳定化整个 `service/evolution/**`。
- 新增稳定入口 `@alembic/core/memory`，提供 `MemoryRepositoryImpl`、semantic memory 类型、`createSemanticMemoryRepository(...)` 和 `ensureSemanticMemorySchema(...)`。
- 将已有 `MemoryRepositoryImpl` 纳入稳定 `@alembic/core/repositories` bundle，并新增 `memoryRepository` 到 `createAlembicRepositories(...)`。
- `package.json exports` 新增 `./evolution`、`./memory` 两个 exact exports；没有新增 wildcard。
- `config/public-api-boundary.json` 更新为 stable 17、provisional 21、transitional 98。
- `scripts/smoke-public-api.mjs` 增加 `@alembic/core/search`、`@alembic/core/evolution`、`@alembic/core/memory` 关键导出检查。
- 新增 `test/PublicCoreFacadesPhase10.test.ts`，覆盖 similarity facade、evolution narrow contract、raw SQLite 下 semantic memory repository factory。
- 更新 `test/PublicDatabaseRepositoryEntrypoints.test.ts`，覆盖 `createAlembicRepositories(...).memoryRepository`。

## 2. 新增 / 调整 Public Exports

| 入口 | 状态 | 内容 | 用途 |
| --- | --- | --- | --- |
| `@alembic/core/search` | stable-public，既有入口增强 | `cosineSimilarity`、`jaccardSimilarity`、`textSimilarity`、`tokenizeForSimilarity` | 替代 Agent 的 `@alembic/core/shared/similarity`。 |
| `@alembic/core/evolution` | stable-public，新 exact export | `EvolutionCandidateReason`、`EvolutionCandidate`、`EvolutionCandidatePlan`、`EvolutionAuditRecipe`、`toRescanImpactDecision`、`toEvolutionAuditRecipe`、`submitRescanImpactDecisions` 等窄 contract | 替代 Agent 的 `@alembic/core/service/evolution` provisional import。 |
| `@alembic/core/memory` | stable-public，新 exact export | `MemoryRepositoryImpl`、semantic memory types、`createSemanticMemoryRepository`、`ensureSemanticMemorySchema` | 替代 Agent 直接 import Drizzle schema；允许 raw SQLite consumer 不接触 schema。 |
| `@alembic/core/repositories` | stable-public，既有入口增强 | 新增 `memoryRepository`、`MemoryRepository` type 和 semantic memory types | 让 Core repository bundle 覆盖 semantic memory。 |

`@alembic/core/infrastructure/database/drizzle/schema` 仍保持 transitional/internal 口径，没有被稳定化。

## 3. Constants 判断

Core 本轮不为 `@alembic/core/shared/constants` 新增 stable facade。

原因：当前 Agent 只用其中 `CACHE.MAX_FILE_ENTRIES`、`CACHE.MAX_SEARCH_ENTRIES`、`CACHE.DEFAULT_TTL_MS` 三个 session read-only cache 默认值。该使用点属于 Agent session cache 策略，不是 Core 多消费者共享契约。Wave 2B 应由 `AlembicAgent` 本地化 cache defaults 或封装 Agent 自有配置；只有未来出现多个 Core consumer 共享同一 runtime/cache contract 时，Core 才应新增更窄的 cache facade。

## 4. 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run lint:public-api-boundary` | 通过；136 个 package exports classified，75 exact、61 wildcard，stable 17、provisional 21、transitional 98。 |
| `npm run test -- PublicCoreFacadesPhase10 PublicDatabaseRepositoryEntrypoints PublicApiInventory` | 通过；3 个文件、9 个测试。 |
| `npm run check` | 通过；60 个测试文件、919 个测试通过；测试阶段仍有既有 `Could not access 'HEAD'` 输出杂音。 |
| `npm run build` | 通过。 |
| `npm run smoke:public-api` | 通过；75 个 exact public API entrypoints import 成功，并检查新增关键导出。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json` | 通过；214 files、52 refs、stable 46、provisional 1、transitional 5、issueCount 0。 |
| `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --format=json` | 预期失败；当前 Agent 尚未消费新 facade，仍有 6 个 non-stable issues，留给 Wave 2B 替换。 |

## 5. 提交 Hash

`b904b66907e16e61f29a6dc0eeedc59231ddfb53`

提交信息：`feat: add core phase 10 public facades`

## 6. AlembicAgent 预期替换路径

| 当前 Agent import | Wave 2B 替换路径 |
| --- | --- |
| `@alembic/core/shared/similarity` | `@alembic/core/search` |
| `@alembic/core/service/evolution` | `@alembic/core/evolution` |
| `@alembic/core/infrastructure/database/drizzle/schema` | `@alembic/core/memory` 的 `createSemanticMemoryRepository(...)` / `MemoryRepositoryImpl`，或 `@alembic/core/repositories` 的 `memoryRepository`。 |
| `@alembic/core/shared/constants` | 不由 Core 提供 facade；Agent Wave 2B 本地化 cache defaults。 |

Agent Wave 2B 完成后，预期 `node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --format=json` 不再出现 similarity / evolution / raw schema / constants 的 non-stable issue。

## 7. 遗留风险

- `AlembicAgent` 尚未消费新 facade，当前无 config consumer scan 仍会失败 6 个 issue。
- `createSemanticMemoryRepository(...)` 已提供 raw SQLite factory 和 schema ensure，但 Agent 的 `MemoryStore` API 与 Core `MemoryRepositoryImpl` API 不完全同名；Wave 2B 需要做适配，而不是复制 schema。
- `dist/` 已通过 `npm run build` 生成但保持 ignored，不提交。
- `Could not access 'HEAD'` 仍是既有测试输出杂音，本轮未处理。

## 8. 下一步建议

- 派 `AlembicAgent` Wave 2B：更新 Core dependency 到 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`，消费 `@alembic/core/search`、`@alembic/core/evolution`、`@alembic/core/memory`，并本地化 session cache defaults。
- Agent Wave 2B 后，重新运行 Agent public API boundary、Core consumer scan、build/check。
- Agent 完成后再派 `Alembic` / `AlembicPlugin` Wave 2C 同步 Core vendor 或 Agent dependency；Plugin 继续保持 `@alembic/agent` 0 依赖。
