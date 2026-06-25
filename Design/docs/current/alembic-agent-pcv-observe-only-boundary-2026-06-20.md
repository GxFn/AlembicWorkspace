# AlembicAgent PCV/PCVM 职责边界收敛：默认 observe-only 证据层 Requirement Design

Date: 2026-06-20
Status: confirmed（4 项决策已确认 2026-06-20；范围=跨仓 AlembicAgent + Alembic主体；AP-0 代码研究项待控制器核实）
Owner Window: Design
Receiving Window: Wakeflow
Design Key: alembic-agent-pcv-observe-only-boundary-2026-06-20

## Confirmed Goal

把 AlembicAgent 内的 **PCV（Provenance / Chain Validation）从「默认占用并控制正常 LLM 主循环」收敛为「默认 observe-only
的旁路证据层」**。PCV 应主要服务测试、审计、证据链与质量验证；它对 prompt / toolChoice / graceful-exit / 阶段推进 /
主循环成功条件的**控制行为**，必须从默认路径中剥离，改由独立、显式开启的 runtime guard / policy 承担，且命名上与 PCV 旁路
记录分离。

完成后：默认模式下 PCV 只记录证据、不改变正常 LLM 循环；若仍需 grounding enforcement，必须经独立 runtime guard / config
显式开启；现有 PCV 证据链、quality gate metadata、sourceRef diagnostics、Test/审计能力全部保留、不删不降。

> 无独立 original plan；本 requirement design 承载计划。用户 2026-06-20 直接要求新建本需求设计。

## Final Completion Definition

Wakeflow 仅在以下全部满足时可接受本需求：

- **默认 observe-only**：默认配置下，PcvNodeEvidence 记录全量证据，但 LLM 主循环行为（prompt 内容、toolChoice、
  graceful-exit、阶段推进、成功条件）与「完全不读 PCV」时一致——除少量 trace/artifact 字段外无可观测差异。
- **enforcement 显式化且改名归位**：analyze grounding 阻断 + nudge + grounding-policy prompt 注入收敛进独立
  `AnalyzeGroundingGuard`（默认关闭、显式开启），命名不归入 PCV 证据记录层。
- **provider 正确性与 grounding enforcement 解耦**：DeepSeek V4 tool-choice 处理收敛进独立 `ProviderToolChoicePolicy`，
  作为 provider 兼容策略保留（默认行为不回归），不再借道 PCV 证据层做读写往返。
- **证据契约不破 + 增量标记**：PcvNodeEvidenceSummary 及被 Alembic主体 / PCVM / progressive-chain-validation 消费的字段
  （含 grounding `classification`、`deepseekV4ToolChoiceMode` 等）继续产出，仅其语义降为审计材料；**新增 enforcement-mode 标记**
  （additive、向后兼容），让消费方区分 observe-only vs guard 运行。
- **主体跨仓 consumer 对齐**（PD4=纳入）：Alembic主体 `lib/workflows/ai-execution` 证据消费在 observe-only 默认下语义正确——
  grounding ledger summary 作审计、**不把 observe-only 下增多的 `invalid-no-evidence` 误判为质量回归**，消费新增 enforcement-mode
  标记；N8/N9/N12 envelope 与 PcvObservabilityLinkage 语义在两模式下正确；跨仓回归通过。
- **guard 有真实消费者**（PD6）：至少一条质量运行链路（PCVM/Test）被接通为显式开启 guard，grounding enforcement 回路端到端可用、非空开关。
- **测试覆盖五场景**：observe-only 默认、guard-enabled、DeepSeek V4 特例、graceful exit、analyze 阶段无证据文本，全部有
  确定性断言；跨仓证据消费回归通过。
- **可观测性不降**：sourceRef diagnostics、quality gate metadata、missing-link diagnostics 仍可被审计/测试读取。

## 交付物对照（用户 7 项 + 验收 + 非目标）

