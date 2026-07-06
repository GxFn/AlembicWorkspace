# Recipe 生命周期伞形 — 真实验证 + 残留修复 follow-up(交 codex)— 需求设计(strict)

Date: 2026-06-26
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-recipe-lifecycle-realverify-residual-followup-2026-06-26
Scope: AlembicCore + AlembicPlugin（+ codex host-agent 真机执行）
Grounding: 伞形 [[alembic-recipe-lifecycle-global]] COMPLETE+ARCHIVED 完成记录 + Design 独立 spot-check（commit/migration/真 DB 直读）

## 触发与定位

伞形需求 `alembic-recipe-lifecycle-global-2026-06-26` 已被总控 **COMPLETE + ARCHIVED(rev 83)**:U1-UM 代码全闭合、Node22 独立核验接受、最终基线 **Core@74387b2 / Plugin@8a44368(本地 main 未 push)**。但完成定义留了两块**真实未达**:① U7 顶层真机 e2e 只到「**验证基础达成**」(option 1,忠实副本沙箱证 anti-fabrication 门禁 + evolution advance,**真 BiliDili 工作区未触碰**),全维 recipe 填充 deferred 为运营 follow-up;② **8 个携带观察项**(残留)。本需求=**真实验证(在真 BiliDili 上真跑出有价值 recipe)+ 残留修复**,交 **codex host-agent** 执行真机生成。

## 1. 验收审计结论(Design 独立 spot-check,非橡皮图章)

> ⚠️ **深度逐阶段「设计 vs 落地代码」审计(6-agent 对抗)见 §8(authoritative)**——本节是概览,§8 含 3 HIGH 真跑前必修断点 + RF-1~13 裁定 + 真测执行指导 + 完成定义对照。§3/§4 的 RV/RF 以 §8 为准。

**✅ 代码真闭合、真落 main(spot-check 实证)**:
- 基线 commit 在 main:`Core@74387b2`(Reword U2 ledger comments)、`Plugin@8a44368`(Wire coverage ledger into deepMining multi-round loop)。
- 头部 landing 真在代码:`migrations/015_coverage_ledger.ts`(U2)、`EvolutionPolicy/ProposalExecutor.evaluateMerge`(U5)、`migrations/014_recipe_source_refs_content_fp.ts`+`RecipeSourceRefRepository`+`SourceRefReconciler`+drizzle schema(U6 content_fp)、`diffParser`+`ContentImpactAnalyzer`+`FileChangeHandler`(UM committed→propose)。
- 总控接受=真核验(Node22、门禁不放松、Core 先 Plugin 后、改 live 不碰 vendor、忠实副本真机证 checkpoint a3ea6a25→dd85d01 + proposal 0→1)。**结论:实现层可信,非橡皮图章。**

**❌ 真实项目上从未端到端真跑过(最关键 gap,spot-check 实证)**:
- 真 BiliDili DB(`~/.asd/workspaces/02a25032/.asd/alembic.db`)**仍是基线**:`knowledge_entries=3`、`evolution_proposals=0`、`semantic_memories=0`,且 **`coverage_ledger`/`deep_mining_rounds` 表在真 DB 不存在**(migration 014/015 从未在真工作区执行,验证全在忠实副本沙箱)。
- 即:全维 coldStart 生成、deepMining 多轮覆盖填账本、moduleMining per-cell、evolution 在真实提交上维护、semantic_memories(Ollama)——**在真实 BiliDili 上 0 次真实产出**。「验证基础达成」证的是机制接线对,**不是「真能在真项目上产出有价值的 recipe」**。

**❌ 8 个携带观察项(残留,部分总控明列「→Design/→Core」)**:见 §4。

**审计一句话**:伞形**机制实现可信且已落 main**,但**「真实价值」未在真项目上验证**(真 DB 未被新代码触碰)+ 8 残留。本 follow-up 补这两块。

## 2. 用户目标 + 完成定义

**目标**:在真实 BiliDili 上把整条生命周期真跑通、产出真实有价值的 recipe(anti-fabrication 门禁真拦、覆盖账本真填、evolution 真维护、semantic_memories 真落),并修掉 8 残留;由 codex host-agent 驱动真机生成。

