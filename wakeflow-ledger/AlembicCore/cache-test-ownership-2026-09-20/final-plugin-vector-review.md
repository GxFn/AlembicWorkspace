# 最终跨仓向量测试归属复核

审查提交：Core `9e8d033`；Plugin `876a06e`。审查输入基线为 Core `c1f6d77` 与前一轮逐组覆盖映射。本次只读提交内容、静态 AST/SHA 和 TypeScript 声明，没有执行测试、修改产品或测试、写控制状态。

## 覆盖迁移结论

- Core 原 21 个完整 describe 调用文本与迁移后源码逐组 SHA256 相同，匹配数 21/21；迁入 HnswVector 10 组、VectorPersistence 6 组、VectorPipeline 4 组、SearchRanking 1 组。该检查包含 describe 内的 hooks、夹具、调用和断言。
- Plugin 删除的 HnswVector.test.ts 为前次已映射的 91 项镜像。原 VectorPipeline.test.ts 的 8 个测试 callback 与提交父版本逐字 SHA256 相同；仅外围 imports/临时目录变量类型调整。新增 1 个 package integration case，现为 9 项。
- BatchEmbedder 串行 fallback 仍由 Core test/EmbeddingPort.test.ts 的真实 BatchEmbedder 入口承担；RRF 精确默认分数等差异断言仍在 Core SearchRanking 对应迁入组中。没有从文件删除推导为行为删除。
- Setup、DI、generation、维护等待及关闭顺序测试不在 Plugin 本提交的删除清单中。

## 新增 fixture 的实际能力范围

AlembicPlugin/test/unit/VectorPipeline.test.ts:194-255 通过真实 @alembic/core/search 与 @alembic/core/vector 包入口组合：LegacyEmbedProviderAdapter → IndexingPipeline 扫描两个临时 Markdown 文件 → HNSW flush/destroy → 新实例 init → HNSW hybridSearch 与 HybridRetriever.search。

断言证明：2条写入及重开后2个ID、命中正文/向量/sourcePath、两种混检结果各自的 payload 形状和正的 dense/sparse 贡献。embedding 向量由测试内按 needle 字符串选择的二维函数生成，不是实际模型/API、AI质量或网络provider验证；关闭前显式 flush，不是进程崩溃/WAL故障恢复；只有2条数据和1个查询，不是ANN召回率/规模性能验证。新增标题与注释没有作这些超出断言的声称。

## 已修正的测试契约问题（原 P2，含两处静态诊断）

在 Plugin 提交 `876a06e` 的初次审查中，新 fixture 运行链可执行，但有两处未遵守当前包声明：

1. AlembicPlugin/test/unit/VectorPipeline.test.ts:235：直接把 HnswVectorAdapter 传入 HybridRetriever。后者要求 searchVector 的 filter?: unknown，而 HNSW 参数为 filter?: Record<string, unknown> | null，在 strictFunctionTypes 下不兼容，TS2322。
2. 同文件:238：sparseSearchFn 为 async，返回 Promise<Array<...>>；当前 HybridRetriever.search 声明要求同步 RetrievalResult[]，TS2322。

这是新增测试的声明兼容问题，不将其归类为本轮新引入的 Core 运行时错误。Vitest 转译执行可以通过；Plugin tsconfig.json 明确排除 test，因此既有生产代码 typecheck 不覆盖它们。最小处置在 fixture 内即可：用仅转发本用例 topK 的 searchVector 适配闭包；先 await 获取 sparse 命中，再让 sparseSearchFn 同步返回数组。无需修改 Core 公共 API，也无需扩大测试范围。

只读目标文件语义检查的完整诊断与逐组证明保存在 final-plugin-vector-review.json。两处已在后续工作树修正：topK-only searchVector 闭包仍委托真实 store；sparseRows 先由真实 store await 取得，回调同步返回映射数组。复验目标 describe 的静态错误为 0；审查范围内无未解决问题。

## 验证记录的来源

读取本轮既有日志：core-check-final.log 为 196 files passed / 1 skipped、2202 tests passed / 1 skipped，并显示 lint 通过；plugin-host-contracts.log 为 7 files、43 tests passed。这些是根线程已有运行结果，本次审查没有重跑或将其改写为自己的执行结果。

## 静态复验方法与复现

复验对象是 `AlembicPlugin/test/unit/VectorPipeline.test.ts` 的新增 `describe('Core vector package integration')`，由 AST 精确定位为第 195–261 行；不是全文件/全仓类型验收。当前工作树基于 `876a06e1cf42e13605cdd96536f54e42236af7c9`，源文件 SHA256 为 `32ec8a19a854dc8421a88ced7e4d0f5d8c9eef61041166bdb32657c6eb0ca8be`。

使用 TypeScript 5.9.3 的 createProgram/getSemanticDiagnostics，读取 Plugin tsconfig.json，覆盖 noEmit=true、types=[node,vitest/globals]，仅把该测试文件设为根文件；将诊断按新增 describe 的 AST 起止位置筛选。新增范围 diagnostics=0。旧8用例范围外有 1 个诊断，本次按要求排除，不当作新增问题或声称整个文件类型检查通过。

可复现脚本为 `review-plugin-vector-types.mjs`，结果为 `final-plugin-vector-types.json`（含包声明 SHA256、源码 SHA256、编译选项与范围）。在 workspace 根目录使用已有 Node 22 运行：

```sh
node wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/review-plugin-vector-types.mjs
```

如需复现原提交的两处诊断，仍使用当前安装的 Core 声明：

```sh
node wakeflow-ledger/AlembicCore/cache-test-ownership-2026-09-20/review-plugin-vector-types.mjs AlembicCore AlembicPlugin 876a06e
```

此脚本不启动 Vitest、不执行测试或产品、不发网络请求、不输出 dist。根线程正在运行的9项回归不属于本次静态复验。
