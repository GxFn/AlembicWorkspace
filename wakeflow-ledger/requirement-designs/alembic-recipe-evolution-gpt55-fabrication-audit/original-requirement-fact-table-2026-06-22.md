# Alembic Recipe Evolution 原始需求事实表

Date: 2026-06-22
Status: source-fact-only / not a dispatch package / not an implementation judgment

## Scope

本文件只固化原始需求事实，用来纠正后续审计顺序。它不是修复方案、不是新派发包、不是验收结论，也不替代 Wakeflow state root。

事实来源仅限两份 Design 原始文档：

- `Design/docs/current/alembic-recipe-evolution-optimization-workspace-handoff-2026-06-21.md`
- `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`

引用约定：

- `H:n-m` = handoff 文档第 n-m 行。
- `R:n-m` = requirement design 文档第 n-m 行。

## Reading Rule

1. 先读原始需求，再读实现。
2. 原始需求事实与实现偏差必须分开记录。
3. 原始需求没有写的概念，不得被包装成用户要求。
4. 原始需求中存在歧义的词，只能标成待确认或待实现对照，不能直接解释成某种实现语义。
5. `recommendation` / `推荐` 只能按原文场景归位，不得移植到 Plan 权威语义里。

## Top-Level Original Facts

| ID | Source | 原始需求事实 | 不能推出 |
| --- | --- | --- | --- |
| F-001 | H:11-14, R:11-16 | 核心目标是把项目信息、设计模式、架构约定系统化转换成 Recipe；脊柱是 ProjectContext 为源、全局 Plan 为脊/心脏、Recipe 为产物；Plugin 先做，完成后 Alembic 主体作为 follow-on。 | 不能把本需求缩成局部推荐、局部排序、空壳工具或单纯迁移目录。 |
| F-002 | H:22-32, R:18-25 | 用户确认了 6 项系统化要求和早前 8 项细目，包含分析计划 Agent、全局 Plan 驱动三段、创建期使用 ProjectContext、统一进化、主体 follow-on、green-field、提交驱动、rename 修复、逻辑提案、source_refs/向量时机、rescan 重定位、向量可用性、新模块 Recipe 推荐、新区域扫描。 | 不能只实现其中一个子点就称完整需求完成。 |
| F-003 | H:26-29, R:108-112, R:417-421 | 已决：Q1 统一进化；Q2 混合规划，Plugin 收集真实信息，宿主/内置 Agent 精化决策；Q3 green-field 全量整合；Panorama 编排退场但有价值分析重建为独立项目信息能力。 | 不能让 Plugin 以启发式或推荐分数替代 Agent 决策；不能保留 Panorama 编排当新规划层。 |
| F-004 | H:34-36, R:84-99 | 最终验收必须同时覆盖：alembic_plan 可用、Plan living ledger、真实信息非臆测、Plan 驱动三段、创建期锚 ProjectContext、统一进化、时机修复、向量隔离、green-field、主体可移植、跨仓回归、BiliDili 测试模式验收。 | 不能用单测绿、接口存在、或局部链路成功替代最终完成定义。 |
| F-005 | H:40-45, R:423-430 | Requirement design 已完成并经用户确认；代码事实充分但 RG-0 仍需核实现实实现期事实。 | 不能以“需要 RG-0 事实核实”为理由改写确认过的目标。 |
| F-006 | H:48-50, R:328-350 | 推荐控制器建立状态根并按 RG-0~10 自动推进；阶段候选明确，执行序 A -> B -> C -> D -> E -> F；B 是 C 真实前提，C 是 D 硬前置。 | 不能跳过 B 直接做 C 的薄壳，也不能先做 D 再补 Plan。 |
| F-007 | H:61-71, R:140-150 | 仓库边界：AlembicPlugin 主实现；AlembicCore 参与且份量大；Alembic 主体 follow-on；Test 负责 BiliDili 真实项目验收；Wakeflow 只做控制、派发、验收。 | 不能把主体实现纳入本需求，也不能把 Test 当作替控制器找已知问题的默认队列。 |
| F-008 | H:90-95, R:390-415 | 非目标和不变量：不重建 daemon/常驻 watcher；不改四工具对外 MCP 业务语义；不删证据/提案/向量结构；Plan 不双写；不做大规模 Recipe 质量评估。 | 不能通过删除既有结构、修改四工具语义、或引入常驻进程来换取完成。 |

