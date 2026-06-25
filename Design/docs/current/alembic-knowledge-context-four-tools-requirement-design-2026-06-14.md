# Alembic 知识与项目信息四工具支撑层需求设计

## 元信息

- Design Key：`alembic-knowledge-context-four-tools-requirement-design-2026-06-14`
- 状态：Design requirement design candidate，用户已确认，等待总控 intake
- 当前窗口：Design 需求窗口
- 需求类型：AlembicPlugin MCP 知识读取、项目结构、语义关联与交互状态支撑层重构
- 设计日期：2026-06-14
- 设计边界：本文件不是任务包、不是实现派发、不是验收结论

## 用户已确认决策

- 总控可按需求组 K0-K9 正式接收；第一步做 K0，只读盘点后再进入实现。
- K0 推荐由 AlembicPlugin 窗口执行只读代码事实与消费者清单，总控负责接收和判断。
- 真实验证项目范围更新为：直接使用已建立的 Alembic 空间级知识库，覆盖 Alembic 空间内真实分仓库知识和项目结构；至少验证 `AlembicPlugin`，并建议追加 `Alembic` 或 `AlembicCore` 中一个真实项目。
- 本需求不包含仓库删除、知识库删除、索引清空或破坏性验证操作。
- 旧工具删除方式按推荐执行：`alembic_knowledge`、`alembic_structure`、`alembic_panorama` 不再出现在正常 `tools/list`。
- 新目录命名按推荐执行：`lib/service/project-knowledge-context/`。
- 兼容策略更新为硬删除：旧公共工具不保留兼容层；真实消费者扫描发现问题时修复消费者和测试，不以兼容层保留旧工具。
- 验证完成门槛按推荐执行：四个工具按顺序全部真实 MCP 验证通过才算完成；需要 Test 窗口复验。
- `alembic_project_matrix` 不做知识覆盖评估，不回答“哪些模块有知识/缺知识”。它只做项目知识库分类摘要、项目地图、高层项目结构图摘要，保证宿主 AI 一眼了解知识库分类、项目地图与结构信息。
- `insights` 和 `confirm_usage` 不包含在本需求中，暂时不考虑迁移、保留或替代。
- MCP `tools/list` 描述、input schema 字段说明、tool annotations、structured output 摘要、`nextActions`、README 与 Skill 使用说明必须与四工具新语义同步，否则宿主 AI 仍会误选旧工具，不能算完成。
- Recipe 查找按“先大面积候选池，再关系扩展，再向量与关键内容加权重排”的路线设计；最好能返回 Recipe 知识关系链作为候选解释证据。项目里已有成熟向量工程，应优先复用，不另造向量体系。

## Problem

用户希望 Alembic 知识库相关 MCP 工具不再暴露多个语义混杂的入口，而是以四个公共 MCP 工具为最终目标：

- `alembic_project_matrix`
- `alembic_prime`
- `alembic_search`
- `alembic_graph`

当前 AlembicPlugin 已经具备不少成熟能力：intent 归一化、会话状态、prime 检索、resident search、知识搜索、项目结构、panorama、源码图/项目结构关系、source graph 引用和结构化输出契约。但这些能力分散在不同 handler、schema、output projector 和旧工具语义里，导致三个问题：

- 公共 MCP 面过宽：`alembic_knowledge`、`alembic_structure`、`alembic_panorama` 与 `alembic_search`、`alembic_graph` 职责重叠，宿主 AI 容易误选。
- 语义混杂：`alembic_panorama` 同时包含项目总览、健康度、decay、staging、governance；其中 `staging_check` 会触发状态检查和 promote，不能继续挂在项目地图语义下。
- 状态分裂风险：四个新工具如果另建“当前任务/当前意图”状态，会与现有 `intent`、`ctx.session.intent`、`INTENT_RECORDS`、`WORK_RECORDS` 冲突。
- 入口指引漂移：当前 MCP 描述、tool catalog、skills 和 README 里仍可能推荐 `alembic_knowledge`、`alembic_structure`、Recipe graph 或 `confirm_usage` 等旧语义；即使代码实现四工具，如果说明不改，宿主 AI 仍无法真实正确使用。

本需求不是把现有能力删薄，而是围绕四个 MCP 的最终使用体验重新组织内部能力：成熟逻辑保留，可复用查询能力下沉，语义混杂公共入口剪枝。

## Goal

在 AlembicPlugin 内重构一个内部支撑层，暂定名为 `ProjectKnowledgeContextLayer`，只服务四个公共 MCP 工具。

最终用户可观察结果：

- 宿主 AI 只需要四个清晰入口就能完成项目理解、任务上下文装配、知识检索、项目内部结构关系推理。
- 四个工具共享输入基础字段、统一输出 envelope、统一 `interaction` 状态摘要、统一 detail refs 和 freshness 语义。
- 默认输出精简、结构化、可解析；长内容、源码、完整知识条目和完整图边通过 detail refs 或显式 `get/expand` 获取。
- 公共输出不再暴露单一平台字样，按宿主中立语义表达。
- 旧的语义混杂工具不再作为默认公共 MCP 入口出现。
- `alembic_project_matrix` 默认返回高度概括的项目地图、知识库分类摘要和项目结构图摘要，不做模块级知识覆盖或知识空白判断。

## Non-goals

- 不在 Design 阶段修改 AlembicPlugin 产品代码。
- 不把四工具支撑层扩展成所有 MCP 工具的总线。
- 不让支撑层处理 Guard、bootstrap、rescan、submit_knowledge、dimension_complete、evolve、decision、work_start、work_finish 生命周期写入。
- 不保留旧公共入口兼容层；真实消费者需要迁移或修复。
- 不把项目矩阵工具变成联网 research 工具；外部资料只作为设计依据，不是默认 runtime 行为。
- 不把成熟检索、图谱、intent 逻辑删成空壳门面。

## Primary Actors

- 宿主 AI：通过 MCP 调用四个公共工具，读取项目知识、项目矩阵和项目内部结构关系。
- 开发者：看到结构化、精简、可追溯的工具结果，并能判断下一步应调用哪个工具。
- AlembicPlugin：负责 MCP schema、handler、output projector、session/intent 状态和宿主适配。
- Alembic resident / Core 能力：提供搜索、知识库、项目结构、源码图/项目结构图、source graph 等底层数据。

## Current Code Facts

以下事实来自当前 AlembicPlugin 代码读取和 source graph fresh 状态下的定向检查。

### 已有成熟能力，应该保留

| 能力 | 当前位置 | 保留理由 | 重构方式 |
| --- | --- | --- | --- |
| `HostIntentFrame` | `AlembicPlugin/lib/service/task/HostIntentFrame.ts` | 已能归一化 query、hostDeclaredIntent、hostTurnMeta，hash thread/session/conversation id，识别 raw automation envelope。 | 保留为 `InteractionStateProvider` 的输入归一化核心；命名和文案改成宿主中立。 |
| `IntentExtractor` | `AlembicPlugin/lib/service/task/IntentExtractor.ts` | 纯函数提取多查询、语言、模块、scenario，并支持中英文同义词扩展。 | 保留为 query expansion provider，供 `prime/search/matrix` 共用。 |
| `TaskLifecyclePolicy` | `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts` | 能区分 code-change、read-only、design、status、automation，并决定 prime/task anchor/guard 需求。 | 保留判定逻辑，移除平台绑定命名，作为 interaction status 的依据。 |
| `ctx.session.intent` | `AlembicPlugin/lib/runtime/mcp/handlers/types.ts`、`McpServer.ts` | 已维护 phase、primeQuery、activeFile、language、module、scenario、taskId、taskTitle、toolCalls、searchQueries、mentionedFiles、driftEvents。 | 作为当前交互状态唯一 session 真源。 |
| `INTENT_RECORDS` / `WORK_RECORDS` | `agent-public-tools.ts` | 已有 intentRef/workRef 本地记录和容量限制。 | 从 handler 局部 Map 抽成 internal store/provider，四工具只读。 |
| `PrimeSearchPipeline` | `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts` | 已支持多查询并行、semantic/keyword/auto 融合、resident search、RRF、质量过滤、searchMeta。 | 下沉为 `KnowledgeRetrievalProvider`，不再只被 `primeHandler` 私有拼接。 |
| `PrimeKnowledgeMaterial` | `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts` | 已生成 acceptedKnowledge、acceptedGuards、trust receipt、nextActions 和可信边界。 | 保留为 prime package material provider，输出文案改宿主中立。 |
| `search` handler 检索链 | `AlembicPlugin/lib/runtime/mcp/handlers/search.ts` | 已支持 resident search、fallback search、kind filter、slimSearchResult、byKind、searchMeta。 | 下沉为 search provider，并扩展 `get/expand`。 |
| `structure` 结构读取 | `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts` | 已有 targets、files、metadata、语言统计、依赖等项目结构信息。 | 下沉为 `ProjectStructureProvider`；默认不返回文件全文。 |
| source graph / call graph 关系能力 | source graph 工具、`structure.ts` 中 call context 相关逻辑 | 能表达文件、符号、调用、依赖、影响范围等项目内部关系。 | 下沉为 `ProjectGraphProvider`，作为新 `alembic_graph` 的主要数据来源。 |
| clean / public output 契约 | `output-contract.ts`、`public-tools/contract.ts`、`public-tools/output.ts` | 已有结构化 status/reason/refs/detailRefs 思路。 | 作为 `KnowledgeContextToolOutput` 的基础，而不是继续各工具返回老 `data`。 |

