# 新主干中间层 Round 5 执行计划

本文档承接 `mainline-middle-layer-round4-execution-plan.md`。Round 5 的目标是让增量规划真正进入 `ProjectIntelligenceRunner`，形成可运行的编译期增量链路。

## 本轮目标

1. Runner 接入增量计划：`previousArtifact + fingerprintDiff` 进入 planner，输出局部读取计划。
2. 局部读取：Runner 按 `filesToParse` 从项目根读取文件，跳过超大或读取失败文件。
3. Artifact merge：新增纯函数合并上一轮 artifact 和本轮 patch artifact。
4. Runtime index 更新：删除文件或消失 symbol 对应的 SourceRef 标为 `stale`，旧 search document 从搜索索引移除。

## 实施结果

- `compile`：新增 `mergeMainlineProjectIntelligenceArtifact()`，按受影响文件替换旧 facts，未受影响文件保留上一轮事实。
- `compile`：`MainlineProjectIntelligenceRunner` 新增 `incremental` 请求，执行“规划 -> 局部读取 -> patch build -> artifact merge -> materialize”。
- `compile`：`MainlineProjectIntelligenceMaterializer` 支持 `staleSourceRefs` 和 `searchDocumentIdsToRemove`，在写入新 SourceRef 前先移除旧 search document。
- `test`：覆盖文件修改导致旧 symbol stale、文件删除导致 artifact/search/context 同步失效。

## 当前边界

- 局部 patch artifact 只能根据本轮读取文件解析依赖；跨未读取文件的全局依赖解析仍然依赖上一轮 artifact。
- 受影响文件的旧 facts 会整体替换，这比试图局部打补丁更安全，但会让读取失败文件从 artifact 中移除。
- search document 删除已经覆盖 file/symbol 和带 path 的 graph document；未来图谱边 id 稳定后，可以把 graph-edge remove 做得更精细。

## Round 6 已承接

Round 6 已经把 artifact 持久化接到 runner：

1. 新增 ProjectIntelligence artifact store，支持内存与 JSON 持久化。
2. Runner 的增量入口改为从 store 读取上一轮基线，不再由调用方手动传入 `previousArtifact`。
3. materialize 成功后再保存 artifact，保持编译产物、ContextIndex 和 SearchIndex 的更新顺序一致。

## 下一步

1. 增量读取支持 dependency support：当受影响文件 import 未读取文件时，使用上一轮 known file set 解析本地依赖，避免局部 patch 误报 unresolved。
2. SourceRef stale 原因细化：区分 deleted、read-failed、symbol-removed、full-rebuild-pruned。
3. 结构工具只读 facade：基于 `MainlineProjectIntelligenceQueries` 做稳定 query service，但不改 MCP tool 协议。
