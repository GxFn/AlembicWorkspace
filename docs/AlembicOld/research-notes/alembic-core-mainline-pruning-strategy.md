# Alembic 核心主线修正与剪枝策略

> 日期：2026-05-09  
> 背景：基于 Obsidian AI / Skills 生态调研，以及对 Alembic 当前过重问题、Recipe 关系、扫描挖掘维度的再思考。  
> 目的：提出一条更清晰的建设主线，记录偏支线路，给出低改造成本的剪枝与收束策略。

## 1. 一句话结论

Alembic 不应继续把自己扩张成“全能 Agent 工程平台”，而应收束成：

```text
开发现场的项目上下文层
```

它的核心承诺是：

```text
AI 写代码前，自动知道这个项目怎么写；
AI 写代码时，旁边浮出相关规则和证据；
AI 写完代码后，被 Guard 校正；
新经验低摩擦沉淀回 Recipe Graph。
```

更具体一点：

```text
Active Work
  当前文件 / 当前 diff / 当前任务 / 当前错误
        ↓
Context Radar
  找到相关 Recipe、关系、sourceRefs、Guard 风险
        ↓
Context Bundle
  打包成 Agent 可直接消费的上下文
        ↓
Agent / IDE
  生成或修改代码
        ↓
Guard Feedback
  校验规则、冲突、过期引用
        ↓
Capture / Evolution
  新候选、关系边、替代关系、沉淀建议
        ↓
Recipe Graph
  回到下一次上下文召回
```

这条主线保留 Alembic 最强的部分：Recipe、sourceRefs、Guard、Search、MCP、Project Skill、Rescan。但它要求其他能力都回答一个问题：

```text
它是否让当前开发现场的上下文更准、更快、更可信？
```

如果答案不是，就应该从主线移到偏支、实验或暂缓。

## 2. 从 Obsidian 得到的关键启发

Obsidian 强，不是因为主应用内置了一个复杂 Agent，而是因为它有一条极清晰的主线：

```text
本地 Markdown Vault
  -> 链接 / frontmatter / 块 / 文件系统
  -> 插件和 Skills 围绕当前工作现场增强
  -> 搜索、AI、MCP、Git 都服务于用户正在写的内容
```

对 Alembic 的映射是：

| Obsidian | Alembic 应该对应什么 |
| --- | --- |
| Markdown Vault | Recipe / Skill / Wiki / sourceRefs 本地知识层 |
| 当前 note | 当前文件、当前 diff、当前任务、当前报错 |
| Smart Connections | Context Radar：主动浮出相关 Recipe 和 Guard 风险 |
| Smart Context | Context Bundle：给 Agent 的上下文包 |
| Skill 路由手册 | Alembic Route Skill：告诉 Agent 何时 search、guard、capture、rescan |
| 插件生态 | IDE/MCP/Codex/CLI 入口，但不喧宾夺主 |

Obsidian 的教训也很明确：

- 不要把所有智能都塞进主 Runtime。
- 不要让用户先理解系统器官再使用能力。
- 不要把低频能力放到高频主界面。
- 好的 AI 产品不一定是更大的 Agent，而是更好的上下文进入方式。

## 3. Alembic 当前的问题重述

Alembic 当前过重，不是单点模块过大，而是主线被多条强能力拉散：

```text
Recipe 知识库
+ Guard
+ AgentRuntime
+ Workflow 引擎
+ ToolRouter 平台
+ Wiki 生成
+ Dashboard 管理台
+ SignalCollector
+ Tool Forge
+ Skill Forge
+ 多 IDE / Lark / Xcode / Codex 交付
```

每一条都能讲出价值，但用户高频问题其实只有三个：

1. 这个项目怎么写？
2. 我现在改这段代码，要遵守哪些项目约定？
3. 我写完了，哪里不符合约定，怎么修？

所以主线应从“知识有机体的所有器官”收束到“开发现场上下文闭环”。

## 4. 新核心主线：Project Context Layer

建议把 Alembic 的产品主线定义为 `Project Context Layer`，中文可叫“项目上下文层”。

它不是文档系统，不是代码搜索器，不是 CI Linter，不是通用 Agent，不是 Obsidian for Code。它是覆盖在 IDE/Agent 上的一层项目上下文：

