# AlembicPlugin Recipe 生成体系系统化重构（ProjectContext → Plan → Recipe）Requirement Design

Date: 2026-06-21
Status: confirmed（核心目标 + 8 项 + Q1-Q3 + PD-A~D + 三段模型 全部用户确认 2026-06-21；ready for handoff）
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-recipe-evolution-optimization-2026-06-21

## Confirmed Goal

**核心目标：把项目信息、设计模式、架构约定 → 系统化地转换成 Recipe。**

以 ProjectContext 为源、全局 Plan 为脊、Recipe 为产物，重建 AlembicPlugin 的 Recipe 生成体系：新建"分析计划 Agent 角色"
从全面项目信息产出合理的**维度与规模**全局 Plan，驱动冷启动 / 深度挖掘 / 单模块挖掘三段；所有创建阶段锚定 ProjectContext MCP；
git 驱动的新增/保鲜/维护统一收敛进"进化"；向量能力独立隔离并提供标准可用性接口；允许 green-field 新建文件夹完整建设并迁移。
**Plugin 先做，完成后作为 Alembic 主体的后续新需求。**

用户 8 项目标 + 6 项系统化要求（2026-06-21）：
1. 建立 ProjectContext，新建**分析计划 Agent 角色** → 产出合理**维度与规模**。
2. 基于全局 Plan（维度+规模）驱动**冷启动 + 后续深度挖掘 + 单模块/文件夹挖掘**。
3. **所有 Recipe 创建阶段推荐宿主使用 ProjectContext 相关 MCP**。
4. git 分析出的新增+陈旧 → **统一进化**承载（新增+保鲜+维护；去掉单独的"固定包/推荐"路径）。
5. **Plugin 完成后作为 Alembic 主体的新需求**（设计需可移植主体）。
6. 允许 **green-field**：按新功能新建文件夹/重命名，在新文件夹完整建设并迁移。
（早前 8 项细目——提交驱动进化 / rename 自动修复 / 逻辑变更提案 / 向量+source_refs 时机 / rescan 重定位 / 向量隔离+可用性 / 新模块 Recipe 推荐 / 新区域扫描——全部收编进下方脊柱。）

## 系统脊柱（重构后架构）

```
ProjectContext + 独立项目信息补充能力（源：全面项目信息）
        │
   [规划 Agent 角色]  ← 新增（混合：Plugin 确定性草稿 + 宿主 Agent 精化）
        │  产出全局 Plan = 维度排序 + 规模/预算 + per-module 绑定 + 分阶段计划
        ▼
   Plan 驱动三段
        ├─ 冷启动 = 初始全量基线（按 Plan 广度）
        ├─ 深度挖掘(rescan) = 冷启动之后的深化（按 Plan 深化）
        └─ 单模块/文件夹挖掘 = scoped 区域扫描（按 Plan 模块绑定；新模块检测触发）
        │  ┌── 所有创建阶段全程锚定 ProjectContext MCP（recipe_map/graph/search/prime）
        ▼
   进化（统一保鲜，commit 驱动 HEAD-compare）
        = 新增（新模块→区域扫描+Recipe 推荐[既荐已有也荐新建]）
        + 保鲜（rename/move 自动修复指向、source_refs/向量即时更新）
        + 维护（逻辑变更附加提案、decay）
        │
   向量能力（独立隔离 + 标准可用性接口）贯穿创建/检索/进化
        │
   green-field 子系统 lib/recipe-generation/（完整建设 + 分阶段迁移；可移植主体）
```

## Plan 的中心定位（用户 2026-06-21 升级）

**Plan = 真实代码 ↔ Recipe 的持久化桥梁/账本（living ledger）**，不再只是一次性分析计划——它负责管理"真实代码 → Recipe 的抽象"，是整个体系的**心脏**（不只是脊柱头）。

**核心原则（用户 2026-06-21）：Plan 不自己猜逻辑——收集真实信息交内置 Agent 决策。**
- **Plan = 真实信息收集器**：汇集 ① 真实项目信息（ProjectContext 静态结构）② 动态信号（新模块、Recipe 进化/衰退提案、覆盖缺口——**这些也算项目信息**）③ **内置 SOP**（sopPack / DOMAIN_PLAYBOOKS）④ **领域信息**（25-dim DimensionRegistry）。
- **内置 Agent 角色决策**：Plan 把收集的真实信息 + 可用领域/工具菜单交给内置 Agent 角色（SOP 定义、宿主模型扮演），由 Agent 决定**哪些领域、多大规模、执行哪些进化/分析 MCP 工具**——**不由 Plugin 启发式臆测**。
- **Plan ↔ Agent 交互**：Plan 收集 → 交 Agent → Agent 定计划（跑哪些 MCP 工具 / 领域 / 规模 / 顺序）→ 写回 Plan。所有"计划"本质 = **执行哪些 MCP 工具**的执行计划。
- **理解能力补齐**：若当前"理解项目信息"的能力（ProjectContext 抽取）缺环节（如项目架构特征 / 热点 / 关键路径），**补齐建设**——让 Agent 基于真实理解决策、而非猜。

- **Plan 两层信息（多阶段）**：
  - **制定层（intent，Agent 制定）**：维度排序 + 规模/预算 + 模块绑定 + 各阶段目标——规划 Agent draft→confirm 设定；代码大变时重规划。
  - **补齐层（generation-state，读时从 DB 投影、不双写）**：每个计划目标的状态（planned/generated/stale/missing）+ **代码区↔Recipe 映射** + 覆盖度——**从 knowledge_entries/recipe_source_refs/evolution_proposals/lifecycle_transition_events 投影**（三段生成写 DB、进化改 DB，Plan 读时反映）；权威源是这些 DB 表、非 Plan。
- **Plan 生命周期 = 持续（本地存储不断更新，非每次重建）**：① init 制定完整 Recipe 生成计划（draft→confirm）；② 生成=三段"通过 plan 生成补齐 Recipe"、结果写回补齐层；③ 代码变更=进化（commit 驱动）**动态更新** Plan 的代码↔Recipe 映射（rename→移映射；新模块→加计划项；逻辑变更→标记受影响映射待补齐/提案）；④ 本地 living store `dataRoot/.asd/plan/active-plan.json`。
- **分层（Plan 之上、source_refs 之下）**：Plan = 高层抽象管理（模块/维度 → 计划 Recipe → 生成状态）；`recipe_source_refs`（Core）= 底层具体指针（recipe→file→region）。时机修复让 source_refs/向量保持当前 → Plan 补齐层据此判"已生成已索引"。
- **权威边界（2026-06-21 grounded）**：Plan 持久**仅 intent**（新 `plans` 表：维度排序/规模/绑定/目标/version/intent-changeLog）；**generation-state 全部读时投影自 DB**（coverage←buildCoverageByDimension、映射←recipe_source_refs、状态←knowledge_entries.lifecycle+evolution_proposals、changelog←lifecycle_transition_events）—— 单一真相、无双写。
- **三段 + 进化全部围绕 Plan**：三段 = 读 plan 意图 → 生成 → 写回补齐状态；进化 = 代码变更 → 更新 plan 映射 → 触发补齐或提案。

**Plan 硬前置（用户 2026-06-21）**：confirmed Plan 是冷启动/深挖/单模块挖掘的**硬前置**——先 `alembic_plan` draft→confirm，三段才执行；无 confirmed Plan 时 bootstrap 返回门禁块（仿 buildBootstrapRebuildConfirmationBlock 模式）指向 alembic_plan。

## 关键背景结论（三轮勘探已核实，决定设计性质）

**本质 = 规划层新增 + 引导激活 + 统一进化收口 + green-field 整合；底层能力（维度/向量/提案/修复）多已存在、多在 Core。**