**可核完成定义**:
1. **RV-1 真机 migration 落地**:真 BiliDili DB 出现 `coverage_ledger`+`deep_mining_rounds` 表(新 schema 在真工作区生效)。
2. **RV-2 全维 coldStart 真产出**:真 DB `knowledge_entries` 从 3 增长到全维代表性集,每条经 anti-fabrication 门禁(quality/evidence/v3-schema 真拦不达标)、moduleName 非空取自 canonical、按 stage 归属。
3. **RV-3 deepMining 多轮覆盖真填账本**:`coverage_ledger` 随轮 grade empty/thin→partial/covered、`deep_mining_rounds` ≥2 行、Advisor 三停止真生效(不无限扫)。
4. **RV-4 evolution 真维护**:真 BiliDili 一次真实 commit 后 checkpoint advance、`evolution_proposals` 0→≥1(committed→propose)、merge OUTCOME before≠after 真改 recipe、衰减分级真迁移。
5. **RV-5 semantic_memories 真落**:本地 Ollama 接通→`semantic_memories` 非 0(否则明确 skip 记录原因)。
6. **RF 残留全闭**:8 观察项各有结论(修复/Design 重设计/记录)。
7. **真机证据**:每项带真 DB 直读 / 运行 JSON / commit hash,不接受忠实副本替代(本需求的本职就是真工作区)。

## 3. Phase RV — 真实验证(codex host-agent 驱动,真 BiliDili)

> codex host-agent 是真机生成的执行环境(交互式会话,无 AI creds 时按 host-agent 自撰 planSelection;semantic_memories 需本地 Ollama)。**保护真 `~/.asd`**:RV 在真工作区跑会改真 DB——须先确认用户授权改真 02a25032,或在隔离 ALEMBIC_HOME 沙箱跑「真生成」(非忠实只读副本)。

- **RV 链路(参照 [[alembic-bilidili-commit-maintenance-e2e-recipe]] + U7 coldStart 生成管线)**:
  1. `alembic_plan` draft→confirm(host-agent 自撰 planSelection,全维 dimensions + scale)→
  2. `alembic_bootstrap{rebuild:true}`(守卫已有知识,归档 .asd/.trash,出 executionPlan+session)→
  3. per-dim `alembic_submit_knowledge`(严格 bootstrap production floor:imperative doClause+✅/❌、line refs+coreCode 逐字配源、v3 全字段、中文≤20 title)→`alembic_dimension_complete`→
  4. deepMining 多轮:`alembic_rescan(deepMining)` 读 coverage_ledger gap→补空白/单薄格→Advisor 判停→
  5. moduleMining:`alembic_rescan(moduleMining, moduleScope)` per-cell→
  6. evolution:真 BiliDili 改一个被覆盖源文件 + commit→触发 `COMMIT_DRIVEN_TRIGGER_TOOLS`→checkpoint advance + committed→propose→
  7. (可选)Ollama 接通核 semantic_memories。
- **anti-fabrication 真拦验收**:故意提交未达 quality/evidence/v3-schema 的 recipe→被门禁拒(非放行);达标 recipe 落库。**这是「真有价值」的核心证据**。
- **验收口径**:全程真 DB 直读(RV-1~5 的具体 SQL),对比基线(3/0/0/无表)→证真实增长 + 机制在真项目生效。

## 4. Phase RF — 残留修复(8 携带观察项,分类路由)

