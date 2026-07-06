# 任务包 · Design — D2 通用默认表（CG-2，波2 前置）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window: **Design**
- 性质：Design 产出**规格/选项表**（option spec），不改产品码、不 mutate Wakeflow state、不 dispatch。完成后返回 TargetResultEnvelope（表 + 简短依据），控制器 intake 为 D2 权威供实现消费。

## 背景与决策（已闭合，照此执行）
§0 **D2 已决（CG-2）**：round 边界/阈值 = **Design 先给一张通用默认表（按真实项目规模自适应），实现侧只消费、不拍脑袋（no-guess）**；同时 plan 规模语义优先（**plan 规模语义 > 通用默认**，如 `binding.targetRecipes` 覆盖 perCellTarget）。本表是**回退默认**，不是硬编码。

## 要产出的表（覆盖以下消费点；每项给"按规模分档的默认值 + 简短依据 + 该项是否已有现存常量"）
| 消费点 | 用途 | 备注 |
|---|---|---|
| **U1 `perCellTarget`** | moduleMining per-(module×dimension) 目标 Recipe 数 | 优先 `binding.targetRecipes`，无则查本表；替代现 `TARGET_RECIPES_PER_DIMENSION=5` 锁死 |
| **U2 deepMining round** | ① 收益递减阈值 K（`new_recipes_this_round < K` 停）② 轮次上限 maxRounds ③（可选）单轮 cell 预算 | 多轮覆盖增量的停止条件 |
| **U2/U1 perCell gap** | 空白/单薄格判定的覆盖目标 | 与 perCellTarget 一致 |
| **U6 内容指纹批量护栏** | rescan 内容重校验单次批量上限（大项目分批） | 防全量扫描卡顿 |
| **U3 rescan 预算** | rescan briefing inline 预算（如 18KB）/ compact 阶梯 | 现与 cold-start 同源常量；规模派生可作后续不阻塞 |
| **UM created 退役阈值** | （多已退役）created 诊断相关 | 若无实义可注明"无需" |
| （仅注明，无需定）**U4 decay round/cap** | 已复用 `resolveStagingAccessSweepCap`(默认50)、CG-7 实测驱动 | **现存，注明即可，不必新定** |
| （仅注明）**U5 merge 门禁/相似度** | HIGH_OVERLAP=0.65 / ENHANCE=0.4 / FP=0.4 | **现存有意阈值勿改，注明即可** |

## 规模分档建议
按一个**项目规模信号**（如 canonical `ProjectMap.modules` 模块数 / active source_ref 数 / 候选规模）分 小/中/大 三档（或你建议的更合适分档），给每档的默认值。说明分档信号来源（projectContext 基础能力，勿另造）。

## 约束
- **no-guess 边界**：你只给"通用默认表 + 依据"；实现侧消费、plan 规模语义优先。不要把默认表写成硬编码强制值（它是回退）。
- 不改产品码/不跑构建/不 mutate 状态根；产出为 Design 文档（`Design/docs/current/` 下，design key 关联本需求）+ 返回表内容供 intake。
- 已现存的阈值（U4 cap / U5 overlap·FP）**只注明、不重定**，避免与有意分叉冲突。
- 波1 不依赖本表；本表是 **U1-Core / U2 / U6 批量护栏** 的前置，控制器 intake 后供 U1-Core 等消费。

## 回填（TargetResultEnvelope）
D2 默认表（分档 × 各消费点的值 + 依据）、规模分档信号说明、哪些项是"现存只注明"、Design 文档路径。**evidenceRefs 用 path-like 裸路径**（如 `Design/docs/current/...`）。完整性自检：覆盖全部消费点；缺则标注待澄清。
