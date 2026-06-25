# Alembic 知识与项目上下文四工具需求组

日期：2026-06-14
状态：Design 需求组候选，等待总控 intake
负责窗口：Design
接收窗口：AlembicWorkspace controller
设计 Key：alembic-knowledge-context-four-tools-2026-06-14
来源需求设计：`alembic-knowledge-context-four-tools-requirement-design-2026-06-14.md`
来源 intake：`alembic-knowledge-mcp-tools-optimization-intake-2026-06-13.md`

## 目的

把 AlembicPlugin 知识库 MCP 工具优化拆成一组可以由总控逐项接收、建 state root、派发实现与验证的独立需求。

这组需求的目标不是新增一个薄门面，也不是把旧工具换名后继续混用，而是在 AlembicPlugin 内建立真实的知识与项目上下文支撑层，让四个公共 MCP 工具稳定支撑：

- `alembic_project_matrix`：项目地图、项目结构摘要、知识库分类摘要。
- `alembic_search`：Recipe/知识检索、详情读取、预算化展开、候选解释。
- `alembic_prime`：当前任务上下文装配。
- `alembic_graph`：项目内部结构图、依赖/调用/路径/影响关系。

## 全局用户确认

- 总控可按本需求组 K0-K9 正式接收；第一步做 K0，只读盘点后再进入实现。
- K0 推荐由 AlembicPlugin 窗口执行只读代码事实与消费者清单，总控负责接收和判断。
- 只保留四个公共知识读取/导航 MCP 工具：`alembic_project_matrix`、`alembic_prime`、`alembic_search`、`alembic_graph`。
- 旧 `alembic_knowledge`、`alembic_structure`、`alembic_panorama` 不再出现在正常 `tools/list`。
- 旧公共工具按硬删除处理；如果 K0 发现真实消费者，修复消费者和测试，不以兼容层保留旧工具。
- `alembic_graph` 只负责项目内部结构图，不依赖 Recipe 知识库，不查询 Recipe/知识条目关系。
- `alembic_project_matrix` 不做知识覆盖评估，只做项目知识库分类摘要、项目地图和高层项目结构摘要。
- `insights` 和 `confirm_usage` 不包含在本需求组中，暂时不考虑迁移、保留或替代。
- 真实 MCP 验证直接使用已建立的 Alembic 空间级知识库，覆盖 Alembic 空间内真实分仓库知识和项目结构；本需求不包含删除仓库操作。
- MCP 描述、input schema 字段说明、tool annotations、structured output 摘要、`nextActions`、README 与 Skill 使用说明必须同步修改。
- Recipe 检索按“广召回 -> 关系链扩展 -> 向量/混合检索 -> 多信号重排 -> 少量最佳候选”落地，并返回 whyMatched、scoreBreakdown、relationChains、detailRefs。
- 项目已有成熟向量工程，应复用 `SearchEngine`、`VectorService`、`HybridRetriever`、resident semantic search、RRF、`MultiSignalRanker`，不另造向量体系。
- 新实现目录按推荐使用 `AlembicPlugin/lib/service/project-knowledge-context/`。
- 不新建英文开发者阅读文档；已有多语言包内说明如需保留，应保持语义等价。

## 全局边界

- Design 文档不是任务包，不是 dispatch packet，不是验收结论。
- 总控接收后应为每个独立需求创建自己的 state root 和任务包。
- 产品代码修改只应由 AlembicPlugin 所属实现窗口执行。
- Test 只在产品自验证后做真实 MCP 调用复验。
- 不修改 Wakeflow current state、TODO、state root 或 test exchange。
- 删除旧工具前必须完成消费者扫描、replacement evidence、tools/list snapshot 和代表性验证。
- 不保留旧公共工具兼容层；真实消费者是待修复对象，不是保留旧工具的理由。
- 验证只读取和调用真实知识库与真实项目，不执行仓库删除、知识库删除或状态清空操作。

## 依赖流程

```text
K0 代码事实与消费者清单
  -> K1 四工具公共契约
      -> K2 上下文支撑层基础
          -> K3 项目矩阵
          -> K4 Recipe 搜索与检索
          -> K5 项目内部结构图
              -> K6 Prime 上下文编排
                  -> K7 工具描述、Skill 与旧公共面清理
                      -> K8 真实 MCP 验证
                          -> K9 验收、清理与总控收口
```