| 用户要求 | 本设计对应章节 |
| --- | --- |
| 1. PCV 正确职责定义（证据旁路 vs runtime policy） | Proposed Behavior · 职责边界表 |
| 2. 是否拆独立模块（AnalyzeGroundingGuard / ProviderToolChoicePolicy） | Implementation Decisions · 模块拆分 |
| 3. 默认行为建议（observe-only 默认；guard 显式开启） | Implementation Decisions · 默认与开关 |
| 4. 迁移方案 | Phase Candidates |
| 5. 兼容性要求 | Risks And Decisions · 兼容性 + Repository Boundaries |
| 6. 风险分析（空泛分析 / 无证据推进 / DeepSeek V4 回归） | Risks And Decisions · 风险 |
| 7. 验收标准 + 测试建议 | Acceptance Criteria + Validation Strategy |
| 非目标 | Risks And Decisions · 非目标 |

## User Scenario

- Actor：AlembicAgent 正常 LLM 推理循环（analyst/bootstrap/scan 等 pipeline）；以及测试/审计/PCVM/Test 链路。
- Starting state：当前 PCV 始终开启并参与主循环——LLMInputAssembly 默认向 analyze 阶段注入 grounding policy；AgentRuntime
  对 DeepSeek V4 改写 toolChoice、按 grounding burn 抑制工具调用、按 `invalid-no-evidence` 阻断 analyze 推进并追加 nudge。
- Action：在默认配置下跑一次正常 Agent 循环；再在显式开启 grounding guard 后跑一次。
- Expected result：
  - 默认：PCV 只记录证据；prompt 无 grounding-policy 注入；toolChoice/阶段推进/退出条件不被 PCV 分类影响；DeepSeek V4 仍由
    provider policy 保持正确工具可见性。
  - guard-enabled：恢复 analyze grounding 阻断 + nudge（用于质量/取证强约束运行，如 PCVM/Test 场景）。
- Failure visibility：默认模式下若仍出现 PCV 导致的 prompt 变化 / toolChoice 改写 / 阶段阻断，即为不达标；guard 开启后若不阻断
  `invalid-no-evidence` 即为不达标；DeepSeek V4 在默认模式下工具选择回归（被错误强制 none）即为不达标。

## Functional Loop

| Part | Description |
| --- | --- |
| Input | 正常 LLM 循环输入（messages、toolSchemas、requestedToolChoice、stage/pipeline 上下文）；新增 grounding-enforcement 运行配置（默认 off）。 |
| Producer | PcvNodeEvidence（纯观察，产出证据 + 审计用 classification）；`ProviderToolChoicePolicy`（provider 正确性）；`AnalyzeGroundingGuard`（显式开启时的质量约束）。 |
| State/Data Change | 证据：PcvNodeEvidenceSummary 全量记录（不变）。控制：默认不改 prompt/toolChoice/阶段；guard 开启时按 classification 阻断 + nudge + rollback tick。 |
| Consumer | 主循环（AgentRuntime）只在 guard 开启时消费 grounding 判定；Alembic主体 ai-execution / PCVM / Test 仅消费证据 schema。 |
| Output | LLM 结果 + PcvNodeEvidenceSummary（审计/质量门/sourceRef diagnostics 保留）。 |
| Failure Path | 默认 off 下出现 PCV 主循环副作用、或 guard off 后 DeepSeek V4 工具选择回归、或证据字段缺失，均为失败。 |
| User Verification | 默认/guard 两模式对照跑；关 PCV metadata 后主流程行为对照；DeepSeek V4 实跑；analyze 无证据场景。 |

## Repository Boundaries