### 应剪枝或迁移的旧公共语义

| 当前入口/逻辑 | 问题 | 处理建议 |
| --- | --- | --- |
| `alembic_knowledge` 公共入口 | 同时承担 list/get/insights/confirm_usage，读取、质量分析、使用反馈混在一起。 | 公共读取 list/get 并入 `alembic_search operation=get/expand`；`insights` 和 `confirm_usage` 不包含在本需求中，暂时不考虑。 |
| `alembic_structure` 公共入口 | 只表达 target/files/metadata，和项目矩阵目标重叠；`includeContent` 容易把长源码塞进默认工具。 | 从 tools/list 默认公共面删除，代码能力下沉为 `ProjectStructureProvider`。 |
| `alembic_panorama` 公共入口 | overview/module/gaps/health 与 governance/decay/staging 混在一起；`staging_check` 有状态迁移风险。 | overview/module/health 的结构摘要能力下沉为 project matrix provider；gaps 不作为知识覆盖能力迁入；governance/decay/staging/enhancement 从项目地图语义中删除或迁专门维护工具。 |
| `alembic_call_context` 公共入口 | 调用链与关系查询重叠，且不属于四工具默认知识面。 | 能力下沉到 `ProjectGraphProvider` 或交给 source graph 工具，不作为知识四工具外的独立公共入口。 |
| 当前 `alembic_graph` 的 Recipe / `knowledge_edges` 依赖 | 当前默认 `nodeType=recipe`，并依赖知识库关系表或 Recipe `relations` fallback。 | 不作为新 `alembic_graph` 的公共语义保留；Recipe/知识条目关系归 `alembic_search` 的详情和 `alembic_prime` 的上下文选择，不进入项目内部结构图。 |
| 老 `envelope({ success, data, meta })` | 四工具输出结构不统一，status/reason/detailRefs/freshness 不稳定。 | 四工具统一走 `KnowledgeContextToolOutput` 和 MCP `structuredContent`。 |
| `agentHost` 单一平台默认值 | 公共 schema 暴露单一平台字样，不符合双平台通用目标。 | 保留字段含义“宿主代理”，但移除具体平台枚举和默认；使用 `generic-host-agent` / `desktop-host-agent` / `terminal-host-agent` 等宿主中立 profile。 |

旧 `alembic_knowledge` 中的两个非读取操作说明。它们不包含在本需求中，暂时不考虑迁移、保留或替代：

- `insights`：针对某个知识条目做质量分析和改进建议，调用时需要 `id`。它不是普通读取，也不进入四工具公共面。
- `confirm_usage`：记录某个知识条目确实被采用或应用，调用时需要 `id`，并可带 `usageType`、`feedback`。它属于使用反馈/生命周期数据，不进入四工具公共面。

## Proposed Behavior

### 四个公共工具的职责

| 工具 | 一句话职责 | 默认操作 | 不能承担 |
| --- | --- | --- | --- |
| `alembic_project_matrix` | 给宿主 AI 一个层级明确、预算受控的项目地图、项目结构摘要和知识库分类摘要。 | `overview` | 不返回全量源码、全量文件、全量知识、知识覆盖评估、生命周期状态迁移。 |
| `alembic_prime` | 基于当前 intent/task，为宿主 AI 装配可立即使用的紧凑知识上下文。 | `auto` | 不创建 work，不验收，不执行 Guard，不直接改知识库。 |
| `alembic_search` | 统一知识检索、条目详情读取和预算化上下文展开。 | `search` | 不建项目全景，不做路径/影响关系推理，不做 usage/lifecycle 写入。 |
| `alembic_graph` | 查询项目内部结构节点之间的包含、依赖、调用、路径和影响范围。 | `query` | 不查询 Recipe/知识条目关系，不依赖知识库，不做项目总览，不返回长正文，不触发状态迁移。 |

### 内部支撑层

`ProjectKnowledgeContextLayer` 是 AlembicPlugin 内部 application service，不是新的 MCP 工具。四个公共 MCP handler 只负责解析操作和调用该层。

```text
MCP tools/list
  ├─ alembic_project_matrix
  ├─ alembic_prime
  ├─ alembic_search
  └─ alembic_graph
        │
        ▼
ProjectKnowledgeContextLayer
  ├─ KnowledgeContextInputNormalizer
  ├─ InteractionStateProvider
  ├─ ProjectIdentityProvider
  ├─ ProjectStructureProvider
  ├─ ProjectMatrixProvider
  ├─ KnowledgeRetrievalProvider
  ├─ ProjectGraphProvider
  ├─ SourceEvidenceProvider
  ├─ DocumentContextProvider
  ├─ FreshnessProvider
  ├─ RefRegistry
  ├─ ContextBudgeter
  └─ KnowledgeContextOutputProjector
```

内部能力建议：

| 内部能力 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| `resolveInteractionState` | base input、ctx.session、intentRef、workRef | `interaction` | 复用现有 intent/session/work，禁止另建当前任务真源。 |
| `resolveProjectMatrix` | interaction、scope、include、budget | matrix、knowledgeCatalogSummary、structureSummary、nodeRefs | 汇总 structure、panorama 只读、docs、source graph 摘要；只做知识库分类摘要，不做知识覆盖。 |
| `resolveKnowledgeRetrieval` | query/refId、interaction、matrix | items/detail/expandedContext | 复用 PrimeSearchPipeline/search/resident search，支持 `search/get/expand`。 |
| `resolveRecipeCandidates` | query、keywords、kind/category、language、sourceRefs、interaction | candidatePool、rankedItems、recipeRelationChains、scoreBreakdown | 先广召回，再按 Recipe 关系扩展候选池，最后复用向量/混合检索和多信号排序选出最佳候选。 |
| `resolveProjectGraph` | node/ref、relation、depth、matrix | relations/path/impact/stats | 复用 source graph、项目依赖图、调用图、结构 provider；不依赖 Recipe 知识库。 |
| `projectOutput` | tool、operation、context | structured output | 统一 status、summary、interaction、detailRefs、sources、nextActions。 |

### 行业基线到 Alembic 的落地映射

外部最佳实践对本需求的启发不能直接照搬为新工具，而应下沉为 `ProjectKnowledgeContextLayer` 的内部检索与项目地图能力：

| 外部基线 | 可借鉴点 | Alembic 落地方式 | 不照搬的部分 |
| --- | --- | --- | --- |
| MCP Tools 规范 | tool 需要唯一名称、description、input schema、annotations，模型依赖这些信息选择工具。 | 四工具的 schema description、selectionHint、nonGoal、structuredContent、annotations 必须与职责一致。 | 不把长说明塞进可见文本，也不靠 README 弥补错误 schema。 |
| Anthropic Contextual Retrieval | 将 chunk/条目带上上下文后，用 BM25/keyword、embedding 和 reranking 共同降低检索失败。 | Recipe 候选池使用 keywords/kind/category/sourceRefs 广召回，再用 vector/hybrid 和多信号重排；whyMatched 解释上下文来源。 | 不把向量分作为唯一排序真相。 |
| GraphRAG | 利用实体/关系/社区摘要支撑私有知识库的全局理解。 | Recipe relation chain 只作为 search/prime 的解释证据；project matrix 可借鉴“社区/层级摘要”思想生成知识库分类摘要。 | 不把 `alembic_graph` 改成知识图，也不新增公共 Recipe graph 工具。 |
| RAPTOR | 递归聚类/摘要形成层级检索，帮助跨长文档或大语料的整体理解。 | project matrix 和 knowledge catalog 可维护多层摘要：workspace/project/module/category/Recipe cluster；默认返回摘要，detailRefs 展开。 | 不默认重写知识库全文，也不在工具调用时做昂贵递归生成。 |
| Aider repo map | 用紧凑 repo map 呈现关键文件、符号和关系，按 token 预算截断。 | `alembic_project_matrix` 默认输出预算受控的项目地图、关键节点、结构热点和 detailRefs。 | 不把完整源码或完整文件列表塞进 matrix。 |
| Sourcegraph/Cody code context | 代码问答需要语义、关键词、结构搜索和代码图上下文共同参与。 | `alembic_graph` 负责项目内部结构关系；`alembic_search` 负责知识/Recipe；`alembic_prime` 按任务组合两者。 | 不让一个工具同时承担所有检索语义。 |

