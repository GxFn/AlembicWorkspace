# Alembic 知识库 MCP 工具优化需求收集

## 元信息

- 需求编号：`alembic-knowledge-mcp-tools-optimization-2026-06-13`
- 状态：收集中，等待用户测试反馈
- 当前窗口：Design 需求窗口
- 需求类型：知识库相关 MCP 工具体验、语义、输出契约优化
- 当前结论：这是候选需求收集文档，不是执行计划、任务包、TODO 或验收结论
- 2026-06-14 补充：完整四工具支撑层重构方案已沉淀为 `alembic-knowledge-context-four-tools-requirement-design-2026-06-14.md`。

## 背景

用户已经生成 Alembic 空间的知识库，接下来会对知识库相关 MCP 工具进行实际测试。Design 需要把测试中暴露的问题、可优化点和用户修改建议集中记录，后续交给总控判断是否进入需求设计、任务拆分、实现窗口或验证窗口。

本需求重点不是“重新生成知识库”本身，而是让知识库相关 MCP 工具在真实调用中返回更正确、更可用、更符合职责边界的数据内容。

## 设计边界

Design 可以做：

- 汇总用户测试反馈、问题、优化点和修改建议。
- 梳理知识库 MCP 工具的职责边界、输入输出语义和期望行为。
- 标记需要代码事实复核、实现窗口处理或总控确认的事项。
- 形成后续 requirement design / workspace signal / handoff 候选。

Design 不做：

- 不修改 Alembic 或 AlembicPlugin 产品代码。
- 不创建或修改 Wakeflow current state、state root、TODO、task package 或 dispatch packet。
- 不执行实现验收，不把用户反馈直接判定为最终产品决策。
- 不把本需求扩散到无关的状态工具、源码图工具、运行时网关或平台命名清理，除非用户测试证明它们直接影响知识库 MCP 工具体验。

## 初始工具范围

当前先按“知识库读取、检索、结构理解、图谱理解、知识候选写入”来收集，不预设所有工具都必须改。

优先关注：

- `alembic_prime`：初始化/预热项目知识上下文时返回的信息是否足够、精简、可行动。
- `alembic_search`：搜索知识库时的召回、排序、摘要、引用和噪声控制。
- `alembic_knowledge`：当前旧入口包含知识条目 list/get/insights/confirm_usage；后续只评估 list/get 公共读取能力并入 `alembic_search`。`insights` 和 `confirm_usage` 不包含在本需求中，暂时不考虑。
- `alembic_structure`：展示知识结构时是否符合真实项目结构和用户理解路径。
- `alembic_graph`：只展示项目内部结构关系，例如 package/target/module/file/symbol/source graph node 的包含、依赖、调用、路径和影响范围；不依赖 Recipe 知识库。
- `alembic_panorama`：展示项目全景、模块关系、健康度时是否职责过宽，是否应收敛为项目地图/项目矩阵能力；知识覆盖不进入 `alembic_project_matrix`。
- `alembic_submit_knowledge`：如果测试涉及新增知识候选，关注字段、校验、反馈和失败提示。

条件性关注：

- `alembic_rescan` / `alembic_bootstrap`：仅当问题来自知识库生成、刷新、索引或空库初始化。
- `alembic_project_skill`：仅当问题来自项目级技能暴露、入口提示或知识库使用说明。
- 源码图相关工具：仅当知识库工具错误依赖源码图结果，或返回内容混淆了知识库事实与源码事实。

旧 `alembic_knowledge` 的 `insights` 表示对单条知识做质量分析和改进建议；`confirm_usage` 表示记录某条知识确实被采用或应用，可带使用类型和反馈。它们都不是四工具公共读取能力，本需求不包含，暂时不考虑迁移、保留或替代。

## 非目标

- 本轮不做大规模命名体系重构。
- 本轮不处理与知识库工具无关的 MCP status、daemon、HTTP、CLI 或 release 逻辑。
- 本轮不要求兼容旧输出格式；旧公共工具按硬删除处理，若发现真实消费者，应修复消费者和测试。
- 本轮不新增英文开发者阅读文档。

## 反馈记录表

| 时间 | 场景 | 工具 | 输入摘要 | 实际结果 | 期望结果 | 问题类型 | 严重度 | 证据 | 用户建议 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 待补充 | 用户测试中 | 待补充 | 待补充 | 待补充 | 待补充 | 待分类 | 待评估 | 待补充 | 待补充 | 待整理 |

问题类型建议：

- `语义错误`：工具职责、字段含义或返回结论与知识库职责不匹配。
- `输出过载`：返回内容过多，影响代理判断或用户阅读。
- `输出不足`：缺少可行动信息、引用、证据或下一步。
- `召回问题`：搜索不到、排序不合理、重复或噪声过高。
- `结构问题`：知识层级、图谱关系、路径或分类不符合真实项目。
- `刷新问题`：生成、重扫、索引、缓存或空库状态表现异常。
- `错误处理`：失败提示不可理解、不可恢复或误导下一步。
- `双平台语义`：返回文案、字段或工具名绑定单一宿主平台。

## 初始观察方向

这些不是已确认问题，只是后续测试时优先观察的方向：

- 默认输出是否应该更精简，只保留当前代理马上能用的信息。
- 详情型内容是否应该通过明确的条目读取、引用或 detail ref 获取，而不是在搜索结果里一次性展开。
- 每个工具是否有清晰的职责：搜索负责发现，详情负责阅读，结构负责导航，图谱负责关系推理，提交负责候选写入。
- 返回内容是否区分“知识库事实”“源码扫描事实”“运行时状态”和“推断建议”。
- 空库、半生成、索引过期、项目未绑定、路径不匹配等状态是否有明确且可恢复的提示。
- 搜索结果是否包含足够稳定的知识条目标识、标题、摘要、来源和相关性依据。
- 输出是否避免单一平台字样，保持宿主中立的 MCP 工具语义。
- 中文项目知识的标题、摘要和提示是否自然，不出现机械翻译或中英文混杂造成的误读。

## 修改建议收集区

