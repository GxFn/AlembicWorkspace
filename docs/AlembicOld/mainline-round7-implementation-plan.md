# 新主线 Round 7 实现方案

## 结论

当前新主线已经有一套可用底座：`core` 负责环境、路径、日志、并发、定时器和写边界，`data` 有 `ContextIndex` 与 SQLite 实现，`code` 有轻量 AST/语言/导入解析，`graph` 有项目全景 artifact，`compile` 有证据包、内容挖掘和项目全景 runner，`runtime/agent` 有运行期召回和注入计划。

下一步不应该继续横向铺更多底层能力，而是把已有能力收束成一条真实可执行主线：

```text
编译期主线:
项目文件 -> 文件指纹 -> ProjectIntelligence artifact -> SourceRef/SearchDoc/Recipe/Edge -> ContextIndex/SearchIndex

运行期主线:
当前任务/文件/diff/error -> RuntimeRetrievalPipeline -> ContextBundle -> KnowledgeInjectionRunner -> agent/tools/workflows
```

这轮的核心不是做投影，也不是给旧 workflow 套兼容层，而是让保留的 `agent`、`tools`、`workflows` 入口直接调用新主线实现。旧 `project-intelligence` phase runner 可以暂时留在仓库里，但维护路径不再继续往它里面加功能。

## 基于代码的现状判断

### 已经打实的部分

`lib/mainline/core/MainlineKernel.ts` 已经提供新主线装配根，并注册了环境、单例、日志、事件、定时器、并发、worker、路径、写边界、文件系统、文件监控、git、测试模式、数据库、搜索、AST、项目图、运行期注入等能力。

`lib/mainline/data/SqliteContextIndex.ts` 已经把 `SourceRef`、`Recipe`、`RecipeEdge` 放在同一个 `upsertContextArtifacts` 事务里写入，JSON payload 是事实源，表结构只承担索引和关联查询。

`lib/mainline/compile/CompileArtifactWriter.ts` 已经规定编译期统一写入 `ContextIndex`，这符合“不让 scanner/miner 偷偷持久化”的边界。

`lib/mainline/compile/ProjectIntelligenceRunner.ts` 已经能做全量扫描、增量 patch、artifact merge、SourceRef 物化、搜索文档写入、artifact store 保存。

`lib/mainline/compile/ContentMiningRunner.ts` 已经串起“增量证据编译 -> 内容挖掘 -> ContextIndex 写入”，`RecipeRelationMiner` 能提供保守的 SourceRef overlap 关系。

`lib/mainline/runtime/RuntimeRetrievalPipeline.ts` 已经能从 `ContextIndex + SearchIndex` 召回 Recipe、SourceRef、搜索命中与降级 hint，`ContextBundleBuilder` 也已经可以在传入 `searchIndex` 或 `retrievalPipeline` 时使用这条富召回路径。

`lib/mainline/knowledge/RecipeSubmission.ts` 和 `RecipeKnowledgePayload.ts` 已经把旧 KnowledgeEntry 里的交付、do/dont、reasoning、quality、governance、usage、source、headers、ai note 等字段收进统一 Recipe 实体。

### 主要缺口

1. `lib/workflows/capabilities/project-intelligence/ProjectIntelligencePipeline.ts` 仍然直接调用旧 `runAllPhases`。这条旧管线同时做 discoverer、tree-sitter AST、code entity graph、依赖、panorama、guard、dimension filtering，抽象层级和业务副作用都过重。

2. `MainlineProjectIntelligenceRunner` 目前只是 runner，不是一次完整 cold start session。它没有把 `FileFingerprintSnapshotStore`、`JsonMainlineProjectIntelligenceArtifactStore`、`SqliteContextIndex`、`SearchIndex`、`JobLedger` 组装成一个稳定入口。

3. `MainlineProjectIntelligenceMaterializer` 只物化项目事实的 `SourceRef` 与搜索文档，没有把 Recipe 搜索文档、Recipe 关系、向量刷新、编译提交记录放进同一轮主线结果里。

