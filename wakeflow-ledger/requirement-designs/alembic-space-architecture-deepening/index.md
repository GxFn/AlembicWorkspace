# Alembic Space Architecture Deepening

Status: candidate / user-requested 2026-06-12 / all four AD0 user gates adopted 2026-06-12 (side-effect doctrine standing rule, AD5 list as proposed, staging-tooling independence definition, SD-1 evaluation relocated IC6→AD2) / cross-repo scope, Plugin participation post-CKG / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-space-architecture-deepening

## Controller Judgment

The user requested the next layer above IC: a global-view pass over the
space's architecture relations and inter-repo dependency hierarchy,
systematic functional partitioning per repo with interface confirmation,
internal layering for every repo, deep decoupling and isolation,
foundational-layer upgrades, and provably side-effect-free
inflow/outflow boundaries. A two-agent scan over the post-completion
space found: a healthy but habit-only dependency DAG (no shared
allowed-edge rule, no Dashboard zero-dependency gate), no per-repo
functional charters, layer contracts only in Core, ~30% boundary-purity
compliance (47 direct Logger calls, 53 direct pathGuard imports, 47+
service-locator sites, unmanaged module-scope state, undisposed
listeners, import-time work), and a stable foundational layer with four
bounded upgrade candidates (prepared-statement cache, profile-gated AST
worker pool, embedding concurrency tuning, signal backpressure) plus an
undocumented realtime delivery contract.

Eight demands AD0-AD7. Structure/lifecycle only — no public behavior or
API-shape changes; capability moves are decision-register outputs needing
per-item user confirmation; AD5 executes only the audit-grounded,
AD0-confirmed list.

## Entry Points

- Findings evidence base:
  [architecture-deepening-findings-2026-06-12.md](architecture-deepening-findings-2026-06-12.md)
- Requirement design:
  [alembic-space-architecture-deepening-requirement-design-2026-06-12.md](alembic-space-architecture-deepening-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-space-architecture-deepening-demand-sequence-2026-06-12.json](alembic-space-architecture-deepening-demand-sequence-2026-06-12.json)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-ad0-architecture-fact-freeze-doctrine-gates-2026-06-12` | AlembicWorkspace | Census re-freeze; execute within the four adopted gates (doctrine artifact + whitelist draft, AD5 measurement plan, isolation-proof commands, relocation pointers); charter drafts. |
| 1 | `...-ad1-space-dependency-dag-codification-2026-06-12` | AlembicCore (+ Alembic, Agent, Dashboard) | Space-architecture artifact + machine-readable allowed-edge config consumed by every repo's gates; Dashboard zero-dependency gate. |
| 2 | `...-ad2-functional-charters-interface-confirmation-2026-06-12` | AlembicWorkspace | Five confirmed charters; every cross-repo interface charter-mapped; placement decision register (absorbs SD-1/SD-6/R-1/SD-4 questions). |
| 3 | `...-ad3-internal-layer-contracts-everywhere-2026-06-12` | Alembic (+ Agent, Dashboard) | Core's contract+direction-lint pattern replicated to Alembic and Agent; Dashboard conventions contract. |
| 4 | `...-ad4-decoupling-isolation-side-effect-doctrine-2026-06-12` | Alembic (+ Core, Agent) | Blessed singletons, locator retirement, managed state lifecycles, no import-time work, listener disposal, doctrine lints. |
| 5 | `...-ad5-foundational-layer-upgrades-2026-06-12` | AlembicCore (+ Agent) | Confirmed base-layer upgrades with measurements; healthy-area register. |
| 6 | `...-ad6-independence-pure-boundary-proof-2026-06-12` | AlembicCore (+ all) | Per-repo isolation proof; declared-effects tests on every public entrypoint family; charter completeness. |
| 7 | `...-ad7-space-architecture-acceptance-archive-2026-06-12` | AlembicWorkspace | Space gate matrix, census deltas, decision register to the user, acceptance, archive. |

## Cross-Demand Boundaries

- IC owns the wire-level seams (types, error registry, tool duality, DCR
  residue, `./tools`, SD-5 phase 2, Dashboard contract gates, Plugin
  vendor wave); AD consumes IC outputs and starts after IC0-IC4 at the
  recommended intake position (IC5's CKG-gated wave may run in parallel).
- Proposed relocation pending intake confirmation: SD-1 phase 2
  evaluation moves from IC6 into AD2's systematic placement pass.
- AlembicPlugin joins AD1/AD3 charters and gates only after CKG
  completes (owner + trigger recorded in AD1).
- Coverage ratchet floors (IC ruling) are the regression net for every AD
  refactor; version bumps and releases stay user-directed.
- Portfolio plan note (2026-06-12): per
  [the portfolio execution plan](../alembic-portfolio-execution-plan/index.md),
  AD0's baseline work merges into P0; AD1-AD7 run as Phase 2 after the
  P1 trains, window-interleaved with the P3 Plugin train at controller
  discretion; AD3 outputs unlock SN0.

## Validation Backbone

Per demand: the owning repos' full check pipelines plus each new gate
(allowed-edge, direction, doctrine) with a demonstrated failure; AD4/AD5
carry before/after censuses and measurements; AD6 carries isolation and
effect-test evidence; AD7 runs the space matrix and Wakeflow
verification.

## Stop Conditions

- Any step would require editing AlembicPlugin before CKG completes.
- A refactor would change public behavior or API shape.
- A capability move would be implemented without its per-item user
  decision.
- Any existing gate or census ratchet would be weakened or grow.
- An AD5 upgrade lacks its measurement or fails its profile gate.
- Prose-only evidence.
