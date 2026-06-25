# AlembicPlugin Recipe 生成体系系统化重构 Workspace Handoff

Date: 2026-06-21
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-recipe-evolution-optimization-2026-06-21

## Summary

把"项目信息 / 设计模式 / 架构约定 → 系统化转换成 Recipe"做成一个以 **ProjectContext 为源、Plan 为脊（心脏）、Recipe 为产物**的子系统。
新增全局 `alembic_plan` MCP 工具承载规划层（intent 持久 + generation-state 从 DB 投影的 living ledger），Plan 不猜逻辑——收集真实信息交内置 Agent 角色决策；
Plan 驱动三段（冷启动/深挖/单模块挖掘）；创建期全程锚 ProjectContext MCP；git 提交驱动的统一进化（新增+保鲜+维护一条管道）；向量能力隔离 + 标准可用性接口；green-field 整合到 `lib/recipe-generation/`。
**跨仓需求（AlembicPlugin 主 + AlembicCore 份量大）**；**Plugin 完成后作为 Alembic 主体的后续新需求**。已多轮 Workflow/Explore grounded 到 file:line + 坑级缓解 + BiliDili 真实测试模式验收。详见 requirement design。

## Handoff Type

requirement-candidate（大型、跨仓、跨波）

## Confirmed Goal（用户 2026-06-21 全部确认）

核心目标 + 系统化要求 + 全部决策已闭合：
- **核心目标**：项目信息/设计模式/架构约定 → 系统化转 Recipe。
- **三段定位模型（PD-B）**：冷启动=初始全量基线 / 增量扫描(rescan)=冷启动之后的深度挖掘 / 进化=常驻(持续)修复。
- **PD-A** 提交触发=HEAD-compare on tool-call（非常驻、不装 hook）；**PD-C** Plugin+Core 跨仓；**PD-D** per-recipe 即时增量。
- **Q1** 统一进化（去单独包/推荐路径）；**Q2** 混合规划（Plugin 收集真实信息+SOP+领域 → 内置 Agent 决策）；**Q3** green-field 全量整合+分阶段迁移。
- **Plan 中心化**：Plan = code↔Recipe 持久桥梁/账本；intent 持久（新 `plans` 表）、generation-state 从 DB 投影（不双写）。
- **不猜原则**：Plan 不启发式臆测；收集真实信息（含动态信号）+ 内置 SOP + 领域 → Agent 决策；理解能力缺则补齐建设。
- **Panorama 退场**：编排层退场，RoleRefiner/CouplingAnalyzer 等有价值分析**重建为独立项目信息补充能力**（建在 ProjectContext 侧、消费共享图），与退场/CKG1 合并执行。
- **⑦** 新模块 Recipe 推荐（既荐已有也荐新建）；**⑧** 新文件夹/模块单独区域扫描。
- **测试模式 + BiliDili 真实验收**（用户追加）：scoped 子集维度+小规模、不全量冷启动。
- 不变量：保持 daemon-removal 纯 MCP 非常驻；不改四工具对外 MCP 业务语义；不删证据/提案/向量结构。

## Final Completion Definition

DH/RG-10 验收（见 requirement design「Final Completion Definition」+「测试模式与真实验收」）：规划层可用且产真实信号驱动 Plan；Plan 驱动三段 + 硬前置门禁；创建期锚 ProjectContext；统一进化覆盖新增/保鲜/维护；时机修复（create/evolve 即时）；向量隔离+可用性可观测；green-field 整合内聚、旧路径清空；主体可移植；跨仓回归绿；**BiliDili 测试模式 4 步链全绿**。

## Current Design Status

- Requirement design status: complete（6 宏观阶段 A–F / RG-0~10 全 grounded 到 file:line + 坑级缓解 + 测试模式验收）。
- User confirmation status: confirmed（核心目标 + PD-A~D + Q1~Q3 + 三段模型 + Plan 中心化/权威 + 不猜原则 + Panorama 处理 + ⑦⑧ + 测试模式/BiliDili 全部确认）。
- Mainline relation status: `next-mainline` / **独立自动化推进**（用户 2026-06-21：其他需求已归档或停止，本需求**独立进行**、确认进入**持续自动化推进 / unattended**；无在途波次竞争）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载。
- Code fact status: 真实代码核实（多轮 Workflow/Explore：理解能力审计 4 路、Panorama↔ProjectContext、Plan 权威边界、B 抽取、C 交互、D 编排、E 提交分类、F 迁移切片序）。
- Needs Wakeflow code research: 各 RG 实现期事实（已在 Code Facts/各细化标注），不阻塞 intake。
- Detached Design mode: no。

