# Alembic Governance And Placement Decision Enactment

Status: candidate / user-requested 2026-06-13 / member 2 of the post-portfolio follow-through group / per-item user decisions / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-13
Design Key: alembic-governance-decision-enactment

## Controller Judgment

AD2 produced a placement decision register where every row is a per-item
user decision; the architecture deepening deliberately stopped there rather
than guessing. This requirement rules and enacts those rows. The keystone is
B1 — the resident MCP registry disposition — because it unblocks both the
Alembic charter wording and the 15-tool resident-vs-plugin duality. The rest
are small behavior-neutral waves: the Capability base-contract location
(B5), the service-locator floor number (B6), the three missing charter areas
(B7), the charter-wording batch (W1/W2), the Dashboard stray transports
(W2), the SD-1 phase-2 kernel-sinking evaluation (A1, candidates only), and
the codex_stop/cleanup + daemon-route contract decisions (C5/C8). Member of
the [post-portfolio follow-through group](../alembic-post-portfolio-followthrough/index.md).

## Entry Points

- Requirement design:
  [alembic-governance-decision-enactment-requirement-design-2026-06-13.md](alembic-governance-decision-enactment-requirement-design-2026-06-13.md)
- Candidate demand sequence:
  [alembic-governance-decision-enactment-demand-sequence-2026-06-13.json](alembic-governance-decision-enactment-demand-sequence-2026-06-13.json)
- Source: [AD2 placement decision register](../alembic-space-architecture-deepening/ad2-placement-decision-register-2026-06-12.md)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-gd0-register-triage-keystone-2026-06-13` | AlembicWorkspace | Present the register; collect per-item rulings, B1 keystone first; route to enactment waves. |
| 1 | `...-gd1-charter-wording-batch-2026-06-13` | AlembicCore | Apply B7 + W1 batch in one config edit with the drift test; land parked charterRefs flips. |
| 2 | `...-gd2-resident-registry-duality-2026-06-13` | Alembic | Enact B1; resolve the 15-tool duality drift-gate question; finalize charter wording. |
| 3 | `...-gd3-base-contract-locator-floor-2026-06-13` | AlembicAgent (+ Alembic) | Enact B5 (Capability base) + B6 (locator floor); tighten the layer-contract matrix. |
| 4 | `...-gd4-dashboard-strays-tool-contracts-2026-06-13` | AlembicDashboard (+ Plugin) | Enact W2 (strays) + C5/C8 (tool-contract decisions); dual-shell parity stable. |
| 5 | `...-gd5-sd1-phase2-evaluation-2026-06-13` | AlembicWorkspace — **only if A1 approved** | Evaluate Core kernel-sinking; design candidates only. |
| 6 | `...-gd6-register-closure-acceptance-2026-06-13` | AlembicWorkspace | Confirm every row closed; charter reflects reality; lints green; accept, archive. |

## Cross-Demand Boundaries

- Every row is a user decision; no placement move without its ruling.
- A1 SD-1 phase-2 produces design candidates only — no implementation here.
- Charter edits are additive wording; placement moves are
  import-direction-only with the layer-contract lints as the net; no
  behavior/API/persistence change.
- No Plugin behavior change (dual-shell parity stable); no CKG work.

## Validation Backbone

Each enactment wave runs the owning repo's full check + its
layer-contract/doctrine/drift lint with a demonstrated failure; placement
moves carry a behavior-neutrality proof; GD6 runs the space-wide lint matrix
+ Wakeflow verification.

## Stop Conditions

- A placement move would change behavior, API shape, or persistence.
- A charter edit would describe code that does not exist.
- SD-1 p2 would implement a move instead of producing candidates.
- A duality resolution would fork a third tool list or weaken a gate.
- Prose-only evidence.