| 编号 | 建议 | 影响工具 | 目标效果 | 需要代码事实复核 | Design 初判 |
| --- | --- | --- | --- | --- | --- |
| KMT-001 | 待用户测试后补充 | 待补充 | 待补充 | 待评估 | 待评估 |
| KMT-002 | 评估将 `alembic_structure` 与 `alembic_panorama` 的项目结构/全景能力收敛为一个层级明确、默认精简的 MCP 项目矩阵工具。 | `alembic_structure`、`alembic_panorama`、`alembic_graph`、源码图工具、知识库读取工具 | 让宿主 AI 先拿到项目地图、层级矩阵、结构关系摘要和知识库分类摘要，再按 detail refs 读取细节。 | 是 | 推荐进入正式 requirement design |
| KMT-003 | 在 AlembicPlugin 内建立统一项目知识上下文支撑层，支撑 `alembic_project_matrix`、`alembic_prime`、`alembic_search`、`alembic_graph` 四个公共 MCP 工具。 | AlembicPlugin MCP schema、handlers、output projector、knowledge/search/graph/panorama/source graph 集成层 | 让四个工具共享同一套输入字段、输出 envelope、数据源解析、freshness 判断、detail refs 和预算控制。 | 是 | 推荐作为 KMT-002 的实现前置架构 |
| KMT-004 | 以四个 MCP 为最终目标重构知识与项目信息支撑层：保留 mature intent/search/graph/output 能力，剪枝旧公共混杂工具，下沉旧查询能力为 provider。 | `alembic_project_matrix`、`alembic_prime`、`alembic_search`、`alembic_graph`、旧 `alembic_knowledge/structure/panorama/call_context` | 形成真实落地的 `ProjectKnowledgeContextLayer`，统一当前任务/交互状态、项目矩阵、知识检索、语义关系和结构化输出。 | 已做初步代码事实复核 | 已形成 requirement design candidate：`alembic-knowledge-context-four-tools-requirement-design-2026-06-14.md` |
| KMT-005 | 增加强制真实项目验证门槛，必须按 `alembic_graph`、`alembic_search`、`alembic_prime`、`alembic_project_matrix` 顺序依次验证真实 Alembic 空间项目 MCP 返回内容，并由 Test 复验。 | 四个公共 MCP 工具、Test/Controller 验收流程 | 确保每个工具返回准确、高质量、有价值、精简的信息；任一工具失败不得标记完成。 | 是 | 已写入 requirement design 的 Testing Decisions 与 Acceptance Criteria |
| KMT-006 | 收窄 `alembic_project_matrix`，不做知识覆盖评估，只做项目知识库分类摘要、项目地图和高层项目结构图摘要。 | `alembic_project_matrix`、`ProjectMatrixProvider`、输出契约 | 让宿主 AI 一眼了解知识库分类、项目地图与结构信息，避免 matrix 变成知识覆盖/质量评估工具。 | 是 | 已写入 requirement design 的用户确认决策、工具职责和验收标准 |
| KMT-007 | 同步优化四工具 MCP 描述、input schema 字段说明、tool annotations、structured output 摘要、nextActions、README 与 Skill 使用说明。 | `tools/list`、`mcp-tools.ts`、`PluginToolSurfaceCatalog.ts`、`public-tools/descriptions.ts`、内置 skills、打包 skills、README、project skill templates | 保证宿主 AI 能从工具列表和 skill 指南正确选择 `alembic_graph/search/prime/project_matrix`，不再误用旧 `alembic_knowledge/structure/panorama` 或 Recipe graph 语义。 | 已做初步代码事实复核 | 已写入 requirement design 的 MCP 描述与 Skill 同步、迁移计划和验收标准 |
| KMT-008 | 强化 Recipe 知识查找：先用 keywords/kind/category/language/sourceRefs 大范围召回，再用 Recipe 关系链扩展候选池，最后复用成熟向量工程和关键内容多信号重排，输出最佳少量候选。 | `alembic_search`、`alembic_prime`、`KnowledgeRetrievalProvider`、`PrimeSearchPipeline`、`SearchEngine`、`VectorService`、`HybridRetriever`、`knowledge_edges` | 让搜索不仅返回列表，还能解释为什么选中这些 Recipe，包含 whyMatched、scoreBreakdown、relationChains、detailRefs；同时不把 `alembic_graph` 重新变成 Recipe graph。 | 已做初步代码事实复核 | 已写入 requirement design 的 Recipe 候选池、关系链与向量重排方案 |
| KMT-009 | 结合 MCP、Contextual Retrieval、GraphRAG、RAPTOR、repo map、代码上下文检索等业界方案，深化四工具支撑层整体架构。 | `ProjectKnowledgeContextLayer`、`ContextIndexSnapshot`、`RetrievalPlanner`、`EvidenceAndFreshness`、`Budgeted Projection` | 形成可重建派生索引、统一检索编排、分域 freshness、稳定 detailRefs、摘要优先和预算受控输出；让四工具共享同一个真实支撑层而不是薄包装旧 handler。 | 已联网核验外部基线并结合本地代码事实 | 已写入 requirement design 的行业基线映射、总体优化方案、迁移计划和验收标准 |

## 议题：项目地图 / 项目矩阵工具

### 当前关系判断

当前代码事实显示，`alembic_structure` 与 `alembic_panorama` 已经有明显重叠，但抽象层级不同：

- `alembic_structure` 是偏底层的项目结构枚举工具，当前公开 `targets`、`files`、`metadata` 三类操作。它通过 discoverer 识别 targets，统计文件数、语言和推断角色；`metadata` 还会补充 package 信息、依赖和知识图谱边。
- `alembic_panorama` 是偏高层的项目全景工具，当前公开 `overview`、`module`、`gaps`、`health`；新设计只迁入项目骨架、架构层、模块角色、耦合和循环依赖摘要，`gaps` 不作为知识覆盖能力迁入。
- `alembic_panorama` 目前还包含 `governance_cycle`、`decay_report`、`staging_check`、`enhancement_suggestions`。其中 `staging_check` 会触发 staging 状态检查和 promote，已经不属于只读项目地图职责；这会让工具语义变宽，也会增加宿主 AI 误选工具的风险。
- 当前 clean-output 白名单也把 `panorama` 的 `results`、`currentStaging`、`suggestions` 与项目全景字段放在同一工具输出下，进一步放大职责混合。

