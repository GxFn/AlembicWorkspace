# 新主线旧代码细节逻辑深挖清单

## 结论

这次复盘的重点不是“旧项目还有哪些大模块”，而是旧代码里真正影响知识质量、召回质量和演进安全的细节逻辑。实际代码显示，旧项目的核心资产集中在八条决策链：

1. Recipe 提交闸门：字段规范、去重、融合、质量评分、置信路由。
2. Recipe 相似度与差异判断：标题、do/dont、coreCode、全字段 API token、guard pattern。
3. 文件变更影响判断：不是看文件整体像不像，而是看这次 diff 动到了哪些 Recipe token。
4. SourceRef 健康与路径修复：从 `reasoning.sources` 到桥接表，再到 rename/path rewrite。
5. 搜索召回与排序：查询扩展、字段权重、信心判断、可选向量融合、多信号重排。
6. 生命周期与提案执行：staging/evolving/decaying 不是状态名，而是一组观察、信号和超时策略。
7. 交付压缩与 token 预算：Channel A/B、do/dont、when、coreCode skeleton、CJK token 估算。
8. 冷启动/增量扫描编排：workflow 和 agent 保留，但它们产出的知识必须进入统一 Recipe 主线。

新主线现在已经有真实底座：`Recipe`、`RecipeKnowledgePayload`、Markdown codec/store、SQLite ContextIndex、SearchIndex snapshot、ProjectIntelligence、RuntimeRetrievalPipeline、workflow/tool/agent 的 mainline-first 接线。但对照旧代码，仍缺“提交/演进/注入前的决策逻辑”。也就是说，新主线的数据形态和运行链路已经可用，下一步要迁的是决策策略，而不是再搭抽象层。

## 1. Recipe 提交闸门

### 旧代码入口

- `lib/service/knowledge/RecipeProductionGateway.ts`
- `lib/domain/knowledge/UnifiedValidator.ts`
- `lib/domain/knowledge/FieldSpec.ts`
- `lib/service/evolution/ConsolidationAdvisor.ts`
- `lib/domain/evolution/RecipeSimilarity.ts`
- `lib/service/knowledge/ConfidenceRouter.ts`
- `lib/service/quality/QualityScorer.ts`
- `lib/service/knowledge/KnowledgeService.ts`
- `lib/service/bootstrap/BootstrapDedup.ts`

### 旧逻辑实际做了什么

`RecipeProductionGateway` 是旧项目最重要的提交入口。它统一处理 Agent Tool、MCP、IDE、batch import 的 Recipe 创建，并按顺序跑：

1. `UnifiedValidator` 字段和内容校验。
2. 相似度检查，默认 duplicate 阈值 0.7，召回时会使用 0.5。
3. `ConsolidationAdvisor` 判断 create / merge / reorganize / insufficient。
4. `KnowledgeService.create()`，再进入 `ConfidenceRouter`。
5. `QualityScorer` 更新质量分。
6. supersede proposal。
7. audit。

`UnifiedValidator` 的细节不是普通 schema validation。它会拒绝或警告：

1. `content.markdown` 过短，少于 200 字直接报错。
2. 长 markdown 却没有 code block 或 file reference。
3. `sourceRef`、`reasoning.sources` 只有裸文件名，缺少目录路径。
4. `coreCode` 以闭合括号、闭合花括号等残缺片段开头。
5. 标题是 `Singleton`、`Factory`、`Observer`、`MVC`、`MVVM` 这类泛泛模式名。
6. 标题、trigger、codeFingerprint 重复。

`FieldSpec` 是 AI 提交格式的旧权威，它不是静态文档，而是把字段绑定到交付管线：

1. `title/content/content.markdown/content.rationale/description/trigger/kind/doClause/dontClause/whenClause/coreCode/category/headers/reasoning/reasoning.whyStandard/reasoning.sources/knowledgeType/language/usageGuide` 属于 required。
2. `dimensionId/topicHint` 属于 expected。
3. `scope/complexity/content.pattern/sourceFile/tags` 属于 optional。
4. do/dont/when/coreCode 不是装饰字段，而是 Channel A/B、Guard、Search、QualityScorer 的输入。

`ConfidenceRouter` 把质量和置信度转成生命周期：

1. 默认 auto approve threshold 0.85。
2. trusted source threshold 0.7。
3. reject threshold 0.2。
4. high confidence 0.9 对应 24h staging grace period。
5. 普通高置信对应 72h staging grace period。
6. 缺 reasoning、内容过短、质量低都会降级到 pending。

`QualityScorer` 的评分是五维：

1. completeness 0.25。
2. contentDepth 0.30。
3. deliveryReady 0.20。
4. actionability 0.15。
5. provenance 0.10。

它会看 markdown 结构、rationale、reasoning.whyStandard、reasoning.sources、trigger 格式、language 合法性、tags/headers、coreCode 长度、do/dont/when、source 类型和 authority。

`BootstrapDedup` 是冷启动时的会话级去重，解决并发 dimension 产出重复 Recipe 的问题。它用 title 0.2 + clause 0.3 + code 0.3 + guard 0.2，默认阈值 0.65，并且分词包含 CamelCase、snake/kebab/path 和中文 2-gram。

### 新主线现状

新主线已经有：

