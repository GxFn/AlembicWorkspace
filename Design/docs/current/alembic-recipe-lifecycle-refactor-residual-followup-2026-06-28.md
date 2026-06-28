# Recipe 生命周期架构重构 — 完成后真实校验 + 残留修复矫正 follow-up — 需求设计(strict)

Date: 2026-06-28
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28
Scope: AlembicCore + AlembicPlugin + Alembic 主体（+ 一处文档）
Grounding: 3-agent post-completion 审计（决策/不变量/freeze · host-in-process coverage parity 真伪 · 逐阶段+残留），全 file:line 接地

## 触发与定位

架构重构 [[alembic-recipe-lifecycle-naming-layering-refactor]] 已 **COMPLETE + ARCHIVED**（state root rev 272，71 targetTasks 全 accepted）**且已 push**（四仓 HEAD==origin/main：Core `edd79d2`/Plugin `68d1e39`/主体 `4dd8083`/Agent `e26f044`）。用户要求对真实代码 vs 需求本身做校验、产残留修复需求。3-agent 审计结论：**核心高度成功——所有 frozen 决策 + 6 硬门不变量在 codex P1-P15 大量 repair churn 中干净存活**；但有若干真实残留，**两个 HIGH**。本需求 = refactor 的 post-completion 真实校验 + 残留修复矫正（不重做已成功的主体）。

## 1. 审计结论：什么是真做对了（证据，非橡皮图章）

| 项 | 结论 | 证据 |
|---|---|---|
| cold-start-coverage=不写 | ✅ OK | coldStart 只 `runFullResetPolicy`→clear，measured sink `CoverageLedgerWrite.ts:61` 仅 deepMining/moduleMining/dimComplete 可达；`CleanupService.ts:146-147`(9d703a3) clear-only 无 grade 晋级 |
| moduleMining 收敛 binding-rich | ✅ **真收敛** | 旧两 selector 已删(25a86ee)；唯一 `ModuleMiningSelection.ts:20 selectProjectIndexModuleMiningModules`(plannedDimensions :58-77)；Entry B `KnowledgeRescanWorkflow.ts:678-683` 现传 bindings、不再丢 plannedDimensions（行为变更已生效） |
| R-2 cleanup.projectRoot ternary | ✅ 完整(迁移) | verbatim `ProjectIndexPlan.ts:68 executor==='host-agent'?dataRoot:projectRoot`(full)/`:97 dataRoot`(incremental)；full-reset repair(af4d976/9d703a3)未改 root 选择 |
| FREEZE 字面量 | ✅ 字节级未变 | PlanStageId `contracts.ts:1`、job kind/source `RuntimeContracts.ts:44`、response.tool `tools.ts:291/306/352`、coverage_ledger 列、export path 全在；`alembic_index/build` 零命中 |
| per-host orchestrator split | ✅ 无跨宿主单函数 | Plugin `project-index.ts:33` + 主体 `ProjectIndexWorkflow.ts:62` 各自 `(mode)` 三 overload、无 `{executor}`；round 循环 `DeepMiningRoundGate.ts:29` 是 caller 不吸收；R1 别名齐 |
| P1 RG9 stub 删 | ✅ DONE | e99e84f 删 7 真死 stub，零悬空 import（doc"20"是高估，真死集=7） |
| P2 freeze register | ✅ DONE | `wakeflow-ledger/AlembicWorkspace/recipe-lifecycle-freeze-register-2026-06-28.md`(38 字面量) |
| P3 AppRuntime | ✅ DONE | `Bootstrap.ts:37 class AppRuntime`，4 消费者全改，compat alias :260 留 |
| P11/P12/P13 命名+收敛 | ✅ DONE | P13 IDEAgent→HostAgent 全是有意 R1 compat alias（Core `Types.ts:224` 注释）、smoke-public-api gate 过 |
| 真 BiliDili parity | ✅ **真过(单形态)** | 16==16 真集合相等、fail-closed predicate(0 target 行→强制 fail)、归档证据诚实（scary blocked 是 16:35 被取代中间态，completed 是 20:32 host-route 修后）；DB 健康(integrity ok，3 grade-A recipe，sessions=0，rounds=2) |
| 四仓 push 态 | ✅ 已推送 | HEAD==origin/main 0 ahead（早期"未推送"已 push） |

## 2. 残留清单（真实校验发现，分级 + file:line + 修复方向）

