# AlembicAgent Architecture Optimization — Requirement Design

Status: in execution / direct-execution mode / repo-internal scope
Maintained Window: AlembicWorkspace
Date: 2026-06-19
Design Key: alembic-agent-architecture-optimization

## Problem

Post tool-convergence (2026-06-19), a verified multi-agent architecture review
found 39 file:line-grounded issues. Two are genuine correctness/observability
gaps that violate AGENTS.md; the rest are maintainability debt (god-objects,
half-finished migrations, duplication, unversioned contracts, coarse layering
governance). The repo is a library whose sole consumer is the Alembic main
repo, so deletions and contract changes must preserve the public export
name/shape surface and stay green against the downstream build.

## Goal

The AlembicAgent tree is observable, replayable, and decomposed enough to
evolve safely:

1. Production tool degradations (timeout/partial/fallback/skip) are encoded in
   `ToolResultEnvelope.diagnostics` and logged, and are abortable.
2. The tool contract is versioned and deterministic (replayable).
3. No dead/half-wired code: capability classes, `AgentRouter`,
   `ConsolidationGate`, unwired `ExitController`/`StrategyRegistry` paths, dead
   `AiProvider` reliability machinery, migration-phase metadata are gone or
   finished.
4. Single source for token estimation, provider key->env, `summarize()`,
   strategy resolution, the envelope type-guard.
5. The six god-objects are split along their real seams.
6. Internal layering direction is enforced (agent/ sub-areas), and the
   tools->agent capability cycle is removed.

## Non-goals

- No change to the Alembic main-repo public surface (export names/shapes
  stable; `WorkflowRegistry` and `LightweightRouter` are live host API — keep).
- No Plugin/Core/Dashboard edits. No new features. No version bump unless
  user-directed.
- Do not statically prune tool *actions* without runtime-usage evidence.

## Phase Sequence

### AAO0 — Layering governance + test safety net (low risk)
Foundation that guards the later refactors.
- Split `agent/` into sub-areas in `config/layer-contract.json` +
  `scripts/lint-layer-contract.mjs` (at minimum runtime / service /
  coordination / context / memory) with an allowed intra-agent matrix; refresh
  the stale census (claims 44/18 @ 6bf266e; reality 43/11) and pin per-edge
  counts. [findings: layering-opaque (H), census-stale (M), direction-asymmetry (L)]
- Replace the substring-presence validation floor with a real coverage
  threshold (vitest --coverage, per-area minimums on `src/ai/transport`,
  `src/tools/runtime`, strategies). [finding: floor-substring (M)]
- Add the missing safety-net suites BEFORE decomposition: `ClaudeTransport` +
  `GoogleTransport` protocol tests, production `ToolRouter` concurrency-lock
  test (and fix the check-then-act race), `AiFactory.getProviderWithFallback`
  test, a reusable mock-provider harness (AGENTS.md forbids real-key tests).
  [findings: transport-tests (H), router-lock-test (M), fallback-test (M)]
- **Completion:** sub-area direction lint-enforced; each AAO5 target has a
  behavioral regression test; coverage thresholds in `npm run check`.
- **Validation:** `npm run check` green incl. the new lint pass + coverage.

### AAO1 — Dead-code removal (low risk; cross-repo verified)
- Delete (verified zero main-repo consumers): `AgentRouter`; the 5 local
  capability classes (CodeAnalysis/EvolutionAnalysis/KnowledgeProduction/
  ScanProduction/SystemInteraction) + their barrel aliases; `ConsolidationGate`
  + the unused `domain/index` barrel; the `alembicAgentPackage`
  migrationPhase/implementationStatus fields; `StrategyRegistry`'s unused
  create/_registry path; the `AiProvider` reliability machinery (migrated to
  `ReliabilityController`); collapse `RuntimeCapabilityCatalog`'s 5 no-op
  projection methods. [finding: dead-modules (H) + low items]
- `ExitController`: either finish the migration (route the inline
  empty-response / AI-error / toolChoice / end-of-iteration exits through
  `checkAfter*`) or delete the 5 unwired methods. Pick one. [finding (H)]
- Keep (corrected): `WorkflowRegistry`, `LightweightRouter` — live host API;
  add a documented consumer/cleanup note instead.
- Retire `ai-provider.test.ts:287-368` (dead-path tests) and lower the floor.
- **Completion:** ~1170+ LOC removed; no dangling imports; both repos
  build/test green; G5 export count + floors updated deliberately.

### AAO2 — Observability + boundary robustness (medium risk, highest value)
The two real correctness gaps + AGENTS.md:146 compliance.
- `ToolRouterAdapter.#toEnvelope/#errorEnvelope`: derive real diagnostics from
  `ToolResult._meta` + outcome (status timeout/partial; fallbackUsed/
  timedOutStages/truncatedToolCalls) — stop shipping `EMPTY_DIAGNOSTICS`.
  [findings: adapter-empty-diag (H x2)]
- Thread `ctx.logger` into handlers; log every fallback/degrade/timeout/
  parser-skip/sandbox-bypass branch with trigger + path + status.
  [findings: handler-no-logs (H), silent-fallbacks (H)]
- Add a timeout+abort race guard to the production `ToolRouter`/Adapter
  (mirror `LightweightRouter.#executeWithControls`), OR collapse the two onto
  one guarded pipeline. [finding: asymmetric-robustness (H)]
- knowledge/graph/memory/meta handlers honor `ctx.abortSignal` and pass it to
  core calls (so cancelled backend work stops). [finding: handlers-ignore-abort (M)]
- `DiagnosticsCollector.recordToolCallEnvelope` merges `envelope.diagnostics`
  into the aggregate. [finding: diag-dropped (M)]
