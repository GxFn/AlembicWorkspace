# AlembicAgent PCV/PCVM 默认 observe-only 职责边界收敛 Workspace Handoff

Date: 2026-06-20
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-agent-pcv-observe-only-boundary-2026-06-20

## Summary

把 AlembicAgent 内的 **PCV 从「默认占用并控制正常 LLM 主循环」收敛为「默认 observe-only 旁路证据层」**：grounding enforcement
（analyze 阻断 + nudge + grounding-policy 指令注入）默认关闭、改名归位到独立 `AnalyzeGroundingGuard`（显式 `groundingEnforcement='guard'`
开启）；DeepSeek V4 tool-choice 作为 **provider 正确性**收敛到独立 `ProviderToolChoicePolicy`（默认保留、不回归）；`PcvNodeEvidence`
保留为纯观察。**跨仓需求（AlembicAgent + Alembic主体 + PCVM/Test）**。已 4 路只读代码勘探（四控制点 + 跨仓消费核实到 file:line）+
7 项用户确认。详见 requirement design。

## Handoff Type

requirement-candidate

## Confirmed User Goal（7 项已决，用户 2026-06-20）

1. **PD1 DeepSeek V4 = `ProviderToolChoicePolicy`、默认保留**（provider 正确性，独立于 grounding guard，不回归）。
2. **PD2 grounding guard 默认关闭**（analyze 阻断 + nudge + grounding-policy 指令注入仅在 `groundingEnforcement='guard'` 时生效）。
3. **PD3 insightGate quality gate 排除**（独立既有机制，含 retry/degrade 底线，本次不关闭，仅保证结果记入 PCV 证据 + 命名与 grounding guard 区分）。
4. **PD4 跨仓纳入主体**：Agent additive 产出 enforcement-mode 标记，主体 ai-execution 消费方据此把 grounding summary 改判审计语义、observe-only 下不误判回归。
5. **PD5 证据 ref 列表保留默认注入**：「多余」= grounding 强制/政策；ref 列表（deterministicEvidenceRefs/evidenceStarterRefs）作有用 grounding 上下文保留，不入 guard。
6. **PD6 guard 真实消费者纳入**：PCVM/Test 质量运行显式开 guard（避免空开关），二者从 observing 升 participates（仅加 opt-in wiring，不改方法包本体）。
7. **PD7 开关粒度 = 全局默认 off + per-run/per-invocation 覆盖**。

不变量：保持 daemon-removal 之外的 **纯观察证据层不删**；**不改四工具/LLM 循环对外业务语义**（仅改 grounding 控制的默认与归属）。

## Final Completion Definition

Wakeflow 仅在以下全部满足时可接受：

- **默认 observe-only**：默认下主循环行为（prompt/toolChoice/graceful-exit/阶段推进/成功条件）与「完全不读 PCV」一致——除少量 trace 字段外无可观测差异。
- **enforcement 显式化且改名归位**：grounding 阻断/nudge/政策注入收敛进默认关闭的 `AnalyzeGroundingGuard`，命名不带 `Pcv*` 前缀。
- **provider 与 grounding 解耦**：`ProviderToolChoicePolicy` 默认保留、DeepSeek V4 不回归。
- **证据契约不破 + 增量标记**：PcvNodeEvidenceSummary 及被主体/PCVM/Test 消费字段继续产出；additive 加 enforcement-mode 标记。
- **主体跨仓 consumer 对齐**：主体 ai-execution 在 observe-only 下语义正确、不误判回归。
- **guard 有真实消费者**：≥1 条质量运行链路（PCVM/Test）接通为显式开 guard，enforcement 回路端到端可用、非空开关。
- **测试覆盖五场景**：observe-only 默认、guard-enabled、DeepSeek V4、graceful exit、analyze 无证据；跨仓证据回归通过。
- **可观测性不降**：sourceRef diagnostics、quality gate metadata、missing-link diagnostics 仍可审计/测试读取。

## Current Design Status

- Requirement design status: complete（职责边界表 + 模块拆分 + 默认/粒度 + 迁移序 AP-0~7 + 兼容性 + 风险 + 验收/测试）。
- User confirmation status: confirmed（PD1–PD7 已决；无悬空决策）。
- Mainline relation status: `after-current`（独立需求，不打断当前主线；可与 Plugin/Core/主体净化并行）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载。
- Code fact status: 真实代码核实（4 路 Explore：四控制点 file:line + 跨仓消费 + AlembicAgent 仓边界）。
- Needs Wakeflow code research: **AP-0 四项**（见 Open Questions）——均为事实核实，不阻塞 handoff。
- Detached Design mode: no。

## Recommended Next Step

create controller state root or task package —— intake 后建状态根，按 AP-0~7 推进（AP-0 先做表征测试锁基线 + 四项事实核实）。跨仓覆盖 Agent + 主体 + PCVM/Test。