### 🔴 R-1 [HIGH·载重] 双宿主覆盖 module-id 派生未真正统一——parity 只在「空 ProjectMap」形态成立
- **现象**：host 与 in-process 写 coverage_ledger 的 module-id key 派生**不对称**：in-process `ProjectContextWorkflowFacts.ts:269`→`buildProjectMapModules`(`ProjectMapModules.ts:17` **plain `module.id`**，仅 map 空时才 fallback target-scoping)；host `knowledge-rescan.ts:781 normalizeTargetScopedCoverageModuleId` **总是** `target:name:path`。
- **为何 BiliDili 过**：BiliDili(Swift 包)`presenterInput.map.modules` **为空** → 两边都 fallback 到 target 派生 → 恰好相等。**换一个 ProjectMap 有模块的 JS/TS 项目**：in-process 写 `module.id`、host 写 `target:...` → **覆盖行重新不可比、parity 重新分歧**（deepMining gap 分析的 seed key 与 writeback key 不一致 → 覆盖收敛可能错）。
- **第二处**：host `dimension-completion.ts:663-694` 用 `listCanonicalModules`(主分支 plain `module.id`，`ModuleService.ts:312`)+`preferTargetScopedCoverageItems` skip-guard——**第二个未被 parity 测过的 coverage writer，带同样潜在 scheme 不一致**。
- **修复方向**：把两 adapter（in-process + host，且含 dimension-completion 这条）的 **module-id 派生收口到一个 canonical 函数**（不论 ProjectMap 是否有模块都产同一 key 方案）；**在一个 ProjectMap 非空的项目上重跑 host/in-process coverage parity**（BiliDili 单形态不足以证明收敛）。门禁不放松：parity 须真集合相等、非排除式。

### 🔴 R-2 [HIGH] `alembic_code_guard` 公共 MCP 响应 schema drift（`unrecognized key "data"`）——OPEN，从未修
- **现象**：public 响应携带 `data.unifiedEvolution.evidenceGate.verdict` 但**违反 public output-contract schema**（`unrecognized_keys: data`）→ 该字段**经公共工具不可读**。P12 控制器复核明确"不算修了 public schema drift"+ P13 风险均记，靠 DB 副作用旁证接受，**无任何修复 commit**。
- **源**：`AlembicPlugin/lib/runtime/mcp/public-tools/contract.ts` / `output-contract.ts` 的契约 vs `PluginOpportunisticEvolution.ts:36,146,201` 的 `unifiedEvolution`/`evidenceGate` 形状。
- **修复方向**：把 `unifiedEvolution`/`evidenceGate.verdict` 纳入 public output-contract（或调整产出形状），使公共 `alembic_code_guard` 响应过 schema、verdict 可读；加契约测。

### 🟡 R-3 [MED] §10.2 文档文件地图陈旧——doc-correction 任务似被丢
- `AlembicPlugin/CLAUDE.md:146-160` + `AGENTS.md:146-160` 列**不存在**的目录(`codex`/`codex/mcp`/`daemon`/`governance`/`http`)、漏真实(`recipe-generation`/`runtime`/`injection`)，`:167` 仍广告死 `#codex/*` 别名（应 `#recipe-generation/*`/`#runtime/*`）。
- `AlembicCore/docs/semantic-glossary.md:1-6` 头仍 2026-06-12、写"NOT renamed in code"，但 AppRuntime(P3)+HostAgent(P13) 已 ship。
- **无 §10.2 doc-correction 的 target-result** → 该任务（需求"用户强调 19 项"）疑被从执行计划丢。
- **修复方向**：修这三处文件地图/别名/glossary 到真实结构；受 shared-asset-drift 门禁处走 edit-in-authority-then-sync。

### 🟡 R-4 [MED] host-route `coverageLedgerSeed` projection 与 SQLite 不独立一致——fragility
- 接受的 closure 靠**持久化行** parity；最终 `68d1e39` 把 written/measured/target cell-count 的 mismatch 从 `inconsistent` **降级为 `info`**（缩小"不一致"定义而非修真）。host rescan 路径输出的 seed **仍不与 SQLite 独立吻合**。
- **修复方向**：让 host coverageLedgerSeed projection 独立正确（与持久化 cell 真一致），而非靠降级 mismatch 等级掩盖。

### 🟢 R-5 [LOW·质量] `plan-tool.ts`(Plugin) 仍 1589 LOC god-file——P7 薄抽取
- P7 只抽 `plan-confirm.ts`(488)+`plan-generation-gate.ts`(557)，主文件 2009→1589（−21%）**仍 god-file，最大残留**。DaemonJobRunner 也 2180→1322（−39%，>1300）。修复方向：可选续拆（routePlanTool/draftPlan/projectInfoTree budget），非阻塞。

### 🟢 R-6 [LOW·整洁] Plugin 别名重复定义
- `runHostAgentColdStartWorkflow` 在 `project-index.ts:47`(sync) 与 `cold-start.ts:102`(async dynamic-import) **两处定义**，rescan 同（`project-index.ts:51`/`knowledge-rescan.ts:138`）；行为相同、消费者 bind 干净，但 dead-duplicate API 面。修复方向：收口到一处。

### 🟢 R-7 [LOW] R-2 ternary 在主体 inert（安全但契约/执行不一致）
- 主体 `CleanupService` 只在 `#dataRoot` 删（`:241-296,414-515,635`），`#projectRoot`(`:190` set)**从不作删除目标** → plan ternary 的 in-process `→projectRoot` 分支**功能上 inert**。**SAFE**（不会 wipe 真实项目根），但 plan-ternary 契约与 executor 不一致。修复方向：G4/R-2 characterization 钉"主体 full-reset 删在 dataRoot"，并 honor projectRoot 或文档化为有意 dataRoot-only。

