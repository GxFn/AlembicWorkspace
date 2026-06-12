# Alembic Space Architecture Deepening Requirement Design

Status: candidate / user-requested 2026-06-12 / cross-repo scope, Plugin participation post-CKG / needs controller intake
Date: 2026-06-12
Design Key: alembic-space-architecture-deepening
Primary Windows: per demand (AlembicCore, Alembic, AlembicAgent, AlembicDashboard; AlembicPlugin joins charters/gates post-CKG)
Validation Surface: AlembicWorkspace controller; Test for real-scenario evidence when assigned

## Problem

The repo-internal sequences hardened each house and IC is closing the
wire-level seams. What no demand owns yet is the architecture itself
(evidence:
[architecture-deepening-findings-2026-06-12.md](architecture-deepening-findings-2026-06-12.md)):

- The inter-repo dependency DAG is healthy but exists only as habit — no
  single space-level allowed-edge rule that every repo's gate consumes, no
  gate asserting Dashboard's zero-package-dependency stance.
- No repo has a confirmable functional charter; capability-placement
  questions (SD-1 sinking, SD-6 observability, R-1 surfaces, SD-4 end
  state) are parked in scattered registers.
- Internal layer contracts are uneven: Core has contract + blocking
  direction lint; Alembic (16 areas) and Agent have neither; Dashboard has
  no internal conventions artifact.
- Boundary purity is ~30%: 47 direct `Logger.getInstance()` calls, 53
  direct `pathGuard` imports, 47+ service-locator route sites, module-scope
  mutable state without lifecycles (SSE sessions, rate-limit buckets,
  guard review state, parser caches), import-time work (cached auth
  secret), and event listeners without disposal (SSE ×4, per-job,
  module-init subscriptions).
- The foundational layer is stable with four audited, bounded upgrades
  worth a deliberate wave: prepared-statement caching on hot queries,
  profile-gated AST worker pool, provider-aware embedding concurrency,
  signal backpressure — plus an undocumented realtime delivery contract.

## Goal

1. **Space architecture charter**: one ledger artifact defining each
   repo's functional charter (owns / consumes / must-never) and the
   allowed inter-repo dependency DAG — machine-readable, consumed by every
   repo's gates.
2. **Interface confirmation**: every cross-repo interface mapped to a
   charter line; capability-placement questions resolved systematically
   into per-item user decisions (absorbing SD-1 phase 2 evaluation).
3. **Internal layer contracts everywhere**: Core's written-contract +
   blocking-direction-lint pattern replicated to Alembic and Agent, a
   light conventions contract for Dashboard.
4. **Deep decoupling and isolation under a side-effect doctrine**: no
   work at import time; all effects behind injected, disposable
   boundaries; module-scope mutable state moved into managed lifecycles;
   a blessed-singleton list for the few justified globals; listener
   disposal mandatory and tested.
5. **Foundational upgrades**: the AD0-confirmed base-layer list executed
   with before/after measurements; everything else explicitly recorded
   healthy.
6. **Independence and completeness**: each repo provably builds, tests,
   and stages in isolation; every public entrypoint's inflow/outflow
   effects are declared and tested — no undeclared side effects.

## Non-goals

- No duplication of IC scope (wire types, error registry, tool duality,
  DCR residue, `./tools`, SD-5 phase 2, Dashboard contract gates, Plugin
  vendor wave) — AD consumes IC outputs.
- No capability moves without per-item user confirmation; AD2 produces
  the decision register, it does not implement moves.
- No AlembicPlugin edits before CKG completes; Plugin joins charters and
  gates afterward.
- No speculative base-layer rewrites: AD5 executes only the
  AD0-confirmed, audit-grounded list (profile-gated where stated); healthy
  areas stay untouched and recorded.
- No version bumps or releases without user direction.

## Candidate Demand Sequence

### AD0 - Architecture Fact Freeze And Doctrine Gates (AlembicWorkspace)

- re-freeze F1-F5 counts; re-verify the SyncCoordinator listener question
  against the CO3 hygiene fix;
