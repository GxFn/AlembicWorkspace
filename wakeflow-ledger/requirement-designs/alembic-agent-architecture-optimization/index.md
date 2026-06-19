# AlembicAgent Architecture Optimization (Post-Convergence)

Status: in execution / direct-execution mode (user-authorized, commit-per-round, no dispatch) / repo-internal scope
Maintained Window: AlembicWorkspace
Date: 2026-06-19

## Execution Log

- **AAO1 dead-code removal — COMPLETE** (~900+ LOC). Agent commits: 6 dead local
  capability classes `298ad65`; `AgentRouter`+`PresetName` `cbc457b`;
  `ConsolidationGate` `a01d8ff`; migration metadata + `StrategyRegistry` `c1c4bbe`;
  `AiProvider` retry/circuit/slot machinery `6b55c5f`. Every round green (240/240),
  G5 + floor regenerated deliberately, cross-repo verified.
- **AAO1 corrections from cross-repo verification** (audit findings were imprecise):
  `WorkflowRegistry`/`LightweightRouter` are live host API (kept); `ExitController`'s
  5 "dead" methods are exercised by the main-repo `ExitController.test.ts` suite —
  they are tested public API, so reclassified to **AAO5** (finish the loop wiring +
  drop the inline duplication, behavior-sensitive); `RuntimeCapabilityCatalog`'s
  no-op methods are duck-typed by AgentRuntime (cosmetic alias cleanup, AAO5).
- **New finding (surfaced during AAO1.5, AAO2):** `forcedSummary`'s
  `aiProvider._circuitState === 'OPEN'` check is always-false dead behavior — the
  provider circuit moved to the gateway's ReliabilityController; `_circuitState` was
  kept (CLOSED) for behavior preservation. Rewire to the gateway circuit (or remove
  the dead branch) under AAO2.

### AAO2 (correctness) — in progress

- **AAO2.1 `ea92bc6`** — finished the gateway-circuit migration: removed the dead
  `forcedSummary` `_circuitState` pre-check + the now-write-only `AiProvider._circuitState`
  field. Proven behavior-identical (the gateway's `ReliabilityController.run()`
  fast-fails `CIRCUIT_OPEN` before any network call → forcedSummary's existing catch
  already routes to the synthetic summary). Cross-repo verified; gate green 240/240.
- **AAO2.2 `23041ad`** — `classifyLlmError` no longer counts programmer errors
  (TypeError/ReferenceError/SyntaxError/RangeError) as server errors, so a
  deterministic code bug can't trip the circuit breaker and masquerade as an AI
  outage. Added a regression test; dropped a dead `classifyLlmError` import from
  AiProvider. Gate green 241/241.
- **Audit correction — tool diagnostics (`EMPTY_DIAGNOSTICS`) is largely a false
  alarm.** Verified the real flow: degrade/block/gate/timeout signals are recorded
  *directly* into the loop-level `DiagnosticsCollector` by the pipeline/strategy
  (`recordBlockedTool`/`recordGateFailure`/`markDegraded`/`recordTimedOutStage`),
  and `merge()` folds them correctly. The per-call `ToolRouterAdapter` envelope is
  empty because a single `ToolResult` (ok/data/error/_meta) carries no degrade/
  fallback signal, and `recordToolCallEnvelope` doesn't read `envelope.diagnostics`
  anyway. The one genuine residual: handlers `terminal.ts`/`code.ts` degrade
  internally with no `ToolResult` channel to surface it to the per-call
  `diagnosticSummary` — a `ToolResult` contract extension, reclassified to **AAO3**
  (contract work), not a quick adapter patch.

- **Audit correction — "ToolRouter timeout/abort guard" is a false alarm (caught
  pre-commit by the gate).** A router-level abort pre-check was prototyped but it
  broke `routes V2 terminal cancellation as a structured partial timeout result`:
  the kernel `ToolRouter` **deliberately** passes `ctx.abortSignal` through to
  handlers so long-running ones (terminal, code) produce graceful *partial* results
  (`ok:true`, `[timeout] partial output`, exit 137) — abort is not a hard fail. The
  loop already stops issuing new calls post-cancel (`AgentRuntime` abort check), and
  fast/bounded handlers need no deadline. The router-level guard was reverted
  entirely (working tree clean); abort is correctly delegated. The host path
  (`LightweightRouter`) already has `#executeWithControls` timeout+abort for its
  surfaces. No change warranted.