Design 初判：不建议简单把两个旧工具“硬合并”为一个更大的混合工具。更合理的落地方式是把公共 MCP 面收敛为只读、默认精简、层级明确的项目矩阵工具；旧 `structure` 和 `panorama` 不再作为正常公共 MCP 入口暴露，它们的底层读取能力只能作为内部 provider 或实现细节复用。治理和生命周期操作必须拆回专门工具，不能继续挂在项目地图语义下。

### 推荐目标工具

推荐工具名：`alembic_project_matrix`。

备选工具名：`alembic_project_map`。

Design 倾向使用 `alembic_project_matrix`，因为用户目标不是普通文件树，而是一个能表达“项目层级、模块关系、知识库分类摘要、结构热点、详情入口”的矩阵化项目地图。`map` 可以作为返回字段或展示模式，不一定做工具名。

### 推荐职责

`alembic_project_matrix` 应该是只读 MCP 工具，负责回答：

- 这个项目有哪些层级：workspace / project / domain / system / package / target / module / file / symbol / knowledge entry。
- 每一层的节点数量、主要职责、语言/技术栈、入口文件、关键依赖是什么。
- 知识库当前有哪些分类、主题、条目类型和代表性 detail refs，但不判断模块知识覆盖。
- 哪些项目结构关系最重要：`partOf`、`dependsOn`、`providesApi`、`consumesApi`、`definesSymbol`、`referencesSymbol`。
- 当前宿主 AI 下一步应该读取哪些 detail refs，而不是默认展开所有源码、所有知识条目或所有图边。

不应该负责：

- 不执行知识生命周期状态迁移。
- 不执行 staging promote。
- 不提交知识候选。
- 不替代 `alembic_search` 的检索和详情展开。
- 不替代源码图工具的精确 symbol/caller/callee 查询。
- 不联网即时搜索作为默认行为。

### 四工具公共架构

用户期望的公共知识库 MCP 架构可以由四个核心工具撑起，但需要明确每个工具的职责，并把旧工具能力收敛进去：

| 工具 | 职责 | 不能承担的职责 | 旧能力归并 |
| --- | --- | --- | --- |
| `alembic_project_matrix` | 项目地图和层级矩阵：workspace/project/domain/system/package/target/module/file/symbol 的结构层级、知识库分类摘要、结构热点和 detail refs。 | 不返回全量源码、全量 Recipe、知识覆盖评估、生命周期状态迁移、staging promote。 | 吸收 `alembic_structure` 的 targets/files/metadata 摘要能力；吸收 `alembic_panorama` 的 overview/module/health 等只读结构能力；只保留知识库分类摘要。 |
| `alembic_prime` | 面向当前任务的上下文装配：根据 intent 取项目矩阵、搜索结果、图关系和信任标记，返回紧凑 prime package。 | 不做搜索全集浏览，不做知识写入，不做 Guard/验收，不替代用户决策。 | 保留为 agent 进入知识库的首选入口。 |
| `alembic_search` | 统一检索和详情展开：搜索知识、文档、规则、模式、事实；按 ref/id 取详情；按预算展开上下文。 | 不做项目全景建模，不做关系路径推理，不做知识生命周期管理。 | 吸收 `alembic_knowledge list/get` 的公共读取能力；`insights` 和 `confirm_usage` 不包含在本需求中。 |
| `alembic_graph` | 项目内部结构关系查询：package/target/module/file/symbol/source graph node 的包含、依赖、调用、路径和影响范围。 | 不查询 Recipe/知识条目关系，不依赖知识库，不做默认项目总览，不直接返回长文本知识详情，不做状态变更。 | 保留并增强为 `project_matrix` 和 `prime` 的项目结构关系 detail provider。 |

结论：这四个工具可以撑起知识库 MCP 的主架构，前提是 `alembic_search` 不再只是“搜索列表”，而要承担 `get by ref/id` 和预算化详情展开；`alembic_graph` 只负责项目内部结构图，不能继续作为 Recipe graph 或知识关系图。Recipe/知识条目关系归 `alembic_search` 的详情读取和 `alembic_prime` 的上下文选择，不进入 graph。

推荐公共 MCP 面：

- 保留：`alembic_project_matrix`
- 保留：`alembic_prime`
- 保留：`alembic_search`
- 保留：`alembic_graph`
- 清理公共暴露：`alembic_structure`
- 清理公共暴露：`alembic_panorama`
- 清理公共暴露：`alembic_knowledge`，仅把 list/get 公共读取能力并入 `alembic_search`

知识生成和维护工具，例如 `alembic_bootstrap`、`alembic_rescan`、`alembic_submit_knowledge`、`alembic_evolve`、`alembic_dimension_complete`，属于知识库构建/维护面，不属于默认知识读取架构。它们可以存在于维护或 admin 能力层，但不应与四个读取/导航工具混在同一语义层里。

### AlembicPlugin 统一支撑层

用户补充目标：四个公共 MCP 工具不应该各自直连旧 handler、旧 schema、旧 output projector，而应该共同对接 AlembicPlugin 内部一个完整支撑层。这个支撑层统一整合知识库、项目结构、源码图、语义关系、文档/配置元数据、freshness 和 detail refs，再按工具职责投影为不同视图。

推荐内部名称：`ProjectKnowledgeContextLayer`。

中文职责名：项目知识上下文支撑层。

该层不是新的公共 MCP 工具，不直接暴露给宿主；它是四个 MCP 工具的内部应用服务层。

#### 当前代码事实

