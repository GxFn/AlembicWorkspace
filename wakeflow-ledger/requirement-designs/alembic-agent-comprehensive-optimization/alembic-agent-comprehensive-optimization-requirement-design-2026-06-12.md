# AlembicAgent Comprehensive Optimization Requirement Design

Status: candidate / user-requested 2026-06-12 / repo-internal scope / needs controller intake
Date: 2026-06-12
Design Key: alembic-agent-comprehensive-optimization
Primary Product Window: AlembicAgent
Related Window: Alembic (one coordinated import-update commit when `./tools` retires; Plugin not involved)
Validation Surface: AlembicWorkspace controller; Test only if a real-scenario gap appears

## Problem

AlembicAgent has the strongest gates in the workspace (15 exact public
exports, import-boundary ratchets, blocking check pipeline) but the largest
untested mass and an unresolved dual tool system (evidence:
[agent-audit-findings-2026-06-12.md](agent-audit-findings-2026-06-12.md)):

- `./tools` exports V1 and V2 together with no separation; the V1 runtime
  is live and unmarked; 16 importer sites cling to V1 contracts — exactly
  the debt RC6 SD-3 accepted a two-phase convergence route for.
- `AgentRuntime` is a 2,679-line monolith; MemoryStore ownership is frozen
  pending SD-4; "tool/session/memory/agent" are each overloaded; feature
  flags have no registry.
- Edge behavior has sharp corners: the concurrency slot check-then-
  increment race can exceed the cap; `MemoryStore.add()` can crash the
  agent uncaught; evidence-retrieval failure masquerades as "no evidence";
  an aborted long job loses everything (no checkpoint); tool args and
  prompts have no size bounds.
- 29 test files cover 214 source files: forge, tasks, policies, profiles,
  and coordination have zero tests; V2 adapter wiring and terminal session
  execution/cancellation are unexercised; the public-api gate checks
  counts, not signatures.

## Goal

1. One tool system: the SD-3 route executed — contracts vocabulary in a
   neutral home, V1 runtime deleted, `./tools` retired/repointed, V2 the
   only path — guarded by the RC3 lints at every step.
2. Clear internal responsibility: AgentRuntime decomposed along its real
   seams, MemoryStore settled per SD-4 with a schema tripwire, a published
   glossary, flags under a registry.
3. Honest edge behavior under the write-strict/read-tolerant posture:
   atomic slot accounting, typed memory-write errors, visible degraded
   evidence reads, bounded inputs, recovery state that survives aborts.
4. A real test floor: the zero-coverage public areas get suites, V2 wiring
   and terminal execution get integration tests, provider failure fixtures
   exist, and the floor itself is snapshot-ratcheted.

Repo-internal only, except one coordinated Alembic import-update commit
when `./tools` retires (Plugin is not a consumer and is not touched).

## Non-goals

- No `@alembic/core` import-path changes (CO1 owns the wave); the 51-ref
  core-import baseline may only shrink.
- No weakening of any RC3 boundary config or demonstrated-failure gate.
- No MemoryStore migration to Core (SD-4 accepted route keeps the adapter
  in Agent; Option-C end state stays a recorded trigger).
- No new agent capabilities or provider integrations.
- No cross-repo interface negotiation (planned interface-alignment demand
  after CO + AO + AG + CKG); no AlembicPlugin edits; no version bumps
  without user direction.

## Candidate Demand Sequence

### AG0 - Fact Freeze And Decision Matrix (AlembicWorkspace)

- re-verify findings A1-D6, freeze counts (16 importer sites, catch
  census, zero-coverage list);
- confirm SD-3 absorption as AG1 and SD-4 absorption into AG2;
- user confirmations: the silent→loud list under the inherited
  write-strict/read-tolerant posture; whether abort-recovery checkpoints
  are in scope now (new persisted state) or recorded as a follow-up;
- fix AG4 numeric targets and the AG1 phase gates.

### AG1 - V1→V2 Tool System Convergence (AlembicAgent; SD-3 route)

Two explicit phases inside one demand, each gated:

- phase 1 (behavior-preserving): extract the contracts vocabulary
  (ToolContracts, ToolCallContext, ToolResultEnvelope and peers) to a
  neutral home; re-point the 16 importers (the 6 type-only first); all
  RC3 lints and the 197-test floor stay green at every step;
- phase 2: collapse `V2ToolRouterAdapter`, delete the V1 runtime
  (LightweightRouter and peers), retire or repoint the `./tools` export,
  update expectedCounts deliberately under the RC3 G5 lint with a
  demonstrated mismatch failure;
- the Alembic window lands its coordinated import-update commit in the
  same wave (its own commit, build green);
- close the D10 legacy-rewrite markers in AgentInterfaceContract as part
  of the surface finalization.

