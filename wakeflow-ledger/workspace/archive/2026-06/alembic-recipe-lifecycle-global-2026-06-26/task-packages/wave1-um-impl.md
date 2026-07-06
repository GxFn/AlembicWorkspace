# 任务包 波1 · um-impl — UM commit-driven 维护链实现（前置已满足，resume）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（经 `file:../AlembicCore` 消费 Core；Core 本阶段只读不改）
- 前身: `um-commit-driven-maintenance`（已正确硬停 + accept 闭合 re-baseline 轮）。本任务=**resume 实现**。
- Baseline: AlembicPlugin@**799ceac**（你上轮已核 clean、未动码、行号/活副本准）。

## 前置已满足（控制器已接受）
**真机 advance 绿基线已由 Test 证明（验收#1 GREEN，3/3 复现）**：在当前 799ceac，对 BiliDili 一个被覆盖既有文件做 **modified**（AppDelegate.swift:51-61 / recipe d84c424a region）+ commit `653ab9b` + 触发 `COMMIT_DRIVEN_TRIGGER_TOOL` → `git_diff_checkpoints` `initialized→routed`、checkpoint `a3ea6a25→653ab9b`、advanced_at 非空、`evolution_proposals` 0→1（type=update/source=file-change/target=d84c424a）= **modified 维护路径 advance（非生成）**。控制器独立复核真实 workspace 02a25032 仍 initialized（Test 用忠实副本保护真机）。
→ **"先证 advance 再退役生成"的硬性顺序，advance 这一步已 DONE。现可安全实现 UM#1-7+LP7（含退役生成路径）。**

## 范围 = 原 UM 任务包全部（按其 file:line 与活副本图谱实现）
**重读** `task-packages/wave1-um-commit-driven-maintenance.md`（你上轮已 re-baseline 核准其行号/活副本，无需再核）。完整实现：
- **UM#1**（=U1#1+U2e 合并单次落地，`FileChangeHandler.ts:410-493` 活副本 876 行）：退役 created→moduleMining 生成（保留 coveredCreated 维护）；全量 grep 清理 `moduleMiningRoutes` 消费方(:124/143/204-205/680/692/723/736)/`defaultModuleMiningAnalyzer`(:169/705-718)/构造器选项，避 undefined。
- **UM#2**：抽 `runCommitDrivenMaintenance` 共享 `knowledge-rescan.ts:381-446`(runRescanUnifiedEvolution) + `opportunistic-evolution-presenter.ts:24-103` 两入口；保 `prepareRescanState` 顺序。
- **UM#3**：原子改名 `mainServiceCanHandleProjectScope→residentSearchEnhancementReady` 跨 4 站点(接口:19 / PluginOpportunisticEvolution.ts:135 / presenter:92 / rescan:430) + defer 重定义为"resident 检索增强去抖" + 中文注释固化语义。
- **UM#5**：created 未覆盖 → 纯计数诊断信号(⑤b，可观测非生成)。
- **UM#7**（CG-6）：核实并固化现有 `ProposalRepository (targetRecipeId,type,status∈pending/observing)` dedup(#hasDuplicate:153/159) + 加 Plugin 双入口(presenter↔rescan)重复 submit 只落一条测试；**不动 schema**（evolution_proposals 无 source_path 列）。
- **LP7**（CG-5）：`FileChangeHandler.ts:290-322` git-head 分支在 `assessFileImpact` 返回 null（零 token 命中）时降为 `generationChangeLog`+`report.skipped++`，不进 pendingProposals/needsReview。
- Core `git_diff_checkpoints` schema/service **只读不改**（D3 游标语义保留即满足）。

## 落地后自验（你窗口可跑的）
- `npm run build:check` + `lint:repo-boundary` + `report:agent-extraction-boundary` 不新增违规 + 相关 unit（FileChangeHandler/GitDiffCheckpoint/PluginOpportunisticEvolution test）绿（Node≥22）。
- **退役不误伤的本地证据**：单测层面证 modified/deleted 维护路径仍建 update/deprecate proposal、created 未覆盖不再种 Recipe（不依赖真机；真机 #2 再验由 Test 在你 landed 后做）。
- 单一编排 grep：`scanOnce/handleFileChanges/recordRouteOutcome` 序列只在抽出的 `runCommitDrivenMaintenance` 一处、落活副本。
- 改名 4 站点 grep 全切、无遗留旧名。

## 跨仓与提交纪律
- 只改本仓 live 源（`lib/recipe-generation/*` 活副本，死 shim 勿改）；Core 只读不改；不碰 vendor。提交到 main（无分支）。**不 push/tag/bump**。thread id 只留 .wakeflow-local。

## 真机再验归属（不在你窗口）
你 landed 后，控制器将派 **Test** 做真机 after-regression（#2 重跑 advance 仍绿 + 退役不误伤 + #5 删除/重命名维护）。你只需产出代码 + 本地门禁/单测绿 + 退役不误伤的单测证据。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/lint/repo-boundary/agent-extraction-boundary/unit 输出摘要、改名 4 站点 grep、单一编排 grep、moduleMiningRoutes 消费方清理 grep、UM#7 双入口测试结果。**evidenceRefs 用 path-like 裸路径**（如 `AlembicPlugin/lib/recipe-generation/evolution/FileChangeHandler.ts`）。完整性自检；证不足→blocked/needs-review。
