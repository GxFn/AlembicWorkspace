# 新主干中间层 Round 3 执行计划

本文档承接 `mainline-middle-layer-migration-plan.md`，用于把剩余中间层能力拆成多个可并行任务窗口。

## 当前基线

已完成：

- `data`：SQLite ContextIndex，支持 Recipe、SourceRef、RecipeEdge 的主干 artifact 持久化。
- `search`：中英混合 tokenizer、字段权重 scorer、RRF、内存/JSON 向量 store。
- `code`：轻量 import parser、symbol table、call-site extractor。
- `graph`：ProjectIntelligenceArtifact，包含文件、符号、调用和语义边。
- `compile`：ProjectIntelligenceMaterializer 与 ProjectIntelligenceRunner。

本轮目标不是接旧 workflow，而是继续补齐中间层自身能力，让后续冷启动、结构工具和 runtime 注入能直接使用新主干。

## Round 3 实施结果

本轮已经按五个方向完成实现，并由主窗口统一验收：

- `data`：新增 `SqliteDataVersionWatcher`，通过 SQLite `PRAGMA data_version` 观察跨连接/跨进程写入，订阅 handler 互相隔离，`SqliteContextIndex` 暴露 `readDataVersion()`。
- `search`：新增 `MainlineHybridSearch`、批量 embedding 端口、稀疏/向量 RRF 融合和 sparse-only 降级路径。
- `code`：新增 `MainlineImportPathResolver`，覆盖相对路径、扩展名补全、index、Python `__init__.py`、Python dotted import、tsconfig/jsconfig paths alias。
- `graph`：新增 `MainlineProjectIntelligenceQueries`，支持 callers、callees、impact radius、文件依赖邻接和循环查询。
- `runtime`：新增 `RuntimeRetrievalPipeline`，把 ActiveWorkContext、SearchIndex、ContextIndex、RecipeEdge expansion 串成运行期检索闭环，并把检索 metadata 汇入 `ContextBundleBuilder`。

验证结果：

- `npm run typecheck` 通过。
- `npm run lint` 通过。
- 主干相关测试：10 files / 53 tests 通过。
- 完整 unit：179 files / 2489 tests 通过。普通沙箱下会因 `sandbox-exec` 与 `127.0.0.1` listen 权限失败，非沙箱权限重跑后全部通过。

## 并行方向

### A. 数据一致性与缓存失效（已完成）

写入范围：

- `lib/mainline/data/**`
- `test/unit/MainlineData*.test.ts`

目标：

- 为 SQLite ContextIndex 增加轻量 `data_version` 观察能力。
- 暴露主干一致性接口，例如 snapshot version、外部写入检测、订阅失效通知。
- 保持 JSON payload 是真相源，索引表只服务查询。

不做：

- 不引入 Redis。
- 不迁旧 audit/session/token/evolution 表。
- 不碰旧 repository。

验收：

- 双连接同一 SQLite DB 时，一个连接写入后，另一个连接能检测到版本变化。
- 失效订阅不会因为单个 handler 抛错而中断其他 handler。

### B. 搜索融合与批量向量入口（已完成）

写入范围：

- `lib/mainline/search/**`
- `test/unit/MainlineSearch*.test.ts`

目标：

- 建立主干 `HybridSearchIndex` 或 retrieval facade。
- 合并 sparse search、vector search、RRF，输出稳定 `MainlineSearchHit`。
- 增加批量 embedding 端口，但只定义 provider-neutral 接口和测试 fake，不绑定 OpenAI 或旧 AI provider。

不做：

- 不迁 CrossEncoder、MultiSignalRanker、HNSW。
- 不把旧 SearchEngine 包进来。

验收：

- 无向量时 sparse-only 降级稳定。
- 有向量时 sparse/vector RRF 融合稳定。
- 批量 embedding 失败时单条失败不污染整个批次。

### C. Import 解析与路径解析增强（已完成）

写入范围：

- `lib/mainline/code/**`
- `test/unit/MainlineAst*.test.ts` 或新增 `test/unit/MainlineCode*.test.ts`

目标：

- 增加主干 `MainlineImportPathResolver`。
- 支持相对路径、扩展名补全、index 文件、Python package `__init__.py`、tsconfig/jsconfig paths alias。
- 输出稳定 resolved/unresolved 结果，供 graph 层消费。

不做：

- 不引入 tree-sitter。
- 不迁旧 AstAnalyzer。

验收：

- 覆盖 TS alias、index import、Python dotted import、外部依赖、未解析依赖。

### D. 图谱查询与影响范围（已完成）

写入范围：

- `lib/mainline/graph/**`
- `test/unit/MainlineGraph*.test.ts` 或 `test/unit/MainlineProjectIntelligence*.test.ts`

目标：

- 基于 `MainlineProjectIntelligenceArtifact` 增加查询器。
- 支持 callers、callees、impact radius、文件依赖邻接、循环查询。
- 输出纯对象，不写数据库。

不做：

- 不迁旧 CodeEntityGraph repository。
- 不恢复 Panorama 重服务。

验收：

- 测试覆盖 callers/callees、impact radius、文件依赖、循环、无节点时空结果。

### E. Runtime 检索闭环（已完成）

写入范围：

- `lib/mainline/runtime/**`
- `test/unit/MainlineRuntime*.test.ts`

目标：

- 新增运行期 retrieval pipeline：ActiveWorkContext -> search hits -> ContextIndex SourceRefs/Recipes -> Graph expansion hints。
- 输出稳定 ContextBundle 输入材料，供后续 `ContextBundleBuilder` 和 `AgentInjectionPlanner` 使用。
- 只依赖主干 ContextIndex/SearchIndex 类型。

不做：

- 不重写 `agent/tools/workflows`。
- 不改旧 MCP/IDE 协议。
- 不扩大 AI mock。

验收：

- 覆盖无搜索结果、文件命中、symbol 命中、Recipe 关系扩展、stale SourceRef 降级。

## 主窗口收口原则

- 子 agent 只在各自写入范围内改文件。
- 不改 `docs-dev`。
- 不回滚他人改动。
- 最终由主窗口统一跑 `typecheck`、`lint`、相关测试和完整单测。

## 下一轮建议

Round 4 应该继续保持中间层，而不是上浮到 agent/tools/workflows：

1. 编译期增量入口：把文件指纹、import path resolver、ProjectIntelligenceMaterializer 串成“变更文件 -> 受影响文件 -> 受影响 symbol/Recipe”的纯主干链路。
2. ContextIndex 索引写入：为 Recipe/SourceRef/Edge/search document 建立一次 materialization transaction，保证数据层、搜索层、图谱层不会各写各的。
3. 运行期检索策略收紧：把 `ContextBundleBuilder` 的默认文件锚点检索命名为明确策略，避免把“兼容旧路径”误解成主干设计。
4. 结构工具数据源准备：只做主干 query facade，不改 MCP tool 协议，先让未来 `alembic_structure` 能直接读 ProjectIntelligenceArtifact。
