# Recipe 生命周期 — 语义命名 + 文件夹重构隔离 + 层级下沉/上浮 — 需求设计(strict)

Date: 2026-06-26（re-ground 订正 2026-06-27；整体设计+实现指导 2026-06-28）
Status: requirement-design (ready-for-controller-intake) — **执行入口 = §A 需求执行总纲**（完整需求逻辑 + P1-P15 阶段路线图 + 推进协议）。权威分层：**§A → §12 执行权威 → §11 设计权威 → §-1 现实校准 → §0~§10 历史附录**。**当前 live HEAD 见 §12.0 banner**（Core 934d043/Plugin 9931596/主体 47889f9/Agent 99b8b33；§-1/§11 旧 HEAD 已 superseded；mainbody-realverify finding#1 已 land 主体 1f141c8，真机覆盖验证折叠进本需求 §12.3 G4）。
Source Window: Design
Design Key: alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26
Scope: AlembicCore + AlembicPlugin + Alembic 主体 + AlembicAgent（Recipe 生命周期相关层）
Grounding: 5-agent 跨四仓测绘 + 11 项 grep/wc/ls 复核（原稿）；**2026-06-27 在伞形/主体/终端/realverify 全 land 后做 7-agent re-ground workflow + Design spot-check**（订正多处已 land/已赶超/行号漂移）；全 file:line 接地。

## §A 需求执行总纲（2026-06-28 文档优化 — 完整需求逻辑 + 阶段执行路线图，按此推进）

> **本节是需求的执行入口**：一处读懂完整需求逻辑 + 15 阶段的目标/顺序/验收。下方各节是支撑——**权威分层（冲突以高者为准）：§A 执行总纲 → §12 执行权威（phase spine + 双宿主锚定 + BiliDili 真测）→ §11 设计权威（架构设计 + 命名方案 + 折叠）→ §-1 现实校准（live HEAD/已 land 翻牌）→ §0~§10 历史穷尽附录（原始点修复，凡与 §11/§12 冲突均已 superseded）。**

### A.1 需求逻辑（做什么 / 为什么 / 边界）

**做什么**：在**一套共享 Core** 之上、被 **Plugin host-agent** 与 **Alembic 主体 in-process AI** 两次实现的 Recipe 生命周期链（`plan → coldStart → deepMining/moduleMining → dimensionComplete → evolution`）做**架构层重构**，四条工作流：
1. **语义命名系统化**（§11.D layer×role 方案）：execution-plan→INDEX 词汇（`project-index`/mode `full|incremental`）、host adapter→`HostAgent*`/`InProcess*`+Core base、facade 杀 `IDEAgent*`→`HostAgent*`、app→`AppRuntime`；N-1~N-9/U-1/U-2/class Bootstrap 收为该方案**实例**。
2. **文件夹/层级隔离**（§11.B）：role→folder + stage→subfolder(≥3)；删 RG9 stub；**god-file 拆 5 处**（DaemonJobRunner 2006/plan-tool 2009/IDEAgentPacketBuilder 1810/ProjectContextFacts 1585/CompletenessCritic 871）。
3. **功能隔离边界**（§11.C，7 类 + 可门禁 CG-5）：Core←单向宿主 / 生成 vs 维护 / host-agent vs in-process 孪生 / 契约 vs 实现 / host-wire DTO vs Core 域 / per-stage / host 名中性。
4. **结构收敛**：cold-start↔knowledge-rescan Core 折叠到 `project-index/mode`（§11.I）+ 每宿主 orchestrator 统一 `runProjectIndexWorkflow(mode)`（§12.1，已纳入 in-scope）。

**为什么/边界**：本重构是生命周期链**最后一个需求**（伞形/主体/终端/realverify 全 archived）。**全 CG-1~8 + CG-A/B/C 已闭**；realverify **代码门已清**（finding#1 land 主体 `1f141c8`、CG-3=B sink Core `934d043`、Plugin re-import `9931596`），其真机覆盖验证**折叠进本需求 G4**。base = live HEAD（§12.0 banner）。**非目标**：consolidation/RecipeSimilarity 出范围、不强拆 828L Plugin FileChangeHandler、不跨宿主单 orchestrator、不改 freeze 字面量值。

### A.2 完整阶段路线图（P1-P15，按序推进 — 目标 / 批次 / 依赖 / 验收门；详 §12.2）

| # | 阶段目标（一句） | 批次 | 关键依赖 | 验收门 |
|---|---|---|---|---|
| **P1** | 删 RG9 零消费 dead-stub + 文件夹隔离审计 | COLD | — | build:check + grep 零悬空 import |
| **P2** | freeze 字面量清单 + INDEX vocab 映射文档锁（doc-only） | FREEZE | — | git diff --check + docs verify |
| **P3** | `class Bootstrap→AppRuntime`（释放 'Bootstrap' 词；先 grep DI/signal 字面只动类） | COLD | P2 | build:check + 字面零漂移 |
| **P4** | CompletenessCritic 拆 `buildCoverageLedger`→`coverage/`（behavior-neutral cold-Core 例外+repin） | COLD | P2 | build:core + 字节同 |
| **─** | **🚧 HOT GATE**：代码门（CG-3=B sink ✅ + finding#1 已 land ✅）+ vendor re-pin 已传播 + **cold-start-coverage 决策已定（保持不写）** | — | — | 三条同清方启 P5 |
| **P5** | Core R1 别名 `ProjectIndex*`（零行为，供后续迁移） | HOT+repin | P4 | build + 新旧名皆解析 |
| **P6** | DaemonJobRunner 拆 `DeepMiningRoundGate`（round-loop 抽出，god-file） | HOT | P5 | **REAL-TEST**：in-process deepMining round |
| **P7** | plan-tool 拆 confirm/`buildPlanSelection`（god-file） | HOT | P5 | confirm 往返 DTO 字节同 |
| **P8** | ProjectContextWorkflowFacts 拆 facts/presenter/modules（god-file） | HOT | P6 | build + `buildProjectMapModules` 同 |
| **P9** | **§11.I collapse**：Core→`project-index/` + coverage 三件套合一 | HOT+repin | P4,P5 | **REAL-TEST**：双宿主 parity |
| **P10** | **`runProjectIndexWorkflow(mode)` per-host 统一**（+bin/cli 消费者+session-release 断言） | HOT | P6,P8,P9 | **REAL-TEST**：双宿主必做 |
| **P11** | moduleMining 两 selector 收敛为 binding-rich（Entry B 也带 plannedDimensions=⚠️行为变更，用户已拍） | HOT | P10 | **REAL-TEST**：moduleMining（Entry B 定向生效·改进非破坏） |
| **P12** | N-9 双 `FileChangeHandler`→`HostAgent*`/`InProcess*` + evolution 命名 | HOT | P10/P11 | **REAL-TEST**：evolution parity |
| **P13** | `IDEAgent*→HostAgent*` facade + IDEAgentAnalysisPacketBuilder 拆（god-file） | LATE-L2+repin | P9-P12 | **REAL-TEST**：host-agent bootstrap |
| **P14** | Agent-run INDEX 命名 + `module-mining/` 文件夹隔离 | LATE-L2 | P11,P13 | build + enum 字符串不变 |
| **P15** | 终 freeze 零漂移核 + CG-5 隔离门 doc | FREEZE | 全部 | git diff --check + 终 grep 零漂移 |

> 批次义：COLD=现在可跑无跨仓 churn；HOT=真跨仓 import、同 commit 消费、green-per-file、门控于代码门；LATE-L2=授权 contract/enum/MCP rename+alias；FREEZE=持久字面量 doc-only。**每 Core-touch 阶段（P4/P5/P9/P13）带 vendor-repin**：Core commit→build:core→re-pin `vendor/AlembicCore` gitlink（Plugin+主体）→consumer build:check。

### A.3 推进协议（门序 + 硬门 + BiliDili 真测 + 完成定义）

- **门序 G0-G6**（§12.3.gate）：G0 代码前置（已清）→ G1 PRE 基线（真实 BiliDili 捕快照）→ G2 冷批 → G3 热批/Core 行（**R-2 文件系统证**：cleanup 删对 root）→ **G4 真实 BiliDili 覆盖门**（in-process coverage cell 翻 non-empty=realverify 折叠职责）→ G5 late-L2 → G6 twin/shim 移（其链 parity ∅ ≥2 连绿后）。
- **6 硬门不变量**（§12.4，每热阶段强制）：① R-2 三元（cleanup.projectRoot）留 Core 不 per-host 重导 ② per-host orchestrator split 存活（跨宿主单函数违 CG-5 仓边界）③ round 循环是 caller 不被吸收 ④ bin/cli.ts:699/884 未列消费者同 commit 改 ⑤ REAL-TEST 必做 @ P6/P9/P10/P11/P12/P13 ⑥ vendor-repin 每 Core 行。
- **BiliDili 直接真测**（§12.3，用户 2026-06-28）：**直跑真实 BiliDili workspace**（recipe 可删/rebuild 授权，不做沙箱副本，只动 BiliDili workspace）；**主体 AI=DeepSeek、向量=本地千问 Qwen（已配好，勿错配：DeepSeek 生成 / Qwen embedding）**；**R-2 characterization 必先过再真跑**（直跑下错 root 毁真实项目）；每链 parity predicate（host vs in-process diff==∅）。
- **硬规则**：freeze 字面量（PlanStageId 枚举/job kind/source/response.tool/lifecycle/coverage_ledger 列/export path）doc-only 不改值；不为整洁过度改；push/发版/版本号用户逐次授权；thread id 只写 `.wakeflow-local`。
- **完成定义**：P1-P15 全绿（每阶段验收过）+ 6 链真实 BiliDili 双宿主 **parity predicate==∅** + **G4 覆盖门过** + freeze 零漂移 + CG-5 隔离门绿。**两决策已拍（2026-06-28，无残留阻塞推进）**：cold-start-coverage=**保持不写**（Chain 2 断言 ==baseline）；moduleMining=**收敛为 binding-rich**（Entry B 也带 plannedDimensions=行为变更，P11 独立 REAL-TEST 证改进非破坏）。

---

## §-1 2026-06-27 真实代码 re-ground 重大订正（权威 — 与 §0–§10 冲突处以本节为准）

> 本 doc 2026-06-26 创建时假设伞形 + 主体适配**在途**。**现状（2026-06-27 re-ground，7-agent workflow + Design spot-check）：伞形 / 主体适配 / 终端工具 / 伞形 realverify-followup 全 COMPLETE+ARCHIVED；本重构成为生命周期链的最后一个需求。** baseline HEAD：Core `c4cac6b`（领先 origin `90c2295` 1 个未推送 commit = CG-3=B sink Core 端）、Plugin `cbf93cf`、主体 `077f7ce`、Agent `ea05556`。

### A. 已 LANDED（从"待新建/在途/不存在"翻为已做，仅 land 后核验，refactor 不重做）
| 项 | 旧表述 | 现实证据 |
|---|---|---|
| applyPlanSelection 下沉 | §0/§2:53/§3:126/§10.0#2「不存在·主体 B 待新建」 | Core `planIntent.ts:75`、export `plans.ts:16`；gate `plan-generation-gate.ts:1` import + `:264` 调用（via `toCorePlanSelection:525`）。**已落+已被消费** |
| assertPlanSelectionShape（D-2 Core 产物） | §2 D-2/§10.0#2「Core 零命中→须净新写」 | `planIntent.ts:40`、export `plans.ts:17`、applyPlanSelection 内部 `:79` 调用。**Core 净新已 DONE，无新 Core 写** |
| 三私有投影函数 + DEFAULT_* 删除 | §2 违反点/§10.1 D-1 | gate grep `selectPlanDimensions/selectPlanModuleScope/resolvePlanScale/DEFAULT_MAX_FILES` = **零**；常量仅在 Core `planIntent.ts:9-12`。**§2:53 verify-hint 已满足** |
| coverage_ledger | §0「四仓零命中/不存在」 | Core `migrations/015_coverage_ledger.ts` + `CoverageLedgerRepository.ts` + `CoverageLedgerAdvisor.ts` + `014_recipe_source_refs_content_fp.ts` + `016_deep_mining_rounds_rescan_id.ts`。**伞形 U2a 净新已落**（新持久化锚见 E） |
| PlanStageId Core 导出 | §4.5 收口5/§10.0#1 前置 | `plans.ts:13` re-export。**前置作废，N-5 直接可做** |
| realverify PD-7「B4 双写收敛」 | realverify-followup §4 残留 | gate :494/498/514 现为 `resolvePlanCleanupPolicy/readRecord/uniqueStrings`，非投影函数；gate 经 applyPlanSelection `:264` 单源化。**关闭 PD-7=已做** |
| 在途波次门控 | §6 总排序 | 四需求全归档 `wakeflow-ledger/.../archive/2026-06/`。**前提作废→见 C** |

### B. 缩小后的真实剩余 scope
- **D-1 改 REFRAME 非删除**：gate 本地 `PlanSelectionInput:20`/`NormalizedPlanSelection:72`/`PlanScaleOverride:5`/`PlanSelectionModuleBinding:11` 是**有意的宽松 host-wire 输入 DTO**（镜像 zod `mcp-tools.ts:840`，moduleBindings.min(1)、priority/targetRecipes 可选），由 `toCorePlanSelection:525` 适配到严格 Core 域形状（填 `priority ?? index+1`、`targetRecipes ?? max(1,dims.length)`、缺 totalRecipeBudget 即 throw）。**D-1 缩为决策：保留 host-wire DTO+适配（推荐——wire 形≠域形=正确分层）vs 改名标意图（`PlanSelectionWireInput`，纯 cosmetic）。「删本地类型/import Core」MOOT 且会破坏 wire/zod 面。**
- **D-2 改 wire-up+verify**：Core 产物已做；gate 本地 `validatePlanSelection:192`（调用 :118）做 **Core 不覆盖的 host-wire 输入门**（stage-match :203、moduleBindings 非空 :220、per-binding 维度交叉 :224-240），**非重复 Core 校验→保留**。剩余=确认投影/预算/shape 经 Core（已经 transitively via applyPlanSelection→assertPlanSelectionShape）。**无净新。**
- **N-2 降可选 cosmetic**：`validatePlanSelection:192`→`validatePlanSelectionInput`；Core 碰撞理由作废（Core 用 assertPlanSelectionShape，从未 ship public validatePlanSelection）。低优先。
- **N-5 仍有效、现 trivially 解锁、冷区**：gate `:4` 仍本地声明 `PlanGenerationStage`→改 import Core PlanStageId；**同批收第 4 份手抄** zod `PlanStageIdInput`（mcp-tools.ts:~773）+ 测试 `PlanDrivenGenerationGate.test.ts:19,675`。
- **N-1/N-3/N-4/N-6/N-7/N-8/N-9 + class Bootstrap→AppRuntime 全仍有效纯改名**，landed 工作没消除任何一个。N-7 规模涨（Core **195**/Plugin **96**/主体 2/Agent 0）；N-1 是 **3 个 consumer** 非 1（见 G）。
- **U-1/U-2 上浮仍真开**：JobStore `DaemonJobSource 'codex'` + `codexSkillRoot` 未被任何 landed 波次碰；仅主体 `DaemonJobRunner.ts` consumer 站点 12→~20（全 main-* source，无 'codex'）。
- **§5 RG9 20-stub 删除仍有效、冷区、零 importer**；「本轮未核 export」**已核闭**（见 F）。
- **§10.2 文档**：Plugin CLAUDE.md/AGENTS.md 文件地图 + Core canonical 文档仍陈旧。

### C. 新排序（§6 整体替换）
**本重构 = 生命周期链最后一个需求。** 伞形/主体/终端/realverify 全 ARCHIVED。**唯一剩余排序门 = 半落地的 CG-3=B coverage-ledger-write sink**（归 mainbody-realverify-followup）：Core 端已 `c4cac6b`（未推送）、Plugin re-import 未做。
- **冷区（现在做，无门）**：RG9 stub 删、class Bootstrap→AppRuntime、Plugin+主体 CLAUDE.md/AGENTS.md 文件地图/Bootstrap 路径、semantic-glossary/layer-contract canonical 锚定、N-5/zod PlanStageId DRY、N-8 登记、N-1/N-6/N-7 改名。
- **热区（等 CG-3=B 完全落地 = Core push + Plugin re-import + vendor re-pin）**：碰同一批文件——`FileChangeHandler.ts`、`plan-generation-gate.ts`（D-1/D-2/N-2，**不再受主体 B4 阻塞，仅受同文件 overlap**）、`coverage-ledger-write.ts`/host-agent-workflows 子目录化（§5 LATE）、Core `service/evolution`、N-3/N-4、N-9 Plugin FileChangeHandler（828 行）。
- **late-level2（纯文档冻结）**：HTTP 路由 RuntimeContracts.ts:47,50、job-kind 字面量、Dashboard out-of-scope、`Alembic/lib/generated/dashboard-api-types.ts`、`alembic_bootstrap` 有意分叉（`Alembic/CLAUDE.md:117`）。

### D. CG-3=B 耦合（与本重构）
- **状态**：Core `AlembicCore/src/workflows/capabilities/host-agent/CoverageLedgerWrite.ts`（`writeCoverageLedgerForCompletion:61`+`reflowDeepMiningRoundOnCompletion:164`，re-export `host-agent/index.ts`）**已 land c4cac6b、未推送**；Plugin `lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts` 仍持两函数（`:62`/`:166`）、只 import Core primitive `buildCoverageLedger`、未 import Core 完成包装。Plugin re-import + 删本地副本未做。
- **本重构不得重做**：不重建/重 sink 这两个完成函数（CG-3=B 的活、半完成）；CG-3=B re-import 前不得删 Plugin 本地副本（consumer dimension-completion.ts/knowledge-rescan.ts 仍调）。
- **§2 下沉清单新增一行**：「coverage-ledger-write（writeCoverageLedgerForCompletion + reflowDeepMiningRoundOnCompletion）下沉 Core = mainbody-realverify-followup CG-3=B 拥有；Core 端已 land（c4cac6b 待 push）、Plugin re-import 删副本待该需求收尾；refactor 不重做、land 后核验 Plugin lib 无残留副本。」
- **vendor pin 对 c4cac6b 陈旧**：Plugin/vendor/AlembicCore@`90c2295`、Alembic/vendor/AlembicCore@`e809140`、Alembic/vendor/AlembicDashboard@`d25624d`；release re-pin **未 push 不能引用 c4cac6b**。

### E. 新持久化锚点（加入 §10.3 冻结表，改值=破坏 DB 迁移，仅文档化）
- **coverage_ledger 列**（Core `015:20-38`）：grade（DEFAULT 'empty'，`CoverageLedgerRepository.ts:132` 镜像）、covered_count、total_candidate_count、value_score、deferred、last_round、exhausted/exhausted_reason/exhausted_source、covered_source_refs、uncovered_hints。
- **deep_mining_rounds 列**（`015:47-57`+`016:21`）：round_index、new_recipes_this_round、trigger_actor、rescan_id。
- **recipe_source_refs.content_fp**（`014:23`）。
- 迁移文件 014/015/016 为新持久化锚。`generation_stage` 仍**无 DB 列**（PlanStageId 改值零 DB 迁移，§10.0#3 不变）。

### F. CG 更新
- **CG-6 排序**：按 C 重写——去掉"等 4 个在途波次"，唯一门 = CG-3=B（约 4 个热区文件）；refactor=链尾。
- **CG-3 module-source remove-vs-alias**：不变但收紧——无代码路径写 `source:'codex'`（Plugin `HostMcpServer.ts:778` store.create 不传 source→默认 'system'；主体 named main-*）。**纯磁盘存量问题**（查真 `~/.asd/.../jobs/*.json` 有无 `source:'codex'`），非代码问题。
- **CG-2/persisted（U-2 rename）**：三仓 lockstep 改 `codexSkillRoot` + Core 反序列化 `:571,590` 双读 alias + 验证 `:353,359`；**加测试 pin** 主体 `AiDimensionFinalizer.test.ts`+`BootstrapSkillConsumer.test.ts`。CG-4（并入 DH CC3）仍有效。
- **§5 export caveat → 已核闭（无新 CG）**：package.json 无 `exports` 字段（只发 dist）、无顶层 plugin.json、manifest 不引 lib/ 源路径→**stub 路径非公开导出面，删除三要素满足**。

### G. 行号订正（关键 — 覆盖 §1/§2/§4/§10.0/§10.1）
| 旧 ref | 现 file:line |
|---|---|
| gate `validatePlanSelection:191`（call :122） | `:192`（call :118） |
| gate `NormalizedPlanSelection:66` / `PlanSelectionInput:19` / `PlanGenerationStage:3` | `:72` / `:20` / `:4` |
| gate 新 anchor | applyPlanSelection import `:1`、call `:264`、adapter `toCorePlanSelection:525`、`PlanScaleOverride:5`、`PlanSelectionModuleBinding:11` |
| `plan-tool.ts:15` import / `:1455 buildPlanSelection` | `:23` / `:1739` |
| N-1 consumer `ColdStartWorkflow.ts:90/95` | import `:40`、call `:105`、full-reset `:112`；**漏 2nd/3rd**: Plugin `cold-start.ts:13/167/219`、Core 测试 `PublicHostAgentWorkflowEntrypoints.test.ts:8/35` |
| N-6 `plan-tool.ts:87/285` | `:96`（miningGuidance 字段）、`:563`（`miningGuidance: dimension.extractionGuide` 适配） |
| N-7 Core 162/Plugin 79 | **Core 195/Plugin 96**/主体 2/Agent 0 |
| N-9 Plugin FileChangeHandler 764 | **828**（主体 496、BootstrapTaskManager 主体 704/Plugin 546 不变） |
| class Bootstrap consumer | `lib/cli/SetupService.ts:548,570`、`bin/api-server.ts:12/59`、`bin/cli.ts:2095-2096/2116`、`bin/daemon-server.ts:18/73`；**+ 默认导出 `lib/Bootstrap.ts:260`** |
| U-1 主体 DaemonJobRunner「12 站」 | **~20 站**（mainbody 加 `:918/:1047/:1094/:1164`） |
| semantic-glossary cold-start `:49-64` | `:51-63`（disclaimer `:3`、Status 仍 '2026-06-12' 未更） |
| §10.1 tool-router `lib/runtime/mcp/tool-router.ts` | `lib/runtime/mcp/handlers/tool-router.ts`（+ live-importer 加 `handlers/host-agent/evolve.ts`、`recipe-generation/plan-tool.ts`） |

> 以下 §0–§10 原文保留作历史与穷尽附录；凡与本 §-1 冲突，以 §-1 为准。

## 触发与定位

在 Recipe 全生命周期(plan→coldStart/deepMining/moduleMining/evolution + projectContext)几轮功能需求之上,做**架构层重构**:(1)重新语义命名(消歧、统一);(2)文件夹级重构隔离(消灭 dead/live/shim 副本、按层级分目录);(3)测绘功能层级关系;(4)建立**下沉(共享逻辑→Core 内核)/上浮(宿主特有→宿主层)**重构逻辑。**铁律全程**:跨仓搬迁须真实 caller + 替代入口 + 证据;删除走三要素核验;不为整洁强搬;不放松门禁。

> ━━━ **以下 §0~§10 为历史穷尽附录（原始点修复 + 穷尽修改点扫描，保留作参考/审计）** ━━━
> **执行以 §A/§12 为准、设计以 §11 为准；凡与 §11/§12 冲突，§0~§10 均已 superseded**（已 land 翻牌见 §-1.A，命名/折叠升级见 §11/§11.I，分阶段落地见 §12）。§10（全部修改点矩阵 + 持久化锚 + 文档/skill 专表）仍是实现期 file:line 参考。

## §0 复核订正(基于过时假设的清单已修正)

- ⚠️**[2026-06-27 订正,见 §-1.A]** `coverage_ledger` 现已**存在**（伞形 U2a 已落：Core `migrations/015_coverage_ledger.ts`+`CoverageLedgerRepository.ts`+`CoverageLedgerAdvisor.ts`+014/016）。原文旧态保留：~~当前不存在~~；coverage 能力另在 Core `recipeStatus.ts buildCoverage`。仍非本需求拥有，仅 land 后核验；新持久化锚见 §-1.E。
- **`mainServiceCanHandleProjectScope` 不存在**(grep 零命中);UM#3 目标名 `residentSearchEnhancementReady` 实测已在 `PluginOpportunisticEvolution.ts:25`,旧字段 `residentProjectScopeAvailable` 并存待清(N-4)。
- ⚠️**[2026-06-27 订正,见 §-1.A]** `applyPlanSelection` 现已**存在并被消费**（主体 B 已落：Core `planIntent.ts:75`、gate `plan-generation-gate.ts:1` import+`:264` 调用）；`assertPlanSelectionShape` 亦已落（`planIntent.ts:40`）→ D-2 Core 产物**无净新**。原文旧态保留：~~当前不存在·主体 B 待新建~~。
- **`plugin-deterministic` 已清零**,`draftSource` 仅 `'plugin-collected-facts'|'host-agent'|'test-fixture'`;no-guess 已尾扫,N-10 降为已满足。
- Plugin live `FileChangeHandler` 实测 **764 行**(主体 496 行),双实现结论不变。
- **RG9 stub 全确认死**(生产侧旧路径 importer 空,唯一引用 = `test/unit/RecipeGenerationSkeleton.test.ts`)。

