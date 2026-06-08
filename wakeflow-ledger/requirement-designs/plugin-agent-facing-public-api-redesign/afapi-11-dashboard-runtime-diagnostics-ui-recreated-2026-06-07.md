# AFAPI 11 Dashboard Runtime Diagnostics UI Wakeflow Demand

Design Key: `PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key: `AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI`
Sequence Order: 11
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition for the remaining AFAPI track
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI - AFAPI 11 Dashboard Runtime Diagnostics UI
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI-CODE-FACT-P1(accepted), AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI-HARDENING-P2(accepted)
Windows: AlembicDashboard(accepted)
Blockers: none
Next action: archived in `wakeflow-ledger/workspace/archive/2026-06/afapi-completed-demands/`; no active dispatch.
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-08 17:20 CST
Source state: revision 10 / event evt-20260607152211-0010
<!-- unified-status:end -->

## Goal

本需求是条件型下游需求：只有 runtime identity、sourceOfTruth、detailRefs、readiness、stateCleanup 或 diagnostics 需要用户可见解释时，Dashboard 才承接只读 UI。Dashboard 不决定 Plugin effective identity，不写 ProjectRuntimeControl，不替代 Alembic source of truth。

## Completion Definition

- Backend 返回 sourceOfTruth 时，Dashboard UI 可见 readiness / route / operation / requiredService / diagnostics / failure / cleanup。
- Backend 不返回 sourceOfTruth 时，UI 显示 unavailable，不展示假数据。
- API normalizer 保留 diagnostics 和 stateCleanup。
- UI 文案明确 read-only diagnostics，不暗示 Dashboard state 可覆盖 Plugin runtime identity。
- Contract test 覆盖类型、API client、UI component 和 i18n。

## Stage Plan

1. Stage 0 UI necessity check：
   - 只有当 AFAPI runtime diagnostics 需要用户可见观察时才启动 Dashboard。
   - 若 backend 没有新增 sourceOfTruth / diagnostics 字段，不创建 UI mock。
2. Stage 1 API client contract：
   - types / normalizer 保留 sourceOfTruth、diagnostics、stateCleanup、failure、sourceRefs / detailRefs。
   - 不丢 unknown diagnostics fields；必要时保守显示。
3. Stage 2 read-only component：
   - Header / diagnostics panel 展示 readiness、route、requiredService、readOnly / writePolicy、failure reason、diagnostics list。
   - sourceOfTruth missing 时显示 unavailable hint，不伪造。
4. Stage 3 state boundary：
   - Dashboard 可显示 selected / active state，但不能表达为 Codex effective identity。
   - 任何 write action / cleanup action 必须由 Alembic runtime-control route 明确提供，不由本需求新增。
5. Stage 4 tests：
   - dashboard-contract test 覆盖 fields preserved and visible。
   - 不允许 sourceOfTruth 被 normalizer 重置为 null。

## Current Evidence Baseline

- Old AFAPI 11 had dashboard-related sample validations, but the independent AFAPI-REQ-11 demand was not claimed as its own state root.
- New Wakeflow status starts as not-claimed and must decide whether prior dashboard evidence still satisfies the demand after a fresh Stage 0 review.
- Completed AFAPI 01-07 are treated as upstream evidence, not as active work in this new Wakeflow sequence.
- Old paths and old scripts are not operational authority for this demand; the new Wakeflow state root becomes authority only after claim.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI-CODE-FACT-P1` |
| Target window | `AlembicDashboard` |
| Target task | `AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI-CODE-FACT-T1` |
| Target summary | 读取本 Wakeflow 需求文档，按目标仓库职责完成 Stage 0 代码事实复核并回填原始证据。 |

The first task package is a candidate only. It must be created inside a claimed Wakeflow state root before any direct-thread delivery.

## Boundaries And Non-goals

- Do not dispatch from this document alone.
- Do not treat old AFAPI TODO rows, old backfill, or old script output as acceptance in the new workspace.
- Do not edit product repositories from the controller while rebuilding this demand definition.
- Do not create target-to-target delivery or Test handoff unless the future state root explicitly authorizes it.

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
