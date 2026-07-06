# 任务包 波1 · Test — UM 退役后 after-regression（验收 #2/#5 + 退役不误伤）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Test**
- 前置：um-impl 已 landed+accept（AlembicPlugin@**0fa2ac3**，UM#1-7+LP7：退役 created→生成、抽单一编排、改名、dedup、LP7）；Core@**b3a8d81**（U5-Core）。advance 绿基线（验收#1）此前已 GREEN。
- 目标插件代码：AlembicPlugin@0fa2ac3 / AlembicCore@b3a8d81。

## 要回答的确切问题
um-impl 退役了 created→生成路径后：**维护链是否仍能 advance（退役不误伤）、created 未覆盖是否真的不再种 Recipe、删除/重命名维护是否正常？**（设计 UM 验收 #2/#5 + 退役不误伤）。这是 UM"最危险退役"的真机安全再验。

## 控制器已自验（不必重做）
- um-impl 本地：build:check GREEN、定向 unit 36 passed、改名旧名 0、死生成码 0、CommitDrivenMaintenance 单一编排、退役不误伤的 unit 证据。控制器 Node22 亲验。
- 故本卡只需**真机**侧：退役后 advance 仍绿 + created 无生成 + 删/改名维护。

## 方法（沿用 baseline 的忠实副本法，保护真机）
复用上次 `tmp/um-baseline` 的 replica 构建法（git clone BiliDili@a3ea6a25 + better-sqlite3 .backup 真实 DB 只读 → 副本，仅改 git_diff_checkpoints.project_root；前置 initialized/a3ea6a25/0）。**但插件用当前 0fa2ac3（退役后），Core b3a8d81**。保护真实 `~/.asd` 02a25032 + 真实 BiliDili a3ea6a2（只读/不改）。

## 步骤 + 验收（真机 DB ground truth；每步前 reset 副本到前置）
1. **#2 退役不误伤（advance 仍绿，核心）**：改一个被 recipe 覆盖的既有源文件 region + revertable commit + 触发 `COMMIT_DRIVEN_TRIGGER_TOOL` → 断言 `git_diff_checkpoints` 仍 `initialized→routed/catch-up-routed` + checkpoint advance + advanced_at 非空 + `evolution_proposals` 0→≥1（update·file-change·覆盖 recipe）。**退役后必须仍绿**（与 baseline 同结果）——证明退役 created 生成未破坏 modified 维护路径。
2. **created 无生成（退役生效）**：创建一个**全新无覆盖** `.swift` 文件 + commit + 触发 → 断言 surface `moduleMiningRoutes` 空（恒空字段=Strategy B 保留）或仅 `uncoveredCreated` 计数诊断；`knowledge_entries` **不因该 created 事件新增** candidate/recipe；不调生成分析。
3. **#5 删除维护**：删除一个被覆盖源文件 + commit + 触发 → 断言落 **deprecation proposal**（非直接删 Recipe）。
4. **#5 重命名维护**：`git mv` 一个被覆盖源文件 + commit + 触发 → 断言 source-ref 路径修复 + 游标推进（高置信 rename）。
5. **幂等**：连续两次 commit+触发，第二次只扫增量（previousHead=上次推进点）。

## 成功 / 失败 / 停止
- **成功**=#2 仍绿 + created 无生成 + 删→deprecation + rename→ref 修复。→ UM 真机闭环 after-regression 通过。
- **失败/blocked（关键）**=退役后 #2 不再 advance / created 仍种 Recipe / 删除直接删 Recipe → 退役误伤，**返回 blocked + 完整前后 DB 证据 + 触发工具 + commit hash**，不改产品码（修复归 Plugin）。
- 不扩到全维/全 stage（U7）。N1（触发工具 isError:true 但维护持久化）若复现，记录为 out-of-scope 观察，不阻断。

## 边界
- 真机用副本（保护真实 ~/.asd 02a25032 + BiliDili a3ea6a2，只读复核它们未变）；Plugin@0fa2ac3/Core@b3a8d81；Node≥22；测试 commit 可 revert；不改产品码/Core/vendor；不 push；thread id 只留 .wakeflow-local。

## 回填（TargetResultEnvelope）
每步前后 `git_diff_checkpoints`/`evolution_proposals`/`knowledge_entries` SELECT 原值、commit hash、触发工具、proposal 行；退役不误伤结论。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
