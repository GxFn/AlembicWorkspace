# 任务包 波3 · u2-core — deepMining 覆盖账本（U2 Core 侧 producer）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（live `../AlembicCore`，禁碰 vendor）
- U2=deepMining 改「多轮覆盖增量扫」+ 覆盖账本（核心改写）。**红线（最易踩）**：覆盖账本是**覆盖状态持久化、不是 plan 持久化**——plan 仍每轮无状态 draft→confirm。本卡=U2 的 **Core 侧 producer**（U2a 表/repo/buildCoverageLedger + U2b-core gap/intent + U2d-core Advisor）；U2c/U2e/draft/写点/attach 归 **u2-plugin**（Core 先出 Plugin 后接）。
- Baseline: AlembicCore@**27ef04b**。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U2（135-165，尤 U2a 139-143 / U2b 145-148 / U2d 153-156 / 跨仓 163 / 验收 164）**。先读全 §U2。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U2）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Core 侧；落地前复核 HEAD file:line）
### U2a 覆盖账本（新一等产物）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| a1 migration | **⚠️ 014 已被 u6-core(content_fp) 占用→用下一可用号（≥015）** `migrations/0NN_coverage_ledger.ts`（按文件名自动发现） | **add** | 新表 `coverage_ledger`：`UNIQUE(project_root, module_id, dimension_id)`，列 covered/total_candidate_count、grade(empty/thin/partial/covered)、exhausted+exhausted_reason+exhausted_source('agent-declared')、covered_source_refs(JSON)、uncovered_hints(JSON)、value_score、last_round、deferred、时间戳。**同迁移** `deep_mining_rounds`(round_index/started_at/completed_at/new_recipes_this_round/trigger_actor)。**刻意不含 plan/session 字段（红线）。** |
| a2 schema | drizzle `schema.ts:633`（仿 `gitDiffCheckpoints` 追加） | **add** | 两表 drizzle 定义。 |
| a3 repository | 新 `CoverageLedgerRepository`（复刻 `GitDiffCheckpointRepository:60-170` upsert/onConflictDoUpdate/listByProjectRoot/#mapRow，键改 module×dimension + listByModule），注册 `repositories.ts:207/242` | **add** | |
| a4 buildCoverageLedger | 扩 `CompletenessCritic.ts:176` **只加聚合层、不改单候选** | **extend** | 新 `buildCoverageLedger`（跨维候选+coveredPaths→per-(module×dimension) cell，**module 归属用 D1 canonical `ModuleSummary` + sourceRefs 路径前缀** `pathsOverlap:639`）。**必须保持 `shouldBlockCompletion:false`/`targetGate:'advisory'`(:136-137)，grade 阈值严禁当生产/阻断门（门禁不放松红线）**；exhausted 标 `agent-declared`(:550 依赖 noPadding+reason)。聚合函数**不得硬编码宿主路径**（project_root 由调用方提供）。 |

### U2b gap-builder + intent（Core 部分）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| b1 intent 类型 | `KnowledgeRescanIntent.ts:42`（仅 dimensionIds）+ `KnowledgeRescanWorkflowIntent`（`knowledge-rescan.ts:136-143` 若该类型在 Core 则本卡，若 Plugin 归 u2-plugin——复核归属） | **extend** | 加 `perDimensionTargets/moduleDimensionTargets`（激活死字段 `moduleBindings.targetRecipes`）。 |
| b2 gap 消费 | `KnowledgeRescanPlanBuilder.ts:73-134` | **extend** | 消费 Agent 目标（perDimensionTarget/perBindingTargets）；existingCount **优先读账本**、无账本回退现算 `buildCoverageByDimension`。 |
| b3 常量降级 | `KnowledgeRescanPlanBuilder.ts:6` `TARGET_RECIPES_PER_DIMENSION=5` | **keep-as-fallback** | 保留仅作 fallback（注意 `RescanEvidenceProjectors.ts:204/211` 也依赖），deepMining 正常路径不再被 5 锁死。 |

### U2d CoverageLedgerAdvisor（Core 纯函数）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| d1 Advisor | 新 `AlembicCore/.../host-agent/CoverageLedgerAdvisor.ts`（纯函数读账本） | **add** | 三类停止：①收敛=无 blank/thin 格或全 exhausted-with-reason；②收益递减=`new_recipes_this_round < K`；③轮次上限=`last_round ≥ maxRounds`；输出 highValueBlankCount + 价值排序缺口 +「还有 N 个高价值空白，建议再扫一轮」。**K/maxRounds 由 D2 通用默认表 + plan 规模语义给**（读 D2 `Design/docs/current/alembic-recipe-d2-default-table-2026-06-26.md`）。信号源=`CompletenessCritic` 瞬态 status/neededToTarget/hints(:531-554) 落库为持久评级，Advisor 只读账本。 |

## 验收（设计 §U2 验收；Core 侧自验，真机多轮→U7）
1. **migration + 两表**[unit]：用**下一可用号**（非 014）；`coverage_ledger`(UNIQUE module×dimension) + `deep_mining_rounds` 列齐、**无 plan/session 字段**；幂等。
2. **repository**[unit]：upsert/onConflictDoUpdate（键 module×dimension）/listByProjectRoot/listByModule，复刻 GitDiffCheckpointRepository 语义。
3. **buildCoverageLedger**[unit]：跨维候选+coveredPaths→per-cell grade；module 归属 canonical ModuleSummary 路径前缀；**advisory 不阻断（shouldBlockCompletion:false/targetGate:'advisory' 保持）、grade 非门**；exhausted=agent-declared；不硬编码宿主路径。
4. **gap 消费 Agent 目标**[unit]：perDimensionTarget/perBindingTargets 真实驱动 gap（非硬 5）；existingCount 优先账本、无账本回退 buildCoverageByDimension；TARGET_RECIPES_PER_DIMENSION 仅 fallback。
5. **Advisor 三停止**[unit]：收敛/收益递减(<K)/轮次上限(≥maxRounds) 各命中；highValueBlankCount + 价值排序；K/maxRounds 来自 D2。
6. **D3**[grep]：账本/Advisor/gap 链零 `git_diff_checkpoints` 读写。
7. **门禁**：Node≥22 build:check + 定向 unit + additive（不破 exports/排序/状态机/持久化）+ build 重生 dist（供 u2-plugin）。

## 跨仓与提交纪律
- 改 live `../AlembicCore`（禁 vendor）；**分阶段提交**（migration / repository / buildCoverageLedger / gap / Advisor 可分）；main 不 push/tag/bump；build 重生 dist。**Core landed+dist → 解锁 u2-plugin**（draft SEED/写点/attach/coldStart defer/FileChangeHandler 切除 U2e）。

## 禁止
- 账本含 plan/session 字段（红线）；grade/exhausted 当生产或阻断门（advisory 红线，门禁不放松）；读写 git_diff_checkpoints（D3）；硬编码宿主路径；改 CompletenessCritic 单候选逻辑（只加聚合层）；用 migration 014（已占用）；碰 vendor；做 u2-plugin 部分（U2c/U2e/draft/写点/attach）。

## 回填（TargetResultEnvelope）
完成范围、**各 commit hash + 实际 migration 号**、build:check/unit 输出、两表无 plan 字段、repository 语义、buildCoverageLedger advisory 保持、gap 消费 Agent 目标（非硬 5）、Advisor 三停止+D2 K/maxRounds、D3 grep。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