```text
Code Evidence
  代码实体、文件、diff、调用链、测试、错误
        ↓
Recipe Graph
  项目规则、模式、反例、关系、sourceRefs
        ↓
Context Bundle
  针对当前任务的最小可信上下文包
        ↓
Agent Action
  写代码、改代码、解释代码、生成测试
        ↓
Guard Feedback
  违反哪些 Recipe、冲突哪些关系、引用是否过期
        ↓
Knowledge Update
  新候选、边、替代、修正、失效
```

### 4.1 主线对象

主线只承认五个一等对象：

| 对象 | 作用 |
| --- | --- |
| `SourceRef` | 可信证据锚点，连接 Recipe 和代码实体 |
| `Recipe` | 项目如何写代码的最小规则/模式/事实 |
| `RecipeEdge` | Recipe 之间的支撑、前置、冲突、替代、细化关系 |
| `ContextBundle` | 针对当前开发现场打包出的 Agent 上下文 |
| `GuardFinding` | 写完后的规则反馈，反哺 Recipe 和关系 |

其他对象都应降级为辅助对象。例如 Wiki 是展示层，Skill 是操作手册，Signal 是反馈源，Workflow 是执行方式，Dashboard 是控制面。

### 4.2 主线动作

主线只保留五个高频动作：

| 动作 | 用户语言 | 系统行为 |
| --- | --- | --- |
| `prime` | “我要改这个功能” | 根据任务/文件/diff 生成 Context Bundle |
| `apply` | “按项目规范写” | Agent 消费 Bundle 写代码 |
| `guard` | “检查是否符合规范” | 用 Recipe Graph 解释违规和修复方向 |
| `capture` | “把这个模式沉淀下来” | 生成 Candidate / Recipe / Edge 草稿 |
| `refresh` | “项目变了，刷新知识” | 基于 diff 和关系做定向 rescan |

其他动作如果不能映射到这五个动作，就不应进入主线。

## 5. Recipe Graph 成为主梁

如果 Alembic 要从“Recipe 列表”进化为“项目上下文层”，Recipe 必须从孤立卡片变成图。

### 5.1 关系类型收束

先不要追求 14 种甚至更多关系。建议主线只认 7 种强语义关系：

| 关系 | 方向 | 用途 |
| --- | --- | --- |
| `supports` | A -> B | A 支撑 B，检索 B 时可带出 A |
| `requires` | A -> B | A 是 B 的前置约束，Guard 修复时必须提示 |
| `conflicts_with` | A <-> B | A 与 B 冲突，候选创建和 Guard 时需要警告 |
| `supersedes` | A -> B | A 替代 B，用于演化和过期处理 |
| `refines` | A -> B | A 是 B 的细化，用于上下文分层 |
| `same_context` | A <-> B | A 与 B 共享模块/文件/代码实体 |
| `applies_to` | Recipe -> CodeEntity/File | Recipe 作用于某代码实体或范围 |

这 7 种关系已经足够驱动主线。低频关系可留在 metadata，不急着进入产品层。

### 5.2 关系来源优先级

关系不要一开始就全靠 LLM 两两判断。高置信来源优先：

1. 手动建立关系。
2. `supersedes` / deprecated 提案。
3. Candidate 与现有 Recipe 的 ConsolidationAdvisor 结果。
4. 同一 sourceRef / 同一代码实体。
5. Guard 共同触发。
6. Search 共同命中。
7. LLM 关系挖掘。

LLM 应用于“补全解释”和“低置信复核”，不是默认主力。

### 5.3 Recipe Graph 的真实用途

Recipe Graph 不应只是 Dashboard 图谱，它必须进入执行路径：

```text
Search 命中 Recipe
  -> 扩展 supports / requires / refines / conflicts_with 一跳
  -> 生成 Context Bundle

Guard 命中违规
  -> 找 requires 前置规则
  -> 找 conflicts_with 冲突规则
  -> 找 supersedes 替代规则
  -> 给出解释和修复路径

Candidate 创建
  -> 查相似、覆盖、冲突、替代
  -> 不只返回建议，还落边

Rescan 规划
  -> 代码变更影响 sourceRef
  -> sourceRef 影响 Recipe
  -> Recipe 关系传播影响范围
```

如果一条关系不能影响 Search、Guard、Capture、Refresh 中至少一个动作，就先不要产品化。

## 6. 扫描维度重新定义：从分类表到挖掘镜头

