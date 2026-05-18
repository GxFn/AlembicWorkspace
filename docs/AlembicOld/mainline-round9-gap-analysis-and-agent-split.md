# 新主线 Round 9 差距分析与子 agent 实现拆分

## 判断

Round 8 已经把最小闭环跑通：

```text
Recipe / SourceRef / ProjectIntelligence
  -> MainlineCompileSession
  -> Markdown 外显层
  -> SQLite ContextIndex
  -> SearchIndexSnapshot
  -> RuntimeRetrievalPipeline
  -> KnowledgeInjectionRunner / MainlinePrimeRunner
```

这说明新主线已经不是概念骨架，而是可以逐步替代旧项目的真实主干。现在的问题不再是“要不要再设计一层”，而是旧项目里仍然有效的能力还散在 `lib/service`、`lib/workflows`、`lib/tools`、`lib/agent` 里，新主线只迁了最关键的一段。接下来应按两条主线继续收束：

1. 编译期：冷启动、增量扫描、结构分析、内容挖掘、Recipe 归一、Markdown/SQLite/SearchIndex 落盘。
2. 运行期：检索、图谱扩展、SourceRef 证据、Recipe 注入、Agent/IDE/Tool 使用闭环。

`agent / tools / workflows` 暂时保留为真实入口，不做大拆。但它们后面调用的知识、搜索、扫描、运行期上下文要逐步切到 `mainline`。除了这四个目录和必要扩展/文档外，旧 `service` 能力原则上只迁有价值的逻辑，不继续维护旧抽象层。

## 旧项目与新主线对照

| 方向 | 旧项目有效能力 | 新主线已实现 | 仍缺内容 | 处理策略 |
| --- | --- | --- | --- | --- |
| Recipe 存储 | `KnowledgeFileWriter`、`KnowledgeSyncService`、生命周期文件移动 | `RecipeMarkdownCodec`、`RecipeMarkdownStore`、`mainline_recipe_files` | Markdown 改动反向同步、孤儿文件、删除/移动修复、旧 `_contentHash` 兼容 | 迁成直接的 `RecipeMarkdownSyncService`，不搬旧 KnowledgeEntry 实体 |
| Recipe 字段 | 旧 V3 字段、do/dont、constraints、relations、reasoning、quality、delivery | `RecipeKnowledgePayload` 保留字段，codec 读写托管段 | 注入层没有充分使用 delivery 字段，关系还未完全落成边 | 保持统一 Recipe 实体，扩展注入与关系挖掘 |
| SourceRef | `SourceRefReconciler` 从 sources、git、路径重写修复来源 | `SourceRefMaterializer`、freshness check | 自动修复、过期报告、git rename 映射不足 | 做轻量 reconcile report，先报告后修复 |
| 搜索召回 | `PrimeSearchPipeline` 多查询、技术词、文件上下文、质量过滤 | `SearchIndex`、field weighting、snapshot、runtime retrieval | 多查询计划、top1/相对分差过滤、邻居 Recipe hydration | 做轻量 query planner，不搬 CrossEncoder 等重排序 |
| 向量检索 | VectorService、HybridRetriever、RRF | `VectorStore`、`HybridSearch` port | prime 运行期未接入可选向量 | 保持可选能力，后续只接 port，不恢复旧同步管线 |
| 冷启动/重扫 | workflow 全链路、dimension、Mission Briefing | `ProjectIntelligenceRunner`、`MainlineCompileSession` | 真实 daemon/dashboard/MCP 入口仍走旧 pipeline | 用 sidecar/entrypoint 逐步切主线，不立刻拆 agent/tools/workflows |
| 文件监控 | `DaemonFileChangeCollector`、`FileChangeHandler` | `FileWatch`、`GitPort`、fingerprint incremental planner | daemon 事件未接入 mainline compile | 做 `MainlineFileChangeCompileService`，事件合并后跑增量 |
| AST/全景 | panorama、module role、coupling、tech stack | 结构 AST、import/callsite/symbol graph | 高层模块角色与耦合摘要未迁 | 先保持结构图，后续补轻量 module summary |
| Guard/Wiki/Forge | ReverseGuard、WikiGenerator、ToolForge | 主线没有迁 | 非核心、低频、重 | 剪枝，不进入 Round 9 主线 |
| AI mock | mock bootstrap pipeline、测试型 agent 模拟 | 主线 AI port 已有真实适配 | mock 仍在旧 workflows | 不迁 mock，主线只保留可测试的 fake port 单测 |

## 关键缺口

### 1. Markdown 不是完整运行期入口

Round 8 已经让 Markdown 路径写入 SQLite，但还缺一个明确的同步服务：

