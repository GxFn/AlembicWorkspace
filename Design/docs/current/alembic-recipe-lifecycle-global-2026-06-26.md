# Alembic Recipe 全生命周期(生成+维护)走通与优化 — 伞形需求设计(strict)

Date: 2026-06-26
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-recipe-lifecycle-global-2026-06-26
Scope: AlembicCore + AlembicPlugin + Test；**伞形/全局统筹**需求,协调 3 个在途需求并补其未覆盖部分
Grounding: 17-agent 全链路测绘 + 对抗核验(49 问题)+ 7-agent 全阶段代码级 grounding + **6-agent 第二轮对抗核验(逐阶段 file:line 复核@AlembicCore 62f0b4b/AlembicPlugin 799ceac,抓 3 个 U4 blocker + 行号漂移 + 4 新 Confirmation Gate,见《第二轮对抗核验》节 authoritative)** + BiliDili 真机 DB 直读

## 触发与定位

把 Recipe 的**生成(coldStart / deepMining 深扫 / moduleMining 模块扫)+ 维护(evolution 进化)整条链路**在真实 BiliDili(workspace `02a25032`)走通、查问题、修复升级,并**全局统筹**已有的 3 个在途需求,职责明确。本需求**只拥有在途未覆盖的部分 + 全局编排 + 真机端到端验收**,不重做在途已覆盖工作。

真机基线(本会话直读 DB):仅 3 条 active architecture recipe、3 条 transition events、**0 proposal / 0 semantic_memory / 0 source_graph**、git checkpoint `a3ea6a25`==HEAD status=initialized。即:**整条生命周期从未在 BiliDili 跑过全维 + 全 stage + evolution**;维护链(commit→checkpoint→proposal)从未真正 advance 过一次。

## 在途前置就绪状态(2026-06-26 核实 → 伞形可开工)

> 3-agent 核实(followup P1/P2/P3 + 其它前置 + 断点仍在),静态代码核实。

**followup `alembic-lifecycle-automation-followup` 已完成**(P1/P2/P3 全 landed,门禁未放松):P1 tick 有界化(`KnowledgeRepositoryImpl.ts:415-437` + `ProposalRepository.ts:255-265` 加 limit、`StagingManager` 三方法接 cap、`staging-access-sweep.ts:138 resolveStagingAccessSweepCap` 默认 50/env/守卫≥1);P2 驱动 `checkTimeouts`(sweep:144 调 `lifecycleStateMachine.checkTimeouts(cap)`,三超时迁移 evolving→active 7d / pending→deprecated 30d / decaying→deprecated 30d 在,staging guard 跳过);P3 驱动 proposal 执行(`KnowledgeModule.ts:402-410 subscribeToSignals` 经 `ServiceContainer.ts:257` **真实接线非孤儿** + sweep:151 有界 `checkAndExecute(cap)`)。P4 vendor 刷新=发布期事项不阻断。(静态核实;升正式验收需补 node22 Core evolution vitest + Plugin sweep 单测绿。)⚠️ 唯一瑕疵:`staging-access-sweep.ts:137` + docstring `~:251-252` 注释仍写"P3 本次不接线",与 :147-152 三 driver 代码自相矛盾(799ceac 漏改)→ U4 落地时顺手修。

**其它前置均 landed 不阻塞**:coldstart transient(`transient-transport.ts:17`+`cold-start.ts:434` ✅,U3 复用)、productization critic(`CompletenessCritic`+`completeness-critic.ts` e32fec4 ✅,U2 复用)、embedding(VectorService/Ollama ✅,U6 P5 底座)。

**结论:伞形可开工,无需大改**。U4/U5/U6 的 followup 前置全部解除:
- **U4 重定位** = 在已落的 **3-driver sweep(promote/checkTimeouts/checkAndExecute)上加第 4 driver(decay)**,复用 `resolveStagingAccessSweepCap`(不再是"复用待落 F1")。
- **U5** = 复用已接线 `subscribeToSignals`(`KnowledgeModule.ts:406`)+ sweep `checkAndExecute` 执行链(前置已解除)。
- **U6 P3** = 挂现成 `checkAndExecute` 执行入口(前置已满足)。

**要修的断点逐一核实仍在、未被 followup 误修(伞形工作量真实)**:DecayDetector authority `/100` 量纲 bug(`:325-326`,真相 0-5 域)、freshness cold-start gap(`:311` lastHitAt=null→0 无 grace)、merge 丢 suggestedChanges(`RecipeProductionGateway.ts:974-980`)、ProposalExecutor 伪成功(`:434-435`,followup d49fc05 只修 re-entrancy 未碰此)、content_fp 缺列(`AlembicCore/src` grep 零命中)。**基线 Core HEAD 现 `d49fc05`**(较 §第二轮节引用的 62f0b4b 多一 re-entrancy 修复,不动断点);Plugin 799ceac 一致。正文「信号汇双断/零订阅」一律以《第二轮对抗核验》**B1 修正版**为准(`subscribeToSignals` 已有活调用方;tick 直走 transition 结论仍成立,理由=decay 未预建 observing proposal、`#onSignal` findByTarget 查 observing 落空)。

## 整条生命周期地图(通 / 半通 / 断)

```
生成域:
  plan(draft→confirm)─通─ 无状态决策 dimensions/scale/moduleBindings
   ├ coldStart(bootstrap)─半通─ 7域退场/预算化/计数/拒因 已落(coldstart-repair);残:14维只跑1维即停
   ├ deepMining(rescan)─半通(名义)─ 入口/gate 通,但"深"无实质:复用同一分析+固定预算,stage 只改文案
   └ moduleMining(rescan)─断(心脏)─ selectPlanModuleScope 丢 per-binding 维度/预算→退化 per-dimension 全局;
        live moduleScope 失效;产出 recipe moduleName 全空
产物化域:
  staging→active 晋级 ─通✅─(tick sweep 已落,真机3条active)| dimension_complete→Skill ─通✅─(SKILL.md已落)
  embedding ─半通─(本run 8 region upsert 但 semantic_memories=0)| 覆盖 ─半通─(恒卡 floor=3)
维护进化域(重灾区):
  DecayDetector(衰减触发) ─断─ 整体孤儿零调用 + authority 量纲误判(仍在) | SignalBus ─已接线(followup)─ subscribeToSignals 已活(原诊断"零订阅"已解除;但 decay 信号未预建 observing proposal→#onSignal 落空,故 U4 tick 直走 transition)
  ProposalExecutor(执行) ─断─ proposal 永卡 observing | 合并 OUTCOME ─断─ merge 候选内容丢弃/空迁移/使用量门禁误拒/伪成功
  ContentPatcher(patch) ─断─ 无补丁早退 + 全量替换 fallback 破坏 markdown
  commit-driven 维护触发 ─断─ checkpoint 从 initialized 从未 advance(全伞形最危险暗坑)
  rescan 保鲜 ─半/断─ 只检 fs.existsSync 不感知内容漂移;region 向量真机=0;audit verdict 纯 advisory 不落动作
```

## 最终目标(完成定义)

BiliDili 真机一轮端到端跑通:**全 14 维 coldStart → deepMining 多轮覆盖增量 → moduleMining 分模块 → evolution 触发/执行**,各 stage 产**可核 DB 证据**(knowledge_entries 按模块/stage 归属、lifecycle_transition_events、evolution_proposals 流转、semantic_memories>0、git checkpoint advance),且:
1. moduleMining 真按模块产出(recipe moduleName 非空且取自 projectContext 模块能力、per-binding 预算生效);
2. deepMining 改为**多轮覆盖增量**(覆盖账本驱动补缺口、价值排序、收敛/递减/轮次上限即停),大项目可跨轮补齐而 coldStart 保持有上限快扫;git-diff 增量生成退役、维护归 evolution;
3. evolution 衰减触发器恢复(authority 量纲同修)、合并/执行 OUTCOME 真改善 Recipe(候选并入非空迁移、无伪成功);
4. commit-driven 唯一维护触发链 advance(checkpoint 从 initialized→routed);
5. rescan 内容级保鲜(文件还在内容已变能标 drifted);
6. 全程门禁不放松。

开发者决策级:每项带 file:line、跨仓归属、分阶段验收、与在途依赖。

## §0 跨块统一前提(4 决策固化 + 跨仓纪律)

> 用户 2026-06-26 已拍板 4 决策;以下为代码级落地口径,U1/U3/U4/U5/U6/UM 一律遵守、不再各自重述。✅=已二次核实;⚠️=对一轮勘探的纠正。

**D1 module 来源 = projectContext 基础能力(已在 Core,散落只在消费侧)**
- 权威来源已在 Core:`AlembicCore/src/service/project-context/repo/repo.ts:63-64`(discoverer registry 按 `package.json`→`package-manifest`、`Package.swift`→`swift-package` 自动发现确定的项目模块配置文件)+ `architectureIntelligence`(智能层级/角色判断)+ canonical `AlembicCore/src/domain/project-context/ProjectContextMap.ts:155-164,250-260`(`ModuleSummary{id,name,kind,configLayer,role,roleConfidence,ownedFileCount,ref}` + `ProjectMap.modules`)。**模块结构已经是 projectContext 的基础能力,不是散落。**
- 散落只在**消费侧**:`AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-context-analysis.ts:258-327`(plugin 私有 `ProjectContextModuleSeed` + `selectProjectContextModuleSeeds` 手工归一 + `inferModulePathFromProjectContextRef`/`moduleNameFromPath` 私有路径推断)。
- 落地口径:recipe `moduleName` 与覆盖账本"模块"轴**都从 canonical `ProjectMap.modules` 取**(name/id)。
- **方案 A(本伞形采用,轻)**:plugin 把私有 seed 降级为查询输入、统一引用 canonical name/id,**不退役** seed。**方案 B(下沉,拆独立需求)**:Core 暴露无需 plugin 喂 seed 的模块轴枚举 API,plugin 退役私有 seed 派生(走跨仓删除核验)。**方案 A/B 改变仓库职责边界 = Confirmation Gate,须用户/Design 拍板**,evidence 不得自升 scope。Design 建议 B,但本伞形 U1 先按 A 接 canonical 轴。

**D2 round 边界/阈值 = Design 通用默认表 + plan 规模语义**
- Design 先给**一张通用默认表**(按真实项目规模自适应),实现侧**只消费、不拍脑袋**;同时在 plan 里作规模语义交 Agent 产出(像 `totalRecipeBudget`)。覆盖:U1 `perCellTarget`、U3 rescan 预算阈值、U4 decay round/cap、U5 merge 门禁阈值/相似度区间、U6 内容指纹批量护栏、UM created 退役阈值。优先级统一:**plan 规模语义(如 `binding.targetRecipes`)> 通用默认**。

**D3 维护触发 = commit-driven 唯一触发源,保留 `git_diff_checkpoints` 作纯维护游标**
- ✅ 已二次核实:`git_diff_checkpoints` 读写方**只有 evolution 维护链**(`GitDiffCheckpointService`/`Repository`/`DurableGitDiffCheckpointRouting`/`opportunistic-evolution-presenter`/`knowledge-rescan` 的 unifiedEvolution);覆盖账本/deepMining(`KnowledgeRescanPlanBuilder` 路径)**零引用**(已核实 NONE)。
- ⚠️ 纠正:`search.ts`/`retrieval-checkpoint-diagnostics.ts` 命中的 "checkpoint" 是**独立检索 checkpoint**,不是 `git_diff_checkpoints` 维护游标——勿混淆两套坐标系。
- 落地口径:**所有阶段(U2 覆盖账本、U4 decay tick、U6 内容指纹)禁止读写 `git_diff_checkpoints`**;它专属 commit-driven 维护触发(UM)。语义=git-diff 只服务 evolution 维护(建/更新/弃用既有 Recipe),不生成新 Recipe、不碰覆盖账本。
- ✅ 核实(UM ⑤a 事实核验):**唯一活的 evolution 生产在 Plugin 进程内**(`EvolutionGateway` new@`KnowledgeModule.ts:347`),resident/daemon 在 PDR-3 后**无活的 file-monitor→evolution 实现**(`ResidentServiceContracts.ts:38-46` 的 `file-monitor.git-worktree` 是无实现契约壳;`src/daemon/` 仅 8 个类型文件无 server/watcher),故"commit-driven 唯一触发源"成立、**无并行生产方**。

**D4 per-binding gap 粒度 = per-cell(模块×维度)**
- per-binding gap 与覆盖账本一致按 per-cell。`buildCoverageByDimension` 升级到 per-cell 属 **U2a 账本工作**;U1/U6 只把模块轴喂进 gap 签名、消费 `binding.targetRecipes`,**不在本阶段升级覆盖统计**。