当前维度体系最大的问题，是把太多概念塞进 `DimensionRegistry`：知识分类、扫描任务、UI 分组、语言激活、质量描述、输出模式都混在一起。

建议重新定义：

```text
扫描维度不是知识分类，而是挖掘镜头。
```

Recipe 的分类可以继续有 `knowledgeType`。但扫描维度回答的是：

```text
这次我用什么视角去代码里找值得沉淀的东西？
```

### 6.1 主线维度

主线只保留少数基础维度：

| 维度 | 目的 | 输出 |
| --- | --- | --- |
| `project-shape` | 项目结构、入口、模块边界、依赖方向 | 少量 architecture / boundary Recipe + applies_to 边 |
| `coding-contract` | 命名、文件组织、导出、注释、风格 | code-standard Recipe |
| `agent-guidelines` | Agent 写代码最需要知道的项目级约定 | Project Skill / Recipe |
| `quality-safety` | 错误、测试、安全、稳定性的大规则 | best-practice / guardable Recipe |
| `recipe-relations` | 不产 Recipe，专门挖掘关系边 | RecipeEdge |

这几个维度构成 cold start 的默认最小主链。

### 6.2 条件维度

条件维度只有在代码证据足够时才跑：

| 条件维度 | 激活证据 |
| --- | --- |
| `ui-interaction` | UI 框架、View/Component 目录、导航/布局代码 |
| `networking-api` | HTTP client、API route、OpenAPI、service client |
| `persistence-data` | DB、ORM、migration、cache、storage |
| `concurrency-async` | async/await、worker、queue、lock、actor、stream |
| `security-auth` | auth、token、permission、crypto、secrets |
| `performance` | cache、render hot path、startup、large list、profiling hints |
| `observability` | logger、trace、metrics、error reporting |

关键变化：这些维度不再默认全跑，也不再为了覆盖率而产出泛泛 Recipe。没有证据就不跑，有证据也只围绕当前 evidence package 产出。

### 6.3 语言和框架降级为 overlay

语言/框架不应继续膨胀为顶层维度。它们更适合作为 overlay：

```text
project-shape + Swift overlay
coding-contract + React overlay
quality-safety + FastAPI overlay
networking-api + Go overlay
```

Overlay 改变：

- 重点文件模式。
- 常见 sourceRefs。
- 术语。
- 反例。
- Guard 规则模板。

Overlay 不改变主线动作，不新增大工作流。

## 7. Context Bundle 成为产品单位

Alembic 现在 search/prime/guard 结果仍偏工具输出。主线应把 `ContextBundle` 作为高频产品单位。

建议结构：

```ts
interface ContextBundle {
  id: string;
  purpose: 'pre-code' | 'guard-fix' | 'capture-review' | 'rescan-impact';
  activeWork: {
    task?: string;
    files?: string[];
    diffSummary?: string;
    cursorSymbol?: string;
    errorSummary?: string;
  };
  recipes: Array<{
    id: string;
    title: string;
    whyRelevant: string;
    sourceRefs: string[];
    relationPath?: string[];
    confidence: number;
  }>;
  guardHints: Array<{
    recipeId: string;
    risk: string;
    fixDirection: string;
  }>;
  skillHints: Array<{
    name: string;
    whyUse: string;
  }>;
  exclusions: Array<{
    id: string;
    reason: string;
  }>;
}
```

Context Bundle 是 Alembic 的 `Smart Context`。它应该可以：

- 被 Agent 直接消费。
- 被 Dashboard 展示。
- 被复制到 PR / review 说明。
- 被 Guard 修复流程复用。
- 被 capture 流程引用为证据。

## 8. 修正后的建设路线

### P0：主线定义落地

目标：不大改架构，先把概念和入口收束。

工作：

1. 新增 `RelationOntology`，定义 7 种主线关系。
2. 新增 `ContextBundle` 类型和最小生成器。
3. 给 search/prime 增加 graph expansion。
4. 写一个高质量 `alembic` route skill，说明 Agent 如何使用 Alembic。
5. Dashboard 首页改成 Current Context，而不是功能总览。

验收：

- 给一个文件或 diff，能返回 5 条以内最相关 Recipe 和关系解释。
- 命中 Recipe 后能带出一跳 `requires/supports/conflicts_with`。
- Agent 能通过 route skill 稳定选择 search、guard、capture、rescan。

### P1：Recipe Graph 进入 Guard 和 Candidate

