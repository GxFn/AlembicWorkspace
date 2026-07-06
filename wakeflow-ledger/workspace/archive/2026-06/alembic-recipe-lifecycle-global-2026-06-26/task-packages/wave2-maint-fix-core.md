# 任务包 波2 · maint-fix-core — committed→propose 修复（Core 侧，Design 已裁须修）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**
- 依据：Design `design-maint-commit-propose`（已 accept）裁定=**committed-impactful 既有覆盖文件改动→update proposal 是目标契约=须修 BUG**（非 redesign，不改完成定义）；修复形态=assessFileImpact 对 git-head 事件改用 scanner 已算 **commit-range diff** 替工作树，**LP7 不重开**（只换 diff 源，全抑制→精确抑制，调和 CG-5+committed→propose）；Core 先 Plugin 后。
- Baseline: AlembicCore@**fe42940**（u1-core 后）。落地前复核当前 HEAD 行号。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（含本包 + Design 契约文档 `Design/docs/current/alembic-recipe-maint-commit-propose-contract-2026-06-26.md`）+ 本仓 `CLAUDE.md`。

## 根因（控制器+Design 双核验）
`assessFileImpact`(`ContentImpactAnalyzer.ts:54`)→`getFileDiff`(`diffParser.ts:31`) 跑 `git diff HEAD`（工作树，commit 后为空）→ null → 上层 LP7 skip → committed 改动无 proposal；而 scanner（`GitDiffScanner.ts:204-240`）用 `mergeBase..HEAD`（commit-range，对）→ 游标 advance。两半 diff 源不一致。`assessDiffImpact:84` 已是 diff-源无关 scorer = 干净注入点。

## 范围（Core 侧，纯 additive，默认行为零变更）
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| 1 | `AlembicCore/src/shared/diffParser.ts:31`（`getFileDiff`） | **extend（additive）** | 加**可选** `revisionRange?: string` 参数：未给→保持现 `git diff HEAD`（工作树，**字节兼容**）；给定→`git diff <revisionRange>`（commit-range，如 `mergeBase..HEAD`）。 |
| 2 | `AlembicCore/src/service/evolution/ContentImpactAnalyzer.ts:54`（`assessFileImpact`） | **extend（additive）** | 加**可选** `revisionRange?: string`，透传给 `getFileDiff`；未给→默认工作树（向后兼容）。`assessDiffImpact:84` scorer 不改（diff-源无关）。 |
| — | `ContentImpactAnalyzer.ts:117+`（另有 unified 入口）| **不扩** | range 透传以 `FileChangeHandler:275` 基础 assessFileImpact 为准（Plugin 侧 maint-fix-plugin 接），本任务**不误扩** unified 入口。 |

## 验收（Core-unit 可证伪）
1. **默认零回归**[unit]：`getFileDiff`/`assessFileImpact` 不传 revisionRange → 行为/输出与改前**逐字段一致**（仍 `git diff HEAD` 工作树）；现有调用方字节兼容。
2. **commit-range 路径**[unit]：传 `revisionRange='<range>'` → `getFileDiff` 跑 `git diff <range>`；构造一个「已提交改动」场景（工作树空但 range 有 diff）→ assessFileImpact 经 range 得到非空 impact（验证 committed 改动可被评估）。
3. **可选参不破位置调用**[grep/build]：grep 两函数全调用方，确认可选参追加未破坏现有位置参调用；`build:check` 通过。
4. **门禁**：Node≥22 `build:check` + 受影响 `test`（diffParser/ContentImpactAnalyzer 单测，两路）+ 全量无回归 + `lint` + `npm run build`（重生 dist 供 maint-fix-plugin）。

## 跨仓与提交纪律
- 全 Core、additive、默认工作树行为不变；Plugin 侧（`CommitDrivenMaintenance.ts:82` 透传 `scan.range` + `FileChangeHandler.ts:165/275` git-head 传 commitRange + 订正 LP7:279 错误注释）= **maint-fix-plugin（本任务 landed 后派）**。
- 提交 main（无分支）；**不 push/tag/bump**；不碰 vendor；不动 LP7 逻辑（Plugin 侧）。

## 禁止
- 不改默认行为（默认=工作树 `git diff HEAD`）；不重开 LP7；不误扩 ContentImpactAnalyzer:117 unified 入口；不破坏 exports/位置参；不读写 git_diff_checkpoints。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/test/lint/build 输出、两路单测（默认零回归 + commit-range）、调用方 grep。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