1. `lib/mainline/knowledge/Recipe.ts`：统一 Recipe 实体。
2. `lib/mainline/knowledge/RecipeKnowledgePayload.ts`：保留旧字段。
3. `lib/mainline/knowledge/RecipeSubmission.ts`：归一化旧 flat shape 和新 nested shape。
4. `lib/mainline/knowledge/RecipeMarkdownCodec.ts`：Markdown 与 Recipe 双向转换。
5. `lib/mainline/legacy/AgentRecipeSubmissionMapper.ts`：Agent 产物映射到 `RecipeSubmission` / `Recipe` / `RecipeEdge` / `SourceRef`。

但这些主要是归一化和保真，不是提交闸门。`RecipeSubmission` 会接收并整理字段，却不会拒绝低质量 markdown、重复 trigger、残缺 coreCode、裸 source path，也不会触发 consolidation / quality / confidence / lifecycle。

### 必须迁移的直接实现

下一步需要新增一个主线直接实现，不要叫“投影层”：

```text
RecipeSubmission
  -> MainlineRecipeSubmissionPolicy
  -> MainlineRecipeSimilarityPolicy
  -> MainlineRecipeQualityPolicy
  -> accepted Recipe / rejected report / merge suggestion
```

建议文件：

1. `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
2. `lib/mainline/knowledge/RecipeSimilarityPolicy.ts`
3. `lib/mainline/knowledge/RecipeQualityPolicy.ts`

迁移内容：

1. 直接搬 `UnifiedValidator` 的字段/内容/唯一性判断。
2. 直接搬 `FieldSpec` 的 required/expected 语义，但不保留旧文档式 pipeline 描述为运行时依赖。
3. 直接搬 `QualityScorer` 五维评分。
4. 直接搬 `ConfidenceRouter` 的阈值和 staging 决策，写入 `recipe.knowledge.governance`。
5. 直接搬 `BootstrapDedup` 的 session-level 去重到 cold-start agent 结果收口处。

### 可以剪枝

1. 不迁 `service/candidate/SimilarityService.ts` 的磁盘 markdown 简单相似度。它只有 title 30%、summary 30%、code 40%，已经被 `RecipeSimilarity` 和 mainline search 取代。
2. 不恢复旧 `KnowledgeEntry` 作为新运行期实体。
3. 不让旧 `KnowledgeService` 继续作为新主线写入权威；它只能作为 legacy adapter 或 fallback。

## 2. 相似度、差异、重复判断

### 旧代码入口

- `lib/domain/evolution/RecipeSimilarity.ts`
- `lib/service/evolution/ConsolidationAdvisor.ts`
- `lib/service/evolution/RedundancyAnalyzer.ts`
- `lib/shared/recipe-tokens.ts`
- `lib/service/bootstrap/BootstrapDedup.ts`

### 旧逻辑实际做了什么

`RecipeSimilarity` 是旧项目已经抽出来的纯算法，值得直接迁。它有五维：

1. title 0.15。
2. clause 0.25。
3. code 0.15。
4. content 0.30。
5. guard 0.15。

其中 content 维度不是简单全文相似，而是从这些字段提取 API token：

1. `coreCode`
2. `content.markdown` 中的 code block
3. `content.pattern`
4. `content.steps[].code`

`shared/recipe-tokens.ts` 提取 token 时会：

1. 去掉注释和字符串。
2. 提取 identifier。
3. 过滤长度小于 4 的 token。
4. 过滤 `My/Example/Sample/Test/Foo/Bar/Baz/Demo/Dummy` 这类示例前缀。
5. 过滤语言关键字。

`ConsolidationAdvisor` 在提交前会判断：

1. `MIN_SUBSTANCE_SCORE = 0.3`，内容太薄就是 insufficient。
2. `ENHANCE_THRESHOLD = 0.4`，中等相似需要看字段差异。
3. `HIGH_OVERLAP_THRESHOLD = 0.65`，高重叠倾向 merge/reorganize。
4. 每次最多分析 30 个候选。
5. 同时检查同批候选之间的内部重复。
6. 多个高重叠时建议 reorganize。
7. 单个高重叠时建议 merge。
8. 模糊区间看 triggerConflict、doClauseSubset、coreCodeOverlap、categoryMatch。

`RedundancyAnalyzer` 批量扫描 active/staging Recipe，仍使用 `RecipeSimilarity` 统一算法，阈值也是 0.65。

### 新主线现状

新主线已经有 `mainline/core/TextAnalysis.ts`，包含：

1. CJK-aware token estimate。
2. identifier token。
3. API token 过滤。
4. n-gram similarity。

但它还没有一个主线 Recipe 级相似度策略，也没有 consolidation 决策。运行期 search 的 `FieldWeightedScorer` 是召回排序，不是提交前重复判断。

### 必须迁移的直接实现

新增 `MainlineRecipeSimilarityPolicy`：

1. 输入 `Recipe | RecipeSubmission | RecipeInput`。
2. 复用或迁移 `extractRecipeTokens` 的字段提取。
3. 保留五维权重。
4. 输出 `similarity`、`dimensions`、`fieldAnalysis`。
5. 供 `RecipeSubmissionPolicy`、cold-start dedup、redundancy report 共用。

关键点：这不是搜索层功能，不能只靠 SearchIndex 分数替代。SearchIndex 解决“找得到”，SimilarityPolicy 解决“该不该提交/合并/重组”。

## 3. 文件变更影响判断

### 旧代码入口

- `lib/service/evolution/ContentImpactAnalyzer.ts`
- `lib/service/evolution/FileChangeHandler.ts`
- `lib/service/evolution/RecipeImpactPlanner.ts`
- `lib/shared/diff-parser.ts`
- `lib/shared/recipe-tokens.ts`
- `lib/service/evolution/DaemonFileChangeCollector.ts`
- `lib/service/evolution/MainlineFileChangeCompileService.ts`

### 旧逻辑实际做了什么

`ContentImpactAnalyzer` 的核心思想非常关键：它分析“这次改了什么”，而不是“整个文件与 Recipe 是否相似”。

实际流程：

```text
git diff -U0
  -> parse hunks
  -> tokenize changed lines
  -> extract recipe tokens
  -> score = |T_recipe ∩ T_diff| / |T_recipe|