- **维度框架已有**（Core）：25-dim `DIMENSION_REGISTRY`（D1-13 universal + DL1-7 language + DF1-5 framework），`resolveActiveDimensions(lang,frameworks)` 按语言/框架激活；`UnifiedDimension` 带 extractionGuide/weight/tierHint/allowedKnowledgeTypes。
- **规模/预算部分有**：`TARGET_RECIPES_PER_DIMENSION=5` + per-dim gap/`createBudget`（KnowledgeRescanPlanBuilder）；**无**项目级预算、per-module 分配、分阶段深度策略。
- **规划 Agent 角色缺失**：维度只按语言选（非项目特征排序）、无 per-module 绑定、无 ProjectContext→Plan 的上游规划层；ProjectContext 综合（modules/flows/entrypoints/lang/frameworks）但仅用于导航、未被分析用于规划。
- **创建期 ProjectContext 引导：静态有、未激活**：DOMAIN_PLAYBOOKS toolSequence（6/7 含 ProjectContext 工具）、recipeCreationSop"先看 ProjectContext"、RecipeGuidanceFloor 要 graph refs——但不注入 briefing/不进 nextActions、submit 不校验 grounding（可无据创建）。
- **进化机制已有但触发死**：`PluginOpportunisticEvolution.ts:181` gate 在退役 `alembic_task`（永不触发）；`EvolutionGateway`+`evolution_proposals`+rename 修复 `SourceRefReconciler.applyRepairs`（Core）齐备。
- **时机 bug**：`source_refs`+向量**仅 rescan 更新**，create/submit/evolve 都不更新。
- **向量能力**：Core `@alembic/core/vector` `VectorService`（EmbedProvider 三 lane），**无专用 isAvailable 接口**、可用性判断 ≥4 处重复、静默降级。
- **代码无单一 recipe-generation 文件夹**：散在 host-agent-workflows / service/{bootstrap,evolution,vector,project-knowledge-context} / handlers；~15-18 个 Plugin 文件可整合，Core 边界干净（顶层 import）。

## Final Completion Definition

Wakeflow 仅在以下全部满足时可接受：

- **规划层可用（alembic_plan 工具）**：新增 `alembic_plan`（draft/confirm/get）产出项目特征驱动的全局 Plan（维度排序 + 规模/预算 + per-module 绑定 + 分阶段）；Plugin 出确定性草稿、宿主 Agent 精化确认；**confirmed Plan 为三段硬前置**。
- **Plan 为持续 code↔Recipe 桥梁**：Plan 本地持续存储更新（living ledger），init 制定完整生成计划、三段生成写回补齐状态、代码变更进化动态更新映射；任意时刻 Plan 反映 code→Recipe 的计划与覆盖（含 codeRecipeMapping/coverage/changeLog）。
- **规划基于真实信息非臆测**：Plan 收集真实项目信息 + 动态信号 + 内置 SOP + 领域 → 内置 Agent 决策领域/规模/跑哪些 MCP 工具；ProjectContext 理解能力缺口已补齐（Agent 基于真实理解决策、Plugin 不启发式臆测）。
- **Plan 驱动三段**：冷启动/深挖/单模块挖掘均受同一全局 Plan 统辖，维度与规模一致、不各自为政。
- **创建期锚 ProjectContext**：所有创建阶段主动推荐/引导宿主用 ProjectContext MCP（注入 briefing + nextActions tool-chaining + 提交期 grounding 提示），不再只是静态文档。
- **统一进化**：commit 驱动下，新增/保鲜/维护由单一进化管道承载——rename/move 自动修复指向、逻辑变更附加提案、新模块→区域扫描+Recipe 推荐（既荐已有也荐新建）、source_refs/向量即时保鲜；无单独"固定包/推荐"旁路。
- **时机修复**：create/evolve 后 per-recipe 即时更新 source_refs+向量；冷启动后提交的 Recipe 立即可语义检索。
- **向量能力隔离 + 标准可用性接口**：Core 提供 `isAvailable()`（或等价），Plugin 消费者统一改用、去重复；可用性进工具输出，降级可观测不静默。
- **green-field 整合**：Recipe 生成相关 Plugin 代码完整收敛到 `lib/recipe-generation/`（或同义新文件夹），旧路径清空、DI/MCP import 更新、分阶段每步绿；Core 能力留 Core。
- **主体可移植性**：新子系统的规划层/进化/向量接口设计为可被 Alembic 主体复用（主体侧落地为后续单独需求）。
- **跨仓回归**：Plugin + Core 构建/测试绿；与在途 Core 优化（CO）/public-api 边界不冲突。
- **真实项目测试模式验收通过**：在 BiliDili（真实 Swift app）以**测试模式**（选子集维度+小规模、**不全量冷启动**）跑通 ProjectContext→Plan→scoped 生成→Recipe（锚 ProjectContext、即时可检索）→提交驱动进化分类路由，且向量降级可观测（详见「测试模式与真实验收」）。

## 已决汇总（用户 2026-06-21）

- **核心目标重定义** + 6 项系统化要求 + 早前 8 项细目，已确认。
- **三段定位模型**：冷启动=初始全量基线 / 增量扫描(rescan)=冷启动之后的深度挖掘 / 进化=常驻(持续)修复。
- **PD-A** = 提交触发 HEAD-compare on tool-call（非常驻、不装 hook、跨度天然兜底漏检）。
- **PD-C** = Plugin + Core 跨仓（Core additive 接口，与在途 CO 协调）。
- **PD-D** = per-recipe 即时增量。
- **Q1** = **统一进化**（去单独包/推荐路径；进化承载新增+保鲜+维护）。
- **Q2** = 规划角色 = **混合**（Plugin 确定性草稿 + 宿主 Agent 精化）。
- **Q3** = green-field = **全量整合 + 分阶段迁移**。
- **⑦** 新模块 Recipe 推荐 = 既荐已有也荐新建；**⑧** 新文件夹/模块单独区域扫描。
- 不变量：保持 daemon-removal 纯 MCP 非常驻；不改四工具对外 MCP 业务语义；不删证据/提案/向量结构。

## User Scenario

- Actor：开发者在被 Alembic 管理的项目里建模块/改代码/`git commit`；宿主 Agent（codex/claude-code）跑 Alembic 工具。
- Starting state：新项目或已 init 项目。
- Action：① 新项目首次 init → 规划+冷启动；② 后续显式深挖；③ 新建一个模块 → commit；④ 重命名/移动文件 → commit；⑤ 改业务逻辑 → commit。
- Expected result：
  - ① 规划 Agent 从 ProjectContext 产出维度+规模 Plan，冷启动按 Plan 建初始全量基线；创建期引导宿主用 ProjectContext MCP。
  - ② 深挖按 Plan 深化（更细语义区、跨模块）。
  - ③ 新模块被检测 → 单独区域扫描 + Recipe 推荐（挂已有 + 荐新建覆盖）。
  - ④ rename/move 自动更新 Recipe 指向，无需提案。
  - ⑤ 逻辑变更生成附加提案（统一进化），后续深挖或显式 evolve 解决；create/evolve 后 Recipe 即时可检索。
  - 任意时刻可查询向量能力是否可用，降级有信号。
- Failure visibility：规划不出 Plan / 三段各自为政 / 创建期不引导 ProjectContext / 新模块无推荐 / rename 仍指旧路径 / 新 Recipe 检索不到 / 向量静默降级 / 代码仍散落——均为不达标。

## Functional Loop

| Part | Description |
| --- | --- |
| Input | ProjectContext（全面项目信息）；真实 git 提交（含 rename/move/add-dir/modify）；显式 init/rescan/evolve。 |
| Producer | 规划 Agent（Plugin 草稿 + 宿主精化）→ 全局 Plan；三段编排器；统一进化（commit 检测 + 分类）；既有 Core 能力（applyRepairs/EvolutionGateway/VectorService/dimension registry）。 |
| State/Data Change | 全局 Plan（维度排序+规模+per-module）；三段产出/深化 Recipe；rename→source_refs 改指向；逻辑→evolution_proposals；create/evolve→source_refs+向量即时；新模块→区域扫描产候选+推荐；lastSeenCommit 推进；代码迁入 lib/recipe-generation/。 |
| Consumer | prime/search 语义检索；宿主 Agent（按 Plan + ProjectContext 引导创建 Recipe）；深挖/显式 evolve 消费提案；工具输出消费向量可用性。 |
| Output | 全局 Plan / 三段 Recipe / 自动修复 / 附加提案 / 新模块推荐 / 即时可检索 Recipe / 可用性信号。 |
| Failure Path | 向量不可用→可观测降级；commit 未在工具调用时检测→下次工具调用按 lastSeenCommit..HEAD 兜底；分类不确定→落提案而非误改写；规划草稿不合理→宿主精化纠偏。 |
| User Verification | 真实仓库：init→Plan+冷启动；新模块 commit→区域扫描+推荐；rename commit→指向自动更新；逻辑 commit→提案；create→即时检索；停 Ollama→可用性 false+信号。 |