## Functional Loop Summary

- User scenario: 同一 Agent 循环默认 observe-only（PCV 只记录、不控流）；质量运行 per-run 开 guard 恢复 grounding 约束。
- Input/Output: 重构对象是 **grounding 控制的默认与归属 + host/provider 解耦**，不改四工具对外语义/业务行为。
- State change: 新建 `AnalyzeGroundingGuard`（默认关）+ `ProviderToolChoicePolicy`（保留）；PcvNodeEvidence 纯化；additive enforcement-mode 标记；主体消费改判审计语义；PCVM/Test per-run opt-in。
- Producer/Consumer: Agent 产出证据（含标记）→ 主体/PCVM/Test 消费；guard 由 PCVM/Test 质量运行 opt-in。
- Failure path: 默认 off 仍有 PCV 副作用、或 DeepSeek V4 回归、或证据字段缺失/误判，均为失败。
- User verification: claude-code 真实场景五场景对照 + 跨仓证据回归。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicAgent | participates（主） | 拆 `ProviderToolChoicePolicy` + `AnalyzeGroundingGuard`；PcvNodeEvidence 纯化；引 `groundingEnforcement`（全局 off + per-run 覆盖）；additive enforcement-mode 标记；五场景测试 | AP-0 事实核实 |
| Alembic主体 (Alembic) | participates | 更新 `lib/workflows/ai-execution` 消费：grounding summary 改判审计语义、消费 enforcement-mode 标记、observe-only 不误判；保 N8/N9/N12 + linkage 两模式语义 | 依赖 AP-4 标记（先生产后消费） |
| PCVM | participates | 质量运行 per-run 开 guard 的 opt-in wiring；继续消费证据 artifact；不改方法包本体 | 依赖 AP-3 配置；AP-0 注入点 |
| progressive-chain-validation / Test | participates | claude-code 真实场景验证两模式 + DeepSeek V4 + graceful exit + 无证据 analyze；质量运行 opt-in 开 guard | controller 启动 |
| AlembicCore | observing | 无 Core 改动（PCV 为 Agent 自有）；仅复核 import 边界绿 | — |
| Design | design-complete | — | — |
| Wakeflow | controller/runtime support | intake、状态根、phase 确认、派发、验收 | — |

## Evidence And Links

- Requirement design（职责边界表 / 模块拆分 / 默认与粒度 / 迁移序 AP-0~7 / 兼容性 / 风险 / 验收测试 / PD1~7）：
  [requirement design](alembic-agent-pcv-observe-only-boundary-2026-06-20.md)
- Code research（四控制点 file:line）：
  - grounding-policy 指令注入 LLMInputAssembly.ts:440-442 / buildAnalyzeGroundingPolicy :523-534（analyze always-on）。
  - DeepSeek V4 toolChoice 改写 AgentRuntime.ts:884-905（helper :2207-2241）；mode 计算 PcvNodeEvidence.ts:1350-1361（应迁出）。
  - 工具抑制 DeepSeek V4 例外 AgentRuntime.ts:1129-1151（读 `deepseekV4ToolChoiceMode`）。
  - analyze 阻断+nudge+rollback AgentRuntime.ts:1576-1605（gate :1707-1732，读 `classification==='invalid-no-evidence'`）。
  - 证据始终开启无 flag：createPcvNodeEvidence LoopContext.ts:206；记录点 AgentRuntime.ts:930/1033/1358/1452 + insightGate.ts:807。
  - 跨仓消费（仅证据、无 enforcement 依赖）：主体 `lib/workflows/ai-execution/PcvNodeEvidence.ts`（buildPcvAnalyzeGroundingLedgerSummary/N9/N12）；PCVM；Test progressive-chain-validation。
- Related: 与 Plugin 双宿主 `alembic-plugin-dual-host-architecture-refactor-2026-06-19`、主体净化 `alembic-main-capability-inventory-cleanup-2026-06-19`、Core 优化 `alembic-core-capability-inventory-optimization-2026-06-19` 同为在途，独立仓可并行；主体侧仅 ai-execution，与主体净化无冲突但控制器排程留意触点。

## Risks

