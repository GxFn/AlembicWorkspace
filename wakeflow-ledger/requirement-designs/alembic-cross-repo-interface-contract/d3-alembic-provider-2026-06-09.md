# Alembic HTTP, Runtime, And Event Provider Contracts Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d3-alembic-provider-2026-06-09`
Sequence Order: 4
Maintainer: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Make `Alembic` the checked provider for REST, runtime, job, and event contracts
consumed by Dashboard and Plugin.

## Completion Definition

- Active `/api/v1` consumer routes have OpenAPI or equivalent checked schema
  coverage.
- SSE, Socket.io, and job lifecycle events have an event manifest or typed
  event registry with replayable fixtures.
- Provider fixtures cover success, failure, partial, cancellation, and
  unavailable-runtime cases where routes/events support them.
- Public contracts do not leak internal stores or implementation-only fields.
- Alembic route/schema/event tests and repo checks pass.
- Existing Alembic API/runtime/event behavior remains available through the
  cleaned provider contracts.

## Stage Plan

1. Read accepted D0/D1 Alembic provider rows and D2 Core DTO evidence.
2. Align route schemas and OpenAPI coverage for active consumer paths.
3. Create or tighten event manifest/typed registry for SSE, Socket, and jobs.
4. Generate or maintain provider fixtures for Dashboard and Plugin consumers.
5. Run route, schema, event, daemon/job checks required by the repo.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d3-alembic-provider-p1` |
| Target window | `Alembic` |
| Target task | `alembic-interface-contract-d3-alembic-provider-t1` |
| Target summary | Read state root and Alembic AGENTS, update only Alembic provider contracts, and return schema/event/route evidence. |

## Boundaries And Non-Goals

- Do not let Dashboard or Plugin define backend truth.
- Do not shrink provider coverage to only the easiest success route.
- Do not keep hand-authored specs without generation or drift checks.
- Do not dispatch Dashboard/Plugin consumer cleanup until provider evidence is
  accepted.