```

阈值：

1. score >= 0.3 => `pattern`。
2. score > 0 => `reference`。
3. 无 diff 时 fallback 到 full-file tokenize。
4. full-content pattern threshold 是 0.5。

`FileChangeHandler` 对不同事件有不同决策：

1. renamed：调用 `ContentPatcher` 和 `RecipePathRewriter` 修复 source refs、DB 字段、Markdown 文件内容。
2. deleted：标记 SourceRef stale；如果没有 active source refs，提交 deprecate proposal，confidence 0.9。
3. modified：找关联 Recipe，跳过不可追踪 lifecycle，算 diff impact；如果 pattern impact，则通过 `EvolutionGateway` 创建 update proposal。
4. created：跳过，不直接产知识。

`RecipeImpactPlanner` 是 batch rescan 侧的同类逻辑，基于 file fingerprint diff 产出候选：

1. `source-deleted`
2. `source-deleted-partial`
3. `source-modified-pattern`
4. `source-missing`

它会合并同一 Recipe 的多个原因，并按优先级排序：deleted > partial deleted > modified pattern > missing。

### 新主线现状

新主线已经有：

1. `lib/mainline/compile/DiffParser.ts`
2. `lib/mainline/compile/SourceRefMaterializer.ts`
3. `lib/mainline/compile/ProjectIntelligenceIncrementalPlanner.ts`
4. `lib/service/evolution/MainlineFileChangeCompileService.ts`

`SourceRefMaterializer.fromDiffText()` 已经可以从 unified diff 里提取 tokens 并生成 diff SourceRef。`ProjectIntelligenceIncrementalPlanner` 已经能根据 fingerprint diff 计算 changed/deleted/dependent/filesToParse/sourceRefIdsToRefresh/sourceRefIdsToStale/searchDocumentIdsToRemove。`MainlineFileChangeCompileService` 已接到 FileChangeDispatcher，但它注释明确说：只刷新 mainline 编译产物，Recipe 修复、弃用和审查仍由旧 FileChangeHandler 负责。

也就是说，新主线有增量编译计划，但还没有 Recipe 影响判断和演进决策。

### 必须迁移的直接实现

新增：

1. `lib/mainline/compile/RecipeImpactAnalyzer.ts`
2. `lib/mainline/compile/RecipeImpactPlan.ts`

迁移内容：

1. 使用主线 `DiffParser` + `SourceRefMaterializer` 的 diff tokens。
2. 使用 `RecipeKnowledgePayload.delivery.coreCode/body.markdown/body.pattern/body.steps` 提取 recipe tokens。
3. 保留 `pattern/reference/none` 影响级别和阈值。
4. 输出直接给 rescan workflow 和 file-change service。

不要先接自动修改。第一步只输出：

```text
recipeId
changedPath
reason
impactLevel
impactScore
matchedTokens
suggestedAction: update | deprecate | verify | none
```

## 4. SourceRef 健康、rename 与 Markdown 修复

### 旧代码入口

- `lib/service/knowledge/SourceRefReconciler.ts`
- `lib/service/knowledge/RecipePathRewriter.ts`
- `lib/service/knowledge/KnowledgeFileWriter.ts`
- `lib/mainline/compile/SourceRefReconcileReport.ts`
- `lib/mainline/compile/SourceRefMaterializer.ts`
- `lib/mainline/knowledge/SourceRef.ts`
- `lib/mainline/knowledge/RecipeMarkdownCodec.ts`
- `lib/mainline/knowledge/RecipeMarkdownSyncService.ts`

### 旧逻辑实际做了什么

`SourceRefReconciler` 从 `knowledge_entries.reasoning.sources` 填充 `recipe_source_refs` 桥接表。它会：

1. 验证路径是否存在。
2. 24h TTL 内跳过重复检查。
3. 设置 active/stale 状态。
4. 删除不再出现在 reasoning.sources 的旧桥接行。
5. 对 stale ratio 发 quality signal。
6. 用 `git log --diff-filter=R --name-status --pretty=format: -n 200` 检测 rename。
7. `applyRepairs()` 调用 `RecipePathRewriter` 写回 Recipe 和 Markdown。

`RecipePathRewriter` 会改四类内容：

1. `reasoning.sources`
2. `content.markdown`
3. `coreCode`
4. `.md` source file content

`KnowledgeFileWriter` 是旧 Markdown 存储层。它写出大量 scalar 字段和 `_content/_relations/_constraints/_reasoning/_quality/_stats/_lifecycleHistory/_agentNotes/_aiInsight/_contentHash` 等 JSON 字段。旧注释明确说 `.md` 是 source of truth，DB 是 index cache。

### 新主线现状

新主线已经有：

1. `RecipeMarkdownCodec`：frontmatter 保存完整 knowledge/metadata，正文使用 managed sections。
2. `RecipeMarkdownStore`：写入 `Alembic/candidates` 或 `Alembic/recipes`。
3. `RecipeMarkdownSyncService`：Markdown 与 ContextIndex 同步报告。
4. `SourceRefReconcileReporter`：只报告 missing/stale/renamedCandidates，不改 Recipe。
5. `SourceRefMaterializer`：可从 scanned file/git change/diff text 生成 SourceRef。
6. `SourceRef.isFreshSourceRef()`：运行期只使用 fresh source ref。

这是正确方向：默认报告，不自动改用户知识。但旧项目的 rename repair 仍有价值，不能忘掉。

### 应该迁移但保持显式触发

新增一个显式修复命令或 service：

1. `MainlineSourceRefRepairPlan`：只生成 repair plan。
2. `MainlineRecipePathRepairer`：用户/命令确认后才写 Markdown。

迁移内容：

1. rename candidate confidence 规则：metadata.oldPath 0.95、同 symbol 0.85、同 basename 0.65。
2. path rewrite 范围：reasoning.sources、body markdown、coreCode、Markdown 文件内容。
3. 默认只报告，不自动执行。

剪枝：

1. 不迁旧桥接表 `recipe_source_refs` 作为新权威。
2. 不让运行期每次读 Markdown 查 SourceRef。运行期继续走 SQLite ContextIndex。

## 5. 搜索召回、排序与注入

### 旧代码入口

- `lib/service/search/SearchEngine.ts`
- `lib/service/search/MultiSignalRanker.ts`
- `lib/service/search/BM25Scorer.ts`
- `lib/service/search/HybridRetriever.ts`
- `lib/service/search/CrossEncoderReranker.ts`
- `lib/service/delivery/KnowledgeCompressor.ts`
- `lib/service/delivery/TokenBudget.ts`
- `lib/shared/token-utils.ts`
- `lib/mainline/search/SearchIndex.ts`
- `lib/mainline/search/FieldWeightedScorer.ts`
- `lib/mainline/runtime/MainlineQueryPlanner.ts`
- `lib/mainline/runtime/RuntimeRetrievalPipeline.ts`
- `lib/mainline/runtime/ContextBundleBuilder.ts`

### 旧逻辑实际做了什么

`SearchEngine` 是重搜索体系：

1. keyword -> FieldWeighted。
2. auto mode 先跑 weighted，再根据 confidence 决定是否补 semantic。
3. semantic 可走 vectorStore/vectorService。
4. 可选 RRF 融合。
5. 可选 CrossEncoder、CoarseRanker、MultiSignalRanker。
6. `buildDocText()` 通过重复 title/trigger 增强权重。
7. `supplementDetails()` 会补 content、description、trigger、delivery fields、tags、quality、stats、active source refs。

它的 confidence 判断很有价值：

1. top gap。
2. title/trigger exact 或 substring。
3. code term query。
4. natural-language query 会降低 sparse confidence。

`MultiSignalRanker` 的排序信号包括：

1. relevance。
2. authority。
3. recency。
4. popularity。
5. difficulty。
6. contextMatch。
7. vector。

不同场景有不同权重：lint/generate/search/learning/default。

`KnowledgeCompressor` 是注入质量关键：

1. Channel A 生成 rule line，必须有 doClause，可带 language 前缀，可加 Do NOT。
2. Channel B 生成 When/Do/Dont，必须有 trigger/whenClause/doClause。
3. trigger 会按 suffix 去重。
4. Why 从 rationale 第一段抽取。
5. coreCode 会 skeletonize：去注释、折叠空行、截到 15 行以内。
6. fact 压成 `Know: title — summary`。

`TokenBudget` 的阈值：

1. Channel A max 800。
2. Channel B per file max 750。
3. Channel B max patterns 5。
4. Channel A max rules 15。
5. CJK 估算：中文约 2 chars/token，ASCII 约 4 chars/token。

### 新主线现状

新主线已经有：

1. `FieldWeightedScorer`：trigger 5、title 3、tags 2、summary 1.5、body 1、symbol 2.5、path 0.75、facets 0.5。
2. `SearchIndex`：稀疏搜索和可选 hybrid embedding。
3. `MainlineQueryPlanner`：task、technical-term、active-file、symbol、diagnostic 多查询 variants。
4. `RuntimeRetrievalPipeline`：多查询搜索、合并去重、质量过滤、ContextIndex hydrate、SourceRef freshness hints。
5. `ContextBundleBuilder`：图扩展、risk edges、suggested actions。

新主线已经覆盖“轻量可用召回”。缺口在交付压缩和排序信号：

1. 没有 Channel A/B 级别的 do/dont/when/coreCode skeleton 注入策略。
2. 没有把 quality、authority、usage、recency 等信号纳入 runtime 排名。
3. 没有旧 `KnowledgeCompressor` 的 compact delivery 输出。

### 必须迁移的直接实现

新增或增强：

1. `lib/mainline/runtime/RecipeInjectionCompressor.ts`
2. `lib/mainline/runtime/RuntimeRecipeRanker.ts`
3. `lib/mainline/runtime/RuntimeTokenBudget.ts`

迁移内容：

1. 直接搬 `KnowledgeCompressor` 的 Channel A/B 语义，但输入改为统一 `Recipe`。
2. 直接搬 `TokenBudget` 阈值和 CJK token 估算。
3. 从 `MultiSignalRanker` 迁最小有效信号：relevance、authority、recency、popularity、contextMatch。
4. 不迁 CrossEncoder / CoarseRanker 作为默认路径。
5. Hybrid/vector 保持可选增强，不进入热路径硬依赖。

## 6. 生命周期、提案和衰退

### 旧代码入口

- `lib/domain/knowledge/Lifecycle.ts`
- `lib/service/evolution/LifecycleStateMachine.ts`
- `lib/domain/evolution/EvolutionPolicy.ts`
- `lib/service/evolution/EvolutionGateway.ts`
- `lib/service/evolution/ProposalExecutor.ts`
- `lib/service/evolution/StagingManager.ts`
- `lib/service/evolution/DecayDetector.ts`
- `lib/service/guard/ReverseGuard.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
- `lib/workflows/capabilities/planning/knowledge/EvolutionPrescreen.ts`

