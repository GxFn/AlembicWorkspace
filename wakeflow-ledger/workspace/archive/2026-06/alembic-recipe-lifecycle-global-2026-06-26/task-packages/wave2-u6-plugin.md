# 任务包 波2 · u6-plugin — rescan 内容级保鲜 + audit 闭环（Plugin 消费侧 P4/P5）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core，**禁改 Core**——U6-Core 已 landed+dist 重生）
- 前置：**U6-Core 已接受+落地**（HEAD c60eb92，dist 已 `npm run build` 重生）——content_fp migration 014 + `#sourceContentFingerprint` + drift 检测(`findDrifted()`) + P6 `#resolveExistingSourceFile` 唯一 resolve 出口 + `repairRenames`(现 ~:544 走 `#sourcePathExists`)/`applyRepairs`(Core SourceRefReconciler 方法，**仍零 call site**) + audit→deprecate(EvolutionGateway 注入则激活)。
- Baseline: AlembicPlugin@**d68228c**（u5-plugin 后）。消费 Core@**c60eb92 或更新**（u5-core-2 可能并行 advance；回填记消费的 Core commit）。**落地前复核 HEAD 行号**。
- 权威依据：设计 §U6（287-312，尤 P4=296 / P5）+ **第二轮 C1(358)** + ⑤⑥验收(384) + gateway 已注册(`KnowledgeModule.ts:343`)。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U6 + tr-u6-core.json 的 producer 接口）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Plugin 消费侧；落地前复核 HEAD file:line）
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| P4 接活 rename 修复 | `lib/.../knowledge-index-rebuild.ts:91-112`（Plugin `reconcileSourceRefs`，**C1：接线点是此 Plugin 函数**，当前不调 repair） | **wire** | reconcile 后若 `report.stale>0` 依次调 Core `repairRenames()→applyRepairs()`（git rename→`renamed`→写回 .md+DB→active）。report 增 `renamed/applied` 并经 P5 透出。**幂等可重入**。 |
| P5 报告透出 + region-vector skip | `rebuildRescanIndexes`/rescan 响应 presenter | **extend** | wrapper 返回 report；region-vector provider 不可用→`status='skipped'`+**高可见 warning**、可用→`semantic_memories` 0→非 0。改返回类型须 grep 其它消费方同步。 |
| gateway 注入激活 audit | rescan container（`KnowledgeModule.ts:343` EvolutionGateway 已注册） | **wire** | 把 `evolutionGateway`（或 `proposalRepository`+`lifecycleStateMachine`+`knowledgeRepository`）注入 rescan/audit 调用点，使 U6-Core 的 `auditRecipesForRescan` dead→deprecate **真机激活**（不注入则 Core 降级 proposalsCreated=0）。**不新建服务**（用已注册的）。 |
| D2 batch護栏（携带项） | 指纹/rescan 扫描分批 | **add** | 指纹扫描/rescan 分批限流用 **D2 表 50/150/400**（S/M/L）——U6-Core reconcile 保持 caller-limited、cap 由本编排层供（同 DecayDetector.scanAll(cap) caller 供参模式）。 |
| drift 消费（P3 路径，按需） | `findDrifted()` 消费 | **wire/verify** | 若本卡接 P3 gate：drifted ref→经 gate 决 update/deprecate；否则确认 drifted 惰性不破现有状态机（findDrifted 已备，留 U7）。 |
| D3 | 全链 | **reuse** | 不读写 `git_diff_checkpoints`。 |

## 验收（设计 ⑤⑥；真机归 Test/U7，单测/集成本窗口）
1. **P4 rename 接活**[unit/集成]：git mv 被引用文件 + reconcile → ref 经 `repairRenames→applyRepairs` 自动 active+新路径、`report.renamed/applied>0`、**幂等**（重跑不重复）。**改前先 grep 确认 Core repair 方法零 call site**（接活死代码另一半）。
2. **P5 报告 + skip**[unit]：wrapper 返回 report；provider 不可用→`status='skipped'`+高可见 warning；可用→`semantic_memories` 0→非 0。
3. **audit→deprecate 激活**[unit]：注入 gateway 后，dead recipe→真产 deprecate proposal（source=metabolism 观察窗口，对接 U6-Core）；不注入→降级 proposalsCreated=0 不抛。
4. **D2 batch護栏**[unit]：分批 cap 取 50/150/400（按 tier）。
5. **零新回归 + 门禁**：Node≥22 `build:check`（记消费 Core commit）+ 全量 unit failed-set 与 baseline d68228c 无新增 + `lint:repo-boundary` + `lint:core-import-boundary` + `report:agent-extraction-boundary` 不新增违规；D3 grep。

## 跨仓与提交纪律
- 改本仓 live 源；**禁改 Core/vendor**（U6-Core 已 landed）；仅经 `@alembic/core` 包入口消费。提交 main 不 push/tag/bump。
- ⚠️ u5-core-2 可能并行 advance Core——`build:check` build 当前 ../AlembicCore；回填记消费的 Core commit。
- 多文件 wiring 量大→可 subagent-offload（主窗口 own 核验+提交+门禁，勿中途耗尽）。

## 禁止
- 不改 Core/vendor；不破坏 exports/排序/状态机/持久化；P4 必须幂等；P5 改返回类型须同步消费方；不读写 git_diff_checkpoints；不新建已注册的服务。

## 回填（TargetResultEnvelope）
完成范围、commit hash、**消费的 Core commit**、build:check/lint/unit 输出、P4 rename 接活(renamed/applied + 幂等)、P5 报告+skip、audit→deprecate 激活(注入+降级两路)、D2 batch護栏、零新回归 diff、D3 grep。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
