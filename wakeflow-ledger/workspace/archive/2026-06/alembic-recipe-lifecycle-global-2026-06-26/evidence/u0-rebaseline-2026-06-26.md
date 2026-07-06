# U0 重基线证据 — alembic-recipe-lifecycle-global-2026-06-26

Date: 2026-06-26
Verified-by: controller (3 read-only Explore subagents, advisory; controller synthesized)
Baseline: AlembicCore@**d49fc05** (clean) / AlembicPlugin@**799ceac** (clean) — 与设计文档基线一致
Real DB: `~/.asd/workspaces/02a25032/.asd/alembic.db` (BiliDili, 507KB) — 只读 SELECT/PRAGMA

## 结论：伞形工作真实，前置已落不重做，5 断点仍在，DB 吻合，第二轮节在当前 HEAD 成立

### d49fc05 增量无害
`git diff 62f0b4b..d49fc05` = 仅 `ProposalExecutor.ts`(+46/-6，#inFlight Set + #runWithReentrancyGuard 包裹 4 调用点 + #onSignal/checkAndExecute 跳过 in-flight) + `ProposalExecutorBounding.test.ts`。**伪成功行(:408/:432-435)与所有其它断点未触**。

### 断点（HOLD-AS-BUG，当前 HEAD 实际行号）
| # | 断点 | 当前 file:line | doc 行号(stale 标注) |
|---|---|---|---|
| 1 | DecayDetector authority `/100`(真相 0-5 域) | `AlembicCore/src/service/evolution/DecayDetector.ts:326` `Math.min(1, authorityRaw/100)`；`?? 50`@:325；真相 `KnowledgeService.ts:768 Math.round(score*5)` | doc :324-326 准 |
| 2 | freshness cold-start gap(无 grace) | `DecayDetector.ts:311` `lastHit>0?…:365`→freshness≈0；`NO_USAGE_DAYS=90`@:85；镜像 created_at 回落 :178-188 | doc :311 准 |
| 3 | scanAll 无界 | `DecayDetector.ts:127`(无 cap)；`#loadActiveRecipes`:250-252 无 cap 透传 | doc :127-128 准 |
| 4 | ProposalExecutor 伪成功 | `ProposalExecutor.ts:408`(#tryApplyPatch 'agent-suggestion') + **:432-435**(success=false 仍 markExecuted 'patch skipped, reverted to active')；catch :441-461 正确 | **STALE**：doc :373/:396-399 → 实际 :408/:432-435 |
| 5 | merge 丢 suggestedChanges | `RecipeProductionGateway.ts:974-982`(merge evidence 无 suggestedChanges)；moduleName 派生 :753；supersede `createdIds[0]`:669 | doc :974-1006 准 |
| 5+ | ContentPatcher 早退/破坏式 | `ContentPatcher.ts:108`(No suggestedChanges 早退) + :194-207/:286-289(全量替换) | 准 |
| 5+ | EvolutionPolicy hasUsage 闸 | `EvolutionPolicy.ts:111-122`(hasUsage 必需)；**无 evaluateMerge** | 准 |
| 5+ | content_fp 缺列 | `grep content_fp AlembicCore/src` = 0 命中 | 准 |
| 5+ | repairRenames/applyRepairs 零 call site | `SourceRefReconciler.ts:422`/:482 存在、Core 内零调用；`reconcile()`:117/`reconcileRecipeSourceRefs()`:179；`#reconcileSourceRef`:303；`#resolveSourcePath`:581；裸 path.resolve :440 | C1(P4 接线点在 Plugin `knowledge-index-rebuild.ts:91-112`)准 |

### 前置（LANDED，followup 等已落 → 不重做）
- cap 基建：`KnowledgeRepositoryImpl.findAllByLifecycles`:415-437(+limit)、`ProposalRepository.find`:221-266(+limit+oldestFirst)、`StagingManager.checkAndPromote`:111(+cap)、`LifecycleStateMachine.checkTimeouts`:174(+cap)、`ProposalExecutor.checkAndExecute`:279(+cap)。
- subscribeToSignals：Core `ProposalExecutor.subscribeToSignals`:91 + Plugin 活调用方 `KnowledgeModule.ts:406`(经 ServiceContainer :257) → **B1：非孤儿**。
- staging-access-sweep 3 driver：`staging-access-sweep.ts` checkAndPromote:140 / checkTimeouts:145 / checkAndExecute:152；`resolveStagingAccessSweepCap`:254(默认 50/env/守卫)。
- `Lifecycle.ts:79` active→decaying 合法 + isValidTransition:94 guard；`RecipeSimilarity.ts` WEIGHTS:119 / contentTokenSimilarity:261。

### B1 实证（U4 关键）
`ProposalExecutor.#onSignal`(:124-154)：`findByTarget(recipeId)`(:136) + 过滤 `status==='observing'`(:138-140) → **需预存 observing proposal 才动作**。decay 信号无预建 proposal → 落空。**故 U4 必须 tick 直走 `LifecycleStateMachine.transition`，不依赖信号汇**（设计文档 B1 修正版成立）。

### 活/死副本图谱（任务包钉活副本绝对路径）
LIVE 在 `lib/recipe-generation/*`（经 `#recipe-generation/*` 别名，package.json:36-38）：
- `lib/recipe-generation/host-agent-workflows/`：knowledge-rescan.ts(633)、project-context-analysis.ts(502)、cold-start.ts(1428)、dimension-completion.ts(1382)、knowledge-index-rebuild.ts(112)、recipe-region-vector.ts(658)
- `lib/recipe-generation/`：plan-generation-gate.ts(595)、plan-tool.ts(1725)
- `lib/recipe-generation/evolution/`：FileChangeHandler.ts(**876，活**)、PluginOpportunisticEvolution.ts(357)
- `lib/runtime/mcp/host/opportunistic-evolution-presenter.ts`(205，活；**不在 recipe-generation 下**)
- `lib/shared/transient-transport.ts`(67，存在)
DEAD 3 行 shim（re-export 活副本，勿改）：`lib/runtime/mcp/host-agent-workflows/*`、`lib/service/evolution/FileChangeHandler.ts`。
`briefing-budget.ts` 尚不存在（U3 新建）。

### 行号漂移 / stale 标注
- 伪成功：doc :373/:396-399 → 实际 :408/:432-435。
- EvolutionGateway 构造：doc :343 → 实际 `KnowledgeModule.ts:347`。
- **staging-access-sweep 过时注释**：:137 + docstring :251-252 仍写"P3 本次不接线"，与 :152 活 3-driver 自相矛盾 → U4 落地顺手修（设计文档已列）。

### BiliDili DB（9/9 MATCH）
- knowledge_entries：3 active；authority=4；lastHitAt=null；hits(stats.guardHits/searchHits)=0；quality B/A/A(0.848/0.856/0.860)；createdAt=1782397655(全同)；moduleName 空；category Utility/UI/Service。
- evolution_proposals：0 行；13 列；**无 source_path/change_type**；dedup 相关=target_recipe_id/type/status/source（→ CG-6：现有 dedup 可按 (target_recipe_id,type,status)，无 source_path 列）。
- semantic_memories：0。
- recipe_source_refs：11 行；5 列(recipe_id,source_path,status,new_path,verified_at)；**无 content_fp**。
- git_diff_checkpoints：1 行；last_route_status='initialized'；checkpoint_commit=a3ea6a25…(40 char)；advanced_at=NULL；project_root=`…/AlembicWorkspace/BiliDili`；scope_id='single-folder'；folder_id='root'。
- lifecycle_transition_events：3 行(全 staging→active)。
- source_graph_files/edges/symbols：0。
- coverage_ledger / deep_mining_rounds：不存在（U2 待建）。

**BiliDili 源在 workspace 内**(`…/AlembicWorkspace/BiliDili`)；UM advance 真机验收须 Test 在此造真 commit（"无 commit 停 initialized"是合法停滞非 bug，CG-5/UM C5）。