## Repository Boundaries

| Window / Repository | Role | Expected Change | Upstream Dependency | Downstream Consumer |
| --- | --- | --- | --- | --- |
| AlembicPlugin | 主实现 | 新建 `lib/recipe-generation/` 子系统并迁入；规划层（Plugin 草稿）；Plan 驱动三段编排；创建期 ProjectContext 引导激活；提交检测+统一进化+新模块保鲜；向量消费者改用标准可用性接口；新模块检测/区域扫描接线 | @alembic/core（dimension registry/reconcile/repair/proposal/vector） | 宿主 Agent / prime / search |
| AlembicCore | **participates（跨仓，份量大）** | 向量 `isAvailable()` + per-recipe 增量 reconcile；**理解能力补齐（ProjectContext + 独立补充能力；Panorama 编排退场）：重建 RoleRefiner/CouplingAnalyzer/LayerInferrer/DimensionAnalyzer/CallFlowAgg 为独立能力 + 新增 DomainSignalDetector/ArchitectureStyleClassifier/ComplexityAnalyzer / 改造 resolveActiveDimensions / 规划层 aids / DynamicSignalGateway / ModuleDelta+per-module 覆盖**；`plans` 表(intent) + generation-state 投影查询；additive，**与 CO + Panorama 退场/project-intelligence(CKG1) 协调** | — | Plugin 消费 + **主体 follow-on 复用** |
| Alembic 主体 | **follow-on（本需求非范围）** | 本需求完成后作为主体单独新需求（复用规划层/进化/向量接口）；设计需保持可移植 | 本需求产出 | 主体侧后续 |
| AlembicDashboard | observing | 无需改动；可后续消费 Plan/proposal/可用性 | Core/Plugin 数据 | — |
| Design | design-complete | — | — |
| Test | participates | 真实仓库验证：init→Plan、三段、新模块、rename、逻辑提案、create 即时检索、向量降级、green-field 迁移回归 | Plugin+Core 行为 | 验证结论 |
| Wakeflow | controller/runtime support | intake、状态根、phase 确认、派发、验收；与在途 CO/public-api 协调；管理主体 follow-on 排程 | 本设计 | — |

## Proposed Behavior

### 规划层 = alembic_plan 工具（点 1；工具=C/RG-3，规划 aids=B/RG-2）
- **新增 `alembic_plan` MCP 工具**承载规划 Agent 角色：**Plugin 收集真实信息（ProjectContext + 动态信号 + 内置 SOP + 领域 registry）+ 工具菜单 → 内置 Agent 角色据真实信息决策**（领域/规模/跑哪些 MCP 工具），**Plugin 不臆测**。详见下方「alembic_plan 工具规格」。
- 扩 `TARGET_RECIPES_PER_DIMENSION` 为分阶段/per-module 预算（供 Agent 决策取用）；**补齐 ProjectContext 理解能力缺口**（如架构特征/热点），让 Agent 基于真实理解、而非语言单因子或启发式。

### Plan 驱动三段（点 2，D/RG-4）
- 全局 Plan 统辖：**冷启动**=初始全量基线（按 Plan 广度）；**深挖(rescan)**=冷启动之后的深化（按 Plan 深化，三段模型 PD-B）；**单模块/文件夹挖掘**=scoped 区域扫描（按 Plan 的 per-module 绑定）。
- 新模块检测（moduleSeeds-delta / git-diff 新目录）触发单模块挖掘分支。
- 三段 = **读 Plan 意图 → 生成 Recipe → 写回 Plan 补齐层**（codeRecipeMapping 置 generated + coverage 更新）；Plan 持续反映已生成/缺口。

#### D 编排细化（grounded 2026-06-21，复用现有流）
- **复用**：cold-start=`runHostAgentColdStartWorkflow`(确认门禁→fullReset→ProjectContext 分析→session→briefing)；deep-mining=`runHostAgentKnowledgeRescanWorkflow`(snapshot 保留→cleanup→index rebuild→re-analysis→audit→plan)；门禁模型=`buildBootstrapRebuildConfirmationBlock`(success:false + needsUserInput + nextActions[arguments]，宿主据此重调)；session/进度=`BootstrapSession`(2h TTL，active-sessions.json)+`DimensionCheckpoint`+`submissionTracker`。
- **module-mining(新)** = 复用 ProjectContext scoped(module 过滤)+audit+submissionTracker；新增 ModuleMiningIntent(modules[]，cleanupPolicy:'none' 永不删)。
- **关键坑 + 缓解（设计落地）**：
  - **Plan 失效**(confirmed 后代码变)→ Plan 带 `projectContextSignature`，每阶段入口比对、不符则提示重 plan（不静默用旧）。
  - **full-reset 不得清 `plans` 表**(intent 持久)；重 cold-start 需(重)confirm Plan；并清陈旧 bootstrap_snapshots。
  - **并发/重入**：bootstrap 有 lease(BootstrapSessionLeaseError)，**rescan/module-mining 须扩同款 lease + rescanId/epoch 幂等**（现 rescan 非幂等）。
  - **顺序**：deep-mining/module-mining 前置检查有无 cold-start 快照，无则提示先 cold-start。
  - **空项目/零维度** → 校验 dimensionIds∈active，空则 selectionWarning。
  - **部分完成/恢复** → checkpoint 已存；补 session 自动恢复（sessionId 丢失按 latest-session 标记）。
  - **多写竞争**(三段共写 knowledge_entries) → snapshot+cleanup+rebuild 包事务/读锁；dimension_complete 校验 snapshot epoch。

### 创建期锚 ProjectContext（点 3，D/RG-5）
- 把现有静态引导**激活**：注入 Mission Briefing（"创建前先用 recipe_map/graph 取证"）、给工具响应加 nextActions tool-chaining 提示、提交期对关系类声明做 grounding 提示/校验（复用 RecipeGuidanceFloor/submitKnowledgeContract）。所有创建阶段一致。

### 统一进化（点 4 = Q1 统一，E/RG-7 时机 + RG-8 提交驱动）
- **去掉单独的"固定包/推荐"旁路**；commit 驱动（PD-A HEAD-compare on tool-call + GitDiffScanner 加 `-M/-C`）下，单一进化管道承载：
  - **新增**：新模块→区域扫描产 Recipe 候选 + Recipe 推荐（⑦ 既荐已有[复用 recipe_map]+荐新建[扩 per-dimension gap→per-module]）。
  - **保鲜**：rename/move→`applyRepairs` 自动修复指向；create/evolve→source_refs+向量 per-recipe 即时（PD-D）。
  - **维护**：逻辑变更→`EvolutionGateway` 附加提案（pending），后续深挖或显式 `alembic_evolve` 解决；decay。
- 重接触发：`PluginOpportunisticEvolution` 从死的 `alembic_task` 改 commit 驱动；保留 `defer-to-alembic-service` 让渡优化。
- **进化 = 动态更新 Plan**：每次 commit→更新 Plan 的 codeRecipeMapping（rename→移映射+applyRepairs；新模块→加计划项+区域扫描补齐；逻辑→标记 stale+附加提案），并记 Plan.changeLog。Plan 始终反映 code↔Recipe 当前态。

