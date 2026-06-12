# Alembic Space Interface Cleansing Requirement Design

Status: candidate / user-requested 2026-06-12 / cross-repo scope with CKG-gated Plugin wave / needs controller intake
Date: 2026-06-12
Design Key: alembic-space-interface-cleansing
Primary Windows: AlembicCore, Alembic, AlembicAgent, AlembicDashboard (per demand); AlembicPlugin only in the CKG-gated wave
Validation Surface: AlembicWorkspace controller; Test for real cross-repo scenario evidence when assigned

## Problem

The four repo-internal hardening sequences (RC, CO, AO, AG) each cleaned
their own house and published their own contracts. What remains is exactly
the between-repos layer (evidence:
[space-seam-findings-2026-06-12.md](space-seam-findings-2026-06-12.md)):

- Two hand-maintained MCP tool lists share 15 tool names with 5 already
  diverged schemas, and the resident/main surfaces still carry DCR-deleted
  capabilities (`alembic_enrich_candidates`, `alembic_wiki`,
  `POST /candidates/enrich`, Dashboard enrich method).
- Dashboard is aligned with the HTTP provider contract by hand: zero
  generated types, zero drift check, a ~60-field hand-copied
  KnowledgeEntry.
- The same wire concepts are defined four times (knowledge entry/lifecycle,
  problem envelope ×4 shapes, job kinds with no authoritative source at
  all).
- Error taxonomies are per-repo with no cross-repo registry.
- The closeouts registered a queue of space-level waves nobody owns yet:
  SD-5 phase 2 (98→31, release 0.3.0), Plugin vendor refresh (16 commits
  behind) and 37 keep-alive migrations, panorama layer-inversion repair,
  taxonomy facade promotion, SD-1 phase 2 evaluation, coverage enforcement
  pending user, `./tools` retirement waiting on a 24-file Alembic
  migration that is ready today.

## Goal

One coherent interface space:

1. Every shared wire concept has exactly one authoritative definition and
   every other surface provably derives from it (import, generated
   artifact, or drift-gated copy — the RC5 drift-gate pattern is the
   precedent).
2. Dashboard↔HTTP alignment is gated, not hand-trusted.
3. One cross-repo error/problem registry with per-repo adoption mappings.
4. The MCP tool duality is resolved: one definition source or a documented,
   gated intentional divergence per tool; DCR residue deleted or owned.
5. `./tools` is retired after the real downstream migration (closing the
   AG residual).
6. The registered space waves are executed in order: the non-Plugin set
   now; the Plugin-coupled set (SD-5 phase 2, vendor refresh, keep-alive
   migrations, tool-surface resolution) after CKG completes; SD-1 phase 2
   evaluated last as a decision gate.

## Non-goals

- No new product features; no behavior changes outside confirmed lists.
- No AlembicPlugin edits before CKG completion (IC5+ gate); no edits to
  CKG-owned surfaces (staged SOP, bootstrap gates, Codex tool catalog)
  beyond consuming CKG4's outcome.
- No coverage uplift implementation inside this sequence — IC0 carries the
  pending user decision and routes it (policy or separate demand).
- SD-1 phase 2 is not in IC at all: its evaluation was relocated to the
  architecture-deepening demand AD2 (user-confirmed 2026-06-12).
- No version bumps or npm publication without explicit user direction;
  SD-5 phase 2 prepares the 0.3.0 release wave but the release itself is
  user-triggered.

## Candidate Demand Sequence

### IC0 - Space Fact Freeze And Rulings (AlembicWorkspace)

- re-freeze all seam counts (S1-S8); verify glossary locations and the
  actual AO1 problem-boundary mechanism;
- execute within the four user rulings recorded 2026-06-12 (see Decisions):
  run the DCR-residue consumer scans and produce the per-surface
  delete/stop verdicts under the default-delete posture; measure missing
  coverage baselines (Agent) and fix the per-repo ratchet values; freeze
  the 24-file `./tools` migration list; specify the Dashboard
  type-generation artifact and gate placement;
- consolidate the registered waves into the IC plan with owners and
  release alignment (0.3.0 contents list).

### IC1 - Wire-Type Single-Sourcing (AlembicCore producer; Alembic, AlembicAgent, AlembicDashboard consumers)

- one authoritative definition each for knowledge entry/lifecycle wire
  shapes, problem/error envelope, daemon job kinds (new canonical enum in
  Core), candidate status enums;
- consumers import where a package edge exists (Alembic, Agent); Dashboard
  receives a generated types artifact with a drift gate (RC5 pattern) —
  no more hand-copied 60-field types;
- per-surface negative tests: a drifted copy fails the gate.

### IC2 - Dashboard↔Contract Alignment Gate And DCR Residue Closure (Alembic + AlembicDashboard)

