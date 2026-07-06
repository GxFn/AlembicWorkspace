# 任务包 波1 · UM — commit-driven 唯一维护触发链路打通（D3）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（Codex 插件仓；经 `file:../AlembicCore` 消费 Core，不碰 vendor）
- Wave: 波1（与 AlembicCore 的 U4-Core 并行）；**全局排序第 1，最危险暗坑**
- Baseline: AlembicPlugin@**799ceac**（clean）/ AlembicCore@d49fc05（本阶段 Core **只读不改**）。行号取自 U0 重基线，落地前复核当前 HEAD。

## 身份门（先做）
确认当前目录=AlembicPlugin 仓、任务分配给 AlembicPlugin。读 `../CLAUDE.md` + `../.wakeflow-active/index.md` + state root（含本任务包 + `evidence/u0-rebaseline-2026-06-26.md` 的**活/死副本图谱**）+ 本仓 `CLAUDE.md`。

## ⚠️ 最高风险与硬性顺序（先证 advance，再退役生成）
BiliDili 维护游标实测 `initialized@a3ea6a25` advanced_at=NULL，**维护闭环线上从未 advance 过一次**。风险="主循环失败却修周边"：若先退役被误当生成的路径，可能把唯一能产 advance 的链一起退役。
**强制顺序**：**① 先在真机证明 modified/deleted 维护链能把游标推进到 routed（验收 #1）→ ② 再退役 created→生成路径（UM#1）**。不得颠倒。

## 活副本（U0 钉死，绝对路径；死副本 3 行 shim 勿改）
- `lib/recipe-generation/evolution/FileChangeHandler.ts`（**876 行，活**；死 shim 在 `lib/service/evolution/FileChangeHandler.ts`）
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`（活）
- `lib/runtime/mcp/host/opportunistic-evolution-presenter.ts`（活，**不在 recipe-generation 下**）
- `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts`（活）

## 范围（主体全在 Plugin；Core git_diff_checkpoints schema/service 不改）
| # | file:line（活副本，当前 HEAD） | change | 怎么改 |
|---|---|---|---|
| UM#1 | `FileChangeHandler.ts:410-493`（`#handleCreated→#routeNewModuleToModuleMining`） | **retire（=U1#1+U2e 合并单次落地，本波只此一处动它）** | **保留 coveredCreated**（命中既有 ref=维护），对**未覆盖新文件不再调 moduleMiningAnalyzer 种新 Recipe**。全量 grep 清理 `moduleMiningRoutes` 消费方（:124/143/204-205/680/692/723/736）、`defaultModuleMiningAnalyzer`(:169/705-718)、构造器选项，避免 undefined 访问。落为：git-diff 只对**既有 Recipe** 建/更新/弃用 proposal。 |
| UM#2 | `knowledge-rescan.ts:381-446`(`runRescanUnifiedEvolution`) + `opportunistic-evolution-presenter.ts:24-103` | **reuse** | 两入口含近乎相同 `createPluginGitDiffCheckpointRuntime→scanOnce→handleFileChanges→recordRouteOutcome`。抽 `runCommitDrivenMaintenance(container,projectRoot,scope?,taskScopedFiles?)` 共享函数（放 git-diff-checkpoint/ 下），两入口都调。**须保 rescan 既有 `prepareRescanState` 顺序**（先 cleanup+rebuildLocalKnowledgeIndexes 再 scan）。 |
| UM#3 | `opportunistic-evolution-presenter.ts:54-57,89` + 跨 4 站点 | **extend + 原子改名** | 顶部加中文注释固化语义（commit-driven 唯一维护触发源，不生成新 Recipe、不读写覆盖账本）。**保留** `residentProjectScopeAvailable && !headChanged` defer 但重定义为「resident 检索增强去抖」（resident 无活 evolution、非维护对端）。**原子改名** `mainServiceCanHandleProjectScope`→`residentSearchEnhancementReady`，跨 4 站点同步：接口 `:19` / 活分支 `PluginOpportunisticEvolution.ts:135` / presenter set `:92` / rescan set `:430`。 |
| UM#5 | `FileChangeHandler.ts:440-453`（created 未覆盖退役归属） | **decision 已决⑤b** | 退役后→**纯计数诊断信号**（可观测、非生成、不触发任何生成/分析）。 |
| UM#7 | `ProposalRepository`(Core，只读核) + 双入口测试 | **add（CG-6：不动 schema）** | **核实并固化现有 dedup**：`ProposalRepository.create` 已对 `(targetRecipeId,type,status∈pending/observing)` 去重(`#hasDuplicate`:153/159)。**不立 source_path migration**（`evolution_proposals` 无 source_path 列，加之是放宽非收紧）。加 **Plugin 双入口（presenter↔rescan）对同 recipe+type 重复 submit 只落一条**的测试。 |
| LP7 | `FileChangeHandler.ts:290-322`（`eventSource==='git-head'`） | **extend（CG-5：移入 UM）** | git-head 分支在 `assessFileImpact` 返回 null（零 token 命中）时**不再无条件提 reference 提案**；降级为 `generationChangeLog` 记录 + `report.skipped++`，不进 `pendingProposals/needsReview`。 |
| UM#4/#6 | Core `GitDiffCheckpointService`/`Repository` + scope 粒度 | **reuse（不改）** | 保留 `git_diff_checkpoints` 作纯维护游标（previousHead↔HEAD per-scope），Core **不改**；scope 保持 folder/root 粒度，**勿被覆盖账本 per-cell 污染**（不同坐标系）。 |