| Window / Repository | Role | Expected Change | Upstream Dependency | Downstream Consumer |
| --- | --- | --- | --- | --- |
| AlembicAgent | 主实现 | 拆 `ProviderToolChoicePolicy` + `AnalyzeGroundingGuard`；PcvNodeEvidence 纯化为观察；引入 grounding-enforcement 配置默认 off；保留证据 schema | @alembic/core（仅 import 边界，不改 Core） | 主体/PCVM/Test 消费证据 |
| Alembic主体 (Alembic) | **participates**（PD4 纳入跨仓） | 更新 `lib/workflows/ai-execution/PcvNodeEvidence.ts` 消费：grounding ledger summary 改判为审计语义、消费 enforcement-mode 标记、observe-only 下不误判质量回归；保 buildPcvAnalyzeGroundingLedgerSummary / N8 / N9 / N12 + PcvObservabilityLinkage 两模式语义正确 | Agent 证据 schema（含新增 enforcement-mode 标记） | 报告/checkpoint 持久化 |
| AlembicCore | no-task | 无 Core 改动（PCV 为 Agent 自有，不属 Core 确定性能力） | — | — |
| PCVM | **participates**（PD6 opt-in） | 质量运行链路调用 Agent 时显式开 guard（per-run 传 `groundingEnforcement='guard'`）；继续消费证据产出 round metrics / scorecard；不改方法包本体 | Agent + 主体证据；guard 能力(AP-3) | 计划/记录 artifact |
| progressive-chain-validation / Test | **participates**（验证 + opt-in wiring） | 真实场景验证 observe-only/guard 两模式 + DeepSeek V4 + graceful exit + 无证据 analyze；**质量运行 per-run 开 guard 的 opt-in wiring**；不改方法包本体（除非接口边界被迫同步） | Agent 证据 + guard 行为 | 节点级 verdict |
| Wakeflow | controller/runtime support | intake、状态根、phase 确认、派发、验收 | 本需求设计 | — |

## Proposed Behavior

### 职责边界定义（交付物 1）：证据旁路 vs runtime policy

| 能力 | 归属 | 默认 | 当前代码位置（证据） |
| --- | --- | --- | --- |
| LLM input assembly 快照（toolChoice/section/modelRef 等） | **证据旁路**（保留） | 记录 | PcvNodeEvidence.ts:335-414 `recordPcvInputAssembly` |
| LLM output（textOutputChars/outputSourceRefs/functionCallNames/reasoning） | **证据旁路** | 记录 | PcvNodeEvidence.ts:416-456 `recordPcvLlmOutput` |
| tool result / finding refs（accepted/rejected/repair） | **证据旁路** | 记录 | PcvNodeEvidence.ts:488-566 `recordPcvToolResult` |
| sourceRef + sourceRefDiagnostics（ambiguous/missing） | **证据旁路** | 记录 | PcvNodeEvidence.ts:163-164,773-777,1235-1262 |
| quality gate metadata（pass/action/scores/suggestions） | **证据旁路** | 记录 | PcvNodeEvidence.ts:615-654（来源 insightGate.ts:807-815） |
| missing-link diagnostics | **证据旁路** | 记录 | PcvNodeEvidence.ts:1033-1054 `buildMissingLinkReasons` |
| grounding burn `classification`（含 `invalid-no-evidence`） | **证据旁路产物**（保留为审计标签） | 记录、不据此控流 | PcvNodeEvidence.ts:47-54,1363-1396 `classifyGroundingEntry` |
| grounding-policy **指令文本注入**（analyze，`evidenceGroundingPolicy` 强制措辞） | **runtime policy** → `AnalyzeGroundingGuard` | **默认关闭** | LLMInputAssembly.ts:440-442 + buildAnalyzeGroundingPolicy :523-534（always-on） |
| 证据 **ref 列表注入**（deterministicEvidenceRefs / evidenceStarterRefs） | **证据旁路上下文**（非强制，PD5 保留） | **保留默认注入** | LLMInputAssembly.ts:432-438 |
| analyze **阻断 + nudge + rollback tick** | **runtime policy** → `AnalyzeGroundingGuard` | **默认关闭** | AgentRuntime.ts:1576-1605,1707-1732 |
| DeepSeek V4 **toolChoice 改写**（none→auto、tool schema 可见） | **provider policy** → `ProviderToolChoicePolicy` | **保留**（provider 正确性，默认行为不回归） | AgentRuntime.ts:884-905,2207-2241；mode 计算 PcvNodeEvidence.ts:1350-1361 |
| 工具调用抑制的 **DeepSeek V4 例外**（读 `deepseekV4ToolChoiceMode`） | **provider policy** → `ProviderToolChoicePolicy` | 随 provider policy | AgentRuntime.ts:1129-1151 |
| graceful-exit / `toolChoice==='none'` **通用**工具抑制 | **正常循环卫生**（非 PCV，保留原状） | 不变 | AgentRuntime.ts:1132-1151（基础分支） |
| insightGate quality gate **的 retry/degrade 动作** | **独立既有 runtime 机制**（非 PCV grounding，scope 外） | 不变 | insightGate.ts:751-848 |

