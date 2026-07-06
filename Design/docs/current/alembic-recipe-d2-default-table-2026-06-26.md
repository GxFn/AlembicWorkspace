# D2 通用默认表 — Recipe 生命周期 round 边界/阈值（规模自适应回退默认）

Date: 2026-06-26
Status: design-spec（ready-for-controller-intake）— 经 task `design-d2-default-table` 指派写交付
Source Window: Design
Design Key: `alembic-recipe-d2-default-table-2026-06-26`
Parent Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形 §0 决策 D2 / CG-2）
Scope: AlembicCore + AlembicPlugin（消费侧）；本表是**回退默认值规格**，不改产品码、不 mutate 状态、不 dispatch
Grounding: 伞形需求设计 §0-D2 + 第二轮对抗核验（authoritative）+ 1-agent 代码级常量核验（AlembicCore/AlembicPlugin live 源，零 expectation mismatch）

---

## §1 决策复述（D2 / CG-2，照此执行）

伞形 §0-D2 已决：**round 边界/阈值 = Design 先给一张通用默认表（按真实项目规模自适应），实现侧只消费、不拍脑袋（no-guess）**；同时 plan 规模语义优先。统一优先级：

> **plan 规模语义（如 `binding.targetRecipes`）> 本通用默认表**

本表是 **fallback 默认**，不是硬编码强制值。实现侧把每项作为「plan 未携带显式值时」的回退常量（建议同 `resolveStagingAccessSweepCap` 形态：默认值 + env 覆盖 + guard），**不得**把它写成绕过 plan 的强制值。

任务窄化（task package）：本表**新定** U1 perCellTarget / U2 round（K·maxRounds·单轮预算）/ U6 内容指纹批量护栏 / U3 rescan 预算（本阶段复用现常量）/ UM created 退役阈值；**现存有意阈值** U4 decay cap、U5 merge overlap/FP **只注明、不重定**（避免与有意分叉冲突）。

---

## §2 规模信号与分档（来自 projectContext 基础能力，不另造）

**主信号 = canonical 模块数**：`ProjectMap.modules.length`（`AlembicCore/src/domain/project-context/ProjectContextMap.ts:252`，`modules: ModuleSummary[]`）。这是 D1 已确认的 canonical 模块轴，与 moduleMining 取数同源——**不新造来源**。每个 `ModuleSummary{id,name,kind,configLayer,ownedFileCount,role,roleConfidence,ref}`（同文件 155-164）。

**次信号（同档内消歧）= 模块自有文件总数**：`Σ ModuleSummary.ownedFileCount`（或 projectContextAnalysis 的 `sourceFileFacts.length`），区分「少而大」vs「少而小」的模块。

**U6 专用轴 = active `recipe_source_refs` 行数**：内容指纹护栏是**维护域**规模，按 active source_ref 计，不按模块轴（见 §5 must-confirm #2）。

**分档（边界本身亦为 Design 荐默认，可按真机调）：**

| 档 | 模块数（主） | 自有文件数（次） | 代表 |
|---|---|---|---|
| **S 小** | ≤ 3 | ≤ ~150 | 单 package/folder；**BiliDili**（单 folder / 11 source_ref / 3 recipe）落 S |
| **M 中** | 4 – 12 | ~150 – 1500 | 典型多 package monorepo |
| **L 大** | ≥ 13 | > 1500 | 大型 monorepo |

维度数按伞形「全 14 维」grounded：**cell 网格 = 模块数 × 14**。下表 round/cell 档值已对 14 维网格核对（见 §3 注）。

---

## §3 D2 默认表（核心交付）

> 每项：S/M/L 档值 + 依据 + 现存常量状态。**优先级一律 `plan 值 ?? 本表[tier]`**。