4. `KnowledgeInjectionRunner` 默认只接收 `ContextIndexReader`，如果调用方不手工注入 `ContextBundleBuilder(searchIndex/retrievalPipeline)`，运行期注入仍会退回只按文件找 Recipe 的窄路径。

5. `MainlineProjectGraphBuilder` 自己用正则解析 import，和 `MainlineImportParser`、`MainlineImportPathResolver` 重复。项目依赖图还没有吃到 AST 层已经解析出来的 import records 与路径解析结果。

6. `MainlineHybridSearch` 已经有 sparse/vector 融合和 `embedDocuments`，但编译期物化没有调用它。搜索目前是可用的 deterministic sparse search，尚未形成统一刷新策略。

7. Recipe Markdown 存储还没有落地。统一 Recipe 实体字段保住了，但 `Alembic/recipes` 目录下的人类可读/可编辑 codec 还缺一层。

## Round 7 主目标

实现一个具体、轻量、可测试的 `MainlineCompileSession`，作为编译期主线的唯一维护入口；同时让运行期注入默认走 `RuntimeRetrievalPipeline`。

目标不是一次删除所有旧代码，而是把新代码入口建成主干，后续迁移都接到这个入口上：

```text
MainlineKernel
  -> MainlineCompileSession
      -> FileFingerprintSnapshotStore
      -> MainlineProjectIntelligenceRunner
      -> ContentMiningRunner
      -> CompileArtifactWriter
      -> MainlineSearchIndex / MainlineHybridSearch
      -> JobLedger
  -> KnowledgeInjectionRunner
      -> RuntimeRetrievalPipeline
      -> ContextBundleBuilder
      -> AgentInjectionPlanner
```

## 实现分支

### 分支 A: 编译期会话入口

新增 `lib/mainline/compile/MainlineCompileSession.ts`。

职责只保留一条主路径：

1. 接收 `projectRoot`、`mode`、`scan`、`changedFiles`、`removedFiles`、`diffTextByPath`、`recipes`。
2. 用 `MainlineWorkspacePaths` 定位 data root、context artifact、数据库路径和日志路径。
3. 使用 `FileFingerprintSnapshotStore` 生成或对比文件指纹。
4. 明确区分 `cold-start` 和 `incremental`，不做静默兼容：没有 baseline 时只能显式执行 cold start。
5. 调用 `MainlineProjectIntelligenceRunner` 生成或合并项目全景 artifact。
6. 调用 `ContentMiningRunner` 写入 Recipe、RecipeEdge、SourceRef。
7. 刷新搜索索引，写入编译结果摘要。

建议接口：

```ts
export interface MainlineCompileSessionRequest {
  readonly projectRoot: string;
  readonly mode: 'cold-start' | 'incremental';
  readonly scan?: Omit<MainlineSourceFileScanOptions, 'root'>;
  readonly changedFiles?: readonly string[];
  readonly removedFiles?: readonly string[];
  readonly diffTextByPath?: Record<string, string>;
  readonly recipes?: readonly Recipe[];
  readonly generatedAt?: number;
}
```

返回值保持具体，不做旧 workflow result projection：

```ts
export interface MainlineCompileSessionResult {
  readonly mode: 'cold-start' | 'incremental';
  readonly projectRoot: string;
  readonly fingerprintDiff?: MainlineFileFingerprintSnapshotDiff;
  readonly projectIntelligence: MainlineProjectIntelligenceRunnerResult;
  readonly contentMining?: ContentMiningPipelineArtifacts;
  readonly search: {
    readonly upserted: number;
    readonly removed: number;
    readonly embedded: number;
    readonly embeddingFailures: number;
  };
  readonly warnings: readonly string[];
}
```

### 分支 B: 数据物化闭环

扩展 `ProjectIntelligenceMaterializer` 或新增 `CompileSearchMaterializer`。倾向新增一个小文件，避免项目全景 materializer 长成“什么都写”的对象。

需要补齐：

