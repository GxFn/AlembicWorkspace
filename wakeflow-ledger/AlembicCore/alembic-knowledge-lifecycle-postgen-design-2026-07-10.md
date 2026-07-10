# 知识"生成之后"生命周期:维护与使用的整体构建与落地方案(G-C,2026-07-10)

## 0. 前言与一处自我更正

本文回答"知识入库后如何维护与被正确使用"。触发于 2026-07-10 codex+BiliDili 真实事故(知识陈旧但检索照给),关联成熟度重评的 G-C 条目。

**必须先更正一处错误判断**:成熟度重评文档把 G-C 写成"最大结构性缺口……新鲜度检查止步提交时刻,已入库知识没有任何机制发现自己过期"。**这个说法不准确**——深入代码后确认:一条 commit 驱动的源漂移保鲜链**已经存在并接线**(代号 U6/CG⑥/UM#2)。真实情况不是"没机制",而是"机制造好了但没端到端交付、且检索侧对漂移视而不见"。因此本设计的性质是**审计已建链路 + 补齐断点**,不是从零构建——从零构建会重复造轮子,违反 Core"任何删除/新增都要先确认既有实现"的仓规。

## 1. 生成→维护→使用 全生命周期现状(已建链路,file:line)

### 1.1 生成侧落锚(已接线)
- 挖掘产出 → `knowledge_entries.reasoning.sources`(`AlembicCore schema.ts:72`,JSON string[],格式 `path:start-end`)记录 file:line 锚点。
- 提交门禁 `expandEvidenceRefsForSubmit`(`AlembicAgent submitEvidenceExpansion.ts:48`)对台账条目同区间重哈希,`EVIDENCE_STALE` 拒陈旧证据——但**这是 run 内一次性,采集哈希不落库**(Q2)。
- 桥表 `recipe_source_refs`(`schema.ts:409-422`):`recipeId/sourcePath/status/newPath/verifiedAt/contentFp`;`contentFp`(migration 014)= 源区间内容指纹,带域标签 `alembic:source-region-fp:v1`,与 .md 的 `contentHash` 严格独立。**这是唯一的"证据源持久可复检锚点"**。

### 1.2 维护侧漂移检测(已接线,rescan/tick 触发)
- **内容漂移**:`SourceRefReconciler`(`AlembicCore .../SourceRefReconciler.ts`)读 reasoning.sources → `#sourceContentFingerprint` 按行区间重哈希 → 比对 `contentFp`:文件没了标 `stale`、文件在但区间内容变标 `drifted`、移动标 `renamed`(首轮 null 指纹只回填不改态,CG⑥a)。DI singleton 已注册(`AlembicPlugin KnowledgeModule.ts:265-290`),`reconcile({force:true})` 在 rescan 调(`knowledge-index-rebuild.ts:151`)。
- **commit 漂移**:`GitDiffScanner`(rev-parse/merge-base/diff --name-status)→ `ContentImpactAnalyzer.assessFileImpact` token 命中 → `HostAgentFileChangeHandler`(modified→update proposal `source:'file-change'`;deleted→deprecate;renamed→修引用)→ `ProposalGateway.submit`。双触发:每次 MCP 工具尾 tick-on-access(`opportunistic-evolution-presenter.ts:36`←`HostMcpServer.ts:1029`)+ rescan(`knowledge-rescan.ts:1559`);单一编排 `CommitDrivenMaintenance`。
- **checkpoint**:`git_diff_checkpoints`(`schema.ts:638`,migration 013)记录每 scope 的 route checkpoint commit,从确认 Plan 初始化、route 成功后前进——增量而非重建。
- **消费**:`drifted/stale` 已被 `KnowledgeRescanPlanner`(→update/deprecate proposal,`:254/258`)和 `DecayDetector` 策略3(staleRefCount→decayScore freshness 维度,`DecayDetector.ts:256-264`)双消费。

### 1.3 使用侧(检索)——漂移在此不可见(断点集中区)
- `SearchEngine` 命中后只附 `findActiveByRecipeIds`(status='active')的 sourceRefs、排除 deprecated;**查询时无 fs 复验**;`CoarseRanker` 的 freshness 是 updatedAt 时效(180 天半衰)非源新鲜度。
- `prime` 把 sourceRefs 明标 "verification anchors, not automatically verified facts"(`PrimeKnowledgeMaterial.ts:544`),也无复验。
- 唯一"新鲜度"是项目级 git-HEAD-vs-checkpoint 姿态 `retrievalMayBeStale`(粗粒度,不回答"这条命中的锚点还成不成立")。

## 2. 已验证的断点(设计聚焦这六处,其余勿动)

| # | 断点 | 证据 | 性质 |
|---|---|---|---|
| G-C-1 | **检索把 `drifted` 当 active 返回** | `SearchRepoAdapter.ts:153` / `RecipeSourceRefRepository.ts:269` 都是 `status != 'stale'`——drifted 漏过 | 漂移检测到了却对消费者不可见(最高价值、最接近 bug) |
| G-C-2 | **search 输出丢弃 sourceRefs** | `projectKnowledgeItem`(`search.ts:1796`)不含 sourceRefs/sourceFile;prime 保留、search 不保留 | 下游想自校验都拿不到锚点(不对称) |
| G-C-3 | 提交侧无持久哈希锚点 | Q2:采集哈希不落库,靠事后 reconcile 补建 contentFp | 生成与维护之间有真空窗(提交后、首次 reconcile 前无锚) |
| G-C-4 | 无"读指定 commit 版本文件内容"封装 | Q6:全仓只有 rev-parse/merge-base/name-status,无 `git show <commit>:<path>` | 阻碍"漂移前后内容对比"类精确判定 |
| G-C-5 | decayScore/usage 统计未回写 | Q3(F-B 已知):`hitsLast90d/lastHitAt` 无写方→恒 0→deprecate 侧见默认基线常驳回 | 削弱漂移→淘汰的生效(检测到但淘汰不掉) |
| G-C-6 | staging 复核期与源新鲜度无关、复核队列孤儿 | Q4:纯 `staging_deadline` 时间制;`listReviewQueue/recordReview` 无调用方 | 人工复核看不到"这条的源漂了" |

## 3. 整体构建:生成后生命周期的三段闭环

设计哲学延续系统既有立场(确定性标记 + 概率性消解 + 人工终裁,对齐 G-C 哲学与 staging observe-first):**漂移是确定性事实(哈希比对),不自动删除知识,只让漂移在维护与使用两端都可见,由 proposal/人工消解。**

### 段一|生成后即落锚(补 G-C-3)
提交门禁通过、写 `reasoning.sources` 的同时,把当时的区间指纹**同步写入 `recipe_source_refs.contentFp`**(复用 `computeSourceRegionFingerprint`,与提交侧同一区间口径)。消除"提交后到首次 reconcile 前无锚"的真空窗——之后任何 reconcile 都有基准可比。**纯增量、不改检索、不改门禁语义。**

### 段二|维护时精确传播(补 G-C-4,收紧既有链)
- 新增 `git show <commit>:<path>` 封装(Core git 层),让 `SourceRefReconciler`/`GitDiffScanner` 能在"文件在但内容变"时对比**漂移前后**的区间内容,把 `drifted` 细分为"锚点仍指向语义相关代码(行号漂移,可自动修 range)"vs"锚点指向的代码已实质改变(需重挖)"——前者自动修 sourceRefs 行号(类比既有 renamed 修复),后者才升 proposal。降低误报、减少人工负担。
- 段二**不新增触发时机**(既有 tick+rescan 已够);只提高判定精度。

### 段三|使用时透出(补 G-C-1/G-C-2,最高价值)
- 检索过滤从 `!= stale` 收紧为"active 优先";`drifted` **不排除但降权并打标**(对齐 decaying 的"降级消费"语义,不是删除)——命中里带 `sourceStatus: 'drifted'` 与漂移锚点。
- search 输出**保留 sourceRefs+sourceStatus**(与 prime 对称),让宿主 Agent 拿到"这条知识引用的 foo.ts:120-135 已漂移"从而自行判断是否采信/去读新代码。这正是业界 Copilot Memory "just-in-time verification" 的检索面对应物——把"是否仍成立"的最终判断交给使用现场,但先给出确定性的漂移信号。

### 段四(登记非本设计目标)|淘汰生效 + 人工复核透源
- G-C-5(decayScore/usage 回写)属既有 F-B/进化环残留,独立修;本设计只登记依赖关系(漂移检测到但淘汰不掉时,段三的"降权透出"是兜底)。
- G-C-6(复核队列透源)依赖 staging 复核队列读面(Core/Agent/主体 HTTP 三面),与 P2-2 critic 的复核队列注记同宿,建议合并到那条线做。

## 4. 落地分期(每期含触点 + 验证 + 完成定义)

**P1|使用侧透出(段三)—— ✅ 已实现(Core 8ab433b + Plugin b32a8e5)**
- 触点:`RecipeSourceRefRepository.findActiveByRecipeIds`(放开 drifted 并带 status)、`SearchEngine.ts:1078-1119`(附 status)、`search.ts:1796 projectKnowledgeItem`(输出保留 sourceRefs+sourceStatus)、`AlembicSearchOutput` schema 加字段、排序层 drifted 降权。
- 验证:单测(drifted 命中被返回且带标记、active 优先序)、E2E(reconcile 标 drifted → 检索命中带 sourceStatus)。
- 完成定义:检索命中能透出逐条 drifted 信号且不误删;search/prime 锚点输出对称。
- **决策项**:✅ 用户已确认实施。落地:Core `_supplementDetails` 携带 per-ref 状态→聚合 `driftedSourceRefs`+item 级 `sourceRefStatus`;`_applyRanking` drifted×0.85 降权;Plugin `projectKnowledgeItem` 输出保留 sourceRefs+sourceStatus+driftedSourceRefs(与 prime 对称)。更正一处既有过宽不变量(禁 search 输出含 `sourceRefs`→改为只禁 prime 材料对象)。**实施中发现**:桥表 `findActiveByRecipeIds` 早已带 status 且已含 drifted(G-C-2 桥表侧其实通了),断点纯在 SearchEngine 把非 stale 锚点塌成扁平 `string[]` 丢弃 status——比设计预想更集中;`AlembicSearchOutput.items` 是 `z.record` 松散透传,无需改 schema。

**P2|生成后落锚(段一)—— ✅ 已收口(Core 19ae7f6),但性质是"补测试锁定"而非"实现"**
- **实施中发现 G-C-3 被高估**:`#insertSourceRef`(SourceRefReconciler.ts:478)首建源锚时**已立即算 region 指纹作基线**,且 submit 后 `refreshCreatedRecipeFreshness`→`reconcileRecipeSourceRefs` **同步**跑——真空窗只是 gateway.create 到该刷新之间的毫秒级、期间无代码变更。锚在提交时即落,不是"靠事后 reconcile 补"。
- 真实缺口=**该不变量无回归护栏**。补:新建 recipe(无既有行,走 insert 路径)reconcile 后 contentFp=提交态指纹;反证改文件后才判 drifted(真空窗可证已闭)。
- 完成定义:达成(不变量锁定,未来重构不能静默重开真空窗)。

**P3|漂移精判 + git show 封装(段二)—— ✅ 已实现(Core 19ae7f6,observe-first)**
- 触点:`shared/gitBlob.readFileAtCommit`(git show 安全封装)+ `service/knowledge/driftClassifier.classifyRegionDrift`(纯函数,line-shift/content-change/unresolved)+ SourceRefReconciler 可选注入 gitReader+baselineCommit。
- **纪律偏差(有意)**:设计原写"行号漂移自动修 range"。实施采 **observe-first**:drifted 精判只记进 report(driftLineShift/driftContentChange)+日志,**不自动改 status/sourceRefs**。理由:①自动改承重锚点跨切(reasoning.sources 需同步)且有风险;②baselineCommit-for-contentFp 无精确追踪(当前用调用方传入的基线),先在真实 run 里验证分类准确率再谈自动修——对齐系统"确定性标记+概率性消解+人工终裁"哲学。**自动修 range 明确列为后续项(P3-b)**。
- 验证:classifier 四态 + git 封装真临时仓 + reconciler observe-only 计数;缺 gitReader/baselineCommit 时行为字节不变。
- 完成定义:分类能力就位可被维护环消费;误报下降的实证依赖真实 run(未来接入 commit 驱动路径的 baseline 时点亮)。

**P3-b(登记,后续)|自动修 range**:分类在真实 run 验证准确后,line-shift 自动修 sourceRefs 行号(类比 renamed 修复),同步更新 reasoning.sources。需先有 P3 分类的真实准确率数据。**生产接线已完成(Plugin 5c7728b)**:DI 注入 gitReader=readFileAtCommit,rescan reconcile 从本 scope durable checkpoint 取 baselineCommit(rebuild 先于 checkpoint 推进,读到的即漂移前 commit)——下次真实 rescan 起 driftLineShift/driftContentChange 开始积累。**复审补强(Core d0bbbd4)**:baselineCommit 从实例态改参数链(DI 单例+MCP 并发竞态)。

**P4(登记)|G-C-5 淘汰生效 + G-C-6 复核透源**:独立需求,不在本设计实施范围。

## 5. 非目标 · 决策 · 风险

- **非目标**:不重建已有 SourceRefReconciler/GitDiffScanner/CommitDrivenMaintenance;不引入 daemon 定时(既有 tick-on-access + rescan 触发保留);不自动删除任何漂移知识(只标记+降权+proposal)。
- **决策项**:P1 改 search 可见输出(需用户确认);drifted 的默认检索处置(降权透出 vs 也可选完全排除——建议降权,因为漂移≠错误,可能只是行号动了)。
- **风险**:检索附加 sourceRefs 增大载荷——用既有 20KB 内联预算/transient 机制兜底;drifted 判定读文件有 IO——只在 reconcile(非检索热路径)做,检索只读预存 status,不引入热路径 fs(与事故教训一致:检索路径绝不 fs/正则重活)。

## 6. 与既有工作的关系
- 事故修复(Core 581be5e / Plugin 6d34806)是本设计的**前置**:readCurrentGitHead 5s 超时、事件循环看门狗让 commit 驱动维护链在病态输入下不再挂死——G-C 的维护段依赖它安全运行。
- 成熟度重评文档的 G-C 条目按本文更正(见 §0)。
- G-C-6 与挖掘质量升级 P2-2 critic 的 staging 复核队列注记同宿,建议合并。
