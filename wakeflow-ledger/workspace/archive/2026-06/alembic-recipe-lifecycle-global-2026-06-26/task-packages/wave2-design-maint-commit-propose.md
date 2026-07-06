# 任务包 · Design — commit-driven 维护契约澄清（committed→update proposal 缺口）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Design**（产契约决策 + 推荐修复形态 + 范围；不改产品码、不 mutate 状态、不 dispatch；返回供控制器 intake → 控制器派产品修复）
- 触发：Test #2 after-regression 真机证据 + **控制器独立核验**浮出的维护语义不匹配。

## 已确认事实（控制器真机+源码核验，非推测）
post-UM（AlembicPlugin@0fa2ac3 含 LP7/CG-5 + AlembicCore@b3a8d81），真机 BiliDili 副本实测：
- **COMMITTED 既有覆盖文件的有实质改动 → 游标 advance（initialized→routed，checkpoint 推进）但 0 update proposal**（E2）。
- **只有 UNcommitted 工作树改动 → 出 update proposal**（E1：未提交的 impactful reformat → type=update/source=file-change/target=d84c424a/observing）。
- 即：单次 committed 改动 **advance XOR propose**（互斥）。
- **根因（控制器源码核验）**：scanner（`GitDiffScanner.#collectHeadRangeEvents(previousHead,currentHead)` / `DurableGitDiffCheckpointRouting` `merge-base..HEAD`）正确用 **commit-range**（故游标 advance）；但 `FileChangeHandler.ts:275 assessFileImpact(...)`（决定是否提 proposal 的 per-file 影响评估）经 `getFileDiff='git diff HEAD'`（**工作树 vs HEAD，commit 后为空**）→ 零 token 命中 → LP7(CG-5) skip → 无 proposal。**两半 diff 源不一致**：scan=commit-range（对）/ impact-assessment=工作树（commit 后错）。
- retire-no-collateral 本身 HOLDS（②created 无生成 / ③delete→deprecate / ④rename→ref 修复 / ⑤幂等 全绿），本缺口与退役无关。

## 与已确认需求的冲突
- **UM 验收 #3**：「修改一个被 recipe_source_refs 覆盖的既有源文件并 git commit → 触发 → FileChangeHandler 命中既有 Recipe 经 EvolutionGateway 落 update proposal」。
- **完成定义 #3/#4**：「evolution 维护走通」「commit-driven 唯一维护触发链 advance」——commit-driven 系统的**正常流是「提交后维护」**，却只对**未提交**改动出 proposal，方向相反。
→ 当前行为**不满足**已确认的维护需求。U7 端到端「维护走通」无法在 committed 改动不 propose 的前提下通过。

## 请 Design 裁定（契约 + 修复形态 + 范围）
1. **契约**：确认「committed-impactful 既有覆盖文件改动 → update proposal」是 commit-driven 维护的目标契约（= 本缺口是须修的 bug），还是「advance-on-commit / propose-on-working-tree」是可接受契约（= 不修，调整完成定义）？（控制器判断：UM 验收#3 已明确要求前者，倾向「须修」，但 impact 评估语义改动 + 与 LP7 交互须 Design 拍板，不擅自定。）
2. **修复形态（若须修）**：推荐 `assessFileImpact` 对 **git-head（committed）事件**改用 scanner 已计算的 **commit-range diff（previousHead..HEAD）** 评估影响（替代工作树 `git diff HEAD`），**之后仍套 LP7 的零 token 抑制**（trivial committed 改动仍 skip、impactful committed 改动才 propose）——这样**调和 LP7 噪声抑制(CG-5) 与 committed→propose 要求**。请确认此形态，或给更优方案。**不重开 LP7 决策**（LP7 保留，只改 impact 的 diff 源）。
3. **范围**：UM-followup 修复（Plugin：把 commit-range diff 喂进 git-head 事件的 assessFileImpact）纳入本伞形，还是更深 redesign？给落点边界建议（哪些文件/函数，是否动 assessFileImpact 签名）。

## 边界
- Design 产**契约决策 + 推荐形态 + 范围**（option/spec 文档，`Design/docs/current/`，design key 关联本需求）+ 返回供 intake。**不改产品码、不跑构建、不 mutate 状态根、不 dispatch。**
- 这是 U7「维护走通」的前置；控制器 intake 后派 Plugin 修复 → Test 再验 committed→propose。

## 回填（TargetResultEnvelope）
契约裁定（须修/可接受）、推荐修复形态与落点边界、范围（UM-followup vs redesign）、与 LP7/CG-5 的调和说明。**evidenceRefs 用 path-like 裸路径**（如 `Design/docs/current/...`、`AlembicPlugin/lib/recipe-generation/evolution/FileChangeHandler.ts`）。完整性自检。
