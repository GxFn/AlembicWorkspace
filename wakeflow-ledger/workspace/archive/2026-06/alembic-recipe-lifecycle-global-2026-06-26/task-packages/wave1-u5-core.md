# 任务包 波1 · U5-Core — evolution 合并/执行 OUTCOME 质量（Core 侧）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（`@alembic/core` 内核，改 live，dist 不提交）
- Wave: 波1；**强制串：本任务是 U4-Core 之后同窗口第 2 个 Core commit（U4-Core dde34d4 已 landed+accept；与 U5 共用 ProposalExecutor/EvolutionGateway，U4 先已满足）**。U5-Core landed 后**解锁 U6 P3（门禁分流须先行）**。
- Baseline: AlembicCore@**dde34d4**（U4-Core 后）。行号引自设计 U5 + 第二轮 A 修正；**落地前对当前 HEAD 复核**（U4 已使部分行号位移）。

## 身份门（先做）
确认当前目录=AlembicCore、任务分配给 AlembicCore。读 `../CLAUDE.md` + active index + state root（含本包 + `evidence/u0-rebaseline-2026-06-26.md`）+ 本仓 `CLAUDE.md`。

## 核心断点（第二轮已坐实，U0 复核仍在）
consolidation/merge 路径**无 suggestedChanges 生产方**：`RecipeProductionGateway.#createProposalFromAdvice` 的 merge 分支 evidence 只塞 title/category/reason/mergeDirection → merge 提案走 `ContentPatcher` `No suggestedChanges` 早退 → `ProposalExecutor` 据 success=false 退回 active 但仍 markExecuted = **伪成功**（状态机跑完、内容零变化）。修=把"标签"升级为"可应用补丁" + 门禁按合并语义分流 + 退伪成功 + 退破坏式替换。

## 范围 + 落地点（全 Core，全 additive，禁破坏 exports/排序/状态机/持久化）
| # | file:line（设计值，复核当前 HEAD） | change | 怎么改 |
|---|---|---|---|
| 1 | `ConsolidationAdvisor.ts:614-655,220-264`(`#computeMergeDirection`) | extend | 算 addedDimensions 同时把候选字段真实值组装 `StructuredPatch`(`PatchChange[]`：coreCode→replace 仅当目标空/短、dontClause/whenClause→replace/append、新 doClause 词→content append)，挂 `ConsolidationAdvice.mergePatch?:StructuredPatch`。判定逻辑已存在、只把标签升级为补丁。**不放宽相似度阈值**(HIGH_OVERLAP=0.65/ENHANCE=0.4 勿动)。 |
| 2 | `RecipeProductionGateway.ts:974-1006`（+ inline mergeDirection 参数 :955-959） | extend | merge 分支 evidence 追加 `advice.mergePatch` 为 `suggestedChanges`(`JSON.stringify`) + 保留候选 coreCode/clauses 原值。inline 参数也 additive 扩 `mergePatch?`。 |
| 3 | `EvolutionPolicy.ts:104-123` + `ProposalExecutor` 执行路径(`#executeUpdate` 真实接线，U0/d49fc05 见 :340；复核当前行) | add | 新增 `EvolutionPolicy.evaluateMerge(metrics/patchPresence)`：merge/consolidation **不要求 hasUsage**（新并入内容无使用历史），改校验"有 StructuredPatch + 非破坏 + FP 仍护栏"。ProposalExecutor 按 `proposal.source`(无 'merge' type，merge=action:'update'+source:'consolidation') 在 update 臂分流：aging→`evaluateUpdate`、source==='consolidation'→`evaluateMerge`。`#tryApplyPatch` merge 传 `patchSource='merge'`。**门禁不放松**——换被误用的 hasUsage 为合并语义正确条件，保留 FP 护栏。`ProposalRecord.source` EvolutionGateway 已写、executor 只读（不加 migration）。 |
| 4 | `ProposalExecutor` 伪成功（U0 实测 d49fc05 在 `:408`+`:432-435`，dde34d4 后行号位移，**复核当前 HEAD 的 `patchResult.success===false` 且非抛错路径**） | fix | success=false 且 type=merge 时**不再静默 markExecuted+revert active**，改 `markRejected('no applicable patch')` 或保留 observing 待 `#tryUpgradeExistingProposal`，落 lifecycle event "内容未变更"。区分"真正 no-op valid" vs "应有补丁却空转"。catch 块已正确，仅改 success=false 非抛错路径。 |
| 5 | `ContentPatcher.ts:194-207,254-257,286-289` | retire | 删"文本≥20→content.markdown 全量 replace"破坏式降级，改 `#skipResult('unstructured patch, requires StructuredPatch')` 不写库；append 路径加去重/段落边界保护。 |
| 6 | `RecipeSimilarity.ts:261-283,119-125` | extend | 新增**可选** `embeddingSim` 维度（**注入算好的向量/相似度**，domain 不发起 embed 保纯度），与 `contentTokenSimilarity` 取 max/加权；embedding 不可用回退 Jaccard（确定性下限，`computeDimensions` 同入同出）。WEIGHTS 增配但无 embedding 数值不退化。 |
| 7 | `RecipeProductionGateway.ts:658-690`(supersede，:669/:681) + `ProposalExecutor`(:477/:479 复核) | extend | supersede `replacedByRecipeId` 从 `createdIds[0]` 改为按与被替代 Recipe 相似度/覆盖最高的新建项选定（复用 RecipeSimilarity）；`deprecated_by` 边同源选定。 |
| 8 | `ProposalExecutor` 信号 `#evaluateOnSignal` vs 兜底 `#processExpiredProposal` | add | **收敛到同一 evaluate/分流函数**（merge→evaluateMerge、aging→evaluateUpdate、deprecate→evaluateDeprecate），避免两入口门禁分叉（CG ④a 已决=收敛单一）。 |

