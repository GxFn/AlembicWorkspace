# 新主线 Round 8 实现计划

## 判断

Round 7 已经把编译期主线打成了可运行链路：

```text
MainlineCompileSession
  -> FileFingerprintSnapshotStore
  -> ProjectIntelligence artifact
  -> ContentMining artifacts
  -> ContextIndex
  -> SearchIndex
  -> RuntimeRetrievalPipeline / KnowledgeInjectionRunner
```

现在最明显的断点是 `SearchIndex` 仍然主要是进程内对象。`runMainlineProjectIntelligence` 已经能把 `ContextIndex` 写入 SQLite，但搜索文档如果不落盘，下一次进程启动后运行期富召回只能读到数据库里的 Recipe/SourceRef，不能复原 `recipe/source-ref/file/symbol/graph-node` 的搜索排序上下文。

因此 Round 8 的主线不是继续扩冷启动扫描，而是让“编译期写入的运行期上下文”跨进程可恢复，并让 agent/tools/workflows 后续能用同一个装配方式读取。

## Round 8 主目标

实现“可恢复运行期上下文”：

```text
compile
  -> ContextIndex(SQLite)
  -> SearchIndexSnapshot(JSON)
  -> ProjectIntelligence artifact(JSON)
  -> fingerprint snapshot(JSON)

runtime / agent
  -> ContextIndexReader
  -> restored SearchIndex
  -> RuntimeRetrievalPipeline
  -> KnowledgeInjectionRunner
```

这轮仍然不碰旧 `runAllPhases` 旧 phase，不做结果投影，不迁移 Wiki/ReverseGuard/ToolForge。

## 代码现状

已经存在：

1. `lib/mainline/search/SearchIndex.ts`：`InMemoryMainlineSearchIndex` 支持 `upsert/remove/search/snapshot`。
2. `lib/mainline/compile/CompileSearchMaterializer.ts`：已经能把 Recipe 和 SourceRef 投入 SearchIndex。
3. `lib/mainline/compile/ProjectIntelligenceMaterializer.ts`：已经能把 file/symbol/graph-node 搜索文档投入 SearchIndex。
4. `lib/mainline/compile/MainlineCompileSession.ts`：已经串起上述两类搜索写入。
5. `lib/workflows/capabilities/project-intelligence/ProjectIntelligencePipeline.ts`：新入口已能写 SQLite ContextIndex。

缺口：

1. 没有 `SearchIndexSnapshotStore`。
2. `MainlineCompileSession` 默认不能从上一轮搜索快照恢复。
3. `MainlineCompileSession` 运行结束后没有保存 `searchIndex.snapshot()`。
4. workflow 入口只持久化 ContextIndex，未持久化 SearchIndex。
5. 运行期还没有一个统一的 “project runtime context loader” 去装配 SQLite + restored SearchIndex。

## 实现阶段

### 阶段 A: SearchIndex 快照存储

新增 `lib/mainline/search/SearchIndexStore.ts`：

1. `MAINLINE_SEARCH_INDEX_STORE_PATH = 'context/search-index.json'`。
2. `MainlineSearchIndexSnapshot` 保存 `schemaVersion`、`documents`、`updatedAt`、`metadata`。
3. `JsonMainlineSearchIndexStore` 使用 `MainlineJsonDocumentStore` 原子保存。
4. `restoreMainlineSearchIndex(index, documents)` 只做 `upsert`，不清空调用方手动塞入的文档。
5. 保存前按 document id 排序，保证快照稳定。

### 阶段 B: CompileSession 接入快照

修改 `MainlineCompileSession`：

1. dependency 增加 `searchIndexStore`。
2. 默认 store 写入 `.asd/context/search-index.json`。
3. 每次 run 开始时先恢复 SearchIndex 快照。
4. 搜索物化完成后保存当前 `searchIndex.snapshot()`。
5. `MainlineCompileSessionSearchReport` 增加 `persistedDocuments`。

这样增量扫描即使跨进程运行，也不会因为新建空 SearchIndex 而丢掉未受影响文件的搜索文档。

### 阶段 C: Runtime Context Loader

下一步新增 `lib/mainline/runtime/RuntimeContextLoader.ts`：

1. 用 `MainlineWorkspacePaths` 定位 SQLite 和 search snapshot。
2. 打开 `SqliteContextIndex`。
3. 恢复 `InMemoryMainlineSearchIndex`。
4. 返回 `{ contextIndex, searchIndex, retrievalPipeline, dispose }`。

这一步会让 tools/agent/workflows 不需要各自懂路径和 JSON 快照。

### 阶段 D: agent/tools/workflows 接线

后续把需要 prime IDE / knowledge injection 的入口改成：

```ts
const runtime = await loadMainlineRuntimeContext({ projectRoot, dataRoot });
const runner = new KnowledgeInjectionRunner(runtime.contextIndex, {
  searchIndex: runtime.searchIndex,
});
```

这一步只改调用点，不改 AgentRuntime 抽象。

### 阶段 E: Recipe Markdown Codec

