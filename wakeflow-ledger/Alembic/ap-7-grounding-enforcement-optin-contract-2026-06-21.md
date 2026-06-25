# AP-7 — Grounding-enforcement per-invocation opt-in contract (PCVM/Test)

Date: 2026-06-21 · Window: Alembic · Demand: alembic-agent-pcv-observe-only-boundary-2026-06-20 · Task: AP-7 (rework, direction A)
Decision: user-confirmed **Option A — explicit per-invocation opt-in** (controller event evt-…-0032).

## Contract

Quality-validation sessions (PCVM / progressive-chain-validation Test) opt a single bootstrap run into
grounding **guard** by setting an environment variable **before** they trigger the in-process bootstrap
(`AiDimensionPipeline → AiDimensionSessionRunner → agentService.run`, FC4):

```
ALEMBIC_GROUNDING_ENFORCEMENT=guard   # restore analyze grounding block + nudge + rollback for this run
ALEMBIC_GROUNDING_ENFORCEMENT=off     # explicit observe-only (same as default)
# unset / any other value             # default → observe-only (no override, zero behavior change)
```

- This is a **per-invocation / per-process** signal (PD7 granularity): set it for the quality-validation
  process that launches the bootstrap; normal user bootstrap / rescan / incremental runs leave it unset
  and stay observe-only (PD6 scope: guard only for PCVM/Test).
- PCVM/Test are markdown skills with no TS path (AP-0/FC4), so the opt-in is carried by env, not code.

## How it works (wiring, Alembic main)

1. `resolveBootstrapGroundingEnforcement(env=process.env)` (`lib/workflows/ai-execution/AiDimensionSessionRunner.ts`)
   reads `ALEMBIC_GROUNDING_ENFORCEMENT` → `'guard' | 'off' | undefined`.
2. `runAiDimensionSession` resolves it and passes it to `buildBootstrapSessionExecutionInput`
   (`lib/workflows/ai-execution/SessionExecutionBuilder.ts`), which adds it to the **session** `execution`
   block **only when set** (otherwise the block is byte-identical to before).
3. The Agent run coordinator copies the session `execution` to every child dimension input
   (AlembicAgent `AgentRunCoordinator` `execution: input.execution`), so each dimension's `runtime.execute`
   resets `#groundingEnforcement` to the opted value → `LoopContext.groundingEnforcement` → the analyze
   grounding guard fires (CP1 policy text + CP4 block/nudge) only when `'guard'`.

## Verification

- Unit (Node ≥ 22): `resolveBootstrapGroundingEnforcement` env parsing (guard/off/unset/invalid) +
  `buildBootstrapSessionExecutionInput` carries `execution.groundingEnforcement='guard'` only when set
  (default → undefined; `shouldAbort`/`abortSignal` unchanged). `test/unit/AiDimensionSessionRunner.test.ts`
  + `test/unit/BootstrapSessionExecutionBuilder.test.ts`.
- Downstream guard activation (session execution → `#groundingEnforcement` → guard block/nudge) is the
  AP-3 per-run seam, verified end-to-end by AP-5 (AlembicAgent five-scenario acceptance, off vs guard).
- Concurrency: SAFE — each dimension runs on its own `AgentRuntime` instance (per-child `agentService.run`
  → `runtimeBuilder.build`), so per-run `#groundingEnforcement` is isolated, not raced.

## Boundary

- Only opt-in wiring added (PD6: method package body unchanged); AlembicAgent / AP-5 / AP-6 files untouched;
  four-tool external MCP semantics unchanged; default observe-only behavior preserved.