- `alembic_prime` 已使用 `AgentPublicToolBaseInput` 一类公共输入字段，包含 `agentHost`、`inputSource`、`intentKind`、`userQuery`、`activeFile`、`language`、`hostDeclaredIntent`、`hostTurnMeta`、`sourceRefs`、`sourceGraphRef`、`sourceEvidenceRefs`、`projectRoot`。
- `alembic_search` 当前仍是独立 schema，核心字段是 `query`、`mode`、`kind`、`limit`、`language`、`sessionHistory`、`hostDeclaredIntent`、`hostTurnMeta`、`sourceRefs`。
- `alembic_structure` 当前仍是旧结构 schema，核心字段是 `operation=targets/files/metadata`、`targetName`、`includeSummary`、`includeContent`、`contentMaxLines`、`maxFiles`。
- `alembic_graph` 当前默认 `nodeType=recipe`，这与新的职责边界冲突；新 `alembic_graph` 应改为项目内部结构节点，不表达知识节点或 Recipe 关系。
- `alembic_panorama` 当前 schema 同时包含只读全景操作和治理/状态迁移操作，已经证明不能继续作为公共项目地图入口。
- 当前老 envelope 是 `success/errorCode/message/data/meta`，而 agent public tools 已经有更结构化的 public output 契约。四个知识读取工具应收敛到新的统一输出结构，而不是继续各自返回 `data`。

更关键的实现事实：项目里已经存在可复用的交互状态与意图内核，不应为这四个 MCP 另起一套状态系统。

| 现有能力 | 位置 | 可复用职责 |
| --- | --- | --- |
| `HostIntentFrame` | `AlembicPlugin/lib/service/task/HostIntentFrame.ts` | 归一化用户 query、hostDeclaredIntent、hostTurnMeta；对 thread/session/conversation id 做 hash；识别 raw automation envelope；形成 recognizedIntentDraft。 |
| `IntentExtractor` | `AlembicPlugin/lib/service/task/IntentExtractor.ts` | 从 query 和 activeFile 推断 language、module、scenario；生成多查询和中英文同义词扩展。 |
| `TaskLifecyclePolicy` | `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts` | 判断 inputSource、intentKind、primeDecision、taskAnchorDecision、Guard 触发边界。 |
| `intentHandler` | `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts` | 创建 session-local `intentRef`，返回 intentClassification、intentPersistence、retrievalPlan、toolPlan。 |
| `primeHandler` | `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts` | 消费 intentRef 或 fallback intent，运行 prime search，绑定 session intent，返回 primePackage。 |
| `ctx.session.intent` | `AlembicPlugin/lib/runtime/mcp/handlers/types.ts`、`McpServer.ts` | 维护当前交互状态：phase、primeQuery、activeFile、language、module、scenario、taskId、taskTitle、toolCalls、searchQueries、mentionedFiles、driftEvents。 |
| `workStartHandler` / `WORK_RECORDS` | `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts` | 用 `workRef` 绑定当前执行任务、scope files 和 evidence refs。四个知识工具只读该状态，不接管工作生命周期。 |
| `PrimeSearchPipeline` | `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts` | 多查询并行搜索、semantic/keyword/auto 融合、resident search、RRF、质量过滤、searchMeta。 |
| `PrimeKnowledgeMaterial` | `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts` | 生成可信边界、acceptedKnowledge/acceptedGuards、developer-visible receipt 指令和 nextActions。 |
| `AgentPublicToolResultEnvelope` | `AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts` | 已有统一 status/reason/refs/detailRefs 输出骨架，可作为四工具输出契约基础。 |

因此支撑层的状态来源应是：

- 当前请求输入：`KnowledgeContextBaseInput`。
- 当前 session 状态：`ctx.session.intent`。
- 可消费 intent 记录：`INTENT_RECORDS` / `intentRef`。
- 当前执行任务：`workRef`、`ctx.session.intent.taskId`、`ctx.session.intent.taskTitle`、scope files。
- prime/search 结果：`PrimeSearchPipeline`、`PrimeKnowledgeMaterial`、resident search metadata。
- source graph freshness 与证据引用：只读接入，不能把 stale 图事实当 ready 事实。

支撑层不应维护第二套“当前任务”。它只应把现有 intent/work/session 状态投影成统一的 `interaction` 字段，供四个 MCP 工具共同返回。

#### 支撑层数据源

`ProjectKnowledgeContextLayer` 至少整合这些内部 provider：

| Provider | 来源 | 产出 |
| --- | --- | --- |
| `InteractionStateProvider` | `HostIntentFrame`、`IntentExtractor`、`TaskLifecyclePolicy`、`ctx.session.intent`、`INTENT_RECORDS`、`WORK_RECORDS` | 当前开发者与宿主 AI 的交互状态、当前任务、intentRef、primeRef、workRef、工具计划、source refs。 |
| `ProjectScopeProvider` | projectRoot、dataRoot、workspace config、runtime context | 项目身份、可信边界、数据根、新鲜度策略。 |
| `ProjectStructureProvider` | discoverer、package metadata、旧 structure 能力 | package/target/module/file 层级、语言统计、入口摘要。 |
| `ProjectPanoramaProvider` | panoramaService 的只读 overview/module/health | 架构层、模块角色、耦合/循环热点；不输出知识覆盖结论。 |
| `KnowledgeProvider` | knowledgeRepository、searchEngine、resident search | Recipe/rule/pattern/fact 检索、详情、摘要、来源。 |
| `ProjectGraphProvider` | source graph、project structure、dependency/call graph | `partOf`、`dependsOn`、`imports`、`exports`、`definesSymbol`、`referencesSymbol`、`calls`、`calledBy`、`ownsFile`、`entrypointFor` 等项目内部结构关系；不依赖 Recipe 知识库。 |
| `DocumentContextProvider` | README、AGENTS、package/docs metadata、llms-style context | 项目说明、使用边界、模块意图、文档证据。 |
| `FreshnessProvider` | source graph status、knowledge index status、project scan timestamps | `fresh` / `stale` / `partial` / `unknown` 判断。 |
| `RefRegistry` | 矩阵节点、知识条目、源码图节点、文档片段 | 稳定 detail refs，避免默认输出塞入长内容。 |
| `ContextBudgeter` | maxNodes、maxItems、maxRelations、maxChars、detailLevel | 排序、截断、去重、摘要化。 |

#### 支撑层职责收口

`ProjectKnowledgeContextLayer` 只服务这四个 MCP 工具：

- `alembic_project_matrix`
- `alembic_prime`
- `alembic_search`
- `alembic_graph`