## 验收（B 节 U5 中 Core-unit 可证伪部分；真机端到端 #1/#8 gated on UM landed → 后续 Test/U7）
1. **门禁分流**[unit]：`evaluateMerge({fp:0.1})`→pass（usage=0 也过）；`evaluateUpdate({fp:0.1,usage=0})`→仍 fail；`evaluateMerge({fp:0.5})`→fail（复用 FP=0.4）。
2. **mergePatch 组装**[unit]：高重叠候选 → `ConsolidationAdvice.mergePatch` 非空 StructuredPatch；RecipeProductionGateway evidence 含 `suggestedChanges`（非空）。
3. **退伪成功**[unit]：空 mergePatch → status='rejected' 或 observing，**非** executed+'reverted to active'。
4. **破坏式替换退场**[unit]：自然语言≥20 字符 → skipped+skipReason、content byte-unchanged。
5. **embedding 可用+回退**[unit]：VectorService 注入时近义改写相似度高于纯 Jaccard；不可用回退 Jaccard、`computeDimensions` 确定、现有单测仍通过。
6. **supersede 选定**[unit]：≥2 新建 supersede 1 旧 → `replacedByRecipeId` 与 `deprecated_by` 指相似度最高者（非 createdIds[0]）。
7. **信号 vs 兜底一致**[unit/grep]：两入口共用同一 evaluate/分流。
8. **门禁**：Node≥22 `npm run build:check` + `npm run test`（新增 evaluateMerge/mergePatch/ContentPatcher-skip/supersede/embeddingSim 单测 + 全量无回归）+ `npm run lint` 绿 + `npm run build`（重生 dist 供 U5-Plugin 消费）。
> 真机 OUTCOME（构造 ≥0.65 相似候选 → proposal source=consolidation + evidence LIKE %suggestedChanges% + before≠after 字段实变 + supersede 真机）**依赖 UM 维护链 advance 打通**（已绿基线，但真实 proposal 流要 UM landed），故归后续 Test/U7，不在本 Core-unit 验收。

## 跨仓与提交纪律
- 全 Core、additive；Plugin 消费方（KnowledgeModule subscribeToSignals 已接线、embedding 注入 VectorService 到 RecipeSimilarity 调用点）= U5-Plugin（波2，后续）。
- 提交 main（无分支）；分阶段提交（本任务=U4-Core 之后第 2 Core commit）；**不 push/tag/bump**；不碰 vendor。

## 禁止
- 不放松门禁（evaluateMerge 是**纠正被误用的 hasUsage**为合并语义正确条件，保留 FP/破坏式补丁护栏，非放松）；不破坏 exports/排序/状态机/持久化；不发起 embed（注入算好向量）；不动 staging/DecayDetector(U4 已 landed)；不重引 daemon。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/test/lint/build 输出摘要、各 [unit] 验收点测试名+结果、grep（信号兜底收敛、supersede 选定）、伪成功修复前后对比说明。**evidenceRefs 用 path-like 裸路径**（如 `AlembicCore/src/service/evolution/ProposalExecutor.ts`）。完整性自检；证不足→blocked/needs-review。