- **R1 DeepSeek V4 工具选择回归**：误把 provider policy 一并默认关 → DeepSeek V4 在 toolChoice='none' 丢失工具可见性。缓解：`ProviderToolChoicePolicy` 独立默认保留 + 专项测试（AP-1 表征锁定）。
- **R2 模型空泛分析/无证据推进**：guard 默认关后弱约束运行可能无证据推进。缓解：PCV 仍记 `invalid-no-evidence`（可观测）+ PCVM/Test opt-in 开 guard + insightGate 底线仍在 + 政策注入本是软引导。
- **R3 证据 schema 破坏致跨仓断链**：缓解：不改名/不删字段、仅 additive 加标记 + AP-0 字段清单 + AP-6 主体回归。
- **R6 observe-only 下 grounding 分布漂移被主体误读（跨仓重点）**：guard 默认关后 `invalid-no-evidence` 增多流入 ledger，主体按旧「质量判定」聚合会误报回归。缓解：AP-4 产标记 + AP-6 据标记改判审计语义（先生产后消费）+ 两模式对照断言。
- **R4 隐藏耦合（mode 写读往返）**：provider policy 现「写 PCV burn 再读回」；AP-1 须一次性切干净。
- **R5 配置层级错挂**：`groundingEnforcement` 挂错层致默认 off 不彻底 / per-run 覆盖失效。缓解：AP-0 定位注入路径、单点挂载 + 支持 per-run。

## Non-Goals And Forbidden Shortcuts

- 不删除 PCV/PCVM evidence 数据结构。
- 不改 progressive-chain-validation 方法包本体能力（PD6 opt-in wiring 仅传 guard 配置）。
- 不立即重写 AgentRuntime 全部循环（优先职责边界与可迁移设计）。
- 不关闭 insightGate quality gate（独立机制，PD3）。
- 不让 DeepSeek V4 provider 正确性回归。
- 不改四工具/LLM 循环对外业务语义。
- 不在本需求评估 grounding enforcement 的「质量提升」效果。

## Phase Candidates

Phases 为候选，非 task package。先表征测试→抽取（行为对等）→切默认→纯化+标记→（测试 ∥ 跨仓 ∥ opt-in）。

| Phase | Goal | 说明 |
| --- | --- | --- |
| AP-0 | 盘点 + 锁定基线：四控制点表征测试 + 四项事实核实 + 定 config 层（须支持 per-run） | 硬前置 |
| AP-1 | 抽 `ProviderToolChoicePolicy`：迁出 DeepSeek V4 逻辑 + mode 计算，去 PCV 读写往返；行为对等、默认仍生效 | — |
| AP-2 | 抽 `AnalyzeGroundingGuard`：迁入阻断/nudge/rollback + 政策**指令文本**注入（不含 ref 列表）；行为对等、暂仍开 | — |
| AP-3 | 引 `groundingEnforcement`（全局默认 off + per-run 覆盖）：guard + 政策注入仅 guard 时生效；provider policy 不受控 | 切默认 |
| AP-4 | 证据纯化 + additive 产出 enforcement-mode 标记；关 metadata 仅缺 trace 字段、主流程不变 | 生产者/消费者分界 |
| AP-5 | AlembicAgent 五场景测试 + Agent 侧验收 | — |
| AP-6 | Alembic主体跨仓 consumer 更新（消费标记、grounding summary 改判审计语义）+ 跨仓回归 | 依赖 AP-4 标记 |
| AP-7 | PCVM/Test guard opt-in wiring（per-run 开 guard）+ enforcement 回路端到端验证 | 依赖 AP-3 per-run |

执行序：AP-0 → AP-1 → AP-2 → AP-3 → AP-4 →（AP-5 ∥ AP-6 ∥ AP-7）。AP-1/AP-2 须在 AP-3 前完成；AP-6 依赖 AP-4 标记、AP-7 依赖 AP-3 per-run（先能力后接入，不裸断）。

## Open Questions For Wakeflow

AP-0 四项事实核实（不阻塞 intake，作 intake 后首证据步）：
1. insightGate quality gate 的 action（retry/degrade/analysis_retry）是否在某 pipeline 间接依赖 grounding classification（初判独立，须确认彻底解耦）。**若发现依赖 → 「关 grounding + 保留 quality gate」冲突，须带证据回用户决策（唯一或有决策）。**
2. 主体 `buildPcvAnalyzeGroundingLedgerSummary` 实际聚合哪些 grounding 字段（确认保留 classification 字段即满足契约）。
3. `groundingEnforcement` 配置挂哪层（LoopContextConfig / RuntimeConfig），与现有注入路径对齐并支持 per-run 覆盖。
4. PCVM/Test 质量运行**实际在哪里发起 Agent run**（定 per-run guard opt-in 注入点，供 AP-7 wiring）。

（用户决策项 PD1–PD7 已全部闭合；除上述「或有决策」外无阻塞性 open question。）

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates listed in Evidence And Links: 无新独立 TODO；悬挂 bug alembic_project_matrix 已另立后台任务、不阻塞。
- 删除 / 降级 / 边界变更 / 跨仓 标记确认：是——grounding enforcement 默认关闭（行为变更，PD2）、provider 解耦保留（PD1）、跨仓纳入主体 + PCVM/Test（PD4/PD6）、additive 标记（PD4）、ref 列表保留（PD5）、per-run 粒度（PD7），**均经用户 PD1–PD7 确认**；非删证据/不改对外语义/不关 quality gate 明列非目标。