它不服务 Guard、bootstrap、rescan、submit_knowledge、evolve、dimension_complete、decision_record、work_start、work_finish 等其他工具。其他工具可以读取自己的生命周期状态，但不能把这个支撑层变成全 MCP 总线。

支撑层应该提供五个内部只读查询能力：

| 内部能力 | 用途 |
| --- | --- |
| `resolveInteractionState(input)` | 复用现有 intent/session/work 状态，明确当前开发者意图、当前任务、工具计划、是否需要 prime/search/source graph。 |
| `resolveProjectMatrix(input, interaction)` | 汇总项目结构、全景、知识库分类摘要、结构热点和 refs；不做知识覆盖评估。 |
| `resolveKnowledgeRetrieval(input, interaction, matrix)` | 复用 PrimeSearchPipeline/searchEngine/resident search，返回搜索、详情或展开结果。 |
| `resolveProjectGraph(input, interaction, matrix)` | 汇总源码图、项目结构、依赖图、调用图关系；不读取 Recipe 知识库。 |
| `projectOutput(tool, operation, context)` | 统一输出 status、reason、summary、interaction、project、result、detailRefs、nextActions。 |

这些能力必须只读；任何生命周期写入、知识提交、staging promote、Guard 执行、work start/finish 都不属于该层。

#### 统一输入字段

四个公共工具应该共享同一组基础输入，再按工具增加少量专属字段。

基础输入建议命名为 `KnowledgeContextBaseInput`：

| 字段 | 类型/候选值 | 语义 |
| --- | --- | --- |
| `agentHost` | `claude-code` / `generic-host-agent` 等宿主中立枚举 | 调用宿主，只用于适配输出，不进入产品身份判断。 |
| `projectRoot` | string | 目标项目根。 |
| `inputSource` | `user-message` / `host-declared-intent` / `tool-result` / `source-ref` / `automation-envelope` | 输入来源。 |
| `intentKind` | `implementation-task` / `review-task` / `read-only-analysis` / `design-or-planning` / `status-only` / `unknown` | 当前意图类别。 |
| `query` | string | 语义查询。`userQuery` 可作为兼容输入名，但公共契约建议统一为 `query`。 |
| `activeFile` | string | 当前文件线索。 |
| `language` | string | 语言线索。 |
| `hostDeclaredIntent` | object | 宿主结构化意图。 |
| `hostTurnMeta` | object | 宿主回合元数据，原始 id 必须脱敏或只用于 hash。 |
| `sourceRefs` | string[] | 用户或宿主显式给出的非私密来源。 |
| `sourceGraphRef` | string | 源码图工具返回的图引用。 |
| `sourceEvidenceRefs` | string[] | 源码证据引用，不是源码正文。 |
| `intentRef` | string | 已有 `alembic_intent` 生成的意图引用。 |
| `matrixRef` | string | 项目矩阵引用。 |
| `primeRef` | string | prime 输出引用。 |
| `workRef` | string | 当前执行任务引用，只读使用，不创建或结束任务。 |
| `knowledgeRefs` | string[] | 知识条目引用。 |
| `nodeRefs` | string[] | 项目矩阵节点引用。 |
| `relationRefs` | string[] | 关系引用。 |
| `scope` | `workspace` / `project` / `domain` / `system` / `package` / `target` / `module` / `file` / `symbol` / `knowledge` | 查询范围。 |
| `include` | string[] | 请求包含的信息族，例如 `matrix`、`knowledgeCatalog`、`relations`、`sourceGraph`、`docs`、`inventory`、`hotspots`。 |
| `filters` | object | kind、language、category、status、nodeType、relationType 等过滤条件。 |
| `detailLevel` | `summary` / `standard` / `detail` | 默认 `summary`。 |
| `budget` | object | `maxNodes`、`maxItems`、`maxRelations`、`maxChars`、`maxDepth`。 |
| `freshnessPolicy` | `preferFresh` / `allowStaleSummary` / `failIfStale` | 新鲜度策略。 |

四个工具的专属输入：

| 工具 | 专属字段 |
| --- | --- |
| `alembic_project_matrix` | `operation=overview/node/relations/layers/sources/catalog`、`nodeId`、`nodeType`。 |
| `alembic_prime` | `intentRef`、`recognizedIntent`、`primeMode=auto/matrix-first/search-first`。 |
| `alembic_search` | `operation=search/get/expand`、`mode=auto/keyword/semantic/context`、`refId`、`kind`。 |
| `alembic_graph` | `operation=query/impact/path/stats/neighborhood`、`fromId`、`toId`、`direction`、`relationType`；`nodeType` 仅允许项目内部结构节点。 |

#### 统一输出结构

四个工具应该共享 `KnowledgeContextToolOutput`。默认输出必须是结构化对象；可读文本只做简短摘要。

建议顶层字段：

| 字段 | 语义 |
| --- | --- |
| `ok` | 工具业务是否成功。 |
| `status` | `ready` / `partial` / `degraded` / `blocked` / `failed`。 |
| `tool` | 当前工具名。 |
| `operation` | 当前操作。 |
| `summary` | 一句话结果摘要。 |
| `request` | 规范化后的输入摘要，隐藏敏感元数据。 |
| `project` | 项目身份、根路径摘要、语言/技术栈、新鲜度。 |
| `interaction` | 当前开发者与宿主 AI 的交互状态：intent、currentTask、session、toolPlan、active refs。 |
| `intent` | 识别出的意图摘要、confidence、scope。 |
| `result` | 工具专属主体结果。 |
| `inventory` | 知识库分类摘要、源码图/文档可用性摘要、项目结构摘要；不是知识覆盖评估。 |
| `relations` | 关键关系摘要或关系统计。 |
| `items` | 搜索结果、节点、知识条目或图节点的统一列表。 |
| `detailRefs` | 后续可读取的稳定引用。 |
| `sources` | 数据来源和 freshness，不放长正文。 |
| `diagnostics` | 压缩后的 degraded/blocked 原因。 |
| `nextActions` | 建议下一步工具调用。 |
| `meta` | contractVersion、responseTimeMs、budgetUsed、truncated。 |

四个工具的 `result.kind` 建议固定：

