# commit-driven 维护契约裁定 — committed→update proposal 缺口（advance XOR propose）

Date: 2026-06-26
Status: design-spec / contract-ruling（ready-for-controller-intake）— 经 task `design-maint-commit-propose` 指派写交付
Source Window: Design
Design Key: `alembic-recipe-maint-commit-propose-contract-2026-06-26`
Parent Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形 UM / 完成定义 #3·#4 / D3）
Scope: AlembicCore + AlembicPlugin；本文产**契约裁定 + 推荐修复形态 + 范围/落点边界**，不改产品码、不跑构建、不 mutate 状态、不 dispatch
Grounding: Test#2 after-regression 真机证据 + 控制器源码核验 + **Design 一手代码复核**（AlembicPlugin@0fa2ac3 / AlembicCore@b3a8d81，逐函数读 file:line）

---

## §1 决策复述（控制器三问）

post-UM 真机 BiliDili 副本实测：COMMITTED 既有覆盖文件的 impactful 改动 → **游标 advance 但 0 update proposal**（E2）；只有 UNcommitted 工作树改动 → 出 proposal（E1）。单次 committed 改动 **advance XOR propose**（互斥）。控制器请 Design 裁定：

1. **契约**：committed-impactful→update proposal 是目标契约（须修 bug），还是 advance-on-commit/propose-on-working-tree 可接受（改完成定义）？
2. **修复形态**：`assessFileImpact` 对 git-head(committed) 事件改用 scanner 已算的 commit-range diff（再套 LP7 零 token 抑制）——确认或给更优？（不重开 LP7）
3. **范围**：UM-followup 还是更深 redesign？给落点边界。

---

## §2 根因一手核验（确认控制器假设，并加深一层）

控制器根因**完全成立**，Design 逐函数复核确证，并浮出一个加强"须修"的事实：

| 链路半 | 真相（file:line） | diff 坐标系 |
|---|---|---|
| **scan（检测文件变更）** | `GitDiffScanner.#collectHeadRangeEvents:204-240` 跑 `git diff <mergeBase>..<currentHead>`，产 `range:{from,to}` 落 `GitDiffScanResult.range`（`:44,155`）| **commit-range（对）→ 故游标 advance** |
| **impact（决定是否提 proposal）** | `FileChangeHandler.ts:275 assessFileImpact(projectRoot, path, tokens)` → 内部 `getFileDiff`（`ContentImpactAnalyzer.ts:59`）→ `diffParser.ts:31` 跑 `git diff HEAD -U0`（工作树 staged+unstaged vs HEAD）| **工作树（commit 后为空）→ null → 无 impact** |

→ committed 后工作树 diff 为空 → `assessFileImpact` 返回 null → `FileChangeHandler.ts:277-294` LP7(CG-5) 分支吞掉（记 `source-modified-git-head-no-impact` + `skipped++`，**不提 proposal**）。**两半 diff 源构造性不一致**，控制器定位精确。

**Design 加深一层（加强"须修"判断）：**
- `ContentImpactAnalyzer.ts:121` + `RecipeImpactPlanner.ts:8` 注释自证 `assessFileImpact`/`getFileDiff` **本为「实时 IDE 工作树事件」设计**（"使用 git diff HEAD，逐个文件分析"）。git-head(committed) 路径**复用了一个工作树语义的分析器**——不一致是复用错配，非偶发。
- LP7 注释（`FileChangeHandler.ts:279`）写"工作树 diff 内容已不可得，无法判定真实影响"——此前提**可证伪**：commit-range diff 内容并非不可得，scanner 已算 `mergeBase..HEAD` 且 `range` 已挂在结果上。即 LP7 的 skip 建立在一个**错误的"diff 不可得"前提**上。
- retire-no-collateral 与本缺口无关（②created/③delete/④rename/⑤幂等 全绿），确认。

---

## §3 契约裁定（Q1）→ **committed-impactful→propose 是目标契约 = 须修的 BUG**

**裁定：advance XOR propose 是缺陷，不是可接受契约。修复方向 = 让 committed-impactful 既有覆盖文件改动产 update proposal。**

依据（均为**已确认**需求，非新增）：
- **UM 验收 #3** 明文："修改一个被 recipe_source_refs 覆盖的既有源文件并 **git commit** → 触发 → FileChangeHandler 命中既有 Recipe 经 EvolutionGateway 落 **update proposal**"。当前行为直接违反。
- **D3 维护语义**："新提交→扫 diff→对受影响**既有 Recipe** 建/更新/弃用 proposal"。触发源是 **commit**；"commit-driven" 系统只对**未提交**改动 propose 是自相矛盾。
- **完成定义 #3/#4**："evolution 维护走通"/"commit-driven 唯一维护触发链 advance"。U7 端到端"维护走通"在 committed 改动不 propose 前提下**无法通过**。