## Plan Function Facts

| ID | Source | Plan 原始需求事实 | 不能推出 |
| --- | --- | --- | --- |
| P-001 | R:51-54, R:218-219 | Plan 是真实代码和 Recipe 的持久化桥梁/账本，是体系心脏；`alembic_plan` 是规划 Agent 角色的对外接口和 living ledger。 | Plan 不是一次性建议列表、不是推荐排序容器、不是仅用于展示的 summary。 |
| P-002 | R:55-59, R:154-156, R:253-254, R:421 | Plan 不自己猜逻辑。Plan 收集真实项目信息、动态信号、内置 SOP、领域信息、工具菜单，交内置 Agent 角色决策领域、规模、要执行哪些进化/分析 MCP 工具及顺序。Plugin 不做启发式臆测。 | 不能把 Plugin 计算的 top/recommended 结果当作 confirmed Plan 权威；不能用语言单因子或静态启发式代替 Agent 决策。 |
| P-003 | R:58 | 所有“计划”本质上是执行哪些 MCP 工具、领域、规模、顺序的执行计划。 | Plan 不是只列维度名称；也不是只选择几个推荐项。 |
| P-004 | R:61-66, R:231-250, R:301-303 | Plan 有两层：制定层 `intent` 持久到新 `plans` 表；补齐层 `generation-state` 读时从 DB 投影，来源包括 `knowledge_entries`、`recipe_source_refs`、`evolution_proposals`、`lifecycle_transition_events`，不双写。 | 不能把 coverage/codeRecipeMapping/changeLog 作为独立持久真相重复写入 Plan；也不能缺失投影视图。 |
| P-005 | R:64-67, R:88-91, R:161, R:184, R:199, R:420 | Plan 生命周期持续更新：init 制定完整 Recipe 生成计划；三段通过 Plan 生成补齐 Recipe 并写 DB；代码变更通过进化更新 codeRecipeMapping、提案、映射和 Plan 投影。任意时刻 Plan 应反映 code -> Recipe 的计划与覆盖。 | 不能只在 init 时生成一次，之后不随生成/进化更新；不能把 Plan 做成静态推荐。 |
| P-006 | R:69, R:88, R:219, R:337-338, R:405, R:419 | Confirmed Plan 是 cold-start/bootstrap、deep-mining/rescan、module-mining 的硬前置。没有 confirmed Plan 时 bootstrap 返回门禁块指向 `alembic_plan`，必须 draft -> confirm 后才执行三段。 | 不能允许三段绕过 confirmed Plan；不能把 Plan 缺失降级为 warning 后继续生成。 |
| P-007 | R:221-227, R:229 | `alembic_plan` 操作集为 `draft`、`confirm`、`get`。`draft` 由 Plugin 收集真实信息并存 pending；`confirm` 由内置 Agent 决策并存 active confirmed；`get` 返回 active Plan。Confirm 输入包括 `plan` 载荷、`basePlanId/version`、可选 `rationale`。 | 不能新增不在原文中的主流程操作来代替 draft/confirm/get；不能把 draft 直接等同 confirmed。 |
| P-008 | R:231-242 | Plan intent 结构包括 planId/version/status/projectContextSignature/lastUpdatedFromCommit/createdBy/intentChangeLog、projectProfile、dimensions、scale、moduleBindings、stages、draftSource、draft-only planningBrief。 | 不能省略 per-module binding、stage plan、projectContextSignature 等核心字段；不能把 `planningBrief` 当 confirmed intent 的长期权威字段。 |
| P-009 | R:237-240, R:262 | `dimensions` 有 `priority(排名)`、rationale、stage、targetRecipes；`moduleBindings` 也有 priority；confirm 载荷模型含 `selectedDimensions`、scale/budget、plannedNextActions、rationale。 | 原文的 priority/selectedDimensions 是 Plan intent/confirm 结构语义，不等于“top 推荐位”；不能把它改写成推荐榜单语义。 |
| P-010 | R:253-254, R:260-266 | Draft 信息包复用 MissionBriefing、OnboardingContract、DimensionTask、sopPack、DomainPlaybook，并注入 B 阶段真实信号；confirm 用 graph/recipe_map 校验相关性。 | 不能另造脱离现有结构的抽象；不能跳过 B 阶段真实信号。 |
| P-011 | R:255-257 | Confirmed Plan 是三段唯一消费源；bootstrap 读 coldStart，rescan 读 deepMining，module-mining 读 moduleBindings；ProjectContext 不全可产生部分草稿并标记，但宿主不 confirm 则无法 bootstrap。 | 不能在 ProjectContext 不全或无确认时静默继续完整生成。 |
| P-012 | R:167-173 | Plan 失效处理：confirmed 后代码变，Plan 带 projectContextSignature，每阶段入口比对，不符提示重 plan；full-reset 不得清 `plans` 表；rescan/module-mining 需要 lease 和 rescanId/epoch 幂等；空维度给 selectionWarning。 | 不能默默用旧 Plan；不能 full-reset 清掉 intent；不能忽略并发/重入/空维度边界。 |
| P-013 | R:355-359, R:364 | 测试模式仍在 confirmed Plan 上运行，只是选取子集维度、缩减规模、可选单模块范围，走 scoped 扫描生成，不全量 cold-start，不绕过 grounding/不猜原则。BiliDili 验收里 confirm 可选子集和小规模用于测试模式链路。 | 测试模式的子集不能反推生产 Plan 只应是子集推荐；不能用测试模式缩范围改写“init 制定完整生成计划”。 |
| P-014 | R:346-348, R:407 | B 阶段是 C 阶段真实前提；不补齐理解能力，Agent 只有语言单因子即退回猜，违背核心原则。 | 不能先做 `alembic_plan` 壳，再让它基于不足信息产生“看似合理”的计划。 |

