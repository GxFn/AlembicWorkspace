# AFAPI 10 Evaluation / Smoke / Cross-host Readiness Wakeflow Demand

Design Key: `PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key: `AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS`
Sequence Order: 10
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition for the remaining AFAPI track
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS - AFAPI 10 Evaluation / Smoke / Cross-host Readiness
Main state: not-claimed
Stage: sequence-ready
Current task packages: none
Windows: none
Blockers: none
Next action: Claim from `wakeflow-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-remaining-demand-sequence-2026-06-07.json` only when total control chooses this as the next safe demand.
Review: none
Automation: disabled
User decisions needed: none before Stage 0; later decisions come from the claimed state root.
Last updated: 2026-06-07 CST
Source state: rebuilt in Wakeflow from controller review of the old AFAPI track; no state root has been created in the new workspace.
<!-- unified-status:end -->

## Goal

本需求定义 AFAPI 的评测和真实冒烟策略。它的目标不是“handler 能被调用”这么低，而是证明 agent-facing public API 在正确调用、错误调用、skip / degraded / blocked 路径、legacy cleanup、output budget、cross-host prompt 和真实 Codex resident 场景下都能维持契约。

## Completion Definition

- 所有 public tools contract tests 通过。
- 正向、skip、degraded、blocked 路径均有覆盖，不只验 happy path。
- legacy cleanup tests 证明旧 mechanical wording 不再 active。
- local-dev / packaged runtime probe 至少覆盖其中被本轮修改的入口；不能互相替代。
- real smoke 结论必须写清能推出什么、不能推出什么。
- Cross-host P0 证明 no schema fork；若宣称 Claude Code 实跑，必须提供真实 Claude Code runtime 证据。

## Stage Plan

1. Stage 0 evaluation matrix：
   - 建立六工具 x 正向 / skip / degraded / blocked / failed / output budget / legacy boundary 的矩阵。
   - 标注哪些可由 unit / schema test 覆盖，哪些必须 real MCP / real Codex / resident route。
2. Stage 1 contract tests：
   - catalog、required fields、accepted refs、produced refs、reason kind、status 和 legacyCompatibility。
3. Stage 2 active tests：
   - MCP handler callable，tools/list active surface 正确，legacy hook 不被 primary guidance 曝光。
4. Stage 3 negative / regression tests：
   - raw envelope prime、fake work、no-scope guard、decision unavailable、knowledge-empty、over-budget、wrong host schema fork。
5. Stage 4 runtime smoke：
   - local-dev direct dist / packaged installed-cache readback分别验证。
   - 真实 Codex / resident smoke 只在需要证明 host runtime / daemon route 时启用。
6. Stage 5 cross-host readiness：
   - Prompt snapshot + schema signature是 P0。
   - 实际 Claude Code / generic host smoke 是未来 P1 / user-confirmed boundary。

## Current Evidence Baseline

- Old AFAPI 10 had a standard demand draft but no old state root or target result.
- New Wakeflow status starts as not-claimed and must begin with a Stage 0 fact review before any evaluation or smoke expansion.
- Completed AFAPI 01-07 are treated as upstream evidence, not as active work in this new Wakeflow sequence.
- Old paths and old scripts are not operational authority for this demand; the new Wakeflow state root becomes authority only after claim.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS-CODE-FACT-P1` |
| Target window | `AlembicPlugin` |
| Target task | `AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS-CODE-FACT-T1` |
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
