# 主体生命周期适配 — 真实验证 + 覆盖回写致命修复 follow-up — 需求设计(strict)

Date: 2026-06-26（流程状态修正 + 代码层落地：2026-06-27）
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26
Scope: Alembic 主体（lib/）+ AlembicCore（host-agent-workflows 下沉，CG-3 选 B 时）+（真机验收）codex host-agent
Grounding: 6-agent 设计-vs-代码对抗审计（综合独立全核）+ Design spot-check（commit/file:line/grep 直读）+ Explore 数据流追踪（覆盖回写集成点）

## 0. 流程状态修正（先纠状态，再谈修复）

审计前我的报告把本需求定位为"板上 pending-claim、控制器可能重做 A-F"。**核对真实流程后订正**：

- **控制器已对 mainbody 做过流程修正**：`.wakeflow-active/index.md` + `workspace-current-status.md`（Updated 2026-06-27）记 `alembic-mainbody-lifecycle-adaptation-2026-06-26` **已完成、接受并归档**；旧 mainbody/realverify delivery transport 残留已隔离到 `.wakeflow-local/preserved-wakeflow-delivery/2026-06-27-mainbody-realverify-cleanup/`；`wakeflow_status` healthy/idle，delivery/group/replay 全 0。git status 证实三个 archive 目录都在：**mainbody-adaptation / 伞形 / 伞形 realverify-residual-followup 全已归档**（codex 把伞形 realverify 也做完归档了），state = **idle / no active demand**。
- **所以"pending-claim 不一致"已被归档消解，不存在控制器重做 A-F 的风险。**
- **但出现一个更实质的流程问题——post-archive 假完成（false-complete）**：归档的 mainbody `developer-progress.md` **只有标题行**，零真机证据、零 coverage 字段、零 finding#1（Design grep 直读证实）。即 A-F 是按"**代码在场**"接受归档的，没有 raw 真机验收、也没人发现 deepMining 覆盖回写缺失。
- **本需求的真实定位 = mainbody 的 post-archive 真实验证 + 致命修复 follow-up**，与伞形的 realverify-followup 完全同型（都是"已归档为 completed、但未真机验证"的后续）。**不重做 A-F，只修一个致命缺陷 + 第一次真机验收。**

> 流程动作（须控制器/用户）：本需求不改控制器 index/status（Design 边界）。控制器 intake 本 follow-up 时，应在归档的 mainbody 记录上挂"finding#1 致命残留 + CD-6 未真机验收"的修正注记，不得把"已归档 completed"当成"已真实达成"。

## 1. 审计结论（A-F 已实现，spot-check 证实，非橡皮图章）

| 阶段 | 状态（Design 亲验） | 证据 |
|---|---|---|
| A plan 组件 | ✅ 已落 | `AlembicAgent/.../plan.profile.ts`(id:'plan-selection'/chat preset/actionSpace none/single/maxIter1)+`runs/plan/PlanAgentRun.ts:runPlanAgent`（Agent c38d2c4/4ab2bee）。PD-1/2/3 符合 |
| B Core 投影 | ✅ 已落 | `planIntent.ts:75 applyPlanSelection`+`:40 assertPlanSelectionShape`（R1 改名避 Plugin gate validatePlanSelection:191）+ budget 三级回退 + plans.ts export（Core 1553e2f）。PD-1/8 符合 |
| C coldStart | ✅ 已落 | `DaemonJobRunner.ts:922 runPlanSelectionGate`=PD-5 硬 gate（plan 失败 status:'failed'+abort 不回退，08c920d/ff6f01e） |
| D deepMining | ⚠️ 已落**但含致命缺陷** | `:1020 runDeepMiningRounds` 单 job while + 每轮 planGate + `rescanId`唯一（RF-3 已修）+ `:1101 upsertRound`。**缺 per-cell 回写见 §3** |
| E moduleMining | ✅ 已落 | producer 在 Agent `AgentRunCoordinator.ts:374 partitionProjectContextModules`（空→throw）+`runModuleMining`；主体 `:1160 runModuleMiningWorkflow` 防空壳 `:1193 throw 'zero recipes'`/`:1172 throw 'requires ≥1 module'` |
| F evolution | ✅ 已落 | `service/evolution/EvolutionMaintenanceSweep.ts`+daemon 接线+`KnowledgeModule.ts:241` decayDetector 注入 lifecycleStateMachine（F4 致命修复已落，73bd780） |