### 旧逻辑实际做了什么

旧 lifecycle 有六态：

1. pending。
2. staging。
3. active。
4. evolving。
5. decaying。
6. deprecated。

可消费状态：staging、active、evolving。Guard 可用状态还包括 decaying。`LifecycleStateMachine` 是唯一状态转换入口，负责：

1. 检查合法 transition。
2. exit action。
3. DB update。
4. entry action。
5. transition event。
6. lifecycle signal。
7. timeout recovery。

中间态超时：

1. evolving 7d -> active。
2. decaying 30d -> deprecated。
3. pending 30d -> deprecated。
4. staging 7d 有 stuck warning，但没有 timeout target。

`EvolutionPolicy` 的核心阈值：

1. update false positive rate 必须 < 0.4。
2. update 需要 guardHits 或 searchHits。
3. deprecate dead threshold 19。
4. severe threshold 40。
5. recovery delta 10。
6. relevance healthy/watch/decay/severe 分界是 80/60/40/20。
7. deprecate 且 confidence >= 0.8 且 source != metabolism 可以 immediate execute。

`ProposalExecutor` 已从时间驱动改为信号驱动。它订阅 guard/search/decay/quality/usage/lifecycle 信号。update 通过后：

```text
active -> evolving -> ContentPatcher -> staging/active
```