**关键定性 → 这是 BUG，不是 redesign（影响控制器路由）：**
- 需求侧（UM#3/D3/完成定义）**清晰且正确**；偏差在 impl（git-head 路径错配工作树分析器）。这是「valid 需求 + 错 impl」的**普通 bug**，不是「valid impl 仍偏离目标」的非 bug outcome mismatch。
- 因此**修复 = 让 impl 满足已确认契约，不改完成定义、不改 UM#3、不改 phase 边界**。无 Confirmation Gate 级 scope 变更（修复是恢复既定契约，非追加能力）。
- 控制器据此可直接 intake → 派 Plugin/Core 修复，**无需走 Design 需求 redesign**。

advance-on-commit/propose-on-working-tree 被否决：它会让"commit-driven 维护"名实相反、推翻 UM#3，且需反向改完成定义——无任何已确认依据支持。

---

## §4 推荐修复形态（Q2）→ **确认控制器形态：git-head 事件用 commit-range diff + 保留 LP7**

**确认控制器提议的形态，且代码缝比预期更干净（additive、零破坏工作树路径）：**

核心：`assessFileImpact` 对 **git-head(committed) 事件**改用 scanner 已算的 **commit-range diff（`scan.range` = `mergeBase..currentHead`）**评估影响，替代工作树 `git diff HEAD`；**之后 LP7 零 token 抑制照旧**。

**为何这恰好调和 LP7/CG-5 与 committed→propose（不重开 LP7）：**
- LP7 的**意图** = 抑制 trivial committed 改动的噪音提案（别为每个被碰的覆盖文件刷无证据 reference 提案污染 needsReview）。
- LP7 的**当前实现**因 diff 源为空 → 把**所有** committed 改动都判成 zero-impact → 全抑制（过度）。
- 修复给 LP7 **一个正确的输入**（真实 commit-range diff）：impactful committed 改动 → 非空 diff → 命中 token → impact 非空 → **propose**；trivial committed 改动 → 有 diff 但零 Recipe-token 交集 → impact 仍 null → **LP7 照旧 skip**。
- → **LP7 决策不动**（保留 CG-5），只换 impact 的 diff 源；LP7 从"全抑制"变回"精确抑制"。其 `:279` 错误前提注释顺手订正。

**修复缝（一手核验，干净）：**
- `assessDiffImpact(diffTokens, recipeTokens)`（`ContentImpactAnalyzer.ts:84`）已是 **diff-源无关的导出 scorer**，无需改。
- commit-range **已被 scanner 算出**（`GitDiffScanResult.range`），无需新算 diff。
- 注入点 = `getFileDiff` 的 diff revision（默认 `HEAD` 保工作树现状，可选 range 走 commit-range）。

---

## §5 范围与落点边界（Q3）→ **UM-followup（伞形内 bug 修复），非 redesign**

**范围裁定：纳入本伞形作 UM-followup**（U7"维护走通"前置）。**纯 additive，默认分支逐字节保工作树(IDE)路径不变。**

| 仓 | file:line | 改动 | 形态 |
|---|---|---|---|
| **Core** | `src/shared/diffParser.ts:31 getFileDiff(projectRoot, relativePath)` | **add 可选 `revisionRange?: string`** | 默认 `git diff HEAD`（现状）；给 range 时 `git diff <revisionRange> -U0 -- file`。**additive** |
| **Core** | `src/service/evolution/ContentImpactAnalyzer.ts:54 assessFileImpact(...)` | **add 可选 `revisionRange?`** 透传 getFileDiff | `assessDiffImpact:84` 不动 |
| **Plugin** | `git-diff-checkpoint/GitDiffScanner.ts:204-240` | **reuse（不改）** | `range:{from,to}` 已产、已在 `GitDiffScanResult.range:44` |
| **Plugin** | `git-diff-checkpoint/CommitDrivenMaintenance.ts:82`（统一 `runCommitDrivenMaintenance`，UM#2 抽出）| **extend**：`handler.handleFileChanges(scan.events)` → `handler.handleFileChanges(scan.events, scan.range)` | 唯一编排点，两入口都过此 |
| **Plugin** | `evolution/FileChangeHandler.ts:165 handleFileChanges(events)` | **extend 签名**：`(events, commitRange?)` | 见下 |
| **Plugin** | `FileChangeHandler.ts:275`（`#handleModified` 内） | **extend**：`event.eventSource==='git-head'` 时传 `commitRange`（`'<from>..<to>'`）给 `assessFileImpact(projectRoot, path, tokens, range)`；非 git-head 不传→工作树默认 | 旁路保护 IDE 路径 |
| **Plugin** | `FileChangeHandler.ts:277-294`（LP7/CG-5）| **logic 不变 + 订正注释** | 现仅在 commit-range 评估后 impact 仍 null（真零交集）才 skip；`:279` 错误前提注释更新 |

**透传方式建议**：用 `handleFileChanges(events, commitRange?)` 第二参（handler/batch 级 context），**不改 Core `FileChangeEvent` 类型**（保 `{type,path,oldPath?,eventSource?}` 稳定）。备选=给 `FileChangeEvent` 加 `range?` 字段，但触 Core 类型 + 所有 event 构造点，更重，不推荐。

