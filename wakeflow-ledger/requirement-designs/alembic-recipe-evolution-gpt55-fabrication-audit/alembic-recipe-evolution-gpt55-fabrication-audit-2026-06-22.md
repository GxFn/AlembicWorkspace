# Alembic Recipe Evolution GPT-5.5 需求篡改与虚假实现审计 Requirement Design

Date: 2026-06-22
Status: pending-formal-wakeflow-intake
Owner Window: AlembicWorkspace
Demand Key: `alembic-recipe-evolution-gpt55-fabrication-audit-2026-06-22`
Target State Root: `.wakeflow-active/current/alembic-recipe-evolution-gpt55-fabrication-audit-2026-06-22`

## State Root Gate

本需求已被用户明确要求新建并写完整，但 Wakeflow 正式 `init` 被当前未归档 planned root 阻塞：

- blocking root: `.wakeflow-active/current/alembic-plan-authoritative-complete-plan-repair-2026-06-22`
- blocking reason: machine state is still `planned`; user marked this demand no longer used on 2026-06-22
- blocking package: `p1-core-complete-plan-intent-repair-p1`
- dispatch count: 0
- current tool gap: Wakeflow MCP 当前没有安全的 `cancel/remove pending task package` 或 `cancel demand` 工具

因此本文档是完整需求定义与后续正式 intake 的权威草案；它不是 active state root、不是已派发任务、不是验收结论。正式 Wakeflow state root 只能在阻塞 root 通过状态机取消、完成归档、或插件补齐取消工具之后创建。该 blocking root 本身已由用户标记为不再使用，禁止派发、领取、修复或当作需求依据。禁止手工改写 `wakeflow-state.json` 来伪造清理。

## User Goal

针对 `alembic-recipe-evolution-optimization-2026-06-21`，建立一个独立审计需求，逐条核对：

1. 原始 Design handoff 和 requirement design 的每一条真实需求。
2. 该需求执行期间新增或修改的全部真实代码、测试、文档、状态根证据、target result、controller review、Test 证据。
3. GPT-5.5 / 控制器在解释、派发、验收、修复需求或回填中自行捏造、篡改、过度推断、把推论当原文、把代码实现便利当需求、或把测试/推荐/selected/top 等实现概念误升格为需求权威的信息。
4. 所有因这些虚假需求而进入实现、测试、验收或后续修复任务的代码与证据。

最终输出必须列出全部虚假需求/篡改需求/过度推断需求，并给出证据、影响范围和处理建议。

## Problem Statement

在 `alembic-recipe-evolution-optimization-2026-06-21` 完成后，用户指出 Plan 验证存在核心问题：Plan 原始需求是完整权威计划，用于后续冷启动、深挖、模块挖掘和进化维护；但实现和控制器解释中出现了将 `recommendedDimensions`、`selectedDimensions`、top/ranked 结果、测试模式子集等概念误当成 Plan 语义的倾向。

随后控制器又在新建修复需求时，把“推荐/top 的位置”写成类似原始需求规定。用户指出这是篡改需求。控制器复核后确认：

- 原始需求没有直接规定 `recommendedDimensions/top` 的位置。
- “推荐/top 不能替代 Plan intent”是从 Plan 权威语义推出的控制器判断，不是原文。
- 控制器曾错误地把推论写得像原始需求事实。

因此不能直接继续修代码。必须先做一次完整需求审计，划清原文事实、控制器推论、真实代码、虚假需求和应撤销内容。

## Authority Hierarchy

审计必须按以下权威顺序判断，低层不能覆盖高层：

1. 用户本轮明确要求：审计并列出所有 GPT-5.5 / 控制器捏造篡改的虚假需求。
2. 原始 Design handoff：`Design/docs/current/alembic-recipe-evolution-optimization-workspace-handoff-2026-06-21.md`
3. 原始 requirement design：`Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`
4. 用户在执行期间的明确补充、停止、纠错和状态要求。
5. Wakeflow archived state root raw evidence：`wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/`
6. Product repository source code, tests, commit diffs, build outputs.
7. Controller interpretation. Controller interpretation is never original requirement authority.
8. Target backfill. Target backfill is evidence, never acceptance.

