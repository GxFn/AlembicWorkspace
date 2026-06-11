# AlembicDashboard Consumer Legacy Rewrite Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d13-dashboard-consumer-legacy-rewrite-2026-06-10`
Sequence Order: 14
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Rewrite remaining Dashboard API client, event consumer, socket, and view-model
legacy interface logic onto accepted Alembic provider fixtures and explicit
capability discovery.

## Completion Definition

- Dashboard adapters consume checked provider schemas and fixtures rather than
  guessing capability from missing fields or local fallback success.
- View models remain presentation-only and do not become backend source of
  truth.
- Loading, empty, error, partial, unavailable, permission, and stale-data states
  are preserved and tested where the current UI supports them.
- Old DTO normalizers, defensive field bags, and duplicated backend contracts
  are removed or quarantined after replacement evidence.
- Existing user-visible Dashboard workflows remain available; visual or
  behavior regressions are not accepted as cleanup.

## Stage Plan

1. Read D1, D6, D8, D9, and D11 evidence.
2. Identify Dashboard consumer paths still using legacy DTOs, broad optional
   field reads, fallback capability guesses, or duplicated provider logic.
3. Rewrite consumers to provider fixture-driven adapters and explicit
   capability checks.
4. Verify API client tests, event/socket replay, typecheck/build, and targeted
   UI state coverage where scope requires.
5. Return consumer evidence and deletion notes for D14.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d13-dashboard-consumer-legacy-rewrite-p1` |
| Target window | `AlembicDashboard` |
| Target task | `alembic-interface-contract-d13-dashboard-consumer-legacy-rewrite-t1` |
| Target summary | Rewrite remaining Dashboard old consumer/view-model interface logic onto provider fixtures and explicit capability discovery. |

## Boundaries And Non-Goals

- Do not make Dashboard the source of truth for backend fields, events, or job
  artifact semantics.
- Do not remove UI states simply because the new provider contract is cleaner.
- Do not accept typecheck-only evidence if the affected user workflow lacks
  fixture or state coverage.
- Do not edit Alembic provider code from this demand unless explicitly paired by
  controller dispatch.
