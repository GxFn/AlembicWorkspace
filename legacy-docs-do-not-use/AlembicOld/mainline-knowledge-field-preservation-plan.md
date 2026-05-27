# 新主干知识实体字段保真迁移计划

本文档回答一个硬约束：旧 `KnowledgeEntry` 迁入新主干 `Recipe` 时，字段不能丢失。新主干会继续保持轻量 `Recipe` 模型，但迁移层必须完整保存旧知识实体的结构化字段、交付字段、审核字段、统计字段和 Markdown 存储相关字段。

## 结论

旧知识结构不放弃，做法是“主干字段提升 + 受管理字段结构 + 完整原文封存”：

- `Recipe` 一等字段只承载运行期和搜索期最常用的字段：`id/title/kind/status/summary/trigger/dimensionIds/tags/sourceRefIds/confidence/updatedAt`。
- 新主线新增 `RecipeKnowledgePayload`，作为 `recipe.knowledge` 一等字段，按 `classification/delivery/body/relations/constraints/reasoning/quality/usage/governance/source/headers/ai` 管理字段。
- 旧 `KnowledgeEntry` 的完整快照写入 `recipe.metadata.legacyKnowledgeEntry.full`，作为保真迁移载体。
- 旧字段中的关键索引信息同步写入 `recipe.metadata.legacyKnowledgeEntry.promoted`，供后续 Markdown codec、候选审核、关系挖掘和注入链路使用。
- 未来 MD 文件仍然保留，但 MD 是人类可读/可编辑的知识外显层，不再承担底层事实数据库职责。

## 字段保真范围

已纳入保真的旧实体字段：

- 标识与生命周期：`id`、`title`、`description`、`lifecycle`、`lifecycleHistory`、`autoApprovable`、`stagingDeadline`
- 分类：`language`、`dimensionId`、`category`、`knowledgeType`、`kind`、`complexity`、`scope`、`difficulty`、`tags`
- 交付字段：`trigger`、`topicHint`、`whenClause`、`doClause`、`dontClause`、`coreCode`、`usageGuide`
- 值对象：`content`、`relations`、`constraints`、`reasoning`、`quality`、`stats`
- 代码头文件：`headers`、`headerPaths`、`moduleName`、`includeHeaders`
- AI 与审核：`agentNotes`、`aiInsight`、`reviewedBy`、`reviewedAt`、`rejectionReason`
- 来源：`source`、`sourceFile`、`sourceCandidateId`
- 时间戳：`createdBy`、`createdAt`、`updatedAt`、`publishedAt`、`publishedBy`
- 文件同步补充：`contentHash`
- 额外未知字段：迁移输入中出现的额外 key 也保存在 `full` 中，不进入主干一等模型。

## 实现分层

1. `legacy` 层新增 `mapKnowledgeEntryToRecipe()`。
   - 接受旧 `KnowledgeEntry` 实例或纯 JSON/row 对象。
   - 只做对象转换，不读取数据库，不启动旧服务，不触发 workflow。

2. `legacy` 层新增字段保真工具。
   - `LEGACY_KNOWLEDGE_ENTRY_FIELD_NAMES`：旧实体已知字段清单。
   - `snapshotLegacyKnowledgeEntry()`：生成 JSON-compatible 快照。
   - `recoverLegacyKnowledgeEntrySnapshotFromRecipe()`：从新 `Recipe` 恢复旧实体快照。
   - `inspectLegacyKnowledgeFieldPreservation()`：输出保真报告。

3. `knowledge` 层新增 `RecipeKnowledgePayload`。
   - `classification`：语言、类别、知识类型、复杂度、作用域、模块。
   - `delivery`：trigger、when/do/dont、coreCode、usageGuide。
   - `body`：pattern、markdown、rationale、steps、codeChanges、verification。
   - `relations/constraints/reasoning/quality/usage`：承接旧值对象。
   - `governance/source/headers/ai`：承接生命周期、来源、头文件和 AI/审核字段。

4. `Recipe` 主干保持轻量。
   - 不把旧 `KnowledgeEntry` 的几十个字段全部提升到 `Recipe`。
   - 结构化全文保存在 `metadata`，SQLite ContextIndex 已经按 payload JSON 保存真相源。

5. MD 存储后续接入。
   - 新增 `RecipeMarkdownCodec` 时，从 `Recipe.metadata.legacyKnowledgeEntry.full` 恢复旧字段。
   - 生成 MD frontmatter 时保留旧值对象 `_content/_relations/_constraints/_reasoning/_quality/_stats`。
   - 解析 MD 回来时生成候选 `Recipe`，同样放回 `metadata.legacyKnowledgeEntry.full`。

## 第一阶段验收

- 纯 JSON 旧实体迁移到 `Recipe` 后，输入中的全部 key 都能在 `metadata.legacyKnowledgeEntry.full` 找到。
- `KnowledgeEntry` 实例迁移时，`usageGuide` 这类旧 `toJSON()` 没有输出但实例上存在的字段仍能保留。
- 可维护字段进入 `recipe.knowledge`，而不是只能从 legacy full dump 中读取。
- `Recipe` 可恢复旧实体快照，供后续 MD codec 与候选审核使用。
- 类型检查、lint、`MainlineLegacy.test.ts` 通过。

## 后续阶段

1. Markdown codec：实现 `Recipe <-> Markdown` 双向转换，复用保真快照，不重新发明字段。
2. 候选知识挖掘：数据挖掘链路生成候选 `Recipe` 时直接填 `legacyKnowledgeEntry.full`。
3. 关系迁移：把旧 `relations` 桶映射为 `RecipeEdge`，同时保留原始关系桶。
4. 搜索索引增强：将 `whenClause/doClause/dontClause/coreCode/usageGuide/content.markdown` 纳入 search document 字段权重。
