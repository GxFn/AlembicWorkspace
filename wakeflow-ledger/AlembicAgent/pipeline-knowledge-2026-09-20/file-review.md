# 本轮逐文件 review

范围：AlembicAgent 内阶段执行、知识提交及共享取消调用链。相邻 Core 与 Tencent 仅作只读参考。完整前轮全仓库存续于 repository-review-2026-09-17；本轮深化下列文件，不声称审完所有未来改动。

| 文件 | 行数 | 职责与处理 |
| --- | ---: | --- |
| `src/shared/operation.ts` | 71 | operation timer/listener/terminal race — Shared operation extraction; verified through memory, style and stage consumers. |
| `src/agent/memory/MemoryReadPolicy.ts` | 102 | memory deadline policy and diagnostic contract — Retains deadline/default/error policy; removes duplicate lifecycle implementation. |
| `src/agent/strategies/PipelineStrategy.ts` | 1576 | stage order, gate routes and result aggregation — Preparation deadline, main reply, per-attempt totals, own cancellation state; Core strict authority retained. |
| `src/agent/strategies/pipeline/contracts.ts` | 29 | internal runtime observation and stage-result vocabulary — Optional existing runtime observations; explicit aborted and partial receipt semantics. |
| `src/agent/strategies/pipeline/attempt.ts` | 232 | single-stage attempt and observation reconciliation — One terminal result, native history, occurrence-aware pairing, safe retry eligibility, independent diagnostics. |
| `src/ai/AiProvider.ts` | 719 | text chat gateway adapter — Optional abortSignal reaches gateway transport; actual mock fetch verified. |
| `src/tools/runtime/handlers/submitEvidenceExpansion.ts` | 511 | evidence expansion and bounded style subcall — Optional operation options; 30-second style deadline and cancellation; existing evidence path retained. |
| `src/tools/runtime/handlers/knowledge.ts` | 33 | existing five-action facade — Handle and Core waiver re-exports preserved; routing only. |
| `src/tools/runtime/handlers/knowledge/contracts.ts` | 42 | host ports and source identifiers — Uses Core production package type without copying persistence or gates. |
| `src/tools/runtime/handlers/knowledge/input.ts` | 202 | input guards and candidate normalization — Direct-handler invalid types rejected; three local-only helper exports removed. |
| `src/tools/runtime/handlers/knowledge/sources.ts` | 152 | bounded source hints and prepared authoring evaluation — Symlink-safe Agent resolver kept; uses same Core authoring gate. |
| `src/tools/runtime/handlers/knowledge/sessionState.ts` | 70 | stable session counters — Original nested box identity preserved across projection and phase copies. |
| `src/tools/runtime/handlers/knowledge/operation.ts` | 39 | knowledge cancellation policy — Narrow signal-only context; distinguishes before-write stop from confirmed mutation. |
| `src/tools/runtime/handlers/knowledge/queries.ts` | 201 | search, prime, detail projections — Original ordering, limits and actual query calls preserved by declaration audit. |
| `src/tools/runtime/handlers/knowledge/management.ts` | 440 | publish, staging review and proposal adapters — Publish/readiness cancellation retained; no Core lifecycle authority moved. |
| `src/tools/runtime/handlers/knowledge/authoring.ts` | 409 | evidence preparation, repair and Core gate — Stable 3/2 attempt budgets; graph recheck consistency; unreachable appeal feedback removed. |
| `src/tools/runtime/handlers/knowledge/submission.ts` | 155 | Core write boundary and result routing — Final abort check after preparation await; one Core create call; non-created results preserved. |
| `src/tools/runtime/handlers/knowledge/submissionResult.ts` | 160 | post-create projection — Readiness-only production port; created identity survives read/save failure; unknown readiness explicit. |
| `src/tools/runtime/handlers/recipeAuthoringGate.ts` | 183 | existing Core authoring adapter (review only) — Kept filesystem/symlink scope checks; not equivalent to copying Core deterministic capability. |
| `src/tools/runtime/handlers/recipeProductionAdapter.ts` | 237 | existing retrieval/code evidence preparation (review only) — Original provenance and unsafe-code diagnostics retained across repair. |
