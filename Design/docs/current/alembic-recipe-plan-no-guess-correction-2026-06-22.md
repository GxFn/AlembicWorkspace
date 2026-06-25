# Recipe 生成体系符合性修正：Plan 完全权威 + 不猜 + 真实性（无捏造/无静默成功）+ 维度域信号 Requirement Design

Date: 2026-06-22
Status: **confirmed（全部决策已定 2026-06-22）**：核心 + 组 A-K + PD-1/2/3/4 + H2/H3 + S1-S4 + I3（删空壳富分析留域信号）+ 前端范围（换面保 tab）；落地方案基于真实代码核实分类（REWIRE/DELETE/BUILD）+ 阶段 P0-P6。**ready for handoff**（P0 首任务 3 项自查，不阻塞）。
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-recipe-plan-no-guess-correction-2026-06-22

## Confirmed Goal

修正 `alembic-recipe-evolution-optimization-2026-06-21` 实现中**偏离原始需求的逻辑**。两层：
1. **需求心脏（原 D1-D5，已确认）**：Plan = **完全权威计划**（产出全部符合预期维度+规模、删推荐/top-N、Agent 据真实信息产出、三段硬前置），维度选择域信号驱动且单一 canonical 路径。
2. **更广符合性偏差（GPT5.5 自审 61 条，逐条独立核实纳入真实者）**：confirm 必须 Agent 完整载荷、Plan 持久不越界、不猜在 Plugin 落实、进化路由真实、checkpoint 持久化、源引用/新鲜度真实、**Panorama 退场 + 前端只留 ProjectContext 模块依赖金字塔（用户重定向化繁为简，替代原"重建理解能力"）**、green-field 顺序。

"实现有效但偏离原始意图/真实性"的**对齐返工**。权威是**原始 requirement design**，**不是** GPT5.5 "凡原文未授权即删"核武规则。后续只执行本需求。

## 审计来源与判定口径

- **三轮审计**：① Design 4 路 Explore（聚焦 Plan/维度）；② GPT5.5 自审 61 条 `FAB-001~061`（`wakeflow-ledger/requirement-designs/alembic-recipe-evolution-gpt55-fabrication-audit/`）；③ **Design 8 路深挖（本轮）逐组核实真实代码结构/消费者/边界/可行性**（REWIRE vs BUILD）。
- **判定口径**：按原始需求逐条定性——删（推荐/top、逃生阀、Plugin 正则 fallback、死 fallback）/ 恢复正确（进化路由、checkpoint、共享图理解）/ 改 partial 或 block（静默截断、跳过新鲜度、缺图引 grounding）。不照搬 GPT5.5 核武规则。
- **修正了我方早前 3 处误判**（代码证实）：B 阶段理解能力 `FAB-039`、checkpoint 持久 `FAB-036/037/059`、green-field 顺序 `FAB-047`。
- **核实排除 1 条**：`FAB-044` = FALSE（freshness missing/partial bridge 实际正确置 `retrievalMayBeStale=true`），**不纳入**。
- **核实判 PARTIAL 1 条**：`FAB-022`——逻辑修改对 direct/pattern 影响**确已提交 proposal**，仅 `git-head` diff 不可得分支 changeLog-only（并入 F1，修面收窄）。
- **PD-3 已决**（接受现状）；**PD-4 已决**（用户 2026-06-22：new-module = REWIRE 文件级 moduleMining 扫描器 + 调整门控豁免文件级/scoped 单模块挖掘，**非从零 build**——见 Resolved）；**H2/H3 已决**（纳入 degraded/non-final）。
- **green-field（组 J）经核实 CLEAN**：无迁移污染、无遗留重复目录、project-knowledge-context 边界干净 → 本组降为"加边界守护测试"。
- **控制器/验收领域（非本需求产品代码范围）**：RG-10 验收放宽（`FAB-020/021/024/025/026/057`）、任务包措辞（`FAB-018/019`）、窄 root（`FAB-028`）。本需求只在 CG-12 验收口径要求"恢复原始 RG-10 四步、禁替代"，**不代行 Wakeflow 状态变更**。

## Plan = 完全权威计划（用户 2026-06-22 确定，核心定义）

**流向（精确）**：`alembic_plan` 把**确认事实**提供给内置 Agent → Agent **分析这些事实并产出 plan** → 返回的 plan 作为**完全权威**推进后续执行（冷启动等三段的前置硬性阶段）。

