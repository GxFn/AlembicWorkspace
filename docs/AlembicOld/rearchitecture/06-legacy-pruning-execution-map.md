# 旧链路剪枝执行图

> 目的：给 Worker C 的旧链路剪枝审计留下可执行地图。本文只记录真实代码里的剪枝点、开关顺序和测试影响；不直接修改旧核心代码。

## 0. 路径校准

任务中提到的两个 completion 文件当前实际路径是：

- `lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts`
- `lib/workflows/capabilities/completion/CompletionSteps.ts`

`lib/workflows/capabilities/execution/` 下仍有 internal/external workflow 入口，但完成阶段副作用已经集中到 `completion/` 目录。后续执行剪枝时应按真实路径改，避免按旧 `execution/WorkflowCompletionFinalizer.ts` 路径找文件。

本次已核对的主文件：

- `lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts`
- `lib/workflows/capabilities/completion/CompletionSteps.ts`
- `lib/injection/modules/AgentModule.ts`
- `lib/injection/modules/GuardModule.ts`
- `lib/agent/runtime/ToolExecutionPipeline.ts`
- `lib/service/guard/ReverseGuard.ts`

补充核对的入口文件：

- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.ts`
- `lib/workflows/capabilities/execution/external/ExternalDimensionCompletionWorkflow.ts`
- `lib/external/mcp/handlers/guard.ts`
- `lib/http/routes/guardReport.ts`
- `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts`
- `lib/workflows/cold-start/ColdStartPlan.ts`
- `lib/workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts`

## 1. Completion 默认副作用

### 1.1 总剪枝点

`runWorkflowCompletionFinalizer` 是尾部副作用总开关：

`lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts`

当前默认值：

```ts
const semanticMemoryMode = semanticMemory.mode ?? 'scheduled';
const deliveryMode = steps.delivery ?? 'run';
const panoramaMode = steps.panorama ?? 'run';
const wikiMode = steps.wiki ?? 'schedule';
```

这意味着只要调用方不传 `steps` / `semanticMemory`，默认会运行 Delivery、运行 Panorama、异步 schedule Wiki、异步 schedule SemanticMemory。

具体副作用函数在 `lib/workflows/capabilities/completion/CompletionSteps.ts`：

- `runCursorDelivery`：读取 `cursorDeliveryPipeline` 并调用 `pipeline.deliver()`。
- `verifyDelivery`：动态导入 `DeliveryVerifier` 并执行 `verifier.verify()`。
- `refreshPanorama`：读取 `panoramaService`，调用 `rescan()` 和 `getOverview()`。
- `generateWiki`：动态导入 `WikiGenerator`，用 `moduleService` 和 `knowledgeService` 执行 `generate()`。
- `consolidateSemanticMemory`：创建 `PersistentMemory`、`MemoryEmbeddingStore`、`EpisodicConsolidator`，再对 `session.sessionStore` 执行固化。

### 1.2 Wiki 默认 schedule

精确剪枝点：

- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 的 `wikiMode = steps.wiki ?? 'schedule'`。
- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 中的 `scheduleTask(() => generateWiki(...))`。
- `CompletionSteps.generateWiki` 保留为显式手动能力，不应删除。

安全顺序：

1. 先加开关：在 finalizer 参数或配置投影中引入 `completion.wiki`，允许 `schedule | skip`。当前 `WorkflowCompletionStepOptions.wiki` 只有 `'schedule' | 'skip'`，如要暴露 `manual`，旧 API 内部应先映射为 `skip`，不要直接改调用语义。
2. 再改默认：把未传 `steps.wiki` 的默认从 `schedule` 改成 `skip`。外部 completion 如仍需旧行为，必须显式传 `{ wiki: 'schedule' }`。
3. 最后迁出：把 Wiki 放到 Advanced/manual export 入口，`generateWiki` 只由手动工具或 advanced route 调用。

测试影响：

- `test/unit/WorkflowCompletionFinalizer.test.ts`：会影响 “runs delivery and panorama before scheduling wiki...” 和 “scheduled semantic memory shares the same scheduler boundary as wiki”，因为 schedule 数量和事件顺序会变。
- `test/unit/WorkflowCompletionFinalizer.test.ts`：`buildInternalDimensionCompletionSummary` 当前 bootstrap 缺省 wiki status 是 `scheduled`，默认改轻后应改为来自 finalizer result 或 `skipped`。
- `test/unit/WorkflowResultPersistence.test.ts`：报告里的 completion summary 可能从 `wiki: scheduled` 变为 `wiki: skipped`。

### 1.3 Delivery 默认 run

精确剪枝点：

- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 的 `deliveryMode = steps.delivery ?? 'run'`。
- `runWorkflowCompletionFinalizer` 中顺序调用 `runCursorDelivery` 再 `verifyDelivery`。
- `CompletionSteps.runCursorDelivery` 和 `CompletionSteps.verifyDelivery` 是可保留的显式步骤。

当前调用入口：

- `InternalDimensionFillFinalizer.finalizeInternalDimensionFill` 在 bootstrap 模式下调用 finalizer；只在 `preparation.skipTargetDelivery` 为真时传 `{ delivery: 'skip', wiki: 'skip' }`。
- `ExternalDimensionCompletionWorkflow.runExternalDimensionCompletionWorkflow` 在 `isComplete` 时调用 finalizer，未传 `steps`，因此走 Delivery 默认 `run`。

安全顺序：

1. 先加开关：引入 `completion.delivery` 或等价 finalizer 参数，保持旧默认为 `run`，让 internal/external 两个 completion 入口都能显式传值。
2. 再改默认：把 finalizer 未传值默认从 `run` 改成 `skip`。需要交付到 Cursor/IDE 的旧流程显式传 `{ delivery: 'run' }`。
3. 最后迁出：`runCursorDelivery` 和 `verifyDelivery` 保留在 legacy/advanced execution，不再属于编译期或运行期主线默认完成动作。

测试影响：

- `test/unit/WorkflowCompletionFinalizer.test.ts`：默认事件不再包含 `delivery`，`deliveryStatus` 默认变为 `skipped`。
- `test/unit/DeliveryCompletionStep.test.ts`：如果只改默认、不删函数，该测试不应改；它验证显式 step 能跑。
- `test/unit/WorkflowResultPersistence.test.ts`：completion report 中 `delivery.status` 的默认快照会变。

### 1.4 Panorama 默认 run

精确剪枝点：

- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 的 `panoramaMode = steps.panorama ?? 'run'`。
- `CompletionSteps.refreshPanorama` 调用 `panoramaService.rescan()` 和 `panoramaService.getOverview()`。
- `ProjectIntelligenceRunner.DEFAULT_PROJECT_ANALYSIS_MATERIALIZATION.panorama` 当前为 `true`。
- `ColdStartPlan.buildColdStartWorkflowPlan` 的 `materialize.panorama: true`。
- `KnowledgeRescanWorkflowPlan.buildKnowledgeRescanWorkflowPlan` 的 `materialize.panorama: true`。
- `ProjectIntelligenceRunner.runAllPhases` 里 `if (materialization.panorama) materializeProjectPanorama(...)`。

安全顺序：

1. 先加开关：在 completion finalizer 和 project-analysis materialization 两侧都支持显式 `panorama: run/skip` 或 `panorama: true/false`。先保持现有默认。
2. 再改默认：completion 默认 `skip`；cold-start/rescan materialization 默认 `panorama: false`，只有 Advanced/diagnostic 路径传 `true`。
3. 最后迁出：`PanoramaService`、HTTP/MCP panorama 查询继续作为手动能力；默认主链路只消费已有 context/index，不主动刷新全景。

测试影响：

- `test/unit/WorkflowCompletionFinalizer.test.ts`：默认事件不再包含 `panorama:rescan` 和 `panorama:overview`。
- `test/unit/ProjectAnalysisMaterialization.test.ts`：`resolveProjectAnalysisMaterialization(undefined)` 和“unspecified materialization options”当前断言 `panorama: true`。
- `test/integration/PanoramaIntegration.test.ts`、`test/unit/PanoramaService.test.ts`、`test/unit/PanoramaAggregator.test.ts` 等 Panorama 自身测试不应因默认关闭而删除；它们验证手动能力。

### 1.5 SemanticMemory 默认 scheduled / immediate

精确剪枝点：

- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 的 `semanticMemoryMode = semanticMemory.mode ?? 'scheduled'`。
- `runWorkflowCompletionFinalizer` 的 scheduled 分支会 `scheduleTask(async () => consolidateSemanticMemory(...))`。
- `InternalDimensionFillFinalizer.finalizeInternalDimensionFill` 在 bootstrap 模式下显式传 `semanticMemory: { mode: 'immediate' }`，这不是默认值，但仍是默认主链路效果。
- `CompletionSteps.consolidateSemanticMemory` 是显式执行边界，应保留为手动/legacy 任务。

安全顺序：

1. 先加开关：在 internal/external completion 的调用参数里支持 `semanticMemory.mode` 来自配置或 workflow policy。注意 internal finalizer 当前硬编码 immediate，必须先把这个显式调用也变成可控项。
2. 再改默认：finalizer 未传值默认从 `scheduled` 改为 `skip`；internal bootstrap 默认从 `immediate` 改为 `skip`，需要旧完整 bootstrap 时显式开启。
3. 最后迁出：`consolidateSemanticMemory` 保留为 Advanced/manual consolidation，不再和 completion 自动绑定。

测试影响：

- `test/unit/WorkflowCompletionFinalizer.test.ts`：scheduled task 数量从 2 变 0 或 1；immediate semantic memory 相关测试需要显式传 mode。
- `test/unit/SemanticMemoryCompletionStep.test.ts`：如果只改默认、不删 `consolidateSemanticMemory`，该测试应保持。
- `test/unit/BootstrapRuntimeInitializer.test.ts` 和 prompt 注入相关测试可能依赖 runtime semantic memory 为空或存在，需要确认默认 off 后不会重建第三条主线。

## 2. ToolForge fallback

精确剪枝点：

- `lib/injection/modules/AgentModule.ts` 的 `register` 函数注册 `toolForge`：

```ts
c.singleton('toolForge', (ct: ServiceContainer) => {
  const catalog = ct.get('toolRegistry') as UnifiedToolCatalog;
  const signalBus = ct.singletons.signalBus as SignalBus | undefined;
  return new ToolForge(catalog, {
    signalBus,
    capabilityCatalog: ct.get('capabilityCatalog') as CapabilityCatalog,
    workflowRegistry: ct.get('workflowRegistry') as WorkflowRegistry,
  });
});
```

- `lib/agent/runtime/ToolExecutionPipeline.ts` 的 `allowlistGate.before` 在工具不在 `allowedToolIds` 时查询 ToolForge：

```ts
const container = ctx.runtime.container as { get?: (name: string) => unknown } | null;
const toolForge = container?.get?.('toolForge') as ToolForgeLike | undefined;
const isTemporaryTool = toolForge?.temporaryRegistry?.isTemporary(call.name) === true;
```

风险点：如果先删除 `AgentModule` 的 `toolForge` 注册，`ServiceContainer.get('toolForge')` 会抛 `Service 'toolForge' not found in container`。当前 `allowlistGate` 没有 try/catch，因此未知工具的正常拦截路径可能变成异常。

安全顺序：

1. 先加开关：在 `allowlistGate` 增加 `tools.dynamicToolFallback` 判断，并把 `container.get('toolForge')` 包进安全查询。默认先保持开启，防止行为突变。
2. 再改默认：把 `tools.dynamicToolFallback` 默认改为 `false`。未知工具不再因为 temporary registry 被放行，除非显式开启实验能力。
3. 最后迁出：`AgentModule.register` 不在新主线 DI 注册 `toolForge`；旧 Agent/Advanced 可以通过单独 legacy module 或实验入口注册。`ToolForge` 类和 `test/unit/ToolForgeIntegration.test.ts` 不应被删除。

测试影响：

- `test/unit/ToolExecutionPipeline.test.ts`：现有测试主要覆盖 knowledge submit 和 evolution guard；需要新增或调整一条“toolForge 缺失时未知工具仍被 blocked，而不是 throw”的测试。
- `test/unit/ToolForgeIntegration.test.ts`：如果保留 ToolForge 显式构造，应继续通过。
- `test/unit/AgentModuleBoundaries.test.ts`：如果迁移路径新增 retired import 或恢复旧 agent compatibility 文件，会被边界测试打到。

## 3. ReverseGuard 注册和入口

精确剪枝点：

- `lib/injection/modules/GuardModule.ts` 顶部导入 `ReverseGuard`。
- `GuardModule.register` 注册 `reverseGuard`：

```ts
c.singleton('reverseGuard', (ct: ServiceContainer) => {
  return new ReverseGuard(
    ct.get('knowledgeRepository') as KnowledgeRepositoryImpl,
    ct.get('codeEntityRepository') as CodeEntityRepositoryImpl,
    ct.get('recipeSourceRefRepository') as RecipeSourceRefRepositoryImpl,
    {
      signalBus: (ct.singletons.signalBus as SignalBus | undefined) || undefined,
    }
  );
});
```

- `lib/service/guard/ReverseGuard.ts` 的运行入口：
  - `checkRecipe(recipe, projectFiles)`
  - `auditAllRules(projectFiles)`
  - `getDriftResults(results)`
- `checkRecipe` 会检测 symbol existence、guard pattern match rate、source ref stale，并在有 drift 时通过 `SignalBus.send('quality', 'ReverseGuard', ...)` 发信号。

外部入口：

- `lib/external/mcp/handlers/guard.ts` 的 `guardReverseAudit`：动态导入 `ReverseGuard`，优先 `ctx.container.get('reverseGuard')`，失败后 `new ReverseGuard(...)`，再执行 `auditAllRules` 和 `getDriftResults`。返回 meta 为 `{ tool: 'alembic_guard', operation: 'reverse_audit' }`。
- `lib/http/routes/guardReport.ts` 的 `GET /api/v1/guard/report/reverse`：同样优先拿 DI，失败后构造实例。

安全顺序：

1. 先加开关：在 `GuardModule.register` 读 `guard.reverseGuard` 或同类配置。第一阶段仍注册，但 HTTP/MCP 入口应明确是 manual/advanced。不要改 `ReverseGuard` 类。
2. 再改默认：默认不注册 `reverseGuard` 到主 DI。因为 MCP/HTTP 入口已经有 fallback 构造，手动 audit 仍可用。
3. 最后迁出：把 `ReverseGuard` 从默认 Guard 组合中移出，只保留 Advanced audit；编译期主线只吸收 `source_ref_stale` 这类轻量 freshness 价值。

测试影响：

- `test/unit/ReverseGuard.test.ts`：类级行为测试应保留。
- `test/integration/GuardImmuneSystem.test.ts`、`test/integration/cross-module/GuardImmuneWiring.test.ts`、`test/integration/BiliDiliPressureTest.test.ts`：如果它们期待 `reverseGuard` 默认 DI 存在，需要改为显式开启或直接构造。
- `test/unit/AgentModuleBoundaries.test.ts`：如果迁出时新增旧路径 compatibility 文件，会被边界规则扫描到。

## 4. 建议开关矩阵

第一阶段只加开关，不改默认：

```ts
{
  completion: {
    delivery: 'run',
    wiki: 'schedule',
    panorama: 'run',
    semanticMemory: 'scheduled'
  },
  tools: {
    dynamicToolFallback: true,
    toolForge: 'registered'
  },
  guard: {
    reverseGuard: 'registered-manual'
  },
  projectAnalysis: {
    materialize: {
      panorama: true
    }
  }
}
```

第二阶段改默认：

```ts
{
  completion: {
    delivery: 'skip',
    wiki: 'skip',
    panorama: 'skip',
    semanticMemory: 'skip'
  },
  tools: {
    dynamicToolFallback: false,
    toolForge: 'experimental'
  },
  guard: {
    reverseGuard: 'manual'
  },
  projectAnalysis: {
    materialize: {
      panorama: false
    }
  }
}
```

第三阶段迁出：

- Wiki：只留 Advanced/manual export。
- Delivery：只留 legacy execution/manual delivery。
- Panorama：只留 manual query/diagnostic refresh。
- SemanticMemory：只留 manual consolidation。
- ToolForge：只留 experimental legacy module。
- ReverseGuard：只留 Advanced audit，默认主线用 SourceRef freshness 替代其核心价值。

## 5. 执行批次

### Batch A: 加开关但保持旧默认

目标：不改变行为，只让后续默认切换有落点。

动作：

- 给 `runWorkflowCompletionFinalizer` 增加统一 policy 输入，覆盖 `delivery/wiki/panorama/semanticMemory`。
- 让 `InternalDimensionFillFinalizer.finalizeInternalDimensionFill` 不再硬编码 `semanticMemory: { mode: 'immediate' }`，而是从 policy 读取，第一阶段 policy 仍给 immediate。
- 让 `ExternalDimensionCompletionWorkflow.runExternalDimensionCompletionWorkflow` 在 finalizer 调用处可以传 policy。
- 给 `ToolExecutionPipeline.allowlistGate` 加 `dynamicToolFallback` 判断和安全 `toolForge` lookup。
- 给 `GuardModule.register` 的 `reverseGuard` 注册加配置判断，但第一阶段仍默认注册。
- 给 project-analysis materialization 增加可配置默认，第一阶段仍 `panorama: true`。

主要测试：

- `test/unit/WorkflowCompletionFinalizer.test.ts`
- `test/unit/ToolExecutionPipeline.test.ts`
- `test/unit/ProjectAnalysisMaterialization.test.ts`
- `test/unit/ReverseGuard.test.ts`

### Batch B: 改默认但保留显式旧能力

目标：默认主链路变轻；需要旧行为的调用方显式开启。

动作：

- `WorkflowCompletionFinalizer.runWorkflowCompletionFinalizer` 默认改为 delivery/wiki/panorama/semanticMemory 全 skip。
- `InternalDimensionFillFinalizer` bootstrap 默认不再 immediate semantic memory。
- `ExternalDimensionCompletionWorkflow` completion 完成时不再默认 delivery/wiki/panorama/memory。
- `ProjectIntelligenceRunner.DEFAULT_PROJECT_ANALYSIS_MATERIALIZATION.panorama` 改 false，并同步 ColdStart/Rescan plan。
- `ToolExecutionPipeline.allowlistGate` 默认不启用 dynamic ToolForge fallback。
- `GuardModule` 默认不注册 `reverseGuard`，但 MCP/HTTP 入口保留 fallback 构造。

主要测试：

- `test/unit/WorkflowCompletionFinalizer.test.ts`：默认事件、scheduled task 数、summary 默认。
- `test/unit/WorkflowResultPersistence.test.ts`：completion summary 快照。
- `test/unit/ProjectAnalysisMaterialization.test.ts`：panorama 默认值。
- `test/unit/ToolExecutionPipeline.test.ts`：未知工具/temporary tool fallback 行为。
- Guard integration 中依赖默认 `reverseGuard` DI 的用例。

### Batch C: 迁到 Advanced / legacy

目标：代码组织表达新主线边界，不再让旧能力看起来是主线默认成员。

动作：

- Wiki/Delivery/Panorama/SemanticMemory 的 step 函数保留，但只由 explicit/manual workflow 调用。
- ToolForge 从 `AgentModule` 默认注册拆出到 legacy/experimental 注册。
- ReverseGuard 从 `GuardModule` 默认注册拆出到 Advanced audit route 或 explicit factory。
- 新主线文档和 route skill 只暴露 `ContextBundle`、forward Guard、capture/rescan request。

主要测试：

- 保留现有 step/service 单测，避免误删能力。
- 新增边界测试：默认 container 不应注册 `toolForge` / `reverseGuard`；manual entry 仍能构造并运行。
- 新增 route/tool 测试：Advanced `reverse_audit` 和 manual wiki/delivery/panorama 不依赖默认主链路。

## 6. 关键结论

1. 当前最重的默认链路不在单个服务里，而在 `runWorkflowCompletionFinalizer` 的四个默认值里：Delivery `run`、Panorama `run`、Wiki `schedule`、SemanticMemory `scheduled`。
2. SemanticMemory 还有一个额外显式入口：`InternalDimensionFillFinalizer` 硬编码 immediate；只改 finalizer 默认不足以关掉主链路固化。
3. Panorama 既在 completion 默认跑，也在 project-analysis materialization 默认跑；剪枝必须两边一起做。
4. ToolForge 不能先删 DI 注册；必须先让 `allowlistGate` 的 fallback 查询可配置且可安全失败。
5. ReverseGuard 已经有手动入口 fallback 构造，因此可以先从默认 DI 迁出，再保留 MCP/HTTP Advanced audit。