| # | 残留观察 | 已知信息 | 路由 / 结论 |
|---|---|---|---|
| RF-1 | **U2a pathsOverlap suffix-segment 过报 gap** | 覆盖账本 module 归属用 `pathsOverlap` 路径前缀,suffix-segment 误匹配→**过报 gap(安全方向:多报非漏报)** | **→Core follow-up**(codex 在 Core 修 pathsOverlap 为精确 segment 边界;安全有界,非阻断) |
| RF-2 | **F-B decayScore 量纲 → deprecate-execute 不可达** | followup 残留:decayScore 规范化丢弃→deprecate 执行不可达(decayScore→deprecate 路径死) | **→Design 重设计**(非简单 codex 修;量纲/路径需 Design 出调整方案,product window 不猜) |
| RF-3 | **deep_mining_rounds 无 rescanId** | 多轮账本行缺 rescanId 关联→轮次与具体 rescan run 无法对账 | codex 修:`deep_mining_rounds` 加 rescanId 写入(对账可追溯) |
| RF-4 | **N1 触发工具回 isError:true** | commit-driven 触发工具(10 个 trigger tool)回 `isError:true`(输出 schema 'Unrecognized key data' from data.unifiedEvolution)但维护照常落库 | codex 修:trigger 工具输出 schema 对齐(isError 假阳,以 DB 为准是 workaround,须修真) |
| RF-5 | **Strategy B moduleMiningRoutes 字段彻底删** | U2e 退役 git-diff 生成后,`moduleMiningRoutes` 死字段须全量 grep 清理消费方彻底删 | codex 修:全 grep 清理 moduleMiningRoutes 消费方(124/143/204-205/680/692/723/736 等),避免 undefined 死字段 |
| RF-6 | **rescan 超预算无 compact 内联瘦身** | U3 预算化:rescan 超预算只 spill 到 fullBriefingRef,缺 compact 内联瘦身阶梯(cold-start 有) | codex 修:rescan 接 compact 回调(对齐 cold-start trimToBudget),超预算先瘦身再 spill |
| RF-7 | **recipe-map fullMapRef 从未写入** | recipe_map 声明 `meta.fullMapRef` 但从未 writeTransientTransport(U3 decision 项,当时不默认做) | codex 评估+修:recipe_map 大输出接 transient-transport 写 fullMapRef(或确认保留不做+记录) |
| RF-8 | **P1+D2 cap 激活** | productization P1 晋级 + D2 阈值 cap 的激活/默认值确认(观察项,语义待 codex 核) | codex 核:确认 cap 激活路径 + 默认值,缺则补激活 |

**分类**:RF-2(F-B)**→Design 重设计**(不交 codex 直修);RF-1**→Core**(pathsOverlap,codex 可在 Core 改但属 Core 域);RF-3~8 codex 直修(Core/Plugin scoped)。

## 5. 交给 codex 的执行模型

- **codex host-agent = RV 真机生成执行环境**(交互式会话驱动 plan→bootstrap→submit→rescan→evolution,host-agent 自撰 planSelection,本地 Ollama 出 semantic_memories)。RF 代码修复 codex 也可在 Core/Plugin 仓做。
- **总控编排**:本需求 deliver→总控 intake→把 RV(真机生成核验)+ RF(代码修复)拆任务包;**RV 须先确认改真工作区授权 vs 隔离真生成沙箱**(保护真 02a25032);RF-2(F-B)单独走 Design 重设计不入 codex 直修包。
- **基线**:Core@74387b2 / Plugin@8a44368(伞形最终基线,本地未 push;codex 在其上改)。**push/发版仍用户逐次授权**(伞形已是本地 main 未 push 状态)。

## 6. 范围:拥有 / 不拥有
**拥有**:真 BiliDili 端到端真实生成验证(RV-1~5)+ 8 残留闭环(RF,RF-2 转 Design)+ anti-fabrication 真拦证据。
**不拥有**:不重做伞形已闭合的机制实现(U1-UM 代码已落 main,本需求只「真跑 + 修残」);不重设计 F-B 的量纲(那是 Design 重设计输入,本需求只路由)。ledger git-commit/push、产品 push/发版仍用户门。

## 7. 待决 + 风险
**待决 Confirmation Gate**:
- **CG-1 真机授权**:RV 跑真工作区改真 02a25032 DB,还是隔离 ALEMBIC_HOME 沙箱跑「真生成」(非忠实只读副本)?(改真 DB 须用户明确授权,保护真 `~/.asd`。)
- **CG-2 Ollama 形态**:semantic_memories 真落需本地 Ollama(qwen3-embedding);本轮接通跑还是记 skip?
- **CG-3 RF-7 recipe-map fullMapRef**:纳入修(接 transient)还是确认保留不做(记录)?
- **CG-4 RF-2(F-B)Design 重设计**:本需求只路由,还是同时给 Design 出量纲调整草案?