| 消费点 | 现存? | S | M | L | 依据 |
|---|---|---|---|---|---|
| **U1 `perCellTarget`**<br>moduleMining per-(模块×维度)<br>目标 Recipe 数（gap target）| **NEW**<br>替代 per-dim<br>`TARGET_RECIPES_PER_DIMENSION=5` | **5** | **3** | **2** | 旧常量是 per-**dimension** 全局；新值是 per-**cell**(模块×维度)。**单模块项目 per-cell ≈ per-dim → S 取 5 保持零回归**（直接对接 U1「不传 moduleBindings 时逐字段一致」回归保护）；网格细化后降档防总预算爆炸；L 首扫取代表性 2，deepMining 多轮填至覆盖。⚠️见 must-confirm #1（floor=3）|
| **U2/U1 perCell gap target**<br>空白/单薄格判定覆盖目标 | = perCellTarget | 5 | 3 | 2 | 与 perCellTarget 同源一致（D4 per-cell）；gap = `max(0, perCellTarget − perCellCoverage)` |
| **U2 K（收益递减）**<br>`new_recipes_this_round < K` 即停 | **NEW**<br>(CoverageLedgerAdvisor<br>greenfield) | **1** | **2** | **3** | K = 单轮边际产出地板。随规模升：大项目单轮触及更多 cell，「值得再发一轮」的盈亏线更高；S 一轮近零即停 |
| **U2 maxRounds**<br>deepMining 轮次硬上限 | **NEW** (greenfield) | **2** | **3** | **5** | 安全闸非目标——收敛（无空白格/全 exhausted）或 K 正常更早停。小网格 ≤2 轮填满；大网格跨轮补齐封顶 5 防失控 |
| **U2 perRoundCellBudget**（可选）<br>单轮 plan 的 cell 上限 | **NEW** (greenfield) | 全部<br>(≤~50) | **60** | **80** | 保单次 rescan 可控、响应落 U3 预算内；大项目跨轮而非单巨轮。核对：S 42 cell 一轮全覆盖；M 60×3=180≥168；L 80×5=400≥280 |
| **U6 内容指纹批量护栏**<br>rescan 单次内容重校验上限 | **NEW**<br>仿 staging-cap 形态 | **50** | **150** | **400** | 仿 `resolveStagingAccessSweepCap` 有界排空：**最旧 `verified_at` 优先 + 跨调用排空 + env 覆盖 + guard≥1**。50 一遍覆盖 BiliDili 规模（11 ref）；大档提吞吐但每次哈希量仍 ≤ U3 响应预算，防全量扫描卡顿 |
| **U3 rescan inline 预算**<br>briefing inline 字节 / compact 阶梯 | **EXISTING**<br>复用 18KB | 18KB | 18KB | 18KB | 本阶段**复用** `COLD_START_BRIEFING_INLINE_BUDGET_BYTES = 18*1024`（`cold-start.ts:88`）：spill→transient + compact 阶梯 + `trimColdStartBriefingToBudget` 终钳。**规模派生 = defer 后续不阻塞**（见 must-confirm #3）|
| **UM created 退役阈值** | **无需定义** | — | — | — | created→生成路径已退役（U2e/UM#1 同处落地）；created 降为**纯计数诊断信号**（决策⑤b，可观测非生成），**无阈值门控任何行为** |

注（网格核对）：cell = 模块×14 维。perRoundCellBudget × maxRounds ≥ 各档网格 cell 数，确保大项目可跨轮补齐而单轮可控。

---

## §4 现存阈值（只注明，勿重定 — 经代码核验）

这些是已有意阈值/能力，本表**不重新定义**，仅供 intake 一处可见：

| 项 | 现状（已核验 file:line） | D2 口径 |
|---|---|---|
| **U4 decay round/cap** | `DEFAULT_STAGING_ACCESS_SWEEP_CAP = 50`（`staging-access-sweep.ts:8`）；`resolveStagingAccessSweepCap`：env `ALEMBIC_STAGING_ACCESS_SWEEP_CAP` + guard `<1` 回退；现役 3-driver sweep 共享 | decay 是**第 4 driver 共享同一 cap=50**（CG-7 实测驱动：durationMs≥2s 才拆独立 `decay-access-sweep.ts`）。**不新定 decay 专属 cap** |
| **U5 merge 高重叠门** | `HIGH_OVERLAP_THRESHOLD = 0.65`（`ConsolidationAdvisor.ts:112`）→ merge 动作 | **不动**（第二轮 C5 明示「阈值勿动」）|
| **U5 enhance 门** | `ENHANCE_THRESHOLD = 0.4`（`ConsolidationAdvisor.ts:109`）→ [0.4,0.65) enhance | **不动** |
| **U5 误报率护栏** | `UPDATE_FP_THRESHOLD = 0.4`（`EvolutionPolicy.ts:39`）→ update FP 门 | **不动**；U5 `evaluateMerge` **复用** FP=0.4 作护栏（merge 拆掉的是被误用的 `hasUsage`，非放松 FP）|

**关键：U5 是「拆分/纠正被误用门禁」（merge 不该要求 hasUsage），不是放松门禁。** 这三个相似度/FP 数值保持原值。

---

## §5 no-guess 合约与消费要点（供控制器 intake / 实现侧）