#### E 提交分类细化（grounded 2026-06-21，复用 Core 机制）
- **GitDiffScanner 输出**：events[{type:created/modified/deleted/renamed, path, oldPath}] + head/headChanged/signature；状态码 A/M/D/R 已解析；**当前无显式 -M/-C**（用 git 默认相似度、不可控）→ 须加 `-M<阈值>`/`-C`。
- **复用 Core 机制**：rename 修复=`SourceRefReconciler.repairRenames/applyRepairs/replaceSourcePath`+`RecipePathRewriter`(改 reasoning.sources/markdown/coreCode)；提案=`EvolutionGateway.submit`(update/deprecate，带 dedup + evidence upgrade)；删除=deprecate 提案(conf .9)；decay=`DecayDetector`(source_ref_stale 策略)；changelog=`lifecycle_transition_events`。**主体 `FileChangeHandler` 是路由参照（但 daemon 驱动），Plugin 重建为 commit 驱动**。
- **分类决策树**：rename(R，高相似≥阈值)→**自动修复**(applyRepairs，**不走提案**，细化主体保守做法)；rename+大改(R 低相似)→修复指向 + 附加提案；modified(M)→影响评估→附加提案；deleted(D)→deprecate 提案(不自动删)；created(A) 在已有模块→跳过(不影响存量)；created 在新目录/模块→新模块分支(区域扫描+推荐)；无 Recipe 覆盖的变更→新模块荐 or 跳过；ignored/generated/vendored(ProjectDiffIgnore)→跳过。
- **关键坑 + 缓解（设计落地）**：
  - **rename+改逻辑** → `-M` 阈值分流（高相似→自动修复；低相似=删+增→落提案、不误自动改）；**阈值默认建议 90%（可配）**。
  - **跨模块移动** → 不止改路径：re-bind 维度 + 触发该模块区域扫描（path→module 变）。
  - **目录改名(多文件)** → 按 recipeId 批处理，避免提案爆炸。
  - **多提交累积**(lastSeen..HEAD net diff) → 中间 rename-then-move 孤儿：必要时 git log 反向迭代；否则 rescan catch-up 兜底。
  - **merge/rebase/force-push**(lastSeen 非祖先) → `git merge-base` 校验；非祖先则 fallback 全量 rescan catch-up。
  - **巨型提交(mass refactor)** → 规模 guard（分页/预算），避免单循环阻塞。
  - **revert/no-op** → signature dedup 已处理。
  - **永久 stale** → Recipe deprecate 时清理残留 source_ref。
- **写回 Plan(投影)**：rename→recipe_source_refs；提案→evolution_proposals；lifecycle→lifecycle_transition_events；Plan.state 读时投影反映，Plan.intentChangeLog 仅记 intent 变更。

### 向量能力隔离 + 标准可用性接口（点 6 之向量，E/RG-6）
- Core 增 `VectorService.isAvailable()`（或 `VectorAvailabilityChecker`），单点承载 ≥4 处重复的 `getStats().embedProviderAvailable`；Plugin 消费者统一改用；可用性进工具输出，降级可观测不静默。EmbedProvider 三 lane 抽象保留。