任何审计结论必须标注它属于以下哪一类：

- `original-requirement-fact`
- `user-correction`
- `controller-inference`
- `implementation-detail`
- `target-claim`
- `test-evidence`
- `fabricated-requirement`
- `overreach`
- `ambiguous-needs-user-confirmation`

## Non-Negotiable Audit Rule

不能再出现“把推论写成需求”的错误。每一条结论必须同时给出：

- 原始需求行号或明确说明“原文无此要求”
- 对应代码/测试/状态证据路径
- 判断类型
- 为什么符合或不符合
- 是否需要撤销、降级为实现细节、保留、或回到用户确认

没有原文依据和代码证据的内容只能列为待查，不能写成结论。

## Original Requirement Fact Index

本节是审计必须逐条覆盖的原始需求事实索引。行号以后续审计实际 `nl -ba` 输出为准；以下是初始行段定位。

### R0 Confirmed Goal And Spine

Source: `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`

- 核心目标：项目信息、设计模式、架构约定系统化转换为 Recipe。
- 系统脊柱：ProjectContext + 独立项目信息补充能力 → 规划 Agent → 全局 Plan → 三段生成 → 创建期 ProjectContext 锚 → 统一进化 → 向量隔离 → green-field 子系统。
- Plugin 先做，主体 follow-on 不是本需求范围。

Audit checks:

- 是否有实现把目标缩成某个局部工具输出、推荐列表、测试模式或单一 top 选择。
- 是否有实现绕开 ProjectContext → Agent Plan → Recipe 的主链。
- 是否有 Controller 将主体 follow-on、测试范围、推荐路径等扩成当前需求。

### R1 Plan Centrality

Source lines to audit: requirement design around `Plan 的中心定位`.

Original facts:

- Plan = 真实代码 ↔ Recipe 的持久化桥梁 / living ledger。
- Plan 管理真实代码到 Recipe 的抽象，是体系心脏。
- Plan 不自己猜逻辑：收集真实信息交内置 Agent 决策。
- Plan 收集真实项目信息、动态信号、内置 SOP、领域信息。
- Agent 决定哪些领域、多大规模、执行哪些进化/分析 MCP 工具。
- Plan intent = 维度排序 + 规模/预算 + 模块绑定 + 各阶段目标。
- generation-state 从 DB 投影，不双写。
- Plan 生命周期持续，init 制定完整生成计划，三段生成写回补齐状态，代码变更进化更新映射。
- confirmed Plan 是三段硬前置。

Audit checks:

- 任何把 Plan 实现成单次分析 note、推荐列表、测试选择、top-N、局部 gate 输入的代码都必须标记。
- 任何双写 generation-state 到 Plan intent 的代码必须标记。
- 任何没有 confirmed Plan 仍允许三段生成的路径必须标记。
- 任何让 Plugin 启发式替代 Agent 决策的路径必须标记。

### R2 Planning Tool `alembic_plan`

Source lines to audit: requirement design `alembic_plan 工具规格`.

Original facts:

- `alembic_plan` 是第 19 个 MCP 工具。
- operations = `draft / confirm / get`。
- `draft`: Plugin 收集真实信息 + planningBrief 交 Agent；存 pending。
- `confirm`: Agent 据真实信息决定领域、规模、执行哪些 MCP 工具和顺序；存 active confirmed。
- `get`: 返回当前 active Plan。
- confirm 输入包含 `plan` 载荷、`basePlanId/version`、可选 rationale。
- 输出 Plan 结构包含 intent 与 projected state。
- intent 持久于 `plans` 表。
- state 从 DB 投影。

Audit checks:

- `draft` 是否自己做了最终权威决策。
- `confirm` 是否没有完整 plan 载荷却用实现字段补全成权威 Plan。
- `get` 是否返回了被执行选择污染的 Plan。
- MCP schema 是否把 `selectedDimensions` 说明成跳过/缩小 Plan，而原文没有明确授权。