## 1. 功能层级关系图(正确分层 + 当前违反点)

```
Core 共享内核 @alembic/core  ← (单向消费,无反向)
  ├ service/planIntent      plan 契约 PlanSelection/PlanIntent + validateCompletePlanIntent
  ├ service/recipeStatus    buildCoverage + plan 生成状态投影  (coverage 权威源)
  ├ service/project-context module/map/moduleLayers (模块结构权威)
  ├ workflows/cold-start    ColdStartWorkflowPlan (冷启动执行清单)
  ├ workflows/capabilities/host-agent  host-agent 协议 facade (跨宿主共享)
  └ workflows/shared        WorkflowExecutor='internal-agent'|'host-agent' (权威二分轴)
        ▲                              ▲
   Plugin 宿主            主体(Alembic)宿主            Agent
   lib/recipe-generation   lib/workflows/ai-execution   src/agent
   = host-agent 链         = internal-agent 链          = @alembic/agent 引擎
   (draft/confirm 回填)    (进程内直连 AgentService)     (被主体 import)
```

**设计预期(非债)**:主体 + Agent 对 plan/recipe 生命周期 0 消费(`Alembic/lib` grep `PlanSelection` 零命中,但 `@alembic/core/host-agent-workflows` 15 文件消费)——plan/recipe 是 Plugin 宿主能力,主体走 internal-agent 直连,**不接 plan 契约属设计预期**。

**当前违反点(4 类)**:
| 类型 | 违反 | 证据 |
|---|---|---|
| **下沉缺位**(消费侧 fork 契约) | Plugin gate 本地重声明 Core 已有 plan 契约 + 跑弱并行校验 | `plan-generation-gate.ts:19 PlanSelectionInput/:66 NormalizedPlanSelection/:191 validatePlanSelection` 平行于 Core `contracts.ts:63 PlanSelection`/`validateCompletePlanIntent` |
| **上浮缺位**(host 名进 Core 契约) | Core 枚举/字段硬编码 `codex` | `JobStore.ts:15 DaemonJobSource='codex'\|...`;`ProjectSkillDeliveryContracts.ts:77 codexSkillRoot` |
| **命名碰撞** | `Plan` 一词双占;阶段枚举两仓平行 | `ColdStartPlan.ts:9 ColdStartWorkflowPlan`(执行清单) vs `contracts.ts:63 PlanSelection`(维度决策);`contracts.ts:1 PlanStageId` vs `plan-generation-gate.ts:3 PlanGenerationStage` |
| **副本混淆** | dead RG9 re-export stub 与 live 同名 | `lib/runtime/mcp/host-agent-workflows/*`(8)、`lib/service/{evolution,bootstrap,vector}/*` 全 3 行 stub,唯一 importer = skeleton 测试 |

## 2. 下沉清单(共享逻辑卡在宿主→进 Core)

**已被在途承载(不重做,仅 land 后核验)**:
- `applyPlanSelection` 投影 = 主体适配 B 阶段(B1-4);land 后 grep Plugin 残留 `DEFAULT_MAX_FILES`/`selectPlanDimensions` 为空。
- `coverage_ledger` 归 Core = 伞形 U2a 净新建;land 后核验不出 Plugin/主体副本。
- `module` 源下沉(D1 方案 B) = 伞形 Confirmation Gate(拆独立需求);归属待裁定(§8)。

**本需求新增下沉候选(带真实 caller,均"让已在 Core 的被单源消费",非新建 Core 能力)**:
| # | 能力 | 当前(卡在 Plugin) | Core 替代入口 | 真实 caller 证据 |
|---|---|---|---|---|
| **D-1** | plan 契约消费单源化:gate 删本地 `PlanSelectionInput`/`NormalizedPlanSelection`,改 import Core | `plan-generation-gate.ts:19,66` | `@alembic/core/plans contracts.ts:63,30` | 产出侧 `plan-tool.ts:15` 已 import Core `PlanSelection`,`:1455 buildPlanSelection` 返回 Core 类型→同模块产/消不一致 |
| **D-2** | plan 结构校验复用 Core:gate `:191` 弱校验改调 Core | `plan-generation-gate.ts:191-239` | Core 新增 `assertPlanSelectionShape`(**禁用 `validatePlanSelection` 名**,避撞,主体 R1 已裁定) | Core `validateCompletePlanIntent:26-66` 逐条覆盖且更全;gate 只留 host `generationStage`/lease 编排 |

> D-1/D-2 与主体适配 B/R1 在 `plan-generation-gate.ts` **同文件** → **必须排在主体 B/R1 land 之后**(§6)。

## 3. 上浮清单(宿主特有泄漏进 Core→回宿主)

实测仅 **2 处真实候选**,均为 host 名(codex)硬编码进 Core 契约,非整块宿主逻辑误入:
| # | 泄漏 | file:line | 真实 consumer | 方案 | 兼容要求 |
|---|---|---|---|---|---|
| **U-1** | `DaemonJobSource` 枚举含 `'codex'` | `AlembicCore/src/daemon/JobStore.ts:15,27,61` | Core job 持久化/比较点 | 枚举 host 中性化(`host-agent\|dashboard\|http\|system`)或参数化,codex/claude-code 映射留宿主 | **持久化兼容**:先核 job 是否已落库 `'codex'`;若是→加兼容映射不直改 |
| **U-2** | `codexSkillRoot` 字段名 | `ProjectSkillDeliveryContracts.ts:77,87,161,193-306` | 跨仓 2 consumer(Plugin `ProjectSkillDelivery.ts` + 主体 `SkillCompletionCapability.ts`) | 改名 `hostSkillRoot`/`projectSkillRoot`,codex 映射在 Plugin 适配 | **契约向后兼容**:双仓同步 + 保留旧字段一轮;**建议并入既有 DH CC3 命名 follow-up**(§8) |

> Core `daemon/` 目录本身**不上浮**——是 host 中性 job/runtime contract(主体 cleanup 已定 daemon 本职保留),只去其中 host 名。

## 4. 语义命名重整(rename 清单,分批)

**高优先 — 真实碰撞/误导(影响公共契约表面 → 触 Gate)**:
| # | 旧名 | 新名(候选) | file:line | 理由/既定口径 |
|---|---|---|---|---|
| **N-1** | `ColdStartWorkflowPlan`/`buildColdStartWorkflowPlan`(执行清单) | `ColdStartStepSequence` 等 **或** 统一层固化为 `RecipeGenerationPlan*`(二选一,**不可都叫 *Plan**) | `ColdStartPlan.ts:9,44` | `Plan` 一名两指。**采纳主体 R1**:不反向 rename 既有符号(有真实 import `ColdStartWorkflow.ts:40/95`),新组件用 `runPlanAgent`/`planSelection`。方向待 §8 |
| **N-2** | Plugin gate 私有 `validatePlanSelection` | `validatePlanSelectionInput`/`gateStagePlanSelection`;Core 用 `assertPlanSelectionShape` | `plan-generation-gate.ts:191` | 与 Core 公共 DTO/校验器同名不同职。**采纳主体 R1 既定** |
| **N-3** | verdict `'defer-to-alembic-service'` | `'debounce-no-head-change'`/`'skip-resident-search-only'` | `PluginOpportunisticEvolution.ts:9,147` | 名暗示"交主体维护",但 `:23-25` 注释明确本链路执行;PDR-3 残留误导。**运行时字面量→须核落库/跨进程比对再改** |
| **N-4** | `residentProjectScopeAvailable`(旧字段) + `...ServiceGate` interface | 合并入 `residentSearchEnhancementReady`;interface→`...ResidentReadinessHint` | `PluginOpportunisticEvolution.ts:20,18` | UM#3 改名后双字段并存;删旧字段须确认无外部 consumer |

**低优先 — 一致性(不破坏行为,纯类型/注释/标识符)**:N-5 `PlanGenerationStage`→import Core `PlanStageId`(`:3` vs `contracts.ts:1`);N-6 `miningGuidance`/`extractionGuide` 同字段两名统一(`plan-tool.ts:87,285`);N-7 `IDEAgent*` 前缀(Core facade 24 处,注释称"宿主 agent"却导出 `IDEAgent*` 自相矛盾)→`HostAgent*`;N-8 主体 `Ai*`(6) 与 `Agent*`(3) 前缀混用统一(`ai-execution/`);N-9 两 `FileChangeHandler`/两 `BootstrapTaskManager` 同名不同实现→主体 `InProcess*`/Plugin `HostAgent*`。
**N-10 已满足**(plugin-deterministic 已清零)。**codex-host source 字面量**(`plan-tool.ts:1169 'codex-host-plan'` 等 5 处)与纯标识符 rename **分开处理**——是流入 `FileChangeEvent.source` 的运行时值,须先核 `FileChangeEventSource` 是否枚举约束+持久化(§8)。

## 5. 文件夹重构隔离(删/合并/拆 + 证据)

**删(dead RG9 stub,删除三要素满足)**:
| 删除目标 | 证据 | 同 commit 必须 |
|---|---|---|
| `lib/runtime/mcp/host-agent-workflows/*`(8 全 stub) | 旧路径 importer grep 空;活副本 `lib/recipe-generation/host-agent-workflows/*` 经 `#recipe-generation` 别名被所有 handler 消费 | 改 `RecipeGenerationSkeleton.test.ts` 删对应 `rg9AdapterPaths` + 旧路径负断言 |
| `lib/service/evolution/*`(`FileChangeHandler`+`git-diff-checkpoint/` 5 stub) | grep `#service/evolution` 唯一命中 = skeleton 测试;活副本 `recipe-generation/evolution/` 单源 | 同上 |
| `lib/service/bootstrap/*`(3)+`lib/service/vector/*`(2) | grep 唯一命中 = skeleton。⚠️ `bootstrap-event-types.ts`/`ContextualEnricher.ts` stub 未被测试钉(under-pin) | 删前先收紧 skeleton 测试覆盖全 stub 集 |

> 删除三要素均满足(import 扫清 + 替代入口 `#recipe-generation/*` live + build/test 可过);**删前必查 `plugin.json`/`package.json` exports 确认 stub 非公开导出面**(本轮未核)。

**合并**:`git-diff-checkpoint` 仅 2 目录(1 live + 1 dead stub),随 stub 删除自动单源,无独立动作。
**拆/重组(低优先,触 RG9-pinned,排热区后)**:`lib/recipe-generation/host-agent-workflows/` 扁平混职责桶(cold-start 48KB/rescan 21KB/dimension-completion 41KB 等 9 文件平铺),可按 skeleton stages 子目录化(保 caller 搬迁非删除,更新 import + 测试);Core `service/evolution/`(13 文件平铺)目录隔离**排伞形 U4/U5/U6/UM 全 land 后**(在途分 commit 战场)。
**文档纠错(冷区,可早做)**:Plugin `CLAUDE.md:144-167` 文件地图陈旧(列不存在的 `codex/mcp`、`daemon`、`governance`、`http`,漏列实际 `recipe-generation`、`runtime`、`injection`)+ `:167` 别名列表纠错。

## 6. 与在途排序(land 之后 + 分批解耦)

**冷区批(可先行,与全部在途解耦,仅受删除核验铁律约束)**:
1. dead RG9 stub 清理(§5 删,确认 0 importer + 查 package exports)
2. Plugin CLAUDE.md 文件地图 + 别名纠错
3. 低优先纯命名一致性(N-5~N-9)**全局登记表**(登记不实改热区)
4. 上浮 U-1(若仅内存)/ U-2(并入 CC3)

**热区批(必须排在对应在途 land 之后)**:
| 重构动作 | 必须在...之后 | 原因(同文件 churn) |
|---|---|---|
| 碰 `FileChangeHandler.ts:410-493` | 伞形 U1/U2e/UM/U4 | 三+一方"合并单次落地"区 |
| `plan-generation-gate` 结构/命名(D-1/D-2/N-2/N-5) | U1#1 + U2b + 主体 B4 | additive 协调区 + B4 删三私有函数 |
| Core `service/evolution/` 目录隔离 | U4/U5/U6/UM | ProposalExecutor/EvolutionGateway 分 commit 序列 |
| host-agent-workflows 子目录化 | 主体 W4 + 伞形 U7 真机 | 触 RG9-pinned 实现路径 |

**总排序结论**:⚠️**[2026-06-27 订正,此框架已作废,见 §-1.C]** 伞形/主体/终端/realverify 全 ARCHIVED→"等在途波次"前提不再成立。**新排序：本重构=链尾最后一个需求，唯一剩余门=半落地的 CG-3=B coverage-ledger-write sink（约 4 个热区文件）；其余冷区现在做。** 原文旧态保留：~~分两批,热区串伞形波1→4+主体 W1→4+U7 之后~~。

**与前序架构工作非重叠(均 COMPLETE,不重做)**:Core inventory(拆 project-intelligence/facade/接口收口)→本需求补跨仓下沉收口 D-1/D-2 + host 名上浮;主体 cleanup(daemon 本职保留)→据此确认主体 daemon 真跑保留只纠 Plugin 残留;Agent V1V2→kernel convergence→不碰 Agent tools 层;Plugin daemon-removal/RG9→本需求补其**未收尾的 dead/live/shim 三副本清理**(Plugin 侧唯一真净增独占领域)。

## 7. 范围:拥有 / 不拥有

**拥有**:语义命名重整(N-1~N-9,高优先碰撞采纳在途既定口径);文件夹重构隔离(删 RG9 stub + 文档纠错 + 低优先子目录化);**剩余**下沉(D-1 契约消费单源化 / D-2 校验复用);上浮(U-1/U-2 host 名去 codex);层级固化(可加分层门禁防回归)。
**不拥有(在途承载,仅 land 后核验)**:`applyPlanSelection` 投影下沉(=主体 B)、`coverage_ledger` 归 Core(=伞形 U2a 净新建)、`module` 源方案 B(=伞形 D1 Gate)、plan 契约 0 消费接线(=主体 A/C 功能接线,非架构搬迁)。

## 8. 待决 Confirmation Gate(决策表)

| # | 决策点 | 选项 | Design 建议 | 影响 |
|---|---|---|---|---|
| **CG-1** | N-1 改名方向 | coldStart 内部降义(`ColdStartStepSequence`)/ 统一层固化 `RecipeGenerationPlan*` | **coldStart 内部降义**(`ColdStartWorkflowPlan` 是局部执行清单,改它表面影响小;`plan` 让给统一维度决策层语义) | 公共契约表面/消费方+测试 |
| **CG-2** | module 源方案 B 归属 | 归入本架构重构(下沉范畴)/ 独立第三需求 | **归入本需求**(本就是下沉范畴,避免与拆出需求职责重叠;但排热区、依赖伞形 D1 决策) | 职责边界 |
| **CG-3** | codex-host 字面量 + U-1/U-2 持久化 | 纯 rename / 加兼容映射+迁移 | **先核持久化再定**(5 处 codex-host source + DaemonJobSource 若落库/跨进程比对→加兼容映射不直改;本轮未读持久化层,留 Core 窗口核) | 数据语义/持久化红线 |
| **CG-4** | U-2 codexSkillRoot 协调边界 | 并入既有 DH CC3 命名 follow-up / 本需求独立推进 | **并入 CC3**(避免重复触碰契约+兼容) | 跨需求协调 |
| **CG-5** | 是否加分层门禁 | 加(plan 契约单源 import 检查 / host 名不进 Core / Plugin 不 fork Core 契约)/ 不加 | **加**(防回归,门禁是质量地板不放松) | 防回归/CI |
| **CG-6** | 排序确认 | 冷区先行 + 热区串在途后 / 某些项与特定在途并行 | **冷区先行 + 热区严格串后**(merge churn 头等风险) | 排期/冲突 |
| **CG-7** | 文件夹激进度 | 渐进(仅冷区删+文档)/ 纳入本轮大改(host-agent-workflows + Core evolution 子目录化) | **渐进起步**(子目录化排热区收尾,大改触在途战场风险高) | churn 面 |
| **CG-8**(词汇,新) | stage 词汇统一改值范围 | 口径①纯标识符统一(无契约/持久化改值)/ 口径②连枚举值改(deepMining/moduleMining stage 值 + alembic_bootstrap 工具名) | **口径①(默认,无需授权,进冷区)**:三份手抄 stage 收口 Core 单源、`class Bootstrap`→`AppRuntime`、退役字段改名、伞名文档化——全值不变零迁移;口径②任何改 `PlanStageId` 枚举值/`alembic_bootstrap` 工具名/持久化字面量须**单独授权+兼容映射**(触 Gate);**持久化值(job kind/source/lifecycle)一律不改、仅文档化** | public-contract/persisted/可见行为 |

**CG-1~7 已闭合(2026-06-26 用户全部采纳建议)**:CG-1 coldStart 内部降义 / CG-2 module 源方案 B 归入本需求 / CG-3 先核持久化再定 codex 字面量兼容 / CG-4 U-2 并入 DH CC3 / CG-5 加分层门禁 / CG-6 冷区先行+热区串在途后 / CG-7 渐进。
**CG-8(词汇,新增,研究印证后细化)**:canonical 目标词汇 = **index 词汇**(`fullIndex`/`incrementalIndex`/`scopedIndex`/`refresh`,见 §4.5.1 研究)。执行分级:
- **Level 0(冷区,现在做)**:修真混乱名(`class Bootstrap`→`AppRuntime`、三份副本收口 Core、退役字段、伞名文档化)+ **文档锁定 canonical index 目标**;**新代码(主体 plan 组件等)从一开始用 canonical 词汇**;不动现有 contract 值/持久化值。
- **Level 2(热区 LATE 批,伞形+主体 land 后)**:把 `PlanStageId` 枚举值 `coldStart/deepMining/moduleMining` → index 词汇 + `alembic_bootstrap` MCP 工具名 → `alembic_index`/`alembic_build`,**带旧值 alias 过渡 + 兼容映射**;须用户授权(breaking 公共契约)。
- **持久化字面量(job kind/source `'bootstrap'`+QualityScorer 评分依赖/lifecycle evolving·decaying)一律不改、仅文档化别名**(改值=破坏 DB 迁移/评分)。
- **Level 3(结构收敛 index(mode×scope))= out-of-scope 本需求**(塌枚举+撞在途,记为未来)。
- **✅ 已裁定(2026-06-26 用户)**:**Level 0 现做 + Level 2 纳入本需求、排 LATE 热区**(伞形+主体 land 后,带旧值 alias 过渡)。即 coldStart/deepMining/moduleMining → index 词汇值是本需求确定范围,只是排在最后批做以避 churn;持久化值仅文档化不改;Level 3 结构收敛仍 out-of-scope。

## 4.5 Stage 词汇重整(用户 2026-06-26 扩展范围,2-agent grounding 接地)

> 用户:命名重整须覆盖核心 stage 词汇本身(coldStart/深度扫描/模块扫描/进化,尤其 rescan/ColdStart/Bootstrap)。**核心洞察**:大部分 stage 词是 **public-contract / persisted-literal**(改值=破坏迁移),真正高价值低风险的是修**真正混乱的内部名 + 三份手抄副本收口 + 文档化轴/伞关系**,而非改契约值。

**canonical 词汇表(按"轴"组织——不同轴不该共用字面量)**:
- **A 生成期 stage 轴**(plan 粒度,host-agent↔plugin 线缆契约):`coldStart`=首次代表性全量扫(full-reset→全量→建维度 Candidate,`ColdStartWorkflow.ts:90`);`deepMining`=多轮覆盖增量 rescan(伞形已定义,**非符号深挖**,`knowledge-rescan.ts:262-266`);`moduleMining`=按模块范围定向 rescan(活义;死义=已退役 `created→moduleMining` 维护路由 `FileChangeHandler.ts:67`)。
- **B 维护期/能力域轴**:`evolution`=进化总域伞名 ⊃ `{maintenance(commit 驱动既有 Recipe 建/更新/弃用), decay(衰减检测→lifecycle='decaying')}`;保鲜=`evolving` 持久化状态。
- **C 执行/持久化轴(保留旧值,不进 canonical 改值)**:job kind `'bootstrap'|'rescan'`(`RuntimeContracts.ts:44`,= A 轴的 daemon 执行粒度别名)、`PipelineMode`、DB source `'bootstrap'`、Agent 探索 `bootstrap`。

**5 处一物多名/同名异义收口**:
1. **coldStart 五名**:`coldStart`(stage) ≡ `'bootstrap'`(job kind) ≡ `'cold-start'`(intent) ≡ `alembic_bootstrap`(MCP) ≡ `'bootstrap'`(sourceTag)。**主名 coldStart**(顺主体 R1 不反向);外名全是 contract/persisted→**保留值 + 文档标"=coldStart 契约别名"**。
2. **(最危险)同名异义 `class Bootstrap`**(`Alembic/lib/Bootstrap.ts:37`,注释 :15"应用程序启动器")真实=**app 启动器**(config→logger→DB→Gateway),与知识冷启动**完全无关**→改名 `AppRuntime`/`AppLauncher` 释放 bootstrap 词;**纯 internal、风险最低、应优先**。
3. **rescan 伞名**=`deepMining`+`moduleMining`+`evolution-maintenance` 三语义伞→**不改 job kind 值**,文档/类型层显式标注伞覆盖。
4. **bootstrapSession 前缀泄漏**:`bootstrapSession`/`BootstrapSessionManager`/`'bootstrap-session:<id>'` 是通用维度填充会话(coldStart+rescan 双路复用)→改名 `dimensionFillSession`/`generationSession`;但 `'bootstrap-session:'` 持久化前缀须先扫消费方(热区)。
5. **stage 类型三份手抄副本**:Core `PlanStageId`(`contracts.ts:1`)‖ Plugin `PlanGenerationStage`(`plan-generation-gate.ts:3` 本地声明非 import)‖ Plugin zod `PlanStageIdInput`(`mcp-tools.ts:773`),值全同无 import→Plugin 两份改 import Core 单源(**值不变零迁移纯 DRY**);前置=Core 包入口当前未导出 `PlanStageId`,需先决定是否提升 Core 导出。

**rename map(分批)**:
- 🟢 **冷区(internal/注释/引用收口,零契约零持久化破坏,可先做)**:`class Bootstrap`→`AppRuntime`(`Bootstrap.ts:15,37,76,229`);Plugin `PlanGenerationStage`+zod 收口 import Core `PlanStageId`;`moduleMiningRoutes`→`retiredModuleGenerationRoutes`+边界注释(`FileChangeHandler.ts:67,396`);`deepMining`=多轮覆盖语义注释(`contracts.ts:1`/`tools.ts:309`);`evolution⊃{maintenance,decay}` 文档化;`PipelineMode` 复用 `AlembicJobKind` 类型(结构收口值不变)。
- 🔴 **热区 public-contract(改字面量须别名过渡,触 CG-8)**:`deepMining`/`moduleMining` stage 值改名(可选,不推荐;三份副本+gate `:177` 同改+alias 过渡);`alembic_bootstrap`→`alembic_cold_start`(仅真改名时;rebuild 文案 `cold-start.ts:1033-1061` 同改;保留工具别名)。
- 🔴 **热区 persisted-literal(改值=破坏 DB 迁移/评分,强烈建议不改值仅文档化)**:job kind `'bootstrap'`、source `'bootstrap'`(DB 默认 `memory.ts:64`+评分 `QualityScorer.ts:288` 依赖)、lifecycle `'evolving'`/`'decaying'`(SQL CASE 硬编码)、`'bootstrap-session:'` 前缀。
- ⛔ **排除区(同字面量跨 ≥3 独立枚举轴,禁止全局字符串替换)**:`'bootstrap'`/`'rescan'` 须逐轴评估;Agent 仓 0 处 stage 枚举词(其 `bootstrap` 是独立探索语义,**勿动**)。

**与既定结论一致**:不冲突主体 R1(主名 coldStart 顺向不反改)、不冲突伞形 deepMining=多轮覆盖(仅注释不重定义)、PlanStageId 推荐**仅统一 Plugin 引用不改枚举值**。

### 4.5.1 网络命名惯例研究(deep-research 多源 + 对抗核验,2026-06-26)

**已核实结论**:
- 建代码知识/导航元数据的**标准动词 = `index`/`indexing`**(SCIP/LSIF/Glean);**`mining` 在业界=ML 特征提取**(误导)。[sourcegraph SCIP]
- **`cold start` 惯例 = 性能/数据稀疏问题**(AWS Lambda 冷启动延迟、推荐系统 cold-start=新用户无数据),**不表示"首次建数据"**→ 用于"建库"是误导借喻。[AWS Lambda / Wikipedia recommender]
- 首次全量建 = **"initial index"/"full indexing"**;多轮加深覆盖 = **"incremental indexing"**。[Google Cloud / HCL / SCIP]
- 限定子集重扫 = **`reindex`(全量+子集同一动词)/"manual refresh"**。[Elasticsearch reindex / Vertex]
- 维护/保鲜 = **`refresh`/`recrawl`**;RAG 喂数据 = `ingest`。[Google Cloud / LlamaIndex]