目标：让关系不只是可视化，而是影响行为。

工作：

1. Candidate 创建后落 `same_context`、`refines`、`supersedes` 草稿边。
2. Guard 违规时扩展相关前置/冲突/替代 Recipe。
3. Recipe detail 页显示“为什么这条被带出”，不是只显示边列表。
4. Deprecated / supersedes 传播到搜索结果，避免过期 Recipe 被直接注入。

验收：

- Guard 输出能解释“这条规则背后的前置约束”。
- 新 Candidate 能判断是新增、细化、替代、冲突，而不是只有相似度。

### P2：扫描维度重组

目标：减少冷启动噪音，提升候选质量。

工作：

1. 新建 `DimensionLensPolicy`，把现有维度分为主线、条件、overlay、实验。
2. Bootstrap 默认只跑主线维度。
3. Rescan 根据 diff/sourceRefs/graph impact 激活条件维度。
4. 新增 `recipe-relations` graph-only 维度。

验收：

- 一次冷启动产出的候选更少，但更有 sourceRefs 和可用性。
- Rescan 不再默认扫描大而全维度，而是解释为什么激活某维度。

### P3：Dashboard 从管理台改为工作台

目标：让用户第一眼看到“当前任务该用什么上下文”。

工作：

1. 首页 Current Context：当前文件/diff/task、推荐 Recipe、Guard 风险、可注入 Bundle。
2. Recipes / Graph / Wiki / Signals 等页面进入 Advanced 区。
3. Skills 页突出 route skill 和项目 Skill 是否启用。
4. Guard 页从审计报告转成“修复路径”。

验收：

- 用户打开 Dashboard 不需要理解 Alembic 所有器官，就能拿到当前任务上下文。

### P4：Capture 和 Clipper

目标：把新经验沉淀变轻。

工作：

1. 选中代码/diff/error 后生成 Candidate draft。
2. 模板化抽取 title、when、do、dont、sourceRefs。
3. 自动建议 RecipeEdge。
4. 默认进入 review，不自动 publish。

验收：

- 用户说“把这段沉淀下来”，系统能生成可审阅候选，而不是让用户填复杂表单。

## 9. 偏支线路记录

以下不是否定这些能力，而是给它们重新定位。主线资源有限时，应优先服务 `Project Context Layer`。

| 线路 | 当前价值 | 问题 | 建议 |
| --- | --- | --- | --- |
| Wiki 生成 | 适合长文档和项目解释 | 高频编码时不如 Context Bundle 直接 | 保留为背景资料，降级为 Advanced；优先让 Wiki section 可进入 Bundle |
| Tool Forge | 很有想象力，展示创造性 | 低频、风险高、会扩大 Runtime 复杂度 | 冻结为 experimental，不进入 README 主线，不新增默认入口 |
| SignalCollector auto | 可发现长期模式 | 后台 AI 消耗、推荐噪音、auto create 信任风险 | 默认 suggest/off，取消 auto 作为主推；显式用户触发优先 |
| Lark Remote | 移动端入口有特色 | 与核心编码现场距离远 | 保留集成，不投入主线资源 |
| Remote Recipe Repository | 团队共享有价值 | 需要权限、同步、冲突、信任体系 | 延后；先把本地 Recipe Graph 做准 |
| 全量多语言深度 AST | 对结构理解有价值 | 每种语言都深做会拖慢主线 | 保留基础实体抽取；语言专深作为 overlay |
| Xcode / VS Code Extension | 可增强 IDE 体验 | 维护成本高，分散入口 | 只做 Context Bundle 和 Guard surfacing，不做大而全 IDE |
| Workflow Skill Forge | 能沉淀流程 | 容易把所有过程都升格成 Skill | 保留显式触发；不做后台自动挖掘主线 |
| AI Chat View | 演示方便 | 容易变成通用聊天窗口 | 改成围绕 Bundle 的问答，不做独立主线 |
| Full Dashboard 管理台 | 可管理全部内部系统 | 用户认知成本高 | 改为 Current Context 工作台 + Advanced |
| 大而全冷启动 | 能展示覆盖面 | 候选多、噪音大、耗时长 | 改为主线维度最小冷启动 + 条件补扫 |
| AgentRuntime 继续增强 | 能承载复杂任务 | 已经过重，容易继续膨胀 | 冻结核心；新智能放在 Bundle/Graph/Planner |