**跨仓与提交纪律(全阶段)**
- 一律改 `../AlembicCore` live 源,Plugin 经 `file:../AlembicCore` 消费,**不碰 `vendor/AlembicCore` 快照**(仅封版按 RELEASE-PLAYBOOK 刷;⚠️ 实测 vendor SourceRefReconciler 478 行 vs live 632 行,滞后明显)。
- 落地顺序统一 **先 Core 改 + `build:check` + `test` + commit(local),再 Plugin 接入**。Node≥22(`nvm use 22`)避免 boundary/build:check 假红。Core 跨能力变更**分阶段提交**,不混入一次不可回滚的 commit。

## 问题集总账(49 confirmed,覆盖矩阵)

- **COVERED(8,完全归在途,伞形只在验收门串接)**:单维产物化广度/skill/语义(productization P2/P3/P4)、staging sweep 有界+checkTimeouts+proposal 执行驱动(lifecycle-automation F1/F2)、advisory critic(productization P3)。
- **PARTIAL(18,在途覆盖一半,缺口归伞形)**:rescan/deepMining/moduleMining 的输出预算化(coldstart P2 只覆盖 cold-start.ts)、完整性 critic 是否接到 rescan briefing、per-module 覆盖维度被 critic 排除、consolidation 未承诺切语义、衰减触发未补、patch 空输入语义未补、跨维"全维才算完成"无强定义。
- **UNCOVERED(23,伞形本职新增)**:见下分阶段。

## 分阶段设计(U0-U7 + UM,file:line + 跨仓 + 验收 + 依赖)

> ⚠️ **本节 file:line 引自 b557b10/2748968;经《第二轮对抗核验》节(authoritative)逐点复核,U4/U5/UM 多处行号已漂移、数处 claim 有修正、U4 验收 #2 已被真机证伪**。落地一律以《第二轮对抗核验》A(修正)/B(优化验收)/C(推进顺序)为准;本节保留作设计意图与背景。

### U0 — Intake 重基线 + 真机 e2e 验证基座【前置,全局统筹】
- **范围**:以当前 main + 真机 DB **重核 3 个在途需求每条 file:line**,标 stale——`R1a #promote`(已 commit 777c5b7 走 transition)、`R3/P4 embed`(本 run 已通)、`R1b skillCount`(SKILL.md 已落盘)等基于 43/131 旧快照的描述已被推翻;**`followup` P1/P2/P3 已全部 landed(见《在途前置就绪状态》节)、coldstart transient + productization critic/embed 均 landed**。建立 BiliDili 全维+全 stage+evolution e2e 验收基座。
- **跨仓**:Test + 控制器(只读重核,不改码)。
- **验收**:每条在途问题标 still-valid/stale;e2e 脚本能产可核 DB 证据。
- **依赖**:先于一切。覆盖 A8-P8。

