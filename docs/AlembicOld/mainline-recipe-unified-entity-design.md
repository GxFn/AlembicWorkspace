# 新主干统一 Recipe 实体设计

本文档定义新主干 Recipe 的核心语义。结论是：Alembic 不拆多个知识实体，继续使用统一 `Recipe`，但 Recipe 内部必须有清晰层级，能同时服务 AI 提交、人工维护、Markdown 存储、搜索召回和 IDE/Agent 交付。

## 设计原则

1. Recipe 是唯一知识聚合根。
   - 不拆 `PatternRecipe`、`RuleRecipe`、`FactRecipe`、`WorkflowRecipe`。
   - 用 `kind/status/knowledge.classification.knowledgeType` 表达差异。

2. 字段分层，不做扁平大对象。
   - 顶层字段用于索引、召回、关系和状态判断。
   - `recipe.knowledge` 用于受管理的业务内容。
   - `recipe.metadata` 只用于迁移原文、未知扩展、临时来源，不承载主业务字段。

3. AI 提交格式必须可宽进严出。
   - AI 可以提交旧式扁平字段：`whenClause/doClause/dontClause/coreCode/usageGuide/content/reasoning`。
   - 主干入库前必须归一化成统一层级。
   - 严出表示 ContextIndex、Markdown、SearchIndex、注入链路都只消费归一化后的 Recipe。

## Recipe 层级

```text
Recipe
  id/title/kind/status/summary/trigger
  dimensionIds/tags/sourceRefIds/confidence/updatedAt
  knowledge
    classification
    delivery
    body
    relations
    constraints
    reasoning
    quality
    usage
    governance
    source
    headers
    ai
  metadata
    legacyKnowledgeEntry
    ingestion
    unknownExtensions
```

## 顶层字段

- `id`：稳定知识 ID。
- `title`：人类可读名称，也是搜索主标题。
- `kind`：粗粒度用途，限定为 `convention/pattern/fact/risk/workflow/guard-rule`。
- `status`：主干可消费状态，限定为 `candidate/active/stale/superseded/rejected`。
- `summary`：短摘要，用于搜索列表、ContextBundle 摘要和 AI 快速理解。
- `trigger`：召回触发词，通常来自 `knowledge.delivery.trigger`。
- `dimensionIds`：挖掘维度或知识域，不作为实体拆分依据。
- `tags`：辅助检索和分组。
- `sourceRefIds`：指向证据锚点。
- `confidence`：0-1，用于候选审核、注入排序和降级策略。
- `knowledge`：受管理知识内容。
- `metadata`：迁移和扩展保留区。

## delivery 字段语义

`delivery` 是旧字段里最容易误用的一组，也是注入链路最核心的一组。

- `trigger`
  - 作用：召回入口、短命令、搜索 hook。
  - 不表达适用条件，不替代 `whenClause`。
  - 示例：`@mainline-recipe-fields`

- `topicHint`
  - 作用：给搜索和 prime 一个主题归类提示。
  - 比 `tags` 更接近自然语言语境。
  - 示例：`Recipe field management`

- `whenClause`
  - 作用：适用条件。
  - AI 注入时用于判断“当前任务是否该用这条 Recipe”。
  - 示例：`When migrating legacy KnowledgeEntry into the mainline Recipe model`

- `doClause`
  - 作用：正向行动指南。
  - 这是交付给 AI 的核心“应该做什么”，应当清晰、可执行。
  - 示例：`Normalize submitted fields into recipe.knowledge before writing ContextIndex.`

- `dontClause`
  - 作用：反向边界。
  - 防止 AI 过度泛化、误用或把旧服务带回主线。
  - 示例：`Do not flatten every legacy field onto Recipe top-level.`

- `coreCode`
  - 作用：最小关键代码/接口片段。
  - 它不是完整源码归档，而是帮助 AI 快速落地的 anchor。
  - 示例：`createRecipeKnowledgePayload(snapshot)`

- `usageGuide`
  - 作用：更完整的使用说明。
  - 可以包含步骤、注意事项、例外情况、人工审核建议。

## body 字段语义

- `pattern`：可复用代码片段或模式主体。
- `markdown`：长文知识正文，适合架构说明、项目特写、操作指南。
- `rationale`：为什么这么做。
- `steps`：实施步骤。
- `codeChanges`：before/after 迁移型知识。
- `verification`：如何验证。

## AI 提交格式

AI 提交允许以下两种输入形态。

### 推荐形态

```json
{
  "title": "Mainline Recipe field management",
  "kind": "convention",
  "dimensionIds": ["knowledge-model"],
  "knowledge": {
    "classification": {
      "language": "ts",
      "category": "Architecture",
      "knowledgeType": "code-standard"
    },
    "delivery": {
      "trigger": "@mainline-recipe-fields",
      "whenClause": "When designing Recipe schema",
      "doClause": "Use recipe.knowledge as the managed field hierarchy.",
      "dontClause": "Do not create separate knowledge entities for every recipe kind.",
      "coreCode": "recipe.knowledge.delivery.doClause"
    },
    "body": {
      "rationale": "Unified Recipe keeps search, review, and injection simple."
    },
    "reasoning": {
      "whyStandard": "It preserves old fields while making new fields maintainable.",
      "sources": ["legacy KnowledgeEntry", "RecipeProductionGateway"],
      "confidence": 0.86
    }
  },
  "sourceRefIds": ["lib/mainline/knowledge/Recipe.ts"]
}
```

### 兼容形态

旧扁平字段仍可作为 AI 输入，但进入主线时必须归一化：

```json
{
  "title": "Mainline Recipe field management",
  "knowledgeType": "code-standard",
  "trigger": "@mainline-recipe-fields",
  "whenClause": "When designing Recipe schema",
  "doClause": "Use recipe.knowledge as the managed field hierarchy.",
  "dontClause": "Do not create separate knowledge entities for every recipe kind.",
  "coreCode": "recipe.knowledge.delivery.doClause",
  "usageGuide": "Keep delivery fields concise and actionable.",
  "content": {
    "rationale": "Unified Recipe keeps search, review, and injection simple."
  },
  "reasoning": {
    "whyStandard": "It preserves old fields while making new fields maintainable.",
    "sources": ["legacy KnowledgeEntry"],
    "confidence": 0.86
  }
}
```

## 关系层级

统一 Recipe 不代表关系都塞进正文。

- `recipe.knowledge.relations`
  - 保存 AI/人工提交时的原始关系桶。
  - 适合 Markdown roundtrip 和人工审阅。

- `RecipeEdge`
  - 保存可查询、可加权、可解释的一等图边。
  - 由关系挖掘、SourceRef overlap、人工确认或 legacy edge 迁移产生。

这两者不是两个知识实体，而是同一个 Recipe 的“内容关系”和“图谱索引”。

## 下一步实现

1. 新增 `RecipeSubmissionNormalizer`，把 AI 推荐形态和兼容形态归一化为 `RecipeInput`。
2. 让数据挖掘链路生成候选 Recipe 时直接输出推荐形态。
3. 新增 `RecipeMarkdownCodec`，使用同一层级生成 MD frontmatter/body。
4. SearchIndex 把 `delivery.when/do/dont/coreCode/usageGuide` 和 `body.rationale/markdown/pattern` 纳入权重。
