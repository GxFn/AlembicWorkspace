# 任务包 波1 · Test — UM 真机 advance 绿基线（验收#1，UM 实现前置）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Test**
- Wave: 波1（UM 实现的硬性前置；AlembicPlugin 的 UM 已 needs-review 正确硬停，等此基线绿后 resume）
- 目标插件代码基线: **AlembicPlugin@799ceac（当前、UM 改动之前）** / AlembicCore@d49fc05

## 这次测试要回答的确切问题
**在当前插件代码（799ceac，UM 退役生成之前），commit-driven 维护链对一个"被既有 Recipe 覆盖的源文件的 modified（非 created）"事件，能否把 BiliDili 的 `git_diff_checkpoints` 游标从 `initialized` 推进到 `routed`/`catch-up-routed` 并产出 ≥1 条 evolution_proposal？**

这是 UM 退役"created→生成"路径之前**必须先有的绿基线**：证明"modified/deleted 维护路径"本身能 advance，才能安全退役生成路径而不致把唯一能产 advance 的链一起退役（设计文档 UM 最高风险"主循环失败却修周边"）。

## 控制器已自验（不必你重做）
- 静态：AlembicPlugin clean@799ceac；BiliDili DB 只读 = `single-folder|root|initialized|a3ea6a25|advanced_at=NULL`、`evolution_proposals=0`；BiliDili 源仓 HEAD=`a3ea6a25` clean。即"停 initialized"=合法停滞（0 commits since checkpoint），非代码 bug——advance 逻辑本身 `GitDiffCheckpointService.ts:152-188` 仅在 routeStatus∈{routed,catch-up-routed} 推进，需先有真实新 commit 才会触发。
- 为何必须真机：游标推进是真实 git diff + 真实工具触发 + 真实 DB 写入的端到端链路，控制器/产品窗口无法安全复现；本仓 CLAUDE.md 禁产品窗口"冒充用户项目执行真实用户命令"，故归 Test。

## 步骤（真机 BiliDili，workspace 02a25032，源在 `…/AlembicWorkspace/BiliDili`）
1. **前置快照（只读）**：记录 `git_diff_checkpoints`（scope/folder/last_route_status/checkpoint_commit/advanced_at）、`evolution_proposals` count、`recipe_source_refs`（11 行的 source_path）、BiliDili `git rev-parse HEAD`。确认 = initialized/a3ea6a25/NULL/0。
2. **选既有被覆盖文件**：从 `recipe_source_refs.source_path` 选一个真实存在的源文件（被某 active Recipe 覆盖）。
3. **modified 事件（关键：是 modified 不是 created）**：对该文件**已覆盖 region 内**做一处真实内容改动（如改注释/微调），`git commit`（**可 revert 的测试 commit，记录 hash**，commit message 标明 test）。这隔离"维护路径"。
4. **触发**：用 **AlembicPlugin@799ceac 的真实 cc-plugin MCP** 对 BiliDili 跑一个 `COMMIT_DRIVEN_TRIGGER_TOOLS`（见 `PluginOpportunisticEvolution.ts:221` 的工具集，如 `alembic_work`/`alembic_code_guard`/`alembic_rescan` 之一）。
5. **验证（DB SELECT 后值）**：
   - `git_diff_checkpoints.last_route_status` ∈ {routed, catch-up-routed}（从 initialized 变）；
   - `checkpoint_commit` 从 `a3ea6a25` 推进到新 HEAD；`advanced_at` 非空；
   - `evolution_proposals` 0→≥1（modified 既有 Recipe → update proposal；记录 type/source/target_recipe_id）。
6. **路径归因**：确认 advance 来自 **modified 维护路径**（非 created/生成），证明维护链独立于生成路径成立。

## 成功 / 失败 / 无效结论 / 停止条件
- **成功**=游标 advance（initialized→routed/catch-up-routed + advanced_at 非空 + checkpoint_commit 推进）且 proposals 0→≥1 来自 modified 维护路径。→ 绿基线达成，解锁 UM 实现。
- **失败/blocked（关键发现）**=造了真实 commit + 触发后游标仍停 initialized 或 proposals 仍 0。这说明维护链在当前代码就**断**——是全伞形最危险的真相，**返回 blocked + 完整失败证据**（前后 DB、commit hash、触发工具、任何日志/报错），不要绕过、不要去改产品码（产品修复归 Plugin 窗口，此处只取证）。
- **无效结论**：不要用 created（新文件）证 advance（那是生成路径，不能证明维护路径）；不要因 0 commits 就判"坏"（必须先造 commit）。
- **停止条件**：advance 证明达成（绿）或确证断裂（blocked）即停，不扩到全 stage/全维（那是 U7）。

## 边界与安全
- 真机对象=真实 BiliDili workspace（重点就是那条真实卡住的游标）；测试 commit 必须可 revert（记 hash）。若判定真实 DB 变更须隔离，可在**忠实复刻 initialized/a3ea6a25/0-proposal 前置**的 BiliDili 副本上做，但须说明用了副本。
- 保护真实 `~/.asd` 其它 workspace（仅作用 02a25032）；Node≥22；不改任何产品代码/Core/vendor；不 push/tag/bump；thread id 只留 .wakeflow-local。

## 回填（TargetResultEnvelope）
前置/后置 `git_diff_checkpoints` 与 `evolution_proposals` 的 SELECT 原值、测试 commit hash、触发工具名、proposal 行（type/source/target）、modified-路径归因结论；成功→绿基线，失败→blocked+证据。**evidenceRefs 用 path-like 裸路径**（如 `Test/tmp/...`、DB 路径）。完整性自检；证不足→blocked/needs-review。
