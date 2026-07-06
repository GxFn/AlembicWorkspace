# 任务包 波2 · u6-core — rescan 内容级保鲜 + audit 闭环（Core 侧 producer）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（live `../AlembicCore`，**禁碰 vendor**：vendor 478 行 vs live 632 行）
- 解锁前提已满足：**UM advance 已证**（test-um-after-regression/committed→propose E2 PASS）+ **U5 门禁分流 landed**（u5-core b3a8d81：evaluateUpdate no-usage 仍 fail）+ **D2 表已接受**（fingerprint batch 50/150/400）。
- Baseline: AlembicCore@**afd4302**（设计引 d49fc05，Core 已 advance 过 u1-core fe42940 / maint-fix-core afd4302；U6 断点「content_fp 缺列」仍 HOLD）。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U6（287-312）+ 第二轮对抗核验 C4(361)/C1(358) 订正 + readiness banner(29) + ④验收(384) + CG⑥a/⑥b(312/448)**。本卡=U6 的 **Core 侧**（P4/P5 是 Plugin 函数 knowledge-index-rebuild.ts:91-112，归 U6-Plugin）。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U6）+ 本仓 `CLAUDE.md`。声明 window/repo 身份。

## 范围（Core 侧；落地前复核 HEAD file:line）
| # | file:line（复核 HEAD afd4302） | change | 怎么改 |
|---|---|---|---|
| P2 migration | `recipe_source_refs` schema | **add** | migration 增 `content_fp TEXT`（源文件 region 内容指纹，可空）。 |
| P2 指纹算法 | 新增 `#sourceContentFingerprint`（SourceRefReconciler） | **add** | **独立于 `computeKnowledgeHash`**（`KnowledgeFileWriter.ts:490` 是 .md 全文 SHA-256，**绝不复用/不互调**）：读 resolved 源文件→按 `:startLine-endLine` 截 region（无行号则全文）→normalize→SHA-256 切 16 hex。 |
| P2 接入 | `SourceRefReconciler.ts:303-321 #reconcileSourceRef`（**C4 订正：非 332-389**）+ `#updateExistingSourceRef:342-368` | **extend** | exists=true 时比对 `content_fp`：不变→active 续期；变化→`status='drifted'`（或 active+driftedFp 标记）+ 记 `verified_at`。drifted 经 P3 gate 决 update/deprecate。 |
| P6 resolve 统一 | `SourceRefReconciler.ts:440`(repairRenames 裸 `path.resolve`) vs `332-340/581-607`(`#resolveSourcePath`) | **extend** | repairRenames:440 改走 `#resolveSourcePath`(ProjectScope-aware)+`sourcePathFilesystemCandidates`(line-suffix strip)，与 `#sourcePathExists` 同套；P2 指纹读文件复用同一 resolve 出口→reconcile/repair/fingerprint 三处口径一致。 |
| audit→Gateway | dead recipe→deprecate（替硬编码 0） | **extend** | dead recipe→`type='deprecate'` proposal、`auditSummary.proposalsCreated` 反映真实数（替今硬编码 0）。EvolutionGateway 已存在，不新建服务。 |
| D3 | `git_diff_checkpoints` | **decision** | 内容指纹/drift 状态只写 `recipe_source_refs.content_fp`，**绝不写/读 `git_diff_checkpoints`**；P1 非 commit 重校验是平行触发源（本卡不做 P1 编排）。 |

**CG 固化（不可偏离）**：
- **⑥a 首轮 null→首填只回填不改 status**（否则首次升级全量误判 drifted）。
- **⑥b dead→deprecate 进 observation-window**（非 immediately-executed；废弃=改可见行为，保守）。
- 消费 **D2 fingerprint batch 护栏 50/150/400**（指纹扫描分批限流参数取 D2 表）。

## 验收（设计 ④ + B 节；Core 侧自验，真机 drift→U6-Plugin/U7）
1. **指纹独立**[unit]：`#sourceContentFingerprint` ≠ `computeKnowledgeHash` 且**互不调用**（同一 .md 两函数产出不同）。
2. **migration + 回填**[unit/集成]：migration 后 `recipe_source_refs` 出现 `content_fp` 列；对 active ref 回填（**首填 null→只回填不改 status**，CG⑥a）。
3. **drift 触发**[unit]：改 region 内容→对应行 `status='drifted'`+`content_fp` 变+`verified_at` 刷新；仅改 region **之外**同文件其它行→该 region ref 保持 active 不误报。
4. **P6 口径统一**[unit/grep]：repairRenames:440 走 `#resolveSourcePath`；reconcile/repair/fingerprint 三处同一 resolve 出口。
5. **audit→deprecate**[unit]：dead recipe→`type='deprecate'` proposal>0 进 **observation-window**（CG⑥b）、`auditSummary.proposalsCreated` 非硬编码 0。
6. **D3**[grep]：U6 改动文件零 `git_diff_checkpoints` 读写。
7. **门禁**：Node≥22 `build:check`（tsc）+ 受影响域定向 unit + 不破坏 exports/排序/状态机/持久化（additive）。

## 跨仓与提交纪律
- 改 live `../AlembicCore`（**禁碰 vendor**）；**分阶段提交**（migration / 指纹算法 / P6 / audit 可分 commit，先改先验先 commit）；提交 main（无分支）；**不 push/tag/bump**。Core landed+build dist 后才解锁 U6-Plugin（P4/P5）。

## 禁止
- 不复用/不互调 `computeKnowledgeHash`；不写/读 `git_diff_checkpoints`（D3）；首填 null 不改 status；dead→deprecate 不得 immediately-executed；不破坏 exports/排序/状态机/持久化；不碰 vendor；不做 P4/P5（U6-Plugin）。

## 回填（TargetResultEnvelope）
完成范围、**各 commit hash**、build:check/unit 输出、指纹独立 unit、migration+回填（首填不改 status）、drift 触发（region 内/外对照）、P6 口径 grep、audit→deprecate observation-window、D3 grep。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