### 支撑层总体优化方案

`ProjectKnowledgeContextLayer` 应按“索引层、证据层、检索编排层、工具投影层”重构，而不是只把旧 handler 包一层：

```text
ProjectKnowledgeContextLayer
  ├─ ContextIndexSnapshot
  │   ├─ ProjectMapIndex
  │   ├─ KnowledgeCatalogIndex
  │   ├─ RecipeRelationIndex
  │   ├─ SourceGraphIndexRef
  │   └─ VectorIndexStatus
  ├─ EvidenceAndFreshness
  │   ├─ source refs / recipe refs / matrix refs
  │   ├─ freshness and degraded reasons
  │   └─ traceable score evidence
  ├─ RetrievalPlanner
  │   ├─ matrix-first
  │   ├─ search-first
  │   ├─ graph-first
  │   └─ prime-orchestrated
  └─ ToolProjection
      ├─ project_matrix view
      ├─ search view
      ├─ prime package
      └─ project_graph view
```

#### 1. ContextIndexSnapshot

ContextIndexSnapshot 是运行时可重建的派生视图，不是新的知识真源。它应汇总以下索引状态：

- `ProjectMapIndex`：workspace/project/package/target/module/file/symbol/source-graph-node 的层级、角色、关键入口、结构热点。
- `KnowledgeCatalogIndex`：Recipe/knowledge 的 kind、category、tags、language、sourceRefs、代表性条目和数量摘要。
- `RecipeRelationIndex`：Recipe `relations` 和 `knowledge_edges` 的轻量邻接表，用于 search/prime 的候选扩展和解释。
- `SourceGraphIndexRef`：source graph freshness、scope、supported languages、symbol/call/dependency availability。
- `VectorIndexStatus`：vector count、dimension、embedProvider/resident availability、hybrid search availability、last build/update 状态。

约束：

- 不复制完整源码、完整 Recipe 正文或完整图边。
- 不把派生摘要作为事实真源；每个摘要必须能回到 detailRef/sourceRef。
- freshness 不一致时按数据域分别标记，例如 project ready、knowledge ready、vector partial、sourceGraph stale。

#### 2. RetrievalPlanner

四工具共享同一套查询编排，但投影不同：

| 查询意图 | 默认路径 | 工具投影 |
| --- | --- | --- |
| 了解项目整体 | matrix-first：ProjectMapIndex + KnowledgeCatalogIndex + SourceGraphIndexRef。 | `alembic_project_matrix` |
| 查某类 Recipe/规则/模式 | search-first：Recipe candidate retrieval + vector/hybrid rerank + relation chain explanation。 | `alembic_search` |
| 当前任务要开始工作 | prime-orchestrated：interaction + matrix摘要 + search候选 +必要 graph refs。 | `alembic_prime` |
| 查结构路径/影响范围 | graph-first：ProjectGraphProvider + source graph/project dependency graph。 | `alembic_graph` |

RetrievalPlanner 必须输出 `retrievalTrace`，至少包含：使用了哪些数据域、是否使用向量、候选池规模、最终截断原因、degraded reason、推荐下一步 detailRef。

#### 3. EvidenceAndFreshness

支撑层需要统一证据和新鲜度，不允许四个 handler 各自拼接状态：

- `sources[]` 必须带 `domain=project|knowledge|recipeRelation|vector|sourceGraph|document|runtime`。
- `detailRefs[]` 必须可稳定复现，建议格式包含 domain、id、operation、budget hint 和 freshness stamp。
- `scoreBreakdown` 与 `whyMatched` 只能作为解释，不作为成功证明。
- source graph stale 不影响 Recipe search 的基础可用性；vector degraded 不影响 keyword/relationship fallback；knowledge degraded 不影响 project graph。

#### 4. Budgeted Projection

所有工具默认“摘要优先，引用展开”：

- `summary` 给人读的一句话或一小段。
- `structuredContent.result` 返回机器可解析摘要、items、relations、inventory。
- 长正文、完整关系链、完整源码、完整图边必须通过 `detailRefs` 或 `expand` 获取。
- `budget` 同时控制条目数量、正文片段长度、关系链 hops、matrix 节点数量和 nextActions 数量。

### 统一输入

四个工具共享 `KnowledgeContextBaseInput`，再扩展工具专属字段。

| 字段 | 语义 | 设计决定 |
| --- | --- | --- |
| `agentHost` | 宿主代理 profile | 保留含义，删除单一平台值和默认；使用宿主中立枚举。 |
| `projectRoot` | 目标项目根 | 必须进入 ProjectIdentityProvider 校验。 |
| `inputSource` | 输入来源 | 复用现有 `user-message`、`host-declared-intent`、`tool-result`、`source-ref`、`automation-envelope` 等。 |
| `intentKind` | 当前意图类型 | 复用现有分类，支持 read-only/design/status/code-change。 |
| `query` | 语义查询 | 四工具统一字段；`userQuery` 不作为新公共主字段。 |
| `activeFile` / `language` | 当前文件/语言线索 | 进入 IntentExtractor 和 matrix/search 过滤。 |
| `hostDeclaredIntent` / `hostTurnMeta` | 宿主结构化意图和回合元数据 | 进入 HostIntentFrame；原始 id 不外显。 |
| `sourceRefs` / `sourceGraphRef` / `sourceEvidenceRefs` | 引用型证据 | 不传长正文，只做 detail refs 和 freshness 依据。 |
| `intentRef` / `primeRef` / `workRef` | 当前交互引用 | 只读消费，不由 matrix/search/graph 创建或结束。 |
| `scope` / `include` / `filters` | 范围、信息族、过滤 | 四工具共用，避免每个工具自定义一套过滤语义。 |
| `detailLevel` / `budget` / `freshnessPolicy` | 详情级别、预算、新鲜度策略 | 默认 `summary`、小预算、`preferFresh`。 |

工具专属字段：

| 工具 | 专属字段 |
| --- | --- |
| `alembic_project_matrix` | `operation=overview/node/relations/layers/sources/catalog`、`nodeId`、`nodeType`。 |
| `alembic_prime` | `operation=auto/matrix-first/search-first`、`recognizedIntent`、`primeMode`。 |
| `alembic_search` | `operation=search/get/expand`、`mode=auto/keyword/semantic/context`、`refId`、`kind`。 |
| `alembic_graph` | `operation=query/impact/path/stats/neighborhood`、`fromId`、`toId`、`direction`、`relationType`、`maxDepth`；`nodeType` 仅允许项目内部结构节点。 |

### MCP 描述与 Skill 使用说明

四工具能否被正确使用，不只取决于 handler 是否实现。MCP `tools/list` 返回的 tool name、description、input schema、annotations，以及项目 skill 的触发规则和推荐流程，都会直接影响宿主 AI 选哪个工具、用什么参数、如何解释返回结果。因此实现窗口必须同步改以下入口：

- MCP tool description：每个工具必须有短标题、一句话职责、选择提示、非目标、核心 operation、必填字段、默认预算、detail refs 读取方式和 degraded/partial 语义。
- MCP input schema description：共享字段和专属字段都要有宿主可理解的字段说明，尤其是 `operation`、`query`、`refId`、`nodeId`、`fromId`、`toId`、`budget`、`detailLevel`、`freshnessPolicy`。
- MCP annotations/catalog：四个工具默认只读；不得把 `alembic_project_matrix`、`alembic_graph` 标成会触发状态迁移、治理或重扫的工具。
- structured output summary：`content` 只能给短摘要，真实可解析内容在 `structuredContent`；description 与 README 不能鼓励解析可见文本。
- `nextActions`：只能推荐四工具之间的职责内跳转，例如 matrix detail ref -> search get/expand，graph node -> graph neighborhood/path，prime -> search/graph detail；不得继续推荐旧 `alembic_structure`、`alembic_panorama` 或 `alembic_knowledge`。
- Skills/README：宿主代理的使用说明必须从旧“structure/knowledge/Recipe graph”流程改为四工具流程；仍存在于包结构中的相关 Skill 必须重写内容，不能继续推荐旧公共工具或把 `alembic_graph` 解释成 Recipe graph。