- execute within the four user gates recorded 2026-06-12 (see Decisions):
  write the doctrine as a standing-rule artifact with the
  blessed-singleton whitelist draft; fix the AD5 measurement plan and the
  AST profile threshold; specify the per-repo isolation-proof commands;
  verify the IC6→AD2 relocation pointers are in place;
- propose the doctrine compliance floor number for intake confirmation;
- draft the five functional charters for AD2 confirmation.

### AD1 - Space Dependency DAG Codification (all repos; Plugin post-CKG)

- one space-architecture ledger artifact + machine-readable allowed-edge
  config (Core ← Agent ← Alembic; Core ← Plugin; Dashboard
  zero-package-dependency);
- every repo's existing boundary gate consumes the shared config; new
  gates close the holes: Alembic-side edge assertion, Dashboard
  zero-dependency check; each gate with a demonstrated failure;
- toolchain baseline (Node/TS/biome/key deps) recorded as a space floor
  with a drift note rule.

### AD2 - Functional Charters And Interface Confirmation (AlembicWorkspace + Design inputs)

- per-repo charter confirmed: owns / consumes / must-never, written
  against real code and the IC0/AD0 censuses;
- every cross-repo interface (package facades, HTTP contract, MCP
  surfaces, daemon jobs) mapped to a charter line — unmappable items
  become placement questions;
- the systematic placement pass absorbs the parked registers: SD-1
  phase 2 (Core sinking), SD-6 (daemon observability), R-1
  (evolution/panorama), SD-4 Option-C end state — output is a decision
  register where every move is a per-item user decision, none implemented
  here.

### AD3 - Internal Layer Contracts Everywhere (Alembic, AlembicAgent, AlembicDashboard)