关键纠偏：当前 `PcvNodeEvidence.ts` 本身**已是纯观察**（无 `if(block)`/无 mutation）。真正的「混在一起」是：(a) 证据层**产出
enforcement 用途的判定**（`classification`、`deepseekV4ToolChoiceMode`，甚至 `buildDeepSeekV4ToolChoiceMode` 落在证据文件里），
(b) AgentRuntime / LLMInputAssembly **消费 PCV 派生信号驱动控流**。收敛点因此是「切断主循环对 PCV 判定的默认依赖」+「把策略逻辑
搬出证据文件」，而非删证据。

## Implementation Decisions

### 模块拆分（交付物 2）

1. **`ProviderToolChoicePolicy`（新，provider 层）**：吸收 `buildDeepSeekV4AnalyzeGroundingPolicy`
   (AgentRuntime.ts:2207-2222)、`isDeepSeekV4AnalyzeFirstGroundingBurn` (2224-2241)、toolChoice/tool-schema 改写
   (884-905)、抑制例外 (1129-1151) 与 `buildDeepSeekV4ToolChoiceMode`（从 PcvNodeEvidence.ts:1350-1361 迁出）。
   该模块**自持其 mode 状态**，消除「policy 写入 PCV burn → policy 再读回」的往返耦合；PCV 仅**观察**最终 effective vs
   requested toolChoice（记录不变）。定位：provider 兼容正确性，**非** grounding 质量门。
2. **`AnalyzeGroundingGuard`（新，runtime 质量门层）**：吸收 analyze grounding 阻断 + nudge + rollback
   (AgentRuntime.ts:1576-1605,1707-1732) 与 grounding-policy **指令文本**注入 (LLMInputAssembly.ts:440-442 / buildAnalyzeGroundingPolicy :523-534)。
   输入 = PCV 的 grounding `classification`（只读消费）；输出 = block/nudge 决策。**默认关闭**。
   **边界（PD5）**：guard 仅含「政策文本 + nudge + 阻断」；**证据 ref 列表注入（deterministicEvidenceRefs / evidenceStarterRefs，:432-438）不入 guard、保留为默认 analyze 上下文**——它是有用的 grounding 材料而非强制控制。
3. **`PcvNodeEvidence`（保留，纯观察）**：继续记录全部证据与审计 classification；剥离 provider mode 计算；不含任何控流。
4. **grounding-enforcement 运行配置（新，PD7）**：`groundingEnforcement: 'off' | 'guard'`，**全局默认 `'off'` + 可按运行/调用（per-run/per-invocation）覆盖**；`AnalyzeGroundingGuard`
   与 grounding-policy 指令文本注入仅在生效值为 `'guard'` 时启用。`ProviderToolChoicePolicy` **不受此开关控制**（provider 正确性独立）。
5. **证据 enforcement-mode 标记（新，跨仓契约，PD4）**：在 PcvNodeEvidenceSummary **additive 增加**一个表示本次运行 grounding
   enforcement 状态的字段（如 `groundingEnforcement: 'off' | 'guard'`，及可选「本可阻断但因 observe-only 放行」的计数）。Agent 端
   产出（生产者），Alembic主体 ai-execution 消费（消费者）：据此把 grounding ledger summary 解读为审计而非质量判定，避免 observe-only
   下 `invalid-no-evidence` 增多被误读为回归。**纯增量、不改既有字段名**，老消费者不受影响。生产者先行（AP-4）、消费者随后（AP-6）。
6. **guard 真实消费者 + opt-in wiring（新，PD6）**：PCVM/Test 质量运行链路在调用 Agent 时显式传 `groundingEnforcement='guard'`，使 enforcement
   回路有真实 opt-in 消费者（避免空开关）。PCVM/Test 因此从 observing 升为 participates（仅加 opt-in wiring，不改方法包本体）。具体注入点
   （PCVM/Test 在何处发起 Agent run）由 AP-0 核实、AP-7 落地。