主体 `main==origin/main`（已 push，commit 2090793..eebe4ad）。

## 2. 唯一致命缺陷（finding#1，HIGH）— 根因（逐环核实）

**mainbody deepMining 缺 per-(module×dimension) 覆盖账本 grade 回写。**
- `runDeepMiningRounds`（DaemonJobRunner.ts:1020-1158）对账本的全部写操作 = `ensureCoverageLedgerCells`（:1053→:1840，**只在 cell 缺失时播种 `grade:'empty'/coveredCount:0`，已存在即 continue**）+ `upsertRound`（:1101，写 round 的 newRecipesThisRound）。**recipe 生成后从不回写 cell 的 coveredCount/grade。**
- rescan 结果（`presentProjectContextRescanResponse`，ProjectContextWorkflowFacts.ts:425-499）**只暴露聚合计数**，无 per-(module×dimension) 覆盖 breakdown（Explore 确认）；`extractNewRecipesThisRound`（:1947）只取一个数。
- **后果链**：cell 跨轮恒 `grade:'empty'`/`coveredCount:0` → `adviseCoverageLedger`（CoverageLedgerAdvisor.ts）的 `valueSortedGaps`（只收 grade∈{empty,thin}、排除 exhausted-with-reason）恒非空 → **`converged` 停止分支（`if (valueSortedGaps.length === 0) return build('converged', true)`）永久死代码**、highValueBlankCount 恒不减。循环不死（diminishing-returns: newRecipes<K / round-cap: lastRound≥maxRounds 仍可停），但退化为**「按 K/maxRounds 跑固定轮、覆盖永不前进」= 设计 R3 净增空壳的活体实现**。
- **派生**：主体 rescan 的 `perCellCoverage` 喂入来自 `cell.coveredCount`（KnowledgeRescanWorkflow.ts:780），恒 0 → 伞形 U2b「账本 existingCount 驱动 gap 收敛」在 mainbody 退化为「每轮全量 gap」。**根因同上，修 cell 回写即解。**
- **影响**：设计 D 验收②③（coverage blank/thin 减、grade empty/thin→partial/covered）真机结构性不可达；CD-3 deepMining「深=覆盖增量」落空。

## 3. 致命修复 finding#1 — 落地到代码层

### 3.1 修复目标
deepMining 每轮（或每维度完成）生成 recipe 后，把真实覆盖回写进 `coverage_ledger`：`coveredCount`/`grade`(empty→partial/covered)/`coveredSourceRefs`/`valueScore` 按 module×dimension 落库，使 `valueSortedGaps` 能随覆盖收窄、`converged` 分支可达。**门禁不放松**：只回写真实经 anti-fabrication 落库的 recipe，绝不为触发 converged 虚增覆盖；账本是 advisory，写失败吞掉返回零计数、绝不阻断轮次（镜像 Plugin 适配的 try/catch）。

### 3.2 复用现成的两个纯适配函数（已存在，只是在 Plugin）
Plugin `AlembicPlugin/lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts` 已含**正是要用的逻辑**：
- `writeCoverageLedgerForCompletion(input)`：`buildCoverageLedger`（@alembic/core）聚合 candidates+coveredPaths → cells → 逐 cell `repository.upsertCell`（带 coveredCount/grade/coveredSourceRefs/valueScore，deferred:false）。
- `reflowDeepMiningRoundOnCompletion(input)`：把本次 newRecipeCount 累计进最新轮的 new_recipes_this_round。
两函数**自述「不读 fs、不硬编码宿主路径」=已是 host-neutral 纯适配**（入参只有 repository+projectRoot+已解析的 modules/dimensionIds/candidates/coveredPaths）。

