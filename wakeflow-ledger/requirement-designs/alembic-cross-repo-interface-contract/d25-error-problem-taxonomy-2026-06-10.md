# Error Problem Taxonomy Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d25-error-problem-taxonomy-2026-06-10`
Sequence Order: 26
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Normalize failure semantics across HTTP provider routes, MCP tool outputs, Agent
results, and Dashboard consumers so each failure is machine-readable, stable,
and specific without leaking private data.

## Completion Definition

- Cross-repo error taxonomy covers invalid input, not found, conflict,
  permission denied, timeout, cancelled, unavailable, degraded, partial,
  capability mismatch, needs confirmation, provider error, host failure, and
  internal error.
- HTTP provider failures map to typed problem/failure objects with stable code,
  status, message/detail, retryability where appropriate, refs, and exposure
  class.
- MCP failures map to clean `ok=false`, stable `status`, typed `error`, and
  optional typed details or refs.
- Agent failures preserve branch semantics instead of string-only error collapse.
- Dashboard displays and routes each error class without guessing from raw
  payload shape.

## Work Items

- Compare existing Core, Alembic, Plugin, Agent, and Dashboard error enums and
  string codes.
- Create a canonical mapping table and product-window implementation slices.
- Add tests/fixtures for representative failures.
- Record exceptions that require user/controller decision.

## Real Code Evidence Requirements

- Anchor to Core runtime failure reasons, provider `problemSchema` and route
  fixtures, Plugin `CleanMcpErrorSchema` and reason codes, Agent branch error
  kinds, and Dashboard host-managed unavailable parsing.
- Create a canonical failure table that maps HTTP status/problem, MCP
  `ok=false` status/error, Agent branch, Dashboard display state, retryability,
  refs, and exposure class.
- Preserve specific states such as degraded, partial, unavailable, conflict,
  cancelled, timeout, permission denied, needs confirmation, provider error,
  and host failure.
- Replace string-only consumer-visible errors where the route/tool has a stable
  machine-readable failure branch.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d25-error-problem-taxonomy-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d25-error-problem-taxonomy-t1` |
| Target summary | Consolidate and route typed failure semantics across provider, MCP, Agent, and Dashboard surfaces. |

## Boundaries

- Do not hide failure detail that consumers need to repair or retry.
- Do not expose private provider/host internals in public error details.
- Do not reopen version/evolution strategy.