### green-field 子系统（点 6，A/RG-0 起骨架、F/RG-9 收尾，Q3 全量整合+分阶段迁移）
- 新建 `lib/recipe-generation/`（workflows/analysis/planning/vectors/evolution/retrieval/handlers/...），把 ~15-18 个 Plugin recipe-gen 文件**完整迁入**、收敛成内聚子系统；**分阶段迁移**（每步绿、不大爆炸）；旧路径清空、DI/MCP import 更新。Core 能力（@alembic/core/*）留 Core，MCP transport（McpServer/HostMcpServer/tools.ts）留原位仅改 import。设计可移植主体（点 5）。

#### F 迁移切片序细化（grounded 2026-06-21）
**依赖图无环** → leaf-first 安全切片。**策略=migrate-EARLY，且迁移宜早**（紧接 RG-0 骨架就按 8 切片迁），让 C/D/E 的 Plugin 改动**直接落在新位置**，避免"旧位置改完再搬"双改；RG-9 退化为**删旧路径 + 最终核验**。
- **机制**：`package.json` 加 `#recipe-generation/*` 别名（先于一切新 import）；旧 `#service/*`/`#codex/*` 指向的文件移动后**消费方 import 更新**到新别名；**handler adapter（handlers/host-agent/*）保留为薄 re-export 层**；Core import 不变；**不做"再 import 新位置"的 shim**（防别名环，只用 `export * from`）。
- **层门禁正向收益**：bootstrap/evolution/vector 从 `lib/service`(L1) 移入 `lib/recipe-generation`(L2 recipe-gen 本职) → **消除现有 L1→L2 backslip**，`lint:layer-boundary` 转正。
- **8 切片（leaf→entry，每步绿）**：① 叶子(LocalEmbedding/ContextualEnricher/project-data-root/recipe-region-vector/bootstrap-event-types)+加别名 → ② BootstrapEventEmitter/knowledge-index-rebuild(+VectorModule) → ③ project-context-analysis/recipe-evidence-gate(+tool-router) → ④ cold-start/knowledge-rescan/dimension-completion(+handlers re-export+测试) → ⑤ project-knowledge-context 整树(+recipe-map/search/structure/kc-tools) → ⑥ PluginOpportunisticEvolution/git-diff-checkpoint(+presenter) → ⑦ BootstrapTaskManager → ⑧ 删旧路径/收尾。
- **每切片门禁**：`build:check` + `test:unit` + `lint:layer-boundary` + `lint:core-import-boundary` 全绿才进下一片。
- **入口改点 ~11 处（已枚举）**：tool-router(2)/recipe-map·search·structure·kc-tools(7)/VectorModule(2)/handlers re-export(3)/opportunistic-evolution-presenter(1)/测试(6+)。
- **坑**：别名未先加→新 import 失败（切片①先加）；shim 自 import→别名环（只 `export *`）；postbuild/clean-dist/release-boundary 脚本可能硬编码旧路径→须核对；tsconfig 用 Node 解析（无需 path 映射）。

## alembic_plan 工具规格（RG-1，新增第 19 个 MCP 工具）

**定位**：规划 Agent 角色的对外接口 + **真实代码↔Recipe 的持久化桥梁/账本**（living ledger，见上「Plan 的中心定位」）；混合模式（**Plugin 收集真实信息 + 内置 SOP/领域 + 工具菜单（非启发式臆测）→ 内置 Agent 角色决策**）。tier=agent。
**硬前置（用户 2026-06-21）**：confirmed Plan 是 alembic_bootstrap 的**硬前置**——无 confirmed Plan 时 bootstrap 返回门禁块（仿 `buildBootstrapRebuildConfirmationBlock` 模式）指向 alembic_plan；显式两步 draft→confirm 后方可 bootstrap。rescan/单模块挖掘同样消费 confirmed Plan。

**operations（draft / confirm / get）**：
| op | 谁 | 行为 |
| --- | --- | --- |
| `draft` | Plugin 收集 | 汇集真实信息(ProjectContext+动态信号)+内置 SOP+领域+工具菜单 → 信息包 + planningBrief 交 Agent（**不臆测决策**）；存 pending |
| `confirm` | 内置 Agent 决策 | Agent 据真实信息定 领域/规模/**执行哪些进化·分析 MCP 工具**(+顺序) → 存 active confirmed（planId/version） |
| `get` | 任意 | 返回当前 active Plan |
（重规划=再 draft→confirm 新版本。）

**输入**：`operation`；(draft) 可选 `hints`（focus 模块/目标深度/预算上限）；(confirm) `plan` 载荷 + `basePlanId/version` + 可选 `rationale`。

**输出 Plan 结构**：
```
// ── 制定层（intent）= 持久于新 `plans` 表（权威） ──
plan.intent {
  planId, version, status, projectContextSignature, lastUpdatedFromCommit, createdBy, intentChangeLog[]
  projectProfile { projectType, primaryLang, secondaryLanguages, frameworks, moduleCount, fileCount, architectureHints }
  dimensions[] { dimensionId, priority(排名), rationale, stage, targetRecipes }
  scale { totalRecipeBudget, perStage{coldStart,deepMining,module}, depthLevels }
  moduleBindings[] { modulePath, dimensions[], targetRecipes, priority }
  stages { coldStart{dimensions[],breadthBudget}, deepMining{dimensions[],depthBudget,focusModules[]}, moduleMining{perModule} }
  draftSource:'plugin-deterministic'; planningBrief?(仅 draft)
}
// ── 补齐层（generation-state）= 读时从 DB 投影（不持久、不双写） ──
plan.state(projected) {
  codeRecipeMapping[] { codeRegion, recipeIds[], status: planned|generated|stale|missing }  // ← recipe_source_refs + knowledge_entries
  coverage { byDimension{}, byModule{}, generated, planned, gaps[] }                          // ← buildCoverageByDimension(投影)
  pendingProposals[]                                                                          // ← evolution_proposals
  generationChangeLog[]                                                                       // ← lifecycle_transition_events
}
// alembic_plan get = intent(持久) + state(投影) 合并视图
```

**draft = Plugin 收集真实信息（非臆测）**：汇集 ProjectContext（`buildHostAgentProjectContextAnalysis` → profile/moduleSeeds/lang/frameworks）+ 动态信号（新模块/进化衰退提案/覆盖）+ 内置 SOP（sopPack/DOMAIN_PLAYBOOKS）+ 领域（`resolveActiveDimensions` 取激活 25-dim + `UnifiedDimension` 元数据）+ 可用 MCP 工具菜单 → 组装信息包 + planningBrief 交内置 Agent。**若理解能力缺环节则先补齐建设**（如架构特征/热点抽取），让 Agent 基于真实信息而非猜。
**confirm = 内置 Agent 决策（SOP 定义、宿主扮演）**：Agent 据真实信息定 哪些领域 / 多大规模 / **执行哪些进化·分析 MCP 工具**（领域+规模+顺序）；用 graph/recipe_map 校验相关性 → `alembic_plan(confirm, plan)`。Plugin **不**做启发式决策。
**持久化**：`dataRoot/.asd/plan/active-plan.json`（+ 版本）。confirmed Plan = 三段唯一消费源。
**三段消费**：`alembic_bootstrap` 读 `plan.stages.coldStart`、`alembic_rescan` 读 `deepMining`、单模块挖掘读 `moduleBindings`；Mission Briefing 嵌 Plan 的 per-dim 目标+tier（取代仅按语言选维度 + 硬编码 5）。
**门禁/降级**：gate≈cold-start（需 ProjectContext）；ProjectContext 不全→部分草稿 + 标记；宿主不 confirm→无法 bootstrap（硬前置）。

### alembic_plan 交互细化（grounded 2026-06-21，复用现有结构、不臆造）
- **draft 信息包** = 复用 `MissionBriefing`（architectureOverview / dimensions[`DimensionTask`] / executionPlan{tiers} / submissionSchema，MissionBriefingBuilder.ts:103-188）+ **注入 B 阶段真实信号**（domainSignals / architectureStyle / coverage 投影）。即"收集的真实信息"= 现有 briefing + B 信号。
- **planningBrief** = 模型于 `OnboardingContract.initialToolBriefing`（defaultOrder / **agentDecisionChecklist** / evidenceFields / sopField，OnboardingContract.ts:305-331）+ `sopPack`（stagedProtocol / domainPlaybooks / toolCapabilityMatrix）+ DomainPlaybook（toolSequence / requiredEvidence）。给 Agent：工具菜单 + 决策清单 + 证据要求 + 如何定维度/规模。
- **confirm 载荷** = 模型于 `HostAgentDimensionCompleteArgs` 模式（HostAgentDimensionCompletionWorkflow.ts:11-21）：selectedDimensions[{id,tier,decided,reason}] + scale/budget 决策 + plannedNextActions[{tool,reason}] + rationale → 写入 `plans` 表(intent)。
- **get** = intent(plans 表) + projected state(DB 投影) 合并视图。
- **per-dimension 单元** = `DimensionTask`(id/label/tier/outputType/analysisGuide{goal,focus,steps}/submissionSpec，MissionBriefingBuilder.ts:62-73) 直接复用；tier 由 `TierScheduler` 出。
- **Plan schema 对齐** 现有 `ColdStartPlan`/`KnowledgeRescanPlan`（intent→cleanup→projectAnalysis→response）。
- 关键：alembic_plan **复用** MissionBriefing + OnboardingContract + DimensionTask + dimension_complete 模式，不另造抽象。

## 理解能力审计（2026-06-21，4 路 Explore）

落实"plan 不猜、补齐理解能力"——审计"ProjectContext 现在能理解什么" vs "Agent 据真实信息决策所需"。**结论：执行层能力 RICH，但理解层/规划层缺口大，且绝大部分缺口在 Core**（强化 PD-C 跨仓 + 主体 follow-on 复用）。

### 供给侧：ProjectContext 现状（结构/AST 丰富；按需计算、无持久存储）
- 9 查询：space/repo/map/module/module-layers/file-flow/file-symbols/source-slice/anchor-range。
- 已抽取：RepoContext（语言/构建/包/targets/sourceRoots/entrypoints/commands/topAreas/configFiles）；模块（ownedFiles + 结构 role[test/interface/service/domain/infrastructure，命名启发式]）；符号（AST：class/method/export/signature）；关系（imports 确定 / calls 启发式）；语言+构建检测；框架在 bootstrap discoverer 检测（喂 resolveActiveDimensions）。
- **未捕获**：data-flow、类型推断、API/endpoint 映射、测试覆盖映射、文档、git churn；**ProjectContext 无持久 matrix 存储**（每次计算）。

### 缺口侧：Agent 决策所需 vs 现状
| 决策所需 | 现状 | 判定 |
| --- | --- | --- |
| 架构风格（单体/分层/微服务/事件驱动/CLI/库） | 仅层深 LayerInferrer + 结构 role | **MISSING** |
| per-domain 存在信号（有无 auth/API/UI/DB/并发/安全/可观测/错误处理 → D1-D13） | 无检测器 | **MISSING** |
| 维度选择 | **仅语言+框架**（resolveActiveDimensions），D1-D13 恒全开（CLI 也强开 UI/网络维度） | **MISSING（项目特征）** |
| per-module 功能职责（auth-service vs payment-service） | 仅结构 role | **MISSING** |
| 规模/复杂度 | fan-in/out + 圈复杂度（Panorama）有；module-LOC rollup/churn 缺 | **PARTIAL** |
| 关键路径/入口重要性 | 仅 fan-in | **MISSING** |
| 动态信号聚合（新模块/提案/decay/覆盖/热点） | 提案 queryable、decay/覆盖 per-dim 有但散；**新模块 ABSENT、churn ABSENT、无聚合 gateway** | **PARTIAL/MISSING** |
| 规划层决策依据 | 执行层 SOP/工具菜单/维度元数据 RICH；**规划 SOP/维度排序/工具选择/规模/排序约束 全 MISSING**（现有引导是"已选好维度"的执行简报） | **MISSING（规划层）** |

### 补齐建设清单（"缺什么、补什么"，多数 Core）
| # | 补齐项 | 归属 | 优先 |
| --- | --- | --- | --- |
| 1 | **DomainSignalDetector**（hasAuth/API/UI/DB/并发/安全/可观测/错误/测试，项目+模块级） | Core | P0（维度选择基于真实） |
| 2 | **ArchitectureStyleClassifier**（单体/分层/微服务/事件驱动/CLI/库） | Core | P0 |
| 3 | **改造 resolveActiveDimensions**：按域信号关掉无关 Layer-1 维（非仅语言） | Core | P0 |
| 4 | **规划层内置 aids**：planning SOP/persona + 维度排序 + 维度→工具序 + 规模决策 + 跨维约束 | Core | P0（Agent 决策依据） |
| 5 | **DynamicSignalGateway**：聚合 提案/decay/覆盖/新模块/热点 供 Plan 收集 | Core | P1 |
| 6 | **ModuleDeltaDetector + per-module 覆盖查询** | Core | P1 |
| 7 | **重建 Panorama 有价值分析为独立能力**（RoleRefiner 4信号 role / CouplingAnalyzer fan-in-out·SCC / LayerInferrer / DimensionAnalyzer 健康-gap / CallFlowAgg，decouple Panorama、作项目信息补充）+ per-module 功能职责 | Core | **P1** |
| 8 | 规模/复杂度 rollup（module-LOC/热点；ComplexityAnalyzer 独立能力） | Core | P2 |
| 9 | （可选）git churn 分析器 | Core/Plugin | P3 |
| 10 | **`plans` 表（intent 持久）+ Plan 投影层**（generation-state 从 knowledge_entries/recipe_source_refs/evolution_proposals/lifecycle_events 投影、不双写） | Plugin+Core | RG-3 |

**审计结论**：① "补齐理解能力"主要在 **Core** → Core 份量大幅上升、与在途 CO 触点更多、主体 follow-on 直接复用。② `alembic_plan`（Plugin）= 收集 Core 产出 + 交 Agent 决策；Agent"真实信息"质量取决于 Core 补齐（不补则退回猜）。③ 执行层（SOP/工具菜单/维度元数据）已 RICH、复用即可。④ **Panorama 退场进行中**（已有测试断言 Plugin 冷启动/rescan 不用 Panorama 且通过）：**Panorama 编排层退场，但其有价值分析（RoleRefiner 4 信号 role / CouplingAnalyzer fan-in-out·SCC / LayerInferrer / DimensionAnalyzer 健康·gap / CallFlow 聚合）重建为独立项目信息补充能力**（decouple Panorama、消费同一共享图 code_entities/knowledge_edges，phase runners 留存），**不删、不内嵌 Panorama**；理解能力 = **ProjectContext（结构/AST base）+ 这些独立补充能力 + 新增（DomainSignal/ArchStyle/Complexity）**；与 project-intelligence(CKG1) 重整协调。⑤ **Plan 权威边界**：Plan 只持久 **intent**（`plans` 表）；generation-state（coverage / code↔Recipe 映射 / 状态 / changelog）**全部从现有 DB 投影、不双写**（单一真相）。

### B 阶段落地细化（理解能力抽取，grounded 2026-06-21）

**消费决策**：DomainSignal/ArchStyle/Complexity 消费 **ProjectContext handlers**（file-symbols/file-flow/repo/map，已归一化、purpose-built）；重建的 RoleRefiner/CouplingAnalyzer 消费 **共享图 repos**（code_entities/knowledge_edges，phase runners 建、可独立于 Panorama 查询）。两者均 Panorama-free。

- **DomainSignalDetector（9 域，多信号融合）**：
  - **imports（golden signal）**：`file-flow imports[].to.label/symbol`（specifier）→ 库映射域（express/fastify→API、react/vue/swiftui→UI、typeorm/pg/mongoose→DB、jsonwebtoken/passport→auth、crypto/bcrypt→security、winston/pino→observability、rxjs/tokio→并发、jest/vitest→testing）。复用 `TechStackProfiler`+`LanguageProfiles.knownLibraries`（库→category 已有 ~100 映射）。
  - **symbols（命名）**：`file-symbols name/kind/signature/container`（*Auth*/*Token*、*Controller*/*Route*、*Repository*/*Entity*、async kind、*Logger*、*Error*）。
  - **config/manifest**：`repo configFiles`（70+ kinds：jest→testing、vite→UI、Dockerfile/k8s→deploy）+ `packageSystems` manifest 依赖列表。
  - 单一信号不足→imports+symbols+config 融合置信；检测规格直接用 dimension `extractionGuide`（每域"该测什么"已定义）。gap：error-tracking 库映射未建、版本需解析 manifest。