### 3.3 CG-3 决策：回写适配放哪
- **推荐 Option B（下沉 Core，主体+Plugin 共消费）**：把 `writeCoverageLedgerForCompletion`+`reflowDeepMiningRoundOnCompletion` 从 Plugin 移到 Core `@alembic/core/host-agent-workflows`（紧邻 `buildCoverageLedger`），Plugin 从 Core re-import（零行为变化，仿现有 back-compat re-export），主体 import Core。理由：① 不让主体复制逻辑；② 适配本就 host-neutral、放 Plugin 是错层，下沉符合架构重构 [[alembic-recipe-lifecycle-naming-layering-refactor]] 的 D-1/D-2 下沉原则；③ 移动是机械的。**耦合提示**：这等于顺手做了分层重构的一块下沉——若分层重构先行/并行，协调由谁落这块；若本需求先落，分层重构届时不必重做。
- **Fallback Option A（主体 in-process 镜像）**：主体本地复制约 40 行回写 helper，自包含、无跨仓耦合，但 DRY 欠债。仅当"分层重构要独占所有下沉、现在不许碰 Plugin"时选 A。
- **待 intake 拍 B vs A**（见 CG-3）。

### 3.4 集成点（主体）— Explore 接地
覆盖数据（module×dimension×coveredPaths）**只在 recipe 生成时可得，rescan 返回后即丢失** → 回写**必须 hook 进生成流程内部**，镜像 Plugin 的 per-dimension-completion（dimension-completion.ts:646-716）：
- **推荐 hook A**：`Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts` 内、每维度 AI 产出投影处（`AgentRunProjections.projectBootstrapDimensionAgentOutput`，:297-433，有 `dimId`:307 + `referencedFiles`:359）——每维度完成即写覆盖，最贴合 Plugin。
- **备选 hook B**：本轮 recipe 落库后，用 Core `RecipeSourceRefRepository.findByRecipeId()`（sourceref repo）按本轮新 recipe IDs 反查 coveredPaths 再逐 cell 写——需把本轮新 recipe IDs 从 rescan 透出（现仅返回计数）。
- **入参组装（镜像 dimension-completion.ts:646-707）**：`modules: CoverageLedgerModuleAxis[]` 从 canonical ProjectMap modules（真实 ownedFiles 优先、模块根路径兜底——注意 §4 U1-d 单锚点）；`dimensionIds`=本轮 executionDimensions；`coveredPaths`=referencedFiles 去行号锚点（`.replace(/:\d+(?:-\d+)?$/, '')`）；`candidates` 从 coveredPaths 构；`perCellTarget` 从 tier/D2；`lastRound`=roundIndex。

### 3.5 避免双写（重要）
主体已在 `runDeepMiningRounds:1101` 内联 `upsertRound({ newRecipesThisRound })`。**所以缺的是 per-CELL 回写（writeCoverageLedgerForCompletion），不是 round reflow。** 二选一的轮次记账路径，别两条都走：
- 若在 workflow 内 per-dimension hook：**只调 cell 回写，不要再调 `reflowDeepMiningRoundOnCompletion`**（会与内联 upsertRound 双计 newRecipesThisRound）；或
- 若改走 reflow 模式：删掉 :1101 的内联 newRecipesThisRound、统一由 reflow 累计。
**cell 回写是真正的修复**；轮次记账保持单一来源即可。