| 工具 | `result.kind` |
| --- | --- |
| `alembic_project_matrix` | `project-matrix` |
| `alembic_prime` | `prime-package` |
| `alembic_search` | `search-results` / `knowledge-detail` / `expanded-context` |
| `alembic_graph` | `relation-graph` / `impact-analysis` / `relation-path` / `graph-stats` |

统一输出规则：

- 所有工具都必须返回 `detailRefs`，让宿主按需展开。
- 所有工具都必须返回 `sources` 和 `freshness`，区分知识库事实、源码图事实、文档事实和推断。
- 所有工具都必须返回同一结构的 `interaction` 摘要，说明当前 intentRef、primeRef、workRef、currentTask、taskPhase、toolPlan 和 sourceGraph/knowledge 需求。
- 所有工具默认不返回完整源码、完整 Recipe、完整文件列表、完整图边。
- 所有工具都用同一套 `status/reasonCode/nextActions`，避免一个工具说 ready、另一个工具说 blocked。
- 如果返回 MCP `structuredContent`，必须和 output schema 对齐；`content` 只放一段适合人读的短摘要。

`interaction` 字段建议：

| 字段 | 语义 |
| --- | --- |
| `phase` | `idle` / `active` / `ended`。来自 `ctx.session.intent.phase`。 |
| `intentRef` | 当前可消费意图引用，没有则为 null。 |
| `primeRef` | 当前 prime 引用，没有则为 null。 |
| `workRef` | 当前执行任务引用，没有则为 null。 |
| `currentTask` | taskId、taskTitle、scopeFiles 摘要。 |
| `recognizedIntent` | query、action、target、language、confidenceBand。 |
| `toolPlan` | primeNeed、knowledgeNeed、sourceGraphNeed、guardNeed、workNeed、decisionNeed。 |
| `session` | toolCallCount、toolsUsed、lastActivityAt、searchQueries 摘要。 |
| `status` | `ready` / `partial` / `degraded` / `blocked`，由 intent freshness、project scope、knowledge/source graph freshness 共同决定。 |

#### 支撑层调用关系

```text
MCP tools/list
  ├─ alembic_project_matrix ─┐
  ├─ alembic_prime          ─┼─ ProjectKnowledgeContextLayer
  ├─ alembic_search         ─┤
  └─ alembic_graph          ─┘

ProjectKnowledgeContextLayer
  ├─ InteractionStateProvider
  ├─ ProjectScopeProvider
  ├─ ProjectStructureProvider
  ├─ ProjectPanoramaProvider
  ├─ KnowledgeProvider
  ├─ ProjectGraphProvider
  ├─ DocumentContextProvider
  ├─ FreshnessProvider
  ├─ RefRegistry
  └─ ContextBudgeter / OutputProjector
```

#### 落地原则

- 四个公共工具只负责选择视图和操作，不各自拼数据。
- `ProjectKnowledgeContextLayer` 负责数据融合、去重、排序、预算、freshness、refs 和统一 output。
- `InteractionStateProvider` 必须复用现有 intent/session/work 状态；禁止新增独立“当前任务”真源。
- `alembic_prime` 继续是交互状态进入知识上下文的首选入口，但四个工具都可以读取 `interaction` 摘要。
- 旧 `structure`、`panorama`、`knowledge` handler 不再作为公共 MCP 入口保留；可短期作为内部 provider 迁移来源。
- 新 schema 应从共享 base input 组合出来，避免四个工具各自维护 `projectRoot/query/sourceRefs/detailLevel/budget`。
- 新 output projector 应从共享 `KnowledgeContextToolOutput` 派生，避免四个工具各自定义白名单。

### 推荐操作

| operation | 职责 | 默认输出 |
| --- | --- | --- |
| `overview` | 返回项目矩阵总览。 | 层级摘要、模块矩阵、知识库分类摘要、结构热点、detail refs。 |
| `node` | 查看某个矩阵节点。 | 节点职责、父子关系、依赖、关键 source refs。 |
| `relations` | 查看节点关系。 | 关系类型、方向、重要性、证据来源。 |
| `catalog` | 查看知识库分类摘要。 | 知识类型、分类、主题、代表性 refs；不判断覆盖缺口。 |
| `layers` | 查看架构层级。 | C4 风格层级、Backstage 风格实体、Alembic 推断层的映射。 |
| `sources` | 返回矩阵构建证据。 | 本地结构扫描、源码图、知识库、配置文件、README/AGENTS 等来源摘要。 |

### 推荐输出契约

默认输出必须紧凑，不返回完整文件列表、完整源码、完整 Recipe 内容或完整图谱边集。

建议顶层字段：

| 字段 | 语义 |
| --- | --- |
| `ok` | 调用是否成功。 |
| `status` | `ready` / `partial` / `stale` / `blocked`。 |
| `project` | 项目根、识别状态、主要语言、技术栈摘要。 |
| `hierarchy` | 层级定义和每层节点计数。 |
| `matrix` | 默认最多 N 个关键节点，按层级和重要性排序。 |
| `inventory` | 知识库分类、源码图可用性、文档可用性和项目结构摘要。 |
| `relations` | 关键关系摘要，不展开全图。 |
| `hotspots` | 高耦合、循环依赖、知识缺口、未识别模块。 |
| `detailRefs` | 后续读取入口，例如 nodeRef、sourceGraphRef、knowledgeRef。 |
| `nextActions` | 建议下一步工具调用。 |
| `sources` | 构建矩阵所用证据类型与新鲜度。 |

参数建议：

| 参数 | 语义 |
| --- | --- |
| `operation` | `overview` / `node` / `relations` / `layers` / `sources` / `catalog`。 |
| `scope` | `workspace` / `project` / `domain` / `module` / `target` / `file`。 |
| `nodeId` | `node` 或 `relations` 查询时使用。 |
| `maxNodes` | 默认矩阵节点预算。 |
| `maxDepth` | 关系/层级深度预算。 |
| `include` | 可选 `knowledgeCoverage`、`sourceGraph`、`docs`、`apiEdges`、`riskHotspots`。 |
| `freshnessPolicy` | `preferFresh` / `allowStaleSummary` / `failIfStale`。 |

### 外部资料对齐