1. **优先级落地**：perCellTarget = `binding.targetRecipes ?? D2[tier]`。⚠️第二轮 A.U1 核实：`moduleBindings.targetRecipes` 运行时**不保证非空**（`normalizePlanSelection` 只强制 `dimensions` 非空，从不校验 `targetRecipes`）→ 必须 `?? 默认`，不可假设非空。
2. **回退而非强制**：每项实现为「默认常量 + 可选 env 覆盖 + guard」（仿 `resolveStagingAccessSweepCap` 形态），plan 携带显式值时被覆盖。不得绕过 plan 优先级。
3. **tier 解析**：用 canonical `ProjectMap.modules.length` 为主信号、`ownedFileCount` 总和为次信号定档；U6 用 active source_ref 数定档。**严禁另造规模来源**（D1 已确认 projectContext 为唯一权威）。
4. **不传 moduleBindings 的回归路径不变**：U1 旁路保护 deepMining——未提供 moduleBindings 时逐字段退回 per-dimension `TARGET_RECIPES_PER_DIMENSION=5`（本表只在 per-cell 路径生效）。
5. **D3 隔离**：本表任何项的消费链**不读写 `git_diff_checkpoints`**（覆盖账本/decay/内容指纹与维护游标严格分坐标系）。

---

## §6 Must-Confirm / 失效证据（Design 不擅自定的项）

**Must-confirm（须控制器裁定或落地核码）：**

1. **perCellTarget × recipe-evidence-gate floor=3**【最高】：L 档 per-cell 首扫=2 **< floor=3**。若 floor 是 per-cell 硬「covered」门 → L 档须抬到 **3**（且 deepMining 跨轮填至 3）；若 floor 是 per-recipe-evidence（每条 recipe 需 ≥3 证据）与 per-cell 计数**正交** → 维持 2。**门禁语义级，Design 不擅自定**，落地时对 `recipe-evidence-gate` 实读确认。
2. **三条规模轴不同**：tier 主轴=模块数（D1 module 轴）、U6=active source_ref 数（维护域）、U2 cell 预算=模块×维度（网格）。确认实现各取对的轴，勿互相污染（呼应 UM C6「scope 粒度勿被 per-cell 污染」）。
3. **U3 规模派生 defer**：本阶段 18KB flat 复用 cold-start 常量；若后续要 size-derived（如 S 12KB / L 24–32KB）另起独立项、不阻塞本伞形 U3。

**失效证据（出现则档值需重算）：**

- 目标项目实测**维度数 ≠ 14** 或**模块数落在假设 tier 边界外** → cell 网格规模变，perRoundCellBudget/maxRounds 需按真实网格重核。
- floor=3 确为 per-cell 硬门 → §3 L 档 perCellTarget=2 作废，抬至 3。
- U6 内容指纹哈希单条成本被实测证明远高于预期（致单批 50/150/400 撑破 2s/U3 预算）→ 批量档值下调或改纯异步。

---

## §7 ADR 候选判断

**不建议**单独立 ADR：本表是可逆的默认值规格（env 可覆盖、plan 优先级随时改写），未来维护者改档值无需历史背景即可安全调整，无「难逆且意外」特征。保留为伞形需求设计 §0-D2 的落地附件即可。**唯一够 ADR 资格的隐含决策**——「per-cell 网格细化后 perCellTarget 应低于 legacy per-dimension 5」——已记录在本表 U1 依据列，建议落地时以代码注释固化「per-cell ≠ per-dimension，S 取 5 是单模块零回归锚点」。

---

## 证据与链接

- 伞形需求设计：`Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md`（§0-D2 / 第二轮对抗核验 authoritative / CG-2·CG-7 / 决策表⑤b）
- 伞形原始计划：`Design/docs/current/alembic-recipe-lifecycle-global-original-plan-2026-06-26.md`
- U1 现存常量：`AlembicCore/src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts:6`（`TARGET_RECIPES_PER_DIMENSION=5`，消费方 Planner/PlanBuilder + `RescanEvidenceProjectors.ts` `targetPerDimension`）
- U4 现存 cap：`AlembicPlugin/lib/runtime/mcp/host/staging-access-sweep.ts:8`（`DEFAULT_STAGING_ACCESS_SWEEP_CAP=50`）+ `:254-264`（`resolveStagingAccessSweepCap` env+guard）
- U5 现存阈值：`AlembicCore/src/service/evolution/ConsolidationAdvisor.ts:109/112`（ENHANCE=0.4 / HIGH_OVERLAP=0.65）+ `AlembicCore/src/domain/evolution/EvolutionPolicy.ts:39`（UPDATE_FP=0.4）
- U3 现存预算：`AlembicPlugin/lib/recipe-generation/host-agent-workflows/cold-start.ts:88`（`COLD_START_BRIEFING_INLINE_BUDGET_BYTES=18*1024`）；rescan 暂无自有常量（须复用 + 顶层 `response.meta.fullBriefingRef` lift）
- U2/U6 greenfield 核验：`content_fp` 在 AlembicCore/src 零命中；`CoverageLedgerAdvisor.ts`/`maxRounds`/单轮预算常量均不存在（确认 greenfield）
- 规模信号：`AlembicCore/src/domain/project-context/ProjectContextMap.ts:155-164`（`ModuleSummary`）+ `:252`（`ProjectMap.modules`）
