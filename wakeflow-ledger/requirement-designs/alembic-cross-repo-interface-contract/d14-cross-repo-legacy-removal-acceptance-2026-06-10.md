# Cross-Repo Legacy Removal And Deep Acceptance Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d14-cross-repo-legacy-removal-acceptance-2026-06-10`
Sequence Order: 15
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Accept the D8-D13 deep optimization sequence by proving old interface logic was
rewritten, eligible duplicates were removed, preserved functionality still
works, and remaining compatibility is explicitly justified.

## Completion Definition

- Every D8 candidate is closed as rewritten, already solved, intentionally kept
  with owner/cleanup blocker, or blocked with raw evidence and next owner.
- Deletions have no-consumer proof, replacement entrypoints, import scans, and
  representative validation.
- Cross-repo validation covers Core exports, Agent runtime/tool branches,
  Alembic CLI/daemon/API/event/job paths, Plugin MCP/host/resident paths, and
  Dashboard API/event/view-model consumers.
- Representative success and non-success scenarios are covered, including
  partial, unavailable, permission/confirmation, timeout/cancellation, provider
  error, artifact/detailRef, and diagnostics-only contexts where applicable.
- Real runtime smoke and representative MCP sampling are used where feasible;
  Test is used only if product self-validation cannot safely observe the real
  scenario.
- No thin implementation, docs-only closure, static mock, hidden behavior
  deletion, or feature reduction can close this demand.

## Stage Plan

1. Build the controller review pack for D8-D13.
2. Pull raw evidence from product commits, tests, runtime smokes, MCP samples,
   fixture replays, import scans, and deletion scans.
3. Run or review cross-repo drift gates and representative end-to-end checks.
4. Create a Test card only for real runtime observation that controller/product
   windows cannot safely reproduce.
5. Accept, rework, block, or route remaining TODOs with explicit evidence.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d14-cross-repo-legacy-removal-acceptance-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d14-cross-repo-legacy-removal-acceptance-t1` |
| Target summary | Review D8-D13 raw evidence, prove old interface logic convergence/removal, run final cross-repo acceptance, and route remaining blockers. |

## Boundaries And Non-Goals

- Do not accept target summaries without raw evidence.
- Do not archive the deep optimization sequence while any eligible old
  interface logic remains unclassified or unvalidated.
- Do not send known product defects to Test for rediscovery.
- Do not turn diagnostic metadata, status tables, or generated reports into
  acceptance without runtime or code-path evidence.
