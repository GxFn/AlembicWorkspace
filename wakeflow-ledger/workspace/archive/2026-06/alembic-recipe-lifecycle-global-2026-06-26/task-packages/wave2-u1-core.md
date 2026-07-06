# 任务包 波2 · U1-Core — moduleMining 心脏接通（per-cell gap）+ moduleName canonical 派生（D1 方案A，Core 侧）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicCore**
- Wave: 波2 关键链起点（landed 解锁 U1-Plugin → U2a）。
- Baseline: AlembicCore@**b3a8d81**（U5-Core 后）。行号引自设计 U1 + 第二轮 A.U1 修正；落地前对当前 HEAD 复核。

## 身份门（先做）
确认目录=AlembicCore、任务属 AlembicCore。读 `../CLAUDE.md` + active index + state root（含本包 + `evidence/u0-rebaseline-2026-06-26.md`）+ 本仓 `CLAUDE.md`。

## 前置（控制器已确认，照此消费）
- **D1=方案A（CG-1 已决）**：module 来源 = canonical `ProjectMap.modules`（`ProjectContextMap.ts:155-164 ModuleSummary{id,name,...}` + `:252 modules[]`），**已在 Core**、不另造来源。本任务 Core 侧从 canonical 轴取 name/id；plugin 私有 seed 降级=U1-Plugin（后续）。
- **D2 通用默认表已控制器核验-ready**（`Design/docs/current/alembic-recipe-d2-default-table-2026-06-26.md`）：`perCellTarget` 回退默认 **S=5 / M=3 / L=2**；优先级 **`binding.targetRecipes ?? D2[tier]`**；tier 主信号=`ProjectMap.modules.length`。实现形态=默认常量 + env 覆盖 + guard（仿 `resolveStagingAccessSweepCap`）。
- **floor 语义已控制器核验**：recipe production floor = **per-维度**（`DEFAULT_FLOOR_PER_DIMENSION`，`completeness-critic.ts`）——与 per-cell **正交**。perCellTarget L=2 是 per-cell 首扫值，per-维度 floor 由跨模块聚合 + deepMining 多轮满足。**U1-Core 不得用 per-cell gap 把维度判 "covered"**（覆盖判定是 critic/U2a 职责）。

## 范围（Core 侧；U1-Plugin 透传/出口为后续）
| # | file:line（设计值，复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| #3 | `AlembicCore/src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts:73-199` | **extend（additive）** | `BuildKnowledgeRescanPlanOptions` 加**可选** `moduleBindings`；**仅当提供时**按 cell 算 `gap=max(0, perCellTarget − perCellCoverage)`、`createBudget` 落 cell 维度；**未提供时逐字段退回**现有 per-dimension（`TARGET_RECIPES_PER_DIMENSION=5`@:6）——保护 deepMining 零回归。`perCellTarget` 优先级 `binding.targetRecipes ?? D2[tier]`（**第二轮 A.U1：`targetRecipes` 运行时不保证非空，normalizePlanSelection 只校验 dimensions → 必 `??`**）。 |
| #4 | `KnowledgeRescanPlanBuilder.ts:235-264`（`buildCoverageByDimension`） | **defer→U2a** | 本阶段**不**升 per-cell 覆盖统计，只把**模块轴接进 gap 计算签名**。覆盖账本 per-cell 升级归 U2a。 |
| #5 | `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts:753`（moduleName 派生，第二轮 A.U1 真正派生点）+ submit 校验 | **add** | moduleName 优先从 candidate `sourceRefs` 落点的 canonical `ModuleSummary` 派生（与覆盖轴同源）；Agent 显式给时校验属已知模块轴；派生不出→留空+诊断（CG ②a required-or-derivable）。**注**：`project-context-anchoring.ts` 不是派生点（是 creation-guide），勿改那里。 |
| D3 | gap/coverage 链 | **reuse** | gap/coverage 函数集**不读写 `git_diff_checkpoints`**（符号级：函数集 0 命中，显式豁免合法读 checkpoint 的 `runRescanUnifiedEvolution`）。 |

## 验收（B 节 U1 Core-unit 可证伪部分；真机心脏透传 gated on U1-Plugin→后续/U7）
1. **Core 双路**[unit]：构造 `moduleA×dimX target=3`/`moduleB×dimY target=2` + 已知覆盖快照调 `buildKnowledgeRescanPlan(moduleBindings)` → 断言按 cell 给 gap/createBudget（区分 A 缺/B 满）；**不传 moduleBindings → 与 per-dimension(5) 逐字段 snapshot 一致**（回归保护 deepMining）。
2. **perCellTarget 优先级**[unit]：`binding.targetRecipes` 给值时用之；缺失时回退 D2[tier]（默认 S5/M3/L2 + env 覆盖 + guard）；tier 由 `ProjectMap.modules.length` 解析。
3. **moduleName 派生**[unit]：candidate sourceRefs 落已知模块 → 派生 moduleName==`ModuleSummary.name`；越界/派生不出 → 留空+诊断（不再恒空兜底）。
4. **floor 正交**[unit/核]：per-cell gap 逻辑不把维度判 "covered"（per-维度 floor 由 critic/U2a 判）；断言 per-cell 与 per-dimension floor 不互相污染。
5. **D3**[grep]：gap/coverage 函数集无 `git_diff_checkpoints` 读写。
6. **门禁**：Node≥22 `build:check` + `KnowledgeRescanPlanBuilder` 单测（per-cell/per-dimension 两路）+ `npm run test` 无回归 + `npm run lint` + `npm run build`（重生 dist 供 U1-Plugin）。

## 跨仓与提交纪律
- 全 Core、additive（新 `moduleBindings` 必 additive，flat `moduleScope` 兼容）；U1-Plugin（gate `moduleBindings` 出口 + knowledge-rescan 透传 + mcp-tools moduleName 引导 + plugin seed 降级引用 canonical）= 后续，**本任务不碰 Plugin**。
- 提交 main（无分支）；**不 push/tag/bump**；不碰 vendor；不动 staging/DecayDetector/ProposalExecutor（U4/U5 已 landed）。

## 禁止
- per-cell 仅当传 moduleBindings 时启用（旁路保护 deepMining，未传逐字段一致）；不破坏 exports/排序/持久化；不读写 git_diff_checkpoints；不把 perCellTarget 写成绕过 plan 的强制值（plan 优先、表是回退）；不在 Core 升 per-cell 覆盖统计（U2a）。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/test/lint/build 输出、各 [unit] 验收点测试名+结果、moduleName 派生证据、D3 grep、双路 snapshot 对比。**evidenceRefs 用 path-like 裸路径**（如 `AlembicCore/src/workflows/capabilities/planning/knowledge/KnowledgeRescanPlanBuilder.ts`）。完整性自检；证不足→blocked/needs-review。
