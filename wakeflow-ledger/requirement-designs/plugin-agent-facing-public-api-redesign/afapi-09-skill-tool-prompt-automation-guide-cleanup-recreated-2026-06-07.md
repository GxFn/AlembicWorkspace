# AFAPI 09 Skill / Tool Prompt / Automation Guide Cleanup Wakeflow Demand

Design Key: `PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key: `AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP`
Sequence Order: 09
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition for the remaining AFAPI track
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP - AFAPI 09 Skill / Tool Prompt / Automation Guide Cleanup
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP-CODE-FACT-P1(accepted), AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP-ACTIVE-SURFACE-P2(accepted)
Windows: AlembicPlugin(accepted)
Blockers: none
Next action: archived in `wakeflow-ledger/workspace/archive/2026-06/afapi-completed-demands/`; no active dispatch.
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-08 17:20 CST
Source state: revision 10 / event evt-20260607141030-0010
<!-- unified-status:end -->

## Goal

本需求负责在新 public contract 生效后，清理旧 skill、tool description、Project Skill、host-specific guide 和 automation guide 中的 prime/create/close/guard/record_decision 机械链路。它不是删除功能本身，而是删除会误导 host agent 的旧 public guidance，并用新工具映射和 tests 证明能力不丢失。

## Completion Definition

- active host-facing docs 不再推荐 `alembic_task(operation=prime/create/close/guard/record_decision)`。
- tools/list 和 tool descriptions 指向六个新 public tools。
- old wording 只允许出现在 hidden compatibility说明、历史记录或 tests 中，且 tests 有明确边界。
- automation guide 说明 raw envelope 不能直接 prime。
- cleanup 后 contract / active / cross-host / evaluation tests 全部通过，证明功能映射不丢失。

## Stage Plan

1. Stage 0 wording inventory：
   - 搜索 active skill、Project Skill、README、setup guidance、tool descriptions、automation guide、embedded runtime cache 中的旧词。
   - 区分 forbidden active guidance、allowed hidden compatibility wording、historical docs / tests。
2. Stage 1 replacement map：
   - prime -> `alembic_intent` + `alembic_prime`。
   - create -> `alembic_work_start`。
   - close / fail -> `alembic_work_finish`。
   - guard -> `alembic_code_guard`。
   - record_decision -> `alembic_decision_record`。
3. Stage 2 active skill rewrite：
   - active skill / Project Skill 只描述新语义工具链和 skip / blocked conditions。
   - automation envelope guide 加入“读指向文档再 intent / prime”的硬要求。
4. Stage 3 compatibility isolation：
   - hidden legacy hook 可留作 old session direct-call recovery。
   - tools/list、primary prompt、cross-host guide、new user docs 不以旧 hook 为主入口。
5. Stage 4 regression tests：
   - forbidden wording absence。
   - tool mapping still works。
   - old session compatibility 不污染 active guidance。

## Current Evidence Baseline

- Old AFAPI 09 had a standard demand draft but no old state root or target result.
- New Wakeflow status starts as not-claimed and must begin with a Stage 0 fact review before cleanup work.
- Completed AFAPI 01-07 are treated as upstream evidence, not as active work in this new Wakeflow sequence.
- Old paths and old scripts are not operational authority for this demand; the new Wakeflow state root becomes authority only after claim.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP-CODE-FACT-P1` |
| Target window | `AlembicPlugin` |
| Target task | `AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP-CODE-FACT-T1` |
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