建议四工具在 MCP 描述和 Skill 中保持同一张选择表：

| 工具 | 什么时候用 | 关键输入 | 不应推荐的用法 |
| --- | --- | --- | --- |
| `alembic_graph` | 需要项目内部结构关系、调用/依赖路径、影响范围、邻域或结构统计。 | `operation`、`nodeId/fromId/toId`、`relationType`、`maxDepth`、`projectRoot`。 | 不查 Recipe/知识条目关系，不回答知识覆盖，不返回长文本知识详情。 |
| `alembic_search` | 需要搜索知识、按 ref/id 读取详情或按预算展开上下文。 | `operation=search/get/expand`、`query/refId`、`kind`、`budget`。 | 不做项目地图，不做图路径推理，不记录 usage/lifecycle。 |
| `alembic_prime` | 当前任务已经有 intent 或用户语义，需要装配一份紧凑任务上下文。 | `intentRef` 或 `query/hostDeclaredIntent`、`primeMode`、`projectRoot`。 | 不创建 work，不验收，不替代 Guard，不返回全量知识库。 |
| `alembic_project_matrix` | 需要一屏理解项目地图、层级结构、知识库分类摘要、结构热点和下一步 detail refs。 | `operation=overview/node/relations/layers/sources/catalog`、`nodeId`、`detailLevel`、`budget`。 | 不做知识覆盖评估，不输出完整源码/Recipe/图边，不触发状态迁移。 |

Skill 同步要求：

- `alembic` 主技能的知识回合流程应从“intent -> prime -> search/knowledge/structure”改为“intent -> prime；按需要调用 project_matrix/search/graph”。
- 结构类 skill 应从 “project structure + Recipe graph” 改为 “project matrix + project internal graph”；不再把 `alembic_graph` 解释为 Recipe graph。
- recipes/knowledge 类 skill 应把浏览和详情读取改成 `alembic_search(operation=search/get/expand)`；不得再推荐 `alembic_knowledge(operation=list/get/confirm_usage)`。
- guard/create 等关联 skill 若仍引用 `alembic_structure`、`alembic_knowledge` 或 Recipe graph，也要同步改为四工具或明确删除该流程。
- 插件包内双宿主技能副本都要同步：`skills/` 与 `plugins/*/skills/`。本需求文档保持中文；实现时不要新建额外英文开发者阅读文档，已有包内说明如需保留多语言，应保持语义等价。

### Recipe 候选池、关系链与向量重排

Recipe 查找应成为 `KnowledgeRetrievalProvider` 的核心能力，而不是停留在“搜索列表”。目标是：宿主 AI 提供关键词、种类、类别、语言、当前文件或任务语义后，后台先获得足够大的候选池，再用 Recipe 关系链、向量相似度和关键内容信号缩小到最合适的少量结果。

这条能力只服务 `alembic_search` 和 `alembic_prime`：

- `alembic_search(operation=search)` 返回候选项、匹配原因、scoreBreakdown、可选 `recipeRelationChains` 摘要和 detailRefs。
- `alembic_search(operation=get/expand)` 根据 detailRefs 展开 Recipe 详情、关系链上下文和证据，不默认返回全量长正文。
- `alembic_prime` 复用同一候选池和重排结果，把最适合当前任务的 Recipe 纳入 prime package/trust receipt。
- `alembic_graph` 不消费 Recipe 关系链作为公共图语义；它仍只负责项目内部结构图。

推荐内部流水线：

| 阶段 | 输入 | 处理 | 输出 |
| --- | --- | --- | --- |
| 1. Intent normalization | `query`、`keywords`、`kind`、`category`、`language`、`activeFile`、`sourceRefs`、`hostDeclaredIntent` | 复用 `HostIntentFrame`、`IntentExtractor`、`TaskLifecyclePolicy`，生成 normalized query、keyword queries、kind/category hints、上下文标签。 | `RecipeRetrievalRequest` |
| 2. Broad recall | normalized query、keyword queries、kind/category hints | 并行召回 title/summary/tags/category/kind/usageGuide/code snippet/sourceRef/module 相关 Recipe；kind 可作为强过滤或强加权，category/tags 默认先加权，避免早期误杀。 | `seedCandidates` |
| 3. Relation expansion | `seedCandidates` | 读取 Recipe `relations` 字段和 `knowledge_edges`，按 `prerequisite`、`extends`、`related`、`solves`、`enforces`、`references`、`alternative`、`conflicts` 等关系做 depth 1-2 的有限扩展；强关系加权高，弱关系加权低，限制 fanout。 | `expandedCandidates`、`recipeRelationChains` |
| 4. Vector/hybrid retrieval | query、candidate ids、候选文本片段 | 优先复用现有 `SearchEngine`、`VectorService`、`HybridRetriever`、resident semantic search、HNSW/vector index；向量不可用时明确 degraded/fallback，不重新实现 embedding executor。 | `vectorScores`、`residentVector`、fallback reason |
| 5. Multi-signal rerank | expanded candidates、vectorScores、关系链、上下文 | 复用/下沉 `PrimeSearchPipeline`、`FieldWeightedScorer`、`CoarseRanker`、`MultiSignalRanker`、RRF、contextBoost；组合关键词、标题/摘要、kind/category/tag、语言/模块、关系链、向量、质量/新鲜度/使用热度。 | `rankedCandidates` |
| 6. Diversity and budget | ranked candidates、budget/detailLevel | 去重、同主题多样性控制、按预算截断；默认返回 3-7 个最佳候选，长正文只放 detailRefs。 | `items`、`detailRefs`、`truncated` |

建议输出结构：

```text
result.recipeCandidates[]
  ├─ id/title/kind/category/language/summary
  ├─ score
  ├─ scoreBreakdown
  │   ├─ keywordScore
  │   ├─ vectorScore
  │   ├─ kindCategoryScore
  │   ├─ relationScore
  │   ├─ contextScore
  │   └─ qualityFreshnessScore
  ├─ whyMatched[]
  ├─ relationChains[]
  │   ├─ seedRecipeRef
  │   ├─ hops[{ fromRef, relation, toRef, weight, reason }]
  │   ├─ chainScore
  │   └─ confidence
  ├─ sourceRefs[]
  └─ detailRef
```

设计约束：

- 候选池要大于最终输出，例如先召回 30-100 个候选，再缩到默认 3-7 个；具体数值由 `budget` 和项目规模决定。
- 关系链是“为什么这个 Recipe 可能有用”的解释证据，不是必须服从的规则；Guard 约束仍由 Guard/Recipe kind 决定。
- `conflicts`、`deprecated_by`、`alternative` 等关系不能当成正向增强；它们应降低置信度或作为风险提示。
- 向量检索是关键排序信号，但不能单独决定结果；精确关键词、kind/category、关系链和当前任务上下文必须参与重排。
- vector/resident 不可用时，搜索仍返回 keyword/weighted/relationship 结果，但 `status` 应为 `partial` 或 `degraded`，并在 `diagnostics` 与 `sources` 中说明。
- `recipeRelationChains` 不进入 `alembic_graph` 公共输出；如果用户想看完整 Recipe 关系详情，应通过 `alembic_search(get/expand)` 的 detailRef 展开。

### 统一输出

四工具都返回 `KnowledgeContextToolOutput`，并通过 MCP `structuredContent` 暴露结构化结果；`content` 只保留一段短摘要。

| 字段 | 语义 |
| --- | --- |
| `ok` | 业务是否成功。 |
| `status` | `ready` / `partial` / `degraded` / `blocked` / `failed`。 |
| `tool` / `operation` | 当前工具和操作。 |
| `summary` | 一句话摘要。 |
| `request` | 规范化后的输入摘要，隐藏敏感元数据。 |
| `project` | 项目身份、数据根摘要、语言/技术栈、新鲜度。 |
| `interaction` | 当前开发者与宿主 AI 的交互状态摘要。 |
| `result` | 工具专属主体结果。 |
| `inventory` | 知识库分类摘要、项目结构摘要、源码图/文档可用性摘要；不是知识覆盖评估。 |
| `relations` | 项目内部结构关键关系或关系统计。 |
| `items` | 搜索项、节点、知识条目或图节点统一列表。 |
| `detailRefs` | 后续读取入口。 |
| `sources` | 数据来源和 freshness，不放长正文。 |
| `diagnostics` | compressed degraded/blocked 原因。 |
| `nextActions` | 建议下一步工具调用。 |
| `meta` | contractVersion、responseTimeMs、budgetUsed、truncated。 |

