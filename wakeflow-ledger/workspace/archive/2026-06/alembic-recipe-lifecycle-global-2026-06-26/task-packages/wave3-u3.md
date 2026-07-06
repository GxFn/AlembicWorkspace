# 任务包 波3 · u3 — rescan/deepMining/moduleMining 输出预算化对齐（leaf，几乎独立）

- Demand: `alembic-recipe-lifecycle-global-2026-06-26`（伞形）
- Window/Repo: **AlembicPlugin**（**零改 Core**；Core 仅只读核验 data 形状）
- 缘起：coldstart-repair P2 只覆盖 `cold-start.ts` 的输出预算化；rescan/deepMining/moduleMining 未对齐（wave1 leaf，遗漏未派）。本卡=抽共享预算步骤 + 对齐三 stage。
- Baseline: AlembicPlugin@**b04cb0d**（u4-plugin 后）。消费 Core@当前 HEAD（只读）。**落地前复核 HEAD 行号**。
- 权威依据：设计 `Design/docs/current/alembic-recipe-lifecycle-global-2026-06-26.md` **§U3（167-181）**。

## 身份门（先做）
确认目录=AlembicPlugin、任务属 AlembicPlugin。读 `../CLAUDE.md` + active index + state root（本包 + 设计 §U3 + coldstart-repair P2 的 cold-start.ts 预算化先例）+ 本仓 `CLAUDE.md`。声明身份。

## 范围（按设计 §U3 表；落地前复核 HEAD file:line）
| # | file:line（复核 HEAD） | change | 怎么改 |
|---|---|---|---|
| 1 共享步骤 | `lib/recipe-generation/host-agent-workflows/briefing-budget.ts`（**新文件**） | **add** | 抽 stage-无关 `budgetBriefingResponseData(response, {dataRoot, projectRoot, transportName, inlineBudgetBytes, compact?, attachRef})`：读 `response.data`→`jsonByteLength` 测量→≤预算 `removeTransientTransportIfPresent`+inline 回填 / >预算 `writeTransientTransport(transportName)`+可选 compact 回调+`attachRef` 写 meta。复用 `#shared/transient-transport.ts` 原语；**compact 阶梯作回调注入、不下沉**。 |
| 2 cold-start 改调 | `cold-start.ts:434-461,270` | **refactor** | `budgetColdStartResponseData` 改调共享步骤（transportName='bootstrap-briefing'、18KB 预算、compact=compactColdStartBriefing、attachRef 写 `meta.fullBriefingRef`）。**行为快照前后逐字段一致=硬验收**。 |
| 3 rescan 预算 | `knowledge-rescan.ts:245-268`(`buildRescanResponse`) | **extend** | 在所有 `attach*`（unifiedEvolution/trashArchive/projectSelectionMismatch）**之后**调 `budgetBriefingResponseData(...,transportName='rescan-briefing', attachRef 写 meta.fullBriefingRef)`。**沿用 `fullBriefingRef` 命名→零改 `core-tools/output.ts` allowlist**（若改名须同步 ALLOWED_CLEAN_META_KEYS:94 + output-contract.ts:35-36）。 |
| 4 moduleMining 计数 | `knowledge-rescan.ts:322-379`(`buildRescanBriefing`) | **extend** | moduleMining（`planGate.moduleScope` 非空 / `generationStage==='moduleMining'`）调已导出 `attachPlanScopeTargetCounts(briefing,{moduleScope,sourceFileFacts})`，与 `cold-start.ts:290` 对称。**遵 D1：moduleScope/模块轴来自 projectContext(`sourceFileFacts`)，不另造来源。deepMining 不调用。** |
| 5 describe | `mcp-tools.ts:1149,1071` | **extend** | `RescanInput.generationStage`/`BootstrapInput.generationStage` 补 `.describe()`（stage 语义 + fullBriefingRef 预算行为）。**纯文案。** |
| 6 recipe-map | `handlers/recipe-map.ts` + `AlembicRecipeMapOutput.ts:206`(`meta.fullMapRef`) | **不做（decision）** | recipe_map `meta.fullMapRef` 声明但从未写入（grep 0）；是否纳入共享步骤=**用户/Design 决，本卡不默认做**（越过 rescan-only 边界）。 |

## 验收（设计 §U3）
1. **共享步骤抽出**[unit]：`budgetBriefingResponseData` ≤预算→inline+无 transient / >预算→writeTransientTransport+attachRef meta；compact 回调被调。
2. **cold-start 行为不变**[unit/快照]：`budgetColdStartResponseData` 改调后**前后逐字段一致**（行为快照硬验收）。
3. **rescan 预算生效**[unit]：buildRescanResponse 在 attach* 后预算化；≤18KB inline / >预算 transient+`meta.fullBriefingRef`；output.ts allowlist 不改（fullBriefingRef 复用）。
4. **moduleMining 计数对称**[unit]：moduleMining 调 attachPlanScopeTargetCounts、deepMining 不调；moduleScope 来自 sourceFileFacts（D1）。
5. **门禁**：Node≥22 `build:check`（记消费 Core commit）+ 全量 unit failed-set 与 baseline b04cb0d 无新增 + `lint:repo-boundary`/`lint:core-import-boundary`/`report:agent-extraction-boundary` 不新增违规 + output-contract 不破。

## 跨仓与提交纪律
- **零改 Core**（仅只读核验 `KnowledgeRescanPresenters.ts:189-232` data 形状）；改本仓 live 源；提交 main 不 push/tag/bump。回填记消费 Core commit。

## 禁止
- 不改 Core/vendor；不做 item 6 recipe-map（用户/Design 决）；compact 不下沉（回调注入）；不改 output.ts allowlist（fullBriefingRef 复用）；cold-start 行为须逐字段一致；不破坏 exports/排序/持久化。

## 回填（TargetResultEnvelope）
完成范围、commit hash、消费 Core commit、build:check/lint/unit 输出、共享步骤 unit、cold-start 行为快照一致、rescan 预算 unit、moduleMining 计数对称、零新回归 diff、output-contract 核验。**evidenceRefs path-like 裸路径**。完整性自检；证不足→blocked/needs-review。
