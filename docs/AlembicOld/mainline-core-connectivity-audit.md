# 新主线核心链路连通性审计

更新时间：2026-05-09

## 1. 总览

这份文档按核心闭环拆分 Alembic 新主线：

1. 冷启动链路：`alembic_bootstrap` / bootstrap job 触发全量清理、项目事实编译、内容挖掘、Markdown 与运行期索引写入。
2. 运行期注入链路：Codex 调用 `alembic_task prime`，读取主线 SQLite / SearchIndex，生成 ContextBundle 与注入 Markdown。
3. 任务关闭链路：Codex 调用 `alembic_task close`，持久化 intent 信号，并要求立刻执行 `alembic_guard`。
4. Guard 链路：`alembic_guard` 自动检查 diff / 指定文件 / inline code，并消费主线 guard-rule Recipe。
5. Codex 提交 Recipe 链路：`alembic_submit_knowledge` 经过旧 Gateway 保存后，立即同步到主线 Markdown、SQLite、SearchIndex。
6. Recipe 进化衰退链路：`alembic_rescan` 通过主线增量编译、RecipeImpact、RecipeEvidence、ReverseHealth、DecayPolicy 形成衰退与进化信号。

本轮目标不是引入新的大抽象，而是修补“已经有主线模块，但入口没有接上”的断点。

本轮已经落地的代码修复：

- `CleanupService.fullReset()` 清理新主线 SQLite 表与 `.asd/context` 运行期产物。
- `alembic_task prime` 暴露并透传 `files / symbols / diff / errors / diagnostics`。
- `ContextBundleBuilder` 根据 Recipe 关系补取邻居 Recipe，避免只有边没有内容。
- `RuntimeRetrievalPipeline` 对不完整 SearchHit 做容错，降低替身索引或外部适配器带来的断裂风险。
- `alembic_submit_knowledge` 保存旧 KnowledgeEntry 后，立即同步主线 Markdown、SQLite、SourceRef 与 SearchIndex。
- `alembic_guard` 注入主线 `guard-rule` Recipe，并在 violation 里合并主线交付字段作为修复指南。

## 2. 冷启动链路

入口：

- `lib/workflows/cold-start/internal/InternalColdStartWorkflow.ts`
- `lib/workflows/cold-start/external/ExternalColdStartWorkflow.ts`
- `lib/workflows/capabilities/mainline/MainlineWorkflowEntrypoint.ts`
- `lib/mainline/compile/MainlineCompileSession.ts`

主线产物：

- `dataRoot/.asd/alembic.db` 中的 `mainline_recipes`、`mainline_source_refs`、`mainline_recipe_edges`、`mainline_recipe_source_refs`、`mainline_recipe_files`
- `dataRoot/.asd/context/search-index.json`
- `dataRoot/.asd/context/file-fingerprint-snapshot.json`
- `dataRoot/.asd/context/project-intelligence.json`
- `dataRoot/Alembic/recipes` 与 `dataRoot/Alembic/candidates`

发现的问题：

- `CleanupService.fullReset()` 只清旧表和旧 context index 目录，没有清 `mainline_*` 表。
- 冷启动重新跑时，旧主线 Recipe / SourceRef / SearchIndex / 指纹基线可能残留，造成 prime 读到旧知识。

本轮修复：

- `CleanupService.fullReset()` 增加清理：
  - `mainline_recipe_source_refs`
  - `mainline_recipe_files`
  - `mainline_recipe_edges`
  - `mainline_recipes`
  - `mainline_source_refs`
- `fullReset()` 增加清理 `dataRoot/.asd/context`，确保搜索快照和指纹基线在冷启动前归零。

验证：

- `test/unit/CleanupService.test.ts` 增加 full reset 清主线表和 runtime context 的测试。

## 3. Codex Prime 注入链路

入口：

- `lib/external/mcp/handlers/task.ts`
- `lib/mainline/agent/MainlinePrimeRunner.ts`
- `lib/mainline/runtime/RuntimeContextLoader.ts`
- `lib/mainline/runtime/RuntimeRetrievalPipeline.ts`
- `lib/mainline/runtime/ContextBundleBuilder.ts`
- `lib/mainline/agent/AgentInjectionPlanner.ts`

链路：

1. `alembic_task operation=prime`
2. `MainlinePrimeRunner.run()`
3. `loadMainlineRuntimeContext()`
4. 恢复 SQLite ContextIndex 与 JSON SearchIndex
5. `RuntimeRetrievalPipeline.retrieve()`
6. `ContextBundleBuilder.build()`
7. `AgentInjectionPlanner.toPlan()` 与 `toMarkdown()`

发现的问题：

