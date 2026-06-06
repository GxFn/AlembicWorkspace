# AFAPI 10 Evaluation / Smoke / Cross-host Readiness Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS`
Sequence Order：10
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-10-EVALUATION-SMOKE-CROSS-HOST-READINESS - AFAPI 10 Evaluation / Smoke / Cross-host Readiness
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

本需求定义 AFAPI 的评测和真实冒烟策略。它的目标不是“handler 能被调用”这么低，而是证明 agent-facing public API 在正确调用、错误调用、skip / degraded / blocked 路径、legacy cleanup、output budget、cross-host prompt 和真实 Codex resident 场景下都能维持契约。

### Requirements

- Contract tests：六工具 catalog、schema、result envelope、reason kind、refs、output budget。
- Active MCP tests：tools/list、handler routing、new public tools callable、legacy hidden boundary。
- Golden prompt / skill tests：new tool guidance、forbidden legacy primary wording、raw envelope reading rule。
- Negative tests：wrong call、missing intentRef、missing guard scope、decision register unavailable、no sourceRefs automation prime、knowledge-empty degraded。
- Output budget tests：compact result 不丢 refs / detailRefs。
- Cross-host readiness：Codex、Claude Code、generic host 共用 schema，不分叉字段。
- Real smoke：必要时使用真实 Codex Plugin / resident route 验证，不把单元 handler 当 runtime evidence。

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

### Design Sources

- `AlembicDesign/docs/current/plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

### Code Facts

- `AlembicPlugin/test/unit/AgentPublicToolsContract.test.ts` 覆盖 public contract catalog / result envelope。
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts` 覆盖 active public tools、ready / degraded / blocked paths、work / guard / decision behavior。
- `AlembicPlugin/test/unit/AgentPublicToolsEvaluation.test.ts` 覆盖 skip / degraded / blocked / truncation paths 和 no legacy task fallback。
- `AlembicPlugin/test/unit/AgentPublicSkillLegacyCleanup.test.ts` 覆盖 active skill legacy cleanup。
- `AlembicPlugin/test/unit/AgentPublicToolsCrossHostReadiness.test.ts` 覆盖 cross-host prompt snapshots 和 no schema fork。
- `AlembicPlugin/scripts/probe-agent-public-tools-evaluation.mjs` 提供 installed-cache / MCP readback style probe。
- 旧总控计划记录了 AlembicTest-IDE real Codex / resident smoke 通过，用来证明真实 Codex Plugin + resident `/api/v1/search` 路径可达。
- 代码差异边界：当前 cross-host readiness 是 contract / prompt snapshot 层，不等于实际 Claude Code runtime smoke。若用户要求真实 Claude Code 运行验证，需要另立测试边界。

### Current Judgment

当前代码已有较完整 AFAPI P0/P1 测试矩阵和 real Codex resident smoke 证据。保留的缺口是实际 Claude Code runtime smoke 未被当前证据覆盖；这不是当前代码失败，但后续若用户要求 cross-host real runtime，需要单独测试计划。

## Boundaries And Non-goals

- 不把 AlembicTest 当默认测试队列；只有真实项目、真实 Codex host、resident route、Dashboard 手动观察等总控不能自测的边界才交给 AlembicTest。
- 不因一个 handler unit test 通过就关闭 runtime / packaged / skill wording 风险。
- 不用测试新发现的设计外问题自动扩展需求；需求外问题必须记录并待裁决。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
