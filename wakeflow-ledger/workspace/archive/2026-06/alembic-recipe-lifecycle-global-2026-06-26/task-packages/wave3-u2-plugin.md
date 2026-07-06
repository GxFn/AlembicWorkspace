# 任务包 波3 · u2-plugin — deepMining 多轮覆盖（U2 消费侧，伞形最后实现任务）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core，禁改 Core）
- 前置：**u2-core 已接受+落地+dist 重生**（Core@74387b2：coverage_ledger/deep_mining_rounds 表 + CoverageLedgerRepository + buildCoverageLedger(扩 CompletenessCritic) + CoverageLedgerAdvisor 三停止 + intent perDimensionTargets/moduleDimensionTargets + KnowledgeRescanPlanBuilder 消费 Agent 目标)。本卡=把账本接成 deepMining 多轮覆盖循环。
- Baseline: AlembicPlugin@**d5c0eb5**（u3 后）。消费 Core@**74387b2 或更新**。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U2（U2a 写点 143 / U2b draft 145-148 / U2c 150-151 / U2d attach 153-156 / U2e 158-161 / 验收 164）** + D2 表（perRoundCellBudget S50/M60/L80）。先读全 §U2。
- ⚠️ **多文件 wiring 量大——可 subagent-offload**（fresh-context subagent 承载、主窗口 own 独立核验+提交+全门禁，勿中途耗尽）。

## 红线（最易踩，全程守）
1. **plan 仍每轮无状态 draft→confirm**——账本是覆盖状态持久化、**不是 plan 持久化**；draft 每轮重新 load 账本，不持久化 plan。
2. **advisory 非自动调度**——「还有 N 空白，建议再扫一轮」是建议，**由用户/宿主决定是否再发**，**不自动后台扫**。
3. **no-guess**——Plugin 给 options+信号（gapCandidates/existingCount/rating/deficit），**Agent confirm 决策补哪格+预算**，Plugin 不替 Agent 定维度/规模。
4. **D3**——账本写/读链**绝不读写 git_diff_checkpoints**；evolution proposal 路径不读写覆盖账本。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U2 + tr-u2-core.json 的 Core 接口 + lifecycle-followup/um-impl 归档）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Plugin 消费侧；落地前复核 HEAD file:line）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| U2a 写点 | `dimension-completion.ts:1183 buildCompletionCompletenessCritic` | **wire** | dim 完成→调 Core buildCoverageLedger→CoverageLedgerRepository upsert（本格更新）；`project_root` 由 Plugin 提供、canonical ModuleSummary ownedPaths 喂 module 归属。 |
| U2b draft SEED | `plan-tool.ts:208-217,259-276`(draftPlan)+`:278-341`(buildDraftConfirmNextAction) | **extend** | draftPlan 读 `args.generationStage`：deepMining 时 `buildPlanDraftContext` 加载账本产 `gapCandidates`（空白/单薄格+计数/评级/建议补数）、附 existingCount/rating/deficit；coldStart 保持从零。buildDraftConfirmNextAction generationStage **不再硬编码 coldStart**。**D2 perRoundCellBudget(S50/M60/L80) 限单轮 cell 数**。 |
| U2b 链路 | intent 透传 + `plan-generation-gate.ts:191-306` | **wire** | Agent confirm 的 per-cell 目标→`perDimensionTargets/moduleDimensionTargets`→gate 聚合 `perDimensionTarget/perBindingTargets`（**不改 totalRecipeBudget 语义**）→Core buildKnowledgeRescanPlan。 |
| U2c coldStart defer | `plan-tool.ts:1283-1331 buildConfirmedPlanIntent` | **extend** | coldStart confirm Agent 决本轮扫哪些、其余 defer（no-guess）；coldStart 后首写账本：扫过的格写 grade，**defer 的格写空行 `grade=empty,deferred=1`**（非不建行，否则 deepMining「空白格」语义不明）。写点复用 U2a。 |
| U2d attach | `knowledge-rescan.ts:243-271 buildRescanResponse` | **wire** | 调 Core CoverageLedgerAdvisor（三停止+highValueBlankCount+价值排序+建议）→attach 进 response+status；**advisory 不阻断**；`rescanId`(`mcp-tools.ts:1089`)作幂等键；round 边界=plan-confirm 到该次全部 dimension_complete 回流（写 deep_mining_rounds）。 |
| U2e git-diff 生成退役 | `FileChangeHandler.ts`（case 'created' :194/410-493、defaultModuleMiningAnalyzer :169/705-718、moduleMiningRoutes 分支 :124,143,680,692,723,736、attachRescanUnifiedEvolution :448-474） | **remove** | 退役 git-diff **增量生成**杂质（moduleMiningRoutes/gitDiffEvidence），留 pendingProposals。**⚠️ 先复核 um-impl 是否已部分切**（created→moduleMining 退役可能 0fa2ac3 已做）；**moduleMiningRoutes 死字段全量 grep 清理消费方避免 undefined 访问**。与 U1#1/UM#1 同处—不重复已切部分。 |

## 验收（设计 §U2 验收）
1. **coldStart 产账本（含 defer 格）**[unit]：coldStart confirm 后账本有 grade 行 + defer 格 `grade=empty,deferred=1`。
2. **deepMining 多轮喂账本**[unit]：第 2..N 轮 draft 由账本产 gapCandidates、只补空白/单薄格、价值排序；per-round cell 受 D2 cap。
3. **Agent per-cell 目标真实驱动**[unit]：confirm 的 per-cell 目标经 intent→gate→Core 驱动 gap（**非硬 5**）。
4. **评级建议 + 停止**[unit]：Advisor「还有 N 空白」；收敛/收益递减/轮次上限**不无限扫**；**advisory 不阻断、不自动后台**。
5. **git-diff 生成退役**[grep]：moduleMiningRoutes/gitDiffEvidence 生成杂质清理、无 undefined 访问；维护(UM)保留。
6. **plan 无状态**[核]：draft 每轮重 load 账本、不持久化 plan。
7. **门禁**：Node≥22 build:check（记消费 Core commit）+ 全量 unit failed-set 与 baseline d5c0eb5 无新增 + lint:repo-boundary/core-import/agent-extraction 不新增违规 + **D3 grep（账本链零 git_diff_checkpoints）**。

## 跨仓与提交纪律
- 改本仓 live 源；禁改 Core/vendor；仅经 `@alembic/core` 消费 repository/Advisor/buildCoverageLedger/intent。提交 main 不 push/tag/bump。回填记消费 Core commit。
- **本卡完成 → U2 跨仓闭合 → 解锁 U7（末波真机 gates demand 完成）**。

## 禁止
- plan 持久化（draft→confirm 每轮无状态）；自动后台扫/把建议当自动调度；Plugin 替 Agent 定维度/规模（no-guess）；账本读写 git_diff_checkpoints（D3）；改 Core/vendor；moduleMiningRoutes 退役留 undefined 访问（全量 grep）；重复 um-impl 已切部分。

## 回填（TargetResultEnvelope）
完成范围、commit hash、消费 Core commit、build:check/lint/unit 输出、coldStart 产账本+defer 格、deepMining 多轮喂账本+D2 cap、Agent per-cell 目标驱动（非硬5）、Advisor 建议+三停止、git-diff 生成退役 grep（含 um-impl 重叠核实）、plan 无状态核、D3 grep、零新回归 diff、subagent-offload 说明。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
