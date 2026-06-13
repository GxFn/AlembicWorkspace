# Alembic 0.3.0 Release Wave

Status: candidate / user-requested 2026-06-13 / member 1 of the post-portfolio follow-through group / publish user-triggered / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-13
Design Key: alembic-0.3.0-release-wave

## Controller Judgment

The release-coupled remainder of the portfolio, re-stated as an executable
wave. The controller staged everything (publish command, SD-5 deletion set,
`./shared` sequencing, SN4 parked pointer, R-1 overlay disposition,
version-pin tail) and delivered it as the R-package; nothing executes until
the user rules, because each item is a release decision and the set is
genuinely coupled — `./shared` must settle before SD-5 deletes wildcards,
SN4 is physically parked behind SD-5, and the runtime publish closes a
live-proven cacheless cold-start E404. Member of the
[post-portfolio follow-through group](../alembic-post-portfolio-followthrough/index.md).

## Entry Points

- Requirement design:
  [alembic-0.3.0-release-wave-requirement-design-2026-06-13.md](alembic-0.3.0-release-wave-requirement-design-2026-06-13.md)
- Candidate demand sequence:
  [alembic-0.3.0-release-wave-demand-sequence-2026-06-13.json](alembic-0.3.0-release-wave-demand-sequence-2026-06-13.json)
- Source: [R decision package](../alembic-portfolio-execution-plan/r-delivery-0.3.0-decision-package-2026-06-12.md), [0.3.0 ledger](../alembic-portfolio-execution-plan/release-wave-0.3.0-ledger-2026-06-12.md)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-rw0-release-gate-freeze-rulings-2026-06-13` | AlembicWorkspace | Fresh SD-5 re-scan; user rulings B2 (shared route) / A3 (overlay keep-delete) / C2 (pin policy); confirm ordering. |
| 1 | `...-rw1-shared-sequencing-2026-06-13` | AlembicCore | Settle `./shared` so OutputBudget + CO3 errors keep a valid import path before deletion. |
| 2 | `...-rw2-sd5-phase2-execution-2026-06-13` | AlembicCore | Delete 67/67 zero-consumer wildcard keys + keep-alive fold; expectedCounts to closeout target. |
| 3 | `...-rw3-sn4-core-source-naming-2026-06-13` | AlembicCore | Run the parked SN4 source-naming wave once SD-5 un-froze the src wildcards; rename-only. |
| 4 | `...-rw4-overlay-routes-version-pin-tail-2026-06-13` | AlembicPlugin | Enact A3 overlay ruling; close C2 pin/marketplace/negative-cache tail; dual-shell parity stable. |
| 5 | `...-rw5-publish-release-acceptance-2026-06-13` | AlembicWorkspace — **publish = user trigger** | Publish runtime, verify cold start both hosts, full release matrix, accept, archive. |

## Cross-Demand Boundaries

- Publishes and version bumps are user-triggered; the wave stages and
  verifies, the user pushes the button.
- SD-5 deletes only the 67/67 staged zero-consumer keys; the drizzle
  exact-row stays (5 consumers).
- SN4 and the rename moves are behavior-neutral with naming lint already
  BLOCKING; every wave keeps it green.
- C2 naming is already RULED; only the version-pin/marketplace tail is in
  scope here.

## Validation Backbone

RW0 fresh re-scan; RW1/RW2 three-consumer import scans + downstream builds;
RW3 mechanical-diff audit + naming lint; RW4 dual-shell parity; RW5 publish
verification + full release matrix + Wakeflow verification. Each new/changed
gate carries a demonstrated failure.

## Stop Conditions

- A "zero-consumer" key shows a live consumer on the fresh re-scan.
- A deletion/rename would change behavior or a public specifier outside the
  ruled set.
- A downstream build breaks.
- Publish attempted without the user trigger.
- Prose-only evidence.
