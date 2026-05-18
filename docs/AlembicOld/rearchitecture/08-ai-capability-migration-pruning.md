# AI 能力迁入与剪枝设计

> 目标：把 AI 能力迁入新主线，但不把旧 AgentRuntime、ToolForge、MockProvider、MockBootstrapPipeline 一起带进来。AI 在新主线里只是一层可替换的能力端口，用于内容挖掘和知识注入，不再是平台中心。

## 1. 当前代码判断

已核对的真实文件：

- `lib/external/ai/AiProvider.ts`
- `lib/external/ai/AiFactory.ts`
- `lib/external/ai/AiProviderManager.ts`
- `lib/external/ai/gateway/LLMGateway.ts`
- `lib/injection/modules/AiModule.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillPreparation.ts`
- `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts`
- `lib/workflows/capabilities/execution/internal-agent/MockBootstrapPipeline.ts`

关键发现：

1. `LLMGateway` 已经比旧 `AiProvider` 更接近可迁移边界：它有 modelRef、transport、参数 guard、response normalize。
2. `AiFactory.autoDetectProvider()` 没有 key 时会返回 `MockProvider`，这会让“AI 不可用”被伪装成“AI 可用”。
3. `AiProviderManager.isMock` 被 internal bootstrap 用来进入 `MockBootstrapPipeline`。
4. `MockBootstrapPipeline` 会基于结构生成 mock candidate，虽然不持久化，但会继续强化旧系统对 mock AI 的依赖。
5. AgentRuntime、ToolForge、Memory consolidation 与 AI 调用混在旧 Agent 平台里，不应该迁入新主线核心。

## 2. 剪枝判断

| 能力 | 新主线定位 | 处理 |
| --- | --- | --- |
| `LLMGateway` / transports | 可作为未来真实 provider adapter | 迁入 adapter 层，不直接进入 domain/compile/runtime。 |
| `AiProviderManager` | 旧 DI 管理器 | 只读 provider status，不作为 mainline 中心。 |
| `AiFactory` | legacy factory | 后续只通过 adapter 调用；`mock` 不进入 mainline。 |
| `MockProvider` | 测试/旧 fallback | 不进入 mainline；长期应从默认 auto-detect 中移除。 |
| `MockBootstrapPipeline` | 旧 bootstrap 支线 | 不迁入；后续默认关闭或删除。 |
| `AgentRuntime` | 旧 Agent 平台 | 只保留 legacy adapter，不迁入 AI 核心。 |
| `ToolForge` | 动态工具实验 | 不迁入 AI 能力。 |
| SemanticMemory | 高级记忆支线 | 不作为默认 AI 能力。 |

## 3. 新主线 AI 的位置

新主线新增一层：

```text
lib/mainline/ai/
  AiPort.ts
  AiCapabilityPolicy.ts
  AiTaskPlanner.ts
```

它位于 compile/runtime 之下、legacy adapter 之上：

```text
domain/data
  -> compile/runtime
  -> ai planning / ai port
  -> legacy adapter to LLMGateway
```

AI 层只做三件事：

1. 定义真实 AI port。
2. 判断 provider 是否可用。
3. 把内容挖掘和知识注入任务规划成 AI request。

它暂时不直接调用旧 provider，也不提供 mock。

## 4. 内容挖掘中的 AI

AI 可参与：

- evidence 摘要压缩
- Recipe candidate 提议
- RecipeEdge relation candidate 提议
- SourceRef 解释补充

AI 不能做：

- 直接写入 Recipe
- 绕过 SourceRef
- 生成 Wiki
- 用 mock 数据填充候选
- 自动升级为 active Recipe

主线流程：

```text
EvidencePackage
  -> deterministic checks
  -> AiTaskPlanner.proposeContentMiningTasks()
  -> AiPort.generateJson()
  -> validator
  -> RecipeCandidate / RecipeEdgeCandidate
  -> CompileArtifactWriter
```

## 5. 知识注入中的 AI

AI 可参与：

- ContextBundle 压缩
- GuardFinding 解释改写
- Agent prompt 片段排序
- CaptureDraft 文案整理

AI 不能做：

- 动态造工具
- 触发 rescan
- 写 Recipe
- 访问旧 AgentRuntime
- 替代 Guard 前向检查

主线流程：

```text
ContextBundle
  -> KnowledgeInjectionPlan
  -> AiTaskPlanner.proposeKnowledgeInjectionTasks()
  -> AiPort.generateText()
  -> AgentContextPresenter
```

## 6. 没有 AI 时的行为

新主线不再使用 mock AI 顶上。

没有真实 provider 时：

```text
AI unavailable
  -> deterministic pipeline continues
  -> CompileReport records blocked AI tasks
  -> ContextBundle still works
  -> user sees "AI capability unavailable"
```

这比 mock 更诚实：项目知识宁可少，也不能被模拟内容污染。

## 7. 下一步迁移顺序

1. 建 `lib/mainline/ai`：AI port、provider status、task planner。
2. 给内容挖掘 pipeline 增加可选 AI task planning，但不调用 AI。
3. 给知识注入 planner 增加可选 AI compression task，但不调用 AI。
4. 建 `legacy/LLMGatewayAdapter`，只适配真实 provider。
5. 改 `AiFactory.autoDetectProvider()`：无 key 时返回 null/unavailable，而不是 mock。
6. 移除 `InternalDimensionExecutionPipeline` 的 mock-mode 分支或改为 explicit test-only。
7. 冻结/删除 `MockBootstrapPipeline` 的默认入口。

## 8. 主线红线

- `lib/mainline/**` 不 import `MockProvider`。
- `lib/mainline/**` 不 import `MockBootstrapPipeline`。
- `lib/mainline/**` 不 import `AgentRuntime`。
- `lib/mainline/**` 不 import `ToolForge`。
- AI 输出只能是 candidate，写入前必须经过 deterministic validator。
- provider 不可用时必须显式 blocked，不能 mock success。

## 9. 当前落地状态

已落地：

- `lib/mainline/ai/AiPort.ts`：新主线 AI port。
- `lib/mainline/ai/AiCapabilityPolicy.ts`：真实 provider / mock / unavailable 的决策层。
- `lib/mainline/ai/AiTaskPlanner.ts`：内容挖掘与知识注入的 AI task 规划层。
- `lib/mainline/legacy/LLMGatewayAdapter.ts`：旧 `LLMGateway` 窄接口到 `MainlineAiPort` 的迁移膜。

当前 adapter 仍然不启动旧 provider，也不触发网络请求。它只定义调用边界，并在调用前通过 `AiCapabilityPolicy` 阻止 mock/unavailable provider。

下一步：

1. 在 DI 外层构造真实 `LLMGatewayMainlineAdapter`，把 provider status 显式传入。
2. 给 `AiFactory.autoDetectProvider()` 增加 no-mock 模式：无 key 时返回 unavailable，而不是 `MockProvider`。
3. 把 `InternalDimensionExecutionPipeline` 的 mock-mode 分支改成 test-only 或 explicit flag。
4. 冻结 `MockBootstrapPipeline`，不再作为默认 bootstrap fallback。
