# Diagnostics Refs Observability Split Wakeflow Demand

Design Key: `alembic-cross-repo-interface-contract-2026-06-09`
Demand Key: `alembic-interface-contract-d27-diagnostics-refs-observability-split-2026-06-10`
Sequence Order: 28
Maintainer: AlembicWorkspace
Primary Window: AlembicWorkspace
Document Role: Wakeflow demand definition
State Authority: a future Wakeflow state root under `.workspace-active/workspace/current/`; this document is not a dispatch packet.

## Goal

Make ordinary output clean while preserving complete evidence by routing
diagnostics, logs, traces, large reports, snapshots, and raw artifacts through
stable `meta`, `detailRefs`, `artifactRefs`, diagnostic routes, or logs.

## Completion Definition

- Every diagnostic field is classified as ordinary-output-needed,
  meta-summary, detailRef, artifactRef, diagnostic-route, log-only, or private.
- Ref objects use consistent fields: id/ref, kind, summary/label, uri, mimeType,
  size, requiredForCompletion, and exposure class where needed.
- Observability keys use stable semantic names for project, route, tool, job,
  provider, operation, duration, status, source, and error class.
- Dashboard can still show useful diagnostics without receiving large or private
  internal payloads by default.
- MCP and HTTP responses stay compact while evidence remains reachable.

## Work Items

- Audit diagnostic fields from provider, Plugin, Agent, and Dashboard.
- Normalize `detailRefs` and `artifactRefs` shapes.
- Move large/verbose fields out of ordinary output.
- Add tests that assert ordinary output does not include diagnostic-only fields.

## Real Code Evidence Requirements

- Anchor to Agent diagnostics/trust/artifact fields, provider diagnostic
  fixtures, Plugin detailRef schemas/status output, Dashboard runtime diagnostic
  `extraFields`, and process-event developer views.
- Define one ref shape for detail/artifact evidence with id/ref, kind,
  summary/label, uri, mimeType, size, requiredForCompletion, and exposure class.
- Ordinary output must retain concise repair signals while moving logs, raw
  snapshots, provider traces, large event payloads, and local runtime internals
  to refs or diagnostic routes.
- Observability keys must use stable names for project, route, tool, job,
  provider, operation, duration, status, source, and error class.

## Initial Wakeflow Task Candidate

| Field | Value |
| --- | --- |
| Task package | `alembic-interface-contract-d27-diagnostics-refs-observability-split-p1` |
| Target window | `AlembicWorkspace` |
| Target task | `alembic-interface-contract-d27-diagnostics-refs-observability-split-t1` |
| Target summary | Normalize diagnostic/ref/artifact/observability routing across HTTP, MCP, Agent, and Dashboard. |

## Boundaries

- Do not delete evidence; route it correctly.
- Do not expose private data through refs.
- Do not turn diagnostics into success gates unless a real consumer requires it.
