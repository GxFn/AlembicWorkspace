# 验证记录

正式检查使用已安装 Node 22.23.2，与本地 better-sqlite3 ABI 匹配。完整输出保存在同目录 log，表中保留 RED、中间失败与最终 GREEN。

| 标签 | 仓库 | 命令 | exit | 日志 |
| --- | --- | --- | ---: | --- |
| baseline-vector | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts test/VectorPipeline.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [baseline-vector.log](baseline-vector.log) |
| persistence-baseline | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-baseline.log](persistence-baseline.log) |
| chunk-red | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts -t 'terminal suffix\|mixed text\|oversized AST leaf'` | 1 | [chunk-red.log](chunk-red.log) |
| quantization-baseline | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'ScalarQuantizer\|SQ8 2-pass search'` | 0 | [quantization-baseline.log](quantization-baseline.log) |
| quantization-red-none | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'respects quantize:none'` | 1 | [quantization-red-none.log](quantization-red-none.log) |
| chunk-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts` | 0 | [chunk-green.log](chunk-green.log) |
| chunk-types | AlembicCore | `npm run build:check` | 0 | [chunk-types.log](chunk-types.log) |
| persistence-probes-baseline | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/persistence-probes.mjs` | 0 | [persistence-probes-baseline.log](persistence-probes-baseline.log) |
| quantization-green-none | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'respects quantize:none'` | 0 | [quantization-green-none.log](quantization-green-none.log) |
| quantization-red-empty | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'rebuilds usable SQ8'` | 1 | [quantization-red-empty.log](quantization-red-empty.log) |
| ast-source-red | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts -t 'oversized AST leaf'` | 1 | [ast-source-red.log](ast-source-red.log) |
| quantization-green-empty | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'rebuilds usable SQ8'` | 0 | [quantization-green-empty.log](quantization-green-empty.log) |
| persistence-red-structure | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t 'BinaryPersistence Validation\|VectorMigration corruption handling'` | 1 | [persistence-red-structure.log](persistence-red-structure.log) |
| ast-source-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts` | 0 | [ast-source-green.log](ast-source-green.log) |
| chunk-types-final | AlembicCore | `npm run build:check` | 0 | [chunk-types-final.log](chunk-types-final.log) |
| quantization-green-restore | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'ScalarQuantizer\|SQ8 2-pass search'` | 0 | [quantization-green-restore.log](quantization-green-restore.log) |
| quantization-format | AlembicCore | `node_modules/.bin/biome check --write src/infrastructure/vector/HnswVectorAdapter.ts test/HnswVector.test.ts` | 1 | [quantization-format.log](quantization-format.log) |
| quantization-format-fixed | AlembicCore | `node_modules/.bin/biome check --write src/infrastructure/vector/HnswVectorAdapter.ts test/HnswVector.test.ts` | 0 | [quantization-format-fixed.log](quantization-format-fixed.log) |
| persistence-green-structure | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-green-structure.log](persistence-green-structure.log) |
| quantization-red-single-read | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'reads a snapshot once'` | 1 | [quantization-red-single-read.log](quantization-red-single-read.log) |
| chunk-layers | AlembicCore | `npm run lint:layer-contract` | 0 | [chunk-layers.log](chunk-layers.log) |
| chunk-boundaries | AlembicCore | `node node_modules/vitest/vitest.mjs run test/CoreDeliveryBoundary.test.ts test/CoreToolSystemBoundary.test.ts test/CoreCodexBoundary.test.ts test/CorePackage.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [chunk-boundaries.log](chunk-boundaries.log) |
| persistence-red-atomic | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t 'preserves the old snapshot'` | 1 | [persistence-red-atomic.log](persistence-red-atomic.log) |
| quantization-green-single-read | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'reads a snapshot once'` | 0 | [quantization-green-single-read.log](quantization-green-single-read.log) |
| quantization-format-snapshot | AlembicCore | `node_modules/.bin/biome check --write src/infrastructure/vector/HnswVectorAdapter.ts test/HnswVector.test.ts` | 0 | [quantization-format-snapshot.log](quantization-format-snapshot.log) |
| quantization-green-related | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts -t 'ScalarQuantizer\|SQ8 2-pass search\|rejects flush and retains WAL\|retains recovered WAL\|should recover WAL on restart\|should handle WAL with remove\|should fallthrough to json when .asvec is corrupted'` | 0 | [quantization-green-related.log](quantization-green-related.log) |
| quantization-types | AlembicCore | `npm run build:check` | 0 | [quantization-types.log](quantization-types.log) |
| persistence-green-atomic | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-green-atomic.log](persistence-green-atomic.log) |
| quantization-diff-check | AlembicCore | `git diff --check -- src/infrastructure/vector/HnswVectorAdapter.ts test/HnswVector.test.ts` | 0 | [quantization-diff-check.log](quantization-diff-check.log) |
| quantization-lint | AlembicCore | `node_modules/.bin/biome check src/infrastructure/vector/HnswVectorAdapter.ts test/HnswVector.test.ts` | 0 | [quantization-lint.log](quantization-lint.log) |
| quantization-fixture-types | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/quantization-fixture-types.mjs` | 0 | [quantization-fixture-types.log](quantization-fixture-types.log) |
| persistence-red-quantizer | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t 'writes a trained quantizer'` | 1 | [persistence-red-quantizer.log](persistence-red-quantizer.log) |
| quantization-final-diff | AlembicCore | `git diff --check -- src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/ScalarQuantizer.ts test/HnswVector.test.ts` | 0 | [quantization-final-diff.log](quantization-final-diff.log) |
| quantization-final-lint | AlembicCore | `node_modules/.bin/biome check src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/ScalarQuantizer.ts test/HnswVector.test.ts` | 0 | [quantization-final-lint.log](quantization-final-lint.log) |
| persistence-green-quantizer | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-green-quantizer.log](persistence-green-quantizer.log) |
| persistence-probes-green | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/persistence-probes.mjs` | 0 | [persistence-probes-green.log](persistence-probes-green.log) |
| persistence-format | AlembicCore | `node node_modules/@biomejs/biome/bin/biome check --write src/infrastructure/vector/BinaryPersistence.ts test/VectorPersistence.test.ts` | 0 | [persistence-format.log](persistence-format.log) |
| chunk-entry-validation-red | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts -t 'rejects budgets'` | 1 | [chunk-entry-validation-red.log](chunk-entry-validation-red.log) |
| quantization-green-integrated | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts -t 'ScalarQuantizer\|SQ8 2-pass search\|rejects flush and retains WAL\|retains recovered WAL\|should recover WAL on restart\|should handle WAL with remove\|should fallthrough to json when .asvec is corrupted'` | 0 | [quantization-green-integrated.log](quantization-green-integrated.log) |
| persistence-related-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts test/HnswVector.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [persistence-related-green.log](persistence-related-green.log) |
| persistence-types | AlembicCore | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [persistence-types.log](persistence-types.log) |
| chunk-entry-validation-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts` | 0 | [chunk-entry-validation-green.log](chunk-entry-validation-green.log) |
| persistence-red-temp-mode | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t 'preserves the old snapshot'` | 1 | [persistence-red-temp-mode.log](persistence-red-temp-mode.log) |
| persistence-green-temp-mode | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-green-temp-mode.log](persistence-green-temp-mode.log) |
| persistence-red-graph-levels | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t 'header referencing absent graph levels'` | 1 | [persistence-red-graph-levels.log](persistence-red-graph-levels.log) |
| persistence-green-graph-levels | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-green-graph-levels.log](persistence-green-graph-levels.log) |
| persistence-final-format | AlembicCore | `node node_modules/@biomejs/biome/bin/biome check --write src/infrastructure/vector/BinaryPersistence.ts test/VectorPersistence.test.ts` | 0 | [persistence-final-format.log](persistence-final-format.log) |
| persistence-layer | AlembicCore | `npm run lint:layer-contract` | 0 | [persistence-layer.log](persistence-layer.log) |
| persistence-final-tests | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [persistence-final-tests.log](persistence-final-tests.log) |
| persistence-final-types | AlembicCore | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [persistence-final-types.log](persistence-final-types.log) |
| quantization-migration-baseline | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts -t VectorMigration` | 0 | [quantization-migration-baseline.log](quantization-migration-baseline.log) |
| quantization-migration-red | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'keeps legacy JSON until'` | 1 | [quantization-migration-red.log](quantization-migration-red.log) |
| quantization-migration-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts -t 'keeps legacy JSON until'` | 0 | [quantization-migration-green.log](quantization-migration-green.log) |
| quantization-migration-compat | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts -t 'JSON migration recovery\|VectorMigration'` | 0 | [quantization-migration-compat.log](quantization-migration-compat.log) |
| quantization-migration-format | AlembicCore | `node_modules/.bin/biome check --write src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/VectorMigration.ts test/HnswVector.test.ts` | 0 | [quantization-migration-format.log](quantization-migration-format.log) |
| quantization-migration-legacy-edge | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/migration-legacy-edge-probe.mjs` | 0 | [quantization-migration-legacy-edge.log](quantization-migration-legacy-edge.log) |
| quantization-migration-current-edge | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/migration-legacy-edge-probe.mjs . working-tree` | 0 | [quantization-migration-current-edge.log](quantization-migration-current-edge.log) |
| quantization-migration-final-format | AlembicCore | `node_modules/.bin/biome check --write src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/VectorMigration.ts src/infrastructure/vector/ScalarQuantizer.ts test/HnswVector.test.ts` | 0 | [quantization-migration-final-format.log](quantization-migration-final-format.log) |
| quantization-migration-final-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts -t 'JSON migration recovery\|VectorMigration\|ScalarQuantizer\|SQ8 2-pass search\|rejects flush and retains WAL\|retains recovered WAL\|should recover WAL on restart\|should handle WAL with remove'` | 0 | [quantization-migration-final-green.log](quantization-migration-final-green.log) |
| quantization-migration-fixture-types | AlembicCore | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/quantization-fixture-types.mjs` | 0 | [quantization-migration-fixture-types.log](quantization-migration-fixture-types.log) |
| quantization-migration-types | AlembicCore | `npm run build:check` | 0 | [quantization-migration-types.log](quantization-migration-types.log) |
| core-integrated-vector | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPipeline.test.ts test/VectorPersistence.test.ts test/HnswVector.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts test/FailureSemanticsCO3.test.ts` | 0 | [core-integrated-vector.log](core-integrated-vector.log) |
| integrated-types | AlembicCore | `npm run build:check` | 0 | [integrated-types.log](integrated-types.log) |
| quantization-migration-diff-check | AlembicCore | `git diff --check -- src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/VectorMigration.ts src/infrastructure/vector/ScalarQuantizer.ts test/HnswVector.test.ts` | 0 | [quantization-migration-diff-check.log](quantization-migration-diff-check.log) |
| quantization-migration-lint | AlembicCore | `node_modules/.bin/biome check src/infrastructure/vector/HnswVectorAdapter.ts src/infrastructure/vector/VectorMigration.ts src/infrastructure/vector/ScalarQuantizer.ts test/HnswVector.test.ts` | 0 | [quantization-migration-lint.log](quantization-migration-lint.log) |
| core-check | AlembicCore | `npm run check` | 0 | [core-check.log](core-check.log) |
| plugin-readonly-baseline | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/ReadOnlySearchFingerprint.test.ts test/unit/PublicOrphanVectorTruth.test.ts` | 0 | [plugin-readonly-baseline.log](plugin-readonly-baseline.log) |
| plugin-readonly-red | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/ReadOnlySearchFingerprint.test.ts` | 1 | [plugin-readonly-red.log](plugin-readonly-red.log) |
| plugin-readonly-green | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/ReadOnlySearchFingerprint.test.ts test/unit/PublicOrphanVectorTruth.test.ts` | 0 | [plugin-readonly-green.log](plugin-readonly-green.log) |
| main-vector-consumers | Alembic | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts test/unit/RecipeVectorGenerationRuntime.test.ts test/unit/RecipeVectorGenerationConsumer.test.ts` | 0 | [main-vector-consumers.log](main-vector-consumers.log) |
| main-types | Alembic | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [main-types.log](main-types.log) |
| plugin-vector-consumers | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts test/unit/KnowledgeModuleRuntimeRoot.test.ts test/unit/KnowledgeVectorMaintenanceWiring.test.ts test/unit/ServiceContainerShutdown.test.ts test/unit/RecipeVectorGenerationRuntime.test.ts` | 0 | [plugin-vector-consumers.log](plugin-vector-consumers.log) |
| plugin-types | AlembicPlugin | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [plugin-types.log](plugin-types.log) |
| plugin-distribution | AlembicPlugin | `npm run verify:plugin-distribution` | 0 | [plugin-distribution.log](plugin-distribution.log) |
| plugin-verify | AlembicPlugin | `npm run verify:codex-plugin` | 0 | [plugin-verify.log](plugin-verify.log) |
| plugin-build | AlembicPlugin | `node node_modules/typescript/bin/tsc` | 0 | [plugin-build.log](plugin-build.log) |
| plugin-smoke | AlembicPlugin | `npm run smoke:codex-plugin` | 1 | [plugin-smoke.log](plugin-smoke.log) |
| plugin-readonly-fixture-types | AlembicPlugin | `node ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/check-readonly-fixture-types.mjs` | 0 | [plugin-readonly-fixture-types.log](plugin-readonly-fixture-types.log) |
| wal-test-ownership | AlembicCore | `node node_modules/vitest/vitest.mjs run test/VectorPersistence.test.ts` | 0 | [wal-test-ownership.log](wal-test-ownership.log) |
| plugin-standard-build | AlembicPlugin | `npm run build` | 0 | [plugin-standard-build.log](plugin-standard-build.log) |
| plugin-smoke-final | AlembicPlugin | `npm run smoke:codex-plugin` | 0 | [plugin-smoke-final.log](plugin-smoke-final.log) |

## 结果归因与限制

- 分块3项RED覆盖重复尾块、混合文字超预算与超大AST叶子；进一步的源跨度/行号RED及公开入口预算RED均在相同入口修复。零预算用受限独立子进程对照：预算1正常，预算0加载入口后heap耗尽并SIGABRT；没有在Vitest worker中运行旧死循环。
- 持久化RED覆盖魔数有效但正文截断、entry point/图/metadata长度、部分写与rename失败；新增实现自审又捕获临时mode窗口及header图层上界，均先RED再修复。
- 量化RED覆盖none与历史零维、重复快照读；JSON迁移RED用真实EISDIR，区分JSON提前归档与同步吞错。数组/对象、空/invalid-only差异均有固定基线对照。
- Root关于invalid-only会生成空snapshot的初步假设被源码dirty gate与8组对照反证；没有为假设增加状态或改变旧行为。
- 独立chunk probe首轮的一项定位失败来自重复文本造成indexOf歧义；改为唯一可定位文本后22组通过，不作为产品缺陷。
- 原型观察器与fs故障注入均保留真实生产函数和磁盘；正向测试不是外部模型质量或ANN性能基准。
- 插件只读入口有效快照两次读取RED→一次读取GREEN，坏/缺快照及只读指纹保持。新增测试文件语义诊断为0。
- plugin-smoke首次因直接tsc没有刷新build provenance而失败；正式npm run build完成当前Core/Plugin溯源后，plugin-smoke-final的pack/temporary install/startup/stdio全部通过。没有跳过溯源门禁。
- Core完整check为2241 passed/1原有skip；随后仅增强WAL测试的fixture，VectorPersistence 53项复验通过。标准Plugin build再次构建当前Core提交。
- 宿主没有运行全量套件；Main相关22项，Plugin向量接入22项+只读/真相6项。发布验证是本地静态/临时包验证，不代表远程发布或实际安装更新。package未提供verify:codex-session入口，本批没有冒充已跑真实Codex会话验收。

其他证据：chunk-ast-public-probe.log（22检查组）、binary-independent-probe结果、migration-legacy-edge-comparison.json、各review与implementation-evidence文件。shell读文件时的无匹配rg、临时AST编辑脚本的模块解析错误均未修改产品；已纠正后继续，不作为产品故障。