- **ArchitectureStyleClassifier**（consume `map`+`repo`+CouplingAnalyzer）：monolith(≤2 模块/cycles>0/高耦合)、layered(2-4 层/acyclic)、microservices(6+ 模块/低密度/docker·k8s/4+ packages)、event-driven(data_flow≫calls)、plugin(1 core 高 fanIn)、library(entrypoint=library/exports)、CLI(entrypoint kind=CLI+commands)、frontend-SPA(index.html+vite+UI fw)、backend-API(HTTP server entrypoint+web fw)。信号源：`map`(modules/layers/cycles/edgeCount/hotspots) + `repo`(localPackages/entrypoints.kind/targets/configFiles)。gap：monorepo 显式 flag、event broker 检测、plugin 校验。
- **重建 RoleRefiner/CouplingAnalyzer（保留算法、独立能力）**：RoleRefiner 4 信号权重(AST .30/CallGraph .30/DataFlow .15/EntityGraph .10/regex .15 + configLayer .30)；CouplingAnalyzer 边权(depends_on .5/calls 1.0/data_flow .8)+Tarjan SCC+fanIn/out。输入=`CodeEntityRepository`/`KnowledgeEdgeRepository`（仓库级、独立可查、不依赖 Panorama）→ decouple 直接重建。

## Code Facts

- **维度/规模/规划（已核实）**：25-dim `DIMENSION_REGISTRY`（Core domain/dimension），`resolveActiveDimensions(lang,frameworks)`；`TARGET_RECIPES_PER_DIMENSION=5`+gap/createBudget（Core KnowledgeRescanPlanBuilder）；ColdStartPlan/MissionBriefingBuilder（tier executionPlan）/KnowledgeRescanPlanBuilder 为各段局部 plan；**无 ProjectContext→全局 Plan 的规划角色**（ABSENT）；ProjectContext 综合但仅导航用。
- **创建期 ProjectContext 引导（已核实）**：工具 recipe_map/graph/search/prime 齐；DOMAIN_PLAYBOOKS toolSequence（OnboardingContract，6/7 含）、recipeCreationSop"先看 ProjectContext"、RecipeGuidanceFloor 要 graph refs——**静态、未注入 briefing/未进 nextActions（空）/submit 不强制 grounding**（PARTIAL）。
- **时机矩阵（已核实）**：cold-start / submit_knowledge / dimension_complete / evolve 均**不更新** source_refs+向量；**仅 rescan 更新**（reconcile force=true + buildRecipeSemanticRegionVectors）。核心 bug。
- **进化（已核实）**：死触发 `PluginOpportunisticEvolution.ts:181`(`alembic_task`&&close)；机制齐 `SourceRefReconciler.applyRepairs/replaceSourcePath/rewriteRecipePaths`、`EvolutionGateway.submit`(propose/deprecate/skip)、`evolution_proposals`（均 Core）；GitDiffScanner（Plugin）处理 R 但 diff 无 `-M`(:89)、不处理 C、无持久化 lastSeenCommit、无 git hook 代码。
- **区域扫描/检测/推荐（已核实 Q1-Q3）**：区域扫描 PARTIAL（recipe_map bounded 映射/graph scoped 查询有，"扫新区产 Recipe 候选"新增，rescan 不收路径范围）；新模块检测 ABSENT（moduleSeeds 无 delta）；推荐 PARTIAL（per-dimension gap 有，无 per-module）。
- **向量（已核实）**：`VectorService`(Core `@alembic/core/vector`) `getStats().embedProviderAvailable=!!#embedProvider`；Plugin `prepareLocalEmbedProvider` 启动探 Ollama `/api/tags`；无 isAvailable，判断散 search.ts:1690/recipe-region-vector.ts:72/SetupService.ts:782/AlembicResidentServiceClient.ts:1112。
- **代码布局（已核实）**：无单一 recipe-gen 文件夹；Plugin 可迁 ~15-18 文件（host-agent-workflows/{cold-start,knowledge-rescan,knowledge-index-rebuild,recipe-region-vector,dimension-completion,project-context-analysis}、service/{bootstrap,evolution/git-diff-checkpoint,vector/LocalEmbedding}、service/project-knowledge-context、handlers/host-agent）；Core 留 Core；McpServer/HostMcpServer/tools.ts/DI 留原位改 import。
- Missing code facts（RG-0 核实）：**ProjectContext 理解能力缺口审计（架构特征/热点/关键路径等 Agent 决策所需，缺则 RG-1 补齐建设）**；内置 SOP（sopPack/DOMAIN_PLAYBOOKS）+ 领域（DimensionRegistry）作为 Agent 决策依据的接入方式；Core 是否需新增 per-recipe 增量 reconcile / 规划预算 API；与在途 CO 对 VectorService/public-api 冲突；rename `-M` 阈值；冷启动 vs 深挖深度区分实现；scoped 区域分析能否复用 recipe_map/graph 产 Recipe 候选；新模块检测方式（moduleSeeds-delta vs git-diff 新目录）；green-field 迁移分阶段切片与 import 影响面。

## Phase Candidates

Phases 为 Wakeflow 评审候选，非 task package。按 **6 个宏观阶段 A–F** 组织（RG-0~10）；green-field = 每阶段在新文件夹建设/迁入、分阶段每步绿。

