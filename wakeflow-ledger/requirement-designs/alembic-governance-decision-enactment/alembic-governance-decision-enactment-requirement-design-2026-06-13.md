# Alembic Governance And Placement Decision Enactment Requirement Design

Status: controller intake complete (reviewed 2026-06-13) / per-item user decisions / ready for user rulings — no wave executes until the user rules
Date: 2026-06-13
Design Key: alembic-governance-decision-enactment
Primary Windows: AlembicWorkspace (charter custodian, rulings), AlembicCore (charter config, base-contract), Alembic (resident registry, locator floor), AlembicAgent (Capability base, MemoryStore), AlembicDashboard (stray transports)

## Problem

AD2 produced a placement decision register — every row a per-item user
decision the controller enacts only after the user rules. The architecture
deepening (AD1-AD7) deliberately stopped at these rows rather than guessing.
They are real governance and placement questions whose answers become small
behavior-neutral waves: where a base contract lives, what the resident MCP
registry actually is, what the service-locator floor number is, which
charter wording is missing, and which standing structural-debt triggers the
user wants to pull forward versus leave as defaults.

Source: [AD2 placement decision register](../alembic-space-architecture-deepening/ad2-placement-decision-register-2026-06-12.md),
[AD7 exit review](../alembic-space-architecture-deepening/ad7-exit-review-2026-06-12.md).

## Goal

Every open register row is ruled and enacted (or recorded as an
acknowledged standing default), the keystone unblocks dependent questions,
and the charter reflects reality:

1. **B1 resident MCP registry** disposition is ruled (bind / delete +
   re-charter / HTTP-certify) — the keystone: it unblocks the Alembic
   charter wording AND the 15-tool resident-vs-plugin duality drift-gate
   question.
2. **B5 / B6 / B7** placement questions are ruled: Capability base-contract
   location, service-locator floor number, the three Alembic charter
   coverage areas.
3. The **charter-wording batch** (B7 + W1-core + W1-dashboard + W1-plugin)
   is applied in one Core config edit with the drift test.
4. **W2** Dashboard stray transports are ruled (consolidate / bless / leave
   pinned).
5. **A1 SD-1 phase-2** kernel-sinking evaluation is ruled (approve
   evaluation wave producing design candidates only, or keep dual copies
   under the drift gate).
6. **C5 / C8** tool-contract decisions are ruled: codex_stop/cleanup
   destructive-tool sheets + visibility; daemon-route rebuild-confirmation
   parity (plugin pre-gate vs resident gate vs documented asymmetry).
7. **A2 / A4 / B3 / B4** standing triggers are acknowledged (defaults) or
   pulled forward as their own demands.

## Non-goals

- No placement MOVE without its per-item user ruling — this requirement
  produces rulings and the small enactment waves, not silent refactors.
- A1 SD-1 phase-2 produces design candidates only — no kernel sinking
  implemented here.
- No behavior or API change; charter edits are additive wording; placement
  moves are import-direction-only with the layer-contract lints as the net.
- No Plugin behavior change (dual-shell parity stable); no CKG work.

## Candidate Demand Sequence

### GD0 - Register Triage And Keystone Ruling (AlembicWorkspace)

- present the consolidated register with the controller's options per row;
- USER RULINGS, keystone first: B1 resident registry (a bind / b delete +
  re-charter / c HTTP-certify the 19 rows); then B5 (base-contract
  location), B6 (locator floor a/b/c), B7 (three charter areas), W2
  (Dashboard strays), A1 (SD-1 p2 evaluation yes/no), C5/C8 (tool-contract
  decisions), and acknowledgements A2/A4/B3/B4;
- route each ruled row to its enactment wave; record acknowledged defaults
  in the register with their standing triggers.

### GD1 - Charter-Wording Batch (AlembicCore + AlembicWorkspace charter custodian)

- apply B7 (three Alembic areas: lib/tools host adapters, lib/governance,
  lib/workflows) + W1-core (contract-types surface) + W1-dashboard (state
  realized by hooks+theme+i18n) + W1-plugin (R-1 overlay middleware) in one
  Core config edit with the drift test;