- **Plan 提供给 Agent 的 = 确认事实**：项目信息（ProjectContext）+ SOP 信息（sopPack/DOMAIN_PLAYBOOKS）+ 维度信息（DimensionRegistry 维度定义/extractionGuide + 域信号相关性）+ 其他需要的事实（动态信号等）。这些是**事实/参考材料**——不是推荐、不是 top-N、不是预先决策。
- **Agent 分析事实 → 产出 plan**：内置 Agent 据确认事实**分析并产出**完整的维度+规模计划（全部符合预期，非候选/子集）。Plugin **不**推荐/curate/排序截断/启发式臆测。
- **返回的 plan = 完全权威**：作为三段唯一权威源、照单推进执行；`intent` 在 `confirm` 落 `plans` 表。
- **删除所有「推荐」与「top-N」逻辑**：planLedger recommendedDimensions、planningAids recommended、moduleSeeds top-N 截断、suggested 排序——全删。Plugin 侧不出推荐/候选/top。
- **维度相关性 by 域信号（作为事实提供）**：域信号决定哪些维度相关（in/out 二值）作为"维度信息事实"交 Agent；Agent 产出的 plan 覆盖全部相关维度+规模，无 top-N 二次筛选。
- **执行优先级**：confirmed Plan 主路径 = **冷启动**（先行、权威、当前生成）；深挖/单模块挖掘/进化 = **后续推荐与补充**，非冷启动替代、非当前冷启动的补充（不并发/不替换/不混入）。

## 待修正偏差（grounded，独立核实 + FAB 溯源 + 落地分类）

> 分类：**DELETE**=删除虚假/死逻辑；**REWIRE**=接到已存在的正确机制；**BUILD**=正确目标不存在、需新建（重点风险）；**VERIFY**=已 clean，仅加守护。

### 组 A — Plan 决策权 / 推荐·top（DELETE，低风险）

证据已核：confirm **已支持** Agent 自著维度（推荐仅作默认）；factual 结构（`sourceReports.selection` 决策+证据、`dynamicSignals`、`projectContext`）**已存在**；删除符号（`priorityScore`/`recommendedDimensions`/`dimensionOrder`/`maxDimensionsPerDraft`/`subsetHints`/`crossDimensionConstraints` severity）**无行为消费者**（仅 intent 合成 + 响应回显）→ 删除结构安全。

| ID | 偏差 | 证据 | FAB | 落地 |
| --- | --- | --- | --- | --- |
| A1 | draft 把 `recommendedDimensions`→绑定 intent + `draftSource:'plugin-deterministic'` | `planLedger.ts:113-191`(`:120-126,190`) | 004,005 | **停止**在 draft 合成 `intent.dimensions/scale/stages`；draft 只返事实包；`draftSource→'plugin-collected-facts'` |
| A2 | scale 硬编码 55/30/15（Core+Plugin） | `planLedger.ts:154-162`；`plan-generation-gate.ts:548-557`；`plan-tool.ts:1721-1739,2247` | 035 | 删切分；规模来自 Agent confirm / 显式 testMode |
| A3 | 推荐契约+排序+`dimensionOrder`-from-recs | `contracts.ts:80-114`；`dimensionPlanning.ts:122-153,636-674,1077` | 002,003 | 删 `recommendDimension`/`compareRecommendations`/`decideProjectScale`/`buildCrossDimensionConstraints`/`buildSubsetHints` 及契约符号；改"观察事实维度清单+证据" |
| A4 | Plugin `maxRecommendedDimensions` schema + codex 场景 | `mcp-tools.ts:834`；`test/codex-scenarios/cold-start/{bootstrap-missing-ai,init-then-bootstrap-ai-ready}.json` | 001,031 | 删 schema；重写 2 场景（draft→confirm 不再链 `dimensions.0`，改由事实信号自著） |
| A5/A6 | `subsetHints`/`maxDimensionsPerDraft`/`moduleBatchSize`；cross-dim severity `recommended` | `contracts.ts:88-100,114`；`dimensionPlanning.ts:748-856,793-824` | 006,027 | 删 Plan 面子集 hints；severity 改中性 |
| A7 | **借** Plugin 硬编码 `targetCount:2`/`targetPerModuleDimension:2` | `plan-tool.ts:1518,1559` | 015 | **借/再评估**：核实为**覆盖缺口检测的事实目标**（非 top-N、非 Plan 维度/规模决策）→ 默认**保留**；仅当判定"覆盖目标也应由 Agent 定"才改（见 Open） |
| A8 | `DynamicSignalGateway` 文本→维度 id 推断、新模块硬编码 architecture | `dimensionPlanning.ts:163-180,233-241,875-884` | 040 | 删 text→dimension/priority 推断；**保留** `aggregateDynamicPlanningSignals`/`inferDimensionIdsFromText` 的**事实信号管道**（它是 evidence，非推荐）；返回带来源原始信号、未知留未知 |
| A9 | 测试夹具 top-slice / 子集当整 Plan | `AlembicPlanTool.test.ts:164-198` | 016,017 | 随码改为完整 Agent 载荷 |

### 组 B — 维度 canonical + 域信号 + 生成阶段（REWIRE + 谨慎迁移）