**AAO2 status: effectively complete.** The two genuine correctness defects —
forcedSummary dead circuit (AAO2.1) and the circuit-breaker error-classification
(AAO2.2) — are fixed. The remaining audit items in this phase (tool diagnostics,
abort guard) were verified false alarms; the one real residual (ToolResult lacks a
handler-degrade channel) is reclassified to **AAO3**. Four AAO findings total were
corrected by verification (ExitController, RuntimeCapabilityCatalog, EMPTY_DIAGNOSTICS,
abort guard): the audit was directionally right but over-counted dead/broken.

### AAO0 (test safety net) — COMPLETE (test-net half)

Targeted the genuine critical-path coverage gaps before any AAO5 decomposition.

- **AAO0.1 `531414a`** — `ClaudeTransport` (the *primary* provider) and
  `GoogleTransport` (Gemini) had **zero** dedicated tests despite carrying bug-prone
  protocol translation. Added focused fetch-stub tests: Claude tool_result→user-turn
  merge, system-prompt lift, tool_choice mapping, response/usage parsing, headers;
  Gemini assistant→model rename, functionResponse parts, functionCallingConfig mode,
  schema sanitization, API-key-in-URL, thoughtSignature round-trip.
- **AAO0.2 `ad52902`** — `ToolRouter` per-tool lock serialization test
  (concurrency:'single' via terminal.exec, asserts maxActive===1) + `AiFactory`
  fallback gate (pins that rate-limit/429 is NOT a geo/provider error → no needless
  provider switch; plus getAvailableFallbacks / createProvider).
- **AAO0.3 `2609e77`** — coverage thresholds (user-approved `@vitest/coverage-v8`
  devDep). Pinned a ratchet floor just below the baseline (S52/B42/F56/L52; baseline
  S52.89/B43.21/F57.3/L52.94 over imported files); `npm run test:coverage`. Coverage
  can only climb from here.
- **Deferred (user decision):** the layering-governance half (split `agent/` into
  sub-areas in `layer-contract.json`, refresh census/edge pins) — judged better to
  co-evolve with the AAO5 decomposition than to pin sub-area boundaries beforehand.

### AAO3 (contract work) — in progress

- **AAO3.1 `a3cb414`** — closed the AAO2 diagnostics residual. Handlers degraded
  internally with no channel to surface it (terminal SIGKILL/timeout partial;
  code.search regex fallback when ripgrep fails), so every per-call diagnosticSummary
  read `degraded:false`. Extended the internal `ToolResultMeta` with optional
  `degraded?`/`fallbackUsed?`, set them at the two verified producers, and mapped them
  in `ToolRouterAdapter` → envelope diagnostics. Public surface unchanged (smoke 13
  exports); **cross-repo verified** (Alembic `tsc --noEmit` exit 0 against the rebuilt
  agent dist). Gate green 260/260.
- **AAO3 remaining items assessed as non-genuine.** *Contract versioning* contradicts
  the V1/V2 convergence (kernel/index.ts: "there are no version labels left"); re-adding
  a marker is regressive ceremony for a symlinked single consumer. *DI typing* — the
  DI surface is already typed; the 19 scattered `as unknown as` casts are boundary
  bridges, not a concentrated gap. **AAO3 is effectively complete** (the diagnostics
  channel was its genuine content).

### AAO6 (break the agent⇄tools cycle) — COMPLETE