**概念结论(回答"是否真有冷启动")**:coldStart 不是独立机制,就是**"全量索引"模式**(reset+从空建);索引领域标准轴 = **full vs incremental**(一个 index/reindex 动词带模式),非三并列 mining stage;**`moduleMining` 不是 stage 是 scope 参数**(reindex 同动词既全量也限定子集)。

**研究印证的 canonical 词汇(替换误导名)**:
| 当前(误导) | 问题 | canonical |
|---|---|---|
| `coldStart` | cold start=性能问题 | `fullIndex`/`initialIndex` |
| `deepMining` | mining=ML特征提取;deep 暗示符号深挖实为铺广 | `incrementalIndex`/`coverageExpansion` |
| `moduleMining` | 不是 stage 是 scope | `scopedIndex`/`moduleReindex` |
| `evolution`(维护) | 作伞名 OK | 保留,维护腿对齐业界 `refresh` |
| `alembic_bootstrap` MCP | bootstrap 被 app 启动器占用;cold_start 更差(性能义) | `alembic_index`/`alembic_build` |

**理想形态(未来可选,本轮不做)**:收敛成一个 `index` 操作 + 正交轴 `mode: full|incremental` × `scope: project|module` + `refresh`(维护)。**会塌 PlanStageId 枚举 + 改 plan stage 处理 + 狠撞在途伞形/主体**——记为**未来结构简化(out-of-scope 本需求)**,不在命名重构里做。

## 9. 风险
- **merge churn(最高)**:热区 6 文件(`FileChangeHandler`/`plan-generation-gate`/Core `evolution`/`ProposalExecutor` 等)是在途多方合并红线,并行必致 rebase 冲突 + 覆盖在途语义。缓解=严格分批,热区串在途后。
- **外部消费方破坏**:N-1/N-2/N-7 改公共契约名 + U-2 改 Core 字段名→触 Gate,须双仓同步 + 一轮兼容字段;删 RG9 stub 前必查 exports 确认非公开面。
- **持久化语义破坏**:N-3 verdict / codex-host source / DaemonJobSource 是运行时/可能落库值,纯 rename 改数据语义→分开处理,先核持久化再加兼容映射。
- **跨仓 import 扫不全**:下沉/改名须全四仓 grep 所有 named export(含 const/type),跑下游 tsc(主体门禁 **Node≥22** 否则 false 红)。
- **测试 under-pin**:skeleton 测试未钉全 stub 集(`bootstrap-event-types`/`ContextualEnricher`)→删前先收紧测试覆盖。
- **门禁不放松**:删除走三要素;契约改走 Core 向后兼容;不为整洁绕门禁。

## 10. 全部修改点清单(exhaustive 附录,5-agent 穷尽扫描 + 完整性 critic,2026-06-26)

> 目标=覆盖全部修改点、实现期不再反复发现新触点。分类 `code/test/doc/skill/persisted-literal/contract/export-surface/config-env`;batch=`cold`(立即纯净)/`hot`(伞形+主体波次后)/`late-level2`(改值须授权+alias)。**本附录的更正与补充对 §2-§5 具权威性。**

### 10.0 对 §2-§5 的 7 处更正(扫描直接验证)
1. **`PlanStageId` 已由 Core `plans.ts:10` 导出**(`package.json:41 ./plans` 已映射,`plan-tool.ts:16` 已成功 import)→ §4.5 收口5「Core 未导出」前置**作废**,N-5/zod 可直接 import(cold,零迁移)。
2. ⚠️**[2026-06-27 订正,见 §-1.A/B]** `assertPlanSelectionShape` 现**已存在**（`planIntent.ts:40`，applyPlanSelection 内部 `:79` 调用）→ D-2 Core 产物**已 DONE，无净新写**；D-2 缩为 wire-up/verify（gate 本地 `validatePlanSelection:192` 是 host-wire 输入门、非重复 Core 校验、保留）。原文旧态保留：~~Core 零命中须净新写~~。
3. **无 `generation_stage` DB 列** → PlanStageId 改值**零 DB 迁移**(仅契约/zod/字面量)。
4. **三处 vendor 全是 git submodule/gitlink**(`Alembic/vendor/{AlembicCore,AlembicDashboard}` + `AlembicPlugin/vendor/AlembicCore`)→ Core 任何 rename 在**封版 re-pin gitlink** 才传播,非逐文件改;须加入 release closure。
5. **`IDEAgent*` 命中 Core 162 / Plugin 79 / 主体 2**(src+lib)——N-7 是大改。
6. **`extractionGuide` 是 Core domain 契约字段**(`DimensionRegistry`/`UnifiedDimension`/`DimensionCatalogPayload`payload 持久化/`DimensionCopy`/`BaseDimensions` 6 文件)→ N-6 **建议反向统一到 `extractionGuide`,只改 Plugin `plan-tool.ts` 两行**(统一到 miningGuidance 会触 Core 公共维度契约+payload 持久化,巨大)。
7. **verdict 字面量被 `PluginOpportunisticEvolution.test.ts:60` 钉死**(改值同 commit 改测试)。

