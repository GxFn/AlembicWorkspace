# 验证记录

Node：22.23.2。正式命令通过临时 runner prepend 已安装 Node 22 路径，完整 stdout/stderr 保存为同目录 .log。下表保留中间失败，最终状态见 review-summary.md。

| 标签 | 仓库 | 命令 | 退出码 | 日志 |
| --- | --- | --- | ---: | --- |
| baseline-vector | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorService.test.ts test/EmbeddingPort.test.ts test/VectorIndexPorts.test.ts test/SyncCoordinator.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [baseline-vector.log](baseline-vector.log) |
| red-embedding-cancellation | AlembicCore | `node node_modules/vitest/vitest.mjs run test/EmbeddingPort.test.ts` | 1 | [red-embedding-cancellation.log](red-embedding-cancellation.log) |
| green-embedding-boundary | AlembicCore | `node node_modules/vitest/vitest.mjs run test/EmbeddingPort.test.ts test/HnswVector.test.ts test/VectorService.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts test/Ad5FoundationalUpgrades.test.ts` | 0 | [green-embedding-boundary.log](green-embedding-boundary.log) |
| embedding-types | AlembicCore | `npm run build:check` | 0 | [embedding-types.log](embedding-types.log) |
| baseline-rrf-contracts | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'HybridRetriever\|RRF hybridSearch'` | 1 | [baseline-rrf-contracts.log](baseline-rrf-contracts.log) |
| embedding-layer | AlembicCore | `npm run lint:layer-contract` | 0 | [embedding-layer.log](embedding-layer.log) |
| baseline-availability | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorAvailability.test.ts test/SyncCoordinator.test.ts` | 0 | [baseline-availability.log](baseline-availability.log) |
| baseline-rrf-contracts-valid | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'HybridRetriever\|RRF hybridSearch'` | 0 | [baseline-rrf-contracts-valid.log](baseline-rrf-contracts-valid.log) |
| baseline-probe-context | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorAvailability.test.ts` | 0 | [baseline-probe-context.log](baseline-probe-context.log) |
| green-shared-rrf | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorService.test.ts test/SearchEngine.test.ts test/RecipeContextAdapters.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [green-shared-rrf.log](green-shared-rrf.log) |
| shared-rrf-types | AlembicCore | `npm run build:check` | 2 | [shared-rrf-types.log](shared-rrf-types.log) |
| shared-rrf-types-fixed | AlembicCore | `npm run build:check` | 0 | [shared-rrf-types-fixed.log](shared-rrf-types-fixed.log) |
| green-shared-availability | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorAvailability.test.ts test/SyncCoordinator.test.ts test/VectorService.test.ts test/EmbedProviderSelector.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [green-shared-availability.log](green-shared-availability.log) |
| red-fallback-diagnostics | AlembicCore | `node node_modules/vitest/vitest.mjs run test/EmbeddingPort.test.ts` | 1 | [red-fallback-diagnostics.log](red-fallback-diagnostics.log) |
| green-vector-boundaries | AlembicCore | `node node_modules/vitest/vitest.mjs run test/EmbeddingPort.test.ts test/HnswVector.test.ts test/VectorAvailability.test.ts test/SyncCoordinator.test.ts test/VectorService.test.ts` | 0 | [green-vector-boundaries.log](green-vector-boundaries.log) |
| final-vector-types | AlembicCore | `npm run build:check` | 0 | [final-vector-types.log](final-vector-types.log) |
| core-check | AlembicCore | `npm run check` | 0 | [core-check.log](core-check.log) |
| main-vector | Alembic | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts test/unit/RecipeVectorGenerationRuntime.test.ts test/unit/RecipeVectorGenerationConsumer.test.ts` | 0 | [main-vector.log](main-vector.log) |
| plugin-vector | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/HnswVector.test.ts test/unit/VectorService.test.ts test/unit/SyncCoordinator.test.ts test/unit/VectorPipeline.test.ts test/unit/SetupServiceVectorAvailability.test.ts test/unit/KnowledgeVectorMaintenanceWiring.test.ts` | 1 | [plugin-vector.log](plugin-vector.log) |
| main-types | Alembic | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [main-types.log](main-types.log) |
| plugin-types | AlembicPlugin | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [plugin-types.log](plugin-types.log) |
| plugin-test-lint | AlembicPlugin | `node node_modules/@biomejs/biome/bin/biome check test/unit/HnswVector.test.ts` | 0 | [plugin-test-lint.log](plugin-test-lint.log) |
| plugin-vector-fixed | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/HnswVector.test.ts test/unit/VectorService.test.ts test/unit/SyncCoordinator.test.ts test/unit/VectorPipeline.test.ts test/unit/SetupServiceVectorAvailability.test.ts test/unit/KnowledgeVectorMaintenanceWiring.test.ts` | 0 | [plugin-vector-fixed.log](plugin-vector-fixed.log) |

## 中间失败归因

- `red-embedding-cancellation`：三种 serial 路径漏判最后一次 await 后的取消，正式缺陷 RED。
- `baseline-rrf-contracts`：初次测试期望遗漏既有 metadata.updatedAt；修正测试为实际 store metadata 后，在 RRF 重构前通过。不是产品缺陷。
- `shared-rrf-types`：累加器初版 key 只接受 string，HNSW 既有输入类型允许 undefined；改为泛型 Key，保持原行为而不新增过滤。
- `red-fallback-diagnostics`：新增错误日志含 provider 回显的合成文档，修复前失败；固定 reason 后通过。
- `plugin-vector`：旧 WAL 断言与已存在的持久化语义冲突；修正消费契约后相同六套用例 162 项全通过。

## 独立差分与补充检查

- `weighted-rrf-differential.mjs`：Node 22.15+ 可运行；默认基线 f39e139，允许显式传 Core 根目录与基线。结果在 weighted-rrf-differential-result.json，8,232 组零差异。
- availability 6 形态与 embedding 的窄探针仅有当时工具回显；见两份独立 review 文档。不伪造独立 log。
- Core/Plugin git diff --check 均退出 0；提交前检查只暂存本批文件。
- package exports 与基线逐项相等（68 key）；RRF 差分的三个 SHA256 与 Core 提交一致。
- 插件 scoped Biome 退出 0、24 条既有警告；commit hook 格式/lint 完成，提交只有原计划的 5 insertions / 2 deletions。

## 验证限制

完整 Core gate 已执行；两个宿主仅跑 no-emit 及相关测试。没有运行宿主全量套件、外部模型网络、发布安装和 Codex 会话验收。本批未改这些宿主产品路径。Core 1 个 skipped 与原基线一致；未将其算作通过。