### R3 Understanding Capability Prerequisite

Source lines to audit: requirement design `理解能力审计`.

Original facts:

- B 阶段是 C 阶段真实前提。
- Core 需要补齐 DomainSignalDetector、ArchitectureStyleClassifier、ComplexityAnalyzer、RoleRefiner、CouplingAnalyzer、LayerInferrer、DimensionAnalyzer、CallFlowAgg、规划 aids、DynamicSignalGateway、ModuleDelta/per-module 覆盖。
- 不补齐则退回猜，违背 Plan 不猜原则。
- Panorama 编排退场，但有价值分析重建为独立项目信息补充能力。

Audit checks:

- 代码是否真的补齐了这些能力，还是只做了外壳/启发式。
- 是否把 language/framework 简单选择包装成“真实 Agent 决策”。
- 是否把 top/hotspot 排名当作完整理解。
- 是否绕过 B 阶段直接进入 C/D。

### R4 Plan-Driven Three Stages

Original facts:

- coldStart = 初始全量基线，按 Plan 广度。
- deepMining/rescan = 冷启动之后深化，按 Plan 深化。
- moduleMining = scoped 区域扫描，按 Plan moduleBindings。
- 三段 = 读 Plan 意图 → 生成 Recipe → 写回补齐状态。
- Plan 失效需 projectContextSignature 比对。
- full-reset 不得清 `plans` 表。
- rescan/moduleMining 需 lease + rescanId/epoch 幂等。

Audit checks:

- 三段是否共享同一 confirmed Plan。
- 每段是否自己另做局部 plan。
- testMode 是否改变 Plan。
- focused signature 修复是否被误当成需求本身。
- lease/idempotency/scale guard 是否真实存在并覆盖原始坑。

### R5 Test Mode And BiliDili Acceptance

Original facts:

- 测试模式是在 confirmed Plan 上选子集维度 + 小规模 + 可选 moduleScope 执行。
- 不做全量 cold-start。
- 目的是真实项目低成本验证整链。
- 不变量：仍需 confirmed Plan；测试模式只缩范围，不绕过 grounding/不猜原则。
- BiliDili 真实验收链：规划真实性、scoped 生成、提交驱动进化、向量降级。

Audit checks:

- 测试模式子集是否被写入 Plan intent。
- BiliDili 验收是否真的证明了完整 Plan，还是只证明了 scoped run。
- Test retry 是否把过窄的 runtime output 当成完整需求验收。
- Controller 是否降低了验收门槛，例如把 `prime/search/recipe_map or equivalent` 改成原文未授权替代。

### R6 Unified Evolution

Original facts:

- Q1 = 统一进化，去掉单独包/推荐路径。
- commit 驱动 HEAD-compare on tool-call，非 daemon/watch。
- 新模块 → 区域扫描 + Recipe 推荐。
- rename/move 自动修复 source_refs。
- 逻辑变更出 proposal。
- `-M/-C`、默认 90% 阈值、merge-base、rescan catch-up、scale guard 是实现期硬点。

Audit checks:

- 是否又产生了单独旁路。
- “Recipe 推荐”是否被控制器扩成 Plan 推荐或 top 需求。
- 是否把 dirty paths / git diff evidence 当成完整进化链。
- rename/source_ref 是否只 stale 而没有达到原始自动修复语义。

### R7 Vector Availability And Freshness

Original facts:

- Core 提供 `isAvailable()` 或等价可用性接口。
- Plugin 消费者统一改用。
- create/evolve 后 per-recipe 即时 source_refs + 向量。
- 降级可观测不静默。

Audit checks:

- 是否所有消费者迁移。
- 是否存在 stats legacy 判断继续作为权威。
- 降级证据是否足以证明 create/evolve 即时性。

### R8 Green-Field Migration

Original facts:

- Plugin Recipe generation 相关代码收敛到 `lib/recipe-generation/`。
- migrate-early，8 切片 leaf-first，每步绿。
- 旧路径清空，DI/MCP import 更新。
- Core 能力留 Core，MCP transport 留原位仅改 import。