deprecate 会根据 decay score 和 snapshot 判断 deprecated/decaying/reject。source_modified 且 direct/pattern 会拒绝 deprecate，因为源文件还在活跃修改。

`DecayDetector` 衰退检测策略：

1. 90 天无使用。
2. false positive rate > 0.4 且 triggers >= 10。
3. ReverseGuard 符号漂移。
4. SourceRef stale。
5. deprecated_by 关系。
6. contradiction。

衰退评分：

1. freshness 0.3。
2. usage 0.3。
3. quality 0.2。
4. authority 0.2。

`ReverseGuard` 做 Recipe -> Code 反向验证：

1. 从 coreCode 提取 API 符号。
2. 在 code_entities 中检查符号是否存在。
3. guard pattern 对项目文件重新匹配。
4. current matches 为 0 => high zero_match。
5. current/historical < 0.3 => medium match_rate_drop。
6. SourceRef stale >= 3 是 high，否则 medium。
7. high >= 2 => decay；high >= 1 或 medium >= 3 => investigate。

### 新主线现状

新 `Recipe.status` 只有：

1. candidate。
2. active。
3. stale。
4. superseded。
5. rejected。

旧 lifecycle 通过 `RecipeKnowledgePayload.governance.lifecycle` 保真，但新主线还没有状态机、proposal、decay policy。Round 11 文档里已把 ReverseGuard 默认剪枝，但实际代码显示 ReverseGuard 的一些判断仍是可复用的“报告型健康检查”。

### 应迁移的最小主线能力

不要完整迁 ProposalExecutor 的旧 orchestration。先迁三个纯策略：

1. `MainlineLifecyclePolicy`
   - 统一 status 和 legacy lifecycle 的映射。
   - 保留 staging/evolving/decaying 的 governance 字段。
   - 不强制旧六态变成新 Recipe 顶层状态。

2. `MainlineDecayPolicy`
   - 保留 freshness/usage/quality/authority 四维。
   - 保留 80/60/40/20 分界。
   - 输入来自 Recipe usage/quality/sourceRef health/search stats。

3. `MainlineReverseHealthCheck`
   - 不叫 ReverseGuard。
   - 只做报告，不自动 proposal。
   - 复用 coreCode symbol extraction、zero_match、match_rate_drop、source_ref_stale 的判断。