## Recommended Next Step

create controller state root + 确认进入**持续自动化推进(unattended)**，按 RG-0~10 推进（green-field migrate-early），直到最终完成 / 硬门 / 无 eligible / 缺证据需人工 / 用户停。本需求**独立**（其他需求已归档/停止，无在途波次竞争）；**B 阶段直接承接 Panorama 有价值分析的独立重建（= Panorama 退场做对的方式），归本需求、不需与他波合并**。

## Functional Loop Summary

- User scenario: 真实项目（如 BiliDili）init→规划→生成 Recipe；后续 git 提交→进化自动维护；任意时刻 Plan 反映 code↔Recipe 计划与覆盖。
- Input/Output: 源=ProjectContext + 独立补充能力；产物=Recipe + Plan(intent)；不改四工具对外语义。
- State change: 新 `alembic_plan`(第 19 工具) + `plans` 表(intent)；Core 理解能力补齐（域信号/架构/复杂度/重建分析/规划 aids/动态聚合）；create/evolve 即时 source_refs+向量；统一进化写 DB→Plan 投影；代码迁入 `lib/recipe-generation/`。
- Producer/Consumer: Plugin 运行时 + 内置 Agent 角色（宿主）；Core 提供理解能力/向量/提案/修复机制；prime/search 消费。
- Failure path: 保持非强进程；测试模式不绕 grounding；commit 非祖先→rescan catch-up；向量不可用→可观测降级。
- User verification: BiliDili 测试模式 4 步链（规划真实性/scoped 生成/提交驱动进化/降级可观测）。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates（主） | green-field `lib/recipe-generation/`（migrate-early 8 切片）；`alembic_plan` 工具；Plan 驱动三段+测试模式；创建期 ProjectContext 引导；提交检测+统一进化+新模块保鲜；向量消费者改用 isAvailable | @alembic/core（理解能力/向量/提案/修复） |
| AlembicCore | **participates（份量大）** | 理解能力补齐（DomainSignal/ArchStyle/Complexity/重建 RoleRefiner·CouplingAnalyzer·LayerInferrer·DimensionAnalyzer·CallFlowAgg 为独立能力 / 改造 resolveActiveDimensions / 规划 aids / DynamicSignalGateway / ModuleDelta+per-module 覆盖）；向量 isAvailable；`plans` 表+投影查询；per-recipe 增量 reconcile | 本需求独立承接（其他需求已归档/停止，无在途竞争） |
| Alembic 主体 | **follow-on（本需求非范围）** | Plugin 完成后复用 Core 理解能力/进化/向量接口的同类建设（设计已保持 host-agnostic 可移植） | Trigger=本 Plugin 需求完成 |
| AlembicDashboard | observing | 无需改动；可后续消费 Plan/proposal/可用性 | — |
| Design | design-complete | — | — |
| Test | participates | **BiliDili 真实项目测试模式验收**（4 步链）+ 跨仓回归 | controller 启动；真实 git/Ollama |
| Wakeflow | controller/runtime support | intake、状态根、**跨波协调排序**、phase 确认、派发、验收 | 本设计 |

## Evidence And Links

- Requirement design（核心目标 / 系统脊柱 / Plan 中心定位+权威 / 关键背景结论 / 理解能力审计+补齐清单 / Proposed Behavior（规划层/三段/创建锚/统一进化/向量/green-field + B/C/D/E/F 细化）/ alembic_plan 工具规格 / Code Facts / RG-0~10 / 测试模式与真实验收 / Risks R1-R13）：
  [requirement design](alembic-recipe-evolution-optimization-2026-06-21.md)
- Code research（已核实 file:line，载于 requirement design 各 Code Facts/细化节）：cold-start/rescan/dimension-completion/GitDiffScanner/PluginOpportunisticEvolution/SourceRefReconciler/EvolutionGateway/DecayDetector/VectorService/DimensionRegistry/MissionBriefingBuilder/OnboardingContract/recipe_source_refs/evolution_proposals/lifecycle_transition_events/plans(新)。
- Related（跨波）：在途 Core 优化 `alembic-core-capability-inventory-optimization-2026-06-19`；Panorama 退场 + project-intelligence 重整（AlembicCore `docs/layer-contract.md` known-debt，CKG1 区）；daemon-removal `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`（本需求基于其终态）。
- 验收对象：`BiliDili`（真实 Swift app）。

## Risks

