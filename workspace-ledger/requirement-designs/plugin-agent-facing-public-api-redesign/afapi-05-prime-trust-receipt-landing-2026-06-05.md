# AFAPI 05 Prime Trust Receipt Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-05-PRIME-TRUST-RECEIPT`
Sequence Order：05
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-05-PRIME-TRUST-RECEIPT - AFAPI 05 Prime Trust Receipt
Main state: completed
Stage: none
Current task packages: AFAPI-REQ-05-PRIME-TRUST-RECEIPT-CODE-FACT-P1(accepted), AFAPI-REQ-05-PRIME-TRUST-RECEIPT-RUNTIME-GOLDEN-P2(accepted)
Windows: AlembicPlugin(accepted)
Blockers: none
Next action: render-progress-doc
Review: demand-completed
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 18:36 CST
Source state: revision 8 / event evt-20260606103624-0008
<!-- unified-status:end -->

## Goal

本需求负责 prime 之后的可见信任声明。它不是检索算法，也不是 work lifecycle；它要求 host agent 在使用 Alembic prime 知识前，用清晰、第一人称、非空洞的 receipt 告诉用户哪些内容可信可遵守、哪些只是上下文、哪些需要代码验证、哪些因 degraded 不可用。

### Requirements

- 一旦 prime delivered，host agent 可见回复必须说明 trust posture，不能只说“已读取知识库”。
- receipt 必须区分：
  - `trusted-to-obey`：Guard constraints / hard rules，可遵守。
  - `trusted-to-use`：Recipe / pattern knowledge，可作为项目知识使用。
  - `context-only`：host intent、query、evidence hints，仅作上下文。
  - `requires-verification`：source refs、candidates、未验证证据，需要后续代码验证。
  - `not-available-or-degraded`：未收到可用项目知识或检索降级。
- degraded / empty prime 必须明确说没有获得 usable project knowledge，不能继续声称 trusted-to-use。
- receipt 不能列出过长路径清单；evidenceRefs 应保留在 payload，必要时后续引用。
- receipt 必须是 Codex / host agent 第一人称，而不是让 Alembic prime 成为说话主体。

## Completion Definition

- ready prime output 包含五层 receiptChecklist，并且每层有可解释 title / summary / items 或空层说明。
- degraded / empty prime output 包含 not-available-or-degraded item，并禁止 trusted claim。
- golden prompt / unit test 证明 receipt 不是“知识库已加载”这类空话。
- output budget 下 receipt 仍保留边界，detailRefs 保留证据。
- public prime 和 legacy compatibility prime 的 receipt 行为不互相冲突。

## Stage Plan

1. Stage 0 receipt inventory：
   - 复核 public prime output 是否包含 receiptChecklist、trustPosture、hostResponse / shout instruction、degraded message。
   - 复核 legacy task prime residue 是否仍影响 active guidance。
2. Stage 1 trust layer mapping：
   - Guard constraints -> trusted-to-obey。
   - accepted Recipe / pattern knowledge -> trusted-to-use。
   - host intent / query / relation evidence -> context-only。
   - sourceRefs / candidates / missing verification -> requires-verification。
   - empty / degraded / unavailable -> not-available-or-degraded。
3. Stage 2 visible receipt contract：
   - host agent必须在进一步工具调用、代码读取、编辑、Guard 或 final summary 前可见声明 receipt。
   - receipt 简短但不能空泛；必须命名 obey / use / context / verify / degraded 边界。
4. Stage 3 degraded guardrail：
   - degraded / empty prime 强制 no trusted-to-use / no trusted-to-obey claim。
   - Host response 必须明确下一步需要代码验证或补证。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-prime-trust-receipt-requirement-design-2026-06-02.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-prime-task-decoupling-requirement-design-2026-06-04.md`

### Code Facts

- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts` 已定义并构建 trustPosture / receiptChecklist，包含五层 trust boundary。
- `AlembicPlugin/lib/codex/mcp/handlers/task.ts` 仍保留 legacy task prime material 的 receipt 逻辑；AFAPI 新 public prime 通过 `PrimeKnowledgeMaterial` 复用该材料。
- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 的 `primeHandler` 返回 `primeKnowledgeMaterial`，可被 host agent 读取 receipt material。
- `AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts` 覆盖 delivered、empty、degraded、candidate、host intent、evidenceRefs、anti-empty receipt 和 hostResponse reason。
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts` 验证 public `alembic_prime` 返回 trustPosture / receiptChecklist。

### Current Judgment

当前代码已覆盖五层 trust receipt，并有 focused tests 和 public prime active tests。后续若 prime package 字段调整，必须同步复核 receipt layers，避免新的检索材料绕过信任边界。

## Boundaries And Non-goals

- Trust receipt 不决定要不要 prime；触发时机由 AFAPI 04 和 lifecycle policy 决定。
- Trust receipt 不替代代码验证；`requires-verification` 的内容不能被当成已验证事实。
- Trust receipt 不记录 durable decision，也不创建 work。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