如果共享契约稳定，K3/K4/K5 可在 K2 后并行推进。K6 依赖 K3/K4/K5，因为 prime 需要组合这些输出。K7 可在新公共工具契约存在后启动，但旧工具最终移除必须等待 K3-K6 的替代证据。

## 需求组摘要

| 需求 | 标题 | 建议负责窗口 | 依赖 | 完成信号 |
| --- | --- | --- | --- | --- |
| K0 | 代码事实与消费者清单 | AlembicPlugin 只读执行，总控接收判断 | 无 | 清单覆盖当前工具、schema、handler、Skill、测试和消费者。 |
| K1 | 四工具公共契约 | AlembicPlugin | K0 | 共享输入/输出 schema 和四工具契约通过测试。 |
| K2 | ProjectKnowledgeContextLayer 支撑层基础 | AlembicPlugin | K1 | 新支撑层负责输入归一、索引快照、规划、freshness、ref 和 budget。 |
| K3 | 项目矩阵工具 | AlembicPlugin | K2 | `alembic_project_matrix` 返回精简项目地图和知识库目录摘要。 |
| K4 | Recipe 搜索与检索 | AlembicPlugin | K2 | `alembic_search` 支持 search/get/expand、候选池、关系链和向量重排。 |
| K5 | 项目内部结构图 | AlembicPlugin | K2 | `alembic_graph` 只返回项目结构关系，不返回 Recipe graph。 |
| K6 | Prime 上下文编排 | AlembicPlugin | K3, K4, K5 | `alembic_prime` 把 interaction、matrix、search、graph 组合成紧凑任务上下文。 |
| K7 | 工具描述、Skill 与旧公共面清理 | AlembicPlugin | K3-K6 替代证据 | tools/list、schema 描述、Skill、README、nextActions 与四工具对齐；旧公共工具移除。 |
| K8 | 真实 MCP 验证 | AlembicPlugin + Test | K7 | 真实 Alembic 空间 MCP 验证按固定顺序通过。 |
| K9 | 验收、清理与总控收口 | Controller + AlembicPlugin + Test | K8 | 总控审查原始证据并关闭需求组。 |

## K0：代码事实与消费者清单

- 需求 Key：`alembic-knowledge-context-k0-inventory-2026-06-14`
- 类型：只读清单
- 建议负责窗口：AlembicPlugin 只读窗口；AlembicWorkspace controller 接收判断
- 依赖：无

### 目标

实现前先盘点当前公共 MCP 面、schema、handler、输出投影、描述、Skill、README 指引、测试、fixture、snapshot 和真实消费者。

### 范围

至少读取：

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/tools.ts`
- `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/tool-router.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/search.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/knowledge.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/structure.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/panorama.ts`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts`
- `AlembicPlugin/lib/runtime/mcp/public-tools/*`
- `AlembicPlugin/skills/*/SKILL.md`
- `AlembicPlugin/plugins/*/skills/*/SKILL.md`
- `AlembicPlugin/README*.md`
- `AlembicPlugin/test/`

### 验收

- 清单列出当前所有 `alembic_knowledge`、`alembic_structure`、`alembic_panorama`、`alembic_call_context`、Recipe graph 语义、`insights`、`confirm_usage` 引用。
- 清单列出当前所有与四工具相关的 `alembic_prime`、`alembic_search`、`alembic_graph` 和未来 `alembic_project_matrix` 引用。
- 清单区分公共工具暴露、内部 provider 使用、测试/fixture、文档/Skill 和真实消费者。
- 如果发现旧公共工具真实消费者，K0 记录消费者位置和修复建议；后续实现仍以硬删除旧公共工具为目标。
- K0 本身不宣称任何实现或删除已完成。

## K1：四工具公共契约

- 需求 Key：`alembic-knowledge-context-k1-four-tool-contract-2026-06-14`
- 类型：契约优先实现
- 建议负责窗口：AlembicPlugin
- 依赖：K0

### 目标

在迁移业务逻辑前，先定义共享 `KnowledgeContextBaseInput`、四个工具各自的输入扩展，以及 `KnowledgeContextToolOutput`。

### 必要契约形态