**关键边界（核实）**：① 存在**两个** `resolveActiveDimensions`——Registry（语言单因子，`DimensionRegistry.ts:627-642`）+ BaseDimensions adapter（`BaseDimensions.ts:72-92`，委托前者）。② signal-aware **无信号时 ≠ 语言单因子**：域映射维度落 `unavailable` 被丢→**朴素迁移会少维度**。③ 生成阶段消费 confirmed Plan 的**接线已存在**（`intent.dimensionIds` 经 gate→`applyPlanGateToProjectAnalysisIntent`→`selectProjectContextDimensions`），但它把 Plan ID **与语言单因子重算超集求交**（且 frameworks 丢空）→ Plan 确认的 framework 维度可能被交掉。

| ID | 偏差 | 证据 | 落地 |
| --- | --- | --- | --- |
| B1 | 旧 `resolveActiveDimensions` 未改 + 并存 signal-aware 无 canonical | `DimensionRegistry.ts:627-642`；`BaseDimensions.ts:72-92`；`dimensionPlanning.ts:83` | **PD-2**：signal-aware 设唯一权威；迁移 3 个生产消费者（`ProjectIntelligenceRunner.ts:224`、`project-context-analysis.ts:314`、`plan-tool.ts:842`）；删旧函数+barrel 导出。**迁移须喂真实域信号**或改"直读 Plan ID"，否则少维度（R6）。2 个 `DimensionAnalyzer` 消费者疑为已退役 Panorama，CG-0 核实 |
| B2 | `decideDimension` 域信号兜底（第 7 步）+ `FOUNDATIONAL_DIMENSIONS`={architecture,coding-standards,design-patterns,agent-guidelines} 恒开 + performance 特判 | `dimensionPlanning.ts:413-552` | 域信号升为一等 gate；foundational 收敛为 **PD-1 极小例外**；performance 已是非 foundational 特判（可作"显式例外"范式） |
| B3 | 生成阶段用 `primaryLang`+空 framework 重算维度再与 Plan ID **求交** | `project-context-analysis.ts:181-185,313-314`；`cold-start.ts:169-172`；`knowledge-rescan.ts:292-303` | **REWIRE**：`selectProjectContextDimensions` 改为"按 confirmed `intent.dimensionIds` **直接 resolve** 维度定义"，**不**再重算语言单因子超集求交。confirmed Plan intent 在此**已可达** |

### 组 C — confirm 必须 Agent 完整载荷（REWIRE/DELETE，低风险）

核实：confirm schema 全 optional；4 个 normalizer + rationale **静默继承** draft；`buildDraftConfirmNextAction` 主动建议**无载荷** confirm；Core confirm 浅合并、**从不**标 `draftSource:'host-agent'`（今天真伪 Agent 不可辨）；**无非测试无载荷调用方**。

| ID | 偏差 | 证据 | 落地 |
| --- | --- | --- | --- |
| C1 | optional 载荷 + 静默继承 + nextAction/描述鼓励无载荷 | `mcp-tools.ts:851-867`；`plan-tool.ts:486-502,658,1651-1783`；`tools.ts:224-228` | confirm 用 discriminator `superRefine` **必填非空** `selectedDimensions/scale/moduleBindings/plannedNextActions`，缺即硬错；删 4 normalizer + rationale 的 `→existing` 继承；confirm 标 `draftSource:'host-agent'`；重写 nextAction/描述/场景要求完整载荷。**测试**：依赖部分载荷+继承的用例须补全（`AlembicPlanTool.test.ts:291` 等） |

### 组 D — Plan 持久不越界（DELETE/REWIRE，低风险，无需迁移）

核实：`planning_brief_json` **可空**、`mapRow` 已容 null、**真实库零 confirmed 行**（仅一次性测试夹具）→ **stop-write 足够，无需 drop-column 迁移**。签名 scope 唯一真输入是 `focusModules`，可从 confirm 载荷 `moduleBindings`/`stages.deepMining.focusModules` 重算（**不丢信息**）。`focusModules` **双重职责**：(a) 缩扫描模块[保留] (b) 入签名 hash[切断]。

| ID | 偏差 | 证据 | 落地 |
| --- | --- | --- | --- |
| D1 | `planningBrief` 持久进 plans 表 + 暴露；confirm 签名依赖 `planningBrief.signatureScope` | `012_plans.ts:29-30`；`PlanRepository.ts:51-52,204`；`plan-tool.ts:592-623,1785-1801` | **stop-write**（`PlanRepository.ts:52` 写 null）+ 不暴露（`plan-tool.ts:1800`）；签名改读 confirm 载荷 `moduleBindings`/`stages.deepMining.focusModules`；从签名 metadata 去 `signatureScope`（`:1629-1631`）。drop-column 可选（列可空，零真数据） |
| D2 | confirm 公共逃生阀 `allowSignatureMismatch`/`allowStaleVersion` | `mcp-tools.ts:858-867`；`plan-tool.ts:247-250,545-552` | 删公共逃生阀；如需→独立受控 admin 路由 |
| D3 | `focusModules` 入权威/签名 | `mcp-tools.ts:831`；`plan-tool.ts:799-808,2046-2054` | 仅断**签名-权威**职责；**保留**缩扫描/deepMining scope；更新依赖 focus-敏感性的测试/夹具 |