- charterRefs/config flips that were parked on user review land here;
  reverse-check clean (no orphan code, no empty charter line).

### GD2 - Resident Registry Enactment And 15-Tool Duality (Alembic)

- enact the B1 ruling: bind a real stdio MCP server, OR delete the registry
  and amend the charter wording to "HTTP/daemon host", OR HTTP-certify the
  19 resident rows as the contract (Train H sheets exist);
- with B1 ruled, resolve the resident-vs-plugin 15-tool duality drift-gate
  question (single definition source or documented intentional divergence);
- charter wording finalized; layer-contract lint green.

### GD3 - Placement Moves: Capability Base And Locator Floor (AlembicAgent + Alembic)

- B5: relocate the Capability base contract per the ruling (leaf area /
  tools-owned / keep blessed exception), removing the agent↔tools
  inheritance reach-up if moved; layer-contract matrix tightens;
- B6: drive the http route-locator sites to the ruled floor (zero via an
  area-by-area wave / partial target / keep + re-measure), each step
  check-green, the doctrine lint enforcing the new floor.

### GD4 - W2 Dashboard Strays And Tool-Contract Decisions (AlembicDashboard + AlembicPlugin)

- W2: consolidate the three stray transports into api.ts (behavior-
  preserving) / bless as declared seams / leave pinned, per the ruling;
- C5: codex_stop / codex_cleanup destructive-tool sheets + visibility per
  the ruling; C8: daemon-route rebuild-confirmation parity per the ruling
  (align or document the asymmetry) — dual-shell parity stable.

### GD5 - SD-1 Phase-2 Evaluation (AlembicWorkspace; only if A1 approved)

- if A1 approved: evaluate sinking the byte-identical lib kernel subset into
  Core under Core's boundary policy with a deliberate vendor refresh —
  DESIGN CANDIDATES ONLY, each needing user confirmation; no implementation;
- if A1 kept-as-dual-copies: record the standing drift-gate decision and
  close the row.

### GD6 - Register Closure And Acceptance (AlembicWorkspace)

- every register row ruled-and-enacted or acknowledged-with-trigger; the
  charter reflects reality across all five repos; layer-contract and
  doctrine lints green everywhere;
- controller acceptance from raw evidence; register archived; Wakeflow
  verification.

## Producer/Consumer Order

GD0 → GD1 (charter batch, independent) ∥ GD2 (B1 keystone, unblocks duality)
→ GD3 / GD4 (placement + contract decisions, per-window) → GD5 (SD-1 eval,
conditional) → GD6. GD2 is the keystone; GD3's B5 depends on it only if the
duality resolution touches the base contract.

## Completion Definition

- B1 ruled and enacted; the 15-tool duality resolved; B5/B6/B7 ruled and
  placement moves landed; the charter-wording batch applied with the drift
  test; W2 resolved; A1 evaluated (candidates only) or closed; C5/C8 ruled;
  A2/A4/B3/B4 acknowledged with triggers.
- Charter reflects reality in all five repos; layer-contract and doctrine
  lints green; no behavior/API change; register archived.

## Validation Requirements

Each enactment wave runs the owning repo's full check + its layer-contract /
doctrine / drift lint with a demonstrated failure; placement moves carry a
mechanical-diff / behavior-neutrality proof; GD2 adds the resident surface
evidence; GD6 runs the space-wide lint matrix + Wakeflow verification.

## Stop Conditions

- A placement move would change behavior, API shape, or persistence.
- A charter edit would describe code that does not exist (reverse-check
  fail).
- SD-1 p2 evaluation would implement a move instead of producing candidates.
- A duality resolution would fork a third tool list or weaken a gate.
- Prose-only evidence.

## Decisions And Open Items

All rows are user decisions by construction. Controller advisory: B1 first
(it unblocks two downstream questions); the charter-wording batch and the
acknowledgement defaults (A2/A4/B3/B4) are low-cost and can be ruled in the
same GD0 pass. For intake: whether GD5 SD-1 evaluation is in this
requirement or split as its own demand if approved.
