# 新主线两轮迁移总计划

## 目标边界

这次迁移不是把 Alembic 收缩成一个 `mainline` 文件夹。新的主干分层是：

```text
frontend / plugins / extensions / terminal
  -> tools
  -> workflows / agent
  -> mainline
```

保留并继续建设：

1. `frontend / dashboard / plugins / extensions`：最外围产品层。
2. `terminal`：终端执行能力继续保留，只做优化和收敛。
3. `tools`：MCP、插件、IDE、Dashboard 的能力出口。
4. `workflows`：冷启动、重扫、内容挖掘、交付任务的业务编排层。
5. `agent`：AI 多轮分析、内容生产、工具调用和策略执行层。
6. `mainline`：新底座、新数据层、编译期、运行期、搜索、AI port、统一 Recipe。

需要退场的是旧 `service` 中重复、过重、低频或已经被 mainline 替代的核心逻辑；不是外围产品层，也不是 `workflows / agent / tools` 这三层。

## 迁移完成定义

两轮内的“完成”按核心热路径定义：

1. cold-start / rescan 由 `workflows` 编排，但项目扫描、Recipe/SourceRef/SearchIndex 落盘走 `mainline`。
2. prime / search / structure 等工具优先读取 `mainline runtime context`，旧服务只作为缺少数据时的 fallback。
3. AI 内容生产仍由 `agent/workflows` 执行，但产物进入统一 `RecipeSubmission -> Recipe -> Markdown/SQLite/SearchIndex` 链路。
4. 文件变更、git diff、增量扫描由 mainline fingerprint / GitPort / FileWatch 产生计划，daemon 只负责触发。
5. 插件、Dashboard、终端能力不重写，只改调用方向。

不在两轮内做：

1. 不迁 Wiki 生成器。
2. 不迁 ReverseGuard 反向优化闭环。
3. 不迁 ToolForge 动态锻造。
4. 不恢复旧 KnowledgeEntry 作为运行期实体。
5. 不把旧 CrossEncoder / CoarseRanker / MultiSignalRanker 全量迁入运行期。
6. 不在运行期每次扫描 Markdown，查询仍走 SQLite / SearchIndex。

## Round 10：热路径接入 mainline

当前状态：已完成代码接入与单测验证。

1. workflow 已新增 `runMainlineWorkflow()` 直接入口，并接入 cold-start / rescan 的 internal 与 external 两条路径。
2. MCP `search` 已 mainline runtime first；MCP `structure` 已读取 mainline ProjectIntelligence artifact；V2 `knowledge.search` 已优先使用 mainline runtime loader。
3. agent scan / translation / relation projection 已能产出统一 `RecipeSubmission` / `Recipe` / `RecipeEdge`。
4. Round 10 验证口径：`tsc --noEmit` 通过，mainline/runtime/workflow/MCP/V2 相关单测通过。

### 10A：Workflow 主线入口

新增一个直接入口，不做过度抽象：

```text
runMainlineWorkflow()
  -> runMainlineProjectIntelligence()
  -> MainlineCompileSession
  -> SQLite / Markdown / SearchIndex
```

接入点：

1. `workflows/cold-start/internal`
2. `workflows/cold-start/external`
3. `workflows/knowledge-rescan/internal`
4. `workflows/knowledge-rescan/external`

策略：

1. cold-start 必须执行 mainline compile。
2. rescan 必须执行 mainline incremental。
3. 旧 Mission Briefing 和旧 AI dimension pipeline 暂时保留，但它们消费 mainline 输出摘要。
4. 不再新增旧 `ProjectIntelligenceRunner` 的功能。

验收：

1. cold-start workflow response 包含 `mainline` 摘要。
2. rescan workflow response 包含 `mainline` 摘要。
3. 单测证明 `runProjectIntelligence` 旧入口不是唯一项目扫描来源。

### 10B：Tools / MCP mainline-first

先迁热路径：

1. `alembic_task prime` 已经 mainline-first，继续保留。
2. `alembic_search` 改成 mainline runtime first，失败或无数据再 fallback 旧 SearchEngine。
3. `alembic_structure` 增加 mainline ProjectIntelligence artifact 查询能力。
4. `tools/v2` 的 context factory 增加 lazy mainline runtime context。

