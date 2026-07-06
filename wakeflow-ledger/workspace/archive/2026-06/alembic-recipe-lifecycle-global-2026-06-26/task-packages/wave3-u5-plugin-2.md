# 任务包 波3 · u5-plugin-2 — embedding provider Plugin DI 接线（U5 #1 收口）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core，**禁改 Core**）
- 前置：**u5-core-2 已接受+落地+dist 重生**（Core@a96c4ee：ConsolidationAdvisor ctor 2nd / ProposalExecutor ctor 6th / RedundancyAnalyzer `options.embeddingSimProvider` 三处可选 `embeddingSimProvider?: EmbeddingSimProvider`，签名 `(a: RecipeLike, b: RecipeLike) => number | undefined`，缺省→纯 Jaccard）。本卡=把 Plugin 的 provider 喂进这三个 ctor，**激活 embedding 维度**。
- Baseline: AlembicPlugin@**6cf0a99**（u6-plugin 后）。消费 Core@**a96c4ee 或更新**。**落地前复核 HEAD 行号**。
- 权威依据：设计 §U5 #6（237）+ 跨仓 242（embedding 维度需 Plugin 注入 VectorService/RecipeRegionVectorIndex 到 RecipeSimilarity 调用点）+ 验收 249-250。**provider 草稿**：u5-plugin 期 subagent 已建+测（cosine + Jaccard 确定性回退），见 `target-results/tr-u5-plugin.json`——可复用/精炼，但主窗口须独立核验+亲跑门禁。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + tr-u5-plugin.json 的 provider 草稿 + tr-u5-core-2.json 的 ctor 签名）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Plugin DI 接线；落地前复核 HEAD file:line）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| provider 实现 | `lib/recipe-generation/.../`（新模块或 tr-u5-plugin 草稿落地） | **add** | 同步 `EmbeddingSimProvider`=`(a: RecipeLike, b: RecipeLike) => number | undefined`：用 **VectorService/RecipeRegionVectorIndex 预计算向量**查 a/b 区域向量→cosine；任一向量缺失→`undefined`（Core 回退 Jaccard）。**domain 不发起 embed**：provider 只读已算好的向量（index 已是预计算、sync 可行；若 index 需 async load 则在 DI 构造期预热，provider 本身同步）。 |
| DI 注入 ×3 | Plugin 容器构造 ConsolidationAdvisor / ProposalExecutor / RedundancyAnalyzer 的位置（KnowledgeModule / handlers/consolidate / evolve 等，**grep 构造点**） | **wire** | 把 provider 喂入三处 ctor 对应位（ConsolidationAdvisor 2nd 位置参 / ProposalExecutor 6th 位置参 / RedundancyAnalyzer `options.embeddingSimProvider`）。VectorService 不可用→不传（provider undefined 或传 undefined）→Core passthrough Jaccard（向后兼容）。 |

## 验收（设计 §U5 #6/#7 验收；真机端到端→U7）
1. **embedding 高于 Jaccard**[unit]：VectorService/index 可用 + 一对近义改写（低 token Jaccard、高向量相似）→ 经注入 provider 的服务算出 similarity **高于纯 Jaccard**（对照不注入）。
2. **缺省回退确定**[unit]：VectorService 不可用→provider 不喂/返 undefined→三服务 similarity=纯 Jaccard、`computeDimensions` 同入同出、**现有 evolution 单测全过**。
3. **三处接线**[grep/unit]：三服务 Plugin 构造点均喂入 provider（或可用性 gated）；签名匹配 Core a96c4ee 的 `EmbeddingSimProvider`。
4. **provider 真实**：用 VectorService/RecipeRegionVectorIndex（**非 stub**）；index 缺向量→undefined（不抛）。
5. **门禁**：Node≥22 `build:check`（记消费 Core commit）+ 全量 unit failed-set 与 baseline 6cf0a99 无新增 + `lint:repo-boundary`/`lint:core-import-boundary`/`report:agent-extraction-boundary` 不新增违规。

## 跨仓与提交纪律
- 改本仓 live 源；**禁改 Core/vendor**（u5-core-2 已 landed）；仅经 `@alembic/core` 包入口消费 ctor/类型。提交 main 不 push/tag/bump。回填记消费的 Core commit。

## 禁止
- 不改 Core/vendor；不破坏 exports/排序/状态机/持久化；provider 必须 VectorService-backed（非 stub）；不可用时回退 Jaccard（不抛、不退化为常数）；domain/service 不发起 embed（provider 只读预计算向量）。

## 回填（TargetResultEnvelope）
完成范围、commit hash、消费的 Core commit、build:check/lint/unit 输出、embedding>Jaccard unit、缺省回退确定性 unit、三处接线 grep、provider VectorService-backed 证据、零新回归 diff。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