Audit checks:

- 是否只是 re-export/shim，未完成 ownership 迁移。
- 是否删除/移动了不该动的能力。
- 是否每步都有门禁证据。

### R9 Non-Goals And Invariants

Original facts:

- 不重建 daemon/watch。
- 不改四工具对外 MCP 业务语义。
- 不删证据/提案/向量结构。
- 主体 follow-on 不在本需求。
- 不做 Recipe 质量提升算法评估。

Audit checks:

- 是否有隐式 watcher/daemon。
- 是否改变四工具语义但称为内部实现。
- 是否把主体 follow-on、质量评估、推荐质量等混入本需求。

## Implementation Evidence Universe

审计必须覆盖以下证据全集，不能只看摘要。

### Original Design Inputs

- `Design/docs/current/alembic-recipe-evolution-optimization-workspace-handoff-2026-06-21.md`
- `Design/docs/current/alembic-recipe-evolution-optimization-2026-06-21.md`

### Archived State Root

- `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/demand.json`
- `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/developer-progress.md`
- `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/wakeflow-state.json`
- `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/controller-events.jsonl`
- `wakeflow-ledger/workspace/archive/2026-06/alembic-recipe-evolution-optimization-2026-06-21/intake/design-handoff-alembic-recipe-evolution-optimization-2026-06-21.json`

### Task Packages To Audit

- `rg0-plugin-recipe-generation-skeleton-p1`
- `rg1-core-architecture-intelligence-p1`
- `rg2-core-dimension-planning-dynamic-signals-p1`
- `rg3-core-plan-ledger-projection-p1`
- `rg3-plugin-alembic-plan-tool-p1`
- `rg4-plugin-plan-driven-generation-test-mode-p1`
- `rg4-plugin-plan-driven-generation-test-mode-rework-1-p1`
- `rg5-plugin-project-context-anchored-creation-p1`
- `rg6-core-vector-availability-interface-p1`
- `rg6-plugin-vector-availability-consumer-migration-p1`
- `rg7-core-per-recipe-freshness-primitives-p1`
- `rg7-plugin-create-evolve-immediate-freshness-p1`
- `rg8-plugin-commit-driven-unified-evolution-p1`
- `rg9-plugin-greenfield-recipe-generation-closeout-p1`
- `rg10-test-bilidili-scenario-acceptance-p1`
- `rg10-test-bilidili-scenario-acceptance-retry-1-p1`
- `rg10-test-bilidili-scenario-acceptance-retry-2-p1`
- `rg10-test-bilidili-scenario-acceptance-retry-3-p1`
- `rg10-test-bilidili-scenario-acceptance-retry-4-p1`
- `rg10-plugin-plan-project-context-empty-repair-p1`
- `rg10-plugin-plan-project-context-empty-repair-rework-1-p1`
- `rg10-cross-repo-test-blocker-repair-p1`
- `rg10-plugin-focused-plan-gate-retrieval-repair-p1`
- `rg10-plugin-commit-driven-evolution-source-ref-repair-p1`
- `rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-p1`

### Controller Reviews To Audit

- RG4 test-mode rework controller review.
- RG5 ProjectContext anchored creation review.
- RG6 Core vector availability review.
- RG6 Plugin vector consumer review.
- RG7 Core freshness review.
- RG7 Plugin create/evolve freshness review.
- RG8 unified evolution review.
- RG9 green-field closeout review.
- All RG10 Test acceptance and retry reviews.
- All RG10 Plugin/Core repair reviews.

### Target Results To Audit

All target results under archived `target-results/`, especially:

- `tr-rg3-core-plan-ledger-projection-t1`
- `tr-rg3-plugin-alembic-plan-tool-t1-5698d0f`
- `tr-rg4-plugin-plan-driven-generation-test-mode-t1`
- `tr-rg4-plugin-plan-driven-generation-test-mode-rework-1-t1`
- `tr-rg10-test-bilidili-scenario-acceptance-t1`
- `tr-rg10-test-bilidili-scenario-acceptance-retry-1-t1`
- `tr-rg10-test-bilidili-scenario-acceptance-retry-2-t1`
- `tr-rg10-test-bilidili-scenario-acceptance-retry-3-t1`
- `tr-rg10-test-bilidili-scenario-acceptance-retry-4-t1`
- `tr-rg10-plugin-plan-project-context-empty-repair-t1`
- `tr-rg10-plugin-plan-project-context-empty-repair-rework-1-t1`
- `tr-rg10-plugin-focused-plan-gate-retrieval-repair-t1`
- `tr-rg10-plugin-commit-driven-evolution-source-ref-repair-t1`
- `tr-rg10-plugin-rescan-unified-evolution-diff-routing-rework-1-t1`

### High-Risk Code Areas To Audit

This list is not a conclusion; it is the minimum source surface for review.

AlembicCore:

- `src/service/planLedger/contracts.ts`
- `src/service/planLedger/planLedger.ts`
- `src/repository/plan/PlanRepository.ts`
- `src/infrastructure/database/migrations/012_plans.ts`
- `src/service/project-context/dimensionPlanning/contracts.ts`
- `src/service/project-context/dimensionPlanning/dimensionPlanning.ts`
- `src/service/project-context/architectureIntelligence/contracts.ts`
- `src/service/project-context/architectureIntelligence/architectureIntelligence.ts`
- `src/project-context-capabilities.ts`
- `src/dimensions.ts`
- `src/service/knowledge/SourceRefReconciler.ts`
- `src/service/knowledge/RecipeFreshnessService.ts`
- `src/service/vector/VectorService.ts`
- all related tests.

AlembicPlugin:

- `lib/recipe-generation/plan-tool.ts`
- `lib/recipe-generation/plan-generation-gate.ts`
- `lib/recipe-generation/project-context-anchoring.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `lib/recipe-generation/evolution/PluginOpportunisticEvolution.ts`
- `lib/recipe-generation/evolution/FileChangeHandler.ts`
- `lib/recipe-generation/evolution/git-diff-checkpoint/GitDiffScanner.ts`
- `lib/recipe-generation/evolution/git-diff-checkpoint/GitDiffCheckpointService.ts`
- `lib/recipe-generation/recipe-region-vector.ts`
- `lib/runtime/mcp/tools.ts`
- `lib/shared/schemas/mcp-tools.ts`
- `lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `lib/runtime/mcp/McpServer.ts`
- `lib/runtime/mcp/handlers/tool-router.ts`
- `lib/runtime/mcp/core-tools/output.ts`
- `lib/runtime/mcp/handlers/search.ts`
- `lib/service/project-knowledge-context/retrieval/RecipeCandidateProvider.ts`
- all related tests and codex scenarios.

Test:

- `Test/tmp/rg10-test-bilidili-scenario-acceptance-*` evidence summaries and raw JSON.
- Any BiliDili isolated worktree scripts, output JSON, review assessment JSON, and resulting commits mentioned by Test evidence.

Current incorrect repair demand:

- `.wakeflow-active/current/alembic-plan-authoritative-complete-plan-repair-2026-06-22/demand.json`
- `.wakeflow-active/current/alembic-plan-authoritative-complete-plan-repair-2026-06-22/evidence/p0-controller-plan-authority-drift-audit.md`
- `.wakeflow-active/current/alembic-plan-authoritative-complete-plan-repair-2026-06-22/task-packages/p1-core-complete-plan-intent-repair-p1.json`

## Known Suspect Areas

These are suspects, not final conclusions. The audit must prove or clear each one.

### S1 Recommendation / Top / Ranked Dimensions

Observed concern:

- Controller stated “推荐/top 的位置” as if original requirement specified it.
- Original requirement contains recommendation language for ProjectContext tool guidance and new-module Recipe recommendation, but does not explicitly define `recommendedDimensions` or top-N placement.
- Core implementation has `recommendedDimensions`, `dimensionOrder`, `maxRecommendedDimensions`, and Plan builder usage that may have promoted ranking into Plan intent.

Required audit outcome:

- Determine exactly which code paths convert ranking/recommendation into Plan authority.
- Mark any controller statement that asserts original textual authority for this as fabricated.
- Separate valid implementation detail from false requirement.

### S2 `selectedDimensions`

Observed concern:

- Original `alembic_plan` interaction detail references `selectedDimensions` as part of confirm payload.
- Test mode uses dimensions subset for scoped execution.
- Plugin confirm may write `selectedDimensions` into Plan intent and recompute stages.

Required audit outcome:

- Determine whether the implementation treats selected dimensions as full Agent-confirmed plan scope, execution subset, or both.
- Determine whether any controller task package incorrectly used selectedDimensions as evidence of full Plan correctness.
- Mark ambiguous original wording as needing user confirmation, not as automatic implementation license.

### S3 Test Mode

Observed concern:

- Test mode is explicitly scoped and not full cold-start.
- Controller acceptance may have accepted scoped test-mode evidence as proving broader Plan behavior.

Required audit outcome:

- Distinguish what RG-10 test mode can prove from what it cannot prove.
- Determine whether accepted Test retry-4 proves original complete Plan requirements or only scoped runtime.
- List any accepted conclusion that exceeds raw Test evidence.

### S4 Plan Authority / Living Ledger

Observed concern:

- Plan intent may be generated deterministically by Plugin/Core rather than Agent-authored full payload.
- generation-state projection may be correct while intent semantics are wrong.

Required audit outcome:

- Check whether `draft` merely collects information or silently decides Plan.
- Check whether `confirm` persists full Agent plan or patches deterministic draft.
- Check whether `get` returns complete active Plan and state or narrowed execution data.

### S5 ProjectContext Understanding

Observed concern:

- Core RG1/RG2 may implement heuristic intelligence surfaces.
- Original requirement says if understanding is missing, build it so Agent does not guess.

Required audit outcome:

- Determine whether DomainSignal/ArchitectureStyle/Complexity/etc. are real enough for the original requirement or just shallow heuristics.
- Determine whether any missing capability was hidden by acceptance language.

### S6 BiliDili Acceptance

Observed concern:

- Retry-4 controller review accepted stale lifecycle evidence instead of direct sourceRef repair.
- It accepted prime degraded behavior under vector-degraded mode.
- It accepted public gitDiffEvidence and generationChangeLog as satisfying routing.

Required audit outcome:

- Determine whether these substitutions were authorized by original requirement or only controller-created dispatch criteria.
- Mark each accepted substitution as original-scope, controller-inference, overreach, or needs-user-confirmation.

### S7 Focused ProjectContext / Signature Repairs

Observed concern:

- RG10 introduced focused signature scope repairs and fallback project context behavior.
- These may be valid bug fixes, but they may also encode new behavior not in original design.

Required audit outcome:

- Determine which repairs are necessary to run original BiliDili scenario and which change requirement semantics.
- Check whether fallback source-file behavior bypasses ProjectContext grounding.

### S8 Green-Field Closeout

Observed concern:

- RG9 claimed old runtime/service paths were archived/re-exported and new ownership moved to `lib/recipe-generation`.

Required audit outcome:

- Verify actual import and ownership.
- Determine whether compatibility adapters left old behavior in place contrary to “old paths clear”.

### S9 Current Incorrect Repair Demand

Observed concern:

- The newly created `alembic-plan-authoritative-complete-plan-repair-2026-06-22` demand and P1 task package contain controller-inferred wording such as recommendation/top placement.

Required audit outcome:

- List every sentence in that root that is not original requirement fact.
- Mark which statements must be deleted, rewritten as controller inference, or sent to user confirmation.
- Ensure no dispatch occurs from this root.

## Required Audit Outputs

The demand is complete only when these artifacts exist.

### Output 1: Original Requirement Fact Table

File to produce under the future state root:

`evidence/original-requirement-fact-table.md`

Required columns:

- Fact ID
- Requirement source file
- Line range
- Exact short quote or paraphrase
- Requirement category
- What it explicitly requires
- What it explicitly does not require
- Ambiguous wording
- User-confirmed decision or open question