```text
Alembic/recipes/*.md
  -> RecipeMarkdownStore.loadAll()
  -> RecipeMarkdownSyncService
  -> ContextIndex recipe/sourceRef/recipeFile/search docs
```

旧项目的原则是“查询走数据库，Markdown 是人和 AI 可维护的文件真相”。新主线目前编译时会读回 Markdown，但没有独立 reconciliation：文件被人工改了、被删除了、移动了、旧 `_contentHash` 还在 frontmatter 里，都没有统一处理。

Round 9 需要补：

1. `_contentHash` 与 `contentHash` 双读，写入只写新字段。
2. Markdown 扫描到 DB 的同步报告。
3. DB 索引里存在但文件已不存在的 stale 记录报告。
4. 同 id 多文件冲突、解析失败、bucket/path 不一致的 warning。
5. 暂不自动删除 DB Recipe，先报告，避免误伤人工知识。

### 2. 运行期召回还太直线

旧 `PrimeSearchPipeline` 虽然重，但有几块有效逻辑：

1. 从任务、当前文件、技术词、错误文本扩展查询。
2. 对候选结果做 absolute threshold、relative top1、score gap 过滤。
3. 把 path/symbol/语言信号作为排名上下文。

新主线现在是可用的，但更像“单查询 + 图扩展”。对 IDE prime 来说还不够强，特别是中英混合、当前文件上下文、错误信息召回场景。

Round 9 应做轻量 `MainlineQueryPlanner`：

```text
taskText + activeFiles + symbols + diagnostics
  -> query variants
  -> SearchIndex 多次召回
  -> 去重合并
  -> 质量过滤
  -> RuntimeRetrievalPipeline
```

不要迁旧 CrossEncoder、CoarseRanker、MultiSignalRanker、ContextualEnricher。这些层级太重，收益不稳定。

### 3. Recipe 注入没有吃满统一实体

统一 Recipe 不是只为了存储，它应直接影响交付：

1. `when` 决定触发语境。
2. `do` / `dont` 决定 agent 的行动边界。
3. `coreCode` 给最短可执行样例。
4. `usageGuide` 给使用说明。
5. `constraints`、`delivery`、`quality` 决定是否注入、如何排序、如何展示。

当前 `AgentInjectionPlanner` 输出偏轻，只能证明链路通了，还不能完全替代旧 prime IDE 交付质量。Round 9 要先把这些字段纳入 plan 和 markdown，不做新的抽象层。

### 4. 冷启动和重扫入口还没真正切主线

`runMainlineProjectIntelligence()` 与 `MainlineCompileSession` 已经存在，但真实入口还没有完全替换：

1. daemon bootstrap/rescan 仍大量使用旧 workflow pipeline。
2. dashboard/MCP 标准工具仍读取旧服务。
3. `tools/v2` 的上下文工厂仍注入旧 DI 服务。
4. 内外部 workflow 的 Mission Briefing 还依赖旧 projector。

这里不能硬拆。正确顺序是：

1. 先做 `MainlineWorkflowEntrypoint`，作为 workflow 调用新主线的唯一入口。
2. 再做 mainline result 到旧 Mission Briefing 的轻投影。
3. 最后把 MCP search/structure/prime 改成 mainline-first，旧服务 fallback。

### 5. 文件监控与增量编译没有闭环

新主线已经有 `FileWatch`、`GitPort`、`FileFingerprintSnapshotStore`、`ProjectIntelligenceIncrementalPlanner`，但它们还没有连到 daemon：

```text
file events / git changed files
  -> coalesce
  -> affected source files
  -> MainlineCompileSession incremental
  -> SQLite/SearchIndex/Markdown reports
```

这属于进化架构，不是最上层冷启动。它应该排在 Markdown sync、运行期召回、注入字段之后，但要作为 Round 9 后半段明确任务。

## 剪枝原则

Round 9 明确不做这些迁移：

1. 不迁 Wiki 生成器。
2. 不迁 ReverseGuard 的反向优化闭环。
3. 不迁 ToolForge 动态锻造。
4. 不迁 AI mock bootstrap pipeline。
5. 不迁 CrossEncoder/CoarseRanker/MultiSignalRanker 重排序体系。
6. 不恢复旧 KnowledgeEntry 作为新运行期实体。
7. 不把 Markdown 查询做成运行期每次扫文件；查询仍走 SQLite/SearchIndex。

这些能力可以在文档里保留偏支记录，但不进入当前主线。

## Round 9 实现阶段

### 阶段 A：Recipe Markdown 同步与修复报告

目标：

1. 新增 `RecipeMarkdownSyncService`。
2. 支持 Markdown 全量扫描、DB recipeFiles 对照、stale/missing/conflict/warning 报告。
3. 修正 codec 读取旧 `_contentHash`。
4. 只做报告与 upsert，不做危险删除。