继续剪枝：

1. 不迁 signal-driven ProposalExecutor 作为主线默认热路径。
2. 不让 ReverseGuard 自动反向优化。
3. 不迁 Wiki/ToolForge 相关分支。

## 7. 冷启动、增量扫描、agent/workflows

### 旧代码入口

- `lib/workflows/capabilities/execution/internal-agent/BootstrapDimensionRuntimeBuilder.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
- `lib/workflows/capabilities/planning/knowledge/EvolutionPrescreen.ts`
- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/agent/runtime/BudgetController.ts`
- `lib/agent/context/ContextWindow.ts`
- `lib/tools/v2/compressor/OutputCompressor.ts`

### 旧逻辑实际做了什么

`BootstrapDimensionRuntimeBuilder` 构建每个 dimension 的 agent 输入：

1. 解析 dimension plan。
2. 注入 existing recipes。
3. 处理 rescan execution decisions。
4. 生成 `needsCandidates`。
5. 创建 `ContextWindow`。
6. 计算 analyst budget。
7. sharedState 里带 submittedTitles/submittedPatterns/submittedTriggers 和 `_bootstrapDedup`。
8. 传入 evidenceStarters、rescan context、project overview。

`KnowledgeRescanPlanBuilder` 目标是每个 dimension 5 条 Recipe，根据 coverage gap、file-change、recipe-decay、manual-request 决定 produce / verify-only / skip。

`KnowledgeRescanPlanner` 的 audit 来源优先级：

1. `RecipeImpactPlanner` diff-based candidate plan。
2. SourceRef bridge table active/stale。
3. lifecycle fallback。

`EvolutionPrescreen` 根据相关性审计把 Recipe 分为 healthy/dead/watch/decay/severe，并输出 audit hints。

`AgentRuntime` 自身有很重但有效的 budget 机制：

1. `BudgetController` 在 0.75 触发压缩，0.9 aggressive。
2. parallel tool budget 按 `ceil(parallelCount / 2)` 扩展总额。
3. per-tool 至少 400 chars。
4. `ContextWindow` 有 L0-L4 五层压缩和模型上下文窗口表。
5. tool quota 随使用率从 6000/15 降到 400/2。

`OutputCompressor` 对 terminal 输出做 parser-based 压缩：git status/diff/log、test、lint、grep、tree、package 等。

### 新主线现状

按之前决策，`agent / tools / workflows` 保留。新主线已经接了：

1. workflow 主线入口。
2. agent run 产物到 RecipeSubmission / Recipe。
3. MCP search / structure mainline-first。
4. V2 knowledge search mainline-first。
5. MainlineCompileSession cold-start/incremental。

实际缺口在 agent 产物收口和底层决策：

1. agent 生产的 Recipe 还没有通过主线 submission policy。
2. cold-start dedup 应接到 `_bootstrapDedup` 和主线 similarity。
3. rescan plan 应接 `RecipeImpactAnalyzer`，不再依赖旧 `RecipeImpactPlanner`。
4. 注入阶段应使用 `RecipeInjectionCompressor`，而不是简单拼字段。

### 不迁内容

1. 不动 AgentRuntime 主循环。
2. 不迁 AI mock bootstrap。
3. 不动 tools/workflows 顶层目录结构。
4. 不把 terminal compressor 搬进 mainline；tools 层继续拥有它。

## 8. AST、依赖图与项目全景

### 旧代码入口

- `lib/core/AstAnalyzer.ts`
- `lib/core/analysis/CallGraphAnalyzer.ts`
- `lib/core/ast/ProjectGraph.ts`
- `lib/service/knowledge/CodeEntityGraph.ts`
- `lib/service/panorama/PanoramaScanner.ts`
- `lib/infrastructure/vector/ASTChunker.ts`
- `lib/mainline/code/SourceFileScanner.ts`
- `lib/mainline/code/StructuralAstParser.ts`
- `lib/mainline/code/MainlineImportParser.ts`
- `lib/mainline/code/MainlineCallSiteExtractor.ts`
- `lib/mainline/code/MainlineSymbolTableBuilder.ts`
- `lib/mainline/graph/ProjectGraph.ts`
- `lib/mainline/graph/ProjectIntelligenceArtifact.ts`
- `lib/mainline/compile/ProjectIntelligenceRunner.ts`

### 旧逻辑实际做了什么

`CodeEntityGraph` 把旧 AST summary 写入 code entity 和 knowledge edge：

1. class/protocol/category/module/pattern 节点。
2. inherits/conforms/extends/depends_on/uses_pattern/is_part_of/calls/data_flow 边。
3. 从 patternStats 生成 pattern 节点，实例最多 50 条。
4. 从 SPM dependency graph 补 module entity。
5. 后续可用于 ReverseGuard 的 symbol exists 检查。

旧全景能力更宽，包含 panorama、module role、coupling、tech stack、AST chunking 等。但这些里有不少是重分析，不应一次性迁入热路径。

### 新主线现状

新主线已经有真实 AST/图底座：

1. `MainlineSourceFileScanner`
   - maxDepth 默认 8。
   - maxFiles 默认 5000。
   - includeTests/includeDocs/includeMarkdown 可控。
   - 用语言目录判断 source/doc/test。