- MCP schema 只暴露 `userQuery / activeFile / language`，但主线 PrimeRunner 已经支持 `files / symbols / diff / errors`。
- 这会让 Codex 在真实工作时无法把当前 diff、诊断、多个活动文件传入主线召回。
- `RuntimeRetrievalPipeline.mergeSearchHits()` 假设所有 SearchIndex 实现都会返回完整 `meta`，对测试替身或未来外部适配器不够稳。

本轮修复：

- `TaskInput` 增加：
  - `files`
  - `symbols`
  - `diff`
  - `errors`
  - `diagnostics`
- `taskHandler` 的 `_runMainlinePrime()` 透传这些字段到 `MainlinePrimeRunner`。
- `RuntimeRetrievalPipeline` 合并 search hit 时容错缺失 `confidence/meta.topGap`。

验证：

- `test/integration/ZodSchemas.test.ts` 增加 Prime 上下文信号 schema 测试。
- `test/unit/MainlineRuntime.test.ts` 覆盖缺失 `meta` 的 SearchIndex 替身。

## 4. Recipe 关系注入链路

入口：

- `lib/mainline/runtime/RuntimeRetrievalPipeline.ts`
- `lib/mainline/runtime/ContextBundleBuilder.ts`
- `lib/mainline/runtime/GraphExpansion.ts`

发现的问题：

- `GraphExpansion` 可以根据 `requires / same_context / refines` 扩展 Recipe id，但 `ContextBundleBuilder` 没有补取邻居 Recipe 对象。
- 结果是 bundle 里可能只有边，没有被关系带进来的 Recipe 内容，Prime 注入会少一段关键知识。

本轮修复：

- `GraphExpansionResult` 增加 `expandedRecipeIds`。
- `ContextBundleBuilder` 在图扩展后调用 `findRecipesByIds()` 补齐缺失邻居 Recipe。
- 补齐邻居 Recipe 后重新执行图扩展，并重新收集全部 Recipe 的 SourceRef。

验证：

- `test/unit/MainlineRuntime.test.ts` 增加“seed Recipe 通过 requires 带入 neighbor Recipe”的测试。

## 5. Codex 提交 Recipe 链路

入口：

- `lib/external/mcp/handlers/consolidated.ts`
- `lib/service/knowledge/RecipeProductionGateway.ts`
- `lib/external/mcp/handlers/mainline-recipe-markdown.ts`
- `lib/mainline/legacy/KnowledgeEntryRecipeCodec.ts`

链路：

1. Codex 调用 `alembic_submit_knowledge`
2. `RecipeProductionGateway.create()` 做校验、去重、融合、旧 KnowledgeService 保存
3. `persistMainlineRecipeMarkdown()` 将旧 KnowledgeEntry 映射为统一 Recipe
4. 写入 `dataRoot/Alembic/candidates|recipes`

发现的问题：

- 之前只写 Markdown。
- Prime 运行期读的是 SQLite ContextIndex 与 SearchIndex，不直接读 Markdown。
- 因此 Codex 刚提交的新 Recipe 要等下一次 cold-start/rescan 才能进入 Prime，可用性断裂。

本轮修复：

- `persistMainlineRecipeMarkdown()` 现在同时写入：
  - Recipe Markdown
  - SQLite `mainline_recipes`
  - SQLite `mainline_recipe_files`
  - 可推断的 `mainline_source_refs`
  - JSON SearchIndex 快照
- 提交后的 Recipe 可以被 `findRecipesByIds()`、`findRecipesByFiles()` 和 SearchIndex 立即召回。

验证：

- `test/unit/MainlineRecipeMarkdownStore.test.ts` 增加断言：
  - 提交后 SQLite 可查到 Recipe
  - active file path 可反查 Recipe
  - SearchIndex 可搜索到 trigger

## 6. Guard 链路

入口：

- `lib/external/mcp/handlers/task.ts`
- `lib/external/mcp/handlers/guard.ts`
- `lib/service/guard/GuardCheckEngine.ts`

链路：

1. `alembic_task close` 持久化 intent，并返回必须执行 `alembic_guard` 的 nextAction。
2. `alembic_guard` 根据参数进入 review / files / code / reverse_audit 等路径。
3. GuardCheckEngine 执行内置规则、旧 DB guard rules、Enhancement Pack 规则。

发现的问题：

- 主线已经有 `Recipe.kind = guard-rule` 与 `knowledge.constraints.guards`，但 Guard 没有消费主线 Recipe。
- 如果 Recipe 来源是 Markdown / 主线 SQLite，Guard 规则不会执行。
- review 结果 inline recipe 修复指南也只读旧 DB，不读主线。

