# Source Graph 最终差异独立复核

2026-09-18，`boundaries_consumers`。只读审查当前 `SourceGraphIndexer.ts`、`SourceGraphQueryService.ts` 差异及相关调用、仓储发布顺序和真实测试；未改产品源码/测试，未 commit。额外复现只写 ledger probe 和临时 SQLite/源码文件，结束后删除临时目录。

最终结论：指定的三项新增修复未发现新增 P0 / P1 / P2 回归。独立发现的 ISG-001 已由主线程最小修复，并通过同一原始 probe 独立复验；当前审查范围没有待处理的 P0 / P1 / P2 阻断。未扩大产品范围，最终全门禁与提交仍由主线程负责。

## ISG-001 / P2：incoming import 保留条件同时保留已失效的符号边 — 已修复并复验

- 位置：`src/service/source-graph/SourceGraphIndexer.ts:218` 的 preservedEdges 过滤。
- 修复前策略正确保留来自未修改 importer 的文件 import 边：目标文件正文修改不意味着 import 失效。但当时逻辑对所有 edge.kind 生效，只检查删除目标/修改来源或 site，未检查修改目标中的符号是否仍存在。
- 真实入口：临时 SQLite + SourceGraphService.buildFullIndex；通过公开 SourceGraphRepository.upsertEdge 为 `caller.ts#run → target.ts#oldTarget` 记录合法 `calls` 边；将 target 文件中的 oldTarget 改名为 renamedTarget，再调用 buildIncrementalIndex。
- 原复现实际：新 generation 标记 indexed，symbols 中只有 target.ts#module 与 target.ts#renamedTarget，仍有 `calls.toSymbolId = target.ts#oldTarget`。旧过滤对 touched target 会移除该边；本轮 broad preservation 引入了悬空 symbol endpoint。
- 证据：`independent-source-graph-incoming-edge-probe.mjs` / `.log`，输出 `danglingEdges: ["explicit-call"]`；同时普通 imports 文件边仍保留，说明需要区分两者而不是回退全部 incoming import 修复。
- 范围：当前内置 Indexer 自动提取以 imports 文件边为主；本复现针对已经存入同一公开图仓储的其他合法符号边，不声称默认索引生产者已经生成所有 calls。现有真实 QueryService fixture也通过仓储写入 calls / symbol_to_test，属于被接受的公共图模型。
- 主线程最终修复：只有 `kind === 'imports' && toSymbolId === undefined` 的文件级 import 使用目标内容变化可保留的分支；其它边恢复 `!edgeTouchesFiles(edge, impacted)` 原失效规则。源文件/site重解析及真实删除仍会使文件级 import失效，未扩大图推断策略。
- 已读取 `incoming-symbol-edge-red.log`（1个真实行为失败）、`incoming-symbol-edge-green.log`（2 suites / 17 tests GREEN）和新增真库用例，断言旧目标符号消失、文件级 import仍有一条、calls清空。
- 独立复验：未改输入，原 `independent-source-graph-incoming-edge-probe.mjs` 再运行到 `independent-source-graph-incoming-edge-verify.log`；changed仍仅 `src/target.ts`，新代仍indexed，imports正确保留，`danglingEdges: []`，旧calls已移除。已复核最终条件和 `git diff --check`，状态关闭。

## 指定三项修复的独立判断

| 修复 | 已核对的函数与顺序 | 结论 |
| --- | --- | --- |
| 非 ENOENT 读取失败不当成删除 | `walkDirectory:496` 只对 ENOENT 返回；其他 readdir 错误带目录/projectRoot日志后原样抛出。`collectInventory` 被 full、incremental 和 freshness inspect 共用；`buildIncremental:170` 在 collect 成功后才计算 deleted，`buildGeneration:255` 在所有 parse Promise 完成后才 `replaceGeneration`。stat/readFile 错误原本也向上传播。 | EACCES/EIO等未知清单状态不会生成空新一代或伪造删除；旧 generation 没有在扫描阶段被改写。ENOENT仍沿原“确实不存在”路径，删除行为兼容。 |
| 同一查询的总 source-line budget | `createContext:430` 每次查询建立一个 SectionBudget，在 snapshot缺失和正常返回两支都传入。`search:164` 先 symbol sections再text sections；`buildSectionsFromPlans:702` 共用context预算。node/callers/callees也经该context而非service全局状态。 | 总额度不再被两次 materialize 重置；最大section预算、默认值、排序优先级与wire未改变。新context意味着独立或并发请求不相互消耗。末尾去重仅可能减少输出，不会使总行数超预算。 |
| 索引后 symlink 越界正文阻断 | `readProjectFileLines:1058` 先保留原 lexical containment，再realpath root和target，以path.relative检查真实target是否仍在projectRoot内，越界warn并返回空；readFile读取已核对的realpath。`readProjectFileText`和全文text recall共用此函数。 | 指向projectRoot外的索引后替换不会把外部正文交付给node/search；合法项目文件、项目内目标保持可读。section定位可以保留而text缺失，符合现有读取失败返回undefined的合同。config redaction、includeText和非fresh门禁仍在上层生效。 |

## 证据阅读

- 已读取 `SourceGraphIndexer.test.ts` 新增真实临时库测试：先建立含文件的generation，再仅对fsPromises.readdir注入EACCES；incremental/inspect两条公开路径必须reject，失败generation不存在，旧代文件仍存在。
- `source-graph-read-failure-red.log`：2项真实行为失败；`source-graph-read-failure-green.log`：3 suites / 13 tests通过。此日志来自主线程，本独立审查没有冒称重新运行了这些套件。
- 已完整读取 `SourceGraphQueryService.test.ts`（包括真实fixture与显式calls边）；budget回归通过SourceGraphService.searchSourceGraph设置总额度1，RED返回2行，见 `source-graph-budget-red.log`。
- symlink回归在建立真实图后替换src/app.ts为外部临时文件链接，再通过SourceGraphService.getSourceGraphNode读取；`source-graph-realpath-red.log` 实际交付了外部正文，当前断言要求text为undefined。
- `source-graph-query-green.log`：2 suites / 16 tests通过，涵盖原查询、freshness、config、node/relation和新增两项用例。
- 本次独立执行的 probe 是 ISG-001 实际增量链路，修复前后用同一文件/输入；命令/exit code记录在checks.jsonl。修复前悬空edge存在，修复后imports保留且悬空edge消失。没有把fixture setup错误计为行为RED。

## 兼容与审查边界

- 目录枚举前失败不会触发 `replaceGeneration`；Repository的generation替换仍由既有同步事务完成。这里不把目录缺失与权限/IO错误混为同一种空清单。
- sourceSectionLineBudget是输出片段行预算，当前修复不限制 text recall读取多少文件；不把输出额度宣称为文件IO预算。文本召回和符号召回顺序仍保持先前的符号优先策略。
- realpath修复限制当前读取路径必须位于projectRoot实路径内；不是新引入inode锁定或完整并发TOCTOU协议，未据假想并发扩大修复范围。
- 没有重评全部未变更的SourceGraphQueryService图推断算法；审查深度为最终diff、受影响调用链和必要helper/仓储边界，不冒称两源文件全量逐句新审。
- search/index.ts 的错误清理建议已同步更正于search-review.json / search-findings.md / search-final-state.json；root公开链是 `src/index.ts:63 → src/service/index.ts:8 → src/service/search/index.ts`，未发生删除。
