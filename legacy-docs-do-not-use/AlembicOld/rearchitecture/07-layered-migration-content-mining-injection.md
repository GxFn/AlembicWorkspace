# 自底向上迁移计划：内容挖掘与知识注入

> 目标：把旧 Alembic 逐层迁入 `lib/mainline`，最终让“内容挖掘”和“知识注入”成为上层两条清晰主线。迁移顺序必须从最底层开始，先立契约和数据边界，再接旧系统，最后替换默认链路。

## 1. 两条上层主线

### 1.1 内容挖掘 Content Mining

内容挖掘负责把项目材料编译成知识：

```text
Project material
  -> EvidencePackage
  -> DimensionLensActivation
  -> RecipeCandidate
  -> Recipe
  -> RecipeEdge
  -> CompileReport
  -> ContextIndex
```

它吸收旧系统里的：

- bootstrap / cold-start
- knowledge-rescan
- project-intelligence
- recipe-production
- source-ref-reconcile
- 部分 guard feedback

它不吸收：

- Wiki 自动生成
- ToolForge
- ReverseGuard 全量反向审计
- Dashboard 工作流编排
- AgentRuntime 执行系统

### 1.2 知识注入 Knowledge Injection

知识注入负责把已编译知识注入当前开发现场：

```text
ActiveWorkContext
  -> ContextIndex read
  -> GraphExpansion
  -> ContextBundle
  -> AgentContext / GuardFinding / Dashboard View
  -> CaptureDraft / RescanRequest
```

它吸收旧系统里的：

- search / retrieval
- guard forward check
- prompt/context injection
- MCP route
- IDE/dashboard 当前上下文展示

它不吸收：

- 运行期全量 rescan
- 动态造工具
- Wiki 渲染
- ReverseGuard
- SemanticMemory 自动固化

## 2. 分层迁移顺序

### Layer 0: Foundation / Domain

状态：第一轮已建立。

范围：

```text
lib/mainline/foundation/*
lib/mainline/domain/*
```

职责：

- 定义 `SourceRef`
- 定义 `Recipe`
- 定义 `RecipeEdge`
- 定义 `EvidencePackage`
- 定义 `ContextBundle`
- 定义 `GuardFinding`
- 定义基础纯函数

完成标准：

- 不 import 旧 service / repository / agent。
- 类型足够表达内容挖掘与知识注入。
- 测试可在无数据库环境运行。

### Layer 1: Data Boundary

状态：已有 `ContextIndex` 雏形，需要继续补齐 store contract。

范围：

```text
lib/mainline/data/*
```

职责：

- 定义 `SourceRefStore`
- 定义 `RecipeStore`
- 定义 `RecipeEdgeStore`
- 定义 `ContextIndexReader`
- 定义 `ContextIndexWriter`
- 定义 `CompiledContextSnapshot`

完成标准：

- 编译期只通过 writer 写 artifact。
- 运行期只通过 reader 读 artifact。
- 内存实现可用于测试和早期开发。

### Layer 2: Legacy Mapping Membrane

状态：只有边界清单，还没有真实 mapper。

范围：

```text
lib/mainline/legacy/*
```

职责：

- 把旧 `KnowledgeEntry` / search result 映射为 `Recipe`。
- 把旧 `KnowledgeEdge` 映射为 `RecipeEdge`。
- 把旧 `RecipeSourceRefEntity` 映射为 `SourceRef`。
- 把旧 Guard result 映射为 `GuardFinding` 候选。

完成标准：

- legacy mapper 是纯函数或薄 adapter。
- 新主线不直接 import `WikiGenerator`、`ToolForge`、`AgentRuntime`。
- mapper 可以在不启动 daemon、不跑数据库写入的情况下测试。

### Layer 3: Compile Lower Pipeline

状态：已有 `EvidencePackageBuilder`、`DimensionLensPolicy`、`RecipeRelationMiner`、`CompileReportBuilder`。

范围：

```text
lib/mainline/compile/*
```

职责：

- 组装内容挖掘的最小 pipeline。
- 从 evidence 激活 lens。
- 生成或接收 Recipe candidate。
- 挖掘 RecipeEdge。
- 运行 SourceRef freshness。
- 输出 CompileReport。

完成标准：

- pipeline 不生成 Wiki。
- pipeline 不触发 ToolForge。
- pipeline 不跑 ReverseGuard。
- pipeline 的输出可以直接写入 `ContextIndexWriter`。

### Layer 4: Runtime Lower Pipeline

状态：已有 `ContextBundleBuilder`、`GraphExpansion`、`GuardFindingBuilder`。