- **AAO6 `2fba4a8`** — executed the cleanupTrigger the layer-contract itself recorded:
  the lone `tools→agent` inversion was `RuntimeCapability extends` the agent-owned
  `Capability` base. Moved `Capability.ts` (a zero-import leaf) into the tools leaf
  `tools/runtime/capabilities/`, repointed the 3 import sites downward, and retired the
  contract's `blessedImports` + marked `cycleFindings` RESOLVED. Verified: zero
  `tools→agent` imports remain; layer lint passes with an empty blessed list; smoke
  unchanged (13 exports, `Capability` preserved via the facade); **cross-repo safe**
  (main repo doesn't import Capability directly; Alembic `tsc` exit 0). Gate green 260/260.

## Status summary (2026-06-19)

Genuine work landed: **AAO1** (dead code, ~900 LOC) · **AAO2** (forcedSummary circuit,
errorClassify breaker) · **AAO0** (test net: transports/lock/AiFactory + coverage ratchet)
· **AAO3** (diagnostics channel) · **AAO6** (cycle break). Tests 240→260, coverage ratchet
enforced, every round cross-repo-green. Five audit findings corrected by verification.
Remaining: **AAO4** (duplication, unassessed) and **AAO5** (god-object decomposition —
the biggest/most behavior-sensitive change, held for explicit user go-ahead); the AAO0
layering-governance sub-area split stays deferred to co-evolve with AAO5.

Design Key: alembic-agent-architecture-optimization

## Lineage

Successor to the completed `alembic-agent-comprehensive-optimization`
(accepted 2026-06-12, HEAD `35901cf`). That round left the tool convergence
*partial* (V1 importers reduced to zero behind a `ToolRuntimeBridge`; public
`./tools` and the V2 labels preserved) and did not land the AgentRuntime
decomposition. The 2026-06-19 session **completed** the convergence (deleted
the bridge + core shims + `v2/types` shim; renamed `tools/v2 -> tools/runtime`;
dropped every V1/V2 label; one `src/tools/kernel` contract) and fixed a stale
pre-existing test. This demand addresses the **remaining + newly-surfaced
debt** against the current post-convergence tree.

## Controller Judgment

A two-pass multi-agent architecture review (6 subsystem maps -> 6 dimension
reviews -> per-finding adversarial verification) produced **39 verified
findings** (1 critical, 13 high, 18 medium, 7 low), all file:line-grounded.

The architecture is fundamentally healthy: `src/ai` is a clean leaf (zero
upward cross-area imports), the tool convergence succeeded, and the validation
gates are real. Debt concentrates in: (1) god-objects (AgentRuntime 2758 /
PcvNodeEvidence 1669 / ActiveContext 1378 / ContextWindow 1209 /
PipelineStrategy 1104 / AiProvider 869 LOC), (2) two genuine correctness gaps
(production tool degradations are invisible — `ToolRouterAdapter` hardcodes
`EMPTY_DIAGNOSTICS`; the production router has no timeout/abort guard while the
host router does — both violate AGENTS.md:146), (3) half-finished migrations
(dead capability classes, `AgentRouter`, `ConsolidationGate`, unwired
`ExitController` methods, dead `AiProvider` reliability machinery), (4) a tool
contract that is now unversioned/non-replayable (violates AGENTS.md:144), and
(5) pervasive duplication (token estimation 5x, provider key->env 3x,
`summarize()` 5x).

Cross-repo verification corrected two "dead" candidates: `WorkflowRegistry`
and `LightweightRouter` ARE live public API consumed by the Alembic main repo
(`WorkflowAdapter`, `AgentModule.setRouter`) — keep + document, do not delete.

## Entry Points

- Audit evidence base:
  [arch-audit-findings-2026-06-19.md](arch-audit-findings-2026-06-19.md)
- Requirement design:
  [requirement-design-2026-06-19.md](requirement-design-2026-06-19.md)

## Phase Order

| Phase | Title | Window | Risk |
| --- | --- | --- | --- |
| AAO0 | Layering governance + test safety net | AlembicAgent | low |
| AAO1 | Dead-code removal (cross-repo verified) | AlembicAgent | low |
| AAO2 | Observability + boundary robustness (correctness) | AlembicAgent | medium |
| AAO3 | Contract unification + versioning + DI typing | AlembicAgent | medium |
| AAO4 | Duplication consolidation | AlembicAgent | low |
| AAO5 | God-object decomposition | AlembicAgent | high |
| AAO6 | Break the tools->agent capability cycle | AlembicAgent | low |

Execution order: AAO1 may start immediately (no safety-net dependency);
AAO0 governance + tests precede AAO5; AAO2 (correctness) is highest value.

## Completion Definition

Each verified finding is either resolved or explicitly deferred with a recorded
reason; AgentRuntime and the other five god-objects drop below a stated
LOC/responsibility threshold; production tool degradations are observable
(envelope diagnostics + logs) and abortable; the kernel contract is versioned;
token estimation has a single source; no V1/V2 or migration-phase residue; the
tools->agent cycle is gone; the AlembicAgent gate matrix and downstream Alembic
build stay green at every commit.

## Non-goals

- No cross-repo behavior change to the Alembic main repo public surface (the
  library export NAMES/shapes stay stable; external consumers unaffected).
- No AlembicPlugin / AlembicCore / AlembicDashboard changes.
- No new product features; this is structural/quality optimization only.
- No version bump unless user-directed.