## 验收（B 节 UM 可证伪口径；真机只读核 BiliDili DB）
1. **[UM 真机 advance — 最危险，必先证]** 改 BiliDili 被 `recipe_source_refs` 覆盖的既有源文件 region + git commit + 触发任一 `COMMIT_DRIVEN_TRIGGER_TOOLS` → `SELECT last_route_status,checkpoint_commit,advanced_at FROM git_diff_checkpoints`：从 `initialized` 变 `routed`/`catch-up-routed` + checkpoint_commit 从 `a3ea6a25` advance 到新 HEAD + advanced_at 非空 + `evolution_proposals` 0→≥1。**停 initialized 或 0 proposal = 未通**。（"无 commit 停 initialized"是合法停滞非 bug，须先造真 commit；建议可 revert 的测试 commit 或 BiliDili DB 副本，避免污染。）
2. **[退役不误伤]** 重跑 advance 仍绿；无覆盖新 `.swift`+commit → surface 中 `moduleMiningRoutes` 空（或仅非生成诊断计数）、`knowledge_entries` 不因 created 事件新增。
3. **[语义隔离]** grep：`git_diff_checkpoints`/`GitDiffCheckpointRepository`/`DurableGitDiffCheckpointRouting` 唯一读写方=维护触发链；deepMining/覆盖账本路径无引用（本波尚无账本，确认无新引入）。
4. **[游标必要性]** 连续两次 commit+触发，第二次 previousHead=第一次推进后 checkpoint_commit，只扫第二个增量 diff。
5. **[删除/重命名维护]** 删被覆盖源文件+commit→落 deprecation proposal（非直接删 Recipe）；高置信 rename→source-ref 路径修复 + 游标推进。
6. **[单一编排]** grep `scanOnce/handleFileChanges/recordRouteOutcome` 序列只在抽出的 `runCommitDrivenMaintenance` 一处、落活副本；`FileChangeHandler.test.ts`/`GitDiffCheckpoint.test.ts`/`PluginOpportunisticEvolution.test.ts` 全绿。
7. **[UM#7]** 双入口对同 recipe+type 重复 submit 只落一条；**禁在无 source_path 列时声称按 sourcePath 去重**。
8. **[门禁]** `npm run build:check` + `npm run lint:repo-boundary` + `npm run report:agent-extraction-boundary` 不新增违规 + 相关 unit 绿（Node≥22）。

## 跨仓与提交纪律
- 只改本仓 live 源；Core **只读不改**（游标语义保留即满足 D3）。提交到 main（无分支）。**不 push/tag/bump/不碰 vendor**。
- 真实 thread id 只写 `.wakeflow-local`，不入任务包/回填/GitHub。

## 禁止
- **不得先退役生成再证 advance**（顺序硬性）；不退役维护路径；不改 `git_diff_checkpoints`/`evolution_proposals` schema（CG-6）；不放松门禁；不重引 daemon/file-monitor；不动死副本/3 行 shim；不把 scope 游标 per-module 化。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、真机 advance 的 DB SELECT 前后值（last_route_status/checkpoint_commit/advanced_at/proposals 计数）、build:check/lint/unit 输出摘要、改名 4 站点 grep、单一编排 grep。**evidenceRefs 用 path-like 裸仓库相对路径**（如 `AlembicPlugin/lib/recipe-generation/evolution/FileChangeHandler.ts`）。完整性自检；证不完整→blocked/needs-review。