### 10.1 改动项修改点矩阵(关键 file:line,去重)
- **D-1**(gate import Core,hot):`plan-generation-gate.ts:3,5,11,19,71-73`(本地重声明,**非纯 import swap**——`PlanScaleOverride`/`PlanSelectionModuleBinding`/`scale` 与 Core `PlanScaleDecision`/`PlanModuleBinding`/`PlanSelection.scale` 形状不一致须调和或留薄包装);caller `cold-start.ts:40-47`/`knowledge-rescan.ts:46-51`;测试 `PlanDrivenGenerationGate.test.ts:16-21,604,609,656,972`。
- **D-2**(净新 `assertPlanSelectionShape`,hot):`plan-generation-gate.ts:191-239` 改调 Core;Core 新函数导出至 `plans.ts` barrel。
- **N-2**(hot):`plan-generation-gate.ts:196(声明),:122(调用)`,文件私有零外部 consumer。
- **N-3**(hot,改值):`PluginOpportunisticEvolution.ts:9(类型),:147(产出)` + 测试 `:60` 钉死。
- **N-4**(hot):**只合并 ServiceGate 那份** `PluginOpportunisticEvolution.ts:18,20,25,86,112`;⚠️ **GAP:同名运行时字段 `residentProjectScopeAvailable` 贯穿 ~10 文件独立语义**(`Preflight.ts:31,95,108,142,163`/`ToolPolicy.ts:28,285,297`/`HostMcpServer.ts:212,280,286,307,906,1002,1009,1014-1021`/`embedded-executor.ts:21,193`/`tool-visibility.ts:22,34`/`opportunistic-evolution-presenter.ts:42,49,60,62`/`knowledge-rescan.ts:399`)——**禁误改全名破坏门禁**。
- **N-5**(cold,零迁移):`plan-generation-gate.ts:3,21,28,53,90,105,150,152,153,156,198,256,261,454,506,556` + 测试 `:17,604`,直接 import Core。
- **N-6**(hot,方向反转):Plugin `plan-tool.ts:87,285`;⚠️ `extractionGuide` Core domain 6 文件(见 10.0#6);关联 `CompletenessMiningGuidance`(Core `CompletenessCritic.ts:101,195,314` / Plugin `completeness-critic.ts:80,95,109,124`)**须确认是否同名异义勿盲合**。
- **N-7**(hot,大改 243 处):Core 源 `IDEAgentAnalysisPacketBuilder.ts` ~37 named + `host-agent-workflows.ts` facade 24 导出 + 全消费链;rename `IDEAgent*`→`HostAgent*` 须四仓 grep 全量(含 `ideAgentAnalysis` 字段、`IDEAgentAnalysisUnit` 等)。
- **N-8**(cold 登记):主体 `ai-execution/` `Ai*`/`Agent*`/`Bootstrap*` 前缀混用,登记不实改热区文件。
- **N-9**(hot):双 `FileChangeHandler`(主体 496/Plugin 764)+双 `BootstrapTaskManager`(主体 704/Plugin 546)+ Core `DaemonJobKind` vs `ALEMBIC_JOB_KINDS` 内部重复→主体 `InProcess*`/Plugin `HostAgent*`,**改一个忘另一个是反复修改元凶**。
- **class Bootstrap→AppRuntime**(cold,最高优先):`Alembic/lib/Bootstrap.ts:15,16,24,37,50,91,94,229,260`(⚠️ macOS 大小写不敏感,`git ls-files` 复核真实名);**GAP consumer**:`bin/api-server.ts:12,59`/`bin/cli.ts:2095-2096,2116`/`bin/daemon-server.ts:18,68`/`cli/SetupService.ts:548,570`;测试 6 个。
- **RG9 stub 删除(cold,实测 20 文件非 8)**:host-agent-workflows 8 + **`runtime/evolution/PluginOpportunisticEvolution.ts`(文档漏)** + service 11(bootstrap 3/vector 2/evolution FileChangeHandler 1/git-diff-checkpoint 5);pin `RecipeGenerationSkeleton.test.ts:17-31,128-151`;**UNDER-PIN 7 文件**(`knowledge-index-rebuild`/`bootstrap-event-types`/`ContextualEnricher`/git-diff-checkpoint 4)删前须先补 pin;⚠️ 主体/Core 同路径是 LIVE 严禁碰;删前查 `package.json`/`plugin.json` exports。
- **host-agent-workflows 子目录化**(late):live importer `handlers/host-agent/{bootstrap,rescan,dimension-completion}.ts`+`tool-router.ts`+子系统相对 import+`knowledge-rescan.ts:55`+`RecipeFreshnessRuntime.ts`。
- **index Level 2 PlanStageId 值**(late-level2):三份手抄(Core `contracts.ts:1`+Plugin `PlanGenerationStage`+**zod 四处 `mcp-tools.ts:773,857,861,1071,1149`**只改 :773 会让其余拒收)+gate 字面量+rescan resolver+`HostMcpServer.ts:1094`+profile `'cold-start'/'rescan'`+`tools.ts:63,87`+`plan-tool.ts:346,348`。
- **index Level 2 工具名**(late-level2,保留旧名 alias):Plugin 大面(`PluginToolSurfaceCatalog/McpServer/tools/ToolPolicy/OnboardingContract/core-tools/output/StatusService/system/guidance/host-project-handoff/recipe-evidence-gate/dimension-completion/cold-start/guard/plan-tool/retrieval-checkpoint-diagnostics`)+ Core(`ColdStartPlan/ColdStartPresenters/**OutputBudget.ts:66 预算键改=破坏查表**/rawRef :70`)+ **主体独立 zod schema `mcp-tools.ts:432,608-609`+`ColdStartWorkflow.ts:8`+`ProjectContextWorkflowFacts.ts:357,393`+`BootstrapRefine.ts:107,423`** + 测试 ~18+ + `codex-scenarios` fixtures。

### 10.2 文档 + skill 修改点专表(用户强调,19 项)
| # | file:line | 改什么 | batch |
|---|---|---|---|
| 1 | `AlembicCore/docs/semantic-glossary.md:49-64,38-44,3-6` | **头号:canonical 词汇权威源**;`:3-6`「NOT renamed in code」免责声明须更新;§4.5 Level0 文档锁定落点 | cold |
| 2 | `AlembicCore/docs/layer-contract.md:18,19,77-84` | 分层人类契约(配 `config/layer-contract.json` 门禁,CG-5);BootstrapSession/cold-start 同步 | cold |
| 3 | `AlembicPlugin/CLAUDE.md:146-161,167` | 文件地图陈旧(列不存在 codex/mcp、daemon、governance、http;漏 recipe-generation/runtime/injection;`#codex/*` 死、漏 `#recipe-generation/*`) | cold |
| 4 | **`AlembicPlugin/AGENTS.md:146-161,167`**(原需求漏镜像) | 与 CLAUDE.md 完全相同陈旧地图,**成对改** | cold |
| 5 | `AlembicPlugin/lib/runtime/mcp/tools.ts:266,294,297,309-317` | tool `.describe()` 用户面(IDEAgent N-7 + cold-start/deepMining/moduleMining Level2) | late-level2 |
| 6 | `AlembicPlugin/.../cold-start.ts:1033-1061` | rebuild 中文提示+nextAction;errorCode `CODEX_BOOTSTRAP_REBUILD_CONFIRMATION_REQUIRED` **不改值仅文案** | late-level2 |
| 7 | `AlembicPlugin/.../PluginToolSurfaceCatalog.ts:247,258,259` | annotations title 用户面;`:259 gateway.action 'knowledge:bootstrap'` **不改值仅注释** | late-level2 |
| 8 | `AlembicPlugin/plugins/{alembic-claude-code,alembic-codex}/skills/alembic/SKILL.md:3,8,10,37,49,76` | `:49` 显式工具名;`:3` frontmatter;两份分发副本同步 | late-level2 |
| 9 | `AlembicPlugin/test/codex-acceptance-packs/architecture-recipe-loop/README.md:4,16,24,30,31,48` | 验收步骤工具名,改则 pack 跑不通 | late-level2 |
| 10 | `Alembic/templates/instructions/agent-static.md:17-19`/`conventions.md:37` | **ship 进用户项目** `.agents` 工具速查,须带旧名兼容;main-only | late-level2 |
| 11 | `AlembicPlugin/docs/declared-effects.md:16` | 副作用契约描述 | late-level2 |
| 12 | `Alembic/CLAUDE.md:160`/`AGENTS.md:160` | `lib/Bootstrap.ts` 路径,随 class 改;镜像同步 | cold |
| 13 | `Alembic/CLAUDE.md:117`/`AGENTS.md:117` | `alembic_bootstrap`「有意分叉禁合并」声明,Level2 改名不破坏 fork | late-level2 |
| 14 | `Alembic/skills/{alembic-create,alembic-guard,alembic-recipes,alembic-structure}/SKILL.md` | **受 shared-asset-drift 门禁**:走 edit-in-authority-then-sync(主体权威→同步插件→双仓 `check:shared-asset-drift` 绿,**从主体 `--sibling=plugin` 跑**);frontmatter/工具契约段是宿主差异段 | late-level2 |
| 15-18 | `Alembic/skills/alembic-guard/:45,56`、`alembic-devdocs/:19`、`alembic-create/:25`+Plugin `:27`、`alembic-recipes/SKILL.md:8`(触发关键词,改名影响触发匹配) | skill 工作流/触发词,双仓共享段走 drift 同步 | late-level2 |
| 19 | `Alembic/README*`、Plugin `README*`、`RELEASE-PLAYBOOK.md` | Level2 工具名+fork 同步;README pre-existing 陈旧 `alembic_task`(已退役) | late-level2 |
| 排除 | `*/CHANGELOG.md`(数十处)、`Alembic/vendor/*/docs/*` | **append-only 版本史/vendor 快照,不回改**(防全局替换误伤) | — |
| 零触点 | AlembicAgent `*.md` 全仓 | grep 全零命中,印证「Agent 仓 0 stage 词」 | — |

### 10.3 持久化/契约改值兼容点(Level 2 + U-1/U-2)
- **U-1 `DaemonJobSource 'codex'`**:声明 `JobStore.ts:15,27,61`+default `:106`(恒 'system')+**磁盘持久化 `:268 writeFileSync <id>.json`**+主体消费 `DaemonJobRunner.ts` 12 站+导出 `package.json:109 @alembic/core/daemon`。**四仓零代码路径写 'codex'**→CG-3 先查真实 `~/.asd/.../jobs/*.json` 存量:有→compat-map,无→硬删。
- **U-2 `codexSkillRoot`**(实到 `:590` ~20 处):Core `ProjectSkillDeliveryContracts.ts` 含**反序列化读 `:571,590`**+验证 `:353,359`;Plugin `ProjectSkillDelivery.ts:348,362,517`;主体 `SkillCompletionCapability.ts:264,169,199,205,219,228`。**WIRE/PERSISTED receipt key→双读 back-compat alias**,三仓 lockstep(CG-4)。
- **PlanStageId 值**:无 DB 列;三份手抄+zod 四处+gate+resolver+profile→alias 过渡,**zod 须 transform 接受旧输入**。
- **工具名**:保留旧 alias;**`OutputBudget.ts:66` 预算键随别名同步**;errorCode 不改。
- **冻结仅文档化**:job kind `'bootstrap'/'rescan'`(磁盘+HTTP+`wire-type-manifest.json:52`)、source `'bootstrap'`(DB default+**`QualityScorer.ts:288` 评分分支**,改=静默改质量分)、lifecycle `'evolving'/'decaying'`(`schema.ts:46`+SQL CASE `KnowledgeRepositoryImpl.ts:558`+**`migrations/006:12-13` 历史行**)、`gateway.action 'knowledge:bootstrap'`、`bootstrap-session:` 前缀(writer+parser 跨进程)、HTTP 路由 `/jobs/bootstrap` 等(+生成物 `dashboard-api-types.ts`)。

### 10.4 原需求文档遗漏补充(§2-§5 未列,15 项)
1. **vendor gitlink re-pin**(头号):三处 submodule,Core rename 封版 re-pin 才传播,src+dist `.d.ts` 都含旧符号→加 release-closure 子节。 2. **Dashboard=第 5 受影响面**:`vendor/AlembicDashboard/src/{api,hooks/useBootstrapSocket,components/Views/BootstrapProgressView/JobsView,App,constants}`,改 `alembic_bootstrap`/`/jobs/bootstrap` 则前端断→**决策:显式 out-of-scope(则 job-kind/route 值冻结,与 CG-8 持久化冻结一致)**。 3. **HTTP 路由独立公共契约**:`RuntimeContracts.ts:47,50`+主体 3 http 文件+生成物。 4. **生成已提交产物** `dashboard-api-types.ts`(DO NOT EDIT 却 committed)改须重跑生成器。 5. **主体独立 MCP zod** `mcp-tools.ts:608-609`+`ZodSchemas.test.ts`。 6. `DaemonJobKind` Core 内部重复(DRY 候选值不动)。 7. `lifecycle_transition_events` 第三持久锚 `migrations/006:12-13`。 8. `extractionGuide` Core domain(见 10.0#6)。 9. `residentProjectScopeAvailable` ~10 运行时文件(见 N-4)。 10. **env 耦合** `testMode.ts:9,90,113 ALEMBIC_TEST_BOOTSTRAP_DIMS`(env 名不改,勿全局 sweep 'bootstrap')。 11. `FileChangeEventSource` 边界 `sourceContracts.ts:32-33`(`codex-host-plan` 是更松独立字段,破坏风险低但须核字段类型)。 12. 测试 pin 全集(verdict `:60`、主体 N-9 双 live 测试、两仓 `ZodSchemas`、`codex-scenarios` fixtures)。 13. config registry `wire-type-manifest.json:52`+`layer-contract.md:18`。 14. **同文件文案审计要求**:改 code 符号时同文件 `.describe()`/message/annotations 串极易漏,需求显式要求连带审计。 15. §4.5#5 假前置已核为假(见 10.0#1)。

### 10.5 完整性声明
**已穷尽核实(可直接回填,无需实现期再扫)**:四仓 named export/import 链(IDEAgent 162/79/2、PlanStageId/zod、codexSkillRoot 到 :590、DaemonJobSource、工具名文件数 Core3/Plugin21/主体4、extractionGuide 6、residentProjectScopeAvailable ~10)、RG9 20 文件+under-pin 7、持久化锚(无 generation_stage 列已核、磁盘 JSON、SQL CASE、transition_events、QualityScorer、wire-manifest)、vendor=gitlink、文档/skill 四仓 grep(Agent 零触点已核)、测试 pin。
**仍须实现期再核(动态不可静态穷尽)**:① U-1 'codex' 真实磁盘存量(remove-vs-alias);② U-2 历史 receipt JSON 存量;③ D-1 形状调和精确字段映射表;④ `FileChangeEvent.source` 实际字段类型;⑤ profile `'cold-start'/'rescan'` 是否纳入 Level2 canonical(边界,CG 裁定);⑥ N-6 方向 + critic 链是否同名异义(CG);⑦ `codex-scenarios` fixtures 逐文件 toolCall(机械量大)。
**批次落地序**:**冷区立即** = class Bootstrap→AppRuntime(主体+12 文档/consumer)、N-5+zod 收口、N-8 登记、RG9 20-stub 删除(先补 7 under-pin)、文档专表 #1-4/#12;**热区**(伞形+主体波次后)= N-2/N-3/N-4/N-6-Core/N-7/N-9+D-1/D-2;**late-level2**(授权+alias)= 全 index Level2 值/工具名/HTTP 路由文档化 + 文档专表 #5-11/#13-19。

## §11 整体架构设计（2026-06-28 — 8 子系统深度测绘 + 整体设计 + 对抗 critique，权威，对 §1–§5 点修复具升级权威）

> 用户要求把本需求从"点修复集合（N-/D-/U-）"升级为**整体设计**：职责语义 / 组织结构 / 功能隔离 / 系统化命名 / 文件位置全做透，深挖真实代码。本节由 11-agent workflow（8 子系统逐文件测绘 → 整体设计 → 对抗 critique → 定稿，~1.28M tokens）产出；finalize 阶段实测订正了 critique 争点（IDEAgent 实测 **Core 166/Plugin 83**、vendor 确认 **submodule**、shim **8 文件非零消费**、god-file 行数实测 DaemonJobRunner 2006/plan-tool 2009/IDEAgentAnalysisPacketBuilder 1810/CompletenessCritic 871/ProjectContextWorkflowFacts 1585）。**N-1~N-9 / U-1/U-2 / class Bootstrap / stage vocab 在此被收为系统化命名方案的实例**；§11.H 为 Core repository/barrel/持久化层补测绘。

### §11 导言（职责语义 / 组织结构 / 功能隔离 / 系统化命名 / 文件位置）

> 本节为 `alembic-recipe-lifecycle-naming-layering-refactor` 的权威整体架构设计，合并了 holistic 设计稿与对抗审查结论。所有 critique 中**已核实成立**的修正已吸收（C1 submodule / C2 CG-3 export freeze / C3 shim 重审 / H1 计数重测 / H2 host-agent 文件夹自洽 / H3 StepSequence vs INDEX / H4 twin-collapse 提升为独立确认门 / M1-M4），over-reach 已剔除或降级。它在**确认决策之上构建、不反转**：INDEX 阶段词族、R1 不反向改名、freeze 列表、三准则删除、coverage-write sink 已 Core-owned（CG-3=B）。

**核对纪要（本节落笔前实测，覆盖 critique 争点）：**

| 事实 | 实测结果 | 影响 |
|---|---|---|
| `vendor/AlembicCore` 是否 submodule | **是**。`AlembicPlugin/vendor/AlembicCore` 与 `Alembic/vendor/AlembicCore` 均为 gitlink `160000`，两仓 `.gitmodules` 声明 `url=https://github.com/GxFn/AlembicCore.git`；`Alembic` 另有 `vendor/AlembicDashboard` gitlink | **C1 成立** → 每个 Core 批次必须带 `vendor-repin` 义务（见 G.RISK-1） |
| CG-3 sink 导出路径 | `AlembicPlugin/lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts:15` `from '@alembic/core/host-agent-workflows'` | **C2 成立** → 冻结该包导出，撤销 rename + barrel-delete（见 D/E/G.SAFE-1） |
| shim 目录真实内容 | `AlembicPlugin/lib/runtime/mcp/host-agent-workflows/` 实有 **8** 文件：`cold-start / dimension-completion / knowledge-index-rebuild / knowledge-rescan / project-context-analysis / project-data-root / recipe-evidence-gate / recipe-region-vector`（原稿漏列 `knowledge-index-rebuild`/`recipe-region-vector`，多列了不存在的通用名） | **C3 成立（修正版）** |
| shim 是否 zero-consumer | **否**。`AlembicPlugin/test/unit/RecipeGenerationSkeleton.test.ts:17-31` 把 7 条 `lib/runtime/mcp/host-agent-workflows/*` 路径登记为 `rg9AdapterPaths`，`:128-141` 用 `readFileSync` 断言每个文件是「`RG9 兼容适配` + 恰好 1 个 `export` + 无 `class/const/function`」的薄适配器 | 删除使该测试**因文件缺失而 red**（非 import 解析失败，是 `readWorkspaceFile` 抛错）→ 删除前必须先迁测试，归类 `hot` |
| IDEAgent 计数 | **Core 166 occ（3 文件：`host-agent-workflows.ts`/`index.ts`/`IDEAgentAnalysisPacketBuilder.ts`）/ Plugin 83 occ（仅 `lib/`，`src/` 0）** | **H1 成立**：原稿 162/79 与约束块 195/96 均错；以 166/83 为准重定 N-7 批次 |

> **路径口径**：Plugin 与主体（Alembic）真实源码根是 `lib/`（非 `src/`，见 `AlembicPlugin/CLAUDE.md` 文件地图）。本节所有 Plugin/主体 路径用 `lib/`；Core 用 `src/`；Agent 用 `src/agent/`。

---

### A. 职责语义图（层 × 角色 的单一职责 + god-file/flat-bucket 拆分）

该链是**一条逻辑流水线**（`plan → coldStart → deepMining/moduleMining → dimensionComplete → evolution`），在**一套共享 Core** 之上**实现两次**（Plugin host-agent 孪生、主体 in-process AI 孪生）。各层意图单一职责：

| 层 | 单一职责 | 禁止包含 |
|---|---|---|
| **Core/contract** | 纯 DTO + ports（无 I/O、无 host 名） | impl、repository 写、presenter 文案 |
| **Core/domain-service** | 确定性纯计算（planning、tiering、packet build、critic、advisor） | 持久化、session 状态、host 传输 |
| **Core/workflow** | 纯 builder：intent→plan；relevance/evolution 装配 | 活的 orchestrator（属于 hosts） |
| **Core/repository** | 持久状态的唯一写者（checkpoints、snapshots、coverage cells） | planning 逻辑、host 文案 |
| **Core/host-facade** | 稳定包导出面 | 把非 host 能力聚到 host 名下 |
| **Plugin host-adapter** | 按 **host-agent** 阶段把 Core 接到 MCP 传输 | 复制 Core domain 逻辑 |
| **Plugin/runtime/mcp** | tool registry、gate、projector、双 server 外壳 | 生命周期/evolution domain 逻辑 |
| **主体 internal-workflow** | 按 **in-process AI** 阶段把 Core 接进进程内 | daemon CRUD、job 调度 |
| **主体/daemon** | job CRUD + 调度 + process-event 记录 | workflow 编排、coverage 语义 |
| **主体/service** | host 服务（module/vector/wiki/skills/cleanup） | 生命周期编排 |
| **Agent/engine** | 配置驱动 LLM 执行（profiles→runtime→runs） | 超出 profile 元数据的阶段身份 |

**需要拆分的单一职责违反（god-file，行数实测）：**

1. **`Alembic/lib/daemon/DaemonJobRunner.ts`（2006 行）— 5 个职责挤在一文件**。拆为：
   - (a) **job CRUD** `create:229/enqueue:238/run:291/cancel:498/markInterrupted:570` → 留在 `daemon/DaemonJobRunner.ts`。
   - (b) **生命周期 orchestrator** `runDeepMiningRounds:1039`、`runModuleMiningWorkflow:1180`、`runPlanSelectionGate:945`、`runBootstrapPlanGate:935`、`executeApiAiWorkflow:894` → **移到 `lib/workflows/deep-mining/` 与 `lib/workflows/module-mining/`**（与 `cold-start/`、`knowledge-rescan/` 并列；当前是 workflow-orchestrator 埋在 daemon 的跨层泄漏）。
   - (c) **coverage-ledger gate** `ensureCoverageLedgerCells:1860`、`buildDeepMiningRoundPlanContext:1828`、`latestDeepMiningRound`、`selectModuleMiningModules:1895` → `daemon/coverage/DeepMiningRoundGate.ts`。
   - (d) **bootstrap-event bridge** `attachBootstrapProcessEventBridge:647`、`finalizeBootstrapJobFromSession:1296` → `daemon/JobProcessEventBridge.ts`。
   - (e) ~25 个私有 parse/coerce helper → `daemon/job-coerce.ts`。

2. **`AlembicPlugin/lib/recipe-generation/plan-tool.ts`（2009 行）** — router + projectInfoTree budgeting（~700L）+ module-seed + coverage-seed + deferred-row writes。拆：`plan/PlanRouter.ts`、`plan/ProjectInfoTreeBudget.ts`、`plan/CoverageSeedBuilder.ts`。

3. **`AlembicCore/src/workflows/capabilities/host-agent/IDEAgentAnalysisPacketBuilder.ts`（1810 行）** — candidate 收集 + 评分 + key/alias + 2 条 build path + project-context normalize。拆为 `HostAgentAnalysisPacketBuilder.ts`（入口）+ `analysis-packet/{Candidates,Scoring,UnitKeys,ProjectContextNormalize}.ts`。（host 名改名属 N-7，见 D，late-L2 带 alias。）

4. **`AlembicCore/src/workflows/capabilities/host-agent/CompletenessCritic.ts`（871 行）** — **两特征**：`buildCompletenessCritic`（逐维 critic）+ `buildCoverageLedger`（module×dimension 聚合器）。拆出聚合器 → `coverage/CoverageLedgerAggregator.ts`，统一散落的 coverage 三件套（见 C/§3）。**前置义务（M2）**：拆前先做 *shared-private-symbol scan*——grep 两特征是否共用私有 scoring helper/类型；若共用，提取到 `coverage/shared/` 而非硬劈文件。

5. **`Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`（1585 行）** — 名为 `*Facts` 却同时持有 facts + session lifecycle + presenters + fill-view + artifact build。拆：`ProjectContextFacts.ts`、`ProjectContextSessionManager.ts`、`ProjectContextPresenters.ts`、`ProjectContextFillView.ts`。

6. **`AlembicCore/src/host-agent-workflows.ts`（64 行）** — 过宽 facade，把 persistence + planning + presentation 聚在 host-agent 名下（见 B/§Core-facade）。**注意**：该文件的**包导出路径 `@alembic/core/host-agent-workflows` 冻结**（C2），文件内部拆分/honest-rename 不得改动该外部导出别名。

**flat-bucket（拆分但不属 god-file，靠 B 的放置规则消解）**：Core `host-agent/` 15 文件、Plugin `recipe-generation/host-agent-workflows/` 13 文件、主体 `ai-execution/` 19 文件、Plugin 4 个 owner-keyed projector 目录。

---

### B. 目标组织结构（per-repo 文件夹/层级树 before→after + 放置规则）

#### 放置规则（适用每个文件）

- **角色定文件夹，阶段定子文件夹。** 文件的 *role-kind*（contract/domain-service/workflow/repository/gate/projector/session/facade）选层级目录；其 *stage*（coldStart/deepMining/moduleMining/evolution）只在 **≥3 个文件共享该 stage 时**才建子目录，否则保持扁平（避免过度分层，对照 Agent `runs/` 粒度不均的味道）。
- **repository 写者只住 `repository/`**（不把 write-adapter 停在 `host-agent/`）。
- **contract-only 文件不 import impl**（`WorkflowReportTypes` 不得 import `MiningSessionStore`）。
- **跨 stage 共享件住 `shared/`**，不按孪生复制。
- **（H2 修正）`host-agent/` 文件夹是「host-agent *协议/契约*面」的角色中性词，不是具体 host 名**。C-7 name-lint 通过**路径豁免** `**/capabilities/host-agent/**` 实现可枚举的可门禁性，而非靠模糊的「L3 adapter 豁免」标签。即：文件夹名 `host-agent` 合法；但其内**导出符号**仍受 `/IDEAgent|codex/` 禁令约束（故 `IDEAgent*` 仍须改 `HostAgent*`）。

#### Core — before → after

```
workflows/
  cold-start/ ───────┐                workflows/
  knowledge-rescan/ ─┴─ (twins) ─▶     [twin-collapse → 提升为独立确认门 H4，见 G.RISK-2；
                                        放置批次不执行 project-analysis 合并]
  capabilities/
    host-agent/ (15-file 扁平桶)        capabilities/
      IDEAgentAnalysisPacketBuilder ─▶    host-agent/   (host-agent-协议面 only，路径豁免)
      CompletenessCritic.ts(+ledger) ─▶     HostAgentAnalysisPacketBuilder.ts (+analysis-packet/*) [late-L2 alias]
      CoverageLedgerWrite.ts ────────▶      MissionBriefing*.ts, HostAgentMission*.ts, *SubmissionTracker.ts
      CoverageLedgerAdvisor.ts ──────▶    coverage/   (统一三件套，见 C§3)
      ProjectSkillDeliveryContracts ─▶      CoverageLedgerAggregator.ts (ex-CompletenessCritic)
      BootstrapTerminalToolset ──────▶      CoverageLedgerWrite.ts (repository, KEEP impl — CG-3 done)
                                            CoverageLedgerAdvisor.ts
                                          contract/
                                            ProjectSkillDeliveryContracts.ts (原误置 host-agent/)
    planning/dimensions/                  planning/
      BootstrapTerminalToolset.ts ─────▶    terminal/TerminalToolset.ts (原误置 dimensions/)
host-agent-workflows.ts (over-broad) ───▶ 内部可拆分，但【包导出 ./host-agent-workflows 冻结，禁止 rename】(C2)
```

#### Plugin — before → after

```
recipe-generation/host-agent-workflows/   recipe-generation/host-agent/  (角色子分组，消 13-file 扁平桶)
  cold-start.ts (1394L) ─────────────▶      cold-start/ColdStartWorkflow.ts
  knowledge-rescan.ts (1269L) ───────▶      rescan/KnowledgeRescanWorkflow.ts
  dimension-completion.ts (1541L) ───▶      dimension-complete/DimensionCompletionWorkflow.ts
  coverage-ledger-write.ts (barrel) ─▶      【保留，不删】(C2：是 CG-3=B sink，导出路径冻结)
  recipe-evidence-gate.ts ───────────▶      gates/RecipeEvidenceGate.ts
  completeness-critic.ts ────────────▶      gates/CompletenessCriticAdapter.ts
  project-context-analysis.ts ───────▶      shared/ProjectContextAnalysis.ts
  project-data-root.ts (19L) ────────▶      shared/host-agent-data-root.ts
  briefing-budget.ts ────────────────▶      shared/briefing-budget.ts
runtime/mcp/host-agent-workflows/ (8 shims) ▶ 【先迁 RecipeGenerationSkeleton.test:17-31 再删，hot】(C3)
runtime/evolution/PluginOpportunisticEvolution.ts (shim) ▶ DELETE (live twin 在 recipe-generation/evolution/)
runtime/ide-agent/IDEAgentAnalysisSurface.ts ──▶ runtime/host-agent/HostAgentAnalysisSurface.ts [late-L2]
runtime/mcp/{core,local,public,knowledge-context}-tools/ ─▶ projectors/{embedded,host-local,agent-public,knowledge}/ [late-batch]
runtime/runtime/ (nested 同名) ────────▶ 【降级为 optional-piggyback，M1，不单独制造 churn commit】
```

*Projector 目录*：4 个 owner-keyed 目录（`core-tools/local-tools/public-tools/knowledge-context-tools`）是 inconsistent-prefix 味道，但 `tools.ts` 用 side-effect import 注册它们。**late-batch**：改成角色中性 `projectors/{embedded,host-local,agent-public,knowledge}/`，保注册、去 `codex-local`→`local-tools` 的 host 泄漏。

#### 主体（Alembic）— before → after

```
lib/Bootstrap.ts (app launcher) ──────▶ lib/AppRuntime.ts (释放 'Bootstrap' 词汇 — 见 D)
lib/workflows/ai-execution/ (19-file 扁平桶) ──▶ lib/workflows/dimension-execution/
   (按角色子分组)                                  pipeline/  (AiDimensionPipeline, Dispatcher, SessionRunner)
                                                   builders/  (RuntimeInitializer, InputBuilders, RuntimeBuilder)
                                                   consumers/ (Consumers, Projections, ProcessEvents)
                                                   context/   (DimensionContext, Admission, RestoreState, RescanContext→rescan/)
                                                   contract/  (Types, PcvNodeEvidence)
lib/daemon/DaemonJobRunner.ts (god-file) ──▶ 按 A§1 拆；runDeepMining/ModuleMining ──▶ lib/workflows/{deep-mining,module-mining}/
lib/service/bootstrap/UiStartupTasks.ts ──▶ service/evolution/StartupMaintenanceTasks.ts (maintenance 非 UI)
lib/service/FileChangeDispatcher.ts (root 松散) ──▶ service/evolution/FileChangeDispatcher.ts
lib/service/evolution/FileChangeHandler.ts ──▶ InProcessFileChangeHandler (N-9 孪生)
```

#### Agent — before → after

```
src/agent/runs/<stage>/  (粒度不均，KEEP 一阶段一文件夹)
service/AgentRunContracts.ts (run + profile 契约混) ──▶ split: service/AgentRunContracts.ts + profiles/AgentProfileContracts.ts
runtime/AgentInterfaceContract.ts (跨切面在 runtime/) ──▶ contract/AgentInterfaceContract.ts
service/index.ts ─▶ 【M1：仅文档说明它是 whole-engine barrel，非代码改动；不作为独立 commit】
```

---

### C. 功能隔离边界（规则 + 当前违反 file:line + 可门禁化）

| # | 边界 | 规则 | 当前违反（file:line） | 门禁(CG-5) |
|---|---|---|---|---|
| 1 | **Core 共享 ← 单向 host** | Core 永不 import host；hosts import Core | 今日干净（Core 无 Plugin/主体 import） | **是** — import-direction lint：`AlembicCore/src/**` 不得 import 同级仓库 |
| 2 | **generation vs maintenance(evolution)** | coldStart/deepMining/moduleMining（生成）与 decay/sweep/proposal（维护）分离 | `UiStartupTasks.ts` 误置：在 `bootstrap/` 下驱动 staging-promote/proposal-GC=维护，与 `EvolutionMaintenanceSweep` 重叠；`DaemonJobRunner` 把生成 orchestrator 与 `adviseCoverageLedger` 维护调用混置 | **部分** — folder-membership lint（`bootstrap/` 不得 import evolution 驱动） |
| 3 | **coverage 三件套内聚** | 三个 coverage 名=一个特征、一个文件夹 | `buildCoverageLedger` 埋在 `CompletenessCritic.ts`(871L,2 concern) + `CoverageLedgerWrite.ts` + `CoverageLedgerAdvisor.ts` 散在 `host-agent/`；advisor 伸手 `planning/knowledge` 取 `resolveModuleTier`（跨层泄漏） | **否** — 结构性，靠 `coverage/` 共址 |
| 4 | **contract/type vs impl** | type 文件不 import impl | `WorkflowReportTypes.ts` 把 `host-agent/MiningSessionStore`+`persistence/FileDiffPlanner` import 进类型文件；`WorkflowSnapshotStore` import `MiningSessionStore`（已记 Known-exception） | **是** — lint：`*Types.ts`/`contract/**` 只能 import 其它 contract |
| 5 | **host-wire DTO vs Core domain shape** | host 校验 wire DTO，再经一个 adapter fn 桥到 Core domain | Plugin gate 重声明 `PlanSelectionInput:20`/`NormalizedPlanSelection:72`/`PlanScaleOverride`/`PlanSelectionModuleBinding` 影子化 Core `PlanSelection`，经 `toCorePlanSelection:525` 桥接 — **这是意图终态**（D-1/D-2 确认），只需把 wire DTO *命名为 wire*（`PlanSelectionWire`） | **否** — 保留；仅为清晰 rename |
| 6 | **per-stage 隔离** | 阶段代码自包含 | Agent `module-mining-dimension` 复用 `bootstrapDimensionPipeline` 工厂（`module.profile.ts`,`AgentStageFactoryRegistry`）；`AgentRunCoordinator.ts:29,380,398,481` 同时持 coldStart+moduleMining fanout | **否** — 有意收敛（presets）；文档化为 shared-engine，不强拆 |
| 7 | **共享符号 host-name 中性** | 任何 shared/exported 名不含 `codex`/`ide` | `IDEAgent*` **Core 166 occ / Plugin 83 occ（实测）**；`#codex/*` alias(18 文件)；`RuntimeContext.ts` 的 `CODEX_*`；`JOB_CLIENT='codex-plugin'`；`codexSkillRoot`(SkillCompletionCapability)；`DaemonJobSource 'codex'` | **是** — name-lint：shared 导出不得匹配 `/IDEAgent\|codex\|^CODEX_/`；豁免按**路径** `**/capabilities/host-agent/**`（H2），不靠 L3 标签 |

**孪生协调（边界 3）：** `Plugin/lib/recipe-generation/evolution/FileChangeHandler.ts`(828L,`UnifiedEvolutionReport`) 与 `Alembic/lib/service/evolution/FileChangeHandler.ts`(496L,`ReactiveEvolutionReport`,impl `FileChangeSubscriber`) — 同类名两仓。共享 `assessFileImpact`/`extractRecipeTokens` 已在 `@alembic/core/evolution`。**设计规则**：rename 为 **`HostAgentFileChangeHandler`**(Plugin)/**`InProcessFileChangeHandler`**(主体)，共用 `@alembic/core/evolution` base（N-9）。同样 scheme 用于双 `BootstrapTaskManager` → `HostAgent*`/`InProcess*`。

---

### D. 系统化命名方案（layer×role 约定表 + 把 point-items 收为该方案的实例）

#### 约定表 — (层 × 角色) → 模式

| 层 × 角色 | 模式 | 示例 |
|---|---|---|
| Core domain **contract** | 裸概念名词 | `PlanSelection`, `CoverageLedger`, `RecipeSnapshot` |
| Core **workflow orchestrator** | `<Stage>Workflow` | `ColdStartWorkflow`, `KnowledgeRescanWorkflow` |
| **execution plan / step-list** | **`<Stage>StepSequence`**（Level0-internal，见 H3 注） | `ColdStartStepSequence`（原 `ColdStartWorkflowPlan`） |
| 用户确认的 dimension/scale | 保留 **`PlanSelection`**（唯一合法 "Plan*"） | `PlanSelection`, `planK`, `planMaxRounds` |
| **gate** | `<Concern>Gate` | `RecipeEvidenceGate`, `DeepMiningRoundGate`, `PlanGenerationGate` |
| **projector / presenter** | `<X>Projector` / `<X>Presenter` | `ScanRunProjection`, `ColdStartPresenters` |
| **repository** | `<Concept>Repository` / `<Concept>Store` | `CoverageLedgerRepository`, `FileDiffSnapshotStore` |
| **domain-service(纯)** | `<Verb><Concept>` fn / `<Concept>Builder` | `buildCoverageLedger`, `MissionBriefingBuilder` |
| **host adapter** | `HostAgent<X>`(Plugin) / `InProcess<X>`(主体) | `HostAgentFileChangeHandler` / `InProcessFileChangeHandler` |
| **facade** | `HostAgent<X>`（杀 `IDEAgent*`） | `HostAgentAnalysisPacket`, `HostAgentAnalysisSurface` |
| **session** | `<Concept>Session`（杀 `bootstrapSession` 泄漏） | `MiningSession`, `AnalysisSession` |
| **app process** | `AppRuntime` / `AppLauncher` | `AppRuntime`（原 class `Bootstrap`） |
| **stage vocab** | **INDEX 族**（确认） | fullIndex/initialIndex(coldStart), incrementalIndex/coverageExpansion(deepMining), scopedIndex/moduleReindex(moduleMining), refresh(maintenance) |
| **host-neutral identity** | 角色词，无 host 名 | `DaemonJobSource: 'host-agent'\|'system'`, `hostSkillRoot`, `JOB_CLIENT='plugin'` |

#### 每个 smell 都是该方案的**实例**（非临时修补）

| Point-item | 应用的方案规则 | 目标名 | 批次 |
|---|---|---|---|
| **N-1** `ColdStartWorkflowPlan` vs `PlanSelection` | execution-plan → `<Stage>StepSequence`；`PlanSelection` 保留 | `ColdStartStepSequence`/`KnowledgeRescanStepSequence` | hot（**H3 注**：Level0-internal 符号，Level2 INDEX 落地时随同 INDEX 词族再改一次，已登记为预期 follow-rename，不视为新违反） |
| **N-2** gate `validatePlanSelection` | gate → `<Concern>Gate`；wire DTO 命名为 wire | `PlanGenerationGate.validate(PlanSelectionWire)` | hot |
| **N-3** verdict `'defer-to-alembic-service'` | host-neutral identity | `'defer-to-resident'` | hot |
| **N-4** `residentProjectScopeAvailable` | 单跨布尔 → 命名 domain 概念 | `ResidentScope` value-object 串一次 | hot（7-file plumb） |
| **N-5** `PlanGenerationStage` camel vs kebab | stage vocab 单源 → import Core `PlanStageId` | 删本地 enum，import Core | hot |
| **N-6** `miningGuidance`/`extractionGuide` | domain-service 名词统一 | `extractionGuide`（取一） | cold |
| **N-7** `IDEAgent*`（**Core 166 / Plugin 83 实测**） | facade/host-adapter → `HostAgent*` | `HostAgentAnalysisPacket*`/`HostAgentAnalysisSurface` | **late-L2**（含 vendor `dist/*.d.ts` 类型面，blast radius 大，alias） |
| **N-8** 主体 `Ai*`/`Agent*`/`Bootstrap*` 三前缀 | role+stage scheme | 统一 `Dimension*`/`InProcess*`；非 app 去 `Bootstrap*` | hot（逐文件 green-commit） |
| **N-9** 双 `FileChangeHandler`/`BootstrapTaskManager` | host adapter → `HostAgent*`/`InProcess*` + Core base | 同上 | hot |
| **class Bootstrap**(launcher) | app process → `AppRuntime` | `AppRuntime`（释放 `Bootstrap`） | hot（4 consumers） |
| **U-1** `DaemonJobSource 'codex'` | **持久字面量** | **冻结，文档-only**（M4：source 落进 job 行，是 persisted-literal，未授权 DB migration 不改值，连 alias 也不上） | **freeze** |
| **U-2** `codexSkillRoot` | host-neutral（非持久） | `hostSkillRoot` | hot |
| **stage vocab** | INDEX 族；Level0 doc-lock，Level2 enum+MCP rename 带 alias | 按确认决策 | Level0 now / Level2 late |

**批次图例：** *cold*=无真实 import/现在安全 · *hot*=有真实 import，同 commit 更新消费方，逐文件 main 绿 · *late-L2*=用户授权的 contract/enum/MCP rename 带 alias · *freeze*=持久字面量，文档-only（job kind `'bootstrap'`/`'rescan'`、**job source `'codex'`(M4)**、lifecycle `'evolving'`/`'decaying'`、`coverage_ledger`/`deep_mining_rounds` 列、`/jobs/bootstrap`、`knowledge:bootstrap`、`bootstrap-session:` 前缀、errorCodes）。

---

### E. 文件放置/改名计划（current→target，batch + 同 commit 义务）

> **每个 Core 行强制带 `vendor-repin` 义务（C1）**：Core 侧批次必须 **先落 Core → 重建 Core `dist` → 在同一逻辑步内 re-pin 两处 `vendor/AlembicCore` gitlink（Plugin + 主体）→ 再跑消费方 build**。否则消费 `@alembic/core/*` 解析到 **stale vendored Core**，`dist/*.d.ts` 类型面与改名后源不符，consumer `tsc` 在别仓 pinned commit 处变 red，逐文件 green-commit 纪律抓不到。

| Current → Target | Role | Batch | 为什么 | 同 commit 义务 |
|---|---|---|---|---|
| `Plugin/lib/runtime/mcp/host-agent-workflows/*`（**8 文件**）→ DELETE | dead-stub | **hot**（C3） | 非 zero-consumer：`RecipeGenerationSkeleton.test.ts:17-31` 把其中 7 条登记为 `rg9AdapterPaths` 并 `readFileSync` 断言 | **先迁/删该测试断言数组与 :128-141 循环**，再删文件；重审实有 8 文件含 `knowledge-index-rebuild.ts`/`recipe-region-vector.ts`；逐个 grep `#`-alias/lib 消费 import-clean |
| `Plugin/lib/runtime/evolution/PluginOpportunisticEvolution.ts`(shim) → DELETE | dead-stub | cold | live twin 在 `recipe-generation/evolution/` | retarget `#codex/evolution` 调用方；注意 test:25 同登记，需同步 |
| `Plugin/lib/recipe-generation/host-agent-workflows/coverage-ledger-write.ts` | **KEEP** | — | **C2：CG-3=B sink，导出 `@alembic/core/host-agent-workflows`，冻结不动** | 无 |
| `Core/.../host-agent/CompletenessCritic.ts` → 拆 critic + `coverage/CoverageLedgerAggregator.ts` | gate+domain-service | hot+**vendor-repin** | 871L,2 concern；统一三件套 | **M2 前置 shared-private-symbol scan**；移 `buildCoverageLedger`+类型；更新 `CoverageLedgerWrite` import |
| `Core/.../host-agent/CoverageLedgerWrite.ts` → `coverage/CoverageLedgerWrite.ts` | repository | hot+**vendor-repin** | repository 写者误置 host-agent/（KEEP impl，CG-3 done） | 更新 barrel + 主体/Plugin importer |
| `Core/.../host-agent/CoverageLedgerAdvisor.ts` → `coverage/CoverageLedgerAdvisor.ts` | domain-service | hot+**vendor-repin** | 三件套内聚 | 移动；**M3**：`resolveModuleTier`→`resolveProjectSizeTier` 仅在 grep 证实与 `TierScheduler` 同作用域 co-resolve 时才改，否则 drop 该 rename |
| `Core/.../host-agent/IDEAgentAnalysisPacketBuilder.ts`(1810L) → `host-agent/HostAgentAnalysisPacketBuilder.ts` + `analysis-packet/*` | facade+domain-service | **late-L2+vendor-repin** | 166-occ host 名 + god-file | alias 旧导出；拆 helper；更新 `host-agent-workflows.ts`+`src/index.ts`；含 `dist/*.d.ts` 重建 |
| `Core/.../planning/dimensions/BootstrapTerminalToolset.ts` → `planning/terminal/TerminalToolset.ts` | domain-service | hot+**vendor-repin** | 误置（非 dimension 关注） | 更新 mission-briefing importer |
| `Core/.../host-agent/ProjectSkillDeliveryContracts.ts` → `contract/ProjectSkillDeliveryContracts.ts` | contract | cold+**vendor-repin** | 误置 | 更新 barrel |
| `Core/src/host-agent-workflows.ts` 内部拆分 | facade | — | **C2：包导出 `./host-agent-workflows` 冻结，禁止 rename 为 `host-workflows`** | 仅内部 re-org，外部别名不动 |
| `Core/workflows/cold-start/* + knowledge-rescan/*` → `project-analysis/*` | workflow | **提升为独立确认门（H4）** | 是行为重构非放置；触 coldStart R1 | **不在本放置批次执行**；见 G.RISK-2 |
| `Plugin/.../host-agent-workflows/{cold-start,knowledge-rescan,dimension-completion}.ts` → `host-agent/{cold-start,rescan,dimension-complete}/*Workflow.ts` | host-adapter | hot | 13-file 扁平桶 | 更新 `handlers/host-agent/*` importer |
| `Plugin/lib/runtime/ide-agent/IDEAgentAnalysisSurface.ts` → `runtime/host-agent/HostAgentAnalysisSurface.ts` | projector | late-L2 | host 名(N-7) | alias `#codex/ide-agent`；更新 3 workflow importer |
| `Plugin/lib/recipe-generation/plan-tool.ts`(2009L) → `plan/{PlanRouter,ProjectInfoTreeBudget,CoverageSeedBuilder}.ts` | workflow | hot | god-file | 更新 `McpServer.ts`,`tool-router.ts` |
| `Plugin/.../plan-generation-gate.ts` 本地 DTO → `PlanSelectionWire` | gate | hot | N-2/N-5 wire-vs-domain | 保 `toCorePlanSelection:525`；仅 rename 类型 |
| `Alembic/lib/Bootstrap.ts` class `Bootstrap` → `lib/AppRuntime.ts` `AppRuntime` | app-runtime | hot | 释放 `Bootstrap` 词汇 | 更新 `bin/cli.ts:2096`,`bin/daemon-server.ts:73`,`bin/api-server.ts:59`,`SetupService.ts:570` |
| `Alembic/lib/daemon/DaemonJobRunner.ts`(2006L) → 拆 per A§1；`runDeepMiningRounds:1039`/`runModuleMiningWorkflow:1180` → `lib/workflows/{deep-mining,module-mining}/` | workflow | hot | god-file + workflow-in-wrong-layer | 更新 `bin/daemon-server.ts`,`http/routes/{jobs,modules}.ts`,`DashboardOperations.ts` |
| `Alembic/lib/workflows/ai-execution/*`(19 文件,`Ai*`/`Agent*`/`Bootstrap*`) → `dimension-execution/{pipeline,builders,consumers,context,contract}/` + 符号 → `Dimension*` | mixed | hot | N-8 三向冲突 + 扁平桶 | 逐文件 green-commit |
| `Alembic/.../skill-delivery/SkillCompletionCapability.ts` `codexSkillRoot` → `hostSkillRoot` | domain-service | hot | U-2 内部 agent host 泄漏 | 更新 `BootstrapConsumers.ts` 调用方 |
| `Alembic/lib/service/bootstrap/UiStartupTasks.ts` → `service/evolution/StartupMaintenanceTasks.ts` | workflow | hot | 误置；maintenance 非 UI | 更新 Dashboard/daemon startup 装配 |
| `Alembic/lib/service/FileChangeDispatcher.ts` → `service/evolution/FileChangeDispatcher.ts` | domain-service | cold | root 松散，协作者在 evolution/ | 更新 import 路径 |
| `Alembic/lib/service/evolution/FileChangeHandler.ts` → `InProcessFileChangeHandler`（+Plugin twin → `HostAgentFileChangeHandler`，共用 Core base） | host-adapter | hot | N-9 孪生 | 两仓同步；Core base 走 vendor-repin |
| `Plugin/lib/runtime/runtime/*`(nested) → `runtime/context/*` | mixed | **optional-piggyback（M1）** | 仅美观，churn 高零消费收益 | 仅当某 hot 批次已动该目录时顺带；不单独 commit |
| `Agent/.../service/AgentRunContracts.ts` → 拆 `profiles/AgentProfileContracts.ts` | contract | cold | profile 契约误置 service/ | 更新 profile compiler/registry import |
| `Agent/.../plan.profile.ts:24-29`,`ModuleMiningAgentRun.ts:46`,`AgentRunCoordinator.ts:29` stage 字面量 → import Core `PlanStageId` | contract | Level0-now | stage-vocab 漂移(doc-lock) | 用 enum 引替换硬编码字面量 |

**freeze 已尊重：** job kind/source 持久字面量除非授权 DB migration 否则不改（**U-1 source 'codex' 退到 freeze**，M4）；`coverage_ledger`/`deep_mining_rounds` 列不动；`bootstrap-session:` 前缀、errorCodes、`/jobs/bootstrap`、`knowledge:bootstrap` 文档-only。

---

### F. 相对原 doc 的新增（point-fixes → 整体设计 的增量）

原 doc 是一袋 **point-items（N-1..N-9、U-1/U-2、class Bootstrap）**。本整体设计新增：

1. **role × layer 命名约定（D）** — 每个 point-item 成为某表格单元的 *推导*，非独立修补。新代码无需查表即自命名（任何未来 execution-plan 即 `<Stage>StepSequence`，类级别终结 `*Plan` 冲突）。
2. **per-stage/per-role 文件夹方案（B）** — 放置 *规则*（role→folder，stage→subfolder when ≥3）消解 point-item 从未触及的扁平桶。
3. **god-file 拆分（A）** — point-item 完全遗漏：`DaemonJobRunner` 2006L（5 职责，含 workflow-in-wrong-layer）、`plan-tool` 2009L、`IDEAgentAnalysisPacketBuilder` 1810L、`ProjectContextWorkflowFacts` 1585L、`CompletenessCritic` 871L（2 特征）。
4. **coverage 三件套统一（C§3）** — 识别 `CompletenessCritic.buildCoverageLedger`+`CoverageLedgerWrite`+`CoverageLedgerAdvisor` 为 *一特征散在三名两目录*，加 `resolveModuleTier` vs `TierScheduler` tier-axis 冲突（M3 条件化）。
5. **隔离-GATE 设计（C, CG-5）** — 具体可门禁化 lint：import-direction、contract-purity、host-name-neutrality（`/IDEAgent|codex/` + **路径豁免 `**/capabilities/host-agent/**`**，H2）、folder-membership。
6. **孪生收敛为一等边界（C, twin）** — `HostAgent*`/`InProcess*` over Core base，统一用于双 `FileChangeHandler` 与双 `BootstrapTaskManager`。（Core `cold-start`/`knowledge-rescan` 结构孪生 → `project-analysis` 不在本设计批次，提升为 G.RISK-2 独立确认门。）
7. **批次纪律绑定 freeze 列表、三准则删除与 submodule re-pin** — 每个 move/rename 带批次（cold/hot/late-L2/freeze）+ 同 commit 义务 + **Core 行 vendor-repin 义务**，refactor 以 green-per-file 增量落地，尊重 merge-churn 风险（冷区先行、热区在在途 realverify/mainbody 波次后）。

---

### G. 待决/风险（新增 CG 候选 + freeze/contract 安全声明）

**新增风险（critique 升级，需控制器/用户确认）：**

- **RISK-1（C1，最高，阻塞性）— submodule re-pin 排序**：`vendor/AlembicCore` 是 gitlink（`AlembicPlugin` `90c2295`、`Alembic` `e809140`，`.gitmodules` 指 `github.com/GxFn/AlembicCore.git`）。Core 半边计划在 re-pin 前**不可 green-verify**。决策：每个 Core 批次落地序列 = Core commit → `npm run build:core`（重建 `dist`）→ `git -C vendor/AlembicCore checkout <core-commit>` + `git add vendor/AlembicCore`（Plugin 与主体两处同一逻辑步）→ 再跑消费方 `build:check`。**未把此排序写进每个 Core 行前，任何 Core hot/late-L2 行不可派发。**
- **RISK-2 → 已转 IN-SCOPE（2026-06-28 用户决策"纳入本重构现在做"）— Core `cold-start`/`knowledge-rescan` → `project-index` 孪生折叠**：经定向深挖订正（见 §11.I + ledger 设计 `wakeflow-ledger/AlembicCore/alembic-coldstart-rescan-family-collapse-design-2026-06-28.md`），**Core 半边只持 intent+plan+(薄)presenter**（orchestration/step-list 在兄弟仓；Core `presentInternal*` 零生产消费=dead/test-only）→ **本需求 IN-SCOPE = Core intent+plan 折叠到 `workflows/project-index/`（mode full|incremental，INDEX 词汇 CG-B）**，安全（~60-70% 孪生 + 干净 mode 轴）。**留作 incremental-mode strategy 不强合**：rescan-only 分析脊（gap/audit/coverage/projector）+ 两 presenter 输出形。**R1 调和**：调用方经 barrel 按符号名 import→文件夹改名被 compat-alias shim 隐形吸收；**兄弟仓 orchestrator（`ColdStartWorkflow`）在 Core 折叠波只 re-point import**；`runProjectIndexWorkflow` 全 orchestrator 统一 → **已纳入 IN-SCOPE（用户 2026-06-28"并入一起处理"），作为 Core 折叠之后的接力波，设计见 §12.1**（Core 折叠先行→orchestrator 统一接力）。frozen 字面量（sourceTag/response.tool）不变。排 hot-zone（CG-3+realverify 后）。
- **RISK-3（H1）— N-7 计数一次性重测**：实测 Core 166 / Plugin 83（原稿 162/79、约束块 195/96 均错）。late-L2 批次大小须按 166/83 + vendor `dist/*.d.ts` 类型面重估；若跨多文件 alias 不可一批落，拆为多 late-L2 子批。

**CG-A/B/C 已决（2026-06-28 用户拍板）：**

- **CG-A = 路径豁免文件夹（已决）**：name-lint 按路径豁免 `**/capabilities/host-agent/**`（Core）与 `runtime/host-agent/`（Plugin）作为「协议面角色词」；但其内**导出符号仍受 `/IDEAgent|codex/` 禁令**（IDEAgent* 仍须改 HostAgent*）。可枚举、可门禁。
- **CG-B = 直接用 INDEX 内部名（已决）**：execution-plan/折叠后家族内部符号**现在就用 INDEX 词汇**（`project-index` / `ProjectIndex*` / mode `full|incremental`，对齐 §11.I 折叠），不走 `<Stage>StepSequence` 过渡。**代价已知**：内部名先于 `PlanStageId` 枚举值（仍 Level2/frozen）改、暂与枚举值不一致；**持久化/契约字面量（PlanStageId 枚举值、sourceTag、response.tool）仍 frozen 不动**，仅内部结构/符号名用 INDEX。
- **CG-C = 先 scan 再决（已决）**：M2 `CompletenessCritic` 拆前先 grep 两特征是否共用私有 scoring helper/类型→共用提 `coverage/shared/`、不共用硬拆 `CoverageLedgerAggregator.ts`；M3 `resolveModuleTier` rename 仅在 grep 证实与 `TierScheduler` co-resolve 时才改，否则 drop。

**freeze/contract 安全声明：**

- **包导出 `@alembic/core/host-agent-workflows` 冻结**（C2）：不 rename 为 `host-workflows`，不删 Plugin `coverage-ledger-write.ts` barrel，不 retarget 其消费方。该 sink 属 CG-3=B（半落地 `c4cac6b` 量级），本 refactor 不重做；若确需收口，作为 mainbody-realverify-followup CG-3 的 follow-on，非本需求。
- **持久字面量冻结**：job kind `'bootstrap'`/`'rescan'`、**job source `'codex'`（U-1 退 freeze，M4）**、lifecycle `'evolving'`/`'decaying'`、`coverage_ledger`/`deep_mining_rounds` 列、`/jobs/bootstrap`、`knowledge:bootstrap`、`bootstrap-session:` 前缀、errorCodes —— 文档-only，未授权 DB migration 不改值。
- **R1 不反向改名**：有真实 import 的主名（`cold-start` 等）不反向改；`project-analysis` 折叠因此入 RISK-2 独立门。
- **三准则删除**：dead-stub 删除须满足 import 扫描干净 + 替代入口已连 + 代表性 build/check 通过；C3 已证 Plugin shim 非 import-clean（测试消费），故归 hot 并先迁测试。

**已验证为优、保留：** D 的 role×layer 表作为推导引擎；B 的「role→folder, stage→subfolder when ≥3」；C/CG-5 的 lint（import-direction/contract-purity/name-neutrality，H2 路径豁免修复后可执行）；A 的三处行数实证 god-file 拆分（2006/2009/1585）与 `runDeepMiningRounds` workflow-in-wrong-layer 观察。

---

### §11.I cold-start/knowledge-rescan 孪生折叠设计（RISK-2 已转 IN-SCOPE，CG-B INDEX 词汇，2026-06-28）

> 详细 grounded 设计（行为-diff/目标形/R1/分阶段/风险全 file:line）见 ledger `wakeflow-ledger/AlembicCore/alembic-coldstart-rescan-family-collapse-design-2026-06-28.md`。

**0 范围订正（关键）**：原框架以为两家族在 Core 持完整 `intent→plan→step-list→presenter` 流水线——**错**。**Core 只持 intent+plan+(薄)presenter**；真正 orchestration/step-list 在兄弟仓（`Alembic/lib/workflows/{cold-start,knowledge-rescan}/*Workflow.ts` in-process + `AlembicPlugin/lib/recipe-generation/host-agent-workflows/{cold-start,knowledge-rescan}.ts` host-agent）。Core 自己的 `presentInternalColdStartResponse`(ColdStartPresenters.ts:140)/`presentInternalKnowledgeRescanResponse`(:71)/`buildInternalColdStartReport`(:62) **零生产消费**（仅 `test/ColdStartSelectionSummary.test.ts` 钉，daemon-removal 期遗留）→ Core 折叠目标更薄更安全。

**1 行为-diff 裁定**：intent+plan 骨架 **~60-70% 孪生**，分歧=干净 mode 轴。full(ex-coldStart)：`analysisMode:'full'`+`cleanupPolicy:'full-reset'`+`scan.incremental:false`+`prepare.clearOldData:true`；incremental(ex-rescan)：`analysisMode` from force+`cleanupPolicy` 3-way+`scan.incremental` from analysisMode+`prepare:{}`。**`materialize` 块字节相同**；`response.tool`('alembic_bootstrap'/'alembic_rescan')+`sourceTag`('bootstrap'/'rescan-internal'/…)=**frozen 字面量按 mode 选**。mode-正交可选附加：full 有 skipTargetDelivery/ignoredFileDiffIncremental，incremental 有 reason/perDimensionTargets/moduleDimensionTargets。

**2 目标形**：`src/workflows/project-index/`（INDEX 词汇）= `ProjectIndexIntent.ts`（`createProjectIndexIntent({mode,executor,…})`）+`ProjectIndexPlan.ts`（`buildProjectIndexWorkflowPlan`）+`ProjectIndexPresenters.ts`（薄 mode dispatch，不合并两 presenter body）。每个分歧分支→mode switch；`SOURCE_TAG`/`response.tool` 查表保 frozen 值。

**3 不强合（留 incremental-mode strategy）**：rescan-only 分析脊=`buildKnowledgeRescanPlan`(KnowledgeRescanPlanBuilder.ts:154，gap/cell/execution-mode produce|verify-only|skip)+`projectHostAgentRescanEvidencePlan`(RescanEvidenceProjectors.ts:163)+`runRescanCleanPolicy/runForceRescanCleanPolicy`(snapshot 保鲜)+coverage-ledger 读写(CG-3 sink)→留 `capabilities/planning/knowledge/`，orchestrator 仅 `mode==='incremental'` 时调；强塞进 factory 会让 full 带不可达 rescan 字段、且对刚 wipe 的 DB 跑 gap 逻辑。两 presenter 输出形按设计分歧，只统一 dispatch 入口。

**4 R1 调和（不破真 import）**：真消费方经 `@alembic/core/host-agent-workflows` barrel **按符号名** import（非 subpath），故文件夹改名透明。计划：建 project-index 新符号 → 旧 cold-start/knowledge-rescan index 改薄 compat-alias shim 委派（`createInternalColdStartIntent=(a)=>createProjectIndexIntent({mode:'full',…a})`、`ColdStartWorkflowIntent=ProjectIndexWorkflowIntent` 别名）→ 保 `export *`+package.json subpath 一轮(@deprecated) → 兄弟仓逐仓 re-point import 传显式 mode → 全迁绿后删 shim+dead presenter。**任何 commit 无悬空 import；`ColdStartWorkflow`(兄弟 orchestrator 类) 不改名只 re-point**。

**5 分阶段（green-per-step）+ 风险**：(a)行为-diff 锁+characterization 测(钉每 builder 当前输出) (b)抽共享核入 façade (c)建统一 builder+mode switch（断言 full/incremental 输出对旧 builder **字节相等**=合并正确性证明） (d)旧入口委派 unified(characterization 须保绿=行为保持门) (e)兄弟仓迁 caller（**REAL-TEST 真 BiliDili 必跑**：full bootstrap+incremental rescan 对 DB 行/envelope 比 pre-collapse 基线） (f)删 twin+dead presenter。**top 析构陷阱 R-2**=`cleanup.projectRoot` full 按 executor（`host?dataRoot:projectRoot`）而 incremental 恒 dataRoot——over-simplify 会 wipe 错目录→专项 characterization 测钉三态、保原 ternary 不"整洁化"。其余：R-1 漏分支/R-3 frozen 字面量漂移/R-4 R1 import 破/R-5 rescan 脊误入 mode switch。**排 hot-zone（CG-3+realverify land 后 rebase 其 settled commit 再做）。**

**全 orchestrator 统一（`runProjectIndexWorkflow` 跨兄弟仓）→ 已纳入 IN-SCOPE（用户 2026-06-28"并入一起处理"）**：4 个 orchestrator（Alembic `ColdStartWorkflow.ts`+`KnowledgeRescanWorkflow.ts`；Plugin `cold-start.ts`+`knowledge-rescan.ts`）统一到 `runProjectIndexWorkflow(mode)`，设计/分阶段/验收见 **§12.1**（Core 折叠先行，orchestrator 统一接力，双宿主分别锁定）。

---

### §11.H Core repository / 契约-barrel / 持久化层补测绘（填主测绘失败的 core-repo-domain-entry，与 A–G 一致）

> 主 workflow 7/8 子系统成功，此层由定向 Explore 补测绘覆盖。

**R1 repository 命名（3 模式并存，实测）**：`<Concept>RepositoryImpl`（8：bootstrap/code/guard/knowledge*/memory/session/source-graph/sourceref，现代 Drizzle 期·首选）‖ 裸 `<Concept>Repository`（evolution 5：GitDiffCheckpoint/Lifecycle/Proposal/Warning/**CoverageLedger**，legacy 期/有意去 Impl）‖ `*Store`·`*Adapter`（token `TokenUsageStore`、search/sync `RawDb*Adapter`，轻量 raw-SQL 非实体生命周期）。**裁定=有意分层非 drift**（Impl=全 Drizzle 实体生命周期；裸 Repository=旧期；Store/Adapter=轻量查询）→ **不改名**（`@alembic/core/repositories` 导出冻结），只文档化；**新 repo 一律 `<Concept>RepositoryImpl`**。`plan/` 是**空目录**（plan 无 repo，workflow session 持有，合无状态 plan 决策）。

**R2 持久化冻结补全（migration 014/015/016，改值=DB 迁移破坏；并入 §10.3/§-1.E freeze 表）**：
- 014 `recipe_source_refs.content_fp`（TEXT null，源区内容指纹·drift 检测 U6）
- 015 **`coverage_ledger`** 17 列：`id/project_root/module_id/dimension_id/covered_count/total_candidate_count/`**`grade`(DEFAULT 'empty'，enum empty|thin|partial|covered)**`/exhausted/exhausted_reason/exhausted_source/covered_source_refs/uncovered_hints/value_score/last_round/deferred/created_at/updated_at` + UNIQUE`(project_root,module_id,dimension_id)`
- 015 **`deep_mining_rounds`**：`id/project_root/round_index/started_at/completed_at/new_recipes_this_round/trigger_actor/created_at/updated_at` + UNIQUE`(project_root,round_index)`
- 016 `deep_mining_rounds.rescan_id`（TEXT null，rescan 幂等键 RF-3）+ partial UNIQUE`(project_root,rescan_id) WHERE rescan_id NOT NULL`
- 旧锚（已冻，重列求全）：006 `lifecycle_transition_events`、013 `git_diff_checkpoints`(+`scope_unique`)。

**R3 公共导出面（barrels）**：~18 个 `@alembic/core/<barrel>` 大多角色内聚（plans/knowledge/evolution/search/vector/memory/repositories/project-context/...）；**2 例外**：① `host-agent-workflows.ts`（**C2 冻结**）**过宽**——混 host briefing(IDEAgentAnalysisPacket/ProjectSkillDelivery)+persistence+planning+cold-start/rescan workflow，名为 agent 实含通用 workflow → **路径冻结不可改名**，文档化为有意聚合 + 内部子结构分离；② root `index.ts` grab-bag（re-export 全层）→ 保留，引导 sub-path import（`@alembic/core/knowledge` 等）。**无公共路径改名**（全 frozen 外部契约，与 C2 一致）。

**R4 daemon/domain/types**：`src/daemon/JobStore.ts:15 DaemonJobSource='codex'|'dashboard'|'http'|'system'`=**host 名泄漏进 Core 公共契约，但已 persisted+frozen**（与 U-1/M4 退 freeze 一致）→ 文档化 purity 违反 + host 层映射，下个大版本议 deprecate（'external-tool'/'mcp-tool'）；`domain/*`+`types/*` **契约纯净**（无 impl import；`types/ProjectSnapshot` 仅 import AST 类型，可接受）。

## §12 实现指导（功能链路锚定 / 双宿主锁定 / 分阶段执行 + 验收 / orchestrator 统一 / BiliDili 真测）

> **锚定基线（LIVE HEADs，非简报旧值）：Core `934d043`（含 CoverageLedgerWrite，简报的 `90c2295`/local `c4cac6b` 已落树）、Plugin `9931596`（过简报 `cbf93cf`）、主体 `47889f9`（过简报 `077f7ce`，finding#1 in-process 覆盖回写已 land 于 `1f141c8`）、Agent `99b8b33`。** 简报旧 HEAD 全部 superseded。realverify finding#1（主体 deepMining 缺 per-cell 覆盖回写）**已闭合**——本指南测的是 **preservation 不回归**，不是重新修复。仓库根：`/Users/gaoxuefeng/Documents/AlembicWorkspace/{AlembicCore,AlembicPlugin,Alembic,AlembicAgent}`。

---

### 12.0 功能链路锚定表（6 链 × 双宿主，file:line）

**核心事实：mode 轴位于这 4 个 orchestrator 之上、不在其内。** 4 个 orchestrator 没有一个带 `mode` 参数；full/incremental 分裂在**调用点**靠"动态 import 哪个文件"隐式编码（`cold-start.*`=full，`knowledge-rescan.*`=incremental）。收口为 `runProjectIndexWorkflow(mode)` = **把今天隐式于 import target 的 mode 显式化为参数**。这是整次统一的中心点。

| 链 | host-agent 路径（Plugin，executor='host-agent'） | in-process 路径（主体，executor='internal-agent'） | Core 脊（单一源，FROZEN export path） | 共享 ‖ 分歧锁 |
|---|---|---|---|---|
| **plan**（plan-selection 前置门） | `plan-tool.ts:294` `routePlanTool`→draft `:321`/confirm `:332`→`buildPlanSelection:1739`；GATE：`cold-start.ts:128`/`knowledge-rescan.ts:122` `resolvePlanGenerationGate`→`plan-generation-gate.ts:118` `validatePlanSelection`→`:264` `toCorePlanSelection:525`→`applyPlanSelection`；lease `:304` | `DaemonJobRunner.ts:969` `runPlanSelectionGate`→`:992` `runPlanAgent`(@alembic/agent)→`:1000` `assertPlanSelectionStageRequirements`→`:1002` `applyPlanSelection`；Agent 侧 `PlanAgentRun.ts:14`+profile `plan.profile.ts:3` id `'plan-selection'` | `@alembic/core/plans`：`applyPlanSelection`(`planIntent.ts:111`)、`assertPlanSelectionStageRequirements:90`、`assertPlanSelectionShape:51`、`PlanStageId`(`contracts.ts:1`,FROZEN) | 共享：validation+projection 契约、budget clamps（≤500/≤20000/≤2000）、module-scope。‖ 分歧：author（外部 MCP 双往返 vs in-process Agent）、input shape（untrusted wire DTO+toCore adapter vs 直传）、stage 策略+lease（host）vs job-arg 分支（in-process）、presenter、validation 次数（in-process 两次：Agent`:100`+Daemon`:1000`；host 一次） |
| **coldStart**（=fullIndex） | `cold-start.ts:102` `runHostAgentColdStartWorkflow`→gate+lease→`:165` `createHostAgentColdStartIntent`→`:167` `buildColdStartWorkflowPlan`→`:172` `runColdStartCleanup`/`:225` `runFullResetPolicy`→`:173` `buildHostAgentProjectContextAnalysis(codex-host-bootstrap)`→briefing `:240`+IDEAgent packet `:306`→`:262` `presentHostAgentColdStartResponse`→`:270` budget；**sync，无 async pipeline** | `ColdStartWorkflow.ts:104` `runColdStartWorkflow`→`:105` `createInternalColdStartIntent`→`:106` `buildColdStartWorkflowPlan`→`:123` `runFullResetPolicy`→`:142` facts(`alembic-main-bootstrap`)→`:227` `startAiDimensionSession`→`:245` `dispatchAiDimensionRuns(bootstrap)` fire-and-forget→`:359` `presentProjectContextColdStartResponse` | `@alembic/core/host-agent-workflows`：`ColdStartIntent.ts`(工厂 `:84` host / `:59` internal)、`buildColdStartWorkflowPlan`(`ColdStartPlan.ts:44`,**R-2 :79**)、`runFullResetPolicy`(`WorkflowCleanupPolicies.ts:39`)、`ColdStartPresenters.ts` | 共享：barrel、`buildColdStartWorkflowPlan`(scan/materialize/incremental:false/response.tool/logPrefix 字节同)、`runFullResetPolicy`、Intent 形。‖ 分歧 a–f：executor enum→工厂、**R-2 cleanup.projectRoot**、authoring engine、facts builder、presenter、orchestrator shell |
| **deepMining**（=incrementalIndex） | `knowledge-rescan.ts:120` 单趟→gate(`resolveDefaultRescanGenerationStage:635`)→`:145` `prepareRescanState`→seed `:224` `seedRescanCoverageLedgerFromSnapshot`/`:399` write→`:717` `buildRescanPlanning`→`:593` `attachCoverageAdvisory`(非阻塞)→`:617` 后置开 round(`host-agent-rescan`) | `DaemonJobRunner.ts:1063` `runDeepMiningRounds` **while 循环**：per-round `runPlanSelectionGate:1087`→`ensureCoverageLedgerCells:1096`→`adviseCoverageLedger:1102`→break/`:1116`开 round→`:1124` `runKnowledgeRescanWorkflow`→`:1146`闭 round(newRecipesThisRound) | `KnowledgeRescanWorkflowPlan.ts:26`(**R-2 :55-60**)、`KnowledgeRescanPlanBuilder.ts:154` gap、`CoverageLedgerWrite.ts:61` sink+`:164` reflow、`CoverageLedgerAdvisor.ts:88`、`CoverageLedgerRepository`(mig `015`) | 共享：plan/gap builder、写入 sink、advisor stop、`deep_mining_rounds`+`coverage_ledger` 表、per-cell target 链。‖ 分歧：round driving（N 趟 vs 单趟）、authoring、coverage 写时机（per-dim hook vs 上游 seed）、round accounting、reflow placement |
| **moduleMining**（=scopedIndex） | `knowledge-rescan.ts` stage 变体（`resolveDefaultRescanGenerationStage:635`，`moduleMining`分支）；**无 fan-out**，host agent 单 briefing 逐模块自撰；round-open stage-guard `:615` 排除 moduleMining | **ENTRY A** `DaemonJobRunner.ts:1204` `runModuleMiningWorkflow`→`selectModuleMiningModules:1950`(**binding-rich+plannedDimensions**)→`runModuleMining`；**ENTRY B** `KnowledgeRescanWorkflow.ts:659` Step 7→`selectKnowledgeRescanModuleMiningModules:1054`(**scope-only,丢 plannedDimensions**) | Agent fan-out：`ModuleMiningAgentRun.ts:23`(partitioner `'projectContextModules'`,profile `'module-mining-session'`/`'-dimension'`,env `ALEMBIC_MODULE_MINING_CONCURRENCY`默认2)；`applyPlanSelection→moduleScope`、`validatePlanSelectionModuleTargets:292` | 共享：`'moduleMining'`enum、moduleBindings 驱动 scope、moduleScope projection、adviseCoverageLedger。‖ 分歧：briefing-only vs Agent fan-out、**两个 in-process selector 互相分歧**（binding-rich vs scope-only）、module source（moduleSeeds vs projectMapModules） |
| **dimensionComplete** | 显式工具 `alembic_dimension_complete`(`tools.ts:352`)→`dimension-completion.ts:274` `runHostAgentDimensionCompletionWorkflow`→`:568` `persistAndBroadcast`→`:610` `writeDimensionCompletionCoverageLedger`(**moduleService.listCanonicalModules `:639`**)→`:696` `writeCoverageLedgerForCompletion`+`:716` `reflowDeepMiningRoundOnCompletion` | 隐式 hook（无工具）：`KnowledgeRescanWorkflow.ts:717` `onDimensionResult`→`:870` `writeKnowledgeRescanCoverageLedgerForDimension`(**projectMapModules `:928`**)→`:914` `writeCoverageLedgerForCompletion`；fire 点 `BootstrapConsumers.ts:782` | `CoverageLedgerWrite.ts:61` `writeCoverageLedgerForCompletion`+`:164` reflow；`CompletenessCritic.ts:726` `buildCoverageLedger`+4 axis 类型`665-782`；`resolveModuleTier`/`resolvePerCellTargetDefault`(`KnowledgeRescanPlanBuilder.ts:19/33`) | 共享：整条 write/grade/persist 脊、60/50 importance、`:line`-strip、best-effort try/catch。‖ 分歧：trigger（MCP 工具 vs hook）、module-axis source（listCanonicalModules vs projectMapModules）、reflow placement、exhausted（仅 host）、**cold-start 两宿主皆无覆盖**（incremental-only） |
| **evolution**（maintenance+decay，规则驱动非 LLM） | commit-driven：`opportunistic-evolution-presenter.ts:12` attach→`CommitDrivenMaintenance.ts:59` `runCommitDrivenMaintenance`(GitDiffScanner HEAD checkpoint)→`FileChangeHandler.ts:166`(**828L**)→`assessFileImpact(+revisionRange)`→`EvolutionGateway.submit`；verdict `'routed'/'no-op'/'defer-to-alembic-service'` | daemon-reactive+周期 sweep：`FileChangeHandler.ts:76`(**496L**,`service/evolution/`,working-tree `git diff HEAD` 无 commitRange)+`EvolutionMaintenanceSweep.ts:97`(60s,`#inFlight`守卫,drives staging/timeouts/proposals/decay) | `@alembic/core/evolution`：`assessFileImpact`(`ContentImpactAnalyzer.ts:57`,0.3 阈)、`EvolutionGateway.submit`(`:82`)、`EvolutionPolicy.ts`、`RecipeSimilarity.ts`(consolidation Jaccard) | 共享：impact scorer、Gateway（唯一写路径）、维护 VERBS（rename→update/repair、del-last-ref→deprecate、modified-pattern→update、created→skip）、生命周期/coverage repo、`'evolving'/'decaying'`/`'file-change'`。‖ 分歧：trigger（commit-checkpoint vs file-watch）、**周期 sweep 仅 in-process**、report shape（UnifiedEvolutionReport 超集 vs ReactiveEvolutionReport）、rename 自修（host conf≥0.9 vs 主体从不）、producerKind |

**5 个分歧 seam（两 mode 不变）**：(a) executor enum→intent 工厂；(b) **R-2 cleanup.projectRoot 三元**；(c) authoring engine（briefing vs `dispatchAiDimensionRuns`/`runModuleMining`）；(d) facts builder（`buildHostAgentProjectContextAnalysis` vs `buildProjectContextWorkflowFacts`）；(e) presenter（`presentHostAgent*` vs `presentProjectContext*`）。加 host-only：lease、destructive-confirmation、coverage-seed-up-front、briefing-budget；in-process-only：async-fill hook + 多 round 循环（**位于 DaemonJobRunner，不在这 4 文件内**）。

---

### 12.1 sibling-orchestrator 统一设计（`runProjectIndexWorkflow`，已纳入 in-scope）

**结论：两个 per-host 统一 orchestrator，不做跨宿主单函数。** 在**每个宿主内**统一（cold-start+rescan→每仓一个 `runProjectIndexWorkflow(mode)`），保留宿主分裂。单一带 `{mode,executor}` 的跨宿主函数**不安全**——见 §12.4 风险 #1。§11.D 的 `HostAgent*`/`InProcess*`+Core-base 命名方案**要求**宿主分裂存活；收掉它会与既定命名矛盾。

```
Plugin:  runProjectIndexWorkflow(ctx, args, { mode:'full'|'incremental' })   // host-agent
主体:    runProjectIndexWorkflow(ctx, args, { mode:'full'|'incremental' })   // in-process
```

**per-host 统一形态**（a–e seam 宿主固定，mode 门控步骤）：

```
runProjectIndexWorkflow(ctx, args, { mode }):
  1. gate/lease     — host: resolvePlanGenerationGate(defaultStage = mode==='full'?'coldStart':resolveDefault…) + lease
                       in-process: gate 已由 DaemonJobRunner 上游跑过；facts 传入
  2. intent + plan  — mode==='full' ? createColdStartIntent + buildColdStartWorkflowPlan
                                    : createKnowledgeRescanIntent + buildKnowledgeRescanWorkflowPlan
                       ⟵ R-2 三元留在 Core plan builder 内（不动）
  3. cleanup        — mode==='full' ? runFullResetPolicy : runRescan(Force?)CleanPolicy   [读 plan.cleanup.projectRoot]
  4. facts          — host: buildHostAgentProjectContextAnalysis ; in-process: buildProjectContextWorkflowFacts (或 args.facts)
  5. INCREMENTAL-ONLY 分析脊 (if mode==='incremental'):
       host: seed coverage + unified-evolution + buildRescanPlanning
       in-process: syncKnowledgeStore + SourceRefReconciler + RecipeImpactPlanner + runEvolutionAudit
                   + auditRecipesForRescan + buildKnowledgeRescanPlan + prescreen  (主体 Steps 0.5/1.5/2/3/4/4.5)
                   + onDimensionResult 覆盖 hook
  6. authoring      — host: briefing(mode-tagged) ; in-process: dispatchAiDimensionRuns / runModuleMining
  7. presenter      — host: presentHostAgent*(mode) ; in-process: presentProjectContext*(mode)
```

**Incremental 分析脊 = mode 门控 Step 5，不并入 full。**§11.I 显式：gap/coverage/projector 留作 incremental-mode 策略。代码上即一个 `if(mode==='incremental')` 分支包住 SourceRefReconciler→RecipeImpactPlanner→audit→gap 链与 host 的 seed+evidence-plan 链。真正统一的是 full/incremental 的**共同前缀**（gate→intent→plan→cleanup→facts）；后缀按 mode 分歧。

**round 循环（`runDeepMiningRounds`，DaemonJobRunner :1063-1202）是 `runProjectIndexWorkflow('incremental')` 的 CALLER，不被吸收。** 留在 DaemonJobRunner 或抽出的 `DeepMiningRoundGate`（§11.A）。每轮：`runPlanSelectionGate`→`ensureCoverageLedgerCells`→`adviseCoverageLedger`→（shouldStop break）→`upsertRound(open)`→**`rescanKnowledge` ← 这一步变 `runProjectIndexWorkflow('incremental')`**→`upsertRound(close,newRecipesThisRound)`→re-advise。round 循环拥有串行化+advisor break；统一 workflow 拥有单趟。**不要把循环拉进 workflow**——否则 host（无循环）要背死循环脚手架。

**R1 别名层（关键澄清，应用 critique F-2）：** R1 = **Core builder 符号名** barrel 别名（`buildColdStartWorkflowPlan`→`buildProjectIndexFullPlan` 等）。orchestrator 旧函数名（`runColdStartWorkflow` 等）保留为**仓内薄别名 re-export**（消费者按文件路径+具名 export import）。**主体/Plugin 的 orchestrator 文件保持现路径不动；只有 Core workflow 模块迁入 `project-index/`。** 这是硬声明——否则 P10 的动态 import 站点（DaemonJobRunner `:921/:948/:1072` + cli.ts `:699/:884`）会因路径不再解析而断（symbol 别名救不了路径）。

**真实消费者清单（已核，须同 commit 绿）：**
- **主体 in-process**（两 workflow 各 import 两次，全 dynamic）：`DaemonJobRunner.ts:921`(`runColdStartWorkflow`)、`:948`+`:1072`(`runKnowledgeRescanWorkflow`)；`bin/cli.ts:699`(cold)、`:884`(rescan)——**CLI 是简报未列的第二消费者对，须同 commit 改**。`executeApiAiWorkflow:918`+`runBootstrapPlanGate:959` 是两次抽取的 dispatch hub（应用 critique C-1）。
- **主体 HTTP**：`bin/api-server.ts` 与 `lib/http/routes/` **已核不直接 import 任一 workflow**（critique C-2 闭合，路由经 daemon job 间接驱动）——无第四消费者，但 P10 须 grep 留证。
- **Plugin host-agent**（经 compat re-export）：`handlers/host-agent/bootstrap.ts:10`(`bootstrapForHostAgent`)、`rescan.ts:8`(`rescanForHostAgent`)——MCP dispatch 标识，字节稳定，消费于 `McpServer.ts:417/:422`、`HostMcpServer.ts:788-792`。re-export 层是天然别名 seam：让其 re-export 新的 `runProjectIndexWorkflow` 别名。

**行为等价契约（双宿主如何保持相等）：** 统一 workflow 须保 5 个分歧 seam 宿主固定+mode 固定；唯一变的是 orchestrator 壳。验收门 = SHARED-INVARIANT 字节快照：`buildColdStartWorkflowPlan`/`buildKnowledgeRescanWorkflowPlan` 输出（scan opts、materialize flags、`response.tool`、**`cleanup.projectRoot = host-agent?dataRoot:projectRoot`**）+ `applyPlanSelection` projection keys（`executionDimensions/budget/moduleScope`）。任一宿主 pre/post 此处分歧 = 回归。

---

### 12.2 分阶段执行计划（P1..P15）

**Ordering law：** 冷区先 → 热区在 **CG-3=B sink（已 land）+ mainbody-realverify 代码门（已清：finding#1 land 主体 `1f141c8`，用户 2026-06-28 标 completed；真机验证折叠进本需求 G4）**满足后 → vendor-repin 按 Core 行 → §11.I collapse 先于 orchestrator-unify → god-file split 在其 rename 之前/同步 → late-L2 最后 → freeze 全程 doc-only。

**三批区**：COLD(P1–P4) 现在安全无跨仓 import churn；HOT(P5–P12) 真跨 4 仓 import、同 commit 消费、green-per-file、Core 行 vendor-repin，**门控**于 CG-3=B+realverify；LATE-L2(P13–P14) 授权 rename+alias+字段删；FREEZE(P15) doc-only。

每热阶段 Node≥22 `build:check`+`lint:repo-boundary`/`lint:core-import-boundary`。**vendor-repin 规则**（每 Core-touch 阶段在阶段内执行）：Core `build:core` → re-pin `vendor/AlembicCore` gitlink in Plugin+主体 → consumer `build:check`。

#### COLD-ZONE（P1–P4，现在可跑）

**P1 — RG9 stub 删 + 文件夹隔离审计**
- scope：删 `dead/`/`live/`/`shim/` RG9 零消费者 stub；确认 `evolution/` 仅含 maintenance（generation 退役 UM#1）。**保留** Plugin `coverage-ledger-write.ts`（纯 re-export shim `:8`，有活 importer `knowledge-rescan.ts:74` + dimension-completion 覆盖路径，P9 经 barrel alias collapse）。审计 `moduleMiningRoutes`-empty 响应字段——记位置留 P13（late-L2 删+alias），此处不删。
- batch：cold（无 Core 改→无 repin）。deps：无。
- 代码级：每候选 stub `grep -rn "<basename>" --include=*.ts` 跨 4 仓，零-importer 证明方删。
- 验收：被删文件所在仓 `build:check`+boundary lint 绿；grep 证零悬空 import。无 REAL-TEST。

**P2 — Stage-vocab Level0 docs + FREEZE register（doc-only）**
- scope：写 §11.I FREEZE register（无代码）。冻结 token：`PlanStageId` 枚举 `'coldStart'|'deepMining'|'moduleMining'`(`contracts.ts:1`)；job kind/source `'bootstrap'|'rescan'|'codex'`；`response.tool` `'alembic_bootstrap'|'alembic_rescan'|'alembic_dimension_complete'`；lifecycle `'evolving'|'decaying'`；`coverage_ledger`/`deep_mining_rounds` 列；HTTP routes；`bootstrap-session:` 前缀；export paths `@alembic/core/{host-agent-workflows,plans,evolution}`；source tags `'file-change'`/`'alembic-main-bootstrap'`/`'alembic-main-rescan'`；`producerKind:'plugin-opportunistic'`/`'daemon-file-change'`；`'defer-to-alembic-service'` verdict 字面。INDEX vocab 映射（CG-B）：coldStart→full、deepMining→incremental、moduleMining→scoped；`project-index`/`ProjectIndex*`/`mode full|incremental`。**声明 consolidation/RecipeSimilarity 出范围（无符号 rename）**（应用 critique C-3）。
- batch：freeze。deps：无。验收：`git diff --check`+docs verify。无 build/REAL-TEST。

**P3 — `class Bootstrap → AppRuntime` rename（§11.D app 层）**
- scope：rename app-boot 类 `Bootstrap`(`lib/Bootstrap.ts:37`)→`AppRuntime`。**不动** workflow 符号（job kind `'bootstrap'`、tool `'alembic_bootstrap'`、`createInternalColdStartIntent` FROZEN）。
- batch：cold（主体-local）。deps：P2。
- 代码级（应用 critique F-1）：**rename 前先 grep `'Bootstrap'` 作 DI string-key/serialized class name**——已核 `'Bootstrap'` 另作 `signalBus.send('lifecycle','Bootstrap',...)`(`BootstrapTaskManager.ts:367/651`) 与 `logPrefix:'Bootstrap'`(`ColdStartWorkflow.ts:234/266`、`DaemonJobRunner.ts:964`) 出现，**这些是 signal/log 字面量 NOT 类引用，不得改**；只 rename 类+构造+其引用；若有外部 importer 留 `export { AppRuntime as Bootstrap }` shim。验证无 `'bootstrap'` job kind/tool/signal 字面漂移。
- 验收：主体 `build:check`+`lint:repo-boundary` 绿；app-boot 单测过；grep 证冻结 token 零漂移。无 REAL-TEST。

**P4 — CompletenessCritic split（CG-C，scan-first，§11.A）**
- scope：split Core `CompletenessCritic.ts`（870L 两关注）：`buildCompletenessCritic`(`:5-660`) 与 `buildCoverageLedger`+4 axis 类型(`CoverageLedgerCandidate:671`/`ModuleAxis:679`/`ExhaustedDeclaration:686`/`Cell:703`,`665-782`)。把覆盖聚合移入 `AlembicCore/src/workflows/capabilities/coverage/CoverageLedgerBuilder.ts`（`CoverageLedgerWrite.ts` 邻居）。scan-first=只读 split 无行为改。
- batch（应用 critique S-1，解 cold/hot 矛盾）：**这是 behavior-neutral cold-Core 例外**——纯 relocation、无符号 rename、无冻结 token 改、仅 barrel re-point。因此 **gate-exempt：在 cold-zone 跑、不等 realverify 波次**。但仍触 Core→需 vendor-repin（在本阶段内做）。gate 定义须显式刻此例外：纯 relocation Core 改不改行为故不继承 realverify 依赖。
- deps：P2。
- 代码级：新文件导出 `buildCoverageLedger`+4 axis 类型；`CompletenessCritic.ts` 仅留 critic；barrel `host-agent-workflows.ts` 从新模块 re-export（`@alembic/core/host-agent-workflows` 字节同）。Plugin `coverage-ledger-write.ts` re-export + 主体 `KnowledgeRescanWorkflow.ts:47` import 不变。
- 验收：Core `build:core`+tests 绿；vendor-repin→Plugin+主体 `build:check` 绿；`grep "buildCoverageLedger\|CoverageLedgerCell" @alembic/core/host-agent-workflows` 解析同；characterization：`buildCoverageLedger` 固定输入字节同。无 REAL-TEST（纯 relocation，快照覆盖）。

#### HOT-ZONE GATE

**P5–P12 启门（2026-06-28 订正：realverify 真机验证已折叠进本需求 G4）：**
1. **CG-3=B coverage-ledger-write sink** — Core `CoverageLedgerWrite.ts` 已 land（live `934d043`）。✅；**P5 前验 gitlink re-pin 已传播**。
2. **mainbody-realverify-followup — 用户已在板上标记 completed（2026-06-28）**：**代码侧已闭合**——finding#1 in-process per-cell 回写已 land 主体 `1f141c8`、CG-3=B sink 落 Core `934d043`、Plugin re-import `9931596`。✅ **代码前置满足。****但其真机 BiliDili VERIFY（CD-6）尚未独立跑过——用户决定折叠进本需求 §12.3 的 G4 覆盖门一起验**（in-process coverage cell 翻 non-empty，**直接对真实 BiliDili 跑**），不再作独立前置波次。即：本重构可启动（代码门已清）；**finding#1 的真机不回归验证 = 本需求 G4 的职责**（§12.3.gate G4 + Chain 3/5 in-process 覆盖断言）。
3. **cold-start-coverage 决策已定（2026-06-28 用户：保持不写）**——coldStart 只播种 deferred 占位、**不写 measured 覆盖**（measured 覆盖专属 deepMining/dimensionComplete）；**Chain 2 覆盖断言锁定 `==baseline`**（measured 覆盖不变）。P9/P10 锁此行为，无需再在 G4 期裁。

#### HOT-ZONE（P5–P12）

**P5 — Core R1 barrel 别名 shim（INDEX vocab）**
- scope：引入 `ProjectIndex*` 别名（既有符号的别名，零行为）：`buildProjectIndexFullPlan`=`buildColdStartWorkflowPlan`、`buildProjectIndexIncrementalPlan`=`buildKnowledgeRescanWorkflowPlan`（旧名保留）、`createProjectIndexIntent*` 别名、`buildProjectIndexGapPlan`=`buildKnowledgeRescanPlan`。plan-selection 脊符号（`applyPlanSelection`/`assertPlanSelectionStageRequirements`）名稳（FROZEN `@alembic/core/plans`）。
- batch：hot,Core→repin。deps：Hot gate;P4。
- 代码级：Core barrel(`host-agent-workflows.ts:61`,`plans.ts`)加 `export { … as … }`；保所有旧名；本阶段无 call-site 改（仅扩 export 面，供 P8/P10 迁移）。
- 验收：Core `build:core`+tests 绿；repin→Plugin+主体 `build:check` 绿；grep 新旧名皆解析。无 REAL-TEST（additive）。

**P6 — DaemonJobRunner god-file split：DeepMiningRoundGate（§11.A）**
- scope：抽 in-process round-loop slice 出 `DaemonJobRunner.ts`（2180L）：`runDeepMiningRounds:1063`+`runPlanSelectionGate:969`+`buildDeepMiningRoundPlanContext:1883`+`ensureCoverageLedgerCells:1915`+`latestDeepMiningRound:1944`+`extractNewRecipesThisRound:2141`+`runBootstrapPlanGate:959`/`runModuleMiningWorkflow:1204`+`selectModuleMiningModules:1950`+`readModuleMiningPersistenceSnapshot:2022`/`readModuleMiningPersistedOutputDelta:2066`→新 `lib/daemon/{DeepMiningRoundGate,PlanSelectionGate,ModuleMiningWorkflow}.ts`。
- batch：hot（主体-local；无 Core 改→无 repin）。**同 commit 消费者=`executeApiAiWorkflow:918` dispatch + `runBootstrapPlanGate:920`**（应用 critique C-1）。deps：P5;hot gate。**先于 P8/P10**。
- 代码级：函数原样移；`executeApiAiWorkflow` 经新模块 import 调用。**保 Core advisor 契约不变**（`adviseCoverageLedger` import+`upsertRound`/`ensureCoverageLedgerCells` repo 调用不变）。round 循环仍串行化 owner，不改 `while(true)`/`shouldStop`。**保 `runAsyncFillInline:true` flag 线程**（`:1132`）——round 循环依赖 inline fill 使 per-round `onDimensionResult` 覆盖回写同步触发。
- 验收：主体 `build:check`+单测+`lint:repo-boundary` 绿；characterization：seeded deepMining 循环 pre/post `deep_mining_rounds` open/close 序+`newRecipesThisRound` 同；**inline-fill 断言：回写观测到在 round close 之前**（应用 critique O-2）。**REAL-TEST：in-process deepMining round**（真实 BiliDili 直跑，主体 AI=DeepSeek）——`coverage_ledger` cell 翻 non-empty(finding#1 不回归)、`deep_mining_rounds` 推进、advisor `stopReason` 终止循环。

**P7 — plan-tool god-file split：confirm/buildPlanSelection（§11.A）**
- scope：从 Plugin `plan-tool.ts`（2009L）切 confirm 块：`confirmPlan:332`+`buildConfirmedPlanIntent:334`+`buildPlanSelection:1739-1751`+`confirmedPlanResponse:356`+`nextGenerationToolForStage:1416-1428`→`lib/recipe-generation/plan-confirm.ts`。`routePlanTool:294`/`draftPlan:321` 留 `plan-tool.ts`。
- batch：hot（Plugin-local；无 Core 改→无 repin）。deps：P5;hot gate。
- 代码级：原样移；`routePlanTool` switch `:298-318` 从新模块 import `confirmPlan`。**保 `buildPlanSelection` 映射字节同**（PlanIntent→wire PlanSelection：`generationStage`、`dimensions=intent.dimensions.map(d=>d.dimensionId)`、`scale`、`moduleBindings`）。保 `writeColdStartDeferredCoverageRows:353-354` 副作用序。`'get'` 仍 blocked(`:304`)。
- 验收：Plugin `build:check`+tests+`lint:repo-boundary` 绿；characterization：`alembic_plan` draft→confirm 往返 `planSelection` DTO 字节同。**REAL-TEST 延至 P10**（host-agent 端到端在那跑）。

**P8 — ProjectContextWorkflowFacts god-file split（§11.A，主体）**
- scope：split 主体 `ProjectContextWorkflowFacts.ts`（1585L）：抽 `buildProjectMapModules:891`+`buildProjectMapModulesFromTargets:912`→`ProjectMapModules.ts`；抽 presenters `presentProjectContextColdStartResponse:503`/`-EmptyProject:489`/`presentProjectContextRescanResponse`→`ProjectContextPresenters.ts`；`buildProjectContextWorkflowFacts:153`+dimension 选择留核心 facts 文件。
- batch：hot（主体-local；消费=`ColdStartWorkflow.ts`/`KnowledgeRescanWorkflow.ts`/P6 的 `ModuleMiningWorkflow`）。deps：**P6（应用 critique S-2，rationale 修正：P8 更新 P6 抽出模块新创建的 `buildProjectMapModules` import 站点，同 commit）**。
- 代码级：原样移；同 commit 更新所有主体消费者 import。两 presenter 留主体-local（非 Core legacy `presentInternalColdStartResponse`）。
- 验收：主体 `build:check`+tests+`lint:repo-boundary` 绿；characterization：`buildProjectMapModules` 固定 ProjectMap 输入同。无独立 REAL-TEST（P10 in-process run 覆盖）。

**P9 — §11.I COLLAPSE → Core `workflows/project-index/` + coverage/ unify**
- scope：(a) 把 Core cold-start+knowledge-rescan workflow 模块迁入 `workflows/project-index/`（保 `ColdStartIntent`/`ColdStartPlan`/`ColdStartPresenters`/`KnowledgeRescanWorkflowPlan`/`KnowledgeRescanPlanBuilder` 符号，barrel alias 为 `ProjectIndex*`）。Core 仅留 intent+plan+(thin)presenter；orchestration 留 sibling 仓。(b) **coverage/ unify**：`CoverageLedgerAdvisor.ts`+`CoverageLedgerWrite.ts`+P4 的 `CoverageLedgerBuilder.ts` 从 `capabilities/host-agent/` 迁入 `capabilities/coverage/`；Plugin `coverage-ledger-write.ts` shim 经 barrel alias collapse（不再 re-copy）。(c) 两分歧 module-axis builder——host `writeDimensionCompletionCoverageLedger`(`dimension-completion.ts:610`,`listCanonicalModules`) 与 in-process `buildKnowledgeRescanCoverageLedgerModules`(`KnowledgeRescanWorkflow.ts:928`,`projectMapModules`)——collapse 到一个 Core builder 取 `{modules:ModuleSummary[]}`；每宿主仅留薄 axis-source adapter。
- batch：hot,Core→**repin**。deps：P4,P5;hot gate。**collapse 先于 P10**。
- 代码级 **R-2 TRAP 保精确**：`ColdStartPlan.ts:79` `intent.executor==='host-agent'?dataRoot:projectRoot` 与 `KnowledgeRescanWorkflowPlan.ts:55-60` cleanup 三元**留 Core plan builder 内，relocation 不动**。FREEZE：`@alembic/core/host-agent-workflows` export path 字节稳→barrel 从新 `project-index/`+`coverage/` re-export。统一 module-axis builder 取 `{modules:ModuleSummary[]}`；host adapter 映 `listCanonicalModules()→ModuleSummary`，in-process 映 `projectMapModules→ModuleSummary`，皆喂同一 `buildCoverageLedger`。rescan-only 分析脊（gap=`buildKnowledgeRescanPlan`、coverage、projector）留 **incremental-mode 策略，不并入 full**。
- 验收：Core `build:core`+tests+`lint:core-import-boundary` 绿；repin→Plugin+主体 `build:check` 绿；characterization：`buildColdStartWorkflowPlan`+`buildKnowledgeRescanWorkflowPlan` 字节同（scan/materialize/`response.tool`/**`cleanup.projectRoot`**）；`writeCoverageLedgerForCompletion` 两 axis adapter 对固定 module-summary 写同 cell。**REAL-TEST：parity**——双宿主各驱一次 dimensionComplete，diff `coverage_ledger` 行等价。

**P10 — Orchestrator 统一 → `runProjectIndexWorkflow(mode)`（per-host，非跨宿主）**
- scope：两个 per-host 统一 orchestrator，宿主分裂保留：主体统一 `runColdStartWorkflow`(`:98`)+`runKnowledgeRescanWorkflow`(`:184`)；Plugin 统一 `runHostAgentColdStartWorkflow`(`:102`)+`runHostAgentKnowledgeRescanWorkflow`(`:120`)。旧名留薄别名（`runColdStartWorkflow=(ctx,args)=>runProjectIndexWorkflow(ctx,args,{mode:'full'})`）。5 seam 宿主+mode 固定。incremental-only 脊=`if(mode==='incremental')` 门控 Step 5。**round 循环（P6 DeepMiningRoundGate）是 caller，不吸收。**
- batch：hot（本阶段无 Core 改→无 repin；纯 sibling 编排于 P9-collapsed Core）。deps：P6,P8,P9。**collapse 之后。**
- 代码级 — 同 commit 消费者（含未列 CLI + dispatch hub）：
  - 主体：`DaemonJobRunner.ts:921/:948/:1072`（P6 后在 DeepMiningRoundGate/PlanSelectionGate）+`executeApiAiWorkflow:918`/`runBootstrapPlanGate:959`（critique C-1）+**`bin/cli.ts:699/:884`**（critique 第二消费者，漏则 CLI bootstrap/rescan 静默断）。grep `bin/api-server.ts`+`lib/http/routes/` 留证（已核无直接 import，critique C-2）。
  - Plugin：`handlers/host-agent/bootstrap.ts:10`/`rescan.ts:8` re-export 字节稳（MCP dispatch 标识，消费于 `McpServer.ts:417/:422`/`HostMcpServer.ts:788-792`），re-export 新别名。
  - **mode 隐式→显式**：每 call-site 从"import 对文件"换"按对 mode 调"同 commit。
  - **async-fill 生命周期（主体）**：不得 reorder `session-create→registerProjectContextWorkflowSessionReleaseOnBootstrapCompletion→dispatchAiDimensionRuns`(`:237/:644`) 否则 release-on-completion hook 泄漏。`skipAsyncFill`/`runAsyncFillInline` flag 须存活。
  - **R-2**：统一触 plan builder 的 caller，不动三元；任何 per-host 重导 cleanup root=头号破坏陷阱。
- 验收：主体+Plugin `build:check`+boundary lint 绿；characterization：每旧名别名对其 mode 输出同 pre-refactor；SHARED-INVARIANT 字节快照（plan builder 输出+`applyPlanSelection` projection keys）。**REAL-TEST 双宿主必做**（真实 BiliDili 直跑，主体 AI=DeepSeek / 向量=本地千问 Qwen，run 间 rebuild 重置）：
  - in-process：daemon job kind/source `bootstrap`+`rescan`/`deepMining`；`coverage_ledger` cell non-empty(finding#1 不回归)；`deep_mining_rounds` 推进；full-reset 清 DB under **projectRoot**。
  - host-agent：`alembic_bootstrap`/`alembic_rescan`→`planGate.status='ready'`；`response.tool` 字节稳；cleanup 删 under **dataRoot**（翻 executor 证 R-2）；`meta.coverageLedgerSeed` 在。
  - parity：一次 incremental 双向，diff `coverage_ledger` 等价 modulo round-driving。
  - **session-release 断言**（应用 critique O-1）：bootstrap session 在 `onBootstrapComplete` 后**释放**（session registry post-run 空，或 release log），不仅 cell 填——泄漏 session 不显于 cell diff。

**P11 — moduleMining selector 收敛（用户 2026-06-28 决策：Entry B 收敛为 binding-rich，⚠️行为变更非纯 reconcile）**
- scope：**两 in-process selector 收敛为一个 binding-rich 行为**——`selectModuleMiningModules`(`:1950`,binding-rich+`plannedDimensions`) 与 `selectKnowledgeRescanModuleMiningModules`(`:1054`,scope-only **丢** `plannedDimensions`) 统一到一个**始终携带 `plannedDimensions`** 的 selector；**Entry B(KnowledgeRescanWorkflow Step 7) 行为变更**：从 scope-only 改为也按 per-module `plannedDimensions` 定向（不再全维）。Plugin host-agent=briefing-only(无 fan-out) vs in-process=@alembic/agent fan-out 作 host-adapter split 保留。
- batch：hot（主体↔Agent；无 Core 改→无 repin）。deps：P10。**最后 moduleMining seam；本阶段含一处有意行为变更（用户已拍），须独立 REAL-TEST 证改进非破坏。**
- 代码级：`selectProjectIndexModules({mode:'scoped',bindings,moduleScope})` **始终带 `plannedDimensions`**(binding-rich)。Entry A 不变；**Entry B 从 scope-only 改为喂 bindings→得 `plannedDimensions`**（同一 selector）。consumer = Agent `runModuleMining`(`ModuleMiningAgentRun.ts:23`,partitioner `'projectContextModules'`,profiles 不变) **已从 Entry A 接受 `plannedDimensions` 字段**→Entry B 现提供同字段天然兼容。**前置核**：grep Entry B 下游对"无 plannedDimensions=全维"语义有无隐式依赖（若有，收敛后变定向是 INTENDED 改进，须确认非破坏）。FREEZE：`'moduleMining'` enum 字面不 rename。
- 验收：主体 `build:check`+Agent `lint:core-import-boundary` 绿；characterization：**两入口 POST 皆带 `plannedDimensions`**；**Entry B PRE 无→POST 有 = 预期行为变更（非回归）**，断言收敛后 Entry B 按 plannedDimensions 定向、下游 fan-out 正确消费该字段。**REAL-TEST：moduleMining**（真实 BiliDili，主体 AI=DeepSeek）——两入口各跑：`recipe_source_refs` 每模块 ≥1 source_path-backed recipe；`coverage_ledger`(module×dim) 推进；`deep_mining_rounds` **不动**（stage-guard 排除）；**Entry B 收敛后只挖 planned 维度（非全维）= 行为变更已生效且产出有价值 recipe**；Agent fan-out 子数==selectedModules capped by `ALEMBIC_MODULE_MINING_CONCURRENCY`(默认2)。

**P12 — N-9 双 FileChangeHandler rename + evolution 命名（§11.D）**
- scope：rename 两碰撞 `FileChangeHandler.ts`（Plugin 828L `recipe-generation/evolution/` commit-driven + 主体 496L `service/evolution/` daemon-reactive）→`HostAgentFileChangeHandler`(Plugin)+`InProcessFileChangeHandler`(主体)。verbs 已在 Core(`assessFileImpact`/`EvolutionGateway`)，handler 薄 adapter→Core base 名义。N-3 `PluginOpportunisticEvolutionVerdict`(`'defer-to-alembic-service'|'no-op'|'routed'`) 仅命名复核，保 `'defer-to-alembic-service'` 字面稳。N-4 `residentProjectScopeAvailable` 仅验对齐，不再 rename。
- batch：hot（跨宿主 import；无 Core 改→无 repin）。deps：P10/P11。evolution maintenance-only(generation 退役 UM#1)。
- 代码级：rename 符号+**R1 barrel/local alias shim**（`FileChangeHandler` 按名 import 于 Plugin `opportunistic-evolution-presenter.ts:2`/`CommitDrivenMaintenance.ts:3` + 主体 `KnowledgeModule.ts:51`——同 commit 改）。波次内保 `export { HostAgentFileChangeHandler as FileChangeHandler }`。FREEZE：`'file-change'`/`'evolving'`/`'decaying'`/`producerKind` 字面不变。**不强 split 828L Plugin handler**（cohesive 单类——仅 flag）。
- 验收：Plugin+主体 `build:check`+`lint:repo-boundary` 绿；characterization：两 handler verb 路由同（rename→update/repair、del-last-ref→deprecate、modified-pattern→update）。**REAL-TEST：双宿主 evolution parity**——governed-tool close on committed change→Plugin `data.unifiedEvolution.evidenceGate.verdict='routed'`+`evolution_proposals` 0→1 `source='file-change'`；`POST /api/v1/evolution/file-changed`→主体 `ReactiveEvolutionReport`+同 proposal 行（同 Core Gateway）；sweep `'[EvolutionMaintenanceSweep] periodic sweep completed'` 带 `#inFlight` 守卫。

#### LATE-L2（P13–P14）

**P13 — IDEAgent* → HostAgent* facade rename + IDEAgentAnalysisPacketBuilder split**
- scope：§11.D facade `IDEAgent*`→`HostAgent*`。触点：Plugin `cold-start.ts` `buildIDEAgentAnalysisPacketFromProjectContext:306`/`buildIDEAgentAnalysisSurface:313`；Core barrel `host-agent-workflows.ts:14-38` IDEAgent* export 块；god-file split `IDEAgentAnalysisPacketBuilder`(1810L,§11.A)→`host-agent/` 下小模块。删 `moduleMiningRoutes`-empty 响应字段（P1 flagged）——授权字段 rename+alias。
- batch：late-L2（授权 contract/symbol rename+alias），Core→**repin**。deps：P9,P10–P12。**最后 hot 波次后。**
- 代码级：rename `IDEAgent*`→`HostAgent*`；保 `export { buildHostAgentAnalysisPacketFromProjectContext as buildIDEAgentAnalysisPacketFromProjectContext }` R1 shim。split `IDEAgentAnalysisPacketBuilder.ts` 入 `host-agent/`。`moduleMiningRoutes`：删响应类型+若有消费者 grep 后加 deprecation alias。
- 验收：Core `build:core`+tests；repin→Plugin+主体 `build:check`+boundary lint 绿；characterization：host-agent briefing packet 输出同 pre/post。**REAL-TEST：host-agent bootstrap**——`alembic_bootstrap` envelope `data.{executionPlan.tiers,missionBriefing,ideAgentAnalysisSurface→hostAgentAnalysisSurface,onboardingContract}` 解析；`meta.tool='alembic_bootstrap'`(FROZEN 不变)。

**P14 — Agent-run INDEX 命名 + module-mining/ 文件夹隔离**
- scope：对 Agent `ModuleMiningAgentRun.ts`+`module.profile.ts` 施 `ProjectIndex*`/`scopedIndex` 命名（非冻结处）。**FREEZE-CHECK**：`'moduleMining'` 字符串是 Core enum（plan gate+`assertPlanSelectionStageRequirements`+DB-adjacent stage guard）→**alias-only,不 rename 字符串**。profile id `'module-mining-session'`/`'-dimension'`+partitioner `'projectContextModules'`——仅无 DB/wire 消费者时 rename(验)，否则 alias。建 `module-mining/` 文件夹隔离于主体 `workflows/`+作统一 incremental-mode 策略。
- batch：late-L2。deps：P11,P13。
- 代码级：文件夹移+符号 rename 带 R1 alias；保每 `'moduleMining'`/profile-id 字面稳（FROZEN）。`runModuleMining` re-export 链(`AgentService/index.ts:10`→`runs/index.ts:2`→`ModuleMiningAgentRun.ts:23`)保留。
- 验收：Agent `build:check`+`lint:core-import-boundary`；主体 `build:check`；grep `'moduleMining'` enum 字符串处处不变。无新 REAL-TEST（P11 覆盖 moduleMining 行为；此仅命名/文件夹——characterization 快照足）。

#### FREEZE（P15，doc-only）

**P15 — Final FREEZE audit + isolation gate CG-5 doc**
- scope：确认 P3–P14 无冻结 token 漂移。复核 P2 register 对终树。doc CG-5 隔离门（boundary lint `lint:repo-boundary`/`lint:core-import-boundary` 强制主体-不-host-Plugin-transport+Plugin-不-re-host-in-process-AI；per-host orchestrator split 保 CG-5 绿）。
- batch：freeze。deps：所有前阶段。
- 代码级：grep-audit P2 每冻结 token 跨 4 仓，录终 file:line。doc 为何 per-host split（非跨宿主 `{mode,executor}`）对 CG-5 必需：单跨宿主函数会跨 Plugin↔主体 边界背两宿主分支，违两 CLAUDE.md 仓边界。
- 验收：`git diff --check`+docs verify；终 grep 证零漂移。无 build/REAL-TEST。

#### Ordering summary

```
COLD:   P1 stub-delete → P2 freeze-register(doc) → P3 AppRuntime(grep-DI-first) → P4 CompletenessCritic-split(cold-Core 例外+repin)
─── HOT GATE: CG-3=B sink(已 land,验 repin) + mainbody-realverify 代码门(已清) + cold-start-coverage 决策(已定:保持不写) ───
HOT:    P5 Core R1 aliases(+repin) → P6 DeepMiningRoundGate split → P7 plan-confirm split
        → P8 ProjectContextWorkflowFacts split → P9 §11.I COLLAPSE + coverage/ unify(+repin)
        → P10 runProjectIndexWorkflow(mode) per-host unify → P11 moduleMining selector reconcile
        → P12 N-9 FileChangeHandler rename
LATE-L2: P13 IDEAgent*→HostAgent* + packet split(+repin) → P14 Agent-run INDEX + folder
FREEZE:  P15 final audit + CG-5 doc
```

---

### 12.3 BiliDili 真实项目链路功能测试

#### 12.3.0 直接真测 harness（**用户决定：BiliDili 即测试项目，直跑真实、不做沙箱副本，rebuild 已授权**）

> **2026-06-28 用户指令**：不做 `.backup()` 忠实副本/沙箱 `ALEMBIC_HOME`——BiliDili 本身就是测试项目，**直接对真实 BiliDili workspace 跑**（recipe 重建已授权）。**主体 in-process AI = DeepSeek**；**向量/语义 embedding = 本地千问 Qwen**。

```bash
nvm use 22                                   # 门禁 + Core import.meta.dirname 需 Node>=22
BILIDILI=<真实 BiliDili 项目根 @02a25032>      # 真实 checkout（非 clone 到 scratchpad）
export ALEMBIC_HOME="$HOME/.asd"             # 真实 home；**只动 BiliDili 这个 workspace，其它 workspace 不碰**
DB="$HOME/.asd/workspaces/<bilidili-workspace-hash>/.asd/alembic.db"   # 真实 BiliDili workspace DB（按项目解析）

# AI 配置（用户指定，按 runtime AI/embedding config 的 provider+model+key 键解析）：
#   主体 in-process AgentService → DeepSeek（真实 author run，非 model/provider:null）
#   embedding/semantic_memories/向量检索 → 本地千问 Qwen（默认模型 qwen3-embedding；真落库，非 Ollama-skip）

# PRE 基线（P1 之前第一动作，对真实 BiliDili DB 捕 characterization 基线）
sqlite3 "$DB" ".mode json" \
  "SELECT 'cov' k,count(*) n,sum(case when grade!='empty' then 1 else 0 end) nonempty FROM coverage_ledger
   UNION ALL SELECT 'rounds',count(*),max(round_index) FROM deep_mining_rounds
   UNION ALL SELECT 'recipes',count(*),0 FROM knowledge_entries
   UNION ALL SELECT 'refs',count(*),0 FROM recipe_source_refs
   UNION ALL SELECT 'props',count(*),0 FROM evolution_proposals
   UNION ALL SELECT 'ckpt',count(*),0 FROM git_diff_checkpoints" > scratchpad/baseline.json
```

**PRE/POST 基线（直接真测版，应用 critique B-1）**：无单一"parent-of-refactor commit"（refactor 跨 15 阶段 4 仓 + vendor-repin）。**PRE 基线 = P1 之前对真实 BiliDili DB 捕快照**（pre-refactor live HEAD Core 934d043/Plugin 9931596/主体 47889f9/Agent 99b8b33）。POST=refactored HEAD。**run 间用 `alembic_bootstrap{rebuild:true}` 重置真实 workspace**（守卫已有知识归档 `.asd/.trash`，rebuild 已授权）——pre-refactor vs post-refactor 行为对比=同一真实 BiliDili 两 HEAD 各跑各重置，不再切 DB 副本。**红线：只重建 BiliDili workspace，真 `~/.asd` 下其它 workspace 与全局表不动。**

**双宿主驱动**：host-agent=cc-plugin MCP stdio（`bin/alembic-start.mjs`）或本 session 交互，调 `alembic_plan`/`alembic_bootstrap`/`alembic_rescan`/`alembic_dimension_complete`/`alembic_work`（外部 author 供 planSelection/撰 recipe）；in-process=主体 `bin/daemon-server.ts`（或 `DashboardOperations.bootstrapProject`/HTTP `POST /api/bootstrap/knowledge`&`/api/rescan`），跑 daemon job+`@alembic/agent` in-process AI（**provider=DeepSeek，真实生成**）；`semantic_memories`/向量经**本地千问 Qwen 真落库**（不再 skip）。

**AI 配置声明（直接真测版，DeepSeek/Qwen 已配好）**：
- **DeepSeek = 主体 in-process author 生成 provider**——in-process author 真实生成（非 `model/provider:null` run），完整 coldStart/moduleMining recipe 真产、经 anti-fabrication 门禁；host-agent 端经交互 author 会话。
- **本地千问 Qwen = embedding/向量 provider** → `semantic_memories` 真落、向量检索/consolidation 相似度真算（不再 Ollama-skip）。
- **二者已配置好，只要正确使用即可——勿错配**：DeepSeek 只用于 author 生成、Qwen 只用于 embedding/向量，不可互换（用 embedding 模型生成或反之 = 错配）。
- 规则驱动链（plan-gate projection、evolution maintenance proposal、给定真实 recipe 的 coverage cell 回写）本就免 LLM。
- **BiliDili 生成的 recipe 可随意删除/重建**（直接真测、无副本顾虑；rebuild 已授权）。

#### Chain 1 — plan（plan-selection 前置门）
- **调用**：host `alembic_plan{draft}`→读 candidate→`{confirm,planSelection}`→`alembic_bootstrap{planSelection}`；in-process `kind:'bootstrap'` daemon job（`source:'alembic-main-bootstrap'`），gate at `runPlanSelectionGate`，Agent profile `plan-selection`。
- **DB 验**（应用 critique B-3，setup 先清 scope 防残留）：
```sql
DELETE FROM coverage_ledger WHERE project_root='$BILIDILI';   -- setup,断 delta 非绝对零
-- coldStart confirm 副作用（host,writeColdStartDeferredCoverageRows）:
SELECT module_id,dimension_id,deferred,grade FROM coverage_ledger
 WHERE project_root='$BILIDILI' AND deferred=1 ORDER BY module_id,dimension_id;
-- EXPECT: ≥1 deferred=1 grade='empty'/每 planned(module×dim);confirm 前 0。
```
- **envelope**：host confirm 带 `planSelection{generationStage:'coldStart',dimensions[]≥1,scale.totalRecipeBudget>0,moduleBindings[]≥1}`+`nextAction.tool='alembic_bootstrap'`；replay→`planGate.status='ready'` **非** `errorCode='PLAN_REQUIRED'`；in-process→job event `kind:'checkpoint' phase:'plan-gate' severity:'success'` 带 `metadata.{executionDimensions,budget,generationStage}`，Agent log profile `plan-selection`。
- **characterization**：双宿主 `applyPlanSelection` projection 字节同：`executionDimensions==<input dims 序保>`；`budget=={totalRecipeBudget:min(input,500),maxFiles:min(input,20000),contentMaxLines:min(input,2000)}`；`moduleScope==<derived>`。PRE vs POST 同输入同 projection。
- **负控/分歧义**：`alembic_bootstrap` 无 planSelection⇒`PLAN_REQUIRED` blocked（POST 此处 ready=门信任边界回归）；`alembic_rescan{coldStart}`⇒拒；`deepMining`/`moduleMining` 空 moduleBindings⇒双宿主 throw `"requires at least one module×dimension target"`（仅一宿主 throw=共享 Core stage-validator 分歧=回归）。
- **parity**：同 confirmed PlanSelection 喂双路；`PlanSelectionProjection`(executionDimensions/budget/moduleScope) 字节同；分歧表（author/wire-DTO+toCore/lease/presenter/validation-count）可异，projection keys 不可。

#### Chain 2 — fullIndex/coldStart
- **调用**：host `alembic_bootstrap{planSelection:<coldStart DTO>}`；in-process `DashboardOperations.bootstrapProject({maxFiles:500,contentMaxLines:120})`→job `kind:'bootstrap' source:'dashboard'`(gate source `alembic-main-bootstrap`)。
- **DB 验**（**cold-start-coverage 决策已定=cold-start 不写 measured 覆盖**，2026-06-28 用户；下式断言锁定 `==baseline`，不再 parameterize）：
```sql
SELECT count(*) FROM knowledge_entries WHERE lifecycle IN ('pending','active');   -- POST > 基线
SELECT count(*) FROM deep_mining_rounds WHERE project_root='$BILIDILI';                 -- ==基线(coldStart 不开 round)
SELECT count(*) FROM coverage_ledger WHERE project_root='$BILIDILI' AND deferred=0;     -- [决策依赖] ==基线(若 cold 不写)
```
- **envelope**：host `{success:true,data:{cleanup:{dbCleared:true,clearedTables>0},executionPlan.tiers,missionBriefing,ideAgentAnalysisSurface,onboardingContract,message starts '⚠️ Bootstrap 仅完成第一步'},meta:{tool:'alembic_bootstrap'}}`；in-process `{cleanup,report,filesByTarget,analysisFramework.dimensions,bootstrapSession,message starts 'Bootstrap 骨架已创建',asyncFill:true,sessionId}`+Socket.io `bootstrap:started/task-started/task-completed`。
- **characterization — R-2 头条破坏陷阱**：`buildColdStartWorkflowPlan` 字节同：`scan{maxFiles,contentMaxLines,skipGuard,sourceTag,generateReport:true,incremental:false,logPrefix:'Bootstrap'}`、`materialize{sourceGraph,dependencyEdges,moduleEntities,guardViolations 全 true}`、`response.tool=='alembic_bootstrap'`、`cleanup.projectRoot==(executor==='host-agent'?dataRoot:projectRoot)`。**R-2 文件系统证**：host bootstrap 后 cleanup 删 under **dataRoot**(ALEMBIC_HOME 的 data root) 非 `$BILIDILI`；in-process 删 under **projectRoot**(`$BILIDILI` 真实项目根)。快照 dir mtime pre/post 断哪个 root 被触。翻转=R-2 回归=**破坏真实 BiliDili 错目录**（直跑下尤须先过 characterization 再真跑）。
- **分歧义**：scan/materialize bool、`incremental:false`、`response.tool`、cleanup root 任改=回归；6 seam 仍须按宿主异（若 collapse 使 host `generateAstContext` 翻 true=merge-collapse 回归）。
- **parity**：`buildColdStartWorkflowPlan` 双宿主字节同 **modulo** R-2 `cleanup.projectRoot`(正确宿主依赖)+executor enum。

#### Chain 3 — incrementalIndex/deepMining
- **调用**：host 单趟 `alembic_rescan{planSelection:{generationStage:'deepMining',moduleBindings:[≥1 module×dim]}}`；in-process 多 round `kind:'rescan' source:'alembic-main-rescan'`,`deepMining`→`runDeepMiningRounds` while 循环。
- **DB 验**：
```sql
-- coverage cell 翻 NON-empty（finding#1 证,in-process per-dim 回写 1f141c8）:
SELECT module_id,dimension_id,covered_count,total_candidate_count,grade,value_score,last_round,deferred
  FROM coverage_ledger WHERE project_root='$BILIDILI' AND deferred=0 ORDER BY module_id,dimension_id;
-- EXPECT POST: ≥1 grade IN('thin','partial','covered') covered_count>0 last_round 戳。
-- BASELINE(真 BiliDili 02a25032): 表空/缺→refactor 不得再破。
SELECT round_index,started_at,completed_at,new_recipes_this_round,trigger_actor
  FROM deep_mining_rounds WHERE project_root='$BILIDILI' ORDER BY round_index;
-- EXPECT in-process: ≥1 trigger_actor='daemon-job-runner' completed_at NOT NULL new_recipes_this_round 填;
--        host: 至多 1 advisory-open trigger_actor='host-agent-rescan'。
SELECT count(*) FROM recipe_source_refs WHERE status='active';   -- POST > PRE
```
- **envelope**：in-process `result.deepMining.{advisor,moduleCount,rounds[],stopReason}`+`planSelectionProjection`+`status:'complete'`；每 `rounds[]` 有 `rescanId='${jobId}:deepMining:${roundIndex}'`/`newRecipesThisRound`/`stopReasonAfterRound`；循环**终止**`advisor.stopReason∈{converged,diminishing-returns,round-cap,continue}`。host `response.tool='alembic_rescan'`+`data.coverageAdvisory`+`meta.coverageLedgerSeed`。
- **characterization**：`writeCoverageLedgerForCompletion` cell 形 pre/post 同（measured cell `grade` from `resolveCoverageGrade`；deferred=1 cell grade='empty'）；60/50 importance+`:line`-strip 不变；`KnowledgeRescanWorkflowPlan.cleanup.projectRoot==dataRoot`(R-2 `:55-60`) 字节同。
- **分歧义**：循环不设 `shouldStop`=回归（DeepMiningRoundGate split 破 advisor 契约）；in-process deepMining 后 cell 空=finding#1 再破=**硬失败**(realverify 门)；projection envelope keys 双宿主分歧=Core-spine 回归。
- **parity**：双向各一 deepMining，diff `coverage_ledger`；**等价 modulo round-driving**（in-process N measured round，host ≤1 advisory，但 per-(module×dim) **cell 须配**同 grade）；翻 executor 不得改 `cleanup.projectRoot`。

#### Chain 4 — scopedIndex/moduleMining
- **调用**：host briefing-only `alembic_rescan{moduleMining,moduleBindings}`；in-process fan-out ENTRY A `runModuleMiningWorkflow`(binding-rich) + 另跑 **ENTRY B**(`KnowledgeRescanWorkflow` Step 7,scope-only) 锁两 selector。
- **DB 验**：
```sql
SELECT r.recipe_id,r.source_path FROM recipe_source_refs r WHERE r.status='active'
  AND r.recipe_id NOT IN (/* baseline snapshot */);
-- EXPECT: sourceRefCount>0/每 mined module;source_path 在该 module ownedFiles（非全仓）。
SELECT module_id,dimension_id,grade,covered_count FROM coverage_ledger
  WHERE project_root='$BILIDILI' AND module_id IN (<scoped modules>);   -- grade 从 'empty' 推进
SELECT count(*) FROM deep_mining_rounds WHERE project_root='$BILIDILI';   -- ==基线(moduleMining 无新 round)
```
- **envelope**：in-process `result.moduleMining{moduleCount,newRecipes>0,persistedNewRecipes,persistedSourceRefCount>0,scaleCap}`+`planSelectionProjection`；零 recipe throw `'moduleMining produced zero recipes'`；Agent profile `module-mining-session` status `success`，一子/ProjectContext module(`partitionProjectContextModules`)，子数==selectedModules capped by `ALEMBIC_MODULE_MINING_CONCURRENCY`(默认2)。host `presentHostAgentKnowledgeRescanResponse` 带 `intent.perDimensionTargets/moduleDimensionTargets` non-empty；briefing ≤18KB inline OR `fullBriefingRef`→'rescan-briefing' transient；`response.tool='alembic_rescan'`。
- **characterization + selector 收敛（用户 2026-06-28 决策=Entry B 也 binding-rich）**：捕 PRE 每入口 selected module 集+`plannedDimensions`；**POST：两入口皆带 `plannedDimensions`；Entry B PRE 无→POST 有 = 预期行为变更（非回归）**。断言 Entry A plannedDimensions 不丢、**Entry B 收敛后按 plannedDimensions 定向、下游 fan-out 正确消费该字段**。**ENTRY B 无 host-agent twin，是单宿主 characterization 非 parity check**（critique P-3，免审者误期 host diff）。
- **分歧义**：host-agent 得 partitioner/fan-out 或 in-process 失之=host-adapter split 错 collapse；moduleMining run 开 `deep_mining_round`=stage-guard 回归。
- **parity**：双产 module-scoped recipe 经同 Core `applyPlanSelection→moduleScope`+`validatePlanSelectionModuleTargets`；同 scope⇒同 `coverage_ledger`(module×dim) cell+同 recipe source_path（modulo who-authored）。

#### Chain 5 — dimensionComplete
- **调用**：host `alembic_submit_knowledge`→`alembic_dimension_complete{dimensionId,sessionId}`；in-process 隐式 `onDimensionResult` hook（`BootstrapConsumers.ts:782`,无工具）。
- **DB 验**（load-bearing 覆盖回写）：
```sql
SELECT module_id,dimension_id,covered_count,total_candidate_count,grade,value_score,
       exhausted,exhausted_reason,exhausted_source,last_round,deferred
  FROM coverage_ledger WHERE project_root='$BILIDILI' AND dimension_id='<completed-dim>';
-- EXPECT: measured cell deferred=0 grade∈{empty,thin,partial,covered};ownedPaths 不在 referencedFiles 的 module→grade='thin'/'empty'(deepMining gap 信号)。
--        host-agent only: exhausted=1 可能;in-process: 从不 exhausted。
SELECT round_index,new_recipes_this_round FROM deep_mining_rounds WHERE project_root='$BILIDILI'
  ORDER BY round_index DESC LIMIT 1;   -- new_recipes_this_round 推进(host inline reflow;in-process upsertRound)
SELECT count(*) FROM knowledge_entries WHERE dimensionId='<completed-dim>' AND lifecycle='active';
```
- **envelope**：host `meta.tool='alembic_dimension_complete'`+`data.{updated,recipesBound,progress 'N/M',completedDimensions[],isBootstrapComplete,completenessCritic,subpackageCoverageWarning}`——**响应无 coverage 字段**，coverage 是 DB 副作用，验收必读 DB。in-process `fillSummary.coverageWrittenCells>0`+log `'[CoverageLedger] coverage state written (advisory, not a gate)'`+hook fire=`BootstrapConsumers.ts:782` 达（每 accepted dimension 一次）。
- **characterization — 重复 module-axis adapter**：host `listCanonicalModules()` vs in-process `projectMapModules` 皆产 `CoverageLedgerModuleAxis` 喂同 `writeCoverageLedgerForCompletion`；固定 dimension 同副本，**结果 cell 须等** PRE vs POST AND host-vs-in-process（modulo exhausted 仅 host）。CompletenessCritic split(CG-C)/coverage unify 改同输入 grade=回归。
- **分歧义**：覆盖写失败**不得**致 dimension 完成失败（best-effort try/catch）——完成成功 log 显 skip（POST 设门=回归）；cold-start 任宿主写覆盖=回归（rescan/deepMining-only 设计）。
- **parity**：同 dimension 同 scope→双宿主写**同** `coverage_ledger` cell（同 60/50、同 grade 解析）；trigger 异（MCP 工具 vs hook），DB 效须配。**host reflow 需先有 advisory round；host 无 round 行是预期非 diff**（应用 critique P-2，收紧 parity allowance）。

#### Chain 6 — evolution（maintenance+decay，规则驱动免 LLM）
- **调用**：host commit-driven（committed 改 `$BILIDILI`，close governed tool `alembic_work`/`alembic_code_guard` 即 10 `COMMIT_DRIVEN_TRIGGER_TOOLS` 之一）；in-process `POST /api/v1/evolution/file-changed`(modified 事件)+`EvolutionMaintenanceSweep`(60s,`ALEMBIC_EVOLUTION_MAINTENANCE_SWEEP=1`)。
- **DB 验**：
```sql
SELECT id,type,target_recipe_id,source,status,confidence FROM evolution_proposals
  WHERE source='file-change' AND id NOT IN (/* baseline */);
-- EXPECT: 0→≥1;source='file-change';type='update'(modified covered+pattern token≥0.3) OR 'deprecate'(del last active ref)。
--        KNOWN green: 0→1 复现 3/3。
SELECT project_root,* FROM git_diff_checkpoints WHERE project_root='$BILIDILI';   -- host: HEAD 推进
SELECT id,lifecycle FROM knowledge_entries WHERE lifecycle IN ('evolving','decaying','active');
-- EXPECT sweep 后: evolving>7d→active;pending/decaying>30d GC。
SELECT recipe_id,status FROM recipe_source_refs WHERE recipe_id='<deleted-source recipe>';
-- EXPECT: status='stale' on deleted ref;knowledge_entries 行仍在(deprecate 非 delete)。
```
- **envelope**：host MCP `data.unifiedEvolution.evidenceGate.verdict='routed'`（**caveat**：trigger 工具回 `isError:true`('Unrecognized key: data' from `data.unifiedEvolution`) 但维护落 DB——**判 DB 行非 envelope**）；committed-impactful→advance+propose，trivial committed→advance-only(LP7 `generationChangeLog 'source-modified-git-head-no-impact'`无 proposal)。in-process `data.needsReview≥1`(`ReactiveEvolutionReport`)+daemon log `'[EvolutionMaintenanceSweep] periodic sweep completed'` 带 `executedCount/promotedCount/decayScannedCount`+`#inFlight` 守卫(一 sweep/tick,d49fc05)。
- **characterization**：`assessFileImpact` score(0.3 阈) pre/post 同输入 diff 同；维护 VERBS 不变（rename→update/repair、del-last-ref→deprecate、modified-pattern→update、modified-reference→skip、created→skip）；host conf≥0.9 auto-repair sourceRef、in-process 从不 auto-repair——该分歧须存。
- **分歧义**：同 committed 改双宿主异 `evolution_proposals` 行（超 report-shape 超集）=Core Gateway 分歧；N-9 rename 改 proposal `source`/`type` 字面=FREEZE 破；coverage cell deepMining feeder run 后仍空=converged-dead-code 回归（耦 Chain 3 finding#1）。
- **parity**：同 committed covered-source 改驱 Plugin→proposal AND（daemon 跑）主体 file-watch→proposal；双写**同** `evolution_proposals source='file-change'` 行经同 Core `EvolutionGateway.submit`。一 Core brain，两 host trigger（commit-checkpoint vs file-watch）+主体-only 周期 sweep。

#### 12.3.cc 跨切：双宿主 PARITY 主断言

每链 **Core-spine 效**（DB 行+projection envelope keys）须宿主无关；仅 documented 分歧 seam（author、trigger shape、input wrapping、lease、presenter、report shape、periodic sweep）可异。机器可检 predicate：
```
diff( coverage_ledger rows, knowledge_entries deltas, evolution_proposals rows, deep_mining_rounds cells )
  between host-agent-run and in-process-run over equivalent input
  == ∅   (modulo: round-driving count, exhausted-declarations[host-only], report-shape, trigger metadata,
          host-reflow-needs-prior-round[Chain5], ENTRY-B-no-host-twin[Chain4])
```
非空 diff 出此 allowance=refactor 泄漏 host-specific 行为入共享 Core=**回归，block refactor**。

#### 12.3.gate Gate 序（哪些阶段须真测过方移 twin/shim）

1. **G0 前置**（已满足,复验）：CG-3 sink land(Core `934d043`)；in-process per-dim 回写 land(主体 `1f141c8`)；Plugin re-import shim land(`9931596`)；**cold-start-coverage 决策已定（保持不写）+ moduleMining selector 收敛决策已定（binding-rich）**。每 Core build 后 re-pin `vendor/AlembicCore`；4 仓 `build:check` 绿(Node≥22+boundary lint)。
2. **G1 PRE 基线**：6 链对 live-HEAD pin 的 PRE build → snapshot DB+envelope=characterization 基线。**P1 之前作第一动作捕获**（非"parent-of-refactor commit",应用 critique B-1）。
3. **G2 冷批**：AppRuntime 等(不触链符号)。重跑 Chain 2(coldStart app-boot 接线)→须等 G1。
4. **G3 热批/Core 行**：每 Core rename→`build:core`→repin→consumer `build:check`→重跑触链双宿主→DB+envelope 等 G1 AND 过 parity predicate。**R-2 三元文件系统证(Chain 2+3)是硬门**——翻 cleanup root block 批。
5. **G4 finding#1/coverage 门**：Chain 3+5 in-process coverage cell 翻 NON-empty 于**真实 BiliDili 直跑**（realverify 折叠职责——直接对真实 BiliDili workspace 观，非合成 fixture、非沙箱副本；主体 AI=DeepSeek/向量=本地千问 Qwen）。空→hot-zone collapse 破 per-dim 回写→**block**。
6. **G5 late-L2**（授权 rename+alias）：仅 G3+G4 绿后。renamed builder 保 R1 barrel 别名 shim。重跑 6 链。
7. **G6 twin/shim 移**：移 R1 alias shim+`moduleMiningRoutes`-empty compat 字段，仅 G5 双宿主绿 ≥2 连续 run 无 parity diff 后。移双 FileChangeHandler 名义 base/coverage-ledger-write re-export shim 需 parity predicate(Chain 6+3/5)==∅。
8. **FREEZE 不变量每门检**：job kind/source、`response.tool`、PlanStageId、lifecycle、`evolution_proposals.source='file-change'`、coverage_ledger/deep_mining_rounds 列、export paths。

**Order rule**：G1(PRE,pin live HEAD)→G2(冷)→G3(热/行,R-2 文件系统证)→G4(真 BiliDili 覆盖门)→G5(late-L2+alias)→G6(shim/twin 移)。任 twin/alias 移须其链过真 BiliDili 副本 parity predicate 之后。

---

### 12.4 完整性与安全声明

**Load-bearing 不变量（每热阶段强制）：**
1. **R-2 三元**（`ColdStartPlan.ts:79`+`KnowledgeRescanWorkflowPlan.ts:55-60` `host-agent?dataRoot:projectRoot`）留 Core 不 per-host 重导——头号破坏陷阱（错 root=full-reset 删错树）。
2. **per-host split 存活**——宿主内统一,仅经 Core 共享;跨宿主 `{mode,executor}` 函数违两 CLAUDE.md 仓边界(CG-5)。
3. **round 循环是 caller 非吸收**——`runDeepMiningRounds`(P6 模块) 调 `runProjectIndexWorkflow('incremental')`;host 无循环不背死脚手架。
4. **bin/cli.ts:699/:884**——简报未列主体消费者;P10 须同 commit 改否则 CLI bootstrap/rescan 静默断。
5. **REAL-TEST 必做 @ P6,P9,P10,P11,P12,P13**——单测快照可过而 live DB 在分歧 seam(R-2 root、async-fill-vs-briefing、coverage 回写)回归;**真实 BiliDili 直跑**（主体 AI=DeepSeek/向量=本地千问 Qwen，run 间 `rebuild:true` 重置；不做沙箱副本）。**R-2 三元须先过 characterization 再真跑**（直跑下错 root=破坏真实项目）。
6. **vendor-repin** 每 Core-touch 阶段(P4,P5,P9,P13)。

**已应用的 critique 修正（blocking 1–7 全闭）：**
- **C-1**：`executeApiAiWorkflow:918`+`runBootstrapPlanGate:959` 入 P6/P10 同 commit 消费者审计。
- **C-2**：已核 `bin/api-server.ts`+`lib/http/routes/` **不直接 import 任一 workflow**（无第四消费者）；P10 仍 grep 留证。
- **P-1**：cold-start-coverage 曾列为显式 hot-gate 前置；**2026-06-28 用户已拍=保持不写**→Chain 2 覆盖断言现锁定 `==baseline`（不再 parameterize）。
- **F-1**：P3 rename 前先 grep `'Bootstrap'` 作 DI string-key——已核 `'Bootstrap'` 另作 signalBus/logPrefix 字面（`BootstrapTaskManager.ts:367/651` 等），类在 `lib/Bootstrap.ts:37` 独立文件，rename 只动类不动 signal/log 字面。
- **F-2**：显式声明主体/Plugin orchestrator 文件**保现路径**，仅 Core workflow 模块迁 `project-index/`（symbol 别名救不了动态 import 路径）。
- **S-1**：P4 解 cold/hot 矛盾——刻 behavior-neutral cold-Core 例外（纯 relocation 不改行为故不继承 realverify 依赖），但仍在阶段内 vendor-repin。
- **O-1**：P10 加 session-release-on-completion 断言（registry post-run 空/release log），非仅 coverage cell。
- **B-1**：PRE 基线 pin 当前 live HEADs，P1 前第一动作捕获。

**非阻塞 critique 已纳入**：C-3（consolidation 出范围声明入 P2）、P-2（Chain 5 host-reflow-needs-prior-round allowance）、P-3（Chain 4 ENTRY B 单宿主 characterization 声明）、S-2（P8 deps rationale 修正）、O-2（P6 inline-fill 断言）、B-2（creds 可跑性分链声明）、B-3（Chain 1 setup DELETE/断 delta）。

**Dropped over-reach**：无新增非 grounded 范围；consolidation/RecipeSimilarity 明确出范围（无符号 rename）；828L Plugin FileChangeHandler 不强 split（cohesive 单类仅 flag）；N-4 `residentProjectScopeAvailable` 仅验对齐不再 rename。

**残留待决（用户/realverify 门，非本指南可定）：**
- ~~cold-start-coverage 决策~~ **✅ 已定（2026-06-28 用户：保持不写）**——P9/P10 锁此行为、Chain 2 断言 `==baseline`。
- **F-B decayScore→deprecate-execute 量纲**（Design 重设计,非本 refactor 直修）。
- ~~moduleMining 两 selector reconcile~~ **✅ 已定（2026-06-28 用户：收敛为 binding-rich，Entry B 也带 plannedDimensions=行为变更）**——P11 独立 REAL-TEST 证改进非破坏。
- **ledger git-commit/产品发版/U7 全维填充 run**（用户门,本指南不触）。

**双宿主 parity 全覆盖确认**：6 链 × {host-agent ‖ in-process ‖ Core 脊 ‖ 共享/分歧锁} 锚定表(12.0)、统一设计(12.1)、15 阶段(12.2)、6 链真测+parity predicate+gate 序(12.3) 完整闭合；R-2/per-host-split/round-loop-as-caller/collapse-before-unify/REAL-TEST-on-divergent-seams/vendor-repin-per-Core-row 六不变量贯穿;FREEZE 不变量每门检。

---

**关键文件（绝对路径）：**
- 主体：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic/lib/workflows/cold-start/ColdStartWorkflow.ts`、`.../Alembic/lib/workflows/knowledge-rescan/KnowledgeRescanWorkflow.ts`、`.../Alembic/lib/daemon/DaemonJobRunner.ts`（round 循环 :1063-1202、gate :969-1061、dispatch :918）、`.../Alembic/bin/cli.ts`（:699/:884 未列消费者）、`.../Alembic/lib/Bootstrap.ts:37`（P3 类）、`.../Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`（1585L,P8）、`.../Alembic/lib/service/evolution/{FileChangeHandler.ts,EvolutionMaintenanceSweep.ts}`、`.../Alembic/bin/api-server.ts`（已核无直接 workflow import）。
- Plugin：`/Users/.../AlembicPlugin/lib/recipe-generation/host-agent-workflows/{cold-start.ts,knowledge-rescan.ts,coverage-ledger-write.ts}`、`.../plan-generation-gate.ts`（R-2 `resolvePlanCleanupPolicy:490`、`toCorePlanSelection:525`）、`.../plan-tool.ts`（2009L,P7）、`.../recipe-generation/evolution/{FileChangeHandler.ts,PluginOpportunisticEvolution.ts,git-diff-checkpoint/CommitDrivenMaintenance.ts}`、`handlers/host-agent/{bootstrap.ts,rescan.ts,dimension-completion.ts}`、`McpServer.ts:417/:422`、`HostMcpServer.ts:788-792`。
- Core：`/Users/.../AlembicCore/src/workflows/cold-start/{ColdStartIntent.ts,ColdStartPlan.ts:79,ColdStartPresenters.ts}`、`.../workflows/knowledge-rescan/KnowledgeRescanWorkflowPlan.ts:55-60`、`.../workflows/capabilities/{host-agent/{CoverageLedgerWrite.ts:61,CoverageLedgerAdvisor.ts:88},planning/knowledge/KnowledgeRescanPlanBuilder.ts,CompletenessCritic.ts}`、`.../service/planIntent/{planIntent.ts,contracts.ts:1}`、`.../service/evolution/{ContentImpactAnalyzer.ts:57,EvolutionGateway.ts:82}`、`.../host-agent-workflows.ts`（barrel）。
- Agent：`/Users/.../AlembicAgent/src/agent/runs/{plan/PlanAgentRun.ts,module/ModuleMiningAgentRun.ts:23}`、`.../profiles/definitions/{plan.profile.ts,module.profile.ts}`。

## 证据与链接
- Grounding:5-agent 跨四仓测绘 + 11 项 grep/wc/ls 复核 + **5-agent 穷尽修改点扫描 + 完整性 critic(见 §10,~683K tokens)**(~612K tokens)。
- 在途依赖:[伞形 lifecycle-global](alembic-recipe-lifecycle-global-2026-06-26.md)、[主体适配](alembic-mainbody-lifecycle-adaptation-2026-06-26.md);前序架构工作(Core inventory/主体 cleanup/Agent convergence/Plugin daemon-removal,均 COMPLETE)。
- 关键载重点:`contracts.ts:1-64`、`JobStore.ts:15`、`ColdStartPlan.ts:9,44`、`ProjectSkillDeliveryContracts.ts:77`、`plan-generation-gate.ts:19,66,191`、`PluginOpportunisticEvolution.ts:9,20,25,147`、`AlembicPlugin/CLAUDE.md:144-167`。