`interaction` 必须统一：

| 字段 | 来源 |
| --- | --- |
| `phase` | `ctx.session.intent.phase` |
| `intentRef` | `INTENT_RECORDS` 或本次请求 |
| `primeRef` | prime package 或本次请求 |
| `workRef` | `WORK_RECORDS` 或 `ctx.session.intent.taskId` |
| `currentTask` | `ctx.session.intent.taskId/taskTitle` 和 work record scope files |
| `recognizedIntent` | `HostIntentFrame.recognizedIntentDraft` |
| `toolPlan` | `TaskLifecyclePolicy` 与 intent tool plan |
| `session` | toolCallCount、toolsUsed、lastActivityAt、searchQueries 摘要 |
| `status` | intent、project scope、knowledge/source graph freshness 综合判断 |

禁止规则：

- `interaction.currentTask` 不能由 `project_matrix`、`search`、`graph` 临时推断。
- 四工具不能默认返回完整源码、完整 Recipe、完整文件列表或完整图边。
- `sources` 必须区分知识库事实、源码图事实、文档事实、运行时状态和推断建议；其中 `alembic_graph` 的 sources 不能使用 Recipe/knowledge graph 作为必要数据源，`alembic_project_matrix` 不能把知识库分类摘要推断成模块覆盖结论。
- 如果 source graph stale/partial，结果只能是 `partial/degraded`，不能伪造 ready。

## Implementation Decisions

### 推荐模块形态

实现窗口应在 AlembicPlugin 中新开一个统一实现目录，把本规划下保留的成熟能力和新计划实现的能力集中到同一个层级分工里。推荐目录名：

```text
lib/service/project-knowledge-context/
├── contracts/
│   ├── KnowledgeContextBaseInput.ts
│   ├── KnowledgeContextToolOutput.ts
│   ├── KnowledgeContextRefs.ts
│   ├── KnowledgeContextStatus.ts
│   └── index.ts
├── layer/
│   ├── ProjectKnowledgeContextLayer.ts
│   ├── KnowledgeContextInputNormalizer.ts
│   ├── ContextIndexSnapshot.ts
│   ├── RetrievalPlanner.ts
│   ├── KnowledgeContextOutputProjector.ts
│   └── index.ts
├── interaction/
│   ├── InteractionStateProvider.ts
│   ├── IntentRecordStore.ts
│   ├── WorkRecordStore.ts
│   └── index.ts
├── project/
│   ├── ProjectIdentityProvider.ts
│   ├── ProjectStructureProvider.ts
│   ├── ProjectMatrixProvider.ts
│   ├── ProjectGraphProvider.ts
│   └── index.ts
├── retrieval/
│   ├── KnowledgeRetrievalProvider.ts
│   ├── SearchProvider.ts
│   ├── RecipeCandidateProvider.ts
│   ├── RecipeRelationChainProvider.ts
│   ├── VectorRerankProvider.ts
│   ├── KnowledgeDetailProvider.ts
│   ├── ContextExpansionProvider.ts
│   └── index.ts
├── evidence/
│   ├── FreshnessProvider.ts
│   ├── SourceEvidenceProvider.ts
│   ├── DocumentContextProvider.ts
│   ├── EvidenceLinkProvider.ts
│   └── index.ts
└── support/
    ├── RefRegistry.ts
    ├── ContextBudgeter.ts
    ├── ResultRanker.ts
    ├── ContextCache.ts
    ├── ScoreTrace.ts
    └── index.ts
```

这个目录不是薄门面，也不是只做最小闭环的适配层。它应成为四个 MCP 工具的真实业务实现边界：成熟逻辑迁入、抽象为提供者或适配器后统一调用；新能力也在同一目录中按契约层、支撑层、交互状态层、项目信息层、检索层、证据层、通用支撑层分层实现。

MCP handler 层只保留协议编排、schema parse、tool name 到 layer operation 的转发：

```text
lib/runtime/mcp/handlers/project-matrix.ts
lib/runtime/mcp/handlers/search.ts
lib/runtime/mcp/handlers/graph.ts
lib/runtime/mcp/handlers/agent-public-tools.ts
```

其中 `agent-public-tools.ts` 的 `primeHandler` 应改成调用支撑层，而不是继续自己拼接 prime package。旧 `search/structure/panorama/graph` handler 中可保留的成熟逻辑需要迁入 `project-knowledge-context` 对应 provider；旧 handler 不应继续作为业务真源。

实现原则：

- 完整功能优先：保留 intent、prime、search、resident search、项目结构、source graph、project graph、输出契约等成熟能力，不做空壳接口。
- 统一层级优先：同类输入、状态、引用、freshness、budget、输出都在统一目录中定义，不分散到四个 handler 自行维护。
- 迁移而不是旁路：旧 handler 的成熟逻辑应被提取、移动或适配到新目录，不能在新目录里只写一层透传旧 handler 的薄包装。
- 新能力同源实现：`alembic_project_matrix`、`alembic_search get/expand`、项目内部 `alembic_graph` 和 prime 收敛都基于同一个支撑层实现。
- 旧入口可短期存在但不能掌握业务逻辑；如果需要临时 retired/blocked 提示，也应调用统一输出契约。

### 保留、剪枝、下沉清单

| 分类 | 对象 | 处理 |
| --- | --- | --- |
| 保留 | `HostIntentFrame`、`IntentExtractor`、`TaskLifecyclePolicy` | 作为 interaction core，移除平台绑定文案。 |
| 保留 | `ctx.session.intent` | 当前交互状态真源。 |
| 保留但移动 | `INTENT_RECORDS`、`WORK_RECORDS` | 从 handler 私有 Map 抽到 provider/store，便于四工具只读。 |
| 保留但下沉 | `PrimeSearchPipeline` | 成为 retrieval provider，不由 prime 独占。 |
| 保留但投影 | `PrimeKnowledgeMaterial` | 继续提供 trust receipt/accepted knowledge，输出宿主中立。 |
| 保留但迁入新目录 | search handler 的 resident/fallback/slim/byKind 逻辑 | 成为 `retrieval/SearchProvider` 和 `KnowledgeRetrievalProvider.search`，旧 handler 不再掌握搜索业务。 |
| 保留并强化 | `SearchEngine`、`VectorService`、`HybridRetriever`、`MultiSignalRanker`、resident semantic search | 成为 `RecipeCandidateProvider` 和 `VectorRerankProvider` 的成熟检索/重排能力来源，不另造向量工程。 |
| 下沉为检索证据 | Recipe `relations` 与 `knowledge_edges` | 成为 `RecipeRelationChainProvider` 的候选扩展和解释证据；不作为 `alembic_graph` 公共图语义。 |
| 扩展 | `alembic_search` | 新增 `operation=get/expand`，承接公共知识读取。 |
| 保留但迁入新目录 | `structure` targets/files/metadata | 成为 `project/ProjectStructureProvider`；默认只摘要。 |
| 保留但迁入新目录 | panorama overview/module/health | 成为 `project/ProjectMatrixProvider` 输入，不保留状态变更语义，不迁入知识覆盖 gaps。 |
| 替换 | 当前 Recipe/`knowledge_edges` 驱动的 `alembic_graph` | 新 `alembic_graph` 改为项目内部结构图；旧 Recipe 关系能力不迁入公共 graph。 |
| 删除公共暴露 | `alembic_structure` | 从 tools/list、schema map、catalog、nextActions、文档推荐中移除。 |
| 删除公共暴露 | `alembic_panorama` | 从默认公共面删除；治理操作不进入 project matrix。 |
| 删除或降级 | `alembic_knowledge` | 公共读取 list/get 并入 search；`insights`、`confirm_usage` 等非读取操作不进入本需求。 |
| 下沉或移除公共暴露 | `alembic_call_context` | 关系能力进入 graph/source graph provider。 |
| 删除公共输出 | 单一平台 value/default | public schema/output 改宿主中立。 |
| 替换 | 老 `success/data/meta` 四工具输出 | 统一 structured `KnowledgeContextToolOutput`。 |

### 旧工具清理范围