验收：

1. 单测覆盖旧 `_contentHash`。
2. 单测覆盖 Markdown -> SQLite recipeFiles。
3. 单测覆盖 DB 有记录但文件不存在的 stale report。

### 阶段 B：运行期查询计划与质量过滤

目标：

1. 新增轻量 `MainlineQueryPlanner`。
2. `RuntimeRetrievalPipeline` 支持 query variants。
3. 合并多次搜索结果并按分数/来源去重。
4. 增加 absolute、relative、gap 三类过滤。

验收：

1. 当前文件路径能增强召回。
2. 中英混合关键词能召回 Recipe。
3. 低分结果不会进入注入 bundle。

### 阶段 C：Recipe 注入字段补齐

目标：

1. `AgentInjectionPlanner` 输出 `when/do/dont/coreCode/usageGuide`。
2. markdown 注入内容对统一 Recipe 字段更完整。
3. 保持输出紧凑，不把完整 payload 原样灌给 agent。

验收：

1. 单测确认 do/dont 出现在注入计划。
2. 单测确认 coreCode/usageGuide 按 token budget 裁剪。

### 阶段 D：SourceRef 与 Recipe 关系修复

目标：

1. 从 `knowledge.relations` 和旧 legacy payload 提取 `RecipeEdge`。
2. 做轻量 SourceRef reconcile report：缺失文件、hash 不一致、路径疑似移动。
3. 先报告，不自动改动用户文件。

验收：

1. relation JSON 能变成 ContextIndex edge。
2. SourceRef stale 能进入 compile report。

### 阶段 E：workflow 主线入口

目标：

1. 新增 `MainlineWorkflowEntrypoint`。
2. cold-start/rescan 内部 workflow 能调用新主线 compile。
3. 生成旧 Mission Briefing 需要的轻量 projector，避免一次性改 dashboard。

验收：

1. cold-start 测试能看到 mainline compile result。
2. rescan 测试能走 incremental input。

### 阶段 F：文件监控增量触发

目标：

1. 新增 `MainlineFileChangeCompileService`。
2. 接入 `FileWatch`/`GitPort`/fingerprint snapshot。
3. daemon 文件变更可触发新主线增量。

验收：

1. 修改源文件后生成 changed file 计划。
2. 删除文件后清理相关 search docs 或报告 stale。

## 子 agent 拆分

### Worker A：Recipe Markdown 同步

文件范围：

1. `lib/mainline/knowledge/RecipeMarkdownCodec.ts`
2. `lib/mainline/knowledge/RecipeMarkdownStore.ts`
3. `lib/mainline/knowledge/RecipeMarkdownSyncService.ts`
4. `lib/mainline/knowledge/index.ts`
5. `test/unit/MainlineRecipeMarkdown*.test.ts`

任务：

1. 补 `_contentHash` 读取兼容。
2. 实现 Markdown 与 ContextIndex 的同步报告。
3. 不做删除，只报告 stale/missing/conflict。

### Worker B：运行期查询计划

文件范围：

1. `lib/mainline/runtime/MainlineQueryPlanner.ts`
2. `lib/mainline/runtime/RuntimeRetrievalPipeline.ts`
3. `lib/mainline/runtime/index.ts`
4. `test/unit/MainlineRuntime*.test.ts`

任务：

1. 多查询扩展。
2. 多搜索结果合并。
3. 质量过滤。

### Worker C：Recipe 注入字段

文件范围：

1. `lib/mainline/agent/AgentInjectionPlanner.ts`
2. `test/unit/MainlineKnowledgeInjection.test.ts`
3. `test/unit/MainlineAgentInjectionPlanner.test.ts`

任务：

1. 让注入计划使用 `when/do/dont/coreCode/usageGuide`。
2. 控制 token 预算和输出长度。
3. 不改 RuntimeRetrievalPipeline。

### 主线程：整合与后续入口

文件范围：

1. 文档与任务协调。
2. 必要时补导出和集成测试。
3. 等前三个 worker 完成后，再决定是否启动 workflow entrypoint worker。

主线程本轮不和 worker 抢同一批业务文件，避免冲突。

## 优先级

第一优先级是阶段 A、B、C。原因：

1. Markdown 同步决定知识实体能否稳定维护。
2. 查询计划决定运行期是否真正可用。
3. 注入字段决定 Recipe 是否能直接服务 agent。

workflow 入口、文件监控、SourceRef 自动修复都重要，但它们依赖前面三块的行为稳定。先把知识存储、召回、注入打实，再接冷启动/重扫入口，迁移成本最低。
