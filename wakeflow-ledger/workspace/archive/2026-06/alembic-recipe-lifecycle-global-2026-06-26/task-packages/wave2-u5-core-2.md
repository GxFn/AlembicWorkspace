# 任务包 波2 · u5-core-2 — embedding 注入 conduit（U5 #1 收口，Core 侧 additive hook）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**（live `../AlembicCore`，禁碰 vendor）
- 缘起：u5-plugin（needs-review）实现 #1 embedding 时**控制器独立证实的跨仓 conduit gap**——U5-Core(b3a8d81) 给 `RecipeSimilarity.compute/computeDimensions` 加了可选第3参 `embeddingSim?:number`（`src/domain/evolution/RecipeSimilarity.ts:133/150/156`，注入时 `max(tokenContent, embeddingSim)`），**但**：
  1. `RecipeSimilarity` 未从 `@alembic/core` 任何 subpath 导出（barrel 故意省 domain/evolution）；
  2. 3 个消费点全调 2 参、无注入位：`src/service/evolution/ConsolidationAdvisor.ts:567 #computeSimilarity`、`ProposalExecutor.ts:588`、`RedundancyAnalyzer.ts:117`；
  3. 这 3 服务 ctor **零** embedding/vector 注入字段（grep embeddingSimProvider/vectorService=0）。
  ⟹ Plugin 无 conduit 喂入 embedding。**这是 §U5 #6 原始 scope（design 237「注入算好的向量/相似度」+ 242「Plugin 注入 VectorService/RecipeRegionVectorIndex 到 RecipeSimilarity 调用点」）的未接通 seam，非新增 scope**。窗口守 Stop Card 正确拒 land 不可达投机 provider（已 revert）。
- Baseline: AlembicCore@**当前 HEAD**（u6-core 进行中，落地前复核行号；与 u6-core 文件不冲突——本卡只碰 evolution 服务，u6-core 碰 SourceRefReconciler/migration）。
- 权威依据：设计 §U5 #6（237）+ 跨仓 242 + 第二轮 C3(353)；canonical 形态见下。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（本包 + tr-u5-plugin.json 的 gap 分析 + 设计 §U5）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（Core 侧 additive hook；落地前复核 HEAD file:line）
**方案A（推荐，符合「domain 不发起 embed，注入算好的 sim」纯度）**：给 3 个消费服务加**可选** `embeddingSimProvider` ctor 选项，串到 compute 第3参。
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| h1 | `ConsolidationAdvisor.ts`(ctor + :567 `#computeSimilarity`) | **add(opt)** | ctor 加可选 `embeddingSimProvider?: (a: RecipeLike, b: RecipeLike) => number \| undefined`（**同步**，喂入预算好的相似度——`RecipeRegionVectorIndex` 已是预计算向量，sync cosine 可行；domain 不发起 embed）。:567 调用改 `compute(a, b, this.#embeddingSimProvider?.(a,b))`。 |
| h2 | `ProposalExecutor.ts`(ctor + :588) | **add(opt)** | 同 h1：ctor 可选 provider，:588 `compute(supersededLike, candLike, provider?.(...))`。 |
| h3 | `RedundancyAnalyzer.ts`(ctor + :117) | **add(opt)** | 同 h1：:117 `computeDimensions(a, b, provider?.(a,b))`。 |
| — | provider 缺省 | **compat** | provider 未注入→第3参 undefined→`compute` 走纯 Jaccard（**字节级向后兼容，现有单测不变**）。 |

- **不导出 RecipeSimilarity**（保 barrel 纯度）；conduit 走 ctor 注入（非导出叶子）。
- provider 签名取 RecipeLike→RecipeLike→number|undefined（与 compute 入参同源，C3 supersede 站点亦受益）。

## 验收（Core 侧自验；真机 embedding→U7）
1. **provider 接通**[unit]：构造一服务带 stub provider（返 0.9）+ 一对低 Jaccard recipe → 该服务内 similarity 走 `max(Jaccard, 0.9)`=0.9（高于纯 Jaccard）。
2. **缺省回退**[unit]：不注入 provider → 三服务 similarity = 纯 Jaccard（同入同出确定）、**现有 evolution 单测全过**（零回归）。
3. **additive**[grep/build]：exports/排序/状态机/持久化不变；`build:check` GREEN。
4. **签名一致**：三处 provider 同签名；compute 第3参语义不变（`max(tokenContent, embeddingSim)`）。

## 跨仓与提交纪律
- 改 live `../AlembicCore`（禁 vendor）；与 u6-core 文件不冲突（如撞则协调提交序）；提交 main 不 push/tag/bump。**Core landed+build dist 后**派 **u5-plugin-2**（Plugin DI 注入 VectorService/RecipeRegionVectorIndex-backed provider，provider 代码 subagent 已备，见 tr-u5-plugin）。

## 禁止
- 不导出 RecipeSimilarity（走 ctor 注入）；不破坏 exports/排序/状态机/持久化；provider 缺省必须字节级回退 Jaccard；不发起 embed（domain/service 只接收算好的 sim）；不碰 vendor。

## 回填（TargetResultEnvelope）
完成范围、commit hash、build:check/unit（provider 接通 + 缺省回退确定性）、additive grep、签名一致。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