- Tighten `errorClassify`: no-status internal throws are not server errors
  (don't trip the breaker on code bugs). [finding: classifier-overtrips (L)]
- **Completion:** a timed-out/cancelled/degraded tool call is visible in
  run-level `AgentResult.diagnostics` with a log; covered by tests.

### AAO3 — Contract unification + versioning + DI typing (medium risk)
- Resolve the dual "canonical": designate `ToolResult` = handler-internal,
  `ToolResultEnvelope` = wire (remove duplicate canonical claims); make the
  adapter preserve `_meta` (token estimate currently lost). [finding (M)]
- Add `schemaVersion` to the kernel envelope/registry; separate deterministic
  payload from per-run metadata; replace `Date.now()` / `gemini_fc_${Date.now()}`
  ids with deterministic/seeded ids (AGENTS.md:144 versioned + replayable).
  [finding: unversioned-contract (H)]
- Single `isToolResultEnvelope` (delete the divergent `ActiveContext` copy).
  [finding (M)]
- Type `ToolContext`'s 9 `unknown` DI services with kernel-defined `*Like`
  interfaces (wiring errors move to compile time). [finding (M)]
- **Completion:** kernel contract carries a version; deterministic payload is
  replay-stable; one envelope guard; DI services typed.

### AAO4 — Duplication consolidation (low risk, mechanical)
- One token estimator: `shared/tokenUtils` (kernel imports `#shared`, already
  permitted); delete the 5 divergent copies. [finding (H)]
- One provider key->env source (`ProviderConfig`); `summarize()` on the base
  class; one provider-guessing path. [finding (M)]
- One strategy-resolution owner (compiler; builder consumes its output, no
  re-resolve); `AgentStageFactoryRegistry` looks stages up by name, not index.
  [findings: double-strategy (M), stage-index (H)]
- Dedup evolution decision-parsing (2x) and the Producer system prompt (2x);
  `buildAnalystPrompt` named/options args (slot-9 cast bug makes the Evolution
  section dead). [findings: arg-slot-mismatch (M)]
- **Completion:** each consolidated concern has exactly one definition; no
  behavioral change (comparison tests where shapes are public).

### AAO5 — God-object decomposition (high risk; gated on AAO0 safety net)
Behavior-preserving extraction along real seams:
- `AgentRuntime` (2758): extract redaction/sanitize, developer-visible
  formatting, the DeepSeek/Gemini provider-quirk policy (currently regex on
  modelRef inside the generic loop), LLM-input validation. [finding: CRITICAL]
- `ActiveContext` (1378): split WorkingMemory vs ReasoningTrace; dedup APIs.
- `ContextWindow` (1209): extract the stateless `ToolResultLimiter` + the
  5-layer compaction engine.
- `PipelineStrategy` (1104): extract the gate state machine + timeout harness.
- `PcvNodeEvidence` (1669): contain the module-level WeakMap state.
- `AiProvider` (869): split base contract / DTO types / gateway wiring; move
  out the language-profile table.
- **Completion:** each module under a stated threshold; external behavior
  unchanged (regression suite green); per-concern modules independently
  testable.

### AAO6 — Break the tools->agent cycle (low risk)
- Move `agent/capabilities/Capability.ts` (zero-import pure abstract) into a
  leaf (shared/ or a tools-owned contract); `RuntimeCapability` subclasses
  downward; remove the blessed cycle entry in the layer contract. [finding (M)]
- **Completion:** zero tools->agent runtime edges; layer contract has no
  special-cased cycle.

## Producer/Consumer Order

Single window: **AlembicAgent** (repo-internal scope per the user request).
The **Alembic** main repo is a downstream **build-validation** gate only — the
deleted symbols have no main-repo consumers, and AAO3 keeps external shapes
stable, so no main-repo source change is expected (rebuild its dist before
running its tests, since `#tools/*` resolves to compiled dist). If any phase
proves a public-shape change is unavoidable, stop and route a main-repo
consumer-migration sub-step.

Phase dependencies: AAO1 independent (start first). AAO0 governance + tests
precede AAO5. AAO2/AAO3/AAO4 independent of each other. AAO6 after AAO1.

## Completion Definition

See index.md. Each commit keeps the AlembicAgent gate matrix (build:check +
lint + 8 boundary lints + smoke:public-signatures + validation-floor + vitest)
green and the downstream Alembic build green; every G5/floor count change is
deliberate and lint-guarded; every deferred finding has a recorded reason.

## Validation Requirements

- Per round: AlembicAgent `npm run check` (node 22) green; affected Alembic
  build + tests green after a main-repo rebuild.
- AAO2: a test proving timeout/cancel/degrade is observable + abortable.
- AAO5: behavioral regression suite green before and after each extraction.
- Public-shape changes gated by smoke:public-signatures (regenerate hashes
  deliberately, as in the convergence).

## Stop Conditions

- A deletion would remove a symbol with a main-repo consumer -> stop, treat as
  public API, keep + document.
- A god-object extraction cannot prove behavior preservation -> stop, return
  the slice with the missing evidence.
- A contract change would alter the public wire shape -> stop, require
  confirmation + a main-repo migration sub-step.
- Any confirmed primary metric/gate regresses -> preserve evidence, mark
  pending decision, return to the same chain.

## Decisions And Open Items

- Execution mode: **direct** (user-authorized 2026-06-19), commit-per-round on
  main, no push, no version bump.
- Open: AAO0 layer sub-area granularity (5 sub-areas vs finer); AAO2
  two-routers-guarded vs one-collapsed-router; AAO3 dual-shape converge-to-one
  vs designate-roles — to be decided at each phase from code evidence,
  defaulting to the lowest-risk behavior-preserving option.