- Alembic: written layer contract over the 16 lib/ areas + blocking
  direction lint (Core's CO2 pattern), demonstrated failure;
- Agent: layer contract over agent/tools/ai post-decomposition seams +
  direction lint;
- Dashboard: light conventions contract (views/api/state, normalizer
  seam) + the zero-dependency gate from AD1;
- each contract names its blessed exceptions exactly (the Core
  panorama-edge precedent).

### AD4 - Decoupling, Isolation, And The Side-Effect Doctrine (AlembicCore + Alembic + AlembicAgent)

- container-manage or bless: Logger, pathGuard, ModelRegistry,
  timerRegistry — per the AD0 doctrine; the blessed-singleton list is the
  exhaustive exception set;
- replace service-locator `getServiceContainer()` route sites with
  constructed injection (count frozen at AD0, driven to the agreed floor);
- managed lifecycles for module-scope mutable state: SSE sessions,
  rate-limit buckets (eviction), guard review state, parser caches
  (policy), DaemonJobRunner fallbacks;
- import-time work eliminated: lazy auth-secret with documented restart
  semantics, config reads at construction;
- listener disposal everywhere (SSE per-connection off-on-close, per-job
  deregistration, module-init subscriptions get dispose paths) with leak
  tests;
- a doctrine lint (import-time-effect and bare-singleton patterns) wired
  per repo with demonstrated failures; compliance census re-measured
  (baseline ~30%).

### AD5 - Foundational Layer Upgrades (AlembicCore + AlembicAgent transport)

Execute the AD0-confirmed list, each with before/after measurement:

- prepared-statement LRU factory on hot repository paths
  (list/search/edges) with throughput evidence;
- AST parse profiling on a large fixture; worker-thread pool only if the
  profile crosses the AD0 threshold — otherwise record the profile and
  close;
- provider-aware embedding concurrency with transport capacity hints
  (Agent transport exposes the hint; Core BatchEmbedder consumes);
- SignalAggregator ring-buffer cap + backpressure diagnostics;
- realtime delivery-guarantee contract documented (room dropout,
  fire-and-forget semantics) with a conformance test;
- healthy-area register: WAL stance, drizzle migrations, HNSW, watcher —
  recorded as deliberate, no action.

### AD6 - Independence, Completeness, And Pure-Boundary Proof (all repos)

- per-repo isolation proof: build + test + staging pack on each repo via
  the existing staging tooling, evidence per repo;
- inflow/outflow audit: every public entrypoint family (package facades,
  HTTP routes, MCP tools, CLI, daemon jobs) gets a declared-effects note
  and a no-undeclared-effects test (state snapshot before/after on
  representative calls);
- charter completeness check: no orphan capability (code with no charter
  line), no charter line with no code;
- doctrine compliance census target met (AD0-agreed floor).

### AD7 - Space Architecture Acceptance And Archive (AlembicWorkspace)

- space gate matrix: all repos' checks + DAG gates + direction lints +
  doctrine lints green; census deltas (singleton direct-calls, locator
  sites, listener leaks, compliance %) against AD0;
- AD2 decision register delivered to the user (placement moves are
  follow-up demands, never silently executed);
- acceptance from raw evidence; ledger archive; Wakeflow verification.

## Producer/Consumer Order

AD0 → AD1 → AD2 (charters need the DAG) → AD3 → AD4 → AD5 → AD6 → AD7.
AD3/AD4 may interleave per repo at controller discretion (same-window
packages). Recommended intake position: after IC0-IC4 complete (IC5's
CKG-gated wave may run in parallel with AD1-AD5); Plugin joins AD1/AD3
artifacts in a post-CKG completion package.

## Completion Definition

- One space-architecture artifact (charters + DAG) consumed by gates in
  every repo; Dashboard zero-dependency asserted.
- Every cross-repo interface charter-mapped; the placement decision
  register delivered with per-item user decisions recorded.
- Layer contracts + blocking direction lints live in Alembic and Agent;
  Dashboard conventions contract live.
- Side-effect doctrine adopted, linted, and the census moved from ~30% to
  the AD0-agreed floor; blessed singletons enumerated; zero unmanaged
  module-scope mutable state; listener-leak tests green.
- AD5 upgrades executed with measurements (or profile-closed); healthy
  areas registered.
- Isolation proof per repo; no-undeclared-effects tests on every public
  entrypoint family.
- All gates green, census deltas reviewed, archived.

## Validation Requirements

Per demand: the owning repos' full check pipelines plus each new gate
(DAG, direction, doctrine) with a demonstrated failure; AD4/AD5 carry
before/after censuses and measurements; AD6 carries per-repo isolation
evidence and effect-test logs; AD7 runs the space matrix and Wakeflow
verification.

## Stop Conditions

- Any step would require editing AlembicPlugin before CKG completes.
- A refactor would change public behavior or API shape (this sequence is
  structure/lifecycle only) — pending decision.
- A capability move would be implemented without its per-item user
  decision.
- Any existing gate or census ratchet (coverage floors, boundary counts)
  would be weakened or grow.
- An AD5 upgrade lacks its before/after measurement or fails its
  profile gate.
- Prose-only evidence.

## Decisions And Open Items

Inherited: write-strict/read-tolerant; Plugin hands-off until CKG;
releases user-directed; IC rulings (ratchet coverage floors protect AD
refactors).

Resolved by user confirmation on 2026-06-12 (all four AD0 gates adopted):

- Side-effect doctrine is a standing rule: no import-time work; all
  effects behind injected, disposable boundaries; mandatory listener
  disposal; module-scope mutable state only inside managed lifecycles;
  blessed singletons enumerated in an exhaustive whitelist.
- AD5 foundational upgrade list confirmed as proposed (prepared-statement
  cache, AST worker pool strictly profile-gated, provider-aware embedding
  concurrency, signal backpressure, realtime contract documentation).
- Independence definition confirmed: per-repo isolation proven via the
  existing staging tooling (build/test/pack); `file:` links stay for
  development.
- SD-1 phase 2 evaluation relocated from IC6 into AD2's systematic
  placement pass; the IC documents carry the relocation pointer.

For intake: AD3/AD4 interleaving; the doctrine compliance floor number;
the AD2 charter-confirmation session format.