策略：

1. 工具返回结构尽量保持旧 API 兼容。
2. 新增 `mainline` metadata 标记来源。
3. fallback 只能读旧服务，不能在 fallback 里触发新旧双写。

验收：

1. mainline 有 SearchIndex 时，search handler 不调用旧 SearchEngine。
2. mainline 无数据时，旧 SearchEngine fallback 仍工作。
3. V2 knowledge search 能拿到 mainline runtime context。

### 10C：Agent 生产进入统一 Recipe

保留 agent 执行层，但改产物边界：

```text
AgentRuntime / ScanRun / TranslationRun / RelationRun
  -> RecipeSubmission
  -> Recipe
  -> RecipeMarkdownStore / ContextIndex
```

策略：

1. 不改 AgentRuntime 主循环。
2. 不迁 mock bootstrap。
3. 在 agent run projection 层把旧候选格式映射为 `RecipeSubmission`。
4. 保留旧 candidate response 字段，但新产物必须写 mainline Recipe。

验收：

1. agent 生产候选时能生成统一 Recipe。
2. Recipe 的 do/dont/when/coreCode/usageGuide 字段不丢。
3. 写入 Markdown 和 SQLite 可被 prime 检索。

## Round 11：闭环收敛与旧服务退场

Round 11 不做“删除旧系统”的冒进动作，而是把热路径方向固定下来：

1. 新主线有数据时，运行期和工具优先读 mainline。
2. 旧 service 只保留 API adapter / fallback / 历史迁移来源。
3. 文件变更只触发 mainline incremental 刷新，不直接删除 Recipe。
4. SourceRef 与 RecipeEdge 先报告、再修复；默认不自动改用户代码或删除知识文件。

当前状态：已完成第一版实现。

1. 新增 `SourceRefReconcileReporter`，只输出 missing / stale / renamedCandidates 报告，不删除文件或 Recipe。
2. `RecipeRelationMiner` 已有统一 `mine()`，从 Recipe 显式关系与 sourceRef overlap 生成 `RecipeEdge`。
3. 新增 `MainlineFileChangeCompileService` 并注册到 `FileChangeDispatcher`，与旧 `FileChangeHandler` 并存。
4. `PrimeSearchPipeline` 增加 mainline-first adapter，旧 `SearchEngine` 只作为 fallback。
5. 新增 `LEGACY_SERVICE_RETIREMENT_CHECKLIST`，把旧 service 的退场边界变成可测试 artifact。
6. Round 11 验证口径：`tsc --noEmit` 通过，Round 10 + Round 11 相关 14 个单测文件 93 个测试通过。

### 11A：SourceRef 与关系修复

实现：

1. 从 `knowledge.relations`、legacy payload、sourceRef overlap 挖 `RecipeEdge`。
2. SourceRef reconcile report：missing、stale hash、renamed candidate。
3. 先报告，后修复；不自动删除用户文件。

退场：

1. `SourceRefReconciler` 不再被 hot path 直接调用。
2. 旧 `recipe_source_refs` 只作为 legacy migration 来源。

### 11B：文件监控增量触发

实现：

```text
DaemonFileChangeCollector / FileChangeDispatcher
  -> MainlineFileChangeCompileService
  -> MainlineCompileSession incremental
```

策略：

1. 保留 daemon 和 dispatcher。
2. 用 mainline `GitPort / FileWatch / FileFingerprintSnapshotStore` 计算影响范围。
3. 删除文件只清 search docs 或报告 stale，不删除 Recipe。

### 11C：旧 service 剪枝清单

转为 legacy 或 fallback：

1. `service/search/SearchEngine`：只保留 fallback。
2. `service/task/PrimeSearchPipeline`：退场，prime 使用 `MainlinePrimeRunner`。
3. `service/knowledge/KnowledgeService`：只做旧 API adapter，创建后进入 RecipeSubmission。
4. `service/knowledge/KnowledgeFileWriter`：退场，写入使用 `RecipeMarkdownStore`。
5. `cli/KnowledgeSyncService`：退场，同步使用 `RecipeMarkdownSyncService`。
6. `workflows/capabilities/project-intelligence/FileDiffPlanner`：退场，增量用 mainline fingerprint。