1. `searchDocumentsFromRecipes(recipes)`：Recipe 搜索文档需要包含 `title`、`summary`、`trigger`、`knowledge.delivery.whenClause`、`doClause`、`dontClause`、`usageGuide`、`body.markdown`、`tags`、`dimensionIds`、`sourceRefIds`。
2. `searchDocumentsFromSourceRefs(sourceRefs)`：让 diff/file/symbol 证据也能直接被运行期搜索命中。
3. `RecipeRelationMiner` 输出的边跟 `CompileArtifactWriter` 同事务进入 `ContextIndex`。
4. sparse search 先可靠刷新；vector embedding 作为可选能力挂在 `MainlineHybridSearch.embedDocuments` 后面，失败只进入 report，不阻断编译。

这里不要做两阶段事务。数据库事务和内存/向量搜索不可能天然同事务，正确做法是写一个 `compileCommit` 摘要到 `JobLedger`，记录数据库写入、搜索刷新、embedding 失败数，供后续恢复或重建。

### 分支 C: 项目图与 AST 事实统一

修改 `MainlineProjectIntelligenceBuilder` 和 `MainlineProjectGraphBuilder`：

1. `ProjectIntelligenceBuilder` 已经拿到了每个文件的 `imports`，项目图应该直接消费这些 import records。
2. `MainlineProjectGraphBuilder` 输入增加 `imports?: MainlineImportRecord[]` 和 `knownFiles/projectRoot/pathAliases`。
3. 使用 `MainlineImportPathResolver` 做本地、alias、baseUrl、Python dotted import 解析。
4. `semanticEdges` 保留 `imports/exports/requires/dynamic-import/declares/calls/constructs`，并新增 unresolved/external 事实进入 artifact 的 graph 部分，而不是伪装成 Recipe。

这一步会剪掉 `ProjectGraph.ts` 内部重复的正则 import 解析逻辑，让 AST 层和 graph 层接口一致。

### 分支 D: 运行期注入默认使用搜索

调整 `lib/mainline/agent/KnowledgeInjectionRunner.ts`：

1. constructor 增加 `searchIndex?: MainlineSearchIndex` 与 `retrievalPipeline?: RuntimeRetrievalPipeline` 依赖。
2. 如果传入 `searchIndex`，默认构建 `ContextBundleBuilder(index, { searchIndex })`。
3. `KnowledgeInjectionRunnerResult` 保留当前 `activeContext/bundle/plan/markdown`，不扩大 AgentRuntime 职责。
4. `AgentContextPresenter` 继续只渲染 Markdown，不扫描、不写库。

这会让运行期注入真正吃到编译期搜索文档、SourceRef、RecipeEdge 和降级 hint。

### 分支 E: workflows 入口接新主线

保留 `agent`、`tools`、`workflows` 目录，但调整维护入口：

1. 在 `lib/workflows/capabilities/project-intelligence/ProjectIntelligencePipeline.ts` 新增或切换到 `runMainlineProjectIntelligence`。
2. 这个入口直接装配 `MainlineKernel + MainlineCompileSession`，不再调用 `runAllPhases`。
3. cold start 和 rescan 调用方逐步改为消费 `MainlineCompileSessionResult`。
4. 旧 `ProjectIntelligenceRunner.ts` 不继续扩功能；后续只保留到调用点清零，再删除。

这里不要写“新结果转旧结果”的投影层。短期如果某个旧调用方还需要字段，就在该调用方改成读新 result 的明确字段。

### 分支 F: Recipe Markdown 存储

在主线可执行后再做，不放在 Round 7 第一批代码里。

后续新增 `RecipeMarkdownCodec`：

1. `Recipe -> Markdown`：frontmatter 保存 id/kind/status/tags/dimensionIds/sourceRefIds/confidence/updatedAt，正文保存 summary、when/do/dont、usageGuide、body.markdown、relations、constraints。
2. `Markdown -> RecipeSubmission`：只产出推荐的嵌套 knowledge 形态，再走 `normalizeRecipeSubmissionToInput`。
3. 不允许 Markdown codec 绕过 `RecipeSubmission` 直接写 Recipe，避免 AI 提交格式分叉。

