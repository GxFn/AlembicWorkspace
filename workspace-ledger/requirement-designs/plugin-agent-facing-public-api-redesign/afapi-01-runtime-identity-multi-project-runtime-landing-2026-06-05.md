# AFAPI 01 Runtime Identity / Multi-project MCP Runtime Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME`
Sequence Order：01
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME - AFAPI 01 Runtime Identity / Multi-project MCP Runtime
Main state: planned
Stage: none
Current task packages: AFAPI-REQ-01-RUNTIME-IDENTITY-MULTI-PROJECT-RUNTIME-CODE-FACT-P1(pending)
Windows: AlembicPlugin(pending)
Blockers: none
Next action: prepare-dispatch-from-state, add-task-package, render-progress-doc
Review: none
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 13:38 CST
Source state: revision 2 / event evt-20260606053829-0002
<!-- unified-status:end -->

## Goal

本需求负责保证每个 host agent 窗口的 Plugin MCP runtime 能稳定绑定当前真实项目，而不是被 saved root、runtime-control selected / active、embedded fallback、旧 JobStore 或其它窗口状态污染。它是 AFAPI 的第一前置需求：如果 project identity 不可信，后续 `alembic_intent`、`alembic_prime`、work、guard 和 decision 都可能读错知识库或写错 dataRoot。

### Requirements

- 当前窗口的 real projectRoot 是 effective identity 的起点。
- ProjectScope / ghost dataRoot / project space membership 由 Core / Alembic 的真实 contract 解析，Plugin 只做 host-agent-facing runtime context。
- local Alembic daemon / resident service 是增强底座；resident on-demand route 必须与 resolved identity 匹配，不匹配时 fail closed 或 degraded，不得串库。
- saved project root、runtime-control selected / active、embedded plugin-owned runtime、local JobStore 都不能覆盖 effective identity，只能作为 read-only diagnostics 或明确 recoverability route。
- local-dev direct dist 与 packaged wrapper/runtime.tgz 必须分开验收，不能用一种入口的成功推断另一种入口可靠。
- canonical local-dev restart/reload 必须覆盖 build、cache rewrite、fresh MCP probe、stop old MCP、next startup readback 和真实 MCP tool-call verification。

## Completion Definition

- 同一台机器多个 Codex / Claude Code / generic host 窗口同时运行时，各自 prime / status / decision 只绑定自己的 current projectRoot 与对应 dataRoot。
- resident search mismatch、daemon unavailable、ProjectScope unavailable、stale selected / active 均返回结构化 degraded / blocked / diagnostics，不注入其它项目知识。
- local-dev 和 packaged mode 分别有可复核测试或 probe；不会用 packaged wrapper 诊断覆盖 local-dev direct dist，反之亦然。
- Plugin 旧 embedded fallback 不再作为主链路身份来源；若保留，只能有明确 recovery boundary 和 tests。

## Stage Plan

1. Stage 0 代码事实复核：
   - 复核 Plugin projectRoot resolution、WorkspaceResolver、ProjectRuntimeContext、resident client identity、local-dev / packaged entry detection。
   - 复核 Alembic ProjectRuntimeControl、projects route、daemon health / sourceOfTruth、ProjectScope registry 和 stale selected / active cleanup。
   - 复核 Core runtime contract 是否已满足 Plugin 和 Alembic 双消费者，不提前新增空 shared layer。
2. Stage 1 identity contract：
   - 固定 `real folder -> ghost dataRoot -> ProjectScope membership -> required service readiness -> failure envelope` 顺序。
   - 对 saved root、runtime-control selected / active、embedded runtime、JobStore fallback 统一降级为 diagnostics 或 recovery，不允许参与 effective identity。
3. Stage 2 entry mode：
   - local-dev direct dist：独立验证 build / sync / reload / real tool-call。
   - packaged wrapper：独立验证 runtime.tgz offline startup、startup lock、stdout/stderr readiness 和 diagnostics。
4. Stage 3 consumer unification：
   - public tools、status、prime、guard、decision consumer 统一从 ProjectRuntimeContext 获取 identity / readiness，不各自猜路径。
5. Stage 4 diagnostics：
   - Dashboard 或 host-visible diagnostics 只展示 sourceOfTruth 和 recovery next action，不写入 runtime identity。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`

### Code Facts

- `AlembicPlugin/lib/codex/runtime/ProjectRuntimeContext.ts` 已有 `CodexProjectRuntimeContext`、`identity`、`readinessState`、`requiredServices`、`sourceOfTruth`、`blockedFallbacks` 和 `sourcePolicy`；其中 `selectedOrActiveCanOverrideEffectiveIdentity: false` 明确禁止 runtime-control 覆盖当前 Codex project identity。
- `AlembicPlugin/lib/codex/runtime/ProjectRuntimeContext.ts` 已把 fallback isolation 分成 `saved-project-root`、`runtime-control-selected-active`、`local-jobstore`、`embedded-plugin-owned-runtime`，并标注 `effectiveIdentityAllowed: false`。
- `Alembic/lib/http/routes/projects.ts` 的 `/api/v1/projects/current` 返回 `activeRuntimeProject`、`selectedProject`、`sourceOfTruth` 和 `state`，为 Plugin / Dashboard 提供 Alembic 侧 source-of-truth readback。
- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` 暴露 `ProjectRuntimeIdentityContract`、`ProjectRuntimeServiceReadiness`、`ProjectRuntimeFailureEnvelope` 等 shared runtime contracts。
- `AlembicDashboard/src/components/Layout/Header.tsx` 和 `AlembicDashboard/src/api.ts` 已消费 `sourceOfTruth` / diagnostics，这属于下游只读展示，不改变本需求的 identity contract。

### Current Judgment

当前 AFAPI 代码事实显示本需求的主链路已实现并被旧总控计划验收；本文保留为独立需求入口。后续若 runtime / packaged / local-dev 任一边界返工，必须从本文 Stage 0 重新领取，而不是继续沿用 umbrella TODO 完成口径。

## Boundaries And Non-goals

- 不在 Plugin 里新建项目真实 source of truth；Alembic 是 runtime-control / resident source of truth。
- 不把 Dashboard selected project 当 Codex host agent 的 effective identity。
- 不因本需求直接迁移 Decision Register、IntentEpisode 或 Guard 业务逻辑；它们只消费 runtime identity。
- 不把单次本机状态写成普遍生产事实；所有结论必须来自代码和可复核 runtime readback。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