本轮修复：

- `guard.ts` 增加主线 guard-rule 加载：
  - 从 `dataRoot/.asd/alembic.db` 读取 `mainline_recipes`
  - 过滤 active / staging / evolving / decaying 的 guard-rule Recipe
  - 将 `knowledge.constraints.guards[].pattern` 注入 `GuardCheckEngine.injectExternalRules()`
- `_loadRuleRecipes()` 合并主线 Recipe 的 `doClause / dontClause / coreCode`，让 violation 能带修复指南。

验证：

- `test/unit/MainlineGuardRules.test.ts` 覆盖主线 guard-rule Recipe 被 `guardCheck()` 执行。

## 7. Close 到 Guard 的边界

现状：

- `alembic_task close` 仍然不直接执行 Guard，而是返回 `nextAction.required = true`。
- 这是当前 MCP 工具调用模型的边界：task handler 不应在 close 内部隐式递归调用另一个 MCP handler。

连通性判断：

- close 已经明确产出 required nextAction。
- Guard 本身已经能消费主线 guard-rule。
- 对 Codex 使用侧来说，链路是：`close -> required alembic_guard -> guard result`。

后续可优化：

- 在 Codex skill / 插件提示层强化“close 后必须立即 guard”。
- 如果未来工具运行器支持安全的 tool chaining，可以把 close 的 Guard 检查做成同一事务里的后置动作。

## 8. Recipe 进化衰退链路

入口：

- `lib/workflows/knowledge-rescan/internal/InternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/knowledge-rescan/external/ExternalKnowledgeRescanWorkflow.ts`
- `lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts`
- `lib/mainline/compile/RecipeImpactAnalyzer.ts`
- `lib/mainline/compile/MainlineDecayPolicy.ts`
- `lib/mainline/compile/MainlineReverseHealthCheck.ts`
- `lib/mainline/compile/RecipeEvidenceLinker.ts`

链路：

1. Rescan 清理衍生缓存，但保留 Recipe 与增量证据。
2. `runMainlineWorkflow(mode=incremental)` 基于 fingerprint baseline 计算 changed/deleted/added。
3. `RecipeImpactAnalyzer` 计算 Recipe 与文件变更的影响。
4. `RecipeEvidenceLinker` 对齐 Recipe 与 ProjectIntelligence 事实。
5. `MainlineReverseHealthCheck` 检查 Recipe 交付内容与代码事实漂移。
6. `MainlineDecayPolicy` 汇总为衰退信号。
7. `submitMainlineRescanImpactDecisions()` 进入 EvolutionGateway。

本轮判断：

- 主线进化衰退链路总体已连通。
- 更大的风险是冷启动残留旧主线产物会污染后续增量 baseline，本轮 full reset 已修。
- 另一个风险是 Codex 新提交 Recipe 不立即进入主线 ContextIndex，本轮已修。

## 9. 剩余风险

1. Guard 主线注入目前只处理 regex guard；`astQuery` 仍依赖旧 DB guard 读取路径。
2. 主线 `Recipe.status = candidate` 不能区分旧 lifecycle 的 pending/staging；Guard 通过 `knowledge.governance.lifecycle` 判断 staging/evolving/decaying，字段缺失时不会执行 candidate 规则。
3. `alembic_task close` 仍是 nextAction 模式，不是自动执行 Guard。
4. Rescan 的 recipe snapshot 仍来自旧 `knowledge_entries`，主线 Markdown-only Recipe 是否进入旧快照依赖同步服务。
5. SearchIndex 仍是 JSON 快照，提交并发时需要继续观察是否存在最后写覆盖问题。

## 10. 下一步建议

1. 做一轮真实插件自测：bootstrap -> submit knowledge -> prime -> edit -> close -> guard -> rescan。
2. 补 `astQuery` 主线 guard-rule 到 GuardCheckEngine 的注入能力。
3. 为 `persistMainlineRecipeMarkdown()` 增加并发写入锁，防止多个提交同时保存 SearchIndex 快照时覆盖。
4. 将 rescan snapshot 从“旧 DB 优先”调整为“旧 DB + 主线 Markdown/SQLite 合并视图”。
5. 增加 MCP 层链路测试，模拟 Codex 的 prime / submit / guard 调用顺序。

## 11. 本轮验证

- `npm run typecheck`
- `npx vitest run test/unit/MainlineRecipeMarkdownStore.test.ts test/unit/MainlineGuardRules.test.ts test/unit/MainlineRuntime.test.ts test/unit/CleanupService.test.ts test/integration/ZodSchemas.test.ts`

结果：类型检查通过，5 个测试文件、84 个测试通过。
