# 多任务窗口并行推进方案

> 用户可能同时开启多个任务窗口。这里的重点是写入边界清晰，避免不同窗口同时改同一批核心文件。

## 1. 总体并行原则

1. 每个窗口只拥有一个主目录或一组明确文件。
2. 先新增 `lib/mainline/*`，少碰旧核心文件。
3. 旧文件修改集中到“剪枝窗口”，不要多个窗口同时动 DI 和 completion。
4. 所有窗口共享本文档里的领域对象名称，避免各自发明概念。
5. 每个窗口结束时输出：修改文件、接入点、未完成接口、需要其他窗口配合的事项。

## 2. 推荐窗口拆分

### Window A: Foundation / Domain

所有权：

```text
lib/mainline/domain/*
lib/mainline/foundation/*
docs-dev/rearchitecture/*
```

任务：

1. 定义 `SourceRef`、`Recipe`、`RecipeEdge`、`EvidencePackage`、`ContextBundle`、`GuardFinding`、`DimensionLens`。
2. 定义基础 validator。
3. 写 README 说明依赖方向。

不要做：

```text
不要接 SearchEngine
不要接 GuardService
不要改 AgentModule
```

### Window B: Compile-Time Mining

所有权：

```text
lib/mainline/compile/*
lib/mainline/legacy/WorkflowAdapter.ts
```

可读参考：

```text
lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts
lib/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanner.ts
lib/workflows/knowledge-rescan/*
```

任务：

1. 做 `EvidencePackageBuilder`。
2. 做 `RecipeRelationMiner`。
3. 做 `SourceRefFreshnessCheck`。
4. 输出 `CompileReport`。

不要做：

```text
不要修改 WorkflowCompletionFinalizer
不要修改 GuardModule
不要碰 Dashboard
```

### Window C: Runtime Context / Guard

所有权：

```text
lib/mainline/runtime/*
lib/mainline/legacy/SearchEngineAdapter.ts
lib/mainline/legacy/GuardServiceAdapter.ts
```

可读参考：

```text
lib/service/search/*
lib/service/guard/GuardService.ts
lib/service/guard/GuardCheckEngine.ts
```

任务：

1. 做 `ActiveWorkContext`。
2. 做 `GraphExpansion`。
3. 做 `ContextBundleBuilder`。
4. 把 legacy Guard 输出转成 `GuardFinding`。

不要做：

```text
不要重写 GuardCheckEngine
不要修改 ReverseGuard
不要改 AgentRuntime
```

### Window D: Pruning / Legacy Switches

所有权：

```text
lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts
lib/workflows/capabilities/completion/CompletionSteps.ts
lib/injection/modules/AgentModule.ts
lib/injection/modules/GuardModule.ts
```

任务：

1. 把 Wiki 默认 schedule 改为 manual/off。
2. 把 panorama、semantic memory 默认关闭。
3. 给 ToolForge 加 experimental flag 或从新主线 DI 排除。
4. 让 ReverseGuard 只在 manual/advanced mode 出现。

注意：

这个窗口最容易产生冲突，建议最后动，且每次只改一个开关。

### Window E: Agent / MCP / Skill

所有权：

```text
lib/mainline/agent/*
lib/mainline/legacy/KnowledgeServiceAdapter.ts
```

任务：

1. 写 `RouteSkill.md`。
2. 做 `AgentContextPresenter`。
3. 做 MCP facade 的最小工具设计。

目标工具：

```text
alembic_route_context
alembic_get_context_bundle
alembic_guard_diff
alembic_capture_knowledge
alembic_request_rescan
```

不要做：

```text
不要接 ToolForge
不要扩展 AgentRuntime
```

### Window F: Dashboard Current Context

所有权：

```text
dashboard/src/*
```

任务：

1. 新增 Current Context 主屏。
2. 展示 ContextBundle、Recipe Graph、GuardFinding、CaptureDraft。
3. 将 Wiki、Reports、ReverseGuard、ToolForge 放到 Advanced。

不要做：

```text
不要改后端 DI
不要新建复杂工作流
```

## 3. 任务窗口之间的接口

### Domain 给所有窗口

Domain 是唯一公共语言：

```text
SourceRef
Recipe
RecipeEdge
EvidencePackage
ContextBundle
GuardFinding
DimensionLens
```

其他窗口不得复制定义。

### Compile 给 Runtime

```text
CompiledContextIndex
RecipeEdge[]
SourceRefFreshnessReport
```

### Runtime 给 Agent / Dashboard

```text
ContextBundle
GuardFinding[]
CaptureDraft[]
RescanRequest[]
```

### Guard 给 Compile

```text
GuardFinding -> EvidencePackage input
```

## 4. 推荐落地顺序

```text
A Domain
  -> C Runtime minimal bundle
  -> B Compile relation miner
  -> E Agent facade
  -> D Legacy pruning switches
  -> F Dashboard current context
```

理由：

1. Domain 先定语言。
2. Runtime 最快产生使用价值。
3. Compile 再增强数据质量。
4. Agent facade 让 Codex/IDE 能吃到新 bundle。
5. Legacy pruning 等新主线有入口后再动，风险小。
6. Dashboard 最后做，不让 UI 反向决定架构。

## 5. 每个窗口的结束报告格式

```text
完成：
- ...

修改文件：
- ...

新增接口：
- ...

依赖其他窗口：
- ...

下一步：
- ...
```

## 6. 禁止事项

1. 不要在多个窗口同时修改 `AgentModule.ts`。
2. 不要在多个窗口同时修改 `WorkflowCompletionFinalizer.ts`。
3. 不要在新主线里 import `ToolForge`。
4. 不要让 `ContextBundleBuilder` 触发全量 rescan。
5. 不要让编译期默认生成 Wiki。
6. 不要把 Dashboard 当成领域模型来源。