搜索和运行期恢复稳定后，再做 `RecipeMarkdownCodec`。原因是 Markdown codec 会影响知识文件维护方式，如果运行期上下文还不能恢复，提前做 Markdown 只会增加存储形态而不能改善使用闭环。

## 本轮先实现

本轮先实现阶段 A + B：

1. 新增搜索索引快照存储。
2. `MainlineCompileSession` 自动恢复和保存搜索快照。
3. 增加跨进程增量测试：第一轮 cold start 生成搜索快照；第二轮用新的 `MainlineCompileSession + InMemorySearchIndex` 做 incremental，确认未受影响文件的搜索文档仍然存在。

阶段 A、B、C 已完成，搜索索引快照和运行期加载入口已经可用。

阶段 D 已完成：`MainlinePrimeRunner` 作为 IDE/MCP prime 的新主干入口，直接使用 `loadMainlineRuntimeContext + KnowledgeInjectionRunner`，并把 `alembic_task prime` 的真实调用点切到新主干。这里不再把 Recipe 投影成旧 `SlimSearchResult`，而是直接返回 `bundle / plan / markdown`，让上层 Agent 面向新统一实体工作。

阶段 E 已完成：`RecipeMarkdownCodec` 现在负责统一 `Recipe <-> Markdown` 转换。它的策略是：

1. frontmatter 保存主干字段、完整 `knowledge`、`metadata`，并额外写出旧体系兼容镜像字段。
2. 旧 `_content/_relations/_constraints/_reasoning/_quality/_stats` 继续保留，避免旧 Markdown 字段断层。
3. 正文只放 AI/人工最常编辑的托管段：summary、when/do/dont、coreCode、usageGuide、body markdown、rationale、pattern。
4. 解析时正文托管段覆盖 frontmatter，然后统一回到 `RecipeSubmission` 归一化入口。

阶段 F 已完成：`RecipeMarkdownStore` 现在作为 `RecipeMarkdownCodec` 的写入层，负责把统一 Recipe 写入 `Alembic/{candidates|recipes}`。

已经接入两条真实路径：

1. 编译期 `MainlineCompileSession`
   - `ContentMiningRunner` 产出的 `contentMining.recipes` 会同步写出 Markdown。
   - compile result 新增 `recipeMarkdown` 报告，记录写入数量和路径。
   - SQLite ContextIndex/SearchIndex 仍是运行期真相产物，Markdown 只做人类/AI 可维护外显层。

2. MCP 知识提交路径
   - `submitKnowledge` / `submitKnowledgeBatch` 创建成功后，会把旧 `KnowledgeService` 返回条目通过 `mapKnowledgeEntryToRecipe` 转成统一 Recipe，再写入新主干 Markdown。
   - `enhancedSubmitKnowledge` / `RecipeProductionGateway` 创建成功后，同样使用 `created.raw` 同步新主干 Markdown。
   - 这条桥接失败不会阻塞旧提交成功，但成功时 response 会带 `mainlineRecipeMarkdown`。

阶段 G 已完成：主线 Markdown 文件现在会参与重新编译输入。

1. `RecipeMarkdownStore.loadAll()` 会扫描 `Alembic/candidates` 与 `Alembic/recipes`，用 `RecipeMarkdownCodec` 读回统一 Recipe。
2. `MainlineCompileSession` 在内容挖掘写入前加载 Markdown Recipe，并与本次调用显式传入的 Recipe 按 id 合并。
3. 合并规则保持简单：Markdown 先进入，显式传入的 Recipe 覆盖同 id Markdown，避免临时调用被旧文件反向覆盖。
4. compile result 的 `recipeMarkdown` 报告现在同时记录 `loaded / loadedPaths / written / paths / warnings`。
5. 这一步形成了“提交/挖掘 -> Markdown 外显 -> 编译读回 -> SQLite/SearchIndex 入库 -> prime 注入”的最小闭环。

阶段 H 已完成：Markdown 文件来源进入 SQLite 显式索引。

这一步修正了旧项目里已经成立的原则：`.md` 是外显真相源，DB 是运行期查询入口，运行期不应该每次扫 Markdown。

1. `RecipeMarkdownStore` 写入和读取时都会计算 `contentHash`。
2. `MainlineCompileSession` 采用 file-first 顺序：先写/规范化 Markdown，再把 `recipeFiles` 索引随 Recipe 一起写入 ContextIndex。
3. `ContextIndexWriteBatch` 增加 `recipeFiles`，不把 Markdown 路径塞进 Recipe payload。
4. SQLite 增加 `mainline_recipe_files`：
   - `recipe_id`
   - `bucket`
   - `relative_path`
   - `content_hash`
   - `updated_at`
5. `ContextIndexReader` 增加：
   - `findRecipeFilesByRecipeIds()`
   - `findRecipesByMarkdownPaths()`
6. `RecipeMarkdownStore` 不再把 `markdownSource` 反写回 Markdown frontmatter，避免本机绝对路径污染知识文件。
