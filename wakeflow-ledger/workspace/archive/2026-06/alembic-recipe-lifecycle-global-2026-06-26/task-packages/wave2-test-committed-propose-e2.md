# 任务包 波2 · Test — committed→propose 真机 E2 再验（维护走通收口）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Test**
- 前置：committed→propose 修复双侧已 landed+accept——AlembicCore@**afd4302**(maint-fix-core：getFileDiff/assessFileImpact 加可选 revisionRange) + AlembicPlugin@**31f17d5**(maint-fix-plugin：CommitDrivenMaintenance 透传 scan.range + FileChangeHandler git-head 事件 assessFileImpact 传 commitRange + LP7 精确抑制)。
- 这是 Test #2 浮出的 committed→propose 缺口（advance XOR propose）修复后的**真机收口验收**。

## 要回答的确切问题
post-fix（Plugin@31f17d5 + Core@afd4302），真机 BiliDili 上：**一个 IMPACTFUL 的 COMMITTED 既有覆盖文件改动，是否同时 advance 游标 AND 产 update proposal（不再 XOR）？trivial committed 改动是否仍只 advance、被 LP7 精确抑制不产 proposal？**

## 控制器已自验（不必重做）
- maint-fix-core/maint-fix-plugin 本地：build:check GREEN、定向 unit（getFileDiff/assessFileImpact revisionRange 双路 + FileChangeHandler git-head 传 commit-range + LP7 精确抑制 impactful→propose/trivial→skip）全绿、零新回归。控制器 Node22 亲验。
- 故本卡只需**真机** E2 镜像确认。

## 方法（沿用忠实副本法，保护真机）
复用 `tmp/um-baseline` 副本构建法（git clone BiliDili@a3ea6a25 + better-sqlite3 .backup 真实 DB → 副本，仅改 git_diff_checkpoints.project_root；前置 initialized/a3ea6a25/0）。**插件用当前 31f17d5、Core afd4302**。保护真实 `~/.asd` 02a25032 + 真实 BiliDili a3ea6a2（只读/不改）。

## 步骤 + 验收（真机 DB ground truth；每步前 reset 副本到前置）
1. **impactful committed → advance + propose 并存（核心收口，修前为 XOR）**：对被 recipe_source_ref 覆盖的既有源文件做**有实质 token 改动**（如改 region 内逻辑/标识符，非纯注释）+ revertable commit + 触发 `COMMIT_DRIVEN_TRIGGER_TOOL` → 断言 **(a)** `git_diff_checkpoints` initialized→routed/catch-up-routed + checkpoint advance + advanced_at 非空；**(b)** `evolution_proposals` 0→≥1 type=update source=file-change target=覆盖 recipe status=observing。**advance 与 propose 并存（非 XOR）= 修复生效**（对照 Test #2 的 E2：修前 committed→advance 但 0 proposal）。
2. **trivial committed → advance only（LP7 精确抑制仍在）**：对覆盖文件做**零 token 命中**改动（如纯注释/空白）+ commit + 触发 → 断言游标 advance 但 **0 新 proposal**（LP7 skip，generationChangeLog/skipped）。证明精确抑制（非全抑制、非全产）。
3. **（可选）双 propose dedup**：同一 recipe 先 uncommitted impactful（E1→proposal）再 commit 同改动（E2）→ 断言 UM#7 dedup 只留一条 pending/observing（不重复）。
4. 工作树默认未变：非 git-head（纯工作树 uncommitted）改动仍按原路出 proposal（向后兼容）。

## 成功 / 失败 / 停止
- **成功**=impactful committed→advance+update proposal 并存 + trivial committed→advance-only。→ **committed→propose 修复真机生效，维护走通收口达成。**
- **失败/blocked**=impactful committed 仍 0 proposal（修未生效，根因别处：range 未达 handler / token 零交集），或 trivial committed 反而产 proposal（LP7 失效/过度）→ 返回 blocked + 前后 DB + 触发工具 + commit hash + 哪侧（Core range 传递 / Plugin git-head 分支 / token 提取），不改产品码。
- 不扩到全维/全 stage（U7）。N1（触发工具 isError:true 但维护持久化）若复现记录为 out-of-scope。

## 边界
- 真机用副本（保护真实 ~/.asd 02a25032 + BiliDili a3ea6a2，只读复核未变）；Plugin@31f17d5/Core@afd4302；Node≥22；测试 commit 可 revert；不改产品码/Core/vendor；不 push；thread id 只留 .wakeflow-local。

## 回填（TargetResultEnvelope）
每步前后 `git_diff_checkpoints`/`evolution_proposals` SELECT 原值、commit hash、触发工具、proposal 行(type/source/target/status)、impactful vs trivial 对照、advance+propose 并存结论。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
