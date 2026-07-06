# 任务包 波2 · u5-plugin — evolution OUTCOME 质量（Plugin 消费侧）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core，**禁改 Core**——Core 侧 U5 已 landed）
- 前置：**U5-Core `b3a8d81` 已接受+落地**（evolution OUTCOME：evaluateMerge 分流、mergePatch、退伪成功、destructive 退役 skipped、embeddingSim 维度、supersede 选最相似）。本卡=U5 的 **Plugin 消费侧**：把 Core 暴露的注入点接活。
- Baseline: AlembicPlugin@**ecded14**（U1-Plugin 全 landed 后）。消费 Core@**afd4302**（含 b3a8d81）。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U5（224-255，尤其 6/7 行 237-238、跨仓 242、验收 249-250、依赖 255）+ 403 行 U5-Plugin 行 + 第二轮 C3(353)**。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U5）+ 本仓 `CLAUDE.md`。声明 window/repo 身份。

## 范围（Plugin 消费侧；落地前复核 HEAD file:line）
| # | 点 | change | 怎么改 |
|---|---|---|---|
| #1 embedding 注入 | RecipeSimilarity 调用点（Core `RecipeSimilarity.ts:261-283,119-125` 已加可选 `embeddingSim` 维度，domain 层不发起 embed） | **wire** | Plugin 把 **VectorService/RecipeRegionVectorIndex** 注入 RecipeSimilarity 调用点（算好的向量/相似度喂入），激活 embeddingSim。embedding 不可用→回退 Jaccard（确定性下限，`computeDimensions` 同入同出）。 |
| #2 subscribeToSignals | `KnowledgeModule`（ServiceMap 注入 + 信号接线） | **wire** | 按 U5-Core 暴露的 evolution 信号接线（**先核现状**：lifecycle-automation-followup 已接一次性 subscribeToSignals；本卡只补 U5 新增信号/注入，不重复接线、不破坏既有）。 |
| #3 supersede 选定消费 | Core `RecipeProductionGateway.ts:658-690`/`ProposalExecutor.ts:461-464`（#7 已在 Core 选最相似） | **verify/consume** | 确认 Plugin 消费 `replacedByRecipeId`/`deprecated_by` 边按相似度最高选定（C3：Gateway 选、executor [0] 自然解析）；Plugin 侧若有镜像/缓存需同步。 |
| #4 content-patcher 红 | `test/unit/content-patcher.test.ts`（**当前 RED**） | **fix** | =U5-Core destructive 退役（自然语言≥20 字符→skipped+skipReason、content byte-unchanged，替今静默覆盖）的**跨仓测试漂移**。把 Plugin 测试对齐 Core ContentPatcher **新契约**（非改产品码回旧行为）。 |

## 验收（设计 §U5 验收 6/7 + 跨仓；真机 evolution→U7）
1. **embedding 可用+回退**[unit]：VectorService 可用→一对近义改写相似度 **高于纯 Jaccard**；不可用→回退 Jaccard、`computeDimensions` 确定（同入同出）、**现有单测仍通过**。
2. **supersede 选定**[unit]：≥2 新建 supersede 一个旧 Recipe→`replacedByRecipeId` 与 `deprecated_by` 边指**相似度最高者**而非 `createdIds[0]`。
3. **content-patcher 转绿**[unit]：`content-patcher.test.ts` GREEN（对齐 U5-Core 新契约：destructive→skipped+skipReason、content byte-unchanged）。
4. **零新回归**：全量 unit failed-set 与 baseline ecded14 diff——**content-patcher 应从 failed-set 移除**，无新增失败。
5. **门禁**：Node≥22 `build:check`（打印消费的 Core commit）+ `lint:repo-boundary` + `lint:core-import-boundary` + `report:agent-extraction-boundary` 不新增违规。

## 跨仓与提交纪律
- 改本仓 live 源；**禁改 Core/vendor**（U5-Core 已 landed）；仅经 `@alembic/core` 包入口消费。提交 main（无分支）；**不 push/tag/bump**。
- ⚠️ U6-Core 可能并行 advance Core HEAD——`build:check` 会 build 当前 ../AlembicCore；回填**记录消费的 Core commit hash**（build:check 输出 `Core build used ...`）。

## 禁止
- 不改 Core/vendor；不破坏 exports/排序/状态机/持久化；embedding 不可用时数值不退化（回退 Jaccard 而非报错）；不为过测试改回 ContentPatcher 旧行为（对齐新契约）；不重复 subscribeToSignals 接线。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、**消费的 Core commit**、build:check/lint/unit 输出、embedding 高于 Jaccard + 回退确定性 unit、supersede 选最相似 unit、content-patcher 转绿（failed-set 对比证移除）、零新回归 diff。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