2. `StructuralMainlineAstParser`
   - 支持 TS/JS、Python、Swift、Rust、Go、Java、Kotlin 的轻量符号抽取。
   - TS/JS 支持 class/interface/type/function/const function/method。
   - Python 支持 class/def。
   - Swift/Rust/Go/Java/Kotlin 都有第一版结构正则。
   - 不依赖旧 AstAnalyzer，也不启动 tree-sitter。

3. `MainlineImportParser`
   - TS/JS 支持 import/export/dynamic import/CommonJS require。
   - Python 支持 import/from import。
   - 输出结构化 import record。

4. `MainlineCallSiteExtractor`
   - TS/JS、Python 保守识别 direct/member/new call。
   - mask comments/strings。
   - 解析 argCount、isAwait、same-file target、callerSymbol。

5. `MainlineSymbolTableBuilder`
   - 生成稳定 FQN：`path::container.symbol`。
   - 维护 declarations/fileImports/fileExports。

6. `MainlineProjectGraphBuilder`
   - 生成 file/symbol nodes。
   - 生成 imports/exports/requires/dynamic-import/declares edges。
   - 记录 external/unresolved dependencies。
   - 检测 file cycles。

7. `MainlineProjectIntelligenceBuilder`
   - 合成 files/symbols/callSites/projectGraph/semanticEdges。
   - callSites 可生成 calls/constructs 边。

8. `MainlineProjectIntelligenceIncrementalPlanner`
   - changeRatio >= 0.35 时 full rebuild。
   - dependent depth 默认 2。
   - 基于 file dependency incoming map 计算 dependent files。

### 还需要补的能力

这里不需要回头搬旧 `CodeEntityGraph` 的 repository 层，但要补三个主线能力：

1. `ProjectPanoramaSummary`
   - 从 mainline artifact 生成 module role、language distribution、dependency cycles、external deps、test/source ratio。
   - 只读 artifact，不额外扫项目。

2. `RecipeEvidenceLinker`
   - 把 Recipe 的 sourceRefIds、coreCode token、reasoning.sources 和 project symbols/files 对齐。
   - 输出 Recipe -> file/symbol 的证据强度。

3. `SymbolHealthIndex`
   - 为主线健康报告提供 symbol exists、moved、missing 的快速查询。
   - 替代旧 CodeEntityRepository 在 ReverseGuard 中的存在性检查。

剪枝：

1. 不迁旧 panorama 的所有高层 report。
2. 不迁 ASTChunker/vector chunk 作为热路径。
3. tree-sitter adapter 可以后置，但输出必须复用 mainline AST port。

## 9. 当前新主线能力覆盖率

| 能力 | 新主线覆盖 | 差距判断 |
| --- | --- | --- |
| 统一 Recipe 字段保真 | 高 | 字段保留已可用，但缺 submission policy |
| Markdown 外显存储 | 高 | 读写已可用，缺显式 repair 命令 |
| SQLite ContextIndex | 高 | 已是运行期查询入口 |
| SearchIndex 可恢复 | 中高 | 召回可用，缺多信号排序和交付压缩 |
| ProjectIntelligence AST/依赖图 | 中高 | 底座可用，缺 panorama summary 和 Recipe evidence linker |
| RuntimeRetrieval | 中高 | 多查询和 freshness hints 已有，缺 ranking policy |
| Knowledge injection | 中 | 能注入，但还没完整吃 do/dont/when/coreCode/usageGuide 的旧压缩策略 |
| Agent 产物迁入 Recipe | 中 | mapper 已有，缺提交闸门 |
| Cold-start/rescan | 中 | workflow 接线已有，缺主线 dedup/impact/consolidation |
| File watch incremental | 中 | compile service 已接，缺 Recipe impact/evolution plan |
| SourceRef reconcile | 中 | 报告已有，缺显式 repair |
| Lifecycle/decay/proposal | 低 | 字段保真有，策略未迁 |
| Reverse health | 低 | 旧 ReverseGuard 可参考，但应改成报告型健康检查 |
| Wiki/ToolForge/AI mock | 不迁 | 属于剪枝对象 |

## 10. 下一轮实现顺序

### 阶段 1：提交闸门和相似度

优先级最高。原因是现在 agent/tools/workflows 已经能把产物推入主线，如果没有闸门，就会把低质量和重复 Recipe 更快地写进新存储。

实现：

1. `RecipeSimilarityPolicy`
2. `RecipeQualityPolicy`
3. `RecipeSubmissionPolicy`
4. cold-start session dedup 接主线 policy
5. agent 产物写入前必须通过 policy

验收：

1. 短 markdown 被拒绝。
2. 裸 source path 被 warning。
3. duplicate trigger/title/codeFingerprint 被拒绝。
4. 高相似 Recipe 返回 merge/reorganize 建议。
5. do/dont/when/coreCode 不丢。

### 阶段 2：Recipe impact 与 rescan/file-watch 闭环

实现：

1. `RecipeImpactAnalyzer`
2. `RecipeImpactPlan`
3. `MainlineFileChangeCompileService` 输出 Recipe impact summary。
4. knowledge-rescan planner 使用主线 impact plan。

验收：