### U1 — moduleMining 心脏接通(per-cell gap 透传)+ module 来源(D1 方案A)【最高杠杆 uncovered,可独立先行】

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts:498-512`(`selectPlanModuleScope`)+ `PlanGenerationGateReady`(49-64)✅ | **extend** | 保留 `selectPlanModuleScope` 返回 flat `moduleScope`(向后兼容 lease/briefing 取数),**新增不丢信息出口**:`PlanGenerationGateReady` 增 `moduleBindings`,直接复用 `gate.planSelection.moduleBindings`(✅ `NormalizedPlanSelection` 已 `Required` 含 `moduleBindings{modulePath+dimensions+targetRecipes}`,零新派生)。`buildPlanGenerationGateReady`(255-306)一并产出。**必须 additive**——下游 lease key(319-321)、`attachPlanGenerationGateData`(396-405)、creationGuide 仍依赖 flat `moduleScope:string[]`。 |
| 2 | `AlembicPlugin/.../host-agent-workflows/knowledge-rescan.ts:165-170` + `project-context-analysis.ts:29-37,90-128` | **extend** | 调用处把 `planGate.moduleBindings` 透传进 analysis;`binding.modulePath` 集合做 `moduleScope` 兼容路径,同时把 per-(module×dimension) 意图随 `moduleSeeds` 带到 briefing,使 moduleMining 取数与 Agent 提交引导按 cell 对齐。 |
| 3 | `AlembicCore/src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts:73-199` | **extend** | `BuildKnowledgeRescanPlanOptions` 新增**可选** `moduleBindings`;**仅当提供时**按 cell 算 `gap=max(0, perCellTarget - perCellCoverage)`,`createBudget` 落 cell 维度;未提供时**逐字段退回**现有 per-dimension(`TARGET_RECIPES_PER_DIMENSION=5`)保护 deepMining。`perCellTarget` 优先级:`binding.targetRecipes`(D2) > 通用默认。 |
| 4 | `KnowledgeRescanPlanBuilder.ts:235-264`(`buildCoverageByDimension`) | **defer→U2a** | 本阶段**不**升 per-cell 统计,只把模块轴接进 gap 计算签名。覆盖账本 per-cell 升级归 U2a(D4)。 |
| 5 | `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:597,710` + `AlembicCore/.../RecipeProductionGateway.ts:753` + `project-context-anchoring.ts` | **add** | submit 路径增 `moduleName` 派生/校验:优先从 candidate `sourceRefs` 落点的 canonical `ModuleSummary` 派生 moduleName(与覆盖轴同源);Agent 显式给时校验属已知模块轴。`moduleName` 是否从 optional 升 required-or-derivable = Confirmation Gate(影响 schema 与 Gateway 兜底空串)。 |
| 6 | `project-context-analysis.ts:258-327`(D1 散落点) | **decision** | 本伞形按**方案 A**:plugin 续派 seed 但统一引用 canonical name/id。方案 B(退役 `selectProjectContextModuleSeeds`/`inferModulePathFromProjectContextRef`/`moduleNameFromPath`、Core 暴露模块轴枚举 API)拆独立需求、走跨仓删除核验。 |
| 7 | `git-diff-checkpoint/*` | **reuse** | U1 心脏禁止读写 `git_diff_checkpoints`(D3)。 |

**跨仓 + producer/consumer 顺序**
- Core(producer):`KnowledgeRescanPlanBuilder` per-cell gap 签名 + `RecipeProductionGateway` moduleName 派生/校验;模块发现/architectureIntelligence/`ProjectMap.modules` 已在 Core 无需迁移。
- Plugin(consumer/transport):gate `moduleBindings` 出口 → knowledge-rescan/project-context-analysis 透传 → mcp-tools/anchoring moduleName 引导。
- 顺序:先 Core(planBuilder 可选 module 轴 + moduleName 派生)commit+`build:check`,再 Plugin 透传接入。

**验收标准(真机 DB 证据口径)**
1. **心脏透传**:多模块项目跑 `alembic_plan confirm` 产出 ≥2 个 `moduleBindings`(各带 dimensions+targetRecipes),经 gate 后 `PlanGenerationGateReady` 同时含 flat `moduleScope` 与完整 `moduleBindings`;断言每 binding 的 dimensions/targetRecipes 在 gate 后**仍非空、未被拍扁**。
2. **per-cell gap 生效**:构造 `moduleA×dimX target=3`/`moduleB×dimY target=2` + 已知覆盖快照调 `buildKnowledgeRescanPlan(moduleBindings)`,断言按 cell 给 gap/createBudget,能区分"moduleA 缺、moduleB 满";**不传 moduleBindings 时与改前逐字段一致**(回归保护 deepMining)。
3. **module 来源接地**:对含 `Package.swift`/`package.json` 的项目,核 moduleMining 用的模块名/路径与 Core `repo`/`map` 输出一致。
4. **moduleName 绑定**:提交一条 `sourceRefs` 落已知模块的 recipe 后,DB `knowledge_entries.moduleName` 非空且 = canonical 模块名(不再 `(empty)`);越界模块按设计拒绝/留空+诊断。(BiliDili 现有 3 条空 moduleName 回填属用户决策,不自扩 scope。)
5. **D3 解耦**:静态+运行核 moduleMining gap/coverage 链路无 `git_diff_checkpoints` 读写。
6. **门禁**:Core `build:check` + `KnowledgeRescanPlanBuilder` 单测(per-cell/per-dimension 两路);Plugin `build:check` + gate/rescan 单测;Node≥22。

**依赖/排序**:依赖 U0、D1 方案 A/B 决策(Confirmation Gate);被 U2a 依赖(把模块轴喂进 gap 签名是覆盖账本 per-cell 升级前置);与 UM 在 `FileChangeHandler.ts:410-493` **重叠**(U1 退役 created→moduleMining 生成语义 = UM 退役同一路径)——**合并为一处落地**。
**风险**:拍扁兼容(新 `moduleBindings` 必 additive);per-dimension 回归(per-cell 仅当传 moduleBindings 时启用,旁路);BiliDili 仅 3 条 active/单 checkpoint,验收须构造或选更大项目暴露 per-cell 与 per-dimension 差异。

### U2 — deepMining 改为「多轮覆盖增量扫」+ 覆盖账本【核心改写,方向已确认 2026-06-26】

> **deepMining 的"深" ≠ 更深符号,而是「多轮覆盖」**:coldStart 是**有上限的代表性首扫**(大项目不求一次扫干净),deepMining **多轮**按一张**覆盖账本**补缺口;**git-diff 增量生成退役、维护归 evolution**(见 UM + U5)。覆盖账本是 deepMining(长广度)与 evolution(保准确)的**唯一协作接口**,**是覆盖状态持久化,不是 plan 持久化**(plan 仍每轮无状态 draft→confirm——最易踩的红线)。

**U2a 覆盖账本(新一等产物)**【AlembicCore 先出表+repository,AlembicPlugin 后 wiring】
- 新表 `coverage_ledger`:migration `AlembicCore/src/infrastructure/database/migrations/014_coverage_ledger.ts`(按文件名自动发现,无 index 注册改动),drizzle `schema.ts:633` 仿 `gitDiffCheckpoints` 追加;`UNIQUE(project_root, module_id, dimension_id)`,列 covered/total_candidate_count、grade(empty/thin/partial/covered)、exhausted+exhausted_reason+exhausted_source('agent-declared')、covered_source_refs(JSON)、uncovered_hints(JSON)、value_score、last_round、deferred、时间戳;同迁移 `deep_mining_rounds`(round_index/started_at/completed_at/new_recipes_this_round/trigger_actor)。**刻意不含 plan/session 字段**。
- 新 `CoverageLedgerRepository`(复刻 `GitDiffCheckpointRepository:60-170` 的 upsert/onConflictDoUpdate/listByProjectRoot/#mapRow,键改 module×dimension + listByModule),注册 `repositories.ts:207/242`。
- 算法 = **扩 `CompletenessCritic`(`CompletenessCritic.ts:176`)只加聚合层、不改单候选**:新 `buildCoverageLedger`(跨维候选 + coveredPaths → per-(module×dimension) cell,**module 归属用 D1 canonical `ModuleSummary` + sourceRefs 路径前缀** `pathsOverlap:639`);**必须保持 `shouldBlockCompletion:false`/`targetGate:'advisory'`(:136-137),grade 阈值严禁当生产/阻断门**;exhausted 落库标 `agent-declared`(:550 依赖 noPadding+reason=Agent 主观)。
- 写点:Plugin `dimension-completion.ts:1183 buildCompletionCompletenessCritic`(dim 完成=本格更新)→ Core repo upsert;`project_root` 由 Plugin 提供,**Core 聚合函数不得硬编码宿主路径**。

**U2b deepMining plan 喂账本(替代硬编码 5/维)**【Plugin draft+链路 + Core gap-builder+intent】
- draft 按 stage SEED(`plan-tool.ts:208-217,259-276`):`draftPlan` 读 `args.generationStage`(PlanInput 已有),deepMining 时 `buildPlanDraftContext` 加载账本产 `gapCandidates`(空白/单薄格+计数/评级/建议补数),coldStart 保持从零;draft 响应附 existingCount/rating/deficit,`buildDraftConfirmNextAction` generationStage 不再硬编码 coldStart(`plan-tool.ts:278-341`)。**no-guess:Plugin 给 options+信号,Agent confirm 决策补哪格+预算。**
- **gap 断点打通**:intent 当前只有 `dimensionIds`(`KnowledgeRescanIntent.ts:42`)、`moduleBindings.targetRecipes` 是死字段 → `KnowledgeRescanWorkflowIntent` 加 `perDimensionTargets/moduleDimensionTargets`(`knowledge-rescan.ts:136-143`),gate 聚合 `perDimensionTarget/perBindingTargets` 进 `PlanGenerationGateReady`(`plan-generation-gate.ts:191-306`,不改 totalRecipeBudget 语义);`buildKnowledgeRescanPlan`(`KnowledgeRescanPlanBuilder.ts:73-134`)消费 Agent 目标,existingCount 优先读账本、无账本回退现算 `buildCoverageByDimension`。
- 常量降级:`TARGET_RECIPES_PER_DIMENSION=5`(`KnowledgeRescanPlanBuilder.ts:6`)保留仅作 fallback(注意 `RescanEvidenceProjectors.ts:204/211` 也依赖),deepMining 正常路径不再被 5 锁死。

**U2c coldStart 产账本 + defer 标记**【Plugin confirm 决策 + Core 写入】
- coldStart confirm(`plan-tool.ts:1283-1331 buildConfirmedPlanIntent`)Agent 决定本轮扫哪些、其余 defer(no-guess);coldStart 后首次写账本:扫过的格写 grade,**defer 的格写空行 `grade=empty,deferred=1`**(而非不建行,否则 deepMining 查"空白格"语义不明);写点复用 U2a 的 dimension-completion。coldStart=有上限代表性首扫,账本是其产物 + deepMining 的 SEED。

**U2d 多轮循环 + 停止/收敛 + 评级建议触发**【Core Advisor 纯函数 + Plugin 出口 attach】
- 新 `AlembicCore/.../host-agent/CoverageLedgerAdvisor.ts`(纯函数读账本)三类停止:① 收敛=无 blank/thin 格 或全 exhausted-with-reason;② 收益递减=`new_recipes_this_round < K`;③ 轮次上限=`last_round ≥ maxRounds`;输出 highValueBlankCount + 价值排序缺口 +「还有 N 个高价值空白,建议再扫一轮」。**K/maxRounds 由 D2 通用默认表 + plan 规模语义给。**
- 信号源:`CompletenessCritic` 瞬态 `status{exhausted/satisfied/...}`+`neededToTarget`+`hints`(:531-554)落库为持久评级,Advisor 只读账本。
- attach:`knowledge-rescan.ts:243-271 buildRescanResponse` + status;**沿用 advisory 不阻断——建议非自动调度,由用户/宿主决定是否再发一轮,不自动后台扫**;`rescanId`(`mcp-tools.ts:1089`)作幂等键;round 边界=plan-confirm 到该次全部 dimension_complete 回流。

**U2e 退役 git-diff 增量生成(生成语义)**【Plugin FileChangeHandler 切除,与 UM/U1 同处落地】
- 退役(生成):`FileChangeHandler` `case 'created'`→`#routeNewModuleToModuleMining`(`:194,410-493` 产 moduleMiningRoutes 挖矿种子)、`defaultModuleMiningAnalyzer`(`:169,705-718`)、`report.moduleMiningRoutes`/suggestReview/isUnifiedEvolutionReportRouteComplete 的 moduleMining 分支(`:124,143,680,692,723,736`);rescan 编排 `attachRescanUnifiedEvolution`(`:448-474`)去 moduleMiningRoutes/gitDiffEvidence 留 pendingProposals。⚠️ moduleMiningRoutes 是被多处消费的死字段,退役须全量 grep 清理消费方避免 undefined 访问。
- 边界:覆盖账本收敛判定**完全用账本字段,绝不复用 `git_diff_checkpoints`**(D3);evolution proposal 路径**不读写覆盖账本**。
- 维护保留部分见 **UM**;此处只切生成杂质,与 U1#1/UM#1 在 `FileChangeHandler.ts:410-493` 是**同一处改动,合并落地**。

- **跨仓**:AlembicCore(coverage_ledger 表/repository/buildCoverageLedger/CoverageLedgerAdvisor/gap-builder/intent)+ AlembicPlugin(draft SEED/链路透传/写点/出口 attach/FileChangeHandler 切除)。**Core 先出,Plugin 后接**。
- **验收**:coldStart 产账本(含 defer 格);deepMining 第 2..N 轮 plan 由账本喂、只补空白/单薄格、按价值排序;Agent confirm 的 per-cell 目标真实驱动(非硬 5);评级建议「还有 N 空白」;停止条件生效(收敛/递减/上限)**不无限扫**;git-diff 生成退役;全程 advisory 不阻断、plan 无状态、不自动后台。账本写入/读取链路无 `git_diff_checkpoints`(代码扫描证据)。
- **依赖**:扩 productization P3 的 critic 壳(加 module×dimension 聚合,不重做单候选);U1 前置(模块轴喂 gap);与"已尽 reason"协调(noPadding)。

### U3 — rescan / deepMining / moduleMining 输出预算化对齐【几乎独立,可全程并行】

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicPlugin/.../host-agent-workflows/briefing-budget.ts`(新文件) | **add** | 抽 stage-无关共享步骤 `budgetBriefingResponseData(response,{dataRoot,projectRoot,transportName,inlineBudgetBytes,compact?,attachRef})`:读 `response.data`→`jsonByteLength` 测量→≤预算 `removeTransientTransportIfPresent`+回填 inline→>预算 `writeTransientTransport(transportName)`+可选 compact 回调+`attachRef` 写 meta。复用 `#shared/transient-transport.ts` 原语;compact 阶梯作回调注入、**不下沉**。 |
| 2 | `cold-start.ts:434-461,270` ✅ | **extend(refactor)** | `budgetColdStartResponseData` 改调共享步骤,传 `transportName='bootstrap-briefing'`、18KB 预算、`compact=compactColdStartBriefing`、`attachRef` 写 `meta.fullBriefingRef`。**行为快照前后逐字段一致是硬验收**。 |
| 3 | `knowledge-rescan.ts:245-268`(`buildRescanResponse`)✅ | **extend** | 在所有 `attach*`(unifiedEvolution/trashArchive/projectSelectionMismatch)**之后**调 `budgetBriefingResponseData(...,transportName='rescan-briefing', attachRef 写 meta.fullBriefingRef)`。**沿用 `fullBriefingRef` 命名 → 零改 `core-tools/output.ts` allowlist**;若用 `fullRescanRef` 须同步加 `ALLOWED_CLEAN_META_KEYS`(94)+ `output-contract.ts`(35-36)。 |
| 4 | `knowledge-rescan.ts:322-379`(`buildRescanBriefing`) | **extend** | moduleMining(`planGate.moduleScope` 非空 / `generationStage==='moduleMining'`)调已导出的 `attachPlanScopeTargetCounts(briefing,{moduleScope,sourceFileFacts})`,与 `cold-start.ts:290` 对称。**遵 D1:moduleScope/模块轴来自 projectContext(`sourceFileFacts`),不另造来源。** deepMining 不调用。 |
| 5 | `mcp-tools.ts:1149,1071` | **extend** | `RescanInput.generationStage`/`BootstrapInput.generationStage` 补 `.describe()`(stage 语义 + fullBriefingRef 预算行为)。纯文案。 |
| 6 | `handlers/recipe-map.ts` + `AlembicRecipeMapOutput.ts:206`(`meta.fullMapRef`) | **decision** | ⚠️ 纠正:一轮称"P2 已给 recipe_map 加 writeTransientTransport+fullBriefingRef"**不成立**——recipe_map 声明 `meta.fullMapRef` 且**从未被写入**(grep 0 命中)。是否纳入共享步骤须用户/Design 决策,**不默认做**(越过 coldstart-repair P2 的 rescan-only 边界)。 |
| 7 | `AlembicCore knowledge_entries` schema | **decision** | ⚠️ 纠正:A4-P4 `generationStage` **响应面已具备**(`attachPlanGenerationGateData` 写入 + `output.ts:122/261` 已 allowlist)。真实缺口=`knowledge_entries` **无 generationStage 列**(PRAGMA 确认),属 Core schema/migration、触持久化红线,**作独立决策项,不在本 Plugin 阶段顺手做**。 |

**跨仓 + 顺序**:主体**全在 Plugin**(新建 briefing-budget.ts + 改 cold-start/knowledge-rescan + mcp-tools 描述;复用 transient-transport;**零改 Core**)。Core 仅只读核验 `presentHostAgentKnowledgeRescanResponse`(`KnowledgeRescanPresenters.ts:189-232`)决定 rescan data 形状,预算步骤在 Plugin 侧后处理。
**验收标准**
1. **共享步骤+双复用**:briefing-budget.ts 导出 stage-无关函数,cold-start 与 rescan 均 import;grep 确认 cold-start 不再内联自有 measure/spill 外壳(compact 回调除外)。
2. **cold-start 零回归**:对 BiliDili 跑 `alembic_bootstrap`,`response.data` 字节、`meta.fullBriefingRef`(超预算非 null/不超时为 null+`.asd/tmp` 文件被清)、compact 阶梯输出与改前**逐字段 diff 一致**。
3. **rescan 被预算化**:跑 `alembic_rescan(deepMining)`,data 全量>预算时 `response.data` ≤阈值、`meta.fullBriefingRef` 指向真实可读 `.asd/tmp/rescan-briefing-*.json`(含被移出的 ideAgentAnalysis/dimensions/projectContextCreationGuide);不超预算时完整 inline 且无残留瞬态。
4. **测量覆盖 unifiedEvolution**:构造含 evolution/proposals/gitDiffEvidence 的 rescan 响应,验证计入字节测量(预算步骤在 `attachRescanUnifiedEvolution` 之后调),spill 后 inline 不超预算。
5. **moduleMining target 对称**:跑 `alembic_rescan(moduleMining, moduleScope=真实模块路径)`,`briefing.targets` 含 per-scope fileCount/keyFiles(`source='plan-module-scope'`),与同 scope cold-start 一致;deepMining 不注入额外项。
6. **D3 守卫**:briefing-budget.ts 全文无 `git_diff_checkpoints`/`GitDiffScanner` 引用。
7. **A4-P3/P4**:两个 generationStage 有 `.describe()`;响应 `data.generationStage` 经投影保留;DB 持久化作决策项记录,不默认实现。
8. **门禁绿**:Node22 下 Plugin `build:check`+`lint`+`vitest`(cold-start/rescan);`lint:repo-boundary`+`report:agent-extraction-boundary` 不新增违规。

**依赖/排序**:独立于 Core,可与 U1/U4/U5/U6 的 Core 改动并行;只读依赖 Core presenter 形状。预算阈值(D2)本阶段先用与 cold-start 同源常量,"规模派生"留 D2 后续不阻塞。recipe_map / DB 列两决策项不依赖、不阻塞主线。

### U4 — evolution 衰减触发器恢复(DecayDetector tick-on-access)

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicCore/src/service/evolution/DecayDetector.ts:324-326` ✅ | **extend** | **A5-P7 authority bug 必修**:`authority=min(1, authorityRaw/100)` → `min(1, max(0, authorityRaw/5))`(✅ 注释写"0-100→0-1"但写入真相是 `KnowledgeService.ts:768 Math.round(qualityScore*5)`=0-5 域)。`??50` 默认改 0-5 中性默认(如 2.5)。BiliDili authority=4 修后得 0.8 而非 0.04。补中文注释说明域来源。 |
| 2 | `AlembicCore/test/unit/DecayDetector.test.ts:53,69,94,109,122,142,155` + Plugin 镜像 | **extend** | 测试用 0-100 域(80/100)正是掩盖 bug 的元凶(test-masks-bug)。改 0-5 真实域(healthy 用 4-5、severe/dead 用 0-1),**新增断言**:authority=4 其它维度健康的 active 不被误判 dead/severe(锚 BiliDili)。 |
| 3 | `DecayDetector.ts:127-128`(`scanAll`) | **extend** | `scanAll(cap?)`:`undefined` 保持无界(字节兼容);数值时透传 `findAllByLifecycles(['active'], cap)`(`KnowledgeRepositoryImpl.ts:415-437` 已支持 cap、最旧优先、跨 tick 排空)。Core 不设默认(由 Plugin sweep 定)。 |
| 4 | `DecayDetector.ts:136-156` | **extend** | ⚠️ **关键纠正**:信号汇**也断**——`scanAll` 只 `signalBus.send('decay')`,唯一消费方 `ProposalExecutor.subscribeToSignals`(`ProposalExecutor.ts:85`)✅ 零调用方(staging-sweep 注释"P3 subscribe 本次不接线"佐证)。故 **tick 必须直接经 `LifecycleStateMachine.transition()` 落 `active→decaying`**(`Lifecycle.ts:79` 已允许),不依赖信号总线。给 DecayDetector 注入可选 `lifecycleStateMachine`,对 `level∈{decaying,severe,dead}` 调 `transition({targetState:'decaying',trigger:'decay',evidence})`;保留 `signalBus.send` 作可观测;经 `isValidTransition` guard 幂等。`decaying→deprecated` 仍由现役 `checkTimeouts` 30d grace 接管。 |
| 5 | `AlembicPlugin/.../host/staging-access-sweep.ts`(扩 `runSweep`)✅ | **add** | 推荐方案(A):在 `runSweep` 同一 try-catch 信封、promote+checkTimeouts 之后,以同一共享 cap 调 `container.get('decayDetector').scanAll(cap)`——复用现成 throttle/inFlight/2s timeout/cap,additive 计数 `decayCheckedCount/decayTransitionedCount`。若 2s 预算不够三驱动→方案(B) 新建 `decay-access-sweep.ts` 镜像 + 更宽 throttle。 |
| 6 | `AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:278-291` ✅ | **reuse** | ✅ `decayDetector` 已注册但零 `.get`(孤儿)。注册体扩注入 `ct.get('lifecycleStateMachine')`,使其能迁移而非仅发信号;首次有真实 `.get`(来自 decay-sweep)。 |
| 7 | `AlembicPlugin/.../evolution/FileChangeHandler.ts:291-321` | **extend** | **A5-P5 相关性闸**:git-head 分支在 `assessFileImpact` 返回 null(零 token 命中)时不再无条件提 reference 提案;最小方案=降级为 `generationChangeLog` 记录+`report.skipped++`,不进 `pendingProposals/needsReview`。阈值/语义由 D2 给。 |

**跨仓 + 顺序**:Core(DecayDetector authority 修 + scanAll cap + 经 lifecycle 落迁移注入 + test 0-5 域修正;authority 真相在 `KnowledgeService.ts:768` 仅证据不改)→ Plugin(decay-sweep tick + KnowledgeModule 注入 lifecycle + HostMcpServer tick 挂载 + FileChangeHandler git-head 闸)。Core 先改先验先 commit,Plugin 经 `file:../AlembicCore` 消费 + DecayDetector.test.ts 镜像同步。
**验收标准(真机 DB)**
1. **[A5-P7 单测]** authority=4(0-5)其它维度健康→authority 维度=0.8(非 0.04),level 不为 dead/severe;authority=0→0、5→1。
2. **[A5-P7 真实数据]** 用 BiliDili DB(3 条 active authority=4)跑 scanAll,3 条均不被误判 dead/severe(修前 ~0.8 分、修后 ~16 分,decayScore 差≈15)。
3. **[孤儿消除]** grep `decayDetector`/`scanAll` 在 Plugin/lib 有真实 `.get` 调用方;tick 中被实例化执行(日志/计数证据)。
4. **[有界]** `scanAll(cap)` 单 tick ≤cap 条(最旧优先),积压跨 tick 排空;`cap=undefined` 全表;env 覆盖生效。
5. **[节流/超时]** decay-sweep 复用 staging throttle+inFlight+timeout;超时/失败走 skipped 不抛、不阻塞工具返回。
6. **[迁移落地·非信号]** tick 评估出 decaying/severe/dead 经 `transition` 真实落 `active→decaying`(DB lifecycle 变更 + transition event),**不依赖 ProposalExecutor 信号订阅**;幂等。`decaying→deprecated` 仍由 `checkTimeouts` 30d 驱动。
7. **[A5-P5]** git-head 触碰 covered 文件但零 token 命中时不再产 reference proposal;有真实 token 时行为不变;新增单测覆盖 zero-relevance 分支。
8. **[D3]** decay tick 链路不读写 `git_diff_checkpoints`(代码扫描证据)。
9. **[门禁]** Core/Plugin `build:check`+受影响 `test:unit`+`lint` 绿(Node≥22)。
10. **[兼容]** 5 策略/4 维评分/level 阈值/grace 语义不变(authority 归一与 cap/迁移为 additive);`scanAll` 无 cap 调用方字节兼容。

**依赖/排序**:✅ **followup 已完成,前置解除**——U4 = 在已落的 3-driver sweep(`staging-access-sweep.ts:138-152` promote/checkTimeouts/checkAndExecute)上**加第 4 driver(decay)**,直接复用 `resolveStagingAccessSweepCap`;依赖 `LifecycleStateMachine.transition`/`checkTimeouts`(均已落、有界);与 U5 共用 `ProposalExecutor`/`EvolutionGateway`——**U4 transition 路径与 U5 executor 分流分两次 Core 提交**避免冲突。落地时顺手修 `staging-access-sweep.ts:137` 过时注释("P3 本次不接线")。
**风险**:信号汇双断认知(DecayDetector 与 ProposalExecutor 是两个独立孤儿,只接前者仍不通,**必须 tick 直走 transition**);2s timeout 挤占(BiliDili 仅 3 条测不出压力,需更大 active 集,不够则拆独立 sweep);authority 默认值漏改会反向虚高掩盖衰减;A5-P5 过严会漏真实需复审变更。

### U5 — evolution 合并/执行 OUTCOME 质量

> **⚠️ 核心纠正(重写已采纳)**:一轮"整条链没有任何生产方往 `suggestedChanges` 写"**不精确**。✅ `suggestedChanges` 有生产方——Agent `evolve` 路径(`handlers/host-agent/evolve.ts:182,188`)和 `FileChangeHandler.ts:573` 都写。真实断点是 **consolidation/merge 路径无生产方**:`RecipeProductionGateway.#createProposalFromAdvice` 的 `evidence` 只塞 `candidateTitle/candidateCategory/analysisReason/mergeDirection`(merge 分支 grep `suggestedChanges`=NONE)→ merge 提案必走 `ContentPatcher.ts:106-108` `No suggestedChanges` 早退 → `ProposalExecutor` 据 `patchResult.success=false` 退回 active → **伪成功**(状态机跑完、`markExecuted`,但 Recipe 内容零变化)。框架=**merge 路径丢弃结构化补丁素材**,非"全链无生产方"。

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicCore/.../ConsolidationAdvisor.ts:614-655,220-264` | **extend** | `#computeMergeDirection` 算 `addedDimensions` 的同时,把候选字段真实值组装成 `StructuredPatch`(`PatchChange[]`:coreCode→`replace` 仅当目标空/短、dontClause/whenClause→replace/append、新 doClause 词→content append),挂到 `ConsolidationAdvice.mergePatch?:StructuredPatch`。判定逻辑已存在,只把"标签"升级为"可应用补丁"。**不放宽相似度阈值**。 |
| 2 | `AlembicCore/.../RecipeProductionGateway.ts:974-1006` ✅ | **extend** | evidence 追加 `advice.mergePatch` 为 `suggestedChanges`(`JSON.stringify`)+ 保留候选 coreCode/clauses 原值。A6-P2 核心修复点:候选内容不再只剩 title/category/prose。 |
| 3 | `AlembicCore/src/domain/evolution/EvolutionPolicy.ts:104-123` + `ProposalExecutor.ts:160-173,319-334` | **add** | 新增 `EvolutionPolicy.evaluateMerge(metrics/patchPresence)`:merge/consolidation 来源**不要求 `hasUsage`**(新并入内容本就无使用历史),改校验"补丁存在且非破坏"(有 StructuredPatch、不触发全量替换、FP 仍作护栏)。`ProposalExecutor` 按 `proposal.source/type` 分流:aging→`evaluateUpdate`、merge→`evaluateMerge`。**门禁不放松**——把被误用的使用量条件换成对合并语义正确的条件。✅ `ProposalRecord` 的 `source` EvolutionGateway 已写、仅 executor 未读,避免误加 migration。 |
| 4 | `ProposalExecutor.ts:355-388` | **extend** | `patchResult.success=false` 且类型为 merge 时**不再静默 markExecuted+revert active**,改 `markRejected('no applicable patch')` 或保留 observing 等待 `#tryUpgradeExistingProposal`,并落 lifecycle event 记"内容未变更"。区分"真正无操作的 valid"与"应有补丁却空转"。 |
| 5 | `ContentPatcher.ts:194-207,254-257,286-289` | **retire** | 删"文本≥20→content.markdown 全量 replace"破坏式降级,改 `#skipResult('unstructured patch, requires StructuredPatch')` 不写库;append 路径加去重/段落边界保护。 |
| 6 | `AlembicCore/src/domain/evolution/RecipeSimilarity.ts:261-283,119-125` | **extend** | A6-P4:新增可选 `embeddingSim` 维度(**注入算好的向量/相似度**,domain 层不发起 embed 保纯度),与 `contentTokenSimilarity` 取 max/加权;embedding 不可用回退 Jaccard(确定性下限)。WEIGHTS 增配但无 embedding 时数值不退化。 |
| 7 | `RecipeProductionGateway.ts:658-690` + `ProposalExecutor.ts:461-464` | **extend** | A6-P6:`replacedByRecipeId` 从 `createdIds[0]` 改为按与被替代 Recipe 相似度/覆盖最高的新建项选定(复用 RecipeSimilarity);`deprecated_by` 边同源选定。 |
| 8 | `ProposalExecutor.ts:152-211`(信号) vs `294-315,266-290`(兜底) | **decision** | A6-P7:信号 `#evaluateOnSignal` 与兜底 `#processExpiredProposal` **必须共用同一评估/分流函数**(merge→evaluateMerge、aging→evaluateUpdate、deprecate→evaluateDeprecate),避免两入口门禁分叉。需 Design 确认是否收敛到单一 `evaluate()` 编排。 |
| 9 | `git_diff_checkpoints` + `FileChangeHandler` 触发链 | **reuse** | 保留 checkpoint 作唯一维护游标(D3/UM)。**U5 真实验收依赖 UM 打通**(checkpoint 从 `initialized` advance 出 observing 提案)。 |

**跨仓 + 顺序**:主体**全在 Core**(ConsolidationAdvisor/RecipeProductionGateway/ContentPatcher/EvolutionPolicy/ProposalExecutor/EvolutionGateway/RecipeSimilarity + `types/evolution.ts`,**全 additive,禁破坏 exports/排序/状态机/持久化**)。Plugin 消费方:`KnowledgeModule`(subscribeToSignals 接线 + ServiceMap 注入)、`handlers/{consolidate,host-agent/evolve,tool-router}.ts`、embedding 维度需 Plugin 注入 VectorService/RecipeRegionVectorIndex 到 RecipeSimilarity 调用点。Core 分阶段提交,先改先验先 commit,再 Plugin 同步。
**验收标准(真机 BiliDili 02a25032)**
1. **端到端**:构造高相似候选触发 `advice=merge`,提交后 `evolution_proposals` 有 1 条 update 提案且 `evidence LIKE '%suggestedChanges%'` 非空(当前实测=0)。
2. **ContentPatcher 真应用**:合并执行后目标 Recipe 的 coreCode/dontClause/whenClause/content.markdown 至少一字段变更,`ContentPatchResult.success=true`、`fieldsPatched` 非空、before≠after 可追溯。
3. **无伪成功**:patch 缺失/失败时不得 `markExecuted+'reverted to active'`;`lifecycle_transition_events` 无"已执行但内容零变更";改 markRejected 或保留 observing。
4. **门禁分流**:新合并(无使用历史)merge 提案不再因 `hasUsage=false` 被 reject;真正老化 aging-update 仍按 `evaluateUpdate`(FP<0.4 且有使用)评估——两类各跑一遍;门禁强度不下降(FP 护栏保留)。
5. **破坏式替换退场**:喂一段自然语言不再全量覆盖 content.markdown,`skipReason='unstructured patch...'`,正文不变;单测覆盖。
6. **embedding 可用+回退**:VectorService 可用时对一对近义改写给出高于纯 Jaccard 的相似度;不可用回退 Jaccard,`computeDimensions` 确定(同入同出),现有单测仍通过。
7. **supersede 选定**:≥2 新建 supersede 一个旧 Recipe 时,`replacedByRecipeId` 与 `deprecated_by` 边指向相似度最高者而非 `createdIds[0]`。
8. **触发器接通(依赖 UM)**:BiliDili 一次 git commit 后 checkpoint 从 `initialized` 推进,`FileChangeHandler` 发 `source_modified`、`ProposalExecutor` 收到并评估到 ≥1 条 observing 提案;deepMining 全程不触碰 `git_diff_checkpoints`。
9. **信号 vs 兜底一致**:同一 merge 提案经两入口评估结论一致。
10. **Core 自验证 + 跨仓兼容**:Core `build:check`+`test`+`lint` 绿;新增 evaluateMerge/embedding/mergePatch 有单测;DTO additive,Plugin `build:check` 通过。

**依赖/排序**:**强依赖 UM 打通**(✅ BiliDili checkpoint 实测停 `initialized` 从未推进——即便修好 merge OUTCOME,触发器不点火则链在真实项目永不运行,U5 无法被真实验收;验收第 8 条须先有 UM 产出 observing);与 U4 共用 ProposalExecutor/EvolutionGateway/LifecycleStateMachine,**改动顺序须协调分阶段提交**;supersede 改相似度选定复用 RecipeSimilarity,与 embedding 改造耦合注意提交顺序。
**风险**:伪成功最隐蔽(只看"执行率/contentPatchRate 数字"会被骗,必须以 before≠after 快照与字段实变为准);StructuredPatch 机器生成质量取决于 `#computeMergeDirection` 字段判定(保守="安全并入"非"智能融合");evaluateMerge 不当=放松门禁(必保留 FP/破坏式补丁护栏);embedding 必须注入算好的向量保 domain 纯度。

### UM — commit-driven 唯一维护触发链路【D3,U5/U6 前置,最先打通】

> **D3:维护 = commit-driven 唯一触发源,保留 `git_diff_checkpoints` 作纯维护游标。** 语义=新提交→扫 diff→对受影响**既有 Recipe** 建/更新/弃用 evolution proposal;不生成新 Recipe、不读写覆盖账本。✅ BiliDili 游标实测 `last_route_status=initialized` 从未 advance——**维护闭环线上从未真正跑通一次,这是全伞形最危险暗坑**。

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicPlugin/.../evolution/FileChangeHandler.ts:410-493`(`#handleCreated→#routeNewModuleToModuleMining`) | **retire** | **剥离生成杂质(=U2e/U1#1 同一处,合并落地)**:`#handleCreated` 保留 coveredCreated(命中既有 ref=维护),对未覆盖新文件**不再调 moduleMiningAnalyzer 种新 Recipe**。同步清理 `moduleMiningRoutes`/`classificationCounts.moduleMiningRoutes`/`suggestReview`(204-205)+ 构造器 `moduleMiningAnalyzer` 选项(65,169,705-718)。落为:git-diff 只对既有 Recipe 建/更新/弃用 proposal。 |
| 2 | `knowledge-rescan.ts:381-446` + `opportunistic-evolution-presenter.ts:24-103` | **reuse** | 两入口含近乎相同 `createPluginGitDiffCheckpointRuntime→scanOnce→handleFileChanges→recordRouteOutcome`。抽 `runCommitDrivenMaintenance(container,projectRoot,scope?,taskScopedFiles?)` 共享函数(放 git-diff-checkpoint/ 下),两入口都调。rescan 仍是 trigger 之一(commit-driven 唯一触发源),不再各写一份编排。须保持 rescan 既有 `prepareRescanState` 顺序(先 cleanup+rebuildLocalKnowledgeIndexes 再 scan)。 |
| 3 | `opportunistic-evolution-presenter.ts:24-103,34-36,54-57,84-89` | **extend** | 顶部加中文注释固化语义:本入口=commit-driven 唯一维护触发源,不生成新 Recipe、不读写覆盖账本。**保留** `residentProjectScopeAvailable && !headChanged` defer(54-57)但**重定义为「resident 检索增强去抖」**(✅ 已核实 resident 不产 evolution、非维护对端):去抖=resident 检索增强在位且 HEAD 未变→跳过本次 one-shot dirty-worktree 评估,维护仍由 commit-driven 在 HEAD 变化时唯一触发,误判仅"本次不附 evolution surface"不漏维护。**改名误导变量** `mainServiceCanHandleProjectScope`(:89)→如 `residentSearchEnhancementReady`(否则再被误读成"主服务接管维护")。`COMMIT_DRIVEN_TRIGGER_TOOLS` 门控 + `trigger.reason` 保持。入口级幂等已有 `hasEmbeddedUnifiedEvolutionSurface`(:34-36)拦 rescan↔presenter 重复。 |
| 4 | `AlembicCore/.../GitDiffCheckpointService.ts:107-188` + `GitDiffCheckpointRepository.ts` | **reuse** | **保留 `git_diff_checkpoints` 作纯维护游标(D3 必要性=是,不删)**——`previousHead↔HEAD` per-scope 持久游标,FileChangeHandler 靠它界定"自上次维护后新增提交 diff 范围",删除会每次工具调用全量重扫或漏扫。`ensureCheckpoint`/`recordRouteOutcome`/`advance` 语义不变,Core 不改。 |
| 5 | `FileChangeHandler.ts:440-453` | **decision** | created"未覆盖新文件"退役后归属:(a) 完全静默丢弃;或(b) 保留纯计数/诊断信号(不触发任何生成/分析)。建议(b) 但标注可观测、非生成;须确认不与 U2 规模/round 生成职责重叠。 |
| 6 | `GitDiffCheckpointRepository.ts:145-151` | **decision** | scope 粒度:现按 `(project_root,scope_id,folder_id)` 唯一(BiliDili 实测仅 single-folder/root 一行)。维护触发是 commit-range 坐标系,与 D1 module 轴/D4 per-cell 覆盖账本是**不同坐标系**,本阶段**保持 folder/scope 游标不 per-module 化**,勿被覆盖账本粒度污染。 |
| 7 | `AlembicCore/src/service/evolution/EvolutionGateway.ts` + `src/repository/evolution/ProposalRepository.ts`(`FileChangeHandler.ts:177,581,614` 每 event submit 无幂等键) | **add** | **commit-driven 唯一触发源的真正护栏(非 resident 互斥,⑤a 核验产物)**:在 `EvolutionGateway.submit`/`ProposalRepository` 加 `(recipeId, sourcePath, changeType)` 幂等键去重 pending proposal,挡住双入口/重复 commit 产生同一 pending。**前置核**:先确认 ProposalRepository staging 是否已对同 recipeId+sourcePath 去重(本次未核),已有则只补缺口。 |

**跨仓 + 顺序**:主体**全在 Plugin**(evolution 维护链 + opportunistic-evolution-presenter + knowledge-rescan)。Core 本阶段**只读不改**——游标语义保留即满足 D3;`git_diff_checkpoints` 表 schema 不变。
**验收标准(真机 BiliDili)**
1. **语义隔离**:grep 确认 `git_diff_checkpoints`/`GitDiffCheckpointRepository`/`DurableGitDiffCheckpointRouting` 唯一读写方是维护触发链(✅ 已核实);deepMining/覆盖账本/`buildCoverageByDimension` 路径无任何引用(✅ NONE)。
2. **生成退役**:创建全新无覆盖 `.swift` 文件并 commit→触发 `alembic_work/code_guard`,断言 surface 中 `moduleMiningRoutes` 为空(或仅非生成诊断计数),不再调 `buildHostAgentProjectContextAnalysis` 种新 Recipe;DB 不新增由该 created 事件产生的 candidate/recipe。
3. **维护闭环(核心,当前未走通)**:修改一个被 `recipe_source_refs` 覆盖的既有源文件并 git commit→触发任一 `COMMIT_DRIVEN_TRIGGER_TOOLS`→断言 (1) GitDiffScanner 产 modified/git-head 事件,(2) FileChangeHandler 命中既有 Recipe 经 EvolutionGateway 落 update proposal,(3) `git_diff_checkpoints.last_route_status` 变 routed/catch-up-routed 且 `checkpoint_commit` 从 `a3ea6a25` advance 到新 HEAD、`advanced_at` 非空。
4. **游标必要性**:连续两次 commit+触发,第二次 `previousHead` = 第一次推进后 `checkpoint_commit`,断言第二次只扫第二个 commit 增量 diff(不重扫第一个)。
5. **删除/重命名维护**:删除被覆盖源文件并 commit→落 deprecation proposal(非直接删 Recipe);高置信 rename→source-ref 路径修复且游标推进。
6. **单一触发编排**:`runCommitDrivenMaintenance` 被两处复用(无重复 scanOnce/recordRouteOutcome);`FileChangeHandler.test.ts`/`GitDiffCheckpoint.test.ts`/`PluginOpportunisticEvolution.test.ts` 全绿。
7. **门禁**:Plugin `build:check`+`lint:repo-boundary`+相关 unit 通过(Node≥22)。

**依赖/排序**:**是 U5/U6 的上游前置**(维护闭环能 advance 才是 U5 merge OUTCOME 真实验收、U6 commit-gated unifiedEvolution 的触发源)——**UM 先于 U5/U6 验收**。与 U1/U2e 在 `FileChangeHandler.ts:410-493` 是**同一处改动,合并落地**。
**风险(最关键)**:⚠️ **主循环失败却去修周边(最高)**——BiliDili 游标实测 `initialized` 从未 advance,退役生成前**必须先证明 modified/deleted 维护链能把游标推进到 routed**,否则可能把唯一能产 advance 的(被误当生成的)路径一起退役,导致维护链彻底无产出;**resident 非双生产方(✅ 已代码核实闭合)**——resident 在 PDR-3 删 daemon 后无活的 file-monitor→evolution 实现(`ResidentServiceContracts.ts:38-46` 的 `file-monitor.git-worktree` 是无实现契约壳,唯一活 evolution 在 Plugin `EvolutionGateway`@`KnowledgeModule.ts:347`),defer 仅检索去抖,fallback 安全无须互斥;真正收口对象是 **Plugin 内 presenter↔rescan 双入口**(已有 `hasEmbeddedUnifiedEvolutionSurface` 幂等)+ 补 **proposal 级幂等键(UM#7)**;moduleMiningRoutes 死字段退役须全量 grep 清理消费方;scope 粒度勿被 per-cell 污染。codex 主仓 Core 外是否另有独立 evolution 进程=out-of-scope(本伞形目标宿主 cc-plugin),待真机非阻断。

### U6 — rescan 内容级保鲜 + audit 闭环

**范围 + 落地点**

| # | file:line | change | 怎么改 |
|---|---|---|---|
| P1 | `knowledge-rescan.ts:128-187`(`prepareRescanState`)+ `233-243`(`rebuildRescanIndexes`) | **add** | 新增**不依赖 commit 的显式内容重校验入口**(rebuildRescanIndexes 之后、buildRescanResponse 之前):对全量/moduleScope 限定 active source_ref 逐条做 P2 指纹比对,与 commit-gated unifiedEvolution **并列、互不依赖**。新步骤**不写 `git_diff_checkpoints`**(D3);产物(漂移命中清单)进 P3 audit-gate 和 P5 响应透出。 |
| P2 | `AlembicCore/.../SourceRefReconciler.ts:332-389` + `recipe_source_refs` schema(migration) | **add** | migration 增 `content_fp TEXT`(源文件 region 内容指纹,可空)。指纹算法**独立于** `computeKnowledgeHash`(`KnowledgeFileWriter.ts:490` 是 .md 全文 SHA-256 检测手改 .md,**绝不复用**):读 resolved 源文件、按 `:startLine-endLine` 截 region(无行号则全文)、normalize 后 SHA-256 切 16 hex。新增 `#sourceContentFingerprint`;reconcile 在 exists 为真时比对 `content_fp`:不变→active 续期;变化→`status='drifted'`(或 active+driftedFp 标记)+ 记 `verified_at`。drifted 经 P3 gate 决定 update/deprecate。 |
| P3 | `AlembicCore/.../KnowledgeRescanPlanner.ts:156-199` + `EvolutionPrescreen.ts:63-95` | **extend** | `auditRecipesForRescan` 增可选 `evolutionGateway` 注入:verdict=dead→`submit({action:'deprecate',source:'rescan-audit'})`;decay/severe 或 P2 drifted→`submit({action:'update'})`。submit 结果回填真实 `proposalsCreated/immediateDeprecated`(替换 196 硬编码 0 与 197 `counters.dead` 计数)。`EvolutionPrescreen` 的 `'auto-deprecated'` 字符串改引用真实 gateway 结果(proposalId/outcome)。Guard 拒绝→降级 proposal 而非丢弃。 |
| P4 | `SourceRefReconciler.ts:422-536`(`repairRenames`/`applyRepairs` 零调用)+ `knowledge-index-rebuild.ts:91-112` | **reuse** | 接活死代码另一半:`reconcileSourceRefs` 在 reconcile 后若 `report.stale>0` 依次调 `repairRenames()→applyRepairs()`(git rename→`renamed`→写回 .md+DB→active)。report 增 `renamed/applied` 并经 P5 透出。 |
| P5 | `knowledge-rescan.ts:233-243,245-268` | **extend** | `rebuildRescanIndexes` 从 `async void` 改返回 `KnowledgeIndexRebuildReport`;`prepareRescanState` 存入 state;`buildRescanResponse` 把 `recipeRegionVectors`(status/reason/vectorAvailability/entries)attach 到响应 data。`status='skipped'` 且 reason=vector-unavailable 时给高可见 warning + 既有 recipe region/memory 落库计数。`recipe-region-vector.ts:110-118` skip 报告已含全字段,无需改 skip 本身,只让它流到响应。 |
| P6 | `SourceRefReconciler.ts:440`(`repairRenames` 裸 `path.resolve`) vs `332-340/581-607`(`#resolveSourcePath`) | **extend** | `repairRenames:440` 的 `path.resolve(projectRoot,newPath)` 改走 `#resolveSourcePath`(ProjectScope-aware)+ `sourcePathFilesystemCandidates`(line-suffix strip),与 `#sourcePathExists` 同一套。P2 指纹读文件复用同一 resolve 出口,确保 reconcile/repair/fingerprint 三处口径一致。 |
| — | `git_diff_checkpoints` | **decision** | 内容指纹/drift 状态写 `recipe_source_refs.content_fp`,**绝不写 `git_diff_checkpoints`**(D3);P1 非 commit 重校验是平行触发源,不读不写该表。 |

**跨仓 + 顺序**:Core(内容指纹算法 + `content_fp` migration + reconcile/repair/resolve 口径统一 + audit→EvolutionGateway 落实)+ Plugin(rescan 编排接入 + rebuildRescanIndexes 返回报告 + P5 响应透出 + region-vector skip 流转 + knowledge-index-rebuild 接 repairRenames/applyRepairs)。⚠️ 一律改 live `../AlembicCore`(vendor 478 行 vs live 632 行,不碰);EvolutionGateway 已在 Plugin 容器注册(`KnowledgeModule.ts:343`),P3 接入无需新建服务。**先 Core 提交+验证,再 Plugin 接入。**
**验收标准(真机 BiliDili 02a25032)**
1. **P1**:HEAD 仍 == `git_diff_checkpoints.checkpoint_commit a3ea6a25`(不产新 commit)前提下,手工改写一段源码(不改文件名/行数范围),跑 `alembic_rescan`,响应出现该 recipe 内容重校验命中(drifted)且 `unifiedEvolution.scan.events` 为空——证明保鲜不依附 commit。
2. **P2**:migration 后 `recipe_source_refs` 出现 `content_fp` 列且对 11 条 active ref 回填非空;改 region 内容后 reconcile 对应行 status 变 drifted、`content_fp` 变、`verified_at` 刷新;仅改 region 之外同文件其它行→该 region ref 保持 active 不误报。指纹与 `computeKnowledgeHash` 不同源(单测断言两函数对同一 .md 产出不同/互不调用)。
3. **P3**:构造 dead recipe(删全部 source 文件)跑 rescan,`evolution_proposals` 新增对应 deprecate proposal(或 `lifecycle_transition_events` 新增 deprecated 转移),`auditSummary.proposalsCreated>0`(不再硬编码 0);Guard 拒绝场景降级 proposal。`EvolutionPrescreen` 的 `'auto-deprecated'` 携带真实 proposalId/outcome。
4. **P4**:`git mv` 一个被 recipe 引用的源文件并 commit,跑 rescan,该 ref 经 repairRenames→applyRepairs 自动变 active+新路径,.md `reasoning.sources` 与 DB 同步;report 透出 renamed/applied>0。
5. **P5**:vector provider 不可用环境跑 rescan,响应 `data.recipeRegionVectors.status='skipped'`+reason+高可见 warning(不再只 info 日志);provider 可用时既有 recipe region/semantic-memory 落库计数(generated/upserted)在响应可见且>0。
6. **P6**:单测断言 `#sourcePathExists`、`repairRenames`、P2 指纹三处对同一带 `:line` 后缀+跨仓 qualifiedPath 解析出相同 absolutePath;移除裸 `path.resolve` 后回归绿。
7. **门禁**:Core `npm run check`(含 CoreDeliveryBoundary/CorePackage 边界测试)全绿;Plugin `build:check`+`lint:repo-boundary` 全绿(Node≥22);新 migration 在干净 DB 与 BiliDili 已有 DB(507KB,11 ref/3 entry)均幂等无报错。

**依赖/排序**:依赖 UM(P3 audit 闭环 + P4 rename 修复的真实验收要 commit→checkpoint→signal 链能产出;P1 是平行保鲜源可独立验);与 U5 共用 EvolutionGateway(P3 audit→gateway submit 与 U5 merge→gateway submit 同入口,**门禁分流 U5 evaluateMerge/evaluateUpdate 须先于 P3**,否则 P3 update proposal 仍被 hasUsage 误杀);与 U1/D1 一致(P1 moduleScope 限定取自 projectContext 模块能力)。
**风险**:P2 指纹选型(固定行号截取在源文件他处增删行后整体偏移→截错位内容产假漂移,按行号 vs 符号锚点 = Confirmation Gate);P3 dead→deprecate 改变可见行为(建议 deprecate 默认进 observation-window 而非 immediately-executed,废弃力度 = Confirmation Gate);P4 真实改写 .md+DB 须幂等可重入;P1 大项目全量扫描需 moduleScope/分批限流;P5 改返回类型须 grep 其它消费方同步;**content_fp 首轮 null→首填只回填不改 status**,否则首次升级即全量误判 drifted。

### U7 — 全维 + 全 stage + evolution 真机端到端闭环【顶层完成定义】
- **范围**:A8-P1/A8-P2 全 14 维 coldStart→deepMining(多轮覆盖)→moduleMining→evolution 端到端;A8-P6 coldStart 强完成定义=全维 dimension_complete;A8-P7 semantic_memories 落库链路勘探。
- **跨仓**:Test(e2e)+ 控制器(acceptance)。
- **验收**:BiliDili 一轮跑全维 coldStart + deepMining 多轮 + moduleMining 分模块 + evolution 触发(UM advance + U5 OUTCOME),各 stage 产可核 DB 证据;semantic_memories 非 0;checkpoint advance。
- **依赖**:U1-U6 + UM 全部落地 + 3 个在途需求落地。

## 第二轮对抗核验(2026-06-26,authoritative)— 逐阶段修正 · 优化验收 · 权威推进顺序

> 6-agent 对抗式复核(~884K tokens),基线 **AlembicCore@62f0b4b / AlembicPlugin@799ceac**(较 doc 引用 b557b10/2748968 前进;U1/U3 区域行号未漂,U4/U5/UM 多处已漂、逐条标注)。真机 BiliDili 实测:3 active(authority=4、lastHitAt=null、hits=0)/ 0 proposal / 0 semantic_memory / 11 source_refs / `git_diff_checkpoints` 单行 `initialized`@`a3ea6a25`、advanced_at=NULL。**与上文分阶段设计冲突处,以本节为准**;blocker 已开代码+开 DB 二次核实。

### A. 逐阶段落地修正(blocker / accuracy)

**U1**
- `accuracy` **moduleBindings 三字段并非都有类型保证**:`plan-generation-gate.ts:11-17` 仅 `modulePath` 必填,`normalizePlanSelection`(216-239)运行时强制 `dimensions` 非空但**从不校验 `targetRecipes`**。→ U1#3 perCellTarget 须 `binding.targetRecipes ?? D2默认`,不可假设非空。
- `accuracy` **`project-context-anchoring.ts` 不是 moduleName 派生点**(它是 creation-guide,只把 `moduleScope[0]` 当 graph 提示)。真正派生在 `RecipeProductionGateway.ts:753`(`item.moduleName || metadata.moduleName || ''`,空串兜底已是现状)。→ U1#5 重点=**从 sourceRefs 落点 canonical `ModuleSummary` 派生**,非兜底本身。
- `accuracy` **U1#2 是 additive 扩 seed 不是透传**:`ProjectContextModuleSeed`(`project-context-analysis.ts:39-47`)无 dimensions/targetRecipes 字段。
- `accuracy` **D3 解耦验收须符号级**:`runRescanUnifiedEvolution`(`knowledge-rescan.ts:381-493`)合法读 checkpoint,与 U1 gap 段(91-170)同文件。判据收窄到 gap/coverage 函数集 0 命中 + 显式豁免该函数。
- ✅ U1#3 旁路保护 deepMining 结构可行(须加"不传 binding→逐字段一致"回归单测)。

**U2**
- `accuracy` U2b 两处误判:常量 dependents 是 **Planner+PlanBuilder**(非 Projectors);`targetRecipes` 被 **recipeStatus 消费**(非死字段)→ 应表述为"threading gap(未串到账本签名)"。其余 U2(两表/隔离)接地良好。

**U3**(leaf)
- `accuracy` **隐藏假绿:rescan 必须把 `fullBriefingRef` 提到顶层 `response.meta`**——`output.ts:362 pickCleanMeta(legacy.meta)` 只读顶层、allowlist 在 :94;cold-start 靠 `attachBriefingTransportMeta`(274/712)显式 lift。rescan 若只写 `data.meta`,ref 被剥→验收拿到 undefined 假绿。须写顶层 meta + `McpCoreToolsCleanOutputContract.test.ts` 加 `alembic_rescan` 分支断言。
- `accuracy` **共享步骤签名漏 `trimColdStartBriefingToBudget`(`cold-start.ts:460`,compact 后最终钳位)**;只保 compact 会让 cold-start 抽取后仍 >18KB。签名增 `trimToBudget?` 回调。
- `minor` 裸文件名歧义:真实文件在 `lib/recipe-generation/host-agent-workflows/`,另有 310B re-export stub 在 `lib/runtime/mcp/host-agent-workflows/`(RG9 兼容**不可改**);落点钉全路径。空项目走 fast-path(`knowledge-rescan.ts:111-119`)不进预算化,验收须用 >18KB 真实项目。
- ✅ U3#6/#7(recipe_map fullMapRef 从未写入、knowledge_entries 无 generationStage 列)核准确。

**U4**(三 blocker)
- 🔴 **B1 LP4 前提失效**:`subscribeToSignals` **有活调用方** `KnowledgeModule.ts:406`,"零订阅/信号汇双断"FALSE。tick 直走 transition 仍对,但理由改为:scanAll 发 decay 信号但**未预建 observing proposal**,`ProposalExecutor.#onSignal` 按 target 查已存在 proposal→落空。**实现前须读 `#onSignal` 确认其要求 target 预存 proposal。**
- 🔴 **B2 真机证伪(→ CG-4,改完成定义)**:authority 单修**不够**。3 条 lastHitAt=null→freshness=0(`DecayDetector.ts:311` `lastHit>0?...:365` 无 cold-start grace)、usage=0→ before≈18(dead),authority-only 修后≈33(**SEVERE 仍误判**),健康新 recipe 首 tick 被 active→decaying。**须加 freshness→createdAt 回落(镜像信号路径 line 179)或 age<NO_USAGE_DAYS(90)豁免。✅ 已确认(CG-4,2026-06-26):U4 scope 含此项,authority 与 freshness 同 commit 修。**
- 🔴 **B3 硬耦合**:`?? 50` 默认(`DecayDetector.ts:325`)必须与 `/100→/5` **同 commit** 改 `?? 2.5`,否则缺 stats.authority 的 recipe 得满 authority(+20 掩盖衰减)。
- `accuracy` **C4** sweep 已 **3 driver**(P3 已接线,`staging-access-sweep.ts:138-155`),decay 是**第 4 driver**,4×cap=200 ops 共享 2s timeout → 预算风险被低估(→ CG-7)。
- `accuracy` **C5(→ CG-5)** LP7 真实路径 `FileChangeHandler.ts:290-322`,该 branch 是 `eventSource==='git-head'`=commit-driven,**与 D3 冲突(commit-driven 维护属 UM,U4 不可碰)**。✅ 已裁定(CG-5,2026-06-26):**LP7 移入 UM**(git-head 是 commit-driven 维护、归 UM;D3 不开例外),U4 不含 LP7。
- `minor` C6 cap 须经 `#loadActiveRecipes`(:250-252)中间层透传;C7 transition 入参须含 `recipeId`,severe/dead 是 DecayScoreResult.level、三者都映射 lifecycle `decaying`;C8 test 改 `AlembicCore/test/unit/DecayDetector.test.ts` + Plugin mirror,**排除 vendor 快照**。

**U5**
- `accuracy` **C1 伪成功真实位置 `ProposalExecutor.ts:373`+`:396-399`**(`'patch skipped, reverted to active'`+markExecuted),非 doc 的 :355-388。merge(`source==='consolidation'`)patch 失败须 `markRejected` 或保持 observing,不 markExecuted;catch 块(405-425)已正确,只 success=false 非抛错路径是 bug。
- `accuracy` **C2 无 'merge' proposal 类型**:`ProposalRecord.type` 仅 `update|deprecate`,merge 提交为 `action:'update'`+`source:'consolidation'`(`RecipeProductionGateway.ts:988-989`)。fork 在 update 臂内按 `proposal.source` 分;`#tryApplyPatch`(:372)硬编码 `patchSource='agent-suggestion'`,merge 须传 `'merge'`(联合 :558 已有);真实接线 `#executeUpdate:340`。
- `accuracy` **C3 supersede [0] 跨两站点**:`RecipeProductionGateway.ts:669/681` + `ProposalExecutor.ts:477/479`;在 Gateway 按 RecipeSimilarity 选最高相似度,executor [0] 自然解析对。
- `minor` C4 `RecipeProductionGateway.ts:955-959` inline mergeDirection 参数也须 additive 扩 `mergePatch?`;C5 LP#1 行号准(阈值 HIGH_OVERLAP=0.65/ENHANCE=0.4 勿动);C6 `FileChangeHandler.ts:573` 是 Plugin 文件不在 Core,引用须 flag UM owner 接活副本。
- ✅ 核心论点(consolidation 路径丢 suggestedChanges→ContentPatcher 早退→伪成功)成立,真机 proposal=0 坐实。

**U6**
- `accuracy` **C1 P4 接线点是 Plugin 函数**:Core `SourceRefReconciler` 无 `reconcileSourceRefs` 方法(公开 `reconcile()`@117/`reconcileRecipeSourceRefs()`@179);`reconcileSourceRefs` 是 Plugin `knowledge-index-rebuild.ts:91-112`,当前不调 `repairRenames`(:422-475)/`applyRepairs`(:482-536)(全仓零 call site)。P4 钉到此 Plugin 函数,reconcile 后 `report.stale>0` 调 repair。
- `accuracy` **C2 P5 报告已存在被 wrapper 吞**:`rebuildLocalKnowledgeIndexes`(`knowledge-index-rebuild.ts:55-66`)已返 `KnowledgeIndexRebuildReport`;async void 是 `knowledge-rescan.ts:233-243 rebuildRescanIndexes` wrapper。改法=wrapper `return await ...`,删"新建报告类型"暗示。
- `accuracy` **C3 P3↔U5 门禁位置**:`hasUsage` 在 `EvolutionPolicy.evaluateUpdate`(`EvolutionPolicy.ts:105-119`),执行期由 ProposalExecutor(:162/:340)调,非 gateway submit。P3 能正常 create pending,proposal 在**执行期**被降级。U5 修对象=EvolutionPolicy+ProposalExecutor 执行路径;验收 #3 断言 proposal 经 executor 后落 update/deprecated 非被降级。
- `minor` C4 P2 content_fp 插点在 `SourceRefReconciler.ts:303-321 #reconcileSourceRef`(非 332-389),`#updateExistingSourceRef`(342-368)加 driftedFp 写回。

**UM**
- 🔴 **B1(→ CG-6,反转上轮 UM#7)**:`evolution_proposals` **无 source_path/change_type 列**(`schema.ts:377`;:411 的 source_path 是 `recipe_source_refs` 另一表),`ProposalRepository.create` 已对 `(targetRecipeId,type,status∈pending/observing)` 去重(`:153/:159 #hasDuplicate`)。加 sourcePath 维度是**放宽非收紧**。→ UM#7 降为"核实+加测试固化现有 dedup,不动 schema";若确需 sourcePath 区分须**显式立项 migration**并论证。✅ 已采纳(CG-6,2026-06-26):**不动 schema,UM#7 = 固化现有 `(recipeId,type,status)` dedup + 加双入口重复测试**;另把 LP7 git-head 闸纳入 UM(CG-5)。
- `accuracy` **C2 Plugin 落点须消歧**:活副本 `lib/recipe-generation/*`(经 `#recipe-generation/*` 别名);`lib/runtime/mcp/host-agent-workflows/{knowledge-rescan,recipe-region-vector}.ts` 无 importer=死副本;`lib/service/evolution/FileChangeHandler.ts`=3 行 shim(活副本 876 行)。任务包钉活副本绝对路径 + 验收 grep 断言。
- `accuracy` **C3 UM#3 非纯改名**:`mainServiceCanHandleProjectScope` 有活分支消费 `PluginOpportunisticEvolution.ts:135`;改名须原子化跨 4 站点(presenter:92 set、knowledge-rescan:430 set、接口:19、活分支:135)。
- `accuracy` **C5 "从未 advance"根因细化**:advance 逻辑本身正确(`GitDiffCheckpointService.ts:152-188` 仅 routeStatus∈{routed,catch-up-routed} 推进),BiliDili HEAD==checkpoint、0 commits since=**合法停滞非 bug**。验收须先制造新 commit,别把"无 commit 停 initialized"误判为坏。
- `minor` C4 EvolutionGateway 构造统一 `KnowledgeModule.ts:347`(doc U6 注 :343 不一致)。
- ✅ UM#1/#2/#4/#6(`#handleCreated`@410/`#routeNewModuleToModuleMining`@456 退役点、抽 runCommitDrivenMaintenance、checkpoint reuse-不改、audit observe-only)核准确。

### B. 优化验收标准(收紧,可执行可证伪;真机用 ALEMBIC_HOME 沙箱、Node≥22)

- **U1**:① Plugin 单测 ≥2 binding(A dims=[x] target=3 / B dims=[y] target=2)经 gate → 同时含 flat `moduleScope` 与 `moduleBindings[]`,逐 binding dimensions 非空、targetRecipes=3/2 精确保留,flat 出口 lease key/attachPlanGenerationGateData **字节不变**。② Core 双路:传 binding→A×x gap=2/B×y gap=0;**不传 binding→与 per-dimension(target=5)逐字段 snapshot 一致**。③ 真机提交 sourceRefs 落 canonical 模块的 recipe→`sqlite3 SELECT moduleName` 非空且==`ModuleSummary.name`,越界留空+诊断,**原 3 条历史空值不回填**。④ D3 符号级:gap/coverage 函数集 `git_diff_checkpoints` 0 命中、豁免 runRescanUnifiedEvolution。
- **U2**:`PRAGMA` 出两表;gap/coverage 路径 grep `git_diff` 零命中;常量 dependents 测 Planner/PlanBuilder、targetRecipes 测 recipeStatus 链。
- **U3**:① grep `briefing-budget` 在 cold-start 与 rescan 两真实文件都 import,cold-start 内联 measure/spill 外壳消失。② **真机零回归**:BiliDili 改前 stash 跑 bootstrap 抓 data 字节+fullBriefingRef+compact 阶梯,改后逐字段 diff 一致(含 trim≤18KB)。③ rescan(deepMining)使 data>18KB→最终 clean `response.meta.fullBriefingRef` **非 null**(顶层不被剥)且指向真实可读 `.asd/tmp/rescan-briefing-*.json`。④ clean-output 契约测加 `alembic_rescan` 分支(误写 data.meta 则红)。
- **U4**:① authority=4+健康→`dimensions.authority===0.8`(非 0.04)、authority=0→0/5→1/**无 key→0.5**。② **cold-start 不误判(修前必红/修后绿)**:构造 BiliDili 同形(lastHitAt=null/createdAt=now/quality=0.85/authority=4)跑 scanAll→level **非** severe/dead 且 **不** transition;**修前真机 level=severe 会被错误 transition**。③ 真机三态对照:before≈18(dead)/authority-only≈33(severe,仍坏)/full(含 grace→0 transition)。④ orphan 消除:grep `get('decayDetector')`≥1+tick scanned>0。⑤ cap→SQL LIMIT(经 #loadActiveRecipes);4-driver durationMs<2000 否则落独立 sweep;transition 幂等(decaying→decaying no-op)。
- **U5**:① **构造 ≥0.65 相似度候选**(BiliDili 3 条无高重叠对)→`SELECT type,source FROM evolution_proposals WHERE source='consolidation'`≥1 行 type=update、`evidence LIKE '%suggestedChanges%'`≥1(baseline=0);先断言相似度过 0.65 再判码。② before≠after:merge 执行后 coreCode/dontClause/whenClause/content/contentHash ≥1 变+contentHash 变+fieldsPatched 非空(byte-identical+success=true 是 fail)。③ 空 mergePatch→status='rejected' 或 observing,**非** executed+'reverted to active'(今 :399 WOULD markExecuted 必改)。④ 门禁分流:`evaluateMerge({fp:0.1})`→pass(usage=0 也过)、`evaluateUpdate({fp:0.1,usage=0})`→仍 fail、`evaluateMerge({fp:0.5})`→fail(复用 FP=0.4)。⑤ destructive 退役:自然语言≥20 字符→skipped+skipReason、content byte-unchanged(今 :194-207 静默覆盖,修前红)。⑥ supersede 选最高相似(createdIds[1] 更相似→replacedByRecipeId 与 deprecated_by 都指 [1])。⑦ **#8 trigger gated on UM**(此前仅单测可验)。
- **U6/UM**:① **UM 真机 advance(最危险,必先证)**:改 BiliDili 被覆盖既有文件 region+commit+触发→`SELECT last_route_status,checkpoint_commit,advanced_at`→从 initialized 变 routed/catch-up-routed+advance+advanced_at 非空+proposals 0→≥1(停 initialized 或 0 proposal=未通)。② 退役不误伤:重跑 advance 仍绿;无覆盖新 .swift+commit→moduleMiningRoutes 空、knowledge_entries 不因 created 增。③ P2:`#sourceContentFingerprint`≠`computeKnowledgeHash` 且互不调;migration 后 `content_fp` 列+11 行回填非空;改 region→drifted+fp 变+verified_at 刷新;改 region 外→保 active;**首轮 null→首填只回填不改 status**。④ P3:dead recipe→`type='deprecate'` proposal>0、`auditSummary.proposalsCreated>0`(替硬编码 0);零 usage 的 update 经 executor 落 update 非降级(**须 U5 先行**)。⑤ P4:git mv 被引用文件+commit+rescan→ref 经 repairRenames→applyRepairs 自动 active+新路径、report renamed/applied>0、幂等(改前先 grep 确认零 call site)。⑥ P5:wrapper return report;provider 不可用→status='skipped'+高可见 warning、可用→semantic_memories 0→非 0。⑦ UM#7:保留则单测断言双入口对同 recipe+type 重复 submit 只落一条;**禁在无 source_path 列时声称按 sourcePath 去重**。⑧ 单一编排:grep `scanOnce/handleFileChanges/recordRouteOutcome` 序列只在抽出的 `runCommitDrivenMaintenance` 一处、落活副本。

### C. 权威推进顺序(DAG + 每阶段门禁 + 共享文件 + 波次)

```
U0 重基线 ─→ ┬ U3(leaf,零改 Core,全程并行)
            ┬ UM 维护闭环(全局排序第1,必先证 advance)
            ┬ U4-Core(decay)   ── U4/U5 共用 ProposalExecutor → 分两 commit、U4 先
            ┴ U5-Core(merge)
   ↓(波1 之后)
   U1-Core(D1/D2 确认后) · U6-Core(UM advance 已证 + U5 门禁分流 landed) · U4-Plugin/U5-Plugin
   ↓
   U1-Plugin · U6-Plugin · U2(依赖 U0+U1)
   ↓
   U7 端到端真机(gated on 全部上游)
```

**每阶段 开工前置 → 交付后置**:
| 阶段 | 开工前置(须先绿) | 交付后置(解锁下游) |
|---|---|---|
| **UM**(排序第1) | CG-6 幂等键方向定;活副本钉死;Core 先于 Plugin | **真 commit 后 last_route_status∈{routed,catch-up-routed}+advance+proposals≥1** → 解锁 U5 真机 / U6 P3·P4 真机 / U7 |
| **U3**(leaf) | Node22+沙箱;先抓 BiliDili bootstrap 基线(无现存单测) | 零回归 diff + rescan 顶层 meta 存活 + 契约扩 rescan 绿(**不解锁下游,全程并行**) |
| **U4-Core** | Core baseline 绿;**CG-4 cold-start gap 裁定**;**CG-5 LP7 vs D3 裁定**;重接地 B1 | commit1(authority /5 + `?? 2.5` + cold-start grace + 0-5 域测)绿 → 解锁 U4-Plugin |
| **U4-Plugin** | U4-Core commit1 landed | `.get('decayDetector')`≥1 + 3 条 full 修后 0 transition → 解锁 U5/UM 真机(健康 recipe 存活) |
| **U5-Core** | Core baseline;**U4/U5 transition 与 executor fork 分两 commit、U4 先** | evaluateMerge+destructive 退役+mergePatch 流通+before≠after → 解锁 **U6 P3**(门禁分流须先行) |
| **U5-Plugin** | U5-Core 注入点暴露 | subscribeToSignals + VectorService 注入 RecipeSimilarity |
| **U1-Core** | U0 完成;**CG-1 方案 A 确认**;**CG-2 D2 默认表 Design 先出** | planBuilder optional moduleBindings + per-cell gap + RPG moduleName canonical 派生两路绿 → 解锁 U1-Plugin |
| **U1-Plugin** | U1-Core landed | gate 出口 moduleBindings additive(flat 字节不变)+ moduleName 真机非空 → 解锁 **U2a** |
| **U6-Core** | UM advance 已证;U5 门禁分流 landed | P2 content_fp 列+回填+drifted 触发 → 解锁 U6 P3 |
| **U6-Plugin** | U6-Core landed;活副本钉死 | P4 rename 接活 + P5 semantic_memories 0→非 0 → 解锁 U7 |
| **U2** | U0+U1 完成,Core 先 ship | 账本给 deepMining 喂 seed |
| **U7** | 全部上游 | 端到端真机 |

**共享文件强约束(必须协调单次落地)**:
1. `FileChangeHandler.ts:410-493`(活副本 876 行):**U1#1 + U2e + UM#1 三方同一处,合并一次落地**,退役须全量 grep 清理 moduleMiningRoutes 消费方(124/143/204-205/680/692/723/736)。
2. `ProposalExecutor.ts` + `EvolutionGateway.ts`:U4(transition)+ U5(executor fork/supersede)+ U6 P3 + UM#7 共用 → **U4 transition 与 U5 fork 分两 Core commit、U4 先**;P3/UM#7 串行标顺序。
3. `knowledge-rescan.ts`(活副本):UM#2(381-446)+ U6 P1(128-187)+ P5(233-268)+ U3(245-268 预算)多点 → 协调提交避 rebase。
4. `SourceRefReconciler.ts`:U6 P2(303-321)+ P6(440 path.resolve)同文件同批提交。
5. `plan-generation-gate.ts:191-306`:U1#1 + U2b additive 顺序协调。
6. `PluginOpportunisticEvolution.ts`:UM#3 改名原子跨 4 站点(:19 接口 + :135 活分支 + presenter:92 + rescan:430)。
7. **跨仓硬序 Core 先 Plugin 后**:所有 Core 段 `npm run check` 绿+commit 后 Plugin 经 `file:../AlembicCore` 接入。

**波次**:波1(并行)U0→{UM(必先证 advance)+U3(leaf)+U4-Core+U5-Core};波2 {U1-Core(CG 确认后)+U6-Core+U4-Plugin/U5-Plugin};波3 {U1-Plugin+U6-Plugin+U2};波4(全串)U7。**强制串**:U4-Core→U5-Core(同 ProposalExecutor)、U5 门禁分流→U6 P3、UM advance→(U5/U6/U7 真机)、U1-Core→U1-Plugin→U2a、FileChangeHandler:410-493 三方合并单次。

## Non-Goals / 协调红线

- **伞形不重做**:晋级器/checkTimeouts/proposal 执行触发器(归 followup)、coldStart 单维产物化/embed 接通(归 productization)、bootstrap 生成链(归 coldstart-repair)、维度选择权(归 plan-no-guess-correction)。
- 伞形**只补**:deepMining 多轮覆盖+moduleMining 分模块语义、evolution 衰减触发器与 OUTCOME 质量、commit-driven 唯一维护触发、rescan 内容级保鲜、跨维+全 stage 真机端到端。
- **门禁全程保留不放松**(recipe-evidence-gate floor≥3、evaluateUpdate/evaluateMerge/evaluateDeprecate、§9.1、transition Guard);U5 是**拆分/纠正被误用的门禁**(merge 不该用 hasUsage),不是放松。
- **D1 方案 B(模块轴下沉 Core)拆独立需求**,本伞形 U1 只走方案 A。
- **intake 前强制 U0 重基线**:在途文档基于 43/131 旧快照,多条已被当前 main+真机推翻,高严重定级须复核下调。

## 待决:须用户/Design 拍板的 Confirmation Gate 项

> **已解(2026-06-26 用户确认)**:① deepMining=多轮覆盖增量(非更深符号);② git-diff 增量生成退役、维护归 evolution;③ 覆盖账本独立持久化(非 plan 持久化);④ `depthLevels` 死契约=退役;⑤ **module 来源=projectContext 基础能力(已在 Core canonical,散落只在消费侧;本伞形走方案 A 接 canonical 轴)**;⑥ **round 阈值=Design 通用默认表 + plan 规模语义(D2)**;⑦ **维护触发=commit-driven 唯一源,保留 `git_diff_checkpoints` 作纯维护游标(D3,不删)**;⑧ **per-binding gap=per-cell(D4)**。

**决策表(2026-06-26 用户全部采纳 Design 建议)**(均为边界/可见行为级;⑤a 的 fallback 结论待本轮 resident 维护路径事实核验确认后回填具体落地):

| # | 决策点 | 选项 | Design 建议 | 影响面 | 用户裁定 |
|---|---|---|---|---|---|
| ① | D1 module 下沉力度 | A 轻(plugin 留 seed 引用 canonical)/ B 彻底下沉(Core 暴露枚举+退役 plugin seed,拆独立需求) | **本伞形 A,B 拆紧随独立需求** | 仓库职责边界/跨仓删除核验/U1 重量 | ✅ 采纳 |
| ②a | U1 moduleName 强制度 | optional 维持 / **required-or-derivable** / 硬 required | **required-or-derivable**(派生优先,派生不出才要 Agent 给或留空+诊断) | submit schema + Gateway 兜底空串 | ✅ 采纳 |
| ②b | U1 历史空 moduleName | 回填 / 不回填(验收豁免) | **不回填**(architecture 级无单一模块归属,回填=造假) | 数据真实性/验收豁免 | ✅ 采纳 |
| ③a | U3 recipe_map 纳入预算 | 纳入 / 不纳入(记 TODO) | **不纳入**(守 coldstart-repair P2 rescan-only 边界) | 跨需求 scope 边界 | ✅ 采纳 |
| ③b | U3 generationStage DB 列 | 本阶段做 / 独立 Core schema 决策 | **本阶段不做**(触持久化红线;响应面已能区分 stage) | 持久化红线/migration | ✅ 采纳 |
| ④a | U5 evaluate() 编排 | **收敛单一** / 维持两入口 | **收敛单一**(信号/兜底共用分流,A6-P7 根因) | 信号 vs 兜底门禁一致性 | ✅ 采纳 |
| ④b | U5 merge 门禁默认 | Design 出保守默认表 / 用户逐值定 | **Design 出表,实现只消费**(有 StructuredPatch+不触全量替换+保留 FP) | D2 默认表 | ✅ 采纳 |
| ⑤a | UM resident defer 关系 | fallback(不停用)/ 停用 resident | **fallback 安全(✅ 代码已核实闭合)**:resident 无活 evolution 实现、非双生产方;保留 defer 改语义为"resident 检索去抖"+改名误导变量;真正护栏=proposal 幂等键(UM#7) | 双生产方风险(实为零) | ✅ 已闭合(代码事实,无需再拍) |
| ⑤b | UM created 未覆盖事件 | 静默丢弃 / **纯计数诊断信号(非生成)** | **诊断信号**(可观测、非生成、不自动触发) | 可观测性 | ✅ 采纳 |
| ⑥a | U6 指纹方案 | **行号截取(偏保守)** / 符号锚点(精确复杂) | **行号起步 + 接受偏移即 update;符号锚点后续增强** | 假漂移率/复杂度 | ✅ 采纳 |
| ⑥b | U6 dead→deprecate 力度 | **进 observation-window** / 立即执行 | **进 observation-window**(废弃=改可见行为,保守) | 废弃可见行为 | ✅ 采纳 |

**影响最大的三处**:① D1 A/B、⑤a resident 关系、⑥a 指纹方案。**⑤a 已由代码事实闭合**(resident 无活 evolution 实现、fallback 安全,见 §UM#3 与风险注)。codex 主仓是否另有 Core 外独立 evolution 进程=out-of-scope(目标宿主 cc-plugin/BiliDili),待真机非阻断。

**第二轮对抗核验新浮出(须用户拍板,改完成定义/边界/schema 语义,不可代码自闭)**:

| # | 决策点 | 选项 | Design 建议 | 影响面 | 用户裁定 |
|---|---|---|---|---|---|
| **CG-4** | U4 cold-start gap(blocker B2) | 仅修 authority(不足) / **authority + freshness→createdAt 回落(或新 recipe 豁免)** | **加 freshness 回落**——authority 单修后 BiliDili 3 条仍判 SEVERE、健康新 recipe 首 tick 被误衰减;不加=U4 形同未修 | 🔴 改 U4 衰减完成定义 | ✅ 采纳 |
| **CG-5** | U4 LP7(git-head 相关性闸)归属 | 留 U4(须 D3 开例外)/ **移入 UM** | **移入 UM**——git-head 是 commit-driven 维护、本就属 UM;保持 D3 边界干净不开例外 | 🟠 改 phase 边界 | ✅ 采纳 |
| **CG-6** | UM#7 幂等键方向(blocker B1) | 立 `evolution_proposals` source_path migration / **降级为"固化现有 `(recipeId,type)` dedup + 加测试,不动 schema"** | **不动 schema**——现有 dedup 已挡双入口重复,加 sourcePath 是放宽非收紧、无真实需求证据;反转上轮 UM#7 | 🟠 改 schema/dedup 语义 | ✅ 采纳 |
| **CG-7** | U4 第 4 driver 2s 预算 | 默认第 4 driver 共享 sweep / 独立 `decay-access-sweep.ts` | **实测驱动**:先接第 4 driver,验收实测 durationMs≥2s 才落独立 sweep(fallback B 已设计)——偏实现期可验,默认无需预拍 | 🟡 运行时预算 | ✅ 实测驱动 |

**全部已闭合(2026-06-26 用户全部采纳)**:CG-4 = U4 scope 加 freshness→createdAt 回落(改完成定义);CG-5 = LP7 git-head 闸移入 UM;CG-6 = UM#7 不动 schema、固化现有 `(recipeId,type)` dedup;CG-7 = 实测驱动。**至此全部 Confirmation Gate 闭合,需求可送总控。**

## 风险

- **UM 最危险**:BiliDili 维护游标线上从未 advance;退役生成前必须先证明 modified/deleted 维护链能推进游标,避免"主循环失败却修周边"。
- U1/U2 改 rescan 的 plan 接线要保持与 coldStart 的 plan 契约一致(A4 集成),避免 bootstrap/rescan 两套不对称扩大;新出口必 additive。
- U4 A5-P7 必须与 A5-P1 同阶段:一修孤儿立即暴露 authority 量纲误判,否则健康新 recipe 被判 dead;decay 信号汇双断,必须 tick 直走 transition。
- U5 伪成功最隐蔽,须以 before≠after 字段实变验收;必须前置 UM,否则 OUTCOME 缺陷无法被观测。
- U3/U4/U6 复用在途机制(transient/cap/embed),排序错位会重复造轮子——严格排在对应在途之后。
- 覆盖账本/decay tick/内容指纹与 `git_diff_checkpoints` 严格隔离,误用会破坏 D3 坐标系并使单游标膨胀。

## 证据与链接

- Grounding:17-agent 全链路测绘 + 对抗核验(49 confirmed,~2.1M tokens)+ **7-agent 全阶段代码级 grounding(U1/U3/U4/U5/U6/UM,~873K tokens,基于 AlembicCore@b557b10 / AlembicPlugin@2748968 现场复核)**;BiliDili 真机 DB 直读。
- 在途需求:[coldstart-chain-repair](alembic-coldstart-chain-repair-2026-06-25.md)、[productization-optimization](alembic-recipe-productization-optimization-2026-06-25.md)、[lifecycle-automation-followup](alembic-lifecycle-automation-followup-2026-06-25.md);平行决策 [plan-no-guess-correction](alembic-recipe-plan-no-guess-correction-2026-06-22.md)。
- BiliDili DB:`~/.asd/workspaces/02a25032/.asd/alembic.db`。
- 关键载重点索引:authority bug `DecayDetector.ts:324-326`(真相 `KnowledgeService.ts:768`);U1 心脏 `plan-generation-gate.ts:498-512`+`NormalizedPlanSelection` 已含 moduleBindings;U5 merge 断口 `RecipeProductionGateway.ts:974-1006`+早退 `ContentPatcher.ts:106-108`;U4 孤儿 `KnowledgeModule.ts:278`+sweep 信封 `staging-access-sweep.ts`;U3 rescan 无预算 `knowledge-rescan.ts:245-268`;D3 隔离 `git_diff_checkpoints` 仅 evolution 维护链读写。
