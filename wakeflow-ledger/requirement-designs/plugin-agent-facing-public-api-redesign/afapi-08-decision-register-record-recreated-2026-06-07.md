# AFAPI 08 Decision Register / Decision Record Wakeflow Demand

Design Key: `PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key: `AFAPI-REQ-08-DECISION-REGISTER-RECORD`
Sequence Order: 08
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition for the remaining AFAPI track
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-08-DECISION-REGISTER-RECORD - AFAPI 08 Decision Register / Decision Record
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-P1(accepted), AFAPI-REQ-08-DECISION-REGISTER-RECORD-DURABLE-PRODUCER-P2(accepted), AFAPI-REQ-08-DECISION-REGISTER-RECORD-PLUGIN-SUCCESS-P3(accepted), AFAPI-REQ-08-DECISION-REGISTER-RECORD-LEGACY-CLEANUP-P4(accepted), AFAPI-REQ-08-DECISION-REGISTER-RECORD-CACHE-REPROBE-P5(accepted)
Windows: AlembicPlugin(accepted), Alembic(accepted)
Blockers: none
Next action: archived in `wakeflow-ledger/workspace/archive/2026-06/afapi-completed-demands/`; no active dispatch.
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-08 17:20 CST
Source state: revision 20 / event evt-20260607134826-0020
<!-- unified-status:end -->

## Goal

本需求把用户裁决、长期偏好、架构决定和撤销 / 替换记录从 work evidence 中分离出来，形成 Alembic-owned durable Decision Register。Plugin 的 `alembic_decision_record` 只是 host-facing consumer / mutator，不得写 Plugin-local fake decisions。Prime 默认只消费 active / effective decisions，revoked / deleted / audit decisions 不进入默认知识包。

## Completion Definition

- `alembic_decision_record create/update/revoke/delete/read/list` 对有 resident route 的项目返回 durable decisionRef / detailRefs。
- 无 resident decision-register route 时返回 blocked，reasonCode 为 unavailable 或 capability mismatch。
- Alembic searchable default view 排除 revoked / deleted；audit readback 显式包含 auditCount / auditExcludedCount / status all。
- Search / prime 能消费 active effective decision-register items，且 metadata 说明 excluded statuses。
- Plugin 不在本地创建 fake decisions，也不把 tentative suggestion 当 confirmed decision。

## Stage Plan

1. Stage 0 producer / consumer inventory：
   - Alembic：DecisionRegisterStore、HTTP routes、search integration、daemon health capability。
   - Plugin：DecisionRecordInput、resident client、decisionRecordHandler、blocked route behavior。
   - Prime：search / resident result 是否只消费 active effective decisions。
2. Stage 1 Alembic durable producer：
   - create / update / revoke / delete / read / list / searchable route。
   - storage privacy：hash raw session / turn keys，redact absolute paths。
   - project-scope mismatch 返回 409 blocker。
3. Stage 2 Plugin consumer：
   - public `alembic_decision_record` action mapping 到 resident route。
   - 无 durable capability 时 blocked，不写本地 fake decision。
4. Stage 3 retrieval integration：
   - `/api/v1/search` 和 resident search 合并 active effective decisions。
   - revoked / deleted 默认排除；includeAudit / status all 才能读 audit。
5. Stage 4 lifecycle cleanup：
   - 如果需要 superseded 一等 status 或 tombstone policy，必须新增 schema / tests，不隐式混在 revokeReason。

## Current Evidence Baseline

- Old AFAPI 08 reached code-fact target result and controller review-ready, but it was not accepted or completed by the old controller state root.
- New Wakeflow status therefore starts as not-claimed, with old evidence treated only as review input for the first claim.
- Completed AFAPI 01-07 are treated as upstream evidence, not as active work in this new Wakeflow sequence.
- Old paths and old scripts are not operational authority for this demand; the new Wakeflow state root becomes authority only after claim.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-P1` |
| Target window | `AlembicPlugin` |
| Target task | `AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-T1` |
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
