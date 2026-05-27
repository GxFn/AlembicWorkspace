# 真实代码审计与剪枝判断

> 本文基于当前仓库代码结构，而不是抽象设想。重点不是“哪里写得不好”，而是识别哪些模块承担了过多主线责任，导致 Alembic 变重。

## 1. 当前重量分布

当前 `lib` 目录约 684 个 TypeScript 文件，约 188k 行。与这次重构直接相关的目录约 48k 行，重量集中在以下模块：

| 文件 | 约行数 | 判断 |
| --- | ---: | --- |
| `lib/service/wiki/WikiRenderers.ts` | 1960 | Wiki 已经是独立产品级渲染层，不应在核心链路默认运行。 |
| `lib/service/guard/GuardCheckEngine.ts` | 1807 | Guard 前向检查有价值，但引擎层过宽，需要收窄成 Runtime Finding。 |
| `lib/agent/runtime/AgentRuntime.ts` | 1555 | AgentRuntime 是旧平台中心，不能继续承载新主线。 |
| `lib/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` | 1413 | 很接近编译期核心，但目前混入太多执行编排。 |
| `lib/workflows/capabilities/execution/external/MissionBriefingBuilder.ts` | 1240 | 属于旧外部执行工作流，不应成为新架构中心。 |
| `lib/service/wiki/WikiGenerator.ts` | 1200 | Wiki 生成应降级为手动导出。 |
| `lib/service/wiki/WikiUtils.ts` | 1078 | 与 Wiki 绑定过深，不能进入 ContextBundle 主线。 |
| `lib/workflows/capabilities/presentation/LanguageExtensionBuilder.ts` | 974 | 语言扩展有价值，但应变成 overlay，不是主分类。 |
| `lib/workflows/capabilities/execution/external/ExternalDimensionCompletionWorkflow.ts` | 941 | Dimension completion 太像工作流平台。 |
| `lib/workflows/capabilities/execution/internal-agent/BootstrapConsumers.ts` | 838 | Bootstrap 消费链过重，适合被编译期薄层吸收。 |
| `lib/tools/v2/handlers/code.ts` | 700 | 工具系统有用，但不应继续膨胀为平台中心。 |
| `lib/tools/v2/handlers/knowledge.ts` | 686 | 知识工具应服务 ContextBundle，而不是自成一套入口。 |
| `lib/service/guard/ComplianceReporter.ts` | 586 | 报告能力低频，退出默认主线。 |
| `lib/agent/forge/ToolForge.ts` | 542 | Tool Forge 是实验支线，默认关闭。 |
| `lib/service/guard/ReverseGuard.ts` | 362 | 反向优化有洞察，但不是核心闭环。 |

## 2. 现在的隐性问题

### 2.1 完成流程默认过重

`WorkflowCompletionFinalizer` 里存在多个默认完成步骤：delivery、panorama、wiki、semantic memory 等。尤其 Wiki 默认是 `schedule`，这会让一次知识生产完成后自动进入文档生成支线。

新主线中，完成流程应该只默认写核心 artifact：

```text
Recipe / RecipeEdge / SourceRef / ContextIndex / CompileReport
```

Wiki、Panorama、Delivery、Semantic Memory 都应该是显式开启的高级步骤。

### 2.2 Wiki 已经超出核心上下文层

`lib/service/wiki/*` 包含生成、渲染、工具函数、HTTP route，并被完成流程引用。它的价值是“把知识变成可阅读文档”，但主线真正需要的是“把知识变成可行动上下文”。

因此 Wiki 的新定位：

1. 保留手动生成能力。
2. 退出 compile completion 默认链路。
3. 不参与 runtime ContextBundle。
4. 不再作为知识质量的默认证明。

### 2.3 Tool Forge 把运行期拉向不可控

`ToolForge` 在 `AgentModule` 中注册，并被 `ToolExecutionPipeline` 作为 fallback 使用。这意味着运行期可以在工具缺失时走临时工具创造路径。

这对探索很有吸引力，但对主线不利：

1. 运行期上下文应该稳定、可解释、可复现。
2. 当前最需要的是 `ContextBundle -> GuardFinding -> CaptureDraft`，不是动态造工具。
3. Tool Forge 的维护成本高，收益低频。

建议：新主线不注册 ToolForge。旧能力放到 experimental adapter，只有显式开启才可用。

### 2.4 ReverseGuard 方向正确，但阶段过早

`ReverseGuard` 做的是 Recipe 到真实代码的反向健康验证：检查 active rule recipes、代码实体、pattern 命中、sourceRef 新鲜度，然后建议 healthy/investigate/decay。

这个方向有价值，但作为主线太重。新架构先把它的核心价值拆成更轻的编译期检查：

```text
SourceRef freshness
CodeEntity existence
RecipeEdge consistency
EvidencePackage coverage
```

也就是说，先用编译期 artifact 的新鲜度和可达性替代 ReverseGuard 的完整反向审计。

### 2.5 Guard 同时承担检查、学习、报告、覆盖分析

`GuardModule` 注册了 `guardService`、`guardCheckEngine`、`ruleLearner`、`violationsStore`、`complianceReporter`、`guardFeedbackLoop`、`reverseGuard`、`coverageAnalyzer`。这说明 Guard 已从“运行期前向检查”扩展成了一套平台。

新主线中 Guard 只保留：

```text
ContextBundle + file/diff -> GuardFinding -> explanation -> CaptureDraft/RescanRequest
```

学习、覆盖、合规报告、反向审计都降级为辅助能力。

### 2.6 AgentRuntime 成为过大的重心

`AgentRuntime`、`ToolExecutionPipeline`、`BudgetController`、`ExitController` 等模块说明当前 Agent 层已经具有完整执行系统的倾向。

但 Alembic 的核心不是替代 Codex/Claude/IDE Agent，而是给它们提供“项目上下文层”。因此 AgentRuntime 应冻结为 legacy adapter，新主线只提供：

```text
route skill -> context bundle -> guard feedback -> capture draft
```

## 3. 保留、冻结、迁出的边界

| 模块 | 保留 | 冻结 | 迁出 | 删除/默认关闭 |
| --- | --- | --- | --- | --- |
| Search / Knowledge | 保留数据能力 | - | 迁入 runtime bundle adapter | - |
| Project Intelligence | 保留扫描洞察 | - | 拆为 compile thin layer | - |
| Recipe Production | 保留 | - | 加 relation postprocess | - |
| Guard forward check | 保留 | - | 收窄到 Runtime Finding | - |
| Wiki | 保留手动导出 | 主线冻结 | Advanced | 默认关闭 |
| ToolForge | - | 冻结 | Experimental | 默认关闭 |
| ReverseGuard | - | 冻结 | Advanced audit | 默认关闭 |
| ComplianceReporter | - | 冻结 | Advanced report | 默认关闭 |
| RuleLearner | 保留数据想法 | 冻结 | 后续手动优化 | 默认关闭 |
| Dashboard all-in-one | 保留可视化 | - | Advanced tabs | 主屏替换 |
| AgentRuntime | - | 冻结 | Legacy adapter | 不再扩展 |

## 4. 新代码判断标准

以后新增模块先问四个问题：

1. 它是否产生或消费六个主对象之一？
2. 它属于编译期还是运行期？
3. 它是否会默认触发昂贵流程？
4. 它的输出能否被另一个任务窗口稳定消费？

不能回答这四个问题的功能，不进入主线。