实现窗口需要至少扫描并处理这些位置：

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/tools.ts`
- `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/panorama.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/core-tools/output.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/output.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/descriptions.ts`
- `AlembicPlugin/lib/runtime/mcp/host/guidance.ts`
- `AlembicPlugin/skills/*/SKILL.md`
- `AlembicPlugin/plugins/*/skills/*/SKILL.md`
- `AlembicPlugin/README*.md`、`AlembicPlugin/plugins/*/README*.md`
- 相关 test、snapshot、plugin tool surface fixtures、project skill templates、nextActions 文案

不保留“旧工具可调用但文档不推荐”的兼容层。若实现窗口发现真实消费者，必须记录消费者位置、修复方案和验证证据；真实消费者是迁移/修复对象，不是保留旧工具的理由。

当前代码事实提示的高风险旧说明包括：

- `public-tools/descriptions.ts` 当前只覆盖 agent public tool 描述，需要补齐四工具 description/selectionHint/nonGoal 或改造成共享描述来源。
- `PluginToolSurfaceCatalog.ts` 当前 tool annotations 仍有平台化/旧命名项；四工具必须有只读 annotations 和宿主中立标题。
- `skills/alembic-structure/SKILL.md` 与插件包内同名 skill 仍把 `alembic_graph` 描述成 Recipe graph，需要改为项目内部结构图。
- `skills/alembic-recipes/SKILL.md` 与插件包内 recipes skill 仍出现 `alembic_knowledge list/get/confirm_usage`，需要改为 `alembic_search search/get/expand`，且不再推荐 `confirm_usage`。
- 各宿主插件包内主 Alembic Skill 的知识回合流程仍推荐 `alembic_knowledge`、`alembic_structure` 时，需要改为四工具选择流程，并去除面向单一平台的表达。

## Migration Plan

### P0：代码事实与消费者扫描

- 列出当前 tools/list 暴露工具、schema map、router、catalog、output projector、nextActions、skill guidance 中所有 `alembic_knowledge`、`alembic_structure`、`alembic_panorama`、`alembic_call_context` 引用。
- 确认 tests/fixtures/snapshots 是否依赖旧工具。
- 确认单一平台字样是否在四工具公共 schema/output/description 中出现。

### P1：契约先行

- 在 `lib/service/project-knowledge-context/contracts/` 新增 `KnowledgeContextBaseInput` 和四工具 extension schema。
- 在 `contracts/` 新增 `KnowledgeContextToolOutput` schema。
- 在 `contracts/` 新增 reason/status/detailRefs/source/freshness 枚举。
- 明确 `agentHost` 的宿主中立枚举，不再默认某个具体宿主。

### P2：支撑层落地

- 新建 `lib/service/project-knowledge-context/`，把支撑层、contracts、providers、evidence、support 都放入该目录。
- 抽出 `layer/ContextIndexSnapshot`，把 project map、knowledge catalog、Recipe relation、source graph、vector status 做成可重建派生视图，不作为事实真源。
- 抽出 `layer/RetrievalPlanner`，根据 intent 选择 matrix-first、search-first、graph-first、prime-orchestrated 路径，并输出 retrievalTrace。
- 抽出 `interaction/InteractionStateProvider`，复用 `HostIntentFrame`、`IntentExtractor`、`TaskLifecyclePolicy`、`ctx.session.intent`、intent/work records。
- 抽出 `retrieval/KnowledgeRetrievalProvider`，迁入并复用 `PrimeSearchPipeline` 和 search handler 成熟逻辑。
- 抽出 `retrieval/RecipeCandidateProvider`，实现 broad recall、kind/category/tag 加权、Recipe relations 候选扩展、去重和候选池预算。
- 抽出 `retrieval/RecipeRelationChainProvider`，复用 Recipe `relations` 和 `knowledge_edges`，生成 depth/fanout 受控的 `recipeRelationChains`。
- 抽出 `retrieval/VectorRerankProvider`，复用 `SearchEngine`、`VectorService`、`HybridRetriever`、resident semantic search、RRF 和 `MultiSignalRanker`，不另建 embedding executor。
- 抽出 `project/ProjectStructureProvider`、`project/ProjectMatrixProvider`、`project/ProjectGraphProvider`。
- 抽出 `evidence/FreshnessProvider`、`evidence/SourceEvidenceProvider`、`evidence/DocumentContextProvider`。
- 抽出 `evidence/EvidenceLinkProvider`，统一 source refs、recipe refs、matrix refs 和 graph refs 的稳定 detailRef。
- 抽出 `support/RefRegistry`、`support/ContextBudgeter`、`support/ResultRanker`、`support/ContextCache`、`support/ScoreTrace`。
- 新目录中的 layer/provider 才是四工具业务真源，旧 handler 只做 MCP 协议层入口。

### P3：新增 `alembic_project_matrix`

- 新增 MCP schema、description、handler、catalog、output projector。
- `overview` 默认返回层级摘要、关键节点、项目结构摘要、知识库分类摘要、结构热点、detailRefs。
- `node/relations/layers/sources/catalog` 按预算返回。
- 不触发 `panoramaService.ensureData()` 的隐式重扫或状态变更；数据缺失时返回 `partial/degraded` 和 nextAction。

### P4：改造 `alembic_search`

- 增加 `operation=search/get/expand`。
- `search` 保留现有 resident/fallback 搜索能力。
- `search` 改为 Recipe 候选池流水线：keywords/kind/category/language/sourceRefs 广召回，Recipe relation chain 扩展候选，向量/混合检索和关键内容多信号重排，输出少量最佳候选。
- `get` 承接 `alembic_knowledge get` 的公共读取能力。
- `get/expand` 可展开 `recipeRelationChains`、scoreBreakdown、whyMatched 和必要正文片段；按 budget 返回，不返回无限长正文。
- `insights/confirm_usage` 不进入公共 search。

### P5：改造 `alembic_graph`

- nodeType 只允许项目内部结构节点，例如 `project`、`package`、`target`、`module`、`directory`、`file`、`symbol`、`source-graph-node`。
- relationType 支持项目内部结构关系，例如 `partOf`、`dependsOn`、`imports`、`exports`、`definesSymbol`、`referencesSymbol`、`calls`、`calledBy`、`ownsFile`、`entrypointFor`。
- 不支持 `knowledge` / `recipe` nodeType，不读取 `knowledge_edges`，不使用 Recipe `relations` fallback。
- `coveredByKnowledge`、`hasGap` 这类知识覆盖关系不属于 `alembic_graph`，也不属于 `alembic_project_matrix` 的默认职责；本需求不定义替代工具。
- `call_context` 能力并入 graph 或通过 source graph refs 指向专门 source graph 工具，但仍保持项目内部结构边界。

### P6：收敛 `alembic_prime`

- `primeHandler` 改为调用支撑层的 `resolveInteractionState`、`resolveProjectMatrix`、`resolveKnowledgeRetrieval`、`resolveProjectGraph`。
- 保留 `PrimeSearchPipeline`、`PrimeKnowledgeMaterial` 和 trust receipt。
- prime 的 acceptedKnowledge 选择应复用 Recipe 候选池、关系链和向量重排结果；relation chain 只作为为何选中的解释证据和 context，不自动变成 Guard 约束。
- prime package 输出改为 `KnowledgeContextToolOutput` 派生结构，同时保留紧凑 acceptedKnowledge/acceptedGuards/detailRefs。
- public text 中不出现单平台字样。

### P7：MCP 描述与 Skill 使用说明同步

- 在 `mcp-tools.ts` / tool schema / zod-to-MCP 输出中补齐四工具字段 description，确保宿主 AI 能从 schema 看懂 `operation`、`query/refId/nodeId`、`budget`、`detailLevel`、`freshnessPolicy`。
- 在 `public-tools/descriptions.ts` 或等价共享描述源中定义四工具 title、purpose、selectionHint、nonGoal，并与 README、Skill、nextActions 共用同一职责表。
- 在 `PluginToolSurfaceCatalog.ts` / `tools.ts` / router 中同步四工具只读 annotations、handler owner、knowledge gate、schema 名称和宿主中立标题。
- 更新 `skills/`、`plugins/*/skills/` 中相关 SKILL：主 Alembic flow、recipes/knowledge flow、structure/graph flow、guard/create 中的旧结构引用。
- 删除或重写 Skill 中的旧推荐：`alembic_knowledge list/get/confirm_usage`、`alembic_structure targets/files/metadata`、Recipe graph 版 `alembic_graph`、`alembic_panorama`。
- README 和 project skill template 只保留四工具公共知识读取路径；不要新建英文开发者说明文档，已有多语言包内说明需要语义等价。
- 更新 `nextActions` 生成逻辑，使后续建议只在四工具职责内跳转，不推荐已删除旧工具。

### P8：旧公共入口删除

- 从 tools/list 删除 `alembic_knowledge`、`alembic_structure`、`alembic_panorama` 默认公共入口。
- 从 schema map、catalog、tool-router、output whitelist、descriptions、nextActions、skills/guidance 中删除或内部化。
- `panorama` 的 governance/decay/staging/enhancement 不迁入 project matrix；根据真实需要放到维护/admin 工具，或删除无消费者路径。

### P9：验证与回归

- 增加新目录层级单测，覆盖 contracts、layer、interaction、project、retrieval、evidence、support。
- 针对四工具分别建立 schema parse、handler output、structuredContent、budget、freshness、degraded、detailRefs 稳定性测试。
- 针对旧工具删除建立 tools/list snapshot 回归。
- 针对双平台宿主建立输出不含单一平台字样的 contract test。
- 针对 source graph stale、项目结构缺失、panorama missing、resident unavailable 建立 partial/degraded 测试；`alembic_graph` 不因 Recipe 知识库缺失而 degraded。
- 针对 `alembic_project_matrix` 建立“不输出知识覆盖结论”的回归测试。
- 针对 MCP 描述和 Skill 指南建立文本/fixture 回归：四工具 description、schema description、README、SKILL、nextActions 不再推荐旧公共工具或旧 Recipe graph 语义。
- 针对 Recipe 候选池建立回归：广召回数量大于最终输出、kind/category/tag 既能加权也能过滤、关系链 depth/fanout 受控、`conflicts/deprecated_by/alternative` 不作为正向增强。
- 针对向量工程复用建立回归：vector/resident 可用时返回 vectorScore/residentVector 证据，向量不可用时返回 keyword/weighted/relationship 降级结果并标记 partial/degraded。
- 针对 ContextIndexSnapshot 建立回归：派生摘要可重建、detailRefs 稳定、不同数据域 freshness 可分别 degraded，不复制完整源码/Recipe/图边。
- 针对 RetrievalPlanner 建立回归：同一意图稳定选择 matrix-first/search-first/graph-first/prime-orchestrated 路径，并输出 retrievalTrace。
- 针对 Budgeted Projection 建立回归：同一 budget 下条目数量、正文片段、关系链 hops、matrix 节点和 nextActions 都受控。

## Testing Decisions

实现后验证应覆盖：

- 必须按 `alembic_graph`、`alembic_search`、`alembic_prime`、`alembic_project_matrix` 的顺序依次验证真实 Alembic 空间项目的 MCP 返回内容；前一工具未通过，不进入后一工具。
- `alembic_project_matrix(operation=overview)` 默认不返回完整文件列表、完整源码、完整知识正文、完整图边或知识覆盖结论。
- `alembic_project_matrix(operation=node)` 能通过 nodeRef 找到父子关系、项目结构摘要和来源摘要；不返回知识覆盖判断。
- `alembic_search(operation=search)` 能复用 resident search/fallback/searchMeta，并返回统一 `items/detailRefs/sources`。
- `alembic_search(operation=search)` 能按 keywords/kind/category 先形成候选池，再通过 Recipe relation chain、向量相似度和关键内容加权返回最佳少量候选；结果包含 whyMatched/scoreBreakdown/detailRefs。
- `alembic_search(operation=get)` 能替代 `alembic_knowledge get` 的公共读取用途。
- `alembic_search(operation=expand)` 能按 budget 展开正文片段、关系链和证据，超限时返回 truncated/meta。
- `alembic_graph(operation=path/impact/neighborhood)` 只处理项目内部结构节点，并在 source graph 或项目结构数据缺失时明确 degraded；Recipe 知识库缺失不能影响 graph 可用性。
- `alembic_prime` 返回统一 `interaction`，并且 `interaction.currentTask` 来自 session/work 状态。
- 四工具输出都有同一结构的 `interaction`、`sources`、`detailRefs`、`diagnostics`、`nextActions`。
- MCP `tools/list` 的知识读取/导航公共面只保留四个工具。
- MCP `tools/list` 中四工具的 title/description/annotations/input schema description 必须能正确表达“何时使用、关键参数、非目标、只读性和 detail refs 读取方式”。
- 公共 schema、description、structuredContent 不出现单一平台默认值或平台身份文案。
- 旧工具应从默认公共 MCP 面硬删除，不保留兼容调用入口；若 K0 发现真实消费者，先修复消费者后再删除旧公共工具。
- Skill/README/nextActions 不再推荐 `alembic_knowledge`、`alembic_structure`、`alembic_panorama` 或 Recipe graph 版 `alembic_graph` 作为公共知识读取路径。

建议实现窗口按范围运行：

- `npm run build:check`
- 相关 Vitest 单测和 handler contract tests
- MCP tools/list snapshot 或等价验证
- MCP tool description/schema snapshot 或等价验证
- Skill/README/nextActions 文本引用扫描
- 现有插件 verify 脚本的后续命名应随平台中立需求重命名；在重命名前可作为现有仓库验证入口，但结果文案不得作为新公共语义。

### 强制真实项目验证顺序

这是本需求的完成门槛，不是可选测试建议。实现完成后必须选择 Alembic 空间中的真实项目运行 MCP 工具调用并评估返回内容。验证必须直接使用已建立的 Alembic 空间级知识库，覆盖空间内真实分仓库知识和项目结构；至少覆盖 AlembicPlugin，并建议增加 Alembic 或 AlembicCore 中一个真实分仓库做交叉验证。本验证不包含仓库删除、知识库删除、索引清空或任何破坏性操作。

验证顺序固定如下：

| 顺序 | 工具 | 验证目标 | 通过条件 | 失败后动作 |
| --- | --- | --- | --- | --- |
| 1 | `alembic_graph` | 先证明项目内部结构图准确：package、target、module、file、symbol、source graph node 的包含、依赖、调用、路径、影响范围。 | 返回节点和关系能被真实项目源码、配置或 source graph 证据解释；不依赖 Recipe 知识库；不返回知识条目关系；无大段无关内容。 | 停止验证，回实现修复 graph/provider/schema/output。 |
| 2 | `alembic_search` | 再证明知识检索和详情读取准确：query、get、expand 都能返回相关、可追溯、预算受控的信息。 | top results 与查询意图相关；候选池经过关键词/kind/category、Recipe 关系链、向量/混合检索和多信号重排；whyMatched、scoreBreakdown、relationChains/detailRefs 可解释；摘要不虚构；无明显重复、陈旧、无关或过长结果。 | 停止验证，回实现修复 retrieval、relation chain、vector rerank、detail refs 或 budget。 |
| 3 | `alembic_prime` | 再证明当前任务上下文装配有价值：能利用 intent、search、项目结构关系形成紧凑 prime package。 | `interaction.currentTask` 来自 session/work 状态；selected knowledge 与任务相关；trust receipt 清楚；不塞入无关知识或全量矩阵。 | 停止验证，回实现修复 interaction/prime material/context selection。 |
| 4 | `alembic_project_matrix` | 最后验证集成视图：项目矩阵能汇总项目地图、项目结构摘要、知识库分类摘要、结构热点、refs 和下一步。 | 一屏能判断项目层级、关键模块、知识库分类、项目结构概貌和下一步；默认输出精简；detail refs 可定位；不复制 graph/search/prime 的长内容；不输出知识覆盖结论。 | 停止验收，回实现修复 matrix/provider/output 投影。 |

每一步必须保存：

- MCP 调用输入，包括 `projectRoot`、`operation`、`query/node/ref`、`budget/detailLevel/freshnessPolicy`。
- 原始 MCP structured output。
- 评估结论：`pass` / `fail` / `needs-rework`。
- 准确性评估：返回内容是否能由真实项目源码、配置、知识条目或 source refs 支撑。
- 价值评估：是否能帮助宿主 AI 做下一步判断。
- 精简性评估：是否存在冗余、无关、重复、长正文或职责外内容。
- 问题清单和修复建议。

完整完成定义：

- 四个工具必须按顺序全部通过。
- 任一工具失败，都不能把本需求标记为完成。
- 后一个工具表现良好不能抵消前一个工具的不准确。
- 验证必须基于真实 Alembic 空间项目，不接受 mock、空库、静态 fixture 或只跑 schema 单测作为最终完成证据。
- 验证必须读取真实 Alembic 空间级知识库，不用临时空库或模拟知识库替代。
- 验证过程不得执行仓库删除、知识库删除、索引清空或破坏性重置。
- 自动化测试可以作为辅助证据，但最终完成需要真实 MCP 调用输出和人工质量评估。
- 需要 Test 窗口对真实 MCP 调用结果做复验，Controller 再做最终接受判断。

## Acceptance Criteria

- 四个公共 MCP 工具能完整覆盖项目地图、任务上下文装配、知识检索、语义关系四类核心场景。
- 四个公共 MCP 工具在 `tools/list` 中的描述、schema 字段说明、annotations 和 `structuredContent` 摘要能直接指导宿主 AI 正确选择和调用工具。
- `ProjectKnowledgeContextLayer` 是四工具唯一内部支撑层，四个 handler 不再各自拼接 structure/search/graph/panorama 数据。
- `ContextIndexSnapshot` 能提供 project map、knowledge catalog、Recipe relation、source graph、vector status 的可重建派生摘要，并保持 detailRefs 可追溯。
- `RetrievalPlanner` 能按意图稳定选择 matrix-first、search-first、graph-first、prime-orchestrated 路径，并在输出中保留 retrievalTrace。
- `EvidenceAndFreshness` 能按 project/knowledge/recipeRelation/vector/sourceGraph/document/runtime 数据域分别标记 freshness 和 degraded 原因。
- `Budgeted Projection` 能保证默认输出摘要优先、引用展开；条目数、正文片段、关系链 hops、matrix 节点和 nextActions 均受 budget 控制。
- `interaction` 统一来自现有 intent/session/work 状态，没有第二套当前任务真源。
- `alembic_project_matrix` 替代 `alembic_structure` 与 `alembic_panorama` 的只读项目地图能力，并提供知识库分类摘要；不承担知识覆盖评估。
- `alembic_search` 替代 `alembic_knowledge list/get` 的公共读取能力。
- `alembic_search` 和 `alembic_prime` 共享 Recipe 候选池检索能力：广召回、关系链扩展、向量/混合检索、多信号重排、whyMatched/scoreBreakdown/detailRefs 输出。
- Recipe 关系链能作为候选解释证据返回，但不重新暴露为公共 Recipe graph，也不影响 `alembic_graph` 的项目内部结构边界。
- `alembic_graph` 能表达项目、package、target、module、file、symbol、source graph node 之间的项目内部结构关系。
- `alembic_panorama` 的 governance/decay/staging/enhancement 不再挂在项目地图工具下。
- 默认公共 MCP 输出没有单一平台命名，也不使用具体平台作为默认宿主身份。
- 所有四工具返回结构化 output schema，`content` 只作为短摘要。
- 内置 skills、打包 skills、README、project skill templates 和 `nextActions` 已同步为四工具使用流程，不再把旧公共工具、`confirm_usage` 或 Recipe graph 语义推荐给宿主 AI。
- 删除旧公共工具后，没有真实消费者断裂；若发现消费者，必须先完成消费者修复和验证，不保留兼容层。
- 真实项目验证必须按 `alembic_graph`、`alembic_search`、`alembic_prime`、`alembic_project_matrix` 顺序全部通过，且每个工具返回内容都被评估为准确、有价值、精简、无职责外冗余。
- Test 窗口必须复验真实 MCP 调用结果，Controller review 通过后才能标记完成。

## Risks And Open Questions

- `alembic_prime` 当前属于 agent public tool family，输出契约和四工具统一契约如何最小破坏地合并，需要实现窗口做代码级方案。
- 旧 tests/snapshots 可能大量绑定 `alembic_knowledge/structure/panorama`，删除旧工具会产生测试修复成本。
- `agentHost` 去平台化会影响现有 contract schema、fixtures 和文案，需要和上一条 MCP status rename/compact 需求保持一致。
- `panoramaService.ensureData()` 当前会自动准备数据，项目矩阵默认是否允许轻量 cache warm 需要实现窗口确认；Design 倾向默认不触发隐式重扫或状态变更。
- `alembic_search get/expand` 的 detail ref 格式需要稳定设计，否则后续测试难以复现。
- source graph、项目结构、resident search 三者 freshness 不一致时，status 合成规则需要明确优先级；`alembic_graph` 只看项目结构/source graph freshness，不看 Recipe 知识库 freshness。
- skills/README/tool descriptions 现在分散在内置目录和两个宿主插件包中；如果不抽出共享职责表或建立同步检查，后续很容易再次出现旧工具推荐和 graph 语义漂移。
- Recipe relation chain 如果 depth/fanout 不受控，会把候选池扩成噪声池；需要默认 depth 1，必要时 depth 2，并对弱关系降权。
- 向量检索与 keyword/关系链信号可能给出相反排序；需要 scoreBreakdown 和 whyMatched 解释，避免宿主 AI 把单一高 vectorScore 当成唯一真相。
- resident/vector 不可用时不能把结果标成完全 ready；需要保留 keyword/weighted/relationship fallback，并在 diagnostics/sources 中明确降级原因。
- ContextIndexSnapshot 如果持久化为独立事实源，会造成知识库/source graph/project map 三套事实漂移；Design 建议只作为可重建派生视图或带 freshness stamp 的缓存。
- GraphRAG/RAPTOR 类层级摘要适合做离线或增量派生摘要，不适合在普通 MCP tool 调用中临时做昂贵生成；默认工具调用应读已有索引并给 degraded/nextAction。

## Controller Intake Notes

Design 推荐把本需求作为 AlembicPlugin 实现前置架构需求进入总控 intake。它不是“新增一个漂亮门面”，而是删除旧语义混杂公共面、保留成熟能力并下沉为提供者、让四个 MCP 工具共享真实支撑层。

本需求已拆成独立需求组，见 `alembic-knowledge-context-four-tools-requirement-group-2026-06-14.md`。用户已确认总控可按 K0-K9 顺序接收：先做 K0 AlembicPlugin 只读代码事实和消费者扫描，再进入 K1-K7 实现，最后执行 K8 真实 MCP 验证和 K9 controller closeout。旧公共工具按硬删除处理；若 K0 发现真实消费者，后续任务应修复消费者和测试，不保留兼容层。真实验证直接使用已建立的 Alembic 空间级知识库和真实分仓库数据，不做仓库删除或知识库删除操作。

## Source References

本设计读取和使用的本地代码事实包括：

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/tools.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/panorama.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/types.ts`
- `AlembicPlugin/lib/runtime/mcp/McpServer.ts`
- `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/descriptions.ts`
- `AlembicPlugin/lib/runtime/mcp/host/guidance.ts`
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts`
- `AlembicPlugin/lib/service/task/IntentExtractor.ts`
- `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts`
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts`
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts`
- `AlembicPlugin/vendor/AlembicCore/src/service/search/SearchEngine.ts`
- `AlembicPlugin/vendor/AlembicCore/src/service/search/HybridRetriever.ts`
- `AlembicPlugin/vendor/AlembicCore/src/service/search/MultiSignalRanker.ts`
- `AlembicPlugin/vendor/AlembicCore/src/service/vector/VectorService.ts`
- `AlembicPlugin/vendor/AlembicCore/src/repository/knowledge/KnowledgeEdgeRepository.ts`
- `AlembicPlugin/vendor/AlembicCore/src/domain/knowledge/values/Relations.ts`
- `AlembicPlugin/skills/alembic-structure/SKILL.md`
- `AlembicPlugin/skills/alembic-recipes/SKILL.md`
- `AlembicPlugin/plugins/*/skills/alembic/SKILL.md`
- `AlembicPlugin/plugins/*/skills/alembic-structure/SKILL.md`
- `AlembicPlugin/plugins/*/skills/alembic-recipes/SKILL.md`

外部设计基线：

- MCP Tools specification: `https://modelcontextprotocol.io/specification/2025-11-25/server/tools`
- MCP Resources specification: `https://modelcontextprotocol.io/specification/2025-06-18/server/resources`
- MCP Specification overview: `https://modelcontextprotocol.io/specification/2025-11-25`
- Anthropic Contextual Retrieval: `https://www.anthropic.com/engineering/contextual-retrieval`
- Anthropic Claude Cookbook Contextual Embeddings guide: `https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide`
- Microsoft GraphRAG documentation: `https://microsoft.github.io/graphrag/`
- Microsoft Research GraphRAG project: `https://www.microsoft.com/en-us/research/project/graphrag/`
- RAPTOR paper: `https://arxiv.org/abs/2401.18059`
- Aider Repository Map: `https://aider.chat/docs/repomap.html`
- Sourcegraph Cody codebase context: `https://sourcegraph.com/blog/how-cody-understands-your-codebase`
- Sourcegraph semantic code search overview: `https://sourcegraph.com/blog/semantic-code-search-what-it-is-and-how-it-works`
