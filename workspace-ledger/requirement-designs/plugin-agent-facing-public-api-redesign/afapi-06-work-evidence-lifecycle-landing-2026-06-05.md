# AFAPI 06 Work Evidence Lifecycle Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE`
Sequence Order：06
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-06-WORK-EVIDENCE-LIFECYCLE - AFAPI 06 Work Evidence Lifecycle
Main state: not-claimed
Stage: sequence-ready
Current task packages: none
Windows: none
Blockers: none
Next action: Claim this demand with `node scripts/workspace-control.mjs sequence claim-next --root .. --manifest workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-independent-demand-sequence-2026-06-06.json --write --json`.
Review: none
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 CST
Source state: sequence manifest / no state-root
<!-- unified-status:end -->

## Goal

本需求把旧 create / close task 语义拆成 `alembic_work_start` 和 `alembic_work_finish`。它只服务真实 implementation / fix / refactor / review 等 evidence-producing work，不负责普通问答、Design 讨论、状态汇报或机器信封读取，也不在 finish 时自动运行 Guard。

### Requirements

- `work_start` 只在存在真实代码任务、多步证据闭环或用户显式要求 work anchor 时创建 workRef。
- `work_finish` 只收口已创建 workRef 的 outcome、changedFiles、evidenceRefs、verificationRefs、detailRefs。
- no-work / status-only / mechanical envelope / read-only analysis 不得创建 fake work。
- `work_finish` 可以推荐 `alembic_code_guard`，但不能隐式执行 Guard。
- work lifecycle 不能替代 intent 或 prime；它消费 intentRef / primeRef。
- opportunistic evolution 只能基于真实文件变更和工具 outcome evidence 给出 hint / proposal，不能因为 work_finish 本身就自动进化知识。

## Completion Definition

- `alembic_work_start` 对真实 work 返回 workRef / detailRefs / ready envelope。
- no-work 场景不创建 workRef，或以 structured skip / blocker 告知原因。
- `alembic_work_finish` 对有效 workRef 返回 finishRef、changedFiles、evidenceRefs、outcome 和 guardRecommendation。
- work_finish 不调用 Guard；Guard 是否运行由 host agent 显式调用 AFAPI 07。
- fake work、raw automation envelope work、status-only work 有 regression tests。
- 若宣称 durable work lifecycle，必须有跨进程 store 证据；当前内存态 workRef 不能被误写成 durable。

## Stage Plan

1. Stage 0 lifecycle inventory：
   - 复核旧 `alembic_task create/close/fail` 调用方、handler、presenter、tests 和 active skill wording。
   - 复核 `work_start` / `work_finish` schema 是否覆盖 intentRef、primeRef、workScope、changedFiles、evidenceRefs、outcome。
2. Stage 1 work_start policy：
   - implementation / fix / refactor / review / explicit task anchor -> 可以创建 workRef。
   - status-only / read-only / design discussion / mechanical envelope -> skip 或不调用。
   - workScope 只作为声明和证据，不作为隐藏策略。
3. Stage 2 work_finish policy：
   - 必须携带 workRef 或明确 missing-work-ref blocker。
   - changedFiles 和 evidenceRefs 用于后续 guard recommendation / verification，不自动扩展到 whole repo。
4. Stage 3 guard recommendation：
   - 如果 changedFiles 包含 code-relevant scope，返回 `guardRecommendation.tool = alembic_code_guard` 与 explicit files。
   - 如果无 code diff、docs-only、unrelated dirty、no task anchor，返回 skip reason。
5. Stage 4 evolution boundary：
   - opportunistic evolution 只能在有强 evidence 时作为提示，不替用户记录 decision 或自动改 Recipe。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

### Code Facts

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` 已定义 `WorkStartInput` 和 `WorkFinishInput`，说明 work_start 创建 workRef，work_finish 返回 finishRef、detailRefs 和 scoped Guard recommendation，不运行 Guard。
- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 已实现 `workStartHandler` / `workFinishHandler`，内部维护 `WORK_RECORDS`，返回 workRef / finishRef / result envelope。
- `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts` 已区分 inputSource、intentKind、primeDecision、taskAnchorDecision、closeDecision 和 guard trigger decision。
- `AlembicPlugin/lib/codex/evolution/PluginOpportunisticEvolution.ts` 已把 opportunistic evolution surface 限定为 Plugin fallback / evidence gate，不作为 work_finish 的默认副作用。
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts` 验证 work_start / work_finish refs、changedFiles、evidenceRefs 和 guardRecommendation。
- 代码差异边界：当前 public work records 是 Plugin handler 内存态，不是 Alembic durable work history。若后续要求跨进程可读的 durable work ledger，需要单独设计 producer / store / cleanup，不应被当前 workRef 实现自动视为满足。

### Current Judgment

当前代码已覆盖 public work_start / work_finish 和 scoped guard recommendation；但 durable work history 并非当前实现事实。后续如用户要求 work ledger 长期可查，必须作为本需求的新增阶段重新确认。

## Boundaries And Non-goals

- 不把 work_start 作为所有用户 turn 的默认动作。
- 不把 work_finish 的 success 当成代码质量或 Guard 通过。
- 不把 decision / preference 记录进 work evidence；decision_record 独立处理。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