本议题需要借鉴外部资料，但不应让工具默认联网。推荐把联网研究作为 Design / Controller 的方案依据，或作为显式授权的 research mode，而不是每次项目矩阵查询都访问网络。

已纳入设计参考的方向：

- MCP 官方 Tools 规范强调工具通过 `tools/list` 暴露名称、描述和 schema，工具名需要唯一且 schema 明确；因此项目矩阵工具要有清楚的 tool description、input schema 和 output schema，而不是靠长文本解释职责。
- MCP Resources 规范说明资源适合暴露只读上下文；项目矩阵的 detail refs 后续可考虑映射为资源 URI，让默认工具调用只返回索引和摘要。
- C4 Model 提供软件系统、容器、组件、代码的层级抽象，适合作为项目矩阵的架构层级参考。
- Backstage Software Catalog 提供 Component、API、Resource、System、Domain 等实体和 `partOf`、`dependsOn`、`providesApi`、`consumesApi` 等关系语义，适合作为矩阵关系命名参考。
- Aider repo map 的主流实践是给 AI 一个简洁仓库地图，只放关键类、函数和签名，并通过图排名在 token 预算内选择最重要上下文；这支持 Alembic 项目矩阵默认精简、按需展开的方向。
- GraphRAG 和 RAPTOR 都支持“先建立层级/图结构，再按查询取不同抽象层级”的思想；Alembic 项目矩阵也应该提供 overview 到 node/detail 的渐进披露，而不是一次返回全量。
- Readme_AI 和 `llms.txt` 方向说明项目/文档所有者提供结构化上下文元数据有助于降低幻觉；Alembic 可以把 AGENTS、README、package metadata、知识条目、源码图汇总成机器可读矩阵。

参考来源：

- MCP Tools specification: `https://modelcontextprotocol.io/specification/2025-11-25/server/tools`
- MCP Resources specification: `https://modelcontextprotocol.io/specification/2025-06-18/server/resources`
- C4 Model: `https://c4model.com/`
- Backstage System Model: `https://backstage.io/docs/features/software-catalog/system-model/`
- Backstage Well-known Relations: `https://backstage.io/docs/features/software-catalog/well-known-relations/`
- Aider Repository Map: `https://aider.chat/docs/repomap.html`
- GraphRAG documentation: `https://microsoft.github.io/graphrag/`
- RAPTOR paper: `https://arxiv.org/abs/2401.18059`
- Readme_AI paper: `https://arxiv.org/html/2509.19322v1`
- llms.txt proposal: `https://github.com/answerdotai/llms-txt`

### 迁移建议

后续如果进入实现，推荐分三步：

1. 事实扫描：列出 `alembic_structure`、`alembic_panorama`、`alembic_knowledge`、`alembic_graph`、源码图工具之间的字段重叠、调用链、测试覆盖和真实消费者。
2. 新目录开辟：在 AlembicPlugin 新建 `lib/service/project-knowledge-context/`，把 contracts、layer、interaction、project、retrieval、evidence、support 放到同一统一实现边界。
3. 索引快照与编排：建立 `ContextIndexSnapshot`、`RetrievalPlanner`、`EvidenceAndFreshness`、`Budgeted Projection`，形成可重建派生摘要、分域 freshness、统一 retrievalTrace 和预算投影。
4. 交互状态复用：抽取 `interaction/InteractionStateProvider`，复用 `HostIntentFrame`、`IntentExtractor`、`TaskLifecyclePolicy`、`ctx.session.intent`、`INTENT_RECORDS`、`WORK_RECORDS`，形成统一 `interaction` 投影。
5. 成熟能力迁入：把 search handler 的 resident/fallback/slim/byKind、structure 的 targets/files/metadata、panorama 的 overview/module/health、source graph/call graph 关系能力迁入新目录提供者；新目录成为业务真源，不做薄包装；panorama gaps 不作为知识覆盖能力迁入。
6. 支撑层落地：在新目录建立 `ProjectKnowledgeContextLayer`，接入 project scope、structure、panorama 只读能力、knowledge search、project graph、source graph、docs metadata。
7. 统一契约：新增共享 `KnowledgeContextBaseInput`、四个工具专属 input extension、共享 `KnowledgeContextToolOutput` 和 output projector。
8. 新工具落地：新增只读 `alembic_project_matrix`，默认从支撑层输出紧凑矩阵、interaction 和 detail refs。
9. 搜索工具扩展：让 `alembic_search` 支持 `search`、`get`、`expand` 或等价操作，承接 `alembic_knowledge list/get` 的公共读取语义。
10. Recipe 检索增强：在 `KnowledgeRetrievalProvider` 下建立 `RecipeCandidateProvider`、`RecipeRelationChainProvider`、`VectorRerankProvider`，形成广召回、关系链扩展、向量/混合检索、多信号重排、whyMatched/scoreBreakdown/detailRefs 输出。
11. 图工具扩展：让 `alembic_graph` 只支持项目内部结构节点之间的统一关系查询，成为 `project_matrix` 和 `prime` 的项目结构 relation detail provider；Recipe/知识条目关系不进入 graph。
12. Prime 收敛：让 `alembic_prime` 调用支撑层的 interaction/matrix/search/graph 汇总，不再直接拼接独立 search/pipeline 输出；PrimeSearchPipeline 仍作为成熟检索 provider，并复用 Recipe 候选池与关系链解释。
13. MCP 描述和 Skill 同步：更新 `tools/list` description、schema 字段 description、只读 annotations、structured output 摘要、README、内置 skills、打包 skills、project skill templates 和 nextActions；四工具说明必须共同表达什么时候用、关键参数、非目标、detail refs 和 degraded/partial 语义。
14. 旧工具清理：`alembic_structure` 和 `alembic_panorama` 从正常 MCP tools/list、文档推荐、Skill 推荐和 nextActions 中移除；`alembic_knowledge` 的公共 list/get 读取能力并入 search；`insights` 和 `confirm_usage` 不包含在本需求中，暂时不考虑。
15. 治理迁移：`governance_cycle`、`decay_report`、`staging_check`、`enhancement_suggestions` 不再挂在项目地图工具下，迁出到知识生命周期、rescan/evolve 或明确 admin 工具。