### 🟢 R-8 [LOW] `lint:naming` 红：3 个 pre-existing 未触 kebab-case Core 文件
- `src/project-context-capabilities.ts`/`recipe-context-capabilities.ts`/`test-fixtures.ts`（P13 风险已记，out-of-scope 但红）。修复方向：随手改名或显式豁免登记。

### ⚪ R-9 [cosmetic] state-root `index.md` projection stale（冻在 rev 166 显 P11 pending）vs 权威 `wakeflow-state.json`(rev 272 archived)——纯 ledger 陈旧。

## 3. 推进顺序 / 验收

- **优先级**：R-1（覆盖收敛真统一，载重）+ R-2（code_guard public schema，OPEN bug）先；R-3/R-4 次；R-5~R-9 整洁/可选。
- **R-1 验收**：两 adapter（in-process/host/dimension-completion）module-id 派生收口单 canonical 函数；**在一个 ProjectMap 非空项目（非 BiliDili Swift）上重跑 host/in-process coverage parity = 真集合相等 diff=[]**（不排除、不降级）；BiliDili 不回归。
- **R-2 验收**：public `alembic_code_guard` 响应过 output-contract schema、`evidenceGate.verdict` 经公共工具可读；契约测过。
- **R-3 验收**：三处文档地图/别名/glossary 与真实结构一致；shared-asset-drift 门禁绿。
- **R-4 验收**：host coverageLedgerSeed 与 SQLite 持久 cell 独立一致（非靠降级 mismatch）。
- 全程不放松门禁、不破 freeze、R-2 三元不动其语义。

## 4. 范围 / 非目标 / 待决 / 风险

**拥有**：R-1~R-4（HIGH+MED 必修）+ R-5~R-9（LOW 可选）。**不拥有**：不重做已成功的 P1-P15 主体（决策/不变量已验证存活）；不改 freeze 值；R-2 ternary 语义不动（仅 R-7 文档化/honor）。
**跨仓**：Core（coverage canonical）+ Plugin（code_guard schema / host module-axis / docs）+ 主体（in-process module-axis / CleanupService 文档化）。
**CG 已决（2026-06-28 用户"全部按推荐"）**：
- **CG-1 = `target:name:path` 全统一**：R-1 的 canonical module-id 方案——in-process/host/dimension-completion 三 adapter 的 module-id 派生统一收口为 `target:{moduleName}:{modulePath}`（与 host 现状 + 防 aggregate/root 污染一致），不用 plain `module.id`。
- **CG-2 = 文档化 dataRoot-only + 订正 plan ternary 契约**：R-7 不 honor projectRoot——主体 CleanupService 实际只删 `dataRoot` 是**安全行为**（honor projectRoot 有 wipe 真实项目源风险且 ternary 的 in-process 分支本就 inert）→ 订正 `ProjectIndexPlan.ts:97` 一带的 plan ternary 契约使其与"主体 full-reset 删 dataRoot"实际一致，并 G4/R-2 characterization 钉之；不改 host-agent full 分支的 `executor==='host-agent'?dataRoot:projectRoot`（host 侧 dataRoot 正确）。
- **CG-3 = R-5 纳入（可选续拆）、R-8 豁免登记**：R-5 plan-tool 续拆纳入本轮（非阻塞，时间允许做）；R-8 lint:naming 3 个 pre-existing kebab Core 文件走豁免登记（out-of-scope rename）。
**风险**：R-1 改 module-id 派生是覆盖链热区（碰 ProjectMapModules/knowledge-rescan/dimension-completion/CoverageLedgerWrite）→须 BiliDili + 非空-map 项目双测不回归；R-2 改 public 契约须双仓契约测；真机测沿用直接真测（DeepSeek/Qwen，rebuild 授权，但 R-1 须额外一个非空-map 项目）。push/发版用户门。

## 证据与链接
- 审计：3-agent post-completion（A 决策/不变量/freeze 全 OK + 2 小项；B parity 真伪=真过但单形态掩盖 module-id 不对称[载重]；C 逐阶段+残留=code_guard schema OPEN + docs 陈旧 + plan-tool god-file + 订正 push/IDEAgent/needs-review）。
- 关键 file:line：R-1 `ProjectMapModules.ts:17`/`knowledge-rescan.ts:781`/`dimension-completion.ts:663`/`CoverageLedgerBuilder.ts:123`；R-2 `public-tools/contract.ts`+`PluginOpportunisticEvolution.ts:36,146,201`；R-3 `AlembicPlugin/CLAUDE.md:146-167`/`AlembicCore/docs/semantic-glossary.md:1-6`；R-4 `knowledge-rescan.ts:507-559`(68d1e39)；R-7 `CleanupService.ts:190,241-296`。
- 母需求：[[alembic-recipe-lifecycle-naming-layering-refactor]]（COMPLETE+ARCHIVED rev 272）。真机：直接真测真 BiliDili 02a25032（[[alembic-bilidili-commit-maintenance-e2e-recipe]]，DeepSeek+Qwen）。
