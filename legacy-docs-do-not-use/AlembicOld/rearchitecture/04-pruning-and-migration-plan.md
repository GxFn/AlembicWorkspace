# 剪枝与迁移计划

> 迁移策略：不推倒旧系统，而是在旁边建立新主线。旧系统先供血，再冻结，再迁出默认链路。

## 1. 剪枝原则

一个功能要进入核心，必须满足三个条件：

1. 高频：日常开发中经常触发。
2. 低延迟：不会让当前任务等待大流程。
3. 闭环：能服务 `Compile -> ContextBundle -> Guard/Capture -> Compile`。

不满足的功能不是一定删除，但不能默认运行。

## 2. 功能处置清单

| 功能 | 当前问题 | 目标状态 | 迁移动作 |
| --- | --- | --- | --- |
| WikiGenerator / WikiRenderers | 行数重，默认 schedule，偏文档导出 | Advanced manual export | 从 `WorkflowCompletionFinalizer` 默认步骤移除。 |
| Wiki HTTP routes | 可用但不应代表主线 | 手动入口 | 保留 route，但在新 README 标为 advanced。 |
| ToolForge | 动态造工具带来不可控复杂度 | Experimental | 从新主线 DI 排除，旧 Agent fallback 加 feature flag。 |
| ReverseGuard | 价值存在但时机过早 | Advanced audit | 核心价值拆成 SourceRef freshness。 |
| ComplianceReporter | 低频报告 | Advanced report | 不参与默认 Guard。 |
| CoverageAnalyzer | 辅助质量分析 | Advanced | 不影响 Runtime Bundle。 |
| RuleLearner | 自动学习风险大 | Explicit review | 只生成候选，不自动写规则。 |
| SemanticMemory completion | 容易成为第三条主线 | Later | 默认关闭，保留显式任务。 |
| Panorama refresh | 容易拖慢完成流程 | Later/manual | 默认关闭。 |
| DeliveryVerifier | 与知识主线弱相关 | Legacy execution | 从编译期 completion 分离。 |
| Dashboard full console | 复杂但低频 | Current Context first | 主屏改为 Bundle/Graph/Guard，其他进 Advanced。 |
| AgentRuntime expansion | 平台重心过大 | Legacy adapter | 冻结，不新增主线能力。 |
| LanguageExtensionBuilder | 有用但偏支 | Overlay | 只作为 DimensionLens overlay。 |

## 3. 迁移阶段

### Phase 0: 文档和边界

产物：

```text
docs-dev/rearchitecture/*
```

目标：

1. 明确编译期/运行期边界。
2. 明确剪枝对象。
3. 给多个任务窗口分配写入边界。

### Phase 1: 领域合约

新增：

```text
lib/mainline/domain/SourceRef.ts
lib/mainline/domain/Recipe.ts
lib/mainline/domain/RecipeEdge.ts
lib/mainline/domain/EvidencePackage.ts
lib/mainline/domain/ContextBundle.ts
lib/mainline/domain/GuardFinding.ts
lib/mainline/domain/DimensionLens.ts
```

原则：

1. 只定义类型和轻校验。
2. 不接旧服务。
3. 不引入 AgentRuntime。

### Phase 2: 运行期最小闭环

新增：

```text
lib/mainline/runtime/ActiveWorkContext.ts
lib/mainline/runtime/GraphExpansion.ts
lib/mainline/runtime/ContextBundleBuilder.ts
lib/mainline/legacy/SearchEngineAdapter.ts
lib/mainline/legacy/GuardServiceAdapter.ts
```

目标：

```text
ActiveWorkContext -> ContextBundle -> GuardFinding
```

这一步优先，因为它能让 Codex/Agent 立刻感知 Alembic 的价值。

### Phase 3: 编译期最小闭环

新增：

```text
lib/mainline/compile/EvidencePackageBuilder.ts
lib/mainline/compile/RecipeRelationMiner.ts
lib/mainline/compile/SourceRefFreshnessCheck.ts
lib/mainline/compile/CompileArtifactWriter.ts
lib/mainline/legacy/WorkflowAdapter.ts
```

目标：

```text
changed files -> evidence -> recipe candidate -> recipe edge -> index update
```

这一步从现有 `ProjectIntelligenceRunner`、`KnowledgeRescanPlanner`、`RecipeProductionGateway` 旁路接入，不先重写旧代码。

### Phase 4: 默认链路瘦身

修改：

```text
lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts
lib/workflows/capabilities/completion/CompletionSteps.ts
lib/injection/modules/AgentModule.ts
lib/injection/modules/GuardModule.ts
```

动作：

1. `wiki` 默认从 `schedule` 改为 `skip/manual`。
2. `panorama` 默认关闭。
3. `semanticMemory` 默认关闭。
4. `toolForge` 不进入新主线注册。
5. `reverseGuard` 不进入默认 Guard 链路。

### Phase 5: Route Skill 和 MCP Facade

新增：

```text
lib/mainline/agent/RouteSkill.md
lib/mainline/agent/AgentContextPresenter.ts
lib/mainline/agent/McpFacade.ts
```

目标工具：

```text
alembic_route_context
alembic_get_context_bundle
alembic_guard_diff
alembic_capture_knowledge
alembic_request_rescan
```

工具要少，但语义清楚。

### Phase 6: Dashboard 收束

新主屏只展示：

```text
Current Context
Relevant Recipes
Recipe Graph
Guard Findings
Capture Drafts
Rescan Requests
```

Wiki、Reports、Tool Forge、ReverseGuard、Panorama 全部进 Advanced。

## 4. 默认配置建议

新的默认值：

```ts
{
  completion: {
    writeArtifacts: true,
    updateContextIndex: true,
    wiki: "manual",
    panorama: "off",
    semanticMemory: "off",
    delivery: "off"
  },
  guard: {
    forwardCheck: true,
    reverseGuard: "manual",
    complianceReport: "manual",
    ruleLearning: "candidate-only"
  },
  tools: {
    toolForge: "experimental-off",
    dynamicToolFallback: false
  }
}
```

## 5. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 旧功能还被依赖 | 先 adapter，后默认关闭，不直接删除。 |
| 多窗口修改冲突 | 按目录和模块分配所有权。 |
| 新主线又长成平台 | 强制六个主对象边界。 |
| 编译期扫描仍然慢 | 只做 changed files 和 SourceRef impact。 |
| Guard 失去学习能力 | 学习改为 candidate-only，不自动应用。 |
| 用户觉得能力变少 | 保留 Advanced 手动入口，但默认路径变轻。 |