### 默认与开关（交付物 3，Design 推荐）

- **PCV observe-only = 默认**（推荐）：默认 `groundingEnforcement='off'`，主循环不被 grounding 分类影响。
- **grounding guard = 必须显式开启**（推荐，PD7 粒度）：全局默认 `off`，PCVM/Test/质量强约束运行按**单次运行（per-run）**覆盖为 `'guard'`。
- **provider tool-choice 正确性 = 默认保留**（推荐，见 PD1）：DeepSeek V4 处理不随 grounding 开关关闭，避免工具选择回归。
- 命名硬约束：阻断/注入类逻辑命名进 `*Guard`/`*Policy`，**不得**带 `Pcv*` 证据前缀，避免审计与 enforcement 概念再次混淆。

## Code Facts

- Confirmed entrypoints / call chain：
  - 证据始终开启、无 flag：`createPcvNodeEvidence` 在 LoopContext.ts:206 无条件构造；记录点 AgentRuntime.ts:930/1033/1358/1452、insightGate.ts:807。
  - 四个控制点（均无 config 守护，仅 DeepSeek-V4+analyze 模型/阶段守护）：
    1. grounding-policy prompt 注入：LLMInputAssembly.ts:523-534 + :440-442（analyze stage always-on，静态文本，按 modelRef/refCount 参数化）。
    2. DeepSeek V4 toolChoice 改写：AgentRuntime.ts:884-905（none→auto、schema 可见），helper :2207-2241。
    3. 工具调用抑制 DeepSeek V4 例外：AgentRuntime.ts:1129-1151（读 `groundingBurn.deepseekV4ToolChoiceMode`）。
    4. analyze 阻断 + nudge + rollback：AgentRuntime.ts:1576-1605，gate :1707-1732（读 `burn.classification==='invalid-no-evidence'`）。
  - grounding 分类：PcvNodeEvidence.ts:47-54（7 值），`classifyGroundingEntry` :1363-1396；`getLatestPcvBurnGrounding` :482-486。
  - provider mode 计算落在证据文件：`buildDeepSeekV4ToolChoiceMode` PcvNodeEvidence.ts:1350-1361（应迁出）。
  - 跨仓消费（仅证据，无 enforcement 依赖）：Alembic主体 `lib/workflows/ai-execution/PcvNodeEvidence.ts`（buildPcvAnalyzeGroundingLedgerSummary / N9 / N12，经 BootstrapConsumers 调用）；PCVM（artifact workspace，canonical 源在 progressive-chain-validation/）；Test progressive-chain-validation（节点级 verdict）。
  - AlembicAgent 边界：standalone 仓，依赖 `@alembic/core`（file:../AlembicCore），仅经包入口 import，有 `lint:core-import-boundary`；build/lint/test/typecheck 齐备（AGENTS.md）。
- Confirmed tests/builds：AlembicAgent `npm run build|lint|test|typecheck`（+ core-import-boundary lint）。
- Missing code facts（建议 Wakeflow 在 AP-0 核实）：
  - insightGate quality gate 的 action（retry/degrade/analysis_retry）是否在某些 pipeline 间接依赖 grounding classification（初判独立，需 AP-0 确认彻底解耦）。
  - 主体 `buildPcvAnalyzeGroundingLedgerSummary` 实际聚合了哪些 grounding 字段（确认「保留 classification 字段」即满足契约、无需主体改动）。
  - `groundingEnforcement` 配置应挂在哪层（LoopContextConfig / RuntimeConfig），与现有配置注入路径对齐，并支持 per-run 覆盖。
  - PCVM/Test 质量运行**实际在哪里发起 Agent run**（确定 per-run `groundingEnforcement='guard'` 的 opt-in 注入点，供 AP-7 wiring）。

## Phase Candidates