### 3.6 改动清单（按 CG-3 选 B）
1. **Core**：`coverage-ledger-write.ts`（两函数）从 Plugin 移入 `AlembicCore/src/workflows/capabilities/host-agent/`，barrel 从 `@alembic/core/host-agent-workflows` 导出；类型沿用现有 CoverageLedger*。
2. **Plugin**：`recipe-generation/host-agent-workflows/coverage-ledger-write.ts` 改为 re-export Core（或 dimension-completion.ts 直接 import Core），Plugin 行为零变化、测试零回归。
3. **主体**：在 KnowledgeRescanWorkflow per-dimension 完成处 import Core 两函数（实际只需 `writeCoverageLedgerForCompletion`）+ 组装入参 + try/catch 包裹；保留 :1101 内联 round 记账、**不调 reflow**。
4. **不碰**：`ensureCoverageLedgerCells` 播种（仍负责开格），`adviseCoverageLedger`（消费方，自动随真实 grade 收窄）。

## 4. 残留（非 mainbody 阻断，记录在案）
- **B4 Plugin gate 双写收敛**：⚠️**[2026-06-27 已被赶超：gate 现已 import+调用 Core `applyPlanSelection`(plan-generation-gate.ts:1/:264)、三私有投影函数已删、`DEFAULT_*` 仅在 Core；:494/498/514 现为无关函数→PD-7 投影收敛实质已 DONE，可关闭]** 残留仅 gate 本地 host-wire 输入 DTO(`PlanSelectionInput`/`validatePlanSelection`)去留=纯 cosmetic，归架构重构 D-1/D-2。**mainbody 只消费 Core 投影，不依赖此收敛**，非本需求阻断。
- **U1-d moduleName ownedFiles 单锚点**：`ProjectContextWorkflowFacts.ts:731 ownedFiles=[modulePath]`（单路径）+`:735 filter(id&&name)`；有 fallback `buildProjectMapModulesFromTargets:738`。**真机前先验 BiliDili ProjectMap.modules 是否带 ref.scope.filePath**（决定 §3 回写的 modules 轴 ownedFiles 是否完整）。
- **U2-a suffix bug 不继承**：`CompletenessCritic.ts:639/650 pathsOverlap` suffix 分支在 Core 未修，但 mainbody 走 plan moduleBindings（非路径归属）+本就不调 buildCoverageLedger → 不继承运行后果；finding#1 是更上游阻断。

## 5. base / 时序（设计假设已颠覆）
- 设计 §5 波次 / §8 R6「伞形 U2/U4 先 land 否则 W3 blocked」**已不成立**：伞形 U2 全套（164c87f/f2b0483/8978381/85a95ca/74387b2）+U4（dde34d4）+realverify Core（fe42940/b3a8d81）**全已 land 在当前 Core HEAD `1553e2f` 内**。
- **base 锁 Core `1553e2f` / Alembic `eebe4ad` / Agent `c38d2c4`，finding#1 立即可修、无前置依赖。** 设计 §5 W1-W4 作废：A/C/F 已完成、D/E 缺回写、真机验收是唯一剩余。

## 6. 阶段与验收标准

### Phase FIX（覆盖回写修复，主体 + Core[B 时]）
- **交付**：CG-3 选定（B 下沉 / A 镜像）→ 按 §3.6 改动 → 回写 hook 接通。
- **验收①（构建）**：Node≥22 `build:check` 三仓绿（B 时 Core+Plugin+主体；A 时主体）。
- **验收②（单测，离线，结构证据）**：定向 unit——seed 一个 module×dimension 的 cell 为 empty → 喂一组覆盖该 module×dimension 的真实 recipe（带 sourceRefs）→ 断言回写后 `getCell` 的 `grade` 由 empty 升 partial/covered、`coveredCount>0`、`coveredSourceRefs` 非空；再断言 `adviseCoverageLedger` 在全格 covered 时返回 `stopReason:'converged'`（证死代码复活）。
- **验收③（零回归，B 时）**：Plugin re-import 后 Plugin 既有 coverage/dimension-completion 测试零回归（行为零变化）。
- **验收④（门禁守住）**：喂一条不达 anti-fabrication 的 recipe → 不落库 → 不进覆盖回写（coverage 不虚增）。
- **本阶段不需真机**；②是结构性证据，③④是不放门禁的证据。