### 组 E — 不猜在 Plugin 落实（DELETE + Core companion）

**关键核实**：删 Plugin fallback **对冷启动安全**——Core ProjectContext handlers（repo/map/module）**直接扫文件系统**（非读持久存储），冷启动时 Core ProjectContext **已 populated**；Plugin fallback 是**劣质重复二次扫描**（正则推断+0.58 置信路径猜角色），仅当 Core map/module 相对自身 repo 扫描**欠交付**时触发。删除会**暴露 Core map/module 解析缺口**。partial-draft 形态**需新建**（今天只有 success/blocked）。`previousModules` 真实基线**已存在**（`recipe_source_refs` 覆盖，`FileChangeHandler.ts:386` 已用）。

| ID | 偏差 | 证据 | 落地 |
| --- | --- | --- | --- |
| E1 | Plugin fallback fs 扫描+正则推断 framework，测试当成功路径 | `plan-tool.ts:773-909,1026-1325,937-954`；`AlembicPlanTool.test.ts:90-153` | **删** fallback + 改测试；Core map/module 欠交付时 **Plugin 返回 partial draft**（新建 `coverage:'partial'`/`understandingGaps` 形态、如实暴露缺口，不静默猜）；**Core 理解补齐不在本需求**（S2=b，按缺口规模另评） |
| E2 | raw-read 关系 grounding fallback | `project-context-anchoring.ts:48,239-247`；`OnboardingContract.ts:620-852` | 删 raw-read 作为图证据替代；缺图→ungrounded/partial 或走 recipe_map/graph |
| E3 | draft/冷启动/rescan 静默截断（4 模块/8 seeds）无标记 | `plan-tool.ts:808,2052-2054`；`project-context-analysis.ts:83-90,131-147,298-310` | 加 total/omitted/`partial` 标记+后续动作；未完整不得作完整证据 |
| E4 | `previousModules:[]`→全模块 new-module 信号 | `plan-tool.ts:1561-1564`；`dimensionPlanning.ts:286-313` | 改读 `recipe_source_refs` 覆盖基线；无真实 delta 不发 new-module |

### 组 F — 进化路由真实性（REWIRE + 1 处 MUST-BUILD）

| ID | 偏差 | 证据 | FAB | 落地（核实分类） |
| --- | --- | --- | --- | --- |
| F1 | 逻辑修改：`git-head` modified 且 diff 不可得绕过 Gateway 仅 changeLog | `FileChangeHandler.ts:256-279` | 055,022 | **REWIRE**：`EvolutionGateway.submit` 真实且对 direct/pattern **已接好**；仅把此分支降级为 `#submitUpdateProposal`（网关接受 reference 级、无需 diff）。其余逻辑改路径已合规 |
| F2 | 新模块只发 recommendation、`planIntentWrites:0`、不跑 area-scan | `FileChangeHandler.ts:368-426`；`project-context-analysis.ts:147-275`；`plan-generation-gate.ts:116-184,490-540` | 023,056,050 | **REWIRE + 门控调整（PD-4 已决）**：文件级扫描器 `buildHostAgentProjectContextAnalysis` **已存在**（接任意 `moduleScope`、领域无关、不需 Plan 成员），把新模块路由接到真实调用；**但其唯一入口当前硬 Plan-gated**——按 PD-4 让**文件级/scoped 单模块挖掘豁免全量 Plan-signature 门、维度按文件级解析**（项目级 cold-start/全量 rescan 仍硬前置）。非从零 build |
| F3 | `strong-proposal`/`weak-hint` 公共 fallback | `PluginOpportunisticEvolution.ts:9-14,189-224` | 058 | **DELETE 安全**：仅在 Core unified-evolution 不可用的退化路径触发、**不写库**；删后塌缩为 no-op/routed |
| F4 | `extractTaskCloseOutcome()` 把 `alembic_task` 当进化证据 | `PluginOpportunisticEvolution.ts:227-246,275-292` | 061 | **DELETE 安全**：零生产调用方、`alembic_task` 已退役 |
| F5 | `dimensions`/`moduleScope`/`scaleOverride` 在非 testMode 也过滤/扩张 Plan | `plan-generation-gate.ts:198-216,445-540`（`tools.ts:61-73` schema） | 030,034 | **REWIRE**：把 dimensions 过滤(`:483-486`)/moduleScope union(`:533-538`)/scaleOverride(`:550-557`) 全部 gate 在 `testMode===true`；moduleScope 为执行**上界不扩张** |

### 组 G — checkpoint 持久化（MUST-BUILD）

