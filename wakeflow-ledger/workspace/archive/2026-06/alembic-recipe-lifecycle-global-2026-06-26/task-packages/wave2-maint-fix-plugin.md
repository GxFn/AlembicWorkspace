# 任务包 波2 · maint-fix-plugin — committed→propose 修复（Plugin 侧透传，维护走通收口）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（经 `file:../AlembicCore` 消费 Core@**afd4302**=maint-fix-core 已 landed+accept）
- 依据：Design `design-maint-commit-propose`（已 accept）+ maint-fix-core afd4302（getFileDiff/assessFileImpact 已加可选 revisionRange，默认工作树字节兼容、给定走 commit-range）。本任务=Plugin 侧把 scanner 已算的 commit-range 喂给 git-head 事件的 assessFileImpact，使 committed-impactful→update proposal。
- Baseline: AlembicPlugin@**f1dfcfc**（u1-plugin #1 后）。落地前复核 HEAD 行号。活副本。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（含本包 + Design 契约 `Design/docs/current/alembic-recipe-maint-commit-propose-contract-2026-06-26.md`）+ 本仓 `CLAUDE.md`。

## 范围（Plugin 活副本；LP7 逻辑不重开，只换 impact 的 diff 源）
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| 1 | `CommitDrivenMaintenance.ts:82`（`handleFileChanges`） | **extend** | 把 scanner 已算的 **`scan.range`**（`GitDiffScanResult.range` = mergeBase..HEAD）透传进 `handleFileChanges(events, scan.range)`（或等价管道），使下游 FileChangeHandler 能拿到 commit-range。 |
| 2 | `FileChangeHandler.ts:165/275`（git-head 事件 → `assessFileImpact`） | **extend** | 对 **`eventSource==='git-head'`（committed）事件**，调 `assessFileImpact(projectRoot, path, tokens, commitRange)`（commitRange=透传来的 scan.range）——走 Core afd4302 的 commit-range diff；**非 git-head（工作树）事件不传**=保持默认工作树（向后兼容）。 |
| 3 | `FileChangeHandler.ts:279`（LP7 注释） | **fix** | 订正过时注释「工作树 diff 已不可得」（已伪——commit-range 现可得）；说明 LP7 现在精确抑制（零 token 命中才 skip），而非全抑制。 |
| — | LP7 逻辑(:277-294) | **不重开** | LP7 判定逻辑**不改**：仍 assessFileImpact 返回 null（零 token 命中）→ skip。改的是 git-head 事件传 commit-range 给 assessFileImpact，使 impactful committed 改动**不再**零命中（得到真 impact）→ propose；trivial committed 改动仍零命中→skip。 |

## 验收（committed→propose 收口；真机 E2 镜像归 Test 再验）
1. **build:check 绿**（消费 Core@afd4302 的 revisionRange API）。
2. **git-head 传 commit-range**[unit]：FileChangeHandler git-head 事件分支调 assessFileImpact 时传 commitRange（=scan.range）；非 git-head 不传（工作树默认）。
3. **LP7 精确抑制**[unit]：impactful committed 改动（commit-range 有真 token 命中）→ 产 update proposal（不再被 LP7 误 skip）；trivial committed 改动（零 token 命中）→ 仍 skip。
4. **单一编排不破**：CommitDrivenMaintenance 透传 scan.range 不破坏现有 scan→handle→record 链；FileChangeHandler.test/PluginOpportunisticEvolution.test/GitDiffCheckpoint.test 绿。
5. **门禁**：Node≥22 `build:check` + 相关 unit + `lint:repo-boundary` + `report:agent-extraction-boundary` 不新增违规。
> 真机 committed→propose（E2 镜像：impactful commit→update proposal observing + 游标 advance 并存非 XOR；trivial commit→仍 skip）= 本任务 landed 后由 **Test 再验**（维护走通收口验收）。双 propose（uncommitted E1 + committed E2）靠已 landed UM#7 dedup 兜重叠（采纳 Design 荐双面）。

## 跨仓与提交纪律
- 改本仓 live 源；消费 Core@afd4302（已 build dist）。提交 main（无分支）；**不 push/tag/bump/不碰 vendor**；不重开 LP7 逻辑、不改 git_diff_checkpoints schema。

## 禁止
- 不重开 LP7 判定（只换 git-head 事件的 impact diff 源为 commit-range）；不改非 git-head（工作树）事件默认；不读写 git_diff_checkpoints（range 取自 scan.range，非另查 checkpoint）；不动死副本/shim。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/unit/lint/repo-boundary 输出、git-head 传 commit-range 的 unit、LP7 精确抑制 unit（impactful→propose / trivial→skip）、CommitDrivenMaintenance 透传 grep。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
