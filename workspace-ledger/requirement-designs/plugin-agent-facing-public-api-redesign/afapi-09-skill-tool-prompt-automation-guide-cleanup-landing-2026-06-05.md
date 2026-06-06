# AFAPI 09 Skill / Tool Prompt / Automation Guide Cleanup Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP`
Sequence Order：09
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-09-SKILL-TOOL-PROMPT-AUTOMATION-GUIDE-CLEANUP - AFAPI 09 Skill / Tool Prompt / Automation Guide Cleanup
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

本需求负责在新 public contract 生效后，清理旧 skill、tool description、Project Skill、host-specific guide 和 automation guide 中的 prime/create/close/guard/record_decision 机械链路。它不是删除功能本身，而是删除会误导 host agent 的旧 public guidance，并用新工具映射和 tests 证明能力不丢失。

### Requirements

- 用户已确认旧 active skill / tool description 中 prime/create/close/guard/record_decision 机械话术可以删除。
- 删除旧话术必须建立在新工具 contract、handler、schema 和 tests 已通过的基础上。
- active skill 和 Project Skill 必须指导 host agent 使用 `alembic_intent`、`alembic_prime`、`alembic_work_start`、`alembic_work_finish`、`alembic_code_guard`、`alembic_decision_record`。
- automation / direct-thread guide 必须明确 raw machine envelope 不能直接 prime；必须先读取信封指向计划、skill 和证据文档。
- 旧 `alembic_task` 如果作为 hidden compatibility hook 保留，必须在文档和 tools/list 中不再作为推荐主入口。
- cleanup tests 必须覆盖 forbidden wording absence 和功能映射不丢失。

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

### Design Sources

- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

### Code Facts

- `AlembicPlugin/lib/codex/mcp/tools.ts` 已把 `alembic_task` 描述成 hidden direct-call compatibility，并提示使用六个 agent-facing public tools。
- `AlembicPlugin/lib/codex/mcp/public-tools/descriptions.ts` 已提供六工具统一 description base。
- `AlembicPlugin/lib/codex/mcp/public-tools/cross-host-readiness.ts` 中 `CROSS_HOST_FORBIDDEN_LEGACY_PRIMARY_GUIDANCE` 明确把旧 `alembic_task`、`operation=prime`、`operation=create`、`operation=close`、`record_decision` 等列为不应出现在 cross-host primary guidance 的词。
- `AlembicPlugin/test/unit/AgentPublicSkillLegacyCleanup.test.ts` 覆盖 active skill / tool description legacy cleanup。
- `AlembicPlugin/lib/cli/SetupService.ts` 已出现新工具指导，例如使用 `alembic_work_finish + alembic_code_guard` 检查当前变更。
- 当前代码仍保留 hidden legacy hook 和 legacy schema 描述，这是兼容残留，不等于 active guidance；后续清理必须继续区分“物理存在”和“host-facing recommended surface”。

### Current Judgment

当前代码已经把 active guidance 切到新 public tools，并保留 hidden compatibility hook。后续若要物理删除 legacy handler 或 schemas，必须另做 deletion inventory，证明 old sessions / packaged runtime / tests 不受影响。

## Boundaries And Non-goals

- 不因清理 wording 直接删除 legacy handler；物理删除需要独立风险评估。
- 不把 cleanup 当成 public API implementation 通过证据；必须回看 handler 和 tests。
- 不把旧历史归档文档改写成新事实。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