1. diff 改到 Recipe API token 时判定 pattern。
2. 删除唯一 SourceRef 时建议 deprecate/verify。
3. 普通文件变更只刷新 compile/search，不创建 Recipe proposal。

### 阶段 3：注入压缩和 runtime ranker

实现：

1. `RecipeInjectionCompressor`
2. `RuntimeTokenBudget`
3. `RuntimeRecipeRanker`
4. `AgentInjectionPlanner` 使用压缩结果。

验收：

1. Channel A/B 输出包含 do/dont/when。
2. coreCode skeleton 不超过 15 行。
3. 中文 token 预算不会明显超限。
4. sourceRef stale 的 Recipe 不作为强证据注入。

### 阶段 4：SourceRef repair 和健康报告

实现：

1. `MainlineSourceRefRepairPlan`
2. `MainlineRecipePathRepairer`
3. `MainlineDecayPolicy`
4. `MainlineReverseHealthCheck`

验收：

1. rename candidate 能给出 confidence。
2. repair 只在显式调用时写 Markdown。
3. decay report 能复现 80/60/40/20 分界。

### 阶段 5：项目全景和证据链接

实现：

1. `ProjectPanoramaSummary`
2. `RecipeEvidenceLinker`
3. `SymbolHealthIndex`

验收：

1. artifact 可生成模块/语言/依赖摘要。
2. Recipe 能反查关联 file/symbol。
3. 缺失 symbol 能进入健康报告。

## 11. 需要继续剪掉的内容

明确不进入主线热路径：

1. `Wiki` 生成链路。
2. `ToolForge` 动态锻造。
3. AI mock bootstrap。
4. `SimilarityService` 的旧 markdown 相似度。
5. 默认 CrossEncoder/CoarseRanker。
6. 旧 `KnowledgeEntry` 运行期实体。
7. 旧 `CodeEntityGraph` repository 写入路径。
8. ReverseGuard 自动优化闭环。

保留但不重写：

1. `agent` 主循环。
2. `tools` 终端和压缩器。
3. `workflows` 顶层编排。
4. 外围 frontend/plugins/extensions。

## 12. 子任务拆分建议

### Worker A：提交闸门

范围：

1. `lib/mainline/knowledge/RecipeSubmissionPolicy.ts`
2. `lib/mainline/knowledge/RecipeQualityPolicy.ts`
3. `lib/mainline/knowledge/index.ts`
4. `test/unit/MainlineRecipeSubmissionPolicy.test.ts`

参考旧代码：

1. `UnifiedValidator`
2. `FieldSpec`
3. `QualityScorer`
4. `ConfidenceRouter`

### Worker B：相似度与冷启动去重

范围：

1. `lib/mainline/knowledge/RecipeSimilarityPolicy.ts`
2. `lib/mainline/core/TextAnalysis.ts`
3. `lib/workflows/capabilities/execution/internal-agent/BootstrapProjections.ts`
4. `test/unit/MainlineRecipeSimilarityPolicy.test.ts`

参考旧代码：

1. `RecipeSimilarity`
2. `ConsolidationAdvisor`
3. `BootstrapDedup`

### Worker C：文件变更影响

范围：

1. `lib/mainline/compile/RecipeImpactAnalyzer.ts`
2. `lib/mainline/compile/RecipeImpactPlan.ts`
3. `lib/service/evolution/MainlineFileChangeCompileService.ts`
4. `lib/workflows/knowledge-rescan/*`
5. `test/unit/MainlineRecipeImpactAnalyzer.test.ts`

参考旧代码：

1. `ContentImpactAnalyzer`
2. `RecipeImpactPlanner`
3. `FileChangeHandler`

### Worker D：注入压缩

范围：

1. `lib/mainline/runtime/RecipeInjectionCompressor.ts`
2. `lib/mainline/runtime/RuntimeTokenBudget.ts`
3. `lib/mainline/agent/AgentInjectionPlanner.ts`
4. `test/unit/MainlineKnowledgeInjection.test.ts`

参考旧代码：

1. `KnowledgeCompressor`
2. `TokenBudget`
3. `shared/token-utils`

### Worker E：SourceRef repair 与健康报告

范围：

1. `lib/mainline/compile/SourceRefRepairPlan.ts`
2. `lib/mainline/knowledge/RecipePathRepairer.ts`
3. `lib/mainline/compile/RecipeEvidenceLinker.ts`
4. `test/unit/MainlineSourceRefRepair.test.ts`

参考旧代码：

1. `SourceRefReconciler`
2. `RecipePathRewriter`
3. `ReverseGuard`

## 13. 最重要的执行原则

1. 不再新建复杂抽象层。旧代码里可复用的是算法和阈值，迁入时直接写主线实现。
2. 先保护写入质量，再增强扫描和注入。否则新主线会更快积累低质知识。
3. Recipe 仍保持统一实体，不拆成多个知识实体。拆分只发生在 payload 管理、索引表和运行期 bundle。
4. Markdown 是人和 AI 可维护外显层；查询和运行期仍走 SQLite/SearchIndex。
5. agent/tools/workflows 保留，向下改用 mainline policy/data/runtime。
6. SourceRef repair、Reverse health、decay 默认先报告，显式命令才写入。
7. 剪掉低频重功能，保留高频热路径：提交、扫描、搜索、注入、增量、证据健康。