范围：

```text
lib/mainline/runtime/*
```

职责：

- 从 `ActiveWorkContext` 生成 `ContextBundle`。
- 做 RecipeGraph 扩展。
- 把风险和规则解释成 `GuardFinding`。
- 生成 `CaptureDraft` 或 `RescanRequest`。

完成标准：

- runtime 不触发 compile-time rescan，只能产出 request。
- runtime 不接 ToolForge。
- runtime 不使用 Wiki。
- runtime 不直接依赖旧 `GuardService`，只能通过 adapter。

### Layer 5: Agent / MCP / Dashboard Injection

状态：已有 `AgentContextPresenter` 和 `RouteSkill.md`。

范围：

```text
lib/mainline/agent/*
dashboard/*
MCP route 层
```

职责：

- 把 `ContextBundle` 转成 Agent 可消费上下文。
- 暴露少量 MCP route：route context、get bundle、guard diff、capture、request rescan。
- Dashboard 主屏展示 Current Context，而不是全控制台。

完成标准：

- Agent 只消费 bundle，不成为主线中心。
- Dashboard 不反向决定领域模型。
- MCP route 不暴露旧重型能力为默认入口。

### Layer 6: Legacy Default Pruning

状态：已有执行图。

范围：

```text
lib/workflows/capabilities/completion/*
lib/injection/modules/*
lib/agent/runtime/*
lib/service/guard/*
```

职责：

- Wiki 默认关闭。
- Delivery 默认关闭。
- Panorama 默认关闭。
- SemanticMemory 默认关闭。
- ToolForge fallback 默认关闭。
- ReverseGuard 迁到 Advanced/manual。

完成标准：

- 旧能力仍可显式调用。
- 新主线成为默认路径。
- 旧重型功能不再自动进入日常开发循环。

## 3. 下一轮任务拆分

### Task A: Data Boundary Builder

写入范围：

```text
lib/mainline/data/*
test/unit/MainlineData.test.ts
```

任务：

- 补 `ArtifactStores.ts` 或同等文件。
- 定义 `SourceRefStore`、`RecipeStore`、`RecipeEdgeStore`。
- 让 `InMemoryContextIndex` 可作为这些 store 的组合实现。
- 测试编译期写入、运行期读取、snapshot roundtrip。

### Task B: Legacy Mapper Builder

写入范围：

```text
lib/mainline/legacy/*
test/unit/MainlineLegacy.test.ts
```

任务：

- 新增旧对象到新主线对象的纯 mapper。
- 优先支持 `KnowledgeEdge`、`RecipeSourceRefEntity`、`SearchResultItem`。
- 不启动旧 service，不访问数据库。
- 测试旧数据映射到 `Recipe`、`RecipeEdge`、`SourceRef`。

### Task C: Content Mining Lower Pipeline

写入范围：

```text
lib/mainline/compile/*
test/unit/MainlineContentMining.test.ts
```

任务：

- 新增 `ContentMiningPipeline`。
- 串起 `EvidencePackageBuilder`、`DimensionLensPolicy`、`RecipeRelationMiner`、`SourceRefFreshnessCheck`、`CompileReportBuilder`。
- 输出可写入 `ContextIndexWriter` 的 artifact 包。
- 不接 LLM，不接 Wiki，不接 ToolForge。

### Task D: Knowledge Injection Lower Plan

写入范围：

```text
lib/mainline/agent/*
test/unit/MainlineKnowledgeInjection.test.ts
```

任务：

- 新增 `KnowledgeInjectionPlan` 或 `AgentInjectionPlanner`。
- 从 `ContextBundle` 生成 Agent 注入片段：rules、risks、source refs、suggested actions。
- 不调用工具、不触发扫描，只做 bundle 到 prompt/plan 的转换。

## 4. 推荐执行顺序

```text
Task A Data Boundary
  -> Task B Legacy Mapper
  -> Task C Content Mining Pipeline
  -> Task D Knowledge Injection Plan
  -> Legacy default pruning
```

Task A 和 Task B 可以并行；Task C 依赖 A 的写入接口；Task D 只依赖现有 runtime bundle，可以并行低风险推进。

## 5. 任务窗口同步规则

- 每个窗口只改自己的写入范围。
- 如果需要改 `domain`，先停下来汇报，不要自行修改。
- 不要多个窗口同时改 `package.json`。
- 不要碰 `lib/workflows`，直到新主线底层和 adapter 能跑通。
- 每个窗口必须跑针对性测试和 Biome。
- 每个窗口结束时说明：修改文件、验证命令、是否触碰旧系统。