**核实**：3 处 checkpoint 全是**进程内 Map**（重启即失），无任何持久化。`plans` 表的 commit 列是**草稿出处非推进检查点**。初值可用 `getActiveConfirmed().lastUpdatedFromCommit`（已接线）替代 `HEAD^` 猜测。`git merge-base` 仅 `GitDiffScanner.ts:209` 用一处、**检测非祖先但不 catch-up**（算出即丢弃）。推进 gate 仅看 `scan.scanned`、与路由成功解耦（bug）。**重复副本**：`recipe-generation/evolution/git-diff-checkpoint` 与 `service/evolution/git-diff-checkpoint` 两份且**已分叉**。

| ID | 偏差 | 落地 |
| --- | --- | --- |
| G1 | 进程 Map + 猜 `HEAD^` | **BUILD**：新迁移 `013` + Core 检查点表/repo（键 `projectRoot+scopeId+folderId`，匹配 presenter 复合键）；初值=`getActiveConfirmed().lastUpdatedFromCommit`；删 `HEAD^` 猜测 |
| G2 | 截断/非祖先跳过路由但 checkpoint 仍推进 | 推进 gate 改"成功路由/catch-up 后"；`git merge-base` catch-up：把 mergeBase 透出 `GitDiffScanResult` + 新增 `mergeBase..HEAD` 路由；未解析 range 不丢 |
| G3 | RG-8 触发集排除 prime/search/recipe_map | 检索消费面补 catch-up/进化可见性，或标 RG-8 触发不全 |
| G* | **重复 git-diff-checkpoint 副本** | 改动覆盖两份或先**消除死副本**（CG-0 确认活路径） |

### 组 H — 源引用 / 新鲜度真实性（REWIRE + 1 契约变更 + 2 可见行为确认）

| ID | 偏差 | 证据 | 落地（核实可行性） |
| --- | --- | --- | --- |
| H1 | `SourceRefReconciler` 解析错/缺失→空数组后**删 refs** | `SourceRefReconciler.ts:177-211,221` | **REWIRE 无契约变更**：`#parseReasoningSources` 改判别返回（valid-empty / missing / parse-error）；仅 valid-empty 可清，错/缺→failed/blocker。per-recipe 路径(`:177-183`)是危险点 |
| H4 | 投影 codeRecipeMapping 无 source_refs 时从 `sourceFile` 造 `generated` | `planLedger.ts:279-300` | **REWIRE 复用 `'missing'` 态**（契约已有）；耦合 H5 覆盖数 |
| H5 | coverage 跨维折叠、gap 只挂 `dimensions[0]` | `planLedger.ts:379-476`；`contracts.ts:190-196` | **契约变更**：加 `byModuleDimension` 矩阵；数据可由 `mapping.modulePath×dimensionIds` + `binding.dimensions` 派生 |
| H6 | PlanRepository 未知 status→draft、坏 JSON→empty | `PlanRepository.ts:189-232` | **REWIRE 内部**（保 `PlanRecord\|null` 公共契约）：区分"行缺失→null"vs"行损坏→typed error"；`listByProject` 需逐行处理 |
| H2 | create/submit freshness 缺失=success | `RecipeFreshnessRuntime.ts:94-108`；`tool-router.ts:344-376` | **可见行为变更→需确认**：4 态 status 已存在；策略=freshness 失败/不可用时 success 翻 failed/degraded（无内部消费者依赖 success，但改变 host 可见行为） |
| H3 | 关系 grounding 缺图引非阻塞 success:true | `tool-router.ts:159-184,501-508`；`project-context-anchoring.ts:171-210` | **可见行为变更→需确认**：non-final/degraded 可在现契约内；真 pre-creation block 需流程重排（grounding 评估在 create 之后） |

### 组 I — Panorama 退场 + 前端项目金字塔（用户 2026-06-22 重定向：化繁为简）

**用户决定**：不重建复杂架构理解（**推翻**原始"重建 Panorama 价值分析为独立能力"方向 + FAB-039/024 的 rewire 方向）；**直接删 Panorama**；前端只展示**基于 ProjectContext 的项目金字塔模块依赖关系**，去掉知识覆盖等不需要信息。

**核实（利好）**：
- **Panorama 已是死代码**：`panoramaService` 在任何 DI 容器**从未注册**→`container.get('panoramaService')` 返 undefined、产出 null；HTTP `/panorama*` 已 410 Gone。→ **CLEAN DELETE，无活生产消费者**。
- **金字塔已存在**：`AlembicDashboard/src/components/Views/DepGraphView.tsx` 已是 ProjectContext 模块依赖**分层金字塔**（`computeTiers`/`pyramidLayout`），数据来自活的 `GET /modules/dep-graph`（ProjectContext-backed）。当前埋在 Panorama `dependencies` 子 tab。→ **提升为主视图 + 减法**，非新建。
- **architectureIntelligence 独立**（`panoramaServiceFree:true`，不 import Panorama），删 Panorama 不影响它；它供 plan-tool（draft 架构 + 签名）+ 组 B 维度规划的**域信号**。
- **KEEP（金字塔数据源）**：project-intelligence phase runners + `code_entities`/`knowledge_edges` + `/modules/dep-graph` + `resolveActiveDimensions`。`DimensionAnalyzer` 属 Panorama、无活外部消费者→随删（组 B 迁移面 -2）。