## 10. 剪枝原则

任何新功能或旧功能是否继续投入，用这 7 个问题判断：

1. 它是否发生在用户高频编码现场？
2. 它是否改善 pre-code 上下文、post-code Guard、capture 沉淀、refresh 演化之一？
3. 它能否变成 Recipe、Skill、Bundle 或 Edge，而不是新增 Runtime 逻辑？
4. 它是否有 sourceRefs 或可验证证据？
5. 它是否能减少 Agent token 和用户解释成本？
6. 它失败时是否可降级为只读或草稿？
7. 它是否需要用户理解 Alembic 内部器官才能使用？

如果 1-4 中没有至少两个是肯定，就不进主线。

## 11. 主线文案修正建议

当前 README 的“知识有机体”叙事很有辨识度，但对新用户偏重。建议主叙事收束为：

```text
Alembic is a project context layer for AI coding agents.
It turns your codebase into a local Recipe Graph, then injects the right project rules and evidence into the agent's current task.
```

中文：

```text
Alembic 是 AI 编码 Agent 的项目上下文层。
它把代码库沉淀成本地 Recipe Graph，并在 Agent 写代码前后注入最相关的项目规则、代码证据和 Guard 反馈。
```

README 主线结构建议：

1. Why：AI 不知道项目约定。
2. What：本地 Recipe Graph + Context Bundle + Guard。
3. Daily Loop：prime -> code -> guard -> capture。
4. Cold Start：最小主线扫描，不再强调所有维度。
5. Advanced：Wiki、Dashboard、Signals、Forge、Remote、Lark。

这样既不否定已有能力，也不让它们抢主线。

## 12. 最小落地文件建议

不做大拆，只加薄层：

```text
lib/domain/knowledge/RelationOntology.ts
lib/domain/context/ContextBundle.ts
lib/service/search/GraphExpansion.ts
lib/service/context/ContextBundleBuilder.ts
lib/workflows/capabilities/planning/dimensions/DimensionLensPolicy.ts
plugins/alembic-codex/skills/alembic-mainline/SKILL.md
dashboard/src/components/Views/CurrentContextView.tsx
```

现有系统可以继续存在：

- `KnowledgeEdgeRepository` 继续存边。
- `SearchEngine` 增加 graph expansion，不重写。
- `GuardService` 增加 graph-aware explanation，不重写。
- `RecipeProductionGateway` 增加 relation postprocess，不重写。
- `DimensionRegistry` 暂不删除，只由 `DimensionLensPolicy` 重新解释。

这是低成本修正路线：在现有重系统上加一条轻而清晰的主线，而不是立刻拆老架构。

## 13. 成功指标

主线是否成立，不看功能数量，看这些指标：

| 指标 | 目标 |
| --- | --- |
| 首次可用上下文时间 | setup 后一次 prime 能在短时间内给出相关 Bundle |
| Bundle 命中率 | top 5 Recipe 中至少 3 条被用户/Agent 使用或认可 |
| Guard 修复率 | Guard 输出能直接指导修复，而不是只报违规 |
| Candidate 接受率 | 手动或 Clipper 生成候选的接受率提高 |
| Rescan 激活维度数 | 默认减少，但命中更准 |
| 过期 Recipe 注入率 | supersedes/deprecated 后不再被直接推荐 |
| 用户解释成本 | 用户不再反复说明“这个项目怎么写” |

## 14. 最终判断

Alembic 不需要为了减重而大拆。更好的策略是：

```text
把重量重新压到一条主梁上。
```

这条主梁就是：

```text
SourceRef -> Recipe -> Recipe Graph -> Context Bundle -> Guard Feedback -> Capture / Rescan
```

Obsidian 给 Alembic 的最大启发，不是做笔记，也不是做插件市场，而是把智能放回用户正在工作的现场。Alembic 的现场不是 Markdown note，而是：

```text
当前文件、当前 diff、当前任务、当前 Agent 输出、当前 Guard 反馈。
```

围绕这个现场建设，Alembic 会变轻；围绕所有可能能力建设，Alembic 会继续变重。

下一阶段的原则应该是：

```text
少做平台，多做上下文；
少做全量扫描，多做证据触发；
少做孤立 Recipe，多做 Recipe Graph；
少做后台智能，多做显式可审阅沉淀；
少做复杂入口，多做当前开发现场。
```
