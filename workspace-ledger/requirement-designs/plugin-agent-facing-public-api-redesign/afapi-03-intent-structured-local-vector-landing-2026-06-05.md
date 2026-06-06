# AFAPI 03 Intent Structured Local-Vector Entry Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR`
Sequence Order：03
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-03-INTENT-STRUCTURED-LOCAL-VECTOR - AFAPI 03 Intent Structured Local-Vector Entry
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

本需求定义 `alembic_intent` 作为 host agent 进入 Alembic 工具链的结构化意图入口。它不是每 turn 强制分类器，也不是 raw prompt 存储器；它负责把 host-declared intent、turn metadata、sourceRefs 和用户语义整理为可被 prime / work / guard / decision 消费的 `intentRef`、recognizedIntent、detailRefs 和 vector retrieval hint。

### Requirements

- host agent 应显式提供 `agentHost`、`inputSource`、hostDeclaredIntent 或 hostTurnMeta；Alembic backend 做验证、归一化和必要降级。
- `alembic_intent` 对真实语义任务创建 `intentRef`；对 status-only、casual、mechanical envelope、无语义输入返回 skipped / blocked / degraded，而不是伪造 work。
- 设计原文要求一组 enum-first 字段：`agentHost`、`hostSurface`、`inputSource`、`intentKind`、`actionKind`、`objectKind`、`scopeKind`、`persistenceKind`、`primeNeed`、`workNeed`、`guardNeed`、`vectorUseKind`、`confidenceBand`。
- local intent record 应包含 intentRef、project identity、session / turn redacted keys、recognizedIntent、sourceRefs、recipeRetrievalHint、vectorPlan、linkedRefs、status / outcome、redaction policy。
- raw automation envelope 不能直接作为 prime query；必须先读取信封指向文档，再形成 curated host intent。
- IntentEpisode 是 Alembic resident 侧长期连续性增强，不能让 Plugin 写本地假持久化。

## Completion Definition

- semantic implementation / fix / refactor / review / planning input 能返回 ready 或 degraded 的 `intentRef` 与 recognizedIntent。
- status-only / mechanical envelope / no-semantic-intent 能返回 skipped 或 blocked，且 reasonCode 清楚。
- raw automation envelope without referenced docs 不能直接 prime。
- output 中保留 sourceRefs / detailRefs / vectorPlan，并说明 project/runtime source policy。
- 原 Design enum requirements 必须逐项有公开字段、internal derived field 或明确“不做 / 待裁决”说明；不能隐性漏掉。
- IntentEpisode resident route 若被使用，必须证明 raw ids 和 absolute paths 已 redacted。

## Stage Plan

1. Stage 0 intent contract inventory：
   - 从 Design 原文枚举逐项映射当前 public schema、internal policy、resident store 字段和 result envelope。
   - 明确哪些 enum 是必须公开字段，哪些可以作为 internal derived facts，哪些已由 result reason/status 替代。
2. Stage 1 input contract：
   - `agentHost`、`inputSource` 必须稳定公开。
   - hostDeclaredIntent 和 hostTurnMeta 保持 allowlist / redaction；raw host thread id 不落盘。
   - raw automation envelope 只能作为 `mechanical-envelope` 或 degraded source，不能直接变成 prime query。
3. Stage 2 local intent record：
   - handler 生成 `intentRef`、recognizedIntent、sourceRefs、detailRefs、vectorPlan。
   - 对 skipped / blocked / degraded 也返回可解释 reason，方便 host agent 知道下一步是否 prime / work_start / guard。
4. Stage 3 resident continuity：
   - 如需跨 turn continuity，由 Alembic IntentEpisode route 持久化；Plugin consumer 只调用 resident，不自造长期 store。
5. Stage 4 vector retrieval hint：
   - 输出 recipeRetrievalHint / vectorPlan，供 `alembic_prime` 或 resident search 使用。
   - vector hint 是检索增强，不是 sourceRef 生产 gate。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-intent-structured-local-vector-requirement-design-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`

### Code Facts

- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 已实现 `intentHandler`，返回 `intentRef`、`recognizedIntent`、`result`、`sourcePolicy`、`vectorPlan` 和 `localRecord`。
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts` 已支持 hostDeclaredIntent、hostTurnMeta、sourceRefs、raw automation envelope degradation、recognized intent draft 和 evidence spans。
- `AlembicPlugin/lib/service/task/IntentExtractor.ts` 与 `TaskLifecyclePolicy.ts` 为 intent status、prime need、work anchor need、guard need 提供内部分类依据。
- `Alembic/lib/http/routes/intent-episodes.ts` 与 `Alembic/lib/service/task/IntentEpisodeStore.ts` 已提供 resident IntentEpisode start / latest / recent / read / updateOutcome route，scope 为 project-scope dataRoot。
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` 已公开 `agentHost`、`inputSource`、`intentKind`、hostDeclaredIntent、hostTurnMeta、sourceRefs、outputBudget、projectRoot。
- 代码差异边界：原 Design 列出的 `hostSurface`、`objectKind`、`scopeKind`、`persistenceKind`、`primeNeed`、`workNeed`、`guardNeed`、`vectorUseKind`、`confidenceBand` 未全部以 public contract enum catalog 逐字公开；部分语义通过 hostTurnMeta.surface、TaskLifecyclePolicy、vectorPlan、reason/status/detailRefs 承接。后续不能用“已有 intent handler”直接证明这些原始 enum 要求全部等价满足。

### Current Judgment

当前代码已覆盖核心 intent handler、HostIntentFrame、local intent record、vectorPlan 和 Alembic IntentEpisode producer；但原 Design 的全量 enum-first 字段与当前 public schema 不是逐字等价。后续如用户要求“完全按原 Design enum 契约实现”，本需求必须重开 Stage 0 enum mapping 和公开字段裁决。

## Boundaries And Non-goals

- `alembic_intent` 不运行 prime search，不创建 workRef，不执行 Guard，不记录 durable decision。
- 不要求每个普通聊天 turn 都必须创建 intentRef。
- 不把 low confidence intent 强行提升为 ready；可 degraded 或要求 host/user 补充。
- 不把 IntentEpisode 作为 Plugin 本地私有状态。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