## Recommendation / Top Word Facts

| ID | Source | 原文出现位置 | 原始语义 |
| --- | --- | --- | --- |
| T-001 | R:21, R:92, R:175-176 | “推荐宿主使用 ProjectContext 相关 MCP” / “主动推荐/引导宿主用 ProjectContext MCP”。 | 创建期引导宿主用 ProjectContext MCP 取证，不是 Plan 维度推荐榜。 |
| T-002 | R:22, R:108, R:179 | “去掉单独的固定包/推荐路径”。 | 推荐不能是单独旁路；新增/保鲜/维护应归入统一进化管道。 |
| T-003 | R:25, R:42, R:93, R:111, R:122, R:134, R:136, R:138, R:180, R:189, R:323, R:342, R:366 | “新模块 Recipe 推荐”，既荐已有也荐新建；新模块/新目录触发区域扫描并产生候选/推荐。 | 推荐属于统一进化里的新模块区域扫描场景，不属于 `alembic_plan` 的权威计划语义。 |
| T-004 | R:403 | 风险 R7：区域扫描/推荐可能被低估或有噪声，推荐按规模/覆盖阈值触发、可选提示。 | 这是新模块推荐噪声风险，不是 Plan 中心功能定义。 |
| T-005 | R:274 | 原文中 `top` 只作为 `topAreas` 出现在 ProjectContext 已抽取字段列表里。 | 没有原文要求把 Plan 实现成 top-N 或 recommended/top 位置。 |
| T-006 | R:237, R:239, R:262, R:364 | 原文有 `priority(排名)`、`selectedDimensions`、测试模式 confirm 选子集。 | 这些词属于 Plan intent 或测试模式子集，不是“推荐/top”产品语义；若实现把它转成 recommended/top，需要逐项对照判定。 |

## Phase And Repository Facts