### Phase VERIFY（真 BiliDili 端到端，codex host-agent）
- **交付**：§7 七步在沙箱真 BiliDili DB 上跑通。
- **验收 GATE（步3=finding#1 铁证）**：**修前**直读 `coverage_ledger`→所有 cell `grade` 恒 'empty'、`covered_count` 恒 0、`stopReason` 永远 diminishing/round-cap **绝不 converged**（证伪 finding#1=必修依据）；**修后**→`grade` 出 partial/covered、`covered_count>0`、`stopReason` 可达 `converged`（=必修验收）。
- **验收（其余链路）**：coldStart 维度数=plan.dimensions 且 plan 失败 abort 不回退（C/PD-5）；`deep_mining_rounds` 多行、rescan_id 非空每轮唯一、new_recipes 递减（D/RF-3）；moduleMining knowledge_entries 增量>0（E，否则 :1193 throw）；evolution sweep 出 executed/promoted + dead recipe active→decaying（F4 注入生效）；空 DB sweep 全 0 无伪状态。
- **验收（防空壳/防造假）**：区分真覆盖增量 vs 同格重复被去重（R3）；anti-fabrication 真拦（故意喂不达标 recipe 须被拒，非放行）。
- **真机证据，不接受忠实副本"再验机制"替代**（本职是真生成）。

### 推进顺序
Phase FIX（无前置，base 当前 HEAD）→ Phase VERIFY（消费 FIX 产物，步3 直接验证 FIX）。U1-d 真机前置核在 VERIFY 步0/5。

## 7. 真 BiliDili 真测执行指导（逐步命令 + 每步真 DB 验收 SQL）

> 沙箱法（对齐 [[alembic-bilidili-commit-maintenance-e2e-recipe]]）：clone source@`02a25032` + `better-sqlite3 .backup()` 真 workspace DB + 只改 `git_diff_checkpoints.project_root`（唯一绝对路径列）→ `ALEMBIC_HOME` 沙箱，真 `~/.asd` 全程不动。Node≥22。base 锁 Core `1553e2f`/Alembic `eebe4ad`/Agent `c38d2c4`。基线 DB：3 knowledge / 0 proposal / 0 round / **coverage_ledger 表已存在**（伞形 014/015 已 land，非"表不存在"）。生成需 host-agent 驱动 + 本地 Ollama（否则 semantic_memories skip；无 AI creds 时 plan run 失败→PD-5 硬 gate 正确 abort）。

| 步 | 命令 | 验收 SQL + 期望 | 盯的偏差 |
|---|---|---|---|
| 0 准备 | clone + `.backup()` DB + rewrite project_root + `ALEMBIC_HOME=$SBX` | `SELECT count(*) FROM knowledge_entries`=3；`SELECT name FROM sqlite_master WHERE name IN('coverage_ledger','deep_mining_rounds')`=2 行 | 表存在性（伞形已建） |
| 1 coldStart 硬 gate | daemon job `kind=bootstrap`/`coldStart` | knowledge_entries>3；job `complete`；plan 失败时 `jobs.status='failed'` 且无 fallback | C/PD-5 |
| 2 deepMining 多轮 | daemon job `deepMining` | `SELECT round_index,new_recipes_this_round,rescan_id FROM deep_mining_rounds ORDER BY round_index`→多行、rescan_id 非空每轮唯一、new_recipes 递减 | D/RF-3 |
| **3 deepMining 证伪/验证（finding#1 GATE）** | 步2 后直读 | **修前**：`SELECT grade,covered_count FROM coverage_ledger`→恒 'empty'/0、stopReason 绝不 converged。**修后**：grade 出 partial/covered、covered_count>0、可达 converged | **finding#1 铁证 + 必修验收** |
| 4 旁证回写 | 对比 Plugin host-agent 路径同项目 | Plugin 路径 cell 有 grade 晋级；mainbody 修前恒 empty、修后晋级 | finding#1 边界证据 |
| 5 moduleMining | daemon job `moduleMining` | knowledge_entries 增量>0（否则 :1193 throw）；先 `SELECT id,name,ref FROM`（ProjectContext 持久层）验 ProjectMap.modules 带 ref.scope.filePath+name | E + U1-d |
| 6 evolution sweep | 预置到期 staging/proposal/dead recipe→启 daemon 等 sweep tick | `evolution_proposals` 有 executed/promoted；dead recipe `active→decaying`；空 DB sweep 全 0 | F4 |
| 7 真增量 vs 去重 | 步2/5 前后 | `recipe_source_refs` 增量；区分真覆盖增量 vs 同格重复被去重 | R3 防空壳 |

