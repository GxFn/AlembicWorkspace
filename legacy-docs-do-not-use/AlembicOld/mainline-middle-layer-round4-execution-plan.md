# 新主干中间层 Round 4 执行计划

本文档承接 `mainline-middle-layer-round3-execution-plan.md`。Round 4 的重点是把中间层从“能产出事实”推进到“能稳定增量更新事实”，继续服务编译期内容挖掘和运行期知识注入两条主线。

## 本轮目标

1. 编译期增量入口：从文件指纹 diff 和上一轮 `ProjectIntelligenceArtifact` 计算 affected files、dependent files、SourceRef/search document 刷新集合。
2. 统一写入事务：让 Recipe、SourceRef、RecipeEdge 通过 `ContextIndexWriter.upsertContextArtifacts()` 一次写入，避免一次编译结果拆成多个事务。
3. Materialization 收口：ProjectIntelligence 写入 ContextIndex 时也使用统一批次接口；search document 仍在 ContextIndex 成功后写入，因为 search index 不是同一个数据库事务。

## 本轮不做

- 不改 `agent/tools/workflows`。
- 不重写冷启动入口。
- 不改 MCP tool 协议。
- 不引入旧 SearchEngine、Panorama 或 CodeEntityGraph repository。

## 实施结果

- `data`：`ContextIndexWriter` 新增 `upsertContextArtifacts(batch)`，`InMemoryContextIndex` 和 `SqliteContextIndex` 均实现单批次语义。
- `compile`：`CompileArtifactWriter` 改为走统一批次接口；`ProjectIntelligenceMaterializer` 写 SourceRef 时也走批次接口。
- `compile`：新增 `MainlineProjectIntelligenceIncrementalPlanner`，输出：
  - `filesToParse`
  - `dependentFiles`
  - `affectedFiles`
  - `sourceRefIdsToRefresh`
  - `sourceRefIdsToStale`
  - `searchDocumentIdsToRefresh`
  - `searchDocumentIdsToRemove`
  - `contextLookupFiles`

## Round 5 已承接

Round 5 已经把 planner 接到 runner：

1. `ProjectIntelligenceRunner` 增加可选 incremental request，按 `filesToParse` 读取局部文件。
2. 新增 artifact merge：旧 artifact 去掉受影响/失效文件，再合并新解析结果。
3. 将删除文件和消失 symbol 的 SourceRef 落成 `stale`，并移除旧 search document。
4. 结构工具只读 query facade 仍留到下一轮，继续不改 MCP 协议。