| ID | Source | 原始需求事实 | 不能推出 |
| --- | --- | --- | --- |
| PH-001 | H:101-115, R:328-350 | RG-0~10 按 A-F 推进：RG-0 骨架+别名+迁移序；RG-1/RG-2 理解能力；RG-3 plans 表 + alembic_plan；RG-4/RG-5 Plan 驱动三段和 ProjectContext 锚；RG-6/RG-7/RG-8 向量/时机/统一进化；RG-9/RG-10 收口和验收。 | 不能把阶段候选拆成改变依赖顺序的执行包。 |
| PH-002 | R:334-337 | RG-1/RG-2 要在 Core 补齐 DomainSignalDetector、ArchitectureStyleClassifier、ComplexityAnalyzer，重建 Panorama 有价值分析为独立能力，改造 resolveActiveDimensions，提供 planning aids/DynamicSignalGateway/ModuleDelta。 | 不能只在 Plugin 里写 Plan 工具而没有真实项目信号来源。 |
| PH-003 | R:338-344 | RG-4/RG-5/RG-8 依赖已确认 Plan：三段读 confirmed Plan intent + state 投影；创建期锚 ProjectContext；提交驱动统一进化写 DB -> Plan 投影。 | 不能让三段各自保留旧局部 plan 并称全局 Plan 已接入。 |
| PH-004 | R:352-369 | RG-10 必须在 BiliDili 真实 Swift 项目跑测试模式 4 步链：规划真实性、scoped 生成、提交驱动进化、向量降级。 | 不能用 mock 或非真实项目替代这个验收；也不能用测试模式证明全量质量。 |
| PH-005 | R:371-379 | Validation 包括控制器自验、Plugin/Core 构建测试、Test handoff；真实场景必要原因是规划合理性、commit/rename、create 即时检索、降级依赖真实项目/git/向量。 | 不能把“Recipe 质量提升”作为本需求验收项。 |

## Ambiguity Register

这些项在原文中需要谨慎对照，不能直接按某一实现偏好解释。

| ID | Source | 原文事实 | 必须避免的跳跃 |
| --- | --- | --- | --- |
| A-001 | R:62, R:88, R:253-254, R:262 | 原文同时说 Plugin 确定性草稿、宿主/内置 Agent 精化确认，并说 confirm 载荷模型含 selectedDimensions。 | 不能把 Plugin 草稿解释成最终权威；也不能把 selectedDimensions 直接解释成推荐 top 列表。 |
| A-002 | R:64, R:88-90, R:355-359, R:364 | 原文要求 init 制定完整 Recipe 生成计划，同时测试模式可在 confirmed Plan 上选子集维度和小规模运行。 | 不能用测试模式子集覆盖完整 Plan 需求；也不能禁止测试模式缩范围。两者层级必须分清。 |
| A-003 | R:241, R:253, R:260-261 | `planningBrief` 是 draft 信息包/交 Agent 的材料，Plan intent 里标注为 draft-only。 | 不能把 planningBrief 作为 confirmed Plan 的持久权威字段。 |
| A-004 | R:403 | 原文说推荐按规模/覆盖阈值触发、可选提示。 | 该句只在 R7 区域扫描/推荐风险下出现，不能迁移到 Plan 规划层作为全局推荐机制。 |
| A-005 | R:274 | `topAreas` 是 ProjectContext 现状字段。 | 不能把 `topAreas` 的 `top` 泛化成 Plan top-N 语义。 |

## Implementation Comparison Gate

进入实现对照前，必须逐项检查下列问题，且每项都要绑定代码位置与原文行号：

1. 代码里的 Plan 是否是 confirmed authoritative complete plan，还是被实现成 recommended/top/候选列表。
2. `draft` 是否只收集真实信息并交 Agent，还是 Plugin 自己做了启发式决策。
3. `confirm` 是否由 Agent 提交完整 plan 载荷，还是自动采纳 draft/top 结果。
4. `plans` 是否只持久 intent，generation-state 是否读时从 DB 投影。
5. 三段入口是否硬检查 confirmed Plan，且无 Plan 时阻断并指向 `alembic_plan`。
6. B 阶段真实信号和 planning aids 是否实际存在并被 draft/confirm 使用。
7. 测试模式是否只缩小执行范围，而没有篡改完整 Plan 语义。
8. “推荐”是否仅存在于创建期 ProjectContext 引导和新模块区域扫描/统一进化，不进入 Plan 权威语义。
9. 任何 `recommended*`、`top*`、ranking、score、suggestion 字段都必须证明来自原文对应场景；否则进入偏差清单。

## Current Discipline

本事实表完成前，不应继续创建派发包、修复包或审计结论。下一步只能是基于本表读取真实代码和已新增代码，逐条做“原文要求 vs 实现事实 vs 偏差性质”对照。