- 通用字段：`projectRoot`、`agentHost`、`inputSource`、`intentKind`、`query`、`activeFile`、`language`、`hostDeclaredIntent`、`hostTurnMeta`、`sourceRefs`、`sourceGraphRef`、`sourceEvidenceRefs`、`intentRef`、`primeRef`、`workRef`、`scope`、`include`、`filters`、`detailLevel`、`budget`、`freshnessPolicy`。
- 输出字段：`ok`、`status`、`tool`、`operation`、`summary`、`request`、`project`、`interaction`、`result`、`inventory`、`relations`、`items`、`detailRefs`、`sources`、`diagnostics`、`nextActions`、`meta`。
- `sources[]` 支持这些 domain：`project`、`knowledge`、`recipeRelation`、`vector`、`sourceGraph`、`document`、`runtime`。
- `detailRefs[]` 必须稳定且受 budget 控制。

### 验收

- 四工具 schema 能解析合法输入，并拒绝错误 node type 或 lifecycle operation。
- 公共 schema/output 不带单平台默认 host 身份。
- `content` 只放摘要；机器可读数据放在 structured output。
- 契约测试覆盖 ready、partial、degraded、blocked、failed。

## K2：ProjectKnowledgeContextLayer 支撑层基础

- 需求 Key：`alembic-knowledge-context-k2-support-layer-2026-06-14`
- 类型：架构基础
- 建议负责窗口：AlembicPlugin
- 依赖：K1

### 目标

创建 `AlembicPlugin/lib/service/project-knowledge-context/`，作为四工具唯一业务来源。

### 必要模块

- `contracts/`：共享 input/output/ref/status 契约。
- `layer/`：`ProjectKnowledgeContextLayer`、`KnowledgeContextInputNormalizer`、`ContextIndexSnapshot`、`RetrievalPlanner`、`KnowledgeContextOutputProjector`。
- `interaction/`：`InteractionStateProvider`、`IntentRecordStore`、`WorkRecordStore`。
- `project/`：`ProjectIdentityProvider`、`ProjectStructureProvider`、`ProjectMatrixProvider`、`ProjectGraphProvider`。
- `retrieval/`：`KnowledgeRetrievalProvider`、`SearchProvider`、`RecipeCandidateProvider`、`RecipeRelationChainProvider`、`VectorRerankProvider`、`KnowledgeDetailProvider`、`ContextExpansionProvider`。
- `evidence/`：`FreshnessProvider`、`SourceEvidenceProvider`、`DocumentContextProvider`、`EvidenceLinkProvider`。
- `support/`：`RefRegistry`、`ContextBudgeter`、`ResultRanker`、`ContextCache`、`ScoreTrace`。

### 验收

- 旧 handler 改为调用支撑层，或收缩为协议 adapter。
- `ContextIndexSnapshot` 是可重建派生视图，不是新的 source of truth。
- `RetrievalPlanner` 能选择 matrix-first、search-first、graph-first 和 prime-orchestrated 路径。
- Freshness 按数据 domain 分离。
- Budget 控制 item 数、文本片段、关系跳数、matrix node 和 nextActions。

## K3：项目矩阵工具

- 需求 Key：`alembic-knowledge-context-k3-project-matrix-2026-06-14`
- 类型：新公共 MCP 工具
- 建议负责窗口：AlembicPlugin
- 依赖：K2

### 目标

新增 `alembic_project_matrix`，作为精简项目地图和知识库目录入口。

### 行为

- 支持 `overview`、`node`、`relations`、`layers`、`sources`、`catalog`。
- 默认 `overview` 返回项目层级、关键节点、结构热点、source graph 状态、知识目录分类、代表性 ref 和推荐 nextActions。
- `catalog` 汇总知识分类和代表性 Recipe ref。
- `node` 只展开一个 matrix node，不返回完整源码或完整 Recipe 文本。

### 非目标

- 不做知识覆盖评估。
- 不返回完整文件列表、完整源码、完整 Recipe 语料或完整 graph edge。
- 不做 `panorama` governance、decay、staging、promote 或 lifecycle mutation。

### 验收

- 真实 AlembicPlugin overview 能放进紧凑默认响应，并指向 detailRefs。
- 输出能让 agent 一眼理解项目结构和知识目录。
- 缺失 project/source/knowledge 数据时返回 partial/degraded，不伪装 ready。

## K4：Recipe 搜索与检索

