# AFAPI 02 Agent-Facing Public API Contract Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT`
Sequence Order：02
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT - AFAPI 02 Agent-Facing Public API Contract
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT-CODE-FACT-P1(accepted), AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT-RUNTIME-ACCEPTANCE-P2(accepted)
Windows: AlembicPlugin(accepted)
Blockers: none
Next action: render-progress-doc
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 15:25 CST
Source state: revision 8 / event evt-20260606072414-0008
<!-- unified-status:end -->

## Goal

本需求把旧 `alembic_task(operation=prime/create/close/fail/record_decision)` 伞形入口拆成语义明确的 agent-facing public tools，并建立跨 host agent 共享的基础 schema、枚举、refs 和 result envelope。它不实现每个工具的全部业务逻辑，但为 intent、prime、work、guard、decision 提供统一公共契约。

### Requirements

- 长期 public surface 是：
  - `alembic_intent`
  - `alembic_prime`
  - `alembic_work_start`
  - `alembic_work_finish`
  - `alembic_code_guard`
  - `alembic_decision_record`
- 这些工具不是 Codex 私有接口；Codex、Claude Code、generic host agent 共享同一 contract。
- 每个工具必须有明确 selection hint、non-goal、input refs、produced refs、status、skip / degraded / blocked / failed reason。
- 旧 `alembic_task` 可以作为隐藏 direct-call compatibility residue，但不能继续作为 active skill、tool description 或 host-facing prompt 的主入口。
- 新 contract 必须先在独立目录中建设和验证，再清理旧 public wording；不能把旧 task handler 当新 public tool 的中间层。

## Completion Definition

- tools/list 可见的 host-facing public surface 包含六工具；旧 `alembic_task` 不作为 active public guidance。
- 六工具任一 handler 返回都满足 `contractVersion`、`toolName`、`actionKind`、`status`、`agentHost`、`inputSource`、`summary`、`refs`、reason kind 的 schema 约束。
- skipped / degraded / blocked / failed 状态必须携带对应 reason kind。
- cross-host snapshots 证明同一套 contract 可供 Codex、Claude Code 和 generic host 使用，不产生 schema fork。
- legacy cleanup tests 证明删除旧机械话术不丢失功能映射。

## Stage Plan

1. Stage 0 public surface inventory：
   - 列出现有 MCP tools/list、tool schema、handler map、active skill、Project Skill、README / setup guidance、embedded runtime cache 中的 public wording。
   - 明确哪些旧入口是 hidden compatibility，哪些是仍可见主入口 residue。
2. Stage 1 shared contract：
   - 在 Plugin 内独立 public-tools contract 目录定义 tool catalog、shared enums、refs、detailRefs、reason codes、result envelope。
   - 为每个 tool 固定 required fields、accepted refs、produced refs、implementationStatus。
3. Stage 2 tool descriptions：
   - 每个工具必须说明 purpose、selectionHint、nonGoal。
   - 描述不得使用旧 prime/create/close/guard 机械链路作为推荐流程。
4. Stage 3 handler activation：
   - 六工具必须真实出现在 active MCP surface，并返回符合 envelope schema 的结果。
   - 旧 `alembic_task` 若保留，必须不进入 tools/list 或 active host guidance。
5. Stage 4 cross-host readiness：
   - Codex / Claude Code / generic host 的 prompt snapshot 共用同一 schema signature。
   - agentHost 只区分调用来源，不改变业务字段定义。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

### Code Facts

- `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts` 已定义 `AGENT_PUBLIC_TOOL_NAMES` 六工具、`AGENT_HOSTS`、input source、intent kind、action kind、result status、reason codes、refs、detailRefs 和 `AgentPublicToolResultEnvelopeSchema`。
- `AlembicPlugin/lib/codex/mcp/public-tools/descriptions.ts` 已为六工具提供 title、purpose、selectionHint、nonGoal。
- `AlembicPlugin/lib/codex/mcp/public-tools/cross-host-readiness.ts` 已固定 cross-host snapshots，证明三类 host 共用 schema signature，不为 Claude / generic host 派生字段分叉。
- `AlembicPlugin/lib/codex/mcp/McpServer.ts` 已把六工具路由到 `agentPublicToolHandlers`，同时保留 `alembic_task` handler。
- `AlembicPlugin/lib/codex/mcp/tools.ts` 对 `alembic_task` 的描述已变为 hidden direct-call compatibility，要求 active callers 使用六个 public tools。
- `AlembicPlugin/test/unit/AgentPublicToolsContract.test.ts`、`AgentPublicToolsActive.test.ts`、`AgentPublicToolsEvaluation.test.ts`、`AgentPublicToolsCrossHostReadiness.test.ts` 等为当前 contract 提供测试证据。

### Current Judgment

当前代码已具备六工具 public contract 与 active handler surface；`alembic_task` 仍作为 hidden direct-call compatibility 存在。后续若 public API contract 返工，必须先从本需求复核 active MCP surface、tool schema、tool descriptions、skill wording 和 cross-host tests。

## Boundaries And Non-goals

- 本需求不决定 prime 检索质量、Decision Register 持久化或 Guard 具体检查算法；这些分别由独立需求承接。
- 不提前把 public contract 上移到 AlembicCore；Core promotion 由 AFAPI 12 独立裁决。
- 不用 tool description 文案替代 handler 真实行为或测试。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