### Output 2: Implementation Inventory

File:

`evidence/implementation-inventory.md`

Required columns:

- Artifact ID
- Repository/window
- Commit or state evidence
- File path
- Change type
- Introduced behavior
- Related RG package
- Related original fact IDs
- Test evidence
- Risk flag

### Output 3: Claim And Acceptance Inventory

File:

`evidence/controller-claim-acceptance-inventory.md`

Required columns:

- Claim ID
- Source: task package, target result, controller review, final acceptance, current repair root
- Exact claim
- Evidence cited
- Original requirement fact IDs cited
- Does evidence actually prove claim
- Overreach category

### Output 4: Fabricated Requirement Matrix

File:

`evidence/fabricated-requirement-matrix.md`

Required columns:

- Fabrication ID
- Fabricated / overreached requirement text
- Who introduced it: Controller, target, Test, task package, code naming, current repair root
- Where introduced
- Original requirement support: yes/no/ambiguous
- Code/tests changed because of it
- Acceptance decisions affected
- Severity: P0/P1/P2
- Required action: delete, revert, rewrite, downgrade-to-implementation-detail, user-confirmation-needed

### Output 5: Plan-Semantics Special Report

File:

`evidence/plan-semantics-special-report.md`

Must cover:

- Plan intent vs projected state.
- `draft` vs `confirm` vs `get`.
- Agent decision vs Plugin deterministic inference.
- `selectedDimensions`.
- `recommendedDimensions` / ranked/top concepts.
- testMode execution subset.
- generation gate behavior.
- BiliDili evidence limits.
- current incorrect repair root wording.

No statement may say “original requirement says X” unless X has a line reference.

### Output 6: Remediation Decision Record

File:

`evidence/remediation-decision-record.md`

Must categorize every finding:

- `must-revert`
- `must-rewrite-requirement`
- `must-reclassify-as-implementation-detail`
- `requires-user-confirmation`
- `valid-implementation`
- `valid-but-insufficient-evidence`
- `unknown-needs-more-evidence`

## Phase Plan

### A0 Formal Intake And State Cleanup

Goal: create the formal Wakeflow state root once the current planned repair root is cancelled/archived by supported state-machine means.

Must do:

- Do not dispatch `p1-core-complete-plan-intent-repair-p1`.
- Do not use its P0 audit as authority.
- Record blocker if Wakeflow lacks cancel surface.
- Once formal root is created, import this document as the demand source.

Stop if:

- Any step would require manually editing `wakeflow-state.json`.
- Any step would complete or archive the pending repair root dishonestly.

### A1 Original Requirement Index

Goal: turn the original handoff/design into line-addressable facts.

Must do:

- Run `nl -ba` or equivalent on both original docs.
- Extract every requirement, non-goal, risk, resolved decision, phase candidate, test-mode statement, and validation rule.
- Preserve ambiguity instead of resolving it silently.

Acceptance:

- Fact table covers every section of both source docs.
- No fabricated term appears as original fact.

### A2 Implementation Inventory

Goal: enumerate all implementation artifacts created under the old demand.

Must do:

- For every task package, read target package JSON, target result JSON, controller review, evidence refs.
- For every referenced commit, run `git show --stat`, `git diff --name-status`, and targeted source reads in the owning repo.
- Include tests, codex scenarios, MCP schema changes, output contract changes, ledger docs, and Test evidence.

Acceptance:

- Inventory covers AlembicCore, AlembicPlugin, Test, Wakeflow state root, and current incorrect repair root.
- Each artifact has commit/state evidence or is marked unresolved.

### A3 Requirement-To-Code Matrix

Goal: compare every original requirement fact to implementation.

Must do:

- For each fact, map implementation evidence or mark missing.
- For each implementation artifact, map original fact support or mark unsupported.
- Use severity labels.

Acceptance:

- Every original fact has a coverage row.
- Every implementation artifact has an authority row.

### A4 Fabrication And Overreach Extraction

Goal: list all fake/overreached requirements.

Must do:

- Include controller statements, task package wording, target claims, Test substitutions, current repair root wording, code schema semantics, and acceptance conclusions.
- Separate “valid implementation detail” from “false requirement”.

Acceptance:

- Every P0/P1 suspected issue has proof or is explicitly downgraded with reason.
- No accusation is unsupported.

### A5 Remediation Plan

Goal: determine next actions without editing product code yet.

Must do:

- Identify what should be reverted.
- Identify what should be retained as implementation detail.
- Identify what must be rewritten in requirements.
- Identify what requires user confirmation.
- Identify what needs a future implementation repair demand.

Acceptance:

- User can decide next work from a clear, evidence-backed table.
- No product fix is dispatched before this decision.

## Completion Definition

This audit demand is complete only when all conditions are met:

1. Formal Wakeflow state root exists after supported cleanup of current pending repair root.
2. Original requirement fact table covers the full handoff and requirement design.
3. Implementation inventory covers all archived task packages, target results, controller reviews, Test artifacts, and current incorrect repair root.
4. Requirement-to-code matrix maps every fact and artifact.
5. Fabricated requirement matrix lists every unsupported or overreached demand claim, including the controller-created “recommendation/top placement” claim.
6. Plan-semantics special report explicitly resolves only what evidence supports and marks ambiguous original wording as user-confirmation-needed.
7. Remediation decision record is complete and contains no product implementation change.
8. Controller reports that no implementation repair, redispatch, acceptance, or archive decision is authorized until the user reviews the audit.

## Explicit Forbidden Conclusions

The audit may not conclude:

- The original old demand is acceptable because RG-10 once passed.
- The current repair demand is acceptable because it points at a real bug.
- Recommendation/top semantics were original requirements unless exact original lines prove it.
- Test-mode scoped success proves full Plan semantics unless evidence shows the complete Plan remained authoritative.
- Target backfill equals controller acceptance.
- Controller interpretation equals original requirement.
- A code path is valid merely because tests pass.
- A new repair implementation may start before this audit is accepted.

## Validation Strategy

Controller self-verification:

- Check every referenced path exists.
- Check every line reference is reproducible with `nl -ba`.
- Check every commit hash exists in the owning repository.
- Check every matrix row has an authority classification.
- Run `git diff --check` for audit docs.
- Use Wakeflow verification only after the formal state root exists.

Product repo validation:

- No product repo tests are required for writing the audit demand.
- During A2/A3, product repo commands are read-only or test-only unless the user explicitly authorizes repair.

Test window:

- Test is not used for this audit unless raw BiliDili evidence is missing or unreadable and controller cannot inspect it.
- Test must not be asked to rediscover controller-documented fabrication.

## Initial Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Current pending repair root blocks formal intake | P0 | Do not hand edit. Wait for cancel tool or state-machine-supported cleanup. Keep this ledger doc as pending demand definition. |
| Audit becomes another invented requirement | P0 | Require original line reference plus code evidence for every conclusion. |
| Controller repeats the recommendation/top fabrication | P0 | Treat recommendation/top placement only as suspect until proven by original line references. |
| Scope explodes into product repair | P0 | Audit only. Product repair requires later user decision. |
| Archived evidence was redacted or moved | P1 | Use archive manifest and preserved original active root only for local audit; do not write real thread ids into tracked docs. |
| Test evidence uses isolated temp paths | P1 | Reference evidence relatively and avoid user absolute paths in long-term docs. |

## Next Formal Step

Once Wakeflow can cancel or otherwise clear `.wakeflow-active/current/alembic-plan-authoritative-complete-plan-repair-2026-06-22`, run formal init with:

- demandKey: `alembic-recipe-evolution-gpt55-fabrication-audit-2026-06-22`
- title: `Alembic Recipe Evolution GPT-5.5 需求篡改与虚假实现审计`
- stateRoot: `.wakeflow-active/current/alembic-recipe-evolution-gpt55-fabrication-audit-2026-06-22`
- sourceRef: this document

No target dispatch is authorized until A1 and A2 are complete enough for a controller-reviewed first audit package.