- 需求 Key：`alembic-knowledge-context-k4-recipe-search-2026-06-14`
- 类型：搜索/检索实现
- 建议负责窗口：AlembicPlugin
- 依赖：K2

### 目标

把 `alembic_search` 升级为统一 Recipe/知识检索与详情展开工具。

### 行为

- 支持 `operation=search/get/expand`。
- `search` 根据关键词、kind、category、language、sourceRefs、activeFile/module 和 intent 生成大候选池。
- `RecipeRelationChainProvider` 通过 Recipe `relations` 和 `knowledge_edges` 扩展候选，并受 depth/fanout 控制。
- `VectorRerankProvider` 复用既有 `SearchEngine`、`VectorService`、`HybridRetriever`、resident semantic search、RRF 和 `MultiSignalRanker`。
- 结果包含 `whyMatched`、`scoreBreakdown`、`relationChains`、`sourceRefs`、`detailRef`、vector/resident 可用性和 fallback 原因。
- `get/expand` 按 ref/id 和 budget 读取详情；长内容留在 detailRefs 后。

### 非目标

- 不记录 usage、lifecycle state、`insights` 或 `confirm_usage`。
- 不构建项目地图。
- 不把公共 Recipe graph traversal 包装成 `alembic_graph`。

### 验收

- 真实 AlembicPlugin 查询能返回相关 Recipe 候选，并解释命中原因。
- 候选池大于最终输出。
- 关系链有用且有边界，不把 conflict/deprecated/alternative 当成正向证明。
- 向量不可用时，仍能通过关键词/加权/关系结果返回有价值内容，并带 degraded diagnostics。

## K5：项目内部结构图

- 需求 Key：`alembic-knowledge-context-k5-project-graph-2026-06-14`
- 类型：graph 语义替换
- 建议负责窗口：AlembicPlugin
- 依赖：K2

### 目标

把公共 `alembic_graph` 中的 Recipe/knowledge graph 语义替换为项目内部结构图语义。

### 行为

- 支持 `query`、`impact`、`path`、`stats`、`neighborhood`。
- node type 只允许项目内部类型：project、package、target、module、directory、file、symbol、source-graph-node。
- relation 只允许项目内部关系：partOf、dependsOn、imports、exports、definesSymbol、referencesSymbol、calls、calledBy、ownsFile、entrypointFor。
- 使用 source graph、project dependency graph、call graph 和 project structure provider。

### 非目标

- 不支持 Recipe nodeType。
- 不回退到 `knowledge_edges` 或 Recipe `relations`。
- 不提供 `coveredByKnowledge`、`hasGap` 等知识覆盖关系。

### 验收

- 如果 project/source graph 可用，Recipe 知识库缺失不应导致 graph 降级。
- source graph stale/partial 必须清晰标注。
- 真实项目 graph 输出能由代码/config/source graph 证据解释。

## K6：Prime 上下文编排

- 需求 Key：`alembic-knowledge-context-k6-prime-orchestration-2026-06-14`
- 类型：agent 上下文编排
- 建议负责窗口：AlembicPlugin
- 依赖：K3, K4, K5

### 目标

重构 `alembic_prime`，把 interaction state、project matrix、Recipe retrieval 和 project graph 组合成紧凑任务上下文包。

### 行为

- 复用已有 intent/session/work state，不建立第二套 current-task truth。
- 复用 K4 的 Recipe 候选池和 vector/relation rerank。
- 仅在有价值时拉取 K3 的 matrix summary 和 K5 的 graph detail refs。
- 保留 `PrimeKnowledgeMaterial` 风格的 trust receipt，但公共措辞保持 host-neutral。

### 验收

- `interaction.currentTask` 来自 session/work state。
- Prime 不返回完整 project matrix 或完整知识语料。
- Prime 输出解释 accepted knowledge、context-only evidence、degraded sources 和后续 detailRefs。

## K7：工具描述、Skill 与旧公共面清理

- 需求 Key：`alembic-knowledge-context-k7-surface-guidance-cleanup-2026-06-14`
- 类型：公共面与指引清理
- 建议负责窗口：AlembicPlugin
- 依赖：K3-K6 替代证据

### 目标

让四工具语义可发现，并移除旧公共指引。

### 必要更新

