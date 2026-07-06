# 任务包 波4 · U7 — 全维+全 stage+evolution 真机端到端闭环（顶层完成定义，Test 窗口）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Test**（真机端到端验收；非产品窗口，不改产品码）
- **全部上游已 landed+accept**：U1（per-cell gap+moduleName 全 3 站点）/U2（覆盖账本多轮：Core 74387b2 + Plugin 8a44368）/U3（输出预算化）/U4（decay 全链）/U5（evolution OUTCOME+embedding 全 3 站点）/U6（content_fp 保鲜+audit+rename）/UM（commit-driven 唯一维护触发）。**Plugin@8a44368 / Core@74387b2**。
- 真机基线（设计直读 DB，本卡须先复核仍成立）：BiliDili workspace `02a25032` 仅 3 active architecture recipe / 3 transition events / **0 proposal / 0 semantic_memory / 0 source_graph** / git checkpoint `a3ea6a25`==HEAD status=initialized——**整条生命周期从未在 BiliDili 跑过全维+全 stage+evolution**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U7（314-317）+ demand 验收（53-79）+ 真机基线（14）**。

## 要回答的确切问题
post-全上游-landed（Plugin@8a44368/Core@74387b2），真机 BiliDili 上：**整条 Recipe 生命周期——全 14 维 coldStart → deepMining 多轮覆盖增量 → moduleMining 分模块 → evolution 触发/执行——能否一轮端到端跑通，各 stage 产可核 DB 证据，semantic_memories 非 0，checkpoint advance？**

## 方法（沿用忠实副本法，严格保护真机）
复用既有副本构建法（git clone BiliDili@a3ea6a25 + better-sqlite3 `.backup()` 真实 workspace DB → 副本，**仅改 `git_diff_checkpoints.project_root`** 指向副本 sandbox；`recipe_source_refs.source_path` 是相对路径不改）→ sandbox `ALEMBIC_HOME`。**全程保护真实 `~/.asd` 02a25032 + 真实 BiliDili a3ea6a25（只读、复核未变）**。Plugin@8a44368/Core@74387b2（node22 build:check 绿 + dist 重生后驱动 stdio MCP）。

## 步骤 + 验收（真机 DB ground truth；每 stage 前后 SELECT）
1. **coldStart 全 14 维**：plan(coldStart)→confirm(Agent 决扫维度+defer)→bootstrap→submit per dim。断言 **(a)** knowledge_entries 按维度/模块归属增长（非只 1 维即停——基线缺陷=14 维只跑 1 维）；**(b)** coverage_ledger 产账本：扫过格 grade、**defer 格 grade=empty/deferred=1**（U2c）；**(c)** A8-P6 coldStart 强完成=覆盖维度 dimension_complete。
2. **deepMining 多轮覆盖增量**：第 2..N 轮 plan(deepMining) 由账本喂 gapCandidates（只补空白/单薄、价值排序、D2 perRoundCellBudget 限单轮）→confirm per-cell 目标→submit。断言 **(a)** deep_mining_rounds 多行（round_index 递增、new_recipes_this_round 真实）；**(b)** Agent per-cell 目标驱动（非硬 5）；**(c)** CoverageLedgerAdvisor 建议「还有 N 空白」+ **停止条件生效（收敛/收益递减<K/轮次上限≥maxRounds）不无限扫**；**(d)** advisory 不阻断、plan 每轮无状态、不自动后台。
3. **moduleMining 分模块**：moduleMining stage 按模块产 knowledge_entries（模块归属可核）。
4. **evolution 触发/执行**：**(a)** UM commit-driven：改 BiliDili 覆盖文件+commit+触发 → git_diff_checkpoints advance(initialized→routed/catch-up-routed + checkpoint a3ea6a25→新 + advanced_at)+evolution_proposals 0→≥1（UM 已证基线）；**(b)** U5 OUTCOME：构造高相似候选→merge proposal(evidence LIKE '%suggestedChanges%' 非空)/supersede 选最相似；**(c)** U6 content_fp drift：改覆盖文件 region→reconcile drifted；**(d)** decay→deprecate（U4，若可触发）。
5. **semantic_memories 非 0**（A8-P7）：rescan/rebuild 产区域向量→semantic_memories 0→非 0（U6-Plugin P5）；provider 不可用→skipped+warning（记录）。
6. **embedding>Jaccard 端到端**（U5）：一对近义改写经 RedundancyAnalyzer 相似度高于纯 Jaccard（若 vector 可用）。

## 成功 / 失败 / 停止
- **成功**=全 14 维 coldStart + deepMining 多轮 + moduleMining + evolution 触发/执行各 stage 产可核 DB 证据 + semantic_memories 非 0 + checkpoint advance + 多轮停止条件生效不无限扫。→ **整条生命周期真机端到端跑通，伞形 demand 完成定义达成。**
- **失败/blocked**=任一 stage 未产预期 DB 证据（如 14 维仍只跑 1 维、deepMining 不多轮/无限扫、proposal 仍 0、semantic_memories 仍 0、checkpoint 不 advance）→ 返回 blocked + **该 stage 前后 DB SELECT + 触发输入 + commit hash + 哪个能力（plan/coverage/advisor/UM/U5/U6/U4/向量）+ 哪侧（Core/Plugin）**，不改产品码。控制器据此路由修复（产品缺陷→owning repo；非 bug 不符→Design）。
- 不扩到出 scope 项（P1 非-commit 重校验/D2 cap 激活/F-B decayScore 量纲/N1 isError 等——记录复现不阻断 U7）。

## 边界
- 真机用副本（保护真实 ~/.asd 02a25032 + BiliDili a3ea6a25，只读复核未变）；Plugin@8a44368/Core@74387b2；Node≥22；测试 commit 可 revert；**不改产品码/Core/vendor**；不 push；thread id 只留 .wakeflow-local。

## 回填（TargetResultEnvelope）
每 stage 前后 DB SELECT（knowledge_entries 按模块/stage、coverage_ledger+deep_mining_rounds 多轮、lifecycle_transition_events、evolution_proposals 流转、semantic_memories、git_diff_checkpoints advance）、各 stage PASS/blocked、触发输入+commit hash、停止条件证据、embedding>Jaccard、真实 ~/.asd/BiliDili 未变核实、消费的 Plugin/Core commit。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
