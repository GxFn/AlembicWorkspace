# Alembic MCP Tool Certification

Status: candidate / user-requested 2026-06-12 / all three MT0 user gates adopted 2026-06-12 (blocking budget gates, all-five-pass certification floor, per-item verdict register) / audit runs now on both surfaces, Plugin code fixes gated on CKG paused-clean (user-directed 2026-06-12) / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-mcp-tool-certification

## Controller Judgment

The user reports that despite the completed clean-output contracts
(D22/D24/D25) and the in-flight CKG tool work, Alembic MCP tools still
get misused by agents and some outputs are far too large — and asks for
a one-by-one pass over EVERY tool: connectivity, functional completeness
against design expectations, edge cases, and a guarantee that each tool
is usable and worth its place. The structural census confirms the
symptoms have structural causes: output caps are scattered hardcoded
`slice(0,N)` magic numbers with no per-tool budget, no measured
baselines, and no pagination/artifact-ref overflow route; descriptions
are not held to the tool-to-information standard; real misuse evidence
from existing transcripts has never been harvested systematically.

Five demands MT0-MT4: expectation sheets + misuse-evidence harvest +
certification harness; full connectivity/completeness sweep on both real
runtimes; a shared Core output-budget mechanism replacing magic numbers;
usage-error hardening with a regression test per harvested case; and
per-tool certification cards with value verdicts (merge/deprecate
candidates routed to a per-item user decision register — nothing deleted
here).

## Entry Points

- Findings evidence base:
  [mcp-tool-certification-findings-2026-06-12.md](mcp-tool-certification-findings-2026-06-12.md)
- Requirement design:
  [alembic-mcp-tool-certification-requirement-design-2026-06-12.md](alembic-mcp-tool-certification-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-mcp-tool-certification-demand-sequence-2026-06-12.json](alembic-mcp-tool-certification-demand-sequence-2026-06-12.json)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-mt0-inventory-expectations-harness-2026-06-12` | AlembicWorkspace (+ Test) | Freeze inventory; one expectation sheet per tool; harvest real misuse/bloat evidence; build the harness; turn the three adopted gates into harness pass/fail rules and the budget-gate wiring spec. |
| 1 | `...-mt1-connectivity-completeness-sweep-2026-06-12` | AlembicWorkspace (+ Test) | Run the harness on both real runtimes: every tool, every operation; matrix v1 with raw outputs; route findings. |
| 2 | `...-mt2-output-budget-mechanism-compaction-2026-06-12` | AlembicCore (+ Alembic) | Shared per-tool budget mechanism with honest overflow; magic-number slices replaced; oversized tools compacted; budget gate wired. |
| 3 | `...-mt3-usage-error-hardening-2026-06-12` | Alembic (+ Core) | Descriptions to the tool-to-information standard; misuse-resistant schemas; every harvested misuse case closed with a negative test. |
| 4 | `...-mt4-certification-cards-verdicts-acceptance-2026-06-12` | AlembicWorkspace (+ Test) | Full re-run; certification card per tool; verdict register to the user; Plugin post-CKG queue handover; acceptance + archive. |

## Cross-Demand Boundaries

- IC5 owns surface duality; CKG4 owns the 9 canonical source-graph
  tools (MT findings on them are handed to CKG4 via the controller while
  CKG runs); CC owns host packaging. This demand certifies per-tool
  quality and proposes verdicts only.
- Plugin hands-off nuance: invoking the committed Plugin MCP server for
  audit is allowed (CO smoke precedent); Plugin CODE fixes queue
  post-CKG with owners; resident/embedded (Alembic/Core) fixes land
  immediately.
- Consumes the existing contracts as the certification standard
  (D22/D24/D25, CKG catalog); never weakens a gate or ratchet.
- Portfolio plan note (2026-06-12): per
  [the portfolio execution plan](../alembic-portfolio-execution-plan/index.md),
  MT0's census/evidence half merges into P0 and the harness build moves
  to Train H (with MT1); MT2 rides Train A; MT3 rides Train B; the
  Plugin fix queue rides the P3 train; MT4 certification cards close per
  train.

## Validation Backbone

Harness runs archive raw MCP outputs per tool×operation (MT1/MT4);
per-fix negative tests and demonstrated gate failures (MT2/MT3); owning
repos' full checks per demand; real-project scenarios via Test per the
workspace testing rules; MT4 ends with Wakeflow verification.

## Stop Conditions

- Any Plugin code edit before CKG completes (invocation-only audit
  excepted).
- A fix would change a tool's public contract beyond the defined design
  expectation — re-rule first.
- A deletion/merge executes without its per-item user decision.
- Budget enforcement silently drops data without the honest
  truncated/overflow signal.
- Source-graph-tool findings fixed here instead of handed to CKG4.
- Prose-only evidence.