| ID | 落地 |
| --- | --- |
| I1 | **删 Panorama**：`AlembicCore/src/service/panorama/*`（11 文件）+ `ProjectIntelligenceRunner.materializeProjectPanorama`（死码）+ `test-fixtures.ts` 再导出 + `project-intelligence.ts` barrel 导出 + Panorama 测试 + vendor 镜像同步；retired `panorama.ts` 410 路由可一并清（其 `/governance/*` 子路由用 decayDetector/stagingManager **非 Panorama**，保留/另置） |
| I2 | **前端金字塔（范围已决：换面保 tab）**：提升 `DepGraphView` 为主"项目金字塔模块依赖"视图；删覆盖/Panorama 面（`PanoramaView` OverviewPanel/ArchitecturePyramid/HealthBar/Gaps、`KnowledgeView` guardHits/searchHits tiles、死 `getPanorama*`/`knowledgeStats` api client）；**保留其余功能 tab**（recipes/candidates/guard/jobs/skills）。frontend-only + 可选后端清 410 路由 |
| I3 | **architectureIntelligence：删空壳富分析（已决）**：删 roles/coupling/layers/callflow（FAB-039 生产跑空图出默认）+ FAB-046 默认改 unknown；**保留域信号检测**（组 B 维度相关性需要）。P0 先核 plan-tool 签名对其依赖（若用到→改稳定 hash 来源） |

### 组 J — green-field（VERIFY，已 clean）

核实：green-field **无污染**、无遗留重复目录；`project-knowledge-context` 在 `lib/service/`、`recipe-generation` **零导入**（边界干净，PD-3 满足）。

| ID | 落地 |
| --- | --- |
| J1/J2 | **降为加守护**：补 1 个**导入边界断言测试**（`lib/recipe-generation` 不得导入 `project-knowledge-context`）；无迁移/无搬动工作 |

### 组 K — 低优 / 文档（澄清）

K1 `search.ts:1871` 透传注释消歧；K2 原始需求 Q2/`plugin-deterministic` 措辞按不猜 canonical 改（**根因**）。

## Final Completion Definition

逐组完成标准见上"落地"列；总验收（Wakeflow 仅在全满足时接受）：Plan 完全权威无推荐/top（A）；confirm 必须完整载荷（C）；plans intent-only 无逃生阀（D）；维度单一 canonical+域信号一等+生成阶段直读 Plan（B）；不猜在 Plugin 落实+Core 缺口修或 partial（E）；进化逻辑改出 proposal、F2 新模块接文件级 moduleMining（门控按 PD-4 豁免）、删死 fallback、override 仅 testMode（F）；checkpoint 持久不漏 range（G）；源引用/新鲜度真实（H1/H4/H6 + H2/H3 = degraded/non-final）；理解能力接共享图或标 partial（I）；green-field 守护绿（J）；**验收恢复原始 RG-10 四步禁替代**；不回退已真实符合骨架；跨仓 Plugin+Core 构建测试绿。

## 执行顺序（拆分为阶段 P0-P6，用户 2026-06-22 确认拆分）

| 阶段 | 主题 | 组/内容 | 仓 | 依赖 | 风险 | 分类 |
| --- | --- | --- | --- | --- | --- | --- |
| **P0** | 盘点 + 表征测试 | 消费者清单、git-diff-checkpoint 重复副本活路径、performance 特判、**architectureIntelligence 对 plan-tool 签名的依赖**（定 I3）、前端 UI 范围；表征测试锁现状（draft auto-fill / 语言单因子 / changeLog-only / 进程 Map / freshness skipped） | Core/Plugin/Dashboard | 本设计 | 低 | VERIFY |
| **P1** | Plan 权威落实 | A 删推荐/top（draft 仅事实包）+ C confirm 必填完整载荷 + D Plan 持久 stop-write/签名改源/删逃生阀 | Core+Plugin | P0 | 低 | DELETE/REWIRE |
| **P2** | 不猜 + 维度域信号 | E 删 Plugin fallback→**返回 partial draft**（不修 Core，S2=b）+ B 维度 canonical+全量迁移+生成阶段直读 Plan ID + B2 域信号一等闸门 | Core+Plugin | P1 | **高（R6 少维度）** | DELETE+迁移 |
| **P3** | 进化/挖掘真实 | F1 logic-mod proposal rewire + F2 new-module→文件级 moduleMining+门控豁免 + F3/F4 删死 fallback/extractTaskCloseOutcome + F5 override 仅 testMode + G checkpoint 持久（迁移 013+Core repo+catch-up+去重副本） | Plugin(+Core 迁移) | P0 | 中-高 | REWIRE+BUILD |
| **P4** | 源引用/新鲜度真实 | H1 不删证据 + H4 投影锚定 + H6 不静默 + H5 coverage 矩阵（契约）+ H2/H3 degraded/non-final | Core+Plugin | P0 | 中 | REWIRE+契约 |
| **P5** | Panorama 退场 + 前端金字塔 | I1 删 Panorama（clean，多为死码）+ I2 前端 DepGraphView 主视图+删覆盖面 + I3 architectureIntelligence 处置 | Core+Plugin+Dashboard+主体 | P0（+P2 域信号协调） | 低-中（减法/死码） | DELETE+前端 |
| **P6** | 验收 | BiliDili 测试模式 + **恢复原始 RG-10 四步（禁替代，控制器另行重验收）** + 跨仓回归；J 边界守护测试 + K 澄清 | 全；下游=Test | 全部 | — | VERIFY |