- a contract-coverage check binding Dashboard `api.ts` to
  `provider-contracts.ts` (path+method coverage both directions, wired
  into both repos' checks with a demonstrated failure);
- execute the IC0 DCR ruling: delete or own
  `alembic_enrich_candidates`/`alembic_wiki`/`POST /candidates/enrich`/
  Dashboard enrich method, with the DCR-style proof set (route-negative,
  tool-list, i18n/help sweep).

### IC3 - ./tools Downstream Migration And Retirement (Alembic + AlembicAgent)

- migrate the ~24 Alembic consumer files onto stable Agent facades;
- retire `./tools` under the Agent boundary gates (exact-export list
  update, signature smoke, validation-floor snapshot, demonstrated gate
  failures); downstream Alembic full check green;
- closes the AG residual with the evidence AG5 required.

### IC4 - Error Registry Unification And Core Registered Repairs (AlembicCore + Alembic + AlembicAgent)

- one cross-repo error/problem registry artifact (Core-owned, script-
  readable) mapping: Core diagnostic codes + error classes, Alembic HTTP
  problem mapping, Agent classifier categories; adoption proof per repo;
  Plugin mapping deferred to IC5;
- execute `CO2-PANORAMA-RUNNER-INVERSION` repair (remove the allowlisted
  exact-edge exception);
- prepare `CO3-TAXONOMY-FACADE-PROMOTION` (export-surface change staged
  for the 0.3.0 wave, not released here).

### IC5 - CKG-Gated Plugin Reconciliation Wave (AlembicCore + AlembicPlugin; gate: CKG complete)

- Plugin vendor submodule refresh onto current Core; file:-link and
  keep-alive review;
- migrate the 37 frozen keep-alive specifiers (and the 19 allowlisted
  transitional imports) onto stable facades; fold the 7 zero-usage
  allowlist rows; fix the consumer-scanner multi-line blind spot;
- SD-5 phase 2: delete the 67 deprecation-marked exports, expectedCounts
  98→31, closeout report shows candidates 0 — staged as the 0.3.0 release
  wave (release itself user-triggered);
- tool-surface duality resolution with CKG4's outcome: one definition
  source for the 15 shared tools or per-tool documented intentional
  divergence with a drift gate; Plugin error-taxonomy mapped into the IC4
  registry.

### IC6 - Space Final Acceptance (AlembicWorkspace)

- SD-1 phase 2 evaluation was relocated to the architecture-deepening
  demand (AD2 systematic placement pass; user-confirmed 2026-06-12) —
  IC6 only verifies the relocation pointer;
- space-wide final gate matrix (all five repos' checks + cross-repo drift
  and alignment gates + Wakeflow verification), census deltas against IC0,
  acceptance and archive; assemble the 0.3.0 release-wave package list for
  the user's release decision.

## Producer/Consumer Order

IC0 → IC1 → IC2/IC3 (parallel-eligible: disjoint repos per package, at
controller discretion) → IC4 → [CKG completion gate] → IC5 → IC6.
IC1 is the producer for IC2 (types feed the alignment gate). Nothing
before IC5 touches AlembicPlugin.

## Completion Definition

- Every S1-S8 seam is closed or explicitly owned: single-sourced wire
  types with gates, Dashboard alignment gated, one error registry with
  four adoption mappings, tool duality resolved per tool, DCR residue
  ruled and executed, `./tools` retired, SD-5 phase 2 done (98→31),
  Plugin vendor current with keep-alives migrated, panorama inversion
  repaired, taxonomy facade promotion staged, SD-1 phase 2 decision
  recorded, coverage policy decided and routed.
- All five repos' checks plus the new cross-repo gates green; space
  census reviewed; archived. The 0.3.0 release package list delivered to
  the user (release execution stays user-directed).

## Validation Requirements

Per demand: the owning repos' full check pipelines plus every new
cross-repo gate with a demonstrated failure; IC2/IC3/IC5 include
downstream builds of all affected consumers; IC5 includes representative
Plugin MCP smoke after vendor refresh; IC6 runs the space-wide matrix and
Wakeflow verification. Real-scenario Test assignment only if a cross-repo
runtime question cannot be answered by repo gates.

## Stop Conditions

- Any pre-IC5 step would require editing AlembicPlugin — stop, defer to
  IC5.
- A deletion candidate (DCR residue, `./tools`, SD-5 exports) shows a live
  consumer outside the frozen lists — stop that item, record, re-rule.
- A wire-type unification would change runtime behavior (not just type
  source) — pending decision.
- Any boundary gate from RC/CO/AO/AG would be weakened; any census count
  (transitional, wildcard, escape-hatch, core-import baseline) would grow.
- CKG completes with a tool-surface shape that conflicts with the IC5 plan
  — reconcile at controller level before IC5 dispatch.
- Prose-only evidence.

## Decisions And Open Items

Inherited standing decisions: write-strict/read-tolerant posture; Plugin
hands-off until CKG completes; version bumps and releases user-directed.

Resolved by user confirmation on 2026-06-12 (all four IC0 gates):

- DCR residue: **default delete** — IC0 runs the consumer scans; scan-empty
  surfaces (resident `alembic_enrich_candidates`/`alembic_wiki`, main-repo
  `POST /candidates/enrich`, Dashboard enrich api method) are deleted to
  the DCR proof standard (route-negative, tool-list, help/i18n sweep); any
  surface with a real scanned consumer stops and goes to the
  keep-with-owner register instead.
- Coverage enforcement: **ratchet floors** — each repo's blocking coverage
  thresholds are set at its current measured values (only-up; Core
  45.50/38.06/49.74/45.95, Alembic whole-library 50.85/43.85/60.13/50.83,
  Agent measured at IC time), wired with demonstrated failures. No global
  uplift demand; AO4's scoped 81% floor stays.
- `./tools` retirement: **authorized** — IC3 proceeds (24-file Alembic
  migration + retirement under the Agent boundary gates).
- Dashboard type sourcing: **generated artifact + drift gate** — types
  generated from Core wire types, drift checks wired into both repos'
  pipelines (RC5 drift-gate pattern); Dashboard keeps its zero-package-
  dependency architecture.

Remaining for controller intake: IC2/IC3 parallelization; facade-promotion
staging timing (recommended: stage in IC4, ship in the user-triggered
0.3.0 release together with SD-5 phase 2).