迁移方案（交付物 4）。Phases 为 Wakeflow 评审候选，非 task package。先建表征测试→抽取（行为对等）→切默认→纯化→验收，遵守「先替代对等、不裸断」。

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| AP-0 | 盘点 + 锁定基线：对四控制点写**表征测试**（capture 现行 DeepSeek V4 / analyze 阻断 / 抑制 / 注入行为）；核实跨仓证据消费字段；定位 config 挂载层 | 上游=本设计；下游=AP-1/2 | 现行行为有确定性测试覆盖；证据契约字段清单确定 |
| AP-1 | 抽取 `ProviderToolChoicePolicy`：迁出 DeepSeek V4 逻辑 + mode 计算，去除 PCV 读写往返；**行为对等、默认仍生效** | 上游=AP-0 | DeepSeek V4 表征测试全绿；PCV 仅观察 toolChoice |
| AP-2 | 抽取 `AnalyzeGroundingGuard`：迁入 analyze 阻断/nudge/rollback + grounding-policy **指令文本**注入（**不含证据 ref 列表注入，保留默认**）；**行为对等、暂仍开启** | 上游=AP-1 | analyze 表征测试全绿；逻辑集中在 guard、命名去 Pcv 前缀；ref 列表仍默认注入 |
| AP-3 | 引入 `groundingEnforcement` 配置默认 `off`：guard + grounding 注入仅 `guard` 时生效；provider policy 不受开关影响 | 上游=AP-2 | 默认模式对照测试：主循环行为 == 无 PCV 控制；guard 模式恢复阻断 |
| AP-4 | 证据层纯化收口 + 增量标记：确认 PcvNodeEvidence 纯观察、classification 仅审计；**additive 产出 enforcement-mode 标记**；关 PCV metadata 仅缺 trace 字段、主流程不变 | 上游=AP-3 | 关 metadata 对照测试通过；标记产出；无残留控流耦合 |
| AP-5 | AlembicAgent 五场景测试 + Agent 侧验收 | 上游=AP-4；下游=Test | observe-only/guard/DeepSeek V4/graceful exit/无证据 analyze 测试全绿 |
| AP-6 | **Alembic主体跨仓 consumer 更新**（消费 enforcement-mode 标记、grounding summary 改判审计语义）+ 跨仓证据回归 + PCVM/Test artifact 校验 | 上游=AP-4 标记/AP-5；下游=Test | 主体 observe-only 下不误判回归；N8/N9/N12 + linkage 两模式语义正确；跨仓回归全绿 |
| AP-7 | **PCVM/Test guard opt-in wiring**：质量运行 per-run 显式开 guard + grounding enforcement 回路端到端验证（避免空开关） | 上游=AP-3 配置/AP-5；下游=Test | 质量运行真实开启 guard 并恢复 grounding 约束；端到端回路通 |

执行序：AP-0 → AP-1 → AP-2 → AP-3 → AP-4 →（AP-5 ∥ AP-6 ∥ AP-7）。AP-1/AP-2 可并行抽取、须在 AP-3 切默认前完成；
**AP-4 是生产者/消费者分界**：跨仓消费者 AP-6 依赖 AP-4 的 enforcement-mode 标记先落地；AP-7 依赖 AP-3 的 per-run override 能力（先能力后接入，不裸断）。

## Validation Strategy

- Controller self-verification：AlembicAgent 单测/typecheck/lint（含 core-import-boundary）；表征测试与默认/guard 对照测试。
- Product repository verification：AlembicAgent 构建 + 测试；Alembic主体 ai-execution 证据消费单测回归。
- Test handoff required：yes（DeepSeek V4 真实模型行为、graceful exit、analyze 无证据真实文本场景需真实/接近真实运行）。
- Real scenario required because：DeepSeek V4 工具选择是 provider 真实行为，mock 难以证明不回归；observe-only 默认是否真的零副作用需真实循环对照。
- Success means：默认模式主循环行为与「无 PCV 控制」等价（除 trace 字段）；guard 模式恢复 grounding 约束；DeepSeek V4 不回归；证据/质量门/sourceRef 可观测性不降。
- Failure means：默认模式仍有 PCV 副作用、或 guard off 后 DeepSeek V4 工具选择回归、或证据字段缺失/可观测性下降。
- This test cannot prove：不能证明 grounding guard 的「质量提升」效果（那是 enforcement 启用后的独立评估，不属本边界需求）。

