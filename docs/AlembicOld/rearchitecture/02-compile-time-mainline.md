# 编译期主线：从项目到知识图谱

> 编译期的职责不是“跑一个聪明 Agent”，而是把项目证据编译成稳定、可验证、可增量更新的知识 artifact。

## 1. 编译期目标

编译期只做四件事：

1. 从代码、文档、diff、历史 Recipe 中采集证据。
2. 把证据归一化为 `EvidencePackage`。
3. 从证据中产出 `Recipe` 和 `RecipeEdge`。
4. 更新 `CompiledContextIndex`，供运行期快速读取。

它不默认生成 Wiki，不默认启动 Dashboard 流程，不默认调用 Tool Forge，不默认做反向 Guard 审计。

## 2. 编译期输入输出

输入：

```text
ProjectSnapshot
ChangedFiles
CodeEntities
ExistingRecipes
ExistingRecipeEdges
SourceRefs
GuardFindings
UserCaptureNotes
```

输出：

```text
EvidencePackage
RecipeCandidate
Recipe
RecipeEdge
SourceRef
CompileReport
CompiledContextIndex
```

编译期可以使用 LLM，但 LLM 输出只是候选。最终写入必须经过 deterministic validator：

```text
candidate -> schema validation -> sourceRef validation -> edge validation -> index write
```

## 3. Dimension Lens，而不是大分类

当前项目中 Dimension/SOP/LanguageExtension 的倾向是把“扫描维度”做成体系化目录。新架构里，维度应当是挖掘镜头，不是知识本体。

主维度只保留五个：

| 维度 | 作用 |
| --- | --- |
| `project-shape` | 项目结构、模块边界、入口、依赖方向。 |
| `coding-contract` | 代码约定、接口契约、命名、错误处理、数据流。 |
| `agent-guidelines` | Agent 在此项目中如何安全修改、运行、验证。 |
| `quality-safety` | 测试、构建、风险、权限、安全边界。 |
| `recipe-relations` | Recipe 之间的依赖、冲突、替代、细化、同上下文关系。 |

条件维度按证据激活：

```text
ui-interaction
networking-api
persistence-data
concurrency-async
security-auth
performance
observability
release-deploy
```

语言和框架只做 overlay，例如 TypeScript、Swift、React、Node、Xcode，不再成为知识主分类。

## 4. RecipeEdge 是编译期核心

Recipe 之间的关系比单条 Recipe 更重要。新架构优先支持七类边：

| 关系 | 含义 | 运行期用途 |
| --- | --- | --- |
| `requires` | A 使用前必须先满足 B。 | ContextBundle 必须召回前置约束。 |
| `supports` | A 支持 B 的判断或实践。 | 增强解释和证据链。 |
| `conflicts_with` | A 与 B 存在冲突或替代风险。 | Guard 提醒用户选择路径。 |
| `supersedes` | A 替代旧 Recipe B。 | 避免召回过时知识。 |
| `refines` | A 是 B 的更细实现。 | 从概念下钻到代码模式。 |
| `same_context` | A 与 B 常在同一任务出现。 | Runtime 自动扩展 bundle。 |
| `applies_to` | A 适用于某模块、路径、symbol、任务。 | 当前文件召回。 |

边的来源必须可解释：

```text
sourceRef overlap
code entity co-occurrence
guard finding co-occurrence
manual user link
LLM candidate with evidence
```

## 5. 从现有代码迁移的路径

### 5.1 ProjectIntelligenceRunner

`ProjectIntelligenceRunner` 现在接近编译期核心，但过于像执行工作流。建议拆成：

```text
EvidencePackageBuilder
CodeEntitySnapshotBuilder
DimensionLensPolicy
CompileReportWriter
```

保留它的项目理解能力，去掉“完成一整套外部流程”的责任。

### 5.2 KnowledgeRescanPlanner

它应变成编译期增量规划器：

```text
changed files -> affected sourceRefs -> affected recipes -> affected edges -> rescan plan
```

不再把 rescan 看成全局任务，而是围绕 SourceRef 和 RecipeEdge 做影响分析。

### 5.3 RecipeProductionGateway

这里适合加入关系后处理：

```text
recipe candidates -> relation candidates -> edge validation -> graph write
```

不要另起一个庞大 Relation 系统。先把关系作为 Recipe 生产的自然后续步骤。

### 5.4 ReverseGuard 的替代

ReverseGuard 的完整审计暂时退出主线，但保留其中最核心的检查：

```text
SourceRef 是否还存在
SourceRef 指向的 symbol 是否仍可解析
RecipeEdge 的两端是否仍 active
applies_to 是否仍命中文件或模块
```

这些检查应归入编译期 freshness，而不是运行期反向 Guard。

## 6. 编译期成功标准

一次编译成功，不以生成多少 Markdown 或报告为准，而以以下指标为准：

1. 新增或更新了多少有 SourceRef 的 Recipe。
2. 新增或修复了多少 RecipeEdge。
3. 多少旧 Recipe 被标记为 stale/superseded。
4. 运行期 ContextBundle 的召回准确率是否提高。
5. GuardFinding 是否能更快解释并关联到具体 Recipe。

## 7. 编译期最小实现

第一阶段只需要实现：

```text
EvidencePackageBuilder
RecipeRelationMiner
CompileArtifactWriter
SourceRefFreshnessCheck
CompiledContextIndexAdapter
```

这些可以先包在 `lib/mainline/compile` 下，通过 legacy adapter 读取现有仓库、Recipe、Search、Guard 数据。