## 剪枝边界

Round 7 不做这些事：

1. 不迁移 Wiki tool forge。
2. 不做 Reverse Guard 反向优化。
3. 不做 AI mock。
4. 不重建一套 workflow framework。
5. 不碰 VS Code extension。
6. 不把项目 facts 伪装成 Recipe。
7. 不给旧 `runAllPhases` 增加新的 phase。
8. 不做复杂投影层或 fallback 兼容路径。

## 并行任务窗口建议

窗口 1 负责编译期会话：

涉及 `lib/mainline/compile/MainlineCompileSession.ts`、`ProjectIntelligenceRunner.ts`、`ProjectIntelligenceArtifactStore.ts`、`FileFingerprintSnapshotStore.ts`，目标是 cold start 与 incremental 都能从一个入口执行。

窗口 2 负责数据与搜索物化：

涉及 `CompileArtifactWriter.ts`、`ProjectIntelligenceMaterializer.ts`、`search/HybridSearch.ts`、`search/SearchIndex.ts`、`data/JobLedger.ts`，目标是 Recipe/SourceRef/Graph search docs 同步刷新，并记录 embedding 降级。

窗口 3 负责 AST/graph 统一：

涉及 `MainlineImportParser.ts`、`MainlineImportPathResolver.ts`、`MainlineProjectGraphBuilder.ts`、`MainlineProjectIntelligenceBuilder.ts`，目标是移除 graph 内部重复 import 正则逻辑。

窗口 4 负责运行期和 workflows 接入：

涉及 `KnowledgeInjectionRunner.ts`、`ContextBundleBuilder.ts`、`ProjectIntelligencePipeline.ts` 以及冷启动/增量扫描调用点，目标是保留目录结构但把维护入口接到新主线。

## 测试计划

新增或扩展这些测试：

1. `test/unit/MainlineCompileSession.test.ts`
   - cold start 生成 artifact、SourceRef、search docs、fingerprint snapshot。
   - incremental 修改文件后刷新 affected SourceRef/search docs。
   - deleted file 会 stale 旧 SourceRef 并移除旧 search doc。

2. `test/unit/MainlineProjectIntelligence.test.ts`
   - 项目图消费 import records，不再依赖内部正则。
   - alias/baseUrl/Python dotted import 解析进入 graph。

3. `test/unit/MainlineSearch.test.ts`
   - Recipe 的 do/dont/trigger/usageGuide/body.markdown 能被搜索召回。
   - embedding 失败不阻断 sparse search。

4. `test/unit/MainlineKnowledgeInjection.test.ts`
   - `KnowledgeInjectionRunner(index, { searchIndex })` 默认走 `RuntimeRetrievalPipeline`。
   - 搜索命中的 SourceRef 能扩展到关联 Recipe。

5. `test/unit/AgentModuleBoundaries.test.ts`
   - maintained paths 只能从 `mainline` 取新主线能力。
   - 不允许 `project-intelligence` 新入口继续 import 旧 `#core/AstAnalyzer`。

验证命令：

```bash
npm run typecheck
npm run test:unit
npm run lint:repo-boundary
```

## 执行顺序

第一步先实现 `MainlineCompileSession`，因为它是所有后续接入的主干。

第二步补齐 search docs 和 compile commit report，让编译期结果可观察、可恢复。

第三步让 `KnowledgeInjectionRunner` 默认能吃 `searchIndex/retrievalPipeline`，验证运行期闭环。

第四步替换 workflows 的 project-intelligence 入口，开始让 cold start/rescan 调用新主线。

第五步再做 Recipe Markdown codec，把统一 Recipe 实体落成人类可维护的知识文件。

Round 7 完成标准：一次 cold start 能写出项目全景 artifact、ContextIndex、SearchIndex；一次 incremental 能基于 baseline 更新 affected facts；一次 knowledge injection 能从当前文件/diff/error 召回 Recipe、SourceRef、关系和 hint，并输出给 agent/tools/workflows 使用。