**串行关键链**：P0 → P1（Plan 权威）→ P2（不猜/维度，依赖 Plan 干净，最高风险单独相）。**可并行**：P0 后 P3/P4/P5 大体与 P1/P2 并行（P3 含门控、P5 与 P2 域信号协调）。P6 收尾。

**分波交付建议**：① 波一 = P1+P2（需求心脏：Plan 权威 + 不猜维度）；② 波二 = P3+P4（进化 + 真实性）；③ 波三 = P5（Panorama 退场 + 前端）。每波独立绿、独立验收。P5 因多为死码/减法，亦可最先单独推进（风险最低、见效快）。

## Validation Strategy

- **Controller self-verification**：Plugin+Core 单测/typecheck/lint（core-import / public-api / layer-boundary）；表征测试先锁现状再逐组对照——draft-no-intent-no-recommend、confirm-requires-full-payload、单一 dimension-resolution、生成阶段-consumes-plan-ids、域信号 gating、proposal-on-githead-modified、no-dead-fallback、durable-checkpoint-no-advance-on-skip、merge-base-catchup、no-evidence-deletion、unanchored-not-generated、arch-intelligence-reads-shared-graph、import-boundary（recipe-generation 不导入 project-knowledge-context）。
- **Test handoff（BiliDili 测试模式）**：draft 返事实包（无绑定 intent/推荐/top）；Agent 完整载荷 confirm→intent 落表；冷启动主路径先行、深挖/单模块/进化后续补充；headless 不自动定维度；**RG-10 原始四步真实通过**（rename 直接修指针 / 逻辑改 pending proposal / prime+search 检索 / stop-Ollama 向量降级），禁替代证据。
- **This test cannot prove**：Agent 决策"质量"（启用后评估）。

## Risks And Decisions

### Risks
- **R1 范围大（10 组）+ 含真 BUILD（G/F2/H5）**：非纯对齐返工。缓解：分 4 Tier、表征测试、CG-12 统一回归；BUILD 项单独相。
- **R2 维度 canonical 删除+全量迁移（PD-2 跨仓）**：named-export sweep 全消费仓 + 下游 tsc。缓解：CG-0 消费者清单先行；逐切片绿。
- **R6 signal-aware 无信号收缩维度**：朴素迁移生产消费者会少域映射维度（核实非等价）。缓解：生成阶段改"直读 confirmed Plan ID"（B3），signal-aware 调用处确保喂真实域信号；表征测试对比迁移前后维度集。
- **R7 真 BUILD/契约项工作量**：G（迁移 013+Core repo+catch-up）、H5（契约变更）。F2 经 PD-4 降为 REWIRE+门控调整（扫描器已存在）。缓解：表征测试；G 复用已接线初值。
- **R10 F2 门控调整触及"三段硬前置"**：让文件级单模块挖掘豁免全量 Plan-signature 门，须与"项目级 cold-start/全量 rescan 仍硬前置"清晰分流，避免削弱 Plan 权威。缓解：豁免仅限文件级/scoped 单模块路径 + 维度文件级解析，不改 cold-start/full-rescan 门；CG-5 先定门控语义。
- **R8 重复模块副本**：git-diff-checkpoint（及对应 FileChangeHandler）在 `recipe-generation/evolution` 与 `service/evolution` 两份已分叉。缓解：CG-0 确认活路径、改动覆盖两份或先消死副本。
- **R9 I 组可达性未证**：plan-tool 同步、仅持 presenterInput；图 DB 在 Core，是否同 run primed 未证。缓解：CG-0 先核；未达则"Core 产快照、Plugin 消费"或标 partial。
- **R-companion E**：删 Plugin fallback 暴露 Core map/module 解析缺口。S2=b：本需求**只落 partial draft**（如实暴露缺口给 Agent/host），Core 理解补齐按缺口规模**另评、不进本需求**。