### 测试建议（交付物 7）

- observe-only 默认：跑标准 analyst 循环，断言 prompt 无 `evidenceGroundingPolicy`、toolChoice 未被改写、analyze 不被阻断、退出条件不读 grounding。
- guard-enabled：置 `groundingEnforcement='guard'`，构造 `invalid-no-evidence` burn，断言阻断 + nudge + rollback tick 发生。
- DeepSeek V4 特例：modelRef=deepseek-v4，analyze SCAN/EXPLORE + requestedToolChoice='none'，断言工具 schema 可见、effective toolChoice=auto（provider policy，不随 grounding 开关关闭）。
- graceful exit：`isGracefulExit` / `toolChoice='none'` 通用抑制仍生效；DeepSeek V4 例外仅由 provider policy 决定。
- analyze 无证据文本：默认模式不阻断（仅记录 `invalid-no-evidence` 审计标签）；guard 模式阻断。
- 跨仓证据回归：主体 `buildPcvAnalyzeGroundingLedgerSummary`/N9/N12 对 Agent 证据仍正常聚合；PCVM/Test artifact 不缺字段。

## TODO / Backlog Candidates

| ID | Type | Priority | Owner Candidate | Reason | Current Mainline Relation |
| --- | --- | --- | --- | --- | --- |
| alembic-agent-pcv-observe-only-boundary-2026-06-20 | requirement-candidate | P1 | Design→Wakeflow | PCV 默认 observe-only 边界收敛 + 模块拆分（跨仓 Agent+主体+PCVM/Test opt-in wiring） | independent（与 Plugin/Core 在途需求并行；主体侧仅 ai-execution 证据消费，与主体净化需求 alembic-main-capability-inventory-cleanup-2026-06-19 不冲突，控制器排程时留意触点） |

## Risks And Decisions

### 兼容性要求（交付物 5）

- **不删证据数据结构**：PcvNodeEvidenceSummary 及全部字段保留（schemaVersion 不降）。
- **保留 classification 字段**：即使默认不据此控流，`classification`/`deepseekV4ToolChoiceMode` 仍作为审计/聚合字段产出，保住主体/PCVM 消费契约。
- **保留 quality gate metadata / sourceRef diagnostics / missing-link**：仅语义降为审计材料，不作阶段推进成功指标。
- **不动 Wakeflow/Test progressive-chain-validation 能力**：除非 Agent 端字段契约被迫变更（本设计建议不改名→不触发）。
- **DeepSeek V4 正确性保留**：provider policy 默认行为不回归。

### 风险（交付物 6）

- **R1 DeepSeek V4 工具选择回归**：若误把 provider policy 一并默认关闭 → DeepSeek V4 在 toolChoice='none' 下丢失工具可见性。缓解：`ProviderToolChoicePolicy` 独立于 grounding 开关、默认保留 + 专项 DeepSeek V4 测试（AP-1 表征锁定）。
- **R2 模型空泛分析 / 无证据推进**：guard 默认关闭后，弱约束运行可能产出无证据的 analyze 文本并推进。缓解：(a) PCV 仍记录 `invalid-no-evidence`，回归可观测；(b) 质量强约束场景（PCVM/Test）显式开 guard；(c) insightGate quality gate 作为**独立既有**底线仍在（retry/degrade，不在本次关闭范围）；(d) grounding-policy 注入文本本是软引导，关闭只去掉默认 token 占用。
- **R3 证据 schema 破坏致跨仓断链**：缓解：不改名/不删字段、仅 additive 加 enforcement-mode 标记 + AP-0 字段清单 + AP-6 主体消费回归。
- **R6 observe-only 下 grounding 分布漂移被主体误读（跨仓，PD4 重点）**：guard 默认关后，以前被阻断/重试的 burn（如 `invalid-no-evidence`）
  会流入 grounding ledger，主体 `buildPcvAnalyzeGroundingLedgerSummary` 若按旧「质量判定」语义聚合，会把正常 observe-only 运行误报为
  回归。缓解：AP-4 产出 enforcement-mode 标记 + AP-6 主体据标记改判审计语义（先生产者后消费者）；两模式对照断言。
