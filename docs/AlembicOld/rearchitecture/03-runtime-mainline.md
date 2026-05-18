# 运行期主线：从当前开发现场到可行动上下文

> 运行期不是一个新的 Agent 平台。它的职责是把编译期知识压缩成当前任务可用的上下文，并把使用中的发现反馈回编译期。

## 1. 运行期目标

运行期只做五件事：

1. 读取当前开发现场：任务、文件、symbol、diff、报错、用户意图。
2. 从编译期索引中召回相关 Recipe 和 RecipeEdge。
3. 生成小而准的 `ContextBundle`。
4. 执行前向 Guard 检查并输出 `GuardFinding`。
5. 产生 `CaptureDraft` 或 `RescanRequest` 回流编译期。

运行期不默认写 Wiki，不默认造工具，不默认做反向审计，不默认触发全量扫描。

## 2. Active Work Context

运行期的入口是 `ActiveWorkContext`：

```ts
interface ActiveWorkContext {
  taskText?: string;
  files: string[];
  symbols?: string[];
  diff?: string;
  errors?: RuntimeError[];
  commandIntent?: string;
  userFocus?: string;
}
```

它必须小，且来源明确。可以来自 Codex 当前任务、IDE 当前文件、Git diff、测试输出、用户选择。

## 3. ContextBundle

`ContextBundle` 是新运行期的核心产物：

```ts
interface ContextBundle {
  id: string;
  activeContext: ActiveWorkContext;
  recipes: BundleRecipe[];
  edges: BundleEdge[];
  sourceRefs: BundleSourceRef[];
  guardRules: BundleGuardRule[];
  risks: BundleRisk[];
  suggestedActions: BundleAction[];
  capturePrompts: CapturePrompt[];
}
```

Bundle 不是知识库全文，也不是 Wiki 摘要。它是给当前任务的“最小可行动包”。

### Bundle 必须满足

1. 小：能直接放进 Agent prompt 或 MCP tool response。
2. 准：每条 Recipe 都能解释为什么被召回。
3. 有边：不只给孤立 Recipe，还给关系。
4. 可验证：每条关键建议能追溯到 SourceRef。
5. 可反馈：用户或 Guard 能把发现转成 CaptureDraft。

## 4. Graph Expansion

运行期召回分两步：

```text
direct match -> graph expansion
```

直接匹配：

```text
file path
symbol
module
task text
diff hunks
error stack
```

图扩展：

```text
requires: 必须加入
supersedes: 过滤旧项
conflicts_with: 作为风险提示
same_context: 限量加入
refines: 根据任务深度加入
supports: 用于解释，不一定加入正文
applies_to: 增强路径/symbol 匹配
```

这样运行期就不会“搜到一堆相似文本”，而是拿到一个有结构的上下文包。

## 5. Guard 的新位置

Guard 应只做前向检查：

```text
ActiveWorkContext + ContextBundle + file/diff -> GuardFinding
```

`GuardFinding` 应该包含：

```ts
interface GuardFinding {
  severity: "info" | "warning" | "error";
  ruleRecipeId: string;
  file?: string;
  line?: number;
  message: string;
  evidence: SourceRef[];
  suggestedFix?: string;
  captureDraft?: CaptureDraft;
  rescanRequest?: RescanRequest;
}
```

ReverseGuard、ComplianceReporter、CoverageAnalyzer、RuleLearner 不进入默认链路。它们可以作为 Advanced audit/report 使用。

## 6. Agent / Codex 交互

Alembic 对 Agent 的价值不是“替代 Agent”，而是提供路由和上下文：

```text
alembic_route(task) -> ContextBundle
alembic_guard(diff) -> GuardFinding[]
alembic_capture(note/evidence) -> CaptureDraft
alembic_refresh(files) -> RescanRequest
```

这接近 Obsidian 的 Skill 思路：能力不是一堆工具按钮，而是当用户处在某个上下文时，系统知道该拿出哪种知识。

## 7. 从现有代码迁移的路径

### 7.1 SearchEngine

现有搜索能力保留，但新主线包一层：

```text
SearchEngineAdapter -> GraphExpansion -> ContextBundleBuilder
```

运行期不直接暴露 SearchResult，而是暴露 Bundle。

### 7.2 GuardService / GuardCheckEngine

保留检查能力，但收窄输出：

```text
GuardCheckEngine legacy result -> GuardFinding
```

先不重写大引擎，只写 adapter 和解释层。

### 7.3 AgentRuntime

冻结为 legacy。新运行期不继续往 `AgentRuntime` 塞能力，而是在 `lib/mainline/agent` 提供薄入口：

```text
AgentContextPresenter
McpFacade
RouteSkill
```

### 7.4 ToolRouter

工具系统保留给旧路径。新主线只需要几个稳定工具：

```text
route_context
get_context_bundle
guard_diff
capture_knowledge
request_rescan
```

动态路由、临时工具生成、复杂 adapter 仍可留在 legacy/advanced。

## 8. 运行期成功标准

运行期成功不是“能打开多少工具”，而是：

1. 当前任务能在一次调用内拿到正确 Recipe。
2. Bundle 里能解释 Recipe 为什么相关。
3. Guard 能给出可定位、可修复的 finding。
4. 用户修改后能形成 CaptureDraft 或 RescanRequest。
5. Agent 不需要理解 Alembic 全平台，只需要消费 Bundle。