### AG2 - Internal Responsibility And Semantics (AlembicAgent)

- decompose AgentRuntime along its real seams (event bus, diagnostics,
  budget, LLM assembly extracted; orchestration loop stays) —
  behavior-preserving, public exports unchanged;
- SD-4 execution: schema-shape tripwire test (fail+pass proof pair) for
  the MemoryStore adapter; Option-C end-state note appended to the RC3
  boundary register;
- glossary published (tool/session/memory/agent) and reflected in types or
  doc comments; ModelRegistry access routed through the declared boundary;
- feature flags get a registry (name, owner, default, production
  relevance); internal-only flag clusters become typed modes;
- `ApiResponse` loose typing contained behind a documented boundary.

### AG3 - Failure Semantics And Edge Hardening (AlembicAgent)

Posture: write strict, read tolerant.

- atomic slot accounting in ReliabilityController/AiProvider (race test
  proves the cap holds under contention);
- `MemoryStore.add()` failures become typed errors handled by the
  coordinator; evidence-retrieval failure returns a visibly degraded
  result, never a silent `[]`;
- tool-arg size bounds and prompt-length validation with stable error
  codes;
- abort handling per the AG0 ruling: at minimum, a diagnostic recovery
  record on abort; full resume checkpoints only if confirmed in scope;
- proxy dispatcher cache eviction; circuit-cooldown race fixed; hook
  errors surface diagnostics;
- provider robustness preserved (timeout/retry/circuit untouched except
  the named fixes).

### AG4 - Test And Gate Floor Closure (AlembicAgent)

- suites for forge, tasks, policies, profiles, coordination (the
  zero-coverage public areas), with counts fixed by AG0;
- V2 router/adapter integration tests binding real tool calls; terminal
  session execution and cancellation tests;
- provider failure fixtures: malformed body, mid-stream drop, streaming
  abort;
- public-api gate upgraded with a signature-level smoke on the stable
  exports (breaking-change detection), provisional tier policy documented;
- validation-floor snapshot file (test count, export count, core-ref
  count, pack entries) checked by the pipeline, shrink/grow rules stated.

### AG5 - Final Acceptance And Archive (AlembicWorkspace)

- full gate matrix green: check pipeline (6 stages), smoke public imports,
  release guards, new signature smoke and floor snapshot;
- downstream Alembic build green after the `./tools` retirement;
- controller reviews raw diffs, demonstrated gate failures, census deltas
  (importer count 16→0 for V1, zero-coverage list closure), accepts and
  archives.

## Producer/Consumer Order

AG0 → AG1 (the only step with a cross-window consumer commit: Alembic
import update) → AG2 → AG3 → AG4 → AG5. Plugin is never involved.

## Completion Definition

- One tool system: V1 runtime gone, `./tools` retired/repointed, contracts
  in a neutral home, expectedCounts updated under the G5 lint, D10 markers
  closed.
- AgentRuntime decomposed; SD-4 tripwire in place; glossary published;
  flags registered.
- Slot cap holds under race; memory writes fail typed; degraded reads are
  visible; inputs bounded; abort leaves a recovery record.
- Zero-coverage areas have suites; V2 wiring and terminal execution
  tested; provider failure fixtures exist; signature smoke and floor
  snapshot gate the pipeline.
- All gates and the Alembic downstream build green; controller acceptance
  from raw evidence; archived.

## Validation Requirements

Per demand: the full check pipeline (build:check, biome,
lint:agent-import-boundary, lint:public-api-boundary,
lint:core-import-boundary, 197+ tests) plus each newly introduced gate
with one demonstrated failure. AG1 additionally: per-phase lint/test
green proof and the Alembic downstream build. AG5 adds smoke public
imports, release guards, and Wakeflow verification.

## Stop Conditions

- Any RC3 boundary config or demonstrated-failure gate would be weakened.
- A V1 contract consumer outside the 16 frozen sites appears — stop,
  re-freeze, decide.
- A change would alter the public surface beyond the SD-3-planned
  retirement, or visible behavior beyond the AG0-confirmed list.
- Core-import references would grow above the 51 baseline.
- Any step would require editing AlembicPlugin — defer with owner +
  post-CKG trigger.
- Prose-only evidence.

## Decisions And Open Items

Adopted from the user's 2026-06-12 decisions (same-logic request):
write-strict/read-tolerant posture; single-wave packaging per demand;
Plugin hands-off globally; version bumps user-directed.

For AG0 confirmation: SD-3/SD-4 absorption (recommended yes — they ARE
this repo's interface debt); the silent→loud item list; abort-recovery
checkpoint scope (minimum diagnostic record vs full resume — full resume
adds persisted state and is the one genuinely new capability question
here); AgentRuntime decomposition seam list.