**风险**:
- **真机改真 DB 不可逆**:RV 在真 02a25032 跑会改真知识库——须沙箱或授权,误跑污染真 BiliDili 知识。
- **anti-fabrication 假阴/假阳**:门禁真拦是核心证据,须故意喂不达标 recipe 验真拦(非只跑达标的)。
- **Ollama 缺失**:无本地 Ollama→semantic_memories skip,RV-5 须明确记录非静默。
- **RF-2 非 codex 可修**:F-B 量纲是 Design 重设计,误交 codex 直改会绕过 Design 决策(违 redesign 路由)。
- **忠实副本 vs 真生成**:伞形已证忠实只读副本;本需求本职是「真生成」,须用能真写的环境(沙箱真生成 or 授权真工作区),不可再退回只读副本。

## 8. 实现审计(设计 vs 真实落地代码)+ 真测执行指导(authoritative,6-agent 对抗审计 2026-06-26)

> 审计基线 AlembicCore@74387b2 / AlembicPlugin@b967814(8a44368 + 1 CI 修复 commit,不动实现)。每条 file:line 直读核实。真 BiliDili DB(02a25032)直读=基线(3 active moduleName 全空/decayScore NULL/authority=4/lastHitAt NULL、0 proposal、0 semantic_memory、coverage_ledger·deep_mining_rounds 表不存在、recipe_source_refs 无 content_fp、checkpoint initialized@a3ea6a25)。**一句话:机制实现可信(U4 最忠实、U5 伪成功真修),但有 3 HIGH「真跑前必修」断点,不修则真 BiliDili 覆盖/保鲜/维护产不出或产错;整链从未在真工作区跑过。**

### 8.1 真跑前必修门(排序,HIGH)
1. **【必修#1】U2-a/RF-9 模块归属 under-match(错误,HIGH)**:`CompletenessCritic.ts:639 pathsOverlap=left===right‖endsWith('/'+...)` + 生产侧 `dimension-completion.ts:648 ownedPaths:[module.path]`(喂**目录**路径如 `src/auth`)。实测 `pathsOverlap('src/auth/login.ts','src/auth')=false`→**文件永不归入其目录模块→每个 cell 恒 empty/thin→grade 永不前进→Advisor 收敛条件永不满足→deepMining 永报「还有空白」即使已良好覆盖**。被两仓单测用全文件路径触 `===` 共同遮蔽。**修**:moduleOwns 引入目录前缀匹配(`cand===owned‖cand.startsWith(owned+'/')`)或写点喂真实 ownedFiles 文件清单。
2. **【必修#2】U3-a/RF-11 rescan fullBriefingRef 未提顶层(错误+未完成,HIGH)**:`knowledge-rescan.ts:316` 仅 `attachFullBriefingRef(data,...)`(写 `data.meta`),无 cold-start 的 `cold-start.ts:273 attachBriefingTransportMeta`(提顶层 `response.meta`);`output.ts pickCleanMeta` 只读顶层 + data.meta 被白名单剔→**`response.meta.fullBriefingRef` 恒 undefined=设计预警的「隐藏假绿」成真**。+ `McpCoreToolsCleanOutputContract.test.ts:134` 只测 bootstrap 无 rescan 分支→0 覆盖 CI 全绿。**修**:rescan 加 `attachBriefingTransportMeta` + 契约测加 rescan 分支(误写 data.meta 则红)。
3. **【必修#3】U6-a/RF-10 P3 drifted→update 断路(未完成,HIGH)**:`KnowledgeRescanPlanner.ts:240` 只 `verdict==='dead'→deprecate`,**无 `action:'update'` 分支**;`findDrifted()`(`RecipeSourceRefRepository.ts:102`)**零 call site=死代码**;`getStaleCountsByRecipe:211` 把 drifted 当 active(ratio 不降永评不到 dead)。→**改被覆盖文件 region 内容→标 drifted 但不产 update、不更新 .md,U6 核心「保鲜」零产出**。**修**:实现 drifted→`action:'update'`、接通 findDrifted、getStaleCountsByRecipe 计入 drifted。
4. **【必修#4 条件】U5-a/RF-12 维护 prose suggestedChanges(未完成,HIGH)**:`FileChangeHandler.ts:489,497 suggestedChanges:input.reason`(prose)与 U5 退役破坏性 fallback 后契约冲突→**commit-driven 维护 update proposal patch 零内容**(prose 不可应用)。若真测⑤要验「commit→维护产内容 patch」则必修;否则真跑时验证关注。**修**:FileChangeHandler 发 StructuredPatch 非 prose。