### 验证候选

- 必须按 `alembic_graph`、`alembic_search`、`alembic_prime`、`alembic_project_matrix` 顺序验证真实 Alembic 空间项目；前一工具失败，不进入后一工具。
- 每个工具都必须保留真实 MCP 调用输入、structured output、人工质量评估、问题清单和修复建议。
- 每个工具都要评估准确性、价值、精简性和职责边界；不能返回冗余、无关、重复、过长或职责外内容。`alembic_project_matrix` 还必须确认未输出知识覆盖评估。
- 完整验证通过才算本需求完成；schema 单测、mock、fixture 或静态输出不能替代真实项目 MCP 调用验收。
- 默认 `alembic_project_matrix(operation=overview)` 在大型仓库中仍能一屏判断项目层级、关键模块、知识库分类摘要、结构概貌和下一步。
- `overview` 不返回完整文件列表、完整源码、完整 Recipe 或完整图边。
- `node` 能从一个矩阵节点跳转到源码图、知识条目、文件和关系详情。
- `catalog` 能明确说明知识库分类、主题、条目类型和代表性 refs；不输出模块缺知识结论。
- `staging_check`、promote、知识生命周期状态迁移不在项目矩阵工具中出现。
- 输出包含结构化 schema，可被两个宿主平台稳定解析。
- MCP `tools/list` 描述、schema 字段说明、annotations、Skill/README/nextActions 能正确指导宿主 AI 使用四工具，且不再推荐旧公共工具、`confirm_usage` 或 Recipe graph 语义。
- 对同一项目运行前后，排序、节点 ID 和 detail refs 稳定，便于后续测试和回归。
- MCP tools/list 的默认公共知识读取面只暴露 `alembic_project_matrix`、`alembic_prime`、`alembic_search`、`alembic_graph`。
- 旧 `alembic_structure`、`alembic_panorama` 不再作为正常公共入口出现，也不保留兼容层；若发现真实消费者，应迁移消费者后删除旧公共入口。
- `alembic_search` 能通过 ref/id 读取搜索结果详情，替代 `alembic_knowledge get/list` 的公共读取用途。
- `alembic_search` 能展示 Recipe 候选池收敛证据，包括 whyMatched、scoreBreakdown、可展开 relationChains、vector/resident 使用状态和降级原因。
- `ContextIndexSnapshot` 能显示 project map、knowledge catalog、Recipe relation、source graph、vector status 的派生摘要，并且所有摘要都有稳定 detailRefs。
- `RetrievalPlanner` 能按不同意图稳定选择 matrix-first/search-first/graph-first/prime-orchestrated 路径，并返回 retrievalTrace。
- `EvidenceAndFreshness` 能分域标记 project/knowledge/recipeRelation/vector/sourceGraph/document/runtime 的 freshness 和 degraded 原因。
- `Budgeted Projection` 能证明默认输出摘要优先、引用展开，条目数量、正文片段、关系链 hops、matrix 节点和 nextActions 都受预算约束。
- 四个公共工具的 input schema 共享基础字段，专属字段只表达工具差异。
- 四个公共工具的输出都符合同一个 `KnowledgeContextToolOutput` 契约。
- 支撑层能在 knowledge、project structure、semantic relations、source graph、docs 任一数据源缺失时返回 `partial/degraded`，而不是伪造 ready。
- 四个公共工具都能返回一致的 `interaction` 摘要，明确当前执行任务、intentRef/primeRef/workRef、工具计划和状态来源。
- `interaction.currentTask` 必须来自现有 session/work 状态，不能由 project matrix/search/graph 临时推断。

## 后续需求设计候选

如果用户测试反馈足够具体，后续可以形成一份正式 requirement design，至少回答：

- 知识库 MCP 工具的最小职责集合是什么。
- 每个工具默认输出和详情输出的边界是什么。
- 哪些字段必须结构化返回，哪些只适合放在可读摘要中。
- 搜索、读取、结构、图谱、提交之间如何分工，避免重复和噪声。
- 空库、过期、失败、部分成功状态如何表达。
- 如何验证优化后工具能服务双平台宿主 AI，而不是绑定单一平台语义。
- 哪些旧字段、旧命名或旧行为可以直接删除；真实消费者不作为保留兼容层的理由，而是后续修复对象。

## 验收候选

后续如果进入实现，建议验收至少覆盖：

- 每个调整过的知识库 MCP 工具都有真实调用样例和结构化输出样例。
- 真实调用必须使用已建立的 Alembic 空间级知识库和真实分仓库数据；不得用 mock、空库或静态 fixture 替代最终验收。
- 验证不包含仓库删除、知识库删除、索引清空或破坏性重置操作。
- 默认返回内容足够精简，能够支持代理下一步行动。
- 详情内容可通过明确入口获取，不依赖在默认响应里堆积长文本。
- 搜索结果可解释、可追溯、可定位到知识条目或来源。
- 错误和空状态能说明原因、影响和可恢复下一步。
- 返回文案保持宿主中立，不绑定单一平台命名。
- 不把源码图、运行时状态或诊断数据混入知识库工具的默认语义。

## 给用户的测试反馈格式

后续可以直接按下面格式贴反馈，Design 会继续追加整理：

```text
工具：
测试输入：
实际返回：
我认为的问题：
我希望改成：
是否影响继续测试：
```

## 总控接收建议

本 intake 已形成正式 requirement design 和需求组拆分：

- Requirement design: `alembic-knowledge-context-four-tools-requirement-design-2026-06-14.md`
- Requirement group: `alembic-knowledge-context-four-tools-requirement-group-2026-06-14.md`

用户已确认总控可按需求组 K0-K9 接收，不再从本 intake 表中直接派发实现。第一步应是 K0 read-only code fact and consumer inventory，推荐由 AlembicPlugin 窗口只读执行，总控接收判断。旧公共工具按硬删除处理；若 K0 发现真实消费者，后续任务应修复消费者和测试，不保留兼容层。K8 真实 MCP 验证必须直接使用已建立的 Alembic 空间级知识库和真实分仓库数据，不做仓库删除或知识库删除操作。