### Resolved Decisions
- **Plan = 完全权威计划（用户 2026-06-22，核心）**；删 recommendation/top-N；Plugin 供事实、Agent 产完整权威 Plan；域信号定相关性；三段硬前置；冷启动主路径、其余后续补充。
- **修正范围**：组 A-K（GPT5.5 经独立核实为真者）；权威=原始需求；不回退已真实符合项。
- **PD-1 = 极小显式恒开例外**；**PD-2 = 删旧 resolveActiveDimensions + 全量迁移**（跨仓门禁）；**PD-3 = 接受 project-knowledge-context 现状为修订**（J 降 VERIFY）。
- **FAB-044 排除**（FALSE）；**FAB-022 PARTIAL**（仅 git-head 分支，并入 F1）。
- **A7（targetCount）默认保留**：核实为覆盖缺口事实目标、非 top-N/Plan 决策。
- **green-field（J）已 clean**：仅加边界守护测试。
- **PD-4 = REWIRE 文件级 moduleMining + 门控调整**（用户 2026-06-22）：核实文件级扫描器 `buildHostAgentProjectContextAnalysis` 已存在（接任意 `moduleScope`、领域无关、不需 Plan 成员），new-module 路由接到真实调用即可；**非从零 build**。按用户"moduleMining 不是硬 Plan-gated、文件级、不需领域单独分类"——让**文件级/scoped 单模块挖掘豁免全量 Plan-signature 门、维度按文件级解析**；**项目级 cold-start/全量 rescan 仍硬 Plan 前置**（与 OR-009 不冲突；单模块挖掘是后续文件级补充）。
- **H2/H3 = 纳入 degraded/non-final**（用户 2026-06-22）：freshness 不可用 / 缺图引 grounding 时返回 degraded/non-final（带明确 status + `retrievalMayBeStale`），Recipe 仍创建但明确标未完全锚定/新鲜；**不翻 failed**、不需流程重排预阻断；4 态 status 已存在、改动在现契约内。
- **S1 = 拆分为阶段 P0-P6**（用户 2026-06-22）：见执行顺序；可分波交付（波一 P1+P2 心脏 / 波二 P3+P4 / 波三 P5）。
- **S2 = E companion 取 (b) partial draft**（用户 2026-06-22 按推荐）：删 Plugin fallback 后 Core map/module 欠交付 → 返回 partial/标记，不猜；Core 理解补齐按缺口规模另评，不进本需求。
- **S3 = 验收边界**（用户 2026-06-22 按推荐）：本需求完成 = 分组验证 + BiliDili 测试模式绿；**原始 RG-10 四步重验收由控制器在产品修复后另跑**（验收放宽本属控制器领域）。
- **S4 → Panorama 直接删除**（用户 2026-06-22，**推翻**原"迁移/重建"方向）：核实为死代码（DI 从未注册、路由已 410）→ clean delete；前端 DepGraphView（ProjectContext 模块依赖金字塔，已存在）提升为主视图、删知识覆盖面。详见组 I。
- **默认确认**（用户 2026-06-22 按推荐）：A7 保留 targetCount；G 新增 migration 013 + 独立 checkpoint 表；H5 改契约加矩阵；控制器领域项不进产品代码范围。
- **I3 = 删空壳富分析、只留域信号**（用户 2026-06-22）：删 architectureIntelligence 的 roles/coupling/layers/callflow（FAB-039 生产跑空图）+ FAB-046 默认改 unknown；**保留**组 B 维度相关性所需的域信号检测。P0 先核 plan-tool 签名依赖。
- **前端 UI 范围 = 换面保 tab**（用户 2026-06-22）：把 Panorama/覆盖面换成金字塔（DepGraphView），删知识覆盖显示；**保留** recipes/candidates/guard/jobs/skills 等功能 tab。

### Open Decisions
- 无（全部已决 2026-06-22）。P0 首任务自查（plan-tool 签名对 architectureIntelligence 的依赖、git-diff-checkpoint 重复副本活路径、旧 resolveActiveDimensions 消费者清单）不阻塞 intake。

### Non-Goals
- 不新增 Recipe 生成能力（F2 除外，按 PD-4）；不推翻已真实符合骨架/三段/向量 isAvailable/Plan intent 持久+读时投影无双写。
- 不删 plans 表/证据/提案/向量结构；不改四工具对外语义（H2/H3 的 success 语义按确认）；保持非常驻不变量。
- 不代行控制器 Wakeflow 状态变更；不照搬 GPT5.5 核武规则。

## Handoff Readiness
- Requirement design complete：核心 + 落地方案（REWIRE/DELETE/BUILD 已分类、边界已核实、执行序已定）= 是。
- Code facts sufficient：充分（8 路深挖核实到 file:line、消费者、可行性）；CG-0 收尾核实 5 项（消费者清单/DimensionAnalyzer 死活/I 可达性/重复副本/PD-4·H2·H3 落定）。
- User decisions：全部已决（核心 + PD-1/2/3/4 + H2/H3，2026-06-22）。
- Ready for workspace handoff：**是**（独立、可自动化推进）。CG-0 收尾自查 3 项（I 组 DB 可达性、git-diff-checkpoint 重复副本活路径、旧 resolveActiveDimensions 消费者清单），不阻塞 intake。