### 8.2 其它 finding(MED/LOW,可真跑后修 / 真跑时验证关注)
- **U1-a(未完成 HIGH 但单测层证)**:`cellPlans`(U1 per-cell 心脏)`KnowledgeRescanPlanBuilder.ts:131/258/281` 产出但 **Plugin 零消费方**→runtime 实际走 per-dimension(同维多 binding MAX 塌平),per-cell 预算生成层空转。
- **U1-d(MED 前置闸)**:真机 moduleName 派生依赖 `ModuleSummary.ref.scope.filePath`(`ModuleService.ts:301`);BiliDili 模块若缺 ref→`resolveModuleFromSourceRefs` 恒 undefined→新 recipe moduleName 仍空。**真测前先核 ProjectMap.modules 是否带 path**。
- **U1-b(偏差)**:`canonicalModuleNameFromBinding` 用私有 path-segment 派生不查 ProjectMap(D1 点名要收口的 moduleNameFromPath);不污染 recipe moduleName(独立路径)但与覆盖轴不同源。
- **U5-b(错误 MED)**:supersede-deprecate 复用 update 的 decay gate 但未享 hasUsage 豁免,叠加 RF-2 decayScore=50 双重卡死→supersede 边永不经 proposal 执行。
- **U5-c(未完成 MED)**:contentHash DB 列 patch 时从不更新→「内容是否变」须直读内容文本列勿信 contentHash。
- **U4-b(未完成 MED)**:Plugin 镜像 `DecayDetector.test.ts` 仍旧 0-100 域=假绿(C8 跨仓镜像承诺未兑现);运行时不受影响(Plugin 消费已修 Core)。
- **U4-c / vendor 陈旧**:`vendor/AlembicCore` 仍含未修 decay bug(发布期刷,本地走 live 无影响)。
- **U2-d/U2-e/U3-d**:migration 编号 015(非设计 014)/Advisor 文案「还有 0 空白」/recipe_map fullMapRef 不纳入——皆 LOW 无功能影响。

### 8.3 已忠实落地(核实通过,**本需求不重做**)
- **U4 最忠实**:authority `/100→/5`+`??50→??2.5`(`DecayDetector.ts:356-361`)、freshness cold-start grace(`:342` lastHitAt=null→created_at)、tick 经注入 lifecycle 直走 transition、Plugin 第 4 driver 接进 sweep。
- **U5 substantially landed 非空壳**:`ConsolidationAdvisor.#buildMergePatch:687` 产真 StructuredPatch、`evaluateMerge:131` 删 hasUsage 保 FP 护栏、`ProposalExecutor:470 markRejected('no applicable merge patch')`(退役伪成功)、embedding conduit 接通 3 Core 调用点 + 真 VectorService。
- **U6 检测半边 + UM 维护闭环**:content_fp 指纹独立于 computeKnowledgeHash、CG-6a 首填只回填不改 status、P4 repairRenames 接活、UM#3 改名原子、CG-6 dedup 不动 schema、**committed→propose 非 XOR**、单一 runCommitDrivenMaintenance 编排。