- **R4 隐藏耦合（mode 写读往返）**：provider policy 现「写 PCV burn 再读回」；AP-1 需一次性切干净，避免半迁移下例外判定失效。
- **R5 配置层级错挂**：`groundingEnforcement` 若挂错层导致部分路径读不到 → 默认 off 不彻底。缓解：AP-0 定位现有 config 注入路径，单点挂载。

### 确认决策（用户已表达的目标，本设计据此成文）

- PCV 默认 observe-only；grounding enforcement 改为显式开启；enforcement 命名与 PCV 证据分离；不删证据/质量门/sourceRef；不立即重写整个 AgentRuntime 循环。

### Resolved Decisions（用户确认 2026-06-20）

- **PD1（关键）= 收敛为 `ProviderToolChoicePolicy`，默认保留**：DeepSeek V4 tool-choice 是 provider 正确性，独立于 grounding guard、默认不回归。
- **PD2 = grounding guard 默认关闭**：analyze 阻断 + nudge + grounding-policy 注入仅在显式 `groundingEnforcement='guard'` 时生效。
- **PD3 = insightGate quality gate 排除出本次关闭范围**：作为独立既有机制保留（含 retry/degrade 底线），仅保证结果记入 PCV 证据 + 命名与 grounding guard 区分。
- **PD4 = 预先纳入主体跨仓改造**：范围扩为 AlembicAgent + Alembic主体。Agent additive 产出 enforcement-mode 标记（AP-4），主体 ai-execution 消费方据此把 grounding summary 改判审计语义、observe-only 下不误判回归（AP-6）。PCVM/Test 见 PD6（升 participates 做 opt-in wiring）。
- **PD5 = 证据 ref 列表保留默认注入**：「多余」定义为 **grounding 强制/政策**——默认关闭政策文本 + nudge + 阻断，使 PCV 对 prompt **零强制**；但 analyze 的证据 ref 列表（deterministicEvidenceRefs / evidenceStarterRefs，LLMInputAssembly.ts:432-438）作为**有用的 grounding 上下文保留**默认注入，不归入 guard。即非「PCV 写入 prompt 的一切都关」。
- **PD6 = guard 真实消费者纳入**：PCVM/Test 质量运行显式开 guard，使 enforcement 回路有真实 opt-in 消费者（非空开关）；PCVM/Test 从 observing 升 participates（仅加 opt-in wiring，不改方法包本体）。AP-7 落地、AP-0 核实注入点。
- **PD7 = 开关粒度 = 全局默认 off + per-run/per-invocation 覆盖**：全局 observe-only，质量运行按单次运行覆盖开 guard。

### 非目标

- 不删除 PCV/PCVM evidence 数据结构。
- 不改 Wakeflow/Test progressive-chain-validation 方法包本体能力（PD6 的 opt-in wiring 仅传 guard 配置，不改方法包；除非接口边界被迫同步）。
- 不立即重写 AgentRuntime 全部循环（优先职责边界与可迁移设计）。
- 不关闭 insightGate quality gate（独立机制，见 PD3）。
- 不让 DeepSeek V4 provider 正确性回归。
- 不在本需求评估 grounding enforcement 的「质量提升」效果。

## Handoff Readiness

- Original plan confirmed：N/A（本设计承载）。
- Requirement design complete：是（含模块拆分、默认策略、迁移序、兼容性、风险、验收、测试）。
- Code facts sufficient：基本充分（四控制点 + 跨仓消费已核实到 file:line）；AP-0 待核 3 项 missing facts。
- Needs Wakeflow code research：AP-0 三项（insightGate 与 grounding 是否彻底解耦、主体聚合字段清单、config 挂载层）。
- User decisions：PD1–PD7 **已确认**（2026-06-20）。
- Ready for workspace handoff：**是**（决策已闭合、跨仓范围=Agent+主体+PCVM/Test）。下一步可出 design-handoff 交控制器 intake；AP-0 四项作为 intake 后首个证据步、不阻塞 handoff。