**跨仓顺序**：Core 先（additive 参数 + `build:check` + test + commit local，Node≥22）→ Plugin 经 `file:../AlembicCore` 接入。落地前 grep `getFileDiff`/`assessFileImpact` 全部调用方（两仓）确认可选参不破位置参（cross-repo named-export sweep）。注意 `ContentImpactAnalyzer.ts:117+` 另有 unified 入口，range 透传范围以 `FileChangeHandler:275` 用的基础 `assessFileImpact` 为准，勿误扩。

---

## §6 Must-Confirm / 依赖 / 失效证据

**Must-confirm（控制器/落地裁定）：**
1. **committed × uncommitted 双 propose 重叠 → 依赖 UM#7 dedup**：修复后 impactful 改动可能两次入提案——未提交时经 opportunistic/dirty-worktree 面（E1 现状）+ 提交时（E2 修复）。**UM#7（CG-6）已固化 `(targetRecipeId,type,status∈pending/observing)` dedup**（`ProposalRepository #hasDuplicate`）→ 同 recipe+type 第二条在前者 pending/observing 时被去重，不产重复。**依赖**：committed→propose 修复须在 UM#7 dedup landed 之上。**待确认契约**：保留"committed 权威 + uncommitted opportunistic（dedup 兜重叠）"双面（推荐，移除 opportunistic 面属 out-of-scope），还是收敛 committed-only？
2. **range 坐标一致**：impact diff 用 scanner 检测所用的**同一 range**（`scan.range`=`mergeBase..currentHead`），勿另引 `previousHead..HEAD` 等不同 range，避免非快进历史下 detect/impact 错配。
3. **LP7 注释订正**：`FileChangeHandler.ts:279` "工作树 diff 已不可得"前提已伪，须更新注释，防未来维护者据错前提复原 skip（再引入本 bug）。

**失效证据（修复后仍须真机证伪）：**
- Test 复验 committed→propose 仍 0 proposal → 根因别处（range 未达 handler / token 提取对真 impactful 改动仍零交集），非本修复可闭。
- **验收口径（E2 镜像）**：commit 一条 impactful 既有覆盖文件改动 → `evolution_proposals` 落 type=update/source=file-change/target=该 recipe/observing **且**游标 advance（**两者并存，非 XOR**）；commit 一条 trivial 改动（零 Recipe-token 交集）→ 仍 skip（LP7 精确抑制）。

---

## §7 ADR 候选判断

**建议轻量 ADR / 守护注释**（非完整 ADR）：本质决策 = **"影响评估的 diff 源必须匹配触发器坐标系"**（git-head/committed 事件用 commit-range；IDE/host-edit 事件用工作树）——与 D3"勿混 diff 坐标系"（维护游标 vs 覆盖账本）同源纪律。够"未来维护者会惊讶"门槛：有人"简化" `assessFileImpact` 回单一 diff 源即静默复原本 bug。**建议**：在 `assessFileImpact`/`FileChangeHandler:275` 落一条中文守护注释固化此纪律；是否升正式 ADR 由控制器定。其余按本文 §3-§4 rationale 即足。

---

## 证据与链接

- 任务包：`.wakeflow-active/current/alembic-recipe-lifecycle-global-2026-06-26/task-packages/wave2-design-maint-commit-propose.md`
- 伞形需求设计：`Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md`（UM / 完成定义 #3·#4 / D3 / CG-5 LP7 / CG-6 UM#7 dedup）
- 根因（Design 一手核验）：
  - `AlembicPlugin/lib/recipe-generation/evolution/FileChangeHandler.ts:275`（assessFileImpact 调用）+ `:277-294`（LP7/CG-5 git-head 零 impact skip）
  - `AlembicCore/src/service/evolution/ContentImpactAnalyzer.ts:54`（assessFileImpact）+ `:59`（内部 getFileDiff）+ `:84`（assessDiffImpact 干净 scorer 缝）+ `:121`（"实时变更场景"注释）
  - `AlembicCore/src/shared/diffParser.ts:31`（getFileDiff = `git diff HEAD -U0`，工作树）
  - `AlembicCore/src/service/evolution/RecipeImpactPlanner.ts:8`（"FileChangeHandler 用 git diff HEAD"设计注释）
- 修复缝：
  - `AlembicPlugin/.../git-diff-checkpoint/GitDiffScanner.ts:204-240`（commit-range 已算）+ `:44`（`GitDiffScanResult.range`）
  - `AlembicPlugin/.../git-diff-checkpoint/CommitDrivenMaintenance.ts:82`（`handleFileChanges(scan.events)` 编排点，range 在此可达）
  - `AlembicPlugin/.../evolution/FileChangeHandler.ts:165`（`handleFileChanges` 入口签名）
  - `AlembicCore/src/types/ReactiveEvolution.ts:34-42`（`FileChangeEvent` 字段，不带 range）