| 宏观 | Phase | Goal | 上游 | Completion Signal |
| --- | --- | --- | --- | --- |
| **A 地基** | RG-0 | green-field 骨架（建 `lib/recipe-generation/` 空骨架 + `#recipe-generation/*` 别名 + 8 切片迁移序，**migrate-early 紧接启动**，见 F 切片序细化）+ 与 **CO / Panorama 退场 / project-intelligence(CKG1)** 协调 + 表征测试锁现状（理解能力审计已完成） | 本设计 | 骨架+别名+迁移序就绪；跨波协调点确定 |
| **B 理解能力补齐**（Core；ProjectContext + 独立补充能力） | RG-1 | **独立项目信息补充能力（消费共享图，decouple Panorama）**：重建 Panorama 有价值分析为独立能力（RoleRefiner/CouplingAnalyzer/LayerInferrer/DimensionAnalyzer 健康-gap/CallFlowAgg）+ **新增 DomainSignalDetector / ArchitectureStyleClassifier / ComplexityAnalyzer**；与 ProjectContext（结构/AST base）并列构成完整项目信息；phase runners 留存 | RG-0 | 角色/耦合/层/健康/域信号/架构/复杂度 作为独立项目信息可取 |
| | RG-2 | **维度选择改造 + 规划 aids + 动态聚合**：改造 `resolveActiveDimensions`（域信号驱动、关无关 Layer-1 维）+ 规划层内置 aids（planning SOP/维度排序/维度→工具序/规模/跨维约束）+ DynamicSignalGateway（聚合 提案/decay/coverage/新模块/hotspot）+ ModuleDelta/per-module 覆盖 | RG-1 | Agent 决策有真实信号依据（非语言单因子） |
| **C Plan 中枢** | RG-3 | **`plans` 表（intent 持久）+ `alembic_plan` 工具（新增第 19）**：draft(收集 B 的真实信号+SOP+领域+工具菜单)→内置 Agent 决策(领域/规模/跑哪些 MCP 工具)→confirm；**Plan=living ledger=intent 持久 + generation-state 从 DB 投影（不双写）**；三段硬前置 | RG-2 | alembic_plan draft/confirm/get 可用；intent 入 plans 表；state 投影正确 |
| **D Plan 驱动生成** | RG-4 | **Plan 驱动三段编排**：冷启动(初始全量)/深挖(深化)/单模块挖掘(scoped) 读 confirmed Plan intent + 投影 state（硬前置门禁）；新模块检测触发单模块挖掘；**支持测试模式**（scoped 子集维度+小规模、非全量冷启动，复用 dimensions 选择+预算 override+单模块路径） | RG-3 | 三段共享 Plan；无 Plan→bootstrap 门禁块；测试模式可 scoped 生成 |
| | RG-5 | **创建期锚 ProjectContext**：注入 briefing + nextActions tool-chaining + 提交 grounding 提示（激活现有静态 SOP） | RG-4 | 各创建阶段主动引导 ProjectContext MCP |
| **E 保鲜/进化** | RG-6 | **向量能力隔离 + 标准可用性接口**（Core isAvailable + Plugin 去重 + 可用性进输出，跨仓） | RG-0 | 单点可用性接口；重复消除；降级可观测 |
| | RG-7 | **时机修复**：create/evolve 后 per-recipe 即时更新 source_refs+向量（→ Plan 投影 state 新鲜） | RG-6 | create 后即时可检索对照测试绿 |
| | RG-8 | **提交驱动 + 统一进化**：HEAD-compare + GitDiffScanner -M/-C + 重接触发；统一 新增(新模块→区域扫描+推荐⑦⑧)+保鲜(rename 修复)+维护(提案/decay)；更新 DB→Plan 投影反映、Plan.changeLog 记 intent | RG-4/RG-7 | rename 自动改指向；逻辑出提案；新模块推荐；触发去 alembic_task |
| **F 收口/验收** | RG-9 | **green-field 收尾**：删旧路径/shim + 最终核验（迁移主体已 RG-0 后按 8 切片**早做**，见 F 切片序细化）+ 主体可移植性收口 | RG-1~8 | 子系统内聚；旧路径空；import 绿 |
| | RG-10 | 测试 + 跨仓回归 + 验收：**BiliDili 真实项目测试模式验收**（选子集维度+小规模、不全量冷启动；见「测试模式与真实验收」）+ Plugin+Core 构建测试 + 主体可移植确认 | 全部；下游=Test | BiliDili 测试模式 4 项链全绿；跨仓回归绿 |

**执行序**：A(RG-0) → **B(RG-1→RG-2)** → **C(RG-3 alembic_plan)** → D(RG-4→RG-5) → E(RG-6→RG-7→RG-8) → F(RG-9→RG-10)。
- **B 是 C 的真实前提**（不补齐理解能力，Agent 只有语言单因子=退回猜）；**C 是 D 的硬前置**（三段消费 confirmed Plan）。
- E 的 RG-6（向量可用性）可与 D 并行起步；RG-7/RG-8 依赖 RG-6。
- green-field（A 起骨架、F 收尾）贯穿：各阶段在新文件夹建设，F 完整迁移。
- B 大量在 **Core**、且与在途 **CO / Panorama 退场 / project-intelligence(CKG1)** 重叠 → 控制器须跨波协调（见 R10/R12）。

## 测试模式与真实验收（BiliDili，用户 2026-06-21 追加）

### 测试模式（scoped 验证运行，非全量冷启动）— 新增能力
在 confirmed Plan 上**选取子集维度 + 缩减规模 +（可选）单模块范围**执行扫描与 Recipe 生成，**不做全量冷启动**（无 fullReset）。
- **复用**：`RescanInput.dimensions`（选维度）+ Plan per-stage 预算 override（小规模，如 2-3/dim）+ 单模块挖掘 scoped（单 package/folder）+ `cleanupPolicy:'none'`（不删既有）。走 scoped 路径、**不走 cold-start fullReset**。
- **入口**：alembic_plan draft→confirm 产出 Plan 后，以 `{ testMode:true, dimensions:[子集], scaleOverride:{…小}, moduleScope?:[单模块] }` 触发 scoped 扫描+生成。
- **目的**：真实项目上**快速、低成本**验证整链（ProjectContext→Plan→scoped 生成→Recipe+source_refs+向量→可检索），不付全量 bootstrap 代价。
- **不变量**：仍需 confirmed Plan（硬前置）；测试模式只缩范围，**不绕过 grounding/不猜原则**。

### 真实验收标准（RG-10，项目 = BiliDili）
**测试对象**：`/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili` —— 真实 Swift app（iOS/macOS，~138 .swift，SPM Packages + Xcode project，有 submodule、git 历史）。
**测试模式验收链（不全量冷启动）**：
1. **规划真实性**：`alembic_plan draft` 产出的维度/规模反映 BiliDili **真实特征**（Swift→DL1 swift-objc-idiom、SwiftUI→DF4、UI/networking/concurrency 域信号 by B 阶段），**非语言单因子**；confirm 选子集（如 [architecture, swift-objc-idiom, ui-interaction]）+ 小规模。
2. **scoped 生成**：测试模式对所选维度/单模块扫描 → 产出 Recipe，**锚在 ProjectContext**（source_refs 落库、region 向量建、prime/search 可检索）、create 后**即时可检索**（时机修复）。
3. **提交驱动进化**：BiliDili 做真实编辑+commit（rename 一个 .swift / 改一处逻辑 / 加一新 Package）→ 分类路由正确（rename 自动修复指向 / 逻辑→附加提案 / 新模块→区域扫描+推荐）+ Plan state 投影反映 + lifecycle/proposal 落库。
4. **可用性/降级**：停本地 Ollama → 向量 `isAvailable=false` 且工具输出有可观测降级信号（非静默）。
**通过 = 全部满足**；**失败** = 维度仅按语言 / Recipe 无 ProjectContext 锚 / 检索不到 / 分类误路由 / 静默降级 / 需全量冷启动才出 Recipe。
**测试模式可证**：整条 ProjectContext→Plan→生成→进化闭环在真实 Swift 项目可用。**不可证**：大规模全量质量（需全量 cold-start，属后续）；codex 宿主真实性（本需求 claude-code 内验）。

## Validation Strategy

- Controller self-verification：Plugin+Core 单测/typecheck/lint（含 core-import-boundary / public-api-boundary）；规划草稿单测、时机矩阵对照、分类单测、迁移后 import 编译。
- Product repository verification：Plugin 构建+测试；Core VectorService/SourceRefReconciler/Evolution/dimension 单测回归。
- Test handoff required：yes（**BiliDili 真实 Swift 项目、测试模式**：plan draft/confirm 子集、scoped 生成、真实 git 提交/rename/新 Package、停 Ollama 降级——需真实运行）。
- Real scenario required because：规划合理性、commit/rename 检测、create 即时检索、降级，皆依赖真实项目+git+向量行为，mock 难证。
- Success means：规划出项目特征 Plan；三段共享 Plan；创建期引导 ProjectContext；统一进化覆盖新增/保鲜/维护；create 即时检索；可用性可观测；代码内聚到新子系统。
- Failure means：无 Plan/三段割裂/不引导/静默降级/检索不到/旧路径残留。
- This test cannot prove：不评估 Recipe"质量提升"绝对效果（属启用后独立评估）。