保留：

1. delivery / Cursor rules 显式交付命令。
2. terminal adapters。
3. Dashboard operations。
4. AgentRuntime 和 tool execution。

### 11D：插件与真实 smoke

验收线路：

1. 终端源码 smoke：BiliDili cold-start + prime。
2. Alembic 自身源码 smoke：mainline cold-start + prime。
3. 本地 dist MCP smoke：插件/MCP 指向当前构建产物。
4. 已发布插件 smoke：只验证发布包，不代表当前未提交源码。

当前状态：待执行。代码层两轮迁移已经闭合，真实 smoke 还需要在本轮代码稳定后单独跑。

## 子 agent 分工

### Worker A：Workflow 主线入口

范围：

1. `lib/workflows/capabilities/mainline/*`
2. `lib/workflows/cold-start/*`
3. `lib/workflows/knowledge-rescan/*`
4. `test/unit/MainlineWorkflowEntrypoint.test.ts`

任务：

1. 新增 direct mainline workflow entry。
2. cold-start/rescan 调用 mainline compile。
3. response 中带 mainline summary。

### Worker B：Tools / MCP mainline-first

范围：

1. `lib/external/mcp/handlers/search.ts`
2. `lib/external/mcp/handlers/structure.ts`
3. `lib/tools/v2/adapter/ToolContextFactory.ts`
4. `lib/tools/v2/handlers/knowledge.ts`
5. `test/unit/MainlineMcpTools.test.ts`

任务：

1. search handler mainline-first。
2. structure handler 能读取 mainline project artifact。
3. ToolContextFactory lazy runtime context。

### Worker C：Agent 生产统一 Recipe

范围：

1. `lib/agent/runs/scan/*`
2. `lib/agent/runs/relation/*`
3. `lib/agent/runs/translation/*`
4. `lib/workflows/capabilities/execution/internal-agent/*Projection*.ts`
5. `test/unit/MainlineAgentRecipeProduction.test.ts`

任务：

1. agent run 产物映射 `RecipeSubmission`。
2. 保留旧 response 字段。
3. 写入 mainline Markdown / ContextIndex。

### 主线程

范围：

1. 文档。
2. worker 结果整合。
3. 运行测试。
4. 控制旧 service 剪枝顺序。

### Round 11 Worker D：SourceRef / RecipeEdge 收敛

范围：

1. `lib/mainline/compile/*`
2. `lib/mainline/knowledge/*`
3. `lib/mainline/data/*`
4. `test/unit/*SourceRef*` / `test/unit/*Relation*`

任务：

1. 实现 mainline SourceRef reconcile report。
2. 从统一 Recipe 的 relations、sourceRef overlap、metadata 挖 `RecipeEdge`。
3. 单测覆盖 missing / stale / relation edge。

### Round 11 Worker E：文件变更增量触发

范围：

1. `lib/mainline/core/*`
2. `lib/mainline/compile/*`
3. `lib/service/evolution/*` 的小 adapter。
4. `test/unit/*FileChange*`

任务：

1. 新增 mainline file-change compile subscriber。
2. 保留 daemon / dispatcher，只新增 mainline 刷新订阅者。
3. 删除文件只报告 stale 或 search invalidation，不自动删 Recipe。

### Round 11 Worker F：旧 service 退场边界

范围：

1. `lib/service/task/*`
2. `lib/service/knowledge/*`
3. `lib/workflows/capabilities/project-intelligence/*`
4. 相关单测。

任务：

1. 给旧热路径增加 mainline-first 或明确 fallback 边界。
2. 不破坏旧 API，不直接删除外部仍调用的类。
3. 增加可验证的退场清单，后续按清单剪枝。

## 风险

1. 旧 bootstrap AI fill 仍较重，Round 10 不强行替换 AgentRuntime。
2. Dashboard 可能依赖旧 Mission Briefing 字段，所以先加 mainline summary，不直接删旧字段。
3. 旧发布插件跑的是已发布包，不代表当前源码，必须补本地 dist MCP smoke。
4. 两轮迁移完成后仍会有 legacy fallback，但 hot path 应默认走 mainline。
