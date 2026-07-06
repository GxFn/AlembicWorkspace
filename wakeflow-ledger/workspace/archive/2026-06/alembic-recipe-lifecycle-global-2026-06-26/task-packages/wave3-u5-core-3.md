# 任务包 波3 · u5-core-3 — embedding 全激活（U5 #6/#7 收尾：2 调用点保留 recipe id）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（live `../AlembicCore`，禁碰 vendor）
- 缘起：u5-plugin-2（已接受）把 embedding-sim provider 接进 3 服务 ctor，但**控制器逐行证实** embedding 仅在 RedundancyAnalyzer:131（直传带 id 的 recipe）LIVE；ProposalExecutor:601 用 `#toRecipeLike`（:614-629 返回对象**无 id**）、ConsolidationAdvisor:589 hand-built candidateLike（**无 id**）→ provider 须运行时 id 查预计算向量、禁 on-the-fly embed → 这 2 处恒 undefined→Jaccard（dormant）。本卡=让这 2 处传带 id 的对象，**激活余 2 站点**（provider 已接线、id 流通即活，**无需再 Plugin 工作**）。=§U5 #6/#7 原始 scope 收尾（embedding 应在所有 RecipeSimilarity 调用点），非新增。
- Baseline: AlembicCore@**a96c4ee**（u5-core-2 后）。**落地前复核 HEAD 行号**。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（本包 + tr-u5-plugin-2.json 的 dormancy 分析 + tr-u5-core-2.json conduit）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Core 微调 additive；落地前复核 HEAD file:line）
| # | file:line（复核 HEAD a96c4ee） | change | 怎么改 |
|---|---|---|---|
| t0 RecipeLike 类型 | `RecipeSimilarity.ts` RecipeLike 定义 | **add(opt)** | 若 RecipeLike 无 id：加可选 `id?: string`（additive，provider 运行时按 id 查向量；不影响相似度计算本身）。 |
| t1 ProposalExecutor | `#toRecipeLike`(:614-629) + 入参类型 | **extend** | 返回对象加 `id: e.id`（入参 `e` 类型加 `id?: string`；调用处 superseded/cand 是 recipe 实体、运行时带 id）。 |
| t2 ConsolidationAdvisor | `#computeSimilarity`(:567-589) candidateLike/recipeLike | **extend** | candidateLike 带 candidate 的 recipe id（CandidateForConsolidation 的 id/recipeId 字段，复核实际字段名）、recipeLike 带 RecipeSummary.id。 |

- 仅"让 id 流通"，**不改相似度算法/不改 compute 第3参语义/不发起 embed**。provider 在 Plugin 侧（本卡不碰）。

## 验收（Core 侧自验；真机 embedding>Jaccard 端到端→U7）
1. **id 流通**[unit]：注入一个**按 id 返值**的 stub provider（如 id 命中→0.9），构造带 id 的 superseded/cand（ProposalExecutor）与 candidate/recipe（ConsolidationAdvisor）→ 该 2 站点 similarity 现走 `max(Jaccard, 0.9)`（证 provider 被以带 id 对象调用、不再恒 undefined）。
2. **缺省/无 id 回退**[unit]：provider 未注入 或 对象无 id → 纯 Jaccard（确定性，现有 evolution 单测全过）。
3. **additive**[grep/build]：RecipeLike id 可选、exports/排序/状态机/持久化不变；`build:check` GREEN。
4. **RedundancyAnalyzer 不回归**：其 :131 既有 live 路径不变。

## 跨仓与提交纪律
- 改 live `../AlembicCore`（禁 vendor）；提交 main 不 push/tag/bump；build 重生 dist（供 Plugin 消费）。**本卡完成 → U5 embedding 全 3 站点激活（wiring 层），真机生效验证→U7**。

## 禁止
- 不改相似度算法/compute 语义；不发起 embed（只让 id 流通）；不破坏 exports/排序/状态机/持久化；不碰 vendor；不碰 Plugin。

## 回填（TargetResultEnvelope）
完成范围、commit hash、build:check/unit（id 流通 stub-by-id + 缺省回退 + RedundancyAnalyzer 不回归）、additive grep。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