### 8.4 携带观察项 RF-1~13 裁定(替代 §4 表)
| RF | 裁定 | sev | 路由 |
|---|---|---|---|
| RF-1 pathsOverlap 过报 gap | CONFIRMED(窄,真风险是 under-match 非过报) | LOW | 并入必修#1 |
| RF-2 decayScore 量纲→deprecate 不可达 | CONFIRMED(根因 `Stats.ts:116 toJSON` 白名单丢 decayScore,`ProposalExecutor:685 ??50` 恒 reject) | HIGH | **→Design 重设计** |
| RF-3 deep_mining_rounds 无 rescanId | CONFIRMED(注释已认折中) | MED | codex |
| RF-4 N1 触发工具 isError | CONFIRMED(9/10 工具 surface 被剥,但 attach 前已落库不阻断维护) | MED | codex(以 DB 为准 + 修 schema) |
| RF-5 moduleMiningRoutes 未删 | CONFIRMED(良性恒空 null-safe 字段) | LOW | codex(可彻底删) |
| RF-6 rescan 无 compact 瘦身 | CONFIRMED(设计内,放大 U3-a) | MED | codex(并必修#2) |
| RF-7 recipe-map fullMapRef | CONFIRMED(已决不纳入) | LOW | 记录/可选 |
| RF-8 P1+D2 cap 激活 | CONFIRMED **已落地无缺陷** | — | 闭 |
| **RF-9(NEW)** dimension-completion 喂目录路径(U2-a 生产侧根因) | NEW | HIGH | 必修#1 |
| **RF-10(NEW)** P3 drifted→update 整分支缺 + findDrifted 死代码 | NEW | HIGH | 必修#3 |
| **RF-11(NEW)** rescan ref 写 data.meta 非顶层 + 注释错误假设 | NEW | HIGH | 必修#2 |
| **RF-12(NEW)** 维护 prose suggestedChanges 不可应用 | NEW | MED→HIGH(条件) | 必修#4 |
| **RF-13(NEW)** supersede 复用 update decay gate 未享豁免 | NEW | MED | codex(待 RF-2) |

### 8.5 真 BiliDili 真测执行指导(CG-1 已定:直接真 02a25032 真跑、重建无虑)
> 建议先 `cp` 一份 DB 备份以便对比基线/回滚。基线见 §8 顶。
1. **migration 落真 DB**:对真 BiliDili 跑一次 `alembic_rescan`(任意 stage)触发 migration。**验**:`SELECT name FROM sqlite_master WHERE name IN('coverage_ledger','deep_mining_rounds')`=2 行;`PRAGMA table_info(recipe_source_refs)` 出 content_fp;`SELECT count(*),count(content_fp) FROM recipe_source_refs`=11/11(CG-6a 首填非空 status 仍 active)。**盯**:表/列未出现=migration 自动发现链断。
2. **plan→全维 coldStart→anti-fabrication 真拦**:`alembic_plan`(draft→confirm)→`alembic_bootstrap{rebuild:true}`(归档已有 3 recipe)→逐维 submit_knowledge→dimension_complete。**故意喂一条不达标 recipe**(无 line refs/coreCode 不配源/title 超 20 中文字)。**验**:不达标 recipe **必须被拒**(production floor)。**盯**:不达标落库=门禁失守(最高红线)。
3. **deepMining 多轮填账本 + Advisor 判停**:多轮 `alembic_rescan{deepMining}` 至 Advisor shouldStop。**验**:`SELECT module_id,dimension_id,grade,covered_count FROM coverage_ledger`;`SELECT round_index,new_recipes_this_round FROM deep_mining_rounds`。**盯必修#1(U2-a)**:若**所有行 grade 恒 empty/thin、covered_count=0**(即使提交了引用模块内文件的 recipe)、`uncovered_hints` 全是目录路径=under-match 铁证;`coverageAdvisory.stopReason` 恒 'round-cap' 而非 'converged'(已覆盖却)=收敛永不触发。**盯 RF-3**:连发两次同 rescanId→deep_mining_rounds 出两行=不幂等。
4. **moduleMining per-cell + moduleName 非空**:前置闸先核 `ProjectMap.modules` 是否带 ref.scope.filePath(U1-d)。`alembic_rescan{moduleMining,moduleScope}`。**验**:`SELECT id,moduleName FROM knowledge_entries WHERE id NOT IN(<原3>)` 期望 moduleName 非空==canonical 名;原 3 条不回填。**盯 U1-a/U1-d**:moduleName 仍空=ProjectMap 无 path;per-cell 预算空转须单测层证(cellPlans 零消费)。
5. **真 commit→evolution committed→propose + checkpoint advance + merge before≠after**:改一个被覆盖文件 region + commit→触发 `alembic_work`/`alembic_code_guard`。**验**:`SELECT last_route_status,substr(checkpoint_commit,1,8),advanced_at FROM git_diff_checkpoints`=initialized→routed+新 HEAD+advanced_at 非空;`SELECT count(*) FROM evolution_proposals`=0→≥1;`SELECT type,source,status,substr(evidence,1,40) FROM evolution_proposals`。**盯 RF-4**:即使 `alembic_work` 回 isError,DB 维护仍应正确(以 DB 为准)。**盯必修#3(U6-a)**:改 region **内容**(不改文件名/行数)→recipe_source_refs 出 drifted≥1 但 evolution_proposals **无 update 行**(=证伪保鲜闭环)。**盯必修#4(U5-a)**:file-change update proposal 的 evidence.suggestedChanges 是 prose(非 `{` JSON)、target recipe 内容字节**不变**。**盯 U5 merge**:构造 ≥0.65 相似候选→consolidation→snapshot coreCode BEFORE→执行后 ≥1 字段字节变+status='executed';**直读内容文本列勿信 contentHash**(U5-c)。
6. **Ollama→semantic_memories**:启本地 Ollama(qwen3-embedding)→重跑 submit/dimension_complete。**验**:`SELECT count(*) FROM semantic_memories`=0→非 0。**盯**:无 Ollama→纯 Jaccard、semantic_memories=0 是 conduit 正确休眠(预期非失败)。

### 8.6 完成定义对照最终目标(真跑能否达成)
| 最终目标 | 真跑达成? | 缺口 |
|---|---|---|
| 全维真产出 | 部分(链路+门禁忠实;全维填充需交互式 host-agent 会话) | 真测②验门禁真拦 |
| **多轮覆盖 deepMining** | **否(U2-a 阻断)** | **必修#1** 后才能区分「已覆盖」vs「需再扫」 |
| 分模块 moduleMining | 部分(canonical 名路径通,per-cell 心脏空转) | U1-a(单测证)、U1-d 前置核 ProjectMap |
| evolution 维护 | 部分(committed→propose/checkpoint/U5 merge 真修;file-change 产 prose 不可应用、supersede 卡死) | 必修#4 条件、U5-b/RF-2 |
| **内容保鲜 content_fp** | **否(U6-a 断路:检测半边通修复半边断)** | **必修#3** |
| semantic_memories | 条件(conduit 真通,需 Ollama) | 真测⑥ Ollama |
| **门禁不放松** | **达成且须守**(production floor/FP 护栏/coverage advisory 不当生产门) | 真测②③主动喂不达标证伪;**所有修复不得以放松门禁为代价** |

> **不可让渡约束**:本需求所有修复(必修#1~4 + RF)**一律不得放松 anti-fabrication/质量地板**。U2-a 修模块归属、U3-a 修 ref 提升、U6-a 接 drifted→update,都是「让真闭环真通」,不是降门槛放行劣质 recipe。

## 证据与链接
- 伞形完成记录:[[alembic-recipe-lifecycle-global]] COMPLETE+ARCHIVED rev 83;归档 `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-lifecycle-global-2026-06-26/`。
- 实现审计:6-agent 对抗审计(~778K tokens,@Core 74387b2/Plugin b967814,见 §8);真 DB 02a25032 直读基线。
- 真机 e2e recipe:[[alembic-bilidili-commit-maintenance-e2e-recipe]]、[[alembic-lifecycle-proposal-e2e-recipe]]、[[alembic-runtime-acceptance-recipe]]。
- spot-check:Core 74387b2/Plugin 8a44368 在 main;`migrations/{014,015}` 在;真 DB 02a25032 仍基线(3/0/0/无 coverage_ledger 表)。
- 残留来源:伞形完成记录「携带观察项」+ followup F-B。
