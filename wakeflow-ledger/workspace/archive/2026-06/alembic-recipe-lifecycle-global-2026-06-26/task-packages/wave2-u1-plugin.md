# 任务包 波2 · U1-Plugin — moduleMining 心脏 Plugin 侧（消费 u1-core Core，续最长链）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（经 `file:../AlembicCore` 消费 Core@**fe42940**=u1-core）
- Wave: 波2；u1-core 已 landed+accept → 本任务解锁；landed 后**解锁 U2a**。
- Baseline: AlembicPlugin@**0fa2ac3**。行号引自设计 U1（Plugin 侧）+ 第二轮 A.U1；落地前复核 HEAD。活副本（`lib/recipe-generation/*`，死 shim 勿改）。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（含本包 + `evidence/u0-rebaseline-2026-06-26.md` 活/死副本图谱）+ 本仓 `CLAUDE.md`。

## 前置（u1-core 已落，本任务消费）
u1-core(fe42940) 已在 Core：`KnowledgeRescanPlanBuilder` 加可选 `moduleBindings`(+moduleCount) → per-cell gap/cellPlans（perCellTarget=binding.targetRecipes ?? D2[tier] S5/M3/L2+env+guard）；`RecipeProductionGateway` 加可选 deps `knownModuleNames` + `resolveModuleFromSourceRefs` + `#deriveModuleName`（未注入则 passthrough 向后兼容）。**本任务=Plugin 侧出口/透传/注入，使上述 Core 能力在真实链路生效。**

## 范围（Plugin 活副本；D1=方案A）
| # | file:line（设计值，复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| #1 | `plan-generation-gate.ts:49-64`(`PlanGenerationGateReady`)+`:255-306`(`buildPlanGenerationGateReady`) | **extend（additive）** | `PlanGenerationGateReady` 加 `moduleBindings`（直接复用 `gate.planSelection.moduleBindings`，零新派生）；`buildPlanGenerationGateReady` 一并产出。**必 additive**：保留 flat `moduleScope`，lease key(:319-321)/`attachPlanGenerationGateData`(:396-405)/creationGuide **字节不变**（仍依赖 flat `moduleScope:string[]`）。 |
| #2 | `knowledge-rescan.ts:165-170` + `project-context-analysis.ts:29-37,90-128` | **extend** | 调用处把 `planGate.moduleBindings` 透传进 analysis → `buildKnowledgeRescanPlan(moduleBindings)`（驱动 u1-core per-cell gap）；per-(模块×维度) 意图随 moduleSeeds 带到 briefing。 |
| #5 | `mcp-tools.ts:597,710` + RecipeProductionGateway 接入点 | **add** | 向 `RecipeProductionGateway` 注入 `knownModuleNames` + `resolveModuleFromSourceRefs`（从 canonical `ProjectMap.modules`/`ProjectContextMap` 取 name/id + 路径前缀派生），激活 u1-core 的 `#deriveModuleName`；moduleName submit 引导。 |
| #6 | `project-context-analysis.ts:258-327`（D1 散落点） | **方案A** | plugin 续派 seed 但**统一引用 canonical name/id**（不退役 seed=方案B 拆独立需求）。 |
| D3 | 透传链 | **reuse** | 透传/出口链不读写 `git_diff_checkpoints`。 |

## 验收（B 节 U1；真机用 ALEMBIC_HOME 沙箱/Node22）
1. **心脏透传**[unit]：≥2 binding（A dims=[x] target=3 / B dims=[y] target=2）经 gate → `PlanGenerationGateReady` 同时含 flat `moduleScope` 与 `moduleBindings[]`，逐 binding dimensions/targetRecipes **非空、未被拍扁**；flat 出口 lease key/attachPlanGenerationGateData **字节不变**（回归断言）。
2. **module 来源接地**[unit/真机]：注入的 knownModuleNames/resolveModuleFromSourceRefs 来自 canonical `ProjectMap.modules`；对含 `Package.swift`/`package.json` 项目，moduleName 取数与 Core repo/map 一致。
3. **moduleName 真机**[gated→U7/真机]：提交 sourceRefs 落已知模块的 recipe → `knowledge_entries.moduleName` 非空且=canonical 名（真机验证归后续 Test/U7；本任务出 unit + wiring 证据）。
4. **D3**[grep]：透传/出口链无 `git_diff_checkpoints`。
5. **门禁**：Node≥22 `build:check`（消费 Core@fe42940）+ gate/rescan 单测 + `lint:repo-boundary` + `report:agent-extraction-boundary` 不新增违规。

## 跨仓与提交纪律
- 改本仓 live 源；消费 Core@fe42940（已 build dist）。提交 main（无分支）；**不 push/tag/bump/不碰 vendor**；方案A（不退役 seed）。

## 禁止
- flat `moduleScope` 出口必字节不变（新 moduleBindings additive，不拍扁）；不走方案B（seed 退役拆独立需求）；不读写 git_diff_checkpoints；不动死副本/shim。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/lint/repo-boundary/unit 输出、心脏透传 unit（flat+moduleBindings 并存、flat 字节不变）、moduleName wiring 证据、D3 grep。**evidenceRefs 用 path-like 裸路径**（如 `AlembicPlugin/lib/recipe-generation/plan-generation-gate.ts`）。完整性自检；证不足→blocked/needs-review。
