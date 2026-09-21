# 验证与中间结果

环境：现有 Node 22.23.2。runner 只设置该进程 PATH 并保存输出，不改依赖。表格保留所有正式检查，不把中间失败隐藏。

| 标签 | 仓库 | 命令 | exit | 日志 |
| --- | --- | --- | ---: | --- |
| baseline-core-vector | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/EmbeddingPort.test.ts test/CorePackage.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts` | 0 | [baseline-core-vector.log](baseline-core-vector.log) |
| baseline-plugin-vector | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/HnswVector.test.ts test/unit/KnowledgeVectorMaintenanceWiring.test.ts test/unit/SetupServiceVectorAvailability.test.ts test/unit/VectorPipeline.test.ts` | 0 | [baseline-plugin-vector.log](baseline-plugin-vector.log) |
| red-cache-lifecycle | AlembicCore | `node node_modules/vitest/vitest.mjs run test/CacheService.test.ts` | 1 | [red-cache-lifecycle.log](red-cache-lifecycle.log) |
| green-cache-lifecycle | AlembicCore | `node node_modules/vitest/vitest.mjs run test/CacheService.test.ts` | 1 | [green-cache-lifecycle.log](green-cache-lifecycle.log) |
| cache-types | AlembicCore | `npm run build:check` | 0 | [cache-types.log](cache-types.log) |
| baseline-ranking | AlembicCore | `node node_modules/vitest/vitest.mjs run test/SearchRanking.test.ts` | 0 | [baseline-ranking.log](baseline-ranking.log) |
| green-cache-lifecycle-isolated | AlembicCore | `node node_modules/vitest/vitest.mjs run test/CacheService.test.ts` | 0 | [green-cache-lifecycle-isolated.log](green-cache-lifecycle-isolated.log) |
| red-cache-lifecycle-isolated | AlembicCore | `node node_modules/vitest/vitest.mjs run --config /tmp/alembic-cache-test-ownership-20260920/baseline.config.mts` | 1 | [red-cache-lifecycle-isolated.log](red-cache-lifecycle-isolated.log) |
| core-test-move-proof | AlembicCore | `node ../wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/verify-core-test-moves.mjs` | 0 | [core-test-move-proof.log](core-test-move-proof.log) |
| core-separated-vector | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts test/VectorPipeline.test.ts test/SearchRanking.test.ts test/CacheService.test.ts test/EmbeddingPort.test.ts` | 1 | [core-separated-vector.log](core-separated-vector.log) |
| core-test-move-full-source-proof | AlembicCore | `node ../wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/verify-core-test-moves.mjs` | 0 | [core-test-move-full-source-proof.log](core-test-move-full-source-proof.log) |
| core-separated-vector-fixed | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts test/VectorPipeline.test.ts test/SearchRanking.test.ts test/CacheService.test.ts test/EmbeddingPort.test.ts` | 1 | [core-separated-vector-fixed.log](core-separated-vector-fixed.log) |
| final-move-proof | AlembicCore | `node ../wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/verify-core-test-moves.mjs` | 0 | [final-move-proof.log](final-move-proof.log) |
| core-check | AlembicCore | `npm run check` | 1 | [core-check.log](core-check.log) |
| core-separated-vector-complete | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts test/VectorPipeline.test.ts test/SearchRanking.test.ts test/CacheService.test.ts test/EmbeddingPort.test.ts` | 1 | [core-separated-vector-complete.log](core-separated-vector-complete.log) |
| core-separated-vector-green | AlembicCore | `node node_modules/vitest/vitest.mjs run test/HnswVector.test.ts test/VectorPersistence.test.ts test/VectorPipeline.test.ts test/SearchRanking.test.ts test/CacheService.test.ts test/EmbeddingPort.test.ts` | 0 | [core-separated-vector-green.log](core-separated-vector-green.log) |
| core-check-final | AlembicCore | `npm run check` | 0 | [core-check-final.log](core-check-final.log) |
| main-cache-consumer | Alembic | `node --experimental-strip-types ../wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/main-cache-consumer-probe.mjs` | 0 | [main-cache-consumer.log](main-cache-consumer.log) |
| plugin-package-chain | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts` | 0 | [plugin-package-chain.log](plugin-package-chain.log) |
| main-types | Alembic | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [main-types.log](main-types.log) |
| plugin-types | AlembicPlugin | `node node_modules/typescript/bin/tsc --noEmit` | 0 | [plugin-types.log](plugin-types.log) |
| plugin-test-lint | AlembicPlugin | `node node_modules/@biomejs/biome/bin/biome check test/unit/VectorPipeline.test.ts` | 0 | [plugin-test-lint.log](plugin-test-lint.log) |
| plugin-host-contracts | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts test/unit/KnowledgeVectorMaintenanceWiring.test.ts test/unit/SetupServiceVectorAvailability.test.ts test/unit/KnowledgeModuleRuntimeRoot.test.ts test/unit/LocalEmbedding.test.ts test/unit/ServiceContainerShutdown.test.ts test/unit/RecipeVectorGenerationRuntime.test.ts` | 0 | [plugin-host-contracts.log](plugin-host-contracts.log) |
| plugin-package-typed-contract | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts` | 0 | [plugin-package-typed-contract.log](plugin-package-typed-contract.log) |
| plugin-vector-file-types | AlembicCore | `node ../wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/review-plugin-vector-types.mjs` | 0 | [plugin-vector-file-types.log](plugin-vector-file-types.log) |
| plugin-package-final | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/VectorPipeline.test.ts` | 0 | [plugin-package-final.log](plugin-package-final.log) |

## 中间失败解释

- `red-cache-lifecycle`：旧实现下首次 RED；全 fake timers 也计入了日志 transport 的 immediate，不能仅凭总 timer 数解释全部失败。
- `green-cache-lifecycle`：修复后仍有 2 个仪器噪声失败。测试缩小到 Date/setInterval/clearInterval，不 mock 缓存或 adapter。
- `red-cache-lifecycle-isolated`：同一最终观测方式加载 Git c1f6d77 中的 CacheService，三个行为均失败；其中 shutdown 后重用在 60 秒后仍有过期数据。临时 baseline resolver 仅替换该产品模块，不切换工作树。
- `green-cache-lifecycle-isolated`：相同入口在新实现三个行为通过。最终再并入单条 get 过期移除后停 timer 的断言，完整 Core gate 通过。
- `core-separated-vector` / `core-separated-vector-fixed` / `core-separated-vector-complete`：测试拆分时遗漏依赖 imports，逐步暴露 ReferenceError。初始简化词法扫描不适合推导模板字符串内的依赖；改用明确静态导入，最终对六个文件进行 TypeScript 未解析名称检查（0项），并实际运行 189 项通过。
- `core-check`：运行期间仍加载到遗漏 BinaryPersistence 的版本，4 项失败；不将它记为最终证据。补齐全部 imports 并通过相关测试后重新运行 `core-check-final`，2202通过/1原有skip。
- `core-test-move-proof` 为早期 token 比对；最终使用 `core-test-move-full-source-proof` / `final-move-proof` 的完整 describe 源码 SHA256，21组均相同。源码保持不代表 imports 正确，所以运行验证不可省。

## 补充原始证据

- `plugin-duplicate-proof.json`：根审用 TypeScript AST printer 再核对固定 Core/Plugin 基线，91 项中85 callback完全一致，其余6与独立语义映射吻合。
- `main-cache-consumer-probe.mjs` 可由 Node 22 --experimental-strip-types 执行，只在子进程内创建/清理缓存，不启动服务。
- `core-test-moves.json` 与 `verify-core-test-moves.mjs` 定位每个describe唯一目标并核对固定基线的完整源码。
- `file-review.json` 是逐文件范围及当前摘要；两个独立缓存review中的探针来自其当时工具输出，不伪造另有完整日志。
- 三仓git diff --check、exports 68项逐项相等、插件commit hook均通过。原有规则文件和未跟踪用户文件保留。

限制：完整运行Core检查，两个宿主仅类型检查及此处列明的消费/相关测试；不包含宿主全量、外部模型网络、发布安装或真实Codex会话。

## 最终测试声明复核

独立静态复核发现，新 Plugin 用例直接把 HNSW store 当作旧通用 reader，以及返回 Promise 的 sparse 回调，不符合已有 TypeScript 声明。运行时允许，所以 Vitest 通过，但宿主常规 no-emit 排除 test 文件。fixture 已改为真实 store 的 topK 委托与预先读取后的同步 sparse 回调；没有放宽 Core API 或使用 any/type cast。该文件 9 项回归与 scoped Biome 再次通过；最终定向静态证据由 final-plugin-vector-review.json 记录。

最终复核又移除了原无provider用例冗余的 aiProvider:null（构造声明接受省略项，运行时仍走相同无provider分支）。原7个callback逐字保留，另1个仅删除该输入属性，全部断言不变。`plugin-vector-file-types` 显示新增范围0项、范围外也0项诊断，即此测试文件全部语义诊断为0；最终9项再次通过。证据保存在 final-plugin-vector-types-complete.json，源码摘要与当前文件一致。
