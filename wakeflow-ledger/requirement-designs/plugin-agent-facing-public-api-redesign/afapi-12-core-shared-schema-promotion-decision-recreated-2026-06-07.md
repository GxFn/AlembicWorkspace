# AFAPI 12 Core Shared Schema Promotion Decision Wakeflow Demand

Design Key: `PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key: `AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION`
Sequence Order: 12
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition for the remaining AFAPI track
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION - AFAPI 12 Core Shared Schema Promotion Decision
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION-CODE-FACT-P1(accepted)
Windows: AlembicCore(accepted)
Blockers: none
Next action: archived in `wakeflow-ledger/workspace/archive/2026-06/afapi-completed-demands/`; no active dispatch.
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-08 17:20 CST
Source state: revision 6 / event evt-20260607154119-0006
<!-- unified-status:end -->

## Goal

本需求不是“必须把 AFAPI contract 放进 Core”，而是定义何时应该把 Plugin 内的 agent-facing public schema、enums、result envelope 或 runtime identity pieces 提升到 AlembicCore。原则是：只有真实多消费者需要、当前分散实现已经造成阻塞、并且 Core 职责匹配时才 promotion；不得为了显得干净而提前创建空 shared layer。

## Completion Definition

- 若决定不 promotion：文档必须说明现有 Core contracts 已满足哪些共享需求，agent-facing schema 为什么仍留 Plugin，且不存在当前阻塞。
- 若决定 promotion：至少两个真实消费者 import Core schema，并有 tests 证明行为一致。
- 不出现无业务语义的 empty shared layer。
- 任何 migration 都保留 backward compatibility 或明确 breaking cleanup 用户裁决。
- Core package public exports、Alembic / Plugin build 和 focused tests 通过。

## Stage Plan

1. Stage 0 promotion trigger review：
   - 列出每个 public contract type 的真实消费者。
   - 判断是否已经出现重复实现、版本漂移、无法测试或跨仓库 blocking。
2. Stage 1 split decision：
   - Core 保留 runtime / ProjectScope / sourceRef / Recipe / Guard / search / failure envelope 等 headless shared contracts。
   - Plugin 保留 host-agent-facing tool contract、descriptions、cross-host prompt snapshots，除非出现第二个真实 host adapter 需要直接复用。
3. Stage 2 promotion candidate design：
   - 若要上移，先写 migration doc：source module、target module、exports、version、compat alias、consumer migration、tests。
   - 禁止只移动 types 不迁移真实 consumer。
4. Stage 3 contract tests：
   - Core public API boundary test。
   - Plugin import path / package export test。
   - Alembic / Dashboard / Agent consumer tests。
5. Stage 4 cleanup：
   - 删除旧 duplicate schema 或建立 temporary adapter；adapter 必须有真实 migration deadline。

## Current Evidence Baseline

- Old AFAPI 12 had a promotion decision draft but no old state root or target result.
- New Wakeflow status starts as not-claimed and must treat promotion as a decision gate, not as automatic Core implementation.
- Completed AFAPI 01-07 are treated as upstream evidence, not as active work in this new Wakeflow sequence.
- Old paths and old scripts are not operational authority for this demand; the new Wakeflow state root becomes authority only after claim.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION-CODE-FACT-P1` |
| Target window | `AlembicCore` |
| Target task | `AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION-CODE-FACT-T1` |
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
