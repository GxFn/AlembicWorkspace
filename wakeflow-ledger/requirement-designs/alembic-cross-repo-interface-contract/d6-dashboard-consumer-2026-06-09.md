# AlembicDashboard Consumer Contract And View-Model Cleanup Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d6-dashboard-consumer-2026-06-09`
Sequence Order: 7
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Align Dashboard API client, event consumers, and view-model adapters with
accepted Alembic provider contracts.

## Completion Definition

- Dashboard consumes checked provider schemas/fixtures instead of frontend-only
  backend assumptions.
- Frontend view-model types are explicit presentation contracts, not backend
  source of truth.
- API and event consumers replay Alembic provider fixtures.
- Loading, empty, error, partial, unavailable, and unknown diagnostic-field
  states are handled intentionally.
- Dashboard checks, contract tests, typecheck/build, and browser checks when UI
  behavior changes pass.
- Existing Dashboard user-visible behavior remains available after client and
  view-model cleanup.

## Stage Plan

1. Read accepted D3 provider schemas, event registry, and fixtures.
2. Align API client and normalization with provider contracts.
3. Isolate presentation-only view-model adapters.
4. Add event replay and contract tests.
5. Verify UI behavior only where visible behavior changes.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d6-dashboard-consumer-p1` |
| Target window | `AlembicDashboard` |
| Target task | `alembic-interface-contract-d6-dashboard-consumer-t1` |
| Target summary | Read state root and Dashboard AGENTS, update only Dashboard consumer/view-model contracts, and return tests and UI evidence where needed. |

## Boundaries And Non-Goals

- Do not make Dashboard types backend truth.
- Do not add static mocks as completion.
- Do not remove or hide existing UI behavior merely to simplify the contract.
- Do not implement backend persistence, AI decisions, or tool execution in
  Dashboard.