## TODO / Backlog Candidates

| ID | Type | Priority | Owner Candidate | Reason | Current Mainline Relation |
| --- | --- | --- | --- | --- | --- |
| alembic-recipe-evolution-optimization-2026-06-21 | requirement-candidate | P1 | Design→Wakeflow | Recipe 生成体系系统化重构（ProjectContext→Plan→Recipe；规划层+三段+创建引导+统一进化+向量隔离+green-field；跨仓 Plugin+Core heavy+主体 follow-on） | **independent + 自动化推进(unattended)**；用户 2026-06-21 其他需求已归档/停止、无在途竞争；B 阶段直接承接 Panorama 有价值分析的独立重建 |
| alembic-main-recipe-generation-followon | requirement-candidate（**follow-on，未启动**） | P2 | Design→Wakeflow | 点 5：Plugin 完成后，Alembic 主体复用规划层/进化/向量接口的同类建设 | **Trigger：本 Plugin 需求完成**；现仅记录、不 intake |

## Risks And Decisions

### 兼容性要求
- 不删 `recipe_source_refs`/`evolution_proposals`/Recipe 证据结构；复用 applyRepairs/Gateway/Vector/dimension registry 语义。
- Core 新增接口 additive，不破 `@alembic/core/*` 既有消费者。
- 保持 daemon-removal 纯 MCP 非常驻：规划/进化/检测不得引入常驻进程/watcher。
- green-field 迁移分阶段、每步绿、可回退；不与在途 CO 撞 public-api。

### Risks
- **R1 范围大**：规划层 + 三段编排 + 引导激活 + 统一进化 + 向量隔离 + green-field 全量迁移，是大重构——必须分阶段、每步门禁绿、保活路径。
- **R2 非常驻提交触发**：HEAD-compare 仅工具调用时检测（PD-A 已接受，rescan/深挖兜底）。
- **R3 rename 检测**：无 `-M` 时 rename=D+A 误判；RG-6 加 `-M/-C`+阈值，不确定落提案不自动改写。
- **R4 跨仓撞 CO**：VectorService/public-api 与 CO 重叠；RG-0 对账、additive、门禁绿。
- **R5 规划草稿不合理**：Plugin 启发式可能偏；混合架构由宿主 Agent 精化纠偏（Q2）。
- **R6 green-field 迁移风险**：大面积移动文件易断 import；分阶段切片 + 每步编译/测试绿 + 旧路径渐清。
- **R7 区域扫描/推荐被低估 / 推荐噪声**：区域扫描产候选是新增（非"已存在"）；推荐按规模/覆盖阈值触发、可选提示。
- **R8 主体可移植性**：设计若过度耦合 Plugin 宿主，主体 follow-on 难复用；接口层（规划/进化/向量）保持 host-agnostic。
- **R9 bootstrap 硬前置=可见行为变更**：confirmed Plan 成为 bootstrap 硬前置（无 Plan 即门禁阻断），改变首次体验（多 alembic_plan draft→confirm 两步）。用户 2026-06-21 已确认；门禁块须给清晰指引（指向 alembic_plan），避免卡死首次使用。
- **R10 Core 份量大幅上升（审计结论）**：理解能力审计显示"补齐理解能力"主要在 Core（域信号/架构分类/规划 aids/动态聚合/改造维度选择），本需求 Core 侧远超最初预估、与在途 CO 触点增多，工期/风险上升。缓解：RG-0 与 CO 对账、全部 additive、分阶段每步绿；**主体 follow-on 直接复用这些 Core 能力（设计保持 host-agnostic 可移植）**，Core 投入一次、两端受益。
- **R11 不补齐则退回猜**：若 Core 理解能力（补齐 #1-4）未做，Agent 只有语言单因子 = 实质退回"猜"，违背核心原则。故 **B（RG-1/RG-2 Core 补齐）是 C（RG-3 alembic_plan）的真实前提**，不可只做工具壳。
- **R12 Panorama 有价值分析的重建归本需求（独立、无竞争）**：用户 2026-06-21——其他需求已归档/停止，本需求**独立进行 + 持续自动化推进**。B 阶段直接把 RoleRefiner/CouplingAnalyzer/LayerInferrer/DimensionAnalyzer/CallFlow 重建为独立项目信息补充能力（建在 ProjectContext 侧、消费共享图，phase runners 留存）= **Panorama 退场做对的方式**；**无在途波次竞争、无重复迁移风险**。（layer-contract.md 的 project-intelligence known-debt 由本需求 B 阶段一并收口。）
- **R13 D/E 边界情况密集（已设计缓解，实现期须坐实）**：三段编排 + 提交分类共识别约 38 个坑，缓解已落「D 编排细化」「E 提交分类细化」。**实现期必须坐实的硬点**：rename 自动修复相似度阈值（默认 90%、可配）、rescan/module-mining 的 lease + rescanId 幂等、commit base 非祖先（merge/rebase/force-push）的 `git merge-base` 校验 + rescan catch-up fallback、Plan `projectContextSignature` 失效比对、巨型提交 scale guard。这些不坐实会导致误自动改写/并发损坏/漏检。

### Non-goals
- 不重建 daemon/常驻 watcher；不改四工具对外 MCP 业务语义。
- 主体侧落地不在本需求（point 5 follow-on）。
- 不做 Recipe 质量提升算法评估。
- 不删现有证据/提案/向量数据结构。

### Resolved Decisions（用户 2026-06-21）
- 核心目标重定义 + 6 项系统化要求 + 早前 8 项细目；三段定位模型；PD-A（HEAD-compare）/PD-C（Plugin+Core 跨仓）/PD-D（per-recipe 即时）；**Q1 统一进化**；**Q2 混合规划（Plugin 草稿+宿主精化）**；**Q3 全量整合+分阶段迁移**；⑦既荐已有也荐新建；⑧新区域扫描；point 5 Plugin 先/主体 follow-on。
- **alembic_plan 工具（2026-06-21）**：新增第 19 个 MCP 工具承载规划层；操作集=**draft / confirm / get**；**confirmed Plan 为 bootstrap/三段硬前置**（无 Plan→bootstrap 返回门禁块指向 alembic_plan，显式两步）；排为 **RG-1 首个真实交付**。
- **Plan 中心化（2026-06-21 升级）**：Plan = 真实代码↔Recipe 的**持久化桥梁/账本（living ledger，本地持续存储更新）**，管理 code→Recipe 抽象；内含**制定层(intent)+补齐层(generation-state/codeRecipeMapping/coverage/changeLog)**；init 制定完整生成计划、代码变更动态更新、三段生成写回补齐、进化动态改映射；Plan 在 `recipe_source_refs` 之上。三段+进化全部围绕 Plan 读写。
- **Plan 不猜逻辑（2026-06-21，细化 Q2）**：Plan = 真实信息收集器（项目信息 + 动态信号[新模块/进化衰退提案/覆盖] + 内置 SOP[sopPack/DOMAIN_PLAYBOOKS] + 领域[DimensionRegistry]）；内置 Agent 角色（SOP 定义、宿主扮演）据真实信息**决策**领域/规模/执行哪些 MCP 工具；**Plugin 不启发式臆测**；理解能力缺环节则**补齐建设**。

## Handoff Readiness

- Original plan confirmed：N/A（本设计承载）。
- Requirement design complete：是（核心目标 + 6 系统化要求 + Q1-Q3 + PD-A~D + 三段模型 + ⑦⑧ 全部确认）。
- Code facts sufficient：充分（维度/规模/规划 + 创建引导 + 时机矩阵 + 进化 + 区域/检测/推荐 + 向量 + 代码布局 均已核实到 file:line）；RG-0 待核若干实现期事实。
- Needs Wakeflow code research：RG-0（规划启发式衔接、Core 增量/预算接口、CO 冲突、rename 阈值、深度区分、迁移切片）。
- User decisions：全部已决（2026-06-21）。
- Ready for workspace handoff：**是**（决策全闭合、跨仓 Plugin+Core 已定、主体 follow-on 已标）。RG-0 待核作 intake 后首证据步、不阻塞。