## 8. 完成定义 / 范围 / 待决 / 风险

**CD 对照**：CD-1~5 ✅（已实现核实）；CD-3 deepMining ⚠️ 部分→**Phase FIX 修后转 ✅**（步3 修后验收）；CD-6 真机 ❌→**Phase VERIFY 达成**。

**范围**：拥有 finding#1 覆盖回写修复（FIX）+ 真 BiliDili 端到端真机验收（VERIFY）+ U1-d 真机前置核。**不拥有**：不重做已实现 A-F；B4 Plugin gate 收敛=独立 PD-7；U2-a=Core 域 mainbody 不继承。

**CG 已决（2026-06-27 用户拍板）**：
- **CG-1 = 真机沙箱边界（已决）**：用 §7 沙箱法——clone BiliDili source@02a25032 + `better-sqlite3 .backup()` 真 workspace DB → `ALEMBIC_HOME` 沙箱，真 `~/.asd` 与真 BiliDili 全程不动。
- **CG-2 = Ollama 接通（已决）**：真机接通本地 Ollama，semantic_memories 真落库验证（不 skip）。
- **CG-3 = B 下沉 Core（已决）**：`writeCoverageLedgerForCompletion`+`reflowDeepMiningRoundOnCompletion` 从 Plugin 移入 Core `@alembic/core/host-agent-workflows`，Plugin re-import（零回归），主体 import 共消费（§3.6 改动清单按 B 执行）。这块同时落地分层重构 [[alembic-recipe-lifecycle-naming-layering-refactor]] 的一处下沉——若两需求并行，由本需求落、分层重构届时不重做。

**风险**：
- 回写虚增覆盖放门禁（红线，只回写真实 anti-fab recipe）。
- 双写 newRecipesThisRound（§3.5：cell 回写与内联 upsertRound/reflow 三者别重复记账）。
- 选 B 时 Plugin re-import 引入回归（须零回归证据）。
- U1-d：BiliDili 模块缺 ref.scope.filePath → 回写 modules 轴 ownedFiles 不全、per-cell 覆盖低估（真机先核）。
- 控制器把"已归档 completed"当"已真实达成"，不挂 finding#1 残留注记。
- push/发版/版本号用户门。

## 证据与链接
- 审计：6-agent 设计-vs-代码对抗 + Design spot-check（plan.profile/applyPlanSelection:75/runDeepMiningRounds:1020/EvolutionMaintenanceSweep/KnowledgeModule:241 亲验；归档 developer-progress 零真机证据）+ Explore 数据流（覆盖数据只在生成时可得、rescan 返回仅聚合、hook 须进 workflow 内部）。
- 参照回写链：Plugin `coverage-ledger-write.ts`（writeCoverageLedgerForCompletion/reflowDeepMiningRoundOnCompletion）+ caller `dimension-completion.ts:646-716`；Core `buildCoverageLedger`/`CoverageLedgerAdvisor.ts`（converged 分支）/`RecipeSourceRefRepository`。
- 真机 recipe：[[alembic-bilidili-commit-maintenance-e2e-recipe]]。base Core `1553e2f`/Alembic `eebe4ad`/Agent `c38d2c4`。