- **R1 范围大**（规划层+三段+引导+统一进化+向量隔离+green-field 全量迁移）；**R10 Core 份量大幅上升**（理解能力补齐多在 Core）。缓解：分阶段每步绿、additive、跨波协调。
- **R11 不补齐则退回猜**：B（Core 理解能力）是 C（alembic_plan）真实前提，不可只做工具壳。
- **R12 Panorama 有价值分析的重建归本需求（独立，无竞争）**：其他需求已归档/停止，本需求独立；B 阶段直接把 RoleRefiner/CouplingAnalyzer 等重建为独立能力（= Panorama 退场做对的方式），**无在途波次竞争、无重复迁移风险**；底层 phase runners(code_entities/knowledge_edges) 留存复用。
- **R13 D/E 边界情况密集（已设计缓解）**：实现期硬点 = rename 自动修复阈值(默认 90%)、rescan/module-mining lease+rescanId 幂等、commit base 非祖先 `git merge-base`+rescan catch-up、Plan `projectContextSignature` 失效比对、巨型提交 scale guard。
- 其余 R2-R9（DeepSeek 无关；含 rename 检测 -M/-C、跨模块移动 re-bind、删除 deprecate、green-field 别名/层门禁、Plan 失效、并发 lease 等），详见 requirement design Risks。
- **不变量**：保持 daemon-removal 纯 MCP 非常驻；不改四工具对外语义；不删证据/提案/向量结构。

## Non-Goals And Forbidden Shortcuts

- 不重建 daemon/常驻 watcher；不改四工具对外 MCP 业务语义。
- 主体侧落地不在本需求（follow-on）。
- 不删现有证据/提案/向量数据结构；Plan 不双写（generation-state 投影）。
- 测试模式不绕 grounding/不猜；不在本需求做大规模全量质量评估（属全量 cold-start 后续）；codex 宿主真实性不在本需求（claude-code 内验）。

## Phase Candidates

6 宏观阶段 / RG-0~10（候选，非 task package）。green-field migrate-early（紧接 RG-0 按 8 切片迁、各阶段在新位置建）。

| 宏观 | Phase | Goal |
| --- | --- | --- |
| A 地基 | RG-0 | green-field 骨架+别名+8 切片迁移序（migrate-early）+ 跨波协调 + 表征测试 |
| B 理解能力（Core） | RG-1 | architecture-intelligence（域信号/架构/复杂度/重建 Panorama 有价值分析为独立能力） |
| | RG-2 | 改造 resolveActiveDimensions（域信号驱动）+ 规划 aids + DynamicSignalGateway |
| C Plan 中枢 | RG-3 | `plans` 表(intent) + `alembic_plan` 工具（draft 收集→Agent 决策→confirm；state 投影；三段硬前置） |
| D Plan 驱动生成 | RG-4 | Plan 驱动三段编排 + 新模块检测 + **测试模式** |
| | RG-5 | 创建期锚 ProjectContext（注入 briefing+nextActions+grounding） |
| E 保鲜/进化 | RG-6 | 向量能力隔离 + isAvailable（跨仓） |
| | RG-7 | 时机修复（create/evolve 即时 source_refs+向量） |
| | RG-8 | 提交驱动 + 统一进化（HEAD-compare+-M/-C+分类决策树+统一新增/保鲜/维护） |
| F 收口 | RG-9 | green-field 收尾（删旧路径+最终核验；迁移主体已早做） |
| | RG-10 | 测试 + 跨仓回归 + **BiliDili 测试模式验收** |

执行序：A → B → C → D → E → F；**B 是 C 真实前提、C 是 D 硬前置**；RG-6 可与 D 并行。

## Open Questions For Wakeflow

1. **独立自动化推进（用户 2026-06-21）**：其他需求已归档或停止，本需求**独立进行 + 持续自动化推进(unattended)**。无在途波次竞争；**B 阶段直接承接 Panorama 有价值分析的独立重建（= Panorama 退场做对的方式），归本需求、无需与他波合并**。
2. **Core 投入确认**：本需求 Core 份量大（远超"Plugin 加工具"）；确认 Core 窗口承接节奏。
3. 实现期硬点（R13）非阻塞 intake，但 task package 须坐实（阈值/lease/merge-base/signature/scale guard）。
（用户决策项全部闭合；无阻塞性 open question。）

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates: 主体 follow-on（`alembic-main-recipe-generation-followon`，trigger=本需求完成、现不 intake）已记于 requirement design；无新独立 TODO。
- 删除/降级/边界变更/跨仓 标记确认：是——新增 alembic_plan/plans 表、Core 理解能力补齐、Panorama 编排退场+重建独立能力、green-field 迁移、bootstrap 硬前置(可见行为变更)、统一进化、向量隔离、测试模式/BiliDili 验收，**均经用户确认**；非强进程不变量/不改四工具语义/不删数据结构/Plan 不双写 明列非目标。
