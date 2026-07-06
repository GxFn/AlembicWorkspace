# 任务包 波2 · u1-plugin-cont — U1-Plugin 续作 #2/#5/#6（#1 已 landed）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（消费 Core@**afd4302**，含 u1-core fe42940 的 moduleBindings/ModuleCellBinding + RecipeProductionGateway deps + #deriveModuleName）
- 前身：u1-plugin **#1 已 landed+accept**（f1dfcfc：PlanGenerationGateReady 加 top-level moduleBindings，flat moduleScope 出口字节不变）。本任务=#2 透传 + #5 注入 + #6 方案A，按上轮窗口自交 turnkey grounded 计划。landed→**解锁 U2a**。
- Baseline: AlembicPlugin@**f1dfcfc**。活副本；落地前复核 HEAD 行号。

## ⚠️ 上下文策略（窗口上轮已近饱和）
上轮窗口诚实交回 #2/#5/#6 因接近上下文饱和。本任务是多文件 wiring——**强制：用 subagent 承载 #2 的多文件 wiring（fresh subagent context，per-逻辑块验证）**，主窗口只汇总+提交+跑门禁，保主窗口上下文轻（见 context-saturation 处置惯例）。勿在主窗口中途耗尽留破损树。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（含本包 + 原包 `wave2-u1-plugin.md` + 上轮回填 `target-results/tr-u1-plugin.json` 的 turnkey 计划）+ 本仓 `CLAUDE.md`。

## 范围（按窗口 turnkey grounded 计划）
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| #2 透传 | `knowledge-rescan.ts:165-170`(analysis 调用) + `project-context-analysis.ts:29-37,90-128` | **extend** | 把 `gate.moduleBindings` 透传到 Core `buildKnowledgeRescanPlan(moduleBindings, moduleCount)` 驱动 per-cell gap。**关键适配（窗口已勘）**：Plugin `PlanSelectionModuleBinding`(per-module、`dimensions[]`) ≠ Core `ModuleCellBinding`(per-cell：`moduleId?`/`moduleName?`/`dimensionId` 单值/`perCellCoverage?`/`targetRecipes?`)——须把 per-module×dimensions **展平为 per-cell `ModuleCellBinding[]`**（每 module×dimension 一条）；`moduleCount`=canonical `ProjectMap.modules.length`。 |
| #5 注入 | `mcp-tools.ts:597,710`（RecipeProductionGateway 接入点） | **add** | 注入 deps `knownModuleNames`(canonical `ProjectMap.modules` 名集) + `resolveModuleFromSourceRefs`(从 `ProjectMap.modules` 路径前缀派生)，激活 Core 已就位的 `#deriveModuleName`(`RecipeProductionGateway.ts:306/791`)。 |
| #6 方案A | `project-context-analysis.ts:258-327` | **extend** | plugin 续派 seed 但**统一引用 canonical name/id**（**不退役 seed=方案B 拆独立需求**）。 |
| D3 | 透传链 | **reuse** | 不读写 `git_diff_checkpoints`。 |

## 验收（B 节 U1；真机 moduleName gated→U7）
1. **心脏透传**[unit]：≥2 binding（A dims=[x] target=3 / B dims=[y] target=2）经 gate → 透传后 `buildKnowledgeRescanPlan` 收到展平的 per-cell `ModuleCellBinding[]`（cellA×x target3 / cellB×y target2），驱动 per-cell gap；flat `moduleScope` 出口仍**字节不变**（回归断言，含 #1 的 lease key/attach）。
2. **展平正确**[unit]：per-module(dimensions[a,b]) → 2 条 per-cell ModuleCellBinding(dimensionId=a / =b)；moduleCount=ProjectMap.modules.length。
3. **moduleName 派生接通**[unit]：注入 knownModuleNames/resolveModuleFromSourceRefs 后，submit sourceRefs 落已知模块 → RecipeProductionGateway #deriveModuleName 派生非空 canonical 名；越界留空+诊断（真机落库验证归 U7）。
4. **方案A**：seed 引用 canonical name/id；未退役 seed。
5. **D3**[grep]：透传链无 `git_diff_checkpoints`。
6. **门禁**：Node≥22 `build:check`(消费 afd4302) + gate/rescan/mcp-tools 单测 + `lint:repo-boundary` + `report:agent-extraction-boundary` 不新增违规。

## 跨仓与提交纪律
- 改本仓 live 源；消费 Core@afd4302（已 build dist）。提交 main（无分支）；**不 push/tag/bump/不碰 vendor**；方案A（不走 B）。

## 禁止
- flat `moduleScope` 出口字节不变（moduleBindings additive、不拍扁）；不走方案B；不读写 git_diff_checkpoints；不碰死副本/shim；主窗口勿中途耗尽（subagent-offload 重 wiring）。

## 回填（TargetResultEnvelope）
完成范围、**commit hash**、build:check/lint/repo-boundary/unit 输出、心脏透传 unit（flat 字节不变 + per-cell 展平驱动 gap）、moduleName 派生 unit、D3 grep、subagent-offload 说明。**evidenceRefs 用 path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
