# Interface Reasonability Review Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d16-interface-reasonability-review-2026-06-10`
Sequence Order: 17
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.
Design Basis: [post-d14-interface-governance-real-code-analysis-2026-06-10.md](post-d14-interface-governance-real-code-analysis-2026-06-10.md)

## Goal

Judge whether the current interfaces are reasonable after D8-D14, and decide
which interfaces should be kept, clarified, split, merged, moved, rewritten, or
deleted in future work.

This demand must be concrete enough to feed D19-D32. A decision is incomplete
if it does not name the owner, consumer, state effect, field/content issue,
validation path, and whether product implementation, deletion proof, or no
change should follow.

## Completion Definition

- Every reviewed interface has a reasonability decision: `keep`, `clarify`,
  `split`, `merge`, `move-owner`, `rewrite-content`, `restrict-diagnostics`,
  `delete-after-proof`, or `blocked-pending-decision`.
- Each decision names the user/system scenario, current consumer, current
  producer, expected state change, failure path, and validation evidence.
- Overloaded interfaces are identified when one endpoint/tool/event combines
  unrelated responsibilities or mixes command, query, diagnostics, and artifact
  retrieval semantics.
- Under-specified interfaces are identified when consumers must guess capability
  from missing fields, broad optional shapes, or fallback success behavior.
- Reasonable interfaces are protected from unnecessary churn.

## Stage Plan

1. Read D15 responsibility map and D8-D14 acceptance evidence.
2. Review each high-value interface by scenario, ownership, transport, data
   shape, state transition, failure mode, and consumer need.
3. Classify reasonability and write the decision rationale with repo-relative
   code references.
4. Mark decisions requiring user/controller confirmation before any product
   rewrite.
5. Produce D17 input list for parameter and data content analysis.

## Real Code Evidence Requirements

- Judge each P01-P15 row as `keep`, `clarify`, `split`, `merge`,
  `move-owner`, `rewrite-content`, `restrict-diagnostics`,
  `delete-after-proof`, or `blocked-pending-decision`.
- Do not mark broad schemas or `unknown` fields as defects until the current
  consumer and extension-point reason are checked.
- Do mark an interface unreasonable when consumers must infer semantics from
  aliases, multiple error shapes, incidental backend objects, or hidden
  diagnostics.
- Explicitly protect reasonable dynamic boundaries such as SSE ingestion,
  provider metadata, and Agent evidence envelopes when they are projected into
  typed public surfaces.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d16-interface-reasonability-review-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d16-interface-reasonability-review-t1` |
| Target summary | Review post-D14 interfaces for reasonability and classify keep/clarify/split/merge/move/rewrite/delete decisions with evidence. |

## Boundaries And Non-Goals

- Do not treat aesthetic cleanup as a reasonability defect.
- Do not approve deletion or behavior narrowing from reasonability judgment
  alone.
- Do not create product rewrite tasks until parameter/data content and
  validation implications are understood.
