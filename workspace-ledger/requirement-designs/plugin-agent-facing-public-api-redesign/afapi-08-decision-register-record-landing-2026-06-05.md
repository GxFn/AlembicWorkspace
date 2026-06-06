# AFAPI 08 Decision Register / Decision Record Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-08-DECISION-REGISTER-RECORD`
Sequence Order：08
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-08-DECISION-REGISTER-RECORD - AFAPI 08 Decision Register / Decision Record
Main state: planned
Stage: none
Current task packages: AFAPI-REQ-08-DECISION-REGISTER-RECORD-CODE-FACT-P1(pending)
Windows: AlembicPlugin(pending)
Blockers: none
Next action: prepare-dispatch-from-state, add-task-package, render-progress-doc
Review: none
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 20:19 CST
Source state: revision 2 / event evt-20260606121903-0002
<!-- unified-status:end -->

## Goal

本需求把用户裁决、长期偏好、架构决定和撤销 / 替换记录从 work evidence 中分离出来，形成 Alembic-owned durable Decision Register。Plugin 的 `alembic_decision_record` 只是 host-facing consumer / mutator，不得写 Plugin-local fake decisions。Prime 默认只消费 active / effective decisions，revoked / deleted / audit decisions 不进入默认知识包。

### Requirements

- public tool：`alembic_decision_record`。
- 支持 create、update、revoke、delete、read、list；Design 还要求 revoked / superseded / deleted 从默认 prime 排除。
- durable producer 在 Alembic resident / HTTP route 中，storage scope 为 project-scope dataRoot。
- Plugin 必须先检查 resident capability；无 durable route 时返回 blocked，不得本地伪造。
- Decision Register 搜索 / prime integration 默认只返回 active effective decisions；audit readback 必须显式 includeAudit / status all。
- sourceRefs 只作 observe-only / verification evidence，不得作为生产期 gate 拦截 decision 记录。

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

### Design Sources

- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

### Code Facts

- `Alembic/lib/http/routes/decision-register.ts` 已提供 `/api/v1/decision-register`、`/capability`、`/searchable`、`/:decisionId`、`/:decisionId/revoke` 和 DELETE route。
- `buildDecisionRegisterCapability()` 声明 lifecycle 为 create / update / revoke / delete / read / list / searchable，retrieval default 为 active-effective-only，excludedStatuses 为 revoked / deleted，storage 为 `.asd/decision-register`。
- `Alembic/lib/service/task/DecisionRegisterStore.ts` 已提供 durable store、append-only JSONL audit、session / turn / source ref hashed keys、project-scope mismatch blocker。
- `Alembic/lib/http/routes/search.ts` 与 `Alembic/lib/resident/tool-handlers/search.ts` 已把 Decision Register searchable view 合并进 `/api/v1/search` 和 resident search，`type=decision` / `decision-register` 可查询。
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` 已定义 `DecisionRecordInput`，支持 action、decisionRef、intentRef、workRef、title、description、rationale、tags、evidenceRefs、includeDeleted、status、limit。
- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 已实现 `decisionRecordHandler` 并通过 resident client 调用 durable decision register；无 route 时返回 decision-register-unavailable / capability mismatch blocker。
- `Alembic/test/unit/DecisionRegisterRoute.test.ts`、`DecisionRegisterStore.test.ts`、`SearchRouteTelemetry.test.ts`、`AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts` 提供验证证据。
- 代码差异边界：当前显式状态是 active / revoked / deleted；`superseded` 通过 revokeReason 等语义表达，不是独立 public status。若用户要求 superseded 成为一等 lifecycle status，需要重新设计 schema 和 retrieval filter。

### Current Judgment

当前代码已覆盖 Alembic durable producer、search integration 和 Plugin consumer；原 Design 的 superseded 语义目前不是独立 public status。后续如需一等 superseded lifecycle，必须从本需求重开。

## Boundaries And Non-goals

- Decision Register 不记录普通 work evidence；work evidence 由 AFAPI 06 处理。
- Decision Register 不运行 Guard；代码适配由 AFAPI 07 处理。
- 不把 sourceRef gate 作为生产期拦截。
- 不在没有用户确认的情况下把建议写成 durable decision。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