- Tool descriptions、schema descriptions、annotations、handler catalog、router、output projector 和 nextActions。
- `skills/` 与 `plugins/*/skills/` 下的内置 Skill 和打包 Skill。
- README 和项目 Skill template。
- 仍期待旧公共工具的 tests/fixtures/snapshots。

### 验收

- `tools/list` 默认公共知识面只暴露四个工具。
- Skill/README/nextActions 不再推荐 `alembic_knowledge`、`alembic_structure`、`alembic_panorama`、`confirm_usage` 或 Recipe graph 语义的 `alembic_graph`。
- 现有旧工具调用要么从公共列表消失，要么在短期例外被明确批准时返回 structured removed/retired/blocked 响应。

## K8：真实 MCP 验证

- 需求 Key：`alembic-knowledge-context-k8-real-mcp-validation-2026-06-14`
- 类型：验证实现与 Test handoff
- 建议负责窗口：AlembicPlugin 自检，然后 Test
- 依赖：K7

### 目标

用真实 Alembic 空间项目验证四工具，不以 mock-only test 作为完成依据。

### 必要顺序

1. `alembic_graph`
2. `alembic_search`
3. `alembic_prime`
4. `alembic_project_matrix`

前一项失败会阻塞下一项验证。

### 最小真实项目范围

- 必选：AlembicPlugin。
- 必选：使用已建立的 Alembic 空间级知识库，覆盖 Alembic 空间内真实分仓库知识和项目结构。
- 建议：至少再选 Alembic 或 AlembicCore 中一个真实分仓库做交叉验证。
- 明确不包含：仓库删除、知识库删除、索引清空或任何破坏性验证。

### 证据

- MCP call input，包含 projectRoot、operation、query/node/ref、budget/detailLevel/freshnessPolicy。
- 原始 structured output。
- 准确性、价值、紧凑性和边界评估。
- 问题清单与修复建议。
- 产品自检后的 Test-window 复验证据。

## K9：验收、清理与总控收口

- 需求 Key：`alembic-knowledge-context-k9-acceptance-closeout-2026-06-14`
- 类型：总控验收
- 建议负责窗口：AlembicWorkspace controller
- 依赖：K8

### 目标

审查全部原始证据，确认旧公共面清理完成，并且只有真实 MCP 验证通过后才关闭需求组。

### 验收

- K0-K8 证据齐全且内部一致。
- 四工具满足固定验证顺序和质量标准。
- 旧公共工具默认不可见，不保留兼容层；发现真实消费者时应已完成消费者修复。
- Skill 与 README 对齐新的四工具语义。
- 公共 schema/output/description 中不残留平台特定默认 host 身份。
- 产品完成不得只基于静态 schema test、mock output 或文档。

## 总控接收提示候选

```text
接收 Design 需求组候选：
Design/docs/current/alembic-knowledge-context-four-tools-requirement-group-2026-06-14.md

目标：把 AlembicPlugin 知识库 MCP 公共面收敛为 alembic_project_matrix、alembic_prime、alembic_search、alembic_graph，并建立真实 ProjectKnowledgeContextLayer 支撑层。

请总控先做 K0 只读代码事实与消费者清单，不要直接派发实现或删除旧工具。K0 通过后按 K1-K9 依赖顺序创建 state root 和任务包。

关键边界：
- alembic_graph 只做项目内部结构图，不做 Recipe graph。
- alembic_project_matrix 只做项目地图和知识库分类摘要，不做知识覆盖评估。
- alembic_search 承接 list/get 公共读取，并实现 Recipe 候选池、关系链、向量/混合检索、多信号重排。
- insights 和 confirm_usage 不在本需求组范围。
- 旧公共工具按硬删除处理；真实消费者需要修复，不作为保留兼容层的理由。
- 真实验证直接使用已建立的 Alembic 空间级知识库和真实分仓库数据；不做仓库删除或知识库删除操作。
- MCP 描述、schema、annotations、skills、README、nextActions 必须同步。
- 完成必须通过真实 Alembic 空间 MCP 调用验证，顺序是 graph -> search -> prime -> project_matrix，并由 Test 复验。
```

## 总控备注

- 本文档是需求序列候选，不是任务包。
- 总控 intake 后应把这组需求导入或重建到 active state root。
- 产品 commit 和代码证据属于 AlembicPlugin 实现窗口。
- Test 证据只在产品自验证后需要。
- 本文档不包含 secret、thread id 或 local-only runtime 标识。
